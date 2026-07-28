/**
 * @file settings.ts
 * @description 插件设置模型和设置页。
 *
 * 集中管理显示模式、节点默认样式、图床、图片容灾、搜索索引和一键恢复，并在保存后刷新打开视图。
 */

import { App, Notice, PluginSettingTab, Setting, SliderComponent, TextComponent } from "obsidian";
import type MindMapStudioPlugin from "./main";
import type {
  BackgroundPattern,
  DisplayMode,
  EdgeStyle,
  EdgeWidthMode,
  FontFamilyMode,
  LayoutMode,
  MindMapAppearance,
  MindMapThemePresetId,
  NodeShape,
  NodeTextAlign,
  ThemeMode
} from "./core/model";
import { appearanceFromThemePreset, MINDMAP_THEME_PRESETS } from "./themes";
import type { ReadingLocation } from "./article/reading-location";
import type { ImageRecognitionMode } from "./vision/recognition";
import {
  AI_PROVIDER_MODEL_PRESETS,
  AI_PROFILE_PRESETS,
  DEFAULT_AI_PROFILES,
  createAiProfileConfig,
  type AiProfileConfig,
  type AiProviderKind
} from "./ai/config";

export const TOOLBAR_ITEMS = [
  ["lock", "阅读/编辑模式"], ["add-child", "添加子节点"], ["add-sibling", "添加同级节点"],
  ["edit", "完整编辑节点"], ["duplicate", "克隆分支"], ["delete", "删除节点"],
  ["task", "任务状态"], ["collapse", "展开/收起"], ["collapse-all", "展开/折叠全部"], ["link", "打开链接"],
  ["search", "搜索导图"], ["global-search", "全局搜索"], ["ai", "询问 AI"], ["table", "表格"],
  ["code", "代码"], ["image", "粘贴图片"], ["screenshot", "插入截图"], ["submap", "子导图"],
  ["undo", "撤销"], ["redo", "重做"],
  ["fit", "适应画布"], ["layout", "切换布局"], ["appearance", "主题与外观"],
  ["article-landing", "目录/原始文章"], ["article-style", "文章样式"],
  ["markdown", "Markdown 大纲"], ["json", "导入文件 / JSON"], ["export-document", "导出文档"], ["export-svg", "导出 SVG"]
] as const;

/**
 * ImageHostBodyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type ImageHostBodyMode = "multipart" | "raw";
/**
 * ImageHostMethod 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type ImageHostMethod = "POST" | "PUT";

/** Visual shape used for unnumbered terminal article bullets. */
export type ArticleLeafBulletStyle = "solid" | "hollow" | "square" | "dash";

/**
 * ImageHostConfig 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostConfig {
  id: string;
  name: string;
  enabled: boolean;
  endpoint: string;
  method: ImageHostMethod;
  bodyMode: ImageHostBodyMode;
  fieldName: string;
  headers: string;
  responsePath: string;
}

/**
 * ImageHostChoice 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostChoice {
  id: string;
  name: string;
}

/**
 * ImageHostUploadSuccess 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostUploadSuccess {
  hostId: string;
  hostName: string;
  url: string;
}

/**
 * ImageHostUploadFailure 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostUploadFailure {
  hostId: string;
  hostName: string;
  error: string;
}

/**
 * ImageHostUploadBatch 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostUploadBatch {
  successes: ImageHostUploadSuccess[];
  failures: ImageHostUploadFailure[];
}

/**
 * 创建image host config，并保持模型、界面和持久化状态的一致性。
 *
 * @param index 当前元素在同级或列表中的零基索引。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function createImageHostConfig(index = 1): ImageHostConfig {
  return {
    id: `host_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: `图床 ${index}`,
    enabled: true,
    endpoint: "",
    method: "POST",
    bodyMode: "multipart",
    fieldName: "file",
    headers: "",
    responsePath: "data.url"
  };
}

/**
 * MindMapStudioSettings 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapStudioSettings {
  defaultFolder: string;
  filePrefix: string;
  assetFolder: string;
  defaultLayout: LayoutMode;
  defaultTheme: ThemeMode;
  defaultNodeShape: NodeShape;
  nodeWidthMode: "fixed" | "auto";
  defaultNodeWidth: number;
  autoNodeMaxWidth: number;
  twoFingerGestureAction: "zoom" | "pan";
  showTaskProgress: boolean;
  /** Whether saving a mind map renames its file to the root node title. */
  syncTitleToFilename: boolean;
  autoFitOnOpen: boolean;
  historyLimit: number;
  embedMaxHeight: number;
  defaultThemePreset: MindMapThemePresetId;
  backgroundColor: string;
  backgroundPattern: BackgroundPattern;
  backgroundPatternColor: string;
  fontFamily: FontFamilyMode;
  customFont: string;
  fontSize: number;
  edgeColor: string;
  edgeWidth: number;
  edgeStyle: EdgeStyle;
  edgeWidthMode: EdgeWidthMode;
  edgeMinWidth: number;
  rootColor: string;
  rootTextColor: string;
  colorfulBranches: boolean;
  branchColors: string[];
  nodeBackgroundColor: string;
  textColor: string;
  nodeBorderColor: string;
  nodeBorderWidth: number;
  defaultNodeTextAlign: NodeTextAlign;
  defaultTextBold: boolean;
  defaultTextItalic: boolean;
  defaultTextUnderline: boolean;
  imageHosts: ImageHostConfig[];
  autoUploadEnabled: boolean;
  autoUploadDelaySeconds: number;
  autoUploadHostIds: string[];
  deleteLocalAfterUpload: boolean;
  imageFailoverEnabled: boolean;
  imageFailoverTimeoutSeconds: number;
  imageFailoverUseLocalFallback: boolean;
  globalSearchMaxResults: number;
  visibleModes: DisplayMode[];
  defaultViewMode: DisplayMode;
  /** 按文章族顶层文件保存的跨模式语义阅读位置。 */
  readingLocations: Record<string, ReadingLocation>;
  articleTocMaxDepth: number;
  showArticleMiniMap: boolean;
  /** Enables Markdown-style collapse controls for article and continuous-reading headings. */
  articleSectionCollapseEnabled: boolean;
  /** Shows a bullet before unnumbered terminal article paragraphs. */
  articleLeafBulletsEnabled: boolean;
  /** Empty follows the article accent color; otherwise a hex color used by terminal bullets. */
  articleLeafBulletColor: string;
  /** Shape and fill treatment used by terminal article bullets. */
  articleLeafBulletStyle: ArticleLeafBulletStyle;
  /** Hides the configured per-map asset folder in Obsidian's File Explorer. */
  hideAssetFolderInFileExplorer: boolean;
  /** Enables custom File Explorer filters without changing vault files. */
  hideConfiguredFilesInFileExplorer: boolean;
  /** Comma or line-separated extensions hidden from the File Explorer. */
  hiddenFileExtensions: string;
  /** Comma or line-separated folder names or paths hidden from the File Explorer. */
  hiddenFileFolders: string;
  readingProgressPosition: "top" | "bottom" | "left" | "right";
  returnToTopVisibility: number;
  nodeEditorPosition: "center" | "right";
  richTextBoldShortcut: string;
  richTextItalicShortcut: string;
  richTextUnderlineShortcut: string;
  richTextColorShortcut: string;
  visibleToolbarItems: string[];
  toolbarItemOrder: string[];
  /** OpenAI 兼容 AI 接口配置。API 密钥保存在插件 data.json 中。 */
  aiProfiles: AiProfileConfig[];
  defaultAiProfileId: string;
  /** 允许发送给 AI 的 Markdown UTF-8 最大字节数。 */
  aiMaxInputBytes: number;
  aiDefaultQuestion: string;
  /** 图片识图默认使用视觉模型或本机 OCR。 */
  imageRecognitionMode: ImageRecognitionMode;
  /** AI 识图和本地 OCR 结果共用的任务说明。 */
  imageRecognitionPrompt: string;
  /** 本机 Tesseract 可执行文件路径或命令名。 */
  localOcrExecutable: string;
  /** Tesseract 语言组合，例如 chi_sim+eng。 */
  localOcrLanguage: string;
  /** 传给 Tesseract 的附加参数，不经过 shell。 */
  localOcrExtraArgs: string;
  /** 截图开始前是否最小化 Obsidian。 */
  screenshotHideObsidian: boolean;
  /** 截图插入节点后是否自动启动识图预览。 */
  screenshotAutoRecognize: boolean;
}

export const DEFAULT_SETTINGS: MindMapStudioSettings = {
  defaultFolder: "",
  filePrefix: "思维导图",
  assetFolder: "MindMap Assets",
  defaultLayout: "right",
  defaultTheme: "auto",
  defaultNodeShape: "rounded",
  nodeWidthMode: "auto",
  defaultNodeWidth: 176,
  autoNodeMaxWidth: 460,
  twoFingerGestureAction: "zoom",
  showTaskProgress: true,
  syncTitleToFilename: true,
  autoFitOnOpen: true,
  historyLimit: 120,
  embedMaxHeight: 520,
  defaultThemePreset: "classic-indigo",
  backgroundColor: "#f8fafc",
  backgroundPattern: "grid",
  backgroundPatternColor: "#94a3b8",
  fontFamily: "obsidian",
  customFont: "",
  fontSize: 14,
  edgeColor: "#6366f1",
  edgeWidth: 4.2,
  edgeStyle: "curved",
  edgeWidthMode: "tapered",
  edgeMinWidth: 1.2,
  rootColor: "#4f46e5",
  rootTextColor: "#ffffff",
  colorfulBranches: true,
  branchColors: ["#4f46e5", "#0284c7", "#0f766e", "#7c3aed", "#db2777", "#ea580c"],
  nodeBackgroundColor: "#ffffff",
  textColor: "#172033",
  nodeBorderColor: "#c7d2fe",
  nodeBorderWidth: 1,
  defaultNodeTextAlign: "center",
  defaultTextBold: false,
  defaultTextItalic: false,
  defaultTextUnderline: false,
  imageHosts: [],
  autoUploadEnabled: false,
  autoUploadDelaySeconds: 10,
  autoUploadHostIds: [],
  deleteLocalAfterUpload: true,
  imageFailoverEnabled: true,
  imageFailoverTimeoutSeconds: 8,
  imageFailoverUseLocalFallback: true,
  globalSearchMaxResults: 100,
  visibleModes: ["mindmap", "outline", "article", "reading"],
  defaultViewMode: "mindmap",
  readingLocations: {},
  articleTocMaxDepth: 3,
  showArticleMiniMap: true,
  articleSectionCollapseEnabled: false,
  articleLeafBulletsEnabled: false,
  articleLeafBulletColor: "",
  articleLeafBulletStyle: "solid",
  hideAssetFolderInFileExplorer: false,
  hideConfiguredFilesInFileExplorer: false,
  hiddenFileExtensions: "",
  hiddenFileFolders: "",
  readingProgressPosition: "top",
  returnToTopVisibility: 10,
  nodeEditorPosition: "center",
  richTextBoldShortcut: "Ctrl+B",
  richTextItalicShortcut: "Ctrl+I",
  richTextUnderlineShortcut: "Ctrl+U",
  richTextColorShortcut: "Ctrl+Shift+C",
  visibleToolbarItems: TOOLBAR_ITEMS.map(([id]) => id),
  toolbarItemOrder: TOOLBAR_ITEMS.map(([id]) => id),
  aiProfiles: DEFAULT_AI_PROFILES.map((profile) => ({ ...profile })),
  defaultAiProfileId: "ai_openai",
  aiMaxInputBytes: 256 * 1024,
  aiDefaultQuestion: "请分析这份思维导图，并回答我的问题。",
  imageRecognitionMode: "ai",
  imageRecognitionPrompt: "识别图片中的全部可见文字，并按阅读顺序转写；没有文字时简洁描述图片内容。",
  localOcrExecutable: "tesseract",
  localOcrLanguage: "chi_sim+eng",
  localOcrExtraArgs: "--psm 6",
  screenshotHideObsidian: false,
  screenshotAutoRecognize: false
};

/**
 * Normalizes the article return-to-top threshold from a number or percentage string.
 */
export function normalizeReturnToTopVisibility(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  if (typeof value !== "string") return DEFAULT_SETTINGS.returnToTopVisibility;
  const source = value.trim();
  if (!source) return DEFAULT_SETTINGS.returnToTopVisibility;
  const amount = Number(source.endsWith("%") ? source.slice(0, -1) : source);
  if (!Number.isFinite(amount)) return DEFAULT_SETTINGS.returnToTopVisibility;
  return Math.max(0, Math.min(100, amount));
}

/**
 * 更新并应用tings to appearance，并保持模型、界面和持久化状态的一致性。
 *
 * @param settings 插件当前设置对象。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function settingsToAppearance(settings: MindMapStudioSettings): MindMapAppearance {
  return {
    nodeWidthMode: settings.nodeWidthMode,
    defaultNodeWidth: settings.defaultNodeWidth,
    autoNodeMaxWidth: settings.autoNodeMaxWidth,
    themePreset: settings.defaultThemePreset,
    backgroundColor: settings.backgroundColor || undefined,
    backgroundPattern: settings.backgroundPattern,
    patternColor: settings.backgroundPatternColor || undefined,
    fontFamily: settings.fontFamily,
    customFont: settings.customFont.trim() || undefined,
    fontSize: settings.fontSize,
    edgeColor: settings.edgeColor || undefined,
    edgeWidth: settings.edgeWidth,
    edgeStyle: settings.edgeStyle,
    edgeWidthMode: settings.edgeWidthMode,
    edgeMinWidth: settings.edgeMinWidth,
    rootColor: settings.rootColor || undefined,
    rootTextColor: settings.rootTextColor || undefined,
    colorfulBranches: settings.colorfulBranches,
    branchColors: settings.branchColors.length ? [...settings.branchColors] : undefined,
    nodeColor: settings.nodeBackgroundColor || undefined,
    textColor: settings.textColor || undefined,
    nodeBorderColor: settings.nodeBorderColor || undefined,
    nodeBorderWidth: settings.nodeBorderWidth,
    nodeTextAlign: settings.defaultNodeTextAlign,
    bold: settings.defaultTextBold,
    italic: settings.defaultTextItalic,
    underline: settings.defaultTextUnderline
  };
}

/**
 * 应用theme preset to settings，并保持模型、界面和持久化状态的一致性。
 *
 * @param settings 插件当前设置对象。
 * @param presetId 内置主题预设标识。
 */
export function applyThemePresetToSettings(settings: MindMapStudioSettings, presetId: MindMapThemePresetId): void {
  const appearance = appearanceFromThemePreset(presetId);
  settings.defaultThemePreset = presetId;
  settings.backgroundColor = appearance.backgroundColor ?? "";
  settings.backgroundPattern = appearance.backgroundPattern ?? "none";
  settings.backgroundPatternColor = appearance.patternColor ?? "#94a3b8";
  settings.fontFamily = appearance.fontFamily ?? "obsidian";
  settings.customFont = appearance.customFont ?? "";
  settings.fontSize = appearance.fontSize ?? 14;
  settings.edgeColor = appearance.edgeColor ?? "";
  settings.edgeWidth = appearance.edgeWidth ?? 2.2;
  settings.edgeStyle = appearance.edgeStyle ?? "curved";
  settings.edgeWidthMode = appearance.edgeWidthMode ?? "uniform";
  settings.edgeMinWidth = appearance.edgeMinWidth ?? Math.min(1, settings.edgeWidth);
  settings.rootColor = appearance.rootColor ?? "";
  settings.rootTextColor = appearance.rootTextColor ?? "";
  settings.colorfulBranches = appearance.colorfulBranches === true;
  settings.branchColors = appearance.branchColors ? [...appearance.branchColors] : [];
  settings.nodeBackgroundColor = appearance.nodeColor ?? "";
  settings.textColor = appearance.textColor ?? "";
  settings.nodeBorderColor = appearance.nodeBorderColor ?? "";
  settings.nodeBorderWidth = appearance.nodeBorderWidth ?? 1;
  settings.defaultNodeTextAlign = appearance.nodeTextAlign ?? "center";
  settings.defaultTextBold = appearance.bold === true;
  settings.defaultTextItalic = appearance.italic === true;
  settings.defaultTextUnderline = appearance.underline === true;
}

/**
 * MindMapStudioSettingTab 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class MindMapStudioSettingTab extends PluginSettingTab {
  private readonly plugin: MindMapStudioPlugin;
  private readonly expandedImageHostIds = new Set<string>();
  private readonly expandedAiProfileIds = new Set<string>();

  /**
   * 创建 MindMapStudioSettingTab 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param plugin MindMap Studio 插件实例，用于调用跨文件服务和读取设置。
   */
  constructor(app: App, plugin: MindMapStudioPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * 构建完整插件设置页，包括主题、显示模式、节点默认值、搜索、图片、图床容灾和恢复初始设置。所有控件写入后立即保存并刷新打开视图。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "MindMap Studio" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "这里设置全局默认外观。打开脑图后，也可以点击工具栏中的调色板，为当前脑图单独保存一套样式。"
    });

    containerEl.createEl("h3", { text: "主题模板" });

    new Setting(containerEl)
      .setName("默认主题")
      .setDesc("选择后会一次应用背景、节点、分支配色、字体和连线样式；之后仍可继续修改单项设置。")
      .addDropdown((dropdown) => {
        for (const preset of MINDMAP_THEME_PRESETS) dropdown.addOption(preset.id, preset.name);
        dropdown.setValue(this.plugin.settings.defaultThemePreset);
        dropdown.onChange(async (value) => {
          applyThemePresetToSettings(this.plugin.settings, value as MindMapThemePresetId);
          await this.saveAndRefresh();
          this.display();
        });
      });

    const themePreview = containerEl.createDiv({ cls: "mms-theme-preview-row" });
    for (const preset of MINDMAP_THEME_PRESETS) {
      const card = themePreview.createEl("button", {
        cls: `mms-theme-preview-card${preset.id === this.plugin.settings.defaultThemePreset ? " is-selected" : ""}`,
        attr: { type: "button", title: preset.description }
      });
      const swatches = card.createDiv({ cls: "mms-theme-preview-swatches" });
      const colors = [preset.appearance.rootColor, ...(preset.appearance.branchColors ?? []).slice(0, 4)].filter((color): color is string => Boolean(color));
      colors.forEach((color) => { const dot = swatches.createSpan(); dot.style.backgroundColor = color; });
      card.createDiv({ cls: "mms-theme-preview-name", text: preset.name });
      card.addEventListener("click", () => {
        applyThemePresetToSettings(this.plugin.settings, preset.id);
        void this.saveAndRefresh().then(() => this.display());
      });
    }

    containerEl.createEl("h3", { text: "显示模式" });

    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "导图、大纲、文章和通读模式共享同一份节点数据；可编辑模式中的修改会同步到其他模式。"
    });

    const modeGrid = containerEl.createDiv({ cls: "mms-mode-settings-grid" });
    const modeOptions: Array<{ id: DisplayMode; name: string; description: string }> = [
      { id: "mindmap", name: "导图模式", description: "默认的可视化思维导图画布。" },
      { id: "outline", name: "大纲模式", description: "按照节点层级显示可编辑大纲。" },
      { id: "article", name: "文章模式", description: "生成目录和章节编号的文章视图。" },
      { id: "reading", name: "通读模式", description: "合并父导图、子导图和孙导图，像一本书一样连续阅读。" }
    ];
    for (const mode of modeOptions) {
      const label = modeGrid.createEl("label", { cls: "mms-mode-setting-card" });
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.checked = this.plugin.settings.visibleModes.includes(mode.id);
      const copy = label.createDiv({ cls: "mms-mode-setting-copy" });
      copy.createEl("strong", { text: mode.name });
      copy.createEl("span", { text: mode.description });
      checkbox.addEventListener("change", async () => {
        const next = new Set(this.plugin.settings.visibleModes);
        if (checkbox.checked) next.add(mode.id);
        else next.delete(mode.id);
        if (!next.size) {
          checkbox.checked = true;
          new Notice("至少需要保留一种显示模式");
          return;
        }
        this.plugin.settings.visibleModes = modeOptions.map((item) => item.id).filter((id) => next.has(id));
        if (!this.plugin.settings.visibleModes.includes(this.plugin.settings.defaultViewMode)) {
          this.plugin.settings.defaultViewMode = this.plugin.settings.visibleModes[0] ?? "mindmap";
        }
        await this.saveAndRefresh();
        this.display();
      });
    }

    new Setting(containerEl)
      .setName("当前全局显示模式")
      .setDesc("这里与工具栏模式按钮同步。导图、文章和通读会作为下次启动模式；大纲仅在当前会话生效，重新打开时回到上一次可持久化模式。")
      .addDropdown((dropdown) => {
        const labels: Record<DisplayMode, string> = { mindmap: "导图模式", outline: "大纲模式", article: "文章模式", reading: "通读模式" };
        for (const mode of this.plugin.settings.visibleModes) dropdown.addOption(mode, labels[mode]);
        const activeMode = this.plugin.getActiveDisplayMode();
        dropdown.setValue(this.plugin.settings.visibleModes.includes(activeMode)
          ? activeMode
          : this.plugin.settings.visibleModes[0] ?? "mindmap");
        dropdown.onChange(async (value) => {
          await this.plugin.setGlobalDisplayMode(value as DisplayMode);
        });
      });

    new Setting(containerEl)
      .setName("双指手势")
      .setDesc("在导图画布上使用两根手指时，可选择以指间距离缩放，或以双指中心点移动画布。")
      .addDropdown((dropdown) => dropdown
        .addOption("zoom", "放大缩小")
        .addOption("pan", "移动画布")
        .setValue(this.plugin.settings.twoFingerGestureAction)
        .onChange(async (value) => {
          this.plugin.settings.twoFingerGestureAction = value === "pan" ? "pan" : "zoom";
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("文章目录最大层级")
      .setDesc("限制目录页显示的相对结构层级，不受“第一章、1.、（1）”等编号起始层级影响，也不影响文章内容及上一篇/下一篇导航。")
      .addDropdown((dropdown) => {
        for (let depth = 1; depth <= 8; depth += 1) dropdown.addOption(String(depth), `${depth} 层`);
        dropdown
          .setValue(String(this.plugin.settings.articleTocMaxDepth))
          .onChange(async (value) => {
            this.plugin.settings.articleTocMaxDepth = Math.max(1, Math.min(8, Number(value) || 3));
            await this.saveAndRefresh();
          });
      });

    new Setting(containerEl)
      .setName("文章/通读缩略导航图")
      .setDesc("在文章和通读模式右上角显示结构缩略图；点击可快速跳转，当前章节会高亮。导航图沿用文章目录层级，并会在空闲 10 秒后自动隐藏。当前脑图可在“主题与外观”中单独覆盖。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showArticleMiniMap)
        .onChange(async (value) => {
          this.plugin.settings.showArticleMiniMap = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("文章标题可折叠")
      .setDesc("在文章和通读模式的章节标题前显示折叠按钮；折叠后隐藏该标题下的子标题和正文，行为类似 Markdown 标题折叠。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.articleSectionCollapseEnabled)
        .onChange(async (value) => {
          this.plugin.settings.articleSectionCollapseEnabled = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("末端正文圆点")
      .setDesc("为没有文章编号的末端节点正文添加项目符号，便于快速区分要点。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.articleLeafBulletsEnabled)
        .onChange(async (value) => {
          this.plugin.settings.articleLeafBulletsEnabled = value;
          await this.saveAndRefresh();
          this.display();
        }));

    if (this.plugin.settings.articleLeafBulletsEnabled) {
      new Setting(containerEl)
        .setName("末端正文项目符号样式")
        .setDesc("可选择实心圆、空心圆、实心方块或短横线。")
        .addDropdown((dropdown) => dropdown
          .addOption("solid", "实心圆")
          .addOption("hollow", "空心圆")
          .addOption("square", "实心方块")
          .addOption("dash", "短横线")
          .setValue(this.plugin.settings.articleLeafBulletStyle)
          .onChange(async (value) => {
            this.plugin.settings.articleLeafBulletStyle = value === "hollow" || value === "square" || value === "dash" ? value : "solid";
            await this.saveAndRefresh();
          }));
      new Setting(containerEl)
        .setName("末端正文项目符号颜色")
        .setDesc("留空时跟随当前文章主题强调色；可指定任意颜色。")
        .addColorPicker((picker) => picker
          .setValue(this.plugin.settings.articleLeafBulletColor || "#ef4444")
          .onChange(async (value) => {
            this.plugin.settings.articleLeafBulletColor = value;
            await this.saveAndRefresh();
          }))
        .addButton((button) => button
          .setButtonText("跟随主题")
          .onClick(async () => {
            this.plugin.settings.articleLeafBulletColor = "";
            await this.saveAndRefresh();
            this.display();
          }));
    }

    new Setting(containerEl)
      .setName("通读进度条位置")
      .setDesc("控制阅读进度显示在页面上方、下方、左侧或右侧。")
      .addDropdown((dropdown) => dropdown
        .addOption("top", "上方")
        .addOption("bottom", "下方")
        .addOption("left", "左侧")
        .addOption("right", "右侧")
        .setValue(this.plugin.settings.readingProgressPosition)
        .onChange(async (value) => {
          this.plugin.settings.readingProgressPosition = value === "bottom" || value === "left" || value === "right" ? value : "top";
          await this.saveAndRefresh();
        }));

    let returnToTopSlider: SliderComponent | null = null;
    let returnToTopInput: TextComponent | null = null;
    const saveReturnToTopVisibility = async (value: unknown): Promise<void> => {
      const normalized = normalizeReturnToTopVisibility(value);
      this.plugin.settings.returnToTopVisibility = normalized;
      returnToTopSlider?.setValue(normalized);
      returnToTopInput?.setValue(String(normalized));
      await this.saveAndRefresh();
    };
    new Setting(containerEl)
      .setName("回到顶部按钮显示时机")
      .setDesc("文章和通读模式中，按钮默认隐藏；阅读进度达到设定百分比后显示。可拖动或直接输入 0–100。")
      .addSlider((slider) => {
        returnToTopSlider = slider;
        return slider
          .setLimits(0, 100, 1)
          .setValue(this.plugin.settings.returnToTopVisibility)
          .onChange(saveReturnToTopVisibility);
      })
      .addText((text) => {
        returnToTopInput = text;
        return text
          .setPlaceholder("0–100")
          .setValue(String(this.plugin.settings.returnToTopVisibility))
          .onChange(saveReturnToTopVisibility);
      });

    containerEl.createEl("h3", { text: "工具栏内容" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "选择需要显示在脑图顶部工具栏中的操作。显示模式切换、缩放比例和保存状态始终保留。"
    });
    const defaultToolbarOrder: string[] = TOOLBAR_ITEMS.map(([id]) => id);
    const knownToolbarItems = new Map<string, string>(TOOLBAR_ITEMS);
    const toolbarOrder = [
      ...this.plugin.settings.toolbarItemOrder.filter((id) => knownToolbarItems.has(id)),
      ...defaultToolbarOrder.filter((id) => !this.plugin.settings.toolbarItemOrder.includes(id))
    ];
    this.plugin.settings.toolbarItemOrder = toolbarOrder;
    new Setting(containerEl)
      .setName("工具栏顺序")
      .setDesc("使用上下按钮调整顺序；隐藏的项目也会保留当前位置。")
      .addButton((button) => button
        .setButtonText("恢复默认顺序")
        .onClick(async () => {
          this.plugin.settings.toolbarItemOrder = [...defaultToolbarOrder];
          await this.saveAndRefresh();
          this.display();
        }));
    const toolbarGrid = containerEl.createDiv({ cls: "mms-toolbar-settings-grid" });
    for (const [index, id] of toolbarOrder.entries()) {
      const row = toolbarGrid.createDiv({ cls: "mms-toolbar-setting-item" });
      const label = row.createEl("label", { cls: "mms-toolbar-setting-label" });
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.checked = this.plugin.settings.visibleToolbarItems.includes(id);
      label.createSpan({ text: knownToolbarItems.get(id) ?? id });
      const controls = row.createDiv({ cls: "mms-toolbar-order-controls" });
      const upButton = controls.createEl("button", { text: "↑", attr: { type: "button", "aria-label": "上移" } });
      const downButton = controls.createEl("button", { text: "↓", attr: { type: "button", "aria-label": "下移" } });
      upButton.disabled = index === 0;
      downButton.disabled = index === toolbarOrder.length - 1;
      const move = async (offset: number): Promise<void> => {
        const target = index + offset;
        if (target < 0 || target >= toolbarOrder.length) return;
        [toolbarOrder[index], toolbarOrder[target]] = [toolbarOrder[target], toolbarOrder[index]];
        this.plugin.settings.toolbarItemOrder = [...toolbarOrder];
        await this.saveAndRefresh();
        this.display();
      };
      upButton.addEventListener("click", () => void move(-1));
      downButton.addEventListener("click", () => void move(1));
      checkbox.addEventListener("change", async () => {
        const selected = new Set(this.plugin.settings.visibleToolbarItems);
        if (checkbox.checked) selected.add(id); else selected.delete(id);
        this.plugin.settings.visibleToolbarItems = toolbarOrder.filter((itemId) => selected.has(itemId));
        await this.saveAndRefresh();
      });
    }


    containerEl.createEl("h3", { text: "AI 助手" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "AI 请求会先把当前页面或右键节点分支转换为 Markdown，再发送到所选 OpenAI 兼容接口。API 密钥保存在插件 data.json 中，请勿共享该文件。"
    });

    new Setting(containerEl)
      .setName("Markdown 上传大小上限")
      .setDesc("发送前会显示 UTF-8 文件大小；超过上限时禁止请求。范围 32–2048 KB。")
      .addSlider((slider) => slider
        .setLimits(32, 2048, 32)
        .setDynamicTooltip()
        .setValue(Math.round(this.plugin.settings.aiMaxInputBytes / 1024))
        .onChange(async (value) => {
          this.plugin.settings.aiMaxInputBytes = Math.round(value) * 1024;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("默认问题")
      .setDesc("打开 AI 窗口时预填，可在发送前修改。")
      .addTextArea((text) => text
        .setPlaceholder("请分析这份思维导图，并回答我的问题。")
        .setValue(this.plugin.settings.aiDefaultQuestion)
        .onChange(async (value) => {
          this.plugin.settings.aiDefaultQuestion = value.slice(0, 4000);
          await this.plugin.saveSettings();
        }));

    const enabledProfiles = this.plugin.settings.aiProfiles.filter((profile) => profile.enabled && profile.endpoint && profile.model);
    new Setting(containerEl)
      .setName("默认 AI 接口")
      .setDesc("工具栏和快捷键优先使用该接口。")
      .addDropdown((dropdown) => {
        if (!enabledProfiles.length) dropdown.addOption("", "尚无可用接口");
        enabledProfiles.forEach((profile) => dropdown.addOption(profile.id, `${profile.name} · ${profile.model}`));
        dropdown.setValue(enabledProfiles.some((profile) => profile.id === this.plugin.settings.defaultAiProfileId)
          ? this.plugin.settings.defaultAiProfileId
          : enabledProfiles[0]?.id ?? "");
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultAiProfileId = value;
          await this.plugin.saveSettings();
        });
      });

    containerEl.createEl("h4", { text: "图片识图与本地 OCR" });
    new Setting(containerEl)
      .setName("默认识图方式")
      .setDesc("AI 模式使用默认 AI 接口中的视觉模型；本地 OCR 模式调用本机 Tesseract，不上传图片。")
      .addDropdown((dropdown) => dropdown
        .addOption("ai", "AI 视觉识图")
        .addOption("local-ocr", "本地 Tesseract OCR")
        .setValue(this.plugin.settings.imageRecognitionMode)
        .onChange(async (value) => {
          this.plugin.settings.imageRecognitionMode = value === "local-ocr" ? "local-ocr" : "ai";
          await this.plugin.saveSettings();
          this.display();
        }));
    new Setting(containerEl)
      .setName("识图任务说明")
      .setDesc("AI 助手批量识图、图片右键识图和截图自动识图共用。")
      .addTextArea((text) => text
        .setValue(this.plugin.settings.imageRecognitionPrompt)
        .setPlaceholder("识别图片中的全部文字并按阅读顺序转写。")
        .onChange(async (value) => {
          this.plugin.settings.imageRecognitionPrompt = value.slice(0, 4000);
          await this.plugin.saveSettings();
        }));
    if (this.plugin.settings.imageRecognitionMode === "local-ocr") {
      new Setting(containerEl)
        .setName("Tesseract 可执行文件")
        .setDesc("可填写命令名 tesseract，或本机完整路径。")
        .addText((text) => text
          .setValue(this.plugin.settings.localOcrExecutable)
          .setPlaceholder("tesseract")
          .onChange(async (value) => {
            this.plugin.settings.localOcrExecutable = value.trim().slice(0, 2000) || "tesseract";
            await this.plugin.saveSettings();
          }));
      new Setting(containerEl)
        .setName("OCR 语言")
        .setDesc("需要本机已安装相应语言包，例如 chi_sim+eng。")
        .addText((text) => text
          .setValue(this.plugin.settings.localOcrLanguage)
          .setPlaceholder("chi_sim+eng")
          .onChange(async (value) => {
            this.plugin.settings.localOcrLanguage = value.trim().slice(0, 240) || "chi_sim+eng";
            await this.plugin.saveSettings();
          }));
      new Setting(containerEl)
        .setName("OCR 附加参数")
        .setDesc("参数通过 execFile 传递，不使用 shell；默认 --psm 6。")
        .addText((text) => text
          .setValue(this.plugin.settings.localOcrExtraArgs)
          .setPlaceholder("--psm 6")
          .onChange(async (value) => {
            this.plugin.settings.localOcrExtraArgs = value.slice(0, 1000);
            await this.plugin.saveSettings();
          }));
    }
    new Setting(containerEl)
      .setName("截图时隐藏 Obsidian")
      .setDesc("启动系统区域截图前自动最小化，截图完成后恢复窗口。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.screenshotHideObsidian)
        .onChange(async (value) => {
          this.plugin.settings.screenshotHideObsidian = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName("截图后自动识图")
      .setDesc("截图插入节点后自动运行当前识图方式并打开图片与文字对比预览；仍需确认后才替换。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.screenshotAutoRecognize)
        .onChange(async (value) => {
          this.plugin.settings.screenshotAutoRecognize = value;
          await this.plugin.saveSettings();
        }));

    const aiHeader = containerEl.createDiv({ cls: "mms-ai-profiles-header" });
    aiHeader.createEl("h4", { text: "接口预设与自定义" });
    const addAiProfile = (provider: AiProviderKind): void => {
      const profile = createAiProfileConfig(provider, this.plugin.settings.aiProfiles.length + 1);
      this.plugin.settings.aiProfiles.push(profile);
      this.expandedAiProfileIds.add(profile.id);
      if (!this.plugin.settings.defaultAiProfileId) this.plugin.settings.defaultAiProfileId = profile.id;
      void this.plugin.saveSettings().then(() => this.display());
    };
    for (const [provider, label] of [
      ["openai", "新增 OpenAI"],
      ["deepseek", "新增 DeepSeek"],
      ["siliconflow", "新增硅基流动"],
      ["freellmapi", "新增 FreeLLMAPI"],
      ["custom", "新增自定义"]
    ] as Array<[AiProviderKind, string]>) {
      const button = aiHeader.createEl("button", { text: label, attr: { type: "button" } });
      button.addEventListener("click", () => addAiProfile(provider));
    }

    if (!this.plugin.settings.aiProfiles.length) {
      containerEl.createDiv({
        cls: "setting-item-description",
        text: "尚未配置 AI 接口。可使用 OpenAI、DeepSeek、硅基流动、FreeLLMAPI 预设，或添加兼容 Chat Completions 的自定义地址。"
      });
    }

    this.plugin.settings.aiProfiles.forEach((profile, index) => {
      const card = containerEl.createEl("details", { cls: "mms-ai-profile-card" });
      card.open = this.expandedAiProfileIds.has(profile.id);
      card.addEventListener("toggle", () => {
        if (card.open) this.expandedAiProfileIds.add(profile.id); else this.expandedAiProfileIds.delete(profile.id);
      });
      const summary = card.createEl("summary", { cls: "mms-ai-profile-title" });
      summary.createEl("strong", { text: profile.name || `AI 接口 ${index + 1}` });
      summary.createSpan({ text: profile.enabled ? "已启用" : "已停用", cls: `mms-ai-profile-status${profile.enabled ? " is-enabled" : ""}` });
      const body = card.createDiv({ cls: "mms-ai-profile-body" });

      new Setting(body)
        .setName("名称与启用")
        .addText((text) => text.setValue(profile.name).onChange(async (value) => {
          profile.name = value.trim().slice(0, 120) || `AI 接口 ${index + 1}`;
          await this.plugin.saveSettings();
        }))
        .addToggle((toggle) => toggle.setValue(profile.enabled).onChange(async (value) => {
          profile.enabled = value;
          if (value && !this.plugin.settings.defaultAiProfileId) this.plugin.settings.defaultAiProfileId = profile.id;
          await this.plugin.saveSettings();
          this.display();
        }));

      new Setting(body)
        .setName("预设类型")
        .setDesc("切换预设会更新默认接口地址和模型名称，不会覆盖 API 密钥。")
        .addDropdown((dropdown) => dropdown
          .addOption("openai", "OpenAI")
          .addOption("deepseek", "DeepSeek")
          .addOption("siliconflow", "硅基流动")
          .addOption("freellmapi", "FreeLLMAPI")
          .addOption("custom", "自定义 OpenAI 兼容接口")
          .setValue(profile.provider)
          .onChange(async (value) => {
            const provider = value as AiProviderKind;
            const preset = AI_PROFILE_PRESETS[provider];
            profile.provider = provider;
            profile.endpoint = preset.endpoint;
            profile.model = preset.model;
            if (!profile.systemPrompt.trim()) profile.systemPrompt = preset.systemPrompt;
            await this.plugin.saveSettings();
            this.display();
          }));

      const endpointPlaceholder = profile.provider === "siliconflow"
        ? "https://api.siliconflow.cn/v1"
        : profile.provider === "freellmapi"
          ? "http://localhost:3001/v1"
          : "https://example.com/v1/chat/completions";
      new Setting(body).setName("接口地址").setDesc("可填写 /v1 基础地址或完整 /chat/completions 地址。")
        .addText((text) => text
        .setPlaceholder(endpointPlaceholder)
        .setValue(profile.endpoint)
        .onChange(async (value) => { profile.endpoint = value.trim(); await this.plugin.saveSettings(); }));
      new Setting(body).setName("API 密钥").setDesc("留空仅适用于不需要鉴权的本地或代理接口。")
        .addText((text) => {
          text.inputEl.type = "password";
          return text.setPlaceholder("sk-…").setValue(profile.apiKey).onChange(async (value) => {
            profile.apiKey = value.trim();
            await this.plugin.saveSettings();
          });
        });
      const modelPresets = AI_PROVIDER_MODEL_PRESETS[profile.provider];
      const modelListId = `mms-ai-models-${profile.id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
      const modelSetting = new Setting(body)
        .setName("模型名称")
        .setDesc(modelPresets.length > 1 ? "可从预设模型中选择，也可直接输入其他兼容模型 ID。" : "填写服务端支持的模型 ID。");
      modelSetting.addText((text) => {
        text.setValue(profile.model)
          .setPlaceholder(profile.provider === "freellmapi" ? "auto" : "模型 ID")
          .onChange(async (value) => { profile.model = value.trim(); await this.plugin.saveSettings(); });
        if (modelPresets.length) text.inputEl.setAttr("list", modelListId);
        return text;
      });
      if (modelPresets.length) {
        const dataList = body.createEl("datalist", { attr: { id: modelListId } });
        modelPresets.forEach((model) => dataList.createEl("option", { attr: { value: model } }));
      }
      new Setting(body).setName("温度").addSlider((slider) => slider
        .setLimits(0, 2, 0.1).setDynamicTooltip().setValue(profile.temperature)
        .onChange(async (value) => { profile.temperature = value; await this.plugin.saveSettings(); }));
      new Setting(body).setName("最大输出 tokens").addText((text) => text
        .setValue(String(profile.maxOutputTokens))
        .onChange(async (value) => {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) profile.maxOutputTokens = Math.max(64, Math.min(65536, Math.round(parsed)));
          await this.plugin.saveSettings();
        }));
      new Setting(body).setName("系统提示词").addTextArea((text) => text
        .setValue(profile.systemPrompt)
        .onChange(async (value) => { profile.systemPrompt = value.slice(0, 16000); await this.plugin.saveSettings(); }));
      new Setting(body).setName("附加请求头 JSON").setDesc("可用于代理服务，例如 {\"X-API-Key\":\"…\"}。Authorization 会在填写 API 密钥后自动添加。")
        .addTextArea((text) => text.setPlaceholder("{}")
          .setValue(profile.headers)
          .onChange(async (value) => { profile.headers = value.slice(0, 16000); await this.plugin.saveSettings(); }));

      const actions = body.createDiv({ cls: "mms-ai-profile-actions" });
      const testButton = actions.createEl("button", { text: "检测接口", attr: { type: "button" } });
      testButton.addEventListener("click", () => {
        testButton.disabled = true;
        testButton.setText("检测中…");
        void this.plugin.saveSettings()
          .then(() => this.plugin.testAiProfile(profile.id))
          .finally(() => {
            testButton.disabled = false;
            testButton.setText("检测接口");
          });
      });
      const remove = actions.createEl("button", { text: "删除接口", cls: "mod-warning", attr: { type: "button" } });
      remove.addEventListener("click", () => {
        this.plugin.settings.aiProfiles = this.plugin.settings.aiProfiles.filter((item) => item.id !== profile.id);
        if (this.plugin.settings.defaultAiProfileId === profile.id) {
          this.plugin.settings.defaultAiProfileId = this.plugin.settings.aiProfiles.find((item) => item.enabled)?.id ?? "";
        }
        void this.plugin.saveSettings().then(() => this.display());
      });
    });

    containerEl.createEl("h3", { text: "文件与布局" });

    new Setting(containerEl)
      .setName("节点编辑器显示位置")
      .setDesc("居中时使用弹窗；靠右时作为右侧编辑面板显示，保存或点击面板外会自动收起。")
      .addDropdown((dropdown) => dropdown
        .addOption("center", "居中弹窗")
        .addOption("right", "右侧面板")
        .setValue(this.plugin.settings.nodeEditorPosition)
        .onChange(async (value) => {
          this.plugin.settings.nodeEditorPosition = value === "right" ? "right" : "center";
          await this.saveAndRefresh();
        }));

    containerEl.createEl("h3", { text: "节点快速输入快捷键" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Tab/Enter 创建节点后可直接输入。以下快捷键作用于节点内已选择的文字；格式示例：Ctrl+B、Ctrl+Shift+C、Alt+U。"
    });
    const shortcutSetting = (name: string, key: keyof Pick<MindMapStudioSettings,
      "richTextBoldShortcut" | "richTextItalicShortcut" | "richTextUnderlineShortcut" | "richTextColorShortcut">): void => {
      new Setting(containerEl)
        .setName(name)
        .addText((text) => text
          .setValue(this.plugin.settings[key])
          .onChange(async (value) => {
            this.plugin.settings[key] = value.trim();
            await this.plugin.saveSettings();
          }));
    };
    shortcutSetting("加粗", "richTextBoldShortcut");
    shortcutSetting("斜体", "richTextItalicShortcut");
    shortcutSetting("下划线", "richTextUnderlineShortcut");
    shortcutSetting("字体颜色", "richTextColorShortcut");

    new Setting(containerEl)
      .setName("默认保存文件夹")
      .setDesc("留空时保存在当前笔记所在文件夹；也可填写例如 Mind Maps。")
      .addText((text) => text
        .setPlaceholder("Mind Maps")
        .setValue(this.plugin.settings.defaultFolder)
        .onChange(async (value) => {
          this.plugin.settings.defaultFolder = value.trim().replace(/^\/+|\/+$/g, "");
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("资源文件夹")
      .setDesc("该路径相对于当前脑图所在目录。粘贴图片会保存到“当前脑图目录/该资源文件夹/”；子导图会保存在“当前脑图目录/该资源文件夹/父导图名称/”中。默认使用 MindMap Assets。")
      .addText((text) => text
        .setPlaceholder("MindMap Assets")
        .setValue(this.plugin.settings.assetFolder)
        .onChange(async (value) => {
          this.plugin.settings.assetFolder = value.trim().replace(/^\/+|\/+$/g, "") || "MindMap Assets";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("在文件浏览器隐藏资源文件夹")
      .setDesc("仅隐藏由上方“资源文件夹”设置生成的目录及其内容，不删除或移动任何文件。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.hideAssetFolderInFileExplorer)
        .onChange(async (value) => {
          this.plugin.settings.hideAssetFolderInFileExplorer = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("文件浏览器自定义筛选")
      .setDesc("启用后，可按后缀或文件夹名称隐藏左侧文件浏览器项目；仅影响显示，不影响搜索、链接和文件本身。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.hideConfiguredFilesInFileExplorer)
        .onChange(async (value) => {
          this.plugin.settings.hideConfiguredFilesInFileExplorer = value;
          await this.saveAndRefresh();
          this.display();
        }));

    if (this.plugin.settings.hideConfiguredFilesInFileExplorer) {
      new Setting(containerEl)
        .setName("隐藏指定后缀")
        .setDesc("使用逗号、分号或换行分隔，例如：png, jpg, pdf。无需填写点号。")
        .addTextArea((text) => text
          .setPlaceholder("png, jpg, pdf")
          .setValue(this.plugin.settings.hiddenFileExtensions)
          .onChange(async (value) => {
            this.plugin.settings.hiddenFileExtensions = value.trim();
            await this.saveAndRefresh();
          }));
      new Setting(containerEl)
        .setName("隐藏指定文件夹")
        .setDesc("使用逗号、分号或换行分隔，可填写文件夹名称或仓库相对路径，例如：附件 或 项目/缓存。")
        .addTextArea((text) => text
          .setPlaceholder("附件\n项目/缓存")
          .setValue(this.plugin.settings.hiddenFileFolders)
          .onChange(async (value) => {
            this.plugin.settings.hiddenFileFolders = value.trim();
            await this.saveAndRefresh();
          }));
    }

    containerEl.createEl("h3", { text: "图片与图床" });

    new Setting(containerEl)
      .setName("远程图片自动故障转移")
      .setDesc("当前图床地址加载失败或超时后，按镜像顺序尝试下一地址；成功后自动将可用地址保存为新的主地址。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.imageFailoverEnabled)
        .onChange(async (value) => {
          this.plugin.settings.imageFailoverEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.imageFailoverEnabled) {
      new Setting(containerEl)
        .setName("单个镜像等待时间")
        .setDesc("图片在该时间内未成功加载，就尝试下一个镜像。范围 2–30 秒。")
        .addSlider((slider) => slider
          .setLimits(2, 30, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.imageFailoverTimeoutSeconds)
          .onChange(async (value) => {
            this.plugin.settings.imageFailoverTimeoutSeconds = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName("本地副本作为最后回退")
        .setDesc("远程镜像全部失效时，如果本地图片仍存在，则最后尝试本地副本。")
        .addToggle((toggle) => toggle
          .setValue(this.plugin.settings.imageFailoverUseLocalFallback)
          .onChange(async (value) => {
            this.plugin.settings.imageFailoverUseLocalFallback = value;
            await this.plugin.saveSettings();
          }));
    }

    new Setting(containerEl)
      .setName("粘贴图片后自动上传")
      .setDesc("图片会先保存到当前脑图的本地资源文件夹，再按设定延迟上传。只有全部目标图床成功后，才会切换为远程网址。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoUploadEnabled)
        .onChange(async (value) => {
          this.plugin.settings.autoUploadEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.autoUploadEnabled) {
      new Setting(containerEl)
        .setName("自动上传延迟")
        .setDesc("粘贴后等待 0–300 秒再上传，便于撤销或继续编辑。")
        .addSlider((slider) => slider
          .setLimits(0, 300, 1)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.autoUploadDelaySeconds)
          .onChange(async (value) => {
            this.plugin.settings.autoUploadDelaySeconds = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName("全部成功后删除本地图片")
        .setDesc("插件会先写入远程网址并保存脑图，再检查图片是否被其他脑图引用；确认安全后才删除本地文件。任一图床失败时会保留本地图片。")
        .addToggle((toggle) => toggle
          .setValue(this.plugin.settings.deleteLocalAfterUpload)
          .onChange(async (value) => {
            this.plugin.settings.deleteLocalAfterUpload = value;
            await this.plugin.saveSettings();
          }));
    }

    const hosts = this.plugin.settings.imageHosts;
    const hostsHeader = containerEl.createDiv({ cls: "mms-image-hosts-header" });
    hostsHeader.createEl("h4", { text: "图床配置" });
    const addHost = hostsHeader.createEl("button", { text: "新增图床", attr: { type: "button" } });
    addHost.addEventListener("click", () => {
      const host = createImageHostConfig(hosts.length + 1);
      this.plugin.settings.imageHosts.push(host);
      void this.plugin.saveSettings().then(() => this.display());
    });

    if (!hosts.length) {
      containerEl.createDiv({ cls: "setting-item-description mms-image-host-empty", text: "尚未配置图床。新增后可以测试上传接口，并选择一个或多个自动上传目标。" });
    }

    hosts.forEach((host, index) => {
      const card = containerEl.createEl("details", { cls: "mms-image-host-card" });
      card.open = this.expandedImageHostIds.has(host.id);
      card.addEventListener("toggle", () => {
        if (card.open) this.expandedImageHostIds.add(host.id);
        else this.expandedImageHostIds.delete(host.id);
      });
      const title = card.createEl("summary", { cls: "mms-image-host-card-title" });
      title.createEl("strong", { text: host.name || `图床 ${index + 1}` });
      const status = title.createSpan({ cls: "mms-image-host-status", text: host.enabled ? "已启用" : "已停用" });
      status.toggleClass("is-enabled", host.enabled);
      const body = card.createDiv({ cls: "mms-image-host-card-body" });

      new Setting(body)
        .setName("名称")
        .addText((text) => text
          .setValue(host.name)
          .setPlaceholder(`图床 ${index + 1}`)
          .onChange(async (value) => {
            host.name = value.trim() || `图床 ${index + 1}`;
            await this.plugin.saveSettings();
          }))
        .addToggle((toggle) => toggle
          .setTooltip("启用该图床")
          .setValue(host.enabled)
          .onChange(async (value) => {
            host.enabled = value;
            if (!value) this.plugin.settings.autoUploadHostIds = this.plugin.settings.autoUploadHostIds.filter((id) => id !== host.id);
            await this.plugin.saveSettings();
            this.display();
          }));

      new Setting(body)
        .setName("上传 API")
        .addText((text) => text
          .setPlaceholder("https://example.com/api/upload")
          .setValue(host.endpoint)
          .onChange(async (value) => { host.endpoint = value.trim(); await this.plugin.saveSettings(); }));

      new Setting(body)
        .setName("请求方法与格式")
        .addDropdown((dropdown) => dropdown
          .addOption("POST", "POST")
          .addOption("PUT", "PUT")
          .setValue(host.method)
          .onChange(async (value) => { host.method = value as ImageHostMethod; await this.plugin.saveSettings(); }))
        .addDropdown((dropdown) => dropdown
          .addOption("multipart", "multipart/form-data")
          .addOption("raw", "原始二进制")
          .setValue(host.bodyMode)
          .onChange(async (value) => { host.bodyMode = value as ImageHostBodyMode; await this.plugin.saveSettings(); }));

      new Setting(body)
        .setName("文件字段名")
        .setDesc("multipart 模式常见值：file、image、source。")
        .addText((text) => text
          .setValue(host.fieldName)
          .setPlaceholder("file")
          .onChange(async (value) => { host.fieldName = value.trim() || "file"; await this.plugin.saveSettings(); }));

      new Setting(body)
        .setName("请求头 JSON")
        .setDesc("例如 Authorization、X-API-Key。密钥保存在插件 data.json。")
        .addTextArea((text) => text
          .setValue(host.headers)
          .setPlaceholder('{"Authorization":"Bearer ..."}')
          .onChange(async (value) => { host.headers = value.trim(); await this.plugin.saveSettings(); }));

      new Setting(body)
        .setName("返回网址字段")
        .setDesc("例如 data.url；留空会尝试常见字段。")
        .addText((text) => text
          .setValue(host.responsePath)
          .setPlaceholder("data.url")
          .onChange(async (value) => { host.responsePath = value.trim(); await this.plugin.saveSettings(); }));

      const isAutoTarget = this.plugin.settings.autoUploadHostIds.includes(host.id);
      new Setting(body)
        .setName("自动上传目标")
        .setDesc("自动上传可以同时选择多个图床；手动上传时仍可临时选择其他组合。")
        .addToggle((toggle) => toggle
          .setValue(isAutoTarget)
          .setDisabled(!host.enabled)
          .onChange(async (value) => {
            const selected = new Set(this.plugin.settings.autoUploadHostIds);
            if (value) selected.add(host.id); else selected.delete(host.id);
            this.plugin.settings.autoUploadHostIds = Array.from(selected);
            await this.plugin.saveSettings();
          }));

      const actions = body.createDiv({ cls: "mms-image-host-actions" });
      const test = actions.createEl("button", { text: "检测 API 连通性", attr: { type: "button" } });
      test.addEventListener("click", () => {
        test.disabled = true;
        test.setText("检测中…");
        void this.plugin.testImageHost(host.id).finally(() => {
          test.disabled = false;
          test.setText("检测 API 连通性");
        });
      });
      const remove = actions.createEl("button", { text: "删除图床", cls: "mod-warning", attr: { type: "button" } });
      remove.addEventListener("click", () => {
        this.expandedImageHostIds.delete(host.id);
        this.plugin.settings.imageHosts = this.plugin.settings.imageHosts.filter((item) => item.id !== host.id);
        this.plugin.settings.autoUploadHostIds = this.plugin.settings.autoUploadHostIds.filter((id) => id !== host.id);
        void this.plugin.saveSettings().then(() => {
          new Notice(`已删除图床：${host.name}`);
          this.display();
        });
      });
    });

    new Setting(containerEl)
      .setName("新文件名前缀")
      .setDesc("新建脑图时使用：前缀 + 日期时间。文件后缀固定为 .mindmap。")
      .addText((text) => text
        .setPlaceholder("思维导图")
        .setValue(this.plugin.settings.filePrefix)
        .onChange(async (value) => {
          this.plugin.settings.filePrefix = value.trim() || "思维导图";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("中心节点标题同步文件名")
      .setDesc("保存导图时，将 .mindmap 文件名同步为中心节点标题；同名文件会自动追加序号。子导图会同时更新父导图入口和子导图导航。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.syncTitleToFilename)
        .onChange(async (value) => {
          this.plugin.settings.syncTitleToFilename = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("默认布局")
      .setDesc("单侧适合流程拆解，双侧适合头脑风暴。")
      .addDropdown((dropdown) => dropdown
        .addOption("right", "向右展开")
        .addOption("balanced", "左右平衡")
        .setValue(this.plugin.settings.defaultLayout)
        .onChange(async (value) => {
          this.plugin.settings.defaultLayout = value as LayoutMode;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("默认明暗模式")
      .addDropdown((dropdown) => dropdown
        .addOption("auto", "跟随 Obsidian")
        .addOption("light", "浅色")
        .addOption("dark", "深色")
        .setValue(this.plugin.settings.defaultTheme)
        .onChange(async (value) => {
          this.plugin.settings.defaultTheme = value as ThemeMode;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl("h3", { text: "画布背景" });

    this.addOptionalColorSetting(
      containerEl,
      "背景颜色",
      "留空时跟随 Obsidian 当前主题。",
      () => this.plugin.settings.backgroundColor,
      async (value) => { this.plugin.settings.backgroundColor = value; },
      "#f8fafc"
    );

    new Setting(containerEl)
      .setName("背景图案")
      .setDesc("可选择网格、点阵或纯色背景。")
      .addDropdown((dropdown) => dropdown
        .addOption("none", "无")
        .addOption("grid", "网格")
        .addOption("dots", "点阵")
        .setValue(this.plugin.settings.backgroundPattern)
        .onChange(async (value) => {
          this.plugin.settings.backgroundPattern = value as BackgroundPattern;
          await this.saveAndRefresh();
        }));

    this.addOptionalColorSetting(
      containerEl,
      "背景图案颜色",
      "控制网格线或点阵的颜色。",
      () => this.plugin.settings.backgroundPatternColor,
      async (value) => { this.plugin.settings.backgroundPatternColor = value || "#94a3b8"; },
      "#94a3b8",
      false
    );

    containerEl.createEl("h3", { text: "字体与文字" });

    new Setting(containerEl)
      .setName("默认字体")
      .addDropdown((dropdown) => dropdown
        .addOption("obsidian", "跟随 Obsidian")
        .addOption("sans", "无衬线字体")
        .addOption("serif", "衬线字体")
        .addOption("mono", "等宽字体")
        .addOption("custom", "自定义字体")
        .setValue(this.plugin.settings.fontFamily)
        .onChange(async (value) => {
          this.plugin.settings.fontFamily = value as FontFamilyMode;
          await this.saveAndRefresh();
          this.display();
        }));

    if (this.plugin.settings.fontFamily === "custom") {
      new Setting(containerEl)
        .setName("自定义字体名称")
        .setDesc("填写系统中已经安装的字体名称，例如 Microsoft YaHei、PingFang SC。")
        .addText((text) => text
          .setPlaceholder("Microsoft YaHei")
          .setValue(this.plugin.settings.customFont)
          .onChange(async (value) => {
            this.plugin.settings.customFont = value.trim().slice(0, 120);
            await this.saveAndRefresh();
          }));
    }

    new Setting(containerEl)
      .setName("默认字号")
      .setDesc("范围 10–30 像素。节点仍可单独覆盖字号。")
      .addSlider((slider) => slider
        .setLimits(10, 30, 1)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.fontSize)
        .onChange(async (value) => {
          this.plugin.settings.fontSize = value;
          await this.saveAndRefresh();
        }));

    this.addOptionalColorSetting(
      containerEl,
      "默认文字颜色",
      "留空时使用 Obsidian 主题文字颜色；根节点仍优先使用主题强调色的对比文字。",
      () => this.plugin.settings.textColor,
      async (value) => { this.plugin.settings.textColor = value; },
      "#0f172a"
    );

    new Setting(containerEl)
      .setName("默认节点文字对齐")
      .setDesc("控制未单独设置对齐方式的节点；节点编辑窗口仍可覆盖。")
      .addDropdown((dropdown) => dropdown
        .addOption("left", "左对齐")
        .addOption("center", "居中")
        .addOption("right", "右对齐")
        .setValue(this.plugin.settings.defaultNodeTextAlign)
        .onChange(async (value) => {
          this.plugin.settings.defaultNodeTextAlign = value as NodeTextAlign;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("默认文字加粗")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.defaultTextBold)
        .onChange(async (value) => {
          this.plugin.settings.defaultTextBold = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("默认文字斜体")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.defaultTextItalic)
        .onChange(async (value) => {
          this.plugin.settings.defaultTextItalic = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("默认文字下划线")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.defaultTextUnderline)
        .onChange(async (value) => {
          this.plugin.settings.defaultTextUnderline = value;
          await this.saveAndRefresh();
        }));

    containerEl.createEl("h3", { text: "节点样式" });

    this.addOptionalColorSetting(
      containerEl,
      "中心主题颜色",
      "根节点的背景颜色。主题模板会自动设置。",
      () => this.plugin.settings.rootColor,
      async (value) => { this.plugin.settings.rootColor = value; },
      "#4f46e5"
    );

    this.addOptionalColorSetting(
      containerEl,
      "中心主题文字颜色",
      "根节点的文字颜色。",
      () => this.plugin.settings.rootTextColor,
      async (value) => { this.plugin.settings.rootTextColor = value; },
      "#ffffff"
    );

    new Setting(containerEl)
      .setName("默认节点形状")
      .setDesc("只影响未单独设置形状的节点。")
      .addDropdown((dropdown) => dropdown
        .addOption("rounded", "圆角")
        .addOption("pill", "胶囊")
        .addOption("rectangle", "直角")
        .setValue(this.plugin.settings.defaultNodeShape)
        .onChange(async (value) => {
          this.plugin.settings.defaultNodeShape = value as NodeShape;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("节点宽度模式")
      .setDesc("固定宽度统一显示；自动宽度会依据文字长度伸缩，并在达到最大宽度后换行。")
      .addDropdown((dropdown) => dropdown
        .addOption("auto", "自动宽度")
        .addOption("fixed", "固定宽度")
        .setValue(this.plugin.settings.nodeWidthMode)
        .onChange(async (value) => {
          this.plugin.settings.nodeWidthMode = value === "fixed" ? "fixed" : "auto";
          await this.saveAndRefresh();
          this.display();
        }));

    new Setting(containerEl)
      .setName("固定节点宽度")
      .setDesc("固定宽度模式下使用，范围 100–900 像素。")
      .addText((text) => text
        .setValue(String(this.plugin.settings.defaultNodeWidth))
        .onChange(async (value) => {
          const parsed = Number(value);
          if (!Number.isFinite(parsed)) return;
          this.plugin.settings.defaultNodeWidth = Math.max(100, Math.min(900, Math.round(parsed)));
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("自动宽度上限")
      .setDesc("自动宽度达到此值后换行；手动拖动节点宽度仍可突破该上限。范围 120–900 像素。")
      .addText((text) => text
        .setValue(String(this.plugin.settings.autoNodeMaxWidth))
        .onChange(async (value) => {
          const parsed = Number(value);
          if (!Number.isFinite(parsed)) return;
          this.plugin.settings.autoNodeMaxWidth = Math.max(120, Math.min(900, Math.round(parsed)));
          await this.saveAndRefresh();
        }));

    this.addOptionalColorSetting(
      containerEl,
      "默认节点背景色",
      "留空时跟随 Obsidian 主题。单个节点设置的颜色优先级更高。",
      () => this.plugin.settings.nodeBackgroundColor,
      async (value) => { this.plugin.settings.nodeBackgroundColor = value; },
      "#ffffff"
    );

    this.addOptionalColorSetting(
      containerEl,
      "默认节点边框颜色",
      "留空时跟随 Obsidian 主题边框颜色。",
      () => this.plugin.settings.nodeBorderColor,
      async (value) => { this.plugin.settings.nodeBorderColor = value; },
      "#94a3b8"
    );

    new Setting(containerEl)
      .setName("默认节点边框粗细")
      .setDesc("范围 0–6 像素；0 表示无边框。")
      .addSlider((slider) => slider
        .setLimits(0, 6, 0.5)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.nodeBorderWidth)
        .onChange(async (value) => {
          this.plugin.settings.nodeBorderWidth = value;
          await this.saveAndRefresh();
        }));

    containerEl.createEl("h3", { text: "连线样式" });

    new Setting(containerEl)
      .setName("彩色分支")
      .setDesc("按照中心主题的一级分支分配颜色，同一分支的节点边框和连线保持一致。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.colorfulBranches)
        .onChange(async (value) => {
          this.plugin.settings.colorfulBranches = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("分支颜色")
      .setDesc("使用逗号分隔的十六进制颜色，一级分支会循环使用。")
      .addTextArea((text) => text
        .setPlaceholder("#4f46e5, #0284c7, #0f766e")
        .setValue(this.plugin.settings.branchColors.join(", "))
        .onChange(async (value) => {
          this.plugin.settings.branchColors = value.split(/[,，\s]+/).map((item) => item.trim()).filter((item) => /^#[0-9a-f]{6}$/i.test(item)).slice(0, 12);
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("连线类型")
      .addDropdown((dropdown) => dropdown
        .addOption("curved", "曲线")
        .addOption("straight", "直线")
        .addOption("elbow", "折线")
        .setValue(this.plugin.settings.edgeStyle)
        .onChange(async (value) => {
          this.plugin.settings.edgeStyle = value as EdgeStyle;
          await this.saveAndRefresh();
        }));

    this.addOptionalColorSetting(
      containerEl,
      "连线颜色",
      "留空时使用当前主题强调色。节点单独设置颜色时，可继续为该分支连线着色。",
      () => this.plugin.settings.edgeColor,
      async (value) => { this.plugin.settings.edgeColor = value; },
      "#7c8aa5"
    );

    new Setting(containerEl)
      .setName("连线粗细模式")
      .setDesc("“从粗到细”会让靠近中心主题的线最粗，越深层越细。")
      .addDropdown((dropdown) => dropdown
        .addOption("uniform", "统一粗细")
        .addOption("tapered", "从粗到细")
        .setValue(this.plugin.settings.edgeWidthMode)
        .onChange(async (value) => {
          this.plugin.settings.edgeWidthMode = value as EdgeWidthMode;
          await this.saveAndRefresh();
          this.display();
        }));

    new Setting(containerEl)
      .setName(this.plugin.settings.edgeWidthMode === "tapered" ? "起始粗细" : "连线粗细")
      .setDesc("靠近中心主题的连线宽度，范围 0.5–8 像素。")
      .addSlider((slider) => slider
        .setLimits(0.5, 8, 0.05)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.edgeWidth)
        .onChange(async (value) => {
          this.plugin.settings.edgeWidth = value;
          if (this.plugin.settings.edgeMinWidth > value) this.plugin.settings.edgeMinWidth = value;
          await this.saveAndRefresh();
        }));

    if (this.plugin.settings.edgeWidthMode === "tapered") {
      new Setting(containerEl)
        .setName("末端最细宽度")
        .setDesc("深层分支不会细于该值，范围 0.25–4 像素。")
        .addSlider((slider) => slider
          .setLimits(0.25, 4, 0.05)
          .setDynamicTooltip()
          .setValue(this.plugin.settings.edgeMinWidth)
          .onChange(async (value) => {
            this.plugin.settings.edgeMinWidth = Math.min(value, this.plugin.settings.edgeWidth);
            await this.saveAndRefresh();
          }));
    }

    containerEl.createEl("h3", { text: "编辑" });

    new Setting(containerEl)
      .setName("显示任务进度")
      .setDesc("在包含任务的分支节点底部显示完成百分比。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showTaskProgress)
        .onChange(async (value) => {
          this.plugin.settings.showTaskProgress = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("打开时自动适应画布")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoFitOnOpen)
        .onChange(async (value) => {
          this.plugin.settings.autoFitOnOpen = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("撤销历史步数")
      .setDesc("范围 20–500；数值越大占用的内存越多。")
      .addSlider((slider) => slider
        .setLimits(20, 500, 10)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.historyLimit)
        .onChange(async (value) => {
          this.plugin.settings.historyLimit = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("嵌入预览最大高度")
      .setDesc("范围 240–1200 像素。")
      .addSlider((slider) => slider
        .setLimits(240, 1200, 20)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.embedMaxHeight)
        .onChange(async (value) => {
          this.plugin.settings.embedMaxHeight = value;
          await this.plugin.saveSettings();
        }));


    containerEl.createEl("h3", { text: "全局搜索索引" });
    const searchStatus = this.plugin.getGlobalSearchIndexStatus();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: searchStatus.building
        ? `正在建立索引；当前已收录 ${searchStatus.files} 个导图、${searchStatus.nodes} 个节点。`
        : `本地索引已收录 ${searchStatus.files} 个导图、${searchStatus.nodes} 个节点。索引文件仅保存在插件目录，不会上传网络。`
    });

    new Setting(containerEl)
      .setName("单次最多显示结果")
      .setDesc("范围 20–500。索引会搜索整个仓库中的所有 .mindmap 文件。")
      .addSlider((slider) => slider
        .setLimits(20, 500, 10)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.globalSearchMaxResults)
        .onChange(async (value) => {
          this.plugin.settings.globalSearchMaxResults = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("重建搜索索引")
      .setDesc("当文件由外部同步工具批量修改，或搜索结果与实际内容不一致时使用。")
      .addButton((button) => button
        .setButtonText("立即重建")
        .onClick(async () => {
          button.setDisabled(true);
          try {
            await this.plugin.rebuildGlobalSearchIndex();
            this.display();
          } finally {
            button.setDisabled(false);
          }
        }));

    containerEl.createEl("h3", { text: "恢复初始设置" });
    new Setting(containerEl)
      .setName("一键还原所有插件设置")
      .setDesc("恢复显示模式、主题、资源目录、图床、搜索和编辑选项。不会删除或修改任何 .mindmap 文件。")
      .addButton((button) => button
        .setWarning()
        .setButtonText("恢复初始设置")
        .onClick(async () => {
          const confirmed = window.confirm("确定恢复 MindMap Studio 的全部插件设置吗？脑图文件不会被删除。");
          if (!confirmed) return;
          await this.plugin.resetAllSettings();
          new Notice("已恢复初始设置");
          this.display();
        }));
  }

  /**
   * 添加optional color setting，并保持模型、界面和持久化状态的一致性。
   *
   * @param container 接收渲染内容的 DOM 容器。
   * @param name 该参数用于 add optional color setting 流程中的输入或控制。
   * @param description 该参数用于 add optional color setting 流程中的输入或控制。
   * @param getValue 该参数用于 add optional color setting 流程中的输入或控制。
   * @param setValue 该参数用于 add optional color setting 流程中的输入或控制。
   * @param fallback 该参数用于 add optional color setting 流程中的输入或控制。
   * @param allowReset 该参数用于 add optional color setting 流程中的输入或控制。
   */
  private addOptionalColorSetting(
    container: HTMLElement,
    name: string,
    description: string,
    getValue: () => string,
    setValue: (value: string) => Promise<void>,
    fallback: string,
    allowReset = true
  ): void {
    const setting = new Setting(container)
      .setName(name)
      .setDesc(description)
      .addColorPicker((picker) => picker
        .setValue(getValue() || fallback)
        .onChange(async (value) => {
          await setValue(value);
          await this.saveAndRefresh();
        }));
    if (allowReset) {
      setting.addButton((button) => button
        .setButtonText("跟随主题")
        .onClick(async () => {
          await setValue("");
          await this.saveAndRefresh();
          this.display();
        }));
    }
  }

  /**
   * 保存and refresh，并保持模型、界面和持久化状态的一致性。
   */
  private async saveAndRefresh(): Promise<void> {
    await this.plugin.saveSettings();
    this.plugin.refreshOpenViews();
  }
}
