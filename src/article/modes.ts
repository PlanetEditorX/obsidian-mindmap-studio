/**
 * @file modes.ts
 * @description 文章领域与显示模式共享的编号工具。
 *
 * 导图、大纲和文章模式读取同一节点树；本模块负责中文序号、标题判定、手动文章层级、子导图层级续接与可见模式容错。
 */

import type { DisplayMode, MindMapDocument, MindMapNode } from "../core/model";
import { nodePrimaryText } from "../core/model";

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  mindmap: "导图",
  outline: "大纲",
  article: "文章",
  reading: "通读"
};

export const DISPLAY_MODE_ICONS: Record<DisplayMode, string> = {
  mindmap: "brain-circuit",
  outline: "list-tree",
  article: "notebook-text",
  reading: "book-open-text"
};

/** One physical map merged into the continuous reading view. */
export interface ReadingSection {
  filePath: string;
  document: MindMapDocument;
  baseDepth: number;
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

/**
 * 将文章标题层级和同级序号转换为“第一章、第一节、一、（一）、1.、（1）”等常见中文文章编号，更深层级使用可读的循环规则。
 *
 * @param depth 节点在文章结构中的一基层级。
 * @param index 当前元素在同级或列表中的一基序号。
 * @returns 对应层级的文章编号文本。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function articleNumberLabel(depth: number, index: number): string {
  const cn = chineseNumber(index);
  if (depth === 1) return `第${cn}章`;
  if (depth === 2) return `第${cn}节`;
  if (depth === 3) return `${cn}、`;
  if (depth === 4) return `（${cn}）`;
  if (depth === 5) return `${index}.`;
  if (depth === 6) return `（${index}）`;
  const alphabet = String.fromCharCode(64 + ((index - 1) % 26) + 1);
  return depth % 2 === 1 ? `${alphabet}.` : `（${alphabet}）`;
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

/** 文章节点在自动、关闭或手动层级规则下的解析结果。 */
export interface ArticleNumberingResolution {
  level: number;
  isHeading: boolean;
  skipped: boolean;
  shouldNumber: boolean;
}

/**
 * 解析单个节点的文章编号状态。手动模式会强制末端节点作为标题，并使用指定层级；关闭模式兼容旧版 skipArticleNumbering 字段。
 *
 * @param node 要解析的节点。
 * @param defaultLevel 根据父节点层级推导出的默认文章层级。
 * @param siblingHasHeading 当前同级中是否存在自然标题或手动标题。
 * @returns 供文章正文、目录和子导图深度计算共同使用的编号状态。
 */
export function resolveArticleNumbering(node: MindMapNode, defaultLevel: number, siblingHasHeading: boolean): ArticleNumberingResolution {
  const mode = node.articleNumberingMode ?? (node.skipArticleNumbering === true ? "none" : "auto");
  const manual = mode === "manual";
  const requestedLevel = Number.isFinite(node.articleNumberingLevel) ? Math.floor(node.articleNumberingLevel ?? defaultLevel) : defaultLevel;
  const level = manual ? Math.min(8, Math.max(1, requestedLevel)) : Math.max(1, Math.floor(defaultLevel));
  return {
    level,
    isHeading: isArticleHeading(node) || manual,
    skipped: mode === "none",
    shouldNumber: mode === "manual" || (mode === "auto" && siblingHasHeading)
  };
}

/**
 * 计算一个物理导图根节点的首级子节点应使用的文章层级。根节点手动层级只作为基准，不会给文档标题本身添加编号。
 *
 * @param root 当前物理导图的根节点。
 * @param baseDepth 当前文件根节点在跨文件文章中的基础层级。
 * @returns 首级子节点的默认文章层级。
 */
export function articleChildStartLevel(root: MindMapNode, baseDepth = 0): number {
  const normalizedBaseDepth = Math.max(0, Math.floor(baseDepth));
  const rootBaseDepth = root.articleNumberingMode === "manual" && Number.isFinite(root.articleNumberingLevel)
    ? Math.min(8, Math.max(1, Math.floor(root.articleNumberingLevel ?? normalizedBaseDepth)))
    : normalizedBaseDepth;
  return rootBaseDepth + 1;
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
  skipped: boolean;
  anchor: string;
}

/**
 * ArticleTocEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ArticleTocEntry {
  filePath: string;
  nodeId?: string;
  depth: number;
  label: string;
  title: string;
  displayTitle: string;
  breadcrumb: string[];
}

/** Navigation state shared by every page in one article map family. */
export interface ArticlePageNavigation {
  entries: ArticleTocEntry[];
  currentIndex: number;
  homePath: string;
  parentPath?: string;
}

/**
 * Build the article representation for one physical .mindmap file.
 * `baseDepth` is the absolute article depth represented by this file's root.
 * A manually configured node replaces its inferred level and its descendants
 * continue from that level. Manually configured leaf nodes become headings.
 *
 * @param root 当前物理导图的根节点。
 * @param baseDepth 根节点在整篇文章中的绝对基础层级。
 * @returns 按显示顺序展开的文章节点信息。
 */
export function buildArticleNodeInfo(root: MindMapNode, baseDepth = 0): ArticleNodeInfo[] {
  const result: ArticleNodeInfo[] = [];
  const visitChildren = (parent: MindMapNode, defaultLevel: number): void => {
    const siblingHasHeading = parent.children.some((child) => isArticleHeading(child) || child.articleNumberingMode === "manual");
    const numberedIndexes = new Map<number, number>();
    for (const child of parent.children) {
      const numbering = resolveArticleNumbering(child, defaultLevel, siblingHasHeading);
      const numberedIndex = numbering.shouldNumber && !numbering.skipped
        ? (numberedIndexes.get(numbering.level) ?? 0) + 1
        : 0;
      if (numberedIndex) numberedIndexes.set(numbering.level, numberedIndex);
      const label = numberedIndex ? articleNumberLabel(numbering.level, numberedIndex) : "";
      const title = nodePrimaryText(child) || (numbering.isHeading ? "未命名标题" : "");
      result.push({
        node: child,
        depth: numbering.level,
        label,
        title,
        displayTitle: articleDisplayTitle(label, title),
        isHeading: numbering.isHeading,
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
