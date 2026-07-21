/* MindMap Studio - MIT License */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  MINDMAP_EXTENSION: () => MINDMAP_EXTENSION,
  default: () => MindMapStudioPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/model.ts
var MINDMAP_CODE_BLOCK = "mindmap-json";
var LEGACY_CODE_BLOCKS = ["smm-json", "mmc-json"];
function newId() {
  const random = Math.random().toString(36).slice(2, 9);
  return `n_${Date.now().toString(36)}_${random}`;
}
function createNode(text = "\u65B0\u8282\u70B9") {
  return { id: newId(), text, children: [] };
}
function createDefaultDocument(title = "\u65B0\u601D\u7EF4\u5BFC\u56FE") {
  return {
    version: 8,
    title,
    layout: "right",
    theme: "auto",
    root: {
      id: newId(),
      text: title,
      children: [
        { id: newId(), text: "\u4E3B\u9898 1", children: [] },
        { id: newId(), text: "\u4E3B\u9898 2", children: [] }
      ]
    }
  };
}
function normalizeColor(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : void 0;
}
function normalizeNumber(value, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) return void 0;
  return Math.min(max, Math.max(min, value));
}
function normalizeBooleanOverride(value) {
  return typeof value === "boolean" ? value : void 0;
}
function normalizeAppearance(input) {
  if (!input) return void 0;
  const backgroundPattern = input.backgroundPattern === "none" || input.backgroundPattern === "grid" || input.backgroundPattern === "dots" ? input.backgroundPattern : void 0;
  const fontFamily = input.fontFamily === "obsidian" || input.fontFamily === "sans" || input.fontFamily === "serif" || input.fontFamily === "mono" || input.fontFamily === "custom" ? input.fontFamily : void 0;
  const edgeStyle = input.edgeStyle === "curved" || input.edgeStyle === "straight" || input.edgeStyle === "elbow" ? input.edgeStyle : void 0;
  const customFont = typeof input.customFont === "string" && input.customFont.trim() ? input.customFont.trim().slice(0, 120) : void 0;
  const appearance = {
    backgroundColor: normalizeColor(input.backgroundColor),
    backgroundPattern,
    patternColor: normalizeColor(input.patternColor),
    fontFamily,
    customFont,
    fontSize: normalizeNumber(input.fontSize, 10, 30),
    edgeColor: normalizeColor(input.edgeColor),
    edgeWidth: normalizeNumber(input.edgeWidth, 0.5, 8),
    edgeStyle,
    nodeColor: normalizeColor(input.nodeColor),
    textColor: normalizeColor(input.textColor),
    nodeBorderColor: normalizeColor(input.nodeBorderColor),
    nodeBorderWidth: normalizeNumber(input.nodeBorderWidth, 0, 6),
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline)
  };
  return Object.values(appearance).some((value) => value !== void 0) ? appearance : void 0;
}
function mergeAppearance(base, override) {
  return { ...base != null ? base : {}, ...override != null ? override : {} };
}
function normalizeStyle(input) {
  if (!input) return void 0;
  const shape = input.shape === "pill" || input.shape === "rectangle" || input.shape === "rounded" ? input.shape : void 0;
  const style = {
    color: normalizeColor(input.color),
    textColor: normalizeColor(input.textColor),
    borderColor: normalizeColor(input.borderColor),
    borderWidth: normalizeNumber(input.borderWidth, 0, 6),
    shape,
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline),
    fontSize: normalizeNumber(input.fontSize, 10, 32)
  };
  return Object.values(style).some((value) => value !== void 0) ? style : void 0;
}
function normalizeTextStyle(input) {
  if (!input) return void 0;
  const style = {
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline),
    strike: normalizeBooleanOverride(input.strike),
    color: normalizeColor(input.color)
  };
  return Object.values(style).some((value) => value !== void 0) ? style : void 0;
}
function textStyleKey(style) {
  return JSON.stringify(style != null ? style : {});
}
function normalizeRichText(input, fallbackText = "") {
  if (!Array.isArray(input)) return void 0;
  const runs = [];
  for (const raw of input.slice(0, 500)) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw;
    if (typeof candidate.text !== "string" || !candidate.text) continue;
    const text = candidate.text.replace(/\r?\n/g, " ").slice(0, 1e4);
    if (!text) continue;
    const style = normalizeTextStyle(candidate.style);
    const previous = runs.at(-1);
    if (previous && textStyleKey(previous.style) === textStyleKey(style)) previous.text += text;
    else runs.push({ text, style });
  }
  if (!runs.length) return void 0;
  const combined = runs.map((run) => run.text).join("");
  const leading = combined.length - combined.trimStart().length;
  const trailing = combined.length - combined.trimEnd().length;
  if (leading || trailing) {
    let start = leading;
    let remaining = combined.length - leading - trailing;
    const trimmed = [];
    for (const run of runs) {
      if (remaining <= 0) break;
      const skip = Math.min(start, run.text.length);
      start -= skip;
      const available = run.text.length - skip;
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      const text = run.text.slice(skip, skip + take);
      remaining -= take;
      if (text) trimmed.push({ text, style: run.style });
    }
    runs.splice(0, runs.length, ...trimmed);
  }
  if (!runs.length) return fallbackText.trim() ? [{ text: fallbackText.trim() }] : void 0;
  return runs.some((run) => run.style && Object.values(run.style).some((value) => value !== void 0)) ? runs : void 0;
}
function richTextPlainText(runs, fallbackText = "") {
  var _a;
  return (_a = runs == null ? void 0 : runs.map((run) => run.text).join("")) != null ? _a : fallbackText;
}
function richTextCharacterStyles(runs, fallbackText = "") {
  const text = richTextPlainText(runs, fallbackText);
  const styles = Array.from({ length: text.length }, () => ({}));
  if (!(runs == null ? void 0 : runs.length)) return styles;
  let offset = 0;
  for (const run of runs) {
    const style = run.style ? { ...run.style } : {};
    const end = Math.min(text.length, offset + run.text.length);
    for (let index = offset; index < end; index += 1) styles[index] = { ...style };
    offset = end;
  }
  return styles;
}
function characterStylesToRichText(text, styles) {
  if (!text) return void 0;
  const runs = [];
  let start = 0;
  let current = normalizeTextStyle(styles[0]);
  for (let index = 1; index <= text.length; index += 1) {
    const next = index < text.length ? normalizeTextStyle(styles[index]) : void 0;
    if (index < text.length && textStyleKey(current) === textStyleKey(next)) continue;
    const segment = text.slice(start, index);
    if (segment) runs.push({ text: segment, style: current });
    start = index;
    current = next;
  }
  return normalizeRichText(runs, text);
}
function reconcileRichTextAfterEdit(previousText, previousRuns, nextText) {
  var _a, _b;
  if (previousText === nextText) return normalizeRichText(previousRuns, nextText);
  const previousStyles = richTextCharacterStyles(previousRuns, previousText);
  const nextStyles = Array.from({ length: nextText.length }, () => ({}));
  let prefix = 0;
  while (prefix < previousText.length && prefix < nextText.length && previousText[prefix] === nextText[prefix]) prefix += 1;
  let suffix = 0;
  while (suffix < previousText.length - prefix && suffix < nextText.length - prefix && previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]) suffix += 1;
  for (let index = 0; index < prefix; index += 1) nextStyles[index] = { ...(_a = previousStyles[index]) != null ? _a : {} };
  for (let index = 0; index < suffix; index += 1) {
    const previousIndex = previousText.length - suffix + index;
    const nextIndex = nextText.length - suffix + index;
    nextStyles[nextIndex] = { ...(_b = previousStyles[previousIndex]) != null ? _b : {} };
  }
  return characterStylesToRichText(nextText, nextStyles);
}
function applyRichTextStyleRange(text, runs, start, end, patch) {
  const safeStart = Math.max(0, Math.min(text.length, Math.floor(start)));
  const safeEnd = Math.max(safeStart, Math.min(text.length, Math.floor(end)));
  if (safeStart === safeEnd) return normalizeRichText(runs, text);
  const styles = richTextCharacterStyles(runs, text);
  for (let index = safeStart; index < safeEnd; index += 1) {
    if (patch === null) styles[index] = {};
    else styles[index] = { ...styles[index], ...patch };
  }
  return characterStylesToRichText(text, styles);
}
function normalizeContentBlock(input) {
  if (!input || typeof input !== "object") return null;
  const candidate = input;
  const id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : newId();
  if (candidate.type === "image") {
    const image = candidate;
    const source = typeof image.source === "string" ? image.source.trim().slice(0, 2e3) : "";
    if (!source) return null;
    const alt = typeof image.alt === "string" && image.alt.trim() ? image.alt.trim().slice(0, 500) : void 0;
    const localSource = typeof image.localSource === "string" && image.localSource.trim() ? image.localSource.trim().slice(0, 2e3) : void 0;
    const remoteSources = Array.isArray(image.remoteSources) ? image.remoteSources.slice(0, 12).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const item = raw;
      const hostId = typeof item.hostId === "string" ? item.hostId.trim().slice(0, 160) : "";
      const url = typeof item.url === "string" ? item.url.trim().slice(0, 4e3) : "";
      if (!hostId || !/^https?:\/\//i.test(url)) return [];
      return [{
        hostId,
        hostName: typeof item.hostName === "string" && item.hostName.trim() ? item.hostName.trim().slice(0, 200) : void 0,
        url,
        uploadedAt: typeof item.uploadedAt === "string" && item.uploadedAt.trim() ? item.uploadedAt.trim().slice(0, 80) : void 0
      }];
    }) : void 0;
    return { id, type: "image", source, alt, localSource, remoteSources: (remoteSources == null ? void 0 : remoteSources.length) ? remoteSources : void 0 };
  }
  if (candidate.type === "text") {
    const fallbackText = typeof candidate.text === "string" ? candidate.text.replace(/\r?\n/g, " ").slice(0, 2e4) : "";
    const richText = normalizeRichText(candidate.richText, fallbackText);
    const text = richTextPlainText(richText, fallbackText);
    return { id, type: "text", text, richText };
  }
  return null;
}
function nodeContentBlocks(node) {
  var _a, _b;
  if (Array.isArray(node.content) && node.content.length) {
    const normalized = node.content.map(normalizeContentBlock).filter((block) => Boolean(block));
    if (normalized.length) return normalized;
  }
  const blocks = [];
  if ((_a = node.image) == null ? void 0 : _a.trim()) blocks.push({ id: newId(), type: "image", source: node.image.trim(), alt: node.text || void 0 });
  if (node.text || ((_b = node.richText) == null ? void 0 : _b.length)) {
    const richText = normalizeRichText(node.richText, node.text);
    blocks.push({ id: newId(), type: "text", text: richTextPlainText(richText, node.text), richText });
  }
  return blocks;
}
function nodePlainText(node) {
  const blocks = nodeContentBlocks(node);
  return blocks.filter((block) => block.type === "text").map((block) => block.text).join(" ").trim();
}
function syncNodeLegacyFields(node) {
  var _a, _b, _c, _d;
  const blocks = nodeContentBlocks(node);
  node.content = blocks.length ? blocks : void 0;
  const textBlocks = blocks.filter((block) => block.type === "text");
  const imageBlocks = blocks.filter((block) => block.type === "image");
  node.text = textBlocks.map((block) => block.text).join(" ").trim();
  node.richText = textBlocks.length === 1 ? normalizeRichText((_a = textBlocks[0]) == null ? void 0 : _a.richText, (_c = (_b = textBlocks[0]) == null ? void 0 : _b.text) != null ? _c : "") : void 0;
  node.image = (_d = imageBlocks[0]) == null ? void 0 : _d.source;
}
function normalizeCell(value) {
  return typeof value === "string" ? value.trim().slice(0, 2e3) : String(value != null ? value : "").trim().slice(0, 2e3);
}
function normalizeTable(input) {
  if (!input || !Array.isArray(input.headers)) return void 0;
  const headers = input.headers.map(normalizeCell).slice(0, 12);
  if (!headers.length) return void 0;
  const rows = Array.isArray(input.rows) ? input.rows.slice(0, 100).map((row) => {
    const values = Array.isArray(row) ? row.map(normalizeCell).slice(0, headers.length) : [];
    while (values.length < headers.length) values.push("");
    return values;
  }) : [];
  const alignments = Array.isArray(input.alignments) ? input.alignments.slice(0, headers.length).map((value) => value === "center" || value === "right" ? value : "left") : void 0;
  const source = input.source === "markdown" || input.source === "children" ? input.source : "manual";
  return { headers, rows, alignments, source };
}
function normalizeCode(input) {
  if (!input || typeof input.code !== "string" || !input.code.trim()) return void 0;
  const language = typeof input.language === "string" && input.language.trim() ? input.language.trim().replace(/[^a-z0-9_+#.-]/gi, "").slice(0, 40) : void 0;
  return { language, code: input.code.replace(/\r\n/g, "\n").slice(0, 1e5) };
}
function normalizeSubmap(input) {
  if (!input || typeof input.path !== "string" || !input.path.trim()) return void 0;
  return {
    path: input.path.trim().slice(0, 500),
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim().slice(0, 200) : void 0
  };
}
function normalizeNavigation(input) {
  if (!input || typeof input.parentPath !== "string" || !input.parentPath.trim()) return void 0;
  return {
    parentPath: input.parentPath.trim().slice(0, 500),
    parentNodeId: typeof input.parentNodeId === "string" && input.parentNodeId.trim() ? input.parentNodeId.trim().slice(0, 160) : void 0,
    parentTitle: typeof input.parentTitle === "string" && input.parentTitle.trim() ? input.parentTitle.trim().slice(0, 200) : void 0,
    parentNodeText: typeof input.parentNodeText === "string" && input.parentNodeText.trim() ? input.parentNodeText.trim().slice(0, 200) : void 0
  };
}
function normalizeTask(value) {
  return value === "todo" || value === "doing" || value === "done" ? value : void 0;
}
function normalizeTags(value) {
  if (!Array.isArray(value)) return void 0;
  const tags = Array.from(new Set(value.filter((item) => typeof item === "string").map((item) => item.trim().replace(/^#/, "")).filter(Boolean))).slice(0, 12);
  return tags.length ? tags : void 0;
}
function normalizeNode(input, fallbackText) {
  var _a, _b;
  const fallbackNodeText = typeof (input == null ? void 0 : input.text) === "string" ? input.text : fallbackText;
  const normalizedContent = Array.isArray(input == null ? void 0 : input.content) ? input.content.map(normalizeContentBlock).filter((block) => Boolean(block)) : [];
  if (!normalizedContent.length) {
    if (typeof (input == null ? void 0 : input.image) === "string" && input.image.trim()) {
      normalizedContent.push({ id: newId(), type: "image", source: input.image.trim(), alt: fallbackNodeText || void 0 });
    }
    const richText = normalizeRichText(input == null ? void 0 : input.richText, fallbackNodeText);
    const text2 = richTextPlainText(richText, fallbackNodeText);
    if (text2) normalizedContent.push({ id: newId(), type: "text", text: text2, richText });
  }
  const textBlocks = normalizedContent.filter((block) => block.type === "text");
  const imageBlocks = normalizedContent.filter((block) => block.type === "image");
  const text = textBlocks.map((block) => block.text).join(" ").trim();
  return {
    id: typeof (input == null ? void 0 : input.id) === "string" && input.id ? input.id : newId(),
    text,
    richText: textBlocks.length === 1 ? (_a = textBlocks[0]) == null ? void 0 : _a.richText : void 0,
    content: normalizedContent.length ? normalizedContent : void 0,
    note: typeof (input == null ? void 0 : input.note) === "string" && input.note.trim() ? input.note.trim() : void 0,
    link: typeof (input == null ? void 0 : input.link) === "string" && input.link.trim() ? input.link.trim() : void 0,
    image: (_b = imageBlocks[0]) == null ? void 0 : _b.source,
    table: normalizeTable(input == null ? void 0 : input.table),
    code: normalizeCode(input == null ? void 0 : input.code),
    submap: normalizeSubmap(input == null ? void 0 : input.submap),
    icon: typeof (input == null ? void 0 : input.icon) === "string" && input.icon.trim() ? input.icon.trim().slice(0, 12) : void 0,
    tags: normalizeTags(input == null ? void 0 : input.tags),
    task: normalizeTask(input == null ? void 0 : input.task),
    style: normalizeStyle(input == null ? void 0 : input.style),
    collapsed: (input == null ? void 0 : input.collapsed) === true || void 0,
    children: Array.isArray(input == null ? void 0 : input.children) ? input.children.map((child, index) => normalizeNode(child, `\u8282\u70B9 ${index + 1}`)) : []
  };
}
function normalizeDocument(input, fallbackTitle = "\u601D\u7EF4\u5BFC\u56FE") {
  const title = typeof (input == null ? void 0 : input.title) === "string" && input.title.trim() ? input.title.trim() : fallbackTitle;
  return {
    version: 8,
    title,
    layout: (input == null ? void 0 : input.layout) === "balanced" ? "balanced" : "right",
    theme: (input == null ? void 0 : input.theme) === "light" || (input == null ? void 0 : input.theme) === "dark" ? input.theme : "auto",
    appearance: normalizeAppearance(input == null ? void 0 : input.appearance),
    navigation: normalizeNavigation(input == null ? void 0 : input.navigation),
    root: normalizeNode(input == null ? void 0 : input.root, title)
  };
}
function serializeDocument(doc) {
  const normalized = normalizeDocument(doc, doc.title);
  return `${JSON.stringify(normalized, null, 2)}
`;
}
function parseJsonDocument(value, fallbackTitle) {
  try {
    return normalizeDocument(JSON.parse(value), fallbackTitle);
  } catch (e) {
    return null;
  }
}
function extractFencedJson(source, language) {
  var _a, _b;
  const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp("```" + escaped + "\\s*([\\s\\S]*?)```", "i"));
  return (_b = (_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim()) != null ? _b : null;
}
function parseDocument(source, fallbackTitle = "\u601D\u7EF4\u5BFC\u56FE") {
  const trimmed = source.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const parsed = parseJsonDocument(trimmed, fallbackTitle);
    if (parsed) return parsed;
  }
  for (const language of [MINDMAP_CODE_BLOCK, ...LEGACY_CODE_BLOCKS]) {
    const fenced = extractFencedJson(source, language);
    if (!fenced) continue;
    const parsed = parseJsonDocument(fenced, fallbackTitle);
    if (parsed) return parsed;
  }
  return markdownToDocument(source, fallbackTitle);
}
function cloneDocument(doc) {
  return JSON.parse(JSON.stringify(doc));
}
function cloneNodeWithFreshIds(node) {
  const clone = JSON.parse(JSON.stringify(node));
  walkNodes(clone, (current) => {
    current.id = newId();
  });
  return clone;
}
function walkNodes(root, visitor) {
  const visit = (node, parent) => {
    visitor(node, parent);
    node.children.forEach((child) => visit(child, node));
  };
  visit(root, null);
}
function flattenNodes(root) {
  const nodes = [];
  walkNodes(root, (node) => nodes.push(node));
  return nodes;
}
function findNode(root, id) {
  let result = null;
  walkNodes(root, (node) => {
    if (node.id === id) result = node;
  });
  return result;
}
function findParent(root, id) {
  let result = null;
  walkNodes(root, (node, parent) => {
    if (node.id === id) result = parent;
  });
  return result;
}
function findAncestors(root, id) {
  const path = [];
  const visit = (node) => {
    if (node.id === id) return true;
    for (const child of node.children) {
      path.push(node);
      if (visit(child)) return true;
      path.pop();
    }
    return false;
  };
  return visit(root) ? path : [];
}
function containsNode(root, id) {
  return findNode(root, id) !== null;
}
function removeNode(root, id) {
  var _a;
  for (let index = 0; index < root.children.length; index += 1) {
    if (((_a = root.children[index]) == null ? void 0 : _a.id) === id) {
      root.children.splice(index, 1);
      return true;
    }
    const child = root.children[index];
    if (child && removeNode(child, id)) return true;
  }
  return false;
}
function extractFirstWikiLink(value) {
  var _a, _b;
  const match = value.match(/\[\[([^\]|#]+(?:#[^\]|]+)?)(?:\|[^\]]+)?\]\]/);
  return (_b = (_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim()) != null ? _b : null;
}
function getTaskProgress(root) {
  let done = 0;
  let total = 0;
  walkNodes(root, (node) => {
    if (!node.task) return;
    total += 1;
    if (node.task === "done") done += 1;
  });
  return { done, total };
}
function nodeSearchText(node) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  return [nodePlainText(node), node.note, node.link, ...nodeContentBlocks(node).map((block) => {
    var _a2;
    return block.type === "image" ? `${block.source} ${(_a2 = block.alt) != null ? _a2 : ""}` : block.text;
  }), node.icon, (_a = node.submap) == null ? void 0 : _a.path, (_b = node.code) == null ? void 0 : _b.language, (_c = node.code) == null ? void 0 : _c.code, ...(_e = (_d = node.table) == null ? void 0 : _d.headers) != null ? _e : [], ...(_g = (_f = node.table) == null ? void 0 : _f.rows.flat()) != null ? _g : [], ...(_h = node.tags) != null ? _h : []].filter((value) => Boolean(value)).join(" ").toLocaleLowerCase();
}
function taskPrefix(task) {
  if (task === "done") return "[x] ";
  if (task === "doing") return "[-] ";
  if (task === "todo") return "[ ] ";
  return "";
}
function escapeInlineMarkdown(value) {
  return value.replace(/([\\`*_{}\[\]<>])/g, "\\$1");
}
function richTextToMarkdown(runs, fallbackText) {
  if (!(runs == null ? void 0 : runs.length)) return escapeInlineMarkdown(fallbackText);
  return runs.map((run) => {
    let value = escapeInlineMarkdown(run.text);
    const style = run.style;
    if (!style) return value;
    if (style.bold) value = `**${value}**`;
    if (style.italic) value = `*${value}*`;
    if (style.strike) value = `~~${value}~~`;
    if (style.underline) value = `<u>${value}</u>`;
    if (style.color) value = `<span style="color:${style.color}">${value}</span>`;
    return value;
  }).join("");
}
function tableToMarkdown(table) {
  const escapeCell = (value) => value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
  const headers = `| ${table.headers.map(escapeCell).join(" | ")} |`;
  const alignments = table.headers.map((_, index) => {
    var _a, _b;
    const alignment = (_b = (_a = table.alignments) == null ? void 0 : _a[index]) != null ? _b : "left";
    return alignment === "center" ? ":---:" : alignment === "right" ? "---:" : "---";
  });
  const separator = `| ${alignments.join(" | ")} |`;
  const rows = table.rows.map((row) => `| ${table.headers.map((_, index) => {
    var _a;
    return escapeCell((_a = row[index]) != null ? _a : "");
  }).join(" | ")} |`);
  return [headers, separator, ...rows].join("\n");
}
function splitMarkdownTableRow(line) {
  const value = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let current = "";
  let escaped = false;
  for (const char of value) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "|") {
      cells.push(current.trim().replaceAll("<br>", "\n"));
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim().replaceAll("<br>", "\n"));
  return cells;
}
function parseMarkdownTable(markdown) {
  var _a, _b, _c, _d, _e, _f, _g;
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = (_b = (_a = lines[index]) == null ? void 0 : _a.trim()) != null ? _b : "";
    const separatorLine = (_d = (_c = lines[index + 1]) == null ? void 0 : _c.trim()) != null ? _d : "";
    if (!headerLine.includes("|") || !separatorLine.includes("|")) continue;
    const headers = splitMarkdownTableRow(headerLine);
    const separators = splitMarkdownTableRow(separatorLine);
    if (!headers.length || separators.length !== headers.length || !separators.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))) continue;
    const alignments = separators.map((cell) => {
      const compact = cell.replace(/\s/g, "");
      if (compact.startsWith(":") && compact.endsWith(":")) return "center";
      if (compact.endsWith(":")) return "right";
      return "left";
    });
    const rows = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const rowLine = (_f = (_e = lines[rowIndex]) == null ? void 0 : _e.trim()) != null ? _f : "";
      if (!rowLine || !rowLine.includes("|")) break;
      const row = splitMarkdownTableRow(rowLine).slice(0, headers.length);
      while (row.length < headers.length) row.push("");
      rows.push(row);
    }
    return (_g = normalizeTable({ headers, rows, alignments, source: "markdown" })) != null ? _g : null;
  }
  return null;
}
function parseFencedCode(markdown) {
  var _a, _b, _c;
  const match = markdown.match(/```([^\n`]*)\n([\s\S]*?)\n```/);
  if (!match) return null;
  return (_c = normalizeCode({ language: (_a = match[1]) == null ? void 0 : _a.trim(), code: (_b = match[2]) != null ? _b : "" })) != null ? _c : null;
}
function childrenToTable(node) {
  if (!node.children.length) return null;
  return {
    headers: ["\u5B50\u8282\u70B9", "\u5907\u6CE8", "\u72B6\u6001", "\u6807\u7B7E", "\u4E0B\u7EA7\u6570\u91CF"],
    rows: node.children.map((child) => {
      var _a, _b, _c;
      return [
        nodePlainText(child),
        (_a = child.note) != null ? _a : "",
        child.task === "done" ? "\u5DF2\u5B8C\u6210" : child.task === "doing" ? "\u8FDB\u884C\u4E2D" : child.task === "todo" ? "\u5F85\u529E" : "",
        (_c = (_b = child.tags) == null ? void 0 : _b.join(", ")) != null ? _c : "",
        String(child.children.length)
      ];
    }),
    alignments: ["left", "left", "center", "left", "right"],
    source: "children"
  };
}
function documentToMarkdown(doc) {
  var _a, _b;
  const renderBlocks = (node) => {
    var _a2;
    const result = [];
    for (const block of nodeContentBlocks(node)) {
      if (block.type === "text") {
        const value = richTextToMarkdown(block.richText, block.text);
        if (value) result.push(value);
      } else {
        result.push(`![${escapeInlineMarkdown((_a2 = block.alt) != null ? _a2 : "\u56FE\u7247")}](${block.source})`);
      }
    }
    return result;
  };
  const rootBlocks = renderBlocks(doc.root);
  const rootTitle = (_a = rootBlocks.find((value) => !value.startsWith("!["))) != null ? _a : doc.title;
  const rootSuffix = ((_b = doc.root.tags) == null ? void 0 : _b.length) ? ` ${doc.root.tags.map((tag) => `#${tag}`).join(" ")}` : "";
  const lines = [`# ${doc.root.icon ? `${doc.root.icon} ` : ""}${rootTitle}${rootSuffix}`];
  rootBlocks.filter((value) => value !== rootTitle).forEach((value) => lines.push(value));
  const visit = (node, depth) => {
    var _a2, _b2, _c, _d;
    const indent = "  ".repeat(Math.max(0, depth - 1));
    const tags = ((_a2 = node.tags) == null ? void 0 : _a2.length) ? ` ${node.tags.map((tag) => `#${tag}`).join(" ")}` : "";
    const link = node.link ? ` \u2192 ${node.link}` : "";
    const blocks = renderBlocks(node);
    const firstText = (_c = blocks.find((value) => !value.startsWith("!["))) != null ? _c : (_b2 = blocks[0]) != null ? _b2 : "\u56FE\u7247\u8282\u70B9";
    lines.push(`${indent}- ${taskPrefix(node.task)}${node.icon ? `${node.icon} ` : ""}${firstText}${tags}${link}`);
    blocks.filter((value) => value !== firstText).forEach((value) => lines.push(`${indent}  ${value}`));
    if (node.note) lines.push(`${indent}  > ${node.note.replaceAll("\n", " ")}`);
    if (node.submap) lines.push(`${indent}  > \u5B50\u5BFC\u56FE\uFF1A[[${node.submap.path}]]`);
    if (node.table) lines.push("", ...tableToMarkdown(node.table).split("\n").map((line) => `${indent}  ${line}`), "");
    if (node.code) lines.push(`${indent}  \`\`\`${(_d = node.code.language) != null ? _d : ""}`, ...node.code.code.split("\n").map((line) => `${indent}  ${line}`), `${indent}  \`\`\``);
    node.children.forEach((child) => visit(child, depth + 1));
  };
  doc.root.children.forEach((child) => visit(child, 1));
  return lines.join("\n");
}
function parseTaskText(value) {
  var _a;
  const match = value.match(/^\[( |x|X|-)\]\s+(.+)$/);
  if (!match) return { text: value };
  const marker = match[1];
  const task = marker === "x" || marker === "X" ? "done" : marker === "-" ? "doing" : "todo";
  return { text: ((_a = match[2]) == null ? void 0 : _a.trim()) || "\u4EFB\u52A1", task };
}
function markdownToDocument(markdown, fallbackTitle = "\u601D\u7EF4\u5BFC\u56FE") {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  const doc = createDefaultDocument(fallbackTitle);
  doc.root.children = [];
  const stack = [{ level: 0, node: doc.root }];
  let rootAssigned = false;
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("---") || line.trimStart().startsWith("```") || /^\s*>/.test(line)) continue;
    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    const bullet = line.match(/^(\s*)[-*+]\s+(.+?)\s*$/);
    const numbered = line.match(/^(\s*)\d+[.)]\s+(.+?)\s*$/);
    if (heading) {
      const level = (_b = (_a = heading[1]) == null ? void 0 : _a.length) != null ? _b : 1;
      const text = (_d = (_c = heading[2]) == null ? void 0 : _c.trim()) != null ? _d : "\u8282\u70B9";
      if (level === 1 && !rootAssigned) {
        doc.root.text = text;
        doc.title = text;
        rootAssigned = true;
        stack.length = 1;
      } else {
        const node = createNode(text);
        while (stack.length > 1 && ((_f = (_e = stack.at(-1)) == null ? void 0 : _e.level) != null ? _f : 0) >= level) stack.pop();
        const parent = (_h = (_g = stack.at(-1)) == null ? void 0 : _g.node) != null ? _h : doc.root;
        parent.children.push(node);
        stack.push({ level, node });
      }
      continue;
    }
    const listMatch = bullet != null ? bullet : numbered;
    if (listMatch) {
      const spaces = ((_i = listMatch[1]) != null ? _i : "").replaceAll("	", "  ").length;
      const level = Math.floor(spaces / 2) + 2;
      const parsed = parseTaskText(((_j = listMatch[2]) != null ? _j : "\u8282\u70B9").trim());
      const node = createNode(parsed.text);
      node.task = parsed.task;
      while (stack.length > 1 && ((_l = (_k = stack.at(-1)) == null ? void 0 : _k.level) != null ? _l : 0) >= level) stack.pop();
      const parent = (_n = (_m = stack.at(-1)) == null ? void 0 : _m.node) != null ? _n : doc.root;
      parent.children.push(node);
      stack.push({ level, node });
    }
  }
  if (!doc.root.children.length) doc.root.children.push(createNode("\u4E3B\u9898 1"));
  return doc;
}

// src/settings.ts
var import_obsidian = require("obsidian");
function createImageHostConfig(index = 1) {
  return {
    id: `host_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: `\u56FE\u5E8A ${index}`,
    enabled: true,
    endpoint: "",
    method: "POST",
    bodyMode: "multipart",
    fieldName: "file",
    headers: "",
    responsePath: "data.url"
  };
}
var DEFAULT_SETTINGS = {
  defaultFolder: "",
  filePrefix: "\u601D\u7EF4\u5BFC\u56FE",
  assetFolder: "MindMap Assets",
  defaultLayout: "right",
  defaultTheme: "auto",
  defaultNodeShape: "rounded",
  redirectLegacyFiles: true,
  showGrid: true,
  showTaskProgress: true,
  autoFitOnOpen: true,
  historyLimit: 120,
  embedMaxHeight: 520,
  backgroundColor: "",
  backgroundPattern: "grid",
  backgroundPatternColor: "#94a3b8",
  fontFamily: "obsidian",
  customFont: "",
  fontSize: 14,
  edgeColor: "",
  edgeWidth: 2.2,
  edgeStyle: "curved",
  nodeBackgroundColor: "",
  textColor: "",
  nodeBorderColor: "",
  nodeBorderWidth: 1,
  defaultTextBold: false,
  defaultTextItalic: false,
  defaultTextUnderline: false,
  imageHosts: [],
  autoUploadEnabled: false,
  autoUploadDelaySeconds: 10,
  autoUploadHostIds: [],
  deleteLocalAfterUpload: true
};
function settingsToAppearance(settings) {
  return {
    backgroundColor: settings.backgroundColor || void 0,
    backgroundPattern: settings.backgroundPattern,
    patternColor: settings.backgroundPatternColor || void 0,
    fontFamily: settings.fontFamily,
    customFont: settings.customFont.trim() || void 0,
    fontSize: settings.fontSize,
    edgeColor: settings.edgeColor || void 0,
    edgeWidth: settings.edgeWidth,
    edgeStyle: settings.edgeStyle,
    nodeColor: settings.nodeBackgroundColor || void 0,
    textColor: settings.textColor || void 0,
    nodeBorderColor: settings.nodeBorderColor || void 0,
    nodeBorderWidth: settings.nodeBorderWidth,
    bold: settings.defaultTextBold,
    italic: settings.defaultTextItalic,
    underline: settings.defaultTextUnderline
  };
}
var MindMapStudioSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "MindMap Studio" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "\u8FD9\u91CC\u8BBE\u7F6E\u5168\u5C40\u9ED8\u8BA4\u5916\u89C2\u3002\u6253\u5F00\u8111\u56FE\u540E\uFF0C\u4E5F\u53EF\u4EE5\u70B9\u51FB\u5DE5\u5177\u680F\u4E2D\u7684\u8C03\u8272\u677F\uFF0C\u4E3A\u5F53\u524D\u8111\u56FE\u5355\u72EC\u4FDD\u5B58\u4E00\u5957\u6837\u5F0F\u3002"
    });
    containerEl.createEl("h3", { text: "\u6587\u4EF6\u4E0E\u5E03\u5C40" });
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u4FDD\u5B58\u6587\u4EF6\u5939").setDesc("\u7559\u7A7A\u65F6\u4FDD\u5B58\u5728\u5F53\u524D\u7B14\u8BB0\u6240\u5728\u6587\u4EF6\u5939\uFF1B\u4E5F\u53EF\u586B\u5199\u4F8B\u5982 Mind Maps\u3002").addText((text) => text.setPlaceholder("Mind Maps").setValue(this.plugin.settings.defaultFolder).onChange(async (value) => {
      this.plugin.settings.defaultFolder = value.trim().replace(/^\/+|\/+$/g, "");
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u8D44\u6E90\u6587\u4EF6\u5939").setDesc("\u8BE5\u8DEF\u5F84\u76F8\u5BF9\u4E8E\u5F53\u524D\u8111\u56FE\u6240\u5728\u76EE\u5F55\u3002\u7C98\u8D34\u56FE\u7247\u4F1A\u4FDD\u5B58\u5230\u201C\u5F53\u524D\u8111\u56FE\u76EE\u5F55/\u8BE5\u8D44\u6E90\u6587\u4EF6\u5939/\u201D\uFF1B\u5B50\u5BFC\u56FE\u4F1A\u4FDD\u5B58\u5728\u201C\u5F53\u524D\u8111\u56FE\u76EE\u5F55/\u8BE5\u8D44\u6E90\u6587\u4EF6\u5939/\u7236\u5BFC\u56FE\u540D\u79F0/\u201D\u4E2D\u3002\u9ED8\u8BA4\u4F7F\u7528 MindMap Assets\u3002").addText((text) => text.setPlaceholder("MindMap Assets").setValue(this.plugin.settings.assetFolder).onChange(async (value) => {
      this.plugin.settings.assetFolder = value.trim().replace(/^\/+|\/+$/g, "") || "MindMap Assets";
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u56FE\u7247\u4E0E\u56FE\u5E8A" });
    new import_obsidian.Setting(containerEl).setName("\u7C98\u8D34\u56FE\u7247\u540E\u81EA\u52A8\u4E0A\u4F20").setDesc("\u56FE\u7247\u4F1A\u5148\u4FDD\u5B58\u5230\u5F53\u524D\u8111\u56FE\u7684\u672C\u5730\u8D44\u6E90\u6587\u4EF6\u5939\uFF0C\u518D\u6309\u8BBE\u5B9A\u5EF6\u8FDF\u4E0A\u4F20\u3002\u53EA\u6709\u5168\u90E8\u76EE\u6807\u56FE\u5E8A\u6210\u529F\u540E\uFF0C\u624D\u4F1A\u5207\u6362\u4E3A\u8FDC\u7A0B\u7F51\u5740\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoUploadEnabled).onChange(async (value) => {
      this.plugin.settings.autoUploadEnabled = value;
      await this.plugin.saveSettings();
      this.display();
    }));
    if (this.plugin.settings.autoUploadEnabled) {
      new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u4E0A\u4F20\u5EF6\u8FDF").setDesc("\u7C98\u8D34\u540E\u7B49\u5F85 0\u2013300 \u79D2\u518D\u4E0A\u4F20\uFF0C\u4FBF\u4E8E\u64A4\u9500\u6216\u7EE7\u7EED\u7F16\u8F91\u3002").addSlider((slider) => slider.setLimits(0, 300, 1).setDynamicTooltip().setValue(this.plugin.settings.autoUploadDelaySeconds).onChange(async (value) => {
        this.plugin.settings.autoUploadDelaySeconds = value;
        await this.plugin.saveSettings();
      }));
      new import_obsidian.Setting(containerEl).setName("\u5168\u90E8\u6210\u529F\u540E\u5220\u9664\u672C\u5730\u56FE\u7247").setDesc("\u63D2\u4EF6\u4F1A\u5148\u5199\u5165\u8FDC\u7A0B\u7F51\u5740\u5E76\u4FDD\u5B58\u8111\u56FE\uFF0C\u518D\u68C0\u67E5\u56FE\u7247\u662F\u5426\u88AB\u5176\u4ED6\u8111\u56FE\u5F15\u7528\uFF1B\u786E\u8BA4\u5B89\u5168\u540E\u624D\u5220\u9664\u672C\u5730\u6587\u4EF6\u3002\u4EFB\u4E00\u56FE\u5E8A\u5931\u8D25\u65F6\u4F1A\u4FDD\u7559\u672C\u5730\u56FE\u7247\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.deleteLocalAfterUpload).onChange(async (value) => {
        this.plugin.settings.deleteLocalAfterUpload = value;
        await this.plugin.saveSettings();
      }));
    }
    const hosts = this.plugin.settings.imageHosts;
    const hostsHeader = containerEl.createDiv({ cls: "mms-image-hosts-header" });
    hostsHeader.createEl("h4", { text: "\u56FE\u5E8A\u914D\u7F6E" });
    const addHost = hostsHeader.createEl("button", { text: "\u65B0\u589E\u56FE\u5E8A", attr: { type: "button" } });
    addHost.addEventListener("click", () => {
      const host = createImageHostConfig(hosts.length + 1);
      this.plugin.settings.imageHosts.push(host);
      void this.plugin.saveSettings().then(() => this.display());
    });
    if (!hosts.length) {
      containerEl.createDiv({ cls: "setting-item-description mms-image-host-empty", text: "\u5C1A\u672A\u914D\u7F6E\u56FE\u5E8A\u3002\u65B0\u589E\u540E\u53EF\u4EE5\u6D4B\u8BD5\u4E0A\u4F20\u63A5\u53E3\uFF0C\u5E76\u9009\u62E9\u4E00\u4E2A\u6216\u591A\u4E2A\u81EA\u52A8\u4E0A\u4F20\u76EE\u6807\u3002" });
    }
    hosts.forEach((host, index) => {
      const card = containerEl.createDiv({ cls: "mms-image-host-card" });
      const title = card.createDiv({ cls: "mms-image-host-card-title" });
      title.createEl("strong", { text: host.name || `\u56FE\u5E8A ${index + 1}` });
      const status = title.createSpan({ cls: "mms-image-host-status", text: host.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u505C\u7528" });
      status.toggleClass("is-enabled", host.enabled);
      new import_obsidian.Setting(card).setName("\u540D\u79F0").addText((text) => text.setValue(host.name).setPlaceholder(`\u56FE\u5E8A ${index + 1}`).onChange(async (value) => {
        host.name = value.trim() || `\u56FE\u5E8A ${index + 1}`;
        await this.plugin.saveSettings();
      })).addToggle((toggle) => toggle.setTooltip("\u542F\u7528\u8BE5\u56FE\u5E8A").setValue(host.enabled).onChange(async (value) => {
        host.enabled = value;
        if (!value) this.plugin.settings.autoUploadHostIds = this.plugin.settings.autoUploadHostIds.filter((id) => id !== host.id);
        await this.plugin.saveSettings();
        this.display();
      }));
      new import_obsidian.Setting(card).setName("\u4E0A\u4F20 API").addText((text) => text.setPlaceholder("https://example.com/api/upload").setValue(host.endpoint).onChange(async (value) => {
        host.endpoint = value.trim();
        await this.plugin.saveSettings();
      }));
      new import_obsidian.Setting(card).setName("\u8BF7\u6C42\u65B9\u6CD5\u4E0E\u683C\u5F0F").addDropdown((dropdown) => dropdown.addOption("POST", "POST").addOption("PUT", "PUT").setValue(host.method).onChange(async (value) => {
        host.method = value;
        await this.plugin.saveSettings();
      })).addDropdown((dropdown) => dropdown.addOption("multipart", "multipart/form-data").addOption("raw", "\u539F\u59CB\u4E8C\u8FDB\u5236").setValue(host.bodyMode).onChange(async (value) => {
        host.bodyMode = value;
        await this.plugin.saveSettings();
      }));
      new import_obsidian.Setting(card).setName("\u6587\u4EF6\u5B57\u6BB5\u540D").setDesc("multipart \u6A21\u5F0F\u5E38\u89C1\u503C\uFF1Afile\u3001image\u3001source\u3002").addText((text) => text.setValue(host.fieldName).setPlaceholder("file").onChange(async (value) => {
        host.fieldName = value.trim() || "file";
        await this.plugin.saveSettings();
      }));
      new import_obsidian.Setting(card).setName("\u8BF7\u6C42\u5934 JSON").setDesc("\u4F8B\u5982 Authorization\u3001X-API-Key\u3002\u5BC6\u94A5\u4FDD\u5B58\u5728\u63D2\u4EF6 data.json\u3002").addTextArea((text) => text.setValue(host.headers).setPlaceholder('{"Authorization":"Bearer ..."}').onChange(async (value) => {
        host.headers = value.trim();
        await this.plugin.saveSettings();
      }));
      new import_obsidian.Setting(card).setName("\u8FD4\u56DE\u7F51\u5740\u5B57\u6BB5").setDesc("\u4F8B\u5982 data.url\uFF1B\u7559\u7A7A\u4F1A\u5C1D\u8BD5\u5E38\u89C1\u5B57\u6BB5\u3002").addText((text) => text.setValue(host.responsePath).setPlaceholder("data.url").onChange(async (value) => {
        host.responsePath = value.trim();
        await this.plugin.saveSettings();
      }));
      const isAutoTarget = this.plugin.settings.autoUploadHostIds.includes(host.id);
      new import_obsidian.Setting(card).setName("\u81EA\u52A8\u4E0A\u4F20\u76EE\u6807").setDesc("\u81EA\u52A8\u4E0A\u4F20\u53EF\u4EE5\u540C\u65F6\u9009\u62E9\u591A\u4E2A\u56FE\u5E8A\uFF1B\u624B\u52A8\u4E0A\u4F20\u65F6\u4ECD\u53EF\u4E34\u65F6\u9009\u62E9\u5176\u4ED6\u7EC4\u5408\u3002").addToggle((toggle) => toggle.setValue(isAutoTarget).setDisabled(!host.enabled).onChange(async (value) => {
        const selected = new Set(this.plugin.settings.autoUploadHostIds);
        if (value) selected.add(host.id);
        else selected.delete(host.id);
        this.plugin.settings.autoUploadHostIds = Array.from(selected);
        await this.plugin.saveSettings();
      }));
      const actions = card.createDiv({ cls: "mms-image-host-actions" });
      const test = actions.createEl("button", { text: "\u68C0\u6D4B API \u8FDE\u901A\u6027", attr: { type: "button" } });
      test.addEventListener("click", () => {
        test.disabled = true;
        test.setText("\u68C0\u6D4B\u4E2D\u2026");
        void this.plugin.testImageHost(host.id).finally(() => {
          test.disabled = false;
          test.setText("\u68C0\u6D4B API \u8FDE\u901A\u6027");
        });
      });
      const remove = actions.createEl("button", { text: "\u5220\u9664\u56FE\u5E8A", cls: "mod-warning", attr: { type: "button" } });
      remove.addEventListener("click", () => {
        this.plugin.settings.imageHosts = this.plugin.settings.imageHosts.filter((item) => item.id !== host.id);
        this.plugin.settings.autoUploadHostIds = this.plugin.settings.autoUploadHostIds.filter((id) => id !== host.id);
        void this.plugin.saveSettings().then(() => {
          new import_obsidian.Notice(`\u5DF2\u5220\u9664\u56FE\u5E8A\uFF1A${host.name}`);
          this.display();
        });
      });
    });
    new import_obsidian.Setting(containerEl).setName("\u65B0\u6587\u4EF6\u540D\u524D\u7F00").setDesc("\u65B0\u5EFA\u8111\u56FE\u65F6\u4F7F\u7528\uFF1A\u524D\u7F00 + \u65E5\u671F\u65F6\u95F4\u3002\u6587\u4EF6\u540E\u7F00\u56FA\u5B9A\u4E3A .mindmap\u3002").addText((text) => text.setPlaceholder("\u601D\u7EF4\u5BFC\u56FE").setValue(this.plugin.settings.filePrefix).onChange(async (value) => {
      this.plugin.settings.filePrefix = value.trim() || "\u601D\u7EF4\u5BFC\u56FE";
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u5E03\u5C40").setDesc("\u5355\u4FA7\u9002\u5408\u6D41\u7A0B\u62C6\u89E3\uFF0C\u53CC\u4FA7\u9002\u5408\u5934\u8111\u98CE\u66B4\u3002").addDropdown((dropdown) => dropdown.addOption("right", "\u5411\u53F3\u5C55\u5F00").addOption("balanced", "\u5DE6\u53F3\u5E73\u8861").setValue(this.plugin.settings.defaultLayout).onChange(async (value) => {
      this.plugin.settings.defaultLayout = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u4E3B\u9898").addDropdown((dropdown) => dropdown.addOption("auto", "\u8DDF\u968F Obsidian").addOption("light", "\u6D45\u8272").addOption("dark", "\u6DF1\u8272").setValue(this.plugin.settings.defaultTheme).onChange(async (value) => {
      this.plugin.settings.defaultTheme = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u753B\u5E03\u80CC\u666F" });
    this.addOptionalColorSetting(
      containerEl,
      "\u80CC\u666F\u989C\u8272",
      "\u7559\u7A7A\u65F6\u8DDF\u968F Obsidian \u5F53\u524D\u4E3B\u9898\u3002",
      () => this.plugin.settings.backgroundColor,
      async (value) => {
        this.plugin.settings.backgroundColor = value;
      },
      "#f8fafc"
    );
    new import_obsidian.Setting(containerEl).setName("\u80CC\u666F\u56FE\u6848").setDesc("\u53EF\u9009\u62E9\u7F51\u683C\u3001\u70B9\u9635\u6216\u7EAF\u8272\u80CC\u666F\u3002").addDropdown((dropdown) => dropdown.addOption("none", "\u65E0").addOption("grid", "\u7F51\u683C").addOption("dots", "\u70B9\u9635").setValue(this.plugin.settings.backgroundPattern).onChange(async (value) => {
      this.plugin.settings.backgroundPattern = value;
      this.plugin.settings.showGrid = value !== "none";
      await this.saveAndRefresh();
    }));
    this.addOptionalColorSetting(
      containerEl,
      "\u80CC\u666F\u56FE\u6848\u989C\u8272",
      "\u63A7\u5236\u7F51\u683C\u7EBF\u6216\u70B9\u9635\u7684\u989C\u8272\u3002",
      () => this.plugin.settings.backgroundPatternColor,
      async (value) => {
        this.plugin.settings.backgroundPatternColor = value || "#94a3b8";
      },
      "#94a3b8",
      false
    );
    containerEl.createEl("h3", { text: "\u5B57\u4F53\u4E0E\u6587\u5B57" });
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u5B57\u4F53").addDropdown((dropdown) => dropdown.addOption("obsidian", "\u8DDF\u968F Obsidian").addOption("sans", "\u65E0\u886C\u7EBF\u5B57\u4F53").addOption("serif", "\u886C\u7EBF\u5B57\u4F53").addOption("mono", "\u7B49\u5BBD\u5B57\u4F53").addOption("custom", "\u81EA\u5B9A\u4E49\u5B57\u4F53").setValue(this.plugin.settings.fontFamily).onChange(async (value) => {
      this.plugin.settings.fontFamily = value;
      await this.saveAndRefresh();
      this.display();
    }));
    if (this.plugin.settings.fontFamily === "custom") {
      new import_obsidian.Setting(containerEl).setName("\u81EA\u5B9A\u4E49\u5B57\u4F53\u540D\u79F0").setDesc("\u586B\u5199\u7CFB\u7EDF\u4E2D\u5DF2\u7ECF\u5B89\u88C5\u7684\u5B57\u4F53\u540D\u79F0\uFF0C\u4F8B\u5982 Microsoft YaHei\u3001PingFang SC\u3002").addText((text) => text.setPlaceholder("Microsoft YaHei").setValue(this.plugin.settings.customFont).onChange(async (value) => {
        this.plugin.settings.customFont = value.trim().slice(0, 120);
        await this.saveAndRefresh();
      }));
    }
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u5B57\u53F7").setDesc("\u8303\u56F4 10\u201330 \u50CF\u7D20\u3002\u8282\u70B9\u4ECD\u53EF\u5355\u72EC\u8986\u76D6\u5B57\u53F7\u3002").addSlider((slider) => slider.setLimits(10, 30, 1).setDynamicTooltip().setValue(this.plugin.settings.fontSize).onChange(async (value) => {
      this.plugin.settings.fontSize = value;
      await this.saveAndRefresh();
    }));
    this.addOptionalColorSetting(
      containerEl,
      "\u9ED8\u8BA4\u6587\u5B57\u989C\u8272",
      "\u7559\u7A7A\u65F6\u4F7F\u7528 Obsidian \u4E3B\u9898\u6587\u5B57\u989C\u8272\uFF1B\u6839\u8282\u70B9\u4ECD\u4F18\u5148\u4F7F\u7528\u4E3B\u9898\u5F3A\u8C03\u8272\u7684\u5BF9\u6BD4\u6587\u5B57\u3002",
      () => this.plugin.settings.textColor,
      async (value) => {
        this.plugin.settings.textColor = value;
      },
      "#0f172a"
    );
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u6587\u5B57\u52A0\u7C97").addToggle((toggle) => toggle.setValue(this.plugin.settings.defaultTextBold).onChange(async (value) => {
      this.plugin.settings.defaultTextBold = value;
      await this.saveAndRefresh();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u6587\u5B57\u659C\u4F53").addToggle((toggle) => toggle.setValue(this.plugin.settings.defaultTextItalic).onChange(async (value) => {
      this.plugin.settings.defaultTextItalic = value;
      await this.saveAndRefresh();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u6587\u5B57\u4E0B\u5212\u7EBF").addToggle((toggle) => toggle.setValue(this.plugin.settings.defaultTextUnderline).onChange(async (value) => {
      this.plugin.settings.defaultTextUnderline = value;
      await this.saveAndRefresh();
    }));
    containerEl.createEl("h3", { text: "\u8282\u70B9\u6837\u5F0F" });
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u8282\u70B9\u5F62\u72B6").setDesc("\u53EA\u5F71\u54CD\u672A\u5355\u72EC\u8BBE\u7F6E\u5F62\u72B6\u7684\u8282\u70B9\u3002").addDropdown((dropdown) => dropdown.addOption("rounded", "\u5706\u89D2").addOption("pill", "\u80F6\u56CA").addOption("rectangle", "\u76F4\u89D2").setValue(this.plugin.settings.defaultNodeShape).onChange(async (value) => {
      this.plugin.settings.defaultNodeShape = value;
      await this.saveAndRefresh();
    }));
    this.addOptionalColorSetting(
      containerEl,
      "\u9ED8\u8BA4\u8282\u70B9\u80CC\u666F\u8272",
      "\u7559\u7A7A\u65F6\u8DDF\u968F Obsidian \u4E3B\u9898\u3002\u5355\u4E2A\u8282\u70B9\u8BBE\u7F6E\u7684\u989C\u8272\u4F18\u5148\u7EA7\u66F4\u9AD8\u3002",
      () => this.plugin.settings.nodeBackgroundColor,
      async (value) => {
        this.plugin.settings.nodeBackgroundColor = value;
      },
      "#ffffff"
    );
    this.addOptionalColorSetting(
      containerEl,
      "\u9ED8\u8BA4\u8282\u70B9\u8FB9\u6846\u989C\u8272",
      "\u7559\u7A7A\u65F6\u8DDF\u968F Obsidian \u4E3B\u9898\u8FB9\u6846\u989C\u8272\u3002",
      () => this.plugin.settings.nodeBorderColor,
      async (value) => {
        this.plugin.settings.nodeBorderColor = value;
      },
      "#94a3b8"
    );
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u8282\u70B9\u8FB9\u6846\u7C97\u7EC6").setDesc("\u8303\u56F4 0\u20136 \u50CF\u7D20\uFF1B0 \u8868\u793A\u65E0\u8FB9\u6846\u3002").addSlider((slider) => slider.setLimits(0, 6, 0.5).setDynamicTooltip().setValue(this.plugin.settings.nodeBorderWidth).onChange(async (value) => {
      this.plugin.settings.nodeBorderWidth = value;
      await this.saveAndRefresh();
    }));
    containerEl.createEl("h3", { text: "\u8FDE\u7EBF\u6837\u5F0F" });
    new import_obsidian.Setting(containerEl).setName("\u8FDE\u7EBF\u7C7B\u578B").addDropdown((dropdown) => dropdown.addOption("curved", "\u66F2\u7EBF").addOption("straight", "\u76F4\u7EBF").addOption("elbow", "\u6298\u7EBF").setValue(this.plugin.settings.edgeStyle).onChange(async (value) => {
      this.plugin.settings.edgeStyle = value;
      await this.saveAndRefresh();
    }));
    this.addOptionalColorSetting(
      containerEl,
      "\u8FDE\u7EBF\u989C\u8272",
      "\u7559\u7A7A\u65F6\u4F7F\u7528\u5F53\u524D\u4E3B\u9898\u5F3A\u8C03\u8272\u3002\u8282\u70B9\u5355\u72EC\u8BBE\u7F6E\u989C\u8272\u65F6\uFF0C\u53EF\u7EE7\u7EED\u4E3A\u8BE5\u5206\u652F\u8FDE\u7EBF\u7740\u8272\u3002",
      () => this.plugin.settings.edgeColor,
      async (value) => {
        this.plugin.settings.edgeColor = value;
      },
      "#7c8aa5"
    );
    new import_obsidian.Setting(containerEl).setName("\u8FDE\u7EBF\u7C97\u7EC6").setDesc("\u8303\u56F4 0.5\u20138 \u50CF\u7D20\u3002").addSlider((slider) => slider.setLimits(0.5, 8, 0.5).setDynamicTooltip().setValue(this.plugin.settings.edgeWidth).onChange(async (value) => {
      this.plugin.settings.edgeWidth = value;
      await this.saveAndRefresh();
    }));
    containerEl.createEl("h3", { text: "\u7F16\u8F91\u4E0E\u517C\u5BB9" });
    new import_obsidian.Setting(containerEl).setName("\u6253\u5F00\u65E7\u7248\u8111\u56FE\u65F6\u81EA\u52A8\u8F6C\u6362").setDesc("\u81EA\u52A8\u521B\u5EFA\u540C\u540D .mindmap \u6587\u4EF6\u5E76\u6253\u5F00\uFF1B\u65E7\u6587\u4EF6\u4F1A\u4FDD\u7559\u4E3A\u5907\u4EFD\uFF0C\u4E0D\u4F1A\u8986\u76D6\u6216\u5220\u9664\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.redirectLegacyFiles).onChange(async (value) => {
      this.plugin.settings.redirectLegacyFiles = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u663E\u793A\u4EFB\u52A1\u8FDB\u5EA6").setDesc("\u5728\u5305\u542B\u4EFB\u52A1\u7684\u5206\u652F\u8282\u70B9\u5E95\u90E8\u663E\u793A\u5B8C\u6210\u767E\u5206\u6BD4\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.showTaskProgress).onChange(async (value) => {
      this.plugin.settings.showTaskProgress = value;
      await this.saveAndRefresh();
    }));
    new import_obsidian.Setting(containerEl).setName("\u6253\u5F00\u65F6\u81EA\u52A8\u9002\u5E94\u753B\u5E03").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoFitOnOpen).onChange(async (value) => {
      this.plugin.settings.autoFitOnOpen = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u64A4\u9500\u5386\u53F2\u6B65\u6570").setDesc("\u8303\u56F4 20\u2013500\uFF1B\u6570\u503C\u8D8A\u5927\u5360\u7528\u7684\u5185\u5B58\u8D8A\u591A\u3002").addSlider((slider) => slider.setLimits(20, 500, 10).setDynamicTooltip().setValue(this.plugin.settings.historyLimit).onChange(async (value) => {
      this.plugin.settings.historyLimit = value;
      await this.saveAndRefresh();
    }));
    new import_obsidian.Setting(containerEl).setName("\u5D4C\u5165\u9884\u89C8\u6700\u5927\u9AD8\u5EA6").setDesc("\u8303\u56F4 240\u20131200 \u50CF\u7D20\u3002").addSlider((slider) => slider.setLimits(240, 1200, 20).setDynamicTooltip().setValue(this.plugin.settings.embedMaxHeight).onChange(async (value) => {
      this.plugin.settings.embedMaxHeight = value;
      await this.plugin.saveSettings();
    }));
  }
  addOptionalColorSetting(container, name, description, getValue, setValue, fallback, allowReset = true) {
    const setting = new import_obsidian.Setting(container).setName(name).setDesc(description).addColorPicker((picker) => picker.setValue(getValue() || fallback).onChange(async (value) => {
      await setValue(value);
      await this.saveAndRefresh();
    }));
    if (allowReset) {
      setting.addButton((button) => button.setButtonText("\u8DDF\u968F\u4E3B\u9898").onClick(async () => {
        await setValue("");
        await this.saveAndRefresh();
        this.display();
      }));
    }
  }
  async saveAndRefresh() {
    await this.plugin.saveSettings();
    this.plugin.refreshOpenViews();
  }
};

// src/layout.ts
var ROOT_WIDTH = 196;
var NODE_WIDTH = 176;
var H_GAP = 112;
var V_GAP = 24;
function visibleChildren(node) {
  return node.collapsed ? [] : node.children;
}
function nodeDimensions(node, depth, defaultFontSize = 14) {
  var _a, _b, _c;
  const fontSize = (_b = (_a = node.style) == null ? void 0 : _a.fontSize) != null ? _b : defaultFontSize;
  const extraWidth = Math.max(0, fontSize - 14) * 4;
  let width = (depth === 0 ? ROOT_WIDTH : NODE_WIDTH) + extraWidth;
  let height = 28 + Math.max(0, fontSize - 14) * 1.4;
  const blocks = nodeContentBlocks(node);
  if (!blocks.length) height += depth === 0 ? 34 : 26;
  for (const block of blocks) {
    if (block.type === "image") {
      width = Math.max(width, 240);
      height += 132;
    } else {
      const length = Math.max(1, block.text.length);
      width = Math.max(width, Math.min(460, 80 + Math.min(length, 42) * fontSize * 0.62));
      height += Math.max(30, Math.ceil(length / 34) * (fontSize + 8));
    }
  }
  if ((_c = node.tags) == null ? void 0 : _c.length) height += 20;
  if (node.submap) {
    width = Math.max(width, 220);
    height += 30;
  }
  if (node.table) {
    const columns = Math.max(1, node.table.headers.length);
    const visibleRows = Math.min(10, node.table.rows.length);
    width = Math.min(720, Math.max(300, columns * 124));
    height += 42 + visibleRows * 31 + (node.table.rows.length > visibleRows ? 24 : 0);
  }
  if (node.code) {
    const lines = node.code.code.split(/\r?\n/);
    const longest = Math.max(20, ...lines.slice(0, 80).map((line) => line.length));
    width = Math.min(720, Math.max(380, longest * 7.2 + 42));
    height += Math.min(390, Math.max(100, Math.min(lines.length, 18) * 20 + 48));
  }
  return { width, height: Math.min(560, height) };
}
function subtreeHeight(node, depth, defaultFontSize = 14) {
  const ownHeight = nodeDimensions(node, depth, defaultFontSize).height;
  const children = visibleChildren(node);
  if (!children.length) return ownHeight;
  const childrenHeight = children.reduce((sum, child) => sum + subtreeHeight(child, depth + 1, defaultFontSize), 0) + V_GAP * (children.length - 1);
  return Math.max(ownHeight, childrenHeight);
}
function layoutBranch(node, parentId, parentX, parentWidth, side, depth, centerY, output, defaultFontSize = 14) {
  const dimensions = nodeDimensions(node, depth, defaultFontSize);
  const x = parentX + side * (parentWidth / 2 + H_GAP + dimensions.width / 2);
  output.push({ node, parentId, x, y: centerY, depth, side, ...dimensions });
  const children = visibleChildren(node);
  if (!children.length) return;
  const heights = children.map((child) => subtreeHeight(child, depth + 1, defaultFontSize));
  const totalHeight = heights.reduce((sum, childHeight) => sum + childHeight, 0) + V_GAP * (children.length - 1);
  let cursor = centerY - totalHeight / 2;
  children.forEach((child, index) => {
    var _a;
    const childHeight = (_a = heights[index]) != null ? _a : nodeDimensions(child, depth + 1, defaultFontSize).height;
    const childCenter = cursor + childHeight / 2;
    layoutBranch(child, node.id, x, dimensions.width, side, depth + 1, childCenter, output, defaultFontSize);
    cursor += childHeight + V_GAP;
  });
}
function computeLayout(root, mode, defaultFontSize = 14) {
  const rootDimensions = nodeDimensions(root, 0, defaultFontSize);
  const nodes = [
    { node: root, parentId: null, x: 0, y: 0, depth: 0, side: 0, ...rootDimensions }
  ];
  const children = visibleChildren(root);
  if (mode === "balanced" && children.length > 1) {
    const left = [];
    const right = [];
    let leftHeight = 0;
    let rightHeight = 0;
    for (const child of [...children].sort((a, b) => subtreeHeight(b, 1, defaultFontSize) - subtreeHeight(a, 1, defaultFontSize))) {
      const height = subtreeHeight(child, 1, defaultFontSize) + V_GAP;
      if (leftHeight <= rightHeight) {
        left.push(child);
        leftHeight += height;
      } else {
        right.push(child);
        rightHeight += height;
      }
    }
    const placeSide = (items, side) => {
      const heights = items.map((child) => subtreeHeight(child, 1, defaultFontSize));
      const total = heights.reduce((sum, value) => sum + value, 0) + V_GAP * Math.max(0, items.length - 1);
      let cursor = -total / 2;
      items.forEach((child, index) => {
        var _a;
        const height = (_a = heights[index]) != null ? _a : nodeDimensions(child, 1, defaultFontSize).height;
        layoutBranch(child, root.id, 0, rootDimensions.width, side, 1, cursor + height / 2, nodes, defaultFontSize);
        cursor += height + V_GAP;
      });
    };
    placeSide(left, -1);
    placeSide(right, 1);
  } else {
    const heights = children.map((child) => subtreeHeight(child, 1, defaultFontSize));
    const total = heights.reduce((sum, value) => sum + value, 0) + V_GAP * Math.max(0, children.length - 1);
    let cursor = -total / 2;
    children.forEach((child, index) => {
      var _a;
      const height = (_a = heights[index]) != null ? _a : nodeDimensions(child, 1, defaultFontSize).height;
      layoutBranch(child, root.id, 0, rootDimensions.width, 1, 1, cursor + height / 2, nodes, defaultFontSize);
      cursor += height + V_GAP;
    });
  }
  const byId = new Map(nodes.map((position) => [position.node.id, position]));
  const minX = Math.min(...nodes.map((position) => position.x - position.width / 2));
  const maxX = Math.max(...nodes.map((position) => position.x + position.width / 2));
  const minY = Math.min(...nodes.map((position) => position.y - position.height / 2));
  const maxY = Math.max(...nodes.map((position) => position.y + position.height / 2));
  return { nodes, byId, minX, maxX, minY, maxY };
}
function edgePath(parent, child, style = "curved") {
  const parentX = parent.x + (child.side >= 0 ? parent.width / 2 : -parent.width / 2);
  const childX = child.x - (child.side >= 0 ? child.width / 2 : -child.width / 2);
  if (style === "straight") return `M ${parentX} ${parent.y} L ${childX} ${child.y}`;
  const middleX = parentX + (childX - parentX) * 0.5;
  if (style === "elbow") return `M ${parentX} ${parent.y} L ${middleX} ${parent.y} L ${middleX} ${child.y} L ${childX} ${child.y}`;
  return `M ${parentX} ${parent.y} C ${middleX} ${parent.y}, ${middleX} ${child.y}, ${childX} ${child.y}`;
}
function escapeXml(value) {
  return value.replace(/[<>&"']/g, (character) => {
    var _a;
    const entities = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" };
    return (_a = entities[character]) != null ? _a : character;
  });
}
function validColor(value, fallback) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
function svgRadius(shape) {
  if (shape === "rectangle") return 3;
  if (shape === "pill") return 28;
  return 14;
}
function taskGlyph(node) {
  if (node.task === "done") return "\u2713 ";
  if (node.task === "doing") return "\u25D0 ";
  if (node.task === "todo") return "\u25CB ";
  return "";
}
function truncateRuns(runs, maxLength) {
  const result = [];
  let remaining = maxLength;
  let truncated = false;
  for (const run of runs) {
    if (remaining <= 0) {
      truncated = true;
      break;
    }
    if (run.text.length <= remaining) {
      result.push({ text: run.text, style: run.style });
      remaining -= run.text.length;
      continue;
    }
    result.push({ text: run.text.slice(0, remaining), style: run.style });
    remaining = 0;
    truncated = true;
  }
  if (truncated && result.length) result[result.length - 1].text = `${result[result.length - 1].text.slice(0, -1)}\u2026`;
  return result;
}
function richTextTspans(runs, fallbackText, prefix, foreground) {
  const source = [
    ...prefix ? [{ text: prefix }] : [],
    ...(runs == null ? void 0 : runs.length) ? runs : [{ text: fallbackText }]
  ];
  return truncateRuns(source, 42).map((run) => {
    const style = run.style;
    const attributes = [];
    if (style == null ? void 0 : style.color) attributes.push(`fill="${validColor(style.color, foreground)}"`);
    if ((style == null ? void 0 : style.bold) !== void 0) attributes.push(`font-weight="${style.bold ? 700 : 400}"`);
    if ((style == null ? void 0 : style.italic) !== void 0) attributes.push(`font-style="${style.italic ? "italic" : "normal"}"`);
    const decorations = [];
    if (style == null ? void 0 : style.underline) decorations.push("underline");
    if (style == null ? void 0 : style.strike) decorations.push("line-through");
    if (decorations.length) attributes.push(`text-decoration="${decorations.join(" ")}"`);
    return `<tspan ${attributes.join(" ")}>${escapeXml(run.text)}</tspan>`;
  }).join("");
}
function svgFontFamily(mode, customFont) {
  if (mode === "serif") return 'Georgia,"Times New Roman",serif';
  if (mode === "mono") return '"SFMono-Regular",Consolas,"Liberation Mono",monospace';
  if (mode === "custom" && (customFont == null ? void 0 : customFont.trim())) return `"${customFont.trim().replaceAll('"', "")}",sans-serif`;
  return 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
}
function documentToSvg(root, mode, title, appearance = {}) {
  var _a, _b, _c, _d;
  const defaultFontSize = (_a = appearance.fontSize) != null ? _a : 14;
  const layout = computeLayout(root, mode, defaultFontSize);
  const padding = 72;
  const width = Math.max(320, layout.maxX - layout.minX + padding * 2);
  const height = Math.max(220, layout.maxY - layout.minY + padding * 2);
  const offsetX = padding - layout.minX;
  const offsetY = padding - layout.minY;
  const edgeStyle = (_b = appearance.edgeStyle) != null ? _b : "curved";
  const edgeWidth = (_c = appearance.edgeWidth) != null ? _c : 2.2;
  const defaultEdge = validColor(appearance.edgeColor, "#7c8aa5");
  const edges = layout.nodes.filter((position) => position.parentId).map((position) => {
    var _a2;
    const parent = position.parentId ? layout.byId.get(position.parentId) : void 0;
    const stroke = validColor((_a2 = position.node.style) == null ? void 0 : _a2.color, defaultEdge);
    return parent ? `<path d="${edgePath(parent, position, edgeStyle)}" fill="none" stroke="${stroke}" stroke-width="${edgeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>` : "";
  }).join("\n");
  const nodes = layout.nodes.map((position) => {
    var _a2, _b2, _c2, _d2, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
    const node = position.node;
    const x = position.x - position.width / 2;
    const y = position.y - position.height / 2;
    const isRoot = position.depth === 0;
    const defaultBackground = isRoot ? "#4f46e5" : validColor(appearance.nodeColor, "#ffffff");
    const defaultText = isRoot ? "#ffffff" : validColor(appearance.textColor, "#0f172a");
    const background2 = validColor((_a2 = node.style) == null ? void 0 : _a2.color, defaultBackground);
    const foreground = validColor((_b2 = node.style) == null ? void 0 : _b2.textColor, defaultText);
    const border = validColor((_c2 = node.style) == null ? void 0 : _c2.borderColor, isRoot ? background2 : validColor(appearance.nodeBorderColor, "#94a3b8"));
    const borderWidth = (_f = (_e = (_d2 = node.style) == null ? void 0 : _d2.borderWidth) != null ? _e : appearance.nodeBorderWidth) != null ? _f : isRoot ? 2 : 1;
    const prefix = `${node.icon ? `${node.icon} ` : ""}${taskGlyph(node)}`;
    const contentBlocks = nodeContentBlocks(node);
    let contentY = y + 28;
    const contentParts = [];
    let prefixUsed = false;
    for (const block of contentBlocks) {
      if (block.type === "image") {
        contentParts.push(`<rect x="${position.x - 70}" y="${contentY - 14}" width="140" height="94" rx="8" fill="rgba(127,127,127,.12)"/><text x="${position.x}" y="${contentY + 38}" text-anchor="middle" fill="${foreground}" font-size="12">\u{1F5BC} ${escapeXml(((_g = block.alt) != null ? _g : "\u56FE\u7247").slice(0, 20))}</text>`);
        contentY += 112;
      } else if (block.text.trim()) {
        const blockPrefix = prefixUsed ? "" : prefix;
        prefixUsed = true;
        contentParts.push(`<text x="${position.x}" y="${contentY}" text-anchor="middle" fill="${foreground}" font-size="${(_i = (_h = node.style) == null ? void 0 : _h.fontSize) != null ? _i : defaultFontSize}">${richTextTspans(block.richText, block.text, blockPrefix, foreground)}</text>`);
        contentY += ((_k = (_j = node.style) == null ? void 0 : _j.fontSize) != null ? _k : defaultFontSize) + 15;
      }
    }
    if (!contentBlocks.length) contentParts.push(`<text x="${position.x}" y="${contentY}" text-anchor="middle" fill="${foreground}" font-size="${(_m = (_l = node.style) == null ? void 0 : _l.fontSize) != null ? _m : defaultFontSize}">${escapeXml(prefix || nodePlainText(node) || "\u56FE\u7247\u8282\u70B9")}</text>`);
    let richY = contentY + 10;
    const richParts = [];
    if (node.submap) {
      richParts.push(`<rect x="${x + 12}" y="${richY}" width="${position.width - 24}" height="25" rx="6" fill="rgba(99,102,241,.10)" stroke="${foreground}" stroke-opacity=".28" stroke-dasharray="4 3"/><text x="${position.x}" y="${richY + 17}" text-anchor="middle" fill="${foreground}" font-size="10">\u21B3 ${escapeXml(((_n = node.submap.title) != null ? _n : node.submap.path).slice(0, 54))}</text>`);
      richY += 34;
    }
    if (node.table) {
      const rows = [node.table.headers, ...node.table.rows.slice(0, 8)];
      rows.forEach((row, index) => {
        const rowText = escapeXml(row.map((cell) => cell.replaceAll("\n", " ")).join("  |  ").slice(0, 100));
        richParts.push(`<text x="${x + 16}" y="${richY + index * 23}" fill="${foreground}" font-size="${index === 0 ? 10.5 : 9.5}" font-weight="${index === 0 ? 700 : 400}">${rowText}</text>`);
      });
      if (node.table.rows.length > 8) richParts.push(`<text x="${x + 16}" y="${richY + rows.length * 23}" fill="${foreground}" opacity=".65" font-size="9">\u2026 \u8FD8\u6709 ${node.table.rows.length - 8} \u884C</text>`);
    }
    if (node.code) {
      richParts.push(`<rect x="${x + 12}" y="${richY - 14}" width="${position.width - 24}" height="${Math.min(350, Math.max(80, node.code.code.split(/\r?\n/).length * 17 + 34))}" rx="7" fill="rgba(15,23,42,.10)"/>`);
      richParts.push(`<text x="${x + 20}" y="${richY + 3}" fill="${foreground}" opacity=".7" font-size="9">${escapeXml(node.code.language || "code")}</text>`);
      node.code.code.split(/\r?\n/).slice(0, 16).forEach((line, index) => richParts.push(`<text x="${x + 20}" y="${richY + 23 + index * 17}" fill="${foreground}" font-size="9" font-family="monospace">${escapeXml(line.slice(0, 92))}</text>`));
    }
    const richContent = richParts.join("");
    const tags = ((_o = node.tags) == null ? void 0 : _o.length) ? `<text x="${position.x}" y="${position.y + position.height / 2 - 9}" text-anchor="middle" fill="${foreground}" opacity=".72" font-size="10">${escapeXml(node.tags.map((tag) => `#${tag}`).join("  ").slice(0, 48))}</text>` : "";
    const bold = (_r = (_q = (_p = node.style) == null ? void 0 : _p.bold) != null ? _q : appearance.bold) != null ? _r : false;
    const italic = (_u = (_t = (_s = node.style) == null ? void 0 : _s.italic) != null ? _t : appearance.italic) != null ? _u : false;
    const underline = (_x = (_w = (_v = node.style) == null ? void 0 : _v.underline) != null ? _w : appearance.underline) != null ? _x : false;
    const fontSize = (_z = (_y = node.style) == null ? void 0 : _y.fontSize) != null ? _z : defaultFontSize;
    return `<g><rect x="${x}" y="${y}" width="${position.width}" height="${position.height}" rx="${svgRadius((_A = node.style) == null ? void 0 : _A.shape)}" fill="${background2}" stroke="${border}" stroke-width="${borderWidth}"/><g font-weight="${isRoot || bold ? 700 : 400}" font-style="${italic ? "italic" : "normal"}" text-decoration="${underline ? "underline" : "none"}">${contentParts.join("")}</g>${richContent}${tags}</g>`;
  }).join("\n");
  const background = validColor(appearance.backgroundColor, "#f8fafc");
  const patternColor = validColor(appearance.patternColor, "#94a3b8");
  const pattern = (_d = appearance.backgroundPattern) != null ? _d : "none";
  const defs = pattern === "grid" ? `<defs><pattern id="mmc-pattern" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="${patternColor}" stroke-width="1" opacity=".18"/></pattern></defs><rect width="100%" height="100%" fill="url(#mmc-pattern)"/>` : pattern === "dots" ? `<defs><pattern id="mmc-pattern" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="${patternColor}" opacity=".28"/></pattern></defs><rect width="100%" height="100%" fill="url(#mmc-pattern)"/>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height)}" viewBox="0 0 ${Math.ceil(width)} ${Math.ceil(height)}">
<title>${escapeXml(title)}</title>
<style>svg{background:${background};font-family:${svgFontFamily(appearance.fontFamily, appearance.customFont)}}</style>
${defs}<g transform="translate(${offsetX} ${offsetY})">${edges}${nodes}</g>
</svg>`;
}

// src/static-render.ts
function renderStaticMindMap(container, document2, options) {
  container.empty();
  container.addClass("mmc-static-preview");
  const svg = documentToSvg(document2.root, document2.layout, document2.title, mergeAppearance(options == null ? void 0 : options.defaultAppearance, document2.appearance));
  const image = container.createEl("img", {
    attr: {
      alt: `${document2.title} \u601D\u7EF4\u5BFC\u56FE\u9884\u89C8`,
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    }
  });
  if (options == null ? void 0 : options.maxHeight) image.style.maxHeight = `${options.maxHeight}px`;
  if ((options == null ? void 0 : options.app) && options.file) {
    image.addEventListener("dblclick", () => {
      var _a;
      void ((_a = options.app) == null ? void 0 : _a.workspace.getLeaf(false).openFile(options.file));
    });
    image.setAttr("title", "\u53CC\u51FB\u6253\u5F00\u601D\u7EF4\u5BFC\u56FE");
  }
}
function renderStaticSource(container, source, fallbackTitle, defaultAppearance) {
  renderStaticMindMap(container, parseDocument(source, fallbackTitle), { defaultAppearance });
}

// src/view.ts
var import_obsidian4 = require("obsidian");

// src/editor.ts
var import_obsidian3 = require("obsidian");

// src/content-modals.ts
var import_obsidian2 = require("obsidian");
function cloneTable(table) {
  if (!table) {
    return {
      headers: ["\u5217 1", "\u5217 2"],
      rows: [["", ""], ["", ""]],
      alignments: ["left", "left"],
      source: "manual"
    };
  }
  return JSON.parse(JSON.stringify(table));
}
var TableEditModal = class extends import_obsidian2.Modal {
  constructor(app, table, submit) {
    super(app);
    this.table = cloneTable(table);
    this.submit = submit;
  }
  onOpen() {
    this.titleEl.setText("\u63D2\u5165\u6216\u7F16\u8F91\u8868\u683C");
    this.contentEl.addClass("mmc-table-modal");
    const description = this.contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "\u53EF\u4EE5\u76F4\u63A5\u7F16\u8F91\u5355\u5143\u683C\uFF0C\u4E5F\u53EF\u4EE5\u7C98\u8D34 Markdown \u8868\u683C\u540E\u70B9\u51FB\u201C\u89E3\u6790 Markdown\u201D\u3002"
    });
    description.setAttr("aria-live", "polite");
    const toolbar = this.contentEl.createDiv({ cls: "mmc-table-toolbar" });
    const addRow = toolbar.createEl("button", { text: "+ \u884C", type: "button" });
    const removeRow = toolbar.createEl("button", { text: "\u2212 \u884C", type: "button" });
    const addColumn = toolbar.createEl("button", { text: "+ \u5217", type: "button" });
    const removeColumn = toolbar.createEl("button", { text: "\u2212 \u5217", type: "button" });
    const toMarkdown = toolbar.createEl("button", { text: "\u751F\u6210 Markdown", type: "button" });
    this.gridEl = this.contentEl.createDiv({ cls: "mmc-table-editor-grid" });
    this.renderGrid();
    const markdownLabel = this.contentEl.createEl("label", { text: "Markdown \u8868\u683C" });
    this.markdownEl = markdownLabel.createEl("textarea", {
      cls: "mmc-table-markdown",
      attr: { placeholder: "| \u5217 1 | \u5217 2 |\n| --- | --- |\n| \u5185\u5BB9 | \u5185\u5BB9 |" }
    });
    this.markdownEl.rows = 8;
    this.markdownEl.value = tableToMarkdown(this.table);
    const parseButton = markdownLabel.createEl("button", { text: "\u89E3\u6790 Markdown", type: "button" });
    addRow.addEventListener("click", () => {
      this.collectGrid();
      this.table.rows.push(this.table.headers.map(() => ""));
      this.renderGrid();
    });
    removeRow.addEventListener("click", () => {
      this.collectGrid();
      if (this.table.rows.length) this.table.rows.pop();
      this.renderGrid();
    });
    addColumn.addEventListener("click", () => {
      var _a, _b;
      this.collectGrid();
      if (this.table.headers.length >= 12) {
        new import_obsidian2.Notice("\u6700\u591A\u652F\u6301 12 \u5217");
        return;
      }
      this.table.headers.push(`\u5217 ${this.table.headers.length + 1}`);
      (_b = (_a = this.table).alignments) != null ? _b : _a.alignments = [];
      this.table.alignments.push("left");
      this.table.rows.forEach((row) => row.push(""));
      this.renderGrid();
    });
    removeColumn.addEventListener("click", () => {
      var _a;
      this.collectGrid();
      if (this.table.headers.length <= 1) return;
      this.table.headers.pop();
      (_a = this.table.alignments) == null ? void 0 : _a.pop();
      this.table.rows.forEach((row) => row.pop());
      this.renderGrid();
    });
    toMarkdown.addEventListener("click", () => {
      this.collectGrid();
      this.markdownEl.value = tableToMarkdown(this.table);
    });
    parseButton.addEventListener("click", () => {
      const parsed = parseMarkdownTable(this.markdownEl.value);
      if (!parsed) {
        new import_obsidian2.Notice("\u672A\u8BC6\u522B\u5230\u6709\u6548\u7684 Markdown \u8868\u683C");
        return;
      }
      this.table = parsed;
      this.renderGrid();
      new import_obsidian2.Notice("Markdown \u8868\u683C\u5DF2\u89E3\u6790");
    });
    const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88", type: "button" });
    const save = actions.createEl("button", { text: "\u4FDD\u5B58\u8868\u683C", type: "button", cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    save.addEventListener("click", () => {
      var _a;
      this.collectGrid();
      if (!this.table.headers.some((header) => header.trim())) {
        new import_obsidian2.Notice("\u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u8868\u5934");
        return;
      }
      this.table.source = (_a = this.table.source) != null ? _a : "manual";
      this.submit(this.table);
      this.close();
    });
  }
  renderGrid() {
    this.gridEl.empty();
    const table = this.gridEl.createEl("table");
    const head = table.createEl("thead").createEl("tr");
    this.table.headers.forEach((header, index) => {
      var _a, _b;
      const th = head.createEl("th");
      const input = th.createEl("input", { type: "text", attr: { "data-kind": "header", "data-column": String(index) } });
      input.value = header;
      const align = th.createEl("select", { attr: { "data-kind": "alignment", "data-column": String(index), "aria-label": `\u7B2C ${index + 1} \u5217\u5BF9\u9F50\u65B9\u5F0F` } });
      [["left", "\u5DE6"], ["center", "\u4E2D"], ["right", "\u53F3"]].forEach(([value, label]) => align.createEl("option", { text: label, attr: { value } }));
      align.value = (_b = (_a = this.table.alignments) == null ? void 0 : _a[index]) != null ? _b : "left";
    });
    const body = table.createEl("tbody");
    this.table.rows.forEach((row, rowIndex) => {
      const tr = body.createEl("tr");
      this.table.headers.forEach((_, columnIndex) => {
        var _a;
        const td = tr.createEl("td");
        const input = td.createEl("textarea", { attr: { "data-kind": "cell", "data-row": String(rowIndex), "data-column": String(columnIndex) } });
        input.rows = 2;
        input.value = (_a = row[columnIndex]) != null ? _a : "";
      });
    });
  }
  collectGrid() {
    const headers = Array.from(this.gridEl.querySelectorAll('input[data-kind="header"]'));
    headers.forEach((input) => {
      const column = Number(input.dataset.column);
      if (Number.isInteger(column)) this.table.headers[column] = input.value.trim().slice(0, 2e3);
    });
    const alignments = Array.from(this.gridEl.querySelectorAll('select[data-kind="alignment"]'));
    this.table.alignments = this.table.headers.map(() => "left");
    alignments.forEach((input) => {
      const column = Number(input.dataset.column);
      if (Number.isInteger(column)) this.table.alignments[column] = input.value === "center" || input.value === "right" ? input.value : "left";
    });
    const cells = Array.from(this.gridEl.querySelectorAll('textarea[data-kind="cell"]'));
    cells.forEach((input) => {
      const row = Number(input.dataset.row);
      const column = Number(input.dataset.column);
      if (Number.isInteger(row) && Number.isInteger(column) && this.table.rows[row]) this.table.rows[row][column] = input.value.slice(0, 2e3);
    });
  }
};
var CodeEditModal = class extends import_obsidian2.Modal {
  constructor(app, block, submit) {
    super(app);
    this.block = block;
    this.submit = submit;
  }
  onOpen() {
    var _a, _b, _c, _d;
    this.titleEl.setText("\u63D2\u5165\u6216\u7F16\u8F91\u4EE3\u7801");
    this.contentEl.addClass("mmc-code-modal");
    const languageLabel = this.contentEl.createEl("label", { text: "\u4EE3\u7801\u8BED\u8A00" });
    const languageInput = languageLabel.createEl("input", { type: "text", attr: { placeholder: "javascript\u3001python\u3001css\u2026" } });
    languageInput.value = (_b = (_a = this.block) == null ? void 0 : _a.language) != null ? _b : "";
    const codeLabel = this.contentEl.createEl("label", { text: "\u4EE3\u7801\u5185\u5BB9" });
    const codeInput = codeLabel.createEl("textarea", { cls: "mmc-code-textarea", attr: { spellcheck: "false", placeholder: "\u53EF\u76F4\u63A5\u7C98\u8D34\u4EE3\u7801\uFF0C\u6216\u7C98\u8D34 ```\u8BED\u8A00 ... ``` fenced code block" } });
    codeInput.rows = 18;
    codeInput.value = (_d = (_c = this.block) == null ? void 0 : _c.code) != null ? _d : "";
    const detect = this.contentEl.createEl("button", { text: "\u8BC6\u522B fenced code", type: "button" });
    detect.addEventListener("click", () => {
      var _a2;
      const parsed = parseFencedCode(codeInput.value);
      if (!parsed) {
        new import_obsidian2.Notice("\u6CA1\u6709\u8BC6\u522B\u5230\u5B8C\u6574\u7684 ``` fenced code block");
        return;
      }
      languageInput.value = (_a2 = parsed.language) != null ? _a2 : "";
      codeInput.value = parsed.code;
      new import_obsidian2.Notice("\u4EE3\u7801\u8BED\u8A00\u548C\u5185\u5BB9\u5DF2\u8BC6\u522B");
    });
    const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88", type: "button" });
    const save = actions.createEl("button", { text: "\u4FDD\u5B58\u4EE3\u7801", type: "button", cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    save.addEventListener("click", () => {
      var _a2;
      let language = languageInput.value.trim();
      let code = codeInput.value;
      const fenced = parseFencedCode(code);
      if (fenced) {
        language = (_a2 = fenced.language) != null ? _a2 : language;
        code = fenced.code;
      }
      if (!code.trim()) {
        new import_obsidian2.Notice("\u4EE3\u7801\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      this.submit({ language: language.replace(/[^a-z0-9_+#.-]/gi, "").slice(0, 40) || void 0, code });
      this.close();
    });
  }
};

// src/editor.ts
function renderRichTextRuns(container, runs, fallbackText) {
  var _a, _b, _c, _d, _e;
  container.empty();
  if (!(runs == null ? void 0 : runs.length)) {
    container.setText(fallbackText);
    return;
  }
  for (const run of runs) {
    const span = container.createSpan({ cls: "mmc-rich-run", text: run.text });
    if (((_a = run.style) == null ? void 0 : _a.bold) !== void 0) span.style.fontWeight = run.style.bold ? "700" : "400";
    if (((_b = run.style) == null ? void 0 : _b.italic) !== void 0) span.style.fontStyle = run.style.italic ? "italic" : "normal";
    const decorations = [];
    if ((_c = run.style) == null ? void 0 : _c.underline) decorations.push("underline");
    if ((_d = run.style) == null ? void 0 : _d.strike) decorations.push("line-through");
    if (decorations.length) span.style.textDecorationLine = decorations.join(" ");
    if ((_e = run.style) == null ? void 0 : _e.color) span.style.color = run.style.color;
  }
}
var ImagePreviewModal = class extends import_obsidian3.Modal {
  constructor(app, source, alt) {
    super(app);
    this.source = source;
    this.alt = alt;
    this.scale = 1;
  }
  onOpen() {
    this.modalEl.addClass("mmc-image-preview-modal");
    this.titleEl.setText(this.alt || "\u56FE\u7247\u9884\u89C8");
    const toolbar = this.contentEl.createDiv({ cls: "mmc-image-preview-toolbar" });
    const imageWrap = this.contentEl.createDiv({ cls: "mmc-image-preview-stage" });
    const image = imageWrap.createEl("img", { attr: { src: this.source, alt: this.alt || "\u56FE\u7247" } });
    let baseWidth = 0;
    let baseHeight = 0;
    const applyScale = () => {
      if (!baseWidth || !baseHeight) return;
      image.style.width = `${Math.max(1, Math.round(baseWidth * this.scale))}px`;
      image.style.height = `${Math.max(1, Math.round(baseHeight * this.scale))}px`;
    };
    image.addEventListener("load", () => {
      const availableWidth = Math.max(320, imageWrap.clientWidth * 0.9);
      const availableHeight = Math.max(220, imageWrap.clientHeight * 0.9);
      const fit = Math.min(1, availableWidth / Math.max(1, image.naturalWidth), availableHeight / Math.max(1, image.naturalHeight));
      baseWidth = Math.max(1, image.naturalWidth * fit);
      baseHeight = Math.max(1, image.naturalHeight * fit);
      applyScale();
    });
    const button = (label, action) => {
      const el = toolbar.createEl("button", { text: label, attr: { type: "button" } });
      el.addEventListener("click", action);
    };
    button("\u2212", () => {
      this.scale = Math.max(0.2, this.scale - 0.2);
      applyScale();
    });
    button("100%", () => {
      this.scale = 1;
      applyScale();
    });
    button("+", () => {
      this.scale = Math.min(5, this.scale + 0.2);
      applyScale();
    });
    imageWrap.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.scale = Math.min(5, Math.max(0.2, this.scale + (event.deltaY < 0 ? 0.15 : -0.15)));
      applyScale();
    }, { passive: false });
    image.addEventListener("dblclick", () => {
      this.scale = 1;
      applyScale();
    });
  }
};
var ImageHostPickerModal = class extends import_obsidian3.Modal {
  constructor(app, hosts, initialIds, resolveSelection) {
    super(app);
    this.hosts = hosts;
    this.resolveSelection = resolveSelection;
    this.resolved = false;
    this.selected = /* @__PURE__ */ new Set();
    initialIds.forEach((id) => this.selected.add(id));
  }
  onOpen() {
    this.titleEl.setText("\u9009\u62E9\u4E0A\u4F20\u56FE\u5E8A");
    this.contentEl.addClass("mms-image-host-picker");
    this.contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "\u53EF\u4EE5\u9009\u62E9\u4E00\u4E2A\u6216\u591A\u4E2A\u56FE\u5E8A\u3002\u5168\u90E8\u4E0A\u4F20\u6210\u529F\u540E\uFF0C\u7B2C\u4E00\u9879\u7684\u5730\u5740\u4F1A\u4F5C\u4E3A\u8282\u70B9\u5F53\u524D\u663E\u793A\u5730\u5740\uFF0C\u5176\u4F59\u5730\u5740\u4F1A\u4F5C\u4E3A\u955C\u50CF\u4FDD\u5B58\u3002"
    });
    const list = this.contentEl.createDiv({ cls: "mms-image-host-picker-list" });
    for (const host of this.hosts) {
      const label = list.createEl("label", { cls: "mms-image-host-picker-item" });
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.checked = this.selected.has(host.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.selected.add(host.id);
        else this.selected.delete(host.id);
      });
      label.createSpan({ text: host.name });
    }
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88", attr: { type: "button" } });
    cancel.addEventListener("click", () => this.close());
    const confirm = actions.createEl("button", { text: "\u786E\u5B9A", cls: "mod-cta", attr: { type: "button" } });
    confirm.addEventListener("click", () => {
      if (!this.selected.size) {
        new import_obsidian3.Notice("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u56FE\u5E8A");
        return;
      }
      this.resolved = true;
      this.resolveSelection(Array.from(this.selected));
      this.close();
    });
  }
  onClose() {
    if (!this.resolved) this.resolveSelection(null);
  }
};
function chooseImageHosts(app, hosts, initialIds) {
  if (!hosts.length) {
    new import_obsidian3.Notice("\u6CA1\u6709\u53EF\u7528\u56FE\u5E8A\uFF0C\u8BF7\u5148\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u5E76\u542F\u7528\u56FE\u5E8A");
    return Promise.resolve(null);
  }
  const allowed = new Set(hosts.map((host) => host.id));
  const initial = initialIds.filter((id) => allowed.has(id));
  return new Promise((resolve) => new ImageHostPickerModal(app, hosts, initial.length ? initial : [hosts[0].id], resolve).open());
}
var NodeEditModal = class extends import_obsidian3.Modal {
  constructor(app, node, defaultShape, callbacks, submit) {
    super(app);
    this.saveOnClose = null;
    this.closeWithoutFlush = false;
    this.outsidePointerHandler = null;
    this.node = node;
    this.defaultShape = defaultShape;
    this.callbacks = callbacks;
    this.submit = submit;
  }
  onOpen() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    this.titleEl.setText("\u7F16\u8F91\u8282\u70B9\u5185\u5BB9");
    this.contentEl.addClass("mmc-node-edit-modal");
    const form = this.contentEl.createDiv({ cls: "mmc-node-edit-form" });
    form.createEl("p", {
      cls: "setting-item-description",
      text: "\u8282\u70B9\u5185\u5BB9\u7531\u53EF\u6392\u5E8F\u7684\u6587\u5B57\u5757\u548C\u56FE\u7247\u5757\u7EC4\u6210\u3002\u53EF\u4EE5\u53EA\u4FDD\u7559\u56FE\u7247\uFF0C\u4E5F\u53EF\u4EE5\u7EC4\u5408\u4E3A\u56FE\u7247\u2192\u6587\u5B57\u3001\u6587\u5B57\u2192\u56FE\u7247\uFF0C\u6216\u6587\u5B57\u2192\u56FE\u7247\u2192\u6587\u5B57\u3002"
    });
    let workingBlocks = JSON.parse(JSON.stringify(nodeContentBlocks(this.node)));
    if (!workingBlocks.length) workingBlocks = [{ id: newId(), type: "text", text: "\u65B0\u8282\u70B9" }];
    let scheduleAutoSave = () => void 0;
    const actionRow = form.createDiv({ cls: "mmc-content-block-actions" });
    const blocksEl = form.createDiv({ cls: "mmc-content-block-list" });
    const cloneBlocks = () => JSON.parse(JSON.stringify(workingBlocks));
    const validBlocks = () => cloneBlocks().filter((block) => block.type === "image" ? Boolean(block.source.trim()) : Boolean(block.text.trim()));
    const renderTextBlock = (container, block) => {
      const toolbar = container.createDiv({ cls: "mmc-rich-text-toolbar" });
      const source = container.createEl("textarea", {
        cls: "mmc-rich-text-source",
        attr: { rows: "3", spellcheck: "true", placeholder: "\u8F93\u5165\u6587\u5B57\uFF1B\u53EF\u4EE5\u5168\u90E8\u5220\u9664\uFF0C\u8BA9\u8282\u70B9\u53EA\u4FDD\u7559\u56FE\u7247" }
      });
      source.value = block.text;
      let savedStart = source.value.length;
      let savedEnd = source.value.length;
      const selection = container.createDiv({ cls: "mmc-rich-selection-status" });
      container.createDiv({ cls: "mmc-rich-preview-label", text: "\u6587\u5B57\u6837\u5F0F\u9884\u89C8" });
      const preview = container.createDiv({ cls: "mmc-rich-text-preview" });
      const updatePreview = () => {
        renderRichTextRuns(preview, block.richText, block.text || "\u9884\u89C8\u6587\u5B57");
        preview.toggleClass("is-placeholder", !block.text);
      };
      const remember = () => {
        var _a2, _b2;
        savedStart = (_a2 = source.selectionStart) != null ? _a2 : 0;
        savedEnd = (_b2 = source.selectionEnd) != null ? _b2 : savedStart;
        const from = Math.min(savedStart, savedEnd);
        const to = Math.max(savedStart, savedEnd);
        selection.setText(from === to ? `\u5149\u6807\u4F4D\u7F6E\uFF1A${from + 1}` : `\u5DF2\u9009\u62E9\u7B2C ${from + 1}\u2013${to} \u4E2A\u5B57\u7B26`);
      };
      const range = () => {
        const start = Math.max(0, Math.min(block.text.length, Math.min(savedStart, savedEnd)));
        const end = Math.max(start, Math.min(block.text.length, Math.max(savedStart, savedEnd)));
        if (start === end) {
          new import_obsidian3.Notice("\u8BF7\u5148\u9009\u62E9\u9700\u8981\u8BBE\u7F6E\u683C\u5F0F\u7684\u6587\u5B57");
          source.focus();
          return null;
        }
        source.focus();
        source.setSelectionRange(start, end);
        return { start, end };
      };
      const styleButton = (label, title, action, cls = "") => {
        const btn = toolbar.createEl("button", { cls: `mmc-rich-toolbar-button ${cls}`.trim(), text: label, attr: { type: "button", title } });
        btn.addEventListener("mousedown", (event) => event.preventDefault());
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          action();
        });
        return btn;
      };
      const applyBoolean = (key) => {
        const selected = range();
        if (!selected) return;
        const styles = richTextCharacterStyles(block.richText, block.text);
        const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
        block.richText = applyRichTextStyleRange(block.text, block.richText, selected.start, selected.end, { [key]: !enabled });
        updatePreview();
        scheduleAutoSave();
        source.setSelectionRange(selected.start, selected.end);
        remember();
      };
      styleButton("B", "\u52A0\u7C97\u6240\u9009\u6587\u5B57", () => applyBoolean("bold"), "is-bold");
      styleButton("I", "\u659C\u4F53\u6240\u9009\u6587\u5B57", () => applyBoolean("italic"), "is-italic");
      styleButton("U", "\u7ED9\u6240\u9009\u6587\u5B57\u52A0\u4E0B\u5212\u7EBF", () => applyBoolean("underline"), "is-underline");
      const colorLabel = toolbar.createEl("label", { cls: "mmc-rich-color-button", attr: { title: "\u4FEE\u6539\u6240\u9009\u6587\u5B57\u989C\u8272" } });
      colorLabel.createSpan({ text: "\u989C\u8272" });
      const colorLine = colorLabel.createSpan({ cls: "mmc-rich-color-line" });
      const color = colorLabel.createEl("input", { type: "color", attr: { "aria-label": "\u6587\u5B57\u989C\u8272" } });
      color.value = "#ef4444";
      colorLine.style.backgroundColor = color.value;
      color.addEventListener("input", () => {
        colorLine.style.backgroundColor = color.value;
      });
      color.addEventListener("change", () => {
        const selected = range();
        if (!selected) return;
        block.richText = applyRichTextStyleRange(block.text, block.richText, selected.start, selected.end, { color: color.value });
        updatePreview();
        scheduleAutoSave();
      });
      styleButton("\u6E05\u9664\u683C\u5F0F", "\u6E05\u9664\u6240\u9009\u6587\u5B57\u683C\u5F0F", () => {
        const selected = range();
        if (!selected) return;
        block.richText = applyRichTextStyleRange(block.text, block.richText, selected.start, selected.end, null);
        updatePreview();
        scheduleAutoSave();
      }, "is-wide");
      source.addEventListener("select", remember);
      source.addEventListener("keyup", remember);
      source.addEventListener("mouseup", remember);
      source.addEventListener("input", () => {
        const next = source.value.replace(/\r?\n/g, " ");
        block.richText = reconcileRichTextAfterEdit(block.text, block.richText, next);
        block.text = next;
        source.value = next;
        remember();
        updatePreview();
        scheduleAutoSave();
      });
      updatePreview();
      remember();
    };
    const chooseImage = (block, mode, refresh) => {
      void (async () => {
        let hostIds = [];
        if (mode === "remote") {
          const chosen = await chooseImageHosts(this.app, this.callbacks.getImageHosts(), this.callbacks.getDefaultUploadHostIds());
          if (!chosen) return;
          hostIds = chosen;
        }
        const file = await new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.addEventListener("change", () => {
            var _a2, _b2;
            return resolve((_b2 = (_a2 = input.files) == null ? void 0 : _a2[0]) != null ? _b2 : null);
          }, { once: true });
          input.click();
        });
        if (!file) return;
        if (mode === "local") {
          const path = await this.callbacks.onSavePastedImage(file, file.name);
          block.source = path;
          block.localSource = path;
          block.remoteSources = void 0;
        } else {
          const batch = await this.callbacks.onUploadImage(file, file.name, hostIds);
          if (!batch.successes.length) {
            const message = batch.failures.map((item) => `${item.hostName}\uFF1A${item.error}`).join("\uFF1B") || "\u672A\u77E5\u9519\u8BEF";
            throw new Error(message);
          }
          const uploadedAt = (/* @__PURE__ */ new Date()).toISOString();
          block.source = batch.successes[0].url;
          block.localSource = void 0;
          block.remoteSources = batch.successes.map((item) => ({ ...item, uploadedAt }));
          if (batch.failures.length) {
            new import_obsidian3.Notice(`\u90E8\u5206\u56FE\u5E8A\u4E0A\u4F20\u5931\u8D25\uFF1A${batch.failures.map((item) => item.hostName).join("\u3001")}`, 7e3);
          } else {
            new import_obsidian3.Notice(`\u5DF2\u4E0A\u4F20\u5230\uFF1A${batch.successes.map((item) => item.hostName).join("\u3001")}`);
          }
        }
        if (!block.alt) block.alt = file.name.replace(/\.[^.]+$/, "");
        refresh();
        scheduleAutoSave();
      })().catch((error) => {
        console.error("MindMap Studio image operation failed", error);
        new import_obsidian3.Notice(`${mode === "remote" ? "\u4E0A\u4F20\u56FE\u5E8A" : "\u4FDD\u5B58\u56FE\u7247"}\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`, 7e3);
      });
    };
    const uploadExistingImage = (block, refresh) => {
      void (async () => {
        var _a2;
        const chosen = await chooseImageHosts(this.app, this.callbacks.getImageHosts(), this.callbacks.getDefaultUploadHostIds());
        if (!chosen) return;
        const readableSource = block.localSource || block.source;
        const image = await this.callbacks.onReadImageSource(readableSource);
        if (!image) {
          new import_obsidian3.Notice("\u5F53\u524D\u56FE\u7247\u4E0D\u662F\u53EF\u8BFB\u53D6\u7684\u672C\u5730\u6587\u4EF6\uFF1B\u8BF7\u4F7F\u7528\u2018\u4E0A\u4F20\u5230\u56FE\u5E8A\u2019\u91CD\u65B0\u9009\u62E9\u56FE\u7247");
          return;
        }
        const batch = await this.callbacks.onUploadImage(image.blob, image.suggestedName, chosen);
        if (!batch.successes.length) {
          throw new Error(batch.failures.map((item) => `${item.hostName}\uFF1A${item.error}`).join("\uFF1B") || "\u4E0A\u4F20\u5931\u8D25");
        }
        const uploadedAt = (/* @__PURE__ */ new Date()).toISOString();
        const existing = new Map(((_a2 = block.remoteSources) != null ? _a2 : []).map((item) => [item.hostId, item]));
        batch.successes.forEach((item) => existing.set(item.hostId, { ...item, uploadedAt }));
        block.remoteSources = Array.from(existing.values());
        block.localSource = readableSource;
        if (!batch.failures.length) block.source = batch.successes[0].url;
        refresh();
        scheduleAutoSave();
        if (batch.failures.length) {
          new import_obsidian3.Notice(`\u90E8\u5206\u56FE\u5E8A\u4E0A\u4F20\u5931\u8D25\uFF0C\u672C\u5730\u56FE\u7247\u5DF2\u4FDD\u7559\uFF1A${batch.failures.map((item) => item.hostName).join("\u3001")}`, 7e3);
        } else {
          new import_obsidian3.Notice(`\u5F53\u524D\u56FE\u7247\u5DF2\u4E0A\u4F20\u5230\uFF1A${batch.successes.map((item) => item.hostName).join("\u3001")}`);
        }
      })().catch((error) => {
        console.error("MindMap Studio existing image upload failed", error);
        new import_obsidian3.Notice(`\u4E0A\u4F20\u5F53\u524D\u56FE\u7247\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`, 7e3);
      });
    };
    const renderBlocks = () => {
      blocksEl.empty();
      workingBlocks.forEach((block, index) => {
        var _a2;
        const card = blocksEl.createDiv({ cls: `mmc-content-block is-${block.type}` });
        const header = card.createDiv({ cls: "mmc-content-block-header" });
        header.createSpan({ cls: "mmc-content-block-title", text: block.type === "text" ? `\u6587\u5B57\u5757 ${index + 1}` : `\u56FE\u7247\u5757 ${index + 1}` });
        const controls = header.createDiv({ cls: "mmc-content-block-controls" });
        const control = (icon, title, action, disabled = false) => {
          const btn = controls.createEl("button", { cls: "clickable-icon", attr: { type: "button", title, "aria-label": title } });
          (0, import_obsidian3.setIcon)(btn, icon);
          btn.disabled = disabled;
          btn.addEventListener("click", (event) => {
            event.preventDefault();
            action();
          });
        };
        control("arrow-up", "\u4E0A\u79FB", () => {
          [workingBlocks[index - 1], workingBlocks[index]] = [workingBlocks[index], workingBlocks[index - 1]];
          renderBlocks();
          scheduleAutoSave();
        }, index === 0);
        control("arrow-down", "\u4E0B\u79FB", () => {
          [workingBlocks[index + 1], workingBlocks[index]] = [workingBlocks[index], workingBlocks[index + 1]];
          renderBlocks();
          scheduleAutoSave();
        }, index === workingBlocks.length - 1);
        control("trash-2", "\u5220\u9664\u5185\u5BB9\u5757", () => {
          workingBlocks.splice(index, 1);
          renderBlocks();
          scheduleAutoSave();
        });
        if (block.type === "text") {
          renderTextBlock(card.createDiv({ cls: "mmc-content-block-body" }), block);
        } else {
          const body = card.createDiv({ cls: "mmc-content-block-body mmc-image-block-editor" });
          const preview = body.createDiv({ cls: "mmc-image-block-preview" });
          const refresh = () => {
            var _a3;
            preview.empty();
            const resolved = this.callbacks.resolveImage(block.source);
            if (resolved) {
              const img = preview.createEl("img", { attr: { src: resolved, alt: block.alt || "\u56FE\u7247" } });
              img.addEventListener("click", () => new ImagePreviewModal(this.app, resolved, block.alt || "\u56FE\u7247").open());
            } else preview.createDiv({ cls: "mmc-image-placeholder", text: block.source ? "\u65E0\u6CD5\u52A0\u8F7D\u56FE\u7247" : "\u5C1A\u672A\u9009\u62E9\u56FE\u7247" });
            source.value = block.source;
            alt.value = (_a3 = block.alt) != null ? _a3 : "";
          };
          const sourceLabel = body.createEl("label", { text: "\u56FE\u7247\u8DEF\u5F84\u6216\u7F51\u5740" });
          const source = sourceLabel.createEl("input", { type: "text", attr: { placeholder: "\u4ED3\u5E93\u8DEF\u5F84\u3001[[\u56FE\u7247]] \u6216 https://..." } });
          const altLabel = body.createEl("label", { text: "\u56FE\u7247\u8BF4\u660E\uFF08\u53EF\u9009\uFF09" });
          const alt = altLabel.createEl("input", { type: "text", attr: { placeholder: "\u56FE\u7247\u8BF4\u660E" } });
          source.addEventListener("input", () => {
            const next = source.value.trim();
            if (next !== block.source) {
              block.source = next;
              block.localSource = void 0;
              block.remoteSources = void 0;
            }
            refresh();
            scheduleAutoSave();
          });
          alt.addEventListener("input", () => {
            block.alt = alt.value.trim() || void 0;
            scheduleAutoSave();
          });
          const actions = body.createDiv({ cls: "mmc-image-block-actions" });
          const local = actions.createEl("button", { text: "\u4FDD\u5B58\u5230\u4ED3\u5E93", attr: { type: "button" } });
          local.addEventListener("click", () => chooseImage(block, "local", refresh));
          const remote = actions.createEl("button", { text: "\u9009\u62E9\u6587\u4EF6\u5E76\u4E0A\u4F20", attr: { type: "button" } });
          remote.addEventListener("click", () => chooseImage(block, "remote", refresh));
          if (block.localSource || block.source && !/^https?:\/\//i.test(block.source)) {
            const uploadCurrent = actions.createEl("button", { text: "\u4E0A\u4F20\u5F53\u524D\u56FE\u7247", attr: { type: "button" } });
            uploadCurrent.addEventListener("click", () => uploadExistingImage(block, refresh));
          }
          if ((_a2 = block.remoteSources) == null ? void 0 : _a2.length) {
            const mirrors = body.createDiv({ cls: "mms-image-mirrors" });
            mirrors.createSpan({ cls: "mms-image-mirrors-label", text: "\u8FDC\u7A0B\u955C\u50CF\uFF1A" });
            block.remoteSources.forEach((item, mirrorIndex) => {
              const link = mirrors.createEl("a", {
                text: item.hostName || `\u56FE\u5E8A ${mirrorIndex + 1}`,
                href: item.url,
                attr: { target: "_blank", rel: "noopener" }
              });
              link.addEventListener("click", (event) => event.stopPropagation());
            });
          }
          refresh();
        }
      });
      if (!workingBlocks.length) blocksEl.createDiv({ cls: "mmc-empty-content-hint", text: "\u5F53\u524D\u6CA1\u6709\u5185\u5BB9\u5757\u3002\u8BF7\u6DFB\u52A0\u6587\u5B57\u6216\u56FE\u7247\u3002" });
    };
    const addText = actionRow.createEl("button", { text: "+ \u6587\u5B57", attr: { type: "button" } });
    addText.addEventListener("click", () => {
      workingBlocks.push({ id: newId(), type: "text", text: "" });
      renderBlocks();
      scheduleAutoSave();
    });
    const addImage = actionRow.createEl("button", { text: "+ \u56FE\u7247", attr: { type: "button" } });
    addImage.addEventListener("click", () => {
      workingBlocks.push({ id: newId(), type: "image", source: "" });
      renderBlocks();
      scheduleAutoSave();
    });
    renderBlocks();
    const detailsGrid = form.createDiv({ cls: "mmc-form-grid" });
    const iconLabel = detailsGrid.createEl("label", { text: "\u56FE\u6807\u6216 Emoji" });
    const iconInput = iconLabel.createEl("input", { type: "text", attr: { placeholder: "\u4F8B\u5982 \u{1F4A1}" } });
    iconInput.value = (_a = this.node.icon) != null ? _a : "";
    const taskLabel = detailsGrid.createEl("label", { text: "\u4EFB\u52A1\u72B6\u6001" });
    const taskSelect = taskLabel.createEl("select");
    for (const [value, label] of [["", "\u65E0"], ["todo", "\u5F85\u529E"], ["doing", "\u8FDB\u884C\u4E2D"], ["done", "\u5DF2\u5B8C\u6210"]]) taskSelect.createEl("option", { text: label, attr: { value } });
    taskSelect.value = (_b = this.node.task) != null ? _b : "";
    const shapeLabel = detailsGrid.createEl("label", { text: "\u8282\u70B9\u5F62\u72B6" });
    const shapeSelect = shapeLabel.createEl("select");
    for (const [value, label] of [["rounded", "\u5706\u89D2"], ["pill", "\u80F6\u56CA"], ["rectangle", "\u76F4\u89D2"]]) shapeSelect.createEl("option", { text: label, attr: { value } });
    shapeSelect.value = (_d = (_c = this.node.style) == null ? void 0 : _c.shape) != null ? _d : this.defaultShape;
    const tagsLabel = detailsGrid.createEl("label", { text: "\u6807\u7B7E\uFF08\u9017\u53F7\u5206\u9694\uFF09" });
    const tagsInput = tagsLabel.createEl("input", { type: "text" });
    tagsInput.value = (_f = (_e = this.node.tags) == null ? void 0 : _e.join(", ")) != null ? _f : "";
    const styleGrid = form.createDiv({ cls: "mmc-form-grid mmc-style-grid" });
    const colorControl = (labelText, current, fallback) => {
      const label = styleGrid.createEl("label", { text: labelText });
      const row = label.createDiv({ cls: "mmc-color-row" });
      const toggle = row.createEl("input", { type: "checkbox" });
      const color = row.createEl("input", { type: "color" });
      toggle.checked = Boolean(current);
      color.value = current != null ? current : fallback;
      color.disabled = !toggle.checked;
      toggle.addEventListener("change", () => {
        color.disabled = !toggle.checked;
        scheduleAutoSave();
      });
      color.addEventListener("change", scheduleAutoSave);
      return [toggle, color];
    };
    const [colorToggle, colorInput] = colorControl("\u8282\u70B9\u989C\u8272", (_g = this.node.style) == null ? void 0 : _g.color, "#4f46e5");
    const [textColorToggle, textColorInput] = colorControl("\u6574\u8282\u70B9\u6587\u5B57\u989C\u8272", (_h = this.node.style) == null ? void 0 : _h.textColor, "#ffffff");
    const [borderColorToggle, borderColorInput] = colorControl("\u8FB9\u6846\u989C\u8272", (_i = this.node.style) == null ? void 0 : _i.borderColor, "#94a3b8");
    const numberControl = (labelText, current, min, max, step) => {
      var _a2;
      const label = styleGrid.createEl("label", { text: labelText });
      const input = label.createEl("input", { type: "number", attr: { min: String(min), max: String(max), step: String(step), placeholder: "\u8DDF\u968F\u9ED8\u8BA4" } });
      input.value = (_a2 = current == null ? void 0 : current.toString()) != null ? _a2 : "";
      return input;
    };
    const borderWidthInput = numberControl("\u8FB9\u6846\u7C97\u7EC6", (_j = this.node.style) == null ? void 0 : _j.borderWidth, 0, 6, 0.5);
    const fontSizeInput = numberControl("\u5B57\u53F7", (_k = this.node.style) == null ? void 0 : _k.fontSize, 10, 32, 1);
    const booleanControl = (labelText, current) => {
      const label = styleGrid.createEl("label", { text: labelText });
      const select = label.createEl("select");
      select.createEl("option", { text: "\u8DDF\u968F\u9ED8\u8BA4", attr: { value: "inherit" } });
      select.createEl("option", { text: "\u5F00\u542F", attr: { value: "true" } });
      select.createEl("option", { text: "\u5173\u95ED", attr: { value: "false" } });
      select.value = current === void 0 ? "inherit" : current ? "true" : "false";
      return select;
    };
    const boldInput = booleanControl("\u6574\u8282\u70B9\u52A0\u7C97", (_l = this.node.style) == null ? void 0 : _l.bold);
    const italicInput = booleanControl("\u6574\u8282\u70B9\u659C\u4F53", (_m = this.node.style) == null ? void 0 : _m.italic);
    const underlineInput = booleanControl("\u6574\u8282\u70B9\u4E0B\u5212\u7EBF", (_n = this.node.style) == null ? void 0 : _n.underline);
    const noteLabel = form.createEl("label", { text: "\u5907\u6CE8\uFF08\u53EF\u9009\uFF09" });
    const noteInput = noteLabel.createEl("textarea");
    noteInput.value = (_o = this.node.note) != null ? _o : "";
    noteInput.rows = 4;
    const linkLabel = form.createEl("label", { text: "\u94FE\u63A5\uFF08\u7F51\u5740\u3001\u7B14\u8BB0\u540D\u6216 [[\u53CC\u94FE]]\uFF09" });
    const linkInput = linkLabel.createEl("input", { type: "text" });
    linkInput.value = (_p = this.node.link) != null ? _p : "";
    const parseBool = (value) => value === "true" ? true : value === "false" ? false : void 0;
    const parseNumber = (value, min, max) => value.trim() && Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : void 0;
    const collectValues = (showNotice) => {
      const content = validBlocks();
      if (!content.length) {
        if (showNotice) new import_obsidian3.Notice("\u8282\u70B9\u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u6587\u5B57\u5757\u6216\u56FE\u7247\u5757");
        return null;
      }
      const task = taskSelect.value;
      const shape = shapeSelect.value;
      return {
        content,
        note: noteInput.value.trim(),
        link: linkInput.value.trim(),
        icon: iconInput.value.trim().slice(0, 12),
        tags: Array.from(new Set(tagsInput.value.split(/[,，]/).map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean))).slice(0, 12),
        task: task === "todo" || task === "doing" || task === "done" ? task : void 0,
        color: colorToggle.checked ? colorInput.value : void 0,
        textColor: textColorToggle.checked ? textColorInput.value : void 0,
        borderColor: borderColorToggle.checked ? borderColorInput.value : void 0,
        borderWidth: parseNumber(borderWidthInput.value, 0, 6),
        shape: shape === "pill" || shape === "rectangle" || shape === "rounded" ? shape : void 0,
        bold: parseBool(boldInput.value),
        italic: parseBool(italicInput.value),
        underline: parseBool(underlineInput.value),
        fontSize: parseNumber(fontSizeInput.value, 10, 32)
      };
    };
    let timer = null;
    let last = JSON.stringify(collectValues(false));
    const saveNow = (mode, showNotice = false) => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      const values = collectValues(showNotice);
      if (!values) return false;
      const signature = JSON.stringify(values);
      if (signature !== last) {
        this.submit(values, mode);
        last = signature;
      }
      return true;
    };
    scheduleAutoSave = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => saveNow("autosave"), 280);
    };
    this.saveOnClose = () => {
      saveNow("commit");
    };
    [iconInput, taskSelect, shapeSelect, tagsInput, borderWidthInput, fontSizeInput, boldInput, italicInput, underlineInput, noteInput, linkInput].forEach((input) => {
      input.addEventListener("input", scheduleAutoSave);
      input.addEventListener("change", scheduleAutoSave);
    });
    const buttons = form.createDiv({ cls: "mmc-form-actions" });
    const closeButton = buttons.createEl("button", { cls: "mod-cta", text: "\u4FDD\u5B58\u5E76\u5173\u95ED", attr: { type: "button" } });
    closeButton.addEventListener("click", () => {
      if (saveNow("commit", true)) {
        this.closeWithoutFlush = true;
        this.close();
      }
    });
    this.outsidePointerHandler = (event) => {
      var _a2;
      if (this.modalEl.contains(event.target)) return;
      (_a2 = this.saveOnClose) == null ? void 0 : _a2.call(this);
      this.closeWithoutFlush = true;
      this.close();
    };
    window.setTimeout(() => document.addEventListener("pointerdown", this.outsidePointerHandler, true), 0);
  }
  onClose() {
    var _a;
    if (!this.closeWithoutFlush) (_a = this.saveOnClose) == null ? void 0 : _a.call(this);
    if (this.outsidePointerHandler) document.removeEventListener("pointerdown", this.outsidePointerHandler, true);
    this.contentEl.empty();
  }
};
var AppearanceModal = class extends import_obsidian3.Modal {
  constructor(app, appearance, submit, reset) {
    super(app);
    this.appearance = appearance;
    this.submit = submit;
    this.reset = reset;
  }
  onOpen() {
    var _a, _b, _c, _d, _e, _f, _g;
    this.titleEl.setText("\u5F53\u524D\u8111\u56FE\u5916\u89C2");
    this.contentEl.addClass("mmc-appearance-modal");
    const form = this.contentEl.createEl("form");
    form.createEl("p", { cls: "setting-item-description", text: "\u8FD9\u4E9B\u8BBE\u7F6E\u53EA\u4FDD\u5B58\u5230\u5F53\u524D .mindmap \u6587\u4EF6\uFF0C\u4E0D\u4F1A\u4FEE\u6539\u63D2\u4EF6\u5168\u5C40\u9ED8\u8BA4\u503C\u3002" });
    const grid = form.createDiv({ cls: "mmc-form-grid mmc-appearance-grid" });
    const addColor = (labelText, value, fallback) => {
      const label = grid.createEl("label", { text: labelText });
      const row = label.createDiv({ cls: "mmc-color-row" });
      const toggle = row.createEl("input", { type: "checkbox" });
      const input = row.createEl("input", { type: "color" });
      toggle.checked = Boolean(value);
      input.value = value != null ? value : fallback;
      input.disabled = !toggle.checked;
      toggle.addEventListener("change", () => {
        input.disabled = !toggle.checked;
      });
      return { toggle, input };
    };
    const background = addColor("\u80CC\u666F\u989C\u8272", this.appearance.backgroundColor, "#f8fafc");
    const patternLabel = grid.createEl("label", { text: "\u80CC\u666F\u56FE\u6848" });
    const patternSelect = patternLabel.createEl("select");
    for (const [value, label] of [["none", "\u65E0"], ["grid", "\u7F51\u683C"], ["dots", "\u70B9\u9635"]]) patternSelect.createEl("option", { text: label, attr: { value } });
    patternSelect.value = (_a = this.appearance.backgroundPattern) != null ? _a : "grid";
    const patternColor = addColor("\u56FE\u6848\u989C\u8272", this.appearance.patternColor, "#94a3b8");
    const fontLabel = grid.createEl("label", { text: "\u5B57\u4F53" });
    const fontSelect = fontLabel.createEl("select");
    for (const [value, label] of [["obsidian", "\u8DDF\u968F Obsidian"], ["sans", "\u65E0\u886C\u7EBF"], ["serif", "\u886C\u7EBF"], ["mono", "\u7B49\u5BBD"], ["custom", "\u81EA\u5B9A\u4E49"]]) fontSelect.createEl("option", { text: label, attr: { value } });
    fontSelect.value = (_b = this.appearance.fontFamily) != null ? _b : "obsidian";
    const customFontLabel = grid.createEl("label", { text: "\u81EA\u5B9A\u4E49\u5B57\u4F53\u540D\u79F0" });
    const customFontInput = customFontLabel.createEl("input", { type: "text", attr: { placeholder: "Microsoft YaHei" } });
    customFontInput.value = (_c = this.appearance.customFont) != null ? _c : "";
    const updateCustomFont = () => {
      customFontInput.disabled = fontSelect.value !== "custom";
    };
    fontSelect.addEventListener("change", updateCustomFont);
    updateCustomFont();
    const fontSizeLabel = grid.createEl("label", { text: "\u5B57\u53F7\uFF0810\u201330\uFF09" });
    const fontSizeInput = fontSizeLabel.createEl("input", { type: "number", attr: { min: "10", max: "30", step: "1" } });
    fontSizeInput.value = String((_d = this.appearance.fontSize) != null ? _d : 14);
    const edgeColor = addColor("\u8FDE\u7EBF\u989C\u8272", this.appearance.edgeColor, "#7c8aa5");
    const edgeStyleLabel = grid.createEl("label", { text: "\u8FDE\u7EBF\u7C7B\u578B" });
    const edgeStyleSelect = edgeStyleLabel.createEl("select");
    for (const [value, label] of [["curved", "\u66F2\u7EBF"], ["straight", "\u76F4\u7EBF"], ["elbow", "\u6298\u7EBF"]]) edgeStyleSelect.createEl("option", { text: label, attr: { value } });
    edgeStyleSelect.value = (_e = this.appearance.edgeStyle) != null ? _e : "curved";
    const edgeWidthLabel = grid.createEl("label", { text: "\u8FDE\u7EBF\u7C97\u7EC6\uFF080.5\u20138\uFF09" });
    const edgeWidthInput = edgeWidthLabel.createEl("input", { type: "number", attr: { min: "0.5", max: "8", step: "0.5" } });
    edgeWidthInput.value = String((_f = this.appearance.edgeWidth) != null ? _f : 2.2);
    const nodeColor = addColor("\u8282\u70B9\u80CC\u666F\u8272", this.appearance.nodeColor, "#ffffff");
    const textColor = addColor("\u6587\u5B57\u989C\u8272", this.appearance.textColor, "#0f172a");
    const borderColor = addColor("\u8282\u70B9\u8FB9\u6846\u989C\u8272", this.appearance.nodeBorderColor, "#94a3b8");
    const borderWidthLabel = grid.createEl("label", { text: "\u8FB9\u6846\u7C97\u7EC6\uFF080\u20136\uFF09" });
    const borderWidthInput = borderWidthLabel.createEl("input", { type: "number", attr: { min: "0", max: "6", step: "0.5" } });
    borderWidthInput.value = String((_g = this.appearance.nodeBorderWidth) != null ? _g : 1);
    const textStyleSection = form.createDiv({ cls: "mmc-appearance-text-style" });
    textStyleSection.createDiv({ cls: "mmc-appearance-text-style-title", text: "\u6587\u5B57\u6837\u5F0F" });
    const textStyle = textStyleSection.createDiv({ cls: "mmc-appearance-style-options" });
    const addCheck = (text, checked) => {
      const label = textStyle.createEl("label", { cls: "mmc-appearance-style-option" });
      const input = label.createEl("input", { type: "checkbox" });
      input.checked = checked;
      label.createSpan({ text });
      return input;
    };
    const bold = addCheck("\u6587\u5B57\u52A0\u7C97", this.appearance.bold === true);
    const italic = addCheck("\u6587\u5B57\u659C\u4F53", this.appearance.italic === true);
    const underline = addCheck("\u6587\u5B57\u4E0B\u5212\u7EBF", this.appearance.underline === true);
    const clamp = (value, min, max, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    };
    const actions = form.createDiv({ cls: "mmc-modal-actions" });
    const reset = actions.createEl("button", { text: "\u6062\u590D\u5168\u5C40\u9ED8\u8BA4", type: "button" });
    const cancel = actions.createEl("button", { text: "\u53D6\u6D88", type: "button" });
    const save = actions.createEl("button", { text: "\u5E94\u7528", type: "submit", cls: "mod-cta" });
    reset.addEventListener("click", () => {
      this.reset();
      this.close();
    });
    cancel.addEventListener("click", () => this.close());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit({
        backgroundColor: background.toggle.checked ? background.input.value : void 0,
        backgroundPattern: patternSelect.value,
        patternColor: patternColor.toggle.checked ? patternColor.input.value : void 0,
        fontFamily: fontSelect.value,
        customFont: fontSelect.value === "custom" ? customFontInput.value.trim().slice(0, 120) || void 0 : void 0,
        fontSize: clamp(fontSizeInput.value, 10, 30, 14),
        edgeColor: edgeColor.toggle.checked ? edgeColor.input.value : void 0,
        edgeWidth: clamp(edgeWidthInput.value, 0.5, 8, 2.2),
        edgeStyle: edgeStyleSelect.value,
        nodeColor: nodeColor.toggle.checked ? nodeColor.input.value : void 0,
        textColor: textColor.toggle.checked ? textColor.input.value : void 0,
        nodeBorderColor: borderColor.toggle.checked ? borderColor.input.value : void 0,
        nodeBorderWidth: clamp(borderWidthInput.value, 0, 6, 1),
        bold: bold.checked,
        italic: italic.checked,
        underline: underline.checked
      });
      this.close();
    });
    window.setTimeout(() => save.focus(), 20);
  }
};
var OutlineModal = class extends import_obsidian3.Modal {
  constructor(app, markdown, onExport) {
    super(app);
    this.markdown = markdown;
    this.onExport = onExport;
  }
  onOpen() {
    this.titleEl.setText("Markdown \u5927\u7EB2");
    const textarea = this.contentEl.createEl("textarea", { cls: "mmc-outline-textarea" });
    textarea.value = this.markdown;
    textarea.readOnly = true;
    const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
    const copy = actions.createEl("button", { text: "\u590D\u5236" });
    const exportButton = actions.createEl("button", { text: "\u5BFC\u51FA\u4E3A .md", cls: "mod-cta" });
    copy.addEventListener("click", () => {
      void navigator.clipboard.writeText(this.markdown);
      new import_obsidian3.Notice("\u5DF2\u590D\u5236 Markdown \u5927\u7EB2");
    });
    exportButton.addEventListener("click", () => {
      this.onExport();
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var SearchNodesModal = class extends import_obsidian3.Modal {
  constructor(app, nodes, onQuery, onSelect) {
    super(app);
    this.nodes = nodes;
    this.onQuery = onQuery;
    this.onSelect = onSelect;
  }
  onOpen() {
    this.titleEl.setText("\u641C\u7D22\u8282\u70B9");
    this.modalEl.addClass("mmc-search-modal");
    const input = this.contentEl.createEl("input", { type: "search", cls: "mmc-search-input", attr: { placeholder: "\u641C\u7D22\u6587\u5B57\u3001\u5907\u6CE8\u3001\u6807\u7B7E\u6216\u94FE\u63A5\u2026" } });
    const count = this.contentEl.createDiv({ cls: "mmc-search-count" });
    const results = this.contentEl.createDiv({ cls: "mmc-search-results" });
    const renderResults = () => {
      var _a;
      const query = input.value.trim().toLocaleLowerCase();
      this.onQuery(query);
      results.empty();
      const matches = query ? this.nodes.filter((node) => nodeSearchText(node).includes(query)).slice(0, 80) : this.nodes.slice(0, 40);
      count.setText(query ? `\u627E\u5230 ${matches.length} \u4E2A\u8282\u70B9` : `\u5171 ${this.nodes.length} \u4E2A\u8282\u70B9`);
      for (const node of matches) {
        const button = results.createEl("button", { cls: "mmc-search-result", type: "button" });
        const title = button.createDiv({ cls: "mmc-search-result-title" });
        if (node.icon) title.createSpan({ text: `${node.icon} ` });
        title.createSpan({ text: nodePlainText(node) || "\u56FE\u7247\u8282\u70B9" });
        const details = [node.task ? { todo: "\u5F85\u529E", doing: "\u8FDB\u884C\u4E2D", done: "\u5DF2\u5B8C\u6210" }[node.task] : "", ...((_a = node.tags) != null ? _a : []).map((tag) => `#${tag}`)].filter(Boolean).join(" \xB7 ");
        if (details) button.createDiv({ cls: "mmc-search-result-meta", text: details });
        button.addEventListener("click", () => {
          this.onSelect(node);
          this.close();
        });
      }
      if (!matches.length) results.createDiv({ cls: "mmc-empty-state", text: "\u6CA1\u6709\u5339\u914D\u7684\u8282\u70B9" });
    };
    input.addEventListener("input", renderResults);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const first = results.querySelector(".mmc-search-result");
        if (first) {
          event.preventDefault();
          first.click();
        }
      }
    });
    renderResults();
    window.setTimeout(() => input.focus(), 20);
  }
};
var JsonTransferModal = class extends import_obsidian3.Modal {
  constructor(app, document2, onImport, onExport) {
    super(app);
    this.document = document2;
    this.onImport = onImport;
    this.onExport = onExport;
  }
  onOpen() {
    this.titleEl.setText("JSON \u5BFC\u5165 / \u5BFC\u51FA");
    const description = this.contentEl.createEl("p", { text: "\u53EF\u4EE5\u590D\u5236\u5F53\u524D JSON\uFF0C\u4E5F\u53EF\u4EE5\u7C98\u8D34\u5176\u4ED6 MindMap Studio \u6587\u6863 JSON \u540E\u5BFC\u5165\u3002" });
    description.addClass("setting-item-description");
    const textarea = this.contentEl.createEl("textarea", { cls: "mmc-json-textarea" });
    textarea.value = JSON.stringify(this.document, null, 2);
    const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions mmc-json-actions" });
    const copy = actions.createEl("button", { text: "\u590D\u5236 JSON" });
    const exportButton = actions.createEl("button", { text: "\u5BFC\u51FA .json" });
    const importButton = actions.createEl("button", { text: "\u5BFC\u5165\u5E76\u66FF\u6362", cls: "mod-warning" });
    copy.addEventListener("click", () => {
      void navigator.clipboard.writeText(textarea.value);
      new import_obsidian3.Notice("\u5DF2\u590D\u5236 JSON");
    });
    exportButton.addEventListener("click", () => this.onExport(textarea.value));
    importButton.addEventListener("click", () => {
      try {
        const parsed = JSON.parse(textarea.value);
        const normalized = normalizeDocument(parsed, this.document.title);
        this.onImport(normalized);
        new import_obsidian3.Notice("JSON \u5DF2\u5BFC\u5165");
        this.close();
      } catch (error) {
        console.error("MindMap Studio JSON import failed", error);
        new import_obsidian3.Notice("JSON \u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u540E\u91CD\u8BD5");
      }
    });
  }
};
var MindMapEditor = class {
  constructor(app, host, document2, callbacks, options) {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.history = [];
    this.future = [];
    this.draggingId = null;
    this.panning = false;
    this.panStart = { x: 0, y: 0, panX: 0, panY: 0 };
    this.cleanupCallbacks = [];
    this.resizeObserver = null;
    this.branchClipboard = null;
    this.searchQuery = "";
    var _a;
    this.app = app;
    this.host = host;
    this.callbacks = callbacks;
    this.options = options;
    this.document = cloneDocument(document2);
    this.selectedId = this.document.root.id;
    this.layout = computeLayout(this.document.root, this.document.layout, (_a = this.getAppearance().fontSize) != null ? _a : 14);
    this.buildUi();
    this.render();
    if (this.options.autoFitOnOpen) window.setTimeout(() => this.fitToView(), 50);
  }
  destroy() {
    var _a;
    this.cleanupCallbacks.forEach((callback) => callback());
    this.cleanupCallbacks = [];
    (_a = this.resizeObserver) == null ? void 0 : _a.disconnect();
    this.resizeObserver = null;
    this.host.empty();
  }
  setDocument(document2, resetHistory = true) {
    this.document = cloneDocument(document2);
    this.selectedId = this.document.root.id;
    if (resetHistory) {
      this.history = [];
      this.future = [];
    }
    this.render();
    if (this.options.autoFitOnOpen) window.setTimeout(() => this.fitToView(), 20);
  }
  setOptions(options) {
    this.options = options;
    this.render();
  }
  getDocument() {
    return cloneDocument(this.document);
  }
  markSaved() {
    this.statusEl.setText("\u5DF2\u4FDD\u5B58");
    this.rootEl.removeClass("is-dirty");
  }
  markSaving() {
    this.statusEl.setText("\u4FDD\u5B58\u4E2D\u2026");
    this.rootEl.addClass("is-dirty");
  }
  focus() {
    this.rootEl.focus();
  }
  focusNodeById(id) {
    if (findNode(this.document.root, id)) this.focusNode(id);
  }
  buildUi() {
    this.host.empty();
    this.rootEl = this.host.createDiv({ cls: "mmc-editor" });
    this.rootEl.tabIndex = 0;
    this.toolbarEl = this.rootEl.createDiv({ cls: "mmc-toolbar" });
    this.navigationBarEl = this.rootEl.createDiv({ cls: "mmc-parent-navigation" });
    this.viewportEl = this.rootEl.createDiv({ cls: "mmc-viewport" });
    this.sceneEl = this.viewportEl.createDiv({ cls: "mmc-scene" });
    this.edgesSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.edgesSvg.classList.add("mmc-edges");
    this.sceneEl.appendChild(this.edgesSvg);
    this.nodesLayerEl = this.sceneEl.createDiv({ cls: "mmc-nodes-layer" });
    this.addToolbarButton("plus-circle", "\u6DFB\u52A0\u5B50\u8282\u70B9\uFF08Tab\uFF09", () => this.addChild());
    this.addToolbarButton("list-plus", "\u6DFB\u52A0\u540C\u7EA7\u8282\u70B9\uFF08Enter\uFF09", () => this.addSibling());
    this.addToolbarButton("pencil", "\u7F16\u8F91\u8282\u70B9\uFF08F2\uFF09", () => this.editSelected());
    this.addToolbarButton("copy-plus", "\u514B\u9686\u5206\u652F\uFF08Ctrl/Cmd+D\uFF09", () => this.duplicateSelected());
    this.addToolbarButton("trash-2", "\u5220\u9664\u8282\u70B9\uFF08Delete\uFF09", () => this.deleteSelected());
    this.addToolbarSeparator();
    this.addToolbarButton("circle-check-big", "\u5207\u6362\u4EFB\u52A1\u72B6\u6001\uFF08Ctrl/Cmd+Enter\uFF09", () => this.cycleTask());
    this.addToolbarButton("fold-vertical", "\u5C55\u5F00/\u6536\u8D77\u8282\u70B9\uFF08Space\uFF09", () => this.toggleCollapse());
    this.addToolbarButton("link", "\u6253\u5F00\u8282\u70B9\u94FE\u63A5", () => this.openSelectedLink());
    this.addToolbarButton("search", "\u641C\u7D22\u8282\u70B9\uFF08Ctrl/Cmd+F\uFF09", () => this.openSearch());
    this.addToolbarSeparator();
    this.addToolbarButton("table-2", "\u63D2\u5165\u6216\u7F16\u8F91\u8868\u683C", () => this.editTable());
    this.addToolbarButton("code-2", "\u63D2\u5165\u6216\u7F16\u8F91\u4EE3\u7801", () => this.editCode());
    this.addToolbarButton("image-plus", "\u7C98\u8D34\u56FE\u7247\u5230\u5F53\u524D\u8282\u70B9\uFF08Ctrl/Cmd+V\uFF09", () => new import_obsidian3.Notice("\u5148\u590D\u5236\u56FE\u7247\uFF0C\u518D\u9009\u4E2D\u8282\u70B9\u5E76\u6309 Ctrl/Cmd+V"));
    this.addToolbarButton("network", "\u521B\u5EFA\u6216\u8FDB\u5165\u5B50\u5BFC\u56FE", () => void this.createOrOpenSubmap());
    this.addToolbarSeparator();
    this.addToolbarButton("undo-2", "\u64A4\u9500\uFF08Ctrl/Cmd+Z\uFF09", () => this.undo());
    this.addToolbarButton("redo-2", "\u91CD\u505A\uFF08Ctrl/Cmd+Y\uFF09", () => this.redo());
    this.addToolbarSeparator();
    this.addToolbarButton("zoom-in", "\u653E\u5927", () => this.setZoom(this.zoom * 1.15));
    this.addToolbarButton("zoom-out", "\u7F29\u5C0F", () => this.setZoom(this.zoom / 1.15));
    this.addToolbarButton("maximize", "\u9002\u5E94\u753B\u5E03", () => this.fitToView());
    this.addToolbarButton("git-fork", "\u5207\u6362\u5355\u4FA7/\u53CC\u4FA7\u5E03\u5C40", () => this.toggleLayout());
    this.addToolbarButton("palette", "\u5F53\u524D\u8111\u56FE\u5916\u89C2", () => this.editAppearance());
    this.addToolbarSeparator();
    this.addToolbarButton("file-text", "\u67E5\u770B Markdown \u5927\u7EB2", () => this.showOutline());
    this.addToolbarButton("braces", "JSON \u5BFC\u5165 / \u5BFC\u51FA", () => this.showJsonTransfer());
    this.addToolbarButton("image", "\u5BFC\u51FA SVG", () => void this.callbacks.onExportSvg(documentToSvg(this.document.root, this.document.layout, this.document.title, this.getAppearance())));
    const spacer = this.toolbarEl.createSpan({ cls: "mmc-toolbar-spacer" });
    spacer.setAttr("aria-hidden", "true");
    this.zoomStatusEl = this.toolbarEl.createSpan({ cls: "mmc-zoom-status", text: "100%" });
    this.statusEl = this.toolbarEl.createSpan({ cls: "mmc-save-status", text: "\u5DF2\u4FDD\u5B58" });
    const keydown = (event) => this.handleKeydown(event);
    this.rootEl.addEventListener("keydown", keydown);
    this.cleanupCallbacks.push(() => this.rootEl.removeEventListener("keydown", keydown));
    const paste = (event) => {
      void this.handlePaste(event);
    };
    this.rootEl.addEventListener("paste", paste);
    this.cleanupCallbacks.push(() => this.rootEl.removeEventListener("paste", paste));
    const wheel = (event) => {
      const wheelTarget = event.target;
      if (wheelTarget.closest(".mmc-node-table-wrap, .mmc-code-block")) return;
      event.preventDefault();
      const rect = this.viewportEl.getBoundingClientRect();
      const pointerX = event.clientX - rect.left - rect.width / 2;
      const pointerY = event.clientY - rect.top - rect.height / 2;
      const oldZoom = this.zoom;
      const nextZoom = this.clampZoom(this.zoom * (event.deltaY < 0 ? 1.1 : 0.9));
      const worldX = (pointerX - this.panX) / oldZoom;
      const worldY = (pointerY - this.panY) / oldZoom;
      this.zoom = nextZoom;
      this.panX = pointerX - worldX * nextZoom;
      this.panY = pointerY - worldY * nextZoom;
      this.applyTransform();
    };
    this.viewportEl.addEventListener("wheel", wheel, { passive: false });
    this.cleanupCallbacks.push(() => this.viewportEl.removeEventListener("wheel", wheel));
    const pointerDown = (event) => {
      const target = event.target;
      if (target.closest(".mmc-node")) return;
      if (event.button !== 0 && event.button !== 1) return;
      this.panning = true;
      this.panStart = { x: event.clientX, y: event.clientY, panX: this.panX, panY: this.panY };
      this.viewportEl.setPointerCapture(event.pointerId);
      this.viewportEl.addClass("is-panning");
      this.selectNode(null);
    };
    const pointerMove = (event) => {
      if (!this.panning) return;
      this.panX = this.panStart.panX + event.clientX - this.panStart.x;
      this.panY = this.panStart.panY + event.clientY - this.panStart.y;
      this.applyTransform();
    };
    const pointerUp = (event) => {
      if (!this.panning) return;
      this.panning = false;
      if (this.viewportEl.hasPointerCapture(event.pointerId)) this.viewportEl.releasePointerCapture(event.pointerId);
      this.viewportEl.removeClass("is-panning");
    };
    this.viewportEl.addEventListener("pointerdown", pointerDown);
    this.viewportEl.addEventListener("pointermove", pointerMove);
    this.viewportEl.addEventListener("pointerup", pointerUp);
    this.viewportEl.addEventListener("pointercancel", pointerUp);
    this.cleanupCallbacks.push(() => {
      this.viewportEl.removeEventListener("pointerdown", pointerDown);
      this.viewportEl.removeEventListener("pointermove", pointerMove);
      this.viewportEl.removeEventListener("pointerup", pointerUp);
      this.viewportEl.removeEventListener("pointercancel", pointerUp);
    });
    this.resizeObserver = new ResizeObserver(() => this.applyTransform());
    this.resizeObserver.observe(this.viewportEl);
  }
  addToolbarButton(icon, label, action) {
    const button = this.toolbarEl.createEl("button", { cls: "clickable-icon mmc-toolbar-button", attr: { "aria-label": label, title: label } });
    (0, import_obsidian3.setIcon)(button, icon);
    button.addEventListener("click", () => {
      action();
      this.focus();
    });
    return button;
  }
  addToolbarSeparator() {
    this.toolbarEl.createSpan({ cls: "mmc-toolbar-separator" });
  }
  getAppearance() {
    return mergeAppearance(this.options.defaultAppearance, this.document.appearance);
  }
  fontFamilyCss(appearance) {
    var _a;
    if (appearance.fontFamily === "serif") return 'Georgia, "Times New Roman", serif';
    if (appearance.fontFamily === "mono") return '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
    if (appearance.fontFamily === "custom" && ((_a = appearance.customFont) == null ? void 0 : _a.trim())) return `"${appearance.customFont.trim().replaceAll('"', "")}", sans-serif`;
    if (appearance.fontFamily === "sans") return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    return "var(--font-interface)";
  }
  applyAppearance(appearance) {
    var _a, _b;
    const setOrRemove = (name, value) => {
      if (value) this.rootEl.style.setProperty(name, value);
      else this.rootEl.style.removeProperty(name);
    };
    setOrRemove("--mmc-canvas", appearance.backgroundColor);
    setOrRemove("--mmc-pattern-color", appearance.patternColor);
    setOrRemove("--mmc-edge", appearance.edgeColor);
    setOrRemove("--mmc-node-bg", appearance.nodeColor);
    setOrRemove("--mmc-node-text", appearance.textColor);
    setOrRemove("--mmc-node-border", appearance.nodeBorderColor);
    this.rootEl.style.setProperty("--mmc-font-family", this.fontFamilyCss(appearance));
    this.rootEl.style.setProperty("--mmc-edge-width", `${(_a = appearance.edgeWidth) != null ? _a : 2.2}px`);
    this.rootEl.style.setProperty("--mmc-node-border-width", `${(_b = appearance.nodeBorderWidth) != null ? _b : 1}px`);
    this.viewportEl.toggleClass("pattern-grid", appearance.backgroundPattern === "grid");
    this.viewportEl.toggleClass("pattern-dots", appearance.backgroundPattern === "dots");
    this.viewportEl.toggleClass("pattern-none", !appearance.backgroundPattern || appearance.backgroundPattern === "none");
  }
  renderNavigation() {
    var _a, _b, _c;
    this.navigationBarEl.empty();
    const navigation = this.document.navigation;
    this.navigationBarEl.toggleClass("is-hidden", !(navigation == null ? void 0 : navigation.parentPath));
    if (!(navigation == null ? void 0 : navigation.parentPath)) return;
    const button = this.navigationBarEl.createEl("button", {
      cls: "mmc-parent-navigation-button",
      attr: {
        type: "button",
        title: `\u8FD4\u56DE\u7236\u5BFC\u56FE\uFF1A${navigation.parentPath}`
      }
    });
    (0, import_obsidian3.setIcon)(button, "arrow-left");
    const labels = button.createDiv({ cls: "mmc-parent-navigation-labels" });
    labels.createDiv({ cls: "mmc-parent-navigation-title", text: `\u8FD4\u56DE\u7236\u5BFC\u56FE\uFF1A${(_c = (_b = navigation.parentTitle) != null ? _b : (_a = navigation.parentPath.split("/").at(-1)) == null ? void 0 : _a.replace(/\.mindmap$/i, "")) != null ? _c : "\u7236\u5BFC\u56FE"}` });
    if (navigation.parentNodeText) labels.createDiv({ cls: "mmc-parent-navigation-node", text: `\u6765\u6E90\u8282\u70B9\uFF1A${navigation.parentNodeText}` });
    button.addEventListener("click", () => void this.callbacks.onOpenMindMap(navigation.parentPath, navigation.parentNodeId));
    this.navigationBarEl.createDiv({ cls: "mmc-parent-navigation-path", text: navigation.parentPath });
  }
  render() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C;
    this.renderNavigation();
    const appearance = this.getAppearance();
    this.applyAppearance(appearance);
    this.layout = computeLayout(this.document.root, this.document.layout, (_a = appearance.fontSize) != null ? _a : 14);
    this.nodesLayerEl.empty();
    while (this.edgesSvg.firstChild) this.edgesSvg.removeChild(this.edgesSvg.firstChild);
    for (const position of this.layout.nodes) {
      if (!position.parentId) continue;
      const parent = this.layout.byId.get(position.parentId);
      if (!parent) continue;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", edgePath(parent, position, (_b = appearance.edgeStyle) != null ? _b : "curved"));
      path.setAttribute("class", `mmc-edge depth-${Math.min(position.depth, 6)}`);
      if ((_c = position.node.style) == null ? void 0 : _c.color) path.style.stroke = position.node.style.color;
      this.edgesSvg.appendChild(path);
    }
    for (const position of this.layout.nodes) {
      const node = position.node;
      const shape = (_e = (_d = node.style) == null ? void 0 : _d.shape) != null ? _e : this.options.defaultNodeShape;
      const classes = ["mmc-node", position.depth === 0 ? "is-root" : "", `shape-${shape}`].filter(Boolean).join(" ");
      const nodeEl = this.nodesLayerEl.createDiv({ cls: classes });
      nodeEl.dataset.nodeId = node.id;
      nodeEl.style.left = `${position.x}px`;
      nodeEl.style.top = `${position.y}px`;
      nodeEl.style.width = `${position.width}px`;
      nodeEl.style.minHeight = `${position.height}px`;
      nodeEl.draggable = position.depth > 0;
      if (this.selectedId === node.id) nodeEl.addClass("is-selected");
      if (this.searchQuery && nodeSearchText(node).includes(this.searchQuery)) nodeEl.addClass("is-search-match");
      if (node.task) nodeEl.addClass(`task-${node.task}`);
      const isRoot = position.depth === 0;
      const bold = (_h = (_g = (_f = node.style) == null ? void 0 : _f.bold) != null ? _g : appearance.bold) != null ? _h : false;
      const italic = (_k = (_j = (_i = node.style) == null ? void 0 : _i.italic) != null ? _j : appearance.italic) != null ? _k : false;
      const underline = (_n = (_m = (_l = node.style) == null ? void 0 : _l.underline) != null ? _m : appearance.underline) != null ? _n : false;
      if (bold) nodeEl.addClass("is-bold");
      if (italic) nodeEl.addClass("is-italic");
      if (underline) nodeEl.addClass("is-underlined");
      if (node.note) nodeEl.setAttr("title", node.note);
      if ((_o = node.style) == null ? void 0 : _o.color) nodeEl.style.backgroundColor = node.style.color;
      else if (!isRoot && appearance.nodeColor) nodeEl.style.backgroundColor = appearance.nodeColor;
      if ((_p = node.style) == null ? void 0 : _p.textColor) nodeEl.style.color = node.style.textColor;
      else if (!isRoot && appearance.textColor) nodeEl.style.color = appearance.textColor;
      if ((_q = node.style) == null ? void 0 : _q.borderColor) nodeEl.style.borderColor = node.style.borderColor;
      else if (!isRoot && appearance.nodeBorderColor) nodeEl.style.borderColor = appearance.nodeBorderColor;
      nodeEl.style.borderWidth = `${(_t = (_s = (_r = node.style) == null ? void 0 : _r.borderWidth) != null ? _s : appearance.nodeBorderWidth) != null ? _t : isRoot ? 2 : 1}px`;
      const content = nodeEl.createDiv({ cls: "mmc-node-content" });
      const blocks = nodeContentBlocks(node);
      const hasTextBlock = blocks.some((block) => block.type === "text" && block.text.trim());
      if ((node.task || node.icon) && !hasTextBlock) {
        const meta = content.createDiv({ cls: "mmc-node-main mmc-node-meta-only" });
        if (node.task) {
          const task = meta.createSpan({ cls: `mmc-task-icon task-${node.task}`, text: node.task === "done" ? "\u2713" : node.task === "doing" ? "\u25D0" : "\u25CB" });
          task.setAttr("aria-label", node.task === "done" ? "\u5DF2\u5B8C\u6210" : node.task === "doing" ? "\u8FDB\u884C\u4E2D" : "\u5F85\u529E");
        }
        if (node.icon) meta.createSpan({ cls: "mmc-node-icon", text: node.icon });
      }
      let prefixRendered = false;
      for (const block of blocks) {
        if (block.type === "image") {
          const resolved = this.callbacks.resolveImage(block.source);
          const wrap = content.createDiv({ cls: "mmc-node-image-block" });
          const image = wrap.createEl("img", { cls: "mmc-node-image", attr: { alt: (_u = block.alt) != null ? _u : nodePlainText(node) || "\u56FE\u7247", loading: "lazy" } });
          if (resolved) {
            image.src = resolved;
            image.setAttr("title", "\u70B9\u51FB\u653E\u5927\u56FE\u7247");
            image.addEventListener("click", (event) => {
              var _a2;
              event.stopPropagation();
              new ImagePreviewModal(this.app, resolved, (_a2 = block.alt) != null ? _a2 : "\u56FE\u7247\u9884\u89C8").open();
            });
          } else {
            image.addClass("is-unresolved");
            image.setAttr("title", `\u627E\u4E0D\u5230\u56FE\u7247\uFF1A${block.source}`);
          }
          continue;
        }
        if (!block.text.trim()) continue;
        const main = content.createDiv({ cls: "mmc-node-main mmc-node-text-block" });
        if (!prefixRendered && node.task) {
          const task = main.createSpan({ cls: `mmc-task-icon task-${node.task}`, text: node.task === "done" ? "\u2713" : node.task === "doing" ? "\u25D0" : "\u25CB" });
          task.setAttr("aria-label", node.task === "done" ? "\u5DF2\u5B8C\u6210" : node.task === "doing" ? "\u8FDB\u884C\u4E2D" : "\u5F85\u529E");
        }
        if (!prefixRendered && node.icon) main.createSpan({ cls: "mmc-node-icon", text: node.icon });
        prefixRendered = true;
        const textEl = main.createDiv({ cls: "mmc-node-text" });
        renderRichTextRuns(textEl, block.richText, block.text);
        textEl.style.fontSize = `${(_x = (_w = (_v = node.style) == null ? void 0 : _v.fontSize) != null ? _w : appearance.fontSize) != null ? _x : 14}px`;
        textEl.setAttr("aria-label", block.text);
      }
      if (node.submap) {
        const submapButton = content.createEl("button", { cls: "mmc-submap-card", attr: { "aria-label": `\u8FDB\u5165\u5B50\u5BFC\u56FE ${(_y = node.submap.title) != null ? _y : node.submap.path}` } });
        (0, import_obsidian3.setIcon)(submapButton, "network");
        submapButton.createSpan({ text: (_B = (_A = node.submap.title) != null ? _A : (_z = node.submap.path.split("/").at(-1)) == null ? void 0 : _z.replace(/\.mindmap$/i, "")) != null ? _B : "\u5B50\u5BFC\u56FE" });
        submapButton.addEventListener("click", (event) => {
          event.stopPropagation();
          void this.callbacks.onOpenMindMap(node.submap.path);
        });
      }
      if (node.table) this.renderNodeTable(content, node);
      if (node.code) this.renderNodeCode(content, node);
      if ((_C = node.tags) == null ? void 0 : _C.length) {
        const tags = content.createDiv({ cls: "mmc-node-tags" });
        node.tags.slice(0, 4).forEach((tag) => tags.createSpan({ cls: "mmc-node-tag", text: `#${tag}` }));
      }
      if (this.options.showTaskProgress && node.children.length) {
        const progress = getTaskProgress(node);
        if (progress.total) {
          const percent = Math.round(progress.done / progress.total * 100);
          const progressEl = nodeEl.createDiv({ cls: "mmc-task-progress", attr: { title: `${progress.done}/${progress.total} \u4E2A\u4EFB\u52A1\u5DF2\u5B8C\u6210` } });
          progressEl.createDiv({ cls: "mmc-task-progress-bar", attr: { style: `width:${percent}%` } });
          progressEl.createSpan({ text: `${percent}%` });
        }
      }
      if (node.children.length) {
        const fold = nodeEl.createEl("button", { cls: "mmc-fold-button", attr: { "aria-label": node.collapsed ? "\u5C55\u5F00" : "\u6536\u8D77" } });
        fold.setText(node.collapsed ? `+${node.children.length}` : "\u2212");
        fold.addEventListener("click", (event) => {
          event.stopPropagation();
          this.selectNode(node.id);
          this.toggleCollapse();
        });
      }
      const link = this.getNodeLink(node);
      if (link) {
        const linkButton = nodeEl.createEl("button", { cls: "mmc-node-link", attr: { "aria-label": `\u6253\u5F00 ${link}` } });
        (0, import_obsidian3.setIcon)(linkButton, "external-link");
        linkButton.addEventListener("click", (event) => {
          event.stopPropagation();
          void this.callbacks.onOpenLink(link);
        });
      }
      nodeEl.addEventListener("click", (event) => {
        event.stopPropagation();
        this.selectNode(node.id);
      });
      nodeEl.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        this.selectNode(node.id);
        this.editSelected();
      });
      nodeEl.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.selectNode(node.id);
        this.openContextMenu(event);
      });
      nodeEl.addEventListener("dragstart", (event) => {
        var _a2;
        this.draggingId = node.id;
        (_a2 = event.dataTransfer) == null ? void 0 : _a2.setData("text/plain", node.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        nodeEl.addClass("is-dragging");
      });
      nodeEl.addEventListener("dragover", (event) => {
        if (!this.canReparent(this.draggingId, node.id)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        nodeEl.addClass("is-drop-target");
      });
      nodeEl.addEventListener("dragleave", () => nodeEl.removeClass("is-drop-target"));
      nodeEl.addEventListener("drop", (event) => {
        var _a2, _b2, _c2;
        event.preventDefault();
        nodeEl.removeClass("is-drop-target");
        const draggedId = (_c2 = (_b2 = this.draggingId) != null ? _b2 : (_a2 = event.dataTransfer) == null ? void 0 : _a2.getData("text/plain")) != null ? _c2 : null;
        if (draggedId) this.reparentNode(draggedId, node.id);
      });
      nodeEl.addEventListener("dragend", () => {
        this.draggingId = null;
        this.nodesLayerEl.querySelectorAll(".is-dragging, .is-drop-target").forEach((element) => element.removeClasses(["is-dragging", "is-drop-target"]));
      });
    }
    this.applyTransform();
  }
  applyTransform() {
    var _a;
    const rect = this.viewportEl.getBoundingClientRect();
    this.sceneEl.style.transform = `translate(${rect.width / 2 + this.panX}px, ${rect.height / 2 + this.panY}px) scale(${this.zoom})`;
    this.rootEl.style.setProperty("--mmc-zoom", String(this.zoom));
    (_a = this.zoomStatusEl) == null ? void 0 : _a.setText(`${Math.round(this.zoom * 100)}%`);
  }
  selectNode(id) {
    var _a;
    this.selectedId = id != null ? id : "";
    this.nodesLayerEl.querySelectorAll(".mmc-node.is-selected").forEach((element) => element.removeClass("is-selected"));
    if (id) (_a = this.nodesLayerEl.querySelector(`.mmc-node[data-node-id="${CSS.escape(id)}"]`)) == null ? void 0 : _a.addClass("is-selected");
  }
  selectedNode() {
    return this.selectedId ? findNode(this.document.root, this.selectedId) : null;
  }
  createConfiguredNode(text = "\u65B0\u8282\u70B9") {
    const node = createNode(text);
    if (this.options.defaultNodeShape !== "rounded") node.style = { shape: this.options.defaultNodeShape };
    return node;
  }
  addChild() {
    var _a;
    const selected = (_a = this.selectedNode()) != null ? _a : this.document.root;
    const node = this.createConfiguredNode();
    this.mutate(() => {
      selected.collapsed = false;
      selected.children.push(node);
      this.selectedId = node.id;
    });
    this.editSelected();
  }
  addSibling() {
    const selected = this.selectedNode();
    if (!selected || selected.id === this.document.root.id) {
      this.addChild();
      return;
    }
    const parent = findParent(this.document.root, selected.id);
    if (!parent) return;
    const node = this.createConfiguredNode();
    this.mutate(() => {
      const index = parent.children.findIndex((child) => child.id === selected.id);
      parent.children.splice(index + 1, 0, node);
      this.selectedId = node.id;
    });
    this.editSelected();
  }
  editSelected() {
    const selected = this.selectedNode();
    if (!selected) return;
    let historyCaptured = false;
    new NodeEditModal(this.app, selected, this.options.defaultNodeShape, {
      resolveImage: this.callbacks.resolveImage,
      onSavePastedImage: this.callbacks.onSavePastedImage,
      getImageHosts: this.callbacks.getImageHosts,
      getDefaultUploadHostIds: this.callbacks.getDefaultUploadHostIds,
      onUploadImage: this.callbacks.onUploadImage,
      onReadImageSource: this.callbacks.onReadImageSource
    }, (values) => {
      if (!historyCaptured) {
        this.history.push(JSON.stringify(this.document));
        this.trimHistory();
        this.future = [];
        historyCaptured = true;
      }
      selected.content = values.content;
      syncNodeLegacyFields(selected);
      selected.note = values.note || void 0;
      selected.link = values.link || void 0;
      selected.icon = values.icon || void 0;
      selected.tags = values.tags.length ? values.tags : void 0;
      selected.task = values.task;
      const style = {
        color: values.color,
        textColor: values.textColor,
        borderColor: values.borderColor,
        borderWidth: values.borderWidth,
        shape: values.shape,
        bold: values.bold,
        italic: values.italic,
        underline: values.underline,
        fontSize: values.fontSize
      };
      selected.style = Object.values(style).some((value) => value !== void 0) ? style : void 0;
      if (selected.id === this.document.root.id) {
        const title = nodePlainText(selected);
        if (title) this.document.title = title;
      }
      this.callbacks.onChange(this.getDocument());
      this.markSaving();
      this.render();
    }).open();
  }
  deleteSelected() {
    const selected = this.selectedNode();
    if (!selected || selected.id === this.document.root.id) {
      new import_obsidian3.Notice("\u6839\u8282\u70B9\u4E0D\u80FD\u5220\u9664");
      return;
    }
    const parent = findParent(this.document.root, selected.id);
    this.mutate(() => {
      var _a;
      removeNode(this.document.root, selected.id);
      this.selectedId = (_a = parent == null ? void 0 : parent.id) != null ? _a : this.document.root.id;
    });
  }
  toggleCollapse() {
    const selected = this.selectedNode();
    if (!selected || !selected.children.length) return;
    this.mutate(() => {
      selected.collapsed = !selected.collapsed;
    });
  }
  cycleTask() {
    const selected = this.selectedNode();
    if (!selected) return;
    const next = { "": "todo", todo: "doing", doing: "done", done: void 0 };
    this.mutate(() => {
      var _a;
      selected.task = next[(_a = selected.task) != null ? _a : ""];
    });
  }
  toggleLayout() {
    this.mutate(() => {
      this.document.layout = this.document.layout === "right" ? "balanced" : "right";
    });
    window.setTimeout(() => this.fitToView(), 20);
  }
  editAppearance() {
    new AppearanceModal(
      this.app,
      this.getAppearance(),
      (appearance) => this.mutate(() => {
        this.document.appearance = appearance;
      }),
      () => this.mutate(() => {
        this.document.appearance = void 0;
      })
    ).open();
  }
  editTable() {
    var _a;
    const selected = (_a = this.selectedNode()) != null ? _a : this.document.root;
    new TableEditModal(this.app, selected.table, (table) => {
      this.mutate(() => {
        selected.table = table;
      });
    }).open();
  }
  convertChildrenToTable() {
    var _a;
    const selected = (_a = this.selectedNode()) != null ? _a : this.document.root;
    const table = childrenToTable(selected);
    if (!table) {
      new import_obsidian3.Notice("\u5F53\u524D\u8282\u70B9\u6CA1\u6709\u53EF\u8F6C\u6362\u7684\u5B50\u8282\u70B9");
      return;
    }
    this.mutate(() => {
      selected.table = table;
      selected.collapsed = true;
    });
    new import_obsidian3.Notice("\u5DF2\u751F\u6210\u5B50\u8282\u70B9\u8868\u683C\uFF1B\u539F\u5B50\u8282\u70B9\u5DF2\u4FDD\u7559\u5E76\u6536\u8D77");
  }
  removeTable() {
    const selected = this.selectedNode();
    if (!(selected == null ? void 0 : selected.table)) return;
    this.mutate(() => {
      selected.table = void 0;
      if (selected.children.length) selected.collapsed = false;
    });
  }
  editCode() {
    var _a;
    const selected = (_a = this.selectedNode()) != null ? _a : this.document.root;
    new CodeEditModal(this.app, selected.code, (code) => {
      this.mutate(() => {
        selected.code = code;
      });
    }).open();
  }
  removeCode() {
    const selected = this.selectedNode();
    if (!(selected == null ? void 0 : selected.code)) return;
    this.mutate(() => {
      selected.code = void 0;
    });
  }
  async createOrOpenSubmap() {
    var _a;
    const selected = (_a = this.selectedNode()) != null ? _a : this.document.root;
    if (selected.submap) {
      await this.callbacks.onOpenMindMap(selected.submap.path);
      return;
    }
    try {
      const submap = await this.callbacks.onCreateSubmap(selected);
      this.mutate(() => {
        selected.submap = submap;
      });
      await this.callbacks.onOpenMindMap(submap.path);
    } catch (error) {
      console.error("MindMap Studio create submap failed", error);
      new import_obsidian3.Notice("\u521B\u5EFA\u5B50\u5BFC\u56FE\u5931\u8D25");
    }
  }
  renderNodeTable(content, node) {
    if (!node.table) return;
    const wrap = content.createDiv({ cls: "mmc-node-table-wrap" });
    const table = wrap.createEl("table", { cls: "mmc-node-table" });
    const head = table.createEl("thead").createEl("tr");
    node.table.headers.forEach((header, index) => {
      var _a, _b, _c;
      const cell = head.createEl("th", { text: header || `\u5217 ${index + 1}` });
      cell.style.textAlign = (_c = (_b = (_a = node.table) == null ? void 0 : _a.alignments) == null ? void 0 : _b[index]) != null ? _c : "left";
    });
    const body = table.createEl("tbody");
    node.table.rows.forEach((row) => {
      const tr = body.createEl("tr");
      node.table.headers.forEach((_, index) => {
        var _a, _b, _c, _d;
        const cell = tr.createEl("td", { text: (_a = row[index]) != null ? _a : "" });
        cell.style.textAlign = (_d = (_c = (_b = node.table) == null ? void 0 : _b.alignments) == null ? void 0 : _c[index]) != null ? _d : "left";
      });
    });
    wrap.addEventListener("pointerdown", (event) => event.stopPropagation());
    wrap.addEventListener("dragstart", (event) => event.preventDefault());
    wrap.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.selectNode(node.id);
      this.editTable();
    });
  }
  renderNodeCode(content, node) {
    if (!node.code) return;
    const block = content.createDiv({ cls: "mmc-code-block" });
    const header = block.createDiv({ cls: "mmc-code-header" });
    header.createSpan({ text: node.code.language || "code" });
    const copy = header.createEl("button", { cls: "clickable-icon", attr: { "aria-label": "\u590D\u5236\u4EE3\u7801" } });
    (0, import_obsidian3.setIcon)(copy, "copy");
    copy.addEventListener("click", (event) => {
      event.stopPropagation();
      void navigator.clipboard.writeText(node.code.code).then(() => new import_obsidian3.Notice("\u4EE3\u7801\u5DF2\u590D\u5236"));
    });
    const rendered = block.createDiv({ cls: "mmc-code-rendered markdown-rendered" });
    void this.callbacks.onRenderCode(node.code, rendered);
    block.addEventListener("pointerdown", (event) => event.stopPropagation());
    block.addEventListener("dragstart", (event) => event.preventDefault());
    block.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.selectNode(node.id);
      this.editCode();
    });
  }
  async handlePaste(event) {
    var _a, _b, _c;
    const target = event.target;
    if (target.matches("input, textarea, select, [contenteditable='true']")) return;
    const data = event.clipboardData;
    if (!data) return;
    const imageItem = Array.from(data.items).find((item) => item.kind === "file" && item.type.startsWith("image/"));
    if (imageItem) {
      const blob = imageItem.getAsFile();
      if (!blob) return;
      event.preventDefault();
      const selected2 = (_a = this.selectedNode()) != null ? _a : this.document.root;
      try {
        const extension = ((_b = blob.type.split("/")[1]) == null ? void 0 : _b.replace("jpeg", "jpg")) || "png";
        const filename = `mindmap-image.${extension}`;
        const path = await this.callbacks.onSavePastedImage(blob, filename);
        const imageBlock = { id: newId(), type: "image", source: path, localSource: path };
        this.mutate(() => {
          const blocks = nodeContentBlocks(selected2);
          blocks.push(imageBlock);
          selected2.content = blocks;
          syncNodeLegacyFields(selected2);
        });
        const scheduled = this.callbacks.onScheduleAutoUpload(selected2.id, imageBlock.id, path, filename);
        new import_obsidian3.Notice(scheduled ? `\u56FE\u7247\u5DF2\u4FDD\u5B58\uFF0C\u7B49\u5F85\u81EA\u52A8\u4E0A\u4F20\uFF1A${path}` : `\u56FE\u7247\u5DF2\u4FDD\u5B58\uFF1A${path}`);
      } catch (error) {
        console.error("MindMap Studio paste image failed", error);
        new import_obsidian3.Notice("\u7C98\u8D34\u56FE\u7247\u5931\u8D25");
      }
      return;
    }
    const text = data.getData("text/plain");
    if (!text.trim()) return;
    const selected = (_c = this.selectedNode()) != null ? _c : this.document.root;
    const table = parseMarkdownTable(text);
    if (table) {
      event.preventDefault();
      this.mutate(() => {
        selected.table = table;
      });
      new import_obsidian3.Notice("\u5DF2\u8BC6\u522B\u5E76\u63D2\u5165 Markdown \u8868\u683C");
      return;
    }
    const code = parseFencedCode(text);
    if (code) {
      event.preventDefault();
      this.mutate(() => {
        selected.code = code;
      });
      new import_obsidian3.Notice(`\u5DF2\u8BC6\u522B\u5E76\u63D2\u5165${code.language ? ` ${code.language}` : ""}\u4EE3\u7801`);
      return;
    }
    const branch = this.parseClipboardNode(text);
    if (branch) {
      event.preventDefault();
      const clone = cloneNodeWithFreshIds(branch);
      this.mutate(() => {
        selected.collapsed = false;
        selected.children.push(clone);
        this.selectedId = clone.id;
      });
    }
  }
  openSelectedLink() {
    const selected = this.selectedNode();
    if (!selected) return;
    const link = this.getNodeLink(selected);
    if (!link) {
      new import_obsidian3.Notice("\u5F53\u524D\u8282\u70B9\u6CA1\u6709\u94FE\u63A5\uFF1B\u53EF\u6309 F2 \u6DFB\u52A0\u94FE\u63A5\u6216\u5728\u6587\u5B57\u4E2D\u5199\u5165 [[\u7B14\u8BB0\u540D]]");
      return;
    }
    void this.callbacks.onOpenLink(link);
  }
  getNodeLink(node) {
    var _a, _b;
    return ((_a = node.link) == null ? void 0 : _a.trim()) || extractFirstWikiLink(nodePlainText(node)) || extractFirstWikiLink((_b = node.note) != null ? _b : "");
  }
  showOutline() {
    const markdown = documentToMarkdown(this.document);
    new OutlineModal(this.app, markdown, () => void this.callbacks.onExportMarkdown(markdown)).open();
  }
  showJsonTransfer() {
    new JsonTransferModal(
      this.app,
      this.getDocument(),
      (document2) => this.replaceDocument(document2),
      (json) => void this.callbacks.onExportJson(json)
    ).open();
  }
  openSearch() {
    new SearchNodesModal(
      this.app,
      flattenNodes(this.document.root),
      (query) => {
        this.searchQuery = query;
        this.render();
      },
      (node) => this.focusNode(node.id)
    ).open();
  }
  focusNode(id) {
    const ancestors = findAncestors(this.document.root, id);
    const collapsed = ancestors.filter((node) => node.collapsed);
    if (collapsed.length) {
      this.mutate(() => collapsed.forEach((node) => {
        node.collapsed = false;
      }));
    }
    this.selectedId = id;
    this.render();
    window.setTimeout(() => this.centerNode(id), 20);
  }
  centerNode(id) {
    const position = this.layout.byId.get(id);
    if (!position) return;
    this.panX = -position.x * this.zoom;
    this.panY = -position.y * this.zoom;
    this.applyTransform();
  }
  openContextMenu(event) {
    const selected = this.selectedNode();
    const menu = new import_obsidian3.Menu();
    menu.addItem((item) => item.setTitle("\u6DFB\u52A0\u5B50\u8282\u70B9").setIcon("plus-circle").onClick(() => this.addChild()));
    menu.addItem((item) => item.setTitle("\u6DFB\u52A0\u540C\u7EA7\u8282\u70B9").setIcon("list-plus").onClick(() => this.addSibling()));
    menu.addItem((item) => item.setTitle("\u7F16\u8F91\u8282\u70B9").setIcon("pencil").onClick(() => this.editSelected()));
    menu.addItem((item) => item.setTitle("\u514B\u9686\u5206\u652F").setIcon("copy-plus").onClick(() => this.duplicateSelected()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle((selected == null ? void 0 : selected.table) ? "\u7F16\u8F91\u8868\u683C" : "\u63D2\u5165\u8868\u683C").setIcon("table-2").onClick(() => this.editTable()));
    menu.addItem((item) => item.setTitle("\u5C06\u5B50\u8282\u70B9\u751F\u6210\u8868\u683C").setIcon("table-properties").onClick(() => this.convertChildrenToTable()));
    if (selected == null ? void 0 : selected.table) menu.addItem((item) => item.setTitle("\u79FB\u9664\u8868\u683C").setIcon("table-2").onClick(() => this.removeTable()));
    menu.addItem((item) => item.setTitle((selected == null ? void 0 : selected.code) ? "\u7F16\u8F91\u4EE3\u7801" : "\u63D2\u5165\u4EE3\u7801").setIcon("code-2").onClick(() => this.editCode()));
    if (selected == null ? void 0 : selected.code) menu.addItem((item) => item.setTitle("\u79FB\u9664\u4EE3\u7801").setIcon("eraser").onClick(() => this.removeCode()));
    menu.addItem((item) => item.setTitle((selected == null ? void 0 : selected.submap) ? "\u8FDB\u5165\u5B50\u5BFC\u56FE" : "\u521B\u5EFA\u5B50\u5BFC\u56FE").setIcon("network").onClick(() => void this.createOrOpenSubmap()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("\u590D\u5236\u5206\u652F").setIcon("copy").onClick(() => void this.copySelectedBranch()));
    menu.addItem((item) => item.setTitle("\u7C98\u8D34\u4E3A\u5B50\u8282\u70B9").setIcon("clipboard-paste").onClick(() => void this.pasteAsChild()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle(`\u4EFB\u52A1\u72B6\u6001\uFF1A${(selected == null ? void 0 : selected.task) === "done" ? "\u5DF2\u5B8C\u6210" : (selected == null ? void 0 : selected.task) === "doing" ? "\u8FDB\u884C\u4E2D" : (selected == null ? void 0 : selected.task) === "todo" ? "\u5F85\u529E" : "\u65E0"}`).setIcon("circle-check-big").onClick(() => this.cycleTask()));
    menu.addItem((item) => item.setTitle("\u5C55\u5F00/\u6536\u8D77").setIcon("fold-vertical").onClick(() => this.toggleCollapse()));
    menu.addItem((item) => item.setTitle("\u6253\u5F00\u94FE\u63A5").setIcon("link").onClick(() => this.openSelectedLink()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("\u5220\u9664\u8282\u70B9").setIcon("trash-2").onClick(() => this.deleteSelected()));
    menu.showAtMouseEvent(event);
  }
  async copySelectedBranch() {
    const selected = this.selectedNode();
    if (!selected) return false;
    this.branchClipboard = cloneDocument({ version: 8, title: nodePlainText(selected) || "\u56FE\u7247\u8282\u70B9", layout: "right", theme: "auto", root: selected }).root;
    const payload = JSON.stringify({ type: "mindmap-studio-node", version: 1, node: selected }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      new import_obsidian3.Notice("\u5DF2\u590D\u5236\u8282\u70B9\u5206\u652F");
    } catch (e) {
      new import_obsidian3.Notice("\u8282\u70B9\u5206\u652F\u5DF2\u590D\u5236\u5230\u63D2\u4EF6\u5185\u90E8\u526A\u8D34\u677F");
    }
    return true;
  }
  async pasteAsChild() {
    var _a;
    const selected = (_a = this.selectedNode()) != null ? _a : this.document.root;
    let sourceNode = null;
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) sourceNode = this.parseClipboardNode(text);
    } catch (e) {
    }
    sourceNode != null ? sourceNode : sourceNode = this.branchClipboard;
    if (!sourceNode) {
      new import_obsidian3.Notice("\u526A\u8D34\u677F\u4E2D\u6CA1\u6709\u53EF\u7C98\u8D34\u7684 MindMap \u8282\u70B9");
      return;
    }
    const clone = cloneNodeWithFreshIds(sourceNode);
    this.mutate(() => {
      selected.collapsed = false;
      selected.children.push(clone);
      this.selectedId = clone.id;
    });
  }
  parseClipboardNode(text) {
    var _a, _b, _c;
    try {
      const parsed = JSON.parse(text);
      const input = (parsed.type === "mindmap-studio-node" || parsed.type === "mmc-lite-node" || parsed.type === "smm-lite-node") && parsed.node ? parsed.node : (_a = parsed.root) != null ? _a : typeof parsed.text === "string" && Array.isArray(parsed.children) ? parsed : null;
      if (!input) return null;
      return normalizeDocument({ title: (_b = input.text) != null ? _b : "\u7C98\u8D34\u8282\u70B9", root: input }, (_c = input.text) != null ? _c : "\u7C98\u8D34\u8282\u70B9").root;
    } catch (e) {
      return null;
    }
  }
  duplicateSelected() {
    const selected = this.selectedNode();
    if (!selected || selected.id === this.document.root.id) {
      new import_obsidian3.Notice("\u8BF7\u9009\u62E9\u975E\u6839\u8282\u70B9\u540E\u514B\u9686\u5206\u652F");
      return;
    }
    const parent = findParent(this.document.root, selected.id);
    if (!parent) return;
    const clone = cloneNodeWithFreshIds(selected);
    this.mutate(() => {
      const index = parent.children.findIndex((child) => child.id === selected.id);
      parent.children.splice(index + 1, 0, clone);
      this.selectedId = clone.id;
    });
  }
  canReparent(draggedId, targetId) {
    if (!draggedId || draggedId === this.document.root.id || draggedId === targetId) return false;
    const dragged = findNode(this.document.root, draggedId);
    return Boolean(dragged && !containsNode(dragged, targetId));
  }
  reparentNode(draggedId, targetId) {
    if (!this.canReparent(draggedId, targetId)) return;
    const dragged = findNode(this.document.root, draggedId);
    const target = findNode(this.document.root, targetId);
    if (!dragged || !target) return;
    this.mutate(() => {
      removeNode(this.document.root, draggedId);
      target.children.push(dragged);
      target.collapsed = false;
      this.selectedId = draggedId;
    });
  }
  replaceDocument(document2) {
    this.history.push(JSON.stringify(this.document));
    this.trimHistory();
    this.future = [];
    this.document = cloneDocument(document2);
    this.selectedId = this.document.root.id;
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
    window.setTimeout(() => this.fitToView(), 20);
  }
  mutate(action) {
    this.history.push(JSON.stringify(this.document));
    this.trimHistory();
    this.future = [];
    action();
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }
  trimHistory() {
    const limit = Math.max(10, Math.min(500, this.options.historyLimit));
    while (this.history.length > limit) this.history.shift();
  }
  undo() {
    const previous = this.history.pop();
    if (!previous) return;
    this.future.push(JSON.stringify(this.document));
    this.document = JSON.parse(previous);
    this.selectedId = this.document.root.id;
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }
  redo() {
    const next = this.future.pop();
    if (!next) return;
    this.history.push(JSON.stringify(this.document));
    this.trimHistory();
    this.document = JSON.parse(next);
    this.selectedId = this.document.root.id;
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }
  fitToView() {
    const rect = this.viewportEl.getBoundingClientRect();
    const width = Math.max(1, this.layout.maxX - this.layout.minX + 100);
    const height = Math.max(1, this.layout.maxY - this.layout.minY + 100);
    this.zoom = this.clampZoom(Math.min((rect.width - 40) / width, (rect.height - 40) / height, 1.25));
    const centerX = (this.layout.minX + this.layout.maxX) / 2;
    const centerY = (this.layout.minY + this.layout.maxY) / 2;
    this.panX = -centerX * this.zoom;
    this.panY = -centerY * this.zoom;
    this.applyTransform();
  }
  setZoom(value) {
    this.zoom = this.clampZoom(value);
    this.applyTransform();
  }
  clampZoom(value) {
    return Math.min(2.5, Math.max(0.2, value));
  }
  navigateSelection(direction) {
    var _a, _b, _c;
    const selected = (_a = this.selectedNode()) != null ? _a : this.document.root;
    let target = null;
    if (direction === "parent") target = findParent(this.document.root, selected.id);
    if (direction === "child") target = (_b = selected.children[0]) != null ? _b : null;
    if (direction === "previous" || direction === "next") {
      const parent = findParent(this.document.root, selected.id);
      if (parent) {
        const index = parent.children.findIndex((child) => child.id === selected.id);
        const offset = direction === "previous" ? -1 : 1;
        target = (_c = parent.children[index + offset]) != null ? _c : null;
      }
    }
    if (target) {
      this.selectNode(target.id);
      this.centerNode(target.id);
    }
  }
  handleKeydown(event) {
    const target = event.target;
    if (target.matches("input, textarea, select, [contenteditable='true']")) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (mod && key === "s") {
      event.preventDefault();
      this.callbacks.onChange(this.getDocument());
      this.markSaving();
      return;
    }
    if (mod && key === "f") {
      event.preventDefault();
      this.openSearch();
      return;
    }
    if (mod && key === "d") {
      event.preventDefault();
      this.duplicateSelected();
      return;
    }
    if (mod && key === "c") {
      event.preventDefault();
      void this.copySelectedBranch();
      return;
    }
    if (mod && key === "x") {
      event.preventDefault();
      void this.copySelectedBranch().then((copied) => {
        if (copied) this.deleteSelected();
      });
      return;
    }
    if (mod && event.key === "Enter") {
      event.preventDefault();
      this.cycleTask();
      return;
    }
    if (mod && key === "z" && !event.shiftKey) {
      event.preventDefault();
      this.undo();
      return;
    }
    if (mod && key === "y" || mod && event.shiftKey && key === "z") {
      event.preventDefault();
      this.redo();
      return;
    }
    switch (event.key) {
      case "Tab":
        event.preventDefault();
        this.addChild();
        break;
      case "Enter":
        event.preventDefault();
        this.addSibling();
        break;
      case "Delete":
      case "Backspace":
        event.preventDefault();
        this.deleteSelected();
        break;
      case "F2":
        event.preventDefault();
        this.editSelected();
        break;
      case " ":
        event.preventDefault();
        this.toggleCollapse();
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.navigateSelection("parent");
        break;
      case "ArrowRight":
        event.preventDefault();
        this.navigateSelection("child");
        break;
      case "ArrowUp":
        event.preventDefault();
        this.navigateSelection("previous");
        break;
      case "ArrowDown":
        event.preventDefault();
        this.navigateSelection("next");
        break;
      case "+":
      case "=":
        event.preventDefault();
        this.setZoom(this.zoom * 1.15);
        break;
      case "-":
        event.preventDefault();
        this.setZoom(this.zoom / 1.15);
        break;
      case "0":
        if (mod) {
          event.preventDefault();
          this.fitToView();
        }
        break;
      default:
        break;
    }
  }
};

// src/view.ts
var VIEW_TYPE_MINDMAP_STUDIO = "mindmap-studio-view";
var MindMapStudioView = class extends import_obsidian4.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.editor = null;
    this.document = null;
    this.savedTimer = null;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_MINDMAP_STUDIO;
  }
  getDisplayText() {
    var _a, _b;
    return (_b = (_a = this.file) == null ? void 0 : _a.basename) != null ? _b : "\u601D\u7EF4\u5BFC\u56FE";
  }
  getIcon() {
    return "brain-circuit";
  }
  getViewData() {
    var _a, _b;
    const document2 = (_b = (_a = this.editor) == null ? void 0 : _a.getDocument()) != null ? _b : this.document;
    return serializeDocument(document2 != null ? document2 : this.plugin.createConfiguredDocument("\u601D\u7EF4\u5BFC\u56FE"));
  }
  setViewData(data, clear) {
    var _a, _b, _c;
    const title = (_b = (_a = this.file) == null ? void 0 : _a.basename) != null ? _b : "\u601D\u7EF4\u5BFC\u56FE";
    this.document = parseDocument(data, title);
    this.applyViewClasses();
    if (!this.editor || clear) {
      (_c = this.editor) == null ? void 0 : _c.destroy();
      this.contentEl.empty();
      this.editor = new MindMapEditor(this.app, this.contentEl, this.document, {
        onChange: (document2) => {
          this.document = document2;
          this.requestSave();
          this.scheduleSavedIndicator();
        },
        onOpenLink: async (link) => this.openLink(link),
        onExportSvg: async (svg) => this.exportTextFile("svg", svg),
        onExportMarkdown: async (markdown) => this.exportTextFile("md", markdown),
        onExportJson: async (json) => this.exportTextFile("json", json),
        resolveImage: (source) => this.resolveImage(source),
        onSavePastedImage: async (blob, suggestedName) => this.plugin.savePastedImage(blob, suggestedName, this.file),
        getImageHosts: () => this.plugin.getImageHostChoices(),
        getDefaultUploadHostIds: () => this.plugin.getDefaultUploadHostIds(),
        onUploadImage: async (blob, suggestedName, hostIds) => this.plugin.uploadImageToHosts(blob, suggestedName, hostIds),
        onReadImageSource: async (source) => this.plugin.readImageSource(source, this.file),
        onScheduleAutoUpload: (nodeId, blockId, localPath, suggestedName) => this.plugin.scheduleAutoUpload(this.file, nodeId, blockId, localPath, suggestedName),
        onCreateSubmap: async (node) => {
          if (!this.file) throw new Error("\u5F53\u524D\u8111\u56FE\u5C1A\u672A\u5173\u8054\u6587\u4EF6");
          return this.plugin.createSubmapFile(this.file, node);
        },
        onOpenMindMap: async (path, focusNodeId) => {
          var _a2, _b2;
          await this.save();
          await this.plugin.openMindMapPath(path, (_b2 = (_a2 = this.file) == null ? void 0 : _a2.path) != null ? _b2 : "", this.leaf, focusNodeId);
        },
        onRenderCode: async (block, container) => {
          var _a2, _b2, _c2;
          const longestFence = Math.max(2, ...Array.from(block.code.matchAll(/`+/g), (match) => match[0].length));
          const fence = "`".repeat(longestFence + 1);
          const markdown = `${fence}${(_a2 = block.language) != null ? _a2 : ""}
${block.code}
${fence}`;
          await import_obsidian4.MarkdownRenderer.render(this.app, markdown, container, (_c2 = (_b2 = this.file) == null ? void 0 : _b2.path) != null ? _c2 : "", this);
        }
      }, this.getEditorOptions());
    } else {
      this.editor.setDocument(this.document, false);
      this.editor.setOptions(this.getEditorOptions());
    }
  }
  clear() {
    var _a;
    (_a = this.editor) == null ? void 0 : _a.destroy();
    this.editor = null;
    this.document = null;
    this.contentEl.empty();
  }
  async save(clear) {
    var _a;
    await super.save(clear);
    (_a = this.editor) == null ? void 0 : _a.markSaved();
  }
  async onClose() {
    var _a;
    if (this.savedTimer !== null) window.clearTimeout(this.savedTimer);
    (_a = this.editor) == null ? void 0 : _a.destroy();
    this.editor = null;
    await super.onClose();
  }
  refreshAppearance() {
    var _a;
    this.applyViewClasses();
    (_a = this.editor) == null ? void 0 : _a.setOptions(this.getEditorOptions());
  }
  focusNode(nodeId) {
    var _a;
    (_a = this.editor) == null ? void 0 : _a.focusNodeById(nodeId);
  }
  getEditorOptions() {
    return {
      defaultNodeShape: this.plugin.settings.defaultNodeShape,
      defaultAppearance: settingsToAppearance(this.plugin.settings),
      showTaskProgress: this.plugin.settings.showTaskProgress,
      autoFitOnOpen: this.plugin.settings.autoFitOnOpen,
      historyLimit: this.plugin.settings.historyLimit
    };
  }
  applyViewClasses() {
    var _a, _b;
    const theme = (_b = (_a = this.document) == null ? void 0 : _a.theme) != null ? _b : "auto";
    this.contentEl.toggleClass("mmc-force-light", theme === "light");
    this.contentEl.toggleClass("mmc-force-dark", theme === "dark");
  }
  scheduleSavedIndicator() {
    if (this.savedTimer !== null) window.clearTimeout(this.savedTimer);
    this.savedTimer = window.setTimeout(() => {
      var _a;
      return (_a = this.editor) == null ? void 0 : _a.markSaved();
    }, 2300);
  }
  async openLink(rawLink) {
    var _a, _b, _c, _d, _e;
    const link = rawLink.trim();
    if (/^https?:\/\//i.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }
    const wikiMatch = link.match(/^\[\[([\s\S]+?)\]\]$/);
    const target = (_c = (_b = ((_a = wikiMatch == null ? void 0 : wikiMatch[1]) != null ? _a : link).split("|")[0]) == null ? void 0 : _b.trim()) != null ? _c : link;
    await this.app.workspace.openLinkText(target, (_e = (_d = this.file) == null ? void 0 : _d.path) != null ? _e : "", false);
  }
  resolveImage(rawSource) {
    var _a, _b, _c, _d, _e, _f;
    const source = rawSource.trim();
    if (!source) return null;
    if (/^(https?:|data:|blob:)/i.test(source)) return source;
    const wikiMatch = source.match(/^!?\[\[([\s\S]+?)\]\]$/);
    const target = (_d = (_c = (_b = ((_a = wikiMatch == null ? void 0 : wikiMatch[1]) != null ? _a : source).split("|")[0]) == null ? void 0 : _b.split("#")[0]) == null ? void 0 : _c.trim()) != null ? _d : source;
    const file = this.app.metadataCache.getFirstLinkpathDest(target, (_f = (_e = this.file) == null ? void 0 : _e.path) != null ? _f : "");
    if (!(file instanceof import_obsidian4.TFile)) return null;
    return this.app.vault.getResourcePath(file);
  }
  async exportTextFile(extension, content) {
    var _a, _b, _c, _d, _e;
    const file = this.file;
    const parentPath = (_b = (_a = file == null ? void 0 : file.parent) == null ? void 0 : _a.path) != null ? _b : "";
    const baseName = (_e = (_d = file == null ? void 0 : file.basename) != null ? _d : (_c = this.document) == null ? void 0 : _c.title) != null ? _e : "\u601D\u7EF4\u5BFC\u56FE";
    const path = await this.plugin.getAvailablePath((0, import_obsidian4.normalizePath)(`${parentPath ? `${parentPath}/` : ""}${baseName}.${extension}`));
    await this.app.vault.create(path, content);
    new import_obsidian4.Notice(`\u5DF2\u5BFC\u51FA\uFF1A${path}`);
  }
};

// src/main.ts
var MINDMAP_EXTENSION = "mindmap";
var LEGACY_SUFFIX = ".smm.md";
var MindMapStudioPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.legacyMigrationPath = null;
    this.autoUploadTimers = /* @__PURE__ */ new Map();
  }
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_MINDMAP_STUDIO, (leaf) => new MindMapStudioView(leaf, this));
    this.registerExtensions([MINDMAP_EXTENSION], VIEW_TYPE_MINDMAP_STUDIO);
    this.addSettingTab(new MindMapStudioSettingTab(this.app, this));
    this.addRibbonIcon("brain-circuit", "\u65B0\u5EFA\u601D\u7EF4\u5BFC\u56FE", () => void this.createMindMap());
    this.addCommand({
      id: "new-mind-map",
      name: "\u65B0\u5EFA\u601D\u7EF4\u5BFC\u56FE",
      callback: () => void this.createMindMap()
    });
    this.addCommand({
      id: "new-mind-map-and-embed",
      name: "\u65B0\u5EFA\u601D\u7EF4\u5BFC\u56FE\u5E76\u63D2\u5165\u5F53\u524D\u7B14\u8BB0",
      callback: () => void this.createMindMap({ insertIntoCurrent: true })
    });
    this.addCommand({
      id: "convert-current-markdown",
      name: "\u5C06\u5F53\u524D Markdown \u8F6C\u6362\u4E3A\u601D\u7EF4\u5BFC\u56FE",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const available = Boolean(file && file.extension === "md" && !this.isLegacyMindMapFile(file));
        if (!checking && available && file) void this.convertMarkdownFile(file);
        return available;
      }
    });
    this.addCommand({
      id: "migrate-legacy-mind-map",
      name: "\u5C06\u5F53\u524D\u65E7\u7248\u8111\u56FE\u8F6C\u6362\u4E3A .mindmap",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const available = Boolean(file && this.isLegacyMindMapFile(file));
        if (!checking && available && file) void this.migrateLegacyFile(file, true);
        return available;
      }
    });
    this.addCommand({
      id: "open-current-as-mind-map",
      name: "\u4EE5\u53EF\u7F16\u8F91\u601D\u7EF4\u5BFC\u56FE\u89C6\u56FE\u91CD\u65B0\u6253\u5F00",
      checkCallback: (checking) => {
        var _a;
        const file = this.app.workspace.getActiveFile();
        const available = Boolean(file && this.isMindMapFile(file));
        if (!checking && available && file) void this.openAsMindMap(file, (_a = this.app.workspace.activeLeaf) != null ? _a : void 0);
        return available;
      }
    });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (file instanceof import_obsidian5.TFolder) {
        menu.addItem((item) => item.setTitle("\u65B0\u5EFA\u601D\u7EF4\u5BFC\u56FE").setIcon("brain-circuit").onClick(() => void this.createMindMap({ folder: file.path })));
        return;
      }
      if (!(file instanceof import_obsidian5.TFile)) return;
      if (this.isMindMapFile(file)) {
        menu.addSeparator();
        menu.addItem((item) => item.setTitle("\u4EE5\u53EF\u7F16\u8F91\u601D\u7EF4\u5BFC\u56FE\u6253\u5F00").setIcon("brain-circuit").onClick(() => void this.openAsMindMap(file)));
      } else if (this.isLegacyMindMapFile(file)) {
        menu.addSeparator();
        menu.addItem((item) => item.setTitle("\u8F6C\u6362\u4E3A\u65B0\u7684 .mindmap \u6587\u4EF6").setIcon("replace").onClick(() => void this.migrateLegacyFile(file, true)));
      }
    }));
    this.registerEvent(this.app.workspace.on("file-open", (file) => {
      if (!file || !this.settings.redirectLegacyFiles || !this.isLegacyMindMapFile(file)) return;
      if (this.legacyMigrationPath === file.path) return;
      window.setTimeout(() => void this.migrateLegacyFile(file, true), 0);
    }));
    this.registerMarkdownCodeBlockProcessor("mindmap", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownCodeBlockProcessor("mindmap-json", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownCodeBlockProcessor("smm", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownCodeBlockProcessor("smm-json", (source, el, ctx) => {
      renderStaticSource(el, source, this.getSourceTitle(ctx), settingsToAppearance(this.settings));
    });
    this.registerMarkdownPostProcessor((element, context) => void this.processMindMapEmbeds(element, context));
  }
  onunload() {
    for (const timer of this.autoUploadTimers.values()) window.clearTimeout(timer);
    this.autoUploadTimers.clear();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO);
  }
  async loadSettings() {
    let loaded = await this.loadData();
    if (!loaded) {
      const oldDataPath = (0, import_obsidian5.normalizePath)(`${this.app.vault.configDir}/plugins/mindmap-canvas/data.json`);
      try {
        if (await this.app.vault.adapter.exists(oldDataPath)) {
          loaded = JSON.parse(await this.app.vault.adapter.read(oldDataPath));
          if (loaded) await this.saveData(loaded);
        }
      } catch (error) {
        console.warn("MindMap Studio could not migrate the old settings file", error);
      }
    }
    const raw = loaded != null ? loaded : {};
    let imageHosts = Array.isArray(raw.imageHosts) ? raw.imageHosts.slice(0, 20).flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item;
      const host = createImageHostConfig(index + 1);
      host.id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : host.id;
      host.name = typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim().slice(0, 120) : host.name;
      host.enabled = candidate.enabled !== false;
      host.endpoint = typeof candidate.endpoint === "string" ? candidate.endpoint.trim().slice(0, 4e3) : "";
      host.method = candidate.method === "PUT" ? "PUT" : "POST";
      host.bodyMode = candidate.bodyMode === "raw" ? "raw" : "multipart";
      host.fieldName = typeof candidate.fieldName === "string" && candidate.fieldName.trim() ? candidate.fieldName.trim().slice(0, 120) : "file";
      host.headers = typeof candidate.headers === "string" ? candidate.headers.trim().slice(0, 2e4) : "";
      host.responsePath = typeof candidate.responsePath === "string" ? candidate.responsePath.trim().slice(0, 500) : "data.url";
      return [host];
    }) : [];
    const legacyEndpoint = typeof raw.imageHostEndpoint === "string" ? raw.imageHostEndpoint.trim() : "";
    if (!imageHosts.length && legacyEndpoint) {
      const host = createImageHostConfig(1);
      host.name = "\u539F\u56FE\u5E8A";
      host.endpoint = legacyEndpoint;
      host.method = raw.imageHostMethod === "PUT" ? "PUT" : "POST";
      host.bodyMode = raw.imageHostBodyMode === "raw" ? "raw" : "multipart";
      host.fieldName = typeof raw.imageHostFieldName === "string" && raw.imageHostFieldName.trim() ? raw.imageHostFieldName.trim() : "file";
      host.headers = typeof raw.imageHostHeaders === "string" ? raw.imageHostHeaders.trim() : "";
      host.responsePath = typeof raw.imageHostResponsePath === "string" ? raw.imageHostResponsePath.trim() : "data.url";
      imageHosts = [host];
    }
    const enabledIds = new Set(imageHosts.filter((host) => host.enabled).map((host) => host.id));
    const selectedIds = Array.isArray(raw.autoUploadHostIds) ? raw.autoUploadHostIds.filter((id) => typeof id === "string" && enabledIds.has(id)) : [];
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...raw,
      imageHosts,
      autoUploadEnabled: raw.autoUploadEnabled === true,
      autoUploadDelaySeconds: typeof raw.autoUploadDelaySeconds === "number" ? Math.max(0, Math.min(300, Math.round(raw.autoUploadDelaySeconds))) : DEFAULT_SETTINGS.autoUploadDelaySeconds,
      autoUploadHostIds: selectedIds,
      deleteLocalAfterUpload: raw.deleteLocalAfterUpload !== false
    };
    if (raw.backgroundPattern === void 0 && raw.showGrid === false) this.settings.backgroundPattern = "none";
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  refreshOpenViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView) leaf.view.refreshAppearance();
    }
  }
  createConfiguredDocument(title) {
    const document2 = createDefaultDocument(title);
    document2.layout = this.settings.defaultLayout;
    document2.theme = this.settings.defaultTheme;
    document2.appearance = settingsToAppearance(this.settings);
    return document2;
  }
  async getAvailablePath(preferredPath) {
    const normalized = (0, import_obsidian5.normalizePath)(preferredPath);
    if (!this.app.vault.getAbstractFileByPath(normalized)) return normalized;
    const dot = normalized.lastIndexOf(".");
    const base = dot > normalized.lastIndexOf("/") ? normalized.slice(0, dot) : normalized;
    const extension = dot > normalized.lastIndexOf("/") ? normalized.slice(dot) : "";
    let index = 2;
    while (this.app.vault.getAbstractFileByPath(`${base} ${index}${extension}`)) index += 1;
    return `${base} ${index}${extension}`;
  }
  async createMindMap(options = {}) {
    var _a, _b;
    const activeBefore = this.app.workspace.getActiveFile();
    const folder = await this.resolveFolder(options.folder, activeBefore);
    const title = (_a = options.title) != null ? _a : this.buildNewTitle();
    const filename = this.sanitizeFilename(title);
    const path = await this.getAvailablePath((0, import_obsidian5.normalizePath)(`${folder ? `${folder}/` : ""}${filename}.${MINDMAP_EXTENSION}`));
    const document2 = (_b = options.document) != null ? _b : this.createConfiguredDocument(title);
    const file = await this.app.vault.create(path, serializeDocument(document2));
    if (options.insertIntoCurrent && activeBefore && activeBefore.extension === "md" && activeBefore.path !== file.path) {
      const embed = `

![[${file.path}]]
`;
      const current = await this.app.vault.read(activeBefore);
      await this.app.vault.modify(activeBefore, `${current.trimEnd()}${embed}`);
    }
    await this.openAsMindMap(file);
    return file;
  }
  async openAsMindMap(file, preferredLeaf, focusNodeId) {
    const leaf = preferredLeaf != null ? preferredLeaf : this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_MINDMAP_STUDIO,
      state: { file: file.path },
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
    if (focusNodeId && leaf.view instanceof MindMapStudioView) {
      window.setTimeout(() => leaf.view instanceof MindMapStudioView && leaf.view.focusNode(focusNodeId), 30);
    }
  }
  async savePastedImage(blob, suggestedName, sourceFile) {
    var _a, _b, _c, _d;
    const sourceFolder = (_b = (_a = sourceFile == null ? void 0 : sourceFile.parent) == null ? void 0 : _a.path) != null ? _b : "";
    const configuredFolder = (0, import_obsidian5.normalizePath)((this.settings.assetFolder || "MindMap Assets").replace(/^\/+|\/+$/g, ""));
    const folder = (0, import_obsidian5.normalizePath)([sourceFolder, configuredFolder].filter(Boolean).join("/"));
    await this.ensureFolderPath(folder);
    const now = /* @__PURE__ */ new Date();
    const two = (value) => String(value).padStart(2, "0");
    const stamp = `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
    const extension = ((_c = suggestedName.split(".").at(-1)) == null ? void 0 : _c.replace(/[^a-z0-9]/gi, "").toLowerCase()) || "png";
    const base = this.sanitizeFilename((_d = sourceFile == null ? void 0 : sourceFile.basename) != null ? _d : "mindmap");
    const preferred = (0, import_obsidian5.normalizePath)(`${folder}/${base}-${stamp}.${extension}`);
    const path = await this.getAvailablePath(preferred);
    await this.app.vault.createBinary(path, await blob.arrayBuffer());
    return path;
  }
  async readImageSource(source, sourceFile) {
    var _a, _b, _c, _d, _e;
    const raw = source.trim();
    if (!raw || /^https?:\/\//i.test(raw) || /^data:/i.test(raw) || /^blob:/i.test(raw)) return null;
    const wikiMatch = raw.match(/^!?\[\[([\s\S]+?)\]\]$/);
    const target = (_d = (_c = (_b = ((_a = wikiMatch == null ? void 0 : wikiMatch[1]) != null ? _a : raw).split("|")[0]) == null ? void 0 : _b.split("#")[0]) == null ? void 0 : _c.trim()) != null ? _d : raw;
    const direct = this.app.vault.getAbstractFileByPath((0, import_obsidian5.normalizePath)(target));
    const file = direct instanceof import_obsidian5.TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(target, (_e = sourceFile == null ? void 0 : sourceFile.path) != null ? _e : "");
    if (!(file instanceof import_obsidian5.TFile)) return null;
    const binary = await this.app.vault.readBinary(file);
    return { blob: new Blob([binary], { type: this.mimeFromFilename(file.name) }), suggestedName: file.name };
  }
  getImageHostChoices() {
    return this.settings.imageHosts.filter((host) => host.enabled && Boolean(host.endpoint.trim())).map((host) => ({ id: host.id, name: host.name }));
  }
  getDefaultUploadHostIds() {
    const enabled = new Set(this.getImageHostChoices().map((host) => host.id));
    return this.settings.autoUploadHostIds.filter((id) => enabled.has(id));
  }
  async uploadImageToHosts(blob, suggestedName, hostIds) {
    const requested = Array.from(new Set(hostIds));
    const hosts = requested.map((id) => this.settings.imageHosts.find((host) => host.id === id)).filter((host) => Boolean((host == null ? void 0 : host.enabled) && host.endpoint.trim()));
    if (!hosts.length) throw new Error("\u6CA1\u6709\u9009\u62E9\u53EF\u7528\u56FE\u5E8A");
    const settled = await Promise.all(hosts.map(async (host) => {
      try {
        const url = await this.uploadImageToHostConfig(host, blob, suggestedName);
        return { ok: true, value: { hostId: host.id, hostName: host.name, url } };
      } catch (error) {
        return {
          ok: false,
          value: {
            hostId: host.id,
            hostName: host.name,
            error: error instanceof Error ? error.message : String(error)
          }
        };
      }
    }));
    return {
      successes: settled.filter((item) => item.ok).map((item) => item.value),
      failures: settled.filter((item) => !item.ok).map((item) => item.value)
    };
  }
  async testImageHost(hostId) {
    const host = this.settings.imageHosts.find((item) => item.id === hostId);
    if (!host) {
      new import_obsidian5.Notice("\u627E\u4E0D\u5230\u8BE5\u56FE\u5E8A\u914D\u7F6E");
      return;
    }
    if (!host.endpoint.trim()) {
      new import_obsidian5.Notice(`\u8BF7\u5148\u586B\u5199 ${host.name} \u7684\u4E0A\u4F20 API`);
      return;
    }
    const png = new Uint8Array([
      137,
      80,
      78,
      71,
      13,
      10,
      26,
      10,
      0,
      0,
      0,
      13,
      73,
      72,
      68,
      82,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1,
      8,
      6,
      0,
      0,
      0,
      31,
      21,
      196,
      137,
      0,
      0,
      0,
      13,
      73,
      68,
      65,
      84,
      8,
      215,
      99,
      248,
      207,
      192,
      240,
      31,
      0,
      5,
      0,
      1,
      255,
      137,
      153,
      61,
      29,
      0,
      0,
      0,
      0,
      73,
      69,
      78,
      68,
      174,
      66,
      96,
      130
    ]);
    const started = performance.now();
    try {
      const url = await this.uploadImageToHostConfig(host, new Blob([png], { type: "image/png" }), "mindmap-studio-api-test.png");
      const elapsed = Math.max(1, Math.round(performance.now() - started));
      new import_obsidian5.Notice(`${host.name} \u8FDE\u63A5\u6210\u529F\uFF08${elapsed} ms\uFF09
${url}`, 8e3);
    } catch (error) {
      console.error("MindMap Studio image host connectivity test failed", error);
      new import_obsidian5.Notice(`${host.name} \u8FDE\u63A5\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`, 8e3);
    }
  }
  scheduleAutoUpload(file, nodeId, blockId, localPath, suggestedName) {
    if (!file || !this.settings.autoUploadEnabled) return false;
    const hostIds = this.getDefaultUploadHostIds();
    if (!hostIds.length) {
      new import_obsidian5.Notice("\u56FE\u7247\u5DF2\u4FDD\u5B58\u5230\u672C\u5730\uFF1B\u81EA\u52A8\u4E0A\u4F20\u672A\u9009\u62E9\u53EF\u7528\u56FE\u5E8A", 5e3);
      return false;
    }
    const key = `${file.path}::${nodeId}::${blockId}`;
    const existing = this.autoUploadTimers.get(key);
    if (existing !== void 0) window.clearTimeout(existing);
    const delay = Math.max(0, Math.min(300, this.settings.autoUploadDelaySeconds)) * 1e3;
    const timer = window.setTimeout(() => {
      this.autoUploadTimers.delete(key);
      void this.runAutoUploadTask(file.path, nodeId, blockId, localPath, suggestedName, hostIds);
    }, delay);
    this.autoUploadTimers.set(key, timer);
    return true;
  }
  async runAutoUploadTask(mindMapPath, nodeId, blockId, localPath, suggestedName, hostIds) {
    var _a, _b;
    try {
      await this.flushOpenView(mindMapPath);
      const mapFile = this.app.vault.getAbstractFileByPath(mindMapPath);
      const localFile = this.app.vault.getAbstractFileByPath((0, import_obsidian5.normalizePath)(localPath));
      if (!(mapFile instanceof import_obsidian5.TFile) || !(localFile instanceof import_obsidian5.TFile)) return;
      const document2 = parseDocument(await this.app.vault.read(mapFile), mapFile.basename);
      const node = findNode(document2.root, nodeId);
      const block = (_a = node == null ? void 0 : node.content) == null ? void 0 : _a.find((item) => item.type === "image" && item.id === blockId);
      if (!node || !block || block.source !== localPath && block.localSource !== localPath) return;
      const binary = await this.app.vault.readBinary(localFile);
      const blob = new Blob([binary], { type: this.mimeFromFilename(localFile.name) });
      const batch = await this.uploadImageToHosts(blob, suggestedName || localFile.name, hostIds);
      const uploadedAt = (/* @__PURE__ */ new Date()).toISOString();
      const remoteByHost = new Map(((_b = block.remoteSources) != null ? _b : []).map((item) => [item.hostId, item]));
      for (const success of batch.successes) {
        remoteByHost.set(success.hostId, { ...success, uploadedAt });
      }
      block.remoteSources = Array.from(remoteByHost.values());
      block.localSource = localPath;
      const allSucceeded = batch.failures.length === 0 && batch.successes.length === hostIds.length;
      if (allSucceeded && batch.successes[0]) block.source = batch.successes[0].url;
      syncNodeLegacyFields(node);
      await this.app.vault.modify(mapFile, serializeDocument(document2));
      await this.refreshOpenMindMap(mapFile, document2);
      let deleted = false;
      if (allSucceeded && this.settings.deleteLocalAfterUpload) {
        deleted = await this.deleteLocalAssetIfSafe(localPath, mindMapPath, blockId);
        if (deleted) {
          block.localSource = void 0;
          await this.app.vault.modify(mapFile, serializeDocument(document2));
          await this.refreshOpenMindMap(mapFile, document2);
        }
      }
      if (allSucceeded) {
        const targets = batch.successes.map((item) => item.hostName).join("\u3001");
        const suffix = this.settings.deleteLocalAfterUpload ? deleted ? "\uFF0C\u672C\u5730\u56FE\u7247\u5DF2\u5B89\u5168\u5220\u9664" : "\uFF0C\u672C\u5730\u56FE\u7247\u56E0\u4ECD\u88AB\u5F15\u7528\u6216\u5220\u9664\u5931\u8D25\u800C\u4FDD\u7559" : "\uFF0C\u672C\u5730\u56FE\u7247\u5DF2\u4FDD\u7559";
        new import_obsidian5.Notice(`\u56FE\u7247\u5DF2\u4E0A\u4F20\u5230 ${targets}${suffix}`, 7e3);
      } else {
        const ok = batch.successes.map((item) => item.hostName).join("\u3001") || "\u65E0";
        const failed = batch.failures.map((item) => `${item.hostName}\uFF1A${item.error}`).join("\uFF1B");
        new import_obsidian5.Notice(`\u56FE\u7247\u4EC5\u90E8\u5206\u4E0A\u4F20\u6210\u529F\u3002\u6210\u529F\uFF1A${ok}\uFF1B\u5931\u8D25\uFF1A${failed}\u3002\u672C\u5730\u56FE\u7247\u5DF2\u4FDD\u7559\u3002`, 9e3);
      }
    } catch (error) {
      console.error("MindMap Studio automatic image upload failed", error);
      new import_obsidian5.Notice(`\u56FE\u7247\u81EA\u52A8\u4E0A\u4F20\u5931\u8D25\uFF0C\u672C\u5730\u56FE\u7247\u5DF2\u4FDD\u7559\uFF1A${error instanceof Error ? error.message : String(error)}`, 8e3);
    }
  }
  async uploadImageToHostConfig(host, blob, suggestedName) {
    const endpoint = host.endpoint.trim();
    if (!endpoint) throw new Error("\u4E0A\u4F20 API \u4E3A\u7A7A");
    let headers = {};
    if (host.headers.trim()) {
      const parsed = JSON.parse(host.headers);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("\u8BF7\u6C42\u5934 JSON \u5FC5\u987B\u662F\u5BF9\u8C61");
      headers = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
    }
    const filename = this.sanitizeFilename(suggestedName || "mindmap-image.png");
    const mime = blob.type || "application/octet-stream";
    let body;
    let contentType = mime;
    if (host.bodyMode === "multipart") {
      const boundary = `----MindMapStudio${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      const encoder = new TextEncoder();
      const fieldName = (host.fieldName || "file").replaceAll('"', "");
      const safeFilename = filename.replaceAll('"', "");
      const head = encoder.encode(`--${boundary}\r
Content-Disposition: form-data; name="${fieldName}"; filename="${safeFilename}"\r
Content-Type: ${mime}\r
\r
`);
      const file = new Uint8Array(await blob.arrayBuffer());
      const tail = encoder.encode(`\r
--${boundary}--\r
`);
      const combined = new Uint8Array(head.length + file.length + tail.length);
      combined.set(head, 0);
      combined.set(file, head.length);
      combined.set(tail, head.length + file.length);
      body = combined.buffer;
      contentType = `multipart/form-data; boundary=${boundary}`;
    } else {
      body = await blob.arrayBuffer();
    }
    const response = await (0, import_obsidian5.requestUrl)({
      url: endpoint,
      method: host.method,
      contentType,
      headers,
      body,
      throw: true
    });
    let payload;
    try {
      payload = response.json;
    } catch (e) {
      payload = void 0;
    }
    if (!payload && response.text) {
      try {
        payload = JSON.parse(response.text);
      } catch (e) {
        payload = response.text;
      }
    }
    const getPath = (value, path) => path.split(".").filter(Boolean).reduce((current, key) => current && typeof current === "object" ? current[key] : void 0, value);
    const candidates = [host.responsePath.trim(), "data.url", "url", "result.url", "result.image", "image.url", "src"].filter(Boolean);
    for (const path of candidates) {
      const value = getPath(payload, path);
      if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
    }
    if (typeof payload === "string") {
      const match = payload.match(/https?:\/\/[^\s"'<>]+/i);
      if (match == null ? void 0 : match[0]) return match[0];
    }
    throw new Error("\u8FD4\u56DE\u7ED3\u679C\u4E2D\u6CA1\u6709\u627E\u5230\u56FE\u7247\u7F51\u5740");
  }
  async flushOpenView(path) {
    var _a;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView && ((_a = leaf.view.file) == null ? void 0 : _a.path) === path) await leaf.view.save();
    }
  }
  async refreshOpenMindMap(file, document2) {
    var _a;
    const source = serializeDocument(document2);
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO)) {
      if (leaf.view instanceof MindMapStudioView && ((_a = leaf.view.file) == null ? void 0 : _a.path) === file.path) leaf.view.setViewData(source, false);
    }
  }
  async deleteLocalAssetIfSafe(localPath, currentMindMapPath, blockId) {
    const normalized = (0, import_obsidian5.normalizePath)(localPath);
    const target = this.app.vault.getAbstractFileByPath(normalized);
    if (!(target instanceof import_obsidian5.TFile)) return false;
    const current = this.app.vault.getAbstractFileByPath(currentMindMapPath);
    if (current instanceof import_obsidian5.TFile) {
      const doc = parseDocument(await this.app.vault.read(current), current.basename);
      const stillUsed = flattenNodes(doc.root).some((node) => nodeContentBlocks(node).some((block) => block.type === "image" && block.id !== blockId && (block.source === normalized || block.localSource === normalized)));
      if (stillUsed) return false;
    }
    for (const file of this.app.vault.getFiles()) {
      if (file.path === currentMindMapPath || file.extension.toLowerCase() !== MINDMAP_EXTENSION) continue;
      try {
        const text = await this.app.vault.cachedRead(file);
        if (text.includes(normalized)) return false;
      } catch (e) {
      }
    }
    try {
      await this.app.vault.delete(target);
      return true;
    } catch (error) {
      console.warn("MindMap Studio could not delete uploaded local image", error);
      return false;
    }
  }
  mimeFromFilename(filename) {
    var _a, _b;
    const extension = (_a = filename.split(".").at(-1)) == null ? void 0 : _a.toLowerCase();
    return (_b = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp", avif: "image/avif" }[extension != null ? extension : ""]) != null ? _b : "application/octet-stream";
  }
  async createSubmapFile(parentFile, node) {
    var _a, _b;
    const title = (nodePlainText(node) || "\u5B50\u5BFC\u56FE").trim();
    const document2 = this.createConfiguredDocument(title);
    document2.root.content = [{ id: document2.root.id + "_title", type: "text", text: title }];
    syncNodeLegacyFields(document2.root);
    document2.root.link = `[[${parentFile.path}]]`;
    document2.title = title;
    document2.navigation = {
      parentPath: parentFile.path,
      parentNodeId: node.id,
      parentTitle: parentFile.basename,
      parentNodeText: nodePlainText(node) || void 0
    };
    const parentFolder = (_b = (_a = parentFile.parent) == null ? void 0 : _a.path) != null ? _b : "";
    const configuredAssets = (0, import_obsidian5.normalizePath)(this.settings.assetFolder || "MindMap Assets");
    const parentMapFolder = this.sanitizeFilename(parentFile.basename);
    const submapFolder = (0, import_obsidian5.normalizePath)([parentFolder, configuredAssets, parentMapFolder].filter(Boolean).join("/"));
    await this.ensureFolderPath(submapFolder);
    const path = await this.getAvailablePath((0, import_obsidian5.normalizePath)(`${submapFolder}/${this.sanitizeFilename(title)}.${MINDMAP_EXTENSION}`));
    const file = await this.app.vault.create(path, serializeDocument(document2));
    return { path: file.path, title: file.basename };
  }
  async openMindMapPath(path, sourcePath = "", preferredLeaf, focusNodeId) {
    const normalized = (0, import_obsidian5.normalizePath)(path.replace(/^\[\[|\]\]$/g, ""));
    const direct = this.app.vault.getAbstractFileByPath(normalized);
    const resolved = direct instanceof import_obsidian5.TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!(resolved instanceof import_obsidian5.TFile) || !this.isMindMapFile(resolved)) {
      new import_obsidian5.Notice(`\u627E\u4E0D\u5230\u5B50\u5BFC\u56FE\uFF1A${path}`);
      return;
    }
    await this.openAsMindMap(resolved, preferredLeaf, focusNodeId);
  }
  async ensureFolderPath(folder) {
    const normalized = (0, import_obsidian5.normalizePath)(folder);
    if (!normalized || this.app.vault.getAbstractFileByPath(normalized) instanceof import_obsidian5.TFolder) return;
    const parts = normalized.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }
  async migrateLegacyFile(file, openAfter = true) {
    var _a, _b, _c;
    if (!this.isLegacyMindMapFile(file)) return null;
    if (this.legacyMigrationPath === file.path) return null;
    this.legacyMigrationPath = file.path;
    try {
      const source = await this.app.vault.read(file);
      const title = file.basename.replace(/\.smm$/i, "") || "\u601D\u7EF4\u5BFC\u56FE";
      const document2 = parseDocument(source, title);
      const parentPath = (_b = (_a = file.parent) == null ? void 0 : _a.path) != null ? _b : "";
      const preferredPath = (0, import_obsidian5.normalizePath)(`${parentPath ? `${parentPath}/` : ""}${this.sanitizeFilename(title)}.${MINDMAP_EXTENSION}`);
      const existing = this.app.vault.getAbstractFileByPath(preferredPath);
      let target;
      if (existing instanceof import_obsidian5.TFile && this.isMindMapFile(existing)) {
        target = existing;
      } else {
        const path = existing ? await this.getAvailablePath(preferredPath) : preferredPath;
        target = await this.app.vault.create(path, serializeDocument(document2));
        new import_obsidian5.Notice(`\u5DF2\u8F6C\u6362\u4E3A\u53EF\u7F16\u8F91\u8111\u56FE\uFF1A${target.path}
\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559\u4F5C\u4E3A\u5907\u4EFD\u3002`, 7e3);
      }
      if (openAfter) await this.openAsMindMap(target, (_c = this.app.workspace.activeLeaf) != null ? _c : void 0);
      return target;
    } catch (error) {
      console.error("MindMap Studio legacy migration failed", error);
      new import_obsidian5.Notice("\u65E7\u7248\u8111\u56FE\u8F6C\u6362\u5931\u8D25\uFF0C\u539F\u6587\u4EF6\u672A\u88AB\u4FEE\u6539\u3002", 6e3);
      return null;
    } finally {
      this.legacyMigrationPath = null;
    }
  }
  isMindMapFile(file) {
    return file.extension.toLowerCase() === MINDMAP_EXTENSION;
  }
  isLegacyMindMapFile(file) {
    return file.path.toLowerCase().endsWith(LEGACY_SUFFIX);
  }
  async convertMarkdownFile(file) {
    var _a, _b;
    const source = await this.app.vault.read(file);
    const title = file.basename;
    const document2 = markdownToDocument(source, title);
    document2.layout = this.settings.defaultLayout;
    document2.theme = this.settings.defaultTheme;
    document2.appearance = settingsToAppearance(this.settings);
    await this.createMindMap({ document: document2, title: `${title} \u8111\u56FE`, folder: (_b = (_a = file.parent) == null ? void 0 : _a.path) != null ? _b : "" });
  }
  async resolveFolder(explicitFolder, activeFile) {
    var _a;
    const candidate = explicitFolder != null ? explicitFolder : this.settings.defaultFolder || ((_a = activeFile == null ? void 0 : activeFile.parent) == null ? void 0 : _a.path) || "";
    if (!candidate) return "";
    const normalized = (0, import_obsidian5.normalizePath)(candidate);
    const existing = this.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof import_obsidian5.TFolder) return normalized;
    await this.ensureFolderPath(normalized);
    return normalized;
  }
  buildNewTitle() {
    const now = /* @__PURE__ */ new Date();
    const two = (value) => String(value).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())} ${two(now.getHours())}${two(now.getMinutes())}`;
    return `${this.settings.filePrefix} ${stamp}`.trim();
  }
  sanitizeFilename(value) {
    return value.replace(/[\\/:*?"<>|#[\]]/g, "-").replace(/\s+/g, " ").trim() || "\u601D\u7EF4\u5BFC\u56FE";
  }
  getSourceTitle(context) {
    const sourceFile = this.app.vault.getAbstractFileByPath(context.sourcePath);
    return sourceFile instanceof import_obsidian5.TFile ? sourceFile.basename : "\u601D\u7EF4\u5BFC\u56FE";
  }
  async processMindMapEmbeds(element, context) {
    var _a, _b, _c, _d, _e;
    const embeds = Array.from(element.querySelectorAll(".internal-embed"));
    for (const embed of embeds) {
      if (embed.dataset.mmcProcessed === "true") continue;
      const rawSource = (_b = (_a = embed.getAttribute("src")) != null ? _a : embed.dataset.src) != null ? _b : "";
      const linkPath = (_e = (_d = (_c = rawSource.split("#")[0]) == null ? void 0 : _c.split("|")[0]) == null ? void 0 : _d.trim()) != null ? _e : "";
      if (!linkPath.toLowerCase().endsWith(`.${MINDMAP_EXTENSION}`)) continue;
      const file = this.app.metadataCache.getFirstLinkpathDest(linkPath, context.sourcePath);
      if (!(file instanceof import_obsidian5.TFile) || !this.isMindMapFile(file)) continue;
      embed.dataset.mmcProcessed = "true";
      try {
        const source = await this.app.vault.cachedRead(file);
        const document2 = parseDocument(source, file.basename);
        renderStaticMindMap(embed, document2, { app: this.app, file, maxHeight: this.settings.embedMaxHeight, defaultAppearance: settingsToAppearance(this.settings) });
      } catch (error) {
        console.error("MindMap Studio embed render failed", error);
        embed.empty();
        embed.createDiv({ cls: "mmc-embed-error", text: "\u65E0\u6CD5\u52A0\u8F7D\u601D\u7EF4\u5BFC\u56FE\u9884\u89C8" });
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL21vZGVsLnRzIiwgInNyYy9zZXR0aW5ncy50cyIsICJzcmMvbGF5b3V0LnRzIiwgInNyYy9zdGF0aWMtcmVuZGVyLnRzIiwgInNyYy92aWV3LnRzIiwgInNyYy9lZGl0b3IudHMiLCAic3JjL2NvbnRlbnQtbW9kYWxzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xuICBNZW51LFxuICBOb3RpY2UsXG4gIFBsdWdpbixcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG4gIHJlcXVlc3RVcmwsXG4gIHR5cGUgTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCxcbiAgdHlwZSBXb3Jrc3BhY2VMZWFmXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgY3JlYXRlRGVmYXVsdERvY3VtZW50LFxuICBmaW5kTm9kZSxcbiAgZmxhdHRlbk5vZGVzLFxuICBtYXJrZG93blRvRG9jdW1lbnQsXG4gIG5vZGVDb250ZW50QmxvY2tzLFxuICBub2RlUGxhaW5UZXh0LFxuICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyxcbiAgcGFyc2VEb2N1bWVudCxcbiAgc2VyaWFsaXplRG9jdW1lbnQsXG4gIHR5cGUgTWluZE1hcERvY3VtZW50LFxuICB0eXBlIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayxcbiAgdHlwZSBNaW5kTWFwTm9kZSxcbiAgdHlwZSBNaW5kTWFwU3VibWFwXG59IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1xuICBERUZBVUxUX1NFVFRJTkdTLFxuICBNaW5kTWFwU3R1ZGlvU2V0dGluZ1RhYixcbiAgY3JlYXRlSW1hZ2VIb3N0Q29uZmlnLFxuICBzZXR0aW5nc1RvQXBwZWFyYW5jZSxcbiAgdHlwZSBJbWFnZUhvc3RDaG9pY2UsXG4gIHR5cGUgSW1hZ2VIb3N0Q29uZmlnLFxuICB0eXBlIEltYWdlSG9zdFVwbG9hZEJhdGNoLFxuICB0eXBlIEltYWdlSG9zdFVwbG9hZFN1Y2Nlc3MsXG4gIHR5cGUgTWluZE1hcFN0dWRpb1NldHRpbmdzXG59IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyByZW5kZXJTdGF0aWNNaW5kTWFwLCByZW5kZXJTdGF0aWNTb3VyY2UgfSBmcm9tIFwiLi9zdGF0aWMtcmVuZGVyXCI7XG5pbXBvcnQgeyBNaW5kTWFwU3R1ZGlvVmlldywgVklFV19UWVBFX01JTkRNQVBfU1RVRElPIH0gZnJvbSBcIi4vdmlld1wiO1xuXG5leHBvcnQgY29uc3QgTUlORE1BUF9FWFRFTlNJT04gPSBcIm1pbmRtYXBcIjtcbmNvbnN0IExFR0FDWV9TVUZGSVggPSBcIi5zbW0ubWRcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWluZE1hcFN0dWRpb1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBNaW5kTWFwU3R1ZGlvU2V0dGluZ3MgPSBERUZBVUxUX1NFVFRJTkdTO1xuICBwcml2YXRlIGxlZ2FjeU1pZ3JhdGlvblBhdGg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IGF1dG9VcGxvYWRUaW1lcnMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFX01JTkRNQVBfU1RVRElPLCAobGVhZikgPT4gbmV3IE1pbmRNYXBTdHVkaW9WaWV3KGxlYWYsIHRoaXMpKTtcbiAgICAvLyBBIGRlZGljYXRlZCBleHRlbnNpb24gaXMgdGhlIGtleSB0byByZWxpYWJsZSByZW9wZW5pbmc6IE9ic2lkaWFuIHJvdXRlcyBldmVyeVxuICAgIC8vIC5taW5kbWFwIGZpbGUgZGlyZWN0bHkgdG8gdGhlIGVkaXRhYmxlIFRleHRGaWxlVmlldyBpbnN0ZWFkIG9mIE1hcmtkb3duIHZpZXcuXG4gICAgdGhpcy5yZWdpc3RlckV4dGVuc2lvbnMoW01JTkRNQVBfRVhURU5TSU9OXSwgVklFV19UWVBFX01JTkRNQVBfU1RVRElPKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IE1pbmRNYXBTdHVkaW9TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJicmFpbi1jaXJjdWl0XCIsIFwiXHU2NUIwXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIsICgpID0+IHZvaWQgdGhpcy5jcmVhdGVNaW5kTWFwKCkpO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5ldy1taW5kLW1hcFwiLFxuICAgICAgbmFtZTogXCJcdTY1QjBcdTVFRkFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMuY3JlYXRlTWluZE1hcCgpXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5ldy1taW5kLW1hcC1hbmQtZW1iZWRcIixcbiAgICAgIG5hbWU6IFwiXHU2NUIwXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU1RTc2XHU2M0QyXHU1MTY1XHU1RjUzXHU1MjREXHU3QjE0XHU4QkIwXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU1pbmRNYXAoeyBpbnNlcnRJbnRvQ3VycmVudDogdHJ1ZSB9KVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjb252ZXJ0LWN1cnJlbnQtbWFya2Rvd25cIixcbiAgICAgIG5hbWU6IFwiXHU1QzA2XHU1RjUzXHU1MjREIE1hcmtkb3duIFx1OEY2Q1x1NjM2Mlx1NEUzQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBCb29sZWFuKGZpbGUgJiYgZmlsZS5leHRlbnNpb24gPT09IFwibWRcIiAmJiAhdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKTtcbiAgICAgICAgaWYgKCFjaGVja2luZyAmJiBhdmFpbGFibGUgJiYgZmlsZSkgdm9pZCB0aGlzLmNvbnZlcnRNYXJrZG93bkZpbGUoZmlsZSk7XG4gICAgICAgIHJldHVybiBhdmFpbGFibGU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm1pZ3JhdGUtbGVnYWN5LW1pbmQtbWFwXCIsXG4gICAgICBuYW1lOiBcIlx1NUMwNlx1NUY1M1x1NTI0RFx1NjVFN1x1NzI0OFx1ODExMVx1NTZGRVx1OEY2Q1x1NjM2Mlx1NEUzQSAubWluZG1hcFwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBCb29sZWFuKGZpbGUgJiYgdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKTtcbiAgICAgICAgaWYgKCFjaGVja2luZyAmJiBhdmFpbGFibGUgJiYgZmlsZSkgdm9pZCB0aGlzLm1pZ3JhdGVMZWdhY3lGaWxlKGZpbGUsIHRydWUpO1xuICAgICAgICByZXR1cm4gYXZhaWxhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLWN1cnJlbnQtYXMtbWluZC1tYXBcIixcbiAgICAgIG5hbWU6IFwiXHU0RUU1XHU1M0VGXHU3RjE2XHU4RjkxXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU4OUM2XHU1NkZFXHU5MUNEXHU2NUIwXHU2MjUzXHU1RjAwXCIsXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IEJvb2xlYW4oZmlsZSAmJiB0aGlzLmlzTWluZE1hcEZpbGUoZmlsZSkpO1xuICAgICAgICBpZiAoIWNoZWNraW5nICYmIGF2YWlsYWJsZSAmJiBmaWxlKSB2b2lkIHRoaXMub3BlbkFzTWluZE1hcChmaWxlLCB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZiA/PyB1bmRlZmluZWQpO1xuICAgICAgICByZXR1cm4gYXZhaWxhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtbWVudVwiLCAobWVudTogTWVudSwgZmlsZSkgPT4ge1xuICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbVxuICAgICAgICAgIC5zZXRUaXRsZShcIlx1NjVCMFx1NUVGQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKVxuICAgICAgICAgIC5zZXRJY29uKFwiYnJhaW4tY2lyY3VpdFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5jcmVhdGVNaW5kTWFwKHsgZm9sZGVyOiBmaWxlLnBhdGggfSkpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuO1xuXG4gICAgICBpZiAodGhpcy5pc01pbmRNYXBGaWxlKGZpbGUpKSB7XG4gICAgICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbVxuICAgICAgICAgIC5zZXRUaXRsZShcIlx1NEVFNVx1NTNFRlx1N0YxNlx1OEY5MVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVx1NjI1M1x1NUYwMFwiKVxuICAgICAgICAgIC5zZXRJY29uKFwiYnJhaW4tY2lyY3VpdFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5vcGVuQXNNaW5kTWFwKGZpbGUpKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNMZWdhY3lNaW5kTWFwRmlsZShmaWxlKSkge1xuICAgICAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW1cbiAgICAgICAgICAuc2V0VGl0bGUoXCJcdThGNkNcdTYzNjJcdTRFM0FcdTY1QjBcdTc2ODQgLm1pbmRtYXAgXHU2NTg3XHU0RUY2XCIpXG4gICAgICAgICAgLnNldEljb24oXCJyZXBsYWNlXCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLm1pZ3JhdGVMZWdhY3lGaWxlKGZpbGUsIHRydWUpKSk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgLy8gRXhpc3RpbmcgdXNlcnMgbWF5IHN0aWxsIGhhdmUgdGhlIG9sZCBNYXJrZG93bi1iYWNrZWQgZmlsZXMuIFdoZW4gZW5hYmxlZCxcbiAgICAvLyBvcGVuaW5nIG9uZSBjcmVhdGVzL29wZW5zIGEgc2FmZSAubWluZG1hcCBjb3B5IGFuZCBsZWF2ZXMgdGhlIG9yaWdpbmFsIGludGFjdC5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsIChmaWxlKSA9PiB7XG4gICAgICBpZiAoIWZpbGUgfHwgIXRoaXMuc2V0dGluZ3MucmVkaXJlY3RMZWdhY3lGaWxlcyB8fCAhdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5sZWdhY3lNaWdyYXRpb25QYXRoID09PSBmaWxlLnBhdGgpIHJldHVybjtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHZvaWQgdGhpcy5taWdyYXRlTGVnYWN5RmlsZShmaWxlLCB0cnVlKSwgMCk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFwibWluZG1hcFwiLCAoc291cmNlLCBlbCwgY3R4KSA9PiB7XG4gICAgICByZW5kZXJTdGF0aWNTb3VyY2UoZWwsIHNvdXJjZSwgdGhpcy5nZXRTb3VyY2VUaXRsZShjdHgpLCBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSk7XG4gICAgfSk7XG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFwibWluZG1hcC1qc29uXCIsIChzb3VyY2UsIGVsLCBjdHgpID0+IHtcbiAgICAgIHJlbmRlclN0YXRpY1NvdXJjZShlbCwgc291cmNlLCB0aGlzLmdldFNvdXJjZVRpdGxlKGN0eCksIHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpKTtcbiAgICB9KTtcbiAgICAvLyBSZWFkLW9ubHkgY29tcGF0aWJpbGl0eSBmb3Igbm90ZXMgdGhhdCBhbHJlYWR5IGNvbnRhaW4gb2xkIGZlbmNlZCBibG9ja3MuXG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFwic21tXCIsIChzb3VyY2UsIGVsLCBjdHgpID0+IHtcbiAgICAgIHJlbmRlclN0YXRpY1NvdXJjZShlbCwgc291cmNlLCB0aGlzLmdldFNvdXJjZVRpdGxlKGN0eCksIHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpKTtcbiAgICB9KTtcbiAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Db2RlQmxvY2tQcm9jZXNzb3IoXCJzbW0tanNvblwiLCAoc291cmNlLCBlbCwgY3R4KSA9PiB7XG4gICAgICByZW5kZXJTdGF0aWNTb3VyY2UoZWwsIHNvdXJjZSwgdGhpcy5nZXRTb3VyY2VUaXRsZShjdHgpLCBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSk7XG4gICAgfSk7XG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duUG9zdFByb2Nlc3NvcigoZWxlbWVudCwgY29udGV4dCkgPT4gdm9pZCB0aGlzLnByb2Nlc3NNaW5kTWFwRW1iZWRzKGVsZW1lbnQsIGNvbnRleHQpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdGltZXIgb2YgdGhpcy5hdXRvVXBsb2FkVGltZXJzLnZhbHVlcygpKSB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aGlzLmF1dG9VcGxvYWRUaW1lcnMuY2xlYXIoKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKSBhcyBQYXJ0aWFsPE1pbmRNYXBTdHVkaW9TZXR0aW5ncz4gfCBudWxsO1xuICAgIC8vIE9uZS10aW1lIG1pZ3JhdGlvbiBhZnRlciB0aGUgcHVibGljIHJlbmFtZSBmcm9tIG1pbmRtYXAtY2FudmFzIHRvIG1pbmRtYXAtc3R1ZGlvLlxuICAgIGlmICghbG9hZGVkKSB7XG4gICAgICBjb25zdCBvbGREYXRhUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5hcHAudmF1bHQuY29uZmlnRGlyfS9wbHVnaW5zL21pbmRtYXAtY2FudmFzL2RhdGEuanNvbmApO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZXhpc3RzKG9sZERhdGFQYXRoKSkge1xuICAgICAgICAgIGxvYWRlZCA9IEpTT04ucGFyc2UoYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKG9sZERhdGFQYXRoKSkgYXMgUGFydGlhbDxNaW5kTWFwU3R1ZGlvU2V0dGluZ3M+O1xuICAgICAgICAgIGlmIChsb2FkZWQpIGF3YWl0IHRoaXMuc2F2ZURhdGEobG9hZGVkKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiTWluZE1hcCBTdHVkaW8gY291bGQgbm90IG1pZ3JhdGUgdGhlIG9sZCBzZXR0aW5ncyBmaWxlXCIsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmF3ID0gKGxvYWRlZCA/PyB7fSkgYXMgUGFydGlhbDxNaW5kTWFwU3R1ZGlvU2V0dGluZ3M+ICYgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgbGV0IGltYWdlSG9zdHM6IEltYWdlSG9zdENvbmZpZ1tdID0gQXJyYXkuaXNBcnJheShyYXcuaW1hZ2VIb3N0cylcbiAgICAgID8gcmF3LmltYWdlSG9zdHMuc2xpY2UoMCwgMjApLmZsYXRNYXAoKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgIGlmICghaXRlbSB8fCB0eXBlb2YgaXRlbSAhPT0gXCJvYmplY3RcIikgcmV0dXJuIFtdO1xuICAgICAgICBjb25zdCBjYW5kaWRhdGUgPSBpdGVtIGFzIFBhcnRpYWw8SW1hZ2VIb3N0Q29uZmlnPjtcbiAgICAgICAgY29uc3QgaG9zdCA9IGNyZWF0ZUltYWdlSG9zdENvbmZpZyhpbmRleCArIDEpO1xuICAgICAgICBob3N0LmlkID0gdHlwZW9mIGNhbmRpZGF0ZS5pZCA9PT0gXCJzdHJpbmdcIiAmJiBjYW5kaWRhdGUuaWQudHJpbSgpID8gY2FuZGlkYXRlLmlkLnRyaW0oKS5zbGljZSgwLCAxNjApIDogaG9zdC5pZDtcbiAgICAgICAgaG9zdC5uYW1lID0gdHlwZW9mIGNhbmRpZGF0ZS5uYW1lID09PSBcInN0cmluZ1wiICYmIGNhbmRpZGF0ZS5uYW1lLnRyaW0oKSA/IGNhbmRpZGF0ZS5uYW1lLnRyaW0oKS5zbGljZSgwLCAxMjApIDogaG9zdC5uYW1lO1xuICAgICAgICBob3N0LmVuYWJsZWQgPSBjYW5kaWRhdGUuZW5hYmxlZCAhPT0gZmFsc2U7XG4gICAgICAgIGhvc3QuZW5kcG9pbnQgPSB0eXBlb2YgY2FuZGlkYXRlLmVuZHBvaW50ID09PSBcInN0cmluZ1wiID8gY2FuZGlkYXRlLmVuZHBvaW50LnRyaW0oKS5zbGljZSgwLCA0MDAwKSA6IFwiXCI7XG4gICAgICAgIGhvc3QubWV0aG9kID0gY2FuZGlkYXRlLm1ldGhvZCA9PT0gXCJQVVRcIiA/IFwiUFVUXCIgOiBcIlBPU1RcIjtcbiAgICAgICAgaG9zdC5ib2R5TW9kZSA9IGNhbmRpZGF0ZS5ib2R5TW9kZSA9PT0gXCJyYXdcIiA/IFwicmF3XCIgOiBcIm11bHRpcGFydFwiO1xuICAgICAgICBob3N0LmZpZWxkTmFtZSA9IHR5cGVvZiBjYW5kaWRhdGUuZmllbGROYW1lID09PSBcInN0cmluZ1wiICYmIGNhbmRpZGF0ZS5maWVsZE5hbWUudHJpbSgpID8gY2FuZGlkYXRlLmZpZWxkTmFtZS50cmltKCkuc2xpY2UoMCwgMTIwKSA6IFwiZmlsZVwiO1xuICAgICAgICBob3N0LmhlYWRlcnMgPSB0eXBlb2YgY2FuZGlkYXRlLmhlYWRlcnMgPT09IFwic3RyaW5nXCIgPyBjYW5kaWRhdGUuaGVhZGVycy50cmltKCkuc2xpY2UoMCwgMjAwMDApIDogXCJcIjtcbiAgICAgICAgaG9zdC5yZXNwb25zZVBhdGggPSB0eXBlb2YgY2FuZGlkYXRlLnJlc3BvbnNlUGF0aCA9PT0gXCJzdHJpbmdcIiA/IGNhbmRpZGF0ZS5yZXNwb25zZVBhdGgudHJpbSgpLnNsaWNlKDAsIDUwMCkgOiBcImRhdGEudXJsXCI7XG4gICAgICAgIHJldHVybiBbaG9zdF07XG4gICAgICB9KVxuICAgICAgOiBbXTtcblxuICAgIC8vIE1pZ3JhdGUgdGhlIHNpbmdsZS1ob3N0IHNldHRpbmdzIHVzZWQgYnkgTWluZE1hcCBTdHVkaW8gMC45LnguXG4gICAgY29uc3QgbGVnYWN5RW5kcG9pbnQgPSB0eXBlb2YgcmF3LmltYWdlSG9zdEVuZHBvaW50ID09PSBcInN0cmluZ1wiID8gcmF3LmltYWdlSG9zdEVuZHBvaW50LnRyaW0oKSA6IFwiXCI7XG4gICAgaWYgKCFpbWFnZUhvc3RzLmxlbmd0aCAmJiBsZWdhY3lFbmRwb2ludCkge1xuICAgICAgY29uc3QgaG9zdCA9IGNyZWF0ZUltYWdlSG9zdENvbmZpZygxKTtcbiAgICAgIGhvc3QubmFtZSA9IFwiXHU1MzlGXHU1NkZFXHU1RThBXCI7XG4gICAgICBob3N0LmVuZHBvaW50ID0gbGVnYWN5RW5kcG9pbnQ7XG4gICAgICBob3N0Lm1ldGhvZCA9IHJhdy5pbWFnZUhvc3RNZXRob2QgPT09IFwiUFVUXCIgPyBcIlBVVFwiIDogXCJQT1NUXCI7XG4gICAgICBob3N0LmJvZHlNb2RlID0gcmF3LmltYWdlSG9zdEJvZHlNb2RlID09PSBcInJhd1wiID8gXCJyYXdcIiA6IFwibXVsdGlwYXJ0XCI7XG4gICAgICBob3N0LmZpZWxkTmFtZSA9IHR5cGVvZiByYXcuaW1hZ2VIb3N0RmllbGROYW1lID09PSBcInN0cmluZ1wiICYmIHJhdy5pbWFnZUhvc3RGaWVsZE5hbWUudHJpbSgpID8gcmF3LmltYWdlSG9zdEZpZWxkTmFtZS50cmltKCkgOiBcImZpbGVcIjtcbiAgICAgIGhvc3QuaGVhZGVycyA9IHR5cGVvZiByYXcuaW1hZ2VIb3N0SGVhZGVycyA9PT0gXCJzdHJpbmdcIiA/IHJhdy5pbWFnZUhvc3RIZWFkZXJzLnRyaW0oKSA6IFwiXCI7XG4gICAgICBob3N0LnJlc3BvbnNlUGF0aCA9IHR5cGVvZiByYXcuaW1hZ2VIb3N0UmVzcG9uc2VQYXRoID09PSBcInN0cmluZ1wiID8gcmF3LmltYWdlSG9zdFJlc3BvbnNlUGF0aC50cmltKCkgOiBcImRhdGEudXJsXCI7XG4gICAgICBpbWFnZUhvc3RzID0gW2hvc3RdO1xuICAgIH1cblxuICAgIGNvbnN0IGVuYWJsZWRJZHMgPSBuZXcgU2V0KGltYWdlSG9zdHMuZmlsdGVyKChob3N0KSA9PiBob3N0LmVuYWJsZWQpLm1hcCgoaG9zdCkgPT4gaG9zdC5pZCkpO1xuICAgIGNvbnN0IHNlbGVjdGVkSWRzID0gQXJyYXkuaXNBcnJheShyYXcuYXV0b1VwbG9hZEhvc3RJZHMpXG4gICAgICA/IHJhdy5hdXRvVXBsb2FkSG9zdElkcy5maWx0ZXIoKGlkKTogaWQgaXMgc3RyaW5nID0+IHR5cGVvZiBpZCA9PT0gXCJzdHJpbmdcIiAmJiBlbmFibGVkSWRzLmhhcyhpZCkpXG4gICAgICA6IFtdO1xuICAgIHRoaXMuc2V0dGluZ3MgPSB7XG4gICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgLi4ucmF3LFxuICAgICAgaW1hZ2VIb3N0cyxcbiAgICAgIGF1dG9VcGxvYWRFbmFibGVkOiByYXcuYXV0b1VwbG9hZEVuYWJsZWQgPT09IHRydWUsXG4gICAgICBhdXRvVXBsb2FkRGVsYXlTZWNvbmRzOiB0eXBlb2YgcmF3LmF1dG9VcGxvYWREZWxheVNlY29uZHMgPT09IFwibnVtYmVyXCJcbiAgICAgICAgPyBNYXRoLm1heCgwLCBNYXRoLm1pbigzMDAsIE1hdGgucm91bmQocmF3LmF1dG9VcGxvYWREZWxheVNlY29uZHMpKSlcbiAgICAgICAgOiBERUZBVUxUX1NFVFRJTkdTLmF1dG9VcGxvYWREZWxheVNlY29uZHMsXG4gICAgICBhdXRvVXBsb2FkSG9zdElkczogc2VsZWN0ZWRJZHMsXG4gICAgICBkZWxldGVMb2NhbEFmdGVyVXBsb2FkOiByYXcuZGVsZXRlTG9jYWxBZnRlclVwbG9hZCAhPT0gZmFsc2VcbiAgICB9IGFzIE1pbmRNYXBTdHVkaW9TZXR0aW5ncztcbiAgICBpZiAocmF3LmJhY2tncm91bmRQYXR0ZXJuID09PSB1bmRlZmluZWQgJiYgcmF3LnNob3dHcmlkID09PSBmYWxzZSkgdGhpcy5zZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybiA9IFwibm9uZVwiO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICByZWZyZXNoT3BlblZpZXdzKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTykpIHtcbiAgICAgIGlmIChsZWFmLnZpZXcgaW5zdGFuY2VvZiBNaW5kTWFwU3R1ZGlvVmlldykgbGVhZi52aWV3LnJlZnJlc2hBcHBlYXJhbmNlKCk7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlQ29uZmlndXJlZERvY3VtZW50KHRpdGxlOiBzdHJpbmcpOiBNaW5kTWFwRG9jdW1lbnQge1xuICAgIGNvbnN0IGRvY3VtZW50ID0gY3JlYXRlRGVmYXVsdERvY3VtZW50KHRpdGxlKTtcbiAgICBkb2N1bWVudC5sYXlvdXQgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQ7XG4gICAgZG9jdW1lbnQudGhlbWUgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRUaGVtZTtcbiAgICBkb2N1bWVudC5hcHBlYXJhbmNlID0gc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncyk7XG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbiAgYXN5bmMgZ2V0QXZhaWxhYmxlUGF0aChwcmVmZXJyZWRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKHByZWZlcnJlZFBhdGgpO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpKSByZXR1cm4gbm9ybWFsaXplZDtcbiAgICBjb25zdCBkb3QgPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBiYXNlID0gZG90ID4gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIikgPyBub3JtYWxpemVkLnNsaWNlKDAsIGRvdCkgOiBub3JtYWxpemVkO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGRvdCA+IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpID8gbm9ybWFsaXplZC5zbGljZShkb3QpIDogXCJcIjtcbiAgICBsZXQgaW5kZXggPSAyO1xuICAgIHdoaWxlICh0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYCR7YmFzZX0gJHtpbmRleH0ke2V4dGVuc2lvbn1gKSkgaW5kZXggKz0gMTtcbiAgICByZXR1cm4gYCR7YmFzZX0gJHtpbmRleH0ke2V4dGVuc2lvbn1gO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlTWluZE1hcChvcHRpb25zOiB7XG4gICAgaW5zZXJ0SW50b0N1cnJlbnQ/OiBib29sZWFuO1xuICAgIGZvbGRlcj86IHN0cmluZztcbiAgICBkb2N1bWVudD86IE1pbmRNYXBEb2N1bWVudDtcbiAgICB0aXRsZT86IHN0cmluZztcbiAgfSA9IHt9KTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGFjdGl2ZUJlZm9yZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgY29uc3QgZm9sZGVyID0gYXdhaXQgdGhpcy5yZXNvbHZlRm9sZGVyKG9wdGlvbnMuZm9sZGVyLCBhY3RpdmVCZWZvcmUpO1xuICAgIGNvbnN0IHRpdGxlID0gb3B0aW9ucy50aXRsZSA/PyB0aGlzLmJ1aWxkTmV3VGl0bGUoKTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IHRoaXMuc2FuaXRpemVGaWxlbmFtZSh0aXRsZSk7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMuZ2V0QXZhaWxhYmxlUGF0aChub3JtYWxpemVQYXRoKGAke2ZvbGRlciA/IGAke2ZvbGRlcn0vYCA6IFwiXCJ9JHtmaWxlbmFtZX0uJHtNSU5ETUFQX0VYVEVOU0lPTn1gKSk7XG4gICAgY29uc3QgZG9jdW1lbnQgPSBvcHRpb25zLmRvY3VtZW50ID8/IHRoaXMuY3JlYXRlQ29uZmlndXJlZERvY3VtZW50KHRpdGxlKTtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50KSk7XG5cbiAgICBpZiAob3B0aW9ucy5pbnNlcnRJbnRvQ3VycmVudCAmJiBhY3RpdmVCZWZvcmUgJiYgYWN0aXZlQmVmb3JlLmV4dGVuc2lvbiA9PT0gXCJtZFwiICYmIGFjdGl2ZUJlZm9yZS5wYXRoICE9PSBmaWxlLnBhdGgpIHtcbiAgICAgIGNvbnN0IGVtYmVkID0gYFxcblxcbiFbWyR7ZmlsZS5wYXRofV1dXFxuYDtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGFjdGl2ZUJlZm9yZSk7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoYWN0aXZlQmVmb3JlLCBgJHtjdXJyZW50LnRyaW1FbmQoKX0ke2VtYmVkfWApO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLm9wZW5Bc01pbmRNYXAoZmlsZSk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBvcGVuQXNNaW5kTWFwKGZpbGU6IFRGaWxlLCBwcmVmZXJyZWRMZWFmPzogV29ya3NwYWNlTGVhZiwgZm9jdXNOb2RlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsZWFmID0gcHJlZmVycmVkTGVhZiA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogVklFV19UWVBFX01JTkRNQVBfU1RVRElPLFxuICAgICAgc3RhdGU6IHsgZmlsZTogZmlsZS5wYXRoIH0sXG4gICAgICBhY3RpdmU6IHRydWVcbiAgICB9KTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgICBpZiAoZm9jdXNOb2RlSWQgJiYgbGVhZi52aWV3IGluc3RhbmNlb2YgTWluZE1hcFN0dWRpb1ZpZXcpIHtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IGxlYWYudmlldyBpbnN0YW5jZW9mIE1pbmRNYXBTdHVkaW9WaWV3ICYmIGxlYWYudmlldy5mb2N1c05vZGUoZm9jdXNOb2RlSWQpLCAzMCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgc2F2ZVBhc3RlZEltYWdlKGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZywgc291cmNlRmlsZTogVEZpbGUgfCBudWxsKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBcdTU2RkVcdTcyNDdcdThENDRcdTZFOTBcdTc2RUVcdTVGNTVcdTYzMDlcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTYyNDBcdTU3MjhcdTc2RUVcdTVGNTVcdTg5RTNcdTY3OTBcdUZGMENcdTgwMENcdTRFMERcdTY2MkZcdTYzMDlcdTRFRDNcdTVFOTNcdTY4MzlcdTc2RUVcdTVGNTVcdTg5RTNcdTY3OTBcdTMwMDJcbiAgICAvLyBcdTRGOEJcdTU5ODIgUHJvamVjdHMvUGxhbi5taW5kbWFwICsgTWluZE1hcCBBc3NldHMgPT5cbiAgICAvLyBQcm9qZWN0cy9NaW5kTWFwIEFzc2V0cy9QbGFuLTIwMjYwNzIwLTEyMzQ1Ni5wbmdcbiAgICBjb25zdCBzb3VyY2VGb2xkZXIgPSBzb3VyY2VGaWxlPy5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBjb25maWd1cmVkRm9sZGVyID0gbm9ybWFsaXplUGF0aCgodGhpcy5zZXR0aW5ncy5hc3NldEZvbGRlciB8fCBcIk1pbmRNYXAgQXNzZXRzXCIpLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpKTtcbiAgICBjb25zdCBmb2xkZXIgPSBub3JtYWxpemVQYXRoKFtzb3VyY2VGb2xkZXIsIGNvbmZpZ3VyZWRGb2xkZXJdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiL1wiKSk7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJQYXRoKGZvbGRlcik7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCB0d28gPSAodmFsdWU6IG51bWJlcik6IHN0cmluZyA9PiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBjb25zdCBzdGFtcCA9IGAke25vdy5nZXRGdWxsWWVhcigpfSR7dHdvKG5vdy5nZXRNb250aCgpICsgMSl9JHt0d28obm93LmdldERhdGUoKSl9LSR7dHdvKG5vdy5nZXRIb3VycygpKX0ke3R3byhub3cuZ2V0TWludXRlcygpKX0ke3R3byhub3cuZ2V0U2Vjb25kcygpKX1gO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IHN1Z2dlc3RlZE5hbWUuc3BsaXQoXCIuXCIpLmF0KC0xKT8ucmVwbGFjZSgvW15hLXowLTldL2dpLCBcIlwiKS50b0xvd2VyQ2FzZSgpIHx8IFwicG5nXCI7XG4gICAgY29uc3QgYmFzZSA9IHRoaXMuc2FuaXRpemVGaWxlbmFtZShzb3VyY2VGaWxlPy5iYXNlbmFtZSA/PyBcIm1pbmRtYXBcIik7XG4gICAgY29uc3QgcHJlZmVycmVkID0gbm9ybWFsaXplUGF0aChgJHtmb2xkZXJ9LyR7YmFzZX0tJHtzdGFtcH0uJHtleHRlbnNpb259YCk7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMuZ2V0QXZhaWxhYmxlUGF0aChwcmVmZXJyZWQpO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUJpbmFyeShwYXRoLCBhd2FpdCBibG9iLmFycmF5QnVmZmVyKCkpO1xuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgYXN5bmMgcmVhZEltYWdlU291cmNlKHNvdXJjZTogc3RyaW5nLCBzb3VyY2VGaWxlOiBURmlsZSB8IG51bGwpOiBQcm9taXNlPHsgYmxvYjogQmxvYjsgc3VnZ2VzdGVkTmFtZTogc3RyaW5nIH0gfCBudWxsPiB7XG4gICAgY29uc3QgcmF3ID0gc291cmNlLnRyaW0oKTtcbiAgICBpZiAoIXJhdyB8fCAvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KHJhdykgfHwgL15kYXRhOi9pLnRlc3QocmF3KSB8fCAvXmJsb2I6L2kudGVzdChyYXcpKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCB3aWtpTWF0Y2ggPSByYXcubWF0Y2goL14hP1xcW1xcWyhbXFxzXFxTXSs/KVxcXVxcXSQvKTtcbiAgICBjb25zdCB0YXJnZXQgPSAod2lraU1hdGNoPy5bMV0gPz8gcmF3KS5zcGxpdChcInxcIilbMF0/LnNwbGl0KFwiI1wiKVswXT8udHJpbSgpID8/IHJhdztcbiAgICBjb25zdCBkaXJlY3QgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aCh0YXJnZXQpKTtcbiAgICBjb25zdCBmaWxlID0gZGlyZWN0IGluc3RhbmNlb2YgVEZpbGUgPyBkaXJlY3QgOiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHRhcmdldCwgc291cmNlRmlsZT8ucGF0aCA/PyBcIlwiKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBiaW5hcnkgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkQmluYXJ5KGZpbGUpO1xuICAgIHJldHVybiB7IGJsb2I6IG5ldyBCbG9iKFtiaW5hcnldLCB7IHR5cGU6IHRoaXMubWltZUZyb21GaWxlbmFtZShmaWxlLm5hbWUpIH0pLCBzdWdnZXN0ZWROYW1lOiBmaWxlLm5hbWUgfTtcbiAgfVxuXG4gIGdldEltYWdlSG9zdENob2ljZXMoKTogSW1hZ2VIb3N0Q2hvaWNlW10ge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmltYWdlSG9zdHNcbiAgICAgIC5maWx0ZXIoKGhvc3QpID0+IGhvc3QuZW5hYmxlZCAmJiBCb29sZWFuKGhvc3QuZW5kcG9pbnQudHJpbSgpKSlcbiAgICAgIC5tYXAoKGhvc3QpID0+ICh7IGlkOiBob3N0LmlkLCBuYW1lOiBob3N0Lm5hbWUgfSkpO1xuICB9XG5cbiAgZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHMoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGVuYWJsZWQgPSBuZXcgU2V0KHRoaXMuZ2V0SW1hZ2VIb3N0Q2hvaWNlcygpLm1hcCgoaG9zdCkgPT4gaG9zdC5pZCkpO1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmF1dG9VcGxvYWRIb3N0SWRzLmZpbHRlcigoaWQpID0+IGVuYWJsZWQuaGFzKGlkKSk7XG4gIH1cblxuICBhc3luYyB1cGxvYWRJbWFnZVRvSG9zdHMoYmxvYjogQmxvYiwgc3VnZ2VzdGVkTmFtZTogc3RyaW5nLCBob3N0SWRzOiBzdHJpbmdbXSk6IFByb21pc2U8SW1hZ2VIb3N0VXBsb2FkQmF0Y2g+IHtcbiAgICBjb25zdCByZXF1ZXN0ZWQgPSBBcnJheS5mcm9tKG5ldyBTZXQoaG9zdElkcykpO1xuICAgIGNvbnN0IGhvc3RzID0gcmVxdWVzdGVkXG4gICAgICAubWFwKChpZCkgPT4gdGhpcy5zZXR0aW5ncy5pbWFnZUhvc3RzLmZpbmQoKGhvc3QpID0+IGhvc3QuaWQgPT09IGlkKSlcbiAgICAgIC5maWx0ZXIoKGhvc3QpOiBob3N0IGlzIEltYWdlSG9zdENvbmZpZyA9PiBCb29sZWFuKGhvc3Q/LmVuYWJsZWQgJiYgaG9zdC5lbmRwb2ludC50cmltKCkpKTtcbiAgICBpZiAoIWhvc3RzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiXHU2Q0ExXHU2NzA5XHU5MDA5XHU2MkU5XHU1M0VGXHU3NTI4XHU1NkZFXHU1RThBXCIpO1xuICAgIGNvbnN0IHNldHRsZWQgPSBhd2FpdCBQcm9taXNlLmFsbChob3N0cy5tYXAoYXN5bmMgKGhvc3QpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IHRoaXMudXBsb2FkSW1hZ2VUb0hvc3RDb25maWcoaG9zdCwgYmxvYiwgc3VnZ2VzdGVkTmFtZSk7XG4gICAgICAgIHJldHVybiB7IG9rOiB0cnVlIGFzIGNvbnN0LCB2YWx1ZTogeyBob3N0SWQ6IGhvc3QuaWQsIGhvc3ROYW1lOiBob3N0Lm5hbWUsIHVybCB9IH07XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG9rOiBmYWxzZSBhcyBjb25zdCxcbiAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgaG9zdElkOiBob3N0LmlkLFxuICAgICAgICAgICAgaG9zdE5hbWU6IGhvc3QubmFtZSxcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSkpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzZXM6IHNldHRsZWQuZmlsdGVyKChpdGVtKTogaXRlbSBpcyB7IG9rOiB0cnVlOyB2YWx1ZTogSW1hZ2VIb3N0VXBsb2FkU3VjY2VzcyB9ID0+IGl0ZW0ub2spLm1hcCgoaXRlbSkgPT4gaXRlbS52YWx1ZSksXG4gICAgICBmYWlsdXJlczogc2V0dGxlZC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIHsgb2s6IGZhbHNlOyB2YWx1ZTogeyBob3N0SWQ6IHN0cmluZzsgaG9zdE5hbWU6IHN0cmluZzsgZXJyb3I6IHN0cmluZyB9IH0gPT4gIWl0ZW0ub2spLm1hcCgoaXRlbSkgPT4gaXRlbS52YWx1ZSlcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgdGVzdEltYWdlSG9zdChob3N0SWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGhvc3QgPSB0aGlzLnNldHRpbmdzLmltYWdlSG9zdHMuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gaG9zdElkKTtcbiAgICBpZiAoIWhvc3QpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTYyN0VcdTRFMERcdTUyMzBcdThCRTVcdTU2RkVcdTVFOEFcdTkxNERcdTdGNkVcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghaG9zdC5lbmRwb2ludC50cmltKCkpIHtcbiAgICAgIG5ldyBOb3RpY2UoYFx1OEJGN1x1NTE0OFx1NTg2Qlx1NTE5OSAke2hvc3QubmFtZX0gXHU3Njg0XHU0RTBBXHU0RjIwIEFQSWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBBIHJlYWwgMVx1MDBENzEgdHJhbnNwYXJlbnQgUE5HIHRlc3RzIGF1dGhlbnRpY2F0aW9uLCByZXF1ZXN0IGZvcm1hdCBhbmQgcmVzcG9uc2UgcGFyc2luZy5cbiAgICBjb25zdCBwbmcgPSBuZXcgVWludDhBcnJheShbXG4gICAgICAxMzcsIDgwLCA3OCwgNzEsIDEzLCAxMCwgMjYsIDEwLCAwLCAwLCAwLCAxMywgNzMsIDcyLCA2OCwgODIsXG4gICAgICAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxLCA4LCA2LCAwLCAwLCAwLCAzMSwgMjEsIDE5NiwgMTM3LFxuICAgICAgMCwgMCwgMCwgMTMsIDczLCA2OCwgNjUsIDg0LCA4LCAyMTUsIDk5LCAyNDgsIDIwNywgMTkyLCAyNDAsIDMxLFxuICAgICAgMCwgNSwgMCwgMSwgMjU1LCAxMzcsIDE1MywgNjEsIDI5LCAwLCAwLCAwLCAwLCA3MywgNjksIDc4LCA2OCxcbiAgICAgIDE3NCwgNjYsIDk2LCAxMzBcbiAgICBdKTtcbiAgICBjb25zdCBzdGFydGVkID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVybCA9IGF3YWl0IHRoaXMudXBsb2FkSW1hZ2VUb0hvc3RDb25maWcoaG9zdCwgbmV3IEJsb2IoW3BuZ10sIHsgdHlwZTogXCJpbWFnZS9wbmdcIiB9KSwgXCJtaW5kbWFwLXN0dWRpby1hcGktdGVzdC5wbmdcIik7XG4gICAgICBjb25zdCBlbGFwc2VkID0gTWF0aC5tYXgoMSwgTWF0aC5yb3VuZChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0ZWQpKTtcbiAgICAgIG5ldyBOb3RpY2UoYCR7aG9zdC5uYW1lfSBcdThGREVcdTYzQTVcdTYyMTBcdTUyOUZcdUZGMDgke2VsYXBzZWR9IG1zXHVGRjA5XFxuJHt1cmx9YCwgODAwMCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBpbWFnZSBob3N0IGNvbm5lY3Rpdml0eSB0ZXN0IGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKGAke2hvc3QubmFtZX0gXHU4RkRFXHU2M0E1XHU1OTMxXHU4RDI1XHVGRjFBJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCwgODAwMCk7XG4gICAgfVxuICB9XG5cbiAgc2NoZWR1bGVBdXRvVXBsb2FkKGZpbGU6IFRGaWxlIHwgbnVsbCwgbm9kZUlkOiBzdHJpbmcsIGJsb2NrSWQ6IHN0cmluZywgbG9jYWxQYXRoOiBzdHJpbmcsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghZmlsZSB8fCAhdGhpcy5zZXR0aW5ncy5hdXRvVXBsb2FkRW5hYmxlZCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGhvc3RJZHMgPSB0aGlzLmdldERlZmF1bHRVcGxvYWRIb3N0SWRzKCk7XG4gICAgaWYgKCFob3N0SWRzLmxlbmd0aCkge1xuICAgICAgbmV3IE5vdGljZShcIlx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NUI1OFx1NTIzMFx1NjcyQ1x1NTczMFx1RkYxQlx1ODFFQVx1NTJBOFx1NEUwQVx1NEYyMFx1NjcyQVx1OTAwOVx1NjJFOVx1NTNFRlx1NzUyOFx1NTZGRVx1NUU4QVwiLCA1MDAwKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3Qga2V5ID0gYCR7ZmlsZS5wYXRofTo6JHtub2RlSWR9Ojoke2Jsb2NrSWR9YDtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXV0b1VwbG9hZFRpbWVycy5nZXQoa2V5KTtcbiAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkgd2luZG93LmNsZWFyVGltZW91dChleGlzdGluZyk7XG4gICAgY29uc3QgZGVsYXkgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigzMDAsIHRoaXMuc2V0dGluZ3MuYXV0b1VwbG9hZERlbGF5U2Vjb25kcykpICogMTAwMDtcbiAgICBjb25zdCB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuYXV0b1VwbG9hZFRpbWVycy5kZWxldGUoa2V5KTtcbiAgICAgIHZvaWQgdGhpcy5ydW5BdXRvVXBsb2FkVGFzayhmaWxlLnBhdGgsIG5vZGVJZCwgYmxvY2tJZCwgbG9jYWxQYXRoLCBzdWdnZXN0ZWROYW1lLCBob3N0SWRzKTtcbiAgICB9LCBkZWxheSk7XG4gICAgdGhpcy5hdXRvVXBsb2FkVGltZXJzLnNldChrZXksIHRpbWVyKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQXV0b1VwbG9hZFRhc2soXG4gICAgbWluZE1hcFBhdGg6IHN0cmluZyxcbiAgICBub2RlSWQ6IHN0cmluZyxcbiAgICBibG9ja0lkOiBzdHJpbmcsXG4gICAgbG9jYWxQYXRoOiBzdHJpbmcsXG4gICAgc3VnZ2VzdGVkTmFtZTogc3RyaW5nLFxuICAgIGhvc3RJZHM6IHN0cmluZ1tdXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmZsdXNoT3BlblZpZXcobWluZE1hcFBhdGgpO1xuICAgICAgY29uc3QgbWFwRmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtaW5kTWFwUGF0aCk7XG4gICAgICBjb25zdCBsb2NhbEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChsb2NhbFBhdGgpKTtcbiAgICAgIGlmICghKG1hcEZpbGUgaW5zdGFuY2VvZiBURmlsZSkgfHwgIShsb2NhbEZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybjtcbiAgICAgIGNvbnN0IGRvY3VtZW50ID0gcGFyc2VEb2N1bWVudChhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKG1hcEZpbGUpLCBtYXBGaWxlLmJhc2VuYW1lKTtcbiAgICAgIGNvbnN0IG5vZGUgPSBmaW5kTm9kZShkb2N1bWVudC5yb290LCBub2RlSWQpO1xuICAgICAgY29uc3QgYmxvY2sgPSBub2RlPy5jb250ZW50Py5maW5kKChpdGVtKTogaXRlbSBpcyBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2sgPT4gaXRlbS50eXBlID09PSBcImltYWdlXCIgJiYgaXRlbS5pZCA9PT0gYmxvY2tJZCk7XG4gICAgICBpZiAoIW5vZGUgfHwgIWJsb2NrIHx8IChibG9jay5zb3VyY2UgIT09IGxvY2FsUGF0aCAmJiBibG9jay5sb2NhbFNvdXJjZSAhPT0gbG9jYWxQYXRoKSkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBiaW5hcnkgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkQmluYXJ5KGxvY2FsRmlsZSk7XG4gICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2JpbmFyeV0sIHsgdHlwZTogdGhpcy5taW1lRnJvbUZpbGVuYW1lKGxvY2FsRmlsZS5uYW1lKSB9KTtcbiAgICAgIGNvbnN0IGJhdGNoID0gYXdhaXQgdGhpcy51cGxvYWRJbWFnZVRvSG9zdHMoYmxvYiwgc3VnZ2VzdGVkTmFtZSB8fCBsb2NhbEZpbGUubmFtZSwgaG9zdElkcyk7XG4gICAgICBjb25zdCB1cGxvYWRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgY29uc3QgcmVtb3RlQnlIb3N0ID0gbmV3IE1hcCgoYmxvY2sucmVtb3RlU291cmNlcyA/PyBbXSkubWFwKChpdGVtKSA9PiBbaXRlbS5ob3N0SWQsIGl0ZW1dKSk7XG4gICAgICBmb3IgKGNvbnN0IHN1Y2Nlc3Mgb2YgYmF0Y2guc3VjY2Vzc2VzKSB7XG4gICAgICAgIHJlbW90ZUJ5SG9zdC5zZXQoc3VjY2Vzcy5ob3N0SWQsIHsgLi4uc3VjY2VzcywgdXBsb2FkZWRBdCB9KTtcbiAgICAgIH1cbiAgICAgIGJsb2NrLnJlbW90ZVNvdXJjZXMgPSBBcnJheS5mcm9tKHJlbW90ZUJ5SG9zdC52YWx1ZXMoKSk7XG4gICAgICBibG9jay5sb2NhbFNvdXJjZSA9IGxvY2FsUGF0aDtcblxuICAgICAgY29uc3QgYWxsU3VjY2VlZGVkID0gYmF0Y2guZmFpbHVyZXMubGVuZ3RoID09PSAwICYmIGJhdGNoLnN1Y2Nlc3Nlcy5sZW5ndGggPT09IGhvc3RJZHMubGVuZ3RoO1xuICAgICAgaWYgKGFsbFN1Y2NlZWRlZCAmJiBiYXRjaC5zdWNjZXNzZXNbMF0pIGJsb2NrLnNvdXJjZSA9IGJhdGNoLnN1Y2Nlc3Nlc1swXS51cmw7XG4gICAgICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyhub2RlKTtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShtYXBGaWxlLCBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCkpO1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoT3Blbk1pbmRNYXAobWFwRmlsZSwgZG9jdW1lbnQpO1xuXG4gICAgICBsZXQgZGVsZXRlZCA9IGZhbHNlO1xuICAgICAgaWYgKGFsbFN1Y2NlZWRlZCAmJiB0aGlzLnNldHRpbmdzLmRlbGV0ZUxvY2FsQWZ0ZXJVcGxvYWQpIHtcbiAgICAgICAgZGVsZXRlZCA9IGF3YWl0IHRoaXMuZGVsZXRlTG9jYWxBc3NldElmU2FmZShsb2NhbFBhdGgsIG1pbmRNYXBQYXRoLCBibG9ja0lkKTtcbiAgICAgICAgaWYgKGRlbGV0ZWQpIHtcbiAgICAgICAgICBibG9jay5sb2NhbFNvdXJjZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkobWFwRmlsZSwgc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2hPcGVuTWluZE1hcChtYXBGaWxlLCBkb2N1bWVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGFsbFN1Y2NlZWRlZCkge1xuICAgICAgICBjb25zdCB0YXJnZXRzID0gYmF0Y2guc3VjY2Vzc2VzLm1hcCgoaXRlbSkgPT4gaXRlbS5ob3N0TmFtZSkuam9pbihcIlx1MzAwMVwiKTtcbiAgICAgICAgY29uc3Qgc3VmZml4ID0gdGhpcy5zZXR0aW5ncy5kZWxldGVMb2NhbEFmdGVyVXBsb2FkXG4gICAgICAgICAgPyBkZWxldGVkID8gXCJcdUZGMENcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTVERjJcdTVCODlcdTUxNjhcdTUyMjBcdTk2NjRcIiA6IFwiXHVGRjBDXHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3XHU1NkUwXHU0RUNEXHU4OEFCXHU1RjE1XHU3NTI4XHU2MjE2XHU1MjIwXHU5NjY0XHU1OTMxXHU4RDI1XHU4MDBDXHU0RkREXHU3NTU5XCJcbiAgICAgICAgICA6IFwiXHVGRjBDXHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU3NTU5XCI7XG4gICAgICAgIG5ldyBOb3RpY2UoYFx1NTZGRVx1NzI0N1x1NURGMlx1NEUwQVx1NEYyMFx1NTIzMCAke3RhcmdldHN9JHtzdWZmaXh9YCwgNzAwMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBvayA9IGJhdGNoLnN1Y2Nlc3Nlcy5tYXAoKGl0ZW0pID0+IGl0ZW0uaG9zdE5hbWUpLmpvaW4oXCJcdTMwMDFcIikgfHwgXCJcdTY1RTBcIjtcbiAgICAgICAgY29uc3QgZmFpbGVkID0gYmF0Y2guZmFpbHVyZXMubWFwKChpdGVtKSA9PiBgJHtpdGVtLmhvc3ROYW1lfVx1RkYxQSR7aXRlbS5lcnJvcn1gKS5qb2luKFwiXHVGRjFCXCIpO1xuICAgICAgICBuZXcgTm90aWNlKGBcdTU2RkVcdTcyNDdcdTRFQzVcdTkwRThcdTUyMDZcdTRFMEFcdTRGMjBcdTYyMTBcdTUyOUZcdTMwMDJcdTYyMTBcdTUyOUZcdUZGMUEke29rfVx1RkYxQlx1NTkzMVx1OEQyNVx1RkYxQSR7ZmFpbGVkfVx1MzAwMlx1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NzU1OVx1MzAwMmAsIDkwMDApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gYXV0b21hdGljIGltYWdlIHVwbG9hZCBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShgXHU1NkZFXHU3MjQ3XHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU1OTMxXHU4RDI1XHVGRjBDXHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU3NTU5XHVGRjFBJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCwgODAwMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB1cGxvYWRJbWFnZVRvSG9zdENvbmZpZyhob3N0OiBJbWFnZUhvc3RDb25maWcsIGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZW5kcG9pbnQgPSBob3N0LmVuZHBvaW50LnRyaW0oKTtcbiAgICBpZiAoIWVuZHBvaW50KSB0aHJvdyBuZXcgRXJyb3IoXCJcdTRFMEFcdTRGMjAgQVBJIFx1NEUzQVx1N0E3QVwiKTtcbiAgICBsZXQgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGlmIChob3N0LmhlYWRlcnMudHJpbSgpKSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGhvc3QuaGVhZGVycykgYXMgdW5rbm93bjtcbiAgICAgIGlmICghcGFyc2VkIHx8IHR5cGVvZiBwYXJzZWQgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheShwYXJzZWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJcdThCRjdcdTZDNDJcdTU5MzQgSlNPTiBcdTVGQzVcdTk4N0JcdTY2MkZcdTVCRjlcdThDNjFcIik7XG4gICAgICBoZWFkZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHBhcnNlZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikubWFwKChba2V5LCB2YWx1ZV0pID0+IFtrZXksIFN0cmluZyh2YWx1ZSldKSk7XG4gICAgfVxuICAgIGNvbnN0IGZpbGVuYW1lID0gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHN1Z2dlc3RlZE5hbWUgfHwgXCJtaW5kbWFwLWltYWdlLnBuZ1wiKTtcbiAgICBjb25zdCBtaW1lID0gYmxvYi50eXBlIHx8IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI7XG4gICAgbGV0IGJvZHk6IEFycmF5QnVmZmVyO1xuICAgIGxldCBjb250ZW50VHlwZSA9IG1pbWU7XG4gICAgaWYgKGhvc3QuYm9keU1vZGUgPT09IFwibXVsdGlwYXJ0XCIpIHtcbiAgICAgIGNvbnN0IGJvdW5kYXJ5ID0gYC0tLS1NaW5kTWFwU3R1ZGlvJHtEYXRlLm5vdygpLnRvU3RyaW5nKDE2KX0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIpfWA7XG4gICAgICBjb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgICBjb25zdCBmaWVsZE5hbWUgPSAoaG9zdC5maWVsZE5hbWUgfHwgXCJmaWxlXCIpLnJlcGxhY2VBbGwoJ1wiJywgXCJcIik7XG4gICAgICBjb25zdCBzYWZlRmlsZW5hbWUgPSBmaWxlbmFtZS5yZXBsYWNlQWxsKCdcIicsIFwiXCIpO1xuICAgICAgY29uc3QgaGVhZCA9IGVuY29kZXIuZW5jb2RlKGAtLSR7Ym91bmRhcnl9XFxyXFxuQ29udGVudC1EaXNwb3NpdGlvbjogZm9ybS1kYXRhOyBuYW1lPVwiJHtmaWVsZE5hbWV9XCI7IGZpbGVuYW1lPVwiJHtzYWZlRmlsZW5hbWV9XCJcXHJcXG5Db250ZW50LVR5cGU6ICR7bWltZX1cXHJcXG5cXHJcXG5gKTtcbiAgICAgIGNvbnN0IGZpbGUgPSBuZXcgVWludDhBcnJheShhd2FpdCBibG9iLmFycmF5QnVmZmVyKCkpO1xuICAgICAgY29uc3QgdGFpbCA9IGVuY29kZXIuZW5jb2RlKGBcXHJcXG4tLSR7Ym91bmRhcnl9LS1cXHJcXG5gKTtcbiAgICAgIGNvbnN0IGNvbWJpbmVkID0gbmV3IFVpbnQ4QXJyYXkoaGVhZC5sZW5ndGggKyBmaWxlLmxlbmd0aCArIHRhaWwubGVuZ3RoKTtcbiAgICAgIGNvbWJpbmVkLnNldChoZWFkLCAwKTsgY29tYmluZWQuc2V0KGZpbGUsIGhlYWQubGVuZ3RoKTsgY29tYmluZWQuc2V0KHRhaWwsIGhlYWQubGVuZ3RoICsgZmlsZS5sZW5ndGgpO1xuICAgICAgYm9keSA9IGNvbWJpbmVkLmJ1ZmZlcjtcbiAgICAgIGNvbnRlbnRUeXBlID0gYG11bHRpcGFydC9mb3JtLWRhdGE7IGJvdW5kYXJ5PSR7Ym91bmRhcnl9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgYm9keSA9IGF3YWl0IGJsb2IuYXJyYXlCdWZmZXIoKTtcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgIHVybDogZW5kcG9pbnQsXG4gICAgICBtZXRob2Q6IGhvc3QubWV0aG9kLFxuICAgICAgY29udGVudFR5cGUsXG4gICAgICBoZWFkZXJzLFxuICAgICAgYm9keSxcbiAgICAgIHRocm93OiB0cnVlXG4gICAgfSk7XG4gICAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gICAgdHJ5IHsgcGF5bG9hZCA9IHJlc3BvbnNlLmpzb247IH0gY2F0Y2ggeyBwYXlsb2FkID0gdW5kZWZpbmVkOyB9XG4gICAgaWYgKCFwYXlsb2FkICYmIHJlc3BvbnNlLnRleHQpIHtcbiAgICAgIHRyeSB7IHBheWxvYWQgPSBKU09OLnBhcnNlKHJlc3BvbnNlLnRleHQpOyB9IGNhdGNoIHsgcGF5bG9hZCA9IHJlc3BvbnNlLnRleHQ7IH1cbiAgICB9XG4gICAgY29uc3QgZ2V0UGF0aCA9ICh2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdW5rbm93biA9PiBwYXRoLnNwbGl0KFwiLlwiKS5maWx0ZXIoQm9vbGVhbikucmVkdWNlPHVua25vd24+KChjdXJyZW50LCBrZXkpID0+IGN1cnJlbnQgJiYgdHlwZW9mIGN1cnJlbnQgPT09IFwib2JqZWN0XCIgPyAoY3VycmVudCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba2V5XSA6IHVuZGVmaW5lZCwgdmFsdWUpO1xuICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSBbaG9zdC5yZXNwb25zZVBhdGgudHJpbSgpLCBcImRhdGEudXJsXCIsIFwidXJsXCIsIFwicmVzdWx0LnVybFwiLCBcInJlc3VsdC5pbWFnZVwiLCBcImltYWdlLnVybFwiLCBcInNyY1wiXS5maWx0ZXIoQm9vbGVhbik7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0UGF0aChwYXlsb2FkLCBwYXRoKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgL15odHRwcz86XFwvXFwvL2kudGVzdCh2YWx1ZS50cmltKCkpKSByZXR1cm4gdmFsdWUudHJpbSgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gcGF5bG9hZC5tYXRjaCgvaHR0cHM/OlxcL1xcL1teXFxzXCInPD5dKy9pKTtcbiAgICAgIGlmIChtYXRjaD8uWzBdKSByZXR1cm4gbWF0Y2hbMF07XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIlx1OEZENFx1NTZERVx1N0VEM1x1Njc5Q1x1NEUyRFx1NkNBMVx1NjcwOVx1NjI3RVx1NTIzMFx1NTZGRVx1NzI0N1x1N0Y1MVx1NTc0MFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmx1c2hPcGVuVmlldyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8pKSB7XG4gICAgICBpZiAobGVhZi52aWV3IGluc3RhbmNlb2YgTWluZE1hcFN0dWRpb1ZpZXcgJiYgbGVhZi52aWV3LmZpbGU/LnBhdGggPT09IHBhdGgpIGF3YWl0IGxlYWYudmlldy5zYXZlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZWZyZXNoT3Blbk1pbmRNYXAoZmlsZTogVEZpbGUsIGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzb3VyY2UgPSBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgZm9yIChjb25zdCBsZWFmIG9mIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX01JTkRNQVBfU1RVRElPKSkge1xuICAgICAgaWYgKGxlYWYudmlldyBpbnN0YW5jZW9mIE1pbmRNYXBTdHVkaW9WaWV3ICYmIGxlYWYudmlldy5maWxlPy5wYXRoID09PSBmaWxlLnBhdGgpIGxlYWYudmlldy5zZXRWaWV3RGF0YShzb3VyY2UsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRlbGV0ZUxvY2FsQXNzZXRJZlNhZmUobG9jYWxQYXRoOiBzdHJpbmcsIGN1cnJlbnRNaW5kTWFwUGF0aDogc3RyaW5nLCBibG9ja0lkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChsb2NhbFBhdGgpO1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnRNaW5kTWFwUGF0aCk7XG4gICAgaWYgKGN1cnJlbnQgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgY29uc3QgZG9jID0gcGFyc2VEb2N1bWVudChhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGN1cnJlbnQpLCBjdXJyZW50LmJhc2VuYW1lKTtcbiAgICAgIGNvbnN0IHN0aWxsVXNlZCA9IGZsYXR0ZW5Ob2Rlcyhkb2Mucm9vdCkuc29tZSgobm9kZSkgPT4gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSkuc29tZSgoYmxvY2spID0+XG4gICAgICAgIGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIiAmJiBibG9jay5pZCAhPT0gYmxvY2tJZCAmJiAoYmxvY2suc291cmNlID09PSBub3JtYWxpemVkIHx8IGJsb2NrLmxvY2FsU291cmNlID09PSBub3JtYWxpemVkKSkpO1xuICAgICAgaWYgKHN0aWxsVXNlZCkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgdGhpcy5hcHAudmF1bHQuZ2V0RmlsZXMoKSkge1xuICAgICAgaWYgKGZpbGUucGF0aCA9PT0gY3VycmVudE1pbmRNYXBQYXRoIHx8IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgIT09IE1JTkRNQVBfRVhURU5TSU9OKSBjb250aW51ZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jYWNoZWRSZWFkKGZpbGUpO1xuICAgICAgICBpZiAodGV4dC5pbmNsdWRlcyhub3JtYWxpemVkKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIElnbm9yZSBhbiB1bnJlYWRhYmxlIHVucmVsYXRlZCBtYXAgYW5kIGtlZXAgY2hlY2tpbmcgb3RoZXIgZmlsZXMuXG4gICAgICB9XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUodGFyZ2V0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJNaW5kTWFwIFN0dWRpbyBjb3VsZCBub3QgZGVsZXRlIHVwbG9hZGVkIGxvY2FsIGltYWdlXCIsIGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1pbWVGcm9tRmlsZW5hbWUoZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZmlsZW5hbWUuc3BsaXQoXCIuXCIpLmF0KC0xKT8udG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gKHsgcG5nOiBcImltYWdlL3BuZ1wiLCBqcGc6IFwiaW1hZ2UvanBlZ1wiLCBqcGVnOiBcImltYWdlL2pwZWdcIiwgZ2lmOiBcImltYWdlL2dpZlwiLCB3ZWJwOiBcImltYWdlL3dlYnBcIiwgc3ZnOiBcImltYWdlL3N2Zyt4bWxcIiwgYm1wOiBcImltYWdlL2JtcFwiLCBhdmlmOiBcImltYWdlL2F2aWZcIiB9IGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pW2V4dGVuc2lvbiA/PyBcIlwiXSA/PyBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3VibWFwRmlsZShwYXJlbnRGaWxlOiBURmlsZSwgbm9kZTogTWluZE1hcE5vZGUpOiBQcm9taXNlPE1pbmRNYXBTdWJtYXA+IHtcbiAgICBjb25zdCB0aXRsZSA9IChub2RlUGxhaW5UZXh0KG5vZGUpIHx8IFwiXHU1QjUwXHU1QkZDXHU1NkZFXCIpLnRyaW0oKTtcbiAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuY3JlYXRlQ29uZmlndXJlZERvY3VtZW50KHRpdGxlKTtcbiAgICBkb2N1bWVudC5yb290LmNvbnRlbnQgPSBbeyBpZDogZG9jdW1lbnQucm9vdC5pZCArIFwiX3RpdGxlXCIsIHR5cGU6IFwidGV4dFwiLCB0ZXh0OiB0aXRsZSB9XTtcbiAgICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyhkb2N1bWVudC5yb290KTtcbiAgICBkb2N1bWVudC5yb290LmxpbmsgPSBgW1ske3BhcmVudEZpbGUucGF0aH1dXWA7XG4gICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZTtcbiAgICBkb2N1bWVudC5uYXZpZ2F0aW9uID0ge1xuICAgICAgcGFyZW50UGF0aDogcGFyZW50RmlsZS5wYXRoLFxuICAgICAgcGFyZW50Tm9kZUlkOiBub2RlLmlkLFxuICAgICAgcGFyZW50VGl0bGU6IHBhcmVudEZpbGUuYmFzZW5hbWUsXG4gICAgICBwYXJlbnROb2RlVGV4dDogbm9kZVBsYWluVGV4dChub2RlKSB8fCB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgLy8gXHU1QjUwXHU1QkZDXHU1NkZFXHU0RTBEXHU1MThEXHU0RTBFXHU3MjM2XHU2NTg3XHU0RUY2XHU1RTczXHU5NEZBXHUzMDAyXHU3NkVFXHU1RjU1XHU3RUQzXHU2Nzg0XHU1NkZBXHU1QjlBXHU0RTNBXHVGRjFBXG4gICAgLy8gXHU3MjM2XHU2NTg3XHU0RUY2XHU2MjQwXHU1NzI4XHU3NkVFXHU1RjU1IC8gXHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5IC8gXHU3MjM2XHU1QkZDXHU1NkZFXHU2NTg3XHU0RUY2XHU1NDBEIC8gXHU1QjUwXHU1QkZDXHU1NkZFLm1pbmRtYXBcbiAgICBjb25zdCBwYXJlbnRGb2xkZXIgPSBwYXJlbnRGaWxlLnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgIGNvbnN0IGNvbmZpZ3VyZWRBc3NldHMgPSBub3JtYWxpemVQYXRoKHRoaXMuc2V0dGluZ3MuYXNzZXRGb2xkZXIgfHwgXCJNaW5kTWFwIEFzc2V0c1wiKTtcbiAgICBjb25zdCBwYXJlbnRNYXBGb2xkZXIgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUocGFyZW50RmlsZS5iYXNlbmFtZSk7XG4gICAgY29uc3Qgc3VibWFwRm9sZGVyID0gbm9ybWFsaXplUGF0aChbcGFyZW50Rm9sZGVyLCBjb25maWd1cmVkQXNzZXRzLCBwYXJlbnRNYXBGb2xkZXJdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiL1wiKSk7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJQYXRoKHN1Ym1hcEZvbGRlcik7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMuZ2V0QXZhaWxhYmxlUGF0aChub3JtYWxpemVQYXRoKGAke3N1Ym1hcEZvbGRlcn0vJHt0aGlzLnNhbml0aXplRmlsZW5hbWUodGl0bGUpfS4ke01JTkRNQVBfRVhURU5TSU9OfWApKTtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50KSk7XG4gICAgcmV0dXJuIHsgcGF0aDogZmlsZS5wYXRoLCB0aXRsZTogZmlsZS5iYXNlbmFtZSB9O1xuICB9XG5cbiAgYXN5bmMgb3Blbk1pbmRNYXBQYXRoKHBhdGg6IHN0cmluZywgc291cmNlUGF0aCA9IFwiXCIsIHByZWZlcnJlZExlYWY/OiBXb3Jrc3BhY2VMZWFmLCBmb2N1c05vZGVJZD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKHBhdGgucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpKTtcbiAgICBjb25zdCBkaXJlY3QgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBkaXJlY3QgaW5zdGFuY2VvZiBURmlsZSA/IGRpcmVjdCA6IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QocGF0aCwgc291cmNlUGF0aCk7XG4gICAgaWYgKCEocmVzb2x2ZWQgaW5zdGFuY2VvZiBURmlsZSkgfHwgIXRoaXMuaXNNaW5kTWFwRmlsZShyZXNvbHZlZCkpIHtcbiAgICAgIG5ldyBOb3RpY2UoYFx1NjI3RVx1NEUwRFx1NTIzMFx1NUI1MFx1NUJGQ1x1NTZGRVx1RkYxQSR7cGF0aH1gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5vcGVuQXNNaW5kTWFwKHJlc29sdmVkLCBwcmVmZXJyZWRMZWFmLCBmb2N1c05vZGVJZCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVuc3VyZUZvbGRlclBhdGgoZm9sZGVyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChmb2xkZXIpO1xuICAgIGlmICghbm9ybWFsaXplZCB8fCB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCkgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm47XG4gICAgY29uc3QgcGFydHMgPSBub3JtYWxpemVkLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgbGV0IGN1cnJlbnQgPSBcIlwiO1xuICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgY3VycmVudCA9IGN1cnJlbnQgPyBgJHtjdXJyZW50fS8ke3BhcnR9YCA6IHBhcnQ7XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50KSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGN1cnJlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG1pZ3JhdGVMZWdhY3lGaWxlKGZpbGU6IFRGaWxlLCBvcGVuQWZ0ZXIgPSB0cnVlKTogUHJvbWlzZTxURmlsZSB8IG51bGw+IHtcbiAgICBpZiAoIXRoaXMuaXNMZWdhY3lNaW5kTWFwRmlsZShmaWxlKSkgcmV0dXJuIG51bGw7XG4gICAgaWYgKHRoaXMubGVnYWN5TWlncmF0aW9uUGF0aCA9PT0gZmlsZS5wYXRoKSByZXR1cm4gbnVsbDtcbiAgICB0aGlzLmxlZ2FjeU1pZ3JhdGlvblBhdGggPSBmaWxlLnBhdGg7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCB0aXRsZSA9IGZpbGUuYmFzZW5hbWUucmVwbGFjZSgvXFwuc21tJC9pLCBcIlwiKSB8fCBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICAgICAgY29uc3QgZG9jdW1lbnQgPSBwYXJzZURvY3VtZW50KHNvdXJjZSwgdGl0bGUpO1xuICAgICAgY29uc3QgcGFyZW50UGF0aCA9IGZpbGUucGFyZW50Py5wYXRoID8/IFwiXCI7XG4gICAgICBjb25zdCBwcmVmZXJyZWRQYXRoID0gbm9ybWFsaXplUGF0aChgJHtwYXJlbnRQYXRoID8gYCR7cGFyZW50UGF0aH0vYCA6IFwiXCJ9JHt0aGlzLnNhbml0aXplRmlsZW5hbWUodGl0bGUpfS4ke01JTkRNQVBfRVhURU5TSU9OfWApO1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocHJlZmVycmVkUGF0aCk7XG4gICAgICBsZXQgdGFyZ2V0OiBURmlsZTtcblxuICAgICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUgJiYgdGhpcy5pc01pbmRNYXBGaWxlKGV4aXN0aW5nKSkge1xuICAgICAgICB0YXJnZXQgPSBleGlzdGluZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBleGlzdGluZyA/IGF3YWl0IHRoaXMuZ2V0QXZhaWxhYmxlUGF0aChwcmVmZXJyZWRQYXRoKSA6IHByZWZlcnJlZFBhdGg7XG4gICAgICAgIHRhcmdldCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCkpO1xuICAgICAgICBuZXcgTm90aWNlKGBcdTVERjJcdThGNkNcdTYzNjJcdTRFM0FcdTUzRUZcdTdGMTZcdThGOTFcdTgxMTFcdTU2RkVcdUZGMUEke3RhcmdldC5wYXRofVxcblx1NTM5Rlx1NjU4N1x1NEVGNlx1NURGMlx1NEZERFx1NzU1OVx1NEY1Q1x1NEUzQVx1NTkwN1x1NEVGRFx1MzAwMmAsIDcwMDApO1xuICAgICAgfVxuXG4gICAgICBpZiAob3BlbkFmdGVyKSBhd2FpdCB0aGlzLm9wZW5Bc01pbmRNYXAodGFyZ2V0LCB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZiA/PyB1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGxlZ2FjeSBtaWdyYXRpb24gZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTY1RTdcdTcyNDhcdTgxMTFcdTU2RkVcdThGNkNcdTYzNjJcdTU5MzFcdThEMjVcdUZGMENcdTUzOUZcdTY1ODdcdTRFRjZcdTY3MkFcdTg4QUJcdTRGRUVcdTY1MzlcdTMwMDJcIiwgNjAwMCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5sZWdhY3lNaWdyYXRpb25QYXRoID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBpc01pbmRNYXBGaWxlKGZpbGU6IFRGaWxlKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09IE1JTkRNQVBfRVhURU5TSU9OO1xuICB9XG5cbiAgaXNMZWdhY3lNaW5kTWFwRmlsZShmaWxlOiBURmlsZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmaWxlLnBhdGgudG9Mb3dlckNhc2UoKS5lbmRzV2l0aChMRUdBQ1lfU1VGRklYKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29udmVydE1hcmtkb3duRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNvdXJjZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3QgdGl0bGUgPSBmaWxlLmJhc2VuYW1lO1xuICAgIGNvbnN0IGRvY3VtZW50ID0gbWFya2Rvd25Ub0RvY3VtZW50KHNvdXJjZSwgdGl0bGUpO1xuICAgIGRvY3VtZW50LmxheW91dCA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdExheW91dDtcbiAgICBkb2N1bWVudC50aGVtZSA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdFRoZW1lO1xuICAgIGRvY3VtZW50LmFwcGVhcmFuY2UgPSBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKTtcbiAgICBhd2FpdCB0aGlzLmNyZWF0ZU1pbmRNYXAoeyBkb2N1bWVudCwgdGl0bGU6IGAke3RpdGxlfSBcdTgxMTFcdTU2RkVgLCBmb2xkZXI6IGZpbGUucGFyZW50Py5wYXRoID8/IFwiXCIgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlc29sdmVGb2xkZXIoZXhwbGljaXRGb2xkZXI6IHN0cmluZyB8IHVuZGVmaW5lZCwgYWN0aXZlRmlsZTogVEZpbGUgfCBudWxsKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBleHBsaWNpdEZvbGRlciA/PyAodGhpcy5zZXR0aW5ncy5kZWZhdWx0Rm9sZGVyIHx8IGFjdGl2ZUZpbGU/LnBhcmVudD8ucGF0aCB8fCBcIlwiKTtcbiAgICBpZiAoIWNhbmRpZGF0ZSkgcmV0dXJuIFwiXCI7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoY2FuZGlkYXRlKTtcbiAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gbm9ybWFsaXplZDtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlclBhdGgobm9ybWFsaXplZCk7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkTmV3VGl0bGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHR3byA9ICh2YWx1ZTogbnVtYmVyKTogc3RyaW5nID0+IFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgIGNvbnN0IHN0YW1wID0gYCR7bm93LmdldEZ1bGxZZWFyKCl9LSR7dHdvKG5vdy5nZXRNb250aCgpICsgMSl9LSR7dHdvKG5vdy5nZXREYXRlKCkpfSAke3R3byhub3cuZ2V0SG91cnMoKSl9JHt0d28obm93LmdldE1pbnV0ZXMoKSl9YDtcbiAgICByZXR1cm4gYCR7dGhpcy5zZXR0aW5ncy5maWxlUHJlZml4fSAke3N0YW1wfWAudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzYW5pdGl6ZUZpbGVuYW1lKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fCNbXFxdXS9nLCBcIi1cIikucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpIHx8IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCI7XG4gIH1cblxuICBwcml2YXRlIGdldFNvdXJjZVRpdGxlKGNvbnRleHQ6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY29udGV4dC5zb3VyY2VQYXRoKTtcbiAgICByZXR1cm4gc291cmNlRmlsZSBpbnN0YW5jZW9mIFRGaWxlID8gc291cmNlRmlsZS5iYXNlbmFtZSA6IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCI7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHByb2Nlc3NNaW5kTWFwRW1iZWRzKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjb250ZXh0OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW1iZWRzID0gQXJyYXkuZnJvbShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiLmludGVybmFsLWVtYmVkXCIpKTtcbiAgICBmb3IgKGNvbnN0IGVtYmVkIG9mIGVtYmVkcykge1xuICAgICAgaWYgKGVtYmVkLmRhdGFzZXQubW1jUHJvY2Vzc2VkID09PSBcInRydWVcIikgY29udGludWU7XG4gICAgICBjb25zdCByYXdTb3VyY2UgPSBlbWJlZC5nZXRBdHRyaWJ1dGUoXCJzcmNcIikgPz8gZW1iZWQuZGF0YXNldC5zcmMgPz8gXCJcIjtcbiAgICAgIGNvbnN0IGxpbmtQYXRoID0gcmF3U291cmNlLnNwbGl0KFwiI1wiKVswXT8uc3BsaXQoXCJ8XCIpWzBdPy50cmltKCkgPz8gXCJcIjtcbiAgICAgIGlmICghbGlua1BhdGgudG9Mb3dlckNhc2UoKS5lbmRzV2l0aChgLiR7TUlORE1BUF9FWFRFTlNJT059YCkpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobGlua1BhdGgsIGNvbnRleHQuc291cmNlUGF0aCk7XG4gICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHx8ICF0aGlzLmlzTWluZE1hcEZpbGUoZmlsZSkpIGNvbnRpbnVlO1xuICAgICAgZW1iZWQuZGF0YXNldC5tbWNQcm9jZXNzZWQgPSBcInRydWVcIjtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNhY2hlZFJlYWQoZmlsZSk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50ID0gcGFyc2VEb2N1bWVudChzb3VyY2UsIGZpbGUuYmFzZW5hbWUpO1xuICAgICAgICByZW5kZXJTdGF0aWNNaW5kTWFwKGVtYmVkLCBkb2N1bWVudCwgeyBhcHA6IHRoaXMuYXBwLCBmaWxlLCBtYXhIZWlnaHQ6IHRoaXMuc2V0dGluZ3MuZW1iZWRNYXhIZWlnaHQsIGRlZmF1bHRBcHBlYXJhbmNlOiBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBlbWJlZCByZW5kZXIgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgICAgZW1iZWQuZW1wdHkoKTtcbiAgICAgICAgZW1iZWQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1lbWJlZC1lcnJvclwiLCB0ZXh0OiBcIlx1NjVFMFx1NkNENVx1NTJBMFx1OEY3RFx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVx1OTg4NFx1ODlDOFwiIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwgImV4cG9ydCB0eXBlIExheW91dE1vZGUgPSBcInJpZ2h0XCIgfCBcImJhbGFuY2VkXCI7XG5leHBvcnQgdHlwZSBUaGVtZU1vZGUgPSBcImF1dG9cIiB8IFwibGlnaHRcIiB8IFwiZGFya1wiO1xuZXhwb3J0IHR5cGUgTm9kZVNoYXBlID0gXCJyb3VuZGVkXCIgfCBcInBpbGxcIiB8IFwicmVjdGFuZ2xlXCI7XG5leHBvcnQgdHlwZSBUYXNrU3RhdHVzID0gXCJ0b2RvXCIgfCBcImRvaW5nXCIgfCBcImRvbmVcIjtcbmV4cG9ydCB0eXBlIEJhY2tncm91bmRQYXR0ZXJuID0gXCJub25lXCIgfCBcImdyaWRcIiB8IFwiZG90c1wiO1xuZXhwb3J0IHR5cGUgRWRnZVN0eWxlID0gXCJjdXJ2ZWRcIiB8IFwic3RyYWlnaHRcIiB8IFwiZWxib3dcIjtcbmV4cG9ydCB0eXBlIEZvbnRGYW1pbHlNb2RlID0gXCJvYnNpZGlhblwiIHwgXCJzYW5zXCIgfCBcInNlcmlmXCIgfCBcIm1vbm9cIiB8IFwiY3VzdG9tXCI7XG5leHBvcnQgdHlwZSBUYWJsZUFsaWdubWVudCA9IFwibGVmdFwiIHwgXCJjZW50ZXJcIiB8IFwicmlnaHRcIjtcblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwVGV4dFN0eWxlIHtcbiAgYm9sZD86IGJvb2xlYW47XG4gIGl0YWxpYz86IGJvb2xlYW47XG4gIHVuZGVybGluZT86IGJvb2xlYW47XG4gIHN0cmlrZT86IGJvb2xlYW47XG4gIGNvbG9yPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBUZXh0UnVuIHtcbiAgdGV4dDogc3RyaW5nO1xuICBzdHlsZT86IE1pbmRNYXBUZXh0U3R5bGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFRhYmxlIHtcbiAgaGVhZGVyczogc3RyaW5nW107XG4gIHJvd3M6IHN0cmluZ1tdW107XG4gIGFsaWdubWVudHM/OiBUYWJsZUFsaWdubWVudFtdO1xuICBzb3VyY2U/OiBcIm1hbnVhbFwiIHwgXCJtYXJrZG93blwiIHwgXCJjaGlsZHJlblwiO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBDb2RlQmxvY2sge1xuICBsYW5ndWFnZT86IHN0cmluZztcbiAgY29kZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrIHtcbiAgaWQ6IHN0cmluZztcbiAgdHlwZTogXCJ0ZXh0XCI7XG4gIHRleHQ6IHN0cmluZztcbiAgcmljaFRleHQ/OiBNaW5kTWFwVGV4dFJ1bltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBJbWFnZVJlbW90ZVNvdXJjZSB7XG4gIGhvc3RJZDogc3RyaW5nO1xuICBob3N0TmFtZT86IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIHVwbG9hZGVkQXQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEltYWdlQ29udGVudEJsb2NrIHtcbiAgaWQ6IHN0cmluZztcbiAgdHlwZTogXCJpbWFnZVwiO1xuICBzb3VyY2U6IHN0cmluZztcbiAgYWx0Pzogc3RyaW5nO1xuICAvKiogT3JpZ2luYWwgbG9jYWwgdmF1bHQgcGF0aCByZXRhaW5lZCB1bnRpbCBldmVyeSBzZWxlY3RlZCBpbWFnZSBob3N0IHN1Y2NlZWRzLiAqL1xuICBsb2NhbFNvdXJjZT86IHN0cmluZztcbiAgLyoqIE1pcnJvciBVUkxzIHJldHVybmVkIGJ5IG9uZSBvciBtb3JlIGNvbmZpZ3VyZWQgaW1hZ2UgaG9zdHMuICovXG4gIHJlbW90ZVNvdXJjZXM/OiBNaW5kTWFwSW1hZ2VSZW1vdGVTb3VyY2VbXTtcbn1cblxuZXhwb3J0IHR5cGUgTWluZE1hcENvbnRlbnRCbG9jayA9IE1pbmRNYXBUZXh0Q29udGVudEJsb2NrIHwgTWluZE1hcEltYWdlQ29udGVudEJsb2NrO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBTdWJtYXAge1xuICBwYXRoOiBzdHJpbmc7XG4gIHRpdGxlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBOYXZpZ2F0aW9uIHtcbiAgcGFyZW50UGF0aDogc3RyaW5nO1xuICBwYXJlbnROb2RlSWQ/OiBzdHJpbmc7XG4gIHBhcmVudFRpdGxlPzogc3RyaW5nO1xuICBwYXJlbnROb2RlVGV4dD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwQXBwZWFyYW5jZSB7XG4gIGJhY2tncm91bmRDb2xvcj86IHN0cmluZztcbiAgYmFja2dyb3VuZFBhdHRlcm4/OiBCYWNrZ3JvdW5kUGF0dGVybjtcbiAgcGF0dGVybkNvbG9yPzogc3RyaW5nO1xuICBmb250RmFtaWx5PzogRm9udEZhbWlseU1vZGU7XG4gIGN1c3RvbUZvbnQ/OiBzdHJpbmc7XG4gIGZvbnRTaXplPzogbnVtYmVyO1xuICBlZGdlQ29sb3I/OiBzdHJpbmc7XG4gIGVkZ2VXaWR0aD86IG51bWJlcjtcbiAgZWRnZVN0eWxlPzogRWRnZVN0eWxlO1xuICBub2RlQ29sb3I/OiBzdHJpbmc7XG4gIHRleHRDb2xvcj86IHN0cmluZztcbiAgbm9kZUJvcmRlckNvbG9yPzogc3RyaW5nO1xuICBub2RlQm9yZGVyV2lkdGg/OiBudW1iZXI7XG4gIGJvbGQ/OiBib29sZWFuO1xuICBpdGFsaWM/OiBib29sZWFuO1xuICB1bmRlcmxpbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBOb2RlU3R5bGUge1xuICBjb2xvcj86IHN0cmluZztcbiAgdGV4dENvbG9yPzogc3RyaW5nO1xuICBib3JkZXJDb2xvcj86IHN0cmluZztcbiAgYm9yZGVyV2lkdGg/OiBudW1iZXI7XG4gIHNoYXBlPzogTm9kZVNoYXBlO1xuICBib2xkPzogYm9vbGVhbjtcbiAgaXRhbGljPzogYm9vbGVhbjtcbiAgdW5kZXJsaW5lPzogYm9vbGVhbjtcbiAgZm9udFNpemU/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcE5vZGUge1xuICBpZDogc3RyaW5nO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHJpY2hUZXh0PzogTWluZE1hcFRleHRSdW5bXTtcbiAgLyoqIE9yZGVyZWQgdGV4dCBhbmQgaW1hZ2UgYmxvY2tzLiBMZWdhY3kgdGV4dC9yaWNoVGV4dC9pbWFnZSBmaWVsZHMgcmVtYWluIGZvciBjb21wYXRpYmlsaXR5LiAqL1xuICBjb250ZW50PzogTWluZE1hcENvbnRlbnRCbG9ja1tdO1xuICBub3RlPzogc3RyaW5nO1xuICBsaW5rPzogc3RyaW5nO1xuICBpbWFnZT86IHN0cmluZztcbiAgdGFibGU/OiBNaW5kTWFwVGFibGU7XG4gIGNvZGU/OiBNaW5kTWFwQ29kZUJsb2NrO1xuICBzdWJtYXA/OiBNaW5kTWFwU3VibWFwO1xuICBpY29uPzogc3RyaW5nO1xuICB0YWdzPzogc3RyaW5nW107XG4gIHRhc2s/OiBUYXNrU3RhdHVzO1xuICBzdHlsZT86IE1pbmRNYXBOb2RlU3R5bGU7XG4gIGNvbGxhcHNlZD86IGJvb2xlYW47XG4gIGNoaWxkcmVuOiBNaW5kTWFwTm9kZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBEb2N1bWVudCB7XG4gIHZlcnNpb246IDg7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGxheW91dDogTGF5b3V0TW9kZTtcbiAgdGhlbWU6IFRoZW1lTW9kZTtcbiAgYXBwZWFyYW5jZT86IE1pbmRNYXBBcHBlYXJhbmNlO1xuICBuYXZpZ2F0aW9uPzogTWluZE1hcE5hdmlnYXRpb247XG4gIHJvb3Q6IE1pbmRNYXBOb2RlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2tQcm9ncmVzcyB7XG4gIGRvbmU6IG51bWJlcjtcbiAgdG90YWw6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IE1JTkRNQVBfQ09ERV9CTE9DSyA9IFwibWluZG1hcC1qc29uXCI7XG5jb25zdCBMRUdBQ1lfQ09ERV9CTE9DS1MgPSBbXCJzbW0tanNvblwiLCBcIm1tYy1qc29uXCJdIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gbmV3SWQoKTogc3RyaW5nIHtcbiAgY29uc3QgcmFuZG9tID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgOSk7XG4gIHJldHVybiBgbl8ke0RhdGUubm93KCkudG9TdHJpbmcoMzYpfV8ke3JhbmRvbX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZSh0ZXh0ID0gXCJcdTY1QjBcdTgyODJcdTcwQjlcIik6IE1pbmRNYXBOb2RlIHtcbiAgcmV0dXJuIHsgaWQ6IG5ld0lkKCksIHRleHQsIGNoaWxkcmVuOiBbXSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGVmYXVsdERvY3VtZW50KHRpdGxlID0gXCJcdTY1QjBcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik6IE1pbmRNYXBEb2N1bWVudCB7XG4gIHJldHVybiB7XG4gICAgdmVyc2lvbjogOCxcbiAgICB0aXRsZSxcbiAgICBsYXlvdXQ6IFwicmlnaHRcIixcbiAgICB0aGVtZTogXCJhdXRvXCIsXG4gICAgcm9vdDoge1xuICAgICAgaWQ6IG5ld0lkKCksXG4gICAgICB0ZXh0OiB0aXRsZSxcbiAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgIHsgaWQ6IG5ld0lkKCksIHRleHQ6IFwiXHU0RTNCXHU5ODk4IDFcIiwgY2hpbGRyZW46IFtdIH0sXG4gICAgICAgIHsgaWQ6IG5ld0lkKCksIHRleHQ6IFwiXHU0RTNCXHU5ODk4IDJcIiwgY2hpbGRyZW46IFtdIH1cbiAgICAgIF1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbG9yKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgcmV0dXJuIC9eI1swLTlhLWZdezZ9JC9pLnRlc3QodHJpbW1lZCkgPyB0cmltbWVkIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOdW1iZXIodmFsdWU6IHVua25vd24sIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcik6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdmFsdWUpKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKHZhbHVlOiB1bmtub3duKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFwcGVhcmFuY2UoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcEFwcGVhcmFuY2U+IHwgdW5kZWZpbmVkKTogTWluZE1hcEFwcGVhcmFuY2UgfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0KSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBiYWNrZ3JvdW5kUGF0dGVybjogQmFja2dyb3VuZFBhdHRlcm4gfCB1bmRlZmluZWQgPSBpbnB1dC5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJub25lXCIgfHwgaW5wdXQuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwiZ3JpZFwiIHx8IGlucHV0LmJhY2tncm91bmRQYXR0ZXJuID09PSBcImRvdHNcIlxuICAgID8gaW5wdXQuYmFja2dyb3VuZFBhdHRlcm5cbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3QgZm9udEZhbWlseTogRm9udEZhbWlseU1vZGUgfCB1bmRlZmluZWQgPSBpbnB1dC5mb250RmFtaWx5ID09PSBcIm9ic2lkaWFuXCIgfHwgaW5wdXQuZm9udEZhbWlseSA9PT0gXCJzYW5zXCIgfHwgaW5wdXQuZm9udEZhbWlseSA9PT0gXCJzZXJpZlwiIHx8IGlucHV0LmZvbnRGYW1pbHkgPT09IFwibW9ub1wiIHx8IGlucHV0LmZvbnRGYW1pbHkgPT09IFwiY3VzdG9tXCJcbiAgICA/IGlucHV0LmZvbnRGYW1pbHlcbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3QgZWRnZVN0eWxlOiBFZGdlU3R5bGUgfCB1bmRlZmluZWQgPSBpbnB1dC5lZGdlU3R5bGUgPT09IFwiY3VydmVkXCIgfHwgaW5wdXQuZWRnZVN0eWxlID09PSBcInN0cmFpZ2h0XCIgfHwgaW5wdXQuZWRnZVN0eWxlID09PSBcImVsYm93XCJcbiAgICA/IGlucHV0LmVkZ2VTdHlsZVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBjdXN0b21Gb250ID0gdHlwZW9mIGlucHV0LmN1c3RvbUZvbnQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQuY3VzdG9tRm9udC50cmltKClcbiAgICA/IGlucHV0LmN1c3RvbUZvbnQudHJpbSgpLnNsaWNlKDAsIDEyMClcbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3QgYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UgPSB7XG4gICAgYmFja2dyb3VuZENvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5iYWNrZ3JvdW5kQ29sb3IpLFxuICAgIGJhY2tncm91bmRQYXR0ZXJuLFxuICAgIHBhdHRlcm5Db2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQucGF0dGVybkNvbG9yKSxcbiAgICBmb250RmFtaWx5LFxuICAgIGN1c3RvbUZvbnQsXG4gICAgZm9udFNpemU6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5mb250U2l6ZSwgMTAsIDMwKSxcbiAgICBlZGdlQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LmVkZ2VDb2xvciksXG4gICAgZWRnZVdpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQuZWRnZVdpZHRoLCAwLjUsIDgpLFxuICAgIGVkZ2VTdHlsZSxcbiAgICBub2RlQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0Lm5vZGVDb2xvciksXG4gICAgdGV4dENvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC50ZXh0Q29sb3IpLFxuICAgIG5vZGVCb3JkZXJDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQubm9kZUJvcmRlckNvbG9yKSxcbiAgICBub2RlQm9yZGVyV2lkdGg6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5ub2RlQm9yZGVyV2lkdGgsIDAsIDYpLFxuICAgIGJvbGQ6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5ib2xkKSxcbiAgICBpdGFsaWM6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5pdGFsaWMpLFxuICAgIHVuZGVybGluZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnVuZGVybGluZSlcbiAgfTtcbiAgcmV0dXJuIE9iamVjdC52YWx1ZXMoYXBwZWFyYW5jZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gYXBwZWFyYW5jZSA6IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQXBwZWFyYW5jZShiYXNlOiBNaW5kTWFwQXBwZWFyYW5jZSB8IHVuZGVmaW5lZCwgb3ZlcnJpZGU6IE1pbmRNYXBBcHBlYXJhbmNlIHwgdW5kZWZpbmVkKTogTWluZE1hcEFwcGVhcmFuY2Uge1xuICByZXR1cm4geyAuLi4oYmFzZSA/PyB7fSksIC4uLihvdmVycmlkZSA/PyB7fSkgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU3R5bGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcE5vZGVTdHlsZT4gfCB1bmRlZmluZWQpOiBNaW5kTWFwTm9kZVN0eWxlIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3Qgc2hhcGU6IE5vZGVTaGFwZSB8IHVuZGVmaW5lZCA9IGlucHV0LnNoYXBlID09PSBcInBpbGxcIiB8fCBpbnB1dC5zaGFwZSA9PT0gXCJyZWN0YW5nbGVcIiB8fCBpbnB1dC5zaGFwZSA9PT0gXCJyb3VuZGVkXCJcbiAgICA/IGlucHV0LnNoYXBlXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHN0eWxlOiBNaW5kTWFwTm9kZVN0eWxlID0ge1xuICAgIGNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5jb2xvciksXG4gICAgdGV4dENvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC50ZXh0Q29sb3IpLFxuICAgIGJvcmRlckNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5ib3JkZXJDb2xvciksXG4gICAgYm9yZGVyV2lkdGg6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5ib3JkZXJXaWR0aCwgMCwgNiksXG4gICAgc2hhcGUsXG4gICAgYm9sZDogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LmJvbGQpLFxuICAgIGl0YWxpYzogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0Lml0YWxpYyksXG4gICAgdW5kZXJsaW5lOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQudW5kZXJsaW5lKSxcbiAgICBmb250U2l6ZTogbm9ybWFsaXplTnVtYmVyKGlucHV0LmZvbnRTaXplLCAxMCwgMzIpXG4gIH07XG4gIHJldHVybiBPYmplY3QudmFsdWVzKHN0eWxlKS5zb21lKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCkgPyBzdHlsZSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGV4dFN0eWxlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBUZXh0U3R5bGU+IHwgdW5kZWZpbmVkKTogTWluZE1hcFRleHRTdHlsZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHN0eWxlOiBNaW5kTWFwVGV4dFN0eWxlID0ge1xuICAgIGJvbGQ6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5ib2xkKSxcbiAgICBpdGFsaWM6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5pdGFsaWMpLFxuICAgIHVuZGVybGluZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnVuZGVybGluZSksXG4gICAgc3RyaWtlOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuc3RyaWtlKSxcbiAgICBjb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuY29sb3IpXG4gIH07XG4gIHJldHVybiBPYmplY3QudmFsdWVzKHN0eWxlKS5zb21lKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCkgPyBzdHlsZSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gdGV4dFN0eWxlS2V5KHN0eWxlOiBNaW5kTWFwVGV4dFN0eWxlIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN0eWxlID8/IHt9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVJpY2hUZXh0KGlucHV0OiB1bmtub3duLCBmYWxsYmFja1RleHQgPSBcIlwiKTogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCB7XG4gIGlmICghQXJyYXkuaXNBcnJheShpbnB1dCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgZm9yIChjb25zdCByYXcgb2YgaW5wdXQuc2xpY2UoMCwgNTAwKSkge1xuICAgIGlmICghcmF3IHx8IHR5cGVvZiByYXcgIT09IFwib2JqZWN0XCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IHJhdyBhcyBQYXJ0aWFsPE1pbmRNYXBUZXh0UnVuPjtcbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZS50ZXh0ICE9PSBcInN0cmluZ1wiIHx8ICFjYW5kaWRhdGUudGV4dCkgY29udGludWU7XG4gICAgY29uc3QgdGV4dCA9IGNhbmRpZGF0ZS50ZXh0LnJlcGxhY2UoL1xccj9cXG4vZywgXCIgXCIpLnNsaWNlKDAsIDEwMDAwKTtcbiAgICBpZiAoIXRleHQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHN0eWxlID0gbm9ybWFsaXplVGV4dFN0eWxlKGNhbmRpZGF0ZS5zdHlsZSk7XG4gICAgY29uc3QgcHJldmlvdXMgPSBydW5zLmF0KC0xKTtcbiAgICBpZiAocHJldmlvdXMgJiYgdGV4dFN0eWxlS2V5KHByZXZpb3VzLnN0eWxlKSA9PT0gdGV4dFN0eWxlS2V5KHN0eWxlKSkgcHJldmlvdXMudGV4dCArPSB0ZXh0O1xuICAgIGVsc2UgcnVucy5wdXNoKHsgdGV4dCwgc3R5bGUgfSk7XG4gIH1cbiAgaWYgKCFydW5zLmxlbmd0aCkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICBjb25zdCBjb21iaW5lZCA9IHJ1bnMubWFwKChydW4pID0+IHJ1bi50ZXh0KS5qb2luKFwiXCIpO1xuICBjb25zdCBsZWFkaW5nID0gY29tYmluZWQubGVuZ3RoIC0gY29tYmluZWQudHJpbVN0YXJ0KCkubGVuZ3RoO1xuICBjb25zdCB0cmFpbGluZyA9IGNvbWJpbmVkLmxlbmd0aCAtIGNvbWJpbmVkLnRyaW1FbmQoKS5sZW5ndGg7XG4gIGlmIChsZWFkaW5nIHx8IHRyYWlsaW5nKSB7XG4gICAgbGV0IHN0YXJ0ID0gbGVhZGluZztcbiAgICBsZXQgcmVtYWluaW5nID0gY29tYmluZWQubGVuZ3RoIC0gbGVhZGluZyAtIHRyYWlsaW5nO1xuICAgIGNvbnN0IHRyaW1tZWQ6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHJ1biBvZiBydW5zKSB7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIGJyZWFrO1xuICAgICAgY29uc3Qgc2tpcCA9IE1hdGgubWluKHN0YXJ0LCBydW4udGV4dC5sZW5ndGgpO1xuICAgICAgc3RhcnQgLT0gc2tpcDtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IHJ1bi50ZXh0Lmxlbmd0aCAtIHNraXA7XG4gICAgICBpZiAoYXZhaWxhYmxlIDw9IDApIGNvbnRpbnVlO1xuICAgICAgY29uc3QgdGFrZSA9IE1hdGgubWluKGF2YWlsYWJsZSwgcmVtYWluaW5nKTtcbiAgICAgIGNvbnN0IHRleHQgPSBydW4udGV4dC5zbGljZShza2lwLCBza2lwICsgdGFrZSk7XG4gICAgICByZW1haW5pbmcgLT0gdGFrZTtcbiAgICAgIGlmICh0ZXh0KSB0cmltbWVkLnB1c2goeyB0ZXh0LCBzdHlsZTogcnVuLnN0eWxlIH0pO1xuICAgIH1cbiAgICBydW5zLnNwbGljZSgwLCBydW5zLmxlbmd0aCwgLi4udHJpbW1lZCk7XG4gIH1cblxuICBpZiAoIXJ1bnMubGVuZ3RoKSByZXR1cm4gZmFsbGJhY2tUZXh0LnRyaW0oKSA/IFt7IHRleHQ6IGZhbGxiYWNrVGV4dC50cmltKCkgfV0gOiB1bmRlZmluZWQ7XG4gIHJldHVybiBydW5zLnNvbWUoKHJ1bikgPT4gcnVuLnN0eWxlICYmIE9iamVjdC52YWx1ZXMocnVuLnN0eWxlKS5zb21lKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCkpID8gcnVucyA6IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJpY2hUZXh0UGxhaW5UZXh0KHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dCA9IFwiXCIpOiBzdHJpbmcge1xuICByZXR1cm4gcnVucz8ubWFwKChydW4pID0+IHJ1bi50ZXh0KS5qb2luKFwiXCIpID8/IGZhbGxiYWNrVGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzKHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dCA9IFwiXCIpOiBNaW5kTWFwVGV4dFN0eWxlW10ge1xuICBjb25zdCB0ZXh0ID0gcmljaFRleHRQbGFpblRleHQocnVucywgZmFsbGJhY2tUZXh0KTtcbiAgY29uc3Qgc3R5bGVzOiBNaW5kTWFwVGV4dFN0eWxlW10gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiB0ZXh0Lmxlbmd0aCB9LCAoKSA9PiAoe30pKTtcbiAgaWYgKCFydW5zPy5sZW5ndGgpIHJldHVybiBzdHlsZXM7XG4gIGxldCBvZmZzZXQgPSAwO1xuICBmb3IgKGNvbnN0IHJ1biBvZiBydW5zKSB7XG4gICAgY29uc3Qgc3R5bGUgPSBydW4uc3R5bGUgPyB7IC4uLnJ1bi5zdHlsZSB9IDoge307XG4gICAgY29uc3QgZW5kID0gTWF0aC5taW4odGV4dC5sZW5ndGgsIG9mZnNldCArIHJ1bi50ZXh0Lmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSBvZmZzZXQ7IGluZGV4IDwgZW5kOyBpbmRleCArPSAxKSBzdHlsZXNbaW5kZXhdID0geyAuLi5zdHlsZSB9O1xuICAgIG9mZnNldCA9IGVuZDtcbiAgfVxuICByZXR1cm4gc3R5bGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dCh0ZXh0OiBzdHJpbmcsIHN0eWxlczogTWluZE1hcFRleHRTdHlsZVtdKTogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCB7XG4gIGlmICghdGV4dCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgcnVuczogTWluZE1hcFRleHRSdW5bXSA9IFtdO1xuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgY3VycmVudCA9IG5vcm1hbGl6ZVRleHRTdHlsZShzdHlsZXNbMF0pO1xuICBmb3IgKGxldCBpbmRleCA9IDE7IGluZGV4IDw9IHRleHQubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgbmV4dCA9IGluZGV4IDwgdGV4dC5sZW5ndGggPyBub3JtYWxpemVUZXh0U3R5bGUoc3R5bGVzW2luZGV4XSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKGluZGV4IDwgdGV4dC5sZW5ndGggJiYgdGV4dFN0eWxlS2V5KGN1cnJlbnQpID09PSB0ZXh0U3R5bGVLZXkobmV4dCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHNlZ21lbnQgPSB0ZXh0LnNsaWNlKHN0YXJ0LCBpbmRleCk7XG4gICAgaWYgKHNlZ21lbnQpIHJ1bnMucHVzaCh7IHRleHQ6IHNlZ21lbnQsIHN0eWxlOiBjdXJyZW50IH0pO1xuICAgIHN0YXJ0ID0gaW5kZXg7XG4gICAgY3VycmVudCA9IG5leHQ7XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZVJpY2hUZXh0KHJ1bnMsIHRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVjb25jaWxlUmljaFRleHRBZnRlckVkaXQoXG4gIHByZXZpb3VzVGV4dDogc3RyaW5nLFxuICBwcmV2aW91c1J1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsXG4gIG5leHRUZXh0OiBzdHJpbmdcbik6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBpZiAocHJldmlvdXNUZXh0ID09PSBuZXh0VGV4dCkgcmV0dXJuIG5vcm1hbGl6ZVJpY2hUZXh0KHByZXZpb3VzUnVucywgbmV4dFRleHQpO1xuICBjb25zdCBwcmV2aW91c1N0eWxlcyA9IHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzKHByZXZpb3VzUnVucywgcHJldmlvdXNUZXh0KTtcbiAgY29uc3QgbmV4dFN0eWxlczogTWluZE1hcFRleHRTdHlsZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogbmV4dFRleHQubGVuZ3RoIH0sICgpID0+ICh7fSkpO1xuICBsZXQgcHJlZml4ID0gMDtcbiAgd2hpbGUgKHByZWZpeCA8IHByZXZpb3VzVGV4dC5sZW5ndGggJiYgcHJlZml4IDwgbmV4dFRleHQubGVuZ3RoICYmIHByZXZpb3VzVGV4dFtwcmVmaXhdID09PSBuZXh0VGV4dFtwcmVmaXhdKSBwcmVmaXggKz0gMTtcbiAgbGV0IHN1ZmZpeCA9IDA7XG4gIHdoaWxlIChcbiAgICBzdWZmaXggPCBwcmV2aW91c1RleHQubGVuZ3RoIC0gcHJlZml4XG4gICAgJiYgc3VmZml4IDwgbmV4dFRleHQubGVuZ3RoIC0gcHJlZml4XG4gICAgJiYgcHJldmlvdXNUZXh0W3ByZXZpb3VzVGV4dC5sZW5ndGggLSAxIC0gc3VmZml4XSA9PT0gbmV4dFRleHRbbmV4dFRleHQubGVuZ3RoIC0gMSAtIHN1ZmZpeF1cbiAgKSBzdWZmaXggKz0gMTtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHByZWZpeDsgaW5kZXggKz0gMSkgbmV4dFN0eWxlc1tpbmRleF0gPSB7IC4uLihwcmV2aW91c1N0eWxlc1tpbmRleF0gPz8ge30pIH07XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBzdWZmaXg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBwcmV2aW91c0luZGV4ID0gcHJldmlvdXNUZXh0Lmxlbmd0aCAtIHN1ZmZpeCArIGluZGV4O1xuICAgIGNvbnN0IG5leHRJbmRleCA9IG5leHRUZXh0Lmxlbmd0aCAtIHN1ZmZpeCArIGluZGV4O1xuICAgIG5leHRTdHlsZXNbbmV4dEluZGV4XSA9IHsgLi4uKHByZXZpb3VzU3R5bGVzW3ByZXZpb3VzSW5kZXhdID8/IHt9KSB9O1xuICB9XG4gIHJldHVybiBjaGFyYWN0ZXJTdHlsZXNUb1JpY2hUZXh0KG5leHRUZXh0LCBuZXh0U3R5bGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UmljaFRleHRTdHlsZVJhbmdlKFxuICB0ZXh0OiBzdHJpbmcsXG4gIHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsXG4gIHN0YXJ0OiBudW1iZXIsXG4gIGVuZDogbnVtYmVyLFxuICBwYXRjaDogUGFydGlhbDxNaW5kTWFwVGV4dFN0eWxlPiB8IG51bGxcbik6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBjb25zdCBzYWZlU3RhcnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbih0ZXh0Lmxlbmd0aCwgTWF0aC5mbG9vcihzdGFydCkpKTtcbiAgY29uc3Qgc2FmZUVuZCA9IE1hdGgubWF4KHNhZmVTdGFydCwgTWF0aC5taW4odGV4dC5sZW5ndGgsIE1hdGguZmxvb3IoZW5kKSkpO1xuICBpZiAoc2FmZVN0YXJ0ID09PSBzYWZlRW5kKSByZXR1cm4gbm9ybWFsaXplUmljaFRleHQocnVucywgdGV4dCk7XG4gIGNvbnN0IHN0eWxlcyA9IHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzKHJ1bnMsIHRleHQpO1xuICBmb3IgKGxldCBpbmRleCA9IHNhZmVTdGFydDsgaW5kZXggPCBzYWZlRW5kOyBpbmRleCArPSAxKSB7XG4gICAgaWYgKHBhdGNoID09PSBudWxsKSBzdHlsZXNbaW5kZXhdID0ge307XG4gICAgZWxzZSBzdHlsZXNbaW5kZXhdID0geyAuLi5zdHlsZXNbaW5kZXhdLCAuLi5wYXRjaCB9O1xuICB9XG4gIHJldHVybiBjaGFyYWN0ZXJTdHlsZXNUb1JpY2hUZXh0KHRleHQsIHN0eWxlcyk7XG59XG5cblxuZnVuY3Rpb24gbm9ybWFsaXplQ29udGVudEJsb2NrKGlucHV0OiB1bmtub3duKTogTWluZE1hcENvbnRlbnRCbG9jayB8IG51bGwge1xuICBpZiAoIWlucHV0IHx8IHR5cGVvZiBpbnB1dCAhPT0gXCJvYmplY3RcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGlucHV0IGFzIFBhcnRpYWw8TWluZE1hcENvbnRlbnRCbG9jaz47XG4gIGNvbnN0IGlkID0gdHlwZW9mIGNhbmRpZGF0ZS5pZCA9PT0gXCJzdHJpbmdcIiAmJiBjYW5kaWRhdGUuaWQudHJpbSgpID8gY2FuZGlkYXRlLmlkLnRyaW0oKS5zbGljZSgwLCAxNjApIDogbmV3SWQoKTtcbiAgaWYgKGNhbmRpZGF0ZS50eXBlID09PSBcImltYWdlXCIpIHtcbiAgICBjb25zdCBpbWFnZSA9IGNhbmRpZGF0ZSBhcyBQYXJ0aWFsPE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jaz47XG4gICAgY29uc3Qgc291cmNlID0gdHlwZW9mIGltYWdlLnNvdXJjZSA9PT0gXCJzdHJpbmdcIiA/IGltYWdlLnNvdXJjZS50cmltKCkuc2xpY2UoMCwgMjAwMCkgOiBcIlwiO1xuICAgIGlmICghc291cmNlKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBhbHQgPSB0eXBlb2YgaW1hZ2UuYWx0ID09PSBcInN0cmluZ1wiICYmIGltYWdlLmFsdC50cmltKCkgPyBpbWFnZS5hbHQudHJpbSgpLnNsaWNlKDAsIDUwMCkgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgbG9jYWxTb3VyY2UgPSB0eXBlb2YgaW1hZ2UubG9jYWxTb3VyY2UgPT09IFwic3RyaW5nXCIgJiYgaW1hZ2UubG9jYWxTb3VyY2UudHJpbSgpXG4gICAgICA/IGltYWdlLmxvY2FsU291cmNlLnRyaW0oKS5zbGljZSgwLCAyMDAwKVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcmVtb3RlU291cmNlcyA9IEFycmF5LmlzQXJyYXkoaW1hZ2UucmVtb3RlU291cmNlcylcbiAgICAgID8gaW1hZ2UucmVtb3RlU291cmNlcy5zbGljZSgwLCAxMikuZmxhdE1hcCgocmF3KSA9PiB7XG4gICAgICAgIGlmICghcmF3IHx8IHR5cGVvZiByYXcgIT09IFwib2JqZWN0XCIpIHJldHVybiBbXTtcbiAgICAgICAgY29uc3QgaXRlbSA9IHJhdyBhcyBQYXJ0aWFsPE1pbmRNYXBJbWFnZVJlbW90ZVNvdXJjZT47XG4gICAgICAgIGNvbnN0IGhvc3RJZCA9IHR5cGVvZiBpdGVtLmhvc3RJZCA9PT0gXCJzdHJpbmdcIiA/IGl0ZW0uaG9zdElkLnRyaW0oKS5zbGljZSgwLCAxNjApIDogXCJcIjtcbiAgICAgICAgY29uc3QgdXJsID0gdHlwZW9mIGl0ZW0udXJsID09PSBcInN0cmluZ1wiID8gaXRlbS51cmwudHJpbSgpLnNsaWNlKDAsIDQwMDApIDogXCJcIjtcbiAgICAgICAgaWYgKCFob3N0SWQgfHwgIS9eaHR0cHM/OlxcL1xcLy9pLnRlc3QodXJsKSkgcmV0dXJuIFtdO1xuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICBob3N0SWQsXG4gICAgICAgICAgaG9zdE5hbWU6IHR5cGVvZiBpdGVtLmhvc3ROYW1lID09PSBcInN0cmluZ1wiICYmIGl0ZW0uaG9zdE5hbWUudHJpbSgpID8gaXRlbS5ob3N0TmFtZS50cmltKCkuc2xpY2UoMCwgMjAwKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB1cmwsXG4gICAgICAgICAgdXBsb2FkZWRBdDogdHlwZW9mIGl0ZW0udXBsb2FkZWRBdCA9PT0gXCJzdHJpbmdcIiAmJiBpdGVtLnVwbG9hZGVkQXQudHJpbSgpID8gaXRlbS51cGxvYWRlZEF0LnRyaW0oKS5zbGljZSgwLCA4MCkgOiB1bmRlZmluZWRcbiAgICAgICAgfV07XG4gICAgICB9KVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHsgaWQsIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlLCBhbHQsIGxvY2FsU291cmNlLCByZW1vdGVTb3VyY2VzOiByZW1vdGVTb3VyY2VzPy5sZW5ndGggPyByZW1vdGVTb3VyY2VzIDogdW5kZWZpbmVkIH07XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS50eXBlID09PSBcInRleHRcIikge1xuICAgIGNvbnN0IGZhbGxiYWNrVGV4dCA9IHR5cGVvZiBjYW5kaWRhdGUudGV4dCA9PT0gXCJzdHJpbmdcIiA/IGNhbmRpZGF0ZS50ZXh0LnJlcGxhY2UoL1xccj9cXG4vZywgXCIgXCIpLnNsaWNlKDAsIDIwMDAwKSA6IFwiXCI7XG4gICAgY29uc3QgcmljaFRleHQgPSBub3JtYWxpemVSaWNoVGV4dChjYW5kaWRhdGUucmljaFRleHQsIGZhbGxiYWNrVGV4dCk7XG4gICAgY29uc3QgdGV4dCA9IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBmYWxsYmFja1RleHQpO1xuICAgIHJldHVybiB7IGlkLCB0eXBlOiBcInRleHRcIiwgdGV4dCwgcmljaFRleHQgfTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVDb250ZW50QmxvY2tzKG5vZGU6IFBpY2s8TWluZE1hcE5vZGUsIFwiY29udGVudFwiIHwgXCJ0ZXh0XCIgfCBcInJpY2hUZXh0XCIgfCBcImltYWdlXCI+KTogTWluZE1hcENvbnRlbnRCbG9ja1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZS5jb250ZW50KSAmJiBub2RlLmNvbnRlbnQubGVuZ3RoKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vZGUuY29udGVudC5tYXAobm9ybWFsaXplQ29udGVudEJsb2NrKS5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcENvbnRlbnRCbG9jayA9PiBCb29sZWFuKGJsb2NrKSk7XG4gICAgaWYgKG5vcm1hbGl6ZWQubGVuZ3RoKSByZXR1cm4gbm9ybWFsaXplZDtcbiAgfVxuICBjb25zdCBibG9ja3M6IE1pbmRNYXBDb250ZW50QmxvY2tbXSA9IFtdO1xuICBpZiAobm9kZS5pbWFnZT8udHJpbSgpKSBibG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcImltYWdlXCIsIHNvdXJjZTogbm9kZS5pbWFnZS50cmltKCksIGFsdDogbm9kZS50ZXh0IHx8IHVuZGVmaW5lZCB9KTtcbiAgaWYgKG5vZGUudGV4dCB8fCBub2RlLnJpY2hUZXh0Py5sZW5ndGgpIHtcbiAgICBjb25zdCByaWNoVGV4dCA9IG5vcm1hbGl6ZVJpY2hUZXh0KG5vZGUucmljaFRleHQsIG5vZGUudGV4dCk7XG4gICAgYmxvY2tzLnB1c2goeyBpZDogbmV3SWQoKSwgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBub2RlLnRleHQpLCByaWNoVGV4dCB9KTtcbiAgfVxuICByZXR1cm4gYmxvY2tzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9kZVBsYWluVGV4dChub2RlOiBQaWNrPE1pbmRNYXBOb2RlLCBcImNvbnRlbnRcIiB8IFwidGV4dFwiIHwgXCJyaWNoVGV4dFwiIHwgXCJpbWFnZVwiPik6IHN0cmluZyB7XG4gIGNvbnN0IGJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpO1xuICByZXR1cm4gYmxvY2tzLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcInRleHRcIikubWFwKChibG9jaykgPT4gYmxvY2sudGV4dCkuam9pbihcIiBcIikudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3luY05vZGVMZWdhY3lGaWVsZHMobm9kZTogTWluZE1hcE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gIG5vZGUuY29udGVudCA9IGJsb2Nrcy5sZW5ndGggPyBibG9ja3MgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHRleHRCbG9ja3MgPSBibG9ja3MuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKTtcbiAgY29uc3QgaW1hZ2VCbG9ja3MgPSBibG9ja3MuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIpO1xuICBub2RlLnRleHQgPSB0ZXh0QmxvY2tzLm1hcCgoYmxvY2spID0+IGJsb2NrLnRleHQpLmpvaW4oXCIgXCIpLnRyaW0oKTtcbiAgbm9kZS5yaWNoVGV4dCA9IHRleHRCbG9ja3MubGVuZ3RoID09PSAxID8gbm9ybWFsaXplUmljaFRleHQodGV4dEJsb2Nrc1swXT8ucmljaFRleHQsIHRleHRCbG9ja3NbMF0/LnRleHQgPz8gXCJcIikgOiB1bmRlZmluZWQ7XG4gIG5vZGUuaW1hZ2UgPSBpbWFnZUJsb2Nrc1swXT8uc291cmNlO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNlbGwodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUudHJpbSgpLnNsaWNlKDAsIDIwMDApIDogU3RyaW5nKHZhbHVlID8/IFwiXCIpLnRyaW0oKS5zbGljZSgwLCAyMDAwKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGFibGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcFRhYmxlPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBUYWJsZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQgfHwgIUFycmF5LmlzQXJyYXkoaW5wdXQuaGVhZGVycykpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IGhlYWRlcnMgPSBpbnB1dC5oZWFkZXJzLm1hcChub3JtYWxpemVDZWxsKS5zbGljZSgwLCAxMik7XG4gIGlmICghaGVhZGVycy5sZW5ndGgpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHJvd3MgPSBBcnJheS5pc0FycmF5KGlucHV0LnJvd3MpXG4gICAgPyBpbnB1dC5yb3dzLnNsaWNlKDAsIDEwMCkubWFwKChyb3cpID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IEFycmF5LmlzQXJyYXkocm93KSA/IHJvdy5tYXAobm9ybWFsaXplQ2VsbCkuc2xpY2UoMCwgaGVhZGVycy5sZW5ndGgpIDogW107XG4gICAgICB3aGlsZSAodmFsdWVzLmxlbmd0aCA8IGhlYWRlcnMubGVuZ3RoKSB2YWx1ZXMucHVzaChcIlwiKTtcbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSlcbiAgICA6IFtdO1xuICBjb25zdCBhbGlnbm1lbnRzID0gQXJyYXkuaXNBcnJheShpbnB1dC5hbGlnbm1lbnRzKVxuICAgID8gaW5wdXQuYWxpZ25tZW50cy5zbGljZSgwLCBoZWFkZXJzLmxlbmd0aCkubWFwKCh2YWx1ZSkgPT4gdmFsdWUgPT09IFwiY2VudGVyXCIgfHwgdmFsdWUgPT09IFwicmlnaHRcIiA/IHZhbHVlIDogXCJsZWZ0XCIpXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHNvdXJjZSA9IGlucHV0LnNvdXJjZSA9PT0gXCJtYXJrZG93blwiIHx8IGlucHV0LnNvdXJjZSA9PT0gXCJjaGlsZHJlblwiID8gaW5wdXQuc291cmNlIDogXCJtYW51YWxcIjtcbiAgcmV0dXJuIHsgaGVhZGVycywgcm93cywgYWxpZ25tZW50cywgc291cmNlIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvZGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcENvZGVCbG9jaz4gfCB1bmRlZmluZWQpOiBNaW5kTWFwQ29kZUJsb2NrIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQuY29kZSAhPT0gXCJzdHJpbmdcIiB8fCAhaW5wdXQuY29kZS50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IGxhbmd1YWdlID0gdHlwZW9mIGlucHV0Lmxhbmd1YWdlID09PSBcInN0cmluZ1wiICYmIGlucHV0Lmxhbmd1YWdlLnRyaW0oKVxuICAgID8gaW5wdXQubGFuZ3VhZ2UudHJpbSgpLnJlcGxhY2UoL1teYS16MC05XysjLi1dL2dpLCBcIlwiKS5zbGljZSgwLCA0MClcbiAgICA6IHVuZGVmaW5lZDtcbiAgcmV0dXJuIHsgbGFuZ3VhZ2UsIGNvZGU6IGlucHV0LmNvZGUucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpLnNsaWNlKDAsIDEwMDAwMCkgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU3VibWFwKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBTdWJtYXA+IHwgdW5kZWZpbmVkKTogTWluZE1hcFN1Ym1hcCB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQgfHwgdHlwZW9mIGlucHV0LnBhdGggIT09IFwic3RyaW5nXCIgfHwgIWlucHV0LnBhdGgudHJpbSgpKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGlucHV0LnBhdGgudHJpbSgpLnNsaWNlKDAsIDUwMCksXG4gICAgdGl0bGU6IHR5cGVvZiBpbnB1dC50aXRsZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC50aXRsZS50cmltKCkgPyBpbnB1dC50aXRsZS50cmltKCkuc2xpY2UoMCwgMjAwKSA6IHVuZGVmaW5lZFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOYXZpZ2F0aW9uKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOYXZpZ2F0aW9uPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBOYXZpZ2F0aW9uIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQucGFyZW50UGF0aCAhPT0gXCJzdHJpbmdcIiB8fCAhaW5wdXQucGFyZW50UGF0aC50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiB7XG4gICAgcGFyZW50UGF0aDogaW5wdXQucGFyZW50UGF0aC50cmltKCkuc2xpY2UoMCwgNTAwKSxcbiAgICBwYXJlbnROb2RlSWQ6IHR5cGVvZiBpbnB1dC5wYXJlbnROb2RlSWQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQucGFyZW50Tm9kZUlkLnRyaW0oKSA/IGlucHV0LnBhcmVudE5vZGVJZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IHVuZGVmaW5lZCxcbiAgICBwYXJlbnRUaXRsZTogdHlwZW9mIGlucHV0LnBhcmVudFRpdGxlID09PSBcInN0cmluZ1wiICYmIGlucHV0LnBhcmVudFRpdGxlLnRyaW0oKSA/IGlucHV0LnBhcmVudFRpdGxlLnRyaW0oKS5zbGljZSgwLCAyMDApIDogdW5kZWZpbmVkLFxuICAgIHBhcmVudE5vZGVUZXh0OiB0eXBlb2YgaW5wdXQucGFyZW50Tm9kZVRleHQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQucGFyZW50Tm9kZVRleHQudHJpbSgpID8gaW5wdXQucGFyZW50Tm9kZVRleHQudHJpbSgpLnNsaWNlKDAsIDIwMCkgOiB1bmRlZmluZWRcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGFzayh2YWx1ZTogdW5rbm93bik6IFRhc2tTdGF0dXMgfCB1bmRlZmluZWQge1xuICByZXR1cm4gdmFsdWUgPT09IFwidG9kb1wiIHx8IHZhbHVlID09PSBcImRvaW5nXCIgfHwgdmFsdWUgPT09IFwiZG9uZVwiID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRhZ3ModmFsdWU6IHVua25vd24pOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHRhZ3MgPSBBcnJheS5mcm9tKG5ldyBTZXQodmFsdWVcbiAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBzdHJpbmcgPT4gdHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpXG4gICAgLm1hcCgoaXRlbSkgPT4gaXRlbS50cmltKCkucmVwbGFjZSgvXiMvLCBcIlwiKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pKSlcbiAgICAuc2xpY2UoMCwgMTIpO1xuICByZXR1cm4gdGFncy5sZW5ndGggPyB0YWdzIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOb2RlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOb2RlPiB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUZXh0OiBzdHJpbmcpOiBNaW5kTWFwTm9kZSB7XG4gIGNvbnN0IGZhbGxiYWNrTm9kZVRleHQgPSB0eXBlb2YgaW5wdXQ/LnRleHQgPT09IFwic3RyaW5nXCIgPyBpbnB1dC50ZXh0IDogZmFsbGJhY2tUZXh0O1xuICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IEFycmF5LmlzQXJyYXkoaW5wdXQ/LmNvbnRlbnQpXG4gICAgPyBpbnB1dC5jb250ZW50Lm1hcChub3JtYWxpemVDb250ZW50QmxvY2spLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwQ29udGVudEJsb2NrID0+IEJvb2xlYW4oYmxvY2spKVxuICAgIDogW107XG4gIGlmICghbm9ybWFsaXplZENvbnRlbnQubGVuZ3RoKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dD8uaW1hZ2UgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQuaW1hZ2UudHJpbSgpKSB7XG4gICAgICBub3JtYWxpemVkQ29udGVudC5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBpbnB1dC5pbWFnZS50cmltKCksIGFsdDogZmFsbGJhY2tOb2RlVGV4dCB8fCB1bmRlZmluZWQgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJpY2hUZXh0ID0gbm9ybWFsaXplUmljaFRleHQoaW5wdXQ/LnJpY2hUZXh0LCBmYWxsYmFja05vZGVUZXh0KTtcbiAgICBjb25zdCB0ZXh0ID0gcmljaFRleHRQbGFpblRleHQocmljaFRleHQsIGZhbGxiYWNrTm9kZVRleHQpO1xuICAgIGlmICh0ZXh0KSBub3JtYWxpemVkQ29udGVudC5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0LCByaWNoVGV4dCB9KTtcbiAgfVxuICBjb25zdCB0ZXh0QmxvY2tzID0gbm9ybWFsaXplZENvbnRlbnQuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKTtcbiAgY29uc3QgaW1hZ2VCbG9ja3MgPSBub3JtYWxpemVkQ29udGVudC5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIik7XG4gIGNvbnN0IHRleHQgPSB0ZXh0QmxvY2tzLm1hcCgoYmxvY2spID0+IGJsb2NrLnRleHQpLmpvaW4oXCIgXCIpLnRyaW0oKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogdHlwZW9mIGlucHV0Py5pZCA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5pZCA/IGlucHV0LmlkIDogbmV3SWQoKSxcbiAgICB0ZXh0LFxuICAgIHJpY2hUZXh0OiB0ZXh0QmxvY2tzLmxlbmd0aCA9PT0gMSA/IHRleHRCbG9ja3NbMF0/LnJpY2hUZXh0IDogdW5kZWZpbmVkLFxuICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZWRDb250ZW50Lmxlbmd0aCA/IG5vcm1hbGl6ZWRDb250ZW50IDogdW5kZWZpbmVkLFxuICAgIG5vdGU6IHR5cGVvZiBpbnB1dD8ubm90ZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5ub3RlLnRyaW0oKSA/IGlucHV0Lm5vdGUudHJpbSgpIDogdW5kZWZpbmVkLFxuICAgIGxpbms6IHR5cGVvZiBpbnB1dD8ubGluayA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5saW5rLnRyaW0oKSA/IGlucHV0LmxpbmsudHJpbSgpIDogdW5kZWZpbmVkLFxuICAgIGltYWdlOiBpbWFnZUJsb2Nrc1swXT8uc291cmNlLFxuICAgIHRhYmxlOiBub3JtYWxpemVUYWJsZShpbnB1dD8udGFibGUpLFxuICAgIGNvZGU6IG5vcm1hbGl6ZUNvZGUoaW5wdXQ/LmNvZGUpLFxuICAgIHN1Ym1hcDogbm9ybWFsaXplU3VibWFwKGlucHV0Py5zdWJtYXApLFxuICAgIGljb246IHR5cGVvZiBpbnB1dD8uaWNvbiA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5pY29uLnRyaW0oKSA/IGlucHV0Lmljb24udHJpbSgpLnNsaWNlKDAsIDEyKSA6IHVuZGVmaW5lZCxcbiAgICB0YWdzOiBub3JtYWxpemVUYWdzKGlucHV0Py50YWdzKSxcbiAgICB0YXNrOiBub3JtYWxpemVUYXNrKGlucHV0Py50YXNrKSxcbiAgICBzdHlsZTogbm9ybWFsaXplU3R5bGUoaW5wdXQ/LnN0eWxlKSxcbiAgICBjb2xsYXBzZWQ6IGlucHV0Py5jb2xsYXBzZWQgPT09IHRydWUgfHwgdW5kZWZpbmVkLFxuICAgIGNoaWxkcmVuOiBBcnJheS5pc0FycmF5KGlucHV0Py5jaGlsZHJlbilcbiAgICAgID8gaW5wdXQuY2hpbGRyZW4ubWFwKChjaGlsZCwgaW5kZXgpID0+IG5vcm1hbGl6ZU5vZGUoY2hpbGQsIGBcdTgyODJcdTcwQjkgJHtpbmRleCArIDF9YCkpXG4gICAgICA6IFtdXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVEb2N1bWVudChpbnB1dDogUGFydGlhbDxNaW5kTWFwRG9jdW1lbnQ+IHwgdW5kZWZpbmVkLCBmYWxsYmFja1RpdGxlID0gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik6IE1pbmRNYXBEb2N1bWVudCB7XG4gIGNvbnN0IHRpdGxlID0gdHlwZW9mIGlucHV0Py50aXRsZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC50aXRsZS50cmltKCkgPyBpbnB1dC50aXRsZS50cmltKCkgOiBmYWxsYmFja1RpdGxlO1xuICByZXR1cm4ge1xuICAgIHZlcnNpb246IDgsXG4gICAgdGl0bGUsXG4gICAgbGF5b3V0OiBpbnB1dD8ubGF5b3V0ID09PSBcImJhbGFuY2VkXCIgPyBcImJhbGFuY2VkXCIgOiBcInJpZ2h0XCIsXG4gICAgdGhlbWU6IGlucHV0Py50aGVtZSA9PT0gXCJsaWdodFwiIHx8IGlucHV0Py50aGVtZSA9PT0gXCJkYXJrXCIgPyBpbnB1dC50aGVtZSA6IFwiYXV0b1wiLFxuICAgIGFwcGVhcmFuY2U6IG5vcm1hbGl6ZUFwcGVhcmFuY2UoaW5wdXQ/LmFwcGVhcmFuY2UpLFxuICAgIG5hdmlnYXRpb246IG5vcm1hbGl6ZU5hdmlnYXRpb24oaW5wdXQ/Lm5hdmlnYXRpb24pLFxuICAgIHJvb3Q6IG5vcm1hbGl6ZU5vZGUoaW5wdXQ/LnJvb3QsIHRpdGxlKVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRG9jdW1lbnQoZG9jOiBNaW5kTWFwRG9jdW1lbnQpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplRG9jdW1lbnQoZG9jLCBkb2MudGl0bGUpO1xuICByZXR1cm4gYCR7SlNPTi5zdHJpbmdpZnkobm9ybWFsaXplZCwgbnVsbCwgMil9XFxuYDtcbn1cblxuZnVuY3Rpb24gcGFyc2VKc29uRG9jdW1lbnQodmFsdWU6IHN0cmluZywgZmFsbGJhY2tUaXRsZTogc3RyaW5nKTogTWluZE1hcERvY3VtZW50IHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZURvY3VtZW50KEpTT04ucGFyc2UodmFsdWUpIGFzIFBhcnRpYWw8TWluZE1hcERvY3VtZW50PiwgZmFsbGJhY2tUaXRsZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RGZW5jZWRKc29uKHNvdXJjZTogc3RyaW5nLCBsYW5ndWFnZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGVzY2FwZWQgPSBsYW5ndWFnZS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIGNvbnN0IG1hdGNoID0gc291cmNlLm1hdGNoKG5ldyBSZWdFeHAoXCJgYGBcIiArIGVzY2FwZWQgKyBcIlxcXFxzKihbXFxcXHNcXFxcU10qPylgYGBcIiwgXCJpXCIpKTtcbiAgcmV0dXJuIG1hdGNoPy5bMV0/LnRyaW0oKSA/PyBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEb2N1bWVudChzb3VyY2U6IHN0cmluZywgZmFsbGJhY2tUaXRsZSA9IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpOiBNaW5kTWFwRG9jdW1lbnQge1xuICBjb25zdCB0cmltbWVkID0gc291cmNlLnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aChcIntcIikgJiYgdHJpbW1lZC5lbmRzV2l0aChcIn1cIikpIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUpzb25Eb2N1bWVudCh0cmltbWVkLCBmYWxsYmFja1RpdGxlKTtcbiAgICBpZiAocGFyc2VkKSByZXR1cm4gcGFyc2VkO1xuICB9XG5cbiAgZm9yIChjb25zdCBsYW5ndWFnZSBvZiBbTUlORE1BUF9DT0RFX0JMT0NLLCAuLi5MRUdBQ1lfQ09ERV9CTE9DS1NdKSB7XG4gICAgY29uc3QgZmVuY2VkID0gZXh0cmFjdEZlbmNlZEpzb24oc291cmNlLCBsYW5ndWFnZSk7XG4gICAgaWYgKCFmZW5jZWQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSnNvbkRvY3VtZW50KGZlbmNlZCwgZmFsbGJhY2tUaXRsZSk7XG4gICAgaWYgKHBhcnNlZCkgcmV0dXJuIHBhcnNlZDtcbiAgfVxuXG4gIHJldHVybiBtYXJrZG93blRvRG9jdW1lbnQoc291cmNlLCBmYWxsYmFja1RpdGxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb25lRG9jdW1lbnQoZG9jOiBNaW5kTWFwRG9jdW1lbnQpOiBNaW5kTWFwRG9jdW1lbnQge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkb2MpKSBhcyBNaW5kTWFwRG9jdW1lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZU5vZGVXaXRoRnJlc2hJZHMobm9kZTogTWluZE1hcE5vZGUpOiBNaW5kTWFwTm9kZSB7XG4gIGNvbnN0IGNsb25lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShub2RlKSkgYXMgTWluZE1hcE5vZGU7XG4gIHdhbGtOb2RlcyhjbG9uZSwgKGN1cnJlbnQpID0+IHtcbiAgICBjdXJyZW50LmlkID0gbmV3SWQoKTtcbiAgfSk7XG4gIHJldHVybiBjbG9uZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhbGtOb2Rlcyhyb290OiBNaW5kTWFwTm9kZSwgdmlzaXRvcjogKG5vZGU6IE1pbmRNYXBOb2RlLCBwYXJlbnQ6IE1pbmRNYXBOb2RlIHwgbnVsbCkgPT4gdm9pZCk6IHZvaWQge1xuICBjb25zdCB2aXNpdCA9IChub2RlOiBNaW5kTWFwTm9kZSwgcGFyZW50OiBNaW5kTWFwTm9kZSB8IG51bGwpOiB2b2lkID0+IHtcbiAgICB2aXNpdG9yKG5vZGUsIHBhcmVudCk7XG4gICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIG5vZGUpKTtcbiAgfTtcbiAgdmlzaXQocm9vdCwgbnVsbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuTm9kZXMocm9vdDogTWluZE1hcE5vZGUpOiBNaW5kTWFwTm9kZVtdIHtcbiAgY29uc3Qgbm9kZXM6IE1pbmRNYXBOb2RlW10gPSBbXTtcbiAgd2Fsa05vZGVzKHJvb3QsIChub2RlKSA9PiBub2Rlcy5wdXNoKG5vZGUpKTtcbiAgcmV0dXJuIG5vZGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZE5vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBNaW5kTWFwTm9kZSB8IG51bGwge1xuICBsZXQgcmVzdWx0OiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUpID0+IHtcbiAgICBpZiAobm9kZS5pZCA9PT0gaWQpIHJlc3VsdCA9IG5vZGU7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhcmVudChyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gIGxldCByZXN1bHQ6IE1pbmRNYXBOb2RlIHwgbnVsbCA9IG51bGw7XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSwgcGFyZW50KSA9PiB7XG4gICAgaWYgKG5vZGUuaWQgPT09IGlkKSByZXN1bHQgPSBwYXJlbnQ7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEFuY2VzdG9ycyhyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlW10ge1xuICBjb25zdCBwYXRoOiBNaW5kTWFwTm9kZVtdID0gW107XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE1pbmRNYXBOb2RlKTogYm9vbGVhbiA9PiB7XG4gICAgaWYgKG5vZGUuaWQgPT09IGlkKSByZXR1cm4gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgIHBhdGgucHVzaChub2RlKTtcbiAgICAgIGlmICh2aXNpdChjaGlsZCkpIHJldHVybiB0cnVlO1xuICAgICAgcGF0aC5wb3AoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICByZXR1cm4gdmlzaXQocm9vdCkgPyBwYXRoIDogW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluc05vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGZpbmROb2RlKHJvb3QsIGlkKSAhPT0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZU5vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJvb3QuY2hpbGRyZW4ubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgaWYgKHJvb3QuY2hpbGRyZW5baW5kZXhdPy5pZCA9PT0gaWQpIHtcbiAgICAgIHJvb3QuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZCA9IHJvb3QuY2hpbGRyZW5baW5kZXhdO1xuICAgIGlmIChjaGlsZCAmJiByZW1vdmVOb2RlKGNoaWxkLCBpZCkpIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RXaWtpTGlua3Mocm9vdDogTWluZE1hcE5vZGUpOiBTZXQ8c3RyaW5nPiB7XG4gIGNvbnN0IGxpbmtzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhdHRlcm4gPSAvXFxbXFxbKFteXFxdfCNdKykoPzojW15cXF18XSspPyg/OlxcfFteXFxdXSspP1xcXVxcXS9nO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUpID0+IHtcbiAgICBjb25zdCB2YWx1ZXMgPSBbbm9kZVBsYWluVGV4dChub2RlKSwgbm9kZS5ub3RlID8/IFwiXCIsIG5vZGUubGluayA/PyBcIlwiLCAuLi5ub2RlQ29udGVudEJsb2Nrcyhub2RlKS5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikubWFwKChibG9jaykgPT4gYmxvY2suc291cmNlKSwgbm9kZS5zdWJtYXA/LnBhdGggPz8gXCJcIl07XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiB2YWx1ZXMpIHtcbiAgICAgIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgICAgIHdoaWxlICgobWF0Y2ggPSBwYXR0ZXJuLmV4ZWModmFsdWUpKSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAobWF0Y2hbMV0pIGxpbmtzLmFkZChtYXRjaFsxXS50cmltKCkpO1xuICAgICAgfVxuICAgICAgcGF0dGVybi5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgICBjb25zdCBleHBsaWNpdExpbmsgPSBub2RlLmxpbms/LnRyaW0oKTtcbiAgICBpZiAoZXhwbGljaXRMaW5rICYmICEvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KGV4cGxpY2l0TGluaykgJiYgIWV4cGxpY2l0TGluay5pbmNsdWRlcyhcIltbXCIpKSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBleHBsaWNpdExpbmsuc3BsaXQoXCJ8XCIpWzBdPy5zcGxpdChcIiNcIilbMF0/LnRyaW0oKTtcbiAgICAgIGlmICh0YXJnZXQpIGxpbmtzLmFkZCh0YXJnZXQpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBsaW5rcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RGaXJzdFdpa2lMaW5rKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSB2YWx1ZS5tYXRjaCgvXFxbXFxbKFteXFxdfCNdKyg/OiNbXlxcXXxdKyk/KSg/OlxcfFteXFxdXSspP1xcXVxcXS8pO1xuICByZXR1cm4gbWF0Y2g/LlsxXT8udHJpbSgpID8/IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXNrUHJvZ3Jlc3Mocm9vdDogTWluZE1hcE5vZGUpOiBUYXNrUHJvZ3Jlc3Mge1xuICBsZXQgZG9uZSA9IDA7XG4gIGxldCB0b3RhbCA9IDA7XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSkgPT4ge1xuICAgIGlmICghbm9kZS50YXNrKSByZXR1cm47XG4gICAgdG90YWwgKz0gMTtcbiAgICBpZiAobm9kZS50YXNrID09PSBcImRvbmVcIikgZG9uZSArPSAxO1xuICB9KTtcbiAgcmV0dXJuIHsgZG9uZSwgdG90YWwgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVTZWFyY2hUZXh0KG5vZGU6IE1pbmRNYXBOb2RlKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtub2RlUGxhaW5UZXh0KG5vZGUpLCBub2RlLm5vdGUsIG5vZGUubGluaywgLi4ubm9kZUNvbnRlbnRCbG9ja3Mobm9kZSkubWFwKChibG9jaykgPT4gYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiID8gYCR7YmxvY2suc291cmNlfSAke2Jsb2NrLmFsdCA/PyBcIlwifWAgOiBibG9jay50ZXh0KSwgbm9kZS5pY29uLCBub2RlLnN1Ym1hcD8ucGF0aCwgbm9kZS5jb2RlPy5sYW5ndWFnZSwgbm9kZS5jb2RlPy5jb2RlLCAuLi4obm9kZS50YWJsZT8uaGVhZGVycyA/PyBbXSksIC4uLihub2RlLnRhYmxlPy5yb3dzLmZsYXQoKSA/PyBbXSksIC4uLihub2RlLnRhZ3MgPz8gW10pXVxuICAgIC5maWx0ZXIoKHZhbHVlKTogdmFsdWUgaXMgc3RyaW5nID0+IEJvb2xlYW4odmFsdWUpKVxuICAgIC5qb2luKFwiIFwiKVxuICAgIC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0YXNrUHJlZml4KHRhc2s6IFRhc2tTdGF0dXMgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAodGFzayA9PT0gXCJkb25lXCIpIHJldHVybiBcIlt4XSBcIjtcbiAgaWYgKHRhc2sgPT09IFwiZG9pbmdcIikgcmV0dXJuIFwiWy1dIFwiO1xuICBpZiAodGFzayA9PT0gXCJ0b2RvXCIpIHJldHVybiBcIlsgXSBcIjtcbiAgcmV0dXJuIFwiXCI7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUlubGluZU1hcmtkb3duKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvKFtcXFxcYCpfe31cXFtcXF08Pl0pL2csIFwiXFxcXCQxXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmljaFRleHRUb01hcmtkb3duKHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFydW5zPy5sZW5ndGgpIHJldHVybiBlc2NhcGVJbmxpbmVNYXJrZG93bihmYWxsYmFja1RleHQpO1xuICByZXR1cm4gcnVucy5tYXAoKHJ1bikgPT4ge1xuICAgIGxldCB2YWx1ZSA9IGVzY2FwZUlubGluZU1hcmtkb3duKHJ1bi50ZXh0KTtcbiAgICBjb25zdCBzdHlsZSA9IHJ1bi5zdHlsZTtcbiAgICBpZiAoIXN0eWxlKSByZXR1cm4gdmFsdWU7XG4gICAgaWYgKHN0eWxlLmJvbGQpIHZhbHVlID0gYCoqJHt2YWx1ZX0qKmA7XG4gICAgaWYgKHN0eWxlLml0YWxpYykgdmFsdWUgPSBgKiR7dmFsdWV9KmA7XG4gICAgaWYgKHN0eWxlLnN0cmlrZSkgdmFsdWUgPSBgfn4ke3ZhbHVlfX5+YDtcbiAgICBpZiAoc3R5bGUudW5kZXJsaW5lKSB2YWx1ZSA9IGA8dT4ke3ZhbHVlfTwvdT5gO1xuICAgIGlmIChzdHlsZS5jb2xvcikgdmFsdWUgPSBgPHNwYW4gc3R5bGU9XCJjb2xvcjoke3N0eWxlLmNvbG9yfVwiPiR7dmFsdWV9PC9zcGFuPmA7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9KS5qb2luKFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGFibGVUb01hcmtkb3duKHRhYmxlOiBNaW5kTWFwVGFibGUpOiBzdHJpbmcge1xuICBjb25zdCBlc2NhcGVDZWxsID0gKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgPT4gdmFsdWUucmVwbGFjZUFsbChcInxcIiwgXCJcXFxcfFwiKS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiPGJyPlwiKTtcbiAgY29uc3QgaGVhZGVycyA9IGB8ICR7dGFibGUuaGVhZGVycy5tYXAoZXNjYXBlQ2VsbCkuam9pbihcIiB8IFwiKX0gfGA7XG4gIGNvbnN0IGFsaWdubWVudHMgPSB0YWJsZS5oZWFkZXJzLm1hcCgoXywgaW5kZXgpID0+IHtcbiAgICBjb25zdCBhbGlnbm1lbnQgPSB0YWJsZS5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgIHJldHVybiBhbGlnbm1lbnQgPT09IFwiY2VudGVyXCIgPyBcIjotLS06XCIgOiBhbGlnbm1lbnQgPT09IFwicmlnaHRcIiA/IFwiLS0tOlwiIDogXCItLS1cIjtcbiAgfSk7XG4gIGNvbnN0IHNlcGFyYXRvciA9IGB8ICR7YWxpZ25tZW50cy5qb2luKFwiIHwgXCIpfSB8YDtcbiAgY29uc3Qgcm93cyA9IHRhYmxlLnJvd3MubWFwKChyb3cpID0+IGB8ICR7dGFibGUuaGVhZGVycy5tYXAoKF8sIGluZGV4KSA9PiBlc2NhcGVDZWxsKHJvd1tpbmRleF0gPz8gXCJcIikpLmpvaW4oXCIgfCBcIil9IHxgKTtcbiAgcmV0dXJuIFtoZWFkZXJzLCBzZXBhcmF0b3IsIC4uLnJvd3NdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNwbGl0TWFya2Rvd25UYWJsZVJvdyhsaW5lOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHZhbHVlID0gbGluZS50cmltKCkucmVwbGFjZSgvXlxcfC8sIFwiXCIpLnJlcGxhY2UoL1xcfCQvLCBcIlwiKTtcbiAgY29uc3QgY2VsbHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgbGV0IGVzY2FwZWQgPSBmYWxzZTtcbiAgZm9yIChjb25zdCBjaGFyIG9mIHZhbHVlKSB7XG4gICAgaWYgKGVzY2FwZWQpIHsgY3VycmVudCArPSBjaGFyOyBlc2NhcGVkID0gZmFsc2U7IGNvbnRpbnVlOyB9XG4gICAgaWYgKGNoYXIgPT09IFwiXFxcXFwiKSB7IGVzY2FwZWQgPSB0cnVlOyBjb250aW51ZTsgfVxuICAgIGlmIChjaGFyID09PSBcInxcIikgeyBjZWxscy5wdXNoKGN1cnJlbnQudHJpbSgpLnJlcGxhY2VBbGwoXCI8YnI+XCIsIFwiXFxuXCIpKTsgY3VycmVudCA9IFwiXCI7IGNvbnRpbnVlOyB9XG4gICAgY3VycmVudCArPSBjaGFyO1xuICB9XG4gIGNlbGxzLnB1c2goY3VycmVudC50cmltKCkucmVwbGFjZUFsbChcIjxicj5cIiwgXCJcXG5cIikpO1xuICByZXR1cm4gY2VsbHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1hcmtkb3duVGFibGUobWFya2Rvd246IHN0cmluZyk6IE1pbmRNYXBUYWJsZSB8IG51bGwge1xuICBjb25zdCBsaW5lcyA9IG1hcmtkb3duLnNwbGl0KC9cXHI/XFxuLyk7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5lcy5sZW5ndGggLSAxOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgaGVhZGVyTGluZSA9IGxpbmVzW2luZGV4XT8udHJpbSgpID8/IFwiXCI7XG4gICAgY29uc3Qgc2VwYXJhdG9yTGluZSA9IGxpbmVzW2luZGV4ICsgMV0/LnRyaW0oKSA/PyBcIlwiO1xuICAgIGlmICghaGVhZGVyTGluZS5pbmNsdWRlcyhcInxcIikgfHwgIXNlcGFyYXRvckxpbmUuaW5jbHVkZXMoXCJ8XCIpKSBjb250aW51ZTtcbiAgICBjb25zdCBoZWFkZXJzID0gc3BsaXRNYXJrZG93blRhYmxlUm93KGhlYWRlckxpbmUpO1xuICAgIGNvbnN0IHNlcGFyYXRvcnMgPSBzcGxpdE1hcmtkb3duVGFibGVSb3coc2VwYXJhdG9yTGluZSk7XG4gICAgaWYgKCFoZWFkZXJzLmxlbmd0aCB8fCBzZXBhcmF0b3JzLmxlbmd0aCAhPT0gaGVhZGVycy5sZW5ndGggfHwgIXNlcGFyYXRvcnMuZXZlcnkoKGNlbGwpID0+IC9eOj8tezMsfTo/JC8udGVzdChjZWxsLnJlcGxhY2UoL1xccy9nLCBcIlwiKSkpKSBjb250aW51ZTtcbiAgICBjb25zdCBhbGlnbm1lbnRzOiBUYWJsZUFsaWdubWVudFtdID0gc2VwYXJhdG9ycy5tYXAoKGNlbGwpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBhY3QgPSBjZWxsLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgICAgIGlmIChjb21wYWN0LnN0YXJ0c1dpdGgoXCI6XCIpICYmIGNvbXBhY3QuZW5kc1dpdGgoXCI6XCIpKSByZXR1cm4gXCJjZW50ZXJcIjtcbiAgICAgIGlmIChjb21wYWN0LmVuZHNXaXRoKFwiOlwiKSkgcmV0dXJuIFwicmlnaHRcIjtcbiAgICAgIHJldHVybiBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCByb3dzOiBzdHJpbmdbXVtdID0gW107XG4gICAgZm9yIChsZXQgcm93SW5kZXggPSBpbmRleCArIDI7IHJvd0luZGV4IDwgbGluZXMubGVuZ3RoOyByb3dJbmRleCArPSAxKSB7XG4gICAgICBjb25zdCByb3dMaW5lID0gbGluZXNbcm93SW5kZXhdPy50cmltKCkgPz8gXCJcIjtcbiAgICAgIGlmICghcm93TGluZSB8fCAhcm93TGluZS5pbmNsdWRlcyhcInxcIikpIGJyZWFrO1xuICAgICAgY29uc3Qgcm93ID0gc3BsaXRNYXJrZG93blRhYmxlUm93KHJvd0xpbmUpLnNsaWNlKDAsIGhlYWRlcnMubGVuZ3RoKTtcbiAgICAgIHdoaWxlIChyb3cubGVuZ3RoIDwgaGVhZGVycy5sZW5ndGgpIHJvdy5wdXNoKFwiXCIpO1xuICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVUYWJsZSh7IGhlYWRlcnMsIHJvd3MsIGFsaWdubWVudHMsIHNvdXJjZTogXCJtYXJrZG93blwiIH0pID8/IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZlbmNlZENvZGUobWFya2Rvd246IHN0cmluZyk6IE1pbmRNYXBDb2RlQmxvY2sgfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgvYGBgKFteXFxuYF0qKVxcbihbXFxzXFxTXSo/KVxcbmBgYC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIG5vcm1hbGl6ZUNvZGUoeyBsYW5ndWFnZTogbWF0Y2hbMV0/LnRyaW0oKSwgY29kZTogbWF0Y2hbMl0gPz8gXCJcIiB9KSA/PyBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hpbGRyZW5Ub1RhYmxlKG5vZGU6IE1pbmRNYXBOb2RlKTogTWluZE1hcFRhYmxlIHwgbnVsbCB7XG4gIGlmICghbm9kZS5jaGlsZHJlbi5sZW5ndGgpIHJldHVybiBudWxsO1xuICByZXR1cm4ge1xuICAgIGhlYWRlcnM6IFtcIlx1NUI1MFx1ODI4Mlx1NzBCOVwiLCBcIlx1NTkwN1x1NkNFOFwiLCBcIlx1NzJCNlx1NjAwMVwiLCBcIlx1NjgwN1x1N0I3RVwiLCBcIlx1NEUwQlx1N0VBN1x1NjU3MFx1OTFDRlwiXSxcbiAgICByb3dzOiBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IFtcbiAgICAgIG5vZGVQbGFpblRleHQoY2hpbGQpLFxuICAgICAgY2hpbGQubm90ZSA/PyBcIlwiLFxuICAgICAgY2hpbGQudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIDogY2hpbGQudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdThGREJcdTg4NENcdTRFMkRcIiA6IGNoaWxkLnRhc2sgPT09IFwidG9kb1wiID8gXCJcdTVGODVcdTUyOUVcIiA6IFwiXCIsXG4gICAgICBjaGlsZC50YWdzPy5qb2luKFwiLCBcIikgPz8gXCJcIixcbiAgICAgIFN0cmluZyhjaGlsZC5jaGlsZHJlbi5sZW5ndGgpXG4gICAgXSksXG4gICAgYWxpZ25tZW50czogW1wibGVmdFwiLCBcImxlZnRcIiwgXCJjZW50ZXJcIiwgXCJsZWZ0XCIsIFwicmlnaHRcIl0sXG4gICAgc291cmNlOiBcImNoaWxkcmVuXCJcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvY3VtZW50VG9NYXJrZG93bihkb2M6IE1pbmRNYXBEb2N1bWVudCk6IHN0cmluZyB7XG4gIGNvbnN0IHJlbmRlckJsb2NrcyA9IChub2RlOiBNaW5kTWFwTm9kZSk6IHN0cmluZ1tdID0+IHtcbiAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBub2RlQ29udGVudEJsb2Nrcyhub2RlKSkge1xuICAgICAgaWYgKGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmljaFRleHRUb01hcmtkb3duKGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0KTtcbiAgICAgICAgaWYgKHZhbHVlKSByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQucHVzaChgIVske2VzY2FwZUlubGluZU1hcmtkb3duKGJsb2NrLmFsdCA/PyBcIlx1NTZGRVx1NzI0N1wiKX1dKCR7YmxvY2suc291cmNlfSlgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgY29uc3Qgcm9vdEJsb2NrcyA9IHJlbmRlckJsb2Nrcyhkb2Mucm9vdCk7XG4gIGNvbnN0IHJvb3RUaXRsZSA9IHJvb3RCbG9ja3MuZmluZCgodmFsdWUpID0+ICF2YWx1ZS5zdGFydHNXaXRoKFwiIVtcIikpID8/IGRvYy50aXRsZTtcbiAgY29uc3Qgcm9vdFN1ZmZpeCA9IGRvYy5yb290LnRhZ3M/Lmxlbmd0aCA/IGAgJHtkb2Mucm9vdC50YWdzLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApLmpvaW4oXCIgXCIpfWAgOiBcIlwiO1xuICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbYCMgJHtkb2Mucm9vdC5pY29uID8gYCR7ZG9jLnJvb3QuaWNvbn0gYCA6IFwiXCJ9JHtyb290VGl0bGV9JHtyb290U3VmZml4fWBdO1xuICByb290QmxvY2tzLmZpbHRlcigodmFsdWUpID0+IHZhbHVlICE9PSByb290VGl0bGUpLmZvckVhY2goKHZhbHVlKSA9PiBsaW5lcy5wdXNoKHZhbHVlKSk7XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE1pbmRNYXBOb2RlLCBkZXB0aDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgY29uc3QgaW5kZW50ID0gXCIgIFwiLnJlcGVhdChNYXRoLm1heCgwLCBkZXB0aCAtIDEpKTtcbiAgICBjb25zdCB0YWdzID0gbm9kZS50YWdzPy5sZW5ndGggPyBgICR7bm9kZS50YWdzLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApLmpvaW4oXCIgXCIpfWAgOiBcIlwiO1xuICAgIGNvbnN0IGxpbmsgPSBub2RlLmxpbmsgPyBgIFx1MjE5MiAke25vZGUubGlua31gIDogXCJcIjtcbiAgICBjb25zdCBibG9ja3MgPSByZW5kZXJCbG9ja3Mobm9kZSk7XG4gICAgY29uc3QgZmlyc3RUZXh0ID0gYmxvY2tzLmZpbmQoKHZhbHVlKSA9PiAhdmFsdWUuc3RhcnRzV2l0aChcIiFbXCIpKSA/PyAoYmxvY2tzWzBdID8/IFwiXHU1NkZFXHU3MjQ3XHU4MjgyXHU3MEI5XCIpO1xuICAgIGxpbmVzLnB1c2goYCR7aW5kZW50fS0gJHt0YXNrUHJlZml4KG5vZGUudGFzayl9JHtub2RlLmljb24gPyBgJHtub2RlLmljb259IGAgOiBcIlwifSR7Zmlyc3RUZXh0fSR7dGFnc30ke2xpbmt9YCk7XG4gICAgYmxvY2tzLmZpbHRlcigodmFsdWUpID0+IHZhbHVlICE9PSBmaXJzdFRleHQpLmZvckVhY2goKHZhbHVlKSA9PiBsaW5lcy5wdXNoKGAke2luZGVudH0gICR7dmFsdWV9YCkpO1xuICAgIGlmIChub2RlLm5vdGUpIGxpbmVzLnB1c2goYCR7aW5kZW50fSAgPiAke25vZGUubm90ZS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiIFwiKX1gKTtcbiAgICBpZiAobm9kZS5zdWJtYXApIGxpbmVzLnB1c2goYCR7aW5kZW50fSAgPiBcdTVCNTBcdTVCRkNcdTU2RkVcdUZGMUFbWyR7bm9kZS5zdWJtYXAucGF0aH1dXWApO1xuICAgIGlmIChub2RlLnRhYmxlKSBsaW5lcy5wdXNoKFwiXCIsIC4uLnRhYmxlVG9NYXJrZG93bihub2RlLnRhYmxlKS5zcGxpdChcIlxcblwiKS5tYXAoKGxpbmUpID0+IGAke2luZGVudH0gICR7bGluZX1gKSwgXCJcIik7XG4gICAgaWYgKG5vZGUuY29kZSkgbGluZXMucHVzaChgJHtpbmRlbnR9ICBcXGBcXGBcXGAke25vZGUuY29kZS5sYW5ndWFnZSA/PyBcIlwifWAsIC4uLm5vZGUuY29kZS5jb2RlLnNwbGl0KFwiXFxuXCIpLm1hcCgobGluZSkgPT4gYCR7aW5kZW50fSAgJHtsaW5lfWApLCBgJHtpbmRlbnR9ICBcXGBcXGBcXGBgKTtcbiAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgZGVwdGggKyAxKSk7XG4gIH07XG4gIGRvYy5yb290LmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgMSkpO1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUYXNrVGV4dCh2YWx1ZTogc3RyaW5nKTogeyB0ZXh0OiBzdHJpbmc7IHRhc2s/OiBUYXNrU3RhdHVzIH0ge1xuICBjb25zdCBtYXRjaCA9IHZhbHVlLm1hdGNoKC9eXFxbKCB8eHxYfC0pXFxdXFxzKyguKykkLyk7XG4gIGlmICghbWF0Y2gpIHJldHVybiB7IHRleHQ6IHZhbHVlIH07XG4gIGNvbnN0IG1hcmtlciA9IG1hdGNoWzFdO1xuICBjb25zdCB0YXNrOiBUYXNrU3RhdHVzID0gbWFya2VyID09PSBcInhcIiB8fCBtYXJrZXIgPT09IFwiWFwiID8gXCJkb25lXCIgOiBtYXJrZXIgPT09IFwiLVwiID8gXCJkb2luZ1wiIDogXCJ0b2RvXCI7XG4gIHJldHVybiB7IHRleHQ6IG1hdGNoWzJdPy50cmltKCkgfHwgXCJcdTRFRkJcdTUyQTFcIiwgdGFzayB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFya2Rvd25Ub0RvY3VtZW50KG1hcmtkb3duOiBzdHJpbmcsIGZhbGxiYWNrVGl0bGUgPSBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTogTWluZE1hcERvY3VtZW50IHtcbiAgY29uc3QgZG9jID0gY3JlYXRlRGVmYXVsdERvY3VtZW50KGZhbGxiYWNrVGl0bGUpO1xuICBkb2Mucm9vdC5jaGlsZHJlbiA9IFtdO1xuICBjb25zdCBzdGFjazogQXJyYXk8eyBsZXZlbDogbnVtYmVyOyBub2RlOiBNaW5kTWFwTm9kZSB9PiA9IFt7IGxldmVsOiAwLCBub2RlOiBkb2Mucm9vdCB9XTtcbiAgbGV0IHJvb3RBc3NpZ25lZCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBtYXJrZG93bi5zcGxpdCgvXFxyP1xcbi8pKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGlmICghbGluZS50cmltKCkgfHwgbGluZS50cmltU3RhcnQoKS5zdGFydHNXaXRoKFwiLS0tXCIpIHx8IGxpbmUudHJpbVN0YXJ0KCkuc3RhcnRzV2l0aChcImBgYFwiKSB8fCAvXlxccyo+Ly50ZXN0KGxpbmUpKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eXFxzKigjezEsNn0pXFxzKyguKz8pXFxzKiQvKTtcbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eKFxccyopWy0qK11cXHMrKC4rPylcXHMqJC8pO1xuICAgIGNvbnN0IG51bWJlcmVkID0gbGluZS5tYXRjaCgvXihcXHMqKVxcZCtbLildXFxzKyguKz8pXFxzKiQvKTtcblxuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBsZXZlbCA9IGhlYWRpbmdbMV0/Lmxlbmd0aCA/PyAxO1xuICAgICAgY29uc3QgdGV4dCA9IGhlYWRpbmdbMl0/LnRyaW0oKSA/PyBcIlx1ODI4Mlx1NzBCOVwiO1xuICAgICAgaWYgKGxldmVsID09PSAxICYmICFyb290QXNzaWduZWQpIHtcbiAgICAgICAgZG9jLnJvb3QudGV4dCA9IHRleHQ7XG4gICAgICAgIGRvYy50aXRsZSA9IHRleHQ7XG4gICAgICAgIHJvb3RBc3NpZ25lZCA9IHRydWU7XG4gICAgICAgIHN0YWNrLmxlbmd0aCA9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBub2RlID0gY3JlYXRlTm9kZSh0ZXh0KTtcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDEgJiYgKHN0YWNrLmF0KC0xKT8ubGV2ZWwgPz8gMCkgPj0gbGV2ZWwpIHN0YWNrLnBvcCgpO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSBzdGFjay5hdCgtMSk/Lm5vZGUgPz8gZG9jLnJvb3Q7XG4gICAgICAgIHBhcmVudC5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgICBzdGFjay5wdXNoKHsgbGV2ZWwsIG5vZGUgfSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0TWF0Y2ggPSBidWxsZXQgPz8gbnVtYmVyZWQ7XG4gICAgaWYgKGxpc3RNYXRjaCkge1xuICAgICAgY29uc3Qgc3BhY2VzID0gKGxpc3RNYXRjaFsxXSA/PyBcIlwiKS5yZXBsYWNlQWxsKFwiXFx0XCIsIFwiICBcIikubGVuZ3RoO1xuICAgICAgY29uc3QgbGV2ZWwgPSBNYXRoLmZsb29yKHNwYWNlcyAvIDIpICsgMjtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlVGFza1RleHQoKGxpc3RNYXRjaFsyXSA/PyBcIlx1ODI4Mlx1NzBCOVwiKS50cmltKCkpO1xuICAgICAgY29uc3Qgbm9kZSA9IGNyZWF0ZU5vZGUocGFyc2VkLnRleHQpO1xuICAgICAgbm9kZS50YXNrID0gcGFyc2VkLnRhc2s7XG4gICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMSAmJiAoc3RhY2suYXQoLTEpPy5sZXZlbCA/PyAwKSA+PSBsZXZlbCkgc3RhY2sucG9wKCk7XG4gICAgICBjb25zdCBwYXJlbnQgPSBzdGFjay5hdCgtMSk/Lm5vZGUgPz8gZG9jLnJvb3Q7XG4gICAgICBwYXJlbnQuY2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgIHN0YWNrLnB1c2goeyBsZXZlbCwgbm9kZSB9KTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWRvYy5yb290LmNoaWxkcmVuLmxlbmd0aCkgZG9jLnJvb3QuY2hpbGRyZW4ucHVzaChjcmVhdGVOb2RlKFwiXHU0RTNCXHU5ODk4IDFcIikpO1xuICByZXR1cm4gZG9jO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBNaW5kTWFwU3R1ZGlvUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB0eXBlIHtcbiAgQmFja2dyb3VuZFBhdHRlcm4sXG4gIEVkZ2VTdHlsZSxcbiAgRm9udEZhbWlseU1vZGUsXG4gIExheW91dE1vZGUsXG4gIE1pbmRNYXBBcHBlYXJhbmNlLFxuICBOb2RlU2hhcGUsXG4gIFRoZW1lTW9kZVxufSBmcm9tIFwiLi9tb2RlbFwiO1xuXG5leHBvcnQgdHlwZSBJbWFnZUhvc3RCb2R5TW9kZSA9IFwibXVsdGlwYXJ0XCIgfCBcInJhd1wiO1xuZXhwb3J0IHR5cGUgSW1hZ2VIb3N0TWV0aG9kID0gXCJQT1NUXCIgfCBcIlBVVFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdENvbmZpZyB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZW5kcG9pbnQ6IHN0cmluZztcbiAgbWV0aG9kOiBJbWFnZUhvc3RNZXRob2Q7XG4gIGJvZHlNb2RlOiBJbWFnZUhvc3RCb2R5TW9kZTtcbiAgZmllbGROYW1lOiBzdHJpbmc7XG4gIGhlYWRlcnM6IHN0cmluZztcbiAgcmVzcG9uc2VQYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0Q2hvaWNlIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdFVwbG9hZFN1Y2Nlc3Mge1xuICBob3N0SWQ6IHN0cmluZztcbiAgaG9zdE5hbWU6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0VXBsb2FkRmFpbHVyZSB7XG4gIGhvc3RJZDogc3RyaW5nO1xuICBob3N0TmFtZTogc3RyaW5nO1xuICBlcnJvcjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdFVwbG9hZEJhdGNoIHtcbiAgc3VjY2Vzc2VzOiBJbWFnZUhvc3RVcGxvYWRTdWNjZXNzW107XG4gIGZhaWx1cmVzOiBJbWFnZUhvc3RVcGxvYWRGYWlsdXJlW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbWFnZUhvc3RDb25maWcoaW5kZXggPSAxKTogSW1hZ2VIb3N0Q29uZmlnIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogYGhvc3RfJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA4KX1gLFxuICAgIG5hbWU6IGBcdTU2RkVcdTVFOEEgJHtpbmRleH1gLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgZW5kcG9pbnQ6IFwiXCIsXG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBib2R5TW9kZTogXCJtdWx0aXBhcnRcIixcbiAgICBmaWVsZE5hbWU6IFwiZmlsZVwiLFxuICAgIGhlYWRlcnM6IFwiXCIsXG4gICAgcmVzcG9uc2VQYXRoOiBcImRhdGEudXJsXCJcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwU3R1ZGlvU2V0dGluZ3Mge1xuICBkZWZhdWx0Rm9sZGVyOiBzdHJpbmc7XG4gIGZpbGVQcmVmaXg6IHN0cmluZztcbiAgYXNzZXRGb2xkZXI6IHN0cmluZztcbiAgZGVmYXVsdExheW91dDogTGF5b3V0TW9kZTtcbiAgZGVmYXVsdFRoZW1lOiBUaGVtZU1vZGU7XG4gIGRlZmF1bHROb2RlU2hhcGU6IE5vZGVTaGFwZTtcbiAgcmVkaXJlY3RMZWdhY3lGaWxlczogYm9vbGVhbjtcbiAgc2hvd0dyaWQ6IGJvb2xlYW47XG4gIHNob3dUYXNrUHJvZ3Jlc3M6IGJvb2xlYW47XG4gIGF1dG9GaXRPbk9wZW46IGJvb2xlYW47XG4gIGhpc3RvcnlMaW1pdDogbnVtYmVyO1xuICBlbWJlZE1heEhlaWdodDogbnVtYmVyO1xuICBiYWNrZ3JvdW5kQ29sb3I6IHN0cmluZztcbiAgYmFja2dyb3VuZFBhdHRlcm46IEJhY2tncm91bmRQYXR0ZXJuO1xuICBiYWNrZ3JvdW5kUGF0dGVybkNvbG9yOiBzdHJpbmc7XG4gIGZvbnRGYW1pbHk6IEZvbnRGYW1pbHlNb2RlO1xuICBjdXN0b21Gb250OiBzdHJpbmc7XG4gIGZvbnRTaXplOiBudW1iZXI7XG4gIGVkZ2VDb2xvcjogc3RyaW5nO1xuICBlZGdlV2lkdGg6IG51bWJlcjtcbiAgZWRnZVN0eWxlOiBFZGdlU3R5bGU7XG4gIG5vZGVCYWNrZ3JvdW5kQ29sb3I6IHN0cmluZztcbiAgdGV4dENvbG9yOiBzdHJpbmc7XG4gIG5vZGVCb3JkZXJDb2xvcjogc3RyaW5nO1xuICBub2RlQm9yZGVyV2lkdGg6IG51bWJlcjtcbiAgZGVmYXVsdFRleHRCb2xkOiBib29sZWFuO1xuICBkZWZhdWx0VGV4dEl0YWxpYzogYm9vbGVhbjtcbiAgZGVmYXVsdFRleHRVbmRlcmxpbmU6IGJvb2xlYW47XG4gIGltYWdlSG9zdHM6IEltYWdlSG9zdENvbmZpZ1tdO1xuICBhdXRvVXBsb2FkRW5hYmxlZDogYm9vbGVhbjtcbiAgYXV0b1VwbG9hZERlbGF5U2Vjb25kczogbnVtYmVyO1xuICBhdXRvVXBsb2FkSG9zdElkczogc3RyaW5nW107XG4gIGRlbGV0ZUxvY2FsQWZ0ZXJVcGxvYWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBNaW5kTWFwU3R1ZGlvU2V0dGluZ3MgPSB7XG4gIGRlZmF1bHRGb2xkZXI6IFwiXCIsXG4gIGZpbGVQcmVmaXg6IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIsXG4gIGFzc2V0Rm9sZGVyOiBcIk1pbmRNYXAgQXNzZXRzXCIsXG4gIGRlZmF1bHRMYXlvdXQ6IFwicmlnaHRcIixcbiAgZGVmYXVsdFRoZW1lOiBcImF1dG9cIixcbiAgZGVmYXVsdE5vZGVTaGFwZTogXCJyb3VuZGVkXCIsXG4gIHJlZGlyZWN0TGVnYWN5RmlsZXM6IHRydWUsXG4gIHNob3dHcmlkOiB0cnVlLFxuICBzaG93VGFza1Byb2dyZXNzOiB0cnVlLFxuICBhdXRvRml0T25PcGVuOiB0cnVlLFxuICBoaXN0b3J5TGltaXQ6IDEyMCxcbiAgZW1iZWRNYXhIZWlnaHQ6IDUyMCxcbiAgYmFja2dyb3VuZENvbG9yOiBcIlwiLFxuICBiYWNrZ3JvdW5kUGF0dGVybjogXCJncmlkXCIsXG4gIGJhY2tncm91bmRQYXR0ZXJuQ29sb3I6IFwiIzk0YTNiOFwiLFxuICBmb250RmFtaWx5OiBcIm9ic2lkaWFuXCIsXG4gIGN1c3RvbUZvbnQ6IFwiXCIsXG4gIGZvbnRTaXplOiAxNCxcbiAgZWRnZUNvbG9yOiBcIlwiLFxuICBlZGdlV2lkdGg6IDIuMixcbiAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICBub2RlQmFja2dyb3VuZENvbG9yOiBcIlwiLFxuICB0ZXh0Q29sb3I6IFwiXCIsXG4gIG5vZGVCb3JkZXJDb2xvcjogXCJcIixcbiAgbm9kZUJvcmRlcldpZHRoOiAxLFxuICBkZWZhdWx0VGV4dEJvbGQ6IGZhbHNlLFxuICBkZWZhdWx0VGV4dEl0YWxpYzogZmFsc2UsXG4gIGRlZmF1bHRUZXh0VW5kZXJsaW5lOiBmYWxzZSxcbiAgaW1hZ2VIb3N0czogW10sXG4gIGF1dG9VcGxvYWRFbmFibGVkOiBmYWxzZSxcbiAgYXV0b1VwbG9hZERlbGF5U2Vjb25kczogMTAsXG4gIGF1dG9VcGxvYWRIb3N0SWRzOiBbXSxcbiAgZGVsZXRlTG9jYWxBZnRlclVwbG9hZDogdHJ1ZVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldHRpbmdzVG9BcHBlYXJhbmNlKHNldHRpbmdzOiBNaW5kTWFwU3R1ZGlvU2V0dGluZ3MpOiBNaW5kTWFwQXBwZWFyYW5jZSB7XG4gIHJldHVybiB7XG4gICAgYmFja2dyb3VuZENvbG9yOiBzZXR0aW5ncy5iYWNrZ3JvdW5kQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIGJhY2tncm91bmRQYXR0ZXJuOiBzZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybixcbiAgICBwYXR0ZXJuQ29sb3I6IHNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIGZvbnRGYW1pbHk6IHNldHRpbmdzLmZvbnRGYW1pbHksXG4gICAgY3VzdG9tRm9udDogc2V0dGluZ3MuY3VzdG9tRm9udC50cmltKCkgfHwgdW5kZWZpbmVkLFxuICAgIGZvbnRTaXplOiBzZXR0aW5ncy5mb250U2l6ZSxcbiAgICBlZGdlQ29sb3I6IHNldHRpbmdzLmVkZ2VDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgZWRnZVdpZHRoOiBzZXR0aW5ncy5lZGdlV2lkdGgsXG4gICAgZWRnZVN0eWxlOiBzZXR0aW5ncy5lZGdlU3R5bGUsXG4gICAgbm9kZUNvbG9yOiBzZXR0aW5ncy5ub2RlQmFja2dyb3VuZENvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICB0ZXh0Q29sb3I6IHNldHRpbmdzLnRleHRDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgbm9kZUJvcmRlckNvbG9yOiBzZXR0aW5ncy5ub2RlQm9yZGVyQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIG5vZGVCb3JkZXJXaWR0aDogc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoLFxuICAgIGJvbGQ6IHNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZCxcbiAgICBpdGFsaWM6IHNldHRpbmdzLmRlZmF1bHRUZXh0SXRhbGljLFxuICAgIHVuZGVybGluZTogc2V0dGluZ3MuZGVmYXVsdFRleHRVbmRlcmxpbmVcbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIE1pbmRNYXBTdHVkaW9TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBNaW5kTWFwU3R1ZGlvUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJNaW5kTWFwIFN0dWRpb1wiIH0pO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlx1OEZEOVx1OTFDQ1x1OEJCRVx1N0Y2RVx1NTE2OFx1NUM0MFx1OUVEOFx1OEJBNFx1NTkxNlx1ODlDMlx1MzAwMlx1NjI1M1x1NUYwMFx1ODExMVx1NTZGRVx1NTQwRVx1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1NzBCOVx1NTFGQlx1NURFNVx1NTE3N1x1NjgwRlx1NEUyRFx1NzY4NFx1OEMwM1x1ODI3Mlx1Njc3Rlx1RkYwQ1x1NEUzQVx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTM1NVx1NzJFQ1x1NEZERFx1NUI1OFx1NEUwMFx1NTk1N1x1NjgzN1x1NUYwRlx1MzAwMlwiXG4gICAgfSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTY1ODdcdTRFRjZcdTRFMEVcdTVFMDNcdTVDNDBcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTRGRERcdTVCNThcdTY1ODdcdTRFRjZcdTU5MzlcIilcbiAgICAgIC5zZXREZXNjKFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RkREXHU1QjU4XHU1NzI4XHU1RjUzXHU1MjREXHU3QjE0XHU4QkIwXHU2MjQwXHU1NzI4XHU2NTg3XHU0RUY2XHU1OTM5XHVGRjFCXHU0RTVGXHU1M0VGXHU1ODZCXHU1MTk5XHU0RjhCXHU1OTgyIE1pbmQgTWFwc1x1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiTWluZCBNYXBzXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Rm9sZGVyKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdEZvbGRlciA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OEQ0NFx1NkU5MFx1NjU4N1x1NEVGNlx1NTkzOVwiKVxuICAgICAgLnNldERlc2MoXCJcdThCRTVcdThERUZcdTVGODRcdTc2RjhcdTVCRjlcdTRFOEVcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTYyNDBcdTU3MjhcdTc2RUVcdTVGNTVcdTMwMDJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTRGMUFcdTRGRERcdTVCNThcdTUyMzBcdTIwMUNcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTc2RUVcdTVGNTUvXHU4QkU1XHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5L1x1MjAxRFx1RkYxQlx1NUI1MFx1NUJGQ1x1NTZGRVx1NEYxQVx1NEZERFx1NUI1OFx1NTcyOFx1MjAxQ1x1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NzZFRVx1NUY1NS9cdThCRTVcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcdTU5MzkvXHU3MjM2XHU1QkZDXHU1NkZFXHU1NDBEXHU3OUYwL1x1MjAxRFx1NEUyRFx1MzAwMlx1OUVEOFx1OEJBNFx1NEY3Rlx1NzUyOCBNaW5kTWFwIEFzc2V0c1x1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiTWluZE1hcCBBc3NldHNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmFzc2V0Rm9sZGVyKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRGb2xkZXIgPSB2YWx1ZS50cmltKCkucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIikgfHwgXCJNaW5kTWFwIEFzc2V0c1wiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTU2RkVcdTcyNDdcdTRFMEVcdTU2RkVcdTVFOEFcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTU0MEVcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1NkZFXHU3MjQ3XHU0RjFBXHU1MTQ4XHU0RkREXHU1QjU4XHU1MjMwXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU3Njg0XHU2NzJDXHU1NzMwXHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU1MThEXHU2MzA5XHU4QkJFXHU1QjlBXHU1RUY2XHU4RkRGXHU0RTBBXHU0RjIwXHUzMDAyXHU1M0VBXHU2NzA5XHU1MTY4XHU5MEU4XHU3NkVFXHU2ODA3XHU1NkZFXHU1RThBXHU2MjEwXHU1MjlGXHU1NDBFXHVGRjBDXHU2MjREXHU0RjFBXHU1MjA3XHU2MzYyXHU0RTNBXHU4RkRDXHU3QTBCXHU3RjUxXHU1NzQwXHUzMDAyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEVuYWJsZWQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkRW5hYmxlZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEVuYWJsZWQpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1ODFFQVx1NTJBOFx1NEUwQVx1NEYyMFx1NUVGNlx1OEZERlwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1N0M5OFx1OEQzNFx1NTQwRVx1N0I0OVx1NUY4NSAwXHUyMDEzMzAwIFx1NzlEMlx1NTE4RFx1NEUwQVx1NEYyMFx1RkYwQ1x1NEZCRlx1NEU4RVx1NjRBNFx1OTUwMFx1NjIxNlx1N0VFN1x1N0VFRFx1N0YxNlx1OEY5MVx1MzAwMlwiKVxuICAgICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAgIC5zZXRMaW1pdHMoMCwgMzAwLCAxKVxuICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWREZWxheVNlY29uZHMpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZERlbGF5U2Vjb25kcyA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJcdTUxNjhcdTkwRThcdTYyMTBcdTUyOUZcdTU0MEVcdTUyMjBcdTk2NjRcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTYzRDJcdTRFRjZcdTRGMUFcdTUxNDhcdTUxOTlcdTUxNjVcdThGRENcdTdBMEJcdTdGNTFcdTU3NDBcdTVFNzZcdTRGRERcdTVCNThcdTgxMTFcdTU2RkVcdUZGMENcdTUxOERcdTY4QzBcdTY3RTVcdTU2RkVcdTcyNDdcdTY2MkZcdTU0MjZcdTg4QUJcdTUxNzZcdTRFRDZcdTgxMTFcdTU2RkVcdTVGMTVcdTc1MjhcdUZGMUJcdTc4NkVcdThCQTRcdTVCODlcdTUxNjhcdTU0MEVcdTYyNERcdTUyMjBcdTk2NjRcdTY3MkNcdTU3MzBcdTY1ODdcdTRFRjZcdTMwMDJcdTRFRkJcdTRFMDBcdTU2RkVcdTVFOEFcdTU5MzFcdThEMjVcdTY1RjZcdTRGMUFcdTRGRERcdTc1NTlcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTMwMDJcIilcbiAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVsZXRlTG9jYWxBZnRlclVwbG9hZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWxldGVMb2NhbEFmdGVyVXBsb2FkID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdHMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RzO1xuICAgIGNvbnN0IGhvc3RzSGVhZGVyID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0cy1oZWFkZXJcIiB9KTtcbiAgICBob3N0c0hlYWRlci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJcdTU2RkVcdTVFOEFcdTkxNERcdTdGNkVcIiB9KTtcbiAgICBjb25zdCBhZGRIb3N0ID0gaG9zdHNIZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NjVCMFx1NTg5RVx1NTZGRVx1NUU4QVwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBhZGRIb3N0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBob3N0ID0gY3JlYXRlSW1hZ2VIb3N0Q29uZmlnKGhvc3RzLmxlbmd0aCArIDEpO1xuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0cy5wdXNoKGhvc3QpO1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKS50aGVuKCgpID0+IHRoaXMuZGlzcGxheSgpKTtcbiAgICB9KTtcblxuICAgIGlmICghaG9zdHMubGVuZ3RoKSB7XG4gICAgICBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uIG1tcy1pbWFnZS1ob3N0LWVtcHR5XCIsIHRleHQ6IFwiXHU1QzFBXHU2NzJBXHU5MTREXHU3RjZFXHU1NkZFXHU1RThBXHUzMDAyXHU2NUIwXHU1ODlFXHU1NDBFXHU1M0VGXHU0RUU1XHU2RDRCXHU4QkQ1XHU0RTBBXHU0RjIwXHU2M0E1XHU1M0UzXHVGRjBDXHU1RTc2XHU5MDA5XHU2MkU5XHU0RTAwXHU0RTJBXHU2MjE2XHU1OTFBXHU0RTJBXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU3NkVFXHU2ODA3XHUzMDAyXCIgfSk7XG4gICAgfVxuXG4gICAgaG9zdHMuZm9yRWFjaCgoaG9zdCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNhcmQgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWltYWdlLWhvc3QtY2FyZFwiIH0pO1xuICAgICAgY29uc3QgdGl0bGUgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbXMtaW1hZ2UtaG9zdC1jYXJkLXRpdGxlXCIgfSk7XG4gICAgICB0aXRsZS5jcmVhdGVFbChcInN0cm9uZ1wiLCB7IHRleHQ6IGhvc3QubmFtZSB8fCBgXHU1NkZFXHU1RThBICR7aW5kZXggKyAxfWAgfSk7XG4gICAgICBjb25zdCBzdGF0dXMgPSB0aXRsZS5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LXN0YXR1c1wiLCB0ZXh0OiBob3N0LmVuYWJsZWQgPyBcIlx1NURGMlx1NTQyRlx1NzUyOFwiIDogXCJcdTVERjJcdTUwNUNcdTc1MjhcIiB9KTtcbiAgICAgIHN0YXR1cy50b2dnbGVDbGFzcyhcImlzLWVuYWJsZWRcIiwgaG9zdC5lbmFibGVkKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdTU0MERcdTc5RjBcIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5uYW1lKVxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihgXHU1NkZFXHU1RThBICR7aW5kZXggKyAxfWApXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaG9zdC5uYW1lID0gdmFsdWUudHJpbSgpIHx8IGBcdTU2RkVcdTVFOEEgJHtpbmRleCArIDF9YDtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAgIC5zZXRUb29sdGlwKFwiXHU1NDJGXHU3NTI4XHU4QkU1XHU1NkZFXHU1RThBXCIpXG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QuZW5hYmxlZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBob3N0LmVuYWJsZWQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWRIb3N0SWRzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IGhvc3QuaWQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNhcmQpXG4gICAgICAgIC5zZXROYW1lKFwiXHU0RTBBXHU0RjIwIEFQSVwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImh0dHBzOi8vZXhhbXBsZS5jb20vYXBpL3VwbG9hZFwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0LmVuZHBvaW50KVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5lbmRwb2ludCA9IHZhbHVlLnRyaW0oKTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdThCRjdcdTZDNDJcdTY1QjlcdTZDRDVcdTRFMEVcdTY4M0NcdTVGMEZcIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKFwiUE9TVFwiLCBcIlBPU1RcIilcbiAgICAgICAgICAuYWRkT3B0aW9uKFwiUFVUXCIsIFwiUFVUXCIpXG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QubWV0aG9kKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5tZXRob2QgPSB2YWx1ZSBhcyBJbWFnZUhvc3RNZXRob2Q7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSlcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKFwibXVsdGlwYXJ0XCIsIFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiKVxuICAgICAgICAgIC5hZGRPcHRpb24oXCJyYXdcIiwgXCJcdTUzOUZcdTU5Q0JcdTRFOENcdThGREJcdTUyMzZcIilcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5ib2R5TW9kZSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuYm9keU1vZGUgPSB2YWx1ZSBhcyBJbWFnZUhvc3RCb2R5TW9kZTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdTY1ODdcdTRFRjZcdTVCNTdcdTZCQjVcdTU0MERcIilcbiAgICAgICAgLnNldERlc2MoXCJtdWx0aXBhcnQgXHU2QTIxXHU1RjBGXHU1RTM4XHU4OUMxXHU1MDNDXHVGRjFBZmlsZVx1MzAwMWltYWdlXHUzMDAxc291cmNlXHUzMDAyXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QuZmllbGROYW1lKVxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImZpbGVcIilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuZmllbGROYW1lID0gdmFsdWUudHJpbSgpIHx8IFwiZmlsZVwiOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjYXJkKVxuICAgICAgICAuc2V0TmFtZShcIlx1OEJGN1x1NkM0Mlx1NTkzNCBKU09OXCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU0RjhCXHU1OTgyIEF1dGhvcml6YXRpb25cdTMwMDFYLUFQSS1LZXlcdTMwMDJcdTVCQzZcdTk0QTVcdTRGRERcdTVCNThcdTU3MjhcdTYzRDJcdTRFRjYgZGF0YS5qc29uXHUzMDAyXCIpXG4gICAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0LmhlYWRlcnMpXG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCd7XCJBdXRob3JpemF0aW9uXCI6XCJCZWFyZXIgLi4uXCJ9JylcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuaGVhZGVycyA9IHZhbHVlLnRyaW0oKTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdThGRDRcdTU2REVcdTdGNTFcdTU3NDBcdTVCNTdcdTZCQjVcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTRGOEJcdTU5ODIgZGF0YS51cmxcdUZGMUJcdTc1NTlcdTdBN0FcdTRGMUFcdTVDMURcdThCRDVcdTVFMzhcdTg5QzFcdTVCNTdcdTZCQjVcdTMwMDJcIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5yZXNwb25zZVBhdGgpXG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiZGF0YS51cmxcIilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QucmVzcG9uc2VQYXRoID0gdmFsdWUudHJpbSgpOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBjb25zdCBpc0F1dG9UYXJnZXQgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5pbmNsdWRlcyhob3N0LmlkKTtcbiAgICAgIG5ldyBTZXR0aW5nKGNhcmQpXG4gICAgICAgIC5zZXROYW1lKFwiXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU3NkVFXHU2ODA3XCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU1M0VGXHU0RUU1XHU1NDBDXHU2NUY2XHU5MDA5XHU2MkU5XHU1OTFBXHU0RTJBXHU1NkZFXHU1RThBXHVGRjFCXHU2MjRCXHU1MkE4XHU0RTBBXHU0RjIwXHU2NUY2XHU0RUNEXHU1M0VGXHU0RTM0XHU2NUY2XHU5MDA5XHU2MkU5XHU1MTc2XHU0RUQ2XHU3RUM0XHU1NDA4XHUzMDAyXCIpXG4gICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKGlzQXV0b1RhcmdldClcbiAgICAgICAgICAuc2V0RGlzYWJsZWQoIWhvc3QuZW5hYmxlZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTZXQodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSBzZWxlY3RlZC5hZGQoaG9zdC5pZCk7IGVsc2Ugc2VsZWN0ZWQuZGVsZXRlKGhvc3QuaWQpO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMgPSBBcnJheS5mcm9tKHNlbGVjdGVkKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pKTtcblxuICAgICAgY29uc3QgYWN0aW9ucyA9IGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LWFjdGlvbnNcIiB9KTtcbiAgICAgIGNvbnN0IHRlc3QgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTY4QzBcdTZENEIgQVBJIFx1OEZERVx1OTAxQVx1NjAyN1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgIHRlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGVzdC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIHRlc3Quc2V0VGV4dChcIlx1NjhDMFx1NkQ0Qlx1NEUyRFx1MjAyNlwiKTtcbiAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi50ZXN0SW1hZ2VIb3N0KGhvc3QuaWQpLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgIHRlc3QuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB0ZXN0LnNldFRleHQoXCJcdTY4QzBcdTZENEIgQVBJIFx1OEZERVx1OTAxQVx1NjAyN1wiKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHJlbW92ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTIyMFx1OTY2NFx1NTZGRVx1NUU4QVwiLCBjbHM6IFwibW9kLXdhcm5pbmdcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICByZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0cyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlSG9zdHMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmlkICE9PSBob3N0LmlkKTtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gaG9zdC5pZCk7XG4gICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU1MjIwXHU5NjY0XHU1NkZFXHU1RThBXHVGRjFBJHtob3N0Lm5hbWV9YCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2NUIwXHU2NTg3XHU0RUY2XHU1NDBEXHU1MjREXHU3RjAwXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NjVCMFx1NUVGQVx1ODExMVx1NTZGRVx1NjVGNlx1NEY3Rlx1NzUyOFx1RkYxQVx1NTI0RFx1N0YwMCArIFx1NjVFNVx1NjcxRlx1NjVGNlx1OTVGNFx1MzAwMlx1NjU4N1x1NEVGNlx1NTQwRVx1N0YwMFx1NTZGQVx1NUI5QVx1NEUzQSAubWluZG1hcFx1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlUHJlZml4KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZVByZWZpeCA9IHZhbHVlLnRyaW0oKSB8fCBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU1RTAzXHU1QzQwXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTM1NVx1NEZBN1x1OTAwMlx1NTQwOFx1NkQ0MVx1N0EwQlx1NjJDNlx1ODlFM1x1RkYwQ1x1NTNDQ1x1NEZBN1x1OTAwMlx1NTQwOFx1NTkzNFx1ODExMVx1OThDRVx1NjZCNFx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcInJpZ2h0XCIsIFwiXHU1NDExXHU1M0YzXHU1QzU1XHU1RjAwXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJiYWxhbmNlZFwiLCBcIlx1NURFNlx1NTNGM1x1NUU3M1x1ODg2MVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdExheW91dClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQgPSB2YWx1ZSBhcyBMYXlvdXRNb2RlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU0RTNCXHU5ODk4XCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwiYXV0b1wiLCBcIlx1OERERlx1OTY4RiBPYnNpZGlhblwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwibGlnaHRcIiwgXCJcdTZENDVcdTgyNzJcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImRhcmtcIiwgXCJcdTZERjFcdTgyNzJcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUaGVtZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUaGVtZSA9IHZhbHVlIGFzIFRoZW1lTW9kZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU3NTNCXHU1RTAzXHU4MENDXHU2NjZGXCIgfSk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBcIlx1ODBDQ1x1NjY2Rlx1OTg5Q1x1ODI3MlwiLFxuICAgICAgXCJcdTc1NTlcdTdBN0FcdTY1RjZcdThEREZcdTk2OEYgT2JzaWRpYW4gXHU1RjUzXHU1MjREXHU0RTNCXHU5ODk4XHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZENvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiNmOGZhZmNcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTNFRlx1OTAwOVx1NjJFOVx1N0Y1MVx1NjgzQ1x1MzAwMVx1NzBCOVx1OTYzNVx1NjIxNlx1N0VBRlx1ODI3Mlx1ODBDQ1x1NjY2Rlx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcIm5vbmVcIiwgXCJcdTY1RTBcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImdyaWRcIiwgXCJcdTdGNTFcdTY4M0NcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImRvdHNcIiwgXCJcdTcwQjlcdTk2MzVcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm4gPSB2YWx1ZSBhcyBCYWNrZ3JvdW5kUGF0dGVybjtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93R3JpZCA9IHZhbHVlICE9PSBcIm5vbmVcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NjNBN1x1NTIzNlx1N0Y1MVx1NjgzQ1x1N0VCRlx1NjIxNlx1NzBCOVx1OTYzNVx1NzY4NFx1OTg5Q1x1ODI3Mlx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm5Db2xvcixcbiAgICAgIGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybkNvbG9yID0gdmFsdWUgfHwgXCIjOTRhM2I4XCI7IH0sXG4gICAgICBcIiM5NGEzYjhcIixcbiAgICAgIGZhbHNlXG4gICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NUI1N1x1NEY1M1x1NEUwRVx1NjU4N1x1NUI1N1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NUI1N1x1NEY1M1wiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcIm9ic2lkaWFuXCIsIFwiXHU4RERGXHU5NjhGIE9ic2lkaWFuXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJzYW5zXCIsIFwiXHU2NUUwXHU4ODZDXHU3RUJGXHU1QjU3XHU0RjUzXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJzZXJpZlwiLCBcIlx1ODg2Q1x1N0VCRlx1NUI1N1x1NEY1M1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwibW9ub1wiLCBcIlx1N0I0OVx1NUJCRFx1NUI1N1x1NEY1M1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiY3VzdG9tXCIsIFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHU1QjU3XHU0RjUzXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250RmFtaWx5KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udEZhbWlseSA9IHZhbHVlIGFzIEZvbnRGYW1pbHlNb2RlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbnRGYW1pbHkgPT09IFwiY3VzdG9tXCIpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1ODFFQVx1NUI5QVx1NEU0OVx1NUI1N1x1NEY1M1x1NTQwRFx1NzlGMFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1NTg2Qlx1NTE5OVx1N0NGQlx1N0VERlx1NEUyRFx1NURGMlx1N0VDRlx1NUI4OVx1ODhDNVx1NzY4NFx1NUI1N1x1NEY1M1x1NTQwRFx1NzlGMFx1RkYwQ1x1NEY4Qlx1NTk4MiBNaWNyb3NvZnQgWWFIZWlcdTMwMDFQaW5nRmFuZyBTQ1x1MzAwMlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIk1pY3Jvc29mdCBZYUhlaVwiKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jdXN0b21Gb250KVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmN1c3RvbUZvbnQgPSB2YWx1ZS50cmltKCkuc2xpY2UoMCwgMTIwKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NUI1N1x1NTNGN1wiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMTBcdTIwMTMzMCBcdTUwQ0ZcdTdEMjBcdTMwMDJcdTgyODJcdTcwQjlcdTRFQ0RcdTUzRUZcdTUzNTVcdTcyRUNcdTg5ODZcdTc2RDZcdTVCNTdcdTUzRjdcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMTAsIDMwLCAxKVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udFNpemUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250U2l6ZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTlFRDhcdThCQTRcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RjdGXHU3NTI4IE9ic2lkaWFuIFx1NEUzQlx1OTg5OFx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3Mlx1RkYxQlx1NjgzOVx1ODI4Mlx1NzBCOVx1NEVDRFx1NEYxOFx1NTE0OFx1NEY3Rlx1NzUyOFx1NEUzQlx1OTg5OFx1NUYzQVx1OEMwM1x1ODI3Mlx1NzY4NFx1NUJGOVx1NkJENFx1NjU4N1x1NUI1N1x1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MudGV4dENvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnRleHRDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjMGYxNzJhXCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NjU4N1x1NUI1N1x1NTJBMFx1N0M5N1wiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NjU4N1x1NUI1N1x1NjU5Q1x1NEY1M1wiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0SXRhbGljKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRleHRJdGFsaWMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTY1ODdcdTVCNTdcdTRFMEJcdTUyMTJcdTdFQkZcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGV4dFVuZGVybGluZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0VW5kZXJsaW5lID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTgyODJcdTcwQjlcdTY4MzdcdTVGMEZcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTgyODJcdTcwQjlcdTVGNjJcdTcyQjZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1M0VBXHU1RjcxXHU1NENEXHU2NzJBXHU1MzU1XHU3MkVDXHU4QkJFXHU3RjZFXHU1RjYyXHU3MkI2XHU3Njg0XHU4MjgyXHU3MEI5XHUzMDAyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwicm91bmRlZFwiLCBcIlx1NTcwNlx1ODlEMlwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwicGlsbFwiLCBcIlx1ODBGNlx1NTZDQVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwicmVjdGFuZ2xlXCIsIFwiXHU3NkY0XHU4OUQyXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Tm9kZVNoYXBlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdE5vZGVTaGFwZSA9IHZhbHVlIGFzIE5vZGVTaGFwZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU5RUQ4XHU4QkE0XHU4MjgyXHU3MEI5XHU4MENDXHU2NjZGXHU4MjcyXCIsXG4gICAgICBcIlx1NzU1OVx1N0E3QVx1NjVGNlx1OERERlx1OTY4RiBPYnNpZGlhbiBcdTRFM0JcdTk4OThcdTMwMDJcdTUzNTVcdTRFMkFcdTgyODJcdTcwQjlcdThCQkVcdTdGNkVcdTc2ODRcdTk4OUNcdTgyNzJcdTRGMThcdTUxNDhcdTdFQTdcdTY2RjRcdTlBRDhcdTMwMDJcIixcbiAgICAgICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCYWNrZ3JvdW5kQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJhY2tncm91bmRDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjZmZmZmZmXCJcbiAgICApO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTlFRDhcdThCQTRcdTgyODJcdTcwQjlcdThGQjlcdTY4NDZcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU4RERGXHU5NjhGIE9ic2lkaWFuIFx1NEUzQlx1OTg5OFx1OEZCOVx1Njg0Nlx1OTg5Q1x1ODI3Mlx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlckNvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCb3JkZXJDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjOTRhM2I4XCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1ODI4Mlx1NzBCOVx1OEZCOVx1Njg0Nlx1N0M5N1x1N0VDNlwiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMFx1MjAxMzYgXHU1MENGXHU3RDIwXHVGRjFCMCBcdTg4NjhcdTc5M0FcdTY1RTBcdThGQjlcdTY4NDZcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMCwgNiwgMC41KVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdThGREVcdTdFQkZcdTY4MzdcdTVGMEZcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdThGREVcdTdFQkZcdTdDN0JcdTU3OEJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJjdXJ2ZWRcIiwgXCJcdTY2RjJcdTdFQkZcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInN0cmFpZ2h0XCIsIFwiXHU3NkY0XHU3RUJGXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJlbGJvd1wiLCBcIlx1NjI5OFx1N0VCRlwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVN0eWxlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVN0eWxlID0gdmFsdWUgYXMgRWRnZVN0eWxlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdThGREVcdTdFQkZcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RTNCXHU5ODk4XHU1RjNBXHU4QzAzXHU4MjcyXHUzMDAyXHU4MjgyXHU3MEI5XHU1MzU1XHU3MkVDXHU4QkJFXHU3RjZFXHU5ODlDXHU4MjcyXHU2NUY2XHVGRjBDXHU1M0VGXHU3RUU3XHU3RUVEXHU0RTNBXHU4QkU1XHU1MjA2XHU2NTJGXHU4RkRFXHU3RUJGXHU3NzQwXHU4MjcyXHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZUNvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiM3YzhhYTVcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4RkRFXHU3RUJGXHU3Qzk3XHU3RUM2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODMwM1x1NTZGNCAwLjVcdTIwMTM4IFx1NTBDRlx1N0QyMFx1MzAwMlwiKVxuICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgLnNldExpbWl0cygwLjUsIDgsIDAuNSlcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU3RjE2XHU4RjkxXHU0RTBFXHU1MTdDXHU1QkI5XCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2MjUzXHU1RjAwXHU2NUU3XHU3MjQ4XHU4MTExXHU1NkZFXHU2NUY2XHU4MUVBXHU1MkE4XHU4RjZDXHU2MzYyXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODFFQVx1NTJBOFx1NTIxQlx1NUVGQVx1NTQwQ1x1NTQwRCAubWluZG1hcCBcdTY1ODdcdTRFRjZcdTVFNzZcdTYyNTNcdTVGMDBcdUZGMUJcdTY1RTdcdTY1ODdcdTRFRjZcdTRGMUFcdTRGRERcdTc1NTlcdTRFM0FcdTU5MDdcdTRFRkRcdUZGMENcdTRFMERcdTRGMUFcdTg5ODZcdTc2RDZcdTYyMTZcdTUyMjBcdTk2NjRcdTMwMDJcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWRpcmVjdExlZ2FjeUZpbGVzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkaXJlY3RMZWdhY3lGaWxlcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2NjNFXHU3OTNBXHU0RUZCXHU1MkExXHU4RkRCXHU1RUE2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTcyOFx1NTMwNVx1NTQyQlx1NEVGQlx1NTJBMVx1NzY4NFx1NTIwNlx1NjUyRlx1ODI4Mlx1NzBCOVx1NUU5NVx1OTBFOFx1NjYzRVx1NzkzQVx1NUI4Q1x1NjIxMFx1NzY3RVx1NTIwNlx1NkJENFx1MzAwMlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrUHJvZ3Jlc3MpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VGFza1Byb2dyZXNzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2MjUzXHU1RjAwXHU2NUY2XHU4MUVBXHU1MkE4XHU5MDAyXHU1RTk0XHU3NTNCXHU1RTAzXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0ZpdE9uT3BlbilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GaXRPbk9wZW4gPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NjRBNFx1OTUwMFx1NTM4Nlx1NTNGMlx1NkI2NVx1NjU3MFwiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMjBcdTIwMTM1MDBcdUZGMUJcdTY1NzBcdTUwM0NcdThEOEFcdTU5MjdcdTUzNjBcdTc1MjhcdTc2ODRcdTUxODVcdTVCNThcdThEOEFcdTU5MUFcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMjAsIDUwMCwgMTApXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTVENENcdTUxNjVcdTk4ODRcdTg5QzhcdTY3MDBcdTU5MjdcdTlBRDhcdTVFQTZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU4MzAzXHU1NkY0IDI0MFx1MjAxMzEyMDAgXHU1MENGXHU3RDIwXHUzMDAyXCIpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDI0MCwgMTIwMCwgMjApXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbWJlZE1heEhlaWdodClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVtYmVkTWF4SGVpZ2h0ID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICBnZXRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPixcbiAgICBmYWxsYmFjazogc3RyaW5nLFxuICAgIGFsbG93UmVzZXQgPSB0cnVlXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXIpXG4gICAgICAuc2V0TmFtZShuYW1lKVxuICAgICAgLnNldERlc2MoZGVzY3JpcHRpb24pXG4gICAgICAuYWRkQ29sb3JQaWNrZXIoKHBpY2tlcikgPT4gcGlja2VyXG4gICAgICAgIC5zZXRWYWx1ZShnZXRWYWx1ZSgpIHx8IGZhbGxiYWNrKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgc2V0VmFsdWUodmFsdWUpO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuICAgIGlmIChhbGxvd1Jlc2V0KSB7XG4gICAgICBzZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiBidXR0b25cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJcdThEREZcdTk2OEZcdTRFM0JcdTk4OThcIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHNldFZhbHVlKFwiXCIpO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFuZFJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5wbHVnaW4ucmVmcmVzaE9wZW5WaWV3cygpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgbm9kZUNvbnRlbnRCbG9ja3MsIG5vZGVQbGFpblRleHQsIHR5cGUgRWRnZVN0eWxlLCB0eXBlIEZvbnRGYW1pbHlNb2RlLCB0eXBlIExheW91dE1vZGUsIHR5cGUgTWluZE1hcEFwcGVhcmFuY2UsIHR5cGUgTWluZE1hcE5vZGUsIHR5cGUgTWluZE1hcFRleHRSdW4sIHR5cGUgTm9kZVNoYXBlIH0gZnJvbSBcIi4vbW9kZWxcIjtcblxuZXhwb3J0IGludGVyZmFjZSBOb2RlUG9zaXRpb24ge1xuICBub2RlOiBNaW5kTWFwTm9kZTtcbiAgcGFyZW50SWQ6IHN0cmluZyB8IG51bGw7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICBkZXB0aDogbnVtYmVyO1xuICBzaWRlOiAtMSB8IDAgfCAxO1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYXlvdXRSZXN1bHQge1xuICBub2RlczogTm9kZVBvc2l0aW9uW107XG4gIGJ5SWQ6IE1hcDxzdHJpbmcsIE5vZGVQb3NpdGlvbj47XG4gIG1pblg6IG51bWJlcjtcbiAgbWF4WDogbnVtYmVyO1xuICBtaW5ZOiBudW1iZXI7XG4gIG1heFk6IG51bWJlcjtcbn1cblxuY29uc3QgUk9PVF9XSURUSCA9IDE5NjtcbmNvbnN0IE5PREVfV0lEVEggPSAxNzY7XG5jb25zdCBIX0dBUCA9IDExMjtcbmNvbnN0IFZfR0FQID0gMjQ7XG5cbmZ1bmN0aW9uIHZpc2libGVDaGlsZHJlbihub2RlOiBNaW5kTWFwTm9kZSk6IE1pbmRNYXBOb2RlW10ge1xuICByZXR1cm4gbm9kZS5jb2xsYXBzZWQgPyBbXSA6IG5vZGUuY2hpbGRyZW47XG59XG5cbmZ1bmN0aW9uIG5vZGVEaW1lbnNpb25zKG5vZGU6IE1pbmRNYXBOb2RlLCBkZXB0aDogbnVtYmVyLCBkZWZhdWx0Rm9udFNpemUgPSAxNCk6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSB7XG4gIGNvbnN0IGZvbnRTaXplID0gbm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplO1xuICBjb25zdCBleHRyYVdpZHRoID0gTWF0aC5tYXgoMCwgZm9udFNpemUgLSAxNCkgKiA0O1xuICBsZXQgd2lkdGggPSAoZGVwdGggPT09IDAgPyBST09UX1dJRFRIIDogTk9ERV9XSURUSCkgKyBleHRyYVdpZHRoO1xuICBsZXQgaGVpZ2h0ID0gMjggKyBNYXRoLm1heCgwLCBmb250U2l6ZSAtIDE0KSAqIDEuNDtcbiAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gIGlmICghYmxvY2tzLmxlbmd0aCkgaGVpZ2h0ICs9IGRlcHRoID09PSAwID8gMzQgOiAyNjtcbiAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICBpZiAoYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiKSB7IHdpZHRoID0gTWF0aC5tYXgod2lkdGgsIDI0MCk7IGhlaWdodCArPSAxMzI7IH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IGxlbmd0aCA9IE1hdGgubWF4KDEsIGJsb2NrLnRleHQubGVuZ3RoKTtcbiAgICAgIHdpZHRoID0gTWF0aC5tYXgod2lkdGgsIE1hdGgubWluKDQ2MCwgODAgKyBNYXRoLm1pbihsZW5ndGgsIDQyKSAqIGZvbnRTaXplICogMC42MikpO1xuICAgICAgaGVpZ2h0ICs9IE1hdGgubWF4KDMwLCBNYXRoLmNlaWwobGVuZ3RoIC8gMzQpICogKGZvbnRTaXplICsgOCkpO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS50YWdzPy5sZW5ndGgpIGhlaWdodCArPSAyMDtcbiAgaWYgKG5vZGUuc3VibWFwKSB7IHdpZHRoID0gTWF0aC5tYXgod2lkdGgsIDIyMCk7IGhlaWdodCArPSAzMDsgfVxuICBpZiAobm9kZS50YWJsZSkge1xuICAgIGNvbnN0IGNvbHVtbnMgPSBNYXRoLm1heCgxLCBub2RlLnRhYmxlLmhlYWRlcnMubGVuZ3RoKTtcbiAgICBjb25zdCB2aXNpYmxlUm93cyA9IE1hdGgubWluKDEwLCBub2RlLnRhYmxlLnJvd3MubGVuZ3RoKTtcbiAgICB3aWR0aCA9IE1hdGgubWluKDcyMCwgTWF0aC5tYXgoMzAwLCBjb2x1bW5zICogMTI0KSk7XG4gICAgaGVpZ2h0ICs9IDQyICsgdmlzaWJsZVJvd3MgKiAzMSArIChub2RlLnRhYmxlLnJvd3MubGVuZ3RoID4gdmlzaWJsZVJvd3MgPyAyNCA6IDApO1xuICB9XG4gIGlmIChub2RlLmNvZGUpIHtcbiAgICBjb25zdCBsaW5lcyA9IG5vZGUuY29kZS5jb2RlLnNwbGl0KC9cXHI/XFxuLyk7XG4gICAgY29uc3QgbG9uZ2VzdCA9IE1hdGgubWF4KDIwLCAuLi5saW5lcy5zbGljZSgwLCA4MCkubWFwKChsaW5lKSA9PiBsaW5lLmxlbmd0aCkpO1xuICAgIHdpZHRoID0gTWF0aC5taW4oNzIwLCBNYXRoLm1heCgzODAsIGxvbmdlc3QgKiA3LjIgKyA0MikpO1xuICAgIGhlaWdodCArPSBNYXRoLm1pbigzOTAsIE1hdGgubWF4KDEwMCwgTWF0aC5taW4obGluZXMubGVuZ3RoLCAxOCkgKiAyMCArIDQ4KSk7XG4gIH1cbiAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodDogTWF0aC5taW4oNTYwLCBoZWlnaHQpIH07XG59XG5cbmZ1bmN0aW9uIHN1YnRyZWVIZWlnaHQobm9kZTogTWluZE1hcE5vZGUsIGRlcHRoOiBudW1iZXIsIGRlZmF1bHRGb250U2l6ZSA9IDE0KTogbnVtYmVyIHtcbiAgY29uc3Qgb3duSGVpZ2h0ID0gbm9kZURpbWVuc2lvbnMobm9kZSwgZGVwdGgsIGRlZmF1bHRGb250U2l6ZSkuaGVpZ2h0O1xuICBjb25zdCBjaGlsZHJlbiA9IHZpc2libGVDaGlsZHJlbihub2RlKTtcbiAgaWYgKCFjaGlsZHJlbi5sZW5ndGgpIHJldHVybiBvd25IZWlnaHQ7XG4gIGNvbnN0IGNoaWxkcmVuSGVpZ2h0ID0gY2hpbGRyZW4ucmVkdWNlKChzdW0sIGNoaWxkKSA9PiBzdW0gKyBzdWJ0cmVlSGVpZ2h0KGNoaWxkLCBkZXB0aCArIDEsIGRlZmF1bHRGb250U2l6ZSksIDApICsgVl9HQVAgKiAoY2hpbGRyZW4ubGVuZ3RoIC0gMSk7XG4gIHJldHVybiBNYXRoLm1heChvd25IZWlnaHQsIGNoaWxkcmVuSGVpZ2h0KTtcbn1cblxuZnVuY3Rpb24gbGF5b3V0QnJhbmNoKFxuICBub2RlOiBNaW5kTWFwTm9kZSxcbiAgcGFyZW50SWQ6IHN0cmluZyxcbiAgcGFyZW50WDogbnVtYmVyLFxuICBwYXJlbnRXaWR0aDogbnVtYmVyLFxuICBzaWRlOiAtMSB8IDEsXG4gIGRlcHRoOiBudW1iZXIsXG4gIGNlbnRlclk6IG51bWJlcixcbiAgb3V0cHV0OiBOb2RlUG9zaXRpb25bXSxcbiAgZGVmYXVsdEZvbnRTaXplID0gMTRcbik6IHZvaWQge1xuICBjb25zdCBkaW1lbnNpb25zID0gbm9kZURpbWVuc2lvbnMobm9kZSwgZGVwdGgsIGRlZmF1bHRGb250U2l6ZSk7XG4gIGNvbnN0IHggPSBwYXJlbnRYICsgc2lkZSAqIChwYXJlbnRXaWR0aCAvIDIgKyBIX0dBUCArIGRpbWVuc2lvbnMud2lkdGggLyAyKTtcbiAgb3V0cHV0LnB1c2goeyBub2RlLCBwYXJlbnRJZCwgeCwgeTogY2VudGVyWSwgZGVwdGgsIHNpZGUsIC4uLmRpbWVuc2lvbnMgfSk7XG4gIGNvbnN0IGNoaWxkcmVuID0gdmlzaWJsZUNoaWxkcmVuKG5vZGUpO1xuICBpZiAoIWNoaWxkcmVuLmxlbmd0aCkgcmV0dXJuO1xuXG4gIGNvbnN0IGhlaWdodHMgPSBjaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiBzdWJ0cmVlSGVpZ2h0KGNoaWxkLCBkZXB0aCArIDEsIGRlZmF1bHRGb250U2l6ZSkpO1xuICBjb25zdCB0b3RhbEhlaWdodCA9IGhlaWdodHMucmVkdWNlKChzdW0sIGNoaWxkSGVpZ2h0KSA9PiBzdW0gKyBjaGlsZEhlaWdodCwgMCkgKyBWX0dBUCAqIChjaGlsZHJlbi5sZW5ndGggLSAxKTtcbiAgbGV0IGN1cnNvciA9IGNlbnRlclkgLSB0b3RhbEhlaWdodCAvIDI7XG4gIGNoaWxkcmVuLmZvckVhY2goKGNoaWxkLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IGNoaWxkSGVpZ2h0ID0gaGVpZ2h0c1tpbmRleF0gPz8gbm9kZURpbWVuc2lvbnMoY2hpbGQsIGRlcHRoICsgMSwgZGVmYXVsdEZvbnRTaXplKS5oZWlnaHQ7XG4gICAgY29uc3QgY2hpbGRDZW50ZXIgPSBjdXJzb3IgKyBjaGlsZEhlaWdodCAvIDI7XG4gICAgbGF5b3V0QnJhbmNoKGNoaWxkLCBub2RlLmlkLCB4LCBkaW1lbnNpb25zLndpZHRoLCBzaWRlLCBkZXB0aCArIDEsIGNoaWxkQ2VudGVyLCBvdXRwdXQsIGRlZmF1bHRGb250U2l6ZSk7XG4gICAgY3Vyc29yICs9IGNoaWxkSGVpZ2h0ICsgVl9HQVA7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxheW91dChyb290OiBNaW5kTWFwTm9kZSwgbW9kZTogTGF5b3V0TW9kZSwgZGVmYXVsdEZvbnRTaXplID0gMTQpOiBMYXlvdXRSZXN1bHQge1xuICBjb25zdCByb290RGltZW5zaW9ucyA9IG5vZGVEaW1lbnNpb25zKHJvb3QsIDAsIGRlZmF1bHRGb250U2l6ZSk7XG4gIGNvbnN0IG5vZGVzOiBOb2RlUG9zaXRpb25bXSA9IFtcbiAgICB7IG5vZGU6IHJvb3QsIHBhcmVudElkOiBudWxsLCB4OiAwLCB5OiAwLCBkZXB0aDogMCwgc2lkZTogMCwgLi4ucm9vdERpbWVuc2lvbnMgfVxuICBdO1xuICBjb25zdCBjaGlsZHJlbiA9IHZpc2libGVDaGlsZHJlbihyb290KTtcblxuICBpZiAobW9kZSA9PT0gXCJiYWxhbmNlZFwiICYmIGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICBjb25zdCBsZWZ0OiBNaW5kTWFwTm9kZVtdID0gW107XG4gICAgY29uc3QgcmlnaHQ6IE1pbmRNYXBOb2RlW10gPSBbXTtcbiAgICBsZXQgbGVmdEhlaWdodCA9IDA7XG4gICAgbGV0IHJpZ2h0SGVpZ2h0ID0gMDtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIFsuLi5jaGlsZHJlbl0uc29ydCgoYSwgYikgPT4gc3VidHJlZUhlaWdodChiLCAxLCBkZWZhdWx0Rm9udFNpemUpIC0gc3VidHJlZUhlaWdodChhLCAxLCBkZWZhdWx0Rm9udFNpemUpKSkge1xuICAgICAgY29uc3QgaGVpZ2h0ID0gc3VidHJlZUhlaWdodChjaGlsZCwgMSwgZGVmYXVsdEZvbnRTaXplKSArIFZfR0FQO1xuICAgICAgaWYgKGxlZnRIZWlnaHQgPD0gcmlnaHRIZWlnaHQpIHtcbiAgICAgICAgbGVmdC5wdXNoKGNoaWxkKTtcbiAgICAgICAgbGVmdEhlaWdodCArPSBoZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByaWdodC5wdXNoKGNoaWxkKTtcbiAgICAgICAgcmlnaHRIZWlnaHQgKz0gaGVpZ2h0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBsYWNlU2lkZSA9IChpdGVtczogTWluZE1hcE5vZGVbXSwgc2lkZTogLTEgfCAxKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBoZWlnaHRzID0gaXRlbXMubWFwKChjaGlsZCkgPT4gc3VidHJlZUhlaWdodChjaGlsZCwgMSwgZGVmYXVsdEZvbnRTaXplKSk7XG4gICAgICBjb25zdCB0b3RhbCA9IGhlaWdodHMucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkgKyBWX0dBUCAqIE1hdGgubWF4KDAsIGl0ZW1zLmxlbmd0aCAtIDEpO1xuICAgICAgbGV0IGN1cnNvciA9IC10b3RhbCAvIDI7XG4gICAgICBpdGVtcy5mb3JFYWNoKChjaGlsZCwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gaGVpZ2h0c1tpbmRleF0gPz8gbm9kZURpbWVuc2lvbnMoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkuaGVpZ2h0O1xuICAgICAgICBsYXlvdXRCcmFuY2goY2hpbGQsIHJvb3QuaWQsIDAsIHJvb3REaW1lbnNpb25zLndpZHRoLCBzaWRlLCAxLCBjdXJzb3IgKyBoZWlnaHQgLyAyLCBub2RlcywgZGVmYXVsdEZvbnRTaXplKTtcbiAgICAgICAgY3Vyc29yICs9IGhlaWdodCArIFZfR0FQO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBwbGFjZVNpZGUobGVmdCwgLTEpO1xuICAgIHBsYWNlU2lkZShyaWdodCwgMSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaGVpZ2h0cyA9IGNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IHN1YnRyZWVIZWlnaHQoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkpO1xuICAgIGNvbnN0IHRvdGFsID0gaGVpZ2h0cy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSArIFZfR0FQICogTWF0aC5tYXgoMCwgY2hpbGRyZW4ubGVuZ3RoIC0gMSk7XG4gICAgbGV0IGN1cnNvciA9IC10b3RhbCAvIDI7XG4gICAgY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBoZWlnaHQgPSBoZWlnaHRzW2luZGV4XSA/PyBub2RlRGltZW5zaW9ucyhjaGlsZCwgMSwgZGVmYXVsdEZvbnRTaXplKS5oZWlnaHQ7XG4gICAgICBsYXlvdXRCcmFuY2goY2hpbGQsIHJvb3QuaWQsIDAsIHJvb3REaW1lbnNpb25zLndpZHRoLCAxLCAxLCBjdXJzb3IgKyBoZWlnaHQgLyAyLCBub2RlcywgZGVmYXVsdEZvbnRTaXplKTtcbiAgICAgIGN1cnNvciArPSBoZWlnaHQgKyBWX0dBUDtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGJ5SWQgPSBuZXcgTWFwKG5vZGVzLm1hcCgocG9zaXRpb24pID0+IFtwb3NpdGlvbi5ub2RlLmlkLCBwb3NpdGlvbl0pKTtcbiAgY29uc3QgbWluWCA9IE1hdGgubWluKC4uLm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHBvc2l0aW9uLnggLSBwb3NpdGlvbi53aWR0aCAvIDIpKTtcbiAgY29uc3QgbWF4WCA9IE1hdGgubWF4KC4uLm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHBvc2l0aW9uLnggKyBwb3NpdGlvbi53aWR0aCAvIDIpKTtcbiAgY29uc3QgbWluWSA9IE1hdGgubWluKC4uLm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHBvc2l0aW9uLnkgLSBwb3NpdGlvbi5oZWlnaHQgLyAyKSk7XG4gIGNvbnN0IG1heFkgPSBNYXRoLm1heCguLi5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi55ICsgcG9zaXRpb24uaGVpZ2h0IC8gMikpO1xuICByZXR1cm4geyBub2RlcywgYnlJZCwgbWluWCwgbWF4WCwgbWluWSwgbWF4WSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWRnZVBhdGgocGFyZW50OiBOb2RlUG9zaXRpb24sIGNoaWxkOiBOb2RlUG9zaXRpb24sIHN0eWxlOiBFZGdlU3R5bGUgPSBcImN1cnZlZFwiKTogc3RyaW5nIHtcbiAgY29uc3QgcGFyZW50WCA9IHBhcmVudC54ICsgKGNoaWxkLnNpZGUgPj0gMCA/IHBhcmVudC53aWR0aCAvIDIgOiAtcGFyZW50LndpZHRoIC8gMik7XG4gIGNvbnN0IGNoaWxkWCA9IGNoaWxkLnggLSAoY2hpbGQuc2lkZSA+PSAwID8gY2hpbGQud2lkdGggLyAyIDogLWNoaWxkLndpZHRoIC8gMik7XG4gIGlmIChzdHlsZSA9PT0gXCJzdHJhaWdodFwiKSByZXR1cm4gYE0gJHtwYXJlbnRYfSAke3BhcmVudC55fSBMICR7Y2hpbGRYfSAke2NoaWxkLnl9YDtcbiAgY29uc3QgbWlkZGxlWCA9IHBhcmVudFggKyAoY2hpbGRYIC0gcGFyZW50WCkgKiAwLjU7XG4gIGlmIChzdHlsZSA9PT0gXCJlbGJvd1wiKSByZXR1cm4gYE0gJHtwYXJlbnRYfSAke3BhcmVudC55fSBMICR7bWlkZGxlWH0gJHtwYXJlbnQueX0gTCAke21pZGRsZVh9ICR7Y2hpbGQueX0gTCAke2NoaWxkWH0gJHtjaGlsZC55fWA7XG4gIHJldHVybiBgTSAke3BhcmVudFh9ICR7cGFyZW50Lnl9IEMgJHttaWRkbGVYfSAke3BhcmVudC55fSwgJHttaWRkbGVYfSAke2NoaWxkLnl9LCAke2NoaWxkWH0gJHtjaGlsZC55fWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVYbWwodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bPD4mXCInXS9nLCAoY2hhcmFjdGVyKSA9PiB7XG4gICAgY29uc3QgZW50aXRpZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IFwiPFwiOiBcIiZsdDtcIiwgXCI+XCI6IFwiJmd0O1wiLCBcIiZcIjogXCImYW1wO1wiLCAnXCInOiBcIiZxdW90O1wiLCBcIidcIjogXCImYXBvcztcIiB9O1xuICAgIHJldHVybiBlbnRpdGllc1tjaGFyYWN0ZXJdID8/IGNoYXJhY3RlcjtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkQ29sb3IodmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZSAmJiAvXiNbMC05YS1mXXs2fSQvaS50ZXN0KHZhbHVlKSA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIHN2Z1JhZGl1cyhzaGFwZTogTm9kZVNoYXBlIHwgdW5kZWZpbmVkKTogbnVtYmVyIHtcbiAgaWYgKHNoYXBlID09PSBcInJlY3RhbmdsZVwiKSByZXR1cm4gMztcbiAgaWYgKHNoYXBlID09PSBcInBpbGxcIikgcmV0dXJuIDI4O1xuICByZXR1cm4gMTQ7XG59XG5cbmZ1bmN0aW9uIHRhc2tHbHlwaChub2RlOiBNaW5kTWFwTm9kZSk6IHN0cmluZyB7XG4gIGlmIChub2RlLnRhc2sgPT09IFwiZG9uZVwiKSByZXR1cm4gXCJcdTI3MTMgXCI7XG4gIGlmIChub2RlLnRhc2sgPT09IFwiZG9pbmdcIikgcmV0dXJuIFwiXHUyNUQwIFwiO1xuICBpZiAobm9kZS50YXNrID09PSBcInRvZG9cIikgcmV0dXJuIFwiXHUyNUNCIFwiO1xuICByZXR1cm4gXCJcIjtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGVSdW5zKHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10sIG1heExlbmd0aDogbnVtYmVyKTogTWluZE1hcFRleHRSdW5bXSB7XG4gIGNvbnN0IHJlc3VsdDogTWluZE1hcFRleHRSdW5bXSA9IFtdO1xuICBsZXQgcmVtYWluaW5nID0gbWF4TGVuZ3RoO1xuICBsZXQgdHJ1bmNhdGVkID0gZmFsc2U7XG4gIGZvciAoY29uc3QgcnVuIG9mIHJ1bnMpIHtcbiAgICBpZiAocmVtYWluaW5nIDw9IDApIHsgdHJ1bmNhdGVkID0gdHJ1ZTsgYnJlYWs7IH1cbiAgICBpZiAocnVuLnRleHQubGVuZ3RoIDw9IHJlbWFpbmluZykge1xuICAgICAgcmVzdWx0LnB1c2goeyB0ZXh0OiBydW4udGV4dCwgc3R5bGU6IHJ1bi5zdHlsZSB9KTtcbiAgICAgIHJlbWFpbmluZyAtPSBydW4udGV4dC5sZW5ndGg7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goeyB0ZXh0OiBydW4udGV4dC5zbGljZSgwLCByZW1haW5pbmcpLCBzdHlsZTogcnVuLnN0eWxlIH0pO1xuICAgIHJlbWFpbmluZyA9IDA7XG4gICAgdHJ1bmNhdGVkID0gdHJ1ZTtcbiAgfVxuICBpZiAodHJ1bmNhdGVkICYmIHJlc3VsdC5sZW5ndGgpIHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0hLnRleHQgPSBgJHtyZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdIS50ZXh0LnNsaWNlKDAsIC0xKX1cdTIwMjZgO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiByaWNoVGV4dFRzcGFucyhydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQ6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIGZvcmVncm91bmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHNvdXJjZTogTWluZE1hcFRleHRSdW5bXSA9IFtcbiAgICAuLi4ocHJlZml4ID8gW3sgdGV4dDogcHJlZml4IH1dIDogW10pLFxuICAgIC4uLihydW5zPy5sZW5ndGggPyBydW5zIDogW3sgdGV4dDogZmFsbGJhY2tUZXh0IH1dKVxuICBdO1xuICByZXR1cm4gdHJ1bmNhdGVSdW5zKHNvdXJjZSwgNDIpLm1hcCgocnVuKSA9PiB7XG4gICAgY29uc3Qgc3R5bGUgPSBydW4uc3R5bGU7XG4gICAgY29uc3QgYXR0cmlidXRlczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAoc3R5bGU/LmNvbG9yKSBhdHRyaWJ1dGVzLnB1c2goYGZpbGw9XCIke3ZhbGlkQ29sb3Ioc3R5bGUuY29sb3IsIGZvcmVncm91bmQpfVwiYCk7XG4gICAgaWYgKHN0eWxlPy5ib2xkICE9PSB1bmRlZmluZWQpIGF0dHJpYnV0ZXMucHVzaChgZm9udC13ZWlnaHQ9XCIke3N0eWxlLmJvbGQgPyA3MDAgOiA0MDB9XCJgKTtcbiAgICBpZiAoc3R5bGU/Lml0YWxpYyAhPT0gdW5kZWZpbmVkKSBhdHRyaWJ1dGVzLnB1c2goYGZvbnQtc3R5bGU9XCIke3N0eWxlLml0YWxpYyA/IFwiaXRhbGljXCIgOiBcIm5vcm1hbFwifVwiYCk7XG4gICAgY29uc3QgZGVjb3JhdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHN0eWxlPy51bmRlcmxpbmUpIGRlY29yYXRpb25zLnB1c2goXCJ1bmRlcmxpbmVcIik7XG4gICAgaWYgKHN0eWxlPy5zdHJpa2UpIGRlY29yYXRpb25zLnB1c2goXCJsaW5lLXRocm91Z2hcIik7XG4gICAgaWYgKGRlY29yYXRpb25zLmxlbmd0aCkgYXR0cmlidXRlcy5wdXNoKGB0ZXh0LWRlY29yYXRpb249XCIke2RlY29yYXRpb25zLmpvaW4oXCIgXCIpfVwiYCk7XG4gICAgcmV0dXJuIGA8dHNwYW4gJHthdHRyaWJ1dGVzLmpvaW4oXCIgXCIpfT4ke2VzY2FwZVhtbChydW4udGV4dCl9PC90c3Bhbj5gO1xuICB9KS5qb2luKFwiXCIpO1xufVxuXG5mdW5jdGlvbiBzdmdGb250RmFtaWx5KG1vZGU6IEZvbnRGYW1pbHlNb2RlIHwgdW5kZWZpbmVkLCBjdXN0b21Gb250OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAobW9kZSA9PT0gXCJzZXJpZlwiKSByZXR1cm4gJ0dlb3JnaWEsXCJUaW1lcyBOZXcgUm9tYW5cIixzZXJpZic7XG4gIGlmIChtb2RlID09PSBcIm1vbm9cIikgcmV0dXJuICdcIlNGTW9uby1SZWd1bGFyXCIsQ29uc29sYXMsXCJMaWJlcmF0aW9uIE1vbm9cIixtb25vc3BhY2UnO1xuICBpZiAobW9kZSA9PT0gXCJjdXN0b21cIiAmJiBjdXN0b21Gb250Py50cmltKCkpIHJldHVybiBgXCIke2N1c3RvbUZvbnQudHJpbSgpLnJlcGxhY2VBbGwoJ1wiJywgJycpfVwiLHNhbnMtc2VyaWZgO1xuICByZXR1cm4gJ0ludGVyLC1hcHBsZS1zeXN0ZW0sQmxpbmtNYWNTeXN0ZW1Gb250LFwiU2Vnb2UgVUlcIixzYW5zLXNlcmlmJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvY3VtZW50VG9Tdmcocm9vdDogTWluZE1hcE5vZGUsIG1vZGU6IExheW91dE1vZGUsIHRpdGxlOiBzdHJpbmcsIGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlID0ge30pOiBzdHJpbmcge1xuICBjb25zdCBkZWZhdWx0Rm9udFNpemUgPSBhcHBlYXJhbmNlLmZvbnRTaXplID8/IDE0O1xuICBjb25zdCBsYXlvdXQgPSBjb21wdXRlTGF5b3V0KHJvb3QsIG1vZGUsIGRlZmF1bHRGb250U2l6ZSk7XG4gIGNvbnN0IHBhZGRpbmcgPSA3MjtcbiAgY29uc3Qgd2lkdGggPSBNYXRoLm1heCgzMjAsIGxheW91dC5tYXhYIC0gbGF5b3V0Lm1pblggKyBwYWRkaW5nICogMik7XG4gIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KDIyMCwgbGF5b3V0Lm1heFkgLSBsYXlvdXQubWluWSArIHBhZGRpbmcgKiAyKTtcbiAgY29uc3Qgb2Zmc2V0WCA9IHBhZGRpbmcgLSBsYXlvdXQubWluWDtcbiAgY29uc3Qgb2Zmc2V0WSA9IHBhZGRpbmcgLSBsYXlvdXQubWluWTtcbiAgY29uc3QgZWRnZVN0eWxlID0gYXBwZWFyYW5jZS5lZGdlU3R5bGUgPz8gXCJjdXJ2ZWRcIjtcbiAgY29uc3QgZWRnZVdpZHRoID0gYXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gMi4yO1xuICBjb25zdCBkZWZhdWx0RWRnZSA9IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5lZGdlQ29sb3IsIFwiIzdjOGFhNVwiKTtcbiAgY29uc3QgZWRnZXMgPSBsYXlvdXQubm9kZXNcbiAgICAuZmlsdGVyKChwb3NpdGlvbikgPT4gcG9zaXRpb24ucGFyZW50SWQpXG4gICAgLm1hcCgocG9zaXRpb24pID0+IHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHBvc2l0aW9uLnBhcmVudElkID8gbGF5b3V0LmJ5SWQuZ2V0KHBvc2l0aW9uLnBhcmVudElkKSA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IHZhbGlkQ29sb3IocG9zaXRpb24ubm9kZS5zdHlsZT8uY29sb3IsIGRlZmF1bHRFZGdlKTtcbiAgICAgIHJldHVybiBwYXJlbnQgPyBgPHBhdGggZD1cIiR7ZWRnZVBhdGgocGFyZW50LCBwb3NpdGlvbiwgZWRnZVN0eWxlKX1cIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiR7c3Ryb2tlfVwiIHN0cm9rZS13aWR0aD1cIiR7ZWRnZVdpZHRofVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIG9wYWNpdHk9XCIwLjhcIi8+YCA6IFwiXCI7XG4gICAgfSlcbiAgICAuam9pbihcIlxcblwiKTtcblxuICBjb25zdCBub2RlcyA9IGxheW91dC5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiB7XG4gICAgY29uc3Qgbm9kZSA9IHBvc2l0aW9uLm5vZGU7XG4gICAgY29uc3QgeCA9IHBvc2l0aW9uLnggLSBwb3NpdGlvbi53aWR0aCAvIDI7XG4gICAgY29uc3QgeSA9IHBvc2l0aW9uLnkgLSBwb3NpdGlvbi5oZWlnaHQgLyAyO1xuICAgIGNvbnN0IGlzUm9vdCA9IHBvc2l0aW9uLmRlcHRoID09PSAwO1xuICAgIGNvbnN0IGRlZmF1bHRCYWNrZ3JvdW5kID0gaXNSb290ID8gXCIjNGY0NmU1XCIgOiB2YWxpZENvbG9yKGFwcGVhcmFuY2Uubm9kZUNvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgY29uc3QgZGVmYXVsdFRleHQgPSBpc1Jvb3QgPyBcIiNmZmZmZmZcIiA6IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS50ZXh0Q29sb3IsIFwiIzBmMTcyYVwiKTtcbiAgICBjb25zdCBiYWNrZ3JvdW5kID0gdmFsaWRDb2xvcihub2RlLnN0eWxlPy5jb2xvciwgZGVmYXVsdEJhY2tncm91bmQpO1xuICAgIGNvbnN0IGZvcmVncm91bmQgPSB2YWxpZENvbG9yKG5vZGUuc3R5bGU/LnRleHRDb2xvciwgZGVmYXVsdFRleHQpO1xuICAgIGNvbnN0IGJvcmRlciA9IHZhbGlkQ29sb3Iobm9kZS5zdHlsZT8uYm9yZGVyQ29sb3IsIGlzUm9vdCA/IGJhY2tncm91bmQgOiB2YWxpZENvbG9yKGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yLCBcIiM5NGEzYjhcIikpO1xuICAgIGNvbnN0IGJvcmRlcldpZHRoID0gbm9kZS5zdHlsZT8uYm9yZGVyV2lkdGggPz8gYXBwZWFyYW5jZS5ub2RlQm9yZGVyV2lkdGggPz8gKGlzUm9vdCA/IDIgOiAxKTtcbiAgICBjb25zdCBwcmVmaXggPSBgJHtub2RlLmljb24gPyBgJHtub2RlLmljb259IGAgOiBcIlwifSR7dGFza0dseXBoKG5vZGUpfWA7XG4gICAgY29uc3QgY29udGVudEJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpO1xuICAgIGxldCBjb250ZW50WSA9IHkgKyAyODtcbiAgICBjb25zdCBjb250ZW50UGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IHByZWZpeFVzZWQgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGNvbnRlbnRCbG9ja3MpIHtcbiAgICAgIGlmIChibG9jay50eXBlID09PSBcImltYWdlXCIpIHtcbiAgICAgICAgY29udGVudFBhcnRzLnB1c2goYDxyZWN0IHg9XCIke3Bvc2l0aW9uLnggLSA3MH1cIiB5PVwiJHtjb250ZW50WSAtIDE0fVwiIHdpZHRoPVwiMTQwXCIgaGVpZ2h0PVwiOTRcIiByeD1cIjhcIiBmaWxsPVwicmdiYSgxMjcsMTI3LDEyNywuMTIpXCIvPjx0ZXh0IHg9XCIke3Bvc2l0aW9uLnh9XCIgeT1cIiR7Y29udGVudFkgKyAzOH1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiMTJcIj5cdUQ4M0RcdUREQkMgJHtlc2NhcGVYbWwoKGJsb2NrLmFsdCA/PyBcIlx1NTZGRVx1NzI0N1wiKS5zbGljZSgwLCAyMCkpfTwvdGV4dD5gKTtcbiAgICAgICAgY29udGVudFkgKz0gMTEyO1xuICAgICAgfSBlbHNlIGlmIChibG9jay50ZXh0LnRyaW0oKSkge1xuICAgICAgICBjb25zdCBibG9ja1ByZWZpeCA9IHByZWZpeFVzZWQgPyBcIlwiIDogcHJlZml4O1xuICAgICAgICBwcmVmaXhVc2VkID0gdHJ1ZTtcbiAgICAgICAgY29udGVudFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3Bvc2l0aW9uLnh9XCIgeT1cIiR7Y29udGVudFl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIiR7bm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplfVwiPiR7cmljaFRleHRUc3BhbnMoYmxvY2sucmljaFRleHQsIGJsb2NrLnRleHQsIGJsb2NrUHJlZml4LCBmb3JlZ3JvdW5kKX08L3RleHQ+YCk7XG4gICAgICAgIGNvbnRlbnRZICs9IChub2RlLnN0eWxlPy5mb250U2l6ZSA/PyBkZWZhdWx0Rm9udFNpemUpICsgMTU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghY29udGVudEJsb2Nrcy5sZW5ndGgpIGNvbnRlbnRQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke2NvbnRlbnRZfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCIke25vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZX1cIj4ke2VzY2FwZVhtbChwcmVmaXggfHwgbm9kZVBsYWluVGV4dChub2RlKSB8fCBcIlx1NTZGRVx1NzI0N1x1ODI4Mlx1NzBCOVwiKX08L3RleHQ+YCk7XG4gICAgbGV0IHJpY2hZID0gY29udGVudFkgKyAxMDtcbiAgICBjb25zdCByaWNoUGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKG5vZGUuc3VibWFwKSB7XG4gICAgICByaWNoUGFydHMucHVzaChgPHJlY3QgeD1cIiR7eCArIDEyfVwiIHk9XCIke3JpY2hZfVwiIHdpZHRoPVwiJHtwb3NpdGlvbi53aWR0aCAtIDI0fVwiIGhlaWdodD1cIjI1XCIgcng9XCI2XCIgZmlsbD1cInJnYmEoOTksMTAyLDI0MSwuMTApXCIgc3Ryb2tlPVwiJHtmb3JlZ3JvdW5kfVwiIHN0cm9rZS1vcGFjaXR5PVwiLjI4XCIgc3Ryb2tlLWRhc2hhcnJheT1cIjQgM1wiLz48dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke3JpY2hZICsgMTd9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIjEwXCI+XHUyMUIzICR7ZXNjYXBlWG1sKChub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRoKS5zbGljZSgwLCA1NCkpfTwvdGV4dD5gKTtcbiAgICAgIHJpY2hZICs9IDM0O1xuICAgIH1cbiAgICBpZiAobm9kZS50YWJsZSkge1xuICAgICAgY29uc3Qgcm93cyA9IFtub2RlLnRhYmxlLmhlYWRlcnMsIC4uLm5vZGUudGFibGUucm93cy5zbGljZSgwLCA4KV07XG4gICAgICByb3dzLmZvckVhY2goKHJvdywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qgcm93VGV4dCA9IGVzY2FwZVhtbChyb3cubWFwKChjZWxsKSA9PiBjZWxsLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCIgXCIpKS5qb2luKFwiICB8ICBcIikuc2xpY2UoMCwgMTAwKSk7XG4gICAgICAgIHJpY2hQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHt4ICsgMTZ9XCIgeT1cIiR7cmljaFkgKyBpbmRleCAqIDIzfVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiJHtpbmRleCA9PT0gMCA/IDEwLjUgOiA5LjV9XCIgZm9udC13ZWlnaHQ9XCIke2luZGV4ID09PSAwID8gNzAwIDogNDAwfVwiPiR7cm93VGV4dH08L3RleHQ+YCk7XG4gICAgICB9KTtcbiAgICAgIGlmIChub2RlLnRhYmxlLnJvd3MubGVuZ3RoID4gOCkgcmljaFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3ggKyAxNn1cIiB5PVwiJHtyaWNoWSArIHJvd3MubGVuZ3RoICogMjN9XCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBvcGFjaXR5PVwiLjY1XCIgZm9udC1zaXplPVwiOVwiPlx1MjAyNiBcdThGRDhcdTY3MDkgJHtub2RlLnRhYmxlLnJvd3MubGVuZ3RoIC0gOH0gXHU4ODRDPC90ZXh0PmApO1xuICAgIH1cbiAgICBpZiAobm9kZS5jb2RlKSB7XG4gICAgICByaWNoUGFydHMucHVzaChgPHJlY3QgeD1cIiR7eCArIDEyfVwiIHk9XCIke3JpY2hZIC0gMTR9XCIgd2lkdGg9XCIke3Bvc2l0aW9uLndpZHRoIC0gMjR9XCIgaGVpZ2h0PVwiJHtNYXRoLm1pbigzNTAsIE1hdGgubWF4KDgwLCBub2RlLmNvZGUuY29kZS5zcGxpdCgvXFxyP1xcbi8pLmxlbmd0aCAqIDE3ICsgMzQpKX1cIiByeD1cIjdcIiBmaWxsPVwicmdiYSgxNSwyMyw0MiwuMTApXCIvPmApO1xuICAgICAgcmljaFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3ggKyAyMH1cIiB5PVwiJHtyaWNoWSArIDN9XCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBvcGFjaXR5PVwiLjdcIiBmb250LXNpemU9XCI5XCI+JHtlc2NhcGVYbWwobm9kZS5jb2RlLmxhbmd1YWdlIHx8IFwiY29kZVwiKX08L3RleHQ+YCk7XG4gICAgICBub2RlLmNvZGUuY29kZS5zcGxpdCgvXFxyP1xcbi8pLnNsaWNlKDAsIDE2KS5mb3JFYWNoKChsaW5lLCBpbmRleCkgPT4gcmljaFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3ggKyAyMH1cIiB5PVwiJHtyaWNoWSArIDIzICsgaW5kZXggKiAxN31cIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIjlcIiBmb250LWZhbWlseT1cIm1vbm9zcGFjZVwiPiR7ZXNjYXBlWG1sKGxpbmUuc2xpY2UoMCwgOTIpKX08L3RleHQ+YCkpO1xuICAgIH1cbiAgICBjb25zdCByaWNoQ29udGVudCA9IHJpY2hQYXJ0cy5qb2luKFwiXCIpO1xuICAgIGNvbnN0IHRhZ3MgPSBub2RlLnRhZ3M/Lmxlbmd0aFxuICAgICAgPyBgPHRleHQgeD1cIiR7cG9zaXRpb24ueH1cIiB5PVwiJHtwb3NpdGlvbi55ICsgcG9zaXRpb24uaGVpZ2h0IC8gMiAtIDl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIG9wYWNpdHk9XCIuNzJcIiBmb250LXNpemU9XCIxMFwiPiR7ZXNjYXBlWG1sKG5vZGUudGFncy5tYXAoKHRhZykgPT4gYCMke3RhZ31gKS5qb2luKFwiICBcIikuc2xpY2UoMCwgNDgpKX08L3RleHQ+YFxuICAgICAgOiBcIlwiO1xuICAgIGNvbnN0IGJvbGQgPSBub2RlLnN0eWxlPy5ib2xkID8/IGFwcGVhcmFuY2UuYm9sZCA/PyBmYWxzZTtcbiAgICBjb25zdCBpdGFsaWMgPSBub2RlLnN0eWxlPy5pdGFsaWMgPz8gYXBwZWFyYW5jZS5pdGFsaWMgPz8gZmFsc2U7XG4gICAgY29uc3QgdW5kZXJsaW5lID0gbm9kZS5zdHlsZT8udW5kZXJsaW5lID8/IGFwcGVhcmFuY2UudW5kZXJsaW5lID8/IGZhbHNlO1xuICAgIGNvbnN0IGZvbnRTaXplID0gbm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplO1xuICAgIHJldHVybiBgPGc+PHJlY3QgeD1cIiR7eH1cIiB5PVwiJHt5fVwiIHdpZHRoPVwiJHtwb3NpdGlvbi53aWR0aH1cIiBoZWlnaHQ9XCIke3Bvc2l0aW9uLmhlaWdodH1cIiByeD1cIiR7c3ZnUmFkaXVzKG5vZGUuc3R5bGU/LnNoYXBlKX1cIiBmaWxsPVwiJHtiYWNrZ3JvdW5kfVwiIHN0cm9rZT1cIiR7Ym9yZGVyfVwiIHN0cm9rZS13aWR0aD1cIiR7Ym9yZGVyV2lkdGh9XCIvPjxnIGZvbnQtd2VpZ2h0PVwiJHtpc1Jvb3QgfHwgYm9sZCA/IDcwMCA6IDQwMH1cIiBmb250LXN0eWxlPVwiJHtpdGFsaWMgPyBcIml0YWxpY1wiIDogXCJub3JtYWxcIn1cIiB0ZXh0LWRlY29yYXRpb249XCIke3VuZGVybGluZSA/IFwidW5kZXJsaW5lXCIgOiBcIm5vbmVcIn1cIj4ke2NvbnRlbnRQYXJ0cy5qb2luKFwiXCIpfTwvZz4ke3JpY2hDb250ZW50fSR7dGFnc308L2c+YDtcbiAgfSkuam9pbihcIlxcblwiKTtcblxuICBjb25zdCBiYWNrZ3JvdW5kID0gdmFsaWRDb2xvcihhcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvciwgXCIjZjhmYWZjXCIpO1xuICBjb25zdCBwYXR0ZXJuQ29sb3IgPSB2YWxpZENvbG9yKGFwcGVhcmFuY2UucGF0dGVybkNvbG9yLCBcIiM5NGEzYjhcIik7XG4gIGNvbnN0IHBhdHRlcm4gPSBhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID8/IFwibm9uZVwiO1xuICBjb25zdCBkZWZzID0gcGF0dGVybiA9PT0gXCJncmlkXCJcbiAgICA/IGA8ZGVmcz48cGF0dGVybiBpZD1cIm1tYy1wYXR0ZXJuXCIgd2lkdGg9XCIyNFwiIGhlaWdodD1cIjI0XCIgcGF0dGVyblVuaXRzPVwidXNlclNwYWNlT25Vc2VcIj48cGF0aCBkPVwiTSAyNCAwIEwgMCAwIDAgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiR7cGF0dGVybkNvbG9yfVwiIHN0cm9rZS13aWR0aD1cIjFcIiBvcGFjaXR5PVwiLjE4XCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIGZpbGw9XCJ1cmwoI21tYy1wYXR0ZXJuKVwiLz5gXG4gICAgOiBwYXR0ZXJuID09PSBcImRvdHNcIlxuICAgICAgPyBgPGRlZnM+PHBhdHRlcm4gaWQ9XCJtbWMtcGF0dGVyblwiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHBhdHRlcm5Vbml0cz1cInVzZXJTcGFjZU9uVXNlXCI+PGNpcmNsZSBjeD1cIjJcIiBjeT1cIjJcIiByPVwiMS41XCIgZmlsbD1cIiR7cGF0dGVybkNvbG9yfVwiIG9wYWNpdHk9XCIuMjhcIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCIgZmlsbD1cInVybCgjbW1jLXBhdHRlcm4pXCIvPmBcbiAgICAgIDogXCJcIjtcblxuICByZXR1cm4gYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PlxuPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCIke01hdGguY2VpbCh3aWR0aCl9XCIgaGVpZ2h0PVwiJHtNYXRoLmNlaWwoaGVpZ2h0KX1cIiB2aWV3Qm94PVwiMCAwICR7TWF0aC5jZWlsKHdpZHRoKX0gJHtNYXRoLmNlaWwoaGVpZ2h0KX1cIj5cbjx0aXRsZT4ke2VzY2FwZVhtbCh0aXRsZSl9PC90aXRsZT5cbjxzdHlsZT5zdmd7YmFja2dyb3VuZDoke2JhY2tncm91bmR9O2ZvbnQtZmFtaWx5OiR7c3ZnRm9udEZhbWlseShhcHBlYXJhbmNlLmZvbnRGYW1pbHksIGFwcGVhcmFuY2UuY3VzdG9tRm9udCl9fTwvc3R5bGU+XG4ke2RlZnN9PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKCR7b2Zmc2V0WH0gJHtvZmZzZXRZfSlcIj4ke2VkZ2VzfSR7bm9kZXN9PC9nPlxuPC9zdmc+YDtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IEFwcCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGRvY3VtZW50VG9TdmcgfSBmcm9tIFwiLi9sYXlvdXRcIjtcbmltcG9ydCB7IG1lcmdlQXBwZWFyYW5jZSwgcGFyc2VEb2N1bWVudCwgdHlwZSBNaW5kTWFwQXBwZWFyYW5jZSwgdHlwZSBNaW5kTWFwRG9jdW1lbnQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3RhdGljTWluZE1hcChcbiAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCxcbiAgb3B0aW9ucz86IHsgYXBwPzogQXBwOyBmaWxlPzogVEZpbGU7IG1heEhlaWdodD86IG51bWJlcjsgZGVmYXVsdEFwcGVhcmFuY2U/OiBNaW5kTWFwQXBwZWFyYW5jZSB9XG4pOiB2b2lkIHtcbiAgY29udGFpbmVyLmVtcHR5KCk7XG4gIGNvbnRhaW5lci5hZGRDbGFzcyhcIm1tYy1zdGF0aWMtcHJldmlld1wiKTtcbiAgY29uc3Qgc3ZnID0gZG9jdW1lbnRUb1N2Zyhkb2N1bWVudC5yb290LCBkb2N1bWVudC5sYXlvdXQsIGRvY3VtZW50LnRpdGxlLCBtZXJnZUFwcGVhcmFuY2Uob3B0aW9ucz8uZGVmYXVsdEFwcGVhcmFuY2UsIGRvY3VtZW50LmFwcGVhcmFuY2UpKTtcbiAgY29uc3QgaW1hZ2UgPSBjb250YWluZXIuY3JlYXRlRWwoXCJpbWdcIiwge1xuICAgIGF0dHI6IHtcbiAgICAgIGFsdDogYCR7ZG9jdW1lbnQudGl0bGV9IFx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVx1OTg4NFx1ODlDOGAsXG4gICAgICBzcmM6IGBkYXRhOmltYWdlL3N2Zyt4bWw7Y2hhcnNldD11dGYtOCwke2VuY29kZVVSSUNvbXBvbmVudChzdmcpfWBcbiAgICB9XG4gIH0pO1xuICBpZiAob3B0aW9ucz8ubWF4SGVpZ2h0KSBpbWFnZS5zdHlsZS5tYXhIZWlnaHQgPSBgJHtvcHRpb25zLm1heEhlaWdodH1weGA7XG4gIGlmIChvcHRpb25zPy5hcHAgJiYgb3B0aW9ucy5maWxlKSB7XG4gICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgb3B0aW9ucy5hcHA/LndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKS5vcGVuRmlsZShvcHRpb25zLmZpbGUgYXMgVEZpbGUpO1xuICAgIH0pO1xuICAgIGltYWdlLnNldEF0dHIoXCJ0aXRsZVwiLCBcIlx1NTNDQ1x1NTFGQlx1NjI1M1x1NUYwMFx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3RhdGljU291cmNlKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHNvdXJjZTogc3RyaW5nLCBmYWxsYmFja1RpdGxlOiBzdHJpbmcsIGRlZmF1bHRBcHBlYXJhbmNlPzogTWluZE1hcEFwcGVhcmFuY2UpOiB2b2lkIHtcbiAgcmVuZGVyU3RhdGljTWluZE1hcChjb250YWluZXIsIHBhcnNlRG9jdW1lbnQoc291cmNlLCBmYWxsYmFja1RpdGxlKSwgeyBkZWZhdWx0QXBwZWFyYW5jZSB9KTtcbn1cbiIsICJpbXBvcnQgeyBNYXJrZG93blJlbmRlcmVyLCBOb3RpY2UsIFRleHRGaWxlVmlldywgVEZpbGUsIG5vcm1hbGl6ZVBhdGgsIHR5cGUgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgTWluZE1hcFN0dWRpb1BsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBNaW5kTWFwRWRpdG9yIH0gZnJvbSBcIi4vZWRpdG9yXCI7XG5pbXBvcnQgeyBwYXJzZURvY3VtZW50LCBzZXJpYWxpemVEb2N1bWVudCwgdHlwZSBNaW5kTWFwRG9jdW1lbnQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgc2V0dGluZ3NUb0FwcGVhcmFuY2UgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX01JTkRNQVBfU1RVRElPID0gXCJtaW5kbWFwLXN0dWRpby12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBNaW5kTWFwU3R1ZGlvVmlldyBleHRlbmRzIFRleHRGaWxlVmlldyB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBNaW5kTWFwU3R1ZGlvUGx1Z2luO1xuICBwcml2YXRlIGVkaXRvcjogTWluZE1hcEVkaXRvciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzYXZlZFRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTztcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZmlsZT8uYmFzZW5hbWUgPz8gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpbi1jaXJjdWl0XCI7XG4gIH1cblxuICBnZXRWaWV3RGF0YSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5lZGl0b3I/LmdldERvY3VtZW50KCkgPz8gdGhpcy5kb2N1bWVudDtcbiAgICByZXR1cm4gc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQgPz8gdGhpcy5wbHVnaW4uY3JlYXRlQ29uZmlndXJlZERvY3VtZW50KFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpKTtcbiAgfVxuXG4gIHNldFZpZXdEYXRhKGRhdGE6IHN0cmluZywgY2xlYXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCB0aXRsZSA9IHRoaXMuZmlsZT8uYmFzZW5hbWUgPz8gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICB0aGlzLmRvY3VtZW50ID0gcGFyc2VEb2N1bWVudChkYXRhLCB0aXRsZSk7XG4gICAgdGhpcy5hcHBseVZpZXdDbGFzc2VzKCk7XG5cbiAgICBpZiAoIXRoaXMuZWRpdG9yIHx8IGNsZWFyKSB7XG4gICAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICAgIHRoaXMuZWRpdG9yID0gbmV3IE1pbmRNYXBFZGl0b3IodGhpcy5hcHAsIHRoaXMuY29udGVudEVsLCB0aGlzLmRvY3VtZW50LCB7XG4gICAgICAgIG9uQ2hhbmdlOiAoZG9jdW1lbnQpID0+IHtcbiAgICAgICAgICB0aGlzLmRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0U2F2ZSgpO1xuICAgICAgICAgIHRoaXMuc2NoZWR1bGVTYXZlZEluZGljYXRvcigpO1xuICAgICAgICB9LFxuICAgICAgICBvbk9wZW5MaW5rOiBhc3luYyAobGluaykgPT4gdGhpcy5vcGVuTGluayhsaW5rKSxcbiAgICAgICAgb25FeHBvcnRTdmc6IGFzeW5jIChzdmcpID0+IHRoaXMuZXhwb3J0VGV4dEZpbGUoXCJzdmdcIiwgc3ZnKSxcbiAgICAgICAgb25FeHBvcnRNYXJrZG93bjogYXN5bmMgKG1hcmtkb3duKSA9PiB0aGlzLmV4cG9ydFRleHRGaWxlKFwibWRcIiwgbWFya2Rvd24pLFxuICAgICAgICBvbkV4cG9ydEpzb246IGFzeW5jIChqc29uKSA9PiB0aGlzLmV4cG9ydFRleHRGaWxlKFwianNvblwiLCBqc29uKSxcbiAgICAgICAgcmVzb2x2ZUltYWdlOiAoc291cmNlKSA9PiB0aGlzLnJlc29sdmVJbWFnZShzb3VyY2UpLFxuICAgICAgICBvblNhdmVQYXN0ZWRJbWFnZTogYXN5bmMgKGJsb2IsIHN1Z2dlc3RlZE5hbWUpID0+IHRoaXMucGx1Z2luLnNhdmVQYXN0ZWRJbWFnZShibG9iLCBzdWdnZXN0ZWROYW1lLCB0aGlzLmZpbGUpLFxuICAgICAgICBnZXRJbWFnZUhvc3RzOiAoKSA9PiB0aGlzLnBsdWdpbi5nZXRJbWFnZUhvc3RDaG9pY2VzKCksXG4gICAgICAgIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzOiAoKSA9PiB0aGlzLnBsdWdpbi5nZXREZWZhdWx0VXBsb2FkSG9zdElkcygpLFxuICAgICAgICBvblVwbG9hZEltYWdlOiBhc3luYyAoYmxvYiwgc3VnZ2VzdGVkTmFtZSwgaG9zdElkcykgPT4gdGhpcy5wbHVnaW4udXBsb2FkSW1hZ2VUb0hvc3RzKGJsb2IsIHN1Z2dlc3RlZE5hbWUsIGhvc3RJZHMpLFxuICAgICAgICBvblJlYWRJbWFnZVNvdXJjZTogYXN5bmMgKHNvdXJjZSkgPT4gdGhpcy5wbHVnaW4ucmVhZEltYWdlU291cmNlKHNvdXJjZSwgdGhpcy5maWxlKSxcbiAgICAgICAgb25TY2hlZHVsZUF1dG9VcGxvYWQ6IChub2RlSWQsIGJsb2NrSWQsIGxvY2FsUGF0aCwgc3VnZ2VzdGVkTmFtZSkgPT4gdGhpcy5wbHVnaW4uc2NoZWR1bGVBdXRvVXBsb2FkKHRoaXMuZmlsZSwgbm9kZUlkLCBibG9ja0lkLCBsb2NhbFBhdGgsIHN1Z2dlc3RlZE5hbWUpLFxuICAgICAgICBvbkNyZWF0ZVN1Ym1hcDogYXN5bmMgKG5vZGUpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuZmlsZSkgdGhyb3cgbmV3IEVycm9yKFwiXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU1QzFBXHU2NzJBXHU1MTczXHU4MDU0XHU2NTg3XHU0RUY2XCIpO1xuICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5jcmVhdGVTdWJtYXBGaWxlKHRoaXMuZmlsZSwgbm9kZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uT3Blbk1pbmRNYXA6IGFzeW5jIChwYXRoLCBmb2N1c05vZGVJZCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLm9wZW5NaW5kTWFwUGF0aChwYXRoLCB0aGlzLmZpbGU/LnBhdGggPz8gXCJcIiwgdGhpcy5sZWFmLCBmb2N1c05vZGVJZCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uUmVuZGVyQ29kZTogYXN5bmMgKGJsb2NrLCBjb250YWluZXIpID0+IHtcbiAgICAgICAgICBjb25zdCBsb25nZXN0RmVuY2UgPSBNYXRoLm1heCgyLCAuLi5BcnJheS5mcm9tKGJsb2NrLmNvZGUubWF0Y2hBbGwoL2ArL2cpLCAobWF0Y2gpID0+IG1hdGNoWzBdLmxlbmd0aCkpO1xuICAgICAgICAgIGNvbnN0IGZlbmNlID0gXCJgXCIucmVwZWF0KGxvbmdlc3RGZW5jZSArIDEpO1xuICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gYCR7ZmVuY2V9JHtibG9jay5sYW5ndWFnZSA/PyBcIlwifVxcbiR7YmxvY2suY29kZX1cXG4ke2ZlbmNlfWA7XG4gICAgICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIG1hcmtkb3duLCBjb250YWluZXIsIHRoaXMuZmlsZT8ucGF0aCA/PyBcIlwiLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSwgdGhpcy5nZXRFZGl0b3JPcHRpb25zKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVkaXRvci5zZXREb2N1bWVudCh0aGlzLmRvY3VtZW50LCBmYWxzZSk7XG4gICAgICB0aGlzLmVkaXRvci5zZXRPcHRpb25zKHRoaXMuZ2V0RWRpdG9yT3B0aW9ucygpKTtcbiAgICB9XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yID0gbnVsbDtcbiAgICB0aGlzLmRvY3VtZW50ID0gbnVsbDtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZShjbGVhcj86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5zYXZlKGNsZWFyKTtcbiAgICB0aGlzLmVkaXRvcj8ubWFya1NhdmVkKCk7XG4gIH1cblxuICBhc3luYyBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnNhdmVkVGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5zYXZlZFRpbWVyKTtcbiAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yID0gbnVsbDtcbiAgICBhd2FpdCBzdXBlci5vbkNsb3NlKCk7XG4gIH1cblxuICByZWZyZXNoQXBwZWFyYW5jZSgpOiB2b2lkIHtcbiAgICB0aGlzLmFwcGx5Vmlld0NsYXNzZXMoKTtcbiAgICB0aGlzLmVkaXRvcj8uc2V0T3B0aW9ucyh0aGlzLmdldEVkaXRvck9wdGlvbnMoKSk7XG4gIH1cblxuICBmb2N1c05vZGUobm9kZUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmVkaXRvcj8uZm9jdXNOb2RlQnlJZChub2RlSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRFZGl0b3JPcHRpb25zKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0Tm9kZVNoYXBlOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Tm9kZVNoYXBlLFxuICAgICAgZGVmYXVsdEFwcGVhcmFuY2U6IHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMucGx1Z2luLnNldHRpbmdzKSxcbiAgICAgIHNob3dUYXNrUHJvZ3Jlc3M6IHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrUHJvZ3Jlc3MsXG4gICAgICBhdXRvRml0T25PcGVuOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRml0T25PcGVuLFxuICAgICAgaGlzdG9yeUxpbWl0OiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXRcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVZpZXdDbGFzc2VzKCk6IHZvaWQge1xuICAgIGNvbnN0IHRoZW1lID0gdGhpcy5kb2N1bWVudD8udGhlbWUgPz8gXCJhdXRvXCI7XG4gICAgdGhpcy5jb250ZW50RWwudG9nZ2xlQ2xhc3MoXCJtbWMtZm9yY2UtbGlnaHRcIiwgdGhlbWUgPT09IFwibGlnaHRcIik7XG4gICAgdGhpcy5jb250ZW50RWwudG9nZ2xlQ2xhc3MoXCJtbWMtZm9yY2UtZGFya1wiLCB0aGVtZSA9PT0gXCJkYXJrXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzY2hlZHVsZVNhdmVkSW5kaWNhdG9yKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNhdmVkVGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5zYXZlZFRpbWVyKTtcbiAgICB0aGlzLnNhdmVkVGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLmVkaXRvcj8ubWFya1NhdmVkKCksIDIzMDApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuTGluayhyYXdMaW5rOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsaW5rID0gcmF3TGluay50cmltKCk7XG4gICAgaWYgKC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QobGluaykpIHtcbiAgICAgIHdpbmRvdy5vcGVuKGxpbmssIFwiX2JsYW5rXCIsIFwibm9vcGVuZXIsbm9yZWZlcnJlclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgd2lraU1hdGNoID0gbGluay5tYXRjaCgvXlxcW1xcWyhbXFxzXFxTXSs/KVxcXVxcXSQvKTtcbiAgICBjb25zdCB0YXJnZXQgPSAod2lraU1hdGNoPy5bMV0gPz8gbGluaykuc3BsaXQoXCJ8XCIpWzBdPy50cmltKCkgPz8gbGluaztcbiAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldCwgdGhpcy5maWxlPy5wYXRoID8/IFwiXCIsIGZhbHNlKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzb2x2ZUltYWdlKHJhd1NvdXJjZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3Qgc291cmNlID0gcmF3U291cmNlLnRyaW0oKTtcbiAgICBpZiAoIXNvdXJjZSkgcmV0dXJuIG51bGw7XG4gICAgaWYgKC9eKGh0dHBzPzp8ZGF0YTp8YmxvYjopL2kudGVzdChzb3VyY2UpKSByZXR1cm4gc291cmNlO1xuICAgIGNvbnN0IHdpa2lNYXRjaCA9IHNvdXJjZS5tYXRjaCgvXiE/XFxbXFxbKFtcXHNcXFNdKz8pXFxdXFxdJC8pO1xuICAgIGNvbnN0IHRhcmdldCA9ICh3aWtpTWF0Y2g/LlsxXSA/PyBzb3VyY2UpLnNwbGl0KFwifFwiKVswXT8uc3BsaXQoXCIjXCIpWzBdPy50cmltKCkgPz8gc291cmNlO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHRhcmdldCwgdGhpcy5maWxlPy5wYXRoID8/IFwiXCIpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGV4cG9ydFRleHRGaWxlKGV4dGVuc2lvbjogXCJzdmdcIiB8IFwibWRcIiB8IFwianNvblwiLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maWxlO1xuICAgIGNvbnN0IHBhcmVudFBhdGggPSBmaWxlPy5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBiYXNlTmFtZSA9IGZpbGU/LmJhc2VuYW1lID8/IHRoaXMuZG9jdW1lbnQ/LnRpdGxlID8/IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCI7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMucGx1Z2luLmdldEF2YWlsYWJsZVBhdGgobm9ybWFsaXplUGF0aChgJHtwYXJlbnRQYXRoID8gYCR7cGFyZW50UGF0aH0vYCA6IFwiXCJ9JHtiYXNlTmFtZX0uJHtleHRlbnNpb259YCkpO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICBuZXcgTm90aWNlKGBcdTVERjJcdTVCRkNcdTUxRkFcdUZGMUEke3BhdGh9YCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1lbnUsIE1vZGFsLCBOb3RpY2UsIHNldEljb24gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIGNsb25lRG9jdW1lbnQsXG4gIGNsb25lTm9kZVdpdGhGcmVzaElkcyxcbiAgY2hpbGRyZW5Ub1RhYmxlLFxuICBjb250YWluc05vZGUsXG4gIGNyZWF0ZU5vZGUsXG4gIGRvY3VtZW50VG9NYXJrZG93bixcbiAgZXh0cmFjdEZpcnN0V2lraUxpbmssXG4gIGZpbmRBbmNlc3RvcnMsXG4gIGZpbmROb2RlLFxuICBmaW5kUGFyZW50LFxuICBmbGF0dGVuTm9kZXMsXG4gIGdldFRhc2tQcm9ncmVzcyxcbiAgbWVyZ2VBcHBlYXJhbmNlLFxuICBub2RlU2VhcmNoVGV4dCxcbiAgbm9ybWFsaXplRG9jdW1lbnQsXG4gIG5ld0lkLFxuICBub2RlQ29udGVudEJsb2NrcyxcbiAgbm9kZVBsYWluVGV4dCxcbiAgc3luY05vZGVMZWdhY3lGaWVsZHMsXG4gIHBhcnNlRmVuY2VkQ29kZSxcbiAgcGFyc2VNYXJrZG93blRhYmxlLFxuICBub3JtYWxpemVSaWNoVGV4dCxcbiAgcmljaFRleHRQbGFpblRleHQsXG4gIHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzLFxuICBjaGFyYWN0ZXJTdHlsZXNUb1JpY2hUZXh0LFxuICBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZSxcbiAgcmVjb25jaWxlUmljaFRleHRBZnRlckVkaXQsXG4gIHR5cGUgQmFja2dyb3VuZFBhdHRlcm4sXG4gIHR5cGUgRWRnZVN0eWxlLFxuICB0eXBlIEZvbnRGYW1pbHlNb2RlLFxuICB0eXBlIE1pbmRNYXBBcHBlYXJhbmNlLFxuICB0eXBlIE1pbmRNYXBEb2N1bWVudCxcbiAgdHlwZSBNaW5kTWFwQ29kZUJsb2NrLFxuICB0eXBlIE1pbmRNYXBDb250ZW50QmxvY2ssXG4gIHR5cGUgTWluZE1hcEltYWdlQ29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBOb2RlLFxuICB0eXBlIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBTdWJtYXAsXG4gIHR5cGUgTWluZE1hcFRleHRSdW4sXG4gIHR5cGUgTWluZE1hcFRleHRTdHlsZSxcbiAgdHlwZSBOb2RlU2hhcGUsXG4gIHR5cGUgVGFza1N0YXR1cyxcbiAgcmVtb3ZlTm9kZVxufSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgY29tcHV0ZUxheW91dCwgZG9jdW1lbnRUb1N2ZywgZWRnZVBhdGgsIHR5cGUgTGF5b3V0UmVzdWx0IH0gZnJvbSBcIi4vbGF5b3V0XCI7XG5pbXBvcnQgeyBDb2RlRWRpdE1vZGFsLCBUYWJsZUVkaXRNb2RhbCB9IGZyb20gXCIuL2NvbnRlbnQtbW9kYWxzXCI7XG5pbXBvcnQgdHlwZSB7IEltYWdlSG9zdENob2ljZSwgSW1hZ2VIb3N0VXBsb2FkQmF0Y2ggfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBFZGl0b3JDYWxsYmFja3Mge1xuICBvbkNoYW5nZTogKGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQpID0+IHZvaWQ7XG4gIG9uT3Blbkxpbms6IChsaW5rOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICBvbkV4cG9ydFN2ZzogKHN2Zzogc3RyaW5nKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgb25FeHBvcnRNYXJrZG93bjogKG1hcmtkb3duOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICBvbkV4cG9ydEpzb246IChqc29uOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICByZXNvbHZlSW1hZ2U6IChzb3VyY2U6IHN0cmluZykgPT4gc3RyaW5nIHwgbnVsbDtcbiAgb25TYXZlUGFzdGVkSW1hZ2U6IChibG9iOiBCbG9iLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgZ2V0SW1hZ2VIb3N0czogKCkgPT4gSW1hZ2VIb3N0Q2hvaWNlW107XG4gIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzOiAoKSA9PiBzdHJpbmdbXTtcbiAgb25VcGxvYWRJbWFnZTogKGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZywgaG9zdElkczogc3RyaW5nW10pID0+IFByb21pc2U8SW1hZ2VIb3N0VXBsb2FkQmF0Y2g+O1xuICBvblJlYWRJbWFnZVNvdXJjZTogKHNvdXJjZTogc3RyaW5nKSA9PiBQcm9taXNlPHsgYmxvYjogQmxvYjsgc3VnZ2VzdGVkTmFtZTogc3RyaW5nIH0gfCBudWxsPjtcbiAgb25TY2hlZHVsZUF1dG9VcGxvYWQ6IChub2RlSWQ6IHN0cmluZywgYmxvY2tJZDogc3RyaW5nLCBsb2NhbFBhdGg6IHN0cmluZywgc3VnZ2VzdGVkTmFtZTogc3RyaW5nKSA9PiBib29sZWFuO1xuICBvbkNyZWF0ZVN1Ym1hcDogKG5vZGU6IE1pbmRNYXBOb2RlKSA9PiBQcm9taXNlPE1pbmRNYXBTdWJtYXA+O1xuICBvbk9wZW5NaW5kTWFwOiAocGF0aDogc3RyaW5nLCBmb2N1c05vZGVJZD86IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIG9uUmVuZGVyQ29kZTogKGJsb2NrOiBNaW5kTWFwQ29kZUJsb2NrLCBjb250YWluZXI6IEhUTUxFbGVtZW50KSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwRWRpdG9yT3B0aW9ucyB7XG4gIGRlZmF1bHROb2RlU2hhcGU6IE5vZGVTaGFwZTtcbiAgZGVmYXVsdEFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlO1xuICBzaG93VGFza1Byb2dyZXNzOiBib29sZWFuO1xuICBhdXRvRml0T25PcGVuOiBib29sZWFuO1xuICBoaXN0b3J5TGltaXQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIE5vZGVFZGl0VmFsdWVzIHtcbiAgY29udGVudDogTWluZE1hcENvbnRlbnRCbG9ja1tdO1xuICBub3RlOiBzdHJpbmc7XG4gIGxpbms6IHN0cmluZztcbiAgaWNvbjogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgdGFzaz86IFRhc2tTdGF0dXM7XG4gIGNvbG9yPzogc3RyaW5nO1xuICB0ZXh0Q29sb3I/OiBzdHJpbmc7XG4gIGJvcmRlckNvbG9yPzogc3RyaW5nO1xuICBib3JkZXJXaWR0aD86IG51bWJlcjtcbiAgc2hhcGU/OiBOb2RlU2hhcGU7XG4gIGJvbGQ/OiBib29sZWFuO1xuICBpdGFsaWM/OiBib29sZWFuO1xuICB1bmRlcmxpbmU/OiBib29sZWFuO1xuICBmb250U2l6ZT86IG51bWJlcjtcbn1cblxuZnVuY3Rpb24gc3R5bGVFcXVhbHMobGVmdDogTWluZE1hcFRleHRTdHlsZSB8IHVuZGVmaW5lZCwgcmlnaHQ6IE1pbmRNYXBUZXh0U3R5bGUgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGxlZnQgPz8ge30pID09PSBKU09OLnN0cmluZ2lmeShyaWdodCA/PyB7fSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclJpY2hUZXh0UnVucyhjb250YWluZXI6IEhUTUxFbGVtZW50LCBydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQ6IHN0cmluZyk6IHZvaWQge1xuICBjb250YWluZXIuZW1wdHkoKTtcbiAgaWYgKCFydW5zPy5sZW5ndGgpIHtcbiAgICBjb250YWluZXIuc2V0VGV4dChmYWxsYmFja1RleHQpO1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGNvbnN0IHJ1biBvZiBydW5zKSB7XG4gICAgY29uc3Qgc3BhbiA9IGNvbnRhaW5lci5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy1yaWNoLXJ1blwiLCB0ZXh0OiBydW4udGV4dCB9KTtcbiAgICBpZiAocnVuLnN0eWxlPy5ib2xkICE9PSB1bmRlZmluZWQpIHNwYW4uc3R5bGUuZm9udFdlaWdodCA9IHJ1bi5zdHlsZS5ib2xkID8gXCI3MDBcIiA6IFwiNDAwXCI7XG4gICAgaWYgKHJ1bi5zdHlsZT8uaXRhbGljICE9PSB1bmRlZmluZWQpIHNwYW4uc3R5bGUuZm9udFN0eWxlID0gcnVuLnN0eWxlLml0YWxpYyA/IFwiaXRhbGljXCIgOiBcIm5vcm1hbFwiO1xuICAgIGNvbnN0IGRlY29yYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChydW4uc3R5bGU/LnVuZGVybGluZSkgZGVjb3JhdGlvbnMucHVzaChcInVuZGVybGluZVwiKTtcbiAgICBpZiAocnVuLnN0eWxlPy5zdHJpa2UpIGRlY29yYXRpb25zLnB1c2goXCJsaW5lLXRocm91Z2hcIik7XG4gICAgaWYgKGRlY29yYXRpb25zLmxlbmd0aCkgc3Bhbi5zdHlsZS50ZXh0RGVjb3JhdGlvbkxpbmUgPSBkZWNvcmF0aW9ucy5qb2luKFwiIFwiKTtcbiAgICBpZiAocnVuLnN0eWxlPy5jb2xvcikgc3Bhbi5zdHlsZS5jb2xvciA9IHJ1bi5zdHlsZS5jb2xvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdHlsZUZyb21FbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBpbmhlcml0ZWQ6IE1pbmRNYXBUZXh0U3R5bGUpOiBNaW5kTWFwVGV4dFN0eWxlIHtcbiAgY29uc3Qgc3R5bGU6IE1pbmRNYXBUZXh0U3R5bGUgPSB7IC4uLmluaGVyaXRlZCB9O1xuICBjb25zdCB0YWcgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgaWYgKHRhZyA9PT0gXCJiXCIgfHwgdGFnID09PSBcInN0cm9uZ1wiKSBzdHlsZS5ib2xkID0gdHJ1ZTtcbiAgaWYgKHRhZyA9PT0gXCJpXCIgfHwgdGFnID09PSBcImVtXCIpIHN0eWxlLml0YWxpYyA9IHRydWU7XG4gIGlmICh0YWcgPT09IFwidVwiKSBzdHlsZS51bmRlcmxpbmUgPSB0cnVlO1xuICBpZiAodGFnID09PSBcInNcIiB8fCB0YWcgPT09IFwic3RyaWtlXCIgfHwgdGFnID09PSBcImRlbFwiKSBzdHlsZS5zdHJpa2UgPSB0cnVlO1xuICBjb25zdCBpbmxpbmUgPSBlbGVtZW50LnN0eWxlO1xuICBpZiAoaW5saW5lLmZvbnRXZWlnaHQgJiYgKGlubGluZS5mb250V2VpZ2h0ID09PSBcImJvbGRcIiB8fCBOdW1iZXIoaW5saW5lLmZvbnRXZWlnaHQpID49IDYwMCkpIHN0eWxlLmJvbGQgPSB0cnVlO1xuICBpZiAoaW5saW5lLmZvbnRTdHlsZSA9PT0gXCJpdGFsaWNcIikgc3R5bGUuaXRhbGljID0gdHJ1ZTtcbiAgY29uc3QgZGVjb3JhdGlvbiA9IGAke2lubGluZS50ZXh0RGVjb3JhdGlvbn0gJHtpbmxpbmUudGV4dERlY29yYXRpb25MaW5lfWA7XG4gIGlmIChkZWNvcmF0aW9uLmluY2x1ZGVzKFwidW5kZXJsaW5lXCIpKSBzdHlsZS51bmRlcmxpbmUgPSB0cnVlO1xuICBpZiAoZGVjb3JhdGlvbi5pbmNsdWRlcyhcImxpbmUtdGhyb3VnaFwiKSkgc3R5bGUuc3RyaWtlID0gdHJ1ZTtcbiAgY29uc3QgZm9udENvbG9yID0gdGFnID09PSBcImZvbnRcIiA/IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiY29sb3JcIikgOiBudWxsO1xuICBjb25zdCBjb2xvciA9IGlubGluZS5jb2xvciB8fCBmb250Q29sb3IgfHwgXCJcIjtcbiAgaWYgKGNvbG9yKSB7XG4gICAgY29uc3QgcHJvYmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICBwcm9iZS5zdHlsZS5jb2xvciA9IGNvbG9yO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocHJvYmUpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBnZXRDb21wdXRlZFN0eWxlKHByb2JlKS5jb2xvci5tYXRjaCgvXFxkKy9nKT8uc2xpY2UoMCwgMykubWFwKE51bWJlcik7XG4gICAgcHJvYmUucmVtb3ZlKCk7XG4gICAgaWYgKG5vcm1hbGl6ZWQ/Lmxlbmd0aCA9PT0gMykgc3R5bGUuY29sb3IgPSBgIyR7bm9ybWFsaXplZC5tYXAoKHZhbHVlKSA9PiB2YWx1ZS50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpKS5qb2luKFwiXCIpfWA7XG4gIH1cbiAgcmV0dXJuIHN0eWxlO1xufVxuXG5mdW5jdGlvbiByZWFkUmljaFRleHRFZGl0b3IoZWRpdG9yOiBIVE1MRWxlbWVudCk6IHsgdGV4dDogc3RyaW5nOyByaWNoVGV4dD86IE1pbmRNYXBUZXh0UnVuW10gfSB7XG4gIGNvbnN0IHJhd1J1bnM6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgY29uc3QgdmlzaXQgPSAobm9kZTogTm9kZSwgaW5oZXJpdGVkOiBNaW5kTWFwVGV4dFN0eWxlKTogdm9pZCA9PiB7XG4gICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gKG5vZGUudGV4dENvbnRlbnQgPz8gXCJcIikucmVwbGFjZSgvXFxyP1xcbi9nLCBcIiBcIik7XG4gICAgICBpZiAoIXRleHQpIHJldHVybjtcbiAgICAgIGNvbnN0IHN0eWxlID0gT2JqZWN0LnZhbHVlcyhpbmhlcml0ZWQpLnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IHsgLi4uaW5oZXJpdGVkIH0gOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBwcmV2aW91cyA9IHJhd1J1bnMuYXQoLTEpO1xuICAgICAgaWYgKHByZXZpb3VzICYmIHN0eWxlRXF1YWxzKHByZXZpb3VzLnN0eWxlLCBzdHlsZSkpIHByZXZpb3VzLnRleHQgKz0gdGV4dDtcbiAgICAgIGVsc2UgcmF3UnVucy5wdXNoKHsgdGV4dCwgc3R5bGUgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghKG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHJldHVybjtcbiAgICBpZiAobm9kZS50YWdOYW1lID09PSBcIkJSXCIpIHtcbiAgICAgIHJhd1J1bnMucHVzaCh7IHRleHQ6IFwiIFwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzdHlsZSA9IHN0eWxlRnJvbUVsZW1lbnQobm9kZSwgaW5oZXJpdGVkKTtcbiAgICBub2RlLmNoaWxkTm9kZXMuZm9yRWFjaCgoY2hpbGQpID0+IHZpc2l0KGNoaWxkLCBzdHlsZSkpO1xuICAgIGlmIChbXCJESVZcIiwgXCJQXCJdLmluY2x1ZGVzKG5vZGUudGFnTmFtZSkgJiYgcmF3UnVucy5sZW5ndGggJiYgIXJhd1J1bnMuYXQoLTEpPy50ZXh0LmVuZHNXaXRoKFwiIFwiKSkgcmF3UnVucy5wdXNoKHsgdGV4dDogXCIgXCIgfSk7XG4gIH07XG4gIGVkaXRvci5jaGlsZE5vZGVzLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwge30pKTtcbiAgY29uc3QgZmFsbGJhY2sgPSBlZGl0b3IudGV4dENvbnRlbnQ/LnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSA/PyBcIlwiO1xuICBjb25zdCByaWNoVGV4dCA9IG5vcm1hbGl6ZVJpY2hUZXh0KHJhd1J1bnMsIGZhbGxiYWNrKTtcbiAgcmV0dXJuIHsgdGV4dDogcmljaFRleHRQbGFpblRleHQocmljaFRleHQsIGZhbGxiYWNrKS50cmltKCksIHJpY2hUZXh0IH07XG59XG5cbmNsYXNzIEltYWdlUHJldmlld01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHNjYWxlID0gMTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSBzb3VyY2U6IHN0cmluZywgcHJpdmF0ZSByZWFkb25seSBhbHQ6IHN0cmluZykge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy5tb2RhbEVsLmFkZENsYXNzKFwibW1jLWltYWdlLXByZXZpZXctbW9kYWxcIik7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQodGhpcy5hbHQgfHwgXCJcdTU2RkVcdTcyNDdcdTk4ODRcdTg5QzhcIik7XG4gICAgY29uc3QgdG9vbGJhciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtaW1hZ2UtcHJldmlldy10b29sYmFyXCIgfSk7XG4gICAgY29uc3QgaW1hZ2VXcmFwID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1pbWFnZS1wcmV2aWV3LXN0YWdlXCIgfSk7XG4gICAgY29uc3QgaW1hZ2UgPSBpbWFnZVdyYXAuY3JlYXRlRWwoXCJpbWdcIiwgeyBhdHRyOiB7IHNyYzogdGhpcy5zb3VyY2UsIGFsdDogdGhpcy5hbHQgfHwgXCJcdTU2RkVcdTcyNDdcIiB9IH0pO1xuICAgIGxldCBiYXNlV2lkdGggPSAwO1xuICAgIGxldCBiYXNlSGVpZ2h0ID0gMDtcbiAgICBjb25zdCBhcHBseVNjYWxlID0gKCk6IHZvaWQgPT4ge1xuICAgICAgaWYgKCFiYXNlV2lkdGggfHwgIWJhc2VIZWlnaHQpIHJldHVybjtcbiAgICAgIGltYWdlLnN0eWxlLndpZHRoID0gYCR7TWF0aC5tYXgoMSwgTWF0aC5yb3VuZChiYXNlV2lkdGggKiB0aGlzLnNjYWxlKSl9cHhgO1xuICAgICAgaW1hZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7TWF0aC5tYXgoMSwgTWF0aC5yb3VuZChiYXNlSGVpZ2h0ICogdGhpcy5zY2FsZSkpfXB4YDtcbiAgICB9O1xuICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZVdpZHRoID0gTWF0aC5tYXgoMzIwLCBpbWFnZVdyYXAuY2xpZW50V2lkdGggKiAwLjkpO1xuICAgICAgY29uc3QgYXZhaWxhYmxlSGVpZ2h0ID0gTWF0aC5tYXgoMjIwLCBpbWFnZVdyYXAuY2xpZW50SGVpZ2h0ICogMC45KTtcbiAgICAgIGNvbnN0IGZpdCA9IE1hdGgubWluKDEsIGF2YWlsYWJsZVdpZHRoIC8gTWF0aC5tYXgoMSwgaW1hZ2UubmF0dXJhbFdpZHRoKSwgYXZhaWxhYmxlSGVpZ2h0IC8gTWF0aC5tYXgoMSwgaW1hZ2UubmF0dXJhbEhlaWdodCkpO1xuICAgICAgYmFzZVdpZHRoID0gTWF0aC5tYXgoMSwgaW1hZ2UubmF0dXJhbFdpZHRoICogZml0KTtcbiAgICAgIGJhc2VIZWlnaHQgPSBNYXRoLm1heCgxLCBpbWFnZS5uYXR1cmFsSGVpZ2h0ICogZml0KTtcbiAgICAgIGFwcGx5U2NhbGUoKTtcbiAgICB9KTtcbiAgICBjb25zdCBidXR0b24gPSAobGFiZWw6IHN0cmluZywgYWN0aW9uOiAoKSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBlbCA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYWN0aW9uKTtcbiAgICB9O1xuICAgIGJ1dHRvbihcIlx1MjIxMlwiLCAoKSA9PiB7IHRoaXMuc2NhbGUgPSBNYXRoLm1heCgwLjIsIHRoaXMuc2NhbGUgLSAwLjIpOyBhcHBseVNjYWxlKCk7IH0pO1xuICAgIGJ1dHRvbihcIjEwMCVcIiwgKCkgPT4geyB0aGlzLnNjYWxlID0gMTsgYXBwbHlTY2FsZSgpOyB9KTtcbiAgICBidXR0b24oXCIrXCIsICgpID0+IHsgdGhpcy5zY2FsZSA9IE1hdGgubWluKDUsIHRoaXMuc2NhbGUgKyAwLjIpOyBhcHBseVNjYWxlKCk7IH0pO1xuICAgIGltYWdlV3JhcC5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5zY2FsZSA9IE1hdGgubWluKDUsIE1hdGgubWF4KDAuMiwgdGhpcy5zY2FsZSArIChldmVudC5kZWx0YVkgPCAwID8gMC4xNSA6IC0wLjE1KSkpO1xuICAgICAgYXBwbHlTY2FsZSgpO1xuICAgIH0sIHsgcGFzc2l2ZTogZmFsc2UgfSk7XG4gICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsICgpID0+IHsgdGhpcy5zY2FsZSA9IDE7IGFwcGx5U2NhbGUoKTsgfSk7XG4gIH1cbn1cblxuY2xhc3MgSW1hZ2VIb3N0UGlja2VyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVzb2x2ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzZWxlY3RlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgaG9zdHM6IEltYWdlSG9zdENob2ljZVtdLFxuICAgIGluaXRpYWxJZHM6IHN0cmluZ1tdLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVzb2x2ZVNlbGVjdGlvbjogKGlkczogc3RyaW5nW10gfCBudWxsKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgaW5pdGlhbElkcy5mb3JFYWNoKChpZCkgPT4gdGhpcy5zZWxlY3RlZC5hZGQoaWQpKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlx1OTAwOVx1NjJFOVx1NEUwQVx1NEYyMFx1NTZGRVx1NUU4QVwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcIm1tcy1pbWFnZS1ob3N0LXBpY2tlclwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgICAgdGV4dDogXCJcdTUzRUZcdTRFRTVcdTkwMDlcdTYyRTlcdTRFMDBcdTRFMkFcdTYyMTZcdTU5MUFcdTRFMkFcdTU2RkVcdTVFOEFcdTMwMDJcdTUxNjhcdTkwRThcdTRFMEFcdTRGMjBcdTYyMTBcdTUyOUZcdTU0MEVcdUZGMENcdTdCMkNcdTRFMDBcdTk4NzlcdTc2ODRcdTU3MzBcdTU3NDBcdTRGMUFcdTRGNUNcdTRFM0FcdTgyODJcdTcwQjlcdTVGNTNcdTUyNERcdTY2M0VcdTc5M0FcdTU3MzBcdTU3NDBcdUZGMENcdTUxNzZcdTRGNTlcdTU3MzBcdTU3NDBcdTRGMUFcdTRGNUNcdTRFM0FcdTk1NUNcdTUwQ0ZcdTRGRERcdTVCNThcdTMwMDJcIlxuICAgIH0pO1xuICAgIGNvbnN0IGxpc3QgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWltYWdlLWhvc3QtcGlja2VyLWxpc3RcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGhvc3Qgb2YgdGhpcy5ob3N0cykge1xuICAgICAgY29uc3QgbGFiZWwgPSBsaXN0LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyBjbHM6IFwibW1zLWltYWdlLWhvc3QtcGlja2VyLWl0ZW1cIiB9KTtcbiAgICAgIGNvbnN0IGNoZWNrYm94ID0gbGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcbiAgICAgIGNoZWNrYm94LmNoZWNrZWQgPSB0aGlzLnNlbGVjdGVkLmhhcyhob3N0LmlkKTtcbiAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoY2hlY2tib3guY2hlY2tlZCkgdGhpcy5zZWxlY3RlZC5hZGQoaG9zdC5pZCk7IGVsc2UgdGhpcy5zZWxlY3RlZC5kZWxldGUoaG9zdC5pZCk7XG4gICAgICB9KTtcbiAgICAgIGxhYmVsLmNyZWF0ZVNwYW4oeyB0ZXh0OiBob3N0Lm5hbWUgfSk7XG4gICAgfVxuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW9kYWwtYnV0dG9uLWNvbnRhaW5lclwiIH0pO1xuICAgIGNvbnN0IGNhbmNlbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTNENlx1NkQ4OFwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBjYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgY29uc3QgY29uZmlybSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1Nzg2RVx1NUI5QVwiLCBjbHM6IFwibW9kLWN0YVwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBjb25maXJtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0ZWQuc2l6ZSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiXHU4QkY3XHU4MUYzXHU1QzExXHU5MDA5XHU2MkU5XHU0RTAwXHU0RTJBXHU1NkZFXHU1RThBXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnJlc29sdmVkID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzb2x2ZVNlbGVjdGlvbihBcnJheS5mcm9tKHRoaXMuc2VsZWN0ZWQpKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnJlc29sdmVkKSB0aGlzLnJlc29sdmVTZWxlY3Rpb24obnVsbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hvb3NlSW1hZ2VIb3N0cyhhcHA6IEFwcCwgaG9zdHM6IEltYWdlSG9zdENob2ljZVtdLCBpbml0aWFsSWRzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10gfCBudWxsPiB7XG4gIGlmICghaG9zdHMubGVuZ3RoKSB7XG4gICAgbmV3IE5vdGljZShcIlx1NkNBMVx1NjcwOVx1NTNFRlx1NzUyOFx1NTZGRVx1NUU4QVx1RkYwQ1x1OEJGN1x1NTE0OFx1NTcyOFx1NjNEMlx1NEVGNlx1OEJCRVx1N0Y2RVx1NEUyRFx1OTE0RFx1N0Y2RVx1NUU3Nlx1NTQyRlx1NzUyOFx1NTZGRVx1NUU4QVwiKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICB9XG4gIGNvbnN0IGFsbG93ZWQgPSBuZXcgU2V0KGhvc3RzLm1hcCgoaG9zdCkgPT4gaG9zdC5pZCkpO1xuICBjb25zdCBpbml0aWFsID0gaW5pdGlhbElkcy5maWx0ZXIoKGlkKSA9PiBhbGxvd2VkLmhhcyhpZCkpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IG5ldyBJbWFnZUhvc3RQaWNrZXJNb2RhbChhcHAsIGhvc3RzLCBpbml0aWFsLmxlbmd0aCA/IGluaXRpYWwgOiBbaG9zdHNbMF0hLmlkXSwgcmVzb2x2ZSkub3BlbigpKTtcbn1cblxuY2xhc3MgTm9kZUVkaXRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBub2RlOiBNaW5kTWFwTm9kZTtcbiAgcHJpdmF0ZSByZWFkb25seSBkZWZhdWx0U2hhcGU6IE5vZGVTaGFwZTtcbiAgcHJpdmF0ZSByZWFkb25seSBjYWxsYmFja3M6IFBpY2s8TWluZE1hcEVkaXRvckNhbGxiYWNrcywgXCJyZXNvbHZlSW1hZ2VcIiB8IFwib25TYXZlUGFzdGVkSW1hZ2VcIiB8IFwiZ2V0SW1hZ2VIb3N0c1wiIHwgXCJnZXREZWZhdWx0VXBsb2FkSG9zdElkc1wiIHwgXCJvblVwbG9hZEltYWdlXCIgfCBcIm9uUmVhZEltYWdlU291cmNlXCI+O1xuICBwcml2YXRlIHJlYWRvbmx5IHN1Ym1pdDogKHZhbHVlczogTm9kZUVkaXRWYWx1ZXMsIG1vZGU6IFwiYXV0b3NhdmVcIiB8IFwiY29tbWl0XCIpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2F2ZU9uQ2xvc2U6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNsb3NlV2l0aG91dEZsdXNoID0gZmFsc2U7XG4gIHByaXZhdGUgb3V0c2lkZVBvaW50ZXJIYW5kbGVyOiAoKGV2ZW50OiBQb2ludGVyRXZlbnQpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgbm9kZTogTWluZE1hcE5vZGUsXG4gICAgZGVmYXVsdFNoYXBlOiBOb2RlU2hhcGUsXG4gICAgY2FsbGJhY2tzOiBQaWNrPE1pbmRNYXBFZGl0b3JDYWxsYmFja3MsIFwicmVzb2x2ZUltYWdlXCIgfCBcIm9uU2F2ZVBhc3RlZEltYWdlXCIgfCBcImdldEltYWdlSG9zdHNcIiB8IFwiZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHNcIiB8IFwib25VcGxvYWRJbWFnZVwiIHwgXCJvblJlYWRJbWFnZVNvdXJjZVwiPixcbiAgICBzdWJtaXQ6ICh2YWx1ZXM6IE5vZGVFZGl0VmFsdWVzLCBtb2RlOiBcImF1dG9zYXZlXCIgfCBcImNvbW1pdFwiKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICB0aGlzLmRlZmF1bHRTaGFwZSA9IGRlZmF1bHRTaGFwZTtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgICB0aGlzLnN1Ym1pdCA9IHN1Ym1pdDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlx1N0YxNlx1OEY5MVx1ODI4Mlx1NzBCOVx1NTE4NVx1NUJCOVwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcIm1tYy1ub2RlLWVkaXQtbW9kYWxcIik7XG4gICAgY29uc3QgZm9ybSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1lZGl0LWZvcm1cIiB9KTtcbiAgICBmb3JtLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlx1ODI4Mlx1NzBCOVx1NTE4NVx1NUJCOVx1NzUzMVx1NTNFRlx1NjM5Mlx1NUU4Rlx1NzY4NFx1NjU4N1x1NUI1N1x1NTc1N1x1NTQ4Q1x1NTZGRVx1NzI0N1x1NTc1N1x1N0VDNFx1NjIxMFx1MzAwMlx1NTNFRlx1NEVFNVx1NTNFQVx1NEZERFx1NzU1OVx1NTZGRVx1NzI0N1x1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1N0VDNFx1NTQwOFx1NEUzQVx1NTZGRVx1NzI0N1x1MjE5Mlx1NjU4N1x1NUI1N1x1MzAwMVx1NjU4N1x1NUI1N1x1MjE5Mlx1NTZGRVx1NzI0N1x1RkYwQ1x1NjIxNlx1NjU4N1x1NUI1N1x1MjE5Mlx1NTZGRVx1NzI0N1x1MjE5Mlx1NjU4N1x1NUI1N1x1MzAwMlwiXG4gICAgfSk7XG5cbiAgICBsZXQgd29ya2luZ0Jsb2NrczogTWluZE1hcENvbnRlbnRCbG9ja1tdID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShub2RlQ29udGVudEJsb2Nrcyh0aGlzLm5vZGUpKSkgYXMgTWluZE1hcENvbnRlbnRCbG9ja1tdO1xuICAgIGlmICghd29ya2luZ0Jsb2Nrcy5sZW5ndGgpIHdvcmtpbmdCbG9ja3MgPSBbeyBpZDogbmV3SWQoKSwgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IFwiXHU2NUIwXHU4MjgyXHU3MEI5XCIgfV07XG4gICAgbGV0IHNjaGVkdWxlQXV0b1NhdmU6ICgpID0+IHZvaWQgPSAoKSA9PiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBhY3Rpb25Sb3cgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgYmxvY2tzRWwgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1saXN0XCIgfSk7XG5cbiAgICBjb25zdCBjbG9uZUJsb2NrcyA9ICgpOiBNaW5kTWFwQ29udGVudEJsb2NrW10gPT4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh3b3JraW5nQmxvY2tzKSkgYXMgTWluZE1hcENvbnRlbnRCbG9ja1tdO1xuICAgIGNvbnN0IHZhbGlkQmxvY2tzID0gKCk6IE1pbmRNYXBDb250ZW50QmxvY2tbXSA9PiBjbG9uZUJsb2NrcygpLmZpbHRlcigoYmxvY2spID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIiA/IEJvb2xlYW4oYmxvY2suc291cmNlLnRyaW0oKSkgOiBCb29sZWFuKGJsb2NrLnRleHQudHJpbSgpKSk7XG5cbiAgICBjb25zdCByZW5kZXJUZXh0QmxvY2sgPSAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgYmxvY2s6IE1pbmRNYXBUZXh0Q29udGVudEJsb2NrKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB0b29sYmFyID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcmljaC10ZXh0LXRvb2xiYXJcIiB9KTtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IGNvbnRhaW5lci5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgICAgY2xzOiBcIm1tYy1yaWNoLXRleHQtc291cmNlXCIsXG4gICAgICAgIGF0dHI6IHsgcm93czogXCIzXCIsIHNwZWxsY2hlY2s6IFwidHJ1ZVwiLCBwbGFjZWhvbGRlcjogXCJcdThGOTNcdTUxNjVcdTY1ODdcdTVCNTdcdUZGMUJcdTUzRUZcdTRFRTVcdTUxNjhcdTkwRThcdTUyMjBcdTk2NjRcdUZGMENcdThCQTlcdTgyODJcdTcwQjlcdTUzRUFcdTRGRERcdTc1NTlcdTU2RkVcdTcyNDdcIiB9XG4gICAgICB9KTtcbiAgICAgIHNvdXJjZS52YWx1ZSA9IGJsb2NrLnRleHQ7XG4gICAgICBsZXQgc2F2ZWRTdGFydCA9IHNvdXJjZS52YWx1ZS5sZW5ndGg7XG4gICAgICBsZXQgc2F2ZWRFbmQgPSBzb3VyY2UudmFsdWUubGVuZ3RoO1xuICAgICAgY29uc3Qgc2VsZWN0aW9uID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcmljaC1zZWxlY3Rpb24tc3RhdHVzXCIgfSk7XG4gICAgICBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1yaWNoLXByZXZpZXctbGFiZWxcIiwgdGV4dDogXCJcdTY1ODdcdTVCNTdcdTY4MzdcdTVGMEZcdTk4ODRcdTg5QzhcIiB9KTtcbiAgICAgIGNvbnN0IHByZXZpZXcgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1yaWNoLXRleHQtcHJldmlld1wiIH0pO1xuICAgICAgY29uc3QgdXBkYXRlUHJldmlldyA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgcmVuZGVyUmljaFRleHRSdW5zKHByZXZpZXcsIGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0IHx8IFwiXHU5ODg0XHU4OUM4XHU2NTg3XHU1QjU3XCIpO1xuICAgICAgICBwcmV2aWV3LnRvZ2dsZUNsYXNzKFwiaXMtcGxhY2Vob2xkZXJcIiwgIWJsb2NrLnRleHQpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlbWVtYmVyID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzYXZlZFN0YXJ0ID0gc291cmNlLnNlbGVjdGlvblN0YXJ0ID8/IDA7XG4gICAgICAgIHNhdmVkRW5kID0gc291cmNlLnNlbGVjdGlvbkVuZCA/PyBzYXZlZFN0YXJ0O1xuICAgICAgICBjb25zdCBmcm9tID0gTWF0aC5taW4oc2F2ZWRTdGFydCwgc2F2ZWRFbmQpO1xuICAgICAgICBjb25zdCB0byA9IE1hdGgubWF4KHNhdmVkU3RhcnQsIHNhdmVkRW5kKTtcbiAgICAgICAgc2VsZWN0aW9uLnNldFRleHQoZnJvbSA9PT0gdG8gPyBgXHU1MTQ5XHU2ODA3XHU0RjREXHU3RjZFXHVGRjFBJHtmcm9tICsgMX1gIDogYFx1NURGMlx1OTAwOVx1NjJFOVx1N0IyQyAke2Zyb20gKyAxfVx1MjAxMyR7dG99IFx1NEUyQVx1NUI1N1x1N0IyNmApO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHJhbmdlID0gKCk6IHsgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXIgfSB8IG51bGwgPT4ge1xuICAgICAgICBjb25zdCBzdGFydCA9IE1hdGgubWF4KDAsIE1hdGgubWluKGJsb2NrLnRleHQubGVuZ3RoLCBNYXRoLm1pbihzYXZlZFN0YXJ0LCBzYXZlZEVuZCkpKTtcbiAgICAgICAgY29uc3QgZW5kID0gTWF0aC5tYXgoc3RhcnQsIE1hdGgubWluKGJsb2NrLnRleHQubGVuZ3RoLCBNYXRoLm1heChzYXZlZFN0YXJ0LCBzYXZlZEVuZCkpKTtcbiAgICAgICAgaWYgKHN0YXJ0ID09PSBlbmQpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiXHU4QkY3XHU1MTQ4XHU5MDA5XHU2MkU5XHU5NzAwXHU4OTgxXHU4QkJFXHU3RjZFXHU2ODNDXHU1RjBGXHU3Njg0XHU2NTg3XHU1QjU3XCIpO1xuICAgICAgICAgIHNvdXJjZS5mb2N1cygpO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHNvdXJjZS5mb2N1cygpOyBzb3VyY2Uuc2V0U2VsZWN0aW9uUmFuZ2Uoc3RhcnQsIGVuZCk7XG4gICAgICAgIHJldHVybiB7IHN0YXJ0LCBlbmQgfTtcbiAgICAgIH07XG4gICAgICBjb25zdCBzdHlsZUJ1dHRvbiA9IChsYWJlbDogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBhY3Rpb246ICgpID0+IHZvaWQsIGNscyA9IFwiXCIpOiBIVE1MQnV0dG9uRWxlbWVudCA9PiB7XG4gICAgICAgIGNvbnN0IGJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IGBtbWMtcmljaC10b29sYmFyLWJ1dHRvbiAke2Nsc31gLnRyaW0oKSwgdGV4dDogbGFiZWwsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiwgdGl0bGUgfSB9KTtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGV2ZW50KSA9PiBldmVudC5wcmV2ZW50RGVmYXVsdCgpKTtcbiAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgYWN0aW9uKCk7IH0pO1xuICAgICAgICByZXR1cm4gYnRuO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IGFwcGx5Qm9vbGVhbiA9IChrZXk6IFwiYm9sZFwiIHwgXCJpdGFsaWNcIiB8IFwidW5kZXJsaW5lXCIpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSByYW5nZSgpOyBpZiAoIXNlbGVjdGVkKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHN0eWxlcyA9IHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzKGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0KTtcbiAgICAgICAgY29uc3QgZW5hYmxlZCA9IHN0eWxlcy5zbGljZShzZWxlY3RlZC5zdGFydCwgc2VsZWN0ZWQuZW5kKS5ldmVyeSgoc3R5bGUpID0+IHN0eWxlW2tleV0gPT09IHRydWUpO1xuICAgICAgICBibG9jay5yaWNoVGV4dCA9IGFwcGx5UmljaFRleHRTdHlsZVJhbmdlKGJsb2NrLnRleHQsIGJsb2NrLnJpY2hUZXh0LCBzZWxlY3RlZC5zdGFydCwgc2VsZWN0ZWQuZW5kLCB7IFtrZXldOiAhZW5hYmxlZCB9KTtcbiAgICAgICAgdXBkYXRlUHJldmlldygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IHNvdXJjZS5zZXRTZWxlY3Rpb25SYW5nZShzZWxlY3RlZC5zdGFydCwgc2VsZWN0ZWQuZW5kKTsgcmVtZW1iZXIoKTtcbiAgICAgIH07XG4gICAgICBzdHlsZUJ1dHRvbihcIkJcIiwgXCJcdTUyQTBcdTdDOTdcdTYyNDBcdTkwMDlcdTY1ODdcdTVCNTdcIiwgKCkgPT4gYXBwbHlCb29sZWFuKFwiYm9sZFwiKSwgXCJpcy1ib2xkXCIpO1xuICAgICAgc3R5bGVCdXR0b24oXCJJXCIsIFwiXHU2NTlDXHU0RjUzXHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XCIsICgpID0+IGFwcGx5Qm9vbGVhbihcIml0YWxpY1wiKSwgXCJpcy1pdGFsaWNcIik7XG4gICAgICBzdHlsZUJ1dHRvbihcIlVcIiwgXCJcdTdFRDlcdTYyNDBcdTkwMDlcdTY1ODdcdTVCNTdcdTUyQTBcdTRFMEJcdTUyMTJcdTdFQkZcIiwgKCkgPT4gYXBwbHlCb29sZWFuKFwidW5kZXJsaW5lXCIpLCBcImlzLXVuZGVybGluZVwiKTtcbiAgICAgIGNvbnN0IGNvbG9yTGFiZWwgPSB0b29sYmFyLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyBjbHM6IFwibW1jLXJpY2gtY29sb3ItYnV0dG9uXCIsIGF0dHI6IHsgdGl0bGU6IFwiXHU0RkVFXHU2NTM5XHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XHU5ODlDXHU4MjcyXCIgfSB9KTtcbiAgICAgIGNvbG9yTGFiZWwuY3JlYXRlU3Bhbih7IHRleHQ6IFwiXHU5ODlDXHU4MjcyXCIgfSk7XG4gICAgICBjb25zdCBjb2xvckxpbmUgPSBjb2xvckxhYmVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXJpY2gtY29sb3ItbGluZVwiIH0pO1xuICAgICAgY29uc3QgY29sb3IgPSBjb2xvckxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNvbG9yXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IFwiXHU2NTg3XHU1QjU3XHU5ODlDXHU4MjcyXCIgfSB9KTtcbiAgICAgIGNvbG9yLnZhbHVlID0gXCIjZWY0NDQ0XCI7XG4gICAgICBjb2xvckxpbmUuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IudmFsdWU7XG4gICAgICBjb2xvci5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4geyBjb2xvckxpbmUuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IudmFsdWU7IH0pO1xuICAgICAgY29sb3IuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gcmFuZ2UoKTsgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgICAgICBibG9jay5yaWNoVGV4dCA9IGFwcGx5UmljaFRleHRTdHlsZVJhbmdlKGJsb2NrLnRleHQsIGJsb2NrLnJpY2hUZXh0LCBzZWxlY3RlZC5zdGFydCwgc2VsZWN0ZWQuZW5kLCB7IGNvbG9yOiBjb2xvci52YWx1ZSB9KTtcbiAgICAgICAgdXBkYXRlUHJldmlldygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7XG4gICAgICB9KTtcbiAgICAgIHN0eWxlQnV0dG9uKFwiXHU2RTA1XHU5NjY0XHU2ODNDXHU1RjBGXCIsIFwiXHU2RTA1XHU5NjY0XHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XHU2ODNDXHU1RjBGXCIsICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSByYW5nZSgpOyBpZiAoIXNlbGVjdGVkKSByZXR1cm47XG4gICAgICAgIGJsb2NrLnJpY2hUZXh0ID0gYXBwbHlSaWNoVGV4dFN0eWxlUmFuZ2UoYmxvY2sudGV4dCwgYmxvY2sucmljaFRleHQsIHNlbGVjdGVkLnN0YXJ0LCBzZWxlY3RlZC5lbmQsIG51bGwpO1xuICAgICAgICB1cGRhdGVQcmV2aWV3KCk7IHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgIH0sIFwiaXMtd2lkZVwiKTtcbiAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwic2VsZWN0XCIsIHJlbWVtYmVyKTtcbiAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgcmVtZW1iZXIpO1xuICAgICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHJlbWVtYmVyKTtcbiAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCBuZXh0ID0gc291cmNlLnZhbHVlLnJlcGxhY2UoL1xccj9cXG4vZywgXCIgXCIpO1xuICAgICAgICBibG9jay5yaWNoVGV4dCA9IHJlY29uY2lsZVJpY2hUZXh0QWZ0ZXJFZGl0KGJsb2NrLnRleHQsIGJsb2NrLnJpY2hUZXh0LCBuZXh0KTtcbiAgICAgICAgYmxvY2sudGV4dCA9IG5leHQ7XG4gICAgICAgIHNvdXJjZS52YWx1ZSA9IG5leHQ7XG4gICAgICAgIHJlbWVtYmVyKCk7IHVwZGF0ZVByZXZpZXcoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgfSk7XG4gICAgICB1cGRhdGVQcmV2aWV3KCk7IHJlbWVtYmVyKCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGNob29zZUltYWdlID0gKGJsb2NrOiBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2ssIG1vZGU6IFwibG9jYWxcIiB8IFwicmVtb3RlXCIsIHJlZnJlc2g6ICgpID0+IHZvaWQpOiB2b2lkID0+IHtcbiAgICAgIHZvaWQgKGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGhvc3RJZHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGlmIChtb2RlID09PSBcInJlbW90ZVwiKSB7XG4gICAgICAgICAgY29uc3QgY2hvc2VuID0gYXdhaXQgY2hvb3NlSW1hZ2VIb3N0cyh0aGlzLmFwcCwgdGhpcy5jYWxsYmFja3MuZ2V0SW1hZ2VIb3N0cygpLCB0aGlzLmNhbGxiYWNrcy5nZXREZWZhdWx0VXBsb2FkSG9zdElkcygpKTtcbiAgICAgICAgICBpZiAoIWNob3NlbikgcmV0dXJuO1xuICAgICAgICAgIGhvc3RJZHMgPSBjaG9zZW47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IG5ldyBQcm9taXNlPEZpbGUgfCBudWxsPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgICAgIGlucHV0LnR5cGUgPSBcImZpbGVcIjtcbiAgICAgICAgICBpbnB1dC5hY2NlcHQgPSBcImltYWdlLypcIjtcbiAgICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHJlc29sdmUoaW5wdXQuZmlsZXM/LlswXSA/PyBudWxsKSwgeyBvbmNlOiB0cnVlIH0pO1xuICAgICAgICAgIGlucHV0LmNsaWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICAgICAgaWYgKG1vZGUgPT09IFwibG9jYWxcIikge1xuICAgICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vblNhdmVQYXN0ZWRJbWFnZShmaWxlLCBmaWxlLm5hbWUpO1xuICAgICAgICAgIGJsb2NrLnNvdXJjZSA9IHBhdGg7XG4gICAgICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSBwYXRoO1xuICAgICAgICAgIGJsb2NrLnJlbW90ZVNvdXJjZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgYmF0Y2ggPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vblVwbG9hZEltYWdlKGZpbGUsIGZpbGUubmFtZSwgaG9zdElkcyk7XG4gICAgICAgICAgaWYgKCFiYXRjaC5zdWNjZXNzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gYmF0Y2guZmFpbHVyZXMubWFwKChpdGVtKSA9PiBgJHtpdGVtLmhvc3ROYW1lfVx1RkYxQSR7aXRlbS5lcnJvcn1gKS5qb2luKFwiXHVGRjFCXCIpIHx8IFwiXHU2NzJBXHU3N0U1XHU5NTE5XHU4QkVGXCI7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHVwbG9hZGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgYmxvY2suc291cmNlID0gYmF0Y2guc3VjY2Vzc2VzWzBdIS51cmw7XG4gICAgICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgYmxvY2sucmVtb3RlU291cmNlcyA9IGJhdGNoLnN1Y2Nlc3Nlcy5tYXAoKGl0ZW0pID0+ICh7IC4uLml0ZW0sIHVwbG9hZGVkQXQgfSkpO1xuICAgICAgICAgIGlmIChiYXRjaC5mYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYFx1OTBFOFx1NTIwNlx1NTZGRVx1NUU4QVx1NEUwQVx1NEYyMFx1NTkzMVx1OEQyNVx1RkYxQSR7YmF0Y2guZmFpbHVyZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpfWAsIDcwMDApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBcdTVERjJcdTRFMEFcdTRGMjBcdTUyMzBcdUZGMUEke2JhdGNoLnN1Y2Nlc3Nlcy5tYXAoKGl0ZW0pID0+IGl0ZW0uaG9zdE5hbWUpLmpvaW4oXCJcdTMwMDFcIil9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghYmxvY2suYWx0KSBibG9jay5hbHQgPSBmaWxlLm5hbWUucmVwbGFjZSgvXFwuW14uXSskLywgXCJcIik7XG4gICAgICAgIHJlZnJlc2goKTtcbiAgICAgICAgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgfSkoKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGltYWdlIG9wZXJhdGlvbiBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgICBuZXcgTm90aWNlKGAke21vZGUgPT09IFwicmVtb3RlXCIgPyBcIlx1NEUwQVx1NEYyMFx1NTZGRVx1NUU4QVwiIDogXCJcdTRGRERcdTVCNThcdTU2RkVcdTcyNDdcIn1cdTU5MzFcdThEMjVcdUZGMUEke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLCA3MDAwKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCB1cGxvYWRFeGlzdGluZ0ltYWdlID0gKGJsb2NrOiBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2ssIHJlZnJlc2g6ICgpID0+IHZvaWQpOiB2b2lkID0+IHtcbiAgICAgIHZvaWQgKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgY2hvc2VuID0gYXdhaXQgY2hvb3NlSW1hZ2VIb3N0cyh0aGlzLmFwcCwgdGhpcy5jYWxsYmFja3MuZ2V0SW1hZ2VIb3N0cygpLCB0aGlzLmNhbGxiYWNrcy5nZXREZWZhdWx0VXBsb2FkSG9zdElkcygpKTtcbiAgICAgICAgaWYgKCFjaG9zZW4pIHJldHVybjtcbiAgICAgICAgY29uc3QgcmVhZGFibGVTb3VyY2UgPSBibG9jay5sb2NhbFNvdXJjZSB8fCBibG9jay5zb3VyY2U7XG4gICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25SZWFkSW1hZ2VTb3VyY2UocmVhZGFibGVTb3VyY2UpO1xuICAgICAgICBpZiAoIWltYWdlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIlx1NUY1M1x1NTI0RFx1NTZGRVx1NzI0N1x1NEUwRFx1NjYyRlx1NTNFRlx1OEJGQlx1NTNENlx1NzY4NFx1NjcyQ1x1NTczMFx1NjU4N1x1NEVGNlx1RkYxQlx1OEJGN1x1NEY3Rlx1NzUyOFx1MjAxOFx1NEUwQVx1NEYyMFx1NTIzMFx1NTZGRVx1NUU4QVx1MjAxOVx1OTFDRFx1NjVCMFx1OTAwOVx1NjJFOVx1NTZGRVx1NzI0N1wiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmF0Y2ggPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vblVwbG9hZEltYWdlKGltYWdlLmJsb2IsIGltYWdlLnN1Z2dlc3RlZE5hbWUsIGNob3Nlbik7XG4gICAgICAgIGlmICghYmF0Y2guc3VjY2Vzc2VzLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihiYXRjaC5mYWlsdXJlcy5tYXAoKGl0ZW0pID0+IGAke2l0ZW0uaG9zdE5hbWV9XHVGRjFBJHtpdGVtLmVycm9yfWApLmpvaW4oXCJcdUZGMUJcIikgfHwgXCJcdTRFMEFcdTRGMjBcdTU5MzFcdThEMjVcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdXBsb2FkZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBuZXcgTWFwKChibG9jay5yZW1vdGVTb3VyY2VzID8/IFtdKS5tYXAoKGl0ZW0pID0+IFtpdGVtLmhvc3RJZCwgaXRlbV0pKTtcbiAgICAgICAgYmF0Y2guc3VjY2Vzc2VzLmZvckVhY2goKGl0ZW0pID0+IGV4aXN0aW5nLnNldChpdGVtLmhvc3RJZCwgeyAuLi5pdGVtLCB1cGxvYWRlZEF0IH0pKTtcbiAgICAgICAgYmxvY2sucmVtb3RlU291cmNlcyA9IEFycmF5LmZyb20oZXhpc3RpbmcudmFsdWVzKCkpO1xuICAgICAgICBibG9jay5sb2NhbFNvdXJjZSA9IHJlYWRhYmxlU291cmNlO1xuICAgICAgICBpZiAoIWJhdGNoLmZhaWx1cmVzLmxlbmd0aCkgYmxvY2suc291cmNlID0gYmF0Y2guc3VjY2Vzc2VzWzBdIS51cmw7XG4gICAgICAgIHJlZnJlc2goKTtcbiAgICAgICAgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgICBpZiAoYmF0Y2guZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgXHU5MEU4XHU1MjA2XHU1NkZFXHU1RThBXHU0RTBBXHU0RjIwXHU1OTMxXHU4RDI1XHVGRjBDXHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU3NTU5XHVGRjFBJHtiYXRjaC5mYWlsdXJlcy5tYXAoKGl0ZW0pID0+IGl0ZW0uaG9zdE5hbWUpLmpvaW4oXCJcdTMwMDFcIil9YCwgNzAwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3IE5vdGljZShgXHU1RjUzXHU1MjREXHU1NkZFXHU3MjQ3XHU1REYyXHU0RTBBXHU0RjIwXHU1MjMwXHVGRjFBJHtiYXRjaC5zdWNjZXNzZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpfWApO1xuICAgICAgICB9XG4gICAgICB9KSgpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gZXhpc3RpbmcgaW1hZ2UgdXBsb2FkIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIG5ldyBOb3RpY2UoYFx1NEUwQVx1NEYyMFx1NUY1M1x1NTI0RFx1NTZGRVx1NzI0N1x1NTkzMVx1OEQyNVx1RkYxQSR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsIDcwMDApO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHJlbmRlckJsb2NrcyA9ICgpOiB2b2lkID0+IHtcbiAgICAgIGJsb2Nrc0VsLmVtcHR5KCk7XG4gICAgICB3b3JraW5nQmxvY2tzLmZvckVhY2goKGJsb2NrLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBjYXJkID0gYmxvY2tzRWwuY3JlYXRlRGl2KHsgY2xzOiBgbW1jLWNvbnRlbnQtYmxvY2sgaXMtJHtibG9jay50eXBlfWAgfSk7XG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLWhlYWRlclwiIH0pO1xuICAgICAgICBoZWFkZXIuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay10aXRsZVwiLCB0ZXh0OiBibG9jay50eXBlID09PSBcInRleHRcIiA/IGBcdTY1ODdcdTVCNTdcdTU3NTcgJHtpbmRleCArIDF9YCA6IGBcdTU2RkVcdTcyNDdcdTU3NTcgJHtpbmRleCArIDF9YCB9KTtcbiAgICAgICAgY29uc3QgY29udHJvbHMgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLWNvbnRyb2xzXCIgfSk7XG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSAoaWNvbjogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBhY3Rpb246ICgpID0+IHZvaWQsIGRpc2FibGVkID0gZmFsc2UpOiB2b2lkID0+IHtcbiAgICAgICAgICBjb25zdCBidG4gPSBjb250cm9scy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjbGlja2FibGUtaWNvblwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIsIHRpdGxlLCBcImFyaWEtbGFiZWxcIjogdGl0bGUgfSB9KTtcbiAgICAgICAgICBzZXRJY29uKGJ0biwgaWNvbik7IGJ0bi5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IGFjdGlvbigpOyB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgY29udHJvbChcImFycm93LXVwXCIsIFwiXHU0RTBBXHU3OUZCXCIsICgpID0+IHsgW3dvcmtpbmdCbG9ja3NbaW5kZXggLSAxXSwgd29ya2luZ0Jsb2Nrc1tpbmRleF1dID0gW3dvcmtpbmdCbG9ja3NbaW5kZXhdISwgd29ya2luZ0Jsb2Nrc1tpbmRleCAtIDFdIV07IHJlbmRlckJsb2NrcygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0sIGluZGV4ID09PSAwKTtcbiAgICAgICAgY29udHJvbChcImFycm93LWRvd25cIiwgXCJcdTRFMEJcdTc5RkJcIiwgKCkgPT4geyBbd29ya2luZ0Jsb2Nrc1tpbmRleCArIDFdLCB3b3JraW5nQmxvY2tzW2luZGV4XV0gPSBbd29ya2luZ0Jsb2Nrc1tpbmRleF0hLCB3b3JraW5nQmxvY2tzW2luZGV4ICsgMV0hXTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSwgaW5kZXggPT09IHdvcmtpbmdCbG9ja3MubGVuZ3RoIC0gMSk7XG4gICAgICAgIGNvbnRyb2woXCJ0cmFzaC0yXCIsIFwiXHU1MjIwXHU5NjY0XHU1MTg1XHU1QkI5XHU1NzU3XCIsICgpID0+IHsgd29ya2luZ0Jsb2Nrcy5zcGxpY2UoaW5kZXgsIDEpOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICAgICAgaWYgKGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKSB7XG4gICAgICAgICAgcmVuZGVyVGV4dEJsb2NrKGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLWJvZHlcIiB9KSwgYmxvY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1ib2R5IG1tYy1pbWFnZS1ibG9jay1lZGl0b3JcIiB9KTtcbiAgICAgICAgICBjb25zdCBwcmV2aWV3ID0gYm9keS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLWJsb2NrLXByZXZpZXdcIiB9KTtcbiAgICAgICAgICBjb25zdCByZWZyZXNoID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgcHJldmlldy5lbXB0eSgpO1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLmNhbGxiYWNrcy5yZXNvbHZlSW1hZ2UoYmxvY2suc291cmNlKTtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZCkge1xuICAgICAgICAgICAgICBjb25zdCBpbWcgPSBwcmV2aWV3LmNyZWF0ZUVsKFwiaW1nXCIsIHsgYXR0cjogeyBzcmM6IHJlc29sdmVkLCBhbHQ6IGJsb2NrLmFsdCB8fCBcIlx1NTZGRVx1NzI0N1wiIH0gfSk7XG4gICAgICAgICAgICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gbmV3IEltYWdlUHJldmlld01vZGFsKHRoaXMuYXBwLCByZXNvbHZlZCwgYmxvY2suYWx0IHx8IFwiXHU1NkZFXHU3MjQ3XCIpLm9wZW4oKSk7XG4gICAgICAgICAgICB9IGVsc2UgcHJldmlldy5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLXBsYWNlaG9sZGVyXCIsIHRleHQ6IGJsb2NrLnNvdXJjZSA/IFwiXHU2NUUwXHU2Q0Q1XHU1MkEwXHU4RjdEXHU1NkZFXHU3MjQ3XCIgOiBcIlx1NUMxQVx1NjcyQVx1OTAwOVx1NjJFOVx1NTZGRVx1NzI0N1wiIH0pO1xuICAgICAgICAgICAgc291cmNlLnZhbHVlID0gYmxvY2suc291cmNlO1xuICAgICAgICAgICAgYWx0LnZhbHVlID0gYmxvY2suYWx0ID8/IFwiXCI7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBjb25zdCBzb3VyY2VMYWJlbCA9IGJvZHkuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1NkZFXHU3MjQ3XHU4REVGXHU1Rjg0XHU2MjE2XHU3RjUxXHU1NzQwXCIgfSk7XG4gICAgICAgICAgY29uc3Qgc291cmNlID0gc291cmNlTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIlx1NEVEM1x1NUU5M1x1OERFRlx1NUY4NFx1MzAwMVtbXHU1NkZFXHU3MjQ3XV0gXHU2MjE2IGh0dHBzOi8vLi4uXCIgfSB9KTtcbiAgICAgICAgICBjb25zdCBhbHRMYWJlbCA9IGJvZHkuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1NkZFXHU3MjQ3XHU4QkY0XHU2NjBFXHVGRjA4XHU1M0VGXHU5MDA5XHVGRjA5XCIgfSk7XG4gICAgICAgICAgY29uc3QgYWx0ID0gYWx0TGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIlx1NTZGRVx1NzI0N1x1OEJGNFx1NjYwRVwiIH0gfSk7XG4gICAgICAgICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXh0ID0gc291cmNlLnZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIGlmIChuZXh0ICE9PSBibG9jay5zb3VyY2UpIHtcbiAgICAgICAgICAgICAgYmxvY2suc291cmNlID0gbmV4dDtcbiAgICAgICAgICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIGJsb2NrLnJlbW90ZVNvdXJjZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgICAgICBzY2hlZHVsZUF1dG9TYXZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYWx0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7IGJsb2NrLmFsdCA9IGFsdC52YWx1ZS50cmltKCkgfHwgdW5kZWZpbmVkOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0pO1xuICAgICAgICAgIGNvbnN0IGFjdGlvbnMgPSBib2R5LmNyZWF0ZURpdih7IGNsczogXCJtbWMtaW1hZ2UtYmxvY2stYWN0aW9uc1wiIH0pO1xuICAgICAgICAgIGNvbnN0IGxvY2FsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU0RkREXHU1QjU4XHU1MjMwXHU0RUQzXHU1RTkzXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgICAgICAgIGxvY2FsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBjaG9vc2VJbWFnZShibG9jaywgXCJsb2NhbFwiLCByZWZyZXNoKSk7XG4gICAgICAgICAgY29uc3QgcmVtb3RlID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU5MDA5XHU2MkU5XHU2NTg3XHU0RUY2XHU1RTc2XHU0RTBBXHU0RjIwXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgICAgICAgIHJlbW90ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gY2hvb3NlSW1hZ2UoYmxvY2ssIFwicmVtb3RlXCIsIHJlZnJlc2gpKTtcbiAgICAgICAgICBpZiAoYmxvY2subG9jYWxTb3VyY2UgfHwgKGJsb2NrLnNvdXJjZSAmJiAhL15odHRwcz86XFwvXFwvL2kudGVzdChibG9jay5zb3VyY2UpKSkge1xuICAgICAgICAgICAgY29uc3QgdXBsb2FkQ3VycmVudCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NEUwQVx1NEYyMFx1NUY1M1x1NTI0RFx1NTZGRVx1NzI0N1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgICAgICAgIHVwbG9hZEN1cnJlbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHVwbG9hZEV4aXN0aW5nSW1hZ2UoYmxvY2ssIHJlZnJlc2gpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGJsb2NrLnJlbW90ZVNvdXJjZXM/Lmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgbWlycm9ycyA9IGJvZHkuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1taXJyb3JzXCIgfSk7XG4gICAgICAgICAgICBtaXJyb3JzLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1zLWltYWdlLW1pcnJvcnMtbGFiZWxcIiwgdGV4dDogXCJcdThGRENcdTdBMEJcdTk1NUNcdTUwQ0ZcdUZGMUFcIiB9KTtcbiAgICAgICAgICAgIGJsb2NrLnJlbW90ZVNvdXJjZXMuZm9yRWFjaCgoaXRlbSwgbWlycm9ySW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgbGluayA9IG1pcnJvcnMuY3JlYXRlRWwoXCJhXCIsIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBpdGVtLmhvc3ROYW1lIHx8IGBcdTU2RkVcdTVFOEEgJHttaXJyb3JJbmRleCArIDF9YCxcbiAgICAgICAgICAgICAgICBocmVmOiBpdGVtLnVybCxcbiAgICAgICAgICAgICAgICBhdHRyOiB7IHRhcmdldDogXCJfYmxhbmtcIiwgcmVsOiBcIm5vb3BlbmVyXCIgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICghd29ya2luZ0Jsb2Nrcy5sZW5ndGgpIGJsb2Nrc0VsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZW1wdHktY29udGVudC1oaW50XCIsIHRleHQ6IFwiXHU1RjUzXHU1MjREXHU2Q0ExXHU2NzA5XHU1MTg1XHU1QkI5XHU1NzU3XHUzMDAyXHU4QkY3XHU2REZCXHU1MkEwXHU2NTg3XHU1QjU3XHU2MjE2XHU1NkZFXHU3MjQ3XHUzMDAyXCIgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGFkZFRleHQgPSBhY3Rpb25Sb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIisgXHU2NTg3XHU1QjU3XCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGFkZFRleHQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgd29ya2luZ0Jsb2Nrcy5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0OiBcIlwiIH0pOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICBjb25zdCBhZGRJbWFnZSA9IGFjdGlvblJvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTU2RkVcdTcyNDdcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgYWRkSW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgd29ya2luZ0Jsb2Nrcy5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBcIlwiIH0pOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICByZW5kZXJCbG9ja3MoKTtcblxuICAgIGNvbnN0IGRldGFpbHNHcmlkID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWZvcm0tZ3JpZFwiIH0pO1xuICAgIGNvbnN0IGljb25MYWJlbCA9IGRldGFpbHNHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NjgwN1x1NjIxNiBFbW9qaVwiIH0pO1xuICAgIGNvbnN0IGljb25JbnB1dCA9IGljb25MYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiXHU0RjhCXHU1OTgyIFx1RDgzRFx1RENBMVwiIH0gfSk7XG4gICAgaWNvbklucHV0LnZhbHVlID0gdGhpcy5ub2RlLmljb24gPz8gXCJcIjtcbiAgICBjb25zdCB0YXNrTGFiZWwgPSBkZXRhaWxzR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTRFRkJcdTUyQTFcdTcyQjZcdTYwMDFcIiB9KTtcbiAgICBjb25zdCB0YXNrU2VsZWN0ID0gdGFza0xhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcIlwiLCBcIlx1NjVFMFwiXSwgW1widG9kb1wiLCBcIlx1NUY4NVx1NTI5RVwiXSwgW1wiZG9pbmdcIiwgXCJcdThGREJcdTg4NENcdTRFMkRcIl0sIFtcImRvbmVcIiwgXCJcdTVERjJcdTVCOENcdTYyMTBcIl1dIGFzIGNvbnN0KSB0YXNrU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICB0YXNrU2VsZWN0LnZhbHVlID0gdGhpcy5ub2RlLnRhc2sgPz8gXCJcIjtcbiAgICBjb25zdCBzaGFwZUxhYmVsID0gZGV0YWlsc0dyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4MjgyXHU3MEI5XHU1RjYyXHU3MkI2XCIgfSk7XG4gICAgY29uc3Qgc2hhcGVTZWxlY3QgPSBzaGFwZUxhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcInJvdW5kZWRcIiwgXCJcdTU3MDZcdTg5RDJcIl0sIFtcInBpbGxcIiwgXCJcdTgwRjZcdTU2Q0FcIl0sIFtcInJlY3RhbmdsZVwiLCBcIlx1NzZGNFx1ODlEMlwiXV0gYXMgY29uc3QpIHNoYXBlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBzaGFwZVNlbGVjdC52YWx1ZSA9IHRoaXMubm9kZS5zdHlsZT8uc2hhcGUgPz8gdGhpcy5kZWZhdWx0U2hhcGU7XG4gICAgY29uc3QgdGFnc0xhYmVsID0gZGV0YWlsc0dyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU2ODA3XHU3QjdFXHVGRjA4XHU5MDE3XHU1M0Y3XHU1MjA2XHU5Njk0XHVGRjA5XCIgfSk7XG4gICAgY29uc3QgdGFnc0lucHV0ID0gdGFnc0xhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiB9KTtcbiAgICB0YWdzSW5wdXQudmFsdWUgPSB0aGlzLm5vZGUudGFncz8uam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICBjb25zdCBzdHlsZUdyaWQgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZm9ybS1ncmlkIG1tYy1zdHlsZS1ncmlkXCIgfSk7XG4gICAgY29uc3QgY29sb3JDb250cm9sID0gKGxhYmVsVGV4dDogc3RyaW5nLCBjdXJyZW50OiBzdHJpbmcgfCB1bmRlZmluZWQsIGZhbGxiYWNrOiBzdHJpbmcpOiBbSFRNTElucHV0RWxlbWVudCwgSFRNTElucHV0RWxlbWVudF0gPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBzdHlsZUdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsVGV4dCB9KTtcbiAgICAgIGNvbnN0IHJvdyA9IGxhYmVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29sb3Itcm93XCIgfSk7XG4gICAgICBjb25zdCB0b2dnbGUgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcbiAgICAgIGNvbnN0IGNvbG9yID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNvbG9yXCIgfSk7XG4gICAgICB0b2dnbGUuY2hlY2tlZCA9IEJvb2xlYW4oY3VycmVudCk7IGNvbG9yLnZhbHVlID0gY3VycmVudCA/PyBmYWxsYmFjazsgY29sb3IuZGlzYWJsZWQgPSAhdG9nZ2xlLmNoZWNrZWQ7XG4gICAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7IGNvbG9yLmRpc2FibGVkID0gIXRvZ2dsZS5jaGVja2VkOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0pO1xuICAgICAgY29sb3IuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBzY2hlZHVsZUF1dG9TYXZlKTtcbiAgICAgIHJldHVybiBbdG9nZ2xlLCBjb2xvcl07XG4gICAgfTtcbiAgICBjb25zdCBbY29sb3JUb2dnbGUsIGNvbG9ySW5wdXRdID0gY29sb3JDb250cm9sKFwiXHU4MjgyXHU3MEI5XHU5ODlDXHU4MjcyXCIsIHRoaXMubm9kZS5zdHlsZT8uY29sb3IsIFwiIzRmNDZlNVwiKTtcbiAgICBjb25zdCBbdGV4dENvbG9yVG9nZ2xlLCB0ZXh0Q29sb3JJbnB1dF0gPSBjb2xvckNvbnRyb2woXCJcdTY1NzRcdTgyODJcdTcwQjlcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIiwgdGhpcy5ub2RlLnN0eWxlPy50ZXh0Q29sb3IsIFwiI2ZmZmZmZlwiKTtcbiAgICBjb25zdCBbYm9yZGVyQ29sb3JUb2dnbGUsIGJvcmRlckNvbG9ySW5wdXRdID0gY29sb3JDb250cm9sKFwiXHU4RkI5XHU2ODQ2XHU5ODlDXHU4MjcyXCIsIHRoaXMubm9kZS5zdHlsZT8uYm9yZGVyQ29sb3IsIFwiIzk0YTNiOFwiKTtcbiAgICBjb25zdCBudW1iZXJDb250cm9sID0gKGxhYmVsVGV4dDogc3RyaW5nLCBjdXJyZW50OiBudW1iZXIgfCB1bmRlZmluZWQsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgc3RlcDogbnVtYmVyKTogSFRNTElucHV0RWxlbWVudCA9PiB7XG4gICAgICBjb25zdCBsYWJlbCA9IHN0eWxlR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogbGFiZWxUZXh0IH0pO1xuICAgICAgY29uc3QgaW5wdXQgPSBsYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgYXR0cjogeyBtaW46IFN0cmluZyhtaW4pLCBtYXg6IFN0cmluZyhtYXgpLCBzdGVwOiBTdHJpbmcoc3RlcCksIHBsYWNlaG9sZGVyOiBcIlx1OERERlx1OTY4Rlx1OUVEOFx1OEJBNFwiIH0gfSk7XG4gICAgICBpbnB1dC52YWx1ZSA9IGN1cnJlbnQ/LnRvU3RyaW5nKCkgPz8gXCJcIjsgcmV0dXJuIGlucHV0O1xuICAgIH07XG4gICAgY29uc3QgYm9yZGVyV2lkdGhJbnB1dCA9IG51bWJlckNvbnRyb2woXCJcdThGQjlcdTY4NDZcdTdDOTdcdTdFQzZcIiwgdGhpcy5ub2RlLnN0eWxlPy5ib3JkZXJXaWR0aCwgMCwgNiwgLjUpO1xuICAgIGNvbnN0IGZvbnRTaXplSW5wdXQgPSBudW1iZXJDb250cm9sKFwiXHU1QjU3XHU1M0Y3XCIsIHRoaXMubm9kZS5zdHlsZT8uZm9udFNpemUsIDEwLCAzMiwgMSk7XG4gICAgY29uc3QgYm9vbGVhbkNvbnRyb2wgPSAobGFiZWxUZXh0OiBzdHJpbmcsIGN1cnJlbnQ6IGJvb2xlYW4gfCB1bmRlZmluZWQpOiBIVE1MU2VsZWN0RWxlbWVudCA9PiB7XG4gICAgICBjb25zdCBsYWJlbCA9IHN0eWxlR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogbGFiZWxUZXh0IH0pO1xuICAgICAgY29uc3Qgc2VsZWN0ID0gbGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBcIlx1OERERlx1OTY4Rlx1OUVEOFx1OEJBNFwiLCBhdHRyOiB7IHZhbHVlOiBcImluaGVyaXRcIiB9IH0pO1xuICAgICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcdTVGMDBcdTU0MkZcIiwgYXR0cjogeyB2YWx1ZTogXCJ0cnVlXCIgfSB9KTtcbiAgICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHU1MTczXHU5NUVEXCIsIGF0dHI6IHsgdmFsdWU6IFwiZmFsc2VcIiB9IH0pO1xuICAgICAgc2VsZWN0LnZhbHVlID0gY3VycmVudCA9PT0gdW5kZWZpbmVkID8gXCJpbmhlcml0XCIgOiBjdXJyZW50ID8gXCJ0cnVlXCIgOiBcImZhbHNlXCI7IHJldHVybiBzZWxlY3Q7XG4gICAgfTtcbiAgICBjb25zdCBib2xkSW5wdXQgPSBib29sZWFuQ29udHJvbChcIlx1NjU3NFx1ODI4Mlx1NzBCOVx1NTJBMFx1N0M5N1wiLCB0aGlzLm5vZGUuc3R5bGU/LmJvbGQpO1xuICAgIGNvbnN0IGl0YWxpY0lucHV0ID0gYm9vbGVhbkNvbnRyb2woXCJcdTY1NzRcdTgyODJcdTcwQjlcdTY1OUNcdTRGNTNcIiwgdGhpcy5ub2RlLnN0eWxlPy5pdGFsaWMpO1xuICAgIGNvbnN0IHVuZGVybGluZUlucHV0ID0gYm9vbGVhbkNvbnRyb2woXCJcdTY1NzRcdTgyODJcdTcwQjlcdTRFMEJcdTUyMTJcdTdFQkZcIiwgdGhpcy5ub2RlLnN0eWxlPy51bmRlcmxpbmUpO1xuXG4gICAgY29uc3Qgbm90ZUxhYmVsID0gZm9ybS5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTU5MDdcdTZDRThcdUZGMDhcdTUzRUZcdTkwMDlcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBub3RlSW5wdXQgPSBub3RlTGFiZWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiKTsgbm90ZUlucHV0LnZhbHVlID0gdGhpcy5ub2RlLm5vdGUgPz8gXCJcIjsgbm90ZUlucHV0LnJvd3MgPSA0O1xuICAgIGNvbnN0IGxpbmtMYWJlbCA9IGZvcm0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU5NEZFXHU2M0E1XHVGRjA4XHU3RjUxXHU1NzQwXHUzMDAxXHU3QjE0XHU4QkIwXHU1NDBEXHU2MjE2IFtbXHU1M0NDXHU5NEZFXV1cdUZGMDlcIiB9KTtcbiAgICBjb25zdCBsaW5rSW5wdXQgPSBsaW5rTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiIH0pOyBsaW5rSW5wdXQudmFsdWUgPSB0aGlzLm5vZGUubGluayA/PyBcIlwiO1xuXG4gICAgY29uc3QgcGFyc2VCb29sID0gKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHwgdW5kZWZpbmVkID0+IHZhbHVlID09PSBcInRydWVcIiA/IHRydWUgOiB2YWx1ZSA9PT0gXCJmYWxzZVwiID8gZmFsc2UgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcGFyc2VOdW1iZXIgPSAodmFsdWU6IHN0cmluZywgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHwgdW5kZWZpbmVkID0+IHZhbHVlLnRyaW0oKSAmJiBOdW1iZXIuaXNGaW5pdGUoTnVtYmVyKHZhbHVlKSkgPyBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgTnVtYmVyKHZhbHVlKSkpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGNvbGxlY3RWYWx1ZXMgPSAoc2hvd05vdGljZTogYm9vbGVhbik6IE5vZGVFZGl0VmFsdWVzIHwgbnVsbCA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gdmFsaWRCbG9ja3MoKTtcbiAgICAgIGlmICghY29udGVudC5sZW5ndGgpIHsgaWYgKHNob3dOb3RpY2UpIG5ldyBOb3RpY2UoXCJcdTgyODJcdTcwQjlcdTgxRjNcdTVDMTFcdTk3MDBcdTg5ODFcdTRFMDBcdTRFMkFcdTY1ODdcdTVCNTdcdTU3NTdcdTYyMTZcdTU2RkVcdTcyNDdcdTU3NTdcIik7IHJldHVybiBudWxsOyB9XG4gICAgICBjb25zdCB0YXNrID0gdGFza1NlbGVjdC52YWx1ZTtcbiAgICAgIGNvbnN0IHNoYXBlID0gc2hhcGVTZWxlY3QudmFsdWU7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50LFxuICAgICAgICBub3RlOiBub3RlSW5wdXQudmFsdWUudHJpbSgpLCBsaW5rOiBsaW5rSW5wdXQudmFsdWUudHJpbSgpLCBpY29uOiBpY29uSW5wdXQudmFsdWUudHJpbSgpLnNsaWNlKDAsIDEyKSxcbiAgICAgICAgdGFnczogQXJyYXkuZnJvbShuZXcgU2V0KHRhZ3NJbnB1dC52YWx1ZS5zcGxpdCgvWyxcdUZGMENdLykubWFwKCh0YWcpID0+IHRhZy50cmltKCkucmVwbGFjZSgvXiMvLCBcIlwiKSkuZmlsdGVyKEJvb2xlYW4pKSkuc2xpY2UoMCwgMTIpLFxuICAgICAgICB0YXNrOiB0YXNrID09PSBcInRvZG9cIiB8fCB0YXNrID09PSBcImRvaW5nXCIgfHwgdGFzayA9PT0gXCJkb25lXCIgPyB0YXNrIDogdW5kZWZpbmVkLFxuICAgICAgICBjb2xvcjogY29sb3JUb2dnbGUuY2hlY2tlZCA/IGNvbG9ySW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIHRleHRDb2xvcjogdGV4dENvbG9yVG9nZ2xlLmNoZWNrZWQgPyB0ZXh0Q29sb3JJbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgYm9yZGVyQ29sb3I6IGJvcmRlckNvbG9yVG9nZ2xlLmNoZWNrZWQgPyBib3JkZXJDb2xvcklucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBib3JkZXJXaWR0aDogcGFyc2VOdW1iZXIoYm9yZGVyV2lkdGhJbnB1dC52YWx1ZSwgMCwgNiksXG4gICAgICAgIHNoYXBlOiBzaGFwZSA9PT0gXCJwaWxsXCIgfHwgc2hhcGUgPT09IFwicmVjdGFuZ2xlXCIgfHwgc2hhcGUgPT09IFwicm91bmRlZFwiID8gc2hhcGUgOiB1bmRlZmluZWQsXG4gICAgICAgIGJvbGQ6IHBhcnNlQm9vbChib2xkSW5wdXQudmFsdWUpLCBpdGFsaWM6IHBhcnNlQm9vbChpdGFsaWNJbnB1dC52YWx1ZSksIHVuZGVybGluZTogcGFyc2VCb29sKHVuZGVybGluZUlucHV0LnZhbHVlKSxcbiAgICAgICAgZm9udFNpemU6IHBhcnNlTnVtYmVyKGZvbnRTaXplSW5wdXQudmFsdWUsIDEwLCAzMilcbiAgICAgIH07XG4gICAgfTtcblxuICAgIGxldCB0aW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGxhc3QgPSBKU09OLnN0cmluZ2lmeShjb2xsZWN0VmFsdWVzKGZhbHNlKSk7XG4gICAgY29uc3Qgc2F2ZU5vdyA9IChtb2RlOiBcImF1dG9zYXZlXCIgfCBcImNvbW1pdFwiLCBzaG93Tm90aWNlID0gZmFsc2UpOiBib29sZWFuID0+IHtcbiAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkgeyB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTsgdGltZXIgPSBudWxsOyB9XG4gICAgICBjb25zdCB2YWx1ZXMgPSBjb2xsZWN0VmFsdWVzKHNob3dOb3RpY2UpOyBpZiAoIXZhbHVlcykgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3Qgc2lnbmF0dXJlID0gSlNPTi5zdHJpbmdpZnkodmFsdWVzKTtcbiAgICAgIGlmIChzaWduYXR1cmUgIT09IGxhc3QpIHsgdGhpcy5zdWJtaXQodmFsdWVzLCBtb2RlKTsgbGFzdCA9IHNpZ25hdHVyZTsgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBzY2hlZHVsZUF1dG9TYXZlID0gKCk6IHZvaWQgPT4geyBpZiAodGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpOyB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHNhdmVOb3coXCJhdXRvc2F2ZVwiKSwgMjgwKTsgfTtcbiAgICB0aGlzLnNhdmVPbkNsb3NlID0gKCkgPT4geyBzYXZlTm93KFwiY29tbWl0XCIpOyB9O1xuXG4gICAgW2ljb25JbnB1dCwgdGFza1NlbGVjdCwgc2hhcGVTZWxlY3QsIHRhZ3NJbnB1dCwgYm9yZGVyV2lkdGhJbnB1dCwgZm9udFNpemVJbnB1dCwgYm9sZElucHV0LCBpdGFsaWNJbnB1dCwgdW5kZXJsaW5lSW5wdXQsIG5vdGVJbnB1dCwgbGlua0lucHV0XVxuICAgICAgLmZvckVhY2goKGlucHV0KSA9PiB7IGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBzY2hlZHVsZUF1dG9TYXZlKTsgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBzY2hlZHVsZUF1dG9TYXZlKTsgfSk7XG5cbiAgICBjb25zdCBidXR0b25zID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWZvcm0tYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGNsb3NlQnV0dG9uID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtb2QtY3RhXCIsIHRleHQ6IFwiXHU0RkREXHU1QjU4XHU1RTc2XHU1MTczXHU5NUVEXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGNsb3NlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IGlmIChzYXZlTm93KFwiY29tbWl0XCIsIHRydWUpKSB7IHRoaXMuY2xvc2VXaXRob3V0Rmx1c2ggPSB0cnVlOyB0aGlzLmNsb3NlKCk7IH0gfSk7XG5cbiAgICB0aGlzLm91dHNpZGVQb2ludGVySGFuZGxlciA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBpZiAodGhpcy5tb2RhbEVsLmNvbnRhaW5zKGV2ZW50LnRhcmdldCBhcyBOb2RlKSkgcmV0dXJuO1xuICAgICAgdGhpcy5zYXZlT25DbG9zZT8uKCk7IHRoaXMuY2xvc2VXaXRob3V0Rmx1c2ggPSB0cnVlOyB0aGlzLmNsb3NlKCk7XG4gICAgfTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgdGhpcy5vdXRzaWRlUG9pbnRlckhhbmRsZXIhLCB0cnVlKSwgMCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jbG9zZVdpdGhvdXRGbHVzaCkgdGhpcy5zYXZlT25DbG9zZT8uKCk7XG4gICAgaWYgKHRoaXMub3V0c2lkZVBvaW50ZXJIYW5kbGVyKSBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgdGhpcy5vdXRzaWRlUG9pbnRlckhhbmRsZXIsIHRydWUpO1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn1cblxuY2xhc3MgQXBwZWFyYW5jZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlO1xuICBwcml2YXRlIHJlYWRvbmx5IHN1Ym1pdDogKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKSA9PiB2b2lkO1xuICBwcml2YXRlIHJlYWRvbmx5IHJlc2V0OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSwgc3VibWl0OiAoYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UpID0+IHZvaWQsIHJlc2V0OiAoKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmFwcGVhcmFuY2UgPSBhcHBlYXJhbmNlO1xuICAgIHRoaXMuc3VibWl0ID0gc3VibWl0O1xuICAgIHRoaXMucmVzZXQgPSByZXNldDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTkxNlx1ODlDMlwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcIm1tYy1hcHBlYXJhbmNlLW1vZGFsXCIpO1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImZvcm1cIik7XG4gICAgZm9ybS5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsIHRleHQ6IFwiXHU4RkQ5XHU0RTlCXHU4QkJFXHU3RjZFXHU1M0VBXHU0RkREXHU1QjU4XHU1MjMwXHU1RjUzXHU1MjREIC5taW5kbWFwIFx1NjU4N1x1NEVGNlx1RkYwQ1x1NEUwRFx1NEYxQVx1NEZFRVx1NjUzOVx1NjNEMlx1NEVGNlx1NTE2OFx1NUM0MFx1OUVEOFx1OEJBNFx1NTAzQ1x1MzAwMlwiIH0pO1xuXG4gICAgY29uc3QgZ3JpZCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1mb3JtLWdyaWQgbW1jLWFwcGVhcmFuY2UtZ3JpZFwiIH0pO1xuICAgIGNvbnN0IGFkZENvbG9yID0gKGxhYmVsVGV4dDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBmYWxsYmFjazogc3RyaW5nKTogeyB0b2dnbGU6IEhUTUxJbnB1dEVsZW1lbnQ7IGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IH0gPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBsYWJlbFRleHQgfSk7XG4gICAgICBjb25zdCByb3cgPSBsYWJlbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbG9yLXJvd1wiIH0pO1xuICAgICAgY29uc3QgdG9nZ2xlID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgICBjb25zdCBpbnB1dCA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjb2xvclwiIH0pO1xuICAgICAgdG9nZ2xlLmNoZWNrZWQgPSBCb29sZWFuKHZhbHVlKTtcbiAgICAgIGlucHV0LnZhbHVlID0gdmFsdWUgPz8gZmFsbGJhY2s7XG4gICAgICBpbnB1dC5kaXNhYmxlZCA9ICF0b2dnbGUuY2hlY2tlZDtcbiAgICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHsgaW5wdXQuZGlzYWJsZWQgPSAhdG9nZ2xlLmNoZWNrZWQ7IH0pO1xuICAgICAgcmV0dXJuIHsgdG9nZ2xlLCBpbnB1dCB9O1xuICAgIH07XG5cbiAgICBjb25zdCBiYWNrZ3JvdW5kID0gYWRkQ29sb3IoXCJcdTgwQ0NcdTY2NkZcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvciwgXCIjZjhmYWZjXCIpO1xuICAgIGNvbnN0IHBhdHRlcm5MYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XCIgfSk7XG4gICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBhdHRlcm5MYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJub25lXCIsIFwiXHU2NUUwXCJdLCBbXCJncmlkXCIsIFwiXHU3RjUxXHU2ODNDXCJdLCBbXCJkb3RzXCIsIFwiXHU3MEI5XHU5NjM1XCJdXSBhcyBjb25zdCkgcGF0dGVyblNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA/PyBcImdyaWRcIjtcbiAgICBjb25zdCBwYXR0ZXJuQ29sb3IgPSBhZGRDb2xvcihcIlx1NTZGRVx1Njg0OFx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UucGF0dGVybkNvbG9yLCBcIiM5NGEzYjhcIik7XG5cbiAgICBjb25zdCBmb250TGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NUI1N1x1NEY1M1wiIH0pO1xuICAgIGNvbnN0IGZvbnRTZWxlY3QgPSBmb250TGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZm9yIChjb25zdCBbdmFsdWUsIGxhYmVsXSBvZiBbW1wib2JzaWRpYW5cIiwgXCJcdThEREZcdTk2OEYgT2JzaWRpYW5cIl0sIFtcInNhbnNcIiwgXCJcdTY1RTBcdTg4NkNcdTdFQkZcIl0sIFtcInNlcmlmXCIsIFwiXHU4ODZDXHU3RUJGXCJdLCBbXCJtb25vXCIsIFwiXHU3QjQ5XHU1QkJEXCJdLCBbXCJjdXN0b21cIiwgXCJcdTgxRUFcdTVCOUFcdTRFNDlcIl1dIGFzIGNvbnN0KSBmb250U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBmb250U2VsZWN0LnZhbHVlID0gdGhpcy5hcHBlYXJhbmNlLmZvbnRGYW1pbHkgPz8gXCJvYnNpZGlhblwiO1xuICAgIGNvbnN0IGN1c3RvbUZvbnRMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHU1QjU3XHU0RjUzXHU1NDBEXHU3OUYwXCIgfSk7XG4gICAgY29uc3QgY3VzdG9tRm9udElucHV0ID0gY3VzdG9tRm9udExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJNaWNyb3NvZnQgWWFIZWlcIiB9IH0pO1xuICAgIGN1c3RvbUZvbnRJbnB1dC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5jdXN0b21Gb250ID8/IFwiXCI7XG4gICAgY29uc3QgdXBkYXRlQ3VzdG9tRm9udCA9ICgpOiB2b2lkID0+IHsgY3VzdG9tRm9udElucHV0LmRpc2FibGVkID0gZm9udFNlbGVjdC52YWx1ZSAhPT0gXCJjdXN0b21cIjsgfTtcbiAgICBmb250U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlQ3VzdG9tRm9udCk7XG4gICAgdXBkYXRlQ3VzdG9tRm9udCgpO1xuXG4gICAgY29uc3QgZm9udFNpemVMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1QjU3XHU1M0Y3XHVGRjA4MTBcdTIwMTMzMFx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IGZvbnRTaXplSW5wdXQgPSBmb250U2l6ZUxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIxMFwiLCBtYXg6IFwiMzBcIiwgc3RlcDogXCIxXCIgfSB9KTtcbiAgICBmb250U2l6ZUlucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMuYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNCk7XG5cbiAgICBjb25zdCBlZGdlQ29sb3IgPSBhZGRDb2xvcihcIlx1OEZERVx1N0VCRlx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UuZWRnZUNvbG9yLCBcIiM3YzhhYTVcIik7XG4gICAgY29uc3QgZWRnZVN0eWxlTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEZERVx1N0VCRlx1N0M3Qlx1NTc4QlwiIH0pO1xuICAgIGNvbnN0IGVkZ2VTdHlsZVNlbGVjdCA9IGVkZ2VTdHlsZUxhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcImN1cnZlZFwiLCBcIlx1NjZGMlx1N0VCRlwiXSwgW1wic3RyYWlnaHRcIiwgXCJcdTc2RjRcdTdFQkZcIl0sIFtcImVsYm93XCIsIFwiXHU2Mjk4XHU3RUJGXCJdXSBhcyBjb25zdCkgZWRnZVN0eWxlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBlZGdlU3R5bGVTZWxlY3QudmFsdWUgPSB0aGlzLmFwcGVhcmFuY2UuZWRnZVN0eWxlID8/IFwiY3VydmVkXCI7XG4gICAgY29uc3QgZWRnZVdpZHRoTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEZERVx1N0VCRlx1N0M5N1x1N0VDNlx1RkYwODAuNVx1MjAxMzhcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBlZGdlV2lkdGhJbnB1dCA9IGVkZ2VXaWR0aExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIwLjVcIiwgbWF4OiBcIjhcIiwgc3RlcDogXCIwLjVcIiB9IH0pO1xuICAgIGVkZ2VXaWR0aElucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMuYXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gMi4yKTtcblxuICAgIGNvbnN0IG5vZGVDb2xvciA9IGFkZENvbG9yKFwiXHU4MjgyXHU3MEI5XHU4MENDXHU2NjZGXHU4MjcyXCIsIHRoaXMuYXBwZWFyYW5jZS5ub2RlQ29sb3IsIFwiI2ZmZmZmZlwiKTtcbiAgICBjb25zdCB0ZXh0Q29sb3IgPSBhZGRDb2xvcihcIlx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UudGV4dENvbG9yLCBcIiMwZjE3MmFcIik7XG4gICAgY29uc3QgYm9yZGVyQ29sb3IgPSBhZGRDb2xvcihcIlx1ODI4Mlx1NzBCOVx1OEZCOVx1Njg0Nlx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yLCBcIiM5NGEzYjhcIik7XG4gICAgY29uc3QgYm9yZGVyV2lkdGhMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4RkI5XHU2ODQ2XHU3Qzk3XHU3RUM2XHVGRjA4MFx1MjAxMzZcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBib3JkZXJXaWR0aElucHV0ID0gYm9yZGVyV2lkdGhMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgYXR0cjogeyBtaW46IFwiMFwiLCBtYXg6IFwiNlwiLCBzdGVwOiBcIjAuNVwiIH0gfSk7XG4gICAgYm9yZGVyV2lkdGhJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLmFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IDEpO1xuXG4gICAgY29uc3QgdGV4dFN0eWxlU2VjdGlvbiA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1hcHBlYXJhbmNlLXRleHQtc3R5bGVcIiB9KTtcbiAgICB0ZXh0U3R5bGVTZWN0aW9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtYXBwZWFyYW5jZS10ZXh0LXN0eWxlLXRpdGxlXCIsIHRleHQ6IFwiXHU2NTg3XHU1QjU3XHU2ODM3XHU1RjBGXCIgfSk7XG4gICAgY29uc3QgdGV4dFN0eWxlID0gdGV4dFN0eWxlU2VjdGlvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWFwcGVhcmFuY2Utc3R5bGUtb3B0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGFkZENoZWNrID0gKHRleHQ6IHN0cmluZywgY2hlY2tlZDogYm9vbGVhbik6IEhUTUxJbnB1dEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSB0ZXh0U3R5bGUuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJtbWMtYXBwZWFyYW5jZS1zdHlsZS1vcHRpb25cIiB9KTtcbiAgICAgIGNvbnN0IGlucHV0ID0gbGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcbiAgICAgIGlucHV0LmNoZWNrZWQgPSBjaGVja2VkO1xuICAgICAgbGFiZWwuY3JlYXRlU3Bhbih7IHRleHQgfSk7XG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcbiAgICBjb25zdCBib2xkID0gYWRkQ2hlY2soXCJcdTY1ODdcdTVCNTdcdTUyQTBcdTdDOTdcIiwgdGhpcy5hcHBlYXJhbmNlLmJvbGQgPT09IHRydWUpO1xuICAgIGNvbnN0IGl0YWxpYyA9IGFkZENoZWNrKFwiXHU2NTg3XHU1QjU3XHU2NTlDXHU0RjUzXCIsIHRoaXMuYXBwZWFyYW5jZS5pdGFsaWMgPT09IHRydWUpO1xuICAgIGNvbnN0IHVuZGVybGluZSA9IGFkZENoZWNrKFwiXHU2NTg3XHU1QjU3XHU0RTBCXHU1MjEyXHU3RUJGXCIsIHRoaXMuYXBwZWFyYW5jZS51bmRlcmxpbmUgPT09IHRydWUpO1xuXG4gICAgY29uc3QgY2xhbXAgPSAodmFsdWU6IHN0cmluZywgbWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBmYWxsYmFjazogbnVtYmVyKTogbnVtYmVyID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcih2YWx1ZSk7XG4gICAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgPyBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgcGFyc2VkKSkgOiBmYWxsYmFjaztcbiAgICB9O1xuICAgIGNvbnN0IGFjdGlvbnMgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbW9kYWwtYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IHJlc2V0ID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU2MDYyXHU1OTBEXHU1MTY4XHU1QzQwXHU5RUQ4XHU4QkE0XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1M0Q2XHU2RDg4XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3Qgc2F2ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUU5NFx1NzUyOFwiLCB0eXBlOiBcInN1Ym1pdFwiLCBjbHM6IFwibW9kLWN0YVwiIH0pO1xuICAgIHJlc2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMucmVzZXQoKTsgdGhpcy5jbG9zZSgpOyB9KTtcbiAgICBjYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuc3VibWl0KHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBiYWNrZ3JvdW5kLnRvZ2dsZS5jaGVja2VkID8gYmFja2dyb3VuZC5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgYmFja2dyb3VuZFBhdHRlcm46IHBhdHRlcm5TZWxlY3QudmFsdWUgYXMgQmFja2dyb3VuZFBhdHRlcm4sXG4gICAgICAgIHBhdHRlcm5Db2xvcjogcGF0dGVybkNvbG9yLnRvZ2dsZS5jaGVja2VkID8gcGF0dGVybkNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBmb250RmFtaWx5OiBmb250U2VsZWN0LnZhbHVlIGFzIEZvbnRGYW1pbHlNb2RlLFxuICAgICAgICBjdXN0b21Gb250OiBmb250U2VsZWN0LnZhbHVlID09PSBcImN1c3RvbVwiID8gY3VzdG9tRm9udElucHV0LnZhbHVlLnRyaW0oKS5zbGljZSgwLCAxMjApIHx8IHVuZGVmaW5lZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgZm9udFNpemU6IGNsYW1wKGZvbnRTaXplSW5wdXQudmFsdWUsIDEwLCAzMCwgMTQpLFxuICAgICAgICBlZGdlQ29sb3I6IGVkZ2VDb2xvci50b2dnbGUuY2hlY2tlZCA/IGVkZ2VDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZWRnZVdpZHRoOiBjbGFtcChlZGdlV2lkdGhJbnB1dC52YWx1ZSwgMC41LCA4LCAyLjIpLFxuICAgICAgICBlZGdlU3R5bGU6IGVkZ2VTdHlsZVNlbGVjdC52YWx1ZSBhcyBFZGdlU3R5bGUsXG4gICAgICAgIG5vZGVDb2xvcjogbm9kZUNvbG9yLnRvZ2dsZS5jaGVja2VkID8gbm9kZUNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICB0ZXh0Q29sb3I6IHRleHRDb2xvci50b2dnbGUuY2hlY2tlZCA/IHRleHRDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZUJvcmRlckNvbG9yOiBib3JkZXJDb2xvci50b2dnbGUuY2hlY2tlZCA/IGJvcmRlckNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBub2RlQm9yZGVyV2lkdGg6IGNsYW1wKGJvcmRlcldpZHRoSW5wdXQudmFsdWUsIDAsIDYsIDEpLFxuICAgICAgICBib2xkOiBib2xkLmNoZWNrZWQsXG4gICAgICAgIGl0YWxpYzogaXRhbGljLmNoZWNrZWQsXG4gICAgICAgIHVuZGVybGluZTogdW5kZXJsaW5lLmNoZWNrZWRcbiAgICAgIH0pO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHNhdmUuZm9jdXMoKSwgMjApO1xuICB9XG59XG5cbmNsYXNzIE91dGxpbmVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBtYXJrZG93bjogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IG9uRXhwb3J0OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBtYXJrZG93bjogc3RyaW5nLCBvbkV4cG9ydDogKCkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5tYXJrZG93biA9IG1hcmtkb3duO1xuICAgIHRoaXMub25FeHBvcnQgPSBvbkV4cG9ydDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIk1hcmtkb3duIFx1NTkyN1x1N0VCMlwiKTtcbiAgICBjb25zdCB0ZXh0YXJlYSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBjbHM6IFwibW1jLW91dGxpbmUtdGV4dGFyZWFcIiB9KTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IHRoaXMubWFya2Rvd247XG4gICAgdGV4dGFyZWEucmVhZE9ubHkgPSB0cnVlO1xuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjb3B5ID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1OTBEXHU1MjM2XCIgfSk7XG4gICAgY29uc3QgZXhwb3J0QnV0dG9uID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1QkZDXHU1MUZBXHU0RTNBIC5tZFwiLCBjbHM6IFwibW9kLWN0YVwiIH0pO1xuICAgIGNvcHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGhpcy5tYXJrZG93bik7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1REYyXHU1OTBEXHU1MjM2IE1hcmtkb3duIFx1NTkyN1x1N0VCMlwiKTtcbiAgICB9KTtcbiAgICBleHBvcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMub25FeHBvcnQoKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuXG5jbGFzcyBTZWFyY2hOb2Rlc01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IG5vZGVzOiBNaW5kTWFwTm9kZVtdO1xuICBwcml2YXRlIHJlYWRvbmx5IG9uUXVlcnk6IChxdWVyeTogc3RyaW5nKSA9PiB2b2lkO1xuICBwcml2YXRlIHJlYWRvbmx5IG9uU2VsZWN0OiAobm9kZTogTWluZE1hcE5vZGUpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG5vZGVzOiBNaW5kTWFwTm9kZVtdLCBvblF1ZXJ5OiAocXVlcnk6IHN0cmluZykgPT4gdm9pZCwgb25TZWxlY3Q6IChub2RlOiBNaW5kTWFwTm9kZSkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xuICAgIHRoaXMub25RdWVyeSA9IG9uUXVlcnk7XG4gICAgdGhpcy5vblNlbGVjdCA9IG9uU2VsZWN0O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiXHU2NDFDXHU3RDIyXHU4MjgyXHU3MEI5XCIpO1xuICAgIHRoaXMubW9kYWxFbC5hZGRDbGFzcyhcIm1tYy1zZWFyY2gtbW9kYWxcIik7XG4gICAgY29uc3QgaW5wdXQgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJzZWFyY2hcIiwgY2xzOiBcIm1tYy1zZWFyY2gtaW5wdXRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJcdTY0MUNcdTdEMjJcdTY1ODdcdTVCNTdcdTMwMDFcdTU5MDdcdTZDRThcdTMwMDFcdTY4MDdcdTdCN0VcdTYyMTZcdTk0RkVcdTYzQTVcdTIwMjZcIiB9IH0pO1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zZWFyY2gtY291bnRcIiB9KTtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zZWFyY2gtcmVzdWx0c1wiIH0pO1xuXG4gICAgY29uc3QgcmVuZGVyUmVzdWx0cyA9ICgpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gaW5wdXQudmFsdWUudHJpbSgpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICB0aGlzLm9uUXVlcnkocXVlcnkpO1xuICAgICAgcmVzdWx0cy5lbXB0eSgpO1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHF1ZXJ5XG4gICAgICAgID8gdGhpcy5ub2Rlcy5maWx0ZXIoKG5vZGUpID0+IG5vZGVTZWFyY2hUZXh0KG5vZGUpLmluY2x1ZGVzKHF1ZXJ5KSkuc2xpY2UoMCwgODApXG4gICAgICAgIDogdGhpcy5ub2Rlcy5zbGljZSgwLCA0MCk7XG4gICAgICBjb3VudC5zZXRUZXh0KHF1ZXJ5ID8gYFx1NjI3RVx1NTIzMCAke21hdGNoZXMubGVuZ3RofSBcdTRFMkFcdTgyODJcdTcwQjlgIDogYFx1NTE3MSAke3RoaXMubm9kZXMubGVuZ3RofSBcdTRFMkFcdTgyODJcdTcwQjlgKTtcbiAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBtYXRjaGVzKSB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHJlc3VsdHMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLXNlYXJjaC1yZXN1bHRcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICAgICAgY29uc3QgdGl0bGUgPSBidXR0b24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zZWFyY2gtcmVzdWx0LXRpdGxlXCIgfSk7XG4gICAgICAgIGlmIChub2RlLmljb24pIHRpdGxlLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgJHtub2RlLmljb259IGAgfSk7XG4gICAgICAgIHRpdGxlLmNyZWF0ZVNwYW4oeyB0ZXh0OiBub2RlUGxhaW5UZXh0KG5vZGUpIHx8IFwiXHU1NkZFXHU3MjQ3XHU4MjgyXHU3MEI5XCIgfSk7XG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSBbbm9kZS50YXNrID8gKHsgdG9kbzogXCJcdTVGODVcdTUyOUVcIiwgZG9pbmc6IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIsIGRvbmU6IFwiXHU1REYyXHU1QjhDXHU2MjEwXCIgfSBhcyBjb25zdClbbm9kZS50YXNrXSA6IFwiXCIsIC4uLihub2RlLnRhZ3MgPz8gW10pLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIiBcdTAwQjcgXCIpO1xuICAgICAgICBpZiAoZGV0YWlscykgYnV0dG9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtc2VhcmNoLXJlc3VsdC1tZXRhXCIsIHRleHQ6IGRldGFpbHMgfSk7XG4gICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMub25TZWxlY3Qobm9kZSk7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghbWF0Y2hlcy5sZW5ndGgpIHJlc3VsdHMuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1lbXB0eS1zdGF0ZVwiLCB0ZXh0OiBcIlx1NkNBMVx1NjcwOVx1NTMzOVx1OTE0RFx1NzY4NFx1ODI4Mlx1NzBCOVwiIH0pO1xuICAgIH07XG5cbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgcmVuZGVyUmVzdWx0cyk7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSByZXN1bHRzLnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFwiLm1tYy1zZWFyY2gtcmVzdWx0XCIpO1xuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGZpcnN0LmNsaWNrKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZW5kZXJSZXN1bHRzKCk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gaW5wdXQuZm9jdXMoKSwgMjApO1xuICB9XG59XG5cbmNsYXNzIEpzb25UcmFuc2Zlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgb25JbXBvcnQ6IChkb2N1bWVudDogTWluZE1hcERvY3VtZW50KSA9PiB2b2lkO1xuICBwcml2YXRlIHJlYWRvbmx5IG9uRXhwb3J0OiAoanNvbjogc3RyaW5nKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBkb2N1bWVudDogTWluZE1hcERvY3VtZW50LCBvbkltcG9ydDogKGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQpID0+IHZvaWQsIG9uRXhwb3J0OiAoanNvbjogc3RyaW5nKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgdGhpcy5vbkltcG9ydCA9IG9uSW1wb3J0O1xuICAgIHRoaXMub25FeHBvcnQgPSBvbkV4cG9ydDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIkpTT04gXHU1QkZDXHU1MTY1IC8gXHU1QkZDXHU1MUZBXCIpO1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJcdTUzRUZcdTRFRTVcdTU5MERcdTUyMzZcdTVGNTNcdTUyNEQgSlNPTlx1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1N0M5OFx1OEQzNFx1NTE3Nlx1NEVENiBNaW5kTWFwIFN0dWRpbyBcdTY1ODdcdTY4NjMgSlNPTiBcdTU0MEVcdTVCRkNcdTUxNjVcdTMwMDJcIiB9KTtcbiAgICBkZXNjcmlwdGlvbi5hZGRDbGFzcyhcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiKTtcbiAgICBjb25zdCB0ZXh0YXJlYSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBjbHM6IFwibW1jLWpzb24tdGV4dGFyZWFcIiB9KTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnQsIG51bGwsIDIpO1xuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnMgbW1jLWpzb24tYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGNvcHkgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTU5MERcdTUyMzYgSlNPTlwiIH0pO1xuICAgIGNvbnN0IGV4cG9ydEJ1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUJGQ1x1NTFGQSAuanNvblwiIH0pO1xuICAgIGNvbnN0IGltcG9ydEJ1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUJGQ1x1NTE2NVx1NUU3Nlx1NjZGRlx1NjM2MlwiLCBjbHM6IFwibW9kLXdhcm5pbmdcIiB9KTtcbiAgICBjb3B5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRleHRhcmVhLnZhbHVlKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVERjJcdTU5MERcdTUyMzYgSlNPTlwiKTtcbiAgICB9KTtcbiAgICBleHBvcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMub25FeHBvcnQodGV4dGFyZWEudmFsdWUpKTtcbiAgICBpbXBvcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UodGV4dGFyZWEudmFsdWUpIGFzIFBhcnRpYWw8TWluZE1hcERvY3VtZW50PjtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZURvY3VtZW50KHBhcnNlZCwgdGhpcy5kb2N1bWVudC50aXRsZSk7XG4gICAgICAgIHRoaXMub25JbXBvcnQobm9ybWFsaXplZCk7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJKU09OIFx1NURGMlx1NUJGQ1x1NTE2NVwiKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIEpTT04gaW1wb3J0IGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJKU09OIFx1NjgzQ1x1NUYwRlx1NjVFMFx1NjU0OFx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1NTQwRVx1OTFDRFx1OEJENVwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWluZE1hcEVkaXRvciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHA7XG4gIHByaXZhdGUgcmVhZG9ubHkgaG9zdDogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2FsbGJhY2tzOiBNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzO1xuICBwcml2YXRlIG9wdGlvbnM6IE1pbmRNYXBFZGl0b3JPcHRpb25zO1xuICBwcml2YXRlIHJvb3RFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHRvb2xiYXJFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG5hdmlnYXRpb25CYXJFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHZpZXdwb3J0RWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBzY2VuZUVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgbm9kZXNMYXllckVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgZWRnZXNTdmchOiBTVkdTVkdFbGVtZW50O1xuICBwcml2YXRlIHN0YXR1c0VsITogSFRNTFNwYW5FbGVtZW50O1xuICBwcml2YXRlIHpvb21TdGF0dXNFbCE6IEhUTUxTcGFuRWxlbWVudDtcbiAgcHJpdmF0ZSBkb2N1bWVudDogTWluZE1hcERvY3VtZW50O1xuICBwcml2YXRlIGxheW91dDogTGF5b3V0UmVzdWx0O1xuICBwcml2YXRlIHNlbGVjdGVkSWQ6IHN0cmluZztcbiAgcHJpdmF0ZSB6b29tID0gMTtcbiAgcHJpdmF0ZSBwYW5YID0gMDtcbiAgcHJpdmF0ZSBwYW5ZID0gMDtcbiAgcHJpdmF0ZSBoaXN0b3J5OiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGZ1dHVyZTogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBkcmFnZ2luZ0lkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBwYW5uaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgcGFuU3RhcnQgPSB7IHg6IDAsIHk6IDAsIHBhblg6IDAsIHBhblk6IDAgfTtcbiAgcHJpdmF0ZSBjbGVhbnVwQ2FsbGJhY2tzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuICBwcml2YXRlIHJlc2l6ZU9ic2VydmVyOiBSZXNpemVPYnNlcnZlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGJyYW5jaENsaXBib2FyZDogTWluZE1hcE5vZGUgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzZWFyY2hRdWVyeSA9IFwiXCI7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGhvc3Q6IEhUTUxFbGVtZW50LCBkb2N1bWVudDogTWluZE1hcERvY3VtZW50LCBjYWxsYmFja3M6IE1pbmRNYXBFZGl0b3JDYWxsYmFja3MsIG9wdGlvbnM6IE1pbmRNYXBFZGl0b3JPcHRpb25zKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5ob3N0ID0gaG9zdDtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBjbG9uZURvY3VtZW50KGRvY3VtZW50KTtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5sYXlvdXQgPSBjb21wdXRlTGF5b3V0KHRoaXMuZG9jdW1lbnQucm9vdCwgdGhpcy5kb2N1bWVudC5sYXlvdXQsIHRoaXMuZ2V0QXBwZWFyYW5jZSgpLmZvbnRTaXplID8/IDE0KTtcbiAgICB0aGlzLmJ1aWxkVWkoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b0ZpdE9uT3Blbikgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5maXRUb1ZpZXcoKSwgNTApO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2spID0+IGNhbGxiYWNrKCkpO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcyA9IFtdO1xuICAgIHRoaXMucmVzaXplT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICB0aGlzLnJlc2l6ZU9ic2VydmVyID0gbnVsbDtcbiAgICB0aGlzLmhvc3QuZW1wdHkoKTtcbiAgfVxuXG4gIHNldERvY3VtZW50KGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQsIHJlc2V0SGlzdG9yeSA9IHRydWUpOiB2b2lkIHtcbiAgICB0aGlzLmRvY3VtZW50ID0gY2xvbmVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIGlmIChyZXNldEhpc3RvcnkpIHtcbiAgICAgIHRoaXMuaGlzdG9yeSA9IFtdO1xuICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9GaXRPbk9wZW4pIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDIwKTtcbiAgfVxuXG4gIHNldE9wdGlvbnMob3B0aW9uczogTWluZE1hcEVkaXRvck9wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBnZXREb2N1bWVudCgpOiBNaW5kTWFwRG9jdW1lbnQge1xuICAgIHJldHVybiBjbG9uZURvY3VtZW50KHRoaXMuZG9jdW1lbnQpO1xuICB9XG5cbiAgbWFya1NhdmVkKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdHVzRWwuc2V0VGV4dChcIlx1NURGMlx1NEZERFx1NUI1OFwiKTtcbiAgICB0aGlzLnJvb3RFbC5yZW1vdmVDbGFzcyhcImlzLWRpcnR5XCIpO1xuICB9XG5cbiAgbWFya1NhdmluZygpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoXCJcdTRGRERcdTVCNThcdTRFMkRcdTIwMjZcIik7XG4gICAgdGhpcy5yb290RWwuYWRkQ2xhc3MoXCJpcy1kaXJ0eVwiKTtcbiAgfVxuXG4gIGZvY3VzKCk6IHZvaWQge1xuICAgIHRoaXMucm9vdEVsLmZvY3VzKCk7XG4gIH1cblxuICBmb2N1c05vZGVCeUlkKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCBpZCkpIHRoaXMuZm9jdXNOb2RlKGlkKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRVaSgpOiB2b2lkIHtcbiAgICB0aGlzLmhvc3QuZW1wdHkoKTtcbiAgICB0aGlzLnJvb3RFbCA9IHRoaXMuaG9zdC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWVkaXRvclwiIH0pO1xuICAgIHRoaXMucm9vdEVsLnRhYkluZGV4ID0gMDtcbiAgICB0aGlzLnRvb2xiYXJFbCA9IHRoaXMucm9vdEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdG9vbGJhclwiIH0pO1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsID0gdGhpcy5yb290RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvblwiIH0pO1xuICAgIHRoaXMudmlld3BvcnRFbCA9IHRoaXMucm9vdEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdmlld3BvcnRcIiB9KTtcbiAgICB0aGlzLnNjZW5lRWwgPSB0aGlzLnZpZXdwb3J0RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zY2VuZVwiIH0pO1xuICAgIHRoaXMuZWRnZXNTdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgICB0aGlzLmVkZ2VzU3ZnLmNsYXNzTGlzdC5hZGQoXCJtbWMtZWRnZXNcIik7XG4gICAgdGhpcy5zY2VuZUVsLmFwcGVuZENoaWxkKHRoaXMuZWRnZXNTdmcpO1xuICAgIHRoaXMubm9kZXNMYXllckVsID0gdGhpcy5zY2VuZUVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZXMtbGF5ZXJcIiB9KTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJwbHVzLWNpcmNsZVwiLCBcIlx1NkRGQlx1NTJBMFx1NUI1MFx1ODI4Mlx1NzBCOVx1RkYwOFRhYlx1RkYwOVwiLCAoKSA9PiB0aGlzLmFkZENoaWxkKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImxpc3QtcGx1c1wiLCBcIlx1NkRGQlx1NTJBMFx1NTQwQ1x1N0VBN1x1ODI4Mlx1NzBCOVx1RkYwOEVudGVyXHVGRjA5XCIsICgpID0+IHRoaXMuYWRkU2libGluZygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJwZW5jaWxcIiwgXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcdUZGMDhGMlx1RkYwOVwiLCAoKSA9PiB0aGlzLmVkaXRTZWxlY3RlZCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJjb3B5LXBsdXNcIiwgXCJcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcdUZGMDhDdHJsL0NtZCtEXHVGRjA5XCIsICgpID0+IHRoaXMuZHVwbGljYXRlU2VsZWN0ZWQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwidHJhc2gtMlwiLCBcIlx1NTIyMFx1OTY2NFx1ODI4Mlx1NzBCOVx1RkYwOERlbGV0ZVx1RkYwOVwiLCAoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImNpcmNsZS1jaGVjay1iaWdcIiwgXCJcdTUyMDdcdTYzNjJcdTRFRkJcdTUyQTFcdTcyQjZcdTYwMDFcdUZGMDhDdHJsL0NtZCtFbnRlclx1RkYwOVwiLCAoKSA9PiB0aGlzLmN5Y2xlVGFzaygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJmb2xkLXZlcnRpY2FsXCIsIFwiXHU1QzU1XHU1RjAwL1x1NjUzNlx1OEQ3N1x1ODI4Mlx1NzBCOVx1RkYwOFNwYWNlXHVGRjA5XCIsICgpID0+IHRoaXMudG9nZ2xlQ29sbGFwc2UoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwibGlua1wiLCBcIlx1NjI1M1x1NUYwMFx1ODI4Mlx1NzBCOVx1OTRGRVx1NjNBNVwiLCAoKSA9PiB0aGlzLm9wZW5TZWxlY3RlZExpbmsoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwic2VhcmNoXCIsIFwiXHU2NDFDXHU3RDIyXHU4MjgyXHU3MEI5XHVGRjA4Q3RybC9DbWQrRlx1RkYwOVwiLCAoKSA9PiB0aGlzLm9wZW5TZWFyY2goKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyU2VwYXJhdG9yKCk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwidGFibGUtMlwiLCBcIlx1NjNEMlx1NTE2NVx1NjIxNlx1N0YxNlx1OEY5MVx1ODg2OFx1NjgzQ1wiLCAoKSA9PiB0aGlzLmVkaXRUYWJsZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJjb2RlLTJcIiwgXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTRFRTNcdTc4MDFcIiwgKCkgPT4gdGhpcy5lZGl0Q29kZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJpbWFnZS1wbHVzXCIsIFwiXHU3Qzk4XHU4RDM0XHU1NkZFXHU3MjQ3XHU1MjMwXHU1RjUzXHU1MjREXHU4MjgyXHU3MEI5XHVGRjA4Q3RybC9DbWQrVlx1RkYwOVwiLCAoKSA9PiBuZXcgTm90aWNlKFwiXHU1MTQ4XHU1OTBEXHU1MjM2XHU1NkZFXHU3MjQ3XHVGRjBDXHU1MThEXHU5MDA5XHU0RTJEXHU4MjgyXHU3MEI5XHU1RTc2XHU2MzA5IEN0cmwvQ21kK1ZcIikpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcIm5ldHdvcmtcIiwgXCJcdTUyMUJcdTVFRkFcdTYyMTZcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkVcIiwgKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU9yT3BlblN1Ym1hcCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ1bmRvLTJcIiwgXCJcdTY0QTRcdTk1MDBcdUZGMDhDdHJsL0NtZCtaXHVGRjA5XCIsICgpID0+IHRoaXMudW5kbygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJyZWRvLTJcIiwgXCJcdTkxQ0RcdTUwNUFcdUZGMDhDdHJsL0NtZCtZXHVGRjA5XCIsICgpID0+IHRoaXMucmVkbygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ6b29tLWluXCIsIFwiXHU2NTNFXHU1OTI3XCIsICgpID0+IHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gKiAxLjE1KSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiem9vbS1vdXRcIiwgXCJcdTdGMjlcdTVDMEZcIiwgKCkgPT4gdGhpcy5zZXRab29tKHRoaXMuem9vbSAvIDEuMTUpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJtYXhpbWl6ZVwiLCBcIlx1OTAwMlx1NUU5NFx1NzUzQlx1NUUwM1wiLCAoKSA9PiB0aGlzLmZpdFRvVmlldygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJnaXQtZm9ya1wiLCBcIlx1NTIwN1x1NjM2Mlx1NTM1NVx1NEZBNy9cdTUzQ0NcdTRGQTdcdTVFMDNcdTVDNDBcIiwgKCkgPT4gdGhpcy50b2dnbGVMYXlvdXQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwicGFsZXR0ZVwiLCBcIlx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTkxNlx1ODlDMlwiLCAoKSA9PiB0aGlzLmVkaXRBcHBlYXJhbmNlKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImZpbGUtdGV4dFwiLCBcIlx1NjdFNVx1NzcwQiBNYXJrZG93biBcdTU5MjdcdTdFQjJcIiwgKCkgPT4gdGhpcy5zaG93T3V0bGluZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJicmFjZXNcIiwgXCJKU09OIFx1NUJGQ1x1NTE2NSAvIFx1NUJGQ1x1NTFGQVwiLCAoKSA9PiB0aGlzLnNob3dKc29uVHJhbnNmZXIoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiaW1hZ2VcIiwgXCJcdTVCRkNcdTUxRkEgU1ZHXCIsICgpID0+IHZvaWQgdGhpcy5jYWxsYmFja3Mub25FeHBvcnRTdmcoZG9jdW1lbnRUb1N2Zyh0aGlzLmRvY3VtZW50LnJvb3QsIHRoaXMuZG9jdW1lbnQubGF5b3V0LCB0aGlzLmRvY3VtZW50LnRpdGxlLCB0aGlzLmdldEFwcGVhcmFuY2UoKSkpKTtcblxuICAgIGNvbnN0IHNwYWNlciA9IHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRvb2xiYXItc3BhY2VyXCIgfSk7XG4gICAgc3BhY2VyLnNldEF0dHIoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gICAgdGhpcy56b29tU3RhdHVzRWwgPSB0aGlzLnRvb2xiYXJFbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy16b29tLXN0YXR1c1wiLCB0ZXh0OiBcIjEwMCVcIiB9KTtcbiAgICB0aGlzLnN0YXR1c0VsID0gdGhpcy50b29sYmFyRWwuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtc2F2ZS1zdGF0dXNcIiwgdGV4dDogXCJcdTVERjJcdTRGRERcdTVCNThcIiB9KTtcblxuICAgIGNvbnN0IGtleWRvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHRoaXMuaGFuZGxlS2V5ZG93bihldmVudCk7XG4gICAgdGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5ZG93bik7XG4gICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzLnB1c2goKCkgPT4gdGhpcy5yb290RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5ZG93bikpO1xuXG4gICAgY29uc3QgcGFzdGUgPSAoZXZlbnQ6IENsaXBib2FyZEV2ZW50KTogdm9pZCA9PiB7IHZvaWQgdGhpcy5oYW5kbGVQYXN0ZShldmVudCk7IH07XG4gICAgdGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIHBhc3RlKTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnJvb3RFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgcGFzdGUpKTtcblxuICAgIGNvbnN0IHdoZWVsID0gKGV2ZW50OiBXaGVlbEV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB3aGVlbFRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmICh3aGVlbFRhcmdldC5jbG9zZXN0KFwiLm1tYy1ub2RlLXRhYmxlLXdyYXAsIC5tbWMtY29kZS1ibG9ja1wiKSkgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnZpZXdwb3J0RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBwb2ludGVyWCA9IGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQgLSByZWN0LndpZHRoIC8gMjtcbiAgICAgIGNvbnN0IHBvaW50ZXJZID0gZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wIC0gcmVjdC5oZWlnaHQgLyAyO1xuICAgICAgY29uc3Qgb2xkWm9vbSA9IHRoaXMuem9vbTtcbiAgICAgIGNvbnN0IG5leHRab29tID0gdGhpcy5jbGFtcFpvb20odGhpcy56b29tICogKGV2ZW50LmRlbHRhWSA8IDAgPyAxLjEgOiAwLjkpKTtcbiAgICAgIGNvbnN0IHdvcmxkWCA9IChwb2ludGVyWCAtIHRoaXMucGFuWCkgLyBvbGRab29tO1xuICAgICAgY29uc3Qgd29ybGRZID0gKHBvaW50ZXJZIC0gdGhpcy5wYW5ZKSAvIG9sZFpvb207XG4gICAgICB0aGlzLnpvb20gPSBuZXh0Wm9vbTtcbiAgICAgIHRoaXMucGFuWCA9IHBvaW50ZXJYIC0gd29ybGRYICogbmV4dFpvb207XG4gICAgICB0aGlzLnBhblkgPSBwb2ludGVyWSAtIHdvcmxkWSAqIG5leHRab29tO1xuICAgICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICAgIH07XG4gICAgdGhpcy52aWV3cG9ydEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCB3aGVlbCwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHdoZWVsKSk7XG5cbiAgICBjb25zdCBwb2ludGVyRG93biA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBpZiAodGFyZ2V0LmNsb3Nlc3QoXCIubW1jLW5vZGVcIikpIHJldHVybjtcbiAgICAgIGlmIChldmVudC5idXR0b24gIT09IDAgJiYgZXZlbnQuYnV0dG9uICE9PSAxKSByZXR1cm47XG4gICAgICB0aGlzLnBhbm5pbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wYW5TdGFydCA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSwgcGFuWDogdGhpcy5wYW5YLCBwYW5ZOiB0aGlzLnBhblkgfTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5zZXRQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLmFkZENsYXNzKFwiaXMtcGFubmluZ1wiKTtcbiAgICAgIHRoaXMuc2VsZWN0Tm9kZShudWxsKTtcbiAgICB9O1xuICAgIGNvbnN0IHBvaW50ZXJNb3ZlID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGlmICghdGhpcy5wYW5uaW5nKSByZXR1cm47XG4gICAgICB0aGlzLnBhblggPSB0aGlzLnBhblN0YXJ0LnBhblggKyBldmVudC5jbGllbnRYIC0gdGhpcy5wYW5TdGFydC54O1xuICAgICAgdGhpcy5wYW5ZID0gdGhpcy5wYW5TdGFydC5wYW5ZICsgZXZlbnQuY2xpZW50WSAtIHRoaXMucGFuU3RhcnQueTtcbiAgICAgIHRoaXMuYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICB9O1xuICAgIGNvbnN0IHBvaW50ZXJVcCA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBpZiAoIXRoaXMucGFubmluZykgcmV0dXJuO1xuICAgICAgdGhpcy5wYW5uaW5nID0gZmFsc2U7XG4gICAgICBpZiAodGhpcy52aWV3cG9ydEVsLmhhc1BvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCkpIHRoaXMudmlld3BvcnRFbC5yZWxlYXNlUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVDbGFzcyhcImlzLXBhbm5pbmdcIik7XG4gICAgfTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHBvaW50ZXJEb3duKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHBvaW50ZXJNb3ZlKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCBwb2ludGVyVXApO1xuICAgIHRoaXMudmlld3BvcnRFbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmNhbmNlbFwiLCBwb2ludGVyVXApO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcy5wdXNoKCgpID0+IHtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgcG9pbnRlckRvd24pO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCBwb2ludGVyTW92ZSk7XG4gICAgICB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCBwb2ludGVyVXApO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVyY2FuY2VsXCIsIHBvaW50ZXJVcCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHRoaXMuYXBwbHlUcmFuc2Zvcm0oKSk7XG4gICAgdGhpcy5yZXNpemVPYnNlcnZlci5vYnNlcnZlKHRoaXMudmlld3BvcnRFbCk7XG4gIH1cblxuICBwcml2YXRlIGFkZFRvb2xiYXJCdXR0b24oaWNvbjogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCBhY3Rpb246ICgpID0+IHZvaWQpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy50b29sYmFyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb24gbW1jLXRvb2xiYXItYnV0dG9uXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGxhYmVsLCB0aXRsZTogbGFiZWwgfSB9KTtcbiAgICBzZXRJY29uKGJ1dHRvbiwgaWNvbik7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBhY3Rpb24oKTtcbiAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRUb29sYmFyU2VwYXJhdG9yKCk6IHZvaWQge1xuICAgIHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRvb2xiYXItc2VwYXJhdG9yXCIgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldEFwcGVhcmFuY2UoKTogTWluZE1hcEFwcGVhcmFuY2Uge1xuICAgIHJldHVybiBtZXJnZUFwcGVhcmFuY2UodGhpcy5vcHRpb25zLmRlZmF1bHRBcHBlYXJhbmNlLCB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb250RmFtaWx5Q3NzKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKTogc3RyaW5nIHtcbiAgICBpZiAoYXBwZWFyYW5jZS5mb250RmFtaWx5ID09PSBcInNlcmlmXCIpIHJldHVybiAnR2VvcmdpYSwgXCJUaW1lcyBOZXcgUm9tYW5cIiwgc2VyaWYnO1xuICAgIGlmIChhcHBlYXJhbmNlLmZvbnRGYW1pbHkgPT09IFwibW9ub1wiKSByZXR1cm4gJ1wiU0ZNb25vLVJlZ3VsYXJcIiwgQ29uc29sYXMsIFwiTGliZXJhdGlvbiBNb25vXCIsIG1vbm9zcGFjZSc7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJjdXN0b21cIiAmJiBhcHBlYXJhbmNlLmN1c3RvbUZvbnQ/LnRyaW0oKSkgcmV0dXJuIGBcIiR7YXBwZWFyYW5jZS5jdXN0b21Gb250LnRyaW0oKS5yZXBsYWNlQWxsKCdcIicsICcnKX1cIiwgc2Fucy1zZXJpZmA7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJzYW5zXCIpIHJldHVybiAnSW50ZXIsIC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgXCJTZWdvZSBVSVwiLCBzYW5zLXNlcmlmJztcbiAgICByZXR1cm4gXCJ2YXIoLS1mb250LWludGVyZmFjZSlcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlBcHBlYXJhbmNlKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKTogdm9pZCB7XG4gICAgY29uc3Qgc2V0T3JSZW1vdmUgPSAobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgICBpZiAodmFsdWUpIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgIGVsc2UgdGhpcy5yb290RWwuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgfTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLWNhbnZhc1wiLCBhcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1wYXR0ZXJuLWNvbG9yXCIsIGFwcGVhcmFuY2UucGF0dGVybkNvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLWVkZ2VcIiwgYXBwZWFyYW5jZS5lZGdlQ29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtbm9kZS1iZ1wiLCBhcHBlYXJhbmNlLm5vZGVDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1ub2RlLXRleHRcIiwgYXBwZWFyYW5jZS50ZXh0Q29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtbm9kZS1ib3JkZXJcIiwgYXBwZWFyYW5jZS5ub2RlQm9yZGVyQ29sb3IpO1xuICAgIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KFwiLS1tbWMtZm9udC1mYW1pbHlcIiwgdGhpcy5mb250RmFtaWx5Q3NzKGFwcGVhcmFuY2UpKTtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLWVkZ2Utd2lkdGhcIiwgYCR7YXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gMi4yfXB4YCk7XG4gICAgdGhpcy5yb290RWwuc3R5bGUuc2V0UHJvcGVydHkoXCItLW1tYy1ub2RlLWJvcmRlci13aWR0aFwiLCBgJHthcHBlYXJhbmNlLm5vZGVCb3JkZXJXaWR0aCA/PyAxfXB4YCk7XG4gICAgdGhpcy52aWV3cG9ydEVsLnRvZ2dsZUNsYXNzKFwicGF0dGVybi1ncmlkXCIsIGFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwiZ3JpZFwiKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwudG9nZ2xlQ2xhc3MoXCJwYXR0ZXJuLWRvdHNcIiwgYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJkb3RzXCIpO1xuICAgIHRoaXMudmlld3BvcnRFbC50b2dnbGVDbGFzcyhcInBhdHRlcm4tbm9uZVwiLCAhYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiB8fCBhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID09PSBcIm5vbmVcIik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck5hdmlnYXRpb24oKTogdm9pZCB7XG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFyRWwuZW1wdHkoKTtcbiAgICBjb25zdCBuYXZpZ2F0aW9uID0gdGhpcy5kb2N1bWVudC5uYXZpZ2F0aW9uO1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsLnRvZ2dsZUNsYXNzKFwiaXMtaGlkZGVuXCIsICFuYXZpZ2F0aW9uPy5wYXJlbnRQYXRoKTtcbiAgICBpZiAoIW5hdmlnYXRpb24/LnBhcmVudFBhdGgpIHJldHVybjtcblxuICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMubmF2aWdhdGlvbkJhckVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tYnV0dG9uXCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXG4gICAgICAgIHRpdGxlOiBgXHU4RkQ0XHU1NkRFXHU3MjM2XHU1QkZDXHU1NkZFXHVGRjFBJHtuYXZpZ2F0aW9uLnBhcmVudFBhdGh9YFxuICAgICAgfVxuICAgIH0pO1xuICAgIHNldEljb24oYnV0dG9uLCBcImFycm93LWxlZnRcIik7XG4gICAgY29uc3QgbGFiZWxzID0gYnV0dG9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tbGFiZWxzXCIgfSk7XG4gICAgbGFiZWxzLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tdGl0bGVcIiwgdGV4dDogYFx1OEZENFx1NTZERVx1NzIzNlx1NUJGQ1x1NTZGRVx1RkYxQSR7bmF2aWdhdGlvbi5wYXJlbnRUaXRsZSA/PyBuYXZpZ2F0aW9uLnBhcmVudFBhdGguc3BsaXQoXCIvXCIpLmF0KC0xKT8ucmVwbGFjZSgvXFwubWluZG1hcCQvaSwgXCJcIikgPz8gXCJcdTcyMzZcdTVCRkNcdTU2RkVcIn1gIH0pO1xuICAgIGlmIChuYXZpZ2F0aW9uLnBhcmVudE5vZGVUZXh0KSBsYWJlbHMuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvbi1ub2RlXCIsIHRleHQ6IGBcdTY3NjVcdTZFOTBcdTgyODJcdTcwQjlcdUZGMUEke25hdmlnYXRpb24ucGFyZW50Tm9kZVRleHR9YCB9KTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTWluZE1hcChuYXZpZ2F0aW9uLnBhcmVudFBhdGgsIG5hdmlnYXRpb24ucGFyZW50Tm9kZUlkKSk7XG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFyRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvbi1wYXRoXCIsIHRleHQ6IG5hdmlnYXRpb24ucGFyZW50UGF0aCB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHRoaXMucmVuZGVyTmF2aWdhdGlvbigpO1xuICAgIGNvbnN0IGFwcGVhcmFuY2UgPSB0aGlzLmdldEFwcGVhcmFuY2UoKTtcbiAgICB0aGlzLmFwcGx5QXBwZWFyYW5jZShhcHBlYXJhbmNlKTtcbiAgICB0aGlzLmxheW91dCA9IGNvbXB1dGVMYXlvdXQodGhpcy5kb2N1bWVudC5yb290LCB0aGlzLmRvY3VtZW50LmxheW91dCwgYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNCk7XG4gICAgdGhpcy5ub2Rlc0xheWVyRWwuZW1wdHkoKTtcbiAgICB3aGlsZSAodGhpcy5lZGdlc1N2Zy5maXJzdENoaWxkKSB0aGlzLmVkZ2VzU3ZnLnJlbW92ZUNoaWxkKHRoaXMuZWRnZXNTdmcuZmlyc3RDaGlsZCk7XG5cbiAgICBmb3IgKGNvbnN0IHBvc2l0aW9uIG9mIHRoaXMubGF5b3V0Lm5vZGVzKSB7XG4gICAgICBpZiAoIXBvc2l0aW9uLnBhcmVudElkKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubGF5b3V0LmJ5SWQuZ2V0KHBvc2l0aW9uLnBhcmVudElkKTtcbiAgICAgIGlmICghcGFyZW50KSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInBhdGhcIik7XG4gICAgICBwYXRoLnNldEF0dHJpYnV0ZShcImRcIiwgZWRnZVBhdGgocGFyZW50LCBwb3NpdGlvbiwgYXBwZWFyYW5jZS5lZGdlU3R5bGUgPz8gXCJjdXJ2ZWRcIikpO1xuICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBgbW1jLWVkZ2UgZGVwdGgtJHtNYXRoLm1pbihwb3NpdGlvbi5kZXB0aCwgNil9YCk7XG4gICAgICBpZiAocG9zaXRpb24ubm9kZS5zdHlsZT8uY29sb3IpIHBhdGguc3R5bGUuc3Ryb2tlID0gcG9zaXRpb24ubm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIHRoaXMuZWRnZXNTdmcuYXBwZW5kQ2hpbGQocGF0aCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwb3NpdGlvbiBvZiB0aGlzLmxheW91dC5ub2Rlcykge1xuICAgICAgY29uc3Qgbm9kZSA9IHBvc2l0aW9uLm5vZGU7XG4gICAgICBjb25zdCBzaGFwZSA9IG5vZGUuc3R5bGU/LnNoYXBlID8/IHRoaXMub3B0aW9ucy5kZWZhdWx0Tm9kZVNoYXBlO1xuICAgICAgY29uc3QgY2xhc3NlcyA9IFtcIm1tYy1ub2RlXCIsIHBvc2l0aW9uLmRlcHRoID09PSAwID8gXCJpcy1yb290XCIgOiBcIlwiLCBgc2hhcGUtJHtzaGFwZX1gXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIiBcIik7XG4gICAgICBjb25zdCBub2RlRWwgPSB0aGlzLm5vZGVzTGF5ZXJFbC5jcmVhdGVEaXYoeyBjbHM6IGNsYXNzZXMgfSk7XG4gICAgICBub2RlRWwuZGF0YXNldC5ub2RlSWQgPSBub2RlLmlkO1xuICAgICAgbm9kZUVsLnN0eWxlLmxlZnQgPSBgJHtwb3NpdGlvbi54fXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS50b3AgPSBgJHtwb3NpdGlvbi55fXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS53aWR0aCA9IGAke3Bvc2l0aW9uLndpZHRofXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS5taW5IZWlnaHQgPSBgJHtwb3NpdGlvbi5oZWlnaHR9cHhgO1xuICAgICAgbm9kZUVsLmRyYWdnYWJsZSA9IHBvc2l0aW9uLmRlcHRoID4gMDtcbiAgICAgIGlmICh0aGlzLnNlbGVjdGVkSWQgPT09IG5vZGUuaWQpIG5vZGVFbC5hZGRDbGFzcyhcImlzLXNlbGVjdGVkXCIpO1xuICAgICAgaWYgKHRoaXMuc2VhcmNoUXVlcnkgJiYgbm9kZVNlYXJjaFRleHQobm9kZSkuaW5jbHVkZXModGhpcy5zZWFyY2hRdWVyeSkpIG5vZGVFbC5hZGRDbGFzcyhcImlzLXNlYXJjaC1tYXRjaFwiKTtcbiAgICAgIGlmIChub2RlLnRhc2spIG5vZGVFbC5hZGRDbGFzcyhgdGFzay0ke25vZGUudGFza31gKTtcbiAgICAgIGNvbnN0IGlzUm9vdCA9IHBvc2l0aW9uLmRlcHRoID09PSAwO1xuICAgICAgY29uc3QgYm9sZCA9IG5vZGUuc3R5bGU/LmJvbGQgPz8gYXBwZWFyYW5jZS5ib2xkID8/IGZhbHNlO1xuICAgICAgY29uc3QgaXRhbGljID0gbm9kZS5zdHlsZT8uaXRhbGljID8/IGFwcGVhcmFuY2UuaXRhbGljID8/IGZhbHNlO1xuICAgICAgY29uc3QgdW5kZXJsaW5lID0gbm9kZS5zdHlsZT8udW5kZXJsaW5lID8/IGFwcGVhcmFuY2UudW5kZXJsaW5lID8/IGZhbHNlO1xuICAgICAgaWYgKGJvbGQpIG5vZGVFbC5hZGRDbGFzcyhcImlzLWJvbGRcIik7XG4gICAgICBpZiAoaXRhbGljKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1pdGFsaWNcIik7XG4gICAgICBpZiAodW5kZXJsaW5lKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy11bmRlcmxpbmVkXCIpO1xuICAgICAgaWYgKG5vZGUubm90ZSkgbm9kZUVsLnNldEF0dHIoXCJ0aXRsZVwiLCBub2RlLm5vdGUpO1xuICAgICAgaWYgKG5vZGUuc3R5bGU/LmNvbG9yKSBub2RlRWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gbm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIGVsc2UgaWYgKCFpc1Jvb3QgJiYgYXBwZWFyYW5jZS5ub2RlQ29sb3IpIG5vZGVFbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBhcHBlYXJhbmNlLm5vZGVDb2xvcjtcbiAgICAgIGlmIChub2RlLnN0eWxlPy50ZXh0Q29sb3IpIG5vZGVFbC5zdHlsZS5jb2xvciA9IG5vZGUuc3R5bGUudGV4dENvbG9yO1xuICAgICAgZWxzZSBpZiAoIWlzUm9vdCAmJiBhcHBlYXJhbmNlLnRleHRDb2xvcikgbm9kZUVsLnN0eWxlLmNvbG9yID0gYXBwZWFyYW5jZS50ZXh0Q29sb3I7XG4gICAgICBpZiAobm9kZS5zdHlsZT8uYm9yZGVyQ29sb3IpIG5vZGVFbC5zdHlsZS5ib3JkZXJDb2xvciA9IG5vZGUuc3R5bGUuYm9yZGVyQ29sb3I7XG4gICAgICBlbHNlIGlmICghaXNSb290ICYmIGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yKSBub2RlRWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBhcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvcjtcbiAgICAgIG5vZGVFbC5zdHlsZS5ib3JkZXJXaWR0aCA9IGAke25vZGUuc3R5bGU/LmJvcmRlcldpZHRoID8/IGFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IChpc1Jvb3QgPyAyIDogMSl9cHhgO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gbm9kZUVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1jb250ZW50XCIgfSk7XG4gICAgICBjb25zdCBibG9ja3MgPSBub2RlQ29udGVudEJsb2Nrcyhub2RlKTtcbiAgICAgIGNvbnN0IGhhc1RleHRCbG9jayA9IGJsb2Nrcy5zb21lKChibG9jaykgPT4gYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIgJiYgYmxvY2sudGV4dC50cmltKCkpO1xuICAgICAgaWYgKChub2RlLnRhc2sgfHwgbm9kZS5pY29uKSAmJiAhaGFzVGV4dEJsb2NrKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1tYWluIG1tYy1ub2RlLW1ldGEtb25seVwiIH0pO1xuICAgICAgICBpZiAobm9kZS50YXNrKSB7XG4gICAgICAgICAgY29uc3QgdGFzayA9IG1ldGEuY3JlYXRlU3Bhbih7IGNsczogYG1tYy10YXNrLWljb24gdGFzay0ke25vZGUudGFza31gLCB0ZXh0OiBub2RlLnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTI3MTNcIiA6IG5vZGUudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdTI1RDBcIiA6IFwiXHUyNUNCXCIgfSk7XG4gICAgICAgICAgdGFzay5zZXRBdHRyKFwiYXJpYS1sYWJlbFwiLCBub2RlLnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTVERjJcdTVCOENcdTYyMTBcIiA6IG5vZGUudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdThGREJcdTg4NENcdTRFMkRcIiA6IFwiXHU1Rjg1XHU1MjlFXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLmljb24pIG1ldGEuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtbm9kZS1pY29uXCIsIHRleHQ6IG5vZGUuaWNvbiB9KTtcbiAgICAgIH1cbiAgICAgIGxldCBwcmVmaXhSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgICAgaWYgKGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikge1xuICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlKGJsb2NrLnNvdXJjZSk7XG4gICAgICAgICAgY29uc3Qgd3JhcCA9IGNvbnRlbnQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2RlLWltYWdlLWJsb2NrXCIgfSk7XG4gICAgICAgICAgY29uc3QgaW1hZ2UgPSB3cmFwLmNyZWF0ZUVsKFwiaW1nXCIsIHsgY2xzOiBcIm1tYy1ub2RlLWltYWdlXCIsIGF0dHI6IHsgYWx0OiBibG9jay5hbHQgPz8gKG5vZGVQbGFpblRleHQobm9kZSkgfHwgXCJcdTU2RkVcdTcyNDdcIiksIGxvYWRpbmc6IFwibGF6eVwiIH0gfSk7XG4gICAgICAgICAgaWYgKHJlc29sdmVkKSB7XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSByZXNvbHZlZDtcbiAgICAgICAgICAgIGltYWdlLnNldEF0dHIoXCJ0aXRsZVwiLCBcIlx1NzBCOVx1NTFGQlx1NjUzRVx1NTkyN1x1NTZGRVx1NzI0N1wiKTtcbiAgICAgICAgICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIG5ldyBJbWFnZVByZXZpZXdNb2RhbCh0aGlzLmFwcCwgcmVzb2x2ZWQsIGJsb2NrLmFsdCA/PyBcIlx1NTZGRVx1NzI0N1x1OTg4NFx1ODlDOFwiKS5vcGVuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW1hZ2UuYWRkQ2xhc3MoXCJpcy11bnJlc29sdmVkXCIpO1xuICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cihcInRpdGxlXCIsIGBcdTYyN0VcdTRFMERcdTUyMzBcdTU2RkVcdTcyNDdcdUZGMUEke2Jsb2NrLnNvdXJjZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFibG9jay50ZXh0LnRyaW0oKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IG1haW4gPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1tYWluIG1tYy1ub2RlLXRleHQtYmxvY2tcIiB9KTtcbiAgICAgICAgaWYgKCFwcmVmaXhSZW5kZXJlZCAmJiBub2RlLnRhc2spIHtcbiAgICAgICAgICBjb25zdCB0YXNrID0gbWFpbi5jcmVhdGVTcGFuKHsgY2xzOiBgbW1jLXRhc2staWNvbiB0YXNrLSR7bm9kZS50YXNrfWAsIHRleHQ6IG5vZGUudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1MjcxM1wiIDogbm9kZS50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1MjVEMFwiIDogXCJcdTI1Q0JcIiB9KTtcbiAgICAgICAgICB0YXNrLnNldEF0dHIoXCJhcmlhLWxhYmVsXCIsIG5vZGUudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIDogbm9kZS50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiIDogXCJcdTVGODVcdTUyOUVcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcmVmaXhSZW5kZXJlZCAmJiBub2RlLmljb24pIG1haW4uY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtbm9kZS1pY29uXCIsIHRleHQ6IG5vZGUuaWNvbiB9KTtcbiAgICAgICAgcHJlZml4UmVuZGVyZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCB0ZXh0RWwgPSBtYWluLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS10ZXh0XCIgfSk7XG4gICAgICAgIHJlbmRlclJpY2hUZXh0UnVucyh0ZXh0RWwsIGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0KTtcbiAgICAgICAgdGV4dEVsLnN0eWxlLmZvbnRTaXplID0gYCR7bm9kZS5zdHlsZT8uZm9udFNpemUgPz8gYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNH1weGA7XG4gICAgICAgIHRleHRFbC5zZXRBdHRyKFwiYXJpYS1sYWJlbFwiLCBibG9jay50ZXh0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUuc3VibWFwKSB7XG4gICAgICAgIGNvbnN0IHN1Ym1hcEJ1dHRvbiA9IGNvbnRlbnQuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLXN1Ym1hcC1jYXJkXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGBcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkUgJHtub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRofWAgfSB9KTtcbiAgICAgICAgc2V0SWNvbihzdWJtYXBCdXR0b24sIFwibmV0d29ya1wiKTtcbiAgICAgICAgc3VibWFwQnV0dG9uLmNyZWF0ZVNwYW4oeyB0ZXh0OiBub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRoLnNwbGl0KFwiL1wiKS5hdCgtMSk/LnJlcGxhY2UoL1xcLm1pbmRtYXAkL2ksIFwiXCIpID8/IFwiXHU1QjUwXHU1QkZDXHU1NkZFXCIgfSk7XG4gICAgICAgIHN1Ym1hcEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdm9pZCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5NaW5kTWFwKG5vZGUuc3VibWFwIS5wYXRoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChub2RlLnRhYmxlKSB0aGlzLnJlbmRlck5vZGVUYWJsZShjb250ZW50LCBub2RlKTtcbiAgICAgIGlmIChub2RlLmNvZGUpIHRoaXMucmVuZGVyTm9kZUNvZGUoY29udGVudCwgbm9kZSk7XG5cbiAgICAgIGlmIChub2RlLnRhZ3M/Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCB0YWdzID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtdGFnc1wiIH0pO1xuICAgICAgICBub2RlLnRhZ3Muc2xpY2UoMCwgNCkuZm9yRWFjaCgodGFnKSA9PiB0YWdzLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLW5vZGUtdGFnXCIsIHRleHQ6IGAjJHt0YWd9YCB9KSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1Rhc2tQcm9ncmVzcyAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBwcm9ncmVzcyA9IGdldFRhc2tQcm9ncmVzcyhub2RlKTtcbiAgICAgICAgaWYgKHByb2dyZXNzLnRvdGFsKSB7XG4gICAgICAgICAgY29uc3QgcGVyY2VudCA9IE1hdGgucm91bmQoKHByb2dyZXNzLmRvbmUgLyBwcm9ncmVzcy50b3RhbCkgKiAxMDApO1xuICAgICAgICAgIGNvbnN0IHByb2dyZXNzRWwgPSBub2RlRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YXNrLXByb2dyZXNzXCIsIGF0dHI6IHsgdGl0bGU6IGAke3Byb2dyZXNzLmRvbmV9LyR7cHJvZ3Jlc3MudG90YWx9IFx1NEUyQVx1NEVGQlx1NTJBMVx1NURGMlx1NUI4Q1x1NjIxMGAgfSB9KTtcbiAgICAgICAgICBwcm9ncmVzc0VsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGFzay1wcm9ncmVzcy1iYXJcIiwgYXR0cjogeyBzdHlsZTogYHdpZHRoOiR7cGVyY2VudH0lYCB9IH0pO1xuICAgICAgICAgIHByb2dyZXNzRWwuY3JlYXRlU3Bhbih7IHRleHQ6IGAke3BlcmNlbnR9JWAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGZvbGQgPSBub2RlRWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLWZvbGQtYnV0dG9uXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IG5vZGUuY29sbGFwc2VkID8gXCJcdTVDNTVcdTVGMDBcIiA6IFwiXHU2NTM2XHU4RDc3XCIgfSB9KTtcbiAgICAgICAgZm9sZC5zZXRUZXh0KG5vZGUuY29sbGFwc2VkID8gYCske25vZGUuY2hpbGRyZW4ubGVuZ3RofWAgOiBcIlx1MjIxMlwiKTtcbiAgICAgICAgZm9sZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpO1xuICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGFwc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxpbmsgPSB0aGlzLmdldE5vZGVMaW5rKG5vZGUpO1xuICAgICAgaWYgKGxpbmspIHtcbiAgICAgICAgY29uc3QgbGlua0J1dHRvbiA9IG5vZGVFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbWMtbm9kZS1saW5rXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGBcdTYyNTNcdTVGMDAgJHtsaW5rfWAgfSB9KTtcbiAgICAgICAgc2V0SWNvbihsaW5rQnV0dG9uLCBcImV4dGVybmFsLWxpbmtcIik7XG4gICAgICAgIGxpbmtCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTGluayhsaW5rKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgIHRoaXMuZWRpdFNlbGVjdGVkKCk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgIHRoaXMub3BlbkNvbnRleHRNZW51KGV2ZW50KTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuZHJhZ2dpbmdJZCA9IG5vZGUuaWQ7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlcj8uc2V0RGF0YShcInRleHQvcGxhaW5cIiwgbm9kZS5pZCk7XG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XG4gICAgICAgIG5vZGVFbC5hZGRDbGFzcyhcImlzLWRyYWdnaW5nXCIpO1xuICAgICAgfSk7XG4gICAgICBub2RlRWwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY2FuUmVwYXJlbnQodGhpcy5kcmFnZ2luZ0lkLCBub2RlLmlkKSkgcmV0dXJuO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgICAgICBub2RlRWwuYWRkQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKCkgPT4gbm9kZUVsLnJlbW92ZUNsYXNzKFwiaXMtZHJvcC10YXJnZXRcIikpO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBub2RlRWwucmVtb3ZlQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKTtcbiAgICAgICAgY29uc3QgZHJhZ2dlZElkID0gdGhpcy5kcmFnZ2luZ0lkID8/IGV2ZW50LmRhdGFUcmFuc2Zlcj8uZ2V0RGF0YShcInRleHQvcGxhaW5cIikgPz8gbnVsbDtcbiAgICAgICAgaWYgKGRyYWdnZWRJZCkgdGhpcy5yZXBhcmVudE5vZGUoZHJhZ2dlZElkLCBub2RlLmlkKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5kcmFnZ2luZ0lkID0gbnVsbDtcbiAgICAgICAgdGhpcy5ub2Rlc0xheWVyRWwucXVlcnlTZWxlY3RvckFsbChcIi5pcy1kcmFnZ2luZywgLmlzLWRyb3AtdGFyZ2V0XCIpLmZvckVhY2goKGVsZW1lbnQpID0+IGVsZW1lbnQucmVtb3ZlQ2xhc3NlcyhbXCJpcy1kcmFnZ2luZ1wiLCBcImlzLWRyb3AtdGFyZ2V0XCJdKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVRyYW5zZm9ybSgpOiB2b2lkIHtcbiAgICBjb25zdCByZWN0ID0gdGhpcy52aWV3cG9ydEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHRoaXMuc2NlbmVFbC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7cmVjdC53aWR0aCAvIDIgKyB0aGlzLnBhblh9cHgsICR7cmVjdC5oZWlnaHQgLyAyICsgdGhpcy5wYW5ZfXB4KSBzY2FsZSgke3RoaXMuem9vbX0pYDtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLXpvb21cIiwgU3RyaW5nKHRoaXMuem9vbSkpO1xuICAgIHRoaXMuem9vbVN0YXR1c0VsPy5zZXRUZXh0KGAke01hdGgucm91bmQodGhpcy56b29tICogMTAwKX0lYCk7XG4gIH1cblxuICBwcml2YXRlIHNlbGVjdE5vZGUoaWQ6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSBpZCA/PyBcIlwiO1xuICAgIHRoaXMubm9kZXNMYXllckVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubW1jLW5vZGUuaXMtc2VsZWN0ZWRcIikuZm9yRWFjaCgoZWxlbWVudCkgPT4gZWxlbWVudC5yZW1vdmVDbGFzcyhcImlzLXNlbGVjdGVkXCIpKTtcbiAgICBpZiAoaWQpIHRoaXMubm9kZXNMYXllckVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KGAubW1jLW5vZGVbZGF0YS1ub2RlLWlkPVwiJHtDU1MuZXNjYXBlKGlkKX1cIl1gKT8uYWRkQ2xhc3MoXCJpcy1zZWxlY3RlZFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgc2VsZWN0ZWROb2RlKCk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRJZCA/IGZpbmROb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgdGhpcy5zZWxlY3RlZElkKSA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvbmZpZ3VyZWROb2RlKHRleHQgPSBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiKTogTWluZE1hcE5vZGUge1xuICAgIGNvbnN0IG5vZGUgPSBjcmVhdGVOb2RlKHRleHQpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSAhPT0gXCJyb3VuZGVkXCIpIG5vZGUuc3R5bGUgPSB7IHNoYXBlOiB0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSB9O1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRDaGlsZCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWROb2RlKCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gbm9kZS5pZDtcbiAgICB9KTtcbiAgICB0aGlzLmVkaXRTZWxlY3RlZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRTaWJsaW5nKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8IHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWROb2RlKCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZCkgPT4gY2hpbGQuaWQgPT09IHNlbGVjdGVkLmlkKTtcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXggKyAxLCAwLCBub2RlKTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IG5vZGUuaWQ7XG4gICAgfSk7XG4gICAgdGhpcy5lZGl0U2VsZWN0ZWQoKTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdFNlbGVjdGVkKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkKSByZXR1cm47XG4gICAgbGV0IGhpc3RvcnlDYXB0dXJlZCA9IGZhbHNlO1xuICAgIG5ldyBOb2RlRWRpdE1vZGFsKHRoaXMuYXBwLCBzZWxlY3RlZCwgdGhpcy5vcHRpb25zLmRlZmF1bHROb2RlU2hhcGUsIHtcbiAgICAgIHJlc29sdmVJbWFnZTogdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlLFxuICAgICAgb25TYXZlUGFzdGVkSW1hZ2U6IHRoaXMuY2FsbGJhY2tzLm9uU2F2ZVBhc3RlZEltYWdlLFxuICAgICAgZ2V0SW1hZ2VIb3N0czogdGhpcy5jYWxsYmFja3MuZ2V0SW1hZ2VIb3N0cyxcbiAgICAgIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzOiB0aGlzLmNhbGxiYWNrcy5nZXREZWZhdWx0VXBsb2FkSG9zdElkcyxcbiAgICAgIG9uVXBsb2FkSW1hZ2U6IHRoaXMuY2FsbGJhY2tzLm9uVXBsb2FkSW1hZ2UsXG4gICAgICBvblJlYWRJbWFnZVNvdXJjZTogdGhpcy5jYWxsYmFja3Mub25SZWFkSW1hZ2VTb3VyY2VcbiAgICB9LCAodmFsdWVzKSA9PiB7XG4gICAgICAvLyBBIGNvbnRpbnVvdXNseSBvcGVuIGVkaXRvciBtYXkgYXV0b3NhdmUgbWFueSB0aW1lcy4gQ2FwdHVyZSBvbmUgdW5kb1xuICAgICAgLy8gc25hcHNob3QgZm9yIHRoZSB3aG9sZSBlZGl0aW5nIHNlc3Npb24gaW5zdGVhZCBvZiBvbmUgc25hcHNob3QgcGVyIGtleXByZXNzLlxuICAgICAgaWYgKCFoaXN0b3J5Q2FwdHVyZWQpIHtcbiAgICAgICAgdGhpcy5oaXN0b3J5LnB1c2goSlNPTi5zdHJpbmdpZnkodGhpcy5kb2N1bWVudCkpO1xuICAgICAgICB0aGlzLnRyaW1IaXN0b3J5KCk7XG4gICAgICAgIHRoaXMuZnV0dXJlID0gW107XG4gICAgICAgIGhpc3RvcnlDYXB0dXJlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBzZWxlY3RlZC5jb250ZW50ID0gdmFsdWVzLmNvbnRlbnQ7XG4gICAgICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyhzZWxlY3RlZCk7XG4gICAgICBzZWxlY3RlZC5ub3RlID0gdmFsdWVzLm5vdGUgfHwgdW5kZWZpbmVkO1xuICAgICAgc2VsZWN0ZWQubGluayA9IHZhbHVlcy5saW5rIHx8IHVuZGVmaW5lZDtcbiAgICAgIHNlbGVjdGVkLmljb24gPSB2YWx1ZXMuaWNvbiB8fCB1bmRlZmluZWQ7XG4gICAgICBzZWxlY3RlZC50YWdzID0gdmFsdWVzLnRhZ3MubGVuZ3RoID8gdmFsdWVzLnRhZ3MgOiB1bmRlZmluZWQ7XG4gICAgICBzZWxlY3RlZC50YXNrID0gdmFsdWVzLnRhc2s7XG4gICAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgICAgY29sb3I6IHZhbHVlcy5jb2xvcixcbiAgICAgICAgdGV4dENvbG9yOiB2YWx1ZXMudGV4dENvbG9yLFxuICAgICAgICBib3JkZXJDb2xvcjogdmFsdWVzLmJvcmRlckNvbG9yLFxuICAgICAgICBib3JkZXJXaWR0aDogdmFsdWVzLmJvcmRlcldpZHRoLFxuICAgICAgICBzaGFwZTogdmFsdWVzLnNoYXBlLFxuICAgICAgICBib2xkOiB2YWx1ZXMuYm9sZCxcbiAgICAgICAgaXRhbGljOiB2YWx1ZXMuaXRhbGljLFxuICAgICAgICB1bmRlcmxpbmU6IHZhbHVlcy51bmRlcmxpbmUsXG4gICAgICAgIGZvbnRTaXplOiB2YWx1ZXMuZm9udFNpemVcbiAgICAgIH07XG4gICAgICBzZWxlY3RlZC5zdHlsZSA9IE9iamVjdC52YWx1ZXMoc3R5bGUpLnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IHN0eWxlIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgICAgY29uc3QgdGl0bGUgPSBub2RlUGxhaW5UZXh0KHNlbGVjdGVkKTtcbiAgICAgICAgaWYgKHRpdGxlKSB0aGlzLmRvY3VtZW50LnRpdGxlID0gdGl0bGU7XG4gICAgICB9XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgZGVsZXRlU2VsZWN0ZWQoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQgfHwgc2VsZWN0ZWQuaWQgPT09IHRoaXMuZG9jdW1lbnQucm9vdC5pZCkge1xuICAgICAgbmV3IE5vdGljZShcIlx1NjgzOVx1ODI4Mlx1NzBCOVx1NEUwRFx1ODBGRFx1NTIyMFx1OTY2NFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICByZW1vdmVOb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gcGFyZW50Py5pZCA/PyB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZUNvbGxhcHNlKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8ICFzZWxlY3RlZC5jaGlsZHJlbi5sZW5ndGgpIHJldHVybjtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLmNvbGxhcHNlZCA9ICFzZWxlY3RlZC5jb2xsYXBzZWQ7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjeWNsZVRhc2soKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICBjb25zdCBuZXh0OiBSZWNvcmQ8c3RyaW5nLCBUYXNrU3RhdHVzIHwgdW5kZWZpbmVkPiA9IHsgXCJcIjogXCJ0b2RvXCIsIHRvZG86IFwiZG9pbmdcIiwgZG9pbmc6IFwiZG9uZVwiLCBkb25lOiB1bmRlZmluZWQgfTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLnRhc2sgPSBuZXh0W3NlbGVjdGVkLnRhc2sgPz8gXCJcIl07IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2dnbGVMYXlvdXQoKTogdm9pZCB7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4geyB0aGlzLmRvY3VtZW50LmxheW91dCA9IHRoaXMuZG9jdW1lbnQubGF5b3V0ID09PSBcInJpZ2h0XCIgPyBcImJhbGFuY2VkXCIgOiBcInJpZ2h0XCI7IH0pO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDIwKTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdEFwcGVhcmFuY2UoKTogdm9pZCB7XG4gICAgbmV3IEFwcGVhcmFuY2VNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5nZXRBcHBlYXJhbmNlKCksXG4gICAgICAoYXBwZWFyYW5jZSkgPT4gdGhpcy5tdXRhdGUoKCkgPT4geyB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UgPSBhcHBlYXJhbmNlOyB9KSxcbiAgICAgICgpID0+IHRoaXMubXV0YXRlKCgpID0+IHsgdGhpcy5kb2N1bWVudC5hcHBlYXJhbmNlID0gdW5kZWZpbmVkOyB9KVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBlZGl0VGFibGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBuZXcgVGFibGVFZGl0TW9kYWwodGhpcy5hcHAsIHNlbGVjdGVkLnRhYmxlLCAodGFibGUpID0+IHtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQudGFibGUgPSB0YWJsZTsgfSk7XG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb252ZXJ0Q2hpbGRyZW5Ub1RhYmxlKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgY29uc3QgdGFibGUgPSBjaGlsZHJlblRvVGFibGUoc2VsZWN0ZWQpO1xuICAgIGlmICghdGFibGUpIHsgbmV3IE5vdGljZShcIlx1NUY1M1x1NTI0RFx1ODI4Mlx1NzBCOVx1NkNBMVx1NjcwOVx1NTNFRlx1OEY2Q1x1NjM2Mlx1NzY4NFx1NUI1MFx1ODI4Mlx1NzBCOVwiKTsgcmV0dXJuOyB9XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQudGFibGUgPSB0YWJsZTtcbiAgICAgIHNlbGVjdGVkLmNvbGxhcHNlZCA9IHRydWU7XG4gICAgfSk7XG4gICAgbmV3IE5vdGljZShcIlx1NURGMlx1NzUxRlx1NjIxMFx1NUI1MFx1ODI4Mlx1NzBCOVx1ODg2OFx1NjgzQ1x1RkYxQlx1NTM5Rlx1NUI1MFx1ODI4Mlx1NzBCOVx1NURGMlx1NEZERFx1NzU1OVx1NUU3Nlx1NjUzNlx1OEQ3N1wiKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlVGFibGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQ/LnRhYmxlKSByZXR1cm47XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQudGFibGUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoc2VsZWN0ZWQuY2hpbGRyZW4ubGVuZ3RoKSBzZWxlY3RlZC5jb2xsYXBzZWQgPSBmYWxzZTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdENvZGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBuZXcgQ29kZUVkaXRNb2RhbCh0aGlzLmFwcCwgc2VsZWN0ZWQuY29kZSwgKGNvZGUpID0+IHtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29kZSA9IGNvZGU7IH0pO1xuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlQ29kZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZD8uY29kZSkgcmV0dXJuO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29kZSA9IHVuZGVmaW5lZDsgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZU9yT3BlblN1Ym1hcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGlmIChzZWxlY3RlZC5zdWJtYXApIHtcbiAgICAgIGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uT3Blbk1pbmRNYXAoc2VsZWN0ZWQuc3VibWFwLnBhdGgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3VibWFwID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25DcmVhdGVTdWJtYXAoc2VsZWN0ZWQpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5zdWJtYXAgPSBzdWJtYXA7IH0pO1xuICAgICAgYXdhaXQgdGhpcy5jYWxsYmFja3Mub25PcGVuTWluZE1hcChzdWJtYXAucGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBjcmVhdGUgc3VibWFwIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1MjFCXHU1RUZBXHU1QjUwXHU1QkZDXHU1NkZFXHU1OTMxXHU4RDI1XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTm9kZVRhYmxlKGNvbnRlbnQ6IEhUTUxFbGVtZW50LCBub2RlOiBNaW5kTWFwTm9kZSk6IHZvaWQge1xuICAgIGlmICghbm9kZS50YWJsZSkgcmV0dXJuO1xuICAgIGNvbnN0IHdyYXAgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS10YWJsZS13cmFwXCIgfSk7XG4gICAgY29uc3QgdGFibGUgPSB3cmFwLmNyZWF0ZUVsKFwidGFibGVcIiwgeyBjbHM6IFwibW1jLW5vZGUtdGFibGVcIiB9KTtcbiAgICBjb25zdCBoZWFkID0gdGFibGUuY3JlYXRlRWwoXCJ0aGVhZFwiKS5jcmVhdGVFbChcInRyXCIpO1xuICAgIG5vZGUudGFibGUuaGVhZGVycy5mb3JFYWNoKChoZWFkZXIsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBjZWxsID0gaGVhZC5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogaGVhZGVyIHx8IGBcdTUyMTcgJHtpbmRleCArIDF9YCB9KTtcbiAgICAgIGNlbGwuc3R5bGUudGV4dEFsaWduID0gbm9kZS50YWJsZT8uYWxpZ25tZW50cz8uW2luZGV4XSA/PyBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCBib2R5ID0gdGFibGUuY3JlYXRlRWwoXCJ0Ym9keVwiKTtcbiAgICBub2RlLnRhYmxlLnJvd3MuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICBjb25zdCB0ciA9IGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICAgIG5vZGUudGFibGUhLmhlYWRlcnMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHRyLmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiByb3dbaW5kZXhdID8/IFwiXCIgfSk7XG4gICAgICAgIGNlbGwuc3R5bGUudGV4dEFsaWduID0gbm9kZS50YWJsZT8uYWxpZ25tZW50cz8uW2luZGV4XSA/PyBcImxlZnRcIjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoZXZlbnQpID0+IGV2ZW50LnByZXZlbnREZWZhdWx0KCkpO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpOyB0aGlzLmVkaXRUYWJsZSgpOyB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTm9kZUNvZGUoY29udGVudDogSFRNTEVsZW1lbnQsIG5vZGU6IE1pbmRNYXBOb2RlKTogdm9pZCB7XG4gICAgaWYgKCFub2RlLmNvZGUpIHJldHVybjtcbiAgICBjb25zdCBibG9jayA9IGNvbnRlbnQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2RlLWJsb2NrXCIgfSk7XG4gICAgY29uc3QgaGVhZGVyID0gYmxvY2suY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2RlLWhlYWRlclwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVTcGFuKHsgdGV4dDogbm9kZS5jb2RlLmxhbmd1YWdlIHx8IFwiY29kZVwiIH0pO1xuICAgIGNvbnN0IGNvcHkgPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb25cIiwgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJcdTU5MERcdTUyMzZcdTRFRTNcdTc4MDFcIiB9IH0pO1xuICAgIHNldEljb24oY29weSwgXCJjb3B5XCIpO1xuICAgIGNvcHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KG5vZGUuY29kZSEuY29kZSkudGhlbigoKSA9PiBuZXcgTm90aWNlKFwiXHU0RUUzXHU3ODAxXHU1REYyXHU1OTBEXHU1MjM2XCIpKTtcbiAgICB9KTtcbiAgICBjb25zdCByZW5kZXJlZCA9IGJsb2NrLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29kZS1yZW5kZXJlZCBtYXJrZG93bi1yZW5kZXJlZFwiIH0pO1xuICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25SZW5kZXJDb2RlKG5vZGUuY29kZSwgcmVuZGVyZWQpO1xuICAgIGJsb2NrLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCAoZXZlbnQpID0+IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpKTtcbiAgICBibG9jay5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgYmxvY2suYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpOyB0aGlzLmVkaXRDb2RlKCk7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVQYXN0ZShldmVudDogQ2xpcGJvYXJkRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKHRhcmdldC5tYXRjaGVzKFwiaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QsIFtjb250ZW50ZWRpdGFibGU9J3RydWUnXVwiKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRhdGEgPSBldmVudC5jbGlwYm9hcmREYXRhO1xuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuICAgIGNvbnN0IGltYWdlSXRlbSA9IEFycmF5LmZyb20oZGF0YS5pdGVtcykuZmluZCgoaXRlbSkgPT4gaXRlbS5raW5kID09PSBcImZpbGVcIiAmJiBpdGVtLnR5cGUuc3RhcnRzV2l0aChcImltYWdlL1wiKSk7XG4gICAgaWYgKGltYWdlSXRlbSkge1xuICAgICAgY29uc3QgYmxvYiA9IGltYWdlSXRlbS5nZXRBc0ZpbGUoKTtcbiAgICAgIGlmICghYmxvYikgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBleHRlbnNpb24gPSBibG9iLnR5cGUuc3BsaXQoXCIvXCIpWzFdPy5yZXBsYWNlKFwianBlZ1wiLCBcImpwZ1wiKSB8fCBcInBuZ1wiO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGBtaW5kbWFwLWltYWdlLiR7ZXh0ZW5zaW9ufWA7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vblNhdmVQYXN0ZWRJbWFnZShibG9iLCBmaWxlbmFtZSk7XG4gICAgICAgIGNvbnN0IGltYWdlQmxvY2s6IE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9IHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBwYXRoLCBsb2NhbFNvdXJjZTogcGF0aCB9O1xuICAgICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Moc2VsZWN0ZWQpO1xuICAgICAgICAgIGJsb2Nrcy5wdXNoKGltYWdlQmxvY2spO1xuICAgICAgICAgIHNlbGVjdGVkLmNvbnRlbnQgPSBibG9ja3M7XG4gICAgICAgICAgc3luY05vZGVMZWdhY3lGaWVsZHMoc2VsZWN0ZWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc2NoZWR1bGVkID0gdGhpcy5jYWxsYmFja3Mub25TY2hlZHVsZUF1dG9VcGxvYWQoc2VsZWN0ZWQuaWQsIGltYWdlQmxvY2suaWQsIHBhdGgsIGZpbGVuYW1lKTtcbiAgICAgICAgbmV3IE5vdGljZShzY2hlZHVsZWQgPyBgXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU1QjU4XHVGRjBDXHU3QjQ5XHU1Rjg1XHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHVGRjFBJHtwYXRofWAgOiBgXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU1QjU4XHVGRjFBJHtwYXRofWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIHBhc3RlIGltYWdlIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTU5MzFcdThEMjVcIik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IGRhdGEuZ2V0RGF0YShcInRleHQvcGxhaW5cIik7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkgcmV0dXJuO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgY29uc3QgdGFibGUgPSBwYXJzZU1hcmtkb3duVGFibGUodGV4dCk7XG4gICAgaWYgKHRhYmxlKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC50YWJsZSA9IHRhYmxlOyB9KTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVERjJcdThCQzZcdTUyMkJcdTVFNzZcdTYzRDJcdTUxNjUgTWFya2Rvd24gXHU4ODY4XHU2ODNDXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjb2RlID0gcGFyc2VGZW5jZWRDb2RlKHRleHQpO1xuICAgIGlmIChjb2RlKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5jb2RlID0gY29kZTsgfSk7XG4gICAgICBuZXcgTm90aWNlKGBcdTVERjJcdThCQzZcdTUyMkJcdTVFNzZcdTYzRDJcdTUxNjUke2NvZGUubGFuZ3VhZ2UgPyBgICR7Y29kZS5sYW5ndWFnZX1gIDogXCJcIn1cdTRFRTNcdTc4MDFgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYnJhbmNoID0gdGhpcy5wYXJzZUNsaXBib2FyZE5vZGUodGV4dCk7XG4gICAgaWYgKGJyYW5jaCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IGNsb25lID0gY2xvbmVOb2RlV2l0aEZyZXNoSWRzKGJyYW5jaCk7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLmNvbGxhcHNlZCA9IGZhbHNlOyBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKGNsb25lKTsgdGhpcy5zZWxlY3RlZElkID0gY2xvbmUuaWQ7IH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb3BlblNlbGVjdGVkTGluaygpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgIGNvbnN0IGxpbmsgPSB0aGlzLmdldE5vZGVMaW5rKHNlbGVjdGVkKTtcbiAgICBpZiAoIWxpbmspIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVGNTNcdTUyNERcdTgyODJcdTcwQjlcdTZDQTFcdTY3MDlcdTk0RkVcdTYzQTVcdUZGMUJcdTUzRUZcdTYzMDkgRjIgXHU2REZCXHU1MkEwXHU5NEZFXHU2M0E1XHU2MjE2XHU1NzI4XHU2NTg3XHU1QjU3XHU0RTJEXHU1MTk5XHU1MTY1IFtbXHU3QjE0XHU4QkIwXHU1NDBEXV1cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTGluayhsaW5rKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Tm9kZUxpbmsobm9kZTogTWluZE1hcE5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gbm9kZS5saW5rPy50cmltKCkgfHwgZXh0cmFjdEZpcnN0V2lraUxpbmsobm9kZVBsYWluVGV4dChub2RlKSkgfHwgZXh0cmFjdEZpcnN0V2lraUxpbmsobm9kZS5ub3RlID8/IFwiXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzaG93T3V0bGluZSgpOiB2b2lkIHtcbiAgICBjb25zdCBtYXJrZG93biA9IGRvY3VtZW50VG9NYXJrZG93bih0aGlzLmRvY3VtZW50KTtcbiAgICBuZXcgT3V0bGluZU1vZGFsKHRoaXMuYXBwLCBtYXJrZG93biwgKCkgPT4gdm9pZCB0aGlzLmNhbGxiYWNrcy5vbkV4cG9ydE1hcmtkb3duKG1hcmtkb3duKSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBzaG93SnNvblRyYW5zZmVyKCk6IHZvaWQge1xuICAgIG5ldyBKc29uVHJhbnNmZXJNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5nZXREb2N1bWVudCgpLFxuICAgICAgKGRvY3VtZW50KSA9PiB0aGlzLnJlcGxhY2VEb2N1bWVudChkb2N1bWVudCksXG4gICAgICAoanNvbikgPT4gdm9pZCB0aGlzLmNhbGxiYWNrcy5vbkV4cG9ydEpzb24oanNvbilcbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgb3BlblNlYXJjaCgpOiB2b2lkIHtcbiAgICBuZXcgU2VhcmNoTm9kZXNNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgZmxhdHRlbk5vZGVzKHRoaXMuZG9jdW1lbnQucm9vdCksXG4gICAgICAocXVlcnkpID0+IHtcbiAgICAgICAgdGhpcy5zZWFyY2hRdWVyeSA9IHF1ZXJ5O1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSxcbiAgICAgIChub2RlKSA9PiB0aGlzLmZvY3VzTm9kZShub2RlLmlkKVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb2N1c05vZGUoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGFuY2VzdG9ycyA9IGZpbmRBbmNlc3RvcnModGhpcy5kb2N1bWVudC5yb290LCBpZCk7XG4gICAgY29uc3QgY29sbGFwc2VkID0gYW5jZXN0b3JzLmZpbHRlcigobm9kZSkgPT4gbm9kZS5jb2xsYXBzZWQpO1xuICAgIGlmIChjb2xsYXBzZWQubGVuZ3RoKSB7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiBjb2xsYXBzZWQuZm9yRWFjaCgobm9kZSkgPT4geyBub2RlLmNvbGxhcHNlZCA9IGZhbHNlOyB9KSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGlkO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5jZW50ZXJOb2RlKGlkKSwgMjApO1xuICB9XG5cbiAgcHJpdmF0ZSBjZW50ZXJOb2RlKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMubGF5b3V0LmJ5SWQuZ2V0KGlkKTtcbiAgICBpZiAoIXBvc2l0aW9uKSByZXR1cm47XG4gICAgdGhpcy5wYW5YID0gLXBvc2l0aW9uLnggKiB0aGlzLnpvb207XG4gICAgdGhpcy5wYW5ZID0gLXBvc2l0aW9uLnkgKiB0aGlzLnpvb207XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBvcGVuQ29udGV4dE1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU2REZCXHU1MkEwXHU1QjUwXHU4MjgyXHU3MEI5XCIpLnNldEljb24oXCJwbHVzLWNpcmNsZVwiKS5vbkNsaWNrKCgpID0+IHRoaXMuYWRkQ2hpbGQoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NkRGQlx1NTJBMFx1NTQwQ1x1N0VBN1x1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwibGlzdC1wbHVzXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5hZGRTaWJsaW5nKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcInBlbmNpbFwiKS5vbkNsaWNrKCgpID0+IHRoaXMuZWRpdFNlbGVjdGVkKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcIikuc2V0SWNvbihcImNvcHktcGx1c1wiKS5vbkNsaWNrKCgpID0+IHRoaXMuZHVwbGljYXRlU2VsZWN0ZWQoKSkpO1xuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKHNlbGVjdGVkPy50YWJsZSA/IFwiXHU3RjE2XHU4RjkxXHU4ODY4XHU2ODNDXCIgOiBcIlx1NjNEMlx1NTE2NVx1ODg2OFx1NjgzQ1wiKS5zZXRJY29uKFwidGFibGUtMlwiKS5vbkNsaWNrKCgpID0+IHRoaXMuZWRpdFRhYmxlKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTVDMDZcdTVCNTBcdTgyODJcdTcwQjlcdTc1MUZcdTYyMTBcdTg4NjhcdTY4M0NcIikuc2V0SWNvbihcInRhYmxlLXByb3BlcnRpZXNcIikub25DbGljaygoKSA9PiB0aGlzLmNvbnZlcnRDaGlsZHJlblRvVGFibGUoKSkpO1xuICAgIGlmIChzZWxlY3RlZD8udGFibGUpIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NzlGQlx1OTY2NFx1ODg2OFx1NjgzQ1wiKS5zZXRJY29uKFwidGFibGUtMlwiKS5vbkNsaWNrKCgpID0+IHRoaXMucmVtb3ZlVGFibGUoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShzZWxlY3RlZD8uY29kZSA/IFwiXHU3RjE2XHU4RjkxXHU0RUUzXHU3ODAxXCIgOiBcIlx1NjNEMlx1NTE2NVx1NEVFM1x1NzgwMVwiKS5zZXRJY29uKFwiY29kZS0yXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5lZGl0Q29kZSgpKSk7XG4gICAgaWYgKHNlbGVjdGVkPy5jb2RlKSBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTc5RkJcdTk2NjRcdTRFRTNcdTc4MDFcIikuc2V0SWNvbihcImVyYXNlclwiKS5vbkNsaWNrKCgpID0+IHRoaXMucmVtb3ZlQ29kZSgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKHNlbGVjdGVkPy5zdWJtYXAgPyBcIlx1OEZEQlx1NTE2NVx1NUI1MFx1NUJGQ1x1NTZGRVwiIDogXCJcdTUyMUJcdTVFRkFcdTVCNTBcdTVCRkNcdTU2RkVcIikuc2V0SWNvbihcIm5ldHdvcmtcIikub25DbGljaygoKSA9PiB2b2lkIHRoaXMuY3JlYXRlT3JPcGVuU3VibWFwKCkpKTtcbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NTkwRFx1NTIzNlx1NTIwNlx1NjUyRlwiKS5zZXRJY29uKFwiY29weVwiKS5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5jb3B5U2VsZWN0ZWRCcmFuY2goKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1N0M5OFx1OEQzNFx1NEUzQVx1NUI1MFx1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwiY2xpcGJvYXJkLXBhc3RlXCIpLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLnBhc3RlQXNDaGlsZCgpKSk7XG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoYFx1NEVGQlx1NTJBMVx1NzJCNlx1NjAwMVx1RkYxQSR7c2VsZWN0ZWQ/LnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTVERjJcdTVCOENcdTYyMTBcIiA6IHNlbGVjdGVkPy50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiIDogc2VsZWN0ZWQ/LnRhc2sgPT09IFwidG9kb1wiID8gXCJcdTVGODVcdTUyOUVcIiA6IFwiXHU2NUUwXCJ9YCkuc2V0SWNvbihcImNpcmNsZS1jaGVjay1iaWdcIikub25DbGljaygoKSA9PiB0aGlzLmN5Y2xlVGFzaygpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU1QzU1XHU1RjAwL1x1NjUzNlx1OEQ3N1wiKS5zZXRJY29uKFwiZm9sZC12ZXJ0aWNhbFwiKS5vbkNsaWNrKCgpID0+IHRoaXMudG9nZ2xlQ29sbGFwc2UoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NjI1M1x1NUYwMFx1OTRGRVx1NjNBNVwiKS5zZXRJY29uKFwibGlua1wiKS5vbkNsaWNrKCgpID0+IHRoaXMub3BlblNlbGVjdGVkTGluaygpKSk7XG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTUyMjBcdTk2NjRcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcInRyYXNoLTJcIikub25DbGljaygoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkpKTtcbiAgICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb3B5U2VsZWN0ZWRCcmFuY2goKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQpIHJldHVybiBmYWxzZTtcbiAgICB0aGlzLmJyYW5jaENsaXBib2FyZCA9IGNsb25lRG9jdW1lbnQoeyB2ZXJzaW9uOiA4LCB0aXRsZTogbm9kZVBsYWluVGV4dChzZWxlY3RlZCkgfHwgXCJcdTU2RkVcdTcyNDdcdTgyODJcdTcwQjlcIiwgbGF5b3V0OiBcInJpZ2h0XCIsIHRoZW1lOiBcImF1dG9cIiwgcm9vdDogc2VsZWN0ZWQgfSkucm9vdDtcbiAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcIm1pbmRtYXAtc3R1ZGlvLW5vZGVcIiwgdmVyc2lvbjogMSwgbm9kZTogc2VsZWN0ZWQgfSwgbnVsbCwgMik7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHBheWxvYWQpO1xuICAgICAgbmV3IE5vdGljZShcIlx1NURGMlx1NTkwRFx1NTIzNlx1ODI4Mlx1NzBCOVx1NTIwNlx1NjUyRlwiKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTgyODJcdTcwQjlcdTUyMDZcdTY1MkZcdTVERjJcdTU5MERcdTUyMzZcdTUyMzBcdTYzRDJcdTRFRjZcdTUxODVcdTkwRThcdTUyNkFcdThEMzRcdTY3N0ZcIik7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXN0ZUFzQ2hpbGQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBsZXQgc291cmNlTm9kZTogTWluZE1hcE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQucmVhZFRleHQoKTtcbiAgICAgIGlmICh0ZXh0LnRyaW0oKSkgc291cmNlTm9kZSA9IHRoaXMucGFyc2VDbGlwYm9hcmROb2RlKHRleHQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gQnJvd3NlciBjbGlwYm9hcmQgcGVybWlzc2lvbiBjYW4gYmUgdW5hdmFpbGFibGU7IHVzZSBpbnRlcm5hbCBjbGlwYm9hcmQuXG4gICAgfVxuICAgIHNvdXJjZU5vZGUgPz89IHRoaXMuYnJhbmNoQ2xpcGJvYXJkO1xuICAgIGlmICghc291cmNlTm9kZSkge1xuICAgICAgbmV3IE5vdGljZShcIlx1NTI2QVx1OEQzNFx1Njc3Rlx1NEUyRFx1NkNBMVx1NjcwOVx1NTNFRlx1N0M5OFx1OEQzNFx1NzY4NCBNaW5kTWFwIFx1ODI4Mlx1NzBCOVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2xvbmUgPSBjbG9uZU5vZGVXaXRoRnJlc2hJZHMoc291cmNlTm9kZSk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKGNsb25lKTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGNsb25lLmlkO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUNsaXBib2FyZE5vZGUodGV4dDogc3RyaW5nKTogTWluZE1hcE5vZGUgfCBudWxsIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZSh0ZXh0KSBhcyB7IHR5cGU/OiBzdHJpbmc7IG5vZGU/OiBQYXJ0aWFsPE1pbmRNYXBOb2RlPjsgcm9vdD86IFBhcnRpYWw8TWluZE1hcE5vZGU+OyB0ZXh0Pzogc3RyaW5nOyBjaGlsZHJlbj86IHVua25vd25bXSB9O1xuICAgICAgY29uc3QgaW5wdXQgPSAocGFyc2VkLnR5cGUgPT09IFwibWluZG1hcC1zdHVkaW8tbm9kZVwiIHx8IHBhcnNlZC50eXBlID09PSBcIm1tYy1saXRlLW5vZGVcIiB8fCBwYXJzZWQudHlwZSA9PT0gXCJzbW0tbGl0ZS1ub2RlXCIpICYmIHBhcnNlZC5ub2RlID8gcGFyc2VkLm5vZGUgOiBwYXJzZWQucm9vdCA/PyAodHlwZW9mIHBhcnNlZC50ZXh0ID09PSBcInN0cmluZ1wiICYmIEFycmF5LmlzQXJyYXkocGFyc2VkLmNoaWxkcmVuKSA/IHBhcnNlZCA6IG51bGwpO1xuICAgICAgaWYgKCFpbnB1dCkgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gbm9ybWFsaXplRG9jdW1lbnQoeyB0aXRsZTogaW5wdXQudGV4dCA/PyBcIlx1N0M5OFx1OEQzNFx1ODI4Mlx1NzBCOVwiLCByb290OiBpbnB1dCBhcyBNaW5kTWFwTm9kZSB9LCBpbnB1dC50ZXh0ID8/IFwiXHU3Qzk4XHU4RDM0XHU4MjgyXHU3MEI5XCIpLnJvb3Q7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGR1cGxpY2F0ZVNlbGVjdGVkKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8IHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdThCRjdcdTkwMDlcdTYyRTlcdTk3NUVcdTY4MzlcdTgyODJcdTcwQjlcdTU0MEVcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudCA9IGZpbmRQYXJlbnQodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgaWYgKCFwYXJlbnQpIHJldHVybjtcbiAgICBjb25zdCBjbG9uZSA9IGNsb25lTm9kZVdpdGhGcmVzaElkcyhzZWxlY3RlZCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZCkgPT4gY2hpbGQuaWQgPT09IHNlbGVjdGVkLmlkKTtcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXggKyAxLCAwLCBjbG9uZSk7XG4gICAgICB0aGlzLnNlbGVjdGVkSWQgPSBjbG9uZS5pZDtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY2FuUmVwYXJlbnQoZHJhZ2dlZElkOiBzdHJpbmcgfCBudWxsLCB0YXJnZXRJZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFkcmFnZ2VkSWQgfHwgZHJhZ2dlZElkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQgfHwgZHJhZ2dlZElkID09PSB0YXJnZXRJZCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGRyYWdnZWQgPSBmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGRyYWdnZWRJZCk7XG4gICAgcmV0dXJuIEJvb2xlYW4oZHJhZ2dlZCAmJiAhY29udGFpbnNOb2RlKGRyYWdnZWQsIHRhcmdldElkKSk7XG4gIH1cblxuICBwcml2YXRlIHJlcGFyZW50Tm9kZShkcmFnZ2VkSWQ6IHN0cmluZywgdGFyZ2V0SWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jYW5SZXBhcmVudChkcmFnZ2VkSWQsIHRhcmdldElkKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRyYWdnZWQgPSBmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGRyYWdnZWRJZCk7XG4gICAgY29uc3QgdGFyZ2V0ID0gZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCB0YXJnZXRJZCk7XG4gICAgaWYgKCFkcmFnZ2VkIHx8ICF0YXJnZXQpIHJldHVybjtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICByZW1vdmVOb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgZHJhZ2dlZElkKTtcbiAgICAgIHRhcmdldC5jaGlsZHJlbi5wdXNoKGRyYWdnZWQpO1xuICAgICAgdGFyZ2V0LmNvbGxhcHNlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gZHJhZ2dlZElkO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZXBsYWNlRG9jdW1lbnQoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCk6IHZvaWQge1xuICAgIHRoaXMuaGlzdG9yeS5wdXNoKEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnQpKTtcbiAgICB0aGlzLnRyaW1IaXN0b3J5KCk7XG4gICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICB0aGlzLmRvY3VtZW50ID0gY2xvbmVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLmZpdFRvVmlldygpLCAyMCk7XG4gIH1cblxuICBwcml2YXRlIG11dGF0ZShhY3Rpb246ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy50cmltSGlzdG9yeSgpO1xuICAgIHRoaXMuZnV0dXJlID0gW107XG4gICAgYWN0aW9uKCk7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSB0cmltSGlzdG9yeSgpOiB2b2lkIHtcbiAgICBjb25zdCBsaW1pdCA9IE1hdGgubWF4KDEwLCBNYXRoLm1pbig1MDAsIHRoaXMub3B0aW9ucy5oaXN0b3J5TGltaXQpKTtcbiAgICB3aGlsZSAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+IGxpbWl0KSB0aGlzLmhpc3Rvcnkuc2hpZnQoKTtcbiAgfVxuXG4gIHByaXZhdGUgdW5kbygpOiB2b2lkIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuaGlzdG9yeS5wb3AoKTtcbiAgICBpZiAoIXByZXZpb3VzKSByZXR1cm47XG4gICAgdGhpcy5mdXR1cmUucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy5kb2N1bWVudCA9IEpTT04ucGFyc2UocHJldmlvdXMpIGFzIE1pbmRNYXBEb2N1bWVudDtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWRvKCk6IHZvaWQge1xuICAgIGNvbnN0IG5leHQgPSB0aGlzLmZ1dHVyZS5wb3AoKTtcbiAgICBpZiAoIW5leHQpIHJldHVybjtcbiAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy50cmltSGlzdG9yeSgpO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBKU09OLnBhcnNlKG5leHQpIGFzIE1pbmRNYXBEb2N1bWVudDtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaXRUb1ZpZXcoKTogdm9pZCB7XG4gICAgY29uc3QgcmVjdCA9IHRoaXMudmlld3BvcnRFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWF4KDEsIHRoaXMubGF5b3V0Lm1heFggLSB0aGlzLmxheW91dC5taW5YICsgMTAwKTtcbiAgICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heCgxLCB0aGlzLmxheW91dC5tYXhZIC0gdGhpcy5sYXlvdXQubWluWSArIDEwMCk7XG4gICAgdGhpcy56b29tID0gdGhpcy5jbGFtcFpvb20oTWF0aC5taW4oKHJlY3Qud2lkdGggLSA0MCkgLyB3aWR0aCwgKHJlY3QuaGVpZ2h0IC0gNDApIC8gaGVpZ2h0LCAxLjI1KSk7XG4gICAgY29uc3QgY2VudGVyWCA9ICh0aGlzLmxheW91dC5taW5YICsgdGhpcy5sYXlvdXQubWF4WCkgLyAyO1xuICAgIGNvbnN0IGNlbnRlclkgPSAodGhpcy5sYXlvdXQubWluWSArIHRoaXMubGF5b3V0Lm1heFkpIC8gMjtcbiAgICB0aGlzLnBhblggPSAtY2VudGVyWCAqIHRoaXMuem9vbTtcbiAgICB0aGlzLnBhblkgPSAtY2VudGVyWSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICBwcml2YXRlIHNldFpvb20odmFsdWU6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuem9vbSA9IHRoaXMuY2xhbXBab29tKHZhbHVlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICBwcml2YXRlIGNsYW1wWm9vbSh2YWx1ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5taW4oMi41LCBNYXRoLm1heCgwLjIsIHZhbHVlKSk7XG4gIH1cblxuICBwcml2YXRlIG5hdmlnYXRlU2VsZWN0aW9uKGRpcmVjdGlvbjogXCJwYXJlbnRcIiB8IFwiY2hpbGRcIiB8IFwicHJldmlvdXNcIiB8IFwibmV4dFwiKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBsZXQgdGFyZ2V0OiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIGlmIChkaXJlY3Rpb24gPT09IFwicGFyZW50XCIpIHRhcmdldCA9IGZpbmRQYXJlbnQodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gXCJjaGlsZFwiKSB0YXJnZXQgPSBzZWxlY3RlZC5jaGlsZHJlblswXSA/PyBudWxsO1xuICAgIGlmIChkaXJlY3Rpb24gPT09IFwicHJldmlvdXNcIiB8fCBkaXJlY3Rpb24gPT09IFwibmV4dFwiKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBmaW5kUGFyZW50KHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IHBhcmVudC5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkKSA9PiBjaGlsZC5pZCA9PT0gc2VsZWN0ZWQuaWQpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSBkaXJlY3Rpb24gPT09IFwicHJldmlvdXNcIiA/IC0xIDogMTtcbiAgICAgICAgdGFyZ2V0ID0gcGFyZW50LmNoaWxkcmVuW2luZGV4ICsgb2Zmc2V0XSA/PyBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICB0aGlzLnNlbGVjdE5vZGUodGFyZ2V0LmlkKTtcbiAgICAgIHRoaXMuY2VudGVyTm9kZSh0YXJnZXQuaWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0Lm1hdGNoZXMoXCJpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCwgW2NvbnRlbnRlZGl0YWJsZT0ndHJ1ZSddXCIpKSByZXR1cm47XG4gICAgY29uc3QgbW9kID0gZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5O1xuICAgIGNvbnN0IGtleSA9IGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwic1wiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJmXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLm9wZW5TZWFyY2goKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwiZFwiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5kdXBsaWNhdGVTZWxlY3RlZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJjXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2b2lkIHRoaXMuY29weVNlbGVjdGVkQnJhbmNoKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcInhcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZvaWQgdGhpcy5jb3B5U2VsZWN0ZWRCcmFuY2goKS50aGVuKChjb3BpZWQpID0+IHsgaWYgKGNvcGllZCkgdGhpcy5kZWxldGVTZWxlY3RlZCgpOyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuY3ljbGVUYXNrKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcInpcIiAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnVuZG8oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKChtb2QgJiYga2V5ID09PSBcInlcIikgfHwgKG1vZCAmJiBldmVudC5zaGlmdEtleSAmJiBrZXkgPT09IFwielwiKSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMucmVkbygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZXZlbnQua2V5KSB7XG4gICAgICBjYXNlIFwiVGFiXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRW50ZXJcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5hZGRTaWJsaW5nKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkRlbGV0ZVwiOlxuICAgICAgY2FzZSBcIkJhY2tzcGFjZVwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmRlbGV0ZVNlbGVjdGVkKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkYyXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuZWRpdFNlbGVjdGVkKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy50b2dnbGVDb2xsYXBzZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0xlZnRcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcInBhcmVudFwiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dSaWdodFwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLm5hdmlnYXRlU2VsZWN0aW9uKFwiY2hpbGRcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkFycm93VXBcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcInByZXZpb3VzXCIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0Rvd25cIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcIm5leHRcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIitcIjpcbiAgICAgIGNhc2UgXCI9XCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gKiAxLjE1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiLVwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNldFpvb20odGhpcy56b29tIC8gMS4xNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIjBcIjpcbiAgICAgICAgaWYgKG1vZCkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5maXRUb1ZpZXcoKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgcGFyc2VGZW5jZWRDb2RlLFxuICBwYXJzZU1hcmtkb3duVGFibGUsXG4gIHRhYmxlVG9NYXJrZG93bixcbiAgdHlwZSBNaW5kTWFwQ29kZUJsb2NrLFxuICB0eXBlIE1pbmRNYXBUYWJsZSxcbiAgdHlwZSBUYWJsZUFsaWdubWVudFxufSBmcm9tIFwiLi9tb2RlbFwiO1xuXG5mdW5jdGlvbiBjbG9uZVRhYmxlKHRhYmxlOiBNaW5kTWFwVGFibGUgfCB1bmRlZmluZWQpOiBNaW5kTWFwVGFibGUge1xuICBpZiAoIXRhYmxlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlYWRlcnM6IFtcIlx1NTIxNyAxXCIsIFwiXHU1MjE3IDJcIl0sXG4gICAgICByb3dzOiBbW1wiXCIsIFwiXCJdLCBbXCJcIiwgXCJcIl1dLFxuICAgICAgYWxpZ25tZW50czogW1wibGVmdFwiLCBcImxlZnRcIl0sXG4gICAgICBzb3VyY2U6IFwibWFudWFsXCJcbiAgICB9O1xuICB9XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRhYmxlKSkgYXMgTWluZE1hcFRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgVGFibGVFZGl0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgdGFibGU6IE1pbmRNYXBUYWJsZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6ICh0YWJsZTogTWluZE1hcFRhYmxlKSA9PiB2b2lkO1xuICBwcml2YXRlIGdyaWRFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG1hcmtkb3duRWwhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCB0YWJsZTogTWluZE1hcFRhYmxlIHwgdW5kZWZpbmVkLCBzdWJtaXQ6ICh0YWJsZTogTWluZE1hcFRhYmxlKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnRhYmxlID0gY2xvbmVUYWJsZSh0YWJsZSk7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTg4NjhcdTY4M0NcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtdGFibGUtbW9kYWxcIik7XG5cbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlx1NTNFRlx1NEVFNVx1NzZGNFx1NjNBNVx1N0YxNlx1OEY5MVx1NTM1NVx1NTE0M1x1NjgzQ1x1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1N0M5OFx1OEQzNCBNYXJrZG93biBcdTg4NjhcdTY4M0NcdTU0MEVcdTcwQjlcdTUxRkJcdTIwMUNcdTg5RTNcdTY3OTAgTWFya2Rvd25cdTIwMURcdTMwMDJcIlxuICAgIH0pO1xuICAgIGRlc2NyaXB0aW9uLnNldEF0dHIoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XG5cbiAgICBjb25zdCB0b29sYmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YWJsZS10b29sYmFyXCIgfSk7XG4gICAgY29uc3QgYWRkUm93ID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTg4NENcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCByZW1vdmVSb3cgPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTIyMTIgXHU4ODRDXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgYWRkQ29sdW1uID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTUyMTdcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCByZW1vdmVDb2x1bW4gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTIyMTIgXHU1MjE3XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgdG9NYXJrZG93biA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NzUxRlx1NjIxMCBNYXJrZG93blwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuXG4gICAgdGhpcy5ncmlkRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXRhYmxlLWVkaXRvci1ncmlkXCIgfSk7XG4gICAgdGhpcy5yZW5kZXJHcmlkKCk7XG5cbiAgICBjb25zdCBtYXJrZG93bkxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiTWFya2Rvd24gXHU4ODY4XHU2ODNDXCIgfSk7XG4gICAgdGhpcy5tYXJrZG93bkVsID0gbWFya2Rvd25MYWJlbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJtbWMtdGFibGUtbWFya2Rvd25cIixcbiAgICAgIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwifCBcdTUyMTcgMSB8IFx1NTIxNyAyIHxcXG58IC0tLSB8IC0tLSB8XFxufCBcdTUxODVcdTVCQjkgfCBcdTUxODVcdTVCQjkgfFwiIH1cbiAgICB9KTtcbiAgICB0aGlzLm1hcmtkb3duRWwucm93cyA9IDg7XG4gICAgdGhpcy5tYXJrZG93bkVsLnZhbHVlID0gdGFibGVUb01hcmtkb3duKHRoaXMudGFibGUpO1xuICAgIGNvbnN0IHBhcnNlQnV0dG9uID0gbWFya2Rvd25MYWJlbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU4OUUzXHU2NzkwIE1hcmtkb3duXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG5cbiAgICBhZGRSb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIHRoaXMudGFibGUucm93cy5wdXNoKHRoaXMudGFibGUuaGVhZGVycy5tYXAoKCkgPT4gXCJcIikpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgcmVtb3ZlUm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5yb3dzLmxlbmd0aCkgdGhpcy50YWJsZS5yb3dzLnBvcCgpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgYWRkQ29sdW1uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCA+PSAxMikgeyBuZXcgTm90aWNlKFwiXHU2NzAwXHU1OTFBXHU2NTJGXHU2MzAxIDEyIFx1NTIxN1wiKTsgcmV0dXJuOyB9XG4gICAgICB0aGlzLnRhYmxlLmhlYWRlcnMucHVzaChgXHU1MjE3ICR7dGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCArIDF9YCk7XG4gICAgICB0aGlzLnRhYmxlLmFsaWdubWVudHMgPz89IFtdO1xuICAgICAgdGhpcy50YWJsZS5hbGlnbm1lbnRzLnB1c2goXCJsZWZ0XCIpO1xuICAgICAgdGhpcy50YWJsZS5yb3dzLmZvckVhY2goKHJvdykgPT4gcm93LnB1c2goXCJcIikpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgcmVtb3ZlQ29sdW1uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCA8PSAxKSByZXR1cm47XG4gICAgICB0aGlzLnRhYmxlLmhlYWRlcnMucG9wKCk7XG4gICAgICB0aGlzLnRhYmxlLmFsaWdubWVudHM/LnBvcCgpO1xuICAgICAgdGhpcy50YWJsZS5yb3dzLmZvckVhY2goKHJvdykgPT4gcm93LnBvcCgpKTtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgIH0pO1xuICAgIHRvTWFya2Rvd24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIHRoaXMubWFya2Rvd25FbC52YWx1ZSA9IHRhYmxlVG9NYXJrZG93bih0aGlzLnRhYmxlKTtcbiAgICB9KTtcbiAgICBwYXJzZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VNYXJrZG93blRhYmxlKHRoaXMubWFya2Rvd25FbC52YWx1ZSk7XG4gICAgICBpZiAoIXBhcnNlZCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiXHU2NzJBXHU4QkM2XHU1MjJCXHU1MjMwXHU2NzA5XHU2NTQ4XHU3Njg0IE1hcmtkb3duIFx1ODg2OFx1NjgzQ1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy50YWJsZSA9IHBhcnNlZDtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgICAgbmV3IE5vdGljZShcIk1hcmtkb3duIFx1ODg2OFx1NjgzQ1x1NURGMlx1ODlFM1x1Njc5MFwiKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjYW5jZWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTUzRDZcdTZEODhcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCBzYXZlID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU0RkREXHU1QjU4XHU4ODY4XHU2ODNDXCIsIHR5cGU6IFwiYnV0dG9uXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIHNhdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIGlmICghdGhpcy50YWJsZS5oZWFkZXJzLnNvbWUoKGhlYWRlcikgPT4gaGVhZGVyLnRyaW0oKSkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlx1ODFGM1x1NUMxMVx1OTcwMFx1ODk4MVx1NEUwMFx1NEUyQVx1ODg2OFx1NTkzNFwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy50YWJsZS5zb3VyY2UgPSB0aGlzLnRhYmxlLnNvdXJjZSA/PyBcIm1hbnVhbFwiO1xuICAgICAgdGhpcy5zdWJtaXQodGhpcy50YWJsZSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckdyaWQoKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkRWwuZW1wdHkoKTtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMuZ3JpZEVsLmNyZWF0ZUVsKFwidGFibGVcIik7XG4gICAgY29uc3QgaGVhZCA9IHRhYmxlLmNyZWF0ZUVsKFwidGhlYWRcIikuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICB0aGlzLnRhYmxlLmhlYWRlcnMuZm9yRWFjaCgoaGVhZGVyLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgdGggPSBoZWFkLmNyZWF0ZUVsKFwidGhcIik7XG4gICAgICBjb25zdCBpbnB1dCA9IHRoLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBcImRhdGEta2luZFwiOiBcImhlYWRlclwiLCBcImRhdGEtY29sdW1uXCI6IFN0cmluZyhpbmRleCkgfSB9KTtcbiAgICAgIGlucHV0LnZhbHVlID0gaGVhZGVyO1xuICAgICAgY29uc3QgYWxpZ24gPSB0aC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGF0dHI6IHsgXCJkYXRhLWtpbmRcIjogXCJhbGlnbm1lbnRcIiwgXCJkYXRhLWNvbHVtblwiOiBTdHJpbmcoaW5kZXgpLCBcImFyaWEtbGFiZWxcIjogYFx1N0IyQyAke2luZGV4ICsgMX0gXHU1MjE3XHU1QkY5XHU5RjUwXHU2NUI5XHU1RjBGYCB9IH0pO1xuICAgICAgKFtbJ2xlZnQnLCAnXHU1REU2J10sIFsnY2VudGVyJywgJ1x1NEUyRCddLCBbJ3JpZ2h0JywgJ1x1NTNGMyddXSBhcyBBcnJheTxbVGFibGVBbGlnbm1lbnQsIHN0cmluZ10+KS5mb3JFYWNoKChbdmFsdWUsIGxhYmVsXSkgPT4gYWxpZ24uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB2YWx1ZSB9IH0pKTtcbiAgICAgIGFsaWduLnZhbHVlID0gdGhpcy50YWJsZS5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgIH0pO1xuICAgIGNvbnN0IGJvZHkgPSB0YWJsZS5jcmVhdGVFbChcInRib2R5XCIpO1xuICAgIHRoaXMudGFibGUucm93cy5mb3JFYWNoKChyb3csIHJvd0luZGV4KSA9PiB7XG4gICAgICBjb25zdCB0ciA9IGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICAgIHRoaXMudGFibGUuaGVhZGVycy5mb3JFYWNoKChfLCBjb2x1bW5JbmRleCkgPT4ge1xuICAgICAgICBjb25zdCB0ZCA9IHRyLmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gdGQuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7IGF0dHI6IHsgXCJkYXRhLWtpbmRcIjogXCJjZWxsXCIsIFwiZGF0YS1yb3dcIjogU3RyaW5nKHJvd0luZGV4KSwgXCJkYXRhLWNvbHVtblwiOiBTdHJpbmcoY29sdW1uSW5kZXgpIH0gfSk7XG4gICAgICAgIGlucHV0LnJvd3MgPSAyO1xuICAgICAgICBpbnB1dC52YWx1ZSA9IHJvd1tjb2x1bW5JbmRleF0gPz8gXCJcIjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb2xsZWN0R3JpZCgpOiB2b2lkIHtcbiAgICBjb25zdCBoZWFkZXJzID0gQXJyYXkuZnJvbSh0aGlzLmdyaWRFbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dFtkYXRhLWtpbmQ9XCJoZWFkZXJcIl0nKSk7XG4gICAgaGVhZGVycy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgICAgY29uc3QgY29sdW1uID0gTnVtYmVyKGlucHV0LmRhdGFzZXQuY29sdW1uKTtcbiAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbHVtbikpIHRoaXMudGFibGUuaGVhZGVyc1tjb2x1bW5dID0gaW5wdXQudmFsdWUudHJpbSgpLnNsaWNlKDAsIDIwMDApO1xuICAgIH0pO1xuICAgIGNvbnN0IGFsaWdubWVudHMgPSBBcnJheS5mcm9tKHRoaXMuZ3JpZEVsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFNlbGVjdEVsZW1lbnQ+KCdzZWxlY3RbZGF0YS1raW5kPVwiYWxpZ25tZW50XCJdJykpO1xuICAgIHRoaXMudGFibGUuYWxpZ25tZW50cyA9IHRoaXMudGFibGUuaGVhZGVycy5tYXAoKCkgPT4gXCJsZWZ0XCIpO1xuICAgIGFsaWdubWVudHMuZm9yRWFjaCgoaW5wdXQpID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IE51bWJlcihpbnB1dC5kYXRhc2V0LmNvbHVtbik7XG4gICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihjb2x1bW4pKSB0aGlzLnRhYmxlLmFsaWdubWVudHMhW2NvbHVtbl0gPSBpbnB1dC52YWx1ZSA9PT0gXCJjZW50ZXJcIiB8fCBpbnB1dC52YWx1ZSA9PT0gXCJyaWdodFwiID8gaW5wdXQudmFsdWUgOiBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCBjZWxscyA9IEFycmF5LmZyb20odGhpcy5ncmlkRWwucXVlcnlTZWxlY3RvckFsbDxIVE1MVGV4dEFyZWFFbGVtZW50PigndGV4dGFyZWFbZGF0YS1raW5kPVwiY2VsbFwiXScpKTtcbiAgICBjZWxscy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gTnVtYmVyKGlucHV0LmRhdGFzZXQucm93KTtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IE51bWJlcihpbnB1dC5kYXRhc2V0LmNvbHVtbik7XG4gICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihyb3cpICYmIE51bWJlci5pc0ludGVnZXIoY29sdW1uKSAmJiB0aGlzLnRhYmxlLnJvd3Nbcm93XSkgdGhpcy50YWJsZS5yb3dzW3Jvd10hW2NvbHVtbl0gPSBpbnB1dC52YWx1ZS5zbGljZSgwLCAyMDAwKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29kZUVkaXRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBibG9jazogTWluZE1hcENvZGVCbG9jayB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6IChibG9jazogTWluZE1hcENvZGVCbG9jaykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgYmxvY2s6IE1pbmRNYXBDb2RlQmxvY2sgfCB1bmRlZmluZWQsIHN1Ym1pdDogKGJsb2NrOiBNaW5kTWFwQ29kZUJsb2NrKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmJsb2NrID0gYmxvY2s7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTRFRTNcdTc4MDFcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtY29kZS1tb2RhbFwiKTtcbiAgICBjb25zdCBsYW5ndWFnZUxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU0RUUzXHU3ODAxXHU4QkVEXHU4QTAwXCIgfSk7XG4gICAgY29uc3QgbGFuZ3VhZ2VJbnB1dCA9IGxhbmd1YWdlTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcImphdmFzY3JpcHRcdTMwMDFweXRob25cdTMwMDFjc3NcdTIwMjZcIiB9IH0pO1xuICAgIGxhbmd1YWdlSW5wdXQudmFsdWUgPSB0aGlzLmJsb2NrPy5sYW5ndWFnZSA/PyBcIlwiO1xuXG4gICAgY29uc3QgY29kZUxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU0RUUzXHU3ODAxXHU1MTg1XHU1QkI5XCIgfSk7XG4gICAgY29uc3QgY29kZUlucHV0ID0gY29kZUxhYmVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBjbHM6IFwibW1jLWNvZGUtdGV4dGFyZWFcIiwgYXR0cjogeyBzcGVsbGNoZWNrOiBcImZhbHNlXCIsIHBsYWNlaG9sZGVyOiBcIlx1NTNFRlx1NzZGNFx1NjNBNVx1N0M5OFx1OEQzNFx1NEVFM1x1NzgwMVx1RkYwQ1x1NjIxNlx1N0M5OFx1OEQzNCBgYGBcdThCRURcdThBMDAgLi4uIGBgYCBmZW5jZWQgY29kZSBibG9ja1wiIH0gfSk7XG4gICAgY29kZUlucHV0LnJvd3MgPSAxODtcbiAgICBjb2RlSW5wdXQudmFsdWUgPSB0aGlzLmJsb2NrPy5jb2RlID8/IFwiXCI7XG5cbiAgICBjb25zdCBkZXRlY3QgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU4QkM2XHU1MjJCIGZlbmNlZCBjb2RlXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgZGV0ZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUZlbmNlZENvZGUoY29kZUlucHV0LnZhbHVlKTtcbiAgICAgIGlmICghcGFyc2VkKSB7IG5ldyBOb3RpY2UoXCJcdTZDQTFcdTY3MDlcdThCQzZcdTUyMkJcdTUyMzBcdTVCOENcdTY1NzRcdTc2ODQgYGBgIGZlbmNlZCBjb2RlIGJsb2NrXCIpOyByZXR1cm47IH1cbiAgICAgIGxhbmd1YWdlSW5wdXQudmFsdWUgPSBwYXJzZWQubGFuZ3VhZ2UgPz8gXCJcIjtcbiAgICAgIGNvZGVJbnB1dC52YWx1ZSA9IHBhcnNlZC5jb2RlO1xuICAgICAgbmV3IE5vdGljZShcIlx1NEVFM1x1NzgwMVx1OEJFRFx1OEEwMFx1NTQ4Q1x1NTE4NVx1NUJCOVx1NURGMlx1OEJDNlx1NTIyQlwiKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjYW5jZWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTUzRDZcdTZEODhcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCBzYXZlID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU0RkREXHU1QjU4XHU0RUUzXHU3ODAxXCIsIHR5cGU6IFwiYnV0dG9uXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIHNhdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGxldCBsYW5ndWFnZSA9IGxhbmd1YWdlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgbGV0IGNvZGUgPSBjb2RlSW5wdXQudmFsdWU7XG4gICAgICBjb25zdCBmZW5jZWQgPSBwYXJzZUZlbmNlZENvZGUoY29kZSk7XG4gICAgICBpZiAoZmVuY2VkKSB7XG4gICAgICAgIGxhbmd1YWdlID0gZmVuY2VkLmxhbmd1YWdlID8/IGxhbmd1YWdlO1xuICAgICAgICBjb2RlID0gZmVuY2VkLmNvZGU7XG4gICAgICB9XG4gICAgICBpZiAoIWNvZGUudHJpbSgpKSB7IG5ldyBOb3RpY2UoXCJcdTRFRTNcdTc4MDFcdTUxODVcdTVCQjlcdTRFMERcdTgwRkRcdTRFM0FcdTdBN0FcIik7IHJldHVybjsgfVxuICAgICAgdGhpcy5zdWJtaXQoeyBsYW5ndWFnZTogbGFuZ3VhZ2UucmVwbGFjZSgvW15hLXowLTlfKyMuLV0vZ2ksIFwiXCIpLnNsaWNlKDAsIDQwKSB8fCB1bmRlZmluZWQsIGNvZGUgfSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBVU87OztBQ2lJQSxJQUFNLHFCQUFxQjtBQUNsQyxJQUFNLHFCQUFxQixDQUFDLFlBQVksVUFBVTtBQUUzQyxTQUFTLFFBQWdCO0FBQzlCLFFBQU0sU0FBUyxLQUFLLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEdBQUcsQ0FBQztBQUNwRCxTQUFPLEtBQUssS0FBSyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsSUFBSSxNQUFNO0FBQy9DO0FBRU8sU0FBUyxXQUFXLE9BQU8sc0JBQW9CO0FBQ3BELFNBQU8sRUFBRSxJQUFJLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxFQUFFO0FBQzNDO0FBRU8sU0FBUyxzQkFBc0IsUUFBUSxrQ0FBMEI7QUFDdEUsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1Q7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLE9BQU87QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLElBQUksTUFBTTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLFFBQ1IsRUFBRSxJQUFJLE1BQU0sR0FBRyxNQUFN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RSxRQUFRLFFBQVEsR0FBRyxFQUFFLEtBQUssS0FBSztBQUFBLEVBQ2hGO0FBQUEsRUFFUSxlQUFlLFNBQStDO0FBQ3BFLFVBQU0sYUFBYSxLQUFLLElBQUksTUFBTSxzQkFBc0IsUUFBUSxVQUFVO0FBQzFFLFdBQU8sc0JBQXNCLHlCQUFRLFdBQVcsV0FBVztBQUFBLEVBQzdEO0FBQUEsRUFFQSxNQUFjLHFCQUFxQixTQUFzQixTQUFzRDtBQWpyQmpIO0FBa3JCSSxVQUFNLFNBQVMsTUFBTSxLQUFLLFFBQVEsaUJBQThCLGlCQUFpQixDQUFDO0FBQ2xGLGVBQVcsU0FBUyxRQUFRO0FBQzFCLFVBQUksTUFBTSxRQUFRLGlCQUFpQixPQUFRO0FBQzNDLFlBQU0sYUFBWSxpQkFBTSxhQUFhLEtBQUssTUFBeEIsWUFBNkIsTUFBTSxRQUFRLFFBQTNDLFlBQWtEO0FBQ3BFLFlBQU0sWUFBVywyQkFBVSxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQXRCLG1CQUF5QixNQUFNLEtBQUssT0FBcEMsbUJBQXdDLFdBQXhDLFlBQWtEO0FBQ25FLFVBQUksQ0FBQyxTQUFTLFlBQVksRUFBRSxTQUFTLElBQUksaUJBQWlCLEVBQUUsRUFBRztBQUMvRCxZQUFNLE9BQU8sS0FBSyxJQUFJLGNBQWMscUJBQXFCLFVBQVUsUUFBUSxVQUFVO0FBQ3JGLFVBQUksRUFBRSxnQkFBZ0IsMkJBQVUsQ0FBQyxLQUFLLGNBQWMsSUFBSSxFQUFHO0FBQzNELFlBQU0sUUFBUSxlQUFlO0FBQzdCLFVBQUk7QUFDRixjQUFNLFNBQVMsTUFBTSxLQUFLLElBQUksTUFBTSxXQUFXLElBQUk7QUFDbkQsY0FBTUEsWUFBVyxjQUFjLFFBQVEsS0FBSyxRQUFRO0FBQ3BELDRCQUFvQixPQUFPQSxXQUFVLEVBQUUsS0FBSyxLQUFLLEtBQUssTUFBTSxXQUFXLEtBQUssU0FBUyxnQkFBZ0IsbUJBQW1CLHFCQUFxQixLQUFLLFFBQVEsRUFBRSxDQUFDO0FBQUEsTUFDL0osU0FBUyxPQUFPO0FBQ2QsZ0JBQVEsTUFBTSxzQ0FBc0MsS0FBSztBQUN6RCxjQUFNLE1BQU07QUFDWixjQUFNLFVBQVUsRUFBRSxLQUFLLG1CQUFtQixNQUFNLCtEQUFhLENBQUM7QUFBQSxNQUNoRTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJ0ZXh0IiwgIl9hIiwgIl9iIiwgIl9hIiwgIl9iIiwgIl9jIiwgIl9kIiwgImJhY2tncm91bmQiLCAiZG9jdW1lbnQiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiX2EiLCAiX2IiLCAiZG9jdW1lbnQiLCAiX2MiLCAic2VsZWN0ZWQiLCAiZG9jdW1lbnQiLCAiX2EiLCAiX2IiLCAiX2MiLCAiZG9jdW1lbnQiXQp9Cg==
