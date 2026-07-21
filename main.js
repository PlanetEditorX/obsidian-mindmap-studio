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
    version: 9,
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
  const edgeWidthMode = input.edgeWidthMode === "uniform" || input.edgeWidthMode === "tapered" ? input.edgeWidthMode : void 0;
  const themePreset = [
    "classic-indigo",
    "ocean-blue",
    "forest-green",
    "sunset-orange",
    "lavender-dream",
    "candy-pop",
    "paper-note",
    "minimal-ink",
    "dark-neon",
    "mint-clean"
  ].includes(String(input.themePreset)) ? input.themePreset : void 0;
  const branchColors = Array.isArray(input.branchColors) ? input.branchColors.map(normalizeColor).filter((color) => Boolean(color)).slice(0, 12) : void 0;
  const customFont = typeof input.customFont === "string" && input.customFont.trim() ? input.customFont.trim().slice(0, 120) : void 0;
  const appearance = {
    themePreset,
    backgroundColor: normalizeColor(input.backgroundColor),
    backgroundPattern,
    patternColor: normalizeColor(input.patternColor),
    fontFamily,
    customFont,
    fontSize: normalizeNumber(input.fontSize, 10, 30),
    edgeColor: normalizeColor(input.edgeColor),
    edgeWidth: normalizeNumber(input.edgeWidth, 0.5, 8),
    edgeStyle,
    edgeWidthMode,
    edgeMinWidth: normalizeNumber(input.edgeMinWidth, 0.25, 8),
    rootColor: normalizeColor(input.rootColor),
    rootTextColor: normalizeColor(input.rootTextColor),
    colorfulBranches: normalizeBooleanOverride(input.colorfulBranches),
    branchColors: (branchColors == null ? void 0 : branchColors.length) ? branchColors : void 0,
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
    version: 9,
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

// src/themes.ts
var MINDMAP_THEME_PRESETS = [
  {
    id: "classic-indigo",
    name: "\u7ECF\u5178\u975B\u84DD",
    description: "\u6E05\u723D\u3001\u901A\u7528\uFF0C\u9002\u5408\u9879\u76EE\u4E0E\u77E5\u8BC6\u6574\u7406",
    appearance: {
      backgroundColor: "#f8fafc",
      backgroundPattern: "grid",
      patternColor: "#94a3b8",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#4f46e5",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#172033",
      nodeBorderColor: "#c7d2fe",
      nodeBorderWidth: 1,
      edgeColor: "#6366f1",
      edgeStyle: "curved",
      edgeWidth: 4.2,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.2,
      colorfulBranches: true,
      branchColors: ["#4f46e5", "#0284c7", "#0f766e", "#7c3aed", "#db2777", "#ea580c"]
    }
  },
  {
    id: "ocean-blue",
    name: "\u6DF1\u6D77\u84DD",
    description: "\u51B7\u9759\u3001\u4E13\u4E1A\uFF0C\u9002\u5408\u5206\u6790\u4E0E\u6280\u672F\u5185\u5BB9",
    appearance: {
      backgroundColor: "#f0f9ff",
      backgroundPattern: "dots",
      patternColor: "#7dd3fc",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#075985",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#0c4a6e",
      nodeBorderColor: "#bae6fd",
      nodeBorderWidth: 1,
      edgeColor: "#0284c7",
      edgeStyle: "curved",
      edgeWidth: 4.5,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#0369a1", "#0891b2", "#0d9488", "#2563eb", "#4f46e5", "#06b6d4"]
    }
  },
  {
    id: "forest-green",
    name: "\u68EE\u6797\u7EFF",
    description: "\u81EA\u7136\u3001\u6C89\u7A33\uFF0C\u9002\u5408\u8BA1\u5212\u4E0E\u6210\u957F\u4E3B\u9898",
    appearance: {
      backgroundColor: "#f7fee7",
      backgroundPattern: "dots",
      patternColor: "#86efac",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#3f6212",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#365314",
      nodeBorderColor: "#bbf7d0",
      nodeBorderWidth: 1,
      edgeColor: "#65a30d",
      edgeStyle: "curved",
      edgeWidth: 4,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#4d7c0f", "#15803d", "#0f766e", "#65a30d", "#059669", "#84cc16"]
    }
  },
  {
    id: "sunset-orange",
    name: "\u65E5\u843D\u6A59",
    description: "\u6E29\u6696\u3001\u6709\u6D3B\u529B\uFF0C\u9002\u5408\u521B\u610F\u4E0E\u8425\u9500\u5185\u5BB9",
    appearance: {
      backgroundColor: "#fff7ed",
      backgroundPattern: "grid",
      patternColor: "#fdba74",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#c2410c",
      rootTextColor: "#ffffff",
      nodeColor: "#fffaf5",
      textColor: "#7c2d12",
      nodeBorderColor: "#fed7aa",
      nodeBorderWidth: 1,
      edgeColor: "#f97316",
      edgeStyle: "curved",
      edgeWidth: 4.4,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.2,
      colorfulBranches: true,
      branchColors: ["#ea580c", "#f59e0b", "#dc2626", "#db2777", "#d97706", "#f97316"]
    }
  },
  {
    id: "lavender-dream",
    name: "\u85B0\u8863\u8349",
    description: "\u67D4\u548C\u3001\u4F18\u96C5\uFF0C\u9002\u5408\u9605\u8BFB\u7B14\u8BB0\u4E0E\u7075\u611F\u6574\u7406",
    appearance: {
      backgroundColor: "#faf5ff",
      backgroundPattern: "dots",
      patternColor: "#d8b4fe",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#7e22ce",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#581c87",
      nodeBorderColor: "#e9d5ff",
      nodeBorderWidth: 1,
      edgeColor: "#a855f7",
      edgeStyle: "curved",
      edgeWidth: 4,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#9333ea", "#c026d3", "#7c3aed", "#db2777", "#6366f1", "#a855f7"]
    }
  },
  {
    id: "candy-pop",
    name: "\u7CD6\u679C\u7F24\u7EB7",
    description: "\u591A\u5F69\u3001\u8F7B\u5FEB\uFF0C\u9002\u5408\u5934\u8111\u98CE\u66B4\u4E0E\u751F\u6D3B\u8BB0\u5F55",
    appearance: {
      backgroundColor: "#fff7fb",
      backgroundPattern: "dots",
      patternColor: "#f9a8d4",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#db2777",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#4a1630",
      nodeBorderColor: "#fbcfe8",
      nodeBorderWidth: 1,
      edgeColor: "#ec4899",
      edgeStyle: "curved",
      edgeWidth: 4.2,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.1,
      colorfulBranches: true,
      branchColors: ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"]
    }
  },
  {
    id: "paper-note",
    name: "\u7EB8\u5F20\u7B14\u8BB0",
    description: "\u6E29\u6DA6\u3001\u4E66\u5199\u611F\uFF0C\u9002\u5408\u8BFB\u4E66\u7B14\u8BB0\u4E0E\u957F\u6587\u68B3\u7406",
    appearance: {
      backgroundColor: "#fffdf7",
      backgroundPattern: "grid",
      patternColor: "#d6c8ad",
      fontFamily: "serif",
      fontSize: 15,
      rootColor: "#7c2d12",
      rootTextColor: "#fffaf0",
      nodeColor: "#fffaf0",
      textColor: "#3f2a1d",
      nodeBorderColor: "#d6c8ad",
      nodeBorderWidth: 1,
      edgeColor: "#9a6b42",
      edgeStyle: "curved",
      edgeWidth: 3.6,
      edgeWidthMode: "tapered",
      edgeMinWidth: 0.9,
      colorfulBranches: true,
      branchColors: ["#9a3412", "#a16207", "#4d7c0f", "#0f766e", "#7e22ce", "#be123c"]
    }
  },
  {
    id: "minimal-ink",
    name: "\u6781\u7B80\u58A8\u8272",
    description: "\u9ED1\u767D\u514B\u5236\uFF0C\u9002\u5408\u6B63\u5F0F\u6587\u6863\u4E0E\u7ED3\u6784\u56FE",
    appearance: {
      backgroundColor: "#ffffff",
      backgroundPattern: "none",
      patternColor: "#d1d5db",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#111827",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#111827",
      nodeBorderColor: "#9ca3af",
      nodeBorderWidth: 1,
      edgeColor: "#4b5563",
      edgeStyle: "straight",
      edgeWidth: 3.2,
      edgeWidthMode: "tapered",
      edgeMinWidth: 0.8,
      colorfulBranches: false,
      branchColors: ["#111827", "#374151", "#4b5563", "#6b7280"]
    }
  },
  {
    id: "dark-neon",
    name: "\u6697\u591C\u9713\u8679",
    description: "\u9AD8\u5BF9\u6BD4\u6DF1\u8272\u4E3B\u9898\uFF0C\u9002\u5408\u591C\u95F4\u4E0E\u79D1\u6280\u5185\u5BB9",
    appearance: {
      backgroundColor: "#080d1a",
      backgroundPattern: "dots",
      patternColor: "#334155",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#7c3aed",
      rootTextColor: "#ffffff",
      nodeColor: "#111827",
      textColor: "#e5e7eb",
      nodeBorderColor: "#334155",
      nodeBorderWidth: 1,
      edgeColor: "#818cf8",
      edgeStyle: "curved",
      edgeWidth: 4.6,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1.1,
      colorfulBranches: true,
      branchColors: ["#8b5cf6", "#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#60a5fa"]
    }
  },
  {
    id: "mint-clean",
    name: "\u8584\u8377\u6E05\u65B0",
    description: "\u6E05\u900F\u3001\u7B80\u6D01\uFF0C\u9002\u5408\u5DE5\u4F5C\u6E05\u5355\u4E0E\u6D41\u7A0B\u68B3\u7406",
    appearance: {
      backgroundColor: "#f0fdfa",
      backgroundPattern: "grid",
      patternColor: "#99f6e4",
      fontFamily: "sans",
      fontSize: 14,
      rootColor: "#047857",
      rootTextColor: "#ffffff",
      nodeColor: "#ffffff",
      textColor: "#134e4a",
      nodeBorderColor: "#a7f3d0",
      nodeBorderWidth: 1,
      edgeColor: "#14b8a6",
      edgeStyle: "curved",
      edgeWidth: 4,
      edgeWidthMode: "tapered",
      edgeMinWidth: 1,
      colorfulBranches: true,
      branchColors: ["#059669", "#0d9488", "#0891b2", "#65a30d", "#0284c7", "#10b981"]
    }
  }
];
function getMindMapThemePreset(id) {
  return MINDMAP_THEME_PRESETS.find((preset) => preset.id === id);
}
function appearanceFromThemePreset(id) {
  var _a;
  const preset = (_a = getMindMapThemePreset(id)) != null ? _a : MINDMAP_THEME_PRESETS[0];
  return {
    ...preset.appearance,
    themePreset: preset.id,
    branchColors: preset.appearance.branchColors ? [...preset.appearance.branchColors] : void 0
  };
}

// src/settings.ts
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
  defaultThemePreset: "classic-indigo",
  backgroundColor: "#f8fafc",
  backgroundPattern: "grid",
  backgroundPatternColor: "#94a3b8",
  fontFamily: "obsidian",
  customFont: "",
  fontSize: 14,
  edgeColor: "#6366f1",
  edgeWidth: 4.2,
  edgeStyle: "curved",
  edgeWidthMode: "tapered",
  edgeMinWidth: 1.2,
  rootColor: "#4f46e5",
  rootTextColor: "#ffffff",
  colorfulBranches: true,
  branchColors: ["#4f46e5", "#0284c7", "#0f766e", "#7c3aed", "#db2777", "#ea580c"],
  nodeBackgroundColor: "#ffffff",
  textColor: "#172033",
  nodeBorderColor: "#c7d2fe",
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
    themePreset: settings.defaultThemePreset,
    backgroundColor: settings.backgroundColor || void 0,
    backgroundPattern: settings.backgroundPattern,
    patternColor: settings.backgroundPatternColor || void 0,
    fontFamily: settings.fontFamily,
    customFont: settings.customFont.trim() || void 0,
    fontSize: settings.fontSize,
    edgeColor: settings.edgeColor || void 0,
    edgeWidth: settings.edgeWidth,
    edgeStyle: settings.edgeStyle,
    edgeWidthMode: settings.edgeWidthMode,
    edgeMinWidth: settings.edgeMinWidth,
    rootColor: settings.rootColor || void 0,
    rootTextColor: settings.rootTextColor || void 0,
    colorfulBranches: settings.colorfulBranches,
    branchColors: settings.branchColors.length ? [...settings.branchColors] : void 0,
    nodeColor: settings.nodeBackgroundColor || void 0,
    textColor: settings.textColor || void 0,
    nodeBorderColor: settings.nodeBorderColor || void 0,
    nodeBorderWidth: settings.nodeBorderWidth,
    bold: settings.defaultTextBold,
    italic: settings.defaultTextItalic,
    underline: settings.defaultTextUnderline
  };
}
function applyThemePresetToSettings(settings, presetId) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const appearance = appearanceFromThemePreset(presetId);
  settings.defaultThemePreset = presetId;
  settings.backgroundColor = (_a = appearance.backgroundColor) != null ? _a : "";
  settings.backgroundPattern = (_b = appearance.backgroundPattern) != null ? _b : "none";
  settings.backgroundPatternColor = (_c = appearance.patternColor) != null ? _c : "#94a3b8";
  settings.fontFamily = (_d = appearance.fontFamily) != null ? _d : "obsidian";
  settings.customFont = (_e = appearance.customFont) != null ? _e : "";
  settings.fontSize = (_f = appearance.fontSize) != null ? _f : 14;
  settings.edgeColor = (_g = appearance.edgeColor) != null ? _g : "";
  settings.edgeWidth = (_h = appearance.edgeWidth) != null ? _h : 2.2;
  settings.edgeStyle = (_i = appearance.edgeStyle) != null ? _i : "curved";
  settings.edgeWidthMode = (_j = appearance.edgeWidthMode) != null ? _j : "uniform";
  settings.edgeMinWidth = (_k = appearance.edgeMinWidth) != null ? _k : Math.min(1, settings.edgeWidth);
  settings.rootColor = (_l = appearance.rootColor) != null ? _l : "";
  settings.rootTextColor = (_m = appearance.rootTextColor) != null ? _m : "";
  settings.colorfulBranches = appearance.colorfulBranches === true;
  settings.branchColors = appearance.branchColors ? [...appearance.branchColors] : [];
  settings.nodeBackgroundColor = (_n = appearance.nodeColor) != null ? _n : "";
  settings.textColor = (_o = appearance.textColor) != null ? _o : "";
  settings.nodeBorderColor = (_p = appearance.nodeBorderColor) != null ? _p : "";
  settings.nodeBorderWidth = (_q = appearance.nodeBorderWidth) != null ? _q : 1;
  settings.defaultTextBold = appearance.bold === true;
  settings.defaultTextItalic = appearance.italic === true;
  settings.defaultTextUnderline = appearance.underline === true;
}
var MindMapStudioSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    var _a;
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "MindMap Studio" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "\u8FD9\u91CC\u8BBE\u7F6E\u5168\u5C40\u9ED8\u8BA4\u5916\u89C2\u3002\u6253\u5F00\u8111\u56FE\u540E\uFF0C\u4E5F\u53EF\u4EE5\u70B9\u51FB\u5DE5\u5177\u680F\u4E2D\u7684\u8C03\u8272\u677F\uFF0C\u4E3A\u5F53\u524D\u8111\u56FE\u5355\u72EC\u4FDD\u5B58\u4E00\u5957\u6837\u5F0F\u3002"
    });
    containerEl.createEl("h3", { text: "\u4E3B\u9898\u6A21\u677F" });
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u4E3B\u9898").setDesc("\u9009\u62E9\u540E\u4F1A\u4E00\u6B21\u5E94\u7528\u80CC\u666F\u3001\u8282\u70B9\u3001\u5206\u652F\u914D\u8272\u3001\u5B57\u4F53\u548C\u8FDE\u7EBF\u6837\u5F0F\uFF1B\u4E4B\u540E\u4ECD\u53EF\u7EE7\u7EED\u4FEE\u6539\u5355\u9879\u8BBE\u7F6E\u3002").addDropdown((dropdown) => {
      for (const preset of MINDMAP_THEME_PRESETS) dropdown.addOption(preset.id, preset.name);
      dropdown.setValue(this.plugin.settings.defaultThemePreset);
      dropdown.onChange(async (value) => {
        applyThemePresetToSettings(this.plugin.settings, value);
        await this.saveAndRefresh();
        this.display();
      });
    });
    const themePreview = containerEl.createDiv({ cls: "mms-theme-preview-row" });
    for (const preset of MINDMAP_THEME_PRESETS) {
      const card = themePreview.createEl("button", {
        cls: `mms-theme-preview-card${preset.id === this.plugin.settings.defaultThemePreset ? " is-selected" : ""}`,
        attr: { type: "button", title: preset.description }
      });
      const swatches = card.createDiv({ cls: "mms-theme-preview-swatches" });
      const colors = [preset.appearance.rootColor, ...((_a = preset.appearance.branchColors) != null ? _a : []).slice(0, 4)].filter((color) => Boolean(color));
      colors.forEach((color) => {
        const dot = swatches.createSpan();
        dot.style.backgroundColor = color;
      });
      card.createDiv({ cls: "mms-theme-preview-name", text: preset.name });
      card.addEventListener("click", () => {
        applyThemePresetToSettings(this.plugin.settings, preset.id);
        void this.saveAndRefresh().then(() => this.display());
      });
    }
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
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u660E\u6697\u6A21\u5F0F").addDropdown((dropdown) => dropdown.addOption("auto", "\u8DDF\u968F Obsidian").addOption("light", "\u6D45\u8272").addOption("dark", "\u6DF1\u8272").setValue(this.plugin.settings.defaultTheme).onChange(async (value) => {
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
    this.addOptionalColorSetting(
      containerEl,
      "\u4E2D\u5FC3\u4E3B\u9898\u989C\u8272",
      "\u6839\u8282\u70B9\u7684\u80CC\u666F\u989C\u8272\u3002\u4E3B\u9898\u6A21\u677F\u4F1A\u81EA\u52A8\u8BBE\u7F6E\u3002",
      () => this.plugin.settings.rootColor,
      async (value) => {
        this.plugin.settings.rootColor = value;
      },
      "#4f46e5"
    );
    this.addOptionalColorSetting(
      containerEl,
      "\u4E2D\u5FC3\u4E3B\u9898\u6587\u5B57\u989C\u8272",
      "\u6839\u8282\u70B9\u7684\u6587\u5B57\u989C\u8272\u3002",
      () => this.plugin.settings.rootTextColor,
      async (value) => {
        this.plugin.settings.rootTextColor = value;
      },
      "#ffffff"
    );
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
    new import_obsidian.Setting(containerEl).setName("\u5F69\u8272\u5206\u652F").setDesc("\u6309\u7167\u4E2D\u5FC3\u4E3B\u9898\u7684\u4E00\u7EA7\u5206\u652F\u5206\u914D\u989C\u8272\uFF0C\u540C\u4E00\u5206\u652F\u7684\u8282\u70B9\u8FB9\u6846\u548C\u8FDE\u7EBF\u4FDD\u6301\u4E00\u81F4\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.colorfulBranches).onChange(async (value) => {
      this.plugin.settings.colorfulBranches = value;
      await this.saveAndRefresh();
    }));
    new import_obsidian.Setting(containerEl).setName("\u5206\u652F\u989C\u8272").setDesc("\u4F7F\u7528\u9017\u53F7\u5206\u9694\u7684\u5341\u516D\u8FDB\u5236\u989C\u8272\uFF0C\u4E00\u7EA7\u5206\u652F\u4F1A\u5FAA\u73AF\u4F7F\u7528\u3002").addTextArea((text) => text.setPlaceholder("#4f46e5, #0284c7, #0f766e").setValue(this.plugin.settings.branchColors.join(", ")).onChange(async (value) => {
      this.plugin.settings.branchColors = value.split(/[,，\s]+/).map((item) => item.trim()).filter((item) => /^#[0-9a-f]{6}$/i.test(item)).slice(0, 12);
      await this.saveAndRefresh();
    }));
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
    new import_obsidian.Setting(containerEl).setName("\u8FDE\u7EBF\u7C97\u7EC6\u6A21\u5F0F").setDesc("\u201C\u4ECE\u7C97\u5230\u7EC6\u201D\u4F1A\u8BA9\u9760\u8FD1\u4E2D\u5FC3\u4E3B\u9898\u7684\u7EBF\u6700\u7C97\uFF0C\u8D8A\u6DF1\u5C42\u8D8A\u7EC6\u3002").addDropdown((dropdown) => dropdown.addOption("uniform", "\u7EDF\u4E00\u7C97\u7EC6").addOption("tapered", "\u4ECE\u7C97\u5230\u7EC6").setValue(this.plugin.settings.edgeWidthMode).onChange(async (value) => {
      this.plugin.settings.edgeWidthMode = value;
      await this.saveAndRefresh();
      this.display();
    }));
    new import_obsidian.Setting(containerEl).setName(this.plugin.settings.edgeWidthMode === "tapered" ? "\u8D77\u59CB\u7C97\u7EC6" : "\u8FDE\u7EBF\u7C97\u7EC6").setDesc("\u9760\u8FD1\u4E2D\u5FC3\u4E3B\u9898\u7684\u8FDE\u7EBF\u5BBD\u5EA6\uFF0C\u8303\u56F4 0.5\u20138 \u50CF\u7D20\u3002").addSlider((slider) => slider.setLimits(0.5, 8, 0.25).setDynamicTooltip().setValue(this.plugin.settings.edgeWidth).onChange(async (value) => {
      this.plugin.settings.edgeWidth = value;
      if (this.plugin.settings.edgeMinWidth > value) this.plugin.settings.edgeMinWidth = value;
      await this.saveAndRefresh();
    }));
    if (this.plugin.settings.edgeWidthMode === "tapered") {
      new import_obsidian.Setting(containerEl).setName("\u672B\u7AEF\u6700\u7EC6\u5BBD\u5EA6").setDesc("\u6DF1\u5C42\u5206\u652F\u4E0D\u4F1A\u7EC6\u4E8E\u8BE5\u503C\uFF0C\u8303\u56F4 0.25\u20134 \u50CF\u7D20\u3002").addSlider((slider) => slider.setLimits(0.25, 4, 0.25).setDynamicTooltip().setValue(this.plugin.settings.edgeMinWidth).onChange(async (value) => {
        this.plugin.settings.edgeMinWidth = Math.min(value, this.plugin.settings.edgeWidth);
        await this.saveAndRefresh();
      }));
    }
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
function buildBranchColorMap(root, colors) {
  const result = /* @__PURE__ */ new Map();
  if (!(colors == null ? void 0 : colors.length)) return result;
  const visit = (node, color) => {
    result.set(node.id, color);
    node.children.forEach((child) => visit(child, color));
  };
  root.children.forEach((child, index) => visit(child, colors[index % colors.length]));
  return result;
}
function edgeWidthForDepth(appearance, depth) {
  var _a, _b;
  const maximum = Math.max(0.5, Math.min(8, (_a = appearance.edgeWidth) != null ? _a : 2.2));
  if (appearance.edgeWidthMode !== "tapered") return maximum;
  const minimum = Math.max(0.25, Math.min(maximum, (_b = appearance.edgeMinWidth) != null ? _b : Math.min(1, maximum)));
  const progress = Math.min(1, Math.max(0, depth - 1) / 4);
  return Number((maximum + (minimum - maximum) * progress).toFixed(3));
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
  var _a, _b, _c;
  const defaultFontSize = (_a = appearance.fontSize) != null ? _a : 14;
  const layout = computeLayout(root, mode, defaultFontSize);
  const padding = 72;
  const width = Math.max(320, layout.maxX - layout.minX + padding * 2);
  const height = Math.max(220, layout.maxY - layout.minY + padding * 2);
  const offsetX = padding - layout.minX;
  const offsetY = padding - layout.minY;
  const edgeStyle = (_b = appearance.edgeStyle) != null ? _b : "curved";
  const defaultEdge = validColor(appearance.edgeColor, "#7c8aa5");
  const branchColorMap = appearance.colorfulBranches ? buildBranchColorMap(root, appearance.branchColors) : /* @__PURE__ */ new Map();
  const edges = layout.nodes.filter((position) => position.parentId).map((position) => {
    var _a2, _b2;
    const parent = position.parentId ? layout.byId.get(position.parentId) : void 0;
    const stroke = validColor((_a2 = position.node.style) == null ? void 0 : _a2.color, (_b2 = branchColorMap.get(position.node.id)) != null ? _b2 : defaultEdge);
    const width2 = edgeWidthForDepth(appearance, position.depth);
    return parent ? `<path d="${edgePath(parent, position, edgeStyle)}" fill="none" stroke="${stroke}" stroke-width="${width2}" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>` : "";
  }).join("\n");
  const nodes = layout.nodes.map((position) => {
    var _a2, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
    const node = position.node;
    const x = position.x - position.width / 2;
    const y = position.y - position.height / 2;
    const isRoot = position.depth === 0;
    const defaultBackground = isRoot ? validColor(appearance.rootColor, "#4f46e5") : validColor(appearance.nodeColor, "#ffffff");
    const defaultText = isRoot ? validColor(appearance.rootTextColor, "#ffffff") : validColor(appearance.textColor, "#0f172a");
    const background2 = validColor((_a2 = node.style) == null ? void 0 : _a2.color, defaultBackground);
    const foreground = validColor((_b2 = node.style) == null ? void 0 : _b2.textColor, defaultText);
    const branchColor = branchColorMap.get(node.id);
    const border = validColor((_c2 = node.style) == null ? void 0 : _c2.borderColor, isRoot ? background2 : branchColor != null ? branchColor : validColor(appearance.nodeBorderColor, "#94a3b8"));
    const borderWidth = (_f = (_e = (_d = node.style) == null ? void 0 : _d.borderWidth) != null ? _e : appearance.nodeBorderWidth) != null ? _f : isRoot ? 2 : 1;
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
  const pattern = (_c = appearance.backgroundPattern) != null ? _c : "none";
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
    this.titleEl.setText("\u5F53\u524D\u8111\u56FE\u5916\u89C2");
    this.contentEl.addClass("mmc-appearance-modal");
    const form = this.contentEl.createEl("form");
    form.createEl("p", { cls: "setting-item-description", text: "\u5148\u9009\u62E9\u4E00\u5957\u4E3B\u9898\uFF0C\u518D\u6309\u9700\u8981\u4FEE\u6539\u80CC\u666F\u3001\u8282\u70B9\u3001\u5B57\u4F53\u548C\u8FDE\u7EBF\u3002\u8BBE\u7F6E\u53EA\u4FDD\u5B58\u5230\u5F53\u524D .mindmap \u6587\u4EF6\u3002" });
    let selectedPreset = (_a = this.appearance.themePreset) != null ? _a : "classic-indigo";
    const themeSection = form.createDiv({ cls: "mmc-theme-picker" });
    themeSection.createDiv({ cls: "mmc-theme-picker-title", text: "\u4E3B\u9898\u6A21\u677F" });
    const themeGrid = themeSection.createDiv({ cls: "mmc-theme-card-grid" });
    const themeCards = /* @__PURE__ */ new Map();
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
    patternSelect.value = (_b = this.appearance.backgroundPattern) != null ? _b : "grid";
    const patternColor = addColor("\u56FE\u6848\u989C\u8272", this.appearance.patternColor, "#94a3b8");
    const fontLabel = grid.createEl("label", { text: "\u5B57\u4F53" });
    const fontSelect = fontLabel.createEl("select");
    for (const [value, label] of [["obsidian", "\u8DDF\u968F Obsidian"], ["sans", "\u65E0\u886C\u7EBF"], ["serif", "\u886C\u7EBF"], ["mono", "\u7B49\u5BBD"], ["custom", "\u81EA\u5B9A\u4E49"]]) fontSelect.createEl("option", { text: label, attr: { value } });
    fontSelect.value = (_c = this.appearance.fontFamily) != null ? _c : "obsidian";
    const customFontLabel = grid.createEl("label", { text: "\u81EA\u5B9A\u4E49\u5B57\u4F53\u540D\u79F0" });
    const customFontInput = customFontLabel.createEl("input", { type: "text", attr: { placeholder: "Microsoft YaHei" } });
    customFontInput.value = (_d = this.appearance.customFont) != null ? _d : "";
    const updateCustomFont = () => {
      customFontInput.disabled = fontSelect.value !== "custom";
    };
    fontSelect.addEventListener("change", updateCustomFont);
    updateCustomFont();
    const fontSizeLabel = grid.createEl("label", { text: "\u5B57\u53F7\uFF0810\u201330\uFF09" });
    const fontSizeInput = fontSizeLabel.createEl("input", { type: "number", attr: { min: "10", max: "30", step: "1" } });
    fontSizeInput.value = String((_e = this.appearance.fontSize) != null ? _e : 14);
    const rootColor = addColor("\u4E2D\u5FC3\u4E3B\u9898\u989C\u8272", this.appearance.rootColor, "#4f46e5");
    const rootTextColor = addColor("\u4E2D\u5FC3\u4E3B\u9898\u6587\u5B57", this.appearance.rootTextColor, "#ffffff");
    const nodeColor = addColor("\u8282\u70B9\u80CC\u666F\u8272", this.appearance.nodeColor, "#ffffff");
    const textColor = addColor("\u6587\u5B57\u989C\u8272", this.appearance.textColor, "#0f172a");
    const borderColor = addColor("\u8282\u70B9\u8FB9\u6846\u989C\u8272", this.appearance.nodeBorderColor, "#94a3b8");
    const borderWidthLabel = grid.createEl("label", { text: "\u8FB9\u6846\u7C97\u7EC6\uFF080\u20136\uFF09" });
    const borderWidthInput = borderWidthLabel.createEl("input", { type: "number", attr: { min: "0", max: "6", step: "0.5" } });
    borderWidthInput.value = String((_f = this.appearance.nodeBorderWidth) != null ? _f : 1);
    const edgeColor = addColor("\u8FDE\u7EBF\u989C\u8272", this.appearance.edgeColor, "#7c8aa5");
    const edgeStyleLabel = grid.createEl("label", { text: "\u8FDE\u7EBF\u7C7B\u578B" });
    const edgeStyleSelect = edgeStyleLabel.createEl("select");
    for (const [value, label] of [["curved", "\u66F2\u7EBF"], ["straight", "\u76F4\u7EBF"], ["elbow", "\u6298\u7EBF"]]) edgeStyleSelect.createEl("option", { text: label, attr: { value } });
    edgeStyleSelect.value = (_g = this.appearance.edgeStyle) != null ? _g : "curved";
    const edgeWidthModeLabel = grid.createEl("label", { text: "\u8FDE\u7EBF\u7C97\u7EC6\u6A21\u5F0F" });
    const edgeWidthModeSelect = edgeWidthModeLabel.createEl("select");
    edgeWidthModeSelect.createEl("option", { text: "\u7EDF\u4E00\u7C97\u7EC6", attr: { value: "uniform" } });
    edgeWidthModeSelect.createEl("option", { text: "\u4ECE\u7C97\u5230\u7EC6", attr: { value: "tapered" } });
    edgeWidthModeSelect.value = (_h = this.appearance.edgeWidthMode) != null ? _h : "tapered";
    const edgeWidthLabel = grid.createEl("label", { text: "\u8D77\u59CB\u7C97\u7EC6\uFF080.5\u20138\uFF09" });
    const edgeWidthInput = edgeWidthLabel.createEl("input", { type: "number", attr: { min: "0.5", max: "8", step: "0.25" } });
    edgeWidthInput.value = String((_i = this.appearance.edgeWidth) != null ? _i : 4.2);
    const edgeMinWidthLabel = grid.createEl("label", { text: "\u672B\u7AEF\u6700\u7EC6\uFF080.25\u20134\uFF09" });
    const edgeMinWidthInput = edgeMinWidthLabel.createEl("input", { type: "number", attr: { min: "0.25", max: "4", step: "0.25" } });
    edgeMinWidthInput.value = String((_j = this.appearance.edgeMinWidth) != null ? _j : 1.2);
    const updateEdgeMin = () => {
      const tapered = edgeWidthModeSelect.value === "tapered";
      edgeMinWidthInput.disabled = !tapered;
      edgeMinWidthLabel.toggleClass("is-disabled", !tapered);
      edgeWidthLabel.childNodes[0].textContent = tapered ? "\u8D77\u59CB\u7C97\u7EC6\uFF080.5\u20138\uFF09" : "\u8FDE\u7EBF\u7C97\u7EC6\uFF080.5\u20138\uFF09";
    };
    edgeWidthModeSelect.addEventListener("change", updateEdgeMin);
    updateEdgeMin();
    const branchLabel = grid.createEl("label", { text: "\u5F69\u8272\u5206\u652F" });
    const branchToggleRow = branchLabel.createDiv({ cls: "mmc-toggle-row" });
    const colorfulBranches = branchToggleRow.createEl("input", { type: "checkbox" });
    colorfulBranches.checked = this.appearance.colorfulBranches === true;
    branchToggleRow.createSpan({ text: "\u6309\u4E00\u7EA7\u5206\u652F\u5FAA\u73AF\u914D\u8272" });
    const branchColorsLabel = grid.createEl("label", { text: "\u5206\u652F\u989C\u8272\uFF08\u9017\u53F7\u5206\u9694\uFF09" });
    const branchColorsInput = branchColorsLabel.createEl("textarea", { attr: { rows: "2", placeholder: "#4f46e5, #0284c7, #0f766e" } });
    branchColorsInput.value = ((_k = this.appearance.branchColors) != null ? _k : []).join(", ");
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
    const setColor = (control, value, fallback) => {
      control.toggle.checked = Boolean(value);
      control.input.value = value != null ? value : fallback;
      control.input.disabled = !control.toggle.checked;
    };
    const updateSelectedCards = () => {
      for (const [id, card] of themeCards) card.toggleClass("is-selected", id === selectedPreset);
    };
    const applyPreset = (presetId) => {
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2;
      selectedPreset = presetId;
      const appearance = appearanceFromThemePreset(presetId);
      setColor(background, appearance.backgroundColor, "#f8fafc");
      patternSelect.value = (_a2 = appearance.backgroundPattern) != null ? _a2 : "none";
      setColor(patternColor, appearance.patternColor, "#94a3b8");
      fontSelect.value = (_b2 = appearance.fontFamily) != null ? _b2 : "obsidian";
      customFontInput.value = (_c2 = appearance.customFont) != null ? _c2 : "";
      fontSizeInput.value = String((_d2 = appearance.fontSize) != null ? _d2 : 14);
      setColor(rootColor, appearance.rootColor, "#4f46e5");
      setColor(rootTextColor, appearance.rootTextColor, "#ffffff");
      setColor(nodeColor, appearance.nodeColor, "#ffffff");
      setColor(textColor, appearance.textColor, "#0f172a");
      setColor(borderColor, appearance.nodeBorderColor, "#94a3b8");
      borderWidthInput.value = String((_e2 = appearance.nodeBorderWidth) != null ? _e2 : 1);
      setColor(edgeColor, appearance.edgeColor, "#7c8aa5");
      edgeStyleSelect.value = (_f2 = appearance.edgeStyle) != null ? _f2 : "curved";
      edgeWidthModeSelect.value = (_g2 = appearance.edgeWidthMode) != null ? _g2 : "uniform";
      edgeWidthInput.value = String((_h2 = appearance.edgeWidth) != null ? _h2 : 2.2);
      edgeMinWidthInput.value = String((_i2 = appearance.edgeMinWidth) != null ? _i2 : 1);
      colorfulBranches.checked = appearance.colorfulBranches === true;
      branchColorsInput.value = ((_j2 = appearance.branchColors) != null ? _j2 : []).join(", ");
      bold.checked = appearance.bold === true;
      italic.checked = appearance.italic === true;
      underline.checked = appearance.underline === true;
      updateCustomFont();
      updateEdgeMin();
      updateSelectedCards();
    };
    for (const preset of MINDMAP_THEME_PRESETS) {
      const card = themeGrid.createEl("button", { cls: "mmc-theme-card", attr: { type: "button", title: preset.description } });
      themeCards.set(preset.id, card);
      const preview = card.createDiv({ cls: "mmc-theme-card-preview" });
      preview.style.backgroundColor = (_l = preset.appearance.backgroundColor) != null ? _l : "#ffffff";
      const root = preview.createSpan({ cls: "mmc-theme-card-root" });
      root.style.backgroundColor = (_m = preset.appearance.rootColor) != null ? _m : "#4f46e5";
      const branches = preview.createDiv({ cls: "mmc-theme-card-branches" });
      ((_o = preset.appearance.branchColors) != null ? _o : [(_n = preset.appearance.edgeColor) != null ? _n : "#7c8aa5"]).slice(0, 4).forEach((color, index) => {
        const line = branches.createSpan();
        line.style.backgroundColor = color;
        line.style.width = `${28 - index * 4}px`;
        line.style.height = `${Math.max(2, 5 - index)}px`;
      });
      card.createDiv({ cls: "mmc-theme-card-name", text: preset.name });
      card.addEventListener("click", () => applyPreset(preset.id));
    }
    updateSelectedCards();
    const clamp = (value, min, max, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    };
    const parseBranchColors = () => branchColorsInput.value.split(/[,，\s]+/).map((value) => value.trim()).filter((value) => /^#[0-9a-f]{6}$/i.test(value)).slice(0, 12);
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
      const maxWidth = clamp(edgeWidthInput.value, 0.5, 8, 4.2);
      this.submit({
        themePreset: selectedPreset,
        backgroundColor: background.toggle.checked ? background.input.value : void 0,
        backgroundPattern: patternSelect.value,
        patternColor: patternColor.toggle.checked ? patternColor.input.value : void 0,
        fontFamily: fontSelect.value,
        customFont: fontSelect.value === "custom" ? customFontInput.value.trim().slice(0, 120) || void 0 : void 0,
        fontSize: clamp(fontSizeInput.value, 10, 30, 14),
        rootColor: rootColor.toggle.checked ? rootColor.input.value : void 0,
        rootTextColor: rootTextColor.toggle.checked ? rootTextColor.input.value : void 0,
        nodeColor: nodeColor.toggle.checked ? nodeColor.input.value : void 0,
        textColor: textColor.toggle.checked ? textColor.input.value : void 0,
        nodeBorderColor: borderColor.toggle.checked ? borderColor.input.value : void 0,
        nodeBorderWidth: clamp(borderWidthInput.value, 0, 6, 1),
        edgeColor: edgeColor.toggle.checked ? edgeColor.input.value : void 0,
        edgeWidth: maxWidth,
        edgeStyle: edgeStyleSelect.value,
        edgeWidthMode: edgeWidthModeSelect.value,
        edgeMinWidth: Math.min(maxWidth, clamp(edgeMinWidthInput.value, 0.25, 4, 1.2)),
        colorfulBranches: colorfulBranches.checked,
        branchColors: parseBranchColors(),
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
    setOrRemove("--mmc-root-bg", appearance.rootColor);
    setOrRemove("--mmc-root-text", appearance.rootTextColor);
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
    const branchColorMap = appearance.colorfulBranches ? buildBranchColorMap(this.document.root, appearance.branchColors) : /* @__PURE__ */ new Map();
    this.nodesLayerEl.empty();
    while (this.edgesSvg.firstChild) this.edgesSvg.removeChild(this.edgesSvg.firstChild);
    for (const position of this.layout.nodes) {
      if (!position.parentId) continue;
      const parent = this.layout.byId.get(position.parentId);
      if (!parent) continue;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", edgePath(parent, position, (_b = appearance.edgeStyle) != null ? _b : "curved"));
      path.setAttribute("class", `mmc-edge depth-${Math.min(position.depth, 6)}`);
      const branchColor = branchColorMap.get(position.node.id);
      if ((_c = position.node.style) == null ? void 0 : _c.color) path.style.stroke = position.node.style.color;
      else if (branchColor) path.style.stroke = branchColor;
      path.style.strokeWidth = `${edgeWidthForDepth(appearance, position.depth)}px`;
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
      const branchColor = branchColorMap.get(node.id);
      if ((_o = node.style) == null ? void 0 : _o.color) nodeEl.style.backgroundColor = node.style.color;
      else if (isRoot && appearance.rootColor) nodeEl.style.backgroundColor = appearance.rootColor;
      else if (!isRoot && appearance.nodeColor) nodeEl.style.backgroundColor = appearance.nodeColor;
      if ((_p = node.style) == null ? void 0 : _p.textColor) nodeEl.style.color = node.style.textColor;
      else if (isRoot && appearance.rootTextColor) nodeEl.style.color = appearance.rootTextColor;
      else if (!isRoot && appearance.textColor) nodeEl.style.color = appearance.textColor;
      if ((_q = node.style) == null ? void 0 : _q.borderColor) nodeEl.style.borderColor = node.style.borderColor;
      else if (!isRoot && branchColor) nodeEl.style.borderColor = branchColor;
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
    this.branchClipboard = cloneDocument({ version: 9, title: nodePlainText(selected) || "\u56FE\u7247\u8282\u70B9", layout: "right", theme: "auto", root: selected }).root;
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
    const hadStoredSettings = loaded !== null && loaded !== void 0;
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
      imageFailoverUseLocalFallback: raw.imageFailoverUseLocalFallback !== false,
      defaultThemePreset: [
        "classic-indigo",
        "ocean-blue",
        "forest-green",
        "sunset-orange",
        "lavender-dream",
        "candy-pop",
        "paper-note",
        "minimal-ink",
        "dark-neon",
        "mint-clean"
      ].includes(String(raw.defaultThemePreset)) ? raw.defaultThemePreset : DEFAULT_SETTINGS.defaultThemePreset,
      edgeWidthMode: raw.edgeWidthMode === "uniform" || raw.edgeWidthMode === "tapered" ? raw.edgeWidthMode : hadStoredSettings ? "uniform" : DEFAULT_SETTINGS.edgeWidthMode,
      edgeMinWidth: typeof raw.edgeMinWidth === "number" ? Math.max(0.25, Math.min(8, raw.edgeMinWidth)) : DEFAULT_SETTINGS.edgeMinWidth,
      rootColor: typeof raw.rootColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.rootColor) ? raw.rootColor : hadStoredSettings ? "" : DEFAULT_SETTINGS.rootColor,
      rootTextColor: typeof raw.rootTextColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.rootTextColor) ? raw.rootTextColor : hadStoredSettings ? "" : DEFAULT_SETTINGS.rootTextColor,
      colorfulBranches: typeof raw.colorfulBranches === "boolean" ? raw.colorfulBranches : hadStoredSettings ? false : DEFAULT_SETTINGS.colorfulBranches,
      branchColors: Array.isArray(raw.branchColors) ? raw.branchColors.filter((value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)).slice(0, 12) : hadStoredSettings ? [] : [...DEFAULT_SETTINGS.branchColors]
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL21vZGVsLnRzIiwgInNyYy9zZXR0aW5ncy50cyIsICJzcmMvdGhlbWVzLnRzIiwgInNyYy9sYXlvdXQudHMiLCAic3JjL3N0YXRpYy1yZW5kZXIudHMiLCAic3JjL3ZpZXcudHMiLCAic3JjL2VkaXRvci50cyIsICJzcmMvY29udGVudC1tb2RhbHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7XG4gIE1lbnUsXG4gIE5vdGljZSxcbiAgUGx1Z2luLFxuICBURmlsZSxcbiAgVEZvbGRlcixcbiAgbm9ybWFsaXplUGF0aCxcbiAgcmVxdWVzdFVybCxcbiAgdHlwZSBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0LFxuICB0eXBlIFdvcmtzcGFjZUxlYWZcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBjcmVhdGVEZWZhdWx0RG9jdW1lbnQsXG4gIGZpbmROb2RlLFxuICBmbGF0dGVuTm9kZXMsXG4gIG1hcmtkb3duVG9Eb2N1bWVudCxcbiAgbm9kZUNvbnRlbnRCbG9ja3MsXG4gIG5vZGVQbGFpblRleHQsXG4gIHN5bmNOb2RlTGVnYWN5RmllbGRzLFxuICBwYXJzZURvY3VtZW50LFxuICBzZXJpYWxpemVEb2N1bWVudCxcbiAgdHlwZSBNaW5kTWFwRG9jdW1lbnQsXG4gIHR5cGUgTWluZE1hcEltYWdlQ29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBOb2RlLFxuICB0eXBlIE1pbmRNYXBTdWJtYXBcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7XG4gIERFRkFVTFRfU0VUVElOR1MsXG4gIE1pbmRNYXBTdHVkaW9TZXR0aW5nVGFiLFxuICBjcmVhdGVJbWFnZUhvc3RDb25maWcsXG4gIHNldHRpbmdzVG9BcHBlYXJhbmNlLFxuICB0eXBlIEltYWdlSG9zdENob2ljZSxcbiAgdHlwZSBJbWFnZUhvc3RDb25maWcsXG4gIHR5cGUgSW1hZ2VIb3N0VXBsb2FkQmF0Y2gsXG4gIHR5cGUgSW1hZ2VIb3N0VXBsb2FkU3VjY2VzcyxcbiAgdHlwZSBNaW5kTWFwU3R1ZGlvU2V0dGluZ3Ncbn0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IHJlbmRlclN0YXRpY01pbmRNYXAsIHJlbmRlclN0YXRpY1NvdXJjZSB9IGZyb20gXCIuL3N0YXRpYy1yZW5kZXJcIjtcbmltcG9ydCB7IE1pbmRNYXBTdHVkaW9WaWV3LCBWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8gfSBmcm9tIFwiLi92aWV3XCI7XG5cbmV4cG9ydCBjb25zdCBNSU5ETUFQX0VYVEVOU0lPTiA9IFwibWluZG1hcFwiO1xuY29uc3QgTEVHQUNZX1NVRkZJWCA9IFwiLnNtbS5tZFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNaW5kTWFwU3R1ZGlvUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IE1pbmRNYXBTdHVkaW9TZXR0aW5ncyA9IERFRkFVTFRfU0VUVElOR1M7XG4gIHByaXZhdGUgbGVnYWN5TWlncmF0aW9uUGF0aDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXV0b1VwbG9hZFRpbWVycyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgYXN5bmMgb25sb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8sIChsZWFmKSA9PiBuZXcgTWluZE1hcFN0dWRpb1ZpZXcobGVhZiwgdGhpcykpO1xuICAgIC8vIEEgZGVkaWNhdGVkIGV4dGVuc2lvbiBpcyB0aGUga2V5IHRvIHJlbGlhYmxlIHJlb3BlbmluZzogT2JzaWRpYW4gcm91dGVzIGV2ZXJ5XG4gICAgLy8gLm1pbmRtYXAgZmlsZSBkaXJlY3RseSB0byB0aGUgZWRpdGFibGUgVGV4dEZpbGVWaWV3IGluc3RlYWQgb2YgTWFya2Rvd24gdmlldy5cbiAgICB0aGlzLnJlZ2lzdGVyRXh0ZW5zaW9ucyhbTUlORE1BUF9FWFRFTlNJT05dLCBWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8pO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgTWluZE1hcFN0dWRpb1NldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImJyYWluLWNpcmN1aXRcIiwgXCJcdTY1QjBcdTVFRkFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIiwgKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU1pbmRNYXAoKSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmV3LW1pbmQtbWFwXCIsXG4gICAgICBuYW1lOiBcIlx1NjVCMFx1NUVGQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgdGhpcy5jcmVhdGVNaW5kTWFwKClcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibmV3LW1pbmQtbWFwLWFuZC1lbWJlZFwiLFxuICAgICAgbmFtZTogXCJcdTY1QjBcdTVFRkFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcdTVFNzZcdTYzRDJcdTUxNjVcdTVGNTNcdTUyNERcdTdCMTRcdThCQjBcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMuY3JlYXRlTWluZE1hcCh7IGluc2VydEludG9DdXJyZW50OiB0cnVlIH0pXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImNvbnZlcnQtY3VycmVudC1tYXJrZG93blwiLFxuICAgICAgbmFtZTogXCJcdTVDMDZcdTVGNTNcdTUyNEQgTWFya2Rvd24gXHU4RjZDXHU2MzYyXHU0RTNBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIsXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IEJvb2xlYW4oZmlsZSAmJiBmaWxlLmV4dGVuc2lvbiA9PT0gXCJtZFwiICYmICF0aGlzLmlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZSkpO1xuICAgICAgICBpZiAoIWNoZWNraW5nICYmIGF2YWlsYWJsZSAmJiBmaWxlKSB2b2lkIHRoaXMuY29udmVydE1hcmtkb3duRmlsZShmaWxlKTtcbiAgICAgICAgcmV0dXJuIGF2YWlsYWJsZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibWlncmF0ZS1sZWdhY3ktbWluZC1tYXBcIixcbiAgICAgIG5hbWU6IFwiXHU1QzA2XHU1RjUzXHU1MjREXHU2NUU3XHU3MjQ4XHU4MTExXHU1NkZFXHU4RjZDXHU2MzYyXHU0RTNBIC5taW5kbWFwXCIsXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IEJvb2xlYW4oZmlsZSAmJiB0aGlzLmlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZSkpO1xuICAgICAgICBpZiAoIWNoZWNraW5nICYmIGF2YWlsYWJsZSAmJiBmaWxlKSB2b2lkIHRoaXMubWlncmF0ZUxlZ2FjeUZpbGUoZmlsZSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiBhdmFpbGFibGU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tY3VycmVudC1hcy1taW5kLW1hcFwiLFxuICAgICAgbmFtZTogXCJcdTRFRTVcdTUzRUZcdTdGMTZcdThGOTFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcdTg5QzZcdTU2RkVcdTkxQ0RcdTY1QjBcdTYyNTNcdTVGMDBcIixcbiAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gQm9vbGVhbihmaWxlICYmIHRoaXMuaXNNaW5kTWFwRmlsZShmaWxlKSk7XG4gICAgICAgIGlmICghY2hlY2tpbmcgJiYgYXZhaWxhYmxlICYmIGZpbGUpIHZvaWQgdGhpcy5vcGVuQXNNaW5kTWFwKGZpbGUsIHRoaXMuYXBwLndvcmtzcGFjZS5hY3RpdmVMZWFmID8/IHVuZGVmaW5lZCk7XG4gICAgICAgIHJldHVybiBhdmFpbGFibGU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1tZW51XCIsIChtZW51OiBNZW51LCBmaWxlKSA9PiB7XG4gICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcbiAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtXG4gICAgICAgICAgLnNldFRpdGxlKFwiXHU2NUIwXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpXG4gICAgICAgICAgLnNldEljb24oXCJicmFpbi1jaXJjdWl0XCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU1pbmRNYXAoeyBmb2xkZXI6IGZpbGUucGF0aCB9KSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm47XG5cbiAgICAgIGlmICh0aGlzLmlzTWluZE1hcEZpbGUoZmlsZSkpIHtcbiAgICAgICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtXG4gICAgICAgICAgLnNldFRpdGxlKFwiXHU0RUU1XHU1M0VGXHU3RjE2XHU4RjkxXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU2MjUzXHU1RjAwXCIpXG4gICAgICAgICAgLnNldEljb24oXCJicmFpbi1jaXJjdWl0XCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLm9wZW5Bc01pbmRNYXAoZmlsZSkpKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKSB7XG4gICAgICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbVxuICAgICAgICAgIC5zZXRUaXRsZShcIlx1OEY2Q1x1NjM2Mlx1NEUzQVx1NjVCMFx1NzY4NCAubWluZG1hcCBcdTY1ODdcdTRFRjZcIilcbiAgICAgICAgICAuc2V0SWNvbihcInJlcGxhY2VcIilcbiAgICAgICAgICAub25DbGljaygoKSA9PiB2b2lkIHRoaXMubWlncmF0ZUxlZ2FjeUZpbGUoZmlsZSwgdHJ1ZSkpKTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICAvLyBFeGlzdGluZyB1c2VycyBtYXkgc3RpbGwgaGF2ZSB0aGUgb2xkIE1hcmtkb3duLWJhY2tlZCBmaWxlcy4gV2hlbiBlbmFibGVkLFxuICAgIC8vIG9wZW5pbmcgb25lIGNyZWF0ZXMvb3BlbnMgYSBzYWZlIC5taW5kbWFwIGNvcHkgYW5kIGxlYXZlcyB0aGUgb3JpZ2luYWwgaW50YWN0LlxuICAgIHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW9wZW5cIiwgKGZpbGUpID0+IHtcbiAgICAgIGlmICghZmlsZSB8fCAhdGhpcy5zZXR0aW5ncy5yZWRpcmVjdExlZ2FjeUZpbGVzIHx8ICF0aGlzLmlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZSkpIHJldHVybjtcbiAgICAgIGlmICh0aGlzLmxlZ2FjeU1pZ3JhdGlvblBhdGggPT09IGZpbGUucGF0aCkgcmV0dXJuO1xuICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdm9pZCB0aGlzLm1pZ3JhdGVMZWdhY3lGaWxlKGZpbGUsIHRydWUpLCAwKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Db2RlQmxvY2tQcm9jZXNzb3IoXCJtaW5kbWFwXCIsIChzb3VyY2UsIGVsLCBjdHgpID0+IHtcbiAgICAgIHJlbmRlclN0YXRpY1NvdXJjZShlbCwgc291cmNlLCB0aGlzLmdldFNvdXJjZVRpdGxlKGN0eCksIHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpKTtcbiAgICB9KTtcbiAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Db2RlQmxvY2tQcm9jZXNzb3IoXCJtaW5kbWFwLWpzb25cIiwgKHNvdXJjZSwgZWwsIGN0eCkgPT4ge1xuICAgICAgcmVuZGVyU3RhdGljU291cmNlKGVsLCBzb3VyY2UsIHRoaXMuZ2V0U291cmNlVGl0bGUoY3R4KSwgc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykpO1xuICAgIH0pO1xuICAgIC8vIFJlYWQtb25seSBjb21wYXRpYmlsaXR5IGZvciBub3RlcyB0aGF0IGFscmVhZHkgY29udGFpbiBvbGQgZmVuY2VkIGJsb2Nrcy5cbiAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Db2RlQmxvY2tQcm9jZXNzb3IoXCJzbW1cIiwgKHNvdXJjZSwgZWwsIGN0eCkgPT4ge1xuICAgICAgcmVuZGVyU3RhdGljU291cmNlKGVsLCBzb3VyY2UsIHRoaXMuZ2V0U291cmNlVGl0bGUoY3R4KSwgc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykpO1xuICAgIH0pO1xuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93bkNvZGVCbG9ja1Byb2Nlc3NvcihcInNtbS1qc29uXCIsIChzb3VyY2UsIGVsLCBjdHgpID0+IHtcbiAgICAgIHJlbmRlclN0YXRpY1NvdXJjZShlbCwgc291cmNlLCB0aGlzLmdldFNvdXJjZVRpdGxlKGN0eCksIHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpKTtcbiAgICB9KTtcbiAgICB0aGlzLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKChlbGVtZW50LCBjb250ZXh0KSA9PiB2b2lkIHRoaXMucHJvY2Vzc01pbmRNYXBFbWJlZHMoZWxlbWVudCwgY29udGV4dCkpO1xuICB9XG5cbiAgb251bmxvYWQoKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCB0aW1lciBvZiB0aGlzLmF1dG9VcGxvYWRUaW1lcnMudmFsdWVzKCkpIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRoaXMuYXV0b1VwbG9hZFRpbWVycy5jbGVhcigpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX01JTkRNQVBfU1RVRElPKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgbG9hZGVkID0gYXdhaXQgdGhpcy5sb2FkRGF0YSgpIGFzIFBhcnRpYWw8TWluZE1hcFN0dWRpb1NldHRpbmdzPiB8IG51bGw7XG4gICAgLy8gT25lLXRpbWUgbWlncmF0aW9uIGFmdGVyIHRoZSBwdWJsaWMgcmVuYW1lIGZyb20gbWluZG1hcC1jYW52YXMgdG8gbWluZG1hcC1zdHVkaW8uXG4gICAgaWYgKCFsb2FkZWQpIHtcbiAgICAgIGNvbnN0IG9sZERhdGFQYXRoID0gbm9ybWFsaXplUGF0aChgJHt0aGlzLmFwcC52YXVsdC5jb25maWdEaXJ9L3BsdWdpbnMvbWluZG1hcC1jYW52YXMvZGF0YS5qc29uYCk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHMob2xkRGF0YVBhdGgpKSB7XG4gICAgICAgICAgbG9hZGVkID0gSlNPTi5wYXJzZShhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLnJlYWQob2xkRGF0YVBhdGgpKSBhcyBQYXJ0aWFsPE1pbmRNYXBTdHVkaW9TZXR0aW5ncz47XG4gICAgICAgICAgaWYgKGxvYWRlZCkgYXdhaXQgdGhpcy5zYXZlRGF0YShsb2FkZWQpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJNaW5kTWFwIFN0dWRpbyBjb3VsZCBub3QgbWlncmF0ZSB0aGUgb2xkIHNldHRpbmdzIGZpbGVcIiwgZXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBoYWRTdG9yZWRTZXR0aW5ncyA9IGxvYWRlZCAhPT0gbnVsbCAmJiBsb2FkZWQgIT09IHVuZGVmaW5lZDtcbiAgICBjb25zdCByYXcgPSAobG9hZGVkID8/IHt9KSBhcyBQYXJ0aWFsPE1pbmRNYXBTdHVkaW9TZXR0aW5ncz4gJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBsZXQgaW1hZ2VIb3N0czogSW1hZ2VIb3N0Q29uZmlnW10gPSBBcnJheS5pc0FycmF5KHJhdy5pbWFnZUhvc3RzKVxuICAgICAgPyByYXcuaW1hZ2VIb3N0cy5zbGljZSgwLCAyMCkuZmxhdE1hcCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgaWYgKCFpdGVtIHx8IHR5cGVvZiBpdGVtICE9PSBcIm9iamVjdFwiKSByZXR1cm4gW107XG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGl0ZW0gYXMgUGFydGlhbDxJbWFnZUhvc3RDb25maWc+O1xuICAgICAgICBjb25zdCBob3N0ID0gY3JlYXRlSW1hZ2VIb3N0Q29uZmlnKGluZGV4ICsgMSk7XG4gICAgICAgIGhvc3QuaWQgPSB0eXBlb2YgY2FuZGlkYXRlLmlkID09PSBcInN0cmluZ1wiICYmIGNhbmRpZGF0ZS5pZC50cmltKCkgPyBjYW5kaWRhdGUuaWQudHJpbSgpLnNsaWNlKDAsIDE2MCkgOiBob3N0LmlkO1xuICAgICAgICBob3N0Lm5hbWUgPSB0eXBlb2YgY2FuZGlkYXRlLm5hbWUgPT09IFwic3RyaW5nXCIgJiYgY2FuZGlkYXRlLm5hbWUudHJpbSgpID8gY2FuZGlkYXRlLm5hbWUudHJpbSgpLnNsaWNlKDAsIDEyMCkgOiBob3N0Lm5hbWU7XG4gICAgICAgIGhvc3QuZW5hYmxlZCA9IGNhbmRpZGF0ZS5lbmFibGVkICE9PSBmYWxzZTtcbiAgICAgICAgaG9zdC5lbmRwb2ludCA9IHR5cGVvZiBjYW5kaWRhdGUuZW5kcG9pbnQgPT09IFwic3RyaW5nXCIgPyBjYW5kaWRhdGUuZW5kcG9pbnQudHJpbSgpLnNsaWNlKDAsIDQwMDApIDogXCJcIjtcbiAgICAgICAgaG9zdC5tZXRob2QgPSBjYW5kaWRhdGUubWV0aG9kID09PSBcIlBVVFwiID8gXCJQVVRcIiA6IFwiUE9TVFwiO1xuICAgICAgICBob3N0LmJvZHlNb2RlID0gY2FuZGlkYXRlLmJvZHlNb2RlID09PSBcInJhd1wiID8gXCJyYXdcIiA6IFwibXVsdGlwYXJ0XCI7XG4gICAgICAgIGhvc3QuZmllbGROYW1lID0gdHlwZW9mIGNhbmRpZGF0ZS5maWVsZE5hbWUgPT09IFwic3RyaW5nXCIgJiYgY2FuZGlkYXRlLmZpZWxkTmFtZS50cmltKCkgPyBjYW5kaWRhdGUuZmllbGROYW1lLnRyaW0oKS5zbGljZSgwLCAxMjApIDogXCJmaWxlXCI7XG4gICAgICAgIGhvc3QuaGVhZGVycyA9IHR5cGVvZiBjYW5kaWRhdGUuaGVhZGVycyA9PT0gXCJzdHJpbmdcIiA/IGNhbmRpZGF0ZS5oZWFkZXJzLnRyaW0oKS5zbGljZSgwLCAyMDAwMCkgOiBcIlwiO1xuICAgICAgICBob3N0LnJlc3BvbnNlUGF0aCA9IHR5cGVvZiBjYW5kaWRhdGUucmVzcG9uc2VQYXRoID09PSBcInN0cmluZ1wiID8gY2FuZGlkYXRlLnJlc3BvbnNlUGF0aC50cmltKCkuc2xpY2UoMCwgNTAwKSA6IFwiZGF0YS51cmxcIjtcbiAgICAgICAgcmV0dXJuIFtob3N0XTtcbiAgICAgIH0pXG4gICAgICA6IFtdO1xuXG4gICAgLy8gTWlncmF0ZSB0aGUgc2luZ2xlLWhvc3Qgc2V0dGluZ3MgdXNlZCBieSBNaW5kTWFwIFN0dWRpbyAwLjkueC5cbiAgICBjb25zdCBsZWdhY3lFbmRwb2ludCA9IHR5cGVvZiByYXcuaW1hZ2VIb3N0RW5kcG9pbnQgPT09IFwic3RyaW5nXCIgPyByYXcuaW1hZ2VIb3N0RW5kcG9pbnQudHJpbSgpIDogXCJcIjtcbiAgICBpZiAoIWltYWdlSG9zdHMubGVuZ3RoICYmIGxlZ2FjeUVuZHBvaW50KSB7XG4gICAgICBjb25zdCBob3N0ID0gY3JlYXRlSW1hZ2VIb3N0Q29uZmlnKDEpO1xuICAgICAgaG9zdC5uYW1lID0gXCJcdTUzOUZcdTU2RkVcdTVFOEFcIjtcbiAgICAgIGhvc3QuZW5kcG9pbnQgPSBsZWdhY3lFbmRwb2ludDtcbiAgICAgIGhvc3QubWV0aG9kID0gcmF3LmltYWdlSG9zdE1ldGhvZCA9PT0gXCJQVVRcIiA/IFwiUFVUXCIgOiBcIlBPU1RcIjtcbiAgICAgIGhvc3QuYm9keU1vZGUgPSByYXcuaW1hZ2VIb3N0Qm9keU1vZGUgPT09IFwicmF3XCIgPyBcInJhd1wiIDogXCJtdWx0aXBhcnRcIjtcbiAgICAgIGhvc3QuZmllbGROYW1lID0gdHlwZW9mIHJhdy5pbWFnZUhvc3RGaWVsZE5hbWUgPT09IFwic3RyaW5nXCIgJiYgcmF3LmltYWdlSG9zdEZpZWxkTmFtZS50cmltKCkgPyByYXcuaW1hZ2VIb3N0RmllbGROYW1lLnRyaW0oKSA6IFwiZmlsZVwiO1xuICAgICAgaG9zdC5oZWFkZXJzID0gdHlwZW9mIHJhdy5pbWFnZUhvc3RIZWFkZXJzID09PSBcInN0cmluZ1wiID8gcmF3LmltYWdlSG9zdEhlYWRlcnMudHJpbSgpIDogXCJcIjtcbiAgICAgIGhvc3QucmVzcG9uc2VQYXRoID0gdHlwZW9mIHJhdy5pbWFnZUhvc3RSZXNwb25zZVBhdGggPT09IFwic3RyaW5nXCIgPyByYXcuaW1hZ2VIb3N0UmVzcG9uc2VQYXRoLnRyaW0oKSA6IFwiZGF0YS51cmxcIjtcbiAgICAgIGltYWdlSG9zdHMgPSBbaG9zdF07XG4gICAgfVxuXG4gICAgY29uc3QgZW5hYmxlZElkcyA9IG5ldyBTZXQoaW1hZ2VIb3N0cy5maWx0ZXIoKGhvc3QpID0+IGhvc3QuZW5hYmxlZCkubWFwKChob3N0KSA9PiBob3N0LmlkKSk7XG4gICAgY29uc3Qgc2VsZWN0ZWRJZHMgPSBBcnJheS5pc0FycmF5KHJhdy5hdXRvVXBsb2FkSG9zdElkcylcbiAgICAgID8gcmF3LmF1dG9VcGxvYWRIb3N0SWRzLmZpbHRlcigoaWQpOiBpZCBpcyBzdHJpbmcgPT4gdHlwZW9mIGlkID09PSBcInN0cmluZ1wiICYmIGVuYWJsZWRJZHMuaGFzKGlkKSlcbiAgICAgIDogW107XG4gICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MsXG4gICAgICAuLi5yYXcsXG4gICAgICBpbWFnZUhvc3RzLFxuICAgICAgYXV0b1VwbG9hZEVuYWJsZWQ6IHJhdy5hdXRvVXBsb2FkRW5hYmxlZCA9PT0gdHJ1ZSxcbiAgICAgIGF1dG9VcGxvYWREZWxheVNlY29uZHM6IHR5cGVvZiByYXcuYXV0b1VwbG9hZERlbGF5U2Vjb25kcyA9PT0gXCJudW1iZXJcIlxuICAgICAgICA/IE1hdGgubWF4KDAsIE1hdGgubWluKDMwMCwgTWF0aC5yb3VuZChyYXcuYXV0b1VwbG9hZERlbGF5U2Vjb25kcykpKVxuICAgICAgICA6IERFRkFVTFRfU0VUVElOR1MuYXV0b1VwbG9hZERlbGF5U2Vjb25kcyxcbiAgICAgIGF1dG9VcGxvYWRIb3N0SWRzOiBzZWxlY3RlZElkcyxcbiAgICAgIGRlbGV0ZUxvY2FsQWZ0ZXJVcGxvYWQ6IHJhdy5kZWxldGVMb2NhbEFmdGVyVXBsb2FkICE9PSBmYWxzZSxcbiAgICAgIGltYWdlRmFpbG92ZXJFbmFibGVkOiByYXcuaW1hZ2VGYWlsb3ZlckVuYWJsZWQgIT09IGZhbHNlLFxuICAgICAgaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzOiB0eXBlb2YgcmF3LmltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kcyA9PT0gXCJudW1iZXJcIlxuICAgICAgICA/IE1hdGgubWF4KDIsIE1hdGgubWluKDMwLCBNYXRoLnJvdW5kKHJhdy5pbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHMpKSlcbiAgICAgICAgOiBERUZBVUxUX1NFVFRJTkdTLmltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kcyxcbiAgICAgIGltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrOiByYXcuaW1hZ2VGYWlsb3ZlclVzZUxvY2FsRmFsbGJhY2sgIT09IGZhbHNlLFxuICAgICAgZGVmYXVsdFRoZW1lUHJlc2V0OiBbXG4gICAgICAgIFwiY2xhc3NpYy1pbmRpZ29cIiwgXCJvY2Vhbi1ibHVlXCIsIFwiZm9yZXN0LWdyZWVuXCIsIFwic3Vuc2V0LW9yYW5nZVwiLCBcImxhdmVuZGVyLWRyZWFtXCIsXG4gICAgICAgIFwiY2FuZHktcG9wXCIsIFwicGFwZXItbm90ZVwiLCBcIm1pbmltYWwtaW5rXCIsIFwiZGFyay1uZW9uXCIsIFwibWludC1jbGVhblwiXG4gICAgICBdLmluY2x1ZGVzKFN0cmluZyhyYXcuZGVmYXVsdFRoZW1lUHJlc2V0KSkgPyByYXcuZGVmYXVsdFRoZW1lUHJlc2V0IGFzIE1pbmRNYXBTdHVkaW9TZXR0aW5nc1tcImRlZmF1bHRUaGVtZVByZXNldFwiXSA6IERFRkFVTFRfU0VUVElOR1MuZGVmYXVsdFRoZW1lUHJlc2V0LFxuICAgICAgZWRnZVdpZHRoTW9kZTogcmF3LmVkZ2VXaWR0aE1vZGUgPT09IFwidW5pZm9ybVwiIHx8IHJhdy5lZGdlV2lkdGhNb2RlID09PSBcInRhcGVyZWRcIlxuICAgICAgICA/IHJhdy5lZGdlV2lkdGhNb2RlXG4gICAgICAgIDogaGFkU3RvcmVkU2V0dGluZ3MgPyBcInVuaWZvcm1cIiA6IERFRkFVTFRfU0VUVElOR1MuZWRnZVdpZHRoTW9kZSxcbiAgICAgIGVkZ2VNaW5XaWR0aDogdHlwZW9mIHJhdy5lZGdlTWluV2lkdGggPT09IFwibnVtYmVyXCJcbiAgICAgICAgPyBNYXRoLm1heCgwLjI1LCBNYXRoLm1pbig4LCByYXcuZWRnZU1pbldpZHRoKSlcbiAgICAgICAgOiBERUZBVUxUX1NFVFRJTkdTLmVkZ2VNaW5XaWR0aCxcbiAgICAgIHJvb3RDb2xvcjogdHlwZW9mIHJhdy5yb290Q29sb3IgPT09IFwic3RyaW5nXCIgJiYgL14jWzAtOWEtZl17Nn0kL2kudGVzdChyYXcucm9vdENvbG9yKVxuICAgICAgICA/IHJhdy5yb290Q29sb3JcbiAgICAgICAgOiBoYWRTdG9yZWRTZXR0aW5ncyA/IFwiXCIgOiBERUZBVUxUX1NFVFRJTkdTLnJvb3RDb2xvcixcbiAgICAgIHJvb3RUZXh0Q29sb3I6IHR5cGVvZiByYXcucm9vdFRleHRDb2xvciA9PT0gXCJzdHJpbmdcIiAmJiAvXiNbMC05YS1mXXs2fSQvaS50ZXN0KHJhdy5yb290VGV4dENvbG9yKVxuICAgICAgICA/IHJhdy5yb290VGV4dENvbG9yXG4gICAgICAgIDogaGFkU3RvcmVkU2V0dGluZ3MgPyBcIlwiIDogREVGQVVMVF9TRVRUSU5HUy5yb290VGV4dENvbG9yLFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHlwZW9mIHJhdy5jb2xvcmZ1bEJyYW5jaGVzID09PSBcImJvb2xlYW5cIlxuICAgICAgICA/IHJhdy5jb2xvcmZ1bEJyYW5jaGVzXG4gICAgICAgIDogaGFkU3RvcmVkU2V0dGluZ3MgPyBmYWxzZSA6IERFRkFVTFRfU0VUVElOR1MuY29sb3JmdWxCcmFuY2hlcyxcbiAgICAgIGJyYW5jaENvbG9yczogQXJyYXkuaXNBcnJheShyYXcuYnJhbmNoQ29sb3JzKVxuICAgICAgICA/IHJhdy5icmFuY2hDb2xvcnMuZmlsdGVyKCh2YWx1ZSk6IHZhbHVlIGlzIHN0cmluZyA9PiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgL14jWzAtOWEtZl17Nn0kL2kudGVzdCh2YWx1ZSkpLnNsaWNlKDAsIDEyKVxuICAgICAgICA6IGhhZFN0b3JlZFNldHRpbmdzID8gW10gOiBbLi4uREVGQVVMVF9TRVRUSU5HUy5icmFuY2hDb2xvcnNdXG4gICAgfSBhcyBNaW5kTWFwU3R1ZGlvU2V0dGluZ3M7XG4gICAgaWYgKHJhdy5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gdW5kZWZpbmVkICYmIHJhdy5zaG93R3JpZCA9PT0gZmFsc2UpIHRoaXMuc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm4gPSBcIm5vbmVcIjtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgcmVmcmVzaE9wZW5WaWV3cygpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8pKSB7XG4gICAgICBpZiAobGVhZi52aWV3IGluc3RhbmNlb2YgTWluZE1hcFN0dWRpb1ZpZXcpIGxlYWYudmlldy5yZWZyZXNoQXBwZWFyYW5jZSgpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUNvbmZpZ3VyZWREb2N1bWVudCh0aXRsZTogc3RyaW5nKTogTWluZE1hcERvY3VtZW50IHtcbiAgICBjb25zdCBkb2N1bWVudCA9IGNyZWF0ZURlZmF1bHREb2N1bWVudCh0aXRsZSk7XG4gICAgZG9jdW1lbnQubGF5b3V0ID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0TGF5b3V0O1xuICAgIGRvY3VtZW50LnRoZW1lID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0VGhlbWU7XG4gICAgZG9jdW1lbnQuYXBwZWFyYW5jZSA9IHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpO1xuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuXG4gIGFzeW5jIGdldEF2YWlsYWJsZVBhdGgocHJlZmVycmVkUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChwcmVmZXJyZWRQYXRoKTtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSkgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgY29uc3QgZG90ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgYmFzZSA9IGRvdCA+IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpID8gbm9ybWFsaXplZC5zbGljZSgwLCBkb3QpIDogbm9ybWFsaXplZDtcbiAgICBjb25zdCBleHRlbnNpb24gPSBkb3QgPiBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKSA/IG5vcm1hbGl6ZWQuc2xpY2UoZG90KSA6IFwiXCI7XG4gICAgbGV0IGluZGV4ID0gMjtcbiAgICB3aGlsZSAodGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGAke2Jhc2V9ICR7aW5kZXh9JHtleHRlbnNpb259YCkpIGluZGV4ICs9IDE7XG4gICAgcmV0dXJuIGAke2Jhc2V9ICR7aW5kZXh9JHtleHRlbnNpb259YDtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZU1pbmRNYXAob3B0aW9uczoge1xuICAgIGluc2VydEludG9DdXJyZW50PzogYm9vbGVhbjtcbiAgICBmb2xkZXI/OiBzdHJpbmc7XG4gICAgZG9jdW1lbnQ/OiBNaW5kTWFwRG9jdW1lbnQ7XG4gICAgdGl0bGU/OiBzdHJpbmc7XG4gIH0gPSB7fSk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBhY3RpdmVCZWZvcmUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IGZvbGRlciA9IGF3YWl0IHRoaXMucmVzb2x2ZUZvbGRlcihvcHRpb25zLmZvbGRlciwgYWN0aXZlQmVmb3JlKTtcbiAgICBjb25zdCB0aXRsZSA9IG9wdGlvbnMudGl0bGUgPz8gdGhpcy5idWlsZE5ld1RpdGxlKCk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUodGl0bGUpO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgobm9ybWFsaXplUGF0aChgJHtmb2xkZXIgPyBgJHtmb2xkZXJ9L2AgOiBcIlwifSR7ZmlsZW5hbWV9LiR7TUlORE1BUF9FWFRFTlNJT059YCkpO1xuICAgIGNvbnN0IGRvY3VtZW50ID0gb3B0aW9ucy5kb2N1bWVudCA/PyB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWREb2N1bWVudCh0aXRsZSk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCkpO1xuXG4gICAgaWYgKG9wdGlvbnMuaW5zZXJ0SW50b0N1cnJlbnQgJiYgYWN0aXZlQmVmb3JlICYmIGFjdGl2ZUJlZm9yZS5leHRlbnNpb24gPT09IFwibWRcIiAmJiBhY3RpdmVCZWZvcmUucGF0aCAhPT0gZmlsZS5wYXRoKSB7XG4gICAgICBjb25zdCBlbWJlZCA9IGBcXG5cXG4hW1ske2ZpbGUucGF0aH1dXVxcbmA7XG4gICAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChhY3RpdmVCZWZvcmUpO1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGFjdGl2ZUJlZm9yZSwgYCR7Y3VycmVudC50cmltRW5kKCl9JHtlbWJlZH1gKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5vcGVuQXNNaW5kTWFwKGZpbGUpO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgb3BlbkFzTWluZE1hcChmaWxlOiBURmlsZSwgcHJlZmVycmVkTGVhZj86IFdvcmtzcGFjZUxlYWYsIGZvY3VzTm9kZUlkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhZiA9IHByZWZlcnJlZExlYWYgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcbiAgICAgIHR5cGU6IFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyxcbiAgICAgIHN0YXRlOiB7IGZpbGU6IGZpbGUucGF0aCB9LFxuICAgICAgYWN0aXZlOiB0cnVlXG4gICAgfSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgaWYgKGZvY3VzTm9kZUlkICYmIGxlYWYudmlldyBpbnN0YW5jZW9mIE1pbmRNYXBTdHVkaW9WaWV3KSB7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBsZWFmLnZpZXcgaW5zdGFuY2VvZiBNaW5kTWFwU3R1ZGlvVmlldyAmJiBsZWFmLnZpZXcuZm9jdXNOb2RlKGZvY3VzTm9kZUlkKSwgMzApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHNhdmVQYXN0ZWRJbWFnZShibG9iOiBCbG9iLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcsIHNvdXJjZUZpbGU6IFRGaWxlIHwgbnVsbCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgLy8gXHU1NkZFXHU3MjQ3XHU4RDQ0XHU2RTkwXHU3NkVFXHU1RjU1XHU2MzA5XHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU2MjQwXHU1NzI4XHU3NkVFXHU1RjU1XHU4OUUzXHU2NzkwXHVGRjBDXHU4MDBDXHU0RTBEXHU2NjJGXHU2MzA5XHU0RUQzXHU1RTkzXHU2ODM5XHU3NkVFXHU1RjU1XHU4OUUzXHU2NzkwXHUzMDAyXG4gICAgLy8gXHU0RjhCXHU1OTgyIFByb2plY3RzL1BsYW4ubWluZG1hcCArIE1pbmRNYXAgQXNzZXRzID0+XG4gICAgLy8gUHJvamVjdHMvTWluZE1hcCBBc3NldHMvUGxhbi0yMDI2MDcyMC0xMjM0NTYucG5nXG4gICAgY29uc3Qgc291cmNlRm9sZGVyID0gc291cmNlRmlsZT8ucGFyZW50Py5wYXRoID8/IFwiXCI7XG4gICAgY29uc3QgY29uZmlndXJlZEZvbGRlciA9IG5vcm1hbGl6ZVBhdGgoKHRoaXMuc2V0dGluZ3MuYXNzZXRGb2xkZXIgfHwgXCJNaW5kTWFwIEFzc2V0c1wiKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKSk7XG4gICAgY29uc3QgZm9sZGVyID0gbm9ybWFsaXplUGF0aChbc291cmNlRm9sZGVyLCBjb25maWd1cmVkRm9sZGVyXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIi9cIikpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyUGF0aChmb2xkZXIpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgdHdvID0gKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcgPT4gU3RyaW5nKHZhbHVlKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgY29uc3Qgc3RhbXAgPSBgJHtub3cuZ2V0RnVsbFllYXIoKX0ke3R3byhub3cuZ2V0TW9udGgoKSArIDEpfSR7dHdvKG5vdy5nZXREYXRlKCkpfS0ke3R3byhub3cuZ2V0SG91cnMoKSl9JHt0d28obm93LmdldE1pbnV0ZXMoKSl9JHt0d28obm93LmdldFNlY29uZHMoKSl9YDtcbiAgICBjb25zdCBleHRlbnNpb24gPSBzdWdnZXN0ZWROYW1lLnNwbGl0KFwiLlwiKS5hdCgtMSk/LnJlcGxhY2UoL1teYS16MC05XS9naSwgXCJcIikudG9Mb3dlckNhc2UoKSB8fCBcInBuZ1wiO1xuICAgIGNvbnN0IGJhc2UgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUoc291cmNlRmlsZT8uYmFzZW5hbWUgPz8gXCJtaW5kbWFwXCIpO1xuICAgIGNvbnN0IHByZWZlcnJlZCA9IG5vcm1hbGl6ZVBhdGgoYCR7Zm9sZGVyfS8ke2Jhc2V9LSR7c3RhbXB9LiR7ZXh0ZW5zaW9ufWApO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgocHJlZmVycmVkKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVCaW5hcnkocGF0aCwgYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICByZXR1cm4gcGF0aDtcbiAgfVxuXG4gIGFzeW5jIHJlYWRJbWFnZVNvdXJjZShzb3VyY2U6IHN0cmluZywgc291cmNlRmlsZTogVEZpbGUgfCBudWxsKTogUHJvbWlzZTx7IGJsb2I6IEJsb2I7IHN1Z2dlc3RlZE5hbWU6IHN0cmluZyB9IHwgbnVsbD4ge1xuICAgIGNvbnN0IHJhdyA9IHNvdXJjZS50cmltKCk7XG4gICAgaWYgKCFyYXcgfHwgL15odHRwcz86XFwvXFwvL2kudGVzdChyYXcpIHx8IC9eZGF0YTovaS50ZXN0KHJhdykgfHwgL15ibG9iOi9pLnRlc3QocmF3KSkgcmV0dXJuIG51bGw7XG4gICAgY29uc3Qgd2lraU1hdGNoID0gcmF3Lm1hdGNoKC9eIT9cXFtcXFsoW1xcc1xcU10rPylcXF1cXF0kLyk7XG4gICAgY29uc3QgdGFyZ2V0ID0gKHdpa2lNYXRjaD8uWzFdID8/IHJhdykuc3BsaXQoXCJ8XCIpWzBdPy5zcGxpdChcIiNcIilbMF0/LnRyaW0oKSA/PyByYXc7XG4gICAgY29uc3QgZGlyZWN0ID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgodGFyZ2V0KSk7XG4gICAgY29uc3QgZmlsZSA9IGRpcmVjdCBpbnN0YW5jZW9mIFRGaWxlID8gZGlyZWN0IDogdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdCh0YXJnZXQsIHNvdXJjZUZpbGU/LnBhdGggPz8gXCJcIik7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgYmluYXJ5ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZEJpbmFyeShmaWxlKTtcbiAgICByZXR1cm4geyBibG9iOiBuZXcgQmxvYihbYmluYXJ5XSwgeyB0eXBlOiB0aGlzLm1pbWVGcm9tRmlsZW5hbWUoZmlsZS5uYW1lKSB9KSwgc3VnZ2VzdGVkTmFtZTogZmlsZS5uYW1lIH07XG4gIH1cblxuICBnZXRJbWFnZUhvc3RDaG9pY2VzKCk6IEltYWdlSG9zdENob2ljZVtdIHtcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5pbWFnZUhvc3RzXG4gICAgICAuZmlsdGVyKChob3N0KSA9PiBob3N0LmVuYWJsZWQgJiYgQm9vbGVhbihob3N0LmVuZHBvaW50LnRyaW0oKSkpXG4gICAgICAubWFwKChob3N0KSA9PiAoeyBpZDogaG9zdC5pZCwgbmFtZTogaG9zdC5uYW1lIH0pKTtcbiAgfVxuXG4gIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBlbmFibGVkID0gbmV3IFNldCh0aGlzLmdldEltYWdlSG9zdENob2ljZXMoKS5tYXAoKGhvc3QpID0+IGhvc3QuaWQpKTtcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5maWx0ZXIoKGlkKSA9PiBlbmFibGVkLmhhcyhpZCkpO1xuICB9XG5cbiAgYXN5bmMgdXBsb2FkSW1hZ2VUb0hvc3RzKGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZywgaG9zdElkczogc3RyaW5nW10pOiBQcm9taXNlPEltYWdlSG9zdFVwbG9hZEJhdGNoPiB7XG4gICAgY29uc3QgcmVxdWVzdGVkID0gQXJyYXkuZnJvbShuZXcgU2V0KGhvc3RJZHMpKTtcbiAgICBjb25zdCBob3N0cyA9IHJlcXVlc3RlZFxuICAgICAgLm1hcCgoaWQpID0+IHRoaXMuc2V0dGluZ3MuaW1hZ2VIb3N0cy5maW5kKChob3N0KSA9PiBob3N0LmlkID09PSBpZCkpXG4gICAgICAuZmlsdGVyKChob3N0KTogaG9zdCBpcyBJbWFnZUhvc3RDb25maWcgPT4gQm9vbGVhbihob3N0Py5lbmFibGVkICYmIGhvc3QuZW5kcG9pbnQudHJpbSgpKSk7XG4gICAgaWYgKCFob3N0cy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIlx1NkNBMVx1NjcwOVx1OTAwOVx1NjJFOVx1NTNFRlx1NzUyOFx1NTZGRVx1NUU4QVwiKTtcbiAgICBjb25zdCBzZXR0bGVkID0gYXdhaXQgUHJvbWlzZS5hbGwoaG9zdHMubWFwKGFzeW5jIChob3N0KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB1cmwgPSBhd2FpdCB0aGlzLnVwbG9hZEltYWdlVG9Ib3N0Q29uZmlnKGhvc3QsIGJsb2IsIHN1Z2dlc3RlZE5hbWUpO1xuICAgICAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCwgdmFsdWU6IHsgaG9zdElkOiBob3N0LmlkLCBob3N0TmFtZTogaG9zdC5uYW1lLCB1cmwgfSB9O1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvazogZmFsc2UgYXMgY29uc3QsXG4gICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgIGhvc3RJZDogaG9zdC5pZCxcbiAgICAgICAgICAgIGhvc3ROYW1lOiBob3N0Lm5hbWUsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2Vzc2VzOiBzZXR0bGVkLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgeyBvazogdHJ1ZTsgdmFsdWU6IEltYWdlSG9zdFVwbG9hZFN1Y2Nlc3MgfSA9PiBpdGVtLm9rKS5tYXAoKGl0ZW0pID0+IGl0ZW0udmFsdWUpLFxuICAgICAgZmFpbHVyZXM6IHNldHRsZWQuZmlsdGVyKChpdGVtKTogaXRlbSBpcyB7IG9rOiBmYWxzZTsgdmFsdWU6IHsgaG9zdElkOiBzdHJpbmc7IGhvc3ROYW1lOiBzdHJpbmc7IGVycm9yOiBzdHJpbmcgfSB9ID0+ICFpdGVtLm9rKS5tYXAoKGl0ZW0pID0+IGl0ZW0udmFsdWUpXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHRlc3RJbWFnZUhvc3QoaG9zdElkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBob3N0ID0gdGhpcy5zZXR0aW5ncy5pbWFnZUhvc3RzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IGhvc3RJZCk7XG4gICAgaWYgKCFob3N0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU2MjdFXHU0RTBEXHU1MjMwXHU4QkU1XHU1NkZFXHU1RThBXHU5MTREXHU3RjZFXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIWhvc3QuZW5kcG9pbnQudHJpbSgpKSB7XG4gICAgICBuZXcgTm90aWNlKGBcdThCRjdcdTUxNDhcdTU4NkJcdTUxOTkgJHtob3N0Lm5hbWV9IFx1NzY4NFx1NEUwQVx1NEYyMCBBUElgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQSByZWFsIDFcdTAwRDcxIHRyYW5zcGFyZW50IFBORyB0ZXN0cyBhdXRoZW50aWNhdGlvbiwgcmVxdWVzdCBmb3JtYXQgYW5kIHJlc3BvbnNlIHBhcnNpbmcuXG4gICAgY29uc3QgcG5nID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAgICAgMTM3LCA4MCwgNzgsIDcxLCAxMywgMTAsIDI2LCAxMCwgMCwgMCwgMCwgMTMsIDczLCA3MiwgNjgsIDgyLFxuICAgICAgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMSwgOCwgNiwgMCwgMCwgMCwgMzEsIDIxLCAxOTYsIDEzNyxcbiAgICAgIDAsIDAsIDAsIDEzLCA3MywgNjgsIDY1LCA4NCwgOCwgMjE1LCA5OSwgMjQ4LCAyMDcsIDE5MiwgMjQwLCAzMSxcbiAgICAgIDAsIDUsIDAsIDEsIDI1NSwgMTM3LCAxNTMsIDYxLCAyOSwgMCwgMCwgMCwgMCwgNzMsIDY5LCA3OCwgNjgsXG4gICAgICAxNzQsIDY2LCA5NiwgMTMwXG4gICAgXSk7XG4gICAgY29uc3Qgc3RhcnRlZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1cmwgPSBhd2FpdCB0aGlzLnVwbG9hZEltYWdlVG9Ib3N0Q29uZmlnKGhvc3QsIG5ldyBCbG9iKFtwbmddLCB7IHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSksIFwibWluZG1hcC1zdHVkaW8tYXBpLXRlc3QucG5nXCIpO1xuICAgICAgY29uc3QgZWxhcHNlZCA9IE1hdGgubWF4KDEsIE1hdGgucm91bmQocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydGVkKSk7XG4gICAgICBuZXcgTm90aWNlKGAke2hvc3QubmFtZX0gXHU4RkRFXHU2M0E1XHU2MjEwXHU1MjlGXHVGRjA4JHtlbGFwc2VkfSBtc1x1RkYwOVxcbiR7dXJsfWAsIDgwMDApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gaW1hZ2UgaG9zdCBjb25uZWN0aXZpdHkgdGVzdCBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShgJHtob3N0Lm5hbWV9IFx1OEZERVx1NjNBNVx1NTkzMVx1OEQyNVx1RkYxQSR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsIDgwMDApO1xuICAgIH1cbiAgfVxuXG4gIHNjaGVkdWxlQXV0b1VwbG9hZChmaWxlOiBURmlsZSB8IG51bGwsIG5vZGVJZDogc3RyaW5nLCBibG9ja0lkOiBzdHJpbmcsIGxvY2FsUGF0aDogc3RyaW5nLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWZpbGUgfHwgIXRoaXMuc2V0dGluZ3MuYXV0b1VwbG9hZEVuYWJsZWQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0SWRzID0gdGhpcy5nZXREZWZhdWx0VXBsb2FkSG9zdElkcygpO1xuICAgIGlmICghaG9zdElkcy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTVCNThcdTUyMzBcdTY3MkNcdTU3MzBcdUZGMUJcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcdTY3MkFcdTkwMDlcdTYyRTlcdTUzRUZcdTc1MjhcdTU2RkVcdTVFOEFcIiwgNTAwMCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGtleSA9IGAke2ZpbGUucGF0aH06OiR7bm9kZUlkfTo6JHtibG9ja0lkfWA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmF1dG9VcGxvYWRUaW1lcnMuZ2V0KGtleSk7XG4gICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHdpbmRvdy5jbGVhclRpbWVvdXQoZXhpc3RpbmcpO1xuICAgIGNvbnN0IGRlbGF5ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzAwLCB0aGlzLnNldHRpbmdzLmF1dG9VcGxvYWREZWxheVNlY29uZHMpKSAqIDEwMDA7XG4gICAgY29uc3QgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmF1dG9VcGxvYWRUaW1lcnMuZGVsZXRlKGtleSk7XG4gICAgICB2b2lkIHRoaXMucnVuQXV0b1VwbG9hZFRhc2soZmlsZS5wYXRoLCBub2RlSWQsIGJsb2NrSWQsIGxvY2FsUGF0aCwgc3VnZ2VzdGVkTmFtZSwgaG9zdElkcyk7XG4gICAgfSwgZGVsYXkpO1xuICAgIHRoaXMuYXV0b1VwbG9hZFRpbWVycy5zZXQoa2V5LCB0aW1lcik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkF1dG9VcGxvYWRUYXNrKFxuICAgIG1pbmRNYXBQYXRoOiBzdHJpbmcsXG4gICAgbm9kZUlkOiBzdHJpbmcsXG4gICAgYmxvY2tJZDogc3RyaW5nLFxuICAgIGxvY2FsUGF0aDogc3RyaW5nLFxuICAgIHN1Z2dlc3RlZE5hbWU6IHN0cmluZyxcbiAgICBob3N0SWRzOiBzdHJpbmdbXVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5mbHVzaE9wZW5WaWV3KG1pbmRNYXBQYXRoKTtcbiAgICAgIGNvbnN0IG1hcEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobWluZE1hcFBhdGgpO1xuICAgICAgY29uc3QgbG9jYWxGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgobG9jYWxQYXRoKSk7XG4gICAgICBpZiAoIShtYXBGaWxlIGluc3RhbmNlb2YgVEZpbGUpIHx8ICEobG9jYWxGaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm47XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHBhcnNlRG9jdW1lbnQoYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChtYXBGaWxlKSwgbWFwRmlsZS5iYXNlbmFtZSk7XG4gICAgICBjb25zdCBub2RlID0gZmluZE5vZGUoZG9jdW1lbnQucm9vdCwgbm9kZUlkKTtcbiAgICAgIGNvbnN0IGJsb2NrID0gbm9kZT8uY29udGVudD8uZmluZCgoaXRlbSk6IGl0ZW0gaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGl0ZW0udHlwZSA9PT0gXCJpbWFnZVwiICYmIGl0ZW0uaWQgPT09IGJsb2NrSWQpO1xuICAgICAgaWYgKCFub2RlIHx8ICFibG9jayB8fCAoYmxvY2suc291cmNlICE9PSBsb2NhbFBhdGggJiYgYmxvY2subG9jYWxTb3VyY2UgIT09IGxvY2FsUGF0aCkpIHJldHVybjtcblxuICAgICAgY29uc3QgYmluYXJ5ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZEJpbmFyeShsb2NhbEZpbGUpO1xuICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtiaW5hcnldLCB7IHR5cGU6IHRoaXMubWltZUZyb21GaWxlbmFtZShsb2NhbEZpbGUubmFtZSkgfSk7XG4gICAgICBjb25zdCBiYXRjaCA9IGF3YWl0IHRoaXMudXBsb2FkSW1hZ2VUb0hvc3RzKGJsb2IsIHN1Z2dlc3RlZE5hbWUgfHwgbG9jYWxGaWxlLm5hbWUsIGhvc3RJZHMpO1xuICAgICAgY29uc3QgdXBsb2FkZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIGNvbnN0IHJlbW90ZUJ5SG9zdCA9IG5ldyBNYXAoKGJsb2NrLnJlbW90ZVNvdXJjZXMgPz8gW10pLm1hcCgoaXRlbSkgPT4gW2l0ZW0uaG9zdElkLCBpdGVtXSkpO1xuICAgICAgZm9yIChjb25zdCBzdWNjZXNzIG9mIGJhdGNoLnN1Y2Nlc3Nlcykge1xuICAgICAgICByZW1vdGVCeUhvc3Quc2V0KHN1Y2Nlc3MuaG9zdElkLCB7IC4uLnN1Y2Nlc3MsIHVwbG9hZGVkQXQgfSk7XG4gICAgICB9XG4gICAgICBibG9jay5yZW1vdGVTb3VyY2VzID0gQXJyYXkuZnJvbShyZW1vdGVCeUhvc3QudmFsdWVzKCkpO1xuICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSBsb2NhbFBhdGg7XG5cbiAgICAgIGNvbnN0IGFsbFN1Y2NlZWRlZCA9IGJhdGNoLmZhaWx1cmVzLmxlbmd0aCA9PT0gMCAmJiBiYXRjaC5zdWNjZXNzZXMubGVuZ3RoID09PSBob3N0SWRzLmxlbmd0aDtcbiAgICAgIGlmIChhbGxTdWNjZWVkZWQgJiYgYmF0Y2guc3VjY2Vzc2VzWzBdKSBibG9jay5zb3VyY2UgPSBiYXRjaC5zdWNjZXNzZXNbMF0udXJsO1xuICAgICAgc3luY05vZGVMZWdhY3lGaWVsZHMobm9kZSk7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkobWFwRmlsZSwgc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpKTtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaE9wZW5NaW5kTWFwKG1hcEZpbGUsIGRvY3VtZW50KTtcblxuICAgICAgbGV0IGRlbGV0ZWQgPSBmYWxzZTtcbiAgICAgIGlmIChhbGxTdWNjZWVkZWQgJiYgdGhpcy5zZXR0aW5ncy5kZWxldGVMb2NhbEFmdGVyVXBsb2FkKSB7XG4gICAgICAgIGRlbGV0ZWQgPSBhd2FpdCB0aGlzLmRlbGV0ZUxvY2FsQXNzZXRJZlNhZmUobG9jYWxQYXRoLCBtaW5kTWFwUGF0aCwgYmxvY2tJZCk7XG4gICAgICAgIGlmIChkZWxldGVkKSB7XG4gICAgICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KG1hcEZpbGUsIHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50KSk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoT3Blbk1pbmRNYXAobWFwRmlsZSwgZG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChhbGxTdWNjZWVkZWQpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IGJhdGNoLnN1Y2Nlc3Nlcy5tYXAoKGl0ZW0pID0+IGl0ZW0uaG9zdE5hbWUpLmpvaW4oXCJcdTMwMDFcIik7XG4gICAgICAgIGNvbnN0IHN1ZmZpeCA9IHRoaXMuc2V0dGluZ3MuZGVsZXRlTG9jYWxBZnRlclVwbG9hZFxuICAgICAgICAgID8gZGVsZXRlZCA/IFwiXHVGRjBDXHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3XHU1REYyXHU1Qjg5XHU1MTY4XHU1MjIwXHU5NjY0XCIgOiBcIlx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NTZFMFx1NEVDRFx1ODhBQlx1NUYxNVx1NzUyOFx1NjIxNlx1NTIyMFx1OTY2NFx1NTkzMVx1OEQyNVx1ODAwQ1x1NEZERFx1NzU1OVwiXG4gICAgICAgICAgOiBcIlx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NzU1OVwiO1xuICAgICAgICBuZXcgTm90aWNlKGBcdTU2RkVcdTcyNDdcdTVERjJcdTRFMEFcdTRGMjBcdTUyMzAgJHt0YXJnZXRzfSR7c3VmZml4fWAsIDcwMDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgb2sgPSBiYXRjaC5zdWNjZXNzZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpIHx8IFwiXHU2NUUwXCI7XG4gICAgICAgIGNvbnN0IGZhaWxlZCA9IGJhdGNoLmZhaWx1cmVzLm1hcCgoaXRlbSkgPT4gYCR7aXRlbS5ob3N0TmFtZX1cdUZGMUEke2l0ZW0uZXJyb3J9YCkuam9pbihcIlx1RkYxQlwiKTtcbiAgICAgICAgbmV3IE5vdGljZShgXHU1NkZFXHU3MjQ3XHU0RUM1XHU5MEU4XHU1MjA2XHU0RTBBXHU0RjIwXHU2MjEwXHU1MjlGXHUzMDAyXHU2MjEwXHU1MjlGXHVGRjFBJHtva31cdUZGMUJcdTU5MzFcdThEMjVcdUZGMUEke2ZhaWxlZH1cdTMwMDJcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTc1NTlcdTMwMDJgLCA5MDAwKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGF1dG9tYXRpYyBpbWFnZSB1cGxvYWQgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoYFx1NTZGRVx1NzI0N1x1ODFFQVx1NTJBOFx1NEUwQVx1NEYyMFx1NTkzMVx1OEQyNVx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsIDgwMDApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgdXBsb2FkSW1hZ2VUb0hvc3RDb25maWcoaG9zdDogSW1hZ2VIb3N0Q29uZmlnLCBibG9iOiBCbG9iLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGVuZHBvaW50ID0gaG9zdC5lbmRwb2ludC50cmltKCk7XG4gICAgaWYgKCFlbmRwb2ludCkgdGhyb3cgbmV3IEVycm9yKFwiXHU0RTBBXHU0RjIwIEFQSSBcdTRFM0FcdTdBN0FcIik7XG4gICAgbGV0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBpZiAoaG9zdC5oZWFkZXJzLnRyaW0oKSkge1xuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShob3N0LmhlYWRlcnMpIGFzIHVua25vd247XG4gICAgICBpZiAoIXBhcnNlZCB8fCB0eXBlb2YgcGFyc2VkICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkocGFyc2VkKSkgdGhyb3cgbmV3IEVycm9yKFwiXHU4QkY3XHU2QzQyXHU1OTM0IEpTT04gXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICAgICAgaGVhZGVycyA9IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyhwYXJzZWQgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBba2V5LCBTdHJpbmcodmFsdWUpXSkpO1xuICAgIH1cbiAgICBjb25zdCBmaWxlbmFtZSA9IHRoaXMuc2FuaXRpemVGaWxlbmFtZShzdWdnZXN0ZWROYW1lIHx8IFwibWluZG1hcC1pbWFnZS5wbmdcIik7XG4gICAgY29uc3QgbWltZSA9IGJsb2IudHlwZSB8fCBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xuICAgIGxldCBib2R5OiBBcnJheUJ1ZmZlcjtcbiAgICBsZXQgY29udGVudFR5cGUgPSBtaW1lO1xuICAgIGlmIChob3N0LmJvZHlNb2RlID09PSBcIm11bHRpcGFydFwiKSB7XG4gICAgICBjb25zdCBib3VuZGFyeSA9IGAtLS0tTWluZE1hcFN0dWRpbyR7RGF0ZS5ub3coKS50b1N0cmluZygxNil9JHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKX1gO1xuICAgICAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgY29uc3QgZmllbGROYW1lID0gKGhvc3QuZmllbGROYW1lIHx8IFwiZmlsZVwiKS5yZXBsYWNlQWxsKCdcIicsIFwiXCIpO1xuICAgICAgY29uc3Qgc2FmZUZpbGVuYW1lID0gZmlsZW5hbWUucmVwbGFjZUFsbCgnXCInLCBcIlwiKTtcbiAgICAgIGNvbnN0IGhlYWQgPSBlbmNvZGVyLmVuY29kZShgLS0ke2JvdW5kYXJ5fVxcclxcbkNvbnRlbnQtRGlzcG9zaXRpb246IGZvcm0tZGF0YTsgbmFtZT1cIiR7ZmllbGROYW1lfVwiOyBmaWxlbmFtZT1cIiR7c2FmZUZpbGVuYW1lfVwiXFxyXFxuQ29udGVudC1UeXBlOiAke21pbWV9XFxyXFxuXFxyXFxuYCk7XG4gICAgICBjb25zdCBmaWxlID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICAgIGNvbnN0IHRhaWwgPSBlbmNvZGVyLmVuY29kZShgXFxyXFxuLS0ke2JvdW5kYXJ5fS0tXFxyXFxuYCk7XG4gICAgICBjb25zdCBjb21iaW5lZCA9IG5ldyBVaW50OEFycmF5KGhlYWQubGVuZ3RoICsgZmlsZS5sZW5ndGggKyB0YWlsLmxlbmd0aCk7XG4gICAgICBjb21iaW5lZC5zZXQoaGVhZCwgMCk7IGNvbWJpbmVkLnNldChmaWxlLCBoZWFkLmxlbmd0aCk7IGNvbWJpbmVkLnNldCh0YWlsLCBoZWFkLmxlbmd0aCArIGZpbGUubGVuZ3RoKTtcbiAgICAgIGJvZHkgPSBjb21iaW5lZC5idWZmZXI7XG4gICAgICBjb250ZW50VHlwZSA9IGBtdWx0aXBhcnQvZm9ybS1kYXRhOyBib3VuZGFyeT0ke2JvdW5kYXJ5fWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHkgPSBhd2FpdCBibG9iLmFycmF5QnVmZmVyKCk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IGVuZHBvaW50LFxuICAgICAgbWV0aG9kOiBob3N0Lm1ldGhvZCxcbiAgICAgIGNvbnRlbnRUeXBlLFxuICAgICAgaGVhZGVycyxcbiAgICAgIGJvZHksXG4gICAgICB0aHJvdzogdHJ1ZVxuICAgIH0pO1xuICAgIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICAgIHRyeSB7IHBheWxvYWQgPSByZXNwb25zZS5qc29uOyB9IGNhdGNoIHsgcGF5bG9hZCA9IHVuZGVmaW5lZDsgfVxuICAgIGlmICghcGF5bG9hZCAmJiByZXNwb25zZS50ZXh0KSB7XG4gICAgICB0cnkgeyBwYXlsb2FkID0gSlNPTi5wYXJzZShyZXNwb25zZS50ZXh0KTsgfSBjYXRjaCB7IHBheWxvYWQgPSByZXNwb25zZS50ZXh0OyB9XG4gICAgfVxuICAgIGNvbnN0IGdldFBhdGggPSAodmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHVua25vd24gPT4gcGF0aC5zcGxpdChcIi5cIikuZmlsdGVyKEJvb2xlYW4pLnJlZHVjZTx1bmtub3duPigoY3VycmVudCwga2V5KSA9PiBjdXJyZW50ICYmIHR5cGVvZiBjdXJyZW50ID09PSBcIm9iamVjdFwiID8gKGN1cnJlbnQgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV0gOiB1bmRlZmluZWQsIHZhbHVlKTtcbiAgICBjb25zdCBjYW5kaWRhdGVzID0gW2hvc3QucmVzcG9uc2VQYXRoLnRyaW0oKSwgXCJkYXRhLnVybFwiLCBcInVybFwiLCBcInJlc3VsdC51cmxcIiwgXCJyZXN1bHQuaW1hZ2VcIiwgXCJpbWFnZS51cmxcIiwgXCJzcmNcIl0uZmlsdGVyKEJvb2xlYW4pO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiBjYW5kaWRhdGVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldFBhdGgocGF5bG9hZCwgcGF0aCk7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QodmFsdWUudHJpbSgpKSkgcmV0dXJuIHZhbHVlLnRyaW0oKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IHBheWxvYWQubWF0Y2goL2h0dHBzPzpcXC9cXC9bXlxcc1wiJzw+XSsvaSk7XG4gICAgICBpZiAobWF0Y2g/LlswXSkgcmV0dXJuIG1hdGNoWzBdO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJcdThGRDRcdTU2REVcdTdFRDNcdTY3OUNcdTRFMkRcdTZDQTFcdTY3MDlcdTYyN0VcdTUyMzBcdTU2RkVcdTcyNDdcdTdGNTFcdTU3NDBcIik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZsdXNoT3BlblZpZXcocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChjb25zdCBsZWFmIG9mIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX01JTkRNQVBfU1RVRElPKSkge1xuICAgICAgaWYgKGxlYWYudmlldyBpbnN0YW5jZW9mIE1pbmRNYXBTdHVkaW9WaWV3ICYmIGxlYWYudmlldy5maWxlPy5wYXRoID09PSBwYXRoKSBhd2FpdCBsZWFmLnZpZXcuc2F2ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaE9wZW5NaW5kTWFwKGZpbGU6IFRGaWxlLCBkb2N1bWVudDogTWluZE1hcERvY3VtZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc291cmNlID0gc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTykpIHtcbiAgICAgIGlmIChsZWFmLnZpZXcgaW5zdGFuY2VvZiBNaW5kTWFwU3R1ZGlvVmlldyAmJiBsZWFmLnZpZXcuZmlsZT8ucGF0aCA9PT0gZmlsZS5wYXRoKSBsZWFmLnZpZXcuc2V0Vmlld0RhdGEoc291cmNlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkZWxldGVMb2NhbEFzc2V0SWZTYWZlKGxvY2FsUGF0aDogc3RyaW5nLCBjdXJyZW50TWluZE1hcFBhdGg6IHN0cmluZywgYmxvY2tJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgobG9jYWxQYXRoKTtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50TWluZE1hcFBhdGgpO1xuICAgIGlmIChjdXJyZW50IGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGNvbnN0IGRvYyA9IHBhcnNlRG9jdW1lbnQoYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChjdXJyZW50KSwgY3VycmVudC5iYXNlbmFtZSk7XG4gICAgICBjb25zdCBzdGlsbFVzZWQgPSBmbGF0dGVuTm9kZXMoZG9jLnJvb3QpLnNvbWUoKG5vZGUpID0+IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpLnNvbWUoKGJsb2NrKSA9PlxuICAgICAgICBibG9jay50eXBlID09PSBcImltYWdlXCIgJiYgYmxvY2suaWQgIT09IGJsb2NrSWQgJiYgKGJsb2NrLnNvdXJjZSA9PT0gbm9ybWFsaXplZCB8fCBibG9jay5sb2NhbFNvdXJjZSA9PT0gbm9ybWFsaXplZCkpKTtcbiAgICAgIGlmIChzdGlsbFVzZWQpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBmaWxlIG9mIHRoaXMuYXBwLnZhdWx0LmdldEZpbGVzKCkpIHtcbiAgICAgIGlmIChmaWxlLnBhdGggPT09IGN1cnJlbnRNaW5kTWFwUGF0aCB8fCBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpICE9PSBNSU5ETUFQX0VYVEVOU0lPTikgY29udGludWU7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcbiAgICAgICAgaWYgKHRleHQuaW5jbHVkZXMobm9ybWFsaXplZCkpIHJldHVybiBmYWxzZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBJZ25vcmUgYW4gdW5yZWFkYWJsZSB1bnJlbGF0ZWQgbWFwIGFuZCBrZWVwIGNoZWNraW5nIG90aGVyIGZpbGVzLlxuICAgICAgfVxuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKHRhcmdldCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKFwiTWluZE1hcCBTdHVkaW8gY291bGQgbm90IGRlbGV0ZSB1cGxvYWRlZCBsb2NhbCBpbWFnZVwiLCBlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtaW1lRnJvbUZpbGVuYW1lKGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGZpbGVuYW1lLnNwbGl0KFwiLlwiKS5hdCgtMSk/LnRvTG93ZXJDYXNlKCk7XG4gICAgcmV0dXJuICh7IHBuZzogXCJpbWFnZS9wbmdcIiwganBnOiBcImltYWdlL2pwZWdcIiwganBlZzogXCJpbWFnZS9qcGVnXCIsIGdpZjogXCJpbWFnZS9naWZcIiwgd2VicDogXCJpbWFnZS93ZWJwXCIsIHN2ZzogXCJpbWFnZS9zdmcreG1sXCIsIGJtcDogXCJpbWFnZS9ibXBcIiwgYXZpZjogXCJpbWFnZS9hdmlmXCIgfSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtleHRlbnNpb24gPz8gXCJcIl0gPz8gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1Ym1hcEZpbGUocGFyZW50RmlsZTogVEZpbGUsIG5vZGU6IE1pbmRNYXBOb2RlKTogUHJvbWlzZTxNaW5kTWFwU3VibWFwPiB7XG4gICAgY29uc3QgdGl0bGUgPSAobm9kZVBsYWluVGV4dChub2RlKSB8fCBcIlx1NUI1MFx1NUJGQ1x1NTZGRVwiKS50cmltKCk7XG4gICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWREb2N1bWVudCh0aXRsZSk7XG4gICAgZG9jdW1lbnQucm9vdC5jb250ZW50ID0gW3sgaWQ6IGRvY3VtZW50LnJvb3QuaWQgKyBcIl90aXRsZVwiLCB0eXBlOiBcInRleHRcIiwgdGV4dDogdGl0bGUgfV07XG4gICAgc3luY05vZGVMZWdhY3lGaWVsZHMoZG9jdW1lbnQucm9vdCk7XG4gICAgZG9jdW1lbnQucm9vdC5saW5rID0gYFtbJHtwYXJlbnRGaWxlLnBhdGh9XV1gO1xuICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGU7XG4gICAgZG9jdW1lbnQubmF2aWdhdGlvbiA9IHtcbiAgICAgIHBhcmVudFBhdGg6IHBhcmVudEZpbGUucGF0aCxcbiAgICAgIHBhcmVudE5vZGVJZDogbm9kZS5pZCxcbiAgICAgIHBhcmVudFRpdGxlOiBwYXJlbnRGaWxlLmJhc2VuYW1lLFxuICAgICAgcGFyZW50Tm9kZVRleHQ6IG5vZGVQbGFpblRleHQobm9kZSkgfHwgdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFx1NUI1MFx1NUJGQ1x1NTZGRVx1NEUwRFx1NTE4RFx1NEUwRVx1NzIzNlx1NjU4N1x1NEVGNlx1NUU3M1x1OTRGQVx1MzAwMlx1NzZFRVx1NUY1NVx1N0VEM1x1Njc4NFx1NTZGQVx1NUI5QVx1NEUzQVx1RkYxQVxuICAgIC8vIFx1NzIzNlx1NjU4N1x1NEVGNlx1NjI0MFx1NTcyOFx1NzZFRVx1NUY1NSAvIFx1OEQ0NFx1NkU5MFx1NjU4N1x1NEVGNlx1NTkzOSAvIFx1NzIzNlx1NUJGQ1x1NTZGRVx1NjU4N1x1NEVGNlx1NTQwRCAvIFx1NUI1MFx1NUJGQ1x1NTZGRS5taW5kbWFwXG4gICAgY29uc3QgcGFyZW50Rm9sZGVyID0gcGFyZW50RmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBjb25maWd1cmVkQXNzZXRzID0gbm9ybWFsaXplUGF0aCh0aGlzLnNldHRpbmdzLmFzc2V0Rm9sZGVyIHx8IFwiTWluZE1hcCBBc3NldHNcIik7XG4gICAgY29uc3QgcGFyZW50TWFwRm9sZGVyID0gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHBhcmVudEZpbGUuYmFzZW5hbWUpO1xuICAgIGNvbnN0IHN1Ym1hcEZvbGRlciA9IG5vcm1hbGl6ZVBhdGgoW3BhcmVudEZvbGRlciwgY29uZmlndXJlZEFzc2V0cywgcGFyZW50TWFwRm9sZGVyXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIi9cIikpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyUGF0aChzdWJtYXBGb2xkZXIpO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgobm9ybWFsaXplUGF0aChgJHtzdWJtYXBGb2xkZXJ9LyR7dGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKX0uJHtNSU5ETUFQX0VYVEVOU0lPTn1gKSk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCkpO1xuICAgIHJldHVybiB7IHBhdGg6IGZpbGUucGF0aCwgdGl0bGU6IGZpbGUuYmFzZW5hbWUgfTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5NaW5kTWFwUGF0aChwYXRoOiBzdHJpbmcsIHNvdXJjZVBhdGggPSBcIlwiLCBwcmVmZXJyZWRMZWFmPzogV29ya3NwYWNlTGVhZiwgZm9jdXNOb2RlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChwYXRoLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKSk7XG4gICAgY29uc3QgZGlyZWN0ID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGNvbnN0IHJlc29sdmVkID0gZGlyZWN0IGluc3RhbmNlb2YgVEZpbGUgPyBkaXJlY3QgOiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHBhdGgsIHNvdXJjZVBhdGgpO1xuICAgIGlmICghKHJlc29sdmVkIGluc3RhbmNlb2YgVEZpbGUpIHx8ICF0aGlzLmlzTWluZE1hcEZpbGUocmVzb2x2ZWQpKSB7XG4gICAgICBuZXcgTm90aWNlKGBcdTYyN0VcdTRFMERcdTUyMzBcdTVCNTBcdTVCRkNcdTU2RkVcdUZGMUEke3BhdGh9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMub3BlbkFzTWluZE1hcChyZXNvbHZlZCwgcHJlZmVycmVkTGVhZiwgZm9jdXNOb2RlSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXJQYXRoKGZvbGRlcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQgfHwgdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpIGluc3RhbmNlb2YgVEZvbGRlcikgcmV0dXJuO1xuICAgIGNvbnN0IHBhcnRzID0gbm9ybWFsaXplZC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtwYXJ0fWAgOiBwYXJ0O1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCkpIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBtaWdyYXRlTGVnYWN5RmlsZShmaWxlOiBURmlsZSwgb3BlbkFmdGVyID0gdHJ1ZSk6IFByb21pc2U8VEZpbGUgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZSkpIHJldHVybiBudWxsO1xuICAgIGlmICh0aGlzLmxlZ2FjeU1pZ3JhdGlvblBhdGggPT09IGZpbGUucGF0aCkgcmV0dXJuIG51bGw7XG4gICAgdGhpcy5sZWdhY3lNaWdyYXRpb25QYXRoID0gZmlsZS5wYXRoO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgdGl0bGUgPSBmaWxlLmJhc2VuYW1lLnJlcGxhY2UoL1xcLnNtbSQvaSwgXCJcIikgfHwgXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICAgIGNvbnN0IGRvY3VtZW50ID0gcGFyc2VEb2N1bWVudChzb3VyY2UsIHRpdGxlKTtcbiAgICAgIGNvbnN0IHBhcmVudFBhdGggPSBmaWxlLnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgICAgY29uc3QgcHJlZmVycmVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7cGFyZW50UGF0aCA/IGAke3BhcmVudFBhdGh9L2AgOiBcIlwifSR7dGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKX0uJHtNSU5ETUFQX0VYVEVOU0lPTn1gKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHByZWZlcnJlZFBhdGgpO1xuICAgICAgbGV0IHRhcmdldDogVEZpbGU7XG5cbiAgICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlICYmIHRoaXMuaXNNaW5kTWFwRmlsZShleGlzdGluZykpIHtcbiAgICAgICAgdGFyZ2V0ID0gZXhpc3Rpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwYXRoID0gZXhpc3RpbmcgPyBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgocHJlZmVycmVkUGF0aCkgOiBwcmVmZXJyZWRQYXRoO1xuICAgICAgICB0YXJnZXQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpKTtcbiAgICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU4RjZDXHU2MzYyXHU0RTNBXHU1M0VGXHU3RjE2XHU4RjkxXHU4MTExXHU1NkZFXHVGRjFBJHt0YXJnZXQucGF0aH1cXG5cdTUzOUZcdTY1ODdcdTRFRjZcdTVERjJcdTRGRERcdTc1NTlcdTRGNUNcdTRFM0FcdTU5MDdcdTRFRkRcdTMwMDJgLCA3MDAwKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wZW5BZnRlcikgYXdhaXQgdGhpcy5vcGVuQXNNaW5kTWFwKHRhcmdldCwgdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWYgPz8gdW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBsZWdhY3kgbWlncmF0aW9uIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiXHU2NUU3XHU3MjQ4XHU4MTExXHU1NkZFXHU4RjZDXHU2MzYyXHU1OTMxXHU4RDI1XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU2NzJBXHU4OEFCXHU0RkVFXHU2NTM5XHUzMDAyXCIsIDYwMDApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubGVnYWN5TWlncmF0aW9uUGF0aCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgaXNNaW5kTWFwRmlsZShmaWxlOiBURmlsZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpID09PSBNSU5ETUFQX0VYVEVOU0lPTjtcbiAgfVxuXG4gIGlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZTogVEZpbGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoTEVHQUNZX1NVRkZJWCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbnZlcnRNYXJrZG93bkZpbGUoZmlsZTogVEZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IHRpdGxlID0gZmlsZS5iYXNlbmFtZTtcbiAgICBjb25zdCBkb2N1bWVudCA9IG1hcmtkb3duVG9Eb2N1bWVudChzb3VyY2UsIHRpdGxlKTtcbiAgICBkb2N1bWVudC5sYXlvdXQgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQ7XG4gICAgZG9jdW1lbnQudGhlbWUgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRUaGVtZTtcbiAgICBkb2N1bWVudC5hcHBlYXJhbmNlID0gc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5jcmVhdGVNaW5kTWFwKHsgZG9jdW1lbnQsIHRpdGxlOiBgJHt0aXRsZX0gXHU4MTExXHU1NkZFYCwgZm9sZGVyOiBmaWxlLnBhcmVudD8ucGF0aCA/PyBcIlwiIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlRm9sZGVyKGV4cGxpY2l0Rm9sZGVyOiBzdHJpbmcgfCB1bmRlZmluZWQsIGFjdGl2ZUZpbGU6IFRGaWxlIHwgbnVsbCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gZXhwbGljaXRGb2xkZXIgPz8gKHRoaXMuc2V0dGluZ3MuZGVmYXVsdEZvbGRlciB8fCBhY3RpdmVGaWxlPy5wYXJlbnQ/LnBhdGggfHwgXCJcIik7XG4gICAgaWYgKCFjYW5kaWRhdGUpIHJldHVybiBcIlwiO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGNhbmRpZGF0ZSk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIHJldHVybiBub3JtYWxpemVkO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZE5ld1RpdGxlKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCB0d28gPSAodmFsdWU6IG51bWJlcik6IHN0cmluZyA9PiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBjb25zdCBzdGFtcCA9IGAke25vdy5nZXRGdWxsWWVhcigpfS0ke3R3byhub3cuZ2V0TW9udGgoKSArIDEpfS0ke3R3byhub3cuZ2V0RGF0ZSgpKX0gJHt0d28obm93LmdldEhvdXJzKCkpfSR7dHdvKG5vdy5nZXRNaW51dGVzKCkpfWA7XG4gICAgcmV0dXJuIGAke3RoaXMuc2V0dGluZ3MuZmlsZVByZWZpeH0gJHtzdGFtcH1gLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgc2FuaXRpemVGaWxlbmFtZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvW1xcXFwvOio/XCI8PnwjW1xcXV0vZywgXCItXCIpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSB8fCBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTb3VyY2VUaXRsZShjb250ZXh0OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KTogc3RyaW5nIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNvbnRleHQuc291cmNlUGF0aCk7XG4gICAgcmV0dXJuIHNvdXJjZUZpbGUgaW5zdGFuY2VvZiBURmlsZSA/IHNvdXJjZUZpbGUuYmFzZW5hbWUgOiBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzTWluZE1hcEVtYmVkcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgY29udGV4dDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVtYmVkcyA9IEFycmF5LmZyb20oZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcIi5pbnRlcm5hbC1lbWJlZFwiKSk7XG4gICAgZm9yIChjb25zdCBlbWJlZCBvZiBlbWJlZHMpIHtcbiAgICAgIGlmIChlbWJlZC5kYXRhc2V0Lm1tY1Byb2Nlc3NlZCA9PT0gXCJ0cnVlXCIpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgcmF3U291cmNlID0gZW1iZWQuZ2V0QXR0cmlidXRlKFwic3JjXCIpID8/IGVtYmVkLmRhdGFzZXQuc3JjID8/IFwiXCI7XG4gICAgICBjb25zdCBsaW5rUGF0aCA9IHJhd1NvdXJjZS5zcGxpdChcIiNcIilbMF0/LnNwbGl0KFwifFwiKVswXT8udHJpbSgpID8/IFwiXCI7XG4gICAgICBpZiAoIWxpbmtQYXRoLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoYC4ke01JTkRNQVBfRVhURU5TSU9OfWApKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KGxpbmtQYXRoLCBjb250ZXh0LnNvdXJjZVBhdGgpO1xuICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB8fCAhdGhpcy5pc01pbmRNYXBGaWxlKGZpbGUpKSBjb250aW51ZTtcbiAgICAgIGVtYmVkLmRhdGFzZXQubW1jUHJvY2Vzc2VkID0gXCJ0cnVlXCI7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jYWNoZWRSZWFkKGZpbGUpO1xuICAgICAgICBjb25zdCBkb2N1bWVudCA9IHBhcnNlRG9jdW1lbnQoc291cmNlLCBmaWxlLmJhc2VuYW1lKTtcbiAgICAgICAgcmVuZGVyU3RhdGljTWluZE1hcChlbWJlZCwgZG9jdW1lbnQsIHsgYXBwOiB0aGlzLmFwcCwgZmlsZSwgbWF4SGVpZ2h0OiB0aGlzLnNldHRpbmdzLmVtYmVkTWF4SGVpZ2h0LCBkZWZhdWx0QXBwZWFyYW5jZTogc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gZW1iZWQgcmVuZGVyIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIGVtYmVkLmVtcHR5KCk7XG4gICAgICAgIGVtYmVkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZW1iZWQtZXJyb3JcIiwgdGV4dDogXCJcdTY1RTBcdTZDRDVcdTUyQTBcdThGN0RcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcdTk4ODRcdTg5QzhcIiB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsICJleHBvcnQgdHlwZSBMYXlvdXRNb2RlID0gXCJyaWdodFwiIHwgXCJiYWxhbmNlZFwiO1xuZXhwb3J0IHR5cGUgVGhlbWVNb2RlID0gXCJhdXRvXCIgfCBcImxpZ2h0XCIgfCBcImRhcmtcIjtcbmV4cG9ydCB0eXBlIE5vZGVTaGFwZSA9IFwicm91bmRlZFwiIHwgXCJwaWxsXCIgfCBcInJlY3RhbmdsZVwiO1xuZXhwb3J0IHR5cGUgVGFza1N0YXR1cyA9IFwidG9kb1wiIHwgXCJkb2luZ1wiIHwgXCJkb25lXCI7XG5leHBvcnQgdHlwZSBCYWNrZ3JvdW5kUGF0dGVybiA9IFwibm9uZVwiIHwgXCJncmlkXCIgfCBcImRvdHNcIjtcbmV4cG9ydCB0eXBlIEVkZ2VTdHlsZSA9IFwiY3VydmVkXCIgfCBcInN0cmFpZ2h0XCIgfCBcImVsYm93XCI7XG5leHBvcnQgdHlwZSBFZGdlV2lkdGhNb2RlID0gXCJ1bmlmb3JtXCIgfCBcInRhcGVyZWRcIjtcbmV4cG9ydCB0eXBlIE1pbmRNYXBUaGVtZVByZXNldElkID1cbiAgfCBcImNsYXNzaWMtaW5kaWdvXCJcbiAgfCBcIm9jZWFuLWJsdWVcIlxuICB8IFwiZm9yZXN0LWdyZWVuXCJcbiAgfCBcInN1bnNldC1vcmFuZ2VcIlxuICB8IFwibGF2ZW5kZXItZHJlYW1cIlxuICB8IFwiY2FuZHktcG9wXCJcbiAgfCBcInBhcGVyLW5vdGVcIlxuICB8IFwibWluaW1hbC1pbmtcIlxuICB8IFwiZGFyay1uZW9uXCJcbiAgfCBcIm1pbnQtY2xlYW5cIjtcbmV4cG9ydCB0eXBlIEZvbnRGYW1pbHlNb2RlID0gXCJvYnNpZGlhblwiIHwgXCJzYW5zXCIgfCBcInNlcmlmXCIgfCBcIm1vbm9cIiB8IFwiY3VzdG9tXCI7XG5leHBvcnQgdHlwZSBUYWJsZUFsaWdubWVudCA9IFwibGVmdFwiIHwgXCJjZW50ZXJcIiB8IFwicmlnaHRcIjtcblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwVGV4dFN0eWxlIHtcbiAgYm9sZD86IGJvb2xlYW47XG4gIGl0YWxpYz86IGJvb2xlYW47XG4gIHVuZGVybGluZT86IGJvb2xlYW47XG4gIHN0cmlrZT86IGJvb2xlYW47XG4gIGNvbG9yPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBUZXh0UnVuIHtcbiAgdGV4dDogc3RyaW5nO1xuICBzdHlsZT86IE1pbmRNYXBUZXh0U3R5bGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFRhYmxlIHtcbiAgaGVhZGVyczogc3RyaW5nW107XG4gIHJvd3M6IHN0cmluZ1tdW107XG4gIGFsaWdubWVudHM/OiBUYWJsZUFsaWdubWVudFtdO1xuICBzb3VyY2U/OiBcIm1hbnVhbFwiIHwgXCJtYXJrZG93blwiIHwgXCJjaGlsZHJlblwiO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBDb2RlQmxvY2sge1xuICBsYW5ndWFnZT86IHN0cmluZztcbiAgY29kZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrIHtcbiAgaWQ6IHN0cmluZztcbiAgdHlwZTogXCJ0ZXh0XCI7XG4gIHRleHQ6IHN0cmluZztcbiAgcmljaFRleHQ/OiBNaW5kTWFwVGV4dFJ1bltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBJbWFnZVJlbW90ZVNvdXJjZSB7XG4gIGhvc3RJZDogc3RyaW5nO1xuICBob3N0TmFtZT86IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIHVwbG9hZGVkQXQ/OiBzdHJpbmc7XG4gIGxhc3RTdWNjZXNzQXQ/OiBzdHJpbmc7XG4gIGxhc3RGYWlsdXJlQXQ/OiBzdHJpbmc7XG4gIGZhaWx1cmVDb3VudD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwSW1hZ2VTb3VyY2VDYW5kaWRhdGUge1xuICBzb3VyY2U6IHN0cmluZztcbiAgbGFiZWw6IHN0cmluZztcbiAgaG9zdElkPzogc3RyaW5nO1xuICBob3N0TmFtZT86IHN0cmluZztcbiAga2luZDogXCJjdXJyZW50XCIgfCBcInJlbW90ZVwiIHwgXCJsb2NhbFwiO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayB7XG4gIGlkOiBzdHJpbmc7XG4gIHR5cGU6IFwiaW1hZ2VcIjtcbiAgc291cmNlOiBzdHJpbmc7XG4gIGFsdD86IHN0cmluZztcbiAgLyoqIE9yaWdpbmFsIGxvY2FsIHZhdWx0IHBhdGggcmV0YWluZWQgdW50aWwgZXZlcnkgc2VsZWN0ZWQgaW1hZ2UgaG9zdCBzdWNjZWVkcy4gKi9cbiAgbG9jYWxTb3VyY2U/OiBzdHJpbmc7XG4gIC8qKiBNaXJyb3IgVVJMcyByZXR1cm5lZCBieSBvbmUgb3IgbW9yZSBjb25maWd1cmVkIGltYWdlIGhvc3RzLiAqL1xuICByZW1vdGVTb3VyY2VzPzogTWluZE1hcEltYWdlUmVtb3RlU291cmNlW107XG59XG5cbmV4cG9ydCB0eXBlIE1pbmRNYXBDb250ZW50QmxvY2sgPSBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayB8IE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jaztcblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwU3VibWFwIHtcbiAgcGF0aDogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwTmF2aWdhdGlvbiB7XG4gIHBhcmVudFBhdGg6IHN0cmluZztcbiAgcGFyZW50Tm9kZUlkPzogc3RyaW5nO1xuICBwYXJlbnRUaXRsZT86IHN0cmluZztcbiAgcGFyZW50Tm9kZVRleHQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEFwcGVhcmFuY2Uge1xuICB0aGVtZVByZXNldD86IE1pbmRNYXBUaGVtZVByZXNldElkO1xuICBiYWNrZ3JvdW5kQ29sb3I/OiBzdHJpbmc7XG4gIGJhY2tncm91bmRQYXR0ZXJuPzogQmFja2dyb3VuZFBhdHRlcm47XG4gIHBhdHRlcm5Db2xvcj86IHN0cmluZztcbiAgZm9udEZhbWlseT86IEZvbnRGYW1pbHlNb2RlO1xuICBjdXN0b21Gb250Pzogc3RyaW5nO1xuICBmb250U2l6ZT86IG51bWJlcjtcbiAgZWRnZUNvbG9yPzogc3RyaW5nO1xuICBlZGdlV2lkdGg/OiBudW1iZXI7XG4gIGVkZ2VTdHlsZT86IEVkZ2VTdHlsZTtcbiAgZWRnZVdpZHRoTW9kZT86IEVkZ2VXaWR0aE1vZGU7XG4gIGVkZ2VNaW5XaWR0aD86IG51bWJlcjtcbiAgcm9vdENvbG9yPzogc3RyaW5nO1xuICByb290VGV4dENvbG9yPzogc3RyaW5nO1xuICBjb2xvcmZ1bEJyYW5jaGVzPzogYm9vbGVhbjtcbiAgYnJhbmNoQ29sb3JzPzogc3RyaW5nW107XG4gIG5vZGVDb2xvcj86IHN0cmluZztcbiAgdGV4dENvbG9yPzogc3RyaW5nO1xuICBub2RlQm9yZGVyQ29sb3I/OiBzdHJpbmc7XG4gIG5vZGVCb3JkZXJXaWR0aD86IG51bWJlcjtcbiAgYm9sZD86IGJvb2xlYW47XG4gIGl0YWxpYz86IGJvb2xlYW47XG4gIHVuZGVybGluZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcE5vZGVTdHlsZSB7XG4gIGNvbG9yPzogc3RyaW5nO1xuICB0ZXh0Q29sb3I/OiBzdHJpbmc7XG4gIGJvcmRlckNvbG9yPzogc3RyaW5nO1xuICBib3JkZXJXaWR0aD86IG51bWJlcjtcbiAgc2hhcGU/OiBOb2RlU2hhcGU7XG4gIGJvbGQ/OiBib29sZWFuO1xuICBpdGFsaWM/OiBib29sZWFuO1xuICB1bmRlcmxpbmU/OiBib29sZWFuO1xuICBmb250U2l6ZT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwTm9kZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgcmljaFRleHQ/OiBNaW5kTWFwVGV4dFJ1bltdO1xuICAvKiogT3JkZXJlZCB0ZXh0IGFuZCBpbWFnZSBibG9ja3MuIExlZ2FjeSB0ZXh0L3JpY2hUZXh0L2ltYWdlIGZpZWxkcyByZW1haW4gZm9yIGNvbXBhdGliaWxpdHkuICovXG4gIGNvbnRlbnQ/OiBNaW5kTWFwQ29udGVudEJsb2NrW107XG4gIG5vdGU/OiBzdHJpbmc7XG4gIGxpbms/OiBzdHJpbmc7XG4gIGltYWdlPzogc3RyaW5nO1xuICB0YWJsZT86IE1pbmRNYXBUYWJsZTtcbiAgY29kZT86IE1pbmRNYXBDb2RlQmxvY2s7XG4gIHN1Ym1hcD86IE1pbmRNYXBTdWJtYXA7XG4gIGljb24/OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbiAgdGFzaz86IFRhc2tTdGF0dXM7XG4gIHN0eWxlPzogTWluZE1hcE5vZGVTdHlsZTtcbiAgY29sbGFwc2VkPzogYm9vbGVhbjtcbiAgY2hpbGRyZW46IE1pbmRNYXBOb2RlW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcERvY3VtZW50IHtcbiAgdmVyc2lvbjogOTtcbiAgdGl0bGU6IHN0cmluZztcbiAgbGF5b3V0OiBMYXlvdXRNb2RlO1xuICB0aGVtZTogVGhlbWVNb2RlO1xuICBhcHBlYXJhbmNlPzogTWluZE1hcEFwcGVhcmFuY2U7XG4gIG5hdmlnYXRpb24/OiBNaW5kTWFwTmF2aWdhdGlvbjtcbiAgcm9vdDogTWluZE1hcE5vZGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFza1Byb2dyZXNzIHtcbiAgZG9uZTogbnVtYmVyO1xuICB0b3RhbDogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgTUlORE1BUF9DT0RFX0JMT0NLID0gXCJtaW5kbWFwLWpzb25cIjtcbmNvbnN0IExFR0FDWV9DT0RFX0JMT0NLUyA9IFtcInNtbS1qc29uXCIsIFwibW1jLWpzb25cIl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXdJZCgpOiBzdHJpbmcge1xuICBjb25zdCByYW5kb20gPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA5KTtcbiAgcmV0dXJuIGBuXyR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9XyR7cmFuZG9tfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlKHRleHQgPSBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiKTogTWluZE1hcE5vZGUge1xuICByZXR1cm4geyBpZDogbmV3SWQoKSwgdGV4dCwgY2hpbGRyZW46IFtdIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEZWZhdWx0RG9jdW1lbnQodGl0bGUgPSBcIlx1NjVCMFx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTogTWluZE1hcERvY3VtZW50IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXJzaW9uOiA5LFxuICAgIHRpdGxlLFxuICAgIGxheW91dDogXCJyaWdodFwiLFxuICAgIHRoZW1lOiBcImF1dG9cIixcbiAgICByb290OiB7XG4gICAgICBpZDogbmV3SWQoKSxcbiAgICAgIHRleHQ6IHRpdGxlLFxuICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgeyBpZDogbmV3SWQoKSwgdGV4dDogXCJcdTRFM0JcdTk4OTggMVwiLCBjaGlsZHJlbjogW10gfSxcbiAgICAgICAgeyBpZDogbmV3SWQoKSwgdGV4dDogXCJcdTRFM0JcdTk4OTggMlwiLCBjaGlsZHJlbjogW10gfVxuICAgICAgXVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQ29sb3IodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCB0cmltbWVkID0gdmFsdWUudHJpbSgpO1xuICByZXR1cm4gL14jWzAtOWEtZl17Nn0kL2kudGVzdCh0cmltbWVkKSA/IHRyaW1tZWQgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU51bWJlcih2YWx1ZTogdW5rbm93biwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIiB8fCAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUodmFsdWU6IHVua25vd24pOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQXBwZWFyYW5jZShpbnB1dDogUGFydGlhbDxNaW5kTWFwQXBwZWFyYW5jZT4gfCB1bmRlZmluZWQpOiBNaW5kTWFwQXBwZWFyYW5jZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IGJhY2tncm91bmRQYXR0ZXJuOiBCYWNrZ3JvdW5kUGF0dGVybiB8IHVuZGVmaW5lZCA9IGlucHV0LmJhY2tncm91bmRQYXR0ZXJuID09PSBcIm5vbmVcIiB8fCBpbnB1dC5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJncmlkXCIgfHwgaW5wdXQuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwiZG90c1wiXG4gICAgPyBpbnB1dC5iYWNrZ3JvdW5kUGF0dGVyblxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBmb250RmFtaWx5OiBGb250RmFtaWx5TW9kZSB8IHVuZGVmaW5lZCA9IGlucHV0LmZvbnRGYW1pbHkgPT09IFwib2JzaWRpYW5cIiB8fCBpbnB1dC5mb250RmFtaWx5ID09PSBcInNhbnNcIiB8fCBpbnB1dC5mb250RmFtaWx5ID09PSBcInNlcmlmXCIgfHwgaW5wdXQuZm9udEZhbWlseSA9PT0gXCJtb25vXCIgfHwgaW5wdXQuZm9udEZhbWlseSA9PT0gXCJjdXN0b21cIlxuICAgID8gaW5wdXQuZm9udEZhbWlseVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBlZGdlU3R5bGU6IEVkZ2VTdHlsZSB8IHVuZGVmaW5lZCA9IGlucHV0LmVkZ2VTdHlsZSA9PT0gXCJjdXJ2ZWRcIiB8fCBpbnB1dC5lZGdlU3R5bGUgPT09IFwic3RyYWlnaHRcIiB8fCBpbnB1dC5lZGdlU3R5bGUgPT09IFwiZWxib3dcIlxuICAgID8gaW5wdXQuZWRnZVN0eWxlXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGVkZ2VXaWR0aE1vZGU6IEVkZ2VXaWR0aE1vZGUgfCB1bmRlZmluZWQgPSBpbnB1dC5lZGdlV2lkdGhNb2RlID09PSBcInVuaWZvcm1cIiB8fCBpbnB1dC5lZGdlV2lkdGhNb2RlID09PSBcInRhcGVyZWRcIlxuICAgID8gaW5wdXQuZWRnZVdpZHRoTW9kZVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCB0aGVtZVByZXNldDogTWluZE1hcFRoZW1lUHJlc2V0SWQgfCB1bmRlZmluZWQgPSBbXG4gICAgXCJjbGFzc2ljLWluZGlnb1wiLCBcIm9jZWFuLWJsdWVcIiwgXCJmb3Jlc3QtZ3JlZW5cIiwgXCJzdW5zZXQtb3JhbmdlXCIsIFwibGF2ZW5kZXItZHJlYW1cIixcbiAgICBcImNhbmR5LXBvcFwiLCBcInBhcGVyLW5vdGVcIiwgXCJtaW5pbWFsLWlua1wiLCBcImRhcmstbmVvblwiLCBcIm1pbnQtY2xlYW5cIlxuICBdLmluY2x1ZGVzKFN0cmluZyhpbnB1dC50aGVtZVByZXNldCkpID8gaW5wdXQudGhlbWVQcmVzZXQgYXMgTWluZE1hcFRoZW1lUHJlc2V0SWQgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGJyYW5jaENvbG9ycyA9IEFycmF5LmlzQXJyYXkoaW5wdXQuYnJhbmNoQ29sb3JzKVxuICAgID8gaW5wdXQuYnJhbmNoQ29sb3JzLm1hcChub3JtYWxpemVDb2xvcikuZmlsdGVyKChjb2xvcik6IGNvbG9yIGlzIHN0cmluZyA9PiBCb29sZWFuKGNvbG9yKSkuc2xpY2UoMCwgMTIpXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGN1c3RvbUZvbnQgPSB0eXBlb2YgaW5wdXQuY3VzdG9tRm9udCA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5jdXN0b21Gb250LnRyaW0oKVxuICAgID8gaW5wdXQuY3VzdG9tRm9udC50cmltKCkuc2xpY2UoMCwgMTIwKVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSA9IHtcbiAgICB0aGVtZVByZXNldCxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LmJhY2tncm91bmRDb2xvciksXG4gICAgYmFja2dyb3VuZFBhdHRlcm4sXG4gICAgcGF0dGVybkNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5wYXR0ZXJuQ29sb3IpLFxuICAgIGZvbnRGYW1pbHksXG4gICAgY3VzdG9tRm9udCxcbiAgICBmb250U2l6ZTogbm9ybWFsaXplTnVtYmVyKGlucHV0LmZvbnRTaXplLCAxMCwgMzApLFxuICAgIGVkZ2VDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuZWRnZUNvbG9yKSxcbiAgICBlZGdlV2lkdGg6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5lZGdlV2lkdGgsIDAuNSwgOCksXG4gICAgZWRnZVN0eWxlLFxuICAgIGVkZ2VXaWR0aE1vZGUsXG4gICAgZWRnZU1pbldpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQuZWRnZU1pbldpZHRoLCAwLjI1LCA4KSxcbiAgICByb290Q29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LnJvb3RDb2xvciksXG4gICAgcm9vdFRleHRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQucm9vdFRleHRDb2xvciksXG4gICAgY29sb3JmdWxCcmFuY2hlczogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LmNvbG9yZnVsQnJhbmNoZXMpLFxuICAgIGJyYW5jaENvbG9yczogYnJhbmNoQ29sb3JzPy5sZW5ndGggPyBicmFuY2hDb2xvcnMgOiB1bmRlZmluZWQsXG4gICAgbm9kZUNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5ub2RlQ29sb3IpLFxuICAgIHRleHRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQudGV4dENvbG9yKSxcbiAgICBub2RlQm9yZGVyQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0Lm5vZGVCb3JkZXJDb2xvciksXG4gICAgbm9kZUJvcmRlcldpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQubm9kZUJvcmRlcldpZHRoLCAwLCA2KSxcbiAgICBib2xkOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuYm9sZCksXG4gICAgaXRhbGljOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuaXRhbGljKSxcbiAgICB1bmRlcmxpbmU6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC51bmRlcmxpbmUpXG4gIH07XG4gIHJldHVybiBPYmplY3QudmFsdWVzKGFwcGVhcmFuY2UpLnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IGFwcGVhcmFuY2UgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUFwcGVhcmFuY2UoYmFzZTogTWluZE1hcEFwcGVhcmFuY2UgfCB1bmRlZmluZWQsIG92ZXJyaWRlOiBNaW5kTWFwQXBwZWFyYW5jZSB8IHVuZGVmaW5lZCk6IE1pbmRNYXBBcHBlYXJhbmNlIHtcbiAgcmV0dXJuIHsgLi4uKGJhc2UgPz8ge30pLCAuLi4ob3ZlcnJpZGUgPz8ge30pIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0eWxlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOb2RlU3R5bGU+IHwgdW5kZWZpbmVkKTogTWluZE1hcE5vZGVTdHlsZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHNoYXBlOiBOb2RlU2hhcGUgfCB1bmRlZmluZWQgPSBpbnB1dC5zaGFwZSA9PT0gXCJwaWxsXCIgfHwgaW5wdXQuc2hhcGUgPT09IFwicmVjdGFuZ2xlXCIgfHwgaW5wdXQuc2hhcGUgPT09IFwicm91bmRlZFwiXG4gICAgPyBpbnB1dC5zaGFwZVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBzdHlsZTogTWluZE1hcE5vZGVTdHlsZSA9IHtcbiAgICBjb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuY29sb3IpLFxuICAgIHRleHRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQudGV4dENvbG9yKSxcbiAgICBib3JkZXJDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuYm9yZGVyQ29sb3IpLFxuICAgIGJvcmRlcldpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQuYm9yZGVyV2lkdGgsIDAsIDYpLFxuICAgIHNoYXBlLFxuICAgIGJvbGQ6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5ib2xkKSxcbiAgICBpdGFsaWM6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5pdGFsaWMpLFxuICAgIHVuZGVybGluZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnVuZGVybGluZSksXG4gICAgZm9udFNpemU6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5mb250U2l6ZSwgMTAsIDMyKVxuICB9O1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhzdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gc3R5bGUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRleHRTdHlsZShpbnB1dDogUGFydGlhbDxNaW5kTWFwVGV4dFN0eWxlPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBUZXh0U3R5bGUgfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0KSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBzdHlsZTogTWluZE1hcFRleHRTdHlsZSA9IHtcbiAgICBib2xkOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuYm9sZCksXG4gICAgaXRhbGljOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuaXRhbGljKSxcbiAgICB1bmRlcmxpbmU6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC51bmRlcmxpbmUpLFxuICAgIHN0cmlrZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnN0cmlrZSksXG4gICAgY29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LmNvbG9yKVxuICB9O1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhzdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gc3R5bGUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHRleHRTdHlsZUtleShzdHlsZTogTWluZE1hcFRleHRTdHlsZSB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShzdHlsZSA/PyB7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVSaWNoVGV4dChpbnB1dDogdW5rbm93biwgZmFsbGJhY2tUZXh0ID0gXCJcIik6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBydW5zOiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gIGZvciAoY29uc3QgcmF3IG9mIGlucHV0LnNsaWNlKDAsIDUwMCkpIHtcbiAgICBpZiAoIXJhdyB8fCB0eXBlb2YgcmF3ICE9PSBcIm9iamVjdFwiKSBjb250aW51ZTtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSByYXcgYXMgUGFydGlhbDxNaW5kTWFwVGV4dFJ1bj47XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUudGV4dCAhPT0gXCJzdHJpbmdcIiB8fCAhY2FuZGlkYXRlLnRleHQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHRleHQgPSBjYW5kaWRhdGUudGV4dC5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKS5zbGljZSgwLCAxMDAwMCk7XG4gICAgaWYgKCF0ZXh0KSBjb250aW51ZTtcbiAgICBjb25zdCBzdHlsZSA9IG5vcm1hbGl6ZVRleHRTdHlsZShjYW5kaWRhdGUuc3R5bGUpO1xuICAgIGNvbnN0IHByZXZpb3VzID0gcnVucy5hdCgtMSk7XG4gICAgaWYgKHByZXZpb3VzICYmIHRleHRTdHlsZUtleShwcmV2aW91cy5zdHlsZSkgPT09IHRleHRTdHlsZUtleShzdHlsZSkpIHByZXZpb3VzLnRleHQgKz0gdGV4dDtcbiAgICBlbHNlIHJ1bnMucHVzaCh7IHRleHQsIHN0eWxlIH0pO1xuICB9XG4gIGlmICghcnVucy5sZW5ndGgpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgY29uc3QgY29tYmluZWQgPSBydW5zLm1hcCgocnVuKSA9PiBydW4udGV4dCkuam9pbihcIlwiKTtcbiAgY29uc3QgbGVhZGluZyA9IGNvbWJpbmVkLmxlbmd0aCAtIGNvbWJpbmVkLnRyaW1TdGFydCgpLmxlbmd0aDtcbiAgY29uc3QgdHJhaWxpbmcgPSBjb21iaW5lZC5sZW5ndGggLSBjb21iaW5lZC50cmltRW5kKCkubGVuZ3RoO1xuICBpZiAobGVhZGluZyB8fCB0cmFpbGluZykge1xuICAgIGxldCBzdGFydCA9IGxlYWRpbmc7XG4gICAgbGV0IHJlbWFpbmluZyA9IGNvbWJpbmVkLmxlbmd0aCAtIGxlYWRpbmcgLSB0cmFpbGluZztcbiAgICBjb25zdCB0cmltbWVkOiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gICAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSBicmVhaztcbiAgICAgIGNvbnN0IHNraXAgPSBNYXRoLm1pbihzdGFydCwgcnVuLnRleHQubGVuZ3RoKTtcbiAgICAgIHN0YXJ0IC09IHNraXA7XG4gICAgICBjb25zdCBhdmFpbGFibGUgPSBydW4udGV4dC5sZW5ndGggLSBza2lwO1xuICAgICAgaWYgKGF2YWlsYWJsZSA8PSAwKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHRha2UgPSBNYXRoLm1pbihhdmFpbGFibGUsIHJlbWFpbmluZyk7XG4gICAgICBjb25zdCB0ZXh0ID0gcnVuLnRleHQuc2xpY2Uoc2tpcCwgc2tpcCArIHRha2UpO1xuICAgICAgcmVtYWluaW5nIC09IHRha2U7XG4gICAgICBpZiAodGV4dCkgdHJpbW1lZC5wdXNoKHsgdGV4dCwgc3R5bGU6IHJ1bi5zdHlsZSB9KTtcbiAgICB9XG4gICAgcnVucy5zcGxpY2UoMCwgcnVucy5sZW5ndGgsIC4uLnRyaW1tZWQpO1xuICB9XG5cbiAgaWYgKCFydW5zLmxlbmd0aCkgcmV0dXJuIGZhbGxiYWNrVGV4dC50cmltKCkgPyBbeyB0ZXh0OiBmYWxsYmFja1RleHQudHJpbSgpIH1dIDogdW5kZWZpbmVkO1xuICByZXR1cm4gcnVucy5zb21lKChydW4pID0+IHJ1bi5zdHlsZSAmJiBPYmplY3QudmFsdWVzKHJ1bi5zdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpKSA/IHJ1bnMgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByaWNoVGV4dFBsYWluVGV4dChydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQgPSBcIlwiKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bnM/Lm1hcCgocnVuKSA9PiBydW4udGV4dCkuam9pbihcIlwiKSA/PyBmYWxsYmFja1RleHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQgPSBcIlwiKTogTWluZE1hcFRleHRTdHlsZVtdIHtcbiAgY29uc3QgdGV4dCA9IHJpY2hUZXh0UGxhaW5UZXh0KHJ1bnMsIGZhbGxiYWNrVGV4dCk7XG4gIGNvbnN0IHN0eWxlczogTWluZE1hcFRleHRTdHlsZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogdGV4dC5sZW5ndGggfSwgKCkgPT4gKHt9KSk7XG4gIGlmICghcnVucz8ubGVuZ3RoKSByZXR1cm4gc3R5bGVzO1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgIGNvbnN0IHN0eWxlID0gcnVuLnN0eWxlID8geyAuLi5ydW4uc3R5bGUgfSA6IHt9O1xuICAgIGNvbnN0IGVuZCA9IE1hdGgubWluKHRleHQubGVuZ3RoLCBvZmZzZXQgKyBydW4udGV4dC5sZW5ndGgpO1xuICAgIGZvciAobGV0IGluZGV4ID0gb2Zmc2V0OyBpbmRleCA8IGVuZDsgaW5kZXggKz0gMSkgc3R5bGVzW2luZGV4XSA9IHsgLi4uc3R5bGUgfTtcbiAgICBvZmZzZXQgPSBlbmQ7XG4gIH1cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYXJhY3RlclN0eWxlc1RvUmljaFRleHQodGV4dDogc3RyaW5nLCBzdHlsZXM6IE1pbmRNYXBUZXh0U3R5bGVbXSk6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBpZiAoIXRleHQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGN1cnJlbnQgPSBub3JtYWxpemVUZXh0U3R5bGUoc3R5bGVzWzBdKTtcbiAgZm9yIChsZXQgaW5kZXggPSAxOyBpbmRleCA8PSB0ZXh0Lmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IG5leHQgPSBpbmRleCA8IHRleHQubGVuZ3RoID8gbm9ybWFsaXplVGV4dFN0eWxlKHN0eWxlc1tpbmRleF0pIDogdW5kZWZpbmVkO1xuICAgIGlmIChpbmRleCA8IHRleHQubGVuZ3RoICYmIHRleHRTdHlsZUtleShjdXJyZW50KSA9PT0gdGV4dFN0eWxlS2V5KG5leHQpKSBjb250aW51ZTtcbiAgICBjb25zdCBzZWdtZW50ID0gdGV4dC5zbGljZShzdGFydCwgaW5kZXgpO1xuICAgIGlmIChzZWdtZW50KSBydW5zLnB1c2goeyB0ZXh0OiBzZWdtZW50LCBzdHlsZTogY3VycmVudCB9KTtcbiAgICBzdGFydCA9IGluZGV4O1xuICAgIGN1cnJlbnQgPSBuZXh0O1xuICB9XG4gIHJldHVybiBub3JtYWxpemVSaWNoVGV4dChydW5zLCB0ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlY29uY2lsZVJpY2hUZXh0QWZ0ZXJFZGl0KFxuICBwcmV2aW91c1RleHQ6IHN0cmluZyxcbiAgcHJldmlvdXNSdW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLFxuICBuZXh0VGV4dDogc3RyaW5nXG4pOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHByZXZpb3VzVGV4dCA9PT0gbmV4dFRleHQpIHJldHVybiBub3JtYWxpemVSaWNoVGV4dChwcmV2aW91c1J1bnMsIG5leHRUZXh0KTtcbiAgY29uc3QgcHJldmlvdXNTdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhwcmV2aW91c1J1bnMsIHByZXZpb3VzVGV4dCk7XG4gIGNvbnN0IG5leHRTdHlsZXM6IE1pbmRNYXBUZXh0U3R5bGVbXSA9IEFycmF5LmZyb20oeyBsZW5ndGg6IG5leHRUZXh0Lmxlbmd0aCB9LCAoKSA9PiAoe30pKTtcbiAgbGV0IHByZWZpeCA9IDA7XG4gIHdoaWxlIChwcmVmaXggPCBwcmV2aW91c1RleHQubGVuZ3RoICYmIHByZWZpeCA8IG5leHRUZXh0Lmxlbmd0aCAmJiBwcmV2aW91c1RleHRbcHJlZml4XSA9PT0gbmV4dFRleHRbcHJlZml4XSkgcHJlZml4ICs9IDE7XG4gIGxldCBzdWZmaXggPSAwO1xuICB3aGlsZSAoXG4gICAgc3VmZml4IDwgcHJldmlvdXNUZXh0Lmxlbmd0aCAtIHByZWZpeFxuICAgICYmIHN1ZmZpeCA8IG5leHRUZXh0Lmxlbmd0aCAtIHByZWZpeFxuICAgICYmIHByZXZpb3VzVGV4dFtwcmV2aW91c1RleHQubGVuZ3RoIC0gMSAtIHN1ZmZpeF0gPT09IG5leHRUZXh0W25leHRUZXh0Lmxlbmd0aCAtIDEgLSBzdWZmaXhdXG4gICkgc3VmZml4ICs9IDE7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcmVmaXg7IGluZGV4ICs9IDEpIG5leHRTdHlsZXNbaW5kZXhdID0geyAuLi4ocHJldmlvdXNTdHlsZXNbaW5kZXhdID8/IHt9KSB9O1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgc3VmZml4OyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgcHJldmlvdXNJbmRleCA9IHByZXZpb3VzVGV4dC5sZW5ndGggLSBzdWZmaXggKyBpbmRleDtcbiAgICBjb25zdCBuZXh0SW5kZXggPSBuZXh0VGV4dC5sZW5ndGggLSBzdWZmaXggKyBpbmRleDtcbiAgICBuZXh0U3R5bGVzW25leHRJbmRleF0gPSB7IC4uLihwcmV2aW91c1N0eWxlc1twcmV2aW91c0luZGV4XSA/PyB7fSkgfTtcbiAgfVxuICByZXR1cm4gY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dChuZXh0VGV4dCwgbmV4dFN0eWxlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShcbiAgdGV4dDogc3RyaW5nLFxuICBydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLFxuICBzdGFydDogbnVtYmVyLFxuICBlbmQ6IG51bWJlcixcbiAgcGF0Y2g6IFBhcnRpYWw8TWluZE1hcFRleHRTdHlsZT4gfCBudWxsXG4pOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qgc2FmZVN0YXJ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4odGV4dC5sZW5ndGgsIE1hdGguZmxvb3Ioc3RhcnQpKSk7XG4gIGNvbnN0IHNhZmVFbmQgPSBNYXRoLm1heChzYWZlU3RhcnQsIE1hdGgubWluKHRleHQubGVuZ3RoLCBNYXRoLmZsb29yKGVuZCkpKTtcbiAgaWYgKHNhZmVTdGFydCA9PT0gc2FmZUVuZCkgcmV0dXJuIG5vcm1hbGl6ZVJpY2hUZXh0KHJ1bnMsIHRleHQpO1xuICBjb25zdCBzdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhydW5zLCB0ZXh0KTtcbiAgZm9yIChsZXQgaW5kZXggPSBzYWZlU3RhcnQ7IGluZGV4IDwgc2FmZUVuZDsgaW5kZXggKz0gMSkge1xuICAgIGlmIChwYXRjaCA9PT0gbnVsbCkgc3R5bGVzW2luZGV4XSA9IHt9O1xuICAgIGVsc2Ugc3R5bGVzW2luZGV4XSA9IHsgLi4uc3R5bGVzW2luZGV4XSwgLi4ucGF0Y2ggfTtcbiAgfVxuICByZXR1cm4gY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dCh0ZXh0LCBzdHlsZXMpO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbnRlbnRCbG9jayhpbnB1dDogdW5rbm93bik6IE1pbmRNYXBDb250ZW50QmxvY2sgfCBudWxsIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQgIT09IFwib2JqZWN0XCIpIHJldHVybiBudWxsO1xuICBjb25zdCBjYW5kaWRhdGUgPSBpbnB1dCBhcyBQYXJ0aWFsPE1pbmRNYXBDb250ZW50QmxvY2s+O1xuICBjb25zdCBpZCA9IHR5cGVvZiBjYW5kaWRhdGUuaWQgPT09IFwic3RyaW5nXCIgJiYgY2FuZGlkYXRlLmlkLnRyaW0oKSA/IGNhbmRpZGF0ZS5pZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IG5ld0lkKCk7XG4gIGlmIChjYW5kaWRhdGUudHlwZSA9PT0gXCJpbWFnZVwiKSB7XG4gICAgY29uc3QgaW1hZ2UgPSBjYW5kaWRhdGUgYXMgUGFydGlhbDxNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2s+O1xuICAgIGNvbnN0IHNvdXJjZSA9IHR5cGVvZiBpbWFnZS5zb3VyY2UgPT09IFwic3RyaW5nXCIgPyBpbWFnZS5zb3VyY2UudHJpbSgpLnNsaWNlKDAsIDIwMDApIDogXCJcIjtcbiAgICBpZiAoIXNvdXJjZSkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgYWx0ID0gdHlwZW9mIGltYWdlLmFsdCA9PT0gXCJzdHJpbmdcIiAmJiBpbWFnZS5hbHQudHJpbSgpID8gaW1hZ2UuYWx0LnRyaW0oKS5zbGljZSgwLCA1MDApIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGxvY2FsU291cmNlID0gdHlwZW9mIGltYWdlLmxvY2FsU291cmNlID09PSBcInN0cmluZ1wiICYmIGltYWdlLmxvY2FsU291cmNlLnRyaW0oKVxuICAgICAgPyBpbWFnZS5sb2NhbFNvdXJjZS50cmltKCkuc2xpY2UoMCwgMjAwMClcbiAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHJlbW90ZVNvdXJjZXMgPSBBcnJheS5pc0FycmF5KGltYWdlLnJlbW90ZVNvdXJjZXMpXG4gICAgICA/IGltYWdlLnJlbW90ZVNvdXJjZXMuc2xpY2UoMCwgMTIpLmZsYXRNYXAoKHJhdykgPT4ge1xuICAgICAgICBpZiAoIXJhdyB8fCB0eXBlb2YgcmF3ICE9PSBcIm9iamVjdFwiKSByZXR1cm4gW107XG4gICAgICAgIGNvbnN0IGl0ZW0gPSByYXcgYXMgUGFydGlhbDxNaW5kTWFwSW1hZ2VSZW1vdGVTb3VyY2U+O1xuICAgICAgICBjb25zdCBob3N0SWQgPSB0eXBlb2YgaXRlbS5ob3N0SWQgPT09IFwic3RyaW5nXCIgPyBpdGVtLmhvc3RJZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IFwiXCI7XG4gICAgICAgIGNvbnN0IHVybCA9IHR5cGVvZiBpdGVtLnVybCA9PT0gXCJzdHJpbmdcIiA/IGl0ZW0udXJsLnRyaW0oKS5zbGljZSgwLCA0MDAwKSA6IFwiXCI7XG4gICAgICAgIGlmICghaG9zdElkIHx8ICEvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KHVybCkpIHJldHVybiBbXTtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgaG9zdElkLFxuICAgICAgICAgIGhvc3ROYW1lOiB0eXBlb2YgaXRlbS5ob3N0TmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBpdGVtLmhvc3ROYW1lLnRyaW0oKSA/IGl0ZW0uaG9zdE5hbWUudHJpbSgpLnNsaWNlKDAsIDIwMCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgdXJsLFxuICAgICAgICAgIHVwbG9hZGVkQXQ6IHR5cGVvZiBpdGVtLnVwbG9hZGVkQXQgPT09IFwic3RyaW5nXCIgJiYgaXRlbS51cGxvYWRlZEF0LnRyaW0oKSA/IGl0ZW0udXBsb2FkZWRBdC50cmltKCkuc2xpY2UoMCwgODApIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhc3RTdWNjZXNzQXQ6IHR5cGVvZiBpdGVtLmxhc3RTdWNjZXNzQXQgPT09IFwic3RyaW5nXCIgJiYgaXRlbS5sYXN0U3VjY2Vzc0F0LnRyaW0oKSA/IGl0ZW0ubGFzdFN1Y2Nlc3NBdC50cmltKCkuc2xpY2UoMCwgODApIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhc3RGYWlsdXJlQXQ6IHR5cGVvZiBpdGVtLmxhc3RGYWlsdXJlQXQgPT09IFwic3RyaW5nXCIgJiYgaXRlbS5sYXN0RmFpbHVyZUF0LnRyaW0oKSA/IGl0ZW0ubGFzdEZhaWx1cmVBdC50cmltKCkuc2xpY2UoMCwgODApIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGZhaWx1cmVDb3VudDogdHlwZW9mIGl0ZW0uZmFpbHVyZUNvdW50ID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZShpdGVtLmZhaWx1cmVDb3VudClcbiAgICAgICAgICAgID8gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwMDAwMCwgTWF0aC5mbG9vcihpdGVtLmZhaWx1cmVDb3VudCkpKVxuICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgfV07XG4gICAgICB9KVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHsgaWQsIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlLCBhbHQsIGxvY2FsU291cmNlLCByZW1vdGVTb3VyY2VzOiByZW1vdGVTb3VyY2VzPy5sZW5ndGggPyByZW1vdGVTb3VyY2VzIDogdW5kZWZpbmVkIH07XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS50eXBlID09PSBcInRleHRcIikge1xuICAgIGNvbnN0IGZhbGxiYWNrVGV4dCA9IHR5cGVvZiBjYW5kaWRhdGUudGV4dCA9PT0gXCJzdHJpbmdcIiA/IGNhbmRpZGF0ZS50ZXh0LnJlcGxhY2UoL1xccj9cXG4vZywgXCIgXCIpLnNsaWNlKDAsIDIwMDAwKSA6IFwiXCI7XG4gICAgY29uc3QgcmljaFRleHQgPSBub3JtYWxpemVSaWNoVGV4dChjYW5kaWRhdGUucmljaFRleHQsIGZhbGxiYWNrVGV4dCk7XG4gICAgY29uc3QgdGV4dCA9IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBmYWxsYmFja1RleHQpO1xuICAgIHJldHVybiB7IGlkLCB0eXBlOiBcInRleHRcIiwgdGV4dCwgcmljaFRleHQgfTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGltYWdlU291cmNlQ2FuZGlkYXRlcyhibG9jazogTWluZE1hcEltYWdlQ29udGVudEJsb2NrLCBpbmNsdWRlTG9jYWwgPSB0cnVlKTogTWluZE1hcEltYWdlU291cmNlQ2FuZGlkYXRlW10ge1xuICBjb25zdCBjYW5kaWRhdGVzOiBNaW5kTWFwSW1hZ2VTb3VyY2VDYW5kaWRhdGVbXSA9IFtdO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGFkZCA9IChjYW5kaWRhdGU6IE1pbmRNYXBJbWFnZVNvdXJjZUNhbmRpZGF0ZSk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IHNvdXJjZSA9IGNhbmRpZGF0ZS5zb3VyY2UudHJpbSgpO1xuICAgIGlmICghc291cmNlIHx8IHNlZW4uaGFzKHNvdXJjZSkpIHJldHVybjtcbiAgICBzZWVuLmFkZChzb3VyY2UpO1xuICAgIGNhbmRpZGF0ZXMucHVzaCh7IC4uLmNhbmRpZGF0ZSwgc291cmNlIH0pO1xuICB9O1xuXG4gIGNvbnN0IGN1cnJlbnRSZW1vdGUgPSBibG9jay5yZW1vdGVTb3VyY2VzPy5maW5kKChpdGVtKSA9PiBpdGVtLnVybCA9PT0gYmxvY2suc291cmNlKTtcbiAgYWRkKHtcbiAgICBzb3VyY2U6IGJsb2NrLnNvdXJjZSxcbiAgICBsYWJlbDogY3VycmVudFJlbW90ZT8uaG9zdE5hbWUgfHwgKGN1cnJlbnRSZW1vdGUgPyBcIlx1NUY1M1x1NTI0RFx1NTZGRVx1NUU4QVwiIDogXCJcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcIiksXG4gICAgaG9zdElkOiBjdXJyZW50UmVtb3RlPy5ob3N0SWQsXG4gICAgaG9zdE5hbWU6IGN1cnJlbnRSZW1vdGU/Lmhvc3ROYW1lLFxuICAgIGtpbmQ6IFwiY3VycmVudFwiXG4gIH0pO1xuICBjb25zdCByZW1vdGVzID0gYmxvY2sucmVtb3RlU291cmNlcyA/PyBbXTtcbiAgY29uc3QgY3VycmVudEluZGV4ID0gcmVtb3Rlcy5maW5kSW5kZXgoKGl0ZW0pID0+IGl0ZW0udXJsID09PSBibG9jay5zb3VyY2UpO1xuICBjb25zdCBvcmRlcmVkUmVtb3RlcyA9IGN1cnJlbnRJbmRleCA+PSAwXG4gICAgPyBbLi4ucmVtb3Rlcy5zbGljZShjdXJyZW50SW5kZXggKyAxKSwgLi4ucmVtb3Rlcy5zbGljZSgwLCBjdXJyZW50SW5kZXgpXVxuICAgIDogcmVtb3RlcztcbiAgZm9yIChjb25zdCByZW1vdGUgb2Ygb3JkZXJlZFJlbW90ZXMpIHtcbiAgICBhZGQoe1xuICAgICAgc291cmNlOiByZW1vdGUudXJsLFxuICAgICAgbGFiZWw6IHJlbW90ZS5ob3N0TmFtZSB8fCBcIlx1NTkwN1x1NzUyOFx1NTZGRVx1NUU4QVwiLFxuICAgICAgaG9zdElkOiByZW1vdGUuaG9zdElkLFxuICAgICAgaG9zdE5hbWU6IHJlbW90ZS5ob3N0TmFtZSxcbiAgICAgIGtpbmQ6IFwicmVtb3RlXCJcbiAgICB9KTtcbiAgfVxuICBpZiAoaW5jbHVkZUxvY2FsICYmIGJsb2NrLmxvY2FsU291cmNlKSB7XG4gICAgYWRkKHsgc291cmNlOiBibG9jay5sb2NhbFNvdXJjZSwgbGFiZWw6IFwiXHU2NzJDXHU1NzMwXHU1MjZGXHU2NzJDXCIsIGtpbmQ6IFwibG9jYWxcIiB9KTtcbiAgfVxuICByZXR1cm4gY2FuZGlkYXRlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVDb250ZW50QmxvY2tzKG5vZGU6IFBpY2s8TWluZE1hcE5vZGUsIFwiY29udGVudFwiIHwgXCJ0ZXh0XCIgfCBcInJpY2hUZXh0XCIgfCBcImltYWdlXCI+KTogTWluZE1hcENvbnRlbnRCbG9ja1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZS5jb250ZW50KSAmJiBub2RlLmNvbnRlbnQubGVuZ3RoKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vZGUuY29udGVudC5tYXAobm9ybWFsaXplQ29udGVudEJsb2NrKS5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcENvbnRlbnRCbG9jayA9PiBCb29sZWFuKGJsb2NrKSk7XG4gICAgaWYgKG5vcm1hbGl6ZWQubGVuZ3RoKSByZXR1cm4gbm9ybWFsaXplZDtcbiAgfVxuICBjb25zdCBibG9ja3M6IE1pbmRNYXBDb250ZW50QmxvY2tbXSA9IFtdO1xuICBpZiAobm9kZS5pbWFnZT8udHJpbSgpKSBibG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcImltYWdlXCIsIHNvdXJjZTogbm9kZS5pbWFnZS50cmltKCksIGFsdDogbm9kZS50ZXh0IHx8IHVuZGVmaW5lZCB9KTtcbiAgaWYgKG5vZGUudGV4dCB8fCBub2RlLnJpY2hUZXh0Py5sZW5ndGgpIHtcbiAgICBjb25zdCByaWNoVGV4dCA9IG5vcm1hbGl6ZVJpY2hUZXh0KG5vZGUucmljaFRleHQsIG5vZGUudGV4dCk7XG4gICAgYmxvY2tzLnB1c2goeyBpZDogbmV3SWQoKSwgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBub2RlLnRleHQpLCByaWNoVGV4dCB9KTtcbiAgfVxuICByZXR1cm4gYmxvY2tzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9kZVBsYWluVGV4dChub2RlOiBQaWNrPE1pbmRNYXBOb2RlLCBcImNvbnRlbnRcIiB8IFwidGV4dFwiIHwgXCJyaWNoVGV4dFwiIHwgXCJpbWFnZVwiPik6IHN0cmluZyB7XG4gIGNvbnN0IGJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpO1xuICByZXR1cm4gYmxvY2tzLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcInRleHRcIikubWFwKChibG9jaykgPT4gYmxvY2sudGV4dCkuam9pbihcIiBcIikudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3luY05vZGVMZWdhY3lGaWVsZHMobm9kZTogTWluZE1hcE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gIG5vZGUuY29udGVudCA9IGJsb2Nrcy5sZW5ndGggPyBibG9ja3MgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHRleHRCbG9ja3MgPSBibG9ja3MuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKTtcbiAgY29uc3QgaW1hZ2VCbG9ja3MgPSBibG9ja3MuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIpO1xuICBub2RlLnRleHQgPSB0ZXh0QmxvY2tzLm1hcCgoYmxvY2spID0+IGJsb2NrLnRleHQpLmpvaW4oXCIgXCIpLnRyaW0oKTtcbiAgbm9kZS5yaWNoVGV4dCA9IHRleHRCbG9ja3MubGVuZ3RoID09PSAxID8gbm9ybWFsaXplUmljaFRleHQodGV4dEJsb2Nrc1swXT8ucmljaFRleHQsIHRleHRCbG9ja3NbMF0/LnRleHQgPz8gXCJcIikgOiB1bmRlZmluZWQ7XG4gIG5vZGUuaW1hZ2UgPSBpbWFnZUJsb2Nrc1swXT8uc291cmNlO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNlbGwodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUudHJpbSgpLnNsaWNlKDAsIDIwMDApIDogU3RyaW5nKHZhbHVlID8/IFwiXCIpLnRyaW0oKS5zbGljZSgwLCAyMDAwKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGFibGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcFRhYmxlPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBUYWJsZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQgfHwgIUFycmF5LmlzQXJyYXkoaW5wdXQuaGVhZGVycykpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IGhlYWRlcnMgPSBpbnB1dC5oZWFkZXJzLm1hcChub3JtYWxpemVDZWxsKS5zbGljZSgwLCAxMik7XG4gIGlmICghaGVhZGVycy5sZW5ndGgpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHJvd3MgPSBBcnJheS5pc0FycmF5KGlucHV0LnJvd3MpXG4gICAgPyBpbnB1dC5yb3dzLnNsaWNlKDAsIDEwMCkubWFwKChyb3cpID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IEFycmF5LmlzQXJyYXkocm93KSA/IHJvdy5tYXAobm9ybWFsaXplQ2VsbCkuc2xpY2UoMCwgaGVhZGVycy5sZW5ndGgpIDogW107XG4gICAgICB3aGlsZSAodmFsdWVzLmxlbmd0aCA8IGhlYWRlcnMubGVuZ3RoKSB2YWx1ZXMucHVzaChcIlwiKTtcbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSlcbiAgICA6IFtdO1xuICBjb25zdCBhbGlnbm1lbnRzID0gQXJyYXkuaXNBcnJheShpbnB1dC5hbGlnbm1lbnRzKVxuICAgID8gaW5wdXQuYWxpZ25tZW50cy5zbGljZSgwLCBoZWFkZXJzLmxlbmd0aCkubWFwKCh2YWx1ZSkgPT4gdmFsdWUgPT09IFwiY2VudGVyXCIgfHwgdmFsdWUgPT09IFwicmlnaHRcIiA/IHZhbHVlIDogXCJsZWZ0XCIpXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHNvdXJjZSA9IGlucHV0LnNvdXJjZSA9PT0gXCJtYXJrZG93blwiIHx8IGlucHV0LnNvdXJjZSA9PT0gXCJjaGlsZHJlblwiID8gaW5wdXQuc291cmNlIDogXCJtYW51YWxcIjtcbiAgcmV0dXJuIHsgaGVhZGVycywgcm93cywgYWxpZ25tZW50cywgc291cmNlIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvZGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcENvZGVCbG9jaz4gfCB1bmRlZmluZWQpOiBNaW5kTWFwQ29kZUJsb2NrIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQuY29kZSAhPT0gXCJzdHJpbmdcIiB8fCAhaW5wdXQuY29kZS50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IGxhbmd1YWdlID0gdHlwZW9mIGlucHV0Lmxhbmd1YWdlID09PSBcInN0cmluZ1wiICYmIGlucHV0Lmxhbmd1YWdlLnRyaW0oKVxuICAgID8gaW5wdXQubGFuZ3VhZ2UudHJpbSgpLnJlcGxhY2UoL1teYS16MC05XysjLi1dL2dpLCBcIlwiKS5zbGljZSgwLCA0MClcbiAgICA6IHVuZGVmaW5lZDtcbiAgcmV0dXJuIHsgbGFuZ3VhZ2UsIGNvZGU6IGlucHV0LmNvZGUucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpLnNsaWNlKDAsIDEwMDAwMCkgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU3VibWFwKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBTdWJtYXA+IHwgdW5kZWZpbmVkKTogTWluZE1hcFN1Ym1hcCB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQgfHwgdHlwZW9mIGlucHV0LnBhdGggIT09IFwic3RyaW5nXCIgfHwgIWlucHV0LnBhdGgudHJpbSgpKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGlucHV0LnBhdGgudHJpbSgpLnNsaWNlKDAsIDUwMCksXG4gICAgdGl0bGU6IHR5cGVvZiBpbnB1dC50aXRsZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC50aXRsZS50cmltKCkgPyBpbnB1dC50aXRsZS50cmltKCkuc2xpY2UoMCwgMjAwKSA6IHVuZGVmaW5lZFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOYXZpZ2F0aW9uKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOYXZpZ2F0aW9uPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBOYXZpZ2F0aW9uIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQucGFyZW50UGF0aCAhPT0gXCJzdHJpbmdcIiB8fCAhaW5wdXQucGFyZW50UGF0aC50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiB7XG4gICAgcGFyZW50UGF0aDogaW5wdXQucGFyZW50UGF0aC50cmltKCkuc2xpY2UoMCwgNTAwKSxcbiAgICBwYXJlbnROb2RlSWQ6IHR5cGVvZiBpbnB1dC5wYXJlbnROb2RlSWQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQucGFyZW50Tm9kZUlkLnRyaW0oKSA/IGlucHV0LnBhcmVudE5vZGVJZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IHVuZGVmaW5lZCxcbiAgICBwYXJlbnRUaXRsZTogdHlwZW9mIGlucHV0LnBhcmVudFRpdGxlID09PSBcInN0cmluZ1wiICYmIGlucHV0LnBhcmVudFRpdGxlLnRyaW0oKSA/IGlucHV0LnBhcmVudFRpdGxlLnRyaW0oKS5zbGljZSgwLCAyMDApIDogdW5kZWZpbmVkLFxuICAgIHBhcmVudE5vZGVUZXh0OiB0eXBlb2YgaW5wdXQucGFyZW50Tm9kZVRleHQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQucGFyZW50Tm9kZVRleHQudHJpbSgpID8gaW5wdXQucGFyZW50Tm9kZVRleHQudHJpbSgpLnNsaWNlKDAsIDIwMCkgOiB1bmRlZmluZWRcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGFzayh2YWx1ZTogdW5rbm93bik6IFRhc2tTdGF0dXMgfCB1bmRlZmluZWQge1xuICByZXR1cm4gdmFsdWUgPT09IFwidG9kb1wiIHx8IHZhbHVlID09PSBcImRvaW5nXCIgfHwgdmFsdWUgPT09IFwiZG9uZVwiID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRhZ3ModmFsdWU6IHVua25vd24pOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHRhZ3MgPSBBcnJheS5mcm9tKG5ldyBTZXQodmFsdWVcbiAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBzdHJpbmcgPT4gdHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpXG4gICAgLm1hcCgoaXRlbSkgPT4gaXRlbS50cmltKCkucmVwbGFjZSgvXiMvLCBcIlwiKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pKSlcbiAgICAuc2xpY2UoMCwgMTIpO1xuICByZXR1cm4gdGFncy5sZW5ndGggPyB0YWdzIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOb2RlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOb2RlPiB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUZXh0OiBzdHJpbmcpOiBNaW5kTWFwTm9kZSB7XG4gIGNvbnN0IGZhbGxiYWNrTm9kZVRleHQgPSB0eXBlb2YgaW5wdXQ/LnRleHQgPT09IFwic3RyaW5nXCIgPyBpbnB1dC50ZXh0IDogZmFsbGJhY2tUZXh0O1xuICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IEFycmF5LmlzQXJyYXkoaW5wdXQ/LmNvbnRlbnQpXG4gICAgPyBpbnB1dC5jb250ZW50Lm1hcChub3JtYWxpemVDb250ZW50QmxvY2spLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwQ29udGVudEJsb2NrID0+IEJvb2xlYW4oYmxvY2spKVxuICAgIDogW107XG4gIGlmICghbm9ybWFsaXplZENvbnRlbnQubGVuZ3RoKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dD8uaW1hZ2UgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQuaW1hZ2UudHJpbSgpKSB7XG4gICAgICBub3JtYWxpemVkQ29udGVudC5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBpbnB1dC5pbWFnZS50cmltKCksIGFsdDogZmFsbGJhY2tOb2RlVGV4dCB8fCB1bmRlZmluZWQgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJpY2hUZXh0ID0gbm9ybWFsaXplUmljaFRleHQoaW5wdXQ/LnJpY2hUZXh0LCBmYWxsYmFja05vZGVUZXh0KTtcbiAgICBjb25zdCB0ZXh0ID0gcmljaFRleHRQbGFpblRleHQocmljaFRleHQsIGZhbGxiYWNrTm9kZVRleHQpO1xuICAgIGlmICh0ZXh0KSBub3JtYWxpemVkQ29udGVudC5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0LCByaWNoVGV4dCB9KTtcbiAgfVxuICBjb25zdCB0ZXh0QmxvY2tzID0gbm9ybWFsaXplZENvbnRlbnQuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKTtcbiAgY29uc3QgaW1hZ2VCbG9ja3MgPSBub3JtYWxpemVkQ29udGVudC5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIik7XG4gIGNvbnN0IHRleHQgPSB0ZXh0QmxvY2tzLm1hcCgoYmxvY2spID0+IGJsb2NrLnRleHQpLmpvaW4oXCIgXCIpLnRyaW0oKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogdHlwZW9mIGlucHV0Py5pZCA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5pZCA/IGlucHV0LmlkIDogbmV3SWQoKSxcbiAgICB0ZXh0LFxuICAgIHJpY2hUZXh0OiB0ZXh0QmxvY2tzLmxlbmd0aCA9PT0gMSA/IHRleHRCbG9ja3NbMF0/LnJpY2hUZXh0IDogdW5kZWZpbmVkLFxuICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZWRDb250ZW50Lmxlbmd0aCA/IG5vcm1hbGl6ZWRDb250ZW50IDogdW5kZWZpbmVkLFxuICAgIG5vdGU6IHR5cGVvZiBpbnB1dD8ubm90ZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5ub3RlLnRyaW0oKSA/IGlucHV0Lm5vdGUudHJpbSgpIDogdW5kZWZpbmVkLFxuICAgIGxpbms6IHR5cGVvZiBpbnB1dD8ubGluayA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5saW5rLnRyaW0oKSA/IGlucHV0LmxpbmsudHJpbSgpIDogdW5kZWZpbmVkLFxuICAgIGltYWdlOiBpbWFnZUJsb2Nrc1swXT8uc291cmNlLFxuICAgIHRhYmxlOiBub3JtYWxpemVUYWJsZShpbnB1dD8udGFibGUpLFxuICAgIGNvZGU6IG5vcm1hbGl6ZUNvZGUoaW5wdXQ/LmNvZGUpLFxuICAgIHN1Ym1hcDogbm9ybWFsaXplU3VibWFwKGlucHV0Py5zdWJtYXApLFxuICAgIGljb246IHR5cGVvZiBpbnB1dD8uaWNvbiA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5pY29uLnRyaW0oKSA/IGlucHV0Lmljb24udHJpbSgpLnNsaWNlKDAsIDEyKSA6IHVuZGVmaW5lZCxcbiAgICB0YWdzOiBub3JtYWxpemVUYWdzKGlucHV0Py50YWdzKSxcbiAgICB0YXNrOiBub3JtYWxpemVUYXNrKGlucHV0Py50YXNrKSxcbiAgICBzdHlsZTogbm9ybWFsaXplU3R5bGUoaW5wdXQ/LnN0eWxlKSxcbiAgICBjb2xsYXBzZWQ6IGlucHV0Py5jb2xsYXBzZWQgPT09IHRydWUgfHwgdW5kZWZpbmVkLFxuICAgIGNoaWxkcmVuOiBBcnJheS5pc0FycmF5KGlucHV0Py5jaGlsZHJlbilcbiAgICAgID8gaW5wdXQuY2hpbGRyZW4ubWFwKChjaGlsZCwgaW5kZXgpID0+IG5vcm1hbGl6ZU5vZGUoY2hpbGQsIGBcdTgyODJcdTcwQjkgJHtpbmRleCArIDF9YCkpXG4gICAgICA6IFtdXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVEb2N1bWVudChpbnB1dDogUGFydGlhbDxNaW5kTWFwRG9jdW1lbnQ+IHwgdW5kZWZpbmVkLCBmYWxsYmFja1RpdGxlID0gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik6IE1pbmRNYXBEb2N1bWVudCB7XG4gIGNvbnN0IHRpdGxlID0gdHlwZW9mIGlucHV0Py50aXRsZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC50aXRsZS50cmltKCkgPyBpbnB1dC50aXRsZS50cmltKCkgOiBmYWxsYmFja1RpdGxlO1xuICByZXR1cm4ge1xuICAgIHZlcnNpb246IDksXG4gICAgdGl0bGUsXG4gICAgbGF5b3V0OiBpbnB1dD8ubGF5b3V0ID09PSBcImJhbGFuY2VkXCIgPyBcImJhbGFuY2VkXCIgOiBcInJpZ2h0XCIsXG4gICAgdGhlbWU6IGlucHV0Py50aGVtZSA9PT0gXCJsaWdodFwiIHx8IGlucHV0Py50aGVtZSA9PT0gXCJkYXJrXCIgPyBpbnB1dC50aGVtZSA6IFwiYXV0b1wiLFxuICAgIGFwcGVhcmFuY2U6IG5vcm1hbGl6ZUFwcGVhcmFuY2UoaW5wdXQ/LmFwcGVhcmFuY2UpLFxuICAgIG5hdmlnYXRpb246IG5vcm1hbGl6ZU5hdmlnYXRpb24oaW5wdXQ/Lm5hdmlnYXRpb24pLFxuICAgIHJvb3Q6IG5vcm1hbGl6ZU5vZGUoaW5wdXQ/LnJvb3QsIHRpdGxlKVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRG9jdW1lbnQoZG9jOiBNaW5kTWFwRG9jdW1lbnQpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplRG9jdW1lbnQoZG9jLCBkb2MudGl0bGUpO1xuICByZXR1cm4gYCR7SlNPTi5zdHJpbmdpZnkobm9ybWFsaXplZCwgbnVsbCwgMil9XFxuYDtcbn1cblxuZnVuY3Rpb24gcGFyc2VKc29uRG9jdW1lbnQodmFsdWU6IHN0cmluZywgZmFsbGJhY2tUaXRsZTogc3RyaW5nKTogTWluZE1hcERvY3VtZW50IHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZURvY3VtZW50KEpTT04ucGFyc2UodmFsdWUpIGFzIFBhcnRpYWw8TWluZE1hcERvY3VtZW50PiwgZmFsbGJhY2tUaXRsZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RGZW5jZWRKc29uKHNvdXJjZTogc3RyaW5nLCBsYW5ndWFnZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGVzY2FwZWQgPSBsYW5ndWFnZS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIGNvbnN0IG1hdGNoID0gc291cmNlLm1hdGNoKG5ldyBSZWdFeHAoXCJgYGBcIiArIGVzY2FwZWQgKyBcIlxcXFxzKihbXFxcXHNcXFxcU10qPylgYGBcIiwgXCJpXCIpKTtcbiAgcmV0dXJuIG1hdGNoPy5bMV0/LnRyaW0oKSA/PyBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEb2N1bWVudChzb3VyY2U6IHN0cmluZywgZmFsbGJhY2tUaXRsZSA9IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpOiBNaW5kTWFwRG9jdW1lbnQge1xuICBjb25zdCB0cmltbWVkID0gc291cmNlLnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aChcIntcIikgJiYgdHJpbW1lZC5lbmRzV2l0aChcIn1cIikpIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUpzb25Eb2N1bWVudCh0cmltbWVkLCBmYWxsYmFja1RpdGxlKTtcbiAgICBpZiAocGFyc2VkKSByZXR1cm4gcGFyc2VkO1xuICB9XG5cbiAgZm9yIChjb25zdCBsYW5ndWFnZSBvZiBbTUlORE1BUF9DT0RFX0JMT0NLLCAuLi5MRUdBQ1lfQ09ERV9CTE9DS1NdKSB7XG4gICAgY29uc3QgZmVuY2VkID0gZXh0cmFjdEZlbmNlZEpzb24oc291cmNlLCBsYW5ndWFnZSk7XG4gICAgaWYgKCFmZW5jZWQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSnNvbkRvY3VtZW50KGZlbmNlZCwgZmFsbGJhY2tUaXRsZSk7XG4gICAgaWYgKHBhcnNlZCkgcmV0dXJuIHBhcnNlZDtcbiAgfVxuXG4gIHJldHVybiBtYXJrZG93blRvRG9jdW1lbnQoc291cmNlLCBmYWxsYmFja1RpdGxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb25lRG9jdW1lbnQoZG9jOiBNaW5kTWFwRG9jdW1lbnQpOiBNaW5kTWFwRG9jdW1lbnQge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkb2MpKSBhcyBNaW5kTWFwRG9jdW1lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZU5vZGVXaXRoRnJlc2hJZHMobm9kZTogTWluZE1hcE5vZGUpOiBNaW5kTWFwTm9kZSB7XG4gIGNvbnN0IGNsb25lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShub2RlKSkgYXMgTWluZE1hcE5vZGU7XG4gIHdhbGtOb2RlcyhjbG9uZSwgKGN1cnJlbnQpID0+IHtcbiAgICBjdXJyZW50LmlkID0gbmV3SWQoKTtcbiAgfSk7XG4gIHJldHVybiBjbG9uZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhbGtOb2Rlcyhyb290OiBNaW5kTWFwTm9kZSwgdmlzaXRvcjogKG5vZGU6IE1pbmRNYXBOb2RlLCBwYXJlbnQ6IE1pbmRNYXBOb2RlIHwgbnVsbCkgPT4gdm9pZCk6IHZvaWQge1xuICBjb25zdCB2aXNpdCA9IChub2RlOiBNaW5kTWFwTm9kZSwgcGFyZW50OiBNaW5kTWFwTm9kZSB8IG51bGwpOiB2b2lkID0+IHtcbiAgICB2aXNpdG9yKG5vZGUsIHBhcmVudCk7XG4gICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIG5vZGUpKTtcbiAgfTtcbiAgdmlzaXQocm9vdCwgbnVsbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuTm9kZXMocm9vdDogTWluZE1hcE5vZGUpOiBNaW5kTWFwTm9kZVtdIHtcbiAgY29uc3Qgbm9kZXM6IE1pbmRNYXBOb2RlW10gPSBbXTtcbiAgd2Fsa05vZGVzKHJvb3QsIChub2RlKSA9PiBub2Rlcy5wdXNoKG5vZGUpKTtcbiAgcmV0dXJuIG5vZGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZE5vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBNaW5kTWFwTm9kZSB8IG51bGwge1xuICBsZXQgcmVzdWx0OiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUpID0+IHtcbiAgICBpZiAobm9kZS5pZCA9PT0gaWQpIHJlc3VsdCA9IG5vZGU7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhcmVudChyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gIGxldCByZXN1bHQ6IE1pbmRNYXBOb2RlIHwgbnVsbCA9IG51bGw7XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSwgcGFyZW50KSA9PiB7XG4gICAgaWYgKG5vZGUuaWQgPT09IGlkKSByZXN1bHQgPSBwYXJlbnQ7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEFuY2VzdG9ycyhyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlW10ge1xuICBjb25zdCBwYXRoOiBNaW5kTWFwTm9kZVtdID0gW107XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE1pbmRNYXBOb2RlKTogYm9vbGVhbiA9PiB7XG4gICAgaWYgKG5vZGUuaWQgPT09IGlkKSByZXR1cm4gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgIHBhdGgucHVzaChub2RlKTtcbiAgICAgIGlmICh2aXNpdChjaGlsZCkpIHJldHVybiB0cnVlO1xuICAgICAgcGF0aC5wb3AoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICByZXR1cm4gdmlzaXQocm9vdCkgPyBwYXRoIDogW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluc05vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGZpbmROb2RlKHJvb3QsIGlkKSAhPT0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZU5vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJvb3QuY2hpbGRyZW4ubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgaWYgKHJvb3QuY2hpbGRyZW5baW5kZXhdPy5pZCA9PT0gaWQpIHtcbiAgICAgIHJvb3QuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZCA9IHJvb3QuY2hpbGRyZW5baW5kZXhdO1xuICAgIGlmIChjaGlsZCAmJiByZW1vdmVOb2RlKGNoaWxkLCBpZCkpIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RXaWtpTGlua3Mocm9vdDogTWluZE1hcE5vZGUpOiBTZXQ8c3RyaW5nPiB7XG4gIGNvbnN0IGxpbmtzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhdHRlcm4gPSAvXFxbXFxbKFteXFxdfCNdKykoPzojW15cXF18XSspPyg/OlxcfFteXFxdXSspP1xcXVxcXS9nO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUpID0+IHtcbiAgICBjb25zdCB2YWx1ZXMgPSBbbm9kZVBsYWluVGV4dChub2RlKSwgbm9kZS5ub3RlID8/IFwiXCIsIG5vZGUubGluayA/PyBcIlwiLCAuLi5ub2RlQ29udGVudEJsb2Nrcyhub2RlKS5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikubWFwKChibG9jaykgPT4gYmxvY2suc291cmNlKSwgbm9kZS5zdWJtYXA/LnBhdGggPz8gXCJcIl07XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiB2YWx1ZXMpIHtcbiAgICAgIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgICAgIHdoaWxlICgobWF0Y2ggPSBwYXR0ZXJuLmV4ZWModmFsdWUpKSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAobWF0Y2hbMV0pIGxpbmtzLmFkZChtYXRjaFsxXS50cmltKCkpO1xuICAgICAgfVxuICAgICAgcGF0dGVybi5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgICBjb25zdCBleHBsaWNpdExpbmsgPSBub2RlLmxpbms/LnRyaW0oKTtcbiAgICBpZiAoZXhwbGljaXRMaW5rICYmICEvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KGV4cGxpY2l0TGluaykgJiYgIWV4cGxpY2l0TGluay5pbmNsdWRlcyhcIltbXCIpKSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBleHBsaWNpdExpbmsuc3BsaXQoXCJ8XCIpWzBdPy5zcGxpdChcIiNcIilbMF0/LnRyaW0oKTtcbiAgICAgIGlmICh0YXJnZXQpIGxpbmtzLmFkZCh0YXJnZXQpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBsaW5rcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RGaXJzdFdpa2lMaW5rKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSB2YWx1ZS5tYXRjaCgvXFxbXFxbKFteXFxdfCNdKyg/OiNbXlxcXXxdKyk/KSg/OlxcfFteXFxdXSspP1xcXVxcXS8pO1xuICByZXR1cm4gbWF0Y2g/LlsxXT8udHJpbSgpID8/IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXNrUHJvZ3Jlc3Mocm9vdDogTWluZE1hcE5vZGUpOiBUYXNrUHJvZ3Jlc3Mge1xuICBsZXQgZG9uZSA9IDA7XG4gIGxldCB0b3RhbCA9IDA7XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSkgPT4ge1xuICAgIGlmICghbm9kZS50YXNrKSByZXR1cm47XG4gICAgdG90YWwgKz0gMTtcbiAgICBpZiAobm9kZS50YXNrID09PSBcImRvbmVcIikgZG9uZSArPSAxO1xuICB9KTtcbiAgcmV0dXJuIHsgZG9uZSwgdG90YWwgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVTZWFyY2hUZXh0KG5vZGU6IE1pbmRNYXBOb2RlKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtub2RlUGxhaW5UZXh0KG5vZGUpLCBub2RlLm5vdGUsIG5vZGUubGluaywgLi4ubm9kZUNvbnRlbnRCbG9ja3Mobm9kZSkubWFwKChibG9jaykgPT4gYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiID8gYCR7YmxvY2suc291cmNlfSAke2Jsb2NrLmFsdCA/PyBcIlwifWAgOiBibG9jay50ZXh0KSwgbm9kZS5pY29uLCBub2RlLnN1Ym1hcD8ucGF0aCwgbm9kZS5jb2RlPy5sYW5ndWFnZSwgbm9kZS5jb2RlPy5jb2RlLCAuLi4obm9kZS50YWJsZT8uaGVhZGVycyA/PyBbXSksIC4uLihub2RlLnRhYmxlPy5yb3dzLmZsYXQoKSA/PyBbXSksIC4uLihub2RlLnRhZ3MgPz8gW10pXVxuICAgIC5maWx0ZXIoKHZhbHVlKTogdmFsdWUgaXMgc3RyaW5nID0+IEJvb2xlYW4odmFsdWUpKVxuICAgIC5qb2luKFwiIFwiKVxuICAgIC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0YXNrUHJlZml4KHRhc2s6IFRhc2tTdGF0dXMgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAodGFzayA9PT0gXCJkb25lXCIpIHJldHVybiBcIlt4XSBcIjtcbiAgaWYgKHRhc2sgPT09IFwiZG9pbmdcIikgcmV0dXJuIFwiWy1dIFwiO1xuICBpZiAodGFzayA9PT0gXCJ0b2RvXCIpIHJldHVybiBcIlsgXSBcIjtcbiAgcmV0dXJuIFwiXCI7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUlubGluZU1hcmtkb3duKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvKFtcXFxcYCpfe31cXFtcXF08Pl0pL2csIFwiXFxcXCQxXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmljaFRleHRUb01hcmtkb3duKHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFydW5zPy5sZW5ndGgpIHJldHVybiBlc2NhcGVJbmxpbmVNYXJrZG93bihmYWxsYmFja1RleHQpO1xuICByZXR1cm4gcnVucy5tYXAoKHJ1bikgPT4ge1xuICAgIGxldCB2YWx1ZSA9IGVzY2FwZUlubGluZU1hcmtkb3duKHJ1bi50ZXh0KTtcbiAgICBjb25zdCBzdHlsZSA9IHJ1bi5zdHlsZTtcbiAgICBpZiAoIXN0eWxlKSByZXR1cm4gdmFsdWU7XG4gICAgaWYgKHN0eWxlLmJvbGQpIHZhbHVlID0gYCoqJHt2YWx1ZX0qKmA7XG4gICAgaWYgKHN0eWxlLml0YWxpYykgdmFsdWUgPSBgKiR7dmFsdWV9KmA7XG4gICAgaWYgKHN0eWxlLnN0cmlrZSkgdmFsdWUgPSBgfn4ke3ZhbHVlfX5+YDtcbiAgICBpZiAoc3R5bGUudW5kZXJsaW5lKSB2YWx1ZSA9IGA8dT4ke3ZhbHVlfTwvdT5gO1xuICAgIGlmIChzdHlsZS5jb2xvcikgdmFsdWUgPSBgPHNwYW4gc3R5bGU9XCJjb2xvcjoke3N0eWxlLmNvbG9yfVwiPiR7dmFsdWV9PC9zcGFuPmA7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9KS5qb2luKFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGFibGVUb01hcmtkb3duKHRhYmxlOiBNaW5kTWFwVGFibGUpOiBzdHJpbmcge1xuICBjb25zdCBlc2NhcGVDZWxsID0gKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgPT4gdmFsdWUucmVwbGFjZUFsbChcInxcIiwgXCJcXFxcfFwiKS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiPGJyPlwiKTtcbiAgY29uc3QgaGVhZGVycyA9IGB8ICR7dGFibGUuaGVhZGVycy5tYXAoZXNjYXBlQ2VsbCkuam9pbihcIiB8IFwiKX0gfGA7XG4gIGNvbnN0IGFsaWdubWVudHMgPSB0YWJsZS5oZWFkZXJzLm1hcCgoXywgaW5kZXgpID0+IHtcbiAgICBjb25zdCBhbGlnbm1lbnQgPSB0YWJsZS5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgIHJldHVybiBhbGlnbm1lbnQgPT09IFwiY2VudGVyXCIgPyBcIjotLS06XCIgOiBhbGlnbm1lbnQgPT09IFwicmlnaHRcIiA/IFwiLS0tOlwiIDogXCItLS1cIjtcbiAgfSk7XG4gIGNvbnN0IHNlcGFyYXRvciA9IGB8ICR7YWxpZ25tZW50cy5qb2luKFwiIHwgXCIpfSB8YDtcbiAgY29uc3Qgcm93cyA9IHRhYmxlLnJvd3MubWFwKChyb3cpID0+IGB8ICR7dGFibGUuaGVhZGVycy5tYXAoKF8sIGluZGV4KSA9PiBlc2NhcGVDZWxsKHJvd1tpbmRleF0gPz8gXCJcIikpLmpvaW4oXCIgfCBcIil9IHxgKTtcbiAgcmV0dXJuIFtoZWFkZXJzLCBzZXBhcmF0b3IsIC4uLnJvd3NdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNwbGl0TWFya2Rvd25UYWJsZVJvdyhsaW5lOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHZhbHVlID0gbGluZS50cmltKCkucmVwbGFjZSgvXlxcfC8sIFwiXCIpLnJlcGxhY2UoL1xcfCQvLCBcIlwiKTtcbiAgY29uc3QgY2VsbHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgbGV0IGVzY2FwZWQgPSBmYWxzZTtcbiAgZm9yIChjb25zdCBjaGFyIG9mIHZhbHVlKSB7XG4gICAgaWYgKGVzY2FwZWQpIHsgY3VycmVudCArPSBjaGFyOyBlc2NhcGVkID0gZmFsc2U7IGNvbnRpbnVlOyB9XG4gICAgaWYgKGNoYXIgPT09IFwiXFxcXFwiKSB7IGVzY2FwZWQgPSB0cnVlOyBjb250aW51ZTsgfVxuICAgIGlmIChjaGFyID09PSBcInxcIikgeyBjZWxscy5wdXNoKGN1cnJlbnQudHJpbSgpLnJlcGxhY2VBbGwoXCI8YnI+XCIsIFwiXFxuXCIpKTsgY3VycmVudCA9IFwiXCI7IGNvbnRpbnVlOyB9XG4gICAgY3VycmVudCArPSBjaGFyO1xuICB9XG4gIGNlbGxzLnB1c2goY3VycmVudC50cmltKCkucmVwbGFjZUFsbChcIjxicj5cIiwgXCJcXG5cIikpO1xuICByZXR1cm4gY2VsbHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1hcmtkb3duVGFibGUobWFya2Rvd246IHN0cmluZyk6IE1pbmRNYXBUYWJsZSB8IG51bGwge1xuICBjb25zdCBsaW5lcyA9IG1hcmtkb3duLnNwbGl0KC9cXHI/XFxuLyk7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5lcy5sZW5ndGggLSAxOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgaGVhZGVyTGluZSA9IGxpbmVzW2luZGV4XT8udHJpbSgpID8/IFwiXCI7XG4gICAgY29uc3Qgc2VwYXJhdG9yTGluZSA9IGxpbmVzW2luZGV4ICsgMV0/LnRyaW0oKSA/PyBcIlwiO1xuICAgIGlmICghaGVhZGVyTGluZS5pbmNsdWRlcyhcInxcIikgfHwgIXNlcGFyYXRvckxpbmUuaW5jbHVkZXMoXCJ8XCIpKSBjb250aW51ZTtcbiAgICBjb25zdCBoZWFkZXJzID0gc3BsaXRNYXJrZG93blRhYmxlUm93KGhlYWRlckxpbmUpO1xuICAgIGNvbnN0IHNlcGFyYXRvcnMgPSBzcGxpdE1hcmtkb3duVGFibGVSb3coc2VwYXJhdG9yTGluZSk7XG4gICAgaWYgKCFoZWFkZXJzLmxlbmd0aCB8fCBzZXBhcmF0b3JzLmxlbmd0aCAhPT0gaGVhZGVycy5sZW5ndGggfHwgIXNlcGFyYXRvcnMuZXZlcnkoKGNlbGwpID0+IC9eOj8tezMsfTo/JC8udGVzdChjZWxsLnJlcGxhY2UoL1xccy9nLCBcIlwiKSkpKSBjb250aW51ZTtcbiAgICBjb25zdCBhbGlnbm1lbnRzOiBUYWJsZUFsaWdubWVudFtdID0gc2VwYXJhdG9ycy5tYXAoKGNlbGwpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBhY3QgPSBjZWxsLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgICAgIGlmIChjb21wYWN0LnN0YXJ0c1dpdGgoXCI6XCIpICYmIGNvbXBhY3QuZW5kc1dpdGgoXCI6XCIpKSByZXR1cm4gXCJjZW50ZXJcIjtcbiAgICAgIGlmIChjb21wYWN0LmVuZHNXaXRoKFwiOlwiKSkgcmV0dXJuIFwicmlnaHRcIjtcbiAgICAgIHJldHVybiBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCByb3dzOiBzdHJpbmdbXVtdID0gW107XG4gICAgZm9yIChsZXQgcm93SW5kZXggPSBpbmRleCArIDI7IHJvd0luZGV4IDwgbGluZXMubGVuZ3RoOyByb3dJbmRleCArPSAxKSB7XG4gICAgICBjb25zdCByb3dMaW5lID0gbGluZXNbcm93SW5kZXhdPy50cmltKCkgPz8gXCJcIjtcbiAgICAgIGlmICghcm93TGluZSB8fCAhcm93TGluZS5pbmNsdWRlcyhcInxcIikpIGJyZWFrO1xuICAgICAgY29uc3Qgcm93ID0gc3BsaXRNYXJrZG93blRhYmxlUm93KHJvd0xpbmUpLnNsaWNlKDAsIGhlYWRlcnMubGVuZ3RoKTtcbiAgICAgIHdoaWxlIChyb3cubGVuZ3RoIDwgaGVhZGVycy5sZW5ndGgpIHJvdy5wdXNoKFwiXCIpO1xuICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVUYWJsZSh7IGhlYWRlcnMsIHJvd3MsIGFsaWdubWVudHMsIHNvdXJjZTogXCJtYXJrZG93blwiIH0pID8/IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZlbmNlZENvZGUobWFya2Rvd246IHN0cmluZyk6IE1pbmRNYXBDb2RlQmxvY2sgfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgvYGBgKFteXFxuYF0qKVxcbihbXFxzXFxTXSo/KVxcbmBgYC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIG5vcm1hbGl6ZUNvZGUoeyBsYW5ndWFnZTogbWF0Y2hbMV0/LnRyaW0oKSwgY29kZTogbWF0Y2hbMl0gPz8gXCJcIiB9KSA/PyBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hpbGRyZW5Ub1RhYmxlKG5vZGU6IE1pbmRNYXBOb2RlKTogTWluZE1hcFRhYmxlIHwgbnVsbCB7XG4gIGlmICghbm9kZS5jaGlsZHJlbi5sZW5ndGgpIHJldHVybiBudWxsO1xuICByZXR1cm4ge1xuICAgIGhlYWRlcnM6IFtcIlx1NUI1MFx1ODI4Mlx1NzBCOVwiLCBcIlx1NTkwN1x1NkNFOFwiLCBcIlx1NzJCNlx1NjAwMVwiLCBcIlx1NjgwN1x1N0I3RVwiLCBcIlx1NEUwQlx1N0VBN1x1NjU3MFx1OTFDRlwiXSxcbiAgICByb3dzOiBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IFtcbiAgICAgIG5vZGVQbGFpblRleHQoY2hpbGQpLFxuICAgICAgY2hpbGQubm90ZSA/PyBcIlwiLFxuICAgICAgY2hpbGQudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIDogY2hpbGQudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdThGREJcdTg4NENcdTRFMkRcIiA6IGNoaWxkLnRhc2sgPT09IFwidG9kb1wiID8gXCJcdTVGODVcdTUyOUVcIiA6IFwiXCIsXG4gICAgICBjaGlsZC50YWdzPy5qb2luKFwiLCBcIikgPz8gXCJcIixcbiAgICAgIFN0cmluZyhjaGlsZC5jaGlsZHJlbi5sZW5ndGgpXG4gICAgXSksXG4gICAgYWxpZ25tZW50czogW1wibGVmdFwiLCBcImxlZnRcIiwgXCJjZW50ZXJcIiwgXCJsZWZ0XCIsIFwicmlnaHRcIl0sXG4gICAgc291cmNlOiBcImNoaWxkcmVuXCJcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvY3VtZW50VG9NYXJrZG93bihkb2M6IE1pbmRNYXBEb2N1bWVudCk6IHN0cmluZyB7XG4gIGNvbnN0IHJlbmRlckJsb2NrcyA9IChub2RlOiBNaW5kTWFwTm9kZSk6IHN0cmluZ1tdID0+IHtcbiAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBub2RlQ29udGVudEJsb2Nrcyhub2RlKSkge1xuICAgICAgaWYgKGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmljaFRleHRUb01hcmtkb3duKGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0KTtcbiAgICAgICAgaWYgKHZhbHVlKSByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQucHVzaChgIVske2VzY2FwZUlubGluZU1hcmtkb3duKGJsb2NrLmFsdCA/PyBcIlx1NTZGRVx1NzI0N1wiKX1dKCR7YmxvY2suc291cmNlfSlgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgY29uc3Qgcm9vdEJsb2NrcyA9IHJlbmRlckJsb2Nrcyhkb2Mucm9vdCk7XG4gIGNvbnN0IHJvb3RUaXRsZSA9IHJvb3RCbG9ja3MuZmluZCgodmFsdWUpID0+ICF2YWx1ZS5zdGFydHNXaXRoKFwiIVtcIikpID8/IGRvYy50aXRsZTtcbiAgY29uc3Qgcm9vdFN1ZmZpeCA9IGRvYy5yb290LnRhZ3M/Lmxlbmd0aCA/IGAgJHtkb2Mucm9vdC50YWdzLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApLmpvaW4oXCIgXCIpfWAgOiBcIlwiO1xuICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbYCMgJHtkb2Mucm9vdC5pY29uID8gYCR7ZG9jLnJvb3QuaWNvbn0gYCA6IFwiXCJ9JHtyb290VGl0bGV9JHtyb290U3VmZml4fWBdO1xuICByb290QmxvY2tzLmZpbHRlcigodmFsdWUpID0+IHZhbHVlICE9PSByb290VGl0bGUpLmZvckVhY2goKHZhbHVlKSA9PiBsaW5lcy5wdXNoKHZhbHVlKSk7XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE1pbmRNYXBOb2RlLCBkZXB0aDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgY29uc3QgaW5kZW50ID0gXCIgIFwiLnJlcGVhdChNYXRoLm1heCgwLCBkZXB0aCAtIDEpKTtcbiAgICBjb25zdCB0YWdzID0gbm9kZS50YWdzPy5sZW5ndGggPyBgICR7bm9kZS50YWdzLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApLmpvaW4oXCIgXCIpfWAgOiBcIlwiO1xuICAgIGNvbnN0IGxpbmsgPSBub2RlLmxpbmsgPyBgIFx1MjE5MiAke25vZGUubGlua31gIDogXCJcIjtcbiAgICBjb25zdCBibG9ja3MgPSByZW5kZXJCbG9ja3Mobm9kZSk7XG4gICAgY29uc3QgZmlyc3RUZXh0ID0gYmxvY2tzLmZpbmQoKHZhbHVlKSA9PiAhdmFsdWUuc3RhcnRzV2l0aChcIiFbXCIpKSA/PyAoYmxvY2tzWzBdID8/IFwiXHU1NkZFXHU3MjQ3XHU4MjgyXHU3MEI5XCIpO1xuICAgIGxpbmVzLnB1c2goYCR7aW5kZW50fS0gJHt0YXNrUHJlZml4KG5vZGUudGFzayl9JHtub2RlLmljb24gPyBgJHtub2RlLmljb259IGAgOiBcIlwifSR7Zmlyc3RUZXh0fSR7dGFnc30ke2xpbmt9YCk7XG4gICAgYmxvY2tzLmZpbHRlcigodmFsdWUpID0+IHZhbHVlICE9PSBmaXJzdFRleHQpLmZvckVhY2goKHZhbHVlKSA9PiBsaW5lcy5wdXNoKGAke2luZGVudH0gICR7dmFsdWV9YCkpO1xuICAgIGlmIChub2RlLm5vdGUpIGxpbmVzLnB1c2goYCR7aW5kZW50fSAgPiAke25vZGUubm90ZS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiIFwiKX1gKTtcbiAgICBpZiAobm9kZS5zdWJtYXApIGxpbmVzLnB1c2goYCR7aW5kZW50fSAgPiBcdTVCNTBcdTVCRkNcdTU2RkVcdUZGMUFbWyR7bm9kZS5zdWJtYXAucGF0aH1dXWApO1xuICAgIGlmIChub2RlLnRhYmxlKSBsaW5lcy5wdXNoKFwiXCIsIC4uLnRhYmxlVG9NYXJrZG93bihub2RlLnRhYmxlKS5zcGxpdChcIlxcblwiKS5tYXAoKGxpbmUpID0+IGAke2luZGVudH0gICR7bGluZX1gKSwgXCJcIik7XG4gICAgaWYgKG5vZGUuY29kZSkgbGluZXMucHVzaChgJHtpbmRlbnR9ICBcXGBcXGBcXGAke25vZGUuY29kZS5sYW5ndWFnZSA/PyBcIlwifWAsIC4uLm5vZGUuY29kZS5jb2RlLnNwbGl0KFwiXFxuXCIpLm1hcCgobGluZSkgPT4gYCR7aW5kZW50fSAgJHtsaW5lfWApLCBgJHtpbmRlbnR9ICBcXGBcXGBcXGBgKTtcbiAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgZGVwdGggKyAxKSk7XG4gIH07XG4gIGRvYy5yb290LmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgMSkpO1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUYXNrVGV4dCh2YWx1ZTogc3RyaW5nKTogeyB0ZXh0OiBzdHJpbmc7IHRhc2s/OiBUYXNrU3RhdHVzIH0ge1xuICBjb25zdCBtYXRjaCA9IHZhbHVlLm1hdGNoKC9eXFxbKCB8eHxYfC0pXFxdXFxzKyguKykkLyk7XG4gIGlmICghbWF0Y2gpIHJldHVybiB7IHRleHQ6IHZhbHVlIH07XG4gIGNvbnN0IG1hcmtlciA9IG1hdGNoWzFdO1xuICBjb25zdCB0YXNrOiBUYXNrU3RhdHVzID0gbWFya2VyID09PSBcInhcIiB8fCBtYXJrZXIgPT09IFwiWFwiID8gXCJkb25lXCIgOiBtYXJrZXIgPT09IFwiLVwiID8gXCJkb2luZ1wiIDogXCJ0b2RvXCI7XG4gIHJldHVybiB7IHRleHQ6IG1hdGNoWzJdPy50cmltKCkgfHwgXCJcdTRFRkJcdTUyQTFcIiwgdGFzayB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFya2Rvd25Ub0RvY3VtZW50KG1hcmtkb3duOiBzdHJpbmcsIGZhbGxiYWNrVGl0bGUgPSBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTogTWluZE1hcERvY3VtZW50IHtcbiAgY29uc3QgZG9jID0gY3JlYXRlRGVmYXVsdERvY3VtZW50KGZhbGxiYWNrVGl0bGUpO1xuICBkb2Mucm9vdC5jaGlsZHJlbiA9IFtdO1xuICBjb25zdCBzdGFjazogQXJyYXk8eyBsZXZlbDogbnVtYmVyOyBub2RlOiBNaW5kTWFwTm9kZSB9PiA9IFt7IGxldmVsOiAwLCBub2RlOiBkb2Mucm9vdCB9XTtcbiAgbGV0IHJvb3RBc3NpZ25lZCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBtYXJrZG93bi5zcGxpdCgvXFxyP1xcbi8pKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGlmICghbGluZS50cmltKCkgfHwgbGluZS50cmltU3RhcnQoKS5zdGFydHNXaXRoKFwiLS0tXCIpIHx8IGxpbmUudHJpbVN0YXJ0KCkuc3RhcnRzV2l0aChcImBgYFwiKSB8fCAvXlxccyo+Ly50ZXN0KGxpbmUpKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eXFxzKigjezEsNn0pXFxzKyguKz8pXFxzKiQvKTtcbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eKFxccyopWy0qK11cXHMrKC4rPylcXHMqJC8pO1xuICAgIGNvbnN0IG51bWJlcmVkID0gbGluZS5tYXRjaCgvXihcXHMqKVxcZCtbLildXFxzKyguKz8pXFxzKiQvKTtcblxuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBsZXZlbCA9IGhlYWRpbmdbMV0/Lmxlbmd0aCA/PyAxO1xuICAgICAgY29uc3QgdGV4dCA9IGhlYWRpbmdbMl0/LnRyaW0oKSA/PyBcIlx1ODI4Mlx1NzBCOVwiO1xuICAgICAgaWYgKGxldmVsID09PSAxICYmICFyb290QXNzaWduZWQpIHtcbiAgICAgICAgZG9jLnJvb3QudGV4dCA9IHRleHQ7XG4gICAgICAgIGRvYy50aXRsZSA9IHRleHQ7XG4gICAgICAgIHJvb3RBc3NpZ25lZCA9IHRydWU7XG4gICAgICAgIHN0YWNrLmxlbmd0aCA9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBub2RlID0gY3JlYXRlTm9kZSh0ZXh0KTtcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDEgJiYgKHN0YWNrLmF0KC0xKT8ubGV2ZWwgPz8gMCkgPj0gbGV2ZWwpIHN0YWNrLnBvcCgpO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSBzdGFjay5hdCgtMSk/Lm5vZGUgPz8gZG9jLnJvb3Q7XG4gICAgICAgIHBhcmVudC5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgICBzdGFjay5wdXNoKHsgbGV2ZWwsIG5vZGUgfSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0TWF0Y2ggPSBidWxsZXQgPz8gbnVtYmVyZWQ7XG4gICAgaWYgKGxpc3RNYXRjaCkge1xuICAgICAgY29uc3Qgc3BhY2VzID0gKGxpc3RNYXRjaFsxXSA/PyBcIlwiKS5yZXBsYWNlQWxsKFwiXFx0XCIsIFwiICBcIikubGVuZ3RoO1xuICAgICAgY29uc3QgbGV2ZWwgPSBNYXRoLmZsb29yKHNwYWNlcyAvIDIpICsgMjtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlVGFza1RleHQoKGxpc3RNYXRjaFsyXSA/PyBcIlx1ODI4Mlx1NzBCOVwiKS50cmltKCkpO1xuICAgICAgY29uc3Qgbm9kZSA9IGNyZWF0ZU5vZGUocGFyc2VkLnRleHQpO1xuICAgICAgbm9kZS50YXNrID0gcGFyc2VkLnRhc2s7XG4gICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMSAmJiAoc3RhY2suYXQoLTEpPy5sZXZlbCA/PyAwKSA+PSBsZXZlbCkgc3RhY2sucG9wKCk7XG4gICAgICBjb25zdCBwYXJlbnQgPSBzdGFjay5hdCgtMSk/Lm5vZGUgPz8gZG9jLnJvb3Q7XG4gICAgICBwYXJlbnQuY2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgIHN0YWNrLnB1c2goeyBsZXZlbCwgbm9kZSB9KTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWRvYy5yb290LmNoaWxkcmVuLmxlbmd0aCkgZG9jLnJvb3QuY2hpbGRyZW4ucHVzaChjcmVhdGVOb2RlKFwiXHU0RTNCXHU5ODk4IDFcIikpO1xuICByZXR1cm4gZG9jO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBNaW5kTWFwU3R1ZGlvUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB0eXBlIHtcbiAgQmFja2dyb3VuZFBhdHRlcm4sXG4gIEVkZ2VTdHlsZSxcbiAgRWRnZVdpZHRoTW9kZSxcbiAgRm9udEZhbWlseU1vZGUsXG4gIExheW91dE1vZGUsXG4gIE1pbmRNYXBBcHBlYXJhbmNlLFxuICBNaW5kTWFwVGhlbWVQcmVzZXRJZCxcbiAgTm9kZVNoYXBlLFxuICBUaGVtZU1vZGVcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGFwcGVhcmFuY2VGcm9tVGhlbWVQcmVzZXQsIE1JTkRNQVBfVEhFTUVfUFJFU0VUUyB9IGZyb20gXCIuL3RoZW1lc1wiO1xuXG5leHBvcnQgdHlwZSBJbWFnZUhvc3RCb2R5TW9kZSA9IFwibXVsdGlwYXJ0XCIgfCBcInJhd1wiO1xuZXhwb3J0IHR5cGUgSW1hZ2VIb3N0TWV0aG9kID0gXCJQT1NUXCIgfCBcIlBVVFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdENvbmZpZyB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZW5kcG9pbnQ6IHN0cmluZztcbiAgbWV0aG9kOiBJbWFnZUhvc3RNZXRob2Q7XG4gIGJvZHlNb2RlOiBJbWFnZUhvc3RCb2R5TW9kZTtcbiAgZmllbGROYW1lOiBzdHJpbmc7XG4gIGhlYWRlcnM6IHN0cmluZztcbiAgcmVzcG9uc2VQYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0Q2hvaWNlIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdFVwbG9hZFN1Y2Nlc3Mge1xuICBob3N0SWQ6IHN0cmluZztcbiAgaG9zdE5hbWU6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0VXBsb2FkRmFpbHVyZSB7XG4gIGhvc3RJZDogc3RyaW5nO1xuICBob3N0TmFtZTogc3RyaW5nO1xuICBlcnJvcjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdFVwbG9hZEJhdGNoIHtcbiAgc3VjY2Vzc2VzOiBJbWFnZUhvc3RVcGxvYWRTdWNjZXNzW107XG4gIGZhaWx1cmVzOiBJbWFnZUhvc3RVcGxvYWRGYWlsdXJlW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbWFnZUhvc3RDb25maWcoaW5kZXggPSAxKTogSW1hZ2VIb3N0Q29uZmlnIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogYGhvc3RfJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA4KX1gLFxuICAgIG5hbWU6IGBcdTU2RkVcdTVFOEEgJHtpbmRleH1gLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgZW5kcG9pbnQ6IFwiXCIsXG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBib2R5TW9kZTogXCJtdWx0aXBhcnRcIixcbiAgICBmaWVsZE5hbWU6IFwiZmlsZVwiLFxuICAgIGhlYWRlcnM6IFwiXCIsXG4gICAgcmVzcG9uc2VQYXRoOiBcImRhdGEudXJsXCJcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwU3R1ZGlvU2V0dGluZ3Mge1xuICBkZWZhdWx0Rm9sZGVyOiBzdHJpbmc7XG4gIGZpbGVQcmVmaXg6IHN0cmluZztcbiAgYXNzZXRGb2xkZXI6IHN0cmluZztcbiAgZGVmYXVsdExheW91dDogTGF5b3V0TW9kZTtcbiAgZGVmYXVsdFRoZW1lOiBUaGVtZU1vZGU7XG4gIGRlZmF1bHROb2RlU2hhcGU6IE5vZGVTaGFwZTtcbiAgcmVkaXJlY3RMZWdhY3lGaWxlczogYm9vbGVhbjtcbiAgc2hvd0dyaWQ6IGJvb2xlYW47XG4gIHNob3dUYXNrUHJvZ3Jlc3M6IGJvb2xlYW47XG4gIGF1dG9GaXRPbk9wZW46IGJvb2xlYW47XG4gIGhpc3RvcnlMaW1pdDogbnVtYmVyO1xuICBlbWJlZE1heEhlaWdodDogbnVtYmVyO1xuICBkZWZhdWx0VGhlbWVQcmVzZXQ6IE1pbmRNYXBUaGVtZVByZXNldElkO1xuICBiYWNrZ3JvdW5kQ29sb3I6IHN0cmluZztcbiAgYmFja2dyb3VuZFBhdHRlcm46IEJhY2tncm91bmRQYXR0ZXJuO1xuICBiYWNrZ3JvdW5kUGF0dGVybkNvbG9yOiBzdHJpbmc7XG4gIGZvbnRGYW1pbHk6IEZvbnRGYW1pbHlNb2RlO1xuICBjdXN0b21Gb250OiBzdHJpbmc7XG4gIGZvbnRTaXplOiBudW1iZXI7XG4gIGVkZ2VDb2xvcjogc3RyaW5nO1xuICBlZGdlV2lkdGg6IG51bWJlcjtcbiAgZWRnZVN0eWxlOiBFZGdlU3R5bGU7XG4gIGVkZ2VXaWR0aE1vZGU6IEVkZ2VXaWR0aE1vZGU7XG4gIGVkZ2VNaW5XaWR0aDogbnVtYmVyO1xuICByb290Q29sb3I6IHN0cmluZztcbiAgcm9vdFRleHRDb2xvcjogc3RyaW5nO1xuICBjb2xvcmZ1bEJyYW5jaGVzOiBib29sZWFuO1xuICBicmFuY2hDb2xvcnM6IHN0cmluZ1tdO1xuICBub2RlQmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHRleHRDb2xvcjogc3RyaW5nO1xuICBub2RlQm9yZGVyQ29sb3I6IHN0cmluZztcbiAgbm9kZUJvcmRlcldpZHRoOiBudW1iZXI7XG4gIGRlZmF1bHRUZXh0Qm9sZDogYm9vbGVhbjtcbiAgZGVmYXVsdFRleHRJdGFsaWM6IGJvb2xlYW47XG4gIGRlZmF1bHRUZXh0VW5kZXJsaW5lOiBib29sZWFuO1xuICBpbWFnZUhvc3RzOiBJbWFnZUhvc3RDb25maWdbXTtcbiAgYXV0b1VwbG9hZEVuYWJsZWQ6IGJvb2xlYW47XG4gIGF1dG9VcGxvYWREZWxheVNlY29uZHM6IG51bWJlcjtcbiAgYXV0b1VwbG9hZEhvc3RJZHM6IHN0cmluZ1tdO1xuICBkZWxldGVMb2NhbEFmdGVyVXBsb2FkOiBib29sZWFuO1xuICBpbWFnZUZhaWxvdmVyRW5hYmxlZDogYm9vbGVhbjtcbiAgaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzOiBudW1iZXI7XG4gIGltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogTWluZE1hcFN0dWRpb1NldHRpbmdzID0ge1xuICBkZWZhdWx0Rm9sZGVyOiBcIlwiLFxuICBmaWxlUHJlZml4OiBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiLFxuICBhc3NldEZvbGRlcjogXCJNaW5kTWFwIEFzc2V0c1wiLFxuICBkZWZhdWx0TGF5b3V0OiBcInJpZ2h0XCIsXG4gIGRlZmF1bHRUaGVtZTogXCJhdXRvXCIsXG4gIGRlZmF1bHROb2RlU2hhcGU6IFwicm91bmRlZFwiLFxuICByZWRpcmVjdExlZ2FjeUZpbGVzOiB0cnVlLFxuICBzaG93R3JpZDogdHJ1ZSxcbiAgc2hvd1Rhc2tQcm9ncmVzczogdHJ1ZSxcbiAgYXV0b0ZpdE9uT3BlbjogdHJ1ZSxcbiAgaGlzdG9yeUxpbWl0OiAxMjAsXG4gIGVtYmVkTWF4SGVpZ2h0OiA1MjAsXG4gIGRlZmF1bHRUaGVtZVByZXNldDogXCJjbGFzc2ljLWluZGlnb1wiLFxuICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2Y4ZmFmY1wiLFxuICBiYWNrZ3JvdW5kUGF0dGVybjogXCJncmlkXCIsXG4gIGJhY2tncm91bmRQYXR0ZXJuQ29sb3I6IFwiIzk0YTNiOFwiLFxuICBmb250RmFtaWx5OiBcIm9ic2lkaWFuXCIsXG4gIGN1c3RvbUZvbnQ6IFwiXCIsXG4gIGZvbnRTaXplOiAxNCxcbiAgZWRnZUNvbG9yOiBcIiM2MzY2ZjFcIixcbiAgZWRnZVdpZHRoOiA0LjIsXG4gIGVkZ2VTdHlsZTogXCJjdXJ2ZWRcIixcbiAgZWRnZVdpZHRoTW9kZTogXCJ0YXBlcmVkXCIsXG4gIGVkZ2VNaW5XaWR0aDogMS4yLFxuICByb290Q29sb3I6IFwiIzRmNDZlNVwiLFxuICByb290VGV4dENvbG9yOiBcIiNmZmZmZmZcIixcbiAgY29sb3JmdWxCcmFuY2hlczogdHJ1ZSxcbiAgYnJhbmNoQ29sb3JzOiBbXCIjNGY0NmU1XCIsIFwiIzAyODRjN1wiLCBcIiMwZjc2NmVcIiwgXCIjN2MzYWVkXCIsIFwiI2RiMjc3N1wiLCBcIiNlYTU4MGNcIl0sXG4gIG5vZGVCYWNrZ3JvdW5kQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICB0ZXh0Q29sb3I6IFwiIzE3MjAzM1wiLFxuICBub2RlQm9yZGVyQ29sb3I6IFwiI2M3ZDJmZVwiLFxuICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gIGRlZmF1bHRUZXh0Qm9sZDogZmFsc2UsXG4gIGRlZmF1bHRUZXh0SXRhbGljOiBmYWxzZSxcbiAgZGVmYXVsdFRleHRVbmRlcmxpbmU6IGZhbHNlLFxuICBpbWFnZUhvc3RzOiBbXSxcbiAgYXV0b1VwbG9hZEVuYWJsZWQ6IGZhbHNlLFxuICBhdXRvVXBsb2FkRGVsYXlTZWNvbmRzOiAxMCxcbiAgYXV0b1VwbG9hZEhvc3RJZHM6IFtdLFxuICBkZWxldGVMb2NhbEFmdGVyVXBsb2FkOiB0cnVlLFxuICBpbWFnZUZhaWxvdmVyRW5hYmxlZDogdHJ1ZSxcbiAgaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzOiA4LFxuICBpbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjazogdHJ1ZVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldHRpbmdzVG9BcHBlYXJhbmNlKHNldHRpbmdzOiBNaW5kTWFwU3R1ZGlvU2V0dGluZ3MpOiBNaW5kTWFwQXBwZWFyYW5jZSB7XG4gIHJldHVybiB7XG4gICAgdGhlbWVQcmVzZXQ6IHNldHRpbmdzLmRlZmF1bHRUaGVtZVByZXNldCxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IHNldHRpbmdzLmJhY2tncm91bmRDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgYmFja2dyb3VuZFBhdHRlcm46IHNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuLFxuICAgIHBhdHRlcm5Db2xvcjogc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm5Db2xvciB8fCB1bmRlZmluZWQsXG4gICAgZm9udEZhbWlseTogc2V0dGluZ3MuZm9udEZhbWlseSxcbiAgICBjdXN0b21Gb250OiBzZXR0aW5ncy5jdXN0b21Gb250LnRyaW0oKSB8fCB1bmRlZmluZWQsXG4gICAgZm9udFNpemU6IHNldHRpbmdzLmZvbnRTaXplLFxuICAgIGVkZ2VDb2xvcjogc2V0dGluZ3MuZWRnZUNvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICBlZGdlV2lkdGg6IHNldHRpbmdzLmVkZ2VXaWR0aCxcbiAgICBlZGdlU3R5bGU6IHNldHRpbmdzLmVkZ2VTdHlsZSxcbiAgICBlZGdlV2lkdGhNb2RlOiBzZXR0aW5ncy5lZGdlV2lkdGhNb2RlLFxuICAgIGVkZ2VNaW5XaWR0aDogc2V0dGluZ3MuZWRnZU1pbldpZHRoLFxuICAgIHJvb3RDb2xvcjogc2V0dGluZ3Mucm9vdENvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICByb290VGV4dENvbG9yOiBzZXR0aW5ncy5yb290VGV4dENvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICBjb2xvcmZ1bEJyYW5jaGVzOiBzZXR0aW5ncy5jb2xvcmZ1bEJyYW5jaGVzLFxuICAgIGJyYW5jaENvbG9yczogc2V0dGluZ3MuYnJhbmNoQ29sb3JzLmxlbmd0aCA/IFsuLi5zZXR0aW5ncy5icmFuY2hDb2xvcnNdIDogdW5kZWZpbmVkLFxuICAgIG5vZGVDb2xvcjogc2V0dGluZ3Mubm9kZUJhY2tncm91bmRDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgdGV4dENvbG9yOiBzZXR0aW5ncy50ZXh0Q29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIG5vZGVCb3JkZXJDb2xvcjogc2V0dGluZ3Mubm9kZUJvcmRlckNvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICBub2RlQm9yZGVyV2lkdGg6IHNldHRpbmdzLm5vZGVCb3JkZXJXaWR0aCxcbiAgICBib2xkOiBzZXR0aW5ncy5kZWZhdWx0VGV4dEJvbGQsXG4gICAgaXRhbGljOiBzZXR0aW5ncy5kZWZhdWx0VGV4dEl0YWxpYyxcbiAgICB1bmRlcmxpbmU6IHNldHRpbmdzLmRlZmF1bHRUZXh0VW5kZXJsaW5lXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVRoZW1lUHJlc2V0VG9TZXR0aW5ncyhzZXR0aW5nczogTWluZE1hcFN0dWRpb1NldHRpbmdzLCBwcmVzZXRJZDogTWluZE1hcFRoZW1lUHJlc2V0SWQpOiB2b2lkIHtcbiAgY29uc3QgYXBwZWFyYW5jZSA9IGFwcGVhcmFuY2VGcm9tVGhlbWVQcmVzZXQocHJlc2V0SWQpO1xuICBzZXR0aW5ncy5kZWZhdWx0VGhlbWVQcmVzZXQgPSBwcmVzZXRJZDtcbiAgc2V0dGluZ3MuYmFja2dyb3VuZENvbG9yID0gYXBwZWFyYW5jZS5iYWNrZ3JvdW5kQ29sb3IgPz8gXCJcIjtcbiAgc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm4gPSBhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID8/IFwibm9uZVwiO1xuICBzZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybkNvbG9yID0gYXBwZWFyYW5jZS5wYXR0ZXJuQ29sb3IgPz8gXCIjOTRhM2I4XCI7XG4gIHNldHRpbmdzLmZvbnRGYW1pbHkgPSBhcHBlYXJhbmNlLmZvbnRGYW1pbHkgPz8gXCJvYnNpZGlhblwiO1xuICBzZXR0aW5ncy5jdXN0b21Gb250ID0gYXBwZWFyYW5jZS5jdXN0b21Gb250ID8/IFwiXCI7XG4gIHNldHRpbmdzLmZvbnRTaXplID0gYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNDtcbiAgc2V0dGluZ3MuZWRnZUNvbG9yID0gYXBwZWFyYW5jZS5lZGdlQ29sb3IgPz8gXCJcIjtcbiAgc2V0dGluZ3MuZWRnZVdpZHRoID0gYXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gMi4yO1xuICBzZXR0aW5ncy5lZGdlU3R5bGUgPSBhcHBlYXJhbmNlLmVkZ2VTdHlsZSA/PyBcImN1cnZlZFwiO1xuICBzZXR0aW5ncy5lZGdlV2lkdGhNb2RlID0gYXBwZWFyYW5jZS5lZGdlV2lkdGhNb2RlID8/IFwidW5pZm9ybVwiO1xuICBzZXR0aW5ncy5lZGdlTWluV2lkdGggPSBhcHBlYXJhbmNlLmVkZ2VNaW5XaWR0aCA/PyBNYXRoLm1pbigxLCBzZXR0aW5ncy5lZGdlV2lkdGgpO1xuICBzZXR0aW5ncy5yb290Q29sb3IgPSBhcHBlYXJhbmNlLnJvb3RDb2xvciA/PyBcIlwiO1xuICBzZXR0aW5ncy5yb290VGV4dENvbG9yID0gYXBwZWFyYW5jZS5yb290VGV4dENvbG9yID8/IFwiXCI7XG4gIHNldHRpbmdzLmNvbG9yZnVsQnJhbmNoZXMgPSBhcHBlYXJhbmNlLmNvbG9yZnVsQnJhbmNoZXMgPT09IHRydWU7XG4gIHNldHRpbmdzLmJyYW5jaENvbG9ycyA9IGFwcGVhcmFuY2UuYnJhbmNoQ29sb3JzID8gWy4uLmFwcGVhcmFuY2UuYnJhbmNoQ29sb3JzXSA6IFtdO1xuICBzZXR0aW5ncy5ub2RlQmFja2dyb3VuZENvbG9yID0gYXBwZWFyYW5jZS5ub2RlQ29sb3IgPz8gXCJcIjtcbiAgc2V0dGluZ3MudGV4dENvbG9yID0gYXBwZWFyYW5jZS50ZXh0Q29sb3IgPz8gXCJcIjtcbiAgc2V0dGluZ3Mubm9kZUJvcmRlckNvbG9yID0gYXBwZWFyYW5jZS5ub2RlQm9yZGVyQ29sb3IgPz8gXCJcIjtcbiAgc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoID0gYXBwZWFyYW5jZS5ub2RlQm9yZGVyV2lkdGggPz8gMTtcbiAgc2V0dGluZ3MuZGVmYXVsdFRleHRCb2xkID0gYXBwZWFyYW5jZS5ib2xkID09PSB0cnVlO1xuICBzZXR0aW5ncy5kZWZhdWx0VGV4dEl0YWxpYyA9IGFwcGVhcmFuY2UuaXRhbGljID09PSB0cnVlO1xuICBzZXR0aW5ncy5kZWZhdWx0VGV4dFVuZGVybGluZSA9IGFwcGVhcmFuY2UudW5kZXJsaW5lID09PSB0cnVlO1xufVxuXG5leHBvcnQgY2xhc3MgTWluZE1hcFN0dWRpb1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW47XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogTWluZE1hcFN0dWRpb1BsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIk1pbmRNYXAgU3R1ZGlvXCIgfSk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIixcbiAgICAgIHRleHQ6IFwiXHU4RkQ5XHU5MUNDXHU4QkJFXHU3RjZFXHU1MTY4XHU1QzQwXHU5RUQ4XHU4QkE0XHU1OTE2XHU4OUMyXHUzMDAyXHU2MjUzXHU1RjAwXHU4MTExXHU1NkZFXHU1NDBFXHVGRjBDXHU0RTVGXHU1M0VGXHU0RUU1XHU3MEI5XHU1MUZCXHU1REU1XHU1MTc3XHU2ODBGXHU0RTJEXHU3Njg0XHU4QzAzXHU4MjcyXHU2NzdGXHVGRjBDXHU0RTNBXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU1MzU1XHU3MkVDXHU0RkREXHU1QjU4XHU0RTAwXHU1OTU3XHU2ODM3XHU1RjBGXHUzMDAyXCJcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NEUzQlx1OTg5OFx1NkEyMVx1Njc3RlwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NEUzQlx1OTg5OFwiKVxuICAgICAgLnNldERlc2MoXCJcdTkwMDlcdTYyRTlcdTU0MEVcdTRGMUFcdTRFMDBcdTZCMjFcdTVFOTRcdTc1MjhcdTgwQ0NcdTY2NkZcdTMwMDFcdTgyODJcdTcwQjlcdTMwMDFcdTUyMDZcdTY1MkZcdTkxNERcdTgyNzJcdTMwMDFcdTVCNTdcdTRGNTNcdTU0OENcdThGREVcdTdFQkZcdTY4MzdcdTVGMEZcdUZGMUJcdTRFNEJcdTU0MEVcdTRFQ0RcdTUzRUZcdTdFRTdcdTdFRURcdTRGRUVcdTY1MzlcdTUzNTVcdTk4NzlcdThCQkVcdTdGNkVcdTMwMDJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBwcmVzZXQgb2YgTUlORE1BUF9USEVNRV9QUkVTRVRTKSBkcm9wZG93bi5hZGRPcHRpb24ocHJlc2V0LmlkLCBwcmVzZXQubmFtZSk7XG4gICAgICAgIGRyb3Bkb3duLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUaGVtZVByZXNldCk7XG4gICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGFwcGx5VGhlbWVQcmVzZXRUb1NldHRpbmdzKHRoaXMucGx1Z2luLnNldHRpbmdzLCB2YWx1ZSBhcyBNaW5kTWFwVGhlbWVQcmVzZXRJZCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgY29uc3QgdGhlbWVQcmV2aWV3ID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy10aGVtZS1wcmV2aWV3LXJvd1wiIH0pO1xuICAgIGZvciAoY29uc3QgcHJlc2V0IG9mIE1JTkRNQVBfVEhFTUVfUFJFU0VUUykge1xuICAgICAgY29uc3QgY2FyZCA9IHRoZW1lUHJldmlldy5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIGNsczogYG1tcy10aGVtZS1wcmV2aWV3LWNhcmQke3ByZXNldC5pZCA9PT0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRoZW1lUHJlc2V0ID8gXCIgaXMtc2VsZWN0ZWRcIiA6IFwiXCJ9YCxcbiAgICAgICAgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiLCB0aXRsZTogcHJlc2V0LmRlc2NyaXB0aW9uIH1cbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc3dhdGNoZXMgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbXMtdGhlbWUtcHJldmlldy1zd2F0Y2hlc1wiIH0pO1xuICAgICAgY29uc3QgY29sb3JzID0gW3ByZXNldC5hcHBlYXJhbmNlLnJvb3RDb2xvciwgLi4uKHByZXNldC5hcHBlYXJhbmNlLmJyYW5jaENvbG9ycyA/PyBbXSkuc2xpY2UoMCwgNCldLmZpbHRlcigoY29sb3IpOiBjb2xvciBpcyBzdHJpbmcgPT4gQm9vbGVhbihjb2xvcikpO1xuICAgICAgY29sb3JzLmZvckVhY2goKGNvbG9yKSA9PiB7IGNvbnN0IGRvdCA9IHN3YXRjaGVzLmNyZWF0ZVNwYW4oKTsgZG90LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yOyB9KTtcbiAgICAgIGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy10aGVtZS1wcmV2aWV3LW5hbWVcIiwgdGV4dDogcHJlc2V0Lm5hbWUgfSk7XG4gICAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGFwcGx5VGhlbWVQcmVzZXRUb1NldHRpbmdzKHRoaXMucGx1Z2luLnNldHRpbmdzLCBwcmVzZXQuaWQpO1xuICAgICAgICB2b2lkIHRoaXMuc2F2ZUFuZFJlZnJlc2goKS50aGVuKCgpID0+IHRoaXMuZGlzcGxheSgpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NjU4N1x1NEVGNlx1NEUwRVx1NUUwM1x1NUM0MFwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NEZERFx1NUI1OFx1NjU4N1x1NEVGNlx1NTkzOVwiKVxuICAgICAgLnNldERlc2MoXCJcdTc1NTlcdTdBN0FcdTY1RjZcdTRGRERcdTVCNThcdTU3MjhcdTVGNTNcdTUyNERcdTdCMTRcdThCQjBcdTYyNDBcdTU3MjhcdTY1ODdcdTRFRjZcdTU5MzlcdUZGMUJcdTRFNUZcdTUzRUZcdTU4NkJcdTUxOTlcdTRGOEJcdTU5ODIgTWluZCBNYXBzXHUzMDAyXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJNaW5kIE1hcHNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Rm9sZGVyID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1OEJFNVx1OERFRlx1NUY4NFx1NzZGOFx1NUJGOVx1NEU4RVx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NjI0MFx1NTcyOFx1NzZFRVx1NUY1NVx1MzAwMlx1N0M5OFx1OEQzNFx1NTZGRVx1NzI0N1x1NEYxQVx1NEZERFx1NUI1OFx1NTIzMFx1MjAxQ1x1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NzZFRVx1NUY1NS9cdThCRTVcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcdTU5MzkvXHUyMDFEXHVGRjFCXHU1QjUwXHU1QkZDXHU1NkZFXHU0RjFBXHU0RkREXHU1QjU4XHU1NzI4XHUyMDFDXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU3NkVFXHU1RjU1L1x1OEJFNVx1OEQ0NFx1NkU5MFx1NjU4N1x1NEVGNlx1NTkzOS9cdTcyMzZcdTVCRkNcdTU2RkVcdTU0MERcdTc5RjAvXHUyMDFEXHU0RTJEXHUzMDAyXHU5RUQ4XHU4QkE0XHU0RjdGXHU3NTI4IE1pbmRNYXAgQXNzZXRzXHUzMDAyXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJNaW5kTWFwIEFzc2V0c1wiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NldEZvbGRlciA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKSB8fCBcIk1pbmRNYXAgQXNzZXRzXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NzI0N1x1NEUwRVx1NTZGRVx1NUU4QVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OEZEQ1x1N0EwQlx1NTZGRVx1NzI0N1x1ODFFQVx1NTJBOFx1NjU0NVx1OTY5Q1x1OEY2Q1x1NzlGQlwiKVxuICAgICAgLnNldERlc2MoXCJcdTVGNTNcdTUyNERcdTU2RkVcdTVFOEFcdTU3MzBcdTU3NDBcdTUyQTBcdThGN0RcdTU5MzFcdThEMjVcdTYyMTZcdThEODVcdTY1RjZcdTU0MEVcdUZGMENcdTYzMDlcdTk1NUNcdTUwQ0ZcdTk4N0FcdTVFOEZcdTVDMURcdThCRDVcdTRFMEJcdTRFMDBcdTU3MzBcdTU3NDBcdUZGMUJcdTYyMTBcdTUyOUZcdTU0MEVcdTgxRUFcdTUyQThcdTVDMDZcdTUzRUZcdTc1MjhcdTU3MzBcdTU3NDBcdTRGRERcdTVCNThcdTRFM0FcdTY1QjBcdTc2ODRcdTRFM0JcdTU3MzBcdTU3NDBcdTMwMDJcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyRW5hYmxlZClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRmFpbG92ZXJFbmFibGVkID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pKTtcblxuICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyRW5hYmxlZCkge1xuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiXHU1MzU1XHU0RTJBXHU5NTVDXHU1MENGXHU3QjQ5XHU1Rjg1XHU2NUY2XHU5NUY0XCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU1NkZFXHU3MjQ3XHU1NzI4XHU4QkU1XHU2NUY2XHU5NUY0XHU1MTg1XHU2NzJBXHU2MjEwXHU1MjlGXHU1MkEwXHU4RjdEXHVGRjBDXHU1QzMxXHU1QzFEXHU4QkQ1XHU0RTBCXHU0RTAwXHU0RTJBXHU5NTVDXHU1MENGXHUzMDAyXHU4MzAzXHU1NkY0IDJcdTIwMTMzMCBcdTc5RDJcdTMwMDJcIilcbiAgICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgICAuc2V0TGltaXRzKDIsIDMwLCAxKVxuICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kcylcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHMgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiXHU2NzJDXHU1NzMwXHU1MjZGXHU2NzJDXHU0RjVDXHU0RTNBXHU2NzAwXHU1NDBFXHU1NkRFXHU5MDAwXCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU4RkRDXHU3QTBCXHU5NTVDXHU1MENGXHU1MTY4XHU5MEU4XHU1OTMxXHU2NTQ4XHU2NUY2XHVGRjBDXHU1OTgyXHU2NzlDXHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3XHU0RUNEXHU1QjU4XHU1NzI4XHVGRjBDXHU1MjE5XHU2NzAwXHU1NDBFXHU1QzFEXHU4QkQ1XHU2NzJDXHU1NzMwXHU1MjZGXHU2NzJDXHUzMDAyXCIpXG4gICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1N0M5OFx1OEQzNFx1NTZGRVx1NzI0N1x1NTQwRVx1ODFFQVx1NTJBOFx1NEUwQVx1NEYyMFwiKVxuICAgICAgLnNldERlc2MoXCJcdTU2RkVcdTcyNDdcdTRGMUFcdTUxNDhcdTRGRERcdTVCNThcdTUyMzBcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTc2ODRcdTY3MkNcdTU3MzBcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcdTU5MzlcdUZGMENcdTUxOERcdTYzMDlcdThCQkVcdTVCOUFcdTVFRjZcdThGREZcdTRFMEFcdTRGMjBcdTMwMDJcdTUzRUFcdTY3MDlcdTUxNjhcdTkwRThcdTc2RUVcdTY4MDdcdTU2RkVcdTVFOEFcdTYyMTBcdTUyOUZcdTU0MEVcdUZGMENcdTYyNERcdTRGMUFcdTUyMDdcdTYzNjJcdTRFM0FcdThGRENcdTdBMEJcdTdGNTFcdTU3NDBcdTMwMDJcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkRW5hYmxlZClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWRFbmFibGVkID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pKTtcblxuICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkRW5hYmxlZCkge1xuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU1RUY2XHU4RkRGXCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU3Qzk4XHU4RDM0XHU1NDBFXHU3QjQ5XHU1Rjg1IDBcdTIwMTMzMDAgXHU3OUQyXHU1MThEXHU0RTBBXHU0RjIwXHVGRjBDXHU0RkJGXHU0RThFXHU2NEE0XHU5NTAwXHU2MjE2XHU3RUU3XHU3RUVEXHU3RjE2XHU4RjkxXHUzMDAyXCIpXG4gICAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgICAgLnNldExpbWl0cygwLCAzMDAsIDEpXG4gICAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZERlbGF5U2Vjb25kcylcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkRGVsYXlTZWNvbmRzID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1NTE2OFx1OTBFOFx1NjIxMFx1NTI5Rlx1NTQwRVx1NTIyMFx1OTY2NFx1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1wiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1NjNEMlx1NEVGNlx1NEYxQVx1NTE0OFx1NTE5OVx1NTE2NVx1OEZEQ1x1N0EwQlx1N0Y1MVx1NTc0MFx1NUU3Nlx1NEZERFx1NUI1OFx1ODExMVx1NTZGRVx1RkYwQ1x1NTE4RFx1NjhDMFx1NjdFNVx1NTZGRVx1NzI0N1x1NjYyRlx1NTQyNlx1ODhBQlx1NTE3Nlx1NEVENlx1ODExMVx1NTZGRVx1NUYxNVx1NzUyOFx1RkYxQlx1Nzg2RVx1OEJBNFx1NUI4OVx1NTE2OFx1NTQwRVx1NjI0RFx1NTIyMFx1OTY2NFx1NjcyQ1x1NTczMFx1NjU4N1x1NEVGNlx1MzAwMlx1NEVGQlx1NEUwMFx1NTZGRVx1NUU4QVx1NTkzMVx1OEQyNVx1NjVGNlx1NEYxQVx1NEZERFx1NzU1OVx1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1MzAwMlwiKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWxldGVMb2NhbEFmdGVyVXBsb2FkKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlbGV0ZUxvY2FsQWZ0ZXJVcGxvYWQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBjb25zdCBob3N0cyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlSG9zdHM7XG4gICAgY29uc3QgaG9zdHNIZWFkZXIgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWltYWdlLWhvc3RzLWhlYWRlclwiIH0pO1xuICAgIGhvc3RzSGVhZGVyLmNyZWF0ZUVsKFwiaDRcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NUU4QVx1OTE0RFx1N0Y2RVwiIH0pO1xuICAgIGNvbnN0IGFkZEhvc3QgPSBob3N0c0hlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU2NUIwXHU1ODlFXHU1NkZFXHU1RThBXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGFkZEhvc3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IGhvc3QgPSBjcmVhdGVJbWFnZUhvc3RDb25maWcoaG9zdHMubGVuZ3RoICsgMSk7XG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RzLnB1c2goaG9zdCk7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpLnRoZW4oKCkgPT4gdGhpcy5kaXNwbGF5KCkpO1xuICAgIH0pO1xuXG4gICAgaWYgKCFob3N0cy5sZW5ndGgpIHtcbiAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZURpdih7IGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb24gbW1zLWltYWdlLWhvc3QtZW1wdHlcIiwgdGV4dDogXCJcdTVDMUFcdTY3MkFcdTkxNERcdTdGNkVcdTU2RkVcdTVFOEFcdTMwMDJcdTY1QjBcdTU4OUVcdTU0MEVcdTUzRUZcdTRFRTVcdTZENEJcdThCRDVcdTRFMEFcdTRGMjBcdTYzQTVcdTUzRTNcdUZGMENcdTVFNzZcdTkwMDlcdTYyRTlcdTRFMDBcdTRFMkFcdTYyMTZcdTU5MUFcdTRFMkFcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcdTc2RUVcdTY4MDdcdTMwMDJcIiB9KTtcbiAgICB9XG5cbiAgICBob3N0cy5mb3JFYWNoKChob3N0LCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgY2FyZCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7IGNsczogXCJtbXMtaW1hZ2UtaG9zdC1jYXJkXCIgfSk7XG4gICAgICBjb25zdCB0aXRsZSA9IGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LWNhcmQtdGl0bGVcIiB9KTtcbiAgICAgIHRpdGxlLmNyZWF0ZUVsKFwic3Ryb25nXCIsIHsgdGV4dDogaG9zdC5uYW1lIHx8IGBcdTU2RkVcdTVFOEEgJHtpbmRleCArIDF9YCB9KTtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHRpdGxlLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1zLWltYWdlLWhvc3Qtc3RhdHVzXCIsIHRleHQ6IGhvc3QuZW5hYmxlZCA/IFwiXHU1REYyXHU1NDJGXHU3NTI4XCIgOiBcIlx1NURGMlx1NTA1Q1x1NzUyOFwiIH0pO1xuICAgICAgc3RhdHVzLnRvZ2dsZUNsYXNzKFwiaXMtZW5hYmxlZFwiLCBob3N0LmVuYWJsZWQpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjYXJkKVxuICAgICAgICAuc2V0TmFtZShcIlx1NTQwRFx1NzlGMFwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0Lm5hbWUpXG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKGBcdTU2RkVcdTVFOEEgJHtpbmRleCArIDF9YClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBob3N0Lm5hbWUgPSB2YWx1ZS50cmltKCkgfHwgYFx1NTZGRVx1NUU4QSAke2luZGV4ICsgMX1gO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSkpXG4gICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgICAgLnNldFRvb2x0aXAoXCJcdTU0MkZcdTc1MjhcdThCRTVcdTU2RkVcdTVFOEFcIilcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5lbmFibGVkKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGhvc3QuZW5hYmxlZCA9IHZhbHVlO1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gaG9zdC5pZCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgIH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdTRFMEFcdTRGMjAgQVBJXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiaHR0cHM6Ly9leGFtcGxlLmNvbS9hcGkvdXBsb2FkXCIpXG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QuZW5kcG9pbnQpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4geyBob3N0LmVuZHBvaW50ID0gdmFsdWUudHJpbSgpOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjYXJkKVxuICAgICAgICAuc2V0TmFtZShcIlx1OEJGN1x1NkM0Mlx1NjVCOVx1NkNENVx1NEUwRVx1NjgzQ1x1NUYwRlwiKVxuICAgICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAgIC5hZGRPcHRpb24oXCJQT1NUXCIsIFwiUE9TVFwiKVxuICAgICAgICAgIC5hZGRPcHRpb24oXCJQVVRcIiwgXCJQVVRcIilcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5tZXRob2QpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4geyBob3N0Lm1ldGhvZCA9IHZhbHVlIGFzIEltYWdlSG9zdE1ldGhvZDsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKVxuICAgICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAgIC5hZGRPcHRpb24oXCJtdWx0aXBhcnRcIiwgXCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIpXG4gICAgICAgICAgLmFkZE9wdGlvbihcInJhd1wiLCBcIlx1NTM5Rlx1NTlDQlx1NEU4Q1x1OEZEQlx1NTIzNlwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0LmJvZHlNb2RlKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5ib2R5TW9kZSA9IHZhbHVlIGFzIEltYWdlSG9zdEJvZHlNb2RlOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjYXJkKVxuICAgICAgICAuc2V0TmFtZShcIlx1NjU4N1x1NEVGNlx1NUI1N1x1NkJCNVx1NTQwRFwiKVxuICAgICAgICAuc2V0RGVzYyhcIm11bHRpcGFydCBcdTZBMjFcdTVGMEZcdTVFMzhcdTg5QzFcdTUwM0NcdUZGMUFmaWxlXHUzMDAxaW1hZ2VcdTMwMDFzb3VyY2VcdTMwMDJcIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5maWVsZE5hbWUpXG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiZmlsZVwiKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5maWVsZE5hbWUgPSB2YWx1ZS50cmltKCkgfHwgXCJmaWxlXCI7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNhcmQpXG4gICAgICAgIC5zZXROYW1lKFwiXHU4QkY3XHU2QzQyXHU1OTM0IEpTT05cIilcbiAgICAgICAgLnNldERlc2MoXCJcdTRGOEJcdTU5ODIgQXV0aG9yaXphdGlvblx1MzAwMVgtQVBJLUtleVx1MzAwMlx1NUJDNlx1OTRBNVx1NEZERFx1NUI1OFx1NTcyOFx1NjNEMlx1NEVGNiBkYXRhLmpzb25cdTMwMDJcIilcbiAgICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QuaGVhZGVycylcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ3tcIkF1dGhvcml6YXRpb25cIjpcIkJlYXJlciAuLi5cIn0nKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5oZWFkZXJzID0gdmFsdWUudHJpbSgpOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjYXJkKVxuICAgICAgICAuc2V0TmFtZShcIlx1OEZENFx1NTZERVx1N0Y1MVx1NTc0MFx1NUI1N1x1NkJCNVwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1NEY4Qlx1NTk4MiBkYXRhLnVybFx1RkYxQlx1NzU1OVx1N0E3QVx1NEYxQVx1NUMxRFx1OEJENVx1NUUzOFx1ODlDMVx1NUI1N1x1NkJCNVx1MzAwMlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0LnJlc3BvbnNlUGF0aClcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJkYXRhLnVybFwiKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5yZXNwb25zZVBhdGggPSB2YWx1ZS50cmltKCk7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSk7XG5cbiAgICAgIGNvbnN0IGlzQXV0b1RhcmdldCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWRIb3N0SWRzLmluY2x1ZGVzKGhvc3QuaWQpO1xuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcdTc2RUVcdTY4MDdcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcdTUzRUZcdTRFRTVcdTU0MENcdTY1RjZcdTkwMDlcdTYyRTlcdTU5MUFcdTRFMkFcdTU2RkVcdTVFOEFcdUZGMUJcdTYyNEJcdTUyQThcdTRFMEFcdTRGMjBcdTY1RjZcdTRFQ0RcdTUzRUZcdTRFMzRcdTY1RjZcdTkwMDlcdTYyRTlcdTUxNzZcdTRFRDZcdTdFQzRcdTU0MDhcdTMwMDJcIilcbiAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgICAuc2V0VmFsdWUoaXNBdXRvVGFyZ2V0KVxuICAgICAgICAgIC5zZXREaXNhYmxlZCghaG9zdC5lbmFibGVkKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkID0gbmV3IFNldCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcyk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHNlbGVjdGVkLmFkZChob3N0LmlkKTsgZWxzZSBzZWxlY3RlZC5kZWxldGUoaG9zdC5pZCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcyA9IEFycmF5LmZyb20oc2VsZWN0ZWQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSkpO1xuXG4gICAgICBjb25zdCBhY3Rpb25zID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWltYWdlLWhvc3QtYWN0aW9uc1wiIH0pO1xuICAgICAgY29uc3QgdGVzdCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NjhDMFx1NkQ0QiBBUEkgXHU4RkRFXHU5MDFBXHU2MDI3XCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgICAgdGVzdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0ZXN0LmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgdGVzdC5zZXRUZXh0KFwiXHU2OEMwXHU2RDRCXHU0RTJEXHUyMDI2XCIpO1xuICAgICAgICB2b2lkIHRoaXMucGx1Z2luLnRlc3RJbWFnZUhvc3QoaG9zdC5pZCkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgdGVzdC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIHRlc3Quc2V0VGV4dChcIlx1NjhDMFx1NkQ0QiBBUEkgXHU4RkRFXHU5MDFBXHU2MDI3XCIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgY29uc3QgcmVtb3ZlID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1MjIwXHU5NjY0XHU1NkZFXHU1RThBXCIsIGNsczogXCJtb2Qtd2FybmluZ1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgIHJlbW92ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0cy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uaWQgIT09IGhvc3QuaWQpO1xuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWRIb3N0SWRzLmZpbHRlcigoaWQpID0+IGlkICE9PSBob3N0LmlkKTtcbiAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBuZXcgTm90aWNlKGBcdTVERjJcdTUyMjBcdTk2NjRcdTU2RkVcdTVFOEFcdUZGMUEke2hvc3QubmFtZX1gKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTY1QjBcdTY1ODdcdTRFRjZcdTU0MERcdTUyNERcdTdGMDBcIilcbiAgICAgIC5zZXREZXNjKFwiXHU2NUIwXHU1RUZBXHU4MTExXHU1NkZFXHU2NUY2XHU0RjdGXHU3NTI4XHVGRjFBXHU1MjREXHU3RjAwICsgXHU2NUU1XHU2NzFGXHU2NUY2XHU5NUY0XHUzMDAyXHU2NTg3XHU0RUY2XHU1NDBFXHU3RjAwXHU1NkZBXHU1QjlBXHU0RTNBIC5taW5kbWFwXHUzMDAyXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmZpbGVQcmVmaXgpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlUHJlZml4ID0gdmFsdWUudHJpbSgpIHx8IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTVFMDNcdTVDNDBcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1MzU1XHU0RkE3XHU5MDAyXHU1NDA4XHU2RDQxXHU3QTBCXHU2MkM2XHU4OUUzXHVGRjBDXHU1M0NDXHU0RkE3XHU5MDAyXHU1NDA4XHU1OTM0XHU4MTExXHU5OENFXHU2NkI0XHUzMDAyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwicmlnaHRcIiwgXCJcdTU0MTFcdTUzRjNcdTVDNTVcdTVGMDBcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImJhbGFuY2VkXCIsIFwiXHU1REU2XHU1M0YzXHU1RTczXHU4ODYxXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0TGF5b3V0KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdExheW91dCA9IHZhbHVlIGFzIExheW91dE1vZGU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTY2MEVcdTY2OTdcdTZBMjFcdTVGMEZcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJhdXRvXCIsIFwiXHU4RERGXHU5NjhGIE9ic2lkaWFuXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJsaWdodFwiLCBcIlx1NkQ0NVx1ODI3MlwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiZGFya1wiLCBcIlx1NkRGMVx1ODI3MlwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRoZW1lKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRoZW1lID0gdmFsdWUgYXMgVGhlbWVNb2RlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTc1M0JcdTVFMDNcdTgwQ0NcdTY2NkZcIiB9KTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU4MENDXHU2NjZGXHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NzU1OVx1N0E3QVx1NjVGNlx1OERERlx1OTY4RiBPYnNpZGlhbiBcdTVGNTNcdTUyNERcdTRFM0JcdTk4OThcdTMwMDJcIixcbiAgICAgICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2tncm91bmRDb2xvcixcbiAgICAgIGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kQ29sb3IgPSB2YWx1ZTsgfSxcbiAgICAgIFwiI2Y4ZmFmY1wiXG4gICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTgwQ0NcdTY2NkZcdTU2RkVcdTY4NDhcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1M0VGXHU5MDA5XHU2MkU5XHU3RjUxXHU2ODNDXHUzMDAxXHU3MEI5XHU5NjM1XHU2MjE2XHU3RUFGXHU4MjcyXHU4MENDXHU2NjZGXHUzMDAyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwibm9uZVwiLCBcIlx1NjVFMFwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiZ3JpZFwiLCBcIlx1N0Y1MVx1NjgzQ1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiZG90c1wiLCBcIlx1NzBCOVx1OTYzNVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm4pXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybiA9IHZhbHVlIGFzIEJhY2tncm91bmRQYXR0ZXJuO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dHcmlkID0gdmFsdWUgIT09IFwibm9uZVwiO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTgwQ0NcdTY2NkZcdTU2RkVcdTY4NDhcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU2M0E3XHU1MjM2XHU3RjUxXHU2ODNDXHU3RUJGXHU2MjE2XHU3MEI5XHU5NjM1XHU3Njg0XHU5ODlDXHU4MjcyXHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybkNvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuQ29sb3IgPSB2YWx1ZSB8fCBcIiM5NGEzYjhcIjsgfSxcbiAgICAgIFwiIzk0YTNiOFwiLFxuICAgICAgZmFsc2VcbiAgICApO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU1QjU3XHU0RjUzXHU0RTBFXHU2NTg3XHU1QjU3XCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU1QjU3XHU0RjUzXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwib2JzaWRpYW5cIiwgXCJcdThEREZcdTk2OEYgT2JzaWRpYW5cIilcbiAgICAgICAgLmFkZE9wdGlvbihcInNhbnNcIiwgXCJcdTY1RTBcdTg4NkNcdTdFQkZcdTVCNTdcdTRGNTNcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInNlcmlmXCIsIFwiXHU4ODZDXHU3RUJGXHU1QjU3XHU0RjUzXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJtb25vXCIsIFwiXHU3QjQ5XHU1QkJEXHU1QjU3XHU0RjUzXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJjdXN0b21cIiwgXCJcdTgxRUFcdTVCOUFcdTRFNDlcdTVCNTdcdTRGNTNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbnRGYW1pbHkpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250RmFtaWx5ID0gdmFsdWUgYXMgRm9udEZhbWlseU1vZGU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udEZhbWlseSA9PT0gXCJjdXN0b21cIikge1xuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHU1QjU3XHU0RjUzXHU1NDBEXHU3OUYwXCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU1ODZCXHU1MTk5XHU3Q0ZCXHU3RURGXHU0RTJEXHU1REYyXHU3RUNGXHU1Qjg5XHU4OEM1XHU3Njg0XHU1QjU3XHU0RjUzXHU1NDBEXHU3OUYwXHVGRjBDXHU0RjhCXHU1OTgyIE1pY3Jvc29mdCBZYUhlaVx1MzAwMVBpbmdGYW5nIFNDXHUzMDAyXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiTWljcm9zb2Z0IFlhSGVpXCIpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmN1c3RvbUZvbnQpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY3VzdG9tRm9udCA9IHZhbHVlLnRyaW0oKS5zbGljZSgwLCAxMjApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU1QjU3XHU1M0Y3XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODMwM1x1NTZGNCAxMFx1MjAxMzMwIFx1NTBDRlx1N0QyMFx1MzAwMlx1ODI4Mlx1NzBCOVx1NEVDRFx1NTNFRlx1NTM1NVx1NzJFQ1x1ODk4Nlx1NzZENlx1NUI1N1x1NTNGN1x1MzAwMlwiKVxuICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgLnNldExpbWl0cygxMCwgMzAsIDEpXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250U2l6ZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbnRTaXplID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBcIlx1OUVEOFx1OEJBNFx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiLFxuICAgICAgXCJcdTc1NTlcdTdBN0FcdTY1RjZcdTRGN0ZcdTc1MjggT2JzaWRpYW4gXHU0RTNCXHU5ODk4XHU2NTg3XHU1QjU3XHU5ODlDXHU4MjcyXHVGRjFCXHU2ODM5XHU4MjgyXHU3MEI5XHU0RUNEXHU0RjE4XHU1MTQ4XHU0RjdGXHU3NTI4XHU0RTNCXHU5ODk4XHU1RjNBXHU4QzAzXHU4MjcyXHU3Njg0XHU1QkY5XHU2QkQ0XHU2NTg3XHU1QjU3XHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZXh0Q29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGV4dENvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiMwZjE3MmFcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU2NTg3XHU1QjU3XHU1MkEwXHU3Qzk3XCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRleHRCb2xkKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRleHRCb2xkID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU2NTg3XHU1QjU3XHU2NTlDXHU0RjUzXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRleHRJdGFsaWMpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGV4dEl0YWxpYyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NjU4N1x1NUI1N1x1NEUwQlx1NTIxMlx1N0VCRlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0VW5kZXJsaW5lKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRleHRVbmRlcmxpbmUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1ODI4Mlx1NzBCOVx1NjgzN1x1NUYwRlwiIH0pO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTRFMkRcdTVGQzNcdTRFM0JcdTk4OThcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU2ODM5XHU4MjgyXHU3MEI5XHU3Njg0XHU4MENDXHU2NjZGXHU5ODlDXHU4MjcyXHUzMDAyXHU0RTNCXHU5ODk4XHU2QTIxXHU2NzdGXHU0RjFBXHU4MUVBXHU1MkE4XHU4QkJFXHU3RjZFXHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yb290Q29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3Mucm9vdENvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiM0ZjQ2ZTVcIlxuICAgICk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBcIlx1NEUyRFx1NUZDM1x1NEUzQlx1OTg5OFx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiLFxuICAgICAgXCJcdTY4MzlcdTgyODJcdTcwQjlcdTc2ODRcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcdTMwMDJcIixcbiAgICAgICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzLnJvb3RUZXh0Q29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3Mucm9vdFRleHRDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjZmZmZmZmXCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1ODI4Mlx1NzBCOVx1NUY2Mlx1NzJCNlwiKVxuICAgICAgLnNldERlc2MoXCJcdTUzRUFcdTVGNzFcdTU0Q0RcdTY3MkFcdTUzNTVcdTcyRUNcdThCQkVcdTdGNkVcdTVGNjJcdTcyQjZcdTc2ODRcdTgyODJcdTcwQjlcdTMwMDJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJyb3VuZGVkXCIsIFwiXHU1NzA2XHU4OUQyXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJwaWxsXCIsIFwiXHU4MEY2XHU1NkNBXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJyZWN0YW5nbGVcIiwgXCJcdTc2RjRcdTg5RDJcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHROb2RlU2hhcGUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Tm9kZVNoYXBlID0gdmFsdWUgYXMgTm9kZVNoYXBlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTlFRDhcdThCQTRcdTgyODJcdTcwQjlcdTgwQ0NcdTY2NkZcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU4RERGXHU5NjhGIE9ic2lkaWFuIFx1NEUzQlx1OTg5OFx1MzAwMlx1NTM1NVx1NEUyQVx1ODI4Mlx1NzBCOVx1OEJCRVx1N0Y2RVx1NzY4NFx1OTg5Q1x1ODI3Mlx1NEYxOFx1NTE0OFx1N0VBN1x1NjZGNFx1OUFEOFx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJhY2tncm91bmRDb2xvcixcbiAgICAgIGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub2RlQmFja2dyb3VuZENvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiNmZmZmZmZcIlxuICAgICk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBcIlx1OUVEOFx1OEJBNFx1ODI4Mlx1NzBCOVx1OEZCOVx1Njg0Nlx1OTg5Q1x1ODI3MlwiLFxuICAgICAgXCJcdTc1NTlcdTdBN0FcdTY1RjZcdThEREZcdTk2OEYgT2JzaWRpYW4gXHU0RTNCXHU5ODk4XHU4RkI5XHU2ODQ2XHU5ODlDXHU4MjcyXHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub2RlQm9yZGVyQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlckNvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiM5NGEzYjhcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU4MjgyXHU3MEI5XHU4RkI5XHU2ODQ2XHU3Qzk3XHU3RUM2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODMwM1x1NTZGNCAwXHUyMDEzNiBcdTUwQ0ZcdTdEMjBcdUZGMUIwIFx1ODg2OFx1NzkzQVx1NjVFMFx1OEZCOVx1Njg0Nlx1MzAwMlwiKVxuICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgLnNldExpbWl0cygwLCA2LCAwLjUpXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub2RlQm9yZGVyV2lkdGgpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ub2RlQm9yZGVyV2lkdGggPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1OEZERVx1N0VCRlx1NjgzN1x1NUYwRlwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NUY2OVx1ODI3Mlx1NTIwNlx1NjUyRlwiKVxuICAgICAgLnNldERlc2MoXCJcdTYzMDlcdTcxNjdcdTRFMkRcdTVGQzNcdTRFM0JcdTk4OThcdTc2ODRcdTRFMDBcdTdFQTdcdTUyMDZcdTY1MkZcdTUyMDZcdTkxNERcdTk4OUNcdTgyNzJcdUZGMENcdTU0MENcdTRFMDBcdTUyMDZcdTY1MkZcdTc2ODRcdTgyODJcdTcwQjlcdThGQjlcdTY4NDZcdTU0OENcdThGREVcdTdFQkZcdTRGRERcdTYzMDFcdTRFMDBcdTgxRjRcdTMwMDJcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2xvcmZ1bEJyYW5jaGVzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sb3JmdWxCcmFuY2hlcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NTIwNlx1NjUyRlx1OTg5Q1x1ODI3MlwiKVxuICAgICAgLnNldERlc2MoXCJcdTRGN0ZcdTc1MjhcdTkwMTdcdTUzRjdcdTUyMDZcdTk2OTRcdTc2ODRcdTUzNDFcdTUxNkRcdThGREJcdTUyMzZcdTk4OUNcdTgyNzJcdUZGMENcdTRFMDBcdTdFQTdcdTUyMDZcdTY1MkZcdTRGMUFcdTVGQUFcdTczQUZcdTRGN0ZcdTc1MjhcdTMwMDJcIilcbiAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4gdGV4dFxuICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCIjNGY0NmU1LCAjMDI4NGM3LCAjMGY3NjZlXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5icmFuY2hDb2xvcnMuam9pbihcIiwgXCIpKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYnJhbmNoQ29sb3JzID0gdmFsdWUuc3BsaXQoL1ssXHVGRjBDXFxzXSsvKS5tYXAoKGl0ZW0pID0+IGl0ZW0udHJpbSgpKS5maWx0ZXIoKGl0ZW0pID0+IC9eI1swLTlhLWZdezZ9JC9pLnRlc3QoaXRlbSkpLnNsaWNlKDAsIDEyKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdThGREVcdTdFQkZcdTdDN0JcdTU3OEJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJjdXJ2ZWRcIiwgXCJcdTY2RjJcdTdFQkZcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInN0cmFpZ2h0XCIsIFwiXHU3NkY0XHU3RUJGXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJlbGJvd1wiLCBcIlx1NjI5OFx1N0VCRlwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVN0eWxlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVN0eWxlID0gdmFsdWUgYXMgRWRnZVN0eWxlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdThGREVcdTdFQkZcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RTNCXHU5ODk4XHU1RjNBXHU4QzAzXHU4MjcyXHUzMDAyXHU4MjgyXHU3MEI5XHU1MzU1XHU3MkVDXHU4QkJFXHU3RjZFXHU5ODlDXHU4MjcyXHU2NUY2XHVGRjBDXHU1M0VGXHU3RUU3XHU3RUVEXHU0RTNBXHU4QkU1XHU1MjA2XHU2NTJGXHU4RkRFXHU3RUJGXHU3NzQwXHU4MjcyXHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZUNvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiM3YzhhYTVcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4RkRFXHU3RUJGXHU3Qzk3XHU3RUM2XHU2QTIxXHU1RjBGXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1MjAxQ1x1NEVDRVx1N0M5N1x1NTIzMFx1N0VDNlx1MjAxRFx1NEYxQVx1OEJBOVx1OTc2MFx1OEZEMVx1NEUyRFx1NUZDM1x1NEUzQlx1OTg5OFx1NzY4NFx1N0VCRlx1NjcwMFx1N0M5N1x1RkYwQ1x1OEQ4QVx1NkRGMVx1NUM0Mlx1OEQ4QVx1N0VDNlx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcInVuaWZvcm1cIiwgXCJcdTdFREZcdTRFMDBcdTdDOTdcdTdFQzZcIilcbiAgICAgICAgLmFkZE9wdGlvbihcInRhcGVyZWRcIiwgXCJcdTRFQ0VcdTdDOTdcdTUyMzBcdTdFQzZcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aE1vZGUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlV2lkdGhNb2RlID0gdmFsdWUgYXMgRWRnZVdpZHRoTW9kZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVdpZHRoTW9kZSA9PT0gXCJ0YXBlcmVkXCIgPyBcIlx1OEQ3N1x1NTlDQlx1N0M5N1x1N0VDNlwiIDogXCJcdThGREVcdTdFQkZcdTdDOTdcdTdFQzZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU5NzYwXHU4RkQxXHU0RTJEXHU1RkMzXHU0RTNCXHU5ODk4XHU3Njg0XHU4RkRFXHU3RUJGXHU1QkJEXHU1RUE2XHVGRjBDXHU4MzAzXHU1NkY0IDAuNVx1MjAxMzggXHU1MENGXHU3RDIwXHUzMDAyXCIpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDAuNSwgOCwgMC4yNSlcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aCA9IHZhbHVlO1xuICAgICAgICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlTWluV2lkdGggPiB2YWx1ZSkgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZU1pbldpZHRoID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVdpZHRoTW9kZSA9PT0gXCJ0YXBlcmVkXCIpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1NjcyQlx1N0FFRlx1NjcwMFx1N0VDNlx1NUJCRFx1NUVBNlwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1NkRGMVx1NUM0Mlx1NTIwNlx1NjUyRlx1NEUwRFx1NEYxQVx1N0VDNlx1NEU4RVx1OEJFNVx1NTAzQ1x1RkYwQ1x1ODMwM1x1NTZGNCAwLjI1XHUyMDEzNCBcdTUwQ0ZcdTdEMjBcdTMwMDJcIilcbiAgICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgICAuc2V0TGltaXRzKDAuMjUsIDQsIDAuMjUpXG4gICAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZU1pbldpZHRoKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VNaW5XaWR0aCA9IE1hdGgubWluKHZhbHVlLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlV2lkdGgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTdGMTZcdThGOTFcdTRFMEVcdTUxN0NcdTVCQjlcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTYyNTNcdTVGMDBcdTY1RTdcdTcyNDhcdTgxMTFcdTU2RkVcdTY1RjZcdTgxRUFcdTUyQThcdThGNkNcdTYzNjJcIilcbiAgICAgIC5zZXREZXNjKFwiXHU4MUVBXHU1MkE4XHU1MjFCXHU1RUZBXHU1NDBDXHU1NDBEIC5taW5kbWFwIFx1NjU4N1x1NEVGNlx1NUU3Nlx1NjI1M1x1NUYwMFx1RkYxQlx1NjVFN1x1NjU4N1x1NEVGNlx1NEYxQVx1NEZERFx1NzU1OVx1NEUzQVx1NTkwN1x1NEVGRFx1RkYwQ1x1NEUwRFx1NEYxQVx1ODk4Nlx1NzZENlx1NjIxNlx1NTIyMFx1OTY2NFx1MzAwMlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZGlyZWN0TGVnYWN5RmlsZXMpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWRpcmVjdExlZ2FjeUZpbGVzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTY2M0VcdTc5M0FcdTRFRkJcdTUyQTFcdThGREJcdTVFQTZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1NzI4XHU1MzA1XHU1NDJCXHU0RUZCXHU1MkExXHU3Njg0XHU1MjA2XHU2NTJGXHU4MjgyXHU3MEI5XHU1RTk1XHU5MEU4XHU2NjNFXHU3OTNBXHU1QjhDXHU2MjEwXHU3NjdFXHU1MjA2XHU2QkQ0XHUzMDAyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1Rhc2tQcm9ncmVzcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrUHJvZ3Jlc3MgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTYyNTNcdTVGMDBcdTY1RjZcdTgxRUFcdTUyQThcdTkwMDJcdTVFOTRcdTc1M0JcdTVFMDNcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRml0T25PcGVuKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0ZpdE9uT3BlbiA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2NEE0XHU5NTAwXHU1Mzg2XHU1M0YyXHU2QjY1XHU2NTcwXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODMwM1x1NTZGNCAyMFx1MjAxMzUwMFx1RkYxQlx1NjU3MFx1NTAzQ1x1OEQ4QVx1NTkyN1x1NTM2MFx1NzUyOFx1NzY4NFx1NTE4NVx1NUI1OFx1OEQ4QVx1NTkxQVx1MzAwMlwiKVxuICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgLnNldExpbWl0cygyMCwgNTAwLCAxMClcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmhpc3RvcnlMaW1pdClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmhpc3RvcnlMaW1pdCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NUQ0Q1x1NTE2NVx1OTg4NFx1ODlDOFx1NjcwMFx1NTkyN1x1OUFEOFx1NUVBNlwiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMjQwXHUyMDEzMTIwMCBcdTUwQ0ZcdTdEMjBcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMjQwLCAxMjAwLCAyMClcbiAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVtYmVkTWF4SGVpZ2h0KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW1iZWRNYXhIZWlnaHQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgIGdldFZhbHVlOiAoKSA9PiBzdHJpbmcsXG4gICAgc2V0VmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+LFxuICAgIGZhbGxiYWNrOiBzdHJpbmcsXG4gICAgYWxsb3dSZXNldCA9IHRydWVcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgc2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lcilcbiAgICAgIC5zZXROYW1lKG5hbWUpXG4gICAgICAuc2V0RGVzYyhkZXNjcmlwdGlvbilcbiAgICAgIC5hZGRDb2xvclBpY2tlcigocGlja2VyKSA9PiBwaWNrZXJcbiAgICAgICAgLnNldFZhbHVlKGdldFZhbHVlKCkgfHwgZmFsbGJhY2spXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCBzZXRWYWx1ZSh2YWx1ZSk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG4gICAgaWYgKGFsbG93UmVzZXQpIHtcbiAgICAgIHNldHRpbmcuYWRkQnV0dG9uKChidXR0b24pID0+IGJ1dHRvblxuICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlx1OERERlx1OTY4Rlx1NEUzQlx1OTg5OFwiKVxuICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgc2V0VmFsdWUoXCJcIik7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzYXZlQW5kUmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB0aGlzLnBsdWdpbi5yZWZyZXNoT3BlblZpZXdzKCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgdHlwZSB7IE1pbmRNYXBBcHBlYXJhbmNlLCBNaW5kTWFwVGhlbWVQcmVzZXRJZCB9IGZyb20gXCIuL21vZGVsXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFRoZW1lUHJlc2V0IHtcbiAgaWQ6IE1pbmRNYXBUaGVtZVByZXNldElkO1xuICBuYW1lOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlO1xufVxuXG5leHBvcnQgY29uc3QgTUlORE1BUF9USEVNRV9QUkVTRVRTOiByZWFkb25seSBNaW5kTWFwVGhlbWVQcmVzZXRbXSA9IFtcbiAge1xuICAgIGlkOiBcImNsYXNzaWMtaW5kaWdvXCIsXG4gICAgbmFtZTogXCJcdTdFQ0ZcdTUxNzhcdTk3NUJcdTg0RERcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTZFMDVcdTcyM0RcdTMwMDFcdTkwMUFcdTc1MjhcdUZGMENcdTkwMDJcdTU0MDhcdTk4NzlcdTc2RUVcdTRFMEVcdTc3RTVcdThCQzZcdTY1NzRcdTc0MDZcIixcbiAgICBhcHBlYXJhbmNlOiB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2Y4ZmFmY1wiLFxuICAgICAgYmFja2dyb3VuZFBhdHRlcm46IFwiZ3JpZFwiLFxuICAgICAgcGF0dGVybkNvbG9yOiBcIiM5NGEzYjhcIixcbiAgICAgIGZvbnRGYW1pbHk6IFwic2Fuc1wiLFxuICAgICAgZm9udFNpemU6IDE0LFxuICAgICAgcm9vdENvbG9yOiBcIiM0ZjQ2ZTVcIixcbiAgICAgIHJvb3RUZXh0Q29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgbm9kZUNvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIHRleHRDb2xvcjogXCIjMTcyMDMzXCIsXG4gICAgICBub2RlQm9yZGVyQ29sb3I6IFwiI2M3ZDJmZVwiLFxuICAgICAgbm9kZUJvcmRlcldpZHRoOiAxLFxuICAgICAgZWRnZUNvbG9yOiBcIiM2MzY2ZjFcIixcbiAgICAgIGVkZ2VTdHlsZTogXCJjdXJ2ZWRcIixcbiAgICAgIGVkZ2VXaWR0aDogNC4yLFxuICAgICAgZWRnZVdpZHRoTW9kZTogXCJ0YXBlcmVkXCIsXG4gICAgICBlZGdlTWluV2lkdGg6IDEuMixcbiAgICAgIGNvbG9yZnVsQnJhbmNoZXM6IHRydWUsXG4gICAgICBicmFuY2hDb2xvcnM6IFtcIiM0ZjQ2ZTVcIiwgXCIjMDI4NGM3XCIsIFwiIzBmNzY2ZVwiLCBcIiM3YzNhZWRcIiwgXCIjZGIyNzc3XCIsIFwiI2VhNTgwY1wiXVxuICAgIH1cbiAgfSxcbiAge1xuICAgIGlkOiBcIm9jZWFuLWJsdWVcIixcbiAgICBuYW1lOiBcIlx1NkRGMVx1NkQ3N1x1ODRERFwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NTFCN1x1OTc1OVx1MzAwMVx1NEUxM1x1NEUxQVx1RkYwQ1x1OTAwMlx1NTQwOFx1NTIwNlx1Njc5MFx1NEUwRVx1NjI4MFx1NjcyRlx1NTE4NVx1NUJCOVwiLFxuICAgIGFwcGVhcmFuY2U6IHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZjBmOWZmXCIsXG4gICAgICBiYWNrZ3JvdW5kUGF0dGVybjogXCJkb3RzXCIsXG4gICAgICBwYXR0ZXJuQ29sb3I6IFwiIzdkZDNmY1wiLFxuICAgICAgZm9udEZhbWlseTogXCJzYW5zXCIsXG4gICAgICBmb250U2l6ZTogMTQsXG4gICAgICByb290Q29sb3I6IFwiIzA3NTk4NVwiLFxuICAgICAgcm9vdFRleHRDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICBub2RlQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgdGV4dENvbG9yOiBcIiMwYzRhNmVcIixcbiAgICAgIG5vZGVCb3JkZXJDb2xvcjogXCIjYmFlNmZkXCIsXG4gICAgICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gICAgICBlZGdlQ29sb3I6IFwiIzAyODRjN1wiLFxuICAgICAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICAgICAgZWRnZVdpZHRoOiA0LjUsXG4gICAgICBlZGdlV2lkdGhNb2RlOiBcInRhcGVyZWRcIixcbiAgICAgIGVkZ2VNaW5XaWR0aDogMSxcbiAgICAgIGNvbG9yZnVsQnJhbmNoZXM6IHRydWUsXG4gICAgICBicmFuY2hDb2xvcnM6IFtcIiMwMzY5YTFcIiwgXCIjMDg5MWIyXCIsIFwiIzBkOTQ4OFwiLCBcIiMyNTYzZWJcIiwgXCIjNGY0NmU1XCIsIFwiIzA2YjZkNFwiXVxuICAgIH1cbiAgfSxcbiAge1xuICAgIGlkOiBcImZvcmVzdC1ncmVlblwiLFxuICAgIG5hbWU6IFwiXHU2OEVFXHU2Nzk3XHU3RUZGXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU4MUVBXHU3MTM2XHUzMDAxXHU2Qzg5XHU3QTMzXHVGRjBDXHU5MDAyXHU1NDA4XHU4QkExXHU1MjEyXHU0RTBFXHU2MjEwXHU5NTdGXHU0RTNCXHU5ODk4XCIsXG4gICAgYXBwZWFyYW5jZToge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmN2ZlZTdcIixcbiAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBcImRvdHNcIixcbiAgICAgIHBhdHRlcm5Db2xvcjogXCIjODZlZmFjXCIsXG4gICAgICBmb250RmFtaWx5OiBcInNhbnNcIixcbiAgICAgIGZvbnRTaXplOiAxNCxcbiAgICAgIHJvb3RDb2xvcjogXCIjM2Y2MjEyXCIsXG4gICAgICByb290VGV4dENvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIG5vZGVDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICB0ZXh0Q29sb3I6IFwiIzM2NTMxNFwiLFxuICAgICAgbm9kZUJvcmRlckNvbG9yOiBcIiNiYmY3ZDBcIixcbiAgICAgIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgICAgIGVkZ2VDb2xvcjogXCIjNjVhMzBkXCIsXG4gICAgICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gICAgICBlZGdlV2lkdGg6IDQsXG4gICAgICBlZGdlV2lkdGhNb2RlOiBcInRhcGVyZWRcIixcbiAgICAgIGVkZ2VNaW5XaWR0aDogMSxcbiAgICAgIGNvbG9yZnVsQnJhbmNoZXM6IHRydWUsXG4gICAgICBicmFuY2hDb2xvcnM6IFtcIiM0ZDdjMGZcIiwgXCIjMTU4MDNkXCIsIFwiIzBmNzY2ZVwiLCBcIiM2NWEzMGRcIiwgXCIjMDU5NjY5XCIsIFwiIzg0Y2MxNlwiXVxuICAgIH1cbiAgfSxcbiAge1xuICAgIGlkOiBcInN1bnNldC1vcmFuZ2VcIixcbiAgICBuYW1lOiBcIlx1NjVFNVx1ODQzRFx1NkE1OVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NkUyOVx1NjY5Nlx1MzAwMVx1NjcwOVx1NkQzQlx1NTI5Qlx1RkYwQ1x1OTAwMlx1NTQwOFx1NTIxQlx1NjEwRlx1NEUwRVx1ODQyNVx1OTUwMFx1NTE4NVx1NUJCOVwiLFxuICAgIGFwcGVhcmFuY2U6IHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZmZmN2VkXCIsXG4gICAgICBiYWNrZ3JvdW5kUGF0dGVybjogXCJncmlkXCIsXG4gICAgICBwYXR0ZXJuQ29sb3I6IFwiI2ZkYmE3NFwiLFxuICAgICAgZm9udEZhbWlseTogXCJzYW5zXCIsXG4gICAgICBmb250U2l6ZTogMTQsXG4gICAgICByb290Q29sb3I6IFwiI2MyNDEwY1wiLFxuICAgICAgcm9vdFRleHRDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICBub2RlQ29sb3I6IFwiI2ZmZmFmNVwiLFxuICAgICAgdGV4dENvbG9yOiBcIiM3YzJkMTJcIixcbiAgICAgIG5vZGVCb3JkZXJDb2xvcjogXCIjZmVkN2FhXCIsXG4gICAgICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gICAgICBlZGdlQ29sb3I6IFwiI2Y5NzMxNlwiLFxuICAgICAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICAgICAgZWRnZVdpZHRoOiA0LjQsXG4gICAgICBlZGdlV2lkdGhNb2RlOiBcInRhcGVyZWRcIixcbiAgICAgIGVkZ2VNaW5XaWR0aDogMS4yLFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHJ1ZSxcbiAgICAgIGJyYW5jaENvbG9yczogW1wiI2VhNTgwY1wiLCBcIiNmNTllMGJcIiwgXCIjZGMyNjI2XCIsIFwiI2RiMjc3N1wiLCBcIiNkOTc3MDZcIiwgXCIjZjk3MzE2XCJdXG4gICAgfVxuICB9LFxuICB7XG4gICAgaWQ6IFwibGF2ZW5kZXItZHJlYW1cIixcbiAgICBuYW1lOiBcIlx1ODVCMFx1ODg2M1x1ODM0OVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NjdENFx1NTQ4Q1x1MzAwMVx1NEYxOFx1OTZDNVx1RkYwQ1x1OTAwMlx1NTQwOFx1OTYwNVx1OEJGQlx1N0IxNFx1OEJCMFx1NEUwRVx1NzA3NVx1NjExRlx1NjU3NFx1NzQwNlwiLFxuICAgIGFwcGVhcmFuY2U6IHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZmFmNWZmXCIsXG4gICAgICBiYWNrZ3JvdW5kUGF0dGVybjogXCJkb3RzXCIsXG4gICAgICBwYXR0ZXJuQ29sb3I6IFwiI2Q4YjRmZVwiLFxuICAgICAgZm9udEZhbWlseTogXCJzYW5zXCIsXG4gICAgICBmb250U2l6ZTogMTQsXG4gICAgICByb290Q29sb3I6IFwiIzdlMjJjZVwiLFxuICAgICAgcm9vdFRleHRDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICBub2RlQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgdGV4dENvbG9yOiBcIiM1ODFjODdcIixcbiAgICAgIG5vZGVCb3JkZXJDb2xvcjogXCIjZTlkNWZmXCIsXG4gICAgICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gICAgICBlZGdlQ29sb3I6IFwiI2E4NTVmN1wiLFxuICAgICAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICAgICAgZWRnZVdpZHRoOiA0LFxuICAgICAgZWRnZVdpZHRoTW9kZTogXCJ0YXBlcmVkXCIsXG4gICAgICBlZGdlTWluV2lkdGg6IDEsXG4gICAgICBjb2xvcmZ1bEJyYW5jaGVzOiB0cnVlLFxuICAgICAgYnJhbmNoQ29sb3JzOiBbXCIjOTMzM2VhXCIsIFwiI2MwMjZkM1wiLCBcIiM3YzNhZWRcIiwgXCIjZGIyNzc3XCIsIFwiIzYzNjZmMVwiLCBcIiNhODU1ZjdcIl1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICBpZDogXCJjYW5keS1wb3BcIixcbiAgICBuYW1lOiBcIlx1N0NENlx1Njc5Q1x1N0YyNFx1N0VCN1wiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NTkxQVx1NUY2OVx1MzAwMVx1OEY3Qlx1NUZFQlx1RkYwQ1x1OTAwMlx1NTQwOFx1NTkzNFx1ODExMVx1OThDRVx1NjZCNFx1NEUwRVx1NzUxRlx1NkQzQlx1OEJCMFx1NUY1NVwiLFxuICAgIGFwcGVhcmFuY2U6IHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZmZmN2ZiXCIsXG4gICAgICBiYWNrZ3JvdW5kUGF0dGVybjogXCJkb3RzXCIsXG4gICAgICBwYXR0ZXJuQ29sb3I6IFwiI2Y5YThkNFwiLFxuICAgICAgZm9udEZhbWlseTogXCJzYW5zXCIsXG4gICAgICBmb250U2l6ZTogMTQsXG4gICAgICByb290Q29sb3I6IFwiI2RiMjc3N1wiLFxuICAgICAgcm9vdFRleHRDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICBub2RlQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgdGV4dENvbG9yOiBcIiM0YTE2MzBcIixcbiAgICAgIG5vZGVCb3JkZXJDb2xvcjogXCIjZmJjZmU4XCIsXG4gICAgICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gICAgICBlZGdlQ29sb3I6IFwiI2VjNDg5OVwiLFxuICAgICAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICAgICAgZWRnZVdpZHRoOiA0LjIsXG4gICAgICBlZGdlV2lkdGhNb2RlOiBcInRhcGVyZWRcIixcbiAgICAgIGVkZ2VNaW5XaWR0aDogMS4xLFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHJ1ZSxcbiAgICAgIGJyYW5jaENvbG9yczogW1wiI2VjNDg5OVwiLCBcIiM4YjVjZjZcIiwgXCIjMDZiNmQ0XCIsIFwiIzEwYjk4MVwiLCBcIiNmNTllMGJcIiwgXCIjZjQzZjVlXCJdXG4gICAgfVxuICB9LFxuICB7XG4gICAgaWQ6IFwicGFwZXItbm90ZVwiLFxuICAgIG5hbWU6IFwiXHU3RUI4XHU1RjIwXHU3QjE0XHU4QkIwXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU2RTI5XHU2REE2XHUzMDAxXHU0RTY2XHU1MTk5XHU2MTFGXHVGRjBDXHU5MDAyXHU1NDA4XHU4QkZCXHU0RTY2XHU3QjE0XHU4QkIwXHU0RTBFXHU5NTdGXHU2NTg3XHU2OEIzXHU3NDA2XCIsXG4gICAgYXBwZWFyYW5jZToge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmZmZkZjdcIixcbiAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBcImdyaWRcIixcbiAgICAgIHBhdHRlcm5Db2xvcjogXCIjZDZjOGFkXCIsXG4gICAgICBmb250RmFtaWx5OiBcInNlcmlmXCIsXG4gICAgICBmb250U2l6ZTogMTUsXG4gICAgICByb290Q29sb3I6IFwiIzdjMmQxMlwiLFxuICAgICAgcm9vdFRleHRDb2xvcjogXCIjZmZmYWYwXCIsXG4gICAgICBub2RlQ29sb3I6IFwiI2ZmZmFmMFwiLFxuICAgICAgdGV4dENvbG9yOiBcIiMzZjJhMWRcIixcbiAgICAgIG5vZGVCb3JkZXJDb2xvcjogXCIjZDZjOGFkXCIsXG4gICAgICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gICAgICBlZGdlQ29sb3I6IFwiIzlhNmI0MlwiLFxuICAgICAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICAgICAgZWRnZVdpZHRoOiAzLjYsXG4gICAgICBlZGdlV2lkdGhNb2RlOiBcInRhcGVyZWRcIixcbiAgICAgIGVkZ2VNaW5XaWR0aDogMC45LFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHJ1ZSxcbiAgICAgIGJyYW5jaENvbG9yczogW1wiIzlhMzQxMlwiLCBcIiNhMTYyMDdcIiwgXCIjNGQ3YzBmXCIsIFwiIzBmNzY2ZVwiLCBcIiM3ZTIyY2VcIiwgXCIjYmUxMjNjXCJdXG4gICAgfVxuICB9LFxuICB7XG4gICAgaWQ6IFwibWluaW1hbC1pbmtcIixcbiAgICBuYW1lOiBcIlx1Njc4MVx1N0I4MFx1NThBOFx1ODI3MlwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1OUVEMVx1NzY3RFx1NTE0Qlx1NTIzNlx1RkYwQ1x1OTAwMlx1NTQwOFx1NkI2M1x1NUYwRlx1NjU4N1x1Njg2M1x1NEUwRVx1N0VEM1x1Njc4NFx1NTZGRVwiLFxuICAgIGFwcGVhcmFuY2U6IHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICBiYWNrZ3JvdW5kUGF0dGVybjogXCJub25lXCIsXG4gICAgICBwYXR0ZXJuQ29sb3I6IFwiI2QxZDVkYlwiLFxuICAgICAgZm9udEZhbWlseTogXCJzYW5zXCIsXG4gICAgICBmb250U2l6ZTogMTQsXG4gICAgICByb290Q29sb3I6IFwiIzExMTgyN1wiLFxuICAgICAgcm9vdFRleHRDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICBub2RlQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgdGV4dENvbG9yOiBcIiMxMTE4MjdcIixcbiAgICAgIG5vZGVCb3JkZXJDb2xvcjogXCIjOWNhM2FmXCIsXG4gICAgICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gICAgICBlZGdlQ29sb3I6IFwiIzRiNTU2M1wiLFxuICAgICAgZWRnZVN0eWxlOiBcInN0cmFpZ2h0XCIsXG4gICAgICBlZGdlV2lkdGg6IDMuMixcbiAgICAgIGVkZ2VXaWR0aE1vZGU6IFwidGFwZXJlZFwiLFxuICAgICAgZWRnZU1pbldpZHRoOiAwLjgsXG4gICAgICBjb2xvcmZ1bEJyYW5jaGVzOiBmYWxzZSxcbiAgICAgIGJyYW5jaENvbG9yczogW1wiIzExMTgyN1wiLCBcIiMzNzQxNTFcIiwgXCIjNGI1NTYzXCIsIFwiIzZiNzI4MFwiXVxuICAgIH1cbiAgfSxcbiAge1xuICAgIGlkOiBcImRhcmstbmVvblwiLFxuICAgIG5hbWU6IFwiXHU2Njk3XHU1OTFDXHU5NzEzXHU4Njc5XCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU5QUQ4XHU1QkY5XHU2QkQ0XHU2REYxXHU4MjcyXHU0RTNCXHU5ODk4XHVGRjBDXHU5MDAyXHU1NDA4XHU1OTFDXHU5NUY0XHU0RTBFXHU3OUQxXHU2MjgwXHU1MTg1XHU1QkI5XCIsXG4gICAgYXBwZWFyYW5jZToge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiMwODBkMWFcIixcbiAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBcImRvdHNcIixcbiAgICAgIHBhdHRlcm5Db2xvcjogXCIjMzM0MTU1XCIsXG4gICAgICBmb250RmFtaWx5OiBcInNhbnNcIixcbiAgICAgIGZvbnRTaXplOiAxNCxcbiAgICAgIHJvb3RDb2xvcjogXCIjN2MzYWVkXCIsXG4gICAgICByb290VGV4dENvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIG5vZGVDb2xvcjogXCIjMTExODI3XCIsXG4gICAgICB0ZXh0Q29sb3I6IFwiI2U1ZTdlYlwiLFxuICAgICAgbm9kZUJvcmRlckNvbG9yOiBcIiMzMzQxNTVcIixcbiAgICAgIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgICAgIGVkZ2VDb2xvcjogXCIjODE4Y2Y4XCIsXG4gICAgICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gICAgICBlZGdlV2lkdGg6IDQuNixcbiAgICAgIGVkZ2VXaWR0aE1vZGU6IFwidGFwZXJlZFwiLFxuICAgICAgZWRnZU1pbldpZHRoOiAxLjEsXG4gICAgICBjb2xvcmZ1bEJyYW5jaGVzOiB0cnVlLFxuICAgICAgYnJhbmNoQ29sb3JzOiBbXCIjOGI1Y2Y2XCIsIFwiIzIyZDNlZVwiLCBcIiMzNGQzOTlcIiwgXCIjZjQ3MmI2XCIsIFwiI2ZiYmYyNFwiLCBcIiM2MGE1ZmFcIl1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICBpZDogXCJtaW50LWNsZWFuXCIsXG4gICAgbmFtZTogXCJcdTg1ODRcdTgzNzdcdTZFMDVcdTY1QjBcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTZFMDVcdTkwMEZcdTMwMDFcdTdCODBcdTZEMDFcdUZGMENcdTkwMDJcdTU0MDhcdTVERTVcdTRGNUNcdTZFMDVcdTUzNTVcdTRFMEVcdTZENDFcdTdBMEJcdTY4QjNcdTc0MDZcIixcbiAgICBhcHBlYXJhbmNlOiB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2YwZmRmYVwiLFxuICAgICAgYmFja2dyb3VuZFBhdHRlcm46IFwiZ3JpZFwiLFxuICAgICAgcGF0dGVybkNvbG9yOiBcIiM5OWY2ZTRcIixcbiAgICAgIGZvbnRGYW1pbHk6IFwic2Fuc1wiLFxuICAgICAgZm9udFNpemU6IDE0LFxuICAgICAgcm9vdENvbG9yOiBcIiMwNDc4NTdcIixcbiAgICAgIHJvb3RUZXh0Q29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgbm9kZUNvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIHRleHRDb2xvcjogXCIjMTM0ZTRhXCIsXG4gICAgICBub2RlQm9yZGVyQ29sb3I6IFwiI2E3ZjNkMFwiLFxuICAgICAgbm9kZUJvcmRlcldpZHRoOiAxLFxuICAgICAgZWRnZUNvbG9yOiBcIiMxNGI4YTZcIixcbiAgICAgIGVkZ2VTdHlsZTogXCJjdXJ2ZWRcIixcbiAgICAgIGVkZ2VXaWR0aDogNCxcbiAgICAgIGVkZ2VXaWR0aE1vZGU6IFwidGFwZXJlZFwiLFxuICAgICAgZWRnZU1pbldpZHRoOiAxLFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHJ1ZSxcbiAgICAgIGJyYW5jaENvbG9yczogW1wiIzA1OTY2OVwiLCBcIiMwZDk0ODhcIiwgXCIjMDg5MWIyXCIsIFwiIzY1YTMwZFwiLCBcIiMwMjg0YzdcIiwgXCIjMTBiOTgxXCJdXG4gICAgfVxuICB9XG5dIGFzIGNvbnN0O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWluZE1hcFRoZW1lUHJlc2V0KGlkOiBNaW5kTWFwVGhlbWVQcmVzZXRJZCB8IHVuZGVmaW5lZCk6IE1pbmRNYXBUaGVtZVByZXNldCB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBNSU5ETUFQX1RIRU1FX1BSRVNFVFMuZmluZCgocHJlc2V0KSA9PiBwcmVzZXQuaWQgPT09IGlkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGVhcmFuY2VGcm9tVGhlbWVQcmVzZXQoaWQ6IE1pbmRNYXBUaGVtZVByZXNldElkKTogTWluZE1hcEFwcGVhcmFuY2Uge1xuICBjb25zdCBwcmVzZXQgPSBnZXRNaW5kTWFwVGhlbWVQcmVzZXQoaWQpID8/IE1JTkRNQVBfVEhFTUVfUFJFU0VUU1swXTtcbiAgcmV0dXJuIHtcbiAgICAuLi5wcmVzZXQuYXBwZWFyYW5jZSxcbiAgICB0aGVtZVByZXNldDogcHJlc2V0LmlkLFxuICAgIGJyYW5jaENvbG9yczogcHJlc2V0LmFwcGVhcmFuY2UuYnJhbmNoQ29sb3JzID8gWy4uLnByZXNldC5hcHBlYXJhbmNlLmJyYW5jaENvbG9yc10gOiB1bmRlZmluZWRcbiAgfTtcbn1cbiIsICJpbXBvcnQgeyBub2RlQ29udGVudEJsb2Nrcywgbm9kZVBsYWluVGV4dCwgdHlwZSBFZGdlU3R5bGUsIHR5cGUgRm9udEZhbWlseU1vZGUsIHR5cGUgTGF5b3V0TW9kZSwgdHlwZSBNaW5kTWFwQXBwZWFyYW5jZSwgdHlwZSBNaW5kTWFwTm9kZSwgdHlwZSBNaW5kTWFwVGV4dFJ1biwgdHlwZSBOb2RlU2hhcGUgfSBmcm9tIFwiLi9tb2RlbFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE5vZGVQb3NpdGlvbiB7XG4gIG5vZGU6IE1pbmRNYXBOb2RlO1xuICBwYXJlbnRJZDogc3RyaW5nIHwgbnVsbDtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG4gIGRlcHRoOiBudW1iZXI7XG4gIHNpZGU6IC0xIHwgMCB8IDE7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExheW91dFJlc3VsdCB7XG4gIG5vZGVzOiBOb2RlUG9zaXRpb25bXTtcbiAgYnlJZDogTWFwPHN0cmluZywgTm9kZVBvc2l0aW9uPjtcbiAgbWluWDogbnVtYmVyO1xuICBtYXhYOiBudW1iZXI7XG4gIG1pblk6IG51bWJlcjtcbiAgbWF4WTogbnVtYmVyO1xufVxuXG5jb25zdCBST09UX1dJRFRIID0gMTk2O1xuY29uc3QgTk9ERV9XSURUSCA9IDE3NjtcbmNvbnN0IEhfR0FQID0gMTEyO1xuY29uc3QgVl9HQVAgPSAyNDtcblxuZnVuY3Rpb24gdmlzaWJsZUNoaWxkcmVuKG5vZGU6IE1pbmRNYXBOb2RlKTogTWluZE1hcE5vZGVbXSB7XG4gIHJldHVybiBub2RlLmNvbGxhcHNlZCA/IFtdIDogbm9kZS5jaGlsZHJlbjtcbn1cblxuZnVuY3Rpb24gbm9kZURpbWVuc2lvbnMobm9kZTogTWluZE1hcE5vZGUsIGRlcHRoOiBudW1iZXIsIGRlZmF1bHRGb250U2l6ZSA9IDE0KTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9IHtcbiAgY29uc3QgZm9udFNpemUgPSBub2RlLnN0eWxlPy5mb250U2l6ZSA/PyBkZWZhdWx0Rm9udFNpemU7XG4gIGNvbnN0IGV4dHJhV2lkdGggPSBNYXRoLm1heCgwLCBmb250U2l6ZSAtIDE0KSAqIDQ7XG4gIGxldCB3aWR0aCA9IChkZXB0aCA9PT0gMCA/IFJPT1RfV0lEVEggOiBOT0RFX1dJRFRIKSArIGV4dHJhV2lkdGg7XG4gIGxldCBoZWlnaHQgPSAyOCArIE1hdGgubWF4KDAsIGZvbnRTaXplIC0gMTQpICogMS40O1xuICBjb25zdCBibG9ja3MgPSBub2RlQ29udGVudEJsb2Nrcyhub2RlKTtcbiAgaWYgKCFibG9ja3MubGVuZ3RoKSBoZWlnaHQgKz0gZGVwdGggPT09IDAgPyAzNCA6IDI2O1xuICBmb3IgKGNvbnN0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgIGlmIChibG9jay50eXBlID09PSBcImltYWdlXCIpIHsgd2lkdGggPSBNYXRoLm1heCh3aWR0aCwgMjQwKTsgaGVpZ2h0ICs9IDEzMjsgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgbGVuZ3RoID0gTWF0aC5tYXgoMSwgYmxvY2sudGV4dC5sZW5ndGgpO1xuICAgICAgd2lkdGggPSBNYXRoLm1heCh3aWR0aCwgTWF0aC5taW4oNDYwLCA4MCArIE1hdGgubWluKGxlbmd0aCwgNDIpICogZm9udFNpemUgKiAwLjYyKSk7XG4gICAgICBoZWlnaHQgKz0gTWF0aC5tYXgoMzAsIE1hdGguY2VpbChsZW5ndGggLyAzNCkgKiAoZm9udFNpemUgKyA4KSk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLnRhZ3M/Lmxlbmd0aCkgaGVpZ2h0ICs9IDIwO1xuICBpZiAobm9kZS5zdWJtYXApIHsgd2lkdGggPSBNYXRoLm1heCh3aWR0aCwgMjIwKTsgaGVpZ2h0ICs9IDMwOyB9XG4gIGlmIChub2RlLnRhYmxlKSB7XG4gICAgY29uc3QgY29sdW1ucyA9IE1hdGgubWF4KDEsIG5vZGUudGFibGUuaGVhZGVycy5sZW5ndGgpO1xuICAgIGNvbnN0IHZpc2libGVSb3dzID0gTWF0aC5taW4oMTAsIG5vZGUudGFibGUucm93cy5sZW5ndGgpO1xuICAgIHdpZHRoID0gTWF0aC5taW4oNzIwLCBNYXRoLm1heCgzMDAsIGNvbHVtbnMgKiAxMjQpKTtcbiAgICBoZWlnaHQgKz0gNDIgKyB2aXNpYmxlUm93cyAqIDMxICsgKG5vZGUudGFibGUucm93cy5sZW5ndGggPiB2aXNpYmxlUm93cyA/IDI0IDogMCk7XG4gIH1cbiAgaWYgKG5vZGUuY29kZSkge1xuICAgIGNvbnN0IGxpbmVzID0gbm9kZS5jb2RlLmNvZGUuc3BsaXQoL1xccj9cXG4vKTtcbiAgICBjb25zdCBsb25nZXN0ID0gTWF0aC5tYXgoMjAsIC4uLmxpbmVzLnNsaWNlKDAsIDgwKS5tYXAoKGxpbmUpID0+IGxpbmUubGVuZ3RoKSk7XG4gICAgd2lkdGggPSBNYXRoLm1pbig3MjAsIE1hdGgubWF4KDM4MCwgbG9uZ2VzdCAqIDcuMiArIDQyKSk7XG4gICAgaGVpZ2h0ICs9IE1hdGgubWluKDM5MCwgTWF0aC5tYXgoMTAwLCBNYXRoLm1pbihsaW5lcy5sZW5ndGgsIDE4KSAqIDIwICsgNDgpKTtcbiAgfVxuICByZXR1cm4geyB3aWR0aCwgaGVpZ2h0OiBNYXRoLm1pbig1NjAsIGhlaWdodCkgfTtcbn1cblxuZnVuY3Rpb24gc3VidHJlZUhlaWdodChub2RlOiBNaW5kTWFwTm9kZSwgZGVwdGg6IG51bWJlciwgZGVmYXVsdEZvbnRTaXplID0gMTQpOiBudW1iZXIge1xuICBjb25zdCBvd25IZWlnaHQgPSBub2RlRGltZW5zaW9ucyhub2RlLCBkZXB0aCwgZGVmYXVsdEZvbnRTaXplKS5oZWlnaHQ7XG4gIGNvbnN0IGNoaWxkcmVuID0gdmlzaWJsZUNoaWxkcmVuKG5vZGUpO1xuICBpZiAoIWNoaWxkcmVuLmxlbmd0aCkgcmV0dXJuIG93bkhlaWdodDtcbiAgY29uc3QgY2hpbGRyZW5IZWlnaHQgPSBjaGlsZHJlbi5yZWR1Y2UoKHN1bSwgY2hpbGQpID0+IHN1bSArIHN1YnRyZWVIZWlnaHQoY2hpbGQsIGRlcHRoICsgMSwgZGVmYXVsdEZvbnRTaXplKSwgMCkgKyBWX0dBUCAqIChjaGlsZHJlbi5sZW5ndGggLSAxKTtcbiAgcmV0dXJuIE1hdGgubWF4KG93bkhlaWdodCwgY2hpbGRyZW5IZWlnaHQpO1xufVxuXG5mdW5jdGlvbiBsYXlvdXRCcmFuY2goXG4gIG5vZGU6IE1pbmRNYXBOb2RlLFxuICBwYXJlbnRJZDogc3RyaW5nLFxuICBwYXJlbnRYOiBudW1iZXIsXG4gIHBhcmVudFdpZHRoOiBudW1iZXIsXG4gIHNpZGU6IC0xIHwgMSxcbiAgZGVwdGg6IG51bWJlcixcbiAgY2VudGVyWTogbnVtYmVyLFxuICBvdXRwdXQ6IE5vZGVQb3NpdGlvbltdLFxuICBkZWZhdWx0Rm9udFNpemUgPSAxNFxuKTogdm9pZCB7XG4gIGNvbnN0IGRpbWVuc2lvbnMgPSBub2RlRGltZW5zaW9ucyhub2RlLCBkZXB0aCwgZGVmYXVsdEZvbnRTaXplKTtcbiAgY29uc3QgeCA9IHBhcmVudFggKyBzaWRlICogKHBhcmVudFdpZHRoIC8gMiArIEhfR0FQICsgZGltZW5zaW9ucy53aWR0aCAvIDIpO1xuICBvdXRwdXQucHVzaCh7IG5vZGUsIHBhcmVudElkLCB4LCB5OiBjZW50ZXJZLCBkZXB0aCwgc2lkZSwgLi4uZGltZW5zaW9ucyB9KTtcbiAgY29uc3QgY2hpbGRyZW4gPSB2aXNpYmxlQ2hpbGRyZW4obm9kZSk7XG4gIGlmICghY2hpbGRyZW4ubGVuZ3RoKSByZXR1cm47XG5cbiAgY29uc3QgaGVpZ2h0cyA9IGNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IHN1YnRyZWVIZWlnaHQoY2hpbGQsIGRlcHRoICsgMSwgZGVmYXVsdEZvbnRTaXplKSk7XG4gIGNvbnN0IHRvdGFsSGVpZ2h0ID0gaGVpZ2h0cy5yZWR1Y2UoKHN1bSwgY2hpbGRIZWlnaHQpID0+IHN1bSArIGNoaWxkSGVpZ2h0LCAwKSArIFZfR0FQICogKGNoaWxkcmVuLmxlbmd0aCAtIDEpO1xuICBsZXQgY3Vyc29yID0gY2VudGVyWSAtIHRvdGFsSGVpZ2h0IC8gMjtcbiAgY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgY2hpbGRIZWlnaHQgPSBoZWlnaHRzW2luZGV4XSA/PyBub2RlRGltZW5zaW9ucyhjaGlsZCwgZGVwdGggKyAxLCBkZWZhdWx0Rm9udFNpemUpLmhlaWdodDtcbiAgICBjb25zdCBjaGlsZENlbnRlciA9IGN1cnNvciArIGNoaWxkSGVpZ2h0IC8gMjtcbiAgICBsYXlvdXRCcmFuY2goY2hpbGQsIG5vZGUuaWQsIHgsIGRpbWVuc2lvbnMud2lkdGgsIHNpZGUsIGRlcHRoICsgMSwgY2hpbGRDZW50ZXIsIG91dHB1dCwgZGVmYXVsdEZvbnRTaXplKTtcbiAgICBjdXJzb3IgKz0gY2hpbGRIZWlnaHQgKyBWX0dBUDtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlTGF5b3V0KHJvb3Q6IE1pbmRNYXBOb2RlLCBtb2RlOiBMYXlvdXRNb2RlLCBkZWZhdWx0Rm9udFNpemUgPSAxNCk6IExheW91dFJlc3VsdCB7XG4gIGNvbnN0IHJvb3REaW1lbnNpb25zID0gbm9kZURpbWVuc2lvbnMocm9vdCwgMCwgZGVmYXVsdEZvbnRTaXplKTtcbiAgY29uc3Qgbm9kZXM6IE5vZGVQb3NpdGlvbltdID0gW1xuICAgIHsgbm9kZTogcm9vdCwgcGFyZW50SWQ6IG51bGwsIHg6IDAsIHk6IDAsIGRlcHRoOiAwLCBzaWRlOiAwLCAuLi5yb290RGltZW5zaW9ucyB9XG4gIF07XG4gIGNvbnN0IGNoaWxkcmVuID0gdmlzaWJsZUNoaWxkcmVuKHJvb3QpO1xuXG4gIGlmIChtb2RlID09PSBcImJhbGFuY2VkXCIgJiYgY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xuICAgIGNvbnN0IGxlZnQ6IE1pbmRNYXBOb2RlW10gPSBbXTtcbiAgICBjb25zdCByaWdodDogTWluZE1hcE5vZGVbXSA9IFtdO1xuICAgIGxldCBsZWZ0SGVpZ2h0ID0gMDtcbiAgICBsZXQgcmlnaHRIZWlnaHQgPSAwO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgWy4uLmNoaWxkcmVuXS5zb3J0KChhLCBiKSA9PiBzdWJ0cmVlSGVpZ2h0KGIsIDEsIGRlZmF1bHRGb250U2l6ZSkgLSBzdWJ0cmVlSGVpZ2h0KGEsIDEsIGRlZmF1bHRGb250U2l6ZSkpKSB7XG4gICAgICBjb25zdCBoZWlnaHQgPSBzdWJ0cmVlSGVpZ2h0KGNoaWxkLCAxLCBkZWZhdWx0Rm9udFNpemUpICsgVl9HQVA7XG4gICAgICBpZiAobGVmdEhlaWdodCA8PSByaWdodEhlaWdodCkge1xuICAgICAgICBsZWZ0LnB1c2goY2hpbGQpO1xuICAgICAgICBsZWZ0SGVpZ2h0ICs9IGhlaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJpZ2h0LnB1c2goY2hpbGQpO1xuICAgICAgICByaWdodEhlaWdodCArPSBoZWlnaHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2VTaWRlID0gKGl0ZW1zOiBNaW5kTWFwTm9kZVtdLCBzaWRlOiAtMSB8IDEpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IGhlaWdodHMgPSBpdGVtcy5tYXAoKGNoaWxkKSA9PiBzdWJ0cmVlSGVpZ2h0KGNoaWxkLCAxLCBkZWZhdWx0Rm9udFNpemUpKTtcbiAgICAgIGNvbnN0IHRvdGFsID0gaGVpZ2h0cy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSArIFZfR0FQICogTWF0aC5tYXgoMCwgaXRlbXMubGVuZ3RoIC0gMSk7XG4gICAgICBsZXQgY3Vyc29yID0gLXRvdGFsIC8gMjtcbiAgICAgIGl0ZW1zLmZvckVhY2goKGNoaWxkLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBoZWlnaHRzW2luZGV4XSA/PyBub2RlRGltZW5zaW9ucyhjaGlsZCwgMSwgZGVmYXVsdEZvbnRTaXplKS5oZWlnaHQ7XG4gICAgICAgIGxheW91dEJyYW5jaChjaGlsZCwgcm9vdC5pZCwgMCwgcm9vdERpbWVuc2lvbnMud2lkdGgsIHNpZGUsIDEsIGN1cnNvciArIGhlaWdodCAvIDIsIG5vZGVzLCBkZWZhdWx0Rm9udFNpemUpO1xuICAgICAgICBjdXJzb3IgKz0gaGVpZ2h0ICsgVl9HQVA7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHBsYWNlU2lkZShsZWZ0LCAtMSk7XG4gICAgcGxhY2VTaWRlKHJpZ2h0LCAxKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBoZWlnaHRzID0gY2hpbGRyZW4ubWFwKChjaGlsZCkgPT4gc3VidHJlZUhlaWdodChjaGlsZCwgMSwgZGVmYXVsdEZvbnRTaXplKSk7XG4gICAgY29uc3QgdG90YWwgPSBoZWlnaHRzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApICsgVl9HQVAgKiBNYXRoLm1heCgwLCBjaGlsZHJlbi5sZW5ndGggLSAxKTtcbiAgICBsZXQgY3Vyc29yID0gLXRvdGFsIC8gMjtcbiAgICBjaGlsZHJlbi5mb3JFYWNoKChjaGlsZCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGhlaWdodCA9IGhlaWdodHNbaW5kZXhdID8/IG5vZGVEaW1lbnNpb25zKGNoaWxkLCAxLCBkZWZhdWx0Rm9udFNpemUpLmhlaWdodDtcbiAgICAgIGxheW91dEJyYW5jaChjaGlsZCwgcm9vdC5pZCwgMCwgcm9vdERpbWVuc2lvbnMud2lkdGgsIDEsIDEsIGN1cnNvciArIGhlaWdodCAvIDIsIG5vZGVzLCBkZWZhdWx0Rm9udFNpemUpO1xuICAgICAgY3Vyc29yICs9IGhlaWdodCArIFZfR0FQO1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgYnlJZCA9IG5ldyBNYXAobm9kZXMubWFwKChwb3NpdGlvbikgPT4gW3Bvc2l0aW9uLm5vZGUuaWQsIHBvc2l0aW9uXSkpO1xuICBjb25zdCBtaW5YID0gTWF0aC5taW4oLi4ubm9kZXMubWFwKChwb3NpdGlvbikgPT4gcG9zaXRpb24ueCAtIHBvc2l0aW9uLndpZHRoIC8gMikpO1xuICBjb25zdCBtYXhYID0gTWF0aC5tYXgoLi4ubm9kZXMubWFwKChwb3NpdGlvbikgPT4gcG9zaXRpb24ueCArIHBvc2l0aW9uLndpZHRoIC8gMikpO1xuICBjb25zdCBtaW5ZID0gTWF0aC5taW4oLi4ubm9kZXMubWFwKChwb3NpdGlvbikgPT4gcG9zaXRpb24ueSAtIHBvc2l0aW9uLmhlaWdodCAvIDIpKTtcbiAgY29uc3QgbWF4WSA9IE1hdGgubWF4KC4uLm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHBvc2l0aW9uLnkgKyBwb3NpdGlvbi5oZWlnaHQgLyAyKSk7XG4gIHJldHVybiB7IG5vZGVzLCBieUlkLCBtaW5YLCBtYXhYLCBtaW5ZLCBtYXhZIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkQnJhbmNoQ29sb3JNYXAocm9vdDogTWluZE1hcE5vZGUsIGNvbG9yczogc3RyaW5nW10gfCB1bmRlZmluZWQpOiBNYXA8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgcmVzdWx0ID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgaWYgKCFjb2xvcnM/Lmxlbmd0aCkgcmV0dXJuIHJlc3VsdDtcbiAgY29uc3QgdmlzaXQgPSAobm9kZTogTWluZE1hcE5vZGUsIGNvbG9yOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICByZXN1bHQuc2V0KG5vZGUuaWQsIGNvbG9yKTtcbiAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgY29sb3IpKTtcbiAgfTtcbiAgcm9vdC5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCwgaW5kZXgpID0+IHZpc2l0KGNoaWxkLCBjb2xvcnNbaW5kZXggJSBjb2xvcnMubGVuZ3RoXSEpKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVkZ2VXaWR0aEZvckRlcHRoKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlLCBkZXB0aDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgbWF4aW11bSA9IE1hdGgubWF4KDAuNSwgTWF0aC5taW4oOCwgYXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gMi4yKSk7XG4gIGlmIChhcHBlYXJhbmNlLmVkZ2VXaWR0aE1vZGUgIT09IFwidGFwZXJlZFwiKSByZXR1cm4gbWF4aW11bTtcbiAgY29uc3QgbWluaW11bSA9IE1hdGgubWF4KDAuMjUsIE1hdGgubWluKG1heGltdW0sIGFwcGVhcmFuY2UuZWRnZU1pbldpZHRoID8/IE1hdGgubWluKDEsIG1heGltdW0pKSk7XG4gIGNvbnN0IHByb2dyZXNzID0gTWF0aC5taW4oMSwgTWF0aC5tYXgoMCwgZGVwdGggLSAxKSAvIDQpO1xuICByZXR1cm4gTnVtYmVyKChtYXhpbXVtICsgKG1pbmltdW0gLSBtYXhpbXVtKSAqIHByb2dyZXNzKS50b0ZpeGVkKDMpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVkZ2VQYXRoKHBhcmVudDogTm9kZVBvc2l0aW9uLCBjaGlsZDogTm9kZVBvc2l0aW9uLCBzdHlsZTogRWRnZVN0eWxlID0gXCJjdXJ2ZWRcIik6IHN0cmluZyB7XG4gIGNvbnN0IHBhcmVudFggPSBwYXJlbnQueCArIChjaGlsZC5zaWRlID49IDAgPyBwYXJlbnQud2lkdGggLyAyIDogLXBhcmVudC53aWR0aCAvIDIpO1xuICBjb25zdCBjaGlsZFggPSBjaGlsZC54IC0gKGNoaWxkLnNpZGUgPj0gMCA/IGNoaWxkLndpZHRoIC8gMiA6IC1jaGlsZC53aWR0aCAvIDIpO1xuICBpZiAoc3R5bGUgPT09IFwic3RyYWlnaHRcIikgcmV0dXJuIGBNICR7cGFyZW50WH0gJHtwYXJlbnQueX0gTCAke2NoaWxkWH0gJHtjaGlsZC55fWA7XG4gIGNvbnN0IG1pZGRsZVggPSBwYXJlbnRYICsgKGNoaWxkWCAtIHBhcmVudFgpICogMC41O1xuICBpZiAoc3R5bGUgPT09IFwiZWxib3dcIikgcmV0dXJuIGBNICR7cGFyZW50WH0gJHtwYXJlbnQueX0gTCAke21pZGRsZVh9ICR7cGFyZW50Lnl9IEwgJHttaWRkbGVYfSAke2NoaWxkLnl9IEwgJHtjaGlsZFh9ICR7Y2hpbGQueX1gO1xuICByZXR1cm4gYE0gJHtwYXJlbnRYfSAke3BhcmVudC55fSBDICR7bWlkZGxlWH0gJHtwYXJlbnQueX0sICR7bWlkZGxlWH0gJHtjaGlsZC55fSwgJHtjaGlsZFh9ICR7Y2hpbGQueX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlWG1sKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvWzw+JlwiJ10vZywgKGNoYXJhY3RlcikgPT4ge1xuICAgIGNvbnN0IGVudGl0aWVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBcIjxcIjogXCImbHQ7XCIsIFwiPlwiOiBcIiZndDtcIiwgXCImXCI6IFwiJmFtcDtcIiwgJ1wiJzogXCImcXVvdDtcIiwgXCInXCI6IFwiJmFwb3M7XCIgfTtcbiAgICByZXR1cm4gZW50aXRpZXNbY2hhcmFjdGVyXSA/PyBjaGFyYWN0ZXI7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB2YWxpZENvbG9yKHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQsIGZhbGxiYWNrOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUgJiYgL14jWzAtOWEtZl17Nn0kL2kudGVzdCh2YWx1ZSkgPyB2YWx1ZSA6IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBzdmdSYWRpdXMoc2hhcGU6IE5vZGVTaGFwZSB8IHVuZGVmaW5lZCk6IG51bWJlciB7XG4gIGlmIChzaGFwZSA9PT0gXCJyZWN0YW5nbGVcIikgcmV0dXJuIDM7XG4gIGlmIChzaGFwZSA9PT0gXCJwaWxsXCIpIHJldHVybiAyODtcbiAgcmV0dXJuIDE0O1xufVxuXG5mdW5jdGlvbiB0YXNrR2x5cGgobm9kZTogTWluZE1hcE5vZGUpOiBzdHJpbmcge1xuICBpZiAobm9kZS50YXNrID09PSBcImRvbmVcIikgcmV0dXJuIFwiXHUyNzEzIFwiO1xuICBpZiAobm9kZS50YXNrID09PSBcImRvaW5nXCIpIHJldHVybiBcIlx1MjVEMCBcIjtcbiAgaWYgKG5vZGUudGFzayA9PT0gXCJ0b2RvXCIpIHJldHVybiBcIlx1MjVDQiBcIjtcbiAgcmV0dXJuIFwiXCI7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlUnVucyhydW5zOiBNaW5kTWFwVGV4dFJ1bltdLCBtYXhMZW5ndGg6IG51bWJlcik6IE1pbmRNYXBUZXh0UnVuW10ge1xuICBjb25zdCByZXN1bHQ6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgbGV0IHJlbWFpbmluZyA9IG1heExlbmd0aDtcbiAgbGV0IHRydW5jYXRlZCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IHJ1biBvZiBydW5zKSB7XG4gICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7IHRydW5jYXRlZCA9IHRydWU7IGJyZWFrOyB9XG4gICAgaWYgKHJ1bi50ZXh0Lmxlbmd0aCA8PSByZW1haW5pbmcpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHsgdGV4dDogcnVuLnRleHQsIHN0eWxlOiBydW4uc3R5bGUgfSk7XG4gICAgICByZW1haW5pbmcgLT0gcnVuLnRleHQubGVuZ3RoO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHJlc3VsdC5wdXNoKHsgdGV4dDogcnVuLnRleHQuc2xpY2UoMCwgcmVtYWluaW5nKSwgc3R5bGU6IHJ1bi5zdHlsZSB9KTtcbiAgICByZW1haW5pbmcgPSAwO1xuICAgIHRydW5jYXRlZCA9IHRydWU7XG4gIH1cbiAgaWYgKHRydW5jYXRlZCAmJiByZXN1bHQubGVuZ3RoKSByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdIS50ZXh0ID0gYCR7cmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXSEudGV4dC5zbGljZSgwLCAtMSl9XHUyMDI2YDtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmljaFRleHRUc3BhbnMocnVuczogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUZXh0OiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCBmb3JlZ3JvdW5kOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzb3VyY2U6IE1pbmRNYXBUZXh0UnVuW10gPSBbXG4gICAgLi4uKHByZWZpeCA/IFt7IHRleHQ6IHByZWZpeCB9XSA6IFtdKSxcbiAgICAuLi4ocnVucz8ubGVuZ3RoID8gcnVucyA6IFt7IHRleHQ6IGZhbGxiYWNrVGV4dCB9XSlcbiAgXTtcbiAgcmV0dXJuIHRydW5jYXRlUnVucyhzb3VyY2UsIDQyKS5tYXAoKHJ1bikgPT4ge1xuICAgIGNvbnN0IHN0eWxlID0gcnVuLnN0eWxlO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHN0eWxlPy5jb2xvcikgYXR0cmlidXRlcy5wdXNoKGBmaWxsPVwiJHt2YWxpZENvbG9yKHN0eWxlLmNvbG9yLCBmb3JlZ3JvdW5kKX1cImApO1xuICAgIGlmIChzdHlsZT8uYm9sZCAhPT0gdW5kZWZpbmVkKSBhdHRyaWJ1dGVzLnB1c2goYGZvbnQtd2VpZ2h0PVwiJHtzdHlsZS5ib2xkID8gNzAwIDogNDAwfVwiYCk7XG4gICAgaWYgKHN0eWxlPy5pdGFsaWMgIT09IHVuZGVmaW5lZCkgYXR0cmlidXRlcy5wdXNoKGBmb250LXN0eWxlPVwiJHtzdHlsZS5pdGFsaWMgPyBcIml0YWxpY1wiIDogXCJub3JtYWxcIn1cImApO1xuICAgIGNvbnN0IGRlY29yYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChzdHlsZT8udW5kZXJsaW5lKSBkZWNvcmF0aW9ucy5wdXNoKFwidW5kZXJsaW5lXCIpO1xuICAgIGlmIChzdHlsZT8uc3RyaWtlKSBkZWNvcmF0aW9ucy5wdXNoKFwibGluZS10aHJvdWdoXCIpO1xuICAgIGlmIChkZWNvcmF0aW9ucy5sZW5ndGgpIGF0dHJpYnV0ZXMucHVzaChgdGV4dC1kZWNvcmF0aW9uPVwiJHtkZWNvcmF0aW9ucy5qb2luKFwiIFwiKX1cImApO1xuICAgIHJldHVybiBgPHRzcGFuICR7YXR0cmlidXRlcy5qb2luKFwiIFwiKX0+JHtlc2NhcGVYbWwocnVuLnRleHQpfTwvdHNwYW4+YDtcbiAgfSkuam9pbihcIlwiKTtcbn1cblxuZnVuY3Rpb24gc3ZnRm9udEZhbWlseShtb2RlOiBGb250RmFtaWx5TW9kZSB8IHVuZGVmaW5lZCwgY3VzdG9tRm9udDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKG1vZGUgPT09IFwic2VyaWZcIikgcmV0dXJuICdHZW9yZ2lhLFwiVGltZXMgTmV3IFJvbWFuXCIsc2VyaWYnO1xuICBpZiAobW9kZSA9PT0gXCJtb25vXCIpIHJldHVybiAnXCJTRk1vbm8tUmVndWxhclwiLENvbnNvbGFzLFwiTGliZXJhdGlvbiBNb25vXCIsbW9ub3NwYWNlJztcbiAgaWYgKG1vZGUgPT09IFwiY3VzdG9tXCIgJiYgY3VzdG9tRm9udD8udHJpbSgpKSByZXR1cm4gYFwiJHtjdXN0b21Gb250LnRyaW0oKS5yZXBsYWNlQWxsKCdcIicsICcnKX1cIixzYW5zLXNlcmlmYDtcbiAgcmV0dXJuICdJbnRlciwtYXBwbGUtc3lzdGVtLEJsaW5rTWFjU3lzdGVtRm9udCxcIlNlZ29lIFVJXCIsc2Fucy1zZXJpZic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkb2N1bWVudFRvU3ZnKHJvb3Q6IE1pbmRNYXBOb2RlLCBtb2RlOiBMYXlvdXRNb2RlLCB0aXRsZTogc3RyaW5nLCBhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSA9IHt9KTogc3RyaW5nIHtcbiAgY29uc3QgZGVmYXVsdEZvbnRTaXplID0gYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNDtcbiAgY29uc3QgbGF5b3V0ID0gY29tcHV0ZUxheW91dChyb290LCBtb2RlLCBkZWZhdWx0Rm9udFNpemUpO1xuICBjb25zdCBwYWRkaW5nID0gNzI7XG4gIGNvbnN0IHdpZHRoID0gTWF0aC5tYXgoMzIwLCBsYXlvdXQubWF4WCAtIGxheW91dC5taW5YICsgcGFkZGluZyAqIDIpO1xuICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heCgyMjAsIGxheW91dC5tYXhZIC0gbGF5b3V0Lm1pblkgKyBwYWRkaW5nICogMik7XG4gIGNvbnN0IG9mZnNldFggPSBwYWRkaW5nIC0gbGF5b3V0Lm1pblg7XG4gIGNvbnN0IG9mZnNldFkgPSBwYWRkaW5nIC0gbGF5b3V0Lm1pblk7XG4gIGNvbnN0IGVkZ2VTdHlsZSA9IGFwcGVhcmFuY2UuZWRnZVN0eWxlID8/IFwiY3VydmVkXCI7XG4gIGNvbnN0IGRlZmF1bHRFZGdlID0gdmFsaWRDb2xvcihhcHBlYXJhbmNlLmVkZ2VDb2xvciwgXCIjN2M4YWE1XCIpO1xuICBjb25zdCBicmFuY2hDb2xvck1hcCA9IGFwcGVhcmFuY2UuY29sb3JmdWxCcmFuY2hlcyA/IGJ1aWxkQnJhbmNoQ29sb3JNYXAocm9vdCwgYXBwZWFyYW5jZS5icmFuY2hDb2xvcnMpIDogbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgY29uc3QgZWRnZXMgPSBsYXlvdXQubm9kZXNcbiAgICAuZmlsdGVyKChwb3NpdGlvbikgPT4gcG9zaXRpb24ucGFyZW50SWQpXG4gICAgLm1hcCgocG9zaXRpb24pID0+IHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHBvc2l0aW9uLnBhcmVudElkID8gbGF5b3V0LmJ5SWQuZ2V0KHBvc2l0aW9uLnBhcmVudElkKSA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IHZhbGlkQ29sb3IocG9zaXRpb24ubm9kZS5zdHlsZT8uY29sb3IsIGJyYW5jaENvbG9yTWFwLmdldChwb3NpdGlvbi5ub2RlLmlkKSA/PyBkZWZhdWx0RWRnZSk7XG4gICAgICBjb25zdCB3aWR0aCA9IGVkZ2VXaWR0aEZvckRlcHRoKGFwcGVhcmFuY2UsIHBvc2l0aW9uLmRlcHRoKTtcbiAgICAgIHJldHVybiBwYXJlbnQgPyBgPHBhdGggZD1cIiR7ZWRnZVBhdGgocGFyZW50LCBwb3NpdGlvbiwgZWRnZVN0eWxlKX1cIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cIiR7c3Ryb2tlfVwiIHN0cm9rZS13aWR0aD1cIiR7d2lkdGh9XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgb3BhY2l0eT1cIjAuOFwiLz5gIDogXCJcIjtcbiAgICB9KVxuICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gIGNvbnN0IG5vZGVzID0gbGF5b3V0Lm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHtcbiAgICBjb25zdCBub2RlID0gcG9zaXRpb24ubm9kZTtcbiAgICBjb25zdCB4ID0gcG9zaXRpb24ueCAtIHBvc2l0aW9uLndpZHRoIC8gMjtcbiAgICBjb25zdCB5ID0gcG9zaXRpb24ueSAtIHBvc2l0aW9uLmhlaWdodCAvIDI7XG4gICAgY29uc3QgaXNSb290ID0gcG9zaXRpb24uZGVwdGggPT09IDA7XG4gICAgY29uc3QgZGVmYXVsdEJhY2tncm91bmQgPSBpc1Jvb3QgPyB2YWxpZENvbG9yKGFwcGVhcmFuY2Uucm9vdENvbG9yLCBcIiM0ZjQ2ZTVcIikgOiB2YWxpZENvbG9yKGFwcGVhcmFuY2Uubm9kZUNvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgY29uc3QgZGVmYXVsdFRleHQgPSBpc1Jvb3QgPyB2YWxpZENvbG9yKGFwcGVhcmFuY2Uucm9vdFRleHRDb2xvciwgXCIjZmZmZmZmXCIpIDogdmFsaWRDb2xvcihhcHBlYXJhbmNlLnRleHRDb2xvciwgXCIjMGYxNzJhXCIpO1xuICAgIGNvbnN0IGJhY2tncm91bmQgPSB2YWxpZENvbG9yKG5vZGUuc3R5bGU/LmNvbG9yLCBkZWZhdWx0QmFja2dyb3VuZCk7XG4gICAgY29uc3QgZm9yZWdyb3VuZCA9IHZhbGlkQ29sb3Iobm9kZS5zdHlsZT8udGV4dENvbG9yLCBkZWZhdWx0VGV4dCk7XG4gICAgY29uc3QgYnJhbmNoQ29sb3IgPSBicmFuY2hDb2xvck1hcC5nZXQobm9kZS5pZCk7XG4gICAgY29uc3QgYm9yZGVyID0gdmFsaWRDb2xvcihub2RlLnN0eWxlPy5ib3JkZXJDb2xvciwgaXNSb290ID8gYmFja2dyb3VuZCA6IGJyYW5jaENvbG9yID8/IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5ub2RlQm9yZGVyQ29sb3IsIFwiIzk0YTNiOFwiKSk7XG4gICAgY29uc3QgYm9yZGVyV2lkdGggPSBub2RlLnN0eWxlPy5ib3JkZXJXaWR0aCA/PyBhcHBlYXJhbmNlLm5vZGVCb3JkZXJXaWR0aCA/PyAoaXNSb290ID8gMiA6IDEpO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke25vZGUuaWNvbiA/IGAke25vZGUuaWNvbn0gYCA6IFwiXCJ9JHt0YXNrR2x5cGgobm9kZSl9YDtcbiAgICBjb25zdCBjb250ZW50QmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gICAgbGV0IGNvbnRlbnRZID0geSArIDI4O1xuICAgIGNvbnN0IGNvbnRlbnRQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgcHJlZml4VXNlZCA9IGZhbHNlO1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgY29udGVudEJsb2Nrcykge1xuICAgICAgaWYgKGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikge1xuICAgICAgICBjb250ZW50UGFydHMucHVzaChgPHJlY3QgeD1cIiR7cG9zaXRpb24ueCAtIDcwfVwiIHk9XCIke2NvbnRlbnRZIC0gMTR9XCIgd2lkdGg9XCIxNDBcIiBoZWlnaHQ9XCI5NFwiIHJ4PVwiOFwiIGZpbGw9XCJyZ2JhKDEyNywxMjcsMTI3LC4xMilcIi8+PHRleHQgeD1cIiR7cG9zaXRpb24ueH1cIiB5PVwiJHtjb250ZW50WSArIDM4fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCIxMlwiPlx1RDgzRFx1RERCQyAke2VzY2FwZVhtbCgoYmxvY2suYWx0ID8/IFwiXHU1NkZFXHU3MjQ3XCIpLnNsaWNlKDAsIDIwKSl9PC90ZXh0PmApO1xuICAgICAgICBjb250ZW50WSArPSAxMTI7XG4gICAgICB9IGVsc2UgaWYgKGJsb2NrLnRleHQudHJpbSgpKSB7XG4gICAgICAgIGNvbnN0IGJsb2NrUHJlZml4ID0gcHJlZml4VXNlZCA/IFwiXCIgOiBwcmVmaXg7XG4gICAgICAgIHByZWZpeFVzZWQgPSB0cnVlO1xuICAgICAgICBjb250ZW50UGFydHMucHVzaChgPHRleHQgeD1cIiR7cG9zaXRpb24ueH1cIiB5PVwiJHtjb250ZW50WX1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiJHtub2RlLnN0eWxlPy5mb250U2l6ZSA/PyBkZWZhdWx0Rm9udFNpemV9XCI+JHtyaWNoVGV4dFRzcGFucyhibG9jay5yaWNoVGV4dCwgYmxvY2sudGV4dCwgYmxvY2tQcmVmaXgsIGZvcmVncm91bmQpfTwvdGV4dD5gKTtcbiAgICAgICAgY29udGVudFkgKz0gKG5vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZSkgKyAxNTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFjb250ZW50QmxvY2tzLmxlbmd0aCkgY29udGVudFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3Bvc2l0aW9uLnh9XCIgeT1cIiR7Y29udGVudFl9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIiR7bm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplfVwiPiR7ZXNjYXBlWG1sKHByZWZpeCB8fCBub2RlUGxhaW5UZXh0KG5vZGUpIHx8IFwiXHU1NkZFXHU3MjQ3XHU4MjgyXHU3MEI5XCIpfTwvdGV4dD5gKTtcbiAgICBsZXQgcmljaFkgPSBjb250ZW50WSArIDEwO1xuICAgIGNvbnN0IHJpY2hQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAobm9kZS5zdWJtYXApIHtcbiAgICAgIHJpY2hQYXJ0cy5wdXNoKGA8cmVjdCB4PVwiJHt4ICsgMTJ9XCIgeT1cIiR7cmljaFl9XCIgd2lkdGg9XCIke3Bvc2l0aW9uLndpZHRoIC0gMjR9XCIgaGVpZ2h0PVwiMjVcIiByeD1cIjZcIiBmaWxsPVwicmdiYSg5OSwxMDIsMjQxLC4xMClcIiBzdHJva2U9XCIke2ZvcmVncm91bmR9XCIgc3Ryb2tlLW9wYWNpdHk9XCIuMjhcIiBzdHJva2UtZGFzaGFycmF5PVwiNCAzXCIvPjx0ZXh0IHg9XCIke3Bvc2l0aW9uLnh9XCIgeT1cIiR7cmljaFkgKyAxN31cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiMTBcIj5cdTIxQjMgJHtlc2NhcGVYbWwoKG5vZGUuc3VibWFwLnRpdGxlID8/IG5vZGUuc3VibWFwLnBhdGgpLnNsaWNlKDAsIDU0KSl9PC90ZXh0PmApO1xuICAgICAgcmljaFkgKz0gMzQ7XG4gICAgfVxuICAgIGlmIChub2RlLnRhYmxlKSB7XG4gICAgICBjb25zdCByb3dzID0gW25vZGUudGFibGUuaGVhZGVycywgLi4ubm9kZS50YWJsZS5yb3dzLnNsaWNlKDAsIDgpXTtcbiAgICAgIHJvd3MuZm9yRWFjaCgocm93LCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCByb3dUZXh0ID0gZXNjYXBlWG1sKHJvdy5tYXAoKGNlbGwpID0+IGNlbGwucmVwbGFjZUFsbChcIlxcblwiLCBcIiBcIikpLmpvaW4oXCIgIHwgIFwiKS5zbGljZSgwLCAxMDApKTtcbiAgICAgICAgcmljaFBhcnRzLnB1c2goYDx0ZXh0IHg9XCIke3ggKyAxNn1cIiB5PVwiJHtyaWNoWSArIGluZGV4ICogMjN9XCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCIke2luZGV4ID09PSAwID8gMTAuNSA6IDkuNX1cIiBmb250LXdlaWdodD1cIiR7aW5kZXggPT09IDAgPyA3MDAgOiA0MDB9XCI+JHtyb3dUZXh0fTwvdGV4dD5gKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKG5vZGUudGFibGUucm93cy5sZW5ndGggPiA4KSByaWNoUGFydHMucHVzaChgPHRleHQgeD1cIiR7eCArIDE2fVwiIHk9XCIke3JpY2hZICsgcm93cy5sZW5ndGggKiAyM31cIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIG9wYWNpdHk9XCIuNjVcIiBmb250LXNpemU9XCI5XCI+XHUyMDI2IFx1OEZEOFx1NjcwOSAke25vZGUudGFibGUucm93cy5sZW5ndGggLSA4fSBcdTg4NEM8L3RleHQ+YCk7XG4gICAgfVxuICAgIGlmIChub2RlLmNvZGUpIHtcbiAgICAgIHJpY2hQYXJ0cy5wdXNoKGA8cmVjdCB4PVwiJHt4ICsgMTJ9XCIgeT1cIiR7cmljaFkgLSAxNH1cIiB3aWR0aD1cIiR7cG9zaXRpb24ud2lkdGggLSAyNH1cIiBoZWlnaHQ9XCIke01hdGgubWluKDM1MCwgTWF0aC5tYXgoODAsIG5vZGUuY29kZS5jb2RlLnNwbGl0KC9cXHI/XFxuLykubGVuZ3RoICogMTcgKyAzNCkpfVwiIHJ4PVwiN1wiIGZpbGw9XCJyZ2JhKDE1LDIzLDQyLC4xMClcIi8+YCk7XG4gICAgICByaWNoUGFydHMucHVzaChgPHRleHQgeD1cIiR7eCArIDIwfVwiIHk9XCIke3JpY2hZICsgM31cIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIG9wYWNpdHk9XCIuN1wiIGZvbnQtc2l6ZT1cIjlcIj4ke2VzY2FwZVhtbChub2RlLmNvZGUubGFuZ3VhZ2UgfHwgXCJjb2RlXCIpfTwvdGV4dD5gKTtcbiAgICAgIG5vZGUuY29kZS5jb2RlLnNwbGl0KC9cXHI/XFxuLykuc2xpY2UoMCwgMTYpLmZvckVhY2goKGxpbmUsIGluZGV4KSA9PiByaWNoUGFydHMucHVzaChgPHRleHQgeD1cIiR7eCArIDIwfVwiIHk9XCIke3JpY2hZICsgMjMgKyBpbmRleCAqIDE3fVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiOVwiIGZvbnQtZmFtaWx5PVwibW9ub3NwYWNlXCI+JHtlc2NhcGVYbWwobGluZS5zbGljZSgwLCA5MikpfTwvdGV4dD5gKSk7XG4gICAgfVxuICAgIGNvbnN0IHJpY2hDb250ZW50ID0gcmljaFBhcnRzLmpvaW4oXCJcIik7XG4gICAgY29uc3QgdGFncyA9IG5vZGUudGFncz8ubGVuZ3RoXG4gICAgICA/IGA8dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke3Bvc2l0aW9uLnkgKyBwb3NpdGlvbi5oZWlnaHQgLyAyIC0gOX1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgb3BhY2l0eT1cIi43MlwiIGZvbnQtc2l6ZT1cIjEwXCI+JHtlc2NhcGVYbWwobm9kZS50YWdzLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApLmpvaW4oXCIgIFwiKS5zbGljZSgwLCA0OCkpfTwvdGV4dD5gXG4gICAgICA6IFwiXCI7XG4gICAgY29uc3QgYm9sZCA9IG5vZGUuc3R5bGU/LmJvbGQgPz8gYXBwZWFyYW5jZS5ib2xkID8/IGZhbHNlO1xuICAgIGNvbnN0IGl0YWxpYyA9IG5vZGUuc3R5bGU/Lml0YWxpYyA/PyBhcHBlYXJhbmNlLml0YWxpYyA/PyBmYWxzZTtcbiAgICBjb25zdCB1bmRlcmxpbmUgPSBub2RlLnN0eWxlPy51bmRlcmxpbmUgPz8gYXBwZWFyYW5jZS51bmRlcmxpbmUgPz8gZmFsc2U7XG4gICAgY29uc3QgZm9udFNpemUgPSBub2RlLnN0eWxlPy5mb250U2l6ZSA/PyBkZWZhdWx0Rm9udFNpemU7XG4gICAgcmV0dXJuIGA8Zz48cmVjdCB4PVwiJHt4fVwiIHk9XCIke3l9XCIgd2lkdGg9XCIke3Bvc2l0aW9uLndpZHRofVwiIGhlaWdodD1cIiR7cG9zaXRpb24uaGVpZ2h0fVwiIHJ4PVwiJHtzdmdSYWRpdXMobm9kZS5zdHlsZT8uc2hhcGUpfVwiIGZpbGw9XCIke2JhY2tncm91bmR9XCIgc3Ryb2tlPVwiJHtib3JkZXJ9XCIgc3Ryb2tlLXdpZHRoPVwiJHtib3JkZXJXaWR0aH1cIi8+PGcgZm9udC13ZWlnaHQ9XCIke2lzUm9vdCB8fCBib2xkID8gNzAwIDogNDAwfVwiIGZvbnQtc3R5bGU9XCIke2l0YWxpYyA/IFwiaXRhbGljXCIgOiBcIm5vcm1hbFwifVwiIHRleHQtZGVjb3JhdGlvbj1cIiR7dW5kZXJsaW5lID8gXCJ1bmRlcmxpbmVcIiA6IFwibm9uZVwifVwiPiR7Y29udGVudFBhcnRzLmpvaW4oXCJcIil9PC9nPiR7cmljaENvbnRlbnR9JHt0YWdzfTwvZz5gO1xuICB9KS5qb2luKFwiXFxuXCIpO1xuXG4gIGNvbnN0IGJhY2tncm91bmQgPSB2YWxpZENvbG9yKGFwcGVhcmFuY2UuYmFja2dyb3VuZENvbG9yLCBcIiNmOGZhZmNcIik7XG4gIGNvbnN0IHBhdHRlcm5Db2xvciA9IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5wYXR0ZXJuQ29sb3IsIFwiIzk0YTNiOFwiKTtcbiAgY29uc3QgcGF0dGVybiA9IGFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gPz8gXCJub25lXCI7XG4gIGNvbnN0IGRlZnMgPSBwYXR0ZXJuID09PSBcImdyaWRcIlxuICAgID8gYDxkZWZzPjxwYXR0ZXJuIGlkPVwibW1jLXBhdHRlcm5cIiB3aWR0aD1cIjI0XCIgaGVpZ2h0PVwiMjRcIiBwYXR0ZXJuVW5pdHM9XCJ1c2VyU3BhY2VPblVzZVwiPjxwYXRoIGQ9XCJNIDI0IDAgTCAwIDAgMCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiJHtwYXR0ZXJuQ29sb3J9XCIgc3Ryb2tlLXdpZHRoPVwiMVwiIG9wYWNpdHk9XCIuMThcIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCIgZmlsbD1cInVybCgjbW1jLXBhdHRlcm4pXCIvPmBcbiAgICA6IHBhdHRlcm4gPT09IFwiZG90c1wiXG4gICAgICA/IGA8ZGVmcz48cGF0dGVybiBpZD1cIm1tYy1wYXR0ZXJuXCIgd2lkdGg9XCIyNFwiIGhlaWdodD1cIjI0XCIgcGF0dGVyblVuaXRzPVwidXNlclNwYWNlT25Vc2VcIj48Y2lyY2xlIGN4PVwiMlwiIGN5PVwiMlwiIHI9XCIxLjVcIiBmaWxsPVwiJHtwYXR0ZXJuQ29sb3J9XCIgb3BhY2l0eT1cIi4yOFwiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjEwMCVcIiBmaWxsPVwidXJsKCNtbWMtcGF0dGVybilcIi8+YFxuICAgICAgOiBcIlwiO1xuXG4gIHJldHVybiBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+XG48c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIiR7TWF0aC5jZWlsKHdpZHRoKX1cIiBoZWlnaHQ9XCIke01hdGguY2VpbChoZWlnaHQpfVwiIHZpZXdCb3g9XCIwIDAgJHtNYXRoLmNlaWwod2lkdGgpfSAke01hdGguY2VpbChoZWlnaHQpfVwiPlxuPHRpdGxlPiR7ZXNjYXBlWG1sKHRpdGxlKX08L3RpdGxlPlxuPHN0eWxlPnN2Z3tiYWNrZ3JvdW5kOiR7YmFja2dyb3VuZH07Zm9udC1mYW1pbHk6JHtzdmdGb250RmFtaWx5KGFwcGVhcmFuY2UuZm9udEZhbWlseSwgYXBwZWFyYW5jZS5jdXN0b21Gb250KX19PC9zdHlsZT5cbiR7ZGVmc308ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoJHtvZmZzZXRYfSAke29mZnNldFl9KVwiPiR7ZWRnZXN9JHtub2Rlc308L2c+XG48L3N2Zz5gO1xufVxuIiwgImltcG9ydCB0eXBlIHsgQXBwLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgZG9jdW1lbnRUb1N2ZyB9IGZyb20gXCIuL2xheW91dFwiO1xuaW1wb3J0IHsgbWVyZ2VBcHBlYXJhbmNlLCBwYXJzZURvY3VtZW50LCB0eXBlIE1pbmRNYXBBcHBlYXJhbmNlLCB0eXBlIE1pbmRNYXBEb2N1bWVudCB9IGZyb20gXCIuL21vZGVsXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdGF0aWNNaW5kTWFwKFxuICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICBkb2N1bWVudDogTWluZE1hcERvY3VtZW50LFxuICBvcHRpb25zPzogeyBhcHA/OiBBcHA7IGZpbGU/OiBURmlsZTsgbWF4SGVpZ2h0PzogbnVtYmVyOyBkZWZhdWx0QXBwZWFyYW5jZT86IE1pbmRNYXBBcHBlYXJhbmNlIH1cbik6IHZvaWQge1xuICBjb250YWluZXIuZW1wdHkoKTtcbiAgY29udGFpbmVyLmFkZENsYXNzKFwibW1jLXN0YXRpYy1wcmV2aWV3XCIpO1xuICBjb25zdCBzdmcgPSBkb2N1bWVudFRvU3ZnKGRvY3VtZW50LnJvb3QsIGRvY3VtZW50LmxheW91dCwgZG9jdW1lbnQudGl0bGUsIG1lcmdlQXBwZWFyYW5jZShvcHRpb25zPy5kZWZhdWx0QXBwZWFyYW5jZSwgZG9jdW1lbnQuYXBwZWFyYW5jZSkpO1xuICBjb25zdCBpbWFnZSA9IGNvbnRhaW5lci5jcmVhdGVFbChcImltZ1wiLCB7XG4gICAgYXR0cjoge1xuICAgICAgYWx0OiBgJHtkb2N1bWVudC50aXRsZX0gXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU5ODg0XHU4OUM4YCxcbiAgICAgIHNyYzogYGRhdGE6aW1hZ2Uvc3ZnK3htbDtjaGFyc2V0PXV0Zi04LCR7ZW5jb2RlVVJJQ29tcG9uZW50KHN2Zyl9YFxuICAgIH1cbiAgfSk7XG4gIGlmIChvcHRpb25zPy5tYXhIZWlnaHQpIGltYWdlLnN0eWxlLm1heEhlaWdodCA9IGAke29wdGlvbnMubWF4SGVpZ2h0fXB4YDtcbiAgaWYgKG9wdGlvbnM/LmFwcCAmJiBvcHRpb25zLmZpbGUpIHtcbiAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCBvcHRpb25zLmFwcD8ud29ya3NwYWNlLmdldExlYWYoZmFsc2UpLm9wZW5GaWxlKG9wdGlvbnMuZmlsZSBhcyBURmlsZSk7XG4gICAgfSk7XG4gICAgaW1hZ2Uuc2V0QXR0cihcInRpdGxlXCIsIFwiXHU1M0NDXHU1MUZCXHU2MjUzXHU1RjAwXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdGF0aWNTb3VyY2UoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgc291cmNlOiBzdHJpbmcsIGZhbGxiYWNrVGl0bGU6IHN0cmluZywgZGVmYXVsdEFwcGVhcmFuY2U/OiBNaW5kTWFwQXBwZWFyYW5jZSk6IHZvaWQge1xuICByZW5kZXJTdGF0aWNNaW5kTWFwKGNvbnRhaW5lciwgcGFyc2VEb2N1bWVudChzb3VyY2UsIGZhbGxiYWNrVGl0bGUpLCB7IGRlZmF1bHRBcHBlYXJhbmNlIH0pO1xufVxuIiwgImltcG9ydCB7IE1hcmtkb3duUmVuZGVyZXIsIE5vdGljZSwgVGV4dEZpbGVWaWV3LCBURmlsZSwgbm9ybWFsaXplUGF0aCwgdHlwZSBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBNaW5kTWFwU3R1ZGlvUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IE1pbmRNYXBFZGl0b3IgfSBmcm9tIFwiLi9lZGl0b3JcIjtcbmltcG9ydCB7IHBhcnNlRG9jdW1lbnQsIHNlcmlhbGl6ZURvY3VtZW50LCB0eXBlIE1pbmRNYXBEb2N1bWVudCB9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQgeyBzZXR0aW5nc1RvQXBwZWFyYW5jZSB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8gPSBcIm1pbmRtYXAtc3R1ZGlvLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIE1pbmRNYXBTdHVkaW9WaWV3IGV4dGVuZHMgVGV4dEZpbGVWaWV3IHtcbiAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW47XG4gIHByaXZhdGUgZWRpdG9yOiBNaW5kTWFwRWRpdG9yIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHNhdmVkVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogTWluZE1hcFN0dWRpb1BsdWdpbikge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gVklFV19UWVBFX01JTkRNQVBfU1RVRElPO1xuICB9XG5cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5maWxlPy5iYXNlbmFtZSA/PyBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICB9XG5cbiAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImJyYWluLWNpcmN1aXRcIjtcbiAgfVxuXG4gIGdldFZpZXdEYXRhKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLmVkaXRvcj8uZ2V0RG9jdW1lbnQoKSA/PyB0aGlzLmRvY3VtZW50O1xuICAgIHJldHVybiBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCA/PyB0aGlzLnBsdWdpbi5jcmVhdGVDb25maWd1cmVkRG9jdW1lbnQoXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIikpO1xuICB9XG5cbiAgc2V0Vmlld0RhdGEoZGF0YTogc3RyaW5nLCBjbGVhcjogYm9vbGVhbik6IHZvaWQge1xuICAgIGNvbnN0IHRpdGxlID0gdGhpcy5maWxlPy5iYXNlbmFtZSA/PyBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBwYXJzZURvY3VtZW50KGRhdGEsIHRpdGxlKTtcbiAgICB0aGlzLmFwcGx5Vmlld0NsYXNzZXMoKTtcblxuICAgIGlmICghdGhpcy5lZGl0b3IgfHwgY2xlYXIpIHtcbiAgICAgIHRoaXMuZWRpdG9yPy5kZXN0cm95KCk7XG4gICAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgICAgdGhpcy5lZGl0b3IgPSBuZXcgTWluZE1hcEVkaXRvcih0aGlzLmFwcCwgdGhpcy5jb250ZW50RWwsIHRoaXMuZG9jdW1lbnQsIHtcbiAgICAgICAgb25DaGFuZ2U6IChkb2N1bWVudCkgPT4ge1xuICAgICAgICAgIHRoaXMuZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICAgICAgICB0aGlzLnJlcXVlc3RTYXZlKCk7XG4gICAgICAgICAgdGhpcy5zY2hlZHVsZVNhdmVkSW5kaWNhdG9yKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uT3Blbkxpbms6IGFzeW5jIChsaW5rKSA9PiB0aGlzLm9wZW5MaW5rKGxpbmspLFxuICAgICAgICBvbkV4cG9ydFN2ZzogYXN5bmMgKHN2ZykgPT4gdGhpcy5leHBvcnRUZXh0RmlsZShcInN2Z1wiLCBzdmcpLFxuICAgICAgICBvbkV4cG9ydE1hcmtkb3duOiBhc3luYyAobWFya2Rvd24pID0+IHRoaXMuZXhwb3J0VGV4dEZpbGUoXCJtZFwiLCBtYXJrZG93biksXG4gICAgICAgIG9uRXhwb3J0SnNvbjogYXN5bmMgKGpzb24pID0+IHRoaXMuZXhwb3J0VGV4dEZpbGUoXCJqc29uXCIsIGpzb24pLFxuICAgICAgICByZXNvbHZlSW1hZ2U6IChzb3VyY2UpID0+IHRoaXMucmVzb2x2ZUltYWdlKHNvdXJjZSksXG4gICAgICAgIG9uU2F2ZVBhc3RlZEltYWdlOiBhc3luYyAoYmxvYiwgc3VnZ2VzdGVkTmFtZSkgPT4gdGhpcy5wbHVnaW4uc2F2ZVBhc3RlZEltYWdlKGJsb2IsIHN1Z2dlc3RlZE5hbWUsIHRoaXMuZmlsZSksXG4gICAgICAgIGdldEltYWdlSG9zdHM6ICgpID0+IHRoaXMucGx1Z2luLmdldEltYWdlSG9zdENob2ljZXMoKSxcbiAgICAgICAgZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHM6ICgpID0+IHRoaXMucGx1Z2luLmdldERlZmF1bHRVcGxvYWRIb3N0SWRzKCksXG4gICAgICAgIG9uVXBsb2FkSW1hZ2U6IGFzeW5jIChibG9iLCBzdWdnZXN0ZWROYW1lLCBob3N0SWRzKSA9PiB0aGlzLnBsdWdpbi51cGxvYWRJbWFnZVRvSG9zdHMoYmxvYiwgc3VnZ2VzdGVkTmFtZSwgaG9zdElkcyksXG4gICAgICAgIG9uUmVhZEltYWdlU291cmNlOiBhc3luYyAoc291cmNlKSA9PiB0aGlzLnBsdWdpbi5yZWFkSW1hZ2VTb3VyY2Uoc291cmNlLCB0aGlzLmZpbGUpLFxuICAgICAgICBvblNjaGVkdWxlQXV0b1VwbG9hZDogKG5vZGVJZCwgYmxvY2tJZCwgbG9jYWxQYXRoLCBzdWdnZXN0ZWROYW1lKSA9PiB0aGlzLnBsdWdpbi5zY2hlZHVsZUF1dG9VcGxvYWQodGhpcy5maWxlLCBub2RlSWQsIGJsb2NrSWQsIGxvY2FsUGF0aCwgc3VnZ2VzdGVkTmFtZSksXG4gICAgICAgIG9uQ3JlYXRlU3VibWFwOiBhc3luYyAobm9kZSkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5maWxlKSB0aHJvdyBuZXcgRXJyb3IoXCJcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTVDMUFcdTY3MkFcdTUxNzNcdTgwNTRcdTY1ODdcdTRFRjZcIik7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmNyZWF0ZVN1Ym1hcEZpbGUodGhpcy5maWxlLCBub2RlKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25PcGVuTWluZE1hcDogYXN5bmMgKHBhdGgsIGZvY3VzTm9kZUlkKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ub3Blbk1pbmRNYXBQYXRoKHBhdGgsIHRoaXMuZmlsZT8ucGF0aCA/PyBcIlwiLCB0aGlzLmxlYWYsIGZvY3VzTm9kZUlkKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25SZW5kZXJDb2RlOiBhc3luYyAoYmxvY2ssIGNvbnRhaW5lcikgPT4ge1xuICAgICAgICAgIGNvbnN0IGxvbmdlc3RGZW5jZSA9IE1hdGgubWF4KDIsIC4uLkFycmF5LmZyb20oYmxvY2suY29kZS5tYXRjaEFsbCgvYCsvZyksIChtYXRjaCkgPT4gbWF0Y2hbMF0ubGVuZ3RoKSk7XG4gICAgICAgICAgY29uc3QgZmVuY2UgPSBcImBcIi5yZXBlYXQobG9uZ2VzdEZlbmNlICsgMSk7XG4gICAgICAgICAgY29uc3QgbWFya2Rvd24gPSBgJHtmZW5jZX0ke2Jsb2NrLmxhbmd1YWdlID8/IFwiXCJ9XFxuJHtibG9jay5jb2RlfVxcbiR7ZmVuY2V9YDtcbiAgICAgICAgICBhd2FpdCBNYXJrZG93blJlbmRlcmVyLnJlbmRlcih0aGlzLmFwcCwgbWFya2Rvd24sIGNvbnRhaW5lciwgdGhpcy5maWxlPy5wYXRoID8/IFwiXCIsIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LCB0aGlzLmdldEVkaXRvck9wdGlvbnMoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWRpdG9yLnNldERvY3VtZW50KHRoaXMuZG9jdW1lbnQsIGZhbHNlKTtcbiAgICAgIHRoaXMuZWRpdG9yLnNldE9wdGlvbnModGhpcy5nZXRFZGl0b3JPcHRpb25zKCkpO1xuICAgIH1cbiAgfVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIHRoaXMuZWRpdG9yPy5kZXN0cm95KCk7XG4gICAgdGhpcy5lZGl0b3IgPSBudWxsO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBudWxsO1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cblxuICBhc3luYyBzYXZlKGNsZWFyPzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLnNhdmUoY2xlYXIpO1xuICAgIHRoaXMuZWRpdG9yPy5tYXJrU2F2ZWQoKTtcbiAgfVxuXG4gIGFzeW5jIG9uQ2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuc2F2ZWRUaW1lciAhPT0gbnVsbCkgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnNhdmVkVGltZXIpO1xuICAgIHRoaXMuZWRpdG9yPy5kZXN0cm95KCk7XG4gICAgdGhpcy5lZGl0b3IgPSBudWxsO1xuICAgIGF3YWl0IHN1cGVyLm9uQ2xvc2UoKTtcbiAgfVxuXG4gIHJlZnJlc2hBcHBlYXJhbmNlKCk6IHZvaWQge1xuICAgIHRoaXMuYXBwbHlWaWV3Q2xhc3NlcygpO1xuICAgIHRoaXMuZWRpdG9yPy5zZXRPcHRpb25zKHRoaXMuZ2V0RWRpdG9yT3B0aW9ucygpKTtcbiAgfVxuXG4gIGZvY3VzTm9kZShub2RlSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZWRpdG9yPy5mb2N1c05vZGVCeUlkKG5vZGVJZCk7XG4gIH1cblxuICBwcml2YXRlIGdldEVkaXRvck9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlZmF1bHROb2RlU2hhcGU6IHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHROb2RlU2hhcGUsXG4gICAgICBkZWZhdWx0QXBwZWFyYW5jZTogc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5wbHVnaW4uc2V0dGluZ3MpLFxuICAgICAgc2hvd1Rhc2tQcm9ncmVzczogdGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd1Rhc2tQcm9ncmVzcyxcbiAgICAgIGF1dG9GaXRPbk9wZW46IHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GaXRPbk9wZW4sXG4gICAgICBoaXN0b3J5TGltaXQ6IHRoaXMucGx1Z2luLnNldHRpbmdzLmhpc3RvcnlMaW1pdCxcbiAgICAgIGltYWdlRmFpbG92ZXJFbmFibGVkOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyRW5hYmxlZCxcbiAgICAgIGltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kczogdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzLFxuICAgICAgaW1hZ2VGYWlsb3ZlclVzZUxvY2FsRmFsbGJhY2s6IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlWaWV3Q2xhc3NlcygpOiB2b2lkIHtcbiAgICBjb25zdCB0aGVtZSA9IHRoaXMuZG9jdW1lbnQ/LnRoZW1lID8/IFwiYXV0b1wiO1xuICAgIHRoaXMuY29udGVudEVsLnRvZ2dsZUNsYXNzKFwibW1jLWZvcmNlLWxpZ2h0XCIsIHRoZW1lID09PSBcImxpZ2h0XCIpO1xuICAgIHRoaXMuY29udGVudEVsLnRvZ2dsZUNsYXNzKFwibW1jLWZvcmNlLWRhcmtcIiwgdGhlbWUgPT09IFwiZGFya1wiKTtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVTYXZlZEluZGljYXRvcigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zYXZlZFRpbWVyICE9PSBudWxsKSB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuc2F2ZWRUaW1lcik7XG4gICAgdGhpcy5zYXZlZFRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5lZGl0b3I/Lm1hcmtTYXZlZCgpLCAyMzAwKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb3BlbkxpbmsocmF3TGluazogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGluayA9IHJhd0xpbmsudHJpbSgpO1xuICAgIGlmICgvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KGxpbmspKSB7XG4gICAgICB3aW5kb3cub3BlbihsaW5rLCBcIl9ibGFua1wiLCBcIm5vb3BlbmVyLG5vcmVmZXJyZXJcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHdpa2lNYXRjaCA9IGxpbmsubWF0Y2goL15cXFtcXFsoW1xcc1xcU10rPylcXF1cXF0kLyk7XG4gICAgY29uc3QgdGFyZ2V0ID0gKHdpa2lNYXRjaD8uWzFdID8/IGxpbmspLnNwbGl0KFwifFwiKVswXT8udHJpbSgpID8/IGxpbms7XG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dCh0YXJnZXQsIHRoaXMuZmlsZT8ucGF0aCA/PyBcIlwiLCBmYWxzZSk7XG4gIH1cblxuICBwcml2YXRlIHJlc29sdmVJbWFnZShyYXdTb3VyY2U6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IHNvdXJjZSA9IHJhd1NvdXJjZS50cmltKCk7XG4gICAgaWYgKCFzb3VyY2UpIHJldHVybiBudWxsO1xuICAgIGlmICgvXihodHRwcz86fGRhdGE6fGJsb2I6KS9pLnRlc3Qoc291cmNlKSkgcmV0dXJuIHNvdXJjZTtcbiAgICBjb25zdCB3aWtpTWF0Y2ggPSBzb3VyY2UubWF0Y2goL14hP1xcW1xcWyhbXFxzXFxTXSs/KVxcXVxcXSQvKTtcbiAgICBjb25zdCB0YXJnZXQgPSAod2lraU1hdGNoPy5bMV0gPz8gc291cmNlKS5zcGxpdChcInxcIilbMF0/LnNwbGl0KFwiI1wiKVswXT8udHJpbSgpID8/IHNvdXJjZTtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdCh0YXJnZXQsIHRoaXMuZmlsZT8ucGF0aCA/PyBcIlwiKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleHBvcnRUZXh0RmlsZShleHRlbnNpb246IFwic3ZnXCIgfCBcIm1kXCIgfCBcImpzb25cIiwgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuZmlsZTtcbiAgICBjb25zdCBwYXJlbnRQYXRoID0gZmlsZT8ucGFyZW50Py5wYXRoID8/IFwiXCI7XG4gICAgY29uc3QgYmFzZU5hbWUgPSBmaWxlPy5iYXNlbmFtZSA/PyB0aGlzLmRvY3VtZW50Py50aXRsZSA/PyBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLnBsdWdpbi5nZXRBdmFpbGFibGVQYXRoKG5vcm1hbGl6ZVBhdGgoYCR7cGFyZW50UGF0aCA/IGAke3BhcmVudFBhdGh9L2AgOiBcIlwifSR7YmFzZU5hbWV9LiR7ZXh0ZW5zaW9ufWApKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgY29udGVudCk7XG4gICAgbmV3IE5vdGljZShgXHU1REYyXHU1QkZDXHU1MUZBXHVGRjFBJHtwYXRofWApO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNZW51LCBNb2RhbCwgTm90aWNlLCBzZXRJY29uIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBjbG9uZURvY3VtZW50LFxuICBjbG9uZU5vZGVXaXRoRnJlc2hJZHMsXG4gIGNoaWxkcmVuVG9UYWJsZSxcbiAgY29udGFpbnNOb2RlLFxuICBjcmVhdGVOb2RlLFxuICBkb2N1bWVudFRvTWFya2Rvd24sXG4gIGV4dHJhY3RGaXJzdFdpa2lMaW5rLFxuICBmaW5kQW5jZXN0b3JzLFxuICBmaW5kTm9kZSxcbiAgZmluZFBhcmVudCxcbiAgZmxhdHRlbk5vZGVzLFxuICBnZXRUYXNrUHJvZ3Jlc3MsXG4gIGltYWdlU291cmNlQ2FuZGlkYXRlcyxcbiAgbWVyZ2VBcHBlYXJhbmNlLFxuICBub2RlU2VhcmNoVGV4dCxcbiAgbm9ybWFsaXplRG9jdW1lbnQsXG4gIG5ld0lkLFxuICBub2RlQ29udGVudEJsb2NrcyxcbiAgbm9kZVBsYWluVGV4dCxcbiAgc3luY05vZGVMZWdhY3lGaWVsZHMsXG4gIHBhcnNlRmVuY2VkQ29kZSxcbiAgcGFyc2VNYXJrZG93blRhYmxlLFxuICBub3JtYWxpemVSaWNoVGV4dCxcbiAgcmljaFRleHRQbGFpblRleHQsXG4gIHJpY2hUZXh0Q2hhcmFjdGVyU3R5bGVzLFxuICBjaGFyYWN0ZXJTdHlsZXNUb1JpY2hUZXh0LFxuICBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZSxcbiAgcmVjb25jaWxlUmljaFRleHRBZnRlckVkaXQsXG4gIHR5cGUgQmFja2dyb3VuZFBhdHRlcm4sXG4gIHR5cGUgRWRnZVN0eWxlLFxuICB0eXBlIEVkZ2VXaWR0aE1vZGUsXG4gIHR5cGUgRm9udEZhbWlseU1vZGUsXG4gIHR5cGUgTWluZE1hcEFwcGVhcmFuY2UsXG4gIHR5cGUgTWluZE1hcFRoZW1lUHJlc2V0SWQsXG4gIHR5cGUgTWluZE1hcERvY3VtZW50LFxuICB0eXBlIE1pbmRNYXBDb2RlQmxvY2ssXG4gIHR5cGUgTWluZE1hcENvbnRlbnRCbG9jayxcbiAgdHlwZSBNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2ssXG4gIHR5cGUgTWluZE1hcE5vZGUsXG4gIHR5cGUgTWluZE1hcFRleHRDb250ZW50QmxvY2ssXG4gIHR5cGUgTWluZE1hcFN1Ym1hcCxcbiAgdHlwZSBNaW5kTWFwVGV4dFJ1bixcbiAgdHlwZSBNaW5kTWFwVGV4dFN0eWxlLFxuICB0eXBlIE5vZGVTaGFwZSxcbiAgdHlwZSBUYXNrU3RhdHVzLFxuICByZW1vdmVOb2RlXG59IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQgeyBidWlsZEJyYW5jaENvbG9yTWFwLCBjb21wdXRlTGF5b3V0LCBkb2N1bWVudFRvU3ZnLCBlZGdlUGF0aCwgZWRnZVdpZHRoRm9yRGVwdGgsIHR5cGUgTGF5b3V0UmVzdWx0IH0gZnJvbSBcIi4vbGF5b3V0XCI7XG5pbXBvcnQgeyBDb2RlRWRpdE1vZGFsLCBUYWJsZUVkaXRNb2RhbCB9IGZyb20gXCIuL2NvbnRlbnQtbW9kYWxzXCI7XG5pbXBvcnQgdHlwZSB7IEltYWdlSG9zdENob2ljZSwgSW1hZ2VIb3N0VXBsb2FkQmF0Y2ggfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgYXBwZWFyYW5jZUZyb21UaGVtZVByZXNldCwgTUlORE1BUF9USEVNRV9QUkVTRVRTIH0gZnJvbSBcIi4vdGhlbWVzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEVkaXRvckNhbGxiYWNrcyB7XG4gIG9uQ2hhbmdlOiAoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCkgPT4gdm9pZDtcbiAgb25PcGVuTGluazogKGxpbms6IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIG9uRXhwb3J0U3ZnOiAoc3ZnOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICBvbkV4cG9ydE1hcmtkb3duOiAobWFya2Rvd246IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIG9uRXhwb3J0SnNvbjogKGpzb246IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIHJlc29sdmVJbWFnZTogKHNvdXJjZTogc3RyaW5nKSA9PiBzdHJpbmcgfCBudWxsO1xuICBvblNhdmVQYXN0ZWRJbWFnZTogKGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICBnZXRJbWFnZUhvc3RzOiAoKSA9PiBJbWFnZUhvc3RDaG9pY2VbXTtcbiAgZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHM6ICgpID0+IHN0cmluZ1tdO1xuICBvblVwbG9hZEltYWdlOiAoYmxvYjogQmxvYiwgc3VnZ2VzdGVkTmFtZTogc3RyaW5nLCBob3N0SWRzOiBzdHJpbmdbXSkgPT4gUHJvbWlzZTxJbWFnZUhvc3RVcGxvYWRCYXRjaD47XG4gIG9uUmVhZEltYWdlU291cmNlOiAoc291cmNlOiBzdHJpbmcpID0+IFByb21pc2U8eyBibG9iOiBCbG9iOyBzdWdnZXN0ZWROYW1lOiBzdHJpbmcgfSB8IG51bGw+O1xuICBvblNjaGVkdWxlQXV0b1VwbG9hZDogKG5vZGVJZDogc3RyaW5nLCBibG9ja0lkOiBzdHJpbmcsIGxvY2FsUGF0aDogc3RyaW5nLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcpID0+IGJvb2xlYW47XG4gIG9uQ3JlYXRlU3VibWFwOiAobm9kZTogTWluZE1hcE5vZGUpID0+IFByb21pc2U8TWluZE1hcFN1Ym1hcD47XG4gIG9uT3Blbk1pbmRNYXA6IChwYXRoOiBzdHJpbmcsIGZvY3VzTm9kZUlkPzogc3RyaW5nKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgb25SZW5kZXJDb2RlOiAoYmxvY2s6IE1pbmRNYXBDb2RlQmxvY2ssIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBFZGl0b3JPcHRpb25zIHtcbiAgZGVmYXVsdE5vZGVTaGFwZTogTm9kZVNoYXBlO1xuICBkZWZhdWx0QXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2U7XG4gIHNob3dUYXNrUHJvZ3Jlc3M6IGJvb2xlYW47XG4gIGF1dG9GaXRPbk9wZW46IGJvb2xlYW47XG4gIGhpc3RvcnlMaW1pdDogbnVtYmVyO1xuICBpbWFnZUZhaWxvdmVyRW5hYmxlZDogYm9vbGVhbjtcbiAgaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzOiBudW1iZXI7XG4gIGltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgTm9kZUVkaXRWYWx1ZXMge1xuICBjb250ZW50OiBNaW5kTWFwQ29udGVudEJsb2NrW107XG4gIG5vdGU6IHN0cmluZztcbiAgbGluazogc3RyaW5nO1xuICBpY29uOiBzdHJpbmc7XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICB0YXNrPzogVGFza1N0YXR1cztcbiAgY29sb3I/OiBzdHJpbmc7XG4gIHRleHRDb2xvcj86IHN0cmluZztcbiAgYm9yZGVyQ29sb3I/OiBzdHJpbmc7XG4gIGJvcmRlcldpZHRoPzogbnVtYmVyO1xuICBzaGFwZT86IE5vZGVTaGFwZTtcbiAgYm9sZD86IGJvb2xlYW47XG4gIGl0YWxpYz86IGJvb2xlYW47XG4gIHVuZGVybGluZT86IGJvb2xlYW47XG4gIGZvbnRTaXplPzogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBzdHlsZUVxdWFscyhsZWZ0OiBNaW5kTWFwVGV4dFN0eWxlIHwgdW5kZWZpbmVkLCByaWdodDogTWluZE1hcFRleHRTdHlsZSB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkobGVmdCA/PyB7fSkgPT09IEpTT04uc3RyaW5naWZ5KHJpZ2h0ID8/IHt9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyUmljaFRleHRSdW5zKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnRhaW5lci5lbXB0eSgpO1xuICBpZiAoIXJ1bnM/Lmxlbmd0aCkge1xuICAgIGNvbnRhaW5lci5zZXRUZXh0KGZhbGxiYWNrVGV4dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgcnVuIG9mIHJ1bnMpIHtcbiAgICBjb25zdCBzcGFuID0gY29udGFpbmVyLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXJpY2gtcnVuXCIsIHRleHQ6IHJ1bi50ZXh0IH0pO1xuICAgIGlmIChydW4uc3R5bGU/LmJvbGQgIT09IHVuZGVmaW5lZCkgc3Bhbi5zdHlsZS5mb250V2VpZ2h0ID0gcnVuLnN0eWxlLmJvbGQgPyBcIjcwMFwiIDogXCI0MDBcIjtcbiAgICBpZiAocnVuLnN0eWxlPy5pdGFsaWMgIT09IHVuZGVmaW5lZCkgc3Bhbi5zdHlsZS5mb250U3R5bGUgPSBydW4uc3R5bGUuaXRhbGljID8gXCJpdGFsaWNcIiA6IFwibm9ybWFsXCI7XG4gICAgY29uc3QgZGVjb3JhdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHJ1bi5zdHlsZT8udW5kZXJsaW5lKSBkZWNvcmF0aW9ucy5wdXNoKFwidW5kZXJsaW5lXCIpO1xuICAgIGlmIChydW4uc3R5bGU/LnN0cmlrZSkgZGVjb3JhdGlvbnMucHVzaChcImxpbmUtdGhyb3VnaFwiKTtcbiAgICBpZiAoZGVjb3JhdGlvbnMubGVuZ3RoKSBzcGFuLnN0eWxlLnRleHREZWNvcmF0aW9uTGluZSA9IGRlY29yYXRpb25zLmpvaW4oXCIgXCIpO1xuICAgIGlmIChydW4uc3R5bGU/LmNvbG9yKSBzcGFuLnN0eWxlLmNvbG9yID0gcnVuLnN0eWxlLmNvbG9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN0eWxlRnJvbUVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQsIGluaGVyaXRlZDogTWluZE1hcFRleHRTdHlsZSk6IE1pbmRNYXBUZXh0U3R5bGUge1xuICBjb25zdCBzdHlsZTogTWluZE1hcFRleHRTdHlsZSA9IHsgLi4uaW5oZXJpdGVkIH07XG4gIGNvbnN0IHRhZyA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICBpZiAodGFnID09PSBcImJcIiB8fCB0YWcgPT09IFwic3Ryb25nXCIpIHN0eWxlLmJvbGQgPSB0cnVlO1xuICBpZiAodGFnID09PSBcImlcIiB8fCB0YWcgPT09IFwiZW1cIikgc3R5bGUuaXRhbGljID0gdHJ1ZTtcbiAgaWYgKHRhZyA9PT0gXCJ1XCIpIHN0eWxlLnVuZGVybGluZSA9IHRydWU7XG4gIGlmICh0YWcgPT09IFwic1wiIHx8IHRhZyA9PT0gXCJzdHJpa2VcIiB8fCB0YWcgPT09IFwiZGVsXCIpIHN0eWxlLnN0cmlrZSA9IHRydWU7XG4gIGNvbnN0IGlubGluZSA9IGVsZW1lbnQuc3R5bGU7XG4gIGlmIChpbmxpbmUuZm9udFdlaWdodCAmJiAoaW5saW5lLmZvbnRXZWlnaHQgPT09IFwiYm9sZFwiIHx8IE51bWJlcihpbmxpbmUuZm9udFdlaWdodCkgPj0gNjAwKSkgc3R5bGUuYm9sZCA9IHRydWU7XG4gIGlmIChpbmxpbmUuZm9udFN0eWxlID09PSBcIml0YWxpY1wiKSBzdHlsZS5pdGFsaWMgPSB0cnVlO1xuICBjb25zdCBkZWNvcmF0aW9uID0gYCR7aW5saW5lLnRleHREZWNvcmF0aW9ufSAke2lubGluZS50ZXh0RGVjb3JhdGlvbkxpbmV9YDtcbiAgaWYgKGRlY29yYXRpb24uaW5jbHVkZXMoXCJ1bmRlcmxpbmVcIikpIHN0eWxlLnVuZGVybGluZSA9IHRydWU7XG4gIGlmIChkZWNvcmF0aW9uLmluY2x1ZGVzKFwibGluZS10aHJvdWdoXCIpKSBzdHlsZS5zdHJpa2UgPSB0cnVlO1xuICBjb25zdCBmb250Q29sb3IgPSB0YWcgPT09IFwiZm9udFwiID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjb2xvclwiKSA6IG51bGw7XG4gIGNvbnN0IGNvbG9yID0gaW5saW5lLmNvbG9yIHx8IGZvbnRDb2xvciB8fCBcIlwiO1xuICBpZiAoY29sb3IpIHtcbiAgICBjb25zdCBwcm9iZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIHByb2JlLnN0eWxlLmNvbG9yID0gY29sb3I7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwcm9iZSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGdldENvbXB1dGVkU3R5bGUocHJvYmUpLmNvbG9yLm1hdGNoKC9cXGQrL2cpPy5zbGljZSgwLCAzKS5tYXAoTnVtYmVyKTtcbiAgICBwcm9iZS5yZW1vdmUoKTtcbiAgICBpZiAobm9ybWFsaXplZD8ubGVuZ3RoID09PSAzKSBzdHlsZS5jb2xvciA9IGAjJHtub3JtYWxpemVkLm1hcCgodmFsdWUpID0+IHZhbHVlLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpLmpvaW4oXCJcIil9YDtcbiAgfVxuICByZXR1cm4gc3R5bGU7XG59XG5cbmZ1bmN0aW9uIHJlYWRSaWNoVGV4dEVkaXRvcihlZGl0b3I6IEhUTUxFbGVtZW50KTogeyB0ZXh0OiBzdHJpbmc7IHJpY2hUZXh0PzogTWluZE1hcFRleHRSdW5bXSB9IHtcbiAgY29uc3QgcmF3UnVuczogTWluZE1hcFRleHRSdW5bXSA9IFtdO1xuICBjb25zdCB2aXNpdCA9IChub2RlOiBOb2RlLCBpbmhlcml0ZWQ6IE1pbmRNYXBUZXh0U3R5bGUpOiB2b2lkID0+IHtcbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgIGNvbnN0IHRleHQgPSAobm9kZS50ZXh0Q29udGVudCA/PyBcIlwiKS5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKTtcbiAgICAgIGlmICghdGV4dCkgcmV0dXJuO1xuICAgICAgY29uc3Qgc3R5bGUgPSBPYmplY3QudmFsdWVzKGluaGVyaXRlZCkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8geyAuLi5pbmhlcml0ZWQgfSA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHByZXZpb3VzID0gcmF3UnVucy5hdCgtMSk7XG4gICAgICBpZiAocHJldmlvdXMgJiYgc3R5bGVFcXVhbHMocHJldmlvdXMuc3R5bGUsIHN0eWxlKSkgcHJldmlvdXMudGV4dCArPSB0ZXh0O1xuICAgICAgZWxzZSByYXdSdW5zLnB1c2goeyB0ZXh0LCBzdHlsZSB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkgcmV0dXJuO1xuICAgIGlmIChub2RlLnRhZ05hbWUgPT09IFwiQlJcIikge1xuICAgICAgcmF3UnVucy5wdXNoKHsgdGV4dDogXCIgXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHN0eWxlID0gc3R5bGVGcm9tRWxlbWVudChub2RlLCBpbmhlcml0ZWQpO1xuICAgIG5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIHN0eWxlKSk7XG4gICAgaWYgKFtcIkRJVlwiLCBcIlBcIl0uaW5jbHVkZXMobm9kZS50YWdOYW1lKSAmJiByYXdSdW5zLmxlbmd0aCAmJiAhcmF3UnVucy5hdCgtMSk/LnRleHQuZW5kc1dpdGgoXCIgXCIpKSByYXdSdW5zLnB1c2goeyB0ZXh0OiBcIiBcIiB9KTtcbiAgfTtcbiAgZWRpdG9yLmNoaWxkTm9kZXMuZm9yRWFjaCgoY2hpbGQpID0+IHZpc2l0KGNoaWxkLCB7fSkpO1xuICBjb25zdCBmYWxsYmFjayA9IGVkaXRvci50ZXh0Q29udGVudD8ucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpID8/IFwiXCI7XG4gIGNvbnN0IHJpY2hUZXh0ID0gbm9ybWFsaXplUmljaFRleHQocmF3UnVucywgZmFsbGJhY2spO1xuICByZXR1cm4geyB0ZXh0OiByaWNoVGV4dFBsYWluVGV4dChyaWNoVGV4dCwgZmFsbGJhY2spLnRyaW0oKSwgcmljaFRleHQgfTtcbn1cblxuY2xhc3MgSW1hZ2VQcmV2aWV3TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgc2NhbGUgPSAxO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwcml2YXRlIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IGFsdDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJtbWMtaW1hZ2UtcHJldmlldy1tb2RhbFwiKTtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dCh0aGlzLmFsdCB8fCBcIlx1NTZGRVx1NzI0N1x1OTg4NFx1ODlDOFwiKTtcbiAgICBjb25zdCB0b29sYmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1pbWFnZS1wcmV2aWV3LXRvb2xiYXJcIiB9KTtcbiAgICBjb25zdCBpbWFnZVdyYXAgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLXByZXZpZXctc3RhZ2VcIiB9KTtcbiAgICBjb25zdCBpbWFnZSA9IGltYWdlV3JhcC5jcmVhdGVFbChcImltZ1wiLCB7IGF0dHI6IHsgc3JjOiB0aGlzLnNvdXJjZSwgYWx0OiB0aGlzLmFsdCB8fCBcIlx1NTZGRVx1NzI0N1wiIH0gfSk7XG4gICAgbGV0IGJhc2VXaWR0aCA9IDA7XG4gICAgbGV0IGJhc2VIZWlnaHQgPSAwO1xuICAgIGNvbnN0IGFwcGx5U2NhbGUgPSAoKTogdm9pZCA9PiB7XG4gICAgICBpZiAoIWJhc2VXaWR0aCB8fCAhYmFzZUhlaWdodCkgcmV0dXJuO1xuICAgICAgaW1hZ2Uuc3R5bGUud2lkdGggPSBgJHtNYXRoLm1heCgxLCBNYXRoLnJvdW5kKGJhc2VXaWR0aCAqIHRoaXMuc2NhbGUpKX1weGA7XG4gICAgICBpbWFnZS5zdHlsZS5oZWlnaHQgPSBgJHtNYXRoLm1heCgxLCBNYXRoLnJvdW5kKGJhc2VIZWlnaHQgKiB0aGlzLnNjYWxlKSl9cHhgO1xuICAgIH07XG4gICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgYXZhaWxhYmxlV2lkdGggPSBNYXRoLm1heCgzMjAsIGltYWdlV3JhcC5jbGllbnRXaWR0aCAqIDAuOSk7XG4gICAgICBjb25zdCBhdmFpbGFibGVIZWlnaHQgPSBNYXRoLm1heCgyMjAsIGltYWdlV3JhcC5jbGllbnRIZWlnaHQgKiAwLjkpO1xuICAgICAgY29uc3QgZml0ID0gTWF0aC5taW4oMSwgYXZhaWxhYmxlV2lkdGggLyBNYXRoLm1heCgxLCBpbWFnZS5uYXR1cmFsV2lkdGgpLCBhdmFpbGFibGVIZWlnaHQgLyBNYXRoLm1heCgxLCBpbWFnZS5uYXR1cmFsSGVpZ2h0KSk7XG4gICAgICBiYXNlV2lkdGggPSBNYXRoLm1heCgxLCBpbWFnZS5uYXR1cmFsV2lkdGggKiBmaXQpO1xuICAgICAgYmFzZUhlaWdodCA9IE1hdGgubWF4KDEsIGltYWdlLm5hdHVyYWxIZWlnaHQgKiBmaXQpO1xuICAgICAgYXBwbHlTY2FsZSgpO1xuICAgIH0pO1xuICAgIGNvbnN0IGJ1dHRvbiA9IChsYWJlbDogc3RyaW5nLCBhY3Rpb246ICgpID0+IHZvaWQpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IGVsID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhY3Rpb24pO1xuICAgIH07XG4gICAgYnV0dG9uKFwiXHUyMjEyXCIsICgpID0+IHsgdGhpcy5zY2FsZSA9IE1hdGgubWF4KDAuMiwgdGhpcy5zY2FsZSAtIDAuMik7IGFwcGx5U2NhbGUoKTsgfSk7XG4gICAgYnV0dG9uKFwiMTAwJVwiLCAoKSA9PiB7IHRoaXMuc2NhbGUgPSAxOyBhcHBseVNjYWxlKCk7IH0pO1xuICAgIGJ1dHRvbihcIitcIiwgKCkgPT4geyB0aGlzLnNjYWxlID0gTWF0aC5taW4oNSwgdGhpcy5zY2FsZSArIDAuMik7IGFwcGx5U2NhbGUoKTsgfSk7XG4gICAgaW1hZ2VXcmFwLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnNjYWxlID0gTWF0aC5taW4oNSwgTWF0aC5tYXgoMC4yLCB0aGlzLnNjYWxlICsgKGV2ZW50LmRlbHRhWSA8IDAgPyAwLjE1IDogLTAuMTUpKSk7XG4gICAgICBhcHBseVNjYWxlKCk7XG4gICAgfSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcbiAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKCkgPT4geyB0aGlzLnNjYWxlID0gMTsgYXBwbHlTY2FsZSgpOyB9KTtcbiAgfVxufVxuXG5jbGFzcyBJbWFnZUhvc3RQaWNrZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZXNvbHZlZCA9IGZhbHNlO1xuICBwcml2YXRlIHJlYWRvbmx5IHNlbGVjdGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBob3N0czogSW1hZ2VIb3N0Q2hvaWNlW10sXG4gICAgaW5pdGlhbElkczogc3RyaW5nW10sXG4gICAgcHJpdmF0ZSByZWFkb25seSByZXNvbHZlU2VsZWN0aW9uOiAoaWRzOiBzdHJpbmdbXSB8IG51bGwpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICBpbml0aWFsSWRzLmZvckVhY2goKGlkKSA9PiB0aGlzLnNlbGVjdGVkLmFkZChpZCkpO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiXHU5MDA5XHU2MkU5XHU0RTBBXHU0RjIwXHU1NkZFXHU1RThBXCIpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwibW1zLWltYWdlLWhvc3QtcGlja2VyXCIpO1xuICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlx1NTNFRlx1NEVFNVx1OTAwOVx1NjJFOVx1NEUwMFx1NEUyQVx1NjIxNlx1NTkxQVx1NEUyQVx1NTZGRVx1NUU4QVx1MzAwMlx1NTE2OFx1OTBFOFx1NEUwQVx1NEYyMFx1NjIxMFx1NTI5Rlx1NTQwRVx1RkYwQ1x1N0IyQ1x1NEUwMFx1OTg3OVx1NzY4NFx1NTczMFx1NTc0MFx1NEYxQVx1NEY1Q1x1NEUzQVx1ODI4Mlx1NzBCOVx1NUY1M1x1NTI0RFx1NjYzRVx1NzkzQVx1NTczMFx1NTc0MFx1RkYwQ1x1NTE3Nlx1NEY1OVx1NTczMFx1NTc0MFx1NEYxQVx1NEY1Q1x1NEUzQVx1OTU1Q1x1NTBDRlx1NEZERFx1NUI1OFx1MzAwMlwiXG4gICAgfSk7XG4gICAgY29uc3QgbGlzdCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbXMtaW1hZ2UtaG9zdC1waWNrZXItbGlzdFwiIH0pO1xuICAgIGZvciAoY29uc3QgaG9zdCBvZiB0aGlzLmhvc3RzKSB7XG4gICAgICBjb25zdCBsYWJlbCA9IGxpc3QuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJtbXMtaW1hZ2UtaG9zdC1waWNrZXItaXRlbVwiIH0pO1xuICAgICAgY29uc3QgY2hlY2tib3ggPSBsYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiIH0pO1xuICAgICAgY2hlY2tib3guY2hlY2tlZCA9IHRoaXMuc2VsZWN0ZWQuaGFzKGhvc3QuaWQpO1xuICAgICAgY2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIGlmIChjaGVja2JveC5jaGVja2VkKSB0aGlzLnNlbGVjdGVkLmFkZChob3N0LmlkKTsgZWxzZSB0aGlzLnNlbGVjdGVkLmRlbGV0ZShob3N0LmlkKTtcbiAgICAgIH0pO1xuICAgICAgbGFiZWwuY3JlYXRlU3Bhbih7IHRleHQ6IGhvc3QubmFtZSB9KTtcbiAgICB9XG4gICAgY29uc3QgYWN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtb2RhbC1idXR0b24tY29udGFpbmVyXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1M0Q2XHU2RDg4XCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGNhbmNlbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5jbG9zZSgpKTtcbiAgICBjb25zdCBjb25maXJtID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU3ODZFXHU1QjlBXCIsIGNsczogXCJtb2QtY3RhXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGNvbmZpcm0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5zZWxlY3RlZC5zaXplKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJcdThCRjdcdTgxRjNcdTVDMTFcdTkwMDlcdTYyRTlcdTRFMDBcdTRFMkFcdTU2RkVcdTVFOEFcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5yZXNvbHZlU2VsZWN0aW9uKEFycmF5LmZyb20odGhpcy5zZWxlY3RlZCkpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMucmVzb2x2ZWQpIHRoaXMucmVzb2x2ZVNlbGVjdGlvbihudWxsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjaG9vc2VJbWFnZUhvc3RzKGFwcDogQXBwLCBob3N0czogSW1hZ2VIb3N0Q2hvaWNlW10sIGluaXRpYWxJZHM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXSB8IG51bGw+IHtcbiAgaWYgKCFob3N0cy5sZW5ndGgpIHtcbiAgICBuZXcgTm90aWNlKFwiXHU2Q0ExXHU2NzA5XHU1M0VGXHU3NTI4XHU1NkZFXHU1RThBXHVGRjBDXHU4QkY3XHU1MTQ4XHU1NzI4XHU2M0QyXHU0RUY2XHU4QkJFXHU3RjZFXHU0RTJEXHU5MTREXHU3RjZFXHU1RTc2XHU1NDJGXHU3NTI4XHU1NkZFXHU1RThBXCIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cbiAgY29uc3QgYWxsb3dlZCA9IG5ldyBTZXQoaG9zdHMubWFwKChob3N0KSA9PiBob3N0LmlkKSk7XG4gIGNvbnN0IGluaXRpYWwgPSBpbml0aWFsSWRzLmZpbHRlcigoaWQpID0+IGFsbG93ZWQuaGFzKGlkKSk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gbmV3IEltYWdlSG9zdFBpY2tlck1vZGFsKGFwcCwgaG9zdHMsIGluaXRpYWwubGVuZ3RoID8gaW5pdGlhbCA6IFtob3N0c1swXSEuaWRdLCByZXNvbHZlKS5vcGVuKCkpO1xufVxuXG5jbGFzcyBOb2RlRWRpdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IG5vZGU6IE1pbmRNYXBOb2RlO1xuICBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRTaGFwZTogTm9kZVNoYXBlO1xuICBwcml2YXRlIHJlYWRvbmx5IGNhbGxiYWNrczogUGljazxNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzLCBcInJlc29sdmVJbWFnZVwiIHwgXCJvblNhdmVQYXN0ZWRJbWFnZVwiIHwgXCJnZXRJbWFnZUhvc3RzXCIgfCBcImdldERlZmF1bHRVcGxvYWRIb3N0SWRzXCIgfCBcIm9uVXBsb2FkSW1hZ2VcIiB8IFwib25SZWFkSW1hZ2VTb3VyY2VcIj47XG4gIHByaXZhdGUgcmVhZG9ubHkgc3VibWl0OiAodmFsdWVzOiBOb2RlRWRpdFZhbHVlcywgbW9kZTogXCJhdXRvc2F2ZVwiIHwgXCJjb21taXRcIikgPT4gdm9pZDtcbiAgcHJpdmF0ZSBzYXZlT25DbG9zZTogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY2xvc2VXaXRob3V0Rmx1c2ggPSBmYWxzZTtcbiAgcHJpdmF0ZSBvdXRzaWRlUG9pbnRlckhhbmRsZXI6ICgoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBub2RlOiBNaW5kTWFwTm9kZSxcbiAgICBkZWZhdWx0U2hhcGU6IE5vZGVTaGFwZSxcbiAgICBjYWxsYmFja3M6IFBpY2s8TWluZE1hcEVkaXRvckNhbGxiYWNrcywgXCJyZXNvbHZlSW1hZ2VcIiB8IFwib25TYXZlUGFzdGVkSW1hZ2VcIiB8IFwiZ2V0SW1hZ2VIb3N0c1wiIHwgXCJnZXREZWZhdWx0VXBsb2FkSG9zdElkc1wiIHwgXCJvblVwbG9hZEltYWdlXCIgfCBcIm9uUmVhZEltYWdlU291cmNlXCI+LFxuICAgIHN1Ym1pdDogKHZhbHVlczogTm9kZUVkaXRWYWx1ZXMsIG1vZGU6IFwiYXV0b3NhdmVcIiB8IFwiY29tbWl0XCIpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgIHRoaXMuZGVmYXVsdFNoYXBlID0gZGVmYXVsdFNoYXBlO1xuICAgIHRoaXMuY2FsbGJhY2tzID0gY2FsbGJhY2tzO1xuICAgIHRoaXMuc3VibWl0ID0gc3VibWl0O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiXHU3RjE2XHU4RjkxXHU4MjgyXHU3MEI5XHU1MTg1XHU1QkI5XCIpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwibW1jLW5vZGUtZWRpdC1tb2RhbFwiKTtcbiAgICBjb25zdCBmb3JtID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2RlLWVkaXQtZm9ybVwiIH0pO1xuICAgIGZvcm0uY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIixcbiAgICAgIHRleHQ6IFwiXHU4MjgyXHU3MEI5XHU1MTg1XHU1QkI5XHU3NTMxXHU1M0VGXHU2MzkyXHU1RThGXHU3Njg0XHU2NTg3XHU1QjU3XHU1NzU3XHU1NDhDXHU1NkZFXHU3MjQ3XHU1NzU3XHU3RUM0XHU2MjEwXHUzMDAyXHU1M0VGXHU0RUU1XHU1M0VBXHU0RkREXHU3NTU5XHU1NkZFXHU3MjQ3XHVGRjBDXHU0RTVGXHU1M0VGXHU0RUU1XHU3RUM0XHU1NDA4XHU0RTNBXHU1NkZFXHU3MjQ3XHUyMTkyXHU2NTg3XHU1QjU3XHUzMDAxXHU2NTg3XHU1QjU3XHUyMTkyXHU1NkZFXHU3MjQ3XHVGRjBDXHU2MjE2XHU2NTg3XHU1QjU3XHUyMTkyXHU1NkZFXHU3MjQ3XHUyMTkyXHU2NTg3XHU1QjU3XHUzMDAyXCJcbiAgICB9KTtcblxuICAgIGxldCB3b3JraW5nQmxvY2tzOiBNaW5kTWFwQ29udGVudEJsb2NrW10gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG5vZGVDb250ZW50QmxvY2tzKHRoaXMubm9kZSkpKSBhcyBNaW5kTWFwQ29udGVudEJsb2NrW107XG4gICAgaWYgKCF3b3JraW5nQmxvY2tzLmxlbmd0aCkgd29ya2luZ0Jsb2NrcyA9IFt7IGlkOiBuZXdJZCgpLCB0eXBlOiBcInRleHRcIiwgdGV4dDogXCJcdTY1QjBcdTgyODJcdTcwQjlcIiB9XTtcbiAgICBsZXQgc2NoZWR1bGVBdXRvU2F2ZTogKCkgPT4gdm9pZCA9ICgpID0+IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGFjdGlvblJvdyA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBibG9ja3NFbCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLWxpc3RcIiB9KTtcblxuICAgIGNvbnN0IGNsb25lQmxvY2tzID0gKCk6IE1pbmRNYXBDb250ZW50QmxvY2tbXSA9PiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHdvcmtpbmdCbG9ja3MpKSBhcyBNaW5kTWFwQ29udGVudEJsb2NrW107XG4gICAgY29uc3QgdmFsaWRCbG9ja3MgPSAoKTogTWluZE1hcENvbnRlbnRCbG9ja1tdID0+IGNsb25lQmxvY2tzKCkuZmlsdGVyKChibG9jaykgPT4gYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiID8gQm9vbGVhbihibG9jay5zb3VyY2UudHJpbSgpKSA6IEJvb2xlYW4oYmxvY2sudGV4dC50cmltKCkpKTtcblxuICAgIGNvbnN0IHJlbmRlclRleHRCbG9jayA9IChjb250YWluZXI6IEhUTUxFbGVtZW50LCBibG9jazogTWluZE1hcFRleHRDb250ZW50QmxvY2spOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IHRvb2xiYXIgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1yaWNoLXRleHQtdG9vbGJhclwiIH0pO1xuICAgICAgY29uc3Qgc291cmNlID0gY29udGFpbmVyLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgICBjbHM6IFwibW1jLXJpY2gtdGV4dC1zb3VyY2VcIixcbiAgICAgICAgYXR0cjogeyByb3dzOiBcIjNcIiwgc3BlbGxjaGVjazogXCJ0cnVlXCIsIHBsYWNlaG9sZGVyOiBcIlx1OEY5M1x1NTE2NVx1NjU4N1x1NUI1N1x1RkYxQlx1NTNFRlx1NEVFNVx1NTE2OFx1OTBFOFx1NTIyMFx1OTY2NFx1RkYwQ1x1OEJBOVx1ODI4Mlx1NzBCOVx1NTNFQVx1NEZERFx1NzU1OVx1NTZGRVx1NzI0N1wiIH1cbiAgICAgIH0pO1xuICAgICAgc291cmNlLnZhbHVlID0gYmxvY2sudGV4dDtcbiAgICAgIGxldCBzYXZlZFN0YXJ0ID0gc291cmNlLnZhbHVlLmxlbmd0aDtcbiAgICAgIGxldCBzYXZlZEVuZCA9IHNvdXJjZS52YWx1ZS5sZW5ndGg7XG4gICAgICBjb25zdCBzZWxlY3Rpb24gPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1yaWNoLXNlbGVjdGlvbi1zdGF0dXNcIiB9KTtcbiAgICAgIGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXJpY2gtcHJldmlldy1sYWJlbFwiLCB0ZXh0OiBcIlx1NjU4N1x1NUI1N1x1NjgzN1x1NUYwRlx1OTg4NFx1ODlDOFwiIH0pO1xuICAgICAgY29uc3QgcHJldmlldyA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXJpY2gtdGV4dC1wcmV2aWV3XCIgfSk7XG4gICAgICBjb25zdCB1cGRhdGVQcmV2aWV3ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICByZW5kZXJSaWNoVGV4dFJ1bnMocHJldmlldywgYmxvY2sucmljaFRleHQsIGJsb2NrLnRleHQgfHwgXCJcdTk4ODRcdTg5QzhcdTY1ODdcdTVCNTdcIik7XG4gICAgICAgIHByZXZpZXcudG9nZ2xlQ2xhc3MoXCJpcy1wbGFjZWhvbGRlclwiLCAhYmxvY2sudGV4dCk7XG4gICAgICB9O1xuICAgICAgY29uc3QgcmVtZW1iZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNhdmVkU3RhcnQgPSBzb3VyY2Uuc2VsZWN0aW9uU3RhcnQgPz8gMDtcbiAgICAgICAgc2F2ZWRFbmQgPSBzb3VyY2Uuc2VsZWN0aW9uRW5kID8/IHNhdmVkU3RhcnQ7XG4gICAgICAgIGNvbnN0IGZyb20gPSBNYXRoLm1pbihzYXZlZFN0YXJ0LCBzYXZlZEVuZCk7XG4gICAgICAgIGNvbnN0IHRvID0gTWF0aC5tYXgoc2F2ZWRTdGFydCwgc2F2ZWRFbmQpO1xuICAgICAgICBzZWxlY3Rpb24uc2V0VGV4dChmcm9tID09PSB0byA/IGBcdTUxNDlcdTY4MDdcdTRGNERcdTdGNkVcdUZGMUEke2Zyb20gKyAxfWAgOiBgXHU1REYyXHU5MDA5XHU2MkU5XHU3QjJDICR7ZnJvbSArIDF9XHUyMDEzJHt0b30gXHU0RTJBXHU1QjU3XHU3QjI2YCk7XG4gICAgICB9O1xuICAgICAgY29uc3QgcmFuZ2UgPSAoKTogeyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlciB9IHwgbnVsbCA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oYmxvY2sudGV4dC5sZW5ndGgsIE1hdGgubWluKHNhdmVkU3RhcnQsIHNhdmVkRW5kKSkpO1xuICAgICAgICBjb25zdCBlbmQgPSBNYXRoLm1heChzdGFydCwgTWF0aC5taW4oYmxvY2sudGV4dC5sZW5ndGgsIE1hdGgubWF4KHNhdmVkU3RhcnQsIHNhdmVkRW5kKSkpO1xuICAgICAgICBpZiAoc3RhcnQgPT09IGVuZCkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJcdThCRjdcdTUxNDhcdTkwMDlcdTYyRTlcdTk3MDBcdTg5ODFcdThCQkVcdTdGNkVcdTY4M0NcdTVGMEZcdTc2ODRcdTY1ODdcdTVCNTdcIik7XG4gICAgICAgICAgc291cmNlLmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgc291cmNlLmZvY3VzKCk7IHNvdXJjZS5zZXRTZWxlY3Rpb25SYW5nZShzdGFydCwgZW5kKTtcbiAgICAgICAgcmV0dXJuIHsgc3RhcnQsIGVuZCB9O1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHN0eWxlQnV0dG9uID0gKGxhYmVsOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIGFjdGlvbjogKCkgPT4gdm9pZCwgY2xzID0gXCJcIik6IEhUTUxCdXR0b25FbGVtZW50ID0+IHtcbiAgICAgICAgY29uc3QgYnRuID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogYG1tYy1yaWNoLXRvb2xiYXItYnV0dG9uICR7Y2xzfWAudHJpbSgpLCB0ZXh0OiBsYWJlbCwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiLCB0aXRsZSB9IH0pO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZXZlbnQpID0+IGV2ZW50LnByZXZlbnREZWZhdWx0KCkpO1xuICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBhY3Rpb24oKTsgfSk7XG4gICAgICAgIHJldHVybiBidG47XG4gICAgICB9O1xuICAgICAgY29uc3QgYXBwbHlCb29sZWFuID0gKGtleTogXCJib2xkXCIgfCBcIml0YWxpY1wiIHwgXCJ1bmRlcmxpbmVcIik6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IHJhbmdlKCk7IGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICAgICAgY29uc3Qgc3R5bGVzID0gcmljaFRleHRDaGFyYWN0ZXJTdHlsZXMoYmxvY2sucmljaFRleHQsIGJsb2NrLnRleHQpO1xuICAgICAgICBjb25zdCBlbmFibGVkID0gc3R5bGVzLnNsaWNlKHNlbGVjdGVkLnN0YXJ0LCBzZWxlY3RlZC5lbmQpLmV2ZXJ5KChzdHlsZSkgPT4gc3R5bGVba2V5XSA9PT0gdHJ1ZSk7XG4gICAgICAgIGJsb2NrLnJpY2hUZXh0ID0gYXBwbHlSaWNoVGV4dFN0eWxlUmFuZ2UoYmxvY2sudGV4dCwgYmxvY2sucmljaFRleHQsIHNlbGVjdGVkLnN0YXJ0LCBzZWxlY3RlZC5lbmQsIHsgW2tleV06ICFlbmFibGVkIH0pO1xuICAgICAgICB1cGRhdGVQcmV2aWV3KCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgc291cmNlLnNldFNlbGVjdGlvblJhbmdlKHNlbGVjdGVkLnN0YXJ0LCBzZWxlY3RlZC5lbmQpOyByZW1lbWJlcigpO1xuICAgICAgfTtcbiAgICAgIHN0eWxlQnV0dG9uKFwiQlwiLCBcIlx1NTJBMFx1N0M5N1x1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1wiLCAoKSA9PiBhcHBseUJvb2xlYW4oXCJib2xkXCIpLCBcImlzLWJvbGRcIik7XG4gICAgICBzdHlsZUJ1dHRvbihcIklcIiwgXCJcdTY1OUNcdTRGNTNcdTYyNDBcdTkwMDlcdTY1ODdcdTVCNTdcIiwgKCkgPT4gYXBwbHlCb29sZWFuKFwiaXRhbGljXCIpLCBcImlzLWl0YWxpY1wiKTtcbiAgICAgIHN0eWxlQnV0dG9uKFwiVVwiLCBcIlx1N0VEOVx1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1x1NTJBMFx1NEUwQlx1NTIxMlx1N0VCRlwiLCAoKSA9PiBhcHBseUJvb2xlYW4oXCJ1bmRlcmxpbmVcIiksIFwiaXMtdW5kZXJsaW5lXCIpO1xuICAgICAgY29uc3QgY29sb3JMYWJlbCA9IHRvb2xiYXIuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJtbWMtcmljaC1jb2xvci1idXR0b25cIiwgYXR0cjogeyB0aXRsZTogXCJcdTRGRUVcdTY1MzlcdTYyNDBcdTkwMDlcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIiB9IH0pO1xuICAgICAgY29sb3JMYWJlbC5jcmVhdGVTcGFuKHsgdGV4dDogXCJcdTk4OUNcdTgyNzJcIiB9KTtcbiAgICAgIGNvbnN0IGNvbG9yTGluZSA9IGNvbG9yTGFiZWwuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtcmljaC1jb2xvci1saW5lXCIgfSk7XG4gICAgICBjb25zdCBjb2xvciA9IGNvbG9yTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY29sb3JcIiwgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIiB9IH0pO1xuICAgICAgY29sb3IudmFsdWUgPSBcIiNlZjQ0NDRcIjtcbiAgICAgIGNvbG9yTGluZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci52YWx1ZTtcbiAgICAgIGNvbG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7IGNvbG9yTGluZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci52YWx1ZTsgfSk7XG4gICAgICBjb2xvci5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSByYW5nZSgpOyBpZiAoIXNlbGVjdGVkKSByZXR1cm47XG4gICAgICAgIGJsb2NrLnJpY2hUZXh0ID0gYXBwbHlSaWNoVGV4dFN0eWxlUmFuZ2UoYmxvY2sudGV4dCwgYmxvY2sucmljaFRleHQsIHNlbGVjdGVkLnN0YXJ0LCBzZWxlY3RlZC5lbmQsIHsgY29sb3I6IGNvbG9yLnZhbHVlIH0pO1xuICAgICAgICB1cGRhdGVQcmV2aWV3KCk7IHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgIH0pO1xuICAgICAgc3R5bGVCdXR0b24oXCJcdTZFMDVcdTk2NjRcdTY4M0NcdTVGMEZcIiwgXCJcdTZFMDVcdTk2NjRcdTYyNDBcdTkwMDlcdTY1ODdcdTVCNTdcdTY4M0NcdTVGMEZcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IHJhbmdlKCk7IGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCwgbnVsbCk7XG4gICAgICAgIHVwZGF0ZVByZXZpZXcoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgfSwgXCJpcy13aWRlXCIpO1xuICAgICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoXCJzZWxlY3RcIiwgcmVtZW1iZXIpO1xuICAgICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCByZW1lbWJlcik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgcmVtZW1iZXIpO1xuICAgICAgc291cmNlLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBzb3VyY2UudmFsdWUucmVwbGFjZSgvXFxyP1xcbi9nLCBcIiBcIik7XG4gICAgICAgIGJsb2NrLnJpY2hUZXh0ID0gcmVjb25jaWxlUmljaFRleHRBZnRlckVkaXQoYmxvY2sudGV4dCwgYmxvY2sucmljaFRleHQsIG5leHQpO1xuICAgICAgICBibG9jay50ZXh0ID0gbmV4dDtcbiAgICAgICAgc291cmNlLnZhbHVlID0gbmV4dDtcbiAgICAgICAgcmVtZW1iZXIoKTsgdXBkYXRlUHJldmlldygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7XG4gICAgICB9KTtcbiAgICAgIHVwZGF0ZVByZXZpZXcoKTsgcmVtZW1iZXIoKTtcbiAgICB9O1xuXG4gICAgY29uc3QgY2hvb3NlSW1hZ2UgPSAoYmxvY2s6IE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jaywgbW9kZTogXCJsb2NhbFwiIHwgXCJyZW1vdGVcIiwgcmVmcmVzaDogKCkgPT4gdm9pZCk6IHZvaWQgPT4ge1xuICAgICAgdm9pZCAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgaG9zdElkczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgaWYgKG1vZGUgPT09IFwicmVtb3RlXCIpIHtcbiAgICAgICAgICBjb25zdCBjaG9zZW4gPSBhd2FpdCBjaG9vc2VJbWFnZUhvc3RzKHRoaXMuYXBwLCB0aGlzLmNhbGxiYWNrcy5nZXRJbWFnZUhvc3RzKCksIHRoaXMuY2FsbGJhY2tzLmdldERlZmF1bHRVcGxvYWRIb3N0SWRzKCkpO1xuICAgICAgICAgIGlmICghY2hvc2VuKSByZXR1cm47XG4gICAgICAgICAgaG9zdElkcyA9IGNob3NlbjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgbmV3IFByb21pc2U8RmlsZSB8IG51bGw+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgICAgaW5wdXQudHlwZSA9IFwiZmlsZVwiO1xuICAgICAgICAgIGlucHV0LmFjY2VwdCA9IFwiaW1hZ2UvKlwiO1xuICAgICAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4gcmVzb2x2ZShpbnB1dC5maWxlcz8uWzBdID8/IG51bGwpLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICAgICAgaW5wdXQuY2xpY2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghZmlsZSkgcmV0dXJuO1xuICAgICAgICBpZiAobW9kZSA9PT0gXCJsb2NhbFwiKSB7XG4gICAgICAgICAgY29uc3QgcGF0aCA9IGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uU2F2ZVBhc3RlZEltYWdlKGZpbGUsIGZpbGUubmFtZSk7XG4gICAgICAgICAgYmxvY2suc291cmNlID0gcGF0aDtcbiAgICAgICAgICBibG9jay5sb2NhbFNvdXJjZSA9IHBhdGg7XG4gICAgICAgICAgYmxvY2sucmVtb3RlU291cmNlcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBiYXRjaCA9IGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uVXBsb2FkSW1hZ2UoZmlsZSwgZmlsZS5uYW1lLCBob3N0SWRzKTtcbiAgICAgICAgICBpZiAoIWJhdGNoLnN1Y2Nlc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBiYXRjaC5mYWlsdXJlcy5tYXAoKGl0ZW0pID0+IGAke2l0ZW0uaG9zdE5hbWV9XHVGRjFBJHtpdGVtLmVycm9yfWApLmpvaW4oXCJcdUZGMUJcIikgfHwgXCJcdTY3MkFcdTc3RTVcdTk1MTlcdThCRUZcIjtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgdXBsb2FkZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICBibG9jay5zb3VyY2UgPSBiYXRjaC5zdWNjZXNzZXNbMF0hLnVybDtcbiAgICAgICAgICBibG9jay5sb2NhbFNvdXJjZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBibG9jay5yZW1vdGVTb3VyY2VzID0gYmF0Y2guc3VjY2Vzc2VzLm1hcCgoaXRlbSkgPT4gKHsgLi4uaXRlbSwgdXBsb2FkZWRBdCB9KSk7XG4gICAgICAgICAgaWYgKGJhdGNoLmZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgICAgICAgbmV3IE5vdGljZShgXHU5MEU4XHU1MjA2XHU1NkZFXHU1RThBXHU0RTBBXHU0RjIwXHU1OTMxXHU4RDI1XHVGRjFBJHtiYXRjaC5mYWlsdXJlcy5tYXAoKGl0ZW0pID0+IGl0ZW0uaG9zdE5hbWUpLmpvaW4oXCJcdTMwMDFcIil9YCwgNzAwMCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYFx1NURGMlx1NEUwQVx1NEYyMFx1NTIzMFx1RkYxQSR7YmF0Y2guc3VjY2Vzc2VzLm1hcCgoaXRlbSkgPT4gaXRlbS5ob3N0TmFtZSkuam9pbihcIlx1MzAwMVwiKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFibG9jay5hbHQpIGJsb2NrLmFsdCA9IGZpbGUubmFtZS5yZXBsYWNlKC9cXC5bXi5dKyQvLCBcIlwiKTtcbiAgICAgICAgcmVmcmVzaCgpO1xuICAgICAgICBzY2hlZHVsZUF1dG9TYXZlKCk7XG4gICAgICB9KSgpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gaW1hZ2Ugb3BlcmF0aW9uIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIG5ldyBOb3RpY2UoYCR7bW9kZSA9PT0gXCJyZW1vdGVcIiA/IFwiXHU0RTBBXHU0RjIwXHU1NkZFXHU1RThBXCIgOiBcIlx1NEZERFx1NUI1OFx1NTZGRVx1NzI0N1wifVx1NTkzMVx1OEQyNVx1RkYxQSR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsIDcwMDApO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHVwbG9hZEV4aXN0aW5nSW1hZ2UgPSAoYmxvY2s6IE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jaywgcmVmcmVzaDogKCkgPT4gdm9pZCk6IHZvaWQgPT4ge1xuICAgICAgdm9pZCAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBjaG9zZW4gPSBhd2FpdCBjaG9vc2VJbWFnZUhvc3RzKHRoaXMuYXBwLCB0aGlzLmNhbGxiYWNrcy5nZXRJbWFnZUhvc3RzKCksIHRoaXMuY2FsbGJhY2tzLmdldERlZmF1bHRVcGxvYWRIb3N0SWRzKCkpO1xuICAgICAgICBpZiAoIWNob3NlbikgcmV0dXJuO1xuICAgICAgICBjb25zdCByZWFkYWJsZVNvdXJjZSA9IGJsb2NrLmxvY2FsU291cmNlIHx8IGJsb2NrLnNvdXJjZTtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vblJlYWRJbWFnZVNvdXJjZShyZWFkYWJsZVNvdXJjZSk7XG4gICAgICAgIGlmICghaW1hZ2UpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiXHU1RjUzXHU1MjREXHU1NkZFXHU3MjQ3XHU0RTBEXHU2NjJGXHU1M0VGXHU4QkZCXHU1M0Q2XHU3Njg0XHU2NzJDXHU1NzMwXHU2NTg3XHU0RUY2XHVGRjFCXHU4QkY3XHU0RjdGXHU3NTI4XHUyMDE4XHU0RTBBXHU0RjIwXHU1MjMwXHU1NkZFXHU1RThBXHUyMDE5XHU5MUNEXHU2NUIwXHU5MDA5XHU2MkU5XHU1NkZFXHU3MjQ3XCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBiYXRjaCA9IGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uVXBsb2FkSW1hZ2UoaW1hZ2UuYmxvYiwgaW1hZ2Uuc3VnZ2VzdGVkTmFtZSwgY2hvc2VuKTtcbiAgICAgICAgaWYgKCFiYXRjaC5zdWNjZXNzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGJhdGNoLmZhaWx1cmVzLm1hcCgoaXRlbSkgPT4gYCR7aXRlbS5ob3N0TmFtZX1cdUZGMUEke2l0ZW0uZXJyb3J9YCkuam9pbihcIlx1RkYxQlwiKSB8fCBcIlx1NEUwQVx1NEYyMFx1NTkzMVx1OEQyNVwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB1cGxvYWRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IG5ldyBNYXAoKGJsb2NrLnJlbW90ZVNvdXJjZXMgPz8gW10pLm1hcCgoaXRlbSkgPT4gW2l0ZW0uaG9zdElkLCBpdGVtXSkpO1xuICAgICAgICBiYXRjaC5zdWNjZXNzZXMuZm9yRWFjaCgoaXRlbSkgPT4gZXhpc3Rpbmcuc2V0KGl0ZW0uaG9zdElkLCB7IC4uLml0ZW0sIHVwbG9hZGVkQXQgfSkpO1xuICAgICAgICBibG9jay5yZW1vdGVTb3VyY2VzID0gQXJyYXkuZnJvbShleGlzdGluZy52YWx1ZXMoKSk7XG4gICAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gcmVhZGFibGVTb3VyY2U7XG4gICAgICAgIGlmICghYmF0Y2guZmFpbHVyZXMubGVuZ3RoKSBibG9jay5zb3VyY2UgPSBiYXRjaC5zdWNjZXNzZXNbMF0hLnVybDtcbiAgICAgICAgcmVmcmVzaCgpO1xuICAgICAgICBzY2hlZHVsZUF1dG9TYXZlKCk7XG4gICAgICAgIGlmIChiYXRjaC5mYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgICAgICBuZXcgTm90aWNlKGBcdTkwRThcdTUyMDZcdTU2RkVcdTVFOEFcdTRFMEFcdTRGMjBcdTU5MzFcdThEMjVcdUZGMENcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTc1NTlcdUZGMUEke2JhdGNoLmZhaWx1cmVzLm1hcCgoaXRlbSkgPT4gaXRlbS5ob3N0TmFtZSkuam9pbihcIlx1MzAwMVwiKX1gLCA3MDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXcgTm90aWNlKGBcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcdTVERjJcdTRFMEFcdTRGMjBcdTUyMzBcdUZGMUEke2JhdGNoLnN1Y2Nlc3Nlcy5tYXAoKGl0ZW0pID0+IGl0ZW0uaG9zdE5hbWUpLmpvaW4oXCJcdTMwMDFcIil9YCk7XG4gICAgICAgIH1cbiAgICAgIH0pKCkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBleGlzdGluZyBpbWFnZSB1cGxvYWQgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgICAgbmV3IE5vdGljZShgXHU0RTBBXHU0RjIwXHU1RjUzXHU1MjREXHU1NkZFXHU3MjQ3XHU1OTMxXHU4RDI1XHVGRjFBJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCwgNzAwMCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgcmVuZGVyQmxvY2tzID0gKCk6IHZvaWQgPT4ge1xuICAgICAgYmxvY2tzRWwuZW1wdHkoKTtcbiAgICAgIHdvcmtpbmdCbG9ja3MuZm9yRWFjaCgoYmxvY2ssIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGNhcmQgPSBibG9ja3NFbC5jcmVhdGVEaXYoeyBjbHM6IGBtbWMtY29udGVudC1ibG9jayBpcy0ke2Jsb2NrLnR5cGV9YCB9KTtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2staGVhZGVyXCIgfSk7XG4gICAgICAgIGhlYWRlci5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLXRpdGxlXCIsIHRleHQ6IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiID8gYFx1NjU4N1x1NUI1N1x1NTc1NyAke2luZGV4ICsgMX1gIDogYFx1NTZGRVx1NzI0N1x1NTc1NyAke2luZGV4ICsgMX1gIH0pO1xuICAgICAgICBjb25zdCBjb250cm9scyA9IGhlYWRlci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stY29udHJvbHNcIiB9KTtcbiAgICAgICAgY29uc3QgY29udHJvbCA9IChpY29uOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIGFjdGlvbjogKCkgPT4gdm9pZCwgZGlzYWJsZWQgPSBmYWxzZSk6IHZvaWQgPT4ge1xuICAgICAgICAgIGNvbnN0IGJ0biA9IGNvbnRyb2xzLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImNsaWNrYWJsZS1pY29uXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiwgdGl0bGUsIFwiYXJpYS1sYWJlbFwiOiB0aXRsZSB9IH0pO1xuICAgICAgICAgIHNldEljb24oYnRuLCBpY29uKTsgYnRuLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHsgZXZlbnQucHJldmVudERlZmF1bHQoKTsgYWN0aW9uKCk7IH0pO1xuICAgICAgICB9O1xuICAgICAgICBjb250cm9sKFwiYXJyb3ctdXBcIiwgXCJcdTRFMEFcdTc5RkJcIiwgKCkgPT4geyBbd29ya2luZ0Jsb2Nrc1tpbmRleCAtIDFdLCB3b3JraW5nQmxvY2tzW2luZGV4XV0gPSBbd29ya2luZ0Jsb2Nrc1tpbmRleF0hLCB3b3JraW5nQmxvY2tzW2luZGV4IC0gMV0hXTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSwgaW5kZXggPT09IDApO1xuICAgICAgICBjb250cm9sKFwiYXJyb3ctZG93blwiLCBcIlx1NEUwQlx1NzlGQlwiLCAoKSA9PiB7IFt3b3JraW5nQmxvY2tzW2luZGV4ICsgMV0sIHdvcmtpbmdCbG9ja3NbaW5kZXhdXSA9IFt3b3JraW5nQmxvY2tzW2luZGV4XSEsIHdvcmtpbmdCbG9ja3NbaW5kZXggKyAxXSFdOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9LCBpbmRleCA9PT0gd29ya2luZ0Jsb2Nrcy5sZW5ndGggLSAxKTtcbiAgICAgICAgY29udHJvbChcInRyYXNoLTJcIiwgXCJcdTUyMjBcdTk2NjRcdTUxODVcdTVCQjlcdTU3NTdcIiwgKCkgPT4geyB3b3JraW5nQmxvY2tzLnNwbGljZShpbmRleCwgMSk7IHJlbmRlckJsb2NrcygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0pO1xuICAgICAgICBpZiAoYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICByZW5kZXJUZXh0QmxvY2soY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stYm9keVwiIH0pLCBibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb250ZW50LWJsb2NrLWJvZHkgbW1jLWltYWdlLWJsb2NrLWVkaXRvclwiIH0pO1xuICAgICAgICAgIGNvbnN0IHByZXZpZXcgPSBib2R5LmNyZWF0ZURpdih7IGNsczogXCJtbWMtaW1hZ2UtYmxvY2stcHJldmlld1wiIH0pO1xuICAgICAgICAgIGNvbnN0IHJlZnJlc2ggPSAoKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBwcmV2aWV3LmVtcHR5KCk7XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IHRoaXMuY2FsbGJhY2tzLnJlc29sdmVJbWFnZShibG9jay5zb3VyY2UpO1xuICAgICAgICAgICAgaWYgKHJlc29sdmVkKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGltZyA9IHByZXZpZXcuY3JlYXRlRWwoXCJpbWdcIiwgeyBhdHRyOiB7IHNyYzogcmVzb2x2ZWQsIGFsdDogYmxvY2suYWx0IHx8IFwiXHU1NkZFXHU3MjQ3XCIgfSB9KTtcbiAgICAgICAgICAgICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBuZXcgSW1hZ2VQcmV2aWV3TW9kYWwodGhpcy5hcHAsIHJlc29sdmVkLCBibG9jay5hbHQgfHwgXCJcdTU2RkVcdTcyNDdcIikub3BlbigpKTtcbiAgICAgICAgICAgIH0gZWxzZSBwcmV2aWV3LmNyZWF0ZURpdih7IGNsczogXCJtbWMtaW1hZ2UtcGxhY2Vob2xkZXJcIiwgdGV4dDogYmxvY2suc291cmNlID8gXCJcdTY1RTBcdTZDRDVcdTUyQTBcdThGN0RcdTU2RkVcdTcyNDdcIiA6IFwiXHU1QzFBXHU2NzJBXHU5MDA5XHU2MkU5XHU1NkZFXHU3MjQ3XCIgfSk7XG4gICAgICAgICAgICBzb3VyY2UudmFsdWUgPSBibG9jay5zb3VyY2U7XG4gICAgICAgICAgICBhbHQudmFsdWUgPSBibG9jay5hbHQgPz8gXCJcIjtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IHNvdXJjZUxhYmVsID0gYm9keS5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTU2RkVcdTcyNDdcdThERUZcdTVGODRcdTYyMTZcdTdGNTFcdTU3NDBcIiB9KTtcbiAgICAgICAgICBjb25zdCBzb3VyY2UgPSBzb3VyY2VMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiXHU0RUQzXHU1RTkzXHU4REVGXHU1Rjg0XHUzMDAxW1tcdTU2RkVcdTcyNDddXSBcdTYyMTYgaHR0cHM6Ly8uLi5cIiB9IH0pO1xuICAgICAgICAgIGNvbnN0IGFsdExhYmVsID0gYm9keS5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTU2RkVcdTcyNDdcdThCRjRcdTY2MEVcdUZGMDhcdTUzRUZcdTkwMDlcdUZGMDlcIiB9KTtcbiAgICAgICAgICBjb25zdCBhbHQgPSBhbHRMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiXHU1NkZFXHU3MjQ3XHU4QkY0XHU2NjBFXCIgfSB9KTtcbiAgICAgICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5leHQgPSBzb3VyY2UudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKG5leHQgIT09IGJsb2NrLnNvdXJjZSkge1xuICAgICAgICAgICAgICBibG9jay5zb3VyY2UgPSBuZXh0O1xuICAgICAgICAgICAgICBibG9jay5sb2NhbFNvdXJjZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgYmxvY2sucmVtb3RlU291cmNlcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlZnJlc2goKTtcbiAgICAgICAgICAgIHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBhbHQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHsgYmxvY2suYWx0ID0gYWx0LnZhbHVlLnRyaW0oKSB8fCB1bmRlZmluZWQ7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSk7XG4gICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGJvZHkuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1pbWFnZS1ibG9jay1hY3Rpb25zXCIgfSk7XG4gICAgICAgICAgY29uc3QgbG9jYWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTRGRERcdTVCNThcdTUyMzBcdTRFRDNcdTVFOTNcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICAgICAgbG9jYWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGNob29zZUltYWdlKGJsb2NrLCBcImxvY2FsXCIsIHJlZnJlc2gpKTtcbiAgICAgICAgICBjb25zdCByZW1vdGUgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTkwMDlcdTYyRTlcdTY1ODdcdTRFRjZcdTVFNzZcdTRFMEFcdTRGMjBcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICAgICAgcmVtb3RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBjaG9vc2VJbWFnZShibG9jaywgXCJyZW1vdGVcIiwgcmVmcmVzaCkpO1xuICAgICAgICAgIGlmIChibG9jay5sb2NhbFNvdXJjZSB8fCAoYmxvY2suc291cmNlICYmICEvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KGJsb2NrLnNvdXJjZSkpKSB7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRDdXJyZW50ID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU0RTBBXHU0RjIwXHU1RjUzXHU1MjREXHU1NkZFXHU3MjQ3XCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgICAgICAgICAgdXBsb2FkQ3VycmVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdXBsb2FkRXhpc3RpbmdJbWFnZShibG9jaywgcmVmcmVzaCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYmxvY2sucmVtb3RlU291cmNlcz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBtaXJyb3JzID0gYm9keS5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWltYWdlLW1pcnJvcnNcIiB9KTtcbiAgICAgICAgICAgIG1pcnJvcnMuY3JlYXRlU3Bhbih7IGNsczogXCJtbXMtaW1hZ2UtbWlycm9ycy1sYWJlbFwiLCB0ZXh0OiBcIlx1OEZEQ1x1N0EwQlx1OTU1Q1x1NTBDRlx1RkYxQVwiIH0pO1xuICAgICAgICAgICAgYmxvY2sucmVtb3RlU291cmNlcy5mb3JFYWNoKChpdGVtLCBtaXJyb3JJbmRleCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBsaW5rID0gbWlycm9ycy5jcmVhdGVFbChcImFcIiwge1xuICAgICAgICAgICAgICAgIHRleHQ6IGl0ZW0uaG9zdE5hbWUgfHwgYFx1NTZGRVx1NUU4QSAke21pcnJvckluZGV4ICsgMX1gLFxuICAgICAgICAgICAgICAgIGhyZWY6IGl0ZW0udXJsLFxuICAgICAgICAgICAgICAgIGF0dHI6IHsgdGFyZ2V0OiBcIl9ibGFua1wiLCByZWw6IFwibm9vcGVuZXJcIiB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKCF3b3JraW5nQmxvY2tzLmxlbmd0aCkgYmxvY2tzRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1lbXB0eS1jb250ZW50LWhpbnRcIiwgdGV4dDogXCJcdTVGNTNcdTUyNERcdTZDQTFcdTY3MDlcdTUxODVcdTVCQjlcdTU3NTdcdTMwMDJcdThCRjdcdTZERkJcdTUyQTBcdTY1ODdcdTVCNTdcdTYyMTZcdTU2RkVcdTcyNDdcdTMwMDJcIiB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgYWRkVGV4dCA9IGFjdGlvblJvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTY1ODdcdTVCNTdcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgYWRkVGV4dC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB3b3JraW5nQmxvY2tzLnB1c2goeyBpZDogbmV3SWQoKSwgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IFwiXCIgfSk7IHJlbmRlckJsb2NrcygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0pO1xuICAgIGNvbnN0IGFkZEltYWdlID0gYWN0aW9uUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCIrIFx1NTZGRVx1NzI0N1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBhZGRJbWFnZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB3b3JraW5nQmxvY2tzLnB1c2goeyBpZDogbmV3SWQoKSwgdHlwZTogXCJpbWFnZVwiLCBzb3VyY2U6IFwiXCIgfSk7IHJlbmRlckJsb2NrcygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0pO1xuICAgIHJlbmRlckJsb2NrcygpO1xuXG4gICAgY29uc3QgZGV0YWlsc0dyaWQgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZm9ybS1ncmlkXCIgfSk7XG4gICAgY29uc3QgaWNvbkxhYmVsID0gZGV0YWlsc0dyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1NkZFXHU2ODA3XHU2MjE2IEVtb2ppXCIgfSk7XG4gICAgY29uc3QgaWNvbklucHV0ID0gaWNvbkxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJcdTRGOEJcdTU5ODIgXHVEODNEXHVEQ0ExXCIgfSB9KTtcbiAgICBpY29uSW5wdXQudmFsdWUgPSB0aGlzLm5vZGUuaWNvbiA/PyBcIlwiO1xuICAgIGNvbnN0IHRhc2tMYWJlbCA9IGRldGFpbHNHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NEVGQlx1NTJBMVx1NzJCNlx1NjAwMVwiIH0pO1xuICAgIGNvbnN0IHRhc2tTZWxlY3QgPSB0YXNrTGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZm9yIChjb25zdCBbdmFsdWUsIGxhYmVsXSBvZiBbW1wiXCIsIFwiXHU2NUUwXCJdLCBbXCJ0b2RvXCIsIFwiXHU1Rjg1XHU1MjlFXCJdLCBbXCJkb2luZ1wiLCBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiXSwgW1wiZG9uZVwiLCBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiXV0gYXMgY29uc3QpIHRhc2tTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB2YWx1ZSB9IH0pO1xuICAgIHRhc2tTZWxlY3QudmFsdWUgPSB0aGlzLm5vZGUudGFzayA/PyBcIlwiO1xuICAgIGNvbnN0IHNoYXBlTGFiZWwgPSBkZXRhaWxzR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTgyODJcdTcwQjlcdTVGNjJcdTcyQjZcIiB9KTtcbiAgICBjb25zdCBzaGFwZVNlbGVjdCA9IHNoYXBlTGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZm9yIChjb25zdCBbdmFsdWUsIGxhYmVsXSBvZiBbW1wicm91bmRlZFwiLCBcIlx1NTcwNlx1ODlEMlwiXSwgW1wicGlsbFwiLCBcIlx1ODBGNlx1NTZDQVwiXSwgW1wicmVjdGFuZ2xlXCIsIFwiXHU3NkY0XHU4OUQyXCJdXSBhcyBjb25zdCkgc2hhcGVTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB2YWx1ZSB9IH0pO1xuICAgIHNoYXBlU2VsZWN0LnZhbHVlID0gdGhpcy5ub2RlLnN0eWxlPy5zaGFwZSA/PyB0aGlzLmRlZmF1bHRTaGFwZTtcbiAgICBjb25zdCB0YWdzTGFiZWwgPSBkZXRhaWxzR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTY4MDdcdTdCN0VcdUZGMDhcdTkwMTdcdTUzRjdcdTUyMDZcdTk2OTRcdUZGMDlcIiB9KTtcbiAgICBjb25zdCB0YWdzSW5wdXQgPSB0YWdzTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiIH0pO1xuICAgIHRhZ3NJbnB1dC52YWx1ZSA9IHRoaXMubm9kZS50YWdzPy5qb2luKFwiLCBcIikgPz8gXCJcIjtcblxuICAgIGNvbnN0IHN0eWxlR3JpZCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1mb3JtLWdyaWQgbW1jLXN0eWxlLWdyaWRcIiB9KTtcbiAgICBjb25zdCBjb2xvckNvbnRyb2wgPSAobGFiZWxUZXh0OiBzdHJpbmcsIGN1cnJlbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCwgZmFsbGJhY2s6IHN0cmluZyk6IFtIVE1MSW5wdXRFbGVtZW50LCBIVE1MSW5wdXRFbGVtZW50XSA9PiB7XG4gICAgICBjb25zdCBsYWJlbCA9IHN0eWxlR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogbGFiZWxUZXh0IH0pO1xuICAgICAgY29uc3Qgcm93ID0gbGFiZWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2xvci1yb3dcIiB9KTtcbiAgICAgIGNvbnN0IHRvZ2dsZSA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiIH0pO1xuICAgICAgY29uc3QgY29sb3IgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY29sb3JcIiB9KTtcbiAgICAgIHRvZ2dsZS5jaGVja2VkID0gQm9vbGVhbihjdXJyZW50KTsgY29sb3IudmFsdWUgPSBjdXJyZW50ID8/IGZhbGxiYWNrOyBjb2xvci5kaXNhYmxlZCA9ICF0b2dnbGUuY2hlY2tlZDtcbiAgICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHsgY29sb3IuZGlzYWJsZWQgPSAhdG9nZ2xlLmNoZWNrZWQ7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSk7XG4gICAgICBjb2xvci5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHNjaGVkdWxlQXV0b1NhdmUpO1xuICAgICAgcmV0dXJuIFt0b2dnbGUsIGNvbG9yXTtcbiAgICB9O1xuICAgIGNvbnN0IFtjb2xvclRvZ2dsZSwgY29sb3JJbnB1dF0gPSBjb2xvckNvbnRyb2woXCJcdTgyODJcdTcwQjlcdTk4OUNcdTgyNzJcIiwgdGhpcy5ub2RlLnN0eWxlPy5jb2xvciwgXCIjNGY0NmU1XCIpO1xuICAgIGNvbnN0IFt0ZXh0Q29sb3JUb2dnbGUsIHRleHRDb2xvcklucHV0XSA9IGNvbG9yQ29udHJvbChcIlx1NjU3NFx1ODI4Mlx1NzBCOVx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiLCB0aGlzLm5vZGUuc3R5bGU/LnRleHRDb2xvciwgXCIjZmZmZmZmXCIpO1xuICAgIGNvbnN0IFtib3JkZXJDb2xvclRvZ2dsZSwgYm9yZGVyQ29sb3JJbnB1dF0gPSBjb2xvckNvbnRyb2woXCJcdThGQjlcdTY4NDZcdTk4OUNcdTgyNzJcIiwgdGhpcy5ub2RlLnN0eWxlPy5ib3JkZXJDb2xvciwgXCIjOTRhM2I4XCIpO1xuICAgIGNvbnN0IG51bWJlckNvbnRyb2wgPSAobGFiZWxUZXh0OiBzdHJpbmcsIGN1cnJlbnQ6IG51bWJlciB8IHVuZGVmaW5lZCwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBzdGVwOiBudW1iZXIpOiBIVE1MSW5wdXRFbGVtZW50ID0+IHtcbiAgICAgIGNvbnN0IGxhYmVsID0gc3R5bGVHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBsYWJlbFRleHQgfSk7XG4gICAgICBjb25zdCBpbnB1dCA9IGxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogU3RyaW5nKG1pbiksIG1heDogU3RyaW5nKG1heCksIHN0ZXA6IFN0cmluZyhzdGVwKSwgcGxhY2Vob2xkZXI6IFwiXHU4RERGXHU5NjhGXHU5RUQ4XHU4QkE0XCIgfSB9KTtcbiAgICAgIGlucHV0LnZhbHVlID0gY3VycmVudD8udG9TdHJpbmcoKSA/PyBcIlwiOyByZXR1cm4gaW5wdXQ7XG4gICAgfTtcbiAgICBjb25zdCBib3JkZXJXaWR0aElucHV0ID0gbnVtYmVyQ29udHJvbChcIlx1OEZCOVx1Njg0Nlx1N0M5N1x1N0VDNlwiLCB0aGlzLm5vZGUuc3R5bGU/LmJvcmRlcldpZHRoLCAwLCA2LCAuNSk7XG4gICAgY29uc3QgZm9udFNpemVJbnB1dCA9IG51bWJlckNvbnRyb2woXCJcdTVCNTdcdTUzRjdcIiwgdGhpcy5ub2RlLnN0eWxlPy5mb250U2l6ZSwgMTAsIDMyLCAxKTtcbiAgICBjb25zdCBib29sZWFuQ29udHJvbCA9IChsYWJlbFRleHQ6IHN0cmluZywgY3VycmVudDogYm9vbGVhbiB8IHVuZGVmaW5lZCk6IEhUTUxTZWxlY3RFbGVtZW50ID0+IHtcbiAgICAgIGNvbnN0IGxhYmVsID0gc3R5bGVHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBsYWJlbFRleHQgfSk7XG4gICAgICBjb25zdCBzZWxlY3QgPSBsYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHU4RERGXHU5NjhGXHU5RUQ4XHU4QkE0XCIsIGF0dHI6IHsgdmFsdWU6IFwiaW5oZXJpdFwiIH0gfSk7XG4gICAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBcIlx1NUYwMFx1NTQyRlwiLCBhdHRyOiB7IHZhbHVlOiBcInRydWVcIiB9IH0pO1xuICAgICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcdTUxNzNcdTk1RURcIiwgYXR0cjogeyB2YWx1ZTogXCJmYWxzZVwiIH0gfSk7XG4gICAgICBzZWxlY3QudmFsdWUgPSBjdXJyZW50ID09PSB1bmRlZmluZWQgPyBcImluaGVyaXRcIiA6IGN1cnJlbnQgPyBcInRydWVcIiA6IFwiZmFsc2VcIjsgcmV0dXJuIHNlbGVjdDtcbiAgICB9O1xuICAgIGNvbnN0IGJvbGRJbnB1dCA9IGJvb2xlYW5Db250cm9sKFwiXHU2NTc0XHU4MjgyXHU3MEI5XHU1MkEwXHU3Qzk3XCIsIHRoaXMubm9kZS5zdHlsZT8uYm9sZCk7XG4gICAgY29uc3QgaXRhbGljSW5wdXQgPSBib29sZWFuQ29udHJvbChcIlx1NjU3NFx1ODI4Mlx1NzBCOVx1NjU5Q1x1NEY1M1wiLCB0aGlzLm5vZGUuc3R5bGU/Lml0YWxpYyk7XG4gICAgY29uc3QgdW5kZXJsaW5lSW5wdXQgPSBib29sZWFuQ29udHJvbChcIlx1NjU3NFx1ODI4Mlx1NzBCOVx1NEUwQlx1NTIxMlx1N0VCRlwiLCB0aGlzLm5vZGUuc3R5bGU/LnVuZGVybGluZSk7XG5cbiAgICBjb25zdCBub3RlTGFiZWwgPSBmb3JtLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NTkwN1x1NkNFOFx1RkYwOFx1NTNFRlx1OTAwOVx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IG5vdGVJbnB1dCA9IG5vdGVMYWJlbC5jcmVhdGVFbChcInRleHRhcmVhXCIpOyBub3RlSW5wdXQudmFsdWUgPSB0aGlzLm5vZGUubm90ZSA/PyBcIlwiOyBub3RlSW5wdXQucm93cyA9IDQ7XG4gICAgY29uc3QgbGlua0xhYmVsID0gZm9ybS5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTk0RkVcdTYzQTVcdUZGMDhcdTdGNTFcdTU3NDBcdTMwMDFcdTdCMTRcdThCQjBcdTU0MERcdTYyMTYgW1tcdTUzQ0NcdTk0RkVdXVx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IGxpbmtJbnB1dCA9IGxpbmtMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIgfSk7IGxpbmtJbnB1dC52YWx1ZSA9IHRoaXMubm9kZS5saW5rID8/IFwiXCI7XG5cbiAgICBjb25zdCBwYXJzZUJvb2wgPSAodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4gfCB1bmRlZmluZWQgPT4gdmFsdWUgPT09IFwidHJ1ZVwiID8gdHJ1ZSA6IHZhbHVlID09PSBcImZhbHNlXCIgPyBmYWxzZSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBwYXJzZU51bWJlciA9ICh2YWx1ZTogc3RyaW5nLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIgfCB1bmRlZmluZWQgPT4gdmFsdWUudHJpbSgpICYmIE51bWJlci5pc0Zpbml0ZShOdW1iZXIodmFsdWUpKSA/IE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBOdW1iZXIodmFsdWUpKSkgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgY29sbGVjdFZhbHVlcyA9IChzaG93Tm90aWNlOiBib29sZWFuKTogTm9kZUVkaXRWYWx1ZXMgfCBudWxsID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB2YWxpZEJsb2NrcygpO1xuICAgICAgaWYgKCFjb250ZW50Lmxlbmd0aCkgeyBpZiAoc2hvd05vdGljZSkgbmV3IE5vdGljZShcIlx1ODI4Mlx1NzBCOVx1ODFGM1x1NUMxMVx1OTcwMFx1ODk4MVx1NEUwMFx1NEUyQVx1NjU4N1x1NUI1N1x1NTc1N1x1NjIxNlx1NTZGRVx1NzI0N1x1NTc1N1wiKTsgcmV0dXJuIG51bGw7IH1cbiAgICAgIGNvbnN0IHRhc2sgPSB0YXNrU2VsZWN0LnZhbHVlO1xuICAgICAgY29uc3Qgc2hhcGUgPSBzaGFwZVNlbGVjdC52YWx1ZTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnQsXG4gICAgICAgIG5vdGU6IG5vdGVJbnB1dC52YWx1ZS50cmltKCksIGxpbms6IGxpbmtJbnB1dC52YWx1ZS50cmltKCksIGljb246IGljb25JbnB1dC52YWx1ZS50cmltKCkuc2xpY2UoMCwgMTIpLFxuICAgICAgICB0YWdzOiBBcnJheS5mcm9tKG5ldyBTZXQodGFnc0lucHV0LnZhbHVlLnNwbGl0KC9bLFx1RkYwQ10vKS5tYXAoKHRhZykgPT4gdGFnLnRyaW0oKS5yZXBsYWNlKC9eIy8sIFwiXCIpKS5maWx0ZXIoQm9vbGVhbikpKS5zbGljZSgwLCAxMiksXG4gICAgICAgIHRhc2s6IHRhc2sgPT09IFwidG9kb1wiIHx8IHRhc2sgPT09IFwiZG9pbmdcIiB8fCB0YXNrID09PSBcImRvbmVcIiA/IHRhc2sgOiB1bmRlZmluZWQsXG4gICAgICAgIGNvbG9yOiBjb2xvclRvZ2dsZS5jaGVja2VkID8gY29sb3JJbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgdGV4dENvbG9yOiB0ZXh0Q29sb3JUb2dnbGUuY2hlY2tlZCA/IHRleHRDb2xvcklucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBib3JkZXJDb2xvcjogYm9yZGVyQ29sb3JUb2dnbGUuY2hlY2tlZCA/IGJvcmRlckNvbG9ySW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGJvcmRlcldpZHRoOiBwYXJzZU51bWJlcihib3JkZXJXaWR0aElucHV0LnZhbHVlLCAwLCA2KSxcbiAgICAgICAgc2hhcGU6IHNoYXBlID09PSBcInBpbGxcIiB8fCBzaGFwZSA9PT0gXCJyZWN0YW5nbGVcIiB8fCBzaGFwZSA9PT0gXCJyb3VuZGVkXCIgPyBzaGFwZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgYm9sZDogcGFyc2VCb29sKGJvbGRJbnB1dC52YWx1ZSksIGl0YWxpYzogcGFyc2VCb29sKGl0YWxpY0lucHV0LnZhbHVlKSwgdW5kZXJsaW5lOiBwYXJzZUJvb2wodW5kZXJsaW5lSW5wdXQudmFsdWUpLFxuICAgICAgICBmb250U2l6ZTogcGFyc2VOdW1iZXIoZm9udFNpemVJbnB1dC52YWx1ZSwgMTAsIDMyKVxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgbGV0IHRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgbGFzdCA9IEpTT04uc3RyaW5naWZ5KGNvbGxlY3RWYWx1ZXMoZmFsc2UpKTtcbiAgICBjb25zdCBzYXZlTm93ID0gKG1vZGU6IFwiYXV0b3NhdmVcIiB8IFwiY29tbWl0XCIsIHNob3dOb3RpY2UgPSBmYWxzZSk6IGJvb2xlYW4gPT4ge1xuICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSB7IHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpOyB0aW1lciA9IG51bGw7IH1cbiAgICAgIGNvbnN0IHZhbHVlcyA9IGNvbGxlY3RWYWx1ZXMoc2hvd05vdGljZSk7IGlmICghdmFsdWVzKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBzaWduYXR1cmUgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZXMpO1xuICAgICAgaWYgKHNpZ25hdHVyZSAhPT0gbGFzdCkgeyB0aGlzLnN1Ym1pdCh2YWx1ZXMsIG1vZGUpOyBsYXN0ID0gc2lnbmF0dXJlOyB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHNjaGVkdWxlQXV0b1NhdmUgPSAoKTogdm9pZCA9PiB7IGlmICh0aW1lciAhPT0gbnVsbCkgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcik7IHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4gc2F2ZU5vdyhcImF1dG9zYXZlXCIpLCAyODApOyB9O1xuICAgIHRoaXMuc2F2ZU9uQ2xvc2UgPSAoKSA9PiB7IHNhdmVOb3coXCJjb21taXRcIik7IH07XG5cbiAgICBbaWNvbklucHV0LCB0YXNrU2VsZWN0LCBzaGFwZVNlbGVjdCwgdGFnc0lucHV0LCBib3JkZXJXaWR0aElucHV0LCBmb250U2l6ZUlucHV0LCBib2xkSW5wdXQsIGl0YWxpY0lucHV0LCB1bmRlcmxpbmVJbnB1dCwgbm90ZUlucHV0LCBsaW5rSW5wdXRdXG4gICAgICAuZm9yRWFjaCgoaW5wdXQpID0+IHsgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHNjaGVkdWxlQXV0b1NhdmUpOyBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHNjaGVkdWxlQXV0b1NhdmUpOyB9KTtcblxuICAgIGNvbnN0IGJ1dHRvbnMgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZm9ybS1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgY2xvc2VCdXR0b24gPSBidXR0b25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1vZC1jdGFcIiwgdGV4dDogXCJcdTRGRERcdTVCNThcdTVFNzZcdTUxNzNcdTk1RURcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgY2xvc2VCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgaWYgKHNhdmVOb3coXCJjb21taXRcIiwgdHJ1ZSkpIHsgdGhpcy5jbG9zZVdpdGhvdXRGbHVzaCA9IHRydWU7IHRoaXMuY2xvc2UoKTsgfSB9KTtcblxuICAgIHRoaXMub3V0c2lkZVBvaW50ZXJIYW5kbGVyID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGlmICh0aGlzLm1vZGFsRWwuY29udGFpbnMoZXZlbnQudGFyZ2V0IGFzIE5vZGUpKSByZXR1cm47XG4gICAgICB0aGlzLnNhdmVPbkNsb3NlPy4oKTsgdGhpcy5jbG9zZVdpdGhvdXRGbHVzaCA9IHRydWU7IHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCB0aGlzLm91dHNpZGVQb2ludGVySGFuZGxlciEsIHRydWUpLCAwKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNsb3NlV2l0aG91dEZsdXNoKSB0aGlzLnNhdmVPbkNsb3NlPy4oKTtcbiAgICBpZiAodGhpcy5vdXRzaWRlUG9pbnRlckhhbmRsZXIpIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCB0aGlzLm91dHNpZGVQb2ludGVySGFuZGxlciwgdHJ1ZSk7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuXG5jbGFzcyBBcHBlYXJhbmNlTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3VibWl0OiAoYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UpID0+IHZvaWQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVzZXQ6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlLCBzdWJtaXQ6IChhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSkgPT4gdm9pZCwgcmVzZXQ6ICgpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuYXBwZWFyYW5jZSA9IGFwcGVhcmFuY2U7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gICAgdGhpcy5yZXNldCA9IHJlc2V0O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU1OTE2XHU4OUMyXCIpO1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwibW1jLWFwcGVhcmFuY2UtbW9kYWxcIik7XG4gICAgY29uc3QgZm9ybSA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiZm9ybVwiKTtcbiAgICBmb3JtLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIiwgdGV4dDogXCJcdTUxNDhcdTkwMDlcdTYyRTlcdTRFMDBcdTU5NTdcdTRFM0JcdTk4OThcdUZGMENcdTUxOERcdTYzMDlcdTk3MDBcdTg5ODFcdTRGRUVcdTY1MzlcdTgwQ0NcdTY2NkZcdTMwMDFcdTgyODJcdTcwQjlcdTMwMDFcdTVCNTdcdTRGNTNcdTU0OENcdThGREVcdTdFQkZcdTMwMDJcdThCQkVcdTdGNkVcdTUzRUFcdTRGRERcdTVCNThcdTUyMzBcdTVGNTNcdTUyNEQgLm1pbmRtYXAgXHU2NTg3XHU0RUY2XHUzMDAyXCIgfSk7XG5cbiAgICBsZXQgc2VsZWN0ZWRQcmVzZXQ6IE1pbmRNYXBUaGVtZVByZXNldElkID0gdGhpcy5hcHBlYXJhbmNlLnRoZW1lUHJlc2V0ID8/IFwiY2xhc3NpYy1pbmRpZ29cIjtcbiAgICBjb25zdCB0aGVtZVNlY3Rpb24gPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGhlbWUtcGlja2VyXCIgfSk7XG4gICAgdGhlbWVTZWN0aW9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGhlbWUtcGlja2VyLXRpdGxlXCIsIHRleHQ6IFwiXHU0RTNCXHU5ODk4XHU2QTIxXHU2NzdGXCIgfSk7XG4gICAgY29uc3QgdGhlbWVHcmlkID0gdGhlbWVTZWN0aW9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGhlbWUtY2FyZC1ncmlkXCIgfSk7XG4gICAgY29uc3QgdGhlbWVDYXJkcyA9IG5ldyBNYXA8TWluZE1hcFRoZW1lUHJlc2V0SWQsIEhUTUxCdXR0b25FbGVtZW50PigpO1xuXG4gICAgY29uc3QgZ3JpZCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1mb3JtLWdyaWQgbW1jLWFwcGVhcmFuY2UtZ3JpZFwiIH0pO1xuICAgIGNvbnN0IGFkZENvbG9yID0gKGxhYmVsVGV4dDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBmYWxsYmFjazogc3RyaW5nKTogeyB0b2dnbGU6IEhUTUxJbnB1dEVsZW1lbnQ7IGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IH0gPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBsYWJlbFRleHQgfSk7XG4gICAgICBjb25zdCByb3cgPSBsYWJlbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbG9yLXJvd1wiIH0pO1xuICAgICAgY29uc3QgdG9nZ2xlID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgICBjb25zdCBpbnB1dCA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjb2xvclwiIH0pO1xuICAgICAgdG9nZ2xlLmNoZWNrZWQgPSBCb29sZWFuKHZhbHVlKTtcbiAgICAgIGlucHV0LnZhbHVlID0gdmFsdWUgPz8gZmFsbGJhY2s7XG4gICAgICBpbnB1dC5kaXNhYmxlZCA9ICF0b2dnbGUuY2hlY2tlZDtcbiAgICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHsgaW5wdXQuZGlzYWJsZWQgPSAhdG9nZ2xlLmNoZWNrZWQ7IH0pO1xuICAgICAgcmV0dXJuIHsgdG9nZ2xlLCBpbnB1dCB9O1xuICAgIH07XG5cbiAgICBjb25zdCBiYWNrZ3JvdW5kID0gYWRkQ29sb3IoXCJcdTgwQ0NcdTY2NkZcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvciwgXCIjZjhmYWZjXCIpO1xuICAgIGNvbnN0IHBhdHRlcm5MYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XCIgfSk7XG4gICAgY29uc3QgcGF0dGVyblNlbGVjdCA9IHBhdHRlcm5MYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJub25lXCIsIFwiXHU2NUUwXCJdLCBbXCJncmlkXCIsIFwiXHU3RjUxXHU2ODNDXCJdLCBbXCJkb3RzXCIsIFwiXHU3MEI5XHU5NjM1XCJdXSBhcyBjb25zdCkgcGF0dGVyblNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA/PyBcImdyaWRcIjtcbiAgICBjb25zdCBwYXR0ZXJuQ29sb3IgPSBhZGRDb2xvcihcIlx1NTZGRVx1Njg0OFx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UucGF0dGVybkNvbG9yLCBcIiM5NGEzYjhcIik7XG5cbiAgICBjb25zdCBmb250TGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NUI1N1x1NEY1M1wiIH0pO1xuICAgIGNvbnN0IGZvbnRTZWxlY3QgPSBmb250TGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZm9yIChjb25zdCBbdmFsdWUsIGxhYmVsXSBvZiBbW1wib2JzaWRpYW5cIiwgXCJcdThEREZcdTk2OEYgT2JzaWRpYW5cIl0sIFtcInNhbnNcIiwgXCJcdTY1RTBcdTg4NkNcdTdFQkZcIl0sIFtcInNlcmlmXCIsIFwiXHU4ODZDXHU3RUJGXCJdLCBbXCJtb25vXCIsIFwiXHU3QjQ5XHU1QkJEXCJdLCBbXCJjdXN0b21cIiwgXCJcdTgxRUFcdTVCOUFcdTRFNDlcIl1dIGFzIGNvbnN0KSBmb250U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBmb250U2VsZWN0LnZhbHVlID0gdGhpcy5hcHBlYXJhbmNlLmZvbnRGYW1pbHkgPz8gXCJvYnNpZGlhblwiO1xuICAgIGNvbnN0IGN1c3RvbUZvbnRMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHU1QjU3XHU0RjUzXHU1NDBEXHU3OUYwXCIgfSk7XG4gICAgY29uc3QgY3VzdG9tRm9udElucHV0ID0gY3VzdG9tRm9udExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJNaWNyb3NvZnQgWWFIZWlcIiB9IH0pO1xuICAgIGN1c3RvbUZvbnRJbnB1dC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5jdXN0b21Gb250ID8/IFwiXCI7XG4gICAgY29uc3QgdXBkYXRlQ3VzdG9tRm9udCA9ICgpOiB2b2lkID0+IHsgY3VzdG9tRm9udElucHV0LmRpc2FibGVkID0gZm9udFNlbGVjdC52YWx1ZSAhPT0gXCJjdXN0b21cIjsgfTtcbiAgICBmb250U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlQ3VzdG9tRm9udCk7XG4gICAgdXBkYXRlQ3VzdG9tRm9udCgpO1xuXG4gICAgY29uc3QgZm9udFNpemVMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1QjU3XHU1M0Y3XHVGRjA4MTBcdTIwMTMzMFx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IGZvbnRTaXplSW5wdXQgPSBmb250U2l6ZUxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIxMFwiLCBtYXg6IFwiMzBcIiwgc3RlcDogXCIxXCIgfSB9KTtcbiAgICBmb250U2l6ZUlucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMuYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNCk7XG5cbiAgICBjb25zdCByb290Q29sb3IgPSBhZGRDb2xvcihcIlx1NEUyRFx1NUZDM1x1NEUzQlx1OTg5OFx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2Uucm9vdENvbG9yLCBcIiM0ZjQ2ZTVcIik7XG4gICAgY29uc3Qgcm9vdFRleHRDb2xvciA9IGFkZENvbG9yKFwiXHU0RTJEXHU1RkMzXHU0RTNCXHU5ODk4XHU2NTg3XHU1QjU3XCIsIHRoaXMuYXBwZWFyYW5jZS5yb290VGV4dENvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgY29uc3Qgbm9kZUNvbG9yID0gYWRkQ29sb3IoXCJcdTgyODJcdTcwQjlcdTgwQ0NcdTY2NkZcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLm5vZGVDb2xvciwgXCIjZmZmZmZmXCIpO1xuICAgIGNvbnN0IHRleHRDb2xvciA9IGFkZENvbG9yKFwiXHU2NTg3XHU1QjU3XHU5ODlDXHU4MjcyXCIsIHRoaXMuYXBwZWFyYW5jZS50ZXh0Q29sb3IsIFwiIzBmMTcyYVwiKTtcbiAgICBjb25zdCBib3JkZXJDb2xvciA9IGFkZENvbG9yKFwiXHU4MjgyXHU3MEI5XHU4RkI5XHU2ODQ2XHU5ODlDXHU4MjcyXCIsIHRoaXMuYXBwZWFyYW5jZS5ub2RlQm9yZGVyQ29sb3IsIFwiIzk0YTNiOFwiKTtcbiAgICBjb25zdCBib3JkZXJXaWR0aExhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdThGQjlcdTY4NDZcdTdDOTdcdTdFQzZcdUZGMDgwXHUyMDEzNlx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IGJvcmRlcldpZHRoSW5wdXQgPSBib3JkZXJXaWR0aExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIwXCIsIG1heDogXCI2XCIsIHN0ZXA6IFwiMC41XCIgfSB9KTtcbiAgICBib3JkZXJXaWR0aElucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMuYXBwZWFyYW5jZS5ub2RlQm9yZGVyV2lkdGggPz8gMSk7XG5cbiAgICBjb25zdCBlZGdlQ29sb3IgPSBhZGRDb2xvcihcIlx1OEZERVx1N0VCRlx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UuZWRnZUNvbG9yLCBcIiM3YzhhYTVcIik7XG4gICAgY29uc3QgZWRnZVN0eWxlTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEZERVx1N0VCRlx1N0M3Qlx1NTc4QlwiIH0pO1xuICAgIGNvbnN0IGVkZ2VTdHlsZVNlbGVjdCA9IGVkZ2VTdHlsZUxhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcImN1cnZlZFwiLCBcIlx1NjZGMlx1N0VCRlwiXSwgW1wic3RyYWlnaHRcIiwgXCJcdTc2RjRcdTdFQkZcIl0sIFtcImVsYm93XCIsIFwiXHU2Mjk4XHU3RUJGXCJdXSBhcyBjb25zdCkgZWRnZVN0eWxlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBlZGdlU3R5bGVTZWxlY3QudmFsdWUgPSB0aGlzLmFwcGVhcmFuY2UuZWRnZVN0eWxlID8/IFwiY3VydmVkXCI7XG5cbiAgICBjb25zdCBlZGdlV2lkdGhNb2RlTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEZERVx1N0VCRlx1N0M5N1x1N0VDNlx1NkEyMVx1NUYwRlwiIH0pO1xuICAgIGNvbnN0IGVkZ2VXaWR0aE1vZGVTZWxlY3QgPSBlZGdlV2lkdGhNb2RlTGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZWRnZVdpZHRoTW9kZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHU3RURGXHU0RTAwXHU3Qzk3XHU3RUM2XCIsIGF0dHI6IHsgdmFsdWU6IFwidW5pZm9ybVwiIH0gfSk7XG4gICAgZWRnZVdpZHRoTW9kZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHU0RUNFXHU3Qzk3XHU1MjMwXHU3RUM2XCIsIGF0dHI6IHsgdmFsdWU6IFwidGFwZXJlZFwiIH0gfSk7XG4gICAgZWRnZVdpZHRoTW9kZVNlbGVjdC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5lZGdlV2lkdGhNb2RlID8/IFwidGFwZXJlZFwiO1xuXG4gICAgY29uc3QgZWRnZVdpZHRoTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEQ3N1x1NTlDQlx1N0M5N1x1N0VDNlx1RkYwODAuNVx1MjAxMzhcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBlZGdlV2lkdGhJbnB1dCA9IGVkZ2VXaWR0aExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIwLjVcIiwgbWF4OiBcIjhcIiwgc3RlcDogXCIwLjI1XCIgfSB9KTtcbiAgICBlZGdlV2lkdGhJbnB1dC52YWx1ZSA9IFN0cmluZyh0aGlzLmFwcGVhcmFuY2UuZWRnZVdpZHRoID8/IDQuMik7XG4gICAgY29uc3QgZWRnZU1pbldpZHRoTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NjcyQlx1N0FFRlx1NjcwMFx1N0VDNlx1RkYwODAuMjVcdTIwMTM0XHVGRjA5XCIgfSk7XG4gICAgY29uc3QgZWRnZU1pbldpZHRoSW5wdXQgPSBlZGdlTWluV2lkdGhMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgYXR0cjogeyBtaW46IFwiMC4yNVwiLCBtYXg6IFwiNFwiLCBzdGVwOiBcIjAuMjVcIiB9IH0pO1xuICAgIGVkZ2VNaW5XaWR0aElucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMuYXBwZWFyYW5jZS5lZGdlTWluV2lkdGggPz8gMS4yKTtcbiAgICBjb25zdCB1cGRhdGVFZGdlTWluID0gKCk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgdGFwZXJlZCA9IGVkZ2VXaWR0aE1vZGVTZWxlY3QudmFsdWUgPT09IFwidGFwZXJlZFwiO1xuICAgICAgZWRnZU1pbldpZHRoSW5wdXQuZGlzYWJsZWQgPSAhdGFwZXJlZDtcbiAgICAgIGVkZ2VNaW5XaWR0aExhYmVsLnRvZ2dsZUNsYXNzKFwiaXMtZGlzYWJsZWRcIiwgIXRhcGVyZWQpO1xuICAgICAgZWRnZVdpZHRoTGFiZWwuY2hpbGROb2Rlc1swXSEudGV4dENvbnRlbnQgPSB0YXBlcmVkID8gXCJcdThENzdcdTU5Q0JcdTdDOTdcdTdFQzZcdUZGMDgwLjVcdTIwMTM4XHVGRjA5XCIgOiBcIlx1OEZERVx1N0VCRlx1N0M5N1x1N0VDNlx1RkYwODAuNVx1MjAxMzhcdUZGMDlcIjtcbiAgICB9O1xuICAgIGVkZ2VXaWR0aE1vZGVTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVFZGdlTWluKTtcbiAgICB1cGRhdGVFZGdlTWluKCk7XG5cbiAgICBjb25zdCBicmFuY2hMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1RjY5XHU4MjcyXHU1MjA2XHU2NTJGXCIgfSk7XG4gICAgY29uc3QgYnJhbmNoVG9nZ2xlUm93ID0gYnJhbmNoTGFiZWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10b2dnbGUtcm93XCIgfSk7XG4gICAgY29uc3QgY29sb3JmdWxCcmFuY2hlcyA9IGJyYW5jaFRvZ2dsZVJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiIH0pO1xuICAgIGNvbG9yZnVsQnJhbmNoZXMuY2hlY2tlZCA9IHRoaXMuYXBwZWFyYW5jZS5jb2xvcmZ1bEJyYW5jaGVzID09PSB0cnVlO1xuICAgIGJyYW5jaFRvZ2dsZVJvdy5jcmVhdGVTcGFuKHsgdGV4dDogXCJcdTYzMDlcdTRFMDBcdTdFQTdcdTUyMDZcdTY1MkZcdTVGQUFcdTczQUZcdTkxNERcdTgyNzJcIiB9KTtcbiAgICBjb25zdCBicmFuY2hDb2xvcnNMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1MjA2XHU2NTJGXHU5ODlDXHU4MjcyXHVGRjA4XHU5MDE3XHU1M0Y3XHU1MjA2XHU5Njk0XHVGRjA5XCIgfSk7XG4gICAgY29uc3QgYnJhbmNoQ29sb3JzSW5wdXQgPSBicmFuY2hDb2xvcnNMYWJlbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHsgYXR0cjogeyByb3dzOiBcIjJcIiwgcGxhY2Vob2xkZXI6IFwiIzRmNDZlNSwgIzAyODRjNywgIzBmNzY2ZVwiIH0gfSk7XG4gICAgYnJhbmNoQ29sb3JzSW5wdXQudmFsdWUgPSAodGhpcy5hcHBlYXJhbmNlLmJyYW5jaENvbG9ycyA/PyBbXSkuam9pbihcIiwgXCIpO1xuXG4gICAgY29uc3QgdGV4dFN0eWxlU2VjdGlvbiA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1hcHBlYXJhbmNlLXRleHQtc3R5bGVcIiB9KTtcbiAgICB0ZXh0U3R5bGVTZWN0aW9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtYXBwZWFyYW5jZS10ZXh0LXN0eWxlLXRpdGxlXCIsIHRleHQ6IFwiXHU2NTg3XHU1QjU3XHU2ODM3XHU1RjBGXCIgfSk7XG4gICAgY29uc3QgdGV4dFN0eWxlID0gdGV4dFN0eWxlU2VjdGlvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWFwcGVhcmFuY2Utc3R5bGUtb3B0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGFkZENoZWNrID0gKHRleHQ6IHN0cmluZywgY2hlY2tlZDogYm9vbGVhbik6IEhUTUxJbnB1dEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSB0ZXh0U3R5bGUuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IGNsczogXCJtbWMtYXBwZWFyYW5jZS1zdHlsZS1vcHRpb25cIiB9KTtcbiAgICAgIGNvbnN0IGlucHV0ID0gbGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcbiAgICAgIGlucHV0LmNoZWNrZWQgPSBjaGVja2VkO1xuICAgICAgbGFiZWwuY3JlYXRlU3Bhbih7IHRleHQgfSk7XG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcbiAgICBjb25zdCBib2xkID0gYWRkQ2hlY2soXCJcdTY1ODdcdTVCNTdcdTUyQTBcdTdDOTdcIiwgdGhpcy5hcHBlYXJhbmNlLmJvbGQgPT09IHRydWUpO1xuICAgIGNvbnN0IGl0YWxpYyA9IGFkZENoZWNrKFwiXHU2NTg3XHU1QjU3XHU2NTlDXHU0RjUzXCIsIHRoaXMuYXBwZWFyYW5jZS5pdGFsaWMgPT09IHRydWUpO1xuICAgIGNvbnN0IHVuZGVybGluZSA9IGFkZENoZWNrKFwiXHU2NTg3XHU1QjU3XHU0RTBCXHU1MjEyXHU3RUJGXCIsIHRoaXMuYXBwZWFyYW5jZS51bmRlcmxpbmUgPT09IHRydWUpO1xuXG4gICAgY29uc3Qgc2V0Q29sb3IgPSAoY29udHJvbDogeyB0b2dnbGU6IEhUTUxJbnB1dEVsZW1lbnQ7IGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IH0sIHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQsIGZhbGxiYWNrOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIGNvbnRyb2wudG9nZ2xlLmNoZWNrZWQgPSBCb29sZWFuKHZhbHVlKTtcbiAgICAgIGNvbnRyb2wuaW5wdXQudmFsdWUgPSB2YWx1ZSA/PyBmYWxsYmFjaztcbiAgICAgIGNvbnRyb2wuaW5wdXQuZGlzYWJsZWQgPSAhY29udHJvbC50b2dnbGUuY2hlY2tlZDtcbiAgICB9O1xuICAgIGNvbnN0IHVwZGF0ZVNlbGVjdGVkQ2FyZHMgPSAoKTogdm9pZCA9PiB7XG4gICAgICBmb3IgKGNvbnN0IFtpZCwgY2FyZF0gb2YgdGhlbWVDYXJkcykgY2FyZC50b2dnbGVDbGFzcyhcImlzLXNlbGVjdGVkXCIsIGlkID09PSBzZWxlY3RlZFByZXNldCk7XG4gICAgfTtcbiAgICBjb25zdCBhcHBseVByZXNldCA9IChwcmVzZXRJZDogTWluZE1hcFRoZW1lUHJlc2V0SWQpOiB2b2lkID0+IHtcbiAgICAgIHNlbGVjdGVkUHJlc2V0ID0gcHJlc2V0SWQ7XG4gICAgICBjb25zdCBhcHBlYXJhbmNlID0gYXBwZWFyYW5jZUZyb21UaGVtZVByZXNldChwcmVzZXRJZCk7XG4gICAgICBzZXRDb2xvcihiYWNrZ3JvdW5kLCBhcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvciwgXCIjZjhmYWZjXCIpO1xuICAgICAgcGF0dGVyblNlbGVjdC52YWx1ZSA9IGFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gPz8gXCJub25lXCI7XG4gICAgICBzZXRDb2xvcihwYXR0ZXJuQ29sb3IsIGFwcGVhcmFuY2UucGF0dGVybkNvbG9yLCBcIiM5NGEzYjhcIik7XG4gICAgICBmb250U2VsZWN0LnZhbHVlID0gYXBwZWFyYW5jZS5mb250RmFtaWx5ID8/IFwib2JzaWRpYW5cIjtcbiAgICAgIGN1c3RvbUZvbnRJbnB1dC52YWx1ZSA9IGFwcGVhcmFuY2UuY3VzdG9tRm9udCA/PyBcIlwiO1xuICAgICAgZm9udFNpemVJbnB1dC52YWx1ZSA9IFN0cmluZyhhcHBlYXJhbmNlLmZvbnRTaXplID8/IDE0KTtcbiAgICAgIHNldENvbG9yKHJvb3RDb2xvciwgYXBwZWFyYW5jZS5yb290Q29sb3IsIFwiIzRmNDZlNVwiKTtcbiAgICAgIHNldENvbG9yKHJvb3RUZXh0Q29sb3IsIGFwcGVhcmFuY2Uucm9vdFRleHRDb2xvciwgXCIjZmZmZmZmXCIpO1xuICAgICAgc2V0Q29sb3Iobm9kZUNvbG9yLCBhcHBlYXJhbmNlLm5vZGVDb2xvciwgXCIjZmZmZmZmXCIpO1xuICAgICAgc2V0Q29sb3IodGV4dENvbG9yLCBhcHBlYXJhbmNlLnRleHRDb2xvciwgXCIjMGYxNzJhXCIpO1xuICAgICAgc2V0Q29sb3IoYm9yZGVyQ29sb3IsIGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yLCBcIiM5NGEzYjhcIik7XG4gICAgICBib3JkZXJXaWR0aElucHV0LnZhbHVlID0gU3RyaW5nKGFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IDEpO1xuICAgICAgc2V0Q29sb3IoZWRnZUNvbG9yLCBhcHBlYXJhbmNlLmVkZ2VDb2xvciwgXCIjN2M4YWE1XCIpO1xuICAgICAgZWRnZVN0eWxlU2VsZWN0LnZhbHVlID0gYXBwZWFyYW5jZS5lZGdlU3R5bGUgPz8gXCJjdXJ2ZWRcIjtcbiAgICAgIGVkZ2VXaWR0aE1vZGVTZWxlY3QudmFsdWUgPSBhcHBlYXJhbmNlLmVkZ2VXaWR0aE1vZGUgPz8gXCJ1bmlmb3JtXCI7XG4gICAgICBlZGdlV2lkdGhJbnB1dC52YWx1ZSA9IFN0cmluZyhhcHBlYXJhbmNlLmVkZ2VXaWR0aCA/PyAyLjIpO1xuICAgICAgZWRnZU1pbldpZHRoSW5wdXQudmFsdWUgPSBTdHJpbmcoYXBwZWFyYW5jZS5lZGdlTWluV2lkdGggPz8gMSk7XG4gICAgICBjb2xvcmZ1bEJyYW5jaGVzLmNoZWNrZWQgPSBhcHBlYXJhbmNlLmNvbG9yZnVsQnJhbmNoZXMgPT09IHRydWU7XG4gICAgICBicmFuY2hDb2xvcnNJbnB1dC52YWx1ZSA9IChhcHBlYXJhbmNlLmJyYW5jaENvbG9ycyA/PyBbXSkuam9pbihcIiwgXCIpO1xuICAgICAgYm9sZC5jaGVja2VkID0gYXBwZWFyYW5jZS5ib2xkID09PSB0cnVlO1xuICAgICAgaXRhbGljLmNoZWNrZWQgPSBhcHBlYXJhbmNlLml0YWxpYyA9PT0gdHJ1ZTtcbiAgICAgIHVuZGVybGluZS5jaGVja2VkID0gYXBwZWFyYW5jZS51bmRlcmxpbmUgPT09IHRydWU7XG4gICAgICB1cGRhdGVDdXN0b21Gb250KCk7XG4gICAgICB1cGRhdGVFZGdlTWluKCk7XG4gICAgICB1cGRhdGVTZWxlY3RlZENhcmRzKCk7XG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgcHJlc2V0IG9mIE1JTkRNQVBfVEhFTUVfUFJFU0VUUykge1xuICAgICAgY29uc3QgY2FyZCA9IHRoZW1lR3JpZC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbWMtdGhlbWUtY2FyZFwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIsIHRpdGxlOiBwcmVzZXQuZGVzY3JpcHRpb24gfSB9KTtcbiAgICAgIHRoZW1lQ2FyZHMuc2V0KHByZXNldC5pZCwgY2FyZCk7XG4gICAgICBjb25zdCBwcmV2aWV3ID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXRoZW1lLWNhcmQtcHJldmlld1wiIH0pO1xuICAgICAgcHJldmlldy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBwcmVzZXQuYXBwZWFyYW5jZS5iYWNrZ3JvdW5kQ29sb3IgPz8gXCIjZmZmZmZmXCI7XG4gICAgICBjb25zdCByb290ID0gcHJldmlldy5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy10aGVtZS1jYXJkLXJvb3RcIiB9KTtcbiAgICAgIHJvb3Quc3R5bGUuYmFja2dyb3VuZENvbG9yID0gcHJlc2V0LmFwcGVhcmFuY2Uucm9vdENvbG9yID8/IFwiIzRmNDZlNVwiO1xuICAgICAgY29uc3QgYnJhbmNoZXMgPSBwcmV2aWV3LmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGhlbWUtY2FyZC1icmFuY2hlc1wiIH0pO1xuICAgICAgKHByZXNldC5hcHBlYXJhbmNlLmJyYW5jaENvbG9ycyA/PyBbcHJlc2V0LmFwcGVhcmFuY2UuZWRnZUNvbG9yID8/IFwiIzdjOGFhNVwiXSkuc2xpY2UoMCwgNCkuZm9yRWFjaCgoY29sb3IsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGxpbmUgPSBicmFuY2hlcy5jcmVhdGVTcGFuKCk7XG4gICAgICAgIGxpbmUuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3I7XG4gICAgICAgIGxpbmUuc3R5bGUud2lkdGggPSBgJHsyOCAtIGluZGV4ICogNH1weGA7XG4gICAgICAgIGxpbmUuc3R5bGUuaGVpZ2h0ID0gYCR7TWF0aC5tYXgoMiwgNSAtIGluZGV4KX1weGA7XG4gICAgICB9KTtcbiAgICAgIGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10aGVtZS1jYXJkLW5hbWVcIiwgdGV4dDogcHJlc2V0Lm5hbWUgfSk7XG4gICAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBhcHBseVByZXNldChwcmVzZXQuaWQpKTtcbiAgICB9XG4gICAgdXBkYXRlU2VsZWN0ZWRDYXJkcygpO1xuXG4gICAgY29uc3QgY2xhbXAgPSAodmFsdWU6IHN0cmluZywgbWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBmYWxsYmFjazogbnVtYmVyKTogbnVtYmVyID0+IHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlcih2YWx1ZSk7XG4gICAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgPyBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgcGFyc2VkKSkgOiBmYWxsYmFjaztcbiAgICB9O1xuICAgIGNvbnN0IHBhcnNlQnJhbmNoQ29sb3JzID0gKCk6IHN0cmluZ1tdID0+IGJyYW5jaENvbG9yc0lucHV0LnZhbHVlXG4gICAgICAuc3BsaXQoL1ssXHVGRjBDXFxzXSsvKVxuICAgICAgLm1hcCgodmFsdWUpID0+IHZhbHVlLnRyaW0oKSlcbiAgICAgIC5maWx0ZXIoKHZhbHVlKSA9PiAvXiNbMC05YS1mXXs2fSQvaS50ZXN0KHZhbHVlKSlcbiAgICAgIC5zbGljZSgwLCAxMik7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCByZXNldCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NjA2Mlx1NTkwRFx1NTE2OFx1NUM0MFx1OUVEOFx1OEJBNFwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IGNhbmNlbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTNENlx1NkQ4OFwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgIGNvbnN0IHNhdmUgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTVFOTRcdTc1MjhcIiwgdHlwZTogXCJzdWJtaXRcIiwgY2xzOiBcIm1vZC1jdGFcIiB9KTtcbiAgICByZXNldC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnJlc2V0KCk7IHRoaXMuY2xvc2UoKTsgfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBtYXhXaWR0aCA9IGNsYW1wKGVkZ2VXaWR0aElucHV0LnZhbHVlLCAwLjUsIDgsIDQuMik7XG4gICAgICB0aGlzLnN1Ym1pdCh7XG4gICAgICAgIHRoZW1lUHJlc2V0OiBzZWxlY3RlZFByZXNldCxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBiYWNrZ3JvdW5kLnRvZ2dsZS5jaGVja2VkID8gYmFja2dyb3VuZC5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgYmFja2dyb3VuZFBhdHRlcm46IHBhdHRlcm5TZWxlY3QudmFsdWUgYXMgQmFja2dyb3VuZFBhdHRlcm4sXG4gICAgICAgIHBhdHRlcm5Db2xvcjogcGF0dGVybkNvbG9yLnRvZ2dsZS5jaGVja2VkID8gcGF0dGVybkNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBmb250RmFtaWx5OiBmb250U2VsZWN0LnZhbHVlIGFzIEZvbnRGYW1pbHlNb2RlLFxuICAgICAgICBjdXN0b21Gb250OiBmb250U2VsZWN0LnZhbHVlID09PSBcImN1c3RvbVwiID8gY3VzdG9tRm9udElucHV0LnZhbHVlLnRyaW0oKS5zbGljZSgwLCAxMjApIHx8IHVuZGVmaW5lZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgZm9udFNpemU6IGNsYW1wKGZvbnRTaXplSW5wdXQudmFsdWUsIDEwLCAzMCwgMTQpLFxuICAgICAgICByb290Q29sb3I6IHJvb3RDb2xvci50b2dnbGUuY2hlY2tlZCA/IHJvb3RDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgcm9vdFRleHRDb2xvcjogcm9vdFRleHRDb2xvci50b2dnbGUuY2hlY2tlZCA/IHJvb3RUZXh0Q29sb3IuaW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIG5vZGVDb2xvcjogbm9kZUNvbG9yLnRvZ2dsZS5jaGVja2VkID8gbm9kZUNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICB0ZXh0Q29sb3I6IHRleHRDb2xvci50b2dnbGUuY2hlY2tlZCA/IHRleHRDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZUJvcmRlckNvbG9yOiBib3JkZXJDb2xvci50b2dnbGUuY2hlY2tlZCA/IGJvcmRlckNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBub2RlQm9yZGVyV2lkdGg6IGNsYW1wKGJvcmRlcldpZHRoSW5wdXQudmFsdWUsIDAsIDYsIDEpLFxuICAgICAgICBlZGdlQ29sb3I6IGVkZ2VDb2xvci50b2dnbGUuY2hlY2tlZCA/IGVkZ2VDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZWRnZVdpZHRoOiBtYXhXaWR0aCxcbiAgICAgICAgZWRnZVN0eWxlOiBlZGdlU3R5bGVTZWxlY3QudmFsdWUgYXMgRWRnZVN0eWxlLFxuICAgICAgICBlZGdlV2lkdGhNb2RlOiBlZGdlV2lkdGhNb2RlU2VsZWN0LnZhbHVlIGFzIEVkZ2VXaWR0aE1vZGUsXG4gICAgICAgIGVkZ2VNaW5XaWR0aDogTWF0aC5taW4obWF4V2lkdGgsIGNsYW1wKGVkZ2VNaW5XaWR0aElucHV0LnZhbHVlLCAwLjI1LCA0LCAxLjIpKSxcbiAgICAgICAgY29sb3JmdWxCcmFuY2hlczogY29sb3JmdWxCcmFuY2hlcy5jaGVja2VkLFxuICAgICAgICBicmFuY2hDb2xvcnM6IHBhcnNlQnJhbmNoQ29sb3JzKCksXG4gICAgICAgIGJvbGQ6IGJvbGQuY2hlY2tlZCxcbiAgICAgICAgaXRhbGljOiBpdGFsaWMuY2hlY2tlZCxcbiAgICAgICAgdW5kZXJsaW5lOiB1bmRlcmxpbmUuY2hlY2tlZFxuICAgICAgfSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gc2F2ZS5mb2N1cygpLCAyMCk7XG4gIH1cbn1cblxuY2xhc3MgT3V0bGluZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IG1hcmtkb3duOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgb25FeHBvcnQ6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG1hcmtkb3duOiBzdHJpbmcsIG9uRXhwb3J0OiAoKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLm1hcmtkb3duID0gbWFya2Rvd247XG4gICAgdGhpcy5vbkV4cG9ydCA9IG9uRXhwb3J0O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiTWFya2Rvd24gXHU1OTI3XHU3RUIyXCIpO1xuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7IGNsczogXCJtbWMtb3V0bGluZS10ZXh0YXJlYVwiIH0pO1xuICAgIHRleHRhcmVhLnZhbHVlID0gdGhpcy5tYXJrZG93bjtcbiAgICB0ZXh0YXJlYS5yZWFkT25seSA9IHRydWU7XG4gICAgY29uc3QgYWN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbW9kYWwtYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGNvcHkgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTU5MERcdTUyMzZcIiB9KTtcbiAgICBjb25zdCBleHBvcnRCdXR0b24gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTVCRkNcdTUxRkFcdTRFM0EgLm1kXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY29weS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0aGlzLm1hcmtkb3duKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVERjJcdTU5MERcdTUyMzYgTWFya2Rvd24gXHU1OTI3XHU3RUIyXCIpO1xuICAgIH0pO1xuICAgIGV4cG9ydEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5vbkV4cG9ydCgpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG59XG5cbmNsYXNzIFNlYXJjaE5vZGVzTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbm9kZXM6IE1pbmRNYXBOb2RlW107XG4gIHByaXZhdGUgcmVhZG9ubHkgb25RdWVyeTogKHF1ZXJ5OiBzdHJpbmcpID0+IHZvaWQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgb25TZWxlY3Q6IChub2RlOiBNaW5kTWFwTm9kZSkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgbm9kZXM6IE1pbmRNYXBOb2RlW10sIG9uUXVlcnk6IChxdWVyeTogc3RyaW5nKSA9PiB2b2lkLCBvblNlbGVjdDogKG5vZGU6IE1pbmRNYXBOb2RlKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgdGhpcy5vblF1ZXJ5ID0gb25RdWVyeTtcbiAgICB0aGlzLm9uU2VsZWN0ID0gb25TZWxlY3Q7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTY0MUNcdTdEMjJcdTgyODJcdTcwQjlcIik7XG4gICAgdGhpcy5tb2RhbEVsLmFkZENsYXNzKFwibW1jLXNlYXJjaC1tb2RhbFwiKTtcbiAgICBjb25zdCBpbnB1dCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInNlYXJjaFwiLCBjbHM6IFwibW1jLXNlYXJjaC1pbnB1dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIlx1NjQxQ1x1N0QyMlx1NjU4N1x1NUI1N1x1MzAwMVx1NTkwN1x1NkNFOFx1MzAwMVx1NjgwN1x1N0I3RVx1NjIxNlx1OTRGRVx1NjNBNVx1MjAyNlwiIH0gfSk7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXNlYXJjaC1jb3VudFwiIH0pO1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXNlYXJjaC1yZXN1bHRzXCIgfSk7XG5cbiAgICBjb25zdCByZW5kZXJSZXN1bHRzID0gKCk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSBpbnB1dC52YWx1ZS50cmltKCkudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgIHRoaXMub25RdWVyeShxdWVyeSk7XG4gICAgICByZXN1bHRzLmVtcHR5KCk7XG4gICAgICBjb25zdCBtYXRjaGVzID0gcXVlcnlcbiAgICAgICAgPyB0aGlzLm5vZGVzLmZpbHRlcigobm9kZSkgPT4gbm9kZVNlYXJjaFRleHQobm9kZSkuaW5jbHVkZXMocXVlcnkpKS5zbGljZSgwLCA4MClcbiAgICAgICAgOiB0aGlzLm5vZGVzLnNsaWNlKDAsIDQwKTtcbiAgICAgIGNvdW50LnNldFRleHQocXVlcnkgPyBgXHU2MjdFXHU1MjMwICR7bWF0Y2hlcy5sZW5ndGh9IFx1NEUyQVx1ODI4Mlx1NzBCOWAgOiBgXHU1MTcxICR7dGhpcy5ub2Rlcy5sZW5ndGh9IFx1NEUyQVx1ODI4Mlx1NzBCOWApO1xuICAgICAgZm9yIChjb25zdCBub2RlIG9mIG1hdGNoZXMpIHtcbiAgICAgICAgY29uc3QgYnV0dG9uID0gcmVzdWx0cy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbWMtc2VhcmNoLXJlc3VsdFwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuICAgICAgICBjb25zdCB0aXRsZSA9IGJ1dHRvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXNlYXJjaC1yZXN1bHQtdGl0bGVcIiB9KTtcbiAgICAgICAgaWYgKG5vZGUuaWNvbikgdGl0bGUuY3JlYXRlU3Bhbih7IHRleHQ6IGAke25vZGUuaWNvbn0gYCB9KTtcbiAgICAgICAgdGl0bGUuY3JlYXRlU3Bhbih7IHRleHQ6IG5vZGVQbGFpblRleHQobm9kZSkgfHwgXCJcdTU2RkVcdTcyNDdcdTgyODJcdTcwQjlcIiB9KTtcbiAgICAgICAgY29uc3QgZGV0YWlscyA9IFtub2RlLnRhc2sgPyAoeyB0b2RvOiBcIlx1NUY4NVx1NTI5RVwiLCBkb2luZzogXCJcdThGREJcdTg4NENcdTRFMkRcIiwgZG9uZTogXCJcdTVERjJcdTVCOENcdTYyMTBcIiB9IGFzIGNvbnN0KVtub2RlLnRhc2tdIDogXCJcIiwgLi4uKG5vZGUudGFncyA/PyBbXSkubWFwKCh0YWcpID0+IGAjJHt0YWd9YCldXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgIC5qb2luKFwiIFx1MDBCNyBcIik7XG4gICAgICAgIGlmIChkZXRhaWxzKSBidXR0b24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zZWFyY2gtcmVzdWx0LW1ldGFcIiwgdGV4dDogZGV0YWlscyB9KTtcbiAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5vblNlbGVjdChub2RlKTtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKCFtYXRjaGVzLmxlbmd0aCkgcmVzdWx0cy5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWVtcHR5LXN0YXRlXCIsIHRleHQ6IFwiXHU2Q0ExXHU2NzA5XHU1MzM5XHU5MTREXHU3Njg0XHU4MjgyXHU3MEI5XCIgfSk7XG4gICAgfTtcblxuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCByZW5kZXJSZXN1bHRzKTtcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICBjb25zdCBmaXJzdCA9IHJlc3VsdHMucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXCIubW1jLXNlYXJjaC1yZXN1bHRcIik7XG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZmlyc3QuY2xpY2soKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJlbmRlclJlc3VsdHMoKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBpbnB1dC5mb2N1cygpLCAyMCk7XG4gIH1cbn1cblxuY2xhc3MgSnNvblRyYW5zZmVyTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudDtcbiAgcHJpdmF0ZSByZWFkb25seSBvbkltcG9ydDogKGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQpID0+IHZvaWQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgb25FeHBvcnQ6IChqc29uOiBzdHJpbmcpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQsIG9uSW1wb3J0OiAoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCkgPT4gdm9pZCwgb25FeHBvcnQ6IChqc29uOiBzdHJpbmcpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICB0aGlzLm9uSW1wb3J0ID0gb25JbXBvcnQ7XG4gICAgdGhpcy5vbkV4cG9ydCA9IG9uRXhwb3J0O1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiSlNPTiBcdTVCRkNcdTUxNjUgLyBcdTVCRkNcdTUxRkFcIik7XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIlx1NTNFRlx1NEVFNVx1NTkwRFx1NTIzNlx1NUY1M1x1NTI0RCBKU09OXHVGRjBDXHU0RTVGXHU1M0VGXHU0RUU1XHU3Qzk4XHU4RDM0XHU1MTc2XHU0RUQ2IE1pbmRNYXAgU3R1ZGlvIFx1NjU4N1x1Njg2MyBKU09OIFx1NTQwRVx1NUJGQ1x1NTE2NVx1MzAwMlwiIH0pO1xuICAgIGRlc2NyaXB0aW9uLmFkZENsYXNzKFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIpO1xuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7IGNsczogXCJtbWMtanNvbi10ZXh0YXJlYVwiIH0pO1xuICAgIHRleHRhcmVhLnZhbHVlID0gSlNPTi5zdHJpbmdpZnkodGhpcy5kb2N1bWVudCwgbnVsbCwgMik7XG4gICAgY29uc3QgYWN0aW9ucyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbW9kYWwtYWN0aW9ucyBtbWMtanNvbi1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgY29weSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTkwRFx1NTIzNiBKU09OXCIgfSk7XG4gICAgY29uc3QgZXhwb3J0QnV0dG9uID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1QkZDXHU1MUZBIC5qc29uXCIgfSk7XG4gICAgY29uc3QgaW1wb3J0QnV0dG9uID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1QkZDXHU1MTY1XHU1RTc2XHU2NkZGXHU2MzYyXCIsIGNsczogXCJtb2Qtd2FybmluZ1wiIH0pO1xuICAgIGNvcHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGV4dGFyZWEudmFsdWUpO1xuICAgICAgbmV3IE5vdGljZShcIlx1NURGMlx1NTkwRFx1NTIzNiBKU09OXCIpO1xuICAgIH0pO1xuICAgIGV4cG9ydEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5vbkV4cG9ydCh0ZXh0YXJlYS52YWx1ZSkpO1xuICAgIGltcG9ydEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZSh0ZXh0YXJlYS52YWx1ZSkgYXMgUGFydGlhbDxNaW5kTWFwRG9jdW1lbnQ+O1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplRG9jdW1lbnQocGFyc2VkLCB0aGlzLmRvY3VtZW50LnRpdGxlKTtcbiAgICAgICAgdGhpcy5vbkltcG9ydChub3JtYWxpemVkKTtcbiAgICAgICAgbmV3IE5vdGljZShcIkpTT04gXHU1REYyXHU1QkZDXHU1MTY1XCIpO1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gSlNPTiBpbXBvcnQgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgICAgbmV3IE5vdGljZShcIkpTT04gXHU2ODNDXHU1RjBGXHU2NUUwXHU2NTQ4XHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU1NDBFXHU5MUNEXHU4QkQ1XCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNaW5kTWFwRWRpdG9yIHtcbiAgcHJpdmF0ZSByZWFkb25seSBhcHA6IEFwcDtcbiAgcHJpdmF0ZSByZWFkb25seSBob3N0OiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSByZWFkb25seSBjYWxsYmFja3M6IE1pbmRNYXBFZGl0b3JDYWxsYmFja3M7XG4gIHByaXZhdGUgb3B0aW9uczogTWluZE1hcEVkaXRvck9wdGlvbnM7XG4gIHByaXZhdGUgcm9vdEVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgdG9vbGJhckVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgbmF2aWdhdGlvbkJhckVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgdmlld3BvcnRFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHNjZW5lRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBub2Rlc0xheWVyRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBlZGdlc1N2ZyE6IFNWR1NWR0VsZW1lbnQ7XG4gIHByaXZhdGUgc3RhdHVzRWwhOiBIVE1MU3BhbkVsZW1lbnQ7XG4gIHByaXZhdGUgem9vbVN0YXR1c0VsITogSFRNTFNwYW5FbGVtZW50O1xuICBwcml2YXRlIGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQ7XG4gIHByaXZhdGUgbGF5b3V0OiBMYXlvdXRSZXN1bHQ7XG4gIHByaXZhdGUgc2VsZWN0ZWRJZDogc3RyaW5nO1xuICBwcml2YXRlIHpvb20gPSAxO1xuICBwcml2YXRlIHBhblggPSAwO1xuICBwcml2YXRlIHBhblkgPSAwO1xuICBwcml2YXRlIGhpc3Rvcnk6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgZnV0dXJlOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGRyYWdnaW5nSWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHBhbm5pbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBwYW5TdGFydCA9IHsgeDogMCwgeTogMCwgcGFuWDogMCwgcGFuWTogMCB9O1xuICBwcml2YXRlIGNsZWFudXBDYWxsYmFja3M6IEFycmF5PCgpID0+IHZvaWQ+ID0gW107XG4gIHByaXZhdGUgcmVzaXplT2JzZXJ2ZXI6IFJlc2l6ZU9ic2VydmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYnJhbmNoQ2xpcGJvYXJkOiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHNlYXJjaFF1ZXJ5ID0gXCJcIjtcbiAgcHJpdmF0ZSByZWFkb25seSBpbWFnZUxvYWRUaW1lcnMgPSBuZXcgU2V0PG51bWJlcj4oKTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgaG9zdDogSFRNTEVsZW1lbnQsIGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQsIGNhbGxiYWNrczogTWluZE1hcEVkaXRvckNhbGxiYWNrcywgb3B0aW9uczogTWluZE1hcEVkaXRvck9wdGlvbnMpIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmhvc3QgPSBob3N0O1xuICAgIHRoaXMuY2FsbGJhY2tzID0gY2FsbGJhY2tzO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5kb2N1bWVudCA9IGNsb25lRG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgIHRoaXMuc2VsZWN0ZWRJZCA9IHRoaXMuZG9jdW1lbnQucm9vdC5pZDtcbiAgICB0aGlzLmxheW91dCA9IGNvbXB1dGVMYXlvdXQodGhpcy5kb2N1bWVudC5yb290LCB0aGlzLmRvY3VtZW50LmxheW91dCwgdGhpcy5nZXRBcHBlYXJhbmNlKCkuZm9udFNpemUgPz8gMTQpO1xuICAgIHRoaXMuYnVpbGRVaSgpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvRml0T25PcGVuKSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLmZpdFRvVmlldygpLCA1MCk7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJJbWFnZUxvYWRUaW1lcnMoKTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2spID0+IGNhbGxiYWNrKCkpO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcyA9IFtdO1xuICAgIHRoaXMucmVzaXplT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICB0aGlzLnJlc2l6ZU9ic2VydmVyID0gbnVsbDtcbiAgICB0aGlzLmhvc3QuZW1wdHkoKTtcbiAgfVxuXG4gIHNldERvY3VtZW50KGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQsIHJlc2V0SGlzdG9yeSA9IHRydWUpOiB2b2lkIHtcbiAgICB0aGlzLmRvY3VtZW50ID0gY2xvbmVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIGlmIChyZXNldEhpc3RvcnkpIHtcbiAgICAgIHRoaXMuaGlzdG9yeSA9IFtdO1xuICAgICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9GaXRPbk9wZW4pIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDIwKTtcbiAgfVxuXG4gIHNldE9wdGlvbnMob3B0aW9uczogTWluZE1hcEVkaXRvck9wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBnZXREb2N1bWVudCgpOiBNaW5kTWFwRG9jdW1lbnQge1xuICAgIHJldHVybiBjbG9uZURvY3VtZW50KHRoaXMuZG9jdW1lbnQpO1xuICB9XG5cbiAgbWFya1NhdmVkKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdHVzRWwuc2V0VGV4dChcIlx1NURGMlx1NEZERFx1NUI1OFwiKTtcbiAgICB0aGlzLnJvb3RFbC5yZW1vdmVDbGFzcyhcImlzLWRpcnR5XCIpO1xuICB9XG5cbiAgbWFya1NhdmluZygpOiB2b2lkIHtcbiAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoXCJcdTRGRERcdTVCNThcdTRFMkRcdTIwMjZcIik7XG4gICAgdGhpcy5yb290RWwuYWRkQ2xhc3MoXCJpcy1kaXJ0eVwiKTtcbiAgfVxuXG4gIGZvY3VzKCk6IHZvaWQge1xuICAgIHRoaXMucm9vdEVsLmZvY3VzKCk7XG4gIH1cblxuICBmb2N1c05vZGVCeUlkKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCBpZCkpIHRoaXMuZm9jdXNOb2RlKGlkKTtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRVaSgpOiB2b2lkIHtcbiAgICB0aGlzLmhvc3QuZW1wdHkoKTtcbiAgICB0aGlzLnJvb3RFbCA9IHRoaXMuaG9zdC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWVkaXRvclwiIH0pO1xuICAgIHRoaXMucm9vdEVsLnRhYkluZGV4ID0gMDtcbiAgICB0aGlzLnRvb2xiYXJFbCA9IHRoaXMucm9vdEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdG9vbGJhclwiIH0pO1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsID0gdGhpcy5yb290RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1wYXJlbnQtbmF2aWdhdGlvblwiIH0pO1xuICAgIHRoaXMudmlld3BvcnRFbCA9IHRoaXMucm9vdEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdmlld3BvcnRcIiB9KTtcbiAgICB0aGlzLnNjZW5lRWwgPSB0aGlzLnZpZXdwb3J0RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1zY2VuZVwiIH0pO1xuICAgIHRoaXMuZWRnZXNTdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcbiAgICB0aGlzLmVkZ2VzU3ZnLmNsYXNzTGlzdC5hZGQoXCJtbWMtZWRnZXNcIik7XG4gICAgdGhpcy5zY2VuZUVsLmFwcGVuZENoaWxkKHRoaXMuZWRnZXNTdmcpO1xuICAgIHRoaXMubm9kZXNMYXllckVsID0gdGhpcy5zY2VuZUVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZXMtbGF5ZXJcIiB9KTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJwbHVzLWNpcmNsZVwiLCBcIlx1NkRGQlx1NTJBMFx1NUI1MFx1ODI4Mlx1NzBCOVx1RkYwOFRhYlx1RkYwOVwiLCAoKSA9PiB0aGlzLmFkZENoaWxkKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImxpc3QtcGx1c1wiLCBcIlx1NkRGQlx1NTJBMFx1NTQwQ1x1N0VBN1x1ODI4Mlx1NzBCOVx1RkYwOEVudGVyXHVGRjA5XCIsICgpID0+IHRoaXMuYWRkU2libGluZygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJwZW5jaWxcIiwgXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcdUZGMDhGMlx1RkYwOVwiLCAoKSA9PiB0aGlzLmVkaXRTZWxlY3RlZCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJjb3B5LXBsdXNcIiwgXCJcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcdUZGMDhDdHJsL0NtZCtEXHVGRjA5XCIsICgpID0+IHRoaXMuZHVwbGljYXRlU2VsZWN0ZWQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwidHJhc2gtMlwiLCBcIlx1NTIyMFx1OTY2NFx1ODI4Mlx1NzBCOVx1RkYwOERlbGV0ZVx1RkYwOVwiLCAoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImNpcmNsZS1jaGVjay1iaWdcIiwgXCJcdTUyMDdcdTYzNjJcdTRFRkJcdTUyQTFcdTcyQjZcdTYwMDFcdUZGMDhDdHJsL0NtZCtFbnRlclx1RkYwOVwiLCAoKSA9PiB0aGlzLmN5Y2xlVGFzaygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJmb2xkLXZlcnRpY2FsXCIsIFwiXHU1QzU1XHU1RjAwL1x1NjUzNlx1OEQ3N1x1ODI4Mlx1NzBCOVx1RkYwOFNwYWNlXHVGRjA5XCIsICgpID0+IHRoaXMudG9nZ2xlQ29sbGFwc2UoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwibGlua1wiLCBcIlx1NjI1M1x1NUYwMFx1ODI4Mlx1NzBCOVx1OTRGRVx1NjNBNVwiLCAoKSA9PiB0aGlzLm9wZW5TZWxlY3RlZExpbmsoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwic2VhcmNoXCIsIFwiXHU2NDFDXHU3RDIyXHU4MjgyXHU3MEI5XHVGRjA4Q3RybC9DbWQrRlx1RkYwOVwiLCAoKSA9PiB0aGlzLm9wZW5TZWFyY2goKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyU2VwYXJhdG9yKCk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwidGFibGUtMlwiLCBcIlx1NjNEMlx1NTE2NVx1NjIxNlx1N0YxNlx1OEY5MVx1ODg2OFx1NjgzQ1wiLCAoKSA9PiB0aGlzLmVkaXRUYWJsZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJjb2RlLTJcIiwgXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTRFRTNcdTc4MDFcIiwgKCkgPT4gdGhpcy5lZGl0Q29kZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJpbWFnZS1wbHVzXCIsIFwiXHU3Qzk4XHU4RDM0XHU1NkZFXHU3MjQ3XHU1MjMwXHU1RjUzXHU1MjREXHU4MjgyXHU3MEI5XHVGRjA4Q3RybC9DbWQrVlx1RkYwOVwiLCAoKSA9PiBuZXcgTm90aWNlKFwiXHU1MTQ4XHU1OTBEXHU1MjM2XHU1NkZFXHU3MjQ3XHVGRjBDXHU1MThEXHU5MDA5XHU0RTJEXHU4MjgyXHU3MEI5XHU1RTc2XHU2MzA5IEN0cmwvQ21kK1ZcIikpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcIm5ldHdvcmtcIiwgXCJcdTUyMUJcdTVFRkFcdTYyMTZcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkVcIiwgKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU9yT3BlblN1Ym1hcCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ1bmRvLTJcIiwgXCJcdTY0QTRcdTk1MDBcdUZGMDhDdHJsL0NtZCtaXHVGRjA5XCIsICgpID0+IHRoaXMudW5kbygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJyZWRvLTJcIiwgXCJcdTkxQ0RcdTUwNUFcdUZGMDhDdHJsL0NtZCtZXHVGRjA5XCIsICgpID0+IHRoaXMucmVkbygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ6b29tLWluXCIsIFwiXHU2NTNFXHU1OTI3XCIsICgpID0+IHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gKiAxLjE1KSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiem9vbS1vdXRcIiwgXCJcdTdGMjlcdTVDMEZcIiwgKCkgPT4gdGhpcy5zZXRab29tKHRoaXMuem9vbSAvIDEuMTUpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJtYXhpbWl6ZVwiLCBcIlx1OTAwMlx1NUU5NFx1NzUzQlx1NUUwM1wiLCAoKSA9PiB0aGlzLmZpdFRvVmlldygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJnaXQtZm9ya1wiLCBcIlx1NTIwN1x1NjM2Mlx1NTM1NVx1NEZBNy9cdTUzQ0NcdTRGQTdcdTVFMDNcdTVDNDBcIiwgKCkgPT4gdGhpcy50b2dnbGVMYXlvdXQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwicGFsZXR0ZVwiLCBcIlx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTkxNlx1ODlDMlwiLCAoKSA9PiB0aGlzLmVkaXRBcHBlYXJhbmNlKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImZpbGUtdGV4dFwiLCBcIlx1NjdFNVx1NzcwQiBNYXJrZG93biBcdTU5MjdcdTdFQjJcIiwgKCkgPT4gdGhpcy5zaG93T3V0bGluZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJicmFjZXNcIiwgXCJKU09OIFx1NUJGQ1x1NTE2NSAvIFx1NUJGQ1x1NTFGQVwiLCAoKSA9PiB0aGlzLnNob3dKc29uVHJhbnNmZXIoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiaW1hZ2VcIiwgXCJcdTVCRkNcdTUxRkEgU1ZHXCIsICgpID0+IHZvaWQgdGhpcy5jYWxsYmFja3Mub25FeHBvcnRTdmcoZG9jdW1lbnRUb1N2Zyh0aGlzLmRvY3VtZW50LnJvb3QsIHRoaXMuZG9jdW1lbnQubGF5b3V0LCB0aGlzLmRvY3VtZW50LnRpdGxlLCB0aGlzLmdldEFwcGVhcmFuY2UoKSkpKTtcblxuICAgIGNvbnN0IHNwYWNlciA9IHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRvb2xiYXItc3BhY2VyXCIgfSk7XG4gICAgc3BhY2VyLnNldEF0dHIoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gICAgdGhpcy56b29tU3RhdHVzRWwgPSB0aGlzLnRvb2xiYXJFbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy16b29tLXN0YXR1c1wiLCB0ZXh0OiBcIjEwMCVcIiB9KTtcbiAgICB0aGlzLnN0YXR1c0VsID0gdGhpcy50b29sYmFyRWwuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtc2F2ZS1zdGF0dXNcIiwgdGV4dDogXCJcdTVERjJcdTRGRERcdTVCNThcIiB9KTtcblxuICAgIGNvbnN0IGtleWRvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHRoaXMuaGFuZGxlS2V5ZG93bihldmVudCk7XG4gICAgdGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5ZG93bik7XG4gICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzLnB1c2goKCkgPT4gdGhpcy5yb290RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5ZG93bikpO1xuXG4gICAgY29uc3QgcGFzdGUgPSAoZXZlbnQ6IENsaXBib2FyZEV2ZW50KTogdm9pZCA9PiB7IHZvaWQgdGhpcy5oYW5kbGVQYXN0ZShldmVudCk7IH07XG4gICAgdGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIHBhc3RlKTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnJvb3RFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgcGFzdGUpKTtcblxuICAgIGNvbnN0IHdoZWVsID0gKGV2ZW50OiBXaGVlbEV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB3aGVlbFRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmICh3aGVlbFRhcmdldC5jbG9zZXN0KFwiLm1tYy1ub2RlLXRhYmxlLXdyYXAsIC5tbWMtY29kZS1ibG9ja1wiKSkgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnZpZXdwb3J0RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBwb2ludGVyWCA9IGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQgLSByZWN0LndpZHRoIC8gMjtcbiAgICAgIGNvbnN0IHBvaW50ZXJZID0gZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wIC0gcmVjdC5oZWlnaHQgLyAyO1xuICAgICAgY29uc3Qgb2xkWm9vbSA9IHRoaXMuem9vbTtcbiAgICAgIGNvbnN0IG5leHRab29tID0gdGhpcy5jbGFtcFpvb20odGhpcy56b29tICogKGV2ZW50LmRlbHRhWSA8IDAgPyAxLjEgOiAwLjkpKTtcbiAgICAgIGNvbnN0IHdvcmxkWCA9IChwb2ludGVyWCAtIHRoaXMucGFuWCkgLyBvbGRab29tO1xuICAgICAgY29uc3Qgd29ybGRZID0gKHBvaW50ZXJZIC0gdGhpcy5wYW5ZKSAvIG9sZFpvb207XG4gICAgICB0aGlzLnpvb20gPSBuZXh0Wm9vbTtcbiAgICAgIHRoaXMucGFuWCA9IHBvaW50ZXJYIC0gd29ybGRYICogbmV4dFpvb207XG4gICAgICB0aGlzLnBhblkgPSBwb2ludGVyWSAtIHdvcmxkWSAqIG5leHRab29tO1xuICAgICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICAgIH07XG4gICAgdGhpcy52aWV3cG9ydEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCB3aGVlbCwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHdoZWVsKSk7XG5cbiAgICBjb25zdCBwb2ludGVyRG93biA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBpZiAodGFyZ2V0LmNsb3Nlc3QoXCIubW1jLW5vZGVcIikpIHJldHVybjtcbiAgICAgIGlmIChldmVudC5idXR0b24gIT09IDAgJiYgZXZlbnQuYnV0dG9uICE9PSAxKSByZXR1cm47XG4gICAgICB0aGlzLnBhbm5pbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wYW5TdGFydCA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSwgcGFuWDogdGhpcy5wYW5YLCBwYW5ZOiB0aGlzLnBhblkgfTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5zZXRQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLmFkZENsYXNzKFwiaXMtcGFubmluZ1wiKTtcbiAgICAgIHRoaXMuc2VsZWN0Tm9kZShudWxsKTtcbiAgICB9O1xuICAgIGNvbnN0IHBvaW50ZXJNb3ZlID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGlmICghdGhpcy5wYW5uaW5nKSByZXR1cm47XG4gICAgICB0aGlzLnBhblggPSB0aGlzLnBhblN0YXJ0LnBhblggKyBldmVudC5jbGllbnRYIC0gdGhpcy5wYW5TdGFydC54O1xuICAgICAgdGhpcy5wYW5ZID0gdGhpcy5wYW5TdGFydC5wYW5ZICsgZXZlbnQuY2xpZW50WSAtIHRoaXMucGFuU3RhcnQueTtcbiAgICAgIHRoaXMuYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICB9O1xuICAgIGNvbnN0IHBvaW50ZXJVcCA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBpZiAoIXRoaXMucGFubmluZykgcmV0dXJuO1xuICAgICAgdGhpcy5wYW5uaW5nID0gZmFsc2U7XG4gICAgICBpZiAodGhpcy52aWV3cG9ydEVsLmhhc1BvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCkpIHRoaXMudmlld3BvcnRFbC5yZWxlYXNlUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVDbGFzcyhcImlzLXBhbm5pbmdcIik7XG4gICAgfTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHBvaW50ZXJEb3duKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHBvaW50ZXJNb3ZlKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCBwb2ludGVyVXApO1xuICAgIHRoaXMudmlld3BvcnRFbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmNhbmNlbFwiLCBwb2ludGVyVXApO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcy5wdXNoKCgpID0+IHtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgcG9pbnRlckRvd24pO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCBwb2ludGVyTW92ZSk7XG4gICAgICB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCBwb2ludGVyVXApO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVyY2FuY2VsXCIsIHBvaW50ZXJVcCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHRoaXMuYXBwbHlUcmFuc2Zvcm0oKSk7XG4gICAgdGhpcy5yZXNpemVPYnNlcnZlci5vYnNlcnZlKHRoaXMudmlld3BvcnRFbCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFySW1hZ2VMb2FkVGltZXJzKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdGltZXIgb2YgdGhpcy5pbWFnZUxvYWRUaW1lcnMpIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRoaXMuaW1hZ2VMb2FkVGltZXJzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFkZFRvb2xiYXJCdXR0b24oaWNvbjogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCBhY3Rpb246ICgpID0+IHZvaWQpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy50b29sYmFyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb24gbW1jLXRvb2xiYXItYnV0dG9uXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGxhYmVsLCB0aXRsZTogbGFiZWwgfSB9KTtcbiAgICBzZXRJY29uKGJ1dHRvbiwgaWNvbik7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBhY3Rpb24oKTtcbiAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRUb29sYmFyU2VwYXJhdG9yKCk6IHZvaWQge1xuICAgIHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRvb2xiYXItc2VwYXJhdG9yXCIgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldEFwcGVhcmFuY2UoKTogTWluZE1hcEFwcGVhcmFuY2Uge1xuICAgIHJldHVybiBtZXJnZUFwcGVhcmFuY2UodGhpcy5vcHRpb25zLmRlZmF1bHRBcHBlYXJhbmNlLCB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb250RmFtaWx5Q3NzKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKTogc3RyaW5nIHtcbiAgICBpZiAoYXBwZWFyYW5jZS5mb250RmFtaWx5ID09PSBcInNlcmlmXCIpIHJldHVybiAnR2VvcmdpYSwgXCJUaW1lcyBOZXcgUm9tYW5cIiwgc2VyaWYnO1xuICAgIGlmIChhcHBlYXJhbmNlLmZvbnRGYW1pbHkgPT09IFwibW9ub1wiKSByZXR1cm4gJ1wiU0ZNb25vLVJlZ3VsYXJcIiwgQ29uc29sYXMsIFwiTGliZXJhdGlvbiBNb25vXCIsIG1vbm9zcGFjZSc7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJjdXN0b21cIiAmJiBhcHBlYXJhbmNlLmN1c3RvbUZvbnQ/LnRyaW0oKSkgcmV0dXJuIGBcIiR7YXBwZWFyYW5jZS5jdXN0b21Gb250LnRyaW0oKS5yZXBsYWNlQWxsKCdcIicsICcnKX1cIiwgc2Fucy1zZXJpZmA7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJzYW5zXCIpIHJldHVybiAnSW50ZXIsIC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgXCJTZWdvZSBVSVwiLCBzYW5zLXNlcmlmJztcbiAgICByZXR1cm4gXCJ2YXIoLS1mb250LWludGVyZmFjZSlcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlBcHBlYXJhbmNlKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKTogdm9pZCB7XG4gICAgY29uc3Qgc2V0T3JSZW1vdmUgPSAobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgICBpZiAodmFsdWUpIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgIGVsc2UgdGhpcy5yb290RWwuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgfTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLWNhbnZhc1wiLCBhcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1wYXR0ZXJuLWNvbG9yXCIsIGFwcGVhcmFuY2UucGF0dGVybkNvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLWVkZ2VcIiwgYXBwZWFyYW5jZS5lZGdlQ29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtcm9vdC1iZ1wiLCBhcHBlYXJhbmNlLnJvb3RDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1yb290LXRleHRcIiwgYXBwZWFyYW5jZS5yb290VGV4dENvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLW5vZGUtYmdcIiwgYXBwZWFyYW5jZS5ub2RlQ29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtbm9kZS10ZXh0XCIsIGFwcGVhcmFuY2UudGV4dENvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLW5vZGUtYm9yZGVyXCIsIGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yKTtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLWZvbnQtZmFtaWx5XCIsIHRoaXMuZm9udEZhbWlseUNzcyhhcHBlYXJhbmNlKSk7XG4gICAgdGhpcy5yb290RWwuc3R5bGUuc2V0UHJvcGVydHkoXCItLW1tYy1lZGdlLXdpZHRoXCIsIGAke2FwcGVhcmFuY2UuZWRnZVdpZHRoID8/IDIuMn1weGApO1xuICAgIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KFwiLS1tbWMtbm9kZS1ib3JkZXItd2lkdGhcIiwgYCR7YXBwZWFyYW5jZS5ub2RlQm9yZGVyV2lkdGggPz8gMX1weGApO1xuICAgIHRoaXMudmlld3BvcnRFbC50b2dnbGVDbGFzcyhcInBhdHRlcm4tZ3JpZFwiLCBhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID09PSBcImdyaWRcIik7XG4gICAgdGhpcy52aWV3cG9ydEVsLnRvZ2dsZUNsYXNzKFwicGF0dGVybi1kb3RzXCIsIGFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwiZG90c1wiKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwudG9nZ2xlQ2xhc3MoXCJwYXR0ZXJuLW5vbmVcIiwgIWFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gfHwgYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJub25lXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJOYXZpZ2F0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsLmVtcHR5KCk7XG4gICAgY29uc3QgbmF2aWdhdGlvbiA9IHRoaXMuZG9jdW1lbnQubmF2aWdhdGlvbjtcbiAgICB0aGlzLm5hdmlnYXRpb25CYXJFbC50b2dnbGVDbGFzcyhcImlzLWhpZGRlblwiLCAhbmF2aWdhdGlvbj8ucGFyZW50UGF0aCk7XG4gICAgaWYgKCFuYXZpZ2F0aW9uPy5wYXJlbnRQYXRoKSByZXR1cm47XG5cbiAgICBjb25zdCBidXR0b24gPSB0aGlzLm5hdmlnYXRpb25CYXJFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uLWJ1dHRvblwiLFxuICAgICAgYXR0cjoge1xuICAgICAgICB0eXBlOiBcImJ1dHRvblwiLFxuICAgICAgICB0aXRsZTogYFx1OEZENFx1NTZERVx1NzIzNlx1NUJGQ1x1NTZGRVx1RkYxQSR7bmF2aWdhdGlvbi5wYXJlbnRQYXRofWBcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzZXRJY29uKGJ1dHRvbiwgXCJhcnJvdy1sZWZ0XCIpO1xuICAgIGNvbnN0IGxhYmVscyA9IGJ1dHRvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uLWxhYmVsc1wiIH0pO1xuICAgIGxhYmVscy5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uLXRpdGxlXCIsIHRleHQ6IGBcdThGRDRcdTU2REVcdTcyMzZcdTVCRkNcdTU2RkVcdUZGMUEke25hdmlnYXRpb24ucGFyZW50VGl0bGUgPz8gbmF2aWdhdGlvbi5wYXJlbnRQYXRoLnNwbGl0KFwiL1wiKS5hdCgtMSk/LnJlcGxhY2UoL1xcLm1pbmRtYXAkL2ksIFwiXCIpID8/IFwiXHU3MjM2XHU1QkZDXHU1NkZFXCJ9YCB9KTtcbiAgICBpZiAobmF2aWdhdGlvbi5wYXJlbnROb2RlVGV4dCkgbGFiZWxzLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tbm9kZVwiLCB0ZXh0OiBgXHU2NzY1XHU2RTkwXHU4MjgyXHU3MEI5XHVGRjFBJHtuYXZpZ2F0aW9uLnBhcmVudE5vZGVUZXh0fWAgfSk7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB2b2lkIHRoaXMuY2FsbGJhY2tzLm9uT3Blbk1pbmRNYXAobmF2aWdhdGlvbi5wYXJlbnRQYXRoLCBuYXZpZ2F0aW9uLnBhcmVudE5vZGVJZCkpO1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tcGF0aFwiLCB0ZXh0OiBuYXZpZ2F0aW9uLnBhcmVudFBhdGggfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFySW1hZ2VMb2FkVGltZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJOYXZpZ2F0aW9uKCk7XG4gICAgY29uc3QgYXBwZWFyYW5jZSA9IHRoaXMuZ2V0QXBwZWFyYW5jZSgpO1xuICAgIHRoaXMuYXBwbHlBcHBlYXJhbmNlKGFwcGVhcmFuY2UpO1xuICAgIHRoaXMubGF5b3V0ID0gY29tcHV0ZUxheW91dCh0aGlzLmRvY3VtZW50LnJvb3QsIHRoaXMuZG9jdW1lbnQubGF5b3V0LCBhcHBlYXJhbmNlLmZvbnRTaXplID8/IDE0KTtcbiAgICBjb25zdCBicmFuY2hDb2xvck1hcCA9IGFwcGVhcmFuY2UuY29sb3JmdWxCcmFuY2hlcyA/IGJ1aWxkQnJhbmNoQ29sb3JNYXAodGhpcy5kb2N1bWVudC5yb290LCBhcHBlYXJhbmNlLmJyYW5jaENvbG9ycykgOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICAgIHRoaXMubm9kZXNMYXllckVsLmVtcHR5KCk7XG4gICAgd2hpbGUgKHRoaXMuZWRnZXNTdmcuZmlyc3RDaGlsZCkgdGhpcy5lZGdlc1N2Zy5yZW1vdmVDaGlsZCh0aGlzLmVkZ2VzU3ZnLmZpcnN0Q2hpbGQpO1xuXG4gICAgZm9yIChjb25zdCBwb3NpdGlvbiBvZiB0aGlzLmxheW91dC5ub2Rlcykge1xuICAgICAgaWYgKCFwb3NpdGlvbi5wYXJlbnRJZCkgY29udGludWU7XG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLmxheW91dC5ieUlkLmdldChwb3NpdGlvbi5wYXJlbnRJZCk7XG4gICAgICBpZiAoIXBhcmVudCkgY29udGludWU7XG4gICAgICBjb25zdCBwYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJwYXRoXCIpO1xuICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJkXCIsIGVkZ2VQYXRoKHBhcmVudCwgcG9zaXRpb24sIGFwcGVhcmFuY2UuZWRnZVN0eWxlID8/IFwiY3VydmVkXCIpKTtcbiAgICAgIHBhdGguc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgYG1tYy1lZGdlIGRlcHRoLSR7TWF0aC5taW4ocG9zaXRpb24uZGVwdGgsIDYpfWApO1xuICAgICAgY29uc3QgYnJhbmNoQ29sb3IgPSBicmFuY2hDb2xvck1hcC5nZXQocG9zaXRpb24ubm9kZS5pZCk7XG4gICAgICBpZiAocG9zaXRpb24ubm9kZS5zdHlsZT8uY29sb3IpIHBhdGguc3R5bGUuc3Ryb2tlID0gcG9zaXRpb24ubm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIGVsc2UgaWYgKGJyYW5jaENvbG9yKSBwYXRoLnN0eWxlLnN0cm9rZSA9IGJyYW5jaENvbG9yO1xuICAgICAgcGF0aC5zdHlsZS5zdHJva2VXaWR0aCA9IGAke2VkZ2VXaWR0aEZvckRlcHRoKGFwcGVhcmFuY2UsIHBvc2l0aW9uLmRlcHRoKX1weGA7XG4gICAgICB0aGlzLmVkZ2VzU3ZnLmFwcGVuZENoaWxkKHBhdGgpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgcG9zaXRpb24gb2YgdGhpcy5sYXlvdXQubm9kZXMpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBwb3NpdGlvbi5ub2RlO1xuICAgICAgY29uc3Qgc2hhcGUgPSBub2RlLnN0eWxlPy5zaGFwZSA/PyB0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZTtcbiAgICAgIGNvbnN0IGNsYXNzZXMgPSBbXCJtbWMtbm9kZVwiLCBwb3NpdGlvbi5kZXB0aCA9PT0gMCA/IFwiaXMtcm9vdFwiIDogXCJcIiwgYHNoYXBlLSR7c2hhcGV9YF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCIgXCIpO1xuICAgICAgY29uc3Qgbm9kZUVsID0gdGhpcy5ub2Rlc0xheWVyRWwuY3JlYXRlRGl2KHsgY2xzOiBjbGFzc2VzIH0pO1xuICAgICAgbm9kZUVsLmRhdGFzZXQubm9kZUlkID0gbm9kZS5pZDtcbiAgICAgIG5vZGVFbC5zdHlsZS5sZWZ0ID0gYCR7cG9zaXRpb24ueH1weGA7XG4gICAgICBub2RlRWwuc3R5bGUudG9wID0gYCR7cG9zaXRpb24ueX1weGA7XG4gICAgICBub2RlRWwuc3R5bGUud2lkdGggPSBgJHtwb3NpdGlvbi53aWR0aH1weGA7XG4gICAgICBub2RlRWwuc3R5bGUubWluSGVpZ2h0ID0gYCR7cG9zaXRpb24uaGVpZ2h0fXB4YDtcbiAgICAgIG5vZGVFbC5kcmFnZ2FibGUgPSBwb3NpdGlvbi5kZXB0aCA+IDA7XG4gICAgICBpZiAodGhpcy5zZWxlY3RlZElkID09PSBub2RlLmlkKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1zZWxlY3RlZFwiKTtcbiAgICAgIGlmICh0aGlzLnNlYXJjaFF1ZXJ5ICYmIG5vZGVTZWFyY2hUZXh0KG5vZGUpLmluY2x1ZGVzKHRoaXMuc2VhcmNoUXVlcnkpKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1zZWFyY2gtbWF0Y2hcIik7XG4gICAgICBpZiAobm9kZS50YXNrKSBub2RlRWwuYWRkQ2xhc3MoYHRhc2stJHtub2RlLnRhc2t9YCk7XG4gICAgICBjb25zdCBpc1Jvb3QgPSBwb3NpdGlvbi5kZXB0aCA9PT0gMDtcbiAgICAgIGNvbnN0IGJvbGQgPSBub2RlLnN0eWxlPy5ib2xkID8/IGFwcGVhcmFuY2UuYm9sZCA/PyBmYWxzZTtcbiAgICAgIGNvbnN0IGl0YWxpYyA9IG5vZGUuc3R5bGU/Lml0YWxpYyA/PyBhcHBlYXJhbmNlLml0YWxpYyA/PyBmYWxzZTtcbiAgICAgIGNvbnN0IHVuZGVybGluZSA9IG5vZGUuc3R5bGU/LnVuZGVybGluZSA/PyBhcHBlYXJhbmNlLnVuZGVybGluZSA/PyBmYWxzZTtcbiAgICAgIGlmIChib2xkKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1ib2xkXCIpO1xuICAgICAgaWYgKGl0YWxpYykgbm9kZUVsLmFkZENsYXNzKFwiaXMtaXRhbGljXCIpO1xuICAgICAgaWYgKHVuZGVybGluZSkgbm9kZUVsLmFkZENsYXNzKFwiaXMtdW5kZXJsaW5lZFwiKTtcbiAgICAgIGlmIChub2RlLm5vdGUpIG5vZGVFbC5zZXRBdHRyKFwidGl0bGVcIiwgbm9kZS5ub3RlKTtcbiAgICAgIGNvbnN0IGJyYW5jaENvbG9yID0gYnJhbmNoQ29sb3JNYXAuZ2V0KG5vZGUuaWQpO1xuICAgICAgaWYgKG5vZGUuc3R5bGU/LmNvbG9yKSBub2RlRWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gbm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIGVsc2UgaWYgKGlzUm9vdCAmJiBhcHBlYXJhbmNlLnJvb3RDb2xvcikgbm9kZUVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGFwcGVhcmFuY2Uucm9vdENvbG9yO1xuICAgICAgZWxzZSBpZiAoIWlzUm9vdCAmJiBhcHBlYXJhbmNlLm5vZGVDb2xvcikgbm9kZUVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGFwcGVhcmFuY2Uubm9kZUNvbG9yO1xuICAgICAgaWYgKG5vZGUuc3R5bGU/LnRleHRDb2xvcikgbm9kZUVsLnN0eWxlLmNvbG9yID0gbm9kZS5zdHlsZS50ZXh0Q29sb3I7XG4gICAgICBlbHNlIGlmIChpc1Jvb3QgJiYgYXBwZWFyYW5jZS5yb290VGV4dENvbG9yKSBub2RlRWwuc3R5bGUuY29sb3IgPSBhcHBlYXJhbmNlLnJvb3RUZXh0Q29sb3I7XG4gICAgICBlbHNlIGlmICghaXNSb290ICYmIGFwcGVhcmFuY2UudGV4dENvbG9yKSBub2RlRWwuc3R5bGUuY29sb3IgPSBhcHBlYXJhbmNlLnRleHRDb2xvcjtcbiAgICAgIGlmIChub2RlLnN0eWxlPy5ib3JkZXJDb2xvcikgbm9kZUVsLnN0eWxlLmJvcmRlckNvbG9yID0gbm9kZS5zdHlsZS5ib3JkZXJDb2xvcjtcbiAgICAgIGVsc2UgaWYgKCFpc1Jvb3QgJiYgYnJhbmNoQ29sb3IpIG5vZGVFbC5zdHlsZS5ib3JkZXJDb2xvciA9IGJyYW5jaENvbG9yO1xuICAgICAgZWxzZSBpZiAoIWlzUm9vdCAmJiBhcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvcikgbm9kZUVsLnN0eWxlLmJvcmRlckNvbG9yID0gYXBwZWFyYW5jZS5ub2RlQm9yZGVyQ29sb3I7XG4gICAgICBub2RlRWwuc3R5bGUuYm9yZGVyV2lkdGggPSBgJHtub2RlLnN0eWxlPy5ib3JkZXJXaWR0aCA/PyBhcHBlYXJhbmNlLm5vZGVCb3JkZXJXaWR0aCA/PyAoaXNSb290ID8gMiA6IDEpfXB4YDtcblxuICAgICAgY29uc3QgY29udGVudCA9IG5vZGVFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtY29udGVudFwiIH0pO1xuICAgICAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gICAgICBjb25zdCBoYXNUZXh0QmxvY2sgPSBibG9ja3Muc29tZSgoYmxvY2spID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiICYmIGJsb2NrLnRleHQudHJpbSgpKTtcbiAgICAgIGlmICgobm9kZS50YXNrIHx8IG5vZGUuaWNvbikgJiYgIWhhc1RleHRCbG9jaykge1xuICAgICAgICBjb25zdCBtZXRhID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtbWFpbiBtbWMtbm9kZS1tZXRhLW9ubHlcIiB9KTtcbiAgICAgICAgaWYgKG5vZGUudGFzaykge1xuICAgICAgICAgIGNvbnN0IHRhc2sgPSBtZXRhLmNyZWF0ZVNwYW4oeyBjbHM6IGBtbWMtdGFzay1pY29uIHRhc2stJHtub2RlLnRhc2t9YCwgdGV4dDogbm9kZS50YXNrID09PSBcImRvbmVcIiA/IFwiXHUyNzEzXCIgOiBub2RlLnRhc2sgPT09IFwiZG9pbmdcIiA/IFwiXHUyNUQwXCIgOiBcIlx1MjVDQlwiIH0pO1xuICAgICAgICAgIHRhc2suc2V0QXR0cihcImFyaWEtbGFiZWxcIiwgbm9kZS50YXNrID09PSBcImRvbmVcIiA/IFwiXHU1REYyXHU1QjhDXHU2MjEwXCIgOiBub2RlLnRhc2sgPT09IFwiZG9pbmdcIiA/IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIgOiBcIlx1NUY4NVx1NTI5RVwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5pY29uKSBtZXRhLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLW5vZGUtaWNvblwiLCB0ZXh0OiBub2RlLmljb24gfSk7XG4gICAgICB9XG4gICAgICBsZXQgcHJlZml4UmVuZGVyZWQgPSBmYWxzZTtcbiAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICAgIGlmIChibG9jay50eXBlID09PSBcImltYWdlXCIpIHtcbiAgICAgICAgICBjb25zdCB3cmFwID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtaW1hZ2UtYmxvY2tcIiB9KTtcbiAgICAgICAgICBjb25zdCBpbWFnZSA9IHdyYXAuY3JlYXRlRWwoXCJpbWdcIiwgeyBjbHM6IFwibW1jLW5vZGUtaW1hZ2UgaXMtbG9hZGluZ1wiLCBhdHRyOiB7IGFsdDogYmxvY2suYWx0ID8/IChub2RlUGxhaW5UZXh0KG5vZGUpIHx8IFwiXHU1NkZFXHU3MjQ3XCIpIH0gfSk7XG4gICAgICAgICAgY29uc3QgY2FuZGlkYXRlcyA9IHRoaXMub3B0aW9ucy5pbWFnZUZhaWxvdmVyRW5hYmxlZFxuICAgICAgICAgICAgPyBpbWFnZVNvdXJjZUNhbmRpZGF0ZXMoYmxvY2ssIHRoaXMub3B0aW9ucy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjaylcbiAgICAgICAgICAgIDogaW1hZ2VTb3VyY2VDYW5kaWRhdGVzKGJsb2NrLCBmYWxzZSkuc2xpY2UoMCwgMSk7XG4gICAgICAgICAgbGV0IGFjdGl2ZVJlc29sdmVkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICBsZXQgYXR0ZW1wdFRva2VuID0gMDtcbiAgICAgICAgICBsZXQgYXR0ZW1wdFRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICBjb25zdCBjbGVhckF0dGVtcHRUaW1lciA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChhdHRlbXB0VGltZXIgPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoYXR0ZW1wdFRpbWVyKTtcbiAgICAgICAgICAgIHRoaXMuaW1hZ2VMb2FkVGltZXJzLmRlbGV0ZShhdHRlbXB0VGltZXIpO1xuICAgICAgICAgICAgYXR0ZW1wdFRpbWVyID0gbnVsbDtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IG1hcmtSZW1vdGVGYWlsdXJlID0gKHNvdXJjZTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZW1vdGUgPSBibG9jay5yZW1vdGVTb3VyY2VzPy5maW5kKChpdGVtKSA9PiBpdGVtLnVybCA9PT0gc291cmNlKTtcbiAgICAgICAgICAgIGlmICghcmVtb3RlKSByZXR1cm47XG4gICAgICAgICAgICByZW1vdGUubGFzdEZhaWx1cmVBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgIHJlbW90ZS5mYWlsdXJlQ291bnQgPSBNYXRoLm1pbigxMDAwMDAwLCAocmVtb3RlLmZhaWx1cmVDb3VudCA/PyAwKSArIDEpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3QgdHJ5Q2FuZGlkYXRlID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGNsZWFyQXR0ZW1wdFRpbWVyKCk7XG4gICAgICAgICAgICBjb25zdCBjYW5kaWRhdGUgPSBjYW5kaWRhdGVzW2luZGV4XTtcbiAgICAgICAgICAgIGF0dGVtcHRUb2tlbiArPSAxO1xuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSBhdHRlbXB0VG9rZW47XG4gICAgICAgICAgICBpZiAoIWNhbmRpZGF0ZSkge1xuICAgICAgICAgICAgICBhY3RpdmVSZXNvbHZlZCA9IG51bGw7XG4gICAgICAgICAgICAgIGltYWdlLnJlbW92ZUF0dHJpYnV0ZShcInNyY1wiKTtcbiAgICAgICAgICAgICAgaW1hZ2UucmVtb3ZlQ2xhc3MoXCJpcy1sb2FkaW5nXCIpO1xuICAgICAgICAgICAgICBpbWFnZS5hZGRDbGFzcyhcImlzLXVucmVzb2x2ZWRcIik7XG4gICAgICAgICAgICAgIGltYWdlLnNldEF0dHIoXCJ0aXRsZVwiLCBcIlx1NjI0MFx1NjcwOVx1NTZGRVx1NzI0N1x1OTU1Q1x1NTBDRlx1NTc0N1x1NEUwRFx1NTNFRlx1NzUyOFwiKTtcbiAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICAgICAgICAgICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlKGNhbmRpZGF0ZS5zb3VyY2UpO1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlZCkge1xuICAgICAgICAgICAgICBtYXJrUmVtb3RlRmFpbHVyZShjYW5kaWRhdGUuc291cmNlKTtcbiAgICAgICAgICAgICAgdHJ5Q2FuZGlkYXRlKGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2JlID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBjb25zdCBmYWlsID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICBpZiAodG9rZW4gIT09IGF0dGVtcHRUb2tlbikgcmV0dXJuO1xuICAgICAgICAgICAgICBjbGVhckF0dGVtcHRUaW1lcigpO1xuICAgICAgICAgICAgICBtYXJrUmVtb3RlRmFpbHVyZShjYW5kaWRhdGUuc291cmNlKTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbWFnZUZhaWxvdmVyRW5hYmxlZCkgdHJ5Q2FuZGlkYXRlKGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGltYWdlLnJlbW92ZUNsYXNzKFwiaXMtbG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICBpbWFnZS5hZGRDbGFzcyhcImlzLXVucmVzb2x2ZWRcIik7XG4gICAgICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cihcInRpdGxlXCIsIGBcdTU2RkVcdTcyNDdcdTUyQTBcdThGN0RcdTU5MzFcdThEMjVcdUZGMUEke2NhbmRpZGF0ZS5zb3VyY2V9YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwcm9iZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0b2tlbiAhPT0gYXR0ZW1wdFRva2VuIHx8IHByb2JlLm5hdHVyYWxXaWR0aCA8PSAwKSByZXR1cm47XG4gICAgICAgICAgICAgIGNsZWFyQXR0ZW1wdFRpbWVyKCk7XG4gICAgICAgICAgICAgIGFjdGl2ZVJlc29sdmVkID0gcmVzb2x2ZWQ7XG4gICAgICAgICAgICAgIGltYWdlLnNyYyA9IHJlc29sdmVkO1xuICAgICAgICAgICAgICBpbWFnZS5yZW1vdmVDbGFzcyhcImlzLWxvYWRpbmdcIik7XG4gICAgICAgICAgICAgIGltYWdlLnJlbW92ZUNsYXNzKFwiaXMtdW5yZXNvbHZlZFwiKTtcbiAgICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cihcInRpdGxlXCIsIGluZGV4ID09PSAwID8gXCJcdTcwQjlcdTUxRkJcdTY1M0VcdTU5MjdcdTU2RkVcdTcyNDdcIiA6IGBcdTVERjJcdTgxRUFcdTUyQThcdTUyMDdcdTYzNjJcdTUyMzBcdUZGMUEke2NhbmRpZGF0ZS5sYWJlbH1gKTtcbiAgICAgICAgICAgICAgY29uc3Qgc3dpdGNoZWQgPSBjYW5kaWRhdGUuc291cmNlICE9PSBibG9jay5zb3VyY2U7XG4gICAgICAgICAgICAgIGNvbnN0IHJlbW90ZSA9IGJsb2NrLnJlbW90ZVNvdXJjZXM/LmZpbmQoKGl0ZW0pID0+IGl0ZW0udXJsID09PSBjYW5kaWRhdGUuc291cmNlKTtcbiAgICAgICAgICAgICAgaWYgKHJlbW90ZSkgcmVtb3RlLmxhc3RTdWNjZXNzQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgICAgIGlmICghc3dpdGNoZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgY29uc3QgcHJldmlvdXMgPSBibG9jay5yZW1vdGVTb3VyY2VzPy5maW5kKChpdGVtKSA9PiBpdGVtLnVybCA9PT0gYmxvY2suc291cmNlKTtcbiAgICAgICAgICAgICAgYmxvY2suc291cmNlID0gY2FuZGlkYXRlLnNvdXJjZTtcbiAgICAgICAgICAgICAgc3luY05vZGVMZWdhY3lGaWVsZHMobm9kZSk7XG4gICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgICAgICAgICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgICAgICAgICAgICBjb25zdCBwcmV2aW91c0xhYmVsID0gcHJldmlvdXM/Lmhvc3ROYW1lIHx8IFwiXHU1RjUzXHU1MjREXHU1NkZFXHU1RThBXCI7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoYFx1NTZGRVx1NzI0N1x1NTczMFx1NTc0MFx1NTkzMVx1NjU0OFx1RkYwQ1x1NURGMlx1NEVDRSAke3ByZXZpb3VzTGFiZWx9IFx1ODFFQVx1NTJBOFx1NTIwN1x1NjM2Mlx1NTIzMCAke2NhbmRpZGF0ZS5sYWJlbH1gLCA2MDAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwcm9iZS5vbmVycm9yID0gZmFpbDtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXRNcyA9IE1hdGgubWF4KDIsIE1hdGgubWluKDMwLCB0aGlzLm9wdGlvbnMuaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzKSkgKiAxMDAwO1xuICAgICAgICAgICAgYXR0ZW1wdFRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoZmFpbCwgdGltZW91dE1zKTtcbiAgICAgICAgICAgIHRoaXMuaW1hZ2VMb2FkVGltZXJzLmFkZChhdHRlbXB0VGltZXIpO1xuICAgICAgICAgICAgcHJvYmUuc3JjID0gcmVzb2x2ZWQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVSZXNvbHZlZCkgbmV3IEltYWdlUHJldmlld01vZGFsKHRoaXMuYXBwLCBhY3RpdmVSZXNvbHZlZCwgYmxvY2suYWx0ID8/IFwiXHU1NkZFXHU3MjQ3XHU5ODg0XHU4OUM4XCIpLm9wZW4oKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0cnlDYW5kaWRhdGUoMCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFibG9jay50ZXh0LnRyaW0oKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IG1haW4gPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1tYWluIG1tYy1ub2RlLXRleHQtYmxvY2tcIiB9KTtcbiAgICAgICAgaWYgKCFwcmVmaXhSZW5kZXJlZCAmJiBub2RlLnRhc2spIHtcbiAgICAgICAgICBjb25zdCB0YXNrID0gbWFpbi5jcmVhdGVTcGFuKHsgY2xzOiBgbW1jLXRhc2staWNvbiB0YXNrLSR7bm9kZS50YXNrfWAsIHRleHQ6IG5vZGUudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1MjcxM1wiIDogbm9kZS50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1MjVEMFwiIDogXCJcdTI1Q0JcIiB9KTtcbiAgICAgICAgICB0YXNrLnNldEF0dHIoXCJhcmlhLWxhYmVsXCIsIG5vZGUudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIDogbm9kZS50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiIDogXCJcdTVGODVcdTUyOUVcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcmVmaXhSZW5kZXJlZCAmJiBub2RlLmljb24pIG1haW4uY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtbm9kZS1pY29uXCIsIHRleHQ6IG5vZGUuaWNvbiB9KTtcbiAgICAgICAgcHJlZml4UmVuZGVyZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCB0ZXh0RWwgPSBtYWluLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS10ZXh0XCIgfSk7XG4gICAgICAgIHJlbmRlclJpY2hUZXh0UnVucyh0ZXh0RWwsIGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0KTtcbiAgICAgICAgdGV4dEVsLnN0eWxlLmZvbnRTaXplID0gYCR7bm9kZS5zdHlsZT8uZm9udFNpemUgPz8gYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNH1weGA7XG4gICAgICAgIHRleHRFbC5zZXRBdHRyKFwiYXJpYS1sYWJlbFwiLCBibG9jay50ZXh0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUuc3VibWFwKSB7XG4gICAgICAgIGNvbnN0IHN1Ym1hcEJ1dHRvbiA9IGNvbnRlbnQuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLXN1Ym1hcC1jYXJkXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGBcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkUgJHtub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRofWAgfSB9KTtcbiAgICAgICAgc2V0SWNvbihzdWJtYXBCdXR0b24sIFwibmV0d29ya1wiKTtcbiAgICAgICAgc3VibWFwQnV0dG9uLmNyZWF0ZVNwYW4oeyB0ZXh0OiBub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRoLnNwbGl0KFwiL1wiKS5hdCgtMSk/LnJlcGxhY2UoL1xcLm1pbmRtYXAkL2ksIFwiXCIpID8/IFwiXHU1QjUwXHU1QkZDXHU1NkZFXCIgfSk7XG4gICAgICAgIHN1Ym1hcEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdm9pZCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5NaW5kTWFwKG5vZGUuc3VibWFwIS5wYXRoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChub2RlLnRhYmxlKSB0aGlzLnJlbmRlck5vZGVUYWJsZShjb250ZW50LCBub2RlKTtcbiAgICAgIGlmIChub2RlLmNvZGUpIHRoaXMucmVuZGVyTm9kZUNvZGUoY29udGVudCwgbm9kZSk7XG5cbiAgICAgIGlmIChub2RlLnRhZ3M/Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCB0YWdzID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtdGFnc1wiIH0pO1xuICAgICAgICBub2RlLnRhZ3Muc2xpY2UoMCwgNCkuZm9yRWFjaCgodGFnKSA9PiB0YWdzLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLW5vZGUtdGFnXCIsIHRleHQ6IGAjJHt0YWd9YCB9KSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1Rhc2tQcm9ncmVzcyAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBwcm9ncmVzcyA9IGdldFRhc2tQcm9ncmVzcyhub2RlKTtcbiAgICAgICAgaWYgKHByb2dyZXNzLnRvdGFsKSB7XG4gICAgICAgICAgY29uc3QgcGVyY2VudCA9IE1hdGgucm91bmQoKHByb2dyZXNzLmRvbmUgLyBwcm9ncmVzcy50b3RhbCkgKiAxMDApO1xuICAgICAgICAgIGNvbnN0IHByb2dyZXNzRWwgPSBub2RlRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YXNrLXByb2dyZXNzXCIsIGF0dHI6IHsgdGl0bGU6IGAke3Byb2dyZXNzLmRvbmV9LyR7cHJvZ3Jlc3MudG90YWx9IFx1NEUyQVx1NEVGQlx1NTJBMVx1NURGMlx1NUI4Q1x1NjIxMGAgfSB9KTtcbiAgICAgICAgICBwcm9ncmVzc0VsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGFzay1wcm9ncmVzcy1iYXJcIiwgYXR0cjogeyBzdHlsZTogYHdpZHRoOiR7cGVyY2VudH0lYCB9IH0pO1xuICAgICAgICAgIHByb2dyZXNzRWwuY3JlYXRlU3Bhbih7IHRleHQ6IGAke3BlcmNlbnR9JWAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGZvbGQgPSBub2RlRWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLWZvbGQtYnV0dG9uXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IG5vZGUuY29sbGFwc2VkID8gXCJcdTVDNTVcdTVGMDBcIiA6IFwiXHU2NTM2XHU4RDc3XCIgfSB9KTtcbiAgICAgICAgZm9sZC5zZXRUZXh0KG5vZGUuY29sbGFwc2VkID8gYCske25vZGUuY2hpbGRyZW4ubGVuZ3RofWAgOiBcIlx1MjIxMlwiKTtcbiAgICAgICAgZm9sZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpO1xuICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGFwc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxpbmsgPSB0aGlzLmdldE5vZGVMaW5rKG5vZGUpO1xuICAgICAgaWYgKGxpbmspIHtcbiAgICAgICAgY29uc3QgbGlua0J1dHRvbiA9IG5vZGVFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbWMtbm9kZS1saW5rXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGBcdTYyNTNcdTVGMDAgJHtsaW5rfWAgfSB9KTtcbiAgICAgICAgc2V0SWNvbihsaW5rQnV0dG9uLCBcImV4dGVybmFsLWxpbmtcIik7XG4gICAgICAgIGxpbmtCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTGluayhsaW5rKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgIHRoaXMuZWRpdFNlbGVjdGVkKCk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgIHRoaXMub3BlbkNvbnRleHRNZW51KGV2ZW50KTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuZHJhZ2dpbmdJZCA9IG5vZGUuaWQ7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlcj8uc2V0RGF0YShcInRleHQvcGxhaW5cIiwgbm9kZS5pZCk7XG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XG4gICAgICAgIG5vZGVFbC5hZGRDbGFzcyhcImlzLWRyYWdnaW5nXCIpO1xuICAgICAgfSk7XG4gICAgICBub2RlRWwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY2FuUmVwYXJlbnQodGhpcy5kcmFnZ2luZ0lkLCBub2RlLmlkKSkgcmV0dXJuO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgICAgICBub2RlRWwuYWRkQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKCkgPT4gbm9kZUVsLnJlbW92ZUNsYXNzKFwiaXMtZHJvcC10YXJnZXRcIikpO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBub2RlRWwucmVtb3ZlQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKTtcbiAgICAgICAgY29uc3QgZHJhZ2dlZElkID0gdGhpcy5kcmFnZ2luZ0lkID8/IGV2ZW50LmRhdGFUcmFuc2Zlcj8uZ2V0RGF0YShcInRleHQvcGxhaW5cIikgPz8gbnVsbDtcbiAgICAgICAgaWYgKGRyYWdnZWRJZCkgdGhpcy5yZXBhcmVudE5vZGUoZHJhZ2dlZElkLCBub2RlLmlkKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5kcmFnZ2luZ0lkID0gbnVsbDtcbiAgICAgICAgdGhpcy5ub2Rlc0xheWVyRWwucXVlcnlTZWxlY3RvckFsbChcIi5pcy1kcmFnZ2luZywgLmlzLWRyb3AtdGFyZ2V0XCIpLmZvckVhY2goKGVsZW1lbnQpID0+IGVsZW1lbnQucmVtb3ZlQ2xhc3NlcyhbXCJpcy1kcmFnZ2luZ1wiLCBcImlzLWRyb3AtdGFyZ2V0XCJdKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVRyYW5zZm9ybSgpOiB2b2lkIHtcbiAgICBjb25zdCByZWN0ID0gdGhpcy52aWV3cG9ydEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHRoaXMuc2NlbmVFbC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7cmVjdC53aWR0aCAvIDIgKyB0aGlzLnBhblh9cHgsICR7cmVjdC5oZWlnaHQgLyAyICsgdGhpcy5wYW5ZfXB4KSBzY2FsZSgke3RoaXMuem9vbX0pYDtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLXpvb21cIiwgU3RyaW5nKHRoaXMuem9vbSkpO1xuICAgIHRoaXMuem9vbVN0YXR1c0VsPy5zZXRUZXh0KGAke01hdGgucm91bmQodGhpcy56b29tICogMTAwKX0lYCk7XG4gIH1cblxuICBwcml2YXRlIHNlbGVjdE5vZGUoaWQ6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSBpZCA/PyBcIlwiO1xuICAgIHRoaXMubm9kZXNMYXllckVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubW1jLW5vZGUuaXMtc2VsZWN0ZWRcIikuZm9yRWFjaCgoZWxlbWVudCkgPT4gZWxlbWVudC5yZW1vdmVDbGFzcyhcImlzLXNlbGVjdGVkXCIpKTtcbiAgICBpZiAoaWQpIHRoaXMubm9kZXNMYXllckVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KGAubW1jLW5vZGVbZGF0YS1ub2RlLWlkPVwiJHtDU1MuZXNjYXBlKGlkKX1cIl1gKT8uYWRkQ2xhc3MoXCJpcy1zZWxlY3RlZFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgc2VsZWN0ZWROb2RlKCk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRJZCA/IGZpbmROb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgdGhpcy5zZWxlY3RlZElkKSA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvbmZpZ3VyZWROb2RlKHRleHQgPSBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiKTogTWluZE1hcE5vZGUge1xuICAgIGNvbnN0IG5vZGUgPSBjcmVhdGVOb2RlKHRleHQpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSAhPT0gXCJyb3VuZGVkXCIpIG5vZGUuc3R5bGUgPSB7IHNoYXBlOiB0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSB9O1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRDaGlsZCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWROb2RlKCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gbm9kZS5pZDtcbiAgICB9KTtcbiAgICB0aGlzLmVkaXRTZWxlY3RlZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRTaWJsaW5nKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8IHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWROb2RlKCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZCkgPT4gY2hpbGQuaWQgPT09IHNlbGVjdGVkLmlkKTtcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXggKyAxLCAwLCBub2RlKTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IG5vZGUuaWQ7XG4gICAgfSk7XG4gICAgdGhpcy5lZGl0U2VsZWN0ZWQoKTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdFNlbGVjdGVkKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkKSByZXR1cm47XG4gICAgbGV0IGhpc3RvcnlDYXB0dXJlZCA9IGZhbHNlO1xuICAgIG5ldyBOb2RlRWRpdE1vZGFsKHRoaXMuYXBwLCBzZWxlY3RlZCwgdGhpcy5vcHRpb25zLmRlZmF1bHROb2RlU2hhcGUsIHtcbiAgICAgIHJlc29sdmVJbWFnZTogdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlLFxuICAgICAgb25TYXZlUGFzdGVkSW1hZ2U6IHRoaXMuY2FsbGJhY2tzLm9uU2F2ZVBhc3RlZEltYWdlLFxuICAgICAgZ2V0SW1hZ2VIb3N0czogdGhpcy5jYWxsYmFja3MuZ2V0SW1hZ2VIb3N0cyxcbiAgICAgIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzOiB0aGlzLmNhbGxiYWNrcy5nZXREZWZhdWx0VXBsb2FkSG9zdElkcyxcbiAgICAgIG9uVXBsb2FkSW1hZ2U6IHRoaXMuY2FsbGJhY2tzLm9uVXBsb2FkSW1hZ2UsXG4gICAgICBvblJlYWRJbWFnZVNvdXJjZTogdGhpcy5jYWxsYmFja3Mub25SZWFkSW1hZ2VTb3VyY2VcbiAgICB9LCAodmFsdWVzKSA9PiB7XG4gICAgICAvLyBBIGNvbnRpbnVvdXNseSBvcGVuIGVkaXRvciBtYXkgYXV0b3NhdmUgbWFueSB0aW1lcy4gQ2FwdHVyZSBvbmUgdW5kb1xuICAgICAgLy8gc25hcHNob3QgZm9yIHRoZSB3aG9sZSBlZGl0aW5nIHNlc3Npb24gaW5zdGVhZCBvZiBvbmUgc25hcHNob3QgcGVyIGtleXByZXNzLlxuICAgICAgaWYgKCFoaXN0b3J5Q2FwdHVyZWQpIHtcbiAgICAgICAgdGhpcy5oaXN0b3J5LnB1c2goSlNPTi5zdHJpbmdpZnkodGhpcy5kb2N1bWVudCkpO1xuICAgICAgICB0aGlzLnRyaW1IaXN0b3J5KCk7XG4gICAgICAgIHRoaXMuZnV0dXJlID0gW107XG4gICAgICAgIGhpc3RvcnlDYXB0dXJlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBzZWxlY3RlZC5jb250ZW50ID0gdmFsdWVzLmNvbnRlbnQ7XG4gICAgICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyhzZWxlY3RlZCk7XG4gICAgICBzZWxlY3RlZC5ub3RlID0gdmFsdWVzLm5vdGUgfHwgdW5kZWZpbmVkO1xuICAgICAgc2VsZWN0ZWQubGluayA9IHZhbHVlcy5saW5rIHx8IHVuZGVmaW5lZDtcbiAgICAgIHNlbGVjdGVkLmljb24gPSB2YWx1ZXMuaWNvbiB8fCB1bmRlZmluZWQ7XG4gICAgICBzZWxlY3RlZC50YWdzID0gdmFsdWVzLnRhZ3MubGVuZ3RoID8gdmFsdWVzLnRhZ3MgOiB1bmRlZmluZWQ7XG4gICAgICBzZWxlY3RlZC50YXNrID0gdmFsdWVzLnRhc2s7XG4gICAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgICAgY29sb3I6IHZhbHVlcy5jb2xvcixcbiAgICAgICAgdGV4dENvbG9yOiB2YWx1ZXMudGV4dENvbG9yLFxuICAgICAgICBib3JkZXJDb2xvcjogdmFsdWVzLmJvcmRlckNvbG9yLFxuICAgICAgICBib3JkZXJXaWR0aDogdmFsdWVzLmJvcmRlcldpZHRoLFxuICAgICAgICBzaGFwZTogdmFsdWVzLnNoYXBlLFxuICAgICAgICBib2xkOiB2YWx1ZXMuYm9sZCxcbiAgICAgICAgaXRhbGljOiB2YWx1ZXMuaXRhbGljLFxuICAgICAgICB1bmRlcmxpbmU6IHZhbHVlcy51bmRlcmxpbmUsXG4gICAgICAgIGZvbnRTaXplOiB2YWx1ZXMuZm9udFNpemVcbiAgICAgIH07XG4gICAgICBzZWxlY3RlZC5zdHlsZSA9IE9iamVjdC52YWx1ZXMoc3R5bGUpLnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IHN0eWxlIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgICAgY29uc3QgdGl0bGUgPSBub2RlUGxhaW5UZXh0KHNlbGVjdGVkKTtcbiAgICAgICAgaWYgKHRpdGxlKSB0aGlzLmRvY3VtZW50LnRpdGxlID0gdGl0bGU7XG4gICAgICB9XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgZGVsZXRlU2VsZWN0ZWQoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQgfHwgc2VsZWN0ZWQuaWQgPT09IHRoaXMuZG9jdW1lbnQucm9vdC5pZCkge1xuICAgICAgbmV3IE5vdGljZShcIlx1NjgzOVx1ODI4Mlx1NzBCOVx1NEUwRFx1ODBGRFx1NTIyMFx1OTY2NFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICByZW1vdmVOb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gcGFyZW50Py5pZCA/PyB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZUNvbGxhcHNlKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8ICFzZWxlY3RlZC5jaGlsZHJlbi5sZW5ndGgpIHJldHVybjtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLmNvbGxhcHNlZCA9ICFzZWxlY3RlZC5jb2xsYXBzZWQ7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjeWNsZVRhc2soKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICBjb25zdCBuZXh0OiBSZWNvcmQ8c3RyaW5nLCBUYXNrU3RhdHVzIHwgdW5kZWZpbmVkPiA9IHsgXCJcIjogXCJ0b2RvXCIsIHRvZG86IFwiZG9pbmdcIiwgZG9pbmc6IFwiZG9uZVwiLCBkb25lOiB1bmRlZmluZWQgfTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLnRhc2sgPSBuZXh0W3NlbGVjdGVkLnRhc2sgPz8gXCJcIl07IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2dnbGVMYXlvdXQoKTogdm9pZCB7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4geyB0aGlzLmRvY3VtZW50LmxheW91dCA9IHRoaXMuZG9jdW1lbnQubGF5b3V0ID09PSBcInJpZ2h0XCIgPyBcImJhbGFuY2VkXCIgOiBcInJpZ2h0XCI7IH0pO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDIwKTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdEFwcGVhcmFuY2UoKTogdm9pZCB7XG4gICAgbmV3IEFwcGVhcmFuY2VNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5nZXRBcHBlYXJhbmNlKCksXG4gICAgICAoYXBwZWFyYW5jZSkgPT4gdGhpcy5tdXRhdGUoKCkgPT4geyB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UgPSBhcHBlYXJhbmNlOyB9KSxcbiAgICAgICgpID0+IHRoaXMubXV0YXRlKCgpID0+IHsgdGhpcy5kb2N1bWVudC5hcHBlYXJhbmNlID0gdW5kZWZpbmVkOyB9KVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBlZGl0VGFibGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBuZXcgVGFibGVFZGl0TW9kYWwodGhpcy5hcHAsIHNlbGVjdGVkLnRhYmxlLCAodGFibGUpID0+IHtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQudGFibGUgPSB0YWJsZTsgfSk7XG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb252ZXJ0Q2hpbGRyZW5Ub1RhYmxlKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgY29uc3QgdGFibGUgPSBjaGlsZHJlblRvVGFibGUoc2VsZWN0ZWQpO1xuICAgIGlmICghdGFibGUpIHsgbmV3IE5vdGljZShcIlx1NUY1M1x1NTI0RFx1ODI4Mlx1NzBCOVx1NkNBMVx1NjcwOVx1NTNFRlx1OEY2Q1x1NjM2Mlx1NzY4NFx1NUI1MFx1ODI4Mlx1NzBCOVwiKTsgcmV0dXJuOyB9XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQudGFibGUgPSB0YWJsZTtcbiAgICAgIHNlbGVjdGVkLmNvbGxhcHNlZCA9IHRydWU7XG4gICAgfSk7XG4gICAgbmV3IE5vdGljZShcIlx1NURGMlx1NzUxRlx1NjIxMFx1NUI1MFx1ODI4Mlx1NzBCOVx1ODg2OFx1NjgzQ1x1RkYxQlx1NTM5Rlx1NUI1MFx1ODI4Mlx1NzBCOVx1NURGMlx1NEZERFx1NzU1OVx1NUU3Nlx1NjUzNlx1OEQ3N1wiKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlVGFibGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQ/LnRhYmxlKSByZXR1cm47XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQudGFibGUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoc2VsZWN0ZWQuY2hpbGRyZW4ubGVuZ3RoKSBzZWxlY3RlZC5jb2xsYXBzZWQgPSBmYWxzZTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdENvZGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBuZXcgQ29kZUVkaXRNb2RhbCh0aGlzLmFwcCwgc2VsZWN0ZWQuY29kZSwgKGNvZGUpID0+IHtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29kZSA9IGNvZGU7IH0pO1xuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlQ29kZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZD8uY29kZSkgcmV0dXJuO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29kZSA9IHVuZGVmaW5lZDsgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZU9yT3BlblN1Ym1hcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGlmIChzZWxlY3RlZC5zdWJtYXApIHtcbiAgICAgIGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uT3Blbk1pbmRNYXAoc2VsZWN0ZWQuc3VibWFwLnBhdGgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3VibWFwID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25DcmVhdGVTdWJtYXAoc2VsZWN0ZWQpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5zdWJtYXAgPSBzdWJtYXA7IH0pO1xuICAgICAgYXdhaXQgdGhpcy5jYWxsYmFja3Mub25PcGVuTWluZE1hcChzdWJtYXAucGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBjcmVhdGUgc3VibWFwIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1MjFCXHU1RUZBXHU1QjUwXHU1QkZDXHU1NkZFXHU1OTMxXHU4RDI1XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTm9kZVRhYmxlKGNvbnRlbnQ6IEhUTUxFbGVtZW50LCBub2RlOiBNaW5kTWFwTm9kZSk6IHZvaWQge1xuICAgIGlmICghbm9kZS50YWJsZSkgcmV0dXJuO1xuICAgIGNvbnN0IHdyYXAgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS10YWJsZS13cmFwXCIgfSk7XG4gICAgY29uc3QgdGFibGUgPSB3cmFwLmNyZWF0ZUVsKFwidGFibGVcIiwgeyBjbHM6IFwibW1jLW5vZGUtdGFibGVcIiB9KTtcbiAgICBjb25zdCBoZWFkID0gdGFibGUuY3JlYXRlRWwoXCJ0aGVhZFwiKS5jcmVhdGVFbChcInRyXCIpO1xuICAgIG5vZGUudGFibGUuaGVhZGVycy5mb3JFYWNoKChoZWFkZXIsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBjZWxsID0gaGVhZC5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogaGVhZGVyIHx8IGBcdTUyMTcgJHtpbmRleCArIDF9YCB9KTtcbiAgICAgIGNlbGwuc3R5bGUudGV4dEFsaWduID0gbm9kZS50YWJsZT8uYWxpZ25tZW50cz8uW2luZGV4XSA/PyBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCBib2R5ID0gdGFibGUuY3JlYXRlRWwoXCJ0Ym9keVwiKTtcbiAgICBub2RlLnRhYmxlLnJvd3MuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICBjb25zdCB0ciA9IGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICAgIG5vZGUudGFibGUhLmhlYWRlcnMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHRyLmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiByb3dbaW5kZXhdID8/IFwiXCIgfSk7XG4gICAgICAgIGNlbGwuc3R5bGUudGV4dEFsaWduID0gbm9kZS50YWJsZT8uYWxpZ25tZW50cz8uW2luZGV4XSA/PyBcImxlZnRcIjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoZXZlbnQpID0+IGV2ZW50LnByZXZlbnREZWZhdWx0KCkpO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpOyB0aGlzLmVkaXRUYWJsZSgpOyB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTm9kZUNvZGUoY29udGVudDogSFRNTEVsZW1lbnQsIG5vZGU6IE1pbmRNYXBOb2RlKTogdm9pZCB7XG4gICAgaWYgKCFub2RlLmNvZGUpIHJldHVybjtcbiAgICBjb25zdCBibG9jayA9IGNvbnRlbnQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2RlLWJsb2NrXCIgfSk7XG4gICAgY29uc3QgaGVhZGVyID0gYmxvY2suY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2RlLWhlYWRlclwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVTcGFuKHsgdGV4dDogbm9kZS5jb2RlLmxhbmd1YWdlIHx8IFwiY29kZVwiIH0pO1xuICAgIGNvbnN0IGNvcHkgPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb25cIiwgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJcdTU5MERcdTUyMzZcdTRFRTNcdTc4MDFcIiB9IH0pO1xuICAgIHNldEljb24oY29weSwgXCJjb3B5XCIpO1xuICAgIGNvcHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KG5vZGUuY29kZSEuY29kZSkudGhlbigoKSA9PiBuZXcgTm90aWNlKFwiXHU0RUUzXHU3ODAxXHU1REYyXHU1OTBEXHU1MjM2XCIpKTtcbiAgICB9KTtcbiAgICBjb25zdCByZW5kZXJlZCA9IGJsb2NrLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29kZS1yZW5kZXJlZCBtYXJrZG93bi1yZW5kZXJlZFwiIH0pO1xuICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25SZW5kZXJDb2RlKG5vZGUuY29kZSwgcmVuZGVyZWQpO1xuICAgIGJsb2NrLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCAoZXZlbnQpID0+IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpKTtcbiAgICBibG9jay5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgYmxvY2suYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpOyB0aGlzLmVkaXRDb2RlKCk7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVQYXN0ZShldmVudDogQ2xpcGJvYXJkRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKHRhcmdldC5tYXRjaGVzKFwiaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QsIFtjb250ZW50ZWRpdGFibGU9J3RydWUnXVwiKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRhdGEgPSBldmVudC5jbGlwYm9hcmREYXRhO1xuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuICAgIGNvbnN0IGltYWdlSXRlbSA9IEFycmF5LmZyb20oZGF0YS5pdGVtcykuZmluZCgoaXRlbSkgPT4gaXRlbS5raW5kID09PSBcImZpbGVcIiAmJiBpdGVtLnR5cGUuc3RhcnRzV2l0aChcImltYWdlL1wiKSk7XG4gICAgaWYgKGltYWdlSXRlbSkge1xuICAgICAgY29uc3QgYmxvYiA9IGltYWdlSXRlbS5nZXRBc0ZpbGUoKTtcbiAgICAgIGlmICghYmxvYikgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBleHRlbnNpb24gPSBibG9iLnR5cGUuc3BsaXQoXCIvXCIpWzFdPy5yZXBsYWNlKFwianBlZ1wiLCBcImpwZ1wiKSB8fCBcInBuZ1wiO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGBtaW5kbWFwLWltYWdlLiR7ZXh0ZW5zaW9ufWA7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vblNhdmVQYXN0ZWRJbWFnZShibG9iLCBmaWxlbmFtZSk7XG4gICAgICAgIGNvbnN0IGltYWdlQmxvY2s6IE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9IHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBwYXRoLCBsb2NhbFNvdXJjZTogcGF0aCB9O1xuICAgICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Moc2VsZWN0ZWQpO1xuICAgICAgICAgIGJsb2Nrcy5wdXNoKGltYWdlQmxvY2spO1xuICAgICAgICAgIHNlbGVjdGVkLmNvbnRlbnQgPSBibG9ja3M7XG4gICAgICAgICAgc3luY05vZGVMZWdhY3lGaWVsZHMoc2VsZWN0ZWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc2NoZWR1bGVkID0gdGhpcy5jYWxsYmFja3Mub25TY2hlZHVsZUF1dG9VcGxvYWQoc2VsZWN0ZWQuaWQsIGltYWdlQmxvY2suaWQsIHBhdGgsIGZpbGVuYW1lKTtcbiAgICAgICAgbmV3IE5vdGljZShzY2hlZHVsZWQgPyBgXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU1QjU4XHVGRjBDXHU3QjQ5XHU1Rjg1XHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHVGRjFBJHtwYXRofWAgOiBgXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU1QjU4XHVGRjFBJHtwYXRofWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIHBhc3RlIGltYWdlIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTU5MzFcdThEMjVcIik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IGRhdGEuZ2V0RGF0YShcInRleHQvcGxhaW5cIik7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkgcmV0dXJuO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgY29uc3QgdGFibGUgPSBwYXJzZU1hcmtkb3duVGFibGUodGV4dCk7XG4gICAgaWYgKHRhYmxlKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC50YWJsZSA9IHRhYmxlOyB9KTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVERjJcdThCQzZcdTUyMkJcdTVFNzZcdTYzRDJcdTUxNjUgTWFya2Rvd24gXHU4ODY4XHU2ODNDXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjb2RlID0gcGFyc2VGZW5jZWRDb2RlKHRleHQpO1xuICAgIGlmIChjb2RlKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5jb2RlID0gY29kZTsgfSk7XG4gICAgICBuZXcgTm90aWNlKGBcdTVERjJcdThCQzZcdTUyMkJcdTVFNzZcdTYzRDJcdTUxNjUke2NvZGUubGFuZ3VhZ2UgPyBgICR7Y29kZS5sYW5ndWFnZX1gIDogXCJcIn1cdTRFRTNcdTc4MDFgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYnJhbmNoID0gdGhpcy5wYXJzZUNsaXBib2FyZE5vZGUodGV4dCk7XG4gICAgaWYgKGJyYW5jaCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IGNsb25lID0gY2xvbmVOb2RlV2l0aEZyZXNoSWRzKGJyYW5jaCk7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLmNvbGxhcHNlZCA9IGZhbHNlOyBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKGNsb25lKTsgdGhpcy5zZWxlY3RlZElkID0gY2xvbmUuaWQ7IH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb3BlblNlbGVjdGVkTGluaygpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgIGNvbnN0IGxpbmsgPSB0aGlzLmdldE5vZGVMaW5rKHNlbGVjdGVkKTtcbiAgICBpZiAoIWxpbmspIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVGNTNcdTUyNERcdTgyODJcdTcwQjlcdTZDQTFcdTY3MDlcdTk0RkVcdTYzQTVcdUZGMUJcdTUzRUZcdTYzMDkgRjIgXHU2REZCXHU1MkEwXHU5NEZFXHU2M0E1XHU2MjE2XHU1NzI4XHU2NTg3XHU1QjU3XHU0RTJEXHU1MTk5XHU1MTY1IFtbXHU3QjE0XHU4QkIwXHU1NDBEXV1cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTGluayhsaW5rKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Tm9kZUxpbmsobm9kZTogTWluZE1hcE5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gbm9kZS5saW5rPy50cmltKCkgfHwgZXh0cmFjdEZpcnN0V2lraUxpbmsobm9kZVBsYWluVGV4dChub2RlKSkgfHwgZXh0cmFjdEZpcnN0V2lraUxpbmsobm9kZS5ub3RlID8/IFwiXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzaG93T3V0bGluZSgpOiB2b2lkIHtcbiAgICBjb25zdCBtYXJrZG93biA9IGRvY3VtZW50VG9NYXJrZG93bih0aGlzLmRvY3VtZW50KTtcbiAgICBuZXcgT3V0bGluZU1vZGFsKHRoaXMuYXBwLCBtYXJrZG93biwgKCkgPT4gdm9pZCB0aGlzLmNhbGxiYWNrcy5vbkV4cG9ydE1hcmtkb3duKG1hcmtkb3duKSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBzaG93SnNvblRyYW5zZmVyKCk6IHZvaWQge1xuICAgIG5ldyBKc29uVHJhbnNmZXJNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5nZXREb2N1bWVudCgpLFxuICAgICAgKGRvY3VtZW50KSA9PiB0aGlzLnJlcGxhY2VEb2N1bWVudChkb2N1bWVudCksXG4gICAgICAoanNvbikgPT4gdm9pZCB0aGlzLmNhbGxiYWNrcy5vbkV4cG9ydEpzb24oanNvbilcbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgb3BlblNlYXJjaCgpOiB2b2lkIHtcbiAgICBuZXcgU2VhcmNoTm9kZXNNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgZmxhdHRlbk5vZGVzKHRoaXMuZG9jdW1lbnQucm9vdCksXG4gICAgICAocXVlcnkpID0+IHtcbiAgICAgICAgdGhpcy5zZWFyY2hRdWVyeSA9IHF1ZXJ5O1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSxcbiAgICAgIChub2RlKSA9PiB0aGlzLmZvY3VzTm9kZShub2RlLmlkKVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb2N1c05vZGUoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGFuY2VzdG9ycyA9IGZpbmRBbmNlc3RvcnModGhpcy5kb2N1bWVudC5yb290LCBpZCk7XG4gICAgY29uc3QgY29sbGFwc2VkID0gYW5jZXN0b3JzLmZpbHRlcigobm9kZSkgPT4gbm9kZS5jb2xsYXBzZWQpO1xuICAgIGlmIChjb2xsYXBzZWQubGVuZ3RoKSB7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiBjb2xsYXBzZWQuZm9yRWFjaCgobm9kZSkgPT4geyBub2RlLmNvbGxhcHNlZCA9IGZhbHNlOyB9KSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGlkO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5jZW50ZXJOb2RlKGlkKSwgMjApO1xuICB9XG5cbiAgcHJpdmF0ZSBjZW50ZXJOb2RlKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMubGF5b3V0LmJ5SWQuZ2V0KGlkKTtcbiAgICBpZiAoIXBvc2l0aW9uKSByZXR1cm47XG4gICAgdGhpcy5wYW5YID0gLXBvc2l0aW9uLnggKiB0aGlzLnpvb207XG4gICAgdGhpcy5wYW5ZID0gLXBvc2l0aW9uLnkgKiB0aGlzLnpvb207XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBvcGVuQ29udGV4dE1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU2REZCXHU1MkEwXHU1QjUwXHU4MjgyXHU3MEI5XCIpLnNldEljb24oXCJwbHVzLWNpcmNsZVwiKS5vbkNsaWNrKCgpID0+IHRoaXMuYWRkQ2hpbGQoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NkRGQlx1NTJBMFx1NTQwQ1x1N0VBN1x1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwibGlzdC1wbHVzXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5hZGRTaWJsaW5nKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcInBlbmNpbFwiKS5vbkNsaWNrKCgpID0+IHRoaXMuZWRpdFNlbGVjdGVkKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcIikuc2V0SWNvbihcImNvcHktcGx1c1wiKS5vbkNsaWNrKCgpID0+IHRoaXMuZHVwbGljYXRlU2VsZWN0ZWQoKSkpO1xuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKHNlbGVjdGVkPy50YWJsZSA/IFwiXHU3RjE2XHU4RjkxXHU4ODY4XHU2ODNDXCIgOiBcIlx1NjNEMlx1NTE2NVx1ODg2OFx1NjgzQ1wiKS5zZXRJY29uKFwidGFibGUtMlwiKS5vbkNsaWNrKCgpID0+IHRoaXMuZWRpdFRhYmxlKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTVDMDZcdTVCNTBcdTgyODJcdTcwQjlcdTc1MUZcdTYyMTBcdTg4NjhcdTY4M0NcIikuc2V0SWNvbihcInRhYmxlLXByb3BlcnRpZXNcIikub25DbGljaygoKSA9PiB0aGlzLmNvbnZlcnRDaGlsZHJlblRvVGFibGUoKSkpO1xuICAgIGlmIChzZWxlY3RlZD8udGFibGUpIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NzlGQlx1OTY2NFx1ODg2OFx1NjgzQ1wiKS5zZXRJY29uKFwidGFibGUtMlwiKS5vbkNsaWNrKCgpID0+IHRoaXMucmVtb3ZlVGFibGUoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShzZWxlY3RlZD8uY29kZSA/IFwiXHU3RjE2XHU4RjkxXHU0RUUzXHU3ODAxXCIgOiBcIlx1NjNEMlx1NTE2NVx1NEVFM1x1NzgwMVwiKS5zZXRJY29uKFwiY29kZS0yXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5lZGl0Q29kZSgpKSk7XG4gICAgaWYgKHNlbGVjdGVkPy5jb2RlKSBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTc5RkJcdTk2NjRcdTRFRTNcdTc4MDFcIikuc2V0SWNvbihcImVyYXNlclwiKS5vbkNsaWNrKCgpID0+IHRoaXMucmVtb3ZlQ29kZSgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKHNlbGVjdGVkPy5zdWJtYXAgPyBcIlx1OEZEQlx1NTE2NVx1NUI1MFx1NUJGQ1x1NTZGRVwiIDogXCJcdTUyMUJcdTVFRkFcdTVCNTBcdTVCRkNcdTU2RkVcIikuc2V0SWNvbihcIm5ldHdvcmtcIikub25DbGljaygoKSA9PiB2b2lkIHRoaXMuY3JlYXRlT3JPcGVuU3VibWFwKCkpKTtcbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NTkwRFx1NTIzNlx1NTIwNlx1NjUyRlwiKS5zZXRJY29uKFwiY29weVwiKS5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5jb3B5U2VsZWN0ZWRCcmFuY2goKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1N0M5OFx1OEQzNFx1NEUzQVx1NUI1MFx1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwiY2xpcGJvYXJkLXBhc3RlXCIpLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLnBhc3RlQXNDaGlsZCgpKSk7XG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoYFx1NEVGQlx1NTJBMVx1NzJCNlx1NjAwMVx1RkYxQSR7c2VsZWN0ZWQ/LnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTVERjJcdTVCOENcdTYyMTBcIiA6IHNlbGVjdGVkPy50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiIDogc2VsZWN0ZWQ/LnRhc2sgPT09IFwidG9kb1wiID8gXCJcdTVGODVcdTUyOUVcIiA6IFwiXHU2NUUwXCJ9YCkuc2V0SWNvbihcImNpcmNsZS1jaGVjay1iaWdcIikub25DbGljaygoKSA9PiB0aGlzLmN5Y2xlVGFzaygpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU1QzU1XHU1RjAwL1x1NjUzNlx1OEQ3N1wiKS5zZXRJY29uKFwiZm9sZC12ZXJ0aWNhbFwiKS5vbkNsaWNrKCgpID0+IHRoaXMudG9nZ2xlQ29sbGFwc2UoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NjI1M1x1NUYwMFx1OTRGRVx1NjNBNVwiKS5zZXRJY29uKFwibGlua1wiKS5vbkNsaWNrKCgpID0+IHRoaXMub3BlblNlbGVjdGVkTGluaygpKSk7XG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTUyMjBcdTk2NjRcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcInRyYXNoLTJcIikub25DbGljaygoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkpKTtcbiAgICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb3B5U2VsZWN0ZWRCcmFuY2goKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQpIHJldHVybiBmYWxzZTtcbiAgICB0aGlzLmJyYW5jaENsaXBib2FyZCA9IGNsb25lRG9jdW1lbnQoeyB2ZXJzaW9uOiA5LCB0aXRsZTogbm9kZVBsYWluVGV4dChzZWxlY3RlZCkgfHwgXCJcdTU2RkVcdTcyNDdcdTgyODJcdTcwQjlcIiwgbGF5b3V0OiBcInJpZ2h0XCIsIHRoZW1lOiBcImF1dG9cIiwgcm9vdDogc2VsZWN0ZWQgfSkucm9vdDtcbiAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcIm1pbmRtYXAtc3R1ZGlvLW5vZGVcIiwgdmVyc2lvbjogMSwgbm9kZTogc2VsZWN0ZWQgfSwgbnVsbCwgMik7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHBheWxvYWQpO1xuICAgICAgbmV3IE5vdGljZShcIlx1NURGMlx1NTkwRFx1NTIzNlx1ODI4Mlx1NzBCOVx1NTIwNlx1NjUyRlwiKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTgyODJcdTcwQjlcdTUyMDZcdTY1MkZcdTVERjJcdTU5MERcdTUyMzZcdTUyMzBcdTYzRDJcdTRFRjZcdTUxODVcdTkwRThcdTUyNkFcdThEMzRcdTY3N0ZcIik7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXN0ZUFzQ2hpbGQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBsZXQgc291cmNlTm9kZTogTWluZE1hcE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQucmVhZFRleHQoKTtcbiAgICAgIGlmICh0ZXh0LnRyaW0oKSkgc291cmNlTm9kZSA9IHRoaXMucGFyc2VDbGlwYm9hcmROb2RlKHRleHQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gQnJvd3NlciBjbGlwYm9hcmQgcGVybWlzc2lvbiBjYW4gYmUgdW5hdmFpbGFibGU7IHVzZSBpbnRlcm5hbCBjbGlwYm9hcmQuXG4gICAgfVxuICAgIHNvdXJjZU5vZGUgPz89IHRoaXMuYnJhbmNoQ2xpcGJvYXJkO1xuICAgIGlmICghc291cmNlTm9kZSkge1xuICAgICAgbmV3IE5vdGljZShcIlx1NTI2QVx1OEQzNFx1Njc3Rlx1NEUyRFx1NkNBMVx1NjcwOVx1NTNFRlx1N0M5OFx1OEQzNFx1NzY4NCBNaW5kTWFwIFx1ODI4Mlx1NzBCOVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2xvbmUgPSBjbG9uZU5vZGVXaXRoRnJlc2hJZHMoc291cmNlTm9kZSk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKGNsb25lKTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGNsb25lLmlkO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUNsaXBib2FyZE5vZGUodGV4dDogc3RyaW5nKTogTWluZE1hcE5vZGUgfCBudWxsIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZSh0ZXh0KSBhcyB7IHR5cGU/OiBzdHJpbmc7IG5vZGU/OiBQYXJ0aWFsPE1pbmRNYXBOb2RlPjsgcm9vdD86IFBhcnRpYWw8TWluZE1hcE5vZGU+OyB0ZXh0Pzogc3RyaW5nOyBjaGlsZHJlbj86IHVua25vd25bXSB9O1xuICAgICAgY29uc3QgaW5wdXQgPSAocGFyc2VkLnR5cGUgPT09IFwibWluZG1hcC1zdHVkaW8tbm9kZVwiIHx8IHBhcnNlZC50eXBlID09PSBcIm1tYy1saXRlLW5vZGVcIiB8fCBwYXJzZWQudHlwZSA9PT0gXCJzbW0tbGl0ZS1ub2RlXCIpICYmIHBhcnNlZC5ub2RlID8gcGFyc2VkLm5vZGUgOiBwYXJzZWQucm9vdCA/PyAodHlwZW9mIHBhcnNlZC50ZXh0ID09PSBcInN0cmluZ1wiICYmIEFycmF5LmlzQXJyYXkocGFyc2VkLmNoaWxkcmVuKSA/IHBhcnNlZCA6IG51bGwpO1xuICAgICAgaWYgKCFpbnB1dCkgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gbm9ybWFsaXplRG9jdW1lbnQoeyB0aXRsZTogaW5wdXQudGV4dCA/PyBcIlx1N0M5OFx1OEQzNFx1ODI4Mlx1NzBCOVwiLCByb290OiBpbnB1dCBhcyBNaW5kTWFwTm9kZSB9LCBpbnB1dC50ZXh0ID8/IFwiXHU3Qzk4XHU4RDM0XHU4MjgyXHU3MEI5XCIpLnJvb3Q7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGR1cGxpY2F0ZVNlbGVjdGVkKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8IHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdThCRjdcdTkwMDlcdTYyRTlcdTk3NUVcdTY4MzlcdTgyODJcdTcwQjlcdTU0MEVcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudCA9IGZpbmRQYXJlbnQodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgaWYgKCFwYXJlbnQpIHJldHVybjtcbiAgICBjb25zdCBjbG9uZSA9IGNsb25lTm9kZVdpdGhGcmVzaElkcyhzZWxlY3RlZCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZCkgPT4gY2hpbGQuaWQgPT09IHNlbGVjdGVkLmlkKTtcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXggKyAxLCAwLCBjbG9uZSk7XG4gICAgICB0aGlzLnNlbGVjdGVkSWQgPSBjbG9uZS5pZDtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY2FuUmVwYXJlbnQoZHJhZ2dlZElkOiBzdHJpbmcgfCBudWxsLCB0YXJnZXRJZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFkcmFnZ2VkSWQgfHwgZHJhZ2dlZElkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQgfHwgZHJhZ2dlZElkID09PSB0YXJnZXRJZCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGRyYWdnZWQgPSBmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGRyYWdnZWRJZCk7XG4gICAgcmV0dXJuIEJvb2xlYW4oZHJhZ2dlZCAmJiAhY29udGFpbnNOb2RlKGRyYWdnZWQsIHRhcmdldElkKSk7XG4gIH1cblxuICBwcml2YXRlIHJlcGFyZW50Tm9kZShkcmFnZ2VkSWQ6IHN0cmluZywgdGFyZ2V0SWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jYW5SZXBhcmVudChkcmFnZ2VkSWQsIHRhcmdldElkKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRyYWdnZWQgPSBmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGRyYWdnZWRJZCk7XG4gICAgY29uc3QgdGFyZ2V0ID0gZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCB0YXJnZXRJZCk7XG4gICAgaWYgKCFkcmFnZ2VkIHx8ICF0YXJnZXQpIHJldHVybjtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICByZW1vdmVOb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgZHJhZ2dlZElkKTtcbiAgICAgIHRhcmdldC5jaGlsZHJlbi5wdXNoKGRyYWdnZWQpO1xuICAgICAgdGFyZ2V0LmNvbGxhcHNlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gZHJhZ2dlZElkO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZXBsYWNlRG9jdW1lbnQoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCk6IHZvaWQge1xuICAgIHRoaXMuaGlzdG9yeS5wdXNoKEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnQpKTtcbiAgICB0aGlzLnRyaW1IaXN0b3J5KCk7XG4gICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICB0aGlzLmRvY3VtZW50ID0gY2xvbmVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLmZpdFRvVmlldygpLCAyMCk7XG4gIH1cblxuICBwcml2YXRlIG11dGF0ZShhY3Rpb246ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy50cmltSGlzdG9yeSgpO1xuICAgIHRoaXMuZnV0dXJlID0gW107XG4gICAgYWN0aW9uKCk7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSB0cmltSGlzdG9yeSgpOiB2b2lkIHtcbiAgICBjb25zdCBsaW1pdCA9IE1hdGgubWF4KDEwLCBNYXRoLm1pbig1MDAsIHRoaXMub3B0aW9ucy5oaXN0b3J5TGltaXQpKTtcbiAgICB3aGlsZSAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+IGxpbWl0KSB0aGlzLmhpc3Rvcnkuc2hpZnQoKTtcbiAgfVxuXG4gIHByaXZhdGUgdW5kbygpOiB2b2lkIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuaGlzdG9yeS5wb3AoKTtcbiAgICBpZiAoIXByZXZpb3VzKSByZXR1cm47XG4gICAgdGhpcy5mdXR1cmUucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy5kb2N1bWVudCA9IEpTT04ucGFyc2UocHJldmlvdXMpIGFzIE1pbmRNYXBEb2N1bWVudDtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWRvKCk6IHZvaWQge1xuICAgIGNvbnN0IG5leHQgPSB0aGlzLmZ1dHVyZS5wb3AoKTtcbiAgICBpZiAoIW5leHQpIHJldHVybjtcbiAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy50cmltSGlzdG9yeSgpO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBKU09OLnBhcnNlKG5leHQpIGFzIE1pbmRNYXBEb2N1bWVudDtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaXRUb1ZpZXcoKTogdm9pZCB7XG4gICAgY29uc3QgcmVjdCA9IHRoaXMudmlld3BvcnRFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWF4KDEsIHRoaXMubGF5b3V0Lm1heFggLSB0aGlzLmxheW91dC5taW5YICsgMTAwKTtcbiAgICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heCgxLCB0aGlzLmxheW91dC5tYXhZIC0gdGhpcy5sYXlvdXQubWluWSArIDEwMCk7XG4gICAgdGhpcy56b29tID0gdGhpcy5jbGFtcFpvb20oTWF0aC5taW4oKHJlY3Qud2lkdGggLSA0MCkgLyB3aWR0aCwgKHJlY3QuaGVpZ2h0IC0gNDApIC8gaGVpZ2h0LCAxLjI1KSk7XG4gICAgY29uc3QgY2VudGVyWCA9ICh0aGlzLmxheW91dC5taW5YICsgdGhpcy5sYXlvdXQubWF4WCkgLyAyO1xuICAgIGNvbnN0IGNlbnRlclkgPSAodGhpcy5sYXlvdXQubWluWSArIHRoaXMubGF5b3V0Lm1heFkpIC8gMjtcbiAgICB0aGlzLnBhblggPSAtY2VudGVyWCAqIHRoaXMuem9vbTtcbiAgICB0aGlzLnBhblkgPSAtY2VudGVyWSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICBwcml2YXRlIHNldFpvb20odmFsdWU6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuem9vbSA9IHRoaXMuY2xhbXBab29tKHZhbHVlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICBwcml2YXRlIGNsYW1wWm9vbSh2YWx1ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5taW4oMi41LCBNYXRoLm1heCgwLjIsIHZhbHVlKSk7XG4gIH1cblxuICBwcml2YXRlIG5hdmlnYXRlU2VsZWN0aW9uKGRpcmVjdGlvbjogXCJwYXJlbnRcIiB8IFwiY2hpbGRcIiB8IFwicHJldmlvdXNcIiB8IFwibmV4dFwiKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBsZXQgdGFyZ2V0OiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIGlmIChkaXJlY3Rpb24gPT09IFwicGFyZW50XCIpIHRhcmdldCA9IGZpbmRQYXJlbnQodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gXCJjaGlsZFwiKSB0YXJnZXQgPSBzZWxlY3RlZC5jaGlsZHJlblswXSA/PyBudWxsO1xuICAgIGlmIChkaXJlY3Rpb24gPT09IFwicHJldmlvdXNcIiB8fCBkaXJlY3Rpb24gPT09IFwibmV4dFwiKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBmaW5kUGFyZW50KHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IHBhcmVudC5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkKSA9PiBjaGlsZC5pZCA9PT0gc2VsZWN0ZWQuaWQpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSBkaXJlY3Rpb24gPT09IFwicHJldmlvdXNcIiA/IC0xIDogMTtcbiAgICAgICAgdGFyZ2V0ID0gcGFyZW50LmNoaWxkcmVuW2luZGV4ICsgb2Zmc2V0XSA/PyBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICB0aGlzLnNlbGVjdE5vZGUodGFyZ2V0LmlkKTtcbiAgICAgIHRoaXMuY2VudGVyTm9kZSh0YXJnZXQuaWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0Lm1hdGNoZXMoXCJpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCwgW2NvbnRlbnRlZGl0YWJsZT0ndHJ1ZSddXCIpKSByZXR1cm47XG4gICAgY29uc3QgbW9kID0gZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5O1xuICAgIGNvbnN0IGtleSA9IGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwic1wiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJmXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLm9wZW5TZWFyY2goKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwiZFwiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5kdXBsaWNhdGVTZWxlY3RlZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJjXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2b2lkIHRoaXMuY29weVNlbGVjdGVkQnJhbmNoKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcInhcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZvaWQgdGhpcy5jb3B5U2VsZWN0ZWRCcmFuY2goKS50aGVuKChjb3BpZWQpID0+IHsgaWYgKGNvcGllZCkgdGhpcy5kZWxldGVTZWxlY3RlZCgpOyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuY3ljbGVUYXNrKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcInpcIiAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnVuZG8oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKChtb2QgJiYga2V5ID09PSBcInlcIikgfHwgKG1vZCAmJiBldmVudC5zaGlmdEtleSAmJiBrZXkgPT09IFwielwiKSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMucmVkbygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZXZlbnQua2V5KSB7XG4gICAgICBjYXNlIFwiVGFiXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRW50ZXJcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5hZGRTaWJsaW5nKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkRlbGV0ZVwiOlxuICAgICAgY2FzZSBcIkJhY2tzcGFjZVwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmRlbGV0ZVNlbGVjdGVkKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkYyXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuZWRpdFNlbGVjdGVkKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy50b2dnbGVDb2xsYXBzZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0xlZnRcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcInBhcmVudFwiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dSaWdodFwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLm5hdmlnYXRlU2VsZWN0aW9uKFwiY2hpbGRcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkFycm93VXBcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcInByZXZpb3VzXCIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0Rvd25cIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcIm5leHRcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIitcIjpcbiAgICAgIGNhc2UgXCI9XCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gKiAxLjE1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiLVwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNldFpvb20odGhpcy56b29tIC8gMS4xNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIjBcIjpcbiAgICAgICAgaWYgKG1vZCkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5maXRUb1ZpZXcoKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgcGFyc2VGZW5jZWRDb2RlLFxuICBwYXJzZU1hcmtkb3duVGFibGUsXG4gIHRhYmxlVG9NYXJrZG93bixcbiAgdHlwZSBNaW5kTWFwQ29kZUJsb2NrLFxuICB0eXBlIE1pbmRNYXBUYWJsZSxcbiAgdHlwZSBUYWJsZUFsaWdubWVudFxufSBmcm9tIFwiLi9tb2RlbFwiO1xuXG5mdW5jdGlvbiBjbG9uZVRhYmxlKHRhYmxlOiBNaW5kTWFwVGFibGUgfCB1bmRlZmluZWQpOiBNaW5kTWFwVGFibGUge1xuICBpZiAoIXRhYmxlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlYWRlcnM6IFtcIlx1NTIxNyAxXCIsIFwiXHU1MjE3IDJcIl0sXG4gICAgICByb3dzOiBbW1wiXCIsIFwiXCJdLCBbXCJcIiwgXCJcIl1dLFxuICAgICAgYWxpZ25tZW50czogW1wibGVmdFwiLCBcImxlZnRcIl0sXG4gICAgICBzb3VyY2U6IFwibWFudWFsXCJcbiAgICB9O1xuICB9XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRhYmxlKSkgYXMgTWluZE1hcFRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgVGFibGVFZGl0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgdGFibGU6IE1pbmRNYXBUYWJsZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6ICh0YWJsZTogTWluZE1hcFRhYmxlKSA9PiB2b2lkO1xuICBwcml2YXRlIGdyaWRFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG1hcmtkb3duRWwhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCB0YWJsZTogTWluZE1hcFRhYmxlIHwgdW5kZWZpbmVkLCBzdWJtaXQ6ICh0YWJsZTogTWluZE1hcFRhYmxlKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnRhYmxlID0gY2xvbmVUYWJsZSh0YWJsZSk7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTg4NjhcdTY4M0NcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtdGFibGUtbW9kYWxcIik7XG5cbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlx1NTNFRlx1NEVFNVx1NzZGNFx1NjNBNVx1N0YxNlx1OEY5MVx1NTM1NVx1NTE0M1x1NjgzQ1x1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1N0M5OFx1OEQzNCBNYXJrZG93biBcdTg4NjhcdTY4M0NcdTU0MEVcdTcwQjlcdTUxRkJcdTIwMUNcdTg5RTNcdTY3OTAgTWFya2Rvd25cdTIwMURcdTMwMDJcIlxuICAgIH0pO1xuICAgIGRlc2NyaXB0aW9uLnNldEF0dHIoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XG5cbiAgICBjb25zdCB0b29sYmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YWJsZS10b29sYmFyXCIgfSk7XG4gICAgY29uc3QgYWRkUm93ID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTg4NENcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCByZW1vdmVSb3cgPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTIyMTIgXHU4ODRDXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgYWRkQ29sdW1uID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTUyMTdcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCByZW1vdmVDb2x1bW4gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTIyMTIgXHU1MjE3XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgdG9NYXJrZG93biA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NzUxRlx1NjIxMCBNYXJrZG93blwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuXG4gICAgdGhpcy5ncmlkRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXRhYmxlLWVkaXRvci1ncmlkXCIgfSk7XG4gICAgdGhpcy5yZW5kZXJHcmlkKCk7XG5cbiAgICBjb25zdCBtYXJrZG93bkxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiTWFya2Rvd24gXHU4ODY4XHU2ODNDXCIgfSk7XG4gICAgdGhpcy5tYXJrZG93bkVsID0gbWFya2Rvd25MYWJlbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJtbWMtdGFibGUtbWFya2Rvd25cIixcbiAgICAgIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwifCBcdTUyMTcgMSB8IFx1NTIxNyAyIHxcXG58IC0tLSB8IC0tLSB8XFxufCBcdTUxODVcdTVCQjkgfCBcdTUxODVcdTVCQjkgfFwiIH1cbiAgICB9KTtcbiAgICB0aGlzLm1hcmtkb3duRWwucm93cyA9IDg7XG4gICAgdGhpcy5tYXJrZG93bkVsLnZhbHVlID0gdGFibGVUb01hcmtkb3duKHRoaXMudGFibGUpO1xuICAgIGNvbnN0IHBhcnNlQnV0dG9uID0gbWFya2Rvd25MYWJlbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU4OUUzXHU2NzkwIE1hcmtkb3duXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG5cbiAgICBhZGRSb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIHRoaXMudGFibGUucm93cy5wdXNoKHRoaXMudGFibGUuaGVhZGVycy5tYXAoKCkgPT4gXCJcIikpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgcmVtb3ZlUm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5yb3dzLmxlbmd0aCkgdGhpcy50YWJsZS5yb3dzLnBvcCgpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgYWRkQ29sdW1uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCA+PSAxMikgeyBuZXcgTm90aWNlKFwiXHU2NzAwXHU1OTFBXHU2NTJGXHU2MzAxIDEyIFx1NTIxN1wiKTsgcmV0dXJuOyB9XG4gICAgICB0aGlzLnRhYmxlLmhlYWRlcnMucHVzaChgXHU1MjE3ICR7dGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCArIDF9YCk7XG4gICAgICB0aGlzLnRhYmxlLmFsaWdubWVudHMgPz89IFtdO1xuICAgICAgdGhpcy50YWJsZS5hbGlnbm1lbnRzLnB1c2goXCJsZWZ0XCIpO1xuICAgICAgdGhpcy50YWJsZS5yb3dzLmZvckVhY2goKHJvdykgPT4gcm93LnB1c2goXCJcIikpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgcmVtb3ZlQ29sdW1uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCA8PSAxKSByZXR1cm47XG4gICAgICB0aGlzLnRhYmxlLmhlYWRlcnMucG9wKCk7XG4gICAgICB0aGlzLnRhYmxlLmFsaWdubWVudHM/LnBvcCgpO1xuICAgICAgdGhpcy50YWJsZS5yb3dzLmZvckVhY2goKHJvdykgPT4gcm93LnBvcCgpKTtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgIH0pO1xuICAgIHRvTWFya2Rvd24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIHRoaXMubWFya2Rvd25FbC52YWx1ZSA9IHRhYmxlVG9NYXJrZG93bih0aGlzLnRhYmxlKTtcbiAgICB9KTtcbiAgICBwYXJzZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VNYXJrZG93blRhYmxlKHRoaXMubWFya2Rvd25FbC52YWx1ZSk7XG4gICAgICBpZiAoIXBhcnNlZCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiXHU2NzJBXHU4QkM2XHU1MjJCXHU1MjMwXHU2NzA5XHU2NTQ4XHU3Njg0IE1hcmtkb3duIFx1ODg2OFx1NjgzQ1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy50YWJsZSA9IHBhcnNlZDtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgICAgbmV3IE5vdGljZShcIk1hcmtkb3duIFx1ODg2OFx1NjgzQ1x1NURGMlx1ODlFM1x1Njc5MFwiKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjYW5jZWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTUzRDZcdTZEODhcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCBzYXZlID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU0RkREXHU1QjU4XHU4ODY4XHU2ODNDXCIsIHR5cGU6IFwiYnV0dG9uXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIHNhdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIGlmICghdGhpcy50YWJsZS5oZWFkZXJzLnNvbWUoKGhlYWRlcikgPT4gaGVhZGVyLnRyaW0oKSkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlx1ODFGM1x1NUMxMVx1OTcwMFx1ODk4MVx1NEUwMFx1NEUyQVx1ODg2OFx1NTkzNFwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy50YWJsZS5zb3VyY2UgPSB0aGlzLnRhYmxlLnNvdXJjZSA/PyBcIm1hbnVhbFwiO1xuICAgICAgdGhpcy5zdWJtaXQodGhpcy50YWJsZSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckdyaWQoKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkRWwuZW1wdHkoKTtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMuZ3JpZEVsLmNyZWF0ZUVsKFwidGFibGVcIik7XG4gICAgY29uc3QgaGVhZCA9IHRhYmxlLmNyZWF0ZUVsKFwidGhlYWRcIikuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICB0aGlzLnRhYmxlLmhlYWRlcnMuZm9yRWFjaCgoaGVhZGVyLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgdGggPSBoZWFkLmNyZWF0ZUVsKFwidGhcIik7XG4gICAgICBjb25zdCBpbnB1dCA9IHRoLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBcImRhdGEta2luZFwiOiBcImhlYWRlclwiLCBcImRhdGEtY29sdW1uXCI6IFN0cmluZyhpbmRleCkgfSB9KTtcbiAgICAgIGlucHV0LnZhbHVlID0gaGVhZGVyO1xuICAgICAgY29uc3QgYWxpZ24gPSB0aC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGF0dHI6IHsgXCJkYXRhLWtpbmRcIjogXCJhbGlnbm1lbnRcIiwgXCJkYXRhLWNvbHVtblwiOiBTdHJpbmcoaW5kZXgpLCBcImFyaWEtbGFiZWxcIjogYFx1N0IyQyAke2luZGV4ICsgMX0gXHU1MjE3XHU1QkY5XHU5RjUwXHU2NUI5XHU1RjBGYCB9IH0pO1xuICAgICAgKFtbJ2xlZnQnLCAnXHU1REU2J10sIFsnY2VudGVyJywgJ1x1NEUyRCddLCBbJ3JpZ2h0JywgJ1x1NTNGMyddXSBhcyBBcnJheTxbVGFibGVBbGlnbm1lbnQsIHN0cmluZ10+KS5mb3JFYWNoKChbdmFsdWUsIGxhYmVsXSkgPT4gYWxpZ24uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB2YWx1ZSB9IH0pKTtcbiAgICAgIGFsaWduLnZhbHVlID0gdGhpcy50YWJsZS5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgIH0pO1xuICAgIGNvbnN0IGJvZHkgPSB0YWJsZS5jcmVhdGVFbChcInRib2R5XCIpO1xuICAgIHRoaXMudGFibGUucm93cy5mb3JFYWNoKChyb3csIHJvd0luZGV4KSA9PiB7XG4gICAgICBjb25zdCB0ciA9IGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICAgIHRoaXMudGFibGUuaGVhZGVycy5mb3JFYWNoKChfLCBjb2x1bW5JbmRleCkgPT4ge1xuICAgICAgICBjb25zdCB0ZCA9IHRyLmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gdGQuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7IGF0dHI6IHsgXCJkYXRhLWtpbmRcIjogXCJjZWxsXCIsIFwiZGF0YS1yb3dcIjogU3RyaW5nKHJvd0luZGV4KSwgXCJkYXRhLWNvbHVtblwiOiBTdHJpbmcoY29sdW1uSW5kZXgpIH0gfSk7XG4gICAgICAgIGlucHV0LnJvd3MgPSAyO1xuICAgICAgICBpbnB1dC52YWx1ZSA9IHJvd1tjb2x1bW5JbmRleF0gPz8gXCJcIjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb2xsZWN0R3JpZCgpOiB2b2lkIHtcbiAgICBjb25zdCBoZWFkZXJzID0gQXJyYXkuZnJvbSh0aGlzLmdyaWRFbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dFtkYXRhLWtpbmQ9XCJoZWFkZXJcIl0nKSk7XG4gICAgaGVhZGVycy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgICAgY29uc3QgY29sdW1uID0gTnVtYmVyKGlucHV0LmRhdGFzZXQuY29sdW1uKTtcbiAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbHVtbikpIHRoaXMudGFibGUuaGVhZGVyc1tjb2x1bW5dID0gaW5wdXQudmFsdWUudHJpbSgpLnNsaWNlKDAsIDIwMDApO1xuICAgIH0pO1xuICAgIGNvbnN0IGFsaWdubWVudHMgPSBBcnJheS5mcm9tKHRoaXMuZ3JpZEVsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFNlbGVjdEVsZW1lbnQ+KCdzZWxlY3RbZGF0YS1raW5kPVwiYWxpZ25tZW50XCJdJykpO1xuICAgIHRoaXMudGFibGUuYWxpZ25tZW50cyA9IHRoaXMudGFibGUuaGVhZGVycy5tYXAoKCkgPT4gXCJsZWZ0XCIpO1xuICAgIGFsaWdubWVudHMuZm9yRWFjaCgoaW5wdXQpID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IE51bWJlcihpbnB1dC5kYXRhc2V0LmNvbHVtbik7XG4gICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihjb2x1bW4pKSB0aGlzLnRhYmxlLmFsaWdubWVudHMhW2NvbHVtbl0gPSBpbnB1dC52YWx1ZSA9PT0gXCJjZW50ZXJcIiB8fCBpbnB1dC52YWx1ZSA9PT0gXCJyaWdodFwiID8gaW5wdXQudmFsdWUgOiBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCBjZWxscyA9IEFycmF5LmZyb20odGhpcy5ncmlkRWwucXVlcnlTZWxlY3RvckFsbDxIVE1MVGV4dEFyZWFFbGVtZW50PigndGV4dGFyZWFbZGF0YS1raW5kPVwiY2VsbFwiXScpKTtcbiAgICBjZWxscy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gTnVtYmVyKGlucHV0LmRhdGFzZXQucm93KTtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IE51bWJlcihpbnB1dC5kYXRhc2V0LmNvbHVtbik7XG4gICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihyb3cpICYmIE51bWJlci5pc0ludGVnZXIoY29sdW1uKSAmJiB0aGlzLnRhYmxlLnJvd3Nbcm93XSkgdGhpcy50YWJsZS5yb3dzW3Jvd10hW2NvbHVtbl0gPSBpbnB1dC52YWx1ZS5zbGljZSgwLCAyMDAwKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29kZUVkaXRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBibG9jazogTWluZE1hcENvZGVCbG9jayB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6IChibG9jazogTWluZE1hcENvZGVCbG9jaykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgYmxvY2s6IE1pbmRNYXBDb2RlQmxvY2sgfCB1bmRlZmluZWQsIHN1Ym1pdDogKGJsb2NrOiBNaW5kTWFwQ29kZUJsb2NrKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmJsb2NrID0gYmxvY2s7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTRFRTNcdTc4MDFcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtY29kZS1tb2RhbFwiKTtcbiAgICBjb25zdCBsYW5ndWFnZUxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU0RUUzXHU3ODAxXHU4QkVEXHU4QTAwXCIgfSk7XG4gICAgY29uc3QgbGFuZ3VhZ2VJbnB1dCA9IGxhbmd1YWdlTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcImphdmFzY3JpcHRcdTMwMDFweXRob25cdTMwMDFjc3NcdTIwMjZcIiB9IH0pO1xuICAgIGxhbmd1YWdlSW5wdXQudmFsdWUgPSB0aGlzLmJsb2NrPy5sYW5ndWFnZSA/PyBcIlwiO1xuXG4gICAgY29uc3QgY29kZUxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU0RUUzXHU3ODAxXHU1MTg1XHU1QkI5XCIgfSk7XG4gICAgY29uc3QgY29kZUlucHV0ID0gY29kZUxhYmVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBjbHM6IFwibW1jLWNvZGUtdGV4dGFyZWFcIiwgYXR0cjogeyBzcGVsbGNoZWNrOiBcImZhbHNlXCIsIHBsYWNlaG9sZGVyOiBcIlx1NTNFRlx1NzZGNFx1NjNBNVx1N0M5OFx1OEQzNFx1NEVFM1x1NzgwMVx1RkYwQ1x1NjIxNlx1N0M5OFx1OEQzNCBgYGBcdThCRURcdThBMDAgLi4uIGBgYCBmZW5jZWQgY29kZSBibG9ja1wiIH0gfSk7XG4gICAgY29kZUlucHV0LnJvd3MgPSAxODtcbiAgICBjb2RlSW5wdXQudmFsdWUgPSB0aGlzLmJsb2NrPy5jb2RlID8/IFwiXCI7XG5cbiAgICBjb25zdCBkZXRlY3QgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU4QkM2XHU1MjJCIGZlbmNlZCBjb2RlXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgZGV0ZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUZlbmNlZENvZGUoY29kZUlucHV0LnZhbHVlKTtcbiAgICAgIGlmICghcGFyc2VkKSB7IG5ldyBOb3RpY2UoXCJcdTZDQTFcdTY3MDlcdThCQzZcdTUyMkJcdTUyMzBcdTVCOENcdTY1NzRcdTc2ODQgYGBgIGZlbmNlZCBjb2RlIGJsb2NrXCIpOyByZXR1cm47IH1cbiAgICAgIGxhbmd1YWdlSW5wdXQudmFsdWUgPSBwYXJzZWQubGFuZ3VhZ2UgPz8gXCJcIjtcbiAgICAgIGNvZGVJbnB1dC52YWx1ZSA9IHBhcnNlZC5jb2RlO1xuICAgICAgbmV3IE5vdGljZShcIlx1NEVFM1x1NzgwMVx1OEJFRFx1OEEwMFx1NTQ4Q1x1NTE4NVx1NUJCOVx1NURGMlx1OEJDNlx1NTIyQlwiKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjYW5jZWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTUzRDZcdTZEODhcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCBzYXZlID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU0RkREXHU1QjU4XHU0RUUzXHU3ODAxXCIsIHR5cGU6IFwiYnV0dG9uXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIHNhdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGxldCBsYW5ndWFnZSA9IGxhbmd1YWdlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgbGV0IGNvZGUgPSBjb2RlSW5wdXQudmFsdWU7XG4gICAgICBjb25zdCBmZW5jZWQgPSBwYXJzZUZlbmNlZENvZGUoY29kZSk7XG4gICAgICBpZiAoZmVuY2VkKSB7XG4gICAgICAgIGxhbmd1YWdlID0gZmVuY2VkLmxhbmd1YWdlID8/IGxhbmd1YWdlO1xuICAgICAgICBjb2RlID0gZmVuY2VkLmNvZGU7XG4gICAgICB9XG4gICAgICBpZiAoIWNvZGUudHJpbSgpKSB7IG5ldyBOb3RpY2UoXCJcdTRFRTNcdTc4MDFcdTUxODVcdTVCQjlcdTRFMERcdTgwRkRcdTRFM0FcdTdBN0FcIik7IHJldHVybjsgfVxuICAgICAgdGhpcy5zdWJtaXQoeyBsYW5ndWFnZTogbGFuZ3VhZ2UucmVwbGFjZSgvW15hLXowLTlfKyMuLV0vZ2ksIFwiXCIpLnNsaWNlKDAsIDQwKSB8fCB1bmRlZmluZWQsIGNvZGUgfSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBVU87OztBQytKQSxJQUFNLHFCQUFxQjtBQUNsQyxJQUFNLHFCQUFxQixDQUFDLFlBQVksVUFBVTtBQUUzQyxTQUFTLFFBQWdCO0FBQzlCLFFBQU0sU0FBUyxLQUFLLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEdBQUcsQ0FBQztBQUNwRCxTQUFPLEtBQUssS0FBSyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsSUFBSSxNQUFNO0FBQy9DO0FBRU8sU0FBUyxXQUFXLE9BQU8sc0JBQW9CO0FBQ3BELFNBQU8sRUFBRSxJQUFJLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxFQUFFO0FBQzNDO0FBRU8sU0FBUyxzQkFBc0IsUUFBUSxrQ0FBMEI7QUFDdEUsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1Q7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLE9BQU87QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLElBQUksTUFBTTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLFFBQ1IsRUFBRSxJQUFJLE1BQU0sR0FBRyxNQUFNLGtCQUFRLFVBQVUsQ0FBQyxFQUFFO0FBQUEsUUFDMUMsRUFBRSxJQUFJLE1BQU0sR0FBRyxNQUFNLGtCQUFRLFVBQVUsQ0FBQyxFQUFFO0FBQUEsTUFDNUM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsU0FBUyxlQUFlLE9BQW9DO0FBQzFELE1BQUksT0FBTyxVQUFVLFNBQVUsUUFBTztBQUN0QyxRQUFNLFVBQVUsTUFBTSxLQUFLO0FBQzNCLFNBQU8sa0JBQWtCLEtBQUssT0FBTyxJQUFJLFVBQVU7QUFDckQ7QUFFQSxTQUFTLGdCQUFnQixPQUFnQixLQUFhLEtBQWlDO0FBQ3JGLE1BQUksT0FBTyxVQUFVLFlBQVksQ0FBQyxPQUFPLFNBQVMsS0FBSyxFQUFHLFFBQU87QUFDakUsU0FBTyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLENBQUM7QUFDM0M7QUFFQSxTQUFTLHlCQUF5QixPQUFxQztBQUNyRSxTQUFPLE9BQU8sVUFBVSxZQUFZLFFBQVE7QUFDOUM7QUFFQSxTQUFTLG9CQUFvQixPQUE4RTtBQUN6RyxNQUFJLENBQUMsTUFBTyxRQUFPO0FBQ25CLFFBQU0sb0JBQW1ELE1BQU0sc0JBQXNCLFVBQVUsTUFBTSxzQkFBc0IsVUFBVSxNQUFNLHNCQUFzQixTQUM3SixNQUFNLG9CQUNOO0FBQ0osUUFBTSxhQUF5QyxNQUFNLGVBQWUsY0FBYyxNQUFNLGVBQWUsVUFBVSxNQUFNLGVBQWUsV0FBVyxNQUFNLGVBQWUsVUFBVSxNQUFNLGVBQWUsV0FDak0sTUFBTSxhQUNOO0FBQ0osUUFBTSxZQUFtQyxNQUFNLGNBQWMsWUFBWSxNQUFNLGNBQWMsY0FBYyxNQUFNLGNBQWMsVUFDM0gsTUFBTSxZQUNOO0FBQ0osUUFBTSxnQkFBMkMsTUFBTSxrQkFBa0IsYUFBYSxNQUFNLGtCQUFrQixZQUMxRyxNQUFNLGdCQUNOO0FBQ0osUUFBTSxjQUFnRDtBQUFBLElBQ3BEO0FBQUEsSUFBa0I7QUFBQSxJQUFjO0FBQUEsSUFBZ0I7QUFBQSxJQUFpQjtBQUFBLElBQ2pFO0FBQUEsSUFBYTtBQUFBLElBQWM7QUFBQSxJQUFlO0FBQUEsSUFBYTtBQUFBLEVBQ3pELEVBQUUsU0FBUyxPQUFPLE1BQU0sV0FBVyxDQUFDLElBQUksTUFBTSxjQUFzQztBQUNwRixRQUFNLGVBQWUsTUFBTSxRQUFRLE1BQU0sWUFBWSxJQUNqRCxNQUFNLGFBQWEsSUFBSSxjQUFjLEVBQUUsT0FBTyxDQUFDLFVBQTJCLFFBQVEsS0FBSyxDQUFDLEVBQUUsTUFBTSxHQUFHLEVBQUUsSUFDckc7QUFDSixRQUFNLGFBQWEsT0FBTyxNQUFNLGVBQWUsWUFBWSxNQUFNLFdBQVcsS0FBSyxJQUM3RSxNQUFNLFdBQVcsS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFHLElBQ3BDO0FBQ0osUUFBTSxhQUFnQztBQUFBLElBQ3BDO0FBQUEsSUFDQSxpQkFBaUIsZUFBZSxNQUFNLGVBQWU7QUFBQSxJQUNyRDtBQUFBLElBQ0EsY0FBYyxlQUFlLE1BQU0sWUFBWTtBQUFBLElBQy9DO0FBQUEsSUFDQTtBQUFBLElBQ0EsVUFBVSxnQkFBZ0IsTUFBTSxVQUFVLElBQUksRUFBRTtBQUFBLElBQ2hELFdBQVcsZUFBZSxNQUFNLFNBQVM7QUFBQSxJQUN6QyxXQUFXLGdCQUFnQixNQUFNLFdBQVcsS0FBSyxDQUFDO0FBQUEsSUFDbEQ7QUFBQSxJQUNBO0FBQUEsSUFDQSxjQUFjLGdCQUFnQixNQUFNLGNBQWMsTUFBTSxDQUFDO0FBQUEsSUFDekQsV0FBVyxlQUFlLE1BQU0sU0FBUztBQUFBLElBQ3pDLGVBQWUsZUFBZSxNQUFNLGFBQWE7QUFBQSxJQUNqRCxrQkFBa0IseUJBQXlCLE1BQU0sZ0JBQWdCO0FBQUEsSUFDakUsZUFBYyw2Q0FBYyxVQUFTLGVBQWU7QUFBQSxJQUNwRCxXQUFXLGVBQWUsTUFBTSxTQUFTO0FBQUEsSUFDekMsV0FBVyxlQUFlLE1BQU0sU0FBUztBQUFBLElBQ3pDLGlCQUFpQixlQUFlLE1BQU0sZUFBZTtBQUFBLElBQ3JELGlCQUFpQixnQkFBZ0IsTUFBTSxpQkFBaUIsR0FBRyxDQUFDO0FBQUEsSUFDNUQsTUFBTSx5QkFBeUIsTUFBTSxJQUFJO0FBQUEsSUFDekMsUUFBUSx5QkFBeUIsTUFBTSxNQUFNO0FBQUEsSUFDN0MsV0FBVyx5QkFBeUIsTUFBTSxTQUFTO0FBQUEsRUFDckQ7QUFDQSxTQUFPLE9BQU8sT0FBTyxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVUsVUFBVSxNQUFTLElBQUksYUFBYTtBQUN2RjtBQUVPLFNBQVMsZ0JBQWdCLE1BQXFDLFVBQTREO0FBQy9ILFNBQU8sRUFBRSxHQUFJLHNCQUFRLENBQUMsR0FBSSxHQUFJLDhCQUFZLENBQUMsRUFBRztBQUNoRDtBQUVBLFNBQVMsZUFBZSxPQUE0RTtBQUNsRyxNQUFJLENBQUMsTUFBTyxRQUFPO0FBQ25CLFFBQU0sUUFBK0IsTUFBTSxVQUFVLFVBQVUsTUFBTSxVQUFVLGVBQWUsTUFBTSxVQUFVLFlBQzFHLE1BQU0sUUFDTjtBQUNKLFFBQU0sUUFBMEI7QUFBQSxJQUM5QixPQUFPLGVBQWUsTUFBTSxLQUFLO0FBQUEsSUFDakMsV0FBVyxlQUFlLE1BQU0sU0FBUztBQUFBLElBQ3pDLGFBQWEsZUFBZSxNQUFNLFdBQVc7QUFBQSxJQUM3QyxhQUFhLGdCQUFnQixNQUFNLGFBQWEsR0FBRyxDQUFDO0FBQUEsSUFDcEQ7QUFBQSxJQUNBLE1BQU0seUJBQXlCLE1BQU0sSUFBSTtBQUFBLElBQ3pDLFFBQVEseUJBQXlCLE1BQU0sTUFBTTtBQUFBLElBQzdDLFdBQVcseUJBQXlCLE1BQU0sU0FBUztBQUFBLElBQ25ELFVBQVUsZ0JBQWdCLE1BQU0sVUFBVSxJQUFJLEVBQUU7QUFBQSxFQUNsRDtBQUNBLFNBQU8sT0FBTyxPQUFPLEtBQUssRUFBRSxLQUFLLENBQUMsVUFBVSxVQUFVLE1BQVMsSUFBSSxRQUFRO0FBQzdFO0FBRUEsU0FBUyxtQkFBbUIsT0FBNEU7QUFDdEcsTUFBSSxDQUFDLE1BQU8sUUFBTztBQUNuQixRQUFNLFFBQTBCO0FBQUEsSUFDOUIsTUFBTSx5QkFBeUIsTUFBTSxJQUFJO0FBQUEsSUFDekMsUUFBUSx5QkFBeUIsTUFBTSxNQUFNO0FBQUEsSUFDN0MsV0FBVyx5QkFBeUIsTUFBTSxTQUFTO0FBQUEsSUFDbkQsUUFBUSx5QkFBeUIsTUFBTSxNQUFNO0FBQUEsSUFDN0MsT0FBTyxlQUFlLE1BQU0sS0FBSztBQUFBLEVBQ25DO0FBQ0EsU0FBTyxPQUFPLE9BQU8sS0FBSyxFQUFFLEtBQUssQ0FBQyxVQUFVLFVBQVUsTUFBUyxJQUFJLFFBQVE7QUFDN0U7QUFFQSxTQUFTLGFBQWEsT0FBNkM7QUFDakUsU0FBTyxLQUFLLFVBQVUsd0JBQVMsQ0FBQyxDQUFDO0FBQ25DO0FBRU8sU0FBUyxrQkFBa0IsT0FBZ0IsZUFBZSxJQUFrQztBQUNqRyxNQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssRUFBRyxRQUFPO0FBQ2xDLFFBQU0sT0FBeUIsQ0FBQztBQUNoQyxhQUFXLE9BQU8sTUFBTSxNQUFNLEdBQUcsR0FBRyxHQUFHO0FBQ3JDLFFBQUksQ0FBQyxPQUFPLE9BQU8sUUFBUSxTQUFVO0FBQ3JDLFVBQU0sWUFBWTtBQUNsQixRQUFJLE9BQU8sVUFBVSxTQUFTLFlBQVksQ0FBQyxVQUFVLEtBQU07QUFDM0QsVUFBTSxPQUFPLFVBQVUsS0FBSyxRQUFRLFVBQVUsR0FBRyxFQUFFLE1BQU0sR0FBRyxHQUFLO0FBQ2pFLFFBQUksQ0FBQyxLQUFNO0FBQ1gsVUFBTSxRQUFRLG1CQUFtQixVQUFVLEtBQUs7QUFDaEQsVUFBTSxXQUFXLEtBQUssR0FBRyxFQUFFO0FBQzNCLFFBQUksWUFBWSxhQUFhLFNBQVMsS0FBSyxNQUFNLGFBQWEsS0FBSyxFQUFHLFVBQVMsUUFBUTtBQUFBLFFBQ2xGLE1BQUssS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFDQSxNQUFJLENBQUMsS0FBSyxPQUFRLFFBQU87QUFFekIsUUFBTSxXQUFXLEtBQUssSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ3BELFFBQU0sVUFBVSxTQUFTLFNBQVMsU0FBUyxVQUFVLEVBQUU7QUFDdkQsUUFBTSxXQUFXLFNBQVMsU0FBUyxTQUFTLFFBQVEsRUFBRTtBQUN0RCxNQUFJLFdBQVcsVUFBVTtBQUN2QixRQUFJLFFBQVE7QUFDWixRQUFJLFlBQVksU0FBUyxTQUFTLFVBQVU7QUFDNUMsVUFBTSxVQUE0QixDQUFDO0FBQ25DLGVBQVcsT0FBTyxNQUFNO0FBQ3RCLFVBQUksYUFBYSxFQUFHO0FBQ3BCLFlBQU0sT0FBTyxLQUFLLElBQUksT0FBTyxJQUFJLEtBQUssTUFBTTtBQUM1QyxlQUFTO0FBQ1QsWUFBTSxZQUFZLElBQUksS0FBSyxTQUFTO0FBQ3BDLFVBQUksYUFBYSxFQUFHO0FBQ3BCLFlBQU0sT0FBTyxLQUFLLElBQUksV0FBVyxTQUFTO0FBQzFDLFlBQU0sT0FBTyxJQUFJLEtBQUssTUFBTSxNQUFNLE9BQU8sSUFBSTtBQUM3QyxtQkFBYTtBQUNiLFVBQUksS0FBTSxTQUFRLEtBQUssRUFBRSxNQUFNLE9BQU8sSUFBSSxNQUFNLENBQUM7QUFBQSxJQUNuRDtBQUNBLFNBQUssT0FBTyxHQUFHLEtBQUssUUFBUSxHQUFHLE9BQU87QUFBQSxFQUN4QztBQUVBLE1BQUksQ0FBQyxLQUFLLE9BQVEsUUFBTyxhQUFhLEtBQUssSUFBSSxDQUFDLEVBQUUsTUFBTSxhQUFhLEtBQUssRUFBRSxDQUFDLElBQUk7QUFDakYsU0FBTyxLQUFLLEtBQUssQ0FBQyxRQUFRLElBQUksU0FBUyxPQUFPLE9BQU8sSUFBSSxLQUFLLEVBQUUsS0FBSyxDQUFDLFVBQVUsVUFBVSxNQUFTLENBQUMsSUFBSSxPQUFPO0FBQ2pIO0FBRU8sU0FBUyxrQkFBa0IsTUFBb0MsZUFBZSxJQUFZO0FBelZqRztBQTBWRSxVQUFPLGtDQUFNLElBQUksQ0FBQyxRQUFRLElBQUksTUFBTSxLQUFLLFFBQWxDLFlBQXlDO0FBQ2xEO0FBRU8sU0FBUyx3QkFBd0IsTUFBb0MsZUFBZSxJQUF3QjtBQUNqSCxRQUFNLE9BQU8sa0JBQWtCLE1BQU0sWUFBWTtBQUNqRCxRQUFNLFNBQTZCLE1BQU0sS0FBSyxFQUFFLFFBQVEsS0FBSyxPQUFPLEdBQUcsT0FBTyxDQUFDLEVBQUU7QUFDakYsTUFBSSxFQUFDLDZCQUFNLFFBQVEsUUFBTztBQUMxQixNQUFJLFNBQVM7QUFDYixhQUFXLE9BQU8sTUFBTTtBQUN0QixVQUFNLFFBQVEsSUFBSSxRQUFRLEVBQUUsR0FBRyxJQUFJLE1BQU0sSUFBSSxDQUFDO0FBQzlDLFVBQU0sTUFBTSxLQUFLLElBQUksS0FBSyxRQUFRLFNBQVMsSUFBSSxLQUFLLE1BQU07QUFDMUQsYUFBUyxRQUFRLFFBQVEsUUFBUSxLQUFLLFNBQVMsRUFBRyxRQUFPLEtBQUssSUFBSSxFQUFFLEdBQUcsTUFBTTtBQUM3RSxhQUFTO0FBQUEsRUFDWDtBQUNBLFNBQU87QUFDVDtBQUVPLFNBQVMsMEJBQTBCLE1BQWMsUUFBMEQ7QUFDaEgsTUFBSSxDQUFDLEtBQU0sUUFBTztBQUNsQixRQUFNLE9BQXlCLENBQUM7QUFDaEMsTUFBSSxRQUFRO0FBQ1osTUFBSSxVQUFVLG1CQUFtQixPQUFPLENBQUMsQ0FBQztBQUMxQyxXQUFTLFFBQVEsR0FBRyxTQUFTLEtBQUssUUFBUSxTQUFTLEdBQUc7QUFDcEQsVUFBTSxPQUFPLFFBQVEsS0FBSyxTQUFTLG1CQUFtQixPQUFPLEtBQUssQ0FBQyxJQUFJO0FBQ3ZFLFFBQUksUUFBUSxLQUFLLFVBQVUsYUFBYSxPQUFPLE1BQU0sYUFBYSxJQUFJLEVBQUc7QUFDekUsVUFBTSxVQUFVLEtBQUssTUFBTSxPQUFPLEtBQUs7QUFDdkMsUUFBSSxRQUFTLE1BQUssS0FBSyxFQUFFLE1BQU0sU0FBUyxPQUFPLFFBQVEsQ0FBQztBQUN4RCxZQUFRO0FBQ1IsY0FBVTtBQUFBLEVBQ1o7QUFDQSxTQUFPLGtCQUFrQixNQUFNLElBQUk7QUFDckM7QUFFTyxTQUFTLDJCQUNkLGNBQ0EsY0FDQSxVQUM4QjtBQS9YaEM7QUFnWUUsTUFBSSxpQkFBaUIsU0FBVSxRQUFPLGtCQUFrQixjQUFjLFFBQVE7QUFDOUUsUUFBTSxpQkFBaUIsd0JBQXdCLGNBQWMsWUFBWTtBQUN6RSxRQUFNLGFBQWlDLE1BQU0sS0FBSyxFQUFFLFFBQVEsU0FBUyxPQUFPLEdBQUcsT0FBTyxDQUFDLEVBQUU7QUFDekYsTUFBSSxTQUFTO0FBQ2IsU0FBTyxTQUFTLGFBQWEsVUFBVSxTQUFTLFNBQVMsVUFBVSxhQUFhLE1BQU0sTUFBTSxTQUFTLE1BQU0sRUFBRyxXQUFVO0FBQ3hILE1BQUksU0FBUztBQUNiLFNBQ0UsU0FBUyxhQUFhLFNBQVMsVUFDNUIsU0FBUyxTQUFTLFNBQVMsVUFDM0IsYUFBYSxhQUFhLFNBQVMsSUFBSSxNQUFNLE1BQU0sU0FBUyxTQUFTLFNBQVMsSUFBSSxNQUFNLEVBQzNGLFdBQVU7QUFDWixXQUFTLFFBQVEsR0FBRyxRQUFRLFFBQVEsU0FBUyxFQUFHLFlBQVcsS0FBSyxJQUFJLEVBQUUsSUFBSSxvQkFBZSxLQUFLLE1BQXBCLFlBQXlCLENBQUMsRUFBRztBQUN2RyxXQUFTLFFBQVEsR0FBRyxRQUFRLFFBQVEsU0FBUyxHQUFHO0FBQzlDLFVBQU0sZ0JBQWdCLGFBQWEsU0FBUyxTQUFTO0FBQ3JELFVBQU0sWUFBWSxTQUFTLFNBQVMsU0FBUztBQUM3QyxlQUFXLFNBQVMsSUFBSSxFQUFFLElBQUksb0JBQWUsYUFBYSxNQUE1QixZQUFpQyxDQUFDLEVBQUc7QUFBQSxFQUNyRTtBQUNBLFNBQU8sMEJBQTBCLFVBQVUsVUFBVTtBQUN2RDtBQUVPLFNBQVMsd0JBQ2QsTUFDQSxNQUNBLE9BQ0EsS0FDQSxPQUM4QjtBQUM5QixRQUFNLFlBQVksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEtBQUssUUFBUSxLQUFLLE1BQU0sS0FBSyxDQUFDLENBQUM7QUFDdEUsUUFBTSxVQUFVLEtBQUssSUFBSSxXQUFXLEtBQUssSUFBSSxLQUFLLFFBQVEsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzFFLE1BQUksY0FBYyxRQUFTLFFBQU8sa0JBQWtCLE1BQU0sSUFBSTtBQUM5RCxRQUFNLFNBQVMsd0JBQXdCLE1BQU0sSUFBSTtBQUNqRCxXQUFTLFFBQVEsV0FBVyxRQUFRLFNBQVMsU0FBUyxHQUFHO0FBQ3ZELFFBQUksVUFBVSxLQUFNLFFBQU8sS0FBSyxJQUFJLENBQUM7QUFBQSxRQUNoQyxRQUFPLEtBQUssSUFBSSxFQUFFLEdBQUcsT0FBTyxLQUFLLEdBQUcsR0FBRyxNQUFNO0FBQUEsRUFDcEQ7QUFDQSxTQUFPLDBCQUEwQixNQUFNLE1BQU07QUFDL0M7QUFHQSxTQUFTLHNCQUFzQixPQUE0QztBQUN6RSxNQUFJLENBQUMsU0FBUyxPQUFPLFVBQVUsU0FBVSxRQUFPO0FBQ2hELFFBQU0sWUFBWTtBQUNsQixRQUFNLEtBQUssT0FBTyxVQUFVLE9BQU8sWUFBWSxVQUFVLEdBQUcsS0FBSyxJQUFJLFVBQVUsR0FBRyxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUcsSUFBSSxNQUFNO0FBQy9HLE1BQUksVUFBVSxTQUFTLFNBQVM7QUFDOUIsVUFBTSxRQUFRO0FBQ2QsVUFBTSxTQUFTLE9BQU8sTUFBTSxXQUFXLFdBQVcsTUFBTSxPQUFPLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBSSxJQUFJO0FBQ3ZGLFFBQUksQ0FBQyxPQUFRLFFBQU87QUFDcEIsVUFBTSxNQUFNLE9BQU8sTUFBTSxRQUFRLFlBQVksTUFBTSxJQUFJLEtBQUssSUFBSSxNQUFNLElBQUksS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFHLElBQUk7QUFDakcsVUFBTSxjQUFjLE9BQU8sTUFBTSxnQkFBZ0IsWUFBWSxNQUFNLFlBQVksS0FBSyxJQUNoRixNQUFNLFlBQVksS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFJLElBQ3RDO0FBQ0osVUFBTSxnQkFBZ0IsTUFBTSxRQUFRLE1BQU0sYUFBYSxJQUNuRCxNQUFNLGNBQWMsTUFBTSxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsUUFBUTtBQUNsRCxVQUFJLENBQUMsT0FBTyxPQUFPLFFBQVEsU0FBVSxRQUFPLENBQUM7QUFDN0MsWUFBTSxPQUFPO0FBQ2IsWUFBTSxTQUFTLE9BQU8sS0FBSyxXQUFXLFdBQVcsS0FBSyxPQUFPLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRyxJQUFJO0FBQ3BGLFlBQU0sTUFBTSxPQUFPLEtBQUssUUFBUSxXQUFXLEtBQUssSUFBSSxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUksSUFBSTtBQUM1RSxVQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixLQUFLLEdBQUcsRUFBRyxRQUFPLENBQUM7QUFDbkQsYUFBTyxDQUFDO0FBQUEsUUFDTjtBQUFBLFFBQ0EsVUFBVSxPQUFPLEtBQUssYUFBYSxZQUFZLEtBQUssU0FBUyxLQUFLLElBQUksS0FBSyxTQUFTLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRyxJQUFJO0FBQUEsUUFDM0c7QUFBQSxRQUNBLFlBQVksT0FBTyxLQUFLLGVBQWUsWUFBWSxLQUFLLFdBQVcsS0FBSyxJQUFJLEtBQUssV0FBVyxLQUFLLEVBQUUsTUFBTSxHQUFHLEVBQUUsSUFBSTtBQUFBLFFBQ2xILGVBQWUsT0FBTyxLQUFLLGtCQUFrQixZQUFZLEtBQUssY0FBYyxLQUFLLElBQUksS0FBSyxjQUFjLEtBQUssRUFBRSxNQUFNLEdBQUcsRUFBRSxJQUFJO0FBQUEsUUFDOUgsZUFBZSxPQUFPLEtBQUssa0JBQWtCLFlBQVksS0FBSyxjQUFjLEtBQUssSUFBSSxLQUFLLGNBQWMsS0FBSyxFQUFFLE1BQU0sR0FBRyxFQUFFLElBQUk7QUFBQSxRQUM5SCxjQUFjLE9BQU8sS0FBSyxpQkFBaUIsWUFBWSxPQUFPLFNBQVMsS0FBSyxZQUFZLElBQ3BGLEtBQUssSUFBSSxHQUFHLEtBQUssSUFBSSxLQUFTLEtBQUssTUFBTSxLQUFLLFlBQVksQ0FBQyxDQUFDLElBQzVEO0FBQUEsTUFDTixDQUFDO0FBQUEsSUFDSCxDQUFDLElBQ0M7QUFDSixXQUFPLEVBQUUsSUFBSSxNQUFNLFNBQVMsUUFBUSxLQUFLLGFBQWEsZ0JBQWUsK0NBQWUsVUFBUyxnQkFBZ0IsT0FBVTtBQUFBLEVBQ3pIO0FBQ0EsTUFBSSxVQUFVLFNBQVMsUUFBUTtBQUM3QixVQUFNLGVBQWUsT0FBTyxVQUFVLFNBQVMsV0FBVyxVQUFVLEtBQUssUUFBUSxVQUFVLEdBQUcsRUFBRSxNQUFNLEdBQUcsR0FBSyxJQUFJO0FBQ2xILFVBQU0sV0FBVyxrQkFBa0IsVUFBVSxVQUFVLFlBQVk7QUFDbkUsVUFBTSxPQUFPLGtCQUFrQixVQUFVLFlBQVk7QUFDckQsV0FBTyxFQUFFLElBQUksTUFBTSxRQUFRLE1BQU0sU0FBUztBQUFBLEVBQzVDO0FBQ0EsU0FBTztBQUNUO0FBRU8sU0FBUyxzQkFBc0IsT0FBaUMsZUFBZSxNQUFxQztBQWxkM0g7QUFtZEUsUUFBTSxhQUE0QyxDQUFDO0FBQ25ELFFBQU0sT0FBTyxvQkFBSSxJQUFZO0FBQzdCLFFBQU0sTUFBTSxDQUFDLGNBQWlEO0FBQzVELFVBQU0sU0FBUyxVQUFVLE9BQU8sS0FBSztBQUNyQyxRQUFJLENBQUMsVUFBVSxLQUFLLElBQUksTUFBTSxFQUFHO0FBQ2pDLFNBQUssSUFBSSxNQUFNO0FBQ2YsZUFBVyxLQUFLLEVBQUUsR0FBRyxXQUFXLE9BQU8sQ0FBQztBQUFBLEVBQzFDO0FBRUEsUUFBTSxpQkFBZ0IsV0FBTSxrQkFBTixtQkFBcUIsS0FBSyxDQUFDLFNBQVMsS0FBSyxRQUFRLE1BQU07QUFDN0UsTUFBSTtBQUFBLElBQ0YsUUFBUSxNQUFNO0FBQUEsSUFDZCxRQUFPLCtDQUFlLGNBQWEsZ0JBQWdCLDZCQUFTO0FBQUEsSUFDNUQsUUFBUSwrQ0FBZTtBQUFBLElBQ3ZCLFVBQVUsK0NBQWU7QUFBQSxJQUN6QixNQUFNO0FBQUEsRUFDUixDQUFDO0FBQ0QsUUFBTSxXQUFVLFdBQU0sa0JBQU4sWUFBdUIsQ0FBQztBQUN4QyxRQUFNLGVBQWUsUUFBUSxVQUFVLENBQUMsU0FBUyxLQUFLLFFBQVEsTUFBTSxNQUFNO0FBQzFFLFFBQU0saUJBQWlCLGdCQUFnQixJQUNuQyxDQUFDLEdBQUcsUUFBUSxNQUFNLGVBQWUsQ0FBQyxHQUFHLEdBQUcsUUFBUSxNQUFNLEdBQUcsWUFBWSxDQUFDLElBQ3RFO0FBQ0osYUFBVyxVQUFVLGdCQUFnQjtBQUNuQyxRQUFJO0FBQUEsTUFDRixRQUFRLE9BQU87QUFBQSxNQUNmLE9BQU8sT0FBTyxZQUFZO0FBQUEsTUFDMUIsUUFBUSxPQUFPO0FBQUEsTUFDZixVQUFVLE9BQU87QUFBQSxNQUNqQixNQUFNO0FBQUEsSUFDUixDQUFDO0FBQUEsRUFDSDtBQUNBLE1BQUksZ0JBQWdCLE1BQU0sYUFBYTtBQUNyQyxRQUFJLEVBQUUsUUFBUSxNQUFNLGFBQWEsT0FBTyw0QkFBUSxNQUFNLFFBQVEsQ0FBQztBQUFBLEVBQ2pFO0FBQ0EsU0FBTztBQUNUO0FBRU8sU0FBUyxrQkFBa0IsTUFBMkY7QUF4ZjdIO0FBeWZFLE1BQUksTUFBTSxRQUFRLEtBQUssT0FBTyxLQUFLLEtBQUssUUFBUSxRQUFRO0FBQ3RELFVBQU0sYUFBYSxLQUFLLFFBQVEsSUFBSSxxQkFBcUIsRUFBRSxPQUFPLENBQUMsVUFBd0MsUUFBUSxLQUFLLENBQUM7QUFDekgsUUFBSSxXQUFXLE9BQVEsUUFBTztBQUFBLEVBQ2hDO0FBQ0EsUUFBTSxTQUFnQyxDQUFDO0FBQ3ZDLE9BQUksVUFBSyxVQUFMLG1CQUFZLE9BQVEsUUFBTyxLQUFLLEVBQUUsSUFBSSxNQUFNLEdBQUcsTUFBTSxTQUFTLFFBQVEsS0FBSyxNQUFNLEtBQUssR0FBRyxLQUFLLEtBQUssUUFBUSxPQUFVLENBQUM7QUFDMUgsTUFBSSxLQUFLLFVBQVEsVUFBSyxhQUFMLG1CQUFlLFNBQVE7QUFDdEMsVUFBTSxXQUFXLGtCQUFrQixLQUFLLFVBQVUsS0FBSyxJQUFJO0FBQzNELFdBQU8sS0FBSyxFQUFFLElBQUksTUFBTSxHQUFHLE1BQU0sUUFBUSxNQUFNLGtCQUFrQixVQUFVLEtBQUssSUFBSSxHQUFHLFNBQVMsQ0FBQztBQUFBLEVBQ25HO0FBQ0EsU0FBTztBQUNUO0FBRU8sU0FBUyxjQUFjLE1BQTRFO0FBQ3hHLFFBQU0sU0FBUyxrQkFBa0IsSUFBSTtBQUNyQyxTQUFPLE9BQU8sT0FBTyxDQUFDLFVBQTRDLE1BQU0sU0FBUyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsTUFBTSxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsS0FBSztBQUNySTtBQUVPLFNBQVMscUJBQXFCLE1BQXlCO0FBM2dCOUQ7QUE0Z0JFLFFBQU0sU0FBUyxrQkFBa0IsSUFBSTtBQUNyQyxPQUFLLFVBQVUsT0FBTyxTQUFTLFNBQVM7QUFDeEMsUUFBTSxhQUFhLE9BQU8sT0FBTyxDQUFDLFVBQTRDLE1BQU0sU0FBUyxNQUFNO0FBQ25HLFFBQU0sY0FBYyxPQUFPLE9BQU8sQ0FBQyxVQUE2QyxNQUFNLFNBQVMsT0FBTztBQUN0RyxPQUFLLE9BQU8sV0FBVyxJQUFJLENBQUMsVUFBVSxNQUFNLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxLQUFLO0FBQ2pFLE9BQUssV0FBVyxXQUFXLFdBQVcsSUFBSSxtQkFBa0IsZ0JBQVcsQ0FBQyxNQUFaLG1CQUFlLFdBQVUsc0JBQVcsQ0FBQyxNQUFaLG1CQUFlLFNBQWYsWUFBdUIsRUFBRSxJQUFJO0FBQ2xILE9BQUssU0FBUSxpQkFBWSxDQUFDLE1BQWIsbUJBQWdCO0FBQy9CO0FBR0EsU0FBUyxjQUFjLE9BQXdCO0FBQzdDLFNBQU8sT0FBTyxVQUFVLFdBQVcsTUFBTSxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUksSUFBSSxPQUFPLHdCQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUk7QUFDM0c7QUFFQSxTQUFTLGVBQWUsT0FBb0U7QUFDMUYsTUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLFFBQVEsTUFBTSxPQUFPLEVBQUcsUUFBTztBQUNwRCxRQUFNLFVBQVUsTUFBTSxRQUFRLElBQUksYUFBYSxFQUFFLE1BQU0sR0FBRyxFQUFFO0FBQzVELE1BQUksQ0FBQyxRQUFRLE9BQVEsUUFBTztBQUM1QixRQUFNLE9BQU8sTUFBTSxRQUFRLE1BQU0sSUFBSSxJQUNqQyxNQUFNLEtBQUssTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUTtBQUN0QyxVQUFNLFNBQVMsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLElBQUksYUFBYSxFQUFFLE1BQU0sR0FBRyxRQUFRLE1BQU0sSUFBSSxDQUFDO0FBQ3ZGLFdBQU8sT0FBTyxTQUFTLFFBQVEsT0FBUSxRQUFPLEtBQUssRUFBRTtBQUNyRCxXQUFPO0FBQUEsRUFDVCxDQUFDLElBQ0MsQ0FBQztBQUNMLFFBQU0sYUFBYSxNQUFNLFFBQVEsTUFBTSxVQUFVLElBQzdDLE1BQU0sV0FBVyxNQUFNLEdBQUcsUUFBUSxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsVUFBVSxZQUFZLFVBQVUsVUFBVSxRQUFRLE1BQU0sSUFDakg7QUFDSixRQUFNLFNBQVMsTUFBTSxXQUFXLGNBQWMsTUFBTSxXQUFXLGFBQWEsTUFBTSxTQUFTO0FBQzNGLFNBQU8sRUFBRSxTQUFTLE1BQU0sWUFBWSxPQUFPO0FBQzdDO0FBRUEsU0FBUyxjQUFjLE9BQTRFO0FBQ2pHLE1BQUksQ0FBQyxTQUFTLE9BQU8sTUFBTSxTQUFTLFlBQVksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFHLFFBQU87QUFDM0UsUUFBTSxXQUFXLE9BQU8sTUFBTSxhQUFhLFlBQVksTUFBTSxTQUFTLEtBQUssSUFDdkUsTUFBTSxTQUFTLEtBQUssRUFBRSxRQUFRLG9CQUFvQixFQUFFLEVBQUUsTUFBTSxHQUFHLEVBQUUsSUFDakU7QUFDSixTQUFPLEVBQUUsVUFBVSxNQUFNLE1BQU0sS0FBSyxRQUFRLFNBQVMsSUFBSSxFQUFFLE1BQU0sR0FBRyxHQUFNLEVBQUU7QUFDOUU7QUFFQSxTQUFTLGdCQUFnQixPQUFzRTtBQUM3RixNQUFJLENBQUMsU0FBUyxPQUFPLE1BQU0sU0FBUyxZQUFZLENBQUMsTUFBTSxLQUFLLEtBQUssRUFBRyxRQUFPO0FBQzNFLFNBQU87QUFBQSxJQUNMLE1BQU0sTUFBTSxLQUFLLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRztBQUFBLElBQ3BDLE9BQU8sT0FBTyxNQUFNLFVBQVUsWUFBWSxNQUFNLE1BQU0sS0FBSyxJQUFJLE1BQU0sTUFBTSxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUcsSUFBSTtBQUFBLEVBQ3BHO0FBQ0Y7QUFFQSxTQUFTLG9CQUFvQixPQUE4RTtBQUN6RyxNQUFJLENBQUMsU0FBUyxPQUFPLE1BQU0sZUFBZSxZQUFZLENBQUMsTUFBTSxXQUFXLEtBQUssRUFBRyxRQUFPO0FBQ3ZGLFNBQU87QUFBQSxJQUNMLFlBQVksTUFBTSxXQUFXLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRztBQUFBLElBQ2hELGNBQWMsT0FBTyxNQUFNLGlCQUFpQixZQUFZLE1BQU0sYUFBYSxLQUFLLElBQUksTUFBTSxhQUFhLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRyxJQUFJO0FBQUEsSUFDOUgsYUFBYSxPQUFPLE1BQU0sZ0JBQWdCLFlBQVksTUFBTSxZQUFZLEtBQUssSUFBSSxNQUFNLFlBQVksS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFHLElBQUk7QUFBQSxJQUMxSCxnQkFBZ0IsT0FBTyxNQUFNLG1CQUFtQixZQUFZLE1BQU0sZUFBZSxLQUFLLElBQUksTUFBTSxlQUFlLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRyxJQUFJO0FBQUEsRUFDeEk7QUFDRjtBQUVBLFNBQVMsY0FBYyxPQUF3QztBQUM3RCxTQUFPLFVBQVUsVUFBVSxVQUFVLFdBQVcsVUFBVSxTQUFTLFFBQVE7QUFDN0U7QUFFQSxTQUFTLGNBQWMsT0FBc0M7QUFDM0QsTUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLEVBQUcsUUFBTztBQUNsQyxRQUFNLE9BQU8sTUFBTSxLQUFLLElBQUksSUFBSSxNQUM3QixPQUFPLENBQUMsU0FBeUIsT0FBTyxTQUFTLFFBQVEsRUFDekQsSUFBSSxDQUFDLFNBQVMsS0FBSyxLQUFLLEVBQUUsUUFBUSxNQUFNLEVBQUUsQ0FBQyxFQUMzQyxPQUFPLE9BQU8sQ0FBQyxDQUFDLEVBQ2hCLE1BQU0sR0FBRyxFQUFFO0FBQ2QsU0FBTyxLQUFLLFNBQVMsT0FBTztBQUM5QjtBQUVBLFNBQVMsY0FBYyxPQUF5QyxjQUFtQztBQXBsQm5HO0FBcWxCRSxRQUFNLG1CQUFtQixRQUFPLCtCQUFPLFVBQVMsV0FBVyxNQUFNLE9BQU87QUFDeEUsUUFBTSxvQkFBb0IsTUFBTSxRQUFRLCtCQUFPLE9BQU8sSUFDbEQsTUFBTSxRQUFRLElBQUkscUJBQXFCLEVBQUUsT0FBTyxDQUFDLFVBQXdDLFFBQVEsS0FBSyxDQUFDLElBQ3ZHLENBQUM7QUFDTCxNQUFJLENBQUMsa0JBQWtCLFFBQVE7QUFDN0IsUUFBSSxRQUFPLCtCQUFPLFdBQVUsWUFBWSxNQUFNLE1BQU0sS0FBSyxHQUFHO0FBQzFELHdCQUFrQixLQUFLLEVBQUUsSUFBSSxNQUFNLEdBQUcsTUFBTSxTQUFTLFFBQVEsTUFBTSxNQUFNLEtBQUssR0FBRyxLQUFLLG9CQUFvQixPQUFVLENBQUM7QUFBQSxJQUN2SDtBQUNBLFVBQU0sV0FBVyxrQkFBa0IsK0JBQU8sVUFBVSxnQkFBZ0I7QUFDcEUsVUFBTUMsUUFBTyxrQkFBa0IsVUFBVSxnQkFBZ0I7QUFDekQsUUFBSUEsTUFBTSxtQkFBa0IsS0FBSyxFQUFFLElBQUksTUFBTSxHQUFHLE1BQU0sUUFBUSxNQUFBQSxPQUFNLFNBQVMsQ0FBQztBQUFBLEVBQ2hGO0FBQ0EsUUFBTSxhQUFhLGtCQUFrQixPQUFPLENBQUMsVUFBNEMsTUFBTSxTQUFTLE1BQU07QUFDOUcsUUFBTSxjQUFjLGtCQUFrQixPQUFPLENBQUMsVUFBNkMsTUFBTSxTQUFTLE9BQU87QUFDakgsUUFBTSxPQUFPLFdBQVcsSUFBSSxDQUFDLFVBQVUsTUFBTSxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUUsS0FBSztBQUNsRSxTQUFPO0FBQUEsSUFDTCxJQUFJLFFBQU8sK0JBQU8sUUFBTyxZQUFZLE1BQU0sS0FBSyxNQUFNLEtBQUssTUFBTTtBQUFBLElBQ2pFO0FBQUEsSUFDQSxVQUFVLFdBQVcsV0FBVyxLQUFJLGdCQUFXLENBQUMsTUFBWixtQkFBZSxXQUFXO0FBQUEsSUFDOUQsU0FBUyxrQkFBa0IsU0FBUyxvQkFBb0I7QUFBQSxJQUN4RCxNQUFNLFFBQU8sK0JBQU8sVUFBUyxZQUFZLE1BQU0sS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLEtBQUssSUFBSTtBQUFBLElBQ2pGLE1BQU0sUUFBTywrQkFBTyxVQUFTLFlBQVksTUFBTSxLQUFLLEtBQUssSUFBSSxNQUFNLEtBQUssS0FBSyxJQUFJO0FBQUEsSUFDakYsUUFBTyxpQkFBWSxDQUFDLE1BQWIsbUJBQWdCO0FBQUEsSUFDdkIsT0FBTyxlQUFlLCtCQUFPLEtBQUs7QUFBQSxJQUNsQyxNQUFNLGNBQWMsK0JBQU8sSUFBSTtBQUFBLElBQy9CLFFBQVEsZ0JBQWdCLCtCQUFPLE1BQU07QUFBQSxJQUNyQyxNQUFNLFFBQU8sK0JBQU8sVUFBUyxZQUFZLE1BQU0sS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRSxNQUFNLEdBQUcsRUFBRSxJQUFJO0FBQUEsSUFDOUYsTUFBTSxjQUFjLCtCQUFPLElBQUk7QUFBQSxJQUMvQixNQUFNLGNBQWMsK0JBQU8sSUFBSTtBQUFBLElBQy9CLE9BQU8sZUFBZSwrQkFBTyxLQUFLO0FBQUEsSUFDbEMsWUFBVywrQkFBTyxlQUFjLFFBQVE7QUFBQSxJQUN4QyxVQUFVLE1BQU0sUUFBUSwrQkFBTyxRQUFRLElBQ25DLE1BQU0sU0FBUyxJQUFJLENBQUMsT0FBTyxVQUFVLGNBQWMsT0FBTyxnQkFBTSxRQUFRLENBQUMsRUFBRSxDQUFDLElBQzVFLENBQUM7QUFBQSxFQUNQO0FBQ0Y7QUFFTyxTQUFTLGtCQUFrQixPQUE2QyxnQkFBZ0IsNEJBQXlCO0FBQ3RILFFBQU0sUUFBUSxRQUFPLCtCQUFPLFdBQVUsWUFBWSxNQUFNLE1BQU0sS0FBSyxJQUFJLE1BQU0sTUFBTSxLQUFLLElBQUk7QUFDNUYsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1Q7QUFBQSxJQUNBLFNBQVEsK0JBQU8sWUFBVyxhQUFhLGFBQWE7QUFBQSxJQUNwRCxRQUFPLCtCQUFPLFdBQVUsWUFBVywrQkFBTyxXQUFVLFNBQVMsTUFBTSxRQUFRO0FBQUEsSUFDM0UsWUFBWSxvQkFBb0IsK0JBQU8sVUFBVTtBQUFBLElBQ2pELFlBQVksb0JBQW9CLCtCQUFPLFVBQVU7QUFBQSxJQUNqRCxNQUFNLGNBQWMsK0JBQU8sTUFBTSxLQUFLO0FBQUEsRUFDeEM7QUFDRjtBQUVPLFNBQVMsa0JBQWtCLEtBQThCO0FBQzlELFFBQU0sYUFBYSxrQkFBa0IsS0FBSyxJQUFJLEtBQUs7QUFDbkQsU0FBTyxHQUFHLEtBQUssVUFBVSxZQUFZLE1BQU0sQ0FBQyxDQUFDO0FBQUE7QUFDL0M7QUFFQSxTQUFTLGtCQUFrQixPQUFlLGVBQStDO0FBQ3ZGLE1BQUk7QUFDRixXQUFPLGtCQUFrQixLQUFLLE1BQU0sS0FBSyxHQUErQixhQUFhO0FBQUEsRUFDdkYsU0FBUTtBQUNOLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFQSxTQUFTLGtCQUFrQixRQUFnQixVQUFpQztBQXBwQjVFO0FBcXBCRSxRQUFNLFVBQVUsU0FBUyxRQUFRLHVCQUF1QixNQUFNO0FBQzlELFFBQU0sUUFBUSxPQUFPLE1BQU0sSUFBSSxPQUFPLFFBQVEsVUFBVSx1QkFBdUIsR0FBRyxDQUFDO0FBQ25GLFVBQU8sMENBQVEsT0FBUixtQkFBWSxXQUFaLFlBQXNCO0FBQy9CO0FBRU8sU0FBUyxjQUFjLFFBQWdCLGdCQUFnQiw0QkFBeUI7QUFDckYsUUFBTSxVQUFVLE9BQU8sS0FBSztBQUM1QixNQUFJLFFBQVEsV0FBVyxHQUFHLEtBQUssUUFBUSxTQUFTLEdBQUcsR0FBRztBQUNwRCxVQUFNLFNBQVMsa0JBQWtCLFNBQVMsYUFBYTtBQUN2RCxRQUFJLE9BQVEsUUFBTztBQUFBLEVBQ3JCO0FBRUEsYUFBVyxZQUFZLENBQUMsb0JBQW9CLEdBQUcsa0JBQWtCLEdBQUc7QUFDbEUsVUFBTSxTQUFTLGtCQUFrQixRQUFRLFFBQVE7QUFDakQsUUFBSSxDQUFDLE9BQVE7QUFDYixVQUFNLFNBQVMsa0JBQWtCLFFBQVEsYUFBYTtBQUN0RCxRQUFJLE9BQVEsUUFBTztBQUFBLEVBQ3JCO0FBRUEsU0FBTyxtQkFBbUIsUUFBUSxhQUFhO0FBQ2pEO0FBRU8sU0FBUyxjQUFjLEtBQXVDO0FBQ25FLFNBQU8sS0FBSyxNQUFNLEtBQUssVUFBVSxHQUFHLENBQUM7QUFDdkM7QUFFTyxTQUFTLHNCQUFzQixNQUFnQztBQUNwRSxRQUFNLFFBQVEsS0FBSyxNQUFNLEtBQUssVUFBVSxJQUFJLENBQUM7QUFDN0MsWUFBVSxPQUFPLENBQUMsWUFBWTtBQUM1QixZQUFRLEtBQUssTUFBTTtBQUFBLEVBQ3JCLENBQUM7QUFDRCxTQUFPO0FBQ1Q7QUFFTyxTQUFTLFVBQVUsTUFBbUIsU0FBd0U7QUFDbkgsUUFBTSxRQUFRLENBQUMsTUFBbUIsV0FBcUM7QUFDckUsWUFBUSxNQUFNLE1BQU07QUFDcEIsU0FBSyxTQUFTLFFBQVEsQ0FBQyxVQUFVLE1BQU0sT0FBTyxJQUFJLENBQUM7QUFBQSxFQUNyRDtBQUNBLFFBQU0sTUFBTSxJQUFJO0FBQ2xCO0FBRU8sU0FBUyxhQUFhLE1BQWtDO0FBQzdELFFBQU0sUUFBdUIsQ0FBQztBQUM5QixZQUFVLE1BQU0sQ0FBQyxTQUFTLE1BQU0sS0FBSyxJQUFJLENBQUM7QUFDMUMsU0FBTztBQUNUO0FBRU8sU0FBUyxTQUFTLE1BQW1CLElBQWdDO0FBQzFFLE1BQUksU0FBNkI7QUFDakMsWUFBVSxNQUFNLENBQUMsU0FBUztBQUN4QixRQUFJLEtBQUssT0FBTyxHQUFJLFVBQVM7QUFBQSxFQUMvQixDQUFDO0FBQ0QsU0FBTztBQUNUO0FBRU8sU0FBUyxXQUFXLE1BQW1CLElBQWdDO0FBQzVFLE1BQUksU0FBNkI7QUFDakMsWUFBVSxNQUFNLENBQUMsTUFBTSxXQUFXO0FBQ2hDLFFBQUksS0FBSyxPQUFPLEdBQUksVUFBUztBQUFBLEVBQy9CLENBQUM7QUFDRCxTQUFPO0FBQ1Q7QUFFTyxTQUFTLGNBQWMsTUFBbUIsSUFBMkI7QUFDMUUsUUFBTSxPQUFzQixDQUFDO0FBQzdCLFFBQU0sUUFBUSxDQUFDLFNBQStCO0FBQzVDLFFBQUksS0FBSyxPQUFPLEdBQUksUUFBTztBQUMzQixlQUFXLFNBQVMsS0FBSyxVQUFVO0FBQ2pDLFdBQUssS0FBSyxJQUFJO0FBQ2QsVUFBSSxNQUFNLEtBQUssRUFBRyxRQUFPO0FBQ3pCLFdBQUssSUFBSTtBQUFBLElBQ1g7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUNBLFNBQU8sTUFBTSxJQUFJLElBQUksT0FBTyxDQUFDO0FBQy9CO0FBRU8sU0FBUyxhQUFhLE1BQW1CLElBQXFCO0FBQ25FLFNBQU8sU0FBUyxNQUFNLEVBQUUsTUFBTTtBQUNoQztBQUVPLFNBQVMsV0FBVyxNQUFtQixJQUFxQjtBQXZ1Qm5FO0FBd3VCRSxXQUFTLFFBQVEsR0FBRyxRQUFRLEtBQUssU0FBUyxRQUFRLFNBQVMsR0FBRztBQUM1RCxVQUFJLFVBQUssU0FBUyxLQUFLLE1BQW5CLG1CQUFzQixRQUFPLElBQUk7QUFDbkMsV0FBSyxTQUFTLE9BQU8sT0FBTyxDQUFDO0FBQzdCLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSxRQUFRLEtBQUssU0FBUyxLQUFLO0FBQ2pDLFFBQUksU0FBUyxXQUFXLE9BQU8sRUFBRSxFQUFHLFFBQU87QUFBQSxFQUM3QztBQUNBLFNBQU87QUFDVDtBQXVCTyxTQUFTLHFCQUFxQixPQUE4QjtBQXh3Qm5FO0FBeXdCRSxRQUFNLFFBQVEsTUFBTSxNQUFNLDhDQUE4QztBQUN4RSxVQUFPLDBDQUFRLE9BQVIsbUJBQVksV0FBWixZQUFzQjtBQUMvQjtBQUVPLFNBQVMsZ0JBQWdCLE1BQWlDO0FBQy9ELE1BQUksT0FBTztBQUNYLE1BQUksUUFBUTtBQUNaLFlBQVUsTUFBTSxDQUFDLFNBQVM7QUFDeEIsUUFBSSxDQUFDLEtBQUssS0FBTTtBQUNoQixhQUFTO0FBQ1QsUUFBSSxLQUFLLFNBQVMsT0FBUSxTQUFRO0FBQUEsRUFDcEMsQ0FBQztBQUNELFNBQU8sRUFBRSxNQUFNLE1BQU07QUFDdkI7QUFFTyxTQUFTLGVBQWUsTUFBMkI7QUF4eEIxRDtBQXl4QkUsU0FBTyxDQUFDLGNBQWMsSUFBSSxHQUFHLEtBQUssTUFBTSxLQUFLLE1BQU0sR0FBRyxrQkFBa0IsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFPO0FBenhCNUYsUUFBQUM7QUF5eEIrRixpQkFBTSxTQUFTLFVBQVUsR0FBRyxNQUFNLE1BQU0sS0FBSUEsTUFBQSxNQUFNLFFBQU4sT0FBQUEsTUFBYSxFQUFFLEtBQUssTUFBTTtBQUFBLEdBQUksR0FBRyxLQUFLLE9BQU0sVUFBSyxXQUFMLG1CQUFhLE9BQU0sVUFBSyxTQUFMLG1CQUFXLFdBQVUsVUFBSyxTQUFMLG1CQUFXLE1BQU0sSUFBSSxnQkFBSyxVQUFMLG1CQUFZLFlBQVosWUFBdUIsQ0FBQyxHQUFJLElBQUksZ0JBQUssVUFBTCxtQkFBWSxLQUFLLFdBQWpCLFlBQTJCLENBQUMsR0FBSSxJQUFJLFVBQUssU0FBTCxZQUFhLENBQUMsQ0FBRSxFQUNuVSxPQUFPLENBQUMsVUFBMkIsUUFBUSxLQUFLLENBQUMsRUFDakQsS0FBSyxHQUFHLEVBQ1Isa0JBQWtCO0FBQ3ZCO0FBRUEsU0FBUyxXQUFXLE1BQXNDO0FBQ3hELE1BQUksU0FBUyxPQUFRLFFBQU87QUFDNUIsTUFBSSxTQUFTLFFBQVMsUUFBTztBQUM3QixNQUFJLFNBQVMsT0FBUSxRQUFPO0FBQzVCLFNBQU87QUFDVDtBQUVBLFNBQVMscUJBQXFCLE9BQXVCO0FBQ25ELFNBQU8sTUFBTSxRQUFRLHNCQUFzQixNQUFNO0FBQ25EO0FBRU8sU0FBUyxtQkFBbUIsTUFBb0MsY0FBOEI7QUFDbkcsTUFBSSxFQUFDLDZCQUFNLFFBQVEsUUFBTyxxQkFBcUIsWUFBWTtBQUMzRCxTQUFPLEtBQUssSUFBSSxDQUFDLFFBQVE7QUFDdkIsUUFBSSxRQUFRLHFCQUFxQixJQUFJLElBQUk7QUFDekMsVUFBTSxRQUFRLElBQUk7QUFDbEIsUUFBSSxDQUFDLE1BQU8sUUFBTztBQUNuQixRQUFJLE1BQU0sS0FBTSxTQUFRLEtBQUssS0FBSztBQUNsQyxRQUFJLE1BQU0sT0FBUSxTQUFRLElBQUksS0FBSztBQUNuQyxRQUFJLE1BQU0sT0FBUSxTQUFRLEtBQUssS0FBSztBQUNwQyxRQUFJLE1BQU0sVUFBVyxTQUFRLE1BQU0sS0FBSztBQUN4QyxRQUFJLE1BQU0sTUFBTyxTQUFRLHNCQUFzQixNQUFNLEtBQUssS0FBSyxLQUFLO0FBQ3BFLFdBQU87QUFBQSxFQUNULENBQUMsRUFBRSxLQUFLLEVBQUU7QUFDWjtBQUVPLFNBQVMsZ0JBQWdCLE9BQTZCO0FBQzNELFFBQU0sYUFBYSxDQUFDLFVBQTBCLE1BQU0sV0FBVyxLQUFLLEtBQUssRUFBRSxXQUFXLE1BQU0sTUFBTTtBQUNsRyxRQUFNLFVBQVUsS0FBSyxNQUFNLFFBQVEsSUFBSSxVQUFVLEVBQUUsS0FBSyxLQUFLLENBQUM7QUFDOUQsUUFBTSxhQUFhLE1BQU0sUUFBUSxJQUFJLENBQUMsR0FBRyxVQUFVO0FBNXpCckQ7QUE2ekJJLFVBQU0sYUFBWSxpQkFBTSxlQUFOLG1CQUFtQixXQUFuQixZQUE2QjtBQUMvQyxXQUFPLGNBQWMsV0FBVyxVQUFVLGNBQWMsVUFBVSxTQUFTO0FBQUEsRUFDN0UsQ0FBQztBQUNELFFBQU0sWUFBWSxLQUFLLFdBQVcsS0FBSyxLQUFLLENBQUM7QUFDN0MsUUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUMsUUFBUSxLQUFLLE1BQU0sUUFBUSxJQUFJLENBQUMsR0FBRyxVQUFPO0FBajBCekU7QUFpMEI0RSx1QkFBVyxTQUFJLEtBQUssTUFBVCxZQUFjLEVBQUU7QUFBQSxHQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsSUFBSTtBQUN2SCxTQUFPLENBQUMsU0FBUyxXQUFXLEdBQUcsSUFBSSxFQUFFLEtBQUssSUFBSTtBQUNoRDtBQUVBLFNBQVMsc0JBQXNCLE1BQXdCO0FBQ3JELFFBQU0sUUFBUSxLQUFLLEtBQUssRUFBRSxRQUFRLE9BQU8sRUFBRSxFQUFFLFFBQVEsT0FBTyxFQUFFO0FBQzlELFFBQU0sUUFBa0IsQ0FBQztBQUN6QixNQUFJLFVBQVU7QUFDZCxNQUFJLFVBQVU7QUFDZCxhQUFXLFFBQVEsT0FBTztBQUN4QixRQUFJLFNBQVM7QUFBRSxpQkFBVztBQUFNLGdCQUFVO0FBQU87QUFBQSxJQUFVO0FBQzNELFFBQUksU0FBUyxNQUFNO0FBQUUsZ0JBQVU7QUFBTTtBQUFBLElBQVU7QUFDL0MsUUFBSSxTQUFTLEtBQUs7QUFBRSxZQUFNLEtBQUssUUFBUSxLQUFLLEVBQUUsV0FBVyxRQUFRLElBQUksQ0FBQztBQUFHLGdCQUFVO0FBQUk7QUFBQSxJQUFVO0FBQ2pHLGVBQVc7QUFBQSxFQUNiO0FBQ0EsUUFBTSxLQUFLLFFBQVEsS0FBSyxFQUFFLFdBQVcsUUFBUSxJQUFJLENBQUM7QUFDbEQsU0FBTztBQUNUO0FBRU8sU0FBUyxtQkFBbUIsVUFBdUM7QUFwMUIxRTtBQXExQkUsUUFBTSxRQUFRLFNBQVMsTUFBTSxPQUFPO0FBQ3BDLFdBQVMsUUFBUSxHQUFHLFFBQVEsTUFBTSxTQUFTLEdBQUcsU0FBUyxHQUFHO0FBQ3hELFVBQU0sY0FBYSxpQkFBTSxLQUFLLE1BQVgsbUJBQWMsV0FBZCxZQUF3QjtBQUMzQyxVQUFNLGlCQUFnQixpQkFBTSxRQUFRLENBQUMsTUFBZixtQkFBa0IsV0FBbEIsWUFBNEI7QUFDbEQsUUFBSSxDQUFDLFdBQVcsU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLFNBQVMsR0FBRyxFQUFHO0FBQy9ELFVBQU0sVUFBVSxzQkFBc0IsVUFBVTtBQUNoRCxVQUFNLGFBQWEsc0JBQXNCLGFBQWE7QUFDdEQsUUFBSSxDQUFDLFFBQVEsVUFBVSxXQUFXLFdBQVcsUUFBUSxVQUFVLENBQUMsV0FBVyxNQUFNLENBQUMsU0FBUyxjQUFjLEtBQUssS0FBSyxRQUFRLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRztBQUN6SSxVQUFNLGFBQStCLFdBQVcsSUFBSSxDQUFDLFNBQVM7QUFDNUQsWUFBTSxVQUFVLEtBQUssUUFBUSxPQUFPLEVBQUU7QUFDdEMsVUFBSSxRQUFRLFdBQVcsR0FBRyxLQUFLLFFBQVEsU0FBUyxHQUFHLEVBQUcsUUFBTztBQUM3RCxVQUFJLFFBQVEsU0FBUyxHQUFHLEVBQUcsUUFBTztBQUNsQyxhQUFPO0FBQUEsSUFDVCxDQUFDO0FBQ0QsVUFBTSxPQUFtQixDQUFDO0FBQzFCLGFBQVMsV0FBVyxRQUFRLEdBQUcsV0FBVyxNQUFNLFFBQVEsWUFBWSxHQUFHO0FBQ3JFLFlBQU0sV0FBVSxpQkFBTSxRQUFRLE1BQWQsbUJBQWlCLFdBQWpCLFlBQTJCO0FBQzNDLFVBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxTQUFTLEdBQUcsRUFBRztBQUN4QyxZQUFNLE1BQU0sc0JBQXNCLE9BQU8sRUFBRSxNQUFNLEdBQUcsUUFBUSxNQUFNO0FBQ2xFLGFBQU8sSUFBSSxTQUFTLFFBQVEsT0FBUSxLQUFJLEtBQUssRUFBRTtBQUMvQyxXQUFLLEtBQUssR0FBRztBQUFBLElBQ2Y7QUFDQSxZQUFPLG9CQUFlLEVBQUUsU0FBUyxNQUFNLFlBQVksUUFBUSxXQUFXLENBQUMsTUFBaEUsWUFBcUU7QUFBQSxFQUM5RTtBQUNBLFNBQU87QUFDVDtBQUVPLFNBQVMsZ0JBQWdCLFVBQTJDO0FBaDNCM0U7QUFpM0JFLFFBQU0sUUFBUSxTQUFTLE1BQU0sK0JBQStCO0FBQzVELE1BQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsVUFBTyxtQkFBYyxFQUFFLFdBQVUsV0FBTSxDQUFDLE1BQVAsbUJBQVUsUUFBUSxPQUFNLFdBQU0sQ0FBQyxNQUFQLFlBQVksR0FBRyxDQUFDLE1BQWxFLFlBQXVFO0FBQ2hGO0FBRU8sU0FBUyxnQkFBZ0IsTUFBd0M7QUFDdEUsTUFBSSxDQUFDLEtBQUssU0FBUyxPQUFRLFFBQU87QUFDbEMsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLHNCQUFPLGdCQUFNLGdCQUFNLGdCQUFNLDBCQUFNO0FBQUEsSUFDekMsTUFBTSxLQUFLLFNBQVMsSUFBSSxDQUFDLFVBQU87QUExM0JwQztBQTAzQnVDO0FBQUEsUUFDakMsY0FBYyxLQUFLO0FBQUEsU0FDbkIsV0FBTSxTQUFOLFlBQWM7QUFBQSxRQUNkLE1BQU0sU0FBUyxTQUFTLHVCQUFRLE1BQU0sU0FBUyxVQUFVLHVCQUFRLE1BQU0sU0FBUyxTQUFTLGlCQUFPO0FBQUEsU0FDaEcsaUJBQU0sU0FBTixtQkFBWSxLQUFLLFVBQWpCLFlBQTBCO0FBQUEsUUFDMUIsT0FBTyxNQUFNLFNBQVMsTUFBTTtBQUFBLE1BQzlCO0FBQUEsS0FBQztBQUFBLElBQ0QsWUFBWSxDQUFDLFFBQVEsUUFBUSxVQUFVLFFBQVEsT0FBTztBQUFBLElBQ3RELFFBQVE7QUFBQSxFQUNWO0FBQ0Y7QUFFTyxTQUFTLG1CQUFtQixLQUE4QjtBQXQ0QmpFO0FBdTRCRSxRQUFNLGVBQWUsQ0FBQyxTQUFnQztBQXY0QnhELFFBQUFBO0FBdzRCSSxVQUFNLFNBQW1CLENBQUM7QUFDMUIsZUFBVyxTQUFTLGtCQUFrQixJQUFJLEdBQUc7QUFDM0MsVUFBSSxNQUFNLFNBQVMsUUFBUTtBQUN6QixjQUFNLFFBQVEsbUJBQW1CLE1BQU0sVUFBVSxNQUFNLElBQUk7QUFDM0QsWUFBSSxNQUFPLFFBQU8sS0FBSyxLQUFLO0FBQUEsTUFDOUIsT0FBTztBQUNMLGVBQU8sS0FBSyxLQUFLLHNCQUFxQkEsTUFBQSxNQUFNLFFBQU4sT0FBQUEsTUFBYSxjQUFJLENBQUMsS0FBSyxNQUFNLE1BQU0sR0FBRztBQUFBLE1BQzlFO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQ0EsUUFBTSxhQUFhLGFBQWEsSUFBSSxJQUFJO0FBQ3hDLFFBQU0sYUFBWSxnQkFBVyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sV0FBVyxJQUFJLENBQUMsTUFBbEQsWUFBdUQsSUFBSTtBQUM3RSxRQUFNLGVBQWEsU0FBSSxLQUFLLFNBQVQsbUJBQWUsVUFBUyxJQUFJLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxRQUFRLElBQUksR0FBRyxFQUFFLEVBQUUsS0FBSyxHQUFHLENBQUMsS0FBSztBQUNuRyxRQUFNLFFBQWtCLENBQUMsS0FBSyxJQUFJLEtBQUssT0FBTyxHQUFHLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRSxHQUFHLFNBQVMsR0FBRyxVQUFVLEVBQUU7QUFDakcsYUFBVyxPQUFPLENBQUMsVUFBVSxVQUFVLFNBQVMsRUFBRSxRQUFRLENBQUMsVUFBVSxNQUFNLEtBQUssS0FBSyxDQUFDO0FBQ3RGLFFBQU0sUUFBUSxDQUFDLE1BQW1CLFVBQXdCO0FBeDVCNUQsUUFBQUEsS0FBQUMsS0FBQTtBQXk1QkksVUFBTSxTQUFTLEtBQUssT0FBTyxLQUFLLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQztBQUNqRCxVQUFNLFNBQU9ELE1BQUEsS0FBSyxTQUFMLGdCQUFBQSxJQUFXLFVBQVMsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLFFBQVEsSUFBSSxHQUFHLEVBQUUsRUFBRSxLQUFLLEdBQUcsQ0FBQyxLQUFLO0FBQ3JGLFVBQU0sT0FBTyxLQUFLLE9BQU8sV0FBTSxLQUFLLElBQUksS0FBSztBQUM3QyxVQUFNLFNBQVMsYUFBYSxJQUFJO0FBQ2hDLFVBQU0sYUFBWSxZQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxXQUFXLElBQUksQ0FBQyxNQUE5QyxhQUFvREMsTUFBQSxPQUFPLENBQUMsTUFBUixPQUFBQSxNQUFhO0FBQ25GLFVBQU0sS0FBSyxHQUFHLE1BQU0sS0FBSyxXQUFXLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxPQUFPLEdBQUcsS0FBSyxJQUFJLE1BQU0sRUFBRSxHQUFHLFNBQVMsR0FBRyxJQUFJLEdBQUcsSUFBSSxFQUFFO0FBQzdHLFdBQU8sT0FBTyxDQUFDLFVBQVUsVUFBVSxTQUFTLEVBQUUsUUFBUSxDQUFDLFVBQVUsTUFBTSxLQUFLLEdBQUcsTUFBTSxLQUFLLEtBQUssRUFBRSxDQUFDO0FBQ2xHLFFBQUksS0FBSyxLQUFNLE9BQU0sS0FBSyxHQUFHLE1BQU0sT0FBTyxLQUFLLEtBQUssV0FBVyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzNFLFFBQUksS0FBSyxPQUFRLE9BQU0sS0FBSyxHQUFHLE1BQU0saUNBQWEsS0FBSyxPQUFPLElBQUksSUFBSTtBQUN0RSxRQUFJLEtBQUssTUFBTyxPQUFNLEtBQUssSUFBSSxHQUFHLGdCQUFnQixLQUFLLEtBQUssRUFBRSxNQUFNLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sS0FBSyxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQ2pILFFBQUksS0FBSyxLQUFNLE9BQU0sS0FBSyxHQUFHLE1BQU0sWUFBVyxVQUFLLEtBQUssYUFBVixZQUFzQixFQUFFLElBQUksR0FBRyxLQUFLLEtBQUssS0FBSyxNQUFNLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sS0FBSyxJQUFJLEVBQUUsR0FBRyxHQUFHLE1BQU0sVUFBVTtBQUNoSyxTQUFLLFNBQVMsUUFBUSxDQUFDLFVBQVUsTUFBTSxPQUFPLFFBQVEsQ0FBQyxDQUFDO0FBQUEsRUFDMUQ7QUFDQSxNQUFJLEtBQUssU0FBUyxRQUFRLENBQUMsVUFBVSxNQUFNLE9BQU8sQ0FBQyxDQUFDO0FBQ3BELFNBQU8sTUFBTSxLQUFLLElBQUk7QUFDeEI7QUFFQSxTQUFTLGNBQWMsT0FBb0Q7QUExNkIzRTtBQTI2QkUsUUFBTSxRQUFRLE1BQU0sTUFBTSx3QkFBd0I7QUFDbEQsTUFBSSxDQUFDLE1BQU8sUUFBTyxFQUFFLE1BQU0sTUFBTTtBQUNqQyxRQUFNLFNBQVMsTUFBTSxDQUFDO0FBQ3RCLFFBQU0sT0FBbUIsV0FBVyxPQUFPLFdBQVcsTUFBTSxTQUFTLFdBQVcsTUFBTSxVQUFVO0FBQ2hHLFNBQU8sRUFBRSxRQUFNLFdBQU0sQ0FBQyxNQUFQLG1CQUFVLFdBQVUsZ0JBQU0sS0FBSztBQUNoRDtBQUVPLFNBQVMsbUJBQW1CLFVBQWtCLGdCQUFnQiw0QkFBeUI7QUFsN0I5RjtBQW03QkUsUUFBTSxNQUFNLHNCQUFzQixhQUFhO0FBQy9DLE1BQUksS0FBSyxXQUFXLENBQUM7QUFDckIsUUFBTSxRQUFxRCxDQUFDLEVBQUUsT0FBTyxHQUFHLE1BQU0sSUFBSSxLQUFLLENBQUM7QUFDeEYsTUFBSSxlQUFlO0FBRW5CLGFBQVcsV0FBVyxTQUFTLE1BQU0sT0FBTyxHQUFHO0FBQzdDLFVBQU0sT0FBTyxRQUFRLFFBQVE7QUFDN0IsUUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLEtBQUssVUFBVSxFQUFFLFdBQVcsS0FBSyxLQUFLLEtBQUssVUFBVSxFQUFFLFdBQVcsS0FBSyxLQUFLLFFBQVEsS0FBSyxJQUFJLEVBQUc7QUFFcEgsVUFBTSxVQUFVLEtBQUssTUFBTSwwQkFBMEI7QUFDckQsVUFBTSxTQUFTLEtBQUssTUFBTSx5QkFBeUI7QUFDbkQsVUFBTSxXQUFXLEtBQUssTUFBTSwyQkFBMkI7QUFFdkQsUUFBSSxTQUFTO0FBQ1gsWUFBTSxTQUFRLG1CQUFRLENBQUMsTUFBVCxtQkFBWSxXQUFaLFlBQXNCO0FBQ3BDLFlBQU0sUUFBTyxtQkFBUSxDQUFDLE1BQVQsbUJBQVksV0FBWixZQUFzQjtBQUNuQyxVQUFJLFVBQVUsS0FBSyxDQUFDLGNBQWM7QUFDaEMsWUFBSSxLQUFLLE9BQU87QUFDaEIsWUFBSSxRQUFRO0FBQ1osdUJBQWU7QUFDZixjQUFNLFNBQVM7QUFBQSxNQUNqQixPQUFPO0FBQ0wsY0FBTSxPQUFPLFdBQVcsSUFBSTtBQUM1QixlQUFPLE1BQU0sU0FBUyxPQUFNLGlCQUFNLEdBQUcsRUFBRSxNQUFYLG1CQUFjLFVBQWQsWUFBdUIsTUFBTSxNQUFPLE9BQU0sSUFBSTtBQUMxRSxjQUFNLFVBQVMsaUJBQU0sR0FBRyxFQUFFLE1BQVgsbUJBQWMsU0FBZCxZQUFzQixJQUFJO0FBQ3pDLGVBQU8sU0FBUyxLQUFLLElBQUk7QUFDekIsY0FBTSxLQUFLLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFBQSxNQUM1QjtBQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0sWUFBWSwwQkFBVTtBQUM1QixRQUFJLFdBQVc7QUFDYixZQUFNLFdBQVUsZUFBVSxDQUFDLE1BQVgsWUFBZ0IsSUFBSSxXQUFXLEtBQU0sSUFBSSxFQUFFO0FBQzNELFlBQU0sUUFBUSxLQUFLLE1BQU0sU0FBUyxDQUFDLElBQUk7QUFDdkMsWUFBTSxTQUFTLGdCQUFlLGVBQVUsQ0FBQyxNQUFYLFlBQWdCLGdCQUFNLEtBQUssQ0FBQztBQUMxRCxZQUFNLE9BQU8sV0FBVyxPQUFPLElBQUk7QUFDbkMsV0FBSyxPQUFPLE9BQU87QUFDbkIsYUFBTyxNQUFNLFNBQVMsT0FBTSxpQkFBTSxHQUFHLEVBQUUsTUFBWCxtQkFBYyxVQUFkLFlBQXVCLE1BQU0sTUFBTyxPQUFNLElBQUk7QUFDMUUsWUFBTSxVQUFTLGlCQUFNLEdBQUcsRUFBRSxNQUFYLG1CQUFjLFNBQWQsWUFBc0IsSUFBSTtBQUN6QyxhQUFPLFNBQVMsS0FBSyxJQUFJO0FBQ3pCLFlBQU0sS0FBSyxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQUEsSUFDNUI7QUFBQSxFQUNGO0FBRUEsTUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLE9BQVEsS0FBSSxLQUFLLFNBQVMsS0FBSyxXQUFXLGdCQUFNLENBQUM7QUFDeEUsU0FBTztBQUNUOzs7QUNsK0JBLHNCQUF1RDs7O0FDU2hELElBQU0sd0JBQXVEO0FBQUEsRUFDbEU7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxNQUNWLGlCQUFpQjtBQUFBLE1BQ2pCLG1CQUFtQjtBQUFBLE1BQ25CLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGNBQWMsQ0FBQyxXQUFXLFdBQVcsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUFBLElBQ2pGO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxNQUNWLGlCQUFpQjtBQUFBLE1BQ2pCLG1CQUFtQjtBQUFBLE1BQ25CLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGNBQWMsQ0FBQyxXQUFXLFdBQVcsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUFBLElBQ2pGO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxNQUNWLGlCQUFpQjtBQUFBLE1BQ2pCLG1CQUFtQjtBQUFBLE1BQ25CLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGNBQWMsQ0FBQyxXQUFXLFdBQVcsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUFBLElBQ2pGO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxNQUNWLGlCQUFpQjtBQUFBLE1BQ2pCLG1CQUFtQjtBQUFBLE1BQ25CLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGNBQWMsQ0FBQyxXQUFXLFdBQVcsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUFBLElBQ2pGO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxNQUNWLGlCQUFpQjtBQUFBLE1BQ2pCLG1CQUFtQjtBQUFBLE1BQ25CLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGNBQWMsQ0FBQyxXQUFXLFdBQVcsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUFBLElBQ2pGO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxNQUNWLGlCQUFpQjtBQUFBLE1BQ2pCLG1CQUFtQjtBQUFBLE1BQ25CLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGNBQWMsQ0FBQyxXQUFXLFdBQVcsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUFBLElBQ2pGO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxNQUNWLGlCQUFpQjtBQUFBLE1BQ2pCLG1CQUFtQjtBQUFBLE1BQ25CLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGNBQWMsQ0FBQyxXQUFXLFdBQVcsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUFBLElBQ2pGO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLElBQUk7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxNQUNWLGlCQUFpQjtBQUFBLE1BQ2pCLG1CQUFtQjtBQUFBLE1BQ25CLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLGNBQWM7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLGNBQWMsQ0FBQyxXQUFXLFdBQVcsV0FBVyxTQUFTO0FBQUEsSUFDM0Q7QUFBQSxFQUNGO0FBQUEsRUFDQTtBQUFBLElBQ0UsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sYUFBYTtBQUFBLElBQ2IsWUFBWTtBQUFBLE1BQ1YsaUJBQWlCO0FBQUEsTUFDakIsbUJBQW1CO0FBQUEsTUFDbkIsY0FBYztBQUFBLE1BQ2QsWUFBWTtBQUFBLE1BQ1osVUFBVTtBQUFBLE1BQ1YsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLE1BQ2YsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsaUJBQWlCO0FBQUEsTUFDakIsaUJBQWlCO0FBQUEsTUFDakIsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLE1BQ2YsY0FBYztBQUFBLE1BQ2Qsa0JBQWtCO0FBQUEsTUFDbEIsY0FBYyxDQUFDLFdBQVcsV0FBVyxXQUFXLFdBQVcsV0FBVyxTQUFTO0FBQUEsSUFDakY7QUFBQSxFQUNGO0FBQUEsRUFDQTtBQUFBLElBQ0UsSUFBSTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sYUFBYTtBQUFBLElBQ2IsWUFBWTtBQUFBLE1BQ1YsaUJBQWlCO0FBQUEsTUFDakIsbUJBQW1CO0FBQUEsTUFDbkIsY0FBYztBQUFBLE1BQ2QsWUFBWTtBQUFBLE1BQ1osVUFBVTtBQUFBLE1BQ1YsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLE1BQ2YsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsaUJBQWlCO0FBQUEsTUFDakIsaUJBQWlCO0FBQUEsTUFDakIsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLE1BQ2YsY0FBYztBQUFBLE1BQ2Qsa0JBQWtCO0FBQUEsTUFDbEIsY0FBYyxDQUFDLFdBQVcsV0FBVyxXQUFXLFdBQVcsV0FBVyxTQUFTO0FBQUEsSUFDakY7QUFBQSxFQUNGO0FBQ0Y7QUFFTyxTQUFTLHNCQUFzQixJQUFzRTtBQUMxRyxTQUFPLHNCQUFzQixLQUFLLENBQUMsV0FBVyxPQUFPLE9BQU8sRUFBRTtBQUNoRTtBQUVPLFNBQVMsMEJBQTBCLElBQTZDO0FBMVF2RjtBQTJRRSxRQUFNLFVBQVMsMkJBQXNCLEVBQUUsTUFBeEIsWUFBNkIsc0JBQXNCLENBQUM7QUFDbkUsU0FBTztBQUFBLElBQ0wsR0FBRyxPQUFPO0FBQUEsSUFDVixhQUFhLE9BQU87QUFBQSxJQUNwQixjQUFjLE9BQU8sV0FBVyxlQUFlLENBQUMsR0FBRyxPQUFPLFdBQVcsWUFBWSxJQUFJO0FBQUEsRUFDdkY7QUFDRjs7O0FEN05PLFNBQVMsc0JBQXNCLFFBQVEsR0FBb0I7QUFDaEUsU0FBTztBQUFBLElBQ0wsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUFBLElBQzdFLE1BQU0sZ0JBQU0sS0FBSztBQUFBLElBQ2pCLFNBQVM7QUFBQSxJQUNULFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLFVBQVU7QUFBQSxJQUNWLFdBQVc7QUFBQSxJQUNYLFNBQVM7QUFBQSxJQUNULGNBQWM7QUFBQSxFQUNoQjtBQUNGO0FBZ0RPLElBQU0sbUJBQTBDO0FBQUEsRUFDckQsZUFBZTtBQUFBLEVBQ2YsWUFBWTtBQUFBLEVBQ1osYUFBYTtBQUFBLEVBQ2IsZUFBZTtBQUFBLEVBQ2YsY0FBYztBQUFBLEVBQ2Qsa0JBQWtCO0FBQUEsRUFDbEIscUJBQXFCO0FBQUEsRUFDckIsVUFBVTtBQUFBLEVBQ1Ysa0JBQWtCO0FBQUEsRUFDbEIsZUFBZTtBQUFBLEVBQ2YsY0FBYztBQUFBLEVBQ2QsZ0JBQWdCO0FBQUEsRUFDaEIsb0JBQW9CO0FBQUEsRUFDcEIsaUJBQWlCO0FBQUEsRUFDakIsbUJBQW1CO0FBQUEsRUFDbkIsd0JBQXdCO0FBQUEsRUFDeEIsWUFBWTtBQUFBLEVBQ1osWUFBWTtBQUFBLEVBQ1osVUFBVTtBQUFBLEVBQ1YsV0FBVztBQUFBLEVBQ1gsV0FBVztBQUFBLEVBQ1gsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsY0FBYztBQUFBLEVBQ2QsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2Ysa0JBQWtCO0FBQUEsRUFDbEIsY0FBYyxDQUFDLFdBQVcsV0FBVyxXQUFXLFdBQVcsV0FBVyxTQUFTO0FBQUEsRUFDL0UscUJBQXFCO0FBQUEsRUFDckIsV0FBVztBQUFBLEVBQ1gsaUJBQWlCO0FBQUEsRUFDakIsaUJBQWlCO0FBQUEsRUFDakIsaUJBQWlCO0FBQUEsRUFDakIsbUJBQW1CO0FBQUEsRUFDbkIsc0JBQXNCO0FBQUEsRUFDdEIsWUFBWSxDQUFDO0FBQUEsRUFDYixtQkFBbUI7QUFBQSxFQUNuQix3QkFBd0I7QUFBQSxFQUN4QixtQkFBbUIsQ0FBQztBQUFBLEVBQ3BCLHdCQUF3QjtBQUFBLEVBQ3hCLHNCQUFzQjtBQUFBLEVBQ3RCLDZCQUE2QjtBQUFBLEVBQzdCLCtCQUErQjtBQUNqQztBQUVPLFNBQVMscUJBQXFCLFVBQW9EO0FBQ3ZGLFNBQU87QUFBQSxJQUNMLGFBQWEsU0FBUztBQUFBLElBQ3RCLGlCQUFpQixTQUFTLG1CQUFtQjtBQUFBLElBQzdDLG1CQUFtQixTQUFTO0FBQUEsSUFDNUIsY0FBYyxTQUFTLDBCQUEwQjtBQUFBLElBQ2pELFlBQVksU0FBUztBQUFBLElBQ3JCLFlBQVksU0FBUyxXQUFXLEtBQUssS0FBSztBQUFBLElBQzFDLFVBQVUsU0FBUztBQUFBLElBQ25CLFdBQVcsU0FBUyxhQUFhO0FBQUEsSUFDakMsV0FBVyxTQUFTO0FBQUEsSUFDcEIsV0FBVyxTQUFTO0FBQUEsSUFDcEIsZUFBZSxTQUFTO0FBQUEsSUFDeEIsY0FBYyxTQUFTO0FBQUEsSUFDdkIsV0FBVyxTQUFTLGFBQWE7QUFBQSxJQUNqQyxlQUFlLFNBQVMsaUJBQWlCO0FBQUEsSUFDekMsa0JBQWtCLFNBQVM7QUFBQSxJQUMzQixjQUFjLFNBQVMsYUFBYSxTQUFTLENBQUMsR0FBRyxTQUFTLFlBQVksSUFBSTtBQUFBLElBQzFFLFdBQVcsU0FBUyx1QkFBdUI7QUFBQSxJQUMzQyxXQUFXLFNBQVMsYUFBYTtBQUFBLElBQ2pDLGlCQUFpQixTQUFTLG1CQUFtQjtBQUFBLElBQzdDLGlCQUFpQixTQUFTO0FBQUEsSUFDMUIsTUFBTSxTQUFTO0FBQUEsSUFDZixRQUFRLFNBQVM7QUFBQSxJQUNqQixXQUFXLFNBQVM7QUFBQSxFQUN0QjtBQUNGO0FBRU8sU0FBUywyQkFBMkIsVUFBaUMsVUFBc0M7QUExTGxIO0FBMkxFLFFBQU0sYUFBYSwwQkFBMEIsUUFBUTtBQUNyRCxXQUFTLHFCQUFxQjtBQUM5QixXQUFTLG1CQUFrQixnQkFBVyxvQkFBWCxZQUE4QjtBQUN6RCxXQUFTLHFCQUFvQixnQkFBVyxzQkFBWCxZQUFnQztBQUM3RCxXQUFTLDBCQUF5QixnQkFBVyxpQkFBWCxZQUEyQjtBQUM3RCxXQUFTLGNBQWEsZ0JBQVcsZUFBWCxZQUF5QjtBQUMvQyxXQUFTLGNBQWEsZ0JBQVcsZUFBWCxZQUF5QjtBQUMvQyxXQUFTLFlBQVcsZ0JBQVcsYUFBWCxZQUF1QjtBQUMzQyxXQUFTLGFBQVksZ0JBQVcsY0FBWCxZQUF3QjtBQUM3QyxXQUFTLGFBQVksZ0JBQVcsY0FBWCxZQUF3QjtBQUM3QyxXQUFTLGFBQVksZ0JBQVcsY0FBWCxZQUF3QjtBQUM3QyxXQUFTLGlCQUFnQixnQkFBVyxrQkFBWCxZQUE0QjtBQUNyRCxXQUFTLGdCQUFlLGdCQUFXLGlCQUFYLFlBQTJCLEtBQUssSUFBSSxHQUFHLFNBQVMsU0FBUztBQUNqRixXQUFTLGFBQVksZ0JBQVcsY0FBWCxZQUF3QjtBQUM3QyxXQUFTLGlCQUFnQixnQkFBVyxrQkFBWCxZQUE0QjtBQUNyRCxXQUFTLG1CQUFtQixXQUFXLHFCQUFxQjtBQUM1RCxXQUFTLGVBQWUsV0FBVyxlQUFlLENBQUMsR0FBRyxXQUFXLFlBQVksSUFBSSxDQUFDO0FBQ2xGLFdBQVMsdUJBQXNCLGdCQUFXLGNBQVgsWUFBd0I7QUFDdkQsV0FBUyxhQUFZLGdCQUFXLGNBQVgsWUFBd0I7QUFDN0MsV0FBUyxtQkFBa0IsZ0JBQVcsb0JBQVgsWUFBOEI7QUFDekQsV0FBUyxtQkFBa0IsZ0JBQVcsb0JBQVgsWUFBOEI7QUFDekQsV0FBUyxrQkFBa0IsV0FBVyxTQUFTO0FBQy9DLFdBQVMsb0JBQW9CLFdBQVcsV0FBVztBQUNuRCxXQUFTLHVCQUF1QixXQUFXLGNBQWM7QUFDM0Q7QUFFTyxJQUFNLDBCQUFOLGNBQXNDLGlDQUFpQjtBQUFBLEVBRzVELFlBQVksS0FBVSxRQUE2QjtBQUNqRCxVQUFNLEtBQUssTUFBTTtBQUNqQixTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsVUFBZ0I7QUE3TmxCO0FBOE5JLFVBQU0sRUFBRSxZQUFZLElBQUk7QUFDeEIsZ0JBQVksTUFBTTtBQUNsQixnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3JELGdCQUFZLFNBQVMsS0FBSztBQUFBLE1BQ3hCLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLDJCQUFPLENBQUM7QUFFM0MsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsMEJBQU0sRUFDZCxRQUFRLGtQQUEwQyxFQUNsRCxZQUFZLENBQUMsYUFBYTtBQUN6QixpQkFBVyxVQUFVLHNCQUF1QixVQUFTLFVBQVUsT0FBTyxJQUFJLE9BQU8sSUFBSTtBQUNyRixlQUFTLFNBQVMsS0FBSyxPQUFPLFNBQVMsa0JBQWtCO0FBQ3pELGVBQVMsU0FBUyxPQUFPLFVBQVU7QUFDakMsbUNBQTJCLEtBQUssT0FBTyxVQUFVLEtBQTZCO0FBQzlFLGNBQU0sS0FBSyxlQUFlO0FBQzFCLGFBQUssUUFBUTtBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVILFVBQU0sZUFBZSxZQUFZLFVBQVUsRUFBRSxLQUFLLHdCQUF3QixDQUFDO0FBQzNFLGVBQVcsVUFBVSx1QkFBdUI7QUFDMUMsWUFBTSxPQUFPLGFBQWEsU0FBUyxVQUFVO0FBQUEsUUFDM0MsS0FBSyx5QkFBeUIsT0FBTyxPQUFPLEtBQUssT0FBTyxTQUFTLHFCQUFxQixpQkFBaUIsRUFBRTtBQUFBLFFBQ3pHLE1BQU0sRUFBRSxNQUFNLFVBQVUsT0FBTyxPQUFPLFlBQVk7QUFBQSxNQUNwRCxDQUFDO0FBQ0QsWUFBTSxXQUFXLEtBQUssVUFBVSxFQUFFLEtBQUssNkJBQTZCLENBQUM7QUFDckUsWUFBTSxTQUFTLENBQUMsT0FBTyxXQUFXLFdBQVcsS0FBSSxZQUFPLFdBQVcsaUJBQWxCLFlBQWtDLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLFVBQTJCLFFBQVEsS0FBSyxDQUFDO0FBQ3JKLGFBQU8sUUFBUSxDQUFDLFVBQVU7QUFBRSxjQUFNLE1BQU0sU0FBUyxXQUFXO0FBQUcsWUFBSSxNQUFNLGtCQUFrQjtBQUFBLE1BQU8sQ0FBQztBQUNuRyxXQUFLLFVBQVUsRUFBRSxLQUFLLDBCQUEwQixNQUFNLE9BQU8sS0FBSyxDQUFDO0FBQ25FLFdBQUssaUJBQWlCLFNBQVMsTUFBTTtBQUNuQyxtQ0FBMkIsS0FBSyxPQUFPLFVBQVUsT0FBTyxFQUFFO0FBQzFELGFBQUssS0FBSyxlQUFlLEVBQUUsS0FBSyxNQUFNLEtBQUssUUFBUSxDQUFDO0FBQUEsTUFDdEQsQ0FBQztBQUFBLElBQ0g7QUFFQSxnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLGlDQUFRLENBQUM7QUFFNUMsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsNENBQVMsRUFDakIsUUFBUSxzSkFBbUMsRUFDM0MsUUFBUSxDQUFDLFNBQVMsS0FDaEIsZUFBZSxXQUFXLEVBQzFCLFNBQVMsS0FBSyxPQUFPLFNBQVMsYUFBYSxFQUMzQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxnQkFBZ0IsTUFBTSxLQUFLLEVBQUUsUUFBUSxjQUFjLEVBQUU7QUFDMUUsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2pDLENBQUMsQ0FBQztBQUVOLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGdDQUFPLEVBQ2YsUUFBUSxnY0FBNkYsRUFDckcsUUFBUSxDQUFDLFNBQVMsS0FDaEIsZUFBZSxnQkFBZ0IsRUFDL0IsU0FBUyxLQUFLLE9BQU8sU0FBUyxXQUFXLEVBQ3pDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLFdBQUssT0FBTyxTQUFTLGNBQWMsTUFBTSxLQUFLLEVBQUUsUUFBUSxjQUFjLEVBQUUsS0FBSztBQUM3RSxZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDakMsQ0FBQyxDQUFDO0FBRU4sZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxpQ0FBUSxDQUFDO0FBRTVDLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDhEQUFZLEVBQ3BCLFFBQVEsc1JBQWdELEVBQ3hELFVBQVUsQ0FBQyxXQUFXLE9BQ3BCLFNBQVMsS0FBSyxPQUFPLFNBQVMsb0JBQW9CLEVBQ2xELFNBQVMsT0FBTyxVQUFVO0FBQ3pCLFdBQUssT0FBTyxTQUFTLHVCQUF1QjtBQUM1QyxZQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLFdBQUssUUFBUTtBQUFBLElBQ2YsQ0FBQyxDQUFDO0FBRU4sUUFBSSxLQUFLLE9BQU8sU0FBUyxzQkFBc0I7QUFDN0MsVUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsa0RBQVUsRUFDbEIsUUFBUSx5S0FBa0MsRUFDMUMsVUFBVSxDQUFDLFdBQVcsT0FDcEIsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUNsQixrQkFBa0IsRUFDbEIsU0FBUyxLQUFLLE9BQU8sU0FBUywyQkFBMkIsRUFDekQsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsOEJBQThCO0FBQ25ELGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDLENBQUM7QUFFTixVQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSw4REFBWSxFQUNwQixRQUFRLHNMQUFnQyxFQUN4QyxVQUFVLENBQUMsV0FBVyxPQUNwQixTQUFTLEtBQUssT0FBTyxTQUFTLDZCQUE2QixFQUMzRCxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sU0FBUyxnQ0FBZ0M7QUFDckQsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUMsQ0FBQztBQUFBLElBQ1I7QUFFQSxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSx3REFBVyxFQUNuQixRQUFRLG9UQUFxRCxFQUM3RCxVQUFVLENBQUMsV0FBVyxPQUNwQixTQUFTLEtBQUssT0FBTyxTQUFTLGlCQUFpQixFQUMvQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxvQkFBb0I7QUFDekMsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixXQUFLLFFBQVE7QUFBQSxJQUNmLENBQUMsQ0FBQztBQUVOLFFBQUksS0FBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQzFDLFVBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLHNDQUFRLEVBQ2hCLFFBQVEsc0lBQTZCLEVBQ3JDLFVBQVUsQ0FBQyxXQUFXLE9BQ3BCLFVBQVUsR0FBRyxLQUFLLENBQUMsRUFDbkIsa0JBQWtCLEVBQ2xCLFNBQVMsS0FBSyxPQUFPLFNBQVMsc0JBQXNCLEVBQ3BELFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGFBQUssT0FBTyxTQUFTLHlCQUF5QjtBQUM5QyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQyxDQUFDO0FBRU4sVUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsb0VBQWEsRUFDckIsUUFBUSxvV0FBNkQsRUFDckUsVUFBVSxDQUFDLFdBQVcsT0FDcEIsU0FBUyxLQUFLLE9BQU8sU0FBUyxzQkFBc0IsRUFDcEQsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMseUJBQXlCO0FBQzlDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDLENBQUM7QUFBQSxJQUNSO0FBRUEsVUFBTSxRQUFRLEtBQUssT0FBTyxTQUFTO0FBQ25DLFVBQU0sY0FBYyxZQUFZLFVBQVUsRUFBRSxLQUFLLHlCQUF5QixDQUFDO0FBQzNFLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sMkJBQU8sQ0FBQztBQUMzQyxVQUFNLFVBQVUsWUFBWSxTQUFTLFVBQVUsRUFBRSxNQUFNLDRCQUFRLE1BQU0sRUFBRSxNQUFNLFNBQVMsRUFBRSxDQUFDO0FBQ3pGLFlBQVEsaUJBQWlCLFNBQVMsTUFBTTtBQUN0QyxZQUFNLE9BQU8sc0JBQXNCLE1BQU0sU0FBUyxDQUFDO0FBQ25ELFdBQUssT0FBTyxTQUFTLFdBQVcsS0FBSyxJQUFJO0FBQ3pDLFdBQUssS0FBSyxPQUFPLGFBQWEsRUFBRSxLQUFLLE1BQU0sS0FBSyxRQUFRLENBQUM7QUFBQSxJQUMzRCxDQUFDO0FBRUQsUUFBSSxDQUFDLE1BQU0sUUFBUTtBQUNqQixrQkFBWSxVQUFVLEVBQUUsS0FBSyxpREFBaUQsTUFBTSwrTUFBcUMsQ0FBQztBQUFBLElBQzVIO0FBRUEsVUFBTSxRQUFRLENBQUMsTUFBTSxVQUFVO0FBQzdCLFlBQU0sT0FBTyxZQUFZLFVBQVUsRUFBRSxLQUFLLHNCQUFzQixDQUFDO0FBQ2pFLFlBQU0sUUFBUSxLQUFLLFVBQVUsRUFBRSxLQUFLLDRCQUE0QixDQUFDO0FBQ2pFLFlBQU0sU0FBUyxVQUFVLEVBQUUsTUFBTSxLQUFLLFFBQVEsZ0JBQU0sUUFBUSxDQUFDLEdBQUcsQ0FBQztBQUNqRSxZQUFNLFNBQVMsTUFBTSxXQUFXLEVBQUUsS0FBSyx5QkFBeUIsTUFBTSxLQUFLLFVBQVUsdUJBQVEscUJBQU0sQ0FBQztBQUNwRyxhQUFPLFlBQVksY0FBYyxLQUFLLE9BQU87QUFFN0MsVUFBSSx3QkFBUSxJQUFJLEVBQ2IsUUFBUSxjQUFJLEVBQ1osUUFBUSxDQUFDLFNBQVMsS0FDaEIsU0FBUyxLQUFLLElBQUksRUFDbEIsZUFBZSxnQkFBTSxRQUFRLENBQUMsRUFBRSxFQUNoQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sTUFBTSxLQUFLLEtBQUssZ0JBQU0sUUFBUSxDQUFDO0FBQzNDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDLENBQUMsRUFDSCxVQUFVLENBQUMsV0FBVyxPQUNwQixXQUFXLGdDQUFPLEVBQ2xCLFNBQVMsS0FBSyxPQUFPLEVBQ3JCLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLGFBQUssVUFBVTtBQUNmLFlBQUksQ0FBQyxNQUFPLE1BQUssT0FBTyxTQUFTLG9CQUFvQixLQUFLLE9BQU8sU0FBUyxrQkFBa0IsT0FBTyxDQUFDLE9BQU8sT0FBTyxLQUFLLEVBQUU7QUFDekgsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixhQUFLLFFBQVE7QUFBQSxNQUNmLENBQUMsQ0FBQztBQUVOLFVBQUksd0JBQVEsSUFBSSxFQUNiLFFBQVEsa0JBQVEsRUFDaEIsUUFBUSxDQUFDLFNBQVMsS0FDaEIsZUFBZSxnQ0FBZ0MsRUFDL0MsU0FBUyxLQUFLLFFBQVEsRUFDdEIsU0FBUyxPQUFPLFVBQVU7QUFBRSxhQUFLLFdBQVcsTUFBTSxLQUFLO0FBQUcsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQUcsQ0FBQyxDQUFDO0FBRW5HLFVBQUksd0JBQVEsSUFBSSxFQUNiLFFBQVEsNENBQVMsRUFDakIsWUFBWSxDQUFDLGFBQWEsU0FDeEIsVUFBVSxRQUFRLE1BQU0sRUFDeEIsVUFBVSxPQUFPLEtBQUssRUFDdEIsU0FBUyxLQUFLLE1BQU0sRUFDcEIsU0FBUyxPQUFPLFVBQVU7QUFBRSxhQUFLLFNBQVM7QUFBMEIsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQUcsQ0FBQyxDQUFDLEVBQzFHLFlBQVksQ0FBQyxhQUFhLFNBQ3hCLFVBQVUsYUFBYSxxQkFBcUIsRUFDNUMsVUFBVSxPQUFPLGdDQUFPLEVBQ3hCLFNBQVMsS0FBSyxRQUFRLEVBQ3RCLFNBQVMsT0FBTyxVQUFVO0FBQUUsYUFBSyxXQUFXO0FBQTRCLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUFHLENBQUMsQ0FBQztBQUVqSCxVQUFJLHdCQUFRLElBQUksRUFDYixRQUFRLGdDQUFPLEVBQ2YsUUFBUSxpRkFBb0MsRUFDNUMsUUFBUSxDQUFDLFNBQVMsS0FDaEIsU0FBUyxLQUFLLFNBQVMsRUFDdkIsZUFBZSxNQUFNLEVBQ3JCLFNBQVMsT0FBTyxVQUFVO0FBQUUsYUFBSyxZQUFZLE1BQU0sS0FBSyxLQUFLO0FBQVEsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQUcsQ0FBQyxDQUFDO0FBRTlHLFVBQUksd0JBQVEsSUFBSSxFQUNiLFFBQVEseUJBQVUsRUFDbEIsUUFBUSwyR0FBK0MsRUFDdkQsWUFBWSxDQUFDLFNBQVMsS0FDcEIsU0FBUyxLQUFLLE9BQU8sRUFDckIsZUFBZSxnQ0FBZ0MsRUFDL0MsU0FBUyxPQUFPLFVBQVU7QUFBRSxhQUFLLFVBQVUsTUFBTSxLQUFLO0FBQUcsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQUcsQ0FBQyxDQUFDO0FBRWxHLFVBQUksd0JBQVEsSUFBSSxFQUNiLFFBQVEsc0NBQVEsRUFDaEIsUUFBUSx5RkFBd0IsRUFDaEMsUUFBUSxDQUFDLFNBQVMsS0FDaEIsU0FBUyxLQUFLLFlBQVksRUFDMUIsZUFBZSxVQUFVLEVBQ3pCLFNBQVMsT0FBTyxVQUFVO0FBQUUsYUFBSyxlQUFlLE1BQU0sS0FBSztBQUFHLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUFHLENBQUMsQ0FBQztBQUV2RyxZQUFNLGVBQWUsS0FBSyxPQUFPLFNBQVMsa0JBQWtCLFNBQVMsS0FBSyxFQUFFO0FBQzVFLFVBQUksd0JBQVEsSUFBSSxFQUNiLFFBQVEsc0NBQVEsRUFDaEIsUUFBUSw0TEFBaUMsRUFDekMsVUFBVSxDQUFDLFdBQVcsT0FDcEIsU0FBUyxZQUFZLEVBQ3JCLFlBQVksQ0FBQyxLQUFLLE9BQU8sRUFDekIsU0FBUyxPQUFPLFVBQVU7QUFDekIsY0FBTSxXQUFXLElBQUksSUFBSSxLQUFLLE9BQU8sU0FBUyxpQkFBaUI7QUFDL0QsWUFBSSxNQUFPLFVBQVMsSUFBSSxLQUFLLEVBQUU7QUFBQSxZQUFRLFVBQVMsT0FBTyxLQUFLLEVBQUU7QUFDOUQsYUFBSyxPQUFPLFNBQVMsb0JBQW9CLE1BQU0sS0FBSyxRQUFRO0FBQzVELGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDLENBQUM7QUFFTixZQUFNLFVBQVUsS0FBSyxVQUFVLEVBQUUsS0FBSyx5QkFBeUIsQ0FBQztBQUNoRSxZQUFNLE9BQU8sUUFBUSxTQUFTLFVBQVUsRUFBRSxNQUFNLHVDQUFjLE1BQU0sRUFBRSxNQUFNLFNBQVMsRUFBRSxDQUFDO0FBQ3hGLFdBQUssaUJBQWlCLFNBQVMsTUFBTTtBQUNuQyxhQUFLLFdBQVc7QUFDaEIsYUFBSyxRQUFRLDBCQUFNO0FBQ25CLGFBQUssS0FBSyxPQUFPLGNBQWMsS0FBSyxFQUFFLEVBQUUsUUFBUSxNQUFNO0FBQ3BELGVBQUssV0FBVztBQUNoQixlQUFLLFFBQVEscUNBQVk7QUFBQSxRQUMzQixDQUFDO0FBQUEsTUFDSCxDQUFDO0FBQ0QsWUFBTSxTQUFTLFFBQVEsU0FBUyxVQUFVLEVBQUUsTUFBTSw0QkFBUSxLQUFLLGVBQWUsTUFBTSxFQUFFLE1BQU0sU0FBUyxFQUFFLENBQUM7QUFDeEcsYUFBTyxpQkFBaUIsU0FBUyxNQUFNO0FBQ3JDLGFBQUssT0FBTyxTQUFTLGFBQWEsS0FBSyxPQUFPLFNBQVMsV0FBVyxPQUFPLENBQUMsU0FBUyxLQUFLLE9BQU8sS0FBSyxFQUFFO0FBQ3RHLGFBQUssT0FBTyxTQUFTLG9CQUFvQixLQUFLLE9BQU8sU0FBUyxrQkFBa0IsT0FBTyxDQUFDLE9BQU8sT0FBTyxLQUFLLEVBQUU7QUFDN0csYUFBSyxLQUFLLE9BQU8sYUFBYSxFQUFFLEtBQUssTUFBTTtBQUN6QyxjQUFJLHVCQUFPLHVDQUFTLEtBQUssSUFBSSxFQUFFO0FBQy9CLGVBQUssUUFBUTtBQUFBLFFBQ2YsQ0FBQztBQUFBLE1BQ0gsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLHNDQUFRLEVBQ2hCLFFBQVEsd0pBQXFDLEVBQzdDLFFBQVEsQ0FBQyxTQUFTLEtBQ2hCLGVBQWUsMEJBQU0sRUFDckIsU0FBUyxLQUFLLE9BQU8sU0FBUyxVQUFVLEVBQ3hDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLFdBQUssT0FBTyxTQUFTLGFBQWEsTUFBTSxLQUFLLEtBQUs7QUFDbEQsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2pDLENBQUMsQ0FBQztBQUVOLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDBCQUFNLEVBQ2QsUUFBUSw4R0FBb0IsRUFDNUIsWUFBWSxDQUFDLGFBQWEsU0FDeEIsVUFBVSxTQUFTLDBCQUFNLEVBQ3pCLFVBQVUsWUFBWSwwQkFBTSxFQUM1QixTQUFTLEtBQUssT0FBTyxTQUFTLGFBQWEsRUFDM0MsU0FBUyxPQUFPLFVBQVU7QUFDekIsV0FBSyxPQUFPLFNBQVMsZ0JBQWdCO0FBQ3JDLFlBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxJQUNqQyxDQUFDLENBQUM7QUFFTixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxzQ0FBUSxFQUNoQixZQUFZLENBQUMsYUFBYSxTQUN4QixVQUFVLFFBQVEsdUJBQWEsRUFDL0IsVUFBVSxTQUFTLGNBQUksRUFDdkIsVUFBVSxRQUFRLGNBQUksRUFDdEIsU0FBUyxLQUFLLE9BQU8sU0FBUyxZQUFZLEVBQzFDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLFdBQUssT0FBTyxTQUFTLGVBQWU7QUFDcEMsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2pDLENBQUMsQ0FBQztBQUVOLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sMkJBQU8sQ0FBQztBQUUzQyxTQUFLO0FBQUEsTUFDSDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxNQUFNLEtBQUssT0FBTyxTQUFTO0FBQUEsTUFDM0IsT0FBTyxVQUFVO0FBQUUsYUFBSyxPQUFPLFNBQVMsa0JBQWtCO0FBQUEsTUFBTztBQUFBLE1BQ2pFO0FBQUEsSUFDRjtBQUVBLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDBCQUFNLEVBQ2QsUUFBUSxzRkFBZ0IsRUFDeEIsWUFBWSxDQUFDLGFBQWEsU0FDeEIsVUFBVSxRQUFRLFFBQUcsRUFDckIsVUFBVSxRQUFRLGNBQUksRUFDdEIsVUFBVSxRQUFRLGNBQUksRUFDdEIsU0FBUyxLQUFLLE9BQU8sU0FBUyxpQkFBaUIsRUFDL0MsU0FBUyxPQUFPLFVBQVU7QUFDekIsV0FBSyxPQUFPLFNBQVMsb0JBQW9CO0FBQ3pDLFdBQUssT0FBTyxTQUFTLFdBQVcsVUFBVTtBQUMxQyxZQUFNLEtBQUssZUFBZTtBQUFBLElBQzVCLENBQUMsQ0FBQztBQUVOLFNBQUs7QUFBQSxNQUNIO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLE1BQU0sS0FBSyxPQUFPLFNBQVM7QUFBQSxNQUMzQixPQUFPLFVBQVU7QUFBRSxhQUFLLE9BQU8sU0FBUyx5QkFBeUIsU0FBUztBQUFBLE1BQVc7QUFBQSxNQUNyRjtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBRUEsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxpQ0FBUSxDQUFDO0FBRTVDLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDBCQUFNLEVBQ2QsWUFBWSxDQUFDLGFBQWEsU0FDeEIsVUFBVSxZQUFZLHVCQUFhLEVBQ25DLFVBQVUsUUFBUSxnQ0FBTyxFQUN6QixVQUFVLFNBQVMsMEJBQU0sRUFDekIsVUFBVSxRQUFRLDBCQUFNLEVBQ3hCLFVBQVUsVUFBVSxnQ0FBTyxFQUMzQixTQUFTLEtBQUssT0FBTyxTQUFTLFVBQVUsRUFDeEMsU0FBUyxPQUFPLFVBQVU7QUFDekIsV0FBSyxPQUFPLFNBQVMsYUFBYTtBQUNsQyxZQUFNLEtBQUssZUFBZTtBQUMxQixXQUFLLFFBQVE7QUFBQSxJQUNmLENBQUMsQ0FBQztBQUVOLFFBQUksS0FBSyxPQUFPLFNBQVMsZUFBZSxVQUFVO0FBQ2hELFVBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDRDQUFTLEVBQ2pCLFFBQVEsK0lBQWdELEVBQ3hELFFBQVEsQ0FBQyxTQUFTLEtBQ2hCLGVBQWUsaUJBQWlCLEVBQ2hDLFNBQVMsS0FBSyxPQUFPLFNBQVMsVUFBVSxFQUN4QyxTQUFTLE9BQU8sVUFBVTtBQUN6QixhQUFLLE9BQU8sU0FBUyxhQUFhLE1BQU0sS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFHO0FBQzNELGNBQU0sS0FBSyxlQUFlO0FBQUEsTUFDNUIsQ0FBQyxDQUFDO0FBQUEsSUFDUjtBQUVBLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDBCQUFNLEVBQ2QsUUFBUSw4R0FBeUIsRUFDakMsVUFBVSxDQUFDLFdBQVcsT0FDcEIsVUFBVSxJQUFJLElBQUksQ0FBQyxFQUNuQixrQkFBa0IsRUFDbEIsU0FBUyxLQUFLLE9BQU8sU0FBUyxRQUFRLEVBQ3RDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLFdBQUssT0FBTyxTQUFTLFdBQVc7QUFDaEMsWUFBTSxLQUFLLGVBQWU7QUFBQSxJQUM1QixDQUFDLENBQUM7QUFFTixTQUFLO0FBQUEsTUFDSDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxNQUFNLEtBQUssT0FBTyxTQUFTO0FBQUEsTUFDM0IsT0FBTyxVQUFVO0FBQUUsYUFBSyxPQUFPLFNBQVMsWUFBWTtBQUFBLE1BQU87QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFFQSxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxzQ0FBUSxFQUNoQixVQUFVLENBQUMsV0FBVyxPQUNwQixTQUFTLEtBQUssT0FBTyxTQUFTLGVBQWUsRUFDN0MsU0FBUyxPQUFPLFVBQVU7QUFDekIsV0FBSyxPQUFPLFNBQVMsa0JBQWtCO0FBQ3ZDLFlBQU0sS0FBSyxlQUFlO0FBQUEsSUFDNUIsQ0FBQyxDQUFDO0FBRU4sUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsc0NBQVEsRUFDaEIsVUFBVSxDQUFDLFdBQVcsT0FDcEIsU0FBUyxLQUFLLE9BQU8sU0FBUyxpQkFBaUIsRUFDL0MsU0FBUyxPQUFPLFVBQVU7QUFDekIsV0FBSyxPQUFPLFNBQVMsb0JBQW9CO0FBQ3pDLFlBQU0sS0FBSyxlQUFlO0FBQUEsSUFDNUIsQ0FBQyxDQUFDO0FBRU4sUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsNENBQVMsRUFDakIsVUFBVSxDQUFDLFdBQVcsT0FDcEIsU0FBUyxLQUFLLE9BQU8sU0FBUyxvQkFBb0IsRUFDbEQsU0FBUyxPQUFPLFVBQVU7QUFDekIsV0FBSyxPQUFPLFNBQVMsdUJBQXVCO0FBQzVDLFlBQU0sS0FBSyxlQUFlO0FBQUEsSUFDNUIsQ0FBQyxDQUFDO0FBRU4sZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSwyQkFBTyxDQUFDO0FBRTNDLFNBQUs7QUFBQSxNQUNIO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLE1BQU0sS0FBSyxPQUFPLFNBQVM7QUFBQSxNQUMzQixPQUFPLFVBQVU7QUFBRSxhQUFLLE9BQU8sU0FBUyxZQUFZO0FBQUEsTUFBTztBQUFBLE1BQzNEO0FBQUEsSUFDRjtBQUVBLFNBQUs7QUFBQSxNQUNIO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLE1BQU0sS0FBSyxPQUFPLFNBQVM7QUFBQSxNQUMzQixPQUFPLFVBQVU7QUFBRSxhQUFLLE9BQU8sU0FBUyxnQkFBZ0I7QUFBQSxNQUFPO0FBQUEsTUFDL0Q7QUFBQSxJQUNGO0FBRUEsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsc0NBQVEsRUFDaEIsUUFBUSxzRkFBZ0IsRUFDeEIsWUFBWSxDQUFDLGFBQWEsU0FDeEIsVUFBVSxXQUFXLGNBQUksRUFDekIsVUFBVSxRQUFRLGNBQUksRUFDdEIsVUFBVSxhQUFhLGNBQUksRUFDM0IsU0FBUyxLQUFLLE9BQU8sU0FBUyxnQkFBZ0IsRUFDOUMsU0FBUyxPQUFPLFVBQVU7QUFDekIsV0FBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQ3hDLFlBQU0sS0FBSyxlQUFlO0FBQUEsSUFDNUIsQ0FBQyxDQUFDO0FBRU4sU0FBSztBQUFBLE1BQ0g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsTUFBTSxLQUFLLE9BQU8sU0FBUztBQUFBLE1BQzNCLE9BQU8sVUFBVTtBQUFFLGFBQUssT0FBTyxTQUFTLHNCQUFzQjtBQUFBLE1BQU87QUFBQSxNQUNyRTtBQUFBLElBQ0Y7QUFFQSxTQUFLO0FBQUEsTUFDSDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxNQUFNLEtBQUssT0FBTyxTQUFTO0FBQUEsTUFDM0IsT0FBTyxVQUFVO0FBQUUsYUFBSyxPQUFPLFNBQVMsa0JBQWtCO0FBQUEsTUFBTztBQUFBLE1BQ2pFO0FBQUEsSUFDRjtBQUVBLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLGtEQUFVLEVBQ2xCLFFBQVEsZ0ZBQW9CLEVBQzVCLFVBQVUsQ0FBQyxXQUFXLE9BQ3BCLFVBQVUsR0FBRyxHQUFHLEdBQUcsRUFDbkIsa0JBQWtCLEVBQ2xCLFNBQVMsS0FBSyxPQUFPLFNBQVMsZUFBZSxFQUM3QyxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxrQkFBa0I7QUFDdkMsWUFBTSxLQUFLLGVBQWU7QUFBQSxJQUM1QixDQUFDLENBQUM7QUFFTixnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLDJCQUFPLENBQUM7QUFFM0MsUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsMEJBQU0sRUFDZCxRQUFRLHdNQUFtQyxFQUMzQyxVQUFVLENBQUMsV0FBVyxPQUNwQixTQUFTLEtBQUssT0FBTyxTQUFTLGdCQUFnQixFQUM5QyxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxtQkFBbUI7QUFDeEMsWUFBTSxLQUFLLGVBQWU7QUFBQSxJQUM1QixDQUFDLENBQUM7QUFFTixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSwwQkFBTSxFQUNkLFFBQVEsa0pBQTBCLEVBQ2xDLFlBQVksQ0FBQyxTQUFTLEtBQ3BCLGVBQWUsMkJBQTJCLEVBQzFDLFNBQVMsS0FBSyxPQUFPLFNBQVMsYUFBYSxLQUFLLElBQUksQ0FBQyxFQUNyRCxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxlQUFlLE1BQU0sTUFBTSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsS0FBSyxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsU0FBUyxrQkFBa0IsS0FBSyxJQUFJLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRTtBQUNoSixZQUFNLEtBQUssZUFBZTtBQUFBLElBQzVCLENBQUMsQ0FBQztBQUVOLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLDBCQUFNLEVBQ2QsWUFBWSxDQUFDLGFBQWEsU0FDeEIsVUFBVSxVQUFVLGNBQUksRUFDeEIsVUFBVSxZQUFZLGNBQUksRUFDMUIsVUFBVSxTQUFTLGNBQUksRUFDdkIsU0FBUyxLQUFLLE9BQU8sU0FBUyxTQUFTLEVBQ3ZDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLFdBQUssT0FBTyxTQUFTLFlBQVk7QUFDakMsWUFBTSxLQUFLLGVBQWU7QUFBQSxJQUM1QixDQUFDLENBQUM7QUFFTixTQUFLO0FBQUEsTUFDSDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxNQUFNLEtBQUssT0FBTyxTQUFTO0FBQUEsTUFDM0IsT0FBTyxVQUFVO0FBQUUsYUFBSyxPQUFPLFNBQVMsWUFBWTtBQUFBLE1BQU87QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFFQSxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxzQ0FBUSxFQUNoQixRQUFRLHdKQUEyQixFQUNuQyxZQUFZLENBQUMsYUFBYSxTQUN4QixVQUFVLFdBQVcsMEJBQU0sRUFDM0IsVUFBVSxXQUFXLDBCQUFNLEVBQzNCLFNBQVMsS0FBSyxPQUFPLFNBQVMsYUFBYSxFQUMzQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxnQkFBZ0I7QUFDckMsWUFBTSxLQUFLLGVBQWU7QUFDMUIsV0FBSyxRQUFRO0FBQUEsSUFDZixDQUFDLENBQUM7QUFFTixRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxLQUFLLE9BQU8sU0FBUyxrQkFBa0IsWUFBWSw2QkFBUywwQkFBTSxFQUMxRSxRQUFRLG9IQUEwQixFQUNsQyxVQUFVLENBQUMsV0FBVyxPQUNwQixVQUFVLEtBQUssR0FBRyxJQUFJLEVBQ3RCLGtCQUFrQixFQUNsQixTQUFTLEtBQUssT0FBTyxTQUFTLFNBQVMsRUFDdkMsU0FBUyxPQUFPLFVBQVU7QUFDekIsV0FBSyxPQUFPLFNBQVMsWUFBWTtBQUNqQyxVQUFJLEtBQUssT0FBTyxTQUFTLGVBQWUsTUFBTyxNQUFLLE9BQU8sU0FBUyxlQUFlO0FBQ25GLFlBQU0sS0FBSyxlQUFlO0FBQUEsSUFDNUIsQ0FBQyxDQUFDO0FBRU4sUUFBSSxLQUFLLE9BQU8sU0FBUyxrQkFBa0IsV0FBVztBQUNwRCxVQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxzQ0FBUSxFQUNoQixRQUFRLCtHQUEwQixFQUNsQyxVQUFVLENBQUMsV0FBVyxPQUNwQixVQUFVLE1BQU0sR0FBRyxJQUFJLEVBQ3ZCLGtCQUFrQixFQUNsQixTQUFTLEtBQUssT0FBTyxTQUFTLFlBQVksRUFDMUMsU0FBUyxPQUFPLFVBQVU7QUFDekIsYUFBSyxPQUFPLFNBQVMsZUFBZSxLQUFLLElBQUksT0FBTyxLQUFLLE9BQU8sU0FBUyxTQUFTO0FBQ2xGLGNBQU0sS0FBSyxlQUFlO0FBQUEsTUFDNUIsQ0FBQyxDQUFDO0FBQUEsSUFDUjtBQUVBLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0saUNBQVEsQ0FBQztBQUU1QyxRQUFJLHdCQUFRLFdBQVcsRUFDcEIsUUFBUSxvRUFBYSxFQUNyQixRQUFRLGdNQUEwQyxFQUNsRCxVQUFVLENBQUMsV0FBVyxPQUNwQixTQUFTLEtBQUssT0FBTyxTQUFTLG1CQUFtQixFQUNqRCxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxzQkFBc0I7QUFDM0MsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2pDLENBQUMsQ0FBQztBQUVOLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLHNDQUFRLEVBQ2hCLFFBQVEsMEhBQXNCLEVBQzlCLFVBQVUsQ0FBQyxXQUFXLE9BQ3BCLFNBQVMsS0FBSyxPQUFPLFNBQVMsZ0JBQWdCLEVBQzlDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLFdBQUssT0FBTyxTQUFTLG1CQUFtQjtBQUN4QyxZQUFNLEtBQUssZUFBZTtBQUFBLElBQzVCLENBQUMsQ0FBQztBQUVOLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLHdEQUFXLEVBQ25CLFVBQVUsQ0FBQyxXQUFXLE9BQ3BCLFNBQVMsS0FBSyxPQUFPLFNBQVMsYUFBYSxFQUMzQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxnQkFBZ0I7QUFDckMsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2pDLENBQUMsQ0FBQztBQUVOLFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLHNDQUFRLEVBQ2hCLFFBQVEsd0dBQXdCLEVBQ2hDLFVBQVUsQ0FBQyxXQUFXLE9BQ3BCLFVBQVUsSUFBSSxLQUFLLEVBQUUsRUFDckIsa0JBQWtCLEVBQ2xCLFNBQVMsS0FBSyxPQUFPLFNBQVMsWUFBWSxFQUMxQyxTQUFTLE9BQU8sVUFBVTtBQUN6QixXQUFLLE9BQU8sU0FBUyxlQUFlO0FBQ3BDLFlBQU0sS0FBSyxlQUFlO0FBQUEsSUFDNUIsQ0FBQyxDQUFDO0FBRU4sUUFBSSx3QkFBUSxXQUFXLEVBQ3BCLFFBQVEsa0RBQVUsRUFDbEIsUUFBUSwrQ0FBaUIsRUFDekIsVUFBVSxDQUFDLFdBQVcsT0FDcEIsVUFBVSxLQUFLLE1BQU0sRUFBRSxFQUN2QixrQkFBa0IsRUFDbEIsU0FBUyxLQUFLLE9BQU8sU0FBUyxjQUFjLEVBQzVDLFNBQVMsT0FBTyxVQUFVO0FBQ3pCLFdBQUssT0FBTyxTQUFTLGlCQUFpQjtBQUN0QyxZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDakMsQ0FBQyxDQUFDO0FBQUEsRUFDUjtBQUFBLEVBRVEsd0JBQ04sV0FDQSxNQUNBLGFBQ0EsVUFDQSxVQUNBLFVBQ0EsYUFBYSxNQUNQO0FBQ04sVUFBTSxVQUFVLElBQUksd0JBQVEsU0FBUyxFQUNsQyxRQUFRLElBQUksRUFDWixRQUFRLFdBQVcsRUFDbkIsZUFBZSxDQUFDLFdBQVcsT0FDekIsU0FBUyxTQUFTLEtBQUssUUFBUSxFQUMvQixTQUFTLE9BQU8sVUFBVTtBQUN6QixZQUFNLFNBQVMsS0FBSztBQUNwQixZQUFNLEtBQUssZUFBZTtBQUFBLElBQzVCLENBQUMsQ0FBQztBQUNOLFFBQUksWUFBWTtBQUNkLGNBQVEsVUFBVSxDQUFDLFdBQVcsT0FDM0IsY0FBYywwQkFBTSxFQUNwQixRQUFRLFlBQVk7QUFDbkIsY0FBTSxTQUFTLEVBQUU7QUFDakIsY0FBTSxLQUFLLGVBQWU7QUFDMUIsYUFBSyxRQUFRO0FBQUEsTUFDZixDQUFDLENBQUM7QUFBQSxJQUNOO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyxpQkFBZ0M7QUFDNUMsVUFBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixTQUFLLE9BQU8saUJBQWlCO0FBQUEsRUFDL0I7QUFDRjs7O0FFdDBCQSxJQUFNLGFBQWE7QUFDbkIsSUFBTSxhQUFhO0FBQ25CLElBQU0sUUFBUTtBQUNkLElBQU0sUUFBUTtBQUVkLFNBQVMsZ0JBQWdCLE1BQWtDO0FBQ3pELFNBQU8sS0FBSyxZQUFZLENBQUMsSUFBSSxLQUFLO0FBQ3BDO0FBRUEsU0FBUyxlQUFlLE1BQW1CLE9BQWUsa0JBQWtCLElBQXVDO0FBL0JuSDtBQWdDRSxRQUFNLFlBQVcsZ0JBQUssVUFBTCxtQkFBWSxhQUFaLFlBQXdCO0FBQ3pDLFFBQU0sYUFBYSxLQUFLLElBQUksR0FBRyxXQUFXLEVBQUUsSUFBSTtBQUNoRCxNQUFJLFNBQVMsVUFBVSxJQUFJLGFBQWEsY0FBYztBQUN0RCxNQUFJLFNBQVMsS0FBSyxLQUFLLElBQUksR0FBRyxXQUFXLEVBQUUsSUFBSTtBQUMvQyxRQUFNLFNBQVMsa0JBQWtCLElBQUk7QUFDckMsTUFBSSxDQUFDLE9BQU8sT0FBUSxXQUFVLFVBQVUsSUFBSSxLQUFLO0FBQ2pELGFBQVcsU0FBUyxRQUFRO0FBQzFCLFFBQUksTUFBTSxTQUFTLFNBQVM7QUFBRSxjQUFRLEtBQUssSUFBSSxPQUFPLEdBQUc7QUFBRyxnQkFBVTtBQUFBLElBQUssT0FDdEU7QUFDSCxZQUFNLFNBQVMsS0FBSyxJQUFJLEdBQUcsTUFBTSxLQUFLLE1BQU07QUFDNUMsY0FBUSxLQUFLLElBQUksT0FBTyxLQUFLLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxRQUFRLEVBQUUsSUFBSSxXQUFXLElBQUksQ0FBQztBQUNsRixnQkFBVSxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLEtBQUssV0FBVyxFQUFFO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQ0EsT0FBSSxVQUFLLFNBQUwsbUJBQVcsT0FBUSxXQUFVO0FBQ2pDLE1BQUksS0FBSyxRQUFRO0FBQUUsWUFBUSxLQUFLLElBQUksT0FBTyxHQUFHO0FBQUcsY0FBVTtBQUFBLEVBQUk7QUFDL0QsTUFBSSxLQUFLLE9BQU87QUFDZCxVQUFNLFVBQVUsS0FBSyxJQUFJLEdBQUcsS0FBSyxNQUFNLFFBQVEsTUFBTTtBQUNyRCxVQUFNLGNBQWMsS0FBSyxJQUFJLElBQUksS0FBSyxNQUFNLEtBQUssTUFBTTtBQUN2RCxZQUFRLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLFVBQVUsR0FBRyxDQUFDO0FBQ2xELGNBQVUsS0FBSyxjQUFjLE1BQU0sS0FBSyxNQUFNLEtBQUssU0FBUyxjQUFjLEtBQUs7QUFBQSxFQUNqRjtBQUNBLE1BQUksS0FBSyxNQUFNO0FBQ2IsVUFBTSxRQUFRLEtBQUssS0FBSyxLQUFLLE1BQU0sT0FBTztBQUMxQyxVQUFNLFVBQVUsS0FBSyxJQUFJLElBQUksR0FBRyxNQUFNLE1BQU0sR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsS0FBSyxNQUFNLENBQUM7QUFDN0UsWUFBUSxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksS0FBSyxVQUFVLE1BQU0sRUFBRSxDQUFDO0FBQ3ZELGNBQVUsS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLE1BQU0sUUFBUSxFQUFFLElBQUksS0FBSyxFQUFFLENBQUM7QUFBQSxFQUM3RTtBQUNBLFNBQU8sRUFBRSxPQUFPLFFBQVEsS0FBSyxJQUFJLEtBQUssTUFBTSxFQUFFO0FBQ2hEO0FBRUEsU0FBUyxjQUFjLE1BQW1CLE9BQWUsa0JBQWtCLElBQVk7QUFDckYsUUFBTSxZQUFZLGVBQWUsTUFBTSxPQUFPLGVBQWUsRUFBRTtBQUMvRCxRQUFNLFdBQVcsZ0JBQWdCLElBQUk7QUFDckMsTUFBSSxDQUFDLFNBQVMsT0FBUSxRQUFPO0FBQzdCLFFBQU0saUJBQWlCLFNBQVMsT0FBTyxDQUFDLEtBQUssVUFBVSxNQUFNLGNBQWMsT0FBTyxRQUFRLEdBQUcsZUFBZSxHQUFHLENBQUMsSUFBSSxTQUFTLFNBQVMsU0FBUztBQUMvSSxTQUFPLEtBQUssSUFBSSxXQUFXLGNBQWM7QUFDM0M7QUFFQSxTQUFTLGFBQ1AsTUFDQSxVQUNBLFNBQ0EsYUFDQSxNQUNBLE9BQ0EsU0FDQSxRQUNBLGtCQUFrQixJQUNaO0FBQ04sUUFBTSxhQUFhLGVBQWUsTUFBTSxPQUFPLGVBQWU7QUFDOUQsUUFBTSxJQUFJLFVBQVUsUUFBUSxjQUFjLElBQUksUUFBUSxXQUFXLFFBQVE7QUFDekUsU0FBTyxLQUFLLEVBQUUsTUFBTSxVQUFVLEdBQUcsR0FBRyxTQUFTLE9BQU8sTUFBTSxHQUFHLFdBQVcsQ0FBQztBQUN6RSxRQUFNLFdBQVcsZ0JBQWdCLElBQUk7QUFDckMsTUFBSSxDQUFDLFNBQVMsT0FBUTtBQUV0QixRQUFNLFVBQVUsU0FBUyxJQUFJLENBQUMsVUFBVSxjQUFjLE9BQU8sUUFBUSxHQUFHLGVBQWUsQ0FBQztBQUN4RixRQUFNLGNBQWMsUUFBUSxPQUFPLENBQUMsS0FBSyxnQkFBZ0IsTUFBTSxhQUFhLENBQUMsSUFBSSxTQUFTLFNBQVMsU0FBUztBQUM1RyxNQUFJLFNBQVMsVUFBVSxjQUFjO0FBQ3JDLFdBQVMsUUFBUSxDQUFDLE9BQU8sVUFBVTtBQTNGckM7QUE0RkksVUFBTSxlQUFjLGFBQVEsS0FBSyxNQUFiLFlBQWtCLGVBQWUsT0FBTyxRQUFRLEdBQUcsZUFBZSxFQUFFO0FBQ3hGLFVBQU0sY0FBYyxTQUFTLGNBQWM7QUFDM0MsaUJBQWEsT0FBTyxLQUFLLElBQUksR0FBRyxXQUFXLE9BQU8sTUFBTSxRQUFRLEdBQUcsYUFBYSxRQUFRLGVBQWU7QUFDdkcsY0FBVSxjQUFjO0FBQUEsRUFDMUIsQ0FBQztBQUNIO0FBRU8sU0FBUyxjQUFjLE1BQW1CLE1BQWtCLGtCQUFrQixJQUFrQjtBQUNyRyxRQUFNLGlCQUFpQixlQUFlLE1BQU0sR0FBRyxlQUFlO0FBQzlELFFBQU0sUUFBd0I7QUFBQSxJQUM1QixFQUFFLE1BQU0sTUFBTSxVQUFVLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxPQUFPLEdBQUcsTUFBTSxHQUFHLEdBQUcsZUFBZTtBQUFBLEVBQ2pGO0FBQ0EsUUFBTSxXQUFXLGdCQUFnQixJQUFJO0FBRXJDLE1BQUksU0FBUyxjQUFjLFNBQVMsU0FBUyxHQUFHO0FBQzlDLFVBQU0sT0FBc0IsQ0FBQztBQUM3QixVQUFNLFFBQXVCLENBQUM7QUFDOUIsUUFBSSxhQUFhO0FBQ2pCLFFBQUksY0FBYztBQUNsQixlQUFXLFNBQVMsQ0FBQyxHQUFHLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLGNBQWMsR0FBRyxHQUFHLGVBQWUsSUFBSSxjQUFjLEdBQUcsR0FBRyxlQUFlLENBQUMsR0FBRztBQUM3SCxZQUFNLFNBQVMsY0FBYyxPQUFPLEdBQUcsZUFBZSxJQUFJO0FBQzFELFVBQUksY0FBYyxhQUFhO0FBQzdCLGFBQUssS0FBSyxLQUFLO0FBQ2Ysc0JBQWM7QUFBQSxNQUNoQixPQUFPO0FBQ0wsY0FBTSxLQUFLLEtBQUs7QUFDaEIsdUJBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFlBQVksQ0FBQyxPQUFzQixTQUF1QjtBQUM5RCxZQUFNLFVBQVUsTUFBTSxJQUFJLENBQUMsVUFBVSxjQUFjLE9BQU8sR0FBRyxlQUFlLENBQUM7QUFDN0UsWUFBTSxRQUFRLFFBQVEsT0FBTyxDQUFDLEtBQUssVUFBVSxNQUFNLE9BQU8sQ0FBQyxJQUFJLFFBQVEsS0FBSyxJQUFJLEdBQUcsTUFBTSxTQUFTLENBQUM7QUFDbkcsVUFBSSxTQUFTLENBQUMsUUFBUTtBQUN0QixZQUFNLFFBQVEsQ0FBQyxPQUFPLFVBQVU7QUE5SHRDO0FBK0hRLGNBQU0sVUFBUyxhQUFRLEtBQUssTUFBYixZQUFrQixlQUFlLE9BQU8sR0FBRyxlQUFlLEVBQUU7QUFDM0UscUJBQWEsT0FBTyxLQUFLLElBQUksR0FBRyxlQUFlLE9BQU8sTUFBTSxHQUFHLFNBQVMsU0FBUyxHQUFHLE9BQU8sZUFBZTtBQUMxRyxrQkFBVSxTQUFTO0FBQUEsTUFDckIsQ0FBQztBQUFBLElBQ0g7QUFDQSxjQUFVLE1BQU0sRUFBRTtBQUNsQixjQUFVLE9BQU8sQ0FBQztBQUFBLEVBQ3BCLE9BQU87QUFDTCxVQUFNLFVBQVUsU0FBUyxJQUFJLENBQUMsVUFBVSxjQUFjLE9BQU8sR0FBRyxlQUFlLENBQUM7QUFDaEYsVUFBTSxRQUFRLFFBQVEsT0FBTyxDQUFDLEtBQUssVUFBVSxNQUFNLE9BQU8sQ0FBQyxJQUFJLFFBQVEsS0FBSyxJQUFJLEdBQUcsU0FBUyxTQUFTLENBQUM7QUFDdEcsUUFBSSxTQUFTLENBQUMsUUFBUTtBQUN0QixhQUFTLFFBQVEsQ0FBQyxPQUFPLFVBQVU7QUExSXZDO0FBMklNLFlBQU0sVUFBUyxhQUFRLEtBQUssTUFBYixZQUFrQixlQUFlLE9BQU8sR0FBRyxlQUFlLEVBQUU7QUFDM0UsbUJBQWEsT0FBTyxLQUFLLElBQUksR0FBRyxlQUFlLE9BQU8sR0FBRyxHQUFHLFNBQVMsU0FBUyxHQUFHLE9BQU8sZUFBZTtBQUN2RyxnQkFBVSxTQUFTO0FBQUEsSUFDckIsQ0FBQztBQUFBLEVBQ0g7QUFFQSxRQUFNLE9BQU8sSUFBSSxJQUFJLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEtBQUssSUFBSSxRQUFRLENBQUMsQ0FBQztBQUMxRSxRQUFNLE9BQU8sS0FBSyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxTQUFTLElBQUksU0FBUyxRQUFRLENBQUMsQ0FBQztBQUNqRixRQUFNLE9BQU8sS0FBSyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxTQUFTLElBQUksU0FBUyxRQUFRLENBQUMsQ0FBQztBQUNqRixRQUFNLE9BQU8sS0FBSyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxTQUFTLElBQUksU0FBUyxTQUFTLENBQUMsQ0FBQztBQUNsRixRQUFNLE9BQU8sS0FBSyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxTQUFTLElBQUksU0FBUyxTQUFTLENBQUMsQ0FBQztBQUNsRixTQUFPLEVBQUUsT0FBTyxNQUFNLE1BQU0sTUFBTSxNQUFNLEtBQUs7QUFDL0M7QUFHTyxTQUFTLG9CQUFvQixNQUFtQixRQUFtRDtBQUN4RyxRQUFNLFNBQVMsb0JBQUksSUFBb0I7QUFDdkMsTUFBSSxFQUFDLGlDQUFRLFFBQVEsUUFBTztBQUM1QixRQUFNLFFBQVEsQ0FBQyxNQUFtQixVQUF3QjtBQUN4RCxXQUFPLElBQUksS0FBSyxJQUFJLEtBQUs7QUFDekIsU0FBSyxTQUFTLFFBQVEsQ0FBQyxVQUFVLE1BQU0sT0FBTyxLQUFLLENBQUM7QUFBQSxFQUN0RDtBQUNBLE9BQUssU0FBUyxRQUFRLENBQUMsT0FBTyxVQUFVLE1BQU0sT0FBTyxPQUFPLFFBQVEsT0FBTyxNQUFNLENBQUUsQ0FBQztBQUNwRixTQUFPO0FBQ1Q7QUFFTyxTQUFTLGtCQUFrQixZQUErQixPQUF1QjtBQXJLeEY7QUFzS0UsUUFBTSxVQUFVLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFHLGdCQUFXLGNBQVgsWUFBd0IsR0FBRyxDQUFDO0FBQ3RFLE1BQUksV0FBVyxrQkFBa0IsVUFBVyxRQUFPO0FBQ25ELFFBQU0sVUFBVSxLQUFLLElBQUksTUFBTSxLQUFLLElBQUksVUFBUyxnQkFBVyxpQkFBWCxZQUEyQixLQUFLLElBQUksR0FBRyxPQUFPLENBQUMsQ0FBQztBQUNqRyxRQUFNLFdBQVcsS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztBQUN2RCxTQUFPLFFBQVEsV0FBVyxVQUFVLFdBQVcsVUFBVSxRQUFRLENBQUMsQ0FBQztBQUNyRTtBQUVPLFNBQVMsU0FBUyxRQUFzQixPQUFxQixRQUFtQixVQUFrQjtBQUN2RyxRQUFNLFVBQVUsT0FBTyxLQUFLLE1BQU0sUUFBUSxJQUFJLE9BQU8sUUFBUSxJQUFJLENBQUMsT0FBTyxRQUFRO0FBQ2pGLFFBQU0sU0FBUyxNQUFNLEtBQUssTUFBTSxRQUFRLElBQUksTUFBTSxRQUFRLElBQUksQ0FBQyxNQUFNLFFBQVE7QUFDN0UsTUFBSSxVQUFVLFdBQVksUUFBTyxLQUFLLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxNQUFNLElBQUksTUFBTSxDQUFDO0FBQ2hGLFFBQU0sVUFBVSxXQUFXLFNBQVMsV0FBVztBQUMvQyxNQUFJLFVBQVUsUUFBUyxRQUFPLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxPQUFPLElBQUksTUFBTSxDQUFDLE1BQU0sTUFBTSxJQUFJLE1BQU0sQ0FBQztBQUM5SCxTQUFPLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLE9BQU8sSUFBSSxPQUFPLENBQUMsS0FBSyxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssTUFBTSxJQUFJLE1BQU0sQ0FBQztBQUN2RztBQUVPLFNBQVMsVUFBVSxPQUF1QjtBQUMvQyxTQUFPLE1BQU0sUUFBUSxZQUFZLENBQUMsY0FBYztBQXZMbEQ7QUF3TEksVUFBTSxXQUFtQyxFQUFFLEtBQUssUUFBUSxLQUFLLFFBQVEsS0FBSyxTQUFTLEtBQUssVUFBVSxLQUFLLFNBQVM7QUFDaEgsWUFBTyxjQUFTLFNBQVMsTUFBbEIsWUFBdUI7QUFBQSxFQUNoQyxDQUFDO0FBQ0g7QUFFQSxTQUFTLFdBQVcsT0FBMkIsVUFBMEI7QUFDdkUsU0FBTyxTQUFTLGtCQUFrQixLQUFLLEtBQUssSUFBSSxRQUFRO0FBQzFEO0FBRUEsU0FBUyxVQUFVLE9BQXNDO0FBQ3ZELE1BQUksVUFBVSxZQUFhLFFBQU87QUFDbEMsTUFBSSxVQUFVLE9BQVEsUUFBTztBQUM3QixTQUFPO0FBQ1Q7QUFFQSxTQUFTLFVBQVUsTUFBMkI7QUFDNUMsTUFBSSxLQUFLLFNBQVMsT0FBUSxRQUFPO0FBQ2pDLE1BQUksS0FBSyxTQUFTLFFBQVMsUUFBTztBQUNsQyxNQUFJLEtBQUssU0FBUyxPQUFRLFFBQU87QUFDakMsU0FBTztBQUNUO0FBRUEsU0FBUyxhQUFhLE1BQXdCLFdBQXFDO0FBQ2pGLFFBQU0sU0FBMkIsQ0FBQztBQUNsQyxNQUFJLFlBQVk7QUFDaEIsTUFBSSxZQUFZO0FBQ2hCLGFBQVcsT0FBTyxNQUFNO0FBQ3RCLFFBQUksYUFBYSxHQUFHO0FBQUUsa0JBQVk7QUFBTTtBQUFBLElBQU87QUFDL0MsUUFBSSxJQUFJLEtBQUssVUFBVSxXQUFXO0FBQ2hDLGFBQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxNQUFNLE9BQU8sSUFBSSxNQUFNLENBQUM7QUFDaEQsbUJBQWEsSUFBSSxLQUFLO0FBQ3RCO0FBQUEsSUFDRjtBQUNBLFdBQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxLQUFLLE1BQU0sR0FBRyxTQUFTLEdBQUcsT0FBTyxJQUFJLE1BQU0sQ0FBQztBQUNwRSxnQkFBWTtBQUNaLGdCQUFZO0FBQUEsRUFDZDtBQUNBLE1BQUksYUFBYSxPQUFPLE9BQVEsUUFBTyxPQUFPLFNBQVMsQ0FBQyxFQUFHLE9BQU8sR0FBRyxPQUFPLE9BQU8sU0FBUyxDQUFDLEVBQUcsS0FBSyxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2pILFNBQU87QUFDVDtBQUVBLFNBQVMsZUFBZSxNQUFvQyxjQUFzQixRQUFnQixZQUE0QjtBQUM1SCxRQUFNLFNBQTJCO0FBQUEsSUFDL0IsR0FBSSxTQUFTLENBQUMsRUFBRSxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFBQSxJQUNuQyxJQUFJLDZCQUFNLFVBQVMsT0FBTyxDQUFDLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFBQSxFQUNuRDtBQUNBLFNBQU8sYUFBYSxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUTtBQUMzQyxVQUFNLFFBQVEsSUFBSTtBQUNsQixVQUFNLGFBQXVCLENBQUM7QUFDOUIsUUFBSSwrQkFBTyxNQUFPLFlBQVcsS0FBSyxTQUFTLFdBQVcsTUFBTSxPQUFPLFVBQVUsQ0FBQyxHQUFHO0FBQ2pGLFNBQUksK0JBQU8sVUFBUyxPQUFXLFlBQVcsS0FBSyxnQkFBZ0IsTUFBTSxPQUFPLE1BQU0sR0FBRyxHQUFHO0FBQ3hGLFNBQUksK0JBQU8sWUFBVyxPQUFXLFlBQVcsS0FBSyxlQUFlLE1BQU0sU0FBUyxXQUFXLFFBQVEsR0FBRztBQUNyRyxVQUFNLGNBQXdCLENBQUM7QUFDL0IsUUFBSSwrQkFBTyxVQUFXLGFBQVksS0FBSyxXQUFXO0FBQ2xELFFBQUksK0JBQU8sT0FBUSxhQUFZLEtBQUssY0FBYztBQUNsRCxRQUFJLFlBQVksT0FBUSxZQUFXLEtBQUssb0JBQW9CLFlBQVksS0FBSyxHQUFHLENBQUMsR0FBRztBQUNwRixXQUFPLFVBQVUsV0FBVyxLQUFLLEdBQUcsQ0FBQyxJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUM7QUFBQSxFQUM5RCxDQUFDLEVBQUUsS0FBSyxFQUFFO0FBQ1o7QUFFQSxTQUFTLGNBQWMsTUFBa0MsWUFBd0M7QUFDL0YsTUFBSSxTQUFTLFFBQVMsUUFBTztBQUM3QixNQUFJLFNBQVMsT0FBUSxRQUFPO0FBQzVCLE1BQUksU0FBUyxhQUFZLHlDQUFZLFFBQVEsUUFBTyxJQUFJLFdBQVcsS0FBSyxFQUFFLFdBQVcsS0FBSyxFQUFFLENBQUM7QUFDN0YsU0FBTztBQUNUO0FBRU8sU0FBUyxjQUFjLE1BQW1CLE1BQWtCLE9BQWUsYUFBZ0MsQ0FBQyxHQUFXO0FBM1A5SDtBQTRQRSxRQUFNLG1CQUFrQixnQkFBVyxhQUFYLFlBQXVCO0FBQy9DLFFBQU0sU0FBUyxjQUFjLE1BQU0sTUFBTSxlQUFlO0FBQ3hELFFBQU0sVUFBVTtBQUNoQixRQUFNLFFBQVEsS0FBSyxJQUFJLEtBQUssT0FBTyxPQUFPLE9BQU8sT0FBTyxVQUFVLENBQUM7QUFDbkUsUUFBTSxTQUFTLEtBQUssSUFBSSxLQUFLLE9BQU8sT0FBTyxPQUFPLE9BQU8sVUFBVSxDQUFDO0FBQ3BFLFFBQU0sVUFBVSxVQUFVLE9BQU87QUFDakMsUUFBTSxVQUFVLFVBQVUsT0FBTztBQUNqQyxRQUFNLGFBQVksZ0JBQVcsY0FBWCxZQUF3QjtBQUMxQyxRQUFNLGNBQWMsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUM5RCxRQUFNLGlCQUFpQixXQUFXLG1CQUFtQixvQkFBb0IsTUFBTSxXQUFXLFlBQVksSUFBSSxvQkFBSSxJQUFvQjtBQUNsSSxRQUFNLFFBQVEsT0FBTyxNQUNsQixPQUFPLENBQUMsYUFBYSxTQUFTLFFBQVEsRUFDdEMsSUFBSSxDQUFDLGFBQWE7QUF4UXZCLFFBQUFDLEtBQUFDO0FBeVFNLFVBQU0sU0FBUyxTQUFTLFdBQVcsT0FBTyxLQUFLLElBQUksU0FBUyxRQUFRLElBQUk7QUFDeEUsVUFBTSxTQUFTLFlBQVdELE1BQUEsU0FBUyxLQUFLLFVBQWQsZ0JBQUFBLElBQXFCLFFBQU9DLE1BQUEsZUFBZSxJQUFJLFNBQVMsS0FBSyxFQUFFLE1BQW5DLE9BQUFBLE1BQXdDLFdBQVc7QUFDekcsVUFBTUMsU0FBUSxrQkFBa0IsWUFBWSxTQUFTLEtBQUs7QUFDMUQsV0FBTyxTQUFTLFlBQVksU0FBUyxRQUFRLFVBQVUsU0FBUyxDQUFDLHlCQUF5QixNQUFNLG1CQUFtQkEsTUFBSyxxRUFBcUU7QUFBQSxFQUMvTCxDQUFDLEVBQ0EsS0FBSyxJQUFJO0FBRVosUUFBTSxRQUFRLE9BQU8sTUFBTSxJQUFJLENBQUMsYUFBYTtBQWhSL0MsUUFBQUYsS0FBQUMsS0FBQUUsS0FBQTtBQWlSSSxVQUFNLE9BQU8sU0FBUztBQUN0QixVQUFNLElBQUksU0FBUyxJQUFJLFNBQVMsUUFBUTtBQUN4QyxVQUFNLElBQUksU0FBUyxJQUFJLFNBQVMsU0FBUztBQUN6QyxVQUFNLFNBQVMsU0FBUyxVQUFVO0FBQ2xDLFVBQU0sb0JBQW9CLFNBQVMsV0FBVyxXQUFXLFdBQVcsU0FBUyxJQUFJLFdBQVcsV0FBVyxXQUFXLFNBQVM7QUFDM0gsVUFBTSxjQUFjLFNBQVMsV0FBVyxXQUFXLGVBQWUsU0FBUyxJQUFJLFdBQVcsV0FBVyxXQUFXLFNBQVM7QUFDekgsVUFBTUMsY0FBYSxZQUFXSixNQUFBLEtBQUssVUFBTCxnQkFBQUEsSUFBWSxPQUFPLGlCQUFpQjtBQUNsRSxVQUFNLGFBQWEsWUFBV0MsTUFBQSxLQUFLLFVBQUwsZ0JBQUFBLElBQVksV0FBVyxXQUFXO0FBQ2hFLFVBQU0sY0FBYyxlQUFlLElBQUksS0FBSyxFQUFFO0FBQzlDLFVBQU0sU0FBUyxZQUFXRSxNQUFBLEtBQUssVUFBTCxnQkFBQUEsSUFBWSxhQUFhLFNBQVNDLGNBQWEsb0NBQWUsV0FBVyxXQUFXLGlCQUFpQixTQUFTLENBQUM7QUFDekksVUFBTSxlQUFjLHNCQUFLLFVBQUwsbUJBQVksZ0JBQVosWUFBMkIsV0FBVyxvQkFBdEMsWUFBMEQsU0FBUyxJQUFJO0FBQzNGLFVBQU0sU0FBUyxHQUFHLEtBQUssT0FBTyxHQUFHLEtBQUssSUFBSSxNQUFNLEVBQUUsR0FBRyxVQUFVLElBQUksQ0FBQztBQUNwRSxVQUFNLGdCQUFnQixrQkFBa0IsSUFBSTtBQUM1QyxRQUFJLFdBQVcsSUFBSTtBQUNuQixVQUFNLGVBQXlCLENBQUM7QUFDaEMsUUFBSSxhQUFhO0FBQ2pCLGVBQVcsU0FBUyxlQUFlO0FBQ2pDLFVBQUksTUFBTSxTQUFTLFNBQVM7QUFDMUIscUJBQWEsS0FBSyxZQUFZLFNBQVMsSUFBSSxFQUFFLFFBQVEsV0FBVyxFQUFFLDJFQUEyRSxTQUFTLENBQUMsUUFBUSxXQUFXLEVBQUUsZ0NBQWdDLFVBQVUsOEJBQXVCLFlBQVcsV0FBTSxRQUFOLFlBQWEsZ0JBQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLFNBQVM7QUFDalMsb0JBQVk7QUFBQSxNQUNkLFdBQVcsTUFBTSxLQUFLLEtBQUssR0FBRztBQUM1QixjQUFNLGNBQWMsYUFBYSxLQUFLO0FBQ3RDLHFCQUFhO0FBQ2IscUJBQWEsS0FBSyxZQUFZLFNBQVMsQ0FBQyxRQUFRLFFBQVEsZ0NBQWdDLFVBQVUsaUJBQWdCLGdCQUFLLFVBQUwsbUJBQVksYUFBWixZQUF3QixlQUFlLEtBQUssZUFBZSxNQUFNLFVBQVUsTUFBTSxNQUFNLGFBQWEsVUFBVSxDQUFDLFNBQVM7QUFDMU8sc0JBQWEsZ0JBQUssVUFBTCxtQkFBWSxhQUFaLFlBQXdCLG1CQUFtQjtBQUFBLE1BQzFEO0FBQUEsSUFDRjtBQUNBLFFBQUksQ0FBQyxjQUFjLE9BQVEsY0FBYSxLQUFLLFlBQVksU0FBUyxDQUFDLFFBQVEsUUFBUSxnQ0FBZ0MsVUFBVSxpQkFBZ0IsZ0JBQUssVUFBTCxtQkFBWSxhQUFaLFlBQXdCLGVBQWUsS0FBSyxVQUFVLFVBQVUsY0FBYyxJQUFJLEtBQUssMEJBQU0sQ0FBQyxTQUFTO0FBQ3BQLFFBQUksUUFBUSxXQUFXO0FBQ3ZCLFVBQU0sWUFBc0IsQ0FBQztBQUM3QixRQUFJLEtBQUssUUFBUTtBQUNmLGdCQUFVLEtBQUssWUFBWSxJQUFJLEVBQUUsUUFBUSxLQUFLLFlBQVksU0FBUyxRQUFRLEVBQUUsNERBQTRELFVBQVUsMkRBQTJELFNBQVMsQ0FBQyxRQUFRLFFBQVEsRUFBRSxnQ0FBZ0MsVUFBVSwyQkFBc0IsWUFBVyxVQUFLLE9BQU8sVUFBWixZQUFxQixLQUFLLE9BQU8sTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsU0FBUztBQUNsWCxlQUFTO0FBQUEsSUFDWDtBQUNBLFFBQUksS0FBSyxPQUFPO0FBQ2QsWUFBTSxPQUFPLENBQUMsS0FBSyxNQUFNLFNBQVMsR0FBRyxLQUFLLE1BQU0sS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2hFLFdBQUssUUFBUSxDQUFDLEtBQUssVUFBVTtBQUMzQixjQUFNLFVBQVUsVUFBVSxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssV0FBVyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssT0FBTyxFQUFFLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFDbkcsa0JBQVUsS0FBSyxZQUFZLElBQUksRUFBRSxRQUFRLFFBQVEsUUFBUSxFQUFFLFdBQVcsVUFBVSxnQkFBZ0IsVUFBVSxJQUFJLE9BQU8sR0FBRyxrQkFBa0IsVUFBVSxJQUFJLE1BQU0sR0FBRyxLQUFLLE9BQU8sU0FBUztBQUFBLE1BQ3hMLENBQUM7QUFDRCxVQUFJLEtBQUssTUFBTSxLQUFLLFNBQVMsRUFBRyxXQUFVLEtBQUssWUFBWSxJQUFJLEVBQUUsUUFBUSxRQUFRLEtBQUssU0FBUyxFQUFFLFdBQVcsVUFBVSxxREFBc0MsS0FBSyxNQUFNLEtBQUssU0FBUyxDQUFDLGdCQUFXO0FBQUEsSUFDbk07QUFDQSxRQUFJLEtBQUssTUFBTTtBQUNiLGdCQUFVLEtBQUssWUFBWSxJQUFJLEVBQUUsUUFBUSxRQUFRLEVBQUUsWUFBWSxTQUFTLFFBQVEsRUFBRSxhQUFhLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxLQUFLLE1BQU0sT0FBTyxFQUFFLFNBQVMsS0FBSyxFQUFFLENBQUMsQ0FBQyxzQ0FBc0M7QUFDaE4sZ0JBQVUsS0FBSyxZQUFZLElBQUksRUFBRSxRQUFRLFFBQVEsQ0FBQyxXQUFXLFVBQVUsZ0NBQWdDLFVBQVUsS0FBSyxLQUFLLFlBQVksTUFBTSxDQUFDLFNBQVM7QUFDdkosV0FBSyxLQUFLLEtBQUssTUFBTSxPQUFPLEVBQUUsTUFBTSxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsTUFBTSxVQUFVLFVBQVUsS0FBSyxZQUFZLElBQUksRUFBRSxRQUFRLFFBQVEsS0FBSyxRQUFRLEVBQUUsV0FBVyxVQUFVLDJDQUEyQyxVQUFVLEtBQUssTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUFBLElBQzVPO0FBQ0EsVUFBTSxjQUFjLFVBQVUsS0FBSyxFQUFFO0FBQ3JDLFVBQU0sU0FBTyxVQUFLLFNBQUwsbUJBQVcsVUFDcEIsWUFBWSxTQUFTLENBQUMsUUFBUSxTQUFTLElBQUksU0FBUyxTQUFTLElBQUksQ0FBQyxnQ0FBZ0MsVUFBVSxrQ0FBa0MsVUFBVSxLQUFLLEtBQUssSUFBSSxDQUFDLFFBQVEsSUFBSSxHQUFHLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsWUFDbE47QUFDSixVQUFNLFFBQU8sc0JBQUssVUFBTCxtQkFBWSxTQUFaLFlBQW9CLFdBQVcsU0FBL0IsWUFBdUM7QUFDcEQsVUFBTSxVQUFTLHNCQUFLLFVBQUwsbUJBQVksV0FBWixZQUFzQixXQUFXLFdBQWpDLFlBQTJDO0FBQzFELFVBQU0sYUFBWSxzQkFBSyxVQUFMLG1CQUFZLGNBQVosWUFBeUIsV0FBVyxjQUFwQyxZQUFpRDtBQUNuRSxVQUFNLFlBQVcsZ0JBQUssVUFBTCxtQkFBWSxhQUFaLFlBQXdCO0FBQ3pDLFdBQU8sZUFBZSxDQUFDLFFBQVEsQ0FBQyxZQUFZLFNBQVMsS0FBSyxhQUFhLFNBQVMsTUFBTSxTQUFTLFdBQVUsVUFBSyxVQUFMLG1CQUFZLEtBQUssQ0FBQyxXQUFXQSxXQUFVLGFBQWEsTUFBTSxtQkFBbUIsV0FBVyxzQkFBc0IsVUFBVSxPQUFPLE1BQU0sR0FBRyxpQkFBaUIsU0FBUyxXQUFXLFFBQVEsc0JBQXNCLFlBQVksY0FBYyxNQUFNLEtBQUssYUFBYSxLQUFLLEVBQUUsQ0FBQyxPQUFPLFdBQVcsR0FBRyxJQUFJO0FBQUEsRUFDelksQ0FBQyxFQUFFLEtBQUssSUFBSTtBQUVaLFFBQU0sYUFBYSxXQUFXLFdBQVcsaUJBQWlCLFNBQVM7QUFDbkUsUUFBTSxlQUFlLFdBQVcsV0FBVyxjQUFjLFNBQVM7QUFDbEUsUUFBTSxXQUFVLGdCQUFXLHNCQUFYLFlBQWdDO0FBQ2hELFFBQU0sT0FBTyxZQUFZLFNBQ3JCLHdJQUF3SSxZQUFZLG1IQUNwSixZQUFZLFNBQ1YsNEhBQTRILFlBQVksa0dBQ3hJO0FBRU4sU0FBTztBQUFBLGlEQUN3QyxLQUFLLEtBQUssS0FBSyxDQUFDLGFBQWEsS0FBSyxLQUFLLE1BQU0sQ0FBQyxrQkFBa0IsS0FBSyxLQUFLLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxNQUFNLENBQUM7QUFBQSxTQUM3SSxVQUFVLEtBQUssQ0FBQztBQUFBLHdCQUNELFVBQVUsZ0JBQWdCLGNBQWMsV0FBVyxZQUFZLFdBQVcsVUFBVSxDQUFDO0FBQUEsRUFDM0csSUFBSSwyQkFBMkIsT0FBTyxJQUFJLE9BQU8sTUFBTSxLQUFLLEdBQUcsS0FBSztBQUFBO0FBRXRFOzs7QUN0Vk8sU0FBUyxvQkFDZCxXQUNBQyxXQUNBLFNBQ007QUFDTixZQUFVLE1BQU07QUFDaEIsWUFBVSxTQUFTLG9CQUFvQjtBQUN2QyxRQUFNLE1BQU0sY0FBY0EsVUFBUyxNQUFNQSxVQUFTLFFBQVFBLFVBQVMsT0FBTyxnQkFBZ0IsbUNBQVMsbUJBQW1CQSxVQUFTLFVBQVUsQ0FBQztBQUMxSSxRQUFNLFFBQVEsVUFBVSxTQUFTLE9BQU87QUFBQSxJQUN0QyxNQUFNO0FBQUEsTUFDSixLQUFLLEdBQUdBLFVBQVMsS0FBSztBQUFBLE1BQ3RCLEtBQUssb0NBQW9DLG1CQUFtQixHQUFHLENBQUM7QUFBQSxJQUNsRTtBQUFBLEVBQ0YsQ0FBQztBQUNELE1BQUksbUNBQVMsVUFBVyxPQUFNLE1BQU0sWUFBWSxHQUFHLFFBQVEsU0FBUztBQUNwRSxPQUFJLG1DQUFTLFFBQU8sUUFBUSxNQUFNO0FBQ2hDLFVBQU0saUJBQWlCLFlBQVksTUFBTTtBQXBCN0M7QUFxQk0sYUFBSyxhQUFRLFFBQVIsbUJBQWEsVUFBVSxRQUFRLE9BQU8sU0FBUyxRQUFRO0FBQUEsSUFDOUQsQ0FBQztBQUNELFVBQU0sUUFBUSxTQUFTLGtEQUFVO0FBQUEsRUFDbkM7QUFDRjtBQUVPLFNBQVMsbUJBQW1CLFdBQXdCLFFBQWdCLGVBQXVCLG1CQUE2QztBQUM3SSxzQkFBb0IsV0FBVyxjQUFjLFFBQVEsYUFBYSxHQUFHLEVBQUUsa0JBQWtCLENBQUM7QUFDNUY7OztBQzdCQSxJQUFBQyxtQkFBaUc7OztBQ0FqRyxJQUFBQyxtQkFBa0Q7OztBQ0FsRCxJQUFBQyxtQkFBbUM7QUFVbkMsU0FBUyxXQUFXLE9BQStDO0FBQ2pFLE1BQUksQ0FBQyxPQUFPO0FBQ1YsV0FBTztBQUFBLE1BQ0wsU0FBUyxDQUFDLFlBQU8sVUFBSztBQUFBLE1BQ3RCLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFBQSxNQUN6QixZQUFZLENBQUMsUUFBUSxNQUFNO0FBQUEsTUFDM0IsUUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQ0EsU0FBTyxLQUFLLE1BQU0sS0FBSyxVQUFVLEtBQUssQ0FBQztBQUN6QztBQUVPLElBQU0saUJBQU4sY0FBNkIsdUJBQU07QUFBQSxFQU14QyxZQUFZLEtBQVUsT0FBaUMsUUFBdUM7QUFDNUYsVUFBTSxHQUFHO0FBQ1QsU0FBSyxRQUFRLFdBQVcsS0FBSztBQUM3QixTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsU0FBZTtBQUNiLFNBQUssUUFBUSxRQUFRLDRDQUFTO0FBQzlCLFNBQUssVUFBVSxTQUFTLGlCQUFpQjtBQUV6QyxVQUFNLGNBQWMsS0FBSyxVQUFVLFNBQVMsS0FBSztBQUFBLE1BQy9DLEtBQUs7QUFBQSxNQUNMLE1BQU07QUFBQSxJQUNSLENBQUM7QUFDRCxnQkFBWSxRQUFRLGFBQWEsUUFBUTtBQUV6QyxVQUFNLFVBQVUsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLG9CQUFvQixDQUFDO0FBQ3JFLFVBQU0sU0FBUyxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sWUFBTyxNQUFNLFNBQVMsQ0FBQztBQUN6RSxVQUFNLFlBQVksUUFBUSxTQUFTLFVBQVUsRUFBRSxNQUFNLGlCQUFPLE1BQU0sU0FBUyxDQUFDO0FBQzVFLFVBQU0sWUFBWSxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sWUFBTyxNQUFNLFNBQVMsQ0FBQztBQUM1RSxVQUFNLGVBQWUsUUFBUSxTQUFTLFVBQVUsRUFBRSxNQUFNLGlCQUFPLE1BQU0sU0FBUyxDQUFDO0FBQy9FLFVBQU0sYUFBYSxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0seUJBQWUsTUFBTSxTQUFTLENBQUM7QUFFckYsU0FBSyxTQUFTLEtBQUssVUFBVSxVQUFVLEVBQUUsS0FBSyx3QkFBd0IsQ0FBQztBQUN2RSxTQUFLLFdBQVc7QUFFaEIsVUFBTSxnQkFBZ0IsS0FBSyxVQUFVLFNBQVMsU0FBUyxFQUFFLE1BQU0sd0JBQWMsQ0FBQztBQUM5RSxTQUFLLGFBQWEsY0FBYyxTQUFTLFlBQVk7QUFBQSxNQUNuRCxLQUFLO0FBQUEsTUFDTCxNQUFNLEVBQUUsYUFBYSwwRUFBNEM7QUFBQSxJQUNuRSxDQUFDO0FBQ0QsU0FBSyxXQUFXLE9BQU87QUFDdkIsU0FBSyxXQUFXLFFBQVEsZ0JBQWdCLEtBQUssS0FBSztBQUNsRCxVQUFNLGNBQWMsY0FBYyxTQUFTLFVBQVUsRUFBRSxNQUFNLHlCQUFlLE1BQU0sU0FBUyxDQUFDO0FBRTVGLFdBQU8saUJBQWlCLFNBQVMsTUFBTTtBQUNyQyxXQUFLLFlBQVk7QUFDakIsV0FBSyxNQUFNLEtBQUssS0FBSyxLQUFLLE1BQU0sUUFBUSxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ3JELFdBQUssV0FBVztBQUFBLElBQ2xCLENBQUM7QUFDRCxjQUFVLGlCQUFpQixTQUFTLE1BQU07QUFDeEMsV0FBSyxZQUFZO0FBQ2pCLFVBQUksS0FBSyxNQUFNLEtBQUssT0FBUSxNQUFLLE1BQU0sS0FBSyxJQUFJO0FBQ2hELFdBQUssV0FBVztBQUFBLElBQ2xCLENBQUM7QUFDRCxjQUFVLGlCQUFpQixTQUFTLE1BQU07QUF6RTlDO0FBMEVNLFdBQUssWUFBWTtBQUNqQixVQUFJLEtBQUssTUFBTSxRQUFRLFVBQVUsSUFBSTtBQUFFLFlBQUksd0JBQU8sb0NBQVc7QUFBRztBQUFBLE1BQVE7QUFDeEUsV0FBSyxNQUFNLFFBQVEsS0FBSyxVQUFLLEtBQUssTUFBTSxRQUFRLFNBQVMsQ0FBQyxFQUFFO0FBQzVELHVCQUFLLE9BQU0sZUFBWCxlQUFXLGFBQWUsQ0FBQztBQUMzQixXQUFLLE1BQU0sV0FBVyxLQUFLLE1BQU07QUFDakMsV0FBSyxNQUFNLEtBQUssUUFBUSxDQUFDLFFBQVEsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUM3QyxXQUFLLFdBQVc7QUFBQSxJQUNsQixDQUFDO0FBQ0QsaUJBQWEsaUJBQWlCLFNBQVMsTUFBTTtBQWxGakQ7QUFtRk0sV0FBSyxZQUFZO0FBQ2pCLFVBQUksS0FBSyxNQUFNLFFBQVEsVUFBVSxFQUFHO0FBQ3BDLFdBQUssTUFBTSxRQUFRLElBQUk7QUFDdkIsaUJBQUssTUFBTSxlQUFYLG1CQUF1QjtBQUN2QixXQUFLLE1BQU0sS0FBSyxRQUFRLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQztBQUMxQyxXQUFLLFdBQVc7QUFBQSxJQUNsQixDQUFDO0FBQ0QsZUFBVyxpQkFBaUIsU0FBUyxNQUFNO0FBQ3pDLFdBQUssWUFBWTtBQUNqQixXQUFLLFdBQVcsUUFBUSxnQkFBZ0IsS0FBSyxLQUFLO0FBQUEsSUFDcEQsQ0FBQztBQUNELGdCQUFZLGlCQUFpQixTQUFTLE1BQU07QUFDMUMsWUFBTSxTQUFTLG1CQUFtQixLQUFLLFdBQVcsS0FBSztBQUN2RCxVQUFJLENBQUMsUUFBUTtBQUNYLFlBQUksd0JBQU8sa0VBQXFCO0FBQ2hDO0FBQUEsTUFDRjtBQUNBLFdBQUssUUFBUTtBQUNiLFdBQUssV0FBVztBQUNoQixVQUFJLHdCQUFPLHlDQUFnQjtBQUFBLElBQzdCLENBQUM7QUFFRCxVQUFNLFVBQVUsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLG9CQUFvQixDQUFDO0FBQ3JFLFVBQU0sU0FBUyxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sZ0JBQU0sTUFBTSxTQUFTLENBQUM7QUFDeEUsVUFBTSxPQUFPLFFBQVEsU0FBUyxVQUFVLEVBQUUsTUFBTSw0QkFBUSxNQUFNLFVBQVUsS0FBSyxVQUFVLENBQUM7QUFDeEYsV0FBTyxpQkFBaUIsU0FBUyxNQUFNLEtBQUssTUFBTSxDQUFDO0FBQ25ELFNBQUssaUJBQWlCLFNBQVMsTUFBTTtBQTdHekM7QUE4R00sV0FBSyxZQUFZO0FBQ2pCLFVBQUksQ0FBQyxLQUFLLE1BQU0sUUFBUSxLQUFLLENBQUMsV0FBVyxPQUFPLEtBQUssQ0FBQyxHQUFHO0FBQ3ZELFlBQUksd0JBQU8sa0RBQVU7QUFDckI7QUFBQSxNQUNGO0FBQ0EsV0FBSyxNQUFNLFVBQVMsVUFBSyxNQUFNLFdBQVgsWUFBcUI7QUFDekMsV0FBSyxPQUFPLEtBQUssS0FBSztBQUN0QixXQUFLLE1BQU07QUFBQSxJQUNiLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFUSxhQUFtQjtBQUN6QixTQUFLLE9BQU8sTUFBTTtBQUNsQixVQUFNLFFBQVEsS0FBSyxPQUFPLFNBQVMsT0FBTztBQUMxQyxVQUFNLE9BQU8sTUFBTSxTQUFTLE9BQU8sRUFBRSxTQUFTLElBQUk7QUFDbEQsU0FBSyxNQUFNLFFBQVEsUUFBUSxDQUFDLFFBQVEsVUFBVTtBQTdIbEQ7QUE4SE0sWUFBTSxLQUFLLEtBQUssU0FBUyxJQUFJO0FBQzdCLFlBQU0sUUFBUSxHQUFHLFNBQVMsU0FBUyxFQUFFLE1BQU0sUUFBUSxNQUFNLEVBQUUsYUFBYSxVQUFVLGVBQWUsT0FBTyxLQUFLLEVBQUUsRUFBRSxDQUFDO0FBQ2xILFlBQU0sUUFBUTtBQUNkLFlBQU0sUUFBUSxHQUFHLFNBQVMsVUFBVSxFQUFFLE1BQU0sRUFBRSxhQUFhLGFBQWEsZUFBZSxPQUFPLEtBQUssR0FBRyxjQUFjLFVBQUssUUFBUSxDQUFDLGtDQUFTLEVBQUUsQ0FBQztBQUM5SSxNQUFDLENBQUMsQ0FBQyxRQUFRLFFBQUcsR0FBRyxDQUFDLFVBQVUsUUFBRyxHQUFHLENBQUMsU0FBUyxRQUFHLENBQUMsRUFBc0MsUUFBUSxDQUFDLENBQUMsT0FBTyxLQUFLLE1BQU0sTUFBTSxTQUFTLFVBQVUsRUFBRSxNQUFNLE9BQU8sTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDNUssWUFBTSxTQUFRLGdCQUFLLE1BQU0sZUFBWCxtQkFBd0IsV0FBeEIsWUFBa0M7QUFBQSxJQUNsRCxDQUFDO0FBQ0QsVUFBTSxPQUFPLE1BQU0sU0FBUyxPQUFPO0FBQ25DLFNBQUssTUFBTSxLQUFLLFFBQVEsQ0FBQyxLQUFLLGFBQWE7QUFDekMsWUFBTSxLQUFLLEtBQUssU0FBUyxJQUFJO0FBQzdCLFdBQUssTUFBTSxRQUFRLFFBQVEsQ0FBQyxHQUFHLGdCQUFnQjtBQXhJckQ7QUF5SVEsY0FBTSxLQUFLLEdBQUcsU0FBUyxJQUFJO0FBQzNCLGNBQU0sUUFBUSxHQUFHLFNBQVMsWUFBWSxFQUFFLE1BQU0sRUFBRSxhQUFhLFFBQVEsWUFBWSxPQUFPLFFBQVEsR0FBRyxlQUFlLE9BQU8sV0FBVyxFQUFFLEVBQUUsQ0FBQztBQUN6SSxjQUFNLE9BQU87QUFDYixjQUFNLFNBQVEsU0FBSSxXQUFXLE1BQWYsWUFBb0I7QUFBQSxNQUNwQyxDQUFDO0FBQUEsSUFDSCxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRVEsY0FBb0I7QUFDMUIsVUFBTSxVQUFVLE1BQU0sS0FBSyxLQUFLLE9BQU8saUJBQW1DLDJCQUEyQixDQUFDO0FBQ3RHLFlBQVEsUUFBUSxDQUFDLFVBQVU7QUFDekIsWUFBTSxTQUFTLE9BQU8sTUFBTSxRQUFRLE1BQU07QUFDMUMsVUFBSSxPQUFPLFVBQVUsTUFBTSxFQUFHLE1BQUssTUFBTSxRQUFRLE1BQU0sSUFBSSxNQUFNLE1BQU0sS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFJO0FBQUEsSUFDN0YsQ0FBQztBQUNELFVBQU0sYUFBYSxNQUFNLEtBQUssS0FBSyxPQUFPLGlCQUFvQywrQkFBK0IsQ0FBQztBQUM5RyxTQUFLLE1BQU0sYUFBYSxLQUFLLE1BQU0sUUFBUSxJQUFJLE1BQU0sTUFBTTtBQUMzRCxlQUFXLFFBQVEsQ0FBQyxVQUFVO0FBQzVCLFlBQU0sU0FBUyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQzFDLFVBQUksT0FBTyxVQUFVLE1BQU0sRUFBRyxNQUFLLE1BQU0sV0FBWSxNQUFNLElBQUksTUFBTSxVQUFVLFlBQVksTUFBTSxVQUFVLFVBQVUsTUFBTSxRQUFRO0FBQUEsSUFDckksQ0FBQztBQUNELFVBQU0sUUFBUSxNQUFNLEtBQUssS0FBSyxPQUFPLGlCQUFzQyw0QkFBNEIsQ0FBQztBQUN4RyxVQUFNLFFBQVEsQ0FBQyxVQUFVO0FBQ3ZCLFlBQU0sTUFBTSxPQUFPLE1BQU0sUUFBUSxHQUFHO0FBQ3BDLFlBQU0sU0FBUyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQzFDLFVBQUksT0FBTyxVQUFVLEdBQUcsS0FBSyxPQUFPLFVBQVUsTUFBTSxLQUFLLEtBQUssTUFBTSxLQUFLLEdBQUcsRUFBRyxNQUFLLE1BQU0sS0FBSyxHQUFHLEVBQUcsTUFBTSxJQUFJLE1BQU0sTUFBTSxNQUFNLEdBQUcsR0FBSTtBQUFBLElBQzFJLENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUFFTyxJQUFNLGdCQUFOLGNBQTRCLHVCQUFNO0FBQUEsRUFJdkMsWUFBWSxLQUFVLE9BQXFDLFFBQTJDO0FBQ3BHLFVBQU0sR0FBRztBQUNULFNBQUssUUFBUTtBQUNiLFNBQUssU0FBUztBQUFBLEVBQ2hCO0FBQUEsRUFFQSxTQUFlO0FBaExqQjtBQWlMSSxTQUFLLFFBQVEsUUFBUSw0Q0FBUztBQUM5QixTQUFLLFVBQVUsU0FBUyxnQkFBZ0I7QUFDeEMsVUFBTSxnQkFBZ0IsS0FBSyxVQUFVLFNBQVMsU0FBUyxFQUFFLE1BQU0sMkJBQU8sQ0FBQztBQUN2RSxVQUFNLGdCQUFnQixjQUFjLFNBQVMsU0FBUyxFQUFFLE1BQU0sUUFBUSxNQUFNLEVBQUUsYUFBYSx3Q0FBeUIsRUFBRSxDQUFDO0FBQ3ZILGtCQUFjLFNBQVEsZ0JBQUssVUFBTCxtQkFBWSxhQUFaLFlBQXdCO0FBRTlDLFVBQU0sWUFBWSxLQUFLLFVBQVUsU0FBUyxTQUFTLEVBQUUsTUFBTSwyQkFBTyxDQUFDO0FBQ25FLFVBQU0sWUFBWSxVQUFVLFNBQVMsWUFBWSxFQUFFLEtBQUsscUJBQXFCLE1BQU0sRUFBRSxZQUFZLFNBQVMsYUFBYSwrR0FBOEMsRUFBRSxDQUFDO0FBQ3hLLGNBQVUsT0FBTztBQUNqQixjQUFVLFNBQVEsZ0JBQUssVUFBTCxtQkFBWSxTQUFaLFlBQW9CO0FBRXRDLFVBQU0sU0FBUyxLQUFLLFVBQVUsU0FBUyxVQUFVLEVBQUUsTUFBTSw0QkFBa0IsTUFBTSxTQUFTLENBQUM7QUFDM0YsV0FBTyxpQkFBaUIsU0FBUyxNQUFNO0FBN0wzQyxVQUFBQztBQThMTSxZQUFNLFNBQVMsZ0JBQWdCLFVBQVUsS0FBSztBQUM5QyxVQUFJLENBQUMsUUFBUTtBQUFFLFlBQUksd0JBQU8sd0VBQWdDO0FBQUc7QUFBQSxNQUFRO0FBQ3JFLG9CQUFjLFNBQVFBLE1BQUEsT0FBTyxhQUFQLE9BQUFBLE1BQW1CO0FBQ3pDLGdCQUFVLFFBQVEsT0FBTztBQUN6QixVQUFJLHdCQUFPLDhEQUFZO0FBQUEsSUFDekIsQ0FBQztBQUVELFVBQU0sVUFBVSxLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUssb0JBQW9CLENBQUM7QUFDckUsVUFBTSxTQUFTLFFBQVEsU0FBUyxVQUFVLEVBQUUsTUFBTSxnQkFBTSxNQUFNLFNBQVMsQ0FBQztBQUN4RSxVQUFNLE9BQU8sUUFBUSxTQUFTLFVBQVUsRUFBRSxNQUFNLDRCQUFRLE1BQU0sVUFBVSxLQUFLLFVBQVUsQ0FBQztBQUN4RixXQUFPLGlCQUFpQixTQUFTLE1BQU0sS0FBSyxNQUFNLENBQUM7QUFDbkQsU0FBSyxpQkFBaUIsU0FBUyxNQUFNO0FBek16QyxVQUFBQTtBQTBNTSxVQUFJLFdBQVcsY0FBYyxNQUFNLEtBQUs7QUFDeEMsVUFBSSxPQUFPLFVBQVU7QUFDckIsWUFBTSxTQUFTLGdCQUFnQixJQUFJO0FBQ25DLFVBQUksUUFBUTtBQUNWLG9CQUFXQSxNQUFBLE9BQU8sYUFBUCxPQUFBQSxNQUFtQjtBQUM5QixlQUFPLE9BQU87QUFBQSxNQUNoQjtBQUNBLFVBQUksQ0FBQyxLQUFLLEtBQUssR0FBRztBQUFFLFlBQUksd0JBQU8sa0RBQVU7QUFBRztBQUFBLE1BQVE7QUFDcEQsV0FBSyxPQUFPLEVBQUUsVUFBVSxTQUFTLFFBQVEsb0JBQW9CLEVBQUUsRUFBRSxNQUFNLEdBQUcsRUFBRSxLQUFLLFFBQVcsS0FBSyxDQUFDO0FBQ2xHLFdBQUssTUFBTTtBQUFBLElBQ2IsQ0FBQztBQUFBLEVBQ0g7QUFDRjs7O0FEN0dBLFNBQVMsbUJBQW1CLFdBQXdCLE1BQW9DLGNBQTRCO0FBekdwSDtBQTBHRSxZQUFVLE1BQU07QUFDaEIsTUFBSSxFQUFDLDZCQUFNLFNBQVE7QUFDakIsY0FBVSxRQUFRLFlBQVk7QUFDOUI7QUFBQSxFQUNGO0FBQ0EsYUFBVyxPQUFPLE1BQU07QUFDdEIsVUFBTSxPQUFPLFVBQVUsV0FBVyxFQUFFLEtBQUssZ0JBQWdCLE1BQU0sSUFBSSxLQUFLLENBQUM7QUFDekUsVUFBSSxTQUFJLFVBQUosbUJBQVcsVUFBUyxPQUFXLE1BQUssTUFBTSxhQUFhLElBQUksTUFBTSxPQUFPLFFBQVE7QUFDcEYsVUFBSSxTQUFJLFVBQUosbUJBQVcsWUFBVyxPQUFXLE1BQUssTUFBTSxZQUFZLElBQUksTUFBTSxTQUFTLFdBQVc7QUFDMUYsVUFBTSxjQUF3QixDQUFDO0FBQy9CLFNBQUksU0FBSSxVQUFKLG1CQUFXLFVBQVcsYUFBWSxLQUFLLFdBQVc7QUFDdEQsU0FBSSxTQUFJLFVBQUosbUJBQVcsT0FBUSxhQUFZLEtBQUssY0FBYztBQUN0RCxRQUFJLFlBQVksT0FBUSxNQUFLLE1BQU0scUJBQXFCLFlBQVksS0FBSyxHQUFHO0FBQzVFLFNBQUksU0FBSSxVQUFKLG1CQUFXLE1BQU8sTUFBSyxNQUFNLFFBQVEsSUFBSSxNQUFNO0FBQUEsRUFDckQ7QUFDRjtBQXVEQSxJQUFNLG9CQUFOLGNBQWdDLHVCQUFNO0FBQUEsRUFHcEMsWUFBWSxLQUEyQixRQUFpQyxLQUFhO0FBQ25GLFVBQU0sR0FBRztBQUQ0QjtBQUFpQztBQUZ4RSxTQUFRLFFBQVE7QUFBQSxFQUloQjtBQUFBLEVBRUEsU0FBZTtBQUNiLFNBQUssUUFBUSxTQUFTLHlCQUF5QjtBQUMvQyxTQUFLLFFBQVEsUUFBUSxLQUFLLE9BQU8sMEJBQU07QUFDdkMsVUFBTSxVQUFVLEtBQUssVUFBVSxVQUFVLEVBQUUsS0FBSyw0QkFBNEIsQ0FBQztBQUM3RSxVQUFNLFlBQVksS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLDBCQUEwQixDQUFDO0FBQzdFLFVBQU0sUUFBUSxVQUFVLFNBQVMsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEtBQUssUUFBUSxLQUFLLEtBQUssT0FBTyxlQUFLLEVBQUUsQ0FBQztBQUM3RixRQUFJLFlBQVk7QUFDaEIsUUFBSSxhQUFhO0FBQ2pCLFVBQU0sYUFBYSxNQUFZO0FBQzdCLFVBQUksQ0FBQyxhQUFhLENBQUMsV0FBWTtBQUMvQixZQUFNLE1BQU0sUUFBUSxHQUFHLEtBQUssSUFBSSxHQUFHLEtBQUssTUFBTSxZQUFZLEtBQUssS0FBSyxDQUFDLENBQUM7QUFDdEUsWUFBTSxNQUFNLFNBQVMsR0FBRyxLQUFLLElBQUksR0FBRyxLQUFLLE1BQU0sYUFBYSxLQUFLLEtBQUssQ0FBQyxDQUFDO0FBQUEsSUFDMUU7QUFDQSxVQUFNLGlCQUFpQixRQUFRLE1BQU07QUFDbkMsWUFBTSxpQkFBaUIsS0FBSyxJQUFJLEtBQUssVUFBVSxjQUFjLEdBQUc7QUFDaEUsWUFBTSxrQkFBa0IsS0FBSyxJQUFJLEtBQUssVUFBVSxlQUFlLEdBQUc7QUFDbEUsWUFBTSxNQUFNLEtBQUssSUFBSSxHQUFHLGlCQUFpQixLQUFLLElBQUksR0FBRyxNQUFNLFlBQVksR0FBRyxrQkFBa0IsS0FBSyxJQUFJLEdBQUcsTUFBTSxhQUFhLENBQUM7QUFDNUgsa0JBQVksS0FBSyxJQUFJLEdBQUcsTUFBTSxlQUFlLEdBQUc7QUFDaEQsbUJBQWEsS0FBSyxJQUFJLEdBQUcsTUFBTSxnQkFBZ0IsR0FBRztBQUNsRCxpQkFBVztBQUFBLElBQ2IsQ0FBQztBQUNELFVBQU0sU0FBUyxDQUFDLE9BQWUsV0FBNkI7QUFDMUQsWUFBTSxLQUFLLFFBQVEsU0FBUyxVQUFVLEVBQUUsTUFBTSxPQUFPLE1BQU0sRUFBRSxNQUFNLFNBQVMsRUFBRSxDQUFDO0FBQy9FLFNBQUcsaUJBQWlCLFNBQVMsTUFBTTtBQUFBLElBQ3JDO0FBQ0EsV0FBTyxVQUFLLE1BQU07QUFBRSxXQUFLLFFBQVEsS0FBSyxJQUFJLEtBQUssS0FBSyxRQUFRLEdBQUc7QUFBRyxpQkFBVztBQUFBLElBQUcsQ0FBQztBQUNqRixXQUFPLFFBQVEsTUFBTTtBQUFFLFdBQUssUUFBUTtBQUFHLGlCQUFXO0FBQUEsSUFBRyxDQUFDO0FBQ3RELFdBQU8sS0FBSyxNQUFNO0FBQUUsV0FBSyxRQUFRLEtBQUssSUFBSSxHQUFHLEtBQUssUUFBUSxHQUFHO0FBQUcsaUJBQVc7QUFBQSxJQUFHLENBQUM7QUFDL0UsY0FBVSxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFDN0MsWUFBTSxlQUFlO0FBQ3JCLFdBQUssUUFBUSxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLFNBQVMsTUFBTSxTQUFTLElBQUksT0FBTyxNQUFNLENBQUM7QUFDdEYsaUJBQVc7QUFBQSxJQUNiLEdBQUcsRUFBRSxTQUFTLE1BQU0sQ0FBQztBQUNyQixVQUFNLGlCQUFpQixZQUFZLE1BQU07QUFBRSxXQUFLLFFBQVE7QUFBRyxpQkFBVztBQUFBLElBQUcsQ0FBQztBQUFBLEVBQzVFO0FBQ0Y7QUFFQSxJQUFNLHVCQUFOLGNBQW1DLHVCQUFNO0FBQUEsRUFJdkMsWUFDRSxLQUNpQixPQUNqQixZQUNpQixrQkFDakI7QUFDQSxVQUFNLEdBQUc7QUFKUTtBQUVBO0FBUG5CLFNBQVEsV0FBVztBQUNuQixTQUFpQixXQUFXLG9CQUFJLElBQVk7QUFTMUMsZUFBVyxRQUFRLENBQUMsT0FBTyxLQUFLLFNBQVMsSUFBSSxFQUFFLENBQUM7QUFBQSxFQUNsRDtBQUFBLEVBRUEsU0FBZTtBQUNiLFNBQUssUUFBUSxRQUFRLHNDQUFRO0FBQzdCLFNBQUssVUFBVSxTQUFTLHVCQUF1QjtBQUMvQyxTQUFLLFVBQVUsU0FBUyxLQUFLO0FBQUEsTUFDM0IsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUNELFVBQU0sT0FBTyxLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUssNkJBQTZCLENBQUM7QUFDM0UsZUFBVyxRQUFRLEtBQUssT0FBTztBQUM3QixZQUFNLFFBQVEsS0FBSyxTQUFTLFNBQVMsRUFBRSxLQUFLLDZCQUE2QixDQUFDO0FBQzFFLFlBQU0sV0FBVyxNQUFNLFNBQVMsU0FBUyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQzdELGVBQVMsVUFBVSxLQUFLLFNBQVMsSUFBSSxLQUFLLEVBQUU7QUFDNUMsZUFBUyxpQkFBaUIsVUFBVSxNQUFNO0FBQ3hDLFlBQUksU0FBUyxRQUFTLE1BQUssU0FBUyxJQUFJLEtBQUssRUFBRTtBQUFBLFlBQVEsTUFBSyxTQUFTLE9BQU8sS0FBSyxFQUFFO0FBQUEsTUFDckYsQ0FBQztBQUNELFlBQU0sV0FBVyxFQUFFLE1BQU0sS0FBSyxLQUFLLENBQUM7QUFBQSxJQUN0QztBQUNBLFVBQU0sVUFBVSxLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUsseUJBQXlCLENBQUM7QUFDMUUsVUFBTSxTQUFTLFFBQVEsU0FBUyxVQUFVLEVBQUUsTUFBTSxnQkFBTSxNQUFNLEVBQUUsTUFBTSxTQUFTLEVBQUUsQ0FBQztBQUNsRixXQUFPLGlCQUFpQixTQUFTLE1BQU0sS0FBSyxNQUFNLENBQUM7QUFDbkQsVUFBTSxVQUFVLFFBQVEsU0FBUyxVQUFVLEVBQUUsTUFBTSxnQkFBTSxLQUFLLFdBQVcsTUFBTSxFQUFFLE1BQU0sU0FBUyxFQUFFLENBQUM7QUFDbkcsWUFBUSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3RDLFVBQUksQ0FBQyxLQUFLLFNBQVMsTUFBTTtBQUN2QixZQUFJLHdCQUFPLHdEQUFXO0FBQ3RCO0FBQUEsTUFDRjtBQUNBLFdBQUssV0FBVztBQUNoQixXQUFLLGlCQUFpQixNQUFNLEtBQUssS0FBSyxRQUFRLENBQUM7QUFDL0MsV0FBSyxNQUFNO0FBQUEsSUFDYixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxRQUFJLENBQUMsS0FBSyxTQUFVLE1BQUssaUJBQWlCLElBQUk7QUFBQSxFQUNoRDtBQUNGO0FBRUEsU0FBUyxpQkFBaUIsS0FBVSxPQUEwQixZQUFnRDtBQUM1RyxNQUFJLENBQUMsTUFBTSxRQUFRO0FBQ2pCLFFBQUksd0JBQU8sc0lBQXdCO0FBQ25DLFdBQU8sUUFBUSxRQUFRLElBQUk7QUFBQSxFQUM3QjtBQUNBLFFBQU0sVUFBVSxJQUFJLElBQUksTUFBTSxJQUFJLENBQUMsU0FBUyxLQUFLLEVBQUUsQ0FBQztBQUNwRCxRQUFNLFVBQVUsV0FBVyxPQUFPLENBQUMsT0FBTyxRQUFRLElBQUksRUFBRSxDQUFDO0FBQ3pELFNBQU8sSUFBSSxRQUFRLENBQUMsWUFBWSxJQUFJLHFCQUFxQixLQUFLLE9BQU8sUUFBUSxTQUFTLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRyxFQUFFLEdBQUcsT0FBTyxFQUFFLEtBQUssQ0FBQztBQUNqSTtBQUVBLElBQU0sZ0JBQU4sY0FBNEIsdUJBQU07QUFBQSxFQVNoQyxZQUNFLEtBQ0EsTUFDQSxjQUNBLFdBQ0EsUUFDQTtBQUNBLFVBQU0sR0FBRztBQVhYLFNBQVEsY0FBbUM7QUFDM0MsU0FBUSxvQkFBb0I7QUFDNUIsU0FBUSx3QkFBZ0U7QUFVdEUsU0FBSyxPQUFPO0FBQ1osU0FBSyxlQUFlO0FBQ3BCLFNBQUssWUFBWTtBQUNqQixTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsU0FBZTtBQWhUakI7QUFpVEksU0FBSyxRQUFRLFFBQVEsc0NBQVE7QUFDN0IsU0FBSyxVQUFVLFNBQVMscUJBQXFCO0FBQzdDLFVBQU0sT0FBTyxLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUsscUJBQXFCLENBQUM7QUFDbkUsU0FBSyxTQUFTLEtBQUs7QUFBQSxNQUNqQixLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsUUFBSSxnQkFBdUMsS0FBSyxNQUFNLEtBQUssVUFBVSxrQkFBa0IsS0FBSyxJQUFJLENBQUMsQ0FBQztBQUNsRyxRQUFJLENBQUMsY0FBYyxPQUFRLGlCQUFnQixDQUFDLEVBQUUsSUFBSSxNQUFNLEdBQUcsTUFBTSxRQUFRLE1BQU0scUJBQU0sQ0FBQztBQUN0RixRQUFJLG1CQUErQixNQUFNO0FBRXpDLFVBQU0sWUFBWSxLQUFLLFVBQVUsRUFBRSxLQUFLLDRCQUE0QixDQUFDO0FBQ3JFLFVBQU0sV0FBVyxLQUFLLFVBQVUsRUFBRSxLQUFLLHlCQUF5QixDQUFDO0FBRWpFLFVBQU0sY0FBYyxNQUE2QixLQUFLLE1BQU0sS0FBSyxVQUFVLGFBQWEsQ0FBQztBQUN6RixVQUFNLGNBQWMsTUFBNkIsWUFBWSxFQUFFLE9BQU8sQ0FBQyxVQUFVLE1BQU0sU0FBUyxVQUFVLFFBQVEsTUFBTSxPQUFPLEtBQUssQ0FBQyxJQUFJLFFBQVEsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDO0FBRW5LLFVBQU0sa0JBQWtCLENBQUMsV0FBd0IsVUFBeUM7QUFDeEYsWUFBTSxVQUFVLFVBQVUsVUFBVSxFQUFFLEtBQUssd0JBQXdCLENBQUM7QUFDcEUsWUFBTSxTQUFTLFVBQVUsU0FBUyxZQUFZO0FBQUEsUUFDNUMsS0FBSztBQUFBLFFBQ0wsTUFBTSxFQUFFLE1BQU0sS0FBSyxZQUFZLFFBQVEsYUFBYSwySEFBdUI7QUFBQSxNQUM3RSxDQUFDO0FBQ0QsYUFBTyxRQUFRLE1BQU07QUFDckIsVUFBSSxhQUFhLE9BQU8sTUFBTTtBQUM5QixVQUFJLFdBQVcsT0FBTyxNQUFNO0FBQzVCLFlBQU0sWUFBWSxVQUFVLFVBQVUsRUFBRSxLQUFLLDRCQUE0QixDQUFDO0FBQzFFLGdCQUFVLFVBQVUsRUFBRSxLQUFLLDBCQUEwQixNQUFNLHVDQUFTLENBQUM7QUFDckUsWUFBTSxVQUFVLFVBQVUsVUFBVSxFQUFFLEtBQUssd0JBQXdCLENBQUM7QUFDcEUsWUFBTSxnQkFBZ0IsTUFBWTtBQUNoQywyQkFBbUIsU0FBUyxNQUFNLFVBQVUsTUFBTSxRQUFRLDBCQUFNO0FBQ2hFLGdCQUFRLFlBQVksa0JBQWtCLENBQUMsTUFBTSxJQUFJO0FBQUEsTUFDbkQ7QUFDQSxZQUFNLFdBQVcsTUFBWTtBQW5WbkMsWUFBQUMsS0FBQUM7QUFvVlEsc0JBQWFELE1BQUEsT0FBTyxtQkFBUCxPQUFBQSxNQUF5QjtBQUN0QyxvQkFBV0MsTUFBQSxPQUFPLGlCQUFQLE9BQUFBLE1BQXVCO0FBQ2xDLGNBQU0sT0FBTyxLQUFLLElBQUksWUFBWSxRQUFRO0FBQzFDLGNBQU0sS0FBSyxLQUFLLElBQUksWUFBWSxRQUFRO0FBQ3hDLGtCQUFVLFFBQVEsU0FBUyxLQUFLLGlDQUFRLE9BQU8sQ0FBQyxLQUFLLDRCQUFRLE9BQU8sQ0FBQyxTQUFJLEVBQUUscUJBQU07QUFBQSxNQUNuRjtBQUNBLFlBQU0sUUFBUSxNQUE2QztBQUN6RCxjQUFNLFFBQVEsS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLE1BQU0sS0FBSyxRQUFRLEtBQUssSUFBSSxZQUFZLFFBQVEsQ0FBQyxDQUFDO0FBQ3JGLGNBQU0sTUFBTSxLQUFLLElBQUksT0FBTyxLQUFLLElBQUksTUFBTSxLQUFLLFFBQVEsS0FBSyxJQUFJLFlBQVksUUFBUSxDQUFDLENBQUM7QUFDdkYsWUFBSSxVQUFVLEtBQUs7QUFDakIsY0FBSSx3QkFBTyxnRkFBZTtBQUMxQixpQkFBTyxNQUFNO0FBQ2IsaUJBQU87QUFBQSxRQUNUO0FBQ0EsZUFBTyxNQUFNO0FBQUcsZUFBTyxrQkFBa0IsT0FBTyxHQUFHO0FBQ25ELGVBQU8sRUFBRSxPQUFPLElBQUk7QUFBQSxNQUN0QjtBQUNBLFlBQU0sY0FBYyxDQUFDLE9BQWUsT0FBZSxRQUFvQixNQUFNLE9BQTBCO0FBQ3JHLGNBQU0sTUFBTSxRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssMkJBQTJCLEdBQUcsR0FBRyxLQUFLLEdBQUcsTUFBTSxPQUFPLE1BQU0sRUFBRSxNQUFNLFVBQVUsTUFBTSxFQUFFLENBQUM7QUFDckksWUFBSSxpQkFBaUIsYUFBYSxDQUFDLFVBQVUsTUFBTSxlQUFlLENBQUM7QUFDbkUsWUFBSSxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFBRSxnQkFBTSxlQUFlO0FBQUcsaUJBQU87QUFBQSxRQUFHLENBQUM7QUFDOUUsZUFBTztBQUFBLE1BQ1Q7QUFDQSxZQUFNLGVBQWUsQ0FBQyxRQUErQztBQUNuRSxjQUFNLFdBQVcsTUFBTTtBQUFHLFlBQUksQ0FBQyxTQUFVO0FBQ3pDLGNBQU0sU0FBUyx3QkFBd0IsTUFBTSxVQUFVLE1BQU0sSUFBSTtBQUNqRSxjQUFNLFVBQVUsT0FBTyxNQUFNLFNBQVMsT0FBTyxTQUFTLEdBQUcsRUFBRSxNQUFNLENBQUMsVUFBVSxNQUFNLEdBQUcsTUFBTSxJQUFJO0FBQy9GLGNBQU0sV0FBVyx3QkFBd0IsTUFBTSxNQUFNLE1BQU0sVUFBVSxTQUFTLE9BQU8sU0FBUyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDdEgsc0JBQWM7QUFBRyx5QkFBaUI7QUFBRyxlQUFPLGtCQUFrQixTQUFTLE9BQU8sU0FBUyxHQUFHO0FBQUcsaUJBQVM7QUFBQSxNQUN4RztBQUNBLGtCQUFZLEtBQUssd0NBQVUsTUFBTSxhQUFhLE1BQU0sR0FBRyxTQUFTO0FBQ2hFLGtCQUFZLEtBQUssd0NBQVUsTUFBTSxhQUFhLFFBQVEsR0FBRyxXQUFXO0FBQ3BFLGtCQUFZLEtBQUssMERBQWEsTUFBTSxhQUFhLFdBQVcsR0FBRyxjQUFjO0FBQzdFLFlBQU0sYUFBYSxRQUFRLFNBQVMsU0FBUyxFQUFFLEtBQUsseUJBQXlCLE1BQU0sRUFBRSxPQUFPLG1EQUFXLEVBQUUsQ0FBQztBQUMxRyxpQkFBVyxXQUFXLEVBQUUsTUFBTSxlQUFLLENBQUM7QUFDcEMsWUFBTSxZQUFZLFdBQVcsV0FBVyxFQUFFLEtBQUssc0JBQXNCLENBQUM7QUFDdEUsWUFBTSxRQUFRLFdBQVcsU0FBUyxTQUFTLEVBQUUsTUFBTSxTQUFTLE1BQU0sRUFBRSxjQUFjLDJCQUFPLEVBQUUsQ0FBQztBQUM1RixZQUFNLFFBQVE7QUFDZCxnQkFBVSxNQUFNLGtCQUFrQixNQUFNO0FBQ3hDLFlBQU0saUJBQWlCLFNBQVMsTUFBTTtBQUFFLGtCQUFVLE1BQU0sa0JBQWtCLE1BQU07QUFBQSxNQUFPLENBQUM7QUFDeEYsWUFBTSxpQkFBaUIsVUFBVSxNQUFNO0FBQ3JDLGNBQU0sV0FBVyxNQUFNO0FBQUcsWUFBSSxDQUFDLFNBQVU7QUFDekMsY0FBTSxXQUFXLHdCQUF3QixNQUFNLE1BQU0sTUFBTSxVQUFVLFNBQVMsT0FBTyxTQUFTLEtBQUssRUFBRSxPQUFPLE1BQU0sTUFBTSxDQUFDO0FBQ3pILHNCQUFjO0FBQUcseUJBQWlCO0FBQUEsTUFDcEMsQ0FBQztBQUNELGtCQUFZLDRCQUFRLG9EQUFZLE1BQU07QUFDcEMsY0FBTSxXQUFXLE1BQU07QUFBRyxZQUFJLENBQUMsU0FBVTtBQUN6QyxjQUFNLFdBQVcsd0JBQXdCLE1BQU0sTUFBTSxNQUFNLFVBQVUsU0FBUyxPQUFPLFNBQVMsS0FBSyxJQUFJO0FBQ3ZHLHNCQUFjO0FBQUcseUJBQWlCO0FBQUEsTUFDcEMsR0FBRyxTQUFTO0FBQ1osYUFBTyxpQkFBaUIsVUFBVSxRQUFRO0FBQzFDLGFBQU8saUJBQWlCLFNBQVMsUUFBUTtBQUN6QyxhQUFPLGlCQUFpQixXQUFXLFFBQVE7QUFDM0MsYUFBTyxpQkFBaUIsU0FBUyxNQUFNO0FBQ3JDLGNBQU0sT0FBTyxPQUFPLE1BQU0sUUFBUSxVQUFVLEdBQUc7QUFDL0MsY0FBTSxXQUFXLDJCQUEyQixNQUFNLE1BQU0sTUFBTSxVQUFVLElBQUk7QUFDNUUsY0FBTSxPQUFPO0FBQ2IsZUFBTyxRQUFRO0FBQ2YsaUJBQVM7QUFBRyxzQkFBYztBQUFHLHlCQUFpQjtBQUFBLE1BQ2hELENBQUM7QUFDRCxvQkFBYztBQUFHLGVBQVM7QUFBQSxJQUM1QjtBQUVBLFVBQU0sY0FBYyxDQUFDLE9BQWlDLE1BQTBCLFlBQThCO0FBQzVHLFlBQU0sWUFBWTtBQUNoQixZQUFJLFVBQW9CLENBQUM7QUFDekIsWUFBSSxTQUFTLFVBQVU7QUFDckIsZ0JBQU0sU0FBUyxNQUFNLGlCQUFpQixLQUFLLEtBQUssS0FBSyxVQUFVLGNBQWMsR0FBRyxLQUFLLFVBQVUsd0JBQXdCLENBQUM7QUFDeEgsY0FBSSxDQUFDLE9BQVE7QUFDYixvQkFBVTtBQUFBLFFBQ1o7QUFDQSxjQUFNLE9BQU8sTUFBTSxJQUFJLFFBQXFCLENBQUMsWUFBWTtBQUN2RCxnQkFBTSxRQUFRLFNBQVMsY0FBYyxPQUFPO0FBQzVDLGdCQUFNLE9BQU87QUFDYixnQkFBTSxTQUFTO0FBQ2YsZ0JBQU0saUJBQWlCLFVBQVUsTUFBRztBQS9aOUMsZ0JBQUFELEtBQUFDO0FBK1ppRCw0QkFBUUEsT0FBQUQsTUFBQSxNQUFNLFVBQU4sZ0JBQUFBLElBQWMsT0FBZCxPQUFBQyxNQUFvQixJQUFJO0FBQUEsYUFBRyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQ3hGLGdCQUFNLE1BQU07QUFBQSxRQUNkLENBQUM7QUFDRCxZQUFJLENBQUMsS0FBTTtBQUNYLFlBQUksU0FBUyxTQUFTO0FBQ3BCLGdCQUFNLE9BQU8sTUFBTSxLQUFLLFVBQVUsa0JBQWtCLE1BQU0sS0FBSyxJQUFJO0FBQ25FLGdCQUFNLFNBQVM7QUFDZixnQkFBTSxjQUFjO0FBQ3BCLGdCQUFNLGdCQUFnQjtBQUFBLFFBQ3hCLE9BQU87QUFDTCxnQkFBTSxRQUFRLE1BQU0sS0FBSyxVQUFVLGNBQWMsTUFBTSxLQUFLLE1BQU0sT0FBTztBQUN6RSxjQUFJLENBQUMsTUFBTSxVQUFVLFFBQVE7QUFDM0Isa0JBQU0sVUFBVSxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLFFBQVEsU0FBSSxLQUFLLEtBQUssRUFBRSxFQUFFLEtBQUssUUFBRyxLQUFLO0FBQzVGLGtCQUFNLElBQUksTUFBTSxPQUFPO0FBQUEsVUFDekI7QUFDQSxnQkFBTSxjQUFhLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQzFDLGdCQUFNLFNBQVMsTUFBTSxVQUFVLENBQUMsRUFBRztBQUNuQyxnQkFBTSxjQUFjO0FBQ3BCLGdCQUFNLGdCQUFnQixNQUFNLFVBQVUsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLE1BQU0sV0FBVyxFQUFFO0FBQzdFLGNBQUksTUFBTSxTQUFTLFFBQVE7QUFDekIsZ0JBQUksd0JBQU8seURBQVksTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLEtBQUssUUFBRyxDQUFDLElBQUksR0FBSTtBQUFBLFVBQ3RGLE9BQU87QUFDTCxnQkFBSSx3QkFBTyxpQ0FBUSxNQUFNLFVBQVUsSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUUsS0FBSyxRQUFHLENBQUMsRUFBRTtBQUFBLFVBQzdFO0FBQUEsUUFDRjtBQUNBLFlBQUksQ0FBQyxNQUFNLElBQUssT0FBTSxNQUFNLEtBQUssS0FBSyxRQUFRLFlBQVksRUFBRTtBQUM1RCxnQkFBUTtBQUNSLHlCQUFpQjtBQUFBLE1BQ25CLEdBQUcsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNwQixnQkFBUSxNQUFNLHlDQUF5QyxLQUFLO0FBQzVELFlBQUksd0JBQU8sR0FBRyxTQUFTLFdBQVcsNkJBQVMsMEJBQU0scUJBQU0saUJBQWlCLFFBQVEsTUFBTSxVQUFVLE9BQU8sS0FBSyxDQUFDLElBQUksR0FBSTtBQUFBLE1BQ3ZILENBQUM7QUFBQSxJQUNIO0FBRUEsVUFBTSxzQkFBc0IsQ0FBQyxPQUFpQyxZQUE4QjtBQUMxRixZQUFNLFlBQVk7QUFsY3hCLFlBQUFEO0FBbWNRLGNBQU0sU0FBUyxNQUFNLGlCQUFpQixLQUFLLEtBQUssS0FBSyxVQUFVLGNBQWMsR0FBRyxLQUFLLFVBQVUsd0JBQXdCLENBQUM7QUFDeEgsWUFBSSxDQUFDLE9BQVE7QUFDYixjQUFNLGlCQUFpQixNQUFNLGVBQWUsTUFBTTtBQUNsRCxjQUFNLFFBQVEsTUFBTSxLQUFLLFVBQVUsa0JBQWtCLGNBQWM7QUFDbkUsWUFBSSxDQUFDLE9BQU87QUFDVixjQUFJLHdCQUFPLDRMQUFpQztBQUM1QztBQUFBLFFBQ0Y7QUFDQSxjQUFNLFFBQVEsTUFBTSxLQUFLLFVBQVUsY0FBYyxNQUFNLE1BQU0sTUFBTSxlQUFlLE1BQU07QUFDeEYsWUFBSSxDQUFDLE1BQU0sVUFBVSxRQUFRO0FBQzNCLGdCQUFNLElBQUksTUFBTSxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLFFBQVEsU0FBSSxLQUFLLEtBQUssRUFBRSxFQUFFLEtBQUssUUFBRyxLQUFLLDBCQUFNO0FBQUEsUUFDcEc7QUFDQSxjQUFNLGNBQWEsb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFDMUMsY0FBTSxXQUFXLElBQUksTUFBS0EsTUFBQSxNQUFNLGtCQUFOLE9BQUFBLE1BQXVCLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssUUFBUSxJQUFJLENBQUMsQ0FBQztBQUN2RixjQUFNLFVBQVUsUUFBUSxDQUFDLFNBQVMsU0FBUyxJQUFJLEtBQUssUUFBUSxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQUMsQ0FBQztBQUNwRixjQUFNLGdCQUFnQixNQUFNLEtBQUssU0FBUyxPQUFPLENBQUM7QUFDbEQsY0FBTSxjQUFjO0FBQ3BCLFlBQUksQ0FBQyxNQUFNLFNBQVMsT0FBUSxPQUFNLFNBQVMsTUFBTSxVQUFVLENBQUMsRUFBRztBQUMvRCxnQkFBUTtBQUNSLHlCQUFpQjtBQUNqQixZQUFJLE1BQU0sU0FBUyxRQUFRO0FBQ3pCLGNBQUksd0JBQU8seUdBQW9CLE1BQU0sU0FBUyxJQUFJLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRSxLQUFLLFFBQUcsQ0FBQyxJQUFJLEdBQUk7QUFBQSxRQUM5RixPQUFPO0FBQ0wsY0FBSSx3QkFBTyx5REFBWSxNQUFNLFVBQVUsSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUUsS0FBSyxRQUFHLENBQUMsRUFBRTtBQUFBLFFBQ2pGO0FBQUEsTUFDRixHQUFHLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDcEIsZ0JBQVEsTUFBTSwrQ0FBK0MsS0FBSztBQUNsRSxZQUFJLHdCQUFPLHlEQUFZLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUssQ0FBQyxJQUFJLEdBQUk7QUFBQSxNQUN2RixDQUFDO0FBQUEsSUFDSDtBQUVBLFVBQU0sZUFBZSxNQUFZO0FBQy9CLGVBQVMsTUFBTTtBQUNmLG9CQUFjLFFBQVEsQ0FBQyxPQUFPLFVBQVU7QUFwZTlDLFlBQUFBO0FBcWVRLGNBQU0sT0FBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLHdCQUF3QixNQUFNLElBQUksR0FBRyxDQUFDO0FBQzdFLGNBQU0sU0FBUyxLQUFLLFVBQVUsRUFBRSxLQUFLLDJCQUEyQixDQUFDO0FBQ2pFLGVBQU8sV0FBVyxFQUFFLEtBQUssMkJBQTJCLE1BQU0sTUFBTSxTQUFTLFNBQVMsc0JBQU8sUUFBUSxDQUFDLEtBQUssc0JBQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQztBQUMzSCxjQUFNLFdBQVcsT0FBTyxVQUFVLEVBQUUsS0FBSyw2QkFBNkIsQ0FBQztBQUN2RSxjQUFNLFVBQVUsQ0FBQyxNQUFjLE9BQWUsUUFBb0IsV0FBVyxVQUFnQjtBQUMzRixnQkFBTSxNQUFNLFNBQVMsU0FBUyxVQUFVLEVBQUUsS0FBSyxrQkFBa0IsTUFBTSxFQUFFLE1BQU0sVUFBVSxPQUFPLGNBQWMsTUFBTSxFQUFFLENBQUM7QUFDdkgsd0NBQVEsS0FBSyxJQUFJO0FBQUcsY0FBSSxXQUFXO0FBQ25DLGNBQUksaUJBQWlCLFNBQVMsQ0FBQyxVQUFVO0FBQUUsa0JBQU0sZUFBZTtBQUFHLG1CQUFPO0FBQUEsVUFBRyxDQUFDO0FBQUEsUUFDaEY7QUFDQSxnQkFBUSxZQUFZLGdCQUFNLE1BQU07QUFBRSxXQUFDLGNBQWMsUUFBUSxDQUFDLEdBQUcsY0FBYyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxHQUFJLGNBQWMsUUFBUSxDQUFDLENBQUU7QUFBRyx1QkFBYTtBQUFHLDJCQUFpQjtBQUFBLFFBQUcsR0FBRyxVQUFVLENBQUM7QUFDM0wsZ0JBQVEsY0FBYyxnQkFBTSxNQUFNO0FBQUUsV0FBQyxjQUFjLFFBQVEsQ0FBQyxHQUFHLGNBQWMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEtBQUssR0FBSSxjQUFjLFFBQVEsQ0FBQyxDQUFFO0FBQUcsdUJBQWE7QUFBRywyQkFBaUI7QUFBQSxRQUFHLEdBQUcsVUFBVSxjQUFjLFNBQVMsQ0FBQztBQUNwTixnQkFBUSxXQUFXLGtDQUFTLE1BQU07QUFBRSx3QkFBYyxPQUFPLE9BQU8sQ0FBQztBQUFHLHVCQUFhO0FBQUcsMkJBQWlCO0FBQUEsUUFBRyxDQUFDO0FBQ3pHLFlBQUksTUFBTSxTQUFTLFFBQVE7QUFDekIsMEJBQWdCLEtBQUssVUFBVSxFQUFFLEtBQUsseUJBQXlCLENBQUMsR0FBRyxLQUFLO0FBQUEsUUFDMUUsT0FBTztBQUNMLGdCQUFNLE9BQU8sS0FBSyxVQUFVLEVBQUUsS0FBSyxnREFBZ0QsQ0FBQztBQUNwRixnQkFBTSxVQUFVLEtBQUssVUFBVSxFQUFFLEtBQUssMEJBQTBCLENBQUM7QUFDakUsZ0JBQU0sVUFBVSxNQUFZO0FBdGZ0QyxnQkFBQUE7QUF1Zlksb0JBQVEsTUFBTTtBQUNkLGtCQUFNLFdBQVcsS0FBSyxVQUFVLGFBQWEsTUFBTSxNQUFNO0FBQ3pELGdCQUFJLFVBQVU7QUFDWixvQkFBTSxNQUFNLFFBQVEsU0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssVUFBVSxLQUFLLE1BQU0sT0FBTyxlQUFLLEVBQUUsQ0FBQztBQUN2RixrQkFBSSxpQkFBaUIsU0FBUyxNQUFNLElBQUksa0JBQWtCLEtBQUssS0FBSyxVQUFVLE1BQU0sT0FBTyxjQUFJLEVBQUUsS0FBSyxDQUFDO0FBQUEsWUFDekcsTUFBTyxTQUFRLFVBQVUsRUFBRSxLQUFLLHlCQUF5QixNQUFNLE1BQU0sU0FBUyx5Q0FBVyx1Q0FBUyxDQUFDO0FBQ25HLG1CQUFPLFFBQVEsTUFBTTtBQUNyQixnQkFBSSxTQUFRQSxNQUFBLE1BQU0sUUFBTixPQUFBQSxNQUFhO0FBQUEsVUFDM0I7QUFDQSxnQkFBTSxjQUFjLEtBQUssU0FBUyxTQUFTLEVBQUUsTUFBTSw2Q0FBVSxDQUFDO0FBQzlELGdCQUFNLFNBQVMsWUFBWSxTQUFTLFNBQVMsRUFBRSxNQUFNLFFBQVEsTUFBTSxFQUFFLGFBQWEsb0VBQTRCLEVBQUUsQ0FBQztBQUNqSCxnQkFBTSxXQUFXLEtBQUssU0FBUyxTQUFTLEVBQUUsTUFBTSxtREFBVyxDQUFDO0FBQzVELGdCQUFNLE1BQU0sU0FBUyxTQUFTLFNBQVMsRUFBRSxNQUFNLFFBQVEsTUFBTSxFQUFFLGFBQWEsMkJBQU8sRUFBRSxDQUFDO0FBQ3RGLGlCQUFPLGlCQUFpQixTQUFTLE1BQU07QUFDckMsa0JBQU0sT0FBTyxPQUFPLE1BQU0sS0FBSztBQUMvQixnQkFBSSxTQUFTLE1BQU0sUUFBUTtBQUN6QixvQkFBTSxTQUFTO0FBQ2Ysb0JBQU0sY0FBYztBQUNwQixvQkFBTSxnQkFBZ0I7QUFBQSxZQUN4QjtBQUNBLG9CQUFRO0FBQ1IsNkJBQWlCO0FBQUEsVUFDbkIsQ0FBQztBQUNELGNBQUksaUJBQWlCLFNBQVMsTUFBTTtBQUFFLGtCQUFNLE1BQU0sSUFBSSxNQUFNLEtBQUssS0FBSztBQUFXLDZCQUFpQjtBQUFBLFVBQUcsQ0FBQztBQUN0RyxnQkFBTSxVQUFVLEtBQUssVUFBVSxFQUFFLEtBQUssMEJBQTBCLENBQUM7QUFDakUsZ0JBQU0sUUFBUSxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sa0NBQVMsTUFBTSxFQUFFLE1BQU0sU0FBUyxFQUFFLENBQUM7QUFDcEYsZ0JBQU0saUJBQWlCLFNBQVMsTUFBTSxZQUFZLE9BQU8sU0FBUyxPQUFPLENBQUM7QUFDMUUsZ0JBQU0sU0FBUyxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sOENBQVcsTUFBTSxFQUFFLE1BQU0sU0FBUyxFQUFFLENBQUM7QUFDdkYsaUJBQU8saUJBQWlCLFNBQVMsTUFBTSxZQUFZLE9BQU8sVUFBVSxPQUFPLENBQUM7QUFDNUUsY0FBSSxNQUFNLGVBQWdCLE1BQU0sVUFBVSxDQUFDLGdCQUFnQixLQUFLLE1BQU0sTUFBTSxHQUFJO0FBQzlFLGtCQUFNLGdCQUFnQixRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sd0NBQVUsTUFBTSxFQUFFLE1BQU0sU0FBUyxFQUFFLENBQUM7QUFDN0YsMEJBQWMsaUJBQWlCLFNBQVMsTUFBTSxvQkFBb0IsT0FBTyxPQUFPLENBQUM7QUFBQSxVQUNuRjtBQUNBLGVBQUlBLE1BQUEsTUFBTSxrQkFBTixnQkFBQUEsSUFBcUIsUUFBUTtBQUMvQixrQkFBTSxVQUFVLEtBQUssVUFBVSxFQUFFLEtBQUssb0JBQW9CLENBQUM7QUFDM0Qsb0JBQVEsV0FBVyxFQUFFLEtBQUssMkJBQTJCLE1BQU0saUNBQVEsQ0FBQztBQUNwRSxrQkFBTSxjQUFjLFFBQVEsQ0FBQyxNQUFNLGdCQUFnQjtBQUNqRCxvQkFBTSxPQUFPLFFBQVEsU0FBUyxLQUFLO0FBQUEsZ0JBQ2pDLE1BQU0sS0FBSyxZQUFZLGdCQUFNLGNBQWMsQ0FBQztBQUFBLGdCQUM1QyxNQUFNLEtBQUs7QUFBQSxnQkFDWCxNQUFNLEVBQUUsUUFBUSxVQUFVLEtBQUssV0FBVztBQUFBLGNBQzVDLENBQUM7QUFDRCxtQkFBSyxpQkFBaUIsU0FBUyxDQUFDLFVBQVUsTUFBTSxnQkFBZ0IsQ0FBQztBQUFBLFlBQ25FLENBQUM7QUFBQSxVQUNIO0FBQ0Esa0JBQVE7QUFBQSxRQUNWO0FBQUEsTUFDRixDQUFDO0FBQ0QsVUFBSSxDQUFDLGNBQWMsT0FBUSxVQUFTLFVBQVUsRUFBRSxLQUFLLDBCQUEwQixNQUFNLHlHQUFvQixDQUFDO0FBQUEsSUFDNUc7QUFFQSxVQUFNLFVBQVUsVUFBVSxTQUFTLFVBQVUsRUFBRSxNQUFNLGtCQUFRLE1BQU0sRUFBRSxNQUFNLFNBQVMsRUFBRSxDQUFDO0FBQ3ZGLFlBQVEsaUJBQWlCLFNBQVMsTUFBTTtBQUFFLG9CQUFjLEtBQUssRUFBRSxJQUFJLE1BQU0sR0FBRyxNQUFNLFFBQVEsTUFBTSxHQUFHLENBQUM7QUFBRyxtQkFBYTtBQUFHLHVCQUFpQjtBQUFBLElBQUcsQ0FBQztBQUM1SSxVQUFNLFdBQVcsVUFBVSxTQUFTLFVBQVUsRUFBRSxNQUFNLGtCQUFRLE1BQU0sRUFBRSxNQUFNLFNBQVMsRUFBRSxDQUFDO0FBQ3hGLGFBQVMsaUJBQWlCLFNBQVMsTUFBTTtBQUFFLG9CQUFjLEtBQUssRUFBRSxJQUFJLE1BQU0sR0FBRyxNQUFNLFNBQVMsUUFBUSxHQUFHLENBQUM7QUFBRyxtQkFBYTtBQUFHLHVCQUFpQjtBQUFBLElBQUcsQ0FBQztBQUNoSixpQkFBYTtBQUViLFVBQU0sY0FBYyxLQUFLLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQzNELFVBQU0sWUFBWSxZQUFZLFNBQVMsU0FBUyxFQUFFLE1BQU0sMkJBQVksQ0FBQztBQUNyRSxVQUFNLFlBQVksVUFBVSxTQUFTLFNBQVMsRUFBRSxNQUFNLFFBQVEsTUFBTSxFQUFFLGFBQWEseUJBQVEsRUFBRSxDQUFDO0FBQzlGLGNBQVUsU0FBUSxVQUFLLEtBQUssU0FBVixZQUFrQjtBQUNwQyxVQUFNLFlBQVksWUFBWSxTQUFTLFNBQVMsRUFBRSxNQUFNLDJCQUFPLENBQUM7QUFDaEUsVUFBTSxhQUFhLFVBQVUsU0FBUyxRQUFRO0FBQzlDLGVBQVcsQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLENBQUMsSUFBSSxRQUFHLEdBQUcsQ0FBQyxRQUFRLGNBQUksR0FBRyxDQUFDLFNBQVMsb0JBQUssR0FBRyxDQUFDLFFBQVEsb0JBQUssQ0FBQyxFQUFZLFlBQVcsU0FBUyxVQUFVLEVBQUUsTUFBTSxPQUFPLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUNwSyxlQUFXLFNBQVEsVUFBSyxLQUFLLFNBQVYsWUFBa0I7QUFDckMsVUFBTSxhQUFhLFlBQVksU0FBUyxTQUFTLEVBQUUsTUFBTSwyQkFBTyxDQUFDO0FBQ2pFLFVBQU0sY0FBYyxXQUFXLFNBQVMsUUFBUTtBQUNoRCxlQUFXLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLFdBQVcsY0FBSSxHQUFHLENBQUMsUUFBUSxjQUFJLEdBQUcsQ0FBQyxhQUFhLGNBQUksQ0FBQyxFQUFZLGFBQVksU0FBUyxVQUFVLEVBQUUsTUFBTSxPQUFPLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUMvSixnQkFBWSxTQUFRLGdCQUFLLEtBQUssVUFBVixtQkFBaUIsVUFBakIsWUFBMEIsS0FBSztBQUNuRCxVQUFNLFlBQVksWUFBWSxTQUFTLFNBQVMsRUFBRSxNQUFNLG1EQUFXLENBQUM7QUFDcEUsVUFBTSxZQUFZLFVBQVUsU0FBUyxTQUFTLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFDOUQsY0FBVSxTQUFRLGdCQUFLLEtBQUssU0FBVixtQkFBZ0IsS0FBSyxVQUFyQixZQUE4QjtBQUVoRCxVQUFNLFlBQVksS0FBSyxVQUFVLEVBQUUsS0FBSywrQkFBK0IsQ0FBQztBQUN4RSxVQUFNLGVBQWUsQ0FBQyxXQUFtQixTQUE2QixhQUEyRDtBQUMvSCxZQUFNLFFBQVEsVUFBVSxTQUFTLFNBQVMsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUM3RCxZQUFNLE1BQU0sTUFBTSxVQUFVLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQztBQUNwRCxZQUFNLFNBQVMsSUFBSSxTQUFTLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUN6RCxZQUFNLFFBQVEsSUFBSSxTQUFTLFNBQVMsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNyRCxhQUFPLFVBQVUsUUFBUSxPQUFPO0FBQUcsWUFBTSxRQUFRLDRCQUFXO0FBQVUsWUFBTSxXQUFXLENBQUMsT0FBTztBQUMvRixhQUFPLGlCQUFpQixVQUFVLE1BQU07QUFBRSxjQUFNLFdBQVcsQ0FBQyxPQUFPO0FBQVMseUJBQWlCO0FBQUEsTUFBRyxDQUFDO0FBQ2pHLFlBQU0saUJBQWlCLFVBQVUsZ0JBQWdCO0FBQ2pELGFBQU8sQ0FBQyxRQUFRLEtBQUs7QUFBQSxJQUN2QjtBQUNBLFVBQU0sQ0FBQyxhQUFhLFVBQVUsSUFBSSxhQUFhLDZCQUFRLFVBQUssS0FBSyxVQUFWLG1CQUFpQixPQUFPLFNBQVM7QUFDeEYsVUFBTSxDQUFDLGlCQUFpQixjQUFjLElBQUksYUFBYSwrQ0FBVyxVQUFLLEtBQUssVUFBVixtQkFBaUIsV0FBVyxTQUFTO0FBQ3ZHLFVBQU0sQ0FBQyxtQkFBbUIsZ0JBQWdCLElBQUksYUFBYSw2QkFBUSxVQUFLLEtBQUssVUFBVixtQkFBaUIsYUFBYSxTQUFTO0FBQzFHLFVBQU0sZ0JBQWdCLENBQUMsV0FBbUIsU0FBNkIsS0FBYSxLQUFhLFNBQW1DO0FBOWtCeEksVUFBQUE7QUEra0JNLFlBQU0sUUFBUSxVQUFVLFNBQVMsU0FBUyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQzdELFlBQU0sUUFBUSxNQUFNLFNBQVMsU0FBUyxFQUFFLE1BQU0sVUFBVSxNQUFNLEVBQUUsS0FBSyxPQUFPLEdBQUcsR0FBRyxLQUFLLE9BQU8sR0FBRyxHQUFHLE1BQU0sT0FBTyxJQUFJLEdBQUcsYUFBYSwyQkFBTyxFQUFFLENBQUM7QUFDL0ksWUFBTSxTQUFRQSxNQUFBLG1DQUFTLGVBQVQsT0FBQUEsTUFBdUI7QUFBSSxhQUFPO0FBQUEsSUFDbEQ7QUFDQSxVQUFNLG1CQUFtQixjQUFjLDZCQUFRLFVBQUssS0FBSyxVQUFWLG1CQUFpQixhQUFhLEdBQUcsR0FBRyxHQUFFO0FBQ3JGLFVBQU0sZ0JBQWdCLGNBQWMsaUJBQU0sVUFBSyxLQUFLLFVBQVYsbUJBQWlCLFVBQVUsSUFBSSxJQUFJLENBQUM7QUFDOUUsVUFBTSxpQkFBaUIsQ0FBQyxXQUFtQixZQUFvRDtBQUM3RixZQUFNLFFBQVEsVUFBVSxTQUFTLFNBQVMsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUM3RCxZQUFNLFNBQVMsTUFBTSxTQUFTLFFBQVE7QUFDdEMsYUFBTyxTQUFTLFVBQVUsRUFBRSxNQUFNLDRCQUFRLE1BQU0sRUFBRSxPQUFPLFVBQVUsRUFBRSxDQUFDO0FBQ3RFLGFBQU8sU0FBUyxVQUFVLEVBQUUsTUFBTSxnQkFBTSxNQUFNLEVBQUUsT0FBTyxPQUFPLEVBQUUsQ0FBQztBQUNqRSxhQUFPLFNBQVMsVUFBVSxFQUFFLE1BQU0sZ0JBQU0sTUFBTSxFQUFFLE9BQU8sUUFBUSxFQUFFLENBQUM7QUFDbEUsYUFBTyxRQUFRLFlBQVksU0FBWSxZQUFZLFVBQVUsU0FBUztBQUFTLGFBQU87QUFBQSxJQUN4RjtBQUNBLFVBQU0sWUFBWSxlQUFlLG1DQUFTLFVBQUssS0FBSyxVQUFWLG1CQUFpQixJQUFJO0FBQy9ELFVBQU0sY0FBYyxlQUFlLG1DQUFTLFVBQUssS0FBSyxVQUFWLG1CQUFpQixNQUFNO0FBQ25FLFVBQU0saUJBQWlCLGVBQWUseUNBQVUsVUFBSyxLQUFLLFVBQVYsbUJBQWlCLFNBQVM7QUFFMUUsVUFBTSxZQUFZLEtBQUssU0FBUyxTQUFTLEVBQUUsTUFBTSx1Q0FBUyxDQUFDO0FBQzNELFVBQU0sWUFBWSxVQUFVLFNBQVMsVUFBVTtBQUFHLGNBQVUsU0FBUSxVQUFLLEtBQUssU0FBVixZQUFrQjtBQUFJLGNBQVUsT0FBTztBQUMzRyxVQUFNLFlBQVksS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLHNGQUFxQixDQUFDO0FBQ3ZFLFVBQU0sWUFBWSxVQUFVLFNBQVMsU0FBUyxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBQUcsY0FBVSxTQUFRLFVBQUssS0FBSyxTQUFWLFlBQWtCO0FBRXJHLFVBQU0sWUFBWSxDQUFDLFVBQXVDLFVBQVUsU0FBUyxPQUFPLFVBQVUsVUFBVSxRQUFRO0FBQ2hILFVBQU0sY0FBYyxDQUFDLE9BQWUsS0FBYSxRQUFvQyxNQUFNLEtBQUssS0FBSyxPQUFPLFNBQVMsT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksS0FBSyxPQUFPLEtBQUssQ0FBQyxDQUFDLElBQUk7QUFDcEwsVUFBTSxnQkFBZ0IsQ0FBQyxlQUErQztBQUNwRSxZQUFNLFVBQVUsWUFBWTtBQUM1QixVQUFJLENBQUMsUUFBUSxRQUFRO0FBQUUsWUFBSSxXQUFZLEtBQUksd0JBQU8sNEZBQWlCO0FBQUcsZUFBTztBQUFBLE1BQU07QUFDbkYsWUFBTSxPQUFPLFdBQVc7QUFDeEIsWUFBTSxRQUFRLFlBQVk7QUFDMUIsYUFBTztBQUFBLFFBQ0w7QUFBQSxRQUNBLE1BQU0sVUFBVSxNQUFNLEtBQUs7QUFBQSxRQUFHLE1BQU0sVUFBVSxNQUFNLEtBQUs7QUFBQSxRQUFHLE1BQU0sVUFBVSxNQUFNLEtBQUssRUFBRSxNQUFNLEdBQUcsRUFBRTtBQUFBLFFBQ3BHLE1BQU0sTUFBTSxLQUFLLElBQUksSUFBSSxVQUFVLE1BQU0sTUFBTSxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxLQUFLLEVBQUUsUUFBUSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE9BQU8sT0FBTyxDQUFDLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRTtBQUFBLFFBQy9ILE1BQU0sU0FBUyxVQUFVLFNBQVMsV0FBVyxTQUFTLFNBQVMsT0FBTztBQUFBLFFBQ3RFLE9BQU8sWUFBWSxVQUFVLFdBQVcsUUFBUTtBQUFBLFFBQ2hELFdBQVcsZ0JBQWdCLFVBQVUsZUFBZSxRQUFRO0FBQUEsUUFDNUQsYUFBYSxrQkFBa0IsVUFBVSxpQkFBaUIsUUFBUTtBQUFBLFFBQ2xFLGFBQWEsWUFBWSxpQkFBaUIsT0FBTyxHQUFHLENBQUM7QUFBQSxRQUNyRCxPQUFPLFVBQVUsVUFBVSxVQUFVLGVBQWUsVUFBVSxZQUFZLFFBQVE7QUFBQSxRQUNsRixNQUFNLFVBQVUsVUFBVSxLQUFLO0FBQUEsUUFBRyxRQUFRLFVBQVUsWUFBWSxLQUFLO0FBQUEsUUFBRyxXQUFXLFVBQVUsZUFBZSxLQUFLO0FBQUEsUUFDakgsVUFBVSxZQUFZLGNBQWMsT0FBTyxJQUFJLEVBQUU7QUFBQSxNQUNuRDtBQUFBLElBQ0Y7QUFFQSxRQUFJLFFBQXVCO0FBQzNCLFFBQUksT0FBTyxLQUFLLFVBQVUsY0FBYyxLQUFLLENBQUM7QUFDOUMsVUFBTSxVQUFVLENBQUMsTUFBNkIsYUFBYSxVQUFtQjtBQUM1RSxVQUFJLFVBQVUsTUFBTTtBQUFFLGVBQU8sYUFBYSxLQUFLO0FBQUcsZ0JBQVE7QUFBQSxNQUFNO0FBQ2hFLFlBQU0sU0FBUyxjQUFjLFVBQVU7QUFBRyxVQUFJLENBQUMsT0FBUSxRQUFPO0FBQzlELFlBQU0sWUFBWSxLQUFLLFVBQVUsTUFBTTtBQUN2QyxVQUFJLGNBQWMsTUFBTTtBQUFFLGFBQUssT0FBTyxRQUFRLElBQUk7QUFBRyxlQUFPO0FBQUEsTUFBVztBQUN2RSxhQUFPO0FBQUEsSUFDVDtBQUNBLHVCQUFtQixNQUFZO0FBQUUsVUFBSSxVQUFVLEtBQU0sUUFBTyxhQUFhLEtBQUs7QUFBRyxjQUFRLE9BQU8sV0FBVyxNQUFNLFFBQVEsVUFBVSxHQUFHLEdBQUc7QUFBQSxJQUFHO0FBQzVJLFNBQUssY0FBYyxNQUFNO0FBQUUsY0FBUSxRQUFRO0FBQUEsSUFBRztBQUU5QyxLQUFDLFdBQVcsWUFBWSxhQUFhLFdBQVcsa0JBQWtCLGVBQWUsV0FBVyxhQUFhLGdCQUFnQixXQUFXLFNBQVMsRUFDMUksUUFBUSxDQUFDLFVBQVU7QUFBRSxZQUFNLGlCQUFpQixTQUFTLGdCQUFnQjtBQUFHLFlBQU0saUJBQWlCLFVBQVUsZ0JBQWdCO0FBQUEsSUFBRyxDQUFDO0FBRWhJLFVBQU0sVUFBVSxLQUFLLFVBQVUsRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBQzFELFVBQU0sY0FBYyxRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssV0FBVyxNQUFNLGtDQUFTLE1BQU0sRUFBRSxNQUFNLFNBQVMsRUFBRSxDQUFDO0FBQzFHLGdCQUFZLGlCQUFpQixTQUFTLE1BQU07QUFBRSxVQUFJLFFBQVEsVUFBVSxJQUFJLEdBQUc7QUFBRSxhQUFLLG9CQUFvQjtBQUFNLGFBQUssTUFBTTtBQUFBLE1BQUc7QUFBQSxJQUFFLENBQUM7QUFFN0gsU0FBSyx3QkFBd0IsQ0FBQyxVQUE4QjtBQS9vQmhFLFVBQUFBO0FBZ3BCTSxVQUFJLEtBQUssUUFBUSxTQUFTLE1BQU0sTUFBYyxFQUFHO0FBQ2pELE9BQUFBLE1BQUEsS0FBSyxnQkFBTCxnQkFBQUEsSUFBQTtBQUFzQixXQUFLLG9CQUFvQjtBQUFNLFdBQUssTUFBTTtBQUFBLElBQ2xFO0FBQ0EsV0FBTyxXQUFXLE1BQU0sU0FBUyxpQkFBaUIsZUFBZSxLQUFLLHVCQUF3QixJQUFJLEdBQUcsQ0FBQztBQUFBLEVBQ3hHO0FBQUEsRUFFQSxVQUFnQjtBQXRwQmxCO0FBdXBCSSxRQUFJLENBQUMsS0FBSyxrQkFBbUIsWUFBSyxnQkFBTDtBQUM3QixRQUFJLEtBQUssc0JBQXVCLFVBQVMsb0JBQW9CLGVBQWUsS0FBSyx1QkFBdUIsSUFBSTtBQUM1RyxTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQ0Y7QUFFQSxJQUFNLGtCQUFOLGNBQThCLHVCQUFNO0FBQUEsRUFLbEMsWUFBWSxLQUFVLFlBQStCLFFBQWlELE9BQW1CO0FBQ3ZILFVBQU0sR0FBRztBQUNULFNBQUssYUFBYTtBQUNsQixTQUFLLFNBQVM7QUFDZCxTQUFLLFFBQVE7QUFBQSxFQUNmO0FBQUEsRUFFQSxTQUFlO0FBenFCakI7QUEwcUJJLFNBQUssUUFBUSxRQUFRLHNDQUFRO0FBQzdCLFNBQUssVUFBVSxTQUFTLHNCQUFzQjtBQUM5QyxVQUFNLE9BQU8sS0FBSyxVQUFVLFNBQVMsTUFBTTtBQUMzQyxTQUFLLFNBQVMsS0FBSyxFQUFFLEtBQUssNEJBQTRCLE1BQU0sMk9BQWtELENBQUM7QUFFL0csUUFBSSxrQkFBdUMsVUFBSyxXQUFXLGdCQUFoQixZQUErQjtBQUMxRSxVQUFNLGVBQWUsS0FBSyxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUMvRCxpQkFBYSxVQUFVLEVBQUUsS0FBSywwQkFBMEIsTUFBTSwyQkFBTyxDQUFDO0FBQ3RFLFVBQU0sWUFBWSxhQUFhLFVBQVUsRUFBRSxLQUFLLHNCQUFzQixDQUFDO0FBQ3ZFLFVBQU0sYUFBYSxvQkFBSSxJQUE2QztBQUVwRSxVQUFNLE9BQU8sS0FBSyxVQUFVLEVBQUUsS0FBSyxvQ0FBb0MsQ0FBQztBQUN4RSxVQUFNLFdBQVcsQ0FBQyxXQUFtQixPQUEyQixhQUE0RTtBQUMxSSxZQUFNLFFBQVEsS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUN4RCxZQUFNLE1BQU0sTUFBTSxVQUFVLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQztBQUNwRCxZQUFNLFNBQVMsSUFBSSxTQUFTLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUN6RCxZQUFNLFFBQVEsSUFBSSxTQUFTLFNBQVMsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNyRCxhQUFPLFVBQVUsUUFBUSxLQUFLO0FBQzlCLFlBQU0sUUFBUSx3QkFBUztBQUN2QixZQUFNLFdBQVcsQ0FBQyxPQUFPO0FBQ3pCLGFBQU8saUJBQWlCLFVBQVUsTUFBTTtBQUFFLGNBQU0sV0FBVyxDQUFDLE9BQU87QUFBQSxNQUFTLENBQUM7QUFDN0UsYUFBTyxFQUFFLFFBQVEsTUFBTTtBQUFBLElBQ3pCO0FBRUEsVUFBTSxhQUFhLFNBQVMsNEJBQVEsS0FBSyxXQUFXLGlCQUFpQixTQUFTO0FBQzlFLFVBQU0sZUFBZSxLQUFLLFNBQVMsU0FBUyxFQUFFLE1BQU0sMkJBQU8sQ0FBQztBQUM1RCxVQUFNLGdCQUFnQixhQUFhLFNBQVMsUUFBUTtBQUNwRCxlQUFXLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLFFBQVEsUUFBRyxHQUFHLENBQUMsUUFBUSxjQUFJLEdBQUcsQ0FBQyxRQUFRLGNBQUksQ0FBQyxFQUFZLGVBQWMsU0FBUyxVQUFVLEVBQUUsTUFBTSxPQUFPLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUN4SixrQkFBYyxTQUFRLFVBQUssV0FBVyxzQkFBaEIsWUFBcUM7QUFDM0QsVUFBTSxlQUFlLFNBQVMsNEJBQVEsS0FBSyxXQUFXLGNBQWMsU0FBUztBQUU3RSxVQUFNLFlBQVksS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLGVBQUssQ0FBQztBQUN2RCxVQUFNLGFBQWEsVUFBVSxTQUFTLFFBQVE7QUFDOUMsZUFBVyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsQ0FBQyxZQUFZLHVCQUFhLEdBQUcsQ0FBQyxRQUFRLG9CQUFLLEdBQUcsQ0FBQyxTQUFTLGNBQUksR0FBRyxDQUFDLFFBQVEsY0FBSSxHQUFHLENBQUMsVUFBVSxvQkFBSyxDQUFDLEVBQVksWUFBVyxTQUFTLFVBQVUsRUFBRSxNQUFNLE9BQU8sTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBQ3hNLGVBQVcsU0FBUSxVQUFLLFdBQVcsZUFBaEIsWUFBOEI7QUFDakQsVUFBTSxrQkFBa0IsS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLDZDQUFVLENBQUM7QUFDbEUsVUFBTSxrQkFBa0IsZ0JBQWdCLFNBQVMsU0FBUyxFQUFFLE1BQU0sUUFBUSxNQUFNLEVBQUUsYUFBYSxrQkFBa0IsRUFBRSxDQUFDO0FBQ3BILG9CQUFnQixTQUFRLFVBQUssV0FBVyxlQUFoQixZQUE4QjtBQUN0RCxVQUFNLG1CQUFtQixNQUFZO0FBQUUsc0JBQWdCLFdBQVcsV0FBVyxVQUFVO0FBQUEsSUFBVTtBQUNqRyxlQUFXLGlCQUFpQixVQUFVLGdCQUFnQjtBQUN0RCxxQkFBaUI7QUFFakIsVUFBTSxnQkFBZ0IsS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLHFDQUFZLENBQUM7QUFDbEUsVUFBTSxnQkFBZ0IsY0FBYyxTQUFTLFNBQVMsRUFBRSxNQUFNLFVBQVUsTUFBTSxFQUFFLEtBQUssTUFBTSxLQUFLLE1BQU0sTUFBTSxJQUFJLEVBQUUsQ0FBQztBQUNuSCxrQkFBYyxRQUFRLFFBQU8sVUFBSyxXQUFXLGFBQWhCLFlBQTRCLEVBQUU7QUFFM0QsVUFBTSxZQUFZLFNBQVMsd0NBQVUsS0FBSyxXQUFXLFdBQVcsU0FBUztBQUN6RSxVQUFNLGdCQUFnQixTQUFTLHdDQUFVLEtBQUssV0FBVyxlQUFlLFNBQVM7QUFDakYsVUFBTSxZQUFZLFNBQVMsa0NBQVMsS0FBSyxXQUFXLFdBQVcsU0FBUztBQUN4RSxVQUFNLFlBQVksU0FBUyw0QkFBUSxLQUFLLFdBQVcsV0FBVyxTQUFTO0FBQ3ZFLFVBQU0sY0FBYyxTQUFTLHdDQUFVLEtBQUssV0FBVyxpQkFBaUIsU0FBUztBQUNqRixVQUFNLG1CQUFtQixLQUFLLFNBQVMsU0FBUyxFQUFFLE1BQU0sK0NBQVksQ0FBQztBQUNyRSxVQUFNLG1CQUFtQixpQkFBaUIsU0FBUyxTQUFTLEVBQUUsTUFBTSxVQUFVLE1BQU0sRUFBRSxLQUFLLEtBQUssS0FBSyxLQUFLLE1BQU0sTUFBTSxFQUFFLENBQUM7QUFDekgscUJBQWlCLFFBQVEsUUFBTyxVQUFLLFdBQVcsb0JBQWhCLFlBQW1DLENBQUM7QUFFcEUsVUFBTSxZQUFZLFNBQVMsNEJBQVEsS0FBSyxXQUFXLFdBQVcsU0FBUztBQUN2RSxVQUFNLGlCQUFpQixLQUFLLFNBQVMsU0FBUyxFQUFFLE1BQU0sMkJBQU8sQ0FBQztBQUM5RCxVQUFNLGtCQUFrQixlQUFlLFNBQVMsUUFBUTtBQUN4RCxlQUFXLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLFVBQVUsY0FBSSxHQUFHLENBQUMsWUFBWSxjQUFJLEdBQUcsQ0FBQyxTQUFTLGNBQUksQ0FBQyxFQUFZLGlCQUFnQixTQUFTLFVBQVUsRUFBRSxNQUFNLE9BQU8sTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBQ2xLLG9CQUFnQixTQUFRLFVBQUssV0FBVyxjQUFoQixZQUE2QjtBQUVyRCxVQUFNLHFCQUFxQixLQUFLLFNBQVMsU0FBUyxFQUFFLE1BQU0sdUNBQVMsQ0FBQztBQUNwRSxVQUFNLHNCQUFzQixtQkFBbUIsU0FBUyxRQUFRO0FBQ2hFLHdCQUFvQixTQUFTLFVBQVUsRUFBRSxNQUFNLDRCQUFRLE1BQU0sRUFBRSxPQUFPLFVBQVUsRUFBRSxDQUFDO0FBQ25GLHdCQUFvQixTQUFTLFVBQVUsRUFBRSxNQUFNLDRCQUFRLE1BQU0sRUFBRSxPQUFPLFVBQVUsRUFBRSxDQUFDO0FBQ25GLHdCQUFvQixTQUFRLFVBQUssV0FBVyxrQkFBaEIsWUFBaUM7QUFFN0QsVUFBTSxpQkFBaUIsS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLGlEQUFjLENBQUM7QUFDckUsVUFBTSxpQkFBaUIsZUFBZSxTQUFTLFNBQVMsRUFBRSxNQUFNLFVBQVUsTUFBTSxFQUFFLEtBQUssT0FBTyxLQUFLLEtBQUssTUFBTSxPQUFPLEVBQUUsQ0FBQztBQUN4SCxtQkFBZSxRQUFRLFFBQU8sVUFBSyxXQUFXLGNBQWhCLFlBQTZCLEdBQUc7QUFDOUQsVUFBTSxvQkFBb0IsS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLGtEQUFlLENBQUM7QUFDekUsVUFBTSxvQkFBb0Isa0JBQWtCLFNBQVMsU0FBUyxFQUFFLE1BQU0sVUFBVSxNQUFNLEVBQUUsS0FBSyxRQUFRLEtBQUssS0FBSyxNQUFNLE9BQU8sRUFBRSxDQUFDO0FBQy9ILHNCQUFrQixRQUFRLFFBQU8sVUFBSyxXQUFXLGlCQUFoQixZQUFnQyxHQUFHO0FBQ3BFLFVBQU0sZ0JBQWdCLE1BQVk7QUFDaEMsWUFBTSxVQUFVLG9CQUFvQixVQUFVO0FBQzlDLHdCQUFrQixXQUFXLENBQUM7QUFDOUIsd0JBQWtCLFlBQVksZUFBZSxDQUFDLE9BQU87QUFDckQscUJBQWUsV0FBVyxDQUFDLEVBQUcsY0FBYyxVQUFVLG1EQUFnQjtBQUFBLElBQ3hFO0FBQ0Esd0JBQW9CLGlCQUFpQixVQUFVLGFBQWE7QUFDNUQsa0JBQWM7QUFFZCxVQUFNLGNBQWMsS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLDJCQUFPLENBQUM7QUFDM0QsVUFBTSxrQkFBa0IsWUFBWSxVQUFVLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQztBQUN2RSxVQUFNLG1CQUFtQixnQkFBZ0IsU0FBUyxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDL0UscUJBQWlCLFVBQVUsS0FBSyxXQUFXLHFCQUFxQjtBQUNoRSxvQkFBZ0IsV0FBVyxFQUFFLE1BQU0seURBQVksQ0FBQztBQUNoRCxVQUFNLG9CQUFvQixLQUFLLFNBQVMsU0FBUyxFQUFFLE1BQU0sK0RBQWEsQ0FBQztBQUN2RSxVQUFNLG9CQUFvQixrQkFBa0IsU0FBUyxZQUFZLEVBQUUsTUFBTSxFQUFFLE1BQU0sS0FBSyxhQUFhLDRCQUE0QixFQUFFLENBQUM7QUFDbEksc0JBQWtCLFVBQVMsVUFBSyxXQUFXLGlCQUFoQixZQUFnQyxDQUFDLEdBQUcsS0FBSyxJQUFJO0FBRXhFLFVBQU0sbUJBQW1CLEtBQUssVUFBVSxFQUFFLEtBQUssNEJBQTRCLENBQUM7QUFDNUUscUJBQWlCLFVBQVUsRUFBRSxLQUFLLG1DQUFtQyxNQUFNLDJCQUFPLENBQUM7QUFDbkYsVUFBTSxZQUFZLGlCQUFpQixVQUFVLEVBQUUsS0FBSywrQkFBK0IsQ0FBQztBQUNwRixVQUFNLFdBQVcsQ0FBQyxNQUFjLFlBQXVDO0FBQ3JFLFlBQU0sUUFBUSxVQUFVLFNBQVMsU0FBUyxFQUFFLEtBQUssOEJBQThCLENBQUM7QUFDaEYsWUFBTSxRQUFRLE1BQU0sU0FBUyxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDMUQsWUFBTSxVQUFVO0FBQ2hCLFlBQU0sV0FBVyxFQUFFLEtBQUssQ0FBQztBQUN6QixhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sT0FBTyxTQUFTLDRCQUFRLEtBQUssV0FBVyxTQUFTLElBQUk7QUFDM0QsVUFBTSxTQUFTLFNBQVMsNEJBQVEsS0FBSyxXQUFXLFdBQVcsSUFBSTtBQUMvRCxVQUFNLFlBQVksU0FBUyxrQ0FBUyxLQUFLLFdBQVcsY0FBYyxJQUFJO0FBRXRFLFVBQU0sV0FBVyxDQUFDLFNBQWdFLE9BQTJCLGFBQTJCO0FBQ3RJLGNBQVEsT0FBTyxVQUFVLFFBQVEsS0FBSztBQUN0QyxjQUFRLE1BQU0sUUFBUSx3QkFBUztBQUMvQixjQUFRLE1BQU0sV0FBVyxDQUFDLFFBQVEsT0FBTztBQUFBLElBQzNDO0FBQ0EsVUFBTSxzQkFBc0IsTUFBWTtBQUN0QyxpQkFBVyxDQUFDLElBQUksSUFBSSxLQUFLLFdBQVksTUFBSyxZQUFZLGVBQWUsT0FBTyxjQUFjO0FBQUEsSUFDNUY7QUFDQSxVQUFNLGNBQWMsQ0FBQyxhQUF5QztBQTN4QmxFLFVBQUFBLEtBQUFDLEtBQUFDLEtBQUFDLEtBQUFDLEtBQUFDLEtBQUFDLEtBQUFDLEtBQUFDLEtBQUFDO0FBNHhCTSx1QkFBaUI7QUFDakIsWUFBTSxhQUFhLDBCQUEwQixRQUFRO0FBQ3JELGVBQVMsWUFBWSxXQUFXLGlCQUFpQixTQUFTO0FBQzFELG9CQUFjLFNBQVFULE1BQUEsV0FBVyxzQkFBWCxPQUFBQSxNQUFnQztBQUN0RCxlQUFTLGNBQWMsV0FBVyxjQUFjLFNBQVM7QUFDekQsaUJBQVcsU0FBUUMsTUFBQSxXQUFXLGVBQVgsT0FBQUEsTUFBeUI7QUFDNUMsc0JBQWdCLFNBQVFDLE1BQUEsV0FBVyxlQUFYLE9BQUFBLE1BQXlCO0FBQ2pELG9CQUFjLFFBQVEsUUFBT0MsTUFBQSxXQUFXLGFBQVgsT0FBQUEsTUFBdUIsRUFBRTtBQUN0RCxlQUFTLFdBQVcsV0FBVyxXQUFXLFNBQVM7QUFDbkQsZUFBUyxlQUFlLFdBQVcsZUFBZSxTQUFTO0FBQzNELGVBQVMsV0FBVyxXQUFXLFdBQVcsU0FBUztBQUNuRCxlQUFTLFdBQVcsV0FBVyxXQUFXLFNBQVM7QUFDbkQsZUFBUyxhQUFhLFdBQVcsaUJBQWlCLFNBQVM7QUFDM0QsdUJBQWlCLFFBQVEsUUFBT0MsTUFBQSxXQUFXLG9CQUFYLE9BQUFBLE1BQThCLENBQUM7QUFDL0QsZUFBUyxXQUFXLFdBQVcsV0FBVyxTQUFTO0FBQ25ELHNCQUFnQixTQUFRQyxNQUFBLFdBQVcsY0FBWCxPQUFBQSxNQUF3QjtBQUNoRCwwQkFBb0IsU0FBUUMsTUFBQSxXQUFXLGtCQUFYLE9BQUFBLE1BQTRCO0FBQ3hELHFCQUFlLFFBQVEsUUFBT0MsTUFBQSxXQUFXLGNBQVgsT0FBQUEsTUFBd0IsR0FBRztBQUN6RCx3QkFBa0IsUUFBUSxRQUFPQyxNQUFBLFdBQVcsaUJBQVgsT0FBQUEsTUFBMkIsQ0FBQztBQUM3RCx1QkFBaUIsVUFBVSxXQUFXLHFCQUFxQjtBQUMzRCx3QkFBa0IsVUFBU0MsTUFBQSxXQUFXLGlCQUFYLE9BQUFBLE1BQTJCLENBQUMsR0FBRyxLQUFLLElBQUk7QUFDbkUsV0FBSyxVQUFVLFdBQVcsU0FBUztBQUNuQyxhQUFPLFVBQVUsV0FBVyxXQUFXO0FBQ3ZDLGdCQUFVLFVBQVUsV0FBVyxjQUFjO0FBQzdDLHVCQUFpQjtBQUNqQixvQkFBYztBQUNkLDBCQUFvQjtBQUFBLElBQ3RCO0FBRUEsZUFBVyxVQUFVLHVCQUF1QjtBQUMxQyxZQUFNLE9BQU8sVUFBVSxTQUFTLFVBQVUsRUFBRSxLQUFLLGtCQUFrQixNQUFNLEVBQUUsTUFBTSxVQUFVLE9BQU8sT0FBTyxZQUFZLEVBQUUsQ0FBQztBQUN4SCxpQkFBVyxJQUFJLE9BQU8sSUFBSSxJQUFJO0FBQzlCLFlBQU0sVUFBVSxLQUFLLFVBQVUsRUFBRSxLQUFLLHlCQUF5QixDQUFDO0FBQ2hFLGNBQVEsTUFBTSxtQkFBa0IsWUFBTyxXQUFXLG9CQUFsQixZQUFxQztBQUNyRSxZQUFNLE9BQU8sUUFBUSxXQUFXLEVBQUUsS0FBSyxzQkFBc0IsQ0FBQztBQUM5RCxXQUFLLE1BQU0sbUJBQWtCLFlBQU8sV0FBVyxjQUFsQixZQUErQjtBQUM1RCxZQUFNLFdBQVcsUUFBUSxVQUFVLEVBQUUsS0FBSywwQkFBMEIsQ0FBQztBQUNyRSxRQUFDLFlBQU8sV0FBVyxpQkFBbEIsWUFBa0MsRUFBQyxZQUFPLFdBQVcsY0FBbEIsWUFBK0IsU0FBUyxHQUFHLE1BQU0sR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLE9BQU8sVUFBVTtBQUNuSCxjQUFNLE9BQU8sU0FBUyxXQUFXO0FBQ2pDLGFBQUssTUFBTSxrQkFBa0I7QUFDN0IsYUFBSyxNQUFNLFFBQVEsR0FBRyxLQUFLLFFBQVEsQ0FBQztBQUNwQyxhQUFLLE1BQU0sU0FBUyxHQUFHLEtBQUssSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDO0FBQUEsTUFDL0MsQ0FBQztBQUNELFdBQUssVUFBVSxFQUFFLEtBQUssdUJBQXVCLE1BQU0sT0FBTyxLQUFLLENBQUM7QUFDaEUsV0FBSyxpQkFBaUIsU0FBUyxNQUFNLFlBQVksT0FBTyxFQUFFLENBQUM7QUFBQSxJQUM3RDtBQUNBLHdCQUFvQjtBQUVwQixVQUFNLFFBQVEsQ0FBQyxPQUFlLEtBQWEsS0FBYSxhQUE2QjtBQUNuRixZQUFNLFNBQVMsT0FBTyxLQUFLO0FBQzNCLGFBQU8sT0FBTyxTQUFTLE1BQU0sSUFBSSxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSTtBQUFBLElBQzFFO0FBQ0EsVUFBTSxvQkFBb0IsTUFBZ0Isa0JBQWtCLE1BQ3pELE1BQU0sU0FBUyxFQUNmLElBQUksQ0FBQyxVQUFVLE1BQU0sS0FBSyxDQUFDLEVBQzNCLE9BQU8sQ0FBQyxVQUFVLGtCQUFrQixLQUFLLEtBQUssQ0FBQyxFQUMvQyxNQUFNLEdBQUcsRUFBRTtBQUVkLFVBQU0sVUFBVSxLQUFLLFVBQVUsRUFBRSxLQUFLLG9CQUFvQixDQUFDO0FBQzNELFVBQU0sUUFBUSxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sd0NBQVUsTUFBTSxTQUFTLENBQUM7QUFDM0UsVUFBTSxTQUFTLFFBQVEsU0FBUyxVQUFVLEVBQUUsTUFBTSxnQkFBTSxNQUFNLFNBQVMsQ0FBQztBQUN4RSxVQUFNLE9BQU8sUUFBUSxTQUFTLFVBQVUsRUFBRSxNQUFNLGdCQUFNLE1BQU0sVUFBVSxLQUFLLFVBQVUsQ0FBQztBQUN0RixVQUFNLGlCQUFpQixTQUFTLE1BQU07QUFBRSxXQUFLLE1BQU07QUFBRyxXQUFLLE1BQU07QUFBQSxJQUFHLENBQUM7QUFDckUsV0FBTyxpQkFBaUIsU0FBUyxNQUFNLEtBQUssTUFBTSxDQUFDO0FBQ25ELFNBQUssaUJBQWlCLFVBQVUsQ0FBQyxVQUFVO0FBQ3pDLFlBQU0sZUFBZTtBQUNyQixZQUFNLFdBQVcsTUFBTSxlQUFlLE9BQU8sS0FBSyxHQUFHLEdBQUc7QUFDeEQsV0FBSyxPQUFPO0FBQUEsUUFDVixhQUFhO0FBQUEsUUFDYixpQkFBaUIsV0FBVyxPQUFPLFVBQVUsV0FBVyxNQUFNLFFBQVE7QUFBQSxRQUN0RSxtQkFBbUIsY0FBYztBQUFBLFFBQ2pDLGNBQWMsYUFBYSxPQUFPLFVBQVUsYUFBYSxNQUFNLFFBQVE7QUFBQSxRQUN2RSxZQUFZLFdBQVc7QUFBQSxRQUN2QixZQUFZLFdBQVcsVUFBVSxXQUFXLGdCQUFnQixNQUFNLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRyxLQUFLLFNBQVk7QUFBQSxRQUN0RyxVQUFVLE1BQU0sY0FBYyxPQUFPLElBQUksSUFBSSxFQUFFO0FBQUEsUUFDL0MsV0FBVyxVQUFVLE9BQU8sVUFBVSxVQUFVLE1BQU0sUUFBUTtBQUFBLFFBQzlELGVBQWUsY0FBYyxPQUFPLFVBQVUsY0FBYyxNQUFNLFFBQVE7QUFBQSxRQUMxRSxXQUFXLFVBQVUsT0FBTyxVQUFVLFVBQVUsTUFBTSxRQUFRO0FBQUEsUUFDOUQsV0FBVyxVQUFVLE9BQU8sVUFBVSxVQUFVLE1BQU0sUUFBUTtBQUFBLFFBQzlELGlCQUFpQixZQUFZLE9BQU8sVUFBVSxZQUFZLE1BQU0sUUFBUTtBQUFBLFFBQ3hFLGlCQUFpQixNQUFNLGlCQUFpQixPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQUEsUUFDdEQsV0FBVyxVQUFVLE9BQU8sVUFBVSxVQUFVLE1BQU0sUUFBUTtBQUFBLFFBQzlELFdBQVc7QUFBQSxRQUNYLFdBQVcsZ0JBQWdCO0FBQUEsUUFDM0IsZUFBZSxvQkFBb0I7QUFBQSxRQUNuQyxjQUFjLEtBQUssSUFBSSxVQUFVLE1BQU0sa0JBQWtCLE9BQU8sTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUFBLFFBQzdFLGtCQUFrQixpQkFBaUI7QUFBQSxRQUNuQyxjQUFjLGtCQUFrQjtBQUFBLFFBQ2hDLE1BQU0sS0FBSztBQUFBLFFBQ1gsUUFBUSxPQUFPO0FBQUEsUUFDZixXQUFXLFVBQVU7QUFBQSxNQUN2QixDQUFDO0FBQ0QsV0FBSyxNQUFNO0FBQUEsSUFDYixDQUFDO0FBQ0QsV0FBTyxXQUFXLE1BQU0sS0FBSyxNQUFNLEdBQUcsRUFBRTtBQUFBLEVBQzFDO0FBQ0Y7QUFFQSxJQUFNLGVBQU4sY0FBMkIsdUJBQU07QUFBQSxFQUkvQixZQUFZLEtBQVUsVUFBa0IsVUFBc0I7QUFDNUQsVUFBTSxHQUFHO0FBQ1QsU0FBSyxXQUFXO0FBQ2hCLFNBQUssV0FBVztBQUFBLEVBQ2xCO0FBQUEsRUFFQSxTQUFlO0FBQ2IsU0FBSyxRQUFRLFFBQVEsdUJBQWE7QUFDbEMsVUFBTSxXQUFXLEtBQUssVUFBVSxTQUFTLFlBQVksRUFBRSxLQUFLLHVCQUF1QixDQUFDO0FBQ3BGLGFBQVMsUUFBUSxLQUFLO0FBQ3RCLGFBQVMsV0FBVztBQUNwQixVQUFNLFVBQVUsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLG9CQUFvQixDQUFDO0FBQ3JFLFVBQU0sT0FBTyxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sZUFBSyxDQUFDO0FBQ3RELFVBQU0sZUFBZSxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sMEJBQVcsS0FBSyxVQUFVLENBQUM7QUFDbkYsU0FBSyxpQkFBaUIsU0FBUyxNQUFNO0FBQ25DLFdBQUssVUFBVSxVQUFVLFVBQVUsS0FBSyxRQUFRO0FBQ2hELFVBQUksd0JBQU8sMENBQWlCO0FBQUEsSUFDOUIsQ0FBQztBQUNELGlCQUFhLGlCQUFpQixTQUFTLE1BQU07QUFDM0MsV0FBSyxTQUFTO0FBQ2QsV0FBSyxNQUFNO0FBQUEsSUFDYixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQ0Y7QUFFQSxJQUFNLG1CQUFOLGNBQStCLHVCQUFNO0FBQUEsRUFLbkMsWUFBWSxLQUFVLE9BQXNCLFNBQWtDLFVBQXVDO0FBQ25ILFVBQU0sR0FBRztBQUNULFNBQUssUUFBUTtBQUNiLFNBQUssVUFBVTtBQUNmLFNBQUssV0FBVztBQUFBLEVBQ2xCO0FBQUEsRUFFQSxTQUFlO0FBQ2IsU0FBSyxRQUFRLFFBQVEsMEJBQU07QUFDM0IsU0FBSyxRQUFRLFNBQVMsa0JBQWtCO0FBQ3hDLFVBQU0sUUFBUSxLQUFLLFVBQVUsU0FBUyxTQUFTLEVBQUUsTUFBTSxVQUFVLEtBQUssb0JBQW9CLE1BQU0sRUFBRSxhQUFhLHVGQUFpQixFQUFFLENBQUM7QUFDbkksVUFBTSxRQUFRLEtBQUssVUFBVSxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUNsRSxVQUFNLFVBQVUsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLHFCQUFxQixDQUFDO0FBRXRFLFVBQU0sZ0JBQWdCLE1BQVk7QUFsN0J0QztBQW03Qk0sWUFBTSxRQUFRLE1BQU0sTUFBTSxLQUFLLEVBQUUsa0JBQWtCO0FBQ25ELFdBQUssUUFBUSxLQUFLO0FBQ2xCLGNBQVEsTUFBTTtBQUNkLFlBQU0sVUFBVSxRQUNaLEtBQUssTUFBTSxPQUFPLENBQUMsU0FBUyxlQUFlLElBQUksRUFBRSxTQUFTLEtBQUssQ0FBQyxFQUFFLE1BQU0sR0FBRyxFQUFFLElBQzdFLEtBQUssTUFBTSxNQUFNLEdBQUcsRUFBRTtBQUMxQixZQUFNLFFBQVEsUUFBUSxnQkFBTSxRQUFRLE1BQU0sd0JBQVMsVUFBSyxLQUFLLE1BQU0sTUFBTSxxQkFBTTtBQUMvRSxpQkFBVyxRQUFRLFNBQVM7QUFDMUIsY0FBTSxTQUFTLFFBQVEsU0FBUyxVQUFVLEVBQUUsS0FBSyxxQkFBcUIsTUFBTSxTQUFTLENBQUM7QUFDdEYsY0FBTSxRQUFRLE9BQU8sVUFBVSxFQUFFLEtBQUssMEJBQTBCLENBQUM7QUFDakUsWUFBSSxLQUFLLEtBQU0sT0FBTSxXQUFXLEVBQUUsTUFBTSxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUM7QUFDekQsY0FBTSxXQUFXLEVBQUUsTUFBTSxjQUFjLElBQUksS0FBSywyQkFBTyxDQUFDO0FBQ3hELGNBQU0sVUFBVSxDQUFDLEtBQUssT0FBUSxFQUFFLE1BQU0sZ0JBQU0sT0FBTyxzQkFBTyxNQUFNLHFCQUFNLEVBQVksS0FBSyxJQUFJLElBQUksSUFBSSxLQUFJLFVBQUssU0FBTCxZQUFhLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEdBQUcsRUFBRSxDQUFDLEVBQzVJLE9BQU8sT0FBTyxFQUNkLEtBQUssUUFBSztBQUNiLFlBQUksUUFBUyxRQUFPLFVBQVUsRUFBRSxLQUFLLDBCQUEwQixNQUFNLFFBQVEsQ0FBQztBQUM5RSxlQUFPLGlCQUFpQixTQUFTLE1BQU07QUFDckMsZUFBSyxTQUFTLElBQUk7QUFDbEIsZUFBSyxNQUFNO0FBQUEsUUFDYixDQUFDO0FBQUEsTUFDSDtBQUNBLFVBQUksQ0FBQyxRQUFRLE9BQVEsU0FBUSxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSw2Q0FBVSxDQUFDO0FBQUEsSUFDcEY7QUFFQSxVQUFNLGlCQUFpQixTQUFTLGFBQWE7QUFDN0MsVUFBTSxpQkFBaUIsV0FBVyxDQUFDLFVBQVU7QUFDM0MsVUFBSSxNQUFNLFFBQVEsU0FBUztBQUN6QixjQUFNLFFBQVEsUUFBUSxjQUFpQyxvQkFBb0I7QUFDM0UsWUFBSSxPQUFPO0FBQ1QsZ0JBQU0sZUFBZTtBQUNyQixnQkFBTSxNQUFNO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFDRCxrQkFBYztBQUNkLFdBQU8sV0FBVyxNQUFNLE1BQU0sTUFBTSxHQUFHLEVBQUU7QUFBQSxFQUMzQztBQUNGO0FBRUEsSUFBTSxvQkFBTixjQUFnQyx1QkFBTTtBQUFBLEVBS3BDLFlBQVksS0FBVUMsV0FBMkIsVUFBK0MsVUFBa0M7QUFDaEksVUFBTSxHQUFHO0FBQ1QsU0FBSyxXQUFXQTtBQUNoQixTQUFLLFdBQVc7QUFDaEIsU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFNBQWU7QUFDYixTQUFLLFFBQVEsUUFBUSxrQ0FBYztBQUNuQyxVQUFNLGNBQWMsS0FBSyxVQUFVLFNBQVMsS0FBSyxFQUFFLE1BQU0sc0pBQWtELENBQUM7QUFDNUcsZ0JBQVksU0FBUywwQkFBMEI7QUFDL0MsVUFBTSxXQUFXLEtBQUssVUFBVSxTQUFTLFlBQVksRUFBRSxLQUFLLG9CQUFvQixDQUFDO0FBQ2pGLGFBQVMsUUFBUSxLQUFLLFVBQVUsS0FBSyxVQUFVLE1BQU0sQ0FBQztBQUN0RCxVQUFNLFVBQVUsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLHFDQUFxQyxDQUFDO0FBQ3RGLFVBQU0sT0FBTyxRQUFRLFNBQVMsVUFBVSxFQUFFLE1BQU0sb0JBQVUsQ0FBQztBQUMzRCxVQUFNLGVBQWUsUUFBUSxTQUFTLFVBQVUsRUFBRSxNQUFNLHFCQUFXLENBQUM7QUFDcEUsVUFBTSxlQUFlLFFBQVEsU0FBUyxVQUFVLEVBQUUsTUFBTSxrQ0FBUyxLQUFLLGNBQWMsQ0FBQztBQUNyRixTQUFLLGlCQUFpQixTQUFTLE1BQU07QUFDbkMsV0FBSyxVQUFVLFVBQVUsVUFBVSxTQUFTLEtBQUs7QUFDakQsVUFBSSx3QkFBTyx5QkFBVTtBQUFBLElBQ3ZCLENBQUM7QUFDRCxpQkFBYSxpQkFBaUIsU0FBUyxNQUFNLEtBQUssU0FBUyxTQUFTLEtBQUssQ0FBQztBQUMxRSxpQkFBYSxpQkFBaUIsU0FBUyxNQUFNO0FBQzNDLFVBQUk7QUFDRixjQUFNLFNBQVMsS0FBSyxNQUFNLFNBQVMsS0FBSztBQUN4QyxjQUFNLGFBQWEsa0JBQWtCLFFBQVEsS0FBSyxTQUFTLEtBQUs7QUFDaEUsYUFBSyxTQUFTLFVBQVU7QUFDeEIsWUFBSSx3QkFBTyx5QkFBVTtBQUNyQixhQUFLLE1BQU07QUFBQSxNQUNiLFNBQVMsT0FBTztBQUNkLGdCQUFRLE1BQU0scUNBQXFDLEtBQUs7QUFDeEQsWUFBSSx3QkFBTyx5RUFBa0I7QUFBQSxNQUMvQjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDRjtBQUVPLElBQU0sZ0JBQU4sTUFBb0I7QUFBQSxFQStCekIsWUFBWSxLQUFVLE1BQW1CQSxXQUEyQixXQUFtQyxTQUErQjtBQWR0SSxTQUFRLE9BQU87QUFDZixTQUFRLE9BQU87QUFDZixTQUFRLE9BQU87QUFDZixTQUFRLFVBQW9CLENBQUM7QUFDN0IsU0FBUSxTQUFtQixDQUFDO0FBQzVCLFNBQVEsYUFBNEI7QUFDcEMsU0FBUSxVQUFVO0FBQ2xCLFNBQVEsV0FBVyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLE1BQU0sRUFBRTtBQUNsRCxTQUFRLG1CQUFzQyxDQUFDO0FBQy9DLFNBQVEsaUJBQXdDO0FBQ2hELFNBQVEsa0JBQXNDO0FBQzlDLFNBQVEsY0FBYztBQUN0QixTQUFpQixrQkFBa0Isb0JBQUksSUFBWTtBQWppQ3JEO0FBb2lDSSxTQUFLLE1BQU07QUFDWCxTQUFLLE9BQU87QUFDWixTQUFLLFlBQVk7QUFDakIsU0FBSyxVQUFVO0FBQ2YsU0FBSyxXQUFXLGNBQWNBLFNBQVE7QUFDdEMsU0FBSyxhQUFhLEtBQUssU0FBUyxLQUFLO0FBQ3JDLFNBQUssU0FBUyxjQUFjLEtBQUssU0FBUyxNQUFNLEtBQUssU0FBUyxTQUFRLFVBQUssY0FBYyxFQUFFLGFBQXJCLFlBQWlDLEVBQUU7QUFDekcsU0FBSyxRQUFRO0FBQ2IsU0FBSyxPQUFPO0FBQ1osUUFBSSxLQUFLLFFBQVEsY0FBZSxRQUFPLFdBQVcsTUFBTSxLQUFLLFVBQVUsR0FBRyxFQUFFO0FBQUEsRUFDOUU7QUFBQSxFQUVBLFVBQWdCO0FBaGpDbEI7QUFpakNJLFNBQUsscUJBQXFCO0FBQzFCLFNBQUssaUJBQWlCLFFBQVEsQ0FBQyxhQUFhLFNBQVMsQ0FBQztBQUN0RCxTQUFLLG1CQUFtQixDQUFDO0FBQ3pCLGVBQUssbUJBQUwsbUJBQXFCO0FBQ3JCLFNBQUssaUJBQWlCO0FBQ3RCLFNBQUssS0FBSyxNQUFNO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFlBQVlBLFdBQTJCLGVBQWUsTUFBWTtBQUNoRSxTQUFLLFdBQVcsY0FBY0EsU0FBUTtBQUN0QyxTQUFLLGFBQWEsS0FBSyxTQUFTLEtBQUs7QUFDckMsUUFBSSxjQUFjO0FBQ2hCLFdBQUssVUFBVSxDQUFDO0FBQ2hCLFdBQUssU0FBUyxDQUFDO0FBQUEsSUFDakI7QUFDQSxTQUFLLE9BQU87QUFDWixRQUFJLEtBQUssUUFBUSxjQUFlLFFBQU8sV0FBVyxNQUFNLEtBQUssVUFBVSxHQUFHLEVBQUU7QUFBQSxFQUM5RTtBQUFBLEVBRUEsV0FBVyxTQUFxQztBQUM5QyxTQUFLLFVBQVU7QUFDZixTQUFLLE9BQU87QUFBQSxFQUNkO0FBQUEsRUFFQSxjQUErQjtBQUM3QixXQUFPLGNBQWMsS0FBSyxRQUFRO0FBQUEsRUFDcEM7QUFBQSxFQUVBLFlBQWtCO0FBQ2hCLFNBQUssU0FBUyxRQUFRLG9CQUFLO0FBQzNCLFNBQUssT0FBTyxZQUFZLFVBQVU7QUFBQSxFQUNwQztBQUFBLEVBRUEsYUFBbUI7QUFDakIsU0FBSyxTQUFTLFFBQVEsMEJBQU07QUFDNUIsU0FBSyxPQUFPLFNBQVMsVUFBVTtBQUFBLEVBQ2pDO0FBQUEsRUFFQSxRQUFjO0FBQ1osU0FBSyxPQUFPLE1BQU07QUFBQSxFQUNwQjtBQUFBLEVBRUEsY0FBYyxJQUFrQjtBQUM5QixRQUFJLFNBQVMsS0FBSyxTQUFTLE1BQU0sRUFBRSxFQUFHLE1BQUssVUFBVSxFQUFFO0FBQUEsRUFDekQ7QUFBQSxFQUVRLFVBQWdCO0FBQ3RCLFNBQUssS0FBSyxNQUFNO0FBQ2hCLFNBQUssU0FBUyxLQUFLLEtBQUssVUFBVSxFQUFFLEtBQUssYUFBYSxDQUFDO0FBQ3ZELFNBQUssT0FBTyxXQUFXO0FBQ3ZCLFNBQUssWUFBWSxLQUFLLE9BQU8sVUFBVSxFQUFFLEtBQUssY0FBYyxDQUFDO0FBQzdELFNBQUssa0JBQWtCLEtBQUssT0FBTyxVQUFVLEVBQUUsS0FBSyx3QkFBd0IsQ0FBQztBQUM3RSxTQUFLLGFBQWEsS0FBSyxPQUFPLFVBQVUsRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUMvRCxTQUFLLFVBQVUsS0FBSyxXQUFXLFVBQVUsRUFBRSxLQUFLLFlBQVksQ0FBQztBQUM3RCxTQUFLLFdBQVcsU0FBUyxnQkFBZ0IsOEJBQThCLEtBQUs7QUFDNUUsU0FBSyxTQUFTLFVBQVUsSUFBSSxXQUFXO0FBQ3ZDLFNBQUssUUFBUSxZQUFZLEtBQUssUUFBUTtBQUN0QyxTQUFLLGVBQWUsS0FBSyxRQUFRLFVBQVUsRUFBRSxLQUFLLGtCQUFrQixDQUFDO0FBQ3JFLFNBQUssaUJBQWlCLGVBQWUsaURBQWMsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUN4RSxTQUFLLGlCQUFpQixhQUFhLHlEQUFpQixNQUFNLEtBQUssV0FBVyxDQUFDO0FBQzNFLFNBQUssaUJBQWlCLFVBQVUsMENBQVksTUFBTSxLQUFLLGFBQWEsQ0FBQztBQUNyRSxTQUFLLGlCQUFpQixhQUFhLGtEQUFvQixNQUFNLEtBQUssa0JBQWtCLENBQUM7QUFDckYsU0FBSyxpQkFBaUIsV0FBVyw4Q0FBZ0IsTUFBTSxLQUFLLGVBQWUsQ0FBQztBQUM1RSxTQUFLLG9CQUFvQjtBQUN6QixTQUFLLGlCQUFpQixvQkFBb0Isa0VBQTBCLE1BQU0sS0FBSyxVQUFVLENBQUM7QUFDMUYsU0FBSyxpQkFBaUIsaUJBQWlCLDBEQUFrQixNQUFNLEtBQUssZUFBZSxDQUFDO0FBQ3BGLFNBQUssaUJBQWlCLFFBQVEsd0NBQVUsTUFBTSxLQUFLLGlCQUFpQixDQUFDO0FBQ3JFLFNBQUssaUJBQWlCLFVBQVUsa0RBQW9CLE1BQU0sS0FBSyxXQUFXLENBQUM7QUFDM0UsU0FBSyxvQkFBb0I7QUFDekIsU0FBSyxpQkFBaUIsV0FBVyw4Q0FBVyxNQUFNLEtBQUssVUFBVSxDQUFDO0FBQ2xFLFNBQUssaUJBQWlCLFVBQVUsOENBQVcsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUNoRSxTQUFLLGlCQUFpQixjQUFjLGdGQUF5QixNQUFNLElBQUksd0JBQU8sMkZBQTBCLENBQUM7QUFDekcsU0FBSyxpQkFBaUIsV0FBVyxvREFBWSxNQUFNLEtBQUssS0FBSyxtQkFBbUIsQ0FBQztBQUNqRixTQUFLLG9CQUFvQjtBQUN6QixTQUFLLGlCQUFpQixVQUFVLHNDQUFrQixNQUFNLEtBQUssS0FBSyxDQUFDO0FBQ25FLFNBQUssaUJBQWlCLFVBQVUsc0NBQWtCLE1BQU0sS0FBSyxLQUFLLENBQUM7QUFDbkUsU0FBSyxvQkFBb0I7QUFDekIsU0FBSyxpQkFBaUIsV0FBVyxnQkFBTSxNQUFNLEtBQUssUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDO0FBQzNFLFNBQUssaUJBQWlCLFlBQVksZ0JBQU0sTUFBTSxLQUFLLFFBQVEsS0FBSyxPQUFPLElBQUksQ0FBQztBQUM1RSxTQUFLLGlCQUFpQixZQUFZLDRCQUFRLE1BQU0sS0FBSyxVQUFVLENBQUM7QUFDaEUsU0FBSyxpQkFBaUIsWUFBWSxxREFBYSxNQUFNLEtBQUssYUFBYSxDQUFDO0FBQ3hFLFNBQUssaUJBQWlCLFdBQVcsd0NBQVUsTUFBTSxLQUFLLGVBQWUsQ0FBQztBQUN0RSxTQUFLLG9CQUFvQjtBQUN6QixTQUFLLGlCQUFpQixhQUFhLHNDQUFrQixNQUFNLEtBQUssWUFBWSxDQUFDO0FBQzdFLFNBQUssaUJBQWlCLFVBQVUsb0NBQWdCLE1BQU0sS0FBSyxpQkFBaUIsQ0FBQztBQUM3RSxTQUFLLGlCQUFpQixTQUFTLG9CQUFVLE1BQU0sS0FBSyxLQUFLLFVBQVUsWUFBWSxjQUFjLEtBQUssU0FBUyxNQUFNLEtBQUssU0FBUyxRQUFRLEtBQUssU0FBUyxPQUFPLEtBQUssY0FBYyxDQUFDLENBQUMsQ0FBQztBQUVsTCxVQUFNLFNBQVMsS0FBSyxVQUFVLFdBQVcsRUFBRSxLQUFLLHFCQUFxQixDQUFDO0FBQ3RFLFdBQU8sUUFBUSxlQUFlLE1BQU07QUFDcEMsU0FBSyxlQUFlLEtBQUssVUFBVSxXQUFXLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSxPQUFPLENBQUM7QUFDdEYsU0FBSyxXQUFXLEtBQUssVUFBVSxXQUFXLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSxxQkFBTSxDQUFDO0FBRWpGLFVBQU0sVUFBVSxDQUFDLFVBQStCLEtBQUssY0FBYyxLQUFLO0FBQ3hFLFNBQUssT0FBTyxpQkFBaUIsV0FBVyxPQUFPO0FBQy9DLFNBQUssaUJBQWlCLEtBQUssTUFBTSxLQUFLLE9BQU8sb0JBQW9CLFdBQVcsT0FBTyxDQUFDO0FBRXBGLFVBQU0sUUFBUSxDQUFDLFVBQWdDO0FBQUUsV0FBSyxLQUFLLFlBQVksS0FBSztBQUFBLElBQUc7QUFDL0UsU0FBSyxPQUFPLGlCQUFpQixTQUFTLEtBQUs7QUFDM0MsU0FBSyxpQkFBaUIsS0FBSyxNQUFNLEtBQUssT0FBTyxvQkFBb0IsU0FBUyxLQUFLLENBQUM7QUFFaEYsVUFBTSxRQUFRLENBQUMsVUFBNEI7QUFDekMsWUFBTSxjQUFjLE1BQU07QUFDMUIsVUFBSSxZQUFZLFFBQVEsdUNBQXVDLEVBQUc7QUFDbEUsWUFBTSxlQUFlO0FBQ3JCLFlBQU0sT0FBTyxLQUFLLFdBQVcsc0JBQXNCO0FBQ25ELFlBQU0sV0FBVyxNQUFNLFVBQVUsS0FBSyxPQUFPLEtBQUssUUFBUTtBQUMxRCxZQUFNLFdBQVcsTUFBTSxVQUFVLEtBQUssTUFBTSxLQUFLLFNBQVM7QUFDMUQsWUFBTSxVQUFVLEtBQUs7QUFDckIsWUFBTSxXQUFXLEtBQUssVUFBVSxLQUFLLFFBQVEsTUFBTSxTQUFTLElBQUksTUFBTSxJQUFJO0FBQzFFLFlBQU0sVUFBVSxXQUFXLEtBQUssUUFBUTtBQUN4QyxZQUFNLFVBQVUsV0FBVyxLQUFLLFFBQVE7QUFDeEMsV0FBSyxPQUFPO0FBQ1osV0FBSyxPQUFPLFdBQVcsU0FBUztBQUNoQyxXQUFLLE9BQU8sV0FBVyxTQUFTO0FBQ2hDLFdBQUssZUFBZTtBQUFBLElBQ3RCO0FBQ0EsU0FBSyxXQUFXLGlCQUFpQixTQUFTLE9BQU8sRUFBRSxTQUFTLE1BQU0sQ0FBQztBQUNuRSxTQUFLLGlCQUFpQixLQUFLLE1BQU0sS0FBSyxXQUFXLG9CQUFvQixTQUFTLEtBQUssQ0FBQztBQUVwRixVQUFNLGNBQWMsQ0FBQyxVQUE4QjtBQUNqRCxZQUFNLFNBQVMsTUFBTTtBQUNyQixVQUFJLE9BQU8sUUFBUSxXQUFXLEVBQUc7QUFDakMsVUFBSSxNQUFNLFdBQVcsS0FBSyxNQUFNLFdBQVcsRUFBRztBQUM5QyxXQUFLLFVBQVU7QUFDZixXQUFLLFdBQVcsRUFBRSxHQUFHLE1BQU0sU0FBUyxHQUFHLE1BQU0sU0FBUyxNQUFNLEtBQUssTUFBTSxNQUFNLEtBQUssS0FBSztBQUN2RixXQUFLLFdBQVcsa0JBQWtCLE1BQU0sU0FBUztBQUNqRCxXQUFLLFdBQVcsU0FBUyxZQUFZO0FBQ3JDLFdBQUssV0FBVyxJQUFJO0FBQUEsSUFDdEI7QUFDQSxVQUFNLGNBQWMsQ0FBQyxVQUE4QjtBQUNqRCxVQUFJLENBQUMsS0FBSyxRQUFTO0FBQ25CLFdBQUssT0FBTyxLQUFLLFNBQVMsT0FBTyxNQUFNLFVBQVUsS0FBSyxTQUFTO0FBQy9ELFdBQUssT0FBTyxLQUFLLFNBQVMsT0FBTyxNQUFNLFVBQVUsS0FBSyxTQUFTO0FBQy9ELFdBQUssZUFBZTtBQUFBLElBQ3RCO0FBQ0EsVUFBTSxZQUFZLENBQUMsVUFBOEI7QUFDL0MsVUFBSSxDQUFDLEtBQUssUUFBUztBQUNuQixXQUFLLFVBQVU7QUFDZixVQUFJLEtBQUssV0FBVyxrQkFBa0IsTUFBTSxTQUFTLEVBQUcsTUFBSyxXQUFXLHNCQUFzQixNQUFNLFNBQVM7QUFDN0csV0FBSyxXQUFXLFlBQVksWUFBWTtBQUFBLElBQzFDO0FBQ0EsU0FBSyxXQUFXLGlCQUFpQixlQUFlLFdBQVc7QUFDM0QsU0FBSyxXQUFXLGlCQUFpQixlQUFlLFdBQVc7QUFDM0QsU0FBSyxXQUFXLGlCQUFpQixhQUFhLFNBQVM7QUFDdkQsU0FBSyxXQUFXLGlCQUFpQixpQkFBaUIsU0FBUztBQUMzRCxTQUFLLGlCQUFpQixLQUFLLE1BQU07QUFDL0IsV0FBSyxXQUFXLG9CQUFvQixlQUFlLFdBQVc7QUFDOUQsV0FBSyxXQUFXLG9CQUFvQixlQUFlLFdBQVc7QUFDOUQsV0FBSyxXQUFXLG9CQUFvQixhQUFhLFNBQVM7QUFDMUQsV0FBSyxXQUFXLG9CQUFvQixpQkFBaUIsU0FBUztBQUFBLElBQ2hFLENBQUM7QUFFRCxTQUFLLGlCQUFpQixJQUFJLGVBQWUsTUFBTSxLQUFLLGVBQWUsQ0FBQztBQUNwRSxTQUFLLGVBQWUsUUFBUSxLQUFLLFVBQVU7QUFBQSxFQUM3QztBQUFBLEVBRVEsdUJBQTZCO0FBQ25DLGVBQVcsU0FBUyxLQUFLLGdCQUFpQixRQUFPLGFBQWEsS0FBSztBQUNuRSxTQUFLLGdCQUFnQixNQUFNO0FBQUEsRUFDN0I7QUFBQSxFQUVRLGlCQUFpQixNQUFjLE9BQWUsUUFBdUM7QUFDM0YsVUFBTSxTQUFTLEtBQUssVUFBVSxTQUFTLFVBQVUsRUFBRSxLQUFLLHFDQUFxQyxNQUFNLEVBQUUsY0FBYyxPQUFPLE9BQU8sTUFBTSxFQUFFLENBQUM7QUFDMUksa0NBQVEsUUFBUSxJQUFJO0FBQ3BCLFdBQU8saUJBQWlCLFNBQVMsTUFBTTtBQUNyQyxhQUFPO0FBQ1AsV0FBSyxNQUFNO0FBQUEsSUFDYixDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLHNCQUE0QjtBQUNsQyxTQUFLLFVBQVUsV0FBVyxFQUFFLEtBQUssd0JBQXdCLENBQUM7QUFBQSxFQUM1RDtBQUFBLEVBRVEsZ0JBQW1DO0FBQ3pDLFdBQU8sZ0JBQWdCLEtBQUssUUFBUSxtQkFBbUIsS0FBSyxTQUFTLFVBQVU7QUFBQSxFQUNqRjtBQUFBLEVBRVEsY0FBYyxZQUF1QztBQXB1Qy9EO0FBcXVDSSxRQUFJLFdBQVcsZUFBZSxRQUFTLFFBQU87QUFDOUMsUUFBSSxXQUFXLGVBQWUsT0FBUSxRQUFPO0FBQzdDLFFBQUksV0FBVyxlQUFlLGNBQVksZ0JBQVcsZUFBWCxtQkFBdUIsUUFBUSxRQUFPLElBQUksV0FBVyxXQUFXLEtBQUssRUFBRSxXQUFXLEtBQUssRUFBRSxDQUFDO0FBQ3BJLFFBQUksV0FBVyxlQUFlLE9BQVEsUUFBTztBQUM3QyxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRVEsZ0JBQWdCLFlBQXFDO0FBNXVDL0Q7QUE2dUNJLFVBQU0sY0FBYyxDQUFDLE1BQWMsVUFBb0M7QUFDckUsVUFBSSxNQUFPLE1BQUssT0FBTyxNQUFNLFlBQVksTUFBTSxLQUFLO0FBQUEsVUFDL0MsTUFBSyxPQUFPLE1BQU0sZUFBZSxJQUFJO0FBQUEsSUFDNUM7QUFDQSxnQkFBWSxnQkFBZ0IsV0FBVyxlQUFlO0FBQ3RELGdCQUFZLHVCQUF1QixXQUFXLFlBQVk7QUFDMUQsZ0JBQVksY0FBYyxXQUFXLFNBQVM7QUFDOUMsZ0JBQVksaUJBQWlCLFdBQVcsU0FBUztBQUNqRCxnQkFBWSxtQkFBbUIsV0FBVyxhQUFhO0FBQ3ZELGdCQUFZLGlCQUFpQixXQUFXLFNBQVM7QUFDakQsZ0JBQVksbUJBQW1CLFdBQVcsU0FBUztBQUNuRCxnQkFBWSxxQkFBcUIsV0FBVyxlQUFlO0FBQzNELFNBQUssT0FBTyxNQUFNLFlBQVkscUJBQXFCLEtBQUssY0FBYyxVQUFVLENBQUM7QUFDakYsU0FBSyxPQUFPLE1BQU0sWUFBWSxvQkFBb0IsSUFBRyxnQkFBVyxjQUFYLFlBQXdCLEdBQUcsSUFBSTtBQUNwRixTQUFLLE9BQU8sTUFBTSxZQUFZLDJCQUEyQixJQUFHLGdCQUFXLG9CQUFYLFlBQThCLENBQUMsSUFBSTtBQUMvRixTQUFLLFdBQVcsWUFBWSxnQkFBZ0IsV0FBVyxzQkFBc0IsTUFBTTtBQUNuRixTQUFLLFdBQVcsWUFBWSxnQkFBZ0IsV0FBVyxzQkFBc0IsTUFBTTtBQUNuRixTQUFLLFdBQVcsWUFBWSxnQkFBZ0IsQ0FBQyxXQUFXLHFCQUFxQixXQUFXLHNCQUFzQixNQUFNO0FBQUEsRUFDdEg7QUFBQSxFQUVRLG1CQUF5QjtBQWp3Q25DO0FBa3dDSSxTQUFLLGdCQUFnQixNQUFNO0FBQzNCLFVBQU0sYUFBYSxLQUFLLFNBQVM7QUFDakMsU0FBSyxnQkFBZ0IsWUFBWSxhQUFhLEVBQUMseUNBQVksV0FBVTtBQUNyRSxRQUFJLEVBQUMseUNBQVksWUFBWTtBQUU3QixVQUFNLFNBQVMsS0FBSyxnQkFBZ0IsU0FBUyxVQUFVO0FBQUEsTUFDckQsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLFFBQ0osTUFBTTtBQUFBLFFBQ04sT0FBTyx1Q0FBUyxXQUFXLFVBQVU7QUFBQSxNQUN2QztBQUFBLElBQ0YsQ0FBQztBQUNELGtDQUFRLFFBQVEsWUFBWTtBQUM1QixVQUFNLFNBQVMsT0FBTyxVQUFVLEVBQUUsS0FBSywrQkFBK0IsQ0FBQztBQUN2RSxXQUFPLFVBQVUsRUFBRSxLQUFLLCtCQUErQixNQUFNLHdDQUFTLHNCQUFXLGdCQUFYLGFBQTBCLGdCQUFXLFdBQVcsTUFBTSxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQXRDLG1CQUF5QyxRQUFRLGVBQWUsUUFBMUYsWUFBaUcsb0JBQUssR0FBRyxDQUFDO0FBQ2hMLFFBQUksV0FBVyxlQUFnQixRQUFPLFVBQVUsRUFBRSxLQUFLLDhCQUE4QixNQUFNLGlDQUFRLFdBQVcsY0FBYyxHQUFHLENBQUM7QUFDaEksV0FBTyxpQkFBaUIsU0FBUyxNQUFNLEtBQUssS0FBSyxVQUFVLGNBQWMsV0FBVyxZQUFZLFdBQVcsWUFBWSxDQUFDO0FBQ3hILFNBQUssZ0JBQWdCLFVBQVUsRUFBRSxLQUFLLDhCQUE4QixNQUFNLFdBQVcsV0FBVyxDQUFDO0FBQUEsRUFDbkc7QUFBQSxFQUVRLFNBQWU7QUF0eEN6QjtBQXV4Q0ksU0FBSyxxQkFBcUI7QUFDMUIsU0FBSyxpQkFBaUI7QUFDdEIsVUFBTSxhQUFhLEtBQUssY0FBYztBQUN0QyxTQUFLLGdCQUFnQixVQUFVO0FBQy9CLFNBQUssU0FBUyxjQUFjLEtBQUssU0FBUyxNQUFNLEtBQUssU0FBUyxTQUFRLGdCQUFXLGFBQVgsWUFBdUIsRUFBRTtBQUMvRixVQUFNLGlCQUFpQixXQUFXLG1CQUFtQixvQkFBb0IsS0FBSyxTQUFTLE1BQU0sV0FBVyxZQUFZLElBQUksb0JBQUksSUFBb0I7QUFDaEosU0FBSyxhQUFhLE1BQU07QUFDeEIsV0FBTyxLQUFLLFNBQVMsV0FBWSxNQUFLLFNBQVMsWUFBWSxLQUFLLFNBQVMsVUFBVTtBQUVuRixlQUFXLFlBQVksS0FBSyxPQUFPLE9BQU87QUFDeEMsVUFBSSxDQUFDLFNBQVMsU0FBVTtBQUN4QixZQUFNLFNBQVMsS0FBSyxPQUFPLEtBQUssSUFBSSxTQUFTLFFBQVE7QUFDckQsVUFBSSxDQUFDLE9BQVE7QUFDYixZQUFNLE9BQU8sU0FBUyxnQkFBZ0IsOEJBQThCLE1BQU07QUFDMUUsV0FBSyxhQUFhLEtBQUssU0FBUyxRQUFRLFdBQVUsZ0JBQVcsY0FBWCxZQUF3QixRQUFRLENBQUM7QUFDbkYsV0FBSyxhQUFhLFNBQVMsa0JBQWtCLEtBQUssSUFBSSxTQUFTLE9BQU8sQ0FBQyxDQUFDLEVBQUU7QUFDMUUsWUFBTSxjQUFjLGVBQWUsSUFBSSxTQUFTLEtBQUssRUFBRTtBQUN2RCxXQUFJLGNBQVMsS0FBSyxVQUFkLG1CQUFxQixNQUFPLE1BQUssTUFBTSxTQUFTLFNBQVMsS0FBSyxNQUFNO0FBQUEsZUFDL0QsWUFBYSxNQUFLLE1BQU0sU0FBUztBQUMxQyxXQUFLLE1BQU0sY0FBYyxHQUFHLGtCQUFrQixZQUFZLFNBQVMsS0FBSyxDQUFDO0FBQ3pFLFdBQUssU0FBUyxZQUFZLElBQUk7QUFBQSxJQUNoQztBQUVBLGVBQVcsWUFBWSxLQUFLLE9BQU8sT0FBTztBQUN4QyxZQUFNLE9BQU8sU0FBUztBQUN0QixZQUFNLFNBQVEsZ0JBQUssVUFBTCxtQkFBWSxVQUFaLFlBQXFCLEtBQUssUUFBUTtBQUNoRCxZQUFNLFVBQVUsQ0FBQyxZQUFZLFNBQVMsVUFBVSxJQUFJLFlBQVksSUFBSSxTQUFTLEtBQUssRUFBRSxFQUFFLE9BQU8sT0FBTyxFQUFFLEtBQUssR0FBRztBQUM5RyxZQUFNLFNBQVMsS0FBSyxhQUFhLFVBQVUsRUFBRSxLQUFLLFFBQVEsQ0FBQztBQUMzRCxhQUFPLFFBQVEsU0FBUyxLQUFLO0FBQzdCLGFBQU8sTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDO0FBQ2pDLGFBQU8sTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDO0FBQ2hDLGFBQU8sTUFBTSxRQUFRLEdBQUcsU0FBUyxLQUFLO0FBQ3RDLGFBQU8sTUFBTSxZQUFZLEdBQUcsU0FBUyxNQUFNO0FBQzNDLGFBQU8sWUFBWSxTQUFTLFFBQVE7QUFDcEMsVUFBSSxLQUFLLGVBQWUsS0FBSyxHQUFJLFFBQU8sU0FBUyxhQUFhO0FBQzlELFVBQUksS0FBSyxlQUFlLGVBQWUsSUFBSSxFQUFFLFNBQVMsS0FBSyxXQUFXLEVBQUcsUUFBTyxTQUFTLGlCQUFpQjtBQUMxRyxVQUFJLEtBQUssS0FBTSxRQUFPLFNBQVMsUUFBUSxLQUFLLElBQUksRUFBRTtBQUNsRCxZQUFNLFNBQVMsU0FBUyxVQUFVO0FBQ2xDLFlBQU0sUUFBTyxzQkFBSyxVQUFMLG1CQUFZLFNBQVosWUFBb0IsV0FBVyxTQUEvQixZQUF1QztBQUNwRCxZQUFNLFVBQVMsc0JBQUssVUFBTCxtQkFBWSxXQUFaLFlBQXNCLFdBQVcsV0FBakMsWUFBMkM7QUFDMUQsWUFBTSxhQUFZLHNCQUFLLFVBQUwsbUJBQVksY0FBWixZQUF5QixXQUFXLGNBQXBDLFlBQWlEO0FBQ25FLFVBQUksS0FBTSxRQUFPLFNBQVMsU0FBUztBQUNuQyxVQUFJLE9BQVEsUUFBTyxTQUFTLFdBQVc7QUFDdkMsVUFBSSxVQUFXLFFBQU8sU0FBUyxlQUFlO0FBQzlDLFVBQUksS0FBSyxLQUFNLFFBQU8sUUFBUSxTQUFTLEtBQUssSUFBSTtBQUNoRCxZQUFNLGNBQWMsZUFBZSxJQUFJLEtBQUssRUFBRTtBQUM5QyxXQUFJLFVBQUssVUFBTCxtQkFBWSxNQUFPLFFBQU8sTUFBTSxrQkFBa0IsS0FBSyxNQUFNO0FBQUEsZUFDeEQsVUFBVSxXQUFXLFVBQVcsUUFBTyxNQUFNLGtCQUFrQixXQUFXO0FBQUEsZUFDMUUsQ0FBQyxVQUFVLFdBQVcsVUFBVyxRQUFPLE1BQU0sa0JBQWtCLFdBQVc7QUFDcEYsV0FBSSxVQUFLLFVBQUwsbUJBQVksVUFBVyxRQUFPLE1BQU0sUUFBUSxLQUFLLE1BQU07QUFBQSxlQUNsRCxVQUFVLFdBQVcsY0FBZSxRQUFPLE1BQU0sUUFBUSxXQUFXO0FBQUEsZUFDcEUsQ0FBQyxVQUFVLFdBQVcsVUFBVyxRQUFPLE1BQU0sUUFBUSxXQUFXO0FBQzFFLFdBQUksVUFBSyxVQUFMLG1CQUFZLFlBQWEsUUFBTyxNQUFNLGNBQWMsS0FBSyxNQUFNO0FBQUEsZUFDMUQsQ0FBQyxVQUFVLFlBQWEsUUFBTyxNQUFNLGNBQWM7QUFBQSxlQUNuRCxDQUFDLFVBQVUsV0FBVyxnQkFBaUIsUUFBTyxNQUFNLGNBQWMsV0FBVztBQUN0RixhQUFPLE1BQU0sY0FBYyxJQUFHLHNCQUFLLFVBQUwsbUJBQVksZ0JBQVosWUFBMkIsV0FBVyxvQkFBdEMsWUFBMEQsU0FBUyxJQUFJLENBQUU7QUFFdkcsWUFBTSxVQUFVLE9BQU8sVUFBVSxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFDNUQsWUFBTSxTQUFTLGtCQUFrQixJQUFJO0FBQ3JDLFlBQU0sZUFBZSxPQUFPLEtBQUssQ0FBQyxVQUFVLE1BQU0sU0FBUyxVQUFVLE1BQU0sS0FBSyxLQUFLLENBQUM7QUFDdEYsV0FBSyxLQUFLLFFBQVEsS0FBSyxTQUFTLENBQUMsY0FBYztBQUM3QyxjQUFNLE9BQU8sUUFBUSxVQUFVLEVBQUUsS0FBSyxtQ0FBbUMsQ0FBQztBQUMxRSxZQUFJLEtBQUssTUFBTTtBQUNiLGdCQUFNLE9BQU8sS0FBSyxXQUFXLEVBQUUsS0FBSyxzQkFBc0IsS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLFNBQVMsU0FBUyxXQUFNLEtBQUssU0FBUyxVQUFVLFdBQU0sU0FBSSxDQUFDO0FBQzdJLGVBQUssUUFBUSxjQUFjLEtBQUssU0FBUyxTQUFTLHVCQUFRLEtBQUssU0FBUyxVQUFVLHVCQUFRLGNBQUk7QUFBQSxRQUNoRztBQUNBLFlBQUksS0FBSyxLQUFNLE1BQUssV0FBVyxFQUFFLEtBQUssaUJBQWlCLE1BQU0sS0FBSyxLQUFLLENBQUM7QUFBQSxNQUMxRTtBQUNBLFVBQUksaUJBQWlCO0FBQ3JCLGlCQUFXLFNBQVMsUUFBUTtBQUMxQixZQUFJLE1BQU0sU0FBUyxTQUFTO0FBQzFCLGdCQUFNLE9BQU8sUUFBUSxVQUFVLEVBQUUsS0FBSyx1QkFBdUIsQ0FBQztBQUM5RCxnQkFBTSxRQUFRLEtBQUssU0FBUyxPQUFPLEVBQUUsS0FBSyw2QkFBNkIsTUFBTSxFQUFFLE1BQUssV0FBTSxRQUFOLFlBQWMsY0FBYyxJQUFJLEtBQUssZUFBTSxFQUFFLENBQUM7QUFDbEksZ0JBQU0sYUFBYSxLQUFLLFFBQVEsdUJBQzVCLHNCQUFzQixPQUFPLEtBQUssUUFBUSw2QkFBNkIsSUFDdkUsc0JBQXNCLE9BQU8sS0FBSyxFQUFFLE1BQU0sR0FBRyxDQUFDO0FBQ2xELGNBQUksaUJBQWdDO0FBQ3BDLGNBQUksZUFBZTtBQUNuQixjQUFJLGVBQThCO0FBQ2xDLGdCQUFNLG9CQUFvQixNQUFZO0FBQ3BDLGdCQUFJLGlCQUFpQixLQUFNO0FBQzNCLG1CQUFPLGFBQWEsWUFBWTtBQUNoQyxpQkFBSyxnQkFBZ0IsT0FBTyxZQUFZO0FBQ3hDLDJCQUFlO0FBQUEsVUFDakI7QUFDQSxnQkFBTSxvQkFBb0IsQ0FBQyxXQUF5QjtBQTUyQzlELGdCQUFBVixLQUFBQztBQTYyQ1ksa0JBQU0sVUFBU0QsTUFBQSxNQUFNLGtCQUFOLGdCQUFBQSxJQUFxQixLQUFLLENBQUMsU0FBUyxLQUFLLFFBQVE7QUFDaEUsZ0JBQUksQ0FBQyxPQUFRO0FBQ2IsbUJBQU8saUJBQWdCLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQzlDLG1CQUFPLGVBQWUsS0FBSyxJQUFJLE9BQVVDLE1BQUEsT0FBTyxpQkFBUCxPQUFBQSxNQUF1QixLQUFLLENBQUM7QUFBQSxVQUN4RTtBQUNBLGdCQUFNLGVBQWUsQ0FBQyxVQUF3QjtBQUM1Qyw4QkFBa0I7QUFDbEIsa0JBQU0sWUFBWSxXQUFXLEtBQUs7QUFDbEMsNEJBQWdCO0FBQ2hCLGtCQUFNLFFBQVE7QUFDZCxnQkFBSSxDQUFDLFdBQVc7QUFDZCwrQkFBaUI7QUFDakIsb0JBQU0sZ0JBQWdCLEtBQUs7QUFDM0Isb0JBQU0sWUFBWSxZQUFZO0FBQzlCLG9CQUFNLFNBQVMsZUFBZTtBQUM5QixvQkFBTSxRQUFRLFNBQVMsOERBQVk7QUFDbkMsbUJBQUssVUFBVSxTQUFTLEtBQUssWUFBWSxDQUFDO0FBQzFDLG1CQUFLLFdBQVc7QUFDaEI7QUFBQSxZQUNGO0FBQ0Esa0JBQU0sV0FBVyxLQUFLLFVBQVUsYUFBYSxVQUFVLE1BQU07QUFDN0QsZ0JBQUksQ0FBQyxVQUFVO0FBQ2IsZ0NBQWtCLFVBQVUsTUFBTTtBQUNsQywyQkFBYSxRQUFRLENBQUM7QUFDdEI7QUFBQSxZQUNGO0FBQ0Esa0JBQU0sUUFBUSxJQUFJLE1BQU07QUFDeEIsa0JBQU0sT0FBTyxNQUFZO0FBQ3ZCLGtCQUFJLFVBQVUsYUFBYztBQUM1QixnQ0FBa0I7QUFDbEIsZ0NBQWtCLFVBQVUsTUFBTTtBQUNsQyxrQkFBSSxLQUFLLFFBQVEscUJBQXNCLGNBQWEsUUFBUSxDQUFDO0FBQUEsbUJBQ3hEO0FBQ0gsc0JBQU0sWUFBWSxZQUFZO0FBQzlCLHNCQUFNLFNBQVMsZUFBZTtBQUM5QixzQkFBTSxRQUFRLFNBQVMsNkNBQVUsVUFBVSxNQUFNLEVBQUU7QUFBQSxjQUNyRDtBQUFBLFlBQ0Y7QUFDQSxrQkFBTSxTQUFTLE1BQU07QUFuNUNqQyxrQkFBQUQsS0FBQUM7QUFvNUNjLGtCQUFJLFVBQVUsZ0JBQWdCLE1BQU0sZ0JBQWdCLEVBQUc7QUFDdkQsZ0NBQWtCO0FBQ2xCLCtCQUFpQjtBQUNqQixvQkFBTSxNQUFNO0FBQ1osb0JBQU0sWUFBWSxZQUFZO0FBQzlCLG9CQUFNLFlBQVksZUFBZTtBQUNqQyxvQkFBTSxRQUFRLFNBQVMsVUFBVSxJQUFJLHlDQUFXLDZDQUFVLFVBQVUsS0FBSyxFQUFFO0FBQzNFLG9CQUFNLFdBQVcsVUFBVSxXQUFXLE1BQU07QUFDNUMsb0JBQU0sVUFBU0QsTUFBQSxNQUFNLGtCQUFOLGdCQUFBQSxJQUFxQixLQUFLLENBQUMsU0FBUyxLQUFLLFFBQVEsVUFBVTtBQUMxRSxrQkFBSSxPQUFRLFFBQU8saUJBQWdCLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQzFELGtCQUFJLENBQUMsU0FBVTtBQUNmLG9CQUFNLFlBQVdDLE1BQUEsTUFBTSxrQkFBTixnQkFBQUEsSUFBcUIsS0FBSyxDQUFDLFNBQVMsS0FBSyxRQUFRLE1BQU07QUFDeEUsb0JBQU0sU0FBUyxVQUFVO0FBQ3pCLG1DQUFxQixJQUFJO0FBQ3pCLG1CQUFLLFVBQVUsU0FBUyxLQUFLLFlBQVksQ0FBQztBQUMxQyxtQkFBSyxXQUFXO0FBQ2hCLG9CQUFNLGlCQUFnQixxQ0FBVSxhQUFZO0FBQzVDLGtCQUFJLHdCQUFPLDBEQUFhLGFBQWEsbUNBQVUsVUFBVSxLQUFLLElBQUksR0FBSTtBQUFBLFlBQ3hFO0FBQ0Esa0JBQU0sVUFBVTtBQUNoQixrQkFBTSxZQUFZLEtBQUssSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJLEtBQUssUUFBUSwyQkFBMkIsQ0FBQyxJQUFJO0FBQ3hGLDJCQUFlLE9BQU8sV0FBVyxNQUFNLFNBQVM7QUFDaEQsaUJBQUssZ0JBQWdCLElBQUksWUFBWTtBQUNyQyxrQkFBTSxNQUFNO0FBQUEsVUFDZDtBQUNBLGdCQUFNLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQTc2Q3JELGdCQUFBRDtBQTg2Q1ksa0JBQU0sZ0JBQWdCO0FBQ3RCLGdCQUFJLGVBQWdCLEtBQUksa0JBQWtCLEtBQUssS0FBSyxpQkFBZ0JBLE1BQUEsTUFBTSxRQUFOLE9BQUFBLE1BQWEsMEJBQU0sRUFBRSxLQUFLO0FBQUEsVUFDaEcsQ0FBQztBQUNELHVCQUFhLENBQUM7QUFDZDtBQUFBLFFBQ0Y7QUFDQSxZQUFJLENBQUMsTUFBTSxLQUFLLEtBQUssRUFBRztBQUN4QixjQUFNLE9BQU8sUUFBUSxVQUFVLEVBQUUsS0FBSyxvQ0FBb0MsQ0FBQztBQUMzRSxZQUFJLENBQUMsa0JBQWtCLEtBQUssTUFBTTtBQUNoQyxnQkFBTSxPQUFPLEtBQUssV0FBVyxFQUFFLEtBQUssc0JBQXNCLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxTQUFTLFNBQVMsV0FBTSxLQUFLLFNBQVMsVUFBVSxXQUFNLFNBQUksQ0FBQztBQUM3SSxlQUFLLFFBQVEsY0FBYyxLQUFLLFNBQVMsU0FBUyx1QkFBUSxLQUFLLFNBQVMsVUFBVSx1QkFBUSxjQUFJO0FBQUEsUUFDaEc7QUFDQSxZQUFJLENBQUMsa0JBQWtCLEtBQUssS0FBTSxNQUFLLFdBQVcsRUFBRSxLQUFLLGlCQUFpQixNQUFNLEtBQUssS0FBSyxDQUFDO0FBQzNGLHlCQUFpQjtBQUNqQixjQUFNLFNBQVMsS0FBSyxVQUFVLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQztBQUN0RCwyQkFBbUIsUUFBUSxNQUFNLFVBQVUsTUFBTSxJQUFJO0FBQ3JELGVBQU8sTUFBTSxXQUFXLElBQUcsc0JBQUssVUFBTCxtQkFBWSxhQUFaLFlBQXdCLFdBQVcsYUFBbkMsWUFBK0MsRUFBRTtBQUM1RSxlQUFPLFFBQVEsY0FBYyxNQUFNLElBQUk7QUFBQSxNQUN6QztBQUVBLFVBQUksS0FBSyxRQUFRO0FBQ2YsY0FBTSxlQUFlLFFBQVEsU0FBUyxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSxFQUFFLGNBQWMsbUNBQVMsVUFBSyxPQUFPLFVBQVosWUFBcUIsS0FBSyxPQUFPLElBQUksR0FBRyxFQUFFLENBQUM7QUFDcEosc0NBQVEsY0FBYyxTQUFTO0FBQy9CLHFCQUFhLFdBQVcsRUFBRSxPQUFNLGdCQUFLLE9BQU8sVUFBWixhQUFxQixVQUFLLE9BQU8sS0FBSyxNQUFNLEdBQUcsRUFBRSxHQUFHLEVBQUUsTUFBakMsbUJBQW9DLFFBQVEsZUFBZSxRQUFoRixZQUF1RixxQkFBTSxDQUFDO0FBQzlILHFCQUFhLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUNoRCxnQkFBTSxnQkFBZ0I7QUFDdEIsZUFBSyxLQUFLLFVBQVUsY0FBYyxLQUFLLE9BQVEsSUFBSTtBQUFBLFFBQ3JELENBQUM7QUFBQSxNQUNIO0FBRUEsVUFBSSxLQUFLLE1BQU8sTUFBSyxnQkFBZ0IsU0FBUyxJQUFJO0FBQ2xELFVBQUksS0FBSyxLQUFNLE1BQUssZUFBZSxTQUFTLElBQUk7QUFFaEQsV0FBSSxVQUFLLFNBQUwsbUJBQVcsUUFBUTtBQUNyQixjQUFNLE9BQU8sUUFBUSxVQUFVLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQztBQUN2RCxhQUFLLEtBQUssTUFBTSxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUMsUUFBUSxLQUFLLFdBQVcsRUFBRSxLQUFLLGdCQUFnQixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztBQUFBLE1BQ2xHO0FBRUEsVUFBSSxLQUFLLFFBQVEsb0JBQW9CLEtBQUssU0FBUyxRQUFRO0FBQ3pELGNBQU0sV0FBVyxnQkFBZ0IsSUFBSTtBQUNyQyxZQUFJLFNBQVMsT0FBTztBQUNsQixnQkFBTSxVQUFVLEtBQUssTUFBTyxTQUFTLE9BQU8sU0FBUyxRQUFTLEdBQUc7QUFDakUsZ0JBQU0sYUFBYSxPQUFPLFVBQVUsRUFBRSxLQUFLLHFCQUFxQixNQUFNLEVBQUUsT0FBTyxHQUFHLFNBQVMsSUFBSSxJQUFJLFNBQVMsS0FBSyx3Q0FBVSxFQUFFLENBQUM7QUFDOUgscUJBQVcsVUFBVSxFQUFFLEtBQUsseUJBQXlCLE1BQU0sRUFBRSxPQUFPLFNBQVMsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUMzRixxQkFBVyxXQUFXLEVBQUUsTUFBTSxHQUFHLE9BQU8sSUFBSSxDQUFDO0FBQUEsUUFDL0M7QUFBQSxNQUNGO0FBRUEsVUFBSSxLQUFLLFNBQVMsUUFBUTtBQUN4QixjQUFNLE9BQU8sT0FBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLG1CQUFtQixNQUFNLEVBQUUsY0FBYyxLQUFLLFlBQVksaUJBQU8sZUFBSyxFQUFFLENBQUM7QUFDdkgsYUFBSyxRQUFRLEtBQUssWUFBWSxJQUFJLEtBQUssU0FBUyxNQUFNLEtBQUssUUFBRztBQUM5RCxhQUFLLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUN4QyxnQkFBTSxnQkFBZ0I7QUFDdEIsZUFBSyxXQUFXLEtBQUssRUFBRTtBQUN2QixlQUFLLGVBQWU7QUFBQSxRQUN0QixDQUFDO0FBQUEsTUFDSDtBQUVBLFlBQU0sT0FBTyxLQUFLLFlBQVksSUFBSTtBQUNsQyxVQUFJLE1BQU07QUFDUixjQUFNLGFBQWEsT0FBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixNQUFNLEVBQUUsY0FBYyxnQkFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQzNHLHNDQUFRLFlBQVksZUFBZTtBQUNuQyxtQkFBVyxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFDOUMsZ0JBQU0sZ0JBQWdCO0FBQ3RCLGVBQUssS0FBSyxVQUFVLFdBQVcsSUFBSTtBQUFBLFFBQ3JDLENBQUM7QUFBQSxNQUNIO0FBRUEsYUFBTyxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFDMUMsY0FBTSxnQkFBZ0I7QUFDdEIsYUFBSyxXQUFXLEtBQUssRUFBRTtBQUFBLE1BQ3pCLENBQUM7QUFDRCxhQUFPLGlCQUFpQixZQUFZLENBQUMsVUFBVTtBQUM3QyxjQUFNLGdCQUFnQjtBQUN0QixhQUFLLFdBQVcsS0FBSyxFQUFFO0FBQ3ZCLGFBQUssYUFBYTtBQUFBLE1BQ3BCLENBQUM7QUFDRCxhQUFPLGlCQUFpQixlQUFlLENBQUMsVUFBVTtBQUNoRCxjQUFNLGVBQWU7QUFDckIsY0FBTSxnQkFBZ0I7QUFDdEIsYUFBSyxXQUFXLEtBQUssRUFBRTtBQUN2QixhQUFLLGdCQUFnQixLQUFLO0FBQUEsTUFDNUIsQ0FBQztBQUNELGFBQU8saUJBQWlCLGFBQWEsQ0FBQyxVQUFVO0FBamdEdEQsWUFBQUE7QUFrZ0RRLGFBQUssYUFBYSxLQUFLO0FBQ3ZCLFNBQUFBLE1BQUEsTUFBTSxpQkFBTixnQkFBQUEsSUFBb0IsUUFBUSxjQUFjLEtBQUs7QUFDL0MsWUFBSSxNQUFNLGFBQWMsT0FBTSxhQUFhLGdCQUFnQjtBQUMzRCxlQUFPLFNBQVMsYUFBYTtBQUFBLE1BQy9CLENBQUM7QUFDRCxhQUFPLGlCQUFpQixZQUFZLENBQUMsVUFBVTtBQUM3QyxZQUFJLENBQUMsS0FBSyxZQUFZLEtBQUssWUFBWSxLQUFLLEVBQUUsRUFBRztBQUNqRCxjQUFNLGVBQWU7QUFDckIsWUFBSSxNQUFNLGFBQWMsT0FBTSxhQUFhLGFBQWE7QUFDeEQsZUFBTyxTQUFTLGdCQUFnQjtBQUFBLE1BQ2xDLENBQUM7QUFDRCxhQUFPLGlCQUFpQixhQUFhLE1BQU0sT0FBTyxZQUFZLGdCQUFnQixDQUFDO0FBQy9FLGFBQU8saUJBQWlCLFFBQVEsQ0FBQyxVQUFVO0FBOWdEakQsWUFBQUEsS0FBQUMsS0FBQUM7QUErZ0RRLGNBQU0sZUFBZTtBQUNyQixlQUFPLFlBQVksZ0JBQWdCO0FBQ25DLGNBQU0sYUFBWUEsT0FBQUQsTUFBQSxLQUFLLGVBQUwsT0FBQUEsT0FBbUJELE1BQUEsTUFBTSxpQkFBTixnQkFBQUEsSUFBb0IsUUFBUSxrQkFBL0MsT0FBQUUsTUFBZ0U7QUFDbEYsWUFBSSxVQUFXLE1BQUssYUFBYSxXQUFXLEtBQUssRUFBRTtBQUFBLE1BQ3JELENBQUM7QUFDRCxhQUFPLGlCQUFpQixXQUFXLE1BQU07QUFDdkMsYUFBSyxhQUFhO0FBQ2xCLGFBQUssYUFBYSxpQkFBaUIsK0JBQStCLEVBQUUsUUFBUSxDQUFDLFlBQVksUUFBUSxjQUFjLENBQUMsZUFBZSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQUEsTUFDbkosQ0FBQztBQUFBLElBQ0g7QUFDQSxTQUFLLGVBQWU7QUFBQSxFQUN0QjtBQUFBLEVBRVEsaUJBQXVCO0FBNWhEakM7QUE2aERJLFVBQU0sT0FBTyxLQUFLLFdBQVcsc0JBQXNCO0FBQ25ELFNBQUssUUFBUSxNQUFNLFlBQVksYUFBYSxLQUFLLFFBQVEsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLFNBQVMsSUFBSSxLQUFLLElBQUksYUFBYSxLQUFLLElBQUk7QUFDOUgsU0FBSyxPQUFPLE1BQU0sWUFBWSxjQUFjLE9BQU8sS0FBSyxJQUFJLENBQUM7QUFDN0QsZUFBSyxpQkFBTCxtQkFBbUIsUUFBUSxHQUFHLEtBQUssTUFBTSxLQUFLLE9BQU8sR0FBRyxDQUFDO0FBQUEsRUFDM0Q7QUFBQSxFQUVRLFdBQVcsSUFBeUI7QUFuaUQ5QztBQW9pREksU0FBSyxhQUFhLGtCQUFNO0FBQ3hCLFNBQUssYUFBYSxpQkFBaUIsdUJBQXVCLEVBQUUsUUFBUSxDQUFDLFlBQVksUUFBUSxZQUFZLGFBQWEsQ0FBQztBQUNuSCxRQUFJLEdBQUksWUFBSyxhQUFhLGNBQTJCLDJCQUEyQixJQUFJLE9BQU8sRUFBRSxDQUFDLElBQUksTUFBMUYsbUJBQTZGLFNBQVM7QUFBQSxFQUNoSDtBQUFBLEVBRVEsZUFBbUM7QUFDekMsV0FBTyxLQUFLLGFBQWEsU0FBUyxLQUFLLFNBQVMsTUFBTSxLQUFLLFVBQVUsSUFBSTtBQUFBLEVBQzNFO0FBQUEsRUFFUSxxQkFBcUIsT0FBTyxzQkFBb0I7QUFDdEQsVUFBTSxPQUFPLFdBQVcsSUFBSTtBQUM1QixRQUFJLEtBQUssUUFBUSxxQkFBcUIsVUFBVyxNQUFLLFFBQVEsRUFBRSxPQUFPLEtBQUssUUFBUSxpQkFBaUI7QUFDckcsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLFdBQWlCO0FBbmpEM0I7QUFvakRJLFVBQU0sWUFBVyxVQUFLLGFBQWEsTUFBbEIsWUFBdUIsS0FBSyxTQUFTO0FBQ3RELFVBQU0sT0FBTyxLQUFLLHFCQUFxQjtBQUN2QyxTQUFLLE9BQU8sTUFBTTtBQUNoQixlQUFTLFlBQVk7QUFDckIsZUFBUyxTQUFTLEtBQUssSUFBSTtBQUMzQixXQUFLLGFBQWEsS0FBSztBQUFBLElBQ3pCLENBQUM7QUFDRCxTQUFLLGFBQWE7QUFBQSxFQUNwQjtBQUFBLEVBRVEsYUFBbUI7QUFDekIsVUFBTSxXQUFXLEtBQUssYUFBYTtBQUNuQyxRQUFJLENBQUMsWUFBWSxTQUFTLE9BQU8sS0FBSyxTQUFTLEtBQUssSUFBSTtBQUN0RCxXQUFLLFNBQVM7QUFDZDtBQUFBLElBQ0Y7QUFDQSxVQUFNLFNBQVMsV0FBVyxLQUFLLFNBQVMsTUFBTSxTQUFTLEVBQUU7QUFDekQsUUFBSSxDQUFDLE9BQVE7QUFDYixVQUFNLE9BQU8sS0FBSyxxQkFBcUI7QUFDdkMsU0FBSyxPQUFPLE1BQU07QUFDaEIsWUFBTSxRQUFRLE9BQU8sU0FBUyxVQUFVLENBQUMsVUFBVSxNQUFNLE9BQU8sU0FBUyxFQUFFO0FBQzNFLGFBQU8sU0FBUyxPQUFPLFFBQVEsR0FBRyxHQUFHLElBQUk7QUFDekMsV0FBSyxhQUFhLEtBQUs7QUFBQSxJQUN6QixDQUFDO0FBQ0QsU0FBSyxhQUFhO0FBQUEsRUFDcEI7QUFBQSxFQUVRLGVBQXFCO0FBQzNCLFVBQU0sV0FBVyxLQUFLLGFBQWE7QUFDbkMsUUFBSSxDQUFDLFNBQVU7QUFDZixRQUFJLGtCQUFrQjtBQUN0QixRQUFJLGNBQWMsS0FBSyxLQUFLLFVBQVUsS0FBSyxRQUFRLGtCQUFrQjtBQUFBLE1BQ25FLGNBQWMsS0FBSyxVQUFVO0FBQUEsTUFDN0IsbUJBQW1CLEtBQUssVUFBVTtBQUFBLE1BQ2xDLGVBQWUsS0FBSyxVQUFVO0FBQUEsTUFDOUIseUJBQXlCLEtBQUssVUFBVTtBQUFBLE1BQ3hDLGVBQWUsS0FBSyxVQUFVO0FBQUEsTUFDOUIsbUJBQW1CLEtBQUssVUFBVTtBQUFBLElBQ3BDLEdBQUcsQ0FBQyxXQUFXO0FBR2IsVUFBSSxDQUFDLGlCQUFpQjtBQUNwQixhQUFLLFFBQVEsS0FBSyxLQUFLLFVBQVUsS0FBSyxRQUFRLENBQUM7QUFDL0MsYUFBSyxZQUFZO0FBQ2pCLGFBQUssU0FBUyxDQUFDO0FBQ2YsMEJBQWtCO0FBQUEsTUFDcEI7QUFDQSxlQUFTLFVBQVUsT0FBTztBQUMxQiwyQkFBcUIsUUFBUTtBQUM3QixlQUFTLE9BQU8sT0FBTyxRQUFRO0FBQy9CLGVBQVMsT0FBTyxPQUFPLFFBQVE7QUFDL0IsZUFBUyxPQUFPLE9BQU8sUUFBUTtBQUMvQixlQUFTLE9BQU8sT0FBTyxLQUFLLFNBQVMsT0FBTyxPQUFPO0FBQ25ELGVBQVMsT0FBTyxPQUFPO0FBQ3ZCLFlBQU0sUUFBUTtBQUFBLFFBQ1osT0FBTyxPQUFPO0FBQUEsUUFDZCxXQUFXLE9BQU87QUFBQSxRQUNsQixhQUFhLE9BQU87QUFBQSxRQUNwQixhQUFhLE9BQU87QUFBQSxRQUNwQixPQUFPLE9BQU87QUFBQSxRQUNkLE1BQU0sT0FBTztBQUFBLFFBQ2IsUUFBUSxPQUFPO0FBQUEsUUFDZixXQUFXLE9BQU87QUFBQSxRQUNsQixVQUFVLE9BQU87QUFBQSxNQUNuQjtBQUNBLGVBQVMsUUFBUSxPQUFPLE9BQU8sS0FBSyxFQUFFLEtBQUssQ0FBQyxVQUFVLFVBQVUsTUFBUyxJQUFJLFFBQVE7QUFDckYsVUFBSSxTQUFTLE9BQU8sS0FBSyxTQUFTLEtBQUssSUFBSTtBQUN6QyxjQUFNLFFBQVEsY0FBYyxRQUFRO0FBQ3BDLFlBQUksTUFBTyxNQUFLLFNBQVMsUUFBUTtBQUFBLE1BQ25DO0FBQ0EsV0FBSyxVQUFVLFNBQVMsS0FBSyxZQUFZLENBQUM7QUFDMUMsV0FBSyxXQUFXO0FBQ2hCLFdBQUssT0FBTztBQUFBLElBQ2QsQ0FBQyxFQUFFLEtBQUs7QUFBQSxFQUNWO0FBQUEsRUFFUSxpQkFBdUI7QUFDN0IsVUFBTSxXQUFXLEtBQUssYUFBYTtBQUNuQyxRQUFJLENBQUMsWUFBWSxTQUFTLE9BQU8sS0FBSyxTQUFTLEtBQUssSUFBSTtBQUN0RCxVQUFJLHdCQUFPLDRDQUFTO0FBQ3BCO0FBQUEsSUFDRjtBQUNBLFVBQU0sU0FBUyxXQUFXLEtBQUssU0FBUyxNQUFNLFNBQVMsRUFBRTtBQUN6RCxTQUFLLE9BQU8sTUFBTTtBQXZvRHRCO0FBd29ETSxpQkFBVyxLQUFLLFNBQVMsTUFBTSxTQUFTLEVBQUU7QUFDMUMsV0FBSyxjQUFhLHNDQUFRLE9BQVIsWUFBYyxLQUFLLFNBQVMsS0FBSztBQUFBLElBQ3JELENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFUSxpQkFBdUI7QUFDN0IsVUFBTSxXQUFXLEtBQUssYUFBYTtBQUNuQyxRQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsU0FBUyxPQUFRO0FBQzVDLFNBQUssT0FBTyxNQUFNO0FBQUUsZUFBUyxZQUFZLENBQUMsU0FBUztBQUFBLElBQVcsQ0FBQztBQUFBLEVBQ2pFO0FBQUEsRUFFUSxZQUFrQjtBQUN4QixVQUFNLFdBQVcsS0FBSyxhQUFhO0FBQ25DLFFBQUksQ0FBQyxTQUFVO0FBQ2YsVUFBTSxPQUErQyxFQUFFLElBQUksUUFBUSxNQUFNLFNBQVMsT0FBTyxRQUFRLE1BQU0sT0FBVTtBQUNqSCxTQUFLLE9BQU8sTUFBTTtBQXZwRHRCO0FBdXBEd0IsZUFBUyxPQUFPLE1BQUssY0FBUyxTQUFULFlBQWlCLEVBQUU7QUFBQSxJQUFHLENBQUM7QUFBQSxFQUNsRTtBQUFBLEVBRVEsZUFBcUI7QUFDM0IsU0FBSyxPQUFPLE1BQU07QUFBRSxXQUFLLFNBQVMsU0FBUyxLQUFLLFNBQVMsV0FBVyxVQUFVLGFBQWE7QUFBQSxJQUFTLENBQUM7QUFDckcsV0FBTyxXQUFXLE1BQU0sS0FBSyxVQUFVLEdBQUcsRUFBRTtBQUFBLEVBQzlDO0FBQUEsRUFFUSxpQkFBdUI7QUFDN0IsUUFBSTtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSyxjQUFjO0FBQUEsTUFDbkIsQ0FBQyxlQUFlLEtBQUssT0FBTyxNQUFNO0FBQUUsYUFBSyxTQUFTLGFBQWE7QUFBQSxNQUFZLENBQUM7QUFBQSxNQUM1RSxNQUFNLEtBQUssT0FBTyxNQUFNO0FBQUUsYUFBSyxTQUFTLGFBQWE7QUFBQSxNQUFXLENBQUM7QUFBQSxJQUNuRSxFQUFFLEtBQUs7QUFBQSxFQUNUO0FBQUEsRUFFUSxZQUFrQjtBQXhxRDVCO0FBeXFESSxVQUFNLFlBQVcsVUFBSyxhQUFhLE1BQWxCLFlBQXVCLEtBQUssU0FBUztBQUN0RCxRQUFJLGVBQWUsS0FBSyxLQUFLLFNBQVMsT0FBTyxDQUFDLFVBQVU7QUFDdEQsV0FBSyxPQUFPLE1BQU07QUFBRSxpQkFBUyxRQUFRO0FBQUEsTUFBTyxDQUFDO0FBQUEsSUFDL0MsQ0FBQyxFQUFFLEtBQUs7QUFBQSxFQUNWO0FBQUEsRUFFUSx5QkFBK0I7QUEvcUR6QztBQWdyREksVUFBTSxZQUFXLFVBQUssYUFBYSxNQUFsQixZQUF1QixLQUFLLFNBQVM7QUFDdEQsVUFBTSxRQUFRLGdCQUFnQixRQUFRO0FBQ3RDLFFBQUksQ0FBQyxPQUFPO0FBQUUsVUFBSSx3QkFBTyxnRkFBZTtBQUFHO0FBQUEsSUFBUTtBQUNuRCxTQUFLLE9BQU8sTUFBTTtBQUNoQixlQUFTLFFBQVE7QUFDakIsZUFBUyxZQUFZO0FBQUEsSUFDdkIsQ0FBQztBQUNELFFBQUksd0JBQU8sb0hBQXFCO0FBQUEsRUFDbEM7QUFBQSxFQUVRLGNBQW9CO0FBQzFCLFVBQU0sV0FBVyxLQUFLLGFBQWE7QUFDbkMsUUFBSSxFQUFDLHFDQUFVLE9BQU87QUFDdEIsU0FBSyxPQUFPLE1BQU07QUFDaEIsZUFBUyxRQUFRO0FBQ2pCLFVBQUksU0FBUyxTQUFTLE9BQVEsVUFBUyxZQUFZO0FBQUEsSUFDckQsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVRLFdBQWlCO0FBbnNEM0I7QUFvc0RJLFVBQU0sWUFBVyxVQUFLLGFBQWEsTUFBbEIsWUFBdUIsS0FBSyxTQUFTO0FBQ3RELFFBQUksY0FBYyxLQUFLLEtBQUssU0FBUyxNQUFNLENBQUMsU0FBUztBQUNuRCxXQUFLLE9BQU8sTUFBTTtBQUFFLGlCQUFTLE9BQU87QUFBQSxNQUFNLENBQUM7QUFBQSxJQUM3QyxDQUFDLEVBQUUsS0FBSztBQUFBLEVBQ1Y7QUFBQSxFQUVRLGFBQW1CO0FBQ3pCLFVBQU0sV0FBVyxLQUFLLGFBQWE7QUFDbkMsUUFBSSxFQUFDLHFDQUFVLE1BQU07QUFDckIsU0FBSyxPQUFPLE1BQU07QUFBRSxlQUFTLE9BQU87QUFBQSxJQUFXLENBQUM7QUFBQSxFQUNsRDtBQUFBLEVBRUEsTUFBYyxxQkFBb0M7QUFodERwRDtBQWl0REksVUFBTSxZQUFXLFVBQUssYUFBYSxNQUFsQixZQUF1QixLQUFLLFNBQVM7QUFDdEQsUUFBSSxTQUFTLFFBQVE7QUFDbkIsWUFBTSxLQUFLLFVBQVUsY0FBYyxTQUFTLE9BQU8sSUFBSTtBQUN2RDtBQUFBLElBQ0Y7QUFDQSxRQUFJO0FBQ0YsWUFBTSxTQUFTLE1BQU0sS0FBSyxVQUFVLGVBQWUsUUFBUTtBQUMzRCxXQUFLLE9BQU8sTUFBTTtBQUFFLGlCQUFTLFNBQVM7QUFBQSxNQUFRLENBQUM7QUFDL0MsWUFBTSxLQUFLLFVBQVUsY0FBYyxPQUFPLElBQUk7QUFBQSxJQUNoRCxTQUFTLE9BQU87QUFDZCxjQUFRLE1BQU0sdUNBQXVDLEtBQUs7QUFDMUQsVUFBSSx3QkFBTyw0Q0FBUztBQUFBLElBQ3RCO0FBQUEsRUFDRjtBQUFBLEVBRVEsZ0JBQWdCLFNBQXNCLE1BQXlCO0FBQ3JFLFFBQUksQ0FBQyxLQUFLLE1BQU87QUFDakIsVUFBTSxPQUFPLFFBQVEsVUFBVSxFQUFFLEtBQUssc0JBQXNCLENBQUM7QUFDN0QsVUFBTSxRQUFRLEtBQUssU0FBUyxTQUFTLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQztBQUM5RCxVQUFNLE9BQU8sTUFBTSxTQUFTLE9BQU8sRUFBRSxTQUFTLElBQUk7QUFDbEQsU0FBSyxNQUFNLFFBQVEsUUFBUSxDQUFDLFFBQVEsVUFBVTtBQXJ1RGxEO0FBc3VETSxZQUFNLE9BQU8sS0FBSyxTQUFTLE1BQU0sRUFBRSxNQUFNLFVBQVUsVUFBSyxRQUFRLENBQUMsR0FBRyxDQUFDO0FBQ3JFLFdBQUssTUFBTSxhQUFZLHNCQUFLLFVBQUwsbUJBQVksZUFBWixtQkFBeUIsV0FBekIsWUFBbUM7QUFBQSxJQUM1RCxDQUFDO0FBQ0QsVUFBTSxPQUFPLE1BQU0sU0FBUyxPQUFPO0FBQ25DLFNBQUssTUFBTSxLQUFLLFFBQVEsQ0FBQyxRQUFRO0FBQy9CLFlBQU0sS0FBSyxLQUFLLFNBQVMsSUFBSTtBQUM3QixXQUFLLE1BQU8sUUFBUSxRQUFRLENBQUMsR0FBRyxVQUFVO0FBNXVEaEQ7QUE2dURRLGNBQU0sT0FBTyxHQUFHLFNBQVMsTUFBTSxFQUFFLE9BQU0sU0FBSSxLQUFLLE1BQVQsWUFBYyxHQUFHLENBQUM7QUFDekQsYUFBSyxNQUFNLGFBQVksc0JBQUssVUFBTCxtQkFBWSxlQUFaLG1CQUF5QixXQUF6QixZQUFtQztBQUFBLE1BQzVELENBQUM7QUFBQSxJQUNILENBQUM7QUFDRCxTQUFLLGlCQUFpQixlQUFlLENBQUMsVUFBVSxNQUFNLGdCQUFnQixDQUFDO0FBQ3ZFLFNBQUssaUJBQWlCLGFBQWEsQ0FBQyxVQUFVLE1BQU0sZUFBZSxDQUFDO0FBQ3BFLFNBQUssaUJBQWlCLFlBQVksQ0FBQyxVQUFVO0FBQUUsWUFBTSxnQkFBZ0I7QUFBRyxXQUFLLFdBQVcsS0FBSyxFQUFFO0FBQUcsV0FBSyxVQUFVO0FBQUEsSUFBRyxDQUFDO0FBQUEsRUFDdkg7QUFBQSxFQUVRLGVBQWUsU0FBc0IsTUFBeUI7QUFDcEUsUUFBSSxDQUFDLEtBQUssS0FBTTtBQUNoQixVQUFNLFFBQVEsUUFBUSxVQUFVLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQztBQUN6RCxVQUFNLFNBQVMsTUFBTSxVQUFVLEVBQUUsS0FBSyxrQkFBa0IsQ0FBQztBQUN6RCxXQUFPLFdBQVcsRUFBRSxNQUFNLEtBQUssS0FBSyxZQUFZLE9BQU8sQ0FBQztBQUN4RCxVQUFNLE9BQU8sT0FBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGtCQUFrQixNQUFNLEVBQUUsY0FBYywyQkFBTyxFQUFFLENBQUM7QUFDaEcsa0NBQVEsTUFBTSxNQUFNO0FBQ3BCLFNBQUssaUJBQWlCLFNBQVMsQ0FBQyxVQUFVO0FBQ3hDLFlBQU0sZ0JBQWdCO0FBQ3RCLFdBQUssVUFBVSxVQUFVLFVBQVUsS0FBSyxLQUFNLElBQUksRUFBRSxLQUFLLE1BQU0sSUFBSSx3QkFBTyxnQ0FBTyxDQUFDO0FBQUEsSUFDcEYsQ0FBQztBQUNELFVBQU0sV0FBVyxNQUFNLFVBQVUsRUFBRSxLQUFLLHNDQUFzQyxDQUFDO0FBQy9FLFNBQUssS0FBSyxVQUFVLGFBQWEsS0FBSyxNQUFNLFFBQVE7QUFDcEQsVUFBTSxpQkFBaUIsZUFBZSxDQUFDLFVBQVUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4RSxVQUFNLGlCQUFpQixhQUFhLENBQUMsVUFBVSxNQUFNLGVBQWUsQ0FBQztBQUNyRSxVQUFNLGlCQUFpQixZQUFZLENBQUMsVUFBVTtBQUFFLFlBQU0sZ0JBQWdCO0FBQUcsV0FBSyxXQUFXLEtBQUssRUFBRTtBQUFHLFdBQUssU0FBUztBQUFBLElBQUcsQ0FBQztBQUFBLEVBQ3ZIO0FBQUEsRUFFQSxNQUFjLFlBQVksT0FBc0M7QUF4d0RsRTtBQXl3REksVUFBTSxTQUFTLE1BQU07QUFDckIsUUFBSSxPQUFPLFFBQVEsbURBQW1ELEVBQUc7QUFDekUsVUFBTSxPQUFPLE1BQU07QUFDbkIsUUFBSSxDQUFDLEtBQU07QUFDWCxVQUFNLFlBQVksTUFBTSxLQUFLLEtBQUssS0FBSyxFQUFFLEtBQUssQ0FBQyxTQUFTLEtBQUssU0FBUyxVQUFVLEtBQUssS0FBSyxXQUFXLFFBQVEsQ0FBQztBQUM5RyxRQUFJLFdBQVc7QUFDYixZQUFNLE9BQU8sVUFBVSxVQUFVO0FBQ2pDLFVBQUksQ0FBQyxLQUFNO0FBQ1gsWUFBTSxlQUFlO0FBQ3JCLFlBQU1TLGFBQVcsVUFBSyxhQUFhLE1BQWxCLFlBQXVCLEtBQUssU0FBUztBQUN0RCxVQUFJO0FBQ0YsY0FBTSxjQUFZLFVBQUssS0FBSyxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQXRCLG1CQUF5QixRQUFRLFFBQVEsV0FBVTtBQUNyRSxjQUFNLFdBQVcsaUJBQWlCLFNBQVM7QUFDM0MsY0FBTSxPQUFPLE1BQU0sS0FBSyxVQUFVLGtCQUFrQixNQUFNLFFBQVE7QUFDbEUsY0FBTSxhQUF1QyxFQUFFLElBQUksTUFBTSxHQUFHLE1BQU0sU0FBUyxRQUFRLE1BQU0sYUFBYSxLQUFLO0FBQzNHLGFBQUssT0FBTyxNQUFNO0FBQ2hCLGdCQUFNLFNBQVMsa0JBQWtCQSxTQUFRO0FBQ3pDLGlCQUFPLEtBQUssVUFBVTtBQUN0QixVQUFBQSxVQUFTLFVBQVU7QUFDbkIsK0JBQXFCQSxTQUFRO0FBQUEsUUFDL0IsQ0FBQztBQUNELGNBQU0sWUFBWSxLQUFLLFVBQVUscUJBQXFCQSxVQUFTLElBQUksV0FBVyxJQUFJLE1BQU0sUUFBUTtBQUNoRyxZQUFJLHdCQUFPLFlBQVksaUZBQWdCLElBQUksS0FBSyx1Q0FBUyxJQUFJLEVBQUU7QUFBQSxNQUNqRSxTQUFTLE9BQU87QUFDZCxnQkFBUSxNQUFNLHFDQUFxQyxLQUFLO0FBQ3hELFlBQUksd0JBQU8sc0NBQVE7QUFBQSxNQUNyQjtBQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxLQUFLLFFBQVEsWUFBWTtBQUN0QyxRQUFJLENBQUMsS0FBSyxLQUFLLEVBQUc7QUFDbEIsVUFBTSxZQUFXLFVBQUssYUFBYSxNQUFsQixZQUF1QixLQUFLLFNBQVM7QUFDdEQsVUFBTSxRQUFRLG1CQUFtQixJQUFJO0FBQ3JDLFFBQUksT0FBTztBQUNULFlBQU0sZUFBZTtBQUNyQixXQUFLLE9BQU8sTUFBTTtBQUFFLGlCQUFTLFFBQVE7QUFBQSxNQUFPLENBQUM7QUFDN0MsVUFBSSx3QkFBTyw0REFBb0I7QUFDL0I7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLGdCQUFnQixJQUFJO0FBQ2pDLFFBQUksTUFBTTtBQUNSLFlBQU0sZUFBZTtBQUNyQixXQUFLLE9BQU8sTUFBTTtBQUFFLGlCQUFTLE9BQU87QUFBQSxNQUFNLENBQUM7QUFDM0MsVUFBSSx3QkFBTyx1Q0FBUyxLQUFLLFdBQVcsSUFBSSxLQUFLLFFBQVEsS0FBSyxFQUFFLGNBQUk7QUFDaEU7QUFBQSxJQUNGO0FBQ0EsVUFBTSxTQUFTLEtBQUssbUJBQW1CLElBQUk7QUFDM0MsUUFBSSxRQUFRO0FBQ1YsWUFBTSxlQUFlO0FBQ3JCLFlBQU0sUUFBUSxzQkFBc0IsTUFBTTtBQUMxQyxXQUFLLE9BQU8sTUFBTTtBQUFFLGlCQUFTLFlBQVk7QUFBTyxpQkFBUyxTQUFTLEtBQUssS0FBSztBQUFHLGFBQUssYUFBYSxNQUFNO0FBQUEsTUFBSSxDQUFDO0FBQUEsSUFDOUc7QUFBQSxFQUNGO0FBQUEsRUFFUSxtQkFBeUI7QUFDL0IsVUFBTSxXQUFXLEtBQUssYUFBYTtBQUNuQyxRQUFJLENBQUMsU0FBVTtBQUNmLFVBQU0sT0FBTyxLQUFLLFlBQVksUUFBUTtBQUN0QyxRQUFJLENBQUMsTUFBTTtBQUNULFVBQUksd0JBQU8saUtBQW9DO0FBQy9DO0FBQUEsSUFDRjtBQUNBLFNBQUssS0FBSyxVQUFVLFdBQVcsSUFBSTtBQUFBLEVBQ3JDO0FBQUEsRUFFUSxZQUFZLE1BQWtDO0FBMzBEeEQ7QUE0MERJLGFBQU8sVUFBSyxTQUFMLG1CQUFXLFdBQVUscUJBQXFCLGNBQWMsSUFBSSxDQUFDLEtBQUssc0JBQXFCLFVBQUssU0FBTCxZQUFhLEVBQUU7QUFBQSxFQUMvRztBQUFBLEVBRVEsY0FBb0I7QUFDMUIsVUFBTSxXQUFXLG1CQUFtQixLQUFLLFFBQVE7QUFDakQsUUFBSSxhQUFhLEtBQUssS0FBSyxVQUFVLE1BQU0sS0FBSyxLQUFLLFVBQVUsaUJBQWlCLFFBQVEsQ0FBQyxFQUFFLEtBQUs7QUFBQSxFQUNsRztBQUFBLEVBRVEsbUJBQXlCO0FBQy9CLFFBQUk7QUFBQSxNQUNGLEtBQUs7QUFBQSxNQUNMLEtBQUssWUFBWTtBQUFBLE1BQ2pCLENBQUNELGNBQWEsS0FBSyxnQkFBZ0JBLFNBQVE7QUFBQSxNQUMzQyxDQUFDLFNBQVMsS0FBSyxLQUFLLFVBQVUsYUFBYSxJQUFJO0FBQUEsSUFDakQsRUFBRSxLQUFLO0FBQUEsRUFDVDtBQUFBLEVBRVEsYUFBbUI7QUFDekIsUUFBSTtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsYUFBYSxLQUFLLFNBQVMsSUFBSTtBQUFBLE1BQy9CLENBQUMsVUFBVTtBQUNULGFBQUssY0FBYztBQUNuQixhQUFLLE9BQU87QUFBQSxNQUNkO0FBQUEsTUFDQSxDQUFDLFNBQVMsS0FBSyxVQUFVLEtBQUssRUFBRTtBQUFBLElBQ2xDLEVBQUUsS0FBSztBQUFBLEVBQ1Q7QUFBQSxFQUVRLFVBQVUsSUFBa0I7QUFDbEMsVUFBTSxZQUFZLGNBQWMsS0FBSyxTQUFTLE1BQU0sRUFBRTtBQUN0RCxVQUFNLFlBQVksVUFBVSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVM7QUFDM0QsUUFBSSxVQUFVLFFBQVE7QUFDcEIsV0FBSyxPQUFPLE1BQU0sVUFBVSxRQUFRLENBQUMsU0FBUztBQUFFLGFBQUssWUFBWTtBQUFBLE1BQU8sQ0FBQyxDQUFDO0FBQUEsSUFDNUU7QUFDQSxTQUFLLGFBQWE7QUFDbEIsU0FBSyxPQUFPO0FBQ1osV0FBTyxXQUFXLE1BQU0sS0FBSyxXQUFXLEVBQUUsR0FBRyxFQUFFO0FBQUEsRUFDakQ7QUFBQSxFQUVRLFdBQVcsSUFBa0I7QUFDbkMsVUFBTSxXQUFXLEtBQUssT0FBTyxLQUFLLElBQUksRUFBRTtBQUN4QyxRQUFJLENBQUMsU0FBVTtBQUNmLFNBQUssT0FBTyxDQUFDLFNBQVMsSUFBSSxLQUFLO0FBQy9CLFNBQUssT0FBTyxDQUFDLFNBQVMsSUFBSSxLQUFLO0FBQy9CLFNBQUssZUFBZTtBQUFBLEVBQ3RCO0FBQUEsRUFFUSxnQkFBZ0IsT0FBeUI7QUFDL0MsVUFBTSxXQUFXLEtBQUssYUFBYTtBQUNuQyxVQUFNLE9BQU8sSUFBSSxzQkFBSztBQUN0QixTQUFLLFFBQVEsQ0FBQyxTQUFTLEtBQUssU0FBUyxnQ0FBTyxFQUFFLFFBQVEsYUFBYSxFQUFFLFFBQVEsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDO0FBQ25HLFNBQUssUUFBUSxDQUFDLFNBQVMsS0FBSyxTQUFTLHNDQUFRLEVBQUUsUUFBUSxXQUFXLEVBQUUsUUFBUSxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUM7QUFDcEcsU0FBSyxRQUFRLENBQUMsU0FBUyxLQUFLLFNBQVMsMEJBQU0sRUFBRSxRQUFRLFFBQVEsRUFBRSxRQUFRLE1BQU0sS0FBSyxhQUFhLENBQUMsQ0FBQztBQUNqRyxTQUFLLFFBQVEsQ0FBQyxTQUFTLEtBQUssU0FBUywwQkFBTSxFQUFFLFFBQVEsV0FBVyxFQUFFLFFBQVEsTUFBTSxLQUFLLGtCQUFrQixDQUFDLENBQUM7QUFDekcsU0FBSyxhQUFhO0FBQ2xCLFNBQUssUUFBUSxDQUFDLFNBQVMsS0FBSyxVQUFTLHFDQUFVLFNBQVEsNkJBQVMsMEJBQU0sRUFBRSxRQUFRLFNBQVMsRUFBRSxRQUFRLE1BQU0sS0FBSyxVQUFVLENBQUMsQ0FBQztBQUMxSCxTQUFLLFFBQVEsQ0FBQyxTQUFTLEtBQUssU0FBUyxrREFBVSxFQUFFLFFBQVEsa0JBQWtCLEVBQUUsUUFBUSxNQUFNLEtBQUssdUJBQXVCLENBQUMsQ0FBQztBQUN6SCxRQUFJLHFDQUFVLE1BQU8sTUFBSyxRQUFRLENBQUMsU0FBUyxLQUFLLFNBQVMsMEJBQU0sRUFBRSxRQUFRLFNBQVMsRUFBRSxRQUFRLE1BQU0sS0FBSyxZQUFZLENBQUMsQ0FBQztBQUN0SCxTQUFLLFFBQVEsQ0FBQyxTQUFTLEtBQUssVUFBUyxxQ0FBVSxRQUFPLDZCQUFTLDBCQUFNLEVBQUUsUUFBUSxRQUFRLEVBQUUsUUFBUSxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUM7QUFDdkgsUUFBSSxxQ0FBVSxLQUFNLE1BQUssUUFBUSxDQUFDLFNBQVMsS0FBSyxTQUFTLDBCQUFNLEVBQUUsUUFBUSxRQUFRLEVBQUUsUUFBUSxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUM7QUFDbkgsU0FBSyxRQUFRLENBQUMsU0FBUyxLQUFLLFVBQVMscUNBQVUsVUFBUyxtQ0FBVSxnQ0FBTyxFQUFFLFFBQVEsU0FBUyxFQUFFLFFBQVEsTUFBTSxLQUFLLEtBQUssbUJBQW1CLENBQUMsQ0FBQztBQUMzSSxTQUFLLGFBQWE7QUFDbEIsU0FBSyxRQUFRLENBQUMsU0FBUyxLQUFLLFNBQVMsMEJBQU0sRUFBRSxRQUFRLE1BQU0sRUFBRSxRQUFRLE1BQU0sS0FBSyxLQUFLLG1CQUFtQixDQUFDLENBQUM7QUFDMUcsU0FBSyxRQUFRLENBQUMsU0FBUyxLQUFLLFNBQVMsc0NBQVEsRUFBRSxRQUFRLGlCQUFpQixFQUFFLFFBQVEsTUFBTSxLQUFLLEtBQUssYUFBYSxDQUFDLENBQUM7QUFDakgsU0FBSyxhQUFhO0FBQ2xCLFNBQUssUUFBUSxDQUFDLFNBQVMsS0FBSyxTQUFTLGtDQUFRLHFDQUFVLFVBQVMsU0FBUyx3QkFBUSxxQ0FBVSxVQUFTLFVBQVUsd0JBQVEscUNBQVUsVUFBUyxTQUFTLGlCQUFPLFFBQUcsRUFBRSxFQUFFLFFBQVEsa0JBQWtCLEVBQUUsUUFBUSxNQUFNLEtBQUssVUFBVSxDQUFDLENBQUM7QUFDM04sU0FBSyxRQUFRLENBQUMsU0FBUyxLQUFLLFNBQVMsMkJBQU8sRUFBRSxRQUFRLGVBQWUsRUFBRSxRQUFRLE1BQU0sS0FBSyxlQUFlLENBQUMsQ0FBQztBQUMzRyxTQUFLLFFBQVEsQ0FBQyxTQUFTLEtBQUssU0FBUywwQkFBTSxFQUFFLFFBQVEsTUFBTSxFQUFFLFFBQVEsTUFBTSxLQUFLLGlCQUFpQixDQUFDLENBQUM7QUFDbkcsU0FBSyxhQUFhO0FBQ2xCLFNBQUssUUFBUSxDQUFDLFNBQVMsS0FBSyxTQUFTLDBCQUFNLEVBQUUsUUFBUSxTQUFTLEVBQUUsUUFBUSxNQUFNLEtBQUssZUFBZSxDQUFDLENBQUM7QUFDcEcsU0FBSyxpQkFBaUIsS0FBSztBQUFBLEVBQzdCO0FBQUEsRUFFQSxNQUFjLHFCQUF1QztBQUNuRCxVQUFNLFdBQVcsS0FBSyxhQUFhO0FBQ25DLFFBQUksQ0FBQyxTQUFVLFFBQU87QUFDdEIsU0FBSyxrQkFBa0IsY0FBYyxFQUFFLFNBQVMsR0FBRyxPQUFPLGNBQWMsUUFBUSxLQUFLLDRCQUFRLFFBQVEsU0FBUyxPQUFPLFFBQVEsTUFBTSxTQUFTLENBQUMsRUFBRTtBQUMvSSxVQUFNLFVBQVUsS0FBSyxVQUFVLEVBQUUsTUFBTSx1QkFBdUIsU0FBUyxHQUFHLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQztBQUNuRyxRQUFJO0FBQ0YsWUFBTSxVQUFVLFVBQVUsVUFBVSxPQUFPO0FBQzNDLFVBQUksd0JBQU8sNENBQVM7QUFBQSxJQUN0QixTQUFRO0FBQ04sVUFBSSx3QkFBTyw0RkFBaUI7QUFBQSxJQUM5QjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFjLGVBQThCO0FBcDZEOUM7QUFxNkRJLFVBQU0sWUFBVyxVQUFLLGFBQWEsTUFBbEIsWUFBdUIsS0FBSyxTQUFTO0FBQ3RELFFBQUksYUFBaUM7QUFDckMsUUFBSTtBQUNGLFlBQU0sT0FBTyxNQUFNLFVBQVUsVUFBVSxTQUFTO0FBQ2hELFVBQUksS0FBSyxLQUFLLEVBQUcsY0FBYSxLQUFLLG1CQUFtQixJQUFJO0FBQUEsSUFDNUQsU0FBUTtBQUFBLElBRVI7QUFDQSxtREFBZSxLQUFLO0FBQ3BCLFFBQUksQ0FBQyxZQUFZO0FBQ2YsVUFBSSx3QkFBTyxtRkFBdUI7QUFDbEM7QUFBQSxJQUNGO0FBQ0EsVUFBTSxRQUFRLHNCQUFzQixVQUFVO0FBQzlDLFNBQUssT0FBTyxNQUFNO0FBQ2hCLGVBQVMsWUFBWTtBQUNyQixlQUFTLFNBQVMsS0FBSyxLQUFLO0FBQzVCLFdBQUssYUFBYSxNQUFNO0FBQUEsSUFDMUIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVRLG1CQUFtQixNQUFrQztBQTE3RC9EO0FBMjdESSxRQUFJO0FBQ0YsWUFBTSxTQUFTLEtBQUssTUFBTSxJQUFJO0FBQzlCLFlBQU0sU0FBUyxPQUFPLFNBQVMseUJBQXlCLE9BQU8sU0FBUyxtQkFBbUIsT0FBTyxTQUFTLG9CQUFvQixPQUFPLE9BQU8sT0FBTyxRQUFPLFlBQU8sU0FBUCxZQUFnQixPQUFPLE9BQU8sU0FBUyxZQUFZLE1BQU0sUUFBUSxPQUFPLFFBQVEsSUFBSSxTQUFTO0FBQ3hQLFVBQUksQ0FBQyxNQUFPLFFBQU87QUFDbkIsYUFBTyxrQkFBa0IsRUFBRSxRQUFPLFdBQU0sU0FBTixZQUFjLDRCQUFRLE1BQU0sTUFBcUIsSUFBRyxXQUFNLFNBQU4sWUFBYywwQkFBTSxFQUFFO0FBQUEsSUFDOUcsU0FBUTtBQUNOLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUFBLEVBRVEsb0JBQTBCO0FBQ2hDLFVBQU0sV0FBVyxLQUFLLGFBQWE7QUFDbkMsUUFBSSxDQUFDLFlBQVksU0FBUyxPQUFPLEtBQUssU0FBUyxLQUFLLElBQUk7QUFDdEQsVUFBSSx3QkFBTywwRUFBYztBQUN6QjtBQUFBLElBQ0Y7QUFDQSxVQUFNLFNBQVMsV0FBVyxLQUFLLFNBQVMsTUFBTSxTQUFTLEVBQUU7QUFDekQsUUFBSSxDQUFDLE9BQVE7QUFDYixVQUFNLFFBQVEsc0JBQXNCLFFBQVE7QUFDNUMsU0FBSyxPQUFPLE1BQU07QUFDaEIsWUFBTSxRQUFRLE9BQU8sU0FBUyxVQUFVLENBQUMsVUFBVSxNQUFNLE9BQU8sU0FBUyxFQUFFO0FBQzNFLGFBQU8sU0FBUyxPQUFPLFFBQVEsR0FBRyxHQUFHLEtBQUs7QUFDMUMsV0FBSyxhQUFhLE1BQU07QUFBQSxJQUMxQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRVEsWUFBWSxXQUEwQixVQUEyQjtBQUN2RSxRQUFJLENBQUMsYUFBYSxjQUFjLEtBQUssU0FBUyxLQUFLLE1BQU0sY0FBYyxTQUFVLFFBQU87QUFDeEYsVUFBTSxVQUFVLFNBQVMsS0FBSyxTQUFTLE1BQU0sU0FBUztBQUN0RCxXQUFPLFFBQVEsV0FBVyxDQUFDLGFBQWEsU0FBUyxRQUFRLENBQUM7QUFBQSxFQUM1RDtBQUFBLEVBRVEsYUFBYSxXQUFtQixVQUF3QjtBQUM5RCxRQUFJLENBQUMsS0FBSyxZQUFZLFdBQVcsUUFBUSxFQUFHO0FBQzVDLFVBQU0sVUFBVSxTQUFTLEtBQUssU0FBUyxNQUFNLFNBQVM7QUFDdEQsVUFBTSxTQUFTLFNBQVMsS0FBSyxTQUFTLE1BQU0sUUFBUTtBQUNwRCxRQUFJLENBQUMsV0FBVyxDQUFDLE9BQVE7QUFDekIsU0FBSyxPQUFPLE1BQU07QUFDaEIsaUJBQVcsS0FBSyxTQUFTLE1BQU0sU0FBUztBQUN4QyxhQUFPLFNBQVMsS0FBSyxPQUFPO0FBQzVCLGFBQU8sWUFBWTtBQUNuQixXQUFLLGFBQWE7QUFBQSxJQUNwQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRVEsZ0JBQWdCQSxXQUFpQztBQUN2RCxTQUFLLFFBQVEsS0FBSyxLQUFLLFVBQVUsS0FBSyxRQUFRLENBQUM7QUFDL0MsU0FBSyxZQUFZO0FBQ2pCLFNBQUssU0FBUyxDQUFDO0FBQ2YsU0FBSyxXQUFXLGNBQWNBLFNBQVE7QUFDdEMsU0FBSyxhQUFhLEtBQUssU0FBUyxLQUFLO0FBQ3JDLFNBQUssVUFBVSxTQUFTLEtBQUssWUFBWSxDQUFDO0FBQzFDLFNBQUssV0FBVztBQUNoQixTQUFLLE9BQU87QUFDWixXQUFPLFdBQVcsTUFBTSxLQUFLLFVBQVUsR0FBRyxFQUFFO0FBQUEsRUFDOUM7QUFBQSxFQUVRLE9BQU8sUUFBMEI7QUFDdkMsU0FBSyxRQUFRLEtBQUssS0FBSyxVQUFVLEtBQUssUUFBUSxDQUFDO0FBQy9DLFNBQUssWUFBWTtBQUNqQixTQUFLLFNBQVMsQ0FBQztBQUNmLFdBQU87QUFDUCxTQUFLLFVBQVUsU0FBUyxLQUFLLFlBQVksQ0FBQztBQUMxQyxTQUFLLFdBQVc7QUFDaEIsU0FBSyxPQUFPO0FBQUEsRUFDZDtBQUFBLEVBRVEsY0FBb0I7QUFDMUIsVUFBTSxRQUFRLEtBQUssSUFBSSxJQUFJLEtBQUssSUFBSSxLQUFLLEtBQUssUUFBUSxZQUFZLENBQUM7QUFDbkUsV0FBTyxLQUFLLFFBQVEsU0FBUyxNQUFPLE1BQUssUUFBUSxNQUFNO0FBQUEsRUFDekQ7QUFBQSxFQUVRLE9BQWE7QUFDbkIsVUFBTSxXQUFXLEtBQUssUUFBUSxJQUFJO0FBQ2xDLFFBQUksQ0FBQyxTQUFVO0FBQ2YsU0FBSyxPQUFPLEtBQUssS0FBSyxVQUFVLEtBQUssUUFBUSxDQUFDO0FBQzlDLFNBQUssV0FBVyxLQUFLLE1BQU0sUUFBUTtBQUNuQyxTQUFLLGFBQWEsS0FBSyxTQUFTLEtBQUs7QUFDckMsU0FBSyxVQUFVLFNBQVMsS0FBSyxZQUFZLENBQUM7QUFDMUMsU0FBSyxXQUFXO0FBQ2hCLFNBQUssT0FBTztBQUFBLEVBQ2Q7QUFBQSxFQUVRLE9BQWE7QUFDbkIsVUFBTSxPQUFPLEtBQUssT0FBTyxJQUFJO0FBQzdCLFFBQUksQ0FBQyxLQUFNO0FBQ1gsU0FBSyxRQUFRLEtBQUssS0FBSyxVQUFVLEtBQUssUUFBUSxDQUFDO0FBQy9DLFNBQUssWUFBWTtBQUNqQixTQUFLLFdBQVcsS0FBSyxNQUFNLElBQUk7QUFDL0IsU0FBSyxhQUFhLEtBQUssU0FBUyxLQUFLO0FBQ3JDLFNBQUssVUFBVSxTQUFTLEtBQUssWUFBWSxDQUFDO0FBQzFDLFNBQUssV0FBVztBQUNoQixTQUFLLE9BQU87QUFBQSxFQUNkO0FBQUEsRUFFUSxZQUFrQjtBQUN4QixVQUFNLE9BQU8sS0FBSyxXQUFXLHNCQUFzQjtBQUNuRCxVQUFNLFFBQVEsS0FBSyxJQUFJLEdBQUcsS0FBSyxPQUFPLE9BQU8sS0FBSyxPQUFPLE9BQU8sR0FBRztBQUNuRSxVQUFNLFNBQVMsS0FBSyxJQUFJLEdBQUcsS0FBSyxPQUFPLE9BQU8sS0FBSyxPQUFPLE9BQU8sR0FBRztBQUNwRSxTQUFLLE9BQU8sS0FBSyxVQUFVLEtBQUssS0FBSyxLQUFLLFFBQVEsTUFBTSxRQUFRLEtBQUssU0FBUyxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBQ2pHLFVBQU0sV0FBVyxLQUFLLE9BQU8sT0FBTyxLQUFLLE9BQU8sUUFBUTtBQUN4RCxVQUFNLFdBQVcsS0FBSyxPQUFPLE9BQU8sS0FBSyxPQUFPLFFBQVE7QUFDeEQsU0FBSyxPQUFPLENBQUMsVUFBVSxLQUFLO0FBQzVCLFNBQUssT0FBTyxDQUFDLFVBQVUsS0FBSztBQUM1QixTQUFLLGVBQWU7QUFBQSxFQUN0QjtBQUFBLEVBRVEsUUFBUSxPQUFxQjtBQUNuQyxTQUFLLE9BQU8sS0FBSyxVQUFVLEtBQUs7QUFDaEMsU0FBSyxlQUFlO0FBQUEsRUFDdEI7QUFBQSxFQUVRLFVBQVUsT0FBdUI7QUFDdkMsV0FBTyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLENBQUM7QUFBQSxFQUMzQztBQUFBLEVBRVEsa0JBQWtCLFdBQTJEO0FBL2lFdkY7QUFnakVJLFVBQU0sWUFBVyxVQUFLLGFBQWEsTUFBbEIsWUFBdUIsS0FBSyxTQUFTO0FBQ3RELFFBQUksU0FBNkI7QUFDakMsUUFBSSxjQUFjLFNBQVUsVUFBUyxXQUFXLEtBQUssU0FBUyxNQUFNLFNBQVMsRUFBRTtBQUMvRSxRQUFJLGNBQWMsUUFBUyxXQUFTLGNBQVMsU0FBUyxDQUFDLE1BQW5CLFlBQXdCO0FBQzVELFFBQUksY0FBYyxjQUFjLGNBQWMsUUFBUTtBQUNwRCxZQUFNLFNBQVMsV0FBVyxLQUFLLFNBQVMsTUFBTSxTQUFTLEVBQUU7QUFDekQsVUFBSSxRQUFRO0FBQ1YsY0FBTSxRQUFRLE9BQU8sU0FBUyxVQUFVLENBQUMsVUFBVSxNQUFNLE9BQU8sU0FBUyxFQUFFO0FBQzNFLGNBQU0sU0FBUyxjQUFjLGFBQWEsS0FBSztBQUMvQyxrQkFBUyxZQUFPLFNBQVMsUUFBUSxNQUFNLE1BQTlCLFlBQW1DO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBQ0EsUUFBSSxRQUFRO0FBQ1YsV0FBSyxXQUFXLE9BQU8sRUFBRTtBQUN6QixXQUFLLFdBQVcsT0FBTyxFQUFFO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQUEsRUFFUSxjQUFjLE9BQTRCO0FBQ2hELFVBQU0sU0FBUyxNQUFNO0FBQ3JCLFFBQUksT0FBTyxRQUFRLG1EQUFtRCxFQUFHO0FBQ3pFLFVBQU0sTUFBTSxNQUFNLFdBQVcsTUFBTTtBQUNuQyxVQUFNLE1BQU0sTUFBTSxJQUFJLFlBQVk7QUFFbEMsUUFBSSxPQUFPLFFBQVEsS0FBSztBQUN0QixZQUFNLGVBQWU7QUFDckIsV0FBSyxVQUFVLFNBQVMsS0FBSyxZQUFZLENBQUM7QUFDMUMsV0FBSyxXQUFXO0FBQ2hCO0FBQUEsSUFDRjtBQUNBLFFBQUksT0FBTyxRQUFRLEtBQUs7QUFDdEIsWUFBTSxlQUFlO0FBQ3JCLFdBQUssV0FBVztBQUNoQjtBQUFBLElBQ0Y7QUFDQSxRQUFJLE9BQU8sUUFBUSxLQUFLO0FBQ3RCLFlBQU0sZUFBZTtBQUNyQixXQUFLLGtCQUFrQjtBQUN2QjtBQUFBLElBQ0Y7QUFDQSxRQUFJLE9BQU8sUUFBUSxLQUFLO0FBQ3RCLFlBQU0sZUFBZTtBQUNyQixXQUFLLEtBQUssbUJBQW1CO0FBQzdCO0FBQUEsSUFDRjtBQUNBLFFBQUksT0FBTyxRQUFRLEtBQUs7QUFDdEIsWUFBTSxlQUFlO0FBQ3JCLFdBQUssS0FBSyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsV0FBVztBQUFFLFlBQUksT0FBUSxNQUFLLGVBQWU7QUFBQSxNQUFHLENBQUM7QUFDdEY7QUFBQSxJQUNGO0FBQ0EsUUFBSSxPQUFPLE1BQU0sUUFBUSxTQUFTO0FBQ2hDLFlBQU0sZUFBZTtBQUNyQixXQUFLLFVBQVU7QUFDZjtBQUFBLElBQ0Y7QUFDQSxRQUFJLE9BQU8sUUFBUSxPQUFPLENBQUMsTUFBTSxVQUFVO0FBQ3pDLFlBQU0sZUFBZTtBQUNyQixXQUFLLEtBQUs7QUFDVjtBQUFBLElBQ0Y7QUFDQSxRQUFLLE9BQU8sUUFBUSxPQUFTLE9BQU8sTUFBTSxZQUFZLFFBQVEsS0FBTTtBQUNsRSxZQUFNLGVBQWU7QUFDckIsV0FBSyxLQUFLO0FBQ1Y7QUFBQSxJQUNGO0FBRUEsWUFBUSxNQUFNLEtBQUs7QUFBQSxNQUNqQixLQUFLO0FBQ0gsY0FBTSxlQUFlO0FBQ3JCLGFBQUssU0FBUztBQUNkO0FBQUEsTUFDRixLQUFLO0FBQ0gsY0FBTSxlQUFlO0FBQ3JCLGFBQUssV0FBVztBQUNoQjtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUNILGNBQU0sZUFBZTtBQUNyQixhQUFLLGVBQWU7QUFDcEI7QUFBQSxNQUNGLEtBQUs7QUFDSCxjQUFNLGVBQWU7QUFDckIsYUFBSyxhQUFhO0FBQ2xCO0FBQUEsTUFDRixLQUFLO0FBQ0gsY0FBTSxlQUFlO0FBQ3JCLGFBQUssZUFBZTtBQUNwQjtBQUFBLE1BQ0YsS0FBSztBQUNILGNBQU0sZUFBZTtBQUNyQixhQUFLLGtCQUFrQixRQUFRO0FBQy9CO0FBQUEsTUFDRixLQUFLO0FBQ0gsY0FBTSxlQUFlO0FBQ3JCLGFBQUssa0JBQWtCLE9BQU87QUFDOUI7QUFBQSxNQUNGLEtBQUs7QUFDSCxjQUFNLGVBQWU7QUFDckIsYUFBSyxrQkFBa0IsVUFBVTtBQUNqQztBQUFBLE1BQ0YsS0FBSztBQUNILGNBQU0sZUFBZTtBQUNyQixhQUFLLGtCQUFrQixNQUFNO0FBQzdCO0FBQUEsTUFDRixLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQ0gsY0FBTSxlQUFlO0FBQ3JCLGFBQUssUUFBUSxLQUFLLE9BQU8sSUFBSTtBQUM3QjtBQUFBLE1BQ0YsS0FBSztBQUNILGNBQU0sZUFBZTtBQUNyQixhQUFLLFFBQVEsS0FBSyxPQUFPLElBQUk7QUFDN0I7QUFBQSxNQUNGLEtBQUs7QUFDSCxZQUFJLEtBQUs7QUFDUCxnQkFBTSxlQUFlO0FBQ3JCLGVBQUssVUFBVTtBQUFBLFFBQ2pCO0FBQ0E7QUFBQSxNQUNGO0FBQ0U7QUFBQSxJQUNKO0FBQUEsRUFDRjtBQUNGOzs7QURycUVPLElBQU0sMkJBQTJCO0FBRWpDLElBQU0sb0JBQU4sY0FBZ0MsOEJBQWE7QUFBQSxFQU1sRCxZQUFZLE1BQXFCLFFBQTZCO0FBQzVELFVBQU0sSUFBSTtBQUxaLFNBQVEsU0FBK0I7QUFDdkMsU0FBUSxXQUFtQztBQUMzQyxTQUFRLGFBQTRCO0FBSWxDLFNBQUssU0FBUztBQUFBLEVBQ2hCO0FBQUEsRUFFQSxjQUFzQjtBQUNwQixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsaUJBQXlCO0FBdkIzQjtBQXdCSSxZQUFPLGdCQUFLLFNBQUwsbUJBQVcsYUFBWCxZQUF1QjtBQUFBLEVBQ2hDO0FBQUEsRUFFQSxVQUFrQjtBQUNoQixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsY0FBc0I7QUEvQnhCO0FBZ0NJLFVBQU1FLGFBQVcsZ0JBQUssV0FBTCxtQkFBYSxrQkFBYixZQUE4QixLQUFLO0FBQ3BELFdBQU8sa0JBQWtCQSxhQUFBLE9BQUFBLFlBQVksS0FBSyxPQUFPLHlCQUF5QiwwQkFBTSxDQUFDO0FBQUEsRUFDbkY7QUFBQSxFQUVBLFlBQVksTUFBYyxPQUFzQjtBQXBDbEQ7QUFxQ0ksVUFBTSxTQUFRLGdCQUFLLFNBQUwsbUJBQVcsYUFBWCxZQUF1QjtBQUNyQyxTQUFLLFdBQVcsY0FBYyxNQUFNLEtBQUs7QUFDekMsU0FBSyxpQkFBaUI7QUFFdEIsUUFBSSxDQUFDLEtBQUssVUFBVSxPQUFPO0FBQ3pCLGlCQUFLLFdBQUwsbUJBQWE7QUFDYixXQUFLLFVBQVUsTUFBTTtBQUNyQixXQUFLLFNBQVMsSUFBSSxjQUFjLEtBQUssS0FBSyxLQUFLLFdBQVcsS0FBSyxVQUFVO0FBQUEsUUFDdkUsVUFBVSxDQUFDQSxjQUFhO0FBQ3RCLGVBQUssV0FBV0E7QUFDaEIsZUFBSyxZQUFZO0FBQ2pCLGVBQUssdUJBQXVCO0FBQUEsUUFDOUI7QUFBQSxRQUNBLFlBQVksT0FBTyxTQUFTLEtBQUssU0FBUyxJQUFJO0FBQUEsUUFDOUMsYUFBYSxPQUFPLFFBQVEsS0FBSyxlQUFlLE9BQU8sR0FBRztBQUFBLFFBQzFELGtCQUFrQixPQUFPLGFBQWEsS0FBSyxlQUFlLE1BQU0sUUFBUTtBQUFBLFFBQ3hFLGNBQWMsT0FBTyxTQUFTLEtBQUssZUFBZSxRQUFRLElBQUk7QUFBQSxRQUM5RCxjQUFjLENBQUMsV0FBVyxLQUFLLGFBQWEsTUFBTTtBQUFBLFFBQ2xELG1CQUFtQixPQUFPLE1BQU0sa0JBQWtCLEtBQUssT0FBTyxnQkFBZ0IsTUFBTSxlQUFlLEtBQUssSUFBSTtBQUFBLFFBQzVHLGVBQWUsTUFBTSxLQUFLLE9BQU8sb0JBQW9CO0FBQUEsUUFDckQseUJBQXlCLE1BQU0sS0FBSyxPQUFPLHdCQUF3QjtBQUFBLFFBQ25FLGVBQWUsT0FBTyxNQUFNLGVBQWUsWUFBWSxLQUFLLE9BQU8sbUJBQW1CLE1BQU0sZUFBZSxPQUFPO0FBQUEsUUFDbEgsbUJBQW1CLE9BQU8sV0FBVyxLQUFLLE9BQU8sZ0JBQWdCLFFBQVEsS0FBSyxJQUFJO0FBQUEsUUFDbEYsc0JBQXNCLENBQUMsUUFBUSxTQUFTLFdBQVcsa0JBQWtCLEtBQUssT0FBTyxtQkFBbUIsS0FBSyxNQUFNLFFBQVEsU0FBUyxXQUFXLGFBQWE7QUFBQSxRQUN4SixnQkFBZ0IsT0FBTyxTQUFTO0FBQzlCLGNBQUksQ0FBQyxLQUFLLEtBQU0sT0FBTSxJQUFJLE1BQU0sOERBQVk7QUFDNUMsaUJBQU8sS0FBSyxPQUFPLGlCQUFpQixLQUFLLE1BQU0sSUFBSTtBQUFBLFFBQ3JEO0FBQUEsUUFDQSxlQUFlLE9BQU8sTUFBTSxnQkFBZ0I7QUFqRXBELGNBQUFDLEtBQUFDO0FBa0VVLGdCQUFNLEtBQUssS0FBSztBQUNoQixnQkFBTSxLQUFLLE9BQU8sZ0JBQWdCLE9BQU1BLE9BQUFELE1BQUEsS0FBSyxTQUFMLGdCQUFBQSxJQUFXLFNBQVgsT0FBQUMsTUFBbUIsSUFBSSxLQUFLLE1BQU0sV0FBVztBQUFBLFFBQ3ZGO0FBQUEsUUFDQSxjQUFjLE9BQU8sT0FBTyxjQUFjO0FBckVsRCxjQUFBRCxLQUFBQyxLQUFBQztBQXNFVSxnQkFBTSxlQUFlLEtBQUssSUFBSSxHQUFHLEdBQUcsTUFBTSxLQUFLLE1BQU0sS0FBSyxTQUFTLEtBQUssR0FBRyxDQUFDLFVBQVUsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDO0FBQ3RHLGdCQUFNLFFBQVEsSUFBSSxPQUFPLGVBQWUsQ0FBQztBQUN6QyxnQkFBTSxXQUFXLEdBQUcsS0FBSyxJQUFHRixNQUFBLE1BQU0sYUFBTixPQUFBQSxNQUFrQixFQUFFO0FBQUEsRUFBSyxNQUFNLElBQUk7QUFBQSxFQUFLLEtBQUs7QUFDekUsZ0JBQU0sa0NBQWlCLE9BQU8sS0FBSyxLQUFLLFVBQVUsWUFBV0UsT0FBQUQsTUFBQSxLQUFLLFNBQUwsZ0JBQUFBLElBQVcsU0FBWCxPQUFBQyxNQUFtQixJQUFJLElBQUk7QUFBQSxRQUMxRjtBQUFBLE1BQ0YsR0FBRyxLQUFLLGlCQUFpQixDQUFDO0FBQUEsSUFDNUIsT0FBTztBQUNMLFdBQUssT0FBTyxZQUFZLEtBQUssVUFBVSxLQUFLO0FBQzVDLFdBQUssT0FBTyxXQUFXLEtBQUssaUJBQWlCLENBQUM7QUFBQSxJQUNoRDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFFBQWM7QUFsRmhCO0FBbUZJLGVBQUssV0FBTCxtQkFBYTtBQUNiLFNBQUssU0FBUztBQUNkLFNBQUssV0FBVztBQUNoQixTQUFLLFVBQVUsTUFBTTtBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxNQUFNLEtBQUssT0FBZ0M7QUF6RjdDO0FBMEZJLFVBQU0sTUFBTSxLQUFLLEtBQUs7QUFDdEIsZUFBSyxXQUFMLG1CQUFhO0FBQUEsRUFDZjtBQUFBLEVBRUEsTUFBTSxVQUF5QjtBQTlGakM7QUErRkksUUFBSSxLQUFLLGVBQWUsS0FBTSxRQUFPLGFBQWEsS0FBSyxVQUFVO0FBQ2pFLGVBQUssV0FBTCxtQkFBYTtBQUNiLFNBQUssU0FBUztBQUNkLFVBQU0sTUFBTSxRQUFRO0FBQUEsRUFDdEI7QUFBQSxFQUVBLG9CQUEwQjtBQXJHNUI7QUFzR0ksU0FBSyxpQkFBaUI7QUFDdEIsZUFBSyxXQUFMLG1CQUFhLFdBQVcsS0FBSyxpQkFBaUI7QUFBQSxFQUNoRDtBQUFBLEVBRUEsVUFBVSxRQUFzQjtBQTFHbEM7QUEyR0ksZUFBSyxXQUFMLG1CQUFhLGNBQWM7QUFBQSxFQUM3QjtBQUFBLEVBRVEsbUJBQW1CO0FBQ3pCLFdBQU87QUFBQSxNQUNMLGtCQUFrQixLQUFLLE9BQU8sU0FBUztBQUFBLE1BQ3ZDLG1CQUFtQixxQkFBcUIsS0FBSyxPQUFPLFFBQVE7QUFBQSxNQUM1RCxrQkFBa0IsS0FBSyxPQUFPLFNBQVM7QUFBQSxNQUN2QyxlQUFlLEtBQUssT0FBTyxTQUFTO0FBQUEsTUFDcEMsY0FBYyxLQUFLLE9BQU8sU0FBUztBQUFBLE1BQ25DLHNCQUFzQixLQUFLLE9BQU8sU0FBUztBQUFBLE1BQzNDLDZCQUE2QixLQUFLLE9BQU8sU0FBUztBQUFBLE1BQ2xELCtCQUErQixLQUFLLE9BQU8sU0FBUztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBRVEsbUJBQXlCO0FBM0huQztBQTRISSxVQUFNLFNBQVEsZ0JBQUssYUFBTCxtQkFBZSxVQUFmLFlBQXdCO0FBQ3RDLFNBQUssVUFBVSxZQUFZLG1CQUFtQixVQUFVLE9BQU87QUFDL0QsU0FBSyxVQUFVLFlBQVksa0JBQWtCLFVBQVUsTUFBTTtBQUFBLEVBQy9EO0FBQUEsRUFFUSx5QkFBK0I7QUFDckMsUUFBSSxLQUFLLGVBQWUsS0FBTSxRQUFPLGFBQWEsS0FBSyxVQUFVO0FBQ2pFLFNBQUssYUFBYSxPQUFPLFdBQVcsTUFBRztBQW5JM0M7QUFtSThDLHdCQUFLLFdBQUwsbUJBQWE7QUFBQSxPQUFhLElBQUk7QUFBQSxFQUMxRTtBQUFBLEVBRUEsTUFBYyxTQUFTLFNBQWdDO0FBdEl6RDtBQXVJSSxVQUFNLE9BQU8sUUFBUSxLQUFLO0FBQzFCLFFBQUksZ0JBQWdCLEtBQUssSUFBSSxHQUFHO0FBQzlCLGFBQU8sS0FBSyxNQUFNLFVBQVUscUJBQXFCO0FBQ2pEO0FBQUEsSUFDRjtBQUNBLFVBQU0sWUFBWSxLQUFLLE1BQU0sc0JBQXNCO0FBQ25ELFVBQU0sVUFBVSx5REFBWSxPQUFaLFlBQWtCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxNQUFwQyxtQkFBdUMsV0FBdkMsWUFBaUQ7QUFDakUsVUFBTSxLQUFLLElBQUksVUFBVSxhQUFhLFNBQVEsZ0JBQUssU0FBTCxtQkFBVyxTQUFYLFlBQW1CLElBQUksS0FBSztBQUFBLEVBQzVFO0FBQUEsRUFFUSxhQUFhLFdBQWtDO0FBakp6RDtBQWtKSSxVQUFNLFNBQVMsVUFBVSxLQUFLO0FBQzlCLFFBQUksQ0FBQyxPQUFRLFFBQU87QUFDcEIsUUFBSSwwQkFBMEIsS0FBSyxNQUFNLEVBQUcsUUFBTztBQUNuRCxVQUFNLFlBQVksT0FBTyxNQUFNLHdCQUF3QjtBQUN2RCxVQUFNLFVBQVUsK0RBQVksT0FBWixZQUFrQixRQUFRLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBdEMsbUJBQXlDLE1BQU0sS0FBSyxPQUFwRCxtQkFBd0QsV0FBeEQsWUFBa0U7QUFDbEYsVUFBTSxPQUFPLEtBQUssSUFBSSxjQUFjLHFCQUFxQixTQUFRLGdCQUFLLFNBQUwsbUJBQVcsU0FBWCxZQUFtQixFQUFFO0FBQ3RGLFFBQUksRUFBRSxnQkFBZ0Isd0JBQVEsUUFBTztBQUNyQyxXQUFPLEtBQUssSUFBSSxNQUFNLGdCQUFnQixJQUFJO0FBQUEsRUFDNUM7QUFBQSxFQUVBLE1BQWMsZUFBZSxXQUFrQyxTQUFnQztBQTVKakc7QUE2SkksVUFBTSxPQUFPLEtBQUs7QUFDbEIsVUFBTSxjQUFhLHdDQUFNLFdBQU4sbUJBQWMsU0FBZCxZQUFzQjtBQUN6QyxVQUFNLFlBQVcsd0NBQU0sYUFBTixhQUFrQixVQUFLLGFBQUwsbUJBQWUsVUFBakMsWUFBMEM7QUFDM0QsVUFBTSxPQUFPLE1BQU0sS0FBSyxPQUFPLHFCQUFpQixnQ0FBYyxHQUFHLGFBQWEsR0FBRyxVQUFVLE1BQU0sRUFBRSxHQUFHLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztBQUM5SCxVQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sTUFBTSxPQUFPO0FBQ3pDLFFBQUksd0JBQU8sMkJBQU8sSUFBSSxFQUFFO0FBQUEsRUFDMUI7QUFDRjs7O0FONUhPLElBQU0sb0JBQW9CO0FBQ2pDLElBQU0sZ0JBQWdCO0FBRXRCLElBQXFCLHNCQUFyQixjQUFpRCx3QkFBTztBQUFBLEVBQXhEO0FBQUE7QUFDRSxvQkFBa0M7QUFDbEMsU0FBUSxzQkFBcUM7QUFDN0MsU0FBaUIsbUJBQW1CLG9CQUFJLElBQW9CO0FBQUE7QUFBQSxFQUU1RCxNQUFNLFNBQXdCO0FBQzVCLFVBQU0sS0FBSyxhQUFhO0FBRXhCLFNBQUssYUFBYSwwQkFBMEIsQ0FBQyxTQUFTLElBQUksa0JBQWtCLE1BQU0sSUFBSSxDQUFDO0FBR3ZGLFNBQUssbUJBQW1CLENBQUMsaUJBQWlCLEdBQUcsd0JBQXdCO0FBQ3JFLFNBQUssY0FBYyxJQUFJLHdCQUF3QixLQUFLLEtBQUssSUFBSSxDQUFDO0FBRTlELFNBQUssY0FBYyxpQkFBaUIsd0NBQVUsTUFBTSxLQUFLLEtBQUssY0FBYyxDQUFDO0FBRTdFLFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLEtBQUssS0FBSyxjQUFjO0FBQUEsSUFDMUMsQ0FBQztBQUNELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLEtBQUssS0FBSyxjQUFjLEVBQUUsbUJBQW1CLEtBQUssQ0FBQztBQUFBLElBQ3JFLENBQUM7QUFDRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLGVBQWUsQ0FBQyxhQUFhO0FBQzNCLGNBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxjQUFjO0FBQzlDLGNBQU0sWUFBWSxRQUFRLFFBQVEsS0FBSyxjQUFjLFFBQVEsQ0FBQyxLQUFLLG9CQUFvQixJQUFJLENBQUM7QUFDNUYsWUFBSSxDQUFDLFlBQVksYUFBYSxLQUFNLE1BQUssS0FBSyxvQkFBb0IsSUFBSTtBQUN0RSxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0YsQ0FBQztBQUNELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sZUFBZSxDQUFDLGFBQWE7QUFDM0IsY0FBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGNBQWM7QUFDOUMsY0FBTSxZQUFZLFFBQVEsUUFBUSxLQUFLLG9CQUFvQixJQUFJLENBQUM7QUFDaEUsWUFBSSxDQUFDLFlBQVksYUFBYSxLQUFNLE1BQUssS0FBSyxrQkFBa0IsTUFBTSxJQUFJO0FBQzFFLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRixDQUFDO0FBQ0QsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixlQUFlLENBQUMsYUFBYTtBQTVGbkM7QUE2RlEsY0FBTSxPQUFPLEtBQUssSUFBSSxVQUFVLGNBQWM7QUFDOUMsY0FBTSxZQUFZLFFBQVEsUUFBUSxLQUFLLGNBQWMsSUFBSSxDQUFDO0FBQzFELFlBQUksQ0FBQyxZQUFZLGFBQWEsS0FBTSxNQUFLLEtBQUssY0FBYyxPQUFNLFVBQUssSUFBSSxVQUFVLGVBQW5CLFlBQWlDLE1BQVM7QUFDNUcsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGLENBQUM7QUFFRCxTQUFLLGNBQWMsS0FBSyxJQUFJLFVBQVUsR0FBRyxhQUFhLENBQUMsTUFBWSxTQUFTO0FBQzFFLFVBQUksZ0JBQWdCLDBCQUFTO0FBQzNCLGFBQUssUUFBUSxDQUFDLFNBQVMsS0FDcEIsU0FBUyxzQ0FBUSxFQUNqQixRQUFRLGVBQWUsRUFDdkIsUUFBUSxNQUFNLEtBQUssS0FBSyxjQUFjLEVBQUUsUUFBUSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDaEU7QUFBQSxNQUNGO0FBQ0EsVUFBSSxFQUFFLGdCQUFnQix3QkFBUTtBQUU5QixVQUFJLEtBQUssY0FBYyxJQUFJLEdBQUc7QUFDNUIsYUFBSyxhQUFhO0FBQ2xCLGFBQUssUUFBUSxDQUFDLFNBQVMsS0FDcEIsU0FBUyw4REFBWSxFQUNyQixRQUFRLGVBQWUsRUFDdkIsUUFBUSxNQUFNLEtBQUssS0FBSyxjQUFjLElBQUksQ0FBQyxDQUFDO0FBQUEsTUFDakQsV0FBVyxLQUFLLG9CQUFvQixJQUFJLEdBQUc7QUFDekMsYUFBSyxhQUFhO0FBQ2xCLGFBQUssUUFBUSxDQUFDLFNBQVMsS0FDcEIsU0FBUyxzREFBbUIsRUFDNUIsUUFBUSxTQUFTLEVBQ2pCLFFBQVEsTUFBTSxLQUFLLEtBQUssa0JBQWtCLE1BQU0sSUFBSSxDQUFDLENBQUM7QUFBQSxNQUMzRDtBQUFBLElBQ0YsQ0FBQyxDQUFDO0FBSUYsU0FBSyxjQUFjLEtBQUssSUFBSSxVQUFVLEdBQUcsYUFBYSxDQUFDLFNBQVM7QUFDOUQsVUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFNBQVMsdUJBQXVCLENBQUMsS0FBSyxvQkFBb0IsSUFBSSxFQUFHO0FBQ3BGLFVBQUksS0FBSyx3QkFBd0IsS0FBSyxLQUFNO0FBQzVDLGFBQU8sV0FBVyxNQUFNLEtBQUssS0FBSyxrQkFBa0IsTUFBTSxJQUFJLEdBQUcsQ0FBQztBQUFBLElBQ3BFLENBQUMsQ0FBQztBQUVGLFNBQUssbUNBQW1DLFdBQVcsQ0FBQyxRQUFRLElBQUksUUFBUTtBQUN0RSx5QkFBbUIsSUFBSSxRQUFRLEtBQUssZUFBZSxHQUFHLEdBQUcscUJBQXFCLEtBQUssUUFBUSxDQUFDO0FBQUEsSUFDOUYsQ0FBQztBQUNELFNBQUssbUNBQW1DLGdCQUFnQixDQUFDLFFBQVEsSUFBSSxRQUFRO0FBQzNFLHlCQUFtQixJQUFJLFFBQVEsS0FBSyxlQUFlLEdBQUcsR0FBRyxxQkFBcUIsS0FBSyxRQUFRLENBQUM7QUFBQSxJQUM5RixDQUFDO0FBRUQsU0FBSyxtQ0FBbUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxRQUFRO0FBQ2xFLHlCQUFtQixJQUFJLFFBQVEsS0FBSyxlQUFlLEdBQUcsR0FBRyxxQkFBcUIsS0FBSyxRQUFRLENBQUM7QUFBQSxJQUM5RixDQUFDO0FBQ0QsU0FBSyxtQ0FBbUMsWUFBWSxDQUFDLFFBQVEsSUFBSSxRQUFRO0FBQ3ZFLHlCQUFtQixJQUFJLFFBQVEsS0FBSyxlQUFlLEdBQUcsR0FBRyxxQkFBcUIsS0FBSyxRQUFRLENBQUM7QUFBQSxJQUM5RixDQUFDO0FBQ0QsU0FBSyw4QkFBOEIsQ0FBQyxTQUFTLFlBQVksS0FBSyxLQUFLLHFCQUFxQixTQUFTLE9BQU8sQ0FBQztBQUFBLEVBQzNHO0FBQUEsRUFFQSxXQUFpQjtBQUNmLGVBQVcsU0FBUyxLQUFLLGlCQUFpQixPQUFPLEVBQUcsUUFBTyxhQUFhLEtBQUs7QUFDN0UsU0FBSyxpQkFBaUIsTUFBTTtBQUM1QixTQUFLLElBQUksVUFBVSxtQkFBbUIsd0JBQXdCO0FBQUEsRUFDaEU7QUFBQSxFQUVBLE1BQU0sZUFBOEI7QUFDbEMsUUFBSSxTQUFTLE1BQU0sS0FBSyxTQUFTO0FBRWpDLFFBQUksQ0FBQyxRQUFRO0FBQ1gsWUFBTSxrQkFBYyxnQ0FBYyxHQUFHLEtBQUssSUFBSSxNQUFNLFNBQVMsbUNBQW1DO0FBQ2hHLFVBQUk7QUFDRixZQUFJLE1BQU0sS0FBSyxJQUFJLE1BQU0sUUFBUSxPQUFPLFdBQVcsR0FBRztBQUNwRCxtQkFBUyxLQUFLLE1BQU0sTUFBTSxLQUFLLElBQUksTUFBTSxRQUFRLEtBQUssV0FBVyxDQUFDO0FBQ2xFLGNBQUksT0FBUSxPQUFNLEtBQUssU0FBUyxNQUFNO0FBQUEsUUFDeEM7QUFBQSxNQUNGLFNBQVMsT0FBTztBQUNkLGdCQUFRLEtBQUssMERBQTBELEtBQUs7QUFBQSxNQUM5RTtBQUFBLElBQ0Y7QUFDQSxVQUFNLG9CQUFvQixXQUFXLFFBQVEsV0FBVztBQUN4RCxVQUFNLE1BQU8sMEJBQVUsQ0FBQztBQUN4QixRQUFJLGFBQWdDLE1BQU0sUUFBUSxJQUFJLFVBQVUsSUFDNUQsSUFBSSxXQUFXLE1BQU0sR0FBRyxFQUFFLEVBQUUsUUFBUSxDQUFDLE1BQU0sVUFBVTtBQUNyRCxVQUFJLENBQUMsUUFBUSxPQUFPLFNBQVMsU0FBVSxRQUFPLENBQUM7QUFDL0MsWUFBTSxZQUFZO0FBQ2xCLFlBQU0sT0FBTyxzQkFBc0IsUUFBUSxDQUFDO0FBQzVDLFdBQUssS0FBSyxPQUFPLFVBQVUsT0FBTyxZQUFZLFVBQVUsR0FBRyxLQUFLLElBQUksVUFBVSxHQUFHLEtBQUssRUFBRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUs7QUFDN0csV0FBSyxPQUFPLE9BQU8sVUFBVSxTQUFTLFlBQVksVUFBVSxLQUFLLEtBQUssSUFBSSxVQUFVLEtBQUssS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSztBQUNySCxXQUFLLFVBQVUsVUFBVSxZQUFZO0FBQ3JDLFdBQUssV0FBVyxPQUFPLFVBQVUsYUFBYSxXQUFXLFVBQVUsU0FBUyxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUksSUFBSTtBQUNwRyxXQUFLLFNBQVMsVUFBVSxXQUFXLFFBQVEsUUFBUTtBQUNuRCxXQUFLLFdBQVcsVUFBVSxhQUFhLFFBQVEsUUFBUTtBQUN2RCxXQUFLLFlBQVksT0FBTyxVQUFVLGNBQWMsWUFBWSxVQUFVLFVBQVUsS0FBSyxJQUFJLFVBQVUsVUFBVSxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUcsSUFBSTtBQUNwSSxXQUFLLFVBQVUsT0FBTyxVQUFVLFlBQVksV0FBVyxVQUFVLFFBQVEsS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFLLElBQUk7QUFDbEcsV0FBSyxlQUFlLE9BQU8sVUFBVSxpQkFBaUIsV0FBVyxVQUFVLGFBQWEsS0FBSyxFQUFFLE1BQU0sR0FBRyxHQUFHLElBQUk7QUFDL0csYUFBTyxDQUFDLElBQUk7QUFBQSxJQUNkLENBQUMsSUFDQyxDQUFDO0FBR0wsVUFBTSxpQkFBaUIsT0FBTyxJQUFJLHNCQUFzQixXQUFXLElBQUksa0JBQWtCLEtBQUssSUFBSTtBQUNsRyxRQUFJLENBQUMsV0FBVyxVQUFVLGdCQUFnQjtBQUN4QyxZQUFNLE9BQU8sc0JBQXNCLENBQUM7QUFDcEMsV0FBSyxPQUFPO0FBQ1osV0FBSyxXQUFXO0FBQ2hCLFdBQUssU0FBUyxJQUFJLG9CQUFvQixRQUFRLFFBQVE7QUFDdEQsV0FBSyxXQUFXLElBQUksc0JBQXNCLFFBQVEsUUFBUTtBQUMxRCxXQUFLLFlBQVksT0FBTyxJQUFJLHVCQUF1QixZQUFZLElBQUksbUJBQW1CLEtBQUssSUFBSSxJQUFJLG1CQUFtQixLQUFLLElBQUk7QUFDL0gsV0FBSyxVQUFVLE9BQU8sSUFBSSxxQkFBcUIsV0FBVyxJQUFJLGlCQUFpQixLQUFLLElBQUk7QUFDeEYsV0FBSyxlQUFlLE9BQU8sSUFBSSwwQkFBMEIsV0FBVyxJQUFJLHNCQUFzQixLQUFLLElBQUk7QUFDdkcsbUJBQWEsQ0FBQyxJQUFJO0FBQUEsSUFDcEI7QUFFQSxVQUFNLGFBQWEsSUFBSSxJQUFJLFdBQVcsT0FBTyxDQUFDLFNBQVMsS0FBSyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsS0FBSyxFQUFFLENBQUM7QUFDM0YsVUFBTSxjQUFjLE1BQU0sUUFBUSxJQUFJLGlCQUFpQixJQUNuRCxJQUFJLGtCQUFrQixPQUFPLENBQUMsT0FBcUIsT0FBTyxPQUFPLFlBQVksV0FBVyxJQUFJLEVBQUUsQ0FBQyxJQUMvRixDQUFDO0FBQ0wsU0FBSyxXQUFXO0FBQUEsTUFDZCxHQUFHO0FBQUEsTUFDSCxHQUFHO0FBQUEsTUFDSDtBQUFBLE1BQ0EsbUJBQW1CLElBQUksc0JBQXNCO0FBQUEsTUFDN0Msd0JBQXdCLE9BQU8sSUFBSSwyQkFBMkIsV0FDMUQsS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEtBQUssS0FBSyxNQUFNLElBQUksc0JBQXNCLENBQUMsQ0FBQyxJQUNqRSxpQkFBaUI7QUFBQSxNQUNyQixtQkFBbUI7QUFBQSxNQUNuQix3QkFBd0IsSUFBSSwyQkFBMkI7QUFBQSxNQUN2RCxzQkFBc0IsSUFBSSx5QkFBeUI7QUFBQSxNQUNuRCw2QkFBNkIsT0FBTyxJQUFJLGdDQUFnQyxXQUNwRSxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksSUFBSSxLQUFLLE1BQU0sSUFBSSwyQkFBMkIsQ0FBQyxDQUFDLElBQ3JFLGlCQUFpQjtBQUFBLE1BQ3JCLCtCQUErQixJQUFJLGtDQUFrQztBQUFBLE1BQ3JFLG9CQUFvQjtBQUFBLFFBQ2xCO0FBQUEsUUFBa0I7QUFBQSxRQUFjO0FBQUEsUUFBZ0I7QUFBQSxRQUFpQjtBQUFBLFFBQ2pFO0FBQUEsUUFBYTtBQUFBLFFBQWM7QUFBQSxRQUFlO0FBQUEsUUFBYTtBQUFBLE1BQ3pELEVBQUUsU0FBUyxPQUFPLElBQUksa0JBQWtCLENBQUMsSUFBSSxJQUFJLHFCQUFvRSxpQkFBaUI7QUFBQSxNQUN0SSxlQUFlLElBQUksa0JBQWtCLGFBQWEsSUFBSSxrQkFBa0IsWUFDcEUsSUFBSSxnQkFDSixvQkFBb0IsWUFBWSxpQkFBaUI7QUFBQSxNQUNyRCxjQUFjLE9BQU8sSUFBSSxpQkFBaUIsV0FDdEMsS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFDNUMsaUJBQWlCO0FBQUEsTUFDckIsV0FBVyxPQUFPLElBQUksY0FBYyxZQUFZLGtCQUFrQixLQUFLLElBQUksU0FBUyxJQUNoRixJQUFJLFlBQ0osb0JBQW9CLEtBQUssaUJBQWlCO0FBQUEsTUFDOUMsZUFBZSxPQUFPLElBQUksa0JBQWtCLFlBQVksa0JBQWtCLEtBQUssSUFBSSxhQUFhLElBQzVGLElBQUksZ0JBQ0osb0JBQW9CLEtBQUssaUJBQWlCO0FBQUEsTUFDOUMsa0JBQWtCLE9BQU8sSUFBSSxxQkFBcUIsWUFDOUMsSUFBSSxtQkFDSixvQkFBb0IsUUFBUSxpQkFBaUI7QUFBQSxNQUNqRCxjQUFjLE1BQU0sUUFBUSxJQUFJLFlBQVksSUFDeEMsSUFBSSxhQUFhLE9BQU8sQ0FBQyxVQUEyQixPQUFPLFVBQVUsWUFBWSxrQkFBa0IsS0FBSyxLQUFLLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxJQUMzSCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxpQkFBaUIsWUFBWTtBQUFBLElBQ2hFO0FBQ0EsUUFBSSxJQUFJLHNCQUFzQixVQUFhLElBQUksYUFBYSxNQUFPLE1BQUssU0FBUyxvQkFBb0I7QUFBQSxFQUN2RztBQUFBLEVBRUEsTUFBTSxlQUE4QjtBQUNsQyxVQUFNLEtBQUssU0FBUyxLQUFLLFFBQVE7QUFBQSxFQUNuQztBQUFBLEVBRUEsbUJBQXlCO0FBQ3ZCLGVBQVcsUUFBUSxLQUFLLElBQUksVUFBVSxnQkFBZ0Isd0JBQXdCLEdBQUc7QUFDL0UsVUFBSSxLQUFLLGdCQUFnQixrQkFBbUIsTUFBSyxLQUFLLGtCQUFrQjtBQUFBLElBQzFFO0FBQUEsRUFDRjtBQUFBLEVBRUEseUJBQXlCLE9BQWdDO0FBQ3ZELFVBQU1DLFlBQVcsc0JBQXNCLEtBQUs7QUFDNUMsSUFBQUEsVUFBUyxTQUFTLEtBQUssU0FBUztBQUNoQyxJQUFBQSxVQUFTLFFBQVEsS0FBSyxTQUFTO0FBQy9CLElBQUFBLFVBQVMsYUFBYSxxQkFBcUIsS0FBSyxRQUFRO0FBQ3hELFdBQU9BO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxpQkFBaUIsZUFBd0M7QUFDN0QsVUFBTSxpQkFBYSxnQ0FBYyxhQUFhO0FBQzlDLFFBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxzQkFBc0IsVUFBVSxFQUFHLFFBQU87QUFDOUQsVUFBTSxNQUFNLFdBQVcsWUFBWSxHQUFHO0FBQ3RDLFVBQU0sT0FBTyxNQUFNLFdBQVcsWUFBWSxHQUFHLElBQUksV0FBVyxNQUFNLEdBQUcsR0FBRyxJQUFJO0FBQzVFLFVBQU0sWUFBWSxNQUFNLFdBQVcsWUFBWSxHQUFHLElBQUksV0FBVyxNQUFNLEdBQUcsSUFBSTtBQUM5RSxRQUFJLFFBQVE7QUFDWixXQUFPLEtBQUssSUFBSSxNQUFNLHNCQUFzQixHQUFHLElBQUksSUFBSSxLQUFLLEdBQUcsU0FBUyxFQUFFLEVBQUcsVUFBUztBQUN0RixXQUFPLEdBQUcsSUFBSSxJQUFJLEtBQUssR0FBRyxTQUFTO0FBQUEsRUFDckM7QUFBQSxFQUVBLE1BQU0sY0FBYyxVQUtoQixDQUFDLEdBQW1CO0FBMVIxQjtBQTJSSSxVQUFNLGVBQWUsS0FBSyxJQUFJLFVBQVUsY0FBYztBQUN0RCxVQUFNLFNBQVMsTUFBTSxLQUFLLGNBQWMsUUFBUSxRQUFRLFlBQVk7QUFDcEUsVUFBTSxTQUFRLGFBQVEsVUFBUixZQUFpQixLQUFLLGNBQWM7QUFDbEQsVUFBTSxXQUFXLEtBQUssaUJBQWlCLEtBQUs7QUFDNUMsVUFBTSxPQUFPLE1BQU0sS0FBSyxxQkFBaUIsZ0NBQWMsR0FBRyxTQUFTLEdBQUcsTUFBTSxNQUFNLEVBQUUsR0FBRyxRQUFRLElBQUksaUJBQWlCLEVBQUUsQ0FBQztBQUN2SCxVQUFNQSxhQUFXLGFBQVEsYUFBUixZQUFvQixLQUFLLHlCQUF5QixLQUFLO0FBQ3hFLFVBQU0sT0FBTyxNQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sTUFBTSxrQkFBa0JBLFNBQVEsQ0FBQztBQUUxRSxRQUFJLFFBQVEscUJBQXFCLGdCQUFnQixhQUFhLGNBQWMsUUFBUSxhQUFhLFNBQVMsS0FBSyxNQUFNO0FBQ25ILFlBQU0sUUFBUTtBQUFBO0FBQUEsS0FBVSxLQUFLLElBQUk7QUFBQTtBQUNqQyxZQUFNLFVBQVUsTUFBTSxLQUFLLElBQUksTUFBTSxLQUFLLFlBQVk7QUFDdEQsWUFBTSxLQUFLLElBQUksTUFBTSxPQUFPLGNBQWMsR0FBRyxRQUFRLFFBQVEsQ0FBQyxHQUFHLEtBQUssRUFBRTtBQUFBLElBQzFFO0FBQ0EsVUFBTSxLQUFLLGNBQWMsSUFBSTtBQUM3QixXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsTUFBTSxjQUFjLE1BQWEsZUFBK0IsYUFBcUM7QUFDbkcsVUFBTSxPQUFPLHdDQUFpQixLQUFLLElBQUksVUFBVSxRQUFRLEtBQUs7QUFDOUQsVUFBTSxLQUFLLGFBQWE7QUFBQSxNQUN0QixNQUFNO0FBQUEsTUFDTixPQUFPLEVBQUUsTUFBTSxLQUFLLEtBQUs7QUFBQSxNQUN6QixRQUFRO0FBQUEsSUFDVixDQUFDO0FBQ0QsU0FBSyxJQUFJLFVBQVUsV0FBVyxJQUFJO0FBQ2xDLFFBQUksZUFBZSxLQUFLLGdCQUFnQixtQkFBbUI7QUFDekQsYUFBTyxXQUFXLE1BQU0sS0FBSyxnQkFBZ0IscUJBQXFCLEtBQUssS0FBSyxVQUFVLFdBQVcsR0FBRyxFQUFFO0FBQUEsSUFDeEc7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLGdCQUFnQixNQUFZLGVBQXVCLFlBQTJDO0FBelR0RztBQTZUSSxVQUFNLGdCQUFlLG9EQUFZLFdBQVosbUJBQW9CLFNBQXBCLFlBQTRCO0FBQ2pELFVBQU0sdUJBQW1CLGlDQUFlLEtBQUssU0FBUyxlQUFlLGtCQUFrQixRQUFRLGNBQWMsRUFBRSxDQUFDO0FBQ2hILFVBQU0sYUFBUyxnQ0FBYyxDQUFDLGNBQWMsZ0JBQWdCLEVBQUUsT0FBTyxPQUFPLEVBQUUsS0FBSyxHQUFHLENBQUM7QUFDdkYsVUFBTSxLQUFLLGlCQUFpQixNQUFNO0FBQ2xDLFVBQU0sTUFBTSxvQkFBSSxLQUFLO0FBQ3JCLFVBQU0sTUFBTSxDQUFDLFVBQTBCLE9BQU8sS0FBSyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBQ3BFLFVBQU0sUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsSUFBSSxJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksUUFBUSxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksV0FBVyxDQUFDLENBQUM7QUFDeEosVUFBTSxjQUFZLG1CQUFjLE1BQU0sR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUE5QixtQkFBaUMsUUFBUSxlQUFlLElBQUksa0JBQWlCO0FBQy9GLFVBQU0sT0FBTyxLQUFLLGtCQUFpQiw4Q0FBWSxhQUFaLFlBQXdCLFNBQVM7QUFDcEUsVUFBTSxnQkFBWSxnQ0FBYyxHQUFHLE1BQU0sSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLFNBQVMsRUFBRTtBQUN6RSxVQUFNLE9BQU8sTUFBTSxLQUFLLGlCQUFpQixTQUFTO0FBQ2xELFVBQU0sS0FBSyxJQUFJLE1BQU0sYUFBYSxNQUFNLE1BQU0sS0FBSyxZQUFZLENBQUM7QUFDaEUsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sZ0JBQWdCLFFBQWdCLFlBQWlGO0FBNVV6SDtBQTZVSSxVQUFNLE1BQU0sT0FBTyxLQUFLO0FBQ3hCLFFBQUksQ0FBQyxPQUFPLGdCQUFnQixLQUFLLEdBQUcsS0FBSyxVQUFVLEtBQUssR0FBRyxLQUFLLFVBQVUsS0FBSyxHQUFHLEVBQUcsUUFBTztBQUM1RixVQUFNLFlBQVksSUFBSSxNQUFNLHdCQUF3QjtBQUNwRCxVQUFNLFVBQVUsK0RBQVksT0FBWixZQUFrQixLQUFLLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBbkMsbUJBQXNDLE1BQU0sS0FBSyxPQUFqRCxtQkFBcUQsV0FBckQsWUFBK0Q7QUFDL0UsVUFBTSxTQUFTLEtBQUssSUFBSSxNQUFNLDBCQUFzQixnQ0FBYyxNQUFNLENBQUM7QUFDekUsVUFBTSxPQUFPLGtCQUFrQix5QkFBUSxTQUFTLEtBQUssSUFBSSxjQUFjLHFCQUFxQixTQUFRLDhDQUFZLFNBQVosWUFBb0IsRUFBRTtBQUMxSCxRQUFJLEVBQUUsZ0JBQWdCLHdCQUFRLFFBQU87QUFDckMsVUFBTSxTQUFTLE1BQU0sS0FBSyxJQUFJLE1BQU0sV0FBVyxJQUFJO0FBQ25ELFdBQU8sRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLE1BQU0sS0FBSyxpQkFBaUIsS0FBSyxJQUFJLEVBQUUsQ0FBQyxHQUFHLGVBQWUsS0FBSyxLQUFLO0FBQUEsRUFDMUc7QUFBQSxFQUVBLHNCQUF5QztBQUN2QyxXQUFPLEtBQUssU0FBUyxXQUNsQixPQUFPLENBQUMsU0FBUyxLQUFLLFdBQVcsUUFBUSxLQUFLLFNBQVMsS0FBSyxDQUFDLENBQUMsRUFDOUQsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLEtBQUssSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO0FBQUEsRUFDckQ7QUFBQSxFQUVBLDBCQUFvQztBQUNsQyxVQUFNLFVBQVUsSUFBSSxJQUFJLEtBQUssb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFNBQVMsS0FBSyxFQUFFLENBQUM7QUFDekUsV0FBTyxLQUFLLFNBQVMsa0JBQWtCLE9BQU8sQ0FBQyxPQUFPLFFBQVEsSUFBSSxFQUFFLENBQUM7QUFBQSxFQUN2RTtBQUFBLEVBRUEsTUFBTSxtQkFBbUIsTUFBWSxlQUF1QixTQUFrRDtBQUM1RyxVQUFNLFlBQVksTUFBTSxLQUFLLElBQUksSUFBSSxPQUFPLENBQUM7QUFDN0MsVUFBTSxRQUFRLFVBQ1gsSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLFdBQVcsS0FBSyxDQUFDLFNBQVMsS0FBSyxPQUFPLEVBQUUsQ0FBQyxFQUNuRSxPQUFPLENBQUMsU0FBa0MsU0FBUSw2QkFBTSxZQUFXLEtBQUssU0FBUyxLQUFLLENBQUMsQ0FBQztBQUMzRixRQUFJLENBQUMsTUFBTSxPQUFRLE9BQU0sSUFBSSxNQUFNLGtEQUFVO0FBQzdDLFVBQU0sVUFBVSxNQUFNLFFBQVEsSUFBSSxNQUFNLElBQUksT0FBTyxTQUFTO0FBQzFELFVBQUk7QUFDRixjQUFNLE1BQU0sTUFBTSxLQUFLLHdCQUF3QixNQUFNLE1BQU0sYUFBYTtBQUN4RSxlQUFPLEVBQUUsSUFBSSxNQUFlLE9BQU8sRUFBRSxRQUFRLEtBQUssSUFBSSxVQUFVLEtBQUssTUFBTSxJQUFJLEVBQUU7QUFBQSxNQUNuRixTQUFTLE9BQU87QUFDZCxlQUFPO0FBQUEsVUFDTCxJQUFJO0FBQUEsVUFDSixPQUFPO0FBQUEsWUFDTCxRQUFRLEtBQUs7QUFBQSxZQUNiLFVBQVUsS0FBSztBQUFBLFlBQ2YsT0FBTyxpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLO0FBQUEsVUFDOUQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQyxDQUFDO0FBQ0YsV0FBTztBQUFBLE1BQ0wsV0FBVyxRQUFRLE9BQU8sQ0FBQyxTQUE4RCxLQUFLLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUs7QUFBQSxNQUMxSCxVQUFVLFFBQVEsT0FBTyxDQUFDLFNBQTRGLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsS0FBSyxLQUFLO0FBQUEsSUFDMUo7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLGNBQWMsUUFBK0I7QUFDakQsVUFBTSxPQUFPLEtBQUssU0FBUyxXQUFXLEtBQUssQ0FBQyxTQUFTLEtBQUssT0FBTyxNQUFNO0FBQ3ZFLFFBQUksQ0FBQyxNQUFNO0FBQ1QsVUFBSSx3QkFBTyxrREFBVTtBQUNyQjtBQUFBLElBQ0Y7QUFDQSxRQUFJLENBQUMsS0FBSyxTQUFTLEtBQUssR0FBRztBQUN6QixVQUFJLHdCQUFPLDRCQUFRLEtBQUssSUFBSSx5QkFBVTtBQUN0QztBQUFBLElBQ0Y7QUFFQSxVQUFNLE1BQU0sSUFBSSxXQUFXO0FBQUEsTUFDekI7QUFBQSxNQUFLO0FBQUEsTUFBSTtBQUFBLE1BQUk7QUFBQSxNQUFJO0FBQUEsTUFBSTtBQUFBLE1BQUk7QUFBQSxNQUFJO0FBQUEsTUFBSTtBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUk7QUFBQSxNQUFJO0FBQUEsTUFBSTtBQUFBLE1BQUk7QUFBQSxNQUMxRDtBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFJO0FBQUEsTUFBSTtBQUFBLE1BQUs7QUFBQSxNQUNwRDtBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUk7QUFBQSxNQUFJO0FBQUEsTUFBSTtBQUFBLE1BQUk7QUFBQSxNQUFJO0FBQUEsTUFBRztBQUFBLE1BQUs7QUFBQSxNQUFJO0FBQUEsTUFBSztBQUFBLE1BQUs7QUFBQSxNQUFLO0FBQUEsTUFBSztBQUFBLE1BQzdEO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUs7QUFBQSxNQUFLO0FBQUEsTUFBSztBQUFBLE1BQUk7QUFBQSxNQUFJO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUk7QUFBQSxNQUFJO0FBQUEsTUFBSTtBQUFBLE1BQzNEO0FBQUEsTUFBSztBQUFBLE1BQUk7QUFBQSxNQUFJO0FBQUEsSUFDZixDQUFDO0FBQ0QsVUFBTSxVQUFVLFlBQVksSUFBSTtBQUNoQyxRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sS0FBSyx3QkFBd0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLEdBQUcsRUFBRSxNQUFNLFlBQVksQ0FBQyxHQUFHLDZCQUE2QjtBQUMxSCxZQUFNLFVBQVUsS0FBSyxJQUFJLEdBQUcsS0FBSyxNQUFNLFlBQVksSUFBSSxJQUFJLE9BQU8sQ0FBQztBQUNuRSxVQUFJLHdCQUFPLEdBQUcsS0FBSyxJQUFJLGtDQUFTLE9BQU87QUFBQSxFQUFTLEdBQUcsSUFBSSxHQUFJO0FBQUEsSUFDN0QsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLHNEQUFzRCxLQUFLO0FBQ3pFLFVBQUksd0JBQU8sR0FBRyxLQUFLLElBQUksa0NBQVMsaUJBQWlCLFFBQVEsTUFBTSxVQUFVLE9BQU8sS0FBSyxDQUFDLElBQUksR0FBSTtBQUFBLElBQ2hHO0FBQUEsRUFDRjtBQUFBLEVBRUEsbUJBQW1CLE1BQW9CLFFBQWdCLFNBQWlCLFdBQW1CLGVBQWdDO0FBQ3pILFFBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxTQUFTLGtCQUFtQixRQUFPO0FBQ3RELFVBQU0sVUFBVSxLQUFLLHdCQUF3QjtBQUM3QyxRQUFJLENBQUMsUUFBUSxRQUFRO0FBQ25CLFVBQUksd0JBQU8sNEhBQXdCLEdBQUk7QUFDdkMsYUFBTztBQUFBLElBQ1Q7QUFDQSxVQUFNLE1BQU0sR0FBRyxLQUFLLElBQUksS0FBSyxNQUFNLEtBQUssT0FBTztBQUMvQyxVQUFNLFdBQVcsS0FBSyxpQkFBaUIsSUFBSSxHQUFHO0FBQzlDLFFBQUksYUFBYSxPQUFXLFFBQU8sYUFBYSxRQUFRO0FBQ3hELFVBQU0sUUFBUSxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksS0FBSyxLQUFLLFNBQVMsc0JBQXNCLENBQUMsSUFBSTtBQUNqRixVQUFNLFFBQVEsT0FBTyxXQUFXLE1BQU07QUFDcEMsV0FBSyxpQkFBaUIsT0FBTyxHQUFHO0FBQ2hDLFdBQUssS0FBSyxrQkFBa0IsS0FBSyxNQUFNLFFBQVEsU0FBUyxXQUFXLGVBQWUsT0FBTztBQUFBLElBQzNGLEdBQUcsS0FBSztBQUNSLFNBQUssaUJBQWlCLElBQUksS0FBSyxLQUFLO0FBQ3BDLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFjLGtCQUNaLGFBQ0EsUUFDQSxTQUNBLFdBQ0EsZUFDQSxTQUNlO0FBcmJuQjtBQXNiSSxRQUFJO0FBQ0YsWUFBTSxLQUFLLGNBQWMsV0FBVztBQUNwQyxZQUFNLFVBQVUsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFdBQVc7QUFDaEUsWUFBTSxZQUFZLEtBQUssSUFBSSxNQUFNLDBCQUFzQixnQ0FBYyxTQUFTLENBQUM7QUFDL0UsVUFBSSxFQUFFLG1CQUFtQiwyQkFBVSxFQUFFLHFCQUFxQix3QkFBUTtBQUNsRSxZQUFNQSxZQUFXLGNBQWMsTUFBTSxLQUFLLElBQUksTUFBTSxLQUFLLE9BQU8sR0FBRyxRQUFRLFFBQVE7QUFDbkYsWUFBTSxPQUFPLFNBQVNBLFVBQVMsTUFBTSxNQUFNO0FBQzNDLFlBQU0sU0FBUSxrQ0FBTSxZQUFOLG1CQUFlLEtBQUssQ0FBQyxTQUEyQyxLQUFLLFNBQVMsV0FBVyxLQUFLLE9BQU87QUFDbkgsVUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFVLE1BQU0sV0FBVyxhQUFhLE1BQU0sZ0JBQWdCLFVBQVk7QUFFeEYsWUFBTSxTQUFTLE1BQU0sS0FBSyxJQUFJLE1BQU0sV0FBVyxTQUFTO0FBQ3hELFlBQU0sT0FBTyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxNQUFNLEtBQUssaUJBQWlCLFVBQVUsSUFBSSxFQUFFLENBQUM7QUFDL0UsWUFBTSxRQUFRLE1BQU0sS0FBSyxtQkFBbUIsTUFBTSxpQkFBaUIsVUFBVSxNQUFNLE9BQU87QUFDMUYsWUFBTSxjQUFhLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQzFDLFlBQU0sZUFBZSxJQUFJLE1BQUssV0FBTSxrQkFBTixZQUF1QixDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLENBQUM7QUFDM0YsaUJBQVcsV0FBVyxNQUFNLFdBQVc7QUFDckMscUJBQWEsSUFBSSxRQUFRLFFBQVEsRUFBRSxHQUFHLFNBQVMsV0FBVyxDQUFDO0FBQUEsTUFDN0Q7QUFDQSxZQUFNLGdCQUFnQixNQUFNLEtBQUssYUFBYSxPQUFPLENBQUM7QUFDdEQsWUFBTSxjQUFjO0FBRXBCLFlBQU0sZUFBZSxNQUFNLFNBQVMsV0FBVyxLQUFLLE1BQU0sVUFBVSxXQUFXLFFBQVE7QUFDdkYsVUFBSSxnQkFBZ0IsTUFBTSxVQUFVLENBQUMsRUFBRyxPQUFNLFNBQVMsTUFBTSxVQUFVLENBQUMsRUFBRTtBQUMxRSwyQkFBcUIsSUFBSTtBQUN6QixZQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sU0FBUyxrQkFBa0JBLFNBQVEsQ0FBQztBQUNoRSxZQUFNLEtBQUssbUJBQW1CLFNBQVNBLFNBQVE7QUFFL0MsVUFBSSxVQUFVO0FBQ2QsVUFBSSxnQkFBZ0IsS0FBSyxTQUFTLHdCQUF3QjtBQUN4RCxrQkFBVSxNQUFNLEtBQUssdUJBQXVCLFdBQVcsYUFBYSxPQUFPO0FBQzNFLFlBQUksU0FBUztBQUNYLGdCQUFNLGNBQWM7QUFDcEIsZ0JBQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxTQUFTLGtCQUFrQkEsU0FBUSxDQUFDO0FBQ2hFLGdCQUFNLEtBQUssbUJBQW1CLFNBQVNBLFNBQVE7QUFBQSxRQUNqRDtBQUFBLE1BQ0Y7QUFFQSxVQUFJLGNBQWM7QUFDaEIsY0FBTSxVQUFVLE1BQU0sVUFBVSxJQUFJLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRSxLQUFLLFFBQUc7QUFDckUsY0FBTSxTQUFTLEtBQUssU0FBUyx5QkFDekIsVUFBVSxpRUFBZSxpSEFDekI7QUFDSixZQUFJLHdCQUFPLHdDQUFVLE9BQU8sR0FBRyxNQUFNLElBQUksR0FBSTtBQUFBLE1BQy9DLE9BQU87QUFDTCxjQUFNLEtBQUssTUFBTSxVQUFVLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLEtBQUssUUFBRyxLQUFLO0FBQ3JFLGNBQU0sU0FBUyxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLFFBQVEsU0FBSSxLQUFLLEtBQUssRUFBRSxFQUFFLEtBQUssUUFBRztBQUN0RixZQUFJLHdCQUFPLGlGQUFnQixFQUFFLDJCQUFPLE1BQU0sMERBQWEsR0FBSTtBQUFBLE1BQzdEO0FBQUEsSUFDRixTQUFTLE9BQU87QUFDZCxjQUFRLE1BQU0sZ0RBQWdELEtBQUs7QUFDbkUsVUFBSSx3QkFBTyx5R0FBb0IsaUJBQWlCLFFBQVEsTUFBTSxVQUFVLE9BQU8sS0FBSyxDQUFDLElBQUksR0FBSTtBQUFBLElBQy9GO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyx3QkFBd0IsTUFBdUIsTUFBWSxlQUF3QztBQUMvRyxVQUFNLFdBQVcsS0FBSyxTQUFTLEtBQUs7QUFDcEMsUUFBSSxDQUFDLFNBQVUsT0FBTSxJQUFJLE1BQU0sK0JBQVc7QUFDMUMsUUFBSSxVQUFrQyxDQUFDO0FBQ3ZDLFFBQUksS0FBSyxRQUFRLEtBQUssR0FBRztBQUN2QixZQUFNLFNBQVMsS0FBSyxNQUFNLEtBQUssT0FBTztBQUN0QyxVQUFJLENBQUMsVUFBVSxPQUFPLFdBQVcsWUFBWSxNQUFNLFFBQVEsTUFBTSxFQUFHLE9BQU0sSUFBSSxNQUFNLHdEQUFnQjtBQUNwRyxnQkFBVSxPQUFPLFlBQVksT0FBTyxRQUFRLE1BQWlDLEVBQUUsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0sQ0FBQyxLQUFLLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztBQUFBLElBQzVIO0FBQ0EsVUFBTSxXQUFXLEtBQUssaUJBQWlCLGlCQUFpQixtQkFBbUI7QUFDM0UsVUFBTSxPQUFPLEtBQUssUUFBUTtBQUMxQixRQUFJO0FBQ0osUUFBSSxjQUFjO0FBQ2xCLFFBQUksS0FBSyxhQUFhLGFBQWE7QUFDakMsWUFBTSxXQUFXLG9CQUFvQixLQUFLLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxHQUFHLEtBQUssT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2xHLFlBQU0sVUFBVSxJQUFJLFlBQVk7QUFDaEMsWUFBTSxhQUFhLEtBQUssYUFBYSxRQUFRLFdBQVcsS0FBSyxFQUFFO0FBQy9ELFlBQU0sZUFBZSxTQUFTLFdBQVcsS0FBSyxFQUFFO0FBQ2hELFlBQU0sT0FBTyxRQUFRLE9BQU8sS0FBSyxRQUFRO0FBQUEsd0NBQTZDLFNBQVMsZ0JBQWdCLFlBQVk7QUFBQSxnQkFBc0IsSUFBSTtBQUFBO0FBQUEsQ0FBVTtBQUMvSixZQUFNLE9BQU8sSUFBSSxXQUFXLE1BQU0sS0FBSyxZQUFZLENBQUM7QUFDcEQsWUFBTSxPQUFPLFFBQVEsT0FBTztBQUFBLElBQVMsUUFBUTtBQUFBLENBQVE7QUFDckQsWUFBTSxXQUFXLElBQUksV0FBVyxLQUFLLFNBQVMsS0FBSyxTQUFTLEtBQUssTUFBTTtBQUN2RSxlQUFTLElBQUksTUFBTSxDQUFDO0FBQUcsZUFBUyxJQUFJLE1BQU0sS0FBSyxNQUFNO0FBQUcsZUFBUyxJQUFJLE1BQU0sS0FBSyxTQUFTLEtBQUssTUFBTTtBQUNwRyxhQUFPLFNBQVM7QUFDaEIsb0JBQWMsaUNBQWlDLFFBQVE7QUFBQSxJQUN6RCxPQUFPO0FBQ0wsYUFBTyxNQUFNLEtBQUssWUFBWTtBQUFBLElBQ2hDO0FBQ0EsVUFBTSxXQUFXLFVBQU0sNkJBQVc7QUFBQSxNQUNoQyxLQUFLO0FBQUEsTUFDTCxRQUFRLEtBQUs7QUFBQSxNQUNiO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLE9BQU87QUFBQSxJQUNULENBQUM7QUFDRCxRQUFJO0FBQ0osUUFBSTtBQUFFLGdCQUFVLFNBQVM7QUFBQSxJQUFNLFNBQVE7QUFBRSxnQkFBVTtBQUFBLElBQVc7QUFDOUQsUUFBSSxDQUFDLFdBQVcsU0FBUyxNQUFNO0FBQzdCLFVBQUk7QUFBRSxrQkFBVSxLQUFLLE1BQU0sU0FBUyxJQUFJO0FBQUEsTUFBRyxTQUFRO0FBQUUsa0JBQVUsU0FBUztBQUFBLE1BQU07QUFBQSxJQUNoRjtBQUNBLFVBQU0sVUFBVSxDQUFDLE9BQWdCLFNBQTBCLEtBQUssTUFBTSxHQUFHLEVBQUUsT0FBTyxPQUFPLEVBQUUsT0FBZ0IsQ0FBQyxTQUFTLFFBQVEsV0FBVyxPQUFPLFlBQVksV0FBWSxRQUFvQyxHQUFHLElBQUksUUFBVyxLQUFLO0FBQ2xPLFVBQU0sYUFBYSxDQUFDLEtBQUssYUFBYSxLQUFLLEdBQUcsWUFBWSxPQUFPLGNBQWMsZ0JBQWdCLGFBQWEsS0FBSyxFQUFFLE9BQU8sT0FBTztBQUNqSSxlQUFXLFFBQVEsWUFBWTtBQUM3QixZQUFNLFFBQVEsUUFBUSxTQUFTLElBQUk7QUFDbkMsVUFBSSxPQUFPLFVBQVUsWUFBWSxnQkFBZ0IsS0FBSyxNQUFNLEtBQUssQ0FBQyxFQUFHLFFBQU8sTUFBTSxLQUFLO0FBQUEsSUFDekY7QUFDQSxRQUFJLE9BQU8sWUFBWSxVQUFVO0FBQy9CLFlBQU0sUUFBUSxRQUFRLE1BQU0sd0JBQXdCO0FBQ3BELFVBQUksK0JBQVEsR0FBSSxRQUFPLE1BQU0sQ0FBQztBQUFBLElBQ2hDO0FBQ0EsVUFBTSxJQUFJLE1BQU0sZ0ZBQWU7QUFBQSxFQUNqQztBQUFBLEVBRUEsTUFBYyxjQUFjLE1BQTZCO0FBbGlCM0Q7QUFtaUJJLGVBQVcsUUFBUSxLQUFLLElBQUksVUFBVSxnQkFBZ0Isd0JBQXdCLEdBQUc7QUFDL0UsVUFBSSxLQUFLLGdCQUFnQix1QkFBcUIsVUFBSyxLQUFLLFNBQVYsbUJBQWdCLFVBQVMsS0FBTSxPQUFNLEtBQUssS0FBSyxLQUFLO0FBQUEsSUFDcEc7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFjLG1CQUFtQixNQUFhQSxXQUEwQztBQXhpQjFGO0FBeWlCSSxVQUFNLFNBQVMsa0JBQWtCQSxTQUFRO0FBQ3pDLGVBQVcsUUFBUSxLQUFLLElBQUksVUFBVSxnQkFBZ0Isd0JBQXdCLEdBQUc7QUFDL0UsVUFBSSxLQUFLLGdCQUFnQix1QkFBcUIsVUFBSyxLQUFLLFNBQVYsbUJBQWdCLFVBQVMsS0FBSyxLQUFNLE1BQUssS0FBSyxZQUFZLFFBQVEsS0FBSztBQUFBLElBQ3ZIO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBYyx1QkFBdUIsV0FBbUIsb0JBQTRCLFNBQW1DO0FBQ3JILFVBQU0saUJBQWEsZ0NBQWMsU0FBUztBQUMxQyxVQUFNLFNBQVMsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFVBQVU7QUFDOUQsUUFBSSxFQUFFLGtCQUFrQix3QkFBUSxRQUFPO0FBQ3ZDLFVBQU0sVUFBVSxLQUFLLElBQUksTUFBTSxzQkFBc0Isa0JBQWtCO0FBQ3ZFLFFBQUksbUJBQW1CLHdCQUFPO0FBQzVCLFlBQU0sTUFBTSxjQUFjLE1BQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxPQUFPLEdBQUcsUUFBUSxRQUFRO0FBQzlFLFlBQU0sWUFBWSxhQUFhLElBQUksSUFBSSxFQUFFLEtBQUssQ0FBQyxTQUFTLGtCQUFrQixJQUFJLEVBQUUsS0FBSyxDQUFDLFVBQ3BGLE1BQU0sU0FBUyxXQUFXLE1BQU0sT0FBTyxZQUFZLE1BQU0sV0FBVyxjQUFjLE1BQU0sZ0JBQWdCLFdBQVcsQ0FBQztBQUN0SCxVQUFJLFVBQVcsUUFBTztBQUFBLElBQ3hCO0FBQ0EsZUFBVyxRQUFRLEtBQUssSUFBSSxNQUFNLFNBQVMsR0FBRztBQUM1QyxVQUFJLEtBQUssU0FBUyxzQkFBc0IsS0FBSyxVQUFVLFlBQVksTUFBTSxrQkFBbUI7QUFDNUYsVUFBSTtBQUNGLGNBQU0sT0FBTyxNQUFNLEtBQUssSUFBSSxNQUFNLFdBQVcsSUFBSTtBQUNqRCxZQUFJLEtBQUssU0FBUyxVQUFVLEVBQUcsUUFBTztBQUFBLE1BQ3hDLFNBQVE7QUFBQSxNQUVSO0FBQUEsSUFDRjtBQUNBLFFBQUk7QUFDRixZQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sTUFBTTtBQUNsQyxhQUFPO0FBQUEsSUFDVCxTQUFTLE9BQU87QUFDZCxjQUFRLEtBQUssd0RBQXdELEtBQUs7QUFDMUUsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQUEsRUFFUSxpQkFBaUIsVUFBMEI7QUE1a0JyRDtBQTZrQkksVUFBTSxhQUFZLGNBQVMsTUFBTSxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQXpCLG1CQUE0QjtBQUM5QyxZQUFRLE9BQUUsS0FBSyxhQUFhLEtBQUssY0FBYyxNQUFNLGNBQWMsS0FBSyxhQUFhLE1BQU0sY0FBYyxLQUFLLGlCQUFpQixLQUFLLGFBQWEsTUFBTSxhQUFhLEVBQTZCLGdDQUFhLEVBQUUsTUFBeE0sWUFBNk07QUFBQSxFQUN2TjtBQUFBLEVBRUEsTUFBTSxpQkFBaUIsWUFBbUIsTUFBMkM7QUFqbEJ2RjtBQWtsQkksVUFBTSxTQUFTLGNBQWMsSUFBSSxLQUFLLHNCQUFPLEtBQUs7QUFDbEQsVUFBTUEsWUFBVyxLQUFLLHlCQUF5QixLQUFLO0FBQ3BELElBQUFBLFVBQVMsS0FBSyxVQUFVLENBQUMsRUFBRSxJQUFJQSxVQUFTLEtBQUssS0FBSyxVQUFVLE1BQU0sUUFBUSxNQUFNLE1BQU0sQ0FBQztBQUN2Rix5QkFBcUJBLFVBQVMsSUFBSTtBQUNsQyxJQUFBQSxVQUFTLEtBQUssT0FBTyxLQUFLLFdBQVcsSUFBSTtBQUN6QyxJQUFBQSxVQUFTLFFBQVE7QUFDakIsSUFBQUEsVUFBUyxhQUFhO0FBQUEsTUFDcEIsWUFBWSxXQUFXO0FBQUEsTUFDdkIsY0FBYyxLQUFLO0FBQUEsTUFDbkIsYUFBYSxXQUFXO0FBQUEsTUFDeEIsZ0JBQWdCLGNBQWMsSUFBSSxLQUFLO0FBQUEsSUFDekM7QUFJQSxVQUFNLGdCQUFlLHNCQUFXLFdBQVgsbUJBQW1CLFNBQW5CLFlBQTJCO0FBQ2hELFVBQU0sdUJBQW1CLGdDQUFjLEtBQUssU0FBUyxlQUFlLGdCQUFnQjtBQUNwRixVQUFNLGtCQUFrQixLQUFLLGlCQUFpQixXQUFXLFFBQVE7QUFDakUsVUFBTSxtQkFBZSxnQ0FBYyxDQUFDLGNBQWMsa0JBQWtCLGVBQWUsRUFBRSxPQUFPLE9BQU8sRUFBRSxLQUFLLEdBQUcsQ0FBQztBQUM5RyxVQUFNLEtBQUssaUJBQWlCLFlBQVk7QUFDeEMsVUFBTSxPQUFPLE1BQU0sS0FBSyxxQkFBaUIsZ0NBQWMsR0FBRyxZQUFZLElBQUksS0FBSyxpQkFBaUIsS0FBSyxDQUFDLElBQUksaUJBQWlCLEVBQUUsQ0FBQztBQUM5SCxVQUFNLE9BQU8sTUFBTSxLQUFLLElBQUksTUFBTSxPQUFPLE1BQU0sa0JBQWtCQSxTQUFRLENBQUM7QUFDMUUsV0FBTyxFQUFFLE1BQU0sS0FBSyxNQUFNLE9BQU8sS0FBSyxTQUFTO0FBQUEsRUFDakQ7QUFBQSxFQUVBLE1BQU0sZ0JBQWdCLE1BQWMsYUFBYSxJQUFJLGVBQStCLGFBQXFDO0FBQ3ZILFVBQU0saUJBQWEsZ0NBQWMsS0FBSyxRQUFRLGdCQUFnQixFQUFFLENBQUM7QUFDakUsVUFBTSxTQUFTLEtBQUssSUFBSSxNQUFNLHNCQUFzQixVQUFVO0FBQzlELFVBQU0sV0FBVyxrQkFBa0IseUJBQVEsU0FBUyxLQUFLLElBQUksY0FBYyxxQkFBcUIsTUFBTSxVQUFVO0FBQ2hILFFBQUksRUFBRSxvQkFBb0IsMkJBQVUsQ0FBQyxLQUFLLGNBQWMsUUFBUSxHQUFHO0FBQ2pFLFVBQUksd0JBQU8sNkNBQVUsSUFBSSxFQUFFO0FBQzNCO0FBQUEsSUFDRjtBQUNBLFVBQU0sS0FBSyxjQUFjLFVBQVUsZUFBZSxXQUFXO0FBQUEsRUFDL0Q7QUFBQSxFQUVBLE1BQWMsaUJBQWlCLFFBQStCO0FBQzVELFVBQU0saUJBQWEsZ0NBQWMsTUFBTTtBQUN2QyxRQUFJLENBQUMsY0FBYyxLQUFLLElBQUksTUFBTSxzQkFBc0IsVUFBVSxhQUFhLHlCQUFTO0FBQ3hGLFVBQU0sUUFBUSxXQUFXLE1BQU0sR0FBRyxFQUFFLE9BQU8sT0FBTztBQUNsRCxRQUFJLFVBQVU7QUFDZCxlQUFXLFFBQVEsT0FBTztBQUN4QixnQkFBVSxVQUFVLEdBQUcsT0FBTyxJQUFJLElBQUksS0FBSztBQUMzQyxVQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLE9BQU8sRUFBRyxPQUFNLEtBQUssSUFBSSxNQUFNLGFBQWEsT0FBTztBQUFBLElBQy9GO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTSxrQkFBa0IsTUFBYSxZQUFZLE1BQTZCO0FBam9CaEY7QUFrb0JJLFFBQUksQ0FBQyxLQUFLLG9CQUFvQixJQUFJLEVBQUcsUUFBTztBQUM1QyxRQUFJLEtBQUssd0JBQXdCLEtBQUssS0FBTSxRQUFPO0FBQ25ELFNBQUssc0JBQXNCLEtBQUs7QUFDaEMsUUFBSTtBQUNGLFlBQU0sU0FBUyxNQUFNLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSTtBQUM3QyxZQUFNLFFBQVEsS0FBSyxTQUFTLFFBQVEsV0FBVyxFQUFFLEtBQUs7QUFDdEQsWUFBTUEsWUFBVyxjQUFjLFFBQVEsS0FBSztBQUM1QyxZQUFNLGNBQWEsZ0JBQUssV0FBTCxtQkFBYSxTQUFiLFlBQXFCO0FBQ3hDLFlBQU0sb0JBQWdCLGdDQUFjLEdBQUcsYUFBYSxHQUFHLFVBQVUsTUFBTSxFQUFFLEdBQUcsS0FBSyxpQkFBaUIsS0FBSyxDQUFDLElBQUksaUJBQWlCLEVBQUU7QUFDL0gsWUFBTSxXQUFXLEtBQUssSUFBSSxNQUFNLHNCQUFzQixhQUFhO0FBQ25FLFVBQUk7QUFFSixVQUFJLG9CQUFvQiwwQkFBUyxLQUFLLGNBQWMsUUFBUSxHQUFHO0FBQzdELGlCQUFTO0FBQUEsTUFDWCxPQUFPO0FBQ0wsY0FBTSxPQUFPLFdBQVcsTUFBTSxLQUFLLGlCQUFpQixhQUFhLElBQUk7QUFDckUsaUJBQVMsTUFBTSxLQUFLLElBQUksTUFBTSxPQUFPLE1BQU0sa0JBQWtCQSxTQUFRLENBQUM7QUFDdEUsWUFBSSx3QkFBTywrREFBYSxPQUFPLElBQUk7QUFBQSxxRUFBaUIsR0FBSTtBQUFBLE1BQzFEO0FBRUEsVUFBSSxVQUFXLE9BQU0sS0FBSyxjQUFjLFNBQVEsVUFBSyxJQUFJLFVBQVUsZUFBbkIsWUFBaUMsTUFBUztBQUMxRixhQUFPO0FBQUEsSUFDVCxTQUFTLE9BQU87QUFDZCxjQUFRLE1BQU0sMENBQTBDLEtBQUs7QUFDN0QsVUFBSSx3QkFBTywwR0FBcUIsR0FBSTtBQUNwQyxhQUFPO0FBQUEsSUFDVCxVQUFFO0FBQ0EsV0FBSyxzQkFBc0I7QUFBQSxJQUM3QjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLGNBQWMsTUFBc0I7QUFDbEMsV0FBTyxLQUFLLFVBQVUsWUFBWSxNQUFNO0FBQUEsRUFDMUM7QUFBQSxFQUVBLG9CQUFvQixNQUFzQjtBQUN4QyxXQUFPLEtBQUssS0FBSyxZQUFZLEVBQUUsU0FBUyxhQUFhO0FBQUEsRUFDdkQ7QUFBQSxFQUVBLE1BQWMsb0JBQW9CLE1BQTRCO0FBenFCaEU7QUEwcUJJLFVBQU0sU0FBUyxNQUFNLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSTtBQUM3QyxVQUFNLFFBQVEsS0FBSztBQUNuQixVQUFNQSxZQUFXLG1CQUFtQixRQUFRLEtBQUs7QUFDakQsSUFBQUEsVUFBUyxTQUFTLEtBQUssU0FBUztBQUNoQyxJQUFBQSxVQUFTLFFBQVEsS0FBSyxTQUFTO0FBQy9CLElBQUFBLFVBQVMsYUFBYSxxQkFBcUIsS0FBSyxRQUFRO0FBQ3hELFVBQU0sS0FBSyxjQUFjLEVBQUUsVUFBQUEsV0FBVSxPQUFPLEdBQUcsS0FBSyxpQkFBTyxTQUFRLGdCQUFLLFdBQUwsbUJBQWEsU0FBYixZQUFxQixHQUFHLENBQUM7QUFBQSxFQUM5RjtBQUFBLEVBRUEsTUFBYyxjQUFjLGdCQUFvQyxZQUEyQztBQW5yQjdHO0FBb3JCSSxVQUFNLFlBQVksMENBQW1CLEtBQUssU0FBUyxtQkFBaUIsOENBQVksV0FBWixtQkFBb0IsU0FBUTtBQUNoRyxRQUFJLENBQUMsVUFBVyxRQUFPO0FBQ3ZCLFVBQU0saUJBQWEsZ0NBQWMsU0FBUztBQUMxQyxVQUFNLFdBQVcsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFVBQVU7QUFDaEUsUUFBSSxvQkFBb0IseUJBQVMsUUFBTztBQUN4QyxVQUFNLEtBQUssaUJBQWlCLFVBQVU7QUFDdEMsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLGdCQUF3QjtBQUM5QixVQUFNLE1BQU0sb0JBQUksS0FBSztBQUNyQixVQUFNLE1BQU0sQ0FBQyxVQUEwQixPQUFPLEtBQUssRUFBRSxTQUFTLEdBQUcsR0FBRztBQUNwRSxVQUFNLFFBQVEsR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLElBQUksSUFBSSxTQUFTLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLFFBQVEsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLFNBQVMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxJQUFJLFdBQVcsQ0FBQyxDQUFDO0FBQ2xJLFdBQU8sR0FBRyxLQUFLLFNBQVMsVUFBVSxJQUFJLEtBQUssR0FBRyxLQUFLO0FBQUEsRUFDckQ7QUFBQSxFQUVRLGlCQUFpQixPQUF1QjtBQUM5QyxXQUFPLE1BQU0sUUFBUSxxQkFBcUIsR0FBRyxFQUFFLFFBQVEsUUFBUSxHQUFHLEVBQUUsS0FBSyxLQUFLO0FBQUEsRUFDaEY7QUFBQSxFQUVRLGVBQWUsU0FBK0M7QUFDcEUsVUFBTSxhQUFhLEtBQUssSUFBSSxNQUFNLHNCQUFzQixRQUFRLFVBQVU7QUFDMUUsV0FBTyxzQkFBc0IseUJBQVEsV0FBVyxXQUFXO0FBQUEsRUFDN0Q7QUFBQSxFQUVBLE1BQWMscUJBQXFCLFNBQXNCLFNBQXNEO0FBN3NCakg7QUE4c0JJLFVBQU0sU0FBUyxNQUFNLEtBQUssUUFBUSxpQkFBOEIsaUJBQWlCLENBQUM7QUFDbEYsZUFBVyxTQUFTLFFBQVE7QUFDMUIsVUFBSSxNQUFNLFFBQVEsaUJBQWlCLE9BQVE7QUFDM0MsWUFBTSxhQUFZLGlCQUFNLGFBQWEsS0FBSyxNQUF4QixZQUE2QixNQUFNLFFBQVEsUUFBM0MsWUFBa0Q7QUFDcEUsWUFBTSxZQUFXLDJCQUFVLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBdEIsbUJBQXlCLE1BQU0sS0FBSyxPQUFwQyxtQkFBd0MsV0FBeEMsWUFBa0Q7QUFDbkUsVUFBSSxDQUFDLFNBQVMsWUFBWSxFQUFFLFNBQVMsSUFBSSxpQkFBaUIsRUFBRSxFQUFHO0FBQy9ELFlBQU0sT0FBTyxLQUFLLElBQUksY0FBYyxxQkFBcUIsVUFBVSxRQUFRLFVBQVU7QUFDckYsVUFBSSxFQUFFLGdCQUFnQiwyQkFBVSxDQUFDLEtBQUssY0FBYyxJQUFJLEVBQUc7QUFDM0QsWUFBTSxRQUFRLGVBQWU7QUFDN0IsVUFBSTtBQUNGLGNBQU0sU0FBUyxNQUFNLEtBQUssSUFBSSxNQUFNLFdBQVcsSUFBSTtBQUNuRCxjQUFNQSxZQUFXLGNBQWMsUUFBUSxLQUFLLFFBQVE7QUFDcEQsNEJBQW9CLE9BQU9BLFdBQVUsRUFBRSxLQUFLLEtBQUssS0FBSyxNQUFNLFdBQVcsS0FBSyxTQUFTLGdCQUFnQixtQkFBbUIscUJBQXFCLEtBQUssUUFBUSxFQUFFLENBQUM7QUFBQSxNQUMvSixTQUFTLE9BQU87QUFDZCxnQkFBUSxNQUFNLHNDQUFzQyxLQUFLO0FBQ3pELGNBQU0sTUFBTTtBQUNaLGNBQU0sVUFBVSxFQUFFLEtBQUssbUJBQW1CLE1BQU0sK0RBQWEsQ0FBQztBQUFBLE1BQ2hFO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgInRleHQiLCAiX2EiLCAiX2IiLCAiX2EiLCAiX2IiLCAid2lkdGgiLCAiX2MiLCAiYmFja2dyb3VuZCIsICJkb2N1bWVudCIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSIsICJfYSIsICJfYiIsICJfYyIsICJfZCIsICJfZSIsICJfZiIsICJfZyIsICJfaCIsICJfaSIsICJfaiIsICJkb2N1bWVudCIsICJzZWxlY3RlZCIsICJkb2N1bWVudCIsICJfYSIsICJfYiIsICJfYyIsICJkb2N1bWVudCJdCn0K
