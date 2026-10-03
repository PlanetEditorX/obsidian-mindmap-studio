/**
 * @file clipboard-import.ts
 * @description 编辑器剪贴板内容的节点分支解析。
 */

import {
  createNode,
  indentedTextToMarkdown,
  markdownToDocument,
  newId,
  parseFencedCode,
  normalizeDocument,
  type MindMapContentBlock,
  type MindMapNode
} from "../core/model";

/**
 * 将包含 fenced code 的剪贴板文本拆分为保持原顺序的文字块和代码块。
 *
 * @param text 剪贴板纯文本。
 * @returns 检测到代码围栏时返回内容块；未检测到时返回 null。
 */
export function parseClipboardContentBlocks(text: string): MindMapContentBlock[] | null {
  const fence = /```([^\n`]*)\n([\s\S]*?)\n```/g;
  const blocks: MindMapContentBlock[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  const appendText = (value: string): void => {
    const normalized = value.replace(/^\s*\n|\n\s*$/g, "");
    if (normalized.trim()) blocks.push({ id: newId(), type: "text", text: normalized });
  };
  while ((match = fence.exec(text)) !== null) {
    appendText(text.slice(cursor, match.index));
    const code = parseFencedCode(match[0]);
    if (code) blocks.push({ id: newId(), type: "code", code });
    cursor = match.index + match[0].length;
  }
  if (!blocks.some((block) => block.type === "code")) return null;
  appendText(text.slice(cursor));
  return blocks;
}

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

export interface ClipboardImageUrl {
  url: string;
  confident: boolean;
}

/**
 * 识别“仅包含一张远程图片”的剪贴板内容。
 * 明确的图片扩展名/格式参数可直接信任；无扩展名的 HTTP(S) 地址交给调用方探测。
 */
export function parseClipboardImageUrl(text: string, html = ""): ClipboardImageUrl | null {
  const decodeHtml = (value: string): string => value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  const trimmedHtml = html.trim();
  if (trimmedHtml) {
    if (typeof DOMParser !== "undefined") {
      const document = new DOMParser().parseFromString(trimmedHtml, "text/html");
      const images = Array.from(document.body.querySelectorAll("img"));
      const src = images[0]?.getAttribute("src")?.trim() ?? "";
      if (images.length === 1 && !document.body.textContent?.trim() && /^https?:\/\//i.test(src)) {
        return { url: src, confident: true };
      }
    }
    const images = Array.from(trimmedHtml.matchAll(/<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi));
    if (images.length === 1) {
      const remainder = trimmedHtml
        .replace(images[0]![0], "")
        .replace(/<\/?(?:a|body|html)\b[^>]*>/gi, "")
        .replace(/<meta\b[^>]*>/gi, "")
        .replace(/<!--[^]*?-->/g, "")
        .trim();
      const src = decodeHtml(images[0]![2] ?? "").trim();
      if (!remainder && /^https?:\/\//i.test(src)) return { url: src, confident: true };
    }
  }

  const value = text.trim();
  if (!/^https?:\/\/\S+$/i.test(value)) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const pathname = decodeURIComponent(parsed.pathname).toLowerCase();
    const directExtension = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(pathname);
    const imageParam = Array.from(parsed.searchParams.entries()).some(([key, raw]) => {
      const name = key.toLowerCase();
      const param = raw.toLowerCase();
      return ((name === "fm" || name === "format" || name === "ext") && /^(?:avif|bmp|gif|jpe?g|png|svg|webp)$/.test(param))
        || ((name === "type" || name === "content-type" || name === "mime") && /^image\/(?:avif|bmp|gif|jpe?g|png|svg\+xml|webp)$/.test(param));
    });
    return { url: value, confident: directExtension || imageParam };
  } catch {
    return null;
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
