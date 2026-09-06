/** @file appearance-modal.ts
 * @description 统一“主题与外观”弹窗：画布、节点、连线、文章编号、代码与阅读样式设置。
 */
import { App, Modal } from "obsidian";
import type {
  ArticleLeafNumberingStyle,
  ArticleNumberingMode,
  ArticleStyle,
  ArticleStylePresetId,
  BackgroundPattern,
  EdgeStyle,
  EdgeWidthMode,
  FontFamilyMode,
  MindMapAppearance,
  MindMapThemePresetId,
  NodeTextAlign
} from "../core/model";
import { articleNumberLabel, resolveArticleTocMaxDepth } from "../article/modes";
import { ARTICLE_STYLE_PRESETS, resolveArticleStyle } from "../article/article-style";
import { appearanceFromThemePreset, MINDMAP_THEME_PRESETS } from "../themes";


/** 当前节点或中心节点保存的文章编号覆盖设置。 */
export interface ArticleNumberingValues {
  articleNumberingMode?: ArticleNumberingMode;
  articleNumberingLevel?: number;
}

/** 文章编号控件返回的读取句柄。 */
export interface ArticleNumberingControls {
  read: () => ArticleNumberingValues;
}

/** 插件级阅读样式默认值；当前页面可在“主题与外观”中覆盖。 */
interface ReadingStyleDefaults {
  tocStyle: NonNullable<ArticleStyle["tocStyle"]>;
  enabled: boolean;
  style: "solid" | "hollow" | "square" | "dash";
  color: string;
  alignment: "flush" | "auto";
  numberingEnabled: boolean;
  numberingStyle: ArticleLeafNumberingStyle;
  numberingThreshold: number;
}

/** “阅读样式”控件在提交时返回的读取句柄。 */
interface ReadingStyleControls {
  read: () => ArticleStyle;
}

/**
 * 创建文章与通读共用的阅读样式控件。
 *
 * @param container 承载控件的网格。
 * @param style 当前页面保存的阅读样式。
 * @param globalDefaults 插件级末端正文默认值。
 * @returns 可在统一“主题与外观”提交时读取样式的句柄。
 */
function createReadingStyleControls(
  container: HTMLElement,
  style: ArticleStyle | undefined,
  globalDefaults: ReadingStyleDefaults
): ReadingStyleControls {
  const source = style ?? { preset: "classic" as const };
  const resolved = resolveArticleStyle(source);
  const presetLabel = container.createEl("label", { text: "阅读样式预设" });
  const preset = presetLabel.createEl("select");
  for (const [id, name] of [["classic", "经典文档"], ["book", "书籍阅读"], ["modern", "现代报告"], ["minimal", "极简留白"]] as const) {
    preset.createEl("option", { text: name, attr: { value: id } });
  }
  const addText = (labelText: string): HTMLInputElement => {
    const label = container.createEl("label", { text: labelText });
    return label.createEl("input", { type: "text" });
  };
  const addColor = (labelText: string): HTMLInputElement => {
    const label = container.createEl("label", { text: labelText });
    const row = label.createDiv({ cls: "mmc-color-row mmc-appearance-color-row" });
    return row.createEl("input", { type: "color" });
  };
  const fontFamily = addText("阅读字体");
  const textColor = addColor("正文颜色");
  const headingColor = addColor("标题颜色");
  const accentColor = addColor("强调色");
  const backgroundColor = addColor("纸张背景");
  const tocLabel = container.createEl("label", { text: "目录样式" });
  const tocStyle = tocLabel.createEl("select");
  const tocStyleNames: Record<NonNullable<ArticleStyle["tocStyle"]>, string> = {
    card: "卡片",
    plain: "简洁列表",
    original: "素雅面板",
    "minimal-page": "极简书页",
    magazine: "杂志网格",
    timeline: "垂直时间线",
    glass: "暗色玻璃",
    aurora: "极光列表",
    ink: "墨韵书卷",
    sunset: "落日暖橙"
  };
  tocStyle.createEl("option", {
    text: `跟随插件设置（当前：${tocStyleNames[globalDefaults.tocStyle]}）`,
    attr: { value: "" }
  });
  for (const [id, name] of [
    ["card", "卡片"],
    ["plain", "简洁列表"],
    ["original", "素雅面板"],
    ["minimal-page", "极简书页"],
    ["magazine", "杂志网格"],
    ["timeline", "垂直时间线"],
    ["glass", "暗色玻璃"],
    ["aurora", "极光列表"],
    ["ink", "墨韵书卷"],
    ["sunset", "落日暖橙"]
  ] as const) {
    tocStyle.createEl("option", { text: name, attr: { value: id } });
  }
  const sizeLabel = container.createEl("label", { text: "正文字号" });
  const fontSize = sizeLabel.createEl("input", { type: "number", attr: { min: "12", max: "24", step: "1" } });
  const lineLabel = container.createEl("label", { text: "正文行高" });
  const lineHeight = lineLabel.createEl("input", { type: "number", attr: { min: "1.2", max: "2.4", step: "0.05" } });

  const markerEnabledLabel = container.createEl("label", { text: "末端正文标识" });
  const markerEnabled = markerEnabledLabel.createEl("select");
  markerEnabled.createEl("option", { text: `跟随插件设置（当前${globalDefaults.enabled ? "显示" : "隐藏"}）`, attr: { value: "" } });
  markerEnabled.createEl("option", { text: "显示", attr: { value: "true" } });
  markerEnabled.createEl("option", { text: "隐藏", attr: { value: "false" } });
  const markerStyleLabel = container.createEl("label", { text: "末端正文标识样式" });
  const markerStyle = markerStyleLabel.createEl("select");
  markerStyle.createEl("option", { text: "跟随插件设置", attr: { value: "" } });
  for (const [id, name] of [["solid", "实心圆"], ["hollow", "空心圆"], ["square", "实心方块"], ["dash", "短横线"]] as const) {
    markerStyle.createEl("option", { text: name, attr: { value: id } });
  }
  const markerColorLabel = container.createEl("label", { text: "末端正文标识颜色" });
  const markerColorRow = markerColorLabel.createDiv({ cls: "mmc-color-row mmc-appearance-color-row" });
  const markerColor = markerColorRow.createEl("input", { type: "color" });
  const markerColorFollowTheme = markerColorRow.createEl("button", {
    text: "跟随主题",
    attr: { type: "button", "aria-pressed": "true" }
  });
  let markerColorFollowsTheme = true;
  const setMarkerColorFollowsTheme = (followsTheme: boolean): void => {
    markerColorFollowsTheme = followsTheme;
    markerColorFollowTheme.setAttribute("aria-pressed", String(followsTheme));
  };
  const syncMarkerColorPreview = (): void => {
    if (!markerColorFollowsTheme) return;
    markerColor.value = globalDefaults.color || accentColor.value || "#ef4444";
  };
  const alignmentLabel = container.createEl("label", { text: "末端正文对齐方式" });
  const alignment = alignmentLabel.createEl("select");
  alignment.createEl("option", { text: `跟随插件设置（当前${globalDefaults.alignment === "auto" ? "自动" : "顶格"}）`, attr: { value: "" } });
  alignment.createEl("option", { text: "顶格", attr: { value: "flush" } });
  alignment.createEl("option", { text: "自动（与上级标题对齐）", attr: { value: "auto" } });
  const numberingEnabledLabel = container.createEl("label", { text: "末端正文标识转序号" });
  const numberingEnabled = numberingEnabledLabel.createEl("select");
  numberingEnabled.createEl("option", { text: `跟随插件设置（当前${globalDefaults.numberingEnabled ? "开启" : "关闭"}）`, attr: { value: "" } });
  numberingEnabled.createEl("option", { text: "开启", attr: { value: "true" } });
  numberingEnabled.createEl("option", { text: "关闭", attr: { value: "false" } });
  const numberingStyleLabel = container.createEl("label", { text: "末端正文序号样式" });
  const numberingStyle = numberingStyleLabel.createEl("select");
  numberingStyle.createEl("option", { text: `跟随插件设置（当前${globalDefaults.numberingStyle === "circled" ? "带圈数字" : "下一级文章序号"}）`, attr: { value: "" } });
  numberingStyle.createEl("option", { text: "上级标题的下一级文章序号", attr: { value: "next-level" } });
  numberingStyle.createEl("option", { text: "带圈数字（统一圆圈，支持 51+）", attr: { value: "circled" } });
  const numberingThresholdLabel = container.createEl("label", { text: "末端正文转序号阈值" });
  const numberingThreshold = numberingThresholdLabel.createEl("input", { type: "number", attr: { min: "1", max: "20", step: "1" } });

  const fill = (nextStyle: ArticleStyle): void => {
    const nextResolved = resolveArticleStyle(nextStyle);
    preset.value = nextResolved.preset;
    fontFamily.value = nextResolved.fontFamily ?? "";
    textColor.value = nextResolved.textColor ?? "#20242c";
    headingColor.value = nextResolved.headingColor ?? "#111827";
    accentColor.value = nextResolved.accentColor ?? "#7c3aed";
    backgroundColor.value = nextResolved.backgroundColor ?? "#ffffff";
    tocStyle.value = nextStyle.tocStyle ?? "";
    fontSize.value = String(nextResolved.fontSize ?? 16);
    lineHeight.value = String(nextResolved.lineHeight ?? 1.85);
    markerEnabled.value = nextStyle.leafMarkerEnabled === undefined ? "" : String(nextStyle.leafMarkerEnabled);
    markerStyle.value = nextStyle.leafMarkerStyle ?? "";
    setMarkerColorFollowsTheme(nextStyle.leafMarkerColor === undefined);
    markerColor.value = nextStyle.leafMarkerColor ?? (globalDefaults.color || nextResolved.accentColor || "#ef4444");
    alignment.value = nextStyle.leafTextAlignment ?? "";
    numberingEnabled.value = nextStyle.leafNumberingEnabled === undefined ? "" : String(nextStyle.leafNumberingEnabled);
    numberingStyle.value = nextStyle.leafNumberingStyle ?? "";
    numberingThreshold.value = String(nextStyle.leafNumberingThreshold ?? globalDefaults.numberingThreshold);
  };
  fill(source);
  preset.addEventListener("change", () => fill(ARTICLE_STYLE_PRESETS[preset.value as ArticleStylePresetId]));
  markerColor.addEventListener("input", () => setMarkerColorFollowsTheme(false));
  markerColorFollowTheme.addEventListener("click", () => {
    setMarkerColorFollowsTheme(true);
    syncMarkerColorPreview();
  });
  accentColor.addEventListener("input", syncMarkerColorPreview);

  return {
    read: () => ({
      preset: preset.value as ArticleStylePresetId,
      fontFamily: fontFamily.value.trim() || undefined,
      textColor: textColor.value,
      headingColor: headingColor.value,
      accentColor: accentColor.value,
      backgroundColor: backgroundColor.value,
      tocStyle: tocStyle.value ? tocStyle.value as ArticleStyle["tocStyle"] : undefined,
      fontSize: Math.max(12, Math.min(24, Number(fontSize.value) || resolved.fontSize || 16)),
      lineHeight: Math.max(1.2, Math.min(2.4, Number(lineHeight.value) || resolved.lineHeight || 1.85)),
      leafMarkerEnabled: markerEnabled.value === "" ? undefined : markerEnabled.value === "true",
      leafMarkerStyle: markerStyle.value === "hollow" || markerStyle.value === "square" || markerStyle.value === "dash"
        ? markerStyle.value
        : markerStyle.value === "solid" ? "solid" : undefined,
      leafMarkerColor: markerColorFollowsTheme ? undefined : markerColor.value,
      leafTextAlignment: alignment.value === "flush" || alignment.value === "auto" ? alignment.value : undefined,
      leafNumberingEnabled: numberingEnabled.value === "" ? undefined : numberingEnabled.value === "true",
      leafNumberingStyle: numberingStyle.value === "circled" || numberingStyle.value === "next-level" ? numberingStyle.value : undefined,
      leafNumberingThreshold: numberingEnabled.value === "" && style?.leafNumberingThreshold === undefined
        ? undefined
        : Math.max(1, Math.min(20, Math.round(Number(numberingThreshold.value) || globalDefaults.numberingThreshold)))
    })
  };
}

/**
 * 创建节点编辑与“主题与外观”共用的文章编号控件，确保两处设置语义和文案一致。
 * 中心节点选择关闭时禁用当前物理导图的全部文章编号；普通节点选择关闭时只跳过该节点。
 * 手动层级表示当前节点所在子树的最高文章层级；中心节点本身不编号，一级子节点直接使用所选层级。
 *
 * @param container 承载表单控件的网格容器。
 * @param currentMode 当前保存的编号覆盖模式；undefined 表示自动。
 * @param currentLevel 当前保存的手动最高层级。
 * @param onChange 控件变化后需要执行的可选回调，例如节点编辑自动保存。
 * @returns 可在提交时读取规范化文章编号设置的句柄。
 */
export function createArticleNumberingControls(
  container: HTMLElement,
  currentMode: ArticleNumberingMode | undefined,
  currentLevel: number | undefined,
  onChange?: () => void
): ArticleNumberingControls {
  const numberingModeLabel = container.createEl("label", { cls: "mmc-article-numbering-control" });
  numberingModeLabel.createSpan({ text: "文章编号方式" });
  const numberingModeSelect = numberingModeLabel.createEl("select");
  numberingModeSelect.createEl("option", { text: "自动（按树层级与标题结构）", attr: { value: "auto" } });
  numberingModeSelect.createEl("option", { text: "关闭（不显示且不占序号）", attr: { value: "none" } });
  numberingModeSelect.createEl("option", { text: "手动层级（自定义最高层级）", attr: { value: "manual" } });
  numberingModeSelect.value = currentMode ?? "auto";

  const numberingLevelLabel = container.createEl("label", { cls: "mmc-article-numbering-control mmc-article-numbering-level" });
  numberingLevelLabel.createSpan({ text: "最高文章层级" });
  const numberingLevelSelect = numberingLevelLabel.createEl("select");
  for (let level = 1; level <= 8; level += 1) {
    numberingLevelSelect.createEl("option", { text: `${level} 级 · ${articleNumberLabel(level, 1)}示例`, attr: { value: String(level) } });
  }
  numberingLevelSelect.value = String(currentLevel ?? 1);
  const numberingHelp = container.createDiv({
    cls: "setting-item-description mmc-article-numbering-help",
    text: "关闭中心节点编号时，当前导图内的章节和末端序号全部隐藏；如果当前文件是顶层总目录，关闭状态会继续作用到挂载的全部子导图。关闭普通节点时只跳过该节点。手动层级用于定义当前节点所在子树的最高文章层级；编辑中心节点时，一级子节点直接使用所选层级。超过第 8 级的更深结构保留标题层级，但不再循环生成 A. /（A）编号。"
  });
  const updateNumberingLevelState = (): void => {
    const manual = numberingModeSelect.value === "manual";
    numberingLevelSelect.disabled = !manual;
    numberingLevelLabel.toggleClass("is-disabled", !manual);
    numberingHelp.toggleClass("is-disabled", !manual);
  };
  numberingModeSelect.addEventListener("change", () => {
    updateNumberingLevelState();
    onChange?.();
  });
  numberingLevelSelect.addEventListener("change", () => onChange?.());
  updateNumberingLevelState();

  return {
    read: () => ({
      articleNumberingMode: numberingModeSelect.value === "manual" || numberingModeSelect.value === "none"
        ? numberingModeSelect.value
        : undefined,
      articleNumberingLevel: numberingModeSelect.value === "manual" ? Number(numberingLevelSelect.value) : undefined
    })
  };
}

/**
 * AppearanceModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class AppearanceModal extends Modal {
  private readonly appearance: MindMapAppearance;
  private readonly numbering: ArticleNumberingValues;
  private readonly articleTocMaxDepth: number | undefined;
  private readonly globalArticleTocMaxDepth: number;
  private readonly articleMiniMap: boolean | undefined;
  private readonly globalArticleMiniMap: boolean;
  private readonly pageCodeAppearance: MindMapAppearance;
  private readonly readingStyle: ArticleStyle | undefined;
  private readonly globalReadingStyle: ReadingStyleDefaults;
  private readonly submit: (appearance: MindMapAppearance, numbering: ArticleNumberingValues, articleTocMaxDepth: number | undefined, articleMiniMap: boolean | undefined, readingStyle: ArticleStyle) => void;
  private readonly reset: () => void;

  /**
   * 创建 AppearanceModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param appearance 导图外观配置。
   * @param numbering 当前中心节点保存的文章编号覆盖设置。
   * @param articleTocMaxDepth 当前脑图保存的目录最大层级覆盖值；undefined 表示跟随插件设置。
   * @param globalArticleTocMaxDepth 插件设置中的目录最大层级，用于界面提示和回退。
   * @param submit 该参数用于 constructor 流程中的输入或控制。
   * @param reset 该参数用于 constructor 流程中的输入或控制。
   */
  constructor(
    app: App,
    appearance: MindMapAppearance,
    numbering: ArticleNumberingValues,
    articleTocMaxDepth: number | undefined,
    globalArticleTocMaxDepth: number,
    articleMiniMap: boolean | undefined,
    globalArticleMiniMap: boolean,
    pageCodeAppearance: MindMapAppearance,
    readingStyle: ArticleStyle | undefined,
    globalReadingStyle: ReadingStyleDefaults,
    submit: (appearance: MindMapAppearance, numbering: ArticleNumberingValues, articleTocMaxDepth: number | undefined, articleMiniMap: boolean | undefined, readingStyle: ArticleStyle) => void,
    reset: () => void
  ) {
    super(app);
    this.appearance = appearance;
    this.numbering = numbering;
    this.articleTocMaxDepth = articleTocMaxDepth;
    this.globalArticleTocMaxDepth = resolveArticleTocMaxDepth(undefined, globalArticleTocMaxDepth);
    this.articleMiniMap = articleMiniMap;
    this.globalArticleMiniMap = globalArticleMiniMap;
    this.pageCodeAppearance = pageCodeAppearance;
    this.readingStyle = readingStyle;
    this.globalReadingStyle = globalReadingStyle;
    this.submit = submit;
    this.reset = reset;
  }

  /**
   * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
   */
  onOpen(): void {
    this.titleEl.setText("主题与外观");
    this.modalEl.addClass("mmc-appearance-dialog");
    this.contentEl.addClass("mmc-appearance-modal");
    const form = this.contentEl.createEl("form");
    form.createEl("p", {
      cls: "setting-item-description",
      text: "先选择主题模板，再按画布、节点、连线、阅读样式、编号与代码分组调整。文章和通读共用阅读样式；设置只保存到当前 .mindmap 文件，并优先于插件全局默认值。"
    });

    let selectedPreset: MindMapThemePresetId = this.appearance.themePreset ?? "classic-indigo";
    const themeSection = form.createDiv({ cls: "mmc-theme-picker mmc-appearance-section" });
    themeSection.createDiv({ cls: "mmc-theme-picker-title", text: "主题模板" });
    themeSection.createDiv({
      cls: "setting-item-description mmc-appearance-section-description",
      text: "主题模板会一次更新颜色、字体和连线；下方单项仍可继续覆盖。"
    });
    const themeGrid = themeSection.createDiv({ cls: "mmc-theme-card-grid" });
    const themeCards = new Map<MindMapThemePresetId, HTMLButtonElement>();

    const appearanceColumns = form.createDiv({ cls: "mmc-appearance-columns" });
    const appearanceLeftColumn = appearanceColumns.createDiv({ cls: "mmc-appearance-column" });
    const appearanceRightColumn = appearanceColumns.createDiv({ cls: "mmc-appearance-column" });
    const createAppearanceSection = (container: HTMLElement, title: string, description: string): { section: HTMLDivElement; grid: HTMLDivElement } => {
      const section = container.createDiv({ cls: "mmc-appearance-section" });
      section.createDiv({ cls: "mmc-theme-picker-title", text: title });
      section.createDiv({ cls: "setting-item-description mmc-appearance-section-description", text: description });
      const grid = section.createDiv({ cls: "mmc-form-grid mmc-appearance-grid" });
      return { section, grid };
    };
    const addColor = (container: HTMLElement, labelText: string, value: string | undefined, fallback: string): { toggle: HTMLInputElement; input: HTMLInputElement } => {
      const label = container.createEl("label", { text: labelText });
      const row = label.createDiv({ cls: "mmc-color-row" });
      const toggle = row.createEl("input", { type: "checkbox" });
      const input = row.createEl("input", { type: "color" });
      toggle.checked = Boolean(value);
      input.value = value ?? fallback;
      input.disabled = !toggle.checked;
      toggle.addEventListener("change", () => { input.disabled = !toggle.checked; });
      return { toggle, input };
    };

    const canvasSection = createAppearanceSection(appearanceLeftColumn, "画布与字体", "集中设置背景、图案和当前脑图的基础字体。");
    const background = addColor(canvasSection.grid, "背景颜色", this.appearance.backgroundColor, "#f8fafc");
    const patternLabel = canvasSection.grid.createEl("label", { text: "背景图案" });
    const patternSelect = patternLabel.createEl("select");
    for (const [value, label] of [["none", "无"], ["grid", "网格"], ["dots", "点阵"]] as const) patternSelect.createEl("option", { text: label, attr: { value } });
    patternSelect.value = this.appearance.backgroundPattern ?? "grid";
    const patternColor = addColor(canvasSection.grid, "图案颜色", this.appearance.patternColor, "#94a3b8");
    const fontLabel = canvasSection.grid.createEl("label", { text: "字体" });
    const fontSelect = fontLabel.createEl("select");
    for (const [value, label] of [["obsidian", "跟随 Obsidian"], ["sans", "无衬线"], ["serif", "衬线"], ["mono", "等宽"], ["custom", "自定义"]] as const) fontSelect.createEl("option", { text: label, attr: { value } });
    fontSelect.value = this.appearance.fontFamily ?? "obsidian";
    const customFontLabel = canvasSection.grid.createEl("label", { text: "自定义字体名称" });
    const customFontInput = customFontLabel.createEl("input", { type: "text", attr: { placeholder: "Microsoft YaHei" } });
    customFontInput.value = this.appearance.customFont ?? "";
    const updateCustomFont = (): void => {
      customFontInput.disabled = fontSelect.value !== "custom";
      customFontLabel.toggleClass("is-disabled", customFontInput.disabled);
    };
    fontSelect.addEventListener("change", updateCustomFont);
    updateCustomFont();
    const fontSizeLabel = canvasSection.grid.createEl("label", { text: "字号（10–30）" });
    const fontSizeInput = fontSizeLabel.createEl("input", { type: "number", attr: { min: "10", max: "30", step: "1" } });
    fontSizeInput.value = String(this.appearance.fontSize ?? 14);

    const nodeSection = createAppearanceSection(appearanceRightColumn, "节点与文字", "设置分支形态、节点配色、边框和默认文字表现。");
    const nodeVisualStyleLabel = nodeSection.grid.createEl("label", { text: "分支外观" });
    const nodeVisualStyleSelect = nodeVisualStyleLabel.createEl("select");
    nodeVisualStyleSelect.createEl("option", { text: "圆润卡片分支（曲线）", attr: { value: "card" } });
    nodeVisualStyleSelect.createEl("option", { text: "圆角分支（折线）", attr: { value: "branch" } });
    nodeVisualStyleSelect.value = this.appearance.nodeVisualStyle ?? "card";
    nodeVisualStyleLabel.createDiv({ cls: "setting-item-description", text: "当前脑图设置，优先于插件全局分支外观。" });
    const nodeTextAlignLabel = nodeSection.grid.createEl("label", { text: "节点文字对齐" });
    const nodeTextAlignSelect = nodeTextAlignLabel.createEl("select");
    nodeTextAlignSelect.createEl("option", { text: "左对齐", attr: { value: "left" } });
    nodeTextAlignSelect.createEl("option", { text: "居中", attr: { value: "center" } });
    nodeTextAlignSelect.createEl("option", { text: "右对齐", attr: { value: "right" } });
    nodeTextAlignSelect.value = this.appearance.nodeTextAlign ?? "center";
    const rootColor = addColor(nodeSection.grid, "中心主题颜色", this.appearance.rootColor, "#4f46e5");
    const rootTextColor = addColor(nodeSection.grid, "中心主题文字", this.appearance.rootTextColor, "#ffffff");
    const nodeColor = addColor(nodeSection.grid, "节点背景色", this.appearance.nodeColor, "#ffffff");
    const textColor = addColor(nodeSection.grid, "文字颜色", this.appearance.textColor, "#0f172a");
    const borderColor = addColor(nodeSection.grid, "节点边框颜色", this.appearance.nodeBorderColor, "#94a3b8");
    const borderWidthLabel = nodeSection.grid.createEl("label", { text: "边框粗细（0–6）" });
    const borderWidthInput = borderWidthLabel.createEl("input", { type: "number", attr: { min: "0", max: "6", step: "0.5" } });
    borderWidthInput.value = String(this.appearance.nodeBorderWidth ?? 1);
    const textStyleSection = nodeSection.section.createDiv({ cls: "mmc-appearance-text-style" });
    textStyleSection.createDiv({ cls: "mmc-appearance-text-style-title", text: "文字样式" });
    const textStyle = textStyleSection.createDiv({ cls: "mmc-appearance-style-options" });
    const addCheck = (text: string, checked: boolean): HTMLInputElement => {
      const label = textStyle.createEl("label", { cls: "mmc-appearance-style-option" });
      const input = label.createEl("input", { type: "checkbox" });
      input.checked = checked;
      label.createSpan({ text });
      return input;
    };
    const bold = addCheck("文字加粗", this.appearance.bold === true);
    const italic = addCheck("文字斜体", this.appearance.italic === true);
    const underline = addCheck("文字下划线", this.appearance.underline === true);

    const edgeSection = createAppearanceSection(appearanceLeftColumn, "连线与分支", "统一管理连线形态、粗细变化和彩色一级分支。");
    const edgeColor = addColor(edgeSection.grid, "连线颜色", this.appearance.edgeColor, "#7c8aa5");
    const edgeStyleLabel = edgeSection.grid.createEl("label", { text: "连线类型" });
    const edgeStyleSelect = edgeStyleLabel.createEl("select");
    for (const [value, label] of [["curved", "曲线"], ["straight", "直线"], ["elbow", "折线"]] as const) edgeStyleSelect.createEl("option", { text: label, attr: { value } });
    edgeStyleSelect.value = this.appearance.edgeStyle ?? "curved";
    const edgeWidthModeLabel = edgeSection.grid.createEl("label", { text: "连线粗细模式" });
    const edgeWidthModeSelect = edgeWidthModeLabel.createEl("select");
    edgeWidthModeSelect.createEl("option", { text: "统一粗细", attr: { value: "uniform" } });
    edgeWidthModeSelect.createEl("option", { text: "从粗到细", attr: { value: "tapered" } });
    edgeWidthModeSelect.value = this.appearance.edgeWidthMode ?? "tapered";
    const edgeWidthLabel = edgeSection.grid.createEl("label", { text: "起始粗细（0.5–8）" });
    const edgeWidthInput = edgeWidthLabel.createEl("input", { type: "number", attr: { min: "0.5", max: "8", step: "0.05" } });
    edgeWidthInput.value = String(this.appearance.edgeWidth ?? 4.2);
    const edgeMinWidthLabel = edgeSection.grid.createEl("label", { text: "末端最细（0.25–4）" });
    const edgeMinWidthInput = edgeMinWidthLabel.createEl("input", { type: "number", attr: { min: "0.25", max: "4", step: "0.05" } });
    edgeMinWidthInput.value = String(this.appearance.edgeMinWidth ?? 1.2);
    const updateEdgeMin = (): void => {
      const tapered = edgeWidthModeSelect.value === "tapered";
      edgeMinWidthInput.disabled = !tapered;
      edgeMinWidthLabel.toggleClass("is-disabled", !tapered);
      edgeWidthLabel.childNodes[0]!.textContent = tapered ? "起始粗细（0.5–8）" : "连线粗细（0.5–8）";
    };
    edgeWidthModeSelect.addEventListener("change", updateEdgeMin);
    updateEdgeMin();
    const branchLabel = edgeSection.grid.createEl("label", { text: "彩色分支" });
    const branchToggleRow = branchLabel.createDiv({ cls: "mmc-toggle-row" });
    const colorfulBranches = branchToggleRow.createEl("input", { type: "checkbox" });
    colorfulBranches.checked = this.appearance.colorfulBranches === true;
    branchToggleRow.createSpan({ text: "按一级分支循环配色" });
    const branchColorsLabel = edgeSection.grid.createEl("label", { text: "分支颜色（逗号分隔）" });
    branchColorsLabel.addClass("mmc-appearance-grid-span-2");
    const branchColorsInput = branchColorsLabel.createEl("textarea", { attr: { rows: "2", placeholder: "#4f46e5, #0284c7, #0f766e" } });
    branchColorsInput.value = (this.appearance.branchColors ?? []).join(", ");

    const numberingSection = appearanceRightColumn.createDiv({ cls: "mmc-appearance-section mmc-appearance-article-numbering" });
    numberingSection.createDiv({ cls: "mmc-theme-picker-title", text: "文章编号与目录" });
    numberingSection.createDiv({ cls: "setting-item-description mmc-appearance-section-description", text: "控制当前脑图的文章编号、目录层级和阅读缩略导航。" });
    const numberingGrid = numberingSection.createDiv({ cls: "mmc-form-grid mmc-appearance-grid" });
    const numberingControls = createArticleNumberingControls(
      numberingGrid,
      this.numbering.articleNumberingMode,
      this.numbering.articleNumberingLevel
    );
    const tocDepthLabel = numberingGrid.createEl("label", { text: "目录最大层级" });
    const tocDepthSelect = tocDepthLabel.createEl("select");
    tocDepthSelect.createEl("option", {
      text: `跟随插件设置（当前 ${this.globalArticleTocMaxDepth} 层）`,
      attr: { value: "" }
    });
    for (let depth = 1; depth <= 8; depth += 1) {
      tocDepthSelect.createEl("option", { text: `${depth} 层`, attr: { value: String(depth) } });
    }
    tocDepthSelect.value = Number.isFinite(this.articleTocMaxDepth) ? String(resolveArticleTocMaxDepth(this.articleTocMaxDepth, this.globalArticleTocMaxDepth)) : "";
    tocDepthLabel.createDiv({
      cls: "setting-item-description",
      text: "同时用于文章模式目录和通读模式全书目录。手动选择后优先于插件全局设置。"
    });
    const miniMapLabel = numberingGrid.createEl("label", { text: "阅读缩略导航图" });
    const miniMapSelect = miniMapLabel.createEl("select");
    miniMapSelect.createEl("option", { text: `跟随插件设置（当前${this.globalArticleMiniMap ? "显示" : "隐藏"}）`, attr: { value: "" } });
    miniMapSelect.createEl("option", { text: "显示", attr: { value: "show" } });
    miniMapSelect.createEl("option", { text: "隐藏", attr: { value: "hide" } });
    miniMapSelect.value = this.articleMiniMap === undefined ? "" : this.articleMiniMap ? "show" : "hide";

    const readingStyleSection = createAppearanceSection(
      appearanceRightColumn,
      "阅读样式",
      "文章模式与通读模式共用同一套纸张、字体、目录和末端正文样式。只读状态只锁正文编辑，不锁这里的外观设置。"
    );
    const readingStyleControls = createReadingStyleControls(readingStyleSection.grid, this.readingStyle, this.globalReadingStyle);

    const codeSection = appearanceLeftColumn.createDiv({ cls: "mmc-appearance-section mmc-appearance-code-settings" });
    codeSection.createDiv({ cls: "mmc-theme-picker-title", text: "页面代码设置" });
    codeSection.createDiv({ cls: "setting-item-description mmc-appearance-section-description", text: "优先级 2：覆盖插件全局代码设置；节点代码设置仍可单独覆盖。" });
    const codeGrid = codeSection.createDiv({ cls: "mmc-form-grid mmc-appearance-grid" });
    const pageCodeCollapsedLabel = codeGrid.createEl("label", { text: "默认状态" });
    const pageCodeCollapsed = pageCodeCollapsedLabel.createEl("select");
    pageCodeCollapsed.createEl("option", { value: "", text: "跟随全局设置" });
    pageCodeCollapsed.createEl("option", { value: "true", text: "折叠" });
    pageCodeCollapsed.createEl("option", { value: "false", text: "展开" });
    pageCodeCollapsed.value = typeof this.pageCodeAppearance.codeCollapsed === "boolean" ? String(this.pageCodeAppearance.codeCollapsed) : "";
    const pageCodeLinesLabel = codeGrid.createEl("label", { text: "行号" });
    const pageCodeLines = pageCodeLinesLabel.createEl("select");
    pageCodeLines.createEl("option", { value: "", text: "跟随全局设置" });
    pageCodeLines.createEl("option", { value: "true", text: "显示" });
    pageCodeLines.createEl("option", { value: "false", text: "隐藏" });
    pageCodeLines.value = typeof this.pageCodeAppearance.codeShowLineNumbers === "boolean" ? String(this.pageCodeAppearance.codeShowLineNumbers) : "";
    const pageCodeThemeLabel = codeGrid.createEl("label", { text: "代码样式" });
    const pageCodeTheme = pageCodeThemeLabel.createEl("select");
    pageCodeTheme.createEl("option", { value: "", text: "跟随全局设置" });
    (["obsidian", "github", "monokai", "dracula"] as const).forEach((value) => pageCodeTheme.createEl("option", { value, text: value === "obsidian" ? "Obsidian" : value === "github" ? "GitHub" : value === "monokai" ? "Monokai" : "Dracula" }));
    pageCodeTheme.value = this.pageCodeAppearance.codeTheme ?? "";

    const setColor = (control: { toggle: HTMLInputElement; input: HTMLInputElement }, value: string | undefined, fallback: string): void => {
      control.toggle.checked = Boolean(value);
      control.input.value = value ?? fallback;
      control.input.disabled = !control.toggle.checked;
    };
    const updateSelectedCards = (): void => {
      for (const [id, card] of themeCards) card.toggleClass("is-selected", id === selectedPreset);
    };
    const applyPreset = (presetId: MindMapThemePresetId): void => {
      selectedPreset = presetId;
      const appearance = appearanceFromThemePreset(presetId);
      setColor(background, appearance.backgroundColor, "#f8fafc");
      patternSelect.value = appearance.backgroundPattern ?? "none";
      setColor(patternColor, appearance.patternColor, "#94a3b8");
      fontSelect.value = appearance.fontFamily ?? "obsidian";
      customFontInput.value = appearance.customFont ?? "";
      fontSizeInput.value = String(appearance.fontSize ?? 14);
      nodeTextAlignSelect.value = appearance.nodeTextAlign ?? "center";
      setColor(rootColor, appearance.rootColor, "#4f46e5");
      setColor(rootTextColor, appearance.rootTextColor, "#ffffff");
      setColor(nodeColor, appearance.nodeColor, "#ffffff");
      setColor(textColor, appearance.textColor, "#0f172a");
      setColor(borderColor, appearance.nodeBorderColor, "#94a3b8");
      borderWidthInput.value = String(appearance.nodeBorderWidth ?? 1);
      setColor(edgeColor, appearance.edgeColor, "#7c8aa5");
      edgeStyleSelect.value = appearance.edgeStyle ?? "curved";
      edgeWidthModeSelect.value = appearance.edgeWidthMode ?? "uniform";
      edgeWidthInput.value = String(appearance.edgeWidth ?? 2.2);
      edgeMinWidthInput.value = String(appearance.edgeMinWidth ?? 1);
      colorfulBranches.checked = appearance.colorfulBranches === true;
      branchColorsInput.value = (appearance.branchColors ?? []).join(", ");
      bold.checked = appearance.bold === true;
      italic.checked = appearance.italic === true;
      underline.checked = appearance.underline === true;
      updateCustomFont();
      updateEdgeMin();
      updateSelectedCards();
    };

    for (const preset of MINDMAP_THEME_PRESETS) {
      const card = themeGrid.createEl("button", { cls: "mmc-theme-card", attr: { type: "button", title: preset.description } });
      themeCards.set(preset.id, card);
      const preview = card.createDiv({ cls: "mmc-theme-card-preview" });
      preview.style.backgroundColor = preset.appearance.backgroundColor ?? "#ffffff";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 112 44");
      svg.setAttribute("aria-hidden", "true");
      const colors = preset.appearance.branchColors ?? [preset.appearance.edgeColor ?? "#7c8aa5"];
      const rootColorValue = preset.appearance.rootColor ?? "#4f46e5";
      const rootNode = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rootNode.setAttribute("x", "8");
      rootNode.setAttribute("y", "15");
      rootNode.setAttribute("width", "32");
      rootNode.setAttribute("height", "14");
      rootNode.setAttribute("rx", "5");
      rootNode.setAttribute("fill", rootColorValue);
      svg.appendChild(rootNode);
      [8, 19, 30].forEach((y, index) => {
        const color = colors[index % colors.length] ?? rootColorValue;
        const edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
        edge.setAttribute("d", `M 40 22 C 51 22, 50 ${y + 3}, 61 ${y + 3} L 70 ${y + 3}`);
        edge.setAttribute("fill", "none");
        edge.setAttribute("stroke", color);
        edge.setAttribute("stroke-width", index === 0 ? "2.6" : "2");
        edge.setAttribute("stroke-linecap", "round");
        svg.appendChild(edge);
        const childNode = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        childNode.setAttribute("x", "70");
        childNode.setAttribute("y", String(y));
        childNode.setAttribute("width", String(31 - index * 3));
        childNode.setAttribute("height", "7");
        childNode.setAttribute("rx", "3");
        childNode.setAttribute("fill", color);
        childNode.setAttribute("fill-opacity", ".22");
        childNode.setAttribute("stroke", color);
        childNode.setAttribute("stroke-width", ".8");
        svg.appendChild(childNode);
      });
      preview.appendChild(svg);
      card.createDiv({ cls: "mmc-theme-card-name", text: preset.name });
      card.addEventListener("click", () => applyPreset(preset.id));
    }
    updateSelectedCards();

    const clamp = (value: string, min: number, max: number, fallback: number): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    };
    const parseBranchColors = (): string[] => branchColorsInput.value
      .split(/[,，\s]+/)
      .map((value) => value.trim())
      .filter((value) => /^#[0-9a-f]{6}$/i.test(value))
      .slice(0, 12);

    const actions = form.createDiv({ cls: "mmc-modal-actions" });
    const reset = actions.createEl("button", { text: "恢复全局默认", type: "button" });
    const cancel = actions.createEl("button", { text: "取消", type: "button" });
    actions.createEl("button", { text: "应用", type: "submit", cls: "mod-cta" });
    reset.addEventListener("click", () => { this.reset(); this.close(); });
    cancel.addEventListener("click", () => this.close());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const maxWidth = clamp(edgeWidthInput.value, 0.5, 8, 4.2);
      this.submit({
        themePreset: selectedPreset,
        backgroundColor: background.toggle.checked ? background.input.value : undefined,
        backgroundPattern: patternSelect.value as BackgroundPattern,
        patternColor: patternColor.toggle.checked ? patternColor.input.value : undefined,
        fontFamily: fontSelect.value as FontFamilyMode,
        customFont: fontSelect.value === "custom" ? customFontInput.value.trim().slice(0, 120) || undefined : undefined,
        fontSize: clamp(fontSizeInput.value, 10, 30, 14),
        nodeVisualStyle: nodeVisualStyleSelect.value as "card" | "branch",
        nodeTextAlign: nodeTextAlignSelect.value as NodeTextAlign,
        rootColor: rootColor.toggle.checked ? rootColor.input.value : undefined,
        rootTextColor: rootTextColor.toggle.checked ? rootTextColor.input.value : undefined,
        nodeColor: nodeColor.toggle.checked ? nodeColor.input.value : undefined,
        textColor: textColor.toggle.checked ? textColor.input.value : undefined,
        nodeBorderColor: borderColor.toggle.checked ? borderColor.input.value : undefined,
        nodeBorderWidth: clamp(borderWidthInput.value, 0, 6, 1),
        edgeColor: edgeColor.toggle.checked ? edgeColor.input.value : undefined,
        edgeWidth: maxWidth,
        edgeStyle: edgeStyleSelect.value as EdgeStyle,
        edgeWidthMode: edgeWidthModeSelect.value as EdgeWidthMode,
        edgeMinWidth: Math.min(maxWidth, clamp(edgeMinWidthInput.value, 0.25, 4, 1.2)),
        colorfulBranches: colorfulBranches.checked,
        branchColors: parseBranchColors(),
        bold: bold.checked,
        italic: italic.checked,
        underline: underline.checked,
        ...(pageCodeCollapsed.value ? { codeCollapsed: pageCodeCollapsed.value === "true" } : {}),
        ...(pageCodeLines.value ? { codeShowLineNumbers: pageCodeLines.value === "true" } : {}),
        ...(pageCodeTheme.value ? { codeTheme: pageCodeTheme.value as "obsidian" | "github" | "monokai" | "dracula" } : {})
      }, numberingControls.read(), tocDepthSelect.value
        ? resolveArticleTocMaxDepth(Number(tocDepthSelect.value), this.globalArticleTocMaxDepth)
        : undefined, miniMapSelect.value === "show" ? true : miniMapSelect.value === "hide" ? false : undefined, readingStyleControls.read());
      this.close();
    });
    const restoreScrollTop = (): void => {
      this.contentEl.scrollTop = 0;
    };
    window.requestAnimationFrame(() => {
      restoreScrollTop();
      window.requestAnimationFrame(restoreScrollTop);
    });
  }
}
