/* MindMap Canvas - MIT License */
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
    version: 7,
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
    const source = typeof candidate.source === "string" ? candidate.source.trim().slice(0, 2e3) : "";
    if (!source) return null;
    const alt = typeof candidate.alt === "string" && candidate.alt.trim() ? candidate.alt.trim().slice(0, 500) : void 0;
    return { id, type: "image", source, alt };
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
    version: 7,
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
  imageHostEndpoint: "",
  imageHostMethod: "POST",
  imageHostBodyMode: "multipart",
  imageHostFieldName: "file",
  imageHostHeaders: "",
  imageHostResponsePath: "data.url"
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
    new import_obsidian.Setting(containerEl).setName("\u56FE\u5E8A\u4E0A\u4F20\u5730\u5740").setDesc("\u53EF\u9009\u3002\u586B\u5199\u652F\u6301 HTTP \u4E0A\u4F20\u7684 API \u5730\u5740\uFF1B\u672A\u914D\u7F6E\u65F6\uFF0C\u2018\u4E0A\u4F20\u5230\u56FE\u5E8A\u2019\u6309\u94AE\u4F1A\u63D0\u793A\u5148\u914D\u7F6E\u3002").addText((text) => text.setPlaceholder("https://example.com/api/upload").setValue(this.plugin.settings.imageHostEndpoint).onChange(async (value) => {
      this.plugin.settings.imageHostEndpoint = value.trim();
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u4E0A\u4F20\u8BF7\u6C42\u65B9\u6CD5").setDesc("\u7EDD\u5927\u591A\u6570\u56FE\u5E8A\u4F7F\u7528 POST\uFF0C\u5C11\u6570\u5BF9\u8C61\u5B58\u50A8\u4E0A\u4F20\u63A5\u53E3\u4F7F\u7528 PUT\u3002").addDropdown((dropdown) => dropdown.addOption("POST", "POST").addOption("PUT", "PUT").setValue(this.plugin.settings.imageHostMethod).onChange(async (value) => {
      this.plugin.settings.imageHostMethod = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u4E0A\u4F20\u8BF7\u6C42\u683C\u5F0F").setDesc("\u5927\u591A\u6570\u56FE\u5E8A\u4F7F\u7528 multipart/form-data\uFF1B\u5C11\u6570\u63A5\u53E3\u76F4\u63A5\u63A5\u6536\u56FE\u7247\u4E8C\u8FDB\u5236\u3002").addDropdown((dropdown) => dropdown.addOption("multipart", "multipart/form-data").addOption("raw", "\u539F\u59CB\u4E8C\u8FDB\u5236").setValue(this.plugin.settings.imageHostBodyMode).onChange(async (value) => {
      this.plugin.settings.imageHostBodyMode = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u6587\u4EF6\u5B57\u6BB5\u540D").setDesc("multipart \u6A21\u5F0F\u4E0B\u56FE\u7247\u5B57\u6BB5\u7684\u540D\u79F0\uFF0C\u5E38\u89C1\u503C\u4E3A file\u3001image \u6216 source\u3002").addText((text) => text.setPlaceholder("file").setValue(this.plugin.settings.imageHostFieldName).onChange(async (value) => {
      this.plugin.settings.imageHostFieldName = value.trim() || "file";
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u81EA\u5B9A\u4E49\u8BF7\u6C42\u5934\uFF08JSON\uFF09").setDesc('\u4F8B\u5982 {"Authorization":"Bearer token"}\u3002\u654F\u611F\u4EE4\u724C\u4F1A\u4FDD\u5B58\u5728\u63D2\u4EF6 data.json \u4E2D\uFF0C\u8BF7\u53EA\u5728\u53EF\u4FE1\u4ED3\u5E93\u4E2D\u4F7F\u7528\u3002').addTextArea((text) => text.setPlaceholder('{"Authorization":"Bearer ..."}').setValue(this.plugin.settings.imageHostHeaders).onChange(async (value) => {
      this.plugin.settings.imageHostHeaders = value.trim();
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u54CD\u5E94\u56FE\u7247\u5730\u5740\u5B57\u6BB5").setDesc("\u7528\u70B9\u53F7\u8BFB\u53D6 JSON \u8FD4\u56DE\u503C\uFF0C\u4F8B\u5982 data.url\u3001result.image\uFF1B\u7559\u7A7A\u65F6\u81EA\u52A8\u5C1D\u8BD5\u5E38\u89C1\u5B57\u6BB5\u3002").addText((text) => text.setPlaceholder("data.url").setValue(this.plugin.settings.imageHostResponsePath).onChange(async (value) => {
      this.plugin.settings.imageHostResponsePath = value.trim();
      await this.plugin.saveSettings();
    }));
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
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", () => {
        var _a2;
        const file = (_a2 = input.files) == null ? void 0 : _a2[0];
        if (!file) return;
        const operation = mode === "remote" ? this.callbacks.onUploadImage(file, file.name) : this.callbacks.onSavePastedImage(file, file.name);
        void operation.then((path) => {
          block.source = path;
          if (!block.alt) block.alt = file.name.replace(/\.[^.]+$/, "");
          refresh();
          scheduleAutoSave();
        }).catch((error) => {
          console.error("MindMap Studio image operation failed", error);
          new import_obsidian3.Notice(mode === "remote" ? "\u4E0A\u4F20\u56FE\u5E8A\u5931\u8D25" : "\u4FDD\u5B58\u56FE\u7247\u5931\u8D25");
        });
      });
      input.click();
    };
    const renderBlocks = () => {
      blocksEl.empty();
      workingBlocks.forEach((block, index) => {
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
            var _a2;
            preview.empty();
            const resolved = this.callbacks.resolveImage(block.source);
            if (resolved) {
              const img = preview.createEl("img", { attr: { src: resolved, alt: block.alt || "\u56FE\u7247" } });
              img.addEventListener("click", () => new ImagePreviewModal(this.app, resolved, block.alt || "\u56FE\u7247").open());
            } else preview.createDiv({ cls: "mmc-image-placeholder", text: block.source ? "\u65E0\u6CD5\u52A0\u8F7D\u56FE\u7247" : "\u5C1A\u672A\u9009\u62E9\u56FE\u7247" });
            source.value = block.source;
            alt.value = (_a2 = block.alt) != null ? _a2 : "";
          };
          const sourceLabel = body.createEl("label", { text: "\u56FE\u7247\u8DEF\u5F84\u6216\u7F51\u5740" });
          const source = sourceLabel.createEl("input", { type: "text", attr: { placeholder: "\u4ED3\u5E93\u8DEF\u5F84\u3001[[\u56FE\u7247]] \u6216 https://..." } });
          const altLabel = body.createEl("label", { text: "\u56FE\u7247\u8BF4\u660E\uFF08\u53EF\u9009\uFF09" });
          const alt = altLabel.createEl("input", { type: "text", attr: { placeholder: "\u56FE\u7247\u8BF4\u660E" } });
          source.addEventListener("input", () => {
            block.source = source.value.trim();
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
          const remote = actions.createEl("button", { text: "\u4E0A\u4F20\u5230\u56FE\u5E8A", attr: { type: "button" } });
          remote.addEventListener("click", () => chooseImage(block, "remote", refresh));
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
      onUploadImage: this.callbacks.onUploadImage
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
        const path = await this.callbacks.onSavePastedImage(blob, `mindmap-image.${extension}`);
        this.mutate(() => {
          const blocks = nodeContentBlocks(selected2);
          blocks.push({ id: newId(), type: "image", source: path });
          selected2.content = blocks;
          syncNodeLegacyFields(selected2);
        });
        new import_obsidian3.Notice(`\u56FE\u7247\u5DF2\u4FDD\u5B58\uFF1A${path}`);
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
    this.branchClipboard = cloneDocument({ version: 7, title: nodePlainText(selected) || "\u56FE\u7247\u8282\u70B9", layout: "right", theme: "auto", root: selected }).root;
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
        onUploadImage: async (blob, suggestedName) => this.plugin.uploadImageToHost(blob, suggestedName),
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
    if ((loaded == null ? void 0 : loaded.backgroundPattern) === void 0 && (loaded == null ? void 0 : loaded.showGrid) === false) this.settings.backgroundPattern = "none";
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
  async uploadImageToHost(blob, suggestedName) {
    const endpoint = this.settings.imageHostEndpoint.trim();
    if (!endpoint) {
      new import_obsidian5.Notice("\u8BF7\u5148\u5728 MindMap Studio \u8BBE\u7F6E\u4E2D\u914D\u7F6E\u56FE\u5E8A\u4E0A\u4F20\u5730\u5740");
      throw new Error("Image host endpoint is not configured");
    }
    let headers = {};
    if (this.settings.imageHostHeaders.trim()) {
      try {
        const parsed = JSON.parse(this.settings.imageHostHeaders);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("headers must be an object");
        headers = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
      } catch (error) {
        new import_obsidian5.Notice("\u56FE\u5E8A\u8BF7\u6C42\u5934 JSON \u683C\u5F0F\u9519\u8BEF");
        throw error;
      }
    }
    const filename = this.sanitizeFilename(suggestedName || "mindmap-image.png");
    const mime = blob.type || "application/octet-stream";
    let body;
    let contentType = mime;
    if (this.settings.imageHostBodyMode === "multipart") {
      const boundary = `----MindMapStudio${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      const encoder = new TextEncoder();
      const head = encoder.encode(`--${boundary}\r
Content-Disposition: form-data; name="${(this.settings.imageHostFieldName || "file").replaceAll('"', "")}"; filename="${filename.replaceAll('"', "")}"\r
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
      method: (this.settings.imageHostMethod || "POST").toUpperCase(),
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
    const configured = this.settings.imageHostResponsePath.trim();
    const candidates = [configured, "data.url", "url", "result.url", "result.image", "image.url", "src"].filter(Boolean);
    for (const path of candidates) {
      const value = getPath(payload, path);
      if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
    }
    if (typeof payload === "string") {
      const match = payload.match(/https?:\/\/[^\s"'<>]+/i);
      if (match == null ? void 0 : match[0]) return match[0];
    }
    throw new Error("\u56FE\u5E8A\u8FD4\u56DE\u7ED3\u679C\u4E2D\u6CA1\u6709\u627E\u5230\u56FE\u7247\u7F51\u5740");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL21vZGVsLnRzIiwgInNyYy9zZXR0aW5ncy50cyIsICJzcmMvbGF5b3V0LnRzIiwgInNyYy9zdGF0aWMtcmVuZGVyLnRzIiwgInNyYy92aWV3LnRzIiwgInNyYy9lZGl0b3IudHMiLCAic3JjL2NvbnRlbnQtbW9kYWxzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xuICBNZW51LFxuICBOb3RpY2UsXG4gIFBsdWdpbixcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG4gIHJlcXVlc3RVcmwsXG4gIHR5cGUgTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCxcbiAgdHlwZSBXb3Jrc3BhY2VMZWFmXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgY3JlYXRlRGVmYXVsdERvY3VtZW50LFxuICBtYXJrZG93blRvRG9jdW1lbnQsXG4gIG5vZGVQbGFpblRleHQsXG4gIHN5bmNOb2RlTGVnYWN5RmllbGRzLFxuICBwYXJzZURvY3VtZW50LFxuICBzZXJpYWxpemVEb2N1bWVudCxcbiAgdHlwZSBNaW5kTWFwRG9jdW1lbnQsXG4gIHR5cGUgTWluZE1hcE5vZGUsXG4gIHR5cGUgTWluZE1hcFN1Ym1hcFxufSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9TRVRUSU5HUyxcbiAgTWluZE1hcFN0dWRpb1NldHRpbmdUYWIsXG4gIHNldHRpbmdzVG9BcHBlYXJhbmNlLFxuICB0eXBlIE1pbmRNYXBTdHVkaW9TZXR0aW5nc1xufSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgcmVuZGVyU3RhdGljTWluZE1hcCwgcmVuZGVyU3RhdGljU291cmNlIH0gZnJvbSBcIi4vc3RhdGljLXJlbmRlclwiO1xuaW1wb3J0IHsgTWluZE1hcFN0dWRpb1ZpZXcsIFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyB9IGZyb20gXCIuL3ZpZXdcIjtcblxuZXhwb3J0IGNvbnN0IE1JTkRNQVBfRVhURU5TSU9OID0gXCJtaW5kbWFwXCI7XG5jb25zdCBMRUdBQ1lfU1VGRklYID0gXCIuc21tLm1kXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1pbmRNYXBTdHVkaW9QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogTWluZE1hcFN0dWRpb1NldHRpbmdzID0gREVGQVVMVF9TRVRUSU5HUztcbiAgcHJpdmF0ZSBsZWdhY3lNaWdyYXRpb25QYXRoOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTywgKGxlYWYpID0+IG5ldyBNaW5kTWFwU3R1ZGlvVmlldyhsZWFmLCB0aGlzKSk7XG4gICAgLy8gQSBkZWRpY2F0ZWQgZXh0ZW5zaW9uIGlzIHRoZSBrZXkgdG8gcmVsaWFibGUgcmVvcGVuaW5nOiBPYnNpZGlhbiByb3V0ZXMgZXZlcnlcbiAgICAvLyAubWluZG1hcCBmaWxlIGRpcmVjdGx5IHRvIHRoZSBlZGl0YWJsZSBUZXh0RmlsZVZpZXcgaW5zdGVhZCBvZiBNYXJrZG93biB2aWV3LlxuICAgIHRoaXMucmVnaXN0ZXJFeHRlbnNpb25zKFtNSU5ETUFQX0VYVEVOU0lPTl0sIFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyk7XG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBNaW5kTWFwU3R1ZGlvU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiYnJhaW4tY2lyY3VpdFwiLCBcIlx1NjVCMFx1NUVGQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiLCAoKSA9PiB2b2lkIHRoaXMuY3JlYXRlTWluZE1hcCgpKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctbWluZC1tYXBcIixcbiAgICAgIG5hbWU6IFwiXHU2NUIwXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU1pbmRNYXAoKVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJuZXctbWluZC1tYXAtYW5kLWVtYmVkXCIsXG4gICAgICBuYW1lOiBcIlx1NjVCMFx1NUVGQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVx1NUU3Nlx1NjNEMlx1NTE2NVx1NUY1M1x1NTI0RFx1N0IxNFx1OEJCMFwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgdGhpcy5jcmVhdGVNaW5kTWFwKHsgaW5zZXJ0SW50b0N1cnJlbnQ6IHRydWUgfSlcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiY29udmVydC1jdXJyZW50LW1hcmtkb3duXCIsXG4gICAgICBuYW1lOiBcIlx1NUMwNlx1NUY1M1x1NTI0RCBNYXJrZG93biBcdThGNkNcdTYzNjJcdTRFM0FcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIixcbiAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gQm9vbGVhbihmaWxlICYmIGZpbGUuZXh0ZW5zaW9uID09PSBcIm1kXCIgJiYgIXRoaXMuaXNMZWdhY3lNaW5kTWFwRmlsZShmaWxlKSk7XG4gICAgICAgIGlmICghY2hlY2tpbmcgJiYgYXZhaWxhYmxlICYmIGZpbGUpIHZvaWQgdGhpcy5jb252ZXJ0TWFya2Rvd25GaWxlKGZpbGUpO1xuICAgICAgICByZXR1cm4gYXZhaWxhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJtaWdyYXRlLWxlZ2FjeS1taW5kLW1hcFwiLFxuICAgICAgbmFtZTogXCJcdTVDMDZcdTVGNTNcdTUyNERcdTY1RTdcdTcyNDhcdTgxMTFcdTU2RkVcdThGNkNcdTYzNjJcdTRFM0EgLm1pbmRtYXBcIixcbiAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gQm9vbGVhbihmaWxlICYmIHRoaXMuaXNMZWdhY3lNaW5kTWFwRmlsZShmaWxlKSk7XG4gICAgICAgIGlmICghY2hlY2tpbmcgJiYgYXZhaWxhYmxlICYmIGZpbGUpIHZvaWQgdGhpcy5taWdyYXRlTGVnYWN5RmlsZShmaWxlLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIGF2YWlsYWJsZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1jdXJyZW50LWFzLW1pbmQtbWFwXCIsXG4gICAgICBuYW1lOiBcIlx1NEVFNVx1NTNFRlx1N0YxNlx1OEY5MVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVx1ODlDNlx1NTZGRVx1OTFDRFx1NjVCMFx1NjI1M1x1NUYwMFwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBCb29sZWFuKGZpbGUgJiYgdGhpcy5pc01pbmRNYXBGaWxlKGZpbGUpKTtcbiAgICAgICAgaWYgKCFjaGVja2luZyAmJiBhdmFpbGFibGUgJiYgZmlsZSkgdm9pZCB0aGlzLm9wZW5Bc01pbmRNYXAoZmlsZSwgdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWYgPz8gdW5kZWZpbmVkKTtcbiAgICAgICAgcmV0dXJuIGF2YWlsYWJsZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW1lbnVcIiwgKG1lbnU6IE1lbnUsIGZpbGUpID0+IHtcbiAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZvbGRlcikge1xuICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW1cbiAgICAgICAgICAuc2V0VGl0bGUoXCJcdTY1QjBcdTVFRkFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIilcbiAgICAgICAgICAuc2V0SWNvbihcImJyYWluLWNpcmN1aXRcIilcbiAgICAgICAgICAub25DbGljaygoKSA9PiB2b2lkIHRoaXMuY3JlYXRlTWluZE1hcCh7IGZvbGRlcjogZmlsZS5wYXRoIH0pKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybjtcblxuICAgICAgaWYgKHRoaXMuaXNNaW5kTWFwRmlsZShmaWxlKSkge1xuICAgICAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW1cbiAgICAgICAgICAuc2V0VGl0bGUoXCJcdTRFRTVcdTUzRUZcdTdGMTZcdThGOTFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcdTYyNTNcdTVGMDBcIilcbiAgICAgICAgICAuc2V0SWNvbihcImJyYWluLWNpcmN1aXRcIilcbiAgICAgICAgICAub25DbGljaygoKSA9PiB2b2lkIHRoaXMub3BlbkFzTWluZE1hcChmaWxlKSkpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZSkpIHtcbiAgICAgICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtXG4gICAgICAgICAgLnNldFRpdGxlKFwiXHU4RjZDXHU2MzYyXHU0RTNBXHU2NUIwXHU3Njg0IC5taW5kbWFwIFx1NjU4N1x1NEVGNlwiKVxuICAgICAgICAgIC5zZXRJY29uKFwicmVwbGFjZVwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5taWdyYXRlTGVnYWN5RmlsZShmaWxlLCB0cnVlKSkpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIC8vIEV4aXN0aW5nIHVzZXJzIG1heSBzdGlsbCBoYXZlIHRoZSBvbGQgTWFya2Rvd24tYmFja2VkIGZpbGVzLiBXaGVuIGVuYWJsZWQsXG4gICAgLy8gb3BlbmluZyBvbmUgY3JlYXRlcy9vcGVucyBhIHNhZmUgLm1pbmRtYXAgY29weSBhbmQgbGVhdmVzIHRoZSBvcmlnaW5hbCBpbnRhY3QuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtb3BlblwiLCAoZmlsZSkgPT4ge1xuICAgICAgaWYgKCFmaWxlIHx8ICF0aGlzLnNldHRpbmdzLnJlZGlyZWN0TGVnYWN5RmlsZXMgfHwgIXRoaXMuaXNMZWdhY3lNaW5kTWFwRmlsZShmaWxlKSkgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMubGVnYWN5TWlncmF0aW9uUGF0aCA9PT0gZmlsZS5wYXRoKSByZXR1cm47XG4gICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB2b2lkIHRoaXMubWlncmF0ZUxlZ2FjeUZpbGUoZmlsZSwgdHJ1ZSksIDApO1xuICAgIH0pKTtcblxuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93bkNvZGVCbG9ja1Byb2Nlc3NvcihcIm1pbmRtYXBcIiwgKHNvdXJjZSwgZWwsIGN0eCkgPT4ge1xuICAgICAgcmVuZGVyU3RhdGljU291cmNlKGVsLCBzb3VyY2UsIHRoaXMuZ2V0U291cmNlVGl0bGUoY3R4KSwgc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykpO1xuICAgIH0pO1xuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93bkNvZGVCbG9ja1Byb2Nlc3NvcihcIm1pbmRtYXAtanNvblwiLCAoc291cmNlLCBlbCwgY3R4KSA9PiB7XG4gICAgICByZW5kZXJTdGF0aWNTb3VyY2UoZWwsIHNvdXJjZSwgdGhpcy5nZXRTb3VyY2VUaXRsZShjdHgpLCBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSk7XG4gICAgfSk7XG4gICAgLy8gUmVhZC1vbmx5IGNvbXBhdGliaWxpdHkgZm9yIG5vdGVzIHRoYXQgYWxyZWFkeSBjb250YWluIG9sZCBmZW5jZWQgYmxvY2tzLlxuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93bkNvZGVCbG9ja1Byb2Nlc3NvcihcInNtbVwiLCAoc291cmNlLCBlbCwgY3R4KSA9PiB7XG4gICAgICByZW5kZXJTdGF0aWNTb3VyY2UoZWwsIHNvdXJjZSwgdGhpcy5nZXRTb3VyY2VUaXRsZShjdHgpLCBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSk7XG4gICAgfSk7XG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFwic21tLWpzb25cIiwgKHNvdXJjZSwgZWwsIGN0eCkgPT4ge1xuICAgICAgcmVuZGVyU3RhdGljU291cmNlKGVsLCBzb3VyY2UsIHRoaXMuZ2V0U291cmNlVGl0bGUoY3R4KSwgc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykpO1xuICAgIH0pO1xuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93blBvc3RQcm9jZXNzb3IoKGVsZW1lbnQsIGNvbnRleHQpID0+IHZvaWQgdGhpcy5wcm9jZXNzTWluZE1hcEVtYmVkcyhlbGVtZW50LCBjb250ZXh0KSk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKSBhcyBQYXJ0aWFsPE1pbmRNYXBTdHVkaW9TZXR0aW5ncz4gfCBudWxsO1xuICAgIC8vIE9uZS10aW1lIG1pZ3JhdGlvbiBhZnRlciB0aGUgcHVibGljIHJlbmFtZSBmcm9tIG1pbmRtYXAtY2FudmFzIHRvIG1pbmRtYXAtc3R1ZGlvLlxuICAgIGlmICghbG9hZGVkKSB7XG4gICAgICBjb25zdCBvbGREYXRhUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5hcHAudmF1bHQuY29uZmlnRGlyfS9wbHVnaW5zL21pbmRtYXAtY2FudmFzL2RhdGEuanNvbmApO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZXhpc3RzKG9sZERhdGFQYXRoKSkge1xuICAgICAgICAgIGxvYWRlZCA9IEpTT04ucGFyc2UoYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKG9sZERhdGFQYXRoKSkgYXMgUGFydGlhbDxNaW5kTWFwU3R1ZGlvU2V0dGluZ3M+O1xuICAgICAgICAgIGlmIChsb2FkZWQpIGF3YWl0IHRoaXMuc2F2ZURhdGEobG9hZGVkKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiTWluZE1hcCBTdHVkaW8gY291bGQgbm90IG1pZ3JhdGUgdGhlIG9sZCBzZXR0aW5ncyBmaWxlXCIsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGxvYWRlZCk7XG4gICAgaWYgKGxvYWRlZD8uYmFja2dyb3VuZFBhdHRlcm4gPT09IHVuZGVmaW5lZCAmJiBsb2FkZWQ/LnNob3dHcmlkID09PSBmYWxzZSkgdGhpcy5zZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybiA9IFwibm9uZVwiO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cblxuICByZWZyZXNoT3BlblZpZXdzKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTykpIHtcbiAgICAgIGlmIChsZWFmLnZpZXcgaW5zdGFuY2VvZiBNaW5kTWFwU3R1ZGlvVmlldykgbGVhZi52aWV3LnJlZnJlc2hBcHBlYXJhbmNlKCk7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlQ29uZmlndXJlZERvY3VtZW50KHRpdGxlOiBzdHJpbmcpOiBNaW5kTWFwRG9jdW1lbnQge1xuICAgIGNvbnN0IGRvY3VtZW50ID0gY3JlYXRlRGVmYXVsdERvY3VtZW50KHRpdGxlKTtcbiAgICBkb2N1bWVudC5sYXlvdXQgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQ7XG4gICAgZG9jdW1lbnQudGhlbWUgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRUaGVtZTtcbiAgICBkb2N1bWVudC5hcHBlYXJhbmNlID0gc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncyk7XG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbiAgYXN5bmMgZ2V0QXZhaWxhYmxlUGF0aChwcmVmZXJyZWRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKHByZWZlcnJlZFBhdGgpO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpKSByZXR1cm4gbm9ybWFsaXplZDtcbiAgICBjb25zdCBkb3QgPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBiYXNlID0gZG90ID4gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIikgPyBub3JtYWxpemVkLnNsaWNlKDAsIGRvdCkgOiBub3JtYWxpemVkO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGRvdCA+IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpID8gbm9ybWFsaXplZC5zbGljZShkb3QpIDogXCJcIjtcbiAgICBsZXQgaW5kZXggPSAyO1xuICAgIHdoaWxlICh0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYCR7YmFzZX0gJHtpbmRleH0ke2V4dGVuc2lvbn1gKSkgaW5kZXggKz0gMTtcbiAgICByZXR1cm4gYCR7YmFzZX0gJHtpbmRleH0ke2V4dGVuc2lvbn1gO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlTWluZE1hcChvcHRpb25zOiB7XG4gICAgaW5zZXJ0SW50b0N1cnJlbnQ/OiBib29sZWFuO1xuICAgIGZvbGRlcj86IHN0cmluZztcbiAgICBkb2N1bWVudD86IE1pbmRNYXBEb2N1bWVudDtcbiAgICB0aXRsZT86IHN0cmluZztcbiAgfSA9IHt9KTogUHJvbWlzZTxURmlsZT4ge1xuICAgIGNvbnN0IGFjdGl2ZUJlZm9yZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgY29uc3QgZm9sZGVyID0gYXdhaXQgdGhpcy5yZXNvbHZlRm9sZGVyKG9wdGlvbnMuZm9sZGVyLCBhY3RpdmVCZWZvcmUpO1xuICAgIGNvbnN0IHRpdGxlID0gb3B0aW9ucy50aXRsZSA/PyB0aGlzLmJ1aWxkTmV3VGl0bGUoKTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IHRoaXMuc2FuaXRpemVGaWxlbmFtZSh0aXRsZSk7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMuZ2V0QXZhaWxhYmxlUGF0aChub3JtYWxpemVQYXRoKGAke2ZvbGRlciA/IGAke2ZvbGRlcn0vYCA6IFwiXCJ9JHtmaWxlbmFtZX0uJHtNSU5ETUFQX0VYVEVOU0lPTn1gKSk7XG4gICAgY29uc3QgZG9jdW1lbnQgPSBvcHRpb25zLmRvY3VtZW50ID8/IHRoaXMuY3JlYXRlQ29uZmlndXJlZERvY3VtZW50KHRpdGxlKTtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50KSk7XG5cbiAgICBpZiAob3B0aW9ucy5pbnNlcnRJbnRvQ3VycmVudCAmJiBhY3RpdmVCZWZvcmUgJiYgYWN0aXZlQmVmb3JlLmV4dGVuc2lvbiA9PT0gXCJtZFwiICYmIGFjdGl2ZUJlZm9yZS5wYXRoICE9PSBmaWxlLnBhdGgpIHtcbiAgICAgIGNvbnN0IGVtYmVkID0gYFxcblxcbiFbWyR7ZmlsZS5wYXRofV1dXFxuYDtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGFjdGl2ZUJlZm9yZSk7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoYWN0aXZlQmVmb3JlLCBgJHtjdXJyZW50LnRyaW1FbmQoKX0ke2VtYmVkfWApO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLm9wZW5Bc01pbmRNYXAoZmlsZSk7XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBhc3luYyBvcGVuQXNNaW5kTWFwKGZpbGU6IFRGaWxlLCBwcmVmZXJyZWRMZWFmPzogV29ya3NwYWNlTGVhZiwgZm9jdXNOb2RlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsZWFmID0gcHJlZmVycmVkTGVhZiA/PyB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgdHlwZTogVklFV19UWVBFX01JTkRNQVBfU1RVRElPLFxuICAgICAgc3RhdGU6IHsgZmlsZTogZmlsZS5wYXRoIH0sXG4gICAgICBhY3RpdmU6IHRydWVcbiAgICB9KTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgICBpZiAoZm9jdXNOb2RlSWQgJiYgbGVhZi52aWV3IGluc3RhbmNlb2YgTWluZE1hcFN0dWRpb1ZpZXcpIHtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IGxlYWYudmlldyBpbnN0YW5jZW9mIE1pbmRNYXBTdHVkaW9WaWV3ICYmIGxlYWYudmlldy5mb2N1c05vZGUoZm9jdXNOb2RlSWQpLCAzMCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgc2F2ZVBhc3RlZEltYWdlKGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZywgc291cmNlRmlsZTogVEZpbGUgfCBudWxsKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBcdTU2RkVcdTcyNDdcdThENDRcdTZFOTBcdTc2RUVcdTVGNTVcdTYzMDlcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTYyNDBcdTU3MjhcdTc2RUVcdTVGNTVcdTg5RTNcdTY3OTBcdUZGMENcdTgwMENcdTRFMERcdTY2MkZcdTYzMDlcdTRFRDNcdTVFOTNcdTY4MzlcdTc2RUVcdTVGNTVcdTg5RTNcdTY3OTBcdTMwMDJcbiAgICAvLyBcdTRGOEJcdTU5ODIgUHJvamVjdHMvUGxhbi5taW5kbWFwICsgTWluZE1hcCBBc3NldHMgPT5cbiAgICAvLyBQcm9qZWN0cy9NaW5kTWFwIEFzc2V0cy9QbGFuLTIwMjYwNzIwLTEyMzQ1Ni5wbmdcbiAgICBjb25zdCBzb3VyY2VGb2xkZXIgPSBzb3VyY2VGaWxlPy5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBjb25maWd1cmVkRm9sZGVyID0gbm9ybWFsaXplUGF0aCgodGhpcy5zZXR0aW5ncy5hc3NldEZvbGRlciB8fCBcIk1pbmRNYXAgQXNzZXRzXCIpLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpKTtcbiAgICBjb25zdCBmb2xkZXIgPSBub3JtYWxpemVQYXRoKFtzb3VyY2VGb2xkZXIsIGNvbmZpZ3VyZWRGb2xkZXJdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiL1wiKSk7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJQYXRoKGZvbGRlcik7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCB0d28gPSAodmFsdWU6IG51bWJlcik6IHN0cmluZyA9PiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBjb25zdCBzdGFtcCA9IGAke25vdy5nZXRGdWxsWWVhcigpfSR7dHdvKG5vdy5nZXRNb250aCgpICsgMSl9JHt0d28obm93LmdldERhdGUoKSl9LSR7dHdvKG5vdy5nZXRIb3VycygpKX0ke3R3byhub3cuZ2V0TWludXRlcygpKX0ke3R3byhub3cuZ2V0U2Vjb25kcygpKX1gO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IHN1Z2dlc3RlZE5hbWUuc3BsaXQoXCIuXCIpLmF0KC0xKT8ucmVwbGFjZSgvW15hLXowLTldL2dpLCBcIlwiKS50b0xvd2VyQ2FzZSgpIHx8IFwicG5nXCI7XG4gICAgY29uc3QgYmFzZSA9IHRoaXMuc2FuaXRpemVGaWxlbmFtZShzb3VyY2VGaWxlPy5iYXNlbmFtZSA/PyBcIm1pbmRtYXBcIik7XG4gICAgY29uc3QgcHJlZmVycmVkID0gbm9ybWFsaXplUGF0aChgJHtmb2xkZXJ9LyR7YmFzZX0tJHtzdGFtcH0uJHtleHRlbnNpb259YCk7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMuZ2V0QXZhaWxhYmxlUGF0aChwcmVmZXJyZWQpO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUJpbmFyeShwYXRoLCBhd2FpdCBibG9iLmFycmF5QnVmZmVyKCkpO1xuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgYXN5bmMgdXBsb2FkSW1hZ2VUb0hvc3QoYmxvYjogQmxvYiwgc3VnZ2VzdGVkTmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBlbmRwb2ludCA9IHRoaXMuc2V0dGluZ3MuaW1hZ2VIb3N0RW5kcG9pbnQudHJpbSgpO1xuICAgIGlmICghZW5kcG9pbnQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdThCRjdcdTUxNDhcdTU3MjggTWluZE1hcCBTdHVkaW8gXHU4QkJFXHU3RjZFXHU0RTJEXHU5MTREXHU3RjZFXHU1NkZFXHU1RThBXHU0RTBBXHU0RjIwXHU1NzMwXHU1NzQwXCIpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW1hZ2UgaG9zdCBlbmRwb2ludCBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgICB9XG4gICAgbGV0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5pbWFnZUhvc3RIZWFkZXJzLnRyaW0oKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZSh0aGlzLnNldHRpbmdzLmltYWdlSG9zdEhlYWRlcnMpIGFzIHVua25vd247XG4gICAgICAgIGlmICghcGFyc2VkIHx8IHR5cGVvZiBwYXJzZWQgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheShwYXJzZWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJoZWFkZXJzIG11c3QgYmUgYW4gb2JqZWN0XCIpO1xuICAgICAgICBoZWFkZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHBhcnNlZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikubWFwKChba2V5LCB2YWx1ZV0pID0+IFtrZXksIFN0cmluZyh2YWx1ZSldKSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBuZXcgTm90aWNlKFwiXHU1NkZFXHU1RThBXHU4QkY3XHU2QzQyXHU1OTM0IEpTT04gXHU2ODNDXHU1RjBGXHU5NTE5XHU4QkVGXCIpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZmlsZW5hbWUgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUoc3VnZ2VzdGVkTmFtZSB8fCBcIm1pbmRtYXAtaW1hZ2UucG5nXCIpO1xuICAgIGNvbnN0IG1pbWUgPSBibG9iLnR5cGUgfHwgXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgICBsZXQgYm9keTogQXJyYXlCdWZmZXI7XG4gICAgbGV0IGNvbnRlbnRUeXBlID0gbWltZTtcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5pbWFnZUhvc3RCb2R5TW9kZSA9PT0gXCJtdWx0aXBhcnRcIikge1xuICAgICAgY29uc3QgYm91bmRhcnkgPSBgLS0tLU1pbmRNYXBTdHVkaW8ke0RhdGUubm93KCkudG9TdHJpbmcoMTYpfSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMil9YDtcbiAgICAgIGNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgIGNvbnN0IGhlYWQgPSBlbmNvZGVyLmVuY29kZShgLS0ke2JvdW5kYXJ5fVxcclxcbkNvbnRlbnQtRGlzcG9zaXRpb246IGZvcm0tZGF0YTsgbmFtZT1cIiR7KHRoaXMuc2V0dGluZ3MuaW1hZ2VIb3N0RmllbGROYW1lIHx8IFwiZmlsZVwiKS5yZXBsYWNlQWxsKCdcIicsIFwiXCIpfVwiOyBmaWxlbmFtZT1cIiR7ZmlsZW5hbWUucmVwbGFjZUFsbCgnXCInLCBcIlwiKX1cIlxcclxcbkNvbnRlbnQtVHlwZTogJHttaW1lfVxcclxcblxcclxcbmApO1xuICAgICAgY29uc3QgZmlsZSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgICBjb25zdCB0YWlsID0gZW5jb2Rlci5lbmNvZGUoYFxcclxcbi0tJHtib3VuZGFyeX0tLVxcclxcbmApO1xuICAgICAgY29uc3QgY29tYmluZWQgPSBuZXcgVWludDhBcnJheShoZWFkLmxlbmd0aCArIGZpbGUubGVuZ3RoICsgdGFpbC5sZW5ndGgpO1xuICAgICAgY29tYmluZWQuc2V0KGhlYWQsIDApOyBjb21iaW5lZC5zZXQoZmlsZSwgaGVhZC5sZW5ndGgpOyBjb21iaW5lZC5zZXQodGFpbCwgaGVhZC5sZW5ndGggKyBmaWxlLmxlbmd0aCk7XG4gICAgICBib2R5ID0gY29tYmluZWQuYnVmZmVyO1xuICAgICAgY29udGVudFR5cGUgPSBgbXVsdGlwYXJ0L2Zvcm0tZGF0YTsgYm91bmRhcnk9JHtib3VuZGFyeX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBib2R5ID0gYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpO1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgdXJsOiBlbmRwb2ludCxcbiAgICAgIG1ldGhvZDogKHRoaXMuc2V0dGluZ3MuaW1hZ2VIb3N0TWV0aG9kIHx8IFwiUE9TVFwiKS50b1VwcGVyQ2FzZSgpLFxuICAgICAgY29udGVudFR5cGUsXG4gICAgICBoZWFkZXJzLFxuICAgICAgYm9keSxcbiAgICAgIHRocm93OiB0cnVlXG4gICAgfSk7XG4gICAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gICAgdHJ5IHsgcGF5bG9hZCA9IHJlc3BvbnNlLmpzb247IH0gY2F0Y2ggeyBwYXlsb2FkID0gdW5kZWZpbmVkOyB9XG4gICAgaWYgKCFwYXlsb2FkICYmIHJlc3BvbnNlLnRleHQpIHtcbiAgICAgIHRyeSB7IHBheWxvYWQgPSBKU09OLnBhcnNlKHJlc3BvbnNlLnRleHQpOyB9IGNhdGNoIHsgcGF5bG9hZCA9IHJlc3BvbnNlLnRleHQ7IH1cbiAgICB9XG4gICAgY29uc3QgZ2V0UGF0aCA9ICh2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdW5rbm93biA9PiBwYXRoLnNwbGl0KFwiLlwiKS5maWx0ZXIoQm9vbGVhbikucmVkdWNlPHVua25vd24+KChjdXJyZW50LCBrZXkpID0+IGN1cnJlbnQgJiYgdHlwZW9mIGN1cnJlbnQgPT09IFwib2JqZWN0XCIgPyAoY3VycmVudCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba2V5XSA6IHVuZGVmaW5lZCwgdmFsdWUpO1xuICAgIGNvbnN0IGNvbmZpZ3VyZWQgPSB0aGlzLnNldHRpbmdzLmltYWdlSG9zdFJlc3BvbnNlUGF0aC50cmltKCk7XG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IFtjb25maWd1cmVkLCBcImRhdGEudXJsXCIsIFwidXJsXCIsIFwicmVzdWx0LnVybFwiLCBcInJlc3VsdC5pbWFnZVwiLCBcImltYWdlLnVybFwiLCBcInNyY1wiXS5maWx0ZXIoQm9vbGVhbik7XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0UGF0aChwYXlsb2FkLCBwYXRoKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgL15odHRwcz86XFwvXFwvL2kudGVzdCh2YWx1ZS50cmltKCkpKSByZXR1cm4gdmFsdWUudHJpbSgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gcGF5bG9hZC5tYXRjaCgvaHR0cHM/OlxcL1xcL1teXFxzXCInPD5dKy9pKTtcbiAgICAgIGlmIChtYXRjaD8uWzBdKSByZXR1cm4gbWF0Y2hbMF07XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIlx1NTZGRVx1NUU4QVx1OEZENFx1NTZERVx1N0VEM1x1Njc5Q1x1NEUyRFx1NkNBMVx1NjcwOVx1NjI3RVx1NTIzMFx1NTZGRVx1NzI0N1x1N0Y1MVx1NTc0MFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1Ym1hcEZpbGUocGFyZW50RmlsZTogVEZpbGUsIG5vZGU6IE1pbmRNYXBOb2RlKTogUHJvbWlzZTxNaW5kTWFwU3VibWFwPiB7XG4gICAgY29uc3QgdGl0bGUgPSAobm9kZVBsYWluVGV4dChub2RlKSB8fCBcIlx1NUI1MFx1NUJGQ1x1NTZGRVwiKS50cmltKCk7XG4gICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWREb2N1bWVudCh0aXRsZSk7XG4gICAgZG9jdW1lbnQucm9vdC5jb250ZW50ID0gW3sgaWQ6IGRvY3VtZW50LnJvb3QuaWQgKyBcIl90aXRsZVwiLCB0eXBlOiBcInRleHRcIiwgdGV4dDogdGl0bGUgfV07XG4gICAgc3luY05vZGVMZWdhY3lGaWVsZHMoZG9jdW1lbnQucm9vdCk7XG4gICAgZG9jdW1lbnQucm9vdC5saW5rID0gYFtbJHtwYXJlbnRGaWxlLnBhdGh9XV1gO1xuICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGU7XG4gICAgZG9jdW1lbnQubmF2aWdhdGlvbiA9IHtcbiAgICAgIHBhcmVudFBhdGg6IHBhcmVudEZpbGUucGF0aCxcbiAgICAgIHBhcmVudE5vZGVJZDogbm9kZS5pZCxcbiAgICAgIHBhcmVudFRpdGxlOiBwYXJlbnRGaWxlLmJhc2VuYW1lLFxuICAgICAgcGFyZW50Tm9kZVRleHQ6IG5vZGVQbGFpblRleHQobm9kZSkgfHwgdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFx1NUI1MFx1NUJGQ1x1NTZGRVx1NEUwRFx1NTE4RFx1NEUwRVx1NzIzNlx1NjU4N1x1NEVGNlx1NUU3M1x1OTRGQVx1MzAwMlx1NzZFRVx1NUY1NVx1N0VEM1x1Njc4NFx1NTZGQVx1NUI5QVx1NEUzQVx1RkYxQVxuICAgIC8vIFx1NzIzNlx1NjU4N1x1NEVGNlx1NjI0MFx1NTcyOFx1NzZFRVx1NUY1NSAvIFx1OEQ0NFx1NkU5MFx1NjU4N1x1NEVGNlx1NTkzOSAvIFx1NzIzNlx1NUJGQ1x1NTZGRVx1NjU4N1x1NEVGNlx1NTQwRCAvIFx1NUI1MFx1NUJGQ1x1NTZGRS5taW5kbWFwXG4gICAgY29uc3QgcGFyZW50Rm9sZGVyID0gcGFyZW50RmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBjb25maWd1cmVkQXNzZXRzID0gbm9ybWFsaXplUGF0aCh0aGlzLnNldHRpbmdzLmFzc2V0Rm9sZGVyIHx8IFwiTWluZE1hcCBBc3NldHNcIik7XG4gICAgY29uc3QgcGFyZW50TWFwRm9sZGVyID0gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHBhcmVudEZpbGUuYmFzZW5hbWUpO1xuICAgIGNvbnN0IHN1Ym1hcEZvbGRlciA9IG5vcm1hbGl6ZVBhdGgoW3BhcmVudEZvbGRlciwgY29uZmlndXJlZEFzc2V0cywgcGFyZW50TWFwRm9sZGVyXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIi9cIikpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyUGF0aChzdWJtYXBGb2xkZXIpO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgobm9ybWFsaXplUGF0aChgJHtzdWJtYXBGb2xkZXJ9LyR7dGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKX0uJHtNSU5ETUFQX0VYVEVOU0lPTn1gKSk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCkpO1xuICAgIHJldHVybiB7IHBhdGg6IGZpbGUucGF0aCwgdGl0bGU6IGZpbGUuYmFzZW5hbWUgfTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5NaW5kTWFwUGF0aChwYXRoOiBzdHJpbmcsIHNvdXJjZVBhdGggPSBcIlwiLCBwcmVmZXJyZWRMZWFmPzogV29ya3NwYWNlTGVhZiwgZm9jdXNOb2RlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChwYXRoLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKSk7XG4gICAgY29uc3QgZGlyZWN0ID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGNvbnN0IHJlc29sdmVkID0gZGlyZWN0IGluc3RhbmNlb2YgVEZpbGUgPyBkaXJlY3QgOiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHBhdGgsIHNvdXJjZVBhdGgpO1xuICAgIGlmICghKHJlc29sdmVkIGluc3RhbmNlb2YgVEZpbGUpIHx8ICF0aGlzLmlzTWluZE1hcEZpbGUocmVzb2x2ZWQpKSB7XG4gICAgICBuZXcgTm90aWNlKGBcdTYyN0VcdTRFMERcdTUyMzBcdTVCNTBcdTVCRkNcdTU2RkVcdUZGMUEke3BhdGh9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMub3BlbkFzTWluZE1hcChyZXNvbHZlZCwgcHJlZmVycmVkTGVhZiwgZm9jdXNOb2RlSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXJQYXRoKGZvbGRlcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQgfHwgdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpIGluc3RhbmNlb2YgVEZvbGRlcikgcmV0dXJuO1xuICAgIGNvbnN0IHBhcnRzID0gbm9ybWFsaXplZC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtwYXJ0fWAgOiBwYXJ0O1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCkpIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBtaWdyYXRlTGVnYWN5RmlsZShmaWxlOiBURmlsZSwgb3BlbkFmdGVyID0gdHJ1ZSk6IFByb21pc2U8VEZpbGUgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZSkpIHJldHVybiBudWxsO1xuICAgIGlmICh0aGlzLmxlZ2FjeU1pZ3JhdGlvblBhdGggPT09IGZpbGUucGF0aCkgcmV0dXJuIG51bGw7XG4gICAgdGhpcy5sZWdhY3lNaWdyYXRpb25QYXRoID0gZmlsZS5wYXRoO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgdGl0bGUgPSBmaWxlLmJhc2VuYW1lLnJlcGxhY2UoL1xcLnNtbSQvaSwgXCJcIikgfHwgXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICAgIGNvbnN0IGRvY3VtZW50ID0gcGFyc2VEb2N1bWVudChzb3VyY2UsIHRpdGxlKTtcbiAgICAgIGNvbnN0IHBhcmVudFBhdGggPSBmaWxlLnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgICAgY29uc3QgcHJlZmVycmVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7cGFyZW50UGF0aCA/IGAke3BhcmVudFBhdGh9L2AgOiBcIlwifSR7dGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKX0uJHtNSU5ETUFQX0VYVEVOU0lPTn1gKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHByZWZlcnJlZFBhdGgpO1xuICAgICAgbGV0IHRhcmdldDogVEZpbGU7XG5cbiAgICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlICYmIHRoaXMuaXNNaW5kTWFwRmlsZShleGlzdGluZykpIHtcbiAgICAgICAgdGFyZ2V0ID0gZXhpc3Rpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwYXRoID0gZXhpc3RpbmcgPyBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgocHJlZmVycmVkUGF0aCkgOiBwcmVmZXJyZWRQYXRoO1xuICAgICAgICB0YXJnZXQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpKTtcbiAgICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU4RjZDXHU2MzYyXHU0RTNBXHU1M0VGXHU3RjE2XHU4RjkxXHU4MTExXHU1NkZFXHVGRjFBJHt0YXJnZXQucGF0aH1cXG5cdTUzOUZcdTY1ODdcdTRFRjZcdTVERjJcdTRGRERcdTc1NTlcdTRGNUNcdTRFM0FcdTU5MDdcdTRFRkRcdTMwMDJgLCA3MDAwKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wZW5BZnRlcikgYXdhaXQgdGhpcy5vcGVuQXNNaW5kTWFwKHRhcmdldCwgdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWYgPz8gdW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBsZWdhY3kgbWlncmF0aW9uIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiXHU2NUU3XHU3MjQ4XHU4MTExXHU1NkZFXHU4RjZDXHU2MzYyXHU1OTMxXHU4RDI1XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU2NzJBXHU4OEFCXHU0RkVFXHU2NTM5XHUzMDAyXCIsIDYwMDApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubGVnYWN5TWlncmF0aW9uUGF0aCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgaXNNaW5kTWFwRmlsZShmaWxlOiBURmlsZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpID09PSBNSU5ETUFQX0VYVEVOU0lPTjtcbiAgfVxuXG4gIGlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZTogVEZpbGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoTEVHQUNZX1NVRkZJWCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbnZlcnRNYXJrZG93bkZpbGUoZmlsZTogVEZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IHRpdGxlID0gZmlsZS5iYXNlbmFtZTtcbiAgICBjb25zdCBkb2N1bWVudCA9IG1hcmtkb3duVG9Eb2N1bWVudChzb3VyY2UsIHRpdGxlKTtcbiAgICBkb2N1bWVudC5sYXlvdXQgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQ7XG4gICAgZG9jdW1lbnQudGhlbWUgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRUaGVtZTtcbiAgICBkb2N1bWVudC5hcHBlYXJhbmNlID0gc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5jcmVhdGVNaW5kTWFwKHsgZG9jdW1lbnQsIHRpdGxlOiBgJHt0aXRsZX0gXHU4MTExXHU1NkZFYCwgZm9sZGVyOiBmaWxlLnBhcmVudD8ucGF0aCA/PyBcIlwiIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlRm9sZGVyKGV4cGxpY2l0Rm9sZGVyOiBzdHJpbmcgfCB1bmRlZmluZWQsIGFjdGl2ZUZpbGU6IFRGaWxlIHwgbnVsbCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gZXhwbGljaXRGb2xkZXIgPz8gKHRoaXMuc2V0dGluZ3MuZGVmYXVsdEZvbGRlciB8fCBhY3RpdmVGaWxlPy5wYXJlbnQ/LnBhdGggfHwgXCJcIik7XG4gICAgaWYgKCFjYW5kaWRhdGUpIHJldHVybiBcIlwiO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGNhbmRpZGF0ZSk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIHJldHVybiBub3JtYWxpemVkO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZE5ld1RpdGxlKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCB0d28gPSAodmFsdWU6IG51bWJlcik6IHN0cmluZyA9PiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBjb25zdCBzdGFtcCA9IGAke25vdy5nZXRGdWxsWWVhcigpfS0ke3R3byhub3cuZ2V0TW9udGgoKSArIDEpfS0ke3R3byhub3cuZ2V0RGF0ZSgpKX0gJHt0d28obm93LmdldEhvdXJzKCkpfSR7dHdvKG5vdy5nZXRNaW51dGVzKCkpfWA7XG4gICAgcmV0dXJuIGAke3RoaXMuc2V0dGluZ3MuZmlsZVByZWZpeH0gJHtzdGFtcH1gLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgc2FuaXRpemVGaWxlbmFtZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvW1xcXFwvOio/XCI8PnwjW1xcXV0vZywgXCItXCIpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSB8fCBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTb3VyY2VUaXRsZShjb250ZXh0OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KTogc3RyaW5nIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNvbnRleHQuc291cmNlUGF0aCk7XG4gICAgcmV0dXJuIHNvdXJjZUZpbGUgaW5zdGFuY2VvZiBURmlsZSA/IHNvdXJjZUZpbGUuYmFzZW5hbWUgOiBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzTWluZE1hcEVtYmVkcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgY29udGV4dDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVtYmVkcyA9IEFycmF5LmZyb20oZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcIi5pbnRlcm5hbC1lbWJlZFwiKSk7XG4gICAgZm9yIChjb25zdCBlbWJlZCBvZiBlbWJlZHMpIHtcbiAgICAgIGlmIChlbWJlZC5kYXRhc2V0Lm1tY1Byb2Nlc3NlZCA9PT0gXCJ0cnVlXCIpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgcmF3U291cmNlID0gZW1iZWQuZ2V0QXR0cmlidXRlKFwic3JjXCIpID8/IGVtYmVkLmRhdGFzZXQuc3JjID8/IFwiXCI7XG4gICAgICBjb25zdCBsaW5rUGF0aCA9IHJhd1NvdXJjZS5zcGxpdChcIiNcIilbMF0/LnNwbGl0KFwifFwiKVswXT8udHJpbSgpID8/IFwiXCI7XG4gICAgICBpZiAoIWxpbmtQYXRoLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoYC4ke01JTkRNQVBfRVhURU5TSU9OfWApKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KGxpbmtQYXRoLCBjb250ZXh0LnNvdXJjZVBhdGgpO1xuICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB8fCAhdGhpcy5pc01pbmRNYXBGaWxlKGZpbGUpKSBjb250aW51ZTtcbiAgICAgIGVtYmVkLmRhdGFzZXQubW1jUHJvY2Vzc2VkID0gXCJ0cnVlXCI7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jYWNoZWRSZWFkKGZpbGUpO1xuICAgICAgICBjb25zdCBkb2N1bWVudCA9IHBhcnNlRG9jdW1lbnQoc291cmNlLCBmaWxlLmJhc2VuYW1lKTtcbiAgICAgICAgcmVuZGVyU3RhdGljTWluZE1hcChlbWJlZCwgZG9jdW1lbnQsIHsgYXBwOiB0aGlzLmFwcCwgZmlsZSwgbWF4SGVpZ2h0OiB0aGlzLnNldHRpbmdzLmVtYmVkTWF4SGVpZ2h0LCBkZWZhdWx0QXBwZWFyYW5jZTogc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gZW1iZWQgcmVuZGVyIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIGVtYmVkLmVtcHR5KCk7XG4gICAgICAgIGVtYmVkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZW1iZWQtZXJyb3JcIiwgdGV4dDogXCJcdTY1RTBcdTZDRDVcdTUyQTBcdThGN0RcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcdTk4ODRcdTg5QzhcIiB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsICJleHBvcnQgdHlwZSBMYXlvdXRNb2RlID0gXCJyaWdodFwiIHwgXCJiYWxhbmNlZFwiO1xuZXhwb3J0IHR5cGUgVGhlbWVNb2RlID0gXCJhdXRvXCIgfCBcImxpZ2h0XCIgfCBcImRhcmtcIjtcbmV4cG9ydCB0eXBlIE5vZGVTaGFwZSA9IFwicm91bmRlZFwiIHwgXCJwaWxsXCIgfCBcInJlY3RhbmdsZVwiO1xuZXhwb3J0IHR5cGUgVGFza1N0YXR1cyA9IFwidG9kb1wiIHwgXCJkb2luZ1wiIHwgXCJkb25lXCI7XG5leHBvcnQgdHlwZSBCYWNrZ3JvdW5kUGF0dGVybiA9IFwibm9uZVwiIHwgXCJncmlkXCIgfCBcImRvdHNcIjtcbmV4cG9ydCB0eXBlIEVkZ2VTdHlsZSA9IFwiY3VydmVkXCIgfCBcInN0cmFpZ2h0XCIgfCBcImVsYm93XCI7XG5leHBvcnQgdHlwZSBGb250RmFtaWx5TW9kZSA9IFwib2JzaWRpYW5cIiB8IFwic2Fuc1wiIHwgXCJzZXJpZlwiIHwgXCJtb25vXCIgfCBcImN1c3RvbVwiO1xuZXhwb3J0IHR5cGUgVGFibGVBbGlnbm1lbnQgPSBcImxlZnRcIiB8IFwiY2VudGVyXCIgfCBcInJpZ2h0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFRleHRTdHlsZSB7XG4gIGJvbGQ/OiBib29sZWFuO1xuICBpdGFsaWM/OiBib29sZWFuO1xuICB1bmRlcmxpbmU/OiBib29sZWFuO1xuICBzdHJpa2U/OiBib29sZWFuO1xuICBjb2xvcj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwVGV4dFJ1biB7XG4gIHRleHQ6IHN0cmluZztcbiAgc3R5bGU/OiBNaW5kTWFwVGV4dFN0eWxlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBUYWJsZSB7XG4gIGhlYWRlcnM6IHN0cmluZ1tdO1xuICByb3dzOiBzdHJpbmdbXVtdO1xuICBhbGlnbm1lbnRzPzogVGFibGVBbGlnbm1lbnRbXTtcbiAgc291cmNlPzogXCJtYW51YWxcIiB8IFwibWFya2Rvd25cIiB8IFwiY2hpbGRyZW5cIjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwQ29kZUJsb2NrIHtcbiAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gIGNvZGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayB7XG4gIGlkOiBzdHJpbmc7XG4gIHR5cGU6IFwidGV4dFwiO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHJpY2hUZXh0PzogTWluZE1hcFRleHRSdW5bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2sge1xuICBpZDogc3RyaW5nO1xuICB0eXBlOiBcImltYWdlXCI7XG4gIHNvdXJjZTogc3RyaW5nO1xuICBhbHQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIE1pbmRNYXBDb250ZW50QmxvY2sgPSBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayB8IE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jaztcblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwU3VibWFwIHtcbiAgcGF0aDogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwTmF2aWdhdGlvbiB7XG4gIHBhcmVudFBhdGg6IHN0cmluZztcbiAgcGFyZW50Tm9kZUlkPzogc3RyaW5nO1xuICBwYXJlbnRUaXRsZT86IHN0cmluZztcbiAgcGFyZW50Tm9kZVRleHQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEFwcGVhcmFuY2Uge1xuICBiYWNrZ3JvdW5kQ29sb3I/OiBzdHJpbmc7XG4gIGJhY2tncm91bmRQYXR0ZXJuPzogQmFja2dyb3VuZFBhdHRlcm47XG4gIHBhdHRlcm5Db2xvcj86IHN0cmluZztcbiAgZm9udEZhbWlseT86IEZvbnRGYW1pbHlNb2RlO1xuICBjdXN0b21Gb250Pzogc3RyaW5nO1xuICBmb250U2l6ZT86IG51bWJlcjtcbiAgZWRnZUNvbG9yPzogc3RyaW5nO1xuICBlZGdlV2lkdGg/OiBudW1iZXI7XG4gIGVkZ2VTdHlsZT86IEVkZ2VTdHlsZTtcbiAgbm9kZUNvbG9yPzogc3RyaW5nO1xuICB0ZXh0Q29sb3I/OiBzdHJpbmc7XG4gIG5vZGVCb3JkZXJDb2xvcj86IHN0cmluZztcbiAgbm9kZUJvcmRlcldpZHRoPzogbnVtYmVyO1xuICBib2xkPzogYm9vbGVhbjtcbiAgaXRhbGljPzogYm9vbGVhbjtcbiAgdW5kZXJsaW5lPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwTm9kZVN0eWxlIHtcbiAgY29sb3I/OiBzdHJpbmc7XG4gIHRleHRDb2xvcj86IHN0cmluZztcbiAgYm9yZGVyQ29sb3I/OiBzdHJpbmc7XG4gIGJvcmRlcldpZHRoPzogbnVtYmVyO1xuICBzaGFwZT86IE5vZGVTaGFwZTtcbiAgYm9sZD86IGJvb2xlYW47XG4gIGl0YWxpYz86IGJvb2xlYW47XG4gIHVuZGVybGluZT86IGJvb2xlYW47XG4gIGZvbnRTaXplPzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBOb2RlIHtcbiAgaWQ6IHN0cmluZztcbiAgdGV4dDogc3RyaW5nO1xuICByaWNoVGV4dD86IE1pbmRNYXBUZXh0UnVuW107XG4gIC8qKiBPcmRlcmVkIHRleHQgYW5kIGltYWdlIGJsb2Nrcy4gTGVnYWN5IHRleHQvcmljaFRleHQvaW1hZ2UgZmllbGRzIHJlbWFpbiBmb3IgY29tcGF0aWJpbGl0eS4gKi9cbiAgY29udGVudD86IE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgbm90ZT86IHN0cmluZztcbiAgbGluaz86IHN0cmluZztcbiAgaW1hZ2U/OiBzdHJpbmc7XG4gIHRhYmxlPzogTWluZE1hcFRhYmxlO1xuICBjb2RlPzogTWluZE1hcENvZGVCbG9jaztcbiAgc3VibWFwPzogTWluZE1hcFN1Ym1hcDtcbiAgaWNvbj86IHN0cmluZztcbiAgdGFncz86IHN0cmluZ1tdO1xuICB0YXNrPzogVGFza1N0YXR1cztcbiAgc3R5bGU/OiBNaW5kTWFwTm9kZVN0eWxlO1xuICBjb2xsYXBzZWQ/OiBib29sZWFuO1xuICBjaGlsZHJlbjogTWluZE1hcE5vZGVbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwRG9jdW1lbnQge1xuICB2ZXJzaW9uOiA3O1xuICB0aXRsZTogc3RyaW5nO1xuICBsYXlvdXQ6IExheW91dE1vZGU7XG4gIHRoZW1lOiBUaGVtZU1vZGU7XG4gIGFwcGVhcmFuY2U/OiBNaW5kTWFwQXBwZWFyYW5jZTtcbiAgbmF2aWdhdGlvbj86IE1pbmRNYXBOYXZpZ2F0aW9uO1xuICByb290OiBNaW5kTWFwTm9kZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXNrUHJvZ3Jlc3Mge1xuICBkb25lOiBudW1iZXI7XG4gIHRvdGFsOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBNSU5ETUFQX0NPREVfQkxPQ0sgPSBcIm1pbmRtYXAtanNvblwiO1xuY29uc3QgTEVHQUNZX0NPREVfQkxPQ0tTID0gW1wic21tLWpzb25cIiwgXCJtbWMtanNvblwiXSBhcyBjb25zdDtcblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0lkKCk6IHN0cmluZyB7XG4gIGNvbnN0IHJhbmRvbSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDkpO1xuICByZXR1cm4gYG5fJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX1fJHtyYW5kb219YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGUodGV4dCA9IFwiXHU2NUIwXHU4MjgyXHU3MEI5XCIpOiBNaW5kTWFwTm9kZSB7XG4gIHJldHVybiB7IGlkOiBuZXdJZCgpLCB0ZXh0LCBjaGlsZHJlbjogW10gfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURlZmF1bHREb2N1bWVudCh0aXRsZSA9IFwiXHU2NUIwXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpOiBNaW5kTWFwRG9jdW1lbnQge1xuICByZXR1cm4ge1xuICAgIHZlcnNpb246IDcsXG4gICAgdGl0bGUsXG4gICAgbGF5b3V0OiBcInJpZ2h0XCIsXG4gICAgdGhlbWU6IFwiYXV0b1wiLFxuICAgIHJvb3Q6IHtcbiAgICAgIGlkOiBuZXdJZCgpLFxuICAgICAgdGV4dDogdGl0bGUsXG4gICAgICBjaGlsZHJlbjogW1xuICAgICAgICB7IGlkOiBuZXdJZCgpLCB0ZXh0OiBcIlx1NEUzQlx1OTg5OCAxXCIsIGNoaWxkcmVuOiBbXSB9LFxuICAgICAgICB7IGlkOiBuZXdJZCgpLCB0ZXh0OiBcIlx1NEUzQlx1OTg5OCAyXCIsIGNoaWxkcmVuOiBbXSB9XG4gICAgICBdXG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDb2xvcih2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gIHJldHVybiAvXiNbMC05YS1mXXs2fSQvaS50ZXN0KHRyaW1tZWQpID8gdHJpbW1lZCA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTnVtYmVyKHZhbHVlOiB1bmtub3duLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm51bWJlclwiIHx8ICFOdW1iZXIuaXNGaW5pdGUodmFsdWUpKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHZhbHVlKSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZSh2YWx1ZTogdW5rbm93bik6IGJvb2xlYW4gfCB1bmRlZmluZWQge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIiA/IHZhbHVlIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBcHBlYXJhbmNlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBBcHBlYXJhbmNlPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBBcHBlYXJhbmNlIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgYmFja2dyb3VuZFBhdHRlcm46IEJhY2tncm91bmRQYXR0ZXJuIHwgdW5kZWZpbmVkID0gaW5wdXQuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwibm9uZVwiIHx8IGlucHV0LmJhY2tncm91bmRQYXR0ZXJuID09PSBcImdyaWRcIiB8fCBpbnB1dC5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJkb3RzXCJcbiAgICA/IGlucHV0LmJhY2tncm91bmRQYXR0ZXJuXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGZvbnRGYW1pbHk6IEZvbnRGYW1pbHlNb2RlIHwgdW5kZWZpbmVkID0gaW5wdXQuZm9udEZhbWlseSA9PT0gXCJvYnNpZGlhblwiIHx8IGlucHV0LmZvbnRGYW1pbHkgPT09IFwic2Fuc1wiIHx8IGlucHV0LmZvbnRGYW1pbHkgPT09IFwic2VyaWZcIiB8fCBpbnB1dC5mb250RmFtaWx5ID09PSBcIm1vbm9cIiB8fCBpbnB1dC5mb250RmFtaWx5ID09PSBcImN1c3RvbVwiXG4gICAgPyBpbnB1dC5mb250RmFtaWx5XG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGVkZ2VTdHlsZTogRWRnZVN0eWxlIHwgdW5kZWZpbmVkID0gaW5wdXQuZWRnZVN0eWxlID09PSBcImN1cnZlZFwiIHx8IGlucHV0LmVkZ2VTdHlsZSA9PT0gXCJzdHJhaWdodFwiIHx8IGlucHV0LmVkZ2VTdHlsZSA9PT0gXCJlbGJvd1wiXG4gICAgPyBpbnB1dC5lZGdlU3R5bGVcbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3QgY3VzdG9tRm9udCA9IHR5cGVvZiBpbnB1dC5jdXN0b21Gb250ID09PSBcInN0cmluZ1wiICYmIGlucHV0LmN1c3RvbUZvbnQudHJpbSgpXG4gICAgPyBpbnB1dC5jdXN0b21Gb250LnRyaW0oKS5zbGljZSgwLCAxMjApXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlID0ge1xuICAgIGJhY2tncm91bmRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuYmFja2dyb3VuZENvbG9yKSxcbiAgICBiYWNrZ3JvdW5kUGF0dGVybixcbiAgICBwYXR0ZXJuQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LnBhdHRlcm5Db2xvciksXG4gICAgZm9udEZhbWlseSxcbiAgICBjdXN0b21Gb250LFxuICAgIGZvbnRTaXplOiBub3JtYWxpemVOdW1iZXIoaW5wdXQuZm9udFNpemUsIDEwLCAzMCksXG4gICAgZWRnZUNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5lZGdlQ29sb3IpLFxuICAgIGVkZ2VXaWR0aDogbm9ybWFsaXplTnVtYmVyKGlucHV0LmVkZ2VXaWR0aCwgMC41LCA4KSxcbiAgICBlZGdlU3R5bGUsXG4gICAgbm9kZUNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5ub2RlQ29sb3IpLFxuICAgIHRleHRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQudGV4dENvbG9yKSxcbiAgICBub2RlQm9yZGVyQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0Lm5vZGVCb3JkZXJDb2xvciksXG4gICAgbm9kZUJvcmRlcldpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQubm9kZUJvcmRlcldpZHRoLCAwLCA2KSxcbiAgICBib2xkOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuYm9sZCksXG4gICAgaXRhbGljOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuaXRhbGljKSxcbiAgICB1bmRlcmxpbmU6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC51bmRlcmxpbmUpXG4gIH07XG4gIHJldHVybiBPYmplY3QudmFsdWVzKGFwcGVhcmFuY2UpLnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IGFwcGVhcmFuY2UgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUFwcGVhcmFuY2UoYmFzZTogTWluZE1hcEFwcGVhcmFuY2UgfCB1bmRlZmluZWQsIG92ZXJyaWRlOiBNaW5kTWFwQXBwZWFyYW5jZSB8IHVuZGVmaW5lZCk6IE1pbmRNYXBBcHBlYXJhbmNlIHtcbiAgcmV0dXJuIHsgLi4uKGJhc2UgPz8ge30pLCAuLi4ob3ZlcnJpZGUgPz8ge30pIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0eWxlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOb2RlU3R5bGU+IHwgdW5kZWZpbmVkKTogTWluZE1hcE5vZGVTdHlsZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHNoYXBlOiBOb2RlU2hhcGUgfCB1bmRlZmluZWQgPSBpbnB1dC5zaGFwZSA9PT0gXCJwaWxsXCIgfHwgaW5wdXQuc2hhcGUgPT09IFwicmVjdGFuZ2xlXCIgfHwgaW5wdXQuc2hhcGUgPT09IFwicm91bmRlZFwiXG4gICAgPyBpbnB1dC5zaGFwZVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBzdHlsZTogTWluZE1hcE5vZGVTdHlsZSA9IHtcbiAgICBjb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuY29sb3IpLFxuICAgIHRleHRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQudGV4dENvbG9yKSxcbiAgICBib3JkZXJDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuYm9yZGVyQ29sb3IpLFxuICAgIGJvcmRlcldpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQuYm9yZGVyV2lkdGgsIDAsIDYpLFxuICAgIHNoYXBlLFxuICAgIGJvbGQ6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5ib2xkKSxcbiAgICBpdGFsaWM6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5pdGFsaWMpLFxuICAgIHVuZGVybGluZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnVuZGVybGluZSksXG4gICAgZm9udFNpemU6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5mb250U2l6ZSwgMTAsIDMyKVxuICB9O1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhzdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gc3R5bGUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRleHRTdHlsZShpbnB1dDogUGFydGlhbDxNaW5kTWFwVGV4dFN0eWxlPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBUZXh0U3R5bGUgfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0KSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBzdHlsZTogTWluZE1hcFRleHRTdHlsZSA9IHtcbiAgICBib2xkOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuYm9sZCksXG4gICAgaXRhbGljOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuaXRhbGljKSxcbiAgICB1bmRlcmxpbmU6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC51bmRlcmxpbmUpLFxuICAgIHN0cmlrZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnN0cmlrZSksXG4gICAgY29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LmNvbG9yKVxuICB9O1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhzdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gc3R5bGUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHRleHRTdHlsZUtleShzdHlsZTogTWluZE1hcFRleHRTdHlsZSB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShzdHlsZSA/PyB7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVSaWNoVGV4dChpbnB1dDogdW5rbm93biwgZmFsbGJhY2tUZXh0ID0gXCJcIik6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBydW5zOiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gIGZvciAoY29uc3QgcmF3IG9mIGlucHV0LnNsaWNlKDAsIDUwMCkpIHtcbiAgICBpZiAoIXJhdyB8fCB0eXBlb2YgcmF3ICE9PSBcIm9iamVjdFwiKSBjb250aW51ZTtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSByYXcgYXMgUGFydGlhbDxNaW5kTWFwVGV4dFJ1bj47XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUudGV4dCAhPT0gXCJzdHJpbmdcIiB8fCAhY2FuZGlkYXRlLnRleHQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHRleHQgPSBjYW5kaWRhdGUudGV4dC5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKS5zbGljZSgwLCAxMDAwMCk7XG4gICAgaWYgKCF0ZXh0KSBjb250aW51ZTtcbiAgICBjb25zdCBzdHlsZSA9IG5vcm1hbGl6ZVRleHRTdHlsZShjYW5kaWRhdGUuc3R5bGUpO1xuICAgIGNvbnN0IHByZXZpb3VzID0gcnVucy5hdCgtMSk7XG4gICAgaWYgKHByZXZpb3VzICYmIHRleHRTdHlsZUtleShwcmV2aW91cy5zdHlsZSkgPT09IHRleHRTdHlsZUtleShzdHlsZSkpIHByZXZpb3VzLnRleHQgKz0gdGV4dDtcbiAgICBlbHNlIHJ1bnMucHVzaCh7IHRleHQsIHN0eWxlIH0pO1xuICB9XG4gIGlmICghcnVucy5sZW5ndGgpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgY29uc3QgY29tYmluZWQgPSBydW5zLm1hcCgocnVuKSA9PiBydW4udGV4dCkuam9pbihcIlwiKTtcbiAgY29uc3QgbGVhZGluZyA9IGNvbWJpbmVkLmxlbmd0aCAtIGNvbWJpbmVkLnRyaW1TdGFydCgpLmxlbmd0aDtcbiAgY29uc3QgdHJhaWxpbmcgPSBjb21iaW5lZC5sZW5ndGggLSBjb21iaW5lZC50cmltRW5kKCkubGVuZ3RoO1xuICBpZiAobGVhZGluZyB8fCB0cmFpbGluZykge1xuICAgIGxldCBzdGFydCA9IGxlYWRpbmc7XG4gICAgbGV0IHJlbWFpbmluZyA9IGNvbWJpbmVkLmxlbmd0aCAtIGxlYWRpbmcgLSB0cmFpbGluZztcbiAgICBjb25zdCB0cmltbWVkOiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gICAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSBicmVhaztcbiAgICAgIGNvbnN0IHNraXAgPSBNYXRoLm1pbihzdGFydCwgcnVuLnRleHQubGVuZ3RoKTtcbiAgICAgIHN0YXJ0IC09IHNraXA7XG4gICAgICBjb25zdCBhdmFpbGFibGUgPSBydW4udGV4dC5sZW5ndGggLSBza2lwO1xuICAgICAgaWYgKGF2YWlsYWJsZSA8PSAwKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHRha2UgPSBNYXRoLm1pbihhdmFpbGFibGUsIHJlbWFpbmluZyk7XG4gICAgICBjb25zdCB0ZXh0ID0gcnVuLnRleHQuc2xpY2Uoc2tpcCwgc2tpcCArIHRha2UpO1xuICAgICAgcmVtYWluaW5nIC09IHRha2U7XG4gICAgICBpZiAodGV4dCkgdHJpbW1lZC5wdXNoKHsgdGV4dCwgc3R5bGU6IHJ1bi5zdHlsZSB9KTtcbiAgICB9XG4gICAgcnVucy5zcGxpY2UoMCwgcnVucy5sZW5ndGgsIC4uLnRyaW1tZWQpO1xuICB9XG5cbiAgaWYgKCFydW5zLmxlbmd0aCkgcmV0dXJuIGZhbGxiYWNrVGV4dC50cmltKCkgPyBbeyB0ZXh0OiBmYWxsYmFja1RleHQudHJpbSgpIH1dIDogdW5kZWZpbmVkO1xuICByZXR1cm4gcnVucy5zb21lKChydW4pID0+IHJ1bi5zdHlsZSAmJiBPYmplY3QudmFsdWVzKHJ1bi5zdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpKSA/IHJ1bnMgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByaWNoVGV4dFBsYWluVGV4dChydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQgPSBcIlwiKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bnM/Lm1hcCgocnVuKSA9PiBydW4udGV4dCkuam9pbihcIlwiKSA/PyBmYWxsYmFja1RleHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQgPSBcIlwiKTogTWluZE1hcFRleHRTdHlsZVtdIHtcbiAgY29uc3QgdGV4dCA9IHJpY2hUZXh0UGxhaW5UZXh0KHJ1bnMsIGZhbGxiYWNrVGV4dCk7XG4gIGNvbnN0IHN0eWxlczogTWluZE1hcFRleHRTdHlsZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogdGV4dC5sZW5ndGggfSwgKCkgPT4gKHt9KSk7XG4gIGlmICghcnVucz8ubGVuZ3RoKSByZXR1cm4gc3R5bGVzO1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgIGNvbnN0IHN0eWxlID0gcnVuLnN0eWxlID8geyAuLi5ydW4uc3R5bGUgfSA6IHt9O1xuICAgIGNvbnN0IGVuZCA9IE1hdGgubWluKHRleHQubGVuZ3RoLCBvZmZzZXQgKyBydW4udGV4dC5sZW5ndGgpO1xuICAgIGZvciAobGV0IGluZGV4ID0gb2Zmc2V0OyBpbmRleCA8IGVuZDsgaW5kZXggKz0gMSkgc3R5bGVzW2luZGV4XSA9IHsgLi4uc3R5bGUgfTtcbiAgICBvZmZzZXQgPSBlbmQ7XG4gIH1cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYXJhY3RlclN0eWxlc1RvUmljaFRleHQodGV4dDogc3RyaW5nLCBzdHlsZXM6IE1pbmRNYXBUZXh0U3R5bGVbXSk6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBpZiAoIXRleHQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGN1cnJlbnQgPSBub3JtYWxpemVUZXh0U3R5bGUoc3R5bGVzWzBdKTtcbiAgZm9yIChsZXQgaW5kZXggPSAxOyBpbmRleCA8PSB0ZXh0Lmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IG5leHQgPSBpbmRleCA8IHRleHQubGVuZ3RoID8gbm9ybWFsaXplVGV4dFN0eWxlKHN0eWxlc1tpbmRleF0pIDogdW5kZWZpbmVkO1xuICAgIGlmIChpbmRleCA8IHRleHQubGVuZ3RoICYmIHRleHRTdHlsZUtleShjdXJyZW50KSA9PT0gdGV4dFN0eWxlS2V5KG5leHQpKSBjb250aW51ZTtcbiAgICBjb25zdCBzZWdtZW50ID0gdGV4dC5zbGljZShzdGFydCwgaW5kZXgpO1xuICAgIGlmIChzZWdtZW50KSBydW5zLnB1c2goeyB0ZXh0OiBzZWdtZW50LCBzdHlsZTogY3VycmVudCB9KTtcbiAgICBzdGFydCA9IGluZGV4O1xuICAgIGN1cnJlbnQgPSBuZXh0O1xuICB9XG4gIHJldHVybiBub3JtYWxpemVSaWNoVGV4dChydW5zLCB0ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlY29uY2lsZVJpY2hUZXh0QWZ0ZXJFZGl0KFxuICBwcmV2aW91c1RleHQ6IHN0cmluZyxcbiAgcHJldmlvdXNSdW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLFxuICBuZXh0VGV4dDogc3RyaW5nXG4pOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHByZXZpb3VzVGV4dCA9PT0gbmV4dFRleHQpIHJldHVybiBub3JtYWxpemVSaWNoVGV4dChwcmV2aW91c1J1bnMsIG5leHRUZXh0KTtcbiAgY29uc3QgcHJldmlvdXNTdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhwcmV2aW91c1J1bnMsIHByZXZpb3VzVGV4dCk7XG4gIGNvbnN0IG5leHRTdHlsZXM6IE1pbmRNYXBUZXh0U3R5bGVbXSA9IEFycmF5LmZyb20oeyBsZW5ndGg6IG5leHRUZXh0Lmxlbmd0aCB9LCAoKSA9PiAoe30pKTtcbiAgbGV0IHByZWZpeCA9IDA7XG4gIHdoaWxlIChwcmVmaXggPCBwcmV2aW91c1RleHQubGVuZ3RoICYmIHByZWZpeCA8IG5leHRUZXh0Lmxlbmd0aCAmJiBwcmV2aW91c1RleHRbcHJlZml4XSA9PT0gbmV4dFRleHRbcHJlZml4XSkgcHJlZml4ICs9IDE7XG4gIGxldCBzdWZmaXggPSAwO1xuICB3aGlsZSAoXG4gICAgc3VmZml4IDwgcHJldmlvdXNUZXh0Lmxlbmd0aCAtIHByZWZpeFxuICAgICYmIHN1ZmZpeCA8IG5leHRUZXh0Lmxlbmd0aCAtIHByZWZpeFxuICAgICYmIHByZXZpb3VzVGV4dFtwcmV2aW91c1RleHQubGVuZ3RoIC0gMSAtIHN1ZmZpeF0gPT09IG5leHRUZXh0W25leHRUZXh0Lmxlbmd0aCAtIDEgLSBzdWZmaXhdXG4gICkgc3VmZml4ICs9IDE7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcmVmaXg7IGluZGV4ICs9IDEpIG5leHRTdHlsZXNbaW5kZXhdID0geyAuLi4ocHJldmlvdXNTdHlsZXNbaW5kZXhdID8/IHt9KSB9O1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgc3VmZml4OyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgcHJldmlvdXNJbmRleCA9IHByZXZpb3VzVGV4dC5sZW5ndGggLSBzdWZmaXggKyBpbmRleDtcbiAgICBjb25zdCBuZXh0SW5kZXggPSBuZXh0VGV4dC5sZW5ndGggLSBzdWZmaXggKyBpbmRleDtcbiAgICBuZXh0U3R5bGVzW25leHRJbmRleF0gPSB7IC4uLihwcmV2aW91c1N0eWxlc1twcmV2aW91c0luZGV4XSA/PyB7fSkgfTtcbiAgfVxuICByZXR1cm4gY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dChuZXh0VGV4dCwgbmV4dFN0eWxlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShcbiAgdGV4dDogc3RyaW5nLFxuICBydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLFxuICBzdGFydDogbnVtYmVyLFxuICBlbmQ6IG51bWJlcixcbiAgcGF0Y2g6IFBhcnRpYWw8TWluZE1hcFRleHRTdHlsZT4gfCBudWxsXG4pOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qgc2FmZVN0YXJ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4odGV4dC5sZW5ndGgsIE1hdGguZmxvb3Ioc3RhcnQpKSk7XG4gIGNvbnN0IHNhZmVFbmQgPSBNYXRoLm1heChzYWZlU3RhcnQsIE1hdGgubWluKHRleHQubGVuZ3RoLCBNYXRoLmZsb29yKGVuZCkpKTtcbiAgaWYgKHNhZmVTdGFydCA9PT0gc2FmZUVuZCkgcmV0dXJuIG5vcm1hbGl6ZVJpY2hUZXh0KHJ1bnMsIHRleHQpO1xuICBjb25zdCBzdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhydW5zLCB0ZXh0KTtcbiAgZm9yIChsZXQgaW5kZXggPSBzYWZlU3RhcnQ7IGluZGV4IDwgc2FmZUVuZDsgaW5kZXggKz0gMSkge1xuICAgIGlmIChwYXRjaCA9PT0gbnVsbCkgc3R5bGVzW2luZGV4XSA9IHt9O1xuICAgIGVsc2Ugc3R5bGVzW2luZGV4XSA9IHsgLi4uc3R5bGVzW2luZGV4XSwgLi4ucGF0Y2ggfTtcbiAgfVxuICByZXR1cm4gY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dCh0ZXh0LCBzdHlsZXMpO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbnRlbnRCbG9jayhpbnB1dDogdW5rbm93bik6IE1pbmRNYXBDb250ZW50QmxvY2sgfCBudWxsIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQgIT09IFwib2JqZWN0XCIpIHJldHVybiBudWxsO1xuICBjb25zdCBjYW5kaWRhdGUgPSBpbnB1dCBhcyBQYXJ0aWFsPE1pbmRNYXBDb250ZW50QmxvY2s+O1xuICBjb25zdCBpZCA9IHR5cGVvZiBjYW5kaWRhdGUuaWQgPT09IFwic3RyaW5nXCIgJiYgY2FuZGlkYXRlLmlkLnRyaW0oKSA/IGNhbmRpZGF0ZS5pZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IG5ld0lkKCk7XG4gIGlmIChjYW5kaWRhdGUudHlwZSA9PT0gXCJpbWFnZVwiKSB7XG4gICAgY29uc3Qgc291cmNlID0gdHlwZW9mIGNhbmRpZGF0ZS5zb3VyY2UgPT09IFwic3RyaW5nXCIgPyBjYW5kaWRhdGUuc291cmNlLnRyaW0oKS5zbGljZSgwLCAyMDAwKSA6IFwiXCI7XG4gICAgaWYgKCFzb3VyY2UpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGFsdCA9IHR5cGVvZiBjYW5kaWRhdGUuYWx0ID09PSBcInN0cmluZ1wiICYmIGNhbmRpZGF0ZS5hbHQudHJpbSgpID8gY2FuZGlkYXRlLmFsdC50cmltKCkuc2xpY2UoMCwgNTAwKSA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4geyBpZCwgdHlwZTogXCJpbWFnZVwiLCBzb3VyY2UsIGFsdCB9O1xuICB9XG4gIGlmIChjYW5kaWRhdGUudHlwZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICBjb25zdCBmYWxsYmFja1RleHQgPSB0eXBlb2YgY2FuZGlkYXRlLnRleHQgPT09IFwic3RyaW5nXCIgPyBjYW5kaWRhdGUudGV4dC5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKS5zbGljZSgwLCAyMDAwMCkgOiBcIlwiO1xuICAgIGNvbnN0IHJpY2hUZXh0ID0gbm9ybWFsaXplUmljaFRleHQoY2FuZGlkYXRlLnJpY2hUZXh0LCBmYWxsYmFja1RleHQpO1xuICAgIGNvbnN0IHRleHQgPSByaWNoVGV4dFBsYWluVGV4dChyaWNoVGV4dCwgZmFsbGJhY2tUZXh0KTtcbiAgICByZXR1cm4geyBpZCwgdHlwZTogXCJ0ZXh0XCIsIHRleHQsIHJpY2hUZXh0IH07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlQ29udGVudEJsb2Nrcyhub2RlOiBQaWNrPE1pbmRNYXBOb2RlLCBcImNvbnRlbnRcIiB8IFwidGV4dFwiIHwgXCJyaWNoVGV4dFwiIHwgXCJpbWFnZVwiPik6IE1pbmRNYXBDb250ZW50QmxvY2tbXSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUuY29udGVudCkgJiYgbm9kZS5jb250ZW50Lmxlbmd0aCkge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub2RlLmNvbnRlbnQubWFwKG5vcm1hbGl6ZUNvbnRlbnRCbG9jaykuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBDb250ZW50QmxvY2sgPT4gQm9vbGVhbihibG9jaykpO1xuICAgIGlmIChub3JtYWxpemVkLmxlbmd0aCkgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gIH1cbiAgY29uc3QgYmxvY2tzOiBNaW5kTWFwQ29udGVudEJsb2NrW10gPSBbXTtcbiAgaWYgKG5vZGUuaW1hZ2U/LnRyaW0oKSkgYmxvY2tzLnB1c2goeyBpZDogbmV3SWQoKSwgdHlwZTogXCJpbWFnZVwiLCBzb3VyY2U6IG5vZGUuaW1hZ2UudHJpbSgpLCBhbHQ6IG5vZGUudGV4dCB8fCB1bmRlZmluZWQgfSk7XG4gIGlmIChub2RlLnRleHQgfHwgbm9kZS5yaWNoVGV4dD8ubGVuZ3RoKSB7XG4gICAgY29uc3QgcmljaFRleHQgPSBub3JtYWxpemVSaWNoVGV4dChub2RlLnJpY2hUZXh0LCBub2RlLnRleHQpO1xuICAgIGJsb2Nrcy5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0OiByaWNoVGV4dFBsYWluVGV4dChyaWNoVGV4dCwgbm9kZS50ZXh0KSwgcmljaFRleHQgfSk7XG4gIH1cbiAgcmV0dXJuIGJsb2Nrcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVQbGFpblRleHQobm9kZTogUGljazxNaW5kTWFwTm9kZSwgXCJjb250ZW50XCIgfCBcInRleHRcIiB8IFwicmljaFRleHRcIiB8IFwiaW1hZ2VcIj4pOiBzdHJpbmcge1xuICBjb25zdCBibG9ja3MgPSBub2RlQ29udGVudEJsb2Nrcyhub2RlKTtcbiAgcmV0dXJuIGJsb2Nrcy5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcFRleHRDb250ZW50QmxvY2sgPT4gYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIpLm1hcCgoYmxvY2spID0+IGJsb2NrLnRleHQpLmpvaW4oXCIgXCIpLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN5bmNOb2RlTGVnYWN5RmllbGRzKG5vZGU6IE1pbmRNYXBOb2RlKTogdm9pZCB7XG4gIGNvbnN0IGJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpO1xuICBub2RlLmNvbnRlbnQgPSBibG9ja3MubGVuZ3RoID8gYmxvY2tzIDogdW5kZWZpbmVkO1xuICBjb25zdCB0ZXh0QmxvY2tzID0gYmxvY2tzLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcInRleHRcIik7XG4gIGNvbnN0IGltYWdlQmxvY2tzID0gYmxvY2tzLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2sgPT4gYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiKTtcbiAgbm9kZS50ZXh0ID0gdGV4dEJsb2Nrcy5tYXAoKGJsb2NrKSA9PiBibG9jay50ZXh0KS5qb2luKFwiIFwiKS50cmltKCk7XG4gIG5vZGUucmljaFRleHQgPSB0ZXh0QmxvY2tzLmxlbmd0aCA9PT0gMSA/IG5vcm1hbGl6ZVJpY2hUZXh0KHRleHRCbG9ja3NbMF0/LnJpY2hUZXh0LCB0ZXh0QmxvY2tzWzBdPy50ZXh0ID8/IFwiXCIpIDogdW5kZWZpbmVkO1xuICBub2RlLmltYWdlID0gaW1hZ2VCbG9ja3NbMF0/LnNvdXJjZTtcbn1cblxuXG5mdW5jdGlvbiBub3JtYWxpemVDZWxsKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiA/IHZhbHVlLnRyaW0oKS5zbGljZSgwLCAyMDAwKSA6IFN0cmluZyh2YWx1ZSA/PyBcIlwiKS50cmltKCkuc2xpY2UoMCwgMjAwMCk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRhYmxlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBUYWJsZT4gfCB1bmRlZmluZWQpOiBNaW5kTWFwVGFibGUgfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0IHx8ICFBcnJheS5pc0FycmF5KGlucHV0LmhlYWRlcnMpKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBoZWFkZXJzID0gaW5wdXQuaGVhZGVycy5tYXAobm9ybWFsaXplQ2VsbCkuc2xpY2UoMCwgMTIpO1xuICBpZiAoIWhlYWRlcnMubGVuZ3RoKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCByb3dzID0gQXJyYXkuaXNBcnJheShpbnB1dC5yb3dzKVxuICAgID8gaW5wdXQucm93cy5zbGljZSgwLCAxMDApLm1hcCgocm93KSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZXMgPSBBcnJheS5pc0FycmF5KHJvdykgPyByb3cubWFwKG5vcm1hbGl6ZUNlbGwpLnNsaWNlKDAsIGhlYWRlcnMubGVuZ3RoKSA6IFtdO1xuICAgICAgd2hpbGUgKHZhbHVlcy5sZW5ndGggPCBoZWFkZXJzLmxlbmd0aCkgdmFsdWVzLnB1c2goXCJcIik7XG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0pXG4gICAgOiBbXTtcbiAgY29uc3QgYWxpZ25tZW50cyA9IEFycmF5LmlzQXJyYXkoaW5wdXQuYWxpZ25tZW50cylcbiAgICA/IGlucHV0LmFsaWdubWVudHMuc2xpY2UoMCwgaGVhZGVycy5sZW5ndGgpLm1hcCgodmFsdWUpID0+IHZhbHVlID09PSBcImNlbnRlclwiIHx8IHZhbHVlID09PSBcInJpZ2h0XCIgPyB2YWx1ZSA6IFwibGVmdFwiKVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBzb3VyY2UgPSBpbnB1dC5zb3VyY2UgPT09IFwibWFya2Rvd25cIiB8fCBpbnB1dC5zb3VyY2UgPT09IFwiY2hpbGRyZW5cIiA/IGlucHV0LnNvdXJjZSA6IFwibWFudWFsXCI7XG4gIHJldHVybiB7IGhlYWRlcnMsIHJvd3MsIGFsaWdubWVudHMsIHNvdXJjZSB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDb2RlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBDb2RlQmxvY2s+IHwgdW5kZWZpbmVkKTogTWluZE1hcENvZGVCbG9jayB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQgfHwgdHlwZW9mIGlucHV0LmNvZGUgIT09IFwic3RyaW5nXCIgfHwgIWlucHV0LmNvZGUudHJpbSgpKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBsYW5ndWFnZSA9IHR5cGVvZiBpbnB1dC5sYW5ndWFnZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5sYW5ndWFnZS50cmltKClcbiAgICA/IGlucHV0Lmxhbmd1YWdlLnRyaW0oKS5yZXBsYWNlKC9bXmEtejAtOV8rIy4tXS9naSwgXCJcIikuc2xpY2UoMCwgNDApXG4gICAgOiB1bmRlZmluZWQ7XG4gIHJldHVybiB7IGxhbmd1YWdlLCBjb2RlOiBpbnB1dC5jb2RlLnJlcGxhY2UoL1xcclxcbi9nLCBcIlxcblwiKS5zbGljZSgwLCAxMDAwMDApIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN1Ym1hcChpbnB1dDogUGFydGlhbDxNaW5kTWFwU3VibWFwPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBTdWJtYXAgfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0IHx8IHR5cGVvZiBpbnB1dC5wYXRoICE9PSBcInN0cmluZ1wiIHx8ICFpbnB1dC5wYXRoLnRyaW0oKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIHtcbiAgICBwYXRoOiBpbnB1dC5wYXRoLnRyaW0oKS5zbGljZSgwLCA1MDApLFxuICAgIHRpdGxlOiB0eXBlb2YgaW5wdXQudGl0bGUgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQudGl0bGUudHJpbSgpID8gaW5wdXQudGl0bGUudHJpbSgpLnNsaWNlKDAsIDIwMCkgOiB1bmRlZmluZWRcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTmF2aWdhdGlvbihpbnB1dDogUGFydGlhbDxNaW5kTWFwTmF2aWdhdGlvbj4gfCB1bmRlZmluZWQpOiBNaW5kTWFwTmF2aWdhdGlvbiB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQgfHwgdHlwZW9mIGlucHV0LnBhcmVudFBhdGggIT09IFwic3RyaW5nXCIgfHwgIWlucHV0LnBhcmVudFBhdGgudHJpbSgpKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4ge1xuICAgIHBhcmVudFBhdGg6IGlucHV0LnBhcmVudFBhdGgudHJpbSgpLnNsaWNlKDAsIDUwMCksXG4gICAgcGFyZW50Tm9kZUlkOiB0eXBlb2YgaW5wdXQucGFyZW50Tm9kZUlkID09PSBcInN0cmluZ1wiICYmIGlucHV0LnBhcmVudE5vZGVJZC50cmltKCkgPyBpbnB1dC5wYXJlbnROb2RlSWQudHJpbSgpLnNsaWNlKDAsIDE2MCkgOiB1bmRlZmluZWQsXG4gICAgcGFyZW50VGl0bGU6IHR5cGVvZiBpbnB1dC5wYXJlbnRUaXRsZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5wYXJlbnRUaXRsZS50cmltKCkgPyBpbnB1dC5wYXJlbnRUaXRsZS50cmltKCkuc2xpY2UoMCwgMjAwKSA6IHVuZGVmaW5lZCxcbiAgICBwYXJlbnROb2RlVGV4dDogdHlwZW9mIGlucHV0LnBhcmVudE5vZGVUZXh0ID09PSBcInN0cmluZ1wiICYmIGlucHV0LnBhcmVudE5vZGVUZXh0LnRyaW0oKSA/IGlucHV0LnBhcmVudE5vZGVUZXh0LnRyaW0oKS5zbGljZSgwLCAyMDApIDogdW5kZWZpbmVkXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRhc2sodmFsdWU6IHVua25vd24pOiBUYXNrU3RhdHVzIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIHZhbHVlID09PSBcInRvZG9cIiB8fCB2YWx1ZSA9PT0gXCJkb2luZ1wiIHx8IHZhbHVlID09PSBcImRvbmVcIiA/IHZhbHVlIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVUYWdzKHZhbHVlOiB1bmtub3duKTogc3RyaW5nW10gfCB1bmRlZmluZWQge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCB0YWdzID0gQXJyYXkuZnJvbShuZXcgU2V0KHZhbHVlXG4gICAgLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgc3RyaW5nID0+IHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiKVxuICAgIC5tYXAoKGl0ZW0pID0+IGl0ZW0udHJpbSgpLnJlcGxhY2UoL14jLywgXCJcIikpXG4gICAgLmZpbHRlcihCb29sZWFuKSkpXG4gICAgLnNsaWNlKDAsIDEyKTtcbiAgcmV0dXJuIHRhZ3MubGVuZ3RoID8gdGFncyA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTm9kZShpbnB1dDogUGFydGlhbDxNaW5kTWFwTm9kZT4gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dDogc3RyaW5nKTogTWluZE1hcE5vZGUge1xuICBjb25zdCBmYWxsYmFja05vZGVUZXh0ID0gdHlwZW9mIGlucHV0Py50ZXh0ID09PSBcInN0cmluZ1wiID8gaW5wdXQudGV4dCA6IGZhbGxiYWNrVGV4dDtcbiAgY29uc3Qgbm9ybWFsaXplZENvbnRlbnQgPSBBcnJheS5pc0FycmF5KGlucHV0Py5jb250ZW50KVxuICAgID8gaW5wdXQuY29udGVudC5tYXAobm9ybWFsaXplQ29udGVudEJsb2NrKS5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcENvbnRlbnRCbG9jayA9PiBCb29sZWFuKGJsb2NrKSlcbiAgICA6IFtdO1xuICBpZiAoIW5vcm1hbGl6ZWRDb250ZW50Lmxlbmd0aCkge1xuICAgIGlmICh0eXBlb2YgaW5wdXQ/LmltYWdlID09PSBcInN0cmluZ1wiICYmIGlucHV0LmltYWdlLnRyaW0oKSkge1xuICAgICAgbm9ybWFsaXplZENvbnRlbnQucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcImltYWdlXCIsIHNvdXJjZTogaW5wdXQuaW1hZ2UudHJpbSgpLCBhbHQ6IGZhbGxiYWNrTm9kZVRleHQgfHwgdW5kZWZpbmVkIH0pO1xuICAgIH1cbiAgICBjb25zdCByaWNoVGV4dCA9IG5vcm1hbGl6ZVJpY2hUZXh0KGlucHV0Py5yaWNoVGV4dCwgZmFsbGJhY2tOb2RlVGV4dCk7XG4gICAgY29uc3QgdGV4dCA9IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBmYWxsYmFja05vZGVUZXh0KTtcbiAgICBpZiAodGV4dCkgbm9ybWFsaXplZENvbnRlbnQucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcInRleHRcIiwgdGV4dCwgcmljaFRleHQgfSk7XG4gIH1cbiAgY29uc3QgdGV4dEJsb2NrcyA9IG5vcm1hbGl6ZWRDb250ZW50LmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcInRleHRcIik7XG4gIGNvbnN0IGltYWdlQmxvY2tzID0gbm9ybWFsaXplZENvbnRlbnQuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIpO1xuICBjb25zdCB0ZXh0ID0gdGV4dEJsb2Nrcy5tYXAoKGJsb2NrKSA9PiBibG9jay50ZXh0KS5qb2luKFwiIFwiKS50cmltKCk7XG4gIHJldHVybiB7XG4gICAgaWQ6IHR5cGVvZiBpbnB1dD8uaWQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQuaWQgPyBpbnB1dC5pZCA6IG5ld0lkKCksXG4gICAgdGV4dCxcbiAgICByaWNoVGV4dDogdGV4dEJsb2Nrcy5sZW5ndGggPT09IDEgPyB0ZXh0QmxvY2tzWzBdPy5yaWNoVGV4dCA6IHVuZGVmaW5lZCxcbiAgICBjb250ZW50OiBub3JtYWxpemVkQ29udGVudC5sZW5ndGggPyBub3JtYWxpemVkQ29udGVudCA6IHVuZGVmaW5lZCxcbiAgICBub3RlOiB0eXBlb2YgaW5wdXQ/Lm5vdGUgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQubm90ZS50cmltKCkgPyBpbnB1dC5ub3RlLnRyaW0oKSA6IHVuZGVmaW5lZCxcbiAgICBsaW5rOiB0eXBlb2YgaW5wdXQ/LmxpbmsgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQubGluay50cmltKCkgPyBpbnB1dC5saW5rLnRyaW0oKSA6IHVuZGVmaW5lZCxcbiAgICBpbWFnZTogaW1hZ2VCbG9ja3NbMF0/LnNvdXJjZSxcbiAgICB0YWJsZTogbm9ybWFsaXplVGFibGUoaW5wdXQ/LnRhYmxlKSxcbiAgICBjb2RlOiBub3JtYWxpemVDb2RlKGlucHV0Py5jb2RlKSxcbiAgICBzdWJtYXA6IG5vcm1hbGl6ZVN1Ym1hcChpbnB1dD8uc3VibWFwKSxcbiAgICBpY29uOiB0eXBlb2YgaW5wdXQ/Lmljb24gPT09IFwic3RyaW5nXCIgJiYgaW5wdXQuaWNvbi50cmltKCkgPyBpbnB1dC5pY29uLnRyaW0oKS5zbGljZSgwLCAxMikgOiB1bmRlZmluZWQsXG4gICAgdGFnczogbm9ybWFsaXplVGFncyhpbnB1dD8udGFncyksXG4gICAgdGFzazogbm9ybWFsaXplVGFzayhpbnB1dD8udGFzayksXG4gICAgc3R5bGU6IG5vcm1hbGl6ZVN0eWxlKGlucHV0Py5zdHlsZSksXG4gICAgY29sbGFwc2VkOiBpbnB1dD8uY29sbGFwc2VkID09PSB0cnVlIHx8IHVuZGVmaW5lZCxcbiAgICBjaGlsZHJlbjogQXJyYXkuaXNBcnJheShpbnB1dD8uY2hpbGRyZW4pXG4gICAgICA/IGlucHV0LmNoaWxkcmVuLm1hcCgoY2hpbGQsIGluZGV4KSA9PiBub3JtYWxpemVOb2RlKGNoaWxkLCBgXHU4MjgyXHU3MEI5ICR7aW5kZXggKyAxfWApKVxuICAgICAgOiBbXVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRG9jdW1lbnQoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcERvY3VtZW50PiB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUaXRsZSA9IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpOiBNaW5kTWFwRG9jdW1lbnQge1xuICBjb25zdCB0aXRsZSA9IHR5cGVvZiBpbnB1dD8udGl0bGUgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQudGl0bGUudHJpbSgpID8gaW5wdXQudGl0bGUudHJpbSgpIDogZmFsbGJhY2tUaXRsZTtcbiAgcmV0dXJuIHtcbiAgICB2ZXJzaW9uOiA3LFxuICAgIHRpdGxlLFxuICAgIGxheW91dDogaW5wdXQ/LmxheW91dCA9PT0gXCJiYWxhbmNlZFwiID8gXCJiYWxhbmNlZFwiIDogXCJyaWdodFwiLFxuICAgIHRoZW1lOiBpbnB1dD8udGhlbWUgPT09IFwibGlnaHRcIiB8fCBpbnB1dD8udGhlbWUgPT09IFwiZGFya1wiID8gaW5wdXQudGhlbWUgOiBcImF1dG9cIixcbiAgICBhcHBlYXJhbmNlOiBub3JtYWxpemVBcHBlYXJhbmNlKGlucHV0Py5hcHBlYXJhbmNlKSxcbiAgICBuYXZpZ2F0aW9uOiBub3JtYWxpemVOYXZpZ2F0aW9uKGlucHV0Py5uYXZpZ2F0aW9uKSxcbiAgICByb290OiBub3JtYWxpemVOb2RlKGlucHV0Py5yb290LCB0aXRsZSlcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZURvY3VtZW50KGRvYzogTWluZE1hcERvY3VtZW50KTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZURvY3VtZW50KGRvYywgZG9jLnRpdGxlKTtcbiAgcmV0dXJuIGAke0pTT04uc3RyaW5naWZ5KG5vcm1hbGl6ZWQsIG51bGwsIDIpfVxcbmA7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSnNvbkRvY3VtZW50KHZhbHVlOiBzdHJpbmcsIGZhbGxiYWNrVGl0bGU6IHN0cmluZyk6IE1pbmRNYXBEb2N1bWVudCB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBub3JtYWxpemVEb2N1bWVudChKU09OLnBhcnNlKHZhbHVlKSBhcyBQYXJ0aWFsPE1pbmRNYXBEb2N1bWVudD4sIGZhbGxiYWNrVGl0bGUpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0RmVuY2VkSnNvbihzb3VyY2U6IHN0cmluZywgbGFuZ3VhZ2U6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBlc2NhcGVkID0gbGFuZ3VhZ2UucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICBjb25zdCBtYXRjaCA9IHNvdXJjZS5tYXRjaChuZXcgUmVnRXhwKFwiYGBgXCIgKyBlc2NhcGVkICsgXCJcXFxccyooW1xcXFxzXFxcXFNdKj8pYGBgXCIsIFwiaVwiKSk7XG4gIHJldHVybiBtYXRjaD8uWzFdPy50cmltKCkgPz8gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRG9jdW1lbnQoc291cmNlOiBzdHJpbmcsIGZhbGxiYWNrVGl0bGUgPSBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTogTWluZE1hcERvY3VtZW50IHtcbiAgY29uc3QgdHJpbW1lZCA9IHNvdXJjZS50cmltKCk7XG4gIGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoXCJ7XCIpICYmIHRyaW1tZWQuZW5kc1dpdGgoXCJ9XCIpKSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VKc29uRG9jdW1lbnQodHJpbW1lZCwgZmFsbGJhY2tUaXRsZSk7XG4gICAgaWYgKHBhcnNlZCkgcmV0dXJuIHBhcnNlZDtcbiAgfVxuXG4gIGZvciAoY29uc3QgbGFuZ3VhZ2Ugb2YgW01JTkRNQVBfQ09ERV9CTE9DSywgLi4uTEVHQUNZX0NPREVfQkxPQ0tTXSkge1xuICAgIGNvbnN0IGZlbmNlZCA9IGV4dHJhY3RGZW5jZWRKc29uKHNvdXJjZSwgbGFuZ3VhZ2UpO1xuICAgIGlmICghZmVuY2VkKSBjb250aW51ZTtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUpzb25Eb2N1bWVudChmZW5jZWQsIGZhbGxiYWNrVGl0bGUpO1xuICAgIGlmIChwYXJzZWQpIHJldHVybiBwYXJzZWQ7XG4gIH1cblxuICByZXR1cm4gbWFya2Rvd25Ub0RvY3VtZW50KHNvdXJjZSwgZmFsbGJhY2tUaXRsZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZURvY3VtZW50KGRvYzogTWluZE1hcERvY3VtZW50KTogTWluZE1hcERvY3VtZW50IHtcbiAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZG9jKSkgYXMgTWluZE1hcERvY3VtZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVOb2RlV2l0aEZyZXNoSWRzKG5vZGU6IE1pbmRNYXBOb2RlKTogTWluZE1hcE5vZGUge1xuICBjb25zdCBjbG9uZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobm9kZSkpIGFzIE1pbmRNYXBOb2RlO1xuICB3YWxrTm9kZXMoY2xvbmUsIChjdXJyZW50KSA9PiB7XG4gICAgY3VycmVudC5pZCA9IG5ld0lkKCk7XG4gIH0pO1xuICByZXR1cm4gY2xvbmU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3YWxrTm9kZXMocm9vdDogTWluZE1hcE5vZGUsIHZpc2l0b3I6IChub2RlOiBNaW5kTWFwTm9kZSwgcGFyZW50OiBNaW5kTWFwTm9kZSB8IG51bGwpID0+IHZvaWQpOiB2b2lkIHtcbiAgY29uc3QgdmlzaXQgPSAobm9kZTogTWluZE1hcE5vZGUsIHBhcmVudDogTWluZE1hcE5vZGUgfCBudWxsKTogdm9pZCA9PiB7XG4gICAgdmlzaXRvcihub2RlLCBwYXJlbnQpO1xuICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHZpc2l0KGNoaWxkLCBub2RlKSk7XG4gIH07XG4gIHZpc2l0KHJvb3QsIG51bGwpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbk5vZGVzKHJvb3Q6IE1pbmRNYXBOb2RlKTogTWluZE1hcE5vZGVbXSB7XG4gIGNvbnN0IG5vZGVzOiBNaW5kTWFwTm9kZVtdID0gW107XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSkgPT4gbm9kZXMucHVzaChub2RlKSk7XG4gIHJldHVybiBub2Rlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmROb2RlKHJvb3Q6IE1pbmRNYXBOb2RlLCBpZDogc3RyaW5nKTogTWluZE1hcE5vZGUgfCBudWxsIHtcbiAgbGV0IHJlc3VsdDogTWluZE1hcE5vZGUgfCBudWxsID0gbnVsbDtcbiAgd2Fsa05vZGVzKHJvb3QsIChub2RlKSA9PiB7XG4gICAgaWYgKG5vZGUuaWQgPT09IGlkKSByZXN1bHQgPSBub2RlO1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRQYXJlbnQocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBNaW5kTWFwTm9kZSB8IG51bGwge1xuICBsZXQgcmVzdWx0OiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUsIHBhcmVudCkgPT4ge1xuICAgIGlmIChub2RlLmlkID09PSBpZCkgcmVzdWx0ID0gcGFyZW50O1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBbmNlc3RvcnMocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBNaW5kTWFwTm9kZVtdIHtcbiAgY29uc3QgcGF0aDogTWluZE1hcE5vZGVbXSA9IFtdO1xuICBjb25zdCB2aXNpdCA9IChub2RlOiBNaW5kTWFwTm9kZSk6IGJvb2xlYW4gPT4ge1xuICAgIGlmIChub2RlLmlkID09PSBpZCkgcmV0dXJuIHRydWU7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICBwYXRoLnB1c2gobm9kZSk7XG4gICAgICBpZiAodmlzaXQoY2hpbGQpKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHBhdGgucG9wKCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgcmV0dXJuIHZpc2l0KHJvb3QpID8gcGF0aCA6IFtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbnNOb2RlKHJvb3Q6IE1pbmRNYXBOb2RlLCBpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBmaW5kTm9kZShyb290LCBpZCkgIT09IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVOb2RlKHJvb3Q6IE1pbmRNYXBOb2RlLCBpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByb290LmNoaWxkcmVuLmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGlmIChyb290LmNoaWxkcmVuW2luZGV4XT8uaWQgPT09IGlkKSB7XG4gICAgICByb290LmNoaWxkcmVuLnNwbGljZShpbmRleCwgMSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgY2hpbGQgPSByb290LmNoaWxkcmVuW2luZGV4XTtcbiAgICBpZiAoY2hpbGQgJiYgcmVtb3ZlTm9kZShjaGlsZCwgaWQpKSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0V2lraUxpbmtzKHJvb3Q6IE1pbmRNYXBOb2RlKTogU2V0PHN0cmluZz4ge1xuICBjb25zdCBsaW5rcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBwYXR0ZXJuID0gL1xcW1xcWyhbXlxcXXwjXSspKD86I1teXFxdfF0rKT8oPzpcXHxbXlxcXV0rKT9cXF1cXF0vZztcbiAgd2Fsa05vZGVzKHJvb3QsIChub2RlKSA9PiB7XG4gICAgY29uc3QgdmFsdWVzID0gW25vZGVQbGFpblRleHQobm9kZSksIG5vZGUubm90ZSA/PyBcIlwiLCBub2RlLmxpbmsgPz8gXCJcIiwgLi4ubm9kZUNvbnRlbnRCbG9ja3Mobm9kZSkuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIpLm1hcCgoYmxvY2spID0+IGJsb2NrLnNvdXJjZSksIG5vZGUuc3VibWFwPy5wYXRoID8/IFwiXCJdO1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgdmFsdWVzKSB7XG4gICAgICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG4gICAgICB3aGlsZSAoKG1hdGNoID0gcGF0dGVybi5leGVjKHZhbHVlKSkgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKG1hdGNoWzFdKSBsaW5rcy5hZGQobWF0Y2hbMV0udHJpbSgpKTtcbiAgICAgIH1cbiAgICAgIHBhdHRlcm4ubGFzdEluZGV4ID0gMDtcbiAgICB9XG4gICAgY29uc3QgZXhwbGljaXRMaW5rID0gbm9kZS5saW5rPy50cmltKCk7XG4gICAgaWYgKGV4cGxpY2l0TGluayAmJiAhL15odHRwcz86XFwvXFwvL2kudGVzdChleHBsaWNpdExpbmspICYmICFleHBsaWNpdExpbmsuaW5jbHVkZXMoXCJbW1wiKSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZXhwbGljaXRMaW5rLnNwbGl0KFwifFwiKVswXT8uc3BsaXQoXCIjXCIpWzBdPy50cmltKCk7XG4gICAgICBpZiAodGFyZ2V0KSBsaW5rcy5hZGQodGFyZ2V0KTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gbGlua3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Rmlyc3RXaWtpTGluayh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IG1hdGNoID0gdmFsdWUubWF0Y2goL1xcW1xcWyhbXlxcXXwjXSsoPzojW15cXF18XSspPykoPzpcXHxbXlxcXV0rKT9cXF1cXF0vKTtcbiAgcmV0dXJuIG1hdGNoPy5bMV0/LnRyaW0oKSA/PyBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFza1Byb2dyZXNzKHJvb3Q6IE1pbmRNYXBOb2RlKTogVGFza1Byb2dyZXNzIHtcbiAgbGV0IGRvbmUgPSAwO1xuICBsZXQgdG90YWwgPSAwO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUpID0+IHtcbiAgICBpZiAoIW5vZGUudGFzaykgcmV0dXJuO1xuICAgIHRvdGFsICs9IDE7XG4gICAgaWYgKG5vZGUudGFzayA9PT0gXCJkb25lXCIpIGRvbmUgKz0gMTtcbiAgfSk7XG4gIHJldHVybiB7IGRvbmUsIHRvdGFsIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlU2VhcmNoVGV4dChub2RlOiBNaW5kTWFwTm9kZSk6IHN0cmluZyB7XG4gIHJldHVybiBbbm9kZVBsYWluVGV4dChub2RlKSwgbm9kZS5ub3RlLCBub2RlLmxpbmssIC4uLm5vZGVDb250ZW50QmxvY2tzKG5vZGUpLm1hcCgoYmxvY2spID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIiA/IGAke2Jsb2NrLnNvdXJjZX0gJHtibG9jay5hbHQgPz8gXCJcIn1gIDogYmxvY2sudGV4dCksIG5vZGUuaWNvbiwgbm9kZS5zdWJtYXA/LnBhdGgsIG5vZGUuY29kZT8ubGFuZ3VhZ2UsIG5vZGUuY29kZT8uY29kZSwgLi4uKG5vZGUudGFibGU/LmhlYWRlcnMgPz8gW10pLCAuLi4obm9kZS50YWJsZT8ucm93cy5mbGF0KCkgPz8gW10pLCAuLi4obm9kZS50YWdzID8/IFtdKV1cbiAgICAuZmlsdGVyKCh2YWx1ZSk6IHZhbHVlIGlzIHN0cmluZyA9PiBCb29sZWFuKHZhbHVlKSlcbiAgICAuam9pbihcIiBcIilcbiAgICAudG9Mb2NhbGVMb3dlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gdGFza1ByZWZpeCh0YXNrOiBUYXNrU3RhdHVzIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKHRhc2sgPT09IFwiZG9uZVwiKSByZXR1cm4gXCJbeF0gXCI7XG4gIGlmICh0YXNrID09PSBcImRvaW5nXCIpIHJldHVybiBcIlstXSBcIjtcbiAgaWYgKHRhc2sgPT09IFwidG9kb1wiKSByZXR1cm4gXCJbIF0gXCI7XG4gIHJldHVybiBcIlwiO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVJbmxpbmVNYXJrZG93bih2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLyhbXFxcXGAqX3t9XFxbXFxdPD5dKS9nLCBcIlxcXFwkMVwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJpY2hUZXh0VG9NYXJrZG93bihydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghcnVucz8ubGVuZ3RoKSByZXR1cm4gZXNjYXBlSW5saW5lTWFya2Rvd24oZmFsbGJhY2tUZXh0KTtcbiAgcmV0dXJuIHJ1bnMubWFwKChydW4pID0+IHtcbiAgICBsZXQgdmFsdWUgPSBlc2NhcGVJbmxpbmVNYXJrZG93bihydW4udGV4dCk7XG4gICAgY29uc3Qgc3R5bGUgPSBydW4uc3R5bGU7XG4gICAgaWYgKCFzdHlsZSkgcmV0dXJuIHZhbHVlO1xuICAgIGlmIChzdHlsZS5ib2xkKSB2YWx1ZSA9IGAqKiR7dmFsdWV9KipgO1xuICAgIGlmIChzdHlsZS5pdGFsaWMpIHZhbHVlID0gYCoke3ZhbHVlfSpgO1xuICAgIGlmIChzdHlsZS5zdHJpa2UpIHZhbHVlID0gYH5+JHt2YWx1ZX1+fmA7XG4gICAgaWYgKHN0eWxlLnVuZGVybGluZSkgdmFsdWUgPSBgPHU+JHt2YWx1ZX08L3U+YDtcbiAgICBpZiAoc3R5bGUuY29sb3IpIHZhbHVlID0gYDxzcGFuIHN0eWxlPVwiY29sb3I6JHtzdHlsZS5jb2xvcn1cIj4ke3ZhbHVlfTwvc3Bhbj5gO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfSkuam9pbihcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRhYmxlVG9NYXJrZG93bih0YWJsZTogTWluZE1hcFRhYmxlKTogc3RyaW5nIHtcbiAgY29uc3QgZXNjYXBlQ2VsbCA9ICh2YWx1ZTogc3RyaW5nKTogc3RyaW5nID0+IHZhbHVlLnJlcGxhY2VBbGwoXCJ8XCIsIFwiXFxcXHxcIikucmVwbGFjZUFsbChcIlxcblwiLCBcIjxicj5cIik7XG4gIGNvbnN0IGhlYWRlcnMgPSBgfCAke3RhYmxlLmhlYWRlcnMubWFwKGVzY2FwZUNlbGwpLmpvaW4oXCIgfCBcIil9IHxgO1xuICBjb25zdCBhbGlnbm1lbnRzID0gdGFibGUuaGVhZGVycy5tYXAoKF8sIGluZGV4KSA9PiB7XG4gICAgY29uc3QgYWxpZ25tZW50ID0gdGFibGUuYWxpZ25tZW50cz8uW2luZGV4XSA/PyBcImxlZnRcIjtcbiAgICByZXR1cm4gYWxpZ25tZW50ID09PSBcImNlbnRlclwiID8gXCI6LS0tOlwiIDogYWxpZ25tZW50ID09PSBcInJpZ2h0XCIgPyBcIi0tLTpcIiA6IFwiLS0tXCI7XG4gIH0pO1xuICBjb25zdCBzZXBhcmF0b3IgPSBgfCAke2FsaWdubWVudHMuam9pbihcIiB8IFwiKX0gfGA7XG4gIGNvbnN0IHJvd3MgPSB0YWJsZS5yb3dzLm1hcCgocm93KSA9PiBgfCAke3RhYmxlLmhlYWRlcnMubWFwKChfLCBpbmRleCkgPT4gZXNjYXBlQ2VsbChyb3dbaW5kZXhdID8/IFwiXCIpKS5qb2luKFwiIHwgXCIpfSB8YCk7XG4gIHJldHVybiBbaGVhZGVycywgc2VwYXJhdG9yLCAuLi5yb3dzXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBzcGxpdE1hcmtkb3duVGFibGVSb3cobGluZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCB2YWx1ZSA9IGxpbmUudHJpbSgpLnJlcGxhY2UoL15cXHwvLCBcIlwiKS5yZXBsYWNlKC9cXHwkLywgXCJcIik7XG4gIGNvbnN0IGNlbGxzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgY3VycmVudCA9IFwiXCI7XG4gIGxldCBlc2NhcGVkID0gZmFsc2U7XG4gIGZvciAoY29uc3QgY2hhciBvZiB2YWx1ZSkge1xuICAgIGlmIChlc2NhcGVkKSB7IGN1cnJlbnQgKz0gY2hhcjsgZXNjYXBlZCA9IGZhbHNlOyBjb250aW51ZTsgfVxuICAgIGlmIChjaGFyID09PSBcIlxcXFxcIikgeyBlc2NhcGVkID0gdHJ1ZTsgY29udGludWU7IH1cbiAgICBpZiAoY2hhciA9PT0gXCJ8XCIpIHsgY2VsbHMucHVzaChjdXJyZW50LnRyaW0oKS5yZXBsYWNlQWxsKFwiPGJyPlwiLCBcIlxcblwiKSk7IGN1cnJlbnQgPSBcIlwiOyBjb250aW51ZTsgfVxuICAgIGN1cnJlbnQgKz0gY2hhcjtcbiAgfVxuICBjZWxscy5wdXNoKGN1cnJlbnQudHJpbSgpLnJlcGxhY2VBbGwoXCI8YnI+XCIsIFwiXFxuXCIpKTtcbiAgcmV0dXJuIGNlbGxzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VNYXJrZG93blRhYmxlKG1hcmtkb3duOiBzdHJpbmcpOiBNaW5kTWFwVGFibGUgfCBudWxsIHtcbiAgY29uc3QgbGluZXMgPSBtYXJrZG93bi5zcGxpdCgvXFxyP1xcbi8pO1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbGluZXMubGVuZ3RoIC0gMTsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IGhlYWRlckxpbmUgPSBsaW5lc1tpbmRleF0/LnRyaW0oKSA/PyBcIlwiO1xuICAgIGNvbnN0IHNlcGFyYXRvckxpbmUgPSBsaW5lc1tpbmRleCArIDFdPy50cmltKCkgPz8gXCJcIjtcbiAgICBpZiAoIWhlYWRlckxpbmUuaW5jbHVkZXMoXCJ8XCIpIHx8ICFzZXBhcmF0b3JMaW5lLmluY2x1ZGVzKFwifFwiKSkgY29udGludWU7XG4gICAgY29uc3QgaGVhZGVycyA9IHNwbGl0TWFya2Rvd25UYWJsZVJvdyhoZWFkZXJMaW5lKTtcbiAgICBjb25zdCBzZXBhcmF0b3JzID0gc3BsaXRNYXJrZG93blRhYmxlUm93KHNlcGFyYXRvckxpbmUpO1xuICAgIGlmICghaGVhZGVycy5sZW5ndGggfHwgc2VwYXJhdG9ycy5sZW5ndGggIT09IGhlYWRlcnMubGVuZ3RoIHx8ICFzZXBhcmF0b3JzLmV2ZXJ5KChjZWxsKSA9PiAvXjo/LXszLH06PyQvLnRlc3QoY2VsbC5yZXBsYWNlKC9cXHMvZywgXCJcIikpKSkgY29udGludWU7XG4gICAgY29uc3QgYWxpZ25tZW50czogVGFibGVBbGlnbm1lbnRbXSA9IHNlcGFyYXRvcnMubWFwKChjZWxsKSA9PiB7XG4gICAgICBjb25zdCBjb21wYWN0ID0gY2VsbC5yZXBsYWNlKC9cXHMvZywgXCJcIik7XG4gICAgICBpZiAoY29tcGFjdC5zdGFydHNXaXRoKFwiOlwiKSAmJiBjb21wYWN0LmVuZHNXaXRoKFwiOlwiKSkgcmV0dXJuIFwiY2VudGVyXCI7XG4gICAgICBpZiAoY29tcGFjdC5lbmRzV2l0aChcIjpcIikpIHJldHVybiBcInJpZ2h0XCI7XG4gICAgICByZXR1cm4gXCJsZWZ0XCI7XG4gICAgfSk7XG4gICAgY29uc3Qgcm93czogc3RyaW5nW11bXSA9IFtdO1xuICAgIGZvciAobGV0IHJvd0luZGV4ID0gaW5kZXggKyAyOyByb3dJbmRleCA8IGxpbmVzLmxlbmd0aDsgcm93SW5kZXggKz0gMSkge1xuICAgICAgY29uc3Qgcm93TGluZSA9IGxpbmVzW3Jvd0luZGV4XT8udHJpbSgpID8/IFwiXCI7XG4gICAgICBpZiAoIXJvd0xpbmUgfHwgIXJvd0xpbmUuaW5jbHVkZXMoXCJ8XCIpKSBicmVhaztcbiAgICAgIGNvbnN0IHJvdyA9IHNwbGl0TWFya2Rvd25UYWJsZVJvdyhyb3dMaW5lKS5zbGljZSgwLCBoZWFkZXJzLmxlbmd0aCk7XG4gICAgICB3aGlsZSAocm93Lmxlbmd0aCA8IGhlYWRlcnMubGVuZ3RoKSByb3cucHVzaChcIlwiKTtcbiAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplVGFibGUoeyBoZWFkZXJzLCByb3dzLCBhbGlnbm1lbnRzLCBzb3VyY2U6IFwibWFya2Rvd25cIiB9KSA/PyBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGZW5jZWRDb2RlKG1hcmtkb3duOiBzdHJpbmcpOiBNaW5kTWFwQ29kZUJsb2NrIHwgbnVsbCB7XG4gIGNvbnN0IG1hdGNoID0gbWFya2Rvd24ubWF0Y2goL2BgYChbXlxcbmBdKilcXG4oW1xcc1xcU10qPylcXG5gYGAvKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBub3JtYWxpemVDb2RlKHsgbGFuZ3VhZ2U6IG1hdGNoWzFdPy50cmltKCksIGNvZGU6IG1hdGNoWzJdID8/IFwiXCIgfSkgPz8gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoaWxkcmVuVG9UYWJsZShub2RlOiBNaW5kTWFwTm9kZSk6IE1pbmRNYXBUYWJsZSB8IG51bGwge1xuICBpZiAoIW5vZGUuY2hpbGRyZW4ubGVuZ3RoKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHtcbiAgICBoZWFkZXJzOiBbXCJcdTVCNTBcdTgyODJcdTcwQjlcIiwgXCJcdTU5MDdcdTZDRThcIiwgXCJcdTcyQjZcdTYwMDFcIiwgXCJcdTY4MDdcdTdCN0VcIiwgXCJcdTRFMEJcdTdFQTdcdTY1NzBcdTkxQ0ZcIl0sXG4gICAgcm93czogbm9kZS5jaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiBbXG4gICAgICBub2RlUGxhaW5UZXh0KGNoaWxkKSxcbiAgICAgIGNoaWxkLm5vdGUgPz8gXCJcIixcbiAgICAgIGNoaWxkLnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTVERjJcdTVCOENcdTYyMTBcIiA6IGNoaWxkLnRhc2sgPT09IFwiZG9pbmdcIiA/IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIgOiBjaGlsZC50YXNrID09PSBcInRvZG9cIiA/IFwiXHU1Rjg1XHU1MjlFXCIgOiBcIlwiLFxuICAgICAgY2hpbGQudGFncz8uam9pbihcIiwgXCIpID8/IFwiXCIsXG4gICAgICBTdHJpbmcoY2hpbGQuY2hpbGRyZW4ubGVuZ3RoKVxuICAgIF0pLFxuICAgIGFsaWdubWVudHM6IFtcImxlZnRcIiwgXCJsZWZ0XCIsIFwiY2VudGVyXCIsIFwibGVmdFwiLCBcInJpZ2h0XCJdLFxuICAgIHNvdXJjZTogXCJjaGlsZHJlblwiXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkb2N1bWVudFRvTWFya2Rvd24oZG9jOiBNaW5kTWFwRG9jdW1lbnQpOiBzdHJpbmcge1xuICBjb25zdCByZW5kZXJCbG9ja3MgPSAobm9kZTogTWluZE1hcE5vZGUpOiBzdHJpbmdbXSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2Ygbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSkpIHtcbiAgICAgIGlmIChibG9jay50eXBlID09PSBcInRleHRcIikge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHJpY2hUZXh0VG9NYXJrZG93bihibG9jay5yaWNoVGV4dCwgYmxvY2sudGV4dCk7XG4gICAgICAgIGlmICh2YWx1ZSkgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnB1c2goYCFbJHtlc2NhcGVJbmxpbmVNYXJrZG93bihibG9jay5hbHQgPz8gXCJcdTU2RkVcdTcyNDdcIil9XSgke2Jsb2NrLnNvdXJjZX0pYCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIGNvbnN0IHJvb3RCbG9ja3MgPSByZW5kZXJCbG9ja3MoZG9jLnJvb3QpO1xuICBjb25zdCByb290VGl0bGUgPSByb290QmxvY2tzLmZpbmQoKHZhbHVlKSA9PiAhdmFsdWUuc3RhcnRzV2l0aChcIiFbXCIpKSA/PyBkb2MudGl0bGU7XG4gIGNvbnN0IHJvb3RTdWZmaXggPSBkb2Mucm9vdC50YWdzPy5sZW5ndGggPyBgICR7ZG9jLnJvb3QudGFncy5tYXAoKHRhZykgPT4gYCMke3RhZ31gKS5qb2luKFwiIFwiKX1gIDogXCJcIjtcbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW2AjICR7ZG9jLnJvb3QuaWNvbiA/IGAke2RvYy5yb290Lmljb259IGAgOiBcIlwifSR7cm9vdFRpdGxlfSR7cm9vdFN1ZmZpeH1gXTtcbiAgcm9vdEJsb2Nrcy5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gcm9vdFRpdGxlKS5mb3JFYWNoKCh2YWx1ZSkgPT4gbGluZXMucHVzaCh2YWx1ZSkpO1xuICBjb25zdCB2aXNpdCA9IChub2RlOiBNaW5kTWFwTm9kZSwgZGVwdGg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIGNvbnN0IGluZGVudCA9IFwiICBcIi5yZXBlYXQoTWF0aC5tYXgoMCwgZGVwdGggLSAxKSk7XG4gICAgY29uc3QgdGFncyA9IG5vZGUudGFncz8ubGVuZ3RoID8gYCAke25vZGUudGFncy5tYXAoKHRhZykgPT4gYCMke3RhZ31gKS5qb2luKFwiIFwiKX1gIDogXCJcIjtcbiAgICBjb25zdCBsaW5rID0gbm9kZS5saW5rID8gYCBcdTIxOTIgJHtub2RlLmxpbmt9YCA6IFwiXCI7XG4gICAgY29uc3QgYmxvY2tzID0gcmVuZGVyQmxvY2tzKG5vZGUpO1xuICAgIGNvbnN0IGZpcnN0VGV4dCA9IGJsb2Nrcy5maW5kKCh2YWx1ZSkgPT4gIXZhbHVlLnN0YXJ0c1dpdGgoXCIhW1wiKSkgPz8gKGJsb2Nrc1swXSA/PyBcIlx1NTZGRVx1NzI0N1x1ODI4Mlx1NzBCOVwiKTtcbiAgICBsaW5lcy5wdXNoKGAke2luZGVudH0tICR7dGFza1ByZWZpeChub2RlLnRhc2spfSR7bm9kZS5pY29uID8gYCR7bm9kZS5pY29ufSBgIDogXCJcIn0ke2ZpcnN0VGV4dH0ke3RhZ3N9JHtsaW5rfWApO1xuICAgIGJsb2Nrcy5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gZmlyc3RUZXh0KS5mb3JFYWNoKCh2YWx1ZSkgPT4gbGluZXMucHVzaChgJHtpbmRlbnR9ICAke3ZhbHVlfWApKTtcbiAgICBpZiAobm9kZS5ub3RlKSBsaW5lcy5wdXNoKGAke2luZGVudH0gID4gJHtub2RlLm5vdGUucmVwbGFjZUFsbChcIlxcblwiLCBcIiBcIil9YCk7XG4gICAgaWYgKG5vZGUuc3VibWFwKSBsaW5lcy5wdXNoKGAke2luZGVudH0gID4gXHU1QjUwXHU1QkZDXHU1NkZFXHVGRjFBW1ske25vZGUuc3VibWFwLnBhdGh9XV1gKTtcbiAgICBpZiAobm9kZS50YWJsZSkgbGluZXMucHVzaChcIlwiLCAuLi50YWJsZVRvTWFya2Rvd24obm9kZS50YWJsZSkuc3BsaXQoXCJcXG5cIikubWFwKChsaW5lKSA9PiBgJHtpbmRlbnR9ICAke2xpbmV9YCksIFwiXCIpO1xuICAgIGlmIChub2RlLmNvZGUpIGxpbmVzLnB1c2goYCR7aW5kZW50fSAgXFxgXFxgXFxgJHtub2RlLmNvZGUubGFuZ3VhZ2UgPz8gXCJcIn1gLCAuLi5ub2RlLmNvZGUuY29kZS5zcGxpdChcIlxcblwiKS5tYXAoKGxpbmUpID0+IGAke2luZGVudH0gICR7bGluZX1gKSwgYCR7aW5kZW50fSAgXFxgXFxgXFxgYCk7XG4gICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIGRlcHRoICsgMSkpO1xuICB9O1xuICBkb2Mucm9vdC5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIDEpKTtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVGFza1RleHQodmFsdWU6IHN0cmluZyk6IHsgdGV4dDogc3RyaW5nOyB0YXNrPzogVGFza1N0YXR1cyB9IHtcbiAgY29uc3QgbWF0Y2ggPSB2YWx1ZS5tYXRjaCgvXlxcWyggfHh8WHwtKVxcXVxccysoLispJC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4geyB0ZXh0OiB2YWx1ZSB9O1xuICBjb25zdCBtYXJrZXIgPSBtYXRjaFsxXTtcbiAgY29uc3QgdGFzazogVGFza1N0YXR1cyA9IG1hcmtlciA9PT0gXCJ4XCIgfHwgbWFya2VyID09PSBcIlhcIiA/IFwiZG9uZVwiIDogbWFya2VyID09PSBcIi1cIiA/IFwiZG9pbmdcIiA6IFwidG9kb1wiO1xuICByZXR1cm4geyB0ZXh0OiBtYXRjaFsyXT8udHJpbSgpIHx8IFwiXHU0RUZCXHU1MkExXCIsIHRhc2sgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcmtkb3duVG9Eb2N1bWVudChtYXJrZG93bjogc3RyaW5nLCBmYWxsYmFja1RpdGxlID0gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik6IE1pbmRNYXBEb2N1bWVudCB7XG4gIGNvbnN0IGRvYyA9IGNyZWF0ZURlZmF1bHREb2N1bWVudChmYWxsYmFja1RpdGxlKTtcbiAgZG9jLnJvb3QuY2hpbGRyZW4gPSBbXTtcbiAgY29uc3Qgc3RhY2s6IEFycmF5PHsgbGV2ZWw6IG51bWJlcjsgbm9kZTogTWluZE1hcE5vZGUgfT4gPSBbeyBsZXZlbDogMCwgbm9kZTogZG9jLnJvb3QgfV07XG4gIGxldCByb290QXNzaWduZWQgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IHJhd0xpbmUgb2YgbWFya2Rvd24uc3BsaXQoL1xccj9cXG4vKSkge1xuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW1FbmQoKTtcbiAgICBpZiAoIWxpbmUudHJpbSgpIHx8IGxpbmUudHJpbVN0YXJ0KCkuc3RhcnRzV2l0aChcIi0tLVwiKSB8fCBsaW5lLnRyaW1TdGFydCgpLnN0YXJ0c1dpdGgoXCJgYGBcIikgfHwgL15cXHMqPi8udGVzdChsaW5lKSkgY29udGludWU7XG5cbiAgICBjb25zdCBoZWFkaW5nID0gbGluZS5tYXRjaCgvXlxccyooI3sxLDZ9KVxccysoLis/KVxccyokLyk7XG4gICAgY29uc3QgYnVsbGV0ID0gbGluZS5tYXRjaCgvXihcXHMqKVstKitdXFxzKyguKz8pXFxzKiQvKTtcbiAgICBjb25zdCBudW1iZXJlZCA9IGxpbmUubWF0Y2goL14oXFxzKilcXGQrWy4pXVxccysoLis/KVxccyokLyk7XG5cbiAgICBpZiAoaGVhZGluZykge1xuICAgICAgY29uc3QgbGV2ZWwgPSBoZWFkaW5nWzFdPy5sZW5ndGggPz8gMTtcbiAgICAgIGNvbnN0IHRleHQgPSBoZWFkaW5nWzJdPy50cmltKCkgPz8gXCJcdTgyODJcdTcwQjlcIjtcbiAgICAgIGlmIChsZXZlbCA9PT0gMSAmJiAhcm9vdEFzc2lnbmVkKSB7XG4gICAgICAgIGRvYy5yb290LnRleHQgPSB0ZXh0O1xuICAgICAgICBkb2MudGl0bGUgPSB0ZXh0O1xuICAgICAgICByb290QXNzaWduZWQgPSB0cnVlO1xuICAgICAgICBzdGFjay5sZW5ndGggPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IGNyZWF0ZU5vZGUodGV4dCk7XG4gICAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAxICYmIChzdGFjay5hdCgtMSk/LmxldmVsID8/IDApID49IGxldmVsKSBzdGFjay5wb3AoKTtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gc3RhY2suYXQoLTEpPy5ub2RlID8/IGRvYy5yb290O1xuICAgICAgICBwYXJlbnQuY2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgICAgc3RhY2sucHVzaCh7IGxldmVsLCBub2RlIH0pO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdE1hdGNoID0gYnVsbGV0ID8/IG51bWJlcmVkO1xuICAgIGlmIChsaXN0TWF0Y2gpIHtcbiAgICAgIGNvbnN0IHNwYWNlcyA9IChsaXN0TWF0Y2hbMV0gPz8gXCJcIikucmVwbGFjZUFsbChcIlxcdFwiLCBcIiAgXCIpLmxlbmd0aDtcbiAgICAgIGNvbnN0IGxldmVsID0gTWF0aC5mbG9vcihzcGFjZXMgLyAyKSArIDI7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVRhc2tUZXh0KChsaXN0TWF0Y2hbMl0gPz8gXCJcdTgyODJcdTcwQjlcIikudHJpbSgpKTtcbiAgICAgIGNvbnN0IG5vZGUgPSBjcmVhdGVOb2RlKHBhcnNlZC50ZXh0KTtcbiAgICAgIG5vZGUudGFzayA9IHBhcnNlZC50YXNrO1xuICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDEgJiYgKHN0YWNrLmF0KC0xKT8ubGV2ZWwgPz8gMCkgPj0gbGV2ZWwpIHN0YWNrLnBvcCgpO1xuICAgICAgY29uc3QgcGFyZW50ID0gc3RhY2suYXQoLTEpPy5ub2RlID8/IGRvYy5yb290O1xuICAgICAgcGFyZW50LmNoaWxkcmVuLnB1c2gobm9kZSk7XG4gICAgICBzdGFjay5wdXNoKHsgbGV2ZWwsIG5vZGUgfSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFkb2Mucm9vdC5jaGlsZHJlbi5sZW5ndGgpIGRvYy5yb290LmNoaWxkcmVuLnB1c2goY3JlYXRlTm9kZShcIlx1NEUzQlx1OTg5OCAxXCIpKTtcbiAgcmV0dXJuIGRvYztcbn1cbiIsICJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIE1pbmRNYXBTdHVkaW9QbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHR5cGUge1xuICBCYWNrZ3JvdW5kUGF0dGVybixcbiAgRWRnZVN0eWxlLFxuICBGb250RmFtaWx5TW9kZSxcbiAgTGF5b3V0TW9kZSxcbiAgTWluZE1hcEFwcGVhcmFuY2UsXG4gIE5vZGVTaGFwZSxcbiAgVGhlbWVNb2RlXG59IGZyb20gXCIuL21vZGVsXCI7XG5cbmV4cG9ydCB0eXBlIEltYWdlSG9zdEJvZHlNb2RlID0gXCJtdWx0aXBhcnRcIiB8IFwicmF3XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFN0dWRpb1NldHRpbmdzIHtcbiAgZGVmYXVsdEZvbGRlcjogc3RyaW5nO1xuICBmaWxlUHJlZml4OiBzdHJpbmc7XG4gIGFzc2V0Rm9sZGVyOiBzdHJpbmc7XG4gIGRlZmF1bHRMYXlvdXQ6IExheW91dE1vZGU7XG4gIGRlZmF1bHRUaGVtZTogVGhlbWVNb2RlO1xuICBkZWZhdWx0Tm9kZVNoYXBlOiBOb2RlU2hhcGU7XG4gIHJlZGlyZWN0TGVnYWN5RmlsZXM6IGJvb2xlYW47XG4gIHNob3dHcmlkOiBib29sZWFuO1xuICBzaG93VGFza1Byb2dyZXNzOiBib29sZWFuO1xuICBhdXRvRml0T25PcGVuOiBib29sZWFuO1xuICBoaXN0b3J5TGltaXQ6IG51bWJlcjtcbiAgZW1iZWRNYXhIZWlnaHQ6IG51bWJlcjtcbiAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIGJhY2tncm91bmRQYXR0ZXJuOiBCYWNrZ3JvdW5kUGF0dGVybjtcbiAgYmFja2dyb3VuZFBhdHRlcm5Db2xvcjogc3RyaW5nO1xuICBmb250RmFtaWx5OiBGb250RmFtaWx5TW9kZTtcbiAgY3VzdG9tRm9udDogc3RyaW5nO1xuICBmb250U2l6ZTogbnVtYmVyO1xuICBlZGdlQ29sb3I6IHN0cmluZztcbiAgZWRnZVdpZHRoOiBudW1iZXI7XG4gIGVkZ2VTdHlsZTogRWRnZVN0eWxlO1xuICBub2RlQmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHRleHRDb2xvcjogc3RyaW5nO1xuICBub2RlQm9yZGVyQ29sb3I6IHN0cmluZztcbiAgbm9kZUJvcmRlcldpZHRoOiBudW1iZXI7XG4gIGRlZmF1bHRUZXh0Qm9sZDogYm9vbGVhbjtcbiAgZGVmYXVsdFRleHRJdGFsaWM6IGJvb2xlYW47XG4gIGRlZmF1bHRUZXh0VW5kZXJsaW5lOiBib29sZWFuO1xuICBpbWFnZUhvc3RFbmRwb2ludDogc3RyaW5nO1xuICBpbWFnZUhvc3RNZXRob2Q6IHN0cmluZztcbiAgaW1hZ2VIb3N0Qm9keU1vZGU6IEltYWdlSG9zdEJvZHlNb2RlO1xuICBpbWFnZUhvc3RGaWVsZE5hbWU6IHN0cmluZztcbiAgaW1hZ2VIb3N0SGVhZGVyczogc3RyaW5nO1xuICBpbWFnZUhvc3RSZXNwb25zZVBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE1pbmRNYXBTdHVkaW9TZXR0aW5ncyA9IHtcbiAgZGVmYXVsdEZvbGRlcjogXCJcIixcbiAgZmlsZVByZWZpeDogXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIixcbiAgYXNzZXRGb2xkZXI6IFwiTWluZE1hcCBBc3NldHNcIixcbiAgZGVmYXVsdExheW91dDogXCJyaWdodFwiLFxuICBkZWZhdWx0VGhlbWU6IFwiYXV0b1wiLFxuICBkZWZhdWx0Tm9kZVNoYXBlOiBcInJvdW5kZWRcIixcbiAgcmVkaXJlY3RMZWdhY3lGaWxlczogdHJ1ZSxcbiAgc2hvd0dyaWQ6IHRydWUsXG4gIHNob3dUYXNrUHJvZ3Jlc3M6IHRydWUsXG4gIGF1dG9GaXRPbk9wZW46IHRydWUsXG4gIGhpc3RvcnlMaW1pdDogMTIwLFxuICBlbWJlZE1heEhlaWdodDogNTIwLFxuICBiYWNrZ3JvdW5kQ29sb3I6IFwiXCIsXG4gIGJhY2tncm91bmRQYXR0ZXJuOiBcImdyaWRcIixcbiAgYmFja2dyb3VuZFBhdHRlcm5Db2xvcjogXCIjOTRhM2I4XCIsXG4gIGZvbnRGYW1pbHk6IFwib2JzaWRpYW5cIixcbiAgY3VzdG9tRm9udDogXCJcIixcbiAgZm9udFNpemU6IDE0LFxuICBlZGdlQ29sb3I6IFwiXCIsXG4gIGVkZ2VXaWR0aDogMi4yLFxuICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gIG5vZGVCYWNrZ3JvdW5kQ29sb3I6IFwiXCIsXG4gIHRleHRDb2xvcjogXCJcIixcbiAgbm9kZUJvcmRlckNvbG9yOiBcIlwiLFxuICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gIGRlZmF1bHRUZXh0Qm9sZDogZmFsc2UsXG4gIGRlZmF1bHRUZXh0SXRhbGljOiBmYWxzZSxcbiAgZGVmYXVsdFRleHRVbmRlcmxpbmU6IGZhbHNlLFxuICBpbWFnZUhvc3RFbmRwb2ludDogXCJcIixcbiAgaW1hZ2VIb3N0TWV0aG9kOiBcIlBPU1RcIixcbiAgaW1hZ2VIb3N0Qm9keU1vZGU6IFwibXVsdGlwYXJ0XCIsXG4gIGltYWdlSG9zdEZpZWxkTmFtZTogXCJmaWxlXCIsXG4gIGltYWdlSG9zdEhlYWRlcnM6IFwiXCIsXG4gIGltYWdlSG9zdFJlc3BvbnNlUGF0aDogXCJkYXRhLnVybFwiXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0dGluZ3NUb0FwcGVhcmFuY2Uoc2V0dGluZ3M6IE1pbmRNYXBTdHVkaW9TZXR0aW5ncyk6IE1pbmRNYXBBcHBlYXJhbmNlIHtcbiAgcmV0dXJuIHtcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IHNldHRpbmdzLmJhY2tncm91bmRDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgYmFja2dyb3VuZFBhdHRlcm46IHNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuLFxuICAgIHBhdHRlcm5Db2xvcjogc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm5Db2xvciB8fCB1bmRlZmluZWQsXG4gICAgZm9udEZhbWlseTogc2V0dGluZ3MuZm9udEZhbWlseSxcbiAgICBjdXN0b21Gb250OiBzZXR0aW5ncy5jdXN0b21Gb250LnRyaW0oKSB8fCB1bmRlZmluZWQsXG4gICAgZm9udFNpemU6IHNldHRpbmdzLmZvbnRTaXplLFxuICAgIGVkZ2VDb2xvcjogc2V0dGluZ3MuZWRnZUNvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICBlZGdlV2lkdGg6IHNldHRpbmdzLmVkZ2VXaWR0aCxcbiAgICBlZGdlU3R5bGU6IHNldHRpbmdzLmVkZ2VTdHlsZSxcbiAgICBub2RlQ29sb3I6IHNldHRpbmdzLm5vZGVCYWNrZ3JvdW5kQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIHRleHRDb2xvcjogc2V0dGluZ3MudGV4dENvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICBub2RlQm9yZGVyQ29sb3I6IHNldHRpbmdzLm5vZGVCb3JkZXJDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgbm9kZUJvcmRlcldpZHRoOiBzZXR0aW5ncy5ub2RlQm9yZGVyV2lkdGgsXG4gICAgYm9sZDogc2V0dGluZ3MuZGVmYXVsdFRleHRCb2xkLFxuICAgIGl0YWxpYzogc2V0dGluZ3MuZGVmYXVsdFRleHRJdGFsaWMsXG4gICAgdW5kZXJsaW5lOiBzZXR0aW5ncy5kZWZhdWx0VGV4dFVuZGVybGluZVxuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgTWluZE1hcFN0dWRpb1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW47XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogTWluZE1hcFN0dWRpb1BsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIk1pbmRNYXAgU3R1ZGlvXCIgfSk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIixcbiAgICAgIHRleHQ6IFwiXHU4RkQ5XHU5MUNDXHU4QkJFXHU3RjZFXHU1MTY4XHU1QzQwXHU5RUQ4XHU4QkE0XHU1OTE2XHU4OUMyXHUzMDAyXHU2MjUzXHU1RjAwXHU4MTExXHU1NkZFXHU1NDBFXHVGRjBDXHU0RTVGXHU1M0VGXHU0RUU1XHU3MEI5XHU1MUZCXHU1REU1XHU1MTc3XHU2ODBGXHU0RTJEXHU3Njg0XHU4QzAzXHU4MjcyXHU2NzdGXHVGRjBDXHU0RTNBXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU1MzU1XHU3MkVDXHU0RkREXHU1QjU4XHU0RTAwXHU1OTU3XHU2ODM3XHU1RjBGXHUzMDAyXCJcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NjU4N1x1NEVGNlx1NEUwRVx1NUUwM1x1NUM0MFwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NEZERFx1NUI1OFx1NjU4N1x1NEVGNlx1NTkzOVwiKVxuICAgICAgLnNldERlc2MoXCJcdTc1NTlcdTdBN0FcdTY1RjZcdTRGRERcdTVCNThcdTU3MjhcdTVGNTNcdTUyNERcdTdCMTRcdThCQjBcdTYyNDBcdTU3MjhcdTY1ODdcdTRFRjZcdTU5MzlcdUZGMUJcdTRFNUZcdTUzRUZcdTU4NkJcdTUxOTlcdTRGOEJcdTU5ODIgTWluZCBNYXBzXHUzMDAyXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJNaW5kIE1hcHNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Rm9sZGVyID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1OEJFNVx1OERFRlx1NUY4NFx1NzZGOFx1NUJGOVx1NEU4RVx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NjI0MFx1NTcyOFx1NzZFRVx1NUY1NVx1MzAwMlx1N0M5OFx1OEQzNFx1NTZGRVx1NzI0N1x1NEYxQVx1NEZERFx1NUI1OFx1NTIzMFx1MjAxQ1x1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NzZFRVx1NUY1NS9cdThCRTVcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcdTU5MzkvXHUyMDFEXHVGRjFCXHU1QjUwXHU1QkZDXHU1NkZFXHU0RjFBXHU0RkREXHU1QjU4XHU1NzI4XHUyMDFDXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU3NkVFXHU1RjU1L1x1OEJFNVx1OEQ0NFx1NkU5MFx1NjU4N1x1NEVGNlx1NTkzOS9cdTcyMzZcdTVCRkNcdTU2RkVcdTU0MERcdTc5RjAvXHUyMDFEXHU0RTJEXHUzMDAyXHU5RUQ4XHU4QkE0XHU0RjdGXHU3NTI4IE1pbmRNYXAgQXNzZXRzXHUzMDAyXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJNaW5kTWFwIEFzc2V0c1wiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NldEZvbGRlciA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKSB8fCBcIk1pbmRNYXAgQXNzZXRzXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NzI0N1x1NEUwRVx1NTZGRVx1NUU4QVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NTZGRVx1NUU4QVx1NEUwQVx1NEYyMFx1NTczMFx1NTc0MFwiKVxuICAgICAgLnNldERlc2MoXCJcdTUzRUZcdTkwMDlcdTMwMDJcdTU4NkJcdTUxOTlcdTY1MkZcdTYzMDEgSFRUUCBcdTRFMEFcdTRGMjBcdTc2ODQgQVBJIFx1NTczMFx1NTc0MFx1RkYxQlx1NjcyQVx1OTE0RFx1N0Y2RVx1NjVGNlx1RkYwQ1x1MjAxOFx1NEUwQVx1NEYyMFx1NTIzMFx1NTZGRVx1NUU4QVx1MjAxOVx1NjMwOVx1OTRBRVx1NEYxQVx1NjNEMFx1NzkzQVx1NTE0OFx1OTE0RFx1N0Y2RVx1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9hcGkvdXBsb2FkXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RFbmRwb2ludClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RFbmRwb2ludCA9IHZhbHVlLnRyaW0oKTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTRFMEFcdTRGMjBcdThCRjdcdTZDNDJcdTY1QjlcdTZDRDVcIilcbiAgICAgIC5zZXREZXNjKFwiXHU3RUREXHU1OTI3XHU1OTFBXHU2NTcwXHU1NkZFXHU1RThBXHU0RjdGXHU3NTI4IFBPU1RcdUZGMENcdTVDMTFcdTY1NzBcdTVCRjlcdThDNjFcdTVCNThcdTUwQThcdTRFMEFcdTRGMjBcdTYzQTVcdTUzRTNcdTRGN0ZcdTc1MjggUFVUXHUzMDAyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwiUE9TVFwiLCBcIlBPU1RcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIlBVVFwiLCBcIlBVVFwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0TWV0aG9kKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlSG9zdE1ldGhvZCA9IHZhbHVlOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NEUwQVx1NEYyMFx1OEJGN1x1NkM0Mlx1NjgzQ1x1NUYwRlwiKVxuICAgICAgLnNldERlc2MoXCJcdTU5MjdcdTU5MUFcdTY1NzBcdTU2RkVcdTVFOEFcdTRGN0ZcdTc1MjggbXVsdGlwYXJ0L2Zvcm0tZGF0YVx1RkYxQlx1NUMxMVx1NjU3MFx1NjNBNVx1NTNFM1x1NzZGNFx1NjNBNVx1NjNBNVx1NjUzNlx1NTZGRVx1NzI0N1x1NEU4Q1x1OEZEQlx1NTIzNlx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcIm11bHRpcGFydFwiLCBcIm11bHRpcGFydC9mb3JtLWRhdGFcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInJhd1wiLCBcIlx1NTM5Rlx1NTlDQlx1NEU4Q1x1OEZEQlx1NTIzNlwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0Qm9keU1vZGUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0Qm9keU1vZGUgPSB2YWx1ZSBhcyBJbWFnZUhvc3RCb2R5TW9kZTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTY1ODdcdTRFRjZcdTVCNTdcdTZCQjVcdTU0MERcIilcbiAgICAgIC5zZXREZXNjKFwibXVsdGlwYXJ0IFx1NkEyMVx1NUYwRlx1NEUwQlx1NTZGRVx1NzI0N1x1NUI1N1x1NkJCNVx1NzY4NFx1NTQwRFx1NzlGMFx1RkYwQ1x1NUUzOFx1ODlDMVx1NTAzQ1x1NEUzQSBmaWxlXHUzMDAxaW1hZ2UgXHU2MjE2IHNvdXJjZVx1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiZmlsZVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0RmllbGROYW1lKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlSG9zdEZpZWxkTmFtZSA9IHZhbHVlLnRyaW0oKSB8fCBcImZpbGVcIjsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTgxRUFcdTVCOUFcdTRFNDlcdThCRjdcdTZDNDJcdTU5MzRcdUZGMDhKU09OXHVGRjA5XCIpXG4gICAgICAuc2V0RGVzYygnXHU0RjhCXHU1OTgyIHtcIkF1dGhvcml6YXRpb25cIjpcIkJlYXJlciB0b2tlblwifVx1MzAwMlx1NjU0Rlx1NjExRlx1NEVFNFx1NzI0Q1x1NEYxQVx1NEZERFx1NUI1OFx1NTcyOFx1NjNEMlx1NEVGNiBkYXRhLmpzb24gXHU0RTJEXHVGRjBDXHU4QkY3XHU1M0VBXHU1NzI4XHU1M0VGXHU0RkUxXHU0RUQzXHU1RTkzXHU0RTJEXHU0RjdGXHU3NTI4XHUzMDAyJylcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ3tcIkF1dGhvcml6YXRpb25cIjpcIkJlYXJlciAuLi5cIn0nKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0SGVhZGVycylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RIZWFkZXJzID0gdmFsdWUudHJpbSgpOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NTRDRFx1NUU5NFx1NTZGRVx1NzI0N1x1NTczMFx1NTc0MFx1NUI1N1x1NkJCNVwiKVxuICAgICAgLnNldERlc2MoXCJcdTc1MjhcdTcwQjlcdTUzRjdcdThCRkJcdTUzRDYgSlNPTiBcdThGRDRcdTU2REVcdTUwM0NcdUZGMENcdTRGOEJcdTU5ODIgZGF0YS51cmxcdTMwMDFyZXN1bHQuaW1hZ2VcdUZGMUJcdTc1NTlcdTdBN0FcdTY1RjZcdTgxRUFcdTUyQThcdTVDMURcdThCRDVcdTVFMzhcdTg5QzFcdTVCNTdcdTZCQjVcdTMwMDJcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImRhdGEudXJsXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RSZXNwb25zZVBhdGgpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0UmVzcG9uc2VQYXRoID0gdmFsdWUudHJpbSgpOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NjVCMFx1NjU4N1x1NEVGNlx1NTQwRFx1NTI0RFx1N0YwMFwiKVxuICAgICAgLnNldERlc2MoXCJcdTY1QjBcdTVFRkFcdTgxMTFcdTU2RkVcdTY1RjZcdTRGN0ZcdTc1MjhcdUZGMUFcdTUyNERcdTdGMDAgKyBcdTY1RTVcdTY3MUZcdTY1RjZcdTk1RjRcdTMwMDJcdTY1ODdcdTRFRjZcdTU0MEVcdTdGMDBcdTU2RkFcdTVCOUFcdTRFM0EgLm1pbmRtYXBcdTMwMDJcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZVByZWZpeClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZpbGVQcmVmaXggPSB2YWx1ZS50cmltKCkgfHwgXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NUUwM1x1NUM0MFwiKVxuICAgICAgLnNldERlc2MoXCJcdTUzNTVcdTRGQTdcdTkwMDJcdTU0MDhcdTZENDFcdTdBMEJcdTYyQzZcdTg5RTNcdUZGMENcdTUzQ0NcdTRGQTdcdTkwMDJcdTU0MDhcdTU5MzRcdTgxMTFcdTk4Q0VcdTY2QjRcdTMwMDJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJyaWdodFwiLCBcIlx1NTQxMVx1NTNGM1x1NUM1NVx1NUYwMFwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiYmFsYW5jZWRcIiwgXCJcdTVERTZcdTUzRjNcdTVFNzNcdTg4NjFcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0TGF5b3V0ID0gdmFsdWUgYXMgTGF5b3V0TW9kZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NEUzQlx1OTg5OFwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcImF1dG9cIiwgXCJcdThEREZcdTk2OEYgT2JzaWRpYW5cIilcbiAgICAgICAgLmFkZE9wdGlvbihcImxpZ2h0XCIsIFwiXHU2RDQ1XHU4MjcyXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJkYXJrXCIsIFwiXHU2REYxXHU4MjcyXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGhlbWUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGhlbWUgPSB2YWx1ZSBhcyBUaGVtZU1vZGU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NzUzQlx1NUUwM1x1ODBDQ1x1NjY2RlwiIH0pO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTgwQ0NcdTY2NkZcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU4RERGXHU5NjhGIE9ic2lkaWFuIFx1NUY1M1x1NTI0RFx1NEUzQlx1OTg5OFx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZENvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2tncm91bmRDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjZjhmYWZjXCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1ODBDQ1x1NjY2Rlx1NTZGRVx1Njg0OFwiKVxuICAgICAgLnNldERlc2MoXCJcdTUzRUZcdTkwMDlcdTYyRTlcdTdGNTFcdTY4M0NcdTMwMDFcdTcwQjlcdTk2MzVcdTYyMTZcdTdFQUZcdTgyNzJcdTgwQ0NcdTY2NkZcdTMwMDJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJub25lXCIsIFwiXHU2NUUwXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJncmlkXCIsIFwiXHU3RjUxXHU2ODNDXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJkb3RzXCIsIFwiXHU3MEI5XHU5NjM1XCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuID0gdmFsdWUgYXMgQmFja2dyb3VuZFBhdHRlcm47XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0dyaWQgPSB2YWx1ZSAhPT0gXCJub25lXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBcIlx1ODBDQ1x1NjY2Rlx1NTZGRVx1Njg0OFx1OTg5Q1x1ODI3MlwiLFxuICAgICAgXCJcdTYzQTdcdTUyMzZcdTdGNTFcdTY4M0NcdTdFQkZcdTYyMTZcdTcwQjlcdTk2MzVcdTc2ODRcdTk4OUNcdTgyNzJcdTMwMDJcIixcbiAgICAgICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm5Db2xvciA9IHZhbHVlIHx8IFwiIzk0YTNiOFwiOyB9LFxuICAgICAgXCIjOTRhM2I4XCIsXG4gICAgICBmYWxzZVxuICAgICk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTVCNTdcdTRGNTNcdTRFMEVcdTY1ODdcdTVCNTdcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTVCNTdcdTRGNTNcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJvYnNpZGlhblwiLCBcIlx1OERERlx1OTY4RiBPYnNpZGlhblwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwic2Fuc1wiLCBcIlx1NjVFMFx1ODg2Q1x1N0VCRlx1NUI1N1x1NEY1M1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwic2VyaWZcIiwgXCJcdTg4NkNcdTdFQkZcdTVCNTdcdTRGNTNcIilcbiAgICAgICAgLmFkZE9wdGlvbihcIm1vbm9cIiwgXCJcdTdCNDlcdTVCQkRcdTVCNTdcdTRGNTNcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImN1c3RvbVwiLCBcIlx1ODFFQVx1NUI5QVx1NEU0OVx1NUI1N1x1NEY1M1wiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udEZhbWlseSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbnRGYW1pbHkgPSB2YWx1ZSBhcyBGb250RmFtaWx5TW9kZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pKTtcblxuICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250RmFtaWx5ID09PSBcImN1c3RvbVwiKSB7XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJcdTgxRUFcdTVCOUFcdTRFNDlcdTVCNTdcdTRGNTNcdTU0MERcdTc5RjBcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTU4NkJcdTUxOTlcdTdDRkJcdTdFREZcdTRFMkRcdTVERjJcdTdFQ0ZcdTVCODlcdTg4QzVcdTc2ODRcdTVCNTdcdTRGNTNcdTU0MERcdTc5RjBcdUZGMENcdTRGOEJcdTU5ODIgTWljcm9zb2Z0IFlhSGVpXHUzMDAxUGluZ0ZhbmcgU0NcdTMwMDJcIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJNaWNyb3NvZnQgWWFIZWlcIilcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY3VzdG9tRm9udClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jdXN0b21Gb250ID0gdmFsdWUudHJpbSgpLnNsaWNlKDAsIDEyMCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTVCNTdcdTUzRjdcIilcbiAgICAgIC5zZXREZXNjKFwiXHU4MzAzXHU1NkY0IDEwXHUyMDEzMzAgXHU1MENGXHU3RDIwXHUzMDAyXHU4MjgyXHU3MEI5XHU0RUNEXHU1M0VGXHU1MzU1XHU3MkVDXHU4OTg2XHU3NkQ2XHU1QjU3XHU1M0Y3XHUzMDAyXCIpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDEwLCAzMCwgMSlcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbnRTaXplKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udFNpemUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU5RUQ4XHU4QkE0XHU2NTg3XHU1QjU3XHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NzU1OVx1N0E3QVx1NjVGNlx1NEY3Rlx1NzUyOCBPYnNpZGlhbiBcdTRFM0JcdTk4OThcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcdUZGMUJcdTY4MzlcdTgyODJcdTcwQjlcdTRFQ0RcdTRGMThcdTUxNDhcdTRGN0ZcdTc1MjhcdTRFM0JcdTk4OThcdTVGM0FcdThDMDNcdTgyNzJcdTc2ODRcdTVCRjlcdTZCRDRcdTY1ODdcdTVCNTdcdTMwMDJcIixcbiAgICAgICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzLnRleHRDb2xvcixcbiAgICAgIGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZXh0Q29sb3IgPSB2YWx1ZTsgfSxcbiAgICAgIFwiIzBmMTcyYVwiXG4gICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTY1ODdcdTVCNTdcdTUyQTBcdTdDOTdcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGV4dEJvbGQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGV4dEJvbGQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTY1ODdcdTVCNTdcdTY1OUNcdTRGNTNcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGV4dEl0YWxpYylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0SXRhbGljID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU2NTg3XHU1QjU3XHU0RTBCXHU1MjEyXHU3RUJGXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRleHRVbmRlcmxpbmUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGV4dFVuZGVybGluZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU4MjgyXHU3MEI5XHU2ODM3XHU1RjBGXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU4MjgyXHU3MEI5XHU1RjYyXHU3MkI2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTNFQVx1NUY3MVx1NTRDRFx1NjcyQVx1NTM1NVx1NzJFQ1x1OEJCRVx1N0Y2RVx1NUY2Mlx1NzJCNlx1NzY4NFx1ODI4Mlx1NzBCOVx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcInJvdW5kZWRcIiwgXCJcdTU3MDZcdTg5RDJcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInBpbGxcIiwgXCJcdTgwRjZcdTU2Q0FcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInJlY3RhbmdsZVwiLCBcIlx1NzZGNFx1ODlEMlwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdE5vZGVTaGFwZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHROb2RlU2hhcGUgPSB2YWx1ZSBhcyBOb2RlU2hhcGU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBcIlx1OUVEOFx1OEJBNFx1ODI4Mlx1NzBCOVx1ODBDQ1x1NjY2Rlx1ODI3MlwiLFxuICAgICAgXCJcdTc1NTlcdTdBN0FcdTY1RjZcdThEREZcdTk2OEYgT2JzaWRpYW4gXHU0RTNCXHU5ODk4XHUzMDAyXHU1MzU1XHU0RTJBXHU4MjgyXHU3MEI5XHU4QkJFXHU3RjZFXHU3Njg0XHU5ODlDXHU4MjcyXHU0RjE4XHU1MTQ4XHU3RUE3XHU2NkY0XHU5QUQ4XHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub2RlQmFja2dyb3VuZENvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCYWNrZ3JvdW5kQ29sb3IgPSB2YWx1ZTsgfSxcbiAgICAgIFwiI2ZmZmZmZlwiXG4gICAgKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU5RUQ4XHU4QkE0XHU4MjgyXHU3MEI5XHU4RkI5XHU2ODQ2XHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NzU1OVx1N0E3QVx1NjVGNlx1OERERlx1OTY4RiBPYnNpZGlhbiBcdTRFM0JcdTk4OThcdThGQjlcdTY4NDZcdTk4OUNcdTgyNzJcdTMwMDJcIixcbiAgICAgICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCb3JkZXJDb2xvcixcbiAgICAgIGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub2RlQm9yZGVyQ29sb3IgPSB2YWx1ZTsgfSxcbiAgICAgIFwiIzk0YTNiOFwiXG4gICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTgyODJcdTcwQjlcdThGQjlcdTY4NDZcdTdDOTdcdTdFQzZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU4MzAzXHU1NkY0IDBcdTIwMTM2IFx1NTBDRlx1N0QyMFx1RkYxQjAgXHU4ODY4XHU3OTNBXHU2NUUwXHU4RkI5XHU2ODQ2XHUzMDAyXCIpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDAsIDYsIDAuNSlcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCb3JkZXJXaWR0aClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCb3JkZXJXaWR0aCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU4RkRFXHU3RUJGXHU2ODM3XHU1RjBGXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4RkRFXHU3RUJGXHU3QzdCXHU1NzhCXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwiY3VydmVkXCIsIFwiXHU2NkYyXHU3RUJGXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJzdHJhaWdodFwiLCBcIlx1NzZGNFx1N0VCRlwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiZWxib3dcIiwgXCJcdTYyOThcdTdFQkZcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VTdHlsZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VTdHlsZSA9IHZhbHVlIGFzIEVkZ2VTdHlsZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU4RkRFXHU3RUJGXHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NzU1OVx1N0E3QVx1NjVGNlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEUzQlx1OTg5OFx1NUYzQVx1OEMwM1x1ODI3Mlx1MzAwMlx1ODI4Mlx1NzBCOVx1NTM1NVx1NzJFQ1x1OEJCRVx1N0Y2RVx1OTg5Q1x1ODI3Mlx1NjVGNlx1RkYwQ1x1NTNFRlx1N0VFN1x1N0VFRFx1NEUzQVx1OEJFNVx1NTIwNlx1NjUyRlx1OEZERVx1N0VCRlx1Nzc0MFx1ODI3Mlx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZUNvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjN2M4YWE1XCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OEZERVx1N0VCRlx1N0M5N1x1N0VDNlwiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMC41XHUyMDEzOCBcdTUwQ0ZcdTdEMjBcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMC41LCA4LCAwLjUpXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlV2lkdGgpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlV2lkdGggPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1N0YxNlx1OEY5MVx1NEUwRVx1NTE3Q1x1NUJCOVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NjI1M1x1NUYwMFx1NjVFN1x1NzI0OFx1ODExMVx1NTZGRVx1NjVGNlx1ODFFQVx1NTJBOFx1OEY2Q1x1NjM2MlwiKVxuICAgICAgLnNldERlc2MoXCJcdTgxRUFcdTUyQThcdTUyMUJcdTVFRkFcdTU0MENcdTU0MEQgLm1pbmRtYXAgXHU2NTg3XHU0RUY2XHU1RTc2XHU2MjUzXHU1RjAwXHVGRjFCXHU2NUU3XHU2NTg3XHU0RUY2XHU0RjFBXHU0RkREXHU3NTU5XHU0RTNBXHU1OTA3XHU0RUZEXHVGRjBDXHU0RTBEXHU0RjFBXHU4OTg2XHU3NkQ2XHU2MjE2XHU1MjIwXHU5NjY0XHUzMDAyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkaXJlY3RMZWdhY3lGaWxlcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZGlyZWN0TGVnYWN5RmlsZXMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NjYzRVx1NzkzQVx1NEVGQlx1NTJBMVx1OEZEQlx1NUVBNlwiKVxuICAgICAgLnNldERlc2MoXCJcdTU3MjhcdTUzMDVcdTU0MkJcdTRFRkJcdTUyQTFcdTc2ODRcdTUyMDZcdTY1MkZcdTgyODJcdTcwQjlcdTVFOTVcdTkwRThcdTY2M0VcdTc5M0FcdTVCOENcdTYyMTBcdTc2N0VcdTUyMDZcdTZCRDRcdTMwMDJcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VGFza1Byb2dyZXNzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1Rhc2tQcm9ncmVzcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NjI1M1x1NUYwMFx1NjVGNlx1ODFFQVx1NTJBOFx1OTAwMlx1NUU5NFx1NzUzQlx1NUUwM1wiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GaXRPbk9wZW4pXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRml0T25PcGVuID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTY0QTRcdTk1MDBcdTUzODZcdTUzRjJcdTZCNjVcdTY1NzBcIilcbiAgICAgIC5zZXREZXNjKFwiXHU4MzAzXHU1NkY0IDIwXHUyMDEzNTAwXHVGRjFCXHU2NTcwXHU1MDNDXHU4RDhBXHU1OTI3XHU1MzYwXHU3NTI4XHU3Njg0XHU1MTg1XHU1QjU4XHU4RDhBXHU1OTFBXHUzMDAyXCIpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDIwLCA1MDAsIDEwKVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaGlzdG9yeUxpbWl0KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaGlzdG9yeUxpbWl0ID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU1RDRDXHU1MTY1XHU5ODg0XHU4OUM4XHU2NzAwXHU1OTI3XHU5QUQ4XHU1RUE2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODMwM1x1NTZGNCAyNDBcdTIwMTMxMjAwIFx1NTBDRlx1N0QyMFx1MzAwMlwiKVxuICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgLnNldExpbWl0cygyNDAsIDEyMDAsIDIwKVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW1iZWRNYXhIZWlnaHQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbWJlZE1heEhlaWdodCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIGFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgZ2V0VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBzZXRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD4sXG4gICAgZmFsbGJhY2s6IHN0cmluZyxcbiAgICBhbGxvd1Jlc2V0ID0gdHJ1ZVxuICApOiB2b2lkIHtcbiAgICBjb25zdCBzZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyKVxuICAgICAgLnNldE5hbWUobmFtZSlcbiAgICAgIC5zZXREZXNjKGRlc2NyaXB0aW9uKVxuICAgICAgLmFkZENvbG9yUGlja2VyKChwaWNrZXIpID0+IHBpY2tlclxuICAgICAgICAuc2V0VmFsdWUoZ2V0VmFsdWUoKSB8fCBmYWxsYmFjaylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHNldFZhbHVlKHZhbHVlKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcbiAgICBpZiAoYWxsb3dSZXNldCkge1xuICAgICAgc2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT4gYnV0dG9uXG4gICAgICAgIC5zZXRCdXR0b25UZXh0KFwiXHU4RERGXHU5NjhGXHU0RTNCXHU5ODk4XCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCBzZXRWYWx1ZShcIlwiKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBbmRSZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMucGx1Z2luLnJlZnJlc2hPcGVuVmlld3MoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IG5vZGVDb250ZW50QmxvY2tzLCBub2RlUGxhaW5UZXh0LCB0eXBlIEVkZ2VTdHlsZSwgdHlwZSBGb250RmFtaWx5TW9kZSwgdHlwZSBMYXlvdXRNb2RlLCB0eXBlIE1pbmRNYXBBcHBlYXJhbmNlLCB0eXBlIE1pbmRNYXBOb2RlLCB0eXBlIE1pbmRNYXBUZXh0UnVuLCB0eXBlIE5vZGVTaGFwZSB9IGZyb20gXCIuL21vZGVsXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9kZVBvc2l0aW9uIHtcbiAgbm9kZTogTWluZE1hcE5vZGU7XG4gIHBhcmVudElkOiBzdHJpbmcgfCBudWxsO1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbiAgZGVwdGg6IG51bWJlcjtcbiAgc2lkZTogLTEgfCAwIHwgMTtcbiAgd2lkdGg6IG51bWJlcjtcbiAgaGVpZ2h0OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGF5b3V0UmVzdWx0IHtcbiAgbm9kZXM6IE5vZGVQb3NpdGlvbltdO1xuICBieUlkOiBNYXA8c3RyaW5nLCBOb2RlUG9zaXRpb24+O1xuICBtaW5YOiBudW1iZXI7XG4gIG1heFg6IG51bWJlcjtcbiAgbWluWTogbnVtYmVyO1xuICBtYXhZOiBudW1iZXI7XG59XG5cbmNvbnN0IFJPT1RfV0lEVEggPSAxOTY7XG5jb25zdCBOT0RFX1dJRFRIID0gMTc2O1xuY29uc3QgSF9HQVAgPSAxMTI7XG5jb25zdCBWX0dBUCA9IDI0O1xuXG5mdW5jdGlvbiB2aXNpYmxlQ2hpbGRyZW4obm9kZTogTWluZE1hcE5vZGUpOiBNaW5kTWFwTm9kZVtdIHtcbiAgcmV0dXJuIG5vZGUuY29sbGFwc2VkID8gW10gOiBub2RlLmNoaWxkcmVuO1xufVxuXG5mdW5jdGlvbiBub2RlRGltZW5zaW9ucyhub2RlOiBNaW5kTWFwTm9kZSwgZGVwdGg6IG51bWJlciwgZGVmYXVsdEZvbnRTaXplID0gMTQpOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0ge1xuICBjb25zdCBmb250U2l6ZSA9IG5vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZTtcbiAgY29uc3QgZXh0cmFXaWR0aCA9IE1hdGgubWF4KDAsIGZvbnRTaXplIC0gMTQpICogNDtcbiAgbGV0IHdpZHRoID0gKGRlcHRoID09PSAwID8gUk9PVF9XSURUSCA6IE5PREVfV0lEVEgpICsgZXh0cmFXaWR0aDtcbiAgbGV0IGhlaWdodCA9IDI4ICsgTWF0aC5tYXgoMCwgZm9udFNpemUgLSAxNCkgKiAxLjQ7XG4gIGNvbnN0IGJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpO1xuICBpZiAoIWJsb2Nrcy5sZW5ndGgpIGhlaWdodCArPSBkZXB0aCA9PT0gMCA/IDM0IDogMjY7XG4gIGZvciAoY29uc3QgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgaWYgKGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikgeyB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCAyNDApOyBoZWlnaHQgKz0gMTMyOyB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCBsZW5ndGggPSBNYXRoLm1heCgxLCBibG9jay50ZXh0Lmxlbmd0aCk7XG4gICAgICB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCBNYXRoLm1pbig0NjAsIDgwICsgTWF0aC5taW4obGVuZ3RoLCA0MikgKiBmb250U2l6ZSAqIDAuNjIpKTtcbiAgICAgIGhlaWdodCArPSBNYXRoLm1heCgzMCwgTWF0aC5jZWlsKGxlbmd0aCAvIDM0KSAqIChmb250U2l6ZSArIDgpKTtcbiAgICB9XG4gIH1cbiAgaWYgKG5vZGUudGFncz8ubGVuZ3RoKSBoZWlnaHQgKz0gMjA7XG4gIGlmIChub2RlLnN1Ym1hcCkgeyB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCAyMjApOyBoZWlnaHQgKz0gMzA7IH1cbiAgaWYgKG5vZGUudGFibGUpIHtcbiAgICBjb25zdCBjb2x1bW5zID0gTWF0aC5tYXgoMSwgbm9kZS50YWJsZS5oZWFkZXJzLmxlbmd0aCk7XG4gICAgY29uc3QgdmlzaWJsZVJvd3MgPSBNYXRoLm1pbigxMCwgbm9kZS50YWJsZS5yb3dzLmxlbmd0aCk7XG4gICAgd2lkdGggPSBNYXRoLm1pbig3MjAsIE1hdGgubWF4KDMwMCwgY29sdW1ucyAqIDEyNCkpO1xuICAgIGhlaWdodCArPSA0MiArIHZpc2libGVSb3dzICogMzEgKyAobm9kZS50YWJsZS5yb3dzLmxlbmd0aCA+IHZpc2libGVSb3dzID8gMjQgOiAwKTtcbiAgfVxuICBpZiAobm9kZS5jb2RlKSB7XG4gICAgY29uc3QgbGluZXMgPSBub2RlLmNvZGUuY29kZS5zcGxpdCgvXFxyP1xcbi8pO1xuICAgIGNvbnN0IGxvbmdlc3QgPSBNYXRoLm1heCgyMCwgLi4ubGluZXMuc2xpY2UoMCwgODApLm1hcCgobGluZSkgPT4gbGluZS5sZW5ndGgpKTtcbiAgICB3aWR0aCA9IE1hdGgubWluKDcyMCwgTWF0aC5tYXgoMzgwLCBsb25nZXN0ICogNy4yICsgNDIpKTtcbiAgICBoZWlnaHQgKz0gTWF0aC5taW4oMzkwLCBNYXRoLm1heCgxMDAsIE1hdGgubWluKGxpbmVzLmxlbmd0aCwgMTgpICogMjAgKyA0OCkpO1xuICB9XG4gIHJldHVybiB7IHdpZHRoLCBoZWlnaHQ6IE1hdGgubWluKDU2MCwgaGVpZ2h0KSB9O1xufVxuXG5mdW5jdGlvbiBzdWJ0cmVlSGVpZ2h0KG5vZGU6IE1pbmRNYXBOb2RlLCBkZXB0aDogbnVtYmVyLCBkZWZhdWx0Rm9udFNpemUgPSAxNCk6IG51bWJlciB7XG4gIGNvbnN0IG93bkhlaWdodCA9IG5vZGVEaW1lbnNpb25zKG5vZGUsIGRlcHRoLCBkZWZhdWx0Rm9udFNpemUpLmhlaWdodDtcbiAgY29uc3QgY2hpbGRyZW4gPSB2aXNpYmxlQ2hpbGRyZW4obm9kZSk7XG4gIGlmICghY2hpbGRyZW4ubGVuZ3RoKSByZXR1cm4gb3duSGVpZ2h0O1xuICBjb25zdCBjaGlsZHJlbkhlaWdodCA9IGNoaWxkcmVuLnJlZHVjZSgoc3VtLCBjaGlsZCkgPT4gc3VtICsgc3VidHJlZUhlaWdodChjaGlsZCwgZGVwdGggKyAxLCBkZWZhdWx0Rm9udFNpemUpLCAwKSArIFZfR0FQICogKGNoaWxkcmVuLmxlbmd0aCAtIDEpO1xuICByZXR1cm4gTWF0aC5tYXgob3duSGVpZ2h0LCBjaGlsZHJlbkhlaWdodCk7XG59XG5cbmZ1bmN0aW9uIGxheW91dEJyYW5jaChcbiAgbm9kZTogTWluZE1hcE5vZGUsXG4gIHBhcmVudElkOiBzdHJpbmcsXG4gIHBhcmVudFg6IG51bWJlcixcbiAgcGFyZW50V2lkdGg6IG51bWJlcixcbiAgc2lkZTogLTEgfCAxLFxuICBkZXB0aDogbnVtYmVyLFxuICBjZW50ZXJZOiBudW1iZXIsXG4gIG91dHB1dDogTm9kZVBvc2l0aW9uW10sXG4gIGRlZmF1bHRGb250U2l6ZSA9IDE0XG4pOiB2b2lkIHtcbiAgY29uc3QgZGltZW5zaW9ucyA9IG5vZGVEaW1lbnNpb25zKG5vZGUsIGRlcHRoLCBkZWZhdWx0Rm9udFNpemUpO1xuICBjb25zdCB4ID0gcGFyZW50WCArIHNpZGUgKiAocGFyZW50V2lkdGggLyAyICsgSF9HQVAgKyBkaW1lbnNpb25zLndpZHRoIC8gMik7XG4gIG91dHB1dC5wdXNoKHsgbm9kZSwgcGFyZW50SWQsIHgsIHk6IGNlbnRlclksIGRlcHRoLCBzaWRlLCAuLi5kaW1lbnNpb25zIH0pO1xuICBjb25zdCBjaGlsZHJlbiA9IHZpc2libGVDaGlsZHJlbihub2RlKTtcbiAgaWYgKCFjaGlsZHJlbi5sZW5ndGgpIHJldHVybjtcblxuICBjb25zdCBoZWlnaHRzID0gY2hpbGRyZW4ubWFwKChjaGlsZCkgPT4gc3VidHJlZUhlaWdodChjaGlsZCwgZGVwdGggKyAxLCBkZWZhdWx0Rm9udFNpemUpKTtcbiAgY29uc3QgdG90YWxIZWlnaHQgPSBoZWlnaHRzLnJlZHVjZSgoc3VtLCBjaGlsZEhlaWdodCkgPT4gc3VtICsgY2hpbGRIZWlnaHQsIDApICsgVl9HQVAgKiAoY2hpbGRyZW4ubGVuZ3RoIC0gMSk7XG4gIGxldCBjdXJzb3IgPSBjZW50ZXJZIC0gdG90YWxIZWlnaHQgLyAyO1xuICBjaGlsZHJlbi5mb3JFYWNoKChjaGlsZCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBjaGlsZEhlaWdodCA9IGhlaWdodHNbaW5kZXhdID8/IG5vZGVEaW1lbnNpb25zKGNoaWxkLCBkZXB0aCArIDEsIGRlZmF1bHRGb250U2l6ZSkuaGVpZ2h0O1xuICAgIGNvbnN0IGNoaWxkQ2VudGVyID0gY3Vyc29yICsgY2hpbGRIZWlnaHQgLyAyO1xuICAgIGxheW91dEJyYW5jaChjaGlsZCwgbm9kZS5pZCwgeCwgZGltZW5zaW9ucy53aWR0aCwgc2lkZSwgZGVwdGggKyAxLCBjaGlsZENlbnRlciwgb3V0cHV0LCBkZWZhdWx0Rm9udFNpemUpO1xuICAgIGN1cnNvciArPSBjaGlsZEhlaWdodCArIFZfR0FQO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMYXlvdXQocm9vdDogTWluZE1hcE5vZGUsIG1vZGU6IExheW91dE1vZGUsIGRlZmF1bHRGb250U2l6ZSA9IDE0KTogTGF5b3V0UmVzdWx0IHtcbiAgY29uc3Qgcm9vdERpbWVuc2lvbnMgPSBub2RlRGltZW5zaW9ucyhyb290LCAwLCBkZWZhdWx0Rm9udFNpemUpO1xuICBjb25zdCBub2RlczogTm9kZVBvc2l0aW9uW10gPSBbXG4gICAgeyBub2RlOiByb290LCBwYXJlbnRJZDogbnVsbCwgeDogMCwgeTogMCwgZGVwdGg6IDAsIHNpZGU6IDAsIC4uLnJvb3REaW1lbnNpb25zIH1cbiAgXTtcbiAgY29uc3QgY2hpbGRyZW4gPSB2aXNpYmxlQ2hpbGRyZW4ocm9vdCk7XG5cbiAgaWYgKG1vZGUgPT09IFwiYmFsYW5jZWRcIiAmJiBjaGlsZHJlbi5sZW5ndGggPiAxKSB7XG4gICAgY29uc3QgbGVmdDogTWluZE1hcE5vZGVbXSA9IFtdO1xuICAgIGNvbnN0IHJpZ2h0OiBNaW5kTWFwTm9kZVtdID0gW107XG4gICAgbGV0IGxlZnRIZWlnaHQgPSAwO1xuICAgIGxldCByaWdodEhlaWdodCA9IDA7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBbLi4uY2hpbGRyZW5dLnNvcnQoKGEsIGIpID0+IHN1YnRyZWVIZWlnaHQoYiwgMSwgZGVmYXVsdEZvbnRTaXplKSAtIHN1YnRyZWVIZWlnaHQoYSwgMSwgZGVmYXVsdEZvbnRTaXplKSkpIHtcbiAgICAgIGNvbnN0IGhlaWdodCA9IHN1YnRyZWVIZWlnaHQoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkgKyBWX0dBUDtcbiAgICAgIGlmIChsZWZ0SGVpZ2h0IDw9IHJpZ2h0SGVpZ2h0KSB7XG4gICAgICAgIGxlZnQucHVzaChjaGlsZCk7XG4gICAgICAgIGxlZnRIZWlnaHQgKz0gaGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmlnaHQucHVzaChjaGlsZCk7XG4gICAgICAgIHJpZ2h0SGVpZ2h0ICs9IGhlaWdodDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwbGFjZVNpZGUgPSAoaXRlbXM6IE1pbmRNYXBOb2RlW10sIHNpZGU6IC0xIHwgMSk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgaGVpZ2h0cyA9IGl0ZW1zLm1hcCgoY2hpbGQpID0+IHN1YnRyZWVIZWlnaHQoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkpO1xuICAgICAgY29uc3QgdG90YWwgPSBoZWlnaHRzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApICsgVl9HQVAgKiBNYXRoLm1heCgwLCBpdGVtcy5sZW5ndGggLSAxKTtcbiAgICAgIGxldCBjdXJzb3IgPSAtdG90YWwgLyAyO1xuICAgICAgaXRlbXMuZm9yRWFjaCgoY2hpbGQsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGhlaWdodHNbaW5kZXhdID8/IG5vZGVEaW1lbnNpb25zKGNoaWxkLCAxLCBkZWZhdWx0Rm9udFNpemUpLmhlaWdodDtcbiAgICAgICAgbGF5b3V0QnJhbmNoKGNoaWxkLCByb290LmlkLCAwLCByb290RGltZW5zaW9ucy53aWR0aCwgc2lkZSwgMSwgY3Vyc29yICsgaGVpZ2h0IC8gMiwgbm9kZXMsIGRlZmF1bHRGb250U2l6ZSk7XG4gICAgICAgIGN1cnNvciArPSBoZWlnaHQgKyBWX0dBUDtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcGxhY2VTaWRlKGxlZnQsIC0xKTtcbiAgICBwbGFjZVNpZGUocmlnaHQsIDEpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGhlaWdodHMgPSBjaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiBzdWJ0cmVlSGVpZ2h0KGNoaWxkLCAxLCBkZWZhdWx0Rm9udFNpemUpKTtcbiAgICBjb25zdCB0b3RhbCA9IGhlaWdodHMucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkgKyBWX0dBUCAqIE1hdGgubWF4KDAsIGNoaWxkcmVuLmxlbmd0aCAtIDEpO1xuICAgIGxldCBjdXJzb3IgPSAtdG90YWwgLyAyO1xuICAgIGNoaWxkcmVuLmZvckVhY2goKGNoaWxkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgaGVpZ2h0ID0gaGVpZ2h0c1tpbmRleF0gPz8gbm9kZURpbWVuc2lvbnMoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkuaGVpZ2h0O1xuICAgICAgbGF5b3V0QnJhbmNoKGNoaWxkLCByb290LmlkLCAwLCByb290RGltZW5zaW9ucy53aWR0aCwgMSwgMSwgY3Vyc29yICsgaGVpZ2h0IC8gMiwgbm9kZXMsIGRlZmF1bHRGb250U2l6ZSk7XG4gICAgICBjdXJzb3IgKz0gaGVpZ2h0ICsgVl9HQVA7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBieUlkID0gbmV3IE1hcChub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBbcG9zaXRpb24ubm9kZS5pZCwgcG9zaXRpb25dKSk7XG4gIGNvbnN0IG1pblggPSBNYXRoLm1pbiguLi5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi54IC0gcG9zaXRpb24ud2lkdGggLyAyKSk7XG4gIGNvbnN0IG1heFggPSBNYXRoLm1heCguLi5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi54ICsgcG9zaXRpb24ud2lkdGggLyAyKSk7XG4gIGNvbnN0IG1pblkgPSBNYXRoLm1pbiguLi5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi55IC0gcG9zaXRpb24uaGVpZ2h0IC8gMikpO1xuICBjb25zdCBtYXhZID0gTWF0aC5tYXgoLi4ubm9kZXMubWFwKChwb3NpdGlvbikgPT4gcG9zaXRpb24ueSArIHBvc2l0aW9uLmhlaWdodCAvIDIpKTtcbiAgcmV0dXJuIHsgbm9kZXMsIGJ5SWQsIG1pblgsIG1heFgsIG1pblksIG1heFkgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVkZ2VQYXRoKHBhcmVudDogTm9kZVBvc2l0aW9uLCBjaGlsZDogTm9kZVBvc2l0aW9uLCBzdHlsZTogRWRnZVN0eWxlID0gXCJjdXJ2ZWRcIik6IHN0cmluZyB7XG4gIGNvbnN0IHBhcmVudFggPSBwYXJlbnQueCArIChjaGlsZC5zaWRlID49IDAgPyBwYXJlbnQud2lkdGggLyAyIDogLXBhcmVudC53aWR0aCAvIDIpO1xuICBjb25zdCBjaGlsZFggPSBjaGlsZC54IC0gKGNoaWxkLnNpZGUgPj0gMCA/IGNoaWxkLndpZHRoIC8gMiA6IC1jaGlsZC53aWR0aCAvIDIpO1xuICBpZiAoc3R5bGUgPT09IFwic3RyYWlnaHRcIikgcmV0dXJuIGBNICR7cGFyZW50WH0gJHtwYXJlbnQueX0gTCAke2NoaWxkWH0gJHtjaGlsZC55fWA7XG4gIGNvbnN0IG1pZGRsZVggPSBwYXJlbnRYICsgKGNoaWxkWCAtIHBhcmVudFgpICogMC41O1xuICBpZiAoc3R5bGUgPT09IFwiZWxib3dcIikgcmV0dXJuIGBNICR7cGFyZW50WH0gJHtwYXJlbnQueX0gTCAke21pZGRsZVh9ICR7cGFyZW50Lnl9IEwgJHttaWRkbGVYfSAke2NoaWxkLnl9IEwgJHtjaGlsZFh9ICR7Y2hpbGQueX1gO1xuICByZXR1cm4gYE0gJHtwYXJlbnRYfSAke3BhcmVudC55fSBDICR7bWlkZGxlWH0gJHtwYXJlbnQueX0sICR7bWlkZGxlWH0gJHtjaGlsZC55fSwgJHtjaGlsZFh9ICR7Y2hpbGQueX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlWG1sKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvWzw+JlwiJ10vZywgKGNoYXJhY3RlcikgPT4ge1xuICAgIGNvbnN0IGVudGl0aWVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBcIjxcIjogXCImbHQ7XCIsIFwiPlwiOiBcIiZndDtcIiwgXCImXCI6IFwiJmFtcDtcIiwgJ1wiJzogXCImcXVvdDtcIiwgXCInXCI6IFwiJmFwb3M7XCIgfTtcbiAgICByZXR1cm4gZW50aXRpZXNbY2hhcmFjdGVyXSA/PyBjaGFyYWN0ZXI7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2YWxpZENvbG9yKHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQsIGZhbGxiYWNrOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUgJiYgL14jWzAtOWEtZl17Nn0kL2kudGVzdCh2YWx1ZSkgPyB2YWx1ZSA6IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBzdmdSYWRpdXMoc2hhcGU6IE5vZGVTaGFwZSB8IHVuZGVmaW5lZCk6IG51bWJlciB7XG4gIGlmIChzaGFwZSA9PT0gXCJyZWN0YW5nbGVcIikgcmV0dXJuIDM7XG4gIGlmIChzaGFwZSA9PT0gXCJwaWxsXCIpIHJldHVybiAyODtcbiAgcmV0dXJuIDE0O1xufVxuXG5mdW5jdGlvbiB0YXNrR2x5cGgobm9kZTogTWluZE1hcE5vZGUpOiBzdHJpbmcge1xuICBpZiAobm9kZS50YXNrID09PSBcImRvbmVcIikgcmV0dXJuIFwiXHUyNzEzIFwiO1xuICBpZiAobm9kZS50YXNrID09PSBcImRvaW5nXCIpIHJldHVybiBcIlx1MjVEMCBcIjtcbiAgaWYgKG5vZGUudGFzayA9PT0gXCJ0b2RvXCIpIHJldHVybiBcIlx1MjVDQiBcIjtcbiAgcmV0dXJuIFwiXCI7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlUnVucyhydW5zOiBNaW5kTWFwVGV4dFJ1bltdLCBtYXhMZW5ndGg6IG51bWJlcik6IE1pbmRNYXBUZXh0UnVuW10ge1xuICBjb25zdCByZXN1bHQ6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgbGV0IHJlbWFpbmluZyA9IG1heExlbmd0aDtcbiAgbGV0IHRydW5jYXRlZCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IHJ1biBvZiBydW5zKSB7XG4gICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7IHRydW5jYXRlZCA9IHRydWU7IGJyZWFrOyB9XG4gICAgaWYgKHJ1bi50ZXh0Lmxlbmd0aCA8PSByZW1haW5pbmcpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHsgdGV4dDogcnVuLnRleHQsIHN0eWxlOiBydW4uc3R5bGUgfSk7XG4gICAgICByZW1haW5pbmcgLT0gcnVuLnRleHQubGVuZ3RoO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJlc3VsdC5wdXNoKHsgdGV4dDogcnVuLnRleHQuc2xpY2UoMCwgcmVtYWluaW5nKSwgc3R5bGU6IHJ1bi5zdHlsZSB9KTtcbiAgICByZW1haW5pbmcgPSAwO1xuICAgIHRydW5jYXRlZCA9IHRydWU7XG4gIH1cbiAgaWYgKHRydW5jYXRlZCAmJiByZXN1bHQubGVuZ3RoKSByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdIS50ZXh0ID0gYCR7cmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXSEudGV4dC5zbGljZSgwLCAtMSl9XHUyMDI2YDtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmljaFRleHRUc3BhbnMocnVuczogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUZXh0OiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCBmb3JlZ3JvdW5kOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2U6IE1pbmRNYXBUZXh0UnVuW10gPSBbXG4gICAgLi4uKHByZWZpeCA/IFt7IHRleHQ6IHByZWZpeCB9XSA6IFtdKSxcbiAgICAuLi4ocnVucz8ubGVuZ3RoID8gcnVucyA6IFt7IHRleHQ6IGZhbGxiYWNrVGV4dCB9XSlcbiAgXTtcbiAgcmV0dXJuIHRydW5jYXRlUnVucyhzb3VyY2UsIDQyKS5tYXAoKHJ1bikgPT4ge1xuICAgIGNvbnN0IHN0eWxlID0gcnVuLnN0eWxlO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHN0eWxlPy5jb2xvcikgYXR0cmlidXRlcy5wdXNoKGBmaWxsPVwiJHt2YWxpZENvbG9yKHN0eWxlLmNvbG9yLCBmb3JlZ3JvdW5kKX1cImApO1xuICAgIGlmIChzdHlsZT8uYm9sZCAhPT0gdW5kZWZpbmVkKSBhdHRyaWJ1dGVzLnB1c2goYGZvbnQtd2VpZ2h0PVwiJHtzdHlsZS5ib2xkID8gNzAwIDogNDAwfVwiYCk7XG4gICAgaWYgKHN0eWxlPy5pdGFsaWMgIT09IHVuZGVmaW5lZCkgYXR0cmlidXRlcy5wdXNoKGBmb250LXN0eWxlPVwiJHtzdHlsZS5pdGFsaWMgPyBcIml0YWxpY1wiIDogXCJub3JtYWxcIn1cImApO1xuICAgIGNvbnN0IGRlY29yYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChzdHlsZT8udW5kZXJsaW5lKSBkZWNvcmF0aW9ucy5wdXNoKFwidW5kZXJsaW5lXCIpO1xuICAgIGlmIChzdHlsZT8uc3RyaWtlKSBkZWNvcmF0aW9ucy5wdXNoKFwibGluZS10aHJvdWdoXCIpO1xuICAgIGlmIChkZWNvcmF0aW9ucy5sZW5ndGgpIGF0dHJpYnV0ZXMucHVzaChgdGV4dC1kZWNvcmF0aW9uPVwiJHtkZWNvcmF0aW9ucy5qb2luKFwiIFwiKX1cImApO1xuICAgIHJldHVybiBgPHRzcGFuICR7YXR0cmlidXRlcy5qb2luKFwiIFwiKX0+JHtlc2NhcGVYbWwocnVuLnRleHQpfTwvdHNwYW4+YDtcbiAgfSkuam9pbihcIlwiKTtcbn1cblxuZnVuY3Rpb24gc3ZnRm9udEZhbWlseShtb2RlOiBGb250RmFtaWx5TW9kZSB8IHVuZGVmaW5lZCwgY3VzdG9tRm9udDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKG1vZGUgPT09IFwic2VyaWZcIikgcmV0dXJuICdHZW9yZ2lhLFwiVGltZXMgTmV3IFJvbWFuXCIsc2VyaWYnO1xuICBpZiAobW9kZSA9PT0gXCJtb25vXCIpIHJldHVybiAnXCJTRk1vbm8tUmVndWxhclwiLENvbnNvbGFzLFwiTGliZXJhdGlvbiBNb25vXCIsbW9ub3NwYWNlJztcbiAgaWYgKG1vZGUgPT09IFwiY3VzdG9tXCIgJiYgY3VzdG9tRm9udD8udHJpbSgpKSByZXR1cm4gYFwiJHtjdXN0b21Gb250LnRyaW0oKS5yZXBsYWNlQWxsKCdcIicsICcnKX1cIixzYW5zLXNlcmlmYDtcbiAgcmV0dXJuICdJbnRlciwtYXBwbGUtc3lzdGVtLEJsaW5rTWFjU3lzdGVtRm9udCxcIlNlZ29lIFVJXCIsc2Fucy1zZXJpZic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkb2N1bWVudFRvU3ZnKHJvb3Q6IE1pbmRNYXBOb2RlLCBtb2RlOiBMYXlvdXRNb2RlLCB0aXRsZTogc3RyaW5nLCBhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSA9IHt9KTogc3RyaW5nIHtcbiAgY29uc3QgZGVmYXVsdEZvbnRTaXplID0gYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNDtcbiAgY29uc3QgbGF5b3V0ID0gY29tcHV0ZUxheW91dChyb290LCBtb2RlLCBkZWZhdWx0Rm9udFNpemUpO1xuICBjb25zdCBwYWRkaW5nID0gNzI7XG4gIGNvbnN0IHdpZHRoID0gTWF0aC5tYXgoMzIwLCBsYXlvdXQubWF4WCAtIGxheW91dC5taW5YICsgcGFkZGluZyAqIDIpO1xuICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heCgyMjAsIGxheW91dC5tYXhZIC0gbGF5b3V0Lm1pblkgKyBwYWRkaW5nICogMik7XG4gIGNvbnN0IG9mZnNldFggPSBwYWRkaW5nIC0gbGF5b3V0Lm1pblg7XG4gIGNvbnN0IG9mZnNldFkgPSBwYWRkaW5nIC0gbGF5b3V0Lm1pblk7XG4gIGNvbnN0IGVkZ2VTdHlsZSA9IGFwcGVhcmFuY2UuZWRnZVN0eWxlID8/IFwiY3VydmVkXCI7XG4gIGNvbnN0IGVkZ2VXaWR0aCA9IGFwcGVhcmFuY2UuZWRnZVdpZHRoID8/IDIuMjtcbiAgY29uc3QgZGVmYXVsdEVkZ2UgPSB2YWxpZENvbG9yKGFwcGVhcmFuY2UuZWRnZUNvbG9yLCBcIiM3YzhhYTVcIik7XG4gIGNvbnN0IGVkZ2VzID0gbGF5b3V0Lm5vZGVzXG4gICAgLmZpbHRlcigocG9zaXRpb24pID0+IHBvc2l0aW9uLnBhcmVudElkKVxuICAgIC5tYXAoKHBvc2l0aW9uKSA9PiB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBwb3NpdGlvbi5wYXJlbnRJZCA/IGxheW91dC5ieUlkLmdldChwb3NpdGlvbi5wYXJlbnRJZCkgOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBzdHJva2UgPSB2YWxpZENvbG9yKHBvc2l0aW9uLm5vZGUuc3R5bGU/LmNvbG9yLCBkZWZhdWx0RWRnZSk7XG4gICAgICByZXR1cm4gcGFyZW50ID8gYDxwYXRoIGQ9XCIke2VkZ2VQYXRoKHBhcmVudCwgcG9zaXRpb24sIGVkZ2VTdHlsZSl9XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIke3N0cm9rZX1cIiBzdHJva2Utd2lkdGg9XCIke2VkZ2VXaWR0aH1cIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBvcGFjaXR5PVwiMC44XCIvPmAgOiBcIlwiO1xuICAgIH0pXG4gICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3Qgbm9kZXMgPSBsYXlvdXQubm9kZXMubWFwKChwb3NpdGlvbikgPT4ge1xuICAgIGNvbnN0IG5vZGUgPSBwb3NpdGlvbi5ub2RlO1xuICAgIGNvbnN0IHggPSBwb3NpdGlvbi54IC0gcG9zaXRpb24ud2lkdGggLyAyO1xuICAgIGNvbnN0IHkgPSBwb3NpdGlvbi55IC0gcG9zaXRpb24uaGVpZ2h0IC8gMjtcbiAgICBjb25zdCBpc1Jvb3QgPSBwb3NpdGlvbi5kZXB0aCA9PT0gMDtcbiAgICBjb25zdCBkZWZhdWx0QmFja2dyb3VuZCA9IGlzUm9vdCA/IFwiIzRmNDZlNVwiIDogdmFsaWRDb2xvcihhcHBlYXJhbmNlLm5vZGVDb2xvciwgXCIjZmZmZmZmXCIpO1xuICAgIGNvbnN0IGRlZmF1bHRUZXh0ID0gaXNSb290ID8gXCIjZmZmZmZmXCIgOiB2YWxpZENvbG9yKGFwcGVhcmFuY2UudGV4dENvbG9yLCBcIiMwZjE3MmFcIik7XG4gICAgY29uc3QgYmFja2dyb3VuZCA9IHZhbGlkQ29sb3Iobm9kZS5zdHlsZT8uY29sb3IsIGRlZmF1bHRCYWNrZ3JvdW5kKTtcbiAgICBjb25zdCBmb3JlZ3JvdW5kID0gdmFsaWRDb2xvcihub2RlLnN0eWxlPy50ZXh0Q29sb3IsIGRlZmF1bHRUZXh0KTtcbiAgICBjb25zdCBib3JkZXIgPSB2YWxpZENvbG9yKG5vZGUuc3R5bGU/LmJvcmRlckNvbG9yLCBpc1Jvb3QgPyBiYWNrZ3JvdW5kIDogdmFsaWRDb2xvcihhcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvciwgXCIjOTRhM2I4XCIpKTtcbiAgICBjb25zdCBib3JkZXJXaWR0aCA9IG5vZGUuc3R5bGU/LmJvcmRlcldpZHRoID8/IGFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IChpc1Jvb3QgPyAyIDogMSk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7bm9kZS5pY29uID8gYCR7bm9kZS5pY29ufSBgIDogXCJcIn0ke3Rhc2tHbHlwaChub2RlKX1gO1xuICAgIGNvbnN0IGNvbnRlbnRCbG9ja3MgPSBub2RlQ29udGVudEJsb2Nrcyhub2RlKTtcbiAgICBsZXQgY29udGVudFkgPSB5ICsgMjg7XG4gICAgY29uc3QgY29udGVudFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBwcmVmaXhVc2VkID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBjb250ZW50QmxvY2tzKSB7XG4gICAgICBpZiAoYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiKSB7XG4gICAgICAgIGNvbnRlbnRQYXJ0cy5wdXNoKGA8cmVjdCB4PVwiJHtwb3NpdGlvbi54IC0gNzB9XCIgeT1cIiR7Y29udGVudFkgLSAxNH1cIiB3aWR0aD1cIjE0MFwiIGhlaWdodD1cIjk0XCIgcng9XCI4XCIgZmlsbD1cInJnYmEoMTI3LDEyNywxMjcsLjEyKVwiLz48dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke2NvbnRlbnRZICsgMzh9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIjEyXCI+XHVEODNEXHVEREJDICR7ZXNjYXBlWG1sKChibG9jay5hbHQgPz8gXCJcdTU2RkVcdTcyNDdcIikuc2xpY2UoMCwgMjApKX08L3RleHQ+YCk7XG4gICAgICAgIGNvbnRlbnRZICs9IDExMjtcbiAgICAgIH0gZWxzZSBpZiAoYmxvY2sudGV4dC50cmltKCkpIHtcbiAgICAgICAgY29uc3QgYmxvY2tQcmVmaXggPSBwcmVmaXhVc2VkID8gXCJcIiA6IHByZWZpeDtcbiAgICAgICAgcHJlZml4VXNlZCA9IHRydWU7XG4gICAgICAgIGNvbnRlbnRQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke2NvbnRlbnRZfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCIke25vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZX1cIj4ke3JpY2hUZXh0VHNwYW5zKGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0LCBibG9ja1ByZWZpeCwgZm9yZWdyb3VuZCl9PC90ZXh0PmApO1xuICAgICAgICBjb250ZW50WSArPSAobm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplKSArIDE1O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWNvbnRlbnRCbG9ja3MubGVuZ3RoKSBjb250ZW50UGFydHMucHVzaChgPHRleHQgeD1cIiR7cG9zaXRpb24ueH1cIiB5PVwiJHtjb250ZW50WX1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiJHtub2RlLnN0eWxlPy5mb250U2l6ZSA/PyBkZWZhdWx0Rm9udFNpemV9XCI+JHtlc2NhcGVYbWwocHJlZml4IHx8IG5vZGVQbGFpblRleHQobm9kZSkgfHwgXCJcdTU2RkVcdTcyNDdcdTgyODJcdTcwQjlcIil9PC90ZXh0PmApO1xuICAgIGxldCByaWNoWSA9IGNvbnRlbnRZICsgMTA7XG4gICAgY29uc3QgcmljaFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChub2RlLnN1Ym1hcCkge1xuICAgICAgcmljaFBhcnRzLnB1c2goYDxyZWN0IHg9XCIke3ggKyAxMn1cIiB5PVwiJHtyaWNoWX1cIiB3aWR0aD1cIiR7cG9zaXRpb24ud2lkdGggLSAyNH1cIiBoZWlnaHQ9XCIyNVwiIHJ4PVwiNlwiIGZpbGw9XCJyZ2JhKDk5LDEwMiwyNDEsLjEwKVwiIHN0cm9rZT1cIiR7Zm9yZWdyb3VuZH1cIiBzdHJva2Utb3BhY2l0eT1cIi4yOFwiIHN0cm9rZS1kYXNoYXJyYXk9XCI0IDNcIi8+PHRleHQgeD1cIiR7cG9zaXRpb24ueH1cIiB5PVwiJHtyaWNoWSArIDE3fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCIxMFwiPlx1MjFCMyAke2VzY2FwZVhtbCgobm9kZS5zdWJtYXAudGl0bGUgPz8gbm9kZS5zdWJtYXAucGF0aCkuc2xpY2UoMCwgNTQpKX08L3RleHQ+YCk7XG4gICAgICByaWNoWSArPSAzNDtcbiAgICB9XG4gICAgaWYgKG5vZGUudGFibGUpIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBbbm9kZS50YWJsZS5oZWFkZXJzLCAuLi5ub2RlLnRhYmxlLnJvd3Muc2xpY2UoMCwgOCldO1xuICAgICAgcm93cy5mb3JFYWNoKChyb3csIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHJvd1RleHQgPSBlc2NhcGVYbWwocm93Lm1hcCgoY2VsbCkgPT4gY2VsbC5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiIFwiKSkuam9pbihcIiAgfCAgXCIpLnNsaWNlKDAsIDEwMCkpO1xuICAgICAgICByaWNoUGFydHMucHVzaChgPHRleHQgeD1cIiR7eCArIDE2fVwiIHk9XCIke3JpY2hZICsgaW5kZXggKiAyM31cIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIiR7aW5kZXggPT09IDAgPyAxMC41IDogOS41fVwiIGZvbnQtd2VpZ2h0PVwiJHtpbmRleCA9PT0gMCA/IDcwMCA6IDQwMH1cIj4ke3Jvd1RleHR9PC90ZXh0PmApO1xuICAgICAgfSk7XG4gICAgICBpZiAobm9kZS50YWJsZS5yb3dzLmxlbmd0aCA+IDgpIHJpY2hQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHt4ICsgMTZ9XCIgeT1cIiR7cmljaFkgKyByb3dzLmxlbmd0aCAqIDIzfVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgb3BhY2l0eT1cIi42NVwiIGZvbnQtc2l6ZT1cIjlcIj5cdTIwMjYgXHU4RkQ4XHU2NzA5ICR7bm9kZS50YWJsZS5yb3dzLmxlbmd0aCAtIDh9IFx1ODg0QzwvdGV4dD5gKTtcbiAgICB9XG4gICAgaWYgKG5vZGUuY29kZSkge1xuICAgICAgcmljaFBhcnRzLnB1c2goYDxyZWN0IHg9XCIke3ggKyAxMn1cIiB5PVwiJHtyaWNoWSAtIDE0fVwiIHdpZHRoPVwiJHtwb3NpdGlvbi53aWR0aCAtIDI0fVwiIGhlaWdodD1cIiR7TWF0aC5taW4oMzUwLCBNYXRoLm1heCg4MCwgbm9kZS5jb2RlLmNvZGUuc3BsaXQoL1xccj9cXG4vKS5sZW5ndGggKiAxNyArIDM0KSl9XCIgcng9XCI3XCIgZmlsbD1cInJnYmEoMTUsMjMsNDIsLjEwKVwiLz5gKTtcbiAgICAgIHJpY2hQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHt4ICsgMjB9XCIgeT1cIiR7cmljaFkgKyAzfVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgb3BhY2l0eT1cIi43XCIgZm9udC1zaXplPVwiOVwiPiR7ZXNjYXBlWG1sKG5vZGUuY29kZS5sYW5ndWFnZSB8fCBcImNvZGVcIil9PC90ZXh0PmApO1xuICAgICAgbm9kZS5jb2RlLmNvZGUuc3BsaXQoL1xccj9cXG4vKS5zbGljZSgwLCAxNikuZm9yRWFjaCgobGluZSwgaW5kZXgpID0+IHJpY2hQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHt4ICsgMjB9XCIgeT1cIiR7cmljaFkgKyAyMyArIGluZGV4ICogMTd9XCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCI5XCIgZm9udC1mYW1pbHk9XCJtb25vc3BhY2VcIj4ke2VzY2FwZVhtbChsaW5lLnNsaWNlKDAsIDkyKSl9PC90ZXh0PmApKTtcbiAgICB9XG4gICAgY29uc3QgcmljaENvbnRlbnQgPSByaWNoUGFydHMuam9pbihcIlwiKTtcbiAgICBjb25zdCB0YWdzID0gbm9kZS50YWdzPy5sZW5ndGhcbiAgICAgID8gYDx0ZXh0IHg9XCIke3Bvc2l0aW9uLnh9XCIgeT1cIiR7cG9zaXRpb24ueSArIHBvc2l0aW9uLmhlaWdodCAvIDIgLSA5fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBvcGFjaXR5PVwiLjcyXCIgZm9udC1zaXplPVwiMTBcIj4ke2VzY2FwZVhtbChub2RlLnRhZ3MubWFwKCh0YWcpID0+IGAjJHt0YWd9YCkuam9pbihcIiAgXCIpLnNsaWNlKDAsIDQ4KSl9PC90ZXh0PmBcbiAgICAgIDogXCJcIjtcbiAgICBjb25zdCBib2xkID0gbm9kZS5zdHlsZT8uYm9sZCA/PyBhcHBlYXJhbmNlLmJvbGQgPz8gZmFsc2U7XG4gICAgY29uc3QgaXRhbGljID0gbm9kZS5zdHlsZT8uaXRhbGljID8/IGFwcGVhcmFuY2UuaXRhbGljID8/IGZhbHNlO1xuICAgIGNvbnN0IHVuZGVybGluZSA9IG5vZGUuc3R5bGU/LnVuZGVybGluZSA/PyBhcHBlYXJhbmNlLnVuZGVybGluZSA/PyBmYWxzZTtcbiAgICBjb25zdCBmb250U2l6ZSA9IG5vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZTtcbiAgICByZXR1cm4gYDxnPjxyZWN0IHg9XCIke3h9XCIgeT1cIiR7eX1cIiB3aWR0aD1cIiR7cG9zaXRpb24ud2lkdGh9XCIgaGVpZ2h0PVwiJHtwb3NpdGlvbi5oZWlnaHR9XCIgcng9XCIke3N2Z1JhZGl1cyhub2RlLnN0eWxlPy5zaGFwZSl9XCIgZmlsbD1cIiR7YmFja2dyb3VuZH1cIiBzdHJva2U9XCIke2JvcmRlcn1cIiBzdHJva2Utd2lkdGg9XCIke2JvcmRlcldpZHRofVwiLz48ZyBmb250LXdlaWdodD1cIiR7aXNSb290IHx8IGJvbGQgPyA3MDAgOiA0MDB9XCIgZm9udC1zdHlsZT1cIiR7aXRhbGljID8gXCJpdGFsaWNcIiA6IFwibm9ybWFsXCJ9XCIgdGV4dC1kZWNvcmF0aW9uPVwiJHt1bmRlcmxpbmUgPyBcInVuZGVybGluZVwiIDogXCJub25lXCJ9XCI+JHtjb250ZW50UGFydHMuam9pbihcIlwiKX08L2c+JHtyaWNoQ29udGVudH0ke3RhZ3N9PC9nPmA7XG4gIH0pLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3QgYmFja2dyb3VuZCA9IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5iYWNrZ3JvdW5kQ29sb3IsIFwiI2Y4ZmFmY1wiKTtcbiAgY29uc3QgcGF0dGVybkNvbG9yID0gdmFsaWRDb2xvcihhcHBlYXJhbmNlLnBhdHRlcm5Db2xvciwgXCIjOTRhM2I4XCIpO1xuICBjb25zdCBwYXR0ZXJuID0gYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA/PyBcIm5vbmVcIjtcbiAgY29uc3QgZGVmcyA9IHBhdHRlcm4gPT09IFwiZ3JpZFwiXG4gICAgPyBgPGRlZnM+PHBhdHRlcm4gaWQ9XCJtbWMtcGF0dGVyblwiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHBhdHRlcm5Vbml0cz1cInVzZXJTcGFjZU9uVXNlXCI+PHBhdGggZD1cIk0gMjQgMCBMIDAgMCAwIDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIke3BhdHRlcm5Db2xvcn1cIiBzdHJva2Utd2lkdGg9XCIxXCIgb3BhY2l0eT1cIi4xOFwiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjEwMCVcIiBmaWxsPVwidXJsKCNtbWMtcGF0dGVybilcIi8+YFxuICAgIDogcGF0dGVybiA9PT0gXCJkb3RzXCJcbiAgICAgID8gYDxkZWZzPjxwYXR0ZXJuIGlkPVwibW1jLXBhdHRlcm5cIiB3aWR0aD1cIjI0XCIgaGVpZ2h0PVwiMjRcIiBwYXR0ZXJuVW5pdHM9XCJ1c2VyU3BhY2VPblVzZVwiPjxjaXJjbGUgY3g9XCIyXCIgY3k9XCIyXCIgcj1cIjEuNVwiIGZpbGw9XCIke3BhdHRlcm5Db2xvcn1cIiBvcGFjaXR5PVwiLjI4XCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIGZpbGw9XCJ1cmwoI21tYy1wYXR0ZXJuKVwiLz5gXG4gICAgICA6IFwiXCI7XG5cbiAgcmV0dXJuIGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5cbjxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiJHtNYXRoLmNlaWwod2lkdGgpfVwiIGhlaWdodD1cIiR7TWF0aC5jZWlsKGhlaWdodCl9XCIgdmlld0JveD1cIjAgMCAke01hdGguY2VpbCh3aWR0aCl9ICR7TWF0aC5jZWlsKGhlaWdodCl9XCI+XG48dGl0bGU+JHtlc2NhcGVYbWwodGl0bGUpfTwvdGl0bGU+XG48c3R5bGU+c3Zne2JhY2tncm91bmQ6JHtiYWNrZ3JvdW5kfTtmb250LWZhbWlseToke3N2Z0ZvbnRGYW1pbHkoYXBwZWFyYW5jZS5mb250RmFtaWx5LCBhcHBlYXJhbmNlLmN1c3RvbUZvbnQpfX08L3N0eWxlPlxuJHtkZWZzfTxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgke29mZnNldFh9ICR7b2Zmc2V0WX0pXCI+JHtlZGdlc30ke25vZGVzfTwvZz5cbjwvc3ZnPmA7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBBcHAsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBkb2N1bWVudFRvU3ZnIH0gZnJvbSBcIi4vbGF5b3V0XCI7XG5pbXBvcnQgeyBtZXJnZUFwcGVhcmFuY2UsIHBhcnNlRG9jdW1lbnQsIHR5cGUgTWluZE1hcEFwcGVhcmFuY2UsIHR5cGUgTWluZE1hcERvY3VtZW50IH0gZnJvbSBcIi4vbW9kZWxcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0YXRpY01pbmRNYXAoXG4gIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gIGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQsXG4gIG9wdGlvbnM/OiB7IGFwcD86IEFwcDsgZmlsZT86IFRGaWxlOyBtYXhIZWlnaHQ/OiBudW1iZXI7IGRlZmF1bHRBcHBlYXJhbmNlPzogTWluZE1hcEFwcGVhcmFuY2UgfVxuKTogdm9pZCB7XG4gIGNvbnRhaW5lci5lbXB0eSgpO1xuICBjb250YWluZXIuYWRkQ2xhc3MoXCJtbWMtc3RhdGljLXByZXZpZXdcIik7XG4gIGNvbnN0IHN2ZyA9IGRvY3VtZW50VG9TdmcoZG9jdW1lbnQucm9vdCwgZG9jdW1lbnQubGF5b3V0LCBkb2N1bWVudC50aXRsZSwgbWVyZ2VBcHBlYXJhbmNlKG9wdGlvbnM/LmRlZmF1bHRBcHBlYXJhbmNlLCBkb2N1bWVudC5hcHBlYXJhbmNlKSk7XG4gIGNvbnN0IGltYWdlID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiaW1nXCIsIHtcbiAgICBhdHRyOiB7XG4gICAgICBhbHQ6IGAke2RvY3VtZW50LnRpdGxlfSBcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcdTk4ODRcdTg5QzhgLFxuICAgICAgc3JjOiBgZGF0YTppbWFnZS9zdmcreG1sO2NoYXJzZXQ9dXRmLTgsJHtlbmNvZGVVUklDb21wb25lbnQoc3ZnKX1gXG4gICAgfVxuICB9KTtcbiAgaWYgKG9wdGlvbnM/Lm1heEhlaWdodCkgaW1hZ2Uuc3R5bGUubWF4SGVpZ2h0ID0gYCR7b3B0aW9ucy5tYXhIZWlnaHR9cHhgO1xuICBpZiAob3B0aW9ucz8uYXBwICYmIG9wdGlvbnMuZmlsZSkge1xuICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIG9wdGlvbnMuYXBwPy53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkub3BlbkZpbGUob3B0aW9ucy5maWxlIGFzIFRGaWxlKTtcbiAgICB9KTtcbiAgICBpbWFnZS5zZXRBdHRyKFwidGl0bGVcIiwgXCJcdTUzQ0NcdTUxRkJcdTYyNTNcdTVGMDBcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0YXRpY1NvdXJjZShjb250YWluZXI6IEhUTUxFbGVtZW50LCBzb3VyY2U6IHN0cmluZywgZmFsbGJhY2tUaXRsZTogc3RyaW5nLCBkZWZhdWx0QXBwZWFyYW5jZT86IE1pbmRNYXBBcHBlYXJhbmNlKTogdm9pZCB7XG4gIHJlbmRlclN0YXRpY01pbmRNYXAoY29udGFpbmVyLCBwYXJzZURvY3VtZW50KHNvdXJjZSwgZmFsbGJhY2tUaXRsZSksIHsgZGVmYXVsdEFwcGVhcmFuY2UgfSk7XG59XG4iLCAiaW1wb3J0IHsgTWFya2Rvd25SZW5kZXJlciwgTm90aWNlLCBUZXh0RmlsZVZpZXcsIFRGaWxlLCBub3JtYWxpemVQYXRoLCB0eXBlIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIE1pbmRNYXBTdHVkaW9QbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHsgTWluZE1hcEVkaXRvciB9IGZyb20gXCIuL2VkaXRvclwiO1xuaW1wb3J0IHsgcGFyc2VEb2N1bWVudCwgc2VyaWFsaXplRG9jdW1lbnQsIHR5cGUgTWluZE1hcERvY3VtZW50IH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IHNldHRpbmdzVG9BcHBlYXJhbmNlIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcblxuZXhwb3J0IGNvbnN0IFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyA9IFwibWluZG1hcC1zdHVkaW8tdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgTWluZE1hcFN0dWRpb1ZpZXcgZXh0ZW5kcyBUZXh0RmlsZVZpZXcge1xuICBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogTWluZE1hcFN0dWRpb1BsdWdpbjtcbiAgcHJpdmF0ZSBlZGl0b3I6IE1pbmRNYXBFZGl0b3IgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBkb2N1bWVudDogTWluZE1hcERvY3VtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2F2ZWRUaW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcGx1Z2luOiBNaW5kTWFwU3R1ZGlvUGx1Z2luKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBWSUVXX1RZUEVfTUlORE1BUF9TVFVESU87XG4gIH1cblxuICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmZpbGU/LmJhc2VuYW1lID8/IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCI7XG4gIH1cblxuICBnZXRJY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiYnJhaW4tY2lyY3VpdFwiO1xuICB9XG5cbiAgZ2V0Vmlld0RhdGEoKTogc3RyaW5nIHtcbiAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuZWRpdG9yPy5nZXREb2N1bWVudCgpID8/IHRoaXMuZG9jdW1lbnQ7XG4gICAgcmV0dXJuIHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50ID8/IHRoaXMucGx1Z2luLmNyZWF0ZUNvbmZpZ3VyZWREb2N1bWVudChcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKSk7XG4gIH1cblxuICBzZXRWaWV3RGF0YShkYXRhOiBzdHJpbmcsIGNsZWFyOiBib29sZWFuKTogdm9pZCB7XG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLmZpbGU/LmJhc2VuYW1lID8/IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCI7XG4gICAgdGhpcy5kb2N1bWVudCA9IHBhcnNlRG9jdW1lbnQoZGF0YSwgdGl0bGUpO1xuICAgIHRoaXMuYXBwbHlWaWV3Q2xhc3NlcygpO1xuXG4gICAgaWYgKCF0aGlzLmVkaXRvciB8fCBjbGVhcikge1xuICAgICAgdGhpcy5lZGl0b3I/LmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gICAgICB0aGlzLmVkaXRvciA9IG5ldyBNaW5kTWFwRWRpdG9yKHRoaXMuYXBwLCB0aGlzLmNvbnRlbnRFbCwgdGhpcy5kb2N1bWVudCwge1xuICAgICAgICBvbkNoYW5nZTogKGRvY3VtZW50KSA9PiB7XG4gICAgICAgICAgdGhpcy5kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgIHRoaXMucmVxdWVzdFNhdmUoKTtcbiAgICAgICAgICB0aGlzLnNjaGVkdWxlU2F2ZWRJbmRpY2F0b3IoKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25PcGVuTGluazogYXN5bmMgKGxpbmspID0+IHRoaXMub3BlbkxpbmsobGluayksXG4gICAgICAgIG9uRXhwb3J0U3ZnOiBhc3luYyAoc3ZnKSA9PiB0aGlzLmV4cG9ydFRleHRGaWxlKFwic3ZnXCIsIHN2ZyksXG4gICAgICAgIG9uRXhwb3J0TWFya2Rvd246IGFzeW5jIChtYXJrZG93bikgPT4gdGhpcy5leHBvcnRUZXh0RmlsZShcIm1kXCIsIG1hcmtkb3duKSxcbiAgICAgICAgb25FeHBvcnRKc29uOiBhc3luYyAoanNvbikgPT4gdGhpcy5leHBvcnRUZXh0RmlsZShcImpzb25cIiwganNvbiksXG4gICAgICAgIHJlc29sdmVJbWFnZTogKHNvdXJjZSkgPT4gdGhpcy5yZXNvbHZlSW1hZ2Uoc291cmNlKSxcbiAgICAgICAgb25TYXZlUGFzdGVkSW1hZ2U6IGFzeW5jIChibG9iLCBzdWdnZXN0ZWROYW1lKSA9PiB0aGlzLnBsdWdpbi5zYXZlUGFzdGVkSW1hZ2UoYmxvYiwgc3VnZ2VzdGVkTmFtZSwgdGhpcy5maWxlKSxcbiAgICAgICAgb25VcGxvYWRJbWFnZTogYXN5bmMgKGJsb2IsIHN1Z2dlc3RlZE5hbWUpID0+IHRoaXMucGx1Z2luLnVwbG9hZEltYWdlVG9Ib3N0KGJsb2IsIHN1Z2dlc3RlZE5hbWUpLFxuICAgICAgICBvbkNyZWF0ZVN1Ym1hcDogYXN5bmMgKG5vZGUpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuZmlsZSkgdGhyb3cgbmV3IEVycm9yKFwiXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU1QzFBXHU2NzJBXHU1MTczXHU4MDU0XHU2NTg3XHU0RUY2XCIpO1xuICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5jcmVhdGVTdWJtYXBGaWxlKHRoaXMuZmlsZSwgbm9kZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uT3Blbk1pbmRNYXA6IGFzeW5jIChwYXRoLCBmb2N1c05vZGVJZCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLm9wZW5NaW5kTWFwUGF0aChwYXRoLCB0aGlzLmZpbGU/LnBhdGggPz8gXCJcIiwgdGhpcy5sZWFmLCBmb2N1c05vZGVJZCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uUmVuZGVyQ29kZTogYXN5bmMgKGJsb2NrLCBjb250YWluZXIpID0+IHtcbiAgICAgICAgICBjb25zdCBsb25nZXN0RmVuY2UgPSBNYXRoLm1heCgyLCAuLi5BcnJheS5mcm9tKGJsb2NrLmNvZGUubWF0Y2hBbGwoL2ArL2cpLCAobWF0Y2gpID0+IG1hdGNoWzBdLmxlbmd0aCkpO1xuICAgICAgICAgIGNvbnN0IGZlbmNlID0gXCJgXCIucmVwZWF0KGxvbmdlc3RGZW5jZSArIDEpO1xuICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gYCR7ZmVuY2V9JHtibG9jay5sYW5ndWFnZSA/PyBcIlwifVxcbiR7YmxvY2suY29kZX1cXG4ke2ZlbmNlfWA7XG4gICAgICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIG1hcmtkb3duLCBjb250YWluZXIsIHRoaXMuZmlsZT8ucGF0aCA/PyBcIlwiLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSwgdGhpcy5nZXRFZGl0b3JPcHRpb25zKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVkaXRvci5zZXREb2N1bWVudCh0aGlzLmRvY3VtZW50LCBmYWxzZSk7XG4gICAgICB0aGlzLmVkaXRvci5zZXRPcHRpb25zKHRoaXMuZ2V0RWRpdG9yT3B0aW9ucygpKTtcbiAgICB9XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yID0gbnVsbDtcbiAgICB0aGlzLmRvY3VtZW50ID0gbnVsbDtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZShjbGVhcj86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5zYXZlKGNsZWFyKTtcbiAgICB0aGlzLmVkaXRvcj8ubWFya1NhdmVkKCk7XG4gIH1cblxuICBhc3luYyBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnNhdmVkVGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5zYXZlZFRpbWVyKTtcbiAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yID0gbnVsbDtcbiAgICBhd2FpdCBzdXBlci5vbkNsb3NlKCk7XG4gIH1cblxuICByZWZyZXNoQXBwZWFyYW5jZSgpOiB2b2lkIHtcbiAgICB0aGlzLmFwcGx5Vmlld0NsYXNzZXMoKTtcbiAgICB0aGlzLmVkaXRvcj8uc2V0T3B0aW9ucyh0aGlzLmdldEVkaXRvck9wdGlvbnMoKSk7XG4gIH1cblxuICBmb2N1c05vZGUobm9kZUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmVkaXRvcj8uZm9jdXNOb2RlQnlJZChub2RlSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRFZGl0b3JPcHRpb25zKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0Tm9kZVNoYXBlOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Tm9kZVNoYXBlLFxuICAgICAgZGVmYXVsdEFwcGVhcmFuY2U6IHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMucGx1Z2luLnNldHRpbmdzKSxcbiAgICAgIHNob3dUYXNrUHJvZ3Jlc3M6IHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrUHJvZ3Jlc3MsXG4gICAgICBhdXRvRml0T25PcGVuOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRml0T25PcGVuLFxuICAgICAgaGlzdG9yeUxpbWl0OiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXRcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVZpZXdDbGFzc2VzKCk6IHZvaWQge1xuICAgIGNvbnN0IHRoZW1lID0gdGhpcy5kb2N1bWVudD8udGhlbWUgPz8gXCJhdXRvXCI7XG4gICAgdGhpcy5jb250ZW50RWwudG9nZ2xlQ2xhc3MoXCJtbWMtZm9yY2UtbGlnaHRcIiwgdGhlbWUgPT09IFwibGlnaHRcIik7XG4gICAgdGhpcy5jb250ZW50RWwudG9nZ2xlQ2xhc3MoXCJtbWMtZm9yY2UtZGFya1wiLCB0aGVtZSA9PT0gXCJkYXJrXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzY2hlZHVsZVNhdmVkSW5kaWNhdG9yKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNhdmVkVGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5zYXZlZFRpbWVyKTtcbiAgICB0aGlzLnNhdmVkVGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLmVkaXRvcj8ubWFya1NhdmVkKCksIDIzMDApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuTGluayhyYXdMaW5rOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsaW5rID0gcmF3TGluay50cmltKCk7XG4gICAgaWYgKC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QobGluaykpIHtcbiAgICAgIHdpbmRvdy5vcGVuKGxpbmssIFwiX2JsYW5rXCIsIFwibm9vcGVuZXIsbm9yZWZlcnJlclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgd2lraU1hdGNoID0gbGluay5tYXRjaCgvXlxcW1xcWyhbXFxzXFxTXSs/KVxcXVxcXSQvKTtcbiAgICBjb25zdCB0YXJnZXQgPSAod2lraU1hdGNoPy5bMV0gPz8gbGluaykuc3BsaXQoXCJ8XCIpWzBdPy50cmltKCkgPz8gbGluaztcbiAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KHRhcmdldCwgdGhpcy5maWxlPy5wYXRoID8/IFwiXCIsIGZhbHNlKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzb2x2ZUltYWdlKHJhd1NvdXJjZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3Qgc291cmNlID0gcmF3U291cmNlLnRyaW0oKTtcbiAgICBpZiAoIXNvdXJjZSkgcmV0dXJuIG51bGw7XG4gICAgaWYgKC9eKGh0dHBzPzp8ZGF0YTp8YmxvYjopL2kudGVzdChzb3VyY2UpKSByZXR1cm4gc291cmNlO1xuICAgIGNvbnN0IHdpa2lNYXRjaCA9IHNvdXJjZS5tYXRjaCgvXiE/XFxbXFxbKFtcXHNcXFNdKz8pXFxdXFxdJC8pO1xuICAgIGNvbnN0IHRhcmdldCA9ICh3aWtpTWF0Y2g/LlsxXSA/PyBzb3VyY2UpLnNwbGl0KFwifFwiKVswXT8uc3BsaXQoXCIjXCIpWzBdPy50cmltKCkgPz8gc291cmNlO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHRhcmdldCwgdGhpcy5maWxlPy5wYXRoID8/IFwiXCIpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGV4cG9ydFRleHRGaWxlKGV4dGVuc2lvbjogXCJzdmdcIiB8IFwibWRcIiB8IFwianNvblwiLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5maWxlO1xuICAgIGNvbnN0IHBhcmVudFBhdGggPSBmaWxlPy5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBiYXNlTmFtZSA9IGZpbGU/LmJhc2VuYW1lID8/IHRoaXMuZG9jdW1lbnQ/LnRpdGxlID8/IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCI7XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMucGx1Z2luLmdldEF2YWlsYWJsZVBhdGgobm9ybWFsaXplUGF0aChgJHtwYXJlbnRQYXRoID8gYCR7cGFyZW50UGF0aH0vYCA6IFwiXCJ9JHtiYXNlTmFtZX0uJHtleHRlbnNpb259YCkpO1xuICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICBuZXcgTm90aWNlKGBcdTVERjJcdTVCRkNcdTUxRkFcdUZGMUEke3BhdGh9YCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1lbnUsIE1vZGFsLCBOb3RpY2UsIHNldEljb24gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIGNsb25lRG9jdW1lbnQsXG4gIGNsb25lTm9kZVdpdGhGcmVzaElkcyxcbiAgY2hpbGRyZW5Ub1RhYmxlLFxuICBjb250YWluc05vZGUsXG4gIGNyZWF0ZU5vZGUsXG4gIGRvY3VtZW50VG9NYXJrZG93bixcbiAgZXh0cmFjdEZpcnN0V2lraUxpbmssXG4gIGZpbmRBbmNlc3RvcnMsXG4gIGZpbmROb2RlLFxuICBmaW5kUGFyZW50LFxuICBmbGF0dGVuTm9kZXMsXG4gIGdldFRhc2tQcm9ncmVzcyxcbiAgbWVyZ2VBcHBlYXJhbmNlLFxuICBub2RlU2VhcmNoVGV4dCxcbiAgbm9ybWFsaXplRG9jdW1lbnQsXG4gIG5ld0lkLFxuICBub2RlQ29udGVudEJsb2NrcyxcbiAgbm9kZVBsYWluVGV4dCxcbiAgc3luY05vZGVMZWdhY3lGaWVsZHMsXG4gIHBhcnNlRmVuY2VkQ29kZSxcbiAgcGFyc2VNYXJrZG93blRhYmxlLFxuICBub3JtYWxpemVSaWNoVGV4dCxcbiAgcmljaFRleHRQbGFpblRleHQsXG4gIHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzLFxuICBjaGFyYWN0ZXJTdHlsZXNUb1JpY2hUZXh0LFxuICBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZSxcbiAgcmVjb25jaWxlUmljaFRleHRBZnRlckVkaXQsXG4gIHR5cGUgQmFja2dyb3VuZFBhdHRlcm4sXG4gIHR5cGUgRWRnZVN0eWxlLFxuICB0eXBlIEZvbnRGYW1pbHlNb2RlLFxuICB0eXBlIE1pbmRNYXBBcHBlYXJhbmNlLFxuICB0eXBlIE1pbmRNYXBEb2N1bWVudCxcbiAgdHlwZSBNaW5kTWFwQ29kZUJsb2NrLFxuICB0eXBlIE1pbmRNYXBDb250ZW50QmxvY2ssXG4gIHR5cGUgTWluZE1hcEltYWdlQ29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBOb2RlLFxuICB0eXBlIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBTdWJtYXAsXG4gIHR5cGUgTWluZE1hcFRleHRSdW4sXG4gIHR5cGUgTWluZE1hcFRleHRTdHlsZSxcbiAgdHlwZSBOb2RlU2hhcGUsXG4gIHR5cGUgVGFza1N0YXR1cyxcbiAgcmVtb3ZlTm9kZVxufSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgY29tcHV0ZUxheW91dCwgZG9jdW1lbnRUb1N2ZywgZWRnZVBhdGgsIHR5cGUgTGF5b3V0UmVzdWx0IH0gZnJvbSBcIi4vbGF5b3V0XCI7XG5pbXBvcnQgeyBDb2RlRWRpdE1vZGFsLCBUYWJsZUVkaXRNb2RhbCB9IGZyb20gXCIuL2NvbnRlbnQtbW9kYWxzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEVkaXRvckNhbGxiYWNrcyB7XG4gIG9uQ2hhbmdlOiAoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCkgPT4gdm9pZDtcbiAgb25PcGVuTGluazogKGxpbms6IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIG9uRXhwb3J0U3ZnOiAoc3ZnOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICBvbkV4cG9ydE1hcmtkb3duOiAobWFya2Rvd246IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIG9uRXhwb3J0SnNvbjogKGpzb246IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIHJlc29sdmVJbWFnZTogKHNvdXJjZTogc3RyaW5nKSA9PiBzdHJpbmcgfCBudWxsO1xuICBvblNhdmVQYXN0ZWRJbWFnZTogKGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICBvblVwbG9hZEltYWdlOiAoYmxvYjogQmxvYiwgc3VnZ2VzdGVkTmFtZTogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIG9uQ3JlYXRlU3VibWFwOiAobm9kZTogTWluZE1hcE5vZGUpID0+IFByb21pc2U8TWluZE1hcFN1Ym1hcD47XG4gIG9uT3Blbk1pbmRNYXA6IChwYXRoOiBzdHJpbmcsIGZvY3VzTm9kZUlkPzogc3RyaW5nKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgb25SZW5kZXJDb2RlOiAoYmxvY2s6IE1pbmRNYXBDb2RlQmxvY2ssIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBFZGl0b3JPcHRpb25zIHtcbiAgZGVmYXVsdE5vZGVTaGFwZTogTm9kZVNoYXBlO1xuICBkZWZhdWx0QXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2U7XG4gIHNob3dUYXNrUHJvZ3Jlc3M6IGJvb2xlYW47XG4gIGF1dG9GaXRPbk9wZW46IGJvb2xlYW47XG4gIGhpc3RvcnlMaW1pdDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgTm9kZUVkaXRWYWx1ZXMge1xuICBjb250ZW50OiBNaW5kTWFwQ29udGVudEJsb2NrW107XG4gIG5vdGU6IHN0cmluZztcbiAgbGluazogc3RyaW5nO1xuICBpY29uOiBzdHJpbmc7XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICB0YXNrPzogVGFza1N0YXR1cztcbiAgY29sb3I/OiBzdHJpbmc7XG4gIHRleHRDb2xvcj86IHN0cmluZztcbiAgYm9yZGVyQ29sb3I/OiBzdHJpbmc7XG4gIGJvcmRlcldpZHRoPzogbnVtYmVyO1xuICBzaGFwZT86IE5vZGVTaGFwZTtcbiAgYm9sZD86IGJvb2xlYW47XG4gIGl0YWxpYz86IGJvb2xlYW47XG4gIHVuZGVybGluZT86IGJvb2xlYW47XG4gIGZvbnRTaXplPzogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBzdHlsZUVxdWFscyhsZWZ0OiBNaW5kTWFwVGV4dFN0eWxlIHwgdW5kZWZpbmVkLCByaWdodDogTWluZE1hcFRleHRTdHlsZSB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkobGVmdCA/PyB7fSkgPT09IEpTT04uc3RyaW5naWZ5KHJpZ2h0ID8/IHt9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyUmljaFRleHRSdW5zKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnRhaW5lci5lbXB0eSgpO1xuICBpZiAoIXJ1bnM/Lmxlbmd0aCkge1xuICAgIGNvbnRhaW5lci5zZXRUZXh0KGZhbGxiYWNrVGV4dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgcnVuIG9mIHJ1bnMpIHtcbiAgICBjb25zdCBzcGFuID0gY29udGFpbmVyLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXJpY2gtcnVuXCIsIHRleHQ6IHJ1bi50ZXh0IH0pO1xuICAgIGlmIChydW4uc3R5bGU/LmJvbGQgIT09IHVuZGVmaW5lZCkgc3Bhbi5zdHlsZS5mb250V2VpZ2h0ID0gcnVuLnN0eWxlLmJvbGQgPyBcIjcwMFwiIDogXCI0MDBcIjtcbiAgICBpZiAocnVuLnN0eWxlPy5pdGFsaWMgIT09IHVuZGVmaW5lZCkgc3Bhbi5zdHlsZS5mb250U3R5bGUgPSBydW4uc3R5bGUuaXRhbGljID8gXCJpdGFsaWNcIiA6IFwibm9ybWFsXCI7XG4gICAgY29uc3QgZGVjb3JhdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHJ1bi5zdHlsZT8udW5kZXJsaW5lKSBkZWNvcmF0aW9ucy5wdXNoKFwidW5kZXJsaW5lXCIpO1xuICAgIGlmIChydW4uc3R5bGU/LnN0cmlrZSkgZGVjb3JhdGlvbnMucHVzaChcImxpbmUtdGhyb3VnaFwiKTtcbiAgICBpZiAoZGVjb3JhdGlvbnMubGVuZ3RoKSBzcGFuLnN0eWxlLnRleHREZWNvcmF0aW9uTGluZSA9IGRlY29yYXRpb25zLmpvaW4oXCIgXCIpO1xuICAgIGlmIChydW4uc3R5bGU/LmNvbG9yKSBzcGFuLnN0eWxlLmNvbG9yID0gcnVuLnN0eWxlLmNvbG9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN0eWxlRnJvbUVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQsIGluaGVyaXRlZDogTWluZE1hcFRleHRTdHlsZSk6IE1pbmRNYXBUZXh0U3R5bGUge1xuICBjb25zdCBzdHlsZTogTWluZE1hcFRleHRTdHlsZSA9IHsgLi4uaW5oZXJpdGVkIH07XG4gIGNvbnN0IHRhZyA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICBpZiAodGFnID09PSBcImJcIiB8fCB0YWcgPT09IFwic3Ryb25nXCIpIHN0eWxlLmJvbGQgPSB0cnVlO1xuICBpZiAodGFnID09PSBcImlcIiB8fCB0YWcgPT09IFwiZW1cIikgc3R5bGUuaXRhbGljID0gdHJ1ZTtcbiAgaWYgKHRhZyA9PT0gXCJ1XCIpIHN0eWxlLnVuZGVybGluZSA9IHRydWU7XG4gIGlmICh0YWcgPT09IFwic1wiIHx8IHRhZyA9PT0gXCJzdHJpa2VcIiB8fCB0YWcgPT09IFwiZGVsXCIpIHN0eWxlLnN0cmlrZSA9IHRydWU7XG4gIGNvbnN0IGlubGluZSA9IGVsZW1lbnQuc3R5bGU7XG4gIGlmIChpbmxpbmUuZm9udFdlaWdodCAmJiAoaW5saW5lLmZvbnRXZWlnaHQgPT09IFwiYm9sZFwiIHx8IE51bWJlcihpbmxpbmUuZm9udFdlaWdodCkgPj0gNjAwKSkgc3R5bGUuYm9sZCA9IHRydWU7XG4gIGlmIChpbmxpbmUuZm9udFN0eWxlID09PSBcIml0YWxpY1wiKSBzdHlsZS5pdGFsaWMgPSB0cnVlO1xuICBjb25zdCBkZWNvcmF0aW9uID0gYCR7aW5saW5lLnRleHREZWNvcmF0aW9ufSAke2lubGluZS50ZXh0RGVjb3JhdGlvbkxpbmV9YDtcbiAgaWYgKGRlY29yYXRpb24uaW5jbHVkZXMoXCJ1bmRlcmxpbmVcIikpIHN0eWxlLnVuZGVybGluZSA9IHRydWU7XG4gIGlmIChkZWNvcmF0aW9uLmluY2x1ZGVzKFwibGluZS10aHJvdWdoXCIpKSBzdHlsZS5zdHJpa2UgPSB0cnVlO1xuICBjb25zdCBmb250Q29sb3IgPSB0YWcgPT09IFwiZm9udFwiID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjb2xvclwiKSA6IG51bGw7XG4gIGNvbnN0IGNvbG9yID0gaW5saW5lLmNvbG9yIHx8IGZvbnRDb2xvciB8fCBcIlwiO1xuICBpZiAoY29sb3IpIHtcbiAgICBjb25zdCBwcm9iZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIHByb2JlLnN0eWxlLmNvbG9yID0gY29sb3I7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwcm9iZSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGdldENvbXB1dGVkU3R5bGUocHJvYmUpLmNvbG9yLm1hdGNoKC9cXGQrL2cpPy5zbGljZSgwLCAzKS5tYXAoTnVtYmVyKTtcbiAgICBwcm9iZS5yZW1vdmUoKTtcbiAgICBpZiAobm9ybWFsaXplZD8ubGVuZ3RoID09PSAzKSBzdHlsZS5jb2xvciA9IGAjJHtub3JtYWxpemVkLm1hcCgodmFsdWUpID0+IHZhbHVlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpLmpvaW4oXCJcIil9YDtcbiAgfVxuICByZXR1cm4gc3R5bGU7XG59XG5cbmZ1bmN0aW9uIHJlYWRSaWNoVGV4dEVkaXRvcihlZGl0b3I6IEhUTUxFbGVtZW50KTogeyB0ZXh0OiBzdHJpbmc7IHJpY2hUZXh0PzogTWluZE1hcFRleHRSdW5bXSB9IHtcbiAgY29uc3QgcmF3UnVuczogTWluZE1hcFRleHRSdW5bXSA9IFtdO1xuICBjb25zdCB2aXNpdCA9IChub2RlOiBOb2RlLCBpbmhlcml0ZWQ6IE1pbmRNYXBUZXh0U3R5bGUpOiB2b2lkID0+IHtcbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgIGNvbnN0IHRleHQgPSAobm9kZS50ZXh0Q29udGVudCA/PyBcIlwiKS5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKTtcbiAgICAgIGlmICghdGV4dCkgcmV0dXJuO1xuICAgICAgY29uc3Qgc3R5bGUgPSBPYmplY3QudmFsdWVzKGluaGVyaXRlZCkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8geyAuLi5pbmhlcml0ZWQgfSA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHByZXZpb3VzID0gcmF3UnVucy5hdCgtMSk7XG4gICAgICBpZiAocHJldmlvdXMgJiYgc3R5bGVFcXVhbHMocHJldmlvdXMuc3R5bGUsIHN0eWxlKSkgcHJldmlvdXMudGV4dCArPSB0ZXh0O1xuICAgICAgZWxzZSByYXdSdW5zLnB1c2goeyB0ZXh0LCBzdHlsZSB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkgcmV0dXJuO1xuICAgIGlmIChub2RlLnRhZ05hbWUgPT09IFwiQlJcIikge1xuICAgICAgcmF3UnVucy5wdXNoKHsgdGV4dDogXCIgXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHN0eWxlID0gc3R5bGVGcm9tRWxlbWVudChub2RlLCBpbmhlcml0ZWQpO1xuICAgIG5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIHN0eWxlKSk7XG4gICAgaWYgKFtcIkRJVlwiLCBcIlBcIl0uaW5jbHVkZXMobm9kZS50YWdOYW1lKSAmJiByYXdSdW5zLmxlbmd0aCAmJiAhcmF3UnVucy5hdCgtMSk/LnRleHQuZW5kc1dpdGgoXCIgXCIpKSByYXdSdW5zLnB1c2goeyB0ZXh0OiBcIiBcIiB9KTtcbiAgfTtcbiAgZWRpdG9yLmNoaWxkTm9kZXMuZm9yRWFjaCgoY2hpbGQpID0+IHZpc2l0KGNoaWxkLCB7fSkpO1xuICBjb25zdCBmYWxsYmFjayA9IGVkaXRvci50ZXh0Q29udGVudD8ucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpID8/IFwiXCI7XG4gIGNvbnN0IHJpY2hUZXh0ID0gbm9ybWFsaXplUmljaFRleHQocmF3UnVucywgZmFsbGJhY2spO1xuICByZXR1cm4geyB0ZXh0OiByaWNoVGV4dFBsYWluVGV4dChyaWNoVGV4dCwgZmFsbGJhY2spLnRyaW0oKSwgcmljaFRleHQgfTtcbn1cblxuY2xhc3MgSW1hZ2VQcmV2aWV3TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgc2NhbGUgPSAxO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwcml2YXRlIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IGFsdDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJtbWMtaW1hZ2UtcHJldmlldy1tb2RhbFwiKTtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dCh0aGlzLmFsdCB8fCBcIlx1NTZGRVx1NzI0N1x1OTg4NFx1ODlDOFwiKTtcbiAgICBjb25zdCB0b29sYmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1pbWFnZS1wcmV2aWV3LXRvb2xiYXJcIiB9KTtcbiAgICBjb25zdCBpbWFnZVdyYXAgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLXByZXZpZXctc3RhZ2VcIiB9KTtcbiAgICBjb25zdCBpbWFnZSA9IGltYWdlV3JhcC5jcmVhdGVFbChcImltZ1wiLCB7IGF0dHI6IHsgc3JjOiB0aGlzLnNvdXJjZSwgYWx0OiB0aGlzLmFsdCB8fCBcIlx1NTZGRVx1NzI0N1wiIH0gfSk7XG4gICAgbGV0IGJhc2VXaWR0aCA9IDA7XG4gICAgbGV0IGJhc2VIZWlnaHQgPSAwO1xuICAgIGNvbnN0IGFwcGx5U2NhbGUgPSAoKTogdm9pZCA9PiB7XG4gICAgICBpZiAoIWJhc2VXaWR0aCB8fCAhYmFzZUhlaWdodCkgcmV0dXJuO1xuICAgICAgaW1hZ2Uuc3R5bGUud2lkdGggPSBgJHtNYXRoLm1heCgxLCBNYXRoLnJvdW5kKGJhc2VXaWR0aCAqIHRoaXMuc2NhbGUpKX1weGA7XG4gICAgICBpbWFnZS5zdHlsZS5oZWlnaHQgPSBgJHtNYXRoLm1heCgxLCBNYXRoLnJvdW5kKGJhc2VIZWlnaHQgKiB0aGlzLnNjYWxlKSl9cHhgO1xuICAgIH07XG4gICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgYXZhaWxhYmxlV2lkdGggPSBNYXRoLm1heCgzMjAsIGltYWdlV3JhcC5jbGllbnRXaWR0aCAqIDAuOSk7XG4gICAgICBjb25zdCBhdmFpbGFibGVIZWlnaHQgPSBNYXRoLm1heCgyMjAsIGltYWdlV3JhcC5jbGllbnRIZWlnaHQgKiAwLjkpO1xuICAgICAgY29uc3QgZml0ID0gTWF0aC5taW4oMSwgYXZhaWxhYmxlV2lkdGggLyBNYXRoLm1heCgxLCBpbWFnZS5uYXR1cmFsV2lkdGgpLCBhdmFpbGFibGVIZWlnaHQgLyBNYXRoLm1heCgxLCBpbWFnZS5uYXR1cmFsSGVpZ2h0KSk7XG4gICAgICBiYXNlV2lkdGggPSBNYXRoLm1heCgxLCBpbWFnZS5uYXR1cmFsV2lkdGggKiBmaXQpO1xuICAgICAgYmFzZUhlaWdodCA9IE1hdGgubWF4KDEsIGltYWdlLm5hdHVyYWxIZWlnaHQgKiBmaXQpO1xuICAgICAgYXBwbHlTY2FsZSgpO1xuICAgIH0pO1xuICAgIGNvbnN0IGJ1dHRvbiA9IChsYWJlbDogc3RyaW5nLCBhY3Rpb246ICgpID0+IHZvaWQpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IGVsID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhY3Rpb24pO1xuICAgIH07XG4gICAgYnV0dG9uKFwiXHUyMjEyXCIsICgpID0+IHsgdGhpcy5zY2FsZSA9IE1hdGgubWF4KDAuMiwgdGhpcy5zY2FsZSAtIDAuMik7IGFwcGx5U2NhbGUoKTsgfSk7XG4gICAgYnV0dG9uKFwiMTAwJVwiLCAoKSA9PiB7IHRoaXMuc2NhbGUgPSAxOyBhcHBseVNjYWxlKCk7IH0pO1xuICAgIGJ1dHRvbihcIitcIiwgKCkgPT4geyB0aGlzLnNjYWxlID0gTWF0aC5taW4oNSwgdGhpcy5zY2FsZSArIDAuMik7IGFwcGx5U2NhbGUoKTsgfSk7XG4gICAgaW1hZ2VXcmFwLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnNjYWxlID0gTWF0aC5taW4oNSwgTWF0aC5tYXgoMC4yLCB0aGlzLnNjYWxlICsgKGV2ZW50LmRlbHRhWSA8IDAgPyAwLjE1IDogLTAuMTUpKSk7XG4gICAgICBhcHBseVNjYWxlKCk7XG4gICAgfSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcbiAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKCkgPT4geyB0aGlzLnNjYWxlID0gMTsgYXBwbHlTY2FsZSgpOyB9KTtcbiAgfVxufVxuXG5jbGFzcyBOb2RlRWRpdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IG5vZGU6IE1pbmRNYXBOb2RlO1xuICBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRTaGFwZTogTm9kZVNoYXBlO1xuICBwcml2YXRlIHJlYWRvbmx5IGNhbGxiYWNrczogUGljazxNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzLCBcInJlc29sdmVJbWFnZVwiIHwgXCJvblNhdmVQYXN0ZWRJbWFnZVwiIHwgXCJvblVwbG9hZEltYWdlXCI+O1xuICBwcml2YXRlIHJlYWRvbmx5IHN1Ym1pdDogKHZhbHVlczogTm9kZUVkaXRWYWx1ZXMsIG1vZGU6IFwiYXV0b3NhdmVcIiB8IFwiY29tbWl0XCIpID0+IHZvaWQ7XG4gIHByaXZhdGUgc2F2ZU9uQ2xvc2U6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNsb3NlV2l0aG91dEZsdXNoID0gZmFsc2U7XG4gIHByaXZhdGUgb3V0c2lkZVBvaW50ZXJIYW5kbGVyOiAoKGV2ZW50OiBQb2ludGVyRXZlbnQpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgbm9kZTogTWluZE1hcE5vZGUsXG4gICAgZGVmYXVsdFNoYXBlOiBOb2RlU2hhcGUsXG4gICAgY2FsbGJhY2tzOiBQaWNrPE1pbmRNYXBFZGl0b3JDYWxsYmFja3MsIFwicmVzb2x2ZUltYWdlXCIgfCBcIm9uU2F2ZVBhc3RlZEltYWdlXCIgfCBcIm9uVXBsb2FkSW1hZ2VcIj4sXG4gICAgc3VibWl0OiAodmFsdWVzOiBOb2RlRWRpdFZhbHVlcywgbW9kZTogXCJhdXRvc2F2ZVwiIHwgXCJjb21taXRcIikgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubm9kZSA9IG5vZGU7XG4gICAgdGhpcy5kZWZhdWx0U2hhcGUgPSBkZWZhdWx0U2hhcGU7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBjYWxsYmFja3M7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcdTUxODVcdTVCQjlcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtbm9kZS1lZGl0LW1vZGFsXCIpO1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtZWRpdC1mb3JtXCIgfSk7XG4gICAgZm9ybS5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgICAgdGV4dDogXCJcdTgyODJcdTcwQjlcdTUxODVcdTVCQjlcdTc1MzFcdTUzRUZcdTYzOTJcdTVFOEZcdTc2ODRcdTY1ODdcdTVCNTdcdTU3NTdcdTU0OENcdTU2RkVcdTcyNDdcdTU3NTdcdTdFQzRcdTYyMTBcdTMwMDJcdTUzRUZcdTRFRTVcdTUzRUFcdTRGRERcdTc1NTlcdTU2RkVcdTcyNDdcdUZGMENcdTRFNUZcdTUzRUZcdTRFRTVcdTdFQzRcdTU0MDhcdTRFM0FcdTU2RkVcdTcyNDdcdTIxOTJcdTY1ODdcdTVCNTdcdTMwMDFcdTY1ODdcdTVCNTdcdTIxOTJcdTU2RkVcdTcyNDdcdUZGMENcdTYyMTZcdTY1ODdcdTVCNTdcdTIxOTJcdTU2RkVcdTcyNDdcdTIxOTJcdTY1ODdcdTVCNTdcdTMwMDJcIlxuICAgIH0pO1xuXG4gICAgbGV0IHdvcmtpbmdCbG9ja3M6IE1pbmRNYXBDb250ZW50QmxvY2tbXSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobm9kZUNvbnRlbnRCbG9ja3ModGhpcy5ub2RlKSkpIGFzIE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgICBpZiAoIXdvcmtpbmdCbG9ja3MubGVuZ3RoKSB3b3JraW5nQmxvY2tzID0gW3sgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0OiBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiIH1dO1xuICAgIGxldCBzY2hlZHVsZUF1dG9TYXZlOiAoKSA9PiB2b2lkID0gKCkgPT4gdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgYWN0aW9uUm93ID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGJsb2Nrc0VsID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stbGlzdFwiIH0pO1xuXG4gICAgY29uc3QgY2xvbmVCbG9ja3MgPSAoKTogTWluZE1hcENvbnRlbnRCbG9ja1tdID0+IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkod29ya2luZ0Jsb2NrcykpIGFzIE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgICBjb25zdCB2YWxpZEJsb2NrcyA9ICgpOiBNaW5kTWFwQ29udGVudEJsb2NrW10gPT4gY2xvbmVCbG9ja3MoKS5maWx0ZXIoKGJsb2NrKSA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIgPyBCb29sZWFuKGJsb2NrLnNvdXJjZS50cmltKCkpIDogQm9vbGVhbihibG9jay50ZXh0LnRyaW0oKSkpO1xuXG4gICAgY29uc3QgcmVuZGVyVGV4dEJsb2NrID0gKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGJsb2NrOiBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgdG9vbGJhciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXJpY2gtdGV4dC10b29sYmFyXCIgfSk7XG4gICAgICBjb25zdCBzb3VyY2UgPSBjb250YWluZXIuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICAgIGNsczogXCJtbWMtcmljaC10ZXh0LXNvdXJjZVwiLFxuICAgICAgICBhdHRyOiB7IHJvd3M6IFwiM1wiLCBzcGVsbGNoZWNrOiBcInRydWVcIiwgcGxhY2Vob2xkZXI6IFwiXHU4RjkzXHU1MTY1XHU2NTg3XHU1QjU3XHVGRjFCXHU1M0VGXHU0RUU1XHU1MTY4XHU5MEU4XHU1MjIwXHU5NjY0XHVGRjBDXHU4QkE5XHU4MjgyXHU3MEI5XHU1M0VBXHU0RkREXHU3NTU5XHU1NkZFXHU3MjQ3XCIgfVxuICAgICAgfSk7XG4gICAgICBzb3VyY2UudmFsdWUgPSBibG9jay50ZXh0O1xuICAgICAgbGV0IHNhdmVkU3RhcnQgPSBzb3VyY2UudmFsdWUubGVuZ3RoO1xuICAgICAgbGV0IHNhdmVkRW5kID0gc291cmNlLnZhbHVlLmxlbmd0aDtcbiAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXJpY2gtc2VsZWN0aW9uLXN0YXR1c1wiIH0pO1xuICAgICAgY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcmljaC1wcmV2aWV3LWxhYmVsXCIsIHRleHQ6IFwiXHU2NTg3XHU1QjU3XHU2ODM3XHU1RjBGXHU5ODg0XHU4OUM4XCIgfSk7XG4gICAgICBjb25zdCBwcmV2aWV3ID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcmljaC10ZXh0LXByZXZpZXdcIiB9KTtcbiAgICAgIGNvbnN0IHVwZGF0ZVByZXZpZXcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHJlbmRlclJpY2hUZXh0UnVucyhwcmV2aWV3LCBibG9jay5yaWNoVGV4dCwgYmxvY2sudGV4dCB8fCBcIlx1OTg4NFx1ODlDOFx1NjU4N1x1NUI1N1wiKTtcbiAgICAgICAgcHJldmlldy50b2dnbGVDbGFzcyhcImlzLXBsYWNlaG9sZGVyXCIsICFibG9jay50ZXh0KTtcbiAgICAgIH07XG4gICAgICBjb25zdCByZW1lbWJlciA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2F2ZWRTdGFydCA9IHNvdXJjZS5zZWxlY3Rpb25TdGFydCA/PyAwO1xuICAgICAgICBzYXZlZEVuZCA9IHNvdXJjZS5zZWxlY3Rpb25FbmQgPz8gc2F2ZWRTdGFydDtcbiAgICAgICAgY29uc3QgZnJvbSA9IE1hdGgubWluKHNhdmVkU3RhcnQsIHNhdmVkRW5kKTtcbiAgICAgICAgY29uc3QgdG8gPSBNYXRoLm1heChzYXZlZFN0YXJ0LCBzYXZlZEVuZCk7XG4gICAgICAgIHNlbGVjdGlvbi5zZXRUZXh0KGZyb20gPT09IHRvID8gYFx1NTE0OVx1NjgwN1x1NEY0RFx1N0Y2RVx1RkYxQSR7ZnJvbSArIDF9YCA6IGBcdTVERjJcdTkwMDlcdTYyRTlcdTdCMkMgJHtmcm9tICsgMX1cdTIwMTMke3RvfSBcdTRFMkFcdTVCNTdcdTdCMjZgKTtcbiAgICAgIH07XG4gICAgICBjb25zdCByYW5nZSA9ICgpOiB7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyIH0gfCBudWxsID0+IHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihibG9jay50ZXh0Lmxlbmd0aCwgTWF0aC5taW4oc2F2ZWRTdGFydCwgc2F2ZWRFbmQpKSk7XG4gICAgICAgIGNvbnN0IGVuZCA9IE1hdGgubWF4KHN0YXJ0LCBNYXRoLm1pbihibG9jay50ZXh0Lmxlbmd0aCwgTWF0aC5tYXgoc2F2ZWRTdGFydCwgc2F2ZWRFbmQpKSk7XG4gICAgICAgIGlmIChzdGFydCA9PT0gZW5kKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIlx1OEJGN1x1NTE0OFx1OTAwOVx1NjJFOVx1OTcwMFx1ODk4MVx1OEJCRVx1N0Y2RVx1NjgzQ1x1NUYwRlx1NzY4NFx1NjU4N1x1NUI1N1wiKTtcbiAgICAgICAgICBzb3VyY2UuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2UuZm9jdXMoKTsgc291cmNlLnNldFNlbGVjdGlvblJhbmdlKHN0YXJ0LCBlbmQpO1xuICAgICAgICByZXR1cm4geyBzdGFydCwgZW5kIH07XG4gICAgICB9O1xuICAgICAgY29uc3Qgc3R5bGVCdXR0b24gPSAobGFiZWw6IHN0cmluZywgdGl0bGU6IHN0cmluZywgYWN0aW9uOiAoKSA9PiB2b2lkLCBjbHMgPSBcIlwiKTogSFRNTEJ1dHRvbkVsZW1lbnQgPT4ge1xuICAgICAgICBjb25zdCBidG4gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBgbW1jLXJpY2gtdG9vbGJhci1idXR0b24gJHtjbHN9YC50cmltKCksIHRleHQ6IGxhYmVsLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIsIHRpdGxlIH0gfSk7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IGFjdGlvbigpOyB9KTtcbiAgICAgICAgcmV0dXJuIGJ0bjtcbiAgICAgIH07XG4gICAgICBjb25zdCBhcHBseUJvb2xlYW4gPSAoa2V5OiBcImJvbGRcIiB8IFwiaXRhbGljXCIgfCBcInVuZGVybGluZVwiKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gcmFuZ2UoKTsgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBzdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhibG9jay5yaWNoVGV4dCwgYmxvY2sudGV4dCk7XG4gICAgICAgIGNvbnN0IGVuYWJsZWQgPSBzdHlsZXMuc2xpY2Uoc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCkuZXZlcnkoKHN0eWxlKSA9PiBzdHlsZVtrZXldID09PSB0cnVlKTtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCwgeyBba2V5XTogIWVuYWJsZWQgfSk7XG4gICAgICAgIHVwZGF0ZVByZXZpZXcoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyBzb3VyY2Uuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCk7IHJlbWVtYmVyKCk7XG4gICAgICB9O1xuICAgICAgc3R5bGVCdXR0b24oXCJCXCIsIFwiXHU1MkEwXHU3Qzk3XHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XCIsICgpID0+IGFwcGx5Qm9vbGVhbihcImJvbGRcIiksIFwiaXMtYm9sZFwiKTtcbiAgICAgIHN0eWxlQnV0dG9uKFwiSVwiLCBcIlx1NjU5Q1x1NEY1M1x1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1wiLCAoKSA9PiBhcHBseUJvb2xlYW4oXCJpdGFsaWNcIiksIFwiaXMtaXRhbGljXCIpO1xuICAgICAgc3R5bGVCdXR0b24oXCJVXCIsIFwiXHU3RUQ5XHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XHU1MkEwXHU0RTBCXHU1MjEyXHU3RUJGXCIsICgpID0+IGFwcGx5Qm9vbGVhbihcInVuZGVybGluZVwiKSwgXCJpcy11bmRlcmxpbmVcIik7XG4gICAgICBjb25zdCBjb2xvckxhYmVsID0gdG9vbGJhci5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcIm1tYy1yaWNoLWNvbG9yLWJ1dHRvblwiLCBhdHRyOiB7IHRpdGxlOiBcIlx1NEZFRVx1NjUzOVx1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiIH0gfSk7XG4gICAgICBjb2xvckxhYmVsLmNyZWF0ZVNwYW4oeyB0ZXh0OiBcIlx1OTg5Q1x1ODI3MlwiIH0pO1xuICAgICAgY29uc3QgY29sb3JMaW5lID0gY29sb3JMYWJlbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy1yaWNoLWNvbG9yLWxpbmVcIiB9KTtcbiAgICAgIGNvbnN0IGNvbG9yID0gY29sb3JMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjb2xvclwiLCBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIlx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiIH0gfSk7XG4gICAgICBjb2xvci52YWx1ZSA9IFwiI2VmNDQ0NFwiO1xuICAgICAgY29sb3JMaW5lLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLnZhbHVlO1xuICAgICAgY29sb3IuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHsgY29sb3JMaW5lLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLnZhbHVlOyB9KTtcbiAgICAgIGNvbG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IHJhbmdlKCk7IGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCwgeyBjb2xvcjogY29sb3IudmFsdWUgfSk7XG4gICAgICAgIHVwZGF0ZVByZXZpZXcoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgfSk7XG4gICAgICBzdHlsZUJ1dHRvbihcIlx1NkUwNVx1OTY2NFx1NjgzQ1x1NUYwRlwiLCBcIlx1NkUwNVx1OTY2NFx1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1x1NjgzQ1x1NUYwRlwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gcmFuZ2UoKTsgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgICAgICBibG9jay5yaWNoVGV4dCA9IGFwcGx5UmljaFRleHRTdHlsZVJhbmdlKGJsb2NrLnRleHQsIGJsb2NrLnJpY2hUZXh0LCBzZWxlY3RlZC5zdGFydCwgc2VsZWN0ZWQuZW5kLCBudWxsKTtcbiAgICAgICAgdXBkYXRlUHJldmlldygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7XG4gICAgICB9LCBcImlzLXdpZGVcIik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcInNlbGVjdFwiLCByZW1lbWJlcik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHJlbWVtYmVyKTtcbiAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCByZW1lbWJlcik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHNvdXJjZS52YWx1ZS5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKTtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSByZWNvbmNpbGVSaWNoVGV4dEFmdGVyRWRpdChibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgbmV4dCk7XG4gICAgICAgIGJsb2NrLnRleHQgPSBuZXh0O1xuICAgICAgICBzb3VyY2UudmFsdWUgPSBuZXh0O1xuICAgICAgICByZW1lbWJlcigpOyB1cGRhdGVQcmV2aWV3KCk7IHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgIH0pO1xuICAgICAgdXBkYXRlUHJldmlldygpOyByZW1lbWJlcigpO1xuICAgIH07XG5cbiAgICBjb25zdCBjaG9vc2VJbWFnZSA9IChibG9jazogTWluZE1hcEltYWdlQ29udGVudEJsb2NrLCBtb2RlOiBcImxvY2FsXCIgfCBcInJlbW90ZVwiLCByZWZyZXNoOiAoKSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgIGlucHV0LnR5cGUgPSBcImZpbGVcIjtcbiAgICAgIGlucHV0LmFjY2VwdCA9IFwiaW1hZ2UvKlwiO1xuICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBpbnB1dC5maWxlcz8uWzBdO1xuICAgICAgICBpZiAoIWZpbGUpIHJldHVybjtcbiAgICAgICAgY29uc3Qgb3BlcmF0aW9uID0gbW9kZSA9PT0gXCJyZW1vdGVcIlxuICAgICAgICAgID8gdGhpcy5jYWxsYmFja3Mub25VcGxvYWRJbWFnZShmaWxlLCBmaWxlLm5hbWUpXG4gICAgICAgICAgOiB0aGlzLmNhbGxiYWNrcy5vblNhdmVQYXN0ZWRJbWFnZShmaWxlLCBmaWxlLm5hbWUpO1xuICAgICAgICB2b2lkIG9wZXJhdGlvbi50aGVuKChwYXRoKSA9PiB7XG4gICAgICAgICAgYmxvY2suc291cmNlID0gcGF0aDtcbiAgICAgICAgICBpZiAoIWJsb2NrLmFsdCkgYmxvY2suYWx0ID0gZmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sIFwiXCIpO1xuICAgICAgICAgIHJlZnJlc2goKTsgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gaW1hZ2Ugb3BlcmF0aW9uIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgICAgbmV3IE5vdGljZShtb2RlID09PSBcInJlbW90ZVwiID8gXCJcdTRFMEFcdTRGMjBcdTU2RkVcdTVFOEFcdTU5MzFcdThEMjVcIiA6IFwiXHU0RkREXHU1QjU4XHU1NkZFXHU3MjQ3XHU1OTMxXHU4RDI1XCIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgaW5wdXQuY2xpY2soKTtcbiAgICB9O1xuXG4gICAgY29uc3QgcmVuZGVyQmxvY2tzID0gKCk6IHZvaWQgPT4ge1xuICAgICAgYmxvY2tzRWwuZW1wdHkoKTtcbiAgICAgIHdvcmtpbmdCbG9ja3MuZm9yRWFjaCgoYmxvY2ssIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGNhcmQgPSBibG9ja3NFbC5jcmVhdGVEaXYoeyBjbHM6IGBtbWMtY29udGVudC1ibG9jayBpcy0ke2Jsb2NrLnR5cGV9YCB9KTtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2staGVhZGVyXCIgfSk7XG4gICAgICAgIGhlYWRlci5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLXRpdGxlXCIsIHRleHQ6IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiID8gYFx1NjU4N1x1NUI1N1x1NTc1NyAke2luZGV4ICsgMX1gIDogYFx1NTZGRVx1NzI0N1x1NTc1NyAke2luZGV4ICsgMX1gIH0pO1xuICAgICAgICBjb25zdCBjb250cm9scyA9IGhlYWRlci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stY29udHJvbHNcIiB9KTtcbiAgICAgICAgY29uc3QgY29udHJvbCA9IChpY29uOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIGFjdGlvbjogKCkgPT4gdm9pZCwgZGlzYWJsZWQgPSBmYWxzZSk6IHZvaWQgPT4ge1xuICAgICAgICAgIGNvbnN0IGJ0biA9IGNvbnRyb2xzLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNsaWNrYWJsZS1pY29uXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiwgdGl0bGUsIFwiYXJpYS1sYWJlbFwiOiB0aXRsZSB9IH0pO1xuICAgICAgICAgIHNldEljb24oYnRuLCBpY29uKTsgYnRuLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgYWN0aW9uKCk7IH0pO1xuICAgICAgICB9O1xuICAgICAgICBjb250cm9sKFwiYXJyb3ctdXBcIiwgXCJcdTRFMEFcdTc5RkJcIiwgKCkgPT4geyBbd29ya2luZ0Jsb2Nrc1tpbmRleCAtIDFdLCB3b3JraW5nQmxvY2tzW2luZGV4XV0gPSBbd29ya2luZ0Jsb2Nrc1tpbmRleF0hLCB3b3JraW5nQmxvY2tzW2luZGV4IC0gMV0hXTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSwgaW5kZXggPT09IDApO1xuICAgICAgICBjb250cm9sKFwiYXJyb3ctZG93blwiLCBcIlx1NEUwQlx1NzlGQlwiLCAoKSA9PiB7IFt3b3JraW5nQmxvY2tzW2luZGV4ICsgMV0sIHdvcmtpbmdCbG9ja3NbaW5kZXhdXSA9IFt3b3JraW5nQmxvY2tzW2luZGV4XSEsIHdvcmtpbmdCbG9ja3NbaW5kZXggKyAxXSFdOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9LCBpbmRleCA9PT0gd29ya2luZ0Jsb2Nrcy5sZW5ndGggLSAxKTtcbiAgICAgICAgY29udHJvbChcInRyYXNoLTJcIiwgXCJcdTUyMjBcdTk2NjRcdTUxODVcdTVCQjlcdTU3NTdcIiwgKCkgPT4geyB3b3JraW5nQmxvY2tzLnNwbGljZShpbmRleCwgMSk7IHJlbmRlckJsb2NrcygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0pO1xuICAgICAgICBpZiAoYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICByZW5kZXJUZXh0QmxvY2soY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stYm9keVwiIH0pLCBibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLWJvZHkgbW1jLWltYWdlLWJsb2NrLWVkaXRvclwiIH0pO1xuICAgICAgICAgIGNvbnN0IHByZXZpZXcgPSBib2R5LmNyZWF0ZURpdih7IGNsczogXCJtbWMtaW1hZ2UtYmxvY2stcHJldmlld1wiIH0pO1xuICAgICAgICAgIGNvbnN0IHJlZnJlc2ggPSAoKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBwcmV2aWV3LmVtcHR5KCk7XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMuY2FsbGJhY2tzLnJlc29sdmVJbWFnZShibG9jay5zb3VyY2UpO1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGltZyA9IHByZXZpZXcuY3JlYXRlRWwoXCJpbWdcIiwgeyBhdHRyOiB7IHNyYzogcmVzb2x2ZWQsIGFsdDogYmxvY2suYWx0IHx8IFwiXHU1NkZFXHU3MjQ3XCIgfSB9KTtcbiAgICAgICAgICAgICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBuZXcgSW1hZ2VQcmV2aWV3TW9kYWwodGhpcy5hcHAsIHJlc29sdmVkLCBibG9jay5hbHQgfHwgXCJcdTU2RkVcdTcyNDdcIikub3BlbigpKTtcbiAgICAgICAgICAgIH0gZWxzZSBwcmV2aWV3LmNyZWF0ZURpdih7IGNsczogXCJtbWMtaW1hZ2UtcGxhY2Vob2xkZXJcIiwgdGV4dDogYmxvY2suc291cmNlID8gXCJcdTY1RTBcdTZDRDVcdTUyQTBcdThGN0RcdTU2RkVcdTcyNDdcIiA6IFwiXHU1QzFBXHU2NzJBXHU5MDA5XHU2MkU5XHU1NkZFXHU3MjQ3XCIgfSk7XG4gICAgICAgICAgICBzb3VyY2UudmFsdWUgPSBibG9jay5zb3VyY2U7XG4gICAgICAgICAgICBhbHQudmFsdWUgPSBibG9jay5hbHQgPz8gXCJcIjtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IHNvdXJjZUxhYmVsID0gYm9keS5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTU2RkVcdTcyNDdcdThERUZcdTVGODRcdTYyMTZcdTdGNTFcdTU3NDBcIiB9KTtcbiAgICAgICAgICBjb25zdCBzb3VyY2UgPSBzb3VyY2VMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiXHU0RUQzXHU1RTkzXHU4REVGXHU1Rjg0XHUzMDAxW1tcdTU2RkVcdTcyNDddXSBcdTYyMTYgaHR0cHM6Ly8uLi5cIiB9IH0pO1xuICAgICAgICAgIGNvbnN0IGFsdExhYmVsID0gYm9keS5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTU2RkVcdTcyNDdcdThCRjRcdTY2MEVcdUZGMDhcdTUzRUZcdTkwMDlcdUZGMDlcIiB9KTtcbiAgICAgICAgICBjb25zdCBhbHQgPSBhbHRMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiXHU1NkZFXHU3MjQ3XHU4QkY0XHU2NjBFXCIgfSB9KTtcbiAgICAgICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHsgYmxvY2suc291cmNlID0gc291cmNlLnZhbHVlLnRyaW0oKTsgcmVmcmVzaCgpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0pO1xuICAgICAgICAgIGFsdC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4geyBibG9jay5hbHQgPSBhbHQudmFsdWUudHJpbSgpIHx8IHVuZGVmaW5lZDsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICAgICAgICBjb25zdCBhY3Rpb25zID0gYm9keS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLWJsb2NrLWFjdGlvbnNcIiB9KTtcbiAgICAgICAgICBjb25zdCBsb2NhbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NEZERFx1NUI1OFx1NTIzMFx1NEVEM1x1NUU5M1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgICAgICBsb2NhbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gY2hvb3NlSW1hZ2UoYmxvY2ssIFwibG9jYWxcIiwgcmVmcmVzaCkpO1xuICAgICAgICAgIGNvbnN0IHJlbW90ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NEUwQVx1NEYyMFx1NTIzMFx1NTZGRVx1NUU4QVwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgICAgICByZW1vdGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGNob29zZUltYWdlKGJsb2NrLCBcInJlbW90ZVwiLCByZWZyZXNoKSk7XG4gICAgICAgICAgcmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmICghd29ya2luZ0Jsb2Nrcy5sZW5ndGgpIGJsb2Nrc0VsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZW1wdHktY29udGVudC1oaW50XCIsIHRleHQ6IFwiXHU1RjUzXHU1MjREXHU2Q0ExXHU2NzA5XHU1MTg1XHU1QkI5XHU1NzU3XHUzMDAyXHU4QkY3XHU2REZCXHU1MkEwXHU2NTg3XHU1QjU3XHU2MjE2XHU1NkZFXHU3MjQ3XHUzMDAyXCIgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGFkZFRleHQgPSBhY3Rpb25Sb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIisgXHU2NTg3XHU1QjU3XCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGFkZFRleHQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgd29ya2luZ0Jsb2Nrcy5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0OiBcIlwiIH0pOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICBjb25zdCBhZGRJbWFnZSA9IGFjdGlvblJvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTU2RkVcdTcyNDdcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgYWRkSW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgd29ya2luZ0Jsb2Nrcy5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBcIlwiIH0pOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICByZW5kZXJCbG9ja3MoKTtcblxuICAgIGNvbnN0IGRldGFpbHNHcmlkID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWZvcm0tZ3JpZFwiIH0pO1xuICAgIGNvbnN0IGljb25MYWJlbCA9IGRldGFpbHNHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NjgwN1x1NjIxNiBFbW9qaVwiIH0pO1xuICAgIGNvbnN0IGljb25JbnB1dCA9IGljb25MYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiXHU0RjhCXHU1OTgyIFx1RDgzRFx1RENBMVwiIH0gfSk7XG4gICAgaWNvbklucHV0LnZhbHVlID0gdGhpcy5ub2RlLmljb24gPz8gXCJcIjtcbiAgICBjb25zdCB0YXNrTGFiZWwgPSBkZXRhaWxzR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTRFRkJcdTUyQTFcdTcyQjZcdTYwMDFcIiB9KTtcbiAgICBjb25zdCB0YXNrU2VsZWN0ID0gdGFza0xhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcIlwiLCBcIlx1NjVFMFwiXSwgW1widG9kb1wiLCBcIlx1NUY4NVx1NTI5RVwiXSwgW1wiZG9pbmdcIiwgXCJcdThGREJcdTg4NENcdTRFMkRcIl0sIFtcImRvbmVcIiwgXCJcdTVERjJcdTVCOENcdTYyMTBcIl1dIGFzIGNvbnN0KSB0YXNrU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICB0YXNrU2VsZWN0LnZhbHVlID0gdGhpcy5ub2RlLnRhc2sgPz8gXCJcIjtcbiAgICBjb25zdCBzaGFwZUxhYmVsID0gZGV0YWlsc0dyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4MjgyXHU3MEI5XHU1RjYyXHU3MkI2XCIgfSk7XG4gICAgY29uc3Qgc2hhcGVTZWxlY3QgPSBzaGFwZUxhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcInJvdW5kZWRcIiwgXCJcdTU3MDZcdTg5RDJcIl0sIFtcInBpbGxcIiwgXCJcdTgwRjZcdTU2Q0FcIl0sIFtcInJlY3RhbmdsZVwiLCBcIlx1NzZGNFx1ODlEMlwiXV0gYXMgY29uc3QpIHNoYXBlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBzaGFwZVNlbGVjdC52YWx1ZSA9IHRoaXMubm9kZS5zdHlsZT8uc2hhcGUgPz8gdGhpcy5kZWZhdWx0U2hhcGU7XG4gICAgY29uc3QgdGFnc0xhYmVsID0gZGV0YWlsc0dyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU2ODA3XHU3QjdFXHVGRjA4XHU5MDE3XHU1M0Y3XHU1MjA2XHU5Njk0XHVGRjA5XCIgfSk7XG4gICAgY29uc3QgdGFnc0lucHV0ID0gdGFnc0xhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiB9KTtcbiAgICB0YWdzSW5wdXQudmFsdWUgPSB0aGlzLm5vZGUudGFncz8uam9pbihcIiwgXCIpID8/IFwiXCI7XG5cbiAgICBjb25zdCBzdHlsZUdyaWQgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZm9ybS1ncmlkIG1tYy1zdHlsZS1ncmlkXCIgfSk7XG4gICAgY29uc3QgY29sb3JDb250cm9sID0gKGxhYmVsVGV4dDogc3RyaW5nLCBjdXJyZW50OiBzdHJpbmcgfCB1bmRlZmluZWQsIGZhbGxiYWNrOiBzdHJpbmcpOiBbSFRNTElucHV0RWxlbWVudCwgSFRNTElucHV0RWxlbWVudF0gPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBzdHlsZUdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsVGV4dCB9KTtcbiAgICAgIGNvbnN0IHJvdyA9IGxhYmVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29sb3Itcm93XCIgfSk7XG4gICAgICBjb25zdCB0b2dnbGUgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcbiAgICAgIGNvbnN0IGNvbG9yID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNvbG9yXCIgfSk7XG4gICAgICB0b2dnbGUuY2hlY2tlZCA9IEJvb2xlYW4oY3VycmVudCk7IGNvbG9yLnZhbHVlID0gY3VycmVudCA/PyBmYWxsYmFjazsgY29sb3IuZGlzYWJsZWQgPSAhdG9nZ2xlLmNoZWNrZWQ7XG4gICAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7IGNvbG9yLmRpc2FibGVkID0gIXRvZ2dsZS5jaGVja2VkOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0pO1xuICAgICAgY29sb3IuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBzY2hlZHVsZUF1dG9TYXZlKTtcbiAgICAgIHJldHVybiBbdG9nZ2xlLCBjb2xvcl07XG4gICAgfTtcbiAgICBjb25zdCBbY29sb3JUb2dnbGUsIGNvbG9ySW5wdXRdID0gY29sb3JDb250cm9sKFwiXHU4MjgyXHU3MEI5XHU5ODlDXHU4MjcyXCIsIHRoaXMubm9kZS5zdHlsZT8uY29sb3IsIFwiIzRmNDZlNVwiKTtcbiAgICBjb25zdCBbdGV4dENvbG9yVG9nZ2xlLCB0ZXh0Q29sb3JJbnB1dF0gPSBjb2xvckNvbnRyb2woXCJcdTY1NzRcdTgyODJcdTcwQjlcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIiwgdGhpcy5ub2RlLnN0eWxlPy50ZXh0Q29sb3IsIFwiI2ZmZmZmZlwiKTtcbiAgICBjb25zdCBbYm9yZGVyQ29sb3JUb2dnbGUsIGJvcmRlckNvbG9ySW5wdXRdID0gY29sb3JDb250cm9sKFwiXHU4RkI5XHU2ODQ2XHU5ODlDXHU4MjcyXCIsIHRoaXMubm9kZS5zdHlsZT8uYm9yZGVyQ29sb3IsIFwiIzk0YTNiOFwiKTtcbiAgICBjb25zdCBudW1iZXJDb250cm9sID0gKGxhYmVsVGV4dDogc3RyaW5nLCBjdXJyZW50OiBudW1iZXIgfCB1bmRlZmluZWQsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgc3RlcDogbnVtYmVyKTogSFRNTElucHV0RWxlbWVudCA9PiB7XG4gICAgICBjb25zdCBsYWJlbCA9IHN0eWxlR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogbGFiZWxUZXh0IH0pO1xuICAgICAgY29uc3QgaW5wdXQgPSBsYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgYXR0cjogeyBtaW46IFN0cmluZyhtaW4pLCBtYXg6IFN0cmluZyhtYXgpLCBzdGVwOiBTdHJpbmcoc3RlcCksIHBsYWNlaG9sZGVyOiBcIlx1OERERlx1OTY4Rlx1OUVEOFx1OEJBNFwiIH0gfSk7XG4gICAgICBpbnB1dC52YWx1ZSA9IGN1cnJlbnQ/LnRvU3RyaW5nKCkgPz8gXCJcIjsgcmV0dXJuIGlucHV0O1xuICAgIH07XG4gICAgY29uc3QgYm9yZGVyV2lkdGhJbnB1dCA9IG51bWJlckNvbnRyb2woXCJcdThGQjlcdTY4NDZcdTdDOTdcdTdFQzZcIiwgdGhpcy5ub2RlLnN0eWxlPy5ib3JkZXJXaWR0aCwgMCwgNiwgLjUpO1xuICAgIGNvbnN0IGZvbnRTaXplSW5wdXQgPSBudW1iZXJDb250cm9sKFwiXHU1QjU3XHU1M0Y3XCIsIHRoaXMubm9kZS5zdHlsZT8uZm9udFNpemUsIDEwLCAzMiwgMSk7XG4gICAgY29uc3QgYm9vbGVhbkNvbnRyb2wgPSAobGFiZWxUZXh0OiBzdHJpbmcsIGN1cnJlbnQ6IGJvb2xlYW4gfCB1bmRlZmluZWQpOiBIVE1MU2VsZWN0RWxlbWVudCA9PiB7XG4gICAgICBjb25zdCBsYWJlbCA9IHN0eWxlR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogbGFiZWxUZXh0IH0pO1xuICAgICAgY29uc3Qgc2VsZWN0ID0gbGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBcIlx1OERERlx1OTY4Rlx1OUVEOFx1OEJBNFwiLCBhdHRyOiB7IHZhbHVlOiBcImluaGVyaXRcIiB9IH0pO1xuICAgICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcdTVGMDBcdTU0MkZcIiwgYXR0cjogeyB2YWx1ZTogXCJ0cnVlXCIgfSB9KTtcbiAgICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHU1MTczXHU5NUVEXCIsIGF0dHI6IHsgdmFsdWU6IFwiZmFsc2VcIiB9IH0pO1xuICAgICAgc2VsZWN0LnZhbHVlID0gY3VycmVudCA9PT0gdW5kZWZpbmVkID8gXCJpbmhlcml0XCIgOiBjdXJyZW50ID8gXCJ0cnVlXCIgOiBcImZhbHNlXCI7IHJldHVybiBzZWxlY3Q7XG4gICAgfTtcbiAgICBjb25zdCBib2xkSW5wdXQgPSBib29sZWFuQ29udHJvbChcIlx1NjU3NFx1ODI4Mlx1NzBCOVx1NTJBMFx1N0M5N1wiLCB0aGlzLm5vZGUuc3R5bGU/LmJvbGQpO1xuICAgIGNvbnN0IGl0YWxpY0lucHV0ID0gYm9vbGVhbkNvbnRyb2woXCJcdTY1NzRcdTgyODJcdTcwQjlcdTY1OUNcdTRGNTNcIiwgdGhpcy5ub2RlLnN0eWxlPy5pdGFsaWMpO1xuICAgIGNvbnN0IHVuZGVybGluZUlucHV0ID0gYm9vbGVhbkNvbnRyb2woXCJcdTY1NzRcdTgyODJcdTcwQjlcdTRFMEJcdTUyMTJcdTdFQkZcIiwgdGhpcy5ub2RlLnN0eWxlPy51bmRlcmxpbmUpO1xuXG4gICAgY29uc3Qgbm90ZUxhYmVsID0gZm9ybS5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTU5MDdcdTZDRThcdUZGMDhcdTUzRUZcdTkwMDlcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBub3RlSW5wdXQgPSBub3RlTGFiZWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiKTsgbm90ZUlucHV0LnZhbHVlID0gdGhpcy5ub2RlLm5vdGUgPz8gXCJcIjsgbm90ZUlucHV0LnJvd3MgPSA0O1xuICAgIGNvbnN0IGxpbmtMYWJlbCA9IGZvcm0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU5NEZFXHU2M0E1XHVGRjA4XHU3RjUxXHU1NzQwXHUzMDAxXHU3QjE0XHU4QkIwXHU1NDBEXHU2MjE2IFtbXHU1M0NDXHU5NEZFXV1cdUZGMDlcIiB9KTtcbiAgICBjb25zdCBsaW5rSW5wdXQgPSBsaW5rTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiIH0pOyBsaW5rSW5wdXQudmFsdWUgPSB0aGlzLm5vZGUubGluayA/PyBcIlwiO1xuXG4gICAgY29uc3QgcGFyc2VCb29sID0gKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHwgdW5kZWZpbmVkID0+IHZhbHVlID09PSBcInRydWVcIiA/IHRydWUgOiB2YWx1ZSA9PT0gXCJmYWxzZVwiID8gZmFsc2UgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcGFyc2VOdW1iZXIgPSAodmFsdWU6IHN0cmluZywgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHwgdW5kZWZpbmVkID0+IHZhbHVlLnRyaW0oKSAmJiBOdW1iZXIuaXNGaW5pdGUoTnVtYmVyKHZhbHVlKSkgPyBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgTnVtYmVyKHZhbHVlKSkpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGNvbGxlY3RWYWx1ZXMgPSAoc2hvd05vdGljZTogYm9vbGVhbik6IE5vZGVFZGl0VmFsdWVzIHwgbnVsbCA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gdmFsaWRCbG9ja3MoKTtcbiAgICAgIGlmICghY29udGVudC5sZW5ndGgpIHsgaWYgKHNob3dOb3RpY2UpIG5ldyBOb3RpY2UoXCJcdTgyODJcdTcwQjlcdTgxRjNcdTVDMTFcdTk3MDBcdTg5ODFcdTRFMDBcdTRFMkFcdTY1ODdcdTVCNTdcdTU3NTdcdTYyMTZcdTU2RkVcdTcyNDdcdTU3NTdcIik7IHJldHVybiBudWxsOyB9XG4gICAgICBjb25zdCB0YXNrID0gdGFza1NlbGVjdC52YWx1ZTtcbiAgICAgIGNvbnN0IHNoYXBlID0gc2hhcGVTZWxlY3QudmFsdWU7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50LFxuICAgICAgICBub3RlOiBub3RlSW5wdXQudmFsdWUudHJpbSgpLCBsaW5rOiBsaW5rSW5wdXQudmFsdWUudHJpbSgpLCBpY29uOiBpY29uSW5wdXQudmFsdWUudHJpbSgpLnNsaWNlKDAsIDEyKSxcbiAgICAgICAgdGFnczogQXJyYXkuZnJvbShuZXcgU2V0KHRhZ3NJbnB1dC52YWx1ZS5zcGxpdCgvWyxcdUZGMENdLykubWFwKCh0YWcpID0+IHRhZy50cmltKCkucmVwbGFjZSgvXiMvLCBcIlwiKSkuZmlsdGVyKEJvb2xlYW4pKSkuc2xpY2UoMCwgMTIpLFxuICAgICAgICB0YXNrOiB0YXNrID09PSBcInRvZG9cIiB8fCB0YXNrID09PSBcImRvaW5nXCIgfHwgdGFzayA9PT0gXCJkb25lXCIgPyB0YXNrIDogdW5kZWZpbmVkLFxuICAgICAgICBjb2xvcjogY29sb3JUb2dnbGUuY2hlY2tlZCA/IGNvbG9ySW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIHRleHRDb2xvcjogdGV4dENvbG9yVG9nZ2xlLmNoZWNrZWQgPyB0ZXh0Q29sb3JJbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgYm9yZGVyQ29sb3I6IGJvcmRlckNvbG9yVG9nZ2xlLmNoZWNrZWQgPyBib3JkZXJDb2xvcklucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBib3JkZXJXaWR0aDogcGFyc2VOdW1iZXIoYm9yZGVyV2lkdGhJbnB1dC52YWx1ZSwgMCwgNiksXG4gICAgICAgIHNoYXBlOiBzaGFwZSA9PT0gXCJwaWxsXCIgfHwgc2hhcGUgPT09IFwicmVjdGFuZ2xlXCIgfHwgc2hhcGUgPT09IFwicm91bmRlZFwiID8gc2hhcGUgOiB1bmRlZmluZWQsXG4gICAgICAgIGJvbGQ6IHBhcnNlQm9vbChib2xkSW5wdXQudmFsdWUpLCBpdGFsaWM6IHBhcnNlQm9vbChpdGFsaWNJbnB1dC52YWx1ZSksIHVuZGVybGluZTogcGFyc2VCb29sKHVuZGVybGluZUlucHV0LnZhbHVlKSxcbiAgICAgICAgZm9udFNpemU6IHBhcnNlTnVtYmVyKGZvbnRTaXplSW5wdXQudmFsdWUsIDEwLCAzMilcbiAgICAgIH07XG4gICAgfTtcblxuICAgIGxldCB0aW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGxhc3QgPSBKU09OLnN0cmluZ2lmeShjb2xsZWN0VmFsdWVzKGZhbHNlKSk7XG4gICAgY29uc3Qgc2F2ZU5vdyA9IChtb2RlOiBcImF1dG9zYXZlXCIgfCBcImNvbW1pdFwiLCBzaG93Tm90aWNlID0gZmFsc2UpOiBib29sZWFuID0+IHtcbiAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkgeyB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTsgdGltZXIgPSBudWxsOyB9XG4gICAgICBjb25zdCB2YWx1ZXMgPSBjb2xsZWN0VmFsdWVzKHNob3dOb3RpY2UpOyBpZiAoIXZhbHVlcykgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3Qgc2lnbmF0dXJlID0gSlNPTi5zdHJpbmdpZnkodmFsdWVzKTtcbiAgICAgIGlmIChzaWduYXR1cmUgIT09IGxhc3QpIHsgdGhpcy5zdWJtaXQodmFsdWVzLCBtb2RlKTsgbGFzdCA9IHNpZ25hdHVyZTsgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBzY2hlZHVsZUF1dG9TYXZlID0gKCk6IHZvaWQgPT4geyBpZiAodGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpOyB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHNhdmVOb3coXCJhdXRvc2F2ZVwiKSwgMjgwKTsgfTtcbiAgICB0aGlzLnNhdmVPbkNsb3NlID0gKCkgPT4geyBzYXZlTm93KFwiY29tbWl0XCIpOyB9O1xuXG4gICAgW2ljb25JbnB1dCwgdGFza1NlbGVjdCwgc2hhcGVTZWxlY3QsIHRhZ3NJbnB1dCwgYm9yZGVyV2lkdGhJbnB1dCwgZm9udFNpemVJbnB1dCwgYm9sZElucHV0LCBpdGFsaWNJbnB1dCwgdW5kZXJsaW5lSW5wdXQsIG5vdGVJbnB1dCwgbGlua0lucHV0XVxuICAgICAgLmZvckVhY2goKGlucHV0KSA9PiB7IGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBzY2hlZHVsZUF1dG9TYXZlKTsgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBzY2hlZHVsZUF1dG9TYXZlKTsgfSk7XG5cbiAgICBjb25zdCBidXR0b25zID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWZvcm0tYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGNsb3NlQnV0dG9uID0gYnV0dG9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtb2QtY3RhXCIsIHRleHQ6IFwiXHU0RkREXHU1QjU4XHU1RTc2XHU1MTczXHU5NUVEXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGNsb3NlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IGlmIChzYXZlTm93KFwiY29tbWl0XCIsIHRydWUpKSB7IHRoaXMuY2xvc2VXaXRob3V0Rmx1c2ggPSB0cnVlOyB0aGlzLmNsb3NlKCk7IH0gfSk7XG5cbiAgICB0aGlzLm91dHNpZGVQb2ludGVySGFuZGxlciA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBpZiAodGhpcy5tb2RhbEVsLmNvbnRhaW5zKGV2ZW50LnRhcmdldCBhcyBOb2RlKSkgcmV0dXJuO1xuICAgICAgdGhpcy5zYXZlT25DbG9zZT8uKCk7IHRoaXMuY2xvc2VXaXRob3V0Rmx1c2ggPSB0cnVlOyB0aGlzLmNsb3NlKCk7XG4gICAgfTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgdGhpcy5vdXRzaWRlUG9pbnRlckhhbmRsZXIhLCB0cnVlKSwgMCk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jbG9zZVdpdGhvdXRGbHVzaCkgdGhpcy5zYXZlT25DbG9zZT8uKCk7XG4gICAgaWYgKHRoaXMub3V0c2lkZVBvaW50ZXJIYW5kbGVyKSBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgdGhpcy5vdXRzaWRlUG9pbnRlckhhbmRsZXIsIHRydWUpO1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn1cblxuY2xhc3MgQXBwZWFyYW5jZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlO1xuICBwcml2YXRlIHJlYWRvbmx5IHN1Ym1pdDogKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKSA9PiB2b2lkO1xuICBwcml2YXRlIHJlYWRvbmx5IHJlc2V0OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSwgc3VibWl0OiAoYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UpID0+IHZvaWQsIHJlc2V0OiAoKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmFwcGVhcmFuY2UgPSBhcHBlYXJhbmNlO1xuICAgIHRoaXMuc3VibWl0ID0gc3VibWl0O1xuICAgIHRoaXMucmVzZXQgPSByZXNldDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTkxNlx1ODlDMlwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcIm1tYy1hcHBlYXJhbmNlLW1vZGFsXCIpO1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImZvcm1cIik7XG4gICAgZm9ybS5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsIHRleHQ6IFwiXHU4RkQ5XHU0RTlCXHU4QkJFXHU3RjZFXHU1M0VBXHU0RkREXHU1QjU4XHU1MjMwXHU1RjUzXHU1MjREIC5taW5kbWFwIFx1NjU4N1x1NEVGNlx1RkYwQ1x1NEUwRFx1NEYxQVx1NEZFRVx1NjUzOVx1NjNEMlx1NEVGNlx1NTE2OFx1NUM0MFx1OUVEOFx1OEJBNFx1NTAzQ1x1MzAwMlwiIH0pO1xuXG4gICAgY29uc3QgZ3JpZCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1mb3JtLWdyaWQgbW1jLWFwcGVhcmFuY2UtZ3JpZFwiIH0pO1xuICAgIGNvbnN0IGFkZENvbG9yID0gKGxhYmVsVGV4dDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBmYWxsYmFjazogc3RyaW5nKTogeyB0b2dnbGU6IEhUTUxJbnB1dEVsZW1lbnQ7IGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IH0gPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBsYWJlbFRleHQgfSk7XG4gICAgICBjb25zdCByb3cgPSBsYWJlbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbG9yLXJvd1wiIH0pO1xuICAgICAgY29uc3QgdG9nZ2xlID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgICBjb25zdCBpbnB1dCA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjb2xvclwiIH0pO1xuICAgICAgdG9nZ2xlLmNoZWNrZWQgPSBCb29sZWFuKHZhbHVlKTtcbiAgICAgIGlucHV0LnZhbHVlID0gdmFsdWUgPz8gZmFsbGJhY2s7XG4gICAgICBpbnB1dC5kaXNhYmxlZCA9ICF0b2dnbGUuY2hlY2tlZDtcbiAgICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHsgaW5wdXQuZGlzYWJsZWQgPSAhdG9nZ2xlLmNoZWNrZWQ7IH0pO1xuICAgICAgcmV0dXJuIHsgdG9nZ2xlLCBpbnB1dCB9O1xuICAgIH07XG5cbiAgICBjb25zdCBiYWNrZ3JvdW5kID0gYWRkQ29sb3IoXCJcdTgwQ0NcdTY2NkZcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvciwgXCIjZjhmYWZjXCIpO1xuICAgIGNvbnN0IHBhdHRlcm5MYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XCIgfSk7XG4gICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBhdHRlcm5MYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJub25lXCIsIFwiXHU2NUUwXCJdLCBbXCJncmlkXCIsIFwiXHU3RjUxXHU2ODNDXCJdLCBbXCJkb3RzXCIsIFwiXHU3MEI5XHU5NjM1XCJdXSBhcyBjb25zdCkgcGF0dGVyblNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA/PyBcImdyaWRcIjtcbiAgICBjb25zdCBwYXR0ZXJuQ29sb3IgPSBhZGRDb2xvcihcIlx1NTZGRVx1Njg0OFx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UucGF0dGVybkNvbG9yLCBcIiM5NGEzYjhcIik7XG5cbiAgICBjb25zdCBmb250TGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NUI1N1x1NEY1M1wiIH0pO1xuICAgIGNvbnN0IGZvbnRTZWxlY3QgPSBmb250TGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZm9yIChjb25zdCBbdmFsdWUsIGxhYmVsXSBvZiBbW1wib2JzaWRpYW5cIiwgXCJcdThEREZcdTk2OEYgT2JzaWRpYW5cIl0sIFtcInNhbnNcIiwgXCJcdTY1RTBcdTg4NkNcdTdFQkZcIl0sIFtcInNlcmlmXCIsIFwiXHU4ODZDXHU3RUJGXCJdLCBbXCJtb25vXCIsIFwiXHU3QjQ5XHU1QkJEXCJdLCBbXCJjdXN0b21cIiwgXCJcdTgxRUFcdTVCOUFcdTRFNDlcIl1dIGFzIGNvbnN0KSBmb250U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBmb250U2VsZWN0LnZhbHVlID0gdGhpcy5hcHBlYXJhbmNlLmZvbnRGYW1pbHkgPz8gXCJvYnNpZGlhblwiO1xuICAgIGNvbnN0IGN1c3RvbUZvbnRMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHU1QjU3XHU0RjUzXHU1NDBEXHU3OUYwXCIgfSk7XG4gICAgY29uc3QgY3VzdG9tRm9udElucHV0ID0gY3VzdG9tRm9udExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJNaWNyb3NvZnQgWWFIZWlcIiB9IH0pO1xuICAgIGN1c3RvbUZvbnRJbnB1dC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5jdXN0b21Gb250ID8/IFwiXCI7XG4gICAgY29uc3QgdXBkYXRlQ3VzdG9tRm9udCA9ICgpOiB2b2lkID0+IHsgY3VzdG9tRm9udElucHV0LmRpc2FibGVkID0gZm9udFNlbGVjdC52YWx1ZSAhPT0gXCJjdXN0b21cIjsgfTtcbiAgICBmb250U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlQ3VzdG9tRm9udCk7XG4gICAgdXBkYXRlQ3VzdG9tRm9udCgpO1xuXG4gICAgY29uc3QgZm9udFNpemVMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1QjU3XHU1M0Y3XHVGRjA4MTBcdTIwMTMzMFx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IGZvbnRTaXplSW5wdXQgPSBmb250U2l6ZUxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIxMFwiLCBtYXg6IFwiMzBcIiwgc3RlcDogXCIxXCIgfSB9KTtcbiAgICBmb250U2l6ZUlucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMuYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNCk7XG5cbiAgICBjb25zdCBlZGdlQ29sb3IgPSBhZGRDb2xvcihcIlx1OEZERVx1N0VCRlx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UuZWRnZUNvbG9yLCBcIiM3YzhhYTVcIik7XG4gICAgY29uc3QgZWRnZVN0eWxlTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEZERVx1N0VCRlx1N0M3Qlx1NTc4QlwiIH0pO1xuICAgIGNvbnN0IGVkZ2VTdHlsZVNlbGVjdCA9IGVkZ2VTdHlsZUxhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcImN1cnZlZFwiLCBcIlx1NjZGMlx1N0VCRlwiXSwgW1wic3RyYWlnaHRcIiwgXCJcdTc2RjRcdTdFQkZcIl0sIFtcImVsYm93XCIsIFwiXHU2Mjk4XHU3RUJGXCJdXSBhcyBjb25zdCkgZWRnZVN0eWxlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBlZGdlU3R5bGVTZWxlY3QudmFsdWUgPSB0aGlzLmFwcGVhcmFuY2UuZWRnZVN0eWxlID8/IFwiY3VydmVkXCI7XG4gICAgY29uc3QgZWRnZVdpZHRoTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEZERVx1N0VCRlx1N0M5N1x1N0VDNlx1RkYwODAuNVx1MjAxMzhcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBlZGdlV2lkdGhJbnB1dCA9IGVkZ2VXaWR0aExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIwLjVcIiwgbWF4OiBcIjhcIiwgc3RlcDogXCIwLjVcIiB9IH0pO1xuICAgIGVkZ2VXaWR0aElucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMuYXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gMi4yKTtcblxuICAgIGNvbnN0IG5vZGVDb2xvciA9IGFkZENvbG9yKFwiXHU4MjgyXHU3MEI5XHU4MENDXHU2NjZGXHU4MjcyXCIsIHRoaXMuYXBwZWFyYW5jZS5ub2RlQ29sb3IsIFwiI2ZmZmZmZlwiKTtcbiAgICBjb25zdCB0ZXh0Q29sb3IgPSBhZGRDb2xvcihcIlx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UudGV4dENvbG9yLCBcIiMwZjE3MmFcIik7XG4gICAgY29uc3QgYm9yZGVyQ29sb3IgPSBhZGRDb2xvcihcIlx1ODI4Mlx1NzBCOVx1OEZCOVx1Njg0Nlx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yLCBcIiM5NGEzYjhcIik7XG4gICAgY29uc3QgYm9yZGVyV2lkdGhMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4RkI5XHU2ODQ2XHU3Qzk3XHU3RUM2XHVGRjA4MFx1MjAxMzZcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBib3JkZXJXaWR0aElucHV0ID0gYm9yZGVyV2lkdGhMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgYXR0cjogeyBtaW46IFwiMFwiLCBtYXg6IFwiNlwiLCBzdGVwOiBcIjAuNVwiIH0gfSk7XG4gICAgYm9yZGVyV2lkdGhJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLmFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IDEpO1xuXG4gICAgY29uc3QgdGV4dFN0eWxlU2VjdGlvbiA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1hcHBlYXJhbmNlLXRleHQtc3R5bGVcIiB9KTtcbiAgICB0ZXh0U3R5bGVTZWN0aW9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtYXBwZWFyYW5jZS10ZXh0LXN0eWxlLXRpdGxlXCIsIHRleHQ6IFwiXHU2NTg3XHU1QjU3XHU2ODM3XHU1RjBGXCIgfSk7XG4gICAgY29uc3QgdGV4dFN0eWxlID0gdGV4dFN0eWxlU2VjdGlvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWFwcGVhcmFuY2Utc3R5bGUtb3B0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGFkZENoZWNrID0gKHRleHQ6IHN0cmluZywgY2hlY2tlZDogYm9vbGVhbik6IEhUTUxJbnB1dEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSB0ZXh0U3R5bGUuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJtbWMtYXBwZWFyYW5jZS1zdHlsZS1vcHRpb25cIiB9KTtcbiAgICAgIGNvbnN0IGlucHV0ID0gbGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcbiAgICAgIGlucHV0LmNoZWNrZWQgPSBjaGVja2VkO1xuICAgICAgbGFiZWwuY3JlYXRlU3Bhbih7IHRleHQgfSk7XG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcbiAgICBjb25zdCBib2xkID0gYWRkQ2hlY2soXCJcdTY1ODdcdTVCNTdcdTUyQTBcdTdDOTdcIiwgdGhpcy5hcHBlYXJhbmNlLmJvbGQgPT09IHRydWUpO1xuICAgIGNvbnN0IGl0YWxpYyA9IGFkZENoZWNrKFwiXHU2NTg3XHU1QjU3XHU2NTlDXHU0RjUzXCIsIHRoaXMuYXBwZWFyYW5jZS5pdGFsaWMgPT09IHRydWUpO1xuICAgIGNvbnN0IHVuZGVybGluZSA9IGFkZENoZWNrKFwiXHU2NTg3XHU1QjU3XHU0RTBCXHU1MjEyXHU3RUJGXCIsIHRoaXMuYXBwZWFyYW5jZS51bmRlcmxpbmUgPT09IHRydWUpO1xuXG4gICAgY29uc3QgY2xhbXAgPSAodmFsdWU6IHN0cmluZywgbWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBmYWxsYmFjazogbnVtYmVyKTogbnVtYmVyID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcih2YWx1ZSk7XG4gICAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgPyBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgcGFyc2VkKSkgOiBmYWxsYmFjaztcbiAgICB9O1xuICAgIGNvbnN0IGFjdGlvbnMgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbW9kYWwtYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IHJlc2V0ID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU2MDYyXHU1OTBEXHU1MTY4XHU1QzQwXHU5RUQ4XHU4QkE0XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1M0Q2XHU2RDg4XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3Qgc2F2ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUU5NFx1NzUyOFwiLCB0eXBlOiBcInN1Ym1pdFwiLCBjbHM6IFwibW9kLWN0YVwiIH0pO1xuICAgIHJlc2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMucmVzZXQoKTsgdGhpcy5jbG9zZSgpOyB9KTtcbiAgICBjYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuc3VibWl0KHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBiYWNrZ3JvdW5kLnRvZ2dsZS5jaGVja2VkID8gYmFja2dyb3VuZC5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgYmFja2dyb3VuZFBhdHRlcm46IHBhdHRlcm5TZWxlY3QudmFsdWUgYXMgQmFja2dyb3VuZFBhdHRlcm4sXG4gICAgICAgIHBhdHRlcm5Db2xvcjogcGF0dGVybkNvbG9yLnRvZ2dsZS5jaGVja2VkID8gcGF0dGVybkNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBmb250RmFtaWx5OiBmb250U2VsZWN0LnZhbHVlIGFzIEZvbnRGYW1pbHlNb2RlLFxuICAgICAgICBjdXN0b21Gb250OiBmb250U2VsZWN0LnZhbHVlID09PSBcImN1c3RvbVwiID8gY3VzdG9tRm9udElucHV0LnZhbHVlLnRyaW0oKS5zbGljZSgwLCAxMjApIHx8IHVuZGVmaW5lZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgZm9udFNpemU6IGNsYW1wKGZvbnRTaXplSW5wdXQudmFsdWUsIDEwLCAzMCwgMTQpLFxuICAgICAgICBlZGdlQ29sb3I6IGVkZ2VDb2xvci50b2dnbGUuY2hlY2tlZCA/IGVkZ2VDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZWRnZVdpZHRoOiBjbGFtcChlZGdlV2lkdGhJbnB1dC52YWx1ZSwgMC41LCA4LCAyLjIpLFxuICAgICAgICBlZGdlU3R5bGU6IGVkZ2VTdHlsZVNlbGVjdC52YWx1ZSBhcyBFZGdlU3R5bGUsXG4gICAgICAgIG5vZGVDb2xvcjogbm9kZUNvbG9yLnRvZ2dsZS5jaGVja2VkID8gbm9kZUNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICB0ZXh0Q29sb3I6IHRleHRDb2xvci50b2dnbGUuY2hlY2tlZCA/IHRleHRDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZUJvcmRlckNvbG9yOiBib3JkZXJDb2xvci50b2dnbGUuY2hlY2tlZCA/IGJvcmRlckNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBub2RlQm9yZGVyV2lkdGg6IGNsYW1wKGJvcmRlcldpZHRoSW5wdXQudmFsdWUsIDAsIDYsIDEpLFxuICAgICAgICBib2xkOiBib2xkLmNoZWNrZWQsXG4gICAgICAgIGl0YWxpYzogaXRhbGljLmNoZWNrZWQsXG4gICAgICAgIHVuZGVybGluZTogdW5kZXJsaW5lLmNoZWNrZWRcbiAgICAgIH0pO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHNhdmUuZm9jdXMoKSwgMjApO1xuICB9XG59XG5cbmNsYXNzIE91dGxpbmVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBtYXJrZG93bjogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IG9uRXhwb3J0OiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBtYXJrZG93bjogc3RyaW5nLCBvbkV4cG9ydDogKCkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5tYXJrZG93biA9IG1hcmtkb3duO1xuICAgIHRoaXMub25FeHBvcnQgPSBvbkV4cG9ydDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIk1hcmtkb3duIFx1NTkyN1x1N0VCMlwiKTtcbiAgICBjb25zdCB0ZXh0YXJlYSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBjbHM6IFwibW1jLW91dGxpbmUtdGV4dGFyZWFcIiB9KTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IHRoaXMubWFya2Rvd247XG4gICAgdGV4dGFyZWEucmVhZE9ubHkgPSB0cnVlO1xuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjb3B5ID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1OTBEXHU1MjM2XCIgfSk7XG4gICAgY29uc3QgZXhwb3J0QnV0dG9uID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1QkZDXHU1MUZBXHU0RTNBIC5tZFwiLCBjbHM6IFwibW9kLWN0YVwiIH0pO1xuICAgIGNvcHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGhpcy5tYXJrZG93bik7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1REYyXHU1OTBEXHU1MjM2IE1hcmtkb3duIFx1NTkyN1x1N0VCMlwiKTtcbiAgICB9KTtcbiAgICBleHBvcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMub25FeHBvcnQoKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuXG5jbGFzcyBTZWFyY2hOb2Rlc01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IG5vZGVzOiBNaW5kTWFwTm9kZVtdO1xuICBwcml2YXRlIHJlYWRvbmx5IG9uUXVlcnk6IChxdWVyeTogc3RyaW5nKSA9PiB2b2lkO1xuICBwcml2YXRlIHJlYWRvbmx5IG9uU2VsZWN0OiAobm9kZTogTWluZE1hcE5vZGUpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG5vZGVzOiBNaW5kTWFwTm9kZVtdLCBvblF1ZXJ5OiAocXVlcnk6IHN0cmluZykgPT4gdm9pZCwgb25TZWxlY3Q6IChub2RlOiBNaW5kTWFwTm9kZSkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xuICAgIHRoaXMub25RdWVyeSA9IG9uUXVlcnk7XG4gICAgdGhpcy5vblNlbGVjdCA9IG9uU2VsZWN0O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiXHU2NDFDXHU3RDIyXHU4MjgyXHU3MEI5XCIpO1xuICAgIHRoaXMubW9kYWxFbC5hZGRDbGFzcyhcIm1tYy1zZWFyY2gtbW9kYWxcIik7XG4gICAgY29uc3QgaW5wdXQgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJzZWFyY2hcIiwgY2xzOiBcIm1tYy1zZWFyY2gtaW5wdXRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJcdTY0MUNcdTdEMjJcdTY1ODdcdTVCNTdcdTMwMDFcdTU5MDdcdTZDRThcdTMwMDFcdTY4MDdcdTdCN0VcdTYyMTZcdTk0RkVcdTYzQTVcdTIwMjZcIiB9IH0pO1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zZWFyY2gtY291bnRcIiB9KTtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zZWFyY2gtcmVzdWx0c1wiIH0pO1xuXG4gICAgY29uc3QgcmVuZGVyUmVzdWx0cyA9ICgpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gaW5wdXQudmFsdWUudHJpbSgpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICB0aGlzLm9uUXVlcnkocXVlcnkpO1xuICAgICAgcmVzdWx0cy5lbXB0eSgpO1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHF1ZXJ5XG4gICAgICAgID8gdGhpcy5ub2Rlcy5maWx0ZXIoKG5vZGUpID0+IG5vZGVTZWFyY2hUZXh0KG5vZGUpLmluY2x1ZGVzKHF1ZXJ5KSkuc2xpY2UoMCwgODApXG4gICAgICAgIDogdGhpcy5ub2Rlcy5zbGljZSgwLCA0MCk7XG4gICAgICBjb3VudC5zZXRUZXh0KHF1ZXJ5ID8gYFx1NjI3RVx1NTIzMCAke21hdGNoZXMubGVuZ3RofSBcdTRFMkFcdTgyODJcdTcwQjlgIDogYFx1NTE3MSAke3RoaXMubm9kZXMubGVuZ3RofSBcdTRFMkFcdTgyODJcdTcwQjlgKTtcbiAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBtYXRjaGVzKSB7XG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHJlc3VsdHMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLXNlYXJjaC1yZXN1bHRcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICAgICAgY29uc3QgdGl0bGUgPSBidXR0b24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zZWFyY2gtcmVzdWx0LXRpdGxlXCIgfSk7XG4gICAgICAgIGlmIChub2RlLmljb24pIHRpdGxlLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgJHtub2RlLmljb259IGAgfSk7XG4gICAgICAgIHRpdGxlLmNyZWF0ZVNwYW4oeyB0ZXh0OiBub2RlUGxhaW5UZXh0KG5vZGUpIHx8IFwiXHU1NkZFXHU3MjQ3XHU4MjgyXHU3MEI5XCIgfSk7XG4gICAgICAgIGNvbnN0IGRldGFpbHMgPSBbbm9kZS50YXNrID8gKHsgdG9kbzogXCJcdTVGODVcdTUyOUVcIiwgZG9pbmc6IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIsIGRvbmU6IFwiXHU1REYyXHU1QjhDXHU2MjEwXCIgfSBhcyBjb25zdClbbm9kZS50YXNrXSA6IFwiXCIsIC4uLihub2RlLnRhZ3MgPz8gW10pLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApXVxuICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICAuam9pbihcIiBcdTAwQjcgXCIpO1xuICAgICAgICBpZiAoZGV0YWlscykgYnV0dG9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtc2VhcmNoLXJlc3VsdC1tZXRhXCIsIHRleHQ6IGRldGFpbHMgfSk7XG4gICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMub25TZWxlY3Qobm9kZSk7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghbWF0Y2hlcy5sZW5ndGgpIHJlc3VsdHMuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1lbXB0eS1zdGF0ZVwiLCB0ZXh0OiBcIlx1NkNBMVx1NjcwOVx1NTMzOVx1OTE0RFx1NzY4NFx1ODI4Mlx1NzBCOVwiIH0pO1xuICAgIH07XG5cbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgcmVuZGVyUmVzdWx0cyk7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSByZXN1bHRzLnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFwiLm1tYy1zZWFyY2gtcmVzdWx0XCIpO1xuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGZpcnN0LmNsaWNrKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZW5kZXJSZXN1bHRzKCk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gaW5wdXQuZm9jdXMoKSwgMjApO1xuICB9XG59XG5cbmNsYXNzIEpzb25UcmFuc2Zlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgb25JbXBvcnQ6IChkb2N1bWVudDogTWluZE1hcERvY3VtZW50KSA9PiB2b2lkO1xuICBwcml2YXRlIHJlYWRvbmx5IG9uRXhwb3J0OiAoanNvbjogc3RyaW5nKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBkb2N1bWVudDogTWluZE1hcERvY3VtZW50LCBvbkltcG9ydDogKGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQpID0+IHZvaWQsIG9uRXhwb3J0OiAoanNvbjogc3RyaW5nKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgdGhpcy5vbkltcG9ydCA9IG9uSW1wb3J0O1xuICAgIHRoaXMub25FeHBvcnQgPSBvbkV4cG9ydDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIkpTT04gXHU1QkZDXHU1MTY1IC8gXHU1QkZDXHU1MUZBXCIpO1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJcdTUzRUZcdTRFRTVcdTU5MERcdTUyMzZcdTVGNTNcdTUyNEQgSlNPTlx1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1N0M5OFx1OEQzNFx1NTE3Nlx1NEVENiBNaW5kTWFwIFN0dWRpbyBcdTY1ODdcdTY4NjMgSlNPTiBcdTU0MEVcdTVCRkNcdTUxNjVcdTMwMDJcIiB9KTtcbiAgICBkZXNjcmlwdGlvbi5hZGRDbGFzcyhcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiKTtcbiAgICBjb25zdCB0ZXh0YXJlYSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBjbHM6IFwibW1jLWpzb24tdGV4dGFyZWFcIiB9KTtcbiAgICB0ZXh0YXJlYS52YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnQsIG51bGwsIDIpO1xuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnMgbW1jLWpzb24tYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGNvcHkgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTU5MERcdTUyMzYgSlNPTlwiIH0pO1xuICAgIGNvbnN0IGV4cG9ydEJ1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUJGQ1x1NTFGQSAuanNvblwiIH0pO1xuICAgIGNvbnN0IGltcG9ydEJ1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUJGQ1x1NTE2NVx1NUU3Nlx1NjZGRlx1NjM2MlwiLCBjbHM6IFwibW9kLXdhcm5pbmdcIiB9KTtcbiAgICBjb3B5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRleHRhcmVhLnZhbHVlKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVERjJcdTU5MERcdTUyMzYgSlNPTlwiKTtcbiAgICB9KTtcbiAgICBleHBvcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMub25FeHBvcnQodGV4dGFyZWEudmFsdWUpKTtcbiAgICBpbXBvcnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UodGV4dGFyZWEudmFsdWUpIGFzIFBhcnRpYWw8TWluZE1hcERvY3VtZW50PjtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZURvY3VtZW50KHBhcnNlZCwgdGhpcy5kb2N1bWVudC50aXRsZSk7XG4gICAgICAgIHRoaXMub25JbXBvcnQobm9ybWFsaXplZCk7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJKU09OIFx1NURGMlx1NUJGQ1x1NTE2NVwiKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIEpTT04gaW1wb3J0IGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJKU09OIFx1NjgzQ1x1NUYwRlx1NjVFMFx1NjU0OFx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1NTQwRVx1OTFDRFx1OEJENVwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWluZE1hcEVkaXRvciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHA7XG4gIHByaXZhdGUgcmVhZG9ubHkgaG9zdDogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2FsbGJhY2tzOiBNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzO1xuICBwcml2YXRlIG9wdGlvbnM6IE1pbmRNYXBFZGl0b3JPcHRpb25zO1xuICBwcml2YXRlIHJvb3RFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHRvb2xiYXJFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG5hdmlnYXRpb25CYXJFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHZpZXdwb3J0RWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBzY2VuZUVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgbm9kZXNMYXllckVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgZWRnZXNTdmchOiBTVkdTVkdFbGVtZW50O1xuICBwcml2YXRlIHN0YXR1c0VsITogSFRNTFNwYW5FbGVtZW50O1xuICBwcml2YXRlIHpvb21TdGF0dXNFbCE6IEhUTUxTcGFuRWxlbWVudDtcbiAgcHJpdmF0ZSBkb2N1bWVudDogTWluZE1hcERvY3VtZW50O1xuICBwcml2YXRlIGxheW91dDogTGF5b3V0UmVzdWx0O1xuICBwcml2YXRlIHNlbGVjdGVkSWQ6IHN0cmluZztcbiAgcHJpdmF0ZSB6b29tID0gMTtcbiAgcHJpdmF0ZSBwYW5YID0gMDtcbiAgcHJpdmF0ZSBwYW5ZID0gMDtcbiAgcHJpdmF0ZSBoaXN0b3J5OiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGZ1dHVyZTogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBkcmFnZ2luZ0lkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBwYW5uaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgcGFuU3RhcnQgPSB7IHg6IDAsIHk6IDAsIHBhblg6IDAsIHBhblk6IDAgfTtcbiAgcHJpdmF0ZSBjbGVhbnVwQ2FsbGJhY2tzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuICBwcml2YXRlIHJlc2l6ZU9ic2VydmVyOiBSZXNpemVPYnNlcnZlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGJyYW5jaENsaXBib2FyZDogTWluZE1hcE5vZGUgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzZWFyY2hRdWVyeSA9IFwiXCI7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGhvc3Q6IEhUTUxFbGVtZW50LCBkb2N1bWVudDogTWluZE1hcERvY3VtZW50LCBjYWxsYmFja3M6IE1pbmRNYXBFZGl0b3JDYWxsYmFja3MsIG9wdGlvbnM6IE1pbmRNYXBFZGl0b3JPcHRpb25zKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5ob3N0ID0gaG9zdDtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBjbG9uZURvY3VtZW50KGRvY3VtZW50KTtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5sYXlvdXQgPSBjb21wdXRlTGF5b3V0KHRoaXMuZG9jdW1lbnQucm9vdCwgdGhpcy5kb2N1bWVudC5sYXlvdXQsIHRoaXMuZ2V0QXBwZWFyYW5jZSgpLmZvbnRTaXplID8/IDE0KTtcbiAgICB0aGlzLmJ1aWxkVWkoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b0ZpdE9uT3Blbikgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5maXRUb1ZpZXcoKSwgNTApO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2spID0+IGNhbGxiYWNrKCkpO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcyA9IFtdO1xuICAgIHRoaXMucmVzaXplT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICB0aGlzLnJlc2l6ZU9ic2VydmVyID0gbnVsbDtcbiAgICB0aGlzLmhvc3QuZW1wdHkoKTtcbiAgfVxuXG4gIHNldERvY3VtZW50KGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQsIHJlc2V0SGlzdG9yeSA9IHRydWUpOiB2b2lkIHtcbiAgICB0aGlzLmRvY3VtZW50ID0gY2xvbmVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIGlmIChyZXNldEhpc3RvcnkpIHtcbiAgICAgIHRoaXMuaGlzdG9yeSA9IFtdO1xuICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9GaXRPbk9wZW4pIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDIwKTtcbiAgfVxuXG4gIHNldE9wdGlvbnMob3B0aW9uczogTWluZE1hcEVkaXRvck9wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBnZXREb2N1bWVudCgpOiBNaW5kTWFwRG9jdW1lbnQge1xuICAgIHJldHVybiBjbG9uZURvY3VtZW50KHRoaXMuZG9jdW1lbnQpO1xuICB9XG5cbiAgbWFya1NhdmVkKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdHVzRWwuc2V0VGV4dChcIlx1NURGMlx1NEZERFx1NUI1OFwiKTtcbiAgICB0aGlzLnJvb3RFbC5yZW1vdmVDbGFzcyhcImlzLWRpcnR5XCIpO1xuICB9XG5cbiAgbWFya1NhdmluZygpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoXCJcdTRGRERcdTVCNThcdTRFMkRcdTIwMjZcIik7XG4gICAgdGhpcy5yb290RWwuYWRkQ2xhc3MoXCJpcy1kaXJ0eVwiKTtcbiAgfVxuXG4gIGZvY3VzKCk6IHZvaWQge1xuICAgIHRoaXMucm9vdEVsLmZvY3VzKCk7XG4gIH1cblxuICBmb2N1c05vZGVCeUlkKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCBpZCkpIHRoaXMuZm9jdXNOb2RlKGlkKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRVaSgpOiB2b2lkIHtcbiAgICB0aGlzLmhvc3QuZW1wdHkoKTtcbiAgICB0aGlzLnJvb3RFbCA9IHRoaXMuaG9zdC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWVkaXRvclwiIH0pO1xuICAgIHRoaXMucm9vdEVsLnRhYkluZGV4ID0gMDtcbiAgICB0aGlzLnRvb2xiYXJFbCA9IHRoaXMucm9vdEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdG9vbGJhclwiIH0pO1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsID0gdGhpcy5yb290RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvblwiIH0pO1xuICAgIHRoaXMudmlld3BvcnRFbCA9IHRoaXMucm9vdEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdmlld3BvcnRcIiB9KTtcbiAgICB0aGlzLnNjZW5lRWwgPSB0aGlzLnZpZXdwb3J0RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zY2VuZVwiIH0pO1xuICAgIHRoaXMuZWRnZXNTdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgICB0aGlzLmVkZ2VzU3ZnLmNsYXNzTGlzdC5hZGQoXCJtbWMtZWRnZXNcIik7XG4gICAgdGhpcy5zY2VuZUVsLmFwcGVuZENoaWxkKHRoaXMuZWRnZXNTdmcpO1xuICAgIHRoaXMubm9kZXNMYXllckVsID0gdGhpcy5zY2VuZUVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZXMtbGF5ZXJcIiB9KTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJwbHVzLWNpcmNsZVwiLCBcIlx1NkRGQlx1NTJBMFx1NUI1MFx1ODI4Mlx1NzBCOVx1RkYwOFRhYlx1RkYwOVwiLCAoKSA9PiB0aGlzLmFkZENoaWxkKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImxpc3QtcGx1c1wiLCBcIlx1NkRGQlx1NTJBMFx1NTQwQ1x1N0VBN1x1ODI4Mlx1NzBCOVx1RkYwOEVudGVyXHVGRjA5XCIsICgpID0+IHRoaXMuYWRkU2libGluZygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJwZW5jaWxcIiwgXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcdUZGMDhGMlx1RkYwOVwiLCAoKSA9PiB0aGlzLmVkaXRTZWxlY3RlZCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJjb3B5LXBsdXNcIiwgXCJcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcdUZGMDhDdHJsL0NtZCtEXHVGRjA5XCIsICgpID0+IHRoaXMuZHVwbGljYXRlU2VsZWN0ZWQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwidHJhc2gtMlwiLCBcIlx1NTIyMFx1OTY2NFx1ODI4Mlx1NzBCOVx1RkYwOERlbGV0ZVx1RkYwOVwiLCAoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImNpcmNsZS1jaGVjay1iaWdcIiwgXCJcdTUyMDdcdTYzNjJcdTRFRkJcdTUyQTFcdTcyQjZcdTYwMDFcdUZGMDhDdHJsL0NtZCtFbnRlclx1RkYwOVwiLCAoKSA9PiB0aGlzLmN5Y2xlVGFzaygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJmb2xkLXZlcnRpY2FsXCIsIFwiXHU1QzU1XHU1RjAwL1x1NjUzNlx1OEQ3N1x1ODI4Mlx1NzBCOVx1RkYwOFNwYWNlXHVGRjA5XCIsICgpID0+IHRoaXMudG9nZ2xlQ29sbGFwc2UoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwibGlua1wiLCBcIlx1NjI1M1x1NUYwMFx1ODI4Mlx1NzBCOVx1OTRGRVx1NjNBNVwiLCAoKSA9PiB0aGlzLm9wZW5TZWxlY3RlZExpbmsoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwic2VhcmNoXCIsIFwiXHU2NDFDXHU3RDIyXHU4MjgyXHU3MEI5XHVGRjA4Q3RybC9DbWQrRlx1RkYwOVwiLCAoKSA9PiB0aGlzLm9wZW5TZWFyY2goKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyU2VwYXJhdG9yKCk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwidGFibGUtMlwiLCBcIlx1NjNEMlx1NTE2NVx1NjIxNlx1N0YxNlx1OEY5MVx1ODg2OFx1NjgzQ1wiLCAoKSA9PiB0aGlzLmVkaXRUYWJsZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJjb2RlLTJcIiwgXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTRFRTNcdTc4MDFcIiwgKCkgPT4gdGhpcy5lZGl0Q29kZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJpbWFnZS1wbHVzXCIsIFwiXHU3Qzk4XHU4RDM0XHU1NkZFXHU3MjQ3XHU1MjMwXHU1RjUzXHU1MjREXHU4MjgyXHU3MEI5XHVGRjA4Q3RybC9DbWQrVlx1RkYwOVwiLCAoKSA9PiBuZXcgTm90aWNlKFwiXHU1MTQ4XHU1OTBEXHU1MjM2XHU1NkZFXHU3MjQ3XHVGRjBDXHU1MThEXHU5MDA5XHU0RTJEXHU4MjgyXHU3MEI5XHU1RTc2XHU2MzA5IEN0cmwvQ21kK1ZcIikpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcIm5ldHdvcmtcIiwgXCJcdTUyMUJcdTVFRkFcdTYyMTZcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkVcIiwgKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU9yT3BlblN1Ym1hcCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ1bmRvLTJcIiwgXCJcdTY0QTRcdTk1MDBcdUZGMDhDdHJsL0NtZCtaXHVGRjA5XCIsICgpID0+IHRoaXMudW5kbygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJyZWRvLTJcIiwgXCJcdTkxQ0RcdTUwNUFcdUZGMDhDdHJsL0NtZCtZXHVGRjA5XCIsICgpID0+IHRoaXMucmVkbygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ6b29tLWluXCIsIFwiXHU2NTNFXHU1OTI3XCIsICgpID0+IHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gKiAxLjE1KSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiem9vbS1vdXRcIiwgXCJcdTdGMjlcdTVDMEZcIiwgKCkgPT4gdGhpcy5zZXRab29tKHRoaXMuem9vbSAvIDEuMTUpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJtYXhpbWl6ZVwiLCBcIlx1OTAwMlx1NUU5NFx1NzUzQlx1NUUwM1wiLCAoKSA9PiB0aGlzLmZpdFRvVmlldygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJnaXQtZm9ya1wiLCBcIlx1NTIwN1x1NjM2Mlx1NTM1NVx1NEZBNy9cdTUzQ0NcdTRGQTdcdTVFMDNcdTVDNDBcIiwgKCkgPT4gdGhpcy50b2dnbGVMYXlvdXQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwicGFsZXR0ZVwiLCBcIlx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTkxNlx1ODlDMlwiLCAoKSA9PiB0aGlzLmVkaXRBcHBlYXJhbmNlKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImZpbGUtdGV4dFwiLCBcIlx1NjdFNVx1NzcwQiBNYXJrZG93biBcdTU5MjdcdTdFQjJcIiwgKCkgPT4gdGhpcy5zaG93T3V0bGluZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJicmFjZXNcIiwgXCJKU09OIFx1NUJGQ1x1NTE2NSAvIFx1NUJGQ1x1NTFGQVwiLCAoKSA9PiB0aGlzLnNob3dKc29uVHJhbnNmZXIoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiaW1hZ2VcIiwgXCJcdTVCRkNcdTUxRkEgU1ZHXCIsICgpID0+IHZvaWQgdGhpcy5jYWxsYmFja3Mub25FeHBvcnRTdmcoZG9jdW1lbnRUb1N2Zyh0aGlzLmRvY3VtZW50LnJvb3QsIHRoaXMuZG9jdW1lbnQubGF5b3V0LCB0aGlzLmRvY3VtZW50LnRpdGxlLCB0aGlzLmdldEFwcGVhcmFuY2UoKSkpKTtcblxuICAgIGNvbnN0IHNwYWNlciA9IHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRvb2xiYXItc3BhY2VyXCIgfSk7XG4gICAgc3BhY2VyLnNldEF0dHIoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gICAgdGhpcy56b29tU3RhdHVzRWwgPSB0aGlzLnRvb2xiYXJFbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy16b29tLXN0YXR1c1wiLCB0ZXh0OiBcIjEwMCVcIiB9KTtcbiAgICB0aGlzLnN0YXR1c0VsID0gdGhpcy50b29sYmFyRWwuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtc2F2ZS1zdGF0dXNcIiwgdGV4dDogXCJcdTVERjJcdTRGRERcdTVCNThcIiB9KTtcblxuICAgIGNvbnN0IGtleWRvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHRoaXMuaGFuZGxlS2V5ZG93bihldmVudCk7XG4gICAgdGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5ZG93bik7XG4gICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzLnB1c2goKCkgPT4gdGhpcy5yb290RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5ZG93bikpO1xuXG4gICAgY29uc3QgcGFzdGUgPSAoZXZlbnQ6IENsaXBib2FyZEV2ZW50KTogdm9pZCA9PiB7IHZvaWQgdGhpcy5oYW5kbGVQYXN0ZShldmVudCk7IH07XG4gICAgdGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIHBhc3RlKTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnJvb3RFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgcGFzdGUpKTtcblxuICAgIGNvbnN0IHdoZWVsID0gKGV2ZW50OiBXaGVlbEV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB3aGVlbFRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmICh3aGVlbFRhcmdldC5jbG9zZXN0KFwiLm1tYy1ub2RlLXRhYmxlLXdyYXAsIC5tbWMtY29kZS1ibG9ja1wiKSkgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnZpZXdwb3J0RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBwb2ludGVyWCA9IGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQgLSByZWN0LndpZHRoIC8gMjtcbiAgICAgIGNvbnN0IHBvaW50ZXJZID0gZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wIC0gcmVjdC5oZWlnaHQgLyAyO1xuICAgICAgY29uc3Qgb2xkWm9vbSA9IHRoaXMuem9vbTtcbiAgICAgIGNvbnN0IG5leHRab29tID0gdGhpcy5jbGFtcFpvb20odGhpcy56b29tICogKGV2ZW50LmRlbHRhWSA8IDAgPyAxLjEgOiAwLjkpKTtcbiAgICAgIGNvbnN0IHdvcmxkWCA9IChwb2ludGVyWCAtIHRoaXMucGFuWCkgLyBvbGRab29tO1xuICAgICAgY29uc3Qgd29ybGRZID0gKHBvaW50ZXJZIC0gdGhpcy5wYW5ZKSAvIG9sZFpvb207XG4gICAgICB0aGlzLnpvb20gPSBuZXh0Wm9vbTtcbiAgICAgIHRoaXMucGFuWCA9IHBvaW50ZXJYIC0gd29ybGRYICogbmV4dFpvb207XG4gICAgICB0aGlzLnBhblkgPSBwb2ludGVyWSAtIHdvcmxkWSAqIG5leHRab29tO1xuICAgICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICAgIH07XG4gICAgdGhpcy52aWV3cG9ydEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCB3aGVlbCwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHdoZWVsKSk7XG5cbiAgICBjb25zdCBwb2ludGVyRG93biA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBpZiAodGFyZ2V0LmNsb3Nlc3QoXCIubW1jLW5vZGVcIikpIHJldHVybjtcbiAgICAgIGlmIChldmVudC5idXR0b24gIT09IDAgJiYgZXZlbnQuYnV0dG9uICE9PSAxKSByZXR1cm47XG4gICAgICB0aGlzLnBhbm5pbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wYW5TdGFydCA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSwgcGFuWDogdGhpcy5wYW5YLCBwYW5ZOiB0aGlzLnBhblkgfTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5zZXRQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLmFkZENsYXNzKFwiaXMtcGFubmluZ1wiKTtcbiAgICAgIHRoaXMuc2VsZWN0Tm9kZShudWxsKTtcbiAgICB9O1xuICAgIGNvbnN0IHBvaW50ZXJNb3ZlID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGlmICghdGhpcy5wYW5uaW5nKSByZXR1cm47XG4gICAgICB0aGlzLnBhblggPSB0aGlzLnBhblN0YXJ0LnBhblggKyBldmVudC5jbGllbnRYIC0gdGhpcy5wYW5TdGFydC54O1xuICAgICAgdGhpcy5wYW5ZID0gdGhpcy5wYW5TdGFydC5wYW5ZICsgZXZlbnQuY2xpZW50WSAtIHRoaXMucGFuU3RhcnQueTtcbiAgICAgIHRoaXMuYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICB9O1xuICAgIGNvbnN0IHBvaW50ZXJVcCA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBpZiAoIXRoaXMucGFubmluZykgcmV0dXJuO1xuICAgICAgdGhpcy5wYW5uaW5nID0gZmFsc2U7XG4gICAgICBpZiAodGhpcy52aWV3cG9ydEVsLmhhc1BvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCkpIHRoaXMudmlld3BvcnRFbC5yZWxlYXNlUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVDbGFzcyhcImlzLXBhbm5pbmdcIik7XG4gICAgfTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHBvaW50ZXJEb3duKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHBvaW50ZXJNb3ZlKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCBwb2ludGVyVXApO1xuICAgIHRoaXMudmlld3BvcnRFbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmNhbmNlbFwiLCBwb2ludGVyVXApO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcy5wdXNoKCgpID0+IHtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgcG9pbnRlckRvd24pO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCBwb2ludGVyTW92ZSk7XG4gICAgICB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCBwb2ludGVyVXApO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVyY2FuY2VsXCIsIHBvaW50ZXJVcCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHRoaXMuYXBwbHlUcmFuc2Zvcm0oKSk7XG4gICAgdGhpcy5yZXNpemVPYnNlcnZlci5vYnNlcnZlKHRoaXMudmlld3BvcnRFbCk7XG4gIH1cblxuICBwcml2YXRlIGFkZFRvb2xiYXJCdXR0b24oaWNvbjogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCBhY3Rpb246ICgpID0+IHZvaWQpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy50b29sYmFyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb24gbW1jLXRvb2xiYXItYnV0dG9uXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGxhYmVsLCB0aXRsZTogbGFiZWwgfSB9KTtcbiAgICBzZXRJY29uKGJ1dHRvbiwgaWNvbik7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBhY3Rpb24oKTtcbiAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRUb29sYmFyU2VwYXJhdG9yKCk6IHZvaWQge1xuICAgIHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRvb2xiYXItc2VwYXJhdG9yXCIgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldEFwcGVhcmFuY2UoKTogTWluZE1hcEFwcGVhcmFuY2Uge1xuICAgIHJldHVybiBtZXJnZUFwcGVhcmFuY2UodGhpcy5vcHRpb25zLmRlZmF1bHRBcHBlYXJhbmNlLCB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb250RmFtaWx5Q3NzKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKTogc3RyaW5nIHtcbiAgICBpZiAoYXBwZWFyYW5jZS5mb250RmFtaWx5ID09PSBcInNlcmlmXCIpIHJldHVybiAnR2VvcmdpYSwgXCJUaW1lcyBOZXcgUm9tYW5cIiwgc2VyaWYnO1xuICAgIGlmIChhcHBlYXJhbmNlLmZvbnRGYW1pbHkgPT09IFwibW9ub1wiKSByZXR1cm4gJ1wiU0ZNb25vLVJlZ3VsYXJcIiwgQ29uc29sYXMsIFwiTGliZXJhdGlvbiBNb25vXCIsIG1vbm9zcGFjZSc7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJjdXN0b21cIiAmJiBhcHBlYXJhbmNlLmN1c3RvbUZvbnQ/LnRyaW0oKSkgcmV0dXJuIGBcIiR7YXBwZWFyYW5jZS5jdXN0b21Gb250LnRyaW0oKS5yZXBsYWNlQWxsKCdcIicsICcnKX1cIiwgc2Fucy1zZXJpZmA7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJzYW5zXCIpIHJldHVybiAnSW50ZXIsIC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgXCJTZWdvZSBVSVwiLCBzYW5zLXNlcmlmJztcbiAgICByZXR1cm4gXCJ2YXIoLS1mb250LWludGVyZmFjZSlcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlBcHBlYXJhbmNlKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKTogdm9pZCB7XG4gICAgY29uc3Qgc2V0T3JSZW1vdmUgPSAobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgICBpZiAodmFsdWUpIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgIGVsc2UgdGhpcy5yb290RWwuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgfTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLWNhbnZhc1wiLCBhcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1wYXR0ZXJuLWNvbG9yXCIsIGFwcGVhcmFuY2UucGF0dGVybkNvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLWVkZ2VcIiwgYXBwZWFyYW5jZS5lZGdlQ29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtbm9kZS1iZ1wiLCBhcHBlYXJhbmNlLm5vZGVDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1ub2RlLXRleHRcIiwgYXBwZWFyYW5jZS50ZXh0Q29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtbm9kZS1ib3JkZXJcIiwgYXBwZWFyYW5jZS5ub2RlQm9yZGVyQ29sb3IpO1xuICAgIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KFwiLS1tbWMtZm9udC1mYW1pbHlcIiwgdGhpcy5mb250RmFtaWx5Q3NzKGFwcGVhcmFuY2UpKTtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLWVkZ2Utd2lkdGhcIiwgYCR7YXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gMi4yfXB4YCk7XG4gICAgdGhpcy5yb290RWwuc3R5bGUuc2V0UHJvcGVydHkoXCItLW1tYy1ub2RlLWJvcmRlci13aWR0aFwiLCBgJHthcHBlYXJhbmNlLm5vZGVCb3JkZXJXaWR0aCA/PyAxfXB4YCk7XG4gICAgdGhpcy52aWV3cG9ydEVsLnRvZ2dsZUNsYXNzKFwicGF0dGVybi1ncmlkXCIsIGFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwiZ3JpZFwiKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwudG9nZ2xlQ2xhc3MoXCJwYXR0ZXJuLWRvdHNcIiwgYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJkb3RzXCIpO1xuICAgIHRoaXMudmlld3BvcnRFbC50b2dnbGVDbGFzcyhcInBhdHRlcm4tbm9uZVwiLCAhYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiB8fCBhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID09PSBcIm5vbmVcIik7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck5hdmlnYXRpb24oKTogdm9pZCB7XG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFyRWwuZW1wdHkoKTtcbiAgICBjb25zdCBuYXZpZ2F0aW9uID0gdGhpcy5kb2N1bWVudC5uYXZpZ2F0aW9uO1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsLnRvZ2dsZUNsYXNzKFwiaXMtaGlkZGVuXCIsICFuYXZpZ2F0aW9uPy5wYXJlbnRQYXRoKTtcbiAgICBpZiAoIW5hdmlnYXRpb24/LnBhcmVudFBhdGgpIHJldHVybjtcblxuICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMubmF2aWdhdGlvbkJhckVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tYnV0dG9uXCIsXG4gICAgICBhdHRyOiB7XG4gICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXG4gICAgICAgIHRpdGxlOiBgXHU4RkQ0XHU1NkRFXHU3MjM2XHU1QkZDXHU1NkZFXHVGRjFBJHtuYXZpZ2F0aW9uLnBhcmVudFBhdGh9YFxuICAgICAgfVxuICAgIH0pO1xuICAgIHNldEljb24oYnV0dG9uLCBcImFycm93LWxlZnRcIik7XG4gICAgY29uc3QgbGFiZWxzID0gYnV0dG9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tbGFiZWxzXCIgfSk7XG4gICAgbGFiZWxzLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tdGl0bGVcIiwgdGV4dDogYFx1OEZENFx1NTZERVx1NzIzNlx1NUJGQ1x1NTZGRVx1RkYxQSR7bmF2aWdhdGlvbi5wYXJlbnRUaXRsZSA/PyBuYXZpZ2F0aW9uLnBhcmVudFBhdGguc3BsaXQoXCIvXCIpLmF0KC0xKT8ucmVwbGFjZSgvXFwubWluZG1hcCQvaSwgXCJcIikgPz8gXCJcdTcyMzZcdTVCRkNcdTU2RkVcIn1gIH0pO1xuICAgIGlmIChuYXZpZ2F0aW9uLnBhcmVudE5vZGVUZXh0KSBsYWJlbHMuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvbi1ub2RlXCIsIHRleHQ6IGBcdTY3NjVcdTZFOTBcdTgyODJcdTcwQjlcdUZGMUEke25hdmlnYXRpb24ucGFyZW50Tm9kZVRleHR9YCB9KTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTWluZE1hcChuYXZpZ2F0aW9uLnBhcmVudFBhdGgsIG5hdmlnYXRpb24ucGFyZW50Tm9kZUlkKSk7XG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFyRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvbi1wYXRoXCIsIHRleHQ6IG5hdmlnYXRpb24ucGFyZW50UGF0aCB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHRoaXMucmVuZGVyTmF2aWdhdGlvbigpO1xuICAgIGNvbnN0IGFwcGVhcmFuY2UgPSB0aGlzLmdldEFwcGVhcmFuY2UoKTtcbiAgICB0aGlzLmFwcGx5QXBwZWFyYW5jZShhcHBlYXJhbmNlKTtcbiAgICB0aGlzLmxheW91dCA9IGNvbXB1dGVMYXlvdXQodGhpcy5kb2N1bWVudC5yb290LCB0aGlzLmRvY3VtZW50LmxheW91dCwgYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNCk7XG4gICAgdGhpcy5ub2Rlc0xheWVyRWwuZW1wdHkoKTtcbiAgICB3aGlsZSAodGhpcy5lZGdlc1N2Zy5maXJzdENoaWxkKSB0aGlzLmVkZ2VzU3ZnLnJlbW92ZUNoaWxkKHRoaXMuZWRnZXNTdmcuZmlyc3RDaGlsZCk7XG5cbiAgICBmb3IgKGNvbnN0IHBvc2l0aW9uIG9mIHRoaXMubGF5b3V0Lm5vZGVzKSB7XG4gICAgICBpZiAoIXBvc2l0aW9uLnBhcmVudElkKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubGF5b3V0LmJ5SWQuZ2V0KHBvc2l0aW9uLnBhcmVudElkKTtcbiAgICAgIGlmICghcGFyZW50KSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInBhdGhcIik7XG4gICAgICBwYXRoLnNldEF0dHJpYnV0ZShcImRcIiwgZWRnZVBhdGgocGFyZW50LCBwb3NpdGlvbiwgYXBwZWFyYW5jZS5lZGdlU3R5bGUgPz8gXCJjdXJ2ZWRcIikpO1xuICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBgbW1jLWVkZ2UgZGVwdGgtJHtNYXRoLm1pbihwb3NpdGlvbi5kZXB0aCwgNil9YCk7XG4gICAgICBpZiAocG9zaXRpb24ubm9kZS5zdHlsZT8uY29sb3IpIHBhdGguc3R5bGUuc3Ryb2tlID0gcG9zaXRpb24ubm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIHRoaXMuZWRnZXNTdmcuYXBwZW5kQ2hpbGQocGF0aCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwb3NpdGlvbiBvZiB0aGlzLmxheW91dC5ub2Rlcykge1xuICAgICAgY29uc3Qgbm9kZSA9IHBvc2l0aW9uLm5vZGU7XG4gICAgICBjb25zdCBzaGFwZSA9IG5vZGUuc3R5bGU/LnNoYXBlID8/IHRoaXMub3B0aW9ucy5kZWZhdWx0Tm9kZVNoYXBlO1xuICAgICAgY29uc3QgY2xhc3NlcyA9IFtcIm1tYy1ub2RlXCIsIHBvc2l0aW9uLmRlcHRoID09PSAwID8gXCJpcy1yb290XCIgOiBcIlwiLCBgc2hhcGUtJHtzaGFwZX1gXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIiBcIik7XG4gICAgICBjb25zdCBub2RlRWwgPSB0aGlzLm5vZGVzTGF5ZXJFbC5jcmVhdGVEaXYoeyBjbHM6IGNsYXNzZXMgfSk7XG4gICAgICBub2RlRWwuZGF0YXNldC5ub2RlSWQgPSBub2RlLmlkO1xuICAgICAgbm9kZUVsLnN0eWxlLmxlZnQgPSBgJHtwb3NpdGlvbi54fXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS50b3AgPSBgJHtwb3NpdGlvbi55fXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS53aWR0aCA9IGAke3Bvc2l0aW9uLndpZHRofXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS5taW5IZWlnaHQgPSBgJHtwb3NpdGlvbi5oZWlnaHR9cHhgO1xuICAgICAgbm9kZUVsLmRyYWdnYWJsZSA9IHBvc2l0aW9uLmRlcHRoID4gMDtcbiAgICAgIGlmICh0aGlzLnNlbGVjdGVkSWQgPT09IG5vZGUuaWQpIG5vZGVFbC5hZGRDbGFzcyhcImlzLXNlbGVjdGVkXCIpO1xuICAgICAgaWYgKHRoaXMuc2VhcmNoUXVlcnkgJiYgbm9kZVNlYXJjaFRleHQobm9kZSkuaW5jbHVkZXModGhpcy5zZWFyY2hRdWVyeSkpIG5vZGVFbC5hZGRDbGFzcyhcImlzLXNlYXJjaC1tYXRjaFwiKTtcbiAgICAgIGlmIChub2RlLnRhc2spIG5vZGVFbC5hZGRDbGFzcyhgdGFzay0ke25vZGUudGFza31gKTtcbiAgICAgIGNvbnN0IGlzUm9vdCA9IHBvc2l0aW9uLmRlcHRoID09PSAwO1xuICAgICAgY29uc3QgYm9sZCA9IG5vZGUuc3R5bGU/LmJvbGQgPz8gYXBwZWFyYW5jZS5ib2xkID8/IGZhbHNlO1xuICAgICAgY29uc3QgaXRhbGljID0gbm9kZS5zdHlsZT8uaXRhbGljID8/IGFwcGVhcmFuY2UuaXRhbGljID8/IGZhbHNlO1xuICAgICAgY29uc3QgdW5kZXJsaW5lID0gbm9kZS5zdHlsZT8udW5kZXJsaW5lID8/IGFwcGVhcmFuY2UudW5kZXJsaW5lID8/IGZhbHNlO1xuICAgICAgaWYgKGJvbGQpIG5vZGVFbC5hZGRDbGFzcyhcImlzLWJvbGRcIik7XG4gICAgICBpZiAoaXRhbGljKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1pdGFsaWNcIik7XG4gICAgICBpZiAodW5kZXJsaW5lKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy11bmRlcmxpbmVkXCIpO1xuICAgICAgaWYgKG5vZGUubm90ZSkgbm9kZUVsLnNldEF0dHIoXCJ0aXRsZVwiLCBub2RlLm5vdGUpO1xuICAgICAgaWYgKG5vZGUuc3R5bGU/LmNvbG9yKSBub2RlRWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gbm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIGVsc2UgaWYgKCFpc1Jvb3QgJiYgYXBwZWFyYW5jZS5ub2RlQ29sb3IpIG5vZGVFbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBhcHBlYXJhbmNlLm5vZGVDb2xvcjtcbiAgICAgIGlmIChub2RlLnN0eWxlPy50ZXh0Q29sb3IpIG5vZGVFbC5zdHlsZS5jb2xvciA9IG5vZGUuc3R5bGUudGV4dENvbG9yO1xuICAgICAgZWxzZSBpZiAoIWlzUm9vdCAmJiBhcHBlYXJhbmNlLnRleHRDb2xvcikgbm9kZUVsLnN0eWxlLmNvbG9yID0gYXBwZWFyYW5jZS50ZXh0Q29sb3I7XG4gICAgICBpZiAobm9kZS5zdHlsZT8uYm9yZGVyQ29sb3IpIG5vZGVFbC5zdHlsZS5ib3JkZXJDb2xvciA9IG5vZGUuc3R5bGUuYm9yZGVyQ29sb3I7XG4gICAgICBlbHNlIGlmICghaXNSb290ICYmIGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yKSBub2RlRWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBhcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvcjtcbiAgICAgIG5vZGVFbC5zdHlsZS5ib3JkZXJXaWR0aCA9IGAke25vZGUuc3R5bGU/LmJvcmRlcldpZHRoID8/IGFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IChpc1Jvb3QgPyAyIDogMSl9cHhgO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gbm9kZUVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1jb250ZW50XCIgfSk7XG4gICAgICBjb25zdCBibG9ja3MgPSBub2RlQ29udGVudEJsb2Nrcyhub2RlKTtcbiAgICAgIGNvbnN0IGhhc1RleHRCbG9jayA9IGJsb2Nrcy5zb21lKChibG9jaykgPT4gYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIgJiYgYmxvY2sudGV4dC50cmltKCkpO1xuICAgICAgaWYgKChub2RlLnRhc2sgfHwgbm9kZS5pY29uKSAmJiAhaGFzVGV4dEJsb2NrKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1tYWluIG1tYy1ub2RlLW1ldGEtb25seVwiIH0pO1xuICAgICAgICBpZiAobm9kZS50YXNrKSB7XG4gICAgICAgICAgY29uc3QgdGFzayA9IG1ldGEuY3JlYXRlU3Bhbih7IGNsczogYG1tYy10YXNrLWljb24gdGFzay0ke25vZGUudGFza31gLCB0ZXh0OiBub2RlLnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTI3MTNcIiA6IG5vZGUudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdTI1RDBcIiA6IFwiXHUyNUNCXCIgfSk7XG4gICAgICAgICAgdGFzay5zZXRBdHRyKFwiYXJpYS1sYWJlbFwiLCBub2RlLnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTVERjJcdTVCOENcdTYyMTBcIiA6IG5vZGUudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdThGREJcdTg4NENcdTRFMkRcIiA6IFwiXHU1Rjg1XHU1MjlFXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLmljb24pIG1ldGEuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtbm9kZS1pY29uXCIsIHRleHQ6IG5vZGUuaWNvbiB9KTtcbiAgICAgIH1cbiAgICAgIGxldCBwcmVmaXhSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgICAgaWYgKGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikge1xuICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlKGJsb2NrLnNvdXJjZSk7XG4gICAgICAgICAgY29uc3Qgd3JhcCA9IGNvbnRlbnQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2RlLWltYWdlLWJsb2NrXCIgfSk7XG4gICAgICAgICAgY29uc3QgaW1hZ2UgPSB3cmFwLmNyZWF0ZUVsKFwiaW1nXCIsIHsgY2xzOiBcIm1tYy1ub2RlLWltYWdlXCIsIGF0dHI6IHsgYWx0OiBibG9jay5hbHQgPz8gKG5vZGVQbGFpblRleHQobm9kZSkgfHwgXCJcdTU2RkVcdTcyNDdcIiksIGxvYWRpbmc6IFwibGF6eVwiIH0gfSk7XG4gICAgICAgICAgaWYgKHJlc29sdmVkKSB7XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSByZXNvbHZlZDtcbiAgICAgICAgICAgIGltYWdlLnNldEF0dHIoXCJ0aXRsZVwiLCBcIlx1NzBCOVx1NTFGQlx1NjUzRVx1NTkyN1x1NTZGRVx1NzI0N1wiKTtcbiAgICAgICAgICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIG5ldyBJbWFnZVByZXZpZXdNb2RhbCh0aGlzLmFwcCwgcmVzb2x2ZWQsIGJsb2NrLmFsdCA/PyBcIlx1NTZGRVx1NzI0N1x1OTg4NFx1ODlDOFwiKS5vcGVuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW1hZ2UuYWRkQ2xhc3MoXCJpcy11bnJlc29sdmVkXCIpO1xuICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cihcInRpdGxlXCIsIGBcdTYyN0VcdTRFMERcdTUyMzBcdTU2RkVcdTcyNDdcdUZGMUEke2Jsb2NrLnNvdXJjZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFibG9jay50ZXh0LnRyaW0oKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IG1haW4gPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1tYWluIG1tYy1ub2RlLXRleHQtYmxvY2tcIiB9KTtcbiAgICAgICAgaWYgKCFwcmVmaXhSZW5kZXJlZCAmJiBub2RlLnRhc2spIHtcbiAgICAgICAgICBjb25zdCB0YXNrID0gbWFpbi5jcmVhdGVTcGFuKHsgY2xzOiBgbW1jLXRhc2staWNvbiB0YXNrLSR7bm9kZS50YXNrfWAsIHRleHQ6IG5vZGUudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1MjcxM1wiIDogbm9kZS50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1MjVEMFwiIDogXCJcdTI1Q0JcIiB9KTtcbiAgICAgICAgICB0YXNrLnNldEF0dHIoXCJhcmlhLWxhYmVsXCIsIG5vZGUudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIDogbm9kZS50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiIDogXCJcdTVGODVcdTUyOUVcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcmVmaXhSZW5kZXJlZCAmJiBub2RlLmljb24pIG1haW4uY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtbm9kZS1pY29uXCIsIHRleHQ6IG5vZGUuaWNvbiB9KTtcbiAgICAgICAgcHJlZml4UmVuZGVyZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCB0ZXh0RWwgPSBtYWluLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS10ZXh0XCIgfSk7XG4gICAgICAgIHJlbmRlclJpY2hUZXh0UnVucyh0ZXh0RWwsIGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0KTtcbiAgICAgICAgdGV4dEVsLnN0eWxlLmZvbnRTaXplID0gYCR7bm9kZS5zdHlsZT8uZm9udFNpemUgPz8gYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNH1weGA7XG4gICAgICAgIHRleHRFbC5zZXRBdHRyKFwiYXJpYS1sYWJlbFwiLCBibG9jay50ZXh0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUuc3VibWFwKSB7XG4gICAgICAgIGNvbnN0IHN1Ym1hcEJ1dHRvbiA9IGNvbnRlbnQuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLXN1Ym1hcC1jYXJkXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGBcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkUgJHtub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRofWAgfSB9KTtcbiAgICAgICAgc2V0SWNvbihzdWJtYXBCdXR0b24sIFwibmV0d29ya1wiKTtcbiAgICAgICAgc3VibWFwQnV0dG9uLmNyZWF0ZVNwYW4oeyB0ZXh0OiBub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRoLnNwbGl0KFwiL1wiKS5hdCgtMSk/LnJlcGxhY2UoL1xcLm1pbmRtYXAkL2ksIFwiXCIpID8/IFwiXHU1QjUwXHU1QkZDXHU1NkZFXCIgfSk7XG4gICAgICAgIHN1Ym1hcEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdm9pZCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5NaW5kTWFwKG5vZGUuc3VibWFwIS5wYXRoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChub2RlLnRhYmxlKSB0aGlzLnJlbmRlck5vZGVUYWJsZShjb250ZW50LCBub2RlKTtcbiAgICAgIGlmIChub2RlLmNvZGUpIHRoaXMucmVuZGVyTm9kZUNvZGUoY29udGVudCwgbm9kZSk7XG5cbiAgICAgIGlmIChub2RlLnRhZ3M/Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCB0YWdzID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtdGFnc1wiIH0pO1xuICAgICAgICBub2RlLnRhZ3Muc2xpY2UoMCwgNCkuZm9yRWFjaCgodGFnKSA9PiB0YWdzLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLW5vZGUtdGFnXCIsIHRleHQ6IGAjJHt0YWd9YCB9KSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1Rhc2tQcm9ncmVzcyAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBwcm9ncmVzcyA9IGdldFRhc2tQcm9ncmVzcyhub2RlKTtcbiAgICAgICAgaWYgKHByb2dyZXNzLnRvdGFsKSB7XG4gICAgICAgICAgY29uc3QgcGVyY2VudCA9IE1hdGgucm91bmQoKHByb2dyZXNzLmRvbmUgLyBwcm9ncmVzcy50b3RhbCkgKiAxMDApO1xuICAgICAgICAgIGNvbnN0IHByb2dyZXNzRWwgPSBub2RlRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YXNrLXByb2dyZXNzXCIsIGF0dHI6IHsgdGl0bGU6IGAke3Byb2dyZXNzLmRvbmV9LyR7cHJvZ3Jlc3MudG90YWx9IFx1NEUyQVx1NEVGQlx1NTJBMVx1NURGMlx1NUI4Q1x1NjIxMGAgfSB9KTtcbiAgICAgICAgICBwcm9ncmVzc0VsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGFzay1wcm9ncmVzcy1iYXJcIiwgYXR0cjogeyBzdHlsZTogYHdpZHRoOiR7cGVyY2VudH0lYCB9IH0pO1xuICAgICAgICAgIHByb2dyZXNzRWwuY3JlYXRlU3Bhbih7IHRleHQ6IGAke3BlcmNlbnR9JWAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGZvbGQgPSBub2RlRWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLWZvbGQtYnV0dG9uXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IG5vZGUuY29sbGFwc2VkID8gXCJcdTVDNTVcdTVGMDBcIiA6IFwiXHU2NTM2XHU4RDc3XCIgfSB9KTtcbiAgICAgICAgZm9sZC5zZXRUZXh0KG5vZGUuY29sbGFwc2VkID8gYCske25vZGUuY2hpbGRyZW4ubGVuZ3RofWAgOiBcIlx1MjIxMlwiKTtcbiAgICAgICAgZm9sZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpO1xuICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGFwc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxpbmsgPSB0aGlzLmdldE5vZGVMaW5rKG5vZGUpO1xuICAgICAgaWYgKGxpbmspIHtcbiAgICAgICAgY29uc3QgbGlua0J1dHRvbiA9IG5vZGVFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbWMtbm9kZS1saW5rXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGBcdTYyNTNcdTVGMDAgJHtsaW5rfWAgfSB9KTtcbiAgICAgICAgc2V0SWNvbihsaW5rQnV0dG9uLCBcImV4dGVybmFsLWxpbmtcIik7XG4gICAgICAgIGxpbmtCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTGluayhsaW5rKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgIHRoaXMuZWRpdFNlbGVjdGVkKCk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgIHRoaXMub3BlbkNvbnRleHRNZW51KGV2ZW50KTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuZHJhZ2dpbmdJZCA9IG5vZGUuaWQ7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlcj8uc2V0RGF0YShcInRleHQvcGxhaW5cIiwgbm9kZS5pZCk7XG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XG4gICAgICAgIG5vZGVFbC5hZGRDbGFzcyhcImlzLWRyYWdnaW5nXCIpO1xuICAgICAgfSk7XG4gICAgICBub2RlRWwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY2FuUmVwYXJlbnQodGhpcy5kcmFnZ2luZ0lkLCBub2RlLmlkKSkgcmV0dXJuO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgICAgICBub2RlRWwuYWRkQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKCkgPT4gbm9kZUVsLnJlbW92ZUNsYXNzKFwiaXMtZHJvcC10YXJnZXRcIikpO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBub2RlRWwucmVtb3ZlQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKTtcbiAgICAgICAgY29uc3QgZHJhZ2dlZElkID0gdGhpcy5kcmFnZ2luZ0lkID8/IGV2ZW50LmRhdGFUcmFuc2Zlcj8uZ2V0RGF0YShcInRleHQvcGxhaW5cIikgPz8gbnVsbDtcbiAgICAgICAgaWYgKGRyYWdnZWRJZCkgdGhpcy5yZXBhcmVudE5vZGUoZHJhZ2dlZElkLCBub2RlLmlkKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5kcmFnZ2luZ0lkID0gbnVsbDtcbiAgICAgICAgdGhpcy5ub2Rlc0xheWVyRWwucXVlcnlTZWxlY3RvckFsbChcIi5pcy1kcmFnZ2luZywgLmlzLWRyb3AtdGFyZ2V0XCIpLmZvckVhY2goKGVsZW1lbnQpID0+IGVsZW1lbnQucmVtb3ZlQ2xhc3NlcyhbXCJpcy1kcmFnZ2luZ1wiLCBcImlzLWRyb3AtdGFyZ2V0XCJdKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVRyYW5zZm9ybSgpOiB2b2lkIHtcbiAgICBjb25zdCByZWN0ID0gdGhpcy52aWV3cG9ydEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHRoaXMuc2NlbmVFbC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7cmVjdC53aWR0aCAvIDIgKyB0aGlzLnBhblh9cHgsICR7cmVjdC5oZWlnaHQgLyAyICsgdGhpcy5wYW5ZfXB4KSBzY2FsZSgke3RoaXMuem9vbX0pYDtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLXpvb21cIiwgU3RyaW5nKHRoaXMuem9vbSkpO1xuICAgIHRoaXMuem9vbVN0YXR1c0VsPy5zZXRUZXh0KGAke01hdGgucm91bmQodGhpcy56b29tICogMTAwKX0lYCk7XG4gIH1cblxuICBwcml2YXRlIHNlbGVjdE5vZGUoaWQ6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSBpZCA/PyBcIlwiO1xuICAgIHRoaXMubm9kZXNMYXllckVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubW1jLW5vZGUuaXMtc2VsZWN0ZWRcIikuZm9yRWFjaCgoZWxlbWVudCkgPT4gZWxlbWVudC5yZW1vdmVDbGFzcyhcImlzLXNlbGVjdGVkXCIpKTtcbiAgICBpZiAoaWQpIHRoaXMubm9kZXNMYXllckVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KGAubW1jLW5vZGVbZGF0YS1ub2RlLWlkPVwiJHtDU1MuZXNjYXBlKGlkKX1cIl1gKT8uYWRkQ2xhc3MoXCJpcy1zZWxlY3RlZFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgc2VsZWN0ZWROb2RlKCk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRJZCA/IGZpbmROb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgdGhpcy5zZWxlY3RlZElkKSA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvbmZpZ3VyZWROb2RlKHRleHQgPSBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiKTogTWluZE1hcE5vZGUge1xuICAgIGNvbnN0IG5vZGUgPSBjcmVhdGVOb2RlKHRleHQpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSAhPT0gXCJyb3VuZGVkXCIpIG5vZGUuc3R5bGUgPSB7IHNoYXBlOiB0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSB9O1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRDaGlsZCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWROb2RlKCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gbm9kZS5pZDtcbiAgICB9KTtcbiAgICB0aGlzLmVkaXRTZWxlY3RlZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRTaWJsaW5nKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8IHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWROb2RlKCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZCkgPT4gY2hpbGQuaWQgPT09IHNlbGVjdGVkLmlkKTtcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXggKyAxLCAwLCBub2RlKTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IG5vZGUuaWQ7XG4gICAgfSk7XG4gICAgdGhpcy5lZGl0U2VsZWN0ZWQoKTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdFNlbGVjdGVkKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkKSByZXR1cm47XG4gICAgbGV0IGhpc3RvcnlDYXB0dXJlZCA9IGZhbHNlO1xuICAgIG5ldyBOb2RlRWRpdE1vZGFsKHRoaXMuYXBwLCBzZWxlY3RlZCwgdGhpcy5vcHRpb25zLmRlZmF1bHROb2RlU2hhcGUsIHtcbiAgICAgIHJlc29sdmVJbWFnZTogdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlLFxuICAgICAgb25TYXZlUGFzdGVkSW1hZ2U6IHRoaXMuY2FsbGJhY2tzLm9uU2F2ZVBhc3RlZEltYWdlLFxuICAgICAgb25VcGxvYWRJbWFnZTogdGhpcy5jYWxsYmFja3Mub25VcGxvYWRJbWFnZVxuICAgIH0sICh2YWx1ZXMpID0+IHtcbiAgICAgIC8vIEEgY29udGludW91c2x5IG9wZW4gZWRpdG9yIG1heSBhdXRvc2F2ZSBtYW55IHRpbWVzLiBDYXB0dXJlIG9uZSB1bmRvXG4gICAgICAvLyBzbmFwc2hvdCBmb3IgdGhlIHdob2xlIGVkaXRpbmcgc2Vzc2lvbiBpbnN0ZWFkIG9mIG9uZSBzbmFwc2hvdCBwZXIga2V5cHJlc3MuXG4gICAgICBpZiAoIWhpc3RvcnlDYXB0dXJlZCkge1xuICAgICAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgICAgIHRoaXMudHJpbUhpc3RvcnkoKTtcbiAgICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICAgICAgaGlzdG9yeUNhcHR1cmVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNlbGVjdGVkLmNvbnRlbnQgPSB2YWx1ZXMuY29udGVudDtcbiAgICAgIHN5bmNOb2RlTGVnYWN5RmllbGRzKHNlbGVjdGVkKTtcbiAgICAgIHNlbGVjdGVkLm5vdGUgPSB2YWx1ZXMubm90ZSB8fCB1bmRlZmluZWQ7XG4gICAgICBzZWxlY3RlZC5saW5rID0gdmFsdWVzLmxpbmsgfHwgdW5kZWZpbmVkO1xuICAgICAgc2VsZWN0ZWQuaWNvbiA9IHZhbHVlcy5pY29uIHx8IHVuZGVmaW5lZDtcbiAgICAgIHNlbGVjdGVkLnRhZ3MgPSB2YWx1ZXMudGFncy5sZW5ndGggPyB2YWx1ZXMudGFncyA6IHVuZGVmaW5lZDtcbiAgICAgIHNlbGVjdGVkLnRhc2sgPSB2YWx1ZXMudGFzaztcbiAgICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgICBjb2xvcjogdmFsdWVzLmNvbG9yLFxuICAgICAgICB0ZXh0Q29sb3I6IHZhbHVlcy50ZXh0Q29sb3IsXG4gICAgICAgIGJvcmRlckNvbG9yOiB2YWx1ZXMuYm9yZGVyQ29sb3IsXG4gICAgICAgIGJvcmRlcldpZHRoOiB2YWx1ZXMuYm9yZGVyV2lkdGgsXG4gICAgICAgIHNoYXBlOiB2YWx1ZXMuc2hhcGUsXG4gICAgICAgIGJvbGQ6IHZhbHVlcy5ib2xkLFxuICAgICAgICBpdGFsaWM6IHZhbHVlcy5pdGFsaWMsXG4gICAgICAgIHVuZGVybGluZTogdmFsdWVzLnVuZGVybGluZSxcbiAgICAgICAgZm9udFNpemU6IHZhbHVlcy5mb250U2l6ZVxuICAgICAgfTtcbiAgICAgIHNlbGVjdGVkLnN0eWxlID0gT2JqZWN0LnZhbHVlcyhzdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gc3R5bGUgOiB1bmRlZmluZWQ7XG4gICAgICBpZiAoc2VsZWN0ZWQuaWQgPT09IHRoaXMuZG9jdW1lbnQucm9vdC5pZCkge1xuICAgICAgICBjb25zdCB0aXRsZSA9IG5vZGVQbGFpblRleHQoc2VsZWN0ZWQpO1xuICAgICAgICBpZiAodGl0bGUpIHRoaXMuZG9jdW1lbnQudGl0bGUgPSB0aXRsZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBkZWxldGVTZWxlY3RlZCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCB8fCBzZWxlY3RlZC5pZCA9PT0gdGhpcy5kb2N1bWVudC5yb290LmlkKSB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU2ODM5XHU4MjgyXHU3MEI5XHU0RTBEXHU4MEZEXHU1MjIwXHU5NjY0XCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnQgPSBmaW5kUGFyZW50KHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHtcbiAgICAgIHJlbW92ZU5vZGUodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgICB0aGlzLnNlbGVjdGVkSWQgPSBwYXJlbnQ/LmlkID8/IHRoaXMuZG9jdW1lbnQucm9vdC5pZDtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgdG9nZ2xlQ29sbGFwc2UoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQgfHwgIXNlbGVjdGVkLmNoaWxkcmVuLmxlbmd0aCkgcmV0dXJuO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29sbGFwc2VkID0gIXNlbGVjdGVkLmNvbGxhcHNlZDsgfSk7XG4gIH1cblxuICBwcml2YXRlIGN5Y2xlVGFzaygpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgIGNvbnN0IG5leHQ6IFJlY29yZDxzdHJpbmcsIFRhc2tTdGF0dXMgfCB1bmRlZmluZWQ+ID0geyBcIlwiOiBcInRvZG9cIiwgdG9kbzogXCJkb2luZ1wiLCBkb2luZzogXCJkb25lXCIsIGRvbmU6IHVuZGVmaW5lZCB9O1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQudGFzayA9IG5leHRbc2VsZWN0ZWQudGFzayA/PyBcIlwiXTsgfSk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZUxheW91dCgpOiB2b2lkIHtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHRoaXMuZG9jdW1lbnQubGF5b3V0ID0gdGhpcy5kb2N1bWVudC5sYXlvdXQgPT09IFwicmlnaHRcIiA/IFwiYmFsYW5jZWRcIiA6IFwicmlnaHRcIjsgfSk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5maXRUb1ZpZXcoKSwgMjApO1xuICB9XG5cbiAgcHJpdmF0ZSBlZGl0QXBwZWFyYW5jZSgpOiB2b2lkIHtcbiAgICBuZXcgQXBwZWFyYW5jZU1vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLmdldEFwcGVhcmFuY2UoKSxcbiAgICAgIChhcHBlYXJhbmNlKSA9PiB0aGlzLm11dGF0ZSgoKSA9PiB7IHRoaXMuZG9jdW1lbnQuYXBwZWFyYW5jZSA9IGFwcGVhcmFuY2U7IH0pLFxuICAgICAgKCkgPT4gdGhpcy5tdXRhdGUoKCkgPT4geyB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UgPSB1bmRlZmluZWQ7IH0pXG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGVkaXRUYWJsZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIG5ldyBUYWJsZUVkaXRNb2RhbCh0aGlzLmFwcCwgc2VsZWN0ZWQudGFibGUsICh0YWJsZSkgPT4ge1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC50YWJsZSA9IHRhYmxlOyB9KTtcbiAgICB9KS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGNvbnZlcnRDaGlsZHJlblRvVGFibGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBjb25zdCB0YWJsZSA9IGNoaWxkcmVuVG9UYWJsZShzZWxlY3RlZCk7XG4gICAgaWYgKCF0YWJsZSkgeyBuZXcgTm90aWNlKFwiXHU1RjUzXHU1MjREXHU4MjgyXHU3MEI5XHU2Q0ExXHU2NzA5XHU1M0VGXHU4RjZDXHU2MzYyXHU3Njg0XHU1QjUwXHU4MjgyXHU3MEI5XCIpOyByZXR1cm47IH1cbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICBzZWxlY3RlZC50YWJsZSA9IHRhYmxlO1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBuZXcgTm90aWNlKFwiXHU1REYyXHU3NTFGXHU2MjEwXHU1QjUwXHU4MjgyXHU3MEI5XHU4ODY4XHU2ODNDXHVGRjFCXHU1MzlGXHU1QjUwXHU4MjgyXHU3MEI5XHU1REYyXHU0RkREXHU3NTU5XHU1RTc2XHU2NTM2XHU4RDc3XCIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVUYWJsZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZD8udGFibGUpIHJldHVybjtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICBzZWxlY3RlZC50YWJsZSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmIChzZWxlY3RlZC5jaGlsZHJlbi5sZW5ndGgpIHNlbGVjdGVkLmNvbGxhcHNlZCA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBlZGl0Q29kZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIG5ldyBDb2RlRWRpdE1vZGFsKHRoaXMuYXBwLCBzZWxlY3RlZC5jb2RlLCAoY29kZSkgPT4ge1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5jb2RlID0gY29kZTsgfSk7XG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVDb2RlKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkPy5jb2RlKSByZXR1cm47XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5jb2RlID0gdW5kZWZpbmVkOyB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlT3JPcGVuU3VibWFwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgaWYgKHNlbGVjdGVkLnN1Ym1hcCkge1xuICAgICAgYXdhaXQgdGhpcy5jYWxsYmFja3Mub25PcGVuTWluZE1hcChzZWxlY3RlZC5zdWJtYXAucGF0aCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdWJtYXAgPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vbkNyZWF0ZVN1Ym1hcChzZWxlY3RlZCk7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLnN1Ym1hcCA9IHN1Ym1hcDsgfSk7XG4gICAgICBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5NaW5kTWFwKHN1Ym1hcC5wYXRoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGNyZWF0ZSBzdWJtYXAgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTUyMUJcdTVFRkFcdTVCNTBcdTVCRkNcdTU2RkVcdTU5MzFcdThEMjVcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJOb2RlVGFibGUoY29udGVudDogSFRNTEVsZW1lbnQsIG5vZGU6IE1pbmRNYXBOb2RlKTogdm9pZCB7XG4gICAgaWYgKCFub2RlLnRhYmxlKSByZXR1cm47XG4gICAgY29uc3Qgd3JhcCA9IGNvbnRlbnQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2RlLXRhYmxlLXdyYXBcIiB9KTtcbiAgICBjb25zdCB0YWJsZSA9IHdyYXAuY3JlYXRlRWwoXCJ0YWJsZVwiLCB7IGNsczogXCJtbWMtbm9kZS10YWJsZVwiIH0pO1xuICAgIGNvbnN0IGhlYWQgPSB0YWJsZS5jcmVhdGVFbChcInRoZWFkXCIpLmNyZWF0ZUVsKFwidHJcIik7XG4gICAgbm9kZS50YWJsZS5oZWFkZXJzLmZvckVhY2goKGhlYWRlciwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNlbGwgPSBoZWFkLmNyZWF0ZUVsKFwidGhcIiwgeyB0ZXh0OiBoZWFkZXIgfHwgYFx1NTIxNyAke2luZGV4ICsgMX1gIH0pO1xuICAgICAgY2VsbC5zdHlsZS50ZXh0QWxpZ24gPSBub2RlLnRhYmxlPy5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgIH0pO1xuICAgIGNvbnN0IGJvZHkgPSB0YWJsZS5jcmVhdGVFbChcInRib2R5XCIpO1xuICAgIG5vZGUudGFibGUucm93cy5mb3JFYWNoKChyb3cpID0+IHtcbiAgICAgIGNvbnN0IHRyID0gYm9keS5jcmVhdGVFbChcInRyXCIpO1xuICAgICAgbm9kZS50YWJsZSEuaGVhZGVycy5mb3JFYWNoKChfLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBjZWxsID0gdHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IHRleHQ6IHJvd1tpbmRleF0gPz8gXCJcIiB9KTtcbiAgICAgICAgY2VsbC5zdHlsZS50ZXh0QWxpZ24gPSBub2RlLnRhYmxlPy5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgd3JhcC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgKGV2ZW50KSA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKSk7XG4gICAgd3JhcC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgd3JhcC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7IHRoaXMuZWRpdFRhYmxlKCk7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJOb2RlQ29kZShjb250ZW50OiBIVE1MRWxlbWVudCwgbm9kZTogTWluZE1hcE5vZGUpOiB2b2lkIHtcbiAgICBpZiAoIW5vZGUuY29kZSkgcmV0dXJuO1xuICAgIGNvbnN0IGJsb2NrID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvZGUtYmxvY2tcIiB9KTtcbiAgICBjb25zdCBoZWFkZXIgPSBibG9jay5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvZGUtaGVhZGVyXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZVNwYW4oeyB0ZXh0OiBub2RlLmNvZGUubGFuZ3VhZ2UgfHwgXCJjb2RlXCIgfSk7XG4gICAgY29uc3QgY29weSA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjbGlja2FibGUtaWNvblwiLCBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIlx1NTkwRFx1NTIzNlx1NEVFM1x1NzgwMVwiIH0gfSk7XG4gICAgc2V0SWNvbihjb3B5LCBcImNvcHlcIik7XG4gICAgY29weS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobm9kZS5jb2RlIS5jb2RlKS50aGVuKCgpID0+IG5ldyBOb3RpY2UoXCJcdTRFRTNcdTc4MDFcdTVERjJcdTU5MERcdTUyMzZcIikpO1xuICAgIH0pO1xuICAgIGNvbnN0IHJlbmRlcmVkID0gYmxvY2suY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2RlLXJlbmRlcmVkIG1hcmtkb3duLXJlbmRlcmVkXCIgfSk7XG4gICAgdm9pZCB0aGlzLmNhbGxiYWNrcy5vblJlbmRlckNvZGUobm9kZS5jb2RlLCByZW5kZXJlZCk7XG4gICAgYmxvY2suYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgIGJsb2NrLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGV2ZW50KSA9PiBldmVudC5wcmV2ZW50RGVmYXVsdCgpKTtcbiAgICBibG9jay5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7IHRoaXMuZWRpdENvZGUoKTsgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZVBhc3RlKGV2ZW50OiBDbGlwYm9hcmRFdmVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0Lm1hdGNoZXMoXCJpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCwgW2NvbnRlbnRlZGl0YWJsZT0ndHJ1ZSddXCIpKSByZXR1cm47XG4gICAgY29uc3QgZGF0YSA9IGV2ZW50LmNsaXBib2FyZERhdGE7XG4gICAgaWYgKCFkYXRhKSByZXR1cm47XG4gICAgY29uc3QgaW1hZ2VJdGVtID0gQXJyYXkuZnJvbShkYXRhLml0ZW1zKS5maW5kKChpdGVtKSA9PiBpdGVtLmtpbmQgPT09IFwiZmlsZVwiICYmIGl0ZW0udHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpKTtcbiAgICBpZiAoaW1hZ2VJdGVtKSB7XG4gICAgICBjb25zdCBibG9iID0gaW1hZ2VJdGVtLmdldEFzRmlsZSgpO1xuICAgICAgaWYgKCFibG9iKSByZXR1cm47XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IGJsb2IudHlwZS5zcGxpdChcIi9cIilbMV0/LnJlcGxhY2UoXCJqcGVnXCIsIFwianBnXCIpIHx8IFwicG5nXCI7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vblNhdmVQYXN0ZWRJbWFnZShibG9iLCBgbWluZG1hcC1pbWFnZS4ke2V4dGVuc2lvbn1gKTtcbiAgICAgICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKHNlbGVjdGVkKTtcbiAgICAgICAgICBibG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcImltYWdlXCIsIHNvdXJjZTogcGF0aCB9KTtcbiAgICAgICAgICBzZWxlY3RlZC5jb250ZW50ID0gYmxvY2tzO1xuICAgICAgICAgIHN5bmNOb2RlTGVnYWN5RmllbGRzKHNlbGVjdGVkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ldyBOb3RpY2UoYFx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NUI1OFx1RkYxQSR7cGF0aH1gKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBwYXN0ZSBpbWFnZSBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgICBuZXcgTm90aWNlKFwiXHU3Qzk4XHU4RDM0XHU1NkZFXHU3MjQ3XHU1OTMxXHU4RDI1XCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSBkYXRhLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpO1xuICAgIGlmICghdGV4dC50cmltKCkpIHJldHVybjtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGNvbnN0IHRhYmxlID0gcGFyc2VNYXJrZG93blRhYmxlKHRleHQpO1xuICAgIGlmICh0YWJsZSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQudGFibGUgPSB0YWJsZTsgfSk7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1REYyXHU4QkM2XHU1MjJCXHU1RTc2XHU2M0QyXHU1MTY1IE1hcmtkb3duIFx1ODg2OFx1NjgzQ1wiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY29kZSA9IHBhcnNlRmVuY2VkQ29kZSh0ZXh0KTtcbiAgICBpZiAoY29kZSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29kZSA9IGNvZGU7IH0pO1xuICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU4QkM2XHU1MjJCXHU1RTc2XHU2M0QyXHU1MTY1JHtjb2RlLmxhbmd1YWdlID8gYCAke2NvZGUubGFuZ3VhZ2V9YCA6IFwiXCJ9XHU0RUUzXHU3ODAxYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGJyYW5jaCA9IHRoaXMucGFyc2VDbGlwYm9hcmROb2RlKHRleHQpO1xuICAgIGlmIChicmFuY2gpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBjbG9uZSA9IGNsb25lTm9kZVdpdGhGcmVzaElkcyhicmFuY2gpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5jb2xsYXBzZWQgPSBmYWxzZTsgc2VsZWN0ZWQuY2hpbGRyZW4ucHVzaChjbG9uZSk7IHRoaXMuc2VsZWN0ZWRJZCA9IGNsb25lLmlkOyB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9wZW5TZWxlY3RlZExpbmsoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICBjb25zdCBsaW5rID0gdGhpcy5nZXROb2RlTGluayhzZWxlY3RlZCk7XG4gICAgaWYgKCFsaW5rKSB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1RjUzXHU1MjREXHU4MjgyXHU3MEI5XHU2Q0ExXHU2NzA5XHU5NEZFXHU2M0E1XHVGRjFCXHU1M0VGXHU2MzA5IEYyIFx1NkRGQlx1NTJBMFx1OTRGRVx1NjNBNVx1NjIxNlx1NTcyOFx1NjU4N1x1NUI1N1x1NEUyRFx1NTE5OVx1NTE2NSBbW1x1N0IxNFx1OEJCMFx1NTQwRF1dXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2b2lkIHRoaXMuY2FsbGJhY2tzLm9uT3BlbkxpbmsobGluayk7XG4gIH1cblxuICBwcml2YXRlIGdldE5vZGVMaW5rKG5vZGU6IE1pbmRNYXBOb2RlKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIG5vZGUubGluaz8udHJpbSgpIHx8IGV4dHJhY3RGaXJzdFdpa2lMaW5rKG5vZGVQbGFpblRleHQobm9kZSkpIHx8IGV4dHJhY3RGaXJzdFdpa2lMaW5rKG5vZGUubm90ZSA/PyBcIlwiKTtcbiAgfVxuXG4gIHByaXZhdGUgc2hvd091dGxpbmUoKTogdm9pZCB7XG4gICAgY29uc3QgbWFya2Rvd24gPSBkb2N1bWVudFRvTWFya2Rvd24odGhpcy5kb2N1bWVudCk7XG4gICAgbmV3IE91dGxpbmVNb2RhbCh0aGlzLmFwcCwgbWFya2Rvd24sICgpID0+IHZvaWQgdGhpcy5jYWxsYmFja3Mub25FeHBvcnRNYXJrZG93bihtYXJrZG93bikpLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgc2hvd0pzb25UcmFuc2ZlcigpOiB2b2lkIHtcbiAgICBuZXcgSnNvblRyYW5zZmVyTW9kYWwoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgIHRoaXMuZ2V0RG9jdW1lbnQoKSxcbiAgICAgIChkb2N1bWVudCkgPT4gdGhpcy5yZXBsYWNlRG9jdW1lbnQoZG9jdW1lbnQpLFxuICAgICAgKGpzb24pID0+IHZvaWQgdGhpcy5jYWxsYmFja3Mub25FeHBvcnRKc29uKGpzb24pXG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIG9wZW5TZWFyY2goKTogdm9pZCB7XG4gICAgbmV3IFNlYXJjaE5vZGVzTW9kYWwoXG4gICAgICB0aGlzLmFwcCxcbiAgICAgIGZsYXR0ZW5Ob2Rlcyh0aGlzLmRvY3VtZW50LnJvb3QpLFxuICAgICAgKHF1ZXJ5KSA9PiB7XG4gICAgICAgIHRoaXMuc2VhcmNoUXVlcnkgPSBxdWVyeTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0sXG4gICAgICAobm9kZSkgPT4gdGhpcy5mb2N1c05vZGUobm9kZS5pZClcbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgZm9jdXNOb2RlKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBhbmNlc3RvcnMgPSBmaW5kQW5jZXN0b3JzKHRoaXMuZG9jdW1lbnQucm9vdCwgaWQpO1xuICAgIGNvbnN0IGNvbGxhcHNlZCA9IGFuY2VzdG9ycy5maWx0ZXIoKG5vZGUpID0+IG5vZGUuY29sbGFwc2VkKTtcbiAgICBpZiAoY29sbGFwc2VkLmxlbmd0aCkge1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4gY29sbGFwc2VkLmZvckVhY2goKG5vZGUpID0+IHsgbm9kZS5jb2xsYXBzZWQgPSBmYWxzZTsgfSkpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdGVkSWQgPSBpZDtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuY2VudGVyTm9kZShpZCksIDIwKTtcbiAgfVxuXG4gIHByaXZhdGUgY2VudGVyTm9kZShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmxheW91dC5ieUlkLmdldChpZCk7XG4gICAgaWYgKCFwb3NpdGlvbikgcmV0dXJuO1xuICAgIHRoaXMucGFuWCA9IC1wb3NpdGlvbi54ICogdGhpcy56b29tO1xuICAgIHRoaXMucGFuWSA9IC1wb3NpdGlvbi55ICogdGhpcy56b29tO1xuICAgIHRoaXMuYXBwbHlUcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIHByaXZhdGUgb3BlbkNvbnRleHRNZW51KGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NkRGQlx1NTJBMFx1NUI1MFx1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwicGx1cy1jaXJjbGVcIikub25DbGljaygoKSA9PiB0aGlzLmFkZENoaWxkKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTZERkJcdTUyQTBcdTU0MENcdTdFQTdcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcImxpc3QtcGx1c1wiKS5vbkNsaWNrKCgpID0+IHRoaXMuYWRkU2libGluZygpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU3RjE2XHU4RjkxXHU4MjgyXHU3MEI5XCIpLnNldEljb24oXCJwZW5jaWxcIikub25DbGljaygoKSA9PiB0aGlzLmVkaXRTZWxlY3RlZCgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU1MTRCXHU5Njg2XHU1MjA2XHU2NTJGXCIpLnNldEljb24oXCJjb3B5LXBsdXNcIikub25DbGljaygoKSA9PiB0aGlzLmR1cGxpY2F0ZVNlbGVjdGVkKCkpKTtcbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShzZWxlY3RlZD8udGFibGUgPyBcIlx1N0YxNlx1OEY5MVx1ODg2OFx1NjgzQ1wiIDogXCJcdTYzRDJcdTUxNjVcdTg4NjhcdTY4M0NcIikuc2V0SWNvbihcInRhYmxlLTJcIikub25DbGljaygoKSA9PiB0aGlzLmVkaXRUYWJsZSgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU1QzA2XHU1QjUwXHU4MjgyXHU3MEI5XHU3NTFGXHU2MjEwXHU4ODY4XHU2ODNDXCIpLnNldEljb24oXCJ0YWJsZS1wcm9wZXJ0aWVzXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5jb252ZXJ0Q2hpbGRyZW5Ub1RhYmxlKCkpKTtcbiAgICBpZiAoc2VsZWN0ZWQ/LnRhYmxlKSBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTc5RkJcdTk2NjRcdTg4NjhcdTY4M0NcIikuc2V0SWNvbihcInRhYmxlLTJcIikub25DbGljaygoKSA9PiB0aGlzLnJlbW92ZVRhYmxlKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoc2VsZWN0ZWQ/LmNvZGUgPyBcIlx1N0YxNlx1OEY5MVx1NEVFM1x1NzgwMVwiIDogXCJcdTYzRDJcdTUxNjVcdTRFRTNcdTc4MDFcIikuc2V0SWNvbihcImNvZGUtMlwiKS5vbkNsaWNrKCgpID0+IHRoaXMuZWRpdENvZGUoKSkpO1xuICAgIGlmIChzZWxlY3RlZD8uY29kZSkgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU3OUZCXHU5NjY0XHU0RUUzXHU3ODAxXCIpLnNldEljb24oXCJlcmFzZXJcIikub25DbGljaygoKSA9PiB0aGlzLnJlbW92ZUNvZGUoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShzZWxlY3RlZD8uc3VibWFwID8gXCJcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkVcIiA6IFwiXHU1MjFCXHU1RUZBXHU1QjUwXHU1QkZDXHU1NkZFXCIpLnNldEljb24oXCJuZXR3b3JrXCIpLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU9yT3BlblN1Ym1hcCgpKSk7XG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTU5MERcdTUyMzZcdTUyMDZcdTY1MkZcIikuc2V0SWNvbihcImNvcHlcIikub25DbGljaygoKSA9PiB2b2lkIHRoaXMuY29weVNlbGVjdGVkQnJhbmNoKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTdDOThcdThEMzRcdTRFM0FcdTVCNTBcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcImNsaXBib2FyZC1wYXN0ZVwiKS5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5wYXN0ZUFzQ2hpbGQoKSkpO1xuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKGBcdTRFRkJcdTUyQTFcdTcyQjZcdTYwMDFcdUZGMUEke3NlbGVjdGVkPy50YXNrID09PSBcImRvbmVcIiA/IFwiXHU1REYyXHU1QjhDXHU2MjEwXCIgOiBzZWxlY3RlZD8udGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdThGREJcdTg4NENcdTRFMkRcIiA6IHNlbGVjdGVkPy50YXNrID09PSBcInRvZG9cIiA/IFwiXHU1Rjg1XHU1MjlFXCIgOiBcIlx1NjVFMFwifWApLnNldEljb24oXCJjaXJjbGUtY2hlY2stYmlnXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5jeWNsZVRhc2soKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NUM1NVx1NUYwMC9cdTY1MzZcdThENzdcIikuc2V0SWNvbihcImZvbGQtdmVydGljYWxcIikub25DbGljaygoKSA9PiB0aGlzLnRvZ2dsZUNvbGxhcHNlKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTYyNTNcdTVGMDBcdTk0RkVcdTYzQTVcIikuc2V0SWNvbihcImxpbmtcIikub25DbGljaygoKSA9PiB0aGlzLm9wZW5TZWxlY3RlZExpbmsoKSkpO1xuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU1MjIwXHU5NjY0XHU4MjgyXHU3MEI5XCIpLnNldEljb24oXCJ0cmFzaC0yXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5kZWxldGVTZWxlY3RlZCgpKSk7XG4gICAgbWVudS5zaG93QXRNb3VzZUV2ZW50KGV2ZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29weVNlbGVjdGVkQnJhbmNoKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkKSByZXR1cm4gZmFsc2U7XG4gICAgdGhpcy5icmFuY2hDbGlwYm9hcmQgPSBjbG9uZURvY3VtZW50KHsgdmVyc2lvbjogNywgdGl0bGU6IG5vZGVQbGFpblRleHQoc2VsZWN0ZWQpIHx8IFwiXHU1NkZFXHU3MjQ3XHU4MjgyXHU3MEI5XCIsIGxheW91dDogXCJyaWdodFwiLCB0aGVtZTogXCJhdXRvXCIsIHJvb3Q6IHNlbGVjdGVkIH0pLnJvb3Q7XG4gICAgY29uc3QgcGF5bG9hZCA9IEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJtaW5kbWFwLXN0dWRpby1ub2RlXCIsIHZlcnNpb246IDEsIG5vZGU6IHNlbGVjdGVkIH0sIG51bGwsIDIpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChwYXlsb2FkKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVERjJcdTU5MERcdTUyMzZcdTgyODJcdTcwQjlcdTUyMDZcdTY1MkZcIik7XG4gICAgfSBjYXRjaCB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU4MjgyXHU3MEI5XHU1MjA2XHU2NTJGXHU1REYyXHU1OTBEXHU1MjM2XHU1MjMwXHU2M0QyXHU0RUY2XHU1MTg1XHU5MEU4XHU1MjZBXHU4RDM0XHU2NzdGXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGFzdGVBc0NoaWxkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgbGV0IHNvdXJjZU5vZGU6IE1pbmRNYXBOb2RlIHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLnJlYWRUZXh0KCk7XG4gICAgICBpZiAodGV4dC50cmltKCkpIHNvdXJjZU5vZGUgPSB0aGlzLnBhcnNlQ2xpcGJvYXJkTm9kZSh0ZXh0KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEJyb3dzZXIgY2xpcGJvYXJkIHBlcm1pc3Npb24gY2FuIGJlIHVuYXZhaWxhYmxlOyB1c2UgaW50ZXJuYWwgY2xpcGJvYXJkLlxuICAgIH1cbiAgICBzb3VyY2VOb2RlID8/PSB0aGlzLmJyYW5jaENsaXBib2FyZDtcbiAgICBpZiAoIXNvdXJjZU5vZGUpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTUyNkFcdThEMzRcdTY3N0ZcdTRFMkRcdTZDQTFcdTY3MDlcdTUzRUZcdTdDOThcdThEMzRcdTc2ODQgTWluZE1hcCBcdTgyODJcdTcwQjlcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNsb25lID0gY2xvbmVOb2RlV2l0aEZyZXNoSWRzKHNvdXJjZU5vZGUpO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHtcbiAgICAgIHNlbGVjdGVkLmNvbGxhcHNlZCA9IGZhbHNlO1xuICAgICAgc2VsZWN0ZWQuY2hpbGRyZW4ucHVzaChjbG9uZSk7XG4gICAgICB0aGlzLnNlbGVjdGVkSWQgPSBjbG9uZS5pZDtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VDbGlwYm9hcmROb2RlKHRleHQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UodGV4dCkgYXMgeyB0eXBlPzogc3RyaW5nOyBub2RlPzogUGFydGlhbDxNaW5kTWFwTm9kZT47IHJvb3Q/OiBQYXJ0aWFsPE1pbmRNYXBOb2RlPjsgdGV4dD86IHN0cmluZzsgY2hpbGRyZW4/OiB1bmtub3duW10gfTtcbiAgICAgIGNvbnN0IGlucHV0ID0gKHBhcnNlZC50eXBlID09PSBcIm1pbmRtYXAtc3R1ZGlvLW5vZGVcIiB8fCBwYXJzZWQudHlwZSA9PT0gXCJtbWMtbGl0ZS1ub2RlXCIgfHwgcGFyc2VkLnR5cGUgPT09IFwic21tLWxpdGUtbm9kZVwiKSAmJiBwYXJzZWQubm9kZSA/IHBhcnNlZC5ub2RlIDogcGFyc2VkLnJvb3QgPz8gKHR5cGVvZiBwYXJzZWQudGV4dCA9PT0gXCJzdHJpbmdcIiAmJiBBcnJheS5pc0FycmF5KHBhcnNlZC5jaGlsZHJlbikgPyBwYXJzZWQgOiBudWxsKTtcbiAgICAgIGlmICghaW5wdXQpIHJldHVybiBudWxsO1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZURvY3VtZW50KHsgdGl0bGU6IGlucHV0LnRleHQgPz8gXCJcdTdDOThcdThEMzRcdTgyODJcdTcwQjlcIiwgcm9vdDogaW5wdXQgYXMgTWluZE1hcE5vZGUgfSwgaW5wdXQudGV4dCA/PyBcIlx1N0M5OFx1OEQzNFx1ODI4Mlx1NzBCOVwiKS5yb290O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBkdXBsaWNhdGVTZWxlY3RlZCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCB8fCBzZWxlY3RlZC5pZCA9PT0gdGhpcy5kb2N1bWVudC5yb290LmlkKSB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU4QkY3XHU5MDA5XHU2MkU5XHU5NzVFXHU2ODM5XHU4MjgyXHU3MEI5XHU1NDBFXHU1MTRCXHU5Njg2XHU1MjA2XHU2NTJGXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnQgPSBmaW5kUGFyZW50KHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgIGlmICghcGFyZW50KSByZXR1cm47XG4gICAgY29uc3QgY2xvbmUgPSBjbG9uZU5vZGVXaXRoRnJlc2hJZHMoc2VsZWN0ZWQpO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGFyZW50LmNoaWxkcmVuLmZpbmRJbmRleCgoY2hpbGQpID0+IGNoaWxkLmlkID09PSBzZWxlY3RlZC5pZCk7XG4gICAgICBwYXJlbnQuY2hpbGRyZW4uc3BsaWNlKGluZGV4ICsgMSwgMCwgY2xvbmUpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gY2xvbmUuaWQ7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNhblJlcGFyZW50KGRyYWdnZWRJZDogc3RyaW5nIHwgbnVsbCwgdGFyZ2V0SWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghZHJhZ2dlZElkIHx8IGRyYWdnZWRJZCA9PT0gdGhpcy5kb2N1bWVudC5yb290LmlkIHx8IGRyYWdnZWRJZCA9PT0gdGFyZ2V0SWQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBkcmFnZ2VkID0gZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCBkcmFnZ2VkSWQpO1xuICAgIHJldHVybiBCb29sZWFuKGRyYWdnZWQgJiYgIWNvbnRhaW5zTm9kZShkcmFnZ2VkLCB0YXJnZXRJZCkpO1xuICB9XG5cbiAgcHJpdmF0ZSByZXBhcmVudE5vZGUoZHJhZ2dlZElkOiBzdHJpbmcsIHRhcmdldElkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY2FuUmVwYXJlbnQoZHJhZ2dlZElkLCB0YXJnZXRJZCkpIHJldHVybjtcbiAgICBjb25zdCBkcmFnZ2VkID0gZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCBkcmFnZ2VkSWQpO1xuICAgIGNvbnN0IHRhcmdldCA9IGZpbmROb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgdGFyZ2V0SWQpO1xuICAgIGlmICghZHJhZ2dlZCB8fCAhdGFyZ2V0KSByZXR1cm47XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgcmVtb3ZlTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGRyYWdnZWRJZCk7XG4gICAgICB0YXJnZXQuY2hpbGRyZW4ucHVzaChkcmFnZ2VkKTtcbiAgICAgIHRhcmdldC5jb2xsYXBzZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGRyYWdnZWRJZDtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVwbGFjZURvY3VtZW50KGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQpOiB2b2lkIHtcbiAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy50cmltSGlzdG9yeSgpO1xuICAgIHRoaXMuZnV0dXJlID0gW107XG4gICAgdGhpcy5kb2N1bWVudCA9IGNsb25lRG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgIHRoaXMuc2VsZWN0ZWRJZCA9IHRoaXMuZG9jdW1lbnQucm9vdC5pZDtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5maXRUb1ZpZXcoKSwgMjApO1xuICB9XG5cbiAgcHJpdmF0ZSBtdXRhdGUoYWN0aW9uOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5oaXN0b3J5LnB1c2goSlNPTi5zdHJpbmdpZnkodGhpcy5kb2N1bWVudCkpO1xuICAgIHRoaXMudHJpbUhpc3RvcnkoKTtcbiAgICB0aGlzLmZ1dHVyZSA9IFtdO1xuICAgIGFjdGlvbigpO1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgdHJpbUhpc3RvcnkoKTogdm9pZCB7XG4gICAgY29uc3QgbGltaXQgPSBNYXRoLm1heCgxMCwgTWF0aC5taW4oNTAwLCB0aGlzLm9wdGlvbnMuaGlzdG9yeUxpbWl0KSk7XG4gICAgd2hpbGUgKHRoaXMuaGlzdG9yeS5sZW5ndGggPiBsaW1pdCkgdGhpcy5oaXN0b3J5LnNoaWZ0KCk7XG4gIH1cblxuICBwcml2YXRlIHVuZG8oKTogdm9pZCB7XG4gICAgY29uc3QgcHJldmlvdXMgPSB0aGlzLmhpc3RvcnkucG9wKCk7XG4gICAgaWYgKCFwcmV2aW91cykgcmV0dXJuO1xuICAgIHRoaXMuZnV0dXJlLnB1c2goSlNPTi5zdHJpbmdpZnkodGhpcy5kb2N1bWVudCkpO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBKU09OLnBhcnNlKHByZXZpb3VzKSBhcyBNaW5kTWFwRG9jdW1lbnQ7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVkbygpOiB2b2lkIHtcbiAgICBjb25zdCBuZXh0ID0gdGhpcy5mdXR1cmUucG9wKCk7XG4gICAgaWYgKCFuZXh0KSByZXR1cm47XG4gICAgdGhpcy5oaXN0b3J5LnB1c2goSlNPTi5zdHJpbmdpZnkodGhpcy5kb2N1bWVudCkpO1xuICAgIHRoaXMudHJpbUhpc3RvcnkoKTtcbiAgICB0aGlzLmRvY3VtZW50ID0gSlNPTi5wYXJzZShuZXh0KSBhcyBNaW5kTWFwRG9jdW1lbnQ7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgZml0VG9WaWV3KCk6IHZvaWQge1xuICAgIGNvbnN0IHJlY3QgPSB0aGlzLnZpZXdwb3J0RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3Qgd2lkdGggPSBNYXRoLm1heCgxLCB0aGlzLmxheW91dC5tYXhYIC0gdGhpcy5sYXlvdXQubWluWCArIDEwMCk7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoMSwgdGhpcy5sYXlvdXQubWF4WSAtIHRoaXMubGF5b3V0Lm1pblkgKyAxMDApO1xuICAgIHRoaXMuem9vbSA9IHRoaXMuY2xhbXBab29tKE1hdGgubWluKChyZWN0LndpZHRoIC0gNDApIC8gd2lkdGgsIChyZWN0LmhlaWdodCAtIDQwKSAvIGhlaWdodCwgMS4yNSkpO1xuICAgIGNvbnN0IGNlbnRlclggPSAodGhpcy5sYXlvdXQubWluWCArIHRoaXMubGF5b3V0Lm1heFgpIC8gMjtcbiAgICBjb25zdCBjZW50ZXJZID0gKHRoaXMubGF5b3V0Lm1pblkgKyB0aGlzLmxheW91dC5tYXhZKSAvIDI7XG4gICAgdGhpcy5wYW5YID0gLWNlbnRlclggKiB0aGlzLnpvb207XG4gICAgdGhpcy5wYW5ZID0gLWNlbnRlclkgKiB0aGlzLnpvb207XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRab29tKHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnpvb20gPSB0aGlzLmNsYW1wWm9vbSh2YWx1ZSk7XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGFtcFpvb20odmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgubWluKDIuNSwgTWF0aC5tYXgoMC4yLCB2YWx1ZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBuYXZpZ2F0ZVNlbGVjdGlvbihkaXJlY3Rpb246IFwicGFyZW50XCIgfCBcImNoaWxkXCIgfCBcInByZXZpb3VzXCIgfCBcIm5leHRcIik6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgbGV0IHRhcmdldDogTWluZE1hcE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICBpZiAoZGlyZWN0aW9uID09PSBcInBhcmVudFwiKSB0YXJnZXQgPSBmaW5kUGFyZW50KHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgIGlmIChkaXJlY3Rpb24gPT09IFwiY2hpbGRcIikgdGFyZ2V0ID0gc2VsZWN0ZWQuY2hpbGRyZW5bMF0gPz8gbnVsbDtcbiAgICBpZiAoZGlyZWN0aW9uID09PSBcInByZXZpb3VzXCIgfHwgZGlyZWN0aW9uID09PSBcIm5leHRcIikge1xuICAgICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZCkgPT4gY2hpbGQuaWQgPT09IHNlbGVjdGVkLmlkKTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gZGlyZWN0aW9uID09PSBcInByZXZpb3VzXCIgPyAtMSA6IDE7XG4gICAgICAgIHRhcmdldCA9IHBhcmVudC5jaGlsZHJlbltpbmRleCArIG9mZnNldF0gPz8gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgdGhpcy5zZWxlY3ROb2RlKHRhcmdldC5pZCk7XG4gICAgICB0aGlzLmNlbnRlck5vZGUodGFyZ2V0LmlkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUtleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKHRhcmdldC5tYXRjaGVzKFwiaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QsIFtjb250ZW50ZWRpdGFibGU9J3RydWUnXVwiKSkgcmV0dXJuO1xuICAgIGNvbnN0IG1vZCA9IGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQubWV0YUtleTtcbiAgICBjb25zdCBrZXkgPSBldmVudC5rZXkudG9Mb3dlckNhc2UoKTtcblxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcInNcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwiZlwiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5vcGVuU2VhcmNoKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcImRcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuZHVwbGljYXRlU2VsZWN0ZWQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwiY1wiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdm9pZCB0aGlzLmNvcHlTZWxlY3RlZEJyYW5jaCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJ4XCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2b2lkIHRoaXMuY29weVNlbGVjdGVkQnJhbmNoKCkudGhlbigoY29waWVkKSA9PiB7IGlmIChjb3BpZWQpIHRoaXMuZGVsZXRlU2VsZWN0ZWQoKTsgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYgZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLmN5Y2xlVGFzaygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJ6XCIgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy51bmRvKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICgobW9kICYmIGtleSA9PT0gXCJ5XCIpIHx8IChtb2QgJiYgZXZlbnQuc2hpZnRLZXkgJiYga2V5ID09PSBcInpcIikpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnJlZG8oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGV2ZW50LmtleSkge1xuICAgICAgY2FzZSBcIlRhYlwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkVudGVyXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuYWRkU2libGluZygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJEZWxldGVcIjpcbiAgICAgIGNhc2UgXCJCYWNrc3BhY2VcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5kZWxldGVTZWxlY3RlZCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJGMlwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmVkaXRTZWxlY3RlZCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCIgXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMudG9nZ2xlQ29sbGFwc2UoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dMZWZ0XCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMubmF2aWdhdGVTZWxlY3Rpb24oXCJwYXJlbnRcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkFycm93UmlnaHRcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcImNoaWxkXCIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd1VwXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMubmF2aWdhdGVTZWxlY3Rpb24oXCJwcmV2aW91c1wiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dEb3duXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMubmF2aWdhdGVTZWxlY3Rpb24oXCJuZXh0XCIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCIrXCI6XG4gICAgICBjYXNlIFwiPVwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNldFpvb20odGhpcy56b29tICogMS4xNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIi1cIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zZXRab29tKHRoaXMuem9vbSAvIDEuMTUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCIwXCI6XG4gICAgICAgIGlmIChtb2QpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMuZml0VG9WaWV3KCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG4gIHBhcnNlRmVuY2VkQ29kZSxcbiAgcGFyc2VNYXJrZG93blRhYmxlLFxuICB0YWJsZVRvTWFya2Rvd24sXG4gIHR5cGUgTWluZE1hcENvZGVCbG9jayxcbiAgdHlwZSBNaW5kTWFwVGFibGUsXG4gIHR5cGUgVGFibGVBbGlnbm1lbnRcbn0gZnJvbSBcIi4vbW9kZWxcIjtcblxuZnVuY3Rpb24gY2xvbmVUYWJsZSh0YWJsZTogTWluZE1hcFRhYmxlIHwgdW5kZWZpbmVkKTogTWluZE1hcFRhYmxlIHtcbiAgaWYgKCF0YWJsZSkge1xuICAgIHJldHVybiB7XG4gICAgICBoZWFkZXJzOiBbXCJcdTUyMTcgMVwiLCBcIlx1NTIxNyAyXCJdLFxuICAgICAgcm93czogW1tcIlwiLCBcIlwiXSwgW1wiXCIsIFwiXCJdXSxcbiAgICAgIGFsaWdubWVudHM6IFtcImxlZnRcIiwgXCJsZWZ0XCJdLFxuICAgICAgc291cmNlOiBcIm1hbnVhbFwiXG4gICAgfTtcbiAgfVxuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0YWJsZSkpIGFzIE1pbmRNYXBUYWJsZTtcbn1cblxuZXhwb3J0IGNsYXNzIFRhYmxlRWRpdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHRhYmxlOiBNaW5kTWFwVGFibGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3VibWl0OiAodGFibGU6IE1pbmRNYXBUYWJsZSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBncmlkRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBtYXJrZG93bkVsITogSFRNTFRleHRBcmVhRWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgdGFibGU6IE1pbmRNYXBUYWJsZSB8IHVuZGVmaW5lZCwgc3VibWl0OiAodGFibGU6IE1pbmRNYXBUYWJsZSkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy50YWJsZSA9IGNsb25lVGFibGUodGFibGUpO1xuICAgIHRoaXMuc3VibWl0ID0gc3VibWl0O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiXHU2M0QyXHU1MTY1XHU2MjE2XHU3RjE2XHU4RjkxXHU4ODY4XHU2ODNDXCIpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwibW1jLXRhYmxlLW1vZGFsXCIpO1xuXG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgICAgdGV4dDogXCJcdTUzRUZcdTRFRTVcdTc2RjRcdTYzQTVcdTdGMTZcdThGOTFcdTUzNTVcdTUxNDNcdTY4M0NcdUZGMENcdTRFNUZcdTUzRUZcdTRFRTVcdTdDOThcdThEMzQgTWFya2Rvd24gXHU4ODY4XHU2ODNDXHU1NDBFXHU3MEI5XHU1MUZCXHUyMDFDXHU4OUUzXHU2NzkwIE1hcmtkb3duXHUyMDFEXHUzMDAyXCJcbiAgICB9KTtcbiAgICBkZXNjcmlwdGlvbi5zZXRBdHRyKFwiYXJpYS1saXZlXCIsIFwicG9saXRlXCIpO1xuXG4gICAgY29uc3QgdG9vbGJhciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGFibGUtdG9vbGJhclwiIH0pO1xuICAgIGNvbnN0IGFkZFJvdyA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIisgXHU4ODRDXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgcmVtb3ZlUm93ID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHUyMjEyIFx1ODg0Q1wiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IGFkZENvbHVtbiA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIisgXHU1MjE3XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgcmVtb3ZlQ29sdW1uID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHUyMjEyIFx1NTIxN1wiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IHRvTWFya2Rvd24gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTc1MUZcdTYyMTAgTWFya2Rvd25cIiwgdHlwZTogXCJidXR0b25cIiB9KTtcblxuICAgIHRoaXMuZ3JpZEVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YWJsZS1lZGl0b3ItZ3JpZFwiIH0pO1xuICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuXG4gICAgY29uc3QgbWFya2Rvd25MYWJlbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIk1hcmtkb3duIFx1ODg2OFx1NjgzQ1wiIH0pO1xuICAgIHRoaXMubWFya2Rvd25FbCA9IG1hcmtkb3duTGFiZWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICBjbHM6IFwibW1jLXRhYmxlLW1hcmtkb3duXCIsXG4gICAgICBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcInwgXHU1MjE3IDEgfCBcdTUyMTcgMiB8XFxufCAtLS0gfCAtLS0gfFxcbnwgXHU1MTg1XHU1QkI5IHwgXHU1MTg1XHU1QkI5IHxcIiB9XG4gICAgfSk7XG4gICAgdGhpcy5tYXJrZG93bkVsLnJvd3MgPSA4O1xuICAgIHRoaXMubWFya2Rvd25FbC52YWx1ZSA9IHRhYmxlVG9NYXJrZG93bih0aGlzLnRhYmxlKTtcbiAgICBjb25zdCBwYXJzZUJ1dHRvbiA9IG1hcmtkb3duTGFiZWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1ODlFM1x1Njc5MCBNYXJrZG93blwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuXG4gICAgYWRkUm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICB0aGlzLnRhYmxlLnJvd3MucHVzaCh0aGlzLnRhYmxlLmhlYWRlcnMubWFwKCgpID0+IFwiXCIpKTtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgIH0pO1xuICAgIHJlbW92ZVJvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jb2xsZWN0R3JpZCgpO1xuICAgICAgaWYgKHRoaXMudGFibGUucm93cy5sZW5ndGgpIHRoaXMudGFibGUucm93cy5wb3AoKTtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgIH0pO1xuICAgIGFkZENvbHVtbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jb2xsZWN0R3JpZCgpO1xuICAgICAgaWYgKHRoaXMudGFibGUuaGVhZGVycy5sZW5ndGggPj0gMTIpIHsgbmV3IE5vdGljZShcIlx1NjcwMFx1NTkxQVx1NjUyRlx1NjMwMSAxMiBcdTUyMTdcIik7IHJldHVybjsgfVxuICAgICAgdGhpcy50YWJsZS5oZWFkZXJzLnB1c2goYFx1NTIxNyAke3RoaXMudGFibGUuaGVhZGVycy5sZW5ndGggKyAxfWApO1xuICAgICAgdGhpcy50YWJsZS5hbGlnbm1lbnRzID8/PSBbXTtcbiAgICAgIHRoaXMudGFibGUuYWxpZ25tZW50cy5wdXNoKFwibGVmdFwiKTtcbiAgICAgIHRoaXMudGFibGUucm93cy5mb3JFYWNoKChyb3cpID0+IHJvdy5wdXNoKFwiXCIpKTtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgIH0pO1xuICAgIHJlbW92ZUNvbHVtbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jb2xsZWN0R3JpZCgpO1xuICAgICAgaWYgKHRoaXMudGFibGUuaGVhZGVycy5sZW5ndGggPD0gMSkgcmV0dXJuO1xuICAgICAgdGhpcy50YWJsZS5oZWFkZXJzLnBvcCgpO1xuICAgICAgdGhpcy50YWJsZS5hbGlnbm1lbnRzPy5wb3AoKTtcbiAgICAgIHRoaXMudGFibGUucm93cy5mb3JFYWNoKChyb3cpID0+IHJvdy5wb3AoKSk7XG4gICAgICB0aGlzLnJlbmRlckdyaWQoKTtcbiAgICB9KTtcbiAgICB0b01hcmtkb3duLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICB0aGlzLm1hcmtkb3duRWwudmFsdWUgPSB0YWJsZVRvTWFya2Rvd24odGhpcy50YWJsZSk7XG4gICAgfSk7XG4gICAgcGFyc2VCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlTWFya2Rvd25UYWJsZSh0aGlzLm1hcmtkb3duRWwudmFsdWUpO1xuICAgICAgaWYgKCFwYXJzZWQpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlx1NjcyQVx1OEJDNlx1NTIyQlx1NTIzMFx1NjcwOVx1NjU0OFx1NzY4NCBNYXJrZG93biBcdTg4NjhcdTY4M0NcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMudGFibGUgPSBwYXJzZWQ7XG4gICAgICB0aGlzLnJlbmRlckdyaWQoKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJNYXJrZG93biBcdTg4NjhcdTY4M0NcdTVERjJcdTg5RTNcdTY3OTBcIik7XG4gICAgfSk7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1tb2RhbC1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1M0Q2XHU2RDg4XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3Qgc2F2ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NEZERFx1NUI1OFx1ODg2OFx1NjgzQ1wiLCB0eXBlOiBcImJ1dHRvblwiLCBjbHM6IFwibW9kLWN0YVwiIH0pO1xuICAgIGNhbmNlbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5jbG9zZSgpKTtcbiAgICBzYXZlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAoIXRoaXMudGFibGUuaGVhZGVycy5zb21lKChoZWFkZXIpID0+IGhlYWRlci50cmltKCkpKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJcdTgxRjNcdTVDMTFcdTk3MDBcdTg5ODFcdTRFMDBcdTRFMkFcdTg4NjhcdTU5MzRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMudGFibGUuc291cmNlID0gdGhpcy50YWJsZS5zb3VyY2UgPz8gXCJtYW51YWxcIjtcbiAgICAgIHRoaXMuc3VibWl0KHRoaXMudGFibGUpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJHcmlkKCk6IHZvaWQge1xuICAgIHRoaXMuZ3JpZEVsLmVtcHR5KCk7XG4gICAgY29uc3QgdGFibGUgPSB0aGlzLmdyaWRFbC5jcmVhdGVFbChcInRhYmxlXCIpO1xuICAgIGNvbnN0IGhlYWQgPSB0YWJsZS5jcmVhdGVFbChcInRoZWFkXCIpLmNyZWF0ZUVsKFwidHJcIik7XG4gICAgdGhpcy50YWJsZS5oZWFkZXJzLmZvckVhY2goKGhlYWRlciwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHRoID0gaGVhZC5jcmVhdGVFbChcInRoXCIpO1xuICAgICAgY29uc3QgaW5wdXQgPSB0aC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgXCJkYXRhLWtpbmRcIjogXCJoZWFkZXJcIiwgXCJkYXRhLWNvbHVtblwiOiBTdHJpbmcoaW5kZXgpIH0gfSk7XG4gICAgICBpbnB1dC52YWx1ZSA9IGhlYWRlcjtcbiAgICAgIGNvbnN0IGFsaWduID0gdGguY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBhdHRyOiB7IFwiZGF0YS1raW5kXCI6IFwiYWxpZ25tZW50XCIsIFwiZGF0YS1jb2x1bW5cIjogU3RyaW5nKGluZGV4KSwgXCJhcmlhLWxhYmVsXCI6IGBcdTdCMkMgJHtpbmRleCArIDF9IFx1NTIxN1x1NUJGOVx1OUY1MFx1NjVCOVx1NUYwRmAgfSB9KTtcbiAgICAgIChbWydsZWZ0JywgJ1x1NURFNiddLCBbJ2NlbnRlcicsICdcdTRFMkQnXSwgWydyaWdodCcsICdcdTUzRjMnXV0gYXMgQXJyYXk8W1RhYmxlQWxpZ25tZW50LCBzdHJpbmddPikuZm9yRWFjaCgoW3ZhbHVlLCBsYWJlbF0pID0+IGFsaWduLmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KSk7XG4gICAgICBhbGlnbi52YWx1ZSA9IHRoaXMudGFibGUuYWxpZ25tZW50cz8uW2luZGV4XSA/PyBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCBib2R5ID0gdGFibGUuY3JlYXRlRWwoXCJ0Ym9keVwiKTtcbiAgICB0aGlzLnRhYmxlLnJvd3MuZm9yRWFjaCgocm93LCByb3dJbmRleCkgPT4ge1xuICAgICAgY29uc3QgdHIgPSBib2R5LmNyZWF0ZUVsKFwidHJcIik7XG4gICAgICB0aGlzLnRhYmxlLmhlYWRlcnMuZm9yRWFjaCgoXywgY29sdW1uSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgdGQgPSB0ci5jcmVhdGVFbChcInRkXCIpO1xuICAgICAgICBjb25zdCBpbnB1dCA9IHRkLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBhdHRyOiB7IFwiZGF0YS1raW5kXCI6IFwiY2VsbFwiLCBcImRhdGEtcm93XCI6IFN0cmluZyhyb3dJbmRleCksIFwiZGF0YS1jb2x1bW5cIjogU3RyaW5nKGNvbHVtbkluZGV4KSB9IH0pO1xuICAgICAgICBpbnB1dC5yb3dzID0gMjtcbiAgICAgICAgaW5wdXQudmFsdWUgPSByb3dbY29sdW1uSW5kZXhdID8/IFwiXCI7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY29sbGVjdEdyaWQoKTogdm9pZCB7XG4gICAgY29uc3QgaGVhZGVycyA9IEFycmF5LmZyb20odGhpcy5ncmlkRWwucXVlcnlTZWxlY3RvckFsbDxIVE1MSW5wdXRFbGVtZW50PignaW5wdXRbZGF0YS1raW5kPVwiaGVhZGVyXCJdJykpO1xuICAgIGhlYWRlcnMuZm9yRWFjaCgoaW5wdXQpID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IE51bWJlcihpbnB1dC5kYXRhc2V0LmNvbHVtbik7XG4gICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihjb2x1bW4pKSB0aGlzLnRhYmxlLmhlYWRlcnNbY29sdW1uXSA9IGlucHV0LnZhbHVlLnRyaW0oKS5zbGljZSgwLCAyMDAwKTtcbiAgICB9KTtcbiAgICBjb25zdCBhbGlnbm1lbnRzID0gQXJyYXkuZnJvbSh0aGlzLmdyaWRFbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxTZWxlY3RFbGVtZW50Pignc2VsZWN0W2RhdGEta2luZD1cImFsaWdubWVudFwiXScpKTtcbiAgICB0aGlzLnRhYmxlLmFsaWdubWVudHMgPSB0aGlzLnRhYmxlLmhlYWRlcnMubWFwKCgpID0+IFwibGVmdFwiKTtcbiAgICBhbGlnbm1lbnRzLmZvckVhY2goKGlucHV0KSA9PiB7XG4gICAgICBjb25zdCBjb2x1bW4gPSBOdW1iZXIoaW5wdXQuZGF0YXNldC5jb2x1bW4pO1xuICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoY29sdW1uKSkgdGhpcy50YWJsZS5hbGlnbm1lbnRzIVtjb2x1bW5dID0gaW5wdXQudmFsdWUgPT09IFwiY2VudGVyXCIgfHwgaW5wdXQudmFsdWUgPT09IFwicmlnaHRcIiA/IGlucHV0LnZhbHVlIDogXCJsZWZ0XCI7XG4gICAgfSk7XG4gICAgY29uc3QgY2VsbHMgPSBBcnJheS5mcm9tKHRoaXMuZ3JpZEVsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhW2RhdGEta2luZD1cImNlbGxcIl0nKSk7XG4gICAgY2VsbHMuZm9yRWFjaCgoaW5wdXQpID0+IHtcbiAgICAgIGNvbnN0IHJvdyA9IE51bWJlcihpbnB1dC5kYXRhc2V0LnJvdyk7XG4gICAgICBjb25zdCBjb2x1bW4gPSBOdW1iZXIoaW5wdXQuZGF0YXNldC5jb2x1bW4pO1xuICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIocm93KSAmJiBOdW1iZXIuaXNJbnRlZ2VyKGNvbHVtbikgJiYgdGhpcy50YWJsZS5yb3dzW3Jvd10pIHRoaXMudGFibGUucm93c1tyb3ddIVtjb2x1bW5dID0gaW5wdXQudmFsdWUuc2xpY2UoMCwgMjAwMCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvZGVFZGl0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYmxvY2s6IE1pbmRNYXBDb2RlQmxvY2sgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3VibWl0OiAoYmxvY2s6IE1pbmRNYXBDb2RlQmxvY2spID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGJsb2NrOiBNaW5kTWFwQ29kZUJsb2NrIHwgdW5kZWZpbmVkLCBzdWJtaXQ6IChibG9jazogTWluZE1hcENvZGVCbG9jaykgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5ibG9jayA9IGJsb2NrO1xuICAgIHRoaXMuc3VibWl0ID0gc3VibWl0O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiXHU2M0QyXHU1MTY1XHU2MjE2XHU3RjE2XHU4RjkxXHU0RUUzXHU3ODAxXCIpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwibW1jLWNvZGUtbW9kYWxcIik7XG4gICAgY29uc3QgbGFuZ3VhZ2VMYWJlbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NEVFM1x1NzgwMVx1OEJFRFx1OEEwMFwiIH0pO1xuICAgIGNvbnN0IGxhbmd1YWdlSW5wdXQgPSBsYW5ndWFnZUxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJqYXZhc2NyaXB0XHUzMDAxcHl0aG9uXHUzMDAxY3NzXHUyMDI2XCIgfSB9KTtcbiAgICBsYW5ndWFnZUlucHV0LnZhbHVlID0gdGhpcy5ibG9jaz8ubGFuZ3VhZ2UgPz8gXCJcIjtcblxuICAgIGNvbnN0IGNvZGVMYWJlbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NEVFM1x1NzgwMVx1NTE4NVx1NUJCOVwiIH0pO1xuICAgIGNvbnN0IGNvZGVJbnB1dCA9IGNvZGVMYWJlbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHsgY2xzOiBcIm1tYy1jb2RlLXRleHRhcmVhXCIsIGF0dHI6IHsgc3BlbGxjaGVjazogXCJmYWxzZVwiLCBwbGFjZWhvbGRlcjogXCJcdTUzRUZcdTc2RjRcdTYzQTVcdTdDOThcdThEMzRcdTRFRTNcdTc4MDFcdUZGMENcdTYyMTZcdTdDOThcdThEMzQgYGBgXHU4QkVEXHU4QTAwIC4uLiBgYGAgZmVuY2VkIGNvZGUgYmxvY2tcIiB9IH0pO1xuICAgIGNvZGVJbnB1dC5yb3dzID0gMTg7XG4gICAgY29kZUlucHV0LnZhbHVlID0gdGhpcy5ibG9jaz8uY29kZSA/PyBcIlwiO1xuXG4gICAgY29uc3QgZGV0ZWN0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1OEJDNlx1NTIyQiBmZW5jZWQgY29kZVwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGRldGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VGZW5jZWRDb2RlKGNvZGVJbnB1dC52YWx1ZSk7XG4gICAgICBpZiAoIXBhcnNlZCkgeyBuZXcgTm90aWNlKFwiXHU2Q0ExXHU2NzA5XHU4QkM2XHU1MjJCXHU1MjMwXHU1QjhDXHU2NTc0XHU3Njg0IGBgYCBmZW5jZWQgY29kZSBibG9ja1wiKTsgcmV0dXJuOyB9XG4gICAgICBsYW5ndWFnZUlucHV0LnZhbHVlID0gcGFyc2VkLmxhbmd1YWdlID8/IFwiXCI7XG4gICAgICBjb2RlSW5wdXQudmFsdWUgPSBwYXJzZWQuY29kZTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTRFRTNcdTc4MDFcdThCRURcdThBMDBcdTU0OENcdTUxODVcdTVCQjlcdTVERjJcdThCQzZcdTUyMkJcIik7XG4gICAgfSk7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1tb2RhbC1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1M0Q2XHU2RDg4XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3Qgc2F2ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NEZERFx1NUI1OFx1NEVFM1x1NzgwMVwiLCB0eXBlOiBcImJ1dHRvblwiLCBjbHM6IFwibW9kLWN0YVwiIH0pO1xuICAgIGNhbmNlbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5jbG9zZSgpKTtcbiAgICBzYXZlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBsZXQgbGFuZ3VhZ2UgPSBsYW5ndWFnZUlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgIGxldCBjb2RlID0gY29kZUlucHV0LnZhbHVlO1xuICAgICAgY29uc3QgZmVuY2VkID0gcGFyc2VGZW5jZWRDb2RlKGNvZGUpO1xuICAgICAgaWYgKGZlbmNlZCkge1xuICAgICAgICBsYW5ndWFnZSA9IGZlbmNlZC5sYW5ndWFnZSA/PyBsYW5ndWFnZTtcbiAgICAgICAgY29kZSA9IGZlbmNlZC5jb2RlO1xuICAgICAgfVxuICAgICAgaWYgKCFjb2RlLnRyaW0oKSkgeyBuZXcgTm90aWNlKFwiXHU0RUUzXHU3ODAxXHU1MTg1XHU1QkI5XHU0RTBEXHU4MEZEXHU0RTNBXHU3QTdBXCIpOyByZXR1cm47IH1cbiAgICAgIHRoaXMuc3VibWl0KHsgbGFuZ3VhZ2U6IGxhbmd1YWdlLnJlcGxhY2UoL1teYS16MC05XysjLi1dL2dpLCBcIlwiKS5zbGljZSgwLCA0MCkgfHwgdW5kZWZpbmVkLCBjb2RlIH0pO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7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UTtBQUMxQixVQUFJLE1BQU0sUUFBUSxpQkFBaUIsT0FBUTtBQUMzQyxZQUFNLGFBQVksaUJBQU0sYUFBYSxLQUFLLE1BQXhCLFlBQTZCLE1BQU0sUUFBUSxRQUEzQyxZQUFrRDtBQUNwRSxZQUFNLFlBQVcsMkJBQVUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxNQUF0QixtQkFBeUIsTUFBTSxLQUFLLE9BQXBDLG1CQUF3QyxXQUF4QyxZQUFrRDtBQUNuRSxVQUFJLENBQUMsU0FBUyxZQUFZLEVBQUUsU0FBUyxJQUFJLGlCQUFpQixFQUFFLEVBQUc7QUFDL0QsWUFBTSxPQUFPLEtBQUssSUFBSSxjQUFjLHFCQUFxQixVQUFVLFFBQVEsVUFBVTtBQUNyRixVQUFJLEVBQUUsZ0JBQWdCLDJCQUFVLENBQUMsS0FBSyxjQUFjLElBQUksRUFBRztBQUMzRCxZQUFNLFFBQVEsZUFBZTtBQUM3QixVQUFJO0FBQ0YsY0FBTSxTQUFTLE1BQU0sS0FBSyxJQUFJLE1BQU0sV0FBVyxJQUFJO0FBQ25ELGNBQU1BLFlBQVcsY0FBYyxRQUFRLEtBQUssUUFBUTtBQUNwRCw0QkFBb0IsT0FBT0EsV0FBVSxFQUFFLEtBQUssS0FBSyxLQUFLLE1BQU0sV0FBVyxLQUFLLFNBQVMsZ0JBQWdCLG1CQUFtQixxQkFBcUIsS0FBSyxRQUFRLEVBQUUsQ0FBQztBQUFBLE1BQy9KLFNBQVMsT0FBTztBQUNkLGdCQUFRLE1BQU0sc0NBQXNDLEtBQUs7QUFDekQsY0FBTSxNQUFNO0FBQ1osY0FBTSxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSwrREFBYSxDQUFDO0FBQUEsTUFDaEU7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAidGV4dCIsICJfYSIsICJfYiIsICJfYSIsICJfYiIsICJfYyIsICJfZCIsICJiYWNrZ3JvdW5kIiwgImRvY3VtZW50IiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9hIiwgIl9iIiwgImRvY3VtZW50IiwgIl9jIiwgInNlbGVjdGVkIiwgImRvY3VtZW50IiwgIl9hIiwgIl9iIiwgIl9jIiwgImRvY3VtZW50Il0KfQo=
