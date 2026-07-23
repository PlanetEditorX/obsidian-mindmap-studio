/**
 * @file view.ts
 * @description Obsidian TextFileView 适配层。
 *
 * 连接磁盘文件与编辑器，负责加载保存、外部刷新、全局模式、文章上下文、链接、图片资源和导出。
 */

import { MarkdownRenderer, Notice, TextFileView, TFile, normalizePath, type WorkspaceLeaf } from "obsidian";
import type MindMapStudioPlugin from "./main";
import { MindMapEditor } from "./editor";
import { parseDocument, serializeDocument, type DisplayMode, type MindMapDocument } from "./model";
import { settingsToAppearance } from "./settings";
import type { ArticlePageNavigation, ArticleTocEntry } from "./modes";

export const VIEW_TYPE_MINDMAP_STUDIO = "mindmap-studio-view";

/**
 * MindMapStudioView 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class MindMapStudioView extends TextFileView {
  private readonly plugin: MindMapStudioPlugin;
  private editor: MindMapEditor | null = null;
  private document: MindMapDocument | null = null;
  private savedTimer: number | null = null;
  private pendingFocusNodeId: string | null = null;
  private articleBaseDepth = 0;
  private articleTocEntries: ArticleTocEntry[] = [];
  private showArticleToc = false;
  private articleNavigation: ArticlePageNavigation | undefined;
  private articleContextToken = 0;
  private articleContextTimer: number | null = null;

  /**
   * 创建 MindMapStudioView 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param leaf 该参数用于 constructor 流程中的输入或控制。
   * @param plugin MindMap Studio 插件实例，用于调用跨文件服务和读取设置。
   */
  constructor(leaf: WorkspaceLeaf, plugin: MindMapStudioPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  /**
   * 读取并返回view type，并保持模型、界面和持久化状态的一致性。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  getViewType(): string {
    return VIEW_TYPE_MINDMAP_STUDIO;
  }

  /**
   * 读取并返回display text，并保持模型、界面和持久化状态的一致性。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  getDisplayText(): string {
    return this.file?.basename ?? "思维导图";
  }

  /**
   * 读取并返回icon，并保持模型、界面和持久化状态的一致性。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  getIcon(): string {
    return "brain-circuit";
  }

  /**
   * 返回当前编辑器文档的序列化文本，供 Obsidian 自动保存。保存使用模型层统一序列化，确保兼容字段和版本号正确。
   * @returns 计算、解析或序列化后的字符串结果。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  getViewData(): string {
    const document = this.editor?.getDocument() ?? this.document;
    return serializeDocument(document ?? this.plugin.createConfiguredDocument("思维导图"));
  }

  /**
   * 接收 Obsidian 读取的文件文本，解析成领域文档并交给编辑器。重新加载时会保留全局显示模式，并异步刷新文章父子上下文。
   *
   * @param data 该参数用于 set view data 流程中的输入或控制。
   * @param clear 该参数用于 set view data 流程中的输入或控制。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  setViewData(data: string, clear: boolean): void {
    const title = this.file?.basename ?? "思维导图";
    this.document = parseDocument(data, title);
    this.articleBaseDepth = 0;
    this.articleTocEntries = [];
    this.showArticleToc = false;
    this.articleNavigation = undefined;
    this.applyViewClasses();

    if (!this.editor || clear) {
      this.editor?.destroy();
      this.contentEl.empty();
      this.editor = new MindMapEditor(this.app, this.contentEl, this.document, {
        onChange: (document) => {
          this.document = document;
          this.requestSave();
          this.scheduleSavedIndicator();
          this.scheduleArticleContextRefresh(320);
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
        onOpenArticleDirectory: async (path) => {
          await this.save();
          await this.plugin.openMindMapPath(path, this.file?.path ?? "", this.leaf);
          if (this.leaf.view instanceof MindMapStudioView) this.leaf.view.showArticleDirectory();
        },
        onSearchMapFamily: () => void this.openMapFamilySearch(),
        onGlobalSearch: () => this.plugin.openGlobalSearch(),
        onDisplayModeChange: (mode) => this.plugin.setGlobalDisplayMode(mode),
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
    this.scheduleArticleContextRefresh(0);
  }

  /**
   * 执行“clear”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  clear(): void {
    this.editor?.destroy();
    this.editor = null;
    this.document = null;
    this.contentEl.empty();
  }

  /**
   * Displays and persists the generated directory for the top-level article.
   */
  showArticleDirectory(): void {
    this.editor?.showArticleDirectory();
  }

  /**
   * 保存相关数据，并保持模型、界面和持久化状态的一致性。
   *
   * @param clear 该参数用于 save 流程中的输入或控制。
   */
  async save(clear?: boolean): Promise<void> {
    await super.save(clear);
    this.editor?.markSaved();
  }

  /**
   * 在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。
   */
  async onClose(): Promise<void> {
    if (this.savedTimer !== null) window.clearTimeout(this.savedTimer);
    if (this.articleContextTimer !== null) window.clearTimeout(this.articleContextTimer);
    this.articleContextToken += 1;
    this.editor?.destroy();
    this.editor = null;
    await super.onClose();
  }

  /**
   * 打开map family search，并保持模型、界面和持久化状态的一致性。
   */
  private async openMapFamilySearch(): Promise<void> {
    const file = this.file;
    if (!file) {
      new Notice("当前导图尚未保存，无法搜索子导图");
      return;
    }
    await this.save();
    await this.plugin.openMapFamilySearch(file, this.editor?.getDocument() ?? this.document ?? undefined);
  }

  /**
   * 刷新appearance，并保持模型、界面和持久化状态的一致性。
   */
  refreshAppearance(): void {
    this.applyViewClasses();
    this.editor?.setOptions(this.getEditorOptions());
  }

  /**
   * 定位node，并保持模型、界面和持久化状态的一致性。
   *
   * @param nodeId 目标节点的稳定标识。
   */
  focusNode(nodeId: string): void {
    if (!this.editor) {
      this.pendingFocusNodeId = nodeId;
      return;
    }
    this.editor.focusNodeById(nodeId);
  }

  /**
   * 更新并应用display mode，并保持模型、界面和持久化状态的一致性。
   *
   * @param mode 当前布局或显示模式。
   */
  setDisplayMode(mode: DisplayMode): void {
    this.editor?.setDisplayMode(mode);
  }

  /**
   * 应用global display mode，并保持模型、界面和持久化状态的一致性。
   *
   * @param mode 当前布局或显示模式。
   */
  applyGlobalDisplayMode(mode: DisplayMode): void {
    this.editor?.applyGlobalDisplayMode(mode);
  }

  /**
   * 切换read only，并保持模型、界面和持久化状态的一致性。
   */
  toggleReadOnly(): void {
    this.editor?.toggleReadOnly();
  }

  /**
   * 读取并返回editor options，并保持模型、界面和持久化状态的一致性。
   */
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
      defaultViewMode: this.plugin.settings.defaultViewMode,
      nodeEditorPosition: this.plugin.settings.nodeEditorPosition,
      richTextShortcuts: {
        bold: this.plugin.settings.richTextBoldShortcut,
        italic: this.plugin.settings.richTextItalicShortcut,
        underline: this.plugin.settings.richTextUnderlineShortcut,
        color: this.plugin.settings.richTextColorShortcut
      },
      visibleToolbarItems: [...this.plugin.settings.visibleToolbarItems],
      toolbarItemOrder: [...this.plugin.settings.toolbarItemOrder],
      articleBaseDepth: this.articleBaseDepth,
      articleTocEntries: [...this.articleTocEntries],
      showArticleToc: this.showArticleToc,
      articleNavigation: this.articleNavigation
    };
  }

  /**
   * 安排延迟执行article context refresh，并保持模型、界面和持久化状态的一致性。
   *
   * @param delay 该参数用于 schedule article context refresh 流程中的输入或控制。
   */
  private scheduleArticleContextRefresh(delay: number): void {
    if (this.articleContextTimer !== null) window.clearTimeout(this.articleContextTimer);
    this.articleContextTimer = window.setTimeout(() => {
      this.articleContextTimer = null;
      void this.refreshArticleContext();
    }, Math.max(0, delay));
  }

  /**
   * 刷新article context，并保持模型、界面和持久化状态的一致性。
   */
  private async refreshArticleContext(): Promise<void> {
    const file = this.file;
    const document = this.editor?.getDocument() ?? this.document;
    if (!file || !document) return;
    const token = ++this.articleContextToken;
    try {
      const context = await this.plugin.buildArticleContext(file, document);
      if (token !== this.articleContextToken || this.file?.path !== file.path) return;
      this.articleBaseDepth = context.baseDepth;
      this.articleTocEntries = context.tocEntries;
      this.showArticleToc = context.showToc;
      this.articleNavigation = context.navigation;
      this.editor?.setOptions(this.getEditorOptions());
    } catch (error) {
      console.warn("MindMap Studio article context refresh failed", error);
    }
  }

  /**
   * 应用view classes，并保持模型、界面和持久化状态的一致性。
   */
  private applyViewClasses(): void {
    const theme = this.document?.theme ?? "auto";
    this.contentEl.toggleClass("mmc-force-light", theme === "light");
    this.contentEl.toggleClass("mmc-force-dark", theme === "dark");
  }

  /**
   * 安排延迟执行saved indicator，并保持模型、界面和持久化状态的一致性。
   */
  private scheduleSavedIndicator(): void {
    if (this.savedTimer !== null) window.clearTimeout(this.savedTimer);
    this.savedTimer = window.setTimeout(() => this.editor?.markSaved(), 2300);
  }

  /**
   * 打开link，并保持模型、界面和持久化状态的一致性。
   *
   * @param rawLink 该参数用于 open link 流程中的输入或控制。
   */
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

  /**
   * 解析并确定image，并保持模型、界面和持久化状态的一致性。
   *
   * @param rawSource 该参数用于 resolve image 流程中的输入或控制。
   * @returns 计算、解析或序列化后的字符串结果。
   */
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

  /**
   * 执行“export text file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param extension 该参数用于 export text file 流程中的输入或控制。
   * @param content 该参数用于 export text file 流程中的输入或控制。
   */
  private async exportTextFile(extension: "svg" | "md" | "json", content: string): Promise<void> {
    const file = this.file;
    const parentPath = file?.parent?.path ?? "";
    const baseName = file?.basename ?? this.document?.title ?? "思维导图";
    const path = await this.plugin.getAvailablePath(normalizePath(`${parentPath ? `${parentPath}/` : ""}${baseName}.${extension}`));
    await this.app.vault.create(path, content);
    new Notice(`已导出：${path}`);
  }
}
