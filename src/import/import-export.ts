/**
 * @file import-export.ts
 * @description 导入导出领域的 XMind 与文章文档转换工具。
 */

import { strFromU8, unzipSync } from "fflate";
import { createDefaultDocument, createNode, nodePlainText, type MindMapDocument, type MindMapNode } from "../core/model";
import { buildArticleNodeInfo, type ReadingSection } from "../article/modes";

/** 新版 XMind 导入时需要保留的主题字段与画布链接。 */
type XMindTopic = {
  id?: string;
  title?: string;
  notes?: { plain?: { content?: string } };
  href?: string;
  children?: Record<string, XMindTopic[] | undefined>;
};

/** 新版 XMind 画布及其根主题的最小数据形状。 */
type XMindSheet = {
  id?: string;
  title?: string;
  rootTopic?: XMindTopic;
};

/**
 * 导入包含 content.json 的新版 XMind 归档，保留嵌套主题、画布链接和未链接画布。
 *
 * @param source Raw .xmind bytes.
 * @param fallbackTitle Filename-derived fallback title.
 * @returns Imported mind-map document.
 */
export function xmindToDocument(source: ArrayBuffer, fallbackTitle = "XMind 导入"): MindMapDocument {
  const archive = unzipSync(new Uint8Array(source));
  const content = archive["content.json"];
  if (!content) throw new Error("仅支持包含 content.json 的新版 XMind 文件");
  const sheets = JSON.parse(strFromU8(content)) as XMindSheet[];
  const sheet = sheets.find((item) => item.rootTopic) ?? sheets[0];
  if (!sheet?.rootTopic) throw new Error("XMind 文件中没有可导入的主题");
  const sheetById = new Map<string, XMindSheet>();
  for (const item of sheets) {
    if (item.id) sheetById.set(item.id, item);
    if (item.rootTopic?.id) sheetById.set(item.rootTopic.id, item);
  }
  const importedSheets = new Set<XMindSheet>();
  const sheetReference = (topic: XMindTopic): string | null => {
    const match = topic.href?.match(/(?:xmind:)?#([^?#]+)/i);
    return match?.[1] ?? null;
  };
  const convert = (topic: XMindTopic): MindMapNode => {
    const node = createNode(topic.title?.trim() || "未命名主题");
    node.note = topic.notes?.plain?.content?.trim() || undefined;
    const children = Object.values(topic.children ?? {}).flatMap((items) => items ?? []);
    node.children = children.map(convert);
    return node;
  };
  const convertSheet = (current: XMindSheet, ancestors: Set<XMindSheet>): MindMapNode => {
    const rootTopic = current.rootTopic;
    if (!rootTopic) return createNode(current.title?.trim() || "未命名画布");
    importedSheets.add(current);
    ancestors.add(current);
    const root = convert(rootTopic);
    const attachLinkedSheets = (topic: XMindTopic, node: MindMapNode): void => {
      const linkedSheet = sheetById.get(sheetReference(topic) ?? "");
      if (linkedSheet?.rootTopic && !ancestors.has(linkedSheet)) {
        const linkedRoot = convertSheet(linkedSheet, ancestors);
        if (linkedRoot.text === node.text) node.children.push(...linkedRoot.children);
        else node.children.push(linkedRoot);
      }
      const topicChildren = Object.values(topic.children ?? {}).flatMap((items) => items ?? []);
      topicChildren.forEach((child, index) => {
        const childNode = node.children[index];
        if (childNode) attachLinkedSheets(child, childNode);
      });
    };
    attachLinkedSheets(rootTopic, root);
    ancestors.delete(current);
    return root;
  };
  const root = convertSheet(sheet, new Set());
  for (const extraSheet of sheets) {
    if (extraSheet.rootTopic && !importedSheets.has(extraSheet)) root.children.push(convertSheet(extraSheet, new Set()));
  }
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
  const renderArticleNode = (document: MindMapDocument, baseDepth: number): string => buildArticleNodeInfo(document.root, baseDepth)
    .map((info) => {
      const title = escapeHtml(info.displayTitle || info.title || "未命名");
      const note = info.node.note ? `<p class="note">${escapeHtml(info.node.note)}</p>` : "";
      if (!info.isHeading) return `<p class="body-paragraph">${title}</p>${note}`;
      const level = Math.min(6, Math.max(2, info.depth + 1));
      return `<section><h${level}>${title}</h${level}>${note}</section>`;
    })
    .join("");
  const first = sections[0]?.document;
  const title = escapeHtml(first ? (nodePlainText(first.root) || first.title) : "导出文档");
  const body = sections.map(({ document, baseDepth }, index) => {
    const sectionTitle = escapeHtml(nodePlainText(document.root) || document.title);
    const headingLevel = Math.min(6, Math.max(1, baseDepth + 1));
    const heading = index === 0 ? "" : `<h${headingLevel}>${sectionTitle}</h${headingLevel}>`;
    return `<section class="map-section">${heading}${renderArticleNode(document, baseDepth)}</section>`;
  }).join("");
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title><style>
body{max-width:860px;margin:40px auto;padding:0 28px;color:#20242c;font:16px/1.85 system-ui,"Microsoft YaHei",sans-serif}
h1{text-align:center;border-bottom:2px solid #ddd;padding-bottom:18px}h2,h3,h4,h5,h6{margin-top:1.7em;color:#172033}
section{break-inside:auto}.map-section+.map-section{margin-top:3em;border-top:1px solid #ddd}.body-paragraph{margin:.75em 0;text-align:justify;text-indent:2em}.note{padding:10px 14px;color:#555;background:#f6f7f9;border-left:3px solid #6366f1}
@media print{body{margin:0;max-width:none}a{color:inherit}}
</style></head><body><article><h1>${title}</h1>${body}</article></body></html>`;
}
