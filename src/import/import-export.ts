/**
 * @file import-export.ts
 * @description 导入导出领域的 XMind 与文章文档转换工具。
 */

import { strFromU8, unzipSync } from "fflate";
import { createDefaultDocument, createNode, nodePlainText, type MindMapDocument, type MindMapNode } from "../core/model";
import type { ReadingSection } from "../article/modes";

/** Minimal modern XMind topic shape used during import. */
type XMindTopic = {
  title?: string;
  notes?: { plain?: { content?: string } };
  children?: { attached?: XMindTopic[]; detached?: XMindTopic[] };
};

/**
 * Imports a modern XMind archive containing content.json.
 *
 * @param source Raw .xmind bytes.
 * @param fallbackTitle Filename-derived fallback title.
 * @returns Imported mind-map document.
 */
export function xmindToDocument(source: ArrayBuffer, fallbackTitle = "XMind 导入"): MindMapDocument {
  const archive = unzipSync(new Uint8Array(source));
  const content = archive["content.json"];
  if (!content) throw new Error("仅支持包含 content.json 的新版 XMind 文件");
  const sheets = JSON.parse(strFromU8(content)) as Array<{ title?: string; rootTopic?: XMindTopic }>;
  const sheet = sheets.find((item) => item.rootTopic) ?? sheets[0];
  if (!sheet?.rootTopic) throw new Error("XMind 文件中没有可导入的主题");
  const convert = (topic: XMindTopic): MindMapNode => {
    const node = createNode(topic.title?.trim() || "未命名主题");
    node.note = topic.notes?.plain?.content?.trim() || undefined;
    const children = [...(topic.children?.attached ?? []), ...(topic.children?.detached ?? [])];
    node.children = children.map(convert);
    return node;
  };
  const root = convert(sheet.rootTopic);
  const title = root.text || sheet.title || fallbackTitle;
  return { ...createDefaultDocument(title), title, root };
}

const escapeHtml = (value: string): string => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

/**
 * Produces a standalone article-style HTML document suitable for browsers,
 * Word-compatible .doc files, and printing to PDF.
 *
 * @param document Mind-map document to export.
 * @returns Complete HTML source.
 */
export function documentToHtml(document: MindMapDocument): string {
  return readingSectionsToHtml([{ filePath: "", document, baseDepth: 0 }]);
}

/**
 * Produces one portable article from a map and all recursively collected child
 * maps in the same order used by continuous reading mode.
 *
 * @param sections Ordered physical maps to merge.
 * @returns Complete standalone HTML source.
 */
export function readingSectionsToHtml(sections: ReadingSection[]): string {
  const renderNode = (node: MindMapNode, depth: number): string => {
    const level = Math.min(6, Math.max(2, depth + 1));
    const title = escapeHtml(nodePlainText(node) || "未命名");
    const noteClass = node.note && Array.from(node.note).length > 42 ? "note is-multiline" : "note";
    const note = node.note ? `<p class="${noteClass}">${escapeHtml(node.note)}</p>` : "";
    if (!node.children.length && !node.submap) {
      const paragraphClass = Array.from(nodePlainText(node)).length > 42 ? "body-paragraph is-multiline" : "body-paragraph";
      return `<p class="${paragraphClass}">${title}</p>${note}`;
    }
    const children = node.children.map((child) => renderNode(child, depth + 1)).join("");
    return `<section><h${level}>${title}</h${level}>${note}${children}</section>`;
  };
  const first = sections[0]?.document;
  const title = escapeHtml(first ? (nodePlainText(first.root) || first.title) : "导出文档");
  const body = sections.map(({ document, baseDepth }, index) => {
    const sectionTitle = escapeHtml(nodePlainText(document.root) || document.title);
    const headingLevel = Math.min(6, Math.max(1, baseDepth + 1));
    const heading = index === 0 ? "" : `<h${headingLevel}>${sectionTitle}</h${headingLevel}>`;
    return `<section class="map-section">${heading}${document.root.children.map((child) => renderNode(child, baseDepth + 1)).join("")}</section>`;
  }).join("");
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title><style>
body{max-width:860px;margin:40px auto;padding:0 28px;color:#20242c;font:16px/1.85 system-ui,"Microsoft YaHei",sans-serif}
h1{text-align:center;border-bottom:2px solid #ddd;padding-bottom:18px}h2,h3,h4,h5,h6{margin-top:1.7em;color:#172033}
section{break-inside:auto}.map-section+.map-section{margin-top:3em;border-top:1px solid #ddd}.body-paragraph{margin:.75em 0;text-align:justify}.note{padding:10px 14px;color:#555;background:#f6f7f9;border-left:3px solid #6366f1}
.is-multiline{text-indent:2em}
@media print{body{margin:0;max-width:none}a{color:inherit}}
</style></head><body><article><h1>${title}</h1>${body}</article></body></html>`;
}
