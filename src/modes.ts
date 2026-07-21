/**
 * @file modes.ts
 * @description 三种显示模式共享的模式与文章编号工具。
 *
 * 导图、大纲和文章模式读取同一节点树；本模块负责中文序号、标题判定、子导图层级续接与可见模式容错。
 */

import type { DisplayMode, MindMapNode } from "./model";
import { nodePrimaryText } from "./model";

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  mindmap: "导图",
  outline: "大纲",
  article: "文章"
};

export const DISPLAY_MODE_ICONS: Record<DisplayMode, string> = {
  mindmap: "brain-circuit",
  outline: "list-tree",
  article: "notebook-text"
};

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
 * 将文章标题深度和同级序号转换为“第一章、第一节、一、（一）、1.、（1）”等常见中文文章编号，更深层级使用可读的循环规则。
 *
 * @param depth 节点在树或文章结构中的零基层级。
 * @param index 当前元素在同级或列表中的零基索引。
 * @returns 计算、解析或序列化后的字符串结果。
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
 * A node is an article heading when it owns local descendants or represents a
 * linked child map. A sub-map node is therefore still a chapter/section even
 * when its children live in another .mindmap file.
 */
export function isArticleHeading(node: MindMapNode): boolean {
  return node.children.length > 0 || Boolean(node.submap?.path);
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
  nodeId: string;
  depth: number;
  label: string;
  title: string;
  displayTitle: string;
  breadcrumb: string[];
}

/**
 * Build the article representation for one physical .mindmap file.
 * `baseDepth` is the absolute article depth represented by this file's root.
 * For a top-level map it is 0; for a child map linked from a chapter it is 1,
 * so that the child map's first descendants become sections rather than a new
 * set of chapters.
 */
export function buildArticleNodeInfo(root: MindMapNode, baseDepth = 0): ArticleNodeInfo[] {
  const result: ArticleNodeInfo[] = [];
  const visitChildren = (parent: MindMapNode, depth: number): void => {
    let numberedIndex = 0;
    for (const child of parent.children) {
      const isHeading = isArticleHeading(child);
      const skipped = child.skipArticleNumbering === true;
      if (isHeading && !skipped) numberedIndex += 1;
      const label = isHeading && !skipped ? articleNumberLabel(depth, numberedIndex) : "";
      const title = nodePrimaryText(child) || (isHeading ? "未命名标题" : "");
      const displayTitle = label ? `${label} ${title}` : title;
      result.push({
        node: child,
        depth,
        label,
        title,
        displayTitle,
        isHeading,
        skipped,
        anchor: `mindmap-article-${child.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`
      });
      if (child.children.length) visitChildren(child, depth + 1);
    }
  };
  visitChildren(root, Math.max(0, baseDepth) + 1);
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
    if ((value === "mindmap" || value === "outline" || value === "article") && !result.includes(value)) result.push(value);
  }
  return result.length ? result : ["mindmap", "outline", "article"];
}
