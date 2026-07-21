import {
  Menu,
  Notice,
  Plugin,
  TFile,
  TFolder,
  normalizePath,
  requestUrl,
  type MarkdownPostProcessorContext,
  type WorkspaceLeaf
} from "obsidian";
import {
  createDefaultDocument,
  markdownToDocument,
  nodePlainText,
  syncNodeLegacyFields,
  parseDocument,
  serializeDocument,
  type MindMapDocument,
  type MindMapNode,
  type MindMapSubmap
} from "./model";
import {
  DEFAULT_SETTINGS,
  MindMapStudioSettingTab,
  settingsToAppearance,
  type MindMapStudioSettings
} from "./settings";
import { renderStaticMindMap, renderStaticSource } from "./static-render";
import { MindMapStudioView, VIEW_TYPE_MINDMAP_STUDIO } from "./view";

export const MINDMAP_EXTENSION = "mindmap";
const LEGACY_SUFFIX = ".smm.md";

export default class MindMapStudioPlugin extends Plugin {
  settings: MindMapStudioSettings = DEFAULT_SETTINGS;
  private legacyMigrationPath: string | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_MINDMAP_STUDIO, (leaf) => new MindMapStudioView(leaf, this));
    // A dedicated extension is the key to reliable reopening: Obsidian routes every
    // .mindmap file directly to the editable TextFileView instead of Markdown view.
    this.registerExtensions([MINDMAP_EXTENSION], VIEW_TYPE_MINDMAP_STUDIO);
    this.addSettingTab(new MindMapStudioSettingTab(this.app, this));

    this.addRibbonIcon("brain-circuit", "新建思维导图", () => void this.createMindMap());

    this.addCommand({
      id: "new-mind-map",
      name: "新建思维导图",
      callback: () => void this.createMindMap()
    });
    this.addCommand({
      id: "new-mind-map-and-embed",
      name: "新建思维导图并插入当前笔记",
      callback: () => void this.createMindMap({ insertIntoCurrent: true })
    });
    this.addCommand({
      id: "convert-current-markdown",
      name: "将当前 Markdown 转换为思维导图",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const available = Boolean(file && file.extension === "md" && !this.isLegacyMindMapFile(file));
        if (!checking && available && file) void this.convertMarkdownFile(file);
        return available;
      }
    });
    this.addCommand({
      id: "migrate-legacy-mind-map",
      name: "将当前旧版脑图转换为 .mindmap",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const available = Boolean(file && this.isLegacyMindMapFile(file));
        if (!checking && available && file) void this.migrateLegacyFile(file, true);
        return available;
      }
    });
    this.addCommand({
      id: "open-current-as-mind-map",
      name: "以可编辑思维导图视图重新打开",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const available = Boolean(file && this.isMindMapFile(file));
        if (!checking && available && file) void this.openAsMindMap(file, this.app.workspace.activeLeaf ?? undefined);
        return available;
      }
    });

    this.registerEvent(this.app.workspace.on("file-menu", (menu: Menu, file) => {
      if (file instanceof TFolder) {
        menu.addItem((item) => item
          .setTitle("新建思维导图")
          .setIcon("brain-circuit")
          .onClick(() => void this.createMindMap({ folder: file.path })));
        return;
      }
      if (!(file instanceof TFile)) return;

      if (this.isMindMapFile(file)) {
        menu.addSeparator();
        menu.addItem((item) => item
          .setTitle("以可编辑思维导图打开")
          .setIcon("brain-circuit")
          .onClick(() => void this.openAsMindMap(file)));
      } else if (this.isLegacyMindMapFile(file)) {
        menu.addSeparator();
        menu.addItem((item) => item
          .setTitle("转换为新的 .mindmap 文件")
          .setIcon("replace")
          .onClick(() => void this.migrateLegacyFile(file, true)));
      }
    }));

    // Existing users may still have the old Markdown-backed files. When enabled,
    // opening one creates/opens a safe .mindmap copy and leaves the original intact.
    this.registerEvent(this.app.workspace.on("file-open", (file) => {
      if (!file || !this.settings.redirectLegacyFiles || !this.isLegacyMindMapFile(file)) return;
      if (this.legacyMigrationPath === file.path) return;
      window.setTimeout(() => void this.migrateLegacyFile(file, true), 0);
    }));

    this.registerMarkdownCodeBlockProcessor("mindmap", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownCodeBlockProcessor("mindmap-json", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    // Read-only compatibility for notes that already contain old fenced blocks.
    this.registerMarkdownCodeBlockProcessor("smm", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownCodeBlockProcessor("smm-json", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownPostProcessor((element, context) => void this.processMindMapEmbeds(element, context));
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO);
  }

  async loadSettings(): Promise<void> {
    let loaded = await this.loadData() as Partial<MindMapStudioSettings> | null;
    // One-time migration after the public rename from mindmap-canvas to mindmap-studio.
    if (!loaded) {
      const oldDataPath = normalizePath(`${this.app.vault.configDir}/plugins/mindmap-canvas/data.json`);
      try {
        if (await this.app.vault.adapter.exists(oldDataPath)) {
          loaded = JSON.parse(await this.app.vault.adapter.read(oldDataPath)) as Partial<MindMapStudioSettings>;
          if (loaded) await this.saveData(loaded);
        }
      } catch (error) {
        console.warn("MindMap Studio could not migrate the old settings file", error);
      }
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
    if (loaded?.backgroundPattern === undefined && loaded?.showGrid === false) this.settings.backgroundPattern = "none";
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView) leaf.view.refreshAppearance();
    }
  }

  createConfiguredDocument(title: string): MindMapDocument {
    const document = createDefaultDocument(title);
    document.layout = this.settings.defaultLayout;
    document.theme = this.settings.defaultTheme;
    document.appearance = settingsToAppearance(this.settings);
    return document;
  }

  async getAvailablePath(preferredPath: string): Promise<string> {
    const normalized = normalizePath(preferredPath);
    if (!this.app.vault.getAbstractFileByPath(normalized)) return normalized;
    const dot = normalized.lastIndexOf(".");
    const base = dot > normalized.lastIndexOf("/") ? normalized.slice(0, dot) : normalized;
    const extension = dot > normalized.lastIndexOf("/") ? normalized.slice(dot) : "";
    let index = 2;
    while (this.app.vault.getAbstractFileByPath(`${base} ${index}${extension}`)) index += 1;
    return `${base} ${index}${extension}`;
  }

  async createMindMap(options: {
    insertIntoCurrent?: boolean;
    folder?: string;
    document?: MindMapDocument;
    title?: string;
  } = {}): Promise<TFile> {
    const activeBefore = this.app.workspace.getActiveFile();
    const folder = await this.resolveFolder(options.folder, activeBefore);
    const title = options.title ?? this.buildNewTitle();
    const filename = this.sanitizeFilename(title);
    const path = await this.getAvailablePath(normalizePath(`${folder ? `${folder}/` : ""}${filename}.${MINDMAP_EXTENSION}`));
    const document = options.document ?? this.createConfiguredDocument(title);
    const file = await this.app.vault.create(path, serializeDocument(document));

    if (options.insertIntoCurrent && activeBefore && activeBefore.extension === "md" && activeBefore.path !== file.path) {
      const embed = `\n\n![[${file.path}]]\n`;
      const current = await this.app.vault.read(activeBefore);
      await this.app.vault.modify(activeBefore, `${current.trimEnd()}${embed}`);
    }
    await this.openAsMindMap(file);
    return file;
  }

  async openAsMindMap(file: TFile, preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void> {
    const leaf = preferredLeaf ?? this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_MINDMAP_STUDIO,
      state: { file: file.path },
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
    if (focusNodeId && leaf.view instanceof MindMapStudioView) {
      window.setTimeout(() => leaf.view instanceof MindMapStudioView && leaf.view.focusNode(focusNodeId), 30);
    }
  }

  async savePastedImage(blob: Blob, suggestedName: string, sourceFile: TFile | null): Promise<string> {
    // 图片资源目录按当前脑图所在目录解析，而不是按仓库根目录解析。
    // 例如 Projects/Plan.mindmap + MindMap Assets =>
    // Projects/MindMap Assets/Plan-20260720-123456.png
    const sourceFolder = sourceFile?.parent?.path ?? "";
    const configuredFolder = normalizePath((this.settings.assetFolder || "MindMap Assets").replace(/^\/+|\/+$/g, ""));
    const folder = normalizePath([sourceFolder, configuredFolder].filter(Boolean).join("/"));
    await this.ensureFolderPath(folder);
    const now = new Date();
    const two = (value: number): string => String(value).padStart(2, "0");
    const stamp = `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
    const extension = suggestedName.split(".").at(-1)?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
    const base = this.sanitizeFilename(sourceFile?.basename ?? "mindmap");
    const preferred = normalizePath(`${folder}/${base}-${stamp}.${extension}`);
    const path = await this.getAvailablePath(preferred);
    await this.app.vault.createBinary(path, await blob.arrayBuffer());
    return path;
  }

  async uploadImageToHost(blob: Blob, suggestedName: string): Promise<string> {
    const endpoint = this.settings.imageHostEndpoint.trim();
    if (!endpoint) {
      new Notice("请先在 MindMap Studio 设置中配置图床上传地址");
      throw new Error("Image host endpoint is not configured");
    }
    let headers: Record<string, string> = {};
    if (this.settings.imageHostHeaders.trim()) {
      try {
        const parsed = JSON.parse(this.settings.imageHostHeaders) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("headers must be an object");
        headers = Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value)]));
      } catch (error) {
        new Notice("图床请求头 JSON 格式错误");
        throw error;
      }
    }
    const filename = this.sanitizeFilename(suggestedName || "mindmap-image.png");
    const mime = blob.type || "application/octet-stream";
    let body: ArrayBuffer;
    let contentType = mime;
    if (this.settings.imageHostBodyMode === "multipart") {
      const boundary = `----MindMapStudio${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      const encoder = new TextEncoder();
      const head = encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${(this.settings.imageHostFieldName || "file").replaceAll('"', "")}"; filename="${filename.replaceAll('"', "")}"\r\nContent-Type: ${mime}\r\n\r\n`);
      const file = new Uint8Array(await blob.arrayBuffer());
      const tail = encoder.encode(`\r\n--${boundary}--\r\n`);
      const combined = new Uint8Array(head.length + file.length + tail.length);
      combined.set(head, 0); combined.set(file, head.length); combined.set(tail, head.length + file.length);
      body = combined.buffer;
      contentType = `multipart/form-data; boundary=${boundary}`;
    } else {
      body = await blob.arrayBuffer();
    }
    const response = await requestUrl({
      url: endpoint,
      method: (this.settings.imageHostMethod || "POST").toUpperCase(),
      contentType,
      headers,
      body,
      throw: true
    });
    let payload: unknown;
    try { payload = response.json; } catch { payload = undefined; }
    if (!payload && response.text) {
      try { payload = JSON.parse(response.text); } catch { payload = response.text; }
    }
    const getPath = (value: unknown, path: string): unknown => path.split(".").filter(Boolean).reduce<unknown>((current, key) => current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined, value);
    const configured = this.settings.imageHostResponsePath.trim();
    const candidates = [configured, "data.url", "url", "result.url", "result.image", "image.url", "src"].filter(Boolean);
    for (const path of candidates) {
      const value = getPath(payload, path);
      if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
    }
    if (typeof payload === "string") {
      const match = payload.match(/https?:\/\/[^\s"'<>]+/i);
      if (match?.[0]) return match[0];
    }
    throw new Error("图床返回结果中没有找到图片网址");
  }

  async createSubmapFile(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap> {
    const title = (nodePlainText(node) || "子导图").trim();
    const document = this.createConfiguredDocument(title);
    document.root.content = [{ id: document.root.id + "_title", type: "text", text: title }];
    syncNodeLegacyFields(document.root);
    document.root.link = `[[${parentFile.path}]]`;
    document.title = title;
    document.navigation = {
      parentPath: parentFile.path,
      parentNodeId: node.id,
      parentTitle: parentFile.basename,
      parentNodeText: nodePlainText(node) || undefined
    };

    // 子导图不再与父文件平铺。目录结构固定为：
    // 父文件所在目录 / 资源文件夹 / 父导图文件名 / 子导图.mindmap
    const parentFolder = parentFile.parent?.path ?? "";
    const configuredAssets = normalizePath(this.settings.assetFolder || "MindMap Assets");
    const parentMapFolder = this.sanitizeFilename(parentFile.basename);
    const submapFolder = normalizePath([parentFolder, configuredAssets, parentMapFolder].filter(Boolean).join("/"));
    await this.ensureFolderPath(submapFolder);
    const path = await this.getAvailablePath(normalizePath(`${submapFolder}/${this.sanitizeFilename(title)}.${MINDMAP_EXTENSION}`));
    const file = await this.app.vault.create(path, serializeDocument(document));
    return { path: file.path, title: file.basename };
  }

  async openMindMapPath(path: string, sourcePath = "", preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void> {
    const normalized = normalizePath(path.replace(/^\[\[|\]\]$/g, ""));
    const direct = this.app.vault.getAbstractFileByPath(normalized);
    const resolved = direct instanceof TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!(resolved instanceof TFile) || !this.isMindMapFile(resolved)) {
      new Notice(`找不到子导图：${path}`);
      return;
    }
    await this.openAsMindMap(resolved, preferredLeaf, focusNodeId);
  }

  private async ensureFolderPath(folder: string): Promise<void> {
    const normalized = normalizePath(folder);
    if (!normalized || this.app.vault.getAbstractFileByPath(normalized) instanceof TFolder) return;
    const parts = normalized.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }

  async migrateLegacyFile(file: TFile, openAfter = true): Promise<TFile | null> {
    if (!this.isLegacyMindMapFile(file)) return null;
    if (this.legacyMigrationPath === file.path) return null;
    this.legacyMigrationPath = file.path;
    try {
      const source = await this.app.vault.read(file);
      const title = file.basename.replace(/\.smm$/i, "") || "思维导图";
      const document = parseDocument(source, title);
      const parentPath = file.parent?.path ?? "";
      const preferredPath = normalizePath(`${parentPath ? `${parentPath}/` : ""}${this.sanitizeFilename(title)}.${MINDMAP_EXTENSION}`);
      const existing = this.app.vault.getAbstractFileByPath(preferredPath);
      let target: TFile;

      if (existing instanceof TFile && this.isMindMapFile(existing)) {
        target = existing;
      } else {
        const path = existing ? await this.getAvailablePath(preferredPath) : preferredPath;
        target = await this.app.vault.create(path, serializeDocument(document));
        new Notice(`已转换为可编辑脑图：${target.path}\n原文件已保留作为备份。`, 7000);
      }

      if (openAfter) await this.openAsMindMap(target, this.app.workspace.activeLeaf ?? undefined);
      return target;
    } catch (error) {
      console.error("MindMap Studio legacy migration failed", error);
      new Notice("旧版脑图转换失败，原文件未被修改。", 6000);
      return null;
    } finally {
      this.legacyMigrationPath = null;
    }
  }

  isMindMapFile(file: TFile): boolean {
    return file.extension.toLowerCase() === MINDMAP_EXTENSION;
  }

  isLegacyMindMapFile(file: TFile): boolean {
    return file.path.toLowerCase().endsWith(LEGACY_SUFFIX);
  }

  private async convertMarkdownFile(file: TFile): Promise<void> {
    const source = await this.app.vault.read(file);
    const title = file.basename;
    const document = markdownToDocument(source, title);
    document.layout = this.settings.defaultLayout;
    document.theme = this.settings.defaultTheme;
    document.appearance = settingsToAppearance(this.settings);
    await this.createMindMap({ document, title: `${title} 脑图`, folder: file.parent?.path ?? "" });
  }

  private async resolveFolder(explicitFolder: string | undefined, activeFile: TFile | null): Promise<string> {
    const candidate = explicitFolder ?? (this.settings.defaultFolder || activeFile?.parent?.path || "");
    if (!candidate) return "";
    const normalized = normalizePath(candidate);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof TFolder) return normalized;
    await this.ensureFolderPath(normalized);
    return normalized;
  }

  private buildNewTitle(): string {
    const now = new Date();
    const two = (value: number): string => String(value).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())} ${two(now.getHours())}${two(now.getMinutes())}`;
    return `${this.settings.filePrefix} ${stamp}`.trim();
  }

  private sanitizeFilename(value: string): string {
    return value.replace(/[\\/:*?"<>|#[\]]/g, "-").replace(/\s+/g, " ").trim() || "思维导图";
  }

  private getSourceTitle(context: MarkdownPostProcessorContext): string {
    const sourceFile = this.app.vault.getAbstractFileByPath(context.sourcePath);
    return sourceFile instanceof TFile ? sourceFile.basename : "思维导图";
  }

  private async processMindMapEmbeds(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<void> {
    const embeds = Array.from(element.querySelectorAll<HTMLElement>(".internal-embed"));
    for (const embed of embeds) {
      if (embed.dataset.mmcProcessed === "true") continue;
      const rawSource = embed.getAttribute("src") ?? embed.dataset.src ?? "";
      const linkPath = rawSource.split("#")[0]?.split("|")[0]?.trim() ?? "";
      if (!linkPath.toLowerCase().endsWith(`.${MINDMAP_EXTENSION}`)) continue;
      const file = this.app.metadataCache.getFirstLinkpathDest(linkPath, context.sourcePath);
      if (!(file instanceof TFile) || !this.isMindMapFile(file)) continue;
      embed.dataset.mmcProcessed = "true";
      try {
        const source = await this.app.vault.cachedRead(file);
        const document = parseDocument(source, file.basename);
        renderStaticMindMap(embed, document, { app: this.app, file, maxHeight: this.settings.embedMaxHeight, defaultAppearance: settingsToAppearance(this.settings) });
      } catch (error) {
        console.error("MindMap Studio embed render failed", error);
        embed.empty();
        embed.createDiv({ cls: "mmc-embed-error", text: "无法加载思维导图预览" });
      }
    }
  }
}
