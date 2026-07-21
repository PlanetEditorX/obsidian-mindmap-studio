import { MarkdownRenderer, Notice, TextFileView, TFile, normalizePath, type WorkspaceLeaf } from "obsidian";
import type MindMapStudioPlugin from "./main";
import { MindMapEditor } from "./editor";
import { parseDocument, serializeDocument, type DisplayMode, type MindMapDocument } from "./model";
import { settingsToAppearance } from "./settings";

export const VIEW_TYPE_MINDMAP_STUDIO = "mindmap-studio-view";

export class MindMapStudioView extends TextFileView {
  private readonly plugin: MindMapStudioPlugin;
  private editor: MindMapEditor | null = null;
  private document: MindMapDocument | null = null;
  private savedTimer: number | null = null;
  private pendingFocusNodeId: string | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MindMapStudioPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_MINDMAP_STUDIO;
  }

  getDisplayText(): string {
    return this.file?.basename ?? "思维导图";
  }

  getIcon(): string {
    return "brain-circuit";
  }

  getViewData(): string {
    const document = this.editor?.getDocument() ?? this.document;
    return serializeDocument(document ?? this.plugin.createConfiguredDocument("思维导图"));
  }

  setViewData(data: string, clear: boolean): void {
    const title = this.file?.basename ?? "思维导图";
    this.document = parseDocument(data, title);
    this.applyViewClasses();

    if (!this.editor || clear) {
      this.editor?.destroy();
      this.contentEl.empty();
      this.editor = new MindMapEditor(this.app, this.contentEl, this.document, {
        onChange: (document) => {
          this.document = document;
          this.requestSave();
          this.scheduleSavedIndicator();
        },
        onOpenLink: async (link) => this.openLink(link),
        onExportSvg: async (svg) => this.exportTextFile("svg", svg),
        onExportMarkdown: async (markdown) => this.exportTextFile("md", markdown),
        onExportJson: async (json) => this.exportTextFile("json", json),
        resolveImage: (source) => this.resolveImage(source),
        onSavePastedImage: async (blob, suggestedName) => this.plugin.savePastedImage(blob, suggestedName, this.file),
        getImageHosts: () => this.plugin.getImageHostChoices(),
        getDefaultUploadHostIds: () => this.plugin.getDefaultUploadHostIds(),
        onUploadImage: async (blob, suggestedName, hostIds) => this.plugin.uploadImageToHosts(blob, suggestedName, hostIds),
        onReadImageSource: async (source) => this.plugin.readImageSource(source, this.file),
        onScheduleAutoUpload: (nodeId, blockId, localPath, suggestedName) => this.plugin.scheduleAutoUpload(this.file, nodeId, blockId, localPath, suggestedName),
        onCreateSubmap: async (node) => {
          if (!this.file) throw new Error("当前脑图尚未关联文件");
          return this.plugin.createSubmapFile(this.file, node);
        },
        onOpenMindMap: async (path, focusNodeId) => {
          await this.save();
          await this.plugin.openMindMapPath(path, this.file?.path ?? "", this.leaf, focusNodeId);
        },
        onSearchMapFamily: () => void this.openMapFamilySearch(),
        onGlobalSearch: () => this.plugin.openGlobalSearch(),
        onRenderCode: async (block, container) => {
          const longestFence = Math.max(2, ...Array.from(block.code.matchAll(/`+/g), (match) => match[0].length));
          const fence = "`".repeat(longestFence + 1);
          const markdown = `${fence}${block.language ?? ""}\n${block.code}\n${fence}`;
          await MarkdownRenderer.render(this.app, markdown, container, this.file?.path ?? "", this);
        }
      }, this.getEditorOptions());
    } else {
      this.editor.setDocument(this.document, false);
      this.editor.setOptions(this.getEditorOptions());
    }
    if (this.pendingFocusNodeId && this.editor) {
      const nodeId = this.pendingFocusNodeId;
      this.pendingFocusNodeId = null;
      window.setTimeout(() => this.editor?.focusNodeById(nodeId), 20);
    }
  }

  clear(): void {
    this.editor?.destroy();
    this.editor = null;
    this.document = null;
    this.contentEl.empty();
  }

  async save(clear?: boolean): Promise<void> {
    await super.save(clear);
    this.editor?.markSaved();
  }

  async onClose(): Promise<void> {
    if (this.savedTimer !== null) window.clearTimeout(this.savedTimer);
    this.editor?.destroy();
    this.editor = null;
    await super.onClose();
  }

  private async openMapFamilySearch(): Promise<void> {
    const file = this.file;
    if (!file) {
      new Notice("当前导图尚未保存，无法搜索子导图");
      return;
    }
    await this.save();
    await this.plugin.openMapFamilySearch(file, this.editor?.getDocument() ?? this.document ?? undefined);
  }

  refreshAppearance(): void {
    this.applyViewClasses();
    this.editor?.setOptions(this.getEditorOptions());
  }

  focusNode(nodeId: string): void {
    if (!this.editor) {
      this.pendingFocusNodeId = nodeId;
      return;
    }
    this.editor.focusNodeById(nodeId);
  }

  setDisplayMode(mode: DisplayMode): void {
    this.editor?.setDisplayMode(mode);
  }

  toggleReadOnly(): void {
    this.editor?.toggleReadOnly();
  }

  private getEditorOptions() {
    return {
      defaultNodeShape: this.plugin.settings.defaultNodeShape,
      defaultAppearance: settingsToAppearance(this.plugin.settings),
      showTaskProgress: this.plugin.settings.showTaskProgress,
      autoFitOnOpen: this.plugin.settings.autoFitOnOpen,
      historyLimit: this.plugin.settings.historyLimit,
      imageFailoverEnabled: this.plugin.settings.imageFailoverEnabled,
      imageFailoverTimeoutSeconds: this.plugin.settings.imageFailoverTimeoutSeconds,
      imageFailoverUseLocalFallback: this.plugin.settings.imageFailoverUseLocalFallback,
      visibleModes: [...this.plugin.settings.visibleModes],
      defaultViewMode: this.plugin.settings.defaultViewMode
    };
  }

  private applyViewClasses(): void {
    const theme = this.document?.theme ?? "auto";
    this.contentEl.toggleClass("mmc-force-light", theme === "light");
    this.contentEl.toggleClass("mmc-force-dark", theme === "dark");
  }

  private scheduleSavedIndicator(): void {
    if (this.savedTimer !== null) window.clearTimeout(this.savedTimer);
    this.savedTimer = window.setTimeout(() => this.editor?.markSaved(), 2300);
  }

  private async openLink(rawLink: string): Promise<void> {
    const link = rawLink.trim();
    if (/^https?:\/\//i.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }
    const wikiMatch = link.match(/^\[\[([\s\S]+?)\]\]$/);
    const target = (wikiMatch?.[1] ?? link).split("|")[0]?.trim() ?? link;
    await this.app.workspace.openLinkText(target, this.file?.path ?? "", false);
  }

  private resolveImage(rawSource: string): string | null {
    const source = rawSource.trim();
    if (!source) return null;
    if (/^(https?:|data:|blob:)/i.test(source)) return source;
    const wikiMatch = source.match(/^!?\[\[([\s\S]+?)\]\]$/);
    const target = (wikiMatch?.[1] ?? source).split("|")[0]?.split("#")[0]?.trim() ?? source;
    const file = this.app.metadataCache.getFirstLinkpathDest(target, this.file?.path ?? "");
    if (!(file instanceof TFile)) return null;
    return this.app.vault.getResourcePath(file);
  }

  private async exportTextFile(extension: "svg" | "md" | "json", content: string): Promise<void> {
    const file = this.file;
    const parentPath = file?.parent?.path ?? "";
    const baseName = file?.basename ?? this.document?.title ?? "思维导图";
    const path = await this.plugin.getAvailablePath(normalizePath(`${parentPath ? `${parentPath}/` : ""}${baseName}.${extension}`));
    await this.app.vault.create(path, content);
    new Notice(`已导出：${path}`);
  }
}
