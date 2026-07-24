/**
 * @file clipboard-import.ts
 * @description 将 JSON、Markdown、缩进文本和 HTML 列表解析为可粘贴的节点分支。
 */

import {
  createNode,
  indentedTextToMarkdown,
  markdownToDocument,
  normalizeDocument,
  type MindMapNode
} from "./model";

/**
 * 解析剪贴板纯文本中的节点 JSON、Markdown 或缩进文本。
 *
 * @param text 剪贴板纯文本。
 * @returns 解析后的节点分支；空内容或不支持的 JSON 返回 null。
 */
export function parseClipboardNode(text: string): MindMapNode | null {
  try {
    const parsed = JSON.parse(text) as {
      type?: string;
      node?: Partial<MindMapNode>;
      root?: Partial<MindMapNode>;
      text?: string;
      children?: unknown[];
    };
    const input = (parsed.type === "mindmap-studio-node"
      || parsed.type === "mmc-lite-node"
      || parsed.type === "smm-lite-node") && parsed.node
      ? parsed.node
      : parsed.root ?? (typeof parsed.text === "string" && Array.isArray(parsed.children) ? parsed : null);
    if (!input) return null;
    return normalizeDocument(
      { title: input.text ?? "粘贴节点", root: input as MindMapNode },
      input.text ?? "粘贴节点"
    ).root;
  } catch {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const looksLikeMarkdown = /^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/m.test(trimmed);
    if (looksLikeMarkdown || trimmed.includes("\n")) {
      const markdown = looksLikeMarkdown ? trimmed : indentedTextToMarkdown(text);
      const document = markdownToDocument(markdown, "粘贴内容");
      if (document.root.text === "粘贴内容" && document.root.children.length === 1) {
        return document.root.children[0] ?? null;
      }
      return document.root;
    }
    return createNode(trimmed);
  }
}

/**
 * 解析富剪贴板提供的嵌套 HTML 列表。
 *
 * @param html 剪贴板 HTML。
 * @returns 解析后的节点分支；没有列表时返回 null。
 */
export function parseClipboardHtml(html: string): MindMapNode | null {
  if (!html.trim() || typeof DOMParser === "undefined") return null;
  const document = new DOMParser().parseFromString(html, "text/html");
  const firstList = document.body.querySelector("ul, ol");
  if (!firstList) return null;
  const parseItem = (item: Element): MindMapNode => {
    const clone = item.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("ul, ol").forEach((list) => list.remove());
    const node = createNode(clone.textContent?.trim() || "节点");
    const nested = Array.from(item.children).find((child) => child.matches("ul, ol"));
    if (nested) {
      node.children = Array.from(nested.children)
        .filter((child) => child.matches("li"))
        .map(parseItem);
    }
    return node;
  };
  const roots = Array.from(firstList.children)
    .filter((child) => child.matches("li"))
    .map(parseItem);
  if (!roots.length) return null;
  if (roots.length === 1) return roots[0] ?? null;
  const root = createNode("粘贴内容");
  root.children = roots;
  return root;
}
