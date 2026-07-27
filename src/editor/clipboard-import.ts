/**
 * @file clipboard-import.ts
 * @description 编辑器剪贴板内容的节点分支解析。
 */

import {
  createNode,
  indentedTextToMarkdown,
  markdownToDocument,
  normalizeDocument,
  type MindMapNode
} from "../core/model";

/**
 * 解析剪贴板载荷中的一个或多个 MindMap Studio 节点，并保留多选分支的复制顺序。
 *
 * @param text 包含插件 JSON 载荷的剪贴板纯文本。
 * @returns 按剪贴板顺序规范化后的节点；没有可识别节点内容时返回 null。
 */
export function parseClipboardNodes(text: string): MindMapNode[] | null {
  try {
    const parsed = JSON.parse(text) as {
      type?: string;
      nodes?: Partial<MindMapNode>[];
    };
    const inputs = parsed.type === "mindmap-studio-nodes" && Array.isArray(parsed.nodes)
      ? parsed.nodes
      : [];
    if (!inputs.length) return null;
    return inputs.map((input) => normalizeDocument(
      { title: input.text ?? "粘贴节点", root: input as MindMapNode },
      input.text ?? "粘贴节点"
    ).root);
  } catch {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const looksLikeMarkdown = /^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/m.test(trimmed);
    if (looksLikeMarkdown || trimmed.includes("\n")) {
      const markdown = looksLikeMarkdown ? trimmed : indentedTextToMarkdown(text);
      const document = markdownToDocument(markdown, "粘贴内容");
      if (document.root.text === "粘贴内容") {
        if (document.root.children.length === 1) {
          return document.root.children[0] ? [document.root.children[0]] : null;
        }
        // Multiple children: unwrap directly without the wrapper node
        return document.root.children.length ? document.root.children : null;
      }
      return [document.root];
    }
    return [createNode(trimmed)];
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
  // Multiple roots: unwrap directly, the caller wraps in its own parent
  const root = createNode("粘贴内容");
  root.children = roots;
  return roots.length ? root : null;
}
