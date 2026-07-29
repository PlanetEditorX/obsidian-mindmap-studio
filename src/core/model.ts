/**
 * @file model.ts
 * @description 核心领域模型与序列化层。
 *
 * 定义 .mindmap 稳定数据结构，并负责字段规范化、富文本、内容块、节点树、Markdown 导入导出及图片镜像候选源排序。
 */

import { walkNodes } from "./node-tree";
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
  code?: boolean;
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
  /** Optional rendered image width in pixels. Omitted values use the view default. */
  width?: number;
  /** Optional rendered image height in pixels. Omitted values preserve the image ratio. */
  height?: number;
  /** Original local vault path retained until every selected image host succeeds. */
  localSource?: string;
  /** Mirror URLs returned by one or more configured image hosts. */
  remoteSources?: MindMapImageRemoteSource[];
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

/** A structured question can be either a multiple-choice or long-form exercise. */
export type MindMapQuestionMode = "choice" | "essay";

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

/**
 * TaskProgress 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface TaskProgress {
  done: number;
  total: number;
}

const MINDMAP_CODE_BLOCK = "mindmap-json";

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

/** Creates an editable structured question with a text block for every field. */
export function createMindMapQuestion(mode: MindMapQuestionMode = "choice"): MindMapQuestion {
  return {
    mode,
    stem: [{ id: newId(), type: "text", text: "" }],
    options: mode === "choice"
      ? ["A", "B", "C", "D"].map((label) => ({ id: newId(), label, content: [{ id: newId(), type: "text", text: "" }] }))
      : [],
    answer: [{ id: newId(), type: "text", text: "" }],
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
    return { id, type: "image", source, alt, width, height, localSource, remoteSources: remoteSources?.length ? remoteSources : undefined };
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
    const richText = normalizeRichText(node.richText, node.text);
    blocks.push({ id: newId(), type: "text", text: richTextPlainText(richText, node.text), richText });
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
  const source = input.source === "markdown" || input.source === "children" ? input.source : "manual";
  return { headers, rows, alignments, source };
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
  const mode: MindMapQuestionMode = input.mode === "essay" ? "essay" : "choice";
  const options = mode === "choice" && Array.isArray(input.options)
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
    : [];
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
    const richText = normalizeRichText(input?.richText, fallbackNodeText);
    const text = richTextPlainText(richText, fallbackNodeText);
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

/** Converts supported inline Markdown markers into the editor's rich-text model. */
export function markdownInlineToRichText(value: string): { text: string; richText?: MindMapTextRun[] } {
  const runs: MindMapTextRun[] = [];
  const inlinePattern = /\*\*(.+?)\*\*|(`+)([\s\S]*?)\2/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = inlinePattern.exec(value))) {
    const before = value.slice(cursor, match.index);
    const boldText = match[1];
    const codeText = match[3];
    if (before) runs.push({ text: before });
    if (boldText) runs.push({ text: boldText, style: { bold: true } });
    else if (codeText) runs.push({ text: codeText, style: { code: true } });
    cursor = match.index + match[0].length;
  }
  if (!runs.length) return { text: value };

  const after = value.slice(cursor);
  if (after) runs.push({ text: after });
  const text = runs.map((run) => run.text).join("");
  return { text, richText: normalizeRichText(runs, text) };
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
    lines.push(`${indent}- ${taskPrefix(node.task)}${node.icon ? `${node.icon} ` : ""}${firstText}${tags}${link}`);
    blocks.filter((value) => value !== firstText).forEach((value) => lines.push(`${indent}  ${value}`));
    if (node.note) lines.push(`${indent}  > ${node.note.replaceAll("\n", " ")}`);
    if (node.submap) lines.push(`${indent}  > 子导图：[[${node.submap.path}]]`);
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
  const stack: Array<{ level: number; node: MindMapNode; kind: "root" | "heading" | "list" | "bold"; listKind?: "bullet" | "numbered" }> = [{ level: 0, node: doc.root, kind: "root" }];
  let rootAssigned = false;
  let currentBoldTheme: MindMapNode | null = null;
  let currentBoldNode: MindMapNode | null = null;
  let hasLeadingContent = false;
  let skippingTableOfContents = false;
  let tableLines: string[] = [];
  let codeFence: { marker: string; language?: string; lines: string[] } | null = null;
  const hasMultipleH1 = (markdown.match(/^#[ 	]+\S/gm) || []).length > 1;

  const applyMarkdownText = (node: MindMapNode, value: string, fallback = "节点", forceBold = false): void => {
    const source = value.trim() || fallback;
    if (forceBold) {
      node.text = source;
      node.richText = normalizeRichText([{ text: source, style: { bold: true } }], source);
      return;
    }

    const parsed = markdownInlineToRichText(source);
    node.text = parsed.text || fallback;
    node.richText = parsed.richText;
  };

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

  for (const rawLine of markdown.split(/\r?\n/)) {
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
        target.table = parsed;
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

    if (!line.trim() || line.trimStart().startsWith("---")) continue;

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    const bullet = line.match(/^(\s*)[-*+]\s+(.+?)\s*$/);
    const numbered = line.match(/^(\s*)\d+[.)]\s*(.+?)\s*$/);
    const boldOutline = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
    const quote = line.match(/^\s*>\s*(.+?)\s*$/);

    if (heading) {
      currentBoldTheme = null;
      currentBoldNode = null;
      const level = heading[1]?.length ?? 1;
      const text = heading[2]?.trim() ?? "节点";
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
      const parsed = parseTaskText((listMatch[2] ?? "节点").trim());
      const node = createMarkdownNode(parsed.text);
      node.task = parsed.task;
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
    if (parent && parent !== doc.root) parent.children.push(createMarkdownNode(line.trim()));
    else hasLeadingContent = true;
  }

  if (codeFence) appendCodeBlock(codeFence);

  // Flush trailing table buffer
  if (tableLines.length >= 2) {
    const tableStr = tableLines.join('\n');
    const parsed = parseMarkdownTable(tableStr);
    if (parsed) {
      const target = currentBoldNode ?? stack.at(-1)?.node ?? doc.root;
      target.table = parsed;
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
