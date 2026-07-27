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
  findNode,
  flattenNodes,
  markdownToDocument,
  nodeContentBlocks,
  nodePlainText,
  reconcileRichTextAfterEdit,
  syncNodeContentFields,
  parseDocument,
  serializeDocument,
  type MindMapDocument,
  type MindMapImageContentBlock,
  type MindMapNode,
  type MindMapSubmap
} from "./core/model";
import {
  DEFAULT_SETTINGS,
  MindMapStudioSettingTab,
  TOOLBAR_ITEMS,
  createImageHostConfig,
  normalizeReturnToTopVisibility,
  settingsToAppearance,
  type ImageHostChoice,
  type ImageHostConfig,
  type ImageHostUploadBatch,
  type ImageHostUploadSuccess,
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
  normalizeVisibleModes,
  resolveArticleNumbering,
  resolveArticleSiblingPages,
  type ArticlePageNavigation,
  type ArticleTocEntry,
  type ReadingSection
} from "./article/modes";
import { resolveStartupDisplayMode, shouldPersistDisplayMode } from "./article/display-mode";
import type { DisplayMode } from "./core/model";
import { normalizeReadingLocation, renameReadingLocationPath } from "./article/reading-location";
import { normalizeAiProfileConfig, type AiProfileConfig } from "./ai/config";
import { requestAiCompletion, type AiCompletionResult } from "./ai/client";
import type { AiMarkdownPayload } from "./ai/markdown";
import { shouldHideFileExplorerPath } from "./file-explorer-filter";
import {
  buildCompactTimestamp,
  buildDefaultMindMapTitle,
  mimeTypeFromFilename,
  sanitizeFileExtension,
  sanitizeFilename as sanitizeCrossPlatformFilename
} from "./utils/filename";
import {
  buildMultipartUploadBody,
  extractImageUrlFromResponse,
  normalizeHttpUrl,
  parseUploadHeaders,
  parseUploadResponsePayload
} from "./utils/image-host";

export const MINDMAP_EXTENSION = "mindmap";

/**
 * MindMapStudioPlugin 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export default class MindMapStudioPlugin extends Plugin {
  settings: MindMapStudioSettings = DEFAULT_SETTINGS;
  /** 当前会话使用的显示模式；大纲模式不会写成下次启动默认值。 */
  private activeDisplayMode: DisplayMode = DEFAULT_SETTINGS.defaultViewMode;
  private readonly autoUploadTimers = new Map<string, number>();
  private searchIndex!: MindMapSearchIndex;
  private searchIndexReady: Promise<void> = Promise.resolve();
  private fileExplorerFilterTimer: number | null = null;
  private fileExplorerObserver: MutationObserver | null = null;

  /**
   * 执行“onload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  async onload(): Promise<void> {
    await this.loadSettings();
    this.installFileExplorerFilter();
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
      this.scheduleFileExplorerFilter();
      if (file instanceof TFile && this.isMindMapFile(file)) this.searchIndex.queueFile(file, 80);
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      this.scheduleFileExplorerFilter();
      if (file instanceof TFile && this.isMindMapFile(file)) this.searchIndex.queueFile(file);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      this.scheduleFileExplorerFilter();
      if (file instanceof TFile && file.extension.toLowerCase() === MINDMAP_EXTENSION) this.searchIndex.removeFile(file.path);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      this.scheduleFileExplorerFilter();
      if (file instanceof TFile && this.isMindMapFile(file)) void this.renameReadingLocationPathInSettings(oldPath, file.path);
      if (file instanceof TFile && this.isMindMapFile(file)) this.searchIndex.renameFile(file, oldPath);
      else if (oldPath.toLowerCase().endsWith(`.${MINDMAP_EXTENSION}`)) this.searchIndex.removeFile(oldPath);
    }));

    this.registerMarkdownCodeBlockProcessor("mindmap", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownCodeBlockProcessor("mindmap-json", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownPostProcessor((element, context) => void this.processMindMapEmbeds(element, context));
  }

  /**
   * 执行“onunload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  onunload(): void {
    if (this.fileExplorerFilterTimer !== null) window.clearTimeout(this.fileExplorerFilterTimer);
    this.fileExplorerObserver?.disconnect();
    this.fileExplorerObserver = null;
    for (const timer of this.autoUploadTimers.values()) window.clearTimeout(timer);
    this.autoUploadTimers.clear();
    this.searchIndex?.destroy();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO);
  }

  /**
   * 打开global search，并保持模型、界面和持久化状态的一致性。
   */
  openGlobalSearch(): void {
    void this.openGlobalSearchAfterIndexReady();
  }

  /**
   * 打开global search after index ready，并保持模型、界面和持久化状态的一致性。
   */
  private async openGlobalSearchAfterIndexReady(): Promise<void> {
    await this.searchIndexReady;
    new GlobalMindMapSearchModal(
      this.app,
      this.searchIndex,
      this.settings.globalSearchMaxResults,
      (result) => this.openGlobalSearchResult(result),
      () => this.searchIndex.rebuildAll(),
      (results, query, replacement, useRegex) => this.replaceAllInSearchResults(results, query, replacement, useRegex)
    ).open();
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
    let modifiedCount = 0;
    for (const [filePath, fileResults] of byFile) {
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) continue;
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
        if (!fileModified) continue;

        await this.app.vault.modify(file, serializeDocument(doc));
        const persisted = parseDocument(await this.app.vault.read(file), file.basename);
        for (const nodeId of changedNodeIds) {
          const expectedNode = findNode(doc.root, nodeId);
          const persistedNode = findNode(persisted.root, nodeId);
          if (!expectedNode || !persistedNode) continue;
          if (nodePlainText(expectedNode) !== nodePlainText(persistedNode)) continue;
          if (expectedNode.note !== persistedNode.note) continue;
          modifiedCount += 1;
        }
        // An open editor retains its own document instance. Refresh it from the
        // persisted replacement so a later editor save cannot restore old text.
        await this.refreshOpenMindMap(file, persisted);
      } catch (err) {
        console.warn(`MindMap Studio could not replace in ${filePath}:`, err);
      }
    }
    return modifiedCount;
  }

  /**
   * 加载settings，并保持模型、界面和持久化状态的一致性。
   */
  async loadSettings(): Promise<void> {
    const loaded = await this.loadData() as Partial<MindMapStudioSettings> | null;
    const raw = (loaded ?? {}) as Partial<MindMapStudioSettings> & Record<string, unknown>;
    const imageHosts: ImageHostConfig[] = Array.isArray(raw.imageHosts)
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

    const enabledIds = new Set(imageHosts.filter((host) => host.enabled).map((host) => host.id));
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
      autoUploadEnabled: raw.autoUploadEnabled === true,
      autoUploadDelaySeconds: typeof raw.autoUploadDelaySeconds === "number"
        ? Math.max(0, Math.min(300, Math.round(raw.autoUploadDelaySeconds)))
        : DEFAULT_SETTINGS.autoUploadDelaySeconds,
      autoUploadHostIds: selectedIds,
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
        const knownIds = new Set<string>(TOOLBAR_ITEMS.map(([id]) => id));
        const stored = Array.isArray(raw.visibleToolbarItems)
          ? raw.visibleToolbarItems.filter((id): id is string => typeof id === "string" && knownIds.has(id))
          : [...DEFAULT_SETTINGS.visibleToolbarItems];
        if (!hadAiSettings && !stored.includes("ai")) stored.push("ai");
        return [...new Set(stored)];
      })(),
      toolbarItemOrder: (() => {
        const validIds = new Set<string>(TOOLBAR_ITEMS.map(([id]) => id));
        const stored = Array.isArray(raw.toolbarItemOrder)
          ? raw.toolbarItemOrder.filter((id): id is string => typeof id === "string" && validIds.has(id))
          : [];
        return [...new Set([...stored, ...DEFAULT_SETTINGS.toolbarItemOrder])];
      })(),
      defaultViewMode: typeof raw.defaultViewMode === "string"
        ? raw.defaultViewMode as DisplayMode
        : DEFAULT_SETTINGS.defaultViewMode,
      readingLocations: typeof raw.readingLocations === "object" && raw.readingLocations
        ? Object.fromEntries(Object.entries(raw.readingLocations).flatMap(([path, value]) => {
          const location = normalizeReadingLocation(value);
          return location ? [[path, location] as const] : [];
        }))
        : {},
      articleTocMaxDepth: typeof raw.articleTocMaxDepth === "number"
        ? Math.max(1, Math.min(8, Math.round(raw.articleTocMaxDepth)))
        : DEFAULT_SETTINGS.articleTocMaxDepth,
      showArticleMiniMap: raw.showArticleMiniMap !== false,
      articleSectionCollapseEnabled: raw.articleSectionCollapseEnabled === true,
      articleLeafBulletsEnabled: raw.articleLeafBulletsEnabled === true,
      articleLeafBulletColor: typeof raw.articleLeafBulletColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.articleLeafBulletColor)
        ? raw.articleLeafBulletColor
        : "",
      articleLeafBulletStyle: raw.articleLeafBulletStyle === "hollow" || raw.articleLeafBulletStyle === "square" || raw.articleLeafBulletStyle === "dash"
        ? raw.articleLeafBulletStyle
        : "solid",
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
    this.settings.defaultViewMode = resolveStartupDisplayMode(this.settings.defaultViewMode, this.settings.visibleModes);
    this.activeDisplayMode = this.settings.defaultViewMode;
  }

  /**
   * 保存settings，并保持模型、界面和持久化状态的一致性。
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.scheduleFileExplorerFilter();
  }

  /** 使用指定 AI 配置发送当前 Markdown 上下文。 */
  async askAi(profileId: string, payload: AiMarkdownPayload, question: string): Promise<AiCompletionResult> {
    const profile: AiProfileConfig | undefined = this.settings.aiProfiles.find((item) => item.id === profileId && item.enabled);
    if (!profile) throw new Error("AI 接口不存在或未启用");
    return requestAiCompletion(profile, payload, question);
  }

  /** Installs a lightweight File Explorer observer; it changes visibility only, never vault data. */
  private installFileExplorerFilter(): void {
    const observe = (): void => {
      this.fileExplorerObserver?.disconnect();
      this.fileExplorerObserver = new MutationObserver(() => this.scheduleFileExplorerFilter());
      this.fileExplorerObserver.observe(document.body, { childList: true, subtree: true });
      this.scheduleFileExplorerFilter();
    };
    this.app.workspace.onLayoutReady(observe);
    this.register(() => this.fileExplorerObserver?.disconnect());
  }

  /** Defers File Explorer filtering so expanding a folder does not cause repeated synchronous DOM scans. */
  private scheduleFileExplorerFilter(): void {
    if (this.fileExplorerFilterTimer !== null) return;
    this.fileExplorerFilterTimer = window.setTimeout(() => {
      this.fileExplorerFilterTimer = null;
      document.querySelectorAll<HTMLElement>(".nav-files-container [data-path], .workspace-leaf-content[data-type='file-explorer'] [data-path]").forEach((element) => {
        const path = element.dataset.path;
        if (!path) return;
        const fileItem = element.closest<HTMLElement>(".tree-item")
          ?? element.closest<HTMLElement>(".nav-file, .nav-folder")
          ?? element;
        fileItem.toggleClass("mms-file-explorer-hidden", shouldHideFileExplorerPath(path, this.settings));
      });
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
    return parseDocument(await this.app.vault.cachedRead(file), file.basename);
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
  async buildArticleContext(file: TFile, document: MindMapDocument): Promise<{ baseDepth: number; tocEntries: ArticleTocEntry[]; showToc: boolean; navigation?: ArticlePageNavigation; readingSections: ReadingSection[] }> {
    const baseDepth = await this.computeArticleBaseDepth(file, document);
    let topFile = file;
    let topDocument = document;
    const ancestorPaths = new Set<string>([file.path]);
    while (topDocument.navigation?.parentPath) {
      const parentFile = this.resolveMindMapFile(topDocument.navigation.parentPath, topFile.path);
      if (!parentFile || ancestorPaths.has(parentFile.path)) break;
      ancestorPaths.add(parentFile.path);
      topFile = parentFile;
      topDocument = await this.readMindMapDocument(parentFile);
    }
    const isTopLevel = topFile.path === file.path;

    const tocEntries: ArticleTocEntry[] = [];
    const readingSections: ReadingSection[] = [{ filePath: topFile.path, document: topDocument, baseDepth: 0 }];
    const visitedFiles = new Set<string>([topFile.path]);
    let hasSubmaps = false;
    /**
     * Item 类型定义，用于限制可接受值并让序列化数据保持稳定。
     */
    type Item = { node: MindMapNode; file: TFile; document: MindMapDocument; breadcrumb: string[] };

    const processItems = async (items: Item[], defaultLevel: number, structureDepth: number): Promise<void> => {
      const siblingHasHeading = items.some(({ node }) => isArticleHeading(node));
      const numberedIndexes = new Map<number, number>();
      for (const item of items) {
        const { node, file: sourceFile, breadcrumb } = item;
        const numbering = resolveArticleNumbering(node, defaultLevel, siblingHasHeading);
        const numberedIndex = numbering.shouldNumber && !numbering.skipped
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
          breadcrumb: nextBreadcrumb
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
              const childDocument = await this.readMindMapDocument(childFile);
              readingSections.push({
                filePath: childFile.path,
                document: childDocument,
                baseDepth: numbering.level,
                parentFilePath: sourceFile.path,
                parentNodeId: node.id
              });
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
        if (descendants.length) await processItems(descendants, numbering.level + 1, structureDepth + 1);
      }
    };

    await processItems(topDocument.root.children.map((node) => ({
      node,
      file: topFile,
      document: topDocument,
      breadcrumb: [nodePlainText(topDocument.root) || topDocument.title]
    })), articleChildStartLevel(topDocument.root), 1);
    const siblingPages = resolveArticleSiblingPages(tocEntries, file.path);
    const parentFile = document.navigation?.parentPath
      ? this.resolveMindMapFile(document.navigation.parentPath, file.path)
      : null;
    const navigation: ArticlePageNavigation | undefined = tocEntries.length
      ? {
        entries: siblingPages.entries,
        currentIndex: siblingPages.currentIndex,
        homePath: topFile.path,
        parentPath: parentFile?.path
      }
      : undefined;
    return {
      baseDepth,
      tocEntries,
      showToc: isTopLevel && hasSubmaps && tocEntries.length > 0,
      navigation
      ,readingSections
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
    const sections: ReadingSection[] = [{ filePath: file.path, document, baseDepth: 0 }];
    const visited = new Set<string>([file.path]);
    const visit = async (nodes: MindMapNode[], sourceFile: TFile, defaultLevel: number): Promise<void> => {
      const siblingHasHeading = nodes.some((node) => isArticleHeading(node));
      for (const node of nodes) {
        const numbering = resolveArticleNumbering(node, defaultLevel, siblingHasHeading);
        if (node.submap?.path) {
          const childFile = this.resolveMindMapFile(node.submap.path, sourceFile.path);
          if (childFile && !visited.has(childFile.path)) {
            visited.add(childFile.path);
            try {
              const childDocument = await this.readMindMapDocument(childFile);
              sections.push({
                filePath: childFile.path,
                document: childDocument,
                baseDepth: numbering.level,
                parentFilePath: sourceFile.path,
                parentNodeId: node.id
              });
              await visit(childDocument.root.children, childFile, articleChildStartLevel(childDocument.root, numbering.level));
            } catch (error) {
              console.warn(`MindMap Studio could not read child map for export: ${childFile.path}`, error);
            }
          }
        }
        if (node.children.length) await visit(node.children, sourceFile, numbering.level + 1);
      }
    };
    await visit(document.root.children, file, articleChildStartLevel(document.root));
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

  /**
   * 打开as mind map，并保持模型、界面和持久化状态的一致性。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param preferredLeaf 该参数用于 open as mind map 流程中的输入或控制。
   * @param focusNodeId 该参数用于 open as mind map 流程中的输入或控制。
   */
  async openAsMindMap(file: TFile, preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<WorkspaceLeaf> {
    const leaf = preferredLeaf ?? this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_MINDMAP_STUDIO,
      state: { file: file.path },
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
    if (focusNodeId && leaf.view instanceof MindMapStudioView) leaf.view.markExplicitNavigation(focusNodeId);
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
   * 执行“read image source”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param source 待解析或渲染的原始文本。
   * @param sourceFile 该参数用于 read image source 流程中的输入或控制。
   * @returns 计算、解析或序列化后的字符串结果。
   */
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

  /**
   * 读取并返回image host choices，并保持模型、界面和持久化状态的一致性。
   * @returns 按当前规则构建的集合结果。
   */
  getImageHostChoices(): ImageHostChoice[] {
    return this.settings.imageHosts
      .filter((host) => host.enabled && Boolean(host.endpoint.trim()))
      .map((host) => ({ id: host.id, name: host.name }));
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
      const url = await this.uploadImageToHostConfig(host, new Blob([png], { type: "image/png" }), "mindmap-studio-api-test.png");
      const elapsed = Math.max(1, Math.round(performance.now() - started));
      new Notice(`${host.name} 连接成功（${elapsed} ms）\n${url}`, 8000);
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

  /**
   * 执行延迟自动上传任务。它确认节点和图片块仍存在、读取本地资源、上传到默认图床、更新远程镜像列表并保存；任一图床失败时保留本地文件。
   *
   * @param mindMapPath 该参数用于 run auto upload task 流程中的输入或控制。
   * @param nodeId 目标节点的稳定标识。
   * @param blockId 该参数用于 run auto upload task 流程中的输入或控制。
   * @param localPath 该参数用于 run auto upload task 流程中的输入或控制。
   * @param suggestedName 该参数用于 run auto upload task 流程中的输入或控制。
   * @param hostIds 需要执行上传的图床标识列表。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
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
      syncNodeContentFields(node);
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

  /**
   * 按单个图床配置上传图片，并从 JSON 或文本响应中解析最终图片地址。
   *
   * @param host 图床端点、请求头、请求体模式和响应字段路径。
   * @param blob 待上传的图片内容。
   * @param suggestedName 上传文件名；写入 multipart 前会进行跨平台清洗。
   * @returns 服务端返回的第一个合法 HTTP(S) 图片地址。
   * @throws 配置、请求体或响应格式不合法，以及网络请求失败时抛出错误。
   */
  private async uploadImageToHostConfig(host: ImageHostConfig, blob: Blob, suggestedName: string): Promise<string> {
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
    const imageUrl = extractImageUrlFromResponse(payload, [host.responsePath]);
    if (!imageUrl) throw new Error("返回结果中没有找到图片网址");
    return imageUrl;
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
      document.root.task = node.task;
      document.root.icon = node.icon;
      if (node.code) document.root.code = JSON.parse(JSON.stringify(node.code));
      if (node.table) document.root.table = JSON.parse(JSON.stringify(node.table));
    } else {
      document.root.children = [];
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
    const direct = this.app.vault.getAbstractFileByPath(normalized);
    const resolved = direct instanceof TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!(resolved instanceof TFile) || !this.isMindMapFile(resolved)) {
      new Notice(`找不到子导图：${path}`);
      return;
    }
    const leaf = await this.openAsMindMap(resolved, preferredLeaf);
    if (leaf.view instanceof MindMapStudioView) leaf.view.markExplicitNavigation(focusNodeId);
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
    const document = markdownToDocument(source, title);
    document.layout = this.settings.defaultLayout;
    document.theme = this.settings.defaultTheme;
    document.appearance = settingsToAppearance(this.settings);
    await this.createMindMap({ document, title: `${title} 脑图`, folder: file.parent?.path ?? "" });
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
