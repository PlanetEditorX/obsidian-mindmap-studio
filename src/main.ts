/**
 * @file main.ts
 * @description 插件入口与跨文件服务层。
 *
 * 注册视图、命令和 Markdown 处理器，并提供父子导图、搜索、图片、图床、迁移、全局模式和设置持久化。
 */

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
  applyImageUploadPatches,
  findNode,
  flattenNodes,
  markdownToDocument,
  nodeContentBlocks,
  nodePlainText,
  reconcileRichTextAfterEdit,
  replaceNodeContentBlocks,
  syncNodeContentFields,
  parseDocument,
  serializeDocument,
  type MindMapDocument,
  type MindMapImageContentBlock,
  type MindMapImageUploadPatch,
  type MindMapImageRemoteSource,
  type MindMapNavigation,
  type MindMapNode,
  type MindMapSubmap
} from "./core/model";
import {
  DEFAULT_SETTINGS,
  MindMapStudioSettingTab,
  normalizeToolbarItemId,
  normalizeToolbarItemOrder,
  createImageHostConfig,
  applyImageHostPreset,
  normalizeSettingsSectionOrder,
  normalizeSettingsExpandedSections,
  normalizeReturnToTopVisibility,
  settingsToAppearance,
  type ImageHostChoice,
  type ImageHostConfig,
  type ImageHostUploadBatch,
  type ImageHostUploadFailure,
  type ImageHostUploadSuccess,
  type ImageUploadCacheEntry,
  type PendingImageHostDeletion,
  type MindMapStudioSettings
} from "./settings";
import { renderStaticMindMap, renderStaticSource } from "./render/static-render";
import { MindMapStudioView, VIEW_TYPE_MINDMAP_STUDIO } from "./view";
import { GlobalMindMapSearchModal, MindMapSearchIndex, type MindMapSearchResult } from "./search/global-search";
import {
  articleChildStartLevel,
  articleDisplayTitle,
  articleNumberLabel,
  buildArticleNodeInfo,
  isArticleHeading,
  isDocumentArticleNumberingDisabled,
  normalizeVisibleModes,
  resolveArticleNumbering,
  resolveArticleSiblingPages,
  type ArticleContextProgress,
  type ArticlePageNavigation,
  type ArticleTocEntry,
  type ReadingSection,
  resolveArticleContextProgressPercent
} from "./article/modes";
import { normalizeArticleEntryLockMode, resolveStartupDisplayMode, shouldPersistDisplayMode } from "./article/display-mode";
import type { DisplayMode } from "./core/model";
import { normalizeReadingLocation, renameReadingLocationPath } from "./article/reading-location";
import {
  ArticleContextCacheStore,
  MindMapDocumentCache,
  type ArticleContextData,
  type MindMapFileRevision
} from "./article/article-context-cache";
import { normalizeAiProfileConfig } from "./ai/config";
import {
  requestAiCompletion,
  requestAiEditProposal,
  requestAiImageRecognition,
  fetchAiProfileModels,
  testAiProfileConnection,
  type AiCompletionResult,
  type AiStreamUpdate
} from "./ai/client";
import type { AiMarkdownPayload } from "./ai/markdown";
import { createFileExplorerPathFilter, fileExplorerFilterSignature } from "./file-explorer-filter";
import { CoalescedJsonWriter } from "./utils/coalesced-json-writer";
import { captureDesktopScreenshot } from "./utils/desktop-capture";
import { RuntimeDebugLog, describeDebugTarget } from "./debug/runtime-debug";
import { recognizeImageWithLocalOcr } from "./vision/local-ocr";
import {
  buildImageRecognitionPrompt,
  normalizeRecognizedText,
  type ImageRecognitionItemResult,
  type RecognizableImage
} from "./vision/recognition";

import {
  buildCompactTimestamp,
  buildDefaultMindMapTitle,
  mimeTypeFromFilename,
  remoteImageSuggestedName,
  sanitizeFileExtension,
  sanitizeFilename as sanitizeCrossPlatformFilename
} from "./utils/filename";
import {
  buildMultipartUploadBody,
  applyImageDeleteTemplate,
  extractResponseString,
  extractImageUrlFromResponse,
  findZiplineFileId,
  normalizeHttpUrl,
  parseUploadHeaders,
  parseUploadResponsePayload,
  sha256Blob
} from "./utils/image-host";
import { comparePluginVersions, extractPluginReleaseFiles, parsePluginUpdateManifest, verifyPluginArchiveHash } from "./utils/plugin-update";
import { copyDesktopMarkdownImagesToDocument } from "./utils/desktop-import";

export const MINDMAP_EXTENSION = "mindmap";
const FILE_EXPLORER_CONTAINER_SELECTOR = ".nav-files-container, .workspace-leaf-content[data-type='file-explorer']";
const FILE_EXPLORER_PATH_SELECTOR = "[data-path]";

const PLUGIN_UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/PlanetEditorX/obsidian-mindmap-studio/main/update.json";
const REMOTE_IMAGE_DELETE_DELAY_MS = 60_000;

/** One deduplicated image auto-upload request waiting for its file batch. */
interface PendingAutoUploadJob {
  key: string;
  mindMapFile: TFile;
  nodeId: string;
  blockId: string;
  localPath: string;
  suggestedName: string;
  hostIds: string[];
}

/** Network result retained until it can be merged into the latest live document. */
interface CompletedAutoUploadJob {
  job: PendingAutoUploadJob;
  patch?: MindMapImageUploadPatch;
  allSucceeded: boolean;
  failures: ImageHostUploadFailure[];
  targetHostNames: string[];
}

/** Returns whether a keyboard event exactly matches one recorded plugin shortcut. */
function matchesRecordedShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+").map((part) => part.trim()).filter(Boolean);
  const key = parts.at(-1);
  if (!key) return false;
  const expectsCtrl = parts.includes("ctrl") || parts.includes("cmd") || parts.includes("mod");
  const expectsShift = parts.includes("shift");
  const expectsAlt = parts.includes("alt");
  const keyMatches = event.key.toLowerCase() === key
    || event.code.toLowerCase() === `key${key}`
    || (key === "space" && event.code === "Space");
  return keyMatches
    && (event.ctrlKey || event.metaKey) === expectsCtrl
    && event.shiftKey === expectsShift
    && event.altKey === expectsAlt;
}

/** Returns whether the event is the standard current-document find shortcut. */
function isPlainFindShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const findKey = key === "f" || event.code === "KeyF";
  return (event.ctrlKey || event.metaKey) && findKey && !event.shiftKey && !event.altKey;
}

/**
 * MindMapStudioPlugin 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export default class MindMapStudioPlugin extends Plugin {
  /** Explicit cross-file chapter targets queued before TextFileView receives the new file data. */
  private readonly pendingMindMapFocus = new Map<string, string>();
  /** Directory landing intents queued before TextFileView receives the parent/home file data. */
  private readonly pendingMindMapDirectory = new Map<string, { focusNodeId?: string }>();
  settings: MindMapStudioSettings = DEFAULT_SETTINGS;
  /** 当前会话使用的显示模式；大纲模式不会写成下次启动默认值。 */
  private activeDisplayMode: DisplayMode = DEFAULT_SETTINGS.defaultViewMode;
  private readonly autoUploadTimers = new Map<string, number>();
  private readonly readyAutoUploadJobs = new Map<TFile, Map<string, PendingAutoUploadJob>>();
  private readonly autoUploadBatchTimers = new Map<TFile, number>();
  private readonly autoUploadFileChains = new Map<TFile, Promise<void>>();
  private readonly autoUploadInFlightKeys = new Set<string>();
  private readonly remoteImageDeleteTimers = new Map<string, number>();
  private readonly autoUploadFileKeys = new WeakMap<TFile, string>();
  private autoUploadFileKeySequence = 0;
  private searchIndex!: MindMapSearchIndex;
  private searchIndexReady: Promise<void> = Promise.resolve();
  /** 当前已挂载的全局搜索实例；当前导图族搜索不使用该单例。 */
  private globalSearchModal: GlobalMindMapSearchModal | null = null;
  /** 防止同一次全局快捷键在索引 ready await 期间重复创建两个 Modal。 */
  private globalSearchLaunchPending = false;
  private fileExplorerFilterTimer: number | null = null;
  private fileExplorerFilterFullScanPending = false;
  private readonly fileExplorerFilterRoots = new Set<Element>();
  private fileExplorerObserver: MutationObserver | null = null;
  private settingsWriter: CoalescedJsonWriter<MindMapStudioSettings> | null = null;
  private persistedFileExplorerFilterSignature = "";
  private unloading = false;
  private readonly runtimeDebugLog = new RuntimeDebugLog();
  /** 会话级已解析文档缓存，避免反复 parseDocument。 */
  private readonly mindMapDocumentCache = new MindMapDocumentCache();
  /** 文章族上下文的 L1/L2 缓存；onload() 中完成磁盘预载。 */
  private articleContextCache!: ArticleContextCacheStore;
  /** 任意 .mindmap 变更都会推进该代数，阻止构建期间发生并发修改时写入陈旧快照。 */
  private mindMapCacheRevision = 0;

  /**
   * 执行“onload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  async onload(): Promise<void> {
    await this.loadSettings();
    this.runtimeDebugLog.setEnabled(this.settings.debugMode, "plugin-startup");
    this.logDebug("plugin", "onload", { version: this.manifest.version, debugMode: this.settings.debugMode });
    this.persistedFileExplorerFilterSignature = fileExplorerFilterSignature(this.settings);
    this.settingsWriter = this.createSettingsWriter();
    this.installFileExplorerFilter();
    const pluginDir = this.manifest.dir ?? normalizePath(`${this.app.vault.configDir}/plugins/${this.manifest.id}`);
    const articleCacheDirectory = normalizePath(`${pluginDir}/cache`);
    this.articleContextCache = new ArticleContextCacheStore(
      this.app.vault.adapter,
      articleCacheDirectory,
      normalizePath(`${articleCacheDirectory}/article-context-cache.json`)
    );
    await this.articleContextCache.initialize();
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
      callback: () => this.openGlobalSearch()
    });
    this.addCommand({
      id: "copy-mind-map-debug-log",
      name: "复制 MindMap Studio 调试记录",
      callback: () => void this.copyDebugLogToClipboard()
    });
    this.registerDomEvent(window, "keydown", (event) => {
      if (matchesRecordedShortcut(event, this.settings.globalSearchShortcut)) {
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) this.openGlobalSearch();
        return;
      }
      const activeView = this.app.workspace.activeLeaf?.view;
      if (!(activeView instanceof MindMapStudioView) || !isPlainFindShortcut(event)) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest(".modal-container")) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) activeView.openMapFamilySearchFromShortcut();
    }, true);
    this.installRuntimeDebugCapture();
    this.addCommand({
      id: "update-mindmap-studio",
      name: "检查并更新 MindMap Studio",
      callback: () => void this.checkForPluginUpdate()
    });
    this.addCommand({
      id: "rebuild-mind-map-search-index",
      name: "重建思维导图搜索索引",
      callback: () => void this.rebuildGlobalSearchIndex()
    });
    this.addCommand({
      id: "ask-ai-about-mind-map",
      name: "询问 AI（当前页面或右键节点）",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "A" }],
      checkCallback: (checking) => {
        const view = this.app.workspace.activeLeaf?.view;
        const available = view instanceof MindMapStudioView;
        if (!checking && available && view instanceof MindMapStudioView) view.askAi();
        return available;
      }
    });
    this.addCommand({
      id: "capture-mind-map-screenshot",
      name: "截图",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "S" }],
      checkCallback: (checking) => {
        const view = this.app.workspace.activeLeaf?.view;
        const available = view instanceof MindMapStudioView;
        if (!checking && available && view instanceof MindMapStudioView) void view.captureScreenshot(false);
        return available;
      }
    });
    this.addCommand({
      id: "capture-and-recognize-mind-map-screenshot",
      name: "截图并识别",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "R" }],
      checkCallback: (checking) => {
        const view = this.app.workspace.activeLeaf?.view;
        const available = view instanceof MindMapStudioView;
        if (!checking && available && view instanceof MindMapStudioView) void view.captureScreenshot(true);
        return available;
      }
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
      name: "切换导图阅读 / 编辑模式",
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
        const available = Boolean(file && file.extension === "md");
        if (!checking && available && file) void this.convertMarkdownFile(file);
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
      }
    }));

    this.registerEvent(this.app.vault.on("create", (file) => {
      if (!(file instanceof TFile) || !this.isMindMapFile(file)) return;
      this.invalidateMindMapCaches(file.path, true);
      this.searchIndex.queueFile(file, 80);
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (!(file instanceof TFile) || !this.isMindMapFile(file)) return;
      this.invalidateMindMapCaches(file.path);
      this.searchIndex.queueFile(file);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (file instanceof TFile && file.extension.toLowerCase() === MINDMAP_EXTENSION) {
        this.invalidateMindMapCaches(file.path);
        this.searchIndex.removeFile(file.path);
      }
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      const isMindMapRename = (file instanceof TFile && this.isMindMapFile(file)) || oldPath.toLowerCase().endsWith(`.${MINDMAP_EXTENSION}`);
      if (isMindMapRename) {
        this.invalidateMindMapCaches(oldPath, true);
        if (file instanceof TFile) this.mindMapDocumentCache.remove(file.path);
      }
      if (file instanceof TFile && this.isMindMapFile(file)) void this.renameReadingLocationPathInSettings(oldPath, file.path);
      if (file instanceof TFile && this.isMindMapFile(file)) {
        this.searchIndex.renameFile(file, oldPath);
      }
      else if (oldPath.toLowerCase().endsWith(`.${MINDMAP_EXTENSION}`)) {
        this.searchIndex.removeFile(oldPath);
      }
    }));

    this.registerMarkdownCodeBlockProcessor("mindmap", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownCodeBlockProcessor("mindmap-json", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownPostProcessor((element, context) => void this.processMindMapEmbeds(element, context));
    this.resumePendingImageHostDeletions();
  }

  /**
   * 执行“onunload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  onunload(): void {
    this.unloading = true;
    if (this.fileExplorerFilterTimer !== null) window.clearTimeout(this.fileExplorerFilterTimer);
    this.fileExplorerFilterTimer = null;
    this.fileExplorerFilterRoots.clear();
    this.fileExplorerFilterFullScanPending = false;
    this.fileExplorerObserver?.disconnect();
    this.fileExplorerObserver = null;
    for (const timer of this.autoUploadTimers.values()) window.clearTimeout(timer);
    this.autoUploadTimers.clear();
    for (const timer of this.autoUploadBatchTimers.values()) window.clearTimeout(timer);
    this.autoUploadBatchTimers.clear();
    this.readyAutoUploadJobs.clear();
    this.autoUploadInFlightKeys.clear();
    for (const timer of this.remoteImageDeleteTimers.values()) window.clearTimeout(timer);
    this.remoteImageDeleteTimers.clear();
    this.searchIndex?.destroy();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO);
    void this.settingsWriter?.flush();
    void this.articleContextCache?.flush();
  }


  /**
   * 打开global search，并保持模型、界面和持久化状态的一致性。
   */
  openGlobalSearch(): void {
    const mounted = this.globalSearchModal?.isMounted() ?? false;
    if (this.globalSearchLaunchPending || mounted) {
      this.logDebug("global-search-modal", "open-deduplicated", {
        launchPending: this.globalSearchLaunchPending,
        mounted
      });
      return;
    }
    this.globalSearchLaunchPending = true;
    this.logDebug("global-search-modal", "open-request", { mounted: false });
    void this.openGlobalSearchAfterIndexReady().finally(() => {
      this.globalSearchLaunchPending = false;
    });
  }

  /**
   * 打开global search after index ready，并保持模型、界面和持久化状态的一致性。
   */
  private async openGlobalSearchAfterIndexReady(): Promise<void> {
    await this.searchIndexReady;
    if (this.globalSearchModal?.isMounted()) {
      this.logDebug("global-search-modal", "open-deduplicated-after-index", { mounted: true });
      return;
    }
    const modal = new GlobalMindMapSearchModal(
      this.app,
      this.searchIndex,
      this.settings.globalSearchMaxResults,
      (result) => this.openGlobalSearchResult(result),
      () => this.searchIndex.rebuildAll(),
      (results, query, replacement, useRegex) => this.replaceAllInSearchResults(results, query, replacement, useRegex),
      (event, details) => this.logDebug("global-search-modal", event, details)
    );
    this.globalSearchModal = modal;
    modal.open();
    this.logDebug("global-search-modal", "open-mounted", { mounted: modal.isMounted() });
  }

  /**
   * 打开map family search，并保持模型、界面和持久化状态的一致性。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param currentDocument 该参数用于 open map family search 流程中的输入或控制。
   */
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
      (results, query, replacement, useRegex) => this.replaceAllInSearchResults(results, query, replacement, useRegex),
      (event, details) => this.logDebug("global-search-modal", event, details),
      familyPaths,
      "搜索当前导图及子导图",
      `“${file.basename}”及递归关联的全部子导图`
    ).open();
  }

  /**
   * 重建global search index，并保持模型、界面和持久化状态的一致性。
   */
  async rebuildGlobalSearchIndex(): Promise<void> {
    new Notice("正在重建思维导图搜索索引…");
    await this.searchIndex.rebuildAll();
    const status = this.searchIndex.getStatus();
    new Notice(`搜索索引已重建：${status.files} 个导图，${status.nodes} 个节点`);
  }

  /**
   * 读取并返回global search index status，并保持模型、界面和持久化状态的一致性。
   */
  getGlobalSearchIndexStatus() {
    return this.searchIndex.getStatus();
  }

  /**
   * 打开global search result，并保持模型、界面和持久化状态的一致性。
   *
   * @param result 该参数用于 open global search result 流程中的输入或控制。
   */
  private async openGlobalSearchResult(result: MindMapSearchResult): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(result.filePath);
    if (!(file instanceof TFile) || !this.isMindMapFile(file)) {
      this.searchIndex.removeFile(result.filePath);
      new Notice(`搜索结果对应的导图已不存在：${result.filePath}`);
      return;
    }
    await this.openAsMindMap(file, undefined, result.nodeId);
  }

  /**
   * 批量替换搜索结果中的节点文字。
   */
  private async replaceAllInSearchResults(results: MindMapSearchResult[], query: string, replacement: string, useRegex: boolean): Promise<number> {
    const byFile = new Map<string, MindMapSearchResult[]>();
    for (const result of results) {
      const list = byFile.get(result.filePath);
      if (list) list.push(result); else byFile.set(result.filePath, [result]);
    }
    const replaceQ = query.trim();
    const replaceIn = (text: string): string => {
      if (!replaceQ || !text) return text;
      if (useRegex) {
        try { return text.replace(new RegExp(replaceQ, "g"), replacement); }
        catch { return text; }
      }
      // Case-insensitive replace to match search behavior
      try {
        const escaped = replaceQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return text.replace(new RegExp(escaped, "gi"), replacement);
      } catch { return text; }
    };
    this.logDebug("global-search", "replace-all-start", {
      resultCount: results.length,
      fileCount: byFile.size,
      queryLength: replaceQ.length,
      replacementLength: replacement.length,
      useRegex
    });

    const promises = Array.from(byFile.entries()).map(async ([filePath, fileResults]) => {
      let localModifiedCount = 0;
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) return 0;
      try {
        const content = await this.app.vault.read(file);
        const doc = parseDocument(content, file.basename);
        const nodeIds = new Set(fileResults.map((r) => r.nodeId));
        let fileModified = false;
        const changedNodeIds = new Set<string>();
        for (const nodeId of nodeIds) {
          const node = findNode(doc.root, nodeId);
          if (!node) continue;
          let nodeModified = false;
          const contentBlocks = nodeContentBlocks(node);
          for (const block of contentBlocks) {
            if (block.type !== "text") continue;
            const nextText = replaceIn(block.text);
            if (nextText === block.text) continue;
            block.richText = reconcileRichTextAfterEdit(block.text, block.richText, nextText);
            block.text = nextText;
            nodeModified = true;
          }
          if (node.note) {
            const newNote = replaceIn(node.note);
            if (newNote !== node.note) {
              node.note = newNote;
              nodeModified = true;
            }
          }
          if (!nodeModified) continue;
          // nodeContentBlocks() returns normalized copies.
          // Persist those changed copies before syncing derived content fields, otherwise
          // syncNodeContentFields() would read the old content and undo the edit.
          node.content = contentBlocks;
          syncNodeContentFields(node);
          changedNodeIds.add(nodeId);
          fileModified = true;
        }
        if (!fileModified) return 0;

        await this.app.vault.modify(file, serializeDocument(doc));
        const persisted = parseDocument(await this.app.vault.read(file), file.basename);
        for (const nodeId of changedNodeIds) {
          const expectedNode = findNode(doc.root, nodeId);
          const persistedNode = findNode(persisted.root, nodeId);
          if (!expectedNode || !persistedNode) continue;
          if (nodePlainText(expectedNode) !== nodePlainText(persistedNode)) continue;
          if (expectedNode.note !== persistedNode.note) continue;
          localModifiedCount += 1;
        }
        await this.searchIndex.refreshFile(file);
        // An open editor retains its own document instance. Refresh it from the
        // persisted replacement so a later editor save cannot restore old text.
        await this.refreshOpenMindMap(file, persisted);
        this.logDebug("global-search", "replace-all-file-complete", {
          filePath,
          requestedNodes: nodeIds.size,
          changedNodes: changedNodeIds.size
        });
      } catch (err) {
        this.logDebug("global-search", "replace-all-file-failed", { filePath, error: err });
        console.warn(`MindMap Studio could not replace in ${filePath}:`, err);
      }
      return localModifiedCount;
    });

    const resultsArray = await Promise.all(promises);
    const modifiedCount = resultsArray.reduce((acc, count) => acc + count, 0);

    this.logDebug("global-search", "replace-all-complete", { modifiedCount, fileCount: byFile.size });
    return modifiedCount;
  }

  /** Writes one structured event into the current in-memory diagnostic session. */
  logDebug(scope: string, event: string, details?: unknown): void {
    this.runtimeDebugLog.log(scope, event, details);
  }

  /** Enables or disables runtime diagnostics and persists the setting. */
  async setDebugMode(enabled: boolean): Promise<void> {
    this.settings.debugMode = enabled;
    this.runtimeDebugLog.setEnabled(enabled, "settings-change");
    this.logDebug("debug", enabled ? "enabled" : "disabled", { version: this.manifest.version });
    await this.saveSettings();
  }

  /** Copies the current bounded diagnostic session as line-delimited JSON. */
  async copyDebugLogToClipboard(): Promise<void> {
    if (!this.settings.debugMode || !this.runtimeDebugLog.isEnabled()) {
      new Notice("请先在 MindMap Studio 设置中开启调试模式");
      return;
    }
    const activeFile = this.app.workspace.getActiveFile();
    const activeView = this.app.workspace.activeLeaf?.view;
    this.logDebug("command", "copy-debug-log", { activeFile: activeFile?.path, viewType: activeView?.getViewType?.() });
    const text = this.runtimeDebugLog.exportText({
      pluginVersion: this.manifest.version,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      activeFile: activeFile?.path ?? null,
      activeViewType: activeView?.getViewType?.() ?? null,
      globalDisplayMode: this.activeDisplayMode,
      retainedEntries: this.runtimeDebugLog.size()
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.body.createEl("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("浏览器拒绝访问剪贴板");
    }
    new Notice(`已复制 ${this.runtimeDebugLog.size()} 条调试记录`);
  }

  /** Captures user operations and uncaught failures while debug mode is enabled. */
  private installRuntimeDebugCapture(): void {
    const logPointer = (event: Event): void => {
      this.logDebug("interaction", event.type, { target: describeDebugTarget(event.target) });
    };
    for (const type of ["click", "dblclick", "contextmenu", "pointerdown"] as const) {
      this.registerDomEvent(document, type, logPointer, true);
    }
    this.registerDomEvent(document, "keydown", (event) => {
      const target = describeDebugTarget(event.target);
      const editable = target?.editable === true;
      const key = editable && event.key.length === 1 ? "[text]" : event.key;
      this.logDebug("interaction", "keydown", {
        key, code: event.code, repeat: event.repeat, ctrl: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey, alt: event.altKey, target
      });
    }, true);
    this.registerDomEvent(document, "wheel", (event) => {
      this.runtimeDebugLog.logThrottled("interaction-wheel", 200, "interaction", "wheel", {
        deltaX: Math.round(event.deltaX), deltaY: Math.round(event.deltaY), target: describeDebugTarget(event.target)
      });
    }, true);
    this.registerDomEvent(document, "scroll", (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      this.runtimeDebugLog.logThrottled(`interaction-scroll:${target?.className ?? "document"}`, 250, "interaction", "scroll", {
        scrollTop: target?.scrollTop, scrollLeft: target?.scrollLeft, target: describeDebugTarget(event.target)
      });
    }, true);
    const onError = (event: ErrorEvent): void => this.logDebug("error", "window-error", {
      message: event.message, filename: event.filename, line: event.lineno, column: event.colno, error: event.error
    });
    const onRejection = (event: PromiseRejectionEvent): void => this.logDebug("error", "unhandled-rejection", { reason: event.reason });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    this.register(() => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    });
    this.registerEvent(this.app.workspace.on("file-open", (file) => this.logDebug("workspace", "file-open", { path: file?.path ?? null })));
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => this.logDebug("workspace", "active-leaf-change", {
      viewType: leaf?.view.getViewType(), filePath: leaf?.view instanceof MindMapStudioView ? leaf.view.file?.path : undefined
    })));
  }

  /**
   * 加载settings，并保持模型、界面和持久化状态的一致性。
   */
  async loadSettings(): Promise<void> {
    const loaded = await this.loadData() as Partial<MindMapStudioSettings> | null;
    this.applyLoadedSettings(loaded);
  }

  /** 规范化已加载或导入的插件配置，并应用到当前会话。 */
  private applyLoadedSettings(loaded: Partial<MindMapStudioSettings> | null): void {
    const raw = (loaded ?? {}) as Partial<MindMapStudioSettings> & Record<string, unknown>;
    let migratedLegacyZiplinePreset = false;
    const imageHosts: ImageHostConfig[] = Array.isArray(raw.imageHosts)
      ? raw.imageHosts.slice(0, 20).flatMap((item, index) => {
        if (!item || typeof item !== "object") return [];
        const candidate = item as Partial<ImageHostConfig>;
        const rawCandidate = item as unknown as Record<string, unknown>;
        const rawPreset = typeof rawCandidate.preset === "string" ? rawCandidate.preset : "";
        const legacyZipline = rawPreset === "zipline-v4" || rawPreset === "zipline-v3";
        if (legacyZipline) migratedLegacyZiplinePreset = true;
        const host = createImageHostConfig(index + 1);
        host.id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : host.id;
        host.name = typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim().slice(0, 120) : host.name;
        host.preset = rawPreset === "zipline" || legacyZipline
          ? "zipline"
          : rawPreset === "imgbb" || rawPreset === "freeimage" ? rawPreset : "custom";
        host.enabled = candidate.enabled !== false;
        host.priority = typeof candidate.priority === "number" && Number.isFinite(candidate.priority)
          ? Math.max(1, Math.min(20, Math.round(candidate.priority)))
          : index + 1;
        host.endpoint = typeof candidate.endpoint === "string" ? candidate.endpoint.trim().slice(0, 4000) : "";
        host.method = candidate.method === "PUT" ? "PUT" : "POST";
        host.bodyMode = candidate.bodyMode === "raw" ? "raw" : "multipart";
        host.fieldName = typeof candidate.fieldName === "string" && candidate.fieldName.trim() ? candidate.fieldName.trim().slice(0, 120) : "file";
        host.headers = typeof candidate.headers === "string" ? candidate.headers.trim().slice(0, 20000) : "";
        host.responsePath = typeof candidate.responsePath === "string" ? candidate.responsePath.trim().slice(0, 500) : "data.url";
        host.deleteKeyResponsePath = typeof candidate.deleteKeyResponsePath === "string" ? candidate.deleteKeyResponsePath.trim().slice(0, 500) : "";
        host.deleteEndpoint = typeof candidate.deleteEndpoint === "string" ? candidate.deleteEndpoint.trim().slice(0, 4000) : "";
        host.deleteMethod = candidate.deleteMethod === "POST" || candidate.deleteMethod === "GET" ? candidate.deleteMethod : "DELETE";
        host.deleteBody = typeof candidate.deleteBody === "string" ? candidate.deleteBody.slice(0, 20000) : "";
        if (legacyZipline) {
          const migratedName = host.name;
          applyImageHostPreset(host, "zipline");
          if (migratedName && !/^Zipline v[34]$/i.test(migratedName)) host.name = migratedName;
        }
        return [host];
      })
      : [];

    const imageUploadCache = raw.imageUploadCache && typeof raw.imageUploadCache === "object" && !Array.isArray(raw.imageUploadCache)
      ? Object.fromEntries(Object.entries(raw.imageUploadCache as Record<string, unknown>).slice(-1000).flatMap(([key, value]) => {
        if (!value || typeof value !== "object") return [];
        const candidate = value as Partial<ImageUploadCacheEntry>;
        const hostId = typeof candidate.hostId === "string" ? candidate.hostId.trim().slice(0, 160) : "";
        const hash = typeof candidate.hash === "string" && /^[0-9a-f]{64}$/i.test(candidate.hash.trim()) ? candidate.hash.trim().toLowerCase() : "";
        const url = typeof candidate.url === "string" && /^https?:\/\//i.test(candidate.url.trim()) ? candidate.url.trim().slice(0, 4000) : "";
        if (!hostId || !hash || !url) return [];
        return [[key, {
          hostId,
          hash,
          url,
          hostName: typeof candidate.hostName === "string" && candidate.hostName.trim() ? candidate.hostName.trim().slice(0, 200) : undefined,
          deleteKey: typeof candidate.deleteKey === "string" && candidate.deleteKey.trim() ? candidate.deleteKey.trim().slice(0, 2000) : undefined,
          uploadedAt: typeof candidate.uploadedAt === "string" ? candidate.uploadedAt.slice(0, 80) : undefined,
          lastUsedAt: typeof candidate.lastUsedAt === "string" ? candidate.lastUsedAt.slice(0, 80) : undefined
        } satisfies ImageUploadCacheEntry]];
      }))
      : {};

    const pendingImageHostDeletions = raw.pendingImageHostDeletions && typeof raw.pendingImageHostDeletions === "object" && !Array.isArray(raw.pendingImageHostDeletions)
      ? Object.fromEntries(Object.entries(raw.pendingImageHostDeletions as Record<string, unknown>).slice(-200).flatMap(([key, value]) => {
        if (!value || typeof value !== "object") return [];
        const candidate = value as Partial<PendingImageHostDeletion>;
        const id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 240) : key.slice(0, 240);
        const hostId = typeof candidate.hostId === "string" ? candidate.hostId.trim().slice(0, 160) : "";
        const url = typeof candidate.url === "string" && /^https?:\/\//i.test(candidate.url.trim()) ? candidate.url.trim().slice(0, 4000) : "";
        const dueAt = typeof candidate.dueAt === "string" && Number.isFinite(Date.parse(candidate.dueAt)) ? candidate.dueAt : "";
        const reason = candidate.reason === "connectivity-test" ? "connectivity-test" : "removed-image";
        if (!id || !hostId || !url || !dueAt) return [];
        return [[id, {
          id,
          hostId,
          url,
          dueAt,
          reason,
          hostName: typeof candidate.hostName === "string" && candidate.hostName.trim() ? candidate.hostName.trim().slice(0, 200) : undefined,
          hash: typeof candidate.hash === "string" && /^[0-9a-f]{64}$/i.test(candidate.hash.trim()) ? candidate.hash.trim().toLowerCase() : undefined,
          deleteKey: typeof candidate.deleteKey === "string" && candidate.deleteKey.trim() ? candidate.deleteKey.trim().slice(0, 2000) : undefined
        } satisfies PendingImageHostDeletion]];
      }))
      : {};

    const enabledIds = imageHosts.reduce((acc, host) => {
      if (host.enabled) acc.add(host.id);
      return acc;
    }, new Set<string>());
    const selectedIds = Array.isArray(raw.autoUploadHostIds)
      ? raw.autoUploadHostIds.filter((id): id is string => typeof id === "string" && enabledIds.has(id))
      : [];
    const hadAiSettings = Array.isArray(raw.aiProfiles);
    const aiProfiles = hadAiSettings
      ? raw.aiProfiles!.flatMap((value, index) => {
        const profile = normalizeAiProfileConfig(value, index + 1);
        return profile ? [profile] : [];
      })
      : DEFAULT_SETTINGS.aiProfiles.map((profile) => ({ ...profile }));
    const aiProfileIds = new Set(aiProfiles.map((profile) => profile.id));
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...raw,
      imageHosts,
      imageUploadCache,
      pendingImageHostDeletions,
      autoUploadEnabled: raw.autoUploadEnabled === true,
      autoUploadDelaySeconds: typeof raw.autoUploadDelaySeconds === "number"
        ? Math.max(0, Math.min(120 * 60, Math.round(raw.autoUploadDelaySeconds)))
        : DEFAULT_SETTINGS.autoUploadDelaySeconds,
      imageRecognitionAutoConfirmDelaySeconds: raw.imageRecognitionAutoConfirmDelaySeconds === 0
        || raw.imageRecognitionAutoConfirmDelaySeconds === 5
        || raw.imageRecognitionAutoConfirmDelaySeconds === 10
        || raw.imageRecognitionAutoConfirmDelaySeconds === 15
        ? raw.imageRecognitionAutoConfirmDelaySeconds
        : null,
      autoUploadHostIds: selectedIds,
      deleteRemoteWhenUnreferenced: migratedLegacyZiplinePreset ? true : raw.deleteRemoteWhenUnreferenced !== false,
      aiProfiles,
      defaultAiProfileId: typeof raw.defaultAiProfileId === "string" && aiProfileIds.has(raw.defaultAiProfileId)
        ? raw.defaultAiProfileId
        : aiProfiles.find((profile) => profile.enabled)?.id ?? aiProfiles[0]?.id ?? "",
      aiMaxInputBytes: typeof raw.aiMaxInputBytes === "number"
        ? Math.max(32 * 1024, Math.min(2 * 1024 * 1024, Math.round(raw.aiMaxInputBytes)))
        : DEFAULT_SETTINGS.aiMaxInputBytes,
      aiDefaultQuestion: typeof raw.aiDefaultQuestion === "string"
        ? raw.aiDefaultQuestion.slice(0, 4000)
        : DEFAULT_SETTINGS.aiDefaultQuestion,
      imageRecognitionMode: raw.imageRecognitionMode === "local-ocr" ? "local-ocr" : "ai",
      imageRecognitionAiProfileId: typeof raw.imageRecognitionAiProfileId === "string" && aiProfileIds.has(raw.imageRecognitionAiProfileId)
        ? raw.imageRecognitionAiProfileId
        : "",
      imageRecognitionPrompt: typeof raw.imageRecognitionPrompt === "string"
        ? raw.imageRecognitionPrompt.slice(0, 4000)
        : DEFAULT_SETTINGS.imageRecognitionPrompt,
      localOcrExecutable: typeof raw.localOcrExecutable === "string" && raw.localOcrExecutable.trim()
        ? raw.localOcrExecutable.trim().slice(0, 2000)
        : DEFAULT_SETTINGS.localOcrExecutable,
      localOcrLanguage: typeof raw.localOcrLanguage === "string" && raw.localOcrLanguage.trim()
        ? raw.localOcrLanguage.trim().slice(0, 240)
        : DEFAULT_SETTINGS.localOcrLanguage,
      localOcrExtraArgs: typeof raw.localOcrExtraArgs === "string"
        ? raw.localOcrExtraArgs.slice(0, 1000)
        : DEFAULT_SETTINGS.localOcrExtraArgs,
      screenshotHideObsidian: raw.screenshotHideObsidian === true,
      screenshotShortcut: typeof raw.screenshotShortcut === "string" && raw.screenshotShortcut.trim()
        ? raw.screenshotShortcut.trim().slice(0, 120)
        : DEFAULT_SETTINGS.screenshotShortcut,
      screenshotRecognizeShortcut: typeof raw.screenshotRecognizeShortcut === "string" && raw.screenshotRecognizeShortcut.trim()
        ? raw.screenshotRecognizeShortcut.trim().slice(0, 120)
        : DEFAULT_SETTINGS.screenshotRecognizeShortcut,
      globalSearchShortcut: typeof raw.globalSearchShortcut === "string" && raw.globalSearchShortcut.trim()
        ? raw.globalSearchShortcut.trim().slice(0, 120)
        : DEFAULT_SETTINGS.globalSearchShortcut,
      questionNodesEnabled: raw.questionNodesEnabled === true,
      questionBankFolder: typeof raw.questionBankFolder === "string"
        ? normalizePath(raw.questionBankFolder.trim().replace(/^\/+|\/+$/g, "")).slice(0, 1000)
        : DEFAULT_SETTINGS.questionBankFolder,
      questionBankFolders: Array.isArray(raw.questionBankFolders)
        ? Array.from(new Set(raw.questionBankFolders.filter((folder): folder is string => typeof folder === "string")
          .map((folder) => normalizePath(folder.trim().replace(/^\/+|\/+$/g, "")).slice(0, 1000)).filter(Boolean)))
        : typeof raw.questionBankFolder === "string" && raw.questionBankFolder.trim()
          ? [normalizePath(raw.questionBankFolder.trim().replace(/^\/+|\/+$/g, "")).slice(0, 1000)]
          : [],
      questionPracticeOrder: raw.questionPracticeOrder === "sequential" ? "sequential" : "random",
      questionMemoryCurveEnabled: raw.questionMemoryCurveEnabled === true,
      wrongBookMasteryCount: typeof raw.wrongBookMasteryCount === "number"
        ? Math.max(1, Math.min(20, Math.round(raw.wrongBookMasteryCount)))
        : DEFAULT_SETTINGS.wrongBookMasteryCount,
      lastImportFolder: typeof raw.lastImportFolder === "string"
        ? raw.lastImportFolder.trim().slice(0, 4000)
        : DEFAULT_SETTINGS.lastImportFolder,
      settingsSectionOrder: normalizeSettingsSectionOrder(raw.settingsSectionOrder),
      settingsExpandedSections: normalizeSettingsExpandedSections(raw.settingsExpandedSections),
      debugMode: raw.debugMode === true,
      syncTitleToFilename: raw.syncTitleToFilename !== false,
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
      visibleToolbarItems: (() => {
        const stored = Array.isArray(raw.visibleToolbarItems)
          ? raw.visibleToolbarItems.flatMap((value): string[] => {
            const id = normalizeToolbarItemId(value);
            return id ? [id] : [];
          })
          : [...DEFAULT_SETTINGS.visibleToolbarItems];
        if (!hadAiSettings && !stored.includes("ai")) stored.push("ai");
        if (!stored.includes("screenshot")) stored.push("screenshot");
        if (!stored.includes("screenshot-recognize")) stored.push("screenshot-recognize");
        return [...new Set(stored)];
      })(),
      toolbarItemOrder: normalizeToolbarItemOrder(Array.isArray(raw.toolbarItemOrder) ? raw.toolbarItemOrder : undefined),
      defaultViewMode: typeof raw.defaultViewMode === "string"
        ? raw.defaultViewMode as DisplayMode
        : DEFAULT_SETTINGS.defaultViewMode,
      articleEntryLockMode: normalizeArticleEntryLockMode(raw.articleEntryLockMode),
      articleLastReadOnly: raw.articleLastReadOnly !== false,
      readingLocations: typeof raw.readingLocations === "object" && raw.readingLocations
        ? Object.fromEntries(Object.entries(raw.readingLocations).flatMap(([path, value]) => {
          const location = normalizeReadingLocation(value);
          return location ? [[path, location] as const] : [];
        }))
        : {},
      articleTocMaxDepth: typeof raw.articleTocMaxDepth === "number"
        ? Math.max(1, Math.min(8, Math.round(raw.articleTocMaxDepth)))
        : DEFAULT_SETTINGS.articleTocMaxDepth,
      articleTocStyle: raw.articleTocStyle === "plain"
        || raw.articleTocStyle === "lines"
        || raw.articleTocStyle === "original"
        || raw.articleTocStyle === "minimal-page"
        || raw.articleTocStyle === "report"
        || raw.articleTocStyle === "magazine"
        || raw.articleTocStyle === "tree"
        ? raw.articleTocStyle
        : "card",
      showArticleMiniMap: raw.showArticleMiniMap !== false,
      showArticleContextProgress: raw.showArticleContextProgress === true,
      articleSectionCollapseEnabled: raw.articleSectionCollapseEnabled === true,
      articleLeafBulletsEnabled: raw.articleLeafBulletsEnabled === true,
      articleLeafBulletColor: typeof raw.articleLeafBulletColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.articleLeafBulletColor)
        ? raw.articleLeafBulletColor
        : "",
      articleLeafBulletStyle: raw.articleLeafBulletStyle === "hollow" || raw.articleLeafBulletStyle === "square" || raw.articleLeafBulletStyle === "dash"
        ? raw.articleLeafBulletStyle
        : "solid",
      articleLeafTextAlignment: raw.articleLeafTextAlignment === "flush" ? "flush" : "auto",
      articleLeafNumberingEnabled: raw.articleLeafNumberingEnabled === true,
      articleLeafNumberingStyle: raw.articleLeafNumberingStyle === "circled" ? "circled" : "next-level",
      articleLeafNumberingThreshold: typeof raw.articleLeafNumberingThreshold === "number"
        ? Math.max(1, Math.min(20, Math.round(raw.articleLeafNumberingThreshold)))
        : DEFAULT_SETTINGS.articleLeafNumberingThreshold,
      hideAssetFolderInFileExplorer: raw.hideAssetFolderInFileExplorer === true,
      hideConfiguredFilesInFileExplorer: raw.hideConfiguredFilesInFileExplorer === true,
      hiddenFileExtensions: typeof raw.hiddenFileExtensions === "string" ? raw.hiddenFileExtensions.slice(0, 2000) : "",
      hiddenFileFolders: typeof raw.hiddenFileFolders === "string" ? raw.hiddenFileFolders.slice(0, 4000) : "",
      readingProgressPosition: raw.readingProgressPosition === "bottom" || raw.readingProgressPosition === "left" || raw.readingProgressPosition === "right"
        ? raw.readingProgressPosition
        : "top",
      returnToTopVisibility: normalizeReturnToTopVisibility(raw.returnToTopVisibility),
      twoFingerGestureAction: raw.twoFingerGestureAction === "pan" ? "pan" : "zoom",
      defaultNodeTextAlign: raw.defaultNodeTextAlign === "left" || raw.defaultNodeTextAlign === "right" || raw.defaultNodeTextAlign === "center"
        ? raw.defaultNodeTextAlign
        : DEFAULT_SETTINGS.defaultNodeTextAlign,
      nodeVisualStyle: raw.nodeVisualStyle === "branch" || raw.nodeVisualStyle === "card"
        ? raw.nodeVisualStyle
        : DEFAULT_SETTINGS.nodeVisualStyle,
      nodeWidthMode: raw.nodeWidthMode === "fixed" || raw.nodeWidthMode === "auto"
        ? raw.nodeWidthMode
        : DEFAULT_SETTINGS.nodeWidthMode,
      defaultNodeWidth: typeof raw.defaultNodeWidth === "number"
        ? Math.max(100, Math.min(900, Math.round(raw.defaultNodeWidth)))
        : DEFAULT_SETTINGS.defaultNodeWidth,
      autoNodeMaxWidth: typeof raw.autoNodeMaxWidth === "number"
        ? Math.max(120, Math.min(900, Math.round(raw.autoNodeMaxWidth)))
        : DEFAULT_SETTINGS.autoNodeMaxWidth,
      defaultThemePreset: [
        "classic-indigo", "ocean-blue", "forest-green", "sunset-orange", "lavender-dream",
        "candy-pop", "paper-note", "minimal-ink", "dark-neon", "mint-clean",
        "spectrum-flow", "executive-navy", "botanical-calm", "midnight-signal", "sketchbook-warm", "monochrome-air"
      ].includes(String(raw.defaultThemePreset)) ? raw.defaultThemePreset as MindMapStudioSettings["defaultThemePreset"] : DEFAULT_SETTINGS.defaultThemePreset,
      edgeWidthMode: raw.edgeWidthMode === "uniform" || raw.edgeWidthMode === "tapered"
        ? raw.edgeWidthMode
        : DEFAULT_SETTINGS.edgeWidthMode,
      edgeMinWidth: typeof raw.edgeMinWidth === "number"
        ? Math.max(0.25, Math.min(8, raw.edgeMinWidth))
        : DEFAULT_SETTINGS.edgeMinWidth,
      rootColor: typeof raw.rootColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.rootColor)
        ? raw.rootColor
        : DEFAULT_SETTINGS.rootColor,
      rootTextColor: typeof raw.rootTextColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.rootTextColor)
        ? raw.rootTextColor
        : DEFAULT_SETTINGS.rootTextColor,
      colorfulBranches: typeof raw.colorfulBranches === "boolean"
        ? raw.colorfulBranches
        : DEFAULT_SETTINGS.colorfulBranches,
      branchColors: Array.isArray(raw.branchColors)
        ? raw.branchColors.filter((value): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)).slice(0, 12)
        : [...DEFAULT_SETTINGS.branchColors]
    } as MindMapStudioSettings;
    delete (this.settings as unknown as Record<string, unknown>).showTaskProgress;
    this.settings.defaultViewMode = resolveStartupDisplayMode(this.settings.defaultViewMode, this.settings.visibleModes);
    this.activeDisplayMode = this.settings.defaultViewMode;
  }

  /** 导入插件配置，规范化后立即保存并刷新所有已打开视图。 */
  async importSettings(settings: unknown): Promise<void> {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new Error("配置文件必须是一个 JSON 对象。");
    }
    this.applyLoadedSettings(settings as Partial<MindMapStudioSettings>);
    this.runtimeDebugLog.setEnabled(this.settings.debugMode, "settings-import");
    this.logDebug("settings", "import-complete", { debugMode: this.settings.debugMode });
    await this.saveSettings();
    this.refreshOpenViews();
  }

  /** Creates the single-flight settings writer used by every settings mutation path. */
  private createSettingsWriter(): CoalescedJsonWriter<MindMapStudioSettings> {
    return new CoalescedJsonWriter<MindMapStudioSettings>({
      delayMs: 35,
      snapshot: () => JSON.parse(JSON.stringify(this.settings)) as MindMapStudioSettings,
      write: async (snapshot) => {
        await this.saveData(snapshot);
        const nextFilterSignature = fileExplorerFilterSignature(snapshot);
        if (nextFilterSignature !== this.persistedFileExplorerFilterSignature) {
          this.persistedFileExplorerFilterSignature = nextFilterSignature;
          if (!this.unloading) this.scheduleFileExplorerFilter();
        }
      }
    });
  }

  /**
   * 合并短时间内连续触发的设置保存，并保证所有磁盘写入严格串行。
   */
  async saveSettings(): Promise<void> {
    if (!this.settingsWriter) this.settingsWriter = this.createSettingsWriter();
    await this.settingsWriter.request();
  }

  /** Checks the release-workflow update manifest, verifies its archive, and requires a full app restart to activate it. */
  async checkForPluginUpdate(): Promise<"up-to-date" | "updated"> {
    new Notice("正在检查 MindMap Studio 更新…");
    const response = await requestUrl({
      url: PLUGIN_UPDATE_MANIFEST_URL,
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
      throw: true
    });
    const release = parsePluginUpdateManifest(response.text);
    if (comparePluginVersions(release.version, this.manifest.version) <= 0) {
      new Notice(`已是最新版本（${this.manifest.version}）`);
      return "up-to-date";
    }
    const archiveResponse = await requestUrl({ url: release.downloadUrl, method: "GET", throw: true });
    const archive = await archiveResponse.arrayBuffer;
    if (!await verifyPluginArchiveHash(archive, release.sha256)) throw new Error("更新包 SHA-256 校验失败，已取消安装");
    const update = extractPluginReleaseFiles(archive);
    if (update.manifest.id !== this.manifest.id) throw new Error("更新包的插件标识不匹配，已取消安装");
    if (update.manifest.version !== release.version) throw new Error("更新包版本与更新信息不一致，已取消安装");

    const pluginDir = this.manifest.dir ?? normalizePath(`${this.app.vault.configDir}/plugins/${this.manifest.id}`);
    const adapter = this.app.vault.adapter;
    const files = [
      { path: normalizePath(`${pluginDir}/main.js`), content: update.main },
      { path: normalizePath(`${pluginDir}/styles.css`), content: update.styles },
      { path: normalizePath(`${pluginDir}/manifest.json`), content: new TextEncoder().encode(update.manifestText).buffer }
    ];
    const originals = await Promise.all(files.map(async (file) => ({ path: file.path, content: await adapter.readBinary(file.path) })));
    try {
      for (const file of files) await adapter.writeBinary(file.path, file.content);
    } catch (error) {
      await Promise.all(originals.map((file) => adapter.writeBinary(file.path, file.content).catch(() => undefined)));
      throw error;
    }
    new Notice(`MindMap Studio 已更新至 ${update.manifest.version}。请完整重启 Obsidian 以启用新版本。`, 10000);
    return "updated";
  }

  /** 使用指定 AI 配置发送当前 Markdown 上下文。 */
  async askAi(profileId: string, payload: AiMarkdownPayload, question: string, onStreamUpdate?: (update: AiStreamUpdate) => void, signal?: AbortSignal): Promise<AiCompletionResult> {
    const profile = this.settings.aiProfiles.find((item) => item.id === profileId && item.enabled);
    if (!profile) throw new Error("AI 接口不存在或未启用");
    return requestAiCompletion(profile, payload, question, onStreamUpdate, signal);
  }

  /** Converts a transcribed question into a verified original-question lookup result when the selected model supports web retrieval. */
  async enrichQuestion(questionText: string, onStreamUpdate?: (update: AiStreamUpdate) => void): Promise<string> {
    const markdown = questionText.trim();
    if (!markdown) throw new Error("题目内容为空，无法检索原题");
    const profile = this.settings.aiProfiles.find((item) => item.id === this.settings.defaultAiProfileId && item.enabled);
    if (!profile) throw new Error("默认 AI 接口不存在或未启用");
    const byteSize = new TextEncoder().encode(markdown).byteLength;
    const payload: AiMarkdownPayload = {
      scope: "subtree",
      scopeNodeId: null,
      scopeLabel: "待检索题目",
      filePath: "",
      markdown,
      byteSize,
      characterCount: markdown.length,
      nodeCount: 1,
      maxInputBytes: this.settings.aiMaxInputBytes,
      overLimit: byteSize > this.settings.aiMaxInputBytes
    };
    const instruction = [
      "将给出的题目整理为题库结构，并在你具备联网检索能力时搜索精确原题。",
      "只在找到可验证的原题来源时返回 found:true；必须提供可访问的 sourceUrl 和 sourceTitle。",
      "不能联网、未找到或来源不可靠时返回 found:false；此时仍需基于题目独立分析，补全缺失的 answer 和 explanation，但 sourceTitle、sourceUrl 必须留空，并明确不要伪造来源。",
      "explanation 必须写出可核对的 AI 解析过程，包括关键条件、判断或计算步骤、选项排除理由以及最终结论；不得只重复答案。",
      "只返回 JSON，不要 Markdown：{\"found\":boolean,\"mode\":\"choice|judgment|essay\",\"stem\":\"\",\"options\":[{\"label\":\"A\",\"content\":\"\"}],\"answer\":\"\",\"explanation\":\"\",\"tags\":[\"\"],\"sourceTitle\":\"\",\"sourceUrl\":\"\"}。"
    ].join("\n");
    const result = await requestAiCompletion(profile, payload, instruction, onStreamUpdate);
    return result.text;
  }

  /** 使用指定 AI 配置生成 Markdown 修改提案，但不直接修改导图。 */
  async proposeAiEdit(profileId: string, payload: AiMarkdownPayload, instruction: string, onStreamUpdate?: (update: AiStreamUpdate) => void, signal?: AbortSignal): Promise<AiCompletionResult> {
    const profile = this.settings.aiProfiles.find((item) => item.id === profileId && item.enabled);
    if (!profile) throw new Error("AI 接口不存在或未启用");
    return requestAiEditProposal(profile, payload, instruction, onStreamUpdate, signal);
  }

  /** 使用当前识图模式处理单张图片；AI 模式可指定接口，本地 OCR 模式不会联网。 */
  async recognizeImage(
    image: RecognizableImage,
    blob: Blob,
    profileId?: string,
    instruction?: string,
    remoteUrl?: string,
    signal?: AbortSignal
  ): Promise<ImageRecognitionItemResult> {
    if (this.settings.imageRecognitionMode === "local-ocr") {
      const text = await recognizeImageWithLocalOcr(blob, {
        executable: this.settings.localOcrExecutable,
        language: this.settings.localOcrLanguage,
        extraArgs: this.settings.localOcrExtraArgs
      });
    return { ...image, text: normalizeRecognizedText(text), mode: "local-ocr" };
    }
    const selectedProfileId = profileId || this.settings.imageRecognitionAiProfileId || this.settings.defaultAiProfileId;
    const profile = this.settings.aiProfiles.find((item) => item.id === selectedProfileId && item.enabled);
    if (!profile) throw new Error("AI 识图接口不存在或未启用");
    const result = await requestAiImageRecognition(
      profile,
      remoteUrl || blob,
      buildImageRecognitionPrompt(image, instruction ?? this.settings.imageRecognitionPrompt),
      signal
    );
    return {
      ...image,
      text: normalizeRecognizedText(result.text),
      mode: "ai",
      model: result.model
    };
  }

  /** 按普通截图或截图并识别模式启动桌面覆盖层，并根据设置决定是否隐藏 Obsidian。 */
  async captureScreenshot(recognizeAfter = false) {
    return captureDesktopScreenshot(
      this.settings.screenshotHideObsidian,
      recognizeAfter ? "capture-recognize" : "capture"
    );
  }

  /** 使用最小请求检测 AI 接口、鉴权和模型是否可用。 */
  async testAiProfile(profileId: string): Promise<void> {
    const profile = this.settings.aiProfiles.find((item) => item.id === profileId);
    if (!profile) {
      new Notice("找不到该 AI 接口配置");
      return;
    }
    if (!profile.endpoint.trim()) {
      new Notice(`请先填写 ${profile.name} 的接口地址`);
      return;
    }
    if (!profile.model.trim()) {
      new Notice(`请先填写 ${profile.name} 的模型名称`);
      return;
    }
    const started = performance.now();
    try {
      const result = await testAiProfileConnection(profile);
      const elapsed = Math.max(1, Math.round(performance.now() - started));
      const preview = result.text.replace(/\s+/g, " ").trim().slice(0, 160);
      new Notice(`${profile.name} 检测成功（${elapsed} ms）\n模型：${result.model}\n响应：${preview}`, 8000);
    } catch (error) {
      console.error("MindMap Studio AI connectivity test failed", error);
      new Notice(`${profile.name} 检测失败：${error instanceof Error ? error.message : String(error)}`, 8000);
    }
  }

  /** 获取配置服务公开的模型目录，不改变当前选择的模型。 */
  async getAiProfileModels(profileId: string): Promise<string[]> {
    const profile = this.settings.aiProfiles.find((item) => item.id === profileId);
    if (!profile) throw new Error("找不到该 AI 接口配置");
    if (!profile.endpoint.trim()) throw new Error(`请先填写 ${profile.name} 的接口地址`);
    return fetchAiProfileModels(profile);
  }

  /** 保存由 AI 助手窗口切换的深度思考状态，并与设置页共用同一配置。 */
  async setAiProfileThinkingMode(profileId: string, enabled: boolean): Promise<void> {
    const profile = this.settings.aiProfiles.find((item) => item.id === profileId && item.enabled);
    if (!profile) throw new Error("AI 接口不存在或未启用");
    profile.thinkingMode = enabled ? "on" : "off";
    await this.saveSettings();
  }

  /** Installs a lightweight File Explorer observer; it changes visibility only, never vault data. */
  private installFileExplorerFilter(): void {
    const observe = (): void => {
      this.fileExplorerObserver?.disconnect();
      this.fileExplorerObserver = new MutationObserver((records) => {
        const roots = this.fileExplorerMutationRoots(records);
        if (roots.length) this.scheduleFileExplorerFilter(roots);
      });
      this.fileExplorerObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-path"]
      });
      this.scheduleFileExplorerFilter();
    };
    this.app.workspace.onLayoutReady(observe);
    this.register(() => this.fileExplorerObserver?.disconnect());
  }

  /** Collects only added or retargeted File Explorer subtrees that can contain unfiltered paths. */
  private fileExplorerMutationRoots(records: MutationRecord[]): Element[] {
    const roots = new Set<Element>();
    const addRoot = (candidate: Element): void => {
      for (const existing of roots) {
        if (existing.contains(candidate)) return;
        if (candidate.contains(existing)) roots.delete(existing);
      }
      roots.add(candidate);
    };
    const collect = (node: Node): void => {
      if (!(node instanceof Element)) return;
      if (node.matches(FILE_EXPLORER_CONTAINER_SELECTOR) || node.closest(FILE_EXPLORER_CONTAINER_SELECTOR)) addRoot(node);
      node.querySelectorAll<Element>(FILE_EXPLORER_CONTAINER_SELECTOR).forEach(addRoot);
    };
    for (const record of records) {
      if (record.type === "attributes") collect(record.target);
      record.addedNodes.forEach(collect);
    }
    return Array.from(roots);
  }

  /** Adds one incremental scan root while removing nested duplicates from the pending batch. */
  private queueFileExplorerFilterRoot(root: Element): void {
    for (const existing of this.fileExplorerFilterRoots) {
      if (existing.contains(root)) return;
      if (root.contains(existing)) this.fileExplorerFilterRoots.delete(existing);
    }
    this.fileExplorerFilterRoots.add(root);
  }

  /** Applies the compiled visibility rule to one File Explorer subtree. */
  private applyFileExplorerFilterRoot(root: Element, shouldHidePath: (path: string) => boolean): void {
    const apply = (element: HTMLElement): void => {
      const path = element.dataset.path;
      if (!path) return;
      const fileItem = element.closest<HTMLElement>(".tree-item")
        ?? element.closest<HTMLElement>(".nav-file, .nav-folder")
        ?? element;
      fileItem.toggleClass("mms-file-explorer-hidden", shouldHidePath(path));
    };
    if (root instanceof HTMLElement && root.matches(FILE_EXPLORER_PATH_SELECTOR)) apply(root);
    root.querySelectorAll<HTMLElement>(FILE_EXPLORER_PATH_SELECTOR).forEach(apply);
  }

  /** Defers filtering and scans either the whole File Explorer or only newly changed subtrees. */
  private scheduleFileExplorerFilter(roots?: Iterable<Element>): void {
    if (roots) {
      if (!this.fileExplorerFilterFullScanPending) {
        for (const root of roots) this.queueFileExplorerFilterRoot(root);
      }
    } else {
      this.fileExplorerFilterFullScanPending = true;
      this.fileExplorerFilterRoots.clear();
    }
    if (this.fileExplorerFilterTimer !== null) return;
    this.fileExplorerFilterTimer = window.setTimeout(() => {
      this.fileExplorerFilterTimer = null;
      const fullScan = this.fileExplorerFilterFullScanPending;
      const pendingRoots = fullScan
        ? Array.from(document.querySelectorAll<Element>(FILE_EXPLORER_CONTAINER_SELECTOR))
        : Array.from(this.fileExplorerFilterRoots);
      this.fileExplorerFilterFullScanPending = false;
      this.fileExplorerFilterRoots.clear();
      const shouldHidePath = createFileExplorerPathFilter(this.settings);
      for (const root of pendingRoots) {
        if (!root.isConnected) continue;
        this.applyFileExplorerFilterRoot(root, shouldHidePath);
      }
    }, 80);
  }

  /** 返回当前会话正在使用的显示模式。大纲可在会话内同步，但不会成为下次启动默认值。 */
  getActiveDisplayMode(): DisplayMode {
    return this.settings.visibleModes.includes(this.activeDisplayMode)
      ? this.activeDisplayMode
      : this.settings.visibleModes.includes("mindmap")
        ? "mindmap"
        : this.settings.visibleModes[0] ?? "mindmap";
  }

  /** Returns whether a map path belongs to the configured question-bank folder or one of its descendants. */
  isQuestionBankFile(file: TFile | null): boolean {
    const folders = Array.from(new Set([...this.settings.questionBankFolders, this.settings.questionBankFolder]))
      .map((folder) => normalizePath(folder)).filter(Boolean);
    return Boolean(file && folders.some((folder) => file.parent?.path === folder || file.path.startsWith(`${folder}/`)));
  }

  /**
   * 同步所有已打开视图的显示模式。导图、文章和通读会持久化为下次启动模式；
   * 大纲仅记录在当前会话，避免重新打开插件时默认进入大纲。
   *
   * @param mode 当前布局或显示模式。
   */
  async setGlobalDisplayMode(mode: DisplayMode): Promise<void> {
    if (!this.settings.visibleModes.includes(mode)) return;
    this.activeDisplayMode = mode;
    if (shouldPersistDisplayMode(mode) && this.settings.defaultViewMode !== mode) {
      this.settings.defaultViewMode = mode;
      await this.saveSettings();
    }
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView) leaf.view.applyGlobalDisplayMode(mode);
    }
  }

  /**
   * 将文件重命名同步到所有语义阅读位置链，避免改名后恢复记录失联。
   */
  private async renameReadingLocationPathInSettings(oldPath: string, newPath: string): Promise<void> {
    if (oldPath === newPath) return;
    let changed = false;
    const nextLocations: MindMapStudioSettings["readingLocations"] = {};
    for (const [homePath, location] of Object.entries(this.settings.readingLocations)) {
      const nextHomePath = homePath === oldPath ? newPath : homePath;
      const nextLocation = renameReadingLocationPath(location, oldPath, newPath);
      if (nextHomePath !== homePath || nextLocation.filePath !== location.filePath
        || nextLocation.fallbacks.some((fallback, index) => fallback.filePath !== location.fallbacks[index]?.filePath)) {
        changed = true;
      }
      nextLocations[nextHomePath] = nextLocation;
    }
    if (!changed) return;
    this.settings.readingLocations = nextLocations;
    await this.saveSettings();
  }

  /**
   * 执行“reset all settings”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  async resetAllSettings(): Promise<void> {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as MindMapStudioSettings;
    this.activeDisplayMode = this.settings.defaultViewMode;
    this.runtimeDebugLog.setEnabled(false, "settings-reset");
    await this.saveSettings();
    this.refreshOpenViews();
  }

  /**
   * 刷新open views，并保持模型、界面和持久化状态的一致性。
   */
  refreshOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView) leaf.view.refreshAppearance();
    }
  }

  /**
   * 创建configured document，并保持模型、界面和持久化状态的一致性。
   *
   * @param title 文档、节点或导出文件的显示标题。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  createConfiguredDocument(title: string): MindMapDocument {
    const document = createDefaultDocument(title);
    document.layout = this.settings.defaultLayout;
    document.theme = this.settings.defaultTheme;
    document.appearance = settingsToAppearance(this.settings);
    document.view = { readOnly: false };
    return document;
  }

  /**
   * 解析并确定mind map file，并保持模型、界面和持久化状态的一致性。
   *
   * @param path 仓库内目标路径。
   * @param sourcePath 该参数用于 resolve mind map file 流程中的输入或控制。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  private resolveMindMapFile(path: string, sourcePath = ""): TFile | null {
    const cleaned = path.replace(/^\[\[|\]\]$/g, "").split("|")[0]?.trim() ?? path;
    const normalized = normalizePath(cleaned);
    const direct = this.app.vault.getAbstractFileByPath(normalized);
    if (direct instanceof TFile && this.isMindMapFile(direct)) return direct;
    const linked = this.app.metadataCache.getFirstLinkpathDest(cleaned, sourcePath);
    return linked instanceof TFile && this.isMindMapFile(linked) ? linked : null;
  }

  /**
   * 执行“read mind map document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param file 目标 Obsidian 文件对象。
   * @returns 异步操作完成后的结果。
   */
  private async readMindMapDocument(file: TFile): Promise<MindMapDocument> {
    const cached = this.getCachedMindMapDocument(file);
    if (cached) return cached;
    const document = parseDocument(await this.app.vault.cachedRead(file), file.basename);
    this.rememberMindMapDocument(file, document);
    return document;
  }

  /** 返回文件当前的 mtime + size 版本，用于同步缓存校验。 */
  private mindMapFileRevision(file: TFile): MindMapFileRevision {
    return { path: normalizePath(file.path), mtime: file.stat.mtime, size: file.stat.size };
  }

  /** 按仓库路径读取一个仍存在的 .mindmap 文件版本。 */
  private resolveMindMapFileRevision(path: string): MindMapFileRevision | null {
    const file = this.app.vault.getAbstractFileByPath(normalizePath(path));
    return file instanceof TFile && this.isMindMapFile(file) ? this.mindMapFileRevision(file) : null;
  }

  /** 从会话级文档缓存同步恢复一个隔离的已解析文档。 */
  getCachedMindMapDocument(file: TFile): MindMapDocument | null {
    return this.mindMapDocumentCache.get(this.mindMapFileRevision(file));
  }

  /**
   * 为缺失 `navigation.parentPath` 的旧子导图恢复父级导航。
   * 先等待全局搜索索引完成启动时的增量校验，再从已校验条目中反查父级挂载关系。
   * 恢复关系必须来自父节点真实的 `submap.path`，因此不会把普通节点链接当成父导图。
   *
   * @param file 当前打开的 .mindmap 文件。
   * @param document 当前解析文档；已有父级导航时直接复用。
   * @returns 恢复出的父级导航；当前文件确为顶层导图时返回 null。
   */
  async recoverSubmapNavigation(file: TFile, document: MindMapDocument): Promise<MindMapNavigation | null> {
    if (document.navigation?.parentPath) return { ...document.navigation };

    try {
      await this.searchIndexReady;
    } catch (error) {
      this.logDebug("navigation", "parent-recovery-index-failed", { filePath: file.path, error });
    }
    const navigation = this.searchIndex.findParentNavigationForChild(file.path);
    if (!navigation?.parentPath) return null;

    this.logDebug("navigation", "parent-recovered-from-submap-index", {
      filePath: file.path,
      parentPath: navigation.parentPath,
      parentNodeId: navigation.parentNodeId
    });
    return { ...navigation };
  }

  /** 记录当前已解析文档，供后续视图打开和文章族遍历复用。 */
  rememberMindMapDocument(file: TFile, document: MindMapDocument): void {
    this.mindMapDocumentCache.put(this.mindMapFileRevision(file), document);
  }

  /** 返回当前缓存代数；文章上下文构建用它检测构建期间是否有并发文件变化。 */
  getMindMapCacheRevision(): number {
    return this.mindMapCacheRevision;
  }

  /**
   * 同步恢复仍与全部父子文件版本一致的文章上下文。当前物理页始终替换为刚加载的文档，
   * 因此缓存只复用跨文件计算结果，不会覆盖 TextFileView 本次收到的数据。
   */
  getCachedArticleContext(file: TFile, currentDocument: MindMapDocument): ArticleContextData | null {
    const context = this.articleContextCache.get(file.path, (path) => this.resolveMindMapFileRevision(path));
    if (!context) return null;
    context.readingSections = context.readingSections.map((section) => section.filePath === file.path
      ? { ...section, document: currentDocument }
      : section);
    for (const section of context.readingSections) {
      const target = this.app.vault.getAbstractFileByPath(normalizePath(section.filePath));
      if (target instanceof TFile && this.isMindMapFile(target)) this.rememberMindMapDocument(target, section.document);
    }
    return context;
  }

  /**
   * 保存一次成功构建的文章上下文。若构建期间任何 .mindmap 发生过变化，则放弃本次快照，
   * 避免旧文档内容与新的 mtime/size 被错误配对。
   */
  cacheArticleContext(file: TFile, context: ArticleContextData, buildRevision: number): boolean {
    if (buildRevision !== this.mindMapCacheRevision) return false;
    const dependencies: MindMapFileRevision[] = [];
    const seen = new Set<string>();
    for (const section of context.readingSections) {
      const path = normalizePath(section.filePath);
      if (seen.has(path)) continue;
      seen.add(path);
      const revision = this.resolveMindMapFileRevision(path);
      if (!revision) return false;
      dependencies.push(revision);
    }
    if (!seen.has(file.path)) {
      const revision = this.resolveMindMapFileRevision(file.path);
      if (!revision) return false;
      dependencies.push(revision);
    }
    if (buildRevision !== this.mindMapCacheRevision) return false;
    this.articleContextCache.put(file.path, context, dependencies);
    for (const section of context.readingSections) {
      const target = this.app.vault.getAbstractFileByPath(normalizePath(section.filePath));
      if (target instanceof TFile && this.isMindMapFile(target)) this.rememberMindMapDocument(target, section.document);
    }
    return true;
  }

  /**
   * 让一个物理导图及所有依赖它的文章族缓存失效。create/rename 可选择清空全部上下文，
   * 因为新路径可能让旧快照中未记录的“缺失子导图”引用变为可解析。
   */
  invalidateMindMapCaches(filePath: string, clearAllArticleContexts = false): void {
    this.mindMapCacheRevision += 1;
    this.mindMapDocumentCache.remove(filePath);
    if (clearAllArticleContexts) this.articleContextCache.clear();
    else this.articleContextCache.invalidateDependency(filePath);
  }

  /**
   * 按自动或手动文章层级查找目标节点的绝对深度，而不是直接使用物理树深度。
   *
   * @param root 节点树的根节点。
   * @param nodeId 目标节点的稳定标识。
   * @param baseDepth 当前物理导图根节点的跨文件基础层级。
   * @returns 目标节点的文章层级；不存在时返回 null。
   */
  private findArticleNodeDepth(root: MindMapNode, nodeId: string, baseDepth = 0): number | null {
    return buildArticleNodeInfo(root, baseDepth).find((entry) => entry.node.id === nodeId)?.depth ?? null;
  }

  /**
   * 执行“compute article base depth”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param document 要处理的思维导图文档。
   * @param visited 该参数用于 compute article base depth 流程中的输入或控制。
   * @returns 计算得到的数值结果。
   */
  private async computeArticleBaseDepth(file: TFile, document: MindMapDocument, visited = new Set<string>()): Promise<number> {
    if (visited.has(file.path) || !document.navigation?.parentPath) return 0;
    visited.add(file.path);
    const parentFile = this.resolveMindMapFile(document.navigation.parentPath, file.path);
    if (!parentFile) return 0;
    const parentDocument = await this.readMindMapDocument(parentFile);
    const parentBase = await this.computeArticleBaseDepth(parentFile, parentDocument, visited);
    let parentNodeId = document.navigation.parentNodeId;
    if (!parentNodeId) {
      const currentPath = normalizePath(file.path);
      parentNodeId = flattenNodes(parentDocument.root).find((node) => {
        if (!node.submap?.path) return false;
        return this.resolveMindMapFile(node.submap.path, parentFile.path)?.path === currentPath;
      })?.id;
    }
    return parentNodeId
      ? this.findArticleNodeDepth(parentDocument.root, parentNodeId, parentBase) ?? parentBase + 1
      : parentBase + 1;
  }

  /**
   * 沿子导图 navigation.parentPath 逐级回溯父文件，计算当前子导图在整篇文章中的基础标题深度、完整面包屑和顶层目录数据，并防止循环引用。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param document 要处理的思维导图文档。
   * @returns 计算得到的数值结果。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  async buildArticleContext(file: TFile, document: MindMapDocument, onProgress?: (progress: ArticleContextProgress) => void): Promise<ArticleContextData> {
    const baseDepth = await this.computeArticleBaseDepth(file, document);
    let progressTotal = Math.max(3, document.root.children.length + 3);
    let progressProcessed = 0;
    const reportProgress = (phase: ArticleContextProgress["phase"], message: string, options?: { processed?: number; total?: number; percent?: number }): void => {
      if (typeof options?.total === "number") progressTotal = Math.max(progressTotal, Math.floor(options.total));
      if (typeof options?.processed === "number") progressProcessed = Math.max(progressProcessed, Math.floor(options.processed));
      const percent = typeof options?.percent === "number"
        ? Math.max(0, Math.min(100, Math.round(options.percent)))
        : resolveArticleContextProgressPercent(progressProcessed, progressTotal);
      onProgress?.({
        phase,
        percent,
        processed: progressProcessed,
        total: progressTotal,
        message
      });
    };
    reportProgress("prepare", "正在解析文章结构…", { percent: 6 });
    // The active editor document can be newer than the vault while a coalesced save is
    // still pending. Continuous reading must reuse that in-memory snapshot whenever the
    // family walk reaches the current physical file; otherwise a numbering change made
    // from a child map is immediately replaced by the stale on-disk copy. Cache every
    // other family member as well so one refresh uses one consistent document snapshot.
    const familyDocuments = new Map<string, MindMapDocument>([[file.path, document]]);
    const readFamilyDocument = async (targetFile: TFile): Promise<MindMapDocument> => {
      const cached = familyDocuments.get(targetFile.path);
      if (cached) return cached;
      const loaded = await this.readMindMapDocument(targetFile);
      familyDocuments.set(targetFile.path, loaded);
      return loaded;
    };
    let topFile = file;
    let topDocument = document;
    const ancestorPaths = new Set<string>([file.path]);
    while (topDocument.navigation?.parentPath) {
      const parentFile = this.resolveMindMapFile(topDocument.navigation.parentPath, topFile.path);
      if (!parentFile || ancestorPaths.has(parentFile.path)) break;
      ancestorPaths.add(parentFile.path);
      topFile = parentFile;
      topDocument = await readFamilyDocument(parentFile);
    }
    progressTotal = Math.max(progressTotal, ancestorPaths.size + topDocument.root.children.length + 3);
    progressProcessed = Math.max(progressProcessed, ancestorPaths.size);
    reportProgress("prepare", "正在建立父子导图关系…", { percent: 18 });
    const isTopLevel = topFile.path === file.path;

    const tocEntries: ArticleTocEntry[] = [];
    const topNumberingDisabled = isDocumentArticleNumberingDisabled(topDocument.root);
    const readingSections: ReadingSection[] = [{
      filePath: topFile.path,
      document: topDocument,
      baseDepth: 0,
      numberingDisabled: topNumberingDisabled
    }];
    const visitedFiles = new Set<string>([topFile.path]);
    let hasSubmaps = false;
    reportProgress("walk", "正在生成目录与章节索引…", { percent: 24, total: progressTotal + topDocument.root.children.length });
    /**
     * Item 类型定义，用于限制可接受值并让序列化数据保持稳定。
     */
    type Item = {
      node: MindMapNode;
      file: TFile;
      document: MindMapDocument;
      breadcrumb: string[];
      /** A disabled ancestor document suppresses numbering for the whole mounted subtree. */
      numberingDisabled: boolean;
    };

    const processItems = async (items: Item[], defaultLevel: number, structureDepth: number): Promise<void> => {
      const siblingHasHeading = items.some(({ node }) => isArticleHeading(node));
      const numberedIndexes = new Map<number, number>();
      for (const item of items) {
        const { node, file: sourceFile, breadcrumb } = item;
        const numbering = resolveArticleNumbering(node, defaultLevel, siblingHasHeading);
        const documentNumberingDisabled = item.numberingDisabled
          || isDocumentArticleNumberingDisabled(item.document.root);
        const numberedIndex = !documentNumberingDisabled && numbering.shouldNumber && !numbering.skipped
          ? (numberedIndexes.get(numbering.level) ?? 0) + 1
          : 0;
        if (numberedIndex) numberedIndexes.set(numbering.level, numberedIndex);
        const label = numberedIndex ? articleNumberLabel(numbering.level, numberedIndex) : "";
        const title = nodePlainText(node) || (numbering.isHeading ? "未命名标题" : "");
        const nextBreadcrumb = [...breadcrumb, title || "未命名标题"];
        const tocEntry: ArticleTocEntry | null = numbering.isHeading
          ? {
            filePath: sourceFile.path,
            nodeId: node.id,
            depth: numbering.level,
            tocDepth: structureDepth,
            label,
            title,
            displayTitle: articleDisplayTitle(label, title),
            breadcrumb: nextBreadcrumb
          }
          : null;
        if (tocEntry) tocEntries.push(tocEntry);

        const descendants: Item[] = node.children.map((child) => ({
          node: child,
          file: sourceFile,
          document: item.document,
          breadcrumb: nextBreadcrumb,
          numberingDisabled: documentNumberingDisabled
        }));
        if (node.submap?.path) {
          hasSubmaps = true;
          const childFile = this.resolveMindMapFile(node.submap.path, sourceFile.path);
          if (childFile && tocEntry) {
            tocEntry.filePath = childFile.path;
            tocEntry.nodeId = undefined;
          }
          if (childFile && !visitedFiles.has(childFile.path)) {
            visitedFiles.add(childFile.path);
            try {
              const childDocument = await readFamilyDocument(childFile);
              const childNumberingDisabled = documentNumberingDisabled
                || isDocumentArticleNumberingDisabled(childDocument.root);
              progressTotal += Math.max(1, childDocument.root.children.length + 1);
              reportProgress("walk", `正在加载子导图：${childFile.basename}…`);
              readingSections.push({
                filePath: childFile.path,
                document: childDocument,
                baseDepth: numbering.level,
                parentFilePath: sourceFile.path,
                parentNodeId: node.id,
                numberingDisabled: childNumberingDisabled
              });
              descendants.push(...childDocument.root.children.map((child) => ({
                node: child,
                file: childFile,
                document: childDocument,
                breadcrumb: nextBreadcrumb,
                numberingDisabled: childNumberingDisabled
              })));
            } catch (error) {
              console.warn(`MindMap Studio could not read child map for article TOC: ${childFile.path}`, error);
            }
          }
        }
        if (descendants.length) await processItems(descendants, numbering.level + 1, structureDepth + 1);
        progressProcessed += 1;
        reportProgress("walk", "正在生成目录与章节索引…");
      }
    };

    await processItems(topDocument.root.children.map((node) => ({
      node,
      file: topFile,
      document: topDocument,
      breadcrumb: [nodePlainText(topDocument.root) || topDocument.title],
      numberingDisabled: topNumberingDisabled
    })), articleChildStartLevel(topDocument.root), 1);
    reportProgress("finalize", "正在整理分页与返回导航…", { percent: 94, processed: progressTotal });
    const siblingPages = resolveArticleSiblingPages(tocEntries, file.path);
    const parentFile = document.navigation?.parentPath
      ? this.resolveMindMapFile(document.navigation.parentPath, file.path)
      : null;
    let parentNodeId = document.navigation?.parentNodeId;
    if (parentFile && !parentNodeId) {
      try {
        const parentDocument = await readFamilyDocument(parentFile);
        const currentPath = normalizePath(file.path);
        parentNodeId = flattenNodes(parentDocument.root).find((node) => {
          if (!node.submap?.path) return false;
          return this.resolveMindMapFile(node.submap.path, parentFile.path)?.path === currentPath;
        })?.id;
      } catch (error) {
        console.warn(`MindMap Studio could not resolve the parent mount node for article navigation: ${parentFile.path}`, error);
      }
    }
    const navigation: ArticlePageNavigation | undefined = tocEntries.length
      ? {
        entries: siblingPages.entries,
        currentIndex: siblingPages.currentIndex,
        homePath: topFile.path,
        parentPath: parentFile?.path,
        parentNodeId,
        numberingDisabled: readingSections.find((section) => section.filePath === file.path)?.numberingDisabled
          ?? isDocumentArticleNumberingDisabled(document.root)
      }
      : undefined;
    reportProgress("complete", "通读内容已准备完成", { percent: 100, processed: progressTotal });
    return {
      baseDepth,
      tocEntries,
      showToc: isTopLevel && hasSubmaps && tocEntries.length > 0,
      navigation,
      readingSections
    };
  }

  /**
   * Collects the current map and every reachable child map without walking up
   * to its parent. This is the export counterpart of continuous reading.
   *
   * @param file Current physical mind-map file.
   * @param document Current parsed mind-map document.
   * @returns Ordered maps with their absolute depth relative to the current map.
   */
  async buildDescendantReadingSections(file: TFile, document: MindMapDocument): Promise<ReadingSection[]> {
    const rootNumberingDisabled = isDocumentArticleNumberingDisabled(document.root);
    const sections: ReadingSection[] = [{
      filePath: file.path,
      document,
      baseDepth: 0,
      numberingDisabled: rootNumberingDisabled
    }];
    const visited = new Set<string>([file.path]);
    const visit = async (nodes: MindMapNode[], sourceFile: TFile, defaultLevel: number, numberingDisabled: boolean): Promise<void> => {
      const siblingHasHeading = nodes.some((node) => isArticleHeading(node));
      for (const node of nodes) {
        const numbering = resolveArticleNumbering(node, defaultLevel, siblingHasHeading);
        if (node.submap?.path) {
          const childFile = this.resolveMindMapFile(node.submap.path, sourceFile.path);
          if (childFile && !visited.has(childFile.path)) {
            visited.add(childFile.path);
            try {
              const childDocument = await this.readMindMapDocument(childFile);
              const childNumberingDisabled = numberingDisabled
                || isDocumentArticleNumberingDisabled(childDocument.root);
              sections.push({
                filePath: childFile.path,
                document: childDocument,
                baseDepth: numbering.level,
                parentFilePath: sourceFile.path,
                parentNodeId: node.id,
                numberingDisabled: childNumberingDisabled
              });
              await visit(
                childDocument.root.children,
                childFile,
                articleChildStartLevel(childDocument.root, numbering.level),
                childNumberingDisabled
              );
            } catch (error) {
              console.warn(`MindMap Studio could not read child map for export: ${childFile.path}`, error);
            }
          }
        }
        if (node.children.length) await visit(node.children, sourceFile, numbering.level + 1, numberingDisabled);
      }
    };
    await visit(document.root.children, file, articleChildStartLevel(document.root), rootNumberingDisabled);
    return sections;
  }

  /**
   * 读取并返回available path，并保持模型、界面和持久化状态的一致性。
   *
   * @param preferredPath 该参数用于 get available path 流程中的输入或控制。
   * @returns 计算、解析或序列化后的字符串结果。
   */
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

  /**
   * 创建mind map，并保持模型、界面和持久化状态的一致性。
   *
   * @param options 控制当前操作行为的可选配置。
   * @returns 异步操作完成后的结果。
   */
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

  /**
   * Synchronizes a saved map's filename with its root node title and preserves
   * parent/child navigation references when the map is linked as a submap.
   *
   * @param file Saved mind-map file to rename when its title changed.
   * @param document Persisted document whose root node supplies the filename.
   * @returns The current file, or the renamed file when synchronization occurred.
   */
  async syncMindMapTitleToFilename(file: TFile, document: MindMapDocument): Promise<TFile> {
    if (!this.settings.syncTitleToFilename) return file;
    const title = nodePlainText(document.root).trim();
    const filename = this.sanitizeFilename(title);
    if (!title || filename === file.basename) return file;

    const oldPath = file.path;
    const parentPath = file.parent?.path ?? "";
    const targetPath = await this.getAvailablePath(normalizePath(`${parentPath ? `${parentPath}/` : ""}${filename}.${MINDMAP_EXTENSION}`));
    if (targetPath === oldPath) return file;

    await this.app.vault.rename(file, targetPath);
    const renamed = this.app.vault.getAbstractFileByPath(targetPath);
    if (!(renamed instanceof TFile)) return file;

    await this.updateParentSubmapReference(renamed, oldPath, document.navigation?.parentPath, document.navigation?.parentNodeId);
    await this.updateChildSubmapNavigation(renamed, oldPath, document);
    return renamed;
  }

  /** Updates the parent node that links to a renamed child map. */
  private async updateParentSubmapReference(file: TFile, oldPath: string, parentPath: string | undefined, parentNodeId: string | undefined): Promise<void> {
    if (!parentPath) return;
    const parentFile = this.resolveMindMapFile(parentPath, oldPath);
    if (!parentFile) return;
    const parentDocument = await this.readMindMapDocument(parentFile);
    const linkedNode = parentNodeId ? findNode(parentDocument.root, parentNodeId) : undefined;
    const node = linkedNode ?? flattenNodes(parentDocument.root).find((candidate) => normalizePath(candidate.submap?.path ?? "") === oldPath);
    if (!node?.submap) return;
    node.submap.path = file.path;
    node.submap.title = file.basename;
    await this.app.vault.modify(parentFile, serializeDocument(parentDocument));
    await this.refreshOpenMindMap(parentFile, parentDocument);
  }

  /** Updates navigation metadata in child maps after their parent map was renamed. */
  private async updateChildSubmapNavigation(file: TFile, oldPath: string, document: MindMapDocument): Promise<void> {
    for (const node of flattenNodes(document.root)) {
      if (!node.submap?.path) continue;
      const childFile = this.resolveMindMapFile(node.submap.path, file.path);
      if (!childFile) continue;
      const childDocument = await this.readMindMapDocument(childFile);
      if (childDocument.navigation?.parentPath !== oldPath) continue;
      childDocument.navigation.parentPath = file.path;
      childDocument.navigation.parentTitle = file.basename;
      await this.app.vault.modify(childFile, serializeDocument(childDocument));
      await this.refreshOpenMindMap(childFile, childDocument);
    }
  }

  /** Returns and clears a chapter target queued before a mind-map view starts loading its file. */
  consumePendingMindMapFocus(filePath: string): string | null {
    const normalized = normalizePath(filePath);
    const nodeId = this.pendingMindMapFocus.get(normalized) ?? null;
    this.pendingMindMapFocus.delete(normalized);
    this.logDebug("navigation", "consume-pending-focus", { filePath: normalized, nodeId, remaining: this.pendingMindMapFocus.size });
    return nodeId;
  }

  /** Returns and clears a queued directory landing intent for the file being loaded. */
  consumePendingMindMapDirectory(filePath: string): { focusNodeId?: string } | null {
    const normalized = normalizePath(filePath);
    const request = this.pendingMindMapDirectory.get(normalized) ?? null;
    this.pendingMindMapDirectory.delete(normalized);
    this.logDebug("navigation", "consume-pending-directory", {
      filePath: normalized,
      focusNodeId: request?.focusNodeId,
      requested: Boolean(request),
      remaining: this.pendingMindMapDirectory.size
    });
    return request;
  }

  /**
   * 打开as mind map，并保持模型、界面和持久化状态的一致性。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param preferredLeaf 该参数用于 open as mind map 流程中的输入或控制。
   * @param focusNodeId 该参数用于 open as mind map 流程中的输入或控制。
   */
  async openAsMindMap(file: TFile, preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<WorkspaceLeaf> {
    const leaf = preferredLeaf ?? this.app.workspace.getLeaf(false);
    this.logDebug("navigation", "open-view-start", { filePath: file.path, focusNodeId, preferredLeaf: Boolean(preferredLeaf), currentViewType: leaf.view.getViewType() });
    if (focusNodeId) {
      this.pendingMindMapFocus.set(file.path, focusNodeId);
      this.logDebug("navigation", "queue-focus", { filePath: file.path, focusNodeId, queued: this.pendingMindMapFocus.size });
    }
    await leaf.setViewState({
      type: VIEW_TYPE_MINDMAP_STUDIO,
      state: { file: file.path },
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
    this.logDebug("navigation", "open-view-state-complete", { filePath: file.path, focusNodeId, viewType: leaf.view.getViewType(), pendingStillQueued: this.pendingMindMapFocus.get(file.path) === focusNodeId });
    if (focusNodeId && this.pendingMindMapFocus.get(file.path) === focusNodeId) {
      this.pendingMindMapFocus.delete(file.path);
      this.logDebug("navigation", "focus-not-consumed-by-set-view-data", { filePath: file.path, focusNodeId });
      if (leaf.view instanceof MindMapStudioView) leaf.view.markExplicitNavigation(focusNodeId);
    }
    return leaf;
  }

  /**
   * 保存pasted image，并保持模型、界面和持久化状态的一致性。
   *
   * @param blob 该参数用于 save pasted image 流程中的输入或控制。
   * @param suggestedName 该参数用于 save pasted image 流程中的输入或控制。
   * @param sourceFile 该参数用于 save pasted image 流程中的输入或控制。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  async savePastedImage(blob: Blob, suggestedName: string, sourceFile: TFile | null): Promise<string> {
    // 图片资源目录按当前脑图所在目录解析，而不是按仓库根目录解析。
    // 例如 Projects/Plan.mindmap + MindMap Assets =>
    // Projects/MindMap Assets/Plan-20260720-123456.png
    const sourceFolder = sourceFile?.parent?.path ?? "";
    const configuredFolder = normalizePath((this.settings.assetFolder || "MindMap Assets").replace(/^\/+|\/+$/g, ""));
    const folder = normalizePath([sourceFolder, configuredFolder].filter(Boolean).join("/"));
    await this.ensureFolderPath(folder);
    const stamp = buildCompactTimestamp(new Date());
    const extension = sanitizeFileExtension(suggestedName, "png");
    const base = this.sanitizeFilename(sourceFile?.basename ?? "mindmap");
    const preferred = normalizePath(`${folder}/${base}-${stamp}.${extension}`);
    const path = await this.getAvailablePath(preferred);
    await this.app.vault.createBinary(path, await blob.arrayBuffer());
    return path;
  }

  /**
   * 读取桌面 Markdown 同目录或附件回退路径中的图片，并复制到当前导图资源目录。
   *
   * @param document 已完成 Markdown 结构解析、尚未合并进当前导图的文档。
   * @param sourceDirectory 用户通过原生文件选择器选中的 Markdown 所在目录。
   * @param mindMapFile 当前导图文件，用于确定资源保存目录。
   * @returns 成功复制并改写引用的唯一图片数量。
   */
  async importDesktopMarkdownImages(document: MindMapDocument, sourceDirectory: string, mindMapFile: TFile | null): Promise<number> {
    if (!mindMapFile || !sourceDirectory.trim()) return 0;
    const result = await copyDesktopMarkdownImagesToDocument(
      document,
      sourceDirectory,
      async (image) => {
        const bytes = image.content.buffer.slice(
          image.content.byteOffset,
          image.content.byteOffset + image.content.byteLength
        ) as ArrayBuffer;
        return this.savePastedImage(
          new Blob([bytes], { type: mimeTypeFromFilename(image.name) }),
          image.name,
          mindMapFile
        );
      }
    );
    return result.copied;
  }

  /**
   * 执行“read image source”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param source 待解析或渲染的原始文本。
   * @param sourceFile 该参数用于 read image source 流程中的输入或控制。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  async readImageSource(source: string, sourceFile: TFile | null): Promise<{ blob: Blob; suggestedName: string } | null> {
    const raw = source.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) {
      const response = await requestUrl({ url: raw, method: "GET", throw: true });
      const contentType = response.headers["content-type"]?.split(";")[0]?.trim() || this.mimeFromFilename(raw);
      const suggestedName = remoteImageSuggestedName(raw);
      return { blob: new Blob([response.arrayBuffer], { type: contentType }), suggestedName };
    }
    if (/^(?:data|blob):/i.test(raw)) {
      const response = await fetch(raw);
      if (!response.ok) throw new Error(`图片读取失败：HTTP ${response.status}`);
      const blob = await response.blob();
      return { blob, suggestedName: `inline-image.${blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png"}` };
    }
    const wikiMatch = raw.match(/^!?\[\[([\s\S]+?)\]\]$/);
    const target = (wikiMatch?.[1] ?? raw).split("|")[0]?.split("#")[0]?.trim() ?? raw;
    const direct = this.app.vault.getAbstractFileByPath(normalizePath(target));
    const file = direct instanceof TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(target, sourceFile?.path ?? "");
    if (!(file instanceof TFile)) return null;
    const binary = await this.app.vault.readBinary(file);
    return { blob: new Blob([binary], { type: this.mimeFromFilename(file.name) }), suggestedName: file.name };
  }

  /**
   * 读取并返回image host choices，并保持模型、界面和持久化状态的一致性。
   * @returns 按当前规则构建的集合结果。
   */
  getImageHostChoices(): ImageHostChoice[] {
    return this.settings.imageHosts
      .filter((host) => host.enabled && Boolean(host.endpoint.trim()))
      .sort((left, right) => left.priority - right.priority || left.name.localeCompare(right.name))
      .map((host) => ({ id: host.id, name: host.name }));
  }

  /** Returns enabled image host IDs ordered by render failover priority. */
  getImageHostPriorityIds(): string[] {
    return this.settings.imageHosts
      .filter((host) => host.enabled)
      .sort((left, right) => left.priority - right.priority || left.name.localeCompare(right.name))
      .map((host) => host.id);
  }

  /**
   * 读取并返回default upload host ids，并保持模型、界面和持久化状态的一致性。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  getDefaultUploadHostIds(): string[] {
    const enabled = new Set(this.getImageHostChoices().map((host) => host.id));
    return this.settings.autoUploadHostIds.filter((id) => enabled.has(id));
  }

  /**
   * 把同一张图片上传到多个已配置图床，分别收集成功与失败结果。只有所有选中图床成功且文档保存完成后，调用方才允许删除本地文件。
   *
   * @param blob 该参数用于 upload image to hosts 流程中的输入或控制。
   * @param suggestedName 该参数用于 upload image to hosts 流程中的输入或控制。
   * @param hostIds 需要执行上传的图床标识列表。
   * @returns 异步操作完成后的结果。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  async uploadImageToHosts(blob: Blob, suggestedName: string, hostIds: string[]): Promise<ImageHostUploadBatch> {
    const requested = Array.from(new Set(hostIds));
    const hosts = requested
      .map((id) => this.settings.imageHosts.find((host) => host.id === id))
      .filter((host): host is ImageHostConfig => Boolean(host?.enabled && host.endpoint.trim()));
    if (!hosts.length) throw new Error("没有选择可用图床");
    const contentHash = await sha256Blob(blob);
    let cacheChanged = false;
    const settled = await Promise.all(hosts.map(async (host): Promise<
      { ok: true; value: ImageHostUploadSuccess }
      | { ok: false; value: ImageHostUploadFailure }
    > => {
      try {
        const cacheKey = `${host.id}:${contentHash}`;
        const cached = this.settings.imageUploadCache[cacheKey];
        if (cached?.url && /^https?:\/\//i.test(cached.url)) {
          cached.lastUsedAt = new Date().toISOString();
          cacheChanged = true;
          return { ok: true as const, value: { hostId: host.id, hostName: host.name, url: cached.url, deleteKey: cached.deleteKey, reused: true } };
        }
        const uploaded = await this.uploadImageToHostConfig(host, blob, suggestedName);
        const now = new Date().toISOString();
        this.settings.imageUploadCache[cacheKey] = {
          hostId: host.id,
          hostName: host.name,
          hash: contentHash,
          url: uploaded.url,
          deleteKey: uploaded.deleteKey,
          uploadedAt: now,
          lastUsedAt: now
        };
        cacheChanged = true;
        return { ok: true as const, value: { hostId: host.id, hostName: host.name, url: uploaded.url, deleteKey: uploaded.deleteKey } };
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
    if (cacheChanged) {
      const entries = Object.entries(this.settings.imageUploadCache);
      if (entries.length > 1000) {
        entries.sort((left, right) => String(left[1].lastUsedAt ?? left[1].uploadedAt ?? "").localeCompare(String(right[1].lastUsedAt ?? right[1].uploadedAt ?? "")));
        this.settings.imageUploadCache = Object.fromEntries(entries.slice(entries.length - 1000));
      }
      await this.saveSettings();
    }
    return {
      ...settled.reduce(
        (acc, item) => {
          if (item.ok) {
            acc.successes.push(item.value);
          } else {
            acc.failures.push(item.value);
          }
          return acc;
        },
        {
          successes: [] as ImageHostUploadSuccess[],
          failures: [] as ImageHostUploadFailure[],
        }
      ),
      contentHash
    };
  }

  /**
   * 执行“test image host”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param hostId 该参数用于 test image host 流程中的输入或控制。
   */
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
      const uploaded = await this.uploadImageToHostConfig(host, new Blob([png], { type: "image/png" }), "mindmap-studio-api-test.png");
      const elapsed = Math.max(1, Math.round(performance.now() - started));
      const scheduled = await this.scheduleImageHostDeletion(host, {
        url: uploaded.url,
        deleteKey: uploaded.deleteKey
      }, "connectivity-test");
      const cleanupMessage = scheduled
        ? "测试图片将在 1 分钟后自动删除"
        : "该图床未配置删除 API，测试图片需要手动清理";
      new Notice(`${host.name} 连接成功（${elapsed} ms）\n${cleanupMessage}\n${uploaded.url}`, 9000);
    } catch (error) {
      console.error("MindMap Studio image host connectivity test failed", error);
      new Notice(`${host.name} 连接失败：${error instanceof Error ? error.message : String(error)}`, 8000);
    }
  }

  /**
   * 安排延迟执行auto upload，并保持模型、界面和持久化状态的一致性。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param nodeId 目标节点的稳定标识。
   * @param blockId 该参数用于 schedule auto upload 流程中的输入或控制。
   * @param localPath 该参数用于 schedule auto upload 流程中的输入或控制。
   * @param suggestedName 该参数用于 schedule auto upload 流程中的输入或控制。
   * @returns 操作条件是否成立或处理是否成功。
   */
  scheduleAutoUpload(file: TFile | null, nodeId: string, blockId: string, localPath: string, suggestedName: string): boolean {
    if (!file || !this.settings.autoUploadEnabled) return false;
    const hostIds = this.getDefaultUploadHostIds();
    if (!hostIds.length) {
      new Notice("图片已保存到本地；自动上传未选择可用图床", 5000);
      return false;
    }
    this.queueAutoUpload(file, nodeId, blockId, localPath, suggestedName, hostIds, this.settings.autoUploadDelaySeconds * 1000);
    return true;
  }

  /** 删除已被识图文字替换的本地图片；共享资源会保留。 */
  async deleteRecognizedImageLocalAsset(mindMapPath: string, localPath: string, blockId: string): Promise<boolean> {
    if (!mindMapPath || !localPath) return false;
    return this.deleteLocalAssetIfSafe(localPath, mindMapPath, blockId);
  }

  /**
   * Schedules remote mirrors for deletion after a one-minute Undo safety window.
   * The final timer callback rescans every map and cancels deletion when the image has been restored.
   */
  async cleanupRemovedImageRemoteAssets(
    currentMindMapPath: string,
    removed: MindMapImageContentBlock,
    documentAfterRemoval: MindMapDocument
  ): Promise<void> {
    if (!this.settings.deleteRemoteWhenUnreferenced) return;
    const remoteSources = [...(removed.remoteSources ?? [])];
    if (/^https?:\/\//i.test(removed.source) && !remoteSources.some((remote) => remote.url === removed.source)) {
      const cached = Object.values(this.settings.imageUploadCache).find((entry) => entry.url === removed.source);
      if (cached) remoteSources.push({
        hostId: cached.hostId,
        hostName: cached.hostName,
        url: cached.url,
        deleteKey: cached.deleteKey,
        uploadedAt: cached.uploadedAt
      });
    }
    if (!remoteSources.length) return;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView) await leaf.view.save();
    }
    if (this.documentReferencesImage(documentAfterRemoval, removed)) return;
    for (const file of this.app.vault.getFiles()) {
      if (file.path === currentMindMapPath || file.extension.toLowerCase() !== MINDMAP_EXTENSION) continue;
      try {
        const document = parseDocument(await this.app.vault.cachedRead(file), file.basename);
        if (this.documentReferencesImage(document, removed)) return;
      } catch {
        // An unreadable map must keep remote deletion on the safe side.
        return;
      }
    }

    const scheduled: string[] = [];
    const retained: string[] = [];
    for (const remote of remoteSources) {
      const host = this.settings.imageHosts.find((candidate) => candidate.id === remote.hostId);
      if (!host?.deleteEndpoint.trim()) {
        retained.push(remote.hostName || host?.name || remote.hostId);
        continue;
      }
      const queued = await this.scheduleImageHostDeletion(host, {
        url: remote.url,
        deleteKey: remote.deleteKey,
        hash: removed.contentHash
      }, "removed-image");
      if (queued) scheduled.push(remote.hostName || host.name);
    }
    const parts: string[] = [];
    if (scheduled.length) parts.push(`已安排 1 分钟后删除：${scheduled.join("、")}（期间撤销恢复会自动取消）`);
    if (retained.length) parts.push(`未配置删除 API，远程图片保留：${retained.join("、")}`);
    if (parts.length) new Notice(parts.join("\n"), 8000);
  }

  /** Adds or refreshes one persistent one-minute remote deletion task. */
  private async scheduleImageHostDeletion(
    host: ImageHostConfig,
    image: { url: string; hash?: string; deleteKey?: string },
    reason: PendingImageHostDeletion["reason"]
  ): Promise<boolean> {
    if (!host.deleteEndpoint.trim() || !/^https?:\/\//i.test(image.url)) return false;
    const identity = image.hash?.trim().toLowerCase() || this.shortStableId(image.url);
    const id = `${reason}:${host.id}:${identity}`.slice(0, 240);
    const pending: PendingImageHostDeletion = {
      id,
      hostId: host.id,
      hostName: host.name,
      url: image.url,
      hash: image.hash?.trim().toLowerCase() || undefined,
      deleteKey: image.deleteKey?.trim() || undefined,
      dueAt: new Date(Date.now() + REMOTE_IMAGE_DELETE_DELAY_MS).toISOString(),
      reason
    };
    this.settings.pendingImageHostDeletions[id] = pending;
    await this.saveSettings();
    this.armPendingImageHostDeletion(pending);
    return true;
  }

  /** Restores delayed deletion timers after Obsidian restarts. */
  private resumePendingImageHostDeletions(): void {
    for (const pending of Object.values(this.settings.pendingImageHostDeletions)) this.armPendingImageHostDeletion(pending);
  }

  /** Arms one task using its persisted due time. */
  private armPendingImageHostDeletion(pending: PendingImageHostDeletion): void {
    const existing = this.remoteImageDeleteTimers.get(pending.id);
    if (existing !== undefined) window.clearTimeout(existing);
    const delay = Math.max(0, Date.parse(pending.dueAt) - Date.now());
    const timer = window.setTimeout(() => {
      this.remoteImageDeleteTimers.delete(pending.id);
      void this.executePendingImageHostDeletion(pending.id);
    }, delay);
    this.remoteImageDeleteTimers.set(pending.id, timer);
  }

  /** Executes one task only after references are checked again at the end of the safety window. */
  private async executePendingImageHostDeletion(id: string): Promise<void> {
    const pending = this.settings.pendingImageHostDeletions[id];
    if (!pending) return;
    const host = this.settings.imageHosts.find((candidate) => candidate.id === pending.hostId);
    if (!host?.deleteEndpoint.trim()) {
      delete this.settings.pendingImageHostDeletions[id];
      await this.saveSettings();
      new Notice(`${pending.hostName || "图床"} 未配置删除 API，远程图片已保留`, 7000);
      return;
    }
    if (pending.reason === "removed-image" && await this.isPendingRemoteImageReferenced(pending)) {
      delete this.settings.pendingImageHostDeletions[id];
      await this.saveSettings();
      new Notice("检测到图片已恢复，已取消图床删除", 5000);
      return;
    }
    try {
      await this.deleteImageFromHostConfig(host, pending.url, pending.hash, pending.deleteKey);
      if (pending.hash) delete this.settings.imageUploadCache[`${pending.hostId}:${pending.hash}`];
      delete this.settings.pendingImageHostDeletions[id];
      await this.saveSettings();
      new Notice(pending.reason === "connectivity-test"
        ? `${pending.hostName || host.name} 的连通性测试图片已删除`
        : `${pending.hostName || host.name} 的远程图片已删除`, 5000);
    } catch (error) {
      console.warn("MindMap Studio delayed remote image deletion failed", error);
      delete this.settings.pendingImageHostDeletions[id];
      await this.saveSettings();
      new Notice(`${pending.hostName || host.name} 删除失败：${error instanceof Error ? error.message : String(error)}`, 9000);
    }
  }

  /** Returns true when any currently saved or open mind map references a pending remote image. */
  private async isPendingRemoteImageReferenced(pending: PendingImageHostDeletion): Promise<boolean> {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView) await leaf.view.save();
    }
    for (const file of this.app.vault.getFiles()) {
      if (file.extension.toLowerCase() !== MINDMAP_EXTENSION) continue;
      try {
        const document = parseDocument(await this.app.vault.cachedRead(file), file.basename);
        const referenced = flattenNodes(document.root).some((node) => nodeContentBlocks(node).some((block) => {
          if (block.type !== "image") return false;
          if (pending.hash && block.contentHash === pending.hash) return true;
          return block.source === pending.url || (block.remoteSources ?? []).some((source) => source.url === pending.url);
        }));
        if (referenced) return true;
      } catch {
        // An unreadable map is treated as a reference so remote deletion never becomes unsafe.
        return true;
      }
    }
    return false;
  }

  /** Creates a compact deterministic identifier without persisting a full URL in a record key. */
  private shortStableId(value: string): string {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  /** Returns whether one document still references an image by SHA-256 or any remote URL. */
  private documentReferencesImage(document: MindMapDocument, image: MindMapImageContentBlock): boolean {
    const urls = new Set([image.source, ...(image.remoteSources ?? []).map((source) => source.url)].filter((value) => /^https?:\/\//i.test(value)));
    return flattenNodes(document.root).some((node) => nodeContentBlocks(node).some((block) => {
      if (block.type !== "image") return false;
      if (image.contentHash && block.contentHash === image.contentHash) return true;
      return urls.has(block.source) || (block.remoteSources ?? []).some((source) => urls.has(source.url));
    }));
  }

  /** 根据本地图片文件时间恢复延迟上传；到期图片在重新打开导图后立即上传。 */
  async resumePendingAutoUploads(file: TFile, document: MindMapDocument): Promise<void> {
    if (!this.settings.autoUploadEnabled) return;
    const hostIds = this.getDefaultUploadHostIds();
    if (!hostIds.length) return;
    const delayMs = this.settings.autoUploadDelaySeconds * 1000;
    for (const node of flattenNodes(document.root)) {
      for (const block of nodeContentBlocks(node)) {
        if (block.type !== "image") continue;
        const localPath = block.localSource ?? (/^https?:\/\//i.test(block.source) ? "" : block.source);
        const localFile = localPath ? this.app.vault.getAbstractFileByPath(normalizePath(localPath)) : null;
        const uploaded = hostIds.every((hostId) => block.remoteSources?.some((source) => source.hostId === hostId));
        if (!(localFile instanceof TFile) || uploaded) continue;
        const remainingMs = Math.max(0, delayMs - Math.max(0, Date.now() - localFile.stat.mtime));
        this.queueAutoUpload(file, node.id, block.id, localPath, localFile.name, hostIds, remainingMs);
      }
    }
  }

  /** 安排一次可去重的本地图片自动上传。 */
  private queueAutoUpload(
    mindMapFile: TFile,
    nodeId: string,
    blockId: string,
    localPath: string,
    suggestedName: string,
    hostIds: string[],
    delayMs: number
  ): void {
    let fileKey = this.autoUploadFileKeys.get(mindMapFile);
    if (!fileKey) {
      fileKey = `mindmap-${++this.autoUploadFileKeySequence}`;
      this.autoUploadFileKeys.set(mindMapFile, fileKey);
    }
    const key = `${fileKey}::${nodeId}::${blockId}`;
    if (this.autoUploadInFlightKeys.has(key)) return;
    const existing = this.autoUploadTimers.get(key);
    if (existing !== undefined) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      this.autoUploadTimers.delete(key);
      this.enqueueReadyAutoUpload({ key, mindMapFile, nodeId, blockId, localPath, suggestedName, hostIds: [...hostIds] });
    }, Math.max(0, Math.min(300_000, delayMs)));
    this.autoUploadTimers.set(key, timer);
  }

  /** Collects simultaneously due uploads into one file-level transaction and one user notice. */
  private enqueueReadyAutoUpload(job: PendingAutoUploadJob): void {
    if (this.autoUploadInFlightKeys.has(job.key)) return;
    this.autoUploadInFlightKeys.add(job.key);
    let jobs = this.readyAutoUploadJobs.get(job.mindMapFile);
    if (!jobs) {
      jobs = new Map();
      this.readyAutoUploadJobs.set(job.mindMapFile, jobs);
    }
    jobs.set(job.key, job);
    if (this.autoUploadBatchTimers.has(job.mindMapFile)) return;
    const timer = window.setTimeout(() => {
      this.autoUploadBatchTimers.delete(job.mindMapFile);
      const ready = Array.from(this.readyAutoUploadJobs.get(job.mindMapFile)?.values() ?? []);
      this.readyAutoUploadJobs.delete(job.mindMapFile);
      if (ready.length) this.startAutoUploadBatch(job.mindMapFile, ready);
    }, 180);
    this.autoUploadBatchTimers.set(job.mindMapFile, timer);
  }

  /** Serializes batches for the same TFile so stale snapshots can never overwrite each other. */
  private startAutoUploadBatch(mindMapFile: TFile, jobs: PendingAutoUploadJob[]): void {
    const previous = this.autoUploadFileChains.get(mindMapFile) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.runAutoUploadBatch(mindMapFile, jobs))
      .finally(() => {
        for (const job of jobs) this.autoUploadInFlightKeys.delete(job.key);
        if (this.autoUploadFileChains.get(mindMapFile) === next) this.autoUploadFileChains.delete(mindMapFile);
      });
    this.autoUploadFileChains.set(mindMapFile, next);
    void next;
  }

  /**
   * Uploads one file's due images as a batch, then merges network results into the latest live document.
   *
   * @param mindMapFile Target map file. Its TFile object survives an Obsidian rename.
   * @param jobs Deduplicated image jobs that became due within the same short window.
   * @remarks
   * Network requests intentionally finish before any document write. Results are applied as ID-based
   * image patches to the current editor document, or to a freshly re-read disk document when closed.
   * This prevents concurrent auto uploads from repeatedly replacing the whole map with stale snapshots.
   */
  private async runAutoUploadBatch(mindMapFile: TFile, jobs: PendingAutoUploadJob[]): Promise<void> {
    try {
      await this.flushOpenView(mindMapFile.path);
      const mapFile = this.app.vault.getAbstractFileByPath(mindMapFile.path);
      if (!(mapFile instanceof TFile)) return;
      const snapshot = parseDocument(await this.app.vault.read(mapFile), mapFile.basename);
      const completed: CompletedAutoUploadJob[] = [];

      for (const job of jobs) {
        const node = findNode(snapshot.root, job.nodeId);
        const block = nodeContentBlocks(node ?? snapshot.root)
          .find((item): item is MindMapImageContentBlock => item.type === "image" && item.id === job.blockId);
        const localFile = this.app.vault.getAbstractFileByPath(normalizePath(job.localPath));
        if (!node || !block || !(localFile instanceof TFile)) continue;
        if (block.source !== job.localPath && block.localSource !== job.localPath) continue;

        const existingByHost = new Map((block.remoteSources ?? []).map((source) => [source.hostId, source]));
        const missingHostIds = job.hostIds.filter((hostId) => !existingByHost.has(hostId));
        if (!missingHostIds.length) continue;

        try {
          const binary = await this.app.vault.readBinary(localFile);
          const blob = new Blob([binary], { type: this.mimeFromFilename(localFile.name) });
          const batch = await this.uploadImageToHosts(blob, job.suggestedName || localFile.name, missingHostIds);
          const uploadedAt = new Date().toISOString();
          const remoteSources: MindMapImageRemoteSource[] = batch.successes.map((success) => ({
            hostId: success.hostId,
            hostName: success.hostName,
            url: success.url,
            deleteKey: success.deleteKey,
            uploadedAt
          }));
          for (const source of remoteSources) existingByHost.set(source.hostId, source);
          const allSucceeded = batch.failures.length === 0
            && job.hostIds.every((hostId) => existingByHost.has(hostId));
          const preferredSource = allSucceeded
            ? job.hostIds.map((hostId) => existingByHost.get(hostId)?.url).find(Boolean)
            : undefined;
          completed.push({
            job,
            patch: {
              nodeId: job.nodeId,
              blockId: job.blockId,
              localPath: job.localPath,
              contentHash: batch.contentHash,
              remoteSources,
              preferredSource
            },
            allSucceeded,
            failures: batch.failures,
            targetHostNames: batch.successes.map((item) => item.hostName)
          });
        } catch (error) {
          completed.push({
            job,
            allSucceeded: false,
            failures: [{
              hostId: "batch",
              hostName: "自动上传",
              error: error instanceof Error ? error.message : String(error)
            }],
            targetHostNames: []
          });
        }
      }

      const patches = completed.flatMap((item) => item.patch ? [item.patch] : []);
      if (patches.length) await this.applyAutoUploadPatches(mapFile, patches);

      const clearLocalPatches: MindMapImageUploadPatch[] = [];
      if (this.settings.deleteLocalAfterUpload) {
        for (const item of completed) {
          if (!item.allSucceeded || !item.patch) continue;
          const deleted = await this.deleteLocalAssetIfSafe(item.job.localPath, mapFile.path, item.job.blockId);
          if (deleted) {
            clearLocalPatches.push({
              nodeId: item.job.nodeId,
              blockId: item.job.blockId,
              localPath: item.job.localPath,
              clearLocalSource: true
            });
          }
        }
      }
      if (clearLocalPatches.length) await this.applyAutoUploadPatches(mapFile, clearLocalPatches);

      const succeeded = completed.filter((item) => item.allSucceeded).length;
      const failed = completed.filter((item) => item.failures.length > 0);
      if (succeeded) {
        const hostNames = Array.from(new Set(completed.flatMap((item) => item.targetHostNames))).join("、") || "图库";
        const suffix = this.settings.deleteLocalAfterUpload
          ? clearLocalPatches.length === succeeded ? "，本地图片已安全删除" : "，仍被引用或删除失败的本地图片已保留"
          : "，本地图片已保留";
        new Notice(`已自动上传 ${succeeded} 张图片到 ${hostNames}${suffix}`, 7000);
      }
      if (failed.length) {
        const details = failed.flatMap((item) => item.failures.map((failure) => `${failure.hostName}：${failure.error}`)).slice(0, 3).join("；");
        new Notice(`有 ${failed.length} 张图片自动上传失败，本地图片已保留${details ? `：${details}` : ""}`, 9000);
      }
    } catch (error) {
      console.error("MindMap Studio automatic image upload batch failed", error);
      new Notice(`图片自动上传失败，本地图片已保留：${error instanceof Error ? error.message : String(error)}`, 8000);
    }
  }

  /** Applies upload patches to live views when open, otherwise to a freshly re-read disk document. */
  private async applyAutoUploadPatches(file: TFile, patches: readonly MindMapImageUploadPatch[]): Promise<number> {
    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)
      .map((leaf) => leaf.view)
      .filter((view): view is MindMapStudioView => view instanceof MindMapStudioView && view.file?.path === file.path);
    if (views.length) {
      let updated = 0;
      for (const view of views) updated = Math.max(updated, await view.applyImageUploadPatches(patches));
      return updated;
    }
    const document = parseDocument(await this.app.vault.read(file), file.basename);
    const updated = applyImageUploadPatches(document, patches);
    if (updated) await this.app.vault.modify(file, serializeDocument(document));
    return updated;
  }

  /**
   * 按单个图床配置上传图片，并从 JSON 或文本响应中解析最终图片地址。
   *
   * @param host 图床端点、请求头、请求体模式和响应字段路径。
   * @param blob 待上传的图片内容。
   * @param suggestedName 上传文件名；写入 multipart 前会进行跨平台清洗。
   * @returns 服务端返回的第一个合法 HTTP(S) 图片地址。
   * @throws 配置、请求体或响应格式不合法，以及网络请求失败时抛出错误。
   */
  private async uploadImageToHostConfig(host: ImageHostConfig, blob: Blob, suggestedName: string): Promise<{ url: string; deleteKey?: string }> {
    const endpoint = normalizeHttpUrl(host.endpoint, "上传 API");
    const headers = parseUploadHeaders(host.headers);
    const filename = this.sanitizeFilename(suggestedName || "mindmap-image.png");
    const mime = blob.type || "application/octet-stream";
    let body: ArrayBuffer;
    let contentType = mime;

    if (host.bodyMode === "multipart") {
      const multipart = await buildMultipartUploadBody(host.fieldName, filename, mime, blob);
      body = multipart.body;
      contentType = multipart.contentType;
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
    let responseJson: unknown;
    try {
      responseJson = response.json;
    } catch {
      responseJson = undefined;
    }
    const payload = parseUploadResponsePayload(responseJson, response.text);
    const imageUrl = extractImageUrlFromResponse(payload, [host.responsePath, "files.0.url", "files.0"]);
    if (!imageUrl) throw new Error("返回结果中没有找到图片网址");
    let deleteKey = extractResponseString(payload, host.deleteKeyResponsePath);
    if (!deleteKey && host.preset === "zipline") {
      try {
        deleteKey = await this.resolveZiplineFileId(host, imageUrl);
      } catch (error) {
        console.warn("MindMap Studio could not resolve the Zipline delete ID; upload remains usable", error);
      }
    }
    return { url: imageUrl, deleteKey };
  }

  /** Resolve a Zipline file URL back to its current v4 file ID for legacy cache entries or incomplete upload responses. */
  private async resolveZiplineFileId(host: ImageHostConfig, imageUrl: string): Promise<string | undefined> {
    const upload = new URL(normalizeHttpUrl(host.endpoint, "上传 API"));
    const target = new URL(imageUrl);
    const targetName = decodeURIComponent(target.pathname.split("/").filter(Boolean).at(-1) ?? "");
    const query = new URLSearchParams({ page: "1", perpage: "100", filter: "all", searchField: "name", searchQuery: targetName });
    const response = await requestUrl({
      url: `${upload.origin}/api/user/files?${query.toString()}`,
      method: "GET",
      headers: parseUploadHeaders(host.headers),
      throw: true
    });
    return findZiplineFileId(response.json, imageUrl, upload.origin);
  }

  /** Calls one explicitly configured image-host deletion API. */
  private async deleteImageFromHostConfig(host: ImageHostConfig, url: string, hash?: string, deleteKey?: string): Promise<void> {
    let resolvedDeleteKey = deleteKey?.trim();
    if (host.preset === "zipline" && !resolvedDeleteKey) {
      resolvedDeleteKey = await this.resolveZiplineFileId(host, url);
      if (!resolvedDeleteKey) throw new Error("Zipline 未找到可删除的文件 ID");
    }
    const values = { url, hash, deleteKey: resolvedDeleteKey };
    const endpoint = normalizeHttpUrl(applyImageDeleteTemplate(host.deleteEndpoint, values, "url"), "删除 API");
    const headers = parseUploadHeaders(host.headers);
    const body = host.deleteBody.trim()
      ? applyImageDeleteTemplate(host.deleteBody, values, "json")
      : undefined;
    await requestUrl({
      url: endpoint,
      method: host.deleteMethod,
      headers,
      contentType: body && host.deleteMethod !== "GET" ? "application/json" : undefined,
      body: host.deleteMethod === "GET" ? undefined : body,
      throw: true
    });
  }

  /**
   * 执行“flush open view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param path 仓库内目标路径。
   */
  private async flushOpenView(path: string): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView && leaf.view.file?.path === path) await leaf.view.save();
    }
  }

  /**
   * 刷新open mind map，并保持模型、界面和持久化状态的一致性。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param document 要处理的思维导图文档。
   */
  private async refreshOpenMindMap(file: TFile, document: MindMapDocument): Promise<void> {
    const source = serializeDocument(document);
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView && leaf.view.file?.path === file.path) leaf.view.setViewData(source, false);
    }
  }

  /**
   * 在删除本地图片前进行最终安全检查：远程源必须存在、当前文档必须已保存、资源路径必须是仓库内文件且没有其他节点继续引用。
   *
   * @param localPath 该参数用于 delete local asset if safe 流程中的输入或控制。
   * @param currentMindMapPath 该参数用于 delete local asset if safe 流程中的输入或控制。
   * @param blockId 该参数用于 delete local asset if safe 流程中的输入或控制。
   * @returns 操作条件是否成立或处理是否成功。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
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

  /**
   * 根据资源文件名推断图片 MIME，未知扩展名按二进制流处理。
   *
   * @param filename 资源文件名或仓库路径。
   * @returns 已知图片 MIME 或 `application/octet-stream`。
   */
  private mimeFromFilename(filename: string): string {
    return mimeTypeFromFilename(filename);
  }

  /**
   * 在父导图资源目录下创建子导图文件，写入 parentPath、parentNodeId 和 parentTitle，并把生成路径回写到父节点，实现可靠的双向导航。
   *
   * @param parentFile 父导图文件，用于确定存储目录和回链元数据。
   * @param node 作为子导图入口的节点；仅复制其标题，不移动后代内容。
   * @returns 新建子导图的仓库路径与显示标题。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  async createSubmapFile(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap> {
    const document = this.buildSubmapDocument(parentFile, node, false);
    return this.persistSubmapDocument(parentFile, node, document);
  }

  /**
   * 创建子导图文档并统一写入双向导航元数据。
   *
   * @param parentFile 父导图文件。
   * @param node 作为子导图入口的父节点。
   * @param includeNodeContent 是否把当前节点内容与后代复制到子导图根节点。
   * @returns 尚未写入仓库的子导图文档。
   */
  private buildSubmapDocument(parentFile: TFile, node: MindMapNode, includeNodeContent: boolean): MindMapDocument {
    const title = (nodePlainText(node) || "子导图").trim();
    const document = this.createConfiguredDocument(title);
    if (includeNodeContent) {
      document.root.children = JSON.parse(JSON.stringify(node.children)) as MindMapNode[];
      if (node.content) document.root.content = JSON.parse(JSON.stringify(node.content)) as MindMapNode["content"];
      if (node.richText) document.root.richText = JSON.parse(JSON.stringify(node.richText));
      document.root.note = node.note;
      document.root.tags = node.tags?.slice();
      document.root.icon = node.icon;
      if (node.code) document.root.code = JSON.parse(JSON.stringify(node.code));
      if (node.table) document.root.table = JSON.parse(JSON.stringify(node.table));
    } else {
      // A newly created child map should behave like a normal new document:
      // keep the two default starter branches ("主题 1" and "主题 2") while
      // replacing only the root title with the parent node text.
      document.root.content = [{ id: `${document.root.id}_title`, type: "text", text: title }];
    }
    document.root.link = undefined;
    syncNodeContentFields(document.root);
    document.title = title;
    document.navigation = {
      parentPath: parentFile.path,
      parentNodeId: node.id,
      parentTitle: parentFile.basename,
      parentNodeText: nodePlainText(node) || undefined
    };
    return document;
  }

  /**
   * 把子导图写入父导图专属资源目录，避免多个父导图的同名子图发生路径冲突。
   *
   * @param parentFile 父导图文件。
   * @param node 作为子导图入口的父节点。
   * @param document 已完成导航元数据初始化的子导图文档。
   * @returns 写入后的子导图路径与标题。
   */
  private async persistSubmapDocument(parentFile: TFile, node: MindMapNode, document: MindMapDocument): Promise<MindMapSubmap> {
    const parentFolder = parentFile.parent?.path ?? "";
    const configuredAssets = normalizePath(this.settings.assetFolder || "MindMap Assets");
    const parentMapFolder = this.sanitizeFilename(parentFile.basename);
    const submapFolder = normalizePath([parentFolder, configuredAssets, parentMapFolder].filter(Boolean).join("/"));
    await this.ensureFolderPath(submapFolder);
    const title = (nodePlainText(node) || "子导图").trim();
    const path = await this.getAvailablePath(normalizePath(`${submapFolder}/${this.sanitizeFilename(title)}.${MINDMAP_EXTENSION}`));
    const file = await this.app.vault.create(path, serializeDocument(document));
    return { path: file.path, title: file.basename };
  }

  /**
   * Moves a linked child mind-map file to the system trash.
   *
   * @param parentFile Parent map used to resolve relative paths.
   * @param submap Stored child-map link.
   * @returns Whether a physical child-map file was found and deleted.
   */
  async deleteSubmapFile(parentFile: TFile, submap: MindMapSubmap): Promise<boolean> {
    const target = this.resolveMindMapFile(submap.path, parentFile.path);
    if (!target) return false;
    await this.app.vault.trash(target, true);
    return true;
  }

  /**
   * 打开mind map path，并保持模型、界面和持久化状态的一致性。
   *
   * @param path 仓库内目标路径。
   * @param sourcePath 该参数用于 open mind map path 流程中的输入或控制。
   * @param preferredLeaf 该参数用于 open mind map path 流程中的输入或控制。
   * @param focusNodeId 该参数用于 open mind map path 流程中的输入或控制。
   */
  async openMindMapPath(path: string, sourcePath = "", preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void> {
    const normalized = normalizePath(path.replace(/^\[\[|\]\]$/g, ""));
    this.logDebug("navigation", "open-path-request", { path, normalized, sourcePath, focusNodeId });
    const direct = this.app.vault.getAbstractFileByPath(normalized);
    const resolved = direct instanceof TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!(resolved instanceof TFile) || !this.isMindMapFile(resolved)) {
      this.logDebug("navigation", "open-path-missing", { path, normalized, sourcePath, focusNodeId });
      new Notice(`找不到子导图：${path}`);
      return;
    }
    const resolvedFocusNodeId = await this.resolveNavigationFocusNode(resolved, sourcePath, focusNodeId);
    this.logDebug("navigation", "open-path-resolved", { targetPath: resolved.path, requestedFocusNodeId: focusNodeId, resolvedFocusNodeId });
    await this.openAsMindMap(resolved, preferredLeaf, resolvedFocusNodeId);
  }

  /** Opens a parent/home map as its generated directory without treating the mount node as an article chapter target. */
  async openArticleDirectoryPath(path: string, sourcePath = "", preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void> {
    const normalized = normalizePath(path.replace(/^\[\[|\]\]$/g, ""));
    this.logDebug("navigation", "open-directory-request", { path, normalized, sourcePath, focusNodeId });
    const direct = this.app.vault.getAbstractFileByPath(normalized);
    const resolved = direct instanceof TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!(resolved instanceof TFile) || !this.isMindMapFile(resolved)) {
      this.logDebug("navigation", "open-directory-missing", { path, normalized, sourcePath, focusNodeId });
      new Notice(`找不到父导图：${path}`);
      return;
    }
    let resolvedDirectoryNodeId = focusNodeId;
    if (!resolvedDirectoryNodeId || !(await this.readMindMapDocument(resolved).then((document) => findNode(document.root, resolvedDirectoryNodeId!)).catch(() => undefined))) {
      resolvedDirectoryNodeId = await this.resolveNavigationFocusNode(resolved, sourcePath, focusNodeId);
    }
    const directoryRequest = { focusNodeId: resolvedDirectoryNodeId };
    this.pendingMindMapDirectory.set(resolved.path, directoryRequest);
    this.logDebug("navigation", "queue-directory", { targetPath: resolved.path, resolvedDirectoryNodeId, queued: this.pendingMindMapDirectory.size });
    const leaf = await this.openAsMindMap(resolved, preferredLeaf);
    const pendingAfterOpen = this.pendingMindMapDirectory.get(resolved.path);
    if (pendingAfterOpen === directoryRequest) {
      this.pendingMindMapDirectory.delete(resolved.path);
      if (leaf.view instanceof MindMapStudioView) leaf.view.showArticleDirectory(resolvedDirectoryNodeId);
    }
    this.logDebug("navigation", "open-directory-resolved", {
      targetPath: resolved.path,
      requestedFocusNodeId: focusNodeId,
      resolvedDirectoryNodeId,
      consumedDuringLoad: pendingAfterOpen !== directoryRequest
    });
  }

  /** Validates explicit chapter targets and recovers a stale/missing parent mount node by child-map path. */
  private async resolveNavigationFocusNode(targetFile: TFile, sourcePath: string, requestedNodeId?: string): Promise<string | undefined> {
    if (!requestedNodeId && !sourcePath) return undefined;
    try {
      const targetDocument = await this.readMindMapDocument(targetFile);
      if (requestedNodeId && findNode(targetDocument.root, requestedNodeId)) return requestedNodeId;

      const normalizedSourcePath = sourcePath ? normalizePath(sourcePath) : "";
      const sourceFile = normalizedSourcePath ? this.app.vault.getAbstractFileByPath(normalizedSourcePath) : null;
      if (sourceFile instanceof TFile && this.isMindMapFile(sourceFile)) {
        const sourceDocument = await this.readMindMapDocument(sourceFile);
        const declaredParent = sourceDocument.navigation?.parentPath
          ? this.resolveMindMapFile(sourceDocument.navigation.parentPath, sourceFile.path)
          : null;
        if (declaredParent?.path === targetFile.path) {
          const declaredNodeId = sourceDocument.navigation?.parentNodeId;
          if (declaredNodeId && findNode(targetDocument.root, declaredNodeId)) {
            this.logDebug("navigation", "recover-parent-focus-from-navigation", { targetPath: targetFile.path, sourcePath: sourceFile.path, requestedNodeId, declaredNodeId });
            return declaredNodeId;
          }
        }
        const mountNode = flattenNodes(targetDocument.root).find((node) => {
          if (!node.submap?.path) return false;
          return this.resolveMindMapFile(node.submap.path, targetFile.path)?.path === sourceFile.path;
        });
        if (mountNode) {
          this.logDebug("navigation", "recover-parent-focus-by-submap", { targetPath: targetFile.path, sourcePath: sourceFile.path, requestedNodeId, declaredParentPath: declaredParent?.path, mountNodeId: mountNode.id });
          return mountNode.id;
        }
      }
      if (requestedNodeId) {
        this.logDebug("navigation", "focus-node-not-found", { targetPath: targetFile.path, sourcePath, requestedNodeId });
        new Notice("目标章节已不存在，已打开目标导图");
      }
    } catch (error) {
      this.logDebug("navigation", "focus-validation-failed", { targetPath: targetFile.path, sourcePath, requestedNodeId, error });
      return requestedNodeId;
    }
    return undefined;
  }

  /**
   * 执行“ensure folder path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param folder 目标 Obsidian 文件夹对象。
   */
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

  /**
   * 判断mind map file，并保持模型、界面和持久化状态的一致性。
   *
   * @param file 目标 Obsidian 文件对象。
   * @returns 操作条件是否成立或处理是否成功。
   */
  isMindMapFile(file: TFile): boolean {
    return file.extension.toLowerCase() === MINDMAP_EXTENSION;
  }

  /**
   * 转换markdown file，并保持模型、界面和持久化状态的一致性。
   *
   * @param file 目标 Obsidian 文件对象。
   */
  private async convertMarkdownFile(file: TFile): Promise<void> {
    const source = await this.app.vault.read(file);
    const title = file.basename;
    const document = markdownToDocument(source, title, { sourcePath: file.path });
    document.layout = this.settings.defaultLayout;
    document.theme = this.settings.defaultTheme;
    document.appearance = settingsToAppearance(this.settings);
    const mindMapFile = await this.createMindMap({ document, title: `${title} 脑图`, folder: file.parent?.path ?? "" });
    const copied = await this.copyImportedMarkdownImages(document, file, mindMapFile);
    if (copied > 0) {
      await this.app.vault.modify(mindMapFile, serializeDocument(document));
      await this.resumePendingAutoUploads(mindMapFile, document);
    }
  }

  /**
   * 将 Markdown 中引用的本地图片复制到新导图自己的资源目录，并改写图片块引用。
   * 导入完成后，导图不再依赖原 Markdown 附件目录，移动或删除原笔记也不会导致图片失效。
   *
   * @param document 已由 Markdown 解析得到的导图文档。
   * @param markdownFile 原 Markdown 文件，用于解析 Obsidian 相对链接。
   * @param mindMapFile 新创建的导图文件，用于确定目标资源目录。
   * @returns 成功复制并改写的图片数量。
   */
  private async copyImportedMarkdownImages(document: MindMapDocument, markdownFile: TFile, mindMapFile: TFile): Promise<number> {
    const configuredFolder = normalizePath((this.settings.assetFolder || "MindMap Assets").replace(/^\/+|\/+$/g, ""));
    const targetFolder = normalizePath([mindMapFile.parent?.path ?? "", configuredFolder].filter(Boolean).join("/"));
    let copied = 0;
    const copiedPaths = new Map<string, string>();
    const reservedPaths = new Set<string>();
    const copyPromises: Promise<unknown>[] = [];
    let folderEnsured = false;

    for (const node of flattenNodes(document.root)) {
      const blocks = nodeContentBlocks(node);
      let changed = false;
      for (const block of blocks) {
        if (block.type !== "image") continue;
        const rawSource = (block.localSource || block.source || "").trim();
        if (!rawSource || /^(?:https?:|data:|blob:|file:)/i.test(rawSource)) continue;
        const linkPath = rawSource.replace(/^!?\[\[|\]\]$/g, "").split("|")[0]?.split("#")[0]?.trim() ?? "";
        if (!linkPath) continue;
        const sourceImage = this.resolveImportedMarkdownImage(linkPath, markdownFile);
        if (!(sourceImage instanceof TFile) || sourceImage.path === mindMapFile.path) continue;

        let targetPath = copiedPaths.get(sourceImage.path);
        if (!targetPath) {
          if (!folderEnsured) {
            await this.ensureFolderPath(targetFolder);
            folderEnsured = true;
          }
          const preferredPath = normalizePath(`${targetFolder}/${this.sanitizeFilename(sourceImage.basename)}.${sanitizeFileExtension(sourceImage.name, "png")}`);

          let candidate = preferredPath;
          let index = 2;
          const dot = candidate.lastIndexOf(".");
          const base = dot > candidate.lastIndexOf("/") ? candidate.slice(0, dot) : candidate;
          const extension = dot > candidate.lastIndexOf("/") ? candidate.slice(dot) : "";

          while (this.app.vault.getAbstractFileByPath(candidate) || reservedPaths.has(candidate)) {
            candidate = `${base} ${index}${extension}`;
            index += 1;
          }

          targetPath = candidate;
          reservedPaths.add(targetPath);
          copiedPaths.set(sourceImage.path, targetPath);

          const src = sourceImage;
          const dest = targetPath;
          copyPromises.push(
            this.app.vault.readBinary(src).then((data) => this.app.vault.createBinary(dest, data))
          );
          copied += 1;
        }
        block.source = targetPath;
        block.localSource = targetPath;
        changed = true;
      }
      if (changed) replaceNodeContentBlocks(node, blocks);
    }

    await Promise.all(copyPromises);
    return copied;
  }


  /**
   * 按固定回退顺序查找 Markdown 中的本地图片。
   *
   * 例如 Markdown 引用 `assets/公文/a.png` 时，依次尝试：
   * 1. `<Markdown目录>/assets/公文/a.png`
   * 2. `<Markdown目录>/公文/a.png`
   * 3. `<Markdown目录>/a.png`
   *
   * 三个明确候选都不存在时，再交给 Obsidian 链接解析器兼容其他附件配置。
   */
  private resolveImportedMarkdownImage(linkPath: string, markdownFile: TFile): TFile | null {
    const normalizedLink = normalizePath(linkPath.replace(/^\/+/, ""));
    const markdownFolder = markdownFile.parent?.path ?? "";
    const segments = normalizedLink.split("/").filter(Boolean);
    const withoutAssets = segments[0]?.toLowerCase() === "assets" ? segments.slice(1).join("/") : normalizedLink;
    const filename = segments.at(-1) ?? normalizedLink;
    const relativeCandidates = [normalizedLink, withoutAssets, filename]
      .filter(Boolean)
      .map((relativePath) => normalizePath([markdownFolder, relativePath].filter(Boolean).join("/")));
    const candidates = [normalizedLink, ...relativeCandidates];

    for (const candidate of [...new Set(candidates)]) {
      const file = this.app.vault.getAbstractFileByPath(candidate);
      if (file instanceof TFile) return file;
    }

    const resolved = this.app.metadataCache.getFirstLinkpathDest(normalizedLink, markdownFile.path);
    return resolved instanceof TFile ? resolved : null;
  }

  /**
   * 解析并确定folder，并保持模型、界面和持久化状态的一致性。
   *
   * @param explicitFolder 该参数用于 resolve folder 流程中的输入或控制。
   * @param activeFile 该参数用于 resolve folder 流程中的输入或控制。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  private async resolveFolder(explicitFolder: string | undefined, activeFile: TFile | null): Promise<string> {
    const candidate = explicitFolder ?? (this.settings.defaultFolder || activeFile?.parent?.path || "");
    if (!candidate) return "";
    const normalized = normalizePath(candidate);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof TFolder) return normalized;
    await this.ensureFolderPath(normalized);
    return normalized;
  }

  /**
   * 构建new title，并保持模型、界面和持久化状态的一致性。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  private buildNewTitle(): string {
    return buildDefaultMindMapTitle(this.settings.filePrefix, new Date());
  }

  /**
   * 执行“sanitize filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param value 待校验、转换或比较的输入值。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  sanitizeFilename(value: string): string {
    return sanitizeCrossPlatformFilename(value);
  }

  /**
   * 读取并返回source title，并保持模型、界面和持久化状态的一致性。
   *
   * @param context 该参数用于 get source title 流程中的输入或控制。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  private getSourceTitle(context: MarkdownPostProcessorContext): string {
    const sourceFile = this.app.vault.getAbstractFileByPath(context.sourcePath);
    return sourceFile instanceof TFile ? sourceFile.basename : "思维导图";
  }

  /**
   * 注册 Markdown 代码块静态渲染，并在阅读模式中解析嵌入的思维导图源。静态预览不会修改原文件。
   *
   * @param element 该参数用于 process mind map embeds 流程中的输入或控制。
   * @param context 该参数用于 process mind map embeds 流程中的输入或控制。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
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

  /**
   * 将指定节点及其后代提取为独立子导图文件。
   * @param parentFile 当前父导图文件。
   * @param node 要提取的节点（及其后代）。
   * @returns 创建的子导图引用。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  async extractToSubmap(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap> {
    const document = this.buildSubmapDocument(parentFile, node, true);
    return this.persistSubmapDocument(parentFile, node, document);
  }

  /**
   * 将当前子导图合并回其父导图。
   * @param submapFile 当前子导图文件。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  async mergeFromSubmap(submapFile: TFile): Promise<void> {
    const submapContent = await this.app.vault.read(submapFile);
    const submapDoc = parseDocument(submapContent, submapFile.basename);
    const parentPath = submapDoc.navigation?.parentPath;
    if (!parentPath) { new Notice("此子导图没有父导图引用，无法合并"); return; }
    const parentFile = this.app.vault.getAbstractFileByPath(normalizePath(parentPath));
    if (!(parentFile instanceof TFile)) { new Notice("父导图文件不存在"); return; }
    const parentContent = await this.app.vault.read(parentFile);
    const parentDoc = parseDocument(parentContent, parentFile.basename);
    let targetNode: MindMapNode | null = null;
    const searchParent = (node: MindMapNode): void => {
      if (targetNode) return;
      if (node.submap?.path) {
        const resolved = this.resolveMindMapFile(node.submap.path, parentFile.path);
        if (resolved?.path === submapFile.path) { targetNode = node; return; }
      }
      for (const child of node.children) searchParent(child);
    };
    searchParent(parentDoc.root);
    if (!targetNode) { new Notice("父导图中找不到链接到该子导图的节点"); return; }
    const merged = JSON.parse(JSON.stringify(submapDoc.root.children)) as MindMapNode[];
    (targetNode as MindMapNode).children.push(...merged);
    (targetNode as MindMapNode).submap = undefined;
    await this.app.vault.modify(parentFile, serializeDocument(parentDoc));
    await this.app.vault.trash(submapFile, true);
    new Notice("已合并到 " + parentFile.basename + " 并删除子导图");
    await this.openMindMapPath(parentFile.path, "", undefined);
  }
}
