/**
 * @file model.ts
 * @description 核心领域模型与序列化层。
 *
 * 定义 .mindmap 稳定数据结构，并负责字段规范化、富文本、内容块、节点树、Markdown 导入导出及图片镜像候选源排序。
 */

import { findNode, walkNodes } from "./node-tree";
export {
  containsNode,
  findAncestors,
  findNode,
  findParent,
  flattenNodes,
  moveNodeRelative,
  removeNode,
  walkNodes
} from "./node-tree";
export type { NodeDropPosition } from "./node-tree";

/**
 * LayoutMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type LayoutMode = "right" | "balanced";
/**
 * DisplayMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type DisplayMode = "mindmap" | "outline" | "article" | "reading" | "question-bank";
/** Top-level article landing content. */
export type ArticleLandingMode = "toc" | "article";
/** Per-node article numbering override; undefined keeps automatic behavior. */
export type ArticleNumberingMode = "none" | "manual";
/** Numbering style used when terminal body siblings are converted into generated markers. */
export type ArticleLeafNumberingStyle = "next-level" | "circled";
/** Built-in reading-presentation presets shared by article and continuous-reading modes. */
export type ArticleStylePresetId = "classic" | "book" | "modern" | "minimal";
/** Directory presentation saved per document and shared by article-family views. */
export type ArticleTocStyle = "card" | "plain" | "lines" | "original" | "minimal-page" | "report" | "magazine" | "tree";
/** Per-document reading-style overrides shared by article and continuous-reading modes. */
export interface ArticleStyle {
  preset: ArticleStylePresetId;
  fontFamily?: string;
  textColor?: string;
  headingColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  tocStyle?: ArticleTocStyle;
  fontSize?: number;
  lineHeight?: number;
  /** Per-page override for whether terminal body markers are displayed. */
  leafMarkerEnabled?: boolean;
  /** Per-page terminal body marker shape. */
  leafMarkerStyle?: "solid" | "hollow" | "square" | "dash";
  /** Per-page terminal body marker color; empty follows the accent color. */
  leafMarkerColor?: string;
  /** Per-page terminal body alignment; undefined follows the plugin default. */
  leafTextAlignment?: "flush" | "auto";
  /** Per-page override for terminal body numbering conversion. */
  leafNumberingEnabled?: boolean;
  /** Per-page numbering style for converted terminal body siblings. */
  leafNumberingStyle?: ArticleLeafNumberingStyle;
  /** Per-page threshold for terminal body numbering conversion. */
  leafNumberingThreshold?: number;
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
/** Legacy task-state values kept only so old files continue to parse without data loss. */
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
/** Per-text-block paragraph indentation used by article and reading modes. */
export type ArticleParagraphIndent = "first-line" | "none";

/**
 * MindMapTextStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  color?: string;
  /** Markdown 或编辑器识别出的安全超链接地址。 */
  link?: string;
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
  /** Persisted pixel widths for columns, in header order. */
  columnWidths?: number[];
  source?: "manual" | "markdown" | "children";
}

/**
 * MindMapCodeBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapCodeBlock {
  language?: string;
  code: string;
  collapsed?: boolean;
  showLineNumbers?: boolean;
  theme?: "obsidian" | "github" | "monokai" | "dracula";
}

/**
 * MindMapTextContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapTextContentBlock {
  id: string;
  type: "text";
  text: string;
  richText?: MindMapTextRun[];
  /** Undefined follows the article default (two-character first-line indent). */
  paragraphIndent?: ArticleParagraphIndent;
}

/**
 * MindMapImageRemoteSource 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapImageRemoteSource {
  hostId: string;
  hostName?: string;
  url: string;
  /** Optional host-specific deletion token returned by the upload API. */
  deleteKey?: string;
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
  /** Horizontal alignment shared by mind-map, outline, article, and reading renderers. */
  align?: "left" | "center" | "right";
  /** Optional rendered image width in pixels. Omitted values use the view default. */
  width?: number;
  /** Optional rendered image height in pixels. Omitted values preserve the image ratio. */
  height?: number;
  /** Inline images share a row with adjacent inline images; block images occupy their own row. */
  layout?: "inline" | "block";
  /** SHA-256 of the original image bytes, used for upload deduplication and safe remote cleanup. */
  contentHash?: string;
  /** Original local vault path retained until every selected image host succeeds. */
  localSource?: string;
  /** Mirror URLs returned by one or more configured image hosts. */
  remoteSources?: MindMapImageRemoteSource[];
}

/**
 * 后台图床上传完成后写回图片块的最小补丁。
 *
 * 只按稳定的节点和内容块 ID 合并图片字段，避免网络请求完成后用旧文档快照
 * 覆盖用户在上传期间继续进行的节点编辑。
 */
export interface MindMapImageUploadPatch {
  nodeId: string;
  blockId: string;
  localPath?: string;
  contentHash?: string;
  remoteSources?: MindMapImageRemoteSource[];
  preferredSource?: string;
  clearLocalSource?: boolean;
}

/** A movable table block stored alongside text and images. */
export interface MindMapTableContentBlock {
  id: string;
  type: "table";
  table: MindMapTable;
}

/** A movable code block stored alongside text, images, and tables. */
export interface MindMapCodeContentBlock {
  id: string;
  type: "code";
  code: MindMapCodeBlock;
}

/**
 * MindMapContentBlock 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type MindMapContentBlock = MindMapTextContentBlock | MindMapImageContentBlock | MindMapTableContentBlock | MindMapCodeContentBlock;

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
  /** Per-page code display overrides; undefined follows the global code settings. */
  codeCollapsed?: boolean;
  codeShowLineNumbers?: boolean;
  codeTheme?: "obsidian" | "github" | "monokai" | "dracula";
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

/** A structured question can be a choice, true-or-false, or long-form exercise. */
export type MindMapQuestionMode = "choice" | "judgment" | "essay";

/** Learning state used by question-bank filtering and review workflows. */
export type MindMapQuestionStatus = "unanswered" | "completed" | "favorite" | "wrong" | "mastered";

/** A selectable answer item in a structured question. */
export interface MindMapQuestionOption {
  id: string;
  label: string;
  content: MindMapContentBlock[];
}

/** Verifiable provenance for an original question found by an AI-assisted lookup. */
export interface MindMapQuestionSource {
  title: string;
  url: string;
  matchedAt: string;
}

/** Persisted question content attached to a mind-map node. */
export interface MindMapQuestion {
  mode: MindMapQuestionMode;
  stem: MindMapContentBlock[];
  options: MindMapQuestionOption[];
  answer: MindMapContentBlock[];
  explanation: MindMapContentBlock[];
  tags: string[];
  source?: MindMapQuestionSource;
  status: MindMapQuestionStatus;
  attemptCount: number;
  correctCount: number;
  lastPracticedAt?: string;
}

/**
 * MindMapNode 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapNode {
  id: string;
  text: string;
  richText?: MindMapTextRun[];
  /** Ordered text and image blocks. */
  content?: MindMapContentBlock[];
  note?: string;
  link?: string;
  image?: string;
  table?: MindMapTable;
  code?: MindMapCodeBlock;
  submap?: MindMapSubmap;
  icon?: string;
  tags?: string[];
  /** Optional structured exercise content; the node's primary content mirrors its stem. */
  question?: MindMapQuestion;
  /** Legacy compatibility only; current UI and exports ignore task state. */
  task?: TaskStatus;
  /** Disable numbering or force a manually selected article level; undefined keeps automatic behavior. */
  articleNumberingMode?: ArticleNumberingMode;
  /** Manual article level from 1 to 8. It is only active when articleNumberingMode is manual. */
  articleNumberingLevel?: number;
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
  /** Per-document article/reading directory depth override; undefined follows the plugin setting. */
  articleTocMaxDepth?: number;
  /** Per-document article/reading minimap override; undefined follows the plugin setting. */
  articleMiniMap?: boolean;
  zoom?: number;
  panX?: number;
  panY?: number;
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

const MINDMAP_CODE_BLOCK = "mindmap-json";

/**
 * 执行“new id”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function newId(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const random = array[0].toString(36);
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

/** Creates the standard options used by choice and true-or-false questions. */
function createQuestionOptions(mode: MindMapQuestionMode): MindMapQuestionOption[] {
  const labels = mode === "judgment" ? ["正确", "错误"] : mode === "choice" ? ["A", "B", "C", "D"] : [];
  return labels.map((label) => ({ id: newId(), label, content: [{ id: newId(), type: "text", text: label }] }));
}

/** Creates an editable structured question with a text block for every field. */
export function createMindMapQuestion(mode: MindMapQuestionMode = "choice"): MindMapQuestion {
  return {
    mode,
    stem: [{ id: newId(), type: "text", text: "" }],
    options: createQuestionOptions(mode),
    answer: [{ id: newId(), type: "text", text: mode === "judgment" ? "正确" : "" }],
    explanation: [{ id: newId(), type: "text", text: "" }],
    tags: [],
    source: undefined,
    status: "unanswered",
    attemptCount: 0,
    correctCount: 0,
    lastPracticedAt: undefined
  };
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
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeAppearance(input: Partial<MindMapAppearance> | undefined): MindMapAppearance | undefined {
  if (!input) return undefined;
  const rawNodeVisualStyle = String(input.nodeVisualStyle ?? "");
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
      : rawNodeVisualStyle === "branch"
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
    underline: normalizeBooleanOverride(input.underline),
    codeCollapsed: normalizeBooleanOverride(input.codeCollapsed),
    codeShowLineNumbers: normalizeBooleanOverride(input.codeShowLineNumbers),
    codeTheme: input.codeTheme === "github" || input.codeTheme === "monokai" || input.codeTheme === "dracula" || input.codeTheme === "obsidian"
      ? input.codeTheme
      : undefined
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
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
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
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeTextStyle(input: Partial<MindMapTextStyle> | undefined): MindMapTextStyle | undefined {
  if (!input) return undefined;
  const style: MindMapTextStyle = {
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline),
    strike: normalizeBooleanOverride(input.strike),
    code: normalizeBooleanOverride(input.code),
    color: normalizeColor(input.color),
    link: normalizeLinkTarget(input.link)
  };
  return Object.values(style).some((value) => value !== undefined) ? style : undefined;
}

/** Keeps only link schemes that can be safely rendered as a clickable anchor. */
function normalizeLinkTarget(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;
  const value = input.trim();
  if (!value || value.length > 2048 || value.startsWith("#")) return undefined;
  try {
    const protocol = new URL(value).protocol.toLowerCase();
    return ["http:", "https:", "mailto:", "obsidian:"].includes(protocol) ? value : undefined;
  } catch {
    return undefined;
  }
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
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
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
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeContentBlock(input: unknown): MindMapContentBlock | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<MindMapContentBlock>;
  const id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : newId();
  if (candidate.type === "table") {
    const table = normalizeTable((candidate as Partial<MindMapTableContentBlock>).table);
    return table ? { id, type: "table", table } : null;
  }
  if (candidate.type === "code") {
    const code = normalizeCode((candidate as Partial<MindMapCodeContentBlock>).code);
    return code ? { id, type: "code", code } : null;
  }
  if (candidate.type === "image") {
    const image = candidate as Partial<MindMapImageContentBlock>;
    const source = typeof image.source === "string" ? image.source.trim().slice(0, 2000) : "";
    if (!source) return null;
    const alt = typeof image.alt === "string" && image.alt.trim() ? image.alt.trim().slice(0, 500) : undefined;
    const width = typeof image.width === "number" && Number.isFinite(image.width)
      ? Math.max(20, Math.min(2000, Math.round(image.width)))
      : undefined;
    const height = typeof image.height === "number" && Number.isFinite(image.height)
      ? Math.max(20, Math.min(2000, Math.round(image.height)))
      : undefined;
    const align = image.align === "left" || image.align === "center" || image.align === "right"
      ? image.align
      : undefined;
    const layout = image.layout === "inline" ? "inline" : image.layout === "block" ? "block" : undefined;
    const contentHash = typeof image.contentHash === "string" && /^[0-9a-f]{64}$/i.test(image.contentHash.trim())
      ? image.contentHash.trim().toLowerCase()
      : undefined;
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
          deleteKey: typeof item.deleteKey === "string" && item.deleteKey.trim() ? item.deleteKey.trim().slice(0, 2000) : undefined,
          uploadedAt: typeof item.uploadedAt === "string" && item.uploadedAt.trim() ? item.uploadedAt.trim().slice(0, 80) : undefined,
          lastSuccessAt: typeof item.lastSuccessAt === "string" && item.lastSuccessAt.trim() ? item.lastSuccessAt.trim().slice(0, 80) : undefined,
          lastFailureAt: typeof item.lastFailureAt === "string" && item.lastFailureAt.trim() ? item.lastFailureAt.trim().slice(0, 80) : undefined,
          failureCount: typeof item.failureCount === "number" && Number.isFinite(item.failureCount)
            ? Math.max(0, Math.min(1000000, Math.floor(item.failureCount)))
            : undefined
        }];
      })
      : undefined;
    return { id, type: "image", source, alt, align, width, height, layout, contentHash, localSource, remoteSources: remoteSources?.length ? remoteSources : undefined };
  }
  if (candidate.type === "text") {
    const textCandidate = candidate as Partial<MindMapTextContentBlock>;
    const fallbackText = typeof textCandidate.text === "string" ? textCandidate.text.replace(/\r\n?/g, "\n").slice(0, 20000) : "";
    const { text, richText } = normalizeMarkdownRichText(textCandidate.richText, fallbackText);
    const paragraphIndent = textCandidate.paragraphIndent === "none" || textCandidate.paragraphIndent === "first-line"
      ? textCandidate.paragraphIndent
      : undefined;
    return { id, type: "text", text, richText, paragraphIndent };
  }
  return null;
}

/**
 * 为图片内容块构建有序、去重的加载候选列表。远程镜像按图床优先级排序，最后按设置选择本地地址，从而支持失效图床自动切换。
 *
 * @param block 当前内容块，通常是文字块或图片块。
 * @param includeLocal 是否把本地图片地址作为最终回退候选。
 * @param hostPriorityIds 图床 ID 优先级，越靠前越先尝试。
 * @returns 按当前规则构建的集合结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function imageSourceCandidates(block: MindMapImageContentBlock, includeLocal = true, hostPriorityIds: readonly string[] = []): MindMapImageSourceCandidate[] {
  const candidates: MindMapImageSourceCandidate[] = [];
  const seen = new Set<string>();
  const add = (candidate: MindMapImageSourceCandidate): void => {
    const source = candidate.source.trim();
    if (!source || seen.has(source)) return;
    seen.add(source);
    candidates.push({ ...candidate, source });
  };

  const priority = new Map(hostPriorityIds.map((id, index) => [id, index]));
  const remotes = block.remoteSources ?? [];
  const orderedRemotes = remotes
    .map((remote, index) => ({ remote, index }))
    .sort((left, right) => (priority.get(left.remote.hostId) ?? Number.MAX_SAFE_INTEGER) - (priority.get(right.remote.hostId) ?? Number.MAX_SAFE_INTEGER) || left.index - right.index)
    .map((item) => item.remote);
  for (const remote of orderedRemotes) {
    add({
      source: remote.url,
      label: remote.hostName || (remote.url === block.source ? "当前图床" : "备用图床"),
      hostId: remote.hostId,
      hostName: remote.hostName,
      kind: remote.url === block.source ? "current" : "remote"
    });
  }
  if (!remotes.some((item) => item.url === block.source) && block.source !== block.localSource) {
    add({ source: block.source, label: "当前图片", kind: "current" });
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
export function nodeContentBlocks(node: Pick<MindMapNode, "content" | "text" | "richText" | "image" | "table" | "code">): MindMapContentBlock[] {
  if (Array.isArray(node.content) && node.content.length) {
    const normalized = node.content.map(normalizeContentBlock).filter((block): block is MindMapContentBlock => Boolean(block));
    if (normalized.length) {
      if (node.table && !normalized.some((block) => block.type === "table")) normalized.push({ id: newId(), type: "table", table: normalizeTable(node.table) ?? node.table });
      if (node.code && !normalized.some((block) => block.type === "code")) normalized.push({ id: newId(), type: "code", code: normalizeCode(node.code) ?? node.code });
      return normalized;
    }
  }
  const blocks: MindMapContentBlock[] = [];
  if (node.image?.trim()) blocks.push({ id: newId(), type: "image", source: node.image.trim(), alt: node.text || undefined });
  if (node.text || node.richText?.length) {
    const { text, richText } = normalizeMarkdownRichText(node.richText, node.text);
    blocks.push({ id: newId(), type: "text", text, richText });
  }
  if (node.table) blocks.push({ id: newId(), type: "table", table: normalizeTable(node.table) ?? node.table });
  if (node.code) blocks.push({ id: newId(), type: "code", code: normalizeCode(node.code) ?? node.code });
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
 * 将有序内容块同步到节点的文本摘要、单段富文本和首张图片字段。
 *
 * @param node 当前处理的节点。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function syncNodeContentFields(node: MindMapNode): void {
  const blocks = nodeContentBlocks(node);
  node.content = blocks.length ? blocks : undefined;
  const textBlocks = blocks.filter((block): block is MindMapTextContentBlock => block.type === "text");
  const imageBlocks = blocks.filter((block): block is MindMapImageContentBlock => block.type === "image");
  const tableBlocks = blocks.filter((block): block is MindMapTableContentBlock => block.type === "table");
  const codeBlocks = blocks.filter((block): block is MindMapCodeContentBlock => block.type === "code");
  node.text = textBlocks.map((block) => block.text).join(" ").trim();
  node.richText = textBlocks.length === 1 ? normalizeRichText(textBlocks[0]?.richText, textBlocks[0]?.text ?? "") : undefined;
  node.image = imageBlocks[0]?.source;
  node.table = tableBlocks[0]?.table;
  node.code = codeBlocks[0]?.code;
}

/**
 * 使用调用方提供的有序内容块完整替换节点内容，并重新生成旧版兼容字段。
 *
 * @param node 需要更新的节点。
 * @param blocks 已经完成编辑、过滤和排序的权威内容块集合。
 * @remarks
 * `nodeContentBlocks()` 会在迁移旧文档时把 `node.table` 与 `node.code`
 * 补入缺少对应块的 `content`。因此编辑器执行“删除表格/代码块”时，必须先
 * 清除这些旧版镜像字段，否则后续同步会把刚删除的块重新补回。
 */
export function replaceNodeContentBlocks(node: MindMapNode, blocks: MindMapContentBlock[]): void {
  node.content = blocks.length ? blocks : undefined;
  node.text = "";
  node.richText = undefined;
  node.image = undefined;
  node.table = undefined;
  node.code = undefined;
  syncNodeContentFields(node);
}

/**
 * 将图床上传结果按节点和内容块 ID 合并到当前最新文档。
 *
 * @param document 可能仍在被用户编辑的当前文档。
 * @param patches 已完成网络上传、等待写回的图片补丁。
 * @returns 实际更新的图片块数量。
 * @remarks
 * 该函数不替换整份文档，也不使用上传开始时的旧快照。调用方应在网络请求
 * 完成后把补丁应用到当前编辑器文档或重新读取的最新磁盘文档，以避免并发
 * 自动上传造成最后写入覆盖和节点丢失。
 */
export function applyImageUploadPatches(document: MindMapDocument, patches: readonly MindMapImageUploadPatch[]): number {
  let changed = 0;
  for (const patch of patches) {
    const node = findNode(document.root, patch.nodeId);
    if (!node) continue;
    const blocks = nodeContentBlocks(node);
    const block = blocks.find((item): item is MindMapImageContentBlock => item.type === "image" && item.id === patch.blockId);
    if (!block) continue;
    if (patch.localPath) {
      const sameLocalSource = block.localSource === patch.localPath || block.source === patch.localPath;
      if (!sameLocalSource && !patch.clearLocalSource) continue;
    }

    let blockChanged = false;
    if (patch.remoteSources?.length) {
      const merged = new Map<string, MindMapImageRemoteSource>();
      for (const source of block.remoteSources ?? []) merged.set(source.hostId || source.url, source);
      for (const source of patch.remoteSources) merged.set(source.hostId || source.url, source);
      const next = Array.from(merged.values());
      if (JSON.stringify(next) !== JSON.stringify(block.remoteSources ?? [])) {
        block.remoteSources = next;
        blockChanged = true;
      }
    }
    if (patch.contentHash && patch.contentHash !== block.contentHash) {
      block.contentHash = patch.contentHash;
      blockChanged = true;
    }
    if (patch.localPath && !patch.clearLocalSource && block.localSource !== patch.localPath) {
      block.localSource = patch.localPath;
      blockChanged = true;
    }
    if (patch.clearLocalSource && block.localSource !== undefined) {
      block.localSource = undefined;
      blockChanged = true;
    }
    if (patch.preferredSource && patch.preferredSource !== block.source) {
      block.source = patch.preferredSource;
      blockChanged = true;
    }
    if (!blockChanged) continue;
    replaceNodeContentBlocks(node, blocks);
    changed += 1;
  }
  return changed;
}

/** 内容块相对目标块的放置位置；append 表示放到目标节点末尾。 */
export type ContentBlockDropPosition = "before" | "after" | "append";

/**
 * 在同一节点内重排内容块，或把一个内容块移动到另一节点。
 *
 * @param root 当前文档根节点。
 * @param sourceNodeId 原节点标识。
 * @param blockId 要移动的内容块标识。
 * @param targetNodeId 目标节点标识。
 * @param targetBlockId 目标内容块标识；追加到末尾时可省略。
 * @param position 放到目标块之前、之后或目标节点末尾。
 * @returns 实际顺序或归属发生变化时返回 true。
 */
export function moveNodeContentBlock(
  root: MindMapNode,
  sourceNodeId: string,
  blockId: string,
  targetNodeId: string,
  targetBlockId: string | undefined,
  position: ContentBlockDropPosition
): boolean {
  const sourceNode = findNode(root, sourceNodeId);
  const targetNode = findNode(root, targetNodeId);
  if (!sourceNode || !targetNode) return false;
  if (sourceNodeId === targetNodeId && targetBlockId === blockId) return false;

  const sourceBlocks = nodeContentBlocks(sourceNode);
  const sourceIndex = sourceBlocks.findIndex((block) => block.id === blockId);
  if (sourceIndex < 0) return false;
  const moving = sourceBlocks[sourceIndex]!;

  if (sourceNode === targetNode) {
    const previousOrder = sourceBlocks.map((block) => block.id).join("\u0000");
    sourceBlocks.splice(sourceIndex, 1);
    const targetIndex = targetBlockId
      ? sourceBlocks.findIndex((block) => block.id === targetBlockId)
      : -1;
    if (targetBlockId && targetIndex < 0) return false;
    const insertIndex = position === "append" || targetIndex < 0
      ? sourceBlocks.length
      : targetIndex + (position === "after" ? 1 : 0);
    sourceBlocks.splice(insertIndex, 0, moving);
    if (sourceBlocks.map((block) => block.id).join("\u0000") === previousOrder) return false;
    replaceNodeContentBlocks(sourceNode, sourceBlocks);
    return true;
  }

  const targetBlocks = nodeContentBlocks(targetNode);
  const targetIndex = targetBlockId
    ? targetBlocks.findIndex((block) => block.id === targetBlockId)
    : -1;
  if (targetBlockId && targetIndex < 0) return false;
  sourceBlocks.splice(sourceIndex, 1);
  const remainingSourceBlocks = sourceBlocks.filter((block) => block.type !== "text" || block.text.trim());
  const insertIndex = position === "append" || targetIndex < 0
    ? targetBlocks.length
    : targetIndex + (position === "after" ? 1 : 0);
  targetBlocks.splice(insertIndex, 0, moving);
  replaceNodeContentBlocks(sourceNode, remainingSourceBlocks);
  replaceNodeContentBlocks(targetNode, targetBlocks);
  return true;
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
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
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
  const hasColumnWidths = Array.isArray(input.columnWidths)
    && input.columnWidths.slice(0, headers.length).some((value) => typeof value === "number" && Number.isFinite(value));
  const columnWidths = hasColumnWidths
    ? headers.map((_, index) => {
      const value = input.columnWidths?.[index];
      return typeof value === "number" && Number.isFinite(value)
        ? Math.max(64, Math.min(1200, Math.round(value)))
        : 160;
    })
    : undefined;
  const source = input.source === "markdown" || input.source === "children" ? input.source : "manual";
  return { headers, rows, alignments, columnWidths, source };
}

/**
 * 校验并规范化code，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeCode(input: Partial<MindMapCodeBlock> | undefined): MindMapCodeBlock | undefined {
  if (!input || typeof input.code !== "string" || !input.code.trim()) return undefined;
  const language = typeof input.language === "string" && input.language.trim()
    ? input.language.trim().replace(/[^a-z0-9_+#.-]/gi, "").slice(0, 40)
    : undefined;
  const theme = input.theme === "github" || input.theme === "monokai" || input.theme === "dracula"
    ? input.theme
    : input.theme === "obsidian" ? "obsidian" : undefined;
  return {
    language,
    code: input.code.replace(/\r\n/g, "\n").slice(0, 100000),
    ...(typeof input.collapsed === "boolean" ? { collapsed: input.collapsed } : {}),
    ...(typeof input.showLineNumbers === "boolean" ? { showLineNumbers: input.showLineNumbers } : {}),
    ...(theme ? { theme } : {})
  };
}

/**
 * 校验并规范化submap，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
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
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
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

/** Normalizes an untrusted structured-question payload from persisted JSON. */
function normalizeMindMapQuestion(value: unknown): MindMapQuestion | undefined {
  if (!value || typeof value !== "object") return undefined;
  const input = value as Partial<MindMapQuestion>;
  const normalizeBlocks = (blocks: unknown): MindMapContentBlock[] => Array.isArray(blocks)
    ? blocks.map(normalizeContentBlock).filter((block): block is MindMapContentBlock => Boolean(block))
    : [];
  const mode: MindMapQuestionMode = input.mode === "essay" ? "essay" : input.mode === "judgment" ? "judgment" : "choice";
  const options = mode !== "essay" && Array.isArray(input.options)
    ? input.options.slice(0, 12).flatMap((option, index) => {
      if (!option || typeof option !== "object") return [];
      const item = option as Partial<MindMapQuestionOption>;
      const content = normalizeBlocks(item.content);
      return [{
        id: typeof item.id === "string" && item.id.trim() ? item.id.trim().slice(0, 160) : newId(),
        label: typeof item.label === "string" && item.label.trim() ? item.label.trim().slice(0, 16) : String.fromCharCode(65 + index),
        content
      }];
    })
    : createQuestionOptions(mode);
  const status: MindMapQuestionStatus = input.status === "completed" || input.status === "favorite" || input.status === "wrong" || input.status === "mastered"
    ? input.status
    : "unanswered";
  const attemptCount = typeof input.attemptCount === "number" && Number.isFinite(input.attemptCount)
    ? Math.max(0, Math.min(1000000, Math.floor(input.attemptCount)))
    : 0;
  const correctCount = typeof input.correctCount === "number" && Number.isFinite(input.correctCount)
    ? Math.max(0, Math.min(attemptCount, Math.floor(input.correctCount)))
    : 0;
  return {
    mode,
    stem: normalizeBlocks(input.stem),
    options,
    answer: normalizeBlocks(input.answer),
    explanation: normalizeBlocks(input.explanation),
    tags: normalizeTags(input.tags) ?? [],
    source: input.source && typeof input.source === "object"
      && typeof input.source.title === "string" && input.source.title.trim()
      && typeof input.source.url === "string" && /^https?:\/\//i.test(input.source.url.trim())
      ? {
        title: input.source.title.trim().slice(0, 300),
        url: input.source.url.trim().slice(0, 2000),
        matchedAt: typeof input.source.matchedAt === "string" && input.source.matchedAt.trim()
          ? input.source.matchedAt.trim().slice(0, 80)
          : new Date().toISOString()
      }
      : undefined
    ,status
    ,attemptCount
    ,correctCount
    ,lastPracticedAt: typeof input.lastPracticedAt === "string" && input.lastPracticedAt.trim() ? input.lastPracticedAt.trim().slice(0, 80) : undefined
  };
}

/** Mirrors question stem and tags into standard node fields used by existing renderers and exports. */
export function syncMindMapQuestionFields(node: MindMapNode): void {
  if (!node.question) return;
  node.content = node.question.stem.length ? node.question.stem : undefined;
  syncNodeContentFields(node);
  node.tags = Array.from(new Set([...(node.tags ?? []), ...node.question.tags]));
}

/**
 * 校验并规范化node，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
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
    const { text, richText } = normalizeMarkdownRichText(input?.richText, fallbackNodeText);
    if (text) normalizedContent.push({ id: newId(), type: "text", text, richText });
  }
  const textBlocks = normalizedContent.filter((block): block is MindMapTextContentBlock => block.type === "text");
  const imageBlocks = normalizedContent.filter((block): block is MindMapImageContentBlock => block.type === "image");
  const text = textBlocks.map((block) => block.text).join(" ").trim();
  const requestedNumberingMode = input?.articleNumberingMode;
  const articleNumberingMode: ArticleNumberingMode | undefined = requestedNumberingMode === "manual" || requestedNumberingMode === "none"
    ? requestedNumberingMode
    : undefined;
  const articleNumberingLevel = articleNumberingMode === "manual" && Number.isFinite(input?.articleNumberingLevel)
    ? Math.min(8, Math.max(1, Math.floor(input?.articleNumberingLevel ?? 1)))
    : undefined;
  const node: MindMapNode = {
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
    question: normalizeMindMapQuestion(input?.question),
    task: normalizeTask(input?.task),
    articleNumberingMode,
    articleNumberingLevel,
    style: normalizeStyle(input?.style),
    collapsed: input?.collapsed === true || undefined,
    children: Array.isArray(input?.children)
      ? input.children.map((child, index) => normalizeNode(child, `节点 ${index + 1}`))
      : []
  };
  syncNodeContentFields(node);
  syncMindMapQuestionFields(node);
  return node;
}

/**
 * 校验并规范化document view，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeDocumentView(input: Partial<MindMapDocumentView> | undefined): MindMapDocumentView | undefined {
  if (!input) return undefined;
  const mode: DisplayMode | undefined = input.mode === "outline" || input.mode === "article" || input.mode === "mindmap"
    ? input.mode
    : undefined;
  const readOnly = input.readOnly === true ? true : input.readOnly === false ? false : undefined;
  const articleLandingMode: ArticleLandingMode | undefined = input.articleLandingMode === "toc" || input.articleLandingMode === "article"
    ? input.articleLandingMode
    : undefined;
  const articleTocMaxDepth = typeof input.articleTocMaxDepth === "number" && Number.isFinite(input.articleTocMaxDepth)
    ? Math.max(1, Math.min(8, Math.round(input.articleTocMaxDepth)))
    : undefined;
  const articleMiniMap = typeof input.articleMiniMap === "boolean" ? input.articleMiniMap : undefined;
  const zoom = typeof input.zoom === "number" ? Math.min(2.5, Math.max(0.2, input.zoom)) : undefined;
  const panX = typeof input.panX === "number" && Number.isFinite(input.panX) ? input.panX : undefined;
  const panY = typeof input.panY === "number" && Number.isFinite(input.panY) ? input.panY : undefined;
  return mode !== undefined || readOnly !== undefined || articleLandingMode !== undefined || articleTocMaxDepth !== undefined || articleMiniMap !== undefined || zoom !== undefined || panX !== undefined || panY !== undefined
    ? { mode, readOnly, articleLandingMode, articleTocMaxDepth, articleMiniMap, zoom, panX, panY }
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
  const tocStyle: ArticleTocStyle | undefined = input.tocStyle === "card"
    || input.tocStyle === "plain"
    || input.tocStyle === "lines"
    || input.tocStyle === "original"
    || input.tocStyle === "minimal-page"
    || input.tocStyle === "report"
    || input.tocStyle === "magazine"
    || input.tocStyle === "tree"
    ? input.tocStyle
    : undefined;
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
    lineHeight,
    leafMarkerEnabled: typeof input.leafMarkerEnabled === "boolean" ? input.leafMarkerEnabled : undefined,
    leafMarkerStyle: input.leafMarkerStyle === "hollow" || input.leafMarkerStyle === "square" || input.leafMarkerStyle === "dash" ? input.leafMarkerStyle : input.leafMarkerStyle === "solid" ? "solid" : undefined,
    leafMarkerColor: color(input.leafMarkerColor),
    leafTextAlignment: input.leafTextAlignment === "flush" || input.leafTextAlignment === "auto" ? input.leafTextAlignment : undefined
    ,leafNumberingEnabled: typeof input.leafNumberingEnabled === "boolean" ? input.leafNumberingEnabled : undefined
    ,leafNumberingStyle: input.leafNumberingStyle === "circled" || input.leafNumberingStyle === "next-level" ? input.leafNumberingStyle : undefined
    ,leafNumberingThreshold: typeof input.leafNumberingThreshold === "number" ? Math.max(1, Math.min(20, Math.round(input.leafNumberingThreshold))) : undefined
  };
}

/**
 * 把不完整的输入对象转换为当前 MindMapDocument。该函数会递归规范化节点、外观和视图状态，并保证根节点、数组及必需标识始终存在。
 *
 * @param input 可能来自磁盘、剪贴板或外部来源的不可信输入。
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
 * 在保存前再次规范化文档，并输出带缩进的稳定 JSON。
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
 * 解析磁盘中的 .mindmap 文本。优先识别原始 JSON 和当前 mindmap-json 围栏；解析失败时按 Markdown 导入，避免视图崩溃。
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

  const fenced = extractFencedJson(source, MINDMAP_CODE_BLOCK);
  if (fenced) {
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
 * 执行“node search text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function nodeSearchText(node: MindMapNode): string {
  return [nodePlainText(node), node.note, node.link, ...nodeContentBlocks(node).flatMap((block) => {
    if (block.type === "image") return `${block.source} ${block.alt ?? ""}`;
    if (block.type === "table") return [...block.table.headers, ...block.table.rows.flat()];
    if (block.type === "code") return [block.code.language, block.code.code];
    return block.text;
  }), node.icon, node.submap?.path, ...(node.tags ?? [])]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase();
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

/** Converts supported inline Markdown markers into the editor's rich-text model. */
export function markdownInlineToRichText(value: string): { text: string; richText?: MindMapTextRun[] } {
  const runs: MindMapTextRun[] = [];
  const inlinePattern = /(`+)([\s\S]*?)\1|\*\*(.+?)\*\*|~~(.+?)~~|<u>([\s\S]*?)<\/u>|\*(?!\s)(.+?)(?<!\s)\*|\[([^\]\n]+)\]\(([^\s()]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = inlinePattern.exec(value))) {
    const before = value.slice(cursor, match.index);
    const codeText = match[2];
    const boldText = match[3];
    const strikeText = match[4];
    const underlineText = match[5];
    const italicText = match[6];
    const linkLabel = match[7];
    const linkTarget = normalizeLinkTarget(match[8]);
    if (before) runs.push({ text: before });
    if (codeText !== undefined) runs.push({ text: codeText, style: { code: true } });
    else if (boldText !== undefined) runs.push({ text: boldText, style: { bold: true } });
    else if (strikeText !== undefined) runs.push({ text: strikeText, style: { strike: true } });
    else if (underlineText !== undefined) runs.push({ text: underlineText, style: { underline: true } });
    else if (italicText !== undefined) runs.push({ text: italicText, style: { italic: true } });
    else if (linkLabel !== undefined && linkTarget) runs.push({ text: linkLabel, style: { link: linkTarget } });
    else runs.push({ text: match[0] });
    cursor = match.index + match[0].length;
  }
  if (!runs.length) return { text: value };

  const after = value.slice(cursor);
  if (after) runs.push({ text: after });
  const text = runs.map((run) => run.text).join("");
  return { text, richText: normalizeRichText(runs, text) };
}

/**
 * Converts inline Markdown in unformatted runs while preserving styles applied by the editor.
 * This keeps imported and manually entered node text on the same rich-text path.
 */
export function normalizeMarkdownRichText(
  runs: MindMapTextRun[] | undefined,
  fallbackText: string
): { text: string; richText?: MindMapTextRun[] } {
  const normalized = normalizeRichText(runs, fallbackText);
  const sourceRuns = normalized?.length ? normalized : fallbackText ? [{ text: fallbackText }] : [];
  const converted: MindMapTextRun[] = [];
  for (const run of sourceRuns) {
    if (run.style && Object.values(run.style).some(Boolean)) {
      converted.push(run);
      continue;
    }
    // `normalizeRichText` trims a complete value. Keep whitespace that belongs
    // between adjacent runs before parsing this individual unformatted run.
    const leading = run.text.match(/^\s+/)?.[0] ?? "";
    const trailing = run.text.match(/\s+$/)?.[0] ?? "";
    const core = run.text.slice(leading.length, run.text.length - trailing.length);
    if (leading) converted.push({ text: leading });
    const parsed = markdownInlineToRichText(core);
    if (parsed.richText?.length) converted.push(...parsed.richText);
    else if (parsed.text) converted.push({ text: parsed.text });
    if (trailing) converted.push({ text: trailing });
  }
  const text = converted.map((run) => run.text).join("");
  return { text, richText: normalizeRichText(converted, text) };
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
    if (style.code) value = `\`${value}\``;
    if (style.color) value = `<span style="color:${style.color}">${value}</span>`;
    if (style.link) value = `[${value}](${style.link})`;
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
    headers: ["子节点", "备注", "标签", "下级数量"],
    rows: node.children.map((child) => [
      nodePlainText(child),
      child.note ?? "",
      child.tags?.join(", ") ?? "",
      String(child.children.length)
    ]),
    alignments: ["left", "left", "left", "right"],
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
      } else if (block.type === "image") {
        result.push(`![${escapeInlineMarkdown(block.alt ?? "图片")}](${block.source})`);
      } else if (block.type === "table") {
        result.push(tableToMarkdown(block.table));
      } else {
        result.push(`\`\`\`${block.code.language ?? ""}\n${block.code.code}\n\`\`\``);
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
    lines.push(`${indent}- ${node.icon ? `${node.icon} ` : ""}${firstText}${tags}${link}`);
    blocks.filter((value) => value !== firstText).forEach((value) => lines.push(`${indent}  ${value}`));
    if (node.note) lines.push(`${indent}  > ${node.note.replaceAll("\n", " ")}`);
    if (node.submap) lines.push(`${indent}  > 子导图：[[${node.submap.path}]]`);
    node.children.forEach((child) => visit(child, depth + 1));
  };
  doc.root.children.forEach((child) => visit(child, 1));
  return lines.join("\n");
}

/** 导入标题中可由文章模式重新生成的常见章节、条目序号。 */
const IMPORTED_OUTLINE_NUMBER_PREFIX = /^(?:\s*(?:(?:[一二三四五六七八九十百千万零〇○]+)[、.．]|[（(][一二三四五六七八九十百千万零〇○0-9]+[）)]|\d+[、.．]|\d+[）)]))+\s*/u;

/** 导入时视为导航噪声、无需生成节点的目录回链标签。 */
const IMPORTED_NAVIGATION_LABEL = /^(?:目录|返回目录|回到目录|返回顶部|回到顶部|顶部)$/u;

/** 删除 Markdown 文本末尾的 Obsidian 块 ID，并把块锚点链接退化为普通标签。 */
function sanitizeImportedMarkdownSource(value: string): string {
  return value
    .replace(/(?:^|\s+)\^[A-Za-z0-9-]+\s*$/u, "")
    .replace(/\[([^\]\n]+)\]\(([^)\n]*#\^[A-Za-z0-9-]+)(?:\s+["'][^)]*["'])?\)/gu, "$1")
    .replace(/\[\[([^\]|#\n]+)#\^[A-Za-z0-9-]+(?:\|([^\]\n]+))?\]\]/gu, (_match, target: string, alias: string | undefined) => alias || target)
    .trim();
}

/** 判断一整行是否只是指向 Obsidian 块 ID 的目录或顶部导航链接。 */
function isImportedNavigationAnchor(value: string): boolean {
  const source = value.trim();
  const markdownLink = source.match(/^\[([^\]\n]+)\]\(([^)\n]*#\^[A-Za-z0-9-]+)(?:\s+["'][^)]*["'])?\)$/u);
  if (markdownLink) return IMPORTED_NAVIGATION_LABEL.test(markdownLink[1]?.trim() ?? "");
  const wikiLink = source.match(/^\[\[([^\]|#\n]+)#\^[A-Za-z0-9-]+(?:\|([^\]\n]+))?\]\]$/u);
  if (!wikiLink) return false;
  return IMPORTED_NAVIGATION_LABEL.test((wikiLink[2] || wikiLink[1] || "").trim());
}

/** 从富文本运行段头部移除指定字符数，同时保留剩余字符样式。 */
function trimRichTextStart(runs: MindMapTextRun[] | undefined, count: number): MindMapTextRun[] | undefined {
  if (!runs?.length || count <= 0) return runs;
  let remaining = count;
  const result: MindMapTextRun[] = [];
  for (const run of runs) {
    if (remaining >= run.text.length) {
      remaining -= run.text.length;
      continue;
    }
    const text = run.text.slice(remaining);
    remaining = 0;
    if (text) result.push({ text, style: run.style });
  }
  return result;
}

/** 将导入文本解析为富文本，并移除可重新生成的开头序号。 */
function importedMarkdownText(value: string): { text: string; richText?: MindMapTextRun[] } {
  const source = sanitizeImportedMarkdownSource(value);
  const parsed = markdownInlineToRichText(source);
  const prefix = parsed.text.match(IMPORTED_OUTLINE_NUMBER_PREFIX)?.[0] ?? "";
  const text = parsed.text.slice(prefix.length).trim();
  if (!parsed.richText?.length) return { text };
  const richText = normalizeRichText(trimRichTextStart(parsed.richText, prefix.length), text);
  return { text, richText };
}

/**
 * 执行“markdown to document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param markdown 待解析或生成的 Markdown 文本。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function markdownToDocument(markdown: string, fallbackTitle = "思维导图", options: { sourcePath?: string } = {}): MindMapDocument {
  const doc = createDefaultDocument(fallbackTitle);
  doc.root.children = [];
  const stack: Array<{ level: number; node: MindMapNode; kind: "root" | "heading" | "list" | "bold"; listKind?: "bullet" | "numbered" }> = [{ level: 0, node: doc.root, kind: "root" }];
  const sourceLines = markdown.split(/\r?\n/);
  let frontmatterTitle: string | undefined;
  if (sourceLines[0]?.trim() === "---") {
    const end = sourceLines.slice(1).findIndex((line) => line.trim() === "---");
    if (end >= 0) {
      const frontmatter = sourceLines.slice(1, end + 1);
      const titleLine = frontmatter.find((line) => /^title\s*:/i.test(line));
      const title = titleLine?.match(/^title\s*:\s*["']?(.*?)["']?\s*$/i)?.[1]?.trim();
      if (title) {
        frontmatterTitle = title;
      }
      sourceLines.splice(0, end + 2);
    }
  }
  let rootAssigned = Boolean(frontmatterTitle);
  let currentBoldTheme: MindMapNode | null = null;
  let currentBoldNode: MindMapNode | null = null;
  let hasLeadingContent = false;
  let skippingTableOfContents = false;
  let tableLines: string[] = [];
  let codeFence: { marker: string; language?: string; lines: string[] } | null = null;
  const hasMultipleH1 = (markdown.match(/^#[ 	]+\S/gm) || []).length > 1;
  const sourceDirectory = options.sourcePath?.replace(/\\/g, "/").split("/").slice(0, -1).join("/") ?? "";
  const resolveImportedImageSource = (value: string): string => {
    const source = value.trim().replace(/\\/g, "/");
    if (!source || /^(?:https?:|data:|blob:|file:|\/)/i.test(source) || !sourceDirectory) return source;
    const parts: string[] = [];
    for (const part of `${sourceDirectory}/${source}`.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") parts.pop();
      else parts.push(part);
    }
    return parts.join("/");
  };

  const applyMarkdownText = (node: MindMapNode, value: string, fallback = "节点", forceBold = false): void => {
    const parsed = importedMarkdownText(value);
    const source = parsed.text || fallback;
    if (forceBold) {
      replaceNodeContentBlocks(node, [{
        id: newId(),
        type: "text",
        text: source,
        richText: normalizeRichText([{ text: source, style: { bold: true } }], source)
      }]);
      return;
    }
    replaceNodeContentBlocks(node, [{
      id: newId(),
      type: "text",
      text: source,
      richText: parsed.richText
    }]);
  };

  if (frontmatterTitle) {
    applyMarkdownText(doc.root, frontmatterTitle, fallbackTitle);
    doc.title = doc.root.text;
  }

  const createMarkdownNode = (value: string, fallback = "节点", forceBold = false): MindMapNode => {
    const node = createNode();
    applyMarkdownText(node, value, fallback, forceBold);
    return node;
  };

  const appendCodeBlock = (fence: NonNullable<typeof codeFence>): void => {
    const target = currentBoldNode ?? stack.at(-1)?.node ?? doc.root;
    const code = fence.lines.join("\n");
    if (!code.trim()) return;
    replaceNodeContentBlocks(target, [
      ...nodeContentBlocks(target),
      { id: newId(), type: "code", code: { language: fence.language, code } }
    ]);
  };

  /** 将 Markdown 正文按遇到顺序追加为内容块，避免与代码、图片和表格脱节。 */
  const appendMarkdownTextBlock = (target: MindMapNode, value: string): void => {
    const parsed = importedMarkdownText(value);
    const source = parsed.text;
    if (!source) return;
    replaceNodeContentBlocks(target, [
      ...nodeContentBlocks(target),
      { id: newId(), type: "text", text: source, richText: parsed.richText }
    ]);
  };

  const appendImageBlock = (alt: string, source: string): void => {
    const target = currentBoldNode ?? stack.at(-1)?.node ?? doc.root;
    const imageSource = resolveImportedImageSource(source);
    if (!imageSource) return;
    replaceNodeContentBlocks(target, [
      ...nodeContentBlocks(target),
      { id: newId(), type: "image", source: imageSource, alt: alt.trim() || undefined }
    ]);
  };

  for (const rawLine of sourceLines) {
    const line = rawLine.trimEnd();
    if (codeFence) {
      if (line.trim() === codeFence.marker) {
        appendCodeBlock(codeFence);
        codeFence = null;
      } else {
        codeFence.lines.push(rawLine);
      }
      continue;
    }
    // Buffer consecutive table lines
    if (/^\s*\|.*\|\s*$/.test(line)) {
      if (!skippingTableOfContents) tableLines.push(line);
      continue;
    }
    // Flush buffered table when hitting a non-table line
    if (tableLines.length >= 2) {
      const tableStr = tableLines.join('\n');
      const parsed = parseMarkdownTable(tableStr);
      if (parsed) {
        const target = currentBoldNode ?? stack.at(-1)?.node ?? doc.root;
        replaceNodeContentBlocks(target, [...nodeContentBlocks(target), { id: newId(), type: "table", table: parsed }]);
      }
    }
    tableLines = [];

    const openingCodeFence = line.match(/^\s*(`{3,})([^`]*)$/);
    if (openingCodeFence) {
      codeFence = {
        marker: openingCodeFence[1] ?? "```",
        language: openingCodeFence[2]?.trim() || undefined,
        lines: []
      };
      continue;
    }

    if (!line.trim() || line.trimStart().startsWith("---") || /^\s*\^[A-Za-z0-9-]+\s*$/u.test(line)) continue;

    const navigationCandidate = line.trim()
      .replace(/^#{1,6}\s+/, "")
      .replace(/^[-*+]\s+/, "")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/^>\s+/, "")
      .replace(IMPORTED_OUTLINE_NUMBER_PREFIX, "")
      .trim();
    if (isImportedNavigationAnchor(navigationCandidate)) continue;

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    const bullet = line.match(/^(\s*)[-*+]\s+(.+?)\s*$/);
    const numbered = line.match(/^(\s*)\d+[.)]\s*(.+?)\s*$/);
    const boldOutline = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
    const quote = line.match(/^\s*>\s*(.+?)\s*$/);
    const linkedImage = line.trim().match(/^\[!\[([^\]]*)\]\((\S+?)(?:\s+["'][^)]*["'])?\)\]\(\S+(?:\s+["'][^)]*["'])?\)\s*$/);
    const image = line.trim().match(/^!\[([^\]]*)\]\((\S+?)(?:\s+["'][^)]*["'])?\)\s*$/);
    const obsidianImage = line.trim().match(/^!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]$/);

    if (heading) {
      currentBoldTheme = null;
      currentBoldNode = null;
      const level = heading[1]?.length ?? 1;
      const text = heading[2]?.trim() ?? "节点";
      if (frontmatterTitle && !doc.root.children.length && level >= 2 && text === doc.root.text) {
        stack.length = 1;
        continue;
      }
      if (!rootAssigned && !doc.root.children.length && /^目录(?:\s|$)/.test(text)) {
        hasLeadingContent = true;
        skippingTableOfContents = true;
        stack.length = 1;
        continue;
      }
      skippingTableOfContents = false;
      if (level === 1 && !rootAssigned && !doc.root.children.length && !hasLeadingContent && !hasMultipleH1) {
        applyMarkdownText(doc.root, text);
        doc.title = doc.root.text;
        rootAssigned = true;
        stack.length = 1;
      } else if (level === 1) {
        const node = createMarkdownNode(text);
        stack.length = 1;
        doc.root.children.push(node);
        stack.push({ level, node, kind: "heading" });
        rootAssigned = true;
      } else {
        const node = createMarkdownNode(text);
        while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level) stack.pop();
        const parent = stack.at(-1)?.node ?? doc.root;
        parent.children.push(node);
        stack.push({ level, node, kind: "heading" });
      }
      continue;
    }

    if (skippingTableOfContents) continue;

    if (linkedImage) {
      appendImageBlock(linkedImage[1] ?? "图片", linkedImage[2] ?? "");
      continue;
    }

    if (image) {
      appendImageBlock(image[1] ?? "图片", image[2] ?? "");
      continue;
    }

    if (obsidianImage) {
      appendImageBlock(obsidianImage[2] && !/^\d+(?:px)?$/i.test(obsidianImage[2].trim()) ? obsidianImage[2] : "图片", obsidianImage[1] ?? "");
      continue;
    }

    if (quote) {
      const parent = stack.at(-1)?.node ?? doc.root;
      parent.children.push(createMarkdownNode(quote[1]?.trim() || "引用"));
      hasLeadingContent ||= !rootAssigned;
      continue;
    }

    if (boldOutline) {
      const text = boldOutline[1]?.trim() || "节点";
      if (!rootAssigned && !doc.root.children.length && stack.length === 1) {
        applyMarkdownText(doc.root, text, "节点", true);
        doc.title = doc.root.text;
        rootAssigned = true;
        currentBoldNode = doc.root;
        continue;
      }
      const isTheme = /^主题\s*[一二三四五六七八九十百千万零〇○0-9]+/.test(text);
      const parent = isTheme ? doc.root : currentBoldTheme ?? doc.root;
      const node = createMarkdownNode(text, "节点", true);
      parent.children.push(node);
      currentBoldNode = node;
      if (isTheme) currentBoldTheme = node;
      stack.length = 1;
      if (currentBoldTheme && node !== currentBoldTheme) stack.push({ level: 2, node: currentBoldTheme, kind: "bold" });
      stack.push({ level: isTheme ? 2 : 3, node, kind: "bold" });
      continue;
    }

    const listMatch = bullet ?? numbered;
    if (listMatch) {
      const spaces = (listMatch[1] ?? "").replaceAll("\t", "  ").length;
      const parentLevel = [...stack].reverse().find((entry) => entry.kind === "heading" || entry.kind === "bold")?.level ?? 1;
      const previous = stack.at(-1);
      const numberedParent = previous?.kind === "list" && previous.listKind === "numbered" && previous.level === parentLevel + 1
        ? previous
        : previous?.kind === "list" && previous.listKind === "bullet" && previous.level === parentLevel + 2 && stack.at(-2)?.listKind === "numbered"
          ? stack.at(-2)
          : undefined;
      const level = bullet && spaces === 0 && numberedParent
        ? numberedParent.level + 1
        : parentLevel + Math.floor(spaces / 2) + 1;
      const node = createMarkdownNode((listMatch[2] ?? "节点").trim());
      while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level) stack.pop();
      const parent = stack.at(-1)?.node ?? doc.root;
      parent.children.push(node);
      stack.push({ level, node, kind: "list", listKind: bullet ? "bullet" : "numbered" });
      currentBoldNode = node;
      continue;
    }

    if (currentBoldNode) {
      currentBoldNode.children.push(createMarkdownNode(line.trim()));
      continue;
    }

    const parent = stack.at(-1)?.node;
    if (parent && parent !== doc.root) appendMarkdownTextBlock(parent, line);
    else hasLeadingContent = true;
  }

  if (codeFence) appendCodeBlock(codeFence);

  // Flush trailing table buffer
  if (tableLines.length >= 2) {
    const tableStr = tableLines.join('\n');
    const parsed = parseMarkdownTable(tableStr);
    if (parsed) {
      const target = currentBoldNode ?? stack.at(-1)?.node ?? doc.root;
      replaceNodeContentBlocks(target, [...nodeContentBlocks(target), { id: newId(), type: "table", table: parsed }]);
    }
  }
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
