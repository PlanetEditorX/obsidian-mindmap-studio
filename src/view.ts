/**
 * @file view.ts
 * @description Obsidian TextFileView 适配层。
 *
 * 连接磁盘文件与编辑器，负责加载保存、外部刷新、全局模式、文章上下文、链接、图片资源和导出。
 */

import { MarkdownRenderer, Notice, TextFileView, TFile, normalizePath, type WorkspaceLeaf } from "obsidian";
import type MindMapStudioPlugin from "./main";
import { MindMapEditor } from "./editor/editor";
import { nodePlainText, parseDocument, serializeDocument, type DisplayMode, type MindMapDocument, type MindMapImageUploadPatch } from "./core/model";
import { settingsToAppearance } from "./settings";
import { resolveArticleTocMaxDepth, type ArticlePageNavigation, type ArticleTocEntry } from "./article/modes";
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
import { renderCodeBlock } from "./render/code-block";

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
  private pendingFocusShouldPersist = true;
  private articleContextReady = false;
  private articleBaseDepth = 0;
  private articleTocEntries: ArticleTocEntry[] = [];
  private showArticleToc = false;
  private articleNavigation: ArticlePageNavigation | undefined;
  private readingSections: import("./article/modes").ReadingSection[] = [];
  private articleContextToken = 0;
  private articleContextTimer: number | null = null;
  private preferCurrentFileOnNextContextRefresh = false;
  private preferredCurrentNodeIdOnNextContextRefresh: string | null = null;
  /** Root title last loaded or saved; unrelated edits must not rename an already mismatched file. */
  private persistedRootTitle = "";

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
    if (!document) return serializeDocument(this.plugin.createConfiguredDocument("思维导图"));
    const persistedDocument = !document.navigation?.parentPath
      ? { ...document, view: { ...(document.view ?? {}), articleLandingMode: "toc" as const } }
      : document;
    return serializeDocument(persistedDocument);
  }

  /**
   * 将后台上传结果合并到当前编辑器文档并立即保存，避免用上传开始时的旧快照刷新整棵节点树。
   *
   * @param patches 已完成网络上传的图片字段补丁。
   * @returns 实际更新的图片块数量。
   */
  async applyImageUploadPatches(patches: readonly MindMapImageUploadPatch[]): Promise<number> {
    if (!this.editor) return 0;
    const updated = this.editor.applyImageUploadPatches(patches);
    if (!updated) return 0;
    this.document = this.editor.getDocument();
    await this.save();
    return updated;
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
    this.plugin.logDebug("view", "set-view-data-start", { filePath: this.file?.path, clear, hasEditor: Boolean(this.editor), dataBytes: new TextEncoder().encode(data).byteLength });
    this.document = parseDocument(data, title);
    this.persistedRootTitle = nodePlainText(this.document.root).trim();
    const queuedDirectory = this.file ? this.plugin.consumePendingMindMapDirectory(this.file.path) : null;
    const queuedFocusNodeId = queuedDirectory ? null : (this.file ? this.plugin.consumePendingMindMapFocus(this.file.path) : null);
    if (queuedDirectory || (!queuedFocusNodeId && !this.document.navigation?.parentPath)) {
      this.document.view = { ...(this.document.view ?? {}), articleLandingMode: "toc" };
    }
    this.plugin.logDebug("view", "set-view-data-parsed", {
      filePath: this.file?.path,
      rootNodeId: this.document.root.id,
      queuedFocusNodeId,
      queuedDirectoryFocusNodeId: queuedDirectory?.focusNodeId
    });
    if (queuedFocusNodeId) {
      this.pendingFocusNodeId = queuedFocusNodeId;
      this.pendingFocusShouldPersist = false;
      this.preferCurrentFileOnNextContextRefresh = true;
      this.preferredCurrentNodeIdOnNextContextRefresh = queuedFocusNodeId;
    }
    if (this.file) void this.plugin.resumePendingAutoUploads(this.file, this.document);
    this.articleContextReady = false;
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
        onChange: (document, options) => {
          this.document = document;
          this.requestSave();
          this.scheduleSavedIndicator();
          if (options?.refreshArticleContext !== false) this.scheduleArticleContextRefresh(320);
        },
        onOpenLink: async (link) => this.openLink(link),
        onExportSvg: async (svg) => this.exportTextFile("svg", svg),
        onExportMarkdown: async (markdown) => this.exportTextFile("md", markdown),
        onExportJson: async (json) => this.exportTextFile("json", json),
        getLastImportFolder: () => this.plugin.settings.lastImportFolder,
        onRememberImportFolder: async (folder) => {
          this.plugin.settings.lastImportFolder = folder;
          await this.plugin.saveSettings();
        },
        onImportMarkdownImages: async (document, sourceDirectory) => this.plugin.importDesktopMarkdownImages(document, sourceDirectory, this.file),
        onExportDocument: async (format) => this.exportArticleFamily(format),
        resolveImage: (source) => this.resolveImage(source),
        onSavePastedImage: async (blob, suggestedName) => this.plugin.savePastedImage(blob, suggestedName, this.file),
        getImageHosts: () => this.plugin.getImageHostChoices(),
        getDefaultUploadHostIds: () => this.plugin.getDefaultUploadHostIds(),
        onUploadImage: async (blob, suggestedName, hostIds) => this.plugin.uploadImageToHosts(blob, suggestedName, hostIds),
        onReadImageSource: async (source) => this.plugin.readImageSource(source, this.file),
        onScheduleAutoUpload: (nodeId, blockId, localPath, suggestedName) => this.plugin.scheduleAutoUpload(this.file, nodeId, blockId, localPath, suggestedName),
        onDeleteRecognizedImageLocalAsset: async (localPath, blockId) => this.plugin.deleteRecognizedImageLocalAsset(this.file?.path ?? "", localPath, blockId),
        onCleanupRemovedImageRemoteAssets: async (block, documentAfterRemoval) => this.plugin.cleanupRemovedImageRemoteAssets(this.file?.path ?? "", block, documentAfterRemoval),
        onRecognizeImage: async (image, blob, remoteUrl, instruction) => this.plugin.recognizeImage(image, blob, undefined, instruction, remoteUrl),
        onEnrichQuestion: async (questionText, onStreamUpdate) => this.plugin.enrichQuestion(questionText, onStreamUpdate),
        onCaptureScreenshot: async (recognizeAfter) => this.plugin.captureScreenshot(recognizeAfter),
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
          this.plugin.logDebug("view", "open-mind-map-callback", { sourcePath: this.file?.path, path, focusNodeId });
          await this.save();
          await this.plugin.openMindMapPath(path, this.file?.path ?? "", this.leaf, focusNodeId);
        },
        onOpenArticleDirectory: async (path, focusNodeId) => {
          const sourcePath = this.file?.path ?? "";
          this.plugin.logDebug("view", "open-article-directory-callback", { sourcePath, path, focusNodeId });
          await this.save();
          await this.plugin.openArticleDirectoryPath(path, sourcePath, this.leaf, focusNodeId);
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
        onArticleReadOnlyChange: async (readOnly) => {
          if (this.plugin.settings.articleLastReadOnly === readOnly) return;
          this.plugin.settings.articleLastReadOnly = readOnly;
          await this.plugin.saveSettings();
        },
        onRenderCode: (block, container) => renderCodeBlock({
          block,
          container,
          pageAppearance: this.document?.appearance,
          defaults: {
            collapsed: this.plugin.settings.defaultCodeCollapsed,
            showLineNumbers: this.plugin.settings.defaultCodeShowLineNumbers,
            theme: this.plugin.settings.defaultCodeTheme,
            autoExpandMaxLines: this.plugin.settings.codeAutoExpandMaxLines,
            autoLineNumbersMinLines: this.plugin.settings.codeAutoLineNumbersMinLines
          },
          renderMarkdown: (markdown, target) => MarkdownRenderer.render(this.app, markdown, target, this.file?.path ?? "", this)
        }),
        onDebugLog: (scope, event, details) => this.plugin.logDebug(scope, event, { filePath: this.file?.path, ...((details && typeof details === "object" && !Array.isArray(details)) ? details as Record<string, unknown> : { details }) })
      }, this.getEditorOptions());
    } else {
      // Apply the new file path/options atomically with the new document so stale scroll
      // transactions from the previous file cannot resolve against the replacement DOM.
      this.editor.setDocument(this.document, false, this.getEditorOptions());
    }
    if (queuedDirectory && this.editor) {
      this.plugin.logDebug("view", "apply-pending-directory", {
        filePath: this.file?.path,
        focusNodeId: queuedDirectory.focusNodeId,
        articleContextReady: this.articleContextReady
      });
      this.editor.showArticleDirectory(queuedDirectory.focusNodeId);
    }
    if (this.pendingFocusNodeId && this.editor) {
      const nodeId = this.pendingFocusNodeId;
      this.plugin.logDebug("view", "apply-pending-focus", { filePath: this.file?.path, nodeId, persistLocation: this.pendingFocusShouldPersist, articleContextReady: this.articleContextReady });
      const persistLocation = this.pendingFocusShouldPersist;
      this.pendingFocusNodeId = null;
      this.pendingFocusShouldPersist = true;
      this.editor.focusNodeById(nodeId, persistLocation);
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
  showArticleDirectory(focusNodeId?: string): void {
    if (!this.editor) return;
    this.editor.showArticleDirectory(focusNodeId);
  }

  /**
   * 保存相关数据，并保持模型、界面和持久化状态的一致性。
   *
   * @param clear 该参数用于 save 流程中的输入或控制。
   */
  async save(clear?: boolean): Promise<void> {
    const file = this.file;
    const document = this.editor?.getDocument() ?? this.document;
    const rootTitle = document ? nodePlainText(document.root).trim() : "";
    const titleChanged = Boolean(document && rootTitle !== this.persistedRootTitle);
    await super.save(clear);
    if (file && document && titleChanged) await this.plugin.syncMindMapTitleToFilename(file, document);
    this.persistedRootTitle = rootTitle;
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
    this.plugin.logDebug("view", "mark-explicit-navigation", { filePath: this.file?.path, focusNodeId, hasEditor: Boolean(this.editor), articleContextReady: this.articleContextReady });
    this.preferCurrentFileOnNextContextRefresh = true;
    const nodeId = focusNodeId ?? this.document?.root.id;
    this.preferredCurrentNodeIdOnNextContextRefresh = nodeId ?? null;
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
  async captureScreenshot(recognizeAfter = false): Promise<void> {
    if (!this.editor) {
      new Notice("当前导图尚未加载");
      return;
    }
    await this.editor.captureScreenshot(recognizeAfter);
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
      onAsk: async (profileId, question, onStreamUpdate) => this.plugin.askAi(profileId, payload, question, onStreamUpdate),
      onSetThinkingMode: (profileId, enabled) => this.plugin.setAiProfileThinkingMode(profileId, enabled),
      onProposeEdit: async (profileId, instruction, onStreamUpdate) => this.plugin.proposeAiEdit(profileId, payload, instruction, onStreamUpdate),
      onConvertToQuestion: (responseText) => this.editor?.applyAndEnrichAiQuestion(responseText, nodeId) ?? false,
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
  private getEditorOptions(preferCurrentFileLocation = false, preferredCurrentNodeId: string | null = null) {
    return {
      defaultNodeShape: this.plugin.settings.defaultNodeShape,
      defaultAppearance: settingsToAppearance(this.plugin.settings),
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
      articleEntryLockMode: this.plugin.settings.articleEntryLockMode,
      articleLastReadOnly: this.plugin.settings.articleLastReadOnly,
      currentFilePath: this.file?.path ?? "",
      readingHomePath: this.readingSections[0]?.filePath ?? this.file?.path ?? "",
      readingLocation: (() => {
        const homePath = this.readingSections[0]?.filePath ?? this.file?.path ?? "";
        return homePath ? (this.plugin.settings.readingLocations[homePath] ?? null) : null;
      })(),
      preferCurrentFileLocation,
      preferredCurrentNodeId,
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
      screenshotRecognizeShortcut: this.plugin.settings.screenshotRecognizeShortcut,
      questionNodesEnabled: this.plugin.settings.questionNodesEnabled,
      questionBankModeEnabled: this.plugin.isQuestionBankFile(this.file),
      questionPracticeOrder: this.plugin.settings.questionPracticeOrder,
      questionMemoryCurveEnabled: this.plugin.settings.questionMemoryCurveEnabled,
      wrongBookMasteryCount: this.plugin.settings.wrongBookMasteryCount,
      articleContextReady: this.articleContextReady,
      articleBaseDepth: this.articleBaseDepth,
      articleTocEntries: [...this.articleTocEntries],
      articleTocMaxDepth: this.plugin.settings.articleTocMaxDepth,
      showArticleMiniMap: this.plugin.settings.showArticleMiniMap,
      articleSectionCollapseEnabled: this.plugin.settings.articleSectionCollapseEnabled,
      articleLeafBulletsEnabled: this.document?.articleStyle?.leafMarkerEnabled ?? this.plugin.settings.articleLeafBulletsEnabled,
      articleLeafBulletColor: this.document?.articleStyle?.leafMarkerColor ?? this.plugin.settings.articleLeafBulletColor,
      articleLeafBulletStyle: this.document?.articleStyle?.leafMarkerStyle ?? this.plugin.settings.articleLeafBulletStyle,
      articleLeafTextAlignment: this.document?.articleStyle?.leafTextAlignment ?? this.plugin.settings.articleLeafTextAlignment,
      articleLeafNumberingEnabled: this.document?.articleStyle?.leafNumberingEnabled ?? this.plugin.settings.articleLeafNumberingEnabled,
      articleLeafNumberingStyle: this.document?.articleStyle?.leafNumberingStyle ?? this.plugin.settings.articleLeafNumberingStyle,
      articleLeafNumberingThreshold: this.document?.articleStyle?.leafNumberingThreshold ?? this.plugin.settings.articleLeafNumberingThreshold,
      showArticleToc: this.showArticleToc,
      articleNavigation: this.articleNavigation,
      readingSections: this.readingSections
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
    this.plugin.logDebug("article-context", "refresh-start", { filePath: file.path, token, pendingFocusNodeId: this.pendingFocusNodeId, preferCurrentFile: this.preferCurrentFileOnNextContextRefresh });
    this.editor?.setArticleContextLoadingProgress({
      phase: "prepare",
      percent: 0,
      processed: 0,
      total: 1,
      message: "正在解析文章结构…"
    });
    try {
      const context = await this.plugin.buildArticleContext(file, document, (progress) => {
        if (token !== this.articleContextToken || this.file?.path !== file.path) return;
        this.editor?.setArticleContextLoadingProgress(progress);
      });
      if (token !== this.articleContextToken || this.file?.path !== file.path) return;
      this.articleBaseDepth = context.baseDepth;
      this.articleTocEntries = context.tocEntries;
      this.showArticleToc = context.showToc;
      this.articleNavigation = context.navigation;
      this.readingSections = context.readingSections;
      this.articleContextReady = true;
      const preferCurrentFile = this.preferCurrentFileOnNextContextRefresh;
      const preferredCurrentNodeId = preferCurrentFile ? this.preferredCurrentNodeIdOnNextContextRefresh : null;
      this.plugin.logDebug("article-context", "refresh-success", { filePath: file.path, token, baseDepth: context.baseDepth, tocEntries: context.tocEntries.length, showToc: context.showToc, readingSections: context.readingSections.length, preferCurrentFile, preferredCurrentNodeId });
      this.editor?.setOptions(this.getEditorOptions(preferCurrentFile, preferredCurrentNodeId), true);
      this.preferCurrentFileOnNextContextRefresh = false;
      this.preferredCurrentNodeIdOnNextContextRefresh = null;
    } catch (error) {
      if (token !== this.articleContextToken || this.file?.path !== file.path) return;
      this.plugin.logDebug("article-context", "refresh-failed", { filePath: file.path, token, error });
      this.editor?.setArticleContextLoadingProgress({
        phase: "complete",
        percent: 100,
        processed: 1,
        total: 1,
        message: "解析失败，已回退到当前导图"
      });
      console.warn("MindMap Studio article context refresh failed", error);
      this.articleBaseDepth = 0;
      this.articleTocEntries = [];
      this.showArticleToc = false;
      this.articleNavigation = undefined;
      this.readingSections = [{
        filePath: file.path,
        document,
        baseDepth: 0,
        numberingDisabled: document.root.articleNumberingMode === "none"
      }];
      this.articleContextReady = true;
      const preferCurrentFile = this.preferCurrentFileOnNextContextRefresh;
      const preferredCurrentNodeId = preferCurrentFile ? this.preferredCurrentNodeIdOnNextContextRefresh : null;
      this.plugin.logDebug("article-context", "refresh-fallback", { filePath: file.path, token, preferCurrentFile, preferredCurrentNodeId });
      this.editor?.setOptions(this.getEditorOptions(preferCurrentFile, preferredCurrentNodeId), true);
      this.preferCurrentFileOnNextContextRefresh = false;
      this.preferredCurrentNodeIdOnNextContextRefresh = null;
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
    const direct = this.app.vault.getAbstractFileByPath(normalizePath(target.replace(/^\/+/, "")));
    const file = direct instanceof TFile
      ? direct
      : this.app.metadataCache.getFirstLinkpathDest(target, this.file?.path ?? "");
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
    const articleExportOptions = {
      leafNumberingEnabled: this.plugin.settings.articleLeafNumberingEnabled,
      leafNumberingStyle: this.plugin.settings.articleLeafNumberingStyle,
      leafNumberingThreshold: this.plugin.settings.articleLeafNumberingThreshold
    };
    if (format === "md") {
      const markdown = readingSectionsToMarkdown(sections, tocMaxDepth, articleExportOptions);
      await this.exportTextFile("md", markdown, true);
      return;
    }
    if (format === "doc") {
      await this.exportBinaryFile("docx", readingSectionsToDocx(sections, tocMaxDepth, articleExportOptions));
      return;
    }
    const html = readingSectionsToHtml(sections, tocMaxDepth, articleExportOptions);
    if (format === "pdf") {
      const result = await saveDesktopPdfFile(file.basename, html);
      if (result?.path) new Notice(`已导出：${result.path}`);
      else if (!result) new Notice("PDF 导出仅支持 Obsidian 桌面端");
    }
    else await this.exportTextFile(format, html, true);
  }
}
