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
        uploadedAt: typeof item.uploadedAt === "string" && item.uploadedAt.trim() ? item.uploadedAt.trim().slice(0, 80) : void 0,
        lastSuccessAt: typeof item.lastSuccessAt === "string" && item.lastSuccessAt.trim() ? item.lastSuccessAt.trim().slice(0, 80) : void 0,
        lastFailureAt: typeof item.lastFailureAt === "string" && item.lastFailureAt.trim() ? item.lastFailureAt.trim().slice(0, 80) : void 0,
        failureCount: typeof item.failureCount === "number" && Number.isFinite(item.failureCount) ? Math.max(0, Math.min(1e6, Math.floor(item.failureCount))) : void 0
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
function imageSourceCandidates(block, includeLocal = true) {
  var _a, _b;
  const candidates = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (candidate) => {
    const source = candidate.source.trim();
    if (!source || seen.has(source)) return;
    seen.add(source);
    candidates.push({ ...candidate, source });
  };
  const currentRemote = (_a = block.remoteSources) == null ? void 0 : _a.find((item) => item.url === block.source);
  add({
    source: block.source,
    label: (currentRemote == null ? void 0 : currentRemote.hostName) || (currentRemote ? "\u5F53\u524D\u56FE\u5E8A" : "\u5F53\u524D\u56FE\u7247"),
    hostId: currentRemote == null ? void 0 : currentRemote.hostId,
    hostName: currentRemote == null ? void 0 : currentRemote.hostName,
    kind: "current"
  });
  const remotes = (_b = block.remoteSources) != null ? _b : [];
  const currentIndex = remotes.findIndex((item) => item.url === block.source);
  const orderedRemotes = currentIndex >= 0 ? [...remotes.slice(currentIndex + 1), ...remotes.slice(0, currentIndex)] : remotes;
  for (const remote of orderedRemotes) {
    add({
      source: remote.url,
      label: remote.hostName || "\u5907\u7528\u56FE\u5E8A",
      hostId: remote.hostId,
      hostName: remote.hostName,
      kind: "remote"
    });
  }
  if (includeLocal && block.localSource) {
    add({ source: block.localSource, label: "\u672C\u5730\u526F\u672C", kind: "local" });
  }
  return candidates;
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
  deleteLocalAfterUpload: true,
  imageFailoverEnabled: true,
  imageFailoverTimeoutSeconds: 8,
  imageFailoverUseLocalFallback: true
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
    new import_obsidian.Setting(containerEl).setName("\u8FDC\u7A0B\u56FE\u7247\u81EA\u52A8\u6545\u969C\u8F6C\u79FB").setDesc("\u5F53\u524D\u56FE\u5E8A\u5730\u5740\u52A0\u8F7D\u5931\u8D25\u6216\u8D85\u65F6\u540E\uFF0C\u6309\u955C\u50CF\u987A\u5E8F\u5C1D\u8BD5\u4E0B\u4E00\u5730\u5740\uFF1B\u6210\u529F\u540E\u81EA\u52A8\u5C06\u53EF\u7528\u5730\u5740\u4FDD\u5B58\u4E3A\u65B0\u7684\u4E3B\u5730\u5740\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.imageFailoverEnabled).onChange(async (value) => {
      this.plugin.settings.imageFailoverEnabled = value;
      await this.plugin.saveSettings();
      this.display();
    }));
    if (this.plugin.settings.imageFailoverEnabled) {
      new import_obsidian.Setting(containerEl).setName("\u5355\u4E2A\u955C\u50CF\u7B49\u5F85\u65F6\u95F4").setDesc("\u56FE\u7247\u5728\u8BE5\u65F6\u95F4\u5185\u672A\u6210\u529F\u52A0\u8F7D\uFF0C\u5C31\u5C1D\u8BD5\u4E0B\u4E00\u4E2A\u955C\u50CF\u3002\u8303\u56F4 2\u201330 \u79D2\u3002").addSlider((slider) => slider.setLimits(2, 30, 1).setDynamicTooltip().setValue(this.plugin.settings.imageFailoverTimeoutSeconds).onChange(async (value) => {
        this.plugin.settings.imageFailoverTimeoutSeconds = value;
        await this.plugin.saveSettings();
      }));
      new import_obsidian.Setting(containerEl).setName("\u672C\u5730\u526F\u672C\u4F5C\u4E3A\u6700\u540E\u56DE\u9000").setDesc("\u8FDC\u7A0B\u955C\u50CF\u5168\u90E8\u5931\u6548\u65F6\uFF0C\u5982\u679C\u672C\u5730\u56FE\u7247\u4ECD\u5B58\u5728\uFF0C\u5219\u6700\u540E\u5C1D\u8BD5\u672C\u5730\u526F\u672C\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.imageFailoverUseLocalFallback).onChange(async (value) => {
        this.plugin.settings.imageFailoverUseLocalFallback = value;
        await this.plugin.saveSettings();
      }));
    }
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
    this.imageLoadTimers = /* @__PURE__ */ new Set();
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
    this.clearImageLoadTimers();
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
  clearImageLoadTimers() {
    for (const timer of this.imageLoadTimers) window.clearTimeout(timer);
    this.imageLoadTimers.clear();
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
    this.clearImageLoadTimers();
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
          const wrap = content.createDiv({ cls: "mmc-node-image-block" });
          const image = wrap.createEl("img", { cls: "mmc-node-image is-loading", attr: { alt: (_u = block.alt) != null ? _u : nodePlainText(node) || "\u56FE\u7247" } });
          const candidates = this.options.imageFailoverEnabled ? imageSourceCandidates(block, this.options.imageFailoverUseLocalFallback) : imageSourceCandidates(block, false).slice(0, 1);
          let activeResolved = null;
          let attemptToken = 0;
          let attemptTimer = null;
          const clearAttemptTimer = () => {
            if (attemptTimer === null) return;
            window.clearTimeout(attemptTimer);
            this.imageLoadTimers.delete(attemptTimer);
            attemptTimer = null;
          };
          const markRemoteFailure = (source) => {
            var _a2, _b2;
            const remote = (_a2 = block.remoteSources) == null ? void 0 : _a2.find((item) => item.url === source);
            if (!remote) return;
            remote.lastFailureAt = (/* @__PURE__ */ new Date()).toISOString();
            remote.failureCount = Math.min(1e6, ((_b2 = remote.failureCount) != null ? _b2 : 0) + 1);
          };
          const tryCandidate = (index) => {
            clearAttemptTimer();
            const candidate = candidates[index];
            attemptToken += 1;
            const token = attemptToken;
            if (!candidate) {
              activeResolved = null;
              image.removeAttribute("src");
              image.removeClass("is-loading");
              image.addClass("is-unresolved");
              image.setAttr("title", "\u6240\u6709\u56FE\u7247\u955C\u50CF\u5747\u4E0D\u53EF\u7528");
              this.callbacks.onChange(this.getDocument());
              this.markSaving();
              return;
            }
            const resolved = this.callbacks.resolveImage(candidate.source);
            if (!resolved) {
              markRemoteFailure(candidate.source);
              tryCandidate(index + 1);
              return;
            }
            const probe = new Image();
            const fail = () => {
              if (token !== attemptToken) return;
              clearAttemptTimer();
              markRemoteFailure(candidate.source);
              if (this.options.imageFailoverEnabled) tryCandidate(index + 1);
              else {
                image.removeClass("is-loading");
                image.addClass("is-unresolved");
                image.setAttr("title", `\u56FE\u7247\u52A0\u8F7D\u5931\u8D25\uFF1A${candidate.source}`);
              }
            };
            probe.onload = () => {
              var _a2, _b2;
              if (token !== attemptToken || probe.naturalWidth <= 0) return;
              clearAttemptTimer();
              activeResolved = resolved;
              image.src = resolved;
              image.removeClass("is-loading");
              image.removeClass("is-unresolved");
              image.setAttr("title", index === 0 ? "\u70B9\u51FB\u653E\u5927\u56FE\u7247" : `\u5DF2\u81EA\u52A8\u5207\u6362\u5230\uFF1A${candidate.label}`);
              const switched = candidate.source !== block.source;
              const remote = (_a2 = block.remoteSources) == null ? void 0 : _a2.find((item) => item.url === candidate.source);
              if (remote) remote.lastSuccessAt = (/* @__PURE__ */ new Date()).toISOString();
              if (!switched) return;
              const previous = (_b2 = block.remoteSources) == null ? void 0 : _b2.find((item) => item.url === block.source);
              block.source = candidate.source;
              syncNodeLegacyFields(node);
              this.callbacks.onChange(this.getDocument());
              this.markSaving();
              const previousLabel = (previous == null ? void 0 : previous.hostName) || "\u5F53\u524D\u56FE\u5E8A";
              new import_obsidian3.Notice(`\u56FE\u7247\u5730\u5740\u5931\u6548\uFF0C\u5DF2\u4ECE ${previousLabel} \u81EA\u52A8\u5207\u6362\u5230 ${candidate.label}`, 6e3);
            };
            probe.onerror = fail;
            const timeoutMs = Math.max(2, Math.min(30, this.options.imageFailoverTimeoutSeconds)) * 1e3;
            attemptTimer = window.setTimeout(fail, timeoutMs);
            this.imageLoadTimers.add(attemptTimer);
            probe.src = resolved;
          };
          image.addEventListener("click", (event) => {
            var _a2;
            event.stopPropagation();
            if (activeResolved) new ImagePreviewModal(this.app, activeResolved, (_a2 = block.alt) != null ? _a2 : "\u56FE\u7247\u9884\u89C8").open();
          });
          tryCandidate(0);
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
      historyLimit: this.plugin.settings.historyLimit,
      imageFailoverEnabled: this.plugin.settings.imageFailoverEnabled,
      imageFailoverTimeoutSeconds: this.plugin.settings.imageFailoverTimeoutSeconds,
      imageFailoverUseLocalFallback: this.plugin.settings.imageFailoverUseLocalFallback
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
      deleteLocalAfterUpload: raw.deleteLocalAfterUpload !== false,
      imageFailoverEnabled: raw.imageFailoverEnabled !== false,
      imageFailoverTimeoutSeconds: typeof raw.imageFailoverTimeoutSeconds === "number" ? Math.max(2, Math.min(30, Math.round(raw.imageFailoverTimeoutSeconds))) : DEFAULT_SETTINGS.imageFailoverTimeoutSeconds,
      imageFailoverUseLocalFallback: raw.imageFailoverUseLocalFallback !== false
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL21vZGVsLnRzIiwgInNyYy9zZXR0aW5ncy50cyIsICJzcmMvbGF5b3V0LnRzIiwgInNyYy9zdGF0aWMtcmVuZGVyLnRzIiwgInNyYy92aWV3LnRzIiwgInNyYy9lZGl0b3IudHMiLCAic3JjL2NvbnRlbnQtbW9kYWxzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xuICBNZW51LFxuICBOb3RpY2UsXG4gIFBsdWdpbixcbiAgVEZpbGUsXG4gIFRGb2xkZXIsXG4gIG5vcm1hbGl6ZVBhdGgsXG4gIHJlcXVlc3RVcmwsXG4gIHR5cGUgTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCxcbiAgdHlwZSBXb3Jrc3BhY2VMZWFmXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgY3JlYXRlRGVmYXVsdERvY3VtZW50LFxuICBmaW5kTm9kZSxcbiAgZmxhdHRlbk5vZGVzLFxuICBtYXJrZG93blRvRG9jdW1lbnQsXG4gIG5vZGVDb250ZW50QmxvY2tzLFxuICBub2RlUGxhaW5UZXh0LFxuICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyxcbiAgcGFyc2VEb2N1bWVudCxcbiAgc2VyaWFsaXplRG9jdW1lbnQsXG4gIHR5cGUgTWluZE1hcERvY3VtZW50LFxuICB0eXBlIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayxcbiAgdHlwZSBNaW5kTWFwTm9kZSxcbiAgdHlwZSBNaW5kTWFwU3VibWFwXG59IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1xuICBERUZBVUxUX1NFVFRJTkdTLFxuICBNaW5kTWFwU3R1ZGlvU2V0dGluZ1RhYixcbiAgY3JlYXRlSW1hZ2VIb3N0Q29uZmlnLFxuICBzZXR0aW5nc1RvQXBwZWFyYW5jZSxcbiAgdHlwZSBJbWFnZUhvc3RDaG9pY2UsXG4gIHR5cGUgSW1hZ2VIb3N0Q29uZmlnLFxuICB0eXBlIEltYWdlSG9zdFVwbG9hZEJhdGNoLFxuICB0eXBlIEltYWdlSG9zdFVwbG9hZFN1Y2Nlc3MsXG4gIHR5cGUgTWluZE1hcFN0dWRpb1NldHRpbmdzXG59IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyByZW5kZXJTdGF0aWNNaW5kTWFwLCByZW5kZXJTdGF0aWNTb3VyY2UgfSBmcm9tIFwiLi9zdGF0aWMtcmVuZGVyXCI7XG5pbXBvcnQgeyBNaW5kTWFwU3R1ZGlvVmlldywgVklFV19UWVBFX01JTkRNQVBfU1RVRElPIH0gZnJvbSBcIi4vdmlld1wiO1xuXG5leHBvcnQgY29uc3QgTUlORE1BUF9FWFRFTlNJT04gPSBcIm1pbmRtYXBcIjtcbmNvbnN0IExFR0FDWV9TVUZGSVggPSBcIi5zbW0ubWRcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWluZE1hcFN0dWRpb1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBNaW5kTWFwU3R1ZGlvU2V0dGluZ3MgPSBERUZBVUxUX1NFVFRJTkdTO1xuICBwcml2YXRlIGxlZ2FjeU1pZ3JhdGlvblBhdGg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IGF1dG9VcGxvYWRUaW1lcnMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFX01JTkRNQVBfU1RVRElPLCAobGVhZikgPT4gbmV3IE1pbmRNYXBTdHVkaW9WaWV3KGxlYWYsIHRoaXMpKTtcbiAgICAvLyBBIGRlZGljYXRlZCBleHRlbnNpb24gaXMgdGhlIGtleSB0byByZWxpYWJsZSByZW9wZW5pbmc6IE9ic2lkaWFuIHJvdXRlcyBldmVyeVxuICAgIC8vIC5taW5kbWFwIGZpbGUgZGlyZWN0bHkgdG8gdGhlIGVkaXRhYmxlIFRleHRGaWxlVmlldyBpbnN0ZWFkIG9mIE1hcmtkb3duIHZpZXcuXG4gICAgdGhpcy5yZWdpc3RlckV4dGVuc2lvbnMoW01JTkRNQVBfRVhURU5TSU9OXSwgVklFV19UWVBFX01JTkRNQVBfU1RVRElPKTtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IE1pbmRNYXBTdHVkaW9TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJicmFpbi1jaXJjdWl0XCIsIFwiXHU2NUIwXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIsICgpID0+IHZvaWQgdGhpcy5jcmVhdGVNaW5kTWFwKCkpO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5ldy1taW5kLW1hcFwiLFxuICAgICAgbmFtZTogXCJcdTY1QjBcdTVFRkFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMuY3JlYXRlTWluZE1hcCgpXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5ldy1taW5kLW1hcC1hbmQtZW1iZWRcIixcbiAgICAgIG5hbWU6IFwiXHU2NUIwXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU1RTc2XHU2M0QyXHU1MTY1XHU1RjUzXHU1MjREXHU3QjE0XHU4QkIwXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU1pbmRNYXAoeyBpbnNlcnRJbnRvQ3VycmVudDogdHJ1ZSB9KVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjb252ZXJ0LWN1cnJlbnQtbWFya2Rvd25cIixcbiAgICAgIG5hbWU6IFwiXHU1QzA2XHU1RjUzXHU1MjREIE1hcmtkb3duIFx1OEY2Q1x1NjM2Mlx1NEUzQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBCb29sZWFuKGZpbGUgJiYgZmlsZS5leHRlbnNpb24gPT09IFwibWRcIiAmJiAhdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKTtcbiAgICAgICAgaWYgKCFjaGVja2luZyAmJiBhdmFpbGFibGUgJiYgZmlsZSkgdm9pZCB0aGlzLmNvbnZlcnRNYXJrZG93bkZpbGUoZmlsZSk7XG4gICAgICAgIHJldHVybiBhdmFpbGFibGU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm1pZ3JhdGUtbGVnYWN5LW1pbmQtbWFwXCIsXG4gICAgICBuYW1lOiBcIlx1NUMwNlx1NUY1M1x1NTI0RFx1NjVFN1x1NzI0OFx1ODExMVx1NTZGRVx1OEY2Q1x1NjM2Mlx1NEUzQSAubWluZG1hcFwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBCb29sZWFuKGZpbGUgJiYgdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKTtcbiAgICAgICAgaWYgKCFjaGVja2luZyAmJiBhdmFpbGFibGUgJiYgZmlsZSkgdm9pZCB0aGlzLm1pZ3JhdGVMZWdhY3lGaWxlKGZpbGUsIHRydWUpO1xuICAgICAgICByZXR1cm4gYXZhaWxhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLWN1cnJlbnQtYXMtbWluZC1tYXBcIixcbiAgICAgIG5hbWU6IFwiXHU0RUU1XHU1M0VGXHU3RjE2XHU4RjkxXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU4OUM2XHU1NkZFXHU5MUNEXHU2NUIwXHU2MjUzXHU1RjAwXCIsXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IEJvb2xlYW4oZmlsZSAmJiB0aGlzLmlzTWluZE1hcEZpbGUoZmlsZSkpO1xuICAgICAgICBpZiAoIWNoZWNraW5nICYmIGF2YWlsYWJsZSAmJiBmaWxlKSB2b2lkIHRoaXMub3BlbkFzTWluZE1hcChmaWxlLCB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZiA/PyB1bmRlZmluZWQpO1xuICAgICAgICByZXR1cm4gYXZhaWxhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtbWVudVwiLCAobWVudTogTWVudSwgZmlsZSkgPT4ge1xuICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbVxuICAgICAgICAgIC5zZXRUaXRsZShcIlx1NjVCMFx1NUVGQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKVxuICAgICAgICAgIC5zZXRJY29uKFwiYnJhaW4tY2lyY3VpdFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5jcmVhdGVNaW5kTWFwKHsgZm9sZGVyOiBmaWxlLnBhdGggfSkpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuO1xuXG4gICAgICBpZiAodGhpcy5pc01pbmRNYXBGaWxlKGZpbGUpKSB7XG4gICAgICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbVxuICAgICAgICAgIC5zZXRUaXRsZShcIlx1NEVFNVx1NTNFRlx1N0YxNlx1OEY5MVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVx1NjI1M1x1NUYwMFwiKVxuICAgICAgICAgIC5zZXRJY29uKFwiYnJhaW4tY2lyY3VpdFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5vcGVuQXNNaW5kTWFwKGZpbGUpKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNMZWdhY3lNaW5kTWFwRmlsZShmaWxlKSkge1xuICAgICAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW1cbiAgICAgICAgICAuc2V0VGl0bGUoXCJcdThGNkNcdTYzNjJcdTRFM0FcdTY1QjBcdTc2ODQgLm1pbmRtYXAgXHU2NTg3XHU0RUY2XCIpXG4gICAgICAgICAgLnNldEljb24oXCJyZXBsYWNlXCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLm1pZ3JhdGVMZWdhY3lGaWxlKGZpbGUsIHRydWUpKSk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgLy8gRXhpc3RpbmcgdXNlcnMgbWF5IHN0aWxsIGhhdmUgdGhlIG9sZCBNYXJrZG93bi1iYWNrZWQgZmlsZXMuIFdoZW4gZW5hYmxlZCxcbiAgICAvLyBvcGVuaW5nIG9uZSBjcmVhdGVzL29wZW5zIGEgc2FmZSAubWluZG1hcCBjb3B5IGFuZCBsZWF2ZXMgdGhlIG9yaWdpbmFsIGludGFjdC5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsIChmaWxlKSA9PiB7XG4gICAgICBpZiAoIWZpbGUgfHwgIXRoaXMuc2V0dGluZ3MucmVkaXJlY3RMZWdhY3lGaWxlcyB8fCAhdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5sZWdhY3lNaWdyYXRpb25QYXRoID09PSBmaWxlLnBhdGgpIHJldHVybjtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHZvaWQgdGhpcy5taWdyYXRlTGVnYWN5RmlsZShmaWxlLCB0cnVlKSwgMCk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFwibWluZG1hcFwiLCAoc291cmNlLCBlbCwgY3R4KSA9PiB7XG4gICAgICByZW5kZXJTdGF0aWNTb3VyY2UoZWwsIHNvdXJjZSwgdGhpcy5nZXRTb3VyY2VUaXRsZShjdHgpLCBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSk7XG4gICAgfSk7XG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFwibWluZG1hcC1qc29uXCIsIChzb3VyY2UsIGVsLCBjdHgpID0+IHtcbiAgICAgIHJlbmRlclN0YXRpY1NvdXJjZShlbCwgc291cmNlLCB0aGlzLmdldFNvdXJjZVRpdGxlKGN0eCksIHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpKTtcbiAgICB9KTtcbiAgICAvLyBSZWFkLW9ubHkgY29tcGF0aWJpbGl0eSBmb3Igbm90ZXMgdGhhdCBhbHJlYWR5IGNvbnRhaW4gb2xkIGZlbmNlZCBibG9ja3MuXG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFwic21tXCIsIChzb3VyY2UsIGVsLCBjdHgpID0+IHtcbiAgICAgIHJlbmRlclN0YXRpY1NvdXJjZShlbCwgc291cmNlLCB0aGlzLmdldFNvdXJjZVRpdGxlKGN0eCksIHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpKTtcbiAgICB9KTtcbiAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Db2RlQmxvY2tQcm9jZXNzb3IoXCJzbW0tanNvblwiLCAoc291cmNlLCBlbCwgY3R4KSA9PiB7XG4gICAgICByZW5kZXJTdGF0aWNTb3VyY2UoZWwsIHNvdXJjZSwgdGhpcy5nZXRTb3VyY2VUaXRsZShjdHgpLCBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSk7XG4gICAgfSk7XG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duUG9zdFByb2Nlc3NvcigoZWxlbWVudCwgY29udGV4dCkgPT4gdm9pZCB0aGlzLnByb2Nlc3NNaW5kTWFwRW1iZWRzKGVsZW1lbnQsIGNvbnRleHQpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdGltZXIgb2YgdGhpcy5hdXRvVXBsb2FkVGltZXJzLnZhbHVlcygpKSB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aGlzLmF1dG9VcGxvYWRUaW1lcnMuY2xlYXIoKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKSBhcyBQYXJ0aWFsPE1pbmRNYXBTdHVkaW9TZXR0aW5ncz4gfCBudWxsO1xuICAgIC8vIE9uZS10aW1lIG1pZ3JhdGlvbiBhZnRlciB0aGUgcHVibGljIHJlbmFtZSBmcm9tIG1pbmRtYXAtY2FudmFzIHRvIG1pbmRtYXAtc3R1ZGlvLlxuICAgIGlmICghbG9hZGVkKSB7XG4gICAgICBjb25zdCBvbGREYXRhUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5hcHAudmF1bHQuY29uZmlnRGlyfS9wbHVnaW5zL21pbmRtYXAtY2FudmFzL2RhdGEuanNvbmApO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZXhpc3RzKG9sZERhdGFQYXRoKSkge1xuICAgICAgICAgIGxvYWRlZCA9IEpTT04ucGFyc2UoYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKG9sZERhdGFQYXRoKSkgYXMgUGFydGlhbDxNaW5kTWFwU3R1ZGlvU2V0dGluZ3M+O1xuICAgICAgICAgIGlmIChsb2FkZWQpIGF3YWl0IHRoaXMuc2F2ZURhdGEobG9hZGVkKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiTWluZE1hcCBTdHVkaW8gY291bGQgbm90IG1pZ3JhdGUgdGhlIG9sZCBzZXR0aW5ncyBmaWxlXCIsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmF3ID0gKGxvYWRlZCA/PyB7fSkgYXMgUGFydGlhbDxNaW5kTWFwU3R1ZGlvU2V0dGluZ3M+ICYgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgbGV0IGltYWdlSG9zdHM6IEltYWdlSG9zdENvbmZpZ1tdID0gQXJyYXkuaXNBcnJheShyYXcuaW1hZ2VIb3N0cylcbiAgICAgID8gcmF3LmltYWdlSG9zdHMuc2xpY2UoMCwgMjApLmZsYXRNYXAoKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgIGlmICghaXRlbSB8fCB0eXBlb2YgaXRlbSAhPT0gXCJvYmplY3RcIikgcmV0dXJuIFtdO1xuICAgICAgICBjb25zdCBjYW5kaWRhdGUgPSBpdGVtIGFzIFBhcnRpYWw8SW1hZ2VIb3N0Q29uZmlnPjtcbiAgICAgICAgY29uc3QgaG9zdCA9IGNyZWF0ZUltYWdlSG9zdENvbmZpZyhpbmRleCArIDEpO1xuICAgICAgICBob3N0LmlkID0gdHlwZW9mIGNhbmRpZGF0ZS5pZCA9PT0gXCJzdHJpbmdcIiAmJiBjYW5kaWRhdGUuaWQudHJpbSgpID8gY2FuZGlkYXRlLmlkLnRyaW0oKS5zbGljZSgwLCAxNjApIDogaG9zdC5pZDtcbiAgICAgICAgaG9zdC5uYW1lID0gdHlwZW9mIGNhbmRpZGF0ZS5uYW1lID09PSBcInN0cmluZ1wiICYmIGNhbmRpZGF0ZS5uYW1lLnRyaW0oKSA/IGNhbmRpZGF0ZS5uYW1lLnRyaW0oKS5zbGljZSgwLCAxMjApIDogaG9zdC5uYW1lO1xuICAgICAgICBob3N0LmVuYWJsZWQgPSBjYW5kaWRhdGUuZW5hYmxlZCAhPT0gZmFsc2U7XG4gICAgICAgIGhvc3QuZW5kcG9pbnQgPSB0eXBlb2YgY2FuZGlkYXRlLmVuZHBvaW50ID09PSBcInN0cmluZ1wiID8gY2FuZGlkYXRlLmVuZHBvaW50LnRyaW0oKS5zbGljZSgwLCA0MDAwKSA6IFwiXCI7XG4gICAgICAgIGhvc3QubWV0aG9kID0gY2FuZGlkYXRlLm1ldGhvZCA9PT0gXCJQVVRcIiA/IFwiUFVUXCIgOiBcIlBPU1RcIjtcbiAgICAgICAgaG9zdC5ib2R5TW9kZSA9IGNhbmRpZGF0ZS5ib2R5TW9kZSA9PT0gXCJyYXdcIiA/IFwicmF3XCIgOiBcIm11bHRpcGFydFwiO1xuICAgICAgICBob3N0LmZpZWxkTmFtZSA9IHR5cGVvZiBjYW5kaWRhdGUuZmllbGROYW1lID09PSBcInN0cmluZ1wiICYmIGNhbmRpZGF0ZS5maWVsZE5hbWUudHJpbSgpID8gY2FuZGlkYXRlLmZpZWxkTmFtZS50cmltKCkuc2xpY2UoMCwgMTIwKSA6IFwiZmlsZVwiO1xuICAgICAgICBob3N0LmhlYWRlcnMgPSB0eXBlb2YgY2FuZGlkYXRlLmhlYWRlcnMgPT09IFwic3RyaW5nXCIgPyBjYW5kaWRhdGUuaGVhZGVycy50cmltKCkuc2xpY2UoMCwgMjAwMDApIDogXCJcIjtcbiAgICAgICAgaG9zdC5yZXNwb25zZVBhdGggPSB0eXBlb2YgY2FuZGlkYXRlLnJlc3BvbnNlUGF0aCA9PT0gXCJzdHJpbmdcIiA/IGNhbmRpZGF0ZS5yZXNwb25zZVBhdGgudHJpbSgpLnNsaWNlKDAsIDUwMCkgOiBcImRhdGEudXJsXCI7XG4gICAgICAgIHJldHVybiBbaG9zdF07XG4gICAgICB9KVxuICAgICAgOiBbXTtcblxuICAgIC8vIE1pZ3JhdGUgdGhlIHNpbmdsZS1ob3N0IHNldHRpbmdzIHVzZWQgYnkgTWluZE1hcCBTdHVkaW8gMC45LnguXG4gICAgY29uc3QgbGVnYWN5RW5kcG9pbnQgPSB0eXBlb2YgcmF3LmltYWdlSG9zdEVuZHBvaW50ID09PSBcInN0cmluZ1wiID8gcmF3LmltYWdlSG9zdEVuZHBvaW50LnRyaW0oKSA6IFwiXCI7XG4gICAgaWYgKCFpbWFnZUhvc3RzLmxlbmd0aCAmJiBsZWdhY3lFbmRwb2ludCkge1xuICAgICAgY29uc3QgaG9zdCA9IGNyZWF0ZUltYWdlSG9zdENvbmZpZygxKTtcbiAgICAgIGhvc3QubmFtZSA9IFwiXHU1MzlGXHU1NkZFXHU1RThBXCI7XG4gICAgICBob3N0LmVuZHBvaW50ID0gbGVnYWN5RW5kcG9pbnQ7XG4gICAgICBob3N0Lm1ldGhvZCA9IHJhdy5pbWFnZUhvc3RNZXRob2QgPT09IFwiUFVUXCIgPyBcIlBVVFwiIDogXCJQT1NUXCI7XG4gICAgICBob3N0LmJvZHlNb2RlID0gcmF3LmltYWdlSG9zdEJvZHlNb2RlID09PSBcInJhd1wiID8gXCJyYXdcIiA6IFwibXVsdGlwYXJ0XCI7XG4gICAgICBob3N0LmZpZWxkTmFtZSA9IHR5cGVvZiByYXcuaW1hZ2VIb3N0RmllbGROYW1lID09PSBcInN0cmluZ1wiICYmIHJhdy5pbWFnZUhvc3RGaWVsZE5hbWUudHJpbSgpID8gcmF3LmltYWdlSG9zdEZpZWxkTmFtZS50cmltKCkgOiBcImZpbGVcIjtcbiAgICAgIGhvc3QuaGVhZGVycyA9IHR5cGVvZiByYXcuaW1hZ2VIb3N0SGVhZGVycyA9PT0gXCJzdHJpbmdcIiA/IHJhdy5pbWFnZUhvc3RIZWFkZXJzLnRyaW0oKSA6IFwiXCI7XG4gICAgICBob3N0LnJlc3BvbnNlUGF0aCA9IHR5cGVvZiByYXcuaW1hZ2VIb3N0UmVzcG9uc2VQYXRoID09PSBcInN0cmluZ1wiID8gcmF3LmltYWdlSG9zdFJlc3BvbnNlUGF0aC50cmltKCkgOiBcImRhdGEudXJsXCI7XG4gICAgICBpbWFnZUhvc3RzID0gW2hvc3RdO1xuICAgIH1cblxuICAgIGNvbnN0IGVuYWJsZWRJZHMgPSBuZXcgU2V0KGltYWdlSG9zdHMuZmlsdGVyKChob3N0KSA9PiBob3N0LmVuYWJsZWQpLm1hcCgoaG9zdCkgPT4gaG9zdC5pZCkpO1xuICAgIGNvbnN0IHNlbGVjdGVkSWRzID0gQXJyYXkuaXNBcnJheShyYXcuYXV0b1VwbG9hZEhvc3RJZHMpXG4gICAgICA/IHJhdy5hdXRvVXBsb2FkSG9zdElkcy5maWx0ZXIoKGlkKTogaWQgaXMgc3RyaW5nID0+IHR5cGVvZiBpZCA9PT0gXCJzdHJpbmdcIiAmJiBlbmFibGVkSWRzLmhhcyhpZCkpXG4gICAgICA6IFtdO1xuICAgIHRoaXMuc2V0dGluZ3MgPSB7XG4gICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgLi4ucmF3LFxuICAgICAgaW1hZ2VIb3N0cyxcbiAgICAgIGF1dG9VcGxvYWRFbmFibGVkOiByYXcuYXV0b1VwbG9hZEVuYWJsZWQgPT09IHRydWUsXG4gICAgICBhdXRvVXBsb2FkRGVsYXlTZWNvbmRzOiB0eXBlb2YgcmF3LmF1dG9VcGxvYWREZWxheVNlY29uZHMgPT09IFwibnVtYmVyXCJcbiAgICAgICAgPyBNYXRoLm1heCgwLCBNYXRoLm1pbigzMDAsIE1hdGgucm91bmQocmF3LmF1dG9VcGxvYWREZWxheVNlY29uZHMpKSlcbiAgICAgICAgOiBERUZBVUxUX1NFVFRJTkdTLmF1dG9VcGxvYWREZWxheVNlY29uZHMsXG4gICAgICBhdXRvVXBsb2FkSG9zdElkczogc2VsZWN0ZWRJZHMsXG4gICAgICBkZWxldGVMb2NhbEFmdGVyVXBsb2FkOiByYXcuZGVsZXRlTG9jYWxBZnRlclVwbG9hZCAhPT0gZmFsc2UsXG4gICAgICBpbWFnZUZhaWxvdmVyRW5hYmxlZDogcmF3LmltYWdlRmFpbG92ZXJFbmFibGVkICE9PSBmYWxzZSxcbiAgICAgIGltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kczogdHlwZW9mIHJhdy5pbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHMgPT09IFwibnVtYmVyXCJcbiAgICAgICAgPyBNYXRoLm1heCgyLCBNYXRoLm1pbigzMCwgTWF0aC5yb3VuZChyYXcuaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzKSkpXG4gICAgICAgIDogREVGQVVMVF9TRVRUSU5HUy5pbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHMsXG4gICAgICBpbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjazogcmF3LmltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrICE9PSBmYWxzZVxuICAgIH0gYXMgTWluZE1hcFN0dWRpb1NldHRpbmdzO1xuICAgIGlmIChyYXcuYmFja2dyb3VuZFBhdHRlcm4gPT09IHVuZGVmaW5lZCAmJiByYXcuc2hvd0dyaWQgPT09IGZhbHNlKSB0aGlzLnNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuID0gXCJub25lXCI7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIHJlZnJlc2hPcGVuVmlld3MoKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBsZWFmIG9mIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX01JTkRNQVBfU1RVRElPKSkge1xuICAgICAgaWYgKGxlYWYudmlldyBpbnN0YW5jZW9mIE1pbmRNYXBTdHVkaW9WaWV3KSBsZWFmLnZpZXcucmVmcmVzaEFwcGVhcmFuY2UoKTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVDb25maWd1cmVkRG9jdW1lbnQodGl0bGU6IHN0cmluZyk6IE1pbmRNYXBEb2N1bWVudCB7XG4gICAgY29uc3QgZG9jdW1lbnQgPSBjcmVhdGVEZWZhdWx0RG9jdW1lbnQodGl0bGUpO1xuICAgIGRvY3VtZW50LmxheW91dCA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdExheW91dDtcbiAgICBkb2N1bWVudC50aGVtZSA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdFRoZW1lO1xuICAgIGRvY3VtZW50LmFwcGVhcmFuY2UgPSBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKTtcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBhc3luYyBnZXRBdmFpbGFibGVQYXRoKHByZWZlcnJlZFBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgocHJlZmVycmVkUGF0aCk7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCkpIHJldHVybiBub3JtYWxpemVkO1xuICAgIGNvbnN0IGRvdCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIuXCIpO1xuICAgIGNvbnN0IGJhc2UgPSBkb3QgPiBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKSA/IG5vcm1hbGl6ZWQuc2xpY2UoMCwgZG90KSA6IG5vcm1hbGl6ZWQ7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZG90ID4gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi9cIikgPyBub3JtYWxpemVkLnNsaWNlKGRvdCkgOiBcIlwiO1xuICAgIGxldCBpbmRleCA9IDI7XG4gICAgd2hpbGUgKHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChgJHtiYXNlfSAke2luZGV4fSR7ZXh0ZW5zaW9ufWApKSBpbmRleCArPSAxO1xuICAgIHJldHVybiBgJHtiYXNlfSAke2luZGV4fSR7ZXh0ZW5zaW9ufWA7XG4gIH1cblxuICBhc3luYyBjcmVhdGVNaW5kTWFwKG9wdGlvbnM6IHtcbiAgICBpbnNlcnRJbnRvQ3VycmVudD86IGJvb2xlYW47XG4gICAgZm9sZGVyPzogc3RyaW5nO1xuICAgIGRvY3VtZW50PzogTWluZE1hcERvY3VtZW50O1xuICAgIHRpdGxlPzogc3RyaW5nO1xuICB9ID0ge30pOiBQcm9taXNlPFRGaWxlPiB7XG4gICAgY29uc3QgYWN0aXZlQmVmb3JlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICBjb25zdCBmb2xkZXIgPSBhd2FpdCB0aGlzLnJlc29sdmVGb2xkZXIob3B0aW9ucy5mb2xkZXIsIGFjdGl2ZUJlZm9yZSk7XG4gICAgY29uc3QgdGl0bGUgPSBvcHRpb25zLnRpdGxlID8/IHRoaXMuYnVpbGROZXdUaXRsZSgpO1xuICAgIGNvbnN0IGZpbGVuYW1lID0gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKTtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy5nZXRBdmFpbGFibGVQYXRoKG5vcm1hbGl6ZVBhdGgoYCR7Zm9sZGVyID8gYCR7Zm9sZGVyfS9gIDogXCJcIn0ke2ZpbGVuYW1lfS4ke01JTkRNQVBfRVhURU5TSU9OfWApKTtcbiAgICBjb25zdCBkb2N1bWVudCA9IG9wdGlvbnMuZG9jdW1lbnQgPz8gdGhpcy5jcmVhdGVDb25maWd1cmVkRG9jdW1lbnQodGl0bGUpO1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpKTtcblxuICAgIGlmIChvcHRpb25zLmluc2VydEludG9DdXJyZW50ICYmIGFjdGl2ZUJlZm9yZSAmJiBhY3RpdmVCZWZvcmUuZXh0ZW5zaW9uID09PSBcIm1kXCIgJiYgYWN0aXZlQmVmb3JlLnBhdGggIT09IGZpbGUucGF0aCkge1xuICAgICAgY29uc3QgZW1iZWQgPSBgXFxuXFxuIVtbJHtmaWxlLnBhdGh9XV1cXG5gO1xuICAgICAgY29uc3QgY3VycmVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoYWN0aXZlQmVmb3JlKTtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShhY3RpdmVCZWZvcmUsIGAke2N1cnJlbnQudHJpbUVuZCgpfSR7ZW1iZWR9YCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMub3BlbkFzTWluZE1hcChmaWxlKTtcbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5Bc01pbmRNYXAoZmlsZTogVEZpbGUsIHByZWZlcnJlZExlYWY/OiBXb3Jrc3BhY2VMZWFmLCBmb2N1c05vZGVJZD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYWYgPSBwcmVmZXJyZWRMZWFmID8/IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcbiAgICBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG4gICAgICB0eXBlOiBWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8sXG4gICAgICBzdGF0ZTogeyBmaWxlOiBmaWxlLnBhdGggfSxcbiAgICAgIGFjdGl2ZTogdHJ1ZVxuICAgIH0pO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgIGlmIChmb2N1c05vZGVJZCAmJiBsZWFmLnZpZXcgaW5zdGFuY2VvZiBNaW5kTWFwU3R1ZGlvVmlldykge1xuICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gbGVhZi52aWV3IGluc3RhbmNlb2YgTWluZE1hcFN0dWRpb1ZpZXcgJiYgbGVhZi52aWV3LmZvY3VzTm9kZShmb2N1c05vZGVJZCksIDMwKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlUGFzdGVkSW1hZ2UoYmxvYjogQmxvYiwgc3VnZ2VzdGVkTmFtZTogc3RyaW5nLCBzb3VyY2VGaWxlOiBURmlsZSB8IG51bGwpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIFx1NTZGRVx1NzI0N1x1OEQ0NFx1NkU5MFx1NzZFRVx1NUY1NVx1NjMwOVx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NjI0MFx1NTcyOFx1NzZFRVx1NUY1NVx1ODlFM1x1Njc5MFx1RkYwQ1x1ODAwQ1x1NEUwRFx1NjYyRlx1NjMwOVx1NEVEM1x1NUU5M1x1NjgzOVx1NzZFRVx1NUY1NVx1ODlFM1x1Njc5MFx1MzAwMlxuICAgIC8vIFx1NEY4Qlx1NTk4MiBQcm9qZWN0cy9QbGFuLm1pbmRtYXAgKyBNaW5kTWFwIEFzc2V0cyA9PlxuICAgIC8vIFByb2plY3RzL01pbmRNYXAgQXNzZXRzL1BsYW4tMjAyNjA3MjAtMTIzNDU2LnBuZ1xuICAgIGNvbnN0IHNvdXJjZUZvbGRlciA9IHNvdXJjZUZpbGU/LnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgIGNvbnN0IGNvbmZpZ3VyZWRGb2xkZXIgPSBub3JtYWxpemVQYXRoKCh0aGlzLnNldHRpbmdzLmFzc2V0Rm9sZGVyIHx8IFwiTWluZE1hcCBBc3NldHNcIikucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIikpO1xuICAgIGNvbnN0IGZvbGRlciA9IG5vcm1hbGl6ZVBhdGgoW3NvdXJjZUZvbGRlciwgY29uZmlndXJlZEZvbGRlcl0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCIvXCIpKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlclBhdGgoZm9sZGVyKTtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHR3byA9ICh2YWx1ZTogbnVtYmVyKTogc3RyaW5nID0+IFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgIGNvbnN0IHN0YW1wID0gYCR7bm93LmdldEZ1bGxZZWFyKCl9JHt0d28obm93LmdldE1vbnRoKCkgKyAxKX0ke3R3byhub3cuZ2V0RGF0ZSgpKX0tJHt0d28obm93LmdldEhvdXJzKCkpfSR7dHdvKG5vdy5nZXRNaW51dGVzKCkpfSR7dHdvKG5vdy5nZXRTZWNvbmRzKCkpfWA7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gc3VnZ2VzdGVkTmFtZS5zcGxpdChcIi5cIikuYXQoLTEpPy5yZXBsYWNlKC9bXmEtejAtOV0vZ2ksIFwiXCIpLnRvTG93ZXJDYXNlKCkgfHwgXCJwbmdcIjtcbiAgICBjb25zdCBiYXNlID0gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHNvdXJjZUZpbGU/LmJhc2VuYW1lID8/IFwibWluZG1hcFwiKTtcbiAgICBjb25zdCBwcmVmZXJyZWQgPSBub3JtYWxpemVQYXRoKGAke2ZvbGRlcn0vJHtiYXNlfS0ke3N0YW1wfS4ke2V4dGVuc2lvbn1gKTtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy5nZXRBdmFpbGFibGVQYXRoKHByZWZlcnJlZCk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlQmluYXJ5KHBhdGgsIGF3YWl0IGJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBhc3luYyByZWFkSW1hZ2VTb3VyY2Uoc291cmNlOiBzdHJpbmcsIHNvdXJjZUZpbGU6IFRGaWxlIHwgbnVsbCk6IFByb21pc2U8eyBibG9iOiBCbG9iOyBzdWdnZXN0ZWROYW1lOiBzdHJpbmcgfSB8IG51bGw+IHtcbiAgICBjb25zdCByYXcgPSBzb3VyY2UudHJpbSgpO1xuICAgIGlmICghcmF3IHx8IC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QocmF3KSB8fCAvXmRhdGE6L2kudGVzdChyYXcpIHx8IC9eYmxvYjovaS50ZXN0KHJhdykpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHdpa2lNYXRjaCA9IHJhdy5tYXRjaCgvXiE/XFxbXFxbKFtcXHNcXFNdKz8pXFxdXFxdJC8pO1xuICAgIGNvbnN0IHRhcmdldCA9ICh3aWtpTWF0Y2g/LlsxXSA/PyByYXcpLnNwbGl0KFwifFwiKVswXT8uc3BsaXQoXCIjXCIpWzBdPy50cmltKCkgPz8gcmF3O1xuICAgIGNvbnN0IGRpcmVjdCA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKHRhcmdldCkpO1xuICAgIGNvbnN0IGZpbGUgPSBkaXJlY3QgaW5zdGFuY2VvZiBURmlsZSA/IGRpcmVjdCA6IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QodGFyZ2V0LCBzb3VyY2VGaWxlPy5wYXRoID8/IFwiXCIpO1xuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGJpbmFyeSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWRCaW5hcnkoZmlsZSk7XG4gICAgcmV0dXJuIHsgYmxvYjogbmV3IEJsb2IoW2JpbmFyeV0sIHsgdHlwZTogdGhpcy5taW1lRnJvbUZpbGVuYW1lKGZpbGUubmFtZSkgfSksIHN1Z2dlc3RlZE5hbWU6IGZpbGUubmFtZSB9O1xuICB9XG5cbiAgZ2V0SW1hZ2VIb3N0Q2hvaWNlcygpOiBJbWFnZUhvc3RDaG9pY2VbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MuaW1hZ2VIb3N0c1xuICAgICAgLmZpbHRlcigoaG9zdCkgPT4gaG9zdC5lbmFibGVkICYmIEJvb2xlYW4oaG9zdC5lbmRwb2ludC50cmltKCkpKVxuICAgICAgLm1hcCgoaG9zdCkgPT4gKHsgaWQ6IGhvc3QuaWQsIG5hbWU6IGhvc3QubmFtZSB9KSk7XG4gIH1cblxuICBnZXREZWZhdWx0VXBsb2FkSG9zdElkcygpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZW5hYmxlZCA9IG5ldyBTZXQodGhpcy5nZXRJbWFnZUhvc3RDaG9pY2VzKCkubWFwKChob3N0KSA9PiBob3N0LmlkKSk7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMuZmlsdGVyKChpZCkgPT4gZW5hYmxlZC5oYXMoaWQpKTtcbiAgfVxuXG4gIGFzeW5jIHVwbG9hZEltYWdlVG9Ib3N0cyhibG9iOiBCbG9iLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcsIGhvc3RJZHM6IHN0cmluZ1tdKTogUHJvbWlzZTxJbWFnZUhvc3RVcGxvYWRCYXRjaD4ge1xuICAgIGNvbnN0IHJlcXVlc3RlZCA9IEFycmF5LmZyb20obmV3IFNldChob3N0SWRzKSk7XG4gICAgY29uc3QgaG9zdHMgPSByZXF1ZXN0ZWRcbiAgICAgIC5tYXAoKGlkKSA9PiB0aGlzLnNldHRpbmdzLmltYWdlSG9zdHMuZmluZCgoaG9zdCkgPT4gaG9zdC5pZCA9PT0gaWQpKVxuICAgICAgLmZpbHRlcigoaG9zdCk6IGhvc3QgaXMgSW1hZ2VIb3N0Q29uZmlnID0+IEJvb2xlYW4oaG9zdD8uZW5hYmxlZCAmJiBob3N0LmVuZHBvaW50LnRyaW0oKSkpO1xuICAgIGlmICghaG9zdHMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJcdTZDQTFcdTY3MDlcdTkwMDlcdTYyRTlcdTUzRUZcdTc1MjhcdTU2RkVcdTVFOEFcIik7XG4gICAgY29uc3Qgc2V0dGxlZCA9IGF3YWl0IFByb21pc2UuYWxsKGhvc3RzLm1hcChhc3luYyAoaG9zdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdXJsID0gYXdhaXQgdGhpcy51cGxvYWRJbWFnZVRvSG9zdENvbmZpZyhob3N0LCBibG9iLCBzdWdnZXN0ZWROYW1lKTtcbiAgICAgICAgcmV0dXJuIHsgb2s6IHRydWUgYXMgY29uc3QsIHZhbHVlOiB7IGhvc3RJZDogaG9zdC5pZCwgaG9zdE5hbWU6IGhvc3QubmFtZSwgdXJsIH0gfTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgb2s6IGZhbHNlIGFzIGNvbnN0LFxuICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICBob3N0SWQ6IGhvc3QuaWQsXG4gICAgICAgICAgICBob3N0TmFtZTogaG9zdC5uYW1lLFxuICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3Nlczogc2V0dGxlZC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIHsgb2s6IHRydWU7IHZhbHVlOiBJbWFnZUhvc3RVcGxvYWRTdWNjZXNzIH0gPT4gaXRlbS5vaykubWFwKChpdGVtKSA9PiBpdGVtLnZhbHVlKSxcbiAgICAgIGZhaWx1cmVzOiBzZXR0bGVkLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgeyBvazogZmFsc2U7IHZhbHVlOiB7IGhvc3RJZDogc3RyaW5nOyBob3N0TmFtZTogc3RyaW5nOyBlcnJvcjogc3RyaW5nIH0gfSA9PiAhaXRlbS5vaykubWFwKChpdGVtKSA9PiBpdGVtLnZhbHVlKVxuICAgIH07XG4gIH1cblxuICBhc3luYyB0ZXN0SW1hZ2VIb3N0KGhvc3RJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuc2V0dGluZ3MuaW1hZ2VIb3N0cy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSBob3N0SWQpO1xuICAgIGlmICghaG9zdCkge1xuICAgICAgbmV3IE5vdGljZShcIlx1NjI3RVx1NEUwRFx1NTIzMFx1OEJFNVx1NTZGRVx1NUU4QVx1OTE0RFx1N0Y2RVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFob3N0LmVuZHBvaW50LnRyaW0oKSkge1xuICAgICAgbmV3IE5vdGljZShgXHU4QkY3XHU1MTQ4XHU1ODZCXHU1MTk5ICR7aG9zdC5uYW1lfSBcdTc2ODRcdTRFMEFcdTRGMjAgQVBJYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIEEgcmVhbCAxXHUwMEQ3MSB0cmFuc3BhcmVudCBQTkcgdGVzdHMgYXV0aGVudGljYXRpb24sIHJlcXVlc3QgZm9ybWF0IGFuZCByZXNwb25zZSBwYXJzaW5nLlxuICAgIGNvbnN0IHBuZyA9IG5ldyBVaW50OEFycmF5KFtcbiAgICAgIDEzNywgODAsIDc4LCA3MSwgMTMsIDEwLCAyNiwgMTAsIDAsIDAsIDAsIDEzLCA3MywgNzIsIDY4LCA4MixcbiAgICAgIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDEsIDgsIDYsIDAsIDAsIDAsIDMxLCAyMSwgMTk2LCAxMzcsXG4gICAgICAwLCAwLCAwLCAxMywgNzMsIDY4LCA2NSwgODQsIDgsIDIxNSwgOTksIDI0OCwgMjA3LCAxOTIsIDI0MCwgMzEsXG4gICAgICAwLCA1LCAwLCAxLCAyNTUsIDEzNywgMTUzLCA2MSwgMjksIDAsIDAsIDAsIDAsIDczLCA2OSwgNzgsIDY4LFxuICAgICAgMTc0LCA2NiwgOTYsIDEzMFxuICAgIF0pO1xuICAgIGNvbnN0IHN0YXJ0ZWQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXJsID0gYXdhaXQgdGhpcy51cGxvYWRJbWFnZVRvSG9zdENvbmZpZyhob3N0LCBuZXcgQmxvYihbcG5nXSwgeyB0eXBlOiBcImltYWdlL3BuZ1wiIH0pLCBcIm1pbmRtYXAtc3R1ZGlvLWFwaS10ZXN0LnBuZ1wiKTtcbiAgICAgIGNvbnN0IGVsYXBzZWQgPSBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZCkpO1xuICAgICAgbmV3IE5vdGljZShgJHtob3N0Lm5hbWV9IFx1OEZERVx1NjNBNVx1NjIxMFx1NTI5Rlx1RkYwOCR7ZWxhcHNlZH0gbXNcdUZGMDlcXG4ke3VybH1gLCA4MDAwKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGltYWdlIGhvc3QgY29ubmVjdGl2aXR5IHRlc3QgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoYCR7aG9zdC5uYW1lfSBcdThGREVcdTYzQTVcdTU5MzFcdThEMjVcdUZGMUEke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLCA4MDAwKTtcbiAgICB9XG4gIH1cblxuICBzY2hlZHVsZUF1dG9VcGxvYWQoZmlsZTogVEZpbGUgfCBudWxsLCBub2RlSWQ6IHN0cmluZywgYmxvY2tJZDogc3RyaW5nLCBsb2NhbFBhdGg6IHN0cmluZywgc3VnZ2VzdGVkTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFmaWxlIHx8ICF0aGlzLnNldHRpbmdzLmF1dG9VcGxvYWRFbmFibGVkKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdElkcyA9IHRoaXMuZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHMoKTtcbiAgICBpZiAoIWhvc3RJZHMubGVuZ3RoKSB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU1QjU4XHU1MjMwXHU2NzJDXHU1NzMwXHVGRjFCXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU2NzJBXHU5MDA5XHU2MkU5XHU1M0VGXHU3NTI4XHU1NkZFXHU1RThBXCIsIDUwMDApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBrZXkgPSBgJHtmaWxlLnBhdGh9Ojoke25vZGVJZH06OiR7YmxvY2tJZH1gO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hdXRvVXBsb2FkVGltZXJzLmdldChrZXkpO1xuICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKSB3aW5kb3cuY2xlYXJUaW1lb3V0KGV4aXN0aW5nKTtcbiAgICBjb25zdCBkZWxheSA9IE1hdGgubWF4KDAsIE1hdGgubWluKDMwMCwgdGhpcy5zZXR0aW5ncy5hdXRvVXBsb2FkRGVsYXlTZWNvbmRzKSkgKiAxMDAwO1xuICAgIGNvbnN0IHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5hdXRvVXBsb2FkVGltZXJzLmRlbGV0ZShrZXkpO1xuICAgICAgdm9pZCB0aGlzLnJ1bkF1dG9VcGxvYWRUYXNrKGZpbGUucGF0aCwgbm9kZUlkLCBibG9ja0lkLCBsb2NhbFBhdGgsIHN1Z2dlc3RlZE5hbWUsIGhvc3RJZHMpO1xuICAgIH0sIGRlbGF5KTtcbiAgICB0aGlzLmF1dG9VcGxvYWRUaW1lcnMuc2V0KGtleSwgdGltZXIpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBydW5BdXRvVXBsb2FkVGFzayhcbiAgICBtaW5kTWFwUGF0aDogc3RyaW5nLFxuICAgIG5vZGVJZDogc3RyaW5nLFxuICAgIGJsb2NrSWQ6IHN0cmluZyxcbiAgICBsb2NhbFBhdGg6IHN0cmluZyxcbiAgICBzdWdnZXN0ZWROYW1lOiBzdHJpbmcsXG4gICAgaG9zdElkczogc3RyaW5nW11cbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZmx1c2hPcGVuVmlldyhtaW5kTWFwUGF0aCk7XG4gICAgICBjb25zdCBtYXBGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG1pbmRNYXBQYXRoKTtcbiAgICAgIGNvbnN0IGxvY2FsRmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVQYXRoKGxvY2FsUGF0aCkpO1xuICAgICAgaWYgKCEobWFwRmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB8fCAhKGxvY2FsRmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuO1xuICAgICAgY29uc3QgZG9jdW1lbnQgPSBwYXJzZURvY3VtZW50KGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQobWFwRmlsZSksIG1hcEZpbGUuYmFzZW5hbWUpO1xuICAgICAgY29uc3Qgbm9kZSA9IGZpbmROb2RlKGRvY3VtZW50LnJvb3QsIG5vZGVJZCk7XG4gICAgICBjb25zdCBibG9jayA9IG5vZGU/LmNvbnRlbnQ/LmZpbmQoKGl0ZW0pOiBpdGVtIGlzIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9PiBpdGVtLnR5cGUgPT09IFwiaW1hZ2VcIiAmJiBpdGVtLmlkID09PSBibG9ja0lkKTtcbiAgICAgIGlmICghbm9kZSB8fCAhYmxvY2sgfHwgKGJsb2NrLnNvdXJjZSAhPT0gbG9jYWxQYXRoICYmIGJsb2NrLmxvY2FsU291cmNlICE9PSBsb2NhbFBhdGgpKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IGJpbmFyeSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWRCaW5hcnkobG9jYWxGaWxlKTtcbiAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbYmluYXJ5XSwgeyB0eXBlOiB0aGlzLm1pbWVGcm9tRmlsZW5hbWUobG9jYWxGaWxlLm5hbWUpIH0pO1xuICAgICAgY29uc3QgYmF0Y2ggPSBhd2FpdCB0aGlzLnVwbG9hZEltYWdlVG9Ib3N0cyhibG9iLCBzdWdnZXN0ZWROYW1lIHx8IGxvY2FsRmlsZS5uYW1lLCBob3N0SWRzKTtcbiAgICAgIGNvbnN0IHVwbG9hZGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICBjb25zdCByZW1vdGVCeUhvc3QgPSBuZXcgTWFwKChibG9jay5yZW1vdGVTb3VyY2VzID8/IFtdKS5tYXAoKGl0ZW0pID0+IFtpdGVtLmhvc3RJZCwgaXRlbV0pKTtcbiAgICAgIGZvciAoY29uc3Qgc3VjY2VzcyBvZiBiYXRjaC5zdWNjZXNzZXMpIHtcbiAgICAgICAgcmVtb3RlQnlIb3N0LnNldChzdWNjZXNzLmhvc3RJZCwgeyAuLi5zdWNjZXNzLCB1cGxvYWRlZEF0IH0pO1xuICAgICAgfVxuICAgICAgYmxvY2sucmVtb3RlU291cmNlcyA9IEFycmF5LmZyb20ocmVtb3RlQnlIb3N0LnZhbHVlcygpKTtcbiAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gbG9jYWxQYXRoO1xuXG4gICAgICBjb25zdCBhbGxTdWNjZWVkZWQgPSBiYXRjaC5mYWlsdXJlcy5sZW5ndGggPT09IDAgJiYgYmF0Y2guc3VjY2Vzc2VzLmxlbmd0aCA9PT0gaG9zdElkcy5sZW5ndGg7XG4gICAgICBpZiAoYWxsU3VjY2VlZGVkICYmIGJhdGNoLnN1Y2Nlc3Nlc1swXSkgYmxvY2suc291cmNlID0gYmF0Y2guc3VjY2Vzc2VzWzBdLnVybDtcbiAgICAgIHN5bmNOb2RlTGVnYWN5RmllbGRzKG5vZGUpO1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KG1hcEZpbGUsIHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50KSk7XG4gICAgICBhd2FpdCB0aGlzLnJlZnJlc2hPcGVuTWluZE1hcChtYXBGaWxlLCBkb2N1bWVudCk7XG5cbiAgICAgIGxldCBkZWxldGVkID0gZmFsc2U7XG4gICAgICBpZiAoYWxsU3VjY2VlZGVkICYmIHRoaXMuc2V0dGluZ3MuZGVsZXRlTG9jYWxBZnRlclVwbG9hZCkge1xuICAgICAgICBkZWxldGVkID0gYXdhaXQgdGhpcy5kZWxldGVMb2NhbEFzc2V0SWZTYWZlKGxvY2FsUGF0aCwgbWluZE1hcFBhdGgsIGJsb2NrSWQpO1xuICAgICAgICBpZiAoZGVsZXRlZCkge1xuICAgICAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShtYXBGaWxlLCBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCkpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucmVmcmVzaE9wZW5NaW5kTWFwKG1hcEZpbGUsIGRvY3VtZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYWxsU3VjY2VlZGVkKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldHMgPSBiYXRjaC5zdWNjZXNzZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpO1xuICAgICAgICBjb25zdCBzdWZmaXggPSB0aGlzLnNldHRpbmdzLmRlbGV0ZUxvY2FsQWZ0ZXJVcGxvYWRcbiAgICAgICAgICA/IGRlbGV0ZWQgPyBcIlx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NURGMlx1NUI4OVx1NTE2OFx1NTIyMFx1OTY2NFwiIDogXCJcdUZGMENcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTU2RTBcdTRFQ0RcdTg4QUJcdTVGMTVcdTc1MjhcdTYyMTZcdTUyMjBcdTk2NjRcdTU5MzFcdThEMjVcdTgwMENcdTRGRERcdTc1NTlcIlxuICAgICAgICAgIDogXCJcdUZGMENcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTc1NTlcIjtcbiAgICAgICAgbmV3IE5vdGljZShgXHU1NkZFXHU3MjQ3XHU1REYyXHU0RTBBXHU0RjIwXHU1MjMwICR7dGFyZ2V0c30ke3N1ZmZpeH1gLCA3MDAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG9rID0gYmF0Y2guc3VjY2Vzc2VzLm1hcCgoaXRlbSkgPT4gaXRlbS5ob3N0TmFtZSkuam9pbihcIlx1MzAwMVwiKSB8fCBcIlx1NjVFMFwiO1xuICAgICAgICBjb25zdCBmYWlsZWQgPSBiYXRjaC5mYWlsdXJlcy5tYXAoKGl0ZW0pID0+IGAke2l0ZW0uaG9zdE5hbWV9XHVGRjFBJHtpdGVtLmVycm9yfWApLmpvaW4oXCJcdUZGMUJcIik7XG4gICAgICAgIG5ldyBOb3RpY2UoYFx1NTZGRVx1NzI0N1x1NEVDNVx1OTBFOFx1NTIwNlx1NEUwQVx1NEYyMFx1NjIxMFx1NTI5Rlx1MzAwMlx1NjIxMFx1NTI5Rlx1RkYxQSR7b2t9XHVGRjFCXHU1OTMxXHU4RDI1XHVGRjFBJHtmYWlsZWR9XHUzMDAyXHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU3NTU5XHUzMDAyYCwgOTAwMCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBhdXRvbWF0aWMgaW1hZ2UgdXBsb2FkIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKGBcdTU2RkVcdTcyNDdcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcdTU5MzFcdThEMjVcdUZGMENcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTc1NTlcdUZGMUEke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLCA4MDAwKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHVwbG9hZEltYWdlVG9Ib3N0Q29uZmlnKGhvc3Q6IEltYWdlSG9zdENvbmZpZywgYmxvYjogQmxvYiwgc3VnZ2VzdGVkTmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBlbmRwb2ludCA9IGhvc3QuZW5kcG9pbnQudHJpbSgpO1xuICAgIGlmICghZW5kcG9pbnQpIHRocm93IG5ldyBFcnJvcihcIlx1NEUwQVx1NEYyMCBBUEkgXHU0RTNBXHU3QTdBXCIpO1xuICAgIGxldCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgaWYgKGhvc3QuaGVhZGVycy50cmltKCkpIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoaG9zdC5oZWFkZXJzKSBhcyB1bmtub3duO1xuICAgICAgaWYgKCFwYXJzZWQgfHwgdHlwZW9mIHBhcnNlZCAhPT0gXCJvYmplY3RcIiB8fCBBcnJheS5pc0FycmF5KHBhcnNlZCkpIHRocm93IG5ldyBFcnJvcihcIlx1OEJGN1x1NkM0Mlx1NTkzNCBKU09OIFx1NUZDNVx1OTg3Qlx1NjYyRlx1NUJGOVx1OEM2MVwiKTtcbiAgICAgIGhlYWRlcnMgPSBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMocGFyc2VkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gW2tleSwgU3RyaW5nKHZhbHVlKV0pKTtcbiAgICB9XG4gICAgY29uc3QgZmlsZW5hbWUgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUoc3VnZ2VzdGVkTmFtZSB8fCBcIm1pbmRtYXAtaW1hZ2UucG5nXCIpO1xuICAgIGNvbnN0IG1pbWUgPSBibG9iLnR5cGUgfHwgXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgICBsZXQgYm9keTogQXJyYXlCdWZmZXI7XG4gICAgbGV0IGNvbnRlbnRUeXBlID0gbWltZTtcbiAgICBpZiAoaG9zdC5ib2R5TW9kZSA9PT0gXCJtdWx0aXBhcnRcIikge1xuICAgICAgY29uc3QgYm91bmRhcnkgPSBgLS0tLU1pbmRNYXBTdHVkaW8ke0RhdGUubm93KCkudG9TdHJpbmcoMTYpfSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMil9YDtcbiAgICAgIGNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IChob3N0LmZpZWxkTmFtZSB8fCBcImZpbGVcIikucmVwbGFjZUFsbCgnXCInLCBcIlwiKTtcbiAgICAgIGNvbnN0IHNhZmVGaWxlbmFtZSA9IGZpbGVuYW1lLnJlcGxhY2VBbGwoJ1wiJywgXCJcIik7XG4gICAgICBjb25zdCBoZWFkID0gZW5jb2Rlci5lbmNvZGUoYC0tJHtib3VuZGFyeX1cXHJcXG5Db250ZW50LURpc3Bvc2l0aW9uOiBmb3JtLWRhdGE7IG5hbWU9XCIke2ZpZWxkTmFtZX1cIjsgZmlsZW5hbWU9XCIke3NhZmVGaWxlbmFtZX1cIlxcclxcbkNvbnRlbnQtVHlwZTogJHttaW1lfVxcclxcblxcclxcbmApO1xuICAgICAgY29uc3QgZmlsZSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgICBjb25zdCB0YWlsID0gZW5jb2Rlci5lbmNvZGUoYFxcclxcbi0tJHtib3VuZGFyeX0tLVxcclxcbmApO1xuICAgICAgY29uc3QgY29tYmluZWQgPSBuZXcgVWludDhBcnJheShoZWFkLmxlbmd0aCArIGZpbGUubGVuZ3RoICsgdGFpbC5sZW5ndGgpO1xuICAgICAgY29tYmluZWQuc2V0KGhlYWQsIDApOyBjb21iaW5lZC5zZXQoZmlsZSwgaGVhZC5sZW5ndGgpOyBjb21iaW5lZC5zZXQodGFpbCwgaGVhZC5sZW5ndGggKyBmaWxlLmxlbmd0aCk7XG4gICAgICBib2R5ID0gY29tYmluZWQuYnVmZmVyO1xuICAgICAgY29udGVudFR5cGUgPSBgbXVsdGlwYXJ0L2Zvcm0tZGF0YTsgYm91bmRhcnk9JHtib3VuZGFyeX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBib2R5ID0gYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpO1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgdXJsOiBlbmRwb2ludCxcbiAgICAgIG1ldGhvZDogaG9zdC5tZXRob2QsXG4gICAgICBjb250ZW50VHlwZSxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBib2R5LFxuICAgICAgdGhyb3c6IHRydWVcbiAgICB9KTtcbiAgICBsZXQgcGF5bG9hZDogdW5rbm93bjtcbiAgICB0cnkgeyBwYXlsb2FkID0gcmVzcG9uc2UuanNvbjsgfSBjYXRjaCB7IHBheWxvYWQgPSB1bmRlZmluZWQ7IH1cbiAgICBpZiAoIXBheWxvYWQgJiYgcmVzcG9uc2UudGV4dCkge1xuICAgICAgdHJ5IHsgcGF5bG9hZCA9IEpTT04ucGFyc2UocmVzcG9uc2UudGV4dCk7IH0gY2F0Y2ggeyBwYXlsb2FkID0gcmVzcG9uc2UudGV4dDsgfVxuICAgIH1cbiAgICBjb25zdCBnZXRQYXRoID0gKHZhbHVlOiB1bmtub3duLCBwYXRoOiBzdHJpbmcpOiB1bmtub3duID0+IHBhdGguc3BsaXQoXCIuXCIpLmZpbHRlcihCb29sZWFuKS5yZWR1Y2U8dW5rbm93bj4oKGN1cnJlbnQsIGtleSkgPT4gY3VycmVudCAmJiB0eXBlb2YgY3VycmVudCA9PT0gXCJvYmplY3RcIiA/IChjdXJyZW50IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrZXldIDogdW5kZWZpbmVkLCB2YWx1ZSk7XG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IFtob3N0LnJlc3BvbnNlUGF0aC50cmltKCksIFwiZGF0YS51cmxcIiwgXCJ1cmxcIiwgXCJyZXN1bHQudXJsXCIsIFwicmVzdWx0LmltYWdlXCIsIFwiaW1hZ2UudXJsXCIsIFwic3JjXCJdLmZpbHRlcihCb29sZWFuKTtcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgY2FuZGlkYXRlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRQYXRoKHBheWxvYWQsIHBhdGgpO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiAvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KHZhbHVlLnRyaW0oKSkpIHJldHVybiB2YWx1ZS50cmltKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYXlsb2FkLm1hdGNoKC9odHRwcz86XFwvXFwvW15cXHNcIic8Pl0rL2kpO1xuICAgICAgaWYgKG1hdGNoPy5bMF0pIHJldHVybiBtYXRjaFswXTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiXHU4RkQ0XHU1NkRFXHU3RUQzXHU2NzlDXHU0RTJEXHU2Q0ExXHU2NzA5XHU2MjdFXHU1MjMwXHU1NkZFXHU3MjQ3XHU3RjUxXHU1NzQwXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBmbHVzaE9wZW5WaWV3KHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTykpIHtcbiAgICAgIGlmIChsZWFmLnZpZXcgaW5zdGFuY2VvZiBNaW5kTWFwU3R1ZGlvVmlldyAmJiBsZWFmLnZpZXcuZmlsZT8ucGF0aCA9PT0gcGF0aCkgYXdhaXQgbGVhZi52aWV3LnNhdmUoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlZnJlc2hPcGVuTWluZE1hcChmaWxlOiBURmlsZSwgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNvdXJjZSA9IHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50KTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8pKSB7XG4gICAgICBpZiAobGVhZi52aWV3IGluc3RhbmNlb2YgTWluZE1hcFN0dWRpb1ZpZXcgJiYgbGVhZi52aWV3LmZpbGU/LnBhdGggPT09IGZpbGUucGF0aCkgbGVhZi52aWV3LnNldFZpZXdEYXRhKHNvdXJjZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZGVsZXRlTG9jYWxBc3NldElmU2FmZShsb2NhbFBhdGg6IHN0cmluZywgY3VycmVudE1pbmRNYXBQYXRoOiBzdHJpbmcsIGJsb2NrSWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGxvY2FsUGF0aCk7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudE1pbmRNYXBQYXRoKTtcbiAgICBpZiAoY3VycmVudCBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBjb25zdCBkb2MgPSBwYXJzZURvY3VtZW50KGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoY3VycmVudCksIGN1cnJlbnQuYmFzZW5hbWUpO1xuICAgICAgY29uc3Qgc3RpbGxVc2VkID0gZmxhdHRlbk5vZGVzKGRvYy5yb290KS5zb21lKChub2RlKSA9PiBub2RlQ29udGVudEJsb2Nrcyhub2RlKS5zb21lKChibG9jaykgPT5cbiAgICAgICAgYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiICYmIGJsb2NrLmlkICE9PSBibG9ja0lkICYmIChibG9jay5zb3VyY2UgPT09IG5vcm1hbGl6ZWQgfHwgYmxvY2subG9jYWxTb3VyY2UgPT09IG5vcm1hbGl6ZWQpKSk7XG4gICAgICBpZiAoc3RpbGxVc2VkKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAoY29uc3QgZmlsZSBvZiB0aGlzLmFwcC52YXVsdC5nZXRGaWxlcygpKSB7XG4gICAgICBpZiAoZmlsZS5wYXRoID09PSBjdXJyZW50TWluZE1hcFBhdGggfHwgZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKSAhPT0gTUlORE1BUF9FWFRFTlNJT04pIGNvbnRpbnVlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNhY2hlZFJlYWQoZmlsZSk7XG4gICAgICAgIGlmICh0ZXh0LmluY2x1ZGVzKG5vcm1hbGl6ZWQpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gSWdub3JlIGFuIHVucmVhZGFibGUgdW5yZWxhdGVkIG1hcCBhbmQga2VlcCBjaGVja2luZyBvdGhlciBmaWxlcy5cbiAgICAgIH1cbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmRlbGV0ZSh0YXJnZXQpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIk1pbmRNYXAgU3R1ZGlvIGNvdWxkIG5vdCBkZWxldGUgdXBsb2FkZWQgbG9jYWwgaW1hZ2VcIiwgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWltZUZyb21GaWxlbmFtZShmaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBmaWxlbmFtZS5zcGxpdChcIi5cIikuYXQoLTEpPy50b0xvd2VyQ2FzZSgpO1xuICAgIHJldHVybiAoeyBwbmc6IFwiaW1hZ2UvcG5nXCIsIGpwZzogXCJpbWFnZS9qcGVnXCIsIGpwZWc6IFwiaW1hZ2UvanBlZ1wiLCBnaWY6IFwiaW1hZ2UvZ2lmXCIsIHdlYnA6IFwiaW1hZ2Uvd2VicFwiLCBzdmc6IFwiaW1hZ2Uvc3ZnK3htbFwiLCBibXA6IFwiaW1hZ2UvYm1wXCIsIGF2aWY6IFwiaW1hZ2UvYXZpZlwiIH0gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilbZXh0ZW5zaW9uID8/IFwiXCJdID8/IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI7XG4gIH1cblxuICBhc3luYyBjcmVhdGVTdWJtYXBGaWxlKHBhcmVudEZpbGU6IFRGaWxlLCBub2RlOiBNaW5kTWFwTm9kZSk6IFByb21pc2U8TWluZE1hcFN1Ym1hcD4ge1xuICAgIGNvbnN0IHRpdGxlID0gKG5vZGVQbGFpblRleHQobm9kZSkgfHwgXCJcdTVCNTBcdTVCRkNcdTU2RkVcIikudHJpbSgpO1xuICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5jcmVhdGVDb25maWd1cmVkRG9jdW1lbnQodGl0bGUpO1xuICAgIGRvY3VtZW50LnJvb3QuY29udGVudCA9IFt7IGlkOiBkb2N1bWVudC5yb290LmlkICsgXCJfdGl0bGVcIiwgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IHRpdGxlIH1dO1xuICAgIHN5bmNOb2RlTGVnYWN5RmllbGRzKGRvY3VtZW50LnJvb3QpO1xuICAgIGRvY3VtZW50LnJvb3QubGluayA9IGBbWyR7cGFyZW50RmlsZS5wYXRofV1dYDtcbiAgICBkb2N1bWVudC50aXRsZSA9IHRpdGxlO1xuICAgIGRvY3VtZW50Lm5hdmlnYXRpb24gPSB7XG4gICAgICBwYXJlbnRQYXRoOiBwYXJlbnRGaWxlLnBhdGgsXG4gICAgICBwYXJlbnROb2RlSWQ6IG5vZGUuaWQsXG4gICAgICBwYXJlbnRUaXRsZTogcGFyZW50RmlsZS5iYXNlbmFtZSxcbiAgICAgIHBhcmVudE5vZGVUZXh0OiBub2RlUGxhaW5UZXh0KG5vZGUpIHx8IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBcdTVCNTBcdTVCRkNcdTU2RkVcdTRFMERcdTUxOERcdTRFMEVcdTcyMzZcdTY1ODdcdTRFRjZcdTVFNzNcdTk0RkFcdTMwMDJcdTc2RUVcdTVGNTVcdTdFRDNcdTY3ODRcdTU2RkFcdTVCOUFcdTRFM0FcdUZGMUFcbiAgICAvLyBcdTcyMzZcdTY1ODdcdTRFRjZcdTYyNDBcdTU3MjhcdTc2RUVcdTVGNTUgLyBcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcdTU5MzkgLyBcdTcyMzZcdTVCRkNcdTU2RkVcdTY1ODdcdTRFRjZcdTU0MEQgLyBcdTVCNTBcdTVCRkNcdTU2RkUubWluZG1hcFxuICAgIGNvbnN0IHBhcmVudEZvbGRlciA9IHBhcmVudEZpbGUucGFyZW50Py5wYXRoID8/IFwiXCI7XG4gICAgY29uc3QgY29uZmlndXJlZEFzc2V0cyA9IG5vcm1hbGl6ZVBhdGgodGhpcy5zZXR0aW5ncy5hc3NldEZvbGRlciB8fCBcIk1pbmRNYXAgQXNzZXRzXCIpO1xuICAgIGNvbnN0IHBhcmVudE1hcEZvbGRlciA9IHRoaXMuc2FuaXRpemVGaWxlbmFtZShwYXJlbnRGaWxlLmJhc2VuYW1lKTtcbiAgICBjb25zdCBzdWJtYXBGb2xkZXIgPSBub3JtYWxpemVQYXRoKFtwYXJlbnRGb2xkZXIsIGNvbmZpZ3VyZWRBc3NldHMsIHBhcmVudE1hcEZvbGRlcl0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCIvXCIpKTtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlclBhdGgoc3VibWFwRm9sZGVyKTtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy5nZXRBdmFpbGFibGVQYXRoKG5vcm1hbGl6ZVBhdGgoYCR7c3VibWFwRm9sZGVyfS8ke3RoaXMuc2FuaXRpemVGaWxlbmFtZSh0aXRsZSl9LiR7TUlORE1BUF9FWFRFTlNJT059YCkpO1xuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpKTtcbiAgICByZXR1cm4geyBwYXRoOiBmaWxlLnBhdGgsIHRpdGxlOiBmaWxlLmJhc2VuYW1lIH07XG4gIH1cblxuICBhc3luYyBvcGVuTWluZE1hcFBhdGgocGF0aDogc3RyaW5nLCBzb3VyY2VQYXRoID0gXCJcIiwgcHJlZmVycmVkTGVhZj86IFdvcmtzcGFjZUxlYWYsIGZvY3VzTm9kZUlkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgocGF0aC5yZXBsYWNlKC9eXFxbXFxbfFxcXVxcXSQvZywgXCJcIikpO1xuICAgIGNvbnN0IGRpcmVjdCA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcbiAgICBjb25zdCByZXNvbHZlZCA9IGRpcmVjdCBpbnN0YW5jZW9mIFRGaWxlID8gZGlyZWN0IDogdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChwYXRoLCBzb3VyY2VQYXRoKTtcbiAgICBpZiAoIShyZXNvbHZlZCBpbnN0YW5jZW9mIFRGaWxlKSB8fCAhdGhpcy5pc01pbmRNYXBGaWxlKHJlc29sdmVkKSkge1xuICAgICAgbmV3IE5vdGljZShgXHU2MjdFXHU0RTBEXHU1MjMwXHU1QjUwXHU1QkZDXHU1NkZFXHVGRjFBJHtwYXRofWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLm9wZW5Bc01pbmRNYXAocmVzb2x2ZWQsIHByZWZlcnJlZExlYWYsIGZvY3VzTm9kZUlkKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyUGF0aChmb2xkZXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZvbGRlcik7XG4gICAgaWYgKCFub3JtYWxpemVkIHx8IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSBpbnN0YW5jZW9mIFRGb2xkZXIpIHJldHVybjtcbiAgICBjb25zdCBwYXJ0cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgICBsZXQgY3VycmVudCA9IFwiXCI7XG4gICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4gICAgICBjdXJyZW50ID0gY3VycmVudCA/IGAke2N1cnJlbnR9LyR7cGFydH1gIDogcGFydDtcbiAgICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGN1cnJlbnQpKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoY3VycmVudCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbWlncmF0ZUxlZ2FjeUZpbGUoZmlsZTogVEZpbGUsIG9wZW5BZnRlciA9IHRydWUpOiBQcm9taXNlPFRGaWxlIHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKSByZXR1cm4gbnVsbDtcbiAgICBpZiAodGhpcy5sZWdhY3lNaWdyYXRpb25QYXRoID09PSBmaWxlLnBhdGgpIHJldHVybiBudWxsO1xuICAgIHRoaXMubGVnYWN5TWlncmF0aW9uUGF0aCA9IGZpbGUucGF0aDtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc291cmNlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICAgIGNvbnN0IHRpdGxlID0gZmlsZS5iYXNlbmFtZS5yZXBsYWNlKC9cXC5zbW0kL2ksIFwiXCIpIHx8IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCI7XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHBhcnNlRG9jdW1lbnQoc291cmNlLCB0aXRsZSk7XG4gICAgICBjb25zdCBwYXJlbnRQYXRoID0gZmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICAgIGNvbnN0IHByZWZlcnJlZFBhdGggPSBub3JtYWxpemVQYXRoKGAke3BhcmVudFBhdGggPyBgJHtwYXJlbnRQYXRofS9gIDogXCJcIn0ke3RoaXMuc2FuaXRpemVGaWxlbmFtZSh0aXRsZSl9LiR7TUlORE1BUF9FWFRFTlNJT059YCk7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwcmVmZXJyZWRQYXRoKTtcbiAgICAgIGxldCB0YXJnZXQ6IFRGaWxlO1xuXG4gICAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSAmJiB0aGlzLmlzTWluZE1hcEZpbGUoZXhpc3RpbmcpKSB7XG4gICAgICAgIHRhcmdldCA9IGV4aXN0aW5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGV4aXN0aW5nID8gYXdhaXQgdGhpcy5nZXRBdmFpbGFibGVQYXRoKHByZWZlcnJlZFBhdGgpIDogcHJlZmVycmVkUGF0aDtcbiAgICAgICAgdGFyZ2V0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50KSk7XG4gICAgICAgIG5ldyBOb3RpY2UoYFx1NURGMlx1OEY2Q1x1NjM2Mlx1NEUzQVx1NTNFRlx1N0YxNlx1OEY5MVx1ODExMVx1NTZGRVx1RkYxQSR7dGFyZ2V0LnBhdGh9XFxuXHU1MzlGXHU2NTg3XHU0RUY2XHU1REYyXHU0RkREXHU3NTU5XHU0RjVDXHU0RTNBXHU1OTA3XHU0RUZEXHUzMDAyYCwgNzAwMCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcGVuQWZ0ZXIpIGF3YWl0IHRoaXMub3BlbkFzTWluZE1hcCh0YXJnZXQsIHRoaXMuYXBwLndvcmtzcGFjZS5hY3RpdmVMZWFmID8/IHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gbGVnYWN5IG1pZ3JhdGlvbiBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShcIlx1NjVFN1x1NzI0OFx1ODExMVx1NTZGRVx1OEY2Q1x1NjM2Mlx1NTkzMVx1OEQyNVx1RkYwQ1x1NTM5Rlx1NjU4N1x1NEVGNlx1NjcyQVx1ODhBQlx1NEZFRVx1NjUzOVx1MzAwMlwiLCA2MDAwKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmxlZ2FjeU1pZ3JhdGlvblBhdGggPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGlzTWluZE1hcEZpbGUoZmlsZTogVEZpbGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKSA9PT0gTUlORE1BUF9FWFRFTlNJT047XG4gIH1cblxuICBpc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGU6IFRGaWxlKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZpbGUucGF0aC50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKExFR0FDWV9TVUZGSVgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb252ZXJ0TWFya2Rvd25GaWxlKGZpbGU6IFRGaWxlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc291cmNlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCB0aXRsZSA9IGZpbGUuYmFzZW5hbWU7XG4gICAgY29uc3QgZG9jdW1lbnQgPSBtYXJrZG93blRvRG9jdW1lbnQoc291cmNlLCB0aXRsZSk7XG4gICAgZG9jdW1lbnQubGF5b3V0ID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0TGF5b3V0O1xuICAgIGRvY3VtZW50LnRoZW1lID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0VGhlbWU7XG4gICAgZG9jdW1lbnQuYXBwZWFyYW5jZSA9IHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpO1xuICAgIGF3YWl0IHRoaXMuY3JlYXRlTWluZE1hcCh7IGRvY3VtZW50LCB0aXRsZTogYCR7dGl0bGV9IFx1ODExMVx1NTZGRWAsIGZvbGRlcjogZmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIiB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVzb2x2ZUZvbGRlcihleHBsaWNpdEZvbGRlcjogc3RyaW5nIHwgdW5kZWZpbmVkLCBhY3RpdmVGaWxlOiBURmlsZSB8IG51bGwpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGV4cGxpY2l0Rm9sZGVyID8/ICh0aGlzLnNldHRpbmdzLmRlZmF1bHRGb2xkZXIgfHwgYWN0aXZlRmlsZT8ucGFyZW50Py5wYXRoIHx8IFwiXCIpO1xuICAgIGlmICghY2FuZGlkYXRlKSByZXR1cm4gXCJcIjtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChjYW5kaWRhdGUpO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHJldHVybiBub3JtYWxpemVkO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyUGF0aChub3JtYWxpemVkKTtcbiAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGROZXdUaXRsZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgdHdvID0gKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcgPT4gU3RyaW5nKHZhbHVlKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgY29uc3Qgc3RhbXAgPSBgJHtub3cuZ2V0RnVsbFllYXIoKX0tJHt0d28obm93LmdldE1vbnRoKCkgKyAxKX0tJHt0d28obm93LmdldERhdGUoKSl9ICR7dHdvKG5vdy5nZXRIb3VycygpKX0ke3R3byhub3cuZ2V0TWludXRlcygpKX1gO1xuICAgIHJldHVybiBgJHt0aGlzLnNldHRpbmdzLmZpbGVQcmVmaXh9ICR7c3RhbXB9YC50cmltKCk7XG4gIH1cblxuICBwcml2YXRlIHNhbml0aXplRmlsZW5hbWUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1tcXFxcLzoqP1wiPD58I1tcXF1dL2csIFwiLVwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCkgfHwgXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U291cmNlVGl0bGUoY29udGV4dDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCk6IHN0cmluZyB7XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjb250ZXh0LnNvdXJjZVBhdGgpO1xuICAgIHJldHVybiBzb3VyY2VGaWxlIGluc3RhbmNlb2YgVEZpbGUgPyBzb3VyY2VGaWxlLmJhc2VuYW1lIDogXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcHJvY2Vzc01pbmRNYXBFbWJlZHMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNvbnRleHQ6IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbWJlZHMgPSBBcnJheS5mcm9tKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCIuaW50ZXJuYWwtZW1iZWRcIikpO1xuICAgIGZvciAoY29uc3QgZW1iZWQgb2YgZW1iZWRzKSB7XG4gICAgICBpZiAoZW1iZWQuZGF0YXNldC5tbWNQcm9jZXNzZWQgPT09IFwidHJ1ZVwiKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHJhd1NvdXJjZSA9IGVtYmVkLmdldEF0dHJpYnV0ZShcInNyY1wiKSA/PyBlbWJlZC5kYXRhc2V0LnNyYyA/PyBcIlwiO1xuICAgICAgY29uc3QgbGlua1BhdGggPSByYXdTb3VyY2Uuc3BsaXQoXCIjXCIpWzBdPy5zcGxpdChcInxcIilbMF0/LnRyaW0oKSA/PyBcIlwiO1xuICAgICAgaWYgKCFsaW5rUGF0aC50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKGAuJHtNSU5ETUFQX0VYVEVOU0lPTn1gKSkgY29udGludWU7XG4gICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChsaW5rUGF0aCwgY29udGV4dC5zb3VyY2VQYXRoKTtcbiAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkgfHwgIXRoaXMuaXNNaW5kTWFwRmlsZShmaWxlKSkgY29udGludWU7XG4gICAgICBlbWJlZC5kYXRhc2V0Lm1tY1Byb2Nlc3NlZCA9IFwidHJ1ZVwiO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc291cmNlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnQgPSBwYXJzZURvY3VtZW50KHNvdXJjZSwgZmlsZS5iYXNlbmFtZSk7XG4gICAgICAgIHJlbmRlclN0YXRpY01pbmRNYXAoZW1iZWQsIGRvY3VtZW50LCB7IGFwcDogdGhpcy5hcHAsIGZpbGUsIG1heEhlaWdodDogdGhpcy5zZXR0aW5ncy5lbWJlZE1heEhlaWdodCwgZGVmYXVsdEFwcGVhcmFuY2U6IHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGVtYmVkIHJlbmRlciBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgICBlbWJlZC5lbXB0eSgpO1xuICAgICAgICBlbWJlZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWVtYmVkLWVycm9yXCIsIHRleHQ6IFwiXHU2NUUwXHU2Q0Q1XHU1MkEwXHU4RjdEXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU5ODg0XHU4OUM4XCIgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCAiZXhwb3J0IHR5cGUgTGF5b3V0TW9kZSA9IFwicmlnaHRcIiB8IFwiYmFsYW5jZWRcIjtcbmV4cG9ydCB0eXBlIFRoZW1lTW9kZSA9IFwiYXV0b1wiIHwgXCJsaWdodFwiIHwgXCJkYXJrXCI7XG5leHBvcnQgdHlwZSBOb2RlU2hhcGUgPSBcInJvdW5kZWRcIiB8IFwicGlsbFwiIHwgXCJyZWN0YW5nbGVcIjtcbmV4cG9ydCB0eXBlIFRhc2tTdGF0dXMgPSBcInRvZG9cIiB8IFwiZG9pbmdcIiB8IFwiZG9uZVwiO1xuZXhwb3J0IHR5cGUgQmFja2dyb3VuZFBhdHRlcm4gPSBcIm5vbmVcIiB8IFwiZ3JpZFwiIHwgXCJkb3RzXCI7XG5leHBvcnQgdHlwZSBFZGdlU3R5bGUgPSBcImN1cnZlZFwiIHwgXCJzdHJhaWdodFwiIHwgXCJlbGJvd1wiO1xuZXhwb3J0IHR5cGUgRm9udEZhbWlseU1vZGUgPSBcIm9ic2lkaWFuXCIgfCBcInNhbnNcIiB8IFwic2VyaWZcIiB8IFwibW9ub1wiIHwgXCJjdXN0b21cIjtcbmV4cG9ydCB0eXBlIFRhYmxlQWxpZ25tZW50ID0gXCJsZWZ0XCIgfCBcImNlbnRlclwiIHwgXCJyaWdodFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBUZXh0U3R5bGUge1xuICBib2xkPzogYm9vbGVhbjtcbiAgaXRhbGljPzogYm9vbGVhbjtcbiAgdW5kZXJsaW5lPzogYm9vbGVhbjtcbiAgc3RyaWtlPzogYm9vbGVhbjtcbiAgY29sb3I/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFRleHRSdW4ge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0eWxlPzogTWluZE1hcFRleHRTdHlsZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwVGFibGUge1xuICBoZWFkZXJzOiBzdHJpbmdbXTtcbiAgcm93czogc3RyaW5nW11bXTtcbiAgYWxpZ25tZW50cz86IFRhYmxlQWxpZ25tZW50W107XG4gIHNvdXJjZT86IFwibWFudWFsXCIgfCBcIm1hcmtkb3duXCIgfCBcImNoaWxkcmVuXCI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcENvZGVCbG9jayB7XG4gIGxhbmd1YWdlPzogc3RyaW5nO1xuICBjb2RlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFRleHRDb250ZW50QmxvY2sge1xuICBpZDogc3RyaW5nO1xuICB0eXBlOiBcInRleHRcIjtcbiAgdGV4dDogc3RyaW5nO1xuICByaWNoVGV4dD86IE1pbmRNYXBUZXh0UnVuW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEltYWdlUmVtb3RlU291cmNlIHtcbiAgaG9zdElkOiBzdHJpbmc7XG4gIGhvc3ROYW1lPzogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbiAgdXBsb2FkZWRBdD86IHN0cmluZztcbiAgbGFzdFN1Y2Nlc3NBdD86IHN0cmluZztcbiAgbGFzdEZhaWx1cmVBdD86IHN0cmluZztcbiAgZmFpbHVyZUNvdW50PzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBJbWFnZVNvdXJjZUNhbmRpZGF0ZSB7XG4gIHNvdXJjZTogc3RyaW5nO1xuICBsYWJlbDogc3RyaW5nO1xuICBob3N0SWQ/OiBzdHJpbmc7XG4gIGhvc3ROYW1lPzogc3RyaW5nO1xuICBraW5kOiBcImN1cnJlbnRcIiB8IFwicmVtb3RlXCIgfCBcImxvY2FsXCI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEltYWdlQ29udGVudEJsb2NrIHtcbiAgaWQ6IHN0cmluZztcbiAgdHlwZTogXCJpbWFnZVwiO1xuICBzb3VyY2U6IHN0cmluZztcbiAgYWx0Pzogc3RyaW5nO1xuICAvKiogT3JpZ2luYWwgbG9jYWwgdmF1bHQgcGF0aCByZXRhaW5lZCB1bnRpbCBldmVyeSBzZWxlY3RlZCBpbWFnZSBob3N0IHN1Y2NlZWRzLiAqL1xuICBsb2NhbFNvdXJjZT86IHN0cmluZztcbiAgLyoqIE1pcnJvciBVUkxzIHJldHVybmVkIGJ5IG9uZSBvciBtb3JlIGNvbmZpZ3VyZWQgaW1hZ2UgaG9zdHMuICovXG4gIHJlbW90ZVNvdXJjZXM/OiBNaW5kTWFwSW1hZ2VSZW1vdGVTb3VyY2VbXTtcbn1cblxuZXhwb3J0IHR5cGUgTWluZE1hcENvbnRlbnRCbG9jayA9IE1pbmRNYXBUZXh0Q29udGVudEJsb2NrIHwgTWluZE1hcEltYWdlQ29udGVudEJsb2NrO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBTdWJtYXAge1xuICBwYXRoOiBzdHJpbmc7XG4gIHRpdGxlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBOYXZpZ2F0aW9uIHtcbiAgcGFyZW50UGF0aDogc3RyaW5nO1xuICBwYXJlbnROb2RlSWQ/OiBzdHJpbmc7XG4gIHBhcmVudFRpdGxlPzogc3RyaW5nO1xuICBwYXJlbnROb2RlVGV4dD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwQXBwZWFyYW5jZSB7XG4gIGJhY2tncm91bmRDb2xvcj86IHN0cmluZztcbiAgYmFja2dyb3VuZFBhdHRlcm4/OiBCYWNrZ3JvdW5kUGF0dGVybjtcbiAgcGF0dGVybkNvbG9yPzogc3RyaW5nO1xuICBmb250RmFtaWx5PzogRm9udEZhbWlseU1vZGU7XG4gIGN1c3RvbUZvbnQ/OiBzdHJpbmc7XG4gIGZvbnRTaXplPzogbnVtYmVyO1xuICBlZGdlQ29sb3I/OiBzdHJpbmc7XG4gIGVkZ2VXaWR0aD86IG51bWJlcjtcbiAgZWRnZVN0eWxlPzogRWRnZVN0eWxlO1xuICBub2RlQ29sb3I/OiBzdHJpbmc7XG4gIHRleHRDb2xvcj86IHN0cmluZztcbiAgbm9kZUJvcmRlckNvbG9yPzogc3RyaW5nO1xuICBub2RlQm9yZGVyV2lkdGg/OiBudW1iZXI7XG4gIGJvbGQ/OiBib29sZWFuO1xuICBpdGFsaWM/OiBib29sZWFuO1xuICB1bmRlcmxpbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBOb2RlU3R5bGUge1xuICBjb2xvcj86IHN0cmluZztcbiAgdGV4dENvbG9yPzogc3RyaW5nO1xuICBib3JkZXJDb2xvcj86IHN0cmluZztcbiAgYm9yZGVyV2lkdGg/OiBudW1iZXI7XG4gIHNoYXBlPzogTm9kZVNoYXBlO1xuICBib2xkPzogYm9vbGVhbjtcbiAgaXRhbGljPzogYm9vbGVhbjtcbiAgdW5kZXJsaW5lPzogYm9vbGVhbjtcbiAgZm9udFNpemU/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcE5vZGUge1xuICBpZDogc3RyaW5nO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHJpY2hUZXh0PzogTWluZE1hcFRleHRSdW5bXTtcbiAgLyoqIE9yZGVyZWQgdGV4dCBhbmQgaW1hZ2UgYmxvY2tzLiBMZWdhY3kgdGV4dC9yaWNoVGV4dC9pbWFnZSBmaWVsZHMgcmVtYWluIGZvciBjb21wYXRpYmlsaXR5LiAqL1xuICBjb250ZW50PzogTWluZE1hcENvbnRlbnRCbG9ja1tdO1xuICBub3RlPzogc3RyaW5nO1xuICBsaW5rPzogc3RyaW5nO1xuICBpbWFnZT86IHN0cmluZztcbiAgdGFibGU/OiBNaW5kTWFwVGFibGU7XG4gIGNvZGU/OiBNaW5kTWFwQ29kZUJsb2NrO1xuICBzdWJtYXA/OiBNaW5kTWFwU3VibWFwO1xuICBpY29uPzogc3RyaW5nO1xuICB0YWdzPzogc3RyaW5nW107XG4gIHRhc2s/OiBUYXNrU3RhdHVzO1xuICBzdHlsZT86IE1pbmRNYXBOb2RlU3R5bGU7XG4gIGNvbGxhcHNlZD86IGJvb2xlYW47XG4gIGNoaWxkcmVuOiBNaW5kTWFwTm9kZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBEb2N1bWVudCB7XG4gIHZlcnNpb246IDg7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGxheW91dDogTGF5b3V0TW9kZTtcbiAgdGhlbWU6IFRoZW1lTW9kZTtcbiAgYXBwZWFyYW5jZT86IE1pbmRNYXBBcHBlYXJhbmNlO1xuICBuYXZpZ2F0aW9uPzogTWluZE1hcE5hdmlnYXRpb247XG4gIHJvb3Q6IE1pbmRNYXBOb2RlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2tQcm9ncmVzcyB7XG4gIGRvbmU6IG51bWJlcjtcbiAgdG90YWw6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IE1JTkRNQVBfQ09ERV9CTE9DSyA9IFwibWluZG1hcC1qc29uXCI7XG5jb25zdCBMRUdBQ1lfQ09ERV9CTE9DS1MgPSBbXCJzbW0tanNvblwiLCBcIm1tYy1qc29uXCJdIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gbmV3SWQoKTogc3RyaW5nIHtcbiAgY29uc3QgcmFuZG9tID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgOSk7XG4gIHJldHVybiBgbl8ke0RhdGUubm93KCkudG9TdHJpbmcoMzYpfV8ke3JhbmRvbX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZSh0ZXh0ID0gXCJcdTY1QjBcdTgyODJcdTcwQjlcIik6IE1pbmRNYXBOb2RlIHtcbiAgcmV0dXJuIHsgaWQ6IG5ld0lkKCksIHRleHQsIGNoaWxkcmVuOiBbXSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGVmYXVsdERvY3VtZW50KHRpdGxlID0gXCJcdTY1QjBcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik6IE1pbmRNYXBEb2N1bWVudCB7XG4gIHJldHVybiB7XG4gICAgdmVyc2lvbjogOCxcbiAgICB0aXRsZSxcbiAgICBsYXlvdXQ6IFwicmlnaHRcIixcbiAgICB0aGVtZTogXCJhdXRvXCIsXG4gICAgcm9vdDoge1xuICAgICAgaWQ6IG5ld0lkKCksXG4gICAgICB0ZXh0OiB0aXRsZSxcbiAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgIHsgaWQ6IG5ld0lkKCksIHRleHQ6IFwiXHU0RTNCXHU5ODk4IDFcIiwgY2hpbGRyZW46IFtdIH0sXG4gICAgICAgIHsgaWQ6IG5ld0lkKCksIHRleHQ6IFwiXHU0RTNCXHU5ODk4IDJcIiwgY2hpbGRyZW46IFtdIH1cbiAgICAgIF1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbG9yKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgcmV0dXJuIC9eI1swLTlhLWZdezZ9JC9pLnRlc3QodHJpbW1lZCkgPyB0cmltbWVkIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOdW1iZXIodmFsdWU6IHVua25vd24sIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcik6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgIU51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdmFsdWUpKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKHZhbHVlOiB1bmtub3duKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFwcGVhcmFuY2UoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcEFwcGVhcmFuY2U+IHwgdW5kZWZpbmVkKTogTWluZE1hcEFwcGVhcmFuY2UgfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0KSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBiYWNrZ3JvdW5kUGF0dGVybjogQmFja2dyb3VuZFBhdHRlcm4gfCB1bmRlZmluZWQgPSBpbnB1dC5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJub25lXCIgfHwgaW5wdXQuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwiZ3JpZFwiIHx8IGlucHV0LmJhY2tncm91bmRQYXR0ZXJuID09PSBcImRvdHNcIlxuICAgID8gaW5wdXQuYmFja2dyb3VuZFBhdHRlcm5cbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3QgZm9udEZhbWlseTogRm9udEZhbWlseU1vZGUgfCB1bmRlZmluZWQgPSBpbnB1dC5mb250RmFtaWx5ID09PSBcIm9ic2lkaWFuXCIgfHwgaW5wdXQuZm9udEZhbWlseSA9PT0gXCJzYW5zXCIgfHwgaW5wdXQuZm9udEZhbWlseSA9PT0gXCJzZXJpZlwiIHx8IGlucHV0LmZvbnRGYW1pbHkgPT09IFwibW9ub1wiIHx8IGlucHV0LmZvbnRGYW1pbHkgPT09IFwiY3VzdG9tXCJcbiAgICA/IGlucHV0LmZvbnRGYW1pbHlcbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3QgZWRnZVN0eWxlOiBFZGdlU3R5bGUgfCB1bmRlZmluZWQgPSBpbnB1dC5lZGdlU3R5bGUgPT09IFwiY3VydmVkXCIgfHwgaW5wdXQuZWRnZVN0eWxlID09PSBcInN0cmFpZ2h0XCIgfHwgaW5wdXQuZWRnZVN0eWxlID09PSBcImVsYm93XCJcbiAgICA/IGlucHV0LmVkZ2VTdHlsZVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBjdXN0b21Gb250ID0gdHlwZW9mIGlucHV0LmN1c3RvbUZvbnQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQuY3VzdG9tRm9udC50cmltKClcbiAgICA/IGlucHV0LmN1c3RvbUZvbnQudHJpbSgpLnNsaWNlKDAsIDEyMClcbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3QgYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UgPSB7XG4gICAgYmFja2dyb3VuZENvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5iYWNrZ3JvdW5kQ29sb3IpLFxuICAgIGJhY2tncm91bmRQYXR0ZXJuLFxuICAgIHBhdHRlcm5Db2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQucGF0dGVybkNvbG9yKSxcbiAgICBmb250RmFtaWx5LFxuICAgIGN1c3RvbUZvbnQsXG4gICAgZm9udFNpemU6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5mb250U2l6ZSwgMTAsIDMwKSxcbiAgICBlZGdlQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LmVkZ2VDb2xvciksXG4gICAgZWRnZVdpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQuZWRnZVdpZHRoLCAwLjUsIDgpLFxuICAgIGVkZ2VTdHlsZSxcbiAgICBub2RlQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0Lm5vZGVDb2xvciksXG4gICAgdGV4dENvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC50ZXh0Q29sb3IpLFxuICAgIG5vZGVCb3JkZXJDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQubm9kZUJvcmRlckNvbG9yKSxcbiAgICBub2RlQm9yZGVyV2lkdGg6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5ub2RlQm9yZGVyV2lkdGgsIDAsIDYpLFxuICAgIGJvbGQ6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5ib2xkKSxcbiAgICBpdGFsaWM6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5pdGFsaWMpLFxuICAgIHVuZGVybGluZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnVuZGVybGluZSlcbiAgfTtcbiAgcmV0dXJuIE9iamVjdC52YWx1ZXMoYXBwZWFyYW5jZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gYXBwZWFyYW5jZSA6IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQXBwZWFyYW5jZShiYXNlOiBNaW5kTWFwQXBwZWFyYW5jZSB8IHVuZGVmaW5lZCwgb3ZlcnJpZGU6IE1pbmRNYXBBcHBlYXJhbmNlIHwgdW5kZWZpbmVkKTogTWluZE1hcEFwcGVhcmFuY2Uge1xuICByZXR1cm4geyAuLi4oYmFzZSA/PyB7fSksIC4uLihvdmVycmlkZSA/PyB7fSkgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU3R5bGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcE5vZGVTdHlsZT4gfCB1bmRlZmluZWQpOiBNaW5kTWFwTm9kZVN0eWxlIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3Qgc2hhcGU6IE5vZGVTaGFwZSB8IHVuZGVmaW5lZCA9IGlucHV0LnNoYXBlID09PSBcInBpbGxcIiB8fCBpbnB1dC5zaGFwZSA9PT0gXCJyZWN0YW5nbGVcIiB8fCBpbnB1dC5zaGFwZSA9PT0gXCJyb3VuZGVkXCJcbiAgICA/IGlucHV0LnNoYXBlXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHN0eWxlOiBNaW5kTWFwTm9kZVN0eWxlID0ge1xuICAgIGNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5jb2xvciksXG4gICAgdGV4dENvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC50ZXh0Q29sb3IpLFxuICAgIGJvcmRlckNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5ib3JkZXJDb2xvciksXG4gICAgYm9yZGVyV2lkdGg6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5ib3JkZXJXaWR0aCwgMCwgNiksXG4gICAgc2hhcGUsXG4gICAgYm9sZDogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LmJvbGQpLFxuICAgIGl0YWxpYzogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0Lml0YWxpYyksXG4gICAgdW5kZXJsaW5lOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQudW5kZXJsaW5lKSxcbiAgICBmb250U2l6ZTogbm9ybWFsaXplTnVtYmVyKGlucHV0LmZvbnRTaXplLCAxMCwgMzIpXG4gIH07XG4gIHJldHVybiBPYmplY3QudmFsdWVzKHN0eWxlKS5zb21lKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCkgPyBzdHlsZSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGV4dFN0eWxlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBUZXh0U3R5bGU+IHwgdW5kZWZpbmVkKTogTWluZE1hcFRleHRTdHlsZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHN0eWxlOiBNaW5kTWFwVGV4dFN0eWxlID0ge1xuICAgIGJvbGQ6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5ib2xkKSxcbiAgICBpdGFsaWM6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5pdGFsaWMpLFxuICAgIHVuZGVybGluZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnVuZGVybGluZSksXG4gICAgc3RyaWtlOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuc3RyaWtlKSxcbiAgICBjb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuY29sb3IpXG4gIH07XG4gIHJldHVybiBPYmplY3QudmFsdWVzKHN0eWxlKS5zb21lKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCkgPyBzdHlsZSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gdGV4dFN0eWxlS2V5KHN0eWxlOiBNaW5kTWFwVGV4dFN0eWxlIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN0eWxlID8/IHt9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVJpY2hUZXh0KGlucHV0OiB1bmtub3duLCBmYWxsYmFja1RleHQgPSBcIlwiKTogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCB7XG4gIGlmICghQXJyYXkuaXNBcnJheShpbnB1dCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgZm9yIChjb25zdCByYXcgb2YgaW5wdXQuc2xpY2UoMCwgNTAwKSkge1xuICAgIGlmICghcmF3IHx8IHR5cGVvZiByYXcgIT09IFwib2JqZWN0XCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IHJhdyBhcyBQYXJ0aWFsPE1pbmRNYXBUZXh0UnVuPjtcbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZS50ZXh0ICE9PSBcInN0cmluZ1wiIHx8ICFjYW5kaWRhdGUudGV4dCkgY29udGludWU7XG4gICAgY29uc3QgdGV4dCA9IGNhbmRpZGF0ZS50ZXh0LnJlcGxhY2UoL1xccj9cXG4vZywgXCIgXCIpLnNsaWNlKDAsIDEwMDAwKTtcbiAgICBpZiAoIXRleHQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHN0eWxlID0gbm9ybWFsaXplVGV4dFN0eWxlKGNhbmRpZGF0ZS5zdHlsZSk7XG4gICAgY29uc3QgcHJldmlvdXMgPSBydW5zLmF0KC0xKTtcbiAgICBpZiAocHJldmlvdXMgJiYgdGV4dFN0eWxlS2V5KHByZXZpb3VzLnN0eWxlKSA9PT0gdGV4dFN0eWxlS2V5KHN0eWxlKSkgcHJldmlvdXMudGV4dCArPSB0ZXh0O1xuICAgIGVsc2UgcnVucy5wdXNoKHsgdGV4dCwgc3R5bGUgfSk7XG4gIH1cbiAgaWYgKCFydW5zLmxlbmd0aCkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICBjb25zdCBjb21iaW5lZCA9IHJ1bnMubWFwKChydW4pID0+IHJ1bi50ZXh0KS5qb2luKFwiXCIpO1xuICBjb25zdCBsZWFkaW5nID0gY29tYmluZWQubGVuZ3RoIC0gY29tYmluZWQudHJpbVN0YXJ0KCkubGVuZ3RoO1xuICBjb25zdCB0cmFpbGluZyA9IGNvbWJpbmVkLmxlbmd0aCAtIGNvbWJpbmVkLnRyaW1FbmQoKS5sZW5ndGg7XG4gIGlmIChsZWFkaW5nIHx8IHRyYWlsaW5nKSB7XG4gICAgbGV0IHN0YXJ0ID0gbGVhZGluZztcbiAgICBsZXQgcmVtYWluaW5nID0gY29tYmluZWQubGVuZ3RoIC0gbGVhZGluZyAtIHRyYWlsaW5nO1xuICAgIGNvbnN0IHRyaW1tZWQ6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHJ1biBvZiBydW5zKSB7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIGJyZWFrO1xuICAgICAgY29uc3Qgc2tpcCA9IE1hdGgubWluKHN0YXJ0LCBydW4udGV4dC5sZW5ndGgpO1xuICAgICAgc3RhcnQgLT0gc2tpcDtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IHJ1bi50ZXh0Lmxlbmd0aCAtIHNraXA7XG4gICAgICBpZiAoYXZhaWxhYmxlIDw9IDApIGNvbnRpbnVlO1xuICAgICAgY29uc3QgdGFrZSA9IE1hdGgubWluKGF2YWlsYWJsZSwgcmVtYWluaW5nKTtcbiAgICAgIGNvbnN0IHRleHQgPSBydW4udGV4dC5zbGljZShza2lwLCBza2lwICsgdGFrZSk7XG4gICAgICByZW1haW5pbmcgLT0gdGFrZTtcbiAgICAgIGlmICh0ZXh0KSB0cmltbWVkLnB1c2goeyB0ZXh0LCBzdHlsZTogcnVuLnN0eWxlIH0pO1xuICAgIH1cbiAgICBydW5zLnNwbGljZSgwLCBydW5zLmxlbmd0aCwgLi4udHJpbW1lZCk7XG4gIH1cblxuICBpZiAoIXJ1bnMubGVuZ3RoKSByZXR1cm4gZmFsbGJhY2tUZXh0LnRyaW0oKSA/IFt7IHRleHQ6IGZhbGxiYWNrVGV4dC50cmltKCkgfV0gOiB1bmRlZmluZWQ7XG4gIHJldHVybiBydW5zLnNvbWUoKHJ1bikgPT4gcnVuLnN0eWxlICYmIE9iamVjdC52YWx1ZXMocnVuLnN0eWxlKS5zb21lKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCkpID8gcnVucyA6IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJpY2hUZXh0UGxhaW5UZXh0KHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dCA9IFwiXCIpOiBzdHJpbmcge1xuICByZXR1cm4gcnVucz8ubWFwKChydW4pID0+IHJ1bi50ZXh0KS5qb2luKFwiXCIpID8/IGZhbGxiYWNrVGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzKHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dCA9IFwiXCIpOiBNaW5kTWFwVGV4dFN0eWxlW10ge1xuICBjb25zdCB0ZXh0ID0gcmljaFRleHRQbGFpblRleHQocnVucywgZmFsbGJhY2tUZXh0KTtcbiAgY29uc3Qgc3R5bGVzOiBNaW5kTWFwVGV4dFN0eWxlW10gPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiB0ZXh0Lmxlbmd0aCB9LCAoKSA9PiAoe30pKTtcbiAgaWYgKCFydW5zPy5sZW5ndGgpIHJldHVybiBzdHlsZXM7XG4gIGxldCBvZmZzZXQgPSAwO1xuICBmb3IgKGNvbnN0IHJ1biBvZiBydW5zKSB7XG4gICAgY29uc3Qgc3R5bGUgPSBydW4uc3R5bGUgPyB7IC4uLnJ1bi5zdHlsZSB9IDoge307XG4gICAgY29uc3QgZW5kID0gTWF0aC5taW4odGV4dC5sZW5ndGgsIG9mZnNldCArIHJ1bi50ZXh0Lmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSBvZmZzZXQ7IGluZGV4IDwgZW5kOyBpbmRleCArPSAxKSBzdHlsZXNbaW5kZXhdID0geyAuLi5zdHlsZSB9O1xuICAgIG9mZnNldCA9IGVuZDtcbiAgfVxuICByZXR1cm4gc3R5bGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dCh0ZXh0OiBzdHJpbmcsIHN0eWxlczogTWluZE1hcFRleHRTdHlsZVtdKTogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCB7XG4gIGlmICghdGV4dCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgcnVuczogTWluZE1hcFRleHRSdW5bXSA9IFtdO1xuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgY3VycmVudCA9IG5vcm1hbGl6ZVRleHRTdHlsZShzdHlsZXNbMF0pO1xuICBmb3IgKGxldCBpbmRleCA9IDE7IGluZGV4IDw9IHRleHQubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgbmV4dCA9IGluZGV4IDwgdGV4dC5sZW5ndGggPyBub3JtYWxpemVUZXh0U3R5bGUoc3R5bGVzW2luZGV4XSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKGluZGV4IDwgdGV4dC5sZW5ndGggJiYgdGV4dFN0eWxlS2V5KGN1cnJlbnQpID09PSB0ZXh0U3R5bGVLZXkobmV4dCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHNlZ21lbnQgPSB0ZXh0LnNsaWNlKHN0YXJ0LCBpbmRleCk7XG4gICAgaWYgKHNlZ21lbnQpIHJ1bnMucHVzaCh7IHRleHQ6IHNlZ21lbnQsIHN0eWxlOiBjdXJyZW50IH0pO1xuICAgIHN0YXJ0ID0gaW5kZXg7XG4gICAgY3VycmVudCA9IG5leHQ7XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZVJpY2hUZXh0KHJ1bnMsIHRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVjb25jaWxlUmljaFRleHRBZnRlckVkaXQoXG4gIHByZXZpb3VzVGV4dDogc3RyaW5nLFxuICBwcmV2aW91c1J1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsXG4gIG5leHRUZXh0OiBzdHJpbmdcbik6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBpZiAocHJldmlvdXNUZXh0ID09PSBuZXh0VGV4dCkgcmV0dXJuIG5vcm1hbGl6ZVJpY2hUZXh0KHByZXZpb3VzUnVucywgbmV4dFRleHQpO1xuICBjb25zdCBwcmV2aW91c1N0eWxlcyA9IHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzKHByZXZpb3VzUnVucywgcHJldmlvdXNUZXh0KTtcbiAgY29uc3QgbmV4dFN0eWxlczogTWluZE1hcFRleHRTdHlsZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogbmV4dFRleHQubGVuZ3RoIH0sICgpID0+ICh7fSkpO1xuICBsZXQgcHJlZml4ID0gMDtcbiAgd2hpbGUgKHByZWZpeCA8IHByZXZpb3VzVGV4dC5sZW5ndGggJiYgcHJlZml4IDwgbmV4dFRleHQubGVuZ3RoICYmIHByZXZpb3VzVGV4dFtwcmVmaXhdID09PSBuZXh0VGV4dFtwcmVmaXhdKSBwcmVmaXggKz0gMTtcbiAgbGV0IHN1ZmZpeCA9IDA7XG4gIHdoaWxlIChcbiAgICBzdWZmaXggPCBwcmV2aW91c1RleHQubGVuZ3RoIC0gcHJlZml4XG4gICAgJiYgc3VmZml4IDwgbmV4dFRleHQubGVuZ3RoIC0gcHJlZml4XG4gICAgJiYgcHJldmlvdXNUZXh0W3ByZXZpb3VzVGV4dC5sZW5ndGggLSAxIC0gc3VmZml4XSA9PT0gbmV4dFRleHRbbmV4dFRleHQubGVuZ3RoIC0gMSAtIHN1ZmZpeF1cbiAgKSBzdWZmaXggKz0gMTtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHByZWZpeDsgaW5kZXggKz0gMSkgbmV4dFN0eWxlc1tpbmRleF0gPSB7IC4uLihwcmV2aW91c1N0eWxlc1tpbmRleF0gPz8ge30pIH07XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBzdWZmaXg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBwcmV2aW91c0luZGV4ID0gcHJldmlvdXNUZXh0Lmxlbmd0aCAtIHN1ZmZpeCArIGluZGV4O1xuICAgIGNvbnN0IG5leHRJbmRleCA9IG5leHRUZXh0Lmxlbmd0aCAtIHN1ZmZpeCArIGluZGV4O1xuICAgIG5leHRTdHlsZXNbbmV4dEluZGV4XSA9IHsgLi4uKHByZXZpb3VzU3R5bGVzW3ByZXZpb3VzSW5kZXhdID8/IHt9KSB9O1xuICB9XG4gIHJldHVybiBjaGFyYWN0ZXJTdHlsZXNUb1JpY2hUZXh0KG5leHRUZXh0LCBuZXh0U3R5bGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UmljaFRleHRTdHlsZVJhbmdlKFxuICB0ZXh0OiBzdHJpbmcsXG4gIHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsXG4gIHN0YXJ0OiBudW1iZXIsXG4gIGVuZDogbnVtYmVyLFxuICBwYXRjaDogUGFydGlhbDxNaW5kTWFwVGV4dFN0eWxlPiB8IG51bGxcbik6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBjb25zdCBzYWZlU3RhcnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbih0ZXh0Lmxlbmd0aCwgTWF0aC5mbG9vcihzdGFydCkpKTtcbiAgY29uc3Qgc2FmZUVuZCA9IE1hdGgubWF4KHNhZmVTdGFydCwgTWF0aC5taW4odGV4dC5sZW5ndGgsIE1hdGguZmxvb3IoZW5kKSkpO1xuICBpZiAoc2FmZVN0YXJ0ID09PSBzYWZlRW5kKSByZXR1cm4gbm9ybWFsaXplUmljaFRleHQocnVucywgdGV4dCk7XG4gIGNvbnN0IHN0eWxlcyA9IHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzKHJ1bnMsIHRleHQpO1xuICBmb3IgKGxldCBpbmRleCA9IHNhZmVTdGFydDsgaW5kZXggPCBzYWZlRW5kOyBpbmRleCArPSAxKSB7XG4gICAgaWYgKHBhdGNoID09PSBudWxsKSBzdHlsZXNbaW5kZXhdID0ge307XG4gICAgZWxzZSBzdHlsZXNbaW5kZXhdID0geyAuLi5zdHlsZXNbaW5kZXhdLCAuLi5wYXRjaCB9O1xuICB9XG4gIHJldHVybiBjaGFyYWN0ZXJTdHlsZXNUb1JpY2hUZXh0KHRleHQsIHN0eWxlcyk7XG59XG5cblxuZnVuY3Rpb24gbm9ybWFsaXplQ29udGVudEJsb2NrKGlucHV0OiB1bmtub3duKTogTWluZE1hcENvbnRlbnRCbG9jayB8IG51bGwge1xuICBpZiAoIWlucHV0IHx8IHR5cGVvZiBpbnB1dCAhPT0gXCJvYmplY3RcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGlucHV0IGFzIFBhcnRpYWw8TWluZE1hcENvbnRlbnRCbG9jaz47XG4gIGNvbnN0IGlkID0gdHlwZW9mIGNhbmRpZGF0ZS5pZCA9PT0gXCJzdHJpbmdcIiAmJiBjYW5kaWRhdGUuaWQudHJpbSgpID8gY2FuZGlkYXRlLmlkLnRyaW0oKS5zbGljZSgwLCAxNjApIDogbmV3SWQoKTtcbiAgaWYgKGNhbmRpZGF0ZS50eXBlID09PSBcImltYWdlXCIpIHtcbiAgICBjb25zdCBpbWFnZSA9IGNhbmRpZGF0ZSBhcyBQYXJ0aWFsPE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jaz47XG4gICAgY29uc3Qgc291cmNlID0gdHlwZW9mIGltYWdlLnNvdXJjZSA9PT0gXCJzdHJpbmdcIiA/IGltYWdlLnNvdXJjZS50cmltKCkuc2xpY2UoMCwgMjAwMCkgOiBcIlwiO1xuICAgIGlmICghc291cmNlKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBhbHQgPSB0eXBlb2YgaW1hZ2UuYWx0ID09PSBcInN0cmluZ1wiICYmIGltYWdlLmFsdC50cmltKCkgPyBpbWFnZS5hbHQudHJpbSgpLnNsaWNlKDAsIDUwMCkgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgbG9jYWxTb3VyY2UgPSB0eXBlb2YgaW1hZ2UubG9jYWxTb3VyY2UgPT09IFwic3RyaW5nXCIgJiYgaW1hZ2UubG9jYWxTb3VyY2UudHJpbSgpXG4gICAgICA/IGltYWdlLmxvY2FsU291cmNlLnRyaW0oKS5zbGljZSgwLCAyMDAwKVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgcmVtb3RlU291cmNlcyA9IEFycmF5LmlzQXJyYXkoaW1hZ2UucmVtb3RlU291cmNlcylcbiAgICAgID8gaW1hZ2UucmVtb3RlU291cmNlcy5zbGljZSgwLCAxMikuZmxhdE1hcCgocmF3KSA9PiB7XG4gICAgICAgIGlmICghcmF3IHx8IHR5cGVvZiByYXcgIT09IFwib2JqZWN0XCIpIHJldHVybiBbXTtcbiAgICAgICAgY29uc3QgaXRlbSA9IHJhdyBhcyBQYXJ0aWFsPE1pbmRNYXBJbWFnZVJlbW90ZVNvdXJjZT47XG4gICAgICAgIGNvbnN0IGhvc3RJZCA9IHR5cGVvZiBpdGVtLmhvc3RJZCA9PT0gXCJzdHJpbmdcIiA/IGl0ZW0uaG9zdElkLnRyaW0oKS5zbGljZSgwLCAxNjApIDogXCJcIjtcbiAgICAgICAgY29uc3QgdXJsID0gdHlwZW9mIGl0ZW0udXJsID09PSBcInN0cmluZ1wiID8gaXRlbS51cmwudHJpbSgpLnNsaWNlKDAsIDQwMDApIDogXCJcIjtcbiAgICAgICAgaWYgKCFob3N0SWQgfHwgIS9eaHR0cHM/OlxcL1xcLy9pLnRlc3QodXJsKSkgcmV0dXJuIFtdO1xuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICBob3N0SWQsXG4gICAgICAgICAgaG9zdE5hbWU6IHR5cGVvZiBpdGVtLmhvc3ROYW1lID09PSBcInN0cmluZ1wiICYmIGl0ZW0uaG9zdE5hbWUudHJpbSgpID8gaXRlbS5ob3N0TmFtZS50cmltKCkuc2xpY2UoMCwgMjAwKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB1cmwsXG4gICAgICAgICAgdXBsb2FkZWRBdDogdHlwZW9mIGl0ZW0udXBsb2FkZWRBdCA9PT0gXCJzdHJpbmdcIiAmJiBpdGVtLnVwbG9hZGVkQXQudHJpbSgpID8gaXRlbS51cGxvYWRlZEF0LnRyaW0oKS5zbGljZSgwLCA4MCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgbGFzdFN1Y2Nlc3NBdDogdHlwZW9mIGl0ZW0ubGFzdFN1Y2Nlc3NBdCA9PT0gXCJzdHJpbmdcIiAmJiBpdGVtLmxhc3RTdWNjZXNzQXQudHJpbSgpID8gaXRlbS5sYXN0U3VjY2Vzc0F0LnRyaW0oKS5zbGljZSgwLCA4MCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgbGFzdEZhaWx1cmVBdDogdHlwZW9mIGl0ZW0ubGFzdEZhaWx1cmVBdCA9PT0gXCJzdHJpbmdcIiAmJiBpdGVtLmxhc3RGYWlsdXJlQXQudHJpbSgpID8gaXRlbS5sYXN0RmFpbHVyZUF0LnRyaW0oKS5zbGljZSgwLCA4MCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgZmFpbHVyZUNvdW50OiB0eXBlb2YgaXRlbS5mYWlsdXJlQ291bnQgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKGl0ZW0uZmFpbHVyZUNvdW50KVxuICAgICAgICAgICAgPyBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAwMDAwLCBNYXRoLmZsb29yKGl0ZW0uZmFpbHVyZUNvdW50KSkpXG4gICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICB9XTtcbiAgICAgIH0pXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgICByZXR1cm4geyBpZCwgdHlwZTogXCJpbWFnZVwiLCBzb3VyY2UsIGFsdCwgbG9jYWxTb3VyY2UsIHJlbW90ZVNvdXJjZXM6IHJlbW90ZVNvdXJjZXM/Lmxlbmd0aCA/IHJlbW90ZVNvdXJjZXMgOiB1bmRlZmluZWQgfTtcbiAgfVxuICBpZiAoY2FuZGlkYXRlLnR5cGUgPT09IFwidGV4dFwiKSB7XG4gICAgY29uc3QgZmFsbGJhY2tUZXh0ID0gdHlwZW9mIGNhbmRpZGF0ZS50ZXh0ID09PSBcInN0cmluZ1wiID8gY2FuZGlkYXRlLnRleHQucmVwbGFjZSgvXFxyP1xcbi9nLCBcIiBcIikuc2xpY2UoMCwgMjAwMDApIDogXCJcIjtcbiAgICBjb25zdCByaWNoVGV4dCA9IG5vcm1hbGl6ZVJpY2hUZXh0KGNhbmRpZGF0ZS5yaWNoVGV4dCwgZmFsbGJhY2tUZXh0KTtcbiAgICBjb25zdCB0ZXh0ID0gcmljaFRleHRQbGFpblRleHQocmljaFRleHQsIGZhbGxiYWNrVGV4dCk7XG4gICAgcmV0dXJuIHsgaWQsIHR5cGU6IFwidGV4dFwiLCB0ZXh0LCByaWNoVGV4dCB9O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1hZ2VTb3VyY2VDYW5kaWRhdGVzKGJsb2NrOiBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2ssIGluY2x1ZGVMb2NhbCA9IHRydWUpOiBNaW5kTWFwSW1hZ2VTb3VyY2VDYW5kaWRhdGVbXSB7XG4gIGNvbnN0IGNhbmRpZGF0ZXM6IE1pbmRNYXBJbWFnZVNvdXJjZUNhbmRpZGF0ZVtdID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgYWRkID0gKGNhbmRpZGF0ZTogTWluZE1hcEltYWdlU291cmNlQ2FuZGlkYXRlKTogdm9pZCA9PiB7XG4gICAgY29uc3Qgc291cmNlID0gY2FuZGlkYXRlLnNvdXJjZS50cmltKCk7XG4gICAgaWYgKCFzb3VyY2UgfHwgc2Vlbi5oYXMoc291cmNlKSkgcmV0dXJuO1xuICAgIHNlZW4uYWRkKHNvdXJjZSk7XG4gICAgY2FuZGlkYXRlcy5wdXNoKHsgLi4uY2FuZGlkYXRlLCBzb3VyY2UgfSk7XG4gIH07XG5cbiAgY29uc3QgY3VycmVudFJlbW90ZSA9IGJsb2NrLnJlbW90ZVNvdXJjZXM/LmZpbmQoKGl0ZW0pID0+IGl0ZW0udXJsID09PSBibG9jay5zb3VyY2UpO1xuICBhZGQoe1xuICAgIHNvdXJjZTogYmxvY2suc291cmNlLFxuICAgIGxhYmVsOiBjdXJyZW50UmVtb3RlPy5ob3N0TmFtZSB8fCAoY3VycmVudFJlbW90ZSA/IFwiXHU1RjUzXHU1MjREXHU1NkZFXHU1RThBXCIgOiBcIlx1NUY1M1x1NTI0RFx1NTZGRVx1NzI0N1wiKSxcbiAgICBob3N0SWQ6IGN1cnJlbnRSZW1vdGU/Lmhvc3RJZCxcbiAgICBob3N0TmFtZTogY3VycmVudFJlbW90ZT8uaG9zdE5hbWUsXG4gICAga2luZDogXCJjdXJyZW50XCJcbiAgfSk7XG4gIGNvbnN0IHJlbW90ZXMgPSBibG9jay5yZW1vdGVTb3VyY2VzID8/IFtdO1xuICBjb25zdCBjdXJyZW50SW5kZXggPSByZW1vdGVzLmZpbmRJbmRleCgoaXRlbSkgPT4gaXRlbS51cmwgPT09IGJsb2NrLnNvdXJjZSk7XG4gIGNvbnN0IG9yZGVyZWRSZW1vdGVzID0gY3VycmVudEluZGV4ID49IDBcbiAgICA/IFsuLi5yZW1vdGVzLnNsaWNlKGN1cnJlbnRJbmRleCArIDEpLCAuLi5yZW1vdGVzLnNsaWNlKDAsIGN1cnJlbnRJbmRleCldXG4gICAgOiByZW1vdGVzO1xuICBmb3IgKGNvbnN0IHJlbW90ZSBvZiBvcmRlcmVkUmVtb3Rlcykge1xuICAgIGFkZCh7XG4gICAgICBzb3VyY2U6IHJlbW90ZS51cmwsXG4gICAgICBsYWJlbDogcmVtb3RlLmhvc3ROYW1lIHx8IFwiXHU1OTA3XHU3NTI4XHU1NkZFXHU1RThBXCIsXG4gICAgICBob3N0SWQ6IHJlbW90ZS5ob3N0SWQsXG4gICAgICBob3N0TmFtZTogcmVtb3RlLmhvc3ROYW1lLFxuICAgICAga2luZDogXCJyZW1vdGVcIlxuICAgIH0pO1xuICB9XG4gIGlmIChpbmNsdWRlTG9jYWwgJiYgYmxvY2subG9jYWxTb3VyY2UpIHtcbiAgICBhZGQoeyBzb3VyY2U6IGJsb2NrLmxvY2FsU291cmNlLCBsYWJlbDogXCJcdTY3MkNcdTU3MzBcdTUyNkZcdTY3MkNcIiwga2luZDogXCJsb2NhbFwiIH0pO1xuICB9XG4gIHJldHVybiBjYW5kaWRhdGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZTogUGljazxNaW5kTWFwTm9kZSwgXCJjb250ZW50XCIgfCBcInRleHRcIiB8IFwicmljaFRleHRcIiB8IFwiaW1hZ2VcIj4pOiBNaW5kTWFwQ29udGVudEJsb2NrW10ge1xuICBpZiAoQXJyYXkuaXNBcnJheShub2RlLmNvbnRlbnQpICYmIG5vZGUuY29udGVudC5sZW5ndGgpIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9kZS5jb250ZW50Lm1hcChub3JtYWxpemVDb250ZW50QmxvY2spLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwQ29udGVudEJsb2NrID0+IEJvb2xlYW4oYmxvY2spKTtcbiAgICBpZiAobm9ybWFsaXplZC5sZW5ndGgpIHJldHVybiBub3JtYWxpemVkO1xuICB9XG4gIGNvbnN0IGJsb2NrczogTWluZE1hcENvbnRlbnRCbG9ja1tdID0gW107XG4gIGlmIChub2RlLmltYWdlPy50cmltKCkpIGJsb2Nrcy5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBub2RlLmltYWdlLnRyaW0oKSwgYWx0OiBub2RlLnRleHQgfHwgdW5kZWZpbmVkIH0pO1xuICBpZiAobm9kZS50ZXh0IHx8IG5vZGUucmljaFRleHQ/Lmxlbmd0aCkge1xuICAgIGNvbnN0IHJpY2hUZXh0ID0gbm9ybWFsaXplUmljaFRleHQobm9kZS5yaWNoVGV4dCwgbm9kZS50ZXh0KTtcbiAgICBibG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcInRleHRcIiwgdGV4dDogcmljaFRleHRQbGFpblRleHQocmljaFRleHQsIG5vZGUudGV4dCksIHJpY2hUZXh0IH0pO1xuICB9XG4gIHJldHVybiBibG9ja3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlUGxhaW5UZXh0KG5vZGU6IFBpY2s8TWluZE1hcE5vZGUsIFwiY29udGVudFwiIHwgXCJ0ZXh0XCIgfCBcInJpY2hUZXh0XCIgfCBcImltYWdlXCI+KTogc3RyaW5nIHtcbiAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gIHJldHVybiBibG9ja3MuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKS5tYXAoKGJsb2NrKSA9PiBibG9jay50ZXh0KS5qb2luKFwiIFwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzeW5jTm9kZUxlZ2FjeUZpZWxkcyhub2RlOiBNaW5kTWFwTm9kZSk6IHZvaWQge1xuICBjb25zdCBibG9ja3MgPSBub2RlQ29udGVudEJsb2Nrcyhub2RlKTtcbiAgbm9kZS5jb250ZW50ID0gYmxvY2tzLmxlbmd0aCA/IGJsb2NrcyA6IHVuZGVmaW5lZDtcbiAgY29uc3QgdGV4dEJsb2NrcyA9IGJsb2Nrcy5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcFRleHRDb250ZW50QmxvY2sgPT4gYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIpO1xuICBjb25zdCBpbWFnZUJsb2NrcyA9IGJsb2Nrcy5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIik7XG4gIG5vZGUudGV4dCA9IHRleHRCbG9ja3MubWFwKChibG9jaykgPT4gYmxvY2sudGV4dCkuam9pbihcIiBcIikudHJpbSgpO1xuICBub2RlLnJpY2hUZXh0ID0gdGV4dEJsb2Nrcy5sZW5ndGggPT09IDEgPyBub3JtYWxpemVSaWNoVGV4dCh0ZXh0QmxvY2tzWzBdPy5yaWNoVGV4dCwgdGV4dEJsb2Nrc1swXT8udGV4dCA/PyBcIlwiKSA6IHVuZGVmaW5lZDtcbiAgbm9kZS5pbWFnZSA9IGltYWdlQmxvY2tzWzBdPy5zb3VyY2U7XG59XG5cblxuZnVuY3Rpb24gbm9ybWFsaXplQ2VsbCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgPyB2YWx1ZS50cmltKCkuc2xpY2UoMCwgMjAwMCkgOiBTdHJpbmcodmFsdWUgPz8gXCJcIikudHJpbSgpLnNsaWNlKDAsIDIwMDApO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVUYWJsZShpbnB1dDogUGFydGlhbDxNaW5kTWFwVGFibGU+IHwgdW5kZWZpbmVkKTogTWluZE1hcFRhYmxlIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCB8fCAhQXJyYXkuaXNBcnJheShpbnB1dC5oZWFkZXJzKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgaGVhZGVycyA9IGlucHV0LmhlYWRlcnMubWFwKG5vcm1hbGl6ZUNlbGwpLnNsaWNlKDAsIDEyKTtcbiAgaWYgKCFoZWFkZXJzLmxlbmd0aCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3Qgcm93cyA9IEFycmF5LmlzQXJyYXkoaW5wdXQucm93cylcbiAgICA/IGlucHV0LnJvd3Muc2xpY2UoMCwgMTAwKS5tYXAoKHJvdykgPT4ge1xuICAgICAgY29uc3QgdmFsdWVzID0gQXJyYXkuaXNBcnJheShyb3cpID8gcm93Lm1hcChub3JtYWxpemVDZWxsKS5zbGljZSgwLCBoZWFkZXJzLmxlbmd0aCkgOiBbXTtcbiAgICAgIHdoaWxlICh2YWx1ZXMubGVuZ3RoIDwgaGVhZGVycy5sZW5ndGgpIHZhbHVlcy5wdXNoKFwiXCIpO1xuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9KVxuICAgIDogW107XG4gIGNvbnN0IGFsaWdubWVudHMgPSBBcnJheS5pc0FycmF5KGlucHV0LmFsaWdubWVudHMpXG4gICAgPyBpbnB1dC5hbGlnbm1lbnRzLnNsaWNlKDAsIGhlYWRlcnMubGVuZ3RoKS5tYXAoKHZhbHVlKSA9PiB2YWx1ZSA9PT0gXCJjZW50ZXJcIiB8fCB2YWx1ZSA9PT0gXCJyaWdodFwiID8gdmFsdWUgOiBcImxlZnRcIilcbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3Qgc291cmNlID0gaW5wdXQuc291cmNlID09PSBcIm1hcmtkb3duXCIgfHwgaW5wdXQuc291cmNlID09PSBcImNoaWxkcmVuXCIgPyBpbnB1dC5zb3VyY2UgOiBcIm1hbnVhbFwiO1xuICByZXR1cm4geyBoZWFkZXJzLCByb3dzLCBhbGlnbm1lbnRzLCBzb3VyY2UgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQ29kZShpbnB1dDogUGFydGlhbDxNaW5kTWFwQ29kZUJsb2NrPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBDb2RlQmxvY2sgfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0IHx8IHR5cGVvZiBpbnB1dC5jb2RlICE9PSBcInN0cmluZ1wiIHx8ICFpbnB1dC5jb2RlLnRyaW0oKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgbGFuZ3VhZ2UgPSB0eXBlb2YgaW5wdXQubGFuZ3VhZ2UgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQubGFuZ3VhZ2UudHJpbSgpXG4gICAgPyBpbnB1dC5sYW5ndWFnZS50cmltKCkucmVwbGFjZSgvW15hLXowLTlfKyMuLV0vZ2ksIFwiXCIpLnNsaWNlKDAsIDQwKVxuICAgIDogdW5kZWZpbmVkO1xuICByZXR1cm4geyBsYW5ndWFnZSwgY29kZTogaW5wdXQuY29kZS5yZXBsYWNlKC9cXHJcXG4vZywgXCJcXG5cIikuc2xpY2UoMCwgMTAwMDAwKSB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTdWJtYXAoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcFN1Ym1hcD4gfCB1bmRlZmluZWQpOiBNaW5kTWFwU3VibWFwIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQucGF0aCAhPT0gXCJzdHJpbmdcIiB8fCAhaW5wdXQucGF0aC50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiB7XG4gICAgcGF0aDogaW5wdXQucGF0aC50cmltKCkuc2xpY2UoMCwgNTAwKSxcbiAgICB0aXRsZTogdHlwZW9mIGlucHV0LnRpdGxlID09PSBcInN0cmluZ1wiICYmIGlucHV0LnRpdGxlLnRyaW0oKSA/IGlucHV0LnRpdGxlLnRyaW0oKS5zbGljZSgwLCAyMDApIDogdW5kZWZpbmVkXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU5hdmlnYXRpb24oaW5wdXQ6IFBhcnRpYWw8TWluZE1hcE5hdmlnYXRpb24+IHwgdW5kZWZpbmVkKTogTWluZE1hcE5hdmlnYXRpb24gfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0IHx8IHR5cGVvZiBpbnB1dC5wYXJlbnRQYXRoICE9PSBcInN0cmluZ1wiIHx8ICFpbnB1dC5wYXJlbnRQYXRoLnRyaW0oKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIHtcbiAgICBwYXJlbnRQYXRoOiBpbnB1dC5wYXJlbnRQYXRoLnRyaW0oKS5zbGljZSgwLCA1MDApLFxuICAgIHBhcmVudE5vZGVJZDogdHlwZW9mIGlucHV0LnBhcmVudE5vZGVJZCA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5wYXJlbnROb2RlSWQudHJpbSgpID8gaW5wdXQucGFyZW50Tm9kZUlkLnRyaW0oKS5zbGljZSgwLCAxNjApIDogdW5kZWZpbmVkLFxuICAgIHBhcmVudFRpdGxlOiB0eXBlb2YgaW5wdXQucGFyZW50VGl0bGUgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQucGFyZW50VGl0bGUudHJpbSgpID8gaW5wdXQucGFyZW50VGl0bGUudHJpbSgpLnNsaWNlKDAsIDIwMCkgOiB1bmRlZmluZWQsXG4gICAgcGFyZW50Tm9kZVRleHQ6IHR5cGVvZiBpbnB1dC5wYXJlbnROb2RlVGV4dCA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5wYXJlbnROb2RlVGV4dC50cmltKCkgPyBpbnB1dC5wYXJlbnROb2RlVGV4dC50cmltKCkuc2xpY2UoMCwgMjAwKSA6IHVuZGVmaW5lZFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVUYXNrKHZhbHVlOiB1bmtub3duKTogVGFza1N0YXR1cyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiB2YWx1ZSA9PT0gXCJ0b2RvXCIgfHwgdmFsdWUgPT09IFwiZG9pbmdcIiB8fCB2YWx1ZSA9PT0gXCJkb25lXCIgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGFncyh2YWx1ZTogdW5rbm93bik6IHN0cmluZ1tdIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdGFncyA9IEFycmF5LmZyb20obmV3IFNldCh2YWx1ZVxuICAgIC5maWx0ZXIoKGl0ZW0pOiBpdGVtIGlzIHN0cmluZyA9PiB0eXBlb2YgaXRlbSA9PT0gXCJzdHJpbmdcIilcbiAgICAubWFwKChpdGVtKSA9PiBpdGVtLnRyaW0oKS5yZXBsYWNlKC9eIy8sIFwiXCIpKVxuICAgIC5maWx0ZXIoQm9vbGVhbikpKVxuICAgIC5zbGljZSgwLCAxMik7XG4gIHJldHVybiB0YWdzLmxlbmd0aCA/IHRhZ3MgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU5vZGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcE5vZGU+IHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlIHtcbiAgY29uc3QgZmFsbGJhY2tOb2RlVGV4dCA9IHR5cGVvZiBpbnB1dD8udGV4dCA9PT0gXCJzdHJpbmdcIiA/IGlucHV0LnRleHQgOiBmYWxsYmFja1RleHQ7XG4gIGNvbnN0IG5vcm1hbGl6ZWRDb250ZW50ID0gQXJyYXkuaXNBcnJheShpbnB1dD8uY29udGVudClcbiAgICA/IGlucHV0LmNvbnRlbnQubWFwKG5vcm1hbGl6ZUNvbnRlbnRCbG9jaykuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBDb250ZW50QmxvY2sgPT4gQm9vbGVhbihibG9jaykpXG4gICAgOiBbXTtcbiAgaWYgKCFub3JtYWxpemVkQ29udGVudC5sZW5ndGgpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0Py5pbWFnZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5pbWFnZS50cmltKCkpIHtcbiAgICAgIG5vcm1hbGl6ZWRDb250ZW50LnB1c2goeyBpZDogbmV3SWQoKSwgdHlwZTogXCJpbWFnZVwiLCBzb3VyY2U6IGlucHV0LmltYWdlLnRyaW0oKSwgYWx0OiBmYWxsYmFja05vZGVUZXh0IHx8IHVuZGVmaW5lZCB9KTtcbiAgICB9XG4gICAgY29uc3QgcmljaFRleHQgPSBub3JtYWxpemVSaWNoVGV4dChpbnB1dD8ucmljaFRleHQsIGZhbGxiYWNrTm9kZVRleHQpO1xuICAgIGNvbnN0IHRleHQgPSByaWNoVGV4dFBsYWluVGV4dChyaWNoVGV4dCwgZmFsbGJhY2tOb2RlVGV4dCk7XG4gICAgaWYgKHRleHQpIG5vcm1hbGl6ZWRDb250ZW50LnB1c2goeyBpZDogbmV3SWQoKSwgdHlwZTogXCJ0ZXh0XCIsIHRleHQsIHJpY2hUZXh0IH0pO1xuICB9XG4gIGNvbnN0IHRleHRCbG9ja3MgPSBub3JtYWxpemVkQ29udGVudC5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcFRleHRDb250ZW50QmxvY2sgPT4gYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIpO1xuICBjb25zdCBpbWFnZUJsb2NrcyA9IG5vcm1hbGl6ZWRDb250ZW50LmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2sgPT4gYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiKTtcbiAgY29uc3QgdGV4dCA9IHRleHRCbG9ja3MubWFwKChibG9jaykgPT4gYmxvY2sudGV4dCkuam9pbihcIiBcIikudHJpbSgpO1xuICByZXR1cm4ge1xuICAgIGlkOiB0eXBlb2YgaW5wdXQ/LmlkID09PSBcInN0cmluZ1wiICYmIGlucHV0LmlkID8gaW5wdXQuaWQgOiBuZXdJZCgpLFxuICAgIHRleHQsXG4gICAgcmljaFRleHQ6IHRleHRCbG9ja3MubGVuZ3RoID09PSAxID8gdGV4dEJsb2Nrc1swXT8ucmljaFRleHQgOiB1bmRlZmluZWQsXG4gICAgY29udGVudDogbm9ybWFsaXplZENvbnRlbnQubGVuZ3RoID8gbm9ybWFsaXplZENvbnRlbnQgOiB1bmRlZmluZWQsXG4gICAgbm90ZTogdHlwZW9mIGlucHV0Py5ub3RlID09PSBcInN0cmluZ1wiICYmIGlucHV0Lm5vdGUudHJpbSgpID8gaW5wdXQubm90ZS50cmltKCkgOiB1bmRlZmluZWQsXG4gICAgbGluazogdHlwZW9mIGlucHV0Py5saW5rID09PSBcInN0cmluZ1wiICYmIGlucHV0LmxpbmsudHJpbSgpID8gaW5wdXQubGluay50cmltKCkgOiB1bmRlZmluZWQsXG4gICAgaW1hZ2U6IGltYWdlQmxvY2tzWzBdPy5zb3VyY2UsXG4gICAgdGFibGU6IG5vcm1hbGl6ZVRhYmxlKGlucHV0Py50YWJsZSksXG4gICAgY29kZTogbm9ybWFsaXplQ29kZShpbnB1dD8uY29kZSksXG4gICAgc3VibWFwOiBub3JtYWxpemVTdWJtYXAoaW5wdXQ/LnN1Ym1hcCksXG4gICAgaWNvbjogdHlwZW9mIGlucHV0Py5pY29uID09PSBcInN0cmluZ1wiICYmIGlucHV0Lmljb24udHJpbSgpID8gaW5wdXQuaWNvbi50cmltKCkuc2xpY2UoMCwgMTIpIDogdW5kZWZpbmVkLFxuICAgIHRhZ3M6IG5vcm1hbGl6ZVRhZ3MoaW5wdXQ/LnRhZ3MpLFxuICAgIHRhc2s6IG5vcm1hbGl6ZVRhc2soaW5wdXQ/LnRhc2spLFxuICAgIHN0eWxlOiBub3JtYWxpemVTdHlsZShpbnB1dD8uc3R5bGUpLFxuICAgIGNvbGxhcHNlZDogaW5wdXQ/LmNvbGxhcHNlZCA9PT0gdHJ1ZSB8fCB1bmRlZmluZWQsXG4gICAgY2hpbGRyZW46IEFycmF5LmlzQXJyYXkoaW5wdXQ/LmNoaWxkcmVuKVxuICAgICAgPyBpbnB1dC5jaGlsZHJlbi5tYXAoKGNoaWxkLCBpbmRleCkgPT4gbm9ybWFsaXplTm9kZShjaGlsZCwgYFx1ODI4Mlx1NzBCOSAke2luZGV4ICsgMX1gKSlcbiAgICAgIDogW11cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZURvY3VtZW50KGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBEb2N1bWVudD4gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGl0bGUgPSBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTogTWluZE1hcERvY3VtZW50IHtcbiAgY29uc3QgdGl0bGUgPSB0eXBlb2YgaW5wdXQ/LnRpdGxlID09PSBcInN0cmluZ1wiICYmIGlucHV0LnRpdGxlLnRyaW0oKSA/IGlucHV0LnRpdGxlLnRyaW0oKSA6IGZhbGxiYWNrVGl0bGU7XG4gIHJldHVybiB7XG4gICAgdmVyc2lvbjogOCxcbiAgICB0aXRsZSxcbiAgICBsYXlvdXQ6IGlucHV0Py5sYXlvdXQgPT09IFwiYmFsYW5jZWRcIiA/IFwiYmFsYW5jZWRcIiA6IFwicmlnaHRcIixcbiAgICB0aGVtZTogaW5wdXQ/LnRoZW1lID09PSBcImxpZ2h0XCIgfHwgaW5wdXQ/LnRoZW1lID09PSBcImRhcmtcIiA/IGlucHV0LnRoZW1lIDogXCJhdXRvXCIsXG4gICAgYXBwZWFyYW5jZTogbm9ybWFsaXplQXBwZWFyYW5jZShpbnB1dD8uYXBwZWFyYW5jZSksXG4gICAgbmF2aWdhdGlvbjogbm9ybWFsaXplTmF2aWdhdGlvbihpbnB1dD8ubmF2aWdhdGlvbiksXG4gICAgcm9vdDogbm9ybWFsaXplTm9kZShpbnB1dD8ucm9vdCwgdGl0bGUpXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVEb2N1bWVudChkb2M6IE1pbmRNYXBEb2N1bWVudCk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVEb2N1bWVudChkb2MsIGRvYy50aXRsZSk7XG4gIHJldHVybiBgJHtKU09OLnN0cmluZ2lmeShub3JtYWxpemVkLCBudWxsLCAyKX1cXG5gO1xufVxuXG5mdW5jdGlvbiBwYXJzZUpzb25Eb2N1bWVudCh2YWx1ZTogc3RyaW5nLCBmYWxsYmFja1RpdGxlOiBzdHJpbmcpOiBNaW5kTWFwRG9jdW1lbnQgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gbm9ybWFsaXplRG9jdW1lbnQoSlNPTi5wYXJzZSh2YWx1ZSkgYXMgUGFydGlhbDxNaW5kTWFwRG9jdW1lbnQ+LCBmYWxsYmFja1RpdGxlKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEZlbmNlZEpzb24oc291cmNlOiBzdHJpbmcsIGxhbmd1YWdlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgZXNjYXBlZCA9IGxhbmd1YWdlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgY29uc3QgbWF0Y2ggPSBzb3VyY2UubWF0Y2gobmV3IFJlZ0V4cChcImBgYFwiICsgZXNjYXBlZCArIFwiXFxcXHMqKFtcXFxcc1xcXFxTXSo/KWBgYFwiLCBcImlcIikpO1xuICByZXR1cm4gbWF0Y2g/LlsxXT8udHJpbSgpID8/IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZURvY3VtZW50KHNvdXJjZTogc3RyaW5nLCBmYWxsYmFja1RpdGxlID0gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik6IE1pbmRNYXBEb2N1bWVudCB7XG4gIGNvbnN0IHRyaW1tZWQgPSBzb3VyY2UudHJpbSgpO1xuICBpZiAodHJpbW1lZC5zdGFydHNXaXRoKFwie1wiKSAmJiB0cmltbWVkLmVuZHNXaXRoKFwifVwiKSkge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSnNvbkRvY3VtZW50KHRyaW1tZWQsIGZhbGxiYWNrVGl0bGUpO1xuICAgIGlmIChwYXJzZWQpIHJldHVybiBwYXJzZWQ7XG4gIH1cblxuICBmb3IgKGNvbnN0IGxhbmd1YWdlIG9mIFtNSU5ETUFQX0NPREVfQkxPQ0ssIC4uLkxFR0FDWV9DT0RFX0JMT0NLU10pIHtcbiAgICBjb25zdCBmZW5jZWQgPSBleHRyYWN0RmVuY2VkSnNvbihzb3VyY2UsIGxhbmd1YWdlKTtcbiAgICBpZiAoIWZlbmNlZCkgY29udGludWU7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VKc29uRG9jdW1lbnQoZmVuY2VkLCBmYWxsYmFja1RpdGxlKTtcbiAgICBpZiAocGFyc2VkKSByZXR1cm4gcGFyc2VkO1xuICB9XG5cbiAgcmV0dXJuIG1hcmtkb3duVG9Eb2N1bWVudChzb3VyY2UsIGZhbGxiYWNrVGl0bGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVEb2N1bWVudChkb2M6IE1pbmRNYXBEb2N1bWVudCk6IE1pbmRNYXBEb2N1bWVudCB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRvYykpIGFzIE1pbmRNYXBEb2N1bWVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb25lTm9kZVdpdGhGcmVzaElkcyhub2RlOiBNaW5kTWFwTm9kZSk6IE1pbmRNYXBOb2RlIHtcbiAgY29uc3QgY2xvbmUgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG5vZGUpKSBhcyBNaW5kTWFwTm9kZTtcbiAgd2Fsa05vZGVzKGNsb25lLCAoY3VycmVudCkgPT4ge1xuICAgIGN1cnJlbnQuaWQgPSBuZXdJZCgpO1xuICB9KTtcbiAgcmV0dXJuIGNsb25lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2Fsa05vZGVzKHJvb3Q6IE1pbmRNYXBOb2RlLCB2aXNpdG9yOiAobm9kZTogTWluZE1hcE5vZGUsIHBhcmVudDogTWluZE1hcE5vZGUgfCBudWxsKSA9PiB2b2lkKTogdm9pZCB7XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE1pbmRNYXBOb2RlLCBwYXJlbnQ6IE1pbmRNYXBOb2RlIHwgbnVsbCk6IHZvaWQgPT4ge1xuICAgIHZpc2l0b3Iobm9kZSwgcGFyZW50KTtcbiAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgbm9kZSkpO1xuICB9O1xuICB2aXNpdChyb290LCBudWxsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW5Ob2Rlcyhyb290OiBNaW5kTWFwTm9kZSk6IE1pbmRNYXBOb2RlW10ge1xuICBjb25zdCBub2RlczogTWluZE1hcE5vZGVbXSA9IFtdO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUpID0+IG5vZGVzLnB1c2gobm9kZSkpO1xuICByZXR1cm4gbm9kZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTm9kZShyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gIGxldCByZXN1bHQ6IE1pbmRNYXBOb2RlIHwgbnVsbCA9IG51bGw7XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSkgPT4ge1xuICAgIGlmIChub2RlLmlkID09PSBpZCkgcmVzdWx0ID0gbm9kZTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUGFyZW50KHJvb3Q6IE1pbmRNYXBOb2RlLCBpZDogc3RyaW5nKTogTWluZE1hcE5vZGUgfCBudWxsIHtcbiAgbGV0IHJlc3VsdDogTWluZE1hcE5vZGUgfCBudWxsID0gbnVsbDtcbiAgd2Fsa05vZGVzKHJvb3QsIChub2RlLCBwYXJlbnQpID0+IHtcbiAgICBpZiAobm9kZS5pZCA9PT0gaWQpIHJlc3VsdCA9IHBhcmVudDtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQW5jZXN0b3JzKHJvb3Q6IE1pbmRNYXBOb2RlLCBpZDogc3RyaW5nKTogTWluZE1hcE5vZGVbXSB7XG4gIGNvbnN0IHBhdGg6IE1pbmRNYXBOb2RlW10gPSBbXTtcbiAgY29uc3QgdmlzaXQgPSAobm9kZTogTWluZE1hcE5vZGUpOiBib29sZWFuID0+IHtcbiAgICBpZiAobm9kZS5pZCA9PT0gaWQpIHJldHVybiB0cnVlO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgcGF0aC5wdXNoKG5vZGUpO1xuICAgICAgaWYgKHZpc2l0KGNoaWxkKSkgcmV0dXJuIHRydWU7XG4gICAgICBwYXRoLnBvcCgpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIHJldHVybiB2aXNpdChyb290KSA/IHBhdGggOiBbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5zTm9kZShyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gZmluZE5vZGUocm9vdCwgaWQpICE9PSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlTm9kZShyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcm9vdC5jaGlsZHJlbi5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBpZiAocm9vdC5jaGlsZHJlbltpbmRleF0/LmlkID09PSBpZCkge1xuICAgICAgcm9vdC5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IGNoaWxkID0gcm9vdC5jaGlsZHJlbltpbmRleF07XG4gICAgaWYgKGNoaWxkICYmIHJlbW92ZU5vZGUoY2hpbGQsIGlkKSkgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFdpa2lMaW5rcyhyb290OiBNaW5kTWFwTm9kZSk6IFNldDxzdHJpbmc+IHtcbiAgY29uc3QgbGlua3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgcGF0dGVybiA9IC9cXFtcXFsoW15cXF18I10rKSg/OiNbXlxcXXxdKyk/KD86XFx8W15cXF1dKyk/XFxdXFxdL2c7XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSkgPT4ge1xuICAgIGNvbnN0IHZhbHVlcyA9IFtub2RlUGxhaW5UZXh0KG5vZGUpLCBub2RlLm5vdGUgPz8gXCJcIiwgbm9kZS5saW5rID8/IFwiXCIsIC4uLm5vZGVDb250ZW50QmxvY2tzKG5vZGUpLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2sgPT4gYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiKS5tYXAoKGJsb2NrKSA9PiBibG9jay5zb3VyY2UpLCBub2RlLnN1Ym1hcD8ucGF0aCA/PyBcIlwiXTtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHZhbHVlcykge1xuICAgICAgbGV0IG1hdGNoOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICAgICAgd2hpbGUgKChtYXRjaCA9IHBhdHRlcm4uZXhlYyh2YWx1ZSkpICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChtYXRjaFsxXSkgbGlua3MuYWRkKG1hdGNoWzFdLnRyaW0oKSk7XG4gICAgICB9XG4gICAgICBwYXR0ZXJuLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuICAgIGNvbnN0IGV4cGxpY2l0TGluayA9IG5vZGUubGluaz8udHJpbSgpO1xuICAgIGlmIChleHBsaWNpdExpbmsgJiYgIS9eaHR0cHM/OlxcL1xcLy9pLnRlc3QoZXhwbGljaXRMaW5rKSAmJiAhZXhwbGljaXRMaW5rLmluY2x1ZGVzKFwiW1tcIikpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGV4cGxpY2l0TGluay5zcGxpdChcInxcIilbMF0/LnNwbGl0KFwiI1wiKVswXT8udHJpbSgpO1xuICAgICAgaWYgKHRhcmdldCkgbGlua3MuYWRkKHRhcmdldCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGxpbmtzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEZpcnN0V2lraUxpbmsodmFsdWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBtYXRjaCA9IHZhbHVlLm1hdGNoKC9cXFtcXFsoW15cXF18I10rKD86I1teXFxdfF0rKT8pKD86XFx8W15cXF1dKyk/XFxdXFxdLyk7XG4gIHJldHVybiBtYXRjaD8uWzFdPy50cmltKCkgPz8gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRhc2tQcm9ncmVzcyhyb290OiBNaW5kTWFwTm9kZSk6IFRhc2tQcm9ncmVzcyB7XG4gIGxldCBkb25lID0gMDtcbiAgbGV0IHRvdGFsID0gMDtcbiAgd2Fsa05vZGVzKHJvb3QsIChub2RlKSA9PiB7XG4gICAgaWYgKCFub2RlLnRhc2spIHJldHVybjtcbiAgICB0b3RhbCArPSAxO1xuICAgIGlmIChub2RlLnRhc2sgPT09IFwiZG9uZVwiKSBkb25lICs9IDE7XG4gIH0pO1xuICByZXR1cm4geyBkb25lLCB0b3RhbCB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9kZVNlYXJjaFRleHQobm9kZTogTWluZE1hcE5vZGUpOiBzdHJpbmcge1xuICByZXR1cm4gW25vZGVQbGFpblRleHQobm9kZSksIG5vZGUubm90ZSwgbm9kZS5saW5rLCAuLi5ub2RlQ29udGVudEJsb2Nrcyhub2RlKS5tYXAoKGJsb2NrKSA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIgPyBgJHtibG9jay5zb3VyY2V9ICR7YmxvY2suYWx0ID8/IFwiXCJ9YCA6IGJsb2NrLnRleHQpLCBub2RlLmljb24sIG5vZGUuc3VibWFwPy5wYXRoLCBub2RlLmNvZGU/Lmxhbmd1YWdlLCBub2RlLmNvZGU/LmNvZGUsIC4uLihub2RlLnRhYmxlPy5oZWFkZXJzID8/IFtdKSwgLi4uKG5vZGUudGFibGU/LnJvd3MuZmxhdCgpID8/IFtdKSwgLi4uKG5vZGUudGFncyA/PyBbXSldXG4gICAgLmZpbHRlcigodmFsdWUpOiB2YWx1ZSBpcyBzdHJpbmcgPT4gQm9vbGVhbih2YWx1ZSkpXG4gICAgLmpvaW4oXCIgXCIpXG4gICAgLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIHRhc2tQcmVmaXgodGFzazogVGFza1N0YXR1cyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIGlmICh0YXNrID09PSBcImRvbmVcIikgcmV0dXJuIFwiW3hdIFwiO1xuICBpZiAodGFzayA9PT0gXCJkb2luZ1wiKSByZXR1cm4gXCJbLV0gXCI7XG4gIGlmICh0YXNrID09PSBcInRvZG9cIikgcmV0dXJuIFwiWyBdIFwiO1xuICByZXR1cm4gXCJcIjtcbn1cblxuZnVuY3Rpb24gZXNjYXBlSW5saW5lTWFya2Rvd24odmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC8oW1xcXFxgKl97fVxcW1xcXTw+XSkvZywgXCJcXFxcJDFcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByaWNoVGV4dFRvTWFya2Rvd24ocnVuczogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXJ1bnM/Lmxlbmd0aCkgcmV0dXJuIGVzY2FwZUlubGluZU1hcmtkb3duKGZhbGxiYWNrVGV4dCk7XG4gIHJldHVybiBydW5zLm1hcCgocnVuKSA9PiB7XG4gICAgbGV0IHZhbHVlID0gZXNjYXBlSW5saW5lTWFya2Rvd24ocnVuLnRleHQpO1xuICAgIGNvbnN0IHN0eWxlID0gcnVuLnN0eWxlO1xuICAgIGlmICghc3R5bGUpIHJldHVybiB2YWx1ZTtcbiAgICBpZiAoc3R5bGUuYm9sZCkgdmFsdWUgPSBgKioke3ZhbHVlfSoqYDtcbiAgICBpZiAoc3R5bGUuaXRhbGljKSB2YWx1ZSA9IGAqJHt2YWx1ZX0qYDtcbiAgICBpZiAoc3R5bGUuc3RyaWtlKSB2YWx1ZSA9IGB+fiR7dmFsdWV9fn5gO1xuICAgIGlmIChzdHlsZS51bmRlcmxpbmUpIHZhbHVlID0gYDx1PiR7dmFsdWV9PC91PmA7XG4gICAgaWYgKHN0eWxlLmNvbG9yKSB2YWx1ZSA9IGA8c3BhbiBzdHlsZT1cImNvbG9yOiR7c3R5bGUuY29sb3J9XCI+JHt2YWx1ZX08L3NwYW4+YDtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH0pLmpvaW4oXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0YWJsZVRvTWFya2Rvd24odGFibGU6IE1pbmRNYXBUYWJsZSk6IHN0cmluZyB7XG4gIGNvbnN0IGVzY2FwZUNlbGwgPSAodmFsdWU6IHN0cmluZyk6IHN0cmluZyA9PiB2YWx1ZS5yZXBsYWNlQWxsKFwifFwiLCBcIlxcXFx8XCIpLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCI8YnI+XCIpO1xuICBjb25zdCBoZWFkZXJzID0gYHwgJHt0YWJsZS5oZWFkZXJzLm1hcChlc2NhcGVDZWxsKS5qb2luKFwiIHwgXCIpfSB8YDtcbiAgY29uc3QgYWxpZ25tZW50cyA9IHRhYmxlLmhlYWRlcnMubWFwKChfLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IGFsaWdubWVudCA9IHRhYmxlLmFsaWdubWVudHM/LltpbmRleF0gPz8gXCJsZWZ0XCI7XG4gICAgcmV0dXJuIGFsaWdubWVudCA9PT0gXCJjZW50ZXJcIiA/IFwiOi0tLTpcIiA6IGFsaWdubWVudCA9PT0gXCJyaWdodFwiID8gXCItLS06XCIgOiBcIi0tLVwiO1xuICB9KTtcbiAgY29uc3Qgc2VwYXJhdG9yID0gYHwgJHthbGlnbm1lbnRzLmpvaW4oXCIgfCBcIil9IHxgO1xuICBjb25zdCByb3dzID0gdGFibGUucm93cy5tYXAoKHJvdykgPT4gYHwgJHt0YWJsZS5oZWFkZXJzLm1hcCgoXywgaW5kZXgpID0+IGVzY2FwZUNlbGwocm93W2luZGV4XSA/PyBcIlwiKSkuam9pbihcIiB8IFwiKX0gfGApO1xuICByZXR1cm4gW2hlYWRlcnMsIHNlcGFyYXRvciwgLi4ucm93c10uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gc3BsaXRNYXJrZG93blRhYmxlUm93KGxpbmU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgdmFsdWUgPSBsaW5lLnRyaW0oKS5yZXBsYWNlKC9eXFx8LywgXCJcIikucmVwbGFjZSgvXFx8JC8sIFwiXCIpO1xuICBjb25zdCBjZWxsczogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGN1cnJlbnQgPSBcIlwiO1xuICBsZXQgZXNjYXBlZCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IGNoYXIgb2YgdmFsdWUpIHtcbiAgICBpZiAoZXNjYXBlZCkgeyBjdXJyZW50ICs9IGNoYXI7IGVzY2FwZWQgPSBmYWxzZTsgY29udGludWU7IH1cbiAgICBpZiAoY2hhciA9PT0gXCJcXFxcXCIpIHsgZXNjYXBlZCA9IHRydWU7IGNvbnRpbnVlOyB9XG4gICAgaWYgKGNoYXIgPT09IFwifFwiKSB7IGNlbGxzLnB1c2goY3VycmVudC50cmltKCkucmVwbGFjZUFsbChcIjxicj5cIiwgXCJcXG5cIikpOyBjdXJyZW50ID0gXCJcIjsgY29udGludWU7IH1cbiAgICBjdXJyZW50ICs9IGNoYXI7XG4gIH1cbiAgY2VsbHMucHVzaChjdXJyZW50LnRyaW0oKS5yZXBsYWNlQWxsKFwiPGJyPlwiLCBcIlxcblwiKSk7XG4gIHJldHVybiBjZWxscztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTWFya2Rvd25UYWJsZShtYXJrZG93bjogc3RyaW5nKTogTWluZE1hcFRhYmxlIHwgbnVsbCB7XG4gIGNvbnN0IGxpbmVzID0gbWFya2Rvd24uc3BsaXQoL1xccj9cXG4vKTtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxpbmVzLmxlbmd0aCAtIDE7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBoZWFkZXJMaW5lID0gbGluZXNbaW5kZXhdPy50cmltKCkgPz8gXCJcIjtcbiAgICBjb25zdCBzZXBhcmF0b3JMaW5lID0gbGluZXNbaW5kZXggKyAxXT8udHJpbSgpID8/IFwiXCI7XG4gICAgaWYgKCFoZWFkZXJMaW5lLmluY2x1ZGVzKFwifFwiKSB8fCAhc2VwYXJhdG9yTGluZS5pbmNsdWRlcyhcInxcIikpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGhlYWRlcnMgPSBzcGxpdE1hcmtkb3duVGFibGVSb3coaGVhZGVyTGluZSk7XG4gICAgY29uc3Qgc2VwYXJhdG9ycyA9IHNwbGl0TWFya2Rvd25UYWJsZVJvdyhzZXBhcmF0b3JMaW5lKTtcbiAgICBpZiAoIWhlYWRlcnMubGVuZ3RoIHx8IHNlcGFyYXRvcnMubGVuZ3RoICE9PSBoZWFkZXJzLmxlbmd0aCB8fCAhc2VwYXJhdG9ycy5ldmVyeSgoY2VsbCkgPT4gL146Py17Myx9Oj8kLy50ZXN0KGNlbGwucmVwbGFjZSgvXFxzL2csIFwiXCIpKSkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGFsaWdubWVudHM6IFRhYmxlQWxpZ25tZW50W10gPSBzZXBhcmF0b3JzLm1hcCgoY2VsbCkgPT4ge1xuICAgICAgY29uc3QgY29tcGFjdCA9IGNlbGwucmVwbGFjZSgvXFxzL2csIFwiXCIpO1xuICAgICAgaWYgKGNvbXBhY3Quc3RhcnRzV2l0aChcIjpcIikgJiYgY29tcGFjdC5lbmRzV2l0aChcIjpcIikpIHJldHVybiBcImNlbnRlclwiO1xuICAgICAgaWYgKGNvbXBhY3QuZW5kc1dpdGgoXCI6XCIpKSByZXR1cm4gXCJyaWdodFwiO1xuICAgICAgcmV0dXJuIFwibGVmdFwiO1xuICAgIH0pO1xuICAgIGNvbnN0IHJvd3M6IHN0cmluZ1tdW10gPSBbXTtcbiAgICBmb3IgKGxldCByb3dJbmRleCA9IGluZGV4ICsgMjsgcm93SW5kZXggPCBsaW5lcy5sZW5ndGg7IHJvd0luZGV4ICs9IDEpIHtcbiAgICAgIGNvbnN0IHJvd0xpbmUgPSBsaW5lc1tyb3dJbmRleF0/LnRyaW0oKSA/PyBcIlwiO1xuICAgICAgaWYgKCFyb3dMaW5lIHx8ICFyb3dMaW5lLmluY2x1ZGVzKFwifFwiKSkgYnJlYWs7XG4gICAgICBjb25zdCByb3cgPSBzcGxpdE1hcmtkb3duVGFibGVSb3cocm93TGluZSkuc2xpY2UoMCwgaGVhZGVycy5sZW5ndGgpO1xuICAgICAgd2hpbGUgKHJvdy5sZW5ndGggPCBoZWFkZXJzLmxlbmd0aCkgcm93LnB1c2goXCJcIik7XG4gICAgICByb3dzLnB1c2gocm93KTtcbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVRhYmxlKHsgaGVhZGVycywgcm93cywgYWxpZ25tZW50cywgc291cmNlOiBcIm1hcmtkb3duXCIgfSkgPz8gbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmVuY2VkQ29kZShtYXJrZG93bjogc3RyaW5nKTogTWluZE1hcENvZGVCbG9jayB8IG51bGwge1xuICBjb25zdCBtYXRjaCA9IG1hcmtkb3duLm1hdGNoKC9gYGAoW15cXG5gXSopXFxuKFtcXHNcXFNdKj8pXFxuYGBgLyk7XG4gIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuICByZXR1cm4gbm9ybWFsaXplQ29kZSh7IGxhbmd1YWdlOiBtYXRjaFsxXT8udHJpbSgpLCBjb2RlOiBtYXRjaFsyXSA/PyBcIlwiIH0pID8/IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGlsZHJlblRvVGFibGUobm9kZTogTWluZE1hcE5vZGUpOiBNaW5kTWFwVGFibGUgfCBudWxsIHtcbiAgaWYgKCFub2RlLmNoaWxkcmVuLmxlbmd0aCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7XG4gICAgaGVhZGVyczogW1wiXHU1QjUwXHU4MjgyXHU3MEI5XCIsIFwiXHU1OTA3XHU2Q0U4XCIsIFwiXHU3MkI2XHU2MDAxXCIsIFwiXHU2ODA3XHU3QjdFXCIsIFwiXHU0RTBCXHU3RUE3XHU2NTcwXHU5MUNGXCJdLFxuICAgIHJvd3M6IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZCkgPT4gW1xuICAgICAgbm9kZVBsYWluVGV4dChjaGlsZCksXG4gICAgICBjaGlsZC5ub3RlID8/IFwiXCIsXG4gICAgICBjaGlsZC50YXNrID09PSBcImRvbmVcIiA/IFwiXHU1REYyXHU1QjhDXHU2MjEwXCIgOiBjaGlsZC50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiIDogY2hpbGQudGFzayA9PT0gXCJ0b2RvXCIgPyBcIlx1NUY4NVx1NTI5RVwiIDogXCJcIixcbiAgICAgIGNoaWxkLnRhZ3M/LmpvaW4oXCIsIFwiKSA/PyBcIlwiLFxuICAgICAgU3RyaW5nKGNoaWxkLmNoaWxkcmVuLmxlbmd0aClcbiAgICBdKSxcbiAgICBhbGlnbm1lbnRzOiBbXCJsZWZ0XCIsIFwibGVmdFwiLCBcImNlbnRlclwiLCBcImxlZnRcIiwgXCJyaWdodFwiXSxcbiAgICBzb3VyY2U6IFwiY2hpbGRyZW5cIlxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZG9jdW1lbnRUb01hcmtkb3duKGRvYzogTWluZE1hcERvY3VtZW50KTogc3RyaW5nIHtcbiAgY29uc3QgcmVuZGVyQmxvY2tzID0gKG5vZGU6IE1pbmRNYXBOb2RlKTogc3RyaW5nW10gPT4ge1xuICAgIGNvbnN0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIG5vZGVDb250ZW50QmxvY2tzKG5vZGUpKSB7XG4gICAgICBpZiAoYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSByaWNoVGV4dFRvTWFya2Rvd24oYmxvY2sucmljaFRleHQsIGJsb2NrLnRleHQpO1xuICAgICAgICBpZiAodmFsdWUpIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGAhWyR7ZXNjYXBlSW5saW5lTWFya2Rvd24oYmxvY2suYWx0ID8/IFwiXHU1NkZFXHU3MjQ3XCIpfV0oJHtibG9jay5zb3VyY2V9KWApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBjb25zdCByb290QmxvY2tzID0gcmVuZGVyQmxvY2tzKGRvYy5yb290KTtcbiAgY29uc3Qgcm9vdFRpdGxlID0gcm9vdEJsb2Nrcy5maW5kKCh2YWx1ZSkgPT4gIXZhbHVlLnN0YXJ0c1dpdGgoXCIhW1wiKSkgPz8gZG9jLnRpdGxlO1xuICBjb25zdCByb290U3VmZml4ID0gZG9jLnJvb3QudGFncz8ubGVuZ3RoID8gYCAke2RvYy5yb290LnRhZ3MubWFwKCh0YWcpID0+IGAjJHt0YWd9YCkuam9pbihcIiBcIil9YCA6IFwiXCI7XG4gIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtgIyAke2RvYy5yb290Lmljb24gPyBgJHtkb2Mucm9vdC5pY29ufSBgIDogXCJcIn0ke3Jvb3RUaXRsZX0ke3Jvb3RTdWZmaXh9YF07XG4gIHJvb3RCbG9ja3MuZmlsdGVyKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHJvb3RUaXRsZSkuZm9yRWFjaCgodmFsdWUpID0+IGxpbmVzLnB1c2godmFsdWUpKTtcbiAgY29uc3QgdmlzaXQgPSAobm9kZTogTWluZE1hcE5vZGUsIGRlcHRoOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBjb25zdCBpbmRlbnQgPSBcIiAgXCIucmVwZWF0KE1hdGgubWF4KDAsIGRlcHRoIC0gMSkpO1xuICAgIGNvbnN0IHRhZ3MgPSBub2RlLnRhZ3M/Lmxlbmd0aCA/IGAgJHtub2RlLnRhZ3MubWFwKCh0YWcpID0+IGAjJHt0YWd9YCkuam9pbihcIiBcIil9YCA6IFwiXCI7XG4gICAgY29uc3QgbGluayA9IG5vZGUubGluayA/IGAgXHUyMTkyICR7bm9kZS5saW5rfWAgOiBcIlwiO1xuICAgIGNvbnN0IGJsb2NrcyA9IHJlbmRlckJsb2Nrcyhub2RlKTtcbiAgICBjb25zdCBmaXJzdFRleHQgPSBibG9ja3MuZmluZCgodmFsdWUpID0+ICF2YWx1ZS5zdGFydHNXaXRoKFwiIVtcIikpID8/IChibG9ja3NbMF0gPz8gXCJcdTU2RkVcdTcyNDdcdTgyODJcdTcwQjlcIik7XG4gICAgbGluZXMucHVzaChgJHtpbmRlbnR9LSAke3Rhc2tQcmVmaXgobm9kZS50YXNrKX0ke25vZGUuaWNvbiA/IGAke25vZGUuaWNvbn0gYCA6IFwiXCJ9JHtmaXJzdFRleHR9JHt0YWdzfSR7bGlua31gKTtcbiAgICBibG9ja3MuZmlsdGVyKCh2YWx1ZSkgPT4gdmFsdWUgIT09IGZpcnN0VGV4dCkuZm9yRWFjaCgodmFsdWUpID0+IGxpbmVzLnB1c2goYCR7aW5kZW50fSAgJHt2YWx1ZX1gKSk7XG4gICAgaWYgKG5vZGUubm90ZSkgbGluZXMucHVzaChgJHtpbmRlbnR9ICA+ICR7bm9kZS5ub3RlLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCIgXCIpfWApO1xuICAgIGlmIChub2RlLnN1Ym1hcCkgbGluZXMucHVzaChgJHtpbmRlbnR9ICA+IFx1NUI1MFx1NUJGQ1x1NTZGRVx1RkYxQVtbJHtub2RlLnN1Ym1hcC5wYXRofV1dYCk7XG4gICAgaWYgKG5vZGUudGFibGUpIGxpbmVzLnB1c2goXCJcIiwgLi4udGFibGVUb01hcmtkb3duKG5vZGUudGFibGUpLnNwbGl0KFwiXFxuXCIpLm1hcCgobGluZSkgPT4gYCR7aW5kZW50fSAgJHtsaW5lfWApLCBcIlwiKTtcbiAgICBpZiAobm9kZS5jb2RlKSBsaW5lcy5wdXNoKGAke2luZGVudH0gIFxcYFxcYFxcYCR7bm9kZS5jb2RlLmxhbmd1YWdlID8/IFwiXCJ9YCwgLi4ubm9kZS5jb2RlLmNvZGUuc3BsaXQoXCJcXG5cIikubWFwKChsaW5lKSA9PiBgJHtpbmRlbnR9ICAke2xpbmV9YCksIGAke2luZGVudH0gIFxcYFxcYFxcYGApO1xuICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHZpc2l0KGNoaWxkLCBkZXB0aCArIDEpKTtcbiAgfTtcbiAgZG9jLnJvb3QuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHZpc2l0KGNoaWxkLCAxKSk7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRhc2tUZXh0KHZhbHVlOiBzdHJpbmcpOiB7IHRleHQ6IHN0cmluZzsgdGFzaz86IFRhc2tTdGF0dXMgfSB7XG4gIGNvbnN0IG1hdGNoID0gdmFsdWUubWF0Y2goL15cXFsoIHx4fFh8LSlcXF1cXHMrKC4rKSQvKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIHsgdGV4dDogdmFsdWUgfTtcbiAgY29uc3QgbWFya2VyID0gbWF0Y2hbMV07XG4gIGNvbnN0IHRhc2s6IFRhc2tTdGF0dXMgPSBtYXJrZXIgPT09IFwieFwiIHx8IG1hcmtlciA9PT0gXCJYXCIgPyBcImRvbmVcIiA6IG1hcmtlciA9PT0gXCItXCIgPyBcImRvaW5nXCIgOiBcInRvZG9cIjtcbiAgcmV0dXJuIHsgdGV4dDogbWF0Y2hbMl0/LnRyaW0oKSB8fCBcIlx1NEVGQlx1NTJBMVwiLCB0YXNrIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXJrZG93blRvRG9jdW1lbnQobWFya2Rvd246IHN0cmluZywgZmFsbGJhY2tUaXRsZSA9IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpOiBNaW5kTWFwRG9jdW1lbnQge1xuICBjb25zdCBkb2MgPSBjcmVhdGVEZWZhdWx0RG9jdW1lbnQoZmFsbGJhY2tUaXRsZSk7XG4gIGRvYy5yb290LmNoaWxkcmVuID0gW107XG4gIGNvbnN0IHN0YWNrOiBBcnJheTx7IGxldmVsOiBudW1iZXI7IG5vZGU6IE1pbmRNYXBOb2RlIH0+ID0gW3sgbGV2ZWw6IDAsIG5vZGU6IGRvYy5yb290IH1dO1xuICBsZXQgcm9vdEFzc2lnbmVkID0gZmFsc2U7XG5cbiAgZm9yIChjb25zdCByYXdMaW5lIG9mIG1hcmtkb3duLnNwbGl0KC9cXHI/XFxuLykpIHtcbiAgICBjb25zdCBsaW5lID0gcmF3TGluZS50cmltRW5kKCk7XG4gICAgaWYgKCFsaW5lLnRyaW0oKSB8fCBsaW5lLnRyaW1TdGFydCgpLnN0YXJ0c1dpdGgoXCItLS1cIikgfHwgbGluZS50cmltU3RhcnQoKS5zdGFydHNXaXRoKFwiYGBgXCIpIHx8IC9eXFxzKj4vLnRlc3QobGluZSkpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgaGVhZGluZyA9IGxpbmUubWF0Y2goL15cXHMqKCN7MSw2fSlcXHMrKC4rPylcXHMqJC8pO1xuICAgIGNvbnN0IGJ1bGxldCA9IGxpbmUubWF0Y2goL14oXFxzKilbLSorXVxccysoLis/KVxccyokLyk7XG4gICAgY29uc3QgbnVtYmVyZWQgPSBsaW5lLm1hdGNoKC9eKFxccyopXFxkK1suKV1cXHMrKC4rPylcXHMqJC8pO1xuXG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGNvbnN0IGxldmVsID0gaGVhZGluZ1sxXT8ubGVuZ3RoID8/IDE7XG4gICAgICBjb25zdCB0ZXh0ID0gaGVhZGluZ1syXT8udHJpbSgpID8/IFwiXHU4MjgyXHU3MEI5XCI7XG4gICAgICBpZiAobGV2ZWwgPT09IDEgJiYgIXJvb3RBc3NpZ25lZCkge1xuICAgICAgICBkb2Mucm9vdC50ZXh0ID0gdGV4dDtcbiAgICAgICAgZG9jLnRpdGxlID0gdGV4dDtcbiAgICAgICAgcm9vdEFzc2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgc3RhY2subGVuZ3RoID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBjcmVhdGVOb2RlKHRleHQpO1xuICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMSAmJiAoc3RhY2suYXQoLTEpPy5sZXZlbCA/PyAwKSA+PSBsZXZlbCkgc3RhY2sucG9wKCk7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHN0YWNrLmF0KC0xKT8ubm9kZSA/PyBkb2Mucm9vdDtcbiAgICAgICAgcGFyZW50LmNoaWxkcmVuLnB1c2gobm9kZSk7XG4gICAgICAgIHN0YWNrLnB1c2goeyBsZXZlbCwgbm9kZSB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGxpc3RNYXRjaCA9IGJ1bGxldCA/PyBudW1iZXJlZDtcbiAgICBpZiAobGlzdE1hdGNoKSB7XG4gICAgICBjb25zdCBzcGFjZXMgPSAobGlzdE1hdGNoWzFdID8/IFwiXCIpLnJlcGxhY2VBbGwoXCJcXHRcIiwgXCIgIFwiKS5sZW5ndGg7XG4gICAgICBjb25zdCBsZXZlbCA9IE1hdGguZmxvb3Ioc3BhY2VzIC8gMikgKyAyO1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VUYXNrVGV4dCgobGlzdE1hdGNoWzJdID8/IFwiXHU4MjgyXHU3MEI5XCIpLnRyaW0oKSk7XG4gICAgICBjb25zdCBub2RlID0gY3JlYXRlTm9kZShwYXJzZWQudGV4dCk7XG4gICAgICBub2RlLnRhc2sgPSBwYXJzZWQudGFzaztcbiAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggPiAxICYmIChzdGFjay5hdCgtMSk/LmxldmVsID8/IDApID49IGxldmVsKSBzdGFjay5wb3AoKTtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHN0YWNrLmF0KC0xKT8ubm9kZSA/PyBkb2Mucm9vdDtcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgc3RhY2sucHVzaCh7IGxldmVsLCBub2RlIH0pO1xuICAgIH1cbiAgfVxuXG4gIGlmICghZG9jLnJvb3QuY2hpbGRyZW4ubGVuZ3RoKSBkb2Mucm9vdC5jaGlsZHJlbi5wdXNoKGNyZWF0ZU5vZGUoXCJcdTRFM0JcdTk4OTggMVwiKSk7XG4gIHJldHVybiBkb2M7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIE1pbmRNYXBTdHVkaW9QbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHR5cGUge1xuICBCYWNrZ3JvdW5kUGF0dGVybixcbiAgRWRnZVN0eWxlLFxuICBGb250RmFtaWx5TW9kZSxcbiAgTGF5b3V0TW9kZSxcbiAgTWluZE1hcEFwcGVhcmFuY2UsXG4gIE5vZGVTaGFwZSxcbiAgVGhlbWVNb2RlXG59IGZyb20gXCIuL21vZGVsXCI7XG5cbmV4cG9ydCB0eXBlIEltYWdlSG9zdEJvZHlNb2RlID0gXCJtdWx0aXBhcnRcIiB8IFwicmF3XCI7XG5leHBvcnQgdHlwZSBJbWFnZUhvc3RNZXRob2QgPSBcIlBPU1RcIiB8IFwiUFVUXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0Q29uZmlnIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBlbmFibGVkOiBib29sZWFuO1xuICBlbmRwb2ludDogc3RyaW5nO1xuICBtZXRob2Q6IEltYWdlSG9zdE1ldGhvZDtcbiAgYm9keU1vZGU6IEltYWdlSG9zdEJvZHlNb2RlO1xuICBmaWVsZE5hbWU6IHN0cmluZztcbiAgaGVhZGVyczogc3RyaW5nO1xuICByZXNwb25zZVBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbWFnZUhvc3RDaG9pY2Uge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0VXBsb2FkU3VjY2VzcyB7XG4gIGhvc3RJZDogc3RyaW5nO1xuICBob3N0TmFtZTogc3RyaW5nO1xuICB1cmw6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbWFnZUhvc3RVcGxvYWRGYWlsdXJlIHtcbiAgaG9zdElkOiBzdHJpbmc7XG4gIGhvc3ROYW1lOiBzdHJpbmc7XG4gIGVycm9yOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0VXBsb2FkQmF0Y2gge1xuICBzdWNjZXNzZXM6IEltYWdlSG9zdFVwbG9hZFN1Y2Nlc3NbXTtcbiAgZmFpbHVyZXM6IEltYWdlSG9zdFVwbG9hZEZhaWx1cmVbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUltYWdlSG9zdENvbmZpZyhpbmRleCA9IDEpOiBJbWFnZUhvc3RDb25maWcge1xuICByZXR1cm4ge1xuICAgIGlkOiBgaG9zdF8ke0RhdGUubm93KCkudG9TdHJpbmcoMzYpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDgpfWAsXG4gICAgbmFtZTogYFx1NTZGRVx1NUU4QSAke2luZGV4fWAsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBlbmRwb2ludDogXCJcIixcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGJvZHlNb2RlOiBcIm11bHRpcGFydFwiLFxuICAgIGZpZWxkTmFtZTogXCJmaWxlXCIsXG4gICAgaGVhZGVyczogXCJcIixcbiAgICByZXNwb25zZVBhdGg6IFwiZGF0YS51cmxcIlxuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBTdHVkaW9TZXR0aW5ncyB7XG4gIGRlZmF1bHRGb2xkZXI6IHN0cmluZztcbiAgZmlsZVByZWZpeDogc3RyaW5nO1xuICBhc3NldEZvbGRlcjogc3RyaW5nO1xuICBkZWZhdWx0TGF5b3V0OiBMYXlvdXRNb2RlO1xuICBkZWZhdWx0VGhlbWU6IFRoZW1lTW9kZTtcbiAgZGVmYXVsdE5vZGVTaGFwZTogTm9kZVNoYXBlO1xuICByZWRpcmVjdExlZ2FjeUZpbGVzOiBib29sZWFuO1xuICBzaG93R3JpZDogYm9vbGVhbjtcbiAgc2hvd1Rhc2tQcm9ncmVzczogYm9vbGVhbjtcbiAgYXV0b0ZpdE9uT3BlbjogYm9vbGVhbjtcbiAgaGlzdG9yeUxpbWl0OiBudW1iZXI7XG4gIGVtYmVkTWF4SGVpZ2h0OiBudW1iZXI7XG4gIGJhY2tncm91bmRDb2xvcjogc3RyaW5nO1xuICBiYWNrZ3JvdW5kUGF0dGVybjogQmFja2dyb3VuZFBhdHRlcm47XG4gIGJhY2tncm91bmRQYXR0ZXJuQ29sb3I6IHN0cmluZztcbiAgZm9udEZhbWlseTogRm9udEZhbWlseU1vZGU7XG4gIGN1c3RvbUZvbnQ6IHN0cmluZztcbiAgZm9udFNpemU6IG51bWJlcjtcbiAgZWRnZUNvbG9yOiBzdHJpbmc7XG4gIGVkZ2VXaWR0aDogbnVtYmVyO1xuICBlZGdlU3R5bGU6IEVkZ2VTdHlsZTtcbiAgbm9kZUJhY2tncm91bmRDb2xvcjogc3RyaW5nO1xuICB0ZXh0Q29sb3I6IHN0cmluZztcbiAgbm9kZUJvcmRlckNvbG9yOiBzdHJpbmc7XG4gIG5vZGVCb3JkZXJXaWR0aDogbnVtYmVyO1xuICBkZWZhdWx0VGV4dEJvbGQ6IGJvb2xlYW47XG4gIGRlZmF1bHRUZXh0SXRhbGljOiBib29sZWFuO1xuICBkZWZhdWx0VGV4dFVuZGVybGluZTogYm9vbGVhbjtcbiAgaW1hZ2VIb3N0czogSW1hZ2VIb3N0Q29uZmlnW107XG4gIGF1dG9VcGxvYWRFbmFibGVkOiBib29sZWFuO1xuICBhdXRvVXBsb2FkRGVsYXlTZWNvbmRzOiBudW1iZXI7XG4gIGF1dG9VcGxvYWRIb3N0SWRzOiBzdHJpbmdbXTtcbiAgZGVsZXRlTG9jYWxBZnRlclVwbG9hZDogYm9vbGVhbjtcbiAgaW1hZ2VGYWlsb3ZlckVuYWJsZWQ6IGJvb2xlYW47XG4gIGltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kczogbnVtYmVyO1xuICBpbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjazogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IE1pbmRNYXBTdHVkaW9TZXR0aW5ncyA9IHtcbiAgZGVmYXVsdEZvbGRlcjogXCJcIixcbiAgZmlsZVByZWZpeDogXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIixcbiAgYXNzZXRGb2xkZXI6IFwiTWluZE1hcCBBc3NldHNcIixcbiAgZGVmYXVsdExheW91dDogXCJyaWdodFwiLFxuICBkZWZhdWx0VGhlbWU6IFwiYXV0b1wiLFxuICBkZWZhdWx0Tm9kZVNoYXBlOiBcInJvdW5kZWRcIixcbiAgcmVkaXJlY3RMZWdhY3lGaWxlczogdHJ1ZSxcbiAgc2hvd0dyaWQ6IHRydWUsXG4gIHNob3dUYXNrUHJvZ3Jlc3M6IHRydWUsXG4gIGF1dG9GaXRPbk9wZW46IHRydWUsXG4gIGhpc3RvcnlMaW1pdDogMTIwLFxuICBlbWJlZE1heEhlaWdodDogNTIwLFxuICBiYWNrZ3JvdW5kQ29sb3I6IFwiXCIsXG4gIGJhY2tncm91bmRQYXR0ZXJuOiBcImdyaWRcIixcbiAgYmFja2dyb3VuZFBhdHRlcm5Db2xvcjogXCIjOTRhM2I4XCIsXG4gIGZvbnRGYW1pbHk6IFwib2JzaWRpYW5cIixcbiAgY3VzdG9tRm9udDogXCJcIixcbiAgZm9udFNpemU6IDE0LFxuICBlZGdlQ29sb3I6IFwiXCIsXG4gIGVkZ2VXaWR0aDogMi4yLFxuICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gIG5vZGVCYWNrZ3JvdW5kQ29sb3I6IFwiXCIsXG4gIHRleHRDb2xvcjogXCJcIixcbiAgbm9kZUJvcmRlckNvbG9yOiBcIlwiLFxuICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gIGRlZmF1bHRUZXh0Qm9sZDogZmFsc2UsXG4gIGRlZmF1bHRUZXh0SXRhbGljOiBmYWxzZSxcbiAgZGVmYXVsdFRleHRVbmRlcmxpbmU6IGZhbHNlLFxuICBpbWFnZUhvc3RzOiBbXSxcbiAgYXV0b1VwbG9hZEVuYWJsZWQ6IGZhbHNlLFxuICBhdXRvVXBsb2FkRGVsYXlTZWNvbmRzOiAxMCxcbiAgYXV0b1VwbG9hZEhvc3RJZHM6IFtdLFxuICBkZWxldGVMb2NhbEFmdGVyVXBsb2FkOiB0cnVlLFxuICBpbWFnZUZhaWxvdmVyRW5hYmxlZDogdHJ1ZSxcbiAgaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzOiA4LFxuICBpbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjazogdHJ1ZVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldHRpbmdzVG9BcHBlYXJhbmNlKHNldHRpbmdzOiBNaW5kTWFwU3R1ZGlvU2V0dGluZ3MpOiBNaW5kTWFwQXBwZWFyYW5jZSB7XG4gIHJldHVybiB7XG4gICAgYmFja2dyb3VuZENvbG9yOiBzZXR0aW5ncy5iYWNrZ3JvdW5kQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIGJhY2tncm91bmRQYXR0ZXJuOiBzZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybixcbiAgICBwYXR0ZXJuQ29sb3I6IHNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIGZvbnRGYW1pbHk6IHNldHRpbmdzLmZvbnRGYW1pbHksXG4gICAgY3VzdG9tRm9udDogc2V0dGluZ3MuY3VzdG9tRm9udC50cmltKCkgfHwgdW5kZWZpbmVkLFxuICAgIGZvbnRTaXplOiBzZXR0aW5ncy5mb250U2l6ZSxcbiAgICBlZGdlQ29sb3I6IHNldHRpbmdzLmVkZ2VDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgZWRnZVdpZHRoOiBzZXR0aW5ncy5lZGdlV2lkdGgsXG4gICAgZWRnZVN0eWxlOiBzZXR0aW5ncy5lZGdlU3R5bGUsXG4gICAgbm9kZUNvbG9yOiBzZXR0aW5ncy5ub2RlQmFja2dyb3VuZENvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICB0ZXh0Q29sb3I6IHNldHRpbmdzLnRleHRDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgbm9kZUJvcmRlckNvbG9yOiBzZXR0aW5ncy5ub2RlQm9yZGVyQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIG5vZGVCb3JkZXJXaWR0aDogc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoLFxuICAgIGJvbGQ6IHNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZCxcbiAgICBpdGFsaWM6IHNldHRpbmdzLmRlZmF1bHRUZXh0SXRhbGljLFxuICAgIHVuZGVybGluZTogc2V0dGluZ3MuZGVmYXVsdFRleHRVbmRlcmxpbmVcbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIE1pbmRNYXBTdHVkaW9TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBNaW5kTWFwU3R1ZGlvUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJNaW5kTWFwIFN0dWRpb1wiIH0pO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlx1OEZEOVx1OTFDQ1x1OEJCRVx1N0Y2RVx1NTE2OFx1NUM0MFx1OUVEOFx1OEJBNFx1NTkxNlx1ODlDMlx1MzAwMlx1NjI1M1x1NUYwMFx1ODExMVx1NTZGRVx1NTQwRVx1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1NzBCOVx1NTFGQlx1NURFNVx1NTE3N1x1NjgwRlx1NEUyRFx1NzY4NFx1OEMwM1x1ODI3Mlx1Njc3Rlx1RkYwQ1x1NEUzQVx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTM1NVx1NzJFQ1x1NEZERFx1NUI1OFx1NEUwMFx1NTk1N1x1NjgzN1x1NUYwRlx1MzAwMlwiXG4gICAgfSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTY1ODdcdTRFRjZcdTRFMEVcdTVFMDNcdTVDNDBcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTRGRERcdTVCNThcdTY1ODdcdTRFRjZcdTU5MzlcIilcbiAgICAgIC5zZXREZXNjKFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RkREXHU1QjU4XHU1NzI4XHU1RjUzXHU1MjREXHU3QjE0XHU4QkIwXHU2MjQwXHU1NzI4XHU2NTg3XHU0RUY2XHU1OTM5XHVGRjFCXHU0RTVGXHU1M0VGXHU1ODZCXHU1MTk5XHU0RjhCXHU1OTgyIE1pbmQgTWFwc1x1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiTWluZCBNYXBzXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Rm9sZGVyKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdEZvbGRlciA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OEQ0NFx1NkU5MFx1NjU4N1x1NEVGNlx1NTkzOVwiKVxuICAgICAgLnNldERlc2MoXCJcdThCRTVcdThERUZcdTVGODRcdTc2RjhcdTVCRjlcdTRFOEVcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTYyNDBcdTU3MjhcdTc2RUVcdTVGNTVcdTMwMDJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTRGMUFcdTRGRERcdTVCNThcdTUyMzBcdTIwMUNcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTc2RUVcdTVGNTUvXHU4QkU1XHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5L1x1MjAxRFx1RkYxQlx1NUI1MFx1NUJGQ1x1NTZGRVx1NEYxQVx1NEZERFx1NUI1OFx1NTcyOFx1MjAxQ1x1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NzZFRVx1NUY1NS9cdThCRTVcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcdTU5MzkvXHU3MjM2XHU1QkZDXHU1NkZFXHU1NDBEXHU3OUYwL1x1MjAxRFx1NEUyRFx1MzAwMlx1OUVEOFx1OEJBNFx1NEY3Rlx1NzUyOCBNaW5kTWFwIEFzc2V0c1x1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiTWluZE1hcCBBc3NldHNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmFzc2V0Rm9sZGVyKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRGb2xkZXIgPSB2YWx1ZS50cmltKCkucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIikgfHwgXCJNaW5kTWFwIEFzc2V0c1wiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTU2RkVcdTcyNDdcdTRFMEVcdTU2RkVcdTVFOEFcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdThGRENcdTdBMEJcdTU2RkVcdTcyNDdcdTgxRUFcdTUyQThcdTY1NDVcdTk2OUNcdThGNkNcdTc5RkJcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1RjUzXHU1MjREXHU1NkZFXHU1RThBXHU1NzMwXHU1NzQwXHU1MkEwXHU4RjdEXHU1OTMxXHU4RDI1XHU2MjE2XHU4RDg1XHU2NUY2XHU1NDBFXHVGRjBDXHU2MzA5XHU5NTVDXHU1MENGXHU5ODdBXHU1RThGXHU1QzFEXHU4QkQ1XHU0RTBCXHU0RTAwXHU1NzMwXHU1NzQwXHVGRjFCXHU2MjEwXHU1MjlGXHU1NDBFXHU4MUVBXHU1MkE4XHU1QzA2XHU1M0VGXHU3NTI4XHU1NzMwXHU1NzQwXHU0RkREXHU1QjU4XHU0RTNBXHU2NUIwXHU3Njg0XHU0RTNCXHU1NzMwXHU1NzQwXHUzMDAyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlckVuYWJsZWQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyRW5hYmxlZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlckVuYWJsZWQpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1NTM1NVx1NEUyQVx1OTU1Q1x1NTBDRlx1N0I0OVx1NUY4NVx1NjVGNlx1OTVGNFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1NTZGRVx1NzI0N1x1NTcyOFx1OEJFNVx1NjVGNlx1OTVGNFx1NTE4NVx1NjcyQVx1NjIxMFx1NTI5Rlx1NTJBMFx1OEY3RFx1RkYwQ1x1NUMzMVx1NUMxRFx1OEJENVx1NEUwQlx1NEUwMFx1NEUyQVx1OTU1Q1x1NTBDRlx1MzAwMlx1ODMwM1x1NTZGNCAyXHUyMDEzMzAgXHU3OUQyXHUzMDAyXCIpXG4gICAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgICAgLnNldExpbWl0cygyLCAzMCwgMSlcbiAgICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHMpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1NjcyQ1x1NTczMFx1NTI2Rlx1NjcyQ1x1NEY1Q1x1NEUzQVx1NjcwMFx1NTQwRVx1NTZERVx1OTAwMFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1OEZEQ1x1N0EwQlx1OTU1Q1x1NTBDRlx1NTE2OFx1OTBFOFx1NTkzMVx1NjU0OFx1NjVGNlx1RkYwQ1x1NTk4Mlx1Njc5Q1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NEVDRFx1NUI1OFx1NTcyOFx1RkYwQ1x1NTIxOVx1NjcwMFx1NTQwRVx1NUMxRFx1OEJENVx1NjcyQ1x1NTczMFx1NTI2Rlx1NjcyQ1x1MzAwMlwiKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjaylcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjayA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTU0MEVcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1NkZFXHU3MjQ3XHU0RjFBXHU1MTQ4XHU0RkREXHU1QjU4XHU1MjMwXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU3Njg0XHU2NzJDXHU1NzMwXHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU1MThEXHU2MzA5XHU4QkJFXHU1QjlBXHU1RUY2XHU4RkRGXHU0RTBBXHU0RjIwXHUzMDAyXHU1M0VBXHU2NzA5XHU1MTY4XHU5MEU4XHU3NkVFXHU2ODA3XHU1NkZFXHU1RThBXHU2MjEwXHU1MjlGXHU1NDBFXHVGRjBDXHU2MjREXHU0RjFBXHU1MjA3XHU2MzYyXHU0RTNBXHU4RkRDXHU3QTBCXHU3RjUxXHU1NzQwXHUzMDAyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEVuYWJsZWQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkRW5hYmxlZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEVuYWJsZWQpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1ODFFQVx1NTJBOFx1NEUwQVx1NEYyMFx1NUVGNlx1OEZERlwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1N0M5OFx1OEQzNFx1NTQwRVx1N0I0OVx1NUY4NSAwXHUyMDEzMzAwIFx1NzlEMlx1NTE4RFx1NEUwQVx1NEYyMFx1RkYwQ1x1NEZCRlx1NEU4RVx1NjRBNFx1OTUwMFx1NjIxNlx1N0VFN1x1N0VFRFx1N0YxNlx1OEY5MVx1MzAwMlwiKVxuICAgICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAgIC5zZXRMaW1pdHMoMCwgMzAwLCAxKVxuICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWREZWxheVNlY29uZHMpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZERlbGF5U2Vjb25kcyA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJcdTUxNjhcdTkwRThcdTYyMTBcdTUyOUZcdTU0MEVcdTUyMjBcdTk2NjRcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTYzRDJcdTRFRjZcdTRGMUFcdTUxNDhcdTUxOTlcdTUxNjVcdThGRENcdTdBMEJcdTdGNTFcdTU3NDBcdTVFNzZcdTRGRERcdTVCNThcdTgxMTFcdTU2RkVcdUZGMENcdTUxOERcdTY4QzBcdTY3RTVcdTU2RkVcdTcyNDdcdTY2MkZcdTU0MjZcdTg4QUJcdTUxNzZcdTRFRDZcdTgxMTFcdTU2RkVcdTVGMTVcdTc1MjhcdUZGMUJcdTc4NkVcdThCQTRcdTVCODlcdTUxNjhcdTU0MEVcdTYyNERcdTUyMjBcdTk2NjRcdTY3MkNcdTU3MzBcdTY1ODdcdTRFRjZcdTMwMDJcdTRFRkJcdTRFMDBcdTU2RkVcdTVFOEFcdTU5MzFcdThEMjVcdTY1RjZcdTRGMUFcdTRGRERcdTc1NTlcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTMwMDJcIilcbiAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVsZXRlTG9jYWxBZnRlclVwbG9hZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWxldGVMb2NhbEFmdGVyVXBsb2FkID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdHMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RzO1xuICAgIGNvbnN0IGhvc3RzSGVhZGVyID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0cy1oZWFkZXJcIiB9KTtcbiAgICBob3N0c0hlYWRlci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJcdTU2RkVcdTVFOEFcdTkxNERcdTdGNkVcIiB9KTtcbiAgICBjb25zdCBhZGRIb3N0ID0gaG9zdHNIZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NjVCMFx1NTg5RVx1NTZGRVx1NUU4QVwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBhZGRIb3N0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBob3N0ID0gY3JlYXRlSW1hZ2VIb3N0Q29uZmlnKGhvc3RzLmxlbmd0aCArIDEpO1xuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0cy5wdXNoKGhvc3QpO1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKS50aGVuKCgpID0+IHRoaXMuZGlzcGxheSgpKTtcbiAgICB9KTtcblxuICAgIGlmICghaG9zdHMubGVuZ3RoKSB7XG4gICAgICBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uIG1tcy1pbWFnZS1ob3N0LWVtcHR5XCIsIHRleHQ6IFwiXHU1QzFBXHU2NzJBXHU5MTREXHU3RjZFXHU1NkZFXHU1RThBXHUzMDAyXHU2NUIwXHU1ODlFXHU1NDBFXHU1M0VGXHU0RUU1XHU2RDRCXHU4QkQ1XHU0RTBBXHU0RjIwXHU2M0E1XHU1M0UzXHVGRjBDXHU1RTc2XHU5MDA5XHU2MkU5XHU0RTAwXHU0RTJBXHU2MjE2XHU1OTFBXHU0RTJBXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU3NkVFXHU2ODA3XHUzMDAyXCIgfSk7XG4gICAgfVxuXG4gICAgaG9zdHMuZm9yRWFjaCgoaG9zdCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNhcmQgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWltYWdlLWhvc3QtY2FyZFwiIH0pO1xuICAgICAgY29uc3QgdGl0bGUgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbXMtaW1hZ2UtaG9zdC1jYXJkLXRpdGxlXCIgfSk7XG4gICAgICB0aXRsZS5jcmVhdGVFbChcInN0cm9uZ1wiLCB7IHRleHQ6IGhvc3QubmFtZSB8fCBgXHU1NkZFXHU1RThBICR7aW5kZXggKyAxfWAgfSk7XG4gICAgICBjb25zdCBzdGF0dXMgPSB0aXRsZS5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LXN0YXR1c1wiLCB0ZXh0OiBob3N0LmVuYWJsZWQgPyBcIlx1NURGMlx1NTQyRlx1NzUyOFwiIDogXCJcdTVERjJcdTUwNUNcdTc1MjhcIiB9KTtcbiAgICAgIHN0YXR1cy50b2dnbGVDbGFzcyhcImlzLWVuYWJsZWRcIiwgaG9zdC5lbmFibGVkKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdTU0MERcdTc5RjBcIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5uYW1lKVxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihgXHU1NkZFXHU1RThBICR7aW5kZXggKyAxfWApXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaG9zdC5uYW1lID0gdmFsdWUudHJpbSgpIHx8IGBcdTU2RkVcdTVFOEEgJHtpbmRleCArIDF9YDtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAgIC5zZXRUb29sdGlwKFwiXHU1NDJGXHU3NTI4XHU4QkU1XHU1NkZFXHU1RThBXCIpXG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QuZW5hYmxlZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBob3N0LmVuYWJsZWQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWRIb3N0SWRzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IGhvc3QuaWQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNhcmQpXG4gICAgICAgIC5zZXROYW1lKFwiXHU0RTBBXHU0RjIwIEFQSVwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImh0dHBzOi8vZXhhbXBsZS5jb20vYXBpL3VwbG9hZFwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0LmVuZHBvaW50KVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5lbmRwb2ludCA9IHZhbHVlLnRyaW0oKTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdThCRjdcdTZDNDJcdTY1QjlcdTZDRDVcdTRFMEVcdTY4M0NcdTVGMEZcIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKFwiUE9TVFwiLCBcIlBPU1RcIilcbiAgICAgICAgICAuYWRkT3B0aW9uKFwiUFVUXCIsIFwiUFVUXCIpXG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QubWV0aG9kKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5tZXRob2QgPSB2YWx1ZSBhcyBJbWFnZUhvc3RNZXRob2Q7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSlcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKFwibXVsdGlwYXJ0XCIsIFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiKVxuICAgICAgICAgIC5hZGRPcHRpb24oXCJyYXdcIiwgXCJcdTUzOUZcdTU5Q0JcdTRFOENcdThGREJcdTUyMzZcIilcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5ib2R5TW9kZSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuYm9keU1vZGUgPSB2YWx1ZSBhcyBJbWFnZUhvc3RCb2R5TW9kZTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdTY1ODdcdTRFRjZcdTVCNTdcdTZCQjVcdTU0MERcIilcbiAgICAgICAgLnNldERlc2MoXCJtdWx0aXBhcnQgXHU2QTIxXHU1RjBGXHU1RTM4XHU4OUMxXHU1MDNDXHVGRjFBZmlsZVx1MzAwMWltYWdlXHUzMDAxc291cmNlXHUzMDAyXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QuZmllbGROYW1lKVxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImZpbGVcIilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuZmllbGROYW1lID0gdmFsdWUudHJpbSgpIHx8IFwiZmlsZVwiOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjYXJkKVxuICAgICAgICAuc2V0TmFtZShcIlx1OEJGN1x1NkM0Mlx1NTkzNCBKU09OXCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU0RjhCXHU1OTgyIEF1dGhvcml6YXRpb25cdTMwMDFYLUFQSS1LZXlcdTMwMDJcdTVCQzZcdTk0QTVcdTRGRERcdTVCNThcdTU3MjhcdTYzRDJcdTRFRjYgZGF0YS5qc29uXHUzMDAyXCIpXG4gICAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0LmhlYWRlcnMpXG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCd7XCJBdXRob3JpemF0aW9uXCI6XCJCZWFyZXIgLi4uXCJ9JylcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuaGVhZGVycyA9IHZhbHVlLnRyaW0oKTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdThGRDRcdTU2REVcdTdGNTFcdTU3NDBcdTVCNTdcdTZCQjVcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTRGOEJcdTU5ODIgZGF0YS51cmxcdUZGMUJcdTc1NTlcdTdBN0FcdTRGMUFcdTVDMURcdThCRDVcdTVFMzhcdTg5QzFcdTVCNTdcdTZCQjVcdTMwMDJcIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5yZXNwb25zZVBhdGgpXG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiZGF0YS51cmxcIilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QucmVzcG9uc2VQYXRoID0gdmFsdWUudHJpbSgpOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBjb25zdCBpc0F1dG9UYXJnZXQgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5pbmNsdWRlcyhob3N0LmlkKTtcbiAgICAgIG5ldyBTZXR0aW5nKGNhcmQpXG4gICAgICAgIC5zZXROYW1lKFwiXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU3NkVFXHU2ODA3XCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU1M0VGXHU0RUU1XHU1NDBDXHU2NUY2XHU5MDA5XHU2MkU5XHU1OTFBXHU0RTJBXHU1NkZFXHU1RThBXHVGRjFCXHU2MjRCXHU1MkE4XHU0RTBBXHU0RjIwXHU2NUY2XHU0RUNEXHU1M0VGXHU0RTM0XHU2NUY2XHU5MDA5XHU2MkU5XHU1MTc2XHU0RUQ2XHU3RUM0XHU1NDA4XHUzMDAyXCIpXG4gICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKGlzQXV0b1RhcmdldClcbiAgICAgICAgICAuc2V0RGlzYWJsZWQoIWhvc3QuZW5hYmxlZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTZXQodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSBzZWxlY3RlZC5hZGQoaG9zdC5pZCk7IGVsc2Ugc2VsZWN0ZWQuZGVsZXRlKGhvc3QuaWQpO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMgPSBBcnJheS5mcm9tKHNlbGVjdGVkKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pKTtcblxuICAgICAgY29uc3QgYWN0aW9ucyA9IGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LWFjdGlvbnNcIiB9KTtcbiAgICAgIGNvbnN0IHRlc3QgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTY4QzBcdTZENEIgQVBJIFx1OEZERVx1OTAxQVx1NjAyN1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgIHRlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGVzdC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIHRlc3Quc2V0VGV4dChcIlx1NjhDMFx1NkQ0Qlx1NEUyRFx1MjAyNlwiKTtcbiAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi50ZXN0SW1hZ2VIb3N0KGhvc3QuaWQpLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgIHRlc3QuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB0ZXN0LnNldFRleHQoXCJcdTY4QzBcdTZENEIgQVBJIFx1OEZERVx1OTAxQVx1NjAyN1wiKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHJlbW92ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTIyMFx1OTY2NFx1NTZGRVx1NUU4QVwiLCBjbHM6IFwibW9kLXdhcm5pbmdcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICByZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0cyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlSG9zdHMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmlkICE9PSBob3N0LmlkKTtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gaG9zdC5pZCk7XG4gICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU1MjIwXHU5NjY0XHU1NkZFXHU1RThBXHVGRjFBJHtob3N0Lm5hbWV9YCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2NUIwXHU2NTg3XHU0RUY2XHU1NDBEXHU1MjREXHU3RjAwXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NjVCMFx1NUVGQVx1ODExMVx1NTZGRVx1NjVGNlx1NEY3Rlx1NzUyOFx1RkYxQVx1NTI0RFx1N0YwMCArIFx1NjVFNVx1NjcxRlx1NjVGNlx1OTVGNFx1MzAwMlx1NjU4N1x1NEVGNlx1NTQwRVx1N0YwMFx1NTZGQVx1NUI5QVx1NEUzQSAubWluZG1hcFx1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlUHJlZml4KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZVByZWZpeCA9IHZhbHVlLnRyaW0oKSB8fCBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU1RTAzXHU1QzQwXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTM1NVx1NEZBN1x1OTAwMlx1NTQwOFx1NkQ0MVx1N0EwQlx1NjJDNlx1ODlFM1x1RkYwQ1x1NTNDQ1x1NEZBN1x1OTAwMlx1NTQwOFx1NTkzNFx1ODExMVx1OThDRVx1NjZCNFx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcInJpZ2h0XCIsIFwiXHU1NDExXHU1M0YzXHU1QzU1XHU1RjAwXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJiYWxhbmNlZFwiLCBcIlx1NURFNlx1NTNGM1x1NUU3M1x1ODg2MVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdExheW91dClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQgPSB2YWx1ZSBhcyBMYXlvdXRNb2RlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU0RTNCXHU5ODk4XCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwiYXV0b1wiLCBcIlx1OERERlx1OTY4RiBPYnNpZGlhblwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwibGlnaHRcIiwgXCJcdTZENDVcdTgyNzJcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImRhcmtcIiwgXCJcdTZERjFcdTgyNzJcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUaGVtZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUaGVtZSA9IHZhbHVlIGFzIFRoZW1lTW9kZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU3NTNCXHU1RTAzXHU4MENDXHU2NjZGXCIgfSk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBcIlx1ODBDQ1x1NjY2Rlx1OTg5Q1x1ODI3MlwiLFxuICAgICAgXCJcdTc1NTlcdTdBN0FcdTY1RjZcdThEREZcdTk2OEYgT2JzaWRpYW4gXHU1RjUzXHU1MjREXHU0RTNCXHU5ODk4XHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZENvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiNmOGZhZmNcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTNFRlx1OTAwOVx1NjJFOVx1N0Y1MVx1NjgzQ1x1MzAwMVx1NzBCOVx1OTYzNVx1NjIxNlx1N0VBRlx1ODI3Mlx1ODBDQ1x1NjY2Rlx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcIm5vbmVcIiwgXCJcdTY1RTBcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImdyaWRcIiwgXCJcdTdGNTFcdTY4M0NcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImRvdHNcIiwgXCJcdTcwQjlcdTk2MzVcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm4gPSB2YWx1ZSBhcyBCYWNrZ3JvdW5kUGF0dGVybjtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93R3JpZCA9IHZhbHVlICE9PSBcIm5vbmVcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NjNBN1x1NTIzNlx1N0Y1MVx1NjgzQ1x1N0VCRlx1NjIxNlx1NzBCOVx1OTYzNVx1NzY4NFx1OTg5Q1x1ODI3Mlx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm5Db2xvcixcbiAgICAgIGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybkNvbG9yID0gdmFsdWUgfHwgXCIjOTRhM2I4XCI7IH0sXG4gICAgICBcIiM5NGEzYjhcIixcbiAgICAgIGZhbHNlXG4gICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NUI1N1x1NEY1M1x1NEUwRVx1NjU4N1x1NUI1N1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NUI1N1x1NEY1M1wiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcIm9ic2lkaWFuXCIsIFwiXHU4RERGXHU5NjhGIE9ic2lkaWFuXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJzYW5zXCIsIFwiXHU2NUUwXHU4ODZDXHU3RUJGXHU1QjU3XHU0RjUzXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJzZXJpZlwiLCBcIlx1ODg2Q1x1N0VCRlx1NUI1N1x1NEY1M1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwibW9ub1wiLCBcIlx1N0I0OVx1NUJCRFx1NUI1N1x1NEY1M1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiY3VzdG9tXCIsIFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHU1QjU3XHU0RjUzXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250RmFtaWx5KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udEZhbWlseSA9IHZhbHVlIGFzIEZvbnRGYW1pbHlNb2RlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbnRGYW1pbHkgPT09IFwiY3VzdG9tXCIpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1ODFFQVx1NUI5QVx1NEU0OVx1NUI1N1x1NEY1M1x1NTQwRFx1NzlGMFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1NTg2Qlx1NTE5OVx1N0NGQlx1N0VERlx1NEUyRFx1NURGMlx1N0VDRlx1NUI4OVx1ODhDNVx1NzY4NFx1NUI1N1x1NEY1M1x1NTQwRFx1NzlGMFx1RkYwQ1x1NEY4Qlx1NTk4MiBNaWNyb3NvZnQgWWFIZWlcdTMwMDFQaW5nRmFuZyBTQ1x1MzAwMlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIk1pY3Jvc29mdCBZYUhlaVwiKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jdXN0b21Gb250KVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmN1c3RvbUZvbnQgPSB2YWx1ZS50cmltKCkuc2xpY2UoMCwgMTIwKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NUI1N1x1NTNGN1wiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMTBcdTIwMTMzMCBcdTUwQ0ZcdTdEMjBcdTMwMDJcdTgyODJcdTcwQjlcdTRFQ0RcdTUzRUZcdTUzNTVcdTcyRUNcdTg5ODZcdTc2RDZcdTVCNTdcdTUzRjdcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMTAsIDMwLCAxKVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udFNpemUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250U2l6ZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTlFRDhcdThCQTRcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RjdGXHU3NTI4IE9ic2lkaWFuIFx1NEUzQlx1OTg5OFx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3Mlx1RkYxQlx1NjgzOVx1ODI4Mlx1NzBCOVx1NEVDRFx1NEYxOFx1NTE0OFx1NEY3Rlx1NzUyOFx1NEUzQlx1OTg5OFx1NUYzQVx1OEMwM1x1ODI3Mlx1NzY4NFx1NUJGOVx1NkJENFx1NjU4N1x1NUI1N1x1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MudGV4dENvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnRleHRDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjMGYxNzJhXCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NjU4N1x1NUI1N1x1NTJBMFx1N0M5N1wiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NjU4N1x1NUI1N1x1NjU5Q1x1NEY1M1wiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0SXRhbGljKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRleHRJdGFsaWMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTY1ODdcdTVCNTdcdTRFMEJcdTUyMTJcdTdFQkZcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGV4dFVuZGVybGluZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0VW5kZXJsaW5lID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTgyODJcdTcwQjlcdTY4MzdcdTVGMEZcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTgyODJcdTcwQjlcdTVGNjJcdTcyQjZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1M0VBXHU1RjcxXHU1NENEXHU2NzJBXHU1MzU1XHU3MkVDXHU4QkJFXHU3RjZFXHU1RjYyXHU3MkI2XHU3Njg0XHU4MjgyXHU3MEI5XHUzMDAyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwicm91bmRlZFwiLCBcIlx1NTcwNlx1ODlEMlwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwicGlsbFwiLCBcIlx1ODBGNlx1NTZDQVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwicmVjdGFuZ2xlXCIsIFwiXHU3NkY0XHU4OUQyXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Tm9kZVNoYXBlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdE5vZGVTaGFwZSA9IHZhbHVlIGFzIE5vZGVTaGFwZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU5RUQ4XHU4QkE0XHU4MjgyXHU3MEI5XHU4MENDXHU2NjZGXHU4MjcyXCIsXG4gICAgICBcIlx1NzU1OVx1N0E3QVx1NjVGNlx1OERERlx1OTY4RiBPYnNpZGlhbiBcdTRFM0JcdTk4OThcdTMwMDJcdTUzNTVcdTRFMkFcdTgyODJcdTcwQjlcdThCQkVcdTdGNkVcdTc2ODRcdTk4OUNcdTgyNzJcdTRGMThcdTUxNDhcdTdFQTdcdTY2RjRcdTlBRDhcdTMwMDJcIixcbiAgICAgICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCYWNrZ3JvdW5kQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJhY2tncm91bmRDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjZmZmZmZmXCJcbiAgICApO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTlFRDhcdThCQTRcdTgyODJcdTcwQjlcdThGQjlcdTY4NDZcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU4RERGXHU5NjhGIE9ic2lkaWFuIFx1NEUzQlx1OTg5OFx1OEZCOVx1Njg0Nlx1OTg5Q1x1ODI3Mlx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlckNvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCb3JkZXJDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjOTRhM2I4XCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1ODI4Mlx1NzBCOVx1OEZCOVx1Njg0Nlx1N0M5N1x1N0VDNlwiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMFx1MjAxMzYgXHU1MENGXHU3RDIwXHVGRjFCMCBcdTg4NjhcdTc5M0FcdTY1RTBcdThGQjlcdTY4NDZcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMCwgNiwgMC41KVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdThGREVcdTdFQkZcdTY4MzdcdTVGMEZcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdThGREVcdTdFQkZcdTdDN0JcdTU3OEJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJjdXJ2ZWRcIiwgXCJcdTY2RjJcdTdFQkZcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInN0cmFpZ2h0XCIsIFwiXHU3NkY0XHU3RUJGXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJlbGJvd1wiLCBcIlx1NjI5OFx1N0VCRlwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVN0eWxlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVN0eWxlID0gdmFsdWUgYXMgRWRnZVN0eWxlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdThGREVcdTdFQkZcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RTNCXHU5ODk4XHU1RjNBXHU4QzAzXHU4MjcyXHUzMDAyXHU4MjgyXHU3MEI5XHU1MzU1XHU3MkVDXHU4QkJFXHU3RjZFXHU5ODlDXHU4MjcyXHU2NUY2XHVGRjBDXHU1M0VGXHU3RUU3XHU3RUVEXHU0RTNBXHU4QkU1XHU1MjA2XHU2NTJGXHU4RkRFXHU3RUJGXHU3NzQwXHU4MjcyXHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZUNvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiM3YzhhYTVcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4RkRFXHU3RUJGXHU3Qzk3XHU3RUM2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODMwM1x1NTZGNCAwLjVcdTIwMTM4IFx1NTBDRlx1N0QyMFx1MzAwMlwiKVxuICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgLnNldExpbWl0cygwLjUsIDgsIDAuNSlcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU3RjE2XHU4RjkxXHU0RTBFXHU1MTdDXHU1QkI5XCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2MjUzXHU1RjAwXHU2NUU3XHU3MjQ4XHU4MTExXHU1NkZFXHU2NUY2XHU4MUVBXHU1MkE4XHU4RjZDXHU2MzYyXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODFFQVx1NTJBOFx1NTIxQlx1NUVGQVx1NTQwQ1x1NTQwRCAubWluZG1hcCBcdTY1ODdcdTRFRjZcdTVFNzZcdTYyNTNcdTVGMDBcdUZGMUJcdTY1RTdcdTY1ODdcdTRFRjZcdTRGMUFcdTRGRERcdTc1NTlcdTRFM0FcdTU5MDdcdTRFRkRcdUZGMENcdTRFMERcdTRGMUFcdTg5ODZcdTc2RDZcdTYyMTZcdTUyMjBcdTk2NjRcdTMwMDJcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWRpcmVjdExlZ2FjeUZpbGVzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkaXJlY3RMZWdhY3lGaWxlcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2NjNFXHU3OTNBXHU0RUZCXHU1MkExXHU4RkRCXHU1RUE2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTcyOFx1NTMwNVx1NTQyQlx1NEVGQlx1NTJBMVx1NzY4NFx1NTIwNlx1NjUyRlx1ODI4Mlx1NzBCOVx1NUU5NVx1OTBFOFx1NjYzRVx1NzkzQVx1NUI4Q1x1NjIxMFx1NzY3RVx1NTIwNlx1NkJENFx1MzAwMlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrUHJvZ3Jlc3MpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VGFza1Byb2dyZXNzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2MjUzXHU1RjAwXHU2NUY2XHU4MUVBXHU1MkE4XHU5MDAyXHU1RTk0XHU3NTNCXHU1RTAzXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0ZpdE9uT3BlbilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GaXRPbk9wZW4gPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NjRBNFx1OTUwMFx1NTM4Nlx1NTNGMlx1NkI2NVx1NjU3MFwiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMjBcdTIwMTM1MDBcdUZGMUJcdTY1NzBcdTUwM0NcdThEOEFcdTU5MjdcdTUzNjBcdTc1MjhcdTc2ODRcdTUxODVcdTVCNThcdThEOEFcdTU5MUFcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMjAsIDUwMCwgMTApXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTVENENcdTUxNjVcdTk4ODRcdTg5QzhcdTY3MDBcdTU5MjdcdTlBRDhcdTVFQTZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU4MzAzXHU1NkY0IDI0MFx1MjAxMzEyMDAgXHU1MENGXHU3RDIwXHUzMDAyXCIpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDI0MCwgMTIwMCwgMjApXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbWJlZE1heEhlaWdodClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVtYmVkTWF4SGVpZ2h0ID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICBnZXRWYWx1ZTogKCkgPT4gc3RyaW5nLFxuICAgIHNldFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPixcbiAgICBmYWxsYmFjazogc3RyaW5nLFxuICAgIGFsbG93UmVzZXQgPSB0cnVlXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXIpXG4gICAgICAuc2V0TmFtZShuYW1lKVxuICAgICAgLnNldERlc2MoZGVzY3JpcHRpb24pXG4gICAgICAuYWRkQ29sb3JQaWNrZXIoKHBpY2tlcikgPT4gcGlja2VyXG4gICAgICAgIC5zZXRWYWx1ZShnZXRWYWx1ZSgpIHx8IGZhbGxiYWNrKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgc2V0VmFsdWUodmFsdWUpO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuICAgIGlmIChhbGxvd1Jlc2V0KSB7XG4gICAgICBzZXR0aW5nLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiBidXR0b25cbiAgICAgICAgLnNldEJ1dHRvblRleHQoXCJcdThEREZcdTk2OEZcdTRFM0JcdTk4OThcIilcbiAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHNldFZhbHVlKFwiXCIpO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZUFuZFJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgdGhpcy5wbHVnaW4ucmVmcmVzaE9wZW5WaWV3cygpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgbm9kZUNvbnRlbnRCbG9ja3MsIG5vZGVQbGFpblRleHQsIHR5cGUgRWRnZVN0eWxlLCB0eXBlIEZvbnRGYW1pbHlNb2RlLCB0eXBlIExheW91dE1vZGUsIHR5cGUgTWluZE1hcEFwcGVhcmFuY2UsIHR5cGUgTWluZE1hcE5vZGUsIHR5cGUgTWluZE1hcFRleHRSdW4sIHR5cGUgTm9kZVNoYXBlIH0gZnJvbSBcIi4vbW9kZWxcIjtcblxuZXhwb3J0IGludGVyZmFjZSBOb2RlUG9zaXRpb24ge1xuICBub2RlOiBNaW5kTWFwTm9kZTtcbiAgcGFyZW50SWQ6IHN0cmluZyB8IG51bGw7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICBkZXB0aDogbnVtYmVyO1xuICBzaWRlOiAtMSB8IDAgfCAxO1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMYXlvdXRSZXN1bHQge1xuICBub2RlczogTm9kZVBvc2l0aW9uW107XG4gIGJ5SWQ6IE1hcDxzdHJpbmcsIE5vZGVQb3NpdGlvbj47XG4gIG1pblg6IG51bWJlcjtcbiAgbWF4WDogbnVtYmVyO1xuICBtaW5ZOiBudW1iZXI7XG4gIG1heFk6IG51bWJlcjtcbn1cblxuY29uc3QgUk9PVF9XSURUSCA9IDE5NjtcbmNvbnN0IE5PREVfV0lEVEggPSAxNzY7XG5jb25zdCBIX0dBUCA9IDExMjtcbmNvbnN0IFZfR0FQID0gMjQ7XG5cbmZ1bmN0aW9uIHZpc2libGVDaGlsZHJlbihub2RlOiBNaW5kTWFwTm9kZSk6IE1pbmRNYXBOb2RlW10ge1xuICByZXR1cm4gbm9kZS5jb2xsYXBzZWQgPyBbXSA6IG5vZGUuY2hpbGRyZW47XG59XG5cbmZ1bmN0aW9uIG5vZGVEaW1lbnNpb25zKG5vZGU6IE1pbmRNYXBOb2RlLCBkZXB0aDogbnVtYmVyLCBkZWZhdWx0Rm9udFNpemUgPSAxNCk6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfSB7XG4gIGNvbnN0IGZvbnRTaXplID0gbm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplO1xuICBjb25zdCBleHRyYVdpZHRoID0gTWF0aC5tYXgoMCwgZm9udFNpemUgLSAxNCkgKiA0O1xuICBsZXQgd2lkdGggPSAoZGVwdGggPT09IDAgPyBST09UX1dJRFRIIDogTk9ERV9XSURUSCkgKyBleHRyYVdpZHRoO1xuICBsZXQgaGVpZ2h0ID0gMjggKyBNYXRoLm1heCgwLCBmb250U2l6ZSAtIDE0KSAqIDEuNDtcbiAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gIGlmICghYmxvY2tzLmxlbmd0aCkgaGVpZ2h0ICs9IGRlcHRoID09PSAwID8gMzQgOiAyNjtcbiAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICBpZiAoYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiKSB7IHdpZHRoID0gTWF0aC5tYXgod2lkdGgsIDI0MCk7IGhlaWdodCArPSAxMzI7IH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IGxlbmd0aCA9IE1hdGgubWF4KDEsIGJsb2NrLnRleHQubGVuZ3RoKTtcbiAgICAgIHdpZHRoID0gTWF0aC5tYXgod2lkdGgsIE1hdGgubWluKDQ2MCwgODAgKyBNYXRoLm1pbihsZW5ndGgsIDQyKSAqIGZvbnRTaXplICogMC42MikpO1xuICAgICAgaGVpZ2h0ICs9IE1hdGgubWF4KDMwLCBNYXRoLmNlaWwobGVuZ3RoIC8gMzQpICogKGZvbnRTaXplICsgOCkpO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS50YWdzPy5sZW5ndGgpIGhlaWdodCArPSAyMDtcbiAgaWYgKG5vZGUuc3VibWFwKSB7IHdpZHRoID0gTWF0aC5tYXgod2lkdGgsIDIyMCk7IGhlaWdodCArPSAzMDsgfVxuICBpZiAobm9kZS50YWJsZSkge1xuICAgIGNvbnN0IGNvbHVtbnMgPSBNYXRoLm1heCgxLCBub2RlLnRhYmxlLmhlYWRlcnMubGVuZ3RoKTtcbiAgICBjb25zdCB2aXNpYmxlUm93cyA9IE1hdGgubWluKDEwLCBub2RlLnRhYmxlLnJvd3MubGVuZ3RoKTtcbiAgICB3aWR0aCA9IE1hdGgubWluKDcyMCwgTWF0aC5tYXgoMzAwLCBjb2x1bW5zICogMTI0KSk7XG4gICAgaGVpZ2h0ICs9IDQyICsgdmlzaWJsZVJvd3MgKiAzMSArIChub2RlLnRhYmxlLnJvd3MubGVuZ3RoID4gdmlzaWJsZVJvd3MgPyAyNCA6IDApO1xuICB9XG4gIGlmIChub2RlLmNvZGUpIHtcbiAgICBjb25zdCBsaW5lcyA9IG5vZGUuY29kZS5jb2RlLnNwbGl0KC9cXHI/XFxuLyk7XG4gICAgY29uc3QgbG9uZ2VzdCA9IE1hdGgubWF4KDIwLCAuLi5saW5lcy5zbGljZSgwLCA4MCkubWFwKChsaW5lKSA9PiBsaW5lLmxlbmd0aCkpO1xuICAgIHdpZHRoID0gTWF0aC5taW4oNzIwLCBNYXRoLm1heCgzODAsIGxvbmdlc3QgKiA3LjIgKyA0MikpO1xuICAgIGhlaWdodCArPSBNYXRoLm1pbigzOTAsIE1hdGgubWF4KDEwMCwgTWF0aC5taW4obGluZXMubGVuZ3RoLCAxOCkgKiAyMCArIDQ4KSk7XG4gIH1cbiAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodDogTWF0aC5taW4oNTYwLCBoZWlnaHQpIH07XG59XG5cbmZ1bmN0aW9uIHN1YnRyZWVIZWlnaHQobm9kZTogTWluZE1hcE5vZGUsIGRlcHRoOiBudW1iZXIsIGRlZmF1bHRGb250U2l6ZSA9IDE0KTogbnVtYmVyIHtcbiAgY29uc3Qgb3duSGVpZ2h0ID0gbm9kZURpbWVuc2lvbnMobm9kZSwgZGVwdGgsIGRlZmF1bHRGb250U2l6ZSkuaGVpZ2h0O1xuICBjb25zdCBjaGlsZHJlbiA9IHZpc2libGVDaGlsZHJlbihub2RlKTtcbiAgaWYgKCFjaGlsZHJlbi5sZW5ndGgpIHJldHVybiBvd25IZWlnaHQ7XG4gIGNvbnN0IGNoaWxkcmVuSGVpZ2h0ID0gY2hpbGRyZW4ucmVkdWNlKChzdW0sIGNoaWxkKSA9PiBzdW0gKyBzdWJ0cmVlSGVpZ2h0KGNoaWxkLCBkZXB0aCArIDEsIGRlZmF1bHRGb250U2l6ZSksIDApICsgVl9HQVAgKiAoY2hpbGRyZW4ubGVuZ3RoIC0gMSk7XG4gIHJldHVybiBNYXRoLm1heChvd25IZWlnaHQsIGNoaWxkcmVuSGVpZ2h0KTtcbn1cblxuZnVuY3Rpb24gbGF5b3V0QnJhbmNoKFxuICBub2RlOiBNaW5kTWFwTm9kZSxcbiAgcGFyZW50SWQ6IHN0cmluZyxcbiAgcGFyZW50WDogbnVtYmVyLFxuICBwYXJlbnRXaWR0aDogbnVtYmVyLFxuICBzaWRlOiAtMSB8IDEsXG4gIGRlcHRoOiBudW1iZXIsXG4gIGNlbnRlclk6IG51bWJlcixcbiAgb3V0cHV0OiBOb2RlUG9zaXRpb25bXSxcbiAgZGVmYXVsdEZvbnRTaXplID0gMTRcbik6IHZvaWQge1xuICBjb25zdCBkaW1lbnNpb25zID0gbm9kZURpbWVuc2lvbnMobm9kZSwgZGVwdGgsIGRlZmF1bHRGb250U2l6ZSk7XG4gIGNvbnN0IHggPSBwYXJlbnRYICsgc2lkZSAqIChwYXJlbnRXaWR0aCAvIDIgKyBIX0dBUCArIGRpbWVuc2lvbnMud2lkdGggLyAyKTtcbiAgb3V0cHV0LnB1c2goeyBub2RlLCBwYXJlbnRJZCwgeCwgeTogY2VudGVyWSwgZGVwdGgsIHNpZGUsIC4uLmRpbWVuc2lvbnMgfSk7XG4gIGNvbnN0IGNoaWxkcmVuID0gdmlzaWJsZUNoaWxkcmVuKG5vZGUpO1xuICBpZiAoIWNoaWxkcmVuLmxlbmd0aCkgcmV0dXJuO1xuXG4gIGNvbnN0IGhlaWdodHMgPSBjaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiBzdWJ0cmVlSGVpZ2h0KGNoaWxkLCBkZXB0aCArIDEsIGRlZmF1bHRGb250U2l6ZSkpO1xuICBjb25zdCB0b3RhbEhlaWdodCA9IGhlaWdodHMucmVkdWNlKChzdW0sIGNoaWxkSGVpZ2h0KSA9PiBzdW0gKyBjaGlsZEhlaWdodCwgMCkgKyBWX0dBUCAqIChjaGlsZHJlbi5sZW5ndGggLSAxKTtcbiAgbGV0IGN1cnNvciA9IGNlbnRlclkgLSB0b3RhbEhlaWdodCAvIDI7XG4gIGNoaWxkcmVuLmZvckVhY2goKGNoaWxkLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IGNoaWxkSGVpZ2h0ID0gaGVpZ2h0c1tpbmRleF0gPz8gbm9kZURpbWVuc2lvbnMoY2hpbGQsIGRlcHRoICsgMSwgZGVmYXVsdEZvbnRTaXplKS5oZWlnaHQ7XG4gICAgY29uc3QgY2hpbGRDZW50ZXIgPSBjdXJzb3IgKyBjaGlsZEhlaWdodCAvIDI7XG4gICAgbGF5b3V0QnJhbmNoKGNoaWxkLCBub2RlLmlkLCB4LCBkaW1lbnNpb25zLndpZHRoLCBzaWRlLCBkZXB0aCArIDEsIGNoaWxkQ2VudGVyLCBvdXRwdXQsIGRlZmF1bHRGb250U2l6ZSk7XG4gICAgY3Vyc29yICs9IGNoaWxkSGVpZ2h0ICsgVl9HQVA7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxheW91dChyb290OiBNaW5kTWFwTm9kZSwgbW9kZTogTGF5b3V0TW9kZSwgZGVmYXVsdEZvbnRTaXplID0gMTQpOiBMYXlvdXRSZXN1bHQge1xuICBjb25zdCByb290RGltZW5zaW9ucyA9IG5vZGVEaW1lbnNpb25zKHJvb3QsIDAsIGRlZmF1bHRGb250U2l6ZSk7XG4gIGNvbnN0IG5vZGVzOiBOb2RlUG9zaXRpb25bXSA9IFtcbiAgICB7IG5vZGU6IHJvb3QsIHBhcmVudElkOiBudWxsLCB4OiAwLCB5OiAwLCBkZXB0aDogMCwgc2lkZTogMCwgLi4ucm9vdERpbWVuc2lvbnMgfVxuICBdO1xuICBjb25zdCBjaGlsZHJlbiA9IHZpc2libGVDaGlsZHJlbihyb290KTtcblxuICBpZiAobW9kZSA9PT0gXCJiYWxhbmNlZFwiICYmIGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICBjb25zdCBsZWZ0OiBNaW5kTWFwTm9kZVtdID0gW107XG4gICAgY29uc3QgcmlnaHQ6IE1pbmRNYXBOb2RlW10gPSBbXTtcbiAgICBsZXQgbGVmdEhlaWdodCA9IDA7XG4gICAgbGV0IHJpZ2h0SGVpZ2h0ID0gMDtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIFsuLi5jaGlsZHJlbl0uc29ydCgoYSwgYikgPT4gc3VidHJlZUhlaWdodChiLCAxLCBkZWZhdWx0Rm9udFNpemUpIC0gc3VidHJlZUhlaWdodChhLCAxLCBkZWZhdWx0Rm9udFNpemUpKSkge1xuICAgICAgY29uc3QgaGVpZ2h0ID0gc3VidHJlZUhlaWdodChjaGlsZCwgMSwgZGVmYXVsdEZvbnRTaXplKSArIFZfR0FQO1xuICAgICAgaWYgKGxlZnRIZWlnaHQgPD0gcmlnaHRIZWlnaHQpIHtcbiAgICAgICAgbGVmdC5wdXNoKGNoaWxkKTtcbiAgICAgICAgbGVmdEhlaWdodCArPSBoZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByaWdodC5wdXNoKGNoaWxkKTtcbiAgICAgICAgcmlnaHRIZWlnaHQgKz0gaGVpZ2h0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBsYWNlU2lkZSA9IChpdGVtczogTWluZE1hcE5vZGVbXSwgc2lkZTogLTEgfCAxKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBoZWlnaHRzID0gaXRlbXMubWFwKChjaGlsZCkgPT4gc3VidHJlZUhlaWdodChjaGlsZCwgMSwgZGVmYXVsdEZvbnRTaXplKSk7XG4gICAgICBjb25zdCB0b3RhbCA9IGhlaWdodHMucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkgKyBWX0dBUCAqIE1hdGgubWF4KDAsIGl0ZW1zLmxlbmd0aCAtIDEpO1xuICAgICAgbGV0IGN1cnNvciA9IC10b3RhbCAvIDI7XG4gICAgICBpdGVtcy5mb3JFYWNoKChjaGlsZCwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gaGVpZ2h0c1tpbmRleF0gPz8gbm9kZURpbWVuc2lvbnMoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkuaGVpZ2h0O1xuICAgICAgICBsYXlvdXRCcmFuY2goY2hpbGQsIHJvb3QuaWQsIDAsIHJvb3REaW1lbnNpb25zLndpZHRoLCBzaWRlLCAxLCBjdXJzb3IgKyBoZWlnaHQgLyAyLCBub2RlcywgZGVmYXVsdEZvbnRTaXplKTtcbiAgICAgICAgY3Vyc29yICs9IGhlaWdodCArIFZfR0FQO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBwbGFjZVNpZGUobGVmdCwgLTEpO1xuICAgIHBsYWNlU2lkZShyaWdodCwgMSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaGVpZ2h0cyA9IGNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IHN1YnRyZWVIZWlnaHQoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkpO1xuICAgIGNvbnN0IHRvdGFsID0gaGVpZ2h0cy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSArIFZfR0FQICogTWF0aC5tYXgoMCwgY2hpbGRyZW4ubGVuZ3RoIC0gMSk7XG4gICAgbGV0IGN1cnNvciA9IC10b3RhbCAvIDI7XG4gICAgY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBoZWlnaHQgPSBoZWlnaHRzW2luZGV4XSA/PyBub2RlRGltZW5zaW9ucyhjaGlsZCwgMSwgZGVmYXVsdEZvbnRTaXplKS5oZWlnaHQ7XG4gICAgICBsYXlvdXRCcmFuY2goY2hpbGQsIHJvb3QuaWQsIDAsIHJvb3REaW1lbnNpb25zLndpZHRoLCAxLCAxLCBjdXJzb3IgKyBoZWlnaHQgLyAyLCBub2RlcywgZGVmYXVsdEZvbnRTaXplKTtcbiAgICAgIGN1cnNvciArPSBoZWlnaHQgKyBWX0dBUDtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGJ5SWQgPSBuZXcgTWFwKG5vZGVzLm1hcCgocG9zaXRpb24pID0+IFtwb3NpdGlvbi5ub2RlLmlkLCBwb3NpdGlvbl0pKTtcbiAgY29uc3QgbWluWCA9IE1hdGgubWluKC4uLm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHBvc2l0aW9uLnggLSBwb3NpdGlvbi53aWR0aCAvIDIpKTtcbiAgY29uc3QgbWF4WCA9IE1hdGgubWF4KC4uLm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHBvc2l0aW9uLnggKyBwb3NpdGlvbi53aWR0aCAvIDIpKTtcbiAgY29uc3QgbWluWSA9IE1hdGgubWluKC4uLm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHBvc2l0aW9uLnkgLSBwb3NpdGlvbi5oZWlnaHQgLyAyKSk7XG4gIGNvbnN0IG1heFkgPSBNYXRoLm1heCguLi5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi55ICsgcG9zaXRpb24uaGVpZ2h0IC8gMikpO1xuICByZXR1cm4geyBub2RlcywgYnlJZCwgbWluWCwgbWF4WCwgbWluWSwgbWF4WSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWRnZVBhdGgocGFyZW50OiBOb2RlUG9zaXRpb24sIGNoaWxkOiBOb2RlUG9zaXRpb24sIHN0eWxlOiBFZGdlU3R5bGUgPSBcImN1cnZlZFwiKTogc3RyaW5nIHtcbiAgY29uc3QgcGFyZW50WCA9IHBhcmVudC54ICsgKGNoaWxkLnNpZGUgPj0gMCA/IHBhcmVudC53aWR0aCAvIDIgOiAtcGFyZW50LndpZHRoIC8gMik7XG4gIGNvbnN0IGNoaWxkWCA9IGNoaWxkLnggLSAoY2hpbGQuc2lkZSA+PSAwID8gY2hpbGQud2lkdGggLyAyIDogLWNoaWxkLndpZHRoIC8gMik7XG4gIGlmIChzdHlsZSA9PT0gXCJzdHJhaWdodFwiKSByZXR1cm4gYE0gJHtwYXJlbnRYfSAke3BhcmVudC55fSBMICR7Y2hpbGRYfSAke2NoaWxkLnl9YDtcbiAgY29uc3QgbWlkZGxlWCA9IHBhcmVudFggKyAoY2hpbGRYIC0gcGFyZW50WCkgKiAwLjU7XG4gIGlmIChzdHlsZSA9PT0gXCJlbGJvd1wiKSByZXR1cm4gYE0gJHtwYXJlbnRYfSAke3BhcmVudC55fSBMICR7bWlkZGxlWH0gJHtwYXJlbnQueX0gTCAke21pZGRsZVh9ICR7Y2hpbGQueX0gTCAke2NoaWxkWH0gJHtjaGlsZC55fWA7XG4gIHJldHVybiBgTSAke3BhcmVudFh9ICR7cGFyZW50Lnl9IEMgJHttaWRkbGVYfSAke3BhcmVudC55fSwgJHttaWRkbGVYfSAke2NoaWxkLnl9LCAke2NoaWxkWH0gJHtjaGlsZC55fWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVYbWwodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bPD4mXCInXS9nLCAoY2hhcmFjdGVyKSA9PiB7XG4gICAgY29uc3QgZW50aXRpZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IFwiPFwiOiBcIiZsdDtcIiwgXCI+XCI6IFwiJmd0O1wiLCBcIiZcIjogXCImYW1wO1wiLCAnXCInOiBcIiZxdW90O1wiLCBcIidcIjogXCImYXBvcztcIiB9O1xuICAgIHJldHVybiBlbnRpdGllc1tjaGFyYWN0ZXJdID8/IGNoYXJhY3RlcjtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkQ29sb3IodmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZmFsbGJhY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZSAmJiAvXiNbMC05YS1mXXs2fSQvaS50ZXN0KHZhbHVlKSA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIHN2Z1JhZGl1cyhzaGFwZTogTm9kZVNoYXBlIHwgdW5kZWZpbmVkKTogbnVtYmVyIHtcbiAgaWYgKHNoYXBlID09PSBcInJlY3RhbmdsZVwiKSByZXR1cm4gMztcbiAgaWYgKHNoYXBlID09PSBcInBpbGxcIikgcmV0dXJuIDI4O1xuICByZXR1cm4gMTQ7XG59XG5cbmZ1bmN0aW9uIHRhc2tHbHlwaChub2RlOiBNaW5kTWFwTm9kZSk6IHN0cmluZyB7XG4gIGlmIChub2RlLnRhc2sgPT09IFwiZG9uZVwiKSByZXR1cm4gXCJcdTI3MTMgXCI7XG4gIGlmIChub2RlLnRhc2sgPT09IFwiZG9pbmdcIikgcmV0dXJuIFwiXHUyNUQwIFwiO1xuICBpZiAobm9kZS50YXNrID09PSBcInRvZG9cIikgcmV0dXJuIFwiXHUyNUNCIFwiO1xuICByZXR1cm4gXCJcIjtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGVSdW5zKHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10sIG1heExlbmd0aDogbnVtYmVyKTogTWluZE1hcFRleHRSdW5bXSB7XG4gIGNvbnN0IHJlc3VsdDogTWluZE1hcFRleHRSdW5bXSA9IFtdO1xuICBsZXQgcmVtYWluaW5nID0gbWF4TGVuZ3RoO1xuICBsZXQgdHJ1bmNhdGVkID0gZmFsc2U7XG4gIGZvciAoY29uc3QgcnVuIG9mIHJ1bnMpIHtcbiAgICBpZiAocmVtYWluaW5nIDw9IDApIHsgdHJ1bmNhdGVkID0gdHJ1ZTsgYnJlYWs7IH1cbiAgICBpZiAocnVuLnRleHQubGVuZ3RoIDw9IHJlbWFpbmluZykge1xuICAgICAgcmVzdWx0LnB1c2goeyB0ZXh0OiBydW4udGV4dCwgc3R5bGU6IHJ1bi5zdHlsZSB9KTtcbiAgICAgIHJlbWFpbmluZyAtPSBydW4udGV4dC5sZW5ndGg7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goeyB0ZXh0OiBydW4udGV4dC5zbGljZSgwLCByZW1haW5pbmcpLCBzdHlsZTogcnVuLnN0eWxlIH0pO1xuICAgIHJlbWFpbmluZyA9IDA7XG4gICAgdHJ1bmNhdGVkID0gdHJ1ZTtcbiAgfVxuICBpZiAodHJ1bmNhdGVkICYmIHJlc3VsdC5sZW5ndGgpIHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0hLnRleHQgPSBgJHtyZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdIS50ZXh0LnNsaWNlKDAsIC0xKX1cdTIwMjZgO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiByaWNoVGV4dFRzcGFucyhydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQ6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIGZvcmVncm91bmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHNvdXJjZTogTWluZE1hcFRleHRSdW5bXSA9IFtcbiAgICAuLi4ocHJlZml4ID8gW3sgdGV4dDogcHJlZml4IH1dIDogW10pLFxuICAgIC4uLihydW5zPy5sZW5ndGggPyBydW5zIDogW3sgdGV4dDogZmFsbGJhY2tUZXh0IH1dKVxuICBdO1xuICByZXR1cm4gdHJ1bmNhdGVSdW5zKHNvdXJjZSwgNDIpLm1hcCgocnVuKSA9PiB7XG4gICAgY29uc3Qgc3R5bGUgPSBydW4uc3R5bGU7XG4gICAgY29uc3QgYXR0cmlidXRlczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAoc3R5bGU/LmNvbG9yKSBhdHRyaWJ1dGVzLnB1c2goYGZpbGw9XCIke3ZhbGlkQ29sb3Ioc3R5bGUuY29sb3IsIGZvcmVncm91bmQpfVwiYCk7XG4gICAgaWYgKHN0eWxlPy5ib2xkICE9PSB1bmRlZmluZWQpIGF0dHJpYnV0ZXMucHVzaChgZm9udC13ZWlnaHQ9XCIke3N0eWxlLmJvbGQgPyA3MDAgOiA0MDB9XCJgKTtcbiAgICBpZiAoc3R5bGU/Lml0YWxpYyAhPT0gdW5kZWZpbmVkKSBhdHRyaWJ1dGVzLnB1c2goYGZvbnQtc3R5bGU9XCIke3N0eWxlLml0YWxpYyA/IFwiaXRhbGljXCIgOiBcIm5vcm1hbFwifVwiYCk7XG4gICAgY29uc3QgZGVjb3JhdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHN0eWxlPy51bmRlcmxpbmUpIGRlY29yYXRpb25zLnB1c2goXCJ1bmRlcmxpbmVcIik7XG4gICAgaWYgKHN0eWxlPy5zdHJpa2UpIGRlY29yYXRpb25zLnB1c2goXCJsaW5lLXRocm91Z2hcIik7XG4gICAgaWYgKGRlY29yYXRpb25zLmxlbmd0aCkgYXR0cmlidXRlcy5wdXNoKGB0ZXh0LWRlY29yYXRpb249XCIke2RlY29yYXRpb25zLmpvaW4oXCIgXCIpfVwiYCk7XG4gICAgcmV0dXJuIGA8dHNwYW4gJHthdHRyaWJ1dGVzLmpvaW4oXCIgXCIpfT4ke2VzY2FwZVhtbChydW4udGV4dCl9PC90c3Bhbj5gO1xuICB9KS5qb2luKFwiXCIpO1xufVxuXG5mdW5jdGlvbiBzdmdGb250RmFtaWx5KG1vZGU6IEZvbnRGYW1pbHlNb2RlIHwgdW5kZWZpbmVkLCBjdXN0b21Gb250OiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAobW9kZSA9PT0gXCJzZXJpZlwiKSByZXR1cm4gJ0dlb3JnaWEsXCJUaW1lcyBOZXcgUm9tYW5cIixzZXJpZic7XG4gIGlmIChtb2RlID09PSBcIm1vbm9cIikgcmV0dXJuICdcIlNGTW9uby1SZWd1bGFyXCIsQ29uc29sYXMsXCJMaWJlcmF0aW9uIE1vbm9cIixtb25vc3BhY2UnO1xuICBpZiAobW9kZSA9PT0gXCJjdXN0b21cIiAmJiBjdXN0b21Gb250Py50cmltKCkpIHJldHVybiBgXCIke2N1c3RvbUZvbnQudHJpbSgpLnJlcGxhY2VBbGwoJ1wiJywgJycpfVwiLHNhbnMtc2VyaWZgO1xuICByZXR1cm4gJ0ludGVyLC1hcHBsZS1zeXN0ZW0sQmxpbmtNYWNTeXN0ZW1Gb250LFwiU2Vnb2UgVUlcIixzYW5zLXNlcmlmJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvY3VtZW50VG9Tdmcocm9vdDogTWluZE1hcE5vZGUsIG1vZGU6IExheW91dE1vZGUsIHRpdGxlOiBzdHJpbmcsIGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlID0ge30pOiBzdHJpbmcge1xuICBjb25zdCBkZWZhdWx0Rm9udFNpemUgPSBhcHBlYXJhbmNlLmZvbnRTaXplID8/IDE0O1xuICBjb25zdCBsYXlvdXQgPSBjb21wdXRlTGF5b3V0KHJvb3QsIG1vZGUsIGRlZmF1bHRGb250U2l6ZSk7XG4gIGNvbnN0IHBhZGRpbmcgPSA3MjtcbiAgY29uc3Qgd2lkdGggPSBNYXRoLm1heCgzMjAsIGxheW91dC5tYXhYIC0gbGF5b3V0Lm1pblggKyBwYWRkaW5nICogMik7XG4gIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KDIyMCwgbGF5b3V0Lm1heFkgLSBsYXlvdXQubWluWSArIHBhZGRpbmcgKiAyKTtcbiAgY29uc3Qgb2Zmc2V0WCA9IHBhZGRpbmcgLSBsYXlvdXQubWluWDtcbiAgY29uc3Qgb2Zmc2V0WSA9IHBhZGRpbmcgLSBsYXlvdXQubWluWTtcbiAgY29uc3QgZWRnZVN0eWxlID0gYXBwZWFyYW5jZS5lZGdlU3R5bGUgPz8gXCJjdXJ2ZWRcIjtcbiAgY29uc3QgZWRnZVdpZHRoID0gYXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gMi4yO1xuICBjb25zdCBkZWZhdWx0RWRnZSA9IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5lZGdlQ29sb3IsIFwiIzdjOGFhNVwiKTtcbiAgY29uc3QgZWRnZXMgPSBsYXlvdXQubm9kZXNcbiAgICAuZmlsdGVyKChwb3NpdGlvbikgPT4gcG9zaXRpb24ucGFyZW50SWQpXG4gICAgLm1hcCgocG9zaXRpb24pID0+IHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHBvc2l0aW9uLnBhcmVudElkID8gbGF5b3V0LmJ5SWQuZ2V0KHBvc2l0aW9uLnBhcmVudElkKSA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IHZhbGlkQ29sb3IocG9zaXRpb24ubm9kZS5zdHlsZT8uY29sb3IsIGRlZmF1bHRFZGdlKTtcbiAgICAgIHJldHVybiBwYXJlbnQgPyBgPHBhdGggZD1cIiR7ZWRnZVBhdGgocGFyZW50LCBwb3NpdGlvbiwgZWRnZVN0eWxlKX1cIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiR7c3Ryb2tlfVwiIHN0cm9rZS13aWR0aD1cIiR7ZWRnZVdpZHRofVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIG9wYWNpdHk9XCIwLjhcIi8+YCA6IFwiXCI7XG4gICAgfSlcbiAgICAuam9pbihcIlxcblwiKTtcblxuICBjb25zdCBub2RlcyA9IGxheW91dC5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiB7XG4gICAgY29uc3Qgbm9kZSA9IHBvc2l0aW9uLm5vZGU7XG4gICAgY29uc3QgeCA9IHBvc2l0aW9uLnggLSBwb3NpdGlvbi53aWR0aCAvIDI7XG4gICAgY29uc3QgeSA9IHBvc2l0aW9uLnkgLSBwb3NpdGlvbi5oZWlnaHQgLyAyO1xuICAgIGNvbnN0IGlzUm9vdCA9IHBvc2l0aW9uLmRlcHRoID09PSAwO1xuICAgIGNvbnN0IGRlZmF1bHRCYWNrZ3JvdW5kID0gaXNSb290ID8gXCIjNGY0NmU1XCIgOiB2YWxpZENvbG9yKGFwcGVhcmFuY2Uubm9kZUNvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgY29uc3QgZGVmYXVsdFRleHQgPSBpc1Jvb3QgPyBcIiNmZmZmZmZcIiA6IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS50ZXh0Q29sb3IsIFwiIzBmMTcyYVwiKTtcbiAgICBjb25zdCBiYWNrZ3JvdW5kID0gdmFsaWRDb2xvcihub2RlLnN0eWxlPy5jb2xvciwgZGVmYXVsdEJhY2tncm91bmQpO1xuICAgIGNvbnN0IGZvcmVncm91bmQgPSB2YWxpZENvbG9yKG5vZGUuc3R5bGU/LnRleHRDb2xvciwgZGVmYXVsdFRleHQpO1xuICAgIGNvbnN0IGJvcmRlciA9IHZhbGlkQ29sb3Iobm9kZS5zdHlsZT8uYm9yZGVyQ29sb3IsIGlzUm9vdCA/IGJhY2tncm91bmQgOiB2YWxpZENvbG9yKGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yLCBcIiM5NGEzYjhcIikpO1xuICAgIGNvbnN0IGJvcmRlcldpZHRoID0gbm9kZS5zdHlsZT8uYm9yZGVyV2lkdGggPz8gYXBwZWFyYW5jZS5ub2RlQm9yZGVyV2lkdGggPz8gKGlzUm9vdCA/IDIgOiAxKTtcbiAgICBjb25zdCBwcmVmaXggPSBgJHtub2RlLmljb24gPyBgJHtub2RlLmljb259IGAgOiBcIlwifSR7dGFza0dseXBoKG5vZGUpfWA7XG4gICAgY29uc3QgY29udGVudEJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpO1xuICAgIGxldCBjb250ZW50WSA9IHkgKyAyODtcbiAgICBjb25zdCBjb250ZW50UGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IHByZWZpeFVzZWQgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGNvbnRlbnRCbG9ja3MpIHtcbiAgICAgIGlmIChibG9jay50eXBlID09PSBcImltYWdlXCIpIHtcbiAgICAgICAgY29udGVudFBhcnRzLnB1c2goYDxyZWN0IHg9XCIke3Bvc2l0aW9uLnggLSA3MH1cIiB5PVwiJHtjb250ZW50WSAtIDE0fVwiIHdpZHRoPVwiMTQwXCIgaGVpZ2h0PVwiOTRcIiByeD1cIjhcIiBmaWxsPVwicmdiYSgxMjcsMTI3LDEyNywuMTIpXCIvPjx0ZXh0IHg9XCIke3Bvc2l0aW9uLnh9XCIgeT1cIiR7Y29udGVudFkgKyAzOH1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiMTJcIj5cdUQ4M0RcdUREQkMgJHtlc2NhcGVYbWwoKGJsb2NrLmFsdCA/PyBcIlx1NTZGRVx1NzI0N1wiKS5zbGljZSgwLCAyMCkpfTwvdGV4dD5gKTtcbiAgICAgICAgY29udGVudFkgKz0gMTEyO1xuICAgICAgfSBlbHNlIGlmIChibG9jay50ZXh0LnRyaW0oKSkge1xuICAgICAgICBjb25zdCBibG9ja1ByZWZpeCA9IHByZWZpeFVzZWQgPyBcIlwiIDogcHJlZml4O1xuICAgICAgICBwcmVmaXhVc2VkID0gdHJ1ZTtcbiAgICAgICAgY29udGVudFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3Bvc2l0aW9uLnh9XCIgeT1cIiR7Y29udGVudFl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIiR7bm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplfVwiPiR7cmljaFRleHRUc3BhbnMoYmxvY2sucmljaFRleHQsIGJsb2NrLnRleHQsIGJsb2NrUHJlZml4LCBmb3JlZ3JvdW5kKX08L3RleHQ+YCk7XG4gICAgICAgIGNvbnRlbnRZICs9IChub2RlLnN0eWxlPy5mb250U2l6ZSA/PyBkZWZhdWx0Rm9udFNpemUpICsgMTU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghY29udGVudEJsb2Nrcy5sZW5ndGgpIGNvbnRlbnRQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke2NvbnRlbnRZfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCIke25vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZX1cIj4ke2VzY2FwZVhtbChwcmVmaXggfHwgbm9kZVBsYWluVGV4dChub2RlKSB8fCBcIlx1NTZGRVx1NzI0N1x1ODI4Mlx1NzBCOVwiKX08L3RleHQ+YCk7XG4gICAgbGV0IHJpY2hZID0gY29udGVudFkgKyAxMDtcbiAgICBjb25zdCByaWNoUGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKG5vZGUuc3VibWFwKSB7XG4gICAgICByaWNoUGFydHMucHVzaChgPHJlY3QgeD1cIiR7eCArIDEyfVwiIHk9XCIke3JpY2hZfVwiIHdpZHRoPVwiJHtwb3NpdGlvbi53aWR0aCAtIDI0fVwiIGhlaWdodD1cIjI1XCIgcng9XCI2XCIgZmlsbD1cInJnYmEoOTksMTAyLDI0MSwuMTApXCIgc3Ryb2tlPVwiJHtmb3JlZ3JvdW5kfVwiIHN0cm9rZS1vcGFjaXR5PVwiLjI4XCIgc3Ryb2tlLWRhc2hhcnJheT1cIjQgM1wiLz48dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke3JpY2hZICsgMTd9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIjEwXCI+XHUyMUIzICR7ZXNjYXBlWG1sKChub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRoKS5zbGljZSgwLCA1NCkpfTwvdGV4dD5gKTtcbiAgICAgIHJpY2hZICs9IDM0O1xuICAgIH1cbiAgICBpZiAobm9kZS50YWJsZSkge1xuICAgICAgY29uc3Qgcm93cyA9IFtub2RlLnRhYmxlLmhlYWRlcnMsIC4uLm5vZGUudGFibGUucm93cy5zbGljZSgwLCA4KV07XG4gICAgICByb3dzLmZvckVhY2goKHJvdywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qgcm93VGV4dCA9IGVzY2FwZVhtbChyb3cubWFwKChjZWxsKSA9PiBjZWxsLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCIgXCIpKS5qb2luKFwiICB8ICBcIikuc2xpY2UoMCwgMTAwKSk7XG4gICAgICAgIHJpY2hQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHt4ICsgMTZ9XCIgeT1cIiR7cmljaFkgKyBpbmRleCAqIDIzfVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiJHtpbmRleCA9PT0gMCA/IDEwLjUgOiA5LjV9XCIgZm9udC13ZWlnaHQ9XCIke2luZGV4ID09PSAwID8gNzAwIDogNDAwfVwiPiR7cm93VGV4dH08L3RleHQ+YCk7XG4gICAgICB9KTtcbiAgICAgIGlmIChub2RlLnRhYmxlLnJvd3MubGVuZ3RoID4gOCkgcmljaFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3ggKyAxNn1cIiB5PVwiJHtyaWNoWSArIHJvd3MubGVuZ3RoICogMjN9XCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBvcGFjaXR5PVwiLjY1XCIgZm9udC1zaXplPVwiOVwiPlx1MjAyNiBcdThGRDhcdTY3MDkgJHtub2RlLnRhYmxlLnJvd3MubGVuZ3RoIC0gOH0gXHU4ODRDPC90ZXh0PmApO1xuICAgIH1cbiAgICBpZiAobm9kZS5jb2RlKSB7XG4gICAgICByaWNoUGFydHMucHVzaChgPHJlY3QgeD1cIiR7eCArIDEyfVwiIHk9XCIke3JpY2hZIC0gMTR9XCIgd2lkdGg9XCIke3Bvc2l0aW9uLndpZHRoIC0gMjR9XCIgaGVpZ2h0PVwiJHtNYXRoLm1pbigzNTAsIE1hdGgubWF4KDgwLCBub2RlLmNvZGUuY29kZS5zcGxpdCgvXFxyP1xcbi8pLmxlbmd0aCAqIDE3ICsgMzQpKX1cIiByeD1cIjdcIiBmaWxsPVwicmdiYSgxNSwyMyw0MiwuMTApXCIvPmApO1xuICAgICAgcmljaFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3ggKyAyMH1cIiB5PVwiJHtyaWNoWSArIDN9XCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBvcGFjaXR5PVwiLjdcIiBmb250LXNpemU9XCI5XCI+JHtlc2NhcGVYbWwobm9kZS5jb2RlLmxhbmd1YWdlIHx8IFwiY29kZVwiKX08L3RleHQ+YCk7XG4gICAgICBub2RlLmNvZGUuY29kZS5zcGxpdCgvXFxyP1xcbi8pLnNsaWNlKDAsIDE2KS5mb3JFYWNoKChsaW5lLCBpbmRleCkgPT4gcmljaFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3ggKyAyMH1cIiB5PVwiJHtyaWNoWSArIDIzICsgaW5kZXggKiAxN31cIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIjlcIiBmb250LWZhbWlseT1cIm1vbm9zcGFjZVwiPiR7ZXNjYXBlWG1sKGxpbmUuc2xpY2UoMCwgOTIpKX08L3RleHQ+YCkpO1xuICAgIH1cbiAgICBjb25zdCByaWNoQ29udGVudCA9IHJpY2hQYXJ0cy5qb2luKFwiXCIpO1xuICAgIGNvbnN0IHRhZ3MgPSBub2RlLnRhZ3M/Lmxlbmd0aFxuICAgICAgPyBgPHRleHQgeD1cIiR7cG9zaXRpb24ueH1cIiB5PVwiJHtwb3NpdGlvbi55ICsgcG9zaXRpb24uaGVpZ2h0IC8gMiAtIDl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIG9wYWNpdHk9XCIuNzJcIiBmb250LXNpemU9XCIxMFwiPiR7ZXNjYXBlWG1sKG5vZGUudGFncy5tYXAoKHRhZykgPT4gYCMke3RhZ31gKS5qb2luKFwiICBcIikuc2xpY2UoMCwgNDgpKX08L3RleHQ+YFxuICAgICAgOiBcIlwiO1xuICAgIGNvbnN0IGJvbGQgPSBub2RlLnN0eWxlPy5ib2xkID8/IGFwcGVhcmFuY2UuYm9sZCA/PyBmYWxzZTtcbiAgICBjb25zdCBpdGFsaWMgPSBub2RlLnN0eWxlPy5pdGFsaWMgPz8gYXBwZWFyYW5jZS5pdGFsaWMgPz8gZmFsc2U7XG4gICAgY29uc3QgdW5kZXJsaW5lID0gbm9kZS5zdHlsZT8udW5kZXJsaW5lID8/IGFwcGVhcmFuY2UudW5kZXJsaW5lID8/IGZhbHNlO1xuICAgIGNvbnN0IGZvbnRTaXplID0gbm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplO1xuICAgIHJldHVybiBgPGc+PHJlY3QgeD1cIiR7eH1cIiB5PVwiJHt5fVwiIHdpZHRoPVwiJHtwb3NpdGlvbi53aWR0aH1cIiBoZWlnaHQ9XCIke3Bvc2l0aW9uLmhlaWdodH1cIiByeD1cIiR7c3ZnUmFkaXVzKG5vZGUuc3R5bGU/LnNoYXBlKX1cIiBmaWxsPVwiJHtiYWNrZ3JvdW5kfVwiIHN0cm9rZT1cIiR7Ym9yZGVyfVwiIHN0cm9rZS13aWR0aD1cIiR7Ym9yZGVyV2lkdGh9XCIvPjxnIGZvbnQtd2VpZ2h0PVwiJHtpc1Jvb3QgfHwgYm9sZCA/IDcwMCA6IDQwMH1cIiBmb250LXN0eWxlPVwiJHtpdGFsaWMgPyBcIml0YWxpY1wiIDogXCJub3JtYWxcIn1cIiB0ZXh0LWRlY29yYXRpb249XCIke3VuZGVybGluZSA/IFwidW5kZXJsaW5lXCIgOiBcIm5vbmVcIn1cIj4ke2NvbnRlbnRQYXJ0cy5qb2luKFwiXCIpfTwvZz4ke3JpY2hDb250ZW50fSR7dGFnc308L2c+YDtcbiAgfSkuam9pbihcIlxcblwiKTtcblxuICBjb25zdCBiYWNrZ3JvdW5kID0gdmFsaWRDb2xvcihhcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvciwgXCIjZjhmYWZjXCIpO1xuICBjb25zdCBwYXR0ZXJuQ29sb3IgPSB2YWxpZENvbG9yKGFwcGVhcmFuY2UucGF0dGVybkNvbG9yLCBcIiM5NGEzYjhcIik7XG4gIGNvbnN0IHBhdHRlcm4gPSBhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID8/IFwibm9uZVwiO1xuICBjb25zdCBkZWZzID0gcGF0dGVybiA9PT0gXCJncmlkXCJcbiAgICA/IGA8ZGVmcz48cGF0dGVybiBpZD1cIm1tYy1wYXR0ZXJuXCIgd2lkdGg9XCIyNFwiIGhlaWdodD1cIjI0XCIgcGF0dGVyblVuaXRzPVwidXNlclNwYWNlT25Vc2VcIj48cGF0aCBkPVwiTSAyNCAwIEwgMCAwIDAgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiR7cGF0dGVybkNvbG9yfVwiIHN0cm9rZS13aWR0aD1cIjFcIiBvcGFjaXR5PVwiLjE4XCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIGZpbGw9XCJ1cmwoI21tYy1wYXR0ZXJuKVwiLz5gXG4gICAgOiBwYXR0ZXJuID09PSBcImRvdHNcIlxuICAgICAgPyBgPGRlZnM+PHBhdHRlcm4gaWQ9XCJtbWMtcGF0dGVyblwiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHBhdHRlcm5Vbml0cz1cInVzZXJTcGFjZU9uVXNlXCI+PGNpcmNsZSBjeD1cIjJcIiBjeT1cIjJcIiByPVwiMS41XCIgZmlsbD1cIiR7cGF0dGVybkNvbG9yfVwiIG9wYWNpdHk9XCIuMjhcIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCIgZmlsbD1cInVybCgjbW1jLXBhdHRlcm4pXCIvPmBcbiAgICAgIDogXCJcIjtcblxuICByZXR1cm4gYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PlxuPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCIke01hdGguY2VpbCh3aWR0aCl9XCIgaGVpZ2h0PVwiJHtNYXRoLmNlaWwoaGVpZ2h0KX1cIiB2aWV3Qm94PVwiMCAwICR7TWF0aC5jZWlsKHdpZHRoKX0gJHtNYXRoLmNlaWwoaGVpZ2h0KX1cIj5cbjx0aXRsZT4ke2VzY2FwZVhtbCh0aXRsZSl9PC90aXRsZT5cbjxzdHlsZT5zdmd7YmFja2dyb3VuZDoke2JhY2tncm91bmR9O2ZvbnQtZmFtaWx5OiR7c3ZnRm9udEZhbWlseShhcHBlYXJhbmNlLmZvbnRGYW1pbHksIGFwcGVhcmFuY2UuY3VzdG9tRm9udCl9fTwvc3R5bGU+XG4ke2RlZnN9PGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKCR7b2Zmc2V0WH0gJHtvZmZzZXRZfSlcIj4ke2VkZ2VzfSR7bm9kZXN9PC9nPlxuPC9zdmc+YDtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IEFwcCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGRvY3VtZW50VG9TdmcgfSBmcm9tIFwiLi9sYXlvdXRcIjtcbmltcG9ydCB7IG1lcmdlQXBwZWFyYW5jZSwgcGFyc2VEb2N1bWVudCwgdHlwZSBNaW5kTWFwQXBwZWFyYW5jZSwgdHlwZSBNaW5kTWFwRG9jdW1lbnQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3RhdGljTWluZE1hcChcbiAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCxcbiAgb3B0aW9ucz86IHsgYXBwPzogQXBwOyBmaWxlPzogVEZpbGU7IG1heEhlaWdodD86IG51bWJlcjsgZGVmYXVsdEFwcGVhcmFuY2U/OiBNaW5kTWFwQXBwZWFyYW5jZSB9XG4pOiB2b2lkIHtcbiAgY29udGFpbmVyLmVtcHR5KCk7XG4gIGNvbnRhaW5lci5hZGRDbGFzcyhcIm1tYy1zdGF0aWMtcHJldmlld1wiKTtcbiAgY29uc3Qgc3ZnID0gZG9jdW1lbnRUb1N2Zyhkb2N1bWVudC5yb290LCBkb2N1bWVudC5sYXlvdXQsIGRvY3VtZW50LnRpdGxlLCBtZXJnZUFwcGVhcmFuY2Uob3B0aW9ucz8uZGVmYXVsdEFwcGVhcmFuY2UsIGRvY3VtZW50LmFwcGVhcmFuY2UpKTtcbiAgY29uc3QgaW1hZ2UgPSBjb250YWluZXIuY3JlYXRlRWwoXCJpbWdcIiwge1xuICAgIGF0dHI6IHtcbiAgICAgIGFsdDogYCR7ZG9jdW1lbnQudGl0bGV9IFx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVx1OTg4NFx1ODlDOGAsXG4gICAgICBzcmM6IGBkYXRhOmltYWdlL3N2Zyt4bWw7Y2hhcnNldD11dGYtOCwke2VuY29kZVVSSUNvbXBvbmVudChzdmcpfWBcbiAgICB9XG4gIH0pO1xuICBpZiAob3B0aW9ucz8ubWF4SGVpZ2h0KSBpbWFnZS5zdHlsZS5tYXhIZWlnaHQgPSBgJHtvcHRpb25zLm1heEhlaWdodH1weGA7XG4gIGlmIChvcHRpb25zPy5hcHAgJiYgb3B0aW9ucy5maWxlKSB7XG4gICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgb3B0aW9ucy5hcHA/LndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKS5vcGVuRmlsZShvcHRpb25zLmZpbGUgYXMgVEZpbGUpO1xuICAgIH0pO1xuICAgIGltYWdlLnNldEF0dHIoXCJ0aXRsZVwiLCBcIlx1NTNDQ1x1NTFGQlx1NjI1M1x1NUYwMFx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3RhdGljU291cmNlKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHNvdXJjZTogc3RyaW5nLCBmYWxsYmFja1RpdGxlOiBzdHJpbmcsIGRlZmF1bHRBcHBlYXJhbmNlPzogTWluZE1hcEFwcGVhcmFuY2UpOiB2b2lkIHtcbiAgcmVuZGVyU3RhdGljTWluZE1hcChjb250YWluZXIsIHBhcnNlRG9jdW1lbnQoc291cmNlLCBmYWxsYmFja1RpdGxlKSwgeyBkZWZhdWx0QXBwZWFyYW5jZSB9KTtcbn1cbiIsICJpbXBvcnQgeyBNYXJrZG93blJlbmRlcmVyLCBOb3RpY2UsIFRleHRGaWxlVmlldywgVEZpbGUsIG5vcm1hbGl6ZVBhdGgsIHR5cGUgV29ya3NwYWNlTGVhZiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgTWluZE1hcFN0dWRpb1BsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBNaW5kTWFwRWRpdG9yIH0gZnJvbSBcIi4vZWRpdG9yXCI7XG5pbXBvcnQgeyBwYXJzZURvY3VtZW50LCBzZXJpYWxpemVEb2N1bWVudCwgdHlwZSBNaW5kTWFwRG9jdW1lbnQgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgc2V0dGluZ3NUb0FwcGVhcmFuY2UgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX01JTkRNQVBfU1RVRElPID0gXCJtaW5kbWFwLXN0dWRpby12aWV3XCI7XG5cbmV4cG9ydCBjbGFzcyBNaW5kTWFwU3R1ZGlvVmlldyBleHRlbmRzIFRleHRGaWxlVmlldyB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBNaW5kTWFwU3R1ZGlvUGx1Z2luO1xuICBwcml2YXRlIGVkaXRvcjogTWluZE1hcEVkaXRvciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzYXZlZFRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTztcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZmlsZT8uYmFzZW5hbWUgPz8gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpbi1jaXJjdWl0XCI7XG4gIH1cblxuICBnZXRWaWV3RGF0YSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5lZGl0b3I/LmdldERvY3VtZW50KCkgPz8gdGhpcy5kb2N1bWVudDtcbiAgICByZXR1cm4gc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQgPz8gdGhpcy5wbHVnaW4uY3JlYXRlQ29uZmlndXJlZERvY3VtZW50KFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpKTtcbiAgfVxuXG4gIHNldFZpZXdEYXRhKGRhdGE6IHN0cmluZywgY2xlYXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCB0aXRsZSA9IHRoaXMuZmlsZT8uYmFzZW5hbWUgPz8gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICB0aGlzLmRvY3VtZW50ID0gcGFyc2VEb2N1bWVudChkYXRhLCB0aXRsZSk7XG4gICAgdGhpcy5hcHBseVZpZXdDbGFzc2VzKCk7XG5cbiAgICBpZiAoIXRoaXMuZWRpdG9yIHx8IGNsZWFyKSB7XG4gICAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICAgIHRoaXMuZWRpdG9yID0gbmV3IE1pbmRNYXBFZGl0b3IodGhpcy5hcHAsIHRoaXMuY29udGVudEVsLCB0aGlzLmRvY3VtZW50LCB7XG4gICAgICAgIG9uQ2hhbmdlOiAoZG9jdW1lbnQpID0+IHtcbiAgICAgICAgICB0aGlzLmRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0U2F2ZSgpO1xuICAgICAgICAgIHRoaXMuc2NoZWR1bGVTYXZlZEluZGljYXRvcigpO1xuICAgICAgICB9LFxuICAgICAgICBvbk9wZW5MaW5rOiBhc3luYyAobGluaykgPT4gdGhpcy5vcGVuTGluayhsaW5rKSxcbiAgICAgICAgb25FeHBvcnRTdmc6IGFzeW5jIChzdmcpID0+IHRoaXMuZXhwb3J0VGV4dEZpbGUoXCJzdmdcIiwgc3ZnKSxcbiAgICAgICAgb25FeHBvcnRNYXJrZG93bjogYXN5bmMgKG1hcmtkb3duKSA9PiB0aGlzLmV4cG9ydFRleHRGaWxlKFwibWRcIiwgbWFya2Rvd24pLFxuICAgICAgICBvbkV4cG9ydEpzb246IGFzeW5jIChqc29uKSA9PiB0aGlzLmV4cG9ydFRleHRGaWxlKFwianNvblwiLCBqc29uKSxcbiAgICAgICAgcmVzb2x2ZUltYWdlOiAoc291cmNlKSA9PiB0aGlzLnJlc29sdmVJbWFnZShzb3VyY2UpLFxuICAgICAgICBvblNhdmVQYXN0ZWRJbWFnZTogYXN5bmMgKGJsb2IsIHN1Z2dlc3RlZE5hbWUpID0+IHRoaXMucGx1Z2luLnNhdmVQYXN0ZWRJbWFnZShibG9iLCBzdWdnZXN0ZWROYW1lLCB0aGlzLmZpbGUpLFxuICAgICAgICBnZXRJbWFnZUhvc3RzOiAoKSA9PiB0aGlzLnBsdWdpbi5nZXRJbWFnZUhvc3RDaG9pY2VzKCksXG4gICAgICAgIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzOiAoKSA9PiB0aGlzLnBsdWdpbi5nZXREZWZhdWx0VXBsb2FkSG9zdElkcygpLFxuICAgICAgICBvblVwbG9hZEltYWdlOiBhc3luYyAoYmxvYiwgc3VnZ2VzdGVkTmFtZSwgaG9zdElkcykgPT4gdGhpcy5wbHVnaW4udXBsb2FkSW1hZ2VUb0hvc3RzKGJsb2IsIHN1Z2dlc3RlZE5hbWUsIGhvc3RJZHMpLFxuICAgICAgICBvblJlYWRJbWFnZVNvdXJjZTogYXN5bmMgKHNvdXJjZSkgPT4gdGhpcy5wbHVnaW4ucmVhZEltYWdlU291cmNlKHNvdXJjZSwgdGhpcy5maWxlKSxcbiAgICAgICAgb25TY2hlZHVsZUF1dG9VcGxvYWQ6IChub2RlSWQsIGJsb2NrSWQsIGxvY2FsUGF0aCwgc3VnZ2VzdGVkTmFtZSkgPT4gdGhpcy5wbHVnaW4uc2NoZWR1bGVBdXRvVXBsb2FkKHRoaXMuZmlsZSwgbm9kZUlkLCBibG9ja0lkLCBsb2NhbFBhdGgsIHN1Z2dlc3RlZE5hbWUpLFxuICAgICAgICBvbkNyZWF0ZVN1Ym1hcDogYXN5bmMgKG5vZGUpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuZmlsZSkgdGhyb3cgbmV3IEVycm9yKFwiXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU1QzFBXHU2NzJBXHU1MTczXHU4MDU0XHU2NTg3XHU0RUY2XCIpO1xuICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5jcmVhdGVTdWJtYXBGaWxlKHRoaXMuZmlsZSwgbm9kZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uT3Blbk1pbmRNYXA6IGFzeW5jIChwYXRoLCBmb2N1c05vZGVJZCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLm9wZW5NaW5kTWFwUGF0aChwYXRoLCB0aGlzLmZpbGU/LnBhdGggPz8gXCJcIiwgdGhpcy5sZWFmLCBmb2N1c05vZGVJZCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uUmVuZGVyQ29kZTogYXN5bmMgKGJsb2NrLCBjb250YWluZXIpID0+IHtcbiAgICAgICAgICBjb25zdCBsb25nZXN0RmVuY2UgPSBNYXRoLm1heCgyLCAuLi5BcnJheS5mcm9tKGJsb2NrLmNvZGUubWF0Y2hBbGwoL2ArL2cpLCAobWF0Y2gpID0+IG1hdGNoWzBdLmxlbmd0aCkpO1xuICAgICAgICAgIGNvbnN0IGZlbmNlID0gXCJgXCIucmVwZWF0KGxvbmdlc3RGZW5jZSArIDEpO1xuICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gYCR7ZmVuY2V9JHtibG9jay5sYW5ndWFnZSA/PyBcIlwifVxcbiR7YmxvY2suY29kZX1cXG4ke2ZlbmNlfWA7XG4gICAgICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIG1hcmtkb3duLCBjb250YWluZXIsIHRoaXMuZmlsZT8ucGF0aCA/PyBcIlwiLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSwgdGhpcy5nZXRFZGl0b3JPcHRpb25zKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVkaXRvci5zZXREb2N1bWVudCh0aGlzLmRvY3VtZW50LCBmYWxzZSk7XG4gICAgICB0aGlzLmVkaXRvci5zZXRPcHRpb25zKHRoaXMuZ2V0RWRpdG9yT3B0aW9ucygpKTtcbiAgICB9XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yID0gbnVsbDtcbiAgICB0aGlzLmRvY3VtZW50ID0gbnVsbDtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZShjbGVhcj86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5zYXZlKGNsZWFyKTtcbiAgICB0aGlzLmVkaXRvcj8ubWFya1NhdmVkKCk7XG4gIH1cblxuICBhc3luYyBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnNhdmVkVGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5zYXZlZFRpbWVyKTtcbiAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yID0gbnVsbDtcbiAgICBhd2FpdCBzdXBlci5vbkNsb3NlKCk7XG4gIH1cblxuICByZWZyZXNoQXBwZWFyYW5jZSgpOiB2b2lkIHtcbiAgICB0aGlzLmFwcGx5Vmlld0NsYXNzZXMoKTtcbiAgICB0aGlzLmVkaXRvcj8uc2V0T3B0aW9ucyh0aGlzLmdldEVkaXRvck9wdGlvbnMoKSk7XG4gIH1cblxuICBmb2N1c05vZGUobm9kZUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmVkaXRvcj8uZm9jdXNOb2RlQnlJZChub2RlSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRFZGl0b3JPcHRpb25zKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0Tm9kZVNoYXBlOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Tm9kZVNoYXBlLFxuICAgICAgZGVmYXVsdEFwcGVhcmFuY2U6IHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMucGx1Z2luLnNldHRpbmdzKSxcbiAgICAgIHNob3dUYXNrUHJvZ3Jlc3M6IHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrUHJvZ3Jlc3MsXG4gICAgICBhdXRvRml0T25PcGVuOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRml0T25PcGVuLFxuICAgICAgaGlzdG9yeUxpbWl0OiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXQsXG4gICAgICBpbWFnZUZhaWxvdmVyRW5hYmxlZDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlckVuYWJsZWQsXG4gICAgICBpbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHM6IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kcyxcbiAgICAgIGltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFja1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFwcGx5Vmlld0NsYXNzZXMoKTogdm9pZCB7XG4gICAgY29uc3QgdGhlbWUgPSB0aGlzLmRvY3VtZW50Py50aGVtZSA/PyBcImF1dG9cIjtcbiAgICB0aGlzLmNvbnRlbnRFbC50b2dnbGVDbGFzcyhcIm1tYy1mb3JjZS1saWdodFwiLCB0aGVtZSA9PT0gXCJsaWdodFwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC50b2dnbGVDbGFzcyhcIm1tYy1mb3JjZS1kYXJrXCIsIHRoZW1lID09PSBcImRhcmtcIik7XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlU2F2ZWRJbmRpY2F0b3IoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2F2ZWRUaW1lciAhPT0gbnVsbCkgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnNhdmVkVGltZXIpO1xuICAgIHRoaXMuc2F2ZWRUaW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZWRpdG9yPy5tYXJrU2F2ZWQoKSwgMjMwMCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5MaW5rKHJhd0xpbms6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxpbmsgPSByYXdMaW5rLnRyaW0oKTtcbiAgICBpZiAoL15odHRwcz86XFwvXFwvL2kudGVzdChsaW5rKSkge1xuICAgICAgd2luZG93Lm9wZW4obGluaywgXCJfYmxhbmtcIiwgXCJub29wZW5lcixub3JlZmVycmVyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB3aWtpTWF0Y2ggPSBsaW5rLm1hdGNoKC9eXFxbXFxbKFtcXHNcXFNdKz8pXFxdXFxdJC8pO1xuICAgIGNvbnN0IHRhcmdldCA9ICh3aWtpTWF0Y2g/LlsxXSA/PyBsaW5rKS5zcGxpdChcInxcIilbMF0/LnRyaW0oKSA/PyBsaW5rO1xuICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQodGFyZ2V0LCB0aGlzLmZpbGU/LnBhdGggPz8gXCJcIiwgZmFsc2UpO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNvbHZlSW1hZ2UocmF3U291cmNlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBzb3VyY2UgPSByYXdTb3VyY2UudHJpbSgpO1xuICAgIGlmICghc291cmNlKSByZXR1cm4gbnVsbDtcbiAgICBpZiAoL14oaHR0cHM/OnxkYXRhOnxibG9iOikvaS50ZXN0KHNvdXJjZSkpIHJldHVybiBzb3VyY2U7XG4gICAgY29uc3Qgd2lraU1hdGNoID0gc291cmNlLm1hdGNoKC9eIT9cXFtcXFsoW1xcc1xcU10rPylcXF1cXF0kLyk7XG4gICAgY29uc3QgdGFyZ2V0ID0gKHdpa2lNYXRjaD8uWzFdID8/IHNvdXJjZSkuc3BsaXQoXCJ8XCIpWzBdPy5zcGxpdChcIiNcIilbMF0/LnRyaW0oKSA/PyBzb3VyY2U7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QodGFyZ2V0LCB0aGlzLmZpbGU/LnBhdGggPz8gXCJcIik7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZXhwb3J0VGV4dEZpbGUoZXh0ZW5zaW9uOiBcInN2Z1wiIHwgXCJtZFwiIHwgXCJqc29uXCIsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGU7XG4gICAgY29uc3QgcGFyZW50UGF0aCA9IGZpbGU/LnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgIGNvbnN0IGJhc2VOYW1lID0gZmlsZT8uYmFzZW5hbWUgPz8gdGhpcy5kb2N1bWVudD8udGl0bGUgPz8gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0QXZhaWxhYmxlUGF0aChub3JtYWxpemVQYXRoKGAke3BhcmVudFBhdGggPyBgJHtwYXJlbnRQYXRofS9gIDogXCJcIn0ke2Jhc2VOYW1lfS4ke2V4dGVuc2lvbn1gKSk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgIG5ldyBOb3RpY2UoYFx1NURGMlx1NUJGQ1x1NTFGQVx1RkYxQSR7cGF0aH1gKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTWVudSwgTW9kYWwsIE5vdGljZSwgc2V0SWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgY2xvbmVEb2N1bWVudCxcbiAgY2xvbmVOb2RlV2l0aEZyZXNoSWRzLFxuICBjaGlsZHJlblRvVGFibGUsXG4gIGNvbnRhaW5zTm9kZSxcbiAgY3JlYXRlTm9kZSxcbiAgZG9jdW1lbnRUb01hcmtkb3duLFxuICBleHRyYWN0Rmlyc3RXaWtpTGluayxcbiAgZmluZEFuY2VzdG9ycyxcbiAgZmluZE5vZGUsXG4gIGZpbmRQYXJlbnQsXG4gIGZsYXR0ZW5Ob2RlcyxcbiAgZ2V0VGFza1Byb2dyZXNzLFxuICBpbWFnZVNvdXJjZUNhbmRpZGF0ZXMsXG4gIG1lcmdlQXBwZWFyYW5jZSxcbiAgbm9kZVNlYXJjaFRleHQsXG4gIG5vcm1hbGl6ZURvY3VtZW50LFxuICBuZXdJZCxcbiAgbm9kZUNvbnRlbnRCbG9ja3MsXG4gIG5vZGVQbGFpblRleHQsXG4gIHN5bmNOb2RlTGVnYWN5RmllbGRzLFxuICBwYXJzZUZlbmNlZENvZGUsXG4gIHBhcnNlTWFya2Rvd25UYWJsZSxcbiAgbm9ybWFsaXplUmljaFRleHQsXG4gIHJpY2hUZXh0UGxhaW5UZXh0LFxuICByaWNoVGV4dENoYXJhY3RlclN0eWxlcyxcbiAgY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dCxcbiAgYXBwbHlSaWNoVGV4dFN0eWxlUmFuZ2UsXG4gIHJlY29uY2lsZVJpY2hUZXh0QWZ0ZXJFZGl0LFxuICB0eXBlIEJhY2tncm91bmRQYXR0ZXJuLFxuICB0eXBlIEVkZ2VTdHlsZSxcbiAgdHlwZSBGb250RmFtaWx5TW9kZSxcbiAgdHlwZSBNaW5kTWFwQXBwZWFyYW5jZSxcbiAgdHlwZSBNaW5kTWFwRG9jdW1lbnQsXG4gIHR5cGUgTWluZE1hcENvZGVCbG9jayxcbiAgdHlwZSBNaW5kTWFwQ29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayxcbiAgdHlwZSBNaW5kTWFwTm9kZSxcbiAgdHlwZSBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayxcbiAgdHlwZSBNaW5kTWFwU3VibWFwLFxuICB0eXBlIE1pbmRNYXBUZXh0UnVuLFxuICB0eXBlIE1pbmRNYXBUZXh0U3R5bGUsXG4gIHR5cGUgTm9kZVNoYXBlLFxuICB0eXBlIFRhc2tTdGF0dXMsXG4gIHJlbW92ZU5vZGVcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGNvbXB1dGVMYXlvdXQsIGRvY3VtZW50VG9TdmcsIGVkZ2VQYXRoLCB0eXBlIExheW91dFJlc3VsdCB9IGZyb20gXCIuL2xheW91dFwiO1xuaW1wb3J0IHsgQ29kZUVkaXRNb2RhbCwgVGFibGVFZGl0TW9kYWwgfSBmcm9tIFwiLi9jb250ZW50LW1vZGFsc1wiO1xuaW1wb3J0IHR5cGUgeyBJbWFnZUhvc3RDaG9pY2UsIEltYWdlSG9zdFVwbG9hZEJhdGNoIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzIHtcbiAgb25DaGFuZ2U6IChkb2N1bWVudDogTWluZE1hcERvY3VtZW50KSA9PiB2b2lkO1xuICBvbk9wZW5MaW5rOiAobGluazogc3RyaW5nKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgb25FeHBvcnRTdmc6IChzdmc6IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIG9uRXhwb3J0TWFya2Rvd246IChtYXJrZG93bjogc3RyaW5nKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgb25FeHBvcnRKc29uOiAoanNvbjogc3RyaW5nKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgcmVzb2x2ZUltYWdlOiAoc291cmNlOiBzdHJpbmcpID0+IHN0cmluZyB8IG51bGw7XG4gIG9uU2F2ZVBhc3RlZEltYWdlOiAoYmxvYjogQmxvYiwgc3VnZ2VzdGVkTmFtZTogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIGdldEltYWdlSG9zdHM6ICgpID0+IEltYWdlSG9zdENob2ljZVtdO1xuICBnZXREZWZhdWx0VXBsb2FkSG9zdElkczogKCkgPT4gc3RyaW5nW107XG4gIG9uVXBsb2FkSW1hZ2U6IChibG9iOiBCbG9iLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcsIGhvc3RJZHM6IHN0cmluZ1tdKSA9PiBQcm9taXNlPEltYWdlSG9zdFVwbG9hZEJhdGNoPjtcbiAgb25SZWFkSW1hZ2VTb3VyY2U6IChzb3VyY2U6IHN0cmluZykgPT4gUHJvbWlzZTx7IGJsb2I6IEJsb2I7IHN1Z2dlc3RlZE5hbWU6IHN0cmluZyB9IHwgbnVsbD47XG4gIG9uU2NoZWR1bGVBdXRvVXBsb2FkOiAobm9kZUlkOiBzdHJpbmcsIGJsb2NrSWQ6IHN0cmluZywgbG9jYWxQYXRoOiBzdHJpbmcsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZykgPT4gYm9vbGVhbjtcbiAgb25DcmVhdGVTdWJtYXA6IChub2RlOiBNaW5kTWFwTm9kZSkgPT4gUHJvbWlzZTxNaW5kTWFwU3VibWFwPjtcbiAgb25PcGVuTWluZE1hcDogKHBhdGg6IHN0cmluZywgZm9jdXNOb2RlSWQ/OiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICBvblJlbmRlckNvZGU6IChibG9jazogTWluZE1hcENvZGVCbG9jaywgY29udGFpbmVyOiBIVE1MRWxlbWVudCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEVkaXRvck9wdGlvbnMge1xuICBkZWZhdWx0Tm9kZVNoYXBlOiBOb2RlU2hhcGU7XG4gIGRlZmF1bHRBcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZTtcbiAgc2hvd1Rhc2tQcm9ncmVzczogYm9vbGVhbjtcbiAgYXV0b0ZpdE9uT3BlbjogYm9vbGVhbjtcbiAgaGlzdG9yeUxpbWl0OiBudW1iZXI7XG4gIGltYWdlRmFpbG92ZXJFbmFibGVkOiBib29sZWFuO1xuICBpbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHM6IG51bWJlcjtcbiAgaW1hZ2VGYWlsb3ZlclVzZUxvY2FsRmFsbGJhY2s6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBOb2RlRWRpdFZhbHVlcyB7XG4gIGNvbnRlbnQ6IE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgbm90ZTogc3RyaW5nO1xuICBsaW5rOiBzdHJpbmc7XG4gIGljb246IHN0cmluZztcbiAgdGFnczogc3RyaW5nW107XG4gIHRhc2s/OiBUYXNrU3RhdHVzO1xuICBjb2xvcj86IHN0cmluZztcbiAgdGV4dENvbG9yPzogc3RyaW5nO1xuICBib3JkZXJDb2xvcj86IHN0cmluZztcbiAgYm9yZGVyV2lkdGg/OiBudW1iZXI7XG4gIHNoYXBlPzogTm9kZVNoYXBlO1xuICBib2xkPzogYm9vbGVhbjtcbiAgaXRhbGljPzogYm9vbGVhbjtcbiAgdW5kZXJsaW5lPzogYm9vbGVhbjtcbiAgZm9udFNpemU/OiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHN0eWxlRXF1YWxzKGxlZnQ6IE1pbmRNYXBUZXh0U3R5bGUgfCB1bmRlZmluZWQsIHJpZ2h0OiBNaW5kTWFwVGV4dFN0eWxlIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShsZWZ0ID8/IHt9KSA9PT0gSlNPTi5zdHJpbmdpZnkocmlnaHQgPz8ge30pO1xufVxuXG5mdW5jdGlvbiByZW5kZXJSaWNoVGV4dFJ1bnMoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcnVuczogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29udGFpbmVyLmVtcHR5KCk7XG4gIGlmICghcnVucz8ubGVuZ3RoKSB7XG4gICAgY29udGFpbmVyLnNldFRleHQoZmFsbGJhY2tUZXh0KTtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgIGNvbnN0IHNwYW4gPSBjb250YWluZXIuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtcmljaC1ydW5cIiwgdGV4dDogcnVuLnRleHQgfSk7XG4gICAgaWYgKHJ1bi5zdHlsZT8uYm9sZCAhPT0gdW5kZWZpbmVkKSBzcGFuLnN0eWxlLmZvbnRXZWlnaHQgPSBydW4uc3R5bGUuYm9sZCA/IFwiNzAwXCIgOiBcIjQwMFwiO1xuICAgIGlmIChydW4uc3R5bGU/Lml0YWxpYyAhPT0gdW5kZWZpbmVkKSBzcGFuLnN0eWxlLmZvbnRTdHlsZSA9IHJ1bi5zdHlsZS5pdGFsaWMgPyBcIml0YWxpY1wiIDogXCJub3JtYWxcIjtcbiAgICBjb25zdCBkZWNvcmF0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAocnVuLnN0eWxlPy51bmRlcmxpbmUpIGRlY29yYXRpb25zLnB1c2goXCJ1bmRlcmxpbmVcIik7XG4gICAgaWYgKHJ1bi5zdHlsZT8uc3RyaWtlKSBkZWNvcmF0aW9ucy5wdXNoKFwibGluZS10aHJvdWdoXCIpO1xuICAgIGlmIChkZWNvcmF0aW9ucy5sZW5ndGgpIHNwYW4uc3R5bGUudGV4dERlY29yYXRpb25MaW5lID0gZGVjb3JhdGlvbnMuam9pbihcIiBcIik7XG4gICAgaWYgKHJ1bi5zdHlsZT8uY29sb3IpIHNwYW4uc3R5bGUuY29sb3IgPSBydW4uc3R5bGUuY29sb3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3R5bGVGcm9tRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCwgaW5oZXJpdGVkOiBNaW5kTWFwVGV4dFN0eWxlKTogTWluZE1hcFRleHRTdHlsZSB7XG4gIGNvbnN0IHN0eWxlOiBNaW5kTWFwVGV4dFN0eWxlID0geyAuLi5pbmhlcml0ZWQgfTtcbiAgY29uc3QgdGFnID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGlmICh0YWcgPT09IFwiYlwiIHx8IHRhZyA9PT0gXCJzdHJvbmdcIikgc3R5bGUuYm9sZCA9IHRydWU7XG4gIGlmICh0YWcgPT09IFwiaVwiIHx8IHRhZyA9PT0gXCJlbVwiKSBzdHlsZS5pdGFsaWMgPSB0cnVlO1xuICBpZiAodGFnID09PSBcInVcIikgc3R5bGUudW5kZXJsaW5lID0gdHJ1ZTtcbiAgaWYgKHRhZyA9PT0gXCJzXCIgfHwgdGFnID09PSBcInN0cmlrZVwiIHx8IHRhZyA9PT0gXCJkZWxcIikgc3R5bGUuc3RyaWtlID0gdHJ1ZTtcbiAgY29uc3QgaW5saW5lID0gZWxlbWVudC5zdHlsZTtcbiAgaWYgKGlubGluZS5mb250V2VpZ2h0ICYmIChpbmxpbmUuZm9udFdlaWdodCA9PT0gXCJib2xkXCIgfHwgTnVtYmVyKGlubGluZS5mb250V2VpZ2h0KSA+PSA2MDApKSBzdHlsZS5ib2xkID0gdHJ1ZTtcbiAgaWYgKGlubGluZS5mb250U3R5bGUgPT09IFwiaXRhbGljXCIpIHN0eWxlLml0YWxpYyA9IHRydWU7XG4gIGNvbnN0IGRlY29yYXRpb24gPSBgJHtpbmxpbmUudGV4dERlY29yYXRpb259ICR7aW5saW5lLnRleHREZWNvcmF0aW9uTGluZX1gO1xuICBpZiAoZGVjb3JhdGlvbi5pbmNsdWRlcyhcInVuZGVybGluZVwiKSkgc3R5bGUudW5kZXJsaW5lID0gdHJ1ZTtcbiAgaWYgKGRlY29yYXRpb24uaW5jbHVkZXMoXCJsaW5lLXRocm91Z2hcIikpIHN0eWxlLnN0cmlrZSA9IHRydWU7XG4gIGNvbnN0IGZvbnRDb2xvciA9IHRhZyA9PT0gXCJmb250XCIgPyBlbGVtZW50LmdldEF0dHJpYnV0ZShcImNvbG9yXCIpIDogbnVsbDtcbiAgY29uc3QgY29sb3IgPSBpbmxpbmUuY29sb3IgfHwgZm9udENvbG9yIHx8IFwiXCI7XG4gIGlmIChjb2xvcikge1xuICAgIGNvbnN0IHByb2JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgcHJvYmUuc3R5bGUuY29sb3IgPSBjb2xvcjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHByb2JlKTtcbiAgICBjb25zdCBub3JtYWxpemVkID0gZ2V0Q29tcHV0ZWRTdHlsZShwcm9iZSkuY29sb3IubWF0Y2goL1xcZCsvZyk/LnNsaWNlKDAsIDMpLm1hcChOdW1iZXIpO1xuICAgIHByb2JlLnJlbW92ZSgpO1xuICAgIGlmIChub3JtYWxpemVkPy5sZW5ndGggPT09IDMpIHN0eWxlLmNvbG9yID0gYCMke25vcm1hbGl6ZWQubWFwKCh2YWx1ZSkgPT4gdmFsdWUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSkuam9pbihcIlwiKX1gO1xuICB9XG4gIHJldHVybiBzdHlsZTtcbn1cblxuZnVuY3Rpb24gcmVhZFJpY2hUZXh0RWRpdG9yKGVkaXRvcjogSFRNTEVsZW1lbnQpOiB7IHRleHQ6IHN0cmluZzsgcmljaFRleHQ/OiBNaW5kTWFwVGV4dFJ1bltdIH0ge1xuICBjb25zdCByYXdSdW5zOiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE5vZGUsIGluaGVyaXRlZDogTWluZE1hcFRleHRTdHlsZSk6IHZvaWQgPT4ge1xuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgY29uc3QgdGV4dCA9IChub2RlLnRleHRDb250ZW50ID8/IFwiXCIpLnJlcGxhY2UoL1xccj9cXG4vZywgXCIgXCIpO1xuICAgICAgaWYgKCF0ZXh0KSByZXR1cm47XG4gICAgICBjb25zdCBzdHlsZSA9IE9iamVjdC52YWx1ZXMoaW5oZXJpdGVkKS5zb21lKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCkgPyB7IC4uLmluaGVyaXRlZCB9IDogdW5kZWZpbmVkO1xuICAgICAgY29uc3QgcHJldmlvdXMgPSByYXdSdW5zLmF0KC0xKTtcbiAgICAgIGlmIChwcmV2aW91cyAmJiBzdHlsZUVxdWFscyhwcmV2aW91cy5zdHlsZSwgc3R5bGUpKSBwcmV2aW91cy50ZXh0ICs9IHRleHQ7XG4gICAgICBlbHNlIHJhd1J1bnMucHVzaCh7IHRleHQsIHN0eWxlIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm47XG4gICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJCUlwiKSB7XG4gICAgICByYXdSdW5zLnB1c2goeyB0ZXh0OiBcIiBcIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc3R5bGUgPSBzdHlsZUZyb21FbGVtZW50KG5vZGUsIGluaGVyaXRlZCk7XG4gICAgbm9kZS5jaGlsZE5vZGVzLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgc3R5bGUpKTtcbiAgICBpZiAoW1wiRElWXCIsIFwiUFwiXS5pbmNsdWRlcyhub2RlLnRhZ05hbWUpICYmIHJhd1J1bnMubGVuZ3RoICYmICFyYXdSdW5zLmF0KC0xKT8udGV4dC5lbmRzV2l0aChcIiBcIikpIHJhd1J1bnMucHVzaCh7IHRleHQ6IFwiIFwiIH0pO1xuICB9O1xuICBlZGl0b3IuY2hpbGROb2Rlcy5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIHt9KSk7XG4gIGNvbnN0IGZhbGxiYWNrID0gZWRpdG9yLnRleHRDb250ZW50Py5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCkgPz8gXCJcIjtcbiAgY29uc3QgcmljaFRleHQgPSBub3JtYWxpemVSaWNoVGV4dChyYXdSdW5zLCBmYWxsYmFjayk7XG4gIHJldHVybiB7IHRleHQ6IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBmYWxsYmFjaykudHJpbSgpLCByaWNoVGV4dCB9O1xufVxuXG5jbGFzcyBJbWFnZVByZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBzY2FsZSA9IDE7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHByaXZhdGUgcmVhZG9ubHkgc291cmNlOiBzdHJpbmcsIHByaXZhdGUgcmVhZG9ubHkgYWx0OiBzdHJpbmcpIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMubW9kYWxFbC5hZGRDbGFzcyhcIm1tYy1pbWFnZS1wcmV2aWV3LW1vZGFsXCIpO1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KHRoaXMuYWx0IHx8IFwiXHU1NkZFXHU3MjQ3XHU5ODg0XHU4OUM4XCIpO1xuICAgIGNvbnN0IHRvb2xiYXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLXByZXZpZXctdG9vbGJhclwiIH0pO1xuICAgIGNvbnN0IGltYWdlV3JhcCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtaW1hZ2UtcHJldmlldy1zdGFnZVwiIH0pO1xuICAgIGNvbnN0IGltYWdlID0gaW1hZ2VXcmFwLmNyZWF0ZUVsKFwiaW1nXCIsIHsgYXR0cjogeyBzcmM6IHRoaXMuc291cmNlLCBhbHQ6IHRoaXMuYWx0IHx8IFwiXHU1NkZFXHU3MjQ3XCIgfSB9KTtcbiAgICBsZXQgYmFzZVdpZHRoID0gMDtcbiAgICBsZXQgYmFzZUhlaWdodCA9IDA7XG4gICAgY29uc3QgYXBwbHlTY2FsZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgIGlmICghYmFzZVdpZHRoIHx8ICFiYXNlSGVpZ2h0KSByZXR1cm47XG4gICAgICBpbWFnZS5zdHlsZS53aWR0aCA9IGAke01hdGgubWF4KDEsIE1hdGgucm91bmQoYmFzZVdpZHRoICogdGhpcy5zY2FsZSkpfXB4YDtcbiAgICAgIGltYWdlLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWF4KDEsIE1hdGgucm91bmQoYmFzZUhlaWdodCAqIHRoaXMuc2NhbGUpKX1weGA7XG4gICAgfTtcbiAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KDMyMCwgaW1hZ2VXcmFwLmNsaWVudFdpZHRoICogMC45KTtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWF4KDIyMCwgaW1hZ2VXcmFwLmNsaWVudEhlaWdodCAqIDAuOSk7XG4gICAgICBjb25zdCBmaXQgPSBNYXRoLm1pbigxLCBhdmFpbGFibGVXaWR0aCAvIE1hdGgubWF4KDEsIGltYWdlLm5hdHVyYWxXaWR0aCksIGF2YWlsYWJsZUhlaWdodCAvIE1hdGgubWF4KDEsIGltYWdlLm5hdHVyYWxIZWlnaHQpKTtcbiAgICAgIGJhc2VXaWR0aCA9IE1hdGgubWF4KDEsIGltYWdlLm5hdHVyYWxXaWR0aCAqIGZpdCk7XG4gICAgICBiYXNlSGVpZ2h0ID0gTWF0aC5tYXgoMSwgaW1hZ2UubmF0dXJhbEhlaWdodCAqIGZpdCk7XG4gICAgICBhcHBseVNjYWxlKCk7XG4gICAgfSk7XG4gICAgY29uc3QgYnV0dG9uID0gKGxhYmVsOiBzdHJpbmcsIGFjdGlvbjogKCkgPT4gdm9pZCk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgZWwgPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFjdGlvbik7XG4gICAgfTtcbiAgICBidXR0b24oXCJcdTIyMTJcIiwgKCkgPT4geyB0aGlzLnNjYWxlID0gTWF0aC5tYXgoMC4yLCB0aGlzLnNjYWxlIC0gMC4yKTsgYXBwbHlTY2FsZSgpOyB9KTtcbiAgICBidXR0b24oXCIxMDAlXCIsICgpID0+IHsgdGhpcy5zY2FsZSA9IDE7IGFwcGx5U2NhbGUoKTsgfSk7XG4gICAgYnV0dG9uKFwiK1wiLCAoKSA9PiB7IHRoaXMuc2NhbGUgPSBNYXRoLm1pbig1LCB0aGlzLnNjYWxlICsgMC4yKTsgYXBwbHlTY2FsZSgpOyB9KTtcbiAgICBpbWFnZVdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuc2NhbGUgPSBNYXRoLm1pbig1LCBNYXRoLm1heCgwLjIsIHRoaXMuc2NhbGUgKyAoZXZlbnQuZGVsdGFZIDwgMCA/IDAuMTUgOiAtMC4xNSkpKTtcbiAgICAgIGFwcGx5U2NhbGUoKTtcbiAgICB9LCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xuICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoKSA9PiB7IHRoaXMuc2NhbGUgPSAxOyBhcHBseVNjYWxlKCk7IH0pO1xuICB9XG59XG5cbmNsYXNzIEltYWdlSG9zdFBpY2tlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmVkID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VsZWN0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGhvc3RzOiBJbWFnZUhvc3RDaG9pY2VbXSxcbiAgICBpbml0aWFsSWRzOiBzdHJpbmdbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJlc29sdmVTZWxlY3Rpb246IChpZHM6IHN0cmluZ1tdIHwgbnVsbCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIGluaXRpYWxJZHMuZm9yRWFjaCgoaWQpID0+IHRoaXMuc2VsZWN0ZWQuYWRkKGlkKSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTkwMDlcdTYyRTlcdTRFMEFcdTRGMjBcdTU2RkVcdTVFOEFcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbXMtaW1hZ2UtaG9zdC1waWNrZXJcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIixcbiAgICAgIHRleHQ6IFwiXHU1M0VGXHU0RUU1XHU5MDA5XHU2MkU5XHU0RTAwXHU0RTJBXHU2MjE2XHU1OTFBXHU0RTJBXHU1NkZFXHU1RThBXHUzMDAyXHU1MTY4XHU5MEU4XHU0RTBBXHU0RjIwXHU2MjEwXHU1MjlGXHU1NDBFXHVGRjBDXHU3QjJDXHU0RTAwXHU5ODc5XHU3Njg0XHU1NzMwXHU1NzQwXHU0RjFBXHU0RjVDXHU0RTNBXHU4MjgyXHU3MEI5XHU1RjUzXHU1MjREXHU2NjNFXHU3OTNBXHU1NzMwXHU1NzQwXHVGRjBDXHU1MTc2XHU0RjU5XHU1NzMwXHU1NzQwXHU0RjFBXHU0RjVDXHU0RTNBXHU5NTVDXHU1MENGXHU0RkREXHU1QjU4XHUzMDAyXCJcbiAgICB9KTtcbiAgICBjb25zdCBsaXN0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LXBpY2tlci1saXN0XCIgfSk7XG4gICAgZm9yIChjb25zdCBob3N0IG9mIHRoaXMuaG9zdHMpIHtcbiAgICAgIGNvbnN0IGxhYmVsID0gbGlzdC5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LXBpY2tlci1pdGVtXCIgfSk7XG4gICAgICBjb25zdCBjaGVja2JveCA9IGxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgICBjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZC5oYXMoaG9zdC5pZCk7XG4gICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHRoaXMuc2VsZWN0ZWQuYWRkKGhvc3QuaWQpOyBlbHNlIHRoaXMuc2VsZWN0ZWQuZGVsZXRlKGhvc3QuaWQpO1xuICAgICAgfSk7XG4gICAgICBsYWJlbC5jcmVhdGVTcGFuKHsgdGV4dDogaG9zdC5uYW1lIH0pO1xuICAgIH1cbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1vZGFsLWJ1dHRvbi1jb250YWluZXJcIiB9KTtcbiAgICBjb25zdCBjYW5jZWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTUzRDZcdTZEODhcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIGNvbnN0IGNvbmZpcm0gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTc4NkVcdTVCOUFcIiwgY2xzOiBcIm1vZC1jdGFcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgY29uZmlybS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkLnNpemUpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlx1OEJGN1x1ODFGM1x1NUMxMVx1OTAwOVx1NjJFOVx1NEUwMFx1NEUyQVx1NTZGRVx1NUU4QVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXNvbHZlZCA9IHRydWU7XG4gICAgICB0aGlzLnJlc29sdmVTZWxlY3Rpb24oQXJyYXkuZnJvbSh0aGlzLnNlbGVjdGVkKSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5yZXNvbHZlZCkgdGhpcy5yZXNvbHZlU2VsZWN0aW9uKG51bGwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNob29zZUltYWdlSG9zdHMoYXBwOiBBcHAsIGhvc3RzOiBJbWFnZUhvc3RDaG9pY2VbXSwgaW5pdGlhbElkczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdIHwgbnVsbD4ge1xuICBpZiAoIWhvc3RzLmxlbmd0aCkge1xuICAgIG5ldyBOb3RpY2UoXCJcdTZDQTFcdTY3MDlcdTUzRUZcdTc1MjhcdTU2RkVcdTVFOEFcdUZGMENcdThCRjdcdTUxNDhcdTU3MjhcdTYzRDJcdTRFRjZcdThCQkVcdTdGNkVcdTRFMkRcdTkxNERcdTdGNkVcdTVFNzZcdTU0MkZcdTc1MjhcdTU2RkVcdTVFOEFcIik7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxuICBjb25zdCBhbGxvd2VkID0gbmV3IFNldChob3N0cy5tYXAoKGhvc3QpID0+IGhvc3QuaWQpKTtcbiAgY29uc3QgaW5pdGlhbCA9IGluaXRpYWxJZHMuZmlsdGVyKChpZCkgPT4gYWxsb3dlZC5oYXMoaWQpKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBuZXcgSW1hZ2VIb3N0UGlja2VyTW9kYWwoYXBwLCBob3N0cywgaW5pdGlhbC5sZW5ndGggPyBpbml0aWFsIDogW2hvc3RzWzBdIS5pZF0sIHJlc29sdmUpLm9wZW4oKSk7XG59XG5cbmNsYXNzIE5vZGVFZGl0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbm9kZTogTWluZE1hcE5vZGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdFNoYXBlOiBOb2RlU2hhcGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2FsbGJhY2tzOiBQaWNrPE1pbmRNYXBFZGl0b3JDYWxsYmFja3MsIFwicmVzb2x2ZUltYWdlXCIgfCBcIm9uU2F2ZVBhc3RlZEltYWdlXCIgfCBcImdldEltYWdlSG9zdHNcIiB8IFwiZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHNcIiB8IFwib25VcGxvYWRJbWFnZVwiIHwgXCJvblJlYWRJbWFnZVNvdXJjZVwiPjtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6ICh2YWx1ZXM6IE5vZGVFZGl0VmFsdWVzLCBtb2RlOiBcImF1dG9zYXZlXCIgfCBcImNvbW1pdFwiKSA9PiB2b2lkO1xuICBwcml2YXRlIHNhdmVPbkNsb3NlOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjbG9zZVdpdGhvdXRGbHVzaCA9IGZhbHNlO1xuICBwcml2YXRlIG91dHNpZGVQb2ludGVySGFuZGxlcjogKChldmVudDogUG9pbnRlckV2ZW50KSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIG5vZGU6IE1pbmRNYXBOb2RlLFxuICAgIGRlZmF1bHRTaGFwZTogTm9kZVNoYXBlLFxuICAgIGNhbGxiYWNrczogUGljazxNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzLCBcInJlc29sdmVJbWFnZVwiIHwgXCJvblNhdmVQYXN0ZWRJbWFnZVwiIHwgXCJnZXRJbWFnZUhvc3RzXCIgfCBcImdldERlZmF1bHRVcGxvYWRIb3N0SWRzXCIgfCBcIm9uVXBsb2FkSW1hZ2VcIiB8IFwib25SZWFkSW1hZ2VTb3VyY2VcIj4sXG4gICAgc3VibWl0OiAodmFsdWVzOiBOb2RlRWRpdFZhbHVlcywgbW9kZTogXCJhdXRvc2F2ZVwiIHwgXCJjb21taXRcIikgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubm9kZSA9IG5vZGU7XG4gICAgdGhpcy5kZWZhdWx0U2hhcGUgPSBkZWZhdWx0U2hhcGU7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBjYWxsYmFja3M7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcdTUxODVcdTVCQjlcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtbm9kZS1lZGl0LW1vZGFsXCIpO1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtZWRpdC1mb3JtXCIgfSk7XG4gICAgZm9ybS5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgICAgdGV4dDogXCJcdTgyODJcdTcwQjlcdTUxODVcdTVCQjlcdTc1MzFcdTUzRUZcdTYzOTJcdTVFOEZcdTc2ODRcdTY1ODdcdTVCNTdcdTU3NTdcdTU0OENcdTU2RkVcdTcyNDdcdTU3NTdcdTdFQzRcdTYyMTBcdTMwMDJcdTUzRUZcdTRFRTVcdTUzRUFcdTRGRERcdTc1NTlcdTU2RkVcdTcyNDdcdUZGMENcdTRFNUZcdTUzRUZcdTRFRTVcdTdFQzRcdTU0MDhcdTRFM0FcdTU2RkVcdTcyNDdcdTIxOTJcdTY1ODdcdTVCNTdcdTMwMDFcdTY1ODdcdTVCNTdcdTIxOTJcdTU2RkVcdTcyNDdcdUZGMENcdTYyMTZcdTY1ODdcdTVCNTdcdTIxOTJcdTU2RkVcdTcyNDdcdTIxOTJcdTY1ODdcdTVCNTdcdTMwMDJcIlxuICAgIH0pO1xuXG4gICAgbGV0IHdvcmtpbmdCbG9ja3M6IE1pbmRNYXBDb250ZW50QmxvY2tbXSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobm9kZUNvbnRlbnRCbG9ja3ModGhpcy5ub2RlKSkpIGFzIE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgICBpZiAoIXdvcmtpbmdCbG9ja3MubGVuZ3RoKSB3b3JraW5nQmxvY2tzID0gW3sgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0OiBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiIH1dO1xuICAgIGxldCBzY2hlZHVsZUF1dG9TYXZlOiAoKSA9PiB2b2lkID0gKCkgPT4gdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgYWN0aW9uUm93ID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGJsb2Nrc0VsID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stbGlzdFwiIH0pO1xuXG4gICAgY29uc3QgY2xvbmVCbG9ja3MgPSAoKTogTWluZE1hcENvbnRlbnRCbG9ja1tdID0+IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkod29ya2luZ0Jsb2NrcykpIGFzIE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgICBjb25zdCB2YWxpZEJsb2NrcyA9ICgpOiBNaW5kTWFwQ29udGVudEJsb2NrW10gPT4gY2xvbmVCbG9ja3MoKS5maWx0ZXIoKGJsb2NrKSA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIgPyBCb29sZWFuKGJsb2NrLnNvdXJjZS50cmltKCkpIDogQm9vbGVhbihibG9jay50ZXh0LnRyaW0oKSkpO1xuXG4gICAgY29uc3QgcmVuZGVyVGV4dEJsb2NrID0gKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGJsb2NrOiBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgdG9vbGJhciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXJpY2gtdGV4dC10b29sYmFyXCIgfSk7XG4gICAgICBjb25zdCBzb3VyY2UgPSBjb250YWluZXIuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICAgIGNsczogXCJtbWMtcmljaC10ZXh0LXNvdXJjZVwiLFxuICAgICAgICBhdHRyOiB7IHJvd3M6IFwiM1wiLCBzcGVsbGNoZWNrOiBcInRydWVcIiwgcGxhY2Vob2xkZXI6IFwiXHU4RjkzXHU1MTY1XHU2NTg3XHU1QjU3XHVGRjFCXHU1M0VGXHU0RUU1XHU1MTY4XHU5MEU4XHU1MjIwXHU5NjY0XHVGRjBDXHU4QkE5XHU4MjgyXHU3MEI5XHU1M0VBXHU0RkREXHU3NTU5XHU1NkZFXHU3MjQ3XCIgfVxuICAgICAgfSk7XG4gICAgICBzb3VyY2UudmFsdWUgPSBibG9jay50ZXh0O1xuICAgICAgbGV0IHNhdmVkU3RhcnQgPSBzb3VyY2UudmFsdWUubGVuZ3RoO1xuICAgICAgbGV0IHNhdmVkRW5kID0gc291cmNlLnZhbHVlLmxlbmd0aDtcbiAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXJpY2gtc2VsZWN0aW9uLXN0YXR1c1wiIH0pO1xuICAgICAgY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcmljaC1wcmV2aWV3LWxhYmVsXCIsIHRleHQ6IFwiXHU2NTg3XHU1QjU3XHU2ODM3XHU1RjBGXHU5ODg0XHU4OUM4XCIgfSk7XG4gICAgICBjb25zdCBwcmV2aWV3ID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcmljaC10ZXh0LXByZXZpZXdcIiB9KTtcbiAgICAgIGNvbnN0IHVwZGF0ZVByZXZpZXcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHJlbmRlclJpY2hUZXh0UnVucyhwcmV2aWV3LCBibG9jay5yaWNoVGV4dCwgYmxvY2sudGV4dCB8fCBcIlx1OTg4NFx1ODlDOFx1NjU4N1x1NUI1N1wiKTtcbiAgICAgICAgcHJldmlldy50b2dnbGVDbGFzcyhcImlzLXBsYWNlaG9sZGVyXCIsICFibG9jay50ZXh0KTtcbiAgICAgIH07XG4gICAgICBjb25zdCByZW1lbWJlciA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2F2ZWRTdGFydCA9IHNvdXJjZS5zZWxlY3Rpb25TdGFydCA/PyAwO1xuICAgICAgICBzYXZlZEVuZCA9IHNvdXJjZS5zZWxlY3Rpb25FbmQgPz8gc2F2ZWRTdGFydDtcbiAgICAgICAgY29uc3QgZnJvbSA9IE1hdGgubWluKHNhdmVkU3RhcnQsIHNhdmVkRW5kKTtcbiAgICAgICAgY29uc3QgdG8gPSBNYXRoLm1heChzYXZlZFN0YXJ0LCBzYXZlZEVuZCk7XG4gICAgICAgIHNlbGVjdGlvbi5zZXRUZXh0KGZyb20gPT09IHRvID8gYFx1NTE0OVx1NjgwN1x1NEY0RFx1N0Y2RVx1RkYxQSR7ZnJvbSArIDF9YCA6IGBcdTVERjJcdTkwMDlcdTYyRTlcdTdCMkMgJHtmcm9tICsgMX1cdTIwMTMke3RvfSBcdTRFMkFcdTVCNTdcdTdCMjZgKTtcbiAgICAgIH07XG4gICAgICBjb25zdCByYW5nZSA9ICgpOiB7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyIH0gfCBudWxsID0+IHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihibG9jay50ZXh0Lmxlbmd0aCwgTWF0aC5taW4oc2F2ZWRTdGFydCwgc2F2ZWRFbmQpKSk7XG4gICAgICAgIGNvbnN0IGVuZCA9IE1hdGgubWF4KHN0YXJ0LCBNYXRoLm1pbihibG9jay50ZXh0Lmxlbmd0aCwgTWF0aC5tYXgoc2F2ZWRTdGFydCwgc2F2ZWRFbmQpKSk7XG4gICAgICAgIGlmIChzdGFydCA9PT0gZW5kKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIlx1OEJGN1x1NTE0OFx1OTAwOVx1NjJFOVx1OTcwMFx1ODk4MVx1OEJCRVx1N0Y2RVx1NjgzQ1x1NUYwRlx1NzY4NFx1NjU4N1x1NUI1N1wiKTtcbiAgICAgICAgICBzb3VyY2UuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2UuZm9jdXMoKTsgc291cmNlLnNldFNlbGVjdGlvblJhbmdlKHN0YXJ0LCBlbmQpO1xuICAgICAgICByZXR1cm4geyBzdGFydCwgZW5kIH07XG4gICAgICB9O1xuICAgICAgY29uc3Qgc3R5bGVCdXR0b24gPSAobGFiZWw6IHN0cmluZywgdGl0bGU6IHN0cmluZywgYWN0aW9uOiAoKSA9PiB2b2lkLCBjbHMgPSBcIlwiKTogSFRNTEJ1dHRvbkVsZW1lbnQgPT4ge1xuICAgICAgICBjb25zdCBidG4gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBgbW1jLXJpY2gtdG9vbGJhci1idXR0b24gJHtjbHN9YC50cmltKCksIHRleHQ6IGxhYmVsLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIsIHRpdGxlIH0gfSk7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IGFjdGlvbigpOyB9KTtcbiAgICAgICAgcmV0dXJuIGJ0bjtcbiAgICAgIH07XG4gICAgICBjb25zdCBhcHBseUJvb2xlYW4gPSAoa2V5OiBcImJvbGRcIiB8IFwiaXRhbGljXCIgfCBcInVuZGVybGluZVwiKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gcmFuZ2UoKTsgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBzdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhibG9jay5yaWNoVGV4dCwgYmxvY2sudGV4dCk7XG4gICAgICAgIGNvbnN0IGVuYWJsZWQgPSBzdHlsZXMuc2xpY2Uoc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCkuZXZlcnkoKHN0eWxlKSA9PiBzdHlsZVtrZXldID09PSB0cnVlKTtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCwgeyBba2V5XTogIWVuYWJsZWQgfSk7XG4gICAgICAgIHVwZGF0ZVByZXZpZXcoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyBzb3VyY2Uuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCk7IHJlbWVtYmVyKCk7XG4gICAgICB9O1xuICAgICAgc3R5bGVCdXR0b24oXCJCXCIsIFwiXHU1MkEwXHU3Qzk3XHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XCIsICgpID0+IGFwcGx5Qm9vbGVhbihcImJvbGRcIiksIFwiaXMtYm9sZFwiKTtcbiAgICAgIHN0eWxlQnV0dG9uKFwiSVwiLCBcIlx1NjU5Q1x1NEY1M1x1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1wiLCAoKSA9PiBhcHBseUJvb2xlYW4oXCJpdGFsaWNcIiksIFwiaXMtaXRhbGljXCIpO1xuICAgICAgc3R5bGVCdXR0b24oXCJVXCIsIFwiXHU3RUQ5XHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XHU1MkEwXHU0RTBCXHU1MjEyXHU3RUJGXCIsICgpID0+IGFwcGx5Qm9vbGVhbihcInVuZGVybGluZVwiKSwgXCJpcy11bmRlcmxpbmVcIik7XG4gICAgICBjb25zdCBjb2xvckxhYmVsID0gdG9vbGJhci5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcIm1tYy1yaWNoLWNvbG9yLWJ1dHRvblwiLCBhdHRyOiB7IHRpdGxlOiBcIlx1NEZFRVx1NjUzOVx1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiIH0gfSk7XG4gICAgICBjb2xvckxhYmVsLmNyZWF0ZVNwYW4oeyB0ZXh0OiBcIlx1OTg5Q1x1ODI3MlwiIH0pO1xuICAgICAgY29uc3QgY29sb3JMaW5lID0gY29sb3JMYWJlbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy1yaWNoLWNvbG9yLWxpbmVcIiB9KTtcbiAgICAgIGNvbnN0IGNvbG9yID0gY29sb3JMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjb2xvclwiLCBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIlx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiIH0gfSk7XG4gICAgICBjb2xvci52YWx1ZSA9IFwiI2VmNDQ0NFwiO1xuICAgICAgY29sb3JMaW5lLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLnZhbHVlO1xuICAgICAgY29sb3IuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHsgY29sb3JMaW5lLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLnZhbHVlOyB9KTtcbiAgICAgIGNvbG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IHJhbmdlKCk7IGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCwgeyBjb2xvcjogY29sb3IudmFsdWUgfSk7XG4gICAgICAgIHVwZGF0ZVByZXZpZXcoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgfSk7XG4gICAgICBzdHlsZUJ1dHRvbihcIlx1NkUwNVx1OTY2NFx1NjgzQ1x1NUYwRlwiLCBcIlx1NkUwNVx1OTY2NFx1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1x1NjgzQ1x1NUYwRlwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gcmFuZ2UoKTsgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgICAgICBibG9jay5yaWNoVGV4dCA9IGFwcGx5UmljaFRleHRTdHlsZVJhbmdlKGJsb2NrLnRleHQsIGJsb2NrLnJpY2hUZXh0LCBzZWxlY3RlZC5zdGFydCwgc2VsZWN0ZWQuZW5kLCBudWxsKTtcbiAgICAgICAgdXBkYXRlUHJldmlldygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7XG4gICAgICB9LCBcImlzLXdpZGVcIik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcInNlbGVjdFwiLCByZW1lbWJlcik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHJlbWVtYmVyKTtcbiAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCByZW1lbWJlcik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHNvdXJjZS52YWx1ZS5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKTtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSByZWNvbmNpbGVSaWNoVGV4dEFmdGVyRWRpdChibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgbmV4dCk7XG4gICAgICAgIGJsb2NrLnRleHQgPSBuZXh0O1xuICAgICAgICBzb3VyY2UudmFsdWUgPSBuZXh0O1xuICAgICAgICByZW1lbWJlcigpOyB1cGRhdGVQcmV2aWV3KCk7IHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgIH0pO1xuICAgICAgdXBkYXRlUHJldmlldygpOyByZW1lbWJlcigpO1xuICAgIH07XG5cbiAgICBjb25zdCBjaG9vc2VJbWFnZSA9IChibG9jazogTWluZE1hcEltYWdlQ29udGVudEJsb2NrLCBtb2RlOiBcImxvY2FsXCIgfCBcInJlbW90ZVwiLCByZWZyZXNoOiAoKSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gICAgICB2b2lkIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGxldCBob3N0SWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAobW9kZSA9PT0gXCJyZW1vdGVcIikge1xuICAgICAgICAgIGNvbnN0IGNob3NlbiA9IGF3YWl0IGNob29zZUltYWdlSG9zdHModGhpcy5hcHAsIHRoaXMuY2FsbGJhY2tzLmdldEltYWdlSG9zdHMoKSwgdGhpcy5jYWxsYmFja3MuZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHMoKSk7XG4gICAgICAgICAgaWYgKCFjaG9zZW4pIHJldHVybjtcbiAgICAgICAgICBob3N0SWRzID0gY2hvc2VuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCBuZXcgUHJvbWlzZTxGaWxlIHwgbnVsbD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgICBpbnB1dC50eXBlID0gXCJmaWxlXCI7XG4gICAgICAgICAgaW5wdXQuYWNjZXB0ID0gXCJpbWFnZS8qXCI7XG4gICAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiByZXNvbHZlKGlucHV0LmZpbGVzPy5bMF0gPz8gbnVsbCksIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgICAgICBpbnB1dC5jbGljaygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFmaWxlKSByZXR1cm47XG4gICAgICAgIGlmIChtb2RlID09PSBcImxvY2FsXCIpIHtcbiAgICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25TYXZlUGFzdGVkSW1hZ2UoZmlsZSwgZmlsZS5uYW1lKTtcbiAgICAgICAgICBibG9jay5zb3VyY2UgPSBwYXRoO1xuICAgICAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gcGF0aDtcbiAgICAgICAgICBibG9jay5yZW1vdGVTb3VyY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGJhdGNoID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25VcGxvYWRJbWFnZShmaWxlLCBmaWxlLm5hbWUsIGhvc3RJZHMpO1xuICAgICAgICAgIGlmICghYmF0Y2guc3VjY2Vzc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGJhdGNoLmZhaWx1cmVzLm1hcCgoaXRlbSkgPT4gYCR7aXRlbS5ob3N0TmFtZX1cdUZGMUEke2l0ZW0uZXJyb3J9YCkuam9pbihcIlx1RkYxQlwiKSB8fCBcIlx1NjcyQVx1NzdFNVx1OTUxOVx1OEJFRlwiO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB1cGxvYWRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICAgIGJsb2NrLnNvdXJjZSA9IGJhdGNoLnN1Y2Nlc3Nlc1swXSEudXJsO1xuICAgICAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGJsb2NrLnJlbW90ZVNvdXJjZXMgPSBiYXRjaC5zdWNjZXNzZXMubWFwKChpdGVtKSA9PiAoeyAuLi5pdGVtLCB1cGxvYWRlZEF0IH0pKTtcbiAgICAgICAgICBpZiAoYmF0Y2guZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBcdTkwRThcdTUyMDZcdTU2RkVcdTVFOEFcdTRFMEFcdTRGMjBcdTU5MzFcdThEMjVcdUZGMUEke2JhdGNoLmZhaWx1cmVzLm1hcCgoaXRlbSkgPT4gaXRlbS5ob3N0TmFtZSkuam9pbihcIlx1MzAwMVwiKX1gLCA3MDAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU0RTBBXHU0RjIwXHU1MjMwXHVGRjFBJHtiYXRjaC5zdWNjZXNzZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWJsb2NrLmFsdCkgYmxvY2suYWx0ID0gZmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sIFwiXCIpO1xuICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgIHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgIH0pKCkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBpbWFnZSBvcGVyYXRpb24gZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgICAgbmV3IE5vdGljZShgJHttb2RlID09PSBcInJlbW90ZVwiID8gXCJcdTRFMEFcdTRGMjBcdTU2RkVcdTVFOEFcIiA6IFwiXHU0RkREXHU1QjU4XHU1NkZFXHU3MjQ3XCJ9XHU1OTMxXHU4RDI1XHVGRjFBJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCwgNzAwMCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgdXBsb2FkRXhpc3RpbmdJbWFnZSA9IChibG9jazogTWluZE1hcEltYWdlQ29udGVudEJsb2NrLCByZWZyZXNoOiAoKSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gICAgICB2b2lkIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNob3NlbiA9IGF3YWl0IGNob29zZUltYWdlSG9zdHModGhpcy5hcHAsIHRoaXMuY2FsbGJhY2tzLmdldEltYWdlSG9zdHMoKSwgdGhpcy5jYWxsYmFja3MuZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHMoKSk7XG4gICAgICAgIGlmICghY2hvc2VuKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHJlYWRhYmxlU291cmNlID0gYmxvY2subG9jYWxTb3VyY2UgfHwgYmxvY2suc291cmNlO1xuICAgICAgICBjb25zdCBpbWFnZSA9IGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uUmVhZEltYWdlU291cmNlKHJlYWRhYmxlU291cmNlKTtcbiAgICAgICAgaWYgKCFpbWFnZSkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcdTRFMERcdTY2MkZcdTUzRUZcdThCRkJcdTUzRDZcdTc2ODRcdTY3MkNcdTU3MzBcdTY1ODdcdTRFRjZcdUZGMUJcdThCRjdcdTRGN0ZcdTc1MjhcdTIwMThcdTRFMEFcdTRGMjBcdTUyMzBcdTU2RkVcdTVFOEFcdTIwMTlcdTkxQ0RcdTY1QjBcdTkwMDlcdTYyRTlcdTU2RkVcdTcyNDdcIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJhdGNoID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25VcGxvYWRJbWFnZShpbWFnZS5ibG9iLCBpbWFnZS5zdWdnZXN0ZWROYW1lLCBjaG9zZW4pO1xuICAgICAgICBpZiAoIWJhdGNoLnN1Y2Nlc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYmF0Y2guZmFpbHVyZXMubWFwKChpdGVtKSA9PiBgJHtpdGVtLmhvc3ROYW1lfVx1RkYxQSR7aXRlbS5lcnJvcn1gKS5qb2luKFwiXHVGRjFCXCIpIHx8IFwiXHU0RTBBXHU0RjIwXHU1OTMxXHU4RDI1XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVwbG9hZGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gbmV3IE1hcCgoYmxvY2sucmVtb3RlU291cmNlcyA/PyBbXSkubWFwKChpdGVtKSA9PiBbaXRlbS5ob3N0SWQsIGl0ZW1dKSk7XG4gICAgICAgIGJhdGNoLnN1Y2Nlc3Nlcy5mb3JFYWNoKChpdGVtKSA9PiBleGlzdGluZy5zZXQoaXRlbS5ob3N0SWQsIHsgLi4uaXRlbSwgdXBsb2FkZWRBdCB9KSk7XG4gICAgICAgIGJsb2NrLnJlbW90ZVNvdXJjZXMgPSBBcnJheS5mcm9tKGV4aXN0aW5nLnZhbHVlcygpKTtcbiAgICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSByZWFkYWJsZVNvdXJjZTtcbiAgICAgICAgaWYgKCFiYXRjaC5mYWlsdXJlcy5sZW5ndGgpIGJsb2NrLnNvdXJjZSA9IGJhdGNoLnN1Y2Nlc3Nlc1swXSEudXJsO1xuICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgIHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgICAgaWYgKGJhdGNoLmZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYFx1OTBFOFx1NTIwNlx1NTZGRVx1NUU4QVx1NEUwQVx1NEYyMFx1NTkzMVx1OEQyNVx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7YmF0Y2guZmFpbHVyZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpfWAsIDcwMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYFx1NUY1M1x1NTI0RFx1NTZGRVx1NzI0N1x1NURGMlx1NEUwQVx1NEYyMFx1NTIzMFx1RkYxQSR7YmF0Y2guc3VjY2Vzc2VzLm1hcCgoaXRlbSkgPT4gaXRlbS5ob3N0TmFtZSkuam9pbihcIlx1MzAwMVwiKX1gKTtcbiAgICAgICAgfVxuICAgICAgfSkoKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGV4aXN0aW5nIGltYWdlIHVwbG9hZCBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgICBuZXcgTm90aWNlKGBcdTRFMEFcdTRGMjBcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcdTU5MzFcdThEMjVcdUZGMUEke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLCA3MDAwKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCByZW5kZXJCbG9ja3MgPSAoKTogdm9pZCA9PiB7XG4gICAgICBibG9ja3NFbC5lbXB0eSgpO1xuICAgICAgd29ya2luZ0Jsb2Nrcy5mb3JFYWNoKChibG9jaywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgY2FyZCA9IGJsb2Nrc0VsLmNyZWF0ZURpdih7IGNsczogYG1tYy1jb250ZW50LWJsb2NrIGlzLSR7YmxvY2sudHlwZX1gIH0pO1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1oZWFkZXJcIiB9KTtcbiAgICAgICAgaGVhZGVyLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stdGl0bGVcIiwgdGV4dDogYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIgPyBgXHU2NTg3XHU1QjU3XHU1NzU3ICR7aW5kZXggKyAxfWAgOiBgXHU1NkZFXHU3MjQ3XHU1NzU3ICR7aW5kZXggKyAxfWAgfSk7XG4gICAgICAgIGNvbnN0IGNvbnRyb2xzID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1jb250cm9sc1wiIH0pO1xuICAgICAgICBjb25zdCBjb250cm9sID0gKGljb246IHN0cmluZywgdGl0bGU6IHN0cmluZywgYWN0aW9uOiAoKSA9PiB2b2lkLCBkaXNhYmxlZCA9IGZhbHNlKTogdm9pZCA9PiB7XG4gICAgICAgICAgY29uc3QgYnRuID0gY29udHJvbHMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb25cIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiLCB0aXRsZSwgXCJhcmlhLWxhYmVsXCI6IHRpdGxlIH0gfSk7XG4gICAgICAgICAgc2V0SWNvbihidG4sIGljb24pOyBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBhY3Rpb24oKTsgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnRyb2woXCJhcnJvdy11cFwiLCBcIlx1NEUwQVx1NzlGQlwiLCAoKSA9PiB7IFt3b3JraW5nQmxvY2tzW2luZGV4IC0gMV0sIHdvcmtpbmdCbG9ja3NbaW5kZXhdXSA9IFt3b3JraW5nQmxvY2tzW2luZGV4XSEsIHdvcmtpbmdCbG9ja3NbaW5kZXggLSAxXSFdOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9LCBpbmRleCA9PT0gMCk7XG4gICAgICAgIGNvbnRyb2woXCJhcnJvdy1kb3duXCIsIFwiXHU0RTBCXHU3OUZCXCIsICgpID0+IHsgW3dvcmtpbmdCbG9ja3NbaW5kZXggKyAxXSwgd29ya2luZ0Jsb2Nrc1tpbmRleF1dID0gW3dvcmtpbmdCbG9ja3NbaW5kZXhdISwgd29ya2luZ0Jsb2Nrc1tpbmRleCArIDFdIV07IHJlbmRlckJsb2NrcygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0sIGluZGV4ID09PSB3b3JraW5nQmxvY2tzLmxlbmd0aCAtIDEpO1xuICAgICAgICBjb250cm9sKFwidHJhc2gtMlwiLCBcIlx1NTIyMFx1OTY2NFx1NTE4NVx1NUJCOVx1NTc1N1wiLCAoKSA9PiB7IHdvcmtpbmdCbG9ja3Muc3BsaWNlKGluZGV4LCAxKTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSk7XG4gICAgICAgIGlmIChibG9jay50eXBlID09PSBcInRleHRcIikge1xuICAgICAgICAgIHJlbmRlclRleHRCbG9jayhjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1ib2R5XCIgfSksIGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stYm9keSBtbWMtaW1hZ2UtYmxvY2stZWRpdG9yXCIgfSk7XG4gICAgICAgICAgY29uc3QgcHJldmlldyA9IGJvZHkuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1pbWFnZS1ibG9jay1wcmV2aWV3XCIgfSk7XG4gICAgICAgICAgY29uc3QgcmVmcmVzaCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIHByZXZpZXcuZW1wdHkoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlKGJsb2NrLnNvdXJjZSk7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgY29uc3QgaW1nID0gcHJldmlldy5jcmVhdGVFbChcImltZ1wiLCB7IGF0dHI6IHsgc3JjOiByZXNvbHZlZCwgYWx0OiBibG9jay5hbHQgfHwgXCJcdTU2RkVcdTcyNDdcIiB9IH0pO1xuICAgICAgICAgICAgICBpbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG5ldyBJbWFnZVByZXZpZXdNb2RhbCh0aGlzLmFwcCwgcmVzb2x2ZWQsIGJsb2NrLmFsdCB8fCBcIlx1NTZGRVx1NzI0N1wiKS5vcGVuKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHByZXZpZXcuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1pbWFnZS1wbGFjZWhvbGRlclwiLCB0ZXh0OiBibG9jay5zb3VyY2UgPyBcIlx1NjVFMFx1NkNENVx1NTJBMFx1OEY3RFx1NTZGRVx1NzI0N1wiIDogXCJcdTVDMUFcdTY3MkFcdTkwMDlcdTYyRTlcdTU2RkVcdTcyNDdcIiB9KTtcbiAgICAgICAgICAgIHNvdXJjZS52YWx1ZSA9IGJsb2NrLnNvdXJjZTtcbiAgICAgICAgICAgIGFsdC52YWx1ZSA9IGJsb2NrLmFsdCA/PyBcIlwiO1xuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3Qgc291cmNlTGFiZWwgPSBib2R5LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NzI0N1x1OERFRlx1NUY4NFx1NjIxNlx1N0Y1MVx1NTc0MFwiIH0pO1xuICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHNvdXJjZUxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJcdTRFRDNcdTVFOTNcdThERUZcdTVGODRcdTMwMDFbW1x1NTZGRVx1NzI0N11dIFx1NjIxNiBodHRwczovLy4uLlwiIH0gfSk7XG4gICAgICAgICAgY29uc3QgYWx0TGFiZWwgPSBib2R5LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NzI0N1x1OEJGNFx1NjYwRVx1RkYwOFx1NTNFRlx1OTAwOVx1RkYwOVwiIH0pO1xuICAgICAgICAgIGNvbnN0IGFsdCA9IGFsdExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJcdTU2RkVcdTcyNDdcdThCRjRcdTY2MEVcIiB9IH0pO1xuICAgICAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV4dCA9IHNvdXJjZS52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAobmV4dCAhPT0gYmxvY2suc291cmNlKSB7XG4gICAgICAgICAgICAgIGJsb2NrLnNvdXJjZSA9IG5leHQ7XG4gICAgICAgICAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICBibG9jay5yZW1vdGVTb3VyY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVmcmVzaCgpO1xuICAgICAgICAgICAgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGFsdC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4geyBibG9jay5hbHQgPSBhbHQudmFsdWUudHJpbSgpIHx8IHVuZGVmaW5lZDsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICAgICAgICBjb25zdCBhY3Rpb25zID0gYm9keS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLWJsb2NrLWFjdGlvbnNcIiB9KTtcbiAgICAgICAgICBjb25zdCBsb2NhbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NEZERFx1NUI1OFx1NTIzMFx1NEVEM1x1NUU5M1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgICAgICBsb2NhbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gY2hvb3NlSW1hZ2UoYmxvY2ssIFwibG9jYWxcIiwgcmVmcmVzaCkpO1xuICAgICAgICAgIGNvbnN0IHJlbW90ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1OTAwOVx1NjJFOVx1NjU4N1x1NEVGNlx1NUU3Nlx1NEUwQVx1NEYyMFwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgICAgICByZW1vdGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGNob29zZUltYWdlKGJsb2NrLCBcInJlbW90ZVwiLCByZWZyZXNoKSk7XG4gICAgICAgICAgaWYgKGJsb2NrLmxvY2FsU291cmNlIHx8IChibG9jay5zb3VyY2UgJiYgIS9eaHR0cHM/OlxcL1xcLy9pLnRlc3QoYmxvY2suc291cmNlKSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZEN1cnJlbnQgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTRFMEFcdTRGMjBcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICAgICAgICB1cGxvYWRDdXJyZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB1cGxvYWRFeGlzdGluZ0ltYWdlKGJsb2NrLCByZWZyZXNoKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChibG9jay5yZW1vdGVTb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IG1pcnJvcnMgPSBib2R5LmNyZWF0ZURpdih7IGNsczogXCJtbXMtaW1hZ2UtbWlycm9yc1wiIH0pO1xuICAgICAgICAgICAgbWlycm9ycy5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tcy1pbWFnZS1taXJyb3JzLWxhYmVsXCIsIHRleHQ6IFwiXHU4RkRDXHU3QTBCXHU5NTVDXHU1MENGXHVGRjFBXCIgfSk7XG4gICAgICAgICAgICBibG9jay5yZW1vdGVTb3VyY2VzLmZvckVhY2goKGl0ZW0sIG1pcnJvckluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBtaXJyb3JzLmNyZWF0ZUVsKFwiYVwiLCB7XG4gICAgICAgICAgICAgICAgdGV4dDogaXRlbS5ob3N0TmFtZSB8fCBgXHU1NkZFXHU1RThBICR7bWlycm9ySW5kZXggKyAxfWAsXG4gICAgICAgICAgICAgICAgaHJlZjogaXRlbS51cmwsXG4gICAgICAgICAgICAgICAgYXR0cjogeyB0YXJnZXQ6IFwiX2JsYW5rXCIsIHJlbDogXCJub29wZW5lclwiIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZnJlc2goKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoIXdvcmtpbmdCbG9ja3MubGVuZ3RoKSBibG9ja3NFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWVtcHR5LWNvbnRlbnQtaGludFwiLCB0ZXh0OiBcIlx1NUY1M1x1NTI0RFx1NkNBMVx1NjcwOVx1NTE4NVx1NUJCOVx1NTc1N1x1MzAwMlx1OEJGN1x1NkRGQlx1NTJBMFx1NjU4N1x1NUI1N1x1NjIxNlx1NTZGRVx1NzI0N1x1MzAwMlwiIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCBhZGRUZXh0ID0gYWN0aW9uUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCIrIFx1NjU4N1x1NUI1N1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBhZGRUZXh0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHdvcmtpbmdCbG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcInRleHRcIiwgdGV4dDogXCJcIiB9KTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSk7XG4gICAgY29uc3QgYWRkSW1hZ2UgPSBhY3Rpb25Sb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIisgXHU1NkZFXHU3MjQ3XCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGFkZEltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHdvcmtpbmdCbG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcImltYWdlXCIsIHNvdXJjZTogXCJcIiB9KTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSk7XG4gICAgcmVuZGVyQmxvY2tzKCk7XG5cbiAgICBjb25zdCBkZXRhaWxzR3JpZCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1mb3JtLWdyaWRcIiB9KTtcbiAgICBjb25zdCBpY29uTGFiZWwgPSBkZXRhaWxzR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTU2RkVcdTY4MDdcdTYyMTYgRW1vamlcIiB9KTtcbiAgICBjb25zdCBpY29uSW5wdXQgPSBpY29uTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIlx1NEY4Qlx1NTk4MiBcdUQ4M0RcdURDQTFcIiB9IH0pO1xuICAgIGljb25JbnB1dC52YWx1ZSA9IHRoaXMubm9kZS5pY29uID8/IFwiXCI7XG4gICAgY29uc3QgdGFza0xhYmVsID0gZGV0YWlsc0dyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU0RUZCXHU1MkExXHU3MkI2XHU2MDAxXCIgfSk7XG4gICAgY29uc3QgdGFza1NlbGVjdCA9IHRhc2tMYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJcIiwgXCJcdTY1RTBcIl0sIFtcInRvZG9cIiwgXCJcdTVGODVcdTUyOUVcIl0sIFtcImRvaW5nXCIsIFwiXHU4RkRCXHU4ODRDXHU0RTJEXCJdLCBbXCJkb25lXCIsIFwiXHU1REYyXHU1QjhDXHU2MjEwXCJdXSBhcyBjb25zdCkgdGFza1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgdGFza1NlbGVjdC52YWx1ZSA9IHRoaXMubm9kZS50YXNrID8/IFwiXCI7XG4gICAgY29uc3Qgc2hhcGVMYWJlbCA9IGRldGFpbHNHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1ODI4Mlx1NzBCOVx1NUY2Mlx1NzJCNlwiIH0pO1xuICAgIGNvbnN0IHNoYXBlU2VsZWN0ID0gc2hhcGVMYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJyb3VuZGVkXCIsIFwiXHU1NzA2XHU4OUQyXCJdLCBbXCJwaWxsXCIsIFwiXHU4MEY2XHU1NkNBXCJdLCBbXCJyZWN0YW5nbGVcIiwgXCJcdTc2RjRcdTg5RDJcIl1dIGFzIGNvbnN0KSBzaGFwZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgc2hhcGVTZWxlY3QudmFsdWUgPSB0aGlzLm5vZGUuc3R5bGU/LnNoYXBlID8/IHRoaXMuZGVmYXVsdFNoYXBlO1xuICAgIGNvbnN0IHRhZ3NMYWJlbCA9IGRldGFpbHNHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NjgwN1x1N0I3RVx1RkYwOFx1OTAxN1x1NTNGN1x1NTIwNlx1OTY5NFx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IHRhZ3NJbnB1dCA9IHRhZ3NMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIgfSk7XG4gICAgdGFnc0lucHV0LnZhbHVlID0gdGhpcy5ub2RlLnRhZ3M/LmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgY29uc3Qgc3R5bGVHcmlkID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWZvcm0tZ3JpZCBtbWMtc3R5bGUtZ3JpZFwiIH0pO1xuICAgIGNvbnN0IGNvbG9yQ29udHJvbCA9IChsYWJlbFRleHQ6IHN0cmluZywgY3VycmVudDogc3RyaW5nIHwgdW5kZWZpbmVkLCBmYWxsYmFjazogc3RyaW5nKTogW0hUTUxJbnB1dEVsZW1lbnQsIEhUTUxJbnB1dEVsZW1lbnRdID0+IHtcbiAgICAgIGNvbnN0IGxhYmVsID0gc3R5bGVHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBsYWJlbFRleHQgfSk7XG4gICAgICBjb25zdCByb3cgPSBsYWJlbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbG9yLXJvd1wiIH0pO1xuICAgICAgY29uc3QgdG9nZ2xlID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgICBjb25zdCBjb2xvciA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjb2xvclwiIH0pO1xuICAgICAgdG9nZ2xlLmNoZWNrZWQgPSBCb29sZWFuKGN1cnJlbnQpOyBjb2xvci52YWx1ZSA9IGN1cnJlbnQgPz8gZmFsbGJhY2s7IGNvbG9yLmRpc2FibGVkID0gIXRvZ2dsZS5jaGVja2VkO1xuICAgICAgdG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4geyBjb2xvci5kaXNhYmxlZCA9ICF0b2dnbGUuY2hlY2tlZDsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICAgIGNvbG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgc2NoZWR1bGVBdXRvU2F2ZSk7XG4gICAgICByZXR1cm4gW3RvZ2dsZSwgY29sb3JdO1xuICAgIH07XG4gICAgY29uc3QgW2NvbG9yVG9nZ2xlLCBjb2xvcklucHV0XSA9IGNvbG9yQ29udHJvbChcIlx1ODI4Mlx1NzBCOVx1OTg5Q1x1ODI3MlwiLCB0aGlzLm5vZGUuc3R5bGU/LmNvbG9yLCBcIiM0ZjQ2ZTVcIik7XG4gICAgY29uc3QgW3RleHRDb2xvclRvZ2dsZSwgdGV4dENvbG9ySW5wdXRdID0gY29sb3JDb250cm9sKFwiXHU2NTc0XHU4MjgyXHU3MEI5XHU2NTg3XHU1QjU3XHU5ODlDXHU4MjcyXCIsIHRoaXMubm9kZS5zdHlsZT8udGV4dENvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgY29uc3QgW2JvcmRlckNvbG9yVG9nZ2xlLCBib3JkZXJDb2xvcklucHV0XSA9IGNvbG9yQ29udHJvbChcIlx1OEZCOVx1Njg0Nlx1OTg5Q1x1ODI3MlwiLCB0aGlzLm5vZGUuc3R5bGU/LmJvcmRlckNvbG9yLCBcIiM5NGEzYjhcIik7XG4gICAgY29uc3QgbnVtYmVyQ29udHJvbCA9IChsYWJlbFRleHQ6IHN0cmluZywgY3VycmVudDogbnVtYmVyIHwgdW5kZWZpbmVkLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IEhUTUxJbnB1dEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBzdHlsZUdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsVGV4dCB9KTtcbiAgICAgIGNvbnN0IGlucHV0ID0gbGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIGF0dHI6IHsgbWluOiBTdHJpbmcobWluKSwgbWF4OiBTdHJpbmcobWF4KSwgc3RlcDogU3RyaW5nKHN0ZXApLCBwbGFjZWhvbGRlcjogXCJcdThEREZcdTk2OEZcdTlFRDhcdThCQTRcIiB9IH0pO1xuICAgICAgaW5wdXQudmFsdWUgPSBjdXJyZW50Py50b1N0cmluZygpID8/IFwiXCI7IHJldHVybiBpbnB1dDtcbiAgICB9O1xuICAgIGNvbnN0IGJvcmRlcldpZHRoSW5wdXQgPSBudW1iZXJDb250cm9sKFwiXHU4RkI5XHU2ODQ2XHU3Qzk3XHU3RUM2XCIsIHRoaXMubm9kZS5zdHlsZT8uYm9yZGVyV2lkdGgsIDAsIDYsIC41KTtcbiAgICBjb25zdCBmb250U2l6ZUlucHV0ID0gbnVtYmVyQ29udHJvbChcIlx1NUI1N1x1NTNGN1wiLCB0aGlzLm5vZGUuc3R5bGU/LmZvbnRTaXplLCAxMCwgMzIsIDEpO1xuICAgIGNvbnN0IGJvb2xlYW5Db250cm9sID0gKGxhYmVsVGV4dDogc3RyaW5nLCBjdXJyZW50OiBib29sZWFuIHwgdW5kZWZpbmVkKTogSFRNTFNlbGVjdEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBzdHlsZUdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsVGV4dCB9KTtcbiAgICAgIGNvbnN0IHNlbGVjdCA9IGxhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcdThEREZcdTk2OEZcdTlFRDhcdThCQTRcIiwgYXR0cjogeyB2YWx1ZTogXCJpbmhlcml0XCIgfSB9KTtcbiAgICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHU1RjAwXHU1NDJGXCIsIGF0dHI6IHsgdmFsdWU6IFwidHJ1ZVwiIH0gfSk7XG4gICAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBcIlx1NTE3M1x1OTVFRFwiLCBhdHRyOiB7IHZhbHVlOiBcImZhbHNlXCIgfSB9KTtcbiAgICAgIHNlbGVjdC52YWx1ZSA9IGN1cnJlbnQgPT09IHVuZGVmaW5lZCA/IFwiaW5oZXJpdFwiIDogY3VycmVudCA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiOyByZXR1cm4gc2VsZWN0O1xuICAgIH07XG4gICAgY29uc3QgYm9sZElucHV0ID0gYm9vbGVhbkNvbnRyb2woXCJcdTY1NzRcdTgyODJcdTcwQjlcdTUyQTBcdTdDOTdcIiwgdGhpcy5ub2RlLnN0eWxlPy5ib2xkKTtcbiAgICBjb25zdCBpdGFsaWNJbnB1dCA9IGJvb2xlYW5Db250cm9sKFwiXHU2NTc0XHU4MjgyXHU3MEI5XHU2NTlDXHU0RjUzXCIsIHRoaXMubm9kZS5zdHlsZT8uaXRhbGljKTtcbiAgICBjb25zdCB1bmRlcmxpbmVJbnB1dCA9IGJvb2xlYW5Db250cm9sKFwiXHU2NTc0XHU4MjgyXHU3MEI5XHU0RTBCXHU1MjEyXHU3RUJGXCIsIHRoaXMubm9kZS5zdHlsZT8udW5kZXJsaW5lKTtcblxuICAgIGNvbnN0IG5vdGVMYWJlbCA9IGZvcm0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1OTA3XHU2Q0U4XHVGRjA4XHU1M0VGXHU5MDA5XHVGRjA5XCIgfSk7XG4gICAgY29uc3Qgbm90ZUlucHV0ID0gbm90ZUxhYmVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIik7IG5vdGVJbnB1dC52YWx1ZSA9IHRoaXMubm9kZS5ub3RlID8/IFwiXCI7IG5vdGVJbnB1dC5yb3dzID0gNDtcbiAgICBjb25zdCBsaW5rTGFiZWwgPSBmb3JtLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OTRGRVx1NjNBNVx1RkYwOFx1N0Y1MVx1NTc0MFx1MzAwMVx1N0IxNFx1OEJCMFx1NTQwRFx1NjIxNiBbW1x1NTNDQ1x1OTRGRV1dXHVGRjA5XCIgfSk7XG4gICAgY29uc3QgbGlua0lucHV0ID0gbGlua0xhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiB9KTsgbGlua0lucHV0LnZhbHVlID0gdGhpcy5ub2RlLmxpbmsgPz8gXCJcIjtcblxuICAgIGNvbnN0IHBhcnNlQm9vbCA9ICh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB8IHVuZGVmaW5lZCA9PiB2YWx1ZSA9PT0gXCJ0cnVlXCIgPyB0cnVlIDogdmFsdWUgPT09IFwiZmFsc2VcIiA/IGZhbHNlIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHBhcnNlTnVtYmVyID0gKHZhbHVlOiBzdHJpbmcsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcik6IG51bWJlciB8IHVuZGVmaW5lZCA9PiB2YWx1ZS50cmltKCkgJiYgTnVtYmVyLmlzRmluaXRlKE51bWJlcih2YWx1ZSkpID8gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIE51bWJlcih2YWx1ZSkpKSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBjb2xsZWN0VmFsdWVzID0gKHNob3dOb3RpY2U6IGJvb2xlYW4pOiBOb2RlRWRpdFZhbHVlcyB8IG51bGwgPT4ge1xuICAgICAgY29uc3QgY29udGVudCA9IHZhbGlkQmxvY2tzKCk7XG4gICAgICBpZiAoIWNvbnRlbnQubGVuZ3RoKSB7IGlmIChzaG93Tm90aWNlKSBuZXcgTm90aWNlKFwiXHU4MjgyXHU3MEI5XHU4MUYzXHU1QzExXHU5NzAwXHU4OTgxXHU0RTAwXHU0RTJBXHU2NTg3XHU1QjU3XHU1NzU3XHU2MjE2XHU1NkZFXHU3MjQ3XHU1NzU3XCIpOyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgdGFzayA9IHRhc2tTZWxlY3QudmFsdWU7XG4gICAgICBjb25zdCBzaGFwZSA9IHNoYXBlU2VsZWN0LnZhbHVlO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudCxcbiAgICAgICAgbm90ZTogbm90ZUlucHV0LnZhbHVlLnRyaW0oKSwgbGluazogbGlua0lucHV0LnZhbHVlLnRyaW0oKSwgaWNvbjogaWNvbklucHV0LnZhbHVlLnRyaW0oKS5zbGljZSgwLCAxMiksXG4gICAgICAgIHRhZ3M6IEFycmF5LmZyb20obmV3IFNldCh0YWdzSW5wdXQudmFsdWUuc3BsaXQoL1ssXHVGRjBDXS8pLm1hcCgodGFnKSA9PiB0YWcudHJpbSgpLnJlcGxhY2UoL14jLywgXCJcIikpLmZpbHRlcihCb29sZWFuKSkpLnNsaWNlKDAsIDEyKSxcbiAgICAgICAgdGFzazogdGFzayA9PT0gXCJ0b2RvXCIgfHwgdGFzayA9PT0gXCJkb2luZ1wiIHx8IHRhc2sgPT09IFwiZG9uZVwiID8gdGFzayA6IHVuZGVmaW5lZCxcbiAgICAgICAgY29sb3I6IGNvbG9yVG9nZ2xlLmNoZWNrZWQgPyBjb2xvcklucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICB0ZXh0Q29sb3I6IHRleHRDb2xvclRvZ2dsZS5jaGVja2VkID8gdGV4dENvbG9ySW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGJvcmRlckNvbG9yOiBib3JkZXJDb2xvclRvZ2dsZS5jaGVja2VkID8gYm9yZGVyQ29sb3JJbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgYm9yZGVyV2lkdGg6IHBhcnNlTnVtYmVyKGJvcmRlcldpZHRoSW5wdXQudmFsdWUsIDAsIDYpLFxuICAgICAgICBzaGFwZTogc2hhcGUgPT09IFwicGlsbFwiIHx8IHNoYXBlID09PSBcInJlY3RhbmdsZVwiIHx8IHNoYXBlID09PSBcInJvdW5kZWRcIiA/IHNoYXBlIDogdW5kZWZpbmVkLFxuICAgICAgICBib2xkOiBwYXJzZUJvb2woYm9sZElucHV0LnZhbHVlKSwgaXRhbGljOiBwYXJzZUJvb2woaXRhbGljSW5wdXQudmFsdWUpLCB1bmRlcmxpbmU6IHBhcnNlQm9vbCh1bmRlcmxpbmVJbnB1dC52YWx1ZSksXG4gICAgICAgIGZvbnRTaXplOiBwYXJzZU51bWJlcihmb250U2l6ZUlucHV0LnZhbHVlLCAxMCwgMzIpXG4gICAgICB9O1xuICAgIH07XG5cbiAgICBsZXQgdGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIGxldCBsYXN0ID0gSlNPTi5zdHJpbmdpZnkoY29sbGVjdFZhbHVlcyhmYWxzZSkpO1xuICAgIGNvbnN0IHNhdmVOb3cgPSAobW9kZTogXCJhdXRvc2F2ZVwiIHwgXCJjb21taXRcIiwgc2hvd05vdGljZSA9IGZhbHNlKTogYm9vbGVhbiA9PiB7XG4gICAgICBpZiAodGltZXIgIT09IG51bGwpIHsgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcik7IHRpbWVyID0gbnVsbDsgfVxuICAgICAgY29uc3QgdmFsdWVzID0gY29sbGVjdFZhbHVlcyhzaG93Tm90aWNlKTsgaWYgKCF2YWx1ZXMpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IHNpZ25hdHVyZSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlcyk7XG4gICAgICBpZiAoc2lnbmF0dXJlICE9PSBsYXN0KSB7IHRoaXMuc3VibWl0KHZhbHVlcywgbW9kZSk7IGxhc3QgPSBzaWduYXR1cmU7IH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgc2NoZWR1bGVBdXRvU2F2ZSA9ICgpOiB2b2lkID0+IHsgaWYgKHRpbWVyICE9PSBudWxsKSB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTsgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBzYXZlTm93KFwiYXV0b3NhdmVcIiksIDI4MCk7IH07XG4gICAgdGhpcy5zYXZlT25DbG9zZSA9ICgpID0+IHsgc2F2ZU5vdyhcImNvbW1pdFwiKTsgfTtcblxuICAgIFtpY29uSW5wdXQsIHRhc2tTZWxlY3QsIHNoYXBlU2VsZWN0LCB0YWdzSW5wdXQsIGJvcmRlcldpZHRoSW5wdXQsIGZvbnRTaXplSW5wdXQsIGJvbGRJbnB1dCwgaXRhbGljSW5wdXQsIHVuZGVybGluZUlucHV0LCBub3RlSW5wdXQsIGxpbmtJbnB1dF1cbiAgICAgIC5mb3JFYWNoKChpbnB1dCkgPT4geyBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgc2NoZWR1bGVBdXRvU2F2ZSk7IGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgc2NoZWR1bGVBdXRvU2F2ZSk7IH0pO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1mb3JtLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjbG9zZUJ1dHRvbiA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW9kLWN0YVwiLCB0ZXh0OiBcIlx1NEZERFx1NUI1OFx1NUU3Nlx1NTE3M1x1OTVFRFwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBjbG9zZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyBpZiAoc2F2ZU5vdyhcImNvbW1pdFwiLCB0cnVlKSkgeyB0aGlzLmNsb3NlV2l0aG91dEZsdXNoID0gdHJ1ZTsgdGhpcy5jbG9zZSgpOyB9IH0pO1xuXG4gICAgdGhpcy5vdXRzaWRlUG9pbnRlckhhbmRsZXIgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCk6IHZvaWQgPT4ge1xuICAgICAgaWYgKHRoaXMubW9kYWxFbC5jb250YWlucyhldmVudC50YXJnZXQgYXMgTm9kZSkpIHJldHVybjtcbiAgICAgIHRoaXMuc2F2ZU9uQ2xvc2U/LigpOyB0aGlzLmNsb3NlV2l0aG91dEZsdXNoID0gdHJ1ZTsgdGhpcy5jbG9zZSgpO1xuICAgIH07XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHRoaXMub3V0c2lkZVBvaW50ZXJIYW5kbGVyISwgdHJ1ZSksIDApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY2xvc2VXaXRob3V0Rmx1c2gpIHRoaXMuc2F2ZU9uQ2xvc2U/LigpO1xuICAgIGlmICh0aGlzLm91dHNpZGVQb2ludGVySGFuZGxlcikgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHRoaXMub3V0c2lkZVBvaW50ZXJIYW5kbGVyLCB0cnVlKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG59XG5cbmNsYXNzIEFwcGVhcmFuY2VNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6IChhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSByZWFkb25seSByZXNldDogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UsIHN1Ym1pdDogKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKSA9PiB2b2lkLCByZXNldDogKCkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5hcHBlYXJhbmNlID0gYXBwZWFyYW5jZTtcbiAgICB0aGlzLnN1Ym1pdCA9IHN1Ym1pdDtcbiAgICB0aGlzLnJlc2V0ID0gcmVzZXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTU5MTZcdTg5QzJcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtYXBwZWFyYW5jZS1tb2RhbFwiKTtcbiAgICBjb25zdCBmb3JtID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJmb3JtXCIpO1xuICAgIGZvcm0uY3JlYXRlRWwoXCJwXCIsIHsgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLCB0ZXh0OiBcIlx1OEZEOVx1NEU5Qlx1OEJCRVx1N0Y2RVx1NTNFQVx1NEZERFx1NUI1OFx1NTIzMFx1NUY1M1x1NTI0RCAubWluZG1hcCBcdTY1ODdcdTRFRjZcdUZGMENcdTRFMERcdTRGMUFcdTRGRUVcdTY1MzlcdTYzRDJcdTRFRjZcdTUxNjhcdTVDNDBcdTlFRDhcdThCQTRcdTUwM0NcdTMwMDJcIiB9KTtcblxuICAgIGNvbnN0IGdyaWQgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZm9ybS1ncmlkIG1tYy1hcHBlYXJhbmNlLWdyaWRcIiB9KTtcbiAgICBjb25zdCBhZGRDb2xvciA9IChsYWJlbFRleHQ6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZmFsbGJhY2s6IHN0cmluZyk6IHsgdG9nZ2xlOiBIVE1MSW5wdXRFbGVtZW50OyBpbnB1dDogSFRNTElucHV0RWxlbWVudCB9ID0+IHtcbiAgICAgIGNvbnN0IGxhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogbGFiZWxUZXh0IH0pO1xuICAgICAgY29uc3Qgcm93ID0gbGFiZWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2xvci1yb3dcIiB9KTtcbiAgICAgIGNvbnN0IHRvZ2dsZSA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiIH0pO1xuICAgICAgY29uc3QgaW5wdXQgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY29sb3JcIiB9KTtcbiAgICAgIHRvZ2dsZS5jaGVja2VkID0gQm9vbGVhbih2YWx1ZSk7XG4gICAgICBpbnB1dC52YWx1ZSA9IHZhbHVlID8/IGZhbGxiYWNrO1xuICAgICAgaW5wdXQuZGlzYWJsZWQgPSAhdG9nZ2xlLmNoZWNrZWQ7XG4gICAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7IGlucHV0LmRpc2FibGVkID0gIXRvZ2dsZS5jaGVja2VkOyB9KTtcbiAgICAgIHJldHVybiB7IHRvZ2dsZSwgaW5wdXQgfTtcbiAgICB9O1xuXG4gICAgY29uc3QgYmFja2dyb3VuZCA9IGFkZENvbG9yKFwiXHU4MENDXHU2NjZGXHU5ODlDXHU4MjcyXCIsIHRoaXMuYXBwZWFyYW5jZS5iYWNrZ3JvdW5kQ29sb3IsIFwiI2Y4ZmFmY1wiKTtcbiAgICBjb25zdCBwYXR0ZXJuTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1ODBDQ1x1NjY2Rlx1NTZGRVx1Njg0OFwiIH0pO1xuICAgIGNvbnN0IHBhdHRlcm5TZWxlY3QgPSBwYXR0ZXJuTGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZm9yIChjb25zdCBbdmFsdWUsIGxhYmVsXSBvZiBbW1wibm9uZVwiLCBcIlx1NjVFMFwiXSwgW1wiZ3JpZFwiLCBcIlx1N0Y1MVx1NjgzQ1wiXSwgW1wiZG90c1wiLCBcIlx1NzBCOVx1OTYzNVwiXV0gYXMgY29uc3QpIHBhdHRlcm5TZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB2YWx1ZSB9IH0pO1xuICAgIHBhdHRlcm5TZWxlY3QudmFsdWUgPSB0aGlzLmFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gPz8gXCJncmlkXCI7XG4gICAgY29uc3QgcGF0dGVybkNvbG9yID0gYWRkQ29sb3IoXCJcdTU2RkVcdTY4NDhcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLnBhdHRlcm5Db2xvciwgXCIjOTRhM2I4XCIpO1xuXG4gICAgY29uc3QgZm9udExhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTVCNTdcdTRGNTNcIiB9KTtcbiAgICBjb25zdCBmb250U2VsZWN0ID0gZm9udExhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcIm9ic2lkaWFuXCIsIFwiXHU4RERGXHU5NjhGIE9ic2lkaWFuXCJdLCBbXCJzYW5zXCIsIFwiXHU2NUUwXHU4ODZDXHU3RUJGXCJdLCBbXCJzZXJpZlwiLCBcIlx1ODg2Q1x1N0VCRlwiXSwgW1wibW9ub1wiLCBcIlx1N0I0OVx1NUJCRFwiXSwgW1wiY3VzdG9tXCIsIFwiXHU4MUVBXHU1QjlBXHU0RTQ5XCJdXSBhcyBjb25zdCkgZm9udFNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgZm9udFNlbGVjdC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5mb250RmFtaWx5ID8/IFwib2JzaWRpYW5cIjtcbiAgICBjb25zdCBjdXN0b21Gb250TGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1ODFFQVx1NUI5QVx1NEU0OVx1NUI1N1x1NEY1M1x1NTQwRFx1NzlGMFwiIH0pO1xuICAgIGNvbnN0IGN1c3RvbUZvbnRJbnB1dCA9IGN1c3RvbUZvbnRMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiTWljcm9zb2Z0IFlhSGVpXCIgfSB9KTtcbiAgICBjdXN0b21Gb250SW5wdXQudmFsdWUgPSB0aGlzLmFwcGVhcmFuY2UuY3VzdG9tRm9udCA/PyBcIlwiO1xuICAgIGNvbnN0IHVwZGF0ZUN1c3RvbUZvbnQgPSAoKTogdm9pZCA9PiB7IGN1c3RvbUZvbnRJbnB1dC5kaXNhYmxlZCA9IGZvbnRTZWxlY3QudmFsdWUgIT09IFwiY3VzdG9tXCI7IH07XG4gICAgZm9udFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUN1c3RvbUZvbnQpO1xuICAgIHVwZGF0ZUN1c3RvbUZvbnQoKTtcblxuICAgIGNvbnN0IGZvbnRTaXplTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NUI1N1x1NTNGN1x1RkYwODEwXHUyMDEzMzBcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBmb250U2l6ZUlucHV0ID0gZm9udFNpemVMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgYXR0cjogeyBtaW46IFwiMTBcIiwgbWF4OiBcIjMwXCIsIHN0ZXA6IFwiMVwiIH0gfSk7XG4gICAgZm9udFNpemVJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLmFwcGVhcmFuY2UuZm9udFNpemUgPz8gMTQpO1xuXG4gICAgY29uc3QgZWRnZUNvbG9yID0gYWRkQ29sb3IoXCJcdThGREVcdTdFQkZcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLmVkZ2VDb2xvciwgXCIjN2M4YWE1XCIpO1xuICAgIGNvbnN0IGVkZ2VTdHlsZUxhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdThGREVcdTdFQkZcdTdDN0JcdTU3OEJcIiB9KTtcbiAgICBjb25zdCBlZGdlU3R5bGVTZWxlY3QgPSBlZGdlU3R5bGVMYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJjdXJ2ZWRcIiwgXCJcdTY2RjJcdTdFQkZcIl0sIFtcInN0cmFpZ2h0XCIsIFwiXHU3NkY0XHU3RUJGXCJdLCBbXCJlbGJvd1wiLCBcIlx1NjI5OFx1N0VCRlwiXV0gYXMgY29uc3QpIGVkZ2VTdHlsZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgZWRnZVN0eWxlU2VsZWN0LnZhbHVlID0gdGhpcy5hcHBlYXJhbmNlLmVkZ2VTdHlsZSA/PyBcImN1cnZlZFwiO1xuICAgIGNvbnN0IGVkZ2VXaWR0aExhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdThGREVcdTdFQkZcdTdDOTdcdTdFQzZcdUZGMDgwLjVcdTIwMTM4XHVGRjA5XCIgfSk7XG4gICAgY29uc3QgZWRnZVdpZHRoSW5wdXQgPSBlZGdlV2lkdGhMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgYXR0cjogeyBtaW46IFwiMC41XCIsIG1heDogXCI4XCIsIHN0ZXA6IFwiMC41XCIgfSB9KTtcbiAgICBlZGdlV2lkdGhJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLmFwcGVhcmFuY2UuZWRnZVdpZHRoID8/IDIuMik7XG5cbiAgICBjb25zdCBub2RlQ29sb3IgPSBhZGRDb2xvcihcIlx1ODI4Mlx1NzBCOVx1ODBDQ1x1NjY2Rlx1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2Uubm9kZUNvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgY29uc3QgdGV4dENvbG9yID0gYWRkQ29sb3IoXCJcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLnRleHRDb2xvciwgXCIjMGYxNzJhXCIpO1xuICAgIGNvbnN0IGJvcmRlckNvbG9yID0gYWRkQ29sb3IoXCJcdTgyODJcdTcwQjlcdThGQjlcdTY4NDZcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvciwgXCIjOTRhM2I4XCIpO1xuICAgIGNvbnN0IGJvcmRlcldpZHRoTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEZCOVx1Njg0Nlx1N0M5N1x1N0VDNlx1RkYwODBcdTIwMTM2XHVGRjA5XCIgfSk7XG4gICAgY29uc3QgYm9yZGVyV2lkdGhJbnB1dCA9IGJvcmRlcldpZHRoTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIGF0dHI6IHsgbWluOiBcIjBcIiwgbWF4OiBcIjZcIiwgc3RlcDogXCIwLjVcIiB9IH0pO1xuICAgIGJvcmRlcldpZHRoSW5wdXQudmFsdWUgPSBTdHJpbmcodGhpcy5hcHBlYXJhbmNlLm5vZGVCb3JkZXJXaWR0aCA/PyAxKTtcblxuICAgIGNvbnN0IHRleHRTdHlsZVNlY3Rpb24gPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtYXBwZWFyYW5jZS10ZXh0LXN0eWxlXCIgfSk7XG4gICAgdGV4dFN0eWxlU2VjdGlvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWFwcGVhcmFuY2UtdGV4dC1zdHlsZS10aXRsZVwiLCB0ZXh0OiBcIlx1NjU4N1x1NUI1N1x1NjgzN1x1NUYwRlwiIH0pO1xuICAgIGNvbnN0IHRleHRTdHlsZSA9IHRleHRTdHlsZVNlY3Rpb24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1hcHBlYXJhbmNlLXN0eWxlLW9wdGlvbnNcIiB9KTtcbiAgICBjb25zdCBhZGRDaGVjayA9ICh0ZXh0OiBzdHJpbmcsIGNoZWNrZWQ6IGJvb2xlYW4pOiBIVE1MSW5wdXRFbGVtZW50ID0+IHtcbiAgICAgIGNvbnN0IGxhYmVsID0gdGV4dFN0eWxlLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyBjbHM6IFwibW1jLWFwcGVhcmFuY2Utc3R5bGUtb3B0aW9uXCIgfSk7XG4gICAgICBjb25zdCBpbnB1dCA9IGxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgICBpbnB1dC5jaGVja2VkID0gY2hlY2tlZDtcbiAgICAgIGxhYmVsLmNyZWF0ZVNwYW4oeyB0ZXh0IH0pO1xuICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH07XG4gICAgY29uc3QgYm9sZCA9IGFkZENoZWNrKFwiXHU2NTg3XHU1QjU3XHU1MkEwXHU3Qzk3XCIsIHRoaXMuYXBwZWFyYW5jZS5ib2xkID09PSB0cnVlKTtcbiAgICBjb25zdCBpdGFsaWMgPSBhZGRDaGVjayhcIlx1NjU4N1x1NUI1N1x1NjU5Q1x1NEY1M1wiLCB0aGlzLmFwcGVhcmFuY2UuaXRhbGljID09PSB0cnVlKTtcbiAgICBjb25zdCB1bmRlcmxpbmUgPSBhZGRDaGVjayhcIlx1NjU4N1x1NUI1N1x1NEUwQlx1NTIxMlx1N0VCRlwiLCB0aGlzLmFwcGVhcmFuY2UudW5kZXJsaW5lID09PSB0cnVlKTtcblxuICAgIGNvbnN0IGNsYW1wID0gKHZhbHVlOiBzdHJpbmcsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgZmFsbGJhY2s6IG51bWJlcik6IG51bWJlciA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpID8gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHBhcnNlZCkpIDogZmFsbGJhY2s7XG4gICAgfTtcbiAgICBjb25zdCBhY3Rpb25zID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCByZXNldCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NjA2Mlx1NTkwRFx1NTE2OFx1NUM0MFx1OUVEOFx1OEJBNFwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IGNhbmNlbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTNENlx1NkQ4OFwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IHNhdmUgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTVFOTRcdTc1MjhcIiwgdHlwZTogXCJzdWJtaXRcIiwgY2xzOiBcIm1vZC1jdGFcIiB9KTtcbiAgICByZXNldC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnJlc2V0KCk7IHRoaXMuY2xvc2UoKTsgfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnN1Ym1pdCh7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogYmFja2dyb3VuZC50b2dnbGUuY2hlY2tlZCA/IGJhY2tncm91bmQuaW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBwYXR0ZXJuU2VsZWN0LnZhbHVlIGFzIEJhY2tncm91bmRQYXR0ZXJuLFxuICAgICAgICBwYXR0ZXJuQ29sb3I6IHBhdHRlcm5Db2xvci50b2dnbGUuY2hlY2tlZCA/IHBhdHRlcm5Db2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZm9udEZhbWlseTogZm9udFNlbGVjdC52YWx1ZSBhcyBGb250RmFtaWx5TW9kZSxcbiAgICAgICAgY3VzdG9tRm9udDogZm9udFNlbGVjdC52YWx1ZSA9PT0gXCJjdXN0b21cIiA/IGN1c3RvbUZvbnRJbnB1dC52YWx1ZS50cmltKCkuc2xpY2UoMCwgMTIwKSB8fCB1bmRlZmluZWQgOiB1bmRlZmluZWQsXG4gICAgICAgIGZvbnRTaXplOiBjbGFtcChmb250U2l6ZUlucHV0LnZhbHVlLCAxMCwgMzAsIDE0KSxcbiAgICAgICAgZWRnZUNvbG9yOiBlZGdlQ29sb3IudG9nZ2xlLmNoZWNrZWQgPyBlZGdlQ29sb3IuaW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGVkZ2VXaWR0aDogY2xhbXAoZWRnZVdpZHRoSW5wdXQudmFsdWUsIDAuNSwgOCwgMi4yKSxcbiAgICAgICAgZWRnZVN0eWxlOiBlZGdlU3R5bGVTZWxlY3QudmFsdWUgYXMgRWRnZVN0eWxlLFxuICAgICAgICBub2RlQ29sb3I6IG5vZGVDb2xvci50b2dnbGUuY2hlY2tlZCA/IG5vZGVDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgdGV4dENvbG9yOiB0ZXh0Q29sb3IudG9nZ2xlLmNoZWNrZWQgPyB0ZXh0Q29sb3IuaW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIG5vZGVCb3JkZXJDb2xvcjogYm9yZGVyQ29sb3IudG9nZ2xlLmNoZWNrZWQgPyBib3JkZXJDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZUJvcmRlcldpZHRoOiBjbGFtcChib3JkZXJXaWR0aElucHV0LnZhbHVlLCAwLCA2LCAxKSxcbiAgICAgICAgYm9sZDogYm9sZC5jaGVja2VkLFxuICAgICAgICBpdGFsaWM6IGl0YWxpYy5jaGVja2VkLFxuICAgICAgICB1bmRlcmxpbmU6IHVuZGVybGluZS5jaGVja2VkXG4gICAgICB9KTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBzYXZlLmZvY3VzKCksIDIwKTtcbiAgfVxufVxuXG5jbGFzcyBPdXRsaW5lTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbWFya2Rvd246IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSBvbkV4cG9ydDogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgbWFya2Rvd246IHN0cmluZywgb25FeHBvcnQ6ICgpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubWFya2Rvd24gPSBtYXJrZG93bjtcbiAgICB0aGlzLm9uRXhwb3J0ID0gb25FeHBvcnQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJNYXJrZG93biBcdTU5MjdcdTdFQjJcIik7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHsgY2xzOiBcIm1tYy1vdXRsaW5lLXRleHRhcmVhXCIgfSk7XG4gICAgdGV4dGFyZWEudmFsdWUgPSB0aGlzLm1hcmtkb3duO1xuICAgIHRleHRhcmVhLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1tb2RhbC1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgY29weSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTkwRFx1NTIzNlwiIH0pO1xuICAgIGNvbnN0IGV4cG9ydEJ1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUJGQ1x1NTFGQVx1NEUzQSAubWRcIiwgY2xzOiBcIm1vZC1jdGFcIiB9KTtcbiAgICBjb3B5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRoaXMubWFya2Rvd24pO1xuICAgICAgbmV3IE5vdGljZShcIlx1NURGMlx1NTkwRFx1NTIzNiBNYXJrZG93biBcdTU5MjdcdTdFQjJcIik7XG4gICAgfSk7XG4gICAgZXhwb3J0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLm9uRXhwb3J0KCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn1cblxuY2xhc3MgU2VhcmNoTm9kZXNNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBub2RlczogTWluZE1hcE5vZGVbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBvblF1ZXJ5OiAocXVlcnk6IHN0cmluZykgPT4gdm9pZDtcbiAgcHJpdmF0ZSByZWFkb25seSBvblNlbGVjdDogKG5vZGU6IE1pbmRNYXBOb2RlKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBub2RlczogTWluZE1hcE5vZGVbXSwgb25RdWVyeTogKHF1ZXJ5OiBzdHJpbmcpID0+IHZvaWQsIG9uU2VsZWN0OiAobm9kZTogTWluZE1hcE5vZGUpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubm9kZXMgPSBub2RlcztcbiAgICB0aGlzLm9uUXVlcnkgPSBvblF1ZXJ5O1xuICAgIHRoaXMub25TZWxlY3QgPSBvblNlbGVjdDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlx1NjQxQ1x1N0QyMlx1ODI4Mlx1NzBCOVwiKTtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJtbWMtc2VhcmNoLW1vZGFsXCIpO1xuICAgIGNvbnN0IGlucHV0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwic2VhcmNoXCIsIGNsczogXCJtbWMtc2VhcmNoLWlucHV0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiXHU2NDFDXHU3RDIyXHU2NTg3XHU1QjU3XHUzMDAxXHU1OTA3XHU2Q0U4XHUzMDAxXHU2ODA3XHU3QjdFXHU2MjE2XHU5NEZFXHU2M0E1XHUyMDI2XCIgfSB9KTtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtc2VhcmNoLWNvdW50XCIgfSk7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtc2VhcmNoLXJlc3VsdHNcIiB9KTtcblxuICAgIGNvbnN0IHJlbmRlclJlc3VsdHMgPSAoKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IGlucHV0LnZhbHVlLnRyaW0oKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgdGhpcy5vblF1ZXJ5KHF1ZXJ5KTtcbiAgICAgIHJlc3VsdHMuZW1wdHkoKTtcbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBxdWVyeVxuICAgICAgICA/IHRoaXMubm9kZXMuZmlsdGVyKChub2RlKSA9PiBub2RlU2VhcmNoVGV4dChub2RlKS5pbmNsdWRlcyhxdWVyeSkpLnNsaWNlKDAsIDgwKVxuICAgICAgICA6IHRoaXMubm9kZXMuc2xpY2UoMCwgNDApO1xuICAgICAgY291bnQuc2V0VGV4dChxdWVyeSA/IGBcdTYyN0VcdTUyMzAgJHttYXRjaGVzLmxlbmd0aH0gXHU0RTJBXHU4MjgyXHU3MEI5YCA6IGBcdTUxNzEgJHt0aGlzLm5vZGVzLmxlbmd0aH0gXHU0RTJBXHU4MjgyXHU3MEI5YCk7XG4gICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgbWF0Y2hlcykge1xuICAgICAgICBjb25zdCBidXR0b24gPSByZXN1bHRzLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1tYy1zZWFyY2gtcmVzdWx0XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgICAgIGNvbnN0IHRpdGxlID0gYnV0dG9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtc2VhcmNoLXJlc3VsdC10aXRsZVwiIH0pO1xuICAgICAgICBpZiAobm9kZS5pY29uKSB0aXRsZS5jcmVhdGVTcGFuKHsgdGV4dDogYCR7bm9kZS5pY29ufSBgIH0pO1xuICAgICAgICB0aXRsZS5jcmVhdGVTcGFuKHsgdGV4dDogbm9kZVBsYWluVGV4dChub2RlKSB8fCBcIlx1NTZGRVx1NzI0N1x1ODI4Mlx1NzBCOVwiIH0pO1xuICAgICAgICBjb25zdCBkZXRhaWxzID0gW25vZGUudGFzayA/ICh7IHRvZG86IFwiXHU1Rjg1XHU1MjlFXCIsIGRvaW5nOiBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiLCBkb25lOiBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIH0gYXMgY29uc3QpW25vZGUudGFza10gOiBcIlwiLCAuLi4obm9kZS50YWdzID8/IFtdKS5tYXAoKHRhZykgPT4gYCMke3RhZ31gKV1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCIgXHUwMEI3IFwiKTtcbiAgICAgICAgaWYgKGRldGFpbHMpIGJ1dHRvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXNlYXJjaC1yZXN1bHQtbWV0YVwiLCB0ZXh0OiBkZXRhaWxzIH0pO1xuICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLm9uU2VsZWN0KG5vZGUpO1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoIW1hdGNoZXMubGVuZ3RoKSByZXN1bHRzLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZW1wdHktc3RhdGVcIiwgdGV4dDogXCJcdTZDQTFcdTY3MDlcdTUzMzlcdTkxNERcdTc2ODRcdTgyODJcdTcwQjlcIiB9KTtcbiAgICB9O1xuXG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHJlbmRlclJlc3VsdHMpO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gcmVzdWx0cy5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcIi5tbWMtc2VhcmNoLXJlc3VsdFwiKTtcbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBmaXJzdC5jbGljaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVuZGVyUmVzdWx0cygpO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IGlucHV0LmZvY3VzKCksIDIwKTtcbiAgfVxufVxuXG5jbGFzcyBKc29uVHJhbnNmZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBkb2N1bWVudDogTWluZE1hcERvY3VtZW50O1xuICBwcml2YXRlIHJlYWRvbmx5IG9uSW1wb3J0OiAoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSByZWFkb25seSBvbkV4cG9ydDogKGpzb246IHN0cmluZykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCwgb25JbXBvcnQ6IChkb2N1bWVudDogTWluZE1hcERvY3VtZW50KSA9PiB2b2lkLCBvbkV4cG9ydDogKGpzb246IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgIHRoaXMub25JbXBvcnQgPSBvbkltcG9ydDtcbiAgICB0aGlzLm9uRXhwb3J0ID0gb25FeHBvcnQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJKU09OIFx1NUJGQ1x1NTE2NSAvIFx1NUJGQ1x1NTFGQVwiKTtcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiXHU1M0VGXHU0RUU1XHU1OTBEXHU1MjM2XHU1RjUzXHU1MjREIEpTT05cdUZGMENcdTRFNUZcdTUzRUZcdTRFRTVcdTdDOThcdThEMzRcdTUxNzZcdTRFRDYgTWluZE1hcCBTdHVkaW8gXHU2NTg3XHU2ODYzIEpTT04gXHU1NDBFXHU1QkZDXHU1MTY1XHUzMDAyXCIgfSk7XG4gICAgZGVzY3JpcHRpb24uYWRkQ2xhc3MoXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIik7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHsgY2xzOiBcIm1tYy1qc29uLXRleHRhcmVhXCIgfSk7XG4gICAgdGV4dGFyZWEudmFsdWUgPSBKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50LCBudWxsLCAyKTtcbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1tb2RhbC1hY3Rpb25zIG1tYy1qc29uLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjb3B5ID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1OTBEXHU1MjM2IEpTT05cIiB9KTtcbiAgICBjb25zdCBleHBvcnRCdXR0b24gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTVCRkNcdTUxRkEgLmpzb25cIiB9KTtcbiAgICBjb25zdCBpbXBvcnRCdXR0b24gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTVCRkNcdTUxNjVcdTVFNzZcdTY2RkZcdTYzNjJcIiwgY2xzOiBcIm1vZC13YXJuaW5nXCIgfSk7XG4gICAgY29weS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0YXJlYS52YWx1ZSk7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1REYyXHU1OTBEXHU1MjM2IEpTT05cIik7XG4gICAgfSk7XG4gICAgZXhwb3J0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm9uRXhwb3J0KHRleHRhcmVhLnZhbHVlKSk7XG4gICAgaW1wb3J0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHRleHRhcmVhLnZhbHVlKSBhcyBQYXJ0aWFsPE1pbmRNYXBEb2N1bWVudD47XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVEb2N1bWVudChwYXJzZWQsIHRoaXMuZG9jdW1lbnQudGl0bGUpO1xuICAgICAgICB0aGlzLm9uSW1wb3J0KG5vcm1hbGl6ZWQpO1xuICAgICAgICBuZXcgTm90aWNlKFwiSlNPTiBcdTVERjJcdTVCRkNcdTUxNjVcIik7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBKU09OIGltcG9ydCBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgICBuZXcgTm90aWNlKFwiSlNPTiBcdTY4M0NcdTVGMEZcdTY1RTBcdTY1NDhcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTU0MEVcdTkxQ0RcdThCRDVcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1pbmRNYXBFZGl0b3Ige1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwO1xuICBwcml2YXRlIHJlYWRvbmx5IGhvc3Q6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHJlYWRvbmx5IGNhbGxiYWNrczogTWluZE1hcEVkaXRvckNhbGxiYWNrcztcbiAgcHJpdmF0ZSBvcHRpb25zOiBNaW5kTWFwRWRpdG9yT3B0aW9ucztcbiAgcHJpdmF0ZSByb290RWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSB0b29sYmFyRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBuYXZpZ2F0aW9uQmFyRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSB2aWV3cG9ydEVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgc2NlbmVFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG5vZGVzTGF5ZXJFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIGVkZ2VzU3ZnITogU1ZHU1ZHRWxlbWVudDtcbiAgcHJpdmF0ZSBzdGF0dXNFbCE6IEhUTUxTcGFuRWxlbWVudDtcbiAgcHJpdmF0ZSB6b29tU3RhdHVzRWwhOiBIVE1MU3BhbkVsZW1lbnQ7XG4gIHByaXZhdGUgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudDtcbiAgcHJpdmF0ZSBsYXlvdXQ6IExheW91dFJlc3VsdDtcbiAgcHJpdmF0ZSBzZWxlY3RlZElkOiBzdHJpbmc7XG4gIHByaXZhdGUgem9vbSA9IDE7XG4gIHByaXZhdGUgcGFuWCA9IDA7XG4gIHByaXZhdGUgcGFuWSA9IDA7XG4gIHByaXZhdGUgaGlzdG9yeTogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBmdXR1cmU6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgZHJhZ2dpbmdJZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcGFubmluZyA9IGZhbHNlO1xuICBwcml2YXRlIHBhblN0YXJ0ID0geyB4OiAwLCB5OiAwLCBwYW5YOiAwLCBwYW5ZOiAwIH07XG4gIHByaXZhdGUgY2xlYW51cENhbGxiYWNrczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcbiAgcHJpdmF0ZSByZXNpemVPYnNlcnZlcjogUmVzaXplT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBicmFuY2hDbGlwYm9hcmQ6IE1pbmRNYXBOb2RlIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2VhcmNoUXVlcnkgPSBcIlwiO1xuICBwcml2YXRlIHJlYWRvbmx5IGltYWdlTG9hZFRpbWVycyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBob3N0OiBIVE1MRWxlbWVudCwgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCwgY2FsbGJhY2tzOiBNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzLCBvcHRpb25zOiBNaW5kTWFwRWRpdG9yT3B0aW9ucykge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuaG9zdCA9IGhvc3Q7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBjYWxsYmFja3M7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmRvY3VtZW50ID0gY2xvbmVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIHRoaXMubGF5b3V0ID0gY29tcHV0ZUxheW91dCh0aGlzLmRvY3VtZW50LnJvb3QsIHRoaXMuZG9jdW1lbnQubGF5b3V0LCB0aGlzLmdldEFwcGVhcmFuY2UoKS5mb250U2l6ZSA/PyAxNCk7XG4gICAgdGhpcy5idWlsZFVpKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9GaXRPbk9wZW4pIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDUwKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5jbGVhckltYWdlTG9hZFRpbWVycygpO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjaykgPT4gY2FsbGJhY2soKSk7XG4gICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzID0gW107XG4gICAgdGhpcy5yZXNpemVPYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICAgIHRoaXMucmVzaXplT2JzZXJ2ZXIgPSBudWxsO1xuICAgIHRoaXMuaG9zdC5lbXB0eSgpO1xuICB9XG5cbiAgc2V0RG9jdW1lbnQoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCwgcmVzZXRIaXN0b3J5ID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuZG9jdW1lbnQgPSBjbG9uZURvY3VtZW50KGRvY3VtZW50KTtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgaWYgKHJlc2V0SGlzdG9yeSkge1xuICAgICAgdGhpcy5oaXN0b3J5ID0gW107XG4gICAgICB0aGlzLmZ1dHVyZSA9IFtdO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b0ZpdE9uT3Blbikgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5maXRUb1ZpZXcoKSwgMjApO1xuICB9XG5cbiAgc2V0T3B0aW9ucyhvcHRpb25zOiBNaW5kTWFwRWRpdG9yT3B0aW9ucyk6IHZvaWQge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIGdldERvY3VtZW50KCk6IE1pbmRNYXBEb2N1bWVudCB7XG4gICAgcmV0dXJuIGNsb25lRG9jdW1lbnQodGhpcy5kb2N1bWVudCk7XG4gIH1cblxuICBtYXJrU2F2ZWQoKTogdm9pZCB7XG4gICAgdGhpcy5zdGF0dXNFbC5zZXRUZXh0KFwiXHU1REYyXHU0RkREXHU1QjU4XCIpO1xuICAgIHRoaXMucm9vdEVsLnJlbW92ZUNsYXNzKFwiaXMtZGlydHlcIik7XG4gIH1cblxuICBtYXJrU2F2aW5nKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdHVzRWwuc2V0VGV4dChcIlx1NEZERFx1NUI1OFx1NEUyRFx1MjAyNlwiKTtcbiAgICB0aGlzLnJvb3RFbC5hZGRDbGFzcyhcImlzLWRpcnR5XCIpO1xuICB9XG5cbiAgZm9jdXMoKTogdm9pZCB7XG4gICAgdGhpcy5yb290RWwuZm9jdXMoKTtcbiAgfVxuXG4gIGZvY3VzTm9kZUJ5SWQoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGlkKSkgdGhpcy5mb2N1c05vZGUoaWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFVpKCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdC5lbXB0eSgpO1xuICAgIHRoaXMucm9vdEVsID0gdGhpcy5ob3N0LmNyZWF0ZURpdih7IGNsczogXCJtbWMtZWRpdG9yXCIgfSk7XG4gICAgdGhpcy5yb290RWwudGFiSW5kZXggPSAwO1xuICAgIHRoaXMudG9vbGJhckVsID0gdGhpcy5yb290RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10b29sYmFyXCIgfSk7XG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFyRWwgPSB0aGlzLnJvb3RFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uXCIgfSk7XG4gICAgdGhpcy52aWV3cG9ydEVsID0gdGhpcy5yb290RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy12aWV3cG9ydFwiIH0pO1xuICAgIHRoaXMuc2NlbmVFbCA9IHRoaXMudmlld3BvcnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXNjZW5lXCIgfSk7XG4gICAgdGhpcy5lZGdlc1N2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpO1xuICAgIHRoaXMuZWRnZXNTdmcuY2xhc3NMaXN0LmFkZChcIm1tYy1lZGdlc1wiKTtcbiAgICB0aGlzLnNjZW5lRWwuYXBwZW5kQ2hpbGQodGhpcy5lZGdlc1N2Zyk7XG4gICAgdGhpcy5ub2Rlc0xheWVyRWwgPSB0aGlzLnNjZW5lRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2Rlcy1sYXllclwiIH0pO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcInBsdXMtY2lyY2xlXCIsIFwiXHU2REZCXHU1MkEwXHU1QjUwXHU4MjgyXHU3MEI5XHVGRjA4VGFiXHVGRjA5XCIsICgpID0+IHRoaXMuYWRkQ2hpbGQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwibGlzdC1wbHVzXCIsIFwiXHU2REZCXHU1MkEwXHU1NDBDXHU3RUE3XHU4MjgyXHU3MEI5XHVGRjA4RW50ZXJcdUZGMDlcIiwgKCkgPT4gdGhpcy5hZGRTaWJsaW5nKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcInBlbmNpbFwiLCBcIlx1N0YxNlx1OEY5MVx1ODI4Mlx1NzBCOVx1RkYwOEYyXHVGRjA5XCIsICgpID0+IHRoaXMuZWRpdFNlbGVjdGVkKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImNvcHktcGx1c1wiLCBcIlx1NTE0Qlx1OTY4Nlx1NTIwNlx1NjUyRlx1RkYwOEN0cmwvQ21kK0RcdUZGMDlcIiwgKCkgPT4gdGhpcy5kdXBsaWNhdGVTZWxlY3RlZCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ0cmFzaC0yXCIsIFwiXHU1MjIwXHU5NjY0XHU4MjgyXHU3MEI5XHVGRjA4RGVsZXRlXHVGRjA5XCIsICgpID0+IHRoaXMuZGVsZXRlU2VsZWN0ZWQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyU2VwYXJhdG9yKCk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiY2lyY2xlLWNoZWNrLWJpZ1wiLCBcIlx1NTIwN1x1NjM2Mlx1NEVGQlx1NTJBMVx1NzJCNlx1NjAwMVx1RkYwOEN0cmwvQ21kK0VudGVyXHVGRjA5XCIsICgpID0+IHRoaXMuY3ljbGVUYXNrKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImZvbGQtdmVydGljYWxcIiwgXCJcdTVDNTVcdTVGMDAvXHU2NTM2XHU4RDc3XHU4MjgyXHU3MEI5XHVGRjA4U3BhY2VcdUZGMDlcIiwgKCkgPT4gdGhpcy50b2dnbGVDb2xsYXBzZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJsaW5rXCIsIFwiXHU2MjUzXHU1RjAwXHU4MjgyXHU3MEI5XHU5NEZFXHU2M0E1XCIsICgpID0+IHRoaXMub3BlblNlbGVjdGVkTGluaygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJzZWFyY2hcIiwgXCJcdTY0MUNcdTdEMjJcdTgyODJcdTcwQjlcdUZGMDhDdHJsL0NtZCtGXHVGRjA5XCIsICgpID0+IHRoaXMub3BlblNlYXJjaCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ0YWJsZS0yXCIsIFwiXHU2M0QyXHU1MTY1XHU2MjE2XHU3RjE2XHU4RjkxXHU4ODY4XHU2ODNDXCIsICgpID0+IHRoaXMuZWRpdFRhYmxlKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImNvZGUtMlwiLCBcIlx1NjNEMlx1NTE2NVx1NjIxNlx1N0YxNlx1OEY5MVx1NEVFM1x1NzgwMVwiLCAoKSA9PiB0aGlzLmVkaXRDb2RlKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImltYWdlLXBsdXNcIiwgXCJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTUyMzBcdTVGNTNcdTUyNERcdTgyODJcdTcwQjlcdUZGMDhDdHJsL0NtZCtWXHVGRjA5XCIsICgpID0+IG5ldyBOb3RpY2UoXCJcdTUxNDhcdTU5MERcdTUyMzZcdTU2RkVcdTcyNDdcdUZGMENcdTUxOERcdTkwMDlcdTRFMkRcdTgyODJcdTcwQjlcdTVFNzZcdTYzMDkgQ3RybC9DbWQrVlwiKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwibmV0d29ya1wiLCBcIlx1NTIxQlx1NUVGQVx1NjIxNlx1OEZEQlx1NTE2NVx1NUI1MFx1NUJGQ1x1NTZGRVwiLCAoKSA9PiB2b2lkIHRoaXMuY3JlYXRlT3JPcGVuU3VibWFwKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcInVuZG8tMlwiLCBcIlx1NjRBNFx1OTUwMFx1RkYwOEN0cmwvQ21kK1pcdUZGMDlcIiwgKCkgPT4gdGhpcy51bmRvKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcInJlZG8tMlwiLCBcIlx1OTFDRFx1NTA1QVx1RkYwOEN0cmwvQ21kK1lcdUZGMDlcIiwgKCkgPT4gdGhpcy5yZWRvKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcInpvb20taW5cIiwgXCJcdTY1M0VcdTU5MjdcIiwgKCkgPT4gdGhpcy5zZXRab29tKHRoaXMuem9vbSAqIDEuMTUpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ6b29tLW91dFwiLCBcIlx1N0YyOVx1NUMwRlwiLCAoKSA9PiB0aGlzLnNldFpvb20odGhpcy56b29tIC8gMS4xNSkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcIm1heGltaXplXCIsIFwiXHU5MDAyXHU1RTk0XHU3NTNCXHU1RTAzXCIsICgpID0+IHRoaXMuZml0VG9WaWV3KCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImdpdC1mb3JrXCIsIFwiXHU1MjA3XHU2MzYyXHU1MzU1XHU0RkE3L1x1NTNDQ1x1NEZBN1x1NUUwM1x1NUM0MFwiLCAoKSA9PiB0aGlzLnRvZ2dsZUxheW91dCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJwYWxldHRlXCIsIFwiXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU1OTE2XHU4OUMyXCIsICgpID0+IHRoaXMuZWRpdEFwcGVhcmFuY2UoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyU2VwYXJhdG9yKCk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiZmlsZS10ZXh0XCIsIFwiXHU2N0U1XHU3NzBCIE1hcmtkb3duIFx1NTkyN1x1N0VCMlwiLCAoKSA9PiB0aGlzLnNob3dPdXRsaW5lKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImJyYWNlc1wiLCBcIkpTT04gXHU1QkZDXHU1MTY1IC8gXHU1QkZDXHU1MUZBXCIsICgpID0+IHRoaXMuc2hvd0pzb25UcmFuc2ZlcigpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJpbWFnZVwiLCBcIlx1NUJGQ1x1NTFGQSBTVkdcIiwgKCkgPT4gdm9pZCB0aGlzLmNhbGxiYWNrcy5vbkV4cG9ydFN2Zyhkb2N1bWVudFRvU3ZnKHRoaXMuZG9jdW1lbnQucm9vdCwgdGhpcy5kb2N1bWVudC5sYXlvdXQsIHRoaXMuZG9jdW1lbnQudGl0bGUsIHRoaXMuZ2V0QXBwZWFyYW5jZSgpKSkpO1xuXG4gICAgY29uc3Qgc3BhY2VyID0gdGhpcy50b29sYmFyRWwuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtdG9vbGJhci1zcGFjZXJcIiB9KTtcbiAgICBzcGFjZXIuc2V0QXR0cihcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgICB0aGlzLnpvb21TdGF0dXNFbCA9IHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXpvb20tc3RhdHVzXCIsIHRleHQ6IFwiMTAwJVwiIH0pO1xuICAgIHRoaXMuc3RhdHVzRWwgPSB0aGlzLnRvb2xiYXJFbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy1zYXZlLXN0YXR1c1wiLCB0ZXh0OiBcIlx1NURGMlx1NEZERFx1NUI1OFwiIH0pO1xuXG4gICAgY29uc3Qga2V5ZG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQgPT4gdGhpcy5oYW5kbGVLZXlkb3duKGV2ZW50KTtcbiAgICB0aGlzLnJvb3RFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBrZXlkb3duKTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnJvb3RFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBrZXlkb3duKSk7XG5cbiAgICBjb25zdCBwYXN0ZSA9IChldmVudDogQ2xpcGJvYXJkRXZlbnQpOiB2b2lkID0+IHsgdm9pZCB0aGlzLmhhbmRsZVBhc3RlKGV2ZW50KTsgfTtcbiAgICB0aGlzLnJvb3RFbC5hZGRFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgcGFzdGUpO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcy5wdXNoKCgpID0+IHRoaXMucm9vdEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwYXN0ZVwiLCBwYXN0ZSkpO1xuXG4gICAgY29uc3Qgd2hlZWwgPSAoZXZlbnQ6IFdoZWVsRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IHdoZWVsVGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgICAgaWYgKHdoZWVsVGFyZ2V0LmNsb3Nlc3QoXCIubW1jLW5vZGUtdGFibGUtd3JhcCwgLm1tYy1jb2RlLWJsb2NrXCIpKSByZXR1cm47XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgcmVjdCA9IHRoaXMudmlld3BvcnRFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJYID0gZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCAtIHJlY3Qud2lkdGggLyAyO1xuICAgICAgY29uc3QgcG9pbnRlclkgPSBldmVudC5jbGllbnRZIC0gcmVjdC50b3AgLSByZWN0LmhlaWdodCAvIDI7XG4gICAgICBjb25zdCBvbGRab29tID0gdGhpcy56b29tO1xuICAgICAgY29uc3QgbmV4dFpvb20gPSB0aGlzLmNsYW1wWm9vbSh0aGlzLnpvb20gKiAoZXZlbnQuZGVsdGFZIDwgMCA/IDEuMSA6IDAuOSkpO1xuICAgICAgY29uc3Qgd29ybGRYID0gKHBvaW50ZXJYIC0gdGhpcy5wYW5YKSAvIG9sZFpvb207XG4gICAgICBjb25zdCB3b3JsZFkgPSAocG9pbnRlclkgLSB0aGlzLnBhblkpIC8gb2xkWm9vbTtcbiAgICAgIHRoaXMuem9vbSA9IG5leHRab29tO1xuICAgICAgdGhpcy5wYW5YID0gcG9pbnRlclggLSB3b3JsZFggKiBuZXh0Wm9vbTtcbiAgICAgIHRoaXMucGFuWSA9IHBvaW50ZXJZIC0gd29ybGRZICogbmV4dFpvb207XG4gICAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gICAgfTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHdoZWVsLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcy5wdXNoKCgpID0+IHRoaXMudmlld3BvcnRFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgd2hlZWwpKTtcblxuICAgIGNvbnN0IHBvaW50ZXJEb3duID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmICh0YXJnZXQuY2xvc2VzdChcIi5tbWMtbm9kZVwiKSkgcmV0dXJuO1xuICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCAmJiBldmVudC5idXR0b24gIT09IDEpIHJldHVybjtcbiAgICAgIHRoaXMucGFubmluZyA9IHRydWU7XG4gICAgICB0aGlzLnBhblN0YXJ0ID0geyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZLCBwYW5YOiB0aGlzLnBhblgsIHBhblk6IHRoaXMucGFuWSB9O1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnNldFBvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCk7XG4gICAgICB0aGlzLnZpZXdwb3J0RWwuYWRkQ2xhc3MoXCJpcy1wYW5uaW5nXCIpO1xuICAgICAgdGhpcy5zZWxlY3ROb2RlKG51bGwpO1xuICAgIH07XG4gICAgY29uc3QgcG9pbnRlck1vdmUgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCk6IHZvaWQgPT4ge1xuICAgICAgaWYgKCF0aGlzLnBhbm5pbmcpIHJldHVybjtcbiAgICAgIHRoaXMucGFuWCA9IHRoaXMucGFuU3RhcnQucGFuWCArIGV2ZW50LmNsaWVudFggLSB0aGlzLnBhblN0YXJ0Lng7XG4gICAgICB0aGlzLnBhblkgPSB0aGlzLnBhblN0YXJ0LnBhblkgKyBldmVudC5jbGllbnRZIC0gdGhpcy5wYW5TdGFydC55O1xuICAgICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICAgIH07XG4gICAgY29uc3QgcG9pbnRlclVwID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGlmICghdGhpcy5wYW5uaW5nKSByZXR1cm47XG4gICAgICB0aGlzLnBhbm5pbmcgPSBmYWxzZTtcbiAgICAgIGlmICh0aGlzLnZpZXdwb3J0RWwuaGFzUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKSkgdGhpcy52aWV3cG9ydEVsLnJlbGVhc2VQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUNsYXNzKFwiaXMtcGFubmluZ1wiKTtcbiAgICB9O1xuICAgIHRoaXMudmlld3BvcnRFbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgcG9pbnRlckRvd24pO1xuICAgIHRoaXMudmlld3BvcnRFbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcm1vdmVcIiwgcG9pbnRlck1vdmUpO1xuICAgIHRoaXMudmlld3BvcnRFbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIHBvaW50ZXJVcCk7XG4gICAgdGhpcy52aWV3cG9ydEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyY2FuY2VsXCIsIHBvaW50ZXJVcCk7XG4gICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzLnB1c2goKCkgPT4ge1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCBwb2ludGVyRG93bik7XG4gICAgICB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHBvaW50ZXJNb3ZlKTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIHBvaW50ZXJVcCk7XG4gICAgICB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJjYW5jZWxcIiwgcG9pbnRlclVwKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4gdGhpcy5hcHBseVRyYW5zZm9ybSgpKTtcbiAgICB0aGlzLnJlc2l6ZU9ic2VydmVyLm9ic2VydmUodGhpcy52aWV3cG9ydEVsKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJJbWFnZUxvYWRUaW1lcnMoKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCB0aW1lciBvZiB0aGlzLmltYWdlTG9hZFRpbWVycykgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgdGhpcy5pbWFnZUxvYWRUaW1lcnMuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkVG9vbGJhckJ1dHRvbihpY29uOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcsIGFjdGlvbjogKCkgPT4gdm9pZCk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgICBjb25zdCBidXR0b24gPSB0aGlzLnRvb2xiYXJFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjbGlja2FibGUtaWNvbiBtbWMtdG9vbGJhci1idXR0b25cIiwgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogbGFiZWwsIHRpdGxlOiBsYWJlbCB9IH0pO1xuICAgIHNldEljb24oYnV0dG9uLCBpY29uKTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGFjdGlvbigpO1xuICAgICAgdGhpcy5mb2N1cygpO1xuICAgIH0pO1xuICAgIHJldHVybiBidXR0b247XG4gIH1cblxuICBwcml2YXRlIGFkZFRvb2xiYXJTZXBhcmF0b3IoKTogdm9pZCB7XG4gICAgdGhpcy50b29sYmFyRWwuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtdG9vbGJhci1zZXBhcmF0b3JcIiB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QXBwZWFyYW5jZSgpOiBNaW5kTWFwQXBwZWFyYW5jZSB7XG4gICAgcmV0dXJuIG1lcmdlQXBwZWFyYW5jZSh0aGlzLm9wdGlvbnMuZGVmYXVsdEFwcGVhcmFuY2UsIHRoaXMuZG9jdW1lbnQuYXBwZWFyYW5jZSk7XG4gIH1cblxuICBwcml2YXRlIGZvbnRGYW1pbHlDc3MoYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UpOiBzdHJpbmcge1xuICAgIGlmIChhcHBlYXJhbmNlLmZvbnRGYW1pbHkgPT09IFwic2VyaWZcIikgcmV0dXJuICdHZW9yZ2lhLCBcIlRpbWVzIE5ldyBSb21hblwiLCBzZXJpZic7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJtb25vXCIpIHJldHVybiAnXCJTRk1vbm8tUmVndWxhclwiLCBDb25zb2xhcywgXCJMaWJlcmF0aW9uIE1vbm9cIiwgbW9ub3NwYWNlJztcbiAgICBpZiAoYXBwZWFyYW5jZS5mb250RmFtaWx5ID09PSBcImN1c3RvbVwiICYmIGFwcGVhcmFuY2UuY3VzdG9tRm9udD8udHJpbSgpKSByZXR1cm4gYFwiJHthcHBlYXJhbmNlLmN1c3RvbUZvbnQudHJpbSgpLnJlcGxhY2VBbGwoJ1wiJywgJycpfVwiLCBzYW5zLXNlcmlmYDtcbiAgICBpZiAoYXBwZWFyYW5jZS5mb250RmFtaWx5ID09PSBcInNhbnNcIikgcmV0dXJuICdJbnRlciwgLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIlNlZ29lIFVJXCIsIHNhbnMtc2VyaWYnO1xuICAgIHJldHVybiBcInZhcigtLWZvbnQtaW50ZXJmYWNlKVwiO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUFwcGVhcmFuY2UoYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UpOiB2b2lkIHtcbiAgICBjb25zdCBzZXRPclJlbW92ZSA9IChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQpOiB2b2lkID0+IHtcbiAgICAgIGlmICh2YWx1ZSkgdGhpcy5yb290RWwuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgdmFsdWUpO1xuICAgICAgZWxzZSB0aGlzLnJvb3RFbC5zdHlsZS5yZW1vdmVQcm9wZXJ0eShuYW1lKTtcbiAgICB9O1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtY2FudmFzXCIsIGFwcGVhcmFuY2UuYmFja2dyb3VuZENvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLXBhdHRlcm4tY29sb3JcIiwgYXBwZWFyYW5jZS5wYXR0ZXJuQ29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtZWRnZVwiLCBhcHBlYXJhbmNlLmVkZ2VDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1ub2RlLWJnXCIsIGFwcGVhcmFuY2Uubm9kZUNvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLW5vZGUtdGV4dFwiLCBhcHBlYXJhbmNlLnRleHRDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1ub2RlLWJvcmRlclwiLCBhcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvcik7XG4gICAgdGhpcy5yb290RWwuc3R5bGUuc2V0UHJvcGVydHkoXCItLW1tYy1mb250LWZhbWlseVwiLCB0aGlzLmZvbnRGYW1pbHlDc3MoYXBwZWFyYW5jZSkpO1xuICAgIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KFwiLS1tbWMtZWRnZS13aWR0aFwiLCBgJHthcHBlYXJhbmNlLmVkZ2VXaWR0aCA/PyAyLjJ9cHhgKTtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLW5vZGUtYm9yZGVyLXdpZHRoXCIsIGAke2FwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IDF9cHhgKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwudG9nZ2xlQ2xhc3MoXCJwYXR0ZXJuLWdyaWRcIiwgYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJncmlkXCIpO1xuICAgIHRoaXMudmlld3BvcnRFbC50b2dnbGVDbGFzcyhcInBhdHRlcm4tZG90c1wiLCBhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID09PSBcImRvdHNcIik7XG4gICAgdGhpcy52aWV3cG9ydEVsLnRvZ2dsZUNsYXNzKFwicGF0dGVybi1ub25lXCIsICFhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuIHx8IGFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwibm9uZVwiKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTmF2aWdhdGlvbigpOiB2b2lkIHtcbiAgICB0aGlzLm5hdmlnYXRpb25CYXJFbC5lbXB0eSgpO1xuICAgIGNvbnN0IG5hdmlnYXRpb24gPSB0aGlzLmRvY3VtZW50Lm5hdmlnYXRpb247XG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFyRWwudG9nZ2xlQ2xhc3MoXCJpcy1oaWRkZW5cIiwgIW5hdmlnYXRpb24/LnBhcmVudFBhdGgpO1xuICAgIGlmICghbmF2aWdhdGlvbj8ucGFyZW50UGF0aCkgcmV0dXJuO1xuXG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5uYXZpZ2F0aW9uQmFyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvbi1idXR0b25cIixcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgdHlwZTogXCJidXR0b25cIixcbiAgICAgICAgdGl0bGU6IGBcdThGRDRcdTU2REVcdTcyMzZcdTVCRkNcdTU2RkVcdUZGMUEke25hdmlnYXRpb24ucGFyZW50UGF0aH1gXG4gICAgICB9XG4gICAgfSk7XG4gICAgc2V0SWNvbihidXR0b24sIFwiYXJyb3ctbGVmdFwiKTtcbiAgICBjb25zdCBsYWJlbHMgPSBidXR0b24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvbi1sYWJlbHNcIiB9KTtcbiAgICBsYWJlbHMuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvbi10aXRsZVwiLCB0ZXh0OiBgXHU4RkQ0XHU1NkRFXHU3MjM2XHU1QkZDXHU1NkZFXHVGRjFBJHtuYXZpZ2F0aW9uLnBhcmVudFRpdGxlID8/IG5hdmlnYXRpb24ucGFyZW50UGF0aC5zcGxpdChcIi9cIikuYXQoLTEpPy5yZXBsYWNlKC9cXC5taW5kbWFwJC9pLCBcIlwiKSA/PyBcIlx1NzIzNlx1NUJGQ1x1NTZGRVwifWAgfSk7XG4gICAgaWYgKG5hdmlnYXRpb24ucGFyZW50Tm9kZVRleHQpIGxhYmVscy5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uLW5vZGVcIiwgdGV4dDogYFx1Njc2NVx1NkU5MFx1ODI4Mlx1NzBCOVx1RkYxQSR7bmF2aWdhdGlvbi5wYXJlbnROb2RlVGV4dH1gIH0pO1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdm9pZCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5NaW5kTWFwKG5hdmlnYXRpb24ucGFyZW50UGF0aCwgbmF2aWdhdGlvbi5wYXJlbnROb2RlSWQpKTtcbiAgICB0aGlzLm5hdmlnYXRpb25CYXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uLXBhdGhcIiwgdGV4dDogbmF2aWdhdGlvbi5wYXJlbnRQYXRoIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKTogdm9pZCB7XG4gICAgdGhpcy5jbGVhckltYWdlTG9hZFRpbWVycygpO1xuICAgIHRoaXMucmVuZGVyTmF2aWdhdGlvbigpO1xuICAgIGNvbnN0IGFwcGVhcmFuY2UgPSB0aGlzLmdldEFwcGVhcmFuY2UoKTtcbiAgICB0aGlzLmFwcGx5QXBwZWFyYW5jZShhcHBlYXJhbmNlKTtcbiAgICB0aGlzLmxheW91dCA9IGNvbXB1dGVMYXlvdXQodGhpcy5kb2N1bWVudC5yb290LCB0aGlzLmRvY3VtZW50LmxheW91dCwgYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNCk7XG4gICAgdGhpcy5ub2Rlc0xheWVyRWwuZW1wdHkoKTtcbiAgICB3aGlsZSAodGhpcy5lZGdlc1N2Zy5maXJzdENoaWxkKSB0aGlzLmVkZ2VzU3ZnLnJlbW92ZUNoaWxkKHRoaXMuZWRnZXNTdmcuZmlyc3RDaGlsZCk7XG5cbiAgICBmb3IgKGNvbnN0IHBvc2l0aW9uIG9mIHRoaXMubGF5b3V0Lm5vZGVzKSB7XG4gICAgICBpZiAoIXBvc2l0aW9uLnBhcmVudElkKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubGF5b3V0LmJ5SWQuZ2V0KHBvc2l0aW9uLnBhcmVudElkKTtcbiAgICAgIGlmICghcGFyZW50KSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInBhdGhcIik7XG4gICAgICBwYXRoLnNldEF0dHJpYnV0ZShcImRcIiwgZWRnZVBhdGgocGFyZW50LCBwb3NpdGlvbiwgYXBwZWFyYW5jZS5lZGdlU3R5bGUgPz8gXCJjdXJ2ZWRcIikpO1xuICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBgbW1jLWVkZ2UgZGVwdGgtJHtNYXRoLm1pbihwb3NpdGlvbi5kZXB0aCwgNil9YCk7XG4gICAgICBpZiAocG9zaXRpb24ubm9kZS5zdHlsZT8uY29sb3IpIHBhdGguc3R5bGUuc3Ryb2tlID0gcG9zaXRpb24ubm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIHRoaXMuZWRnZXNTdmcuYXBwZW5kQ2hpbGQocGF0aCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwb3NpdGlvbiBvZiB0aGlzLmxheW91dC5ub2Rlcykge1xuICAgICAgY29uc3Qgbm9kZSA9IHBvc2l0aW9uLm5vZGU7XG4gICAgICBjb25zdCBzaGFwZSA9IG5vZGUuc3R5bGU/LnNoYXBlID8/IHRoaXMub3B0aW9ucy5kZWZhdWx0Tm9kZVNoYXBlO1xuICAgICAgY29uc3QgY2xhc3NlcyA9IFtcIm1tYy1ub2RlXCIsIHBvc2l0aW9uLmRlcHRoID09PSAwID8gXCJpcy1yb290XCIgOiBcIlwiLCBgc2hhcGUtJHtzaGFwZX1gXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIiBcIik7XG4gICAgICBjb25zdCBub2RlRWwgPSB0aGlzLm5vZGVzTGF5ZXJFbC5jcmVhdGVEaXYoeyBjbHM6IGNsYXNzZXMgfSk7XG4gICAgICBub2RlRWwuZGF0YXNldC5ub2RlSWQgPSBub2RlLmlkO1xuICAgICAgbm9kZUVsLnN0eWxlLmxlZnQgPSBgJHtwb3NpdGlvbi54fXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS50b3AgPSBgJHtwb3NpdGlvbi55fXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS53aWR0aCA9IGAke3Bvc2l0aW9uLndpZHRofXB4YDtcbiAgICAgIG5vZGVFbC5zdHlsZS5taW5IZWlnaHQgPSBgJHtwb3NpdGlvbi5oZWlnaHR9cHhgO1xuICAgICAgbm9kZUVsLmRyYWdnYWJsZSA9IHBvc2l0aW9uLmRlcHRoID4gMDtcbiAgICAgIGlmICh0aGlzLnNlbGVjdGVkSWQgPT09IG5vZGUuaWQpIG5vZGVFbC5hZGRDbGFzcyhcImlzLXNlbGVjdGVkXCIpO1xuICAgICAgaWYgKHRoaXMuc2VhcmNoUXVlcnkgJiYgbm9kZVNlYXJjaFRleHQobm9kZSkuaW5jbHVkZXModGhpcy5zZWFyY2hRdWVyeSkpIG5vZGVFbC5hZGRDbGFzcyhcImlzLXNlYXJjaC1tYXRjaFwiKTtcbiAgICAgIGlmIChub2RlLnRhc2spIG5vZGVFbC5hZGRDbGFzcyhgdGFzay0ke25vZGUudGFza31gKTtcbiAgICAgIGNvbnN0IGlzUm9vdCA9IHBvc2l0aW9uLmRlcHRoID09PSAwO1xuICAgICAgY29uc3QgYm9sZCA9IG5vZGUuc3R5bGU/LmJvbGQgPz8gYXBwZWFyYW5jZS5ib2xkID8/IGZhbHNlO1xuICAgICAgY29uc3QgaXRhbGljID0gbm9kZS5zdHlsZT8uaXRhbGljID8/IGFwcGVhcmFuY2UuaXRhbGljID8/IGZhbHNlO1xuICAgICAgY29uc3QgdW5kZXJsaW5lID0gbm9kZS5zdHlsZT8udW5kZXJsaW5lID8/IGFwcGVhcmFuY2UudW5kZXJsaW5lID8/IGZhbHNlO1xuICAgICAgaWYgKGJvbGQpIG5vZGVFbC5hZGRDbGFzcyhcImlzLWJvbGRcIik7XG4gICAgICBpZiAoaXRhbGljKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1pdGFsaWNcIik7XG4gICAgICBpZiAodW5kZXJsaW5lKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy11bmRlcmxpbmVkXCIpO1xuICAgICAgaWYgKG5vZGUubm90ZSkgbm9kZUVsLnNldEF0dHIoXCJ0aXRsZVwiLCBub2RlLm5vdGUpO1xuICAgICAgaWYgKG5vZGUuc3R5bGU/LmNvbG9yKSBub2RlRWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gbm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIGVsc2UgaWYgKCFpc1Jvb3QgJiYgYXBwZWFyYW5jZS5ub2RlQ29sb3IpIG5vZGVFbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBhcHBlYXJhbmNlLm5vZGVDb2xvcjtcbiAgICAgIGlmIChub2RlLnN0eWxlPy50ZXh0Q29sb3IpIG5vZGVFbC5zdHlsZS5jb2xvciA9IG5vZGUuc3R5bGUudGV4dENvbG9yO1xuICAgICAgZWxzZSBpZiAoIWlzUm9vdCAmJiBhcHBlYXJhbmNlLnRleHRDb2xvcikgbm9kZUVsLnN0eWxlLmNvbG9yID0gYXBwZWFyYW5jZS50ZXh0Q29sb3I7XG4gICAgICBpZiAobm9kZS5zdHlsZT8uYm9yZGVyQ29sb3IpIG5vZGVFbC5zdHlsZS5ib3JkZXJDb2xvciA9IG5vZGUuc3R5bGUuYm9yZGVyQ29sb3I7XG4gICAgICBlbHNlIGlmICghaXNSb290ICYmIGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yKSBub2RlRWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBhcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvcjtcbiAgICAgIG5vZGVFbC5zdHlsZS5ib3JkZXJXaWR0aCA9IGAke25vZGUuc3R5bGU/LmJvcmRlcldpZHRoID8/IGFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IChpc1Jvb3QgPyAyIDogMSl9cHhgO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gbm9kZUVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1jb250ZW50XCIgfSk7XG4gICAgICBjb25zdCBibG9ja3MgPSBub2RlQ29udGVudEJsb2Nrcyhub2RlKTtcbiAgICAgIGNvbnN0IGhhc1RleHRCbG9jayA9IGJsb2Nrcy5zb21lKChibG9jaykgPT4gYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIgJiYgYmxvY2sudGV4dC50cmltKCkpO1xuICAgICAgaWYgKChub2RlLnRhc2sgfHwgbm9kZS5pY29uKSAmJiAhaGFzVGV4dEJsb2NrKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1tYWluIG1tYy1ub2RlLW1ldGEtb25seVwiIH0pO1xuICAgICAgICBpZiAobm9kZS50YXNrKSB7XG4gICAgICAgICAgY29uc3QgdGFzayA9IG1ldGEuY3JlYXRlU3Bhbih7IGNsczogYG1tYy10YXNrLWljb24gdGFzay0ke25vZGUudGFza31gLCB0ZXh0OiBub2RlLnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTI3MTNcIiA6IG5vZGUudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdTI1RDBcIiA6IFwiXHUyNUNCXCIgfSk7XG4gICAgICAgICAgdGFzay5zZXRBdHRyKFwiYXJpYS1sYWJlbFwiLCBub2RlLnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTVERjJcdTVCOENcdTYyMTBcIiA6IG5vZGUudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdThGREJcdTg4NENcdTRFMkRcIiA6IFwiXHU1Rjg1XHU1MjlFXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLmljb24pIG1ldGEuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtbm9kZS1pY29uXCIsIHRleHQ6IG5vZGUuaWNvbiB9KTtcbiAgICAgIH1cbiAgICAgIGxldCBwcmVmaXhSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgICAgaWYgKGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikge1xuICAgICAgICAgIGNvbnN0IHdyYXAgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1pbWFnZS1ibG9ja1wiIH0pO1xuICAgICAgICAgIGNvbnN0IGltYWdlID0gd3JhcC5jcmVhdGVFbChcImltZ1wiLCB7IGNsczogXCJtbWMtbm9kZS1pbWFnZSBpcy1sb2FkaW5nXCIsIGF0dHI6IHsgYWx0OiBibG9jay5hbHQgPz8gKG5vZGVQbGFpblRleHQobm9kZSkgfHwgXCJcdTU2RkVcdTcyNDdcIikgfSB9KTtcbiAgICAgICAgICBjb25zdCBjYW5kaWRhdGVzID0gdGhpcy5vcHRpb25zLmltYWdlRmFpbG92ZXJFbmFibGVkXG4gICAgICAgICAgICA/IGltYWdlU291cmNlQ2FuZGlkYXRlcyhibG9jaywgdGhpcy5vcHRpb25zLmltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrKVxuICAgICAgICAgICAgOiBpbWFnZVNvdXJjZUNhbmRpZGF0ZXMoYmxvY2ssIGZhbHNlKS5zbGljZSgwLCAxKTtcbiAgICAgICAgICBsZXQgYWN0aXZlUmVzb2x2ZWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgICAgIGxldCBhdHRlbXB0VG9rZW4gPSAwO1xuICAgICAgICAgIGxldCBhdHRlbXB0VGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgICAgICAgIGNvbnN0IGNsZWFyQXR0ZW1wdFRpbWVyID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKGF0dGVtcHRUaW1lciA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChhdHRlbXB0VGltZXIpO1xuICAgICAgICAgICAgdGhpcy5pbWFnZUxvYWRUaW1lcnMuZGVsZXRlKGF0dGVtcHRUaW1lcik7XG4gICAgICAgICAgICBhdHRlbXB0VGltZXIgPSBudWxsO1xuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3QgbWFya1JlbW90ZUZhaWx1cmUgPSAoc291cmNlOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlbW90ZSA9IGJsb2NrLnJlbW90ZVNvdXJjZXM/LmZpbmQoKGl0ZW0pID0+IGl0ZW0udXJsID09PSBzb3VyY2UpO1xuICAgICAgICAgICAgaWYgKCFyZW1vdGUpIHJldHVybjtcbiAgICAgICAgICAgIHJlbW90ZS5sYXN0RmFpbHVyZUF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICAgICAgcmVtb3RlLmZhaWx1cmVDb3VudCA9IE1hdGgubWluKDEwMDAwMDAsIChyZW1vdGUuZmFpbHVyZUNvdW50ID8/IDApICsgMSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBjb25zdCB0cnlDYW5kaWRhdGUgPSAoaW5kZXg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgY2xlYXJBdHRlbXB0VGltZXIoKTtcbiAgICAgICAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZXNbaW5kZXhdO1xuICAgICAgICAgICAgYXR0ZW1wdFRva2VuICs9IDE7XG4gICAgICAgICAgICBjb25zdCB0b2tlbiA9IGF0dGVtcHRUb2tlbjtcbiAgICAgICAgICAgIGlmICghY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICAgIGFjdGl2ZVJlc29sdmVkID0gbnVsbDtcbiAgICAgICAgICAgICAgaW1hZ2UucmVtb3ZlQXR0cmlidXRlKFwic3JjXCIpO1xuICAgICAgICAgICAgICBpbWFnZS5yZW1vdmVDbGFzcyhcImlzLWxvYWRpbmdcIik7XG4gICAgICAgICAgICAgIGltYWdlLmFkZENsYXNzKFwiaXMtdW5yZXNvbHZlZFwiKTtcbiAgICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cihcInRpdGxlXCIsIFwiXHU2MjQwXHU2NzA5XHU1NkZFXHU3MjQ3XHU5NTVDXHU1MENGXHU1NzQ3XHU0RTBEXHU1M0VGXHU3NTI4XCIpO1xuICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgICAgICAgICAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSB0aGlzLmNhbGxiYWNrcy5yZXNvbHZlSW1hZ2UoY2FuZGlkYXRlLnNvdXJjZSk7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVkKSB7XG4gICAgICAgICAgICAgIG1hcmtSZW1vdGVGYWlsdXJlKGNhbmRpZGF0ZS5zb3VyY2UpO1xuICAgICAgICAgICAgICB0cnlDYW5kaWRhdGUoaW5kZXggKyAxKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcHJvYmUgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGZhaWwgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgIGlmICh0b2tlbiAhPT0gYXR0ZW1wdFRva2VuKSByZXR1cm47XG4gICAgICAgICAgICAgIGNsZWFyQXR0ZW1wdFRpbWVyKCk7XG4gICAgICAgICAgICAgIG1hcmtSZW1vdGVGYWlsdXJlKGNhbmRpZGF0ZS5zb3VyY2UpO1xuICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmltYWdlRmFpbG92ZXJFbmFibGVkKSB0cnlDYW5kaWRhdGUoaW5kZXggKyAxKTtcbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1hZ2UucmVtb3ZlQ2xhc3MoXCJpcy1sb2FkaW5nXCIpO1xuICAgICAgICAgICAgICAgIGltYWdlLmFkZENsYXNzKFwiaXMtdW5yZXNvbHZlZFwiKTtcbiAgICAgICAgICAgICAgICBpbWFnZS5zZXRBdHRyKFwidGl0bGVcIiwgYFx1NTZGRVx1NzI0N1x1NTJBMFx1OEY3RFx1NTkzMVx1OEQyNVx1RkYxQSR7Y2FuZGlkYXRlLnNvdXJjZX1gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHByb2JlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRva2VuICE9PSBhdHRlbXB0VG9rZW4gfHwgcHJvYmUubmF0dXJhbFdpZHRoIDw9IDApIHJldHVybjtcbiAgICAgICAgICAgICAgY2xlYXJBdHRlbXB0VGltZXIoKTtcbiAgICAgICAgICAgICAgYWN0aXZlUmVzb2x2ZWQgPSByZXNvbHZlZDtcbiAgICAgICAgICAgICAgaW1hZ2Uuc3JjID0gcmVzb2x2ZWQ7XG4gICAgICAgICAgICAgIGltYWdlLnJlbW92ZUNsYXNzKFwiaXMtbG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgaW1hZ2UucmVtb3ZlQ2xhc3MoXCJpcy11bnJlc29sdmVkXCIpO1xuICAgICAgICAgICAgICBpbWFnZS5zZXRBdHRyKFwidGl0bGVcIiwgaW5kZXggPT09IDAgPyBcIlx1NzBCOVx1NTFGQlx1NjUzRVx1NTkyN1x1NTZGRVx1NzI0N1wiIDogYFx1NURGMlx1ODFFQVx1NTJBOFx1NTIwN1x1NjM2Mlx1NTIzMFx1RkYxQSR7Y2FuZGlkYXRlLmxhYmVsfWApO1xuICAgICAgICAgICAgICBjb25zdCBzd2l0Y2hlZCA9IGNhbmRpZGF0ZS5zb3VyY2UgIT09IGJsb2NrLnNvdXJjZTtcbiAgICAgICAgICAgICAgY29uc3QgcmVtb3RlID0gYmxvY2sucmVtb3RlU291cmNlcz8uZmluZCgoaXRlbSkgPT4gaXRlbS51cmwgPT09IGNhbmRpZGF0ZS5zb3VyY2UpO1xuICAgICAgICAgICAgICBpZiAocmVtb3RlKSByZW1vdGUubGFzdFN1Y2Nlc3NBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgICAgaWYgKCFzd2l0Y2hlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICBjb25zdCBwcmV2aW91cyA9IGJsb2NrLnJlbW90ZVNvdXJjZXM/LmZpbmQoKGl0ZW0pID0+IGl0ZW0udXJsID09PSBibG9jay5zb3VyY2UpO1xuICAgICAgICAgICAgICBibG9jay5zb3VyY2UgPSBjYW5kaWRhdGUuc291cmNlO1xuICAgICAgICAgICAgICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyhub2RlKTtcbiAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICAgICAgICAgICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzTGFiZWwgPSBwcmV2aW91cz8uaG9zdE5hbWUgfHwgXCJcdTVGNTNcdTUyNERcdTU2RkVcdTVFOEFcIjtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShgXHU1NkZFXHU3MjQ3XHU1NzMwXHU1NzQwXHU1OTMxXHU2NTQ4XHVGRjBDXHU1REYyXHU0RUNFICR7cHJldmlvdXNMYWJlbH0gXHU4MUVBXHU1MkE4XHU1MjA3XHU2MzYyXHU1MjMwICR7Y2FuZGlkYXRlLmxhYmVsfWAsIDYwMDApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHByb2JlLm9uZXJyb3IgPSBmYWlsO1xuICAgICAgICAgICAgY29uc3QgdGltZW91dE1zID0gTWF0aC5tYXgoMiwgTWF0aC5taW4oMzAsIHRoaXMub3B0aW9ucy5pbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHMpKSAqIDEwMDA7XG4gICAgICAgICAgICBhdHRlbXB0VGltZXIgPSB3aW5kb3cuc2V0VGltZW91dChmYWlsLCB0aW1lb3V0TXMpO1xuICAgICAgICAgICAgdGhpcy5pbWFnZUxvYWRUaW1lcnMuYWRkKGF0dGVtcHRUaW1lcik7XG4gICAgICAgICAgICBwcm9iZS5zcmMgPSByZXNvbHZlZDtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgaWYgKGFjdGl2ZVJlc29sdmVkKSBuZXcgSW1hZ2VQcmV2aWV3TW9kYWwodGhpcy5hcHAsIGFjdGl2ZVJlc29sdmVkLCBibG9jay5hbHQgPz8gXCJcdTU2RkVcdTcyNDdcdTk4ODRcdTg5QzhcIikub3BlbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRyeUNhbmRpZGF0ZSgwKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWJsb2NrLnRleHQudHJpbSgpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgbWFpbiA9IGNvbnRlbnQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2RlLW1haW4gbW1jLW5vZGUtdGV4dC1ibG9ja1wiIH0pO1xuICAgICAgICBpZiAoIXByZWZpeFJlbmRlcmVkICYmIG5vZGUudGFzaykge1xuICAgICAgICAgIGNvbnN0IHRhc2sgPSBtYWluLmNyZWF0ZVNwYW4oeyBjbHM6IGBtbWMtdGFzay1pY29uIHRhc2stJHtub2RlLnRhc2t9YCwgdGV4dDogbm9kZS50YXNrID09PSBcImRvbmVcIiA/IFwiXHUyNzEzXCIgOiBub2RlLnRhc2sgPT09IFwiZG9pbmdcIiA/IFwiXHUyNUQwXCIgOiBcIlx1MjVDQlwiIH0pO1xuICAgICAgICAgIHRhc2suc2V0QXR0cihcImFyaWEtbGFiZWxcIiwgbm9kZS50YXNrID09PSBcImRvbmVcIiA/IFwiXHU1REYyXHU1QjhDXHU2MjEwXCIgOiBub2RlLnRhc2sgPT09IFwiZG9pbmdcIiA/IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIgOiBcIlx1NUY4NVx1NTI5RVwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXByZWZpeFJlbmRlcmVkICYmIG5vZGUuaWNvbikgbWFpbi5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy1ub2RlLWljb25cIiwgdGV4dDogbm9kZS5pY29uIH0pO1xuICAgICAgICBwcmVmaXhSZW5kZXJlZCA9IHRydWU7XG4gICAgICAgIGNvbnN0IHRleHRFbCA9IG1haW4uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2RlLXRleHRcIiB9KTtcbiAgICAgICAgcmVuZGVyUmljaFRleHRSdW5zKHRleHRFbCwgYmxvY2sucmljaFRleHQsIGJsb2NrLnRleHQpO1xuICAgICAgICB0ZXh0RWwuc3R5bGUuZm9udFNpemUgPSBgJHtub2RlLnN0eWxlPy5mb250U2l6ZSA/PyBhcHBlYXJhbmNlLmZvbnRTaXplID8/IDE0fXB4YDtcbiAgICAgICAgdGV4dEVsLnNldEF0dHIoXCJhcmlhLWxhYmVsXCIsIGJsb2NrLnRleHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAobm9kZS5zdWJtYXApIHtcbiAgICAgICAgY29uc3Qgc3VibWFwQnV0dG9uID0gY29udGVudC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbWMtc3VibWFwLWNhcmRcIiwgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogYFx1OEZEQlx1NTE2NVx1NUI1MFx1NUJGQ1x1NTZGRSAke25vZGUuc3VibWFwLnRpdGxlID8/IG5vZGUuc3VibWFwLnBhdGh9YCB9IH0pO1xuICAgICAgICBzZXRJY29uKHN1Ym1hcEJ1dHRvbiwgXCJuZXR3b3JrXCIpO1xuICAgICAgICBzdWJtYXBCdXR0b24uY3JlYXRlU3Bhbih7IHRleHQ6IG5vZGUuc3VibWFwLnRpdGxlID8/IG5vZGUuc3VibWFwLnBhdGguc3BsaXQoXCIvXCIpLmF0KC0xKT8ucmVwbGFjZSgvXFwubWluZG1hcCQvaSwgXCJcIikgPz8gXCJcdTVCNTBcdTVCRkNcdTU2RkVcIiB9KTtcbiAgICAgICAgc3VibWFwQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICB2b2lkIHRoaXMuY2FsbGJhY2tzLm9uT3Blbk1pbmRNYXAobm9kZS5zdWJtYXAhLnBhdGgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUudGFibGUpIHRoaXMucmVuZGVyTm9kZVRhYmxlKGNvbnRlbnQsIG5vZGUpO1xuICAgICAgaWYgKG5vZGUuY29kZSkgdGhpcy5yZW5kZXJOb2RlQ29kZShjb250ZW50LCBub2RlKTtcblxuICAgICAgaWYgKG5vZGUudGFncz8ubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS10YWdzXCIgfSk7XG4gICAgICAgIG5vZGUudGFncy5zbGljZSgwLCA0KS5mb3JFYWNoKCh0YWcpID0+IHRhZ3MuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtbm9kZS10YWdcIiwgdGV4dDogYCMke3RhZ31gIH0pKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93VGFza1Byb2dyZXNzICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHByb2dyZXNzID0gZ2V0VGFza1Byb2dyZXNzKG5vZGUpO1xuICAgICAgICBpZiAocHJvZ3Jlc3MudG90YWwpIHtcbiAgICAgICAgICBjb25zdCBwZXJjZW50ID0gTWF0aC5yb3VuZCgocHJvZ3Jlc3MuZG9uZSAvIHByb2dyZXNzLnRvdGFsKSAqIDEwMCk7XG4gICAgICAgICAgY29uc3QgcHJvZ3Jlc3NFbCA9IG5vZGVFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXRhc2stcHJvZ3Jlc3NcIiwgYXR0cjogeyB0aXRsZTogYCR7cHJvZ3Jlc3MuZG9uZX0vJHtwcm9ncmVzcy50b3RhbH0gXHU0RTJBXHU0RUZCXHU1MkExXHU1REYyXHU1QjhDXHU2MjEwYCB9IH0pO1xuICAgICAgICAgIHByb2dyZXNzRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YXNrLXByb2dyZXNzLWJhclwiLCBhdHRyOiB7IHN0eWxlOiBgd2lkdGg6JHtwZXJjZW50fSVgIH0gfSk7XG4gICAgICAgICAgcHJvZ3Jlc3NFbC5jcmVhdGVTcGFuKHsgdGV4dDogYCR7cGVyY2VudH0lYCB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobm9kZS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgZm9sZCA9IG5vZGVFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbWMtZm9sZC1idXR0b25cIiwgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogbm9kZS5jb2xsYXBzZWQgPyBcIlx1NUM1NVx1NUYwMFwiIDogXCJcdTY1MzZcdThENzdcIiB9IH0pO1xuICAgICAgICBmb2xkLnNldFRleHQobm9kZS5jb2xsYXBzZWQgPyBgKyR7bm9kZS5jaGlsZHJlbi5sZW5ndGh9YCA6IFwiXHUyMjEyXCIpO1xuICAgICAgICBmb2xkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgICAgdGhpcy50b2dnbGVDb2xsYXBzZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGluayA9IHRoaXMuZ2V0Tm9kZUxpbmsobm9kZSk7XG4gICAgICBpZiAobGluaykge1xuICAgICAgICBjb25zdCBsaW5rQnV0dG9uID0gbm9kZUVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1tYy1ub2RlLWxpbmtcIiwgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogYFx1NjI1M1x1NUYwMCAke2xpbmt9YCB9IH0pO1xuICAgICAgICBzZXRJY29uKGxpbmtCdXR0b24sIFwiZXh0ZXJuYWwtbGlua1wiKTtcbiAgICAgICAgbGlua0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdm9pZCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5MaW5rKGxpbmspO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuc2VsZWN0Tm9kZShub2RlLmlkKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuc2VsZWN0Tm9kZShub2RlLmlkKTtcbiAgICAgICAgdGhpcy5lZGl0U2VsZWN0ZWQoKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuc2VsZWN0Tm9kZShub2RlLmlkKTtcbiAgICAgICAgdGhpcy5vcGVuQ29udGV4dE1lbnUoZXZlbnQpO1xuICAgICAgfSk7XG4gICAgICBub2RlRWwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5kcmFnZ2luZ0lkID0gbm9kZS5pZDtcbiAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyPy5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBub2RlLmlkKTtcbiAgICAgICAgaWYgKGV2ZW50LmRhdGFUcmFuc2ZlcikgZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcbiAgICAgICAgbm9kZUVsLmFkZENsYXNzKFwiaXMtZHJhZ2dpbmdcIik7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5jYW5SZXBhcmVudCh0aGlzLmRyYWdnaW5nSWQsIG5vZGUuaWQpKSByZXR1cm47XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJtb3ZlXCI7XG4gICAgICAgIG5vZGVFbC5hZGRDbGFzcyhcImlzLWRyb3AtdGFyZ2V0XCIpO1xuICAgICAgfSk7XG4gICAgICBub2RlRWwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdsZWF2ZVwiLCAoKSA9PiBub2RlRWwucmVtb3ZlQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKSk7XG4gICAgICBub2RlRWwuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIG5vZGVFbC5yZW1vdmVDbGFzcyhcImlzLWRyb3AtdGFyZ2V0XCIpO1xuICAgICAgICBjb25zdCBkcmFnZ2VkSWQgPSB0aGlzLmRyYWdnaW5nSWQgPz8gZXZlbnQuZGF0YVRyYW5zZmVyPy5nZXREYXRhKFwidGV4dC9wbGFpblwiKSA/PyBudWxsO1xuICAgICAgICBpZiAoZHJhZ2dlZElkKSB0aGlzLnJlcGFyZW50Tm9kZShkcmFnZ2VkSWQsIG5vZGUuaWQpO1xuICAgICAgfSk7XG4gICAgICBub2RlRWwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmRyYWdnaW5nSWQgPSBudWxsO1xuICAgICAgICB0aGlzLm5vZGVzTGF5ZXJFbC5xdWVyeVNlbGVjdG9yQWxsKFwiLmlzLWRyYWdnaW5nLCAuaXMtZHJvcC10YXJnZXRcIikuZm9yRWFjaCgoZWxlbWVudCkgPT4gZWxlbWVudC5yZW1vdmVDbGFzc2VzKFtcImlzLWRyYWdnaW5nXCIsIFwiaXMtZHJvcC10YXJnZXRcIl0pKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5VHJhbnNmb3JtKCk6IHZvaWQge1xuICAgIGNvbnN0IHJlY3QgPSB0aGlzLnZpZXdwb3J0RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdGhpcy5zY2VuZUVsLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHtyZWN0LndpZHRoIC8gMiArIHRoaXMucGFuWH1weCwgJHtyZWN0LmhlaWdodCAvIDIgKyB0aGlzLnBhbll9cHgpIHNjYWxlKCR7dGhpcy56b29tfSlgO1xuICAgIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KFwiLS1tbWMtem9vbVwiLCBTdHJpbmcodGhpcy56b29tKSk7XG4gICAgdGhpcy56b29tU3RhdHVzRWw/LnNldFRleHQoYCR7TWF0aC5yb3VuZCh0aGlzLnpvb20gKiAxMDApfSVgKTtcbiAgfVxuXG4gIHByaXZhdGUgc2VsZWN0Tm9kZShpZDogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGlkID8/IFwiXCI7XG4gICAgdGhpcy5ub2Rlc0xheWVyRWwucXVlcnlTZWxlY3RvckFsbChcIi5tbWMtbm9kZS5pcy1zZWxlY3RlZFwiKS5mb3JFYWNoKChlbGVtZW50KSA9PiBlbGVtZW50LnJlbW92ZUNsYXNzKFwiaXMtc2VsZWN0ZWRcIikpO1xuICAgIGlmIChpZCkgdGhpcy5ub2Rlc0xheWVyRWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oYC5tbWMtbm9kZVtkYXRhLW5vZGUtaWQ9XCIke0NTUy5lc2NhcGUoaWQpfVwiXWApPy5hZGRDbGFzcyhcImlzLXNlbGVjdGVkXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZWxlY3RlZE5vZGUoKTogTWluZE1hcE5vZGUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3RlZElkID8gZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCB0aGlzLnNlbGVjdGVkSWQpIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29uZmlndXJlZE5vZGUodGV4dCA9IFwiXHU2NUIwXHU4MjgyXHU3MEI5XCIpOiBNaW5kTWFwTm9kZSB7XG4gICAgY29uc3Qgbm9kZSA9IGNyZWF0ZU5vZGUodGV4dCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWZhdWx0Tm9kZVNoYXBlICE9PSBcInJvdW5kZWRcIikgbm9kZS5zdHlsZSA9IHsgc2hhcGU6IHRoaXMub3B0aW9ucy5kZWZhdWx0Tm9kZVNoYXBlIH07XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBwcml2YXRlIGFkZENoaWxkKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuY3JlYXRlQ29uZmlndXJlZE5vZGUoKTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICBzZWxlY3RlZC5jb2xsYXBzZWQgPSBmYWxzZTtcbiAgICAgIHNlbGVjdGVkLmNoaWxkcmVuLnB1c2gobm9kZSk7XG4gICAgICB0aGlzLnNlbGVjdGVkSWQgPSBub2RlLmlkO1xuICAgIH0pO1xuICAgIHRoaXMuZWRpdFNlbGVjdGVkKCk7XG4gIH1cblxuICBwcml2YXRlIGFkZFNpYmxpbmcoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQgfHwgc2VsZWN0ZWQuaWQgPT09IHRoaXMuZG9jdW1lbnQucm9vdC5pZCkge1xuICAgICAgdGhpcy5hZGRDaGlsZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnQgPSBmaW5kUGFyZW50KHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgIGlmICghcGFyZW50KSByZXR1cm47XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuY3JlYXRlQ29uZmlndXJlZE5vZGUoKTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHBhcmVudC5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkKSA9PiBjaGlsZC5pZCA9PT0gc2VsZWN0ZWQuaWQpO1xuICAgICAgcGFyZW50LmNoaWxkcmVuLnNwbGljZShpbmRleCArIDEsIDAsIG5vZGUpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gbm9kZS5pZDtcbiAgICB9KTtcbiAgICB0aGlzLmVkaXRTZWxlY3RlZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBlZGl0U2VsZWN0ZWQoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICBsZXQgaGlzdG9yeUNhcHR1cmVkID0gZmFsc2U7XG4gICAgbmV3IE5vZGVFZGl0TW9kYWwodGhpcy5hcHAsIHNlbGVjdGVkLCB0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSwge1xuICAgICAgcmVzb2x2ZUltYWdlOiB0aGlzLmNhbGxiYWNrcy5yZXNvbHZlSW1hZ2UsXG4gICAgICBvblNhdmVQYXN0ZWRJbWFnZTogdGhpcy5jYWxsYmFja3Mub25TYXZlUGFzdGVkSW1hZ2UsXG4gICAgICBnZXRJbWFnZUhvc3RzOiB0aGlzLmNhbGxiYWNrcy5nZXRJbWFnZUhvc3RzLFxuICAgICAgZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHM6IHRoaXMuY2FsbGJhY2tzLmdldERlZmF1bHRVcGxvYWRIb3N0SWRzLFxuICAgICAgb25VcGxvYWRJbWFnZTogdGhpcy5jYWxsYmFja3Mub25VcGxvYWRJbWFnZSxcbiAgICAgIG9uUmVhZEltYWdlU291cmNlOiB0aGlzLmNhbGxiYWNrcy5vblJlYWRJbWFnZVNvdXJjZVxuICAgIH0sICh2YWx1ZXMpID0+IHtcbiAgICAgIC8vIEEgY29udGludW91c2x5IG9wZW4gZWRpdG9yIG1heSBhdXRvc2F2ZSBtYW55IHRpbWVzLiBDYXB0dXJlIG9uZSB1bmRvXG4gICAgICAvLyBzbmFwc2hvdCBmb3IgdGhlIHdob2xlIGVkaXRpbmcgc2Vzc2lvbiBpbnN0ZWFkIG9mIG9uZSBzbmFwc2hvdCBwZXIga2V5cHJlc3MuXG4gICAgICBpZiAoIWhpc3RvcnlDYXB0dXJlZCkge1xuICAgICAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgICAgIHRoaXMudHJpbUhpc3RvcnkoKTtcbiAgICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICAgICAgaGlzdG9yeUNhcHR1cmVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNlbGVjdGVkLmNvbnRlbnQgPSB2YWx1ZXMuY29udGVudDtcbiAgICAgIHN5bmNOb2RlTGVnYWN5RmllbGRzKHNlbGVjdGVkKTtcbiAgICAgIHNlbGVjdGVkLm5vdGUgPSB2YWx1ZXMubm90ZSB8fCB1bmRlZmluZWQ7XG4gICAgICBzZWxlY3RlZC5saW5rID0gdmFsdWVzLmxpbmsgfHwgdW5kZWZpbmVkO1xuICAgICAgc2VsZWN0ZWQuaWNvbiA9IHZhbHVlcy5pY29uIHx8IHVuZGVmaW5lZDtcbiAgICAgIHNlbGVjdGVkLnRhZ3MgPSB2YWx1ZXMudGFncy5sZW5ndGggPyB2YWx1ZXMudGFncyA6IHVuZGVmaW5lZDtcbiAgICAgIHNlbGVjdGVkLnRhc2sgPSB2YWx1ZXMudGFzaztcbiAgICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgICBjb2xvcjogdmFsdWVzLmNvbG9yLFxuICAgICAgICB0ZXh0Q29sb3I6IHZhbHVlcy50ZXh0Q29sb3IsXG4gICAgICAgIGJvcmRlckNvbG9yOiB2YWx1ZXMuYm9yZGVyQ29sb3IsXG4gICAgICAgIGJvcmRlcldpZHRoOiB2YWx1ZXMuYm9yZGVyV2lkdGgsXG4gICAgICAgIHNoYXBlOiB2YWx1ZXMuc2hhcGUsXG4gICAgICAgIGJvbGQ6IHZhbHVlcy5ib2xkLFxuICAgICAgICBpdGFsaWM6IHZhbHVlcy5pdGFsaWMsXG4gICAgICAgIHVuZGVybGluZTogdmFsdWVzLnVuZGVybGluZSxcbiAgICAgICAgZm9udFNpemU6IHZhbHVlcy5mb250U2l6ZVxuICAgICAgfTtcbiAgICAgIHNlbGVjdGVkLnN0eWxlID0gT2JqZWN0LnZhbHVlcyhzdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gc3R5bGUgOiB1bmRlZmluZWQ7XG4gICAgICBpZiAoc2VsZWN0ZWQuaWQgPT09IHRoaXMuZG9jdW1lbnQucm9vdC5pZCkge1xuICAgICAgICBjb25zdCB0aXRsZSA9IG5vZGVQbGFpblRleHQoc2VsZWN0ZWQpO1xuICAgICAgICBpZiAodGl0bGUpIHRoaXMuZG9jdW1lbnQudGl0bGUgPSB0aXRsZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBkZWxldGVTZWxlY3RlZCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCB8fCBzZWxlY3RlZC5pZCA9PT0gdGhpcy5kb2N1bWVudC5yb290LmlkKSB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU2ODM5XHU4MjgyXHU3MEI5XHU0RTBEXHU4MEZEXHU1MjIwXHU5NjY0XCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnQgPSBmaW5kUGFyZW50KHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHtcbiAgICAgIHJlbW92ZU5vZGUodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgICB0aGlzLnNlbGVjdGVkSWQgPSBwYXJlbnQ/LmlkID8/IHRoaXMuZG9jdW1lbnQucm9vdC5pZDtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgdG9nZ2xlQ29sbGFwc2UoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQgfHwgIXNlbGVjdGVkLmNoaWxkcmVuLmxlbmd0aCkgcmV0dXJuO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29sbGFwc2VkID0gIXNlbGVjdGVkLmNvbGxhcHNlZDsgfSk7XG4gIH1cblxuICBwcml2YXRlIGN5Y2xlVGFzaygpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgIGNvbnN0IG5leHQ6IFJlY29yZDxzdHJpbmcsIFRhc2tTdGF0dXMgfCB1bmRlZmluZWQ+ID0geyBcIlwiOiBcInRvZG9cIiwgdG9kbzogXCJkb2luZ1wiLCBkb2luZzogXCJkb25lXCIsIGRvbmU6IHVuZGVmaW5lZCB9O1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQudGFzayA9IG5leHRbc2VsZWN0ZWQudGFzayA/PyBcIlwiXTsgfSk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZUxheW91dCgpOiB2b2lkIHtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHRoaXMuZG9jdW1lbnQubGF5b3V0ID0gdGhpcy5kb2N1bWVudC5sYXlvdXQgPT09IFwicmlnaHRcIiA/IFwiYmFsYW5jZWRcIiA6IFwicmlnaHRcIjsgfSk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5maXRUb1ZpZXcoKSwgMjApO1xuICB9XG5cbiAgcHJpdmF0ZSBlZGl0QXBwZWFyYW5jZSgpOiB2b2lkIHtcbiAgICBuZXcgQXBwZWFyYW5jZU1vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLmdldEFwcGVhcmFuY2UoKSxcbiAgICAgIChhcHBlYXJhbmNlKSA9PiB0aGlzLm11dGF0ZSgoKSA9PiB7IHRoaXMuZG9jdW1lbnQuYXBwZWFyYW5jZSA9IGFwcGVhcmFuY2U7IH0pLFxuICAgICAgKCkgPT4gdGhpcy5tdXRhdGUoKCkgPT4geyB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UgPSB1bmRlZmluZWQ7IH0pXG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGVkaXRUYWJsZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIG5ldyBUYWJsZUVkaXRNb2RhbCh0aGlzLmFwcCwgc2VsZWN0ZWQudGFibGUsICh0YWJsZSkgPT4ge1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC50YWJsZSA9IHRhYmxlOyB9KTtcbiAgICB9KS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGNvbnZlcnRDaGlsZHJlblRvVGFibGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBjb25zdCB0YWJsZSA9IGNoaWxkcmVuVG9UYWJsZShzZWxlY3RlZCk7XG4gICAgaWYgKCF0YWJsZSkgeyBuZXcgTm90aWNlKFwiXHU1RjUzXHU1MjREXHU4MjgyXHU3MEI5XHU2Q0ExXHU2NzA5XHU1M0VGXHU4RjZDXHU2MzYyXHU3Njg0XHU1QjUwXHU4MjgyXHU3MEI5XCIpOyByZXR1cm47IH1cbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICBzZWxlY3RlZC50YWJsZSA9IHRhYmxlO1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gdHJ1ZTtcbiAgICB9KTtcbiAgICBuZXcgTm90aWNlKFwiXHU1REYyXHU3NTFGXHU2MjEwXHU1QjUwXHU4MjgyXHU3MEI5XHU4ODY4XHU2ODNDXHVGRjFCXHU1MzlGXHU1QjUwXHU4MjgyXHU3MEI5XHU1REYyXHU0RkREXHU3NTU5XHU1RTc2XHU2NTM2XHU4RDc3XCIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVUYWJsZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZD8udGFibGUpIHJldHVybjtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICBzZWxlY3RlZC50YWJsZSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmIChzZWxlY3RlZC5jaGlsZHJlbi5sZW5ndGgpIHNlbGVjdGVkLmNvbGxhcHNlZCA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBlZGl0Q29kZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIG5ldyBDb2RlRWRpdE1vZGFsKHRoaXMuYXBwLCBzZWxlY3RlZC5jb2RlLCAoY29kZSkgPT4ge1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5jb2RlID0gY29kZTsgfSk7XG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVDb2RlKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkPy5jb2RlKSByZXR1cm47XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5jb2RlID0gdW5kZWZpbmVkOyB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlT3JPcGVuU3VibWFwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgaWYgKHNlbGVjdGVkLnN1Ym1hcCkge1xuICAgICAgYXdhaXQgdGhpcy5jYWxsYmFja3Mub25PcGVuTWluZE1hcChzZWxlY3RlZC5zdWJtYXAucGF0aCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdWJtYXAgPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vbkNyZWF0ZVN1Ym1hcChzZWxlY3RlZCk7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLnN1Ym1hcCA9IHN1Ym1hcDsgfSk7XG4gICAgICBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5NaW5kTWFwKHN1Ym1hcC5wYXRoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGNyZWF0ZSBzdWJtYXAgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTUyMUJcdTVFRkFcdTVCNTBcdTVCRkNcdTU2RkVcdTU5MzFcdThEMjVcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJOb2RlVGFibGUoY29udGVudDogSFRNTEVsZW1lbnQsIG5vZGU6IE1pbmRNYXBOb2RlKTogdm9pZCB7XG4gICAgaWYgKCFub2RlLnRhYmxlKSByZXR1cm47XG4gICAgY29uc3Qgd3JhcCA9IGNvbnRlbnQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2RlLXRhYmxlLXdyYXBcIiB9KTtcbiAgICBjb25zdCB0YWJsZSA9IHdyYXAuY3JlYXRlRWwoXCJ0YWJsZVwiLCB7IGNsczogXCJtbWMtbm9kZS10YWJsZVwiIH0pO1xuICAgIGNvbnN0IGhlYWQgPSB0YWJsZS5jcmVhdGVFbChcInRoZWFkXCIpLmNyZWF0ZUVsKFwidHJcIik7XG4gICAgbm9kZS50YWJsZS5oZWFkZXJzLmZvckVhY2goKGhlYWRlciwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNlbGwgPSBoZWFkLmNyZWF0ZUVsKFwidGhcIiwgeyB0ZXh0OiBoZWFkZXIgfHwgYFx1NTIxNyAke2luZGV4ICsgMX1gIH0pO1xuICAgICAgY2VsbC5zdHlsZS50ZXh0QWxpZ24gPSBub2RlLnRhYmxlPy5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgIH0pO1xuICAgIGNvbnN0IGJvZHkgPSB0YWJsZS5jcmVhdGVFbChcInRib2R5XCIpO1xuICAgIG5vZGUudGFibGUucm93cy5mb3JFYWNoKChyb3cpID0+IHtcbiAgICAgIGNvbnN0IHRyID0gYm9keS5jcmVhdGVFbChcInRyXCIpO1xuICAgICAgbm9kZS50YWJsZSEuaGVhZGVycy5mb3JFYWNoKChfLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBjZWxsID0gdHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IHRleHQ6IHJvd1tpbmRleF0gPz8gXCJcIiB9KTtcbiAgICAgICAgY2VsbC5zdHlsZS50ZXh0QWxpZ24gPSBub2RlLnRhYmxlPy5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgd3JhcC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgKGV2ZW50KSA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKSk7XG4gICAgd3JhcC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgd3JhcC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7IHRoaXMuZWRpdFRhYmxlKCk7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJOb2RlQ29kZShjb250ZW50OiBIVE1MRWxlbWVudCwgbm9kZTogTWluZE1hcE5vZGUpOiB2b2lkIHtcbiAgICBpZiAoIW5vZGUuY29kZSkgcmV0dXJuO1xuICAgIGNvbnN0IGJsb2NrID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvZGUtYmxvY2tcIiB9KTtcbiAgICBjb25zdCBoZWFkZXIgPSBibG9jay5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvZGUtaGVhZGVyXCIgfSk7XG4gICAgaGVhZGVyLmNyZWF0ZVNwYW4oeyB0ZXh0OiBub2RlLmNvZGUubGFuZ3VhZ2UgfHwgXCJjb2RlXCIgfSk7XG4gICAgY29uc3QgY29weSA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJjbGlja2FibGUtaWNvblwiLCBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIlx1NTkwRFx1NTIzNlx1NEVFM1x1NzgwMVwiIH0gfSk7XG4gICAgc2V0SWNvbihjb3B5LCBcImNvcHlcIik7XG4gICAgY29weS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobm9kZS5jb2RlIS5jb2RlKS50aGVuKCgpID0+IG5ldyBOb3RpY2UoXCJcdTRFRTNcdTc4MDFcdTVERjJcdTU5MERcdTUyMzZcIikpO1xuICAgIH0pO1xuICAgIGNvbnN0IHJlbmRlcmVkID0gYmxvY2suY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2RlLXJlbmRlcmVkIG1hcmtkb3duLXJlbmRlcmVkXCIgfSk7XG4gICAgdm9pZCB0aGlzLmNhbGxiYWNrcy5vblJlbmRlckNvZGUobm9kZS5jb2RlLCByZW5kZXJlZCk7XG4gICAgYmxvY2suYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgIGJsb2NrLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGV2ZW50KSA9PiBldmVudC5wcmV2ZW50RGVmYXVsdCgpKTtcbiAgICBibG9jay5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7IHRoaXMuZWRpdENvZGUoKTsgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZVBhc3RlKGV2ZW50OiBDbGlwYm9hcmRFdmVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0Lm1hdGNoZXMoXCJpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCwgW2NvbnRlbnRlZGl0YWJsZT0ndHJ1ZSddXCIpKSByZXR1cm47XG4gICAgY29uc3QgZGF0YSA9IGV2ZW50LmNsaXBib2FyZERhdGE7XG4gICAgaWYgKCFkYXRhKSByZXR1cm47XG4gICAgY29uc3QgaW1hZ2VJdGVtID0gQXJyYXkuZnJvbShkYXRhLml0ZW1zKS5maW5kKChpdGVtKSA9PiBpdGVtLmtpbmQgPT09IFwiZmlsZVwiICYmIGl0ZW0udHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpKTtcbiAgICBpZiAoaW1hZ2VJdGVtKSB7XG4gICAgICBjb25zdCBibG9iID0gaW1hZ2VJdGVtLmdldEFzRmlsZSgpO1xuICAgICAgaWYgKCFibG9iKSByZXR1cm47XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IGJsb2IudHlwZS5zcGxpdChcIi9cIilbMV0/LnJlcGxhY2UoXCJqcGVnXCIsIFwianBnXCIpIHx8IFwicG5nXCI7XG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gYG1pbmRtYXAtaW1hZ2UuJHtleHRlbnNpb259YDtcbiAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uU2F2ZVBhc3RlZEltYWdlKGJsb2IsIGZpbGVuYW1lKTtcbiAgICAgICAgY29uc3QgaW1hZ2VCbG9jazogTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0geyBpZDogbmV3SWQoKSwgdHlwZTogXCJpbWFnZVwiLCBzb3VyY2U6IHBhdGgsIGxvY2FsU291cmNlOiBwYXRoIH07XG4gICAgICAgIHRoaXMubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBibG9ja3MgPSBub2RlQ29udGVudEJsb2NrcyhzZWxlY3RlZCk7XG4gICAgICAgICAgYmxvY2tzLnB1c2goaW1hZ2VCbG9jayk7XG4gICAgICAgICAgc2VsZWN0ZWQuY29udGVudCA9IGJsb2NrcztcbiAgICAgICAgICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyhzZWxlY3RlZCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzY2hlZHVsZWQgPSB0aGlzLmNhbGxiYWNrcy5vblNjaGVkdWxlQXV0b1VwbG9hZChzZWxlY3RlZC5pZCwgaW1hZ2VCbG9jay5pZCwgcGF0aCwgZmlsZW5hbWUpO1xuICAgICAgICBuZXcgTm90aWNlKHNjaGVkdWxlZCA/IGBcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTVCNThcdUZGMENcdTdCNDlcdTVGODVcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcdUZGMUEke3BhdGh9YCA6IGBcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTVCNThcdUZGMUEke3BhdGh9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gcGFzdGUgaW1hZ2UgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgICAgbmV3IE5vdGljZShcIlx1N0M5OFx1OEQzNFx1NTZGRVx1NzI0N1x1NTkzMVx1OEQyNVwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gZGF0YS5nZXREYXRhKFwidGV4dC9wbGFpblwiKTtcbiAgICBpZiAoIXRleHQudHJpbSgpKSByZXR1cm47XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBjb25zdCB0YWJsZSA9IHBhcnNlTWFya2Rvd25UYWJsZSh0ZXh0KTtcbiAgICBpZiAodGFibGUpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLnRhYmxlID0gdGFibGU7IH0pO1xuICAgICAgbmV3IE5vdGljZShcIlx1NURGMlx1OEJDNlx1NTIyQlx1NUU3Nlx1NjNEMlx1NTE2NSBNYXJrZG93biBcdTg4NjhcdTY4M0NcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNvZGUgPSBwYXJzZUZlbmNlZENvZGUodGV4dCk7XG4gICAgaWYgKGNvZGUpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLmNvZGUgPSBjb2RlOyB9KTtcbiAgICAgIG5ldyBOb3RpY2UoYFx1NURGMlx1OEJDNlx1NTIyQlx1NUU3Nlx1NjNEMlx1NTE2NSR7Y29kZS5sYW5ndWFnZSA/IGAgJHtjb2RlLmxhbmd1YWdlfWAgOiBcIlwifVx1NEVFM1x1NzgwMWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBicmFuY2ggPSB0aGlzLnBhcnNlQ2xpcGJvYXJkTm9kZSh0ZXh0KTtcbiAgICBpZiAoYnJhbmNoKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgY2xvbmUgPSBjbG9uZU5vZGVXaXRoRnJlc2hJZHMoYnJhbmNoKTtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29sbGFwc2VkID0gZmFsc2U7IHNlbGVjdGVkLmNoaWxkcmVuLnB1c2goY2xvbmUpOyB0aGlzLnNlbGVjdGVkSWQgPSBjbG9uZS5pZDsgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvcGVuU2VsZWN0ZWRMaW5rKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkKSByZXR1cm47XG4gICAgY29uc3QgbGluayA9IHRoaXMuZ2V0Tm9kZUxpbmsoc2VsZWN0ZWQpO1xuICAgIGlmICghbGluaykge1xuICAgICAgbmV3IE5vdGljZShcIlx1NUY1M1x1NTI0RFx1ODI4Mlx1NzBCOVx1NkNBMVx1NjcwOVx1OTRGRVx1NjNBNVx1RkYxQlx1NTNFRlx1NjMwOSBGMiBcdTZERkJcdTUyQTBcdTk0RkVcdTYzQTVcdTYyMTZcdTU3MjhcdTY1ODdcdTVCNTdcdTRFMkRcdTUxOTlcdTUxNjUgW1tcdTdCMTRcdThCQjBcdTU0MERdXVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdm9pZCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5MaW5rKGxpbmspO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXROb2RlTGluayhub2RlOiBNaW5kTWFwTm9kZSk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBub2RlLmxpbms/LnRyaW0oKSB8fCBleHRyYWN0Rmlyc3RXaWtpTGluayhub2RlUGxhaW5UZXh0KG5vZGUpKSB8fCBleHRyYWN0Rmlyc3RXaWtpTGluayhub2RlLm5vdGUgPz8gXCJcIik7XG4gIH1cblxuICBwcml2YXRlIHNob3dPdXRsaW5lKCk6IHZvaWQge1xuICAgIGNvbnN0IG1hcmtkb3duID0gZG9jdW1lbnRUb01hcmtkb3duKHRoaXMuZG9jdW1lbnQpO1xuICAgIG5ldyBPdXRsaW5lTW9kYWwodGhpcy5hcHAsIG1hcmtkb3duLCAoKSA9PiB2b2lkIHRoaXMuY2FsbGJhY2tzLm9uRXhwb3J0TWFya2Rvd24obWFya2Rvd24pKS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIHNob3dKc29uVHJhbnNmZXIoKTogdm9pZCB7XG4gICAgbmV3IEpzb25UcmFuc2Zlck1vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICB0aGlzLmdldERvY3VtZW50KCksXG4gICAgICAoZG9jdW1lbnQpID0+IHRoaXMucmVwbGFjZURvY3VtZW50KGRvY3VtZW50KSxcbiAgICAgIChqc29uKSA9PiB2b2lkIHRoaXMuY2FsbGJhY2tzLm9uRXhwb3J0SnNvbihqc29uKVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBvcGVuU2VhcmNoKCk6IHZvaWQge1xuICAgIG5ldyBTZWFyY2hOb2Rlc01vZGFsKFxuICAgICAgdGhpcy5hcHAsXG4gICAgICBmbGF0dGVuTm9kZXModGhpcy5kb2N1bWVudC5yb290KSxcbiAgICAgIChxdWVyeSkgPT4ge1xuICAgICAgICB0aGlzLnNlYXJjaFF1ZXJ5ID0gcXVlcnk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9LFxuICAgICAgKG5vZGUpID0+IHRoaXMuZm9jdXNOb2RlKG5vZGUuaWQpXG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGZvY3VzTm9kZShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgYW5jZXN0b3JzID0gZmluZEFuY2VzdG9ycyh0aGlzLmRvY3VtZW50LnJvb3QsIGlkKTtcbiAgICBjb25zdCBjb2xsYXBzZWQgPSBhbmNlc3RvcnMuZmlsdGVyKChub2RlKSA9PiBub2RlLmNvbGxhcHNlZCk7XG4gICAgaWYgKGNvbGxhcHNlZC5sZW5ndGgpIHtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IGNvbGxhcHNlZC5mb3JFYWNoKChub2RlKSA9PiB7IG5vZGUuY29sbGFwc2VkID0gZmFsc2U7IH0pKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3RlZElkID0gaWQ7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLmNlbnRlck5vZGUoaWQpLCAyMCk7XG4gIH1cblxuICBwcml2YXRlIGNlbnRlck5vZGUoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5sYXlvdXQuYnlJZC5nZXQoaWQpO1xuICAgIGlmICghcG9zaXRpb24pIHJldHVybjtcbiAgICB0aGlzLnBhblggPSAtcG9zaXRpb24ueCAqIHRoaXMuem9vbTtcbiAgICB0aGlzLnBhblkgPSAtcG9zaXRpb24ueSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICBwcml2YXRlIG9wZW5Db250ZXh0TWVudShldmVudDogTW91c2VFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTZERkJcdTUyQTBcdTVCNTBcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcInBsdXMtY2lyY2xlXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5hZGRDaGlsZCgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU2REZCXHU1MkEwXHU1NDBDXHU3RUE3XHU4MjgyXHU3MEI5XCIpLnNldEljb24oXCJsaXN0LXBsdXNcIikub25DbGljaygoKSA9PiB0aGlzLmFkZFNpYmxpbmcoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1N0YxNlx1OEY5MVx1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwicGVuY2lsXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5lZGl0U2VsZWN0ZWQoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NTE0Qlx1OTY4Nlx1NTIwNlx1NjUyRlwiKS5zZXRJY29uKFwiY29weS1wbHVzXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5kdXBsaWNhdGVTZWxlY3RlZCgpKSk7XG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoc2VsZWN0ZWQ/LnRhYmxlID8gXCJcdTdGMTZcdThGOTFcdTg4NjhcdTY4M0NcIiA6IFwiXHU2M0QyXHU1MTY1XHU4ODY4XHU2ODNDXCIpLnNldEljb24oXCJ0YWJsZS0yXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5lZGl0VGFibGUoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NUMwNlx1NUI1MFx1ODI4Mlx1NzBCOVx1NzUxRlx1NjIxMFx1ODg2OFx1NjgzQ1wiKS5zZXRJY29uKFwidGFibGUtcHJvcGVydGllc1wiKS5vbkNsaWNrKCgpID0+IHRoaXMuY29udmVydENoaWxkcmVuVG9UYWJsZSgpKSk7XG4gICAgaWYgKHNlbGVjdGVkPy50YWJsZSkgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU3OUZCXHU5NjY0XHU4ODY4XHU2ODNDXCIpLnNldEljb24oXCJ0YWJsZS0yXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5yZW1vdmVUYWJsZSgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKHNlbGVjdGVkPy5jb2RlID8gXCJcdTdGMTZcdThGOTFcdTRFRTNcdTc4MDFcIiA6IFwiXHU2M0QyXHU1MTY1XHU0RUUzXHU3ODAxXCIpLnNldEljb24oXCJjb2RlLTJcIikub25DbGljaygoKSA9PiB0aGlzLmVkaXRDb2RlKCkpKTtcbiAgICBpZiAoc2VsZWN0ZWQ/LmNvZGUpIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NzlGQlx1OTY2NFx1NEVFM1x1NzgwMVwiKS5zZXRJY29uKFwiZXJhc2VyXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5yZW1vdmVDb2RlKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoc2VsZWN0ZWQ/LnN1Ym1hcCA/IFwiXHU4RkRCXHU1MTY1XHU1QjUwXHU1QkZDXHU1NkZFXCIgOiBcIlx1NTIxQlx1NUVGQVx1NUI1MFx1NUJGQ1x1NTZGRVwiKS5zZXRJY29uKFwibmV0d29ya1wiKS5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5jcmVhdGVPck9wZW5TdWJtYXAoKSkpO1xuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU1OTBEXHU1MjM2XHU1MjA2XHU2NTJGXCIpLnNldEljb24oXCJjb3B5XCIpLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLmNvcHlTZWxlY3RlZEJyYW5jaCgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU3Qzk4XHU4RDM0XHU0RTNBXHU1QjUwXHU4MjgyXHU3MEI5XCIpLnNldEljb24oXCJjbGlwYm9hcmQtcGFzdGVcIikub25DbGljaygoKSA9PiB2b2lkIHRoaXMucGFzdGVBc0NoaWxkKCkpKTtcbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShgXHU0RUZCXHU1MkExXHU3MkI2XHU2MDAxXHVGRjFBJHtzZWxlY3RlZD8udGFzayA9PT0gXCJkb25lXCIgPyBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIDogc2VsZWN0ZWQ/LnRhc2sgPT09IFwiZG9pbmdcIiA/IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIgOiBzZWxlY3RlZD8udGFzayA9PT0gXCJ0b2RvXCIgPyBcIlx1NUY4NVx1NTI5RVwiIDogXCJcdTY1RTBcIn1gKS5zZXRJY29uKFwiY2lyY2xlLWNoZWNrLWJpZ1wiKS5vbkNsaWNrKCgpID0+IHRoaXMuY3ljbGVUYXNrKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTVDNTVcdTVGMDAvXHU2NTM2XHU4RDc3XCIpLnNldEljb24oXCJmb2xkLXZlcnRpY2FsXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy50b2dnbGVDb2xsYXBzZSgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU2MjUzXHU1RjAwXHU5NEZFXHU2M0E1XCIpLnNldEljb24oXCJsaW5rXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5vcGVuU2VsZWN0ZWRMaW5rKCkpKTtcbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NTIyMFx1OTY2NFx1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwidHJhc2gtMlwiKS5vbkNsaWNrKCgpID0+IHRoaXMuZGVsZXRlU2VsZWN0ZWQoKSkpO1xuICAgIG1lbnUuc2hvd0F0TW91c2VFdmVudChldmVudCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvcHlTZWxlY3RlZEJyYW5jaCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCkgcmV0dXJuIGZhbHNlO1xuICAgIHRoaXMuYnJhbmNoQ2xpcGJvYXJkID0gY2xvbmVEb2N1bWVudCh7IHZlcnNpb246IDgsIHRpdGxlOiBub2RlUGxhaW5UZXh0KHNlbGVjdGVkKSB8fCBcIlx1NTZGRVx1NzI0N1x1ODI4Mlx1NzBCOVwiLCBsYXlvdXQ6IFwicmlnaHRcIiwgdGhlbWU6IFwiYXV0b1wiLCByb290OiBzZWxlY3RlZCB9KS5yb290O1xuICAgIGNvbnN0IHBheWxvYWQgPSBKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwibWluZG1hcC1zdHVkaW8tbm9kZVwiLCB2ZXJzaW9uOiAxLCBub2RlOiBzZWxlY3RlZCB9LCBudWxsLCAyKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocGF5bG9hZCk7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1REYyXHU1OTBEXHU1MjM2XHU4MjgyXHU3MEI5XHU1MjA2XHU2NTJGXCIpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgbmV3IE5vdGljZShcIlx1ODI4Mlx1NzBCOVx1NTIwNlx1NjUyRlx1NURGMlx1NTkwRFx1NTIzNlx1NTIzMFx1NjNEMlx1NEVGNlx1NTE4NVx1OTBFOFx1NTI2QVx1OEQzNFx1Njc3RlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBhc3RlQXNDaGlsZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGxldCBzb3VyY2VOb2RlOiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC5yZWFkVGV4dCgpO1xuICAgICAgaWYgKHRleHQudHJpbSgpKSBzb3VyY2VOb2RlID0gdGhpcy5wYXJzZUNsaXBib2FyZE5vZGUodGV4dCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBCcm93c2VyIGNsaXBib2FyZCBwZXJtaXNzaW9uIGNhbiBiZSB1bmF2YWlsYWJsZTsgdXNlIGludGVybmFsIGNsaXBib2FyZC5cbiAgICB9XG4gICAgc291cmNlTm9kZSA/Pz0gdGhpcy5icmFuY2hDbGlwYm9hcmQ7XG4gICAgaWYgKCFzb3VyY2VOb2RlKSB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1MjZBXHU4RDM0XHU2NzdGXHU0RTJEXHU2Q0ExXHU2NzA5XHU1M0VGXHU3Qzk4XHU4RDM0XHU3Njg0IE1pbmRNYXAgXHU4MjgyXHU3MEI5XCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjbG9uZSA9IGNsb25lTm9kZVdpdGhGcmVzaElkcyhzb3VyY2VOb2RlKTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICBzZWxlY3RlZC5jb2xsYXBzZWQgPSBmYWxzZTtcbiAgICAgIHNlbGVjdGVkLmNoaWxkcmVuLnB1c2goY2xvbmUpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gY2xvbmUuaWQ7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlQ2xpcGJvYXJkTm9kZSh0ZXh0OiBzdHJpbmcpOiBNaW5kTWFwTm9kZSB8IG51bGwge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHRleHQpIGFzIHsgdHlwZT86IHN0cmluZzsgbm9kZT86IFBhcnRpYWw8TWluZE1hcE5vZGU+OyByb290PzogUGFydGlhbDxNaW5kTWFwTm9kZT47IHRleHQ/OiBzdHJpbmc7IGNoaWxkcmVuPzogdW5rbm93bltdIH07XG4gICAgICBjb25zdCBpbnB1dCA9IChwYXJzZWQudHlwZSA9PT0gXCJtaW5kbWFwLXN0dWRpby1ub2RlXCIgfHwgcGFyc2VkLnR5cGUgPT09IFwibW1jLWxpdGUtbm9kZVwiIHx8IHBhcnNlZC50eXBlID09PSBcInNtbS1saXRlLW5vZGVcIikgJiYgcGFyc2VkLm5vZGUgPyBwYXJzZWQubm9kZSA6IHBhcnNlZC5yb290ID8/ICh0eXBlb2YgcGFyc2VkLnRleHQgPT09IFwic3RyaW5nXCIgJiYgQXJyYXkuaXNBcnJheShwYXJzZWQuY2hpbGRyZW4pID8gcGFyc2VkIDogbnVsbCk7XG4gICAgICBpZiAoIWlucHV0KSByZXR1cm4gbnVsbDtcbiAgICAgIHJldHVybiBub3JtYWxpemVEb2N1bWVudCh7IHRpdGxlOiBpbnB1dC50ZXh0ID8/IFwiXHU3Qzk4XHU4RDM0XHU4MjgyXHU3MEI5XCIsIHJvb3Q6IGlucHV0IGFzIE1pbmRNYXBOb2RlIH0sIGlucHV0LnRleHQgPz8gXCJcdTdDOThcdThEMzRcdTgyODJcdTcwQjlcIikucm9vdDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZHVwbGljYXRlU2VsZWN0ZWQoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQgfHwgc2VsZWN0ZWQuaWQgPT09IHRoaXMuZG9jdW1lbnQucm9vdC5pZCkge1xuICAgICAgbmV3IE5vdGljZShcIlx1OEJGN1x1OTAwOVx1NjJFOVx1OTc1RVx1NjgzOVx1ODI4Mlx1NzBCOVx1NTQwRVx1NTE0Qlx1OTY4Nlx1NTIwNlx1NjUyRlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IGNsb25lID0gY2xvbmVOb2RlV2l0aEZyZXNoSWRzKHNlbGVjdGVkKTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHBhcmVudC5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkKSA9PiBjaGlsZC5pZCA9PT0gc2VsZWN0ZWQuaWQpO1xuICAgICAgcGFyZW50LmNoaWxkcmVuLnNwbGljZShpbmRleCArIDEsIDAsIGNsb25lKTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGNsb25lLmlkO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjYW5SZXBhcmVudChkcmFnZ2VkSWQ6IHN0cmluZyB8IG51bGwsIHRhcmdldElkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWRyYWdnZWRJZCB8fCBkcmFnZ2VkSWQgPT09IHRoaXMuZG9jdW1lbnQucm9vdC5pZCB8fCBkcmFnZ2VkSWQgPT09IHRhcmdldElkKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgZHJhZ2dlZCA9IGZpbmROb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgZHJhZ2dlZElkKTtcbiAgICByZXR1cm4gQm9vbGVhbihkcmFnZ2VkICYmICFjb250YWluc05vZGUoZHJhZ2dlZCwgdGFyZ2V0SWQpKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVwYXJlbnROb2RlKGRyYWdnZWRJZDogc3RyaW5nLCB0YXJnZXRJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNhblJlcGFyZW50KGRyYWdnZWRJZCwgdGFyZ2V0SWQpKSByZXR1cm47XG4gICAgY29uc3QgZHJhZ2dlZCA9IGZpbmROb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgZHJhZ2dlZElkKTtcbiAgICBjb25zdCB0YXJnZXQgPSBmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIHRhcmdldElkKTtcbiAgICBpZiAoIWRyYWdnZWQgfHwgIXRhcmdldCkgcmV0dXJuO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHtcbiAgICAgIHJlbW92ZU5vZGUodGhpcy5kb2N1bWVudC5yb290LCBkcmFnZ2VkSWQpO1xuICAgICAgdGFyZ2V0LmNoaWxkcmVuLnB1c2goZHJhZ2dlZCk7XG4gICAgICB0YXJnZXQuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICB0aGlzLnNlbGVjdGVkSWQgPSBkcmFnZ2VkSWQ7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlcGxhY2VEb2N1bWVudChkb2N1bWVudDogTWluZE1hcERvY3VtZW50KTogdm9pZCB7XG4gICAgdGhpcy5oaXN0b3J5LnB1c2goSlNPTi5zdHJpbmdpZnkodGhpcy5kb2N1bWVudCkpO1xuICAgIHRoaXMudHJpbUhpc3RvcnkoKTtcbiAgICB0aGlzLmZ1dHVyZSA9IFtdO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBjbG9uZURvY3VtZW50KGRvY3VtZW50KTtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDIwKTtcbiAgfVxuXG4gIHByaXZhdGUgbXV0YXRlKGFjdGlvbjogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuaGlzdG9yeS5wdXNoKEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnQpKTtcbiAgICB0aGlzLnRyaW1IaXN0b3J5KCk7XG4gICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICBhY3Rpb24oKTtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIHRyaW1IaXN0b3J5KCk6IHZvaWQge1xuICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5tYXgoMTAsIE1hdGgubWluKDUwMCwgdGhpcy5vcHRpb25zLmhpc3RvcnlMaW1pdCkpO1xuICAgIHdoaWxlICh0aGlzLmhpc3RvcnkubGVuZ3RoID4gbGltaXQpIHRoaXMuaGlzdG9yeS5zaGlmdCgpO1xuICB9XG5cbiAgcHJpdmF0ZSB1bmRvKCk6IHZvaWQge1xuICAgIGNvbnN0IHByZXZpb3VzID0gdGhpcy5oaXN0b3J5LnBvcCgpO1xuICAgIGlmICghcHJldmlvdXMpIHJldHVybjtcbiAgICB0aGlzLmZ1dHVyZS5wdXNoKEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnQpKTtcbiAgICB0aGlzLmRvY3VtZW50ID0gSlNPTi5wYXJzZShwcmV2aW91cykgYXMgTWluZE1hcERvY3VtZW50O1xuICAgIHRoaXMuc2VsZWN0ZWRJZCA9IHRoaXMuZG9jdW1lbnQucm9vdC5pZDtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIHJlZG8oKTogdm9pZCB7XG4gICAgY29uc3QgbmV4dCA9IHRoaXMuZnV0dXJlLnBvcCgpO1xuICAgIGlmICghbmV4dCkgcmV0dXJuO1xuICAgIHRoaXMuaGlzdG9yeS5wdXNoKEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnQpKTtcbiAgICB0aGlzLnRyaW1IaXN0b3J5KCk7XG4gICAgdGhpcy5kb2N1bWVudCA9IEpTT04ucGFyc2UobmV4dCkgYXMgTWluZE1hcERvY3VtZW50O1xuICAgIHRoaXMuc2VsZWN0ZWRJZCA9IHRoaXMuZG9jdW1lbnQucm9vdC5pZDtcbiAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIGZpdFRvVmlldygpOiB2b2lkIHtcbiAgICBjb25zdCByZWN0ID0gdGhpcy52aWV3cG9ydEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHdpZHRoID0gTWF0aC5tYXgoMSwgdGhpcy5sYXlvdXQubWF4WCAtIHRoaXMubGF5b3V0Lm1pblggKyAxMDApO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KDEsIHRoaXMubGF5b3V0Lm1heFkgLSB0aGlzLmxheW91dC5taW5ZICsgMTAwKTtcbiAgICB0aGlzLnpvb20gPSB0aGlzLmNsYW1wWm9vbShNYXRoLm1pbigocmVjdC53aWR0aCAtIDQwKSAvIHdpZHRoLCAocmVjdC5oZWlnaHQgLSA0MCkgLyBoZWlnaHQsIDEuMjUpKTtcbiAgICBjb25zdCBjZW50ZXJYID0gKHRoaXMubGF5b3V0Lm1pblggKyB0aGlzLmxheW91dC5tYXhYKSAvIDI7XG4gICAgY29uc3QgY2VudGVyWSA9ICh0aGlzLmxheW91dC5taW5ZICsgdGhpcy5sYXlvdXQubWF4WSkgLyAyO1xuICAgIHRoaXMucGFuWCA9IC1jZW50ZXJYICogdGhpcy56b29tO1xuICAgIHRoaXMucGFuWSA9IC1jZW50ZXJZICogdGhpcy56b29tO1xuICAgIHRoaXMuYXBwbHlUcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0Wm9vbSh2YWx1ZTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy56b29tID0gdGhpcy5jbGFtcFpvb20odmFsdWUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xhbXBab29tKHZhbHVlOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1pbigyLjUsIE1hdGgubWF4KDAuMiwgdmFsdWUpKTtcbiAgfVxuXG4gIHByaXZhdGUgbmF2aWdhdGVTZWxlY3Rpb24oZGlyZWN0aW9uOiBcInBhcmVudFwiIHwgXCJjaGlsZFwiIHwgXCJwcmV2aW91c1wiIHwgXCJuZXh0XCIpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGxldCB0YXJnZXQ6IE1pbmRNYXBOb2RlIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gXCJwYXJlbnRcIikgdGFyZ2V0ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICBpZiAoZGlyZWN0aW9uID09PSBcImNoaWxkXCIpIHRhcmdldCA9IHNlbGVjdGVkLmNoaWxkcmVuWzBdID8/IG51bGw7XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gXCJwcmV2aW91c1wiIHx8IGRpcmVjdGlvbiA9PT0gXCJuZXh0XCIpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGZpbmRQYXJlbnQodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcGFyZW50LmNoaWxkcmVuLmZpbmRJbmRleCgoY2hpbGQpID0+IGNoaWxkLmlkID09PSBzZWxlY3RlZC5pZCk7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGRpcmVjdGlvbiA9PT0gXCJwcmV2aW91c1wiID8gLTEgOiAxO1xuICAgICAgICB0YXJnZXQgPSBwYXJlbnQuY2hpbGRyZW5baW5kZXggKyBvZmZzZXRdID8/IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHRoaXMuc2VsZWN0Tm9kZSh0YXJnZXQuaWQpO1xuICAgICAgdGhpcy5jZW50ZXJOb2RlKHRhcmdldC5pZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVLZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgIGlmICh0YXJnZXQubWF0Y2hlcyhcImlucHV0LCB0ZXh0YXJlYSwgc2VsZWN0LCBbY29udGVudGVkaXRhYmxlPSd0cnVlJ11cIikpIHJldHVybjtcbiAgICBjb25zdCBtb2QgPSBldmVudC5jdHJsS2V5IHx8IGV2ZW50Lm1ldGFLZXk7XG4gICAgY29uc3Qga2V5ID0gZXZlbnQua2V5LnRvTG93ZXJDYXNlKCk7XG5cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJzXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcImZcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMub3BlblNlYXJjaCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJkXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLmR1cGxpY2F0ZVNlbGVjdGVkKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcImNcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZvaWQgdGhpcy5jb3B5U2VsZWN0ZWRCcmFuY2goKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwieFwiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdm9pZCB0aGlzLmNvcHlTZWxlY3RlZEJyYW5jaCgpLnRoZW4oKGNvcGllZCkgPT4geyBpZiAoY29waWVkKSB0aGlzLmRlbGV0ZVNlbGVjdGVkKCk7IH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5jeWNsZVRhc2soKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwielwiICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMudW5kbygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoKG1vZCAmJiBrZXkgPT09IFwieVwiKSB8fCAobW9kICYmIGV2ZW50LnNoaWZ0S2V5ICYmIGtleSA9PT0gXCJ6XCIpKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5yZWRvKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3dpdGNoIChldmVudC5rZXkpIHtcbiAgICAgIGNhc2UgXCJUYWJcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJFbnRlclwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmFkZFNpYmxpbmcoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRGVsZXRlXCI6XG4gICAgICBjYXNlIFwiQmFja3NwYWNlXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuZGVsZXRlU2VsZWN0ZWQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRjJcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5lZGl0U2VsZWN0ZWQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiIFwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnRvZ2dsZUNvbGxhcHNlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkFycm93TGVmdFwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLm5hdmlnYXRlU2VsZWN0aW9uKFwicGFyZW50XCIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd1JpZ2h0XCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMubmF2aWdhdGVTZWxlY3Rpb24oXCJjaGlsZFwiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dVcFwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLm5hdmlnYXRlU2VsZWN0aW9uKFwicHJldmlvdXNcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkFycm93RG93blwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLm5hdmlnYXRlU2VsZWN0aW9uKFwibmV4dFwiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiK1wiOlxuICAgICAgY2FzZSBcIj1cIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5zZXRab29tKHRoaXMuem9vbSAqIDEuMTUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gLyAxLjE1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiMFwiOlxuICAgICAgICBpZiAobW9kKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLmZpdFRvVmlldygpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBwYXJzZUZlbmNlZENvZGUsXG4gIHBhcnNlTWFya2Rvd25UYWJsZSxcbiAgdGFibGVUb01hcmtkb3duLFxuICB0eXBlIE1pbmRNYXBDb2RlQmxvY2ssXG4gIHR5cGUgTWluZE1hcFRhYmxlLFxuICB0eXBlIFRhYmxlQWxpZ25tZW50XG59IGZyb20gXCIuL21vZGVsXCI7XG5cbmZ1bmN0aW9uIGNsb25lVGFibGUodGFibGU6IE1pbmRNYXBUYWJsZSB8IHVuZGVmaW5lZCk6IE1pbmRNYXBUYWJsZSB7XG4gIGlmICghdGFibGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVhZGVyczogW1wiXHU1MjE3IDFcIiwgXCJcdTUyMTcgMlwiXSxcbiAgICAgIHJvd3M6IFtbXCJcIiwgXCJcIl0sIFtcIlwiLCBcIlwiXV0sXG4gICAgICBhbGlnbm1lbnRzOiBbXCJsZWZ0XCIsIFwibGVmdFwiXSxcbiAgICAgIHNvdXJjZTogXCJtYW51YWxcIlxuICAgIH07XG4gIH1cbiAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGFibGUpKSBhcyBNaW5kTWFwVGFibGU7XG59XG5cbmV4cG9ydCBjbGFzcyBUYWJsZUVkaXRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSB0YWJsZTogTWluZE1hcFRhYmxlO1xuICBwcml2YXRlIHJlYWRvbmx5IHN1Ym1pdDogKHRhYmxlOiBNaW5kTWFwVGFibGUpID0+IHZvaWQ7XG4gIHByaXZhdGUgZ3JpZEVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgbWFya2Rvd25FbCE6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHRhYmxlOiBNaW5kTWFwVGFibGUgfCB1bmRlZmluZWQsIHN1Ym1pdDogKHRhYmxlOiBNaW5kTWFwVGFibGUpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMudGFibGUgPSBjbG9uZVRhYmxlKHRhYmxlKTtcbiAgICB0aGlzLnN1Ym1pdCA9IHN1Ym1pdDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlx1NjNEMlx1NTE2NVx1NjIxNlx1N0YxNlx1OEY5MVx1ODg2OFx1NjgzQ1wiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcIm1tYy10YWJsZS1tb2RhbFwiKTtcblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIixcbiAgICAgIHRleHQ6IFwiXHU1M0VGXHU0RUU1XHU3NkY0XHU2M0E1XHU3RjE2XHU4RjkxXHU1MzU1XHU1MTQzXHU2ODNDXHVGRjBDXHU0RTVGXHU1M0VGXHU0RUU1XHU3Qzk4XHU4RDM0IE1hcmtkb3duIFx1ODg2OFx1NjgzQ1x1NTQwRVx1NzBCOVx1NTFGQlx1MjAxQ1x1ODlFM1x1Njc5MCBNYXJrZG93blx1MjAxRFx1MzAwMlwiXG4gICAgfSk7XG4gICAgZGVzY3JpcHRpb24uc2V0QXR0cihcImFyaWEtbGl2ZVwiLCBcInBvbGl0ZVwiKTtcblxuICAgIGNvbnN0IHRvb2xiYXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXRhYmxlLXRvb2xiYXJcIiB9KTtcbiAgICBjb25zdCBhZGRSb3cgPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCIrIFx1ODg0Q1wiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IHJlbW92ZVJvdyA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1MjIxMiBcdTg4NENcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCBhZGRDb2x1bW4gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCIrIFx1NTIxN1wiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IHJlbW92ZUNvbHVtbiA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1MjIxMiBcdTUyMTdcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCB0b01hcmtkb3duID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU3NTFGXHU2MjEwIE1hcmtkb3duXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG5cbiAgICB0aGlzLmdyaWRFbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGFibGUtZWRpdG9yLWdyaWRcIiB9KTtcbiAgICB0aGlzLnJlbmRlckdyaWQoKTtcblxuICAgIGNvbnN0IG1hcmtkb3duTGFiZWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJNYXJrZG93biBcdTg4NjhcdTY4M0NcIiB9KTtcbiAgICB0aGlzLm1hcmtkb3duRWwgPSBtYXJrZG93bkxhYmVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcIm1tYy10YWJsZS1tYXJrZG93blwiLFxuICAgICAgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJ8IFx1NTIxNyAxIHwgXHU1MjE3IDIgfFxcbnwgLS0tIHwgLS0tIHxcXG58IFx1NTE4NVx1NUJCOSB8IFx1NTE4NVx1NUJCOSB8XCIgfVxuICAgIH0pO1xuICAgIHRoaXMubWFya2Rvd25FbC5yb3dzID0gODtcbiAgICB0aGlzLm1hcmtkb3duRWwudmFsdWUgPSB0YWJsZVRvTWFya2Rvd24odGhpcy50YWJsZSk7XG4gICAgY29uc3QgcGFyc2VCdXR0b24gPSBtYXJrZG93bkxhYmVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTg5RTNcdTY3OTAgTWFya2Rvd25cIiwgdHlwZTogXCJidXR0b25cIiB9KTtcblxuICAgIGFkZFJvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jb2xsZWN0R3JpZCgpO1xuICAgICAgdGhpcy50YWJsZS5yb3dzLnB1c2godGhpcy50YWJsZS5oZWFkZXJzLm1hcCgoKSA9PiBcIlwiKSk7XG4gICAgICB0aGlzLnJlbmRlckdyaWQoKTtcbiAgICB9KTtcbiAgICByZW1vdmVSb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIGlmICh0aGlzLnRhYmxlLnJvd3MubGVuZ3RoKSB0aGlzLnRhYmxlLnJvd3MucG9wKCk7XG4gICAgICB0aGlzLnJlbmRlckdyaWQoKTtcbiAgICB9KTtcbiAgICBhZGRDb2x1bW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIGlmICh0aGlzLnRhYmxlLmhlYWRlcnMubGVuZ3RoID49IDEyKSB7IG5ldyBOb3RpY2UoXCJcdTY3MDBcdTU5MUFcdTY1MkZcdTYzMDEgMTIgXHU1MjE3XCIpOyByZXR1cm47IH1cbiAgICAgIHRoaXMudGFibGUuaGVhZGVycy5wdXNoKGBcdTUyMTcgJHt0aGlzLnRhYmxlLmhlYWRlcnMubGVuZ3RoICsgMX1gKTtcbiAgICAgIHRoaXMudGFibGUuYWxpZ25tZW50cyA/Pz0gW107XG4gICAgICB0aGlzLnRhYmxlLmFsaWdubWVudHMucHVzaChcImxlZnRcIik7XG4gICAgICB0aGlzLnRhYmxlLnJvd3MuZm9yRWFjaCgocm93KSA9PiByb3cucHVzaChcIlwiKSk7XG4gICAgICB0aGlzLnJlbmRlckdyaWQoKTtcbiAgICB9KTtcbiAgICByZW1vdmVDb2x1bW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIGlmICh0aGlzLnRhYmxlLmhlYWRlcnMubGVuZ3RoIDw9IDEpIHJldHVybjtcbiAgICAgIHRoaXMudGFibGUuaGVhZGVycy5wb3AoKTtcbiAgICAgIHRoaXMudGFibGUuYWxpZ25tZW50cz8ucG9wKCk7XG4gICAgICB0aGlzLnRhYmxlLnJvd3MuZm9yRWFjaCgocm93KSA9PiByb3cucG9wKCkpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgdG9NYXJrZG93bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jb2xsZWN0R3JpZCgpO1xuICAgICAgdGhpcy5tYXJrZG93bkVsLnZhbHVlID0gdGFibGVUb01hcmtkb3duKHRoaXMudGFibGUpO1xuICAgIH0pO1xuICAgIHBhcnNlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZU1hcmtkb3duVGFibGUodGhpcy5tYXJrZG93bkVsLnZhbHVlKTtcbiAgICAgIGlmICghcGFyc2VkKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJcdTY3MkFcdThCQzZcdTUyMkJcdTUyMzBcdTY3MDlcdTY1NDhcdTc2ODQgTWFya2Rvd24gXHU4ODY4XHU2ODNDXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnRhYmxlID0gcGFyc2VkO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgICBuZXcgTm90aWNlKFwiTWFya2Rvd24gXHU4ODY4XHU2ODNDXHU1REYyXHU4OUUzXHU2NzkwXCIpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYWN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbW9kYWwtYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGNhbmNlbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTNENlx1NkQ4OFwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IHNhdmUgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTRGRERcdTVCNThcdTg4NjhcdTY4M0NcIiwgdHlwZTogXCJidXR0b25cIiwgY2xzOiBcIm1vZC1jdGFcIiB9KTtcbiAgICBjYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgc2F2ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5jb2xsZWN0R3JpZCgpO1xuICAgICAgaWYgKCF0aGlzLnRhYmxlLmhlYWRlcnMuc29tZSgoaGVhZGVyKSA9PiBoZWFkZXIudHJpbSgpKSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiXHU4MUYzXHU1QzExXHU5NzAwXHU4OTgxXHU0RTAwXHU0RTJBXHU4ODY4XHU1OTM0XCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnRhYmxlLnNvdXJjZSA9IHRoaXMudGFibGUuc291cmNlID8/IFwibWFudWFsXCI7XG4gICAgICB0aGlzLnN1Ym1pdCh0aGlzLnRhYmxlKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyR3JpZCgpOiB2b2lkIHtcbiAgICB0aGlzLmdyaWRFbC5lbXB0eSgpO1xuICAgIGNvbnN0IHRhYmxlID0gdGhpcy5ncmlkRWwuY3JlYXRlRWwoXCJ0YWJsZVwiKTtcbiAgICBjb25zdCBoZWFkID0gdGFibGUuY3JlYXRlRWwoXCJ0aGVhZFwiKS5jcmVhdGVFbChcInRyXCIpO1xuICAgIHRoaXMudGFibGUuaGVhZGVycy5mb3JFYWNoKChoZWFkZXIsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCB0aCA9IGhlYWQuY3JlYXRlRWwoXCJ0aFwiKTtcbiAgICAgIGNvbnN0IGlucHV0ID0gdGguY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IFwiZGF0YS1raW5kXCI6IFwiaGVhZGVyXCIsIFwiZGF0YS1jb2x1bW5cIjogU3RyaW5nKGluZGV4KSB9IH0pO1xuICAgICAgaW5wdXQudmFsdWUgPSBoZWFkZXI7XG4gICAgICBjb25zdCBhbGlnbiA9IHRoLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgYXR0cjogeyBcImRhdGEta2luZFwiOiBcImFsaWdubWVudFwiLCBcImRhdGEtY29sdW1uXCI6IFN0cmluZyhpbmRleCksIFwiYXJpYS1sYWJlbFwiOiBgXHU3QjJDICR7aW5kZXggKyAxfSBcdTUyMTdcdTVCRjlcdTlGNTBcdTY1QjlcdTVGMEZgIH0gfSk7XG4gICAgICAoW1snbGVmdCcsICdcdTVERTYnXSwgWydjZW50ZXInLCAnXHU0RTJEJ10sIFsncmlnaHQnLCAnXHU1M0YzJ11dIGFzIEFycmF5PFtUYWJsZUFsaWdubWVudCwgc3RyaW5nXT4pLmZvckVhY2goKFt2YWx1ZSwgbGFiZWxdKSA9PiBhbGlnbi5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSkpO1xuICAgICAgYWxpZ24udmFsdWUgPSB0aGlzLnRhYmxlLmFsaWdubWVudHM/LltpbmRleF0gPz8gXCJsZWZ0XCI7XG4gICAgfSk7XG4gICAgY29uc3QgYm9keSA9IHRhYmxlLmNyZWF0ZUVsKFwidGJvZHlcIik7XG4gICAgdGhpcy50YWJsZS5yb3dzLmZvckVhY2goKHJvdywgcm93SW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHRyID0gYm9keS5jcmVhdGVFbChcInRyXCIpO1xuICAgICAgdGhpcy50YWJsZS5oZWFkZXJzLmZvckVhY2goKF8sIGNvbHVtbkluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHRkID0gdHIuY3JlYXRlRWwoXCJ0ZFwiKTtcbiAgICAgICAgY29uc3QgaW5wdXQgPSB0ZC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHsgYXR0cjogeyBcImRhdGEta2luZFwiOiBcImNlbGxcIiwgXCJkYXRhLXJvd1wiOiBTdHJpbmcocm93SW5kZXgpLCBcImRhdGEtY29sdW1uXCI6IFN0cmluZyhjb2x1bW5JbmRleCkgfSB9KTtcbiAgICAgICAgaW5wdXQucm93cyA9IDI7XG4gICAgICAgIGlucHV0LnZhbHVlID0gcm93W2NvbHVtbkluZGV4XSA/PyBcIlwiO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNvbGxlY3RHcmlkKCk6IHZvaWQge1xuICAgIGNvbnN0IGhlYWRlcnMgPSBBcnJheS5mcm9tKHRoaXMuZ3JpZEVsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTElucHV0RWxlbWVudD4oJ2lucHV0W2RhdGEta2luZD1cImhlYWRlclwiXScpKTtcbiAgICBoZWFkZXJzLmZvckVhY2goKGlucHV0KSA9PiB7XG4gICAgICBjb25zdCBjb2x1bW4gPSBOdW1iZXIoaW5wdXQuZGF0YXNldC5jb2x1bW4pO1xuICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoY29sdW1uKSkgdGhpcy50YWJsZS5oZWFkZXJzW2NvbHVtbl0gPSBpbnB1dC52YWx1ZS50cmltKCkuc2xpY2UoMCwgMjAwMCk7XG4gICAgfSk7XG4gICAgY29uc3QgYWxpZ25tZW50cyA9IEFycmF5LmZyb20odGhpcy5ncmlkRWwucXVlcnlTZWxlY3RvckFsbDxIVE1MU2VsZWN0RWxlbWVudD4oJ3NlbGVjdFtkYXRhLWtpbmQ9XCJhbGlnbm1lbnRcIl0nKSk7XG4gICAgdGhpcy50YWJsZS5hbGlnbm1lbnRzID0gdGhpcy50YWJsZS5oZWFkZXJzLm1hcCgoKSA9PiBcImxlZnRcIik7XG4gICAgYWxpZ25tZW50cy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgICAgY29uc3QgY29sdW1uID0gTnVtYmVyKGlucHV0LmRhdGFzZXQuY29sdW1uKTtcbiAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbHVtbikpIHRoaXMudGFibGUuYWxpZ25tZW50cyFbY29sdW1uXSA9IGlucHV0LnZhbHVlID09PSBcImNlbnRlclwiIHx8IGlucHV0LnZhbHVlID09PSBcInJpZ2h0XCIgPyBpbnB1dC52YWx1ZSA6IFwibGVmdFwiO1xuICAgIH0pO1xuICAgIGNvbnN0IGNlbGxzID0gQXJyYXkuZnJvbSh0aGlzLmdyaWRFbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYVtkYXRhLWtpbmQ9XCJjZWxsXCJdJykpO1xuICAgIGNlbGxzLmZvckVhY2goKGlucHV0KSA9PiB7XG4gICAgICBjb25zdCByb3cgPSBOdW1iZXIoaW5wdXQuZGF0YXNldC5yb3cpO1xuICAgICAgY29uc3QgY29sdW1uID0gTnVtYmVyKGlucHV0LmRhdGFzZXQuY29sdW1uKTtcbiAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHJvdykgJiYgTnVtYmVyLmlzSW50ZWdlcihjb2x1bW4pICYmIHRoaXMudGFibGUucm93c1tyb3ddKSB0aGlzLnRhYmxlLnJvd3Nbcm93XSFbY29sdW1uXSA9IGlucHV0LnZhbHVlLnNsaWNlKDAsIDIwMDApO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb2RlRWRpdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IGJsb2NrOiBNaW5kTWFwQ29kZUJsb2NrIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHJlYWRvbmx5IHN1Ym1pdDogKGJsb2NrOiBNaW5kTWFwQ29kZUJsb2NrKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBibG9jazogTWluZE1hcENvZGVCbG9jayB8IHVuZGVmaW5lZCwgc3VibWl0OiAoYmxvY2s6IE1pbmRNYXBDb2RlQmxvY2spID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuYmxvY2sgPSBibG9jaztcbiAgICB0aGlzLnN1Ym1pdCA9IHN1Ym1pdDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlx1NjNEMlx1NTE2NVx1NjIxNlx1N0YxNlx1OEY5MVx1NEVFM1x1NzgwMVwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcyhcIm1tYy1jb2RlLW1vZGFsXCIpO1xuICAgIGNvbnN0IGxhbmd1YWdlTGFiZWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTRFRTNcdTc4MDFcdThCRURcdThBMDBcIiB9KTtcbiAgICBjb25zdCBsYW5ndWFnZUlucHV0ID0gbGFuZ3VhZ2VMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiamF2YXNjcmlwdFx1MzAwMXB5dGhvblx1MzAwMWNzc1x1MjAyNlwiIH0gfSk7XG4gICAgbGFuZ3VhZ2VJbnB1dC52YWx1ZSA9IHRoaXMuYmxvY2s/Lmxhbmd1YWdlID8/IFwiXCI7XG5cbiAgICBjb25zdCBjb2RlTGFiZWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTRFRTNcdTc4MDFcdTUxODVcdTVCQjlcIiB9KTtcbiAgICBjb25zdCBjb2RlSW5wdXQgPSBjb2RlTGFiZWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7IGNsczogXCJtbWMtY29kZS10ZXh0YXJlYVwiLCBhdHRyOiB7IHNwZWxsY2hlY2s6IFwiZmFsc2VcIiwgcGxhY2Vob2xkZXI6IFwiXHU1M0VGXHU3NkY0XHU2M0E1XHU3Qzk4XHU4RDM0XHU0RUUzXHU3ODAxXHVGRjBDXHU2MjE2XHU3Qzk4XHU4RDM0IGBgYFx1OEJFRFx1OEEwMCAuLi4gYGBgIGZlbmNlZCBjb2RlIGJsb2NrXCIgfSB9KTtcbiAgICBjb2RlSW5wdXQucm93cyA9IDE4O1xuICAgIGNvZGVJbnB1dC52YWx1ZSA9IHRoaXMuYmxvY2s/LmNvZGUgPz8gXCJcIjtcblxuICAgIGNvbnN0IGRldGVjdCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdThCQzZcdTUyMkIgZmVuY2VkIGNvZGVcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBkZXRlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlRmVuY2VkQ29kZShjb2RlSW5wdXQudmFsdWUpO1xuICAgICAgaWYgKCFwYXJzZWQpIHsgbmV3IE5vdGljZShcIlx1NkNBMVx1NjcwOVx1OEJDNlx1NTIyQlx1NTIzMFx1NUI4Q1x1NjU3NFx1NzY4NCBgYGAgZmVuY2VkIGNvZGUgYmxvY2tcIik7IHJldHVybjsgfVxuICAgICAgbGFuZ3VhZ2VJbnB1dC52YWx1ZSA9IHBhcnNlZC5sYW5ndWFnZSA/PyBcIlwiO1xuICAgICAgY29kZUlucHV0LnZhbHVlID0gcGFyc2VkLmNvZGU7XG4gICAgICBuZXcgTm90aWNlKFwiXHU0RUUzXHU3ODAxXHU4QkVEXHU4QTAwXHU1NDhDXHU1MTg1XHU1QkI5XHU1REYyXHU4QkM2XHU1MjJCXCIpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYWN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbW9kYWwtYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGNhbmNlbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTNENlx1NkQ4OFwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IHNhdmUgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTRGRERcdTVCNThcdTRFRTNcdTc4MDFcIiwgdHlwZTogXCJidXR0b25cIiwgY2xzOiBcIm1vZC1jdGFcIiB9KTtcbiAgICBjYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgc2F2ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgbGV0IGxhbmd1YWdlID0gbGFuZ3VhZ2VJbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICBsZXQgY29kZSA9IGNvZGVJbnB1dC52YWx1ZTtcbiAgICAgIGNvbnN0IGZlbmNlZCA9IHBhcnNlRmVuY2VkQ29kZShjb2RlKTtcbiAgICAgIGlmIChmZW5jZWQpIHtcbiAgICAgICAgbGFuZ3VhZ2UgPSBmZW5jZWQubGFuZ3VhZ2UgPz8gbGFuZ3VhZ2U7XG4gICAgICAgIGNvZGUgPSBmZW5jZWQuY29kZTtcbiAgICAgIH1cbiAgICAgIGlmICghY29kZS50cmltKCkpIHsgbmV3IE5vdGljZShcIlx1NEVFM1x1NzgwMVx1NTE4NVx1NUJCOVx1NEUwRFx1ODBGRFx1NEUzQVx1N0E3QVwiKTsgcmV0dXJuOyB9XG4gICAgICB0aGlzLnN1Ym1pdCh7IGxhbmd1YWdlOiBsYW5ndWFnZS5yZXBsYWNlKC9bXmEtejAtOV8rIy4tXS9naSwgXCJcIikuc2xpY2UoMCwgNDApIHx8IHVuZGVmaW5lZCwgY29kZSB9KTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxtQkFVTzs7O0FDNElBLElBQU0scUJBQXFCO0FBQ2xDLElBQU0scUJBQXFCLENBQUMsWUFBWSxVQUFVO0FBRTNDLFNBQVMsUUFBZ0I7QUFDOUIsUUFBTSxTQUFTLEtBQUssT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLE1BQU0sR0FBRyxDQUFDO0FBQ3BELFNBQU8sS0FBSyxLQUFLLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxJQUFJLE1BQU07QUFDL0M7QUFFTyxTQUFTLFdBQVcsT0FBTyxzQkFBb0I7QUFDcEQsU0FBTyxFQUFF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QUFNLFdBQVcsS0FBSyxTQUFTLGdCQUFnQixtQkFBbUIscUJBQXFCLEtBQUssUUFBUSxFQUFFLENBQUM7QUFBQSxNQUMvSixTQUFTLE9BQU87QUFDZCxnQkFBUSxNQUFNLHNDQUFzQyxLQUFLO0FBQ3pELGNBQU0sTUFBTTtBQUNaLGNBQU0sVUFBVSxFQUFFLEtBQUssbUJBQW1CLE1BQU0sK0RBQWEsQ0FBQztBQUFBLE1BQ2hFO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgInRleHQiLCAiX2EiLCAiX2IiLCAiX2EiLCAiX2IiLCAiX2MiLCAiX2QiLCAiYmFja2dyb3VuZCIsICJkb2N1bWVudCIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJfYSIsICJfYiIsICJkb2N1bWVudCIsICJfYyIsICJzZWxlY3RlZCIsICJkb2N1bWVudCIsICJfYSIsICJfYiIsICJfYyIsICJkb2N1bWVudCJdCn0K
