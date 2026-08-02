/**
 * @file import-export.ts
 * @description 导入导出领域的 XMind 与文章文档转换工具。
 */

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { createDefaultDocument, createNode, nodePlainText, type ArticleLeafNumberingStyle, type MindMapDocument, type MindMapNode } from "../core/model";
import { buildArticleNodeInfo, type ArticleLeafNumberingOptions, type ArticleNodeInfo, type ReadingSection } from "../article/modes";

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

/** Global defaults used when a physical document does not override terminal numbering. */
export interface ArticleExportOptions {
  leafNumberingEnabled?: boolean;
  leafNumberingStyle?: ArticleLeafNumberingStyle;
  leafNumberingThreshold?: number;
}

/** Resolves terminal numbering with per-document style taking precedence over plugin defaults. */
function exportLeafNumbering(document: MindMapDocument, options: ArticleExportOptions): ArticleLeafNumberingOptions {
  return {
    enabled: document.articleStyle?.leafNumberingEnabled ?? options.leafNumberingEnabled ?? false,
    style: document.articleStyle?.leafNumberingStyle ?? options.leafNumberingStyle ?? "next-level",
    threshold: document.articleStyle?.leafNumberingThreshold ?? options.leafNumberingThreshold ?? 4
  };
}

/** Returns HTML title markup with a font-independent CSS ring for every circled terminal number. */
function htmlArticleDisplayTitle(info: ArticleNodeInfo): string {
  const title = escapeHtml(info.title || "未命名");
  if (info.numberedLeaf && info.leafNumberingStyle === "circled") {
    return `<span class="circled-number">${String(info.leafNumberingIndex ?? 1)}</span> ${title}`;
  }
  return escapeHtml(info.displayTitle || info.title || "未命名");
}

/** 生成跨文件导出时稳定且唯一的标题锚点。 */
function exportAnchor(sectionIndex: number, anchor: string): string {
  return `export-${sectionIndex}-${anchor}`;
}

/** 返回带目录编号的 Markdown 标题文本。 */
function markdownTitle(label: string, title: string, fallback = "未命名"): string {
  return [label, title || fallback].filter(Boolean).join(label && /[、.）]$/.test(label) ? "" : " ");
}

/** 返回跨文件目录项映射键。 */
function parentNodeKey(filePath: string | undefined, nodeId: string | undefined): string | null {
  return filePath && nodeId ? `${filePath}\u0000${nodeId}` : null;
}

/** 返回导出目录允许显示的层级。 */
function normalizedExportTocMaxDepth(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.min(8, Math.round(value))) : 3;
}

/** 生成兼容常用 Markdown 渲染器的标题片段。 */
function markdownHeading(level: number, title: string): string {
  return `${"#".repeat(level)} ${title}`;
}

/** 按常见 Markdown 标题规则生成目录片段。 */
function markdownAnchor(title: string): string {
  return title
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

/** 将扁平的层级目录条目转换为兼容 Word 的嵌套列表。 */
function htmlTocList(items: Array<{ depth: number; title: string; anchor: string }>): string {
  /** 嵌套目录中的单个章节及其下级章节。 */
  type TocBranch = { item: { title: string; anchor: string }; children: TocBranch[] };
  const root: TocBranch[] = [];
  const stack: Array<{ depth: number; children: TocBranch[] }> = [{ depth: 0, children: root }];
  for (const item of items) {
    while (stack.length > 1 && item.depth <= stack.at(-1)!.depth) stack.pop();
    const branch: TocBranch = { item, children: [] };
    stack.at(-1)!.children.push(branch);
    stack.push({ depth: item.depth, children: branch.children });
  }
  const renderBranches = (branches: TocBranch[]): string => branches.length
    ? `<ul>${branches.map((branch) => `<li><a href="#${branch.item.anchor}">${branch.item.title}</a>${renderBranches(branch.children)}</li>`).join("")}</ul>`
    : "";
  return renderBranches(root);
}

/** 转义 OOXML 文本内容。 */
function escapeXml(value: string): string {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

/** 将导出章节收集为父子导图顺序一致的目录项。 */
function collectExportTocItems(
  sections: ReadingSection[],
  maxTocDepth: number,
  includeTerminalHeadings = true,
  options: ArticleExportOptions = {}
): Array<{ depth: number; title: string; anchor: string }> {
  const items: Array<{ depth: number; title: string; anchor: string }> = [];
  const childSections = new Map<string, number>();
  sections.forEach((section, index) => {
    const key = parentNodeKey(section.parentFilePath, section.parentNodeId);
    if (key) childSections.set(key, index);
  });
  const collect = (sectionIndex: number, visited = new Set<number>()): void => {
    if (visited.has(sectionIndex)) return;
    visited.add(sectionIndex);
    const section = sections[sectionIndex];
    if (!section) return;
    const push = (depth: number, title: string, anchor: string): void => {
      if (depth <= maxTocDepth) items.push({ depth, title, anchor });
    };
    if (sectionIndex > 0 && !parentNodeKey(section.parentFilePath, section.parentNodeId)) {
      push(Math.max(1, section.baseDepth), nodePlainText(section.document.root) || section.document.title, exportAnchor(sectionIndex, `section-${sectionIndex}`));
    }
    for (const info of buildArticleNodeInfo(section.document.root, section.baseDepth, exportLeafNumbering(section.document, options))) {
      const title = info.displayTitle || info.title || "未命名";
      const childIndex = childSections.get(`${section.filePath}\u0000${info.node.id}`);
      if (childIndex !== undefined) {
        push(Math.max(1, info.depth), title, exportAnchor(childIndex, `section-${childIndex}`));
        collect(childIndex, visited);
      } else if (info.isHeading && (includeTerminalHeadings || info.node.children.length > 0)) {
        push(Math.max(1, info.depth), title, exportAnchor(sectionIndex, info.anchor));
      }
    }
  };
  collect(0);
  return items;
}

/**
 * Produces one portable article from a map and all recursively collected child
 * maps in the same order used by continuous reading mode.
 *
 * @param sections Ordered physical maps to merge.
 * @param tocMaxDepth Maximum exported TOC depth resolved from current/global article settings.
 * @returns Complete standalone HTML source.
 */
export function readingSectionsToHtml(sections: ReadingSection[], tocMaxDepth = 3, options: ArticleExportOptions = {}): string {
  const maxTocDepth = normalizedExportTocMaxDepth(tocMaxDepth);
  const tocItems: Array<{ depth: number; title: string; anchor: string }> = [];
  const childSectionAnchors = new Map<string, string>();
  const childSectionIndexes = new Map<string, number>();
  sections.forEach((section, index) => {
    const key = parentNodeKey(section.parentFilePath, section.parentNodeId);
    if (key) {
      childSectionAnchors.set(key, exportAnchor(index, `section-${index}`));
      childSectionIndexes.set(key, index);
    }
  });
  const pushTocItem = (depth: number, title: string, anchor: string): void => {
    if (depth <= maxTocDepth) tocItems.push({ depth, title, anchor });
  };
  const collectTocItems = (sectionIndex: number, visited = new Set<number>()): void => {
    if (visited.has(sectionIndex)) return;
    visited.add(sectionIndex);
    const section = sections[sectionIndex];
    if (!section) return;
    if (sectionIndex > 0 && !parentNodeKey(section.parentFilePath, section.parentNodeId)) {
      pushTocItem(Math.max(1, section.baseDepth), escapeHtml(nodePlainText(section.document.root) || section.document.title), exportAnchor(sectionIndex, `section-${sectionIndex}`));
    }
    for (const info of buildArticleNodeInfo(section.document.root, section.baseDepth, exportLeafNumbering(section.document, options))) {
      const title = htmlArticleDisplayTitle(info);
      const key = `${section.filePath}\u0000${info.node.id}`;
      const childSectionIndex = childSectionIndexes.get(key);
      if (childSectionIndex !== undefined) {
        pushTocItem(Math.max(1, info.depth), title, exportAnchor(childSectionIndex, `section-${childSectionIndex}`));
        collectTocItems(childSectionIndex, visited);
      } else if (info.isHeading) {
        pushTocItem(Math.max(1, info.depth), title, exportAnchor(sectionIndex, info.anchor));
      }
    }
  };
  const renderArticleNode = (filePath: string, document: MindMapDocument, baseDepth: number, sectionIndex: number): string => buildArticleNodeInfo(document.root, baseDepth, exportLeafNumbering(document, options))
    .map((info) => {
      const title = htmlArticleDisplayTitle(info);
      const childSectionAnchor = childSectionAnchors.get(`${filePath}\u0000${info.node.id}`);
      if (childSectionAnchor) return "";
      const note = info.node.note ? `<p class="note">${escapeHtml(info.node.note)}</p>` : "";
      if (!info.isHeading) return `<p class="body-paragraph">${title}</p>${note}`;
      const level = Math.min(6, Math.max(2, info.depth + 1));
      const anchor = exportAnchor(sectionIndex, info.anchor);
      return `<section><h${level} id="${anchor}"><a name="${anchor}"></a>${title}</h${level}>${note}</section>`;
    })
    .join("");
  const first = sections[0]?.document;
  const title = escapeHtml(first ? (nodePlainText(first.root) || first.title) : "导出文档");
  const body = sections.map(({ filePath, document, baseDepth }, index) => {
    const sectionTitle = escapeHtml(nodePlainText(document.root) || document.title);
    const headingLevel = Math.min(6, Math.max(1, baseDepth + 1));
    const sectionAnchor = exportAnchor(index, `section-${index}`);
    const heading = index === 0 ? "" : `<h${headingLevel} id="${sectionAnchor}"><a name="${sectionAnchor}"></a>${sectionTitle}</h${headingLevel}>`;
    return `<section class="map-section">${heading}${renderArticleNode(filePath, document, baseDepth, index)}</section>`;
  }).join("");
  collectTocItems(0);
  tocItems.splice(0, tocItems.length, ...collectExportTocItems(sections, maxTocDepth, true, options).map((item) => ({ ...item, title: escapeHtml(item.title) })));
  const toc = tocItems.length
    ? `<nav class="export-toc"><h2>目录</h2>${htmlTocList(tocItems)}</nav>`
    : "";
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title><style>
body{max-width:860px;margin:40px auto;padding:0 28px;color:#20242c;font:16px/1.85 system-ui,"Microsoft YaHei",sans-serif}
h1{text-align:center;border-bottom:2px solid #ddd;padding-bottom:18px}h2,h3,h4,h5,h6{margin-top:1.7em;color:#172033}
section{break-inside:auto}.export-toc{margin:2em 0 3em}.export-toc>ul{padding-left:0;list-style:none}.export-toc ul ul{padding-left:1.5em;list-style:none}.export-toc li{margin:.2em 0}.map-section+.map-section{margin-top:3em;border-top:1px solid #ddd}.body-paragraph{margin:.75em 0;text-align:justify;text-indent:2em}.circled-number{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-width:1.65em;height:1.65em;padding:0 .14em;border:.1em solid currentColor;border-radius:999px;font-family:inherit;font-size:.86em;font-weight:600;font-variant-numeric:tabular-nums;line-height:1;vertical-align:-.2em}.note{padding:10px 14px;color:#555;background:#f6f7f9;border-left:3px solid #6366f1}
@media print{body{margin:0;max-width:none}a{color:inherit}}
</style></head><body><article><h1>${title}</h1>${toc}${body}</article></body></html>`;
}

/**
 * Produces a native Word document with bookmarks and internal TOC hyperlinks.
 *
 * @param sections Ordered physical maps to merge.
 * @param tocMaxDepth Maximum exported TOC depth resolved from current/global article settings.
 * @returns A complete .docx archive.
 */
export function readingSectionsToDocx(sections: ReadingSection[], tocMaxDepth = 3, options: ArticleExportOptions = {}): Uint8Array {
  const maxTocDepth = normalizedExportTocMaxDepth(tocMaxDepth);
  const first = sections[0]?.document;
  const title = first ? (nodePlainText(first.root) || first.title) : "导出文档";
  let bookmarkId = 1;
  const wordAnchors = new Map<string, string>();
  const wordAnchor = (source: string): string => {
    const existing = wordAnchors.get(source);
    if (existing) return existing;
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    const anchor = `Mms_${wordAnchors.size.toString(36)}_${(hash >>> 0).toString(36)}`;
    wordAnchors.set(source, anchor);
    return anchor;
  };
  const paragraph = (text: string, style = "", indent = 0, anchor = ""): string => {
    const headingMatch = /^Heading([1-6])$/.exec(style);
    const headingLevel = headingMatch ? Number(headingMatch[1]) : NaN;
    const properties = (style ? '<w:pStyle w:val="' + style + '"/>' : "")
      + (Number.isFinite(headingLevel) ? '<w:outlineLvl w:val="' + Math.max(0, headingLevel - 1) + '"/>' : "")
      + (indent ? '<w:ind w:left="' + indent + '"/>' : "");
    const bookmarkStart = anchor ? '<w:bookmarkStart w:id="' + bookmarkId + '" w:name="' + anchor + '"/>' : "";
    const bookmarkEnd = anchor ? '<w:bookmarkEnd w:id="' + bookmarkId++ + '"/>' : "";
    return '<w:p><w:pPr>' + properties + '</w:pPr>' + bookmarkStart + '<w:r><w:t xml:space="preserve">' + escapeXml(text) + '</w:t></w:r>' + bookmarkEnd + '</w:p>';
  };
  const toc = collectExportTocItems(sections, maxTocDepth, false, options).map((item) => {
    const indent = Math.max(0, item.depth - 1) * 720;
    return '<w:p><w:pPr><w:ind w:left="' + indent + '"/></w:pPr><w:hyperlink w:anchor="' + wordAnchor(item.anchor) + '" w:history="1"><w:r><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">' + escapeXml(item.title) + '</w:t></w:r></w:hyperlink></w:p>';
  }).join("");
  const childSectionAnchors = new Map<string, string>();
  sections.forEach((section, index) => {
    const key = parentNodeKey(section.parentFilePath, section.parentNodeId);
    if (key) childSectionAnchors.set(key, exportAnchor(index, "section-" + index));
  });
  const body: string[] = [paragraph(title, "Title")];
  if (toc) body.push(paragraph("目录", "Heading1"), toc);
  sections.forEach(({ filePath, document, baseDepth }, sectionIndex) => {
    if (sectionIndex > 0) {
      body.push(paragraph(nodePlainText(document.root) || document.title, "Heading" + Math.min(6, Math.max(1, baseDepth)), 0, wordAnchor(exportAnchor(sectionIndex, "section-" + sectionIndex))));
    }
    for (const info of buildArticleNodeInfo(document.root, baseDepth, exportLeafNumbering(document, options))) {
      if (childSectionAnchors.has(filePath + "\u0000" + info.node.id)) continue;
      const text = info.displayTitle || info.title || "未命名";
      const isWordHeading = info.isHeading && info.node.children.length > 0;
      body.push(isWordHeading
        ? paragraph(text, "Heading" + Math.min(6, Math.max(1, info.depth)), 0, wordAnchor(exportAnchor(sectionIndex, info.anchor)))
        : paragraph(text));
      if (info.node.note) body.push(paragraph(info.node.note));
    }
  });
  const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body.join("") + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>';
  const styles = [1, 2, 3, 4, 5, 6].map((level) => '<w:style w:type="paragraph" w:styleId="Heading' + level + '"><w:name w:val="heading ' + level + '"/><w:rPr><w:b/><w:sz w:val="' + Math.max(20, 32 - level * 2) + '"/></w:rPr></w:style>').join("");
  const stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>' + styles + '</w:styles>';
  return zipSync({
    "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'),
    "_rels/.rels": strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    "word/document.xml": strToU8(documentXml),
    "word/styles.xml": strToU8(stylesXml),
    "word/_rels/document.xml.rels": strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>')
  });
}

/**
 * Produces article-oriented Markdown with a linked table of contents.
 *
 * @param sections Ordered physical maps to merge.
 * @param tocMaxDepth Maximum exported TOC depth resolved from current/global article settings.
 * @returns Standard Markdown source with linked headings.
 */
export function readingSectionsToMarkdown(sections: ReadingSection[], tocMaxDepth = 3, options: ArticleExportOptions = {}): string {
  const maxTocDepth = normalizedExportTocMaxDepth(tocMaxDepth);
  const first = sections[0]?.document;
  const title = first ? (nodePlainText(first.root) || first.title) : "导出文档";
  const tocItems: Array<{ depth: number; title: string; anchor: string }> = [];
  const childSectionIndexes = new Map<string, number>();
  const childSectionTitles = new Map<number, string>();
  sections.forEach((section, index) => {
    const key = parentNodeKey(section.parentFilePath, section.parentNodeId);
    if (key) childSectionIndexes.set(key, index);
  });
  const pushTocItem = (depth: number, itemTitle: string, anchor: string): void => {
    if (depth <= maxTocDepth) tocItems.push({ depth, title: itemTitle, anchor });
  };
  const body: string[] = [];
  sections.forEach(({ filePath, document, baseDepth }, sectionIndex) => {
    if (sectionIndex > 0) {
      const sectionTitle = (childSectionTitles.get(sectionIndex) ?? nodePlainText(document.root)) || document.title;
      const heading = markdownTitle("", sectionTitle);
      const anchor = markdownAnchor(heading);
      if (!parentNodeKey(sections[sectionIndex]?.parentFilePath, sections[sectionIndex]?.parentNodeId)) pushTocItem(Math.max(1, baseDepth), heading, anchor);
      body.push("", markdownHeading(Math.min(6, Math.max(1, baseDepth + 1)), heading));
    }
    for (const info of buildArticleNodeInfo(document.root, baseDepth, exportLeafNumbering(document, options))) {
      const heading = info.displayTitle || markdownTitle(info.label, info.title);
      const childSectionIndex = childSectionIndexes.get(`${filePath}\u0000${info.node.id}`);
      if (childSectionIndex !== undefined) {
        childSectionTitles.set(childSectionIndex, heading);
        pushTocItem(Math.max(1, info.depth), heading, markdownAnchor(heading));
        continue;
      }
      if (!info.isHeading) {
        if (heading) body.push("", heading);
        if (info.node.note) body.push("", `> ${info.node.note.replaceAll("\n", " ")}`);
        continue;
      }
      const anchor = markdownAnchor(heading);
      const level = Math.min(6, Math.max(2, info.depth + 1));
      pushTocItem(Math.max(1, info.depth), heading, anchor);
      body.push("", markdownHeading(level, heading));
      if (info.node.note) body.push("", `> ${info.node.note.replaceAll("\n", " ")}`);
    }
  });
  const toc = tocItems.length
    ? ["", "## 目录", "", ...tocItems.map((item) => `${"  ".repeat(Math.max(0, item.depth - 1))}- [${item.title}](#${item.anchor})`)]
    : [];
  return [`# ${title}`, ...toc, ...body].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}
