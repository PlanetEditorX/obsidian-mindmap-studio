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
  findNode,
  flattenNodes,
  markdownToDocument,
  nodeContentBlocks,
  nodePlainText,
  syncNodeLegacyFields,
  parseDocument,
  serializeDocument,
  type MindMapDocument,
  type MindMapImageContentBlock,
  type MindMapNode,
  type MindMapSubmap
} from "./model";
import {
  DEFAULT_SETTINGS,
  MindMapStudioSettingTab,
  createImageHostConfig,
  settingsToAppearance,
  type ImageHostChoice,
  type ImageHostConfig,
  type ImageHostUploadBatch,
  type ImageHostUploadSuccess,
  type MindMapStudioSettings
} from "./settings";
import { renderStaticMindMap, renderStaticSource } from "./static-render";
import { MindMapStudioView, VIEW_TYPE_MINDMAP_STUDIO } from "./view";
import { GlobalMindMapSearchModal, MindMapSearchIndex, type MindMapSearchResult } from "./global-search";
import { articleNumberLabel, isArticleHeading, normalizeVisibleModes, type ArticleTocEntry } from "./modes";
import type { DisplayMode } from "./model";

export const MINDMAP_EXTENSION = "mindmap";
const LEGACY_SUFFIX = ".smm.md";

export default class MindMapStudioPlugin extends Plugin {
  settings: MindMapStudioSettings = DEFAULT_SETTINGS;
  private legacyMigrationPath: string | null = null;
  private readonly autoUploadTimers = new Map<string, number>();
  private searchIndex!: MindMapSearchIndex;
  private searchIndexReady: Promise<void> = Promise.resolve();

  async onload(): Promise<void> {
    await this.loadSettings();
    const pluginDir = this.manifest.dir ?? normalizePath(`${this.app.vault.configDir}/plugins/${this.manifest.id}`);
    this.searchIndex = new MindMapSearchIndex(this.app, normalizePath(`${pluginDir}/mindmap-search-index.json`), MINDMAP_EXTENSION);
    this.searchIndexReady = this.searchIndex.initialize();

    this.registerView(VIEW_TYPE_MINDMAP_STUDIO, (leaf) => new MindMapStudioView(leaf, this));
    // A dedicated extension is the key to reliable reopening: Obsidian routes every
    // .mindmap file directly to the editable TextFileView instead of Markdown view.
    this.registerExtensions([MINDMAP_EXTENSION], VIEW_TYPE_MINDMAP_STUDIO);
    this.addSettingTab(new MindMapStudioSettingTab(this.app, this));

    this.addRibbonIcon("brain-circuit", "新建思维导图", () => void this.createMindMap());
    this.addRibbonIcon("search", "全局搜索思维导图", () => this.openGlobalSearch());

    this.addCommand({
      id: "global-search-mind-maps",
      name: "全局搜索所有思维导图",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "F" }],
      callback: () => this.openGlobalSearch()
    });
    this.addCommand({
      id: "rebuild-mind-map-search-index",
      name: "重建思维导图搜索索引",
      callback: () => void this.rebuildGlobalSearchIndex()
    });
    this.addCommand({
      id: "new-mind-map",
      name: "新建思维导图",
      callback: () => void this.createMindMap()
    });
    for (const [mode, name] of [["mindmap", "切换到导图模式"], ["outline", "切换到大纲模式"], ["article", "切换到文章模式"]] as Array<[DisplayMode, string]>) {
      this.addCommand({
        id: `switch-to-${mode}-mode`,
        name,
        checkCallback: (checking) => {
          const view = this.app.workspace.activeLeaf?.view;
          const available = view instanceof MindMapStudioView && this.settings.visibleModes.includes(mode);
          if (!checking && available && view instanceof MindMapStudioView) view.setDisplayMode(mode);
          return available;
        }
      });
    }
    this.addCommand({
      id: "toggle-mind-map-read-only",
      name: "切换导图只读 / 编辑模式",
      checkCallback: (checking) => {
        const view = this.app.workspace.activeLeaf?.view;
        const available = view instanceof MindMapStudioView;
        if (!checking && available && view instanceof MindMapStudioView) view.toggleReadOnly();
        return available;
      }
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

    this.registerEvent(this.app.vault.on("create", (file) => {
      if (file instanceof TFile && this.isMindMapFile(file)) this.searchIndex.queueFile(file, 80);
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file instanceof TFile && this.isMindMapFile(file)) this.searchIndex.queueFile(file);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (file instanceof TFile && file.extension.toLowerCase() === MINDMAP_EXTENSION) this.searchIndex.removeFile(file.path);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof TFile && this.isMindMapFile(file)) this.searchIndex.renameFile(file, oldPath);
      else if (oldPath.toLowerCase().endsWith(`.${MINDMAP_EXTENSION}`)) this.searchIndex.removeFile(oldPath);
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
    for (const timer of this.autoUploadTimers.values()) window.clearTimeout(timer);
    this.autoUploadTimers.clear();
    this.searchIndex?.destroy();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO);
  }

  openGlobalSearch(): void {
    void this.openGlobalSearchAfterIndexReady();
  }

  private async openGlobalSearchAfterIndexReady(): Promise<void> {
    await this.searchIndexReady;
    new GlobalMindMapSearchModal(
      this.app,
      this.searchIndex,
      this.settings.globalSearchMaxResults,
      (result) => this.openGlobalSearchResult(result),
      () => this.searchIndex.rebuildAll()
    ).open();
  }

  async openMapFamilySearch(file: TFile, currentDocument?: MindMapDocument): Promise<void> {
    await this.searchIndexReady;
    let familyPaths = await this.searchIndex.refreshFamily(file.path, currentDocument);
    new GlobalMindMapSearchModal(
      this.app,
      this.searchIndex,
      this.settings.globalSearchMaxResults,
      (result) => this.openGlobalSearchResult(result),
      async () => {
        const refreshed = await this.searchIndex.refreshFamily(file.path, currentDocument);
        familyPaths.clear();
        for (const path of refreshed) familyPaths.add(path);
      },
      familyPaths,
      "搜索当前导图及子导图",
      `“${file.basename}”及递归关联的全部子导图`
    ).open();
  }

  async rebuildGlobalSearchIndex(): Promise<void> {
    new Notice("正在重建思维导图搜索索引…");
    await this.searchIndex.rebuildAll();
    const status = this.searchIndex.getStatus();
    new Notice(`搜索索引已重建：${status.files} 个导图，${status.nodes} 个节点`);
  }

  getGlobalSearchIndexStatus() {
    return this.searchIndex.getStatus();
  }

  private async openGlobalSearchResult(result: MindMapSearchResult): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(result.filePath);
    if (!(file instanceof TFile) || !this.isMindMapFile(file)) {
      this.searchIndex.removeFile(result.filePath);
      new Notice(`搜索结果对应的导图已不存在：${result.filePath}`);
      return;
    }
    await this.openAsMindMap(file, undefined, result.nodeId);
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
    const hadStoredSettings = loaded !== null && loaded !== undefined;
    const raw = (loaded ?? {}) as Partial<MindMapStudioSettings> & Record<string, unknown>;
    let imageHosts: ImageHostConfig[] = Array.isArray(raw.imageHosts)
      ? raw.imageHosts.slice(0, 20).flatMap((item, index) => {
        if (!item || typeof item !== "object") return [];
        const candidate = item as Partial<ImageHostConfig>;
        const host = createImageHostConfig(index + 1);
        host.id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : host.id;
        host.name = typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim().slice(0, 120) : host.name;
        host.enabled = candidate.enabled !== false;
        host.endpoint = typeof candidate.endpoint === "string" ? candidate.endpoint.trim().slice(0, 4000) : "";
        host.method = candidate.method === "PUT" ? "PUT" : "POST";
        host.bodyMode = candidate.bodyMode === "raw" ? "raw" : "multipart";
        host.fieldName = typeof candidate.fieldName === "string" && candidate.fieldName.trim() ? candidate.fieldName.trim().slice(0, 120) : "file";
        host.headers = typeof candidate.headers === "string" ? candidate.headers.trim().slice(0, 20000) : "";
        host.responsePath = typeof candidate.responsePath === "string" ? candidate.responsePath.trim().slice(0, 500) : "data.url";
        return [host];
      })
      : [];

    // Migrate the single-host settings used by MindMap Studio 0.9.x.
    const legacyEndpoint = typeof raw.imageHostEndpoint === "string" ? raw.imageHostEndpoint.trim() : "";
    if (!imageHosts.length && legacyEndpoint) {
      const host = createImageHostConfig(1);
      host.name = "原图床";
      host.endpoint = legacyEndpoint;
      host.method = raw.imageHostMethod === "PUT" ? "PUT" : "POST";
      host.bodyMode = raw.imageHostBodyMode === "raw" ? "raw" : "multipart";
      host.fieldName = typeof raw.imageHostFieldName === "string" && raw.imageHostFieldName.trim() ? raw.imageHostFieldName.trim() : "file";
      host.headers = typeof raw.imageHostHeaders === "string" ? raw.imageHostHeaders.trim() : "";
      host.responsePath = typeof raw.imageHostResponsePath === "string" ? raw.imageHostResponsePath.trim() : "data.url";
      imageHosts = [host];
    }

    const enabledIds = new Set(imageHosts.filter((host) => host.enabled).map((host) => host.id));
    const selectedIds = Array.isArray(raw.autoUploadHostIds)
      ? raw.autoUploadHostIds.filter((id): id is string => typeof id === "string" && enabledIds.has(id))
      : [];
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...raw,
      imageHosts,
      autoUploadEnabled: raw.autoUploadEnabled === true,
      autoUploadDelaySeconds: typeof raw.autoUploadDelaySeconds === "number"
        ? Math.max(0, Math.min(300, Math.round(raw.autoUploadDelaySeconds)))
        : DEFAULT_SETTINGS.autoUploadDelaySeconds,
      autoUploadHostIds: selectedIds,
      deleteLocalAfterUpload: raw.deleteLocalAfterUpload !== false,
      imageFailoverEnabled: raw.imageFailoverEnabled !== false,
      imageFailoverTimeoutSeconds: typeof raw.imageFailoverTimeoutSeconds === "number"
        ? Math.max(2, Math.min(30, Math.round(raw.imageFailoverTimeoutSeconds)))
        : DEFAULT_SETTINGS.imageFailoverTimeoutSeconds,
      imageFailoverUseLocalFallback: raw.imageFailoverUseLocalFallback !== false,
      globalSearchMaxResults: typeof raw.globalSearchMaxResults === "number"
        ? Math.max(20, Math.min(500, Math.round(raw.globalSearchMaxResults)))
        : DEFAULT_SETTINGS.globalSearchMaxResults,
      visibleModes: normalizeVisibleModes(raw.visibleModes),
      defaultViewMode: raw.defaultViewMode === "outline" || raw.defaultViewMode === "article" || raw.defaultViewMode === "mindmap"
        ? raw.defaultViewMode
        : DEFAULT_SETTINGS.defaultViewMode,
      defaultNodeTextAlign: raw.defaultNodeTextAlign === "left" || raw.defaultNodeTextAlign === "right" || raw.defaultNodeTextAlign === "center"
        ? raw.defaultNodeTextAlign
        : DEFAULT_SETTINGS.defaultNodeTextAlign,
      defaultThemePreset: [
        "classic-indigo", "ocean-blue", "forest-green", "sunset-orange", "lavender-dream",
        "candy-pop", "paper-note", "minimal-ink", "dark-neon", "mint-clean"
      ].includes(String(raw.defaultThemePreset)) ? raw.defaultThemePreset as MindMapStudioSettings["defaultThemePreset"] : DEFAULT_SETTINGS.defaultThemePreset,
      edgeWidthMode: raw.edgeWidthMode === "uniform" || raw.edgeWidthMode === "tapered"
        ? raw.edgeWidthMode
        : hadStoredSettings ? "uniform" : DEFAULT_SETTINGS.edgeWidthMode,
      edgeMinWidth: typeof raw.edgeMinWidth === "number"
        ? Math.max(0.25, Math.min(8, raw.edgeMinWidth))
        : DEFAULT_SETTINGS.edgeMinWidth,
      rootColor: typeof raw.rootColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.rootColor)
        ? raw.rootColor
        : hadStoredSettings ? "" : DEFAULT_SETTINGS.rootColor,
      rootTextColor: typeof raw.rootTextColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.rootTextColor)
        ? raw.rootTextColor
        : hadStoredSettings ? "" : DEFAULT_SETTINGS.rootTextColor,
      colorfulBranches: typeof raw.colorfulBranches === "boolean"
        ? raw.colorfulBranches
        : hadStoredSettings ? false : DEFAULT_SETTINGS.colorfulBranches,
      branchColors: Array.isArray(raw.branchColors)
        ? raw.branchColors.filter((value): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)).slice(0, 12)
        : hadStoredSettings ? [] : [...DEFAULT_SETTINGS.branchColors]
    } as MindMapStudioSettings;
    if (raw.backgroundPattern === undefined && raw.showGrid === false) this.settings.backgroundPattern = "none";
    if (!this.settings.visibleModes.includes(this.settings.defaultViewMode)) {
      this.settings.defaultViewMode = this.settings.visibleModes[0] ?? "mindmap";
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async setGlobalDisplayMode(mode: DisplayMode): Promise<void> {
    if (!this.settings.visibleModes.includes(mode)) return;
    if (this.settings.defaultViewMode !== mode) {
      this.settings.defaultViewMode = mode;
      await this.saveSettings();
    }
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView) leaf.view.applyGlobalDisplayMode(mode);
    }
  }

  async resetAllSettings(): Promise<void> {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as MindMapStudioSettings;
    await this.saveSettings();
    this.refreshOpenViews();
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
    document.view = { readOnly: false };
    return document;
  }

  private resolveMindMapFile(path: string, sourcePath = ""): TFile | null {
    const cleaned = path.replace(/^\[\[|\]\]$/g, "").split("|")[0]?.trim() ?? path;
    const normalized = normalizePath(cleaned);
    const direct = this.app.vault.getAbstractFileByPath(normalized);
    if (direct instanceof TFile && this.isMindMapFile(direct)) return direct;
    const linked = this.app.metadataCache.getFirstLinkpathDest(cleaned, sourcePath);
    return linked instanceof TFile && this.isMindMapFile(linked) ? linked : null;
  }

  private async readMindMapDocument(file: TFile): Promise<MindMapDocument> {
    return parseDocument(await this.app.vault.cachedRead(file), file.basename);
  }

  private findNodeDepth(root: MindMapNode, nodeId: string): number | null {
    const visit = (node: MindMapNode, depth: number): number | null => {
      if (node.id === nodeId) return depth;
      for (const child of node.children) {
        const found = visit(child, depth + 1);
        if (found !== null) return found;
      }
      return null;
    };
    return visit(root, 0);
  }

  private async computeArticleBaseDepth(file: TFile, document: MindMapDocument, visited = new Set<string>()): Promise<number> {
    if (visited.has(file.path) || !document.navigation?.parentPath) return 0;
    visited.add(file.path);
    const parentFile = this.resolveMindMapFile(document.navigation.parentPath, file.path);
    if (!parentFile) return 0;
    const parentDocument = await this.readMindMapDocument(parentFile);
    const parentBase = await this.computeArticleBaseDepth(parentFile, parentDocument, visited);
    let localDepth = document.navigation.parentNodeId
      ? this.findNodeDepth(parentDocument.root, document.navigation.parentNodeId)
      : null;
    if (localDepth === null) {
      const currentPath = normalizePath(file.path);
      const linkedParent = flattenNodes(parentDocument.root).find((node) => {
        if (!node.submap?.path) return false;
        return this.resolveMindMapFile(node.submap.path, parentFile.path)?.path === currentPath;
      });
      if (linkedParent) localDepth = this.findNodeDepth(parentDocument.root, linkedParent.id);
    }
    return parentBase + Math.max(1, localDepth ?? 1);
  }

  async buildArticleContext(file: TFile, document: MindMapDocument): Promise<{ baseDepth: number; tocEntries: ArticleTocEntry[]; showToc: boolean }> {
    const baseDepth = await this.computeArticleBaseDepth(file, document);
    const isTopLevel = !document.navigation?.parentPath;
    if (!isTopLevel) return { baseDepth, tocEntries: [], showToc: false };

    const tocEntries: ArticleTocEntry[] = [];
    const visitedFiles = new Set<string>([file.path]);
    let hasSubmaps = false;
    type Item = { node: MindMapNode; file: TFile; document: MindMapDocument; breadcrumb: string[] };

    const processItems = async (items: Item[], depth: number): Promise<void> => {
      let numberedIndex = 0;
      for (const item of items) {
        const { node, file: sourceFile, breadcrumb } = item;
        const heading = isArticleHeading(node);
        const skipped = node.skipArticleNumbering === true;
        if (heading && !skipped) numberedIndex += 1;
        const label = heading && !skipped ? articleNumberLabel(depth, numberedIndex) : "";
        const title = nodePlainText(node) || (heading ? "未命名标题" : "");
        const nextBreadcrumb = [...breadcrumb, title || "未命名标题"];
        if (heading) {
          tocEntries.push({
            filePath: sourceFile.path,
            nodeId: node.id,
            depth,
            label,
            title,
            displayTitle: label ? `${label} ${title}` : title,
            breadcrumb: nextBreadcrumb
          });
        }

        const descendants: Item[] = node.children.map((child) => ({
          node: child,
          file: sourceFile,
          document: item.document,
          breadcrumb: nextBreadcrumb
        }));
        if (node.submap?.path) {
          hasSubmaps = true;
          const childFile = this.resolveMindMapFile(node.submap.path, sourceFile.path);
          if (childFile && !visitedFiles.has(childFile.path)) {
            visitedFiles.add(childFile.path);
            try {
              const childDocument = await this.readMindMapDocument(childFile);
              descendants.push(...childDocument.root.children.map((child) => ({
                node: child,
                file: childFile,
                document: childDocument,
                breadcrumb: nextBreadcrumb
              })));
            } catch (error) {
              console.warn(`MindMap Studio could not read child map for article TOC: ${childFile.path}`, error);
            }
          }
        }
        if (descendants.length) await processItems(descendants, depth + 1);
      }
    };

    await processItems(document.root.children.map((node) => ({
      node,
      file,
      document,
      breadcrumb: [nodePlainText(document.root) || document.title]
    })), 1);
    return { baseDepth, tocEntries, showToc: hasSubmaps && tocEntries.length > 0 };
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

  async readImageSource(source: string, sourceFile: TFile | null): Promise<{ blob: Blob; suggestedName: string } | null> {
    const raw = source.trim();
    if (!raw || /^https?:\/\//i.test(raw) || /^data:/i.test(raw) || /^blob:/i.test(raw)) return null;
    const wikiMatch = raw.match(/^!?\[\[([\s\S]+?)\]\]$/);
    const target = (wikiMatch?.[1] ?? raw).split("|")[0]?.split("#")[0]?.trim() ?? raw;
    const direct = this.app.vault.getAbstractFileByPath(normalizePath(target));
    const file = direct instanceof TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(target, sourceFile?.path ?? "");
    if (!(file instanceof TFile)) return null;
    const binary = await this.app.vault.readBinary(file);
    return { blob: new Blob([binary], { type: this.mimeFromFilename(file.name) }), suggestedName: file.name };
  }

  getImageHostChoices(): ImageHostChoice[] {
    return this.settings.imageHosts
      .filter((host) => host.enabled && Boolean(host.endpoint.trim()))
      .map((host) => ({ id: host.id, name: host.name }));
  }

  getDefaultUploadHostIds(): string[] {
    const enabled = new Set(this.getImageHostChoices().map((host) => host.id));
    return this.settings.autoUploadHostIds.filter((id) => enabled.has(id));
  }

  async uploadImageToHosts(blob: Blob, suggestedName: string, hostIds: string[]): Promise<ImageHostUploadBatch> {
    const requested = Array.from(new Set(hostIds));
    const hosts = requested
      .map((id) => this.settings.imageHosts.find((host) => host.id === id))
      .filter((host): host is ImageHostConfig => Boolean(host?.enabled && host.endpoint.trim()));
    if (!hosts.length) throw new Error("没有选择可用图床");
    const settled = await Promise.all(hosts.map(async (host) => {
      try {
        const url = await this.uploadImageToHostConfig(host, blob, suggestedName);
        return { ok: true as const, value: { hostId: host.id, hostName: host.name, url } };
      } catch (error) {
        return {
          ok: false as const,
          value: {
            hostId: host.id,
            hostName: host.name,
            error: error instanceof Error ? error.message : String(error)
          }
        };
      }
    }));
    return {
      successes: settled.filter((item): item is { ok: true; value: ImageHostUploadSuccess } => item.ok).map((item) => item.value),
      failures: settled.filter((item): item is { ok: false; value: { hostId: string; hostName: string; error: string } } => !item.ok).map((item) => item.value)
    };
  }

  async testImageHost(hostId: string): Promise<void> {
    const host = this.settings.imageHosts.find((item) => item.id === hostId);
    if (!host) {
      new Notice("找不到该图床配置");
      return;
    }
    if (!host.endpoint.trim()) {
      new Notice(`请先填写 ${host.name} 的上传 API`);
      return;
    }
    // A real 1×1 transparent PNG tests authentication, request format and response parsing.
    const png = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
      0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 240, 31,
      0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68,
      174, 66, 96, 130
    ]);
    const started = performance.now();
    try {
      const url = await this.uploadImageToHostConfig(host, new Blob([png], { type: "image/png" }), "mindmap-studio-api-test.png");
      const elapsed = Math.max(1, Math.round(performance.now() - started));
      new Notice(`${host.name} 连接成功（${elapsed} ms）\n${url}`, 8000);
    } catch (error) {
      console.error("MindMap Studio image host connectivity test failed", error);
      new Notice(`${host.name} 连接失败：${error instanceof Error ? error.message : String(error)}`, 8000);
    }
  }

  scheduleAutoUpload(file: TFile | null, nodeId: string, blockId: string, localPath: string, suggestedName: string): boolean {
    if (!file || !this.settings.autoUploadEnabled) return false;
    const hostIds = this.getDefaultUploadHostIds();
    if (!hostIds.length) {
      new Notice("图片已保存到本地；自动上传未选择可用图床", 5000);
      return false;
    }
    const key = `${file.path}::${nodeId}::${blockId}`;
    const existing = this.autoUploadTimers.get(key);
    if (existing !== undefined) window.clearTimeout(existing);
    const delay = Math.max(0, Math.min(300, this.settings.autoUploadDelaySeconds)) * 1000;
    const timer = window.setTimeout(() => {
      this.autoUploadTimers.delete(key);
      void this.runAutoUploadTask(file.path, nodeId, blockId, localPath, suggestedName, hostIds);
    }, delay);
    this.autoUploadTimers.set(key, timer);
    return true;
  }

  private async runAutoUploadTask(
    mindMapPath: string,
    nodeId: string,
    blockId: string,
    localPath: string,
    suggestedName: string,
    hostIds: string[]
  ): Promise<void> {
    try {
      await this.flushOpenView(mindMapPath);
      const mapFile = this.app.vault.getAbstractFileByPath(mindMapPath);
      const localFile = this.app.vault.getAbstractFileByPath(normalizePath(localPath));
      if (!(mapFile instanceof TFile) || !(localFile instanceof TFile)) return;
      const document = parseDocument(await this.app.vault.read(mapFile), mapFile.basename);
      const node = findNode(document.root, nodeId);
      const block = node?.content?.find((item): item is MindMapImageContentBlock => item.type === "image" && item.id === blockId);
      if (!node || !block || (block.source !== localPath && block.localSource !== localPath)) return;

      const binary = await this.app.vault.readBinary(localFile);
      const blob = new Blob([binary], { type: this.mimeFromFilename(localFile.name) });
      const batch = await this.uploadImageToHosts(blob, suggestedName || localFile.name, hostIds);
      const uploadedAt = new Date().toISOString();
      const remoteByHost = new Map((block.remoteSources ?? []).map((item) => [item.hostId, item]));
      for (const success of batch.successes) {
        remoteByHost.set(success.hostId, { ...success, uploadedAt });
      }
      block.remoteSources = Array.from(remoteByHost.values());
      block.localSource = localPath;

      const allSucceeded = batch.failures.length === 0 && batch.successes.length === hostIds.length;
      if (allSucceeded && batch.successes[0]) block.source = batch.successes[0].url;
      syncNodeLegacyFields(node);
      await this.app.vault.modify(mapFile, serializeDocument(document));
      await this.refreshOpenMindMap(mapFile, document);

      let deleted = false;
      if (allSucceeded && this.settings.deleteLocalAfterUpload) {
        deleted = await this.deleteLocalAssetIfSafe(localPath, mindMapPath, blockId);
        if (deleted) {
          block.localSource = undefined;
          await this.app.vault.modify(mapFile, serializeDocument(document));
          await this.refreshOpenMindMap(mapFile, document);
        }
      }

      if (allSucceeded) {
        const targets = batch.successes.map((item) => item.hostName).join("、");
        const suffix = this.settings.deleteLocalAfterUpload
          ? deleted ? "，本地图片已安全删除" : "，本地图片因仍被引用或删除失败而保留"
          : "，本地图片已保留";
        new Notice(`图片已上传到 ${targets}${suffix}`, 7000);
      } else {
        const ok = batch.successes.map((item) => item.hostName).join("、") || "无";
        const failed = batch.failures.map((item) => `${item.hostName}：${item.error}`).join("；");
        new Notice(`图片仅部分上传成功。成功：${ok}；失败：${failed}。本地图片已保留。`, 9000);
      }
    } catch (error) {
      console.error("MindMap Studio automatic image upload failed", error);
      new Notice(`图片自动上传失败，本地图片已保留：${error instanceof Error ? error.message : String(error)}`, 8000);
    }
  }

  private async uploadImageToHostConfig(host: ImageHostConfig, blob: Blob, suggestedName: string): Promise<string> {
    const endpoint = host.endpoint.trim();
    if (!endpoint) throw new Error("上传 API 为空");
    let headers: Record<string, string> = {};
    if (host.headers.trim()) {
      const parsed = JSON.parse(host.headers) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("请求头 JSON 必须是对象");
      headers = Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value)]));
    }
    const filename = this.sanitizeFilename(suggestedName || "mindmap-image.png");
    const mime = blob.type || "application/octet-stream";
    let body: ArrayBuffer;
    let contentType = mime;
    if (host.bodyMode === "multipart") {
      const boundary = `----MindMapStudio${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      const encoder = new TextEncoder();
      const fieldName = (host.fieldName || "file").replaceAll('"', "");
      const safeFilename = filename.replaceAll('"', "");
      const head = encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${safeFilename}"\r\nContent-Type: ${mime}\r\n\r\n`);
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
      method: host.method,
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
    const candidates = [host.responsePath.trim(), "data.url", "url", "result.url", "result.image", "image.url", "src"].filter(Boolean);
    for (const path of candidates) {
      const value = getPath(payload, path);
      if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
    }
    if (typeof payload === "string") {
      const match = payload.match(/https?:\/\/[^\s"'<>]+/i);
      if (match?.[0]) return match[0];
    }
    throw new Error("返回结果中没有找到图片网址");
  }

  private async flushOpenView(path: string): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView && leaf.view.file?.path === path) await leaf.view.save();
    }
  }

  private async refreshOpenMindMap(file: TFile, document: MindMapDocument): Promise<void> {
    const source = serializeDocument(document);
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView && leaf.view.file?.path === file.path) leaf.view.setViewData(source, false);
    }
  }

  private async deleteLocalAssetIfSafe(localPath: string, currentMindMapPath: string, blockId: string): Promise<boolean> {
    const normalized = normalizePath(localPath);
    const target = this.app.vault.getAbstractFileByPath(normalized);
    if (!(target instanceof TFile)) return false;
    const current = this.app.vault.getAbstractFileByPath(currentMindMapPath);
    if (current instanceof TFile) {
      const doc = parseDocument(await this.app.vault.read(current), current.basename);
      const stillUsed = flattenNodes(doc.root).some((node) => nodeContentBlocks(node).some((block) =>
        block.type === "image" && block.id !== blockId && (block.source === normalized || block.localSource === normalized)));
      if (stillUsed) return false;
    }
    for (const file of this.app.vault.getFiles()) {
      if (file.path === currentMindMapPath || file.extension.toLowerCase() !== MINDMAP_EXTENSION) continue;
      try {
        const text = await this.app.vault.cachedRead(file);
        if (text.includes(normalized)) return false;
      } catch {
        // Ignore an unreadable unrelated map and keep checking other files.
      }
    }
    try {
      await this.app.vault.delete(target);
      return true;
    } catch (error) {
      console.warn("MindMap Studio could not delete uploaded local image", error);
      return false;
    }
  }

  private mimeFromFilename(filename: string): string {
    const extension = filename.split(".").at(-1)?.toLowerCase();
    return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp", avif: "image/avif" } as Record<string, string>)[extension ?? ""] ?? "application/octet-stream";
  }

  async createSubmapFile(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap> {
    const title = (nodePlainText(node) || "子导图").trim();
    const document = this.createConfiguredDocument(title);
    document.root.content = [{ id: document.root.id + "_title", type: "text", text: title }];
    syncNodeLegacyFields(document.root);
    // 1.4.2: parent navigation is handled by the dedicated breadcrumb bar,
    // not by injecting a backlink onto the submap root node.
    document.root.link = undefined;
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
