/**
 * @file modes.ts
 * @description 文章领域与显示模式共享的编号工具。
 *
 * 导图、大纲、文章和通读模式读取同一节点树；本模块负责中文序号、标题判定、手动文章层级、子导图层级续接与可见模式容错。
 */

import type { ArticleLeafNumberingStyle, DisplayMode, MindMapDocument, MindMapNode } from "../core/model";
import { nodePrimaryText } from "../core/model";

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  mindmap: "导图",
  outline: "大纲",
  article: "文章",
  reading: "通读",
  "question-bank": "答题"
};

export const DISPLAY_MODE_ICONS: Record<DisplayMode, string> = {
  mindmap: "brain-circuit",
  outline: "list-tree",
  article: "notebook-text",
  reading: "book-open-text",
  "question-bank": "graduation-cap"
};

/** One physical map merged into the continuous reading view. */
export interface ReadingSection {
  filePath: string;
  document: MindMapDocument;
  baseDepth: number;
  /** 已解析的父导图路径，用于跨文件阅读位置逐级回退。 */
  parentFilePath?: string;
  /** 当前子导图在父导图中的挂载节点。 */
  parentNodeId?: string;
  /** 顶层或祖先导图已关闭编号时，当前物理页也必须保持无编号。 */
  numberingDisabled?: boolean;
}

/**
 * Encodes a file path or node id into a collision-free DOM anchor component.
 * Percent markers remain visible as underscores, so different Chinese paths
 * cannot collapse to the same replacement string.
 */
export function readingAnchorPart(value: string): string {
  return encodeURIComponent(value).replace(/%/g, "_");
}

const CHINESE_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** 文章编号支持的最高样式层级。更深结构继续保留标题层级，但不循环复用已有编号。 */
export const MAX_ARTICLE_NUMBERING_LEVEL = 8;
/** Unicode 提供单字符普通带圈数字的最大序号。 */
export const MAX_NATIVE_CIRCLED_NUMBER = 50;

/**
 * 执行“chinese number”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
export function chineseNumber(value: number): string {
  const safe = Math.max(0, Math.floor(value));
  if (safe < 10) return CHINESE_DIGITS[safe] ?? String(safe);
  if (safe < 20) return `十${safe % 10 ? CHINESE_DIGITS[safe % 10] : ""}`;
  if (safe < 100) {
    const tens = Math.floor(safe / 10);
    const ones = safe % 10;
    return `${CHINESE_DIGITS[tens]}十${ones ? CHINESE_DIGITS[ones] : ""}`;
  }
  return String(safe);
}

/** 将一基序号转换为 Excel 风格的大写字母编号，例如 1 → A、26 → Z、27 → AA。 */
function alphabeticNumber(index: number): string {
  let remaining = Math.max(1, Math.floor(index));
  let result = "";
  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode(65 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }
  return result;
}

/**
 * 将文章标题层级和同级序号转换为“第一章、第一节、一、（一）、1.、（1）、A.、（A）”等八级中文文章编号。
 * 第 8 级之后只保留结构层级，不再从 A. 重新循环，避免深层节点与上级编号混淆。
 *
 * @param depth 节点在文章结构中的一基层级。
 * @param index 当前元素在同级或列表中的一基序号。
 * @returns 对应层级的文章编号文本；超出八级时返回空字符串。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function articleNumberLabel(depth: number, index: number): string {
  const normalizedDepth = Number.isFinite(depth) ? Math.floor(depth) : 0;
  if (normalizedDepth < 1 || normalizedDepth > MAX_ARTICLE_NUMBERING_LEVEL) return "";
  const normalizedIndex = Number.isFinite(index) ? Math.max(1, Math.floor(index)) : 1;
  const cn = chineseNumber(normalizedIndex);
  if (normalizedDepth === 1) return `第${cn}章`;
  if (normalizedDepth === 2) return `第${cn}节`;
  if (normalizedDepth === 3) return `${cn}、`;
  if (normalizedDepth === 4) return `（${cn}）`;
  if (normalizedDepth === 5) return `${normalizedIndex}.`;
  if (normalizedDepth === 6) return `（${normalizedIndex}）`;
  const alphabet = alphabeticNumber(normalizedIndex);
  return normalizedDepth === 7 ? `${alphabet}.` : `（${alphabet}）`;
}

/**
 * 返回带圈数字标签。1–50 使用 Unicode 单字符，51 及以上返回普通数字，
 * 由文章 DOM 使用 CSS 圆圈渲染；纯文本导出可据此提供可读回退。
 *
 * @param index 一基末端节点序号。
 * @returns ①–㊿，或 51 及以上的十进制数字。
 */
export function circledNumberLabel(index: number): string {
  const normalizedIndex = Number.isFinite(index) ? Math.max(1, Math.floor(index)) : 1;
  if (normalizedIndex <= 20) return String.fromCodePoint(0x2460 + normalizedIndex - 1);
  if (normalizedIndex <= 35) return String.fromCodePoint(0x3251 + normalizedIndex - 21);
  if (normalizedIndex <= MAX_NATIVE_CIRCLED_NUMBER) return String.fromCodePoint(0x32b1 + normalizedIndex - 36);
  return String(normalizedIndex);
}

/**
 * 按编号末尾标点决定标题是否需要空格，使“第一章 标题”与“一、标题”“1.标题”等格式同时保持自然。
 *
 * @param label 已计算的文章编号。
 * @param title 节点标题文字。
 * @returns 可直接显示在文章和目录中的完整标题。
 */
export function articleDisplayTitle(label: string, title: string): string {
  if (!label) return title;
  return /[、.）]$/.test(label) ? `${label}${title}` : `${label} ${title}`;
}

/**
 * A node is an article heading when it owns local descendants or represents a
 * linked child map. A sub-map node is therefore still a chapter/section even
 * when its children live in another .mindmap file.
 */
export function isArticleHeading(node: MindMapNode): boolean {
  return node.children.length > 0 || Boolean(node.submap?.path);
}

/**
 * 判断当前物理导图是否关闭整页文章编号。中心节点本身不参与编号，
 * 因此保存在根节点上的 `none` 必须作用于该文件内全部正文标题和末端序号。
 * 普通非根节点的 `none` 仍只跳过该节点，不影响后代的结构层级。
 *
 * @param root 当前物理导图的中心节点。
 * @returns 根节点是否关闭当前文件的全部文章编号。
 */
export function isDocumentArticleNumberingDisabled(root: MindMapNode): boolean {
  return root.articleNumberingMode === "none";
}

/** 文章节点在自动、关闭或手动最高层级规则下的解析结果。 */
export interface ArticleNumberingResolution {
  level: number;
  isHeading: boolean;
  skipped: boolean;
  shouldNumber: boolean;
}

/**
 * 解析单个节点的文章编号状态。手动模式只覆盖当前节点所在子树的最高文章层级，
 * 不再强制末端节点标题化；同级中只要存在自然标题，普通末端节点也会按同级标题编号，
 * 从而避免首个“词义”等节点丢失序号。
 *
 * @param node 要解析的节点。
 * @param defaultLevel 根据父节点层级推导出的默认文章层级。
 * @param siblingHasHeading 当前同级中是否存在自然标题。
 * @returns 供文章正文、目录和子导图深度计算共同使用的编号状态。
 */
export function resolveArticleNumbering(node: MindMapNode, defaultLevel: number, siblingHasHeading: boolean): ArticleNumberingResolution {
  const mode = node.articleNumberingMode ?? "auto";
  const manual = mode === "manual";
  const requestedLevel = Number.isFinite(node.articleNumberingLevel) ? Math.floor(node.articleNumberingLevel ?? defaultLevel) : defaultLevel;
  const level = manual ? Math.min(MAX_ARTICLE_NUMBERING_LEVEL, Math.max(1, requestedLevel)) : Math.max(1, Math.floor(defaultLevel));
  const isHeading = isArticleHeading(node) || siblingHasHeading;
  return {
    level,
    isHeading,
    skipped: mode === "none",
    shouldNumber: mode !== "none" && isHeading && level <= MAX_ARTICLE_NUMBERING_LEVEL
  };
}

/**
 * 计算一个物理导图根节点的首级子节点应使用的文章层级。根节点的手动层级表示
 * 当前脑图正文的最高可见层级，文档标题本身不编号，一级子节点直接使用所选层级。
 *
 * @param root 当前物理导图的根节点。
 * @param baseDepth 当前文件根节点在跨文件文章中的基础层级。
 * @returns 首级子节点的默认文章层级。
 */
export function articleChildStartLevel(root: MindMapNode, baseDepth = 0): number {
  const normalizedBaseDepth = Math.max(0, Math.floor(baseDepth));
  return root.articleNumberingMode === "manual" && Number.isFinite(root.articleNumberingLevel)
    ? Math.min(MAX_ARTICLE_NUMBERING_LEVEL, Math.max(1, Math.floor(root.articleNumberingLevel ?? normalizedBaseDepth)))
    : normalizedBaseDepth + 1;
}

/**
 * ArticleNodeInfo 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ArticleNodeInfo {
  node: MindMapNode;
  depth: number;
  label: string;
  title: string;
  displayTitle: string;
  isHeading: boolean;
  /** Terminal body rendered with a generated article or circled number. */
  numberedLeaf: boolean;
  /** Numbering style used by a converted terminal body. */
  leafNumberingStyle?: ArticleLeafNumberingStyle;
  /** One-based terminal sibling index; used for CSS fallback after Unicode ㊿. */
  leafNumberingIndex?: number;
  skipped: boolean;
  anchor: string;
}

/**
 * ArticleTocEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ArticleTocEntry {
  filePath: string;
  nodeId?: string;
  /** 文章编号层级，例如 5 表示使用“1.”。 */
  depth: number;
  /** 目录中的相对结构层级；与手动编号层级相互独立。 */
  tocDepth: number;
  label: string;
  title: string;
  displayTitle: string;
  breadcrumb: string[];
}

/**
 * 返回目录项的相对结构层级。
 *
 * @param entry 文章目录项。
 * @returns 从 1 开始的目录结构层级。
 */
export function articleTocDepth(entry: ArticleTocEntry): number {
  return Number.isFinite(entry.tocDepth) ? Math.max(1, Math.floor(entry.tocDepth)) : 1;
}

/**
 * 解析文章和通读目录使用的最大相对结构层级。当前脑图存在覆盖值时优先使用，
 * 否则跟随插件全局设置；两者都异常时回退到 3 层。
 *
 * @param documentOverride 当前 .mindmap 文件保存的目录层级覆盖值。
 * @param pluginDefault 插件设置中的全局目录最大层级。
 * @returns 1 到 8 之间的有效目录最大层级。
 */
export function resolveArticleTocMaxDepth(documentOverride: number | undefined, pluginDefault: number): number {
  const source = typeof documentOverride === "number" && Number.isFinite(documentOverride) ? documentOverride : pluginDefault;
  return Math.max(1, Math.min(8, Math.round(Number.isFinite(source) ? source : 3)));
}

/** Navigation state shared by every physical article page in one map family. */
export interface ArticlePageNavigation {
  /** Physical sibling pages at the current structural level, never in-page child headings. */
  entries: ArticleTocEntry[];
  /** Current physical page index within entries. */
  currentIndex: number;
  homePath: string;
  parentPath?: string;
  /** Parent-map mount node used when returning from a child article page. */
  parentNodeId?: string;
  /** Numbering is disabled by the current document or one of its mounted ancestors. */
  numberingDisabled?: boolean;
}

/** 当前物理文章页及其同层兄弟页的解析结果。 */
export interface ArticleSiblingPageResolution {
  entries: ArticleTocEntry[];
  currentIndex: number;
  currentEntry?: ArticleTocEntry;
}

/** 比较两个目录面包屑片段是否完全一致。 */
function sameBreadcrumb(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * 从递归全书目录中提取当前物理文件对应的同层兄弟页面。目录中的普通节点仍用于目录展示，
 * 但不会进入上一篇/下一篇分页；因此打开“第一章”后会直接切换到“第二章”，而不会进入
 * 当前文件内部的“第一节、第二节”。嵌套页面按相同规则在其父级下寻找兄弟页。
 *
 * @param entries 整个父子导图家族的递归目录项。
 * @param currentFilePath 当前打开的物理 .mindmap 文件路径。
 * @returns 当前页面、同层兄弟页面及当前页面在兄弟列表中的位置。
 */
export function resolveArticleSiblingPages(entries: ArticleTocEntry[], currentFilePath: string): ArticleSiblingPageResolution {
  const currentEntry = entries.find((entry) => entry.filePath === currentFilePath && !entry.nodeId);
  if (!currentEntry) return { entries: [], currentIndex: 0 };
  const structuralDepth = articleTocDepth(currentEntry);
  const parentBreadcrumb = currentEntry.breadcrumb.slice(0, -1);
  const siblingEntries = entries.filter((entry) => (
    !entry.nodeId
    && articleTocDepth(entry) === structuralDepth
    && sameBreadcrumb(entry.breadcrumb.slice(0, -1), parentBreadcrumb)
  ));
  const currentIndex = siblingEntries.findIndex((entry) => entry.filePath === currentFilePath);
  return {
    entries: siblingEntries,
    currentIndex: Math.max(0, currentIndex),
    currentEntry
  };
}

/**
 * 返回文章页顶部应显示的目录编号标题。只有子导图物理页面使用该标题；顶层总目录文件
 * 继续使用自身中心节点标题，避免把第一章误显示为整本书标题。
 *
 * @param navigation 当前页面的文章分页上下文。
 * @returns 例如“第一章 世界”的完整标题；无法解析时返回 undefined。
 */
export function currentArticlePageEntry(navigation: ArticlePageNavigation | undefined): ArticleTocEntry | undefined {
  if (!navigation?.parentPath) return undefined;
  return navigation.entries[navigation.currentIndex];
}

/**
 * Build the article representation for one physical .mindmap file.
 * `baseDepth` is the absolute article depth represented by this file's root.
 * A manually configured node replaces its inferred highest level and its
 * descendants continue from that level. Heading/body classification remains
 * structural: leaf peers of headings become same-level headings, while an
 * isolated terminal node remains body text.
 *
 * @param root 当前物理导图的根节点。
 * @param baseDepth 根节点在整篇文章中的绝对基础层级。
 * @param leafNumbering 末端正文自动编号规则。
 * @param primaryText 读取节点主文字的回调；文章渲染器可注入单次规范化缓存。
 * @returns 按显示顺序展开的文章节点信息。
 */
export interface ArticleLeafNumberingOptions {
  enabled: boolean;
  threshold: number;
  /** Existing next-level article numbering or independent circled numbers. */
  style?: ArticleLeafNumberingStyle;
  /** Suppress heading and terminal labels inherited from an ancestor document. */
  numberingDisabled?: boolean;
}

/**
 * 展开文章节点，并按同一上级下的末端正文数量决定是否使用下一层序号。
 */
export function buildArticleNodeInfo(
  root: MindMapNode,
  baseDepth = 0,
  leafNumbering: ArticleLeafNumberingOptions = { enabled: false, threshold: 4 },
  primaryText: (node: MindMapNode) => string = nodePrimaryText
): ArticleNodeInfo[] {
  const result: ArticleNodeInfo[] = [];
  const documentNumberingDisabled = leafNumbering.numberingDisabled === true
    || isDocumentArticleNumberingDisabled(root);
  const visitChildren = (parent: MindMapNode, defaultLevel: number): void => {
    let siblingHasHeading = false;
    let terminalCount = 0;
    for (const child of parent.children) {
      if (isArticleHeading(child)) siblingHasHeading = true;
      else if (child.articleNumberingMode !== "none") terminalCount += 1;
    }
    const threshold = Math.max(1, Math.min(20, Math.floor(leafNumbering.threshold) || 4));
    const leafNumberingStyle: ArticleLeafNumberingStyle = leafNumbering.style === "circled" ? "circled" : "next-level";
    const hasSupportedLeafLabel = leafNumberingStyle === "circled" || defaultLevel <= MAX_ARTICLE_NUMBERING_LEVEL;
    const convertLeaves = !documentNumberingDisabled && leafNumbering.enabled && terminalCount >= threshold && hasSupportedLeafLabel;
    const numberedIndexes = new Map<number, number>();
    for (const child of parent.children) {
      const numbering = resolveArticleNumbering(child, defaultLevel, siblingHasHeading);
      const numberedLeaf = convertLeaves && !numbering.isHeading && !numbering.skipped;
      // A converted terminal body always belongs to the level directly below
      // its parent heading. Its own manual article-level metadata must not move
      // the generated prefix away from that structural level.
      const displayLevel = numberedLeaf ? defaultLevel : numbering.level;
      const numberedIndex = !documentNumberingDisabled && (numbering.shouldNumber || numberedLeaf) && !numbering.skipped
        ? (numberedIndexes.get(displayLevel) ?? 0) + 1
        : 0;
      if (numberedIndex) numberedIndexes.set(displayLevel, numberedIndex);
      const label = numberedIndex
        ? numberedLeaf && leafNumberingStyle === "circled"
          ? circledNumberLabel(numberedIndex)
          : articleNumberLabel(displayLevel, numberedIndex)
        : "";
      const title = primaryText(child) || (numbering.isHeading ? "未命名标题" : "");
      const plainTextLabel = numberedLeaf
        && leafNumberingStyle === "circled"
        && numberedIndex > MAX_NATIVE_CIRCLED_NUMBER
        ? `◯${label}`
        : label;
      result.push({
        node: child,
        depth: displayLevel,
        label,
        title,
        displayTitle: articleDisplayTitle(plainTextLabel, title),
        isHeading: numbering.isHeading,
        numberedLeaf,
        leafNumberingStyle: numberedLeaf ? leafNumberingStyle : undefined,
        leafNumberingIndex: numberedLeaf ? numberedIndex : undefined,
        skipped: numbering.skipped,
        anchor: `mindmap-article-${child.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`
      });
      if (child.children.length) visitChildren(child, numbering.level + 1);
    }
  };
  visitChildren(root, articleChildStartLevel(root, baseDepth));
  return result;
}

/**
 * 校验并规范化visible modes，并保持模型、界面和持久化状态的一致性。
 *
 * @param modes 该参数用于 normalize visible modes 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
export function normalizeVisibleModes(modes: unknown): DisplayMode[] {
  const raw = Array.isArray(modes) ? modes : [];
  const result: DisplayMode[] = [];
  for (const value of raw) {
    if ((value === "mindmap" || value === "outline" || value === "article" || value === "reading") && !result.includes(value)) result.push(value);
  }
  return result.length ? result : ["mindmap", "outline", "article", "reading"];
}
