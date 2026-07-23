/**
 * @file model.ts
 * @description MindMap Studio 的领域模型与序列化层。
 *
 * 定义 .mindmap 稳定数据结构，并负责旧版本兼容、字段规范化、富文本、内容块、节点树、Markdown 导入导出及图片镜像候选源排序。
 */

/**
 * LayoutMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type LayoutMode = "right" | "balanced";
/**
 * DisplayMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type DisplayMode = "mindmap" | "outline" | "article";
/** Top-level article landing content. */
export type ArticleLandingMode = "toc" | "article";
/** Built-in article presentation presets. */
export type ArticleStylePresetId = "classic" | "book" | "modern" | "minimal";
/** Per-document article presentation overrides. */
export interface ArticleStyle {
  preset: ArticleStylePresetId;
  fontFamily?: string;
  textColor?: string;
  headingColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  tocStyle?: "card" | "plain" | "lines";
  fontSize?: number;
  lineHeight?: number;
}
/**
 * ThemeMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type ThemeMode = "auto" | "light" | "dark";
/**
 * NodeShape 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type NodeShape = "rounded" | "pill" | "rectangle";
/** Overall sizing and density used when rendering mind-map nodes. */
export type NodeVisualStyle = "card" | "branch";
/** Default width calculation used for nodes without a manual width. */
export type NodeWidthMode = "fixed" | "auto";
/**
 * TaskStatus 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type TaskStatus = "todo" | "doing" | "done";
/**
 * BackgroundPattern 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type BackgroundPattern = "none" | "grid" | "dots";
/**
 * EdgeStyle 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type EdgeStyle = "curved" | "straight" | "elbow";
/**
 * EdgeWidthMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type EdgeWidthMode = "uniform" | "tapered";
/**
 * MindMapThemePresetId 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type MindMapThemePresetId =
  | "classic-indigo"
  | "ocean-blue"
  | "forest-green"
  | "sunset-orange"
  | "lavender-dream"
  | "candy-pop"
  | "paper-note"
  | "minimal-ink"
  | "dark-neon"
  | "mint-clean"
  | "spectrum-flow"
  | "executive-navy"
  | "botanical-calm"
  | "midnight-signal"
  | "sketchbook-warm"
  | "monochrome-air";
/**
 * FontFamilyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type FontFamilyMode = "obsidian" | "sans" | "serif" | "mono" | "custom";
/**
 * TableAlignment 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type TableAlignment = "left" | "center" | "right";
/**
 * NodeTextAlign 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type NodeTextAlign = "left" | "center" | "right";

/**
 * MindMapTextStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
}

/**
 * MindMapTextRun 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapTextRun {
  text: string;
  style?: MindMapTextStyle;
}

/**
 * MindMapTable 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapTable {
  headers: string[];
  rows: string[][];
  alignments?: TableAlignment[];
  source?: "manual" | "markdown" | "children";
}

/**
 * MindMapCodeBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapCodeBlock {
  language?: string;
  code: string;
}

/**
 * MindMapTextContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapTextContentBlock {
  id: string;
  type: "text";
  text: string;
  richText?: MindMapTextRun[];
}

/**
 * MindMapImageRemoteSource 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapImageRemoteSource {
  hostId: string;
  hostName?: string;
  url: string;
  uploadedAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  failureCount?: number;
}

/**
 * MindMapImageSourceCandidate 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapImageSourceCandidate {
  source: string;
  label: string;
  hostId?: string;
  hostName?: string;
  kind: "current" | "remote" | "local";
}

/**
 * MindMapImageContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapImageContentBlock {
  id: string;
  type: "image";
  source: string;
  alt?: string;
  /** Original local vault path retained until every selected image host succeeds. */
  localSource?: string;
  /** Mirror URLs returned by one or more configured image hosts. */
  remoteSources?: MindMapImageRemoteSource[];
}

/**
 * MindMapContentBlock 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type MindMapContentBlock = MindMapTextContentBlock | MindMapImageContentBlock;

/**
 * MindMapSubmap 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapSubmap {
  path: string;
  title?: string;
}

/**
 * MindMapNavigation 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapNavigation {
  parentPath: string;
  parentNodeId?: string;
  parentTitle?: string;
  parentNodeText?: string;
}

/**
 * MindMapAppearance 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapAppearance {
  nodeVisualStyle?: NodeVisualStyle;
  nodeWidthMode?: NodeWidthMode;
  defaultNodeWidth?: number;
  autoNodeMaxWidth?: number;
  themePreset?: MindMapThemePresetId;
  backgroundColor?: string;
  backgroundPattern?: BackgroundPattern;
  patternColor?: string;
  fontFamily?: FontFamilyMode;
  customFont?: string;
  fontSize?: number;
  edgeColor?: string;
  edgeWidth?: number;
  edgeStyle?: EdgeStyle;
  edgeWidthMode?: EdgeWidthMode;
  edgeMinWidth?: number;
  rootColor?: string;
  rootTextColor?: string;
  colorfulBranches?: boolean;
  branchColors?: string[];
  nodeColor?: string;
  textColor?: string;
  nodeBorderColor?: string;
  nodeBorderWidth?: number;
  nodeTextAlign?: NodeTextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/**
 * MindMapNodeStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapNodeStyle {
  color?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shape?: NodeShape;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  textAlign?: NodeTextAlign;
  width?: number;
  minHeight?: number;
}

/**
 * MindMapNode 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapNode {
  id: string;
  text: string;
  richText?: MindMapTextRun[];
  /** Ordered text and image blocks. Legacy text/richText/image fields remain for compatibility. */
  content?: MindMapContentBlock[];
  note?: string;
  link?: string;
  image?: string;
  table?: MindMapTable;
  code?: MindMapCodeBlock;
  submap?: MindMapSubmap;
  icon?: string;
  tags?: string[];
  task?: TaskStatus;
  /** Skip automatic article numbering for prefaces, notes, appendices, etc. */
  skipArticleNumbering?: boolean;
  style?: MindMapNodeStyle;
  collapsed?: boolean;
  children: MindMapNode[];
}

/**
 * MindMapDocumentView 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapDocumentView {
  mode?: DisplayMode;
  readOnly?: boolean;
  articleLandingMode?: ArticleLandingMode;
}

/**
 * MindMapDocument 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapDocument {
  version: 10;
  title: string;
  layout: LayoutMode;
  theme: ThemeMode;
  appearance?: MindMapAppearance;
  navigation?: MindMapNavigation;
  view?: MindMapDocumentView;
  articleStyle?: ArticleStyle;
  root: MindMapNode;
}

/**
 * TaskProgress 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface TaskProgress {
  done: number;
  total: number;
}

export const MINDMAP_CODE_BLOCK = "mindmap-json";
const LEGACY_CODE_BLOCKS = ["smm-json", "mmc-json"] as const;

/**
 * 执行“new id”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function newId(): string {
  const random = Math.random().toString(36).slice(2, 9);
  return `n_${Date.now().toString(36)}_${random}`;
}

/**
 * 创建node，并保持模型、界面和持久化状态的一致性。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function createNode(text = "新节点"): MindMapNode {
  return { id: newId(), text, children: [] };
}

/**
 * 创建default document，并保持模型、界面和持久化状态的一致性。
 *
 * @param title 文档、节点或导出文件的显示标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function createDefaultDocument(title = "新思维导图"): MindMapDocument {
  return {
    version: 10,
    title,
    layout: "right",
    theme: "auto",
    root: {
      id: newId(),
      text: title,
      children: [
        { id: newId(), text: "主题 1", children: [] },
        { id: newId(), text: "主题 2", children: [] }
      ]
    }
  };
}

/**
 * 校验并规范化color，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalizeColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : undefined;
}

/**
 * 校验并规范化number，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @param min 该参数用于 normalize number 流程中的输入或控制。
 * @param max 该参数用于 normalize number 流程中的输入或控制。
 * @returns 计算得到的数值结果。
 */
function normalizeNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

/**
 * 校验并规范化boolean override，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeBooleanOverride(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/**
 * 校验并规范化appearance，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeAppearance(input: Partial<MindMapAppearance> | undefined): MindMapAppearance | undefined {
  if (!input) return undefined;
  const rawNodeVisualStyle = String(input.nodeVisualStyle ?? "");
  const legacyBranchStyle = ["x", "mind"].join("");
  const backgroundPattern: BackgroundPattern | undefined = input.backgroundPattern === "none" || input.backgroundPattern === "grid" || input.backgroundPattern === "dots"
    ? input.backgroundPattern
    : undefined;
  const fontFamily: FontFamilyMode | undefined = input.fontFamily === "obsidian" || input.fontFamily === "sans" || input.fontFamily === "serif" || input.fontFamily === "mono" || input.fontFamily === "custom"
    ? input.fontFamily
    : undefined;
  const edgeStyle: EdgeStyle | undefined = input.edgeStyle === "curved" || input.edgeStyle === "straight" || input.edgeStyle === "elbow"
    ? input.edgeStyle
    : undefined;
  const edgeWidthMode: EdgeWidthMode | undefined = input.edgeWidthMode === "uniform" || input.edgeWidthMode === "tapered"
    ? input.edgeWidthMode
    : undefined;
  const themePreset: MindMapThemePresetId | undefined = [
    "classic-indigo", "ocean-blue", "forest-green", "sunset-orange", "lavender-dream",
    "candy-pop", "paper-note", "minimal-ink", "dark-neon", "mint-clean",
    "spectrum-flow", "executive-navy", "botanical-calm", "midnight-signal", "sketchbook-warm", "monochrome-air"
  ].includes(String(input.themePreset)) ? input.themePreset as MindMapThemePresetId : undefined;
  const branchColors = Array.isArray(input.branchColors)
    ? input.branchColors.map(normalizeColor).filter((color): color is string => Boolean(color)).slice(0, 12)
    : undefined;
  const customFont = typeof input.customFont === "string" && input.customFont.trim()
    ? input.customFont.trim().slice(0, 120)
    : undefined;
  const appearance: MindMapAppearance = {
    nodeVisualStyle: rawNodeVisualStyle === "card"
      ? "card"
      : rawNodeVisualStyle === "branch" || rawNodeVisualStyle === legacyBranchStyle || rawNodeVisualStyle === "compact"
        ? "branch"
        : undefined,
    nodeWidthMode: input.nodeWidthMode === "fixed" || input.nodeWidthMode === "auto" ? input.nodeWidthMode : undefined,
    defaultNodeWidth: normalizeNumber(input.defaultNodeWidth, 100, 900),
    autoNodeMaxWidth: normalizeNumber(input.autoNodeMaxWidth, 120, 900),
    themePreset,
    backgroundColor: normalizeColor(input.backgroundColor),
    backgroundPattern,
    patternColor: normalizeColor(input.patternColor),
    fontFamily,
    customFont,
    fontSize: normalizeNumber(input.fontSize, 10, 30),
    edgeColor: normalizeColor(input.edgeColor),
    edgeWidth: normalizeNumber(input.edgeWidth, 0.5, 8),
    edgeStyle,
    edgeWidthMode,
    edgeMinWidth: normalizeNumber(input.edgeMinWidth, 0.25, 8),
    rootColor: normalizeColor(input.rootColor),
    rootTextColor: normalizeColor(input.rootTextColor),
    colorfulBranches: normalizeBooleanOverride(input.colorfulBranches),
    branchColors: branchColors?.length ? branchColors : undefined,
    nodeColor: normalizeColor(input.nodeColor),
    textColor: normalizeColor(input.textColor),
    nodeBorderColor: normalizeColor(input.nodeBorderColor),
    nodeBorderWidth: normalizeNumber(input.nodeBorderWidth, 0, 6),
    nodeTextAlign: input.nodeTextAlign === "left" || input.nodeTextAlign === "right" || input.nodeTextAlign === "center" ? input.nodeTextAlign : undefined,
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline)
  };
  return Object.values(appearance).some((value) => value !== undefined) ? appearance : undefined;
}

/**
 * 合并appearance，并保持模型、界面和持久化状态的一致性。
 *
 * @param base 被覆盖或合并的基础配置。
 * @param override 覆盖基础配置的可选字段。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function mergeAppearance(base: MindMapAppearance | undefined, override: MindMapAppearance | undefined): MindMapAppearance {
  return { ...(base ?? {}), ...(override ?? {}) };
}

/**
 * 校验并规范化style，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeStyle(input: Partial<MindMapNodeStyle> | undefined): MindMapNodeStyle | undefined {
  if (!input) return undefined;
  const shape: NodeShape | undefined = input.shape === "pill" || input.shape === "rectangle" || input.shape === "rounded"
    ? input.shape
    : undefined;
  const style: MindMapNodeStyle = {
    color: normalizeColor(input.color),
    textColor: normalizeColor(input.textColor),
    borderColor: normalizeColor(input.borderColor),
    borderWidth: normalizeNumber(input.borderWidth, 0, 6),
    shape,
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline),
    fontSize: normalizeNumber(input.fontSize, 10, 32),
    textAlign: input.textAlign === "left" || input.textAlign === "right" || input.textAlign === "center" ? input.textAlign : undefined,
    width: normalizeNumber(input.width, 100, 900),
    minHeight: normalizeNumber(input.minHeight, 36, 600)
  };
  return Object.values(style).some((value) => value !== undefined) ? style : undefined;
}

/**
 * 校验并规范化text style，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeTextStyle(input: Partial<MindMapTextStyle> | undefined): MindMapTextStyle | undefined {
  if (!input) return undefined;
  const style: MindMapTextStyle = {
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline),
    strike: normalizeBooleanOverride(input.strike),
    color: normalizeColor(input.color)
  };
  return Object.values(style).some((value) => value !== undefined) ? style : undefined;
}

/**
 * 执行“text style key”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param style 要应用、比较或规范化的样式。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function textStyleKey(style: MindMapTextStyle | undefined): string {
  return JSON.stringify(style ?? {});
}

/**
 * 校验并规范化rich text，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @param fallbackText 该参数用于 normalize rich text 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
export function normalizeRichText(input: unknown, fallbackText = ""): MindMapTextRun[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const runs: MindMapTextRun[] = [];
  for (const raw of input.slice(0, 500)) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Partial<MindMapTextRun>;
    if (typeof candidate.text !== "string" || !candidate.text) continue;
    const text = candidate.text.replace(/\r\n?/g, "\n").slice(0, 10000);
    if (!text) continue;
    const style = normalizeTextStyle(candidate.style);
    const previous = runs.at(-1);
    if (previous && textStyleKey(previous.style) === textStyleKey(style)) previous.text += text;
    else runs.push({ text, style });
  }
  if (!runs.length) return undefined;

  const combined = runs.map((run) => run.text).join("");
  const leading = combined.length - combined.trimStart().length;
  const trailing = combined.length - combined.trimEnd().length;
  if (leading || trailing) {
    let start = leading;
    let remaining = combined.length - leading - trailing;
    const trimmed: MindMapTextRun[] = [];
    for (const run of runs) {
      if (remaining <= 0) break;
      const skip = Math.min(start, run.text.length);
      start -= skip;
      const available = run.text.length - skip;
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      const text = run.text.slice(skip, skip + take);
      remaining -= take;
      if (text) trimmed.push({ text, style: run.style });
    }
    runs.splice(0, runs.length, ...trimmed);
  }

  if (!runs.length) return fallbackText.trim() ? [{ text: fallbackText.trim() }] : undefined;
  return runs.some((run) => run.style && Object.values(run.style).some((value) => value !== undefined)) ? runs : undefined;
}

/**
 * 执行“rich text plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 该参数用于 rich text plain text 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function richTextPlainText(runs: MindMapTextRun[] | undefined, fallbackText = ""): string {
  return runs?.map((run) => run.text).join("") ?? fallbackText;
}

/**
 * 执行“rich text character styles”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 该参数用于 rich text character styles 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
export function richTextCharacterStyles(runs: MindMapTextRun[] | undefined, fallbackText = ""): MindMapTextStyle[] {
  const text = richTextPlainText(runs, fallbackText);
  const styles: MindMapTextStyle[] = Array.from({ length: text.length }, () => ({}));
  if (!runs?.length) return styles;
  let offset = 0;
  for (const run of runs) {
    const style = run.style ? { ...run.style } : {};
    const end = Math.min(text.length, offset + run.text.length);
    for (let index = offset; index < end; index += 1) styles[index] = { ...style };
    offset = end;
  }
  return styles;
}

/**
 * 执行“character styles to rich text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @param styles 该参数用于 character styles to rich text 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
export function characterStylesToRichText(text: string, styles: MindMapTextStyle[]): MindMapTextRun[] | undefined {
  if (!text) return undefined;
  const runs: MindMapTextRun[] = [];
  let start = 0;
  let current = normalizeTextStyle(styles[0]);
  for (let index = 1; index <= text.length; index += 1) {
    const next = index < text.length ? normalizeTextStyle(styles[index]) : undefined;
    if (index < text.length && textStyleKey(current) === textStyleKey(next)) continue;
    const segment = text.slice(start, index);
    if (segment) runs.push({ text: segment, style: current });
    start = index;
    current = next;
  }
  return normalizeRichText(runs, text);
}

/**
 * 在纯文本被编辑后，尽可能保留原字符位置附近的富文本样式。它通过公共前缀和后缀映射样式，新增字符继承邻近样式，删除字符则自动丢弃对应区间。
 *
 * @param previousText 该参数用于 reconcile rich text after edit 流程中的输入或控制。
 * @param previousRuns 该参数用于 reconcile rich text after edit 流程中的输入或控制。
 * @param nextText 该参数用于 reconcile rich text after edit 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function reconcileRichTextAfterEdit(
  previousText: string,
  previousRuns: MindMapTextRun[] | undefined,
  nextText: string
): MindMapTextRun[] | undefined {
  if (previousText === nextText) return normalizeRichText(previousRuns, nextText);
  const previousStyles = richTextCharacterStyles(previousRuns, previousText);
  const nextStyles: MindMapTextStyle[] = Array.from({ length: nextText.length }, () => ({}));
  let prefix = 0;
  while (prefix < previousText.length && prefix < nextText.length && previousText[prefix] === nextText[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < previousText.length - prefix
    && suffix < nextText.length - prefix
    && previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) suffix += 1;
  for (let index = 0; index < prefix; index += 1) nextStyles[index] = { ...(previousStyles[index] ?? {}) };
  for (let index = 0; index < suffix; index += 1) {
    const previousIndex = previousText.length - suffix + index;
    const nextIndex = nextText.length - suffix + index;
    nextStyles[nextIndex] = { ...(previousStyles[previousIndex] ?? {}) };
  }
  return characterStylesToRichText(nextText, nextStyles);
}

/**
 * 对字符半开区间应用或取消指定富文本样式，并重新合并连续、样式相同的文本段，避免产生大量碎片化运行段。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @param runs 按字符样式拆分的富文本运行段。
 * @param start 该参数用于 apply rich text style range 流程中的输入或控制。
 * @param end 该参数用于 apply rich text style range 流程中的输入或控制。
 * @param patch 该参数用于 apply rich text style range 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function applyRichTextStyleRange(
  text: string,
  runs: MindMapTextRun[] | undefined,
  start: number,
  end: number,
  patch: Partial<MindMapTextStyle> | null
): MindMapTextRun[] | undefined {
  const safeStart = Math.max(0, Math.min(text.length, Math.floor(start)));
  const safeEnd = Math.max(safeStart, Math.min(text.length, Math.floor(end)));
  if (safeStart === safeEnd) return normalizeRichText(runs, text);
  const styles = richTextCharacterStyles(runs, text);
  for (let index = safeStart; index < safeEnd; index += 1) {
    if (patch === null) styles[index] = {};
    else styles[index] = { ...styles[index], ...patch };
  }
  return characterStylesToRichText(text, styles);
}


/**
 * 校验并规范化content block，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeContentBlock(input: unknown): MindMapContentBlock | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<MindMapContentBlock>;
  const id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : newId();
  if (candidate.type === "image") {
    const image = candidate as Partial<MindMapImageContentBlock>;
    const source = typeof image.source === "string" ? image.source.trim().slice(0, 2000) : "";
    if (!source) return null;
    const alt = typeof image.alt === "string" && image.alt.trim() ? image.alt.trim().slice(0, 500) : undefined;
    const localSource = typeof image.localSource === "string" && image.localSource.trim()
      ? image.localSource.trim().slice(0, 2000)
      : undefined;
    const remoteSources = Array.isArray(image.remoteSources)
      ? image.remoteSources.slice(0, 12).flatMap((raw) => {
        if (!raw || typeof raw !== "object") return [];
        const item = raw as Partial<MindMapImageRemoteSource>;
        const hostId = typeof item.hostId === "string" ? item.hostId.trim().slice(0, 160) : "";
        const url = typeof item.url === "string" ? item.url.trim().slice(0, 4000) : "";
        if (!hostId || !/^https?:\/\//i.test(url)) return [];
        return [{
          hostId,
          hostName: typeof item.hostName === "string" && item.hostName.trim() ? item.hostName.trim().slice(0, 200) : undefined,
          url,
          uploadedAt: typeof item.uploadedAt === "string" && item.uploadedAt.trim() ? item.uploadedAt.trim().slice(0, 80) : undefined,
          lastSuccessAt: typeof item.lastSuccessAt === "string" && item.lastSuccessAt.trim() ? item.lastSuccessAt.trim().slice(0, 80) : undefined,
          lastFailureAt: typeof item.lastFailureAt === "string" && item.lastFailureAt.trim() ? item.lastFailureAt.trim().slice(0, 80) : undefined,
          failureCount: typeof item.failureCount === "number" && Number.isFinite(item.failureCount)
            ? Math.max(0, Math.min(1000000, Math.floor(item.failureCount)))
            : undefined
        }];
      })
      : undefined;
    return { id, type: "image", source, alt, localSource, remoteSources: remoteSources?.length ? remoteSources : undefined };
  }
  if (candidate.type === "text") {
    const fallbackText = typeof candidate.text === "string" ? candidate.text.replace(/\r\n?/g, "\n").slice(0, 20000) : "";
    const richText = normalizeRichText(candidate.richText, fallbackText);
    const text = richTextPlainText(richText, fallbackText);
    return { id, type: "text", text, richText };
  }
  return null;
}

/**
 * 为图片内容块构建有序、去重的加载候选列表。顺序从当前地址开始轮转到其他远程镜像，最后按设置选择本地地址，从而支持失效图床自动切换。
 *
 * @param block 当前内容块，通常是文字块或图片块。
 * @param includeLocal 是否把本地图片地址作为最终回退候选。
 * @returns 按当前规则构建的集合结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function imageSourceCandidates(block: MindMapImageContentBlock, includeLocal = true): MindMapImageSourceCandidate[] {
  const candidates: MindMapImageSourceCandidate[] = [];
  const seen = new Set<string>();
  const add = (candidate: MindMapImageSourceCandidate): void => {
    const source = candidate.source.trim();
    if (!source || seen.has(source)) return;
    seen.add(source);
    candidates.push({ ...candidate, source });
  };

  const currentRemote = block.remoteSources?.find((item) => item.url === block.source);
  add({
    source: block.source,
    label: currentRemote?.hostName || (currentRemote ? "当前图床" : "当前图片"),
    hostId: currentRemote?.hostId,
    hostName: currentRemote?.hostName,
    kind: "current"
  });
  const remotes = block.remoteSources ?? [];
  const currentIndex = remotes.findIndex((item) => item.url === block.source);
  const orderedRemotes = currentIndex >= 0
    ? [...remotes.slice(currentIndex + 1), ...remotes.slice(0, currentIndex)]
    : remotes;
  for (const remote of orderedRemotes) {
    add({
      source: remote.url,
      label: remote.hostName || "备用图床",
      hostId: remote.hostId,
      hostName: remote.hostName,
      kind: "remote"
    });
  }
  if (includeLocal && block.localSource) {
    add({ source: block.localSource, label: "本地副本", kind: "local" });
  }
  return candidates;
}

/**
 * 执行“node content blocks”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 按当前规则构建的集合结果。
 */
export function nodeContentBlocks(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): MindMapContentBlock[] {
  if (Array.isArray(node.content) && node.content.length) {
    const normalized = node.content.map(normalizeContentBlock).filter((block): block is MindMapContentBlock => Boolean(block));
    if (normalized.length) return normalized;
  }
  const blocks: MindMapContentBlock[] = [];
  if (node.image?.trim()) blocks.push({ id: newId(), type: "image", source: node.image.trim(), alt: node.text || undefined });
  if (node.text || node.richText?.length) {
    const richText = normalizeRichText(node.richText, node.text);
    blocks.push({ id: newId(), type: "text", text: richTextPlainText(richText, node.text), richText });
  }
  return blocks;
}

/**
 * 执行“node plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function nodePlainText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string {
  const blocks = nodeContentBlocks(node);
  return blocks.filter((block): block is MindMapTextContentBlock => block.type === "text").map((block) => block.text).join(" ").trim();
}

/**
 * 执行“node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function nodePrimaryText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string {
  const first = nodeContentBlocks(node).find((block): block is MindMapTextContentBlock => block.type === "text");
  return first?.text.trim() ?? "";
}

/**
 * 将新的有序 content 内容块同步回 text、richText 和 image 等旧字段。该桥接保证旧版本插件、旧导出逻辑和新内容块模型能够同时工作。
 *
 * @param node 当前处理的节点。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function syncNodeLegacyFields(node: MindMapNode): void {
  const blocks = nodeContentBlocks(node);
  node.content = blocks.length ? blocks : undefined;
  const textBlocks = blocks.filter((block): block is MindMapTextContentBlock => block.type === "text");
  const imageBlocks = blocks.filter((block): block is MindMapImageContentBlock => block.type === "image");
  node.text = textBlocks.map((block) => block.text).join(" ").trim();
  node.richText = textBlocks.length === 1 ? normalizeRichText(textBlocks[0]?.richText, textBlocks[0]?.text ?? "") : undefined;
  node.image = imageBlocks[0]?.source;
}


/**
 * 校验并规范化cell，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalizeCell(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 2000) : String(value ?? "").trim().slice(0, 2000);
}

/**
 * 校验并规范化table，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeTable(input: Partial<MindMapTable> | undefined): MindMapTable | undefined {
  if (!input || !Array.isArray(input.headers)) return undefined;
  const headers = input.headers.map(normalizeCell).slice(0, 12);
  if (!headers.length) return undefined;
  const rows = Array.isArray(input.rows)
    ? input.rows.slice(0, 100).map((row) => {
      const values = Array.isArray(row) ? row.map(normalizeCell).slice(0, headers.length) : [];
      while (values.length < headers.length) values.push("");
      return values;
    })
    : [];
  const alignments = Array.isArray(input.alignments)
    ? input.alignments.slice(0, headers.length).map((value) => value === "center" || value === "right" ? value : "left")
    : undefined;
  const source = input.source === "markdown" || input.source === "children" ? input.source : "manual";
  return { headers, rows, alignments, source };
}

/**
 * 校验并规范化code，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeCode(input: Partial<MindMapCodeBlock> | undefined): MindMapCodeBlock | undefined {
  if (!input || typeof input.code !== "string" || !input.code.trim()) return undefined;
  const language = typeof input.language === "string" && input.language.trim()
    ? input.language.trim().replace(/[^a-z0-9_+#.-]/gi, "").slice(0, 40)
    : undefined;
  return { language, code: input.code.replace(/\r\n/g, "\n").slice(0, 100000) };
}

/**
 * 校验并规范化submap，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeSubmap(input: Partial<MindMapSubmap> | undefined): MindMapSubmap | undefined {
  if (!input || typeof input.path !== "string" || !input.path.trim()) return undefined;
  return {
    path: input.path.trim().slice(0, 500),
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim().slice(0, 200) : undefined
  };
}

/**
 * 校验并规范化navigation，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeNavigation(input: Partial<MindMapNavigation> | undefined): MindMapNavigation | undefined {
  if (!input || typeof input.parentPath !== "string" || !input.parentPath.trim()) return undefined;
  return {
    parentPath: input.parentPath.trim().slice(0, 500),
    parentNodeId: typeof input.parentNodeId === "string" && input.parentNodeId.trim() ? input.parentNodeId.trim().slice(0, 160) : undefined,
    parentTitle: typeof input.parentTitle === "string" && input.parentTitle.trim() ? input.parentTitle.trim().slice(0, 200) : undefined,
    parentNodeText: typeof input.parentNodeText === "string" && input.parentNodeText.trim() ? input.parentNodeText.trim().slice(0, 200) : undefined
  };
}

/**
 * 校验并规范化task，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeTask(value: unknown): TaskStatus | undefined {
  return value === "todo" || value === "doing" || value === "done" ? value : undefined;
}

/**
 * 校验并规范化tags，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalizeTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const tags = Array.from(new Set(value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean)))
    .slice(0, 12);
  return tags.length ? tags : undefined;
}

/**
 * 校验并规范化node，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @param fallbackText 该参数用于 normalize node 流程中的输入或控制。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeNode(input: Partial<MindMapNode> | undefined, fallbackText: string): MindMapNode {
  const fallbackNodeText = typeof input?.text === "string" ? input.text : fallbackText;
  const normalizedContent = Array.isArray(input?.content)
    ? input.content.map(normalizeContentBlock).filter((block): block is MindMapContentBlock => Boolean(block))
    : [];
  if (!normalizedContent.length) {
    if (typeof input?.image === "string" && input.image.trim()) {
      normalizedContent.push({ id: newId(), type: "image", source: input.image.trim(), alt: fallbackNodeText || undefined });
    }
    const richText = normalizeRichText(input?.richText, fallbackNodeText);
    const text = richTextPlainText(richText, fallbackNodeText);
    if (text) normalizedContent.push({ id: newId(), type: "text", text, richText });
  }
  const textBlocks = normalizedContent.filter((block): block is MindMapTextContentBlock => block.type === "text");
  const imageBlocks = normalizedContent.filter((block): block is MindMapImageContentBlock => block.type === "image");
  const text = textBlocks.map((block) => block.text).join(" ").trim();
  return {
    id: typeof input?.id === "string" && input.id ? input.id : newId(),
    text,
    richText: textBlocks.length === 1 ? textBlocks[0]?.richText : undefined,
    content: normalizedContent.length ? normalizedContent : undefined,
    note: typeof input?.note === "string" && input.note.trim() ? input.note.trim() : undefined,
    link: typeof input?.link === "string" && input.link.trim() ? input.link.trim() : undefined,
    image: imageBlocks[0]?.source,
    table: normalizeTable(input?.table),
    code: normalizeCode(input?.code),
    submap: normalizeSubmap(input?.submap),
    icon: typeof input?.icon === "string" && input.icon.trim() ? input.icon.trim().slice(0, 12) : undefined,
    tags: normalizeTags(input?.tags),
    task: normalizeTask(input?.task),
    skipArticleNumbering: input?.skipArticleNumbering === true || undefined,
    style: normalizeStyle(input?.style),
    collapsed: input?.collapsed === true || undefined,
    children: Array.isArray(input?.children)
      ? input.children.map((child, index) => normalizeNode(child, `节点 ${index + 1}`))
      : []
  };
}

/**
 * 校验并规范化document view，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeDocumentView(input: Partial<MindMapDocumentView> | undefined): MindMapDocumentView | undefined {
  if (!input) return undefined;
  const mode: DisplayMode | undefined = input.mode === "outline" || input.mode === "article" || input.mode === "mindmap"
    ? input.mode
    : undefined;
  const readOnly = input.readOnly === true ? true : input.readOnly === false ? false : undefined;
  const articleLandingMode: ArticleLandingMode | undefined = input.articleLandingMode === "toc"
    ? "toc"
    : input.articleLandingMode === "article" || (input.articleLandingMode as string | undefined) === "map"
      ? "article"
      : undefined;
  return mode !== undefined || readOnly !== undefined || articleLandingMode !== undefined
    ? { mode, readOnly, articleLandingMode }
    : undefined;
}

/**
 * Normalizes per-document article presentation settings.
 *
 * @param input Untrusted serialized style data.
 * @returns A safe article style, or undefined when none is present.
 */
function normalizeArticleStyle(input: Partial<ArticleStyle> | undefined): ArticleStyle | undefined {
  if (!input) return undefined;
  const preset: ArticleStylePresetId = input.preset === "book" || input.preset === "modern" || input.preset === "minimal"
    ? input.preset
    : "classic";
  const color = (value: unknown): string | undefined => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
  const tocStyle = input.tocStyle === "plain" || input.tocStyle === "lines" ? input.tocStyle : input.tocStyle === "card" ? "card" : undefined;
  const fontSize = typeof input.fontSize === "number" ? Math.max(12, Math.min(24, input.fontSize)) : undefined;
  const lineHeight = typeof input.lineHeight === "number" ? Math.max(1.2, Math.min(2.4, input.lineHeight)) : undefined;
  return {
    preset,
    fontFamily: typeof input.fontFamily === "string" ? input.fontFamily.trim().slice(0, 120) || undefined : undefined,
    textColor: color(input.textColor),
    headingColor: color(input.headingColor),
    accentColor: color(input.accentColor),
    backgroundColor: color(input.backgroundColor),
    tocStyle,
    fontSize,
    lineHeight
  };
}

/**
 * 把任意版本或不完整的输入对象转换为当前版本的 MindMapDocument。该函数会递归规范化节点、外观、视图状态和兼容字段，并保证根节点、数组及必需标识始终存在。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function normalizeDocument(input: Partial<MindMapDocument> | undefined, fallbackTitle = "思维导图"): MindMapDocument {
  const title = typeof input?.title === "string" && input.title.trim() ? input.title.trim() : fallbackTitle;
  return {
    version: 10,
    title,
    layout: input?.layout === "balanced" ? "balanced" : "right",
    theme: input?.theme === "light" || input?.theme === "dark" ? input.theme : "auto",
    appearance: normalizeAppearance(input?.appearance),
    navigation: normalizeNavigation(input?.navigation),
    view: normalizeDocumentView(input?.view),
    articleStyle: normalizeArticleStyle(input?.articleStyle),
    root: normalizeNode(input?.root, title)
  };
}

/**
 * 在保存前再次规范化文档，并输出带缩进的稳定 JSON。这样可移除运行时临时值，同时保留可选兼容字段。
 *
 * @param doc 要处理或写回的思维导图文档。
 * @returns 计算、解析或序列化后的字符串结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function serializeDocument(doc: MindMapDocument): string {
  const normalized = normalizeDocument(doc, doc.title);
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

/**
 * 解析json document，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function parseJsonDocument(value: string, fallbackTitle: string): MindMapDocument | null {
  try {
    return normalizeDocument(JSON.parse(value) as Partial<MindMapDocument>, fallbackTitle);
  } catch {
    return null;
  }
}

/**
 * 执行“extract fenced json”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param source 待解析或渲染的原始文本。
 * @param language 该参数用于 extract fenced json 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function extractFencedJson(source: string, language: string): string | null {
  const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp("```" + escaped + "\\s*([\\s\\S]*?)```", "i"));
  return match?.[1]?.trim() ?? null;
}

/**
 * 解析磁盘中的 .mindmap 文本。优先识别当前原始 JSON 格式，同时兼容历史 Markdown 围栏 JSON；解析失败时返回包含回退标题的安全默认文档，避免视图崩溃。
 *
 * @param source 待解析或渲染的原始文本。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function parseDocument(source: string, fallbackTitle = "思维导图"): MindMapDocument {
  const trimmed = source.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const parsed = parseJsonDocument(trimmed, fallbackTitle);
    if (parsed) return parsed;
  }

  for (const language of [MINDMAP_CODE_BLOCK, ...LEGACY_CODE_BLOCKS]) {
    const fenced = extractFencedJson(source, language);
    if (!fenced) continue;
    const parsed = parseJsonDocument(fenced, fallbackTitle);
    if (parsed) return parsed;
  }

  return markdownToDocument(source, fallbackTitle);
}

/**
 * 执行“clone document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param doc 要处理或写回的思维导图文档。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function cloneDocument(doc: MindMapDocument): MindMapDocument {
  return JSON.parse(JSON.stringify(doc)) as MindMapDocument;
}

/**
 * 执行“clone node with fresh ids”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function cloneNodeWithFreshIds(node: MindMapNode): MindMapNode {
  const clone = JSON.parse(JSON.stringify(node)) as MindMapNode;
  walkNodes(clone, (current) => {
    current.id = newId();
  });
  return clone;
}

/**
 * 递归遍历nodes，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @param visitor 该参数用于 walk nodes 流程中的输入或控制。
 */
export function walkNodes(root: MindMapNode, visitor: (node: MindMapNode, parent: MindMapNode | null) => void): void {
  const visit = (node: MindMapNode, parent: MindMapNode | null): void => {
    visitor(node, parent);
    node.children.forEach((child) => visit(child, node));
  };
  visit(root, null);
}

/**
 * 展平nodes，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @returns 按当前规则构建的集合结果。
 */
export function flattenNodes(root: MindMapNode): MindMapNode[] {
  const nodes: MindMapNode[] = [];
  walkNodes(root, (node) => nodes.push(node));
  return nodes;
}

/**
 * 查找node，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @param id 目标对象或节点的稳定标识。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function findNode(root: MindMapNode, id: string): MindMapNode | null {
  let result: MindMapNode | null = null;
  walkNodes(root, (node) => {
    if (node.id === id) result = node;
  });
  return result;
}

/**
 * 查找parent，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @param id 目标对象或节点的稳定标识。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function findParent(root: MindMapNode, id: string): MindMapNode | null {
  let result: MindMapNode | null = null;
  walkNodes(root, (node, parent) => {
    if (node.id === id) result = parent;
  });
  return result;
}

/**
 * 查找ancestors，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @param id 目标对象或节点的稳定标识。
 * @returns 按当前规则构建的集合结果。
 */
export function findAncestors(root: MindMapNode, id: string): MindMapNode[] {
  const path: MindMapNode[] = [];
  const visit = (node: MindMapNode): boolean => {
    if (node.id === id) return true;
    for (const child of node.children) {
      path.push(node);
      if (visit(child)) return true;
      path.pop();
    }
    return false;
  };
  return visit(root) ? path : [];
}

/**
 * 判断node，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @param id 目标对象或节点的稳定标识。
 * @returns 操作条件是否成立或处理是否成功。
 */
export function containsNode(root: MindMapNode, id: string): boolean {
  return findNode(root, id) !== null;
}

/**
 * 删除node，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @param id 目标对象或节点的稳定标识。
 * @returns 操作条件是否成立或处理是否成功。
 */
export function removeNode(root: MindMapNode, id: string): boolean {
  for (let index = 0; index < root.children.length; index += 1) {
    if (root.children[index]?.id === id) {
      root.children.splice(index, 1);
      return true;
    }
    const child = root.children[index];
    if (child && removeNode(child, id)) return true;
  }
  return false;
}

/** 可用于节点拖放的目标位置。 */
export type NodeDropPosition = "before" | "child" | "after";

/**
 * 将节点移动到目标节点之前、之后或目标节点内部。
 *
 * @param root 节点树的根节点。
 * @param draggedId 被移动节点的稳定标识。
 * @param targetId 接收拖放的目标节点标识。
 * @param position 相对目标节点的插入位置。
 * @returns 实际发生结构变更时返回 true；非法移动或无变化时返回 false。
 * @remarks 该函数只修改传入节点树，不负责撤销栈、保存或界面重渲染。调用方应在统一编辑事务中执行。
 */
export function moveNodeRelative(root: MindMapNode, draggedId: string, targetId: string, position: NodeDropPosition): boolean {
  if (draggedId === root.id || draggedId === targetId) return false;
  const dragged = findNode(root, draggedId);
  const target = findNode(root, targetId);
  if (!dragged || !target || containsNode(dragged, targetId)) return false;

  const oldParent = findParent(root, draggedId);
  if (!oldParent) return false;
  const oldIndex = oldParent.children.findIndex((child) => child.id === draggedId);
  if (oldIndex < 0) return false;

  if (position === "child") {
    if (oldParent.id === target.id && oldIndex === target.children.length - 1) return false;
    oldParent.children.splice(oldIndex, 1);
    target.children.push(dragged);
    target.collapsed = false;
    return true;
  }

  if (target.id === root.id) return false;
  const targetParent = findParent(root, targetId);
  if (!targetParent) return false;
  const targetIndexBeforeRemoval = targetParent.children.findIndex((child) => child.id === targetId);
  if (targetIndexBeforeRemoval < 0) return false;

  let insertIndex = targetIndexBeforeRemoval + (position === "after" ? 1 : 0);
  if (oldParent.id === targetParent.id) {
    const currentDesiredIndex = position === "after" ? targetIndexBeforeRemoval + 1 : targetIndexBeforeRemoval;
    if (oldIndex === currentDesiredIndex || (position === "after" && oldIndex === targetIndexBeforeRemoval + 1)) return false;
    if (oldIndex < insertIndex) insertIndex -= 1;
  }

  oldParent.children.splice(oldIndex, 1);
  targetParent.children.splice(insertIndex, 0, dragged);
  return true;
}

/**
 * 遍历并收集wiki links，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function collectWikiLinks(root: MindMapNode): Set<string> {
  const links = new Set<string>();
  const pattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  walkNodes(root, (node) => {
    const values = [nodePlainText(node), node.note ?? "", node.link ?? "", ...nodeContentBlocks(node).filter((block): block is MindMapImageContentBlock => block.type === "image").map((block) => block.source), node.submap?.path ?? ""];
    for (const value of values) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(value)) !== null) {
        if (match[1]) links.add(match[1].trim());
      }
      pattern.lastIndex = 0;
    }
    const explicitLink = node.link?.trim();
    if (explicitLink && !/^https?:\/\//i.test(explicitLink) && !explicitLink.includes("[[")) {
      const target = explicitLink.split("|")[0]?.split("#")[0]?.trim();
      if (target) links.add(target);
    }
  });
  return links;
}

/**
 * 执行“extract first wiki link”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function extractFirstWikiLink(value: string): string | null {
  const match = value.match(/\[\[([^\]|#]+(?:#[^\]|]+)?)(?:\|[^\]]+)?\]\]/);
  return match?.[1]?.trim() ?? null;
}

/**
 * 读取并返回task progress，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function getTaskProgress(root: MindMapNode): TaskProgress {
  let done = 0;
  let total = 0;
  walkNodes(root, (node) => {
    if (!node.task) return;
    total += 1;
    if (node.task === "done") done += 1;
  });
  return { done, total };
}

/**
 * 执行“node search text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function nodeSearchText(node: MindMapNode): string {
  return [nodePlainText(node), node.note, node.link, ...nodeContentBlocks(node).map((block) => block.type === "image" ? `${block.source} ${block.alt ?? ""}` : block.text), node.icon, node.submap?.path, node.code?.language, node.code?.code, ...(node.table?.headers ?? []), ...(node.table?.rows.flat() ?? []), ...(node.tags ?? [])]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase();
}

/**
 * 执行“task prefix”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param task 该参数用于 task prefix 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function taskPrefix(task: TaskStatus | undefined): string {
  if (task === "done") return "[x] ";
  if (task === "doing") return "[-] ";
  if (task === "todo") return "[ ] ";
  return "";
}

/**
 * 转义inline markdown，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function escapeInlineMarkdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]<>])/g, "\\$1");
}

/**
 * 执行“rich text to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 该参数用于 rich text to markdown 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function richTextToMarkdown(runs: MindMapTextRun[] | undefined, fallbackText: string): string {
  if (!runs?.length) return escapeInlineMarkdown(fallbackText);
  return runs.map((run) => {
    let value = escapeInlineMarkdown(run.text);
    const style = run.style;
    if (!style) return value;
    if (style.bold) value = `**${value}**`;
    if (style.italic) value = `*${value}*`;
    if (style.strike) value = `~~${value}~~`;
    if (style.underline) value = `<u>${value}</u>`;
    if (style.color) value = `<span style="color:${style.color}">${value}</span>`;
    return value;
  }).join("");
}

/**
 * 执行“table to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param table 待编辑、转换或导出的表格数据。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function tableToMarkdown(table: MindMapTable): string {
  const escapeCell = (value: string): string => value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
  const headers = `| ${table.headers.map(escapeCell).join(" | ")} |`;
  const alignments = table.headers.map((_, index) => {
    const alignment = table.alignments?.[index] ?? "left";
    return alignment === "center" ? ":---:" : alignment === "right" ? "---:" : "---";
  });
  const separator = `| ${alignments.join(" | ")} |`;
  const rows = table.rows.map((row) => `| ${table.headers.map((_, index) => escapeCell(row[index] ?? "")).join(" | ")} |`);
  return [headers, separator, ...rows].join("\n");
}

/**
 * 执行“split markdown table row”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param line 该参数用于 split markdown table row 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function splitMarkdownTableRow(line: string): string[] {
  const value = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (const char of value) {
    if (escaped) { current += char; escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (char === "|") { cells.push(current.trim().replaceAll("<br>", "\n")); current = ""; continue; }
    current += char;
  }
  cells.push(current.trim().replaceAll("<br>", "\n"));
  return cells;
}

/**
 * 解析markdown table，并保持模型、界面和持久化状态的一致性。
 *
 * @param markdown 待解析或生成的 Markdown 文本。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function parseMarkdownTable(markdown: string): MindMapTable | null {
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = lines[index]?.trim() ?? "";
    const separatorLine = lines[index + 1]?.trim() ?? "";
    if (!headerLine.includes("|") || !separatorLine.includes("|")) continue;
    const headers = splitMarkdownTableRow(headerLine);
    const separators = splitMarkdownTableRow(separatorLine);
    if (!headers.length || separators.length !== headers.length || !separators.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))) continue;
    const alignments: TableAlignment[] = separators.map((cell) => {
      const compact = cell.replace(/\s/g, "");
      if (compact.startsWith(":") && compact.endsWith(":")) return "center";
      if (compact.endsWith(":")) return "right";
      return "left";
    });
    const rows: string[][] = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const rowLine = lines[rowIndex]?.trim() ?? "";
      if (!rowLine || !rowLine.includes("|")) break;
      const row = splitMarkdownTableRow(rowLine).slice(0, headers.length);
      while (row.length < headers.length) row.push("");
      rows.push(row);
    }
    return normalizeTable({ headers, rows, alignments, source: "markdown" }) ?? null;
  }
  return null;
}

/**
 * 解析fenced code，并保持模型、界面和持久化状态的一致性。
 *
 * @param markdown 待解析或生成的 Markdown 文本。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function parseFencedCode(markdown: string): MindMapCodeBlock | null {
  const match = markdown.match(/```([^\n`]*)\n([\s\S]*?)\n```/);
  if (!match) return null;
  return normalizeCode({ language: match[1]?.trim(), code: match[2] ?? "" }) ?? null;
}

/**
 * 执行“children to table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function childrenToTable(node: MindMapNode): MindMapTable | null {
  if (!node.children.length) return null;
  return {
    headers: ["子节点", "备注", "状态", "标签", "下级数量"],
    rows: node.children.map((child) => [
      nodePlainText(child),
      child.note ?? "",
      child.task === "done" ? "已完成" : child.task === "doing" ? "进行中" : child.task === "todo" ? "待办" : "",
      child.tags?.join(", ") ?? "",
      String(child.children.length)
    ]),
    alignments: ["left", "left", "center", "left", "right"],
    source: "children"
  };
}

/**
 * 执行“document to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param doc 要处理或写回的思维导图文档。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function documentToMarkdown(doc: MindMapDocument): string {
  const renderBlocks = (node: MindMapNode): string[] => {
    const result: string[] = [];
    for (const block of nodeContentBlocks(node)) {
      if (block.type === "text") {
        const value = richTextToMarkdown(block.richText, block.text);
        if (value) result.push(value);
      } else {
        result.push(`![${escapeInlineMarkdown(block.alt ?? "图片")}](${block.source})`);
      }
    }
    return result;
  };
  const rootBlocks = renderBlocks(doc.root);
  const rootTitle = rootBlocks.find((value) => !value.startsWith("![")) ?? doc.title;
  const rootSuffix = doc.root.tags?.length ? ` ${doc.root.tags.map((tag) => `#${tag}`).join(" ")}` : "";
  const lines: string[] = [`# ${doc.root.icon ? `${doc.root.icon} ` : ""}${rootTitle}${rootSuffix}`];
  rootBlocks.filter((value) => value !== rootTitle).forEach((value) => lines.push(value));
  const visit = (node: MindMapNode, depth: number): void => {
    const indent = "  ".repeat(Math.max(0, depth - 1));
    const tags = node.tags?.length ? ` ${node.tags.map((tag) => `#${tag}`).join(" ")}` : "";
    const link = node.link ? ` → ${node.link}` : "";
    const blocks = renderBlocks(node);
    const firstText = blocks.find((value) => !value.startsWith("![")) ?? (blocks[0] ?? "图片节点");
    lines.push(`${indent}- ${taskPrefix(node.task)}${node.icon ? `${node.icon} ` : ""}${firstText}${tags}${link}`);
    blocks.filter((value) => value !== firstText).forEach((value) => lines.push(`${indent}  ${value}`));
    if (node.note) lines.push(`${indent}  > ${node.note.replaceAll("\n", " ")}`);
    if (node.submap) lines.push(`${indent}  > 子导图：[[${node.submap.path}]]`);
    if (node.table) lines.push("", ...tableToMarkdown(node.table).split("\n").map((line) => `${indent}  ${line}`), "");
    if (node.code) lines.push(`${indent}  \`\`\`${node.code.language ?? ""}`, ...node.code.code.split("\n").map((line) => `${indent}  ${line}`), `${indent}  \`\`\``);
    node.children.forEach((child) => visit(child, depth + 1));
  };
  doc.root.children.forEach((child) => visit(child, 1));
  return lines.join("\n");
}

/**
 * 解析task text，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function parseTaskText(value: string): { text: string; task?: TaskStatus } {
  const match = value.match(/^\[( |x|X|-)\]\s+(.+)$/);
  if (!match) return { text: value };
  const marker = match[1];
  const task: TaskStatus = marker === "x" || marker === "X" ? "done" : marker === "-" ? "doing" : "todo";
  return { text: match[2]?.trim() || "任务", task };
}

/**
 * 执行“markdown to document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param markdown 待解析或生成的 Markdown 文本。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function markdownToDocument(markdown: string, fallbackTitle = "思维导图"): MindMapDocument {
  const doc = createDefaultDocument(fallbackTitle);
  doc.root.children = [];
  const stack: Array<{ level: number; node: MindMapNode }> = [{ level: 0, node: doc.root }];
  let rootAssigned = false;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("---") || line.trimStart().startsWith("```") || /^\s*>/.test(line)) continue;

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    const bullet = line.match(/^(\s*)[-*+]\s+(.+?)\s*$/);
    const numbered = line.match(/^(\s*)\d+[.)]\s+(.+?)\s*$/);

    if (heading) {
      const level = heading[1]?.length ?? 1;
      const text = heading[2]?.trim() ?? "节点";
      if (level === 1 && !rootAssigned) {
        doc.root.text = text;
        doc.title = text;
        rootAssigned = true;
        stack.length = 1;
      } else {
        const node = createNode(text);
        while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level) stack.pop();
        const parent = stack.at(-1)?.node ?? doc.root;
        parent.children.push(node);
        stack.push({ level, node });
      }
      continue;
    }

    const listMatch = bullet ?? numbered;
    if (listMatch) {
      const spaces = (listMatch[1] ?? "").replaceAll("\t", "  ").length;
      const level = Math.floor(spaces / 2) + 2;
      const parsed = parseTaskText((listMatch[2] ?? "节点").trim());
      const node = createNode(parsed.text);
      node.task = parsed.task;
      while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level) stack.pop();
      const parent = stack.at(-1)?.node ?? doc.root;
      parent.children.push(node);
      stack.push({ level, node });
    }
  }

  if (!doc.root.children.length) doc.root.children.push(createNode("主题 1"));
  return doc;
}

/**
 * Converts tab- or space-indented outline text (including XMind clipboard
 * fallback text) into Markdown while preserving its hierarchy.
 *
 * @param text Plain outline text.
 * @returns Nested Markdown suitable for `markdownToDocument`.
 */
export function indentedTextToMarkdown(text: string): string {
  const lines = text.split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^([ \t]*)(.*?)\s*$/);
      const whitespace = (match?.[1] ?? "").replaceAll("\t", "    ").length;
      return { indent: whitespace, text: match?.[2]?.trim() ?? "" };
    })
    .filter((line) => line.text);
  if (!lines.length) return "";

  const indentationLevels = Array.from(new Set(lines.map((line) => line.indent))).sort((a, b) => a - b);
  const levelOf = (indent: number): number => Math.max(0, indentationLevels.indexOf(indent));
  const hasHierarchy = lines.slice(1).some((line) => levelOf(line.indent) > levelOf(lines[0]!.indent));

  return lines.map((line, index) => {
    const level = levelOf(line.indent);
    if (index === 0 && hasHierarchy) return `# ${line.text}`;
    const adjustedLevel = hasHierarchy ? Math.max(0, level - levelOf(lines[0]!.indent) - 1) : level;
    return `${"  ".repeat(adjustedLevel)}- ${line.text}`;
  }).join("\n");
}
