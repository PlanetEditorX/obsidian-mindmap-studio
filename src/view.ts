/**
 * @file view.ts
 * @description Obsidian TextFileView 适配层。
 *
 * 连接磁盘文件与编辑器，负责加载保存、外部刷新、全局模式、文章上下文、链接、图片资源和导出。
 */

import { MarkdownRenderer, Notice, TextFileView, TFile, normalizePath, type WorkspaceLeaf } from "obsidian";
import type MindMapStudioPlugin from "./main";
import { MindMapEditor } from "./editor/editor";
import { parseDocument, serializeDocument, type DisplayMode, type MindMapDocument } from "./core/model";
import { settingsToAppearance } from "./settings";
import { resolveArticleTocMaxDepth, type ArticlePageNavigation, type ArticleTocEntry, type ReadingSection } from "./article/modes";
import { readingSectionsToDocx, readingSectionsToHtml, readingSectionsToMarkdown } from "./import/import-export";
import { AiAskModal } from "./ai/modal";
import { enabledAiProfiles } from "./ai/config";
import { buildAiMarkdownPayload } from "./ai/markdown";
import { saveDesktopExportFile, saveDesktopPdfFile } from "./utils/desktop-export";
import {
  collectRecognizableImages,
  type ImageRecognitionBatchResult,
  type ImageRecognitionItemResult,
  type RecognizableImage
} from "./vision/recognition";

export const VIEW_TYPE_MINDMAP_STUDIO = "mindmap-studio-view";

const CODE_THEME_CLASS_NAMES = {
  github: "mms-code-theme-github",
  monokai: "mms-code-theme-monokai",
  dracula: "mms-code-theme-dracula"
} as const;

/**
 * MindMapStudioView 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class MindMapStudioView extends TextFileView {
  private readonly plugin: MindMapStudioPlugin;
  private editor: MindMapEditor | null = null;
  private document: MindMapDocument | null = null;
  private savedTimer: number | null = null;
  private pendingFocusNodeId: string | null = null;
  private pendingFocusShouldPersist = true;
  private articleBaseDepth = 0;
  private articleTocEntries: ArticleTocEntry[] = [];
  private showArticleToc = false;
  private articleNavigation: ArticlePageNavigation | undefined;
  private readingSections: ReadingSection[] = [];
  private articleContextToken = 0;
  private articleContextTimer: number | null = null;
  private preferCurrentFileOnNextContextRefresh = false;

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
   * 返回当前编辑器文档的序列化文本，供 Obsidian 自动保存。保存使用模型层统一序列化，确保字段规范和版本号正确。
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
    if (this.file) void this.plugin.resumePendingAutoUploads(this.file, this.document);
    this.articleBaseDepth = 0;
    this.articleTocEntries = [];
    this.showArticleToc = false;
    this.articleNavigation = undefined;
    this.readingSections = [];
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
        onExportDocument: async (format) => this.exportArticleFamily(format),
        resolveImage: (source) => this.resolveImage(source),
        onSavePastedImage: async (blob, suggestedName) => this.plugin.savePastedImage(blob, suggestedName, this.file),
        getImageHosts: () => this.plugin.getImageHostChoices(),
        getDefaultUploadHostIds: () => this.plugin.getDefaultUploadHostIds(),
        onUploadImage: async (blob, suggestedName, hostIds) => this.plugin.uploadImageToHosts(blob, suggestedName, hostIds),
        onReadImageSource: async (source) => this.plugin.readImageSource(source, this.file),
        onScheduleAutoUpload: (nodeId, blockId, localPath, suggestedName) => this.plugin.scheduleAutoUpload(this.file, nodeId, blockId, localPath, suggestedName),
        onDeleteRecognizedImageLocalAsset: async (localPath, blockId) => this.plugin.deleteRecognizedImageLocalAsset(this.file?.path ?? "", localPath, blockId),
        onRecognizeImage: async (image, blob, remoteUrl, instruction) => this.plugin.recognizeImage(image, blob, undefined, instruction, remoteUrl),
        onEnrichQuestion: async (questionText) => this.plugin.enrichQuestion(questionText),
        onCaptureScreenshot: async () => this.plugin.captureScreenshot(),
        onCreateSubmap: async (node) => {
          if (!this.file) throw new Error("当前脑图尚未关联文件");
          return this.plugin.createSubmapFile(this.file, node);
        },
        onDeleteSubmap: async (submap) => {
          if (!this.file) return false;
          return this.plugin.deleteSubmapFile(this.file, submap);
        },
        onExtractToSubmap: async (node) => {
          if (!this.file) throw new Error("当前脑图尚未关联文件");
          await this.save();
          return this.plugin.extractToSubmap(this.file, node);
        },
        onMergeFromSubmap: async () => {
          if (!this.file) { new Notice("当前脑图尚未关联文件"); return; }
          await this.save();
          await this.plugin.mergeFromSubmap(this.file);
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
        onAskAi: (nodeId) => this.openAiModal(nodeId),
        onDisplayModeChange: async (mode, location) => {
          await this.plugin.setGlobalDisplayMode(mode);
          const currentPath = this.file?.path ?? "";
          const targetNodeId = location?.nodeIds[0];
          if (mode !== "reading" && location && location.filePath !== currentPath) {
            await this.save();
            await this.plugin.openMindMapPath(location.filePath, currentPath, this.leaf, targetNodeId);
          }
        },
        onReadingLocationChange: async (path, location) => {
          this.plugin.settings.readingLocations[path] = location;
          await this.plugin.saveSettings();
        },
        onRenderCode: async (block, container) => {
          const longestFence = Math.max(2, ...Array.from(block.code.matchAll(/`+/g), (match) => match[0].length));
          const fence = "`".repeat(longestFence + 1);
          const markdown = `${fence}${block.language ?? ""}\n${block.code}\n${fence}`;
          const pageCode = this.document?.appearance;
          const collapsed = block.collapsed ?? pageCode?.codeCollapsed ?? this.plugin.settings.defaultCodeCollapsed;
          const showLineNumbers = block.showLineNumbers ?? pageCode?.codeShowLineNumbers ?? this.plugin.settings.defaultCodeShowLineNumbers;
          const theme = block.theme ?? pageCode?.codeTheme ?? this.plugin.settings.defaultCodeTheme;
          const themeClass = theme !== "obsidian" ? CODE_THEME_CLASS_NAMES[theme] : undefined;
          if (themeClass) container.addClass(themeClass);
          const rendered = collapsed
            ? container.createEl("details", { cls: "mms-code-collapsed" })
            : container;
          if (collapsed) rendered.createEl("summary", { text: `展开 ${block.language || "code"} 代码` });
          const target = collapsed ? rendered.createDiv({ cls: "mms-code-collapsed-content" }) : rendered;
          await MarkdownRenderer.render(this.app, markdown, target, this.file?.path ?? "", this);
          const pre = target.querySelector("pre");
          if (showLineNumbers && pre) {
            pre.addClass("mms-code-with-line-numbers");
            pre.setAttr("data-line-numbers", Array.from({ length: block.code.split("\n").length }, (_, index) => String(index + 1)).join("\n"));
          }
        }
      }, this.getEditorOptions());
    } else {
      this.editor.setDocument(this.document, false);
      this.editor.setOptions(this.getEditorOptions());
    }
    if (this.pendingFocusNodeId && this.editor) {
      const nodeId = this.pendingFocusNodeId;
      const persistLocation = this.pendingFocusShouldPersist;
      this.pendingFocusNodeId = null;
      this.pendingFocusShouldPersist = true;
      window.setTimeout(() => this.editor?.focusNodeById(nodeId, persistLocation), 20);
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
    const file = this.file;
    const document = this.editor?.getDocument() ?? this.document;
    if (file && document) await this.plugin.syncMindMapTitleToFilename(file, document);
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
      this.pendingFocusShouldPersist = true;
      return;
    }
    this.editor.focusNodeById(nodeId);
  }

  /**
   * 标记当前文件由用户或跨模式导航显式打开。
   *
   * 下一次文章族上下文加载完成时以当前文件为准，避免旧的跨文件阅读记录
   * 立即把视图跳回刚离开的父导图或子导图。
   */
  markExplicitNavigation(focusNodeId?: string): void {
    this.preferCurrentFileOnNextContextRefresh = true;
    const nodeId = focusNodeId ?? this.document?.root.id;
    if (!nodeId) return;
    if (!this.editor) {
      this.pendingFocusNodeId = nodeId;
      this.pendingFocusShouldPersist = false;
      return;
    }
    this.editor.focusNodeById(nodeId, false);
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

  /** 打开 AI 询问窗口；默认使用当前页面，节点右键后使用该节点子树。 */
  askAi(): void {
    if (this.editor) this.editor.askAi();
    else void this.openAiModal();
  }

  /** 启动截图并让编辑器根据截图前焦点决定插入节点或保留剪贴板。 */
  async captureScreenshot(): Promise<void> {
    if (!this.editor) {
      new Notice("当前导图尚未加载");
      return;
    }
    await this.editor.captureScreenshot();
  }

  /** 构建 Markdown 上下文并打开 AI 窗口。 */
  private openAiModal(nodeId?: string): void {
    const document = this.editor?.getDocument() ?? this.document;
    if (!document) { new Notice("当前导图尚未加载"); return; }
    const profiles = enabledAiProfiles(this.plugin.settings.aiProfiles);
    const payload = buildAiMarkdownPayload(
      document,
      nodeId,
      this.file?.path ?? "",
      this.plugin.settings.aiMaxInputBytes
    );
    new AiAskModal(this.app, {
      payload,
      profiles,
      defaultProfileId: this.plugin.settings.defaultAiProfileId,
      defaultImageRecognitionProfileId: this.plugin.settings.imageRecognitionAiProfileId || this.plugin.settings.defaultAiProfileId,
      defaultQuestion: this.plugin.settings.aiDefaultQuestion,
      defaultImageRecognitionPrompt: this.plugin.settings.imageRecognitionPrompt,
      imageRecognitionMode: this.plugin.settings.imageRecognitionMode,
      imageRecognitionAutoConfirmDelaySeconds: this.plugin.settings.imageRecognitionAutoConfirmDelaySeconds,
      imageCount: collectRecognizableImages(document, nodeId).length,
      sourcePath: this.file?.path ?? "",
      onAsk: async (profileId, question) => this.plugin.askAi(profileId, payload, question),
      onProposeEdit: async (profileId, instruction) => this.plugin.proposeAiEdit(profileId, payload, instruction),
      onRecognizeImages: async (profileId, instruction) => this.recognizeImages(nodeId, profileId, instruction),
      onPreviewImageTextReplacements: (items) => {
        if (!this.editor) throw new Error("当前导图编辑器尚未加载");
        return this.editor.previewImageTextReplacements(items);
      },
      onApplyImageTextReplacements: (previews) => this.editor?.applyImageTextReplacements(previews) ?? false,
      onPreviewAiEdit: (responseText) => {
        if (!this.editor) throw new Error("当前导图编辑器尚未加载");
        return this.editor.previewAiEdit(responseText, nodeId);
      },
      onApplyAiEdit: (preview) => this.editor?.applyAiEdit(preview) ?? false,
      onPreviewLocalReplace: (query, replacement, caseSensitive) => {
        if (!this.editor) throw new Error("当前导图编辑器尚未加载");
        return this.editor.previewLocalReplace(query, replacement, caseSensitive, nodeId);
      },
      onApplyLocalReplace: (preview) => this.editor?.applyLocalReplace(preview) ?? false
    }).open();
  }

  /** 按节点树顺序逐张读取并识别当前页面或节点子树中的全部图片。 */
  private async recognizeImages(nodeId: string | undefined, profileId: string, instruction: string): Promise<ImageRecognitionBatchResult> {
    const document = this.editor?.getDocument() ?? this.document;
    if (!document) throw new Error("当前导图尚未加载");
    const images = collectRecognizableImages(document, nodeId);
    if (!images.length) throw new Error("当前范围没有可识别的图片");
    const items: ImageRecognitionItemResult[] = [];
    const failed: Array<RecognizableImage & { error: string }> = [];
    for (const image of images) {
      try {
        const source = await this.plugin.readImageSource(image.source, this.file);
        if (!source) throw new Error("无法读取图片来源");
        const remoteUrl = /^https:\/\//i.test(image.source) ? image.source : undefined;
        items.push(await this.plugin.recognizeImage(image, source.blob, profileId, instruction, remoteUrl));
      } catch (error) {
        failed.push({ ...image, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return {
      text: "",
      items,
      failed,
      mode: this.plugin.settings.imageRecognitionMode
    };
  }

  /**
   * 读取并返回editor options，并保持模型、界面和持久化状态的一致性。
   */
  private getEditorOptions(preferCurrentFileLocation = false) {
    return {
      defaultNodeShape: this.plugin.settings.defaultNodeShape,
      defaultAppearance: settingsToAppearance(this.plugin.settings),
      showTaskProgress: this.plugin.settings.showTaskProgress,
      autoFitOnOpen: this.plugin.settings.autoFitOnOpen,
      twoFingerGestureAction: this.plugin.settings.twoFingerGestureAction,
      historyLimit: this.plugin.settings.historyLimit,
      imageFailoverEnabled: this.plugin.settings.imageFailoverEnabled,
      imageFailoverTimeoutSeconds: this.plugin.settings.imageFailoverTimeoutSeconds,
      imageFailoverUseLocalFallback: this.plugin.settings.imageFailoverUseLocalFallback,
      imageHostPriorityIds: this.plugin.getImageHostPriorityIds(),
      visibleModes: [
        ...this.plugin.settings.visibleModes,
        ...(this.plugin.isQuestionBankFile(this.file) ? ["question-bank" as const] : [])
      ],
      defaultViewMode: this.plugin.getActiveDisplayMode(),
      currentFilePath: this.file?.path ?? "",
      readingHomePath: this.readingSections[0]?.filePath ?? this.file?.path ?? "",
      readingLocation: (() => {
        const homePath = this.readingSections[0]?.filePath ?? this.file?.path ?? "";
        return homePath ? (this.plugin.settings.readingLocations[homePath] ?? null) : null;
      })(),
      preferCurrentFileLocation,
      nodeEditorPosition: this.plugin.settings.nodeEditorPosition,
      richTextShortcuts: {
        bold: this.plugin.settings.richTextBoldShortcut,
        italic: this.plugin.settings.richTextItalicShortcut,
        underline: this.plugin.settings.richTextUnderlineShortcut,
        color: this.plugin.settings.richTextColorShortcut
      },
      visibleToolbarItems: [...this.plugin.settings.visibleToolbarItems],
      toolbarItemOrder: [...this.plugin.settings.toolbarItemOrder],
      imageRecognitionMode: this.plugin.settings.imageRecognitionMode,
      imageRecognitionAutoConfirmDelaySeconds: this.plugin.settings.imageRecognitionAutoConfirmDelaySeconds,
      autoUploadDelaySeconds: this.plugin.settings.autoUploadDelaySeconds,
      screenshotShortcut: this.plugin.settings.screenshotShortcut,
      screenshotAutoRecognize: this.plugin.settings.screenshotAutoRecognize,
      questionNodesEnabled: this.plugin.settings.questionNodesEnabled,
      questionBankModeEnabled: this.plugin.isQuestionBankFile(this.file),
      articleBaseDepth: this.articleBaseDepth,
      articleTocEntries: [...this.articleTocEntries],
      articleTocMaxDepth: this.plugin.settings.articleTocMaxDepth,
      showArticleMiniMap: this.plugin.settings.showArticleMiniMap,
      articleSectionCollapseEnabled: this.plugin.settings.articleSectionCollapseEnabled,
      articleLeafBulletsEnabled: this.plugin.settings.articleLeafBulletsEnabled,
      articleLeafBulletColor: this.plugin.settings.articleLeafBulletColor,
      articleLeafBulletStyle: this.plugin.settings.articleLeafBulletStyle,
      showArticleToc: this.showArticleToc,
      articleNavigation: this.articleNavigation
      ,readingSections: this.readingSections
      ,readingProgressPosition: this.plugin.settings.readingProgressPosition
      ,returnToTopVisibility: this.plugin.settings.returnToTopVisibility
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
      this.readingSections = context.readingSections;
      const preferCurrentFile = this.preferCurrentFileOnNextContextRefresh;
      this.editor?.setOptions(this.getEditorOptions(preferCurrentFile));
      this.preferCurrentFileOnNextContextRefresh = false;
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
  private async exportTextFile(extension: "svg" | "md" | "json" | "html" | "doc", content: string, preferExternal = false): Promise<void> {
    const file = this.file;
    const baseName = file?.basename ?? this.document?.title ?? "思维导图";
    if (preferExternal) {
      const desktopResult = await saveDesktopExportFile(extension, baseName, content);
      if (desktopResult) {
        if (desktopResult.path) new Notice(`已导出：${desktopResult.path}`);
        return;
      }
    }
    const parentPath = file?.parent?.path ?? "";
    const path = await this.plugin.getAvailablePath(normalizePath(`${parentPath ? `${parentPath}/` : ""}${baseName}.${extension}`));
    await this.app.vault.create(path, content);
    new Notice(`已导出：${path}`);
  }

  /** 将二进制文档写入所选位置或当前库。 */
  private async exportBinaryFile(extension: "docx", content: Uint8Array): Promise<void> {
    const file = this.file;
    const baseName = file?.basename ?? this.document?.title ?? "思维导图";
    const desktopResult = await saveDesktopExportFile(extension, baseName, content);
    if (desktopResult) {
      if (desktopResult.path) new Notice(`已导出：${desktopResult.path}`);
      return;
    }
    const parentPath = file?.parent?.path ?? "";
    const path = await this.plugin.getAvailablePath(normalizePath(`${parentPath ? `${parentPath}/` : ""}${baseName}.${extension}`));
    const binary = new ArrayBuffer(content.byteLength);
    new Uint8Array(binary).set(content);
    await this.app.vault.createBinary(path, binary);
    new Notice(`已导出：${path}`);
  }

  /**
   * Exports the current map family as one continuous document. A top-level
   * directory uses its already collected reading sections; a child page starts
   * at the current map and recursively includes descendants only.
   *
   * @param format Requested portable document format.
   */
  private async exportArticleFamily(format: "html" | "doc" | "pdf" | "md"): Promise<void> {
    const file = this.file;
    const document = this.document;
    if (!file || !document) return;
    await this.save();
    const sections = this.showArticleToc && this.readingSections.length
      ? this.readingSections
      : await this.plugin.buildDescendantReadingSections(file, document);
    const tocMaxDepth = resolveArticleTocMaxDepth(document.view?.articleTocMaxDepth, this.plugin.settings.articleTocMaxDepth);
    if (format === "md") {
      const markdown = readingSectionsToMarkdown(sections, tocMaxDepth);
      await this.exportTextFile("md", markdown, true);
      return;
    }
    if (format === "doc") {
      await this.exportBinaryFile("docx", readingSectionsToDocx(sections, tocMaxDepth));
      return;
    }
    const html = readingSectionsToHtml(sections, tocMaxDepth);
    if (format === "pdf") {
      const result = await saveDesktopPdfFile(file.basename, html);
      if (result?.path) new Notice(`已导出：${result.path}`);
      else if (!result) new Notice("PDF 导出仅支持 Obsidian 桌面端");
    }
    else await this.exportTextFile(format, html, true);
  }
}
