/**
 * @file import-export.ts
 * @description 导入导出领域的 XMind 与文章文档转换工具。
 */

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  createDefaultDocument,
  createNode,
  flattenNodes,
  newId,
  nodeContentBlocks,
  nodePlainText,
  replaceNodeContentBlocks,
  type ArticleLeafNumberingStyle,
  type MindMapContentBlock,
  type MindMapDocument,
  type MindMapImageContentBlock,
  type MindMapNode
} from "../core/model";
import { normalizeFormulaEditorSource } from "../core/latex";
import { buildArticleNodeInfo, type ArticleLeafNumberingOptions, type ArticleNodeInfo, type ReadingSection } from "../article/modes";

/** 新版 XMind 导入时需要保留的主题字段与画布链接。 */
type XMindTopic = {
  id?: string;
  title?: string;
  notes?: { plain?: { content?: string } };
  href?: string;
  children?: Record<string, XMindTopic[] | undefined>;
  image?: unknown;
  images?: unknown;
  equation?: unknown;
  equations?: unknown;
  formula?: unknown;
  formulas?: unknown;
  latex?: unknown;
  tex?: unknown;
};

/** 新版 XMind 画布及其根主题的最小数据形状。 */
type XMindSheet = {
  id?: string;
  title?: string;
  rootTopic?: XMindTopic;
};

/** One binary image embedded inside an XMind archive. */
export interface XMindEmbeddedImage {
  token: string;
  archivePath: string;
  filename: string;
  mimeType: string;
  content: Uint8Array;
}

/** Parsed XMind document plus archive resources that still need vault paths. */
export interface XMindImportResult {
  document: MindMapDocument;
  images: XMindEmbeddedImage[];
  imageReferenceCount: number;
  equationCount: number;
  missingImageCount: number;
}

/** Result of saving XMind archive images and rewriting their node blocks. */
export interface XMindImageMaterializeResult {
  saved: number;
  rewritten: number;
}

/** Normalized image reference discovered in XMind topic metadata. */
interface XMindImageCandidate {
  source: string;
  width?: number;
  height?: number;
  alt?: string;
}

const XMIND_IMAGE_SOURCE_KEYS = ["src", "source", "path", "href", "url"] as const;
const XMIND_EQUATION_KEYS = ["equation", "equations", "formula", "formulas", "latex", "tex"] as const;
const XMIND_EQUATION_VALUE_KEYS = ["latex", "tex", "formula", "equation", "content", "value", "text", "source"] as const;

/** Returns an object-shaped XMind metadata value, excluding arrays. */
function xmindRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** Returns a trimmed non-empty XMind string value. */
function xmindString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Normalizes a positive XMind image dimension to an integer pixel value. */
function xmindDimension(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
}

/** Checks whether a metadata string looks like an image URL or archive resource path. */
function xmindLooksLikeImageSource(value: string): boolean {
  return /^(?:xap:|resources\/|attachments\/|https?:|data:image\/|file:)/i.test(value)
    || /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(value);
}

/** Recursively collects image references and optional dimensions from one metadata value. */
function collectXMindImageValues(value: unknown, results: XMindImageCandidate[], inheritedAlt?: string): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectXMindImageValues(item, results, inheritedAlt));
    return;
  }
  const direct = xmindString(value);
  if (direct) {
    if (xmindLooksLikeImageSource(direct)) results.push({ source: direct, alt: inheritedAlt });
    return;
  }
  const record = xmindRecord(value);
  if (!record) return;
  const source = XMIND_IMAGE_SOURCE_KEYS.map((key) => xmindString(record[key])).find(Boolean);
  const alt = xmindString(record.alt) ?? xmindString(record.title) ?? inheritedAlt;
  if (source && xmindLooksLikeImageSource(source)) {
    results.push({
      source,
      width: xmindDimension(record.width),
      height: xmindDimension(record.height),
      alt
    });
  }
  for (const key of ["image", "images", "preview", "thumbnail", "svg"] as const) {
    if (record[key] !== undefined && record[key] !== value) collectXMindImageValues(record[key], results, alt);
  }
}

/** Walks bounded XMind topic metadata while excluding the normal child tree and notes. */
function walkXMindMetadata(
  value: unknown,
  visitor: (key: string, value: unknown) => void,
  depth = 0
): void {
  if (depth > 5) return;
  const record = xmindRecord(value);
  if (!record) return;
  for (const [rawKey, nested] of Object.entries(record)) {
    const key = rawKey.toLowerCase();
    visitor(key, nested);
    if (key === "children" || key === "notes") continue;
    if (Array.isArray(nested)) nested.forEach((item) => walkXMindMetadata(item, visitor, depth + 1));
    else walkXMindMetadata(nested, visitor, depth + 1);
  }
}

/** Collects and deduplicates all image references attached to one XMind topic. */
function collectXMindImages(topic: XMindTopic): XMindImageCandidate[] {
  const results: XMindImageCandidate[] = [];
  walkXMindMetadata(topic, (key, value) => {
    if (key === "image" || key === "images") collectXMindImageValues(value, results, topic.title);
    if (!(XMIND_EQUATION_KEYS as readonly string[]).includes(key)) return;
    const record = xmindRecord(value);
    if (!record) return;
    for (const imageKey of ["image", "images", "preview", "thumbnail", "svg"] as const) {
      collectXMindImageValues(record[imageKey], results, topic.title);
    }
    const renderedSource = XMIND_IMAGE_SOURCE_KEYS.map((sourceKey) => xmindString(record[sourceKey])).find(Boolean);
    if (renderedSource && xmindLooksLikeImageSource(renderedSource)) {
      results.push({
        source: renderedSource,
        width: xmindDimension(record.width),
        height: xmindDimension(record.height),
        alt: topic.title
      });
    }
  });
  const seen = new Set<string>();
  return results.filter((candidate) => {
    const key = `${candidate.source}\u0000${candidate.width ?? ""}\u0000${candidate.height ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Normalizes one candidate equation while rejecting URLs and rendered markup. */
function xmindEquationSource(value: string): string | null {
  const source = normalizeFormulaEditorSource(value).trim();
  if (!source || /^(?:xap:|resources\/|attachments\/|https?:|data:|file:)/i.test(source)) return null;
  if (/^<(?:svg|math|mathml)\b/i.test(source)) return null;
  return source;
}

/** Recursively extracts LaTeX source strings from one XMind equation metadata value. */
function collectXMindEquationValues(value: unknown, results: string[], depth = 0): void {
  if (depth > 5) return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectXMindEquationValues(item, results, depth + 1));
    return;
  }
  const direct = xmindString(value);
  if (direct) {
    const source = xmindEquationSource(direct);
    if (source) results.push(source);
    return;
  }
  const record = xmindRecord(value);
  if (!record) return;
  for (const key of XMIND_EQUATION_VALUE_KEYS) {
    if (record[key] !== undefined) collectXMindEquationValues(record[key], results, depth + 1);
  }
}

/** Collects distinct LaTeX equations attached to one XMind topic. */
function collectXMindEquations(topic: XMindTopic): string[] {
  const results: string[] = [];
  walkXMindMetadata(topic, (key, value) => {
    if ((XMIND_EQUATION_KEYS as readonly string[]).includes(key)) collectXMindEquationValues(value, results);
  });
  return Array.from(new Set(results));
}

/** Converts an XMind image URI into a safe archive-relative resource path. */
function xmindResourcePath(source: string): string | null {
  let value = source.trim().replace(/^xap:/i, "").replace(/^file:\/\//i, "");
  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep malformed but otherwise usable resource names unchanged.
  }
  value = value.replace(/\\/g, "/").replace(/^\/+/, "");
  const parts = value.split("/").filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === "..")) return null;
  return parts.join("/");
}

/** Resolves an XMind image reference against archive entries using tolerant path matching. */
function xmindArchiveEntry(
  archive: Record<string, Uint8Array>,
  lowerPaths: Map<string, string>,
  source: string
): { path: string; content: Uint8Array } | null {
  const normalized = xmindResourcePath(source);
  if (!normalized) return null;
  const basename = normalized.split("/").at(-1) ?? normalized;
  const candidates = [normalized];
  if (!normalized.toLowerCase().startsWith("resources/")) candidates.push(`resources/${normalized}`);
  if (basename !== normalized) candidates.push(`resources/${basename}`);
  for (const candidate of candidates) {
    const resolved = archive[candidate] ? candidate : lowerPaths.get(candidate.toLowerCase());
    if (resolved && archive[resolved]) return { path: resolved, content: archive[resolved] };
  }
  return null;
}

/** Detects the MIME type of an embedded XMind image from its name and byte signature. */
function xmindImageMimeType(filename: string, content: Uint8Array): string {
  const extension = filename.split(".").at(-1)?.toLowerCase();
  const byExtension: Record<string, string> = {
    avif: "image/avif", bmp: "image/bmp", gif: "image/gif", jpeg: "image/jpeg", jpg: "image/jpeg",
    png: "image/png", svg: "image/svg+xml", webp: "image/webp"
  };
  if (extension && byExtension[extension]) return byExtension[extension];
  if (content[0] === 0x89 && content[1] === 0x50 && content[2] === 0x4e && content[3] === 0x47) return "image/png";
  if (content[0] === 0xff && content[1] === 0xd8) return "image/jpeg";
  if (content[0] === 0x47 && content[1] === 0x49 && content[2] === 0x46) return "image/gif";
  if (content[0] === 0x52 && content[1] === 0x49 && content[2] === 0x46 && content[8] === 0x57 && content[9] === 0x45) return "image/webp";
  const prefix = new TextDecoder().decode(content.slice(0, 256)).trimStart();
  if (/^<\?xml\b|^<svg\b/i.test(prefix)) return "image/svg+xml";
  return "application/octet-stream";
}

/** Produces a stable suggested filename for an embedded XMind image. */
function xmindImageFilename(path: string, mimeType: string): string {
  const raw = path.split("/").at(-1)?.split(/[?#]/)[0]?.trim() || `xmind-image-${newId()}`;
  if (/\.[a-z0-9]{2,5}$/i.test(raw)) return raw;
  const extension = mimeType === "image/png" ? ".png"
    : mimeType === "image/jpeg" ? ".jpg"
      : mimeType === "image/gif" ? ".gif"
        : mimeType === "image/webp" ? ".webp"
          : mimeType === "image/svg+xml" ? ".svg"
            : ".bin";
  return `${raw}${extension}`;
}

/** Encodes bytes as base64 without depending on browser-only global helpers. */
function bytesToBase64(content: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let index = 0; index < content.length; index += 3) {
    const first = content[index] ?? 0;
    const second = content[index + 1] ?? 0;
    const third = content[index + 2] ?? 0;
    const combined = (first << 16) | (second << 8) | third;
    result += alphabet[(combined >> 18) & 63];
    result += alphabet[(combined >> 12) & 63];
    result += index + 1 < content.length ? alphabet[(combined >> 6) & 63] : "=";
    result += index + 2 < content.length ? alphabet[combined & 63] : "=";
  }
  return result;
}

/** Rewrites temporary XMind image tokens across document content blocks. */
function rewriteXMindImageTokens(document: MindMapDocument, replacements: Map<string, string>, local: boolean): number {
  let rewritten = 0;
  for (const node of flattenNodes(document.root)) {
    const blocks = nodeContentBlocks(node);
    let changed = false;
    for (const block of blocks) {
      if (block.type !== "image") continue;
      const replacement = replacements.get(block.source);
      if (!replacement) continue;
      block.source = replacement;
      block.localSource = local ? replacement : undefined;
      rewritten += 1;
      changed = true;
    }
    if (changed) replaceNodeContentBlocks(node, blocks);
  }
  return rewritten;
}

/**
 * Parses a modern XMind archive while retaining images and LaTeX attachments.
 *
 * Embedded images receive temporary tokens so the UI can save each binary once
 * into the current map's asset folder before the document enters edit history.
 */
export function xmindToImportResult(source: ArrayBuffer, fallbackTitle = "XMind 导入"): XMindImportResult {
  const archive = unzipSync(new Uint8Array(source));
  const content = archive["content.json"];
  if (!content) throw new Error("仅支持包含 content.json 的新版 XMind 文件");
  const parsed = JSON.parse(strFromU8(content)) as unknown;
  if (!Array.isArray(parsed)) throw new Error("XMind content.json 结构无效");
  const sheets = parsed.filter((item): item is XMindSheet => Boolean(xmindRecord(item)));
  const sheet = sheets.find((item) => xmindRecord(item.rootTopic)) ?? sheets[0];
  if (!sheet?.rootTopic || !xmindRecord(sheet.rootTopic)) throw new Error("XMind 文件中没有可导入的主题");

  const lowerPaths = new Map(Object.keys(archive).map((path) => [path.toLowerCase(), path]));
  const assetsByPath = new Map<string, XMindEmbeddedImage>();
  let imageReferenceCount = 0;
  let equationCount = 0;
  let missingImageCount = 0;
  const sheetById = new Map<string, XMindSheet>();
  for (const item of sheets) {
    if (typeof item.id === "string" && item.id) sheetById.set(item.id, item);
    if (typeof item.rootTopic?.id === "string" && item.rootTopic.id) sheetById.set(item.rootTopic.id, item);
  }
  const importedSheets = new Set<XMindSheet>();
  const sheetReference = (topic: XMindTopic): string | null => {
    const match = topic.href?.match(/(?:xmind:)?#([^?#]+)/i);
    return match?.[1] ?? null;
  };
  const convert = (topic: XMindTopic): MindMapNode => {
    const title = topic.title?.trim() || "未命名主题";
    const node = createNode(title);
    node.note = topic.notes?.plain?.content?.trim() || undefined;
    const blocks: MindMapContentBlock[] = [...nodeContentBlocks(node)];
    for (const equation of collectXMindEquations(topic)) {
      blocks.push({ id: newId(), type: "text", text: `$$${equation}$$` });
      equationCount += 1;
    }
    for (const candidate of collectXMindImages(topic)) {
      const imageBlock: MindMapImageContentBlock = {
        id: newId(),
        type: "image",
        source: candidate.source,
        alt: candidate.alt || title,
        width: candidate.width,
        height: candidate.height,
        layout: "block"
      };
      imageReferenceCount += 1;
      if (/^(?:https?:|data:image\/)/i.test(candidate.source)) {
        blocks.push(imageBlock);
        continue;
      }
      const entry = xmindArchiveEntry(archive, lowerPaths, candidate.source);
      if (!entry) {
        missingImageCount += 1;
        continue;
      }
      let asset = assetsByPath.get(entry.path);
      if (!asset) {
        const mimeType = xmindImageMimeType(entry.path, entry.content);
        asset = {
          token: `xmind-resource://${newId()}`,
          archivePath: entry.path,
          filename: xmindImageFilename(entry.path, mimeType),
          mimeType,
          content: entry.content
        };
        assetsByPath.set(entry.path, asset);
      }
      imageBlock.source = asset.token;
      blocks.push(imageBlock);
    }
    if (blocks.length > 1) replaceNodeContentBlocks(node, blocks);
    const children = Object.values(topic.children ?? {}).flatMap((items) => Array.isArray(items) ? items : []);
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
      const topicChildren = Object.values(topic.children ?? {}).flatMap((items) => Array.isArray(items) ? items : []);
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
  const title = topicPrimaryTitle(root) || sheet.title || fallbackTitle;
  const document = { ...createDefaultDocument(title), title, root };
  return {
    document,
    images: Array.from(assetsByPath.values()),
    imageReferenceCount,
    equationCount,
    missingImageCount
  };
}

/** Returns the first text block as an imported topic title fallback. */
function topicPrimaryTitle(node: MindMapNode): string {
  const first = nodeContentBlocks(node).find((block) => block.type === "text");
  return first?.type === "text" ? first.text.trim() : node.text.trim();
}

/** Saves embedded XMind images once and rewrites every referencing content block. */
export async function materializeXMindImages(
  result: XMindImportResult,
  saveImage: (image: XMindEmbeddedImage) => Promise<string>
): Promise<XMindImageMaterializeResult> {
  const replacements = new Map<string, string>();
  for (const image of result.images) {
    const targetPath = (await saveImage(image)).trim();
    if (!targetPath) throw new Error(`无法保存 XMind 图片：${image.filename}`);
    replacements.set(image.token, targetPath);
  }
  return {
    saved: replacements.size,
    rewritten: rewriteXMindImageTokens(result.document, replacements, true)
  };
}

/**
 * Imports an XMind archive as a self-contained document.
 *
 * UI callers should prefer `xmindToImportResult()` plus
 * `materializeXMindImages()` so archive images become normal vault assets.
 */
export function xmindToDocument(source: ArrayBuffer, fallbackTitle = "XMind 导入"): MindMapDocument {
  const result = xmindToImportResult(source, fallbackTitle);
  const replacements = new Map(result.images.map((image) => [
    image.token,
    `data:${image.mimeType};base64,${bytesToBase64(image.content)}`
  ]));
  rewriteXMindImageTokens(result.document, replacements, false);
  return result.document;
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
function exportLeafNumbering(
  document: MindMapDocument,
  options: ArticleExportOptions,
  numberingDisabled = false
): ArticleLeafNumberingOptions {
  return {
    enabled: document.articleStyle?.leafNumberingEnabled ?? options.leafNumberingEnabled ?? false,
    style: document.articleStyle?.leafNumberingStyle ?? options.leafNumberingStyle ?? "next-level",
    threshold: document.articleStyle?.leafNumberingThreshold ?? options.leafNumberingThreshold ?? 4,
    numberingDisabled
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
    for (const info of buildArticleNodeInfo(section.document.root, section.baseDepth, exportLeafNumbering(section.document, options, section.numberingDisabled))) {
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
    for (const info of buildArticleNodeInfo(section.document.root, section.baseDepth, exportLeafNumbering(section.document, options, section.numberingDisabled))) {
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
  const renderArticleNode = (
    filePath: string,
    document: MindMapDocument,
    baseDepth: number,
    sectionIndex: number,
    numberingDisabled = false
  ): string => buildArticleNodeInfo(document.root, baseDepth, exportLeafNumbering(document, options, numberingDisabled))
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
  const body = sections.map(({ filePath, document, baseDepth, numberingDisabled }, index) => {
    const sectionTitle = escapeHtml(nodePlainText(document.root) || document.title);
    const headingLevel = Math.min(6, Math.max(1, baseDepth + 1));
    const sectionAnchor = exportAnchor(index, `section-${index}`);
    const heading = index === 0 ? "" : `<h${headingLevel} id="${sectionAnchor}"><a name="${sectionAnchor}"></a>${sectionTitle}</h${headingLevel}>`;
    return `<section class="map-section">${heading}${renderArticleNode(filePath, document, baseDepth, index, numberingDisabled)}</section>`;
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
  sections.forEach(({ filePath, document, baseDepth, numberingDisabled }, sectionIndex) => {
    if (sectionIndex > 0) {
      body.push(paragraph(nodePlainText(document.root) || document.title, "Heading" + Math.min(6, Math.max(1, baseDepth)), 0, wordAnchor(exportAnchor(sectionIndex, "section-" + sectionIndex))));
    }
    for (const info of buildArticleNodeInfo(document.root, baseDepth, exportLeafNumbering(document, options, numberingDisabled))) {
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
  sections.forEach(({ filePath, document, baseDepth, numberingDisabled }, sectionIndex) => {
    if (sectionIndex > 0) {
      const sectionTitle = (childSectionTitles.get(sectionIndex) ?? nodePlainText(document.root)) || document.title;
      const heading = markdownTitle("", sectionTitle);
      const anchor = markdownAnchor(heading);
      if (!parentNodeKey(sections[sectionIndex]?.parentFilePath, sections[sectionIndex]?.parentNodeId)) pushTocItem(Math.max(1, baseDepth), heading, anchor);
      body.push("", markdownHeading(Math.min(6, Math.max(1, baseDepth + 1)), heading));
    }
    for (const info of buildArticleNodeInfo(document.root, baseDepth, exportLeafNumbering(document, options, numberingDisabled))) {
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
