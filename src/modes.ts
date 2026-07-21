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

export function isArticleHeading(node: MindMapNode): boolean {
  return node.children.length > 0;
}

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

export function buildArticleNodeInfo(root: MindMapNode): ArticleNodeInfo[] {
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
  visitChildren(root, 1);
  return result;
}

export function normalizeVisibleModes(modes: unknown): DisplayMode[] {
  const raw = Array.isArray(modes) ? modes : [];
  const result: DisplayMode[] = [];
  for (const value of raw) {
    if ((value === "mindmap" || value === "outline" || value === "article") && !result.includes(value)) result.push(value);
  }
  return result.length ? result : ["mindmap", "outline", "article"];
}
