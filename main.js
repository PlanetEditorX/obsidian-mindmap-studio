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
var import_obsidian6 = require("obsidian");

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
    const normalized2 = node.content.map(normalizeContentBlock).filter((block) => Boolean(block));
    if (normalized2.length) return normalized2;
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
  const normalized2 = normalizeDocument(doc, doc.title);
  return `${JSON.stringify(normalized2, null, 2)}
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
      const compact2 = cell.replace(/\s/g, "");
      if (compact2.startsWith(":") && compact2.endsWith(":")) return "center";
      if (compact2.endsWith(":")) return "right";
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
  imageFailoverUseLocalFallback: true,
  globalSearchMaxResults: 100
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
    containerEl.createEl("h3", { text: "\u5168\u5C40\u641C\u7D22\u7D22\u5F15" });
    const searchStatus = this.plugin.getGlobalSearchIndexStatus();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: searchStatus.building ? `\u6B63\u5728\u5EFA\u7ACB\u7D22\u5F15\uFF1B\u5F53\u524D\u5DF2\u6536\u5F55 ${searchStatus.files} \u4E2A\u5BFC\u56FE\u3001${searchStatus.nodes} \u4E2A\u8282\u70B9\u3002` : `\u672C\u5730\u7D22\u5F15\u5DF2\u6536\u5F55 ${searchStatus.files} \u4E2A\u5BFC\u56FE\u3001${searchStatus.nodes} \u4E2A\u8282\u70B9\u3002\u7D22\u5F15\u6587\u4EF6\u4EC5\u4FDD\u5B58\u5728\u63D2\u4EF6\u76EE\u5F55\uFF0C\u4E0D\u4F1A\u4E0A\u4F20\u7F51\u7EDC\u3002`
    });
    new import_obsidian.Setting(containerEl).setName("\u5355\u6B21\u6700\u591A\u663E\u793A\u7ED3\u679C").setDesc("\u8303\u56F4 20\u2013500\u3002\u7D22\u5F15\u4F1A\u641C\u7D22\u6574\u4E2A\u4ED3\u5E93\u4E2D\u7684\u6240\u6709 .mindmap \u6587\u4EF6\u3002").addSlider((slider) => slider.setLimits(20, 500, 10).setDynamicTooltip().setValue(this.plugin.settings.globalSearchMaxResults).onChange(async (value) => {
      this.plugin.settings.globalSearchMaxResults = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u91CD\u5EFA\u641C\u7D22\u7D22\u5F15").setDesc("\u5F53\u6587\u4EF6\u7531\u5916\u90E8\u540C\u6B65\u5DE5\u5177\u6279\u91CF\u4FEE\u6539\uFF0C\u6216\u641C\u7D22\u7ED3\u679C\u4E0E\u5B9E\u9645\u5185\u5BB9\u4E0D\u4E00\u81F4\u65F6\u4F7F\u7528\u3002").addButton((button) => button.setButtonText("\u7ACB\u5373\u91CD\u5EFA").onClick(async () => {
      button.setDisabled(true);
      try {
        await this.plugin.rebuildGlobalSearchIndex();
        this.display();
      } finally {
        button.setDisabled(false);
      }
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
function edgeWidthForDepth(appearance, depth, maxDepth = 5) {
  var _a, _b;
  const maximum = Math.max(0.5, Math.min(8, (_a = appearance.edgeWidth) != null ? _a : 2.2));
  if (appearance.edgeWidthMode !== "tapered") return maximum;
  const minimum = Math.max(0.25, Math.min(maximum, (_b = appearance.edgeMinWidth) != null ? _b : Math.min(1, maximum)));
  const deepest = Math.max(1, Math.floor(maxDepth));
  const progress = deepest <= 1 ? 0 : Math.min(1, Math.max(0, depth - 1) / (deepest - 1));
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
  const maxDepth = Math.max(1, ...layout.nodes.map((position) => position.depth));
  const edges = layout.nodes.filter((position) => position.parentId).map((position) => {
    var _a2, _b2;
    const parent = position.parentId ? layout.byId.get(position.parentId) : void 0;
    const stroke = validColor((_a2 = position.node.style) == null ? void 0 : _a2.color, (_b2 = branchColorMap.get(position.node.id)) != null ? _b2 : defaultEdge);
    const width2 = edgeWidthForDepth(appearance, position.depth, maxDepth);
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
        const normalized2 = normalizeDocument(parsed, this.document.title);
        this.onImport(normalized2);
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
    this.addToolbarButton("search", "\u641C\u7D22\u5F53\u524D\u5BFC\u56FE\uFF08Ctrl/Cmd+F\uFF09", () => this.openSearch());
    this.addToolbarButton("file-search", "\u5168\u5C40\u641C\u7D22\u6240\u6709\u5BFC\u56FE\uFF08Ctrl/Cmd+Shift+F\uFF09", () => this.callbacks.onGlobalSearch());
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
    const maxDepth = Math.max(1, ...this.layout.nodes.map((position) => position.depth));
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
      const edgeWidth = edgeWidthForDepth(appearance, position.depth, maxDepth);
      path.setAttribute("stroke-width", String(edgeWidth));
      path.style.setProperty("--mmc-current-edge-width", `${edgeWidth}px`);
      path.style.setProperty("stroke-width", `${edgeWidth}px`, "important");
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
    if (mod && event.shiftKey && key === "f") {
      event.preventDefault();
      this.callbacks.onGlobalSearch();
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
    this.pendingFocusNodeId = null;
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
        onGlobalSearch: () => this.plugin.openGlobalSearch(),
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
    if (this.pendingFocusNodeId && this.editor) {
      const nodeId = this.pendingFocusNodeId;
      this.pendingFocusNodeId = null;
      window.setTimeout(() => {
        var _a2;
        return (_a2 = this.editor) == null ? void 0 : _a2.focusNodeById(nodeId);
      }, 20);
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
    if (!this.editor) {
      this.pendingFocusNodeId = nodeId;
      return;
    }
    this.editor.focusNodeById(nodeId);
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

// src/global-search.ts
var import_obsidian5 = require("obsidian");
function normalized(value) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}
function compact(value, max = 180) {
  const text = value == null ? void 0 : value.replace(/\s+/g, " ").trim();
  if (!text) return void 0;
  return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
}
function nodeDisplayText(node) {
  var _a;
  const text = nodePlainText(node).trim();
  if (text) return text;
  if ((_a = node.code) == null ? void 0 : _a.code.trim()) return `\u4EE3\u7801\uFF1A${compact(node.code.code, 64)}`;
  if (node.table) return `\u8868\u683C\uFF1A${node.table.headers.join(" / ") || `${node.table.rows.length} \u884C`}`;
  if (nodeContentBlocks(node).some((block) => block.type === "image")) return "\u56FE\u7247\u8282\u70B9";
  return "\u672A\u547D\u540D\u8282\u70B9";
}
function fieldValues(node) {
  var _a, _b, _c, _d, _e, _f, _g;
  const values = [];
  const text = nodePlainText(node).trim();
  if (text) values.push({ kind: "\u8282\u70B9\u6587\u5B57", value: text });
  if ((_a = node.note) == null ? void 0 : _a.trim()) values.push({ kind: "\u5907\u6CE8", value: node.note });
  if ((_b = node.tags) == null ? void 0 : _b.length) values.push({ kind: "\u6807\u7B7E", value: node.tags.join(" ") });
  if ((_c = node.link) == null ? void 0 : _c.trim()) values.push({ kind: "\u94FE\u63A5", value: node.link });
  if ((_d = node.icon) == null ? void 0 : _d.trim()) values.push({ kind: "\u56FE\u6807", value: node.icon });
  if (node.task) values.push({ kind: "\u4EFB\u52A1", value: node.task });
  if ((_e = node.submap) == null ? void 0 : _e.path) values.push({ kind: "\u5B50\u5BFC\u56FE", value: `${(_f = node.submap.title) != null ? _f : ""} ${node.submap.path}` });
  if (node.code) values.push({ kind: "\u4EE3\u7801", value: `${(_g = node.code.language) != null ? _g : ""}
${node.code.code}` });
  if (node.table) values.push({ kind: "\u8868\u683C", value: [...node.table.headers, ...node.table.rows.flat()].join(" ") });
  const imageValues = nodeContentBlocks(node).filter((block) => block.type === "image").map((block) => {
    var _a2, _b2;
    return `${(_a2 = block.alt) != null ? _a2 : ""} ${block.source} ${(_b2 = block.localSource) != null ? _b2 : ""}`;
  }).join(" ");
  if (imageValues.trim()) values.push({ kind: "\u56FE\u7247", value: imageValues });
  return values;
}
function buildSearchEntries(document2, filePath) {
  const entries = [];
  const visit = (node, ancestors, depth) => {
    var _a, _b, _c, _d, _e;
    const display = nodeDisplayText(node);
    const fields = fieldValues(node);
    const breadcrumb = [...ancestors, display];
    const searchText = normalized([
      document2.title,
      filePath,
      ...breadcrumb,
      nodeSearchText(node),
      ...fields.map((field) => field.value)
    ].join(" "));
    entries.push({
      key: `${filePath}::${node.id}`,
      filePath,
      fileTitle: document2.title || ((_a = filePath.split("/").at(-1)) == null ? void 0 : _a.replace(/\.mindmap$/i, "")) || "\u601D\u7EF4\u5BFC\u56FE",
      nodeId: node.id,
      nodeText: display,
      breadcrumb,
      depth,
      searchableText: searchText,
      note: compact(node.note),
      tags: (_b = node.tags) == null ? void 0 : _b.slice(0, 20),
      matchedKinds: fields.map((field) => field.kind),
      submapPath: (_c = node.submap) == null ? void 0 : _c.path,
      isSubmapDocument: Boolean((_d = document2.navigation) == null ? void 0 : _d.parentPath),
      parentMapPath: (_e = document2.navigation) == null ? void 0 : _e.parentPath
    });
    node.children.forEach((child) => visit(child, breadcrumb, depth + 1));
  };
  visit(document2.root, [], 0);
  return entries;
}
function resultSnippet(entry, query) {
  var _a, _b, _c, _d;
  const queryNormalized = normalized(query);
  const candidates = [
    { kind: "\u8282\u70B9\u6587\u5B57", value: entry.nodeText },
    { kind: "\u5907\u6CE8", value: entry.note },
    { kind: "\u6807\u7B7E", value: (_a = entry.tags) == null ? void 0 : _a.join("\u3001") },
    { kind: "\u8DEF\u5F84", value: entry.breadcrumb.join(" \u203A ") },
    { kind: "\u6587\u4EF6", value: `${entry.fileTitle} ${entry.filePath}` },
    { kind: "\u5185\u5BB9", value: entry.searchableText }
  ];
  const matched = candidates.find((candidate) => candidate.value && normalized(candidate.value).includes(queryNormalized));
  return {
    kind: (_b = matched == null ? void 0 : matched.kind) != null ? _b : "\u5185\u5BB9",
    snippet: (_d = compact((_c = matched == null ? void 0 : matched.value) != null ? _c : entry.nodeText, 220)) != null ? _d : entry.nodeText
  };
}
function searchEntries(entries, query, limit = 100) {
  var _a, _b, _c;
  const phrase = normalized(query);
  if (!phrase) return [];
  const terms = phrase.split(/\s+/).filter(Boolean);
  const results = [];
  for (const entry of entries) {
    if (!terms.every((term) => entry.searchableText.includes(term))) continue;
    const nodeText = normalized(entry.nodeText);
    const fileTitle = normalized(entry.fileTitle);
    const breadcrumb = normalized(entry.breadcrumb.join(" "));
    let score = 0;
    if (nodeText === phrase) score += 500;
    else if (nodeText.startsWith(phrase)) score += 320;
    else if (nodeText.includes(phrase)) score += 230;
    if (fileTitle === phrase) score += 180;
    else if (fileTitle.includes(phrase)) score += 90;
    if (breadcrumb.includes(phrase)) score += 70;
    if (normalized((_b = (_a = entry.tags) == null ? void 0 : _a.join(" ")) != null ? _b : "").includes(phrase)) score += 100;
    if (normalized((_c = entry.note) != null ? _c : "").includes(phrase)) score += 60;
    if (entry.isSubmapDocument) score += 5;
    score += Math.max(0, 25 - entry.depth * 2);
    const { kind, snippet } = resultSnippet(entry, query);
    results.push({ ...entry, score, matchedKind: kind, snippet });
  }
  return results.sort((left, right) => right.score - left.score || left.filePath.localeCompare(right.filePath) || left.depth - right.depth).slice(0, limit);
}
var MindMapSearchIndex = class {
  constructor(app, indexPath, extension = "mindmap") {
    this.app = app;
    this.indexPath = indexPath;
    this.extension = extension;
    this.data = { version: 1, generatedAt: (/* @__PURE__ */ new Date(0)).toISOString(), files: {} };
    this.ready = false;
    this.building = false;
    this.saveTimer = null;
    this.fileTimers = /* @__PURE__ */ new Map();
    this.rebuildPromise = null;
  }
  async initialize() {
    await this.load();
    await this.rebuildChangedFiles();
  }
  destroy() {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    for (const timer of this.fileTimers.values()) window.clearTimeout(timer);
    this.fileTimers.clear();
    void this.saveNow();
  }
  getStatus() {
    const files = Object.keys(this.data.files).length;
    const nodes = Object.values(this.data.files).reduce((sum, file) => sum + file.entries.length, 0);
    return { ready: this.ready, building: this.building, files, nodes, lastBuiltAt: this.data.generatedAt };
  }
  allEntries() {
    return Object.values(this.data.files).flatMap((file) => file.entries);
  }
  search(query, limit = 100) {
    return searchEntries(this.allEntries(), query, limit);
  }
  queueFile(file, delay = 500) {
    if (file.extension.toLocaleLowerCase() !== this.extension) return;
    const previous = this.fileTimers.get(file.path);
    if (previous !== void 0) window.clearTimeout(previous);
    const timer = window.setTimeout(() => {
      this.fileTimers.delete(file.path);
      void this.indexFile(file).then(() => this.scheduleSave());
    }, delay);
    this.fileTimers.set(file.path, timer);
  }
  removeFile(path) {
    const normalizedPath = (0, import_obsidian5.normalizePath)(path);
    if (!this.data.files[normalizedPath]) return;
    delete this.data.files[normalizedPath];
    this.data.generatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.scheduleSave();
  }
  renameFile(file, oldPath) {
    this.removeFile(oldPath);
    this.queueFile(file, 50);
  }
  async rebuildAll() {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this.performRebuild(true).finally(() => {
      this.rebuildPromise = null;
    });
    return this.rebuildPromise;
  }
  async rebuildChangedFiles() {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this.performRebuild(false).finally(() => {
      this.rebuildPromise = null;
    });
    return this.rebuildPromise;
  }
  async performRebuild(force) {
    this.building = true;
    try {
      const files = this.app.vault.getFiles().filter((file) => file.extension.toLocaleLowerCase() === this.extension);
      const currentPaths = new Set(files.map((file) => file.path));
      for (const path of Object.keys(this.data.files)) {
        if (!currentPaths.has(path)) delete this.data.files[path];
      }
      for (const file of files) {
        const indexed = this.data.files[file.path];
        if (!force && indexed && indexed.mtime === file.stat.mtime && indexed.size === file.stat.size) continue;
        await this.indexFile(file);
      }
      this.data.generatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.ready = true;
      await this.saveNow();
    } finally {
      this.building = false;
    }
  }
  async indexFile(file) {
    try {
      const source = await this.app.vault.cachedRead(file);
      const document2 = parseDocument(source, file.basename);
      this.data.files[file.path] = {
        mtime: file.stat.mtime,
        size: file.stat.size,
        title: document2.title,
        entries: buildSearchEntries(document2, file.path)
      };
      this.data.generatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.ready = true;
    } catch (error) {
      console.warn(`MindMap Studio could not index ${file.path}`, error);
      delete this.data.files[file.path];
    }
  }
  async load() {
    try {
      if (!await this.app.vault.adapter.exists(this.indexPath)) {
        this.ready = true;
        return;
      }
      const parsed = JSON.parse(await this.app.vault.adapter.read(this.indexPath));
      if (parsed.version === 1 && parsed.files && typeof parsed.files === "object") {
        this.data = {
          version: 1,
          generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : (/* @__PURE__ */ new Date(0)).toISOString(),
          files: parsed.files
        };
      }
      this.ready = true;
    } catch (error) {
      console.warn("MindMap Studio could not load the global search index", error);
      this.data = { version: 1, generatedAt: (/* @__PURE__ */ new Date(0)).toISOString(), files: {} };
      this.ready = true;
    }
  }
  scheduleSave() {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.saveNow();
    }, 800);
  }
  async saveNow() {
    try {
      await this.app.vault.adapter.write(this.indexPath, JSON.stringify(this.data));
    } catch (error) {
      console.warn("MindMap Studio could not save the global search index", error);
    }
  }
};
function appendHighlightedText(container, text, query) {
  const phrase = query.trim();
  if (!phrase) {
    container.setText(text);
    return;
  }
  const lowerText = text.toLocaleLowerCase();
  const lowerPhrase = phrase.toLocaleLowerCase();
  const index = lowerText.indexOf(lowerPhrase);
  if (index < 0) {
    container.setText(text);
    return;
  }
  if (index > 0) container.appendText(text.slice(0, index));
  container.createEl("mark", { text: text.slice(index, index + phrase.length) });
  if (index + phrase.length < text.length) container.appendText(text.slice(index + phrase.length));
}
var GlobalMindMapSearchModal = class extends import_obsidian5.Modal {
  constructor(app, index, maxResults, onOpenResult, onRebuild) {
    super(app);
    this.index = index;
    this.maxResults = maxResults;
    this.onOpenResult = onOpenResult;
    this.onRebuild = onRebuild;
    this.activeIndex = -1;
    this.renderedResults = [];
  }
  onOpen() {
    this.modalEl.addClass("mms-global-search-modal");
    this.titleEl.setText("\u5168\u5C40\u641C\u7D22\u601D\u7EF4\u5BFC\u56FE");
    const searchRow = this.contentEl.createDiv({ cls: "mms-global-search-row" });
    const icon = searchRow.createSpan({ cls: "mms-global-search-icon" });
    (0, import_obsidian5.setIcon)(icon, "search");
    this.inputEl = searchRow.createEl("input", {
      type: "search",
      cls: "mms-global-search-input",
      attr: { placeholder: "\u641C\u7D22\u6240\u6709\u5BFC\u56FE\u3001\u5B50\u8282\u70B9\u548C\u5B50\u5BFC\u56FE\u2026", autocomplete: "off", spellcheck: "false" }
    });
    const rebuild = searchRow.createEl("button", { cls: "mms-global-search-rebuild", attr: { type: "button", title: "\u91CD\u5EFA\u641C\u7D22\u7D22\u5F15" } });
    (0, import_obsidian5.setIcon)(rebuild, "refresh-cw");
    this.summaryEl = this.contentEl.createDiv({ cls: "mms-global-search-summary" });
    this.resultsEl = this.contentEl.createDiv({ cls: "mms-global-search-results" });
    const render = () => this.renderResults(this.inputEl.value);
    this.inputEl.addEventListener("input", render);
    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.moveActive(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.moveActive(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const result = this.renderedResults[this.activeIndex >= 0 ? this.activeIndex : 0];
        if (result) void this.openResult(result);
      }
    });
    rebuild.addEventListener("click", async () => {
      rebuild.disabled = true;
      this.summaryEl.setText("\u6B63\u5728\u91CD\u5EFA\u7D22\u5F15\u2026");
      try {
        await this.onRebuild();
        new import_obsidian5.Notice("\u601D\u7EF4\u5BFC\u56FE\u641C\u7D22\u7D22\u5F15\u5DF2\u91CD\u5EFA");
        render();
      } finally {
        rebuild.disabled = false;
      }
    });
    this.renderResults("");
    window.setTimeout(() => this.inputEl.focus(), 20);
  }
  onClose() {
    this.contentEl.empty();
  }
  renderResults(query) {
    this.resultsEl.empty();
    this.activeIndex = -1;
    const status = this.index.getStatus();
    const trimmed = query.trim();
    if (!trimmed) {
      this.renderedResults = [];
      this.summaryEl.setText(status.building ? `\u6B63\u5728\u5EFA\u7ACB\u7D22\u5F15\uFF0C\u5DF2\u6536\u5F55 ${status.files} \u4E2A\u5BFC\u56FE\u3001${status.nodes} \u4E2A\u8282\u70B9\u2026` : `\u5DF2\u7D22\u5F15 ${status.files} \u4E2A\u5BFC\u56FE\u3001${status.nodes} \u4E2A\u8282\u70B9\u3002\u8F93\u5165\u5173\u952E\u8BCD\u5F00\u59CB\u641C\u7D22\u3002`);
      const hint = this.resultsEl.createDiv({ cls: "mms-global-search-empty" });
      hint.createDiv({ text: "\u641C\u7D22\u8303\u56F4" });
      hint.createEl("p", { text: "\u8282\u70B9\u6587\u5B57\u3001\u5BCC\u6587\u672C\u3001\u5907\u6CE8\u3001\u6807\u7B7E\u3001\u8868\u683C\u3001\u4EE3\u7801\u3001\u94FE\u63A5\u3001\u6298\u53E0\u5206\u652F\u548C\u6240\u6709\u5B50\u5BFC\u56FE\u3002" });
      return;
    }
    this.renderedResults = this.index.search(trimmed, this.maxResults);
    this.summaryEl.setText(`\u627E\u5230 ${this.renderedResults.length}${this.renderedResults.length >= this.maxResults ? "+" : ""} \u4E2A\u7ED3\u679C \xB7 \u7D22\u5F15 ${status.files} \u4E2A\u5BFC\u56FE / ${status.nodes} \u4E2A\u8282\u70B9`);
    if (!this.renderedResults.length) {
      this.resultsEl.createDiv({ cls: "mms-global-search-empty", text: status.building ? "\u7D22\u5F15\u4ECD\u5728\u5EFA\u7ACB\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : "\u6CA1\u6709\u5339\u914D\u7ED3\u679C\u3002" });
      return;
    }
    this.renderedResults.forEach((result, index) => {
      const button = this.resultsEl.createEl("button", { cls: "mms-global-search-result", attr: { type: "button" } });
      const header = button.createDiv({ cls: "mms-global-search-result-header" });
      const title = header.createDiv({ cls: "mms-global-search-result-title" });
      appendHighlightedText(title, result.nodeText, trimmed);
      const badges = header.createDiv({ cls: "mms-global-search-result-badges" });
      badges.createSpan({ cls: "mms-global-search-badge", text: result.matchedKind });
      if (result.isSubmapDocument) badges.createSpan({ cls: "mms-global-search-badge is-submap", text: "\u5B50\u5BFC\u56FE" });
      const file = button.createDiv({ cls: "mms-global-search-result-file" });
      file.createSpan({ text: result.fileTitle });
      file.createSpan({ cls: "mms-global-search-result-path", text: result.filePath });
      button.createDiv({ cls: "mms-global-search-result-breadcrumb", text: result.breadcrumb.join(" \u203A ") });
      if (result.snippet && result.snippet !== result.nodeText) {
        const snippet = button.createDiv({ cls: "mms-global-search-result-snippet" });
        appendHighlightedText(snippet, result.snippet, trimmed);
      }
      button.addEventListener("mouseenter", () => this.setActive(index));
      button.addEventListener("click", () => void this.openResult(result));
    });
    this.setActive(0);
  }
  moveActive(delta) {
    if (!this.renderedResults.length) return;
    const next = this.activeIndex < 0 ? 0 : (this.activeIndex + delta + this.renderedResults.length) % this.renderedResults.length;
    this.setActive(next);
  }
  setActive(index) {
    var _a;
    this.activeIndex = index;
    const buttons = Array.from(this.resultsEl.querySelectorAll(".mms-global-search-result"));
    buttons.forEach((button, buttonIndex) => button.toggleClass("is-active", buttonIndex === index));
    (_a = buttons[index]) == null ? void 0 : _a.scrollIntoView({ block: "nearest" });
  }
  async openResult(result) {
    this.close();
    await this.onOpenResult(result);
  }
};

// src/main.ts
var MINDMAP_EXTENSION = "mindmap";
var LEGACY_SUFFIX = ".smm.md";
var MindMapStudioPlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.legacyMigrationPath = null;
    this.autoUploadTimers = /* @__PURE__ */ new Map();
  }
  async onload() {
    var _a;
    await this.loadSettings();
    const pluginDir = (_a = this.manifest.dir) != null ? _a : (0, import_obsidian6.normalizePath)(`${this.app.vault.configDir}/plugins/${this.manifest.id}`);
    this.searchIndex = new MindMapSearchIndex(this.app, (0, import_obsidian6.normalizePath)(`${pluginDir}/mindmap-search-index.json`), MINDMAP_EXTENSION);
    void this.searchIndex.initialize();
    this.registerView(VIEW_TYPE_MINDMAP_STUDIO, (leaf) => new MindMapStudioView(leaf, this));
    this.registerExtensions([MINDMAP_EXTENSION], VIEW_TYPE_MINDMAP_STUDIO);
    this.addSettingTab(new MindMapStudioSettingTab(this.app, this));
    this.addRibbonIcon("brain-circuit", "\u65B0\u5EFA\u601D\u7EF4\u5BFC\u56FE", () => void this.createMindMap());
    this.addRibbonIcon("search", "\u5168\u5C40\u641C\u7D22\u601D\u7EF4\u5BFC\u56FE", () => this.openGlobalSearch());
    this.addCommand({
      id: "global-search-mind-maps",
      name: "\u5168\u5C40\u641C\u7D22\u6240\u6709\u601D\u7EF4\u5BFC\u56FE",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "F" }],
      callback: () => this.openGlobalSearch()
    });
    this.addCommand({
      id: "rebuild-mind-map-search-index",
      name: "\u91CD\u5EFA\u601D\u7EF4\u5BFC\u56FE\u641C\u7D22\u7D22\u5F15",
      callback: () => void this.rebuildGlobalSearchIndex()
    });
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
        var _a2;
        const file = this.app.workspace.getActiveFile();
        const available = Boolean(file && this.isMindMapFile(file));
        if (!checking && available && file) void this.openAsMindMap(file, (_a2 = this.app.workspace.activeLeaf) != null ? _a2 : void 0);
        return available;
      }
    });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (file instanceof import_obsidian6.TFolder) {
        menu.addItem((item) => item.setTitle("\u65B0\u5EFA\u601D\u7EF4\u5BFC\u56FE").setIcon("brain-circuit").onClick(() => void this.createMindMap({ folder: file.path })));
        return;
      }
      if (!(file instanceof import_obsidian6.TFile)) return;
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
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (file instanceof import_obsidian6.TFile && this.isMindMapFile(file)) this.searchIndex.queueFile(file, 80);
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file instanceof import_obsidian6.TFile && this.isMindMapFile(file)) this.searchIndex.queueFile(file);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (file instanceof import_obsidian6.TFile && file.extension.toLowerCase() === MINDMAP_EXTENSION) this.searchIndex.removeFile(file.path);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof import_obsidian6.TFile && this.isMindMapFile(file)) this.searchIndex.renameFile(file, oldPath);
      else if (oldPath.toLowerCase().endsWith(`.${MINDMAP_EXTENSION}`)) this.searchIndex.removeFile(oldPath);
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
    var _a;
    for (const timer of this.autoUploadTimers.values()) window.clearTimeout(timer);
    this.autoUploadTimers.clear();
    (_a = this.searchIndex) == null ? void 0 : _a.destroy();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MINDMAP_STUDIO);
  }
  openGlobalSearch() {
    new GlobalMindMapSearchModal(
      this.app,
      this.searchIndex,
      this.settings.globalSearchMaxResults,
      (result) => this.openGlobalSearchResult(result),
      () => this.searchIndex.rebuildAll()
    ).open();
  }
  async rebuildGlobalSearchIndex() {
    new import_obsidian6.Notice("\u6B63\u5728\u91CD\u5EFA\u601D\u7EF4\u5BFC\u56FE\u641C\u7D22\u7D22\u5F15\u2026");
    await this.searchIndex.rebuildAll();
    const status = this.searchIndex.getStatus();
    new import_obsidian6.Notice(`\u641C\u7D22\u7D22\u5F15\u5DF2\u91CD\u5EFA\uFF1A${status.files} \u4E2A\u5BFC\u56FE\uFF0C${status.nodes} \u4E2A\u8282\u70B9`);
  }
  getGlobalSearchIndexStatus() {
    return this.searchIndex.getStatus();
  }
  async openGlobalSearchResult(result) {
    const file = this.app.vault.getAbstractFileByPath(result.filePath);
    if (!(file instanceof import_obsidian6.TFile) || !this.isMindMapFile(file)) {
      this.searchIndex.removeFile(result.filePath);
      new import_obsidian6.Notice(`\u641C\u7D22\u7ED3\u679C\u5BF9\u5E94\u7684\u5BFC\u56FE\u5DF2\u4E0D\u5B58\u5728\uFF1A${result.filePath}`);
      return;
    }
    await this.openAsMindMap(file, void 0, result.nodeId);
  }
  async loadSettings() {
    let loaded = await this.loadData();
    if (!loaded) {
      const oldDataPath = (0, import_obsidian6.normalizePath)(`${this.app.vault.configDir}/plugins/mindmap-canvas/data.json`);
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
      globalSearchMaxResults: typeof raw.globalSearchMaxResults === "number" ? Math.max(20, Math.min(500, Math.round(raw.globalSearchMaxResults))) : DEFAULT_SETTINGS.globalSearchMaxResults,
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
    const normalized2 = (0, import_obsidian6.normalizePath)(preferredPath);
    if (!this.app.vault.getAbstractFileByPath(normalized2)) return normalized2;
    const dot = normalized2.lastIndexOf(".");
    const base = dot > normalized2.lastIndexOf("/") ? normalized2.slice(0, dot) : normalized2;
    const extension = dot > normalized2.lastIndexOf("/") ? normalized2.slice(dot) : "";
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
    const path = await this.getAvailablePath((0, import_obsidian6.normalizePath)(`${folder ? `${folder}/` : ""}${filename}.${MINDMAP_EXTENSION}`));
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
    const configuredFolder = (0, import_obsidian6.normalizePath)((this.settings.assetFolder || "MindMap Assets").replace(/^\/+|\/+$/g, ""));
    const folder = (0, import_obsidian6.normalizePath)([sourceFolder, configuredFolder].filter(Boolean).join("/"));
    await this.ensureFolderPath(folder);
    const now = /* @__PURE__ */ new Date();
    const two = (value) => String(value).padStart(2, "0");
    const stamp = `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
    const extension = ((_c = suggestedName.split(".").at(-1)) == null ? void 0 : _c.replace(/[^a-z0-9]/gi, "").toLowerCase()) || "png";
    const base = this.sanitizeFilename((_d = sourceFile == null ? void 0 : sourceFile.basename) != null ? _d : "mindmap");
    const preferred = (0, import_obsidian6.normalizePath)(`${folder}/${base}-${stamp}.${extension}`);
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
    const direct = this.app.vault.getAbstractFileByPath((0, import_obsidian6.normalizePath)(target));
    const file = direct instanceof import_obsidian6.TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(target, (_e = sourceFile == null ? void 0 : sourceFile.path) != null ? _e : "");
    if (!(file instanceof import_obsidian6.TFile)) return null;
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
      new import_obsidian6.Notice("\u627E\u4E0D\u5230\u8BE5\u56FE\u5E8A\u914D\u7F6E");
      return;
    }
    if (!host.endpoint.trim()) {
      new import_obsidian6.Notice(`\u8BF7\u5148\u586B\u5199 ${host.name} \u7684\u4E0A\u4F20 API`);
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
      new import_obsidian6.Notice(`${host.name} \u8FDE\u63A5\u6210\u529F\uFF08${elapsed} ms\uFF09
${url}`, 8e3);
    } catch (error) {
      console.error("MindMap Studio image host connectivity test failed", error);
      new import_obsidian6.Notice(`${host.name} \u8FDE\u63A5\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`, 8e3);
    }
  }
  scheduleAutoUpload(file, nodeId, blockId, localPath, suggestedName) {
    if (!file || !this.settings.autoUploadEnabled) return false;
    const hostIds = this.getDefaultUploadHostIds();
    if (!hostIds.length) {
      new import_obsidian6.Notice("\u56FE\u7247\u5DF2\u4FDD\u5B58\u5230\u672C\u5730\uFF1B\u81EA\u52A8\u4E0A\u4F20\u672A\u9009\u62E9\u53EF\u7528\u56FE\u5E8A", 5e3);
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
      const localFile = this.app.vault.getAbstractFileByPath((0, import_obsidian6.normalizePath)(localPath));
      if (!(mapFile instanceof import_obsidian6.TFile) || !(localFile instanceof import_obsidian6.TFile)) return;
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
        new import_obsidian6.Notice(`\u56FE\u7247\u5DF2\u4E0A\u4F20\u5230 ${targets}${suffix}`, 7e3);
      } else {
        const ok = batch.successes.map((item) => item.hostName).join("\u3001") || "\u65E0";
        const failed = batch.failures.map((item) => `${item.hostName}\uFF1A${item.error}`).join("\uFF1B");
        new import_obsidian6.Notice(`\u56FE\u7247\u4EC5\u90E8\u5206\u4E0A\u4F20\u6210\u529F\u3002\u6210\u529F\uFF1A${ok}\uFF1B\u5931\u8D25\uFF1A${failed}\u3002\u672C\u5730\u56FE\u7247\u5DF2\u4FDD\u7559\u3002`, 9e3);
      }
    } catch (error) {
      console.error("MindMap Studio automatic image upload failed", error);
      new import_obsidian6.Notice(`\u56FE\u7247\u81EA\u52A8\u4E0A\u4F20\u5931\u8D25\uFF0C\u672C\u5730\u56FE\u7247\u5DF2\u4FDD\u7559\uFF1A${error instanceof Error ? error.message : String(error)}`, 8e3);
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
    const response = await (0, import_obsidian6.requestUrl)({
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
    const normalized2 = (0, import_obsidian6.normalizePath)(localPath);
    const target = this.app.vault.getAbstractFileByPath(normalized2);
    if (!(target instanceof import_obsidian6.TFile)) return false;
    const current = this.app.vault.getAbstractFileByPath(currentMindMapPath);
    if (current instanceof import_obsidian6.TFile) {
      const doc = parseDocument(await this.app.vault.read(current), current.basename);
      const stillUsed = flattenNodes(doc.root).some((node) => nodeContentBlocks(node).some((block) => block.type === "image" && block.id !== blockId && (block.source === normalized2 || block.localSource === normalized2)));
      if (stillUsed) return false;
    }
    for (const file of this.app.vault.getFiles()) {
      if (file.path === currentMindMapPath || file.extension.toLowerCase() !== MINDMAP_EXTENSION) continue;
      try {
        const text = await this.app.vault.cachedRead(file);
        if (text.includes(normalized2)) return false;
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
    const configuredAssets = (0, import_obsidian6.normalizePath)(this.settings.assetFolder || "MindMap Assets");
    const parentMapFolder = this.sanitizeFilename(parentFile.basename);
    const submapFolder = (0, import_obsidian6.normalizePath)([parentFolder, configuredAssets, parentMapFolder].filter(Boolean).join("/"));
    await this.ensureFolderPath(submapFolder);
    const path = await this.getAvailablePath((0, import_obsidian6.normalizePath)(`${submapFolder}/${this.sanitizeFilename(title)}.${MINDMAP_EXTENSION}`));
    const file = await this.app.vault.create(path, serializeDocument(document2));
    return { path: file.path, title: file.basename };
  }
  async openMindMapPath(path, sourcePath = "", preferredLeaf, focusNodeId) {
    const normalized2 = (0, import_obsidian6.normalizePath)(path.replace(/^\[\[|\]\]$/g, ""));
    const direct = this.app.vault.getAbstractFileByPath(normalized2);
    const resolved = direct instanceof import_obsidian6.TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (!(resolved instanceof import_obsidian6.TFile) || !this.isMindMapFile(resolved)) {
      new import_obsidian6.Notice(`\u627E\u4E0D\u5230\u5B50\u5BFC\u56FE\uFF1A${path}`);
      return;
    }
    await this.openAsMindMap(resolved, preferredLeaf, focusNodeId);
  }
  async ensureFolderPath(folder) {
    const normalized2 = (0, import_obsidian6.normalizePath)(folder);
    if (!normalized2 || this.app.vault.getAbstractFileByPath(normalized2) instanceof import_obsidian6.TFolder) return;
    const parts = normalized2.split("/").filter(Boolean);
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
      const preferredPath = (0, import_obsidian6.normalizePath)(`${parentPath ? `${parentPath}/` : ""}${this.sanitizeFilename(title)}.${MINDMAP_EXTENSION}`);
      const existing = this.app.vault.getAbstractFileByPath(preferredPath);
      let target;
      if (existing instanceof import_obsidian6.TFile && this.isMindMapFile(existing)) {
        target = existing;
      } else {
        const path = existing ? await this.getAvailablePath(preferredPath) : preferredPath;
        target = await this.app.vault.create(path, serializeDocument(document2));
        new import_obsidian6.Notice(`\u5DF2\u8F6C\u6362\u4E3A\u53EF\u7F16\u8F91\u8111\u56FE\uFF1A${target.path}
\u539F\u6587\u4EF6\u5DF2\u4FDD\u7559\u4F5C\u4E3A\u5907\u4EFD\u3002`, 7e3);
      }
      if (openAfter) await this.openAsMindMap(target, (_c = this.app.workspace.activeLeaf) != null ? _c : void 0);
      return target;
    } catch (error) {
      console.error("MindMap Studio legacy migration failed", error);
      new import_obsidian6.Notice("\u65E7\u7248\u8111\u56FE\u8F6C\u6362\u5931\u8D25\uFF0C\u539F\u6587\u4EF6\u672A\u88AB\u4FEE\u6539\u3002", 6e3);
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
    const normalized2 = (0, import_obsidian6.normalizePath)(candidate);
    const existing = this.app.vault.getAbstractFileByPath(normalized2);
    if (existing instanceof import_obsidian6.TFolder) return normalized2;
    await this.ensureFolderPath(normalized2);
    return normalized2;
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
    return sourceFile instanceof import_obsidian6.TFile ? sourceFile.basename : "\u601D\u7EF4\u5BFC\u56FE";
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
      if (!(file instanceof import_obsidian6.TFile) || !this.isMindMapFile(file)) continue;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL21vZGVsLnRzIiwgInNyYy9zZXR0aW5ncy50cyIsICJzcmMvdGhlbWVzLnRzIiwgInNyYy9sYXlvdXQudHMiLCAic3JjL3N0YXRpYy1yZW5kZXIudHMiLCAic3JjL3ZpZXcudHMiLCAic3JjL2VkaXRvci50cyIsICJzcmMvY29udGVudC1tb2RhbHMudHMiLCAic3JjL2dsb2JhbC1zZWFyY2gudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7XG4gIE1lbnUsXG4gIE5vdGljZSxcbiAgUGx1Z2luLFxuICBURmlsZSxcbiAgVEZvbGRlcixcbiAgbm9ybWFsaXplUGF0aCxcbiAgcmVxdWVzdFVybCxcbiAgdHlwZSBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0LFxuICB0eXBlIFdvcmtzcGFjZUxlYWZcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBjcmVhdGVEZWZhdWx0RG9jdW1lbnQsXG4gIGZpbmROb2RlLFxuICBmbGF0dGVuTm9kZXMsXG4gIG1hcmtkb3duVG9Eb2N1bWVudCxcbiAgbm9kZUNvbnRlbnRCbG9ja3MsXG4gIG5vZGVQbGFpblRleHQsXG4gIHN5bmNOb2RlTGVnYWN5RmllbGRzLFxuICBwYXJzZURvY3VtZW50LFxuICBzZXJpYWxpemVEb2N1bWVudCxcbiAgdHlwZSBNaW5kTWFwRG9jdW1lbnQsXG4gIHR5cGUgTWluZE1hcEltYWdlQ29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBOb2RlLFxuICB0eXBlIE1pbmRNYXBTdWJtYXBcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7XG4gIERFRkFVTFRfU0VUVElOR1MsXG4gIE1pbmRNYXBTdHVkaW9TZXR0aW5nVGFiLFxuICBjcmVhdGVJbWFnZUhvc3RDb25maWcsXG4gIHNldHRpbmdzVG9BcHBlYXJhbmNlLFxuICB0eXBlIEltYWdlSG9zdENob2ljZSxcbiAgdHlwZSBJbWFnZUhvc3RDb25maWcsXG4gIHR5cGUgSW1hZ2VIb3N0VXBsb2FkQmF0Y2gsXG4gIHR5cGUgSW1hZ2VIb3N0VXBsb2FkU3VjY2VzcyxcbiAgdHlwZSBNaW5kTWFwU3R1ZGlvU2V0dGluZ3Ncbn0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IHJlbmRlclN0YXRpY01pbmRNYXAsIHJlbmRlclN0YXRpY1NvdXJjZSB9IGZyb20gXCIuL3N0YXRpYy1yZW5kZXJcIjtcbmltcG9ydCB7IE1pbmRNYXBTdHVkaW9WaWV3LCBWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8gfSBmcm9tIFwiLi92aWV3XCI7XG5pbXBvcnQgeyBHbG9iYWxNaW5kTWFwU2VhcmNoTW9kYWwsIE1pbmRNYXBTZWFyY2hJbmRleCwgdHlwZSBNaW5kTWFwU2VhcmNoUmVzdWx0IH0gZnJvbSBcIi4vZ2xvYmFsLXNlYXJjaFwiO1xuXG5leHBvcnQgY29uc3QgTUlORE1BUF9FWFRFTlNJT04gPSBcIm1pbmRtYXBcIjtcbmNvbnN0IExFR0FDWV9TVUZGSVggPSBcIi5zbW0ubWRcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWluZE1hcFN0dWRpb1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBNaW5kTWFwU3R1ZGlvU2V0dGluZ3MgPSBERUZBVUxUX1NFVFRJTkdTO1xuICBwcml2YXRlIGxlZ2FjeU1pZ3JhdGlvblBhdGg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IGF1dG9VcGxvYWRUaW1lcnMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBwcml2YXRlIHNlYXJjaEluZGV4ITogTWluZE1hcFNlYXJjaEluZGV4O1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIGNvbnN0IHBsdWdpbkRpciA9IHRoaXMubWFuaWZlc3QuZGlyID8/IG5vcm1hbGl6ZVBhdGgoYCR7dGhpcy5hcHAudmF1bHQuY29uZmlnRGlyfS9wbHVnaW5zLyR7dGhpcy5tYW5pZmVzdC5pZH1gKTtcbiAgICB0aGlzLnNlYXJjaEluZGV4ID0gbmV3IE1pbmRNYXBTZWFyY2hJbmRleCh0aGlzLmFwcCwgbm9ybWFsaXplUGF0aChgJHtwbHVnaW5EaXJ9L21pbmRtYXAtc2VhcmNoLWluZGV4Lmpzb25gKSwgTUlORE1BUF9FWFRFTlNJT04pO1xuICAgIHZvaWQgdGhpcy5zZWFyY2hJbmRleC5pbml0aWFsaXplKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8sIChsZWFmKSA9PiBuZXcgTWluZE1hcFN0dWRpb1ZpZXcobGVhZiwgdGhpcykpO1xuICAgIC8vIEEgZGVkaWNhdGVkIGV4dGVuc2lvbiBpcyB0aGUga2V5IHRvIHJlbGlhYmxlIHJlb3BlbmluZzogT2JzaWRpYW4gcm91dGVzIGV2ZXJ5XG4gICAgLy8gLm1pbmRtYXAgZmlsZSBkaXJlY3RseSB0byB0aGUgZWRpdGFibGUgVGV4dEZpbGVWaWV3IGluc3RlYWQgb2YgTWFya2Rvd24gdmlldy5cbiAgICB0aGlzLnJlZ2lzdGVyRXh0ZW5zaW9ucyhbTUlORE1BUF9FWFRFTlNJT05dLCBWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8pO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgTWluZE1hcFN0dWRpb1NldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImJyYWluLWNpcmN1aXRcIiwgXCJcdTY1QjBcdTVFRkFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIiwgKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU1pbmRNYXAoKSk7XG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwic2VhcmNoXCIsIFwiXHU1MTY4XHU1QzQwXHU2NDFDXHU3RDIyXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIsICgpID0+IHRoaXMub3Blbkdsb2JhbFNlYXJjaCgpKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJnbG9iYWwtc2VhcmNoLW1pbmQtbWFwc1wiLFxuICAgICAgbmFtZTogXCJcdTUxNjhcdTVDNDBcdTY0MUNcdTdEMjJcdTYyNDBcdTY3MDlcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIixcbiAgICAgIGhvdGtleXM6IFt7IG1vZGlmaWVyczogW1wiTW9kXCIsIFwiU2hpZnRcIl0sIGtleTogXCJGXCIgfV0sXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuR2xvYmFsU2VhcmNoKClcbiAgICB9KTtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwicmVidWlsZC1taW5kLW1hcC1zZWFyY2gtaW5kZXhcIixcbiAgICAgIG5hbWU6IFwiXHU5MUNEXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU2NDFDXHU3RDIyXHU3RDIyXHU1RjE1XCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdm9pZCB0aGlzLnJlYnVpbGRHbG9iYWxTZWFyY2hJbmRleCgpXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5ldy1taW5kLW1hcFwiLFxuICAgICAgbmFtZTogXCJcdTY1QjBcdTVFRkFcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMuY3JlYXRlTWluZE1hcCgpXG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm5ldy1taW5kLW1hcC1hbmQtZW1iZWRcIixcbiAgICAgIG5hbWU6IFwiXHU2NUIwXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU1RTc2XHU2M0QyXHU1MTY1XHU1RjUzXHU1MjREXHU3QjE0XHU4QkIwXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU1pbmRNYXAoeyBpbnNlcnRJbnRvQ3VycmVudDogdHJ1ZSB9KVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjb252ZXJ0LWN1cnJlbnQtbWFya2Rvd25cIixcbiAgICAgIG5hbWU6IFwiXHU1QzA2XHU1RjUzXHU1MjREIE1hcmtkb3duIFx1OEY2Q1x1NjM2Mlx1NEUzQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBCb29sZWFuKGZpbGUgJiYgZmlsZS5leHRlbnNpb24gPT09IFwibWRcIiAmJiAhdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKTtcbiAgICAgICAgaWYgKCFjaGVja2luZyAmJiBhdmFpbGFibGUgJiYgZmlsZSkgdm9pZCB0aGlzLmNvbnZlcnRNYXJrZG93bkZpbGUoZmlsZSk7XG4gICAgICAgIHJldHVybiBhdmFpbGFibGU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm1pZ3JhdGUtbGVnYWN5LW1pbmQtbWFwXCIsXG4gICAgICBuYW1lOiBcIlx1NUMwNlx1NUY1M1x1NTI0RFx1NjVFN1x1NzI0OFx1ODExMVx1NTZGRVx1OEY2Q1x1NjM2Mlx1NEUzQSAubWluZG1hcFwiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBjb25zdCBhdmFpbGFibGUgPSBCb29sZWFuKGZpbGUgJiYgdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKTtcbiAgICAgICAgaWYgKCFjaGVja2luZyAmJiBhdmFpbGFibGUgJiYgZmlsZSkgdm9pZCB0aGlzLm1pZ3JhdGVMZWdhY3lGaWxlKGZpbGUsIHRydWUpO1xuICAgICAgICByZXR1cm4gYXZhaWxhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLWN1cnJlbnQtYXMtbWluZC1tYXBcIixcbiAgICAgIG5hbWU6IFwiXHU0RUU1XHU1M0VGXHU3RjE2XHU4RjkxXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU4OUM2XHU1NkZFXHU5MUNEXHU2NUIwXHU2MjUzXHU1RjAwXCIsXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmcpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IEJvb2xlYW4oZmlsZSAmJiB0aGlzLmlzTWluZE1hcEZpbGUoZmlsZSkpO1xuICAgICAgICBpZiAoIWNoZWNraW5nICYmIGF2YWlsYWJsZSAmJiBmaWxlKSB2b2lkIHRoaXMub3BlbkFzTWluZE1hcChmaWxlLCB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZiA/PyB1bmRlZmluZWQpO1xuICAgICAgICByZXR1cm4gYXZhaWxhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtbWVudVwiLCAobWVudTogTWVudSwgZmlsZSkgPT4ge1xuICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbVxuICAgICAgICAgIC5zZXRUaXRsZShcIlx1NjVCMFx1NUVGQVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKVxuICAgICAgICAgIC5zZXRJY29uKFwiYnJhaW4tY2lyY3VpdFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5jcmVhdGVNaW5kTWFwKHsgZm9sZGVyOiBmaWxlLnBhdGggfSkpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuO1xuXG4gICAgICBpZiAodGhpcy5pc01pbmRNYXBGaWxlKGZpbGUpKSB7XG4gICAgICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbVxuICAgICAgICAgIC5zZXRUaXRsZShcIlx1NEVFNVx1NTNFRlx1N0YxNlx1OEY5MVx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVx1NjI1M1x1NUYwMFwiKVxuICAgICAgICAgIC5zZXRJY29uKFwiYnJhaW4tY2lyY3VpdFwiKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5vcGVuQXNNaW5kTWFwKGZpbGUpKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaXNMZWdhY3lNaW5kTWFwRmlsZShmaWxlKSkge1xuICAgICAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW1cbiAgICAgICAgICAuc2V0VGl0bGUoXCJcdThGNkNcdTYzNjJcdTRFM0FcdTY1QjBcdTc2ODQgLm1pbmRtYXAgXHU2NTg3XHU0RUY2XCIpXG4gICAgICAgICAgLnNldEljb24oXCJyZXBsYWNlXCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLm1pZ3JhdGVMZWdhY3lGaWxlKGZpbGUsIHRydWUpKSk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgLy8gRXhpc3RpbmcgdXNlcnMgbWF5IHN0aWxsIGhhdmUgdGhlIG9sZCBNYXJrZG93bi1iYWNrZWQgZmlsZXMuIFdoZW4gZW5hYmxlZCxcbiAgICAvLyBvcGVuaW5nIG9uZSBjcmVhdGVzL29wZW5zIGEgc2FmZSAubWluZG1hcCBjb3B5IGFuZCBsZWF2ZXMgdGhlIG9yaWdpbmFsIGludGFjdC5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsIChmaWxlKSA9PiB7XG4gICAgICBpZiAoIWZpbGUgfHwgIXRoaXMuc2V0dGluZ3MucmVkaXJlY3RMZWdhY3lGaWxlcyB8fCAhdGhpcy5pc0xlZ2FjeU1pbmRNYXBGaWxlKGZpbGUpKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5sZWdhY3lNaWdyYXRpb25QYXRoID09PSBmaWxlLnBhdGgpIHJldHVybjtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHZvaWQgdGhpcy5taWdyYXRlTGVnYWN5RmlsZShmaWxlLCB0cnVlKSwgMCk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKFwiY3JlYXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlICYmIHRoaXMuaXNNaW5kTWFwRmlsZShmaWxlKSkgdGhpcy5zZWFyY2hJbmRleC5xdWV1ZUZpbGUoZmlsZSwgODApO1xuICAgIH0pKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oXCJtb2RpZnlcIiwgKGZpbGUpID0+IHtcbiAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUgJiYgdGhpcy5pc01pbmRNYXBGaWxlKGZpbGUpKSB0aGlzLnNlYXJjaEluZGV4LnF1ZXVlRmlsZShmaWxlKTtcbiAgICB9KSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKFwiZGVsZXRlXCIsIChmaWxlKSA9PiB7XG4gICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlICYmIGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09IE1JTkRNQVBfRVhURU5TSU9OKSB0aGlzLnNlYXJjaEluZGV4LnJlbW92ZUZpbGUoZmlsZS5wYXRoKTtcbiAgICB9KSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKFwicmVuYW1lXCIsIChmaWxlLCBvbGRQYXRoKSA9PiB7XG4gICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlICYmIHRoaXMuaXNNaW5kTWFwRmlsZShmaWxlKSkgdGhpcy5zZWFyY2hJbmRleC5yZW5hbWVGaWxlKGZpbGUsIG9sZFBhdGgpO1xuICAgICAgZWxzZSBpZiAob2xkUGF0aC50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKGAuJHtNSU5ETUFQX0VYVEVOU0lPTn1gKSkgdGhpcy5zZWFyY2hJbmRleC5yZW1vdmVGaWxlKG9sZFBhdGgpO1xuICAgIH0pKTtcblxuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93bkNvZGVCbG9ja1Byb2Nlc3NvcihcIm1pbmRtYXBcIiwgKHNvdXJjZSwgZWwsIGN0eCkgPT4ge1xuICAgICAgcmVuZGVyU3RhdGljU291cmNlKGVsLCBzb3VyY2UsIHRoaXMuZ2V0U291cmNlVGl0bGUoY3R4KSwgc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykpO1xuICAgIH0pO1xuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93bkNvZGVCbG9ja1Byb2Nlc3NvcihcIm1pbmRtYXAtanNvblwiLCAoc291cmNlLCBlbCwgY3R4KSA9PiB7XG4gICAgICByZW5kZXJTdGF0aWNTb3VyY2UoZWwsIHNvdXJjZSwgdGhpcy5nZXRTb3VyY2VUaXRsZShjdHgpLCBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSk7XG4gICAgfSk7XG4gICAgLy8gUmVhZC1vbmx5IGNvbXBhdGliaWxpdHkgZm9yIG5vdGVzIHRoYXQgYWxyZWFkeSBjb250YWluIG9sZCBmZW5jZWQgYmxvY2tzLlxuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93bkNvZGVCbG9ja1Byb2Nlc3NvcihcInNtbVwiLCAoc291cmNlLCBlbCwgY3R4KSA9PiB7XG4gICAgICByZW5kZXJTdGF0aWNTb3VyY2UoZWwsIHNvdXJjZSwgdGhpcy5nZXRTb3VyY2VUaXRsZShjdHgpLCBzZXR0aW5nc1RvQXBwZWFyYW5jZSh0aGlzLnNldHRpbmdzKSk7XG4gICAgfSk7XG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFwic21tLWpzb25cIiwgKHNvdXJjZSwgZWwsIGN0eCkgPT4ge1xuICAgICAgcmVuZGVyU3RhdGljU291cmNlKGVsLCBzb3VyY2UsIHRoaXMuZ2V0U291cmNlVGl0bGUoY3R4KSwgc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykpO1xuICAgIH0pO1xuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93blBvc3RQcm9jZXNzb3IoKGVsZW1lbnQsIGNvbnRleHQpID0+IHZvaWQgdGhpcy5wcm9jZXNzTWluZE1hcEVtYmVkcyhlbGVtZW50LCBjb250ZXh0KSk7XG4gIH1cblxuICBvbnVubG9hZCgpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHRpbWVyIG9mIHRoaXMuYXV0b1VwbG9hZFRpbWVycy52YWx1ZXMoKSkgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgdGhpcy5hdXRvVXBsb2FkVGltZXJzLmNsZWFyKCk7XG4gICAgdGhpcy5zZWFyY2hJbmRleD8uZGVzdHJveSgpO1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX01JTkRNQVBfU1RVRElPKTtcbiAgfVxuXG4gIG9wZW5HbG9iYWxTZWFyY2goKTogdm9pZCB7XG4gICAgbmV3IEdsb2JhbE1pbmRNYXBTZWFyY2hNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5zZWFyY2hJbmRleCxcbiAgICAgIHRoaXMuc2V0dGluZ3MuZ2xvYmFsU2VhcmNoTWF4UmVzdWx0cyxcbiAgICAgIChyZXN1bHQpID0+IHRoaXMub3Blbkdsb2JhbFNlYXJjaFJlc3VsdChyZXN1bHQpLFxuICAgICAgKCkgPT4gdGhpcy5zZWFyY2hJbmRleC5yZWJ1aWxkQWxsKClcbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIGFzeW5jIHJlYnVpbGRHbG9iYWxTZWFyY2hJbmRleCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBuZXcgTm90aWNlKFwiXHU2QjYzXHU1NzI4XHU5MUNEXHU1RUZBXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU2NDFDXHU3RDIyXHU3RDIyXHU1RjE1XHUyMDI2XCIpO1xuICAgIGF3YWl0IHRoaXMuc2VhcmNoSW5kZXgucmVidWlsZEFsbCgpO1xuICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuc2VhcmNoSW5kZXguZ2V0U3RhdHVzKCk7XG4gICAgbmV3IE5vdGljZShgXHU2NDFDXHU3RDIyXHU3RDIyXHU1RjE1XHU1REYyXHU5MUNEXHU1RUZBXHVGRjFBJHtzdGF0dXMuZmlsZXN9IFx1NEUyQVx1NUJGQ1x1NTZGRVx1RkYwQyR7c3RhdHVzLm5vZGVzfSBcdTRFMkFcdTgyODJcdTcwQjlgKTtcbiAgfVxuXG4gIGdldEdsb2JhbFNlYXJjaEluZGV4U3RhdHVzKCkge1xuICAgIHJldHVybiB0aGlzLnNlYXJjaEluZGV4LmdldFN0YXR1cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuR2xvYmFsU2VhcmNoUmVzdWx0KHJlc3VsdDogTWluZE1hcFNlYXJjaFJlc3VsdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocmVzdWx0LmZpbGVQYXRoKTtcbiAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHx8ICF0aGlzLmlzTWluZE1hcEZpbGUoZmlsZSkpIHtcbiAgICAgIHRoaXMuc2VhcmNoSW5kZXgucmVtb3ZlRmlsZShyZXN1bHQuZmlsZVBhdGgpO1xuICAgICAgbmV3IE5vdGljZShgXHU2NDFDXHU3RDIyXHU3RUQzXHU2NzlDXHU1QkY5XHU1RTk0XHU3Njg0XHU1QkZDXHU1NkZFXHU1REYyXHU0RTBEXHU1QjU4XHU1NzI4XHVGRjFBJHtyZXN1bHQuZmlsZVBhdGh9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMub3BlbkFzTWluZE1hcChmaWxlLCB1bmRlZmluZWQsIHJlc3VsdC5ub2RlSWQpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBsb2FkZWQgPSBhd2FpdCB0aGlzLmxvYWREYXRhKCkgYXMgUGFydGlhbDxNaW5kTWFwU3R1ZGlvU2V0dGluZ3M+IHwgbnVsbDtcbiAgICAvLyBPbmUtdGltZSBtaWdyYXRpb24gYWZ0ZXIgdGhlIHB1YmxpYyByZW5hbWUgZnJvbSBtaW5kbWFwLWNhbnZhcyB0byBtaW5kbWFwLXN0dWRpby5cbiAgICBpZiAoIWxvYWRlZCkge1xuICAgICAgY29uc3Qgb2xkRGF0YVBhdGggPSBub3JtYWxpemVQYXRoKGAke3RoaXMuYXBwLnZhdWx0LmNvbmZpZ0Rpcn0vcGx1Z2lucy9taW5kbWFwLWNhbnZhcy9kYXRhLmpzb25gKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmV4aXN0cyhvbGREYXRhUGF0aCkpIHtcbiAgICAgICAgICBsb2FkZWQgPSBKU09OLnBhcnNlKGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIucmVhZChvbGREYXRhUGF0aCkpIGFzIFBhcnRpYWw8TWluZE1hcFN0dWRpb1NldHRpbmdzPjtcbiAgICAgICAgICBpZiAobG9hZGVkKSBhd2FpdCB0aGlzLnNhdmVEYXRhKGxvYWRlZCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIk1pbmRNYXAgU3R1ZGlvIGNvdWxkIG5vdCBtaWdyYXRlIHRoZSBvbGQgc2V0dGluZ3MgZmlsZVwiLCBlcnJvcik7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGhhZFN0b3JlZFNldHRpbmdzID0gbG9hZGVkICE9PSBudWxsICYmIGxvYWRlZCAhPT0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IHJhdyA9IChsb2FkZWQgPz8ge30pIGFzIFBhcnRpYWw8TWluZE1hcFN0dWRpb1NldHRpbmdzPiAmIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIGxldCBpbWFnZUhvc3RzOiBJbWFnZUhvc3RDb25maWdbXSA9IEFycmF5LmlzQXJyYXkocmF3LmltYWdlSG9zdHMpXG4gICAgICA/IHJhdy5pbWFnZUhvc3RzLnNsaWNlKDAsIDIwKS5mbGF0TWFwKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICBpZiAoIWl0ZW0gfHwgdHlwZW9mIGl0ZW0gIT09IFwib2JqZWN0XCIpIHJldHVybiBbXTtcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlID0gaXRlbSBhcyBQYXJ0aWFsPEltYWdlSG9zdENvbmZpZz47XG4gICAgICAgIGNvbnN0IGhvc3QgPSBjcmVhdGVJbWFnZUhvc3RDb25maWcoaW5kZXggKyAxKTtcbiAgICAgICAgaG9zdC5pZCA9IHR5cGVvZiBjYW5kaWRhdGUuaWQgPT09IFwic3RyaW5nXCIgJiYgY2FuZGlkYXRlLmlkLnRyaW0oKSA/IGNhbmRpZGF0ZS5pZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IGhvc3QuaWQ7XG4gICAgICAgIGhvc3QubmFtZSA9IHR5cGVvZiBjYW5kaWRhdGUubmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBjYW5kaWRhdGUubmFtZS50cmltKCkgPyBjYW5kaWRhdGUubmFtZS50cmltKCkuc2xpY2UoMCwgMTIwKSA6IGhvc3QubmFtZTtcbiAgICAgICAgaG9zdC5lbmFibGVkID0gY2FuZGlkYXRlLmVuYWJsZWQgIT09IGZhbHNlO1xuICAgICAgICBob3N0LmVuZHBvaW50ID0gdHlwZW9mIGNhbmRpZGF0ZS5lbmRwb2ludCA9PT0gXCJzdHJpbmdcIiA/IGNhbmRpZGF0ZS5lbmRwb2ludC50cmltKCkuc2xpY2UoMCwgNDAwMCkgOiBcIlwiO1xuICAgICAgICBob3N0Lm1ldGhvZCA9IGNhbmRpZGF0ZS5tZXRob2QgPT09IFwiUFVUXCIgPyBcIlBVVFwiIDogXCJQT1NUXCI7XG4gICAgICAgIGhvc3QuYm9keU1vZGUgPSBjYW5kaWRhdGUuYm9keU1vZGUgPT09IFwicmF3XCIgPyBcInJhd1wiIDogXCJtdWx0aXBhcnRcIjtcbiAgICAgICAgaG9zdC5maWVsZE5hbWUgPSB0eXBlb2YgY2FuZGlkYXRlLmZpZWxkTmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBjYW5kaWRhdGUuZmllbGROYW1lLnRyaW0oKSA/IGNhbmRpZGF0ZS5maWVsZE5hbWUudHJpbSgpLnNsaWNlKDAsIDEyMCkgOiBcImZpbGVcIjtcbiAgICAgICAgaG9zdC5oZWFkZXJzID0gdHlwZW9mIGNhbmRpZGF0ZS5oZWFkZXJzID09PSBcInN0cmluZ1wiID8gY2FuZGlkYXRlLmhlYWRlcnMudHJpbSgpLnNsaWNlKDAsIDIwMDAwKSA6IFwiXCI7XG4gICAgICAgIGhvc3QucmVzcG9uc2VQYXRoID0gdHlwZW9mIGNhbmRpZGF0ZS5yZXNwb25zZVBhdGggPT09IFwic3RyaW5nXCIgPyBjYW5kaWRhdGUucmVzcG9uc2VQYXRoLnRyaW0oKS5zbGljZSgwLCA1MDApIDogXCJkYXRhLnVybFwiO1xuICAgICAgICByZXR1cm4gW2hvc3RdO1xuICAgICAgfSlcbiAgICAgIDogW107XG5cbiAgICAvLyBNaWdyYXRlIHRoZSBzaW5nbGUtaG9zdCBzZXR0aW5ncyB1c2VkIGJ5IE1pbmRNYXAgU3R1ZGlvIDAuOS54LlxuICAgIGNvbnN0IGxlZ2FjeUVuZHBvaW50ID0gdHlwZW9mIHJhdy5pbWFnZUhvc3RFbmRwb2ludCA9PT0gXCJzdHJpbmdcIiA/IHJhdy5pbWFnZUhvc3RFbmRwb2ludC50cmltKCkgOiBcIlwiO1xuICAgIGlmICghaW1hZ2VIb3N0cy5sZW5ndGggJiYgbGVnYWN5RW5kcG9pbnQpIHtcbiAgICAgIGNvbnN0IGhvc3QgPSBjcmVhdGVJbWFnZUhvc3RDb25maWcoMSk7XG4gICAgICBob3N0Lm5hbWUgPSBcIlx1NTM5Rlx1NTZGRVx1NUU4QVwiO1xuICAgICAgaG9zdC5lbmRwb2ludCA9IGxlZ2FjeUVuZHBvaW50O1xuICAgICAgaG9zdC5tZXRob2QgPSByYXcuaW1hZ2VIb3N0TWV0aG9kID09PSBcIlBVVFwiID8gXCJQVVRcIiA6IFwiUE9TVFwiO1xuICAgICAgaG9zdC5ib2R5TW9kZSA9IHJhdy5pbWFnZUhvc3RCb2R5TW9kZSA9PT0gXCJyYXdcIiA/IFwicmF3XCIgOiBcIm11bHRpcGFydFwiO1xuICAgICAgaG9zdC5maWVsZE5hbWUgPSB0eXBlb2YgcmF3LmltYWdlSG9zdEZpZWxkTmFtZSA9PT0gXCJzdHJpbmdcIiAmJiByYXcuaW1hZ2VIb3N0RmllbGROYW1lLnRyaW0oKSA/IHJhdy5pbWFnZUhvc3RGaWVsZE5hbWUudHJpbSgpIDogXCJmaWxlXCI7XG4gICAgICBob3N0LmhlYWRlcnMgPSB0eXBlb2YgcmF3LmltYWdlSG9zdEhlYWRlcnMgPT09IFwic3RyaW5nXCIgPyByYXcuaW1hZ2VIb3N0SGVhZGVycy50cmltKCkgOiBcIlwiO1xuICAgICAgaG9zdC5yZXNwb25zZVBhdGggPSB0eXBlb2YgcmF3LmltYWdlSG9zdFJlc3BvbnNlUGF0aCA9PT0gXCJzdHJpbmdcIiA/IHJhdy5pbWFnZUhvc3RSZXNwb25zZVBhdGgudHJpbSgpIDogXCJkYXRhLnVybFwiO1xuICAgICAgaW1hZ2VIb3N0cyA9IFtob3N0XTtcbiAgICB9XG5cbiAgICBjb25zdCBlbmFibGVkSWRzID0gbmV3IFNldChpbWFnZUhvc3RzLmZpbHRlcigoaG9zdCkgPT4gaG9zdC5lbmFibGVkKS5tYXAoKGhvc3QpID0+IGhvc3QuaWQpKTtcbiAgICBjb25zdCBzZWxlY3RlZElkcyA9IEFycmF5LmlzQXJyYXkocmF3LmF1dG9VcGxvYWRIb3N0SWRzKVxuICAgICAgPyByYXcuYXV0b1VwbG9hZEhvc3RJZHMuZmlsdGVyKChpZCk6IGlkIGlzIHN0cmluZyA9PiB0eXBlb2YgaWQgPT09IFwic3RyaW5nXCIgJiYgZW5hYmxlZElkcy5oYXMoaWQpKVxuICAgICAgOiBbXTtcbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUyxcbiAgICAgIC4uLnJhdyxcbiAgICAgIGltYWdlSG9zdHMsXG4gICAgICBhdXRvVXBsb2FkRW5hYmxlZDogcmF3LmF1dG9VcGxvYWRFbmFibGVkID09PSB0cnVlLFxuICAgICAgYXV0b1VwbG9hZERlbGF5U2Vjb25kczogdHlwZW9mIHJhdy5hdXRvVXBsb2FkRGVsYXlTZWNvbmRzID09PSBcIm51bWJlclwiXG4gICAgICAgID8gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzAwLCBNYXRoLnJvdW5kKHJhdy5hdXRvVXBsb2FkRGVsYXlTZWNvbmRzKSkpXG4gICAgICAgIDogREVGQVVMVF9TRVRUSU5HUy5hdXRvVXBsb2FkRGVsYXlTZWNvbmRzLFxuICAgICAgYXV0b1VwbG9hZEhvc3RJZHM6IHNlbGVjdGVkSWRzLFxuICAgICAgZGVsZXRlTG9jYWxBZnRlclVwbG9hZDogcmF3LmRlbGV0ZUxvY2FsQWZ0ZXJVcGxvYWQgIT09IGZhbHNlLFxuICAgICAgaW1hZ2VGYWlsb3ZlckVuYWJsZWQ6IHJhdy5pbWFnZUZhaWxvdmVyRW5hYmxlZCAhPT0gZmFsc2UsXG4gICAgICBpbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHM6IHR5cGVvZiByYXcuaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzID09PSBcIm51bWJlclwiXG4gICAgICAgID8gTWF0aC5tYXgoMiwgTWF0aC5taW4oMzAsIE1hdGgucm91bmQocmF3LmltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kcykpKVxuICAgICAgICA6IERFRkFVTFRfU0VUVElOR1MuaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzLFxuICAgICAgaW1hZ2VGYWlsb3ZlclVzZUxvY2FsRmFsbGJhY2s6IHJhdy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjayAhPT0gZmFsc2UsXG4gICAgICBnbG9iYWxTZWFyY2hNYXhSZXN1bHRzOiB0eXBlb2YgcmF3Lmdsb2JhbFNlYXJjaE1heFJlc3VsdHMgPT09IFwibnVtYmVyXCJcbiAgICAgICAgPyBNYXRoLm1heCgyMCwgTWF0aC5taW4oNTAwLCBNYXRoLnJvdW5kKHJhdy5nbG9iYWxTZWFyY2hNYXhSZXN1bHRzKSkpXG4gICAgICAgIDogREVGQVVMVF9TRVRUSU5HUy5nbG9iYWxTZWFyY2hNYXhSZXN1bHRzLFxuICAgICAgZGVmYXVsdFRoZW1lUHJlc2V0OiBbXG4gICAgICAgIFwiY2xhc3NpYy1pbmRpZ29cIiwgXCJvY2Vhbi1ibHVlXCIsIFwiZm9yZXN0LWdyZWVuXCIsIFwic3Vuc2V0LW9yYW5nZVwiLCBcImxhdmVuZGVyLWRyZWFtXCIsXG4gICAgICAgIFwiY2FuZHktcG9wXCIsIFwicGFwZXItbm90ZVwiLCBcIm1pbmltYWwtaW5rXCIsIFwiZGFyay1uZW9uXCIsIFwibWludC1jbGVhblwiXG4gICAgICBdLmluY2x1ZGVzKFN0cmluZyhyYXcuZGVmYXVsdFRoZW1lUHJlc2V0KSkgPyByYXcuZGVmYXVsdFRoZW1lUHJlc2V0IGFzIE1pbmRNYXBTdHVkaW9TZXR0aW5nc1tcImRlZmF1bHRUaGVtZVByZXNldFwiXSA6IERFRkFVTFRfU0VUVElOR1MuZGVmYXVsdFRoZW1lUHJlc2V0LFxuICAgICAgZWRnZVdpZHRoTW9kZTogcmF3LmVkZ2VXaWR0aE1vZGUgPT09IFwidW5pZm9ybVwiIHx8IHJhdy5lZGdlV2lkdGhNb2RlID09PSBcInRhcGVyZWRcIlxuICAgICAgICA/IHJhdy5lZGdlV2lkdGhNb2RlXG4gICAgICAgIDogaGFkU3RvcmVkU2V0dGluZ3MgPyBcInVuaWZvcm1cIiA6IERFRkFVTFRfU0VUVElOR1MuZWRnZVdpZHRoTW9kZSxcbiAgICAgIGVkZ2VNaW5XaWR0aDogdHlwZW9mIHJhdy5lZGdlTWluV2lkdGggPT09IFwibnVtYmVyXCJcbiAgICAgICAgPyBNYXRoLm1heCgwLjI1LCBNYXRoLm1pbig4LCByYXcuZWRnZU1pbldpZHRoKSlcbiAgICAgICAgOiBERUZBVUxUX1NFVFRJTkdTLmVkZ2VNaW5XaWR0aCxcbiAgICAgIHJvb3RDb2xvcjogdHlwZW9mIHJhdy5yb290Q29sb3IgPT09IFwic3RyaW5nXCIgJiYgL14jWzAtOWEtZl17Nn0kL2kudGVzdChyYXcucm9vdENvbG9yKVxuICAgICAgICA/IHJhdy5yb290Q29sb3JcbiAgICAgICAgOiBoYWRTdG9yZWRTZXR0aW5ncyA/IFwiXCIgOiBERUZBVUxUX1NFVFRJTkdTLnJvb3RDb2xvcixcbiAgICAgIHJvb3RUZXh0Q29sb3I6IHR5cGVvZiByYXcucm9vdFRleHRDb2xvciA9PT0gXCJzdHJpbmdcIiAmJiAvXiNbMC05YS1mXXs2fSQvaS50ZXN0KHJhdy5yb290VGV4dENvbG9yKVxuICAgICAgICA/IHJhdy5yb290VGV4dENvbG9yXG4gICAgICAgIDogaGFkU3RvcmVkU2V0dGluZ3MgPyBcIlwiIDogREVGQVVMVF9TRVRUSU5HUy5yb290VGV4dENvbG9yLFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHlwZW9mIHJhdy5jb2xvcmZ1bEJyYW5jaGVzID09PSBcImJvb2xlYW5cIlxuICAgICAgICA/IHJhdy5jb2xvcmZ1bEJyYW5jaGVzXG4gICAgICAgIDogaGFkU3RvcmVkU2V0dGluZ3MgPyBmYWxzZSA6IERFRkFVTFRfU0VUVElOR1MuY29sb3JmdWxCcmFuY2hlcyxcbiAgICAgIGJyYW5jaENvbG9yczogQXJyYXkuaXNBcnJheShyYXcuYnJhbmNoQ29sb3JzKVxuICAgICAgICA/IHJhdy5icmFuY2hDb2xvcnMuZmlsdGVyKCh2YWx1ZSk6IHZhbHVlIGlzIHN0cmluZyA9PiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgL14jWzAtOWEtZl17Nn0kL2kudGVzdCh2YWx1ZSkpLnNsaWNlKDAsIDEyKVxuICAgICAgICA6IGhhZFN0b3JlZFNldHRpbmdzID8gW10gOiBbLi4uREVGQVVMVF9TRVRUSU5HUy5icmFuY2hDb2xvcnNdXG4gICAgfSBhcyBNaW5kTWFwU3R1ZGlvU2V0dGluZ3M7XG4gICAgaWYgKHJhdy5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gdW5kZWZpbmVkICYmIHJhdy5zaG93R3JpZCA9PT0gZmFsc2UpIHRoaXMuc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm4gPSBcIm5vbmVcIjtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgcmVmcmVzaE9wZW5WaWV3cygpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfTUlORE1BUF9TVFVESU8pKSB7XG4gICAgICBpZiAobGVhZi52aWV3IGluc3RhbmNlb2YgTWluZE1hcFN0dWRpb1ZpZXcpIGxlYWYudmlldy5yZWZyZXNoQXBwZWFyYW5jZSgpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUNvbmZpZ3VyZWREb2N1bWVudCh0aXRsZTogc3RyaW5nKTogTWluZE1hcERvY3VtZW50IHtcbiAgICBjb25zdCBkb2N1bWVudCA9IGNyZWF0ZURlZmF1bHREb2N1bWVudCh0aXRsZSk7XG4gICAgZG9jdW1lbnQubGF5b3V0ID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0TGF5b3V0O1xuICAgIGRvY3VtZW50LnRoZW1lID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0VGhlbWU7XG4gICAgZG9jdW1lbnQuYXBwZWFyYW5jZSA9IHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMuc2V0dGluZ3MpO1xuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuXG4gIGFzeW5jIGdldEF2YWlsYWJsZVBhdGgocHJlZmVycmVkUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChwcmVmZXJyZWRQYXRoKTtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKSkgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgY29uc3QgZG90ID0gbm9ybWFsaXplZC5sYXN0SW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgYmFzZSA9IGRvdCA+IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpID8gbm9ybWFsaXplZC5zbGljZSgwLCBkb3QpIDogbm9ybWFsaXplZDtcbiAgICBjb25zdCBleHRlbnNpb24gPSBkb3QgPiBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKSA/IG5vcm1hbGl6ZWQuc2xpY2UoZG90KSA6IFwiXCI7XG4gICAgbGV0IGluZGV4ID0gMjtcbiAgICB3aGlsZSAodGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGAke2Jhc2V9ICR7aW5kZXh9JHtleHRlbnNpb259YCkpIGluZGV4ICs9IDE7XG4gICAgcmV0dXJuIGAke2Jhc2V9ICR7aW5kZXh9JHtleHRlbnNpb259YDtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZU1pbmRNYXAob3B0aW9uczoge1xuICAgIGluc2VydEludG9DdXJyZW50PzogYm9vbGVhbjtcbiAgICBmb2xkZXI/OiBzdHJpbmc7XG4gICAgZG9jdW1lbnQ/OiBNaW5kTWFwRG9jdW1lbnQ7XG4gICAgdGl0bGU/OiBzdHJpbmc7XG4gIH0gPSB7fSk6IFByb21pc2U8VEZpbGU+IHtcbiAgICBjb25zdCBhY3RpdmVCZWZvcmUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGNvbnN0IGZvbGRlciA9IGF3YWl0IHRoaXMucmVzb2x2ZUZvbGRlcihvcHRpb25zLmZvbGRlciwgYWN0aXZlQmVmb3JlKTtcbiAgICBjb25zdCB0aXRsZSA9IG9wdGlvbnMudGl0bGUgPz8gdGhpcy5idWlsZE5ld1RpdGxlKCk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUodGl0bGUpO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgobm9ybWFsaXplUGF0aChgJHtmb2xkZXIgPyBgJHtmb2xkZXJ9L2AgOiBcIlwifSR7ZmlsZW5hbWV9LiR7TUlORE1BUF9FWFRFTlNJT059YCkpO1xuICAgIGNvbnN0IGRvY3VtZW50ID0gb3B0aW9ucy5kb2N1bWVudCA/PyB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWREb2N1bWVudCh0aXRsZSk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCkpO1xuXG4gICAgaWYgKG9wdGlvbnMuaW5zZXJ0SW50b0N1cnJlbnQgJiYgYWN0aXZlQmVmb3JlICYmIGFjdGl2ZUJlZm9yZS5leHRlbnNpb24gPT09IFwibWRcIiAmJiBhY3RpdmVCZWZvcmUucGF0aCAhPT0gZmlsZS5wYXRoKSB7XG4gICAgICBjb25zdCBlbWJlZCA9IGBcXG5cXG4hW1ske2ZpbGUucGF0aH1dXVxcbmA7XG4gICAgICBjb25zdCBjdXJyZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChhY3RpdmVCZWZvcmUpO1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGFjdGl2ZUJlZm9yZSwgYCR7Y3VycmVudC50cmltRW5kKCl9JHtlbWJlZH1gKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5vcGVuQXNNaW5kTWFwKGZpbGUpO1xuICAgIHJldHVybiBmaWxlO1xuICB9XG5cbiAgYXN5bmMgb3BlbkFzTWluZE1hcChmaWxlOiBURmlsZSwgcHJlZmVycmVkTGVhZj86IFdvcmtzcGFjZUxlYWYsIGZvY3VzTm9kZUlkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGVhZiA9IHByZWZlcnJlZExlYWYgPz8gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcbiAgICAgIHR5cGU6IFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyxcbiAgICAgIHN0YXRlOiB7IGZpbGU6IGZpbGUucGF0aCB9LFxuICAgICAgYWN0aXZlOiB0cnVlXG4gICAgfSk7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgaWYgKGZvY3VzTm9kZUlkICYmIGxlYWYudmlldyBpbnN0YW5jZW9mIE1pbmRNYXBTdHVkaW9WaWV3KSB7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBsZWFmLnZpZXcgaW5zdGFuY2VvZiBNaW5kTWFwU3R1ZGlvVmlldyAmJiBsZWFmLnZpZXcuZm9jdXNOb2RlKGZvY3VzTm9kZUlkKSwgMzApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHNhdmVQYXN0ZWRJbWFnZShibG9iOiBCbG9iLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcsIHNvdXJjZUZpbGU6IFRGaWxlIHwgbnVsbCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgLy8gXHU1NkZFXHU3MjQ3XHU4RDQ0XHU2RTkwXHU3NkVFXHU1RjU1XHU2MzA5XHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU2MjQwXHU1NzI4XHU3NkVFXHU1RjU1XHU4OUUzXHU2NzkwXHVGRjBDXHU4MDBDXHU0RTBEXHU2NjJGXHU2MzA5XHU0RUQzXHU1RTkzXHU2ODM5XHU3NkVFXHU1RjU1XHU4OUUzXHU2NzkwXHUzMDAyXG4gICAgLy8gXHU0RjhCXHU1OTgyIFByb2plY3RzL1BsYW4ubWluZG1hcCArIE1pbmRNYXAgQXNzZXRzID0+XG4gICAgLy8gUHJvamVjdHMvTWluZE1hcCBBc3NldHMvUGxhbi0yMDI2MDcyMC0xMjM0NTYucG5nXG4gICAgY29uc3Qgc291cmNlRm9sZGVyID0gc291cmNlRmlsZT8ucGFyZW50Py5wYXRoID8/IFwiXCI7XG4gICAgY29uc3QgY29uZmlndXJlZEZvbGRlciA9IG5vcm1hbGl6ZVBhdGgoKHRoaXMuc2V0dGluZ3MuYXNzZXRGb2xkZXIgfHwgXCJNaW5kTWFwIEFzc2V0c1wiKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKSk7XG4gICAgY29uc3QgZm9sZGVyID0gbm9ybWFsaXplUGF0aChbc291cmNlRm9sZGVyLCBjb25maWd1cmVkRm9sZGVyXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIi9cIikpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyUGF0aChmb2xkZXIpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgdHdvID0gKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcgPT4gU3RyaW5nKHZhbHVlKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgY29uc3Qgc3RhbXAgPSBgJHtub3cuZ2V0RnVsbFllYXIoKX0ke3R3byhub3cuZ2V0TW9udGgoKSArIDEpfSR7dHdvKG5vdy5nZXREYXRlKCkpfS0ke3R3byhub3cuZ2V0SG91cnMoKSl9JHt0d28obm93LmdldE1pbnV0ZXMoKSl9JHt0d28obm93LmdldFNlY29uZHMoKSl9YDtcbiAgICBjb25zdCBleHRlbnNpb24gPSBzdWdnZXN0ZWROYW1lLnNwbGl0KFwiLlwiKS5hdCgtMSk/LnJlcGxhY2UoL1teYS16MC05XS9naSwgXCJcIikudG9Mb3dlckNhc2UoKSB8fCBcInBuZ1wiO1xuICAgIGNvbnN0IGJhc2UgPSB0aGlzLnNhbml0aXplRmlsZW5hbWUoc291cmNlRmlsZT8uYmFzZW5hbWUgPz8gXCJtaW5kbWFwXCIpO1xuICAgIGNvbnN0IHByZWZlcnJlZCA9IG5vcm1hbGl6ZVBhdGgoYCR7Zm9sZGVyfS8ke2Jhc2V9LSR7c3RhbXB9LiR7ZXh0ZW5zaW9ufWApO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgocHJlZmVycmVkKTtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVCaW5hcnkocGF0aCwgYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICByZXR1cm4gcGF0aDtcbiAgfVxuXG4gIGFzeW5jIHJlYWRJbWFnZVNvdXJjZShzb3VyY2U6IHN0cmluZywgc291cmNlRmlsZTogVEZpbGUgfCBudWxsKTogUHJvbWlzZTx7IGJsb2I6IEJsb2I7IHN1Z2dlc3RlZE5hbWU6IHN0cmluZyB9IHwgbnVsbD4ge1xuICAgIGNvbnN0IHJhdyA9IHNvdXJjZS50cmltKCk7XG4gICAgaWYgKCFyYXcgfHwgL15odHRwcz86XFwvXFwvL2kudGVzdChyYXcpIHx8IC9eZGF0YTovaS50ZXN0KHJhdykgfHwgL15ibG9iOi9pLnRlc3QocmF3KSkgcmV0dXJuIG51bGw7XG4gICAgY29uc3Qgd2lraU1hdGNoID0gcmF3Lm1hdGNoKC9eIT9cXFtcXFsoW1xcc1xcU10rPylcXF1cXF0kLyk7XG4gICAgY29uc3QgdGFyZ2V0ID0gKHdpa2lNYXRjaD8uWzFdID8/IHJhdykuc3BsaXQoXCJ8XCIpWzBdPy5zcGxpdChcIiNcIilbMF0/LnRyaW0oKSA/PyByYXc7XG4gICAgY29uc3QgZGlyZWN0ID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgodGFyZ2V0KSk7XG4gICAgY29uc3QgZmlsZSA9IGRpcmVjdCBpbnN0YW5jZW9mIFRGaWxlID8gZGlyZWN0IDogdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdCh0YXJnZXQsIHNvdXJjZUZpbGU/LnBhdGggPz8gXCJcIik7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgYmluYXJ5ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZEJpbmFyeShmaWxlKTtcbiAgICByZXR1cm4geyBibG9iOiBuZXcgQmxvYihbYmluYXJ5XSwgeyB0eXBlOiB0aGlzLm1pbWVGcm9tRmlsZW5hbWUoZmlsZS5uYW1lKSB9KSwgc3VnZ2VzdGVkTmFtZTogZmlsZS5uYW1lIH07XG4gIH1cblxuICBnZXRJbWFnZUhvc3RDaG9pY2VzKCk6IEltYWdlSG9zdENob2ljZVtdIHtcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5pbWFnZUhvc3RzXG4gICAgICAuZmlsdGVyKChob3N0KSA9PiBob3N0LmVuYWJsZWQgJiYgQm9vbGVhbihob3N0LmVuZHBvaW50LnRyaW0oKSkpXG4gICAgICAubWFwKChob3N0KSA9PiAoeyBpZDogaG9zdC5pZCwgbmFtZTogaG9zdC5uYW1lIH0pKTtcbiAgfVxuXG4gIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBlbmFibGVkID0gbmV3IFNldCh0aGlzLmdldEltYWdlSG9zdENob2ljZXMoKS5tYXAoKGhvc3QpID0+IGhvc3QuaWQpKTtcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5maWx0ZXIoKGlkKSA9PiBlbmFibGVkLmhhcyhpZCkpO1xuICB9XG5cbiAgYXN5bmMgdXBsb2FkSW1hZ2VUb0hvc3RzKGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZywgaG9zdElkczogc3RyaW5nW10pOiBQcm9taXNlPEltYWdlSG9zdFVwbG9hZEJhdGNoPiB7XG4gICAgY29uc3QgcmVxdWVzdGVkID0gQXJyYXkuZnJvbShuZXcgU2V0KGhvc3RJZHMpKTtcbiAgICBjb25zdCBob3N0cyA9IHJlcXVlc3RlZFxuICAgICAgLm1hcCgoaWQpID0+IHRoaXMuc2V0dGluZ3MuaW1hZ2VIb3N0cy5maW5kKChob3N0KSA9PiBob3N0LmlkID09PSBpZCkpXG4gICAgICAuZmlsdGVyKChob3N0KTogaG9zdCBpcyBJbWFnZUhvc3RDb25maWcgPT4gQm9vbGVhbihob3N0Py5lbmFibGVkICYmIGhvc3QuZW5kcG9pbnQudHJpbSgpKSk7XG4gICAgaWYgKCFob3N0cy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIlx1NkNBMVx1NjcwOVx1OTAwOVx1NjJFOVx1NTNFRlx1NzUyOFx1NTZGRVx1NUU4QVwiKTtcbiAgICBjb25zdCBzZXR0bGVkID0gYXdhaXQgUHJvbWlzZS5hbGwoaG9zdHMubWFwKGFzeW5jIChob3N0KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB1cmwgPSBhd2FpdCB0aGlzLnVwbG9hZEltYWdlVG9Ib3N0Q29uZmlnKGhvc3QsIGJsb2IsIHN1Z2dlc3RlZE5hbWUpO1xuICAgICAgICByZXR1cm4geyBvazogdHJ1ZSBhcyBjb25zdCwgdmFsdWU6IHsgaG9zdElkOiBob3N0LmlkLCBob3N0TmFtZTogaG9zdC5uYW1lLCB1cmwgfSB9O1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvazogZmFsc2UgYXMgY29uc3QsXG4gICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgIGhvc3RJZDogaG9zdC5pZCxcbiAgICAgICAgICAgIGhvc3ROYW1lOiBob3N0Lm5hbWUsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2Vzc2VzOiBzZXR0bGVkLmZpbHRlcigoaXRlbSk6IGl0ZW0gaXMgeyBvazogdHJ1ZTsgdmFsdWU6IEltYWdlSG9zdFVwbG9hZFN1Y2Nlc3MgfSA9PiBpdGVtLm9rKS5tYXAoKGl0ZW0pID0+IGl0ZW0udmFsdWUpLFxuICAgICAgZmFpbHVyZXM6IHNldHRsZWQuZmlsdGVyKChpdGVtKTogaXRlbSBpcyB7IG9rOiBmYWxzZTsgdmFsdWU6IHsgaG9zdElkOiBzdHJpbmc7IGhvc3ROYW1lOiBzdHJpbmc7IGVycm9yOiBzdHJpbmcgfSB9ID0+ICFpdGVtLm9rKS5tYXAoKGl0ZW0pID0+IGl0ZW0udmFsdWUpXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHRlc3RJbWFnZUhvc3QoaG9zdElkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBob3N0ID0gdGhpcy5zZXR0aW5ncy5pbWFnZUhvc3RzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IGhvc3RJZCk7XG4gICAgaWYgKCFob3N0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiXHU2MjdFXHU0RTBEXHU1MjMwXHU4QkU1XHU1NkZFXHU1RThBXHU5MTREXHU3RjZFXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIWhvc3QuZW5kcG9pbnQudHJpbSgpKSB7XG4gICAgICBuZXcgTm90aWNlKGBcdThCRjdcdTUxNDhcdTU4NkJcdTUxOTkgJHtob3N0Lm5hbWV9IFx1NzY4NFx1NEUwQVx1NEYyMCBBUElgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQSByZWFsIDFcdTAwRDcxIHRyYW5zcGFyZW50IFBORyB0ZXN0cyBhdXRoZW50aWNhdGlvbiwgcmVxdWVzdCBmb3JtYXQgYW5kIHJlc3BvbnNlIHBhcnNpbmcuXG4gICAgY29uc3QgcG5nID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAgICAgMTM3LCA4MCwgNzgsIDcxLCAxMywgMTAsIDI2LCAxMCwgMCwgMCwgMCwgMTMsIDczLCA3MiwgNjgsIDgyLFxuICAgICAgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMSwgOCwgNiwgMCwgMCwgMCwgMzEsIDIxLCAxOTYsIDEzNyxcbiAgICAgIDAsIDAsIDAsIDEzLCA3MywgNjgsIDY1LCA4NCwgOCwgMjE1LCA5OSwgMjQ4LCAyMDcsIDE5MiwgMjQwLCAzMSxcbiAgICAgIDAsIDUsIDAsIDEsIDI1NSwgMTM3LCAxNTMsIDYxLCAyOSwgMCwgMCwgMCwgMCwgNzMsIDY5LCA3OCwgNjgsXG4gICAgICAxNzQsIDY2LCA5NiwgMTMwXG4gICAgXSk7XG4gICAgY29uc3Qgc3RhcnRlZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1cmwgPSBhd2FpdCB0aGlzLnVwbG9hZEltYWdlVG9Ib3N0Q29uZmlnKGhvc3QsIG5ldyBCbG9iKFtwbmddLCB7IHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSksIFwibWluZG1hcC1zdHVkaW8tYXBpLXRlc3QucG5nXCIpO1xuICAgICAgY29uc3QgZWxhcHNlZCA9IE1hdGgubWF4KDEsIE1hdGgucm91bmQocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydGVkKSk7XG4gICAgICBuZXcgTm90aWNlKGAke2hvc3QubmFtZX0gXHU4RkRFXHU2M0E1XHU2MjEwXHU1MjlGXHVGRjA4JHtlbGFwc2VkfSBtc1x1RkYwOVxcbiR7dXJsfWAsIDgwMDApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gaW1hZ2UgaG9zdCBjb25uZWN0aXZpdHkgdGVzdCBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShgJHtob3N0Lm5hbWV9IFx1OEZERVx1NjNBNVx1NTkzMVx1OEQyNVx1RkYxQSR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsIDgwMDApO1xuICAgIH1cbiAgfVxuXG4gIHNjaGVkdWxlQXV0b1VwbG9hZChmaWxlOiBURmlsZSB8IG51bGwsIG5vZGVJZDogc3RyaW5nLCBibG9ja0lkOiBzdHJpbmcsIGxvY2FsUGF0aDogc3RyaW5nLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoIWZpbGUgfHwgIXRoaXMuc2V0dGluZ3MuYXV0b1VwbG9hZEVuYWJsZWQpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0SWRzID0gdGhpcy5nZXREZWZhdWx0VXBsb2FkSG9zdElkcygpO1xuICAgIGlmICghaG9zdElkcy5sZW5ndGgpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTVCNThcdTUyMzBcdTY3MkNcdTU3MzBcdUZGMUJcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcdTY3MkFcdTkwMDlcdTYyRTlcdTUzRUZcdTc1MjhcdTU2RkVcdTVFOEFcIiwgNTAwMCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGtleSA9IGAke2ZpbGUucGF0aH06OiR7bm9kZUlkfTo6JHtibG9ja0lkfWA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmF1dG9VcGxvYWRUaW1lcnMuZ2V0KGtleSk7XG4gICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHdpbmRvdy5jbGVhclRpbWVvdXQoZXhpc3RpbmcpO1xuICAgIGNvbnN0IGRlbGF5ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzAwLCB0aGlzLnNldHRpbmdzLmF1dG9VcGxvYWREZWxheVNlY29uZHMpKSAqIDEwMDA7XG4gICAgY29uc3QgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmF1dG9VcGxvYWRUaW1lcnMuZGVsZXRlKGtleSk7XG4gICAgICB2b2lkIHRoaXMucnVuQXV0b1VwbG9hZFRhc2soZmlsZS5wYXRoLCBub2RlSWQsIGJsb2NrSWQsIGxvY2FsUGF0aCwgc3VnZ2VzdGVkTmFtZSwgaG9zdElkcyk7XG4gICAgfSwgZGVsYXkpO1xuICAgIHRoaXMuYXV0b1VwbG9hZFRpbWVycy5zZXQoa2V5LCB0aW1lcik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkF1dG9VcGxvYWRUYXNrKFxuICAgIG1pbmRNYXBQYXRoOiBzdHJpbmcsXG4gICAgbm9kZUlkOiBzdHJpbmcsXG4gICAgYmxvY2tJZDogc3RyaW5nLFxuICAgIGxvY2FsUGF0aDogc3RyaW5nLFxuICAgIHN1Z2dlc3RlZE5hbWU6IHN0cmluZyxcbiAgICBob3N0SWRzOiBzdHJpbmdbXVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5mbHVzaE9wZW5WaWV3KG1pbmRNYXBQYXRoKTtcbiAgICAgIGNvbnN0IG1hcEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobWluZE1hcFBhdGgpO1xuICAgICAgY29uc3QgbG9jYWxGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgobG9jYWxQYXRoKSk7XG4gICAgICBpZiAoIShtYXBGaWxlIGluc3RhbmNlb2YgVEZpbGUpIHx8ICEobG9jYWxGaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm47XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHBhcnNlRG9jdW1lbnQoYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChtYXBGaWxlKSwgbWFwRmlsZS5iYXNlbmFtZSk7XG4gICAgICBjb25zdCBub2RlID0gZmluZE5vZGUoZG9jdW1lbnQucm9vdCwgbm9kZUlkKTtcbiAgICAgIGNvbnN0IGJsb2NrID0gbm9kZT8uY29udGVudD8uZmluZCgoaXRlbSk6IGl0ZW0gaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGl0ZW0udHlwZSA9PT0gXCJpbWFnZVwiICYmIGl0ZW0uaWQgPT09IGJsb2NrSWQpO1xuICAgICAgaWYgKCFub2RlIHx8ICFibG9jayB8fCAoYmxvY2suc291cmNlICE9PSBsb2NhbFBhdGggJiYgYmxvY2subG9jYWxTb3VyY2UgIT09IGxvY2FsUGF0aCkpIHJldHVybjtcblxuICAgICAgY29uc3QgYmluYXJ5ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZEJpbmFyeShsb2NhbEZpbGUpO1xuICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtiaW5hcnldLCB7IHR5cGU6IHRoaXMubWltZUZyb21GaWxlbmFtZShsb2NhbEZpbGUubmFtZSkgfSk7XG4gICAgICBjb25zdCBiYXRjaCA9IGF3YWl0IHRoaXMudXBsb2FkSW1hZ2VUb0hvc3RzKGJsb2IsIHN1Z2dlc3RlZE5hbWUgfHwgbG9jYWxGaWxlLm5hbWUsIGhvc3RJZHMpO1xuICAgICAgY29uc3QgdXBsb2FkZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIGNvbnN0IHJlbW90ZUJ5SG9zdCA9IG5ldyBNYXAoKGJsb2NrLnJlbW90ZVNvdXJjZXMgPz8gW10pLm1hcCgoaXRlbSkgPT4gW2l0ZW0uaG9zdElkLCBpdGVtXSkpO1xuICAgICAgZm9yIChjb25zdCBzdWNjZXNzIG9mIGJhdGNoLnN1Y2Nlc3Nlcykge1xuICAgICAgICByZW1vdGVCeUhvc3Quc2V0KHN1Y2Nlc3MuaG9zdElkLCB7IC4uLnN1Y2Nlc3MsIHVwbG9hZGVkQXQgfSk7XG4gICAgICB9XG4gICAgICBibG9jay5yZW1vdGVTb3VyY2VzID0gQXJyYXkuZnJvbShyZW1vdGVCeUhvc3QudmFsdWVzKCkpO1xuICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSBsb2NhbFBhdGg7XG5cbiAgICAgIGNvbnN0IGFsbFN1Y2NlZWRlZCA9IGJhdGNoLmZhaWx1cmVzLmxlbmd0aCA9PT0gMCAmJiBiYXRjaC5zdWNjZXNzZXMubGVuZ3RoID09PSBob3N0SWRzLmxlbmd0aDtcbiAgICAgIGlmIChhbGxTdWNjZWVkZWQgJiYgYmF0Y2guc3VjY2Vzc2VzWzBdKSBibG9jay5zb3VyY2UgPSBiYXRjaC5zdWNjZXNzZXNbMF0udXJsO1xuICAgICAgc3luY05vZGVMZWdhY3lGaWVsZHMobm9kZSk7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkobWFwRmlsZSwgc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpKTtcbiAgICAgIGF3YWl0IHRoaXMucmVmcmVzaE9wZW5NaW5kTWFwKG1hcEZpbGUsIGRvY3VtZW50KTtcblxuICAgICAgbGV0IGRlbGV0ZWQgPSBmYWxzZTtcbiAgICAgIGlmIChhbGxTdWNjZWVkZWQgJiYgdGhpcy5zZXR0aW5ncy5kZWxldGVMb2NhbEFmdGVyVXBsb2FkKSB7XG4gICAgICAgIGRlbGV0ZWQgPSBhd2FpdCB0aGlzLmRlbGV0ZUxvY2FsQXNzZXRJZlNhZmUobG9jYWxQYXRoLCBtaW5kTWFwUGF0aCwgYmxvY2tJZCk7XG4gICAgICAgIGlmIChkZWxldGVkKSB7XG4gICAgICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KG1hcEZpbGUsIHNlcmlhbGl6ZURvY3VtZW50KGRvY3VtZW50KSk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoT3Blbk1pbmRNYXAobWFwRmlsZSwgZG9jdW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChhbGxTdWNjZWVkZWQpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0cyA9IGJhdGNoLnN1Y2Nlc3Nlcy5tYXAoKGl0ZW0pID0+IGl0ZW0uaG9zdE5hbWUpLmpvaW4oXCJcdTMwMDFcIik7XG4gICAgICAgIGNvbnN0IHN1ZmZpeCA9IHRoaXMuc2V0dGluZ3MuZGVsZXRlTG9jYWxBZnRlclVwbG9hZFxuICAgICAgICAgID8gZGVsZXRlZCA/IFwiXHVGRjBDXHU2NzJDXHU1NzMwXHU1NkZFXHU3MjQ3XHU1REYyXHU1Qjg5XHU1MTY4XHU1MjIwXHU5NjY0XCIgOiBcIlx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NTZFMFx1NEVDRFx1ODhBQlx1NUYxNVx1NzUyOFx1NjIxNlx1NTIyMFx1OTY2NFx1NTkzMVx1OEQyNVx1ODAwQ1x1NEZERFx1NzU1OVwiXG4gICAgICAgICAgOiBcIlx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NzU1OVwiO1xuICAgICAgICBuZXcgTm90aWNlKGBcdTU2RkVcdTcyNDdcdTVERjJcdTRFMEFcdTRGMjBcdTUyMzAgJHt0YXJnZXRzfSR7c3VmZml4fWAsIDcwMDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgb2sgPSBiYXRjaC5zdWNjZXNzZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpIHx8IFwiXHU2NUUwXCI7XG4gICAgICAgIGNvbnN0IGZhaWxlZCA9IGJhdGNoLmZhaWx1cmVzLm1hcCgoaXRlbSkgPT4gYCR7aXRlbS5ob3N0TmFtZX1cdUZGMUEke2l0ZW0uZXJyb3J9YCkuam9pbihcIlx1RkYxQlwiKTtcbiAgICAgICAgbmV3IE5vdGljZShgXHU1NkZFXHU3MjQ3XHU0RUM1XHU5MEU4XHU1MjA2XHU0RTBBXHU0RjIwXHU2MjEwXHU1MjlGXHUzMDAyXHU2MjEwXHU1MjlGXHVGRjFBJHtva31cdUZGMUJcdTU5MzFcdThEMjVcdUZGMUEke2ZhaWxlZH1cdTMwMDJcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTVERjJcdTRGRERcdTc1NTlcdTMwMDJgLCA5MDAwKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGF1dG9tYXRpYyBpbWFnZSB1cGxvYWQgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgIG5ldyBOb3RpY2UoYFx1NTZGRVx1NzI0N1x1ODFFQVx1NTJBOFx1NEUwQVx1NEYyMFx1NTkzMVx1OEQyNVx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsIDgwMDApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgdXBsb2FkSW1hZ2VUb0hvc3RDb25maWcoaG9zdDogSW1hZ2VIb3N0Q29uZmlnLCBibG9iOiBCbG9iLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGVuZHBvaW50ID0gaG9zdC5lbmRwb2ludC50cmltKCk7XG4gICAgaWYgKCFlbmRwb2ludCkgdGhyb3cgbmV3IEVycm9yKFwiXHU0RTBBXHU0RjIwIEFQSSBcdTRFM0FcdTdBN0FcIik7XG4gICAgbGV0IGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBpZiAoaG9zdC5oZWFkZXJzLnRyaW0oKSkge1xuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShob3N0LmhlYWRlcnMpIGFzIHVua25vd247XG4gICAgICBpZiAoIXBhcnNlZCB8fCB0eXBlb2YgcGFyc2VkICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkocGFyc2VkKSkgdGhyb3cgbmV3IEVycm9yKFwiXHU4QkY3XHU2QzQyXHU1OTM0IEpTT04gXHU1RkM1XHU5ODdCXHU2NjJGXHU1QkY5XHU4QzYxXCIpO1xuICAgICAgaGVhZGVycyA9IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyhwYXJzZWQgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBba2V5LCBTdHJpbmcodmFsdWUpXSkpO1xuICAgIH1cbiAgICBjb25zdCBmaWxlbmFtZSA9IHRoaXMuc2FuaXRpemVGaWxlbmFtZShzdWdnZXN0ZWROYW1lIHx8IFwibWluZG1hcC1pbWFnZS5wbmdcIik7XG4gICAgY29uc3QgbWltZSA9IGJsb2IudHlwZSB8fCBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xuICAgIGxldCBib2R5OiBBcnJheUJ1ZmZlcjtcbiAgICBsZXQgY29udGVudFR5cGUgPSBtaW1lO1xuICAgIGlmIChob3N0LmJvZHlNb2RlID09PSBcIm11bHRpcGFydFwiKSB7XG4gICAgICBjb25zdCBib3VuZGFyeSA9IGAtLS0tTWluZE1hcFN0dWRpbyR7RGF0ZS5ub3coKS50b1N0cmluZygxNil9JHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKX1gO1xuICAgICAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgY29uc3QgZmllbGROYW1lID0gKGhvc3QuZmllbGROYW1lIHx8IFwiZmlsZVwiKS5yZXBsYWNlQWxsKCdcIicsIFwiXCIpO1xuICAgICAgY29uc3Qgc2FmZUZpbGVuYW1lID0gZmlsZW5hbWUucmVwbGFjZUFsbCgnXCInLCBcIlwiKTtcbiAgICAgIGNvbnN0IGhlYWQgPSBlbmNvZGVyLmVuY29kZShgLS0ke2JvdW5kYXJ5fVxcclxcbkNvbnRlbnQtRGlzcG9zaXRpb246IGZvcm0tZGF0YTsgbmFtZT1cIiR7ZmllbGROYW1lfVwiOyBmaWxlbmFtZT1cIiR7c2FmZUZpbGVuYW1lfVwiXFxyXFxuQ29udGVudC1UeXBlOiAke21pbWV9XFxyXFxuXFxyXFxuYCk7XG4gICAgICBjb25zdCBmaWxlID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICAgIGNvbnN0IHRhaWwgPSBlbmNvZGVyLmVuY29kZShgXFxyXFxuLS0ke2JvdW5kYXJ5fS0tXFxyXFxuYCk7XG4gICAgICBjb25zdCBjb21iaW5lZCA9IG5ldyBVaW50OEFycmF5KGhlYWQubGVuZ3RoICsgZmlsZS5sZW5ndGggKyB0YWlsLmxlbmd0aCk7XG4gICAgICBjb21iaW5lZC5zZXQoaGVhZCwgMCk7IGNvbWJpbmVkLnNldChmaWxlLCBoZWFkLmxlbmd0aCk7IGNvbWJpbmVkLnNldCh0YWlsLCBoZWFkLmxlbmd0aCArIGZpbGUubGVuZ3RoKTtcbiAgICAgIGJvZHkgPSBjb21iaW5lZC5idWZmZXI7XG4gICAgICBjb250ZW50VHlwZSA9IGBtdWx0aXBhcnQvZm9ybS1kYXRhOyBib3VuZGFyeT0ke2JvdW5kYXJ5fWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHkgPSBhd2FpdCBibG9iLmFycmF5QnVmZmVyKCk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IGVuZHBvaW50LFxuICAgICAgbWV0aG9kOiBob3N0Lm1ldGhvZCxcbiAgICAgIGNvbnRlbnRUeXBlLFxuICAgICAgaGVhZGVycyxcbiAgICAgIGJvZHksXG4gICAgICB0aHJvdzogdHJ1ZVxuICAgIH0pO1xuICAgIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICAgIHRyeSB7IHBheWxvYWQgPSByZXNwb25zZS5qc29uOyB9IGNhdGNoIHsgcGF5bG9hZCA9IHVuZGVmaW5lZDsgfVxuICAgIGlmICghcGF5bG9hZCAmJiByZXNwb25zZS50ZXh0KSB7XG4gICAgICB0cnkgeyBwYXlsb2FkID0gSlNPTi5wYXJzZShyZXNwb25zZS50ZXh0KTsgfSBjYXRjaCB7IHBheWxvYWQgPSByZXNwb25zZS50ZXh0OyB9XG4gICAgfVxuICAgIGNvbnN0IGdldFBhdGggPSAodmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHVua25vd24gPT4gcGF0aC5zcGxpdChcIi5cIikuZmlsdGVyKEJvb2xlYW4pLnJlZHVjZTx1bmtub3duPigoY3VycmVudCwga2V5KSA9PiBjdXJyZW50ICYmIHR5cGVvZiBjdXJyZW50ID09PSBcIm9iamVjdFwiID8gKGN1cnJlbnQgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tleV0gOiB1bmRlZmluZWQsIHZhbHVlKTtcbiAgICBjb25zdCBjYW5kaWRhdGVzID0gW2hvc3QucmVzcG9uc2VQYXRoLnRyaW0oKSwgXCJkYXRhLnVybFwiLCBcInVybFwiLCBcInJlc3VsdC51cmxcIiwgXCJyZXN1bHQuaW1hZ2VcIiwgXCJpbWFnZS51cmxcIiwgXCJzcmNcIl0uZmlsdGVyKEJvb2xlYW4pO1xuICAgIGZvciAoY29uc3QgcGF0aCBvZiBjYW5kaWRhdGVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldFBhdGgocGF5bG9hZCwgcGF0aCk7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QodmFsdWUudHJpbSgpKSkgcmV0dXJuIHZhbHVlLnRyaW0oKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IHBheWxvYWQubWF0Y2goL2h0dHBzPzpcXC9cXC9bXlxcc1wiJzw+XSsvaSk7XG4gICAgICBpZiAobWF0Y2g/LlswXSkgcmV0dXJuIG1hdGNoWzBdO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJcdThGRDRcdTU2REVcdTdFRDNcdTY3OUNcdTRFMkRcdTZDQTFcdTY3MDlcdTYyN0VcdTUyMzBcdTU2RkVcdTcyNDdcdTdGNTFcdTU3NDBcIik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZsdXNoT3BlblZpZXcocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChjb25zdCBsZWFmIG9mIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX01JTkRNQVBfU1RVRElPKSkge1xuICAgICAgaWYgKGxlYWYudmlldyBpbnN0YW5jZW9mIE1pbmRNYXBTdHVkaW9WaWV3ICYmIGxlYWYudmlldy5maWxlPy5wYXRoID09PSBwYXRoKSBhd2FpdCBsZWFmLnZpZXcuc2F2ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaE9wZW5NaW5kTWFwKGZpbGU6IFRGaWxlLCBkb2N1bWVudDogTWluZE1hcERvY3VtZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc291cmNlID0gc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTykpIHtcbiAgICAgIGlmIChsZWFmLnZpZXcgaW5zdGFuY2VvZiBNaW5kTWFwU3R1ZGlvVmlldyAmJiBsZWFmLnZpZXcuZmlsZT8ucGF0aCA9PT0gZmlsZS5wYXRoKSBsZWFmLnZpZXcuc2V0Vmlld0RhdGEoc291cmNlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkZWxldGVMb2NhbEFzc2V0SWZTYWZlKGxvY2FsUGF0aDogc3RyaW5nLCBjdXJyZW50TWluZE1hcFBhdGg6IHN0cmluZywgYmxvY2tJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgobG9jYWxQYXRoKTtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50TWluZE1hcFBhdGgpO1xuICAgIGlmIChjdXJyZW50IGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGNvbnN0IGRvYyA9IHBhcnNlRG9jdW1lbnQoYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChjdXJyZW50KSwgY3VycmVudC5iYXNlbmFtZSk7XG4gICAgICBjb25zdCBzdGlsbFVzZWQgPSBmbGF0dGVuTm9kZXMoZG9jLnJvb3QpLnNvbWUoKG5vZGUpID0+IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpLnNvbWUoKGJsb2NrKSA9PlxuICAgICAgICBibG9jay50eXBlID09PSBcImltYWdlXCIgJiYgYmxvY2suaWQgIT09IGJsb2NrSWQgJiYgKGJsb2NrLnNvdXJjZSA9PT0gbm9ybWFsaXplZCB8fCBibG9jay5sb2NhbFNvdXJjZSA9PT0gbm9ybWFsaXplZCkpKTtcbiAgICAgIGlmIChzdGlsbFVzZWQpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBmaWxlIG9mIHRoaXMuYXBwLnZhdWx0LmdldEZpbGVzKCkpIHtcbiAgICAgIGlmIChmaWxlLnBhdGggPT09IGN1cnJlbnRNaW5kTWFwUGF0aCB8fCBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpICE9PSBNSU5ETUFQX0VYVEVOU0lPTikgY29udGludWU7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcbiAgICAgICAgaWYgKHRleHQuaW5jbHVkZXMobm9ybWFsaXplZCkpIHJldHVybiBmYWxzZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBJZ25vcmUgYW4gdW5yZWFkYWJsZSB1bnJlbGF0ZWQgbWFwIGFuZCBrZWVwIGNoZWNraW5nIG90aGVyIGZpbGVzLlxuICAgICAgfVxuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuZGVsZXRlKHRhcmdldCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKFwiTWluZE1hcCBTdHVkaW8gY291bGQgbm90IGRlbGV0ZSB1cGxvYWRlZCBsb2NhbCBpbWFnZVwiLCBlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtaW1lRnJvbUZpbGVuYW1lKGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGZpbGVuYW1lLnNwbGl0KFwiLlwiKS5hdCgtMSk/LnRvTG93ZXJDYXNlKCk7XG4gICAgcmV0dXJuICh7IHBuZzogXCJpbWFnZS9wbmdcIiwganBnOiBcImltYWdlL2pwZWdcIiwganBlZzogXCJpbWFnZS9qcGVnXCIsIGdpZjogXCJpbWFnZS9naWZcIiwgd2VicDogXCJpbWFnZS93ZWJwXCIsIHN2ZzogXCJpbWFnZS9zdmcreG1sXCIsIGJtcDogXCJpbWFnZS9ibXBcIiwgYXZpZjogXCJpbWFnZS9hdmlmXCIgfSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtleHRlbnNpb24gPz8gXCJcIl0gPz8gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1Ym1hcEZpbGUocGFyZW50RmlsZTogVEZpbGUsIG5vZGU6IE1pbmRNYXBOb2RlKTogUHJvbWlzZTxNaW5kTWFwU3VibWFwPiB7XG4gICAgY29uc3QgdGl0bGUgPSAobm9kZVBsYWluVGV4dChub2RlKSB8fCBcIlx1NUI1MFx1NUJGQ1x1NTZGRVwiKS50cmltKCk7XG4gICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWREb2N1bWVudCh0aXRsZSk7XG4gICAgZG9jdW1lbnQucm9vdC5jb250ZW50ID0gW3sgaWQ6IGRvY3VtZW50LnJvb3QuaWQgKyBcIl90aXRsZVwiLCB0eXBlOiBcInRleHRcIiwgdGV4dDogdGl0bGUgfV07XG4gICAgc3luY05vZGVMZWdhY3lGaWVsZHMoZG9jdW1lbnQucm9vdCk7XG4gICAgZG9jdW1lbnQucm9vdC5saW5rID0gYFtbJHtwYXJlbnRGaWxlLnBhdGh9XV1gO1xuICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGU7XG4gICAgZG9jdW1lbnQubmF2aWdhdGlvbiA9IHtcbiAgICAgIHBhcmVudFBhdGg6IHBhcmVudEZpbGUucGF0aCxcbiAgICAgIHBhcmVudE5vZGVJZDogbm9kZS5pZCxcbiAgICAgIHBhcmVudFRpdGxlOiBwYXJlbnRGaWxlLmJhc2VuYW1lLFxuICAgICAgcGFyZW50Tm9kZVRleHQ6IG5vZGVQbGFpblRleHQobm9kZSkgfHwgdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFx1NUI1MFx1NUJGQ1x1NTZGRVx1NEUwRFx1NTE4RFx1NEUwRVx1NzIzNlx1NjU4N1x1NEVGNlx1NUU3M1x1OTRGQVx1MzAwMlx1NzZFRVx1NUY1NVx1N0VEM1x1Njc4NFx1NTZGQVx1NUI5QVx1NEUzQVx1RkYxQVxuICAgIC8vIFx1NzIzNlx1NjU4N1x1NEVGNlx1NjI0MFx1NTcyOFx1NzZFRVx1NUY1NSAvIFx1OEQ0NFx1NkU5MFx1NjU4N1x1NEVGNlx1NTkzOSAvIFx1NzIzNlx1NUJGQ1x1NTZGRVx1NjU4N1x1NEVGNlx1NTQwRCAvIFx1NUI1MFx1NUJGQ1x1NTZGRS5taW5kbWFwXG4gICAgY29uc3QgcGFyZW50Rm9sZGVyID0gcGFyZW50RmlsZS5wYXJlbnQ/LnBhdGggPz8gXCJcIjtcbiAgICBjb25zdCBjb25maWd1cmVkQXNzZXRzID0gbm9ybWFsaXplUGF0aCh0aGlzLnNldHRpbmdzLmFzc2V0Rm9sZGVyIHx8IFwiTWluZE1hcCBBc3NldHNcIik7XG4gICAgY29uc3QgcGFyZW50TWFwRm9sZGVyID0gdGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHBhcmVudEZpbGUuYmFzZW5hbWUpO1xuICAgIGNvbnN0IHN1Ym1hcEZvbGRlciA9IG5vcm1hbGl6ZVBhdGgoW3BhcmVudEZvbGRlciwgY29uZmlndXJlZEFzc2V0cywgcGFyZW50TWFwRm9sZGVyXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIi9cIikpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyUGF0aChzdWJtYXBGb2xkZXIpO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgobm9ybWFsaXplUGF0aChgJHtzdWJtYXBGb2xkZXJ9LyR7dGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKX0uJHtNSU5ETUFQX0VYVEVOU0lPTn1gKSk7XG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBzZXJpYWxpemVEb2N1bWVudChkb2N1bWVudCkpO1xuICAgIHJldHVybiB7IHBhdGg6IGZpbGUucGF0aCwgdGl0bGU6IGZpbGUuYmFzZW5hbWUgfTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5NaW5kTWFwUGF0aChwYXRoOiBzdHJpbmcsIHNvdXJjZVBhdGggPSBcIlwiLCBwcmVmZXJyZWRMZWFmPzogV29ya3NwYWNlTGVhZiwgZm9jdXNOb2RlSWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChwYXRoLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKSk7XG4gICAgY29uc3QgZGlyZWN0ID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIGNvbnN0IHJlc29sdmVkID0gZGlyZWN0IGluc3RhbmNlb2YgVEZpbGUgPyBkaXJlY3QgOiB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHBhdGgsIHNvdXJjZVBhdGgpO1xuICAgIGlmICghKHJlc29sdmVkIGluc3RhbmNlb2YgVEZpbGUpIHx8ICF0aGlzLmlzTWluZE1hcEZpbGUocmVzb2x2ZWQpKSB7XG4gICAgICBuZXcgTm90aWNlKGBcdTYyN0VcdTRFMERcdTUyMzBcdTVCNTBcdTVCRkNcdTU2RkVcdUZGMUEke3BhdGh9YCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMub3BlbkFzTWluZE1hcChyZXNvbHZlZCwgcHJlZmVycmVkTGVhZiwgZm9jdXNOb2RlSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbnN1cmVGb2xkZXJQYXRoKGZvbGRlcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQgfHwgdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWQpIGluc3RhbmNlb2YgVEZvbGRlcikgcmV0dXJuO1xuICAgIGNvbnN0IHBhcnRzID0gbm9ybWFsaXplZC5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtwYXJ0fWAgOiBwYXJ0O1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudCkpIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBtaWdyYXRlTGVnYWN5RmlsZShmaWxlOiBURmlsZSwgb3BlbkFmdGVyID0gdHJ1ZSk6IFByb21pc2U8VEZpbGUgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZSkpIHJldHVybiBudWxsO1xuICAgIGlmICh0aGlzLmxlZ2FjeU1pZ3JhdGlvblBhdGggPT09IGZpbGUucGF0aCkgcmV0dXJuIG51bGw7XG4gICAgdGhpcy5sZWdhY3lNaWdyYXRpb25QYXRoID0gZmlsZS5wYXRoO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgdGl0bGUgPSBmaWxlLmJhc2VuYW1lLnJlcGxhY2UoL1xcLnNtbSQvaSwgXCJcIikgfHwgXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICAgIGNvbnN0IGRvY3VtZW50ID0gcGFyc2VEb2N1bWVudChzb3VyY2UsIHRpdGxlKTtcbiAgICAgIGNvbnN0IHBhcmVudFBhdGggPSBmaWxlLnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgICAgY29uc3QgcHJlZmVycmVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7cGFyZW50UGF0aCA/IGAke3BhcmVudFBhdGh9L2AgOiBcIlwifSR7dGhpcy5zYW5pdGl6ZUZpbGVuYW1lKHRpdGxlKX0uJHtNSU5ETUFQX0VYVEVOU0lPTn1gKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHByZWZlcnJlZFBhdGgpO1xuICAgICAgbGV0IHRhcmdldDogVEZpbGU7XG5cbiAgICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlICYmIHRoaXMuaXNNaW5kTWFwRmlsZShleGlzdGluZykpIHtcbiAgICAgICAgdGFyZ2V0ID0gZXhpc3Rpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwYXRoID0gZXhpc3RpbmcgPyBhd2FpdCB0aGlzLmdldEF2YWlsYWJsZVBhdGgocHJlZmVycmVkUGF0aCkgOiBwcmVmZXJyZWRQYXRoO1xuICAgICAgICB0YXJnZXQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQpKTtcbiAgICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU4RjZDXHU2MzYyXHU0RTNBXHU1M0VGXHU3RjE2XHU4RjkxXHU4MTExXHU1NkZFXHVGRjFBJHt0YXJnZXQucGF0aH1cXG5cdTUzOUZcdTY1ODdcdTRFRjZcdTVERjJcdTRGRERcdTc1NTlcdTRGNUNcdTRFM0FcdTU5MDdcdTRFRkRcdTMwMDJgLCA3MDAwKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wZW5BZnRlcikgYXdhaXQgdGhpcy5vcGVuQXNNaW5kTWFwKHRhcmdldCwgdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWYgPz8gdW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBsZWdhY3kgbWlncmF0aW9uIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiXHU2NUU3XHU3MjQ4XHU4MTExXHU1NkZFXHU4RjZDXHU2MzYyXHU1OTMxXHU4RDI1XHVGRjBDXHU1MzlGXHU2NTg3XHU0RUY2XHU2NzJBXHU4OEFCXHU0RkVFXHU2NTM5XHUzMDAyXCIsIDYwMDApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMubGVnYWN5TWlncmF0aW9uUGF0aCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgaXNNaW5kTWFwRmlsZShmaWxlOiBURmlsZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpID09PSBNSU5ETUFQX0VYVEVOU0lPTjtcbiAgfVxuXG4gIGlzTGVnYWN5TWluZE1hcEZpbGUoZmlsZTogVEZpbGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoTEVHQUNZX1NVRkZJWCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbnZlcnRNYXJrZG93bkZpbGUoZmlsZTogVEZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgIGNvbnN0IHRpdGxlID0gZmlsZS5iYXNlbmFtZTtcbiAgICBjb25zdCBkb2N1bWVudCA9IG1hcmtkb3duVG9Eb2N1bWVudChzb3VyY2UsIHRpdGxlKTtcbiAgICBkb2N1bWVudC5sYXlvdXQgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQ7XG4gICAgZG9jdW1lbnQudGhlbWUgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRUaGVtZTtcbiAgICBkb2N1bWVudC5hcHBlYXJhbmNlID0gc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncyk7XG4gICAgYXdhaXQgdGhpcy5jcmVhdGVNaW5kTWFwKHsgZG9jdW1lbnQsIHRpdGxlOiBgJHt0aXRsZX0gXHU4MTExXHU1NkZFYCwgZm9sZGVyOiBmaWxlLnBhcmVudD8ucGF0aCA/PyBcIlwiIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlRm9sZGVyKGV4cGxpY2l0Rm9sZGVyOiBzdHJpbmcgfCB1bmRlZmluZWQsIGFjdGl2ZUZpbGU6IFRGaWxlIHwgbnVsbCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gZXhwbGljaXRGb2xkZXIgPz8gKHRoaXMuc2V0dGluZ3MuZGVmYXVsdEZvbGRlciB8fCBhY3RpdmVGaWxlPy5wYXJlbnQ/LnBhdGggfHwgXCJcIik7XG4gICAgaWYgKCFjYW5kaWRhdGUpIHJldHVybiBcIlwiO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGNhbmRpZGF0ZSk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZvbGRlcikgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJQYXRoKG5vcm1hbGl6ZWQpO1xuICAgIHJldHVybiBub3JtYWxpemVkO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZE5ld1RpdGxlKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCB0d28gPSAodmFsdWU6IG51bWJlcik6IHN0cmluZyA9PiBTdHJpbmcodmFsdWUpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBjb25zdCBzdGFtcCA9IGAke25vdy5nZXRGdWxsWWVhcigpfS0ke3R3byhub3cuZ2V0TW9udGgoKSArIDEpfS0ke3R3byhub3cuZ2V0RGF0ZSgpKX0gJHt0d28obm93LmdldEhvdXJzKCkpfSR7dHdvKG5vdy5nZXRNaW51dGVzKCkpfWA7XG4gICAgcmV0dXJuIGAke3RoaXMuc2V0dGluZ3MuZmlsZVByZWZpeH0gJHtzdGFtcH1gLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgc2FuaXRpemVGaWxlbmFtZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvW1xcXFwvOio/XCI8PnwjW1xcXV0vZywgXCItXCIpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSB8fCBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTb3VyY2VUaXRsZShjb250ZXh0OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0KTogc3RyaW5nIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGNvbnRleHQuc291cmNlUGF0aCk7XG4gICAgcmV0dXJuIHNvdXJjZUZpbGUgaW5zdGFuY2VvZiBURmlsZSA/IHNvdXJjZUZpbGUuYmFzZW5hbWUgOiBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzTWluZE1hcEVtYmVkcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgY29udGV4dDogTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVtYmVkcyA9IEFycmF5LmZyb20oZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcIi5pbnRlcm5hbC1lbWJlZFwiKSk7XG4gICAgZm9yIChjb25zdCBlbWJlZCBvZiBlbWJlZHMpIHtcbiAgICAgIGlmIChlbWJlZC5kYXRhc2V0Lm1tY1Byb2Nlc3NlZCA9PT0gXCJ0cnVlXCIpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgcmF3U291cmNlID0gZW1iZWQuZ2V0QXR0cmlidXRlKFwic3JjXCIpID8/IGVtYmVkLmRhdGFzZXQuc3JjID8/IFwiXCI7XG4gICAgICBjb25zdCBsaW5rUGF0aCA9IHJhd1NvdXJjZS5zcGxpdChcIiNcIilbMF0/LnNwbGl0KFwifFwiKVswXT8udHJpbSgpID8/IFwiXCI7XG4gICAgICBpZiAoIWxpbmtQYXRoLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoYC4ke01JTkRNQVBfRVhURU5TSU9OfWApKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KGxpbmtQYXRoLCBjb250ZXh0LnNvdXJjZVBhdGgpO1xuICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB8fCAhdGhpcy5pc01pbmRNYXBGaWxlKGZpbGUpKSBjb250aW51ZTtcbiAgICAgIGVtYmVkLmRhdGFzZXQubW1jUHJvY2Vzc2VkID0gXCJ0cnVlXCI7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jYWNoZWRSZWFkKGZpbGUpO1xuICAgICAgICBjb25zdCBkb2N1bWVudCA9IHBhcnNlRG9jdW1lbnQoc291cmNlLCBmaWxlLmJhc2VuYW1lKTtcbiAgICAgICAgcmVuZGVyU3RhdGljTWluZE1hcChlbWJlZCwgZG9jdW1lbnQsIHsgYXBwOiB0aGlzLmFwcCwgZmlsZSwgbWF4SGVpZ2h0OiB0aGlzLnNldHRpbmdzLmVtYmVkTWF4SGVpZ2h0LCBkZWZhdWx0QXBwZWFyYW5jZTogc2V0dGluZ3NUb0FwcGVhcmFuY2UodGhpcy5zZXR0aW5ncykgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTWluZE1hcCBTdHVkaW8gZW1iZWQgcmVuZGVyIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIGVtYmVkLmVtcHR5KCk7XG4gICAgICAgIGVtYmVkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZW1iZWQtZXJyb3JcIiwgdGV4dDogXCJcdTY1RTBcdTZDRDVcdTUyQTBcdThGN0RcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcdTk4ODRcdTg5QzhcIiB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsICJleHBvcnQgdHlwZSBMYXlvdXRNb2RlID0gXCJyaWdodFwiIHwgXCJiYWxhbmNlZFwiO1xuZXhwb3J0IHR5cGUgVGhlbWVNb2RlID0gXCJhdXRvXCIgfCBcImxpZ2h0XCIgfCBcImRhcmtcIjtcbmV4cG9ydCB0eXBlIE5vZGVTaGFwZSA9IFwicm91bmRlZFwiIHwgXCJwaWxsXCIgfCBcInJlY3RhbmdsZVwiO1xuZXhwb3J0IHR5cGUgVGFza1N0YXR1cyA9IFwidG9kb1wiIHwgXCJkb2luZ1wiIHwgXCJkb25lXCI7XG5leHBvcnQgdHlwZSBCYWNrZ3JvdW5kUGF0dGVybiA9IFwibm9uZVwiIHwgXCJncmlkXCIgfCBcImRvdHNcIjtcbmV4cG9ydCB0eXBlIEVkZ2VTdHlsZSA9IFwiY3VydmVkXCIgfCBcInN0cmFpZ2h0XCIgfCBcImVsYm93XCI7XG5leHBvcnQgdHlwZSBFZGdlV2lkdGhNb2RlID0gXCJ1bmlmb3JtXCIgfCBcInRhcGVyZWRcIjtcbmV4cG9ydCB0eXBlIE1pbmRNYXBUaGVtZVByZXNldElkID1cbiAgfCBcImNsYXNzaWMtaW5kaWdvXCJcbiAgfCBcIm9jZWFuLWJsdWVcIlxuICB8IFwiZm9yZXN0LWdyZWVuXCJcbiAgfCBcInN1bnNldC1vcmFuZ2VcIlxuICB8IFwibGF2ZW5kZXItZHJlYW1cIlxuICB8IFwiY2FuZHktcG9wXCJcbiAgfCBcInBhcGVyLW5vdGVcIlxuICB8IFwibWluaW1hbC1pbmtcIlxuICB8IFwiZGFyay1uZW9uXCJcbiAgfCBcIm1pbnQtY2xlYW5cIjtcbmV4cG9ydCB0eXBlIEZvbnRGYW1pbHlNb2RlID0gXCJvYnNpZGlhblwiIHwgXCJzYW5zXCIgfCBcInNlcmlmXCIgfCBcIm1vbm9cIiB8IFwiY3VzdG9tXCI7XG5leHBvcnQgdHlwZSBUYWJsZUFsaWdubWVudCA9IFwibGVmdFwiIHwgXCJjZW50ZXJcIiB8IFwicmlnaHRcIjtcblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwVGV4dFN0eWxlIHtcbiAgYm9sZD86IGJvb2xlYW47XG4gIGl0YWxpYz86IGJvb2xlYW47XG4gIHVuZGVybGluZT86IGJvb2xlYW47XG4gIHN0cmlrZT86IGJvb2xlYW47XG4gIGNvbG9yPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBUZXh0UnVuIHtcbiAgdGV4dDogc3RyaW5nO1xuICBzdHlsZT86IE1pbmRNYXBUZXh0U3R5bGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFRhYmxlIHtcbiAgaGVhZGVyczogc3RyaW5nW107XG4gIHJvd3M6IHN0cmluZ1tdW107XG4gIGFsaWdubWVudHM/OiBUYWJsZUFsaWdubWVudFtdO1xuICBzb3VyY2U/OiBcIm1hbnVhbFwiIHwgXCJtYXJrZG93blwiIHwgXCJjaGlsZHJlblwiO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBDb2RlQmxvY2sge1xuICBsYW5ndWFnZT86IHN0cmluZztcbiAgY29kZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrIHtcbiAgaWQ6IHN0cmluZztcbiAgdHlwZTogXCJ0ZXh0XCI7XG4gIHRleHQ6IHN0cmluZztcbiAgcmljaFRleHQ/OiBNaW5kTWFwVGV4dFJ1bltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBJbWFnZVJlbW90ZVNvdXJjZSB7XG4gIGhvc3RJZDogc3RyaW5nO1xuICBob3N0TmFtZT86IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIHVwbG9hZGVkQXQ/OiBzdHJpbmc7XG4gIGxhc3RTdWNjZXNzQXQ/OiBzdHJpbmc7XG4gIGxhc3RGYWlsdXJlQXQ/OiBzdHJpbmc7XG4gIGZhaWx1cmVDb3VudD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwSW1hZ2VTb3VyY2VDYW5kaWRhdGUge1xuICBzb3VyY2U6IHN0cmluZztcbiAgbGFiZWw6IHN0cmluZztcbiAgaG9zdElkPzogc3RyaW5nO1xuICBob3N0TmFtZT86IHN0cmluZztcbiAga2luZDogXCJjdXJyZW50XCIgfCBcInJlbW90ZVwiIHwgXCJsb2NhbFwiO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayB7XG4gIGlkOiBzdHJpbmc7XG4gIHR5cGU6IFwiaW1hZ2VcIjtcbiAgc291cmNlOiBzdHJpbmc7XG4gIGFsdD86IHN0cmluZztcbiAgLyoqIE9yaWdpbmFsIGxvY2FsIHZhdWx0IHBhdGggcmV0YWluZWQgdW50aWwgZXZlcnkgc2VsZWN0ZWQgaW1hZ2UgaG9zdCBzdWNjZWVkcy4gKi9cbiAgbG9jYWxTb3VyY2U/OiBzdHJpbmc7XG4gIC8qKiBNaXJyb3IgVVJMcyByZXR1cm5lZCBieSBvbmUgb3IgbW9yZSBjb25maWd1cmVkIGltYWdlIGhvc3RzLiAqL1xuICByZW1vdGVTb3VyY2VzPzogTWluZE1hcEltYWdlUmVtb3RlU291cmNlW107XG59XG5cbmV4cG9ydCB0eXBlIE1pbmRNYXBDb250ZW50QmxvY2sgPSBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayB8IE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jaztcblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwU3VibWFwIHtcbiAgcGF0aDogc3RyaW5nO1xuICB0aXRsZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwTmF2aWdhdGlvbiB7XG4gIHBhcmVudFBhdGg6IHN0cmluZztcbiAgcGFyZW50Tm9kZUlkPzogc3RyaW5nO1xuICBwYXJlbnRUaXRsZT86IHN0cmluZztcbiAgcGFyZW50Tm9kZVRleHQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEFwcGVhcmFuY2Uge1xuICB0aGVtZVByZXNldD86IE1pbmRNYXBUaGVtZVByZXNldElkO1xuICBiYWNrZ3JvdW5kQ29sb3I/OiBzdHJpbmc7XG4gIGJhY2tncm91bmRQYXR0ZXJuPzogQmFja2dyb3VuZFBhdHRlcm47XG4gIHBhdHRlcm5Db2xvcj86IHN0cmluZztcbiAgZm9udEZhbWlseT86IEZvbnRGYW1pbHlNb2RlO1xuICBjdXN0b21Gb250Pzogc3RyaW5nO1xuICBmb250U2l6ZT86IG51bWJlcjtcbiAgZWRnZUNvbG9yPzogc3RyaW5nO1xuICBlZGdlV2lkdGg/OiBudW1iZXI7XG4gIGVkZ2VTdHlsZT86IEVkZ2VTdHlsZTtcbiAgZWRnZVdpZHRoTW9kZT86IEVkZ2VXaWR0aE1vZGU7XG4gIGVkZ2VNaW5XaWR0aD86IG51bWJlcjtcbiAgcm9vdENvbG9yPzogc3RyaW5nO1xuICByb290VGV4dENvbG9yPzogc3RyaW5nO1xuICBjb2xvcmZ1bEJyYW5jaGVzPzogYm9vbGVhbjtcbiAgYnJhbmNoQ29sb3JzPzogc3RyaW5nW107XG4gIG5vZGVDb2xvcj86IHN0cmluZztcbiAgdGV4dENvbG9yPzogc3RyaW5nO1xuICBub2RlQm9yZGVyQ29sb3I/OiBzdHJpbmc7XG4gIG5vZGVCb3JkZXJXaWR0aD86IG51bWJlcjtcbiAgYm9sZD86IGJvb2xlYW47XG4gIGl0YWxpYz86IGJvb2xlYW47XG4gIHVuZGVybGluZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcE5vZGVTdHlsZSB7XG4gIGNvbG9yPzogc3RyaW5nO1xuICB0ZXh0Q29sb3I/OiBzdHJpbmc7XG4gIGJvcmRlckNvbG9yPzogc3RyaW5nO1xuICBib3JkZXJXaWR0aD86IG51bWJlcjtcbiAgc2hhcGU/OiBOb2RlU2hhcGU7XG4gIGJvbGQ/OiBib29sZWFuO1xuICBpdGFsaWM/OiBib29sZWFuO1xuICB1bmRlcmxpbmU/OiBib29sZWFuO1xuICBmb250U2l6ZT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwTm9kZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgcmljaFRleHQ/OiBNaW5kTWFwVGV4dFJ1bltdO1xuICAvKiogT3JkZXJlZCB0ZXh0IGFuZCBpbWFnZSBibG9ja3MuIExlZ2FjeSB0ZXh0L3JpY2hUZXh0L2ltYWdlIGZpZWxkcyByZW1haW4gZm9yIGNvbXBhdGliaWxpdHkuICovXG4gIGNvbnRlbnQ/OiBNaW5kTWFwQ29udGVudEJsb2NrW107XG4gIG5vdGU/OiBzdHJpbmc7XG4gIGxpbms/OiBzdHJpbmc7XG4gIGltYWdlPzogc3RyaW5nO1xuICB0YWJsZT86IE1pbmRNYXBUYWJsZTtcbiAgY29kZT86IE1pbmRNYXBDb2RlQmxvY2s7XG4gIHN1Ym1hcD86IE1pbmRNYXBTdWJtYXA7XG4gIGljb24/OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbiAgdGFzaz86IFRhc2tTdGF0dXM7XG4gIHN0eWxlPzogTWluZE1hcE5vZGVTdHlsZTtcbiAgY29sbGFwc2VkPzogYm9vbGVhbjtcbiAgY2hpbGRyZW46IE1pbmRNYXBOb2RlW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcERvY3VtZW50IHtcbiAgdmVyc2lvbjogOTtcbiAgdGl0bGU6IHN0cmluZztcbiAgbGF5b3V0OiBMYXlvdXRNb2RlO1xuICB0aGVtZTogVGhlbWVNb2RlO1xuICBhcHBlYXJhbmNlPzogTWluZE1hcEFwcGVhcmFuY2U7XG4gIG5hdmlnYXRpb24/OiBNaW5kTWFwTmF2aWdhdGlvbjtcbiAgcm9vdDogTWluZE1hcE5vZGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFza1Byb2dyZXNzIHtcbiAgZG9uZTogbnVtYmVyO1xuICB0b3RhbDogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgTUlORE1BUF9DT0RFX0JMT0NLID0gXCJtaW5kbWFwLWpzb25cIjtcbmNvbnN0IExFR0FDWV9DT0RFX0JMT0NLUyA9IFtcInNtbS1qc29uXCIsIFwibW1jLWpzb25cIl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXdJZCgpOiBzdHJpbmcge1xuICBjb25zdCByYW5kb20gPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA5KTtcbiAgcmV0dXJuIGBuXyR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9XyR7cmFuZG9tfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlKHRleHQgPSBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiKTogTWluZE1hcE5vZGUge1xuICByZXR1cm4geyBpZDogbmV3SWQoKSwgdGV4dCwgY2hpbGRyZW46IFtdIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEZWZhdWx0RG9jdW1lbnQodGl0bGUgPSBcIlx1NjVCMFx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTogTWluZE1hcERvY3VtZW50IHtcbiAgcmV0dXJuIHtcbiAgICB2ZXJzaW9uOiA5LFxuICAgIHRpdGxlLFxuICAgIGxheW91dDogXCJyaWdodFwiLFxuICAgIHRoZW1lOiBcImF1dG9cIixcbiAgICByb290OiB7XG4gICAgICBpZDogbmV3SWQoKSxcbiAgICAgIHRleHQ6IHRpdGxlLFxuICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgeyBpZDogbmV3SWQoKSwgdGV4dDogXCJcdTRFM0JcdTk4OTggMVwiLCBjaGlsZHJlbjogW10gfSxcbiAgICAgICAgeyBpZDogbmV3SWQoKSwgdGV4dDogXCJcdTRFM0JcdTk4OTggMlwiLCBjaGlsZHJlbjogW10gfVxuICAgICAgXVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQ29sb3IodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCB0cmltbWVkID0gdmFsdWUudHJpbSgpO1xuICByZXR1cm4gL14jWzAtOWEtZl17Nn0kL2kudGVzdCh0cmltbWVkKSA/IHRyaW1tZWQgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU51bWJlcih2YWx1ZTogdW5rbm93biwgbWluOiBudW1iZXIsIG1heDogbnVtYmVyKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIiB8fCAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUodmFsdWU6IHVua25vd24pOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQXBwZWFyYW5jZShpbnB1dDogUGFydGlhbDxNaW5kTWFwQXBwZWFyYW5jZT4gfCB1bmRlZmluZWQpOiBNaW5kTWFwQXBwZWFyYW5jZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IGJhY2tncm91bmRQYXR0ZXJuOiBCYWNrZ3JvdW5kUGF0dGVybiB8IHVuZGVmaW5lZCA9IGlucHV0LmJhY2tncm91bmRQYXR0ZXJuID09PSBcIm5vbmVcIiB8fCBpbnB1dC5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJncmlkXCIgfHwgaW5wdXQuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwiZG90c1wiXG4gICAgPyBpbnB1dC5iYWNrZ3JvdW5kUGF0dGVyblxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBmb250RmFtaWx5OiBGb250RmFtaWx5TW9kZSB8IHVuZGVmaW5lZCA9IGlucHV0LmZvbnRGYW1pbHkgPT09IFwib2JzaWRpYW5cIiB8fCBpbnB1dC5mb250RmFtaWx5ID09PSBcInNhbnNcIiB8fCBpbnB1dC5mb250RmFtaWx5ID09PSBcInNlcmlmXCIgfHwgaW5wdXQuZm9udEZhbWlseSA9PT0gXCJtb25vXCIgfHwgaW5wdXQuZm9udEZhbWlseSA9PT0gXCJjdXN0b21cIlxuICAgID8gaW5wdXQuZm9udEZhbWlseVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBlZGdlU3R5bGU6IEVkZ2VTdHlsZSB8IHVuZGVmaW5lZCA9IGlucHV0LmVkZ2VTdHlsZSA9PT0gXCJjdXJ2ZWRcIiB8fCBpbnB1dC5lZGdlU3R5bGUgPT09IFwic3RyYWlnaHRcIiB8fCBpbnB1dC5lZGdlU3R5bGUgPT09IFwiZWxib3dcIlxuICAgID8gaW5wdXQuZWRnZVN0eWxlXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGVkZ2VXaWR0aE1vZGU6IEVkZ2VXaWR0aE1vZGUgfCB1bmRlZmluZWQgPSBpbnB1dC5lZGdlV2lkdGhNb2RlID09PSBcInVuaWZvcm1cIiB8fCBpbnB1dC5lZGdlV2lkdGhNb2RlID09PSBcInRhcGVyZWRcIlxuICAgID8gaW5wdXQuZWRnZVdpZHRoTW9kZVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCB0aGVtZVByZXNldDogTWluZE1hcFRoZW1lUHJlc2V0SWQgfCB1bmRlZmluZWQgPSBbXG4gICAgXCJjbGFzc2ljLWluZGlnb1wiLCBcIm9jZWFuLWJsdWVcIiwgXCJmb3Jlc3QtZ3JlZW5cIiwgXCJzdW5zZXQtb3JhbmdlXCIsIFwibGF2ZW5kZXItZHJlYW1cIixcbiAgICBcImNhbmR5LXBvcFwiLCBcInBhcGVyLW5vdGVcIiwgXCJtaW5pbWFsLWlua1wiLCBcImRhcmstbmVvblwiLCBcIm1pbnQtY2xlYW5cIlxuICBdLmluY2x1ZGVzKFN0cmluZyhpbnB1dC50aGVtZVByZXNldCkpID8gaW5wdXQudGhlbWVQcmVzZXQgYXMgTWluZE1hcFRoZW1lUHJlc2V0SWQgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGJyYW5jaENvbG9ycyA9IEFycmF5LmlzQXJyYXkoaW5wdXQuYnJhbmNoQ29sb3JzKVxuICAgID8gaW5wdXQuYnJhbmNoQ29sb3JzLm1hcChub3JtYWxpemVDb2xvcikuZmlsdGVyKChjb2xvcik6IGNvbG9yIGlzIHN0cmluZyA9PiBCb29sZWFuKGNvbG9yKSkuc2xpY2UoMCwgMTIpXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGN1c3RvbUZvbnQgPSB0eXBlb2YgaW5wdXQuY3VzdG9tRm9udCA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5jdXN0b21Gb250LnRyaW0oKVxuICAgID8gaW5wdXQuY3VzdG9tRm9udC50cmltKCkuc2xpY2UoMCwgMTIwKVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSA9IHtcbiAgICB0aGVtZVByZXNldCxcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LmJhY2tncm91bmRDb2xvciksXG4gICAgYmFja2dyb3VuZFBhdHRlcm4sXG4gICAgcGF0dGVybkNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5wYXR0ZXJuQ29sb3IpLFxuICAgIGZvbnRGYW1pbHksXG4gICAgY3VzdG9tRm9udCxcbiAgICBmb250U2l6ZTogbm9ybWFsaXplTnVtYmVyKGlucHV0LmZvbnRTaXplLCAxMCwgMzApLFxuICAgIGVkZ2VDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuZWRnZUNvbG9yKSxcbiAgICBlZGdlV2lkdGg6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5lZGdlV2lkdGgsIDAuNSwgOCksXG4gICAgZWRnZVN0eWxlLFxuICAgIGVkZ2VXaWR0aE1vZGUsXG4gICAgZWRnZU1pbldpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQuZWRnZU1pbldpZHRoLCAwLjI1LCA4KSxcbiAgICByb290Q29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LnJvb3RDb2xvciksXG4gICAgcm9vdFRleHRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQucm9vdFRleHRDb2xvciksXG4gICAgY29sb3JmdWxCcmFuY2hlczogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LmNvbG9yZnVsQnJhbmNoZXMpLFxuICAgIGJyYW5jaENvbG9yczogYnJhbmNoQ29sb3JzPy5sZW5ndGggPyBicmFuY2hDb2xvcnMgOiB1bmRlZmluZWQsXG4gICAgbm9kZUNvbG9yOiBub3JtYWxpemVDb2xvcihpbnB1dC5ub2RlQ29sb3IpLFxuICAgIHRleHRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQudGV4dENvbG9yKSxcbiAgICBub2RlQm9yZGVyQ29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0Lm5vZGVCb3JkZXJDb2xvciksXG4gICAgbm9kZUJvcmRlcldpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQubm9kZUJvcmRlcldpZHRoLCAwLCA2KSxcbiAgICBib2xkOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuYm9sZCksXG4gICAgaXRhbGljOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuaXRhbGljKSxcbiAgICB1bmRlcmxpbmU6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC51bmRlcmxpbmUpXG4gIH07XG4gIHJldHVybiBPYmplY3QudmFsdWVzKGFwcGVhcmFuY2UpLnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IGFwcGVhcmFuY2UgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUFwcGVhcmFuY2UoYmFzZTogTWluZE1hcEFwcGVhcmFuY2UgfCB1bmRlZmluZWQsIG92ZXJyaWRlOiBNaW5kTWFwQXBwZWFyYW5jZSB8IHVuZGVmaW5lZCk6IE1pbmRNYXBBcHBlYXJhbmNlIHtcbiAgcmV0dXJuIHsgLi4uKGJhc2UgPz8ge30pLCAuLi4ob3ZlcnJpZGUgPz8ge30pIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0eWxlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOb2RlU3R5bGU+IHwgdW5kZWZpbmVkKTogTWluZE1hcE5vZGVTdHlsZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHNoYXBlOiBOb2RlU2hhcGUgfCB1bmRlZmluZWQgPSBpbnB1dC5zaGFwZSA9PT0gXCJwaWxsXCIgfHwgaW5wdXQuc2hhcGUgPT09IFwicmVjdGFuZ2xlXCIgfHwgaW5wdXQuc2hhcGUgPT09IFwicm91bmRlZFwiXG4gICAgPyBpbnB1dC5zaGFwZVxuICAgIDogdW5kZWZpbmVkO1xuICBjb25zdCBzdHlsZTogTWluZE1hcE5vZGVTdHlsZSA9IHtcbiAgICBjb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuY29sb3IpLFxuICAgIHRleHRDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQudGV4dENvbG9yKSxcbiAgICBib3JkZXJDb2xvcjogbm9ybWFsaXplQ29sb3IoaW5wdXQuYm9yZGVyQ29sb3IpLFxuICAgIGJvcmRlcldpZHRoOiBub3JtYWxpemVOdW1iZXIoaW5wdXQuYm9yZGVyV2lkdGgsIDAsIDYpLFxuICAgIHNoYXBlLFxuICAgIGJvbGQ6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5ib2xkKSxcbiAgICBpdGFsaWM6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC5pdGFsaWMpLFxuICAgIHVuZGVybGluZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnVuZGVybGluZSksXG4gICAgZm9udFNpemU6IG5vcm1hbGl6ZU51bWJlcihpbnB1dC5mb250U2l6ZSwgMTAsIDMyKVxuICB9O1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhzdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gc3R5bGUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRleHRTdHlsZShpbnB1dDogUGFydGlhbDxNaW5kTWFwVGV4dFN0eWxlPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBUZXh0U3R5bGUgfCB1bmRlZmluZWQge1xuICBpZiAoIWlucHV0KSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBzdHlsZTogTWluZE1hcFRleHRTdHlsZSA9IHtcbiAgICBib2xkOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuYm9sZCksXG4gICAgaXRhbGljOiBub3JtYWxpemVCb29sZWFuT3ZlcnJpZGUoaW5wdXQuaXRhbGljKSxcbiAgICB1bmRlcmxpbmU6IG5vcm1hbGl6ZUJvb2xlYW5PdmVycmlkZShpbnB1dC51bmRlcmxpbmUpLFxuICAgIHN0cmlrZTogbm9ybWFsaXplQm9vbGVhbk92ZXJyaWRlKGlucHV0LnN0cmlrZSksXG4gICAgY29sb3I6IG5vcm1hbGl6ZUNvbG9yKGlucHV0LmNvbG9yKVxuICB9O1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyhzdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpID8gc3R5bGUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIHRleHRTdHlsZUtleShzdHlsZTogTWluZE1hcFRleHRTdHlsZSB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShzdHlsZSA/PyB7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVSaWNoVGV4dChpbnB1dDogdW5rbm93biwgZmFsbGJhY2tUZXh0ID0gXCJcIik6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCBydW5zOiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gIGZvciAoY29uc3QgcmF3IG9mIGlucHV0LnNsaWNlKDAsIDUwMCkpIHtcbiAgICBpZiAoIXJhdyB8fCB0eXBlb2YgcmF3ICE9PSBcIm9iamVjdFwiKSBjb250aW51ZTtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSByYXcgYXMgUGFydGlhbDxNaW5kTWFwVGV4dFJ1bj47XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUudGV4dCAhPT0gXCJzdHJpbmdcIiB8fCAhY2FuZGlkYXRlLnRleHQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHRleHQgPSBjYW5kaWRhdGUudGV4dC5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKS5zbGljZSgwLCAxMDAwMCk7XG4gICAgaWYgKCF0ZXh0KSBjb250aW51ZTtcbiAgICBjb25zdCBzdHlsZSA9IG5vcm1hbGl6ZVRleHRTdHlsZShjYW5kaWRhdGUuc3R5bGUpO1xuICAgIGNvbnN0IHByZXZpb3VzID0gcnVucy5hdCgtMSk7XG4gICAgaWYgKHByZXZpb3VzICYmIHRleHRTdHlsZUtleShwcmV2aW91cy5zdHlsZSkgPT09IHRleHRTdHlsZUtleShzdHlsZSkpIHByZXZpb3VzLnRleHQgKz0gdGV4dDtcbiAgICBlbHNlIHJ1bnMucHVzaCh7IHRleHQsIHN0eWxlIH0pO1xuICB9XG4gIGlmICghcnVucy5sZW5ndGgpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgY29uc3QgY29tYmluZWQgPSBydW5zLm1hcCgocnVuKSA9PiBydW4udGV4dCkuam9pbihcIlwiKTtcbiAgY29uc3QgbGVhZGluZyA9IGNvbWJpbmVkLmxlbmd0aCAtIGNvbWJpbmVkLnRyaW1TdGFydCgpLmxlbmd0aDtcbiAgY29uc3QgdHJhaWxpbmcgPSBjb21iaW5lZC5sZW5ndGggLSBjb21iaW5lZC50cmltRW5kKCkubGVuZ3RoO1xuICBpZiAobGVhZGluZyB8fCB0cmFpbGluZykge1xuICAgIGxldCBzdGFydCA9IGxlYWRpbmc7XG4gICAgbGV0IHJlbWFpbmluZyA9IGNvbWJpbmVkLmxlbmd0aCAtIGxlYWRpbmcgLSB0cmFpbGluZztcbiAgICBjb25zdCB0cmltbWVkOiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gICAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSBicmVhaztcbiAgICAgIGNvbnN0IHNraXAgPSBNYXRoLm1pbihzdGFydCwgcnVuLnRleHQubGVuZ3RoKTtcbiAgICAgIHN0YXJ0IC09IHNraXA7XG4gICAgICBjb25zdCBhdmFpbGFibGUgPSBydW4udGV4dC5sZW5ndGggLSBza2lwO1xuICAgICAgaWYgKGF2YWlsYWJsZSA8PSAwKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHRha2UgPSBNYXRoLm1pbihhdmFpbGFibGUsIHJlbWFpbmluZyk7XG4gICAgICBjb25zdCB0ZXh0ID0gcnVuLnRleHQuc2xpY2Uoc2tpcCwgc2tpcCArIHRha2UpO1xuICAgICAgcmVtYWluaW5nIC09IHRha2U7XG4gICAgICBpZiAodGV4dCkgdHJpbW1lZC5wdXNoKHsgdGV4dCwgc3R5bGU6IHJ1bi5zdHlsZSB9KTtcbiAgICB9XG4gICAgcnVucy5zcGxpY2UoMCwgcnVucy5sZW5ndGgsIC4uLnRyaW1tZWQpO1xuICB9XG5cbiAgaWYgKCFydW5zLmxlbmd0aCkgcmV0dXJuIGZhbGxiYWNrVGV4dC50cmltKCkgPyBbeyB0ZXh0OiBmYWxsYmFja1RleHQudHJpbSgpIH1dIDogdW5kZWZpbmVkO1xuICByZXR1cm4gcnVucy5zb21lKChydW4pID0+IHJ1bi5zdHlsZSAmJiBPYmplY3QudmFsdWVzKHJ1bi5zdHlsZSkuc29tZSgodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQpKSA/IHJ1bnMgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByaWNoVGV4dFBsYWluVGV4dChydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQgPSBcIlwiKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bnM/Lm1hcCgocnVuKSA9PiBydW4udGV4dCkuam9pbihcIlwiKSA/PyBmYWxsYmFja1RleHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLCBmYWxsYmFja1RleHQgPSBcIlwiKTogTWluZE1hcFRleHRTdHlsZVtdIHtcbiAgY29uc3QgdGV4dCA9IHJpY2hUZXh0UGxhaW5UZXh0KHJ1bnMsIGZhbGxiYWNrVGV4dCk7XG4gIGNvbnN0IHN0eWxlczogTWluZE1hcFRleHRTdHlsZVtdID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogdGV4dC5sZW5ndGggfSwgKCkgPT4gKHt9KSk7XG4gIGlmICghcnVucz8ubGVuZ3RoKSByZXR1cm4gc3R5bGVzO1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgIGNvbnN0IHN0eWxlID0gcnVuLnN0eWxlID8geyAuLi5ydW4uc3R5bGUgfSA6IHt9O1xuICAgIGNvbnN0IGVuZCA9IE1hdGgubWluKHRleHQubGVuZ3RoLCBvZmZzZXQgKyBydW4udGV4dC5sZW5ndGgpO1xuICAgIGZvciAobGV0IGluZGV4ID0gb2Zmc2V0OyBpbmRleCA8IGVuZDsgaW5kZXggKz0gMSkgc3R5bGVzW2luZGV4XSA9IHsgLi4uc3R5bGUgfTtcbiAgICBvZmZzZXQgPSBlbmQ7XG4gIH1cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYXJhY3RlclN0eWxlc1RvUmljaFRleHQodGV4dDogc3RyaW5nLCBzdHlsZXM6IE1pbmRNYXBUZXh0U3R5bGVbXSk6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQge1xuICBpZiAoIXRleHQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gPSBbXTtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGN1cnJlbnQgPSBub3JtYWxpemVUZXh0U3R5bGUoc3R5bGVzWzBdKTtcbiAgZm9yIChsZXQgaW5kZXggPSAxOyBpbmRleCA8PSB0ZXh0Lmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IG5leHQgPSBpbmRleCA8IHRleHQubGVuZ3RoID8gbm9ybWFsaXplVGV4dFN0eWxlKHN0eWxlc1tpbmRleF0pIDogdW5kZWZpbmVkO1xuICAgIGlmIChpbmRleCA8IHRleHQubGVuZ3RoICYmIHRleHRTdHlsZUtleShjdXJyZW50KSA9PT0gdGV4dFN0eWxlS2V5KG5leHQpKSBjb250aW51ZTtcbiAgICBjb25zdCBzZWdtZW50ID0gdGV4dC5zbGljZShzdGFydCwgaW5kZXgpO1xuICAgIGlmIChzZWdtZW50KSBydW5zLnB1c2goeyB0ZXh0OiBzZWdtZW50LCBzdHlsZTogY3VycmVudCB9KTtcbiAgICBzdGFydCA9IGluZGV4O1xuICAgIGN1cnJlbnQgPSBuZXh0O1xuICB9XG4gIHJldHVybiBub3JtYWxpemVSaWNoVGV4dChydW5zLCB0ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlY29uY2lsZVJpY2hUZXh0QWZ0ZXJFZGl0KFxuICBwcmV2aW91c1RleHQ6IHN0cmluZyxcbiAgcHJldmlvdXNSdW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLFxuICBuZXh0VGV4dDogc3RyaW5nXG4pOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHByZXZpb3VzVGV4dCA9PT0gbmV4dFRleHQpIHJldHVybiBub3JtYWxpemVSaWNoVGV4dChwcmV2aW91c1J1bnMsIG5leHRUZXh0KTtcbiAgY29uc3QgcHJldmlvdXNTdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhwcmV2aW91c1J1bnMsIHByZXZpb3VzVGV4dCk7XG4gIGNvbnN0IG5leHRTdHlsZXM6IE1pbmRNYXBUZXh0U3R5bGVbXSA9IEFycmF5LmZyb20oeyBsZW5ndGg6IG5leHRUZXh0Lmxlbmd0aCB9LCAoKSA9PiAoe30pKTtcbiAgbGV0IHByZWZpeCA9IDA7XG4gIHdoaWxlIChwcmVmaXggPCBwcmV2aW91c1RleHQubGVuZ3RoICYmIHByZWZpeCA8IG5leHRUZXh0Lmxlbmd0aCAmJiBwcmV2aW91c1RleHRbcHJlZml4XSA9PT0gbmV4dFRleHRbcHJlZml4XSkgcHJlZml4ICs9IDE7XG4gIGxldCBzdWZmaXggPSAwO1xuICB3aGlsZSAoXG4gICAgc3VmZml4IDwgcHJldmlvdXNUZXh0Lmxlbmd0aCAtIHByZWZpeFxuICAgICYmIHN1ZmZpeCA8IG5leHRUZXh0Lmxlbmd0aCAtIHByZWZpeFxuICAgICYmIHByZXZpb3VzVGV4dFtwcmV2aW91c1RleHQubGVuZ3RoIC0gMSAtIHN1ZmZpeF0gPT09IG5leHRUZXh0W25leHRUZXh0Lmxlbmd0aCAtIDEgLSBzdWZmaXhdXG4gICkgc3VmZml4ICs9IDE7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcmVmaXg7IGluZGV4ICs9IDEpIG5leHRTdHlsZXNbaW5kZXhdID0geyAuLi4ocHJldmlvdXNTdHlsZXNbaW5kZXhdID8/IHt9KSB9O1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgc3VmZml4OyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgcHJldmlvdXNJbmRleCA9IHByZXZpb3VzVGV4dC5sZW5ndGggLSBzdWZmaXggKyBpbmRleDtcbiAgICBjb25zdCBuZXh0SW5kZXggPSBuZXh0VGV4dC5sZW5ndGggLSBzdWZmaXggKyBpbmRleDtcbiAgICBuZXh0U3R5bGVzW25leHRJbmRleF0gPSB7IC4uLihwcmV2aW91c1N0eWxlc1twcmV2aW91c0luZGV4XSA/PyB7fSkgfTtcbiAgfVxuICByZXR1cm4gY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dChuZXh0VGV4dCwgbmV4dFN0eWxlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShcbiAgdGV4dDogc3RyaW5nLFxuICBydW5zOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkLFxuICBzdGFydDogbnVtYmVyLFxuICBlbmQ6IG51bWJlcixcbiAgcGF0Y2g6IFBhcnRpYWw8TWluZE1hcFRleHRTdHlsZT4gfCBudWxsXG4pOiBNaW5kTWFwVGV4dFJ1bltdIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qgc2FmZVN0YXJ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4odGV4dC5sZW5ndGgsIE1hdGguZmxvb3Ioc3RhcnQpKSk7XG4gIGNvbnN0IHNhZmVFbmQgPSBNYXRoLm1heChzYWZlU3RhcnQsIE1hdGgubWluKHRleHQubGVuZ3RoLCBNYXRoLmZsb29yKGVuZCkpKTtcbiAgaWYgKHNhZmVTdGFydCA9PT0gc2FmZUVuZCkgcmV0dXJuIG5vcm1hbGl6ZVJpY2hUZXh0KHJ1bnMsIHRleHQpO1xuICBjb25zdCBzdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhydW5zLCB0ZXh0KTtcbiAgZm9yIChsZXQgaW5kZXggPSBzYWZlU3RhcnQ7IGluZGV4IDwgc2FmZUVuZDsgaW5kZXggKz0gMSkge1xuICAgIGlmIChwYXRjaCA9PT0gbnVsbCkgc3R5bGVzW2luZGV4XSA9IHt9O1xuICAgIGVsc2Ugc3R5bGVzW2luZGV4XSA9IHsgLi4uc3R5bGVzW2luZGV4XSwgLi4ucGF0Y2ggfTtcbiAgfVxuICByZXR1cm4gY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dCh0ZXh0LCBzdHlsZXMpO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbnRlbnRCbG9jayhpbnB1dDogdW5rbm93bik6IE1pbmRNYXBDb250ZW50QmxvY2sgfCBudWxsIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQgIT09IFwib2JqZWN0XCIpIHJldHVybiBudWxsO1xuICBjb25zdCBjYW5kaWRhdGUgPSBpbnB1dCBhcyBQYXJ0aWFsPE1pbmRNYXBDb250ZW50QmxvY2s+O1xuICBjb25zdCBpZCA9IHR5cGVvZiBjYW5kaWRhdGUuaWQgPT09IFwic3RyaW5nXCIgJiYgY2FuZGlkYXRlLmlkLnRyaW0oKSA/IGNhbmRpZGF0ZS5pZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IG5ld0lkKCk7XG4gIGlmIChjYW5kaWRhdGUudHlwZSA9PT0gXCJpbWFnZVwiKSB7XG4gICAgY29uc3QgaW1hZ2UgPSBjYW5kaWRhdGUgYXMgUGFydGlhbDxNaW5kTWFwSW1hZ2VDb250ZW50QmxvY2s+O1xuICAgIGNvbnN0IHNvdXJjZSA9IHR5cGVvZiBpbWFnZS5zb3VyY2UgPT09IFwic3RyaW5nXCIgPyBpbWFnZS5zb3VyY2UudHJpbSgpLnNsaWNlKDAsIDIwMDApIDogXCJcIjtcbiAgICBpZiAoIXNvdXJjZSkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgYWx0ID0gdHlwZW9mIGltYWdlLmFsdCA9PT0gXCJzdHJpbmdcIiAmJiBpbWFnZS5hbHQudHJpbSgpID8gaW1hZ2UuYWx0LnRyaW0oKS5zbGljZSgwLCA1MDApIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGxvY2FsU291cmNlID0gdHlwZW9mIGltYWdlLmxvY2FsU291cmNlID09PSBcInN0cmluZ1wiICYmIGltYWdlLmxvY2FsU291cmNlLnRyaW0oKVxuICAgICAgPyBpbWFnZS5sb2NhbFNvdXJjZS50cmltKCkuc2xpY2UoMCwgMjAwMClcbiAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHJlbW90ZVNvdXJjZXMgPSBBcnJheS5pc0FycmF5KGltYWdlLnJlbW90ZVNvdXJjZXMpXG4gICAgICA/IGltYWdlLnJlbW90ZVNvdXJjZXMuc2xpY2UoMCwgMTIpLmZsYXRNYXAoKHJhdykgPT4ge1xuICAgICAgICBpZiAoIXJhdyB8fCB0eXBlb2YgcmF3ICE9PSBcIm9iamVjdFwiKSByZXR1cm4gW107XG4gICAgICAgIGNvbnN0IGl0ZW0gPSByYXcgYXMgUGFydGlhbDxNaW5kTWFwSW1hZ2VSZW1vdGVTb3VyY2U+O1xuICAgICAgICBjb25zdCBob3N0SWQgPSB0eXBlb2YgaXRlbS5ob3N0SWQgPT09IFwic3RyaW5nXCIgPyBpdGVtLmhvc3RJZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IFwiXCI7XG4gICAgICAgIGNvbnN0IHVybCA9IHR5cGVvZiBpdGVtLnVybCA9PT0gXCJzdHJpbmdcIiA/IGl0ZW0udXJsLnRyaW0oKS5zbGljZSgwLCA0MDAwKSA6IFwiXCI7XG4gICAgICAgIGlmICghaG9zdElkIHx8ICEvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KHVybCkpIHJldHVybiBbXTtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgaG9zdElkLFxuICAgICAgICAgIGhvc3ROYW1lOiB0eXBlb2YgaXRlbS5ob3N0TmFtZSA9PT0gXCJzdHJpbmdcIiAmJiBpdGVtLmhvc3ROYW1lLnRyaW0oKSA/IGl0ZW0uaG9zdE5hbWUudHJpbSgpLnNsaWNlKDAsIDIwMCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgdXJsLFxuICAgICAgICAgIHVwbG9hZGVkQXQ6IHR5cGVvZiBpdGVtLnVwbG9hZGVkQXQgPT09IFwic3RyaW5nXCIgJiYgaXRlbS51cGxvYWRlZEF0LnRyaW0oKSA/IGl0ZW0udXBsb2FkZWRBdC50cmltKCkuc2xpY2UoMCwgODApIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhc3RTdWNjZXNzQXQ6IHR5cGVvZiBpdGVtLmxhc3RTdWNjZXNzQXQgPT09IFwic3RyaW5nXCIgJiYgaXRlbS5sYXN0U3VjY2Vzc0F0LnRyaW0oKSA/IGl0ZW0ubGFzdFN1Y2Nlc3NBdC50cmltKCkuc2xpY2UoMCwgODApIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhc3RGYWlsdXJlQXQ6IHR5cGVvZiBpdGVtLmxhc3RGYWlsdXJlQXQgPT09IFwic3RyaW5nXCIgJiYgaXRlbS5sYXN0RmFpbHVyZUF0LnRyaW0oKSA/IGl0ZW0ubGFzdEZhaWx1cmVBdC50cmltKCkuc2xpY2UoMCwgODApIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGZhaWx1cmVDb3VudDogdHlwZW9mIGl0ZW0uZmFpbHVyZUNvdW50ID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZShpdGVtLmZhaWx1cmVDb3VudClcbiAgICAgICAgICAgID8gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwMDAwMCwgTWF0aC5mbG9vcihpdGVtLmZhaWx1cmVDb3VudCkpKVxuICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgfV07XG4gICAgICB9KVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHsgaWQsIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlLCBhbHQsIGxvY2FsU291cmNlLCByZW1vdGVTb3VyY2VzOiByZW1vdGVTb3VyY2VzPy5sZW5ndGggPyByZW1vdGVTb3VyY2VzIDogdW5kZWZpbmVkIH07XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS50eXBlID09PSBcInRleHRcIikge1xuICAgIGNvbnN0IGZhbGxiYWNrVGV4dCA9IHR5cGVvZiBjYW5kaWRhdGUudGV4dCA9PT0gXCJzdHJpbmdcIiA/IGNhbmRpZGF0ZS50ZXh0LnJlcGxhY2UoL1xccj9cXG4vZywgXCIgXCIpLnNsaWNlKDAsIDIwMDAwKSA6IFwiXCI7XG4gICAgY29uc3QgcmljaFRleHQgPSBub3JtYWxpemVSaWNoVGV4dChjYW5kaWRhdGUucmljaFRleHQsIGZhbGxiYWNrVGV4dCk7XG4gICAgY29uc3QgdGV4dCA9IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBmYWxsYmFja1RleHQpO1xuICAgIHJldHVybiB7IGlkLCB0eXBlOiBcInRleHRcIiwgdGV4dCwgcmljaFRleHQgfTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGltYWdlU291cmNlQ2FuZGlkYXRlcyhibG9jazogTWluZE1hcEltYWdlQ29udGVudEJsb2NrLCBpbmNsdWRlTG9jYWwgPSB0cnVlKTogTWluZE1hcEltYWdlU291cmNlQ2FuZGlkYXRlW10ge1xuICBjb25zdCBjYW5kaWRhdGVzOiBNaW5kTWFwSW1hZ2VTb3VyY2VDYW5kaWRhdGVbXSA9IFtdO1xuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGFkZCA9IChjYW5kaWRhdGU6IE1pbmRNYXBJbWFnZVNvdXJjZUNhbmRpZGF0ZSk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IHNvdXJjZSA9IGNhbmRpZGF0ZS5zb3VyY2UudHJpbSgpO1xuICAgIGlmICghc291cmNlIHx8IHNlZW4uaGFzKHNvdXJjZSkpIHJldHVybjtcbiAgICBzZWVuLmFkZChzb3VyY2UpO1xuICAgIGNhbmRpZGF0ZXMucHVzaCh7IC4uLmNhbmRpZGF0ZSwgc291cmNlIH0pO1xuICB9O1xuXG4gIGNvbnN0IGN1cnJlbnRSZW1vdGUgPSBibG9jay5yZW1vdGVTb3VyY2VzPy5maW5kKChpdGVtKSA9PiBpdGVtLnVybCA9PT0gYmxvY2suc291cmNlKTtcbiAgYWRkKHtcbiAgICBzb3VyY2U6IGJsb2NrLnNvdXJjZSxcbiAgICBsYWJlbDogY3VycmVudFJlbW90ZT8uaG9zdE5hbWUgfHwgKGN1cnJlbnRSZW1vdGUgPyBcIlx1NUY1M1x1NTI0RFx1NTZGRVx1NUU4QVwiIDogXCJcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcIiksXG4gICAgaG9zdElkOiBjdXJyZW50UmVtb3RlPy5ob3N0SWQsXG4gICAgaG9zdE5hbWU6IGN1cnJlbnRSZW1vdGU/Lmhvc3ROYW1lLFxuICAgIGtpbmQ6IFwiY3VycmVudFwiXG4gIH0pO1xuICBjb25zdCByZW1vdGVzID0gYmxvY2sucmVtb3RlU291cmNlcyA/PyBbXTtcbiAgY29uc3QgY3VycmVudEluZGV4ID0gcmVtb3Rlcy5maW5kSW5kZXgoKGl0ZW0pID0+IGl0ZW0udXJsID09PSBibG9jay5zb3VyY2UpO1xuICBjb25zdCBvcmRlcmVkUmVtb3RlcyA9IGN1cnJlbnRJbmRleCA+PSAwXG4gICAgPyBbLi4ucmVtb3Rlcy5zbGljZShjdXJyZW50SW5kZXggKyAxKSwgLi4ucmVtb3Rlcy5zbGljZSgwLCBjdXJyZW50SW5kZXgpXVxuICAgIDogcmVtb3RlcztcbiAgZm9yIChjb25zdCByZW1vdGUgb2Ygb3JkZXJlZFJlbW90ZXMpIHtcbiAgICBhZGQoe1xuICAgICAgc291cmNlOiByZW1vdGUudXJsLFxuICAgICAgbGFiZWw6IHJlbW90ZS5ob3N0TmFtZSB8fCBcIlx1NTkwN1x1NzUyOFx1NTZGRVx1NUU4QVwiLFxuICAgICAgaG9zdElkOiByZW1vdGUuaG9zdElkLFxuICAgICAgaG9zdE5hbWU6IHJlbW90ZS5ob3N0TmFtZSxcbiAgICAgIGtpbmQ6IFwicmVtb3RlXCJcbiAgICB9KTtcbiAgfVxuICBpZiAoaW5jbHVkZUxvY2FsICYmIGJsb2NrLmxvY2FsU291cmNlKSB7XG4gICAgYWRkKHsgc291cmNlOiBibG9jay5sb2NhbFNvdXJjZSwgbGFiZWw6IFwiXHU2NzJDXHU1NzMwXHU1MjZGXHU2NzJDXCIsIGtpbmQ6IFwibG9jYWxcIiB9KTtcbiAgfVxuICByZXR1cm4gY2FuZGlkYXRlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVDb250ZW50QmxvY2tzKG5vZGU6IFBpY2s8TWluZE1hcE5vZGUsIFwiY29udGVudFwiIHwgXCJ0ZXh0XCIgfCBcInJpY2hUZXh0XCIgfCBcImltYWdlXCI+KTogTWluZE1hcENvbnRlbnRCbG9ja1tdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZS5jb250ZW50KSAmJiBub2RlLmNvbnRlbnQubGVuZ3RoKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vZGUuY29udGVudC5tYXAobm9ybWFsaXplQ29udGVudEJsb2NrKS5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcENvbnRlbnRCbG9jayA9PiBCb29sZWFuKGJsb2NrKSk7XG4gICAgaWYgKG5vcm1hbGl6ZWQubGVuZ3RoKSByZXR1cm4gbm9ybWFsaXplZDtcbiAgfVxuICBjb25zdCBibG9ja3M6IE1pbmRNYXBDb250ZW50QmxvY2tbXSA9IFtdO1xuICBpZiAobm9kZS5pbWFnZT8udHJpbSgpKSBibG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcImltYWdlXCIsIHNvdXJjZTogbm9kZS5pbWFnZS50cmltKCksIGFsdDogbm9kZS50ZXh0IHx8IHVuZGVmaW5lZCB9KTtcbiAgaWYgKG5vZGUudGV4dCB8fCBub2RlLnJpY2hUZXh0Py5sZW5ndGgpIHtcbiAgICBjb25zdCByaWNoVGV4dCA9IG5vcm1hbGl6ZVJpY2hUZXh0KG5vZGUucmljaFRleHQsIG5vZGUudGV4dCk7XG4gICAgYmxvY2tzLnB1c2goeyBpZDogbmV3SWQoKSwgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBub2RlLnRleHQpLCByaWNoVGV4dCB9KTtcbiAgfVxuICByZXR1cm4gYmxvY2tzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9kZVBsYWluVGV4dChub2RlOiBQaWNrPE1pbmRNYXBOb2RlLCBcImNvbnRlbnRcIiB8IFwidGV4dFwiIHwgXCJyaWNoVGV4dFwiIHwgXCJpbWFnZVwiPik6IHN0cmluZyB7XG4gIGNvbnN0IGJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpO1xuICByZXR1cm4gYmxvY2tzLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcInRleHRcIikubWFwKChibG9jaykgPT4gYmxvY2sudGV4dCkuam9pbihcIiBcIikudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3luY05vZGVMZWdhY3lGaWVsZHMobm9kZTogTWluZE1hcE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gIG5vZGUuY29udGVudCA9IGJsb2Nrcy5sZW5ndGggPyBibG9ja3MgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHRleHRCbG9ja3MgPSBibG9ja3MuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKTtcbiAgY29uc3QgaW1hZ2VCbG9ja3MgPSBibG9ja3MuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIpO1xuICBub2RlLnRleHQgPSB0ZXh0QmxvY2tzLm1hcCgoYmxvY2spID0+IGJsb2NrLnRleHQpLmpvaW4oXCIgXCIpLnRyaW0oKTtcbiAgbm9kZS5yaWNoVGV4dCA9IHRleHRCbG9ja3MubGVuZ3RoID09PSAxID8gbm9ybWFsaXplUmljaFRleHQodGV4dEJsb2Nrc1swXT8ucmljaFRleHQsIHRleHRCbG9ja3NbMF0/LnRleHQgPz8gXCJcIikgOiB1bmRlZmluZWQ7XG4gIG5vZGUuaW1hZ2UgPSBpbWFnZUJsb2Nrc1swXT8uc291cmNlO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNlbGwodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUudHJpbSgpLnNsaWNlKDAsIDIwMDApIDogU3RyaW5nKHZhbHVlID8/IFwiXCIpLnRyaW0oKS5zbGljZSgwLCAyMDAwKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGFibGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcFRhYmxlPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBUYWJsZSB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQgfHwgIUFycmF5LmlzQXJyYXkoaW5wdXQuaGVhZGVycykpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IGhlYWRlcnMgPSBpbnB1dC5oZWFkZXJzLm1hcChub3JtYWxpemVDZWxsKS5zbGljZSgwLCAxMik7XG4gIGlmICghaGVhZGVycy5sZW5ndGgpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHJvd3MgPSBBcnJheS5pc0FycmF5KGlucHV0LnJvd3MpXG4gICAgPyBpbnB1dC5yb3dzLnNsaWNlKDAsIDEwMCkubWFwKChyb3cpID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IEFycmF5LmlzQXJyYXkocm93KSA/IHJvdy5tYXAobm9ybWFsaXplQ2VsbCkuc2xpY2UoMCwgaGVhZGVycy5sZW5ndGgpIDogW107XG4gICAgICB3aGlsZSAodmFsdWVzLmxlbmd0aCA8IGhlYWRlcnMubGVuZ3RoKSB2YWx1ZXMucHVzaChcIlwiKTtcbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfSlcbiAgICA6IFtdO1xuICBjb25zdCBhbGlnbm1lbnRzID0gQXJyYXkuaXNBcnJheShpbnB1dC5hbGlnbm1lbnRzKVxuICAgID8gaW5wdXQuYWxpZ25tZW50cy5zbGljZSgwLCBoZWFkZXJzLmxlbmd0aCkubWFwKCh2YWx1ZSkgPT4gdmFsdWUgPT09IFwiY2VudGVyXCIgfHwgdmFsdWUgPT09IFwicmlnaHRcIiA/IHZhbHVlIDogXCJsZWZ0XCIpXG4gICAgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHNvdXJjZSA9IGlucHV0LnNvdXJjZSA9PT0gXCJtYXJrZG93blwiIHx8IGlucHV0LnNvdXJjZSA9PT0gXCJjaGlsZHJlblwiID8gaW5wdXQuc291cmNlIDogXCJtYW51YWxcIjtcbiAgcmV0dXJuIHsgaGVhZGVycywgcm93cywgYWxpZ25tZW50cywgc291cmNlIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvZGUoaW5wdXQ6IFBhcnRpYWw8TWluZE1hcENvZGVCbG9jaz4gfCB1bmRlZmluZWQpOiBNaW5kTWFwQ29kZUJsb2NrIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQuY29kZSAhPT0gXCJzdHJpbmdcIiB8fCAhaW5wdXQuY29kZS50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IGxhbmd1YWdlID0gdHlwZW9mIGlucHV0Lmxhbmd1YWdlID09PSBcInN0cmluZ1wiICYmIGlucHV0Lmxhbmd1YWdlLnRyaW0oKVxuICAgID8gaW5wdXQubGFuZ3VhZ2UudHJpbSgpLnJlcGxhY2UoL1teYS16MC05XysjLi1dL2dpLCBcIlwiKS5zbGljZSgwLCA0MClcbiAgICA6IHVuZGVmaW5lZDtcbiAgcmV0dXJuIHsgbGFuZ3VhZ2UsIGNvZGU6IGlucHV0LmNvZGUucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpLnNsaWNlKDAsIDEwMDAwMCkgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU3VibWFwKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBTdWJtYXA+IHwgdW5kZWZpbmVkKTogTWluZE1hcFN1Ym1hcCB8IHVuZGVmaW5lZCB7XG4gIGlmICghaW5wdXQgfHwgdHlwZW9mIGlucHV0LnBhdGggIT09IFwic3RyaW5nXCIgfHwgIWlucHV0LnBhdGgudHJpbSgpKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGlucHV0LnBhdGgudHJpbSgpLnNsaWNlKDAsIDUwMCksXG4gICAgdGl0bGU6IHR5cGVvZiBpbnB1dC50aXRsZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC50aXRsZS50cmltKCkgPyBpbnB1dC50aXRsZS50cmltKCkuc2xpY2UoMCwgMjAwKSA6IHVuZGVmaW5lZFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOYXZpZ2F0aW9uKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOYXZpZ2F0aW9uPiB8IHVuZGVmaW5lZCk6IE1pbmRNYXBOYXZpZ2F0aW9uIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQucGFyZW50UGF0aCAhPT0gXCJzdHJpbmdcIiB8fCAhaW5wdXQucGFyZW50UGF0aC50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiB7XG4gICAgcGFyZW50UGF0aDogaW5wdXQucGFyZW50UGF0aC50cmltKCkuc2xpY2UoMCwgNTAwKSxcbiAgICBwYXJlbnROb2RlSWQ6IHR5cGVvZiBpbnB1dC5wYXJlbnROb2RlSWQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQucGFyZW50Tm9kZUlkLnRyaW0oKSA/IGlucHV0LnBhcmVudE5vZGVJZC50cmltKCkuc2xpY2UoMCwgMTYwKSA6IHVuZGVmaW5lZCxcbiAgICBwYXJlbnRUaXRsZTogdHlwZW9mIGlucHV0LnBhcmVudFRpdGxlID09PSBcInN0cmluZ1wiICYmIGlucHV0LnBhcmVudFRpdGxlLnRyaW0oKSA/IGlucHV0LnBhcmVudFRpdGxlLnRyaW0oKS5zbGljZSgwLCAyMDApIDogdW5kZWZpbmVkLFxuICAgIHBhcmVudE5vZGVUZXh0OiB0eXBlb2YgaW5wdXQucGFyZW50Tm9kZVRleHQgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQucGFyZW50Tm9kZVRleHQudHJpbSgpID8gaW5wdXQucGFyZW50Tm9kZVRleHQudHJpbSgpLnNsaWNlKDAsIDIwMCkgOiB1bmRlZmluZWRcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVGFzayh2YWx1ZTogdW5rbm93bik6IFRhc2tTdGF0dXMgfCB1bmRlZmluZWQge1xuICByZXR1cm4gdmFsdWUgPT09IFwidG9kb1wiIHx8IHZhbHVlID09PSBcImRvaW5nXCIgfHwgdmFsdWUgPT09IFwiZG9uZVwiID8gdmFsdWUgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRhZ3ModmFsdWU6IHVua25vd24pOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHRhZ3MgPSBBcnJheS5mcm9tKG5ldyBTZXQodmFsdWVcbiAgICAuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBzdHJpbmcgPT4gdHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpXG4gICAgLm1hcCgoaXRlbSkgPT4gaXRlbS50cmltKCkucmVwbGFjZSgvXiMvLCBcIlwiKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pKSlcbiAgICAuc2xpY2UoMCwgMTIpO1xuICByZXR1cm4gdGFncy5sZW5ndGggPyB0YWdzIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVOb2RlKGlucHV0OiBQYXJ0aWFsPE1pbmRNYXBOb2RlPiB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUZXh0OiBzdHJpbmcpOiBNaW5kTWFwTm9kZSB7XG4gIGNvbnN0IGZhbGxiYWNrTm9kZVRleHQgPSB0eXBlb2YgaW5wdXQ/LnRleHQgPT09IFwic3RyaW5nXCIgPyBpbnB1dC50ZXh0IDogZmFsbGJhY2tUZXh0O1xuICBjb25zdCBub3JtYWxpemVkQ29udGVudCA9IEFycmF5LmlzQXJyYXkoaW5wdXQ/LmNvbnRlbnQpXG4gICAgPyBpbnB1dC5jb250ZW50Lm1hcChub3JtYWxpemVDb250ZW50QmxvY2spLmZpbHRlcigoYmxvY2spOiBibG9jayBpcyBNaW5kTWFwQ29udGVudEJsb2NrID0+IEJvb2xlYW4oYmxvY2spKVxuICAgIDogW107XG4gIGlmICghbm9ybWFsaXplZENvbnRlbnQubGVuZ3RoKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dD8uaW1hZ2UgPT09IFwic3RyaW5nXCIgJiYgaW5wdXQuaW1hZ2UudHJpbSgpKSB7XG4gICAgICBub3JtYWxpemVkQ29udGVudC5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBpbnB1dC5pbWFnZS50cmltKCksIGFsdDogZmFsbGJhY2tOb2RlVGV4dCB8fCB1bmRlZmluZWQgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJpY2hUZXh0ID0gbm9ybWFsaXplUmljaFRleHQoaW5wdXQ/LnJpY2hUZXh0LCBmYWxsYmFja05vZGVUZXh0KTtcbiAgICBjb25zdCB0ZXh0ID0gcmljaFRleHRQbGFpblRleHQocmljaFRleHQsIGZhbGxiYWNrTm9kZVRleHQpO1xuICAgIGlmICh0ZXh0KSBub3JtYWxpemVkQ29udGVudC5wdXNoKHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0LCByaWNoVGV4dCB9KTtcbiAgfVxuICBjb25zdCB0ZXh0QmxvY2tzID0gbm9ybWFsaXplZENvbnRlbnQuZmlsdGVyKChibG9jayk6IGJsb2NrIGlzIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKTtcbiAgY29uc3QgaW1hZ2VCbG9ja3MgPSBub3JtYWxpemVkQ29udGVudC5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIik7XG4gIGNvbnN0IHRleHQgPSB0ZXh0QmxvY2tzLm1hcCgoYmxvY2spID0+IGJsb2NrLnRleHQpLmpvaW4oXCIgXCIpLnRyaW0oKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogdHlwZW9mIGlucHV0Py5pZCA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5pZCA/IGlucHV0LmlkIDogbmV3SWQoKSxcbiAgICB0ZXh0LFxuICAgIHJpY2hUZXh0OiB0ZXh0QmxvY2tzLmxlbmd0aCA9PT0gMSA/IHRleHRCbG9ja3NbMF0/LnJpY2hUZXh0IDogdW5kZWZpbmVkLFxuICAgIGNvbnRlbnQ6IG5vcm1hbGl6ZWRDb250ZW50Lmxlbmd0aCA/IG5vcm1hbGl6ZWRDb250ZW50IDogdW5kZWZpbmVkLFxuICAgIG5vdGU6IHR5cGVvZiBpbnB1dD8ubm90ZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5ub3RlLnRyaW0oKSA/IGlucHV0Lm5vdGUudHJpbSgpIDogdW5kZWZpbmVkLFxuICAgIGxpbms6IHR5cGVvZiBpbnB1dD8ubGluayA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5saW5rLnRyaW0oKSA/IGlucHV0LmxpbmsudHJpbSgpIDogdW5kZWZpbmVkLFxuICAgIGltYWdlOiBpbWFnZUJsb2Nrc1swXT8uc291cmNlLFxuICAgIHRhYmxlOiBub3JtYWxpemVUYWJsZShpbnB1dD8udGFibGUpLFxuICAgIGNvZGU6IG5vcm1hbGl6ZUNvZGUoaW5wdXQ/LmNvZGUpLFxuICAgIHN1Ym1hcDogbm9ybWFsaXplU3VibWFwKGlucHV0Py5zdWJtYXApLFxuICAgIGljb246IHR5cGVvZiBpbnB1dD8uaWNvbiA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC5pY29uLnRyaW0oKSA/IGlucHV0Lmljb24udHJpbSgpLnNsaWNlKDAsIDEyKSA6IHVuZGVmaW5lZCxcbiAgICB0YWdzOiBub3JtYWxpemVUYWdzKGlucHV0Py50YWdzKSxcbiAgICB0YXNrOiBub3JtYWxpemVUYXNrKGlucHV0Py50YXNrKSxcbiAgICBzdHlsZTogbm9ybWFsaXplU3R5bGUoaW5wdXQ/LnN0eWxlKSxcbiAgICBjb2xsYXBzZWQ6IGlucHV0Py5jb2xsYXBzZWQgPT09IHRydWUgfHwgdW5kZWZpbmVkLFxuICAgIGNoaWxkcmVuOiBBcnJheS5pc0FycmF5KGlucHV0Py5jaGlsZHJlbilcbiAgICAgID8gaW5wdXQuY2hpbGRyZW4ubWFwKChjaGlsZCwgaW5kZXgpID0+IG5vcm1hbGl6ZU5vZGUoY2hpbGQsIGBcdTgyODJcdTcwQjkgJHtpbmRleCArIDF9YCkpXG4gICAgICA6IFtdXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVEb2N1bWVudChpbnB1dDogUGFydGlhbDxNaW5kTWFwRG9jdW1lbnQ+IHwgdW5kZWZpbmVkLCBmYWxsYmFja1RpdGxlID0gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik6IE1pbmRNYXBEb2N1bWVudCB7XG4gIGNvbnN0IHRpdGxlID0gdHlwZW9mIGlucHV0Py50aXRsZSA9PT0gXCJzdHJpbmdcIiAmJiBpbnB1dC50aXRsZS50cmltKCkgPyBpbnB1dC50aXRsZS50cmltKCkgOiBmYWxsYmFja1RpdGxlO1xuICByZXR1cm4ge1xuICAgIHZlcnNpb246IDksXG4gICAgdGl0bGUsXG4gICAgbGF5b3V0OiBpbnB1dD8ubGF5b3V0ID09PSBcImJhbGFuY2VkXCIgPyBcImJhbGFuY2VkXCIgOiBcInJpZ2h0XCIsXG4gICAgdGhlbWU6IGlucHV0Py50aGVtZSA9PT0gXCJsaWdodFwiIHx8IGlucHV0Py50aGVtZSA9PT0gXCJkYXJrXCIgPyBpbnB1dC50aGVtZSA6IFwiYXV0b1wiLFxuICAgIGFwcGVhcmFuY2U6IG5vcm1hbGl6ZUFwcGVhcmFuY2UoaW5wdXQ/LmFwcGVhcmFuY2UpLFxuICAgIG5hdmlnYXRpb246IG5vcm1hbGl6ZU5hdmlnYXRpb24oaW5wdXQ/Lm5hdmlnYXRpb24pLFxuICAgIHJvb3Q6IG5vcm1hbGl6ZU5vZGUoaW5wdXQ/LnJvb3QsIHRpdGxlKVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRG9jdW1lbnQoZG9jOiBNaW5kTWFwRG9jdW1lbnQpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplRG9jdW1lbnQoZG9jLCBkb2MudGl0bGUpO1xuICByZXR1cm4gYCR7SlNPTi5zdHJpbmdpZnkobm9ybWFsaXplZCwgbnVsbCwgMil9XFxuYDtcbn1cblxuZnVuY3Rpb24gcGFyc2VKc29uRG9jdW1lbnQodmFsdWU6IHN0cmluZywgZmFsbGJhY2tUaXRsZTogc3RyaW5nKTogTWluZE1hcERvY3VtZW50IHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZURvY3VtZW50KEpTT04ucGFyc2UodmFsdWUpIGFzIFBhcnRpYWw8TWluZE1hcERvY3VtZW50PiwgZmFsbGJhY2tUaXRsZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RGZW5jZWRKc29uKHNvdXJjZTogc3RyaW5nLCBsYW5ndWFnZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGVzY2FwZWQgPSBsYW5ndWFnZS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIGNvbnN0IG1hdGNoID0gc291cmNlLm1hdGNoKG5ldyBSZWdFeHAoXCJgYGBcIiArIGVzY2FwZWQgKyBcIlxcXFxzKihbXFxcXHNcXFxcU10qPylgYGBcIiwgXCJpXCIpKTtcbiAgcmV0dXJuIG1hdGNoPy5bMV0/LnRyaW0oKSA/PyBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEb2N1bWVudChzb3VyY2U6IHN0cmluZywgZmFsbGJhY2tUaXRsZSA9IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpOiBNaW5kTWFwRG9jdW1lbnQge1xuICBjb25zdCB0cmltbWVkID0gc291cmNlLnRyaW0oKTtcbiAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aChcIntcIikgJiYgdHJpbW1lZC5lbmRzV2l0aChcIn1cIikpIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUpzb25Eb2N1bWVudCh0cmltbWVkLCBmYWxsYmFja1RpdGxlKTtcbiAgICBpZiAocGFyc2VkKSByZXR1cm4gcGFyc2VkO1xuICB9XG5cbiAgZm9yIChjb25zdCBsYW5ndWFnZSBvZiBbTUlORE1BUF9DT0RFX0JMT0NLLCAuLi5MRUdBQ1lfQ09ERV9CTE9DS1NdKSB7XG4gICAgY29uc3QgZmVuY2VkID0gZXh0cmFjdEZlbmNlZEpzb24oc291cmNlLCBsYW5ndWFnZSk7XG4gICAgaWYgKCFmZW5jZWQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSnNvbkRvY3VtZW50KGZlbmNlZCwgZmFsbGJhY2tUaXRsZSk7XG4gICAgaWYgKHBhcnNlZCkgcmV0dXJuIHBhcnNlZDtcbiAgfVxuXG4gIHJldHVybiBtYXJrZG93blRvRG9jdW1lbnQoc291cmNlLCBmYWxsYmFja1RpdGxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb25lRG9jdW1lbnQoZG9jOiBNaW5kTWFwRG9jdW1lbnQpOiBNaW5kTWFwRG9jdW1lbnQge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkb2MpKSBhcyBNaW5kTWFwRG9jdW1lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZU5vZGVXaXRoRnJlc2hJZHMobm9kZTogTWluZE1hcE5vZGUpOiBNaW5kTWFwTm9kZSB7XG4gIGNvbnN0IGNsb25lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShub2RlKSkgYXMgTWluZE1hcE5vZGU7XG4gIHdhbGtOb2RlcyhjbG9uZSwgKGN1cnJlbnQpID0+IHtcbiAgICBjdXJyZW50LmlkID0gbmV3SWQoKTtcbiAgfSk7XG4gIHJldHVybiBjbG9uZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhbGtOb2Rlcyhyb290OiBNaW5kTWFwTm9kZSwgdmlzaXRvcjogKG5vZGU6IE1pbmRNYXBOb2RlLCBwYXJlbnQ6IE1pbmRNYXBOb2RlIHwgbnVsbCkgPT4gdm9pZCk6IHZvaWQge1xuICBjb25zdCB2aXNpdCA9IChub2RlOiBNaW5kTWFwTm9kZSwgcGFyZW50OiBNaW5kTWFwTm9kZSB8IG51bGwpOiB2b2lkID0+IHtcbiAgICB2aXNpdG9yKG5vZGUsIHBhcmVudCk7XG4gICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIG5vZGUpKTtcbiAgfTtcbiAgdmlzaXQocm9vdCwgbnVsbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuTm9kZXMocm9vdDogTWluZE1hcE5vZGUpOiBNaW5kTWFwTm9kZVtdIHtcbiAgY29uc3Qgbm9kZXM6IE1pbmRNYXBOb2RlW10gPSBbXTtcbiAgd2Fsa05vZGVzKHJvb3QsIChub2RlKSA9PiBub2Rlcy5wdXNoKG5vZGUpKTtcbiAgcmV0dXJuIG5vZGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZE5vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBNaW5kTWFwTm9kZSB8IG51bGwge1xuICBsZXQgcmVzdWx0OiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUpID0+IHtcbiAgICBpZiAobm9kZS5pZCA9PT0gaWQpIHJlc3VsdCA9IG5vZGU7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhcmVudChyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gIGxldCByZXN1bHQ6IE1pbmRNYXBOb2RlIHwgbnVsbCA9IG51bGw7XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSwgcGFyZW50KSA9PiB7XG4gICAgaWYgKG5vZGUuaWQgPT09IGlkKSByZXN1bHQgPSBwYXJlbnQ7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEFuY2VzdG9ycyhyb290OiBNaW5kTWFwTm9kZSwgaWQ6IHN0cmluZyk6IE1pbmRNYXBOb2RlW10ge1xuICBjb25zdCBwYXRoOiBNaW5kTWFwTm9kZVtdID0gW107XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE1pbmRNYXBOb2RlKTogYm9vbGVhbiA9PiB7XG4gICAgaWYgKG5vZGUuaWQgPT09IGlkKSByZXR1cm4gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgIHBhdGgucHVzaChub2RlKTtcbiAgICAgIGlmICh2aXNpdChjaGlsZCkpIHJldHVybiB0cnVlO1xuICAgICAgcGF0aC5wb3AoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICByZXR1cm4gdmlzaXQocm9vdCkgPyBwYXRoIDogW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluc05vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGZpbmROb2RlKHJvb3QsIGlkKSAhPT0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZU5vZGUocm9vdDogTWluZE1hcE5vZGUsIGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJvb3QuY2hpbGRyZW4ubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgaWYgKHJvb3QuY2hpbGRyZW5baW5kZXhdPy5pZCA9PT0gaWQpIHtcbiAgICAgIHJvb3QuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZCA9IHJvb3QuY2hpbGRyZW5baW5kZXhdO1xuICAgIGlmIChjaGlsZCAmJiByZW1vdmVOb2RlKGNoaWxkLCBpZCkpIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RXaWtpTGlua3Mocm9vdDogTWluZE1hcE5vZGUpOiBTZXQ8c3RyaW5nPiB7XG4gIGNvbnN0IGxpbmtzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhdHRlcm4gPSAvXFxbXFxbKFteXFxdfCNdKykoPzojW15cXF18XSspPyg/OlxcfFteXFxdXSspP1xcXVxcXS9nO1xuICB3YWxrTm9kZXMocm9vdCwgKG5vZGUpID0+IHtcbiAgICBjb25zdCB2YWx1ZXMgPSBbbm9kZVBsYWluVGV4dChub2RlKSwgbm9kZS5ub3RlID8/IFwiXCIsIG5vZGUubGluayA/PyBcIlwiLCAuLi5ub2RlQ29udGVudEJsb2Nrcyhub2RlKS5maWx0ZXIoKGJsb2NrKTogYmxvY2sgaXMgTWluZE1hcEltYWdlQ29udGVudEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikubWFwKChibG9jaykgPT4gYmxvY2suc291cmNlKSwgbm9kZS5zdWJtYXA/LnBhdGggPz8gXCJcIl07XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiB2YWx1ZXMpIHtcbiAgICAgIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgICAgIHdoaWxlICgobWF0Y2ggPSBwYXR0ZXJuLmV4ZWModmFsdWUpKSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAobWF0Y2hbMV0pIGxpbmtzLmFkZChtYXRjaFsxXS50cmltKCkpO1xuICAgICAgfVxuICAgICAgcGF0dGVybi5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgICBjb25zdCBleHBsaWNpdExpbmsgPSBub2RlLmxpbms/LnRyaW0oKTtcbiAgICBpZiAoZXhwbGljaXRMaW5rICYmICEvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KGV4cGxpY2l0TGluaykgJiYgIWV4cGxpY2l0TGluay5pbmNsdWRlcyhcIltbXCIpKSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBleHBsaWNpdExpbmsuc3BsaXQoXCJ8XCIpWzBdPy5zcGxpdChcIiNcIilbMF0/LnRyaW0oKTtcbiAgICAgIGlmICh0YXJnZXQpIGxpbmtzLmFkZCh0YXJnZXQpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBsaW5rcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RGaXJzdFdpa2lMaW5rKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSB2YWx1ZS5tYXRjaCgvXFxbXFxbKFteXFxdfCNdKyg/OiNbXlxcXXxdKyk/KSg/OlxcfFteXFxdXSspP1xcXVxcXS8pO1xuICByZXR1cm4gbWF0Y2g/LlsxXT8udHJpbSgpID8/IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXNrUHJvZ3Jlc3Mocm9vdDogTWluZE1hcE5vZGUpOiBUYXNrUHJvZ3Jlc3Mge1xuICBsZXQgZG9uZSA9IDA7XG4gIGxldCB0b3RhbCA9IDA7XG4gIHdhbGtOb2Rlcyhyb290LCAobm9kZSkgPT4ge1xuICAgIGlmICghbm9kZS50YXNrKSByZXR1cm47XG4gICAgdG90YWwgKz0gMTtcbiAgICBpZiAobm9kZS50YXNrID09PSBcImRvbmVcIikgZG9uZSArPSAxO1xuICB9KTtcbiAgcmV0dXJuIHsgZG9uZSwgdG90YWwgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVTZWFyY2hUZXh0KG5vZGU6IE1pbmRNYXBOb2RlKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtub2RlUGxhaW5UZXh0KG5vZGUpLCBub2RlLm5vdGUsIG5vZGUubGluaywgLi4ubm9kZUNvbnRlbnRCbG9ja3Mobm9kZSkubWFwKChibG9jaykgPT4gYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiID8gYCR7YmxvY2suc291cmNlfSAke2Jsb2NrLmFsdCA/PyBcIlwifWAgOiBibG9jay50ZXh0KSwgbm9kZS5pY29uLCBub2RlLnN1Ym1hcD8ucGF0aCwgbm9kZS5jb2RlPy5sYW5ndWFnZSwgbm9kZS5jb2RlPy5jb2RlLCAuLi4obm9kZS50YWJsZT8uaGVhZGVycyA/PyBbXSksIC4uLihub2RlLnRhYmxlPy5yb3dzLmZsYXQoKSA/PyBbXSksIC4uLihub2RlLnRhZ3MgPz8gW10pXVxuICAgIC5maWx0ZXIoKHZhbHVlKTogdmFsdWUgaXMgc3RyaW5nID0+IEJvb2xlYW4odmFsdWUpKVxuICAgIC5qb2luKFwiIFwiKVxuICAgIC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiB0YXNrUHJlZml4KHRhc2s6IFRhc2tTdGF0dXMgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAodGFzayA9PT0gXCJkb25lXCIpIHJldHVybiBcIlt4XSBcIjtcbiAgaWYgKHRhc2sgPT09IFwiZG9pbmdcIikgcmV0dXJuIFwiWy1dIFwiO1xuICBpZiAodGFzayA9PT0gXCJ0b2RvXCIpIHJldHVybiBcIlsgXSBcIjtcbiAgcmV0dXJuIFwiXCI7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUlubGluZU1hcmtkb3duKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvKFtcXFxcYCpfe31cXFtcXF08Pl0pL2csIFwiXFxcXCQxXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmljaFRleHRUb01hcmtkb3duKHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFydW5zPy5sZW5ndGgpIHJldHVybiBlc2NhcGVJbmxpbmVNYXJrZG93bihmYWxsYmFja1RleHQpO1xuICByZXR1cm4gcnVucy5tYXAoKHJ1bikgPT4ge1xuICAgIGxldCB2YWx1ZSA9IGVzY2FwZUlubGluZU1hcmtkb3duKHJ1bi50ZXh0KTtcbiAgICBjb25zdCBzdHlsZSA9IHJ1bi5zdHlsZTtcbiAgICBpZiAoIXN0eWxlKSByZXR1cm4gdmFsdWU7XG4gICAgaWYgKHN0eWxlLmJvbGQpIHZhbHVlID0gYCoqJHt2YWx1ZX0qKmA7XG4gICAgaWYgKHN0eWxlLml0YWxpYykgdmFsdWUgPSBgKiR7dmFsdWV9KmA7XG4gICAgaWYgKHN0eWxlLnN0cmlrZSkgdmFsdWUgPSBgfn4ke3ZhbHVlfX5+YDtcbiAgICBpZiAoc3R5bGUudW5kZXJsaW5lKSB2YWx1ZSA9IGA8dT4ke3ZhbHVlfTwvdT5gO1xuICAgIGlmIChzdHlsZS5jb2xvcikgdmFsdWUgPSBgPHNwYW4gc3R5bGU9XCJjb2xvcjoke3N0eWxlLmNvbG9yfVwiPiR7dmFsdWV9PC9zcGFuPmA7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9KS5qb2luKFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGFibGVUb01hcmtkb3duKHRhYmxlOiBNaW5kTWFwVGFibGUpOiBzdHJpbmcge1xuICBjb25zdCBlc2NhcGVDZWxsID0gKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgPT4gdmFsdWUucmVwbGFjZUFsbChcInxcIiwgXCJcXFxcfFwiKS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiPGJyPlwiKTtcbiAgY29uc3QgaGVhZGVycyA9IGB8ICR7dGFibGUuaGVhZGVycy5tYXAoZXNjYXBlQ2VsbCkuam9pbihcIiB8IFwiKX0gfGA7XG4gIGNvbnN0IGFsaWdubWVudHMgPSB0YWJsZS5oZWFkZXJzLm1hcCgoXywgaW5kZXgpID0+IHtcbiAgICBjb25zdCBhbGlnbm1lbnQgPSB0YWJsZS5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgIHJldHVybiBhbGlnbm1lbnQgPT09IFwiY2VudGVyXCIgPyBcIjotLS06XCIgOiBhbGlnbm1lbnQgPT09IFwicmlnaHRcIiA/IFwiLS0tOlwiIDogXCItLS1cIjtcbiAgfSk7XG4gIGNvbnN0IHNlcGFyYXRvciA9IGB8ICR7YWxpZ25tZW50cy5qb2luKFwiIHwgXCIpfSB8YDtcbiAgY29uc3Qgcm93cyA9IHRhYmxlLnJvd3MubWFwKChyb3cpID0+IGB8ICR7dGFibGUuaGVhZGVycy5tYXAoKF8sIGluZGV4KSA9PiBlc2NhcGVDZWxsKHJvd1tpbmRleF0gPz8gXCJcIikpLmpvaW4oXCIgfCBcIil9IHxgKTtcbiAgcmV0dXJuIFtoZWFkZXJzLCBzZXBhcmF0b3IsIC4uLnJvd3NdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHNwbGl0TWFya2Rvd25UYWJsZVJvdyhsaW5lOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHZhbHVlID0gbGluZS50cmltKCkucmVwbGFjZSgvXlxcfC8sIFwiXCIpLnJlcGxhY2UoL1xcfCQvLCBcIlwiKTtcbiAgY29uc3QgY2VsbHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBjdXJyZW50ID0gXCJcIjtcbiAgbGV0IGVzY2FwZWQgPSBmYWxzZTtcbiAgZm9yIChjb25zdCBjaGFyIG9mIHZhbHVlKSB7XG4gICAgaWYgKGVzY2FwZWQpIHsgY3VycmVudCArPSBjaGFyOyBlc2NhcGVkID0gZmFsc2U7IGNvbnRpbnVlOyB9XG4gICAgaWYgKGNoYXIgPT09IFwiXFxcXFwiKSB7IGVzY2FwZWQgPSB0cnVlOyBjb250aW51ZTsgfVxuICAgIGlmIChjaGFyID09PSBcInxcIikgeyBjZWxscy5wdXNoKGN1cnJlbnQudHJpbSgpLnJlcGxhY2VBbGwoXCI8YnI+XCIsIFwiXFxuXCIpKTsgY3VycmVudCA9IFwiXCI7IGNvbnRpbnVlOyB9XG4gICAgY3VycmVudCArPSBjaGFyO1xuICB9XG4gIGNlbGxzLnB1c2goY3VycmVudC50cmltKCkucmVwbGFjZUFsbChcIjxicj5cIiwgXCJcXG5cIikpO1xuICByZXR1cm4gY2VsbHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1hcmtkb3duVGFibGUobWFya2Rvd246IHN0cmluZyk6IE1pbmRNYXBUYWJsZSB8IG51bGwge1xuICBjb25zdCBsaW5lcyA9IG1hcmtkb3duLnNwbGl0KC9cXHI/XFxuLyk7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5lcy5sZW5ndGggLSAxOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgaGVhZGVyTGluZSA9IGxpbmVzW2luZGV4XT8udHJpbSgpID8/IFwiXCI7XG4gICAgY29uc3Qgc2VwYXJhdG9yTGluZSA9IGxpbmVzW2luZGV4ICsgMV0/LnRyaW0oKSA/PyBcIlwiO1xuICAgIGlmICghaGVhZGVyTGluZS5pbmNsdWRlcyhcInxcIikgfHwgIXNlcGFyYXRvckxpbmUuaW5jbHVkZXMoXCJ8XCIpKSBjb250aW51ZTtcbiAgICBjb25zdCBoZWFkZXJzID0gc3BsaXRNYXJrZG93blRhYmxlUm93KGhlYWRlckxpbmUpO1xuICAgIGNvbnN0IHNlcGFyYXRvcnMgPSBzcGxpdE1hcmtkb3duVGFibGVSb3coc2VwYXJhdG9yTGluZSk7XG4gICAgaWYgKCFoZWFkZXJzLmxlbmd0aCB8fCBzZXBhcmF0b3JzLmxlbmd0aCAhPT0gaGVhZGVycy5sZW5ndGggfHwgIXNlcGFyYXRvcnMuZXZlcnkoKGNlbGwpID0+IC9eOj8tezMsfTo/JC8udGVzdChjZWxsLnJlcGxhY2UoL1xccy9nLCBcIlwiKSkpKSBjb250aW51ZTtcbiAgICBjb25zdCBhbGlnbm1lbnRzOiBUYWJsZUFsaWdubWVudFtdID0gc2VwYXJhdG9ycy5tYXAoKGNlbGwpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBhY3QgPSBjZWxsLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgICAgIGlmIChjb21wYWN0LnN0YXJ0c1dpdGgoXCI6XCIpICYmIGNvbXBhY3QuZW5kc1dpdGgoXCI6XCIpKSByZXR1cm4gXCJjZW50ZXJcIjtcbiAgICAgIGlmIChjb21wYWN0LmVuZHNXaXRoKFwiOlwiKSkgcmV0dXJuIFwicmlnaHRcIjtcbiAgICAgIHJldHVybiBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCByb3dzOiBzdHJpbmdbXVtdID0gW107XG4gICAgZm9yIChsZXQgcm93SW5kZXggPSBpbmRleCArIDI7IHJvd0luZGV4IDwgbGluZXMubGVuZ3RoOyByb3dJbmRleCArPSAxKSB7XG4gICAgICBjb25zdCByb3dMaW5lID0gbGluZXNbcm93SW5kZXhdPy50cmltKCkgPz8gXCJcIjtcbiAgICAgIGlmICghcm93TGluZSB8fCAhcm93TGluZS5pbmNsdWRlcyhcInxcIikpIGJyZWFrO1xuICAgICAgY29uc3Qgcm93ID0gc3BsaXRNYXJrZG93blRhYmxlUm93KHJvd0xpbmUpLnNsaWNlKDAsIGhlYWRlcnMubGVuZ3RoKTtcbiAgICAgIHdoaWxlIChyb3cubGVuZ3RoIDwgaGVhZGVycy5sZW5ndGgpIHJvdy5wdXNoKFwiXCIpO1xuICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVUYWJsZSh7IGhlYWRlcnMsIHJvd3MsIGFsaWdubWVudHMsIHNvdXJjZTogXCJtYXJrZG93blwiIH0pID8/IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZlbmNlZENvZGUobWFya2Rvd246IHN0cmluZyk6IE1pbmRNYXBDb2RlQmxvY2sgfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgvYGBgKFteXFxuYF0qKVxcbihbXFxzXFxTXSo/KVxcbmBgYC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIG5vcm1hbGl6ZUNvZGUoeyBsYW5ndWFnZTogbWF0Y2hbMV0/LnRyaW0oKSwgY29kZTogbWF0Y2hbMl0gPz8gXCJcIiB9KSA/PyBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hpbGRyZW5Ub1RhYmxlKG5vZGU6IE1pbmRNYXBOb2RlKTogTWluZE1hcFRhYmxlIHwgbnVsbCB7XG4gIGlmICghbm9kZS5jaGlsZHJlbi5sZW5ndGgpIHJldHVybiBudWxsO1xuICByZXR1cm4ge1xuICAgIGhlYWRlcnM6IFtcIlx1NUI1MFx1ODI4Mlx1NzBCOVwiLCBcIlx1NTkwN1x1NkNFOFwiLCBcIlx1NzJCNlx1NjAwMVwiLCBcIlx1NjgwN1x1N0I3RVwiLCBcIlx1NEUwQlx1N0VBN1x1NjU3MFx1OTFDRlwiXSxcbiAgICByb3dzOiBub2RlLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IFtcbiAgICAgIG5vZGVQbGFpblRleHQoY2hpbGQpLFxuICAgICAgY2hpbGQubm90ZSA/PyBcIlwiLFxuICAgICAgY2hpbGQudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIDogY2hpbGQudGFzayA9PT0gXCJkb2luZ1wiID8gXCJcdThGREJcdTg4NENcdTRFMkRcIiA6IGNoaWxkLnRhc2sgPT09IFwidG9kb1wiID8gXCJcdTVGODVcdTUyOUVcIiA6IFwiXCIsXG4gICAgICBjaGlsZC50YWdzPy5qb2luKFwiLCBcIikgPz8gXCJcIixcbiAgICAgIFN0cmluZyhjaGlsZC5jaGlsZHJlbi5sZW5ndGgpXG4gICAgXSksXG4gICAgYWxpZ25tZW50czogW1wibGVmdFwiLCBcImxlZnRcIiwgXCJjZW50ZXJcIiwgXCJsZWZ0XCIsIFwicmlnaHRcIl0sXG4gICAgc291cmNlOiBcImNoaWxkcmVuXCJcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvY3VtZW50VG9NYXJrZG93bihkb2M6IE1pbmRNYXBEb2N1bWVudCk6IHN0cmluZyB7XG4gIGNvbnN0IHJlbmRlckJsb2NrcyA9IChub2RlOiBNaW5kTWFwTm9kZSk6IHN0cmluZ1tdID0+IHtcbiAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBub2RlQ29udGVudEJsb2Nrcyhub2RlKSkge1xuICAgICAgaWYgKGJsb2NrLnR5cGUgPT09IFwidGV4dFwiKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmljaFRleHRUb01hcmtkb3duKGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0KTtcbiAgICAgICAgaWYgKHZhbHVlKSByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQucHVzaChgIVske2VzY2FwZUlubGluZU1hcmtkb3duKGJsb2NrLmFsdCA/PyBcIlx1NTZGRVx1NzI0N1wiKX1dKCR7YmxvY2suc291cmNlfSlgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgY29uc3Qgcm9vdEJsb2NrcyA9IHJlbmRlckJsb2Nrcyhkb2Mucm9vdCk7XG4gIGNvbnN0IHJvb3RUaXRsZSA9IHJvb3RCbG9ja3MuZmluZCgodmFsdWUpID0+ICF2YWx1ZS5zdGFydHNXaXRoKFwiIVtcIikpID8/IGRvYy50aXRsZTtcbiAgY29uc3Qgcm9vdFN1ZmZpeCA9IGRvYy5yb290LnRhZ3M/Lmxlbmd0aCA/IGAgJHtkb2Mucm9vdC50YWdzLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApLmpvaW4oXCIgXCIpfWAgOiBcIlwiO1xuICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbYCMgJHtkb2Mucm9vdC5pY29uID8gYCR7ZG9jLnJvb3QuaWNvbn0gYCA6IFwiXCJ9JHtyb290VGl0bGV9JHtyb290U3VmZml4fWBdO1xuICByb290QmxvY2tzLmZpbHRlcigodmFsdWUpID0+IHZhbHVlICE9PSByb290VGl0bGUpLmZvckVhY2goKHZhbHVlKSA9PiBsaW5lcy5wdXNoKHZhbHVlKSk7XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE1pbmRNYXBOb2RlLCBkZXB0aDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgY29uc3QgaW5kZW50ID0gXCIgIFwiLnJlcGVhdChNYXRoLm1heCgwLCBkZXB0aCAtIDEpKTtcbiAgICBjb25zdCB0YWdzID0gbm9kZS50YWdzPy5sZW5ndGggPyBgICR7bm9kZS50YWdzLm1hcCgodGFnKSA9PiBgIyR7dGFnfWApLmpvaW4oXCIgXCIpfWAgOiBcIlwiO1xuICAgIGNvbnN0IGxpbmsgPSBub2RlLmxpbmsgPyBgIFx1MjE5MiAke25vZGUubGlua31gIDogXCJcIjtcbiAgICBjb25zdCBibG9ja3MgPSByZW5kZXJCbG9ja3Mobm9kZSk7XG4gICAgY29uc3QgZmlyc3RUZXh0ID0gYmxvY2tzLmZpbmQoKHZhbHVlKSA9PiAhdmFsdWUuc3RhcnRzV2l0aChcIiFbXCIpKSA/PyAoYmxvY2tzWzBdID8/IFwiXHU1NkZFXHU3MjQ3XHU4MjgyXHU3MEI5XCIpO1xuICAgIGxpbmVzLnB1c2goYCR7aW5kZW50fS0gJHt0YXNrUHJlZml4KG5vZGUudGFzayl9JHtub2RlLmljb24gPyBgJHtub2RlLmljb259IGAgOiBcIlwifSR7Zmlyc3RUZXh0fSR7dGFnc30ke2xpbmt9YCk7XG4gICAgYmxvY2tzLmZpbHRlcigodmFsdWUpID0+IHZhbHVlICE9PSBmaXJzdFRleHQpLmZvckVhY2goKHZhbHVlKSA9PiBsaW5lcy5wdXNoKGAke2luZGVudH0gICR7dmFsdWV9YCkpO1xuICAgIGlmIChub2RlLm5vdGUpIGxpbmVzLnB1c2goYCR7aW5kZW50fSAgPiAke25vZGUubm90ZS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiIFwiKX1gKTtcbiAgICBpZiAobm9kZS5zdWJtYXApIGxpbmVzLnB1c2goYCR7aW5kZW50fSAgPiBcdTVCNTBcdTVCRkNcdTU2RkVcdUZGMUFbWyR7bm9kZS5zdWJtYXAucGF0aH1dXWApO1xuICAgIGlmIChub2RlLnRhYmxlKSBsaW5lcy5wdXNoKFwiXCIsIC4uLnRhYmxlVG9NYXJrZG93bihub2RlLnRhYmxlKS5zcGxpdChcIlxcblwiKS5tYXAoKGxpbmUpID0+IGAke2luZGVudH0gICR7bGluZX1gKSwgXCJcIik7XG4gICAgaWYgKG5vZGUuY29kZSkgbGluZXMucHVzaChgJHtpbmRlbnR9ICBcXGBcXGBcXGAke25vZGUuY29kZS5sYW5ndWFnZSA/PyBcIlwifWAsIC4uLm5vZGUuY29kZS5jb2RlLnNwbGl0KFwiXFxuXCIpLm1hcCgobGluZSkgPT4gYCR7aW5kZW50fSAgJHtsaW5lfWApLCBgJHtpbmRlbnR9ICBcXGBcXGBcXGBgKTtcbiAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgZGVwdGggKyAxKSk7XG4gIH07XG4gIGRvYy5yb290LmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgMSkpO1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VUYXNrVGV4dCh2YWx1ZTogc3RyaW5nKTogeyB0ZXh0OiBzdHJpbmc7IHRhc2s/OiBUYXNrU3RhdHVzIH0ge1xuICBjb25zdCBtYXRjaCA9IHZhbHVlLm1hdGNoKC9eXFxbKCB8eHxYfC0pXFxdXFxzKyguKykkLyk7XG4gIGlmICghbWF0Y2gpIHJldHVybiB7IHRleHQ6IHZhbHVlIH07XG4gIGNvbnN0IG1hcmtlciA9IG1hdGNoWzFdO1xuICBjb25zdCB0YXNrOiBUYXNrU3RhdHVzID0gbWFya2VyID09PSBcInhcIiB8fCBtYXJrZXIgPT09IFwiWFwiID8gXCJkb25lXCIgOiBtYXJrZXIgPT09IFwiLVwiID8gXCJkb2luZ1wiIDogXCJ0b2RvXCI7XG4gIHJldHVybiB7IHRleHQ6IG1hdGNoWzJdPy50cmltKCkgfHwgXCJcdTRFRkJcdTUyQTFcIiwgdGFzayB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFya2Rvd25Ub0RvY3VtZW50KG1hcmtkb3duOiBzdHJpbmcsIGZhbGxiYWNrVGl0bGUgPSBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiKTogTWluZE1hcERvY3VtZW50IHtcbiAgY29uc3QgZG9jID0gY3JlYXRlRGVmYXVsdERvY3VtZW50KGZhbGxiYWNrVGl0bGUpO1xuICBkb2Mucm9vdC5jaGlsZHJlbiA9IFtdO1xuICBjb25zdCBzdGFjazogQXJyYXk8eyBsZXZlbDogbnVtYmVyOyBub2RlOiBNaW5kTWFwTm9kZSB9PiA9IFt7IGxldmVsOiAwLCBub2RlOiBkb2Mucm9vdCB9XTtcbiAgbGV0IHJvb3RBc3NpZ25lZCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBtYXJrZG93bi5zcGxpdCgvXFxyP1xcbi8pKSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbUVuZCgpO1xuICAgIGlmICghbGluZS50cmltKCkgfHwgbGluZS50cmltU3RhcnQoKS5zdGFydHNXaXRoKFwiLS0tXCIpIHx8IGxpbmUudHJpbVN0YXJ0KCkuc3RhcnRzV2l0aChcImBgYFwiKSB8fCAvXlxccyo+Ly50ZXN0KGxpbmUpKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGhlYWRpbmcgPSBsaW5lLm1hdGNoKC9eXFxzKigjezEsNn0pXFxzKyguKz8pXFxzKiQvKTtcbiAgICBjb25zdCBidWxsZXQgPSBsaW5lLm1hdGNoKC9eKFxccyopWy0qK11cXHMrKC4rPylcXHMqJC8pO1xuICAgIGNvbnN0IG51bWJlcmVkID0gbGluZS5tYXRjaCgvXihcXHMqKVxcZCtbLildXFxzKyguKz8pXFxzKiQvKTtcblxuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBjb25zdCBsZXZlbCA9IGhlYWRpbmdbMV0/Lmxlbmd0aCA/PyAxO1xuICAgICAgY29uc3QgdGV4dCA9IGhlYWRpbmdbMl0/LnRyaW0oKSA/PyBcIlx1ODI4Mlx1NzBCOVwiO1xuICAgICAgaWYgKGxldmVsID09PSAxICYmICFyb290QXNzaWduZWQpIHtcbiAgICAgICAgZG9jLnJvb3QudGV4dCA9IHRleHQ7XG4gICAgICAgIGRvYy50aXRsZSA9IHRleHQ7XG4gICAgICAgIHJvb3RBc3NpZ25lZCA9IHRydWU7XG4gICAgICAgIHN0YWNrLmxlbmd0aCA9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBub2RlID0gY3JlYXRlTm9kZSh0ZXh0KTtcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDEgJiYgKHN0YWNrLmF0KC0xKT8ubGV2ZWwgPz8gMCkgPj0gbGV2ZWwpIHN0YWNrLnBvcCgpO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSBzdGFjay5hdCgtMSk/Lm5vZGUgPz8gZG9jLnJvb3Q7XG4gICAgICAgIHBhcmVudC5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgICBzdGFjay5wdXNoKHsgbGV2ZWwsIG5vZGUgfSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0TWF0Y2ggPSBidWxsZXQgPz8gbnVtYmVyZWQ7XG4gICAgaWYgKGxpc3RNYXRjaCkge1xuICAgICAgY29uc3Qgc3BhY2VzID0gKGxpc3RNYXRjaFsxXSA/PyBcIlwiKS5yZXBsYWNlQWxsKFwiXFx0XCIsIFwiICBcIikubGVuZ3RoO1xuICAgICAgY29uc3QgbGV2ZWwgPSBNYXRoLmZsb29yKHNwYWNlcyAvIDIpICsgMjtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlVGFza1RleHQoKGxpc3RNYXRjaFsyXSA/PyBcIlx1ODI4Mlx1NzBCOVwiKS50cmltKCkpO1xuICAgICAgY29uc3Qgbm9kZSA9IGNyZWF0ZU5vZGUocGFyc2VkLnRleHQpO1xuICAgICAgbm9kZS50YXNrID0gcGFyc2VkLnRhc2s7XG4gICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMSAmJiAoc3RhY2suYXQoLTEpPy5sZXZlbCA/PyAwKSA+PSBsZXZlbCkgc3RhY2sucG9wKCk7XG4gICAgICBjb25zdCBwYXJlbnQgPSBzdGFjay5hdCgtMSk/Lm5vZGUgPz8gZG9jLnJvb3Q7XG4gICAgICBwYXJlbnQuY2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICAgIHN0YWNrLnB1c2goeyBsZXZlbCwgbm9kZSB9KTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWRvYy5yb290LmNoaWxkcmVuLmxlbmd0aCkgZG9jLnJvb3QuY2hpbGRyZW4ucHVzaChjcmVhdGVOb2RlKFwiXHU0RTNCXHU5ODk4IDFcIikpO1xuICByZXR1cm4gZG9jO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBNaW5kTWFwU3R1ZGlvUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB0eXBlIHtcbiAgQmFja2dyb3VuZFBhdHRlcm4sXG4gIEVkZ2VTdHlsZSxcbiAgRWRnZVdpZHRoTW9kZSxcbiAgRm9udEZhbWlseU1vZGUsXG4gIExheW91dE1vZGUsXG4gIE1pbmRNYXBBcHBlYXJhbmNlLFxuICBNaW5kTWFwVGhlbWVQcmVzZXRJZCxcbiAgTm9kZVNoYXBlLFxuICBUaGVtZU1vZGVcbn0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IGFwcGVhcmFuY2VGcm9tVGhlbWVQcmVzZXQsIE1JTkRNQVBfVEhFTUVfUFJFU0VUUyB9IGZyb20gXCIuL3RoZW1lc1wiO1xuXG5leHBvcnQgdHlwZSBJbWFnZUhvc3RCb2R5TW9kZSA9IFwibXVsdGlwYXJ0XCIgfCBcInJhd1wiO1xuZXhwb3J0IHR5cGUgSW1hZ2VIb3N0TWV0aG9kID0gXCJQT1NUXCIgfCBcIlBVVFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdENvbmZpZyB7XG4gIGlkOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZW5kcG9pbnQ6IHN0cmluZztcbiAgbWV0aG9kOiBJbWFnZUhvc3RNZXRob2Q7XG4gIGJvZHlNb2RlOiBJbWFnZUhvc3RCb2R5TW9kZTtcbiAgZmllbGROYW1lOiBzdHJpbmc7XG4gIGhlYWRlcnM6IHN0cmluZztcbiAgcmVzcG9uc2VQYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0Q2hvaWNlIHtcbiAgaWQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdFVwbG9hZFN1Y2Nlc3Mge1xuICBob3N0SWQ6IHN0cmluZztcbiAgaG9zdE5hbWU6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIb3N0VXBsb2FkRmFpbHVyZSB7XG4gIGhvc3RJZDogc3RyaW5nO1xuICBob3N0TmFtZTogc3RyaW5nO1xuICBlcnJvcjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSG9zdFVwbG9hZEJhdGNoIHtcbiAgc3VjY2Vzc2VzOiBJbWFnZUhvc3RVcGxvYWRTdWNjZXNzW107XG4gIGZhaWx1cmVzOiBJbWFnZUhvc3RVcGxvYWRGYWlsdXJlW107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbWFnZUhvc3RDb25maWcoaW5kZXggPSAxKTogSW1hZ2VIb3N0Q29uZmlnIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogYGhvc3RfJHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA4KX1gLFxuICAgIG5hbWU6IGBcdTU2RkVcdTVFOEEgJHtpbmRleH1gLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgZW5kcG9pbnQ6IFwiXCIsXG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBib2R5TW9kZTogXCJtdWx0aXBhcnRcIixcbiAgICBmaWVsZE5hbWU6IFwiZmlsZVwiLFxuICAgIGhlYWRlcnM6IFwiXCIsXG4gICAgcmVzcG9uc2VQYXRoOiBcImRhdGEudXJsXCJcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwU3R1ZGlvU2V0dGluZ3Mge1xuICBkZWZhdWx0Rm9sZGVyOiBzdHJpbmc7XG4gIGZpbGVQcmVmaXg6IHN0cmluZztcbiAgYXNzZXRGb2xkZXI6IHN0cmluZztcbiAgZGVmYXVsdExheW91dDogTGF5b3V0TW9kZTtcbiAgZGVmYXVsdFRoZW1lOiBUaGVtZU1vZGU7XG4gIGRlZmF1bHROb2RlU2hhcGU6IE5vZGVTaGFwZTtcbiAgcmVkaXJlY3RMZWdhY3lGaWxlczogYm9vbGVhbjtcbiAgc2hvd0dyaWQ6IGJvb2xlYW47XG4gIHNob3dUYXNrUHJvZ3Jlc3M6IGJvb2xlYW47XG4gIGF1dG9GaXRPbk9wZW46IGJvb2xlYW47XG4gIGhpc3RvcnlMaW1pdDogbnVtYmVyO1xuICBlbWJlZE1heEhlaWdodDogbnVtYmVyO1xuICBkZWZhdWx0VGhlbWVQcmVzZXQ6IE1pbmRNYXBUaGVtZVByZXNldElkO1xuICBiYWNrZ3JvdW5kQ29sb3I6IHN0cmluZztcbiAgYmFja2dyb3VuZFBhdHRlcm46IEJhY2tncm91bmRQYXR0ZXJuO1xuICBiYWNrZ3JvdW5kUGF0dGVybkNvbG9yOiBzdHJpbmc7XG4gIGZvbnRGYW1pbHk6IEZvbnRGYW1pbHlNb2RlO1xuICBjdXN0b21Gb250OiBzdHJpbmc7XG4gIGZvbnRTaXplOiBudW1iZXI7XG4gIGVkZ2VDb2xvcjogc3RyaW5nO1xuICBlZGdlV2lkdGg6IG51bWJlcjtcbiAgZWRnZVN0eWxlOiBFZGdlU3R5bGU7XG4gIGVkZ2VXaWR0aE1vZGU6IEVkZ2VXaWR0aE1vZGU7XG4gIGVkZ2VNaW5XaWR0aDogbnVtYmVyO1xuICByb290Q29sb3I6IHN0cmluZztcbiAgcm9vdFRleHRDb2xvcjogc3RyaW5nO1xuICBjb2xvcmZ1bEJyYW5jaGVzOiBib29sZWFuO1xuICBicmFuY2hDb2xvcnM6IHN0cmluZ1tdO1xuICBub2RlQmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHRleHRDb2xvcjogc3RyaW5nO1xuICBub2RlQm9yZGVyQ29sb3I6IHN0cmluZztcbiAgbm9kZUJvcmRlcldpZHRoOiBudW1iZXI7XG4gIGRlZmF1bHRUZXh0Qm9sZDogYm9vbGVhbjtcbiAgZGVmYXVsdFRleHRJdGFsaWM6IGJvb2xlYW47XG4gIGRlZmF1bHRUZXh0VW5kZXJsaW5lOiBib29sZWFuO1xuICBpbWFnZUhvc3RzOiBJbWFnZUhvc3RDb25maWdbXTtcbiAgYXV0b1VwbG9hZEVuYWJsZWQ6IGJvb2xlYW47XG4gIGF1dG9VcGxvYWREZWxheVNlY29uZHM6IG51bWJlcjtcbiAgYXV0b1VwbG9hZEhvc3RJZHM6IHN0cmluZ1tdO1xuICBkZWxldGVMb2NhbEFmdGVyVXBsb2FkOiBib29sZWFuO1xuICBpbWFnZUZhaWxvdmVyRW5hYmxlZDogYm9vbGVhbjtcbiAgaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzOiBudW1iZXI7XG4gIGltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrOiBib29sZWFuO1xuICBnbG9iYWxTZWFyY2hNYXhSZXN1bHRzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBNaW5kTWFwU3R1ZGlvU2V0dGluZ3MgPSB7XG4gIGRlZmF1bHRGb2xkZXI6IFwiXCIsXG4gIGZpbGVQcmVmaXg6IFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIsXG4gIGFzc2V0Rm9sZGVyOiBcIk1pbmRNYXAgQXNzZXRzXCIsXG4gIGRlZmF1bHRMYXlvdXQ6IFwicmlnaHRcIixcbiAgZGVmYXVsdFRoZW1lOiBcImF1dG9cIixcbiAgZGVmYXVsdE5vZGVTaGFwZTogXCJyb3VuZGVkXCIsXG4gIHJlZGlyZWN0TGVnYWN5RmlsZXM6IHRydWUsXG4gIHNob3dHcmlkOiB0cnVlLFxuICBzaG93VGFza1Byb2dyZXNzOiB0cnVlLFxuICBhdXRvRml0T25PcGVuOiB0cnVlLFxuICBoaXN0b3J5TGltaXQ6IDEyMCxcbiAgZW1iZWRNYXhIZWlnaHQ6IDUyMCxcbiAgZGVmYXVsdFRoZW1lUHJlc2V0OiBcImNsYXNzaWMtaW5kaWdvXCIsXG4gIGJhY2tncm91bmRDb2xvcjogXCIjZjhmYWZjXCIsXG4gIGJhY2tncm91bmRQYXR0ZXJuOiBcImdyaWRcIixcbiAgYmFja2dyb3VuZFBhdHRlcm5Db2xvcjogXCIjOTRhM2I4XCIsXG4gIGZvbnRGYW1pbHk6IFwib2JzaWRpYW5cIixcbiAgY3VzdG9tRm9udDogXCJcIixcbiAgZm9udFNpemU6IDE0LFxuICBlZGdlQ29sb3I6IFwiIzYzNjZmMVwiLFxuICBlZGdlV2lkdGg6IDQuMixcbiAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICBlZGdlV2lkdGhNb2RlOiBcInRhcGVyZWRcIixcbiAgZWRnZU1pbldpZHRoOiAxLjIsXG4gIHJvb3RDb2xvcjogXCIjNGY0NmU1XCIsXG4gIHJvb3RUZXh0Q29sb3I6IFwiI2ZmZmZmZlwiLFxuICBjb2xvcmZ1bEJyYW5jaGVzOiB0cnVlLFxuICBicmFuY2hDb2xvcnM6IFtcIiM0ZjQ2ZTVcIiwgXCIjMDI4NGM3XCIsIFwiIzBmNzY2ZVwiLCBcIiM3YzNhZWRcIiwgXCIjZGIyNzc3XCIsIFwiI2VhNTgwY1wiXSxcbiAgbm9kZUJhY2tncm91bmRDb2xvcjogXCIjZmZmZmZmXCIsXG4gIHRleHRDb2xvcjogXCIjMTcyMDMzXCIsXG4gIG5vZGVCb3JkZXJDb2xvcjogXCIjYzdkMmZlXCIsXG4gIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgZGVmYXVsdFRleHRCb2xkOiBmYWxzZSxcbiAgZGVmYXVsdFRleHRJdGFsaWM6IGZhbHNlLFxuICBkZWZhdWx0VGV4dFVuZGVybGluZTogZmFsc2UsXG4gIGltYWdlSG9zdHM6IFtdLFxuICBhdXRvVXBsb2FkRW5hYmxlZDogZmFsc2UsXG4gIGF1dG9VcGxvYWREZWxheVNlY29uZHM6IDEwLFxuICBhdXRvVXBsb2FkSG9zdElkczogW10sXG4gIGRlbGV0ZUxvY2FsQWZ0ZXJVcGxvYWQ6IHRydWUsXG4gIGltYWdlRmFpbG92ZXJFbmFibGVkOiB0cnVlLFxuICBpbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHM6IDgsXG4gIGltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrOiB0cnVlLFxuICBnbG9iYWxTZWFyY2hNYXhSZXN1bHRzOiAxMDBcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXR0aW5nc1RvQXBwZWFyYW5jZShzZXR0aW5nczogTWluZE1hcFN0dWRpb1NldHRpbmdzKTogTWluZE1hcEFwcGVhcmFuY2Uge1xuICByZXR1cm4ge1xuICAgIHRoZW1lUHJlc2V0OiBzZXR0aW5ncy5kZWZhdWx0VGhlbWVQcmVzZXQsXG4gICAgYmFja2dyb3VuZENvbG9yOiBzZXR0aW5ncy5iYWNrZ3JvdW5kQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIGJhY2tncm91bmRQYXR0ZXJuOiBzZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybixcbiAgICBwYXR0ZXJuQ29sb3I6IHNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIGZvbnRGYW1pbHk6IHNldHRpbmdzLmZvbnRGYW1pbHksXG4gICAgY3VzdG9tRm9udDogc2V0dGluZ3MuY3VzdG9tRm9udC50cmltKCkgfHwgdW5kZWZpbmVkLFxuICAgIGZvbnRTaXplOiBzZXR0aW5ncy5mb250U2l6ZSxcbiAgICBlZGdlQ29sb3I6IHNldHRpbmdzLmVkZ2VDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgZWRnZVdpZHRoOiBzZXR0aW5ncy5lZGdlV2lkdGgsXG4gICAgZWRnZVN0eWxlOiBzZXR0aW5ncy5lZGdlU3R5bGUsXG4gICAgZWRnZVdpZHRoTW9kZTogc2V0dGluZ3MuZWRnZVdpZHRoTW9kZSxcbiAgICBlZGdlTWluV2lkdGg6IHNldHRpbmdzLmVkZ2VNaW5XaWR0aCxcbiAgICByb290Q29sb3I6IHNldHRpbmdzLnJvb3RDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgcm9vdFRleHRDb2xvcjogc2V0dGluZ3Mucm9vdFRleHRDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgY29sb3JmdWxCcmFuY2hlczogc2V0dGluZ3MuY29sb3JmdWxCcmFuY2hlcyxcbiAgICBicmFuY2hDb2xvcnM6IHNldHRpbmdzLmJyYW5jaENvbG9ycy5sZW5ndGggPyBbLi4uc2V0dGluZ3MuYnJhbmNoQ29sb3JzXSA6IHVuZGVmaW5lZCxcbiAgICBub2RlQ29sb3I6IHNldHRpbmdzLm5vZGVCYWNrZ3JvdW5kQ29sb3IgfHwgdW5kZWZpbmVkLFxuICAgIHRleHRDb2xvcjogc2V0dGluZ3MudGV4dENvbG9yIHx8IHVuZGVmaW5lZCxcbiAgICBub2RlQm9yZGVyQ29sb3I6IHNldHRpbmdzLm5vZGVCb3JkZXJDb2xvciB8fCB1bmRlZmluZWQsXG4gICAgbm9kZUJvcmRlcldpZHRoOiBzZXR0aW5ncy5ub2RlQm9yZGVyV2lkdGgsXG4gICAgYm9sZDogc2V0dGluZ3MuZGVmYXVsdFRleHRCb2xkLFxuICAgIGl0YWxpYzogc2V0dGluZ3MuZGVmYXVsdFRleHRJdGFsaWMsXG4gICAgdW5kZXJsaW5lOiBzZXR0aW5ncy5kZWZhdWx0VGV4dFVuZGVybGluZVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlUaGVtZVByZXNldFRvU2V0dGluZ3Moc2V0dGluZ3M6IE1pbmRNYXBTdHVkaW9TZXR0aW5ncywgcHJlc2V0SWQ6IE1pbmRNYXBUaGVtZVByZXNldElkKTogdm9pZCB7XG4gIGNvbnN0IGFwcGVhcmFuY2UgPSBhcHBlYXJhbmNlRnJvbVRoZW1lUHJlc2V0KHByZXNldElkKTtcbiAgc2V0dGluZ3MuZGVmYXVsdFRoZW1lUHJlc2V0ID0gcHJlc2V0SWQ7XG4gIHNldHRpbmdzLmJhY2tncm91bmRDb2xvciA9IGFwcGVhcmFuY2UuYmFja2dyb3VuZENvbG9yID8/IFwiXCI7XG4gIHNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuID0gYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA/PyBcIm5vbmVcIjtcbiAgc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm5Db2xvciA9IGFwcGVhcmFuY2UucGF0dGVybkNvbG9yID8/IFwiIzk0YTNiOFwiO1xuICBzZXR0aW5ncy5mb250RmFtaWx5ID0gYXBwZWFyYW5jZS5mb250RmFtaWx5ID8/IFwib2JzaWRpYW5cIjtcbiAgc2V0dGluZ3MuY3VzdG9tRm9udCA9IGFwcGVhcmFuY2UuY3VzdG9tRm9udCA/PyBcIlwiO1xuICBzZXR0aW5ncy5mb250U2l6ZSA9IGFwcGVhcmFuY2UuZm9udFNpemUgPz8gMTQ7XG4gIHNldHRpbmdzLmVkZ2VDb2xvciA9IGFwcGVhcmFuY2UuZWRnZUNvbG9yID8/IFwiXCI7XG4gIHNldHRpbmdzLmVkZ2VXaWR0aCA9IGFwcGVhcmFuY2UuZWRnZVdpZHRoID8/IDIuMjtcbiAgc2V0dGluZ3MuZWRnZVN0eWxlID0gYXBwZWFyYW5jZS5lZGdlU3R5bGUgPz8gXCJjdXJ2ZWRcIjtcbiAgc2V0dGluZ3MuZWRnZVdpZHRoTW9kZSA9IGFwcGVhcmFuY2UuZWRnZVdpZHRoTW9kZSA/PyBcInVuaWZvcm1cIjtcbiAgc2V0dGluZ3MuZWRnZU1pbldpZHRoID0gYXBwZWFyYW5jZS5lZGdlTWluV2lkdGggPz8gTWF0aC5taW4oMSwgc2V0dGluZ3MuZWRnZVdpZHRoKTtcbiAgc2V0dGluZ3Mucm9vdENvbG9yID0gYXBwZWFyYW5jZS5yb290Q29sb3IgPz8gXCJcIjtcbiAgc2V0dGluZ3Mucm9vdFRleHRDb2xvciA9IGFwcGVhcmFuY2Uucm9vdFRleHRDb2xvciA/PyBcIlwiO1xuICBzZXR0aW5ncy5jb2xvcmZ1bEJyYW5jaGVzID0gYXBwZWFyYW5jZS5jb2xvcmZ1bEJyYW5jaGVzID09PSB0cnVlO1xuICBzZXR0aW5ncy5icmFuY2hDb2xvcnMgPSBhcHBlYXJhbmNlLmJyYW5jaENvbG9ycyA/IFsuLi5hcHBlYXJhbmNlLmJyYW5jaENvbG9yc10gOiBbXTtcbiAgc2V0dGluZ3Mubm9kZUJhY2tncm91bmRDb2xvciA9IGFwcGVhcmFuY2Uubm9kZUNvbG9yID8/IFwiXCI7XG4gIHNldHRpbmdzLnRleHRDb2xvciA9IGFwcGVhcmFuY2UudGV4dENvbG9yID8/IFwiXCI7XG4gIHNldHRpbmdzLm5vZGVCb3JkZXJDb2xvciA9IGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yID8/IFwiXCI7XG4gIHNldHRpbmdzLm5vZGVCb3JkZXJXaWR0aCA9IGFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IDE7XG4gIHNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZCA9IGFwcGVhcmFuY2UuYm9sZCA9PT0gdHJ1ZTtcbiAgc2V0dGluZ3MuZGVmYXVsdFRleHRJdGFsaWMgPSBhcHBlYXJhbmNlLml0YWxpYyA9PT0gdHJ1ZTtcbiAgc2V0dGluZ3MuZGVmYXVsdFRleHRVbmRlcmxpbmUgPSBhcHBlYXJhbmNlLnVuZGVybGluZSA9PT0gdHJ1ZTtcbn1cblxuZXhwb3J0IGNsYXNzIE1pbmRNYXBTdHVkaW9TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBNaW5kTWFwU3R1ZGlvUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJNaW5kTWFwIFN0dWRpb1wiIH0pO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlx1OEZEOVx1OTFDQ1x1OEJCRVx1N0Y2RVx1NTE2OFx1NUM0MFx1OUVEOFx1OEJBNFx1NTkxNlx1ODlDMlx1MzAwMlx1NjI1M1x1NUYwMFx1ODExMVx1NTZGRVx1NTQwRVx1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1NzBCOVx1NTFGQlx1NURFNVx1NTE3N1x1NjgwRlx1NEUyRFx1NzY4NFx1OEMwM1x1ODI3Mlx1Njc3Rlx1RkYwQ1x1NEUzQVx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTM1NVx1NzJFQ1x1NEZERFx1NUI1OFx1NEUwMFx1NTk1N1x1NjgzN1x1NUYwRlx1MzAwMlwiXG4gICAgfSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTRFM0JcdTk4OThcdTZBMjFcdTY3N0ZcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTRFM0JcdTk4OThcIilcbiAgICAgIC5zZXREZXNjKFwiXHU5MDA5XHU2MkU5XHU1NDBFXHU0RjFBXHU0RTAwXHU2QjIxXHU1RTk0XHU3NTI4XHU4MENDXHU2NjZGXHUzMDAxXHU4MjgyXHU3MEI5XHUzMDAxXHU1MjA2XHU2NTJGXHU5MTREXHU4MjcyXHUzMDAxXHU1QjU3XHU0RjUzXHU1NDhDXHU4RkRFXHU3RUJGXHU2ODM3XHU1RjBGXHVGRjFCXHU0RTRCXHU1NDBFXHU0RUNEXHU1M0VGXHU3RUU3XHU3RUVEXHU0RkVFXHU2NTM5XHU1MzU1XHU5ODc5XHU4QkJFXHU3RjZFXHUzMDAyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgcHJlc2V0IG9mIE1JTkRNQVBfVEhFTUVfUFJFU0VUUykgZHJvcGRvd24uYWRkT3B0aW9uKHByZXNldC5pZCwgcHJlc2V0Lm5hbWUpO1xuICAgICAgICBkcm9wZG93bi5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGhlbWVQcmVzZXQpO1xuICAgICAgICBkcm9wZG93bi5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhcHBseVRoZW1lUHJlc2V0VG9TZXR0aW5ncyh0aGlzLnBsdWdpbi5zZXR0aW5ncywgdmFsdWUgYXMgTWluZE1hcFRoZW1lUHJlc2V0SWQpO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGNvbnN0IHRoZW1lUHJldmlldyA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7IGNsczogXCJtbXMtdGhlbWUtcHJldmlldy1yb3dcIiB9KTtcbiAgICBmb3IgKGNvbnN0IHByZXNldCBvZiBNSU5ETUFQX1RIRU1FX1BSRVNFVFMpIHtcbiAgICAgIGNvbnN0IGNhcmQgPSB0aGVtZVByZXZpZXcuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICBjbHM6IGBtbXMtdGhlbWUtcHJldmlldy1jYXJkJHtwcmVzZXQuaWQgPT09IHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUaGVtZVByZXNldCA/IFwiIGlzLXNlbGVjdGVkXCIgOiBcIlwifWAsXG4gICAgICAgIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiwgdGl0bGU6IHByZXNldC5kZXNjcmlwdGlvbiB9XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHN3YXRjaGVzID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLXRoZW1lLXByZXZpZXctc3dhdGNoZXNcIiB9KTtcbiAgICAgIGNvbnN0IGNvbG9ycyA9IFtwcmVzZXQuYXBwZWFyYW5jZS5yb290Q29sb3IsIC4uLihwcmVzZXQuYXBwZWFyYW5jZS5icmFuY2hDb2xvcnMgPz8gW10pLnNsaWNlKDAsIDQpXS5maWx0ZXIoKGNvbG9yKTogY29sb3IgaXMgc3RyaW5nID0+IEJvb2xlYW4oY29sb3IpKTtcbiAgICAgIGNvbG9ycy5mb3JFYWNoKChjb2xvcikgPT4geyBjb25zdCBkb3QgPSBzd2F0Y2hlcy5jcmVhdGVTcGFuKCk7IGRvdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjsgfSk7XG4gICAgICBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbXMtdGhlbWUtcHJldmlldy1uYW1lXCIsIHRleHQ6IHByZXNldC5uYW1lIH0pO1xuICAgICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICBhcHBseVRoZW1lUHJlc2V0VG9TZXR0aW5ncyh0aGlzLnBsdWdpbi5zZXR0aW5ncywgcHJlc2V0LmlkKTtcbiAgICAgICAgdm9pZCB0aGlzLnNhdmVBbmRSZWZyZXNoKCkudGhlbigoKSA9PiB0aGlzLmRpc3BsYXkoKSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTY1ODdcdTRFRjZcdTRFMEVcdTVFMDNcdTVDNDBcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTRGRERcdTVCNThcdTY1ODdcdTRFRjZcdTU5MzlcIilcbiAgICAgIC5zZXREZXNjKFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RkREXHU1QjU4XHU1NzI4XHU1RjUzXHU1MjREXHU3QjE0XHU4QkIwXHU2MjQwXHU1NzI4XHU2NTg3XHU0RUY2XHU1OTM5XHVGRjFCXHU0RTVGXHU1M0VGXHU1ODZCXHU1MTk5XHU0RjhCXHU1OTgyIE1pbmQgTWFwc1x1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiTWluZCBNYXBzXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Rm9sZGVyKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdEZvbGRlciA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OEQ0NFx1NkU5MFx1NjU4N1x1NEVGNlx1NTkzOVwiKVxuICAgICAgLnNldERlc2MoXCJcdThCRTVcdThERUZcdTVGODRcdTc2RjhcdTVCRjlcdTRFOEVcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTYyNDBcdTU3MjhcdTc2RUVcdTVGNTVcdTMwMDJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTRGMUFcdTRGRERcdTVCNThcdTUyMzBcdTIwMUNcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTc2RUVcdTVGNTUvXHU4QkU1XHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5L1x1MjAxRFx1RkYxQlx1NUI1MFx1NUJGQ1x1NTZGRVx1NEYxQVx1NEZERFx1NUI1OFx1NTcyOFx1MjAxQ1x1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NzZFRVx1NUY1NS9cdThCRTVcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcdTU5MzkvXHU3MjM2XHU1QkZDXHU1NkZFXHU1NDBEXHU3OUYwL1x1MjAxRFx1NEUyRFx1MzAwMlx1OUVEOFx1OEJBNFx1NEY3Rlx1NzUyOCBNaW5kTWFwIEFzc2V0c1x1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiTWluZE1hcCBBc3NldHNcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmFzc2V0Rm9sZGVyKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRGb2xkZXIgPSB2YWx1ZS50cmltKCkucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIikgfHwgXCJNaW5kTWFwIEFzc2V0c1wiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTU2RkVcdTcyNDdcdTRFMEVcdTU2RkVcdTVFOEFcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdThGRENcdTdBMEJcdTU2RkVcdTcyNDdcdTgxRUFcdTUyQThcdTY1NDVcdTk2OUNcdThGNkNcdTc5RkJcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1RjUzXHU1MjREXHU1NkZFXHU1RThBXHU1NzMwXHU1NzQwXHU1MkEwXHU4RjdEXHU1OTMxXHU4RDI1XHU2MjE2XHU4RDg1XHU2NUY2XHU1NDBFXHVGRjBDXHU2MzA5XHU5NTVDXHU1MENGXHU5ODdBXHU1RThGXHU1QzFEXHU4QkQ1XHU0RTBCXHU0RTAwXHU1NzMwXHU1NzQwXHVGRjFCXHU2MjEwXHU1MjlGXHU1NDBFXHU4MUVBXHU1MkE4XHU1QzA2XHU1M0VGXHU3NTI4XHU1NzMwXHU1NzQwXHU0RkREXHU1QjU4XHU0RTNBXHU2NUIwXHU3Njg0XHU0RTNCXHU1NzMwXHU1NzQwXHUzMDAyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlckVuYWJsZWQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyRW5hYmxlZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlckVuYWJsZWQpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1NTM1NVx1NEUyQVx1OTU1Q1x1NTBDRlx1N0I0OVx1NUY4NVx1NjVGNlx1OTVGNFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1NTZGRVx1NzI0N1x1NTcyOFx1OEJFNVx1NjVGNlx1OTVGNFx1NTE4NVx1NjcyQVx1NjIxMFx1NTI5Rlx1NTJBMFx1OEY3RFx1RkYwQ1x1NUMzMVx1NUMxRFx1OEJENVx1NEUwQlx1NEUwMFx1NEUyQVx1OTU1Q1x1NTBDRlx1MzAwMlx1ODMwM1x1NTZGNCAyXHUyMDEzMzAgXHU3OUQyXHUzMDAyXCIpXG4gICAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgICAgLnNldExpbWl0cygyLCAzMCwgMSlcbiAgICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHMpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1NjcyQ1x1NTczMFx1NTI2Rlx1NjcyQ1x1NEY1Q1x1NEUzQVx1NjcwMFx1NTQwRVx1NTZERVx1OTAwMFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1OEZEQ1x1N0EwQlx1OTU1Q1x1NTBDRlx1NTE2OFx1OTBFOFx1NTkzMVx1NjU0OFx1NjVGNlx1RkYwQ1x1NTk4Mlx1Njc5Q1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NEVDRFx1NUI1OFx1NTcyOFx1RkYwQ1x1NTIxOVx1NjcwMFx1NTQwRVx1NUMxRFx1OEJENVx1NjcyQ1x1NTczMFx1NTI2Rlx1NjcyQ1x1MzAwMlwiKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjaylcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjayA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTU0MEVcdTgxRUFcdTUyQThcdTRFMEFcdTRGMjBcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1NkZFXHU3MjQ3XHU0RjFBXHU1MTQ4XHU0RkREXHU1QjU4XHU1MjMwXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU3Njg0XHU2NzJDXHU1NzMwXHU4RDQ0XHU2RTkwXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU1MThEXHU2MzA5XHU4QkJFXHU1QjlBXHU1RUY2XHU4RkRGXHU0RTBBXHU0RjIwXHUzMDAyXHU1M0VBXHU2NzA5XHU1MTY4XHU5MEU4XHU3NkVFXHU2ODA3XHU1NkZFXHU1RThBXHU2MjEwXHU1MjlGXHU1NDBFXHVGRjBDXHU2MjREXHU0RjFBXHU1MjA3XHU2MzYyXHU0RTNBXHU4RkRDXHU3QTBCXHU3RjUxXHU1NzQwXHUzMDAyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEVuYWJsZWQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkRW5hYmxlZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KSk7XG5cbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEVuYWJsZWQpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1ODFFQVx1NTJBOFx1NEUwQVx1NEYyMFx1NUVGNlx1OEZERlwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1N0M5OFx1OEQzNFx1NTQwRVx1N0I0OVx1NUY4NSAwXHUyMDEzMzAwIFx1NzlEMlx1NTE4RFx1NEUwQVx1NEYyMFx1RkYwQ1x1NEZCRlx1NEU4RVx1NjRBNFx1OTUwMFx1NjIxNlx1N0VFN1x1N0VFRFx1N0YxNlx1OEY5MVx1MzAwMlwiKVxuICAgICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAgIC5zZXRMaW1pdHMoMCwgMzAwLCAxKVxuICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWREZWxheVNlY29uZHMpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZERlbGF5U2Vjb25kcyA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJcdTUxNjhcdTkwRThcdTYyMTBcdTUyOUZcdTU0MEVcdTUyMjBcdTk2NjRcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTYzRDJcdTRFRjZcdTRGMUFcdTUxNDhcdTUxOTlcdTUxNjVcdThGRENcdTdBMEJcdTdGNTFcdTU3NDBcdTVFNzZcdTRGRERcdTVCNThcdTgxMTFcdTU2RkVcdUZGMENcdTUxOERcdTY4QzBcdTY3RTVcdTU2RkVcdTcyNDdcdTY2MkZcdTU0MjZcdTg4QUJcdTUxNzZcdTRFRDZcdTgxMTFcdTU2RkVcdTVGMTVcdTc1MjhcdUZGMUJcdTc4NkVcdThCQTRcdTVCODlcdTUxNjhcdTU0MEVcdTYyNERcdTUyMjBcdTk2NjRcdTY3MkNcdTU3MzBcdTY1ODdcdTRFRjZcdTMwMDJcdTRFRkJcdTRFMDBcdTU2RkVcdTVFOEFcdTU5MzFcdThEMjVcdTY1RjZcdTRGMUFcdTRGRERcdTc1NTlcdTY3MkNcdTU3MzBcdTU2RkVcdTcyNDdcdTMwMDJcIilcbiAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVsZXRlTG9jYWxBZnRlclVwbG9hZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWxldGVMb2NhbEFmdGVyVXBsb2FkID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdHMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUhvc3RzO1xuICAgIGNvbnN0IGhvc3RzSGVhZGVyID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0cy1oZWFkZXJcIiB9KTtcbiAgICBob3N0c0hlYWRlci5jcmVhdGVFbChcImg0XCIsIHsgdGV4dDogXCJcdTU2RkVcdTVFOEFcdTkxNERcdTdGNkVcIiB9KTtcbiAgICBjb25zdCBhZGRIb3N0ID0gaG9zdHNIZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NjVCMFx1NTg5RVx1NTZGRVx1NUU4QVwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBhZGRIb3N0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBob3N0ID0gY3JlYXRlSW1hZ2VIb3N0Q29uZmlnKGhvc3RzLmxlbmd0aCArIDEpO1xuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0cy5wdXNoKGhvc3QpO1xuICAgICAgdm9pZCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKS50aGVuKCgpID0+IHRoaXMuZGlzcGxheSgpKTtcbiAgICB9KTtcblxuICAgIGlmICghaG9zdHMubGVuZ3RoKSB7XG4gICAgICBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uIG1tcy1pbWFnZS1ob3N0LWVtcHR5XCIsIHRleHQ6IFwiXHU1QzFBXHU2NzJBXHU5MTREXHU3RjZFXHU1NkZFXHU1RThBXHUzMDAyXHU2NUIwXHU1ODlFXHU1NDBFXHU1M0VGXHU0RUU1XHU2RDRCXHU4QkQ1XHU0RTBBXHU0RjIwXHU2M0E1XHU1M0UzXHVGRjBDXHU1RTc2XHU5MDA5XHU2MkU5XHU0RTAwXHU0RTJBXHU2MjE2XHU1OTFBXHU0RTJBXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU3NkVFXHU2ODA3XHUzMDAyXCIgfSk7XG4gICAgfVxuXG4gICAgaG9zdHMuZm9yRWFjaCgoaG9zdCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNhcmQgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWltYWdlLWhvc3QtY2FyZFwiIH0pO1xuICAgICAgY29uc3QgdGl0bGUgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbXMtaW1hZ2UtaG9zdC1jYXJkLXRpdGxlXCIgfSk7XG4gICAgICB0aXRsZS5jcmVhdGVFbChcInN0cm9uZ1wiLCB7IHRleHQ6IGhvc3QubmFtZSB8fCBgXHU1NkZFXHU1RThBICR7aW5kZXggKyAxfWAgfSk7XG4gICAgICBjb25zdCBzdGF0dXMgPSB0aXRsZS5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LXN0YXR1c1wiLCB0ZXh0OiBob3N0LmVuYWJsZWQgPyBcIlx1NURGMlx1NTQyRlx1NzUyOFwiIDogXCJcdTVERjJcdTUwNUNcdTc1MjhcIiB9KTtcbiAgICAgIHN0YXR1cy50b2dnbGVDbGFzcyhcImlzLWVuYWJsZWRcIiwgaG9zdC5lbmFibGVkKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdTU0MERcdTc5RjBcIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5uYW1lKVxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihgXHU1NkZFXHU1RThBICR7aW5kZXggKyAxfWApXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaG9zdC5uYW1lID0gdmFsdWUudHJpbSgpIHx8IGBcdTU2RkVcdTVFOEEgJHtpbmRleCArIDF9YDtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAgIC5zZXRUb29sdGlwKFwiXHU1NDJGXHU3NTI4XHU4QkU1XHU1NkZFXHU1RThBXCIpXG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QuZW5hYmxlZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBob3N0LmVuYWJsZWQgPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9VcGxvYWRIb3N0SWRzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMuZmlsdGVyKChpZCkgPT4gaWQgIT09IGhvc3QuaWQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICB9KSk7XG5cbiAgICAgIG5ldyBTZXR0aW5nKGNhcmQpXG4gICAgICAgIC5zZXROYW1lKFwiXHU0RTBBXHU0RjIwIEFQSVwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImh0dHBzOi8vZXhhbXBsZS5jb20vYXBpL3VwbG9hZFwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0LmVuZHBvaW50KVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5lbmRwb2ludCA9IHZhbHVlLnRyaW0oKTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdThCRjdcdTZDNDJcdTY1QjlcdTZDRDVcdTRFMEVcdTY4M0NcdTVGMEZcIilcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKFwiUE9TVFwiLCBcIlBPU1RcIilcbiAgICAgICAgICAuYWRkT3B0aW9uKFwiUFVUXCIsIFwiUFVUXCIpXG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QubWV0aG9kKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHsgaG9zdC5tZXRob2QgPSB2YWx1ZSBhcyBJbWFnZUhvc3RNZXRob2Q7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSlcbiAgICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgICAuYWRkT3B0aW9uKFwibXVsdGlwYXJ0XCIsIFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiKVxuICAgICAgICAgIC5hZGRPcHRpb24oXCJyYXdcIiwgXCJcdTUzOUZcdTU5Q0JcdTRFOENcdThGREJcdTUyMzZcIilcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5ib2R5TW9kZSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuYm9keU1vZGUgPSB2YWx1ZSBhcyBJbWFnZUhvc3RCb2R5TW9kZTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdTY1ODdcdTRFRjZcdTVCNTdcdTZCQjVcdTU0MERcIilcbiAgICAgICAgLnNldERlc2MoXCJtdWx0aXBhcnQgXHU2QTIxXHU1RjBGXHU1RTM4XHU4OUMxXHU1MDNDXHVGRjFBZmlsZVx1MzAwMWltYWdlXHUzMDAxc291cmNlXHUzMDAyXCIpXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XG4gICAgICAgICAgLnNldFZhbHVlKGhvc3QuZmllbGROYW1lKVxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImZpbGVcIilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuZmllbGROYW1lID0gdmFsdWUudHJpbSgpIHx8IFwiZmlsZVwiOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBuZXcgU2V0dGluZyhjYXJkKVxuICAgICAgICAuc2V0TmFtZShcIlx1OEJGN1x1NkM0Mlx1NTkzNCBKU09OXCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU0RjhCXHU1OTgyIEF1dGhvcml6YXRpb25cdTMwMDFYLUFQSS1LZXlcdTMwMDJcdTVCQzZcdTk0QTVcdTRGRERcdTVCNThcdTU3MjhcdTYzRDJcdTRFRjYgZGF0YS5qc29uXHUzMDAyXCIpXG4gICAgICAgIC5hZGRUZXh0QXJlYSgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRWYWx1ZShob3N0LmhlYWRlcnMpXG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCd7XCJBdXRob3JpemF0aW9uXCI6XCJCZWFyZXIgLi4uXCJ9JylcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QuaGVhZGVycyA9IHZhbHVlLnRyaW0oKTsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgICAgbmV3IFNldHRpbmcoY2FyZClcbiAgICAgICAgLnNldE5hbWUoXCJcdThGRDRcdTU2REVcdTdGNTFcdTU3NDBcdTVCNTdcdTZCQjVcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTRGOEJcdTU5ODIgZGF0YS51cmxcdUZGMUJcdTc1NTlcdTdBN0FcdTRGMUFcdTVDMURcdThCRDVcdTVFMzhcdTg5QzFcdTVCNTdcdTZCQjVcdTMwMDJcIilcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgICAuc2V0VmFsdWUoaG9zdC5yZXNwb25zZVBhdGgpXG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiZGF0YS51cmxcIilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7IGhvc3QucmVzcG9uc2VQYXRoID0gdmFsdWUudHJpbSgpOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgICBjb25zdCBpc0F1dG9UYXJnZXQgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5pbmNsdWRlcyhob3N0LmlkKTtcbiAgICAgIG5ldyBTZXR0aW5nKGNhcmQpXG4gICAgICAgIC5zZXROYW1lKFwiXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU3NkVFXHU2ODA3XCIpXG4gICAgICAgIC5zZXREZXNjKFwiXHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHU1M0VGXHU0RUU1XHU1NDBDXHU2NUY2XHU5MDA5XHU2MkU5XHU1OTFBXHU0RTJBXHU1NkZFXHU1RThBXHVGRjFCXHU2MjRCXHU1MkE4XHU0RTBBXHU0RjIwXHU2NUY2XHU0RUNEXHU1M0VGXHU0RTM0XHU2NUY2XHU5MDA5XHU2MkU5XHU1MTc2XHU0RUQ2XHU3RUM0XHU1NDA4XHUzMDAyXCIpXG4gICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKGlzQXV0b1RhcmdldClcbiAgICAgICAgICAuc2V0RGlzYWJsZWQoIWhvc3QuZW5hYmxlZClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZCA9IG5ldyBTZXQodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSBzZWxlY3RlZC5hZGQoaG9zdC5pZCk7IGVsc2Ugc2VsZWN0ZWQuZGVsZXRlKGhvc3QuaWQpO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMgPSBBcnJheS5mcm9tKHNlbGVjdGVkKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pKTtcblxuICAgICAgY29uc3QgYWN0aW9ucyA9IGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LWFjdGlvbnNcIiB9KTtcbiAgICAgIGNvbnN0IHRlc3QgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTY4QzBcdTZENEIgQVBJIFx1OEZERVx1OTAxQVx1NjAyN1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgIHRlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGVzdC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIHRlc3Quc2V0VGV4dChcIlx1NjhDMFx1NkQ0Qlx1NEUyRFx1MjAyNlwiKTtcbiAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi50ZXN0SW1hZ2VIb3N0KGhvc3QuaWQpLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgIHRlc3QuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB0ZXN0LnNldFRleHQoXCJcdTY4QzBcdTZENEIgQVBJIFx1OEZERVx1OTAxQVx1NjAyN1wiKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHJlbW92ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTIyMFx1OTY2NFx1NTZGRVx1NUU4QVwiLCBjbHM6IFwibW9kLXdhcm5pbmdcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICByZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VIb3N0cyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlSG9zdHMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmlkICE9PSBob3N0LmlkKTtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1VwbG9hZEhvc3RJZHMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvVXBsb2FkSG9zdElkcy5maWx0ZXIoKGlkKSA9PiBpZCAhPT0gaG9zdC5pZCk7XG4gICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU1MjIwXHU5NjY0XHU1NkZFXHU1RThBXHVGRjFBJHtob3N0Lm5hbWV9YCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2NUIwXHU2NTg3XHU0RUY2XHU1NDBEXHU1MjREXHU3RjAwXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NjVCMFx1NUVGQVx1ODExMVx1NTZGRVx1NjVGNlx1NEY3Rlx1NzUyOFx1RkYxQVx1NTI0RFx1N0YwMCArIFx1NjVFNVx1NjcxRlx1NjVGNlx1OTVGNFx1MzAwMlx1NjU4N1x1NEVGNlx1NTQwRVx1N0YwMFx1NTZGQVx1NUI5QVx1NEUzQSAubWluZG1hcFx1MzAwMlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlUHJlZml4KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZVByZWZpeCA9IHZhbHVlLnRyaW0oKSB8fCBcIlx1NjAxRFx1N0VGNFx1NUJGQ1x1NTZGRVwiO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU1RTAzXHU1QzQwXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTM1NVx1NEZBN1x1OTAwMlx1NTQwOFx1NkQ0MVx1N0EwQlx1NjJDNlx1ODlFM1x1RkYwQ1x1NTNDQ1x1NEZBN1x1OTAwMlx1NTQwOFx1NTkzNFx1ODExMVx1OThDRVx1NjZCNFx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcInJpZ2h0XCIsIFwiXHU1NDExXHU1M0YzXHU1QzU1XHU1RjAwXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJiYWxhbmNlZFwiLCBcIlx1NURFNlx1NTNGM1x1NUU3M1x1ODg2MVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdExheW91dClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRMYXlvdXQgPSB2YWx1ZSBhcyBMYXlvdXRNb2RlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU5RUQ4XHU4QkE0XHU2NjBFXHU2Njk3XHU2QTIxXHU1RjBGXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwiYXV0b1wiLCBcIlx1OERERlx1OTY4RiBPYnNpZGlhblwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwibGlnaHRcIiwgXCJcdTZENDVcdTgyNzJcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImRhcmtcIiwgXCJcdTZERjFcdTgyNzJcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUaGVtZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUaGVtZSA9IHZhbHVlIGFzIFRoZW1lTW9kZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU3NTNCXHU1RTAzXHU4MENDXHU2NjZGXCIgfSk7XG5cbiAgICB0aGlzLmFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgICAgY29udGFpbmVyRWwsXG4gICAgICBcIlx1ODBDQ1x1NjY2Rlx1OTg5Q1x1ODI3MlwiLFxuICAgICAgXCJcdTc1NTlcdTdBN0FcdTY1RjZcdThEREZcdTk2OEYgT2JzaWRpYW4gXHU1RjUzXHU1MjREXHU0RTNCXHU5ODk4XHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZENvbG9yID0gdmFsdWU7IH0sXG4gICAgICBcIiNmOGZhZmNcIlxuICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTNFRlx1OTAwOVx1NjJFOVx1N0Y1MVx1NjgzQ1x1MzAwMVx1NzBCOVx1OTYzNVx1NjIxNlx1N0VBRlx1ODI3Mlx1ODBDQ1x1NjY2Rlx1MzAwMlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcIm5vbmVcIiwgXCJcdTY1RTBcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImdyaWRcIiwgXCJcdTdGNTFcdTY4M0NcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImRvdHNcIiwgXCJcdTcwQjlcdTk2MzVcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2tncm91bmRQYXR0ZXJuKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm4gPSB2YWx1ZSBhcyBCYWNrZ3JvdW5kUGF0dGVybjtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93R3JpZCA9IHZhbHVlICE9PSBcIm5vbmVcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU4MENDXHU2NjZGXHU1NkZFXHU2ODQ4XHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NjNBN1x1NTIzNlx1N0Y1MVx1NjgzQ1x1N0VCRlx1NjIxNlx1NzBCOVx1OTYzNVx1NzY4NFx1OTg5Q1x1ODI3Mlx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja2dyb3VuZFBhdHRlcm5Db2xvcixcbiAgICAgIGFzeW5jICh2YWx1ZSkgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrZ3JvdW5kUGF0dGVybkNvbG9yID0gdmFsdWUgfHwgXCIjOTRhM2I4XCI7IH0sXG4gICAgICBcIiM5NGEzYjhcIixcbiAgICAgIGZhbHNlXG4gICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlx1NUI1N1x1NEY1M1x1NEUwRVx1NjU4N1x1NUI1N1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NUI1N1x1NEY1M1wiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4gZHJvcGRvd25cbiAgICAgICAgLmFkZE9wdGlvbihcIm9ic2lkaWFuXCIsIFwiXHU4RERGXHU5NjhGIE9ic2lkaWFuXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJzYW5zXCIsIFwiXHU2NUUwXHU4ODZDXHU3RUJGXHU1QjU3XHU0RjUzXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJzZXJpZlwiLCBcIlx1ODg2Q1x1N0VCRlx1NUI1N1x1NEY1M1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwibW9ub1wiLCBcIlx1N0I0OVx1NUJCRFx1NUI1N1x1NEY1M1wiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiY3VzdG9tXCIsIFwiXHU4MUVBXHU1QjlBXHU0RTQ5XHU1QjU3XHU0RjUzXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250RmFtaWx5KVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udEZhbWlseSA9IHZhbHVlIGFzIEZvbnRGYW1pbHlNb2RlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbnRGYW1pbHkgPT09IFwiY3VzdG9tXCIpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIlx1ODFFQVx1NUI5QVx1NEU0OVx1NUI1N1x1NEY1M1x1NTQwRFx1NzlGMFwiKVxuICAgICAgICAuc2V0RGVzYyhcIlx1NTg2Qlx1NTE5OVx1N0NGQlx1N0VERlx1NEUyRFx1NURGMlx1N0VDRlx1NUI4OVx1ODhDNVx1NzY4NFx1NUI1N1x1NEY1M1x1NTQwRFx1NzlGMFx1RkYwQ1x1NEY4Qlx1NTk4MiBNaWNyb3NvZnQgWWFIZWlcdTMwMDFQaW5nRmFuZyBTQ1x1MzAwMlwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIk1pY3Jvc29mdCBZYUhlaVwiKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jdXN0b21Gb250KVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmN1c3RvbUZvbnQgPSB2YWx1ZS50cmltKCkuc2xpY2UoMCwgMTIwKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NUI1N1x1NTNGN1wiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMTBcdTIwMTMzMCBcdTUwQ0ZcdTdEMjBcdTMwMDJcdTgyODJcdTcwQjlcdTRFQ0RcdTUzRUZcdTUzNTVcdTcyRUNcdTg5ODZcdTc2RDZcdTVCNTdcdTUzRjdcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMTAsIDMwLCAxKVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9udFNpemUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb250U2l6ZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTlFRDhcdThCQTRcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU0RjdGXHU3NTI4IE9ic2lkaWFuIFx1NEUzQlx1OTg5OFx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3Mlx1RkYxQlx1NjgzOVx1ODI4Mlx1NzBCOVx1NEVDRFx1NEYxOFx1NTE0OFx1NEY3Rlx1NzUyOFx1NEUzQlx1OTg5OFx1NUYzQVx1OEMwM1x1ODI3Mlx1NzY4NFx1NUJGOVx1NkJENFx1NjU4N1x1NUI1N1x1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MudGV4dENvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnRleHRDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjMGYxNzJhXCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NjU4N1x1NUI1N1x1NTJBMFx1N0M5N1wiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0Qm9sZCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1NjU4N1x1NUI1N1x1NjU5Q1x1NEY1M1wiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0SXRhbGljKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRleHRJdGFsaWMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTY1ODdcdTVCNTdcdTRFMEJcdTUyMTJcdTdFQkZcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VGV4dFVuZGVybGluZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZXh0VW5kZXJsaW5lID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTgyODJcdTcwQjlcdTY4MzdcdTVGMEZcIiB9KTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU0RTJEXHU1RkMzXHU0RTNCXHU5ODk4XHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NjgzOVx1ODI4Mlx1NzBCOVx1NzY4NFx1ODBDQ1x1NjY2Rlx1OTg5Q1x1ODI3Mlx1MzAwMlx1NEUzQlx1OTg5OFx1NkEyMVx1Njc3Rlx1NEYxQVx1ODFFQVx1NTJBOFx1OEJCRVx1N0Y2RVx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3Mucm9vdENvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnJvb3RDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjNGY0NmU1XCJcbiAgICApO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTRFMkRcdTVGQzNcdTRFM0JcdTk4OThcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU2ODM5XHU4MjgyXHU3MEI5XHU3Njg0XHU2NTg3XHU1QjU3XHU5ODlDXHU4MjcyXHUzMDAyXCIsXG4gICAgICAoKSA9PiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yb290VGV4dENvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnJvb3RUZXh0Q29sb3IgPSB2YWx1ZTsgfSxcbiAgICAgIFwiI2ZmZmZmZlwiXG4gICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTlFRDhcdThCQTRcdTgyODJcdTcwQjlcdTVGNjJcdTcyQjZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU1M0VBXHU1RjcxXHU1NENEXHU2NzJBXHU1MzU1XHU3MkVDXHU4QkJFXHU3RjZFXHU1RjYyXHU3MkI2XHU3Njg0XHU4MjgyXHU3MEI5XHUzMDAyXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwicm91bmRlZFwiLCBcIlx1NTcwNlx1ODlEMlwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwicGlsbFwiLCBcIlx1ODBGNlx1NTZDQVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwicmVjdGFuZ2xlXCIsIFwiXHU3NkY0XHU4OUQyXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Tm9kZVNoYXBlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdE5vZGVTaGFwZSA9IHZhbHVlIGFzIE5vZGVTaGFwZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU5RUQ4XHU4QkE0XHU4MjgyXHU3MEI5XHU4MENDXHU2NjZGXHU4MjcyXCIsXG4gICAgICBcIlx1NzU1OVx1N0E3QVx1NjVGNlx1OERERlx1OTY4RiBPYnNpZGlhbiBcdTRFM0JcdTk4OThcdTMwMDJcdTUzNTVcdTRFMkFcdTgyODJcdTcwQjlcdThCQkVcdTdGNkVcdTc2ODRcdTk4OUNcdTgyNzJcdTRGMThcdTUxNDhcdTdFQTdcdTY2RjRcdTlBRDhcdTMwMDJcIixcbiAgICAgICgpID0+IHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCYWNrZ3JvdW5kQ29sb3IsXG4gICAgICBhc3luYyAodmFsdWUpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJhY2tncm91bmRDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjZmZmZmZmXCJcbiAgICApO1xuXG4gICAgdGhpcy5hZGRPcHRpb25hbENvbG9yU2V0dGluZyhcbiAgICAgIGNvbnRhaW5lckVsLFxuICAgICAgXCJcdTlFRDhcdThCQTRcdTgyODJcdTcwQjlcdThGQjlcdTY4NDZcdTk4OUNcdTgyNzJcIixcbiAgICAgIFwiXHU3NTU5XHU3QTdBXHU2NUY2XHU4RERGXHU5NjhGIE9ic2lkaWFuIFx1NEUzQlx1OTg5OFx1OEZCOVx1Njg0Nlx1OTg5Q1x1ODI3Mlx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlckNvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLm5vZGVCb3JkZXJDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjOTRhM2I4XCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OUVEOFx1OEJBNFx1ODI4Mlx1NzBCOVx1OEZCOVx1Njg0Nlx1N0M5N1x1N0VDNlwiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMFx1MjAxMzYgXHU1MENGXHU3RDIwXHVGRjFCMCBcdTg4NjhcdTc5M0FcdTY1RTBcdThGQjlcdTY4NDZcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMCwgNiwgMC41KVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mubm9kZUJvcmRlcldpZHRoID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdThGREVcdTdFQkZcdTY4MzdcdTVGMEZcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTVGNjlcdTgyNzJcdTUyMDZcdTY1MkZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU2MzA5XHU3MTY3XHU0RTJEXHU1RkMzXHU0RTNCXHU5ODk4XHU3Njg0XHU0RTAwXHU3RUE3XHU1MjA2XHU2NTJGXHU1MjA2XHU5MTREXHU5ODlDXHU4MjcyXHVGRjBDXHU1NDBDXHU0RTAwXHU1MjA2XHU2NTJGXHU3Njg0XHU4MjgyXHU3MEI5XHU4RkI5XHU2ODQ2XHU1NDhDXHU4RkRFXHU3RUJGXHU0RkREXHU2MzAxXHU0RTAwXHU4MUY0XHUzMDAyXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sb3JmdWxCcmFuY2hlcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbG9yZnVsQnJhbmNoZXMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTUyMDZcdTY1MkZcdTk4OUNcdTgyNzJcIilcbiAgICAgIC5zZXREZXNjKFwiXHU0RjdGXHU3NTI4XHU5MDE3XHU1M0Y3XHU1MjA2XHU5Njk0XHU3Njg0XHU1MzQxXHU1MTZEXHU4RkRCXHU1MjM2XHU5ODlDXHU4MjcyXHVGRjBDXHU0RTAwXHU3RUE3XHU1MjA2XHU2NTJGXHU0RjFBXHU1RkFBXHU3M0FGXHU0RjdGXHU3NTI4XHUzMDAyXCIpXG4gICAgICAuYWRkVGV4dEFyZWEoKHRleHQpID0+IHRleHRcbiAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiIzRmNDZlNSwgIzAyODRjNywgIzBmNzY2ZVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYnJhbmNoQ29sb3JzLmpvaW4oXCIsIFwiKSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJyYW5jaENvbG9ycyA9IHZhbHVlLnNwbGl0KC9bLFx1RkYwQ1xcc10rLykubWFwKChpdGVtKSA9PiBpdGVtLnRyaW0oKSkuZmlsdGVyKChpdGVtKSA9PiAvXiNbMC05YS1mXXs2fSQvaS50ZXN0KGl0ZW0pKS5zbGljZSgwLCAxMik7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU4RkRFXHU3RUJGXHU3QzdCXHU1NzhCXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxuICAgICAgICAuYWRkT3B0aW9uKFwiY3VydmVkXCIsIFwiXHU2NkYyXHU3RUJGXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJzdHJhaWdodFwiLCBcIlx1NzZGNFx1N0VCRlwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiZWxib3dcIiwgXCJcdTYyOThcdTdFQkZcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VTdHlsZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VTdHlsZSA9IHZhbHVlIGFzIEVkZ2VTdHlsZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuYWRkT3B0aW9uYWxDb2xvclNldHRpbmcoXG4gICAgICBjb250YWluZXJFbCxcbiAgICAgIFwiXHU4RkRFXHU3RUJGXHU5ODlDXHU4MjcyXCIsXG4gICAgICBcIlx1NzU1OVx1N0E3QVx1NjVGNlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEUzQlx1OTg5OFx1NUYzQVx1OEMwM1x1ODI3Mlx1MzAwMlx1ODI4Mlx1NzBCOVx1NTM1NVx1NzJFQ1x1OEJCRVx1N0Y2RVx1OTg5Q1x1ODI3Mlx1NjVGNlx1RkYwQ1x1NTNFRlx1N0VFN1x1N0VFRFx1NEUzQVx1OEJFNVx1NTIwNlx1NjUyRlx1OEZERVx1N0VCRlx1Nzc0MFx1ODI3Mlx1MzAwMlwiLFxuICAgICAgKCkgPT4gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZUNvbG9yLFxuICAgICAgYXN5bmMgKHZhbHVlKSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VDb2xvciA9IHZhbHVlOyB9LFxuICAgICAgXCIjN2M4YWE1XCJcbiAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OEZERVx1N0VCRlx1N0M5N1x1N0VDNlx1NkEyMVx1NUYwRlwiKVxuICAgICAgLnNldERlc2MoXCJcdTIwMUNcdTRFQ0VcdTdDOTdcdTUyMzBcdTdFQzZcdTIwMURcdTRGMUFcdThCQTlcdTk3NjBcdThGRDFcdTRFMkRcdTVGQzNcdTRFM0JcdTk4OThcdTc2ODRcdTdFQkZcdTY3MDBcdTdDOTdcdUZGMENcdThEOEFcdTZERjFcdTVDNDJcdThEOEFcdTdFQzZcdTMwMDJcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IGRyb3Bkb3duXG4gICAgICAgIC5hZGRPcHRpb24oXCJ1bmlmb3JtXCIsIFwiXHU3RURGXHU0RTAwXHU3Qzk3XHU3RUM2XCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJ0YXBlcmVkXCIsIFwiXHU0RUNFXHU3Qzk3XHU1MjMwXHU3RUM2XCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlV2lkdGhNb2RlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVdpZHRoTW9kZSA9IHZhbHVlIGFzIEVkZ2VXaWR0aE1vZGU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aE1vZGUgPT09IFwidGFwZXJlZFwiID8gXCJcdThENzdcdTU5Q0JcdTdDOTdcdTdFQzZcIiA6IFwiXHU4RkRFXHU3RUJGXHU3Qzk3XHU3RUM2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1OTc2MFx1OEZEMVx1NEUyRFx1NUZDM1x1NEUzQlx1OTg5OFx1NzY4NFx1OEZERVx1N0VCRlx1NUJCRFx1NUVBNlx1RkYwQ1x1ODMwM1x1NTZGNCAwLjVcdTIwMTM4IFx1NTBDRlx1N0QyMFx1MzAwMlwiKVxuICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiBzbGlkZXJcbiAgICAgICAgLnNldExpbWl0cygwLjUsIDgsIDAuMjUpXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlV2lkdGgpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlV2lkdGggPSB2YWx1ZTtcbiAgICAgICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZU1pbldpZHRoID4gdmFsdWUpIHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VNaW5XaWR0aCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgfSkpO1xuXG4gICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VXaWR0aE1vZGUgPT09IFwidGFwZXJlZFwiKSB7XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJcdTY3MkJcdTdBRUZcdTY3MDBcdTdFQzZcdTVCQkRcdTVFQTZcIilcbiAgICAgICAgLnNldERlc2MoXCJcdTZERjFcdTVDNDJcdTUyMDZcdTY1MkZcdTRFMERcdTRGMUFcdTdFQzZcdTRFOEVcdThCRTVcdTUwM0NcdUZGMENcdTgzMDNcdTU2RjQgMC4yNVx1MjAxMzQgXHU1MENGXHU3RDIwXHUzMDAyXCIpXG4gICAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgICAgLnNldExpbWl0cygwLjI1LCA0LCAwLjI1KVxuICAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVkZ2VNaW5XaWR0aClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lZGdlTWluV2lkdGggPSBNYXRoLm1pbih2YWx1ZSwgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZWRnZVdpZHRoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZUFuZFJlZnJlc2goKTtcbiAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU3RjE2XHU4RjkxXHU0RTBFXHU1MTdDXHU1QkI5XCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2MjUzXHU1RjAwXHU2NUU3XHU3MjQ4XHU4MTExXHU1NkZFXHU2NUY2XHU4MUVBXHU1MkE4XHU4RjZDXHU2MzYyXCIpXG4gICAgICAuc2V0RGVzYyhcIlx1ODFFQVx1NTJBOFx1NTIxQlx1NUVGQVx1NTQwQ1x1NTQwRCAubWluZG1hcCBcdTY1ODdcdTRFRjZcdTVFNzZcdTYyNTNcdTVGMDBcdUZGMUJcdTY1RTdcdTY1ODdcdTRFRjZcdTRGMUFcdTRGRERcdTc1NTlcdTRFM0FcdTU5MDdcdTRFRkRcdUZGMENcdTRFMERcdTRGMUFcdTg5ODZcdTc2RDZcdTYyMTZcdTUyMjBcdTk2NjRcdTMwMDJcIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4gdG9nZ2xlXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWRpcmVjdExlZ2FjeUZpbGVzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkaXJlY3RMZWdhY3lGaWxlcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2NjNFXHU3OTNBXHU0RUZCXHU1MkExXHU4RkRCXHU1RUE2XCIpXG4gICAgICAuc2V0RGVzYyhcIlx1NTcyOFx1NTMwNVx1NTQyQlx1NEVGQlx1NTJBMVx1NzY4NFx1NTIwNlx1NjUyRlx1ODI4Mlx1NzBCOVx1NUU5NVx1OTBFOFx1NjYzRVx1NzkzQVx1NUI4Q1x1NjIxMFx1NzY3RVx1NTIwNlx1NkJENFx1MzAwMlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB0b2dnbGVcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrUHJvZ3Jlc3MpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VGFza1Byb2dyZXNzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zYXZlQW5kUmVmcmVzaCgpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiXHU2MjUzXHU1RjAwXHU2NUY2XHU4MUVBXHU1MkE4XHU5MDAyXHU1RTk0XHU3NTNCXHU1RTAzXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHRvZ2dsZVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0ZpdE9uT3BlbilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9GaXRPbk9wZW4gPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NjRBNFx1OTUwMFx1NTM4Nlx1NTNGMlx1NkI2NVx1NjU3MFwiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMjBcdTIwMTM1MDBcdUZGMUJcdTY1NzBcdTUwM0NcdThEOEFcdTU5MjdcdTUzNjBcdTc1MjhcdTc2ODRcdTUxODVcdTVCNThcdThEOEFcdTU5MUFcdTMwMDJcIilcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4gc2xpZGVyXG4gICAgICAgIC5zZXRMaW1pdHMoMjAsIDUwMCwgMTApXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXQpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXQgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJcdTVENENcdTUxNjVcdTk4ODRcdTg5QzhcdTY3MDBcdTU5MjdcdTlBRDhcdTVFQTZcIilcbiAgICAgIC5zZXREZXNjKFwiXHU4MzAzXHU1NkY0IDI0MFx1MjAxMzEyMDAgXHU1MENGXHU3RDIwXHUzMDAyXCIpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDI0MCwgMTIwMCwgMjApXG4gICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbWJlZE1heEhlaWdodClcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVtYmVkTWF4SGVpZ2h0ID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiXHU1MTY4XHU1QzQwXHU2NDFDXHU3RDIyXHU3RDIyXHU1RjE1XCIgfSk7XG4gICAgY29uc3Qgc2VhcmNoU3RhdHVzID0gdGhpcy5wbHVnaW4uZ2V0R2xvYmFsU2VhcmNoSW5kZXhTdGF0dXMoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgICAgdGV4dDogc2VhcmNoU3RhdHVzLmJ1aWxkaW5nXG4gICAgICAgID8gYFx1NkI2M1x1NTcyOFx1NUVGQVx1N0FDQlx1N0QyMlx1NUYxNVx1RkYxQlx1NUY1M1x1NTI0RFx1NURGMlx1NjUzNlx1NUY1NSAke3NlYXJjaFN0YXR1cy5maWxlc30gXHU0RTJBXHU1QkZDXHU1NkZFXHUzMDAxJHtzZWFyY2hTdGF0dXMubm9kZXN9IFx1NEUyQVx1ODI4Mlx1NzBCOVx1MzAwMmBcbiAgICAgICAgOiBgXHU2NzJDXHU1NzMwXHU3RDIyXHU1RjE1XHU1REYyXHU2NTM2XHU1RjU1ICR7c2VhcmNoU3RhdHVzLmZpbGVzfSBcdTRFMkFcdTVCRkNcdTU2RkVcdTMwMDEke3NlYXJjaFN0YXR1cy5ub2Rlc30gXHU0RTJBXHU4MjgyXHU3MEI5XHUzMDAyXHU3RDIyXHU1RjE1XHU2NTg3XHU0RUY2XHU0RUM1XHU0RkREXHU1QjU4XHU1NzI4XHU2M0QyXHU0RUY2XHU3NkVFXHU1RjU1XHVGRjBDXHU0RTBEXHU0RjFBXHU0RTBBXHU0RjIwXHU3RjUxXHU3RURDXHUzMDAyYFxuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1NTM1NVx1NkIyMVx1NjcwMFx1NTkxQVx1NjYzRVx1NzkzQVx1N0VEM1x1Njc5Q1wiKVxuICAgICAgLnNldERlc2MoXCJcdTgzMDNcdTU2RjQgMjBcdTIwMTM1MDBcdTMwMDJcdTdEMjJcdTVGMTVcdTRGMUFcdTY0MUNcdTdEMjJcdTY1NzRcdTRFMkFcdTRFRDNcdTVFOTNcdTRFMkRcdTc2ODRcdTYyNDBcdTY3MDkgLm1pbmRtYXAgXHU2NTg3XHU0RUY2XHUzMDAyXCIpXG4gICAgICAuYWRkU2xpZGVyKChzbGlkZXIpID0+IHNsaWRlclxuICAgICAgICAuc2V0TGltaXRzKDIwLCA1MDAsIDEwKVxuICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZ2xvYmFsU2VhcmNoTWF4UmVzdWx0cylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmdsb2JhbFNlYXJjaE1heFJlc3VsdHMgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlx1OTFDRFx1NUVGQVx1NjQxQ1x1N0QyMlx1N0QyMlx1NUYxNVwiKVxuICAgICAgLnNldERlc2MoXCJcdTVGNTNcdTY1ODdcdTRFRjZcdTc1MzFcdTU5MTZcdTkwRThcdTU0MENcdTZCNjVcdTVERTVcdTUxNzdcdTYyNzlcdTkxQ0ZcdTRGRUVcdTY1MzlcdUZGMENcdTYyMTZcdTY0MUNcdTdEMjJcdTdFRDNcdTY3OUNcdTRFMEVcdTVCOUVcdTk2NDVcdTUxODVcdTVCQjlcdTRFMERcdTRFMDBcdTgxRjRcdTY1RjZcdTRGN0ZcdTc1MjhcdTMwMDJcIilcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4gYnV0dG9uXG4gICAgICAgIC5zZXRCdXR0b25UZXh0KFwiXHU3QUNCXHU1MzczXHU5MUNEXHU1RUZBXCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBidXR0b24uc2V0RGlzYWJsZWQodHJ1ZSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnJlYnVpbGRHbG9iYWxTZWFyY2hJbmRleCgpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGJ1dHRvbi5zZXREaXNhYmxlZChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIGFkZE9wdGlvbmFsQ29sb3JTZXR0aW5nKFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgZ2V0VmFsdWU6ICgpID0+IHN0cmluZyxcbiAgICBzZXRWYWx1ZTogKHZhbHVlOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD4sXG4gICAgZmFsbGJhY2s6IHN0cmluZyxcbiAgICBhbGxvd1Jlc2V0ID0gdHJ1ZVxuICApOiB2b2lkIHtcbiAgICBjb25zdCBzZXR0aW5nID0gbmV3IFNldHRpbmcoY29udGFpbmVyKVxuICAgICAgLnNldE5hbWUobmFtZSlcbiAgICAgIC5zZXREZXNjKGRlc2NyaXB0aW9uKVxuICAgICAgLmFkZENvbG9yUGlja2VyKChwaWNrZXIpID0+IHBpY2tlclxuICAgICAgICAuc2V0VmFsdWUoZ2V0VmFsdWUoKSB8fCBmYWxsYmFjaylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHNldFZhbHVlKHZhbHVlKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgIH0pKTtcbiAgICBpZiAoYWxsb3dSZXNldCkge1xuICAgICAgc2V0dGluZy5hZGRCdXR0b24oKGJ1dHRvbikgPT4gYnV0dG9uXG4gICAgICAgIC5zZXRCdXR0b25UZXh0KFwiXHU4RERGXHU5NjhGXHU0RTNCXHU5ODk4XCIpXG4gICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCBzZXRWYWx1ZShcIlwiKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnNhdmVBbmRSZWZyZXNoKCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNhdmVBbmRSZWZyZXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIHRoaXMucGx1Z2luLnJlZnJlc2hPcGVuVmlld3MoKTtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlIHsgTWluZE1hcEFwcGVhcmFuY2UsIE1pbmRNYXBUaGVtZVByZXNldElkIH0gZnJvbSBcIi4vbW9kZWxcIjtcblxuZXhwb3J0IGludGVyZmFjZSBNaW5kTWFwVGhlbWVQcmVzZXQge1xuICBpZDogTWluZE1hcFRoZW1lUHJlc2V0SWQ7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2U7XG59XG5cbmV4cG9ydCBjb25zdCBNSU5ETUFQX1RIRU1FX1BSRVNFVFM6IHJlYWRvbmx5IE1pbmRNYXBUaGVtZVByZXNldFtdID0gW1xuICB7XG4gICAgaWQ6IFwiY2xhc3NpYy1pbmRpZ29cIixcbiAgICBuYW1lOiBcIlx1N0VDRlx1NTE3OFx1OTc1Qlx1ODRERFwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NkUwNVx1NzIzRFx1MzAwMVx1OTAxQVx1NzUyOFx1RkYwQ1x1OTAwMlx1NTQwOFx1OTg3OVx1NzZFRVx1NEUwRVx1NzdFNVx1OEJDNlx1NjU3NFx1NzQwNlwiLFxuICAgIGFwcGVhcmFuY2U6IHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZjhmYWZjXCIsXG4gICAgICBiYWNrZ3JvdW5kUGF0dGVybjogXCJncmlkXCIsXG4gICAgICBwYXR0ZXJuQ29sb3I6IFwiIzk0YTNiOFwiLFxuICAgICAgZm9udEZhbWlseTogXCJzYW5zXCIsXG4gICAgICBmb250U2l6ZTogMTQsXG4gICAgICByb290Q29sb3I6IFwiIzRmNDZlNVwiLFxuICAgICAgcm9vdFRleHRDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICBub2RlQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgdGV4dENvbG9yOiBcIiMxNzIwMzNcIixcbiAgICAgIG5vZGVCb3JkZXJDb2xvcjogXCIjYzdkMmZlXCIsXG4gICAgICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gICAgICBlZGdlQ29sb3I6IFwiIzYzNjZmMVwiLFxuICAgICAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICAgICAgZWRnZVdpZHRoOiA0LjIsXG4gICAgICBlZGdlV2lkdGhNb2RlOiBcInRhcGVyZWRcIixcbiAgICAgIGVkZ2VNaW5XaWR0aDogMS4yLFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHJ1ZSxcbiAgICAgIGJyYW5jaENvbG9yczogW1wiIzRmNDZlNVwiLCBcIiMwMjg0YzdcIiwgXCIjMGY3NjZlXCIsIFwiIzdjM2FlZFwiLCBcIiNkYjI3NzdcIiwgXCIjZWE1ODBjXCJdXG4gICAgfVxuICB9LFxuICB7XG4gICAgaWQ6IFwib2NlYW4tYmx1ZVwiLFxuICAgIG5hbWU6IFwiXHU2REYxXHU2RDc3XHU4NEREXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU1MUI3XHU5NzU5XHUzMDAxXHU0RTEzXHU0RTFBXHVGRjBDXHU5MDAyXHU1NDA4XHU1MjA2XHU2NzkwXHU0RTBFXHU2MjgwXHU2NzJGXHU1MTg1XHU1QkI5XCIsXG4gICAgYXBwZWFyYW5jZToge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmMGY5ZmZcIixcbiAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBcImRvdHNcIixcbiAgICAgIHBhdHRlcm5Db2xvcjogXCIjN2RkM2ZjXCIsXG4gICAgICBmb250RmFtaWx5OiBcInNhbnNcIixcbiAgICAgIGZvbnRTaXplOiAxNCxcbiAgICAgIHJvb3RDb2xvcjogXCIjMDc1OTg1XCIsXG4gICAgICByb290VGV4dENvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIG5vZGVDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICB0ZXh0Q29sb3I6IFwiIzBjNGE2ZVwiLFxuICAgICAgbm9kZUJvcmRlckNvbG9yOiBcIiNiYWU2ZmRcIixcbiAgICAgIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgICAgIGVkZ2VDb2xvcjogXCIjMDI4NGM3XCIsXG4gICAgICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gICAgICBlZGdlV2lkdGg6IDQuNSxcbiAgICAgIGVkZ2VXaWR0aE1vZGU6IFwidGFwZXJlZFwiLFxuICAgICAgZWRnZU1pbldpZHRoOiAxLFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHJ1ZSxcbiAgICAgIGJyYW5jaENvbG9yczogW1wiIzAzNjlhMVwiLCBcIiMwODkxYjJcIiwgXCIjMGQ5NDg4XCIsIFwiIzI1NjNlYlwiLCBcIiM0ZjQ2ZTVcIiwgXCIjMDZiNmQ0XCJdXG4gICAgfVxuICB9LFxuICB7XG4gICAgaWQ6IFwiZm9yZXN0LWdyZWVuXCIsXG4gICAgbmFtZTogXCJcdTY4RUVcdTY3OTdcdTdFRkZcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTgxRUFcdTcxMzZcdTMwMDFcdTZDODlcdTdBMzNcdUZGMENcdTkwMDJcdTU0MDhcdThCQTFcdTUyMTJcdTRFMEVcdTYyMTBcdTk1N0ZcdTRFM0JcdTk4OThcIixcbiAgICBhcHBlYXJhbmNlOiB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2Y3ZmVlN1wiLFxuICAgICAgYmFja2dyb3VuZFBhdHRlcm46IFwiZG90c1wiLFxuICAgICAgcGF0dGVybkNvbG9yOiBcIiM4NmVmYWNcIixcbiAgICAgIGZvbnRGYW1pbHk6IFwic2Fuc1wiLFxuICAgICAgZm9udFNpemU6IDE0LFxuICAgICAgcm9vdENvbG9yOiBcIiMzZjYyMTJcIixcbiAgICAgIHJvb3RUZXh0Q29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgbm9kZUNvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIHRleHRDb2xvcjogXCIjMzY1MzE0XCIsXG4gICAgICBub2RlQm9yZGVyQ29sb3I6IFwiI2JiZjdkMFwiLFxuICAgICAgbm9kZUJvcmRlcldpZHRoOiAxLFxuICAgICAgZWRnZUNvbG9yOiBcIiM2NWEzMGRcIixcbiAgICAgIGVkZ2VTdHlsZTogXCJjdXJ2ZWRcIixcbiAgICAgIGVkZ2VXaWR0aDogNCxcbiAgICAgIGVkZ2VXaWR0aE1vZGU6IFwidGFwZXJlZFwiLFxuICAgICAgZWRnZU1pbldpZHRoOiAxLFxuICAgICAgY29sb3JmdWxCcmFuY2hlczogdHJ1ZSxcbiAgICAgIGJyYW5jaENvbG9yczogW1wiIzRkN2MwZlwiLCBcIiMxNTgwM2RcIiwgXCIjMGY3NjZlXCIsIFwiIzY1YTMwZFwiLCBcIiMwNTk2NjlcIiwgXCIjODRjYzE2XCJdXG4gICAgfVxuICB9LFxuICB7XG4gICAgaWQ6IFwic3Vuc2V0LW9yYW5nZVwiLFxuICAgIG5hbWU6IFwiXHU2NUU1XHU4NDNEXHU2QTU5XCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU2RTI5XHU2Njk2XHUzMDAxXHU2NzA5XHU2RDNCXHU1MjlCXHVGRjBDXHU5MDAyXHU1NDA4XHU1MjFCXHU2MTBGXHU0RTBFXHU4NDI1XHU5NTAwXHU1MTg1XHU1QkI5XCIsXG4gICAgYXBwZWFyYW5jZToge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmZmY3ZWRcIixcbiAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBcImdyaWRcIixcbiAgICAgIHBhdHRlcm5Db2xvcjogXCIjZmRiYTc0XCIsXG4gICAgICBmb250RmFtaWx5OiBcInNhbnNcIixcbiAgICAgIGZvbnRTaXplOiAxNCxcbiAgICAgIHJvb3RDb2xvcjogXCIjYzI0MTBjXCIsXG4gICAgICByb290VGV4dENvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIG5vZGVDb2xvcjogXCIjZmZmYWY1XCIsXG4gICAgICB0ZXh0Q29sb3I6IFwiIzdjMmQxMlwiLFxuICAgICAgbm9kZUJvcmRlckNvbG9yOiBcIiNmZWQ3YWFcIixcbiAgICAgIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgICAgIGVkZ2VDb2xvcjogXCIjZjk3MzE2XCIsXG4gICAgICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gICAgICBlZGdlV2lkdGg6IDQuNCxcbiAgICAgIGVkZ2VXaWR0aE1vZGU6IFwidGFwZXJlZFwiLFxuICAgICAgZWRnZU1pbldpZHRoOiAxLjIsXG4gICAgICBjb2xvcmZ1bEJyYW5jaGVzOiB0cnVlLFxuICAgICAgYnJhbmNoQ29sb3JzOiBbXCIjZWE1ODBjXCIsIFwiI2Y1OWUwYlwiLCBcIiNkYzI2MjZcIiwgXCIjZGIyNzc3XCIsIFwiI2Q5NzcwNlwiLCBcIiNmOTczMTZcIl1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICBpZDogXCJsYXZlbmRlci1kcmVhbVwiLFxuICAgIG5hbWU6IFwiXHU4NUIwXHU4ODYzXHU4MzQ5XCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU2N0Q0XHU1NDhDXHUzMDAxXHU0RjE4XHU5NkM1XHVGRjBDXHU5MDAyXHU1NDA4XHU5NjA1XHU4QkZCXHU3QjE0XHU4QkIwXHU0RTBFXHU3MDc1XHU2MTFGXHU2NTc0XHU3NDA2XCIsXG4gICAgYXBwZWFyYW5jZToge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmYWY1ZmZcIixcbiAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBcImRvdHNcIixcbiAgICAgIHBhdHRlcm5Db2xvcjogXCIjZDhiNGZlXCIsXG4gICAgICBmb250RmFtaWx5OiBcInNhbnNcIixcbiAgICAgIGZvbnRTaXplOiAxNCxcbiAgICAgIHJvb3RDb2xvcjogXCIjN2UyMmNlXCIsXG4gICAgICByb290VGV4dENvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIG5vZGVDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICB0ZXh0Q29sb3I6IFwiIzU4MWM4N1wiLFxuICAgICAgbm9kZUJvcmRlckNvbG9yOiBcIiNlOWQ1ZmZcIixcbiAgICAgIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgICAgIGVkZ2VDb2xvcjogXCIjYTg1NWY3XCIsXG4gICAgICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gICAgICBlZGdlV2lkdGg6IDQsXG4gICAgICBlZGdlV2lkdGhNb2RlOiBcInRhcGVyZWRcIixcbiAgICAgIGVkZ2VNaW5XaWR0aDogMSxcbiAgICAgIGNvbG9yZnVsQnJhbmNoZXM6IHRydWUsXG4gICAgICBicmFuY2hDb2xvcnM6IFtcIiM5MzMzZWFcIiwgXCIjYzAyNmQzXCIsIFwiIzdjM2FlZFwiLCBcIiNkYjI3NzdcIiwgXCIjNjM2NmYxXCIsIFwiI2E4NTVmN1wiXVxuICAgIH1cbiAgfSxcbiAge1xuICAgIGlkOiBcImNhbmR5LXBvcFwiLFxuICAgIG5hbWU6IFwiXHU3Q0Q2XHU2NzlDXHU3RjI0XHU3RUI3XCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU1OTFBXHU1RjY5XHUzMDAxXHU4RjdCXHU1RkVCXHVGRjBDXHU5MDAyXHU1NDA4XHU1OTM0XHU4MTExXHU5OENFXHU2NkI0XHU0RTBFXHU3NTFGXHU2RDNCXHU4QkIwXHU1RjU1XCIsXG4gICAgYXBwZWFyYW5jZToge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmZmY3ZmJcIixcbiAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBcImRvdHNcIixcbiAgICAgIHBhdHRlcm5Db2xvcjogXCIjZjlhOGQ0XCIsXG4gICAgICBmb250RmFtaWx5OiBcInNhbnNcIixcbiAgICAgIGZvbnRTaXplOiAxNCxcbiAgICAgIHJvb3RDb2xvcjogXCIjZGIyNzc3XCIsXG4gICAgICByb290VGV4dENvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIG5vZGVDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICB0ZXh0Q29sb3I6IFwiIzRhMTYzMFwiLFxuICAgICAgbm9kZUJvcmRlckNvbG9yOiBcIiNmYmNmZThcIixcbiAgICAgIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgICAgIGVkZ2VDb2xvcjogXCIjZWM0ODk5XCIsXG4gICAgICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gICAgICBlZGdlV2lkdGg6IDQuMixcbiAgICAgIGVkZ2VXaWR0aE1vZGU6IFwidGFwZXJlZFwiLFxuICAgICAgZWRnZU1pbldpZHRoOiAxLjEsXG4gICAgICBjb2xvcmZ1bEJyYW5jaGVzOiB0cnVlLFxuICAgICAgYnJhbmNoQ29sb3JzOiBbXCIjZWM0ODk5XCIsIFwiIzhiNWNmNlwiLCBcIiMwNmI2ZDRcIiwgXCIjMTBiOTgxXCIsIFwiI2Y1OWUwYlwiLCBcIiNmNDNmNWVcIl1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICBpZDogXCJwYXBlci1ub3RlXCIsXG4gICAgbmFtZTogXCJcdTdFQjhcdTVGMjBcdTdCMTRcdThCQjBcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTZFMjlcdTZEQTZcdTMwMDFcdTRFNjZcdTUxOTlcdTYxMUZcdUZGMENcdTkwMDJcdTU0MDhcdThCRkJcdTRFNjZcdTdCMTRcdThCQjBcdTRFMEVcdTk1N0ZcdTY1ODdcdTY4QjNcdTc0MDZcIixcbiAgICBhcHBlYXJhbmNlOiB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2ZmZmRmN1wiLFxuICAgICAgYmFja2dyb3VuZFBhdHRlcm46IFwiZ3JpZFwiLFxuICAgICAgcGF0dGVybkNvbG9yOiBcIiNkNmM4YWRcIixcbiAgICAgIGZvbnRGYW1pbHk6IFwic2VyaWZcIixcbiAgICAgIGZvbnRTaXplOiAxNSxcbiAgICAgIHJvb3RDb2xvcjogXCIjN2MyZDEyXCIsXG4gICAgICByb290VGV4dENvbG9yOiBcIiNmZmZhZjBcIixcbiAgICAgIG5vZGVDb2xvcjogXCIjZmZmYWYwXCIsXG4gICAgICB0ZXh0Q29sb3I6IFwiIzNmMmExZFwiLFxuICAgICAgbm9kZUJvcmRlckNvbG9yOiBcIiNkNmM4YWRcIixcbiAgICAgIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgICAgIGVkZ2VDb2xvcjogXCIjOWE2YjQyXCIsXG4gICAgICBlZGdlU3R5bGU6IFwiY3VydmVkXCIsXG4gICAgICBlZGdlV2lkdGg6IDMuNixcbiAgICAgIGVkZ2VXaWR0aE1vZGU6IFwidGFwZXJlZFwiLFxuICAgICAgZWRnZU1pbldpZHRoOiAwLjksXG4gICAgICBjb2xvcmZ1bEJyYW5jaGVzOiB0cnVlLFxuICAgICAgYnJhbmNoQ29sb3JzOiBbXCIjOWEzNDEyXCIsIFwiI2ExNjIwN1wiLCBcIiM0ZDdjMGZcIiwgXCIjMGY3NjZlXCIsIFwiIzdlMjJjZVwiLCBcIiNiZTEyM2NcIl1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICBpZDogXCJtaW5pbWFsLWlua1wiLFxuICAgIG5hbWU6IFwiXHU2NzgxXHU3QjgwXHU1OEE4XHU4MjcyXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU5RUQxXHU3NjdEXHU1MTRCXHU1MjM2XHVGRjBDXHU5MDAyXHU1NDA4XHU2QjYzXHU1RjBGXHU2NTg3XHU2ODYzXHU0RTBFXHU3RUQzXHU2Nzg0XHU1NkZFXCIsXG4gICAgYXBwZWFyYW5jZToge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIGJhY2tncm91bmRQYXR0ZXJuOiBcIm5vbmVcIixcbiAgICAgIHBhdHRlcm5Db2xvcjogXCIjZDFkNWRiXCIsXG4gICAgICBmb250RmFtaWx5OiBcInNhbnNcIixcbiAgICAgIGZvbnRTaXplOiAxNCxcbiAgICAgIHJvb3RDb2xvcjogXCIjMTExODI3XCIsXG4gICAgICByb290VGV4dENvbG9yOiBcIiNmZmZmZmZcIixcbiAgICAgIG5vZGVDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICB0ZXh0Q29sb3I6IFwiIzExMTgyN1wiLFxuICAgICAgbm9kZUJvcmRlckNvbG9yOiBcIiM5Y2EzYWZcIixcbiAgICAgIG5vZGVCb3JkZXJXaWR0aDogMSxcbiAgICAgIGVkZ2VDb2xvcjogXCIjNGI1NTYzXCIsXG4gICAgICBlZGdlU3R5bGU6IFwic3RyYWlnaHRcIixcbiAgICAgIGVkZ2VXaWR0aDogMy4yLFxuICAgICAgZWRnZVdpZHRoTW9kZTogXCJ0YXBlcmVkXCIsXG4gICAgICBlZGdlTWluV2lkdGg6IDAuOCxcbiAgICAgIGNvbG9yZnVsQnJhbmNoZXM6IGZhbHNlLFxuICAgICAgYnJhbmNoQ29sb3JzOiBbXCIjMTExODI3XCIsIFwiIzM3NDE1MVwiLCBcIiM0YjU1NjNcIiwgXCIjNmI3MjgwXCJdXG4gICAgfVxuICB9LFxuICB7XG4gICAgaWQ6IFwiZGFyay1uZW9uXCIsXG4gICAgbmFtZTogXCJcdTY2OTdcdTU5MUNcdTk3MTNcdTg2NzlcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTlBRDhcdTVCRjlcdTZCRDRcdTZERjFcdTgyNzJcdTRFM0JcdTk4OThcdUZGMENcdTkwMDJcdTU0MDhcdTU5MUNcdTk1RjRcdTRFMEVcdTc5RDFcdTYyODBcdTUxODVcdTVCQjlcIixcbiAgICBhcHBlYXJhbmNlOiB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzA4MGQxYVwiLFxuICAgICAgYmFja2dyb3VuZFBhdHRlcm46IFwiZG90c1wiLFxuICAgICAgcGF0dGVybkNvbG9yOiBcIiMzMzQxNTVcIixcbiAgICAgIGZvbnRGYW1pbHk6IFwic2Fuc1wiLFxuICAgICAgZm9udFNpemU6IDE0LFxuICAgICAgcm9vdENvbG9yOiBcIiM3YzNhZWRcIixcbiAgICAgIHJvb3RUZXh0Q29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgbm9kZUNvbG9yOiBcIiMxMTE4MjdcIixcbiAgICAgIHRleHRDb2xvcjogXCIjZTVlN2ViXCIsXG4gICAgICBub2RlQm9yZGVyQ29sb3I6IFwiIzMzNDE1NVwiLFxuICAgICAgbm9kZUJvcmRlcldpZHRoOiAxLFxuICAgICAgZWRnZUNvbG9yOiBcIiM4MThjZjhcIixcbiAgICAgIGVkZ2VTdHlsZTogXCJjdXJ2ZWRcIixcbiAgICAgIGVkZ2VXaWR0aDogNC42LFxuICAgICAgZWRnZVdpZHRoTW9kZTogXCJ0YXBlcmVkXCIsXG4gICAgICBlZGdlTWluV2lkdGg6IDEuMSxcbiAgICAgIGNvbG9yZnVsQnJhbmNoZXM6IHRydWUsXG4gICAgICBicmFuY2hDb2xvcnM6IFtcIiM4YjVjZjZcIiwgXCIjMjJkM2VlXCIsIFwiIzM0ZDM5OVwiLCBcIiNmNDcyYjZcIiwgXCIjZmJiZjI0XCIsIFwiIzYwYTVmYVwiXVxuICAgIH1cbiAgfSxcbiAge1xuICAgIGlkOiBcIm1pbnQtY2xlYW5cIixcbiAgICBuYW1lOiBcIlx1ODU4NFx1ODM3N1x1NkUwNVx1NjVCMFwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NkUwNVx1OTAwRlx1MzAwMVx1N0I4MFx1NkQwMVx1RkYwQ1x1OTAwMlx1NTQwOFx1NURFNVx1NEY1Q1x1NkUwNVx1NTM1NVx1NEUwRVx1NkQ0MVx1N0EwQlx1NjhCM1x1NzQwNlwiLFxuICAgIGFwcGVhcmFuY2U6IHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZjBmZGZhXCIsXG4gICAgICBiYWNrZ3JvdW5kUGF0dGVybjogXCJncmlkXCIsXG4gICAgICBwYXR0ZXJuQ29sb3I6IFwiIzk5ZjZlNFwiLFxuICAgICAgZm9udEZhbWlseTogXCJzYW5zXCIsXG4gICAgICBmb250U2l6ZTogMTQsXG4gICAgICByb290Q29sb3I6IFwiIzA0Nzg1N1wiLFxuICAgICAgcm9vdFRleHRDb2xvcjogXCIjZmZmZmZmXCIsXG4gICAgICBub2RlQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgdGV4dENvbG9yOiBcIiMxMzRlNGFcIixcbiAgICAgIG5vZGVCb3JkZXJDb2xvcjogXCIjYTdmM2QwXCIsXG4gICAgICBub2RlQm9yZGVyV2lkdGg6IDEsXG4gICAgICBlZGdlQ29sb3I6IFwiIzE0YjhhNlwiLFxuICAgICAgZWRnZVN0eWxlOiBcImN1cnZlZFwiLFxuICAgICAgZWRnZVdpZHRoOiA0LFxuICAgICAgZWRnZVdpZHRoTW9kZTogXCJ0YXBlcmVkXCIsXG4gICAgICBlZGdlTWluV2lkdGg6IDEsXG4gICAgICBjb2xvcmZ1bEJyYW5jaGVzOiB0cnVlLFxuICAgICAgYnJhbmNoQ29sb3JzOiBbXCIjMDU5NjY5XCIsIFwiIzBkOTQ4OFwiLCBcIiMwODkxYjJcIiwgXCIjNjVhMzBkXCIsIFwiIzAyODRjN1wiLCBcIiMxMGI5ODFcIl1cbiAgICB9XG4gIH1cbl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNaW5kTWFwVGhlbWVQcmVzZXQoaWQ6IE1pbmRNYXBUaGVtZVByZXNldElkIHwgdW5kZWZpbmVkKTogTWluZE1hcFRoZW1lUHJlc2V0IHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIE1JTkRNQVBfVEhFTUVfUFJFU0VUUy5maW5kKChwcmVzZXQpID0+IHByZXNldC5pZCA9PT0gaWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwZWFyYW5jZUZyb21UaGVtZVByZXNldChpZDogTWluZE1hcFRoZW1lUHJlc2V0SWQpOiBNaW5kTWFwQXBwZWFyYW5jZSB7XG4gIGNvbnN0IHByZXNldCA9IGdldE1pbmRNYXBUaGVtZVByZXNldChpZCkgPz8gTUlORE1BUF9USEVNRV9QUkVTRVRTWzBdO1xuICByZXR1cm4ge1xuICAgIC4uLnByZXNldC5hcHBlYXJhbmNlLFxuICAgIHRoZW1lUHJlc2V0OiBwcmVzZXQuaWQsXG4gICAgYnJhbmNoQ29sb3JzOiBwcmVzZXQuYXBwZWFyYW5jZS5icmFuY2hDb2xvcnMgPyBbLi4ucHJlc2V0LmFwcGVhcmFuY2UuYnJhbmNoQ29sb3JzXSA6IHVuZGVmaW5lZFxuICB9O1xufVxuIiwgImltcG9ydCB7IG5vZGVDb250ZW50QmxvY2tzLCBub2RlUGxhaW5UZXh0LCB0eXBlIEVkZ2VTdHlsZSwgdHlwZSBGb250RmFtaWx5TW9kZSwgdHlwZSBMYXlvdXRNb2RlLCB0eXBlIE1pbmRNYXBBcHBlYXJhbmNlLCB0eXBlIE1pbmRNYXBOb2RlLCB0eXBlIE1pbmRNYXBUZXh0UnVuLCB0eXBlIE5vZGVTaGFwZSB9IGZyb20gXCIuL21vZGVsXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9kZVBvc2l0aW9uIHtcbiAgbm9kZTogTWluZE1hcE5vZGU7XG4gIHBhcmVudElkOiBzdHJpbmcgfCBudWxsO1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbiAgZGVwdGg6IG51bWJlcjtcbiAgc2lkZTogLTEgfCAwIHwgMTtcbiAgd2lkdGg6IG51bWJlcjtcbiAgaGVpZ2h0OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGF5b3V0UmVzdWx0IHtcbiAgbm9kZXM6IE5vZGVQb3NpdGlvbltdO1xuICBieUlkOiBNYXA8c3RyaW5nLCBOb2RlUG9zaXRpb24+O1xuICBtaW5YOiBudW1iZXI7XG4gIG1heFg6IG51bWJlcjtcbiAgbWluWTogbnVtYmVyO1xuICBtYXhZOiBudW1iZXI7XG59XG5cbmNvbnN0IFJPT1RfV0lEVEggPSAxOTY7XG5jb25zdCBOT0RFX1dJRFRIID0gMTc2O1xuY29uc3QgSF9HQVAgPSAxMTI7XG5jb25zdCBWX0dBUCA9IDI0O1xuXG5mdW5jdGlvbiB2aXNpYmxlQ2hpbGRyZW4obm9kZTogTWluZE1hcE5vZGUpOiBNaW5kTWFwTm9kZVtdIHtcbiAgcmV0dXJuIG5vZGUuY29sbGFwc2VkID8gW10gOiBub2RlLmNoaWxkcmVuO1xufVxuXG5mdW5jdGlvbiBub2RlRGltZW5zaW9ucyhub2RlOiBNaW5kTWFwTm9kZSwgZGVwdGg6IG51bWJlciwgZGVmYXVsdEZvbnRTaXplID0gMTQpOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0ge1xuICBjb25zdCBmb250U2l6ZSA9IG5vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZTtcbiAgY29uc3QgZXh0cmFXaWR0aCA9IE1hdGgubWF4KDAsIGZvbnRTaXplIC0gMTQpICogNDtcbiAgbGV0IHdpZHRoID0gKGRlcHRoID09PSAwID8gUk9PVF9XSURUSCA6IE5PREVfV0lEVEgpICsgZXh0cmFXaWR0aDtcbiAgbGV0IGhlaWdodCA9IDI4ICsgTWF0aC5tYXgoMCwgZm9udFNpemUgLSAxNCkgKiAxLjQ7XG4gIGNvbnN0IGJsb2NrcyA9IG5vZGVDb250ZW50QmxvY2tzKG5vZGUpO1xuICBpZiAoIWJsb2Nrcy5sZW5ndGgpIGhlaWdodCArPSBkZXB0aCA9PT0gMCA/IDM0IDogMjY7XG4gIGZvciAoY29uc3QgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgaWYgKGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikgeyB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCAyNDApOyBoZWlnaHQgKz0gMTMyOyB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCBsZW5ndGggPSBNYXRoLm1heCgxLCBibG9jay50ZXh0Lmxlbmd0aCk7XG4gICAgICB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCBNYXRoLm1pbig0NjAsIDgwICsgTWF0aC5taW4obGVuZ3RoLCA0MikgKiBmb250U2l6ZSAqIDAuNjIpKTtcbiAgICAgIGhlaWdodCArPSBNYXRoLm1heCgzMCwgTWF0aC5jZWlsKGxlbmd0aCAvIDM0KSAqIChmb250U2l6ZSArIDgpKTtcbiAgICB9XG4gIH1cbiAgaWYgKG5vZGUudGFncz8ubGVuZ3RoKSBoZWlnaHQgKz0gMjA7XG4gIGlmIChub2RlLnN1Ym1hcCkgeyB3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCAyMjApOyBoZWlnaHQgKz0gMzA7IH1cbiAgaWYgKG5vZGUudGFibGUpIHtcbiAgICBjb25zdCBjb2x1bW5zID0gTWF0aC5tYXgoMSwgbm9kZS50YWJsZS5oZWFkZXJzLmxlbmd0aCk7XG4gICAgY29uc3QgdmlzaWJsZVJvd3MgPSBNYXRoLm1pbigxMCwgbm9kZS50YWJsZS5yb3dzLmxlbmd0aCk7XG4gICAgd2lkdGggPSBNYXRoLm1pbig3MjAsIE1hdGgubWF4KDMwMCwgY29sdW1ucyAqIDEyNCkpO1xuICAgIGhlaWdodCArPSA0MiArIHZpc2libGVSb3dzICogMzEgKyAobm9kZS50YWJsZS5yb3dzLmxlbmd0aCA+IHZpc2libGVSb3dzID8gMjQgOiAwKTtcbiAgfVxuICBpZiAobm9kZS5jb2RlKSB7XG4gICAgY29uc3QgbGluZXMgPSBub2RlLmNvZGUuY29kZS5zcGxpdCgvXFxyP1xcbi8pO1xuICAgIGNvbnN0IGxvbmdlc3QgPSBNYXRoLm1heCgyMCwgLi4ubGluZXMuc2xpY2UoMCwgODApLm1hcCgobGluZSkgPT4gbGluZS5sZW5ndGgpKTtcbiAgICB3aWR0aCA9IE1hdGgubWluKDcyMCwgTWF0aC5tYXgoMzgwLCBsb25nZXN0ICogNy4yICsgNDIpKTtcbiAgICBoZWlnaHQgKz0gTWF0aC5taW4oMzkwLCBNYXRoLm1heCgxMDAsIE1hdGgubWluKGxpbmVzLmxlbmd0aCwgMTgpICogMjAgKyA0OCkpO1xuICB9XG4gIHJldHVybiB7IHdpZHRoLCBoZWlnaHQ6IE1hdGgubWluKDU2MCwgaGVpZ2h0KSB9O1xufVxuXG5mdW5jdGlvbiBzdWJ0cmVlSGVpZ2h0KG5vZGU6IE1pbmRNYXBOb2RlLCBkZXB0aDogbnVtYmVyLCBkZWZhdWx0Rm9udFNpemUgPSAxNCk6IG51bWJlciB7XG4gIGNvbnN0IG93bkhlaWdodCA9IG5vZGVEaW1lbnNpb25zKG5vZGUsIGRlcHRoLCBkZWZhdWx0Rm9udFNpemUpLmhlaWdodDtcbiAgY29uc3QgY2hpbGRyZW4gPSB2aXNpYmxlQ2hpbGRyZW4obm9kZSk7XG4gIGlmICghY2hpbGRyZW4ubGVuZ3RoKSByZXR1cm4gb3duSGVpZ2h0O1xuICBjb25zdCBjaGlsZHJlbkhlaWdodCA9IGNoaWxkcmVuLnJlZHVjZSgoc3VtLCBjaGlsZCkgPT4gc3VtICsgc3VidHJlZUhlaWdodChjaGlsZCwgZGVwdGggKyAxLCBkZWZhdWx0Rm9udFNpemUpLCAwKSArIFZfR0FQICogKGNoaWxkcmVuLmxlbmd0aCAtIDEpO1xuICByZXR1cm4gTWF0aC5tYXgob3duSGVpZ2h0LCBjaGlsZHJlbkhlaWdodCk7XG59XG5cbmZ1bmN0aW9uIGxheW91dEJyYW5jaChcbiAgbm9kZTogTWluZE1hcE5vZGUsXG4gIHBhcmVudElkOiBzdHJpbmcsXG4gIHBhcmVudFg6IG51bWJlcixcbiAgcGFyZW50V2lkdGg6IG51bWJlcixcbiAgc2lkZTogLTEgfCAxLFxuICBkZXB0aDogbnVtYmVyLFxuICBjZW50ZXJZOiBudW1iZXIsXG4gIG91dHB1dDogTm9kZVBvc2l0aW9uW10sXG4gIGRlZmF1bHRGb250U2l6ZSA9IDE0XG4pOiB2b2lkIHtcbiAgY29uc3QgZGltZW5zaW9ucyA9IG5vZGVEaW1lbnNpb25zKG5vZGUsIGRlcHRoLCBkZWZhdWx0Rm9udFNpemUpO1xuICBjb25zdCB4ID0gcGFyZW50WCArIHNpZGUgKiAocGFyZW50V2lkdGggLyAyICsgSF9HQVAgKyBkaW1lbnNpb25zLndpZHRoIC8gMik7XG4gIG91dHB1dC5wdXNoKHsgbm9kZSwgcGFyZW50SWQsIHgsIHk6IGNlbnRlclksIGRlcHRoLCBzaWRlLCAuLi5kaW1lbnNpb25zIH0pO1xuICBjb25zdCBjaGlsZHJlbiA9IHZpc2libGVDaGlsZHJlbihub2RlKTtcbiAgaWYgKCFjaGlsZHJlbi5sZW5ndGgpIHJldHVybjtcblxuICBjb25zdCBoZWlnaHRzID0gY2hpbGRyZW4ubWFwKChjaGlsZCkgPT4gc3VidHJlZUhlaWdodChjaGlsZCwgZGVwdGggKyAxLCBkZWZhdWx0Rm9udFNpemUpKTtcbiAgY29uc3QgdG90YWxIZWlnaHQgPSBoZWlnaHRzLnJlZHVjZSgoc3VtLCBjaGlsZEhlaWdodCkgPT4gc3VtICsgY2hpbGRIZWlnaHQsIDApICsgVl9HQVAgKiAoY2hpbGRyZW4ubGVuZ3RoIC0gMSk7XG4gIGxldCBjdXJzb3IgPSBjZW50ZXJZIC0gdG90YWxIZWlnaHQgLyAyO1xuICBjaGlsZHJlbi5mb3JFYWNoKChjaGlsZCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBjaGlsZEhlaWdodCA9IGhlaWdodHNbaW5kZXhdID8/IG5vZGVEaW1lbnNpb25zKGNoaWxkLCBkZXB0aCArIDEsIGRlZmF1bHRGb250U2l6ZSkuaGVpZ2h0O1xuICAgIGNvbnN0IGNoaWxkQ2VudGVyID0gY3Vyc29yICsgY2hpbGRIZWlnaHQgLyAyO1xuICAgIGxheW91dEJyYW5jaChjaGlsZCwgbm9kZS5pZCwgeCwgZGltZW5zaW9ucy53aWR0aCwgc2lkZSwgZGVwdGggKyAxLCBjaGlsZENlbnRlciwgb3V0cHV0LCBkZWZhdWx0Rm9udFNpemUpO1xuICAgIGN1cnNvciArPSBjaGlsZEhlaWdodCArIFZfR0FQO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMYXlvdXQocm9vdDogTWluZE1hcE5vZGUsIG1vZGU6IExheW91dE1vZGUsIGRlZmF1bHRGb250U2l6ZSA9IDE0KTogTGF5b3V0UmVzdWx0IHtcbiAgY29uc3Qgcm9vdERpbWVuc2lvbnMgPSBub2RlRGltZW5zaW9ucyhyb290LCAwLCBkZWZhdWx0Rm9udFNpemUpO1xuICBjb25zdCBub2RlczogTm9kZVBvc2l0aW9uW10gPSBbXG4gICAgeyBub2RlOiByb290LCBwYXJlbnRJZDogbnVsbCwgeDogMCwgeTogMCwgZGVwdGg6IDAsIHNpZGU6IDAsIC4uLnJvb3REaW1lbnNpb25zIH1cbiAgXTtcbiAgY29uc3QgY2hpbGRyZW4gPSB2aXNpYmxlQ2hpbGRyZW4ocm9vdCk7XG5cbiAgaWYgKG1vZGUgPT09IFwiYmFsYW5jZWRcIiAmJiBjaGlsZHJlbi5sZW5ndGggPiAxKSB7XG4gICAgY29uc3QgbGVmdDogTWluZE1hcE5vZGVbXSA9IFtdO1xuICAgIGNvbnN0IHJpZ2h0OiBNaW5kTWFwTm9kZVtdID0gW107XG4gICAgbGV0IGxlZnRIZWlnaHQgPSAwO1xuICAgIGxldCByaWdodEhlaWdodCA9IDA7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBbLi4uY2hpbGRyZW5dLnNvcnQoKGEsIGIpID0+IHN1YnRyZWVIZWlnaHQoYiwgMSwgZGVmYXVsdEZvbnRTaXplKSAtIHN1YnRyZWVIZWlnaHQoYSwgMSwgZGVmYXVsdEZvbnRTaXplKSkpIHtcbiAgICAgIGNvbnN0IGhlaWdodCA9IHN1YnRyZWVIZWlnaHQoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkgKyBWX0dBUDtcbiAgICAgIGlmIChsZWZ0SGVpZ2h0IDw9IHJpZ2h0SGVpZ2h0KSB7XG4gICAgICAgIGxlZnQucHVzaChjaGlsZCk7XG4gICAgICAgIGxlZnRIZWlnaHQgKz0gaGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmlnaHQucHVzaChjaGlsZCk7XG4gICAgICAgIHJpZ2h0SGVpZ2h0ICs9IGhlaWdodDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwbGFjZVNpZGUgPSAoaXRlbXM6IE1pbmRNYXBOb2RlW10sIHNpZGU6IC0xIHwgMSk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgaGVpZ2h0cyA9IGl0ZW1zLm1hcCgoY2hpbGQpID0+IHN1YnRyZWVIZWlnaHQoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkpO1xuICAgICAgY29uc3QgdG90YWwgPSBoZWlnaHRzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApICsgVl9HQVAgKiBNYXRoLm1heCgwLCBpdGVtcy5sZW5ndGggLSAxKTtcbiAgICAgIGxldCBjdXJzb3IgPSAtdG90YWwgLyAyO1xuICAgICAgaXRlbXMuZm9yRWFjaCgoY2hpbGQsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGhlaWdodHNbaW5kZXhdID8/IG5vZGVEaW1lbnNpb25zKGNoaWxkLCAxLCBkZWZhdWx0Rm9udFNpemUpLmhlaWdodDtcbiAgICAgICAgbGF5b3V0QnJhbmNoKGNoaWxkLCByb290LmlkLCAwLCByb290RGltZW5zaW9ucy53aWR0aCwgc2lkZSwgMSwgY3Vyc29yICsgaGVpZ2h0IC8gMiwgbm9kZXMsIGRlZmF1bHRGb250U2l6ZSk7XG4gICAgICAgIGN1cnNvciArPSBoZWlnaHQgKyBWX0dBUDtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcGxhY2VTaWRlKGxlZnQsIC0xKTtcbiAgICBwbGFjZVNpZGUocmlnaHQsIDEpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGhlaWdodHMgPSBjaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiBzdWJ0cmVlSGVpZ2h0KGNoaWxkLCAxLCBkZWZhdWx0Rm9udFNpemUpKTtcbiAgICBjb25zdCB0b3RhbCA9IGhlaWdodHMucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkgKyBWX0dBUCAqIE1hdGgubWF4KDAsIGNoaWxkcmVuLmxlbmd0aCAtIDEpO1xuICAgIGxldCBjdXJzb3IgPSAtdG90YWwgLyAyO1xuICAgIGNoaWxkcmVuLmZvckVhY2goKGNoaWxkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgaGVpZ2h0ID0gaGVpZ2h0c1tpbmRleF0gPz8gbm9kZURpbWVuc2lvbnMoY2hpbGQsIDEsIGRlZmF1bHRGb250U2l6ZSkuaGVpZ2h0O1xuICAgICAgbGF5b3V0QnJhbmNoKGNoaWxkLCByb290LmlkLCAwLCByb290RGltZW5zaW9ucy53aWR0aCwgMSwgMSwgY3Vyc29yICsgaGVpZ2h0IC8gMiwgbm9kZXMsIGRlZmF1bHRGb250U2l6ZSk7XG4gICAgICBjdXJzb3IgKz0gaGVpZ2h0ICsgVl9HQVA7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBieUlkID0gbmV3IE1hcChub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBbcG9zaXRpb24ubm9kZS5pZCwgcG9zaXRpb25dKSk7XG4gIGNvbnN0IG1pblggPSBNYXRoLm1pbiguLi5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi54IC0gcG9zaXRpb24ud2lkdGggLyAyKSk7XG4gIGNvbnN0IG1heFggPSBNYXRoLm1heCguLi5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi54ICsgcG9zaXRpb24ud2lkdGggLyAyKSk7XG4gIGNvbnN0IG1pblkgPSBNYXRoLm1pbiguLi5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi55IC0gcG9zaXRpb24uaGVpZ2h0IC8gMikpO1xuICBjb25zdCBtYXhZID0gTWF0aC5tYXgoLi4ubm9kZXMubWFwKChwb3NpdGlvbikgPT4gcG9zaXRpb24ueSArIHBvc2l0aW9uLmhlaWdodCAvIDIpKTtcbiAgcmV0dXJuIHsgbm9kZXMsIGJ5SWQsIG1pblgsIG1heFgsIG1pblksIG1heFkgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRCcmFuY2hDb2xvck1hcChyb290OiBNaW5kTWFwTm9kZSwgY29sb3JzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCk6IE1hcDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBpZiAoIWNvbG9ycz8ubGVuZ3RoKSByZXR1cm4gcmVzdWx0O1xuICBjb25zdCB2aXNpdCA9IChub2RlOiBNaW5kTWFwTm9kZSwgY29sb3I6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIHJlc3VsdC5zZXQobm9kZS5pZCwgY29sb3IpO1xuICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHZpc2l0KGNoaWxkLCBjb2xvcikpO1xuICB9O1xuICByb290LmNoaWxkcmVuLmZvckVhY2goKGNoaWxkLCBpbmRleCkgPT4gdmlzaXQoY2hpbGQsIGNvbG9yc1tpbmRleCAlIGNvbG9ycy5sZW5ndGhdISkpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWRnZVdpZHRoRm9yRGVwdGgoYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UsIGRlcHRoOiBudW1iZXIsIG1heERlcHRoID0gNSk6IG51bWJlciB7XG4gIGNvbnN0IG1heGltdW0gPSBNYXRoLm1heCgwLjUsIE1hdGgubWluKDgsIGFwcGVhcmFuY2UuZWRnZVdpZHRoID8/IDIuMikpO1xuICBpZiAoYXBwZWFyYW5jZS5lZGdlV2lkdGhNb2RlICE9PSBcInRhcGVyZWRcIikgcmV0dXJuIG1heGltdW07XG4gIGNvbnN0IG1pbmltdW0gPSBNYXRoLm1heCgwLjI1LCBNYXRoLm1pbihtYXhpbXVtLCBhcHBlYXJhbmNlLmVkZ2VNaW5XaWR0aCA/PyBNYXRoLm1pbigxLCBtYXhpbXVtKSkpO1xuICBjb25zdCBkZWVwZXN0ID0gTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihtYXhEZXB0aCkpO1xuICAvLyBUaGUgZmlyc3QgZWRnZSBzdGF5cyBhdCB0aGUgY29uZmlndXJlZCBtYXhpbXVtLiBUaGUgZGVlcGVzdCB2aXNpYmxlIGVkZ2VcbiAgLy8gcmVhY2hlcyB0aGUgY29uZmlndXJlZCBtaW5pbXVtLCBzbyB0YXBlcmluZyByZW1haW5zIG9idmlvdXMgZXZlbiBpbiBhXG4gIC8vIHNoYWxsb3cgdHdvLSBvciB0aHJlZS1sZXZlbCBtYXAuXG4gIGNvbnN0IHByb2dyZXNzID0gZGVlcGVzdCA8PSAxID8gMCA6IE1hdGgubWluKDEsIE1hdGgubWF4KDAsIGRlcHRoIC0gMSkgLyAoZGVlcGVzdCAtIDEpKTtcbiAgcmV0dXJuIE51bWJlcigobWF4aW11bSArIChtaW5pbXVtIC0gbWF4aW11bSkgKiBwcm9ncmVzcykudG9GaXhlZCgzKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlZGdlUGF0aChwYXJlbnQ6IE5vZGVQb3NpdGlvbiwgY2hpbGQ6IE5vZGVQb3NpdGlvbiwgc3R5bGU6IEVkZ2VTdHlsZSA9IFwiY3VydmVkXCIpOiBzdHJpbmcge1xuICBjb25zdCBwYXJlbnRYID0gcGFyZW50LnggKyAoY2hpbGQuc2lkZSA+PSAwID8gcGFyZW50LndpZHRoIC8gMiA6IC1wYXJlbnQud2lkdGggLyAyKTtcbiAgY29uc3QgY2hpbGRYID0gY2hpbGQueCAtIChjaGlsZC5zaWRlID49IDAgPyBjaGlsZC53aWR0aCAvIDIgOiAtY2hpbGQud2lkdGggLyAyKTtcbiAgaWYgKHN0eWxlID09PSBcInN0cmFpZ2h0XCIpIHJldHVybiBgTSAke3BhcmVudFh9ICR7cGFyZW50Lnl9IEwgJHtjaGlsZFh9ICR7Y2hpbGQueX1gO1xuICBjb25zdCBtaWRkbGVYID0gcGFyZW50WCArIChjaGlsZFggLSBwYXJlbnRYKSAqIDAuNTtcbiAgaWYgKHN0eWxlID09PSBcImVsYm93XCIpIHJldHVybiBgTSAke3BhcmVudFh9ICR7cGFyZW50Lnl9IEwgJHttaWRkbGVYfSAke3BhcmVudC55fSBMICR7bWlkZGxlWH0gJHtjaGlsZC55fSBMICR7Y2hpbGRYfSAke2NoaWxkLnl9YDtcbiAgcmV0dXJuIGBNICR7cGFyZW50WH0gJHtwYXJlbnQueX0gQyAke21pZGRsZVh9ICR7cGFyZW50Lnl9LCAke21pZGRsZVh9ICR7Y2hpbGQueX0sICR7Y2hpbGRYfSAke2NoaWxkLnl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZVhtbCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1s8PiZcIiddL2csIChjaGFyYWN0ZXIpID0+IHtcbiAgICBjb25zdCBlbnRpdGllczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgXCI8XCI6IFwiJmx0O1wiLCBcIj5cIjogXCImZ3Q7XCIsIFwiJlwiOiBcIiZhbXA7XCIsICdcIic6IFwiJnF1b3Q7XCIsIFwiJ1wiOiBcIiZhcG9zO1wiIH07XG4gICAgcmV0dXJuIGVudGl0aWVzW2NoYXJhY3Rlcl0gPz8gY2hhcmFjdGVyO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdmFsaWRDb2xvcih2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBmYWxsYmFjazogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlICYmIC9eI1swLTlhLWZdezZ9JC9pLnRlc3QodmFsdWUpID8gdmFsdWUgOiBmYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gc3ZnUmFkaXVzKHNoYXBlOiBOb2RlU2hhcGUgfCB1bmRlZmluZWQpOiBudW1iZXIge1xuICBpZiAoc2hhcGUgPT09IFwicmVjdGFuZ2xlXCIpIHJldHVybiAzO1xuICBpZiAoc2hhcGUgPT09IFwicGlsbFwiKSByZXR1cm4gMjg7XG4gIHJldHVybiAxNDtcbn1cblxuZnVuY3Rpb24gdGFza0dseXBoKG5vZGU6IE1pbmRNYXBOb2RlKTogc3RyaW5nIHtcbiAgaWYgKG5vZGUudGFzayA9PT0gXCJkb25lXCIpIHJldHVybiBcIlx1MjcxMyBcIjtcbiAgaWYgKG5vZGUudGFzayA9PT0gXCJkb2luZ1wiKSByZXR1cm4gXCJcdTI1RDAgXCI7XG4gIGlmIChub2RlLnRhc2sgPT09IFwidG9kb1wiKSByZXR1cm4gXCJcdTI1Q0IgXCI7XG4gIHJldHVybiBcIlwiO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZVJ1bnMocnVuczogTWluZE1hcFRleHRSdW5bXSwgbWF4TGVuZ3RoOiBudW1iZXIpOiBNaW5kTWFwVGV4dFJ1bltdIHtcbiAgY29uc3QgcmVzdWx0OiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gIGxldCByZW1haW5pbmcgPSBtYXhMZW5ndGg7XG4gIGxldCB0cnVuY2F0ZWQgPSBmYWxzZTtcbiAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgIGlmIChyZW1haW5pbmcgPD0gMCkgeyB0cnVuY2F0ZWQgPSB0cnVlOyBicmVhazsgfVxuICAgIGlmIChydW4udGV4dC5sZW5ndGggPD0gcmVtYWluaW5nKSB7XG4gICAgICByZXN1bHQucHVzaCh7IHRleHQ6IHJ1bi50ZXh0LCBzdHlsZTogcnVuLnN0eWxlIH0pO1xuICAgICAgcmVtYWluaW5nIC09IHJ1bi50ZXh0Lmxlbmd0aDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICByZXN1bHQucHVzaCh7IHRleHQ6IHJ1bi50ZXh0LnNsaWNlKDAsIHJlbWFpbmluZyksIHN0eWxlOiBydW4uc3R5bGUgfSk7XG4gICAgcmVtYWluaW5nID0gMDtcbiAgICB0cnVuY2F0ZWQgPSB0cnVlO1xuICB9XG4gIGlmICh0cnVuY2F0ZWQgJiYgcmVzdWx0Lmxlbmd0aCkgcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXSEudGV4dCA9IGAke3Jlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0hLnRleHQuc2xpY2UoMCwgLTEpfVx1MjAyNmA7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHJpY2hUZXh0VHNwYW5zKHJ1bnM6IE1pbmRNYXBUZXh0UnVuW10gfCB1bmRlZmluZWQsIGZhbGxiYWNrVGV4dDogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgZm9yZWdyb3VuZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc291cmNlOiBNaW5kTWFwVGV4dFJ1bltdID0gW1xuICAgIC4uLihwcmVmaXggPyBbeyB0ZXh0OiBwcmVmaXggfV0gOiBbXSksXG4gICAgLi4uKHJ1bnM/Lmxlbmd0aCA/IHJ1bnMgOiBbeyB0ZXh0OiBmYWxsYmFja1RleHQgfV0pXG4gIF07XG4gIHJldHVybiB0cnVuY2F0ZVJ1bnMoc291cmNlLCA0MikubWFwKChydW4pID0+IHtcbiAgICBjb25zdCBzdHlsZSA9IHJ1bi5zdHlsZTtcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChzdHlsZT8uY29sb3IpIGF0dHJpYnV0ZXMucHVzaChgZmlsbD1cIiR7dmFsaWRDb2xvcihzdHlsZS5jb2xvciwgZm9yZWdyb3VuZCl9XCJgKTtcbiAgICBpZiAoc3R5bGU/LmJvbGQgIT09IHVuZGVmaW5lZCkgYXR0cmlidXRlcy5wdXNoKGBmb250LXdlaWdodD1cIiR7c3R5bGUuYm9sZCA/IDcwMCA6IDQwMH1cImApO1xuICAgIGlmIChzdHlsZT8uaXRhbGljICE9PSB1bmRlZmluZWQpIGF0dHJpYnV0ZXMucHVzaChgZm9udC1zdHlsZT1cIiR7c3R5bGUuaXRhbGljID8gXCJpdGFsaWNcIiA6IFwibm9ybWFsXCJ9XCJgKTtcbiAgICBjb25zdCBkZWNvcmF0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAoc3R5bGU/LnVuZGVybGluZSkgZGVjb3JhdGlvbnMucHVzaChcInVuZGVybGluZVwiKTtcbiAgICBpZiAoc3R5bGU/LnN0cmlrZSkgZGVjb3JhdGlvbnMucHVzaChcImxpbmUtdGhyb3VnaFwiKTtcbiAgICBpZiAoZGVjb3JhdGlvbnMubGVuZ3RoKSBhdHRyaWJ1dGVzLnB1c2goYHRleHQtZGVjb3JhdGlvbj1cIiR7ZGVjb3JhdGlvbnMuam9pbihcIiBcIil9XCJgKTtcbiAgICByZXR1cm4gYDx0c3BhbiAke2F0dHJpYnV0ZXMuam9pbihcIiBcIil9PiR7ZXNjYXBlWG1sKHJ1bi50ZXh0KX08L3RzcGFuPmA7XG4gIH0pLmpvaW4oXCJcIik7XG59XG5cbmZ1bmN0aW9uIHN2Z0ZvbnRGYW1pbHkobW9kZTogRm9udEZhbWlseU1vZGUgfCB1bmRlZmluZWQsIGN1c3RvbUZvbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIGlmIChtb2RlID09PSBcInNlcmlmXCIpIHJldHVybiAnR2VvcmdpYSxcIlRpbWVzIE5ldyBSb21hblwiLHNlcmlmJztcbiAgaWYgKG1vZGUgPT09IFwibW9ub1wiKSByZXR1cm4gJ1wiU0ZNb25vLVJlZ3VsYXJcIixDb25zb2xhcyxcIkxpYmVyYXRpb24gTW9ub1wiLG1vbm9zcGFjZSc7XG4gIGlmIChtb2RlID09PSBcImN1c3RvbVwiICYmIGN1c3RvbUZvbnQ/LnRyaW0oKSkgcmV0dXJuIGBcIiR7Y3VzdG9tRm9udC50cmltKCkucmVwbGFjZUFsbCgnXCInLCAnJyl9XCIsc2Fucy1zZXJpZmA7XG4gIHJldHVybiAnSW50ZXIsLWFwcGxlLXN5c3RlbSxCbGlua01hY1N5c3RlbUZvbnQsXCJTZWdvZSBVSVwiLHNhbnMtc2VyaWYnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZG9jdW1lbnRUb1N2Zyhyb290OiBNaW5kTWFwTm9kZSwgbW9kZTogTGF5b3V0TW9kZSwgdGl0bGU6IHN0cmluZywgYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UgPSB7fSk6IHN0cmluZyB7XG4gIGNvbnN0IGRlZmF1bHRGb250U2l6ZSA9IGFwcGVhcmFuY2UuZm9udFNpemUgPz8gMTQ7XG4gIGNvbnN0IGxheW91dCA9IGNvbXB1dGVMYXlvdXQocm9vdCwgbW9kZSwgZGVmYXVsdEZvbnRTaXplKTtcbiAgY29uc3QgcGFkZGluZyA9IDcyO1xuICBjb25zdCB3aWR0aCA9IE1hdGgubWF4KDMyMCwgbGF5b3V0Lm1heFggLSBsYXlvdXQubWluWCArIHBhZGRpbmcgKiAyKTtcbiAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoMjIwLCBsYXlvdXQubWF4WSAtIGxheW91dC5taW5ZICsgcGFkZGluZyAqIDIpO1xuICBjb25zdCBvZmZzZXRYID0gcGFkZGluZyAtIGxheW91dC5taW5YO1xuICBjb25zdCBvZmZzZXRZID0gcGFkZGluZyAtIGxheW91dC5taW5ZO1xuICBjb25zdCBlZGdlU3R5bGUgPSBhcHBlYXJhbmNlLmVkZ2VTdHlsZSA/PyBcImN1cnZlZFwiO1xuICBjb25zdCBkZWZhdWx0RWRnZSA9IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5lZGdlQ29sb3IsIFwiIzdjOGFhNVwiKTtcbiAgY29uc3QgYnJhbmNoQ29sb3JNYXAgPSBhcHBlYXJhbmNlLmNvbG9yZnVsQnJhbmNoZXMgPyBidWlsZEJyYW5jaENvbG9yTWFwKHJvb3QsIGFwcGVhcmFuY2UuYnJhbmNoQ29sb3JzKSA6IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IG1heERlcHRoID0gTWF0aC5tYXgoMSwgLi4ubGF5b3V0Lm5vZGVzLm1hcCgocG9zaXRpb24pID0+IHBvc2l0aW9uLmRlcHRoKSk7XG4gIGNvbnN0IGVkZ2VzID0gbGF5b3V0Lm5vZGVzXG4gICAgLmZpbHRlcigocG9zaXRpb24pID0+IHBvc2l0aW9uLnBhcmVudElkKVxuICAgIC5tYXAoKHBvc2l0aW9uKSA9PiB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBwb3NpdGlvbi5wYXJlbnRJZCA/IGxheW91dC5ieUlkLmdldChwb3NpdGlvbi5wYXJlbnRJZCkgOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBzdHJva2UgPSB2YWxpZENvbG9yKHBvc2l0aW9uLm5vZGUuc3R5bGU/LmNvbG9yLCBicmFuY2hDb2xvck1hcC5nZXQocG9zaXRpb24ubm9kZS5pZCkgPz8gZGVmYXVsdEVkZ2UpO1xuICAgICAgY29uc3Qgd2lkdGggPSBlZGdlV2lkdGhGb3JEZXB0aChhcHBlYXJhbmNlLCBwb3NpdGlvbi5kZXB0aCwgbWF4RGVwdGgpO1xuICAgICAgcmV0dXJuIHBhcmVudCA/IGA8cGF0aCBkPVwiJHtlZGdlUGF0aChwYXJlbnQsIHBvc2l0aW9uLCBlZGdlU3R5bGUpfVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiJHtzdHJva2V9XCIgc3Ryb2tlLXdpZHRoPVwiJHt3aWR0aH1cIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBvcGFjaXR5PVwiMC44XCIvPmAgOiBcIlwiO1xuICAgIH0pXG4gICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3Qgbm9kZXMgPSBsYXlvdXQubm9kZXMubWFwKChwb3NpdGlvbikgPT4ge1xuICAgIGNvbnN0IG5vZGUgPSBwb3NpdGlvbi5ub2RlO1xuICAgIGNvbnN0IHggPSBwb3NpdGlvbi54IC0gcG9zaXRpb24ud2lkdGggLyAyO1xuICAgIGNvbnN0IHkgPSBwb3NpdGlvbi55IC0gcG9zaXRpb24uaGVpZ2h0IC8gMjtcbiAgICBjb25zdCBpc1Jvb3QgPSBwb3NpdGlvbi5kZXB0aCA9PT0gMDtcbiAgICBjb25zdCBkZWZhdWx0QmFja2dyb3VuZCA9IGlzUm9vdCA/IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5yb290Q29sb3IsIFwiIzRmNDZlNVwiKSA6IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5ub2RlQ29sb3IsIFwiI2ZmZmZmZlwiKTtcbiAgICBjb25zdCBkZWZhdWx0VGV4dCA9IGlzUm9vdCA/IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5yb290VGV4dENvbG9yLCBcIiNmZmZmZmZcIikgOiB2YWxpZENvbG9yKGFwcGVhcmFuY2UudGV4dENvbG9yLCBcIiMwZjE3MmFcIik7XG4gICAgY29uc3QgYmFja2dyb3VuZCA9IHZhbGlkQ29sb3Iobm9kZS5zdHlsZT8uY29sb3IsIGRlZmF1bHRCYWNrZ3JvdW5kKTtcbiAgICBjb25zdCBmb3JlZ3JvdW5kID0gdmFsaWRDb2xvcihub2RlLnN0eWxlPy50ZXh0Q29sb3IsIGRlZmF1bHRUZXh0KTtcbiAgICBjb25zdCBicmFuY2hDb2xvciA9IGJyYW5jaENvbG9yTWFwLmdldChub2RlLmlkKTtcbiAgICBjb25zdCBib3JkZXIgPSB2YWxpZENvbG9yKG5vZGUuc3R5bGU/LmJvcmRlckNvbG9yLCBpc1Jvb3QgPyBiYWNrZ3JvdW5kIDogYnJhbmNoQ29sb3IgPz8gdmFsaWRDb2xvcihhcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvciwgXCIjOTRhM2I4XCIpKTtcbiAgICBjb25zdCBib3JkZXJXaWR0aCA9IG5vZGUuc3R5bGU/LmJvcmRlcldpZHRoID8/IGFwcGVhcmFuY2Uubm9kZUJvcmRlcldpZHRoID8/IChpc1Jvb3QgPyAyIDogMSk7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7bm9kZS5pY29uID8gYCR7bm9kZS5pY29ufSBgIDogXCJcIn0ke3Rhc2tHbHlwaChub2RlKX1gO1xuICAgIGNvbnN0IGNvbnRlbnRCbG9ja3MgPSBub2RlQ29udGVudEJsb2Nrcyhub2RlKTtcbiAgICBsZXQgY29udGVudFkgPSB5ICsgMjg7XG4gICAgY29uc3QgY29udGVudFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBwcmVmaXhVc2VkID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBjb250ZW50QmxvY2tzKSB7XG4gICAgICBpZiAoYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiKSB7XG4gICAgICAgIGNvbnRlbnRQYXJ0cy5wdXNoKGA8cmVjdCB4PVwiJHtwb3NpdGlvbi54IC0gNzB9XCIgeT1cIiR7Y29udGVudFkgLSAxNH1cIiB3aWR0aD1cIjE0MFwiIGhlaWdodD1cIjk0XCIgcng9XCI4XCIgZmlsbD1cInJnYmEoMTI3LDEyNywxMjcsLjEyKVwiLz48dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke2NvbnRlbnRZICsgMzh9XCIgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIjEyXCI+XHVEODNEXHVEREJDICR7ZXNjYXBlWG1sKChibG9jay5hbHQgPz8gXCJcdTU2RkVcdTcyNDdcIikuc2xpY2UoMCwgMjApKX08L3RleHQ+YCk7XG4gICAgICAgIGNvbnRlbnRZICs9IDExMjtcbiAgICAgIH0gZWxzZSBpZiAoYmxvY2sudGV4dC50cmltKCkpIHtcbiAgICAgICAgY29uc3QgYmxvY2tQcmVmaXggPSBwcmVmaXhVc2VkID8gXCJcIiA6IHByZWZpeDtcbiAgICAgICAgcHJlZml4VXNlZCA9IHRydWU7XG4gICAgICAgIGNvbnRlbnRQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHtwb3NpdGlvbi54fVwiIHk9XCIke2NvbnRlbnRZfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCIke25vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZX1cIj4ke3JpY2hUZXh0VHNwYW5zKGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0LCBibG9ja1ByZWZpeCwgZm9yZWdyb3VuZCl9PC90ZXh0PmApO1xuICAgICAgICBjb250ZW50WSArPSAobm9kZS5zdHlsZT8uZm9udFNpemUgPz8gZGVmYXVsdEZvbnRTaXplKSArIDE1O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWNvbnRlbnRCbG9ja3MubGVuZ3RoKSBjb250ZW50UGFydHMucHVzaChgPHRleHQgeD1cIiR7cG9zaXRpb24ueH1cIiB5PVwiJHtjb250ZW50WX1cIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgZm9udC1zaXplPVwiJHtub2RlLnN0eWxlPy5mb250U2l6ZSA/PyBkZWZhdWx0Rm9udFNpemV9XCI+JHtlc2NhcGVYbWwocHJlZml4IHx8IG5vZGVQbGFpblRleHQobm9kZSkgfHwgXCJcdTU2RkVcdTcyNDdcdTgyODJcdTcwQjlcIil9PC90ZXh0PmApO1xuICAgIGxldCByaWNoWSA9IGNvbnRlbnRZICsgMTA7XG4gICAgY29uc3QgcmljaFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChub2RlLnN1Ym1hcCkge1xuICAgICAgcmljaFBhcnRzLnB1c2goYDxyZWN0IHg9XCIke3ggKyAxMn1cIiB5PVwiJHtyaWNoWX1cIiB3aWR0aD1cIiR7cG9zaXRpb24ud2lkdGggLSAyNH1cIiBoZWlnaHQ9XCIyNVwiIHJ4PVwiNlwiIGZpbGw9XCJyZ2JhKDk5LDEwMiwyNDEsLjEwKVwiIHN0cm9rZT1cIiR7Zm9yZWdyb3VuZH1cIiBzdHJva2Utb3BhY2l0eT1cIi4yOFwiIHN0cm9rZS1kYXNoYXJyYXk9XCI0IDNcIi8+PHRleHQgeD1cIiR7cG9zaXRpb24ueH1cIiB5PVwiJHtyaWNoWSArIDE3fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCIxMFwiPlx1MjFCMyAke2VzY2FwZVhtbCgobm9kZS5zdWJtYXAudGl0bGUgPz8gbm9kZS5zdWJtYXAucGF0aCkuc2xpY2UoMCwgNTQpKX08L3RleHQ+YCk7XG4gICAgICByaWNoWSArPSAzNDtcbiAgICB9XG4gICAgaWYgKG5vZGUudGFibGUpIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBbbm9kZS50YWJsZS5oZWFkZXJzLCAuLi5ub2RlLnRhYmxlLnJvd3Muc2xpY2UoMCwgOCldO1xuICAgICAgcm93cy5mb3JFYWNoKChyb3csIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHJvd1RleHQgPSBlc2NhcGVYbWwocm93Lm1hcCgoY2VsbCkgPT4gY2VsbC5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiIFwiKSkuam9pbihcIiAgfCAgXCIpLnNsaWNlKDAsIDEwMCkpO1xuICAgICAgICByaWNoUGFydHMucHVzaChgPHRleHQgeD1cIiR7eCArIDE2fVwiIHk9XCIke3JpY2hZICsgaW5kZXggKiAyM31cIiBmaWxsPVwiJHtmb3JlZ3JvdW5kfVwiIGZvbnQtc2l6ZT1cIiR7aW5kZXggPT09IDAgPyAxMC41IDogOS41fVwiIGZvbnQtd2VpZ2h0PVwiJHtpbmRleCA9PT0gMCA/IDcwMCA6IDQwMH1cIj4ke3Jvd1RleHR9PC90ZXh0PmApO1xuICAgICAgfSk7XG4gICAgICBpZiAobm9kZS50YWJsZS5yb3dzLmxlbmd0aCA+IDgpIHJpY2hQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHt4ICsgMTZ9XCIgeT1cIiR7cmljaFkgKyByb3dzLmxlbmd0aCAqIDIzfVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgb3BhY2l0eT1cIi42NVwiIGZvbnQtc2l6ZT1cIjlcIj5cdTIwMjYgXHU4RkQ4XHU2NzA5ICR7bm9kZS50YWJsZS5yb3dzLmxlbmd0aCAtIDh9IFx1ODg0QzwvdGV4dD5gKTtcbiAgICB9XG4gICAgaWYgKG5vZGUuY29kZSkge1xuICAgICAgcmljaFBhcnRzLnB1c2goYDxyZWN0IHg9XCIke3ggKyAxMn1cIiB5PVwiJHtyaWNoWSAtIDE0fVwiIHdpZHRoPVwiJHtwb3NpdGlvbi53aWR0aCAtIDI0fVwiIGhlaWdodD1cIiR7TWF0aC5taW4oMzUwLCBNYXRoLm1heCg4MCwgbm9kZS5jb2RlLmNvZGUuc3BsaXQoL1xccj9cXG4vKS5sZW5ndGggKiAxNyArIDM0KSl9XCIgcng9XCI3XCIgZmlsbD1cInJnYmEoMTUsMjMsNDIsLjEwKVwiLz5gKTtcbiAgICAgIHJpY2hQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHt4ICsgMjB9XCIgeT1cIiR7cmljaFkgKyAzfVwiIGZpbGw9XCIke2ZvcmVncm91bmR9XCIgb3BhY2l0eT1cIi43XCIgZm9udC1zaXplPVwiOVwiPiR7ZXNjYXBlWG1sKG5vZGUuY29kZS5sYW5ndWFnZSB8fCBcImNvZGVcIil9PC90ZXh0PmApO1xuICAgICAgbm9kZS5jb2RlLmNvZGUuc3BsaXQoL1xccj9cXG4vKS5zbGljZSgwLCAxNikuZm9yRWFjaCgobGluZSwgaW5kZXgpID0+IHJpY2hQYXJ0cy5wdXNoKGA8dGV4dCB4PVwiJHt4ICsgMjB9XCIgeT1cIiR7cmljaFkgKyAyMyArIGluZGV4ICogMTd9XCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBmb250LXNpemU9XCI5XCIgZm9udC1mYW1pbHk9XCJtb25vc3BhY2VcIj4ke2VzY2FwZVhtbChsaW5lLnNsaWNlKDAsIDkyKSl9PC90ZXh0PmApKTtcbiAgICB9XG4gICAgY29uc3QgcmljaENvbnRlbnQgPSByaWNoUGFydHMuam9pbihcIlwiKTtcbiAgICBjb25zdCB0YWdzID0gbm9kZS50YWdzPy5sZW5ndGhcbiAgICAgID8gYDx0ZXh0IHg9XCIke3Bvc2l0aW9uLnh9XCIgeT1cIiR7cG9zaXRpb24ueSArIHBvc2l0aW9uLmhlaWdodCAvIDIgLSA5fVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZmlsbD1cIiR7Zm9yZWdyb3VuZH1cIiBvcGFjaXR5PVwiLjcyXCIgZm9udC1zaXplPVwiMTBcIj4ke2VzY2FwZVhtbChub2RlLnRhZ3MubWFwKCh0YWcpID0+IGAjJHt0YWd9YCkuam9pbihcIiAgXCIpLnNsaWNlKDAsIDQ4KSl9PC90ZXh0PmBcbiAgICAgIDogXCJcIjtcbiAgICBjb25zdCBib2xkID0gbm9kZS5zdHlsZT8uYm9sZCA/PyBhcHBlYXJhbmNlLmJvbGQgPz8gZmFsc2U7XG4gICAgY29uc3QgaXRhbGljID0gbm9kZS5zdHlsZT8uaXRhbGljID8/IGFwcGVhcmFuY2UuaXRhbGljID8/IGZhbHNlO1xuICAgIGNvbnN0IHVuZGVybGluZSA9IG5vZGUuc3R5bGU/LnVuZGVybGluZSA/PyBhcHBlYXJhbmNlLnVuZGVybGluZSA/PyBmYWxzZTtcbiAgICBjb25zdCBmb250U2l6ZSA9IG5vZGUuc3R5bGU/LmZvbnRTaXplID8/IGRlZmF1bHRGb250U2l6ZTtcbiAgICByZXR1cm4gYDxnPjxyZWN0IHg9XCIke3h9XCIgeT1cIiR7eX1cIiB3aWR0aD1cIiR7cG9zaXRpb24ud2lkdGh9XCIgaGVpZ2h0PVwiJHtwb3NpdGlvbi5oZWlnaHR9XCIgcng9XCIke3N2Z1JhZGl1cyhub2RlLnN0eWxlPy5zaGFwZSl9XCIgZmlsbD1cIiR7YmFja2dyb3VuZH1cIiBzdHJva2U9XCIke2JvcmRlcn1cIiBzdHJva2Utd2lkdGg9XCIke2JvcmRlcldpZHRofVwiLz48ZyBmb250LXdlaWdodD1cIiR7aXNSb290IHx8IGJvbGQgPyA3MDAgOiA0MDB9XCIgZm9udC1zdHlsZT1cIiR7aXRhbGljID8gXCJpdGFsaWNcIiA6IFwibm9ybWFsXCJ9XCIgdGV4dC1kZWNvcmF0aW9uPVwiJHt1bmRlcmxpbmUgPyBcInVuZGVybGluZVwiIDogXCJub25lXCJ9XCI+JHtjb250ZW50UGFydHMuam9pbihcIlwiKX08L2c+JHtyaWNoQ29udGVudH0ke3RhZ3N9PC9nPmA7XG4gIH0pLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3QgYmFja2dyb3VuZCA9IHZhbGlkQ29sb3IoYXBwZWFyYW5jZS5iYWNrZ3JvdW5kQ29sb3IsIFwiI2Y4ZmFmY1wiKTtcbiAgY29uc3QgcGF0dGVybkNvbG9yID0gdmFsaWRDb2xvcihhcHBlYXJhbmNlLnBhdHRlcm5Db2xvciwgXCIjOTRhM2I4XCIpO1xuICBjb25zdCBwYXR0ZXJuID0gYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA/PyBcIm5vbmVcIjtcbiAgY29uc3QgZGVmcyA9IHBhdHRlcm4gPT09IFwiZ3JpZFwiXG4gICAgPyBgPGRlZnM+PHBhdHRlcm4gaWQ9XCJtbWMtcGF0dGVyblwiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHBhdHRlcm5Vbml0cz1cInVzZXJTcGFjZU9uVXNlXCI+PHBhdGggZD1cIk0gMjQgMCBMIDAgMCAwIDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIke3BhdHRlcm5Db2xvcn1cIiBzdHJva2Utd2lkdGg9XCIxXCIgb3BhY2l0eT1cIi4xOFwiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjEwMCVcIiBmaWxsPVwidXJsKCNtbWMtcGF0dGVybilcIi8+YFxuICAgIDogcGF0dGVybiA9PT0gXCJkb3RzXCJcbiAgICAgID8gYDxkZWZzPjxwYXR0ZXJuIGlkPVwibW1jLXBhdHRlcm5cIiB3aWR0aD1cIjI0XCIgaGVpZ2h0PVwiMjRcIiBwYXR0ZXJuVW5pdHM9XCJ1c2VyU3BhY2VPblVzZVwiPjxjaXJjbGUgY3g9XCIyXCIgY3k9XCIyXCIgcj1cIjEuNVwiIGZpbGw9XCIke3BhdHRlcm5Db2xvcn1cIiBvcGFjaXR5PVwiLjI4XCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PVwiMTAwJVwiIGZpbGw9XCJ1cmwoI21tYy1wYXR0ZXJuKVwiLz5gXG4gICAgICA6IFwiXCI7XG5cbiAgcmV0dXJuIGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5cbjxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiJHtNYXRoLmNlaWwod2lkdGgpfVwiIGhlaWdodD1cIiR7TWF0aC5jZWlsKGhlaWdodCl9XCIgdmlld0JveD1cIjAgMCAke01hdGguY2VpbCh3aWR0aCl9ICR7TWF0aC5jZWlsKGhlaWdodCl9XCI+XG48dGl0bGU+JHtlc2NhcGVYbWwodGl0bGUpfTwvdGl0bGU+XG48c3R5bGU+c3Zne2JhY2tncm91bmQ6JHtiYWNrZ3JvdW5kfTtmb250LWZhbWlseToke3N2Z0ZvbnRGYW1pbHkoYXBwZWFyYW5jZS5mb250RmFtaWx5LCBhcHBlYXJhbmNlLmN1c3RvbUZvbnQpfX08L3N0eWxlPlxuJHtkZWZzfTxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSgke29mZnNldFh9ICR7b2Zmc2V0WX0pXCI+JHtlZGdlc30ke25vZGVzfTwvZz5cbjwvc3ZnPmA7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBBcHAsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBkb2N1bWVudFRvU3ZnIH0gZnJvbSBcIi4vbGF5b3V0XCI7XG5pbXBvcnQgeyBtZXJnZUFwcGVhcmFuY2UsIHBhcnNlRG9jdW1lbnQsIHR5cGUgTWluZE1hcEFwcGVhcmFuY2UsIHR5cGUgTWluZE1hcERvY3VtZW50IH0gZnJvbSBcIi4vbW9kZWxcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0YXRpY01pbmRNYXAoXG4gIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gIGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQsXG4gIG9wdGlvbnM/OiB7IGFwcD86IEFwcDsgZmlsZT86IFRGaWxlOyBtYXhIZWlnaHQ/OiBudW1iZXI7IGRlZmF1bHRBcHBlYXJhbmNlPzogTWluZE1hcEFwcGVhcmFuY2UgfVxuKTogdm9pZCB7XG4gIGNvbnRhaW5lci5lbXB0eSgpO1xuICBjb250YWluZXIuYWRkQ2xhc3MoXCJtbWMtc3RhdGljLXByZXZpZXdcIik7XG4gIGNvbnN0IHN2ZyA9IGRvY3VtZW50VG9TdmcoZG9jdW1lbnQucm9vdCwgZG9jdW1lbnQubGF5b3V0LCBkb2N1bWVudC50aXRsZSwgbWVyZ2VBcHBlYXJhbmNlKG9wdGlvbnM/LmRlZmF1bHRBcHBlYXJhbmNlLCBkb2N1bWVudC5hcHBlYXJhbmNlKSk7XG4gIGNvbnN0IGltYWdlID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiaW1nXCIsIHtcbiAgICBhdHRyOiB7XG4gICAgICBhbHQ6IGAke2RvY3VtZW50LnRpdGxlfSBcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcdTk4ODRcdTg5QzhgLFxuICAgICAgc3JjOiBgZGF0YTppbWFnZS9zdmcreG1sO2NoYXJzZXQ9dXRmLTgsJHtlbmNvZGVVUklDb21wb25lbnQoc3ZnKX1gXG4gICAgfVxuICB9KTtcbiAgaWYgKG9wdGlvbnM/Lm1heEhlaWdodCkgaW1hZ2Uuc3R5bGUubWF4SGVpZ2h0ID0gYCR7b3B0aW9ucy5tYXhIZWlnaHR9cHhgO1xuICBpZiAob3B0aW9ucz8uYXBwICYmIG9wdGlvbnMuZmlsZSkge1xuICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIG9wdGlvbnMuYXBwPy53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSkub3BlbkZpbGUob3B0aW9ucy5maWxlIGFzIFRGaWxlKTtcbiAgICB9KTtcbiAgICBpbWFnZS5zZXRBdHRyKFwidGl0bGVcIiwgXCJcdTUzQ0NcdTUxRkJcdTYyNTNcdTVGMDBcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0YXRpY1NvdXJjZShjb250YWluZXI6IEhUTUxFbGVtZW50LCBzb3VyY2U6IHN0cmluZywgZmFsbGJhY2tUaXRsZTogc3RyaW5nLCBkZWZhdWx0QXBwZWFyYW5jZT86IE1pbmRNYXBBcHBlYXJhbmNlKTogdm9pZCB7XG4gIHJlbmRlclN0YXRpY01pbmRNYXAoY29udGFpbmVyLCBwYXJzZURvY3VtZW50KHNvdXJjZSwgZmFsbGJhY2tUaXRsZSksIHsgZGVmYXVsdEFwcGVhcmFuY2UgfSk7XG59XG4iLCAiaW1wb3J0IHsgTWFya2Rvd25SZW5kZXJlciwgTm90aWNlLCBUZXh0RmlsZVZpZXcsIFRGaWxlLCBub3JtYWxpemVQYXRoLCB0eXBlIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIE1pbmRNYXBTdHVkaW9QbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHsgTWluZE1hcEVkaXRvciB9IGZyb20gXCIuL2VkaXRvclwiO1xuaW1wb3J0IHsgcGFyc2VEb2N1bWVudCwgc2VyaWFsaXplRG9jdW1lbnQsIHR5cGUgTWluZE1hcERvY3VtZW50IH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7IHNldHRpbmdzVG9BcHBlYXJhbmNlIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcblxuZXhwb3J0IGNvbnN0IFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTyA9IFwibWluZG1hcC1zdHVkaW8tdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgTWluZE1hcFN0dWRpb1ZpZXcgZXh0ZW5kcyBUZXh0RmlsZVZpZXcge1xuICBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbjogTWluZE1hcFN0dWRpb1BsdWdpbjtcbiAgcHJpdmF0ZSBlZGl0b3I6IE1pbmRNYXBFZGl0b3IgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBkb2N1bWVudDogTWluZE1hcERvY3VtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2F2ZWRUaW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcGVuZGluZ0ZvY3VzTm9kZUlkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IE1pbmRNYXBTdHVkaW9QbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFZJRVdfVFlQRV9NSU5ETUFQX1NUVURJTztcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZmlsZT8uYmFzZW5hbWUgPz8gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgfVxuXG4gIGdldEljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJicmFpbi1jaXJjdWl0XCI7XG4gIH1cblxuICBnZXRWaWV3RGF0YSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5lZGl0b3I/LmdldERvY3VtZW50KCkgPz8gdGhpcy5kb2N1bWVudDtcbiAgICByZXR1cm4gc2VyaWFsaXplRG9jdW1lbnQoZG9jdW1lbnQgPz8gdGhpcy5wbHVnaW4uY3JlYXRlQ29uZmlndXJlZERvY3VtZW50KFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXCIpKTtcbiAgfVxuXG4gIHNldFZpZXdEYXRhKGRhdGE6IHN0cmluZywgY2xlYXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCB0aXRsZSA9IHRoaXMuZmlsZT8uYmFzZW5hbWUgPz8gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICB0aGlzLmRvY3VtZW50ID0gcGFyc2VEb2N1bWVudChkYXRhLCB0aXRsZSk7XG4gICAgdGhpcy5hcHBseVZpZXdDbGFzc2VzKCk7XG5cbiAgICBpZiAoIXRoaXMuZWRpdG9yIHx8IGNsZWFyKSB7XG4gICAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgICAgIHRoaXMuZWRpdG9yID0gbmV3IE1pbmRNYXBFZGl0b3IodGhpcy5hcHAsIHRoaXMuY29udGVudEVsLCB0aGlzLmRvY3VtZW50LCB7XG4gICAgICAgIG9uQ2hhbmdlOiAoZG9jdW1lbnQpID0+IHtcbiAgICAgICAgICB0aGlzLmRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgdGhpcy5yZXF1ZXN0U2F2ZSgpO1xuICAgICAgICAgIHRoaXMuc2NoZWR1bGVTYXZlZEluZGljYXRvcigpO1xuICAgICAgICB9LFxuICAgICAgICBvbk9wZW5MaW5rOiBhc3luYyAobGluaykgPT4gdGhpcy5vcGVuTGluayhsaW5rKSxcbiAgICAgICAgb25FeHBvcnRTdmc6IGFzeW5jIChzdmcpID0+IHRoaXMuZXhwb3J0VGV4dEZpbGUoXCJzdmdcIiwgc3ZnKSxcbiAgICAgICAgb25FeHBvcnRNYXJrZG93bjogYXN5bmMgKG1hcmtkb3duKSA9PiB0aGlzLmV4cG9ydFRleHRGaWxlKFwibWRcIiwgbWFya2Rvd24pLFxuICAgICAgICBvbkV4cG9ydEpzb246IGFzeW5jIChqc29uKSA9PiB0aGlzLmV4cG9ydFRleHRGaWxlKFwianNvblwiLCBqc29uKSxcbiAgICAgICAgcmVzb2x2ZUltYWdlOiAoc291cmNlKSA9PiB0aGlzLnJlc29sdmVJbWFnZShzb3VyY2UpLFxuICAgICAgICBvblNhdmVQYXN0ZWRJbWFnZTogYXN5bmMgKGJsb2IsIHN1Z2dlc3RlZE5hbWUpID0+IHRoaXMucGx1Z2luLnNhdmVQYXN0ZWRJbWFnZShibG9iLCBzdWdnZXN0ZWROYW1lLCB0aGlzLmZpbGUpLFxuICAgICAgICBnZXRJbWFnZUhvc3RzOiAoKSA9PiB0aGlzLnBsdWdpbi5nZXRJbWFnZUhvc3RDaG9pY2VzKCksXG4gICAgICAgIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzOiAoKSA9PiB0aGlzLnBsdWdpbi5nZXREZWZhdWx0VXBsb2FkSG9zdElkcygpLFxuICAgICAgICBvblVwbG9hZEltYWdlOiBhc3luYyAoYmxvYiwgc3VnZ2VzdGVkTmFtZSwgaG9zdElkcykgPT4gdGhpcy5wbHVnaW4udXBsb2FkSW1hZ2VUb0hvc3RzKGJsb2IsIHN1Z2dlc3RlZE5hbWUsIGhvc3RJZHMpLFxuICAgICAgICBvblJlYWRJbWFnZVNvdXJjZTogYXN5bmMgKHNvdXJjZSkgPT4gdGhpcy5wbHVnaW4ucmVhZEltYWdlU291cmNlKHNvdXJjZSwgdGhpcy5maWxlKSxcbiAgICAgICAgb25TY2hlZHVsZUF1dG9VcGxvYWQ6IChub2RlSWQsIGJsb2NrSWQsIGxvY2FsUGF0aCwgc3VnZ2VzdGVkTmFtZSkgPT4gdGhpcy5wbHVnaW4uc2NoZWR1bGVBdXRvVXBsb2FkKHRoaXMuZmlsZSwgbm9kZUlkLCBibG9ja0lkLCBsb2NhbFBhdGgsIHN1Z2dlc3RlZE5hbWUpLFxuICAgICAgICBvbkNyZWF0ZVN1Ym1hcDogYXN5bmMgKG5vZGUpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuZmlsZSkgdGhyb3cgbmV3IEVycm9yKFwiXHU1RjUzXHU1MjREXHU4MTExXHU1NkZFXHU1QzFBXHU2NzJBXHU1MTczXHU4MDU0XHU2NTg3XHU0RUY2XCIpO1xuICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5jcmVhdGVTdWJtYXBGaWxlKHRoaXMuZmlsZSwgbm9kZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uT3Blbk1pbmRNYXA6IGFzeW5jIChwYXRoLCBmb2N1c05vZGVJZCkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLm9wZW5NaW5kTWFwUGF0aChwYXRoLCB0aGlzLmZpbGU/LnBhdGggPz8gXCJcIiwgdGhpcy5sZWFmLCBmb2N1c05vZGVJZCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uR2xvYmFsU2VhcmNoOiAoKSA9PiB0aGlzLnBsdWdpbi5vcGVuR2xvYmFsU2VhcmNoKCksXG4gICAgICAgIG9uUmVuZGVyQ29kZTogYXN5bmMgKGJsb2NrLCBjb250YWluZXIpID0+IHtcbiAgICAgICAgICBjb25zdCBsb25nZXN0RmVuY2UgPSBNYXRoLm1heCgyLCAuLi5BcnJheS5mcm9tKGJsb2NrLmNvZGUubWF0Y2hBbGwoL2ArL2cpLCAobWF0Y2gpID0+IG1hdGNoWzBdLmxlbmd0aCkpO1xuICAgICAgICAgIGNvbnN0IGZlbmNlID0gXCJgXCIucmVwZWF0KGxvbmdlc3RGZW5jZSArIDEpO1xuICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gYCR7ZmVuY2V9JHtibG9jay5sYW5ndWFnZSA/PyBcIlwifVxcbiR7YmxvY2suY29kZX1cXG4ke2ZlbmNlfWA7XG4gICAgICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIG1hcmtkb3duLCBjb250YWluZXIsIHRoaXMuZmlsZT8ucGF0aCA/PyBcIlwiLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSwgdGhpcy5nZXRFZGl0b3JPcHRpb25zKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVkaXRvci5zZXREb2N1bWVudCh0aGlzLmRvY3VtZW50LCBmYWxzZSk7XG4gICAgICB0aGlzLmVkaXRvci5zZXRPcHRpb25zKHRoaXMuZ2V0RWRpdG9yT3B0aW9ucygpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucGVuZGluZ0ZvY3VzTm9kZUlkICYmIHRoaXMuZWRpdG9yKSB7XG4gICAgICBjb25zdCBub2RlSWQgPSB0aGlzLnBlbmRpbmdGb2N1c05vZGVJZDtcbiAgICAgIHRoaXMucGVuZGluZ0ZvY3VzTm9kZUlkID0gbnVsbDtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZWRpdG9yPy5mb2N1c05vZGVCeUlkKG5vZGVJZCksIDIwKTtcbiAgICB9XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yID0gbnVsbDtcbiAgICB0aGlzLmRvY3VtZW50ID0gbnVsbDtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZShjbGVhcj86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5zYXZlKGNsZWFyKTtcbiAgICB0aGlzLmVkaXRvcj8ubWFya1NhdmVkKCk7XG4gIH1cblxuICBhc3luYyBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnNhdmVkVGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5zYXZlZFRpbWVyKTtcbiAgICB0aGlzLmVkaXRvcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yID0gbnVsbDtcbiAgICBhd2FpdCBzdXBlci5vbkNsb3NlKCk7XG4gIH1cblxuICByZWZyZXNoQXBwZWFyYW5jZSgpOiB2b2lkIHtcbiAgICB0aGlzLmFwcGx5Vmlld0NsYXNzZXMoKTtcbiAgICB0aGlzLmVkaXRvcj8uc2V0T3B0aW9ucyh0aGlzLmdldEVkaXRvck9wdGlvbnMoKSk7XG4gIH1cblxuICBmb2N1c05vZGUobm9kZUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZWRpdG9yKSB7XG4gICAgICB0aGlzLnBlbmRpbmdGb2N1c05vZGVJZCA9IG5vZGVJZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5lZGl0b3IuZm9jdXNOb2RlQnlJZChub2RlSWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRFZGl0b3JPcHRpb25zKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkZWZhdWx0Tm9kZVNoYXBlOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0Tm9kZVNoYXBlLFxuICAgICAgZGVmYXVsdEFwcGVhcmFuY2U6IHNldHRpbmdzVG9BcHBlYXJhbmNlKHRoaXMucGx1Z2luLnNldHRpbmdzKSxcbiAgICAgIHNob3dUYXNrUHJvZ3Jlc3M6IHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dUYXNrUHJvZ3Jlc3MsXG4gICAgICBhdXRvRml0T25PcGVuOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvRml0T25PcGVuLFxuICAgICAgaGlzdG9yeUxpbWl0OiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5oaXN0b3J5TGltaXQsXG4gICAgICBpbWFnZUZhaWxvdmVyRW5hYmxlZDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGYWlsb3ZlckVuYWJsZWQsXG4gICAgICBpbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHM6IHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRmFpbG92ZXJUaW1lb3V0U2Vjb25kcyxcbiAgICAgIGltYWdlRmFpbG92ZXJVc2VMb2NhbEZhbGxiYWNrOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFja1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFwcGx5Vmlld0NsYXNzZXMoKTogdm9pZCB7XG4gICAgY29uc3QgdGhlbWUgPSB0aGlzLmRvY3VtZW50Py50aGVtZSA/PyBcImF1dG9cIjtcbiAgICB0aGlzLmNvbnRlbnRFbC50b2dnbGVDbGFzcyhcIm1tYy1mb3JjZS1saWdodFwiLCB0aGVtZSA9PT0gXCJsaWdodFwiKTtcbiAgICB0aGlzLmNvbnRlbnRFbC50b2dnbGVDbGFzcyhcIm1tYy1mb3JjZS1kYXJrXCIsIHRoZW1lID09PSBcImRhcmtcIik7XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlU2F2ZWRJbmRpY2F0b3IoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2F2ZWRUaW1lciAhPT0gbnVsbCkgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnNhdmVkVGltZXIpO1xuICAgIHRoaXMuc2F2ZWRUaW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZWRpdG9yPy5tYXJrU2F2ZWQoKSwgMjMwMCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9wZW5MaW5rKHJhd0xpbms6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxpbmsgPSByYXdMaW5rLnRyaW0oKTtcbiAgICBpZiAoL15odHRwcz86XFwvXFwvL2kudGVzdChsaW5rKSkge1xuICAgICAgd2luZG93Lm9wZW4obGluaywgXCJfYmxhbmtcIiwgXCJub29wZW5lcixub3JlZmVycmVyXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB3aWtpTWF0Y2ggPSBsaW5rLm1hdGNoKC9eXFxbXFxbKFtcXHNcXFNdKz8pXFxdXFxdJC8pO1xuICAgIGNvbnN0IHRhcmdldCA9ICh3aWtpTWF0Y2g/LlsxXSA/PyBsaW5rKS5zcGxpdChcInxcIilbMF0/LnRyaW0oKSA/PyBsaW5rO1xuICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQodGFyZ2V0LCB0aGlzLmZpbGU/LnBhdGggPz8gXCJcIiwgZmFsc2UpO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNvbHZlSW1hZ2UocmF3U291cmNlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBjb25zdCBzb3VyY2UgPSByYXdTb3VyY2UudHJpbSgpO1xuICAgIGlmICghc291cmNlKSByZXR1cm4gbnVsbDtcbiAgICBpZiAoL14oaHR0cHM/OnxkYXRhOnxibG9iOikvaS50ZXN0KHNvdXJjZSkpIHJldHVybiBzb3VyY2U7XG4gICAgY29uc3Qgd2lraU1hdGNoID0gc291cmNlLm1hdGNoKC9eIT9cXFtcXFsoW1xcc1xcU10rPylcXF1cXF0kLyk7XG4gICAgY29uc3QgdGFyZ2V0ID0gKHdpa2lNYXRjaD8uWzFdID8/IHNvdXJjZSkuc3BsaXQoXCJ8XCIpWzBdPy5zcGxpdChcIiNcIilbMF0/LnRyaW0oKSA/PyBzb3VyY2U7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QodGFyZ2V0LCB0aGlzLmZpbGU/LnBhdGggPz8gXCJcIik7XG4gICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZXhwb3J0VGV4dEZpbGUoZXh0ZW5zaW9uOiBcInN2Z1wiIHwgXCJtZFwiIHwgXCJqc29uXCIsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGU7XG4gICAgY29uc3QgcGFyZW50UGF0aCA9IGZpbGU/LnBhcmVudD8ucGF0aCA/PyBcIlwiO1xuICAgIGNvbnN0IGJhc2VOYW1lID0gZmlsZT8uYmFzZW5hbWUgPz8gdGhpcy5kb2N1bWVudD8udGl0bGUgPz8gXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIjtcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0QXZhaWxhYmxlUGF0aChub3JtYWxpemVQYXRoKGAke3BhcmVudFBhdGggPyBgJHtwYXJlbnRQYXRofS9gIDogXCJcIn0ke2Jhc2VOYW1lfS4ke2V4dGVuc2lvbn1gKSk7XG4gICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgIG5ldyBOb3RpY2UoYFx1NURGMlx1NUJGQ1x1NTFGQVx1RkYxQSR7cGF0aH1gKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTWVudSwgTW9kYWwsIE5vdGljZSwgc2V0SWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgY2xvbmVEb2N1bWVudCxcbiAgY2xvbmVOb2RlV2l0aEZyZXNoSWRzLFxuICBjaGlsZHJlblRvVGFibGUsXG4gIGNvbnRhaW5zTm9kZSxcbiAgY3JlYXRlTm9kZSxcbiAgZG9jdW1lbnRUb01hcmtkb3duLFxuICBleHRyYWN0Rmlyc3RXaWtpTGluayxcbiAgZmluZEFuY2VzdG9ycyxcbiAgZmluZE5vZGUsXG4gIGZpbmRQYXJlbnQsXG4gIGZsYXR0ZW5Ob2RlcyxcbiAgZ2V0VGFza1Byb2dyZXNzLFxuICBpbWFnZVNvdXJjZUNhbmRpZGF0ZXMsXG4gIG1lcmdlQXBwZWFyYW5jZSxcbiAgbm9kZVNlYXJjaFRleHQsXG4gIG5vcm1hbGl6ZURvY3VtZW50LFxuICBuZXdJZCxcbiAgbm9kZUNvbnRlbnRCbG9ja3MsXG4gIG5vZGVQbGFpblRleHQsXG4gIHN5bmNOb2RlTGVnYWN5RmllbGRzLFxuICBwYXJzZUZlbmNlZENvZGUsXG4gIHBhcnNlTWFya2Rvd25UYWJsZSxcbiAgbm9ybWFsaXplUmljaFRleHQsXG4gIHJpY2hUZXh0UGxhaW5UZXh0LFxuICByaWNoVGV4dENoYXJhY3RlclN0eWxlcyxcbiAgY2hhcmFjdGVyU3R5bGVzVG9SaWNoVGV4dCxcbiAgYXBwbHlSaWNoVGV4dFN0eWxlUmFuZ2UsXG4gIHJlY29uY2lsZVJpY2hUZXh0QWZ0ZXJFZGl0LFxuICB0eXBlIEJhY2tncm91bmRQYXR0ZXJuLFxuICB0eXBlIEVkZ2VTdHlsZSxcbiAgdHlwZSBFZGdlV2lkdGhNb2RlLFxuICB0eXBlIEZvbnRGYW1pbHlNb2RlLFxuICB0eXBlIE1pbmRNYXBBcHBlYXJhbmNlLFxuICB0eXBlIE1pbmRNYXBUaGVtZVByZXNldElkLFxuICB0eXBlIE1pbmRNYXBEb2N1bWVudCxcbiAgdHlwZSBNaW5kTWFwQ29kZUJsb2NrLFxuICB0eXBlIE1pbmRNYXBDb250ZW50QmxvY2ssXG4gIHR5cGUgTWluZE1hcEltYWdlQ29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBOb2RlLFxuICB0eXBlIE1pbmRNYXBUZXh0Q29udGVudEJsb2NrLFxuICB0eXBlIE1pbmRNYXBTdWJtYXAsXG4gIHR5cGUgTWluZE1hcFRleHRSdW4sXG4gIHR5cGUgTWluZE1hcFRleHRTdHlsZSxcbiAgdHlwZSBOb2RlU2hhcGUsXG4gIHR5cGUgVGFza1N0YXR1cyxcbiAgcmVtb3ZlTm9kZVxufSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHsgYnVpbGRCcmFuY2hDb2xvck1hcCwgY29tcHV0ZUxheW91dCwgZG9jdW1lbnRUb1N2ZywgZWRnZVBhdGgsIGVkZ2VXaWR0aEZvckRlcHRoLCB0eXBlIExheW91dFJlc3VsdCB9IGZyb20gXCIuL2xheW91dFwiO1xuaW1wb3J0IHsgQ29kZUVkaXRNb2RhbCwgVGFibGVFZGl0TW9kYWwgfSBmcm9tIFwiLi9jb250ZW50LW1vZGFsc1wiO1xuaW1wb3J0IHR5cGUgeyBJbWFnZUhvc3RDaG9pY2UsIEltYWdlSG9zdFVwbG9hZEJhdGNoIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGFwcGVhcmFuY2VGcm9tVGhlbWVQcmVzZXQsIE1JTkRNQVBfVEhFTUVfUFJFU0VUUyB9IGZyb20gXCIuL3RoZW1lc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBFZGl0b3JDYWxsYmFja3Mge1xuICBvbkNoYW5nZTogKGRvY3VtZW50OiBNaW5kTWFwRG9jdW1lbnQpID0+IHZvaWQ7XG4gIG9uT3Blbkxpbms6IChsaW5rOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICBvbkV4cG9ydFN2ZzogKHN2Zzogc3RyaW5nKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgb25FeHBvcnRNYXJrZG93bjogKG1hcmtkb3duOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICBvbkV4cG9ydEpzb246IChqc29uOiBzdHJpbmcpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuICByZXNvbHZlSW1hZ2U6IChzb3VyY2U6IHN0cmluZykgPT4gc3RyaW5nIHwgbnVsbDtcbiAgb25TYXZlUGFzdGVkSW1hZ2U6IChibG9iOiBCbG9iLCBzdWdnZXN0ZWROYW1lOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgZ2V0SW1hZ2VIb3N0czogKCkgPT4gSW1hZ2VIb3N0Q2hvaWNlW107XG4gIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzOiAoKSA9PiBzdHJpbmdbXTtcbiAgb25VcGxvYWRJbWFnZTogKGJsb2I6IEJsb2IsIHN1Z2dlc3RlZE5hbWU6IHN0cmluZywgaG9zdElkczogc3RyaW5nW10pID0+IFByb21pc2U8SW1hZ2VIb3N0VXBsb2FkQmF0Y2g+O1xuICBvblJlYWRJbWFnZVNvdXJjZTogKHNvdXJjZTogc3RyaW5nKSA9PiBQcm9taXNlPHsgYmxvYjogQmxvYjsgc3VnZ2VzdGVkTmFtZTogc3RyaW5nIH0gfCBudWxsPjtcbiAgb25TY2hlZHVsZUF1dG9VcGxvYWQ6IChub2RlSWQ6IHN0cmluZywgYmxvY2tJZDogc3RyaW5nLCBsb2NhbFBhdGg6IHN0cmluZywgc3VnZ2VzdGVkTmFtZTogc3RyaW5nKSA9PiBib29sZWFuO1xuICBvbkNyZWF0ZVN1Ym1hcDogKG5vZGU6IE1pbmRNYXBOb2RlKSA9PiBQcm9taXNlPE1pbmRNYXBTdWJtYXA+O1xuICBvbk9wZW5NaW5kTWFwOiAocGF0aDogc3RyaW5nLCBmb2N1c05vZGVJZD86IHN0cmluZykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIG9uR2xvYmFsU2VhcmNoOiAoKSA9PiB2b2lkO1xuICBvblJlbmRlckNvZGU6IChibG9jazogTWluZE1hcENvZGVCbG9jaywgY29udGFpbmVyOiBIVE1MRWxlbWVudCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcEVkaXRvck9wdGlvbnMge1xuICBkZWZhdWx0Tm9kZVNoYXBlOiBOb2RlU2hhcGU7XG4gIGRlZmF1bHRBcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZTtcbiAgc2hvd1Rhc2tQcm9ncmVzczogYm9vbGVhbjtcbiAgYXV0b0ZpdE9uT3BlbjogYm9vbGVhbjtcbiAgaGlzdG9yeUxpbWl0OiBudW1iZXI7XG4gIGltYWdlRmFpbG92ZXJFbmFibGVkOiBib29sZWFuO1xuICBpbWFnZUZhaWxvdmVyVGltZW91dFNlY29uZHM6IG51bWJlcjtcbiAgaW1hZ2VGYWlsb3ZlclVzZUxvY2FsRmFsbGJhY2s6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBOb2RlRWRpdFZhbHVlcyB7XG4gIGNvbnRlbnQ6IE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgbm90ZTogc3RyaW5nO1xuICBsaW5rOiBzdHJpbmc7XG4gIGljb246IHN0cmluZztcbiAgdGFnczogc3RyaW5nW107XG4gIHRhc2s/OiBUYXNrU3RhdHVzO1xuICBjb2xvcj86IHN0cmluZztcbiAgdGV4dENvbG9yPzogc3RyaW5nO1xuICBib3JkZXJDb2xvcj86IHN0cmluZztcbiAgYm9yZGVyV2lkdGg/OiBudW1iZXI7XG4gIHNoYXBlPzogTm9kZVNoYXBlO1xuICBib2xkPzogYm9vbGVhbjtcbiAgaXRhbGljPzogYm9vbGVhbjtcbiAgdW5kZXJsaW5lPzogYm9vbGVhbjtcbiAgZm9udFNpemU/OiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHN0eWxlRXF1YWxzKGxlZnQ6IE1pbmRNYXBUZXh0U3R5bGUgfCB1bmRlZmluZWQsIHJpZ2h0OiBNaW5kTWFwVGV4dFN0eWxlIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShsZWZ0ID8/IHt9KSA9PT0gSlNPTi5zdHJpbmdpZnkocmlnaHQgPz8ge30pO1xufVxuXG5mdW5jdGlvbiByZW5kZXJSaWNoVGV4dFJ1bnMoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcnVuczogTWluZE1hcFRleHRSdW5bXSB8IHVuZGVmaW5lZCwgZmFsbGJhY2tUZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29udGFpbmVyLmVtcHR5KCk7XG4gIGlmICghcnVucz8ubGVuZ3RoKSB7XG4gICAgY29udGFpbmVyLnNldFRleHQoZmFsbGJhY2tUZXh0KTtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCBydW4gb2YgcnVucykge1xuICAgIGNvbnN0IHNwYW4gPSBjb250YWluZXIuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtcmljaC1ydW5cIiwgdGV4dDogcnVuLnRleHQgfSk7XG4gICAgaWYgKHJ1bi5zdHlsZT8uYm9sZCAhPT0gdW5kZWZpbmVkKSBzcGFuLnN0eWxlLmZvbnRXZWlnaHQgPSBydW4uc3R5bGUuYm9sZCA/IFwiNzAwXCIgOiBcIjQwMFwiO1xuICAgIGlmIChydW4uc3R5bGU/Lml0YWxpYyAhPT0gdW5kZWZpbmVkKSBzcGFuLnN0eWxlLmZvbnRTdHlsZSA9IHJ1bi5zdHlsZS5pdGFsaWMgPyBcIml0YWxpY1wiIDogXCJub3JtYWxcIjtcbiAgICBjb25zdCBkZWNvcmF0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAocnVuLnN0eWxlPy51bmRlcmxpbmUpIGRlY29yYXRpb25zLnB1c2goXCJ1bmRlcmxpbmVcIik7XG4gICAgaWYgKHJ1bi5zdHlsZT8uc3RyaWtlKSBkZWNvcmF0aW9ucy5wdXNoKFwibGluZS10aHJvdWdoXCIpO1xuICAgIGlmIChkZWNvcmF0aW9ucy5sZW5ndGgpIHNwYW4uc3R5bGUudGV4dERlY29yYXRpb25MaW5lID0gZGVjb3JhdGlvbnMuam9pbihcIiBcIik7XG4gICAgaWYgKHJ1bi5zdHlsZT8uY29sb3IpIHNwYW4uc3R5bGUuY29sb3IgPSBydW4uc3R5bGUuY29sb3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3R5bGVGcm9tRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCwgaW5oZXJpdGVkOiBNaW5kTWFwVGV4dFN0eWxlKTogTWluZE1hcFRleHRTdHlsZSB7XG4gIGNvbnN0IHN0eWxlOiBNaW5kTWFwVGV4dFN0eWxlID0geyAuLi5pbmhlcml0ZWQgfTtcbiAgY29uc3QgdGFnID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGlmICh0YWcgPT09IFwiYlwiIHx8IHRhZyA9PT0gXCJzdHJvbmdcIikgc3R5bGUuYm9sZCA9IHRydWU7XG4gIGlmICh0YWcgPT09IFwiaVwiIHx8IHRhZyA9PT0gXCJlbVwiKSBzdHlsZS5pdGFsaWMgPSB0cnVlO1xuICBpZiAodGFnID09PSBcInVcIikgc3R5bGUudW5kZXJsaW5lID0gdHJ1ZTtcbiAgaWYgKHRhZyA9PT0gXCJzXCIgfHwgdGFnID09PSBcInN0cmlrZVwiIHx8IHRhZyA9PT0gXCJkZWxcIikgc3R5bGUuc3RyaWtlID0gdHJ1ZTtcbiAgY29uc3QgaW5saW5lID0gZWxlbWVudC5zdHlsZTtcbiAgaWYgKGlubGluZS5mb250V2VpZ2h0ICYmIChpbmxpbmUuZm9udFdlaWdodCA9PT0gXCJib2xkXCIgfHwgTnVtYmVyKGlubGluZS5mb250V2VpZ2h0KSA+PSA2MDApKSBzdHlsZS5ib2xkID0gdHJ1ZTtcbiAgaWYgKGlubGluZS5mb250U3R5bGUgPT09IFwiaXRhbGljXCIpIHN0eWxlLml0YWxpYyA9IHRydWU7XG4gIGNvbnN0IGRlY29yYXRpb24gPSBgJHtpbmxpbmUudGV4dERlY29yYXRpb259ICR7aW5saW5lLnRleHREZWNvcmF0aW9uTGluZX1gO1xuICBpZiAoZGVjb3JhdGlvbi5pbmNsdWRlcyhcInVuZGVybGluZVwiKSkgc3R5bGUudW5kZXJsaW5lID0gdHJ1ZTtcbiAgaWYgKGRlY29yYXRpb24uaW5jbHVkZXMoXCJsaW5lLXRocm91Z2hcIikpIHN0eWxlLnN0cmlrZSA9IHRydWU7XG4gIGNvbnN0IGZvbnRDb2xvciA9IHRhZyA9PT0gXCJmb250XCIgPyBlbGVtZW50LmdldEF0dHJpYnV0ZShcImNvbG9yXCIpIDogbnVsbDtcbiAgY29uc3QgY29sb3IgPSBpbmxpbmUuY29sb3IgfHwgZm9udENvbG9yIHx8IFwiXCI7XG4gIGlmIChjb2xvcikge1xuICAgIGNvbnN0IHByb2JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgcHJvYmUuc3R5bGUuY29sb3IgPSBjb2xvcjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHByb2JlKTtcbiAgICBjb25zdCBub3JtYWxpemVkID0gZ2V0Q29tcHV0ZWRTdHlsZShwcm9iZSkuY29sb3IubWF0Y2goL1xcZCsvZyk/LnNsaWNlKDAsIDMpLm1hcChOdW1iZXIpO1xuICAgIHByb2JlLnJlbW92ZSgpO1xuICAgIGlmIChub3JtYWxpemVkPy5sZW5ndGggPT09IDMpIHN0eWxlLmNvbG9yID0gYCMke25vcm1hbGl6ZWQubWFwKCh2YWx1ZSkgPT4gdmFsdWUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSkuam9pbihcIlwiKX1gO1xuICB9XG4gIHJldHVybiBzdHlsZTtcbn1cblxuZnVuY3Rpb24gcmVhZFJpY2hUZXh0RWRpdG9yKGVkaXRvcjogSFRNTEVsZW1lbnQpOiB7IHRleHQ6IHN0cmluZzsgcmljaFRleHQ/OiBNaW5kTWFwVGV4dFJ1bltdIH0ge1xuICBjb25zdCByYXdSdW5zOiBNaW5kTWFwVGV4dFJ1bltdID0gW107XG4gIGNvbnN0IHZpc2l0ID0gKG5vZGU6IE5vZGUsIGluaGVyaXRlZDogTWluZE1hcFRleHRTdHlsZSk6IHZvaWQgPT4ge1xuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgY29uc3QgdGV4dCA9IChub2RlLnRleHRDb250ZW50ID8/IFwiXCIpLnJlcGxhY2UoL1xccj9cXG4vZywgXCIgXCIpO1xuICAgICAgaWYgKCF0ZXh0KSByZXR1cm47XG4gICAgICBjb25zdCBzdHlsZSA9IE9iamVjdC52YWx1ZXMoaW5oZXJpdGVkKS5zb21lKCh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCkgPyB7IC4uLmluaGVyaXRlZCB9IDogdW5kZWZpbmVkO1xuICAgICAgY29uc3QgcHJldmlvdXMgPSByYXdSdW5zLmF0KC0xKTtcbiAgICAgIGlmIChwcmV2aW91cyAmJiBzdHlsZUVxdWFscyhwcmV2aW91cy5zdHlsZSwgc3R5bGUpKSBwcmV2aW91cy50ZXh0ICs9IHRleHQ7XG4gICAgICBlbHNlIHJhd1J1bnMucHVzaCh7IHRleHQsIHN0eWxlIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm47XG4gICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gXCJCUlwiKSB7XG4gICAgICByYXdSdW5zLnB1c2goeyB0ZXh0OiBcIiBcIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc3R5bGUgPSBzdHlsZUZyb21FbGVtZW50KG5vZGUsIGluaGVyaXRlZCk7XG4gICAgbm9kZS5jaGlsZE5vZGVzLmZvckVhY2goKGNoaWxkKSA9PiB2aXNpdChjaGlsZCwgc3R5bGUpKTtcbiAgICBpZiAoW1wiRElWXCIsIFwiUFwiXS5pbmNsdWRlcyhub2RlLnRhZ05hbWUpICYmIHJhd1J1bnMubGVuZ3RoICYmICFyYXdSdW5zLmF0KC0xKT8udGV4dC5lbmRzV2l0aChcIiBcIikpIHJhd1J1bnMucHVzaCh7IHRleHQ6IFwiIFwiIH0pO1xuICB9O1xuICBlZGl0b3IuY2hpbGROb2Rlcy5mb3JFYWNoKChjaGlsZCkgPT4gdmlzaXQoY2hpbGQsIHt9KSk7XG4gIGNvbnN0IGZhbGxiYWNrID0gZWRpdG9yLnRleHRDb250ZW50Py5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCkgPz8gXCJcIjtcbiAgY29uc3QgcmljaFRleHQgPSBub3JtYWxpemVSaWNoVGV4dChyYXdSdW5zLCBmYWxsYmFjayk7XG4gIHJldHVybiB7IHRleHQ6IHJpY2hUZXh0UGxhaW5UZXh0KHJpY2hUZXh0LCBmYWxsYmFjaykudHJpbSgpLCByaWNoVGV4dCB9O1xufVxuXG5jbGFzcyBJbWFnZVByZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBzY2FsZSA9IDE7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHByaXZhdGUgcmVhZG9ubHkgc291cmNlOiBzdHJpbmcsIHByaXZhdGUgcmVhZG9ubHkgYWx0OiBzdHJpbmcpIHtcbiAgICBzdXBlcihhcHApO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIHRoaXMubW9kYWxFbC5hZGRDbGFzcyhcIm1tYy1pbWFnZS1wcmV2aWV3LW1vZGFsXCIpO1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KHRoaXMuYWx0IHx8IFwiXHU1NkZFXHU3MjQ3XHU5ODg0XHU4OUM4XCIpO1xuICAgIGNvbnN0IHRvb2xiYXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLXByZXZpZXctdG9vbGJhclwiIH0pO1xuICAgIGNvbnN0IGltYWdlV3JhcCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtaW1hZ2UtcHJldmlldy1zdGFnZVwiIH0pO1xuICAgIGNvbnN0IGltYWdlID0gaW1hZ2VXcmFwLmNyZWF0ZUVsKFwiaW1nXCIsIHsgYXR0cjogeyBzcmM6IHRoaXMuc291cmNlLCBhbHQ6IHRoaXMuYWx0IHx8IFwiXHU1NkZFXHU3MjQ3XCIgfSB9KTtcbiAgICBsZXQgYmFzZVdpZHRoID0gMDtcbiAgICBsZXQgYmFzZUhlaWdodCA9IDA7XG4gICAgY29uc3QgYXBwbHlTY2FsZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgIGlmICghYmFzZVdpZHRoIHx8ICFiYXNlSGVpZ2h0KSByZXR1cm47XG4gICAgICBpbWFnZS5zdHlsZS53aWR0aCA9IGAke01hdGgubWF4KDEsIE1hdGgucm91bmQoYmFzZVdpZHRoICogdGhpcy5zY2FsZSkpfXB4YDtcbiAgICAgIGltYWdlLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWF4KDEsIE1hdGgucm91bmQoYmFzZUhlaWdodCAqIHRoaXMuc2NhbGUpKX1weGA7XG4gICAgfTtcbiAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KDMyMCwgaW1hZ2VXcmFwLmNsaWVudFdpZHRoICogMC45KTtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWF4KDIyMCwgaW1hZ2VXcmFwLmNsaWVudEhlaWdodCAqIDAuOSk7XG4gICAgICBjb25zdCBmaXQgPSBNYXRoLm1pbigxLCBhdmFpbGFibGVXaWR0aCAvIE1hdGgubWF4KDEsIGltYWdlLm5hdHVyYWxXaWR0aCksIGF2YWlsYWJsZUhlaWdodCAvIE1hdGgubWF4KDEsIGltYWdlLm5hdHVyYWxIZWlnaHQpKTtcbiAgICAgIGJhc2VXaWR0aCA9IE1hdGgubWF4KDEsIGltYWdlLm5hdHVyYWxXaWR0aCAqIGZpdCk7XG4gICAgICBiYXNlSGVpZ2h0ID0gTWF0aC5tYXgoMSwgaW1hZ2UubmF0dXJhbEhlaWdodCAqIGZpdCk7XG4gICAgICBhcHBseVNjYWxlKCk7XG4gICAgfSk7XG4gICAgY29uc3QgYnV0dG9uID0gKGxhYmVsOiBzdHJpbmcsIGFjdGlvbjogKCkgPT4gdm9pZCk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgZWwgPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFjdGlvbik7XG4gICAgfTtcbiAgICBidXR0b24oXCJcdTIyMTJcIiwgKCkgPT4geyB0aGlzLnNjYWxlID0gTWF0aC5tYXgoMC4yLCB0aGlzLnNjYWxlIC0gMC4yKTsgYXBwbHlTY2FsZSgpOyB9KTtcbiAgICBidXR0b24oXCIxMDAlXCIsICgpID0+IHsgdGhpcy5zY2FsZSA9IDE7IGFwcGx5U2NhbGUoKTsgfSk7XG4gICAgYnV0dG9uKFwiK1wiLCAoKSA9PiB7IHRoaXMuc2NhbGUgPSBNYXRoLm1pbig1LCB0aGlzLnNjYWxlICsgMC4yKTsgYXBwbHlTY2FsZSgpOyB9KTtcbiAgICBpbWFnZVdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuc2NhbGUgPSBNYXRoLm1pbig1LCBNYXRoLm1heCgwLjIsIHRoaXMuc2NhbGUgKyAoZXZlbnQuZGVsdGFZIDwgMCA/IDAuMTUgOiAtMC4xNSkpKTtcbiAgICAgIGFwcGx5U2NhbGUoKTtcbiAgICB9LCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xuICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoKSA9PiB7IHRoaXMuc2NhbGUgPSAxOyBhcHBseVNjYWxlKCk7IH0pO1xuICB9XG59XG5cbmNsYXNzIEltYWdlSG9zdFBpY2tlck1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmVkID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VsZWN0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGhvc3RzOiBJbWFnZUhvc3RDaG9pY2VbXSxcbiAgICBpbml0aWFsSWRzOiBzdHJpbmdbXSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJlc29sdmVTZWxlY3Rpb246IChpZHM6IHN0cmluZ1tdIHwgbnVsbCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIGluaXRpYWxJZHMuZm9yRWFjaCgoaWQpID0+IHRoaXMuc2VsZWN0ZWQuYWRkKGlkKSk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTkwMDlcdTYyRTlcdTRFMEFcdTRGMjBcdTU2RkVcdTVFOEFcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbXMtaW1hZ2UtaG9zdC1waWNrZXJcIik7XG4gICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIixcbiAgICAgIHRleHQ6IFwiXHU1M0VGXHU0RUU1XHU5MDA5XHU2MkU5XHU0RTAwXHU0RTJBXHU2MjE2XHU1OTFBXHU0RTJBXHU1NkZFXHU1RThBXHUzMDAyXHU1MTY4XHU5MEU4XHU0RTBBXHU0RjIwXHU2MjEwXHU1MjlGXHU1NDBFXHVGRjBDXHU3QjJDXHU0RTAwXHU5ODc5XHU3Njg0XHU1NzMwXHU1NzQwXHU0RjFBXHU0RjVDXHU0RTNBXHU4MjgyXHU3MEI5XHU1RjUzXHU1MjREXHU2NjNFXHU3OTNBXHU1NzMwXHU1NzQwXHVGRjBDXHU1MTc2XHU0RjU5XHU1NzMwXHU1NzQwXHU0RjFBXHU0RjVDXHU0RTNBXHU5NTVDXHU1MENGXHU0RkREXHU1QjU4XHUzMDAyXCJcbiAgICB9KTtcbiAgICBjb25zdCBsaXN0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LXBpY2tlci1saXN0XCIgfSk7XG4gICAgZm9yIChjb25zdCBob3N0IG9mIHRoaXMuaG9zdHMpIHtcbiAgICAgIGNvbnN0IGxhYmVsID0gbGlzdC5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcIm1tcy1pbWFnZS1ob3N0LXBpY2tlci1pdGVtXCIgfSk7XG4gICAgICBjb25zdCBjaGVja2JveCA9IGxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgICBjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZC5oYXMoaG9zdC5pZCk7XG4gICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgaWYgKGNoZWNrYm94LmNoZWNrZWQpIHRoaXMuc2VsZWN0ZWQuYWRkKGhvc3QuaWQpOyBlbHNlIHRoaXMuc2VsZWN0ZWQuZGVsZXRlKGhvc3QuaWQpO1xuICAgICAgfSk7XG4gICAgICBsYWJlbC5jcmVhdGVTcGFuKHsgdGV4dDogaG9zdC5uYW1lIH0pO1xuICAgIH1cbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1vZGFsLWJ1dHRvbi1jb250YWluZXJcIiB9KTtcbiAgICBjb25zdCBjYW5jZWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTUzRDZcdTZEODhcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIGNvbnN0IGNvbmZpcm0gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTc4NkVcdTVCOUFcIiwgY2xzOiBcIm1vZC1jdGFcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgY29uZmlybS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkLnNpemUpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlx1OEJGN1x1ODFGM1x1NUMxMVx1OTAwOVx1NjJFOVx1NEUwMFx1NEUyQVx1NTZGRVx1NUU4QVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXNvbHZlZCA9IHRydWU7XG4gICAgICB0aGlzLnJlc29sdmVTZWxlY3Rpb24oQXJyYXkuZnJvbSh0aGlzLnNlbGVjdGVkKSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5yZXNvbHZlZCkgdGhpcy5yZXNvbHZlU2VsZWN0aW9uKG51bGwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNob29zZUltYWdlSG9zdHMoYXBwOiBBcHAsIGhvc3RzOiBJbWFnZUhvc3RDaG9pY2VbXSwgaW5pdGlhbElkczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdIHwgbnVsbD4ge1xuICBpZiAoIWhvc3RzLmxlbmd0aCkge1xuICAgIG5ldyBOb3RpY2UoXCJcdTZDQTFcdTY3MDlcdTUzRUZcdTc1MjhcdTU2RkVcdTVFOEFcdUZGMENcdThCRjdcdTUxNDhcdTU3MjhcdTYzRDJcdTRFRjZcdThCQkVcdTdGNkVcdTRFMkRcdTkxNERcdTdGNkVcdTVFNzZcdTU0MkZcdTc1MjhcdTU2RkVcdTVFOEFcIik7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxuICBjb25zdCBhbGxvd2VkID0gbmV3IFNldChob3N0cy5tYXAoKGhvc3QpID0+IGhvc3QuaWQpKTtcbiAgY29uc3QgaW5pdGlhbCA9IGluaXRpYWxJZHMuZmlsdGVyKChpZCkgPT4gYWxsb3dlZC5oYXMoaWQpKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBuZXcgSW1hZ2VIb3N0UGlja2VyTW9kYWwoYXBwLCBob3N0cywgaW5pdGlhbC5sZW5ndGggPyBpbml0aWFsIDogW2hvc3RzWzBdIS5pZF0sIHJlc29sdmUpLm9wZW4oKSk7XG59XG5cbmNsYXNzIE5vZGVFZGl0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbm9kZTogTWluZE1hcE5vZGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdFNoYXBlOiBOb2RlU2hhcGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2FsbGJhY2tzOiBQaWNrPE1pbmRNYXBFZGl0b3JDYWxsYmFja3MsIFwicmVzb2x2ZUltYWdlXCIgfCBcIm9uU2F2ZVBhc3RlZEltYWdlXCIgfCBcImdldEltYWdlSG9zdHNcIiB8IFwiZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHNcIiB8IFwib25VcGxvYWRJbWFnZVwiIHwgXCJvblJlYWRJbWFnZVNvdXJjZVwiPjtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6ICh2YWx1ZXM6IE5vZGVFZGl0VmFsdWVzLCBtb2RlOiBcImF1dG9zYXZlXCIgfCBcImNvbW1pdFwiKSA9PiB2b2lkO1xuICBwcml2YXRlIHNhdmVPbkNsb3NlOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjbG9zZVdpdGhvdXRGbHVzaCA9IGZhbHNlO1xuICBwcml2YXRlIG91dHNpZGVQb2ludGVySGFuZGxlcjogKChldmVudDogUG9pbnRlckV2ZW50KSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIG5vZGU6IE1pbmRNYXBOb2RlLFxuICAgIGRlZmF1bHRTaGFwZTogTm9kZVNoYXBlLFxuICAgIGNhbGxiYWNrczogUGljazxNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzLCBcInJlc29sdmVJbWFnZVwiIHwgXCJvblNhdmVQYXN0ZWRJbWFnZVwiIHwgXCJnZXRJbWFnZUhvc3RzXCIgfCBcImdldERlZmF1bHRVcGxvYWRIb3N0SWRzXCIgfCBcIm9uVXBsb2FkSW1hZ2VcIiB8IFwib25SZWFkSW1hZ2VTb3VyY2VcIj4sXG4gICAgc3VibWl0OiAodmFsdWVzOiBOb2RlRWRpdFZhbHVlcywgbW9kZTogXCJhdXRvc2F2ZVwiIHwgXCJjb21taXRcIikgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubm9kZSA9IG5vZGU7XG4gICAgdGhpcy5kZWZhdWx0U2hhcGUgPSBkZWZhdWx0U2hhcGU7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBjYWxsYmFja3M7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcdTUxODVcdTVCQjlcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtbm9kZS1lZGl0LW1vZGFsXCIpO1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtZWRpdC1mb3JtXCIgfSk7XG4gICAgZm9ybS5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgICAgdGV4dDogXCJcdTgyODJcdTcwQjlcdTUxODVcdTVCQjlcdTc1MzFcdTUzRUZcdTYzOTJcdTVFOEZcdTc2ODRcdTY1ODdcdTVCNTdcdTU3NTdcdTU0OENcdTU2RkVcdTcyNDdcdTU3NTdcdTdFQzRcdTYyMTBcdTMwMDJcdTUzRUZcdTRFRTVcdTUzRUFcdTRGRERcdTc1NTlcdTU2RkVcdTcyNDdcdUZGMENcdTRFNUZcdTUzRUZcdTRFRTVcdTdFQzRcdTU0MDhcdTRFM0FcdTU2RkVcdTcyNDdcdTIxOTJcdTY1ODdcdTVCNTdcdTMwMDFcdTY1ODdcdTVCNTdcdTIxOTJcdTU2RkVcdTcyNDdcdUZGMENcdTYyMTZcdTY1ODdcdTVCNTdcdTIxOTJcdTU2RkVcdTcyNDdcdTIxOTJcdTY1ODdcdTVCNTdcdTMwMDJcIlxuICAgIH0pO1xuXG4gICAgbGV0IHdvcmtpbmdCbG9ja3M6IE1pbmRNYXBDb250ZW50QmxvY2tbXSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobm9kZUNvbnRlbnRCbG9ja3ModGhpcy5ub2RlKSkpIGFzIE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgICBpZiAoIXdvcmtpbmdCbG9ja3MubGVuZ3RoKSB3b3JraW5nQmxvY2tzID0gW3sgaWQ6IG5ld0lkKCksIHR5cGU6IFwidGV4dFwiLCB0ZXh0OiBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiIH1dO1xuICAgIGxldCBzY2hlZHVsZUF1dG9TYXZlOiAoKSA9PiB2b2lkID0gKCkgPT4gdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgYWN0aW9uUm93ID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IGJsb2Nrc0VsID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stbGlzdFwiIH0pO1xuXG4gICAgY29uc3QgY2xvbmVCbG9ja3MgPSAoKTogTWluZE1hcENvbnRlbnRCbG9ja1tdID0+IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkod29ya2luZ0Jsb2NrcykpIGFzIE1pbmRNYXBDb250ZW50QmxvY2tbXTtcbiAgICBjb25zdCB2YWxpZEJsb2NrcyA9ICgpOiBNaW5kTWFwQ29udGVudEJsb2NrW10gPT4gY2xvbmVCbG9ja3MoKS5maWx0ZXIoKGJsb2NrKSA9PiBibG9jay50eXBlID09PSBcImltYWdlXCIgPyBCb29sZWFuKGJsb2NrLnNvdXJjZS50cmltKCkpIDogQm9vbGVhbihibG9jay50ZXh0LnRyaW0oKSkpO1xuXG4gICAgY29uc3QgcmVuZGVyVGV4dEJsb2NrID0gKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGJsb2NrOiBNaW5kTWFwVGV4dENvbnRlbnRCbG9jayk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgdG9vbGJhciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXJpY2gtdGV4dC10b29sYmFyXCIgfSk7XG4gICAgICBjb25zdCBzb3VyY2UgPSBjb250YWluZXIuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7XG4gICAgICAgIGNsczogXCJtbWMtcmljaC10ZXh0LXNvdXJjZVwiLFxuICAgICAgICBhdHRyOiB7IHJvd3M6IFwiM1wiLCBzcGVsbGNoZWNrOiBcInRydWVcIiwgcGxhY2Vob2xkZXI6IFwiXHU4RjkzXHU1MTY1XHU2NTg3XHU1QjU3XHVGRjFCXHU1M0VGXHU0RUU1XHU1MTY4XHU5MEU4XHU1MjIwXHU5NjY0XHVGRjBDXHU4QkE5XHU4MjgyXHU3MEI5XHU1M0VBXHU0RkREXHU3NTU5XHU1NkZFXHU3MjQ3XCIgfVxuICAgICAgfSk7XG4gICAgICBzb3VyY2UudmFsdWUgPSBibG9jay50ZXh0O1xuICAgICAgbGV0IHNhdmVkU3RhcnQgPSBzb3VyY2UudmFsdWUubGVuZ3RoO1xuICAgICAgbGV0IHNhdmVkRW5kID0gc291cmNlLnZhbHVlLmxlbmd0aDtcbiAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXJpY2gtc2VsZWN0aW9uLXN0YXR1c1wiIH0pO1xuICAgICAgY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcmljaC1wcmV2aWV3LWxhYmVsXCIsIHRleHQ6IFwiXHU2NTg3XHU1QjU3XHU2ODM3XHU1RjBGXHU5ODg0XHU4OUM4XCIgfSk7XG4gICAgICBjb25zdCBwcmV2aWV3ID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcmljaC10ZXh0LXByZXZpZXdcIiB9KTtcbiAgICAgIGNvbnN0IHVwZGF0ZVByZXZpZXcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHJlbmRlclJpY2hUZXh0UnVucyhwcmV2aWV3LCBibG9jay5yaWNoVGV4dCwgYmxvY2sudGV4dCB8fCBcIlx1OTg4NFx1ODlDOFx1NjU4N1x1NUI1N1wiKTtcbiAgICAgICAgcHJldmlldy50b2dnbGVDbGFzcyhcImlzLXBsYWNlaG9sZGVyXCIsICFibG9jay50ZXh0KTtcbiAgICAgIH07XG4gICAgICBjb25zdCByZW1lbWJlciA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2F2ZWRTdGFydCA9IHNvdXJjZS5zZWxlY3Rpb25TdGFydCA/PyAwO1xuICAgICAgICBzYXZlZEVuZCA9IHNvdXJjZS5zZWxlY3Rpb25FbmQgPz8gc2F2ZWRTdGFydDtcbiAgICAgICAgY29uc3QgZnJvbSA9IE1hdGgubWluKHNhdmVkU3RhcnQsIHNhdmVkRW5kKTtcbiAgICAgICAgY29uc3QgdG8gPSBNYXRoLm1heChzYXZlZFN0YXJ0LCBzYXZlZEVuZCk7XG4gICAgICAgIHNlbGVjdGlvbi5zZXRUZXh0KGZyb20gPT09IHRvID8gYFx1NTE0OVx1NjgwN1x1NEY0RFx1N0Y2RVx1RkYxQSR7ZnJvbSArIDF9YCA6IGBcdTVERjJcdTkwMDlcdTYyRTlcdTdCMkMgJHtmcm9tICsgMX1cdTIwMTMke3RvfSBcdTRFMkFcdTVCNTdcdTdCMjZgKTtcbiAgICAgIH07XG4gICAgICBjb25zdCByYW5nZSA9ICgpOiB7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyIH0gfCBudWxsID0+IHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihibG9jay50ZXh0Lmxlbmd0aCwgTWF0aC5taW4oc2F2ZWRTdGFydCwgc2F2ZWRFbmQpKSk7XG4gICAgICAgIGNvbnN0IGVuZCA9IE1hdGgubWF4KHN0YXJ0LCBNYXRoLm1pbihibG9jay50ZXh0Lmxlbmd0aCwgTWF0aC5tYXgoc2F2ZWRTdGFydCwgc2F2ZWRFbmQpKSk7XG4gICAgICAgIGlmIChzdGFydCA9PT0gZW5kKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIlx1OEJGN1x1NTE0OFx1OTAwOVx1NjJFOVx1OTcwMFx1ODk4MVx1OEJCRVx1N0Y2RVx1NjgzQ1x1NUYwRlx1NzY4NFx1NjU4N1x1NUI1N1wiKTtcbiAgICAgICAgICBzb3VyY2UuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2UuZm9jdXMoKTsgc291cmNlLnNldFNlbGVjdGlvblJhbmdlKHN0YXJ0LCBlbmQpO1xuICAgICAgICByZXR1cm4geyBzdGFydCwgZW5kIH07XG4gICAgICB9O1xuICAgICAgY29uc3Qgc3R5bGVCdXR0b24gPSAobGFiZWw6IHN0cmluZywgdGl0bGU6IHN0cmluZywgYWN0aW9uOiAoKSA9PiB2b2lkLCBjbHMgPSBcIlwiKTogSFRNTEJ1dHRvbkVsZW1lbnQgPT4ge1xuICAgICAgICBjb25zdCBidG4gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBgbW1jLXJpY2gtdG9vbGJhci1idXR0b24gJHtjbHN9YC50cmltKCksIHRleHQ6IGxhYmVsLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIsIHRpdGxlIH0gfSk7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IGFjdGlvbigpOyB9KTtcbiAgICAgICAgcmV0dXJuIGJ0bjtcbiAgICAgIH07XG4gICAgICBjb25zdCBhcHBseUJvb2xlYW4gPSAoa2V5OiBcImJvbGRcIiB8IFwiaXRhbGljXCIgfCBcInVuZGVybGluZVwiKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gcmFuZ2UoKTsgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBzdHlsZXMgPSByaWNoVGV4dENoYXJhY3RlclN0eWxlcyhibG9jay5yaWNoVGV4dCwgYmxvY2sudGV4dCk7XG4gICAgICAgIGNvbnN0IGVuYWJsZWQgPSBzdHlsZXMuc2xpY2Uoc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCkuZXZlcnkoKHN0eWxlKSA9PiBzdHlsZVtrZXldID09PSB0cnVlKTtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCwgeyBba2V5XTogIWVuYWJsZWQgfSk7XG4gICAgICAgIHVwZGF0ZVByZXZpZXcoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyBzb3VyY2Uuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCk7IHJlbWVtYmVyKCk7XG4gICAgICB9O1xuICAgICAgc3R5bGVCdXR0b24oXCJCXCIsIFwiXHU1MkEwXHU3Qzk3XHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XCIsICgpID0+IGFwcGx5Qm9vbGVhbihcImJvbGRcIiksIFwiaXMtYm9sZFwiKTtcbiAgICAgIHN0eWxlQnV0dG9uKFwiSVwiLCBcIlx1NjU5Q1x1NEY1M1x1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1wiLCAoKSA9PiBhcHBseUJvb2xlYW4oXCJpdGFsaWNcIiksIFwiaXMtaXRhbGljXCIpO1xuICAgICAgc3R5bGVCdXR0b24oXCJVXCIsIFwiXHU3RUQ5XHU2MjQwXHU5MDA5XHU2NTg3XHU1QjU3XHU1MkEwXHU0RTBCXHU1MjEyXHU3RUJGXCIsICgpID0+IGFwcGx5Qm9vbGVhbihcInVuZGVybGluZVwiKSwgXCJpcy11bmRlcmxpbmVcIik7XG4gICAgICBjb25zdCBjb2xvckxhYmVsID0gdG9vbGJhci5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcIm1tYy1yaWNoLWNvbG9yLWJ1dHRvblwiLCBhdHRyOiB7IHRpdGxlOiBcIlx1NEZFRVx1NjUzOVx1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiIH0gfSk7XG4gICAgICBjb2xvckxhYmVsLmNyZWF0ZVNwYW4oeyB0ZXh0OiBcIlx1OTg5Q1x1ODI3MlwiIH0pO1xuICAgICAgY29uc3QgY29sb3JMaW5lID0gY29sb3JMYWJlbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy1yaWNoLWNvbG9yLWxpbmVcIiB9KTtcbiAgICAgIGNvbnN0IGNvbG9yID0gY29sb3JMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjb2xvclwiLCBhdHRyOiB7IFwiYXJpYS1sYWJlbFwiOiBcIlx1NjU4N1x1NUI1N1x1OTg5Q1x1ODI3MlwiIH0gfSk7XG4gICAgICBjb2xvci52YWx1ZSA9IFwiI2VmNDQ0NFwiO1xuICAgICAgY29sb3JMaW5lLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLnZhbHVlO1xuICAgICAgY29sb3IuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHsgY29sb3JMaW5lLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLnZhbHVlOyB9KTtcbiAgICAgIGNvbG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IHJhbmdlKCk7IGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSBhcHBseVJpY2hUZXh0U3R5bGVSYW5nZShibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgc2VsZWN0ZWQuc3RhcnQsIHNlbGVjdGVkLmVuZCwgeyBjb2xvcjogY29sb3IudmFsdWUgfSk7XG4gICAgICAgIHVwZGF0ZVByZXZpZXcoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgfSk7XG4gICAgICBzdHlsZUJ1dHRvbihcIlx1NkUwNVx1OTY2NFx1NjgzQ1x1NUYwRlwiLCBcIlx1NkUwNVx1OTY2NFx1NjI0MFx1OTAwOVx1NjU4N1x1NUI1N1x1NjgzQ1x1NUYwRlwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gcmFuZ2UoKTsgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgICAgICBibG9jay5yaWNoVGV4dCA9IGFwcGx5UmljaFRleHRTdHlsZVJhbmdlKGJsb2NrLnRleHQsIGJsb2NrLnJpY2hUZXh0LCBzZWxlY3RlZC5zdGFydCwgc2VsZWN0ZWQuZW5kLCBudWxsKTtcbiAgICAgICAgdXBkYXRlUHJldmlldygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7XG4gICAgICB9LCBcImlzLXdpZGVcIik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcInNlbGVjdFwiLCByZW1lbWJlcik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHJlbWVtYmVyKTtcbiAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCByZW1lbWJlcik7XG4gICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHNvdXJjZS52YWx1ZS5yZXBsYWNlKC9cXHI/XFxuL2csIFwiIFwiKTtcbiAgICAgICAgYmxvY2sucmljaFRleHQgPSByZWNvbmNpbGVSaWNoVGV4dEFmdGVyRWRpdChibG9jay50ZXh0LCBibG9jay5yaWNoVGV4dCwgbmV4dCk7XG4gICAgICAgIGJsb2NrLnRleHQgPSBuZXh0O1xuICAgICAgICBzb3VyY2UudmFsdWUgPSBuZXh0O1xuICAgICAgICByZW1lbWJlcigpOyB1cGRhdGVQcmV2aWV3KCk7IHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgIH0pO1xuICAgICAgdXBkYXRlUHJldmlldygpOyByZW1lbWJlcigpO1xuICAgIH07XG5cbiAgICBjb25zdCBjaG9vc2VJbWFnZSA9IChibG9jazogTWluZE1hcEltYWdlQ29udGVudEJsb2NrLCBtb2RlOiBcImxvY2FsXCIgfCBcInJlbW90ZVwiLCByZWZyZXNoOiAoKSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gICAgICB2b2lkIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGxldCBob3N0SWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAobW9kZSA9PT0gXCJyZW1vdGVcIikge1xuICAgICAgICAgIGNvbnN0IGNob3NlbiA9IGF3YWl0IGNob29zZUltYWdlSG9zdHModGhpcy5hcHAsIHRoaXMuY2FsbGJhY2tzLmdldEltYWdlSG9zdHMoKSwgdGhpcy5jYWxsYmFja3MuZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHMoKSk7XG4gICAgICAgICAgaWYgKCFjaG9zZW4pIHJldHVybjtcbiAgICAgICAgICBob3N0SWRzID0gY2hvc2VuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCBuZXcgUHJvbWlzZTxGaWxlIHwgbnVsbD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgICBpbnB1dC50eXBlID0gXCJmaWxlXCI7XG4gICAgICAgICAgaW5wdXQuYWNjZXB0ID0gXCJpbWFnZS8qXCI7XG4gICAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiByZXNvbHZlKGlucHV0LmZpbGVzPy5bMF0gPz8gbnVsbCksIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgICAgICBpbnB1dC5jbGljaygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFmaWxlKSByZXR1cm47XG4gICAgICAgIGlmIChtb2RlID09PSBcImxvY2FsXCIpIHtcbiAgICAgICAgICBjb25zdCBwYXRoID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25TYXZlUGFzdGVkSW1hZ2UoZmlsZSwgZmlsZS5uYW1lKTtcbiAgICAgICAgICBibG9jay5zb3VyY2UgPSBwYXRoO1xuICAgICAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gcGF0aDtcbiAgICAgICAgICBibG9jay5yZW1vdGVTb3VyY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGJhdGNoID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25VcGxvYWRJbWFnZShmaWxlLCBmaWxlLm5hbWUsIGhvc3RJZHMpO1xuICAgICAgICAgIGlmICghYmF0Y2guc3VjY2Vzc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGJhdGNoLmZhaWx1cmVzLm1hcCgoaXRlbSkgPT4gYCR7aXRlbS5ob3N0TmFtZX1cdUZGMUEke2l0ZW0uZXJyb3J9YCkuam9pbihcIlx1RkYxQlwiKSB8fCBcIlx1NjcyQVx1NzdFNVx1OTUxOVx1OEJFRlwiO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB1cGxvYWRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICAgIGJsb2NrLnNvdXJjZSA9IGJhdGNoLnN1Y2Nlc3Nlc1swXSEudXJsO1xuICAgICAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGJsb2NrLnJlbW90ZVNvdXJjZXMgPSBiYXRjaC5zdWNjZXNzZXMubWFwKChpdGVtKSA9PiAoeyAuLi5pdGVtLCB1cGxvYWRlZEF0IH0pKTtcbiAgICAgICAgICBpZiAoYmF0Y2guZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKGBcdTkwRThcdTUyMDZcdTU2RkVcdTVFOEFcdTRFMEFcdTRGMjBcdTU5MzFcdThEMjVcdUZGMUEke2JhdGNoLmZhaWx1cmVzLm1hcCgoaXRlbSkgPT4gaXRlbS5ob3N0TmFtZSkuam9pbihcIlx1MzAwMVwiKX1gLCA3MDAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3IE5vdGljZShgXHU1REYyXHU0RTBBXHU0RjIwXHU1MjMwXHVGRjFBJHtiYXRjaC5zdWNjZXNzZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWJsb2NrLmFsdCkgYmxvY2suYWx0ID0gZmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sIFwiXCIpO1xuICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgIHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgIH0pKCkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBpbWFnZSBvcGVyYXRpb24gZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgICAgbmV3IE5vdGljZShgJHttb2RlID09PSBcInJlbW90ZVwiID8gXCJcdTRFMEFcdTRGMjBcdTU2RkVcdTVFOEFcIiA6IFwiXHU0RkREXHU1QjU4XHU1NkZFXHU3MjQ3XCJ9XHU1OTMxXHU4RDI1XHVGRjFBJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCwgNzAwMCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgdXBsb2FkRXhpc3RpbmdJbWFnZSA9IChibG9jazogTWluZE1hcEltYWdlQ29udGVudEJsb2NrLCByZWZyZXNoOiAoKSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gICAgICB2b2lkIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNob3NlbiA9IGF3YWl0IGNob29zZUltYWdlSG9zdHModGhpcy5hcHAsIHRoaXMuY2FsbGJhY2tzLmdldEltYWdlSG9zdHMoKSwgdGhpcy5jYWxsYmFja3MuZ2V0RGVmYXVsdFVwbG9hZEhvc3RJZHMoKSk7XG4gICAgICAgIGlmICghY2hvc2VuKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHJlYWRhYmxlU291cmNlID0gYmxvY2subG9jYWxTb3VyY2UgfHwgYmxvY2suc291cmNlO1xuICAgICAgICBjb25zdCBpbWFnZSA9IGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uUmVhZEltYWdlU291cmNlKHJlYWRhYmxlU291cmNlKTtcbiAgICAgICAgaWYgKCFpbWFnZSkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcdTRFMERcdTY2MkZcdTUzRUZcdThCRkJcdTUzRDZcdTc2ODRcdTY3MkNcdTU3MzBcdTY1ODdcdTRFRjZcdUZGMUJcdThCRjdcdTRGN0ZcdTc1MjhcdTIwMThcdTRFMEFcdTRGMjBcdTUyMzBcdTU2RkVcdTVFOEFcdTIwMTlcdTkxQ0RcdTY1QjBcdTkwMDlcdTYyRTlcdTU2RkVcdTcyNDdcIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJhdGNoID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25VcGxvYWRJbWFnZShpbWFnZS5ibG9iLCBpbWFnZS5zdWdnZXN0ZWROYW1lLCBjaG9zZW4pO1xuICAgICAgICBpZiAoIWJhdGNoLnN1Y2Nlc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYmF0Y2guZmFpbHVyZXMubWFwKChpdGVtKSA9PiBgJHtpdGVtLmhvc3ROYW1lfVx1RkYxQSR7aXRlbS5lcnJvcn1gKS5qb2luKFwiXHVGRjFCXCIpIHx8IFwiXHU0RTBBXHU0RjIwXHU1OTMxXHU4RDI1XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVwbG9hZGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gbmV3IE1hcCgoYmxvY2sucmVtb3RlU291cmNlcyA/PyBbXSkubWFwKChpdGVtKSA9PiBbaXRlbS5ob3N0SWQsIGl0ZW1dKSk7XG4gICAgICAgIGJhdGNoLnN1Y2Nlc3Nlcy5mb3JFYWNoKChpdGVtKSA9PiBleGlzdGluZy5zZXQoaXRlbS5ob3N0SWQsIHsgLi4uaXRlbSwgdXBsb2FkZWRBdCB9KSk7XG4gICAgICAgIGJsb2NrLnJlbW90ZVNvdXJjZXMgPSBBcnJheS5mcm9tKGV4aXN0aW5nLnZhbHVlcygpKTtcbiAgICAgICAgYmxvY2subG9jYWxTb3VyY2UgPSByZWFkYWJsZVNvdXJjZTtcbiAgICAgICAgaWYgKCFiYXRjaC5mYWlsdXJlcy5sZW5ndGgpIGJsb2NrLnNvdXJjZSA9IGJhdGNoLnN1Y2Nlc3Nlc1swXSEudXJsO1xuICAgICAgICByZWZyZXNoKCk7XG4gICAgICAgIHNjaGVkdWxlQXV0b1NhdmUoKTtcbiAgICAgICAgaWYgKGJhdGNoLmZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYFx1OTBFOFx1NTIwNlx1NTZGRVx1NUU4QVx1NEUwQVx1NEYyMFx1NTkzMVx1OEQyNVx1RkYwQ1x1NjcyQ1x1NTczMFx1NTZGRVx1NzI0N1x1NURGMlx1NEZERFx1NzU1OVx1RkYxQSR7YmF0Y2guZmFpbHVyZXMubWFwKChpdGVtKSA9PiBpdGVtLmhvc3ROYW1lKS5qb2luKFwiXHUzMDAxXCIpfWAsIDcwMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYFx1NUY1M1x1NTI0RFx1NTZGRVx1NzI0N1x1NURGMlx1NEUwQVx1NEYyMFx1NTIzMFx1RkYxQSR7YmF0Y2guc3VjY2Vzc2VzLm1hcCgoaXRlbSkgPT4gaXRlbS5ob3N0TmFtZSkuam9pbihcIlx1MzAwMVwiKX1gKTtcbiAgICAgICAgfVxuICAgICAgfSkoKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIGV4aXN0aW5nIGltYWdlIHVwbG9hZCBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgICBuZXcgTm90aWNlKGBcdTRFMEFcdTRGMjBcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcdTU5MzFcdThEMjVcdUZGMUEke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLCA3MDAwKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCByZW5kZXJCbG9ja3MgPSAoKTogdm9pZCA9PiB7XG4gICAgICBibG9ja3NFbC5lbXB0eSgpO1xuICAgICAgd29ya2luZ0Jsb2Nrcy5mb3JFYWNoKChibG9jaywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgY2FyZCA9IGJsb2Nrc0VsLmNyZWF0ZURpdih7IGNsczogYG1tYy1jb250ZW50LWJsb2NrIGlzLSR7YmxvY2sudHlwZX1gIH0pO1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1oZWFkZXJcIiB9KTtcbiAgICAgICAgaGVhZGVyLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stdGl0bGVcIiwgdGV4dDogYmxvY2sudHlwZSA9PT0gXCJ0ZXh0XCIgPyBgXHU2NTg3XHU1QjU3XHU1NzU3ICR7aW5kZXggKyAxfWAgOiBgXHU1NkZFXHU3MjQ3XHU1NzU3ICR7aW5kZXggKyAxfWAgfSk7XG4gICAgICAgIGNvbnN0IGNvbnRyb2xzID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1jb250cm9sc1wiIH0pO1xuICAgICAgICBjb25zdCBjb250cm9sID0gKGljb246IHN0cmluZywgdGl0bGU6IHN0cmluZywgYWN0aW9uOiAoKSA9PiB2b2lkLCBkaXNhYmxlZCA9IGZhbHNlKTogdm9pZCA9PiB7XG4gICAgICAgICAgY29uc3QgYnRuID0gY29udHJvbHMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb25cIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiLCB0aXRsZSwgXCJhcmlhLWxhYmVsXCI6IHRpdGxlIH0gfSk7XG4gICAgICAgICAgc2V0SWNvbihidG4sIGljb24pOyBidG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5wcmV2ZW50RGVmYXVsdCgpOyBhY3Rpb24oKTsgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnRyb2woXCJhcnJvdy11cFwiLCBcIlx1NEUwQVx1NzlGQlwiLCAoKSA9PiB7IFt3b3JraW5nQmxvY2tzW2luZGV4IC0gMV0sIHdvcmtpbmdCbG9ja3NbaW5kZXhdXSA9IFt3b3JraW5nQmxvY2tzW2luZGV4XSEsIHdvcmtpbmdCbG9ja3NbaW5kZXggLSAxXSFdOyByZW5kZXJCbG9ja3MoKTsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9LCBpbmRleCA9PT0gMCk7XG4gICAgICAgIGNvbnRyb2woXCJhcnJvdy1kb3duXCIsIFwiXHU0RTBCXHU3OUZCXCIsICgpID0+IHsgW3dvcmtpbmdCbG9ja3NbaW5kZXggKyAxXSwgd29ya2luZ0Jsb2Nrc1tpbmRleF1dID0gW3dvcmtpbmdCbG9ja3NbaW5kZXhdISwgd29ya2luZ0Jsb2Nrc1tpbmRleCArIDFdIV07IHJlbmRlckJsb2NrcygpOyBzY2hlZHVsZUF1dG9TYXZlKCk7IH0sIGluZGV4ID09PSB3b3JraW5nQmxvY2tzLmxlbmd0aCAtIDEpO1xuICAgICAgICBjb250cm9sKFwidHJhc2gtMlwiLCBcIlx1NTIyMFx1OTY2NFx1NTE4NVx1NUJCOVx1NTc1N1wiLCAoKSA9PiB7IHdvcmtpbmdCbG9ja3Muc3BsaWNlKGluZGV4LCAxKTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSk7XG4gICAgICAgIGlmIChibG9jay50eXBlID09PSBcInRleHRcIikge1xuICAgICAgICAgIHJlbmRlclRleHRCbG9jayhjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29udGVudC1ibG9jay1ib2R5XCIgfSksIGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBib2R5ID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbnRlbnQtYmxvY2stYm9keSBtbWMtaW1hZ2UtYmxvY2stZWRpdG9yXCIgfSk7XG4gICAgICAgICAgY29uc3QgcHJldmlldyA9IGJvZHkuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1pbWFnZS1ibG9jay1wcmV2aWV3XCIgfSk7XG4gICAgICAgICAgY29uc3QgcmVmcmVzaCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIHByZXZpZXcuZW1wdHkoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlKGJsb2NrLnNvdXJjZSk7XG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcbiAgICAgICAgICAgICAgY29uc3QgaW1nID0gcHJldmlldy5jcmVhdGVFbChcImltZ1wiLCB7IGF0dHI6IHsgc3JjOiByZXNvbHZlZCwgYWx0OiBibG9jay5hbHQgfHwgXCJcdTU2RkVcdTcyNDdcIiB9IH0pO1xuICAgICAgICAgICAgICBpbWcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IG5ldyBJbWFnZVByZXZpZXdNb2RhbCh0aGlzLmFwcCwgcmVzb2x2ZWQsIGJsb2NrLmFsdCB8fCBcIlx1NTZGRVx1NzI0N1wiKS5vcGVuKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHByZXZpZXcuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1pbWFnZS1wbGFjZWhvbGRlclwiLCB0ZXh0OiBibG9jay5zb3VyY2UgPyBcIlx1NjVFMFx1NkNENVx1NTJBMFx1OEY3RFx1NTZGRVx1NzI0N1wiIDogXCJcdTVDMUFcdTY3MkFcdTkwMDlcdTYyRTlcdTU2RkVcdTcyNDdcIiB9KTtcbiAgICAgICAgICAgIHNvdXJjZS52YWx1ZSA9IGJsb2NrLnNvdXJjZTtcbiAgICAgICAgICAgIGFsdC52YWx1ZSA9IGJsb2NrLmFsdCA/PyBcIlwiO1xuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3Qgc291cmNlTGFiZWwgPSBib2R5LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NzI0N1x1OERFRlx1NUY4NFx1NjIxNlx1N0Y1MVx1NTc0MFwiIH0pO1xuICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHNvdXJjZUxhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJcdTRFRDNcdTVFOTNcdThERUZcdTVGODRcdTMwMDFbW1x1NTZGRVx1NzI0N11dIFx1NjIxNiBodHRwczovLy4uLlwiIH0gfSk7XG4gICAgICAgICAgY29uc3QgYWx0TGFiZWwgPSBib2R5LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NTZGRVx1NzI0N1x1OEJGNFx1NjYwRVx1RkYwOFx1NTNFRlx1OTAwOVx1RkYwOVwiIH0pO1xuICAgICAgICAgIGNvbnN0IGFsdCA9IGFsdExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJcdTU2RkVcdTcyNDdcdThCRjRcdTY2MEVcIiB9IH0pO1xuICAgICAgICAgIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV4dCA9IHNvdXJjZS52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAobmV4dCAhPT0gYmxvY2suc291cmNlKSB7XG4gICAgICAgICAgICAgIGJsb2NrLnNvdXJjZSA9IG5leHQ7XG4gICAgICAgICAgICAgIGJsb2NrLmxvY2FsU291cmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICBibG9jay5yZW1vdGVTb3VyY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVmcmVzaCgpO1xuICAgICAgICAgICAgc2NoZWR1bGVBdXRvU2F2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGFsdC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4geyBibG9jay5hbHQgPSBhbHQudmFsdWUudHJpbSgpIHx8IHVuZGVmaW5lZDsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICAgICAgICBjb25zdCBhY3Rpb25zID0gYm9keS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWltYWdlLWJsb2NrLWFjdGlvbnNcIiB9KTtcbiAgICAgICAgICBjb25zdCBsb2NhbCA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NEZERFx1NUI1OFx1NTIzMFx1NEVEM1x1NUU5M1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgICAgICBsb2NhbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gY2hvb3NlSW1hZ2UoYmxvY2ssIFwibG9jYWxcIiwgcmVmcmVzaCkpO1xuICAgICAgICAgIGNvbnN0IHJlbW90ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1OTAwOVx1NjJFOVx1NjU4N1x1NEVGNlx1NUU3Nlx1NEUwQVx1NEYyMFwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICAgICAgICByZW1vdGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGNob29zZUltYWdlKGJsb2NrLCBcInJlbW90ZVwiLCByZWZyZXNoKSk7XG4gICAgICAgICAgaWYgKGJsb2NrLmxvY2FsU291cmNlIHx8IChibG9jay5zb3VyY2UgJiYgIS9eaHR0cHM/OlxcL1xcLy9pLnRlc3QoYmxvY2suc291cmNlKSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZEN1cnJlbnQgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTRFMEFcdTRGMjBcdTVGNTNcdTUyNERcdTU2RkVcdTcyNDdcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICAgICAgICB1cGxvYWRDdXJyZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB1cGxvYWRFeGlzdGluZ0ltYWdlKGJsb2NrLCByZWZyZXNoKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChibG9jay5yZW1vdGVTb3VyY2VzPy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IG1pcnJvcnMgPSBib2R5LmNyZWF0ZURpdih7IGNsczogXCJtbXMtaW1hZ2UtbWlycm9yc1wiIH0pO1xuICAgICAgICAgICAgbWlycm9ycy5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tcy1pbWFnZS1taXJyb3JzLWxhYmVsXCIsIHRleHQ6IFwiXHU4RkRDXHU3QTBCXHU5NTVDXHU1MENGXHVGRjFBXCIgfSk7XG4gICAgICAgICAgICBibG9jay5yZW1vdGVTb3VyY2VzLmZvckVhY2goKGl0ZW0sIG1pcnJvckluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBtaXJyb3JzLmNyZWF0ZUVsKFwiYVwiLCB7XG4gICAgICAgICAgICAgICAgdGV4dDogaXRlbS5ob3N0TmFtZSB8fCBgXHU1NkZFXHU1RThBICR7bWlycm9ySW5kZXggKyAxfWAsXG4gICAgICAgICAgICAgICAgaHJlZjogaXRlbS51cmwsXG4gICAgICAgICAgICAgICAgYXR0cjogeyB0YXJnZXQ6IFwiX2JsYW5rXCIsIHJlbDogXCJub29wZW5lclwiIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZnJlc2goKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoIXdvcmtpbmdCbG9ja3MubGVuZ3RoKSBibG9ja3NFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWVtcHR5LWNvbnRlbnQtaGludFwiLCB0ZXh0OiBcIlx1NUY1M1x1NTI0RFx1NkNBMVx1NjcwOVx1NTE4NVx1NUJCOVx1NTc1N1x1MzAwMlx1OEJGN1x1NkRGQlx1NTJBMFx1NjU4N1x1NUI1N1x1NjIxNlx1NTZGRVx1NzI0N1x1MzAwMlwiIH0pO1xuICAgIH07XG5cbiAgICBjb25zdCBhZGRUZXh0ID0gYWN0aW9uUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCIrIFx1NjU4N1x1NUI1N1wiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBhZGRUZXh0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHdvcmtpbmdCbG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcInRleHRcIiwgdGV4dDogXCJcIiB9KTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSk7XG4gICAgY29uc3QgYWRkSW1hZ2UgPSBhY3Rpb25Sb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIisgXHU1NkZFXHU3MjQ3XCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiB9IH0pO1xuICAgIGFkZEltYWdlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHdvcmtpbmdCbG9ja3MucHVzaCh7IGlkOiBuZXdJZCgpLCB0eXBlOiBcImltYWdlXCIsIHNvdXJjZTogXCJcIiB9KTsgcmVuZGVyQmxvY2tzKCk7IHNjaGVkdWxlQXV0b1NhdmUoKTsgfSk7XG4gICAgcmVuZGVyQmxvY2tzKCk7XG5cbiAgICBjb25zdCBkZXRhaWxzR3JpZCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1mb3JtLWdyaWRcIiB9KTtcbiAgICBjb25zdCBpY29uTGFiZWwgPSBkZXRhaWxzR3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTU2RkVcdTY4MDdcdTYyMTYgRW1vamlcIiB9KTtcbiAgICBjb25zdCBpY29uSW5wdXQgPSBpY29uTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIlx1NEY4Qlx1NTk4MiBcdUQ4M0RcdURDQTFcIiB9IH0pO1xuICAgIGljb25JbnB1dC52YWx1ZSA9IHRoaXMubm9kZS5pY29uID8/IFwiXCI7XG4gICAgY29uc3QgdGFza0xhYmVsID0gZGV0YWlsc0dyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU0RUZCXHU1MkExXHU3MkI2XHU2MDAxXCIgfSk7XG4gICAgY29uc3QgdGFza1NlbGVjdCA9IHRhc2tMYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJcIiwgXCJcdTY1RTBcIl0sIFtcInRvZG9cIiwgXCJcdTVGODVcdTUyOUVcIl0sIFtcImRvaW5nXCIsIFwiXHU4RkRCXHU4ODRDXHU0RTJEXCJdLCBbXCJkb25lXCIsIFwiXHU1REYyXHU1QjhDXHU2MjEwXCJdXSBhcyBjb25zdCkgdGFza1NlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgdGFza1NlbGVjdC52YWx1ZSA9IHRoaXMubm9kZS50YXNrID8/IFwiXCI7XG4gICAgY29uc3Qgc2hhcGVMYWJlbCA9IGRldGFpbHNHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1ODI4Mlx1NzBCOVx1NUY2Mlx1NzJCNlwiIH0pO1xuICAgIGNvbnN0IHNoYXBlU2VsZWN0ID0gc2hhcGVMYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJyb3VuZGVkXCIsIFwiXHU1NzA2XHU4OUQyXCJdLCBbXCJwaWxsXCIsIFwiXHU4MEY2XHU1NkNBXCJdLCBbXCJyZWN0YW5nbGVcIiwgXCJcdTc2RjRcdTg5RDJcIl1dIGFzIGNvbnN0KSBzaGFwZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsLCBhdHRyOiB7IHZhbHVlIH0gfSk7XG4gICAgc2hhcGVTZWxlY3QudmFsdWUgPSB0aGlzLm5vZGUuc3R5bGU/LnNoYXBlID8/IHRoaXMuZGVmYXVsdFNoYXBlO1xuICAgIGNvbnN0IHRhZ3NMYWJlbCA9IGRldGFpbHNHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1NjgwN1x1N0I3RVx1RkYwOFx1OTAxN1x1NTNGN1x1NTIwNlx1OTY5NFx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IHRhZ3NJbnB1dCA9IHRhZ3NMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIgfSk7XG4gICAgdGFnc0lucHV0LnZhbHVlID0gdGhpcy5ub2RlLnRhZ3M/LmpvaW4oXCIsIFwiKSA/PyBcIlwiO1xuXG4gICAgY29uc3Qgc3R5bGVHcmlkID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWZvcm0tZ3JpZCBtbWMtc3R5bGUtZ3JpZFwiIH0pO1xuICAgIGNvbnN0IGNvbG9yQ29udHJvbCA9IChsYWJlbFRleHQ6IHN0cmluZywgY3VycmVudDogc3RyaW5nIHwgdW5kZWZpbmVkLCBmYWxsYmFjazogc3RyaW5nKTogW0hUTUxJbnB1dEVsZW1lbnQsIEhUTUxJbnB1dEVsZW1lbnRdID0+IHtcbiAgICAgIGNvbnN0IGxhYmVsID0gc3R5bGVHcmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBsYWJlbFRleHQgfSk7XG4gICAgICBjb25zdCByb3cgPSBsYWJlbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWNvbG9yLXJvd1wiIH0pO1xuICAgICAgY29uc3QgdG9nZ2xlID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgICBjb25zdCBjb2xvciA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjb2xvclwiIH0pO1xuICAgICAgdG9nZ2xlLmNoZWNrZWQgPSBCb29sZWFuKGN1cnJlbnQpOyBjb2xvci52YWx1ZSA9IGN1cnJlbnQgPz8gZmFsbGJhY2s7IGNvbG9yLmRpc2FibGVkID0gIXRvZ2dsZS5jaGVja2VkO1xuICAgICAgdG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4geyBjb2xvci5kaXNhYmxlZCA9ICF0b2dnbGUuY2hlY2tlZDsgc2NoZWR1bGVBdXRvU2F2ZSgpOyB9KTtcbiAgICAgIGNvbG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgc2NoZWR1bGVBdXRvU2F2ZSk7XG4gICAgICByZXR1cm4gW3RvZ2dsZSwgY29sb3JdO1xuICAgIH07XG4gICAgY29uc3QgW2NvbG9yVG9nZ2xlLCBjb2xvcklucHV0XSA9IGNvbG9yQ29udHJvbChcIlx1ODI4Mlx1NzBCOVx1OTg5Q1x1ODI3MlwiLCB0aGlzLm5vZGUuc3R5bGU/LmNvbG9yLCBcIiM0ZjQ2ZTVcIik7XG4gICAgY29uc3QgW3RleHRDb2xvclRvZ2dsZSwgdGV4dENvbG9ySW5wdXRdID0gY29sb3JDb250cm9sKFwiXHU2NTc0XHU4MjgyXHU3MEI5XHU2NTg3XHU1QjU3XHU5ODlDXHU4MjcyXCIsIHRoaXMubm9kZS5zdHlsZT8udGV4dENvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgY29uc3QgW2JvcmRlckNvbG9yVG9nZ2xlLCBib3JkZXJDb2xvcklucHV0XSA9IGNvbG9yQ29udHJvbChcIlx1OEZCOVx1Njg0Nlx1OTg5Q1x1ODI3MlwiLCB0aGlzLm5vZGUuc3R5bGU/LmJvcmRlckNvbG9yLCBcIiM5NGEzYjhcIik7XG4gICAgY29uc3QgbnVtYmVyQ29udHJvbCA9IChsYWJlbFRleHQ6IHN0cmluZywgY3VycmVudDogbnVtYmVyIHwgdW5kZWZpbmVkLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIHN0ZXA6IG51bWJlcik6IEhUTUxJbnB1dEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBzdHlsZUdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsVGV4dCB9KTtcbiAgICAgIGNvbnN0IGlucHV0ID0gbGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIGF0dHI6IHsgbWluOiBTdHJpbmcobWluKSwgbWF4OiBTdHJpbmcobWF4KSwgc3RlcDogU3RyaW5nKHN0ZXApLCBwbGFjZWhvbGRlcjogXCJcdThEREZcdTk2OEZcdTlFRDhcdThCQTRcIiB9IH0pO1xuICAgICAgaW5wdXQudmFsdWUgPSBjdXJyZW50Py50b1N0cmluZygpID8/IFwiXCI7IHJldHVybiBpbnB1dDtcbiAgICB9O1xuICAgIGNvbnN0IGJvcmRlcldpZHRoSW5wdXQgPSBudW1iZXJDb250cm9sKFwiXHU4RkI5XHU2ODQ2XHU3Qzk3XHU3RUM2XCIsIHRoaXMubm9kZS5zdHlsZT8uYm9yZGVyV2lkdGgsIDAsIDYsIC41KTtcbiAgICBjb25zdCBmb250U2l6ZUlucHV0ID0gbnVtYmVyQ29udHJvbChcIlx1NUI1N1x1NTNGN1wiLCB0aGlzLm5vZGUuc3R5bGU/LmZvbnRTaXplLCAxMCwgMzIsIDEpO1xuICAgIGNvbnN0IGJvb2xlYW5Db250cm9sID0gKGxhYmVsVGV4dDogc3RyaW5nLCBjdXJyZW50OiBib29sZWFuIHwgdW5kZWZpbmVkKTogSFRNTFNlbGVjdEVsZW1lbnQgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSBzdHlsZUdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsVGV4dCB9KTtcbiAgICAgIGNvbnN0IHNlbGVjdCA9IGxhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgICAgc2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcdThEREZcdTk2OEZcdTlFRDhcdThCQTRcIiwgYXR0cjogeyB2YWx1ZTogXCJpbmhlcml0XCIgfSB9KTtcbiAgICAgIHNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHU1RjAwXHU1NDJGXCIsIGF0dHI6IHsgdmFsdWU6IFwidHJ1ZVwiIH0gfSk7XG4gICAgICBzZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBcIlx1NTE3M1x1OTVFRFwiLCBhdHRyOiB7IHZhbHVlOiBcImZhbHNlXCIgfSB9KTtcbiAgICAgIHNlbGVjdC52YWx1ZSA9IGN1cnJlbnQgPT09IHVuZGVmaW5lZCA/IFwiaW5oZXJpdFwiIDogY3VycmVudCA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiOyByZXR1cm4gc2VsZWN0O1xuICAgIH07XG4gICAgY29uc3QgYm9sZElucHV0ID0gYm9vbGVhbkNvbnRyb2woXCJcdTY1NzRcdTgyODJcdTcwQjlcdTUyQTBcdTdDOTdcIiwgdGhpcy5ub2RlLnN0eWxlPy5ib2xkKTtcbiAgICBjb25zdCBpdGFsaWNJbnB1dCA9IGJvb2xlYW5Db250cm9sKFwiXHU2NTc0XHU4MjgyXHU3MEI5XHU2NTlDXHU0RjUzXCIsIHRoaXMubm9kZS5zdHlsZT8uaXRhbGljKTtcbiAgICBjb25zdCB1bmRlcmxpbmVJbnB1dCA9IGJvb2xlYW5Db250cm9sKFwiXHU2NTc0XHU4MjgyXHU3MEI5XHU0RTBCXHU1MjEyXHU3RUJGXCIsIHRoaXMubm9kZS5zdHlsZT8udW5kZXJsaW5lKTtcblxuICAgIGNvbnN0IG5vdGVMYWJlbCA9IGZvcm0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1OTA3XHU2Q0U4XHVGRjA4XHU1M0VGXHU5MDA5XHVGRjA5XCIgfSk7XG4gICAgY29uc3Qgbm90ZUlucHV0ID0gbm90ZUxhYmVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIik7IG5vdGVJbnB1dC52YWx1ZSA9IHRoaXMubm9kZS5ub3RlID8/IFwiXCI7IG5vdGVJbnB1dC5yb3dzID0gNDtcbiAgICBjb25zdCBsaW5rTGFiZWwgPSBmb3JtLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OTRGRVx1NjNBNVx1RkYwOFx1N0Y1MVx1NTc0MFx1MzAwMVx1N0IxNFx1OEJCMFx1NTQwRFx1NjIxNiBbW1x1NTNDQ1x1OTRGRV1dXHVGRjA5XCIgfSk7XG4gICAgY29uc3QgbGlua0lucHV0ID0gbGlua0xhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiB9KTsgbGlua0lucHV0LnZhbHVlID0gdGhpcy5ub2RlLmxpbmsgPz8gXCJcIjtcblxuICAgIGNvbnN0IHBhcnNlQm9vbCA9ICh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB8IHVuZGVmaW5lZCA9PiB2YWx1ZSA9PT0gXCJ0cnVlXCIgPyB0cnVlIDogdmFsdWUgPT09IFwiZmFsc2VcIiA/IGZhbHNlIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHBhcnNlTnVtYmVyID0gKHZhbHVlOiBzdHJpbmcsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcik6IG51bWJlciB8IHVuZGVmaW5lZCA9PiB2YWx1ZS50cmltKCkgJiYgTnVtYmVyLmlzRmluaXRlKE51bWJlcih2YWx1ZSkpID8gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIE51bWJlcih2YWx1ZSkpKSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBjb2xsZWN0VmFsdWVzID0gKHNob3dOb3RpY2U6IGJvb2xlYW4pOiBOb2RlRWRpdFZhbHVlcyB8IG51bGwgPT4ge1xuICAgICAgY29uc3QgY29udGVudCA9IHZhbGlkQmxvY2tzKCk7XG4gICAgICBpZiAoIWNvbnRlbnQubGVuZ3RoKSB7IGlmIChzaG93Tm90aWNlKSBuZXcgTm90aWNlKFwiXHU4MjgyXHU3MEI5XHU4MUYzXHU1QzExXHU5NzAwXHU4OTgxXHU0RTAwXHU0RTJBXHU2NTg3XHU1QjU3XHU1NzU3XHU2MjE2XHU1NkZFXHU3MjQ3XHU1NzU3XCIpOyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgdGFzayA9IHRhc2tTZWxlY3QudmFsdWU7XG4gICAgICBjb25zdCBzaGFwZSA9IHNoYXBlU2VsZWN0LnZhbHVlO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudCxcbiAgICAgICAgbm90ZTogbm90ZUlucHV0LnZhbHVlLnRyaW0oKSwgbGluazogbGlua0lucHV0LnZhbHVlLnRyaW0oKSwgaWNvbjogaWNvbklucHV0LnZhbHVlLnRyaW0oKS5zbGljZSgwLCAxMiksXG4gICAgICAgIHRhZ3M6IEFycmF5LmZyb20obmV3IFNldCh0YWdzSW5wdXQudmFsdWUuc3BsaXQoL1ssXHVGRjBDXS8pLm1hcCgodGFnKSA9PiB0YWcudHJpbSgpLnJlcGxhY2UoL14jLywgXCJcIikpLmZpbHRlcihCb29sZWFuKSkpLnNsaWNlKDAsIDEyKSxcbiAgICAgICAgdGFzazogdGFzayA9PT0gXCJ0b2RvXCIgfHwgdGFzayA9PT0gXCJkb2luZ1wiIHx8IHRhc2sgPT09IFwiZG9uZVwiID8gdGFzayA6IHVuZGVmaW5lZCxcbiAgICAgICAgY29sb3I6IGNvbG9yVG9nZ2xlLmNoZWNrZWQgPyBjb2xvcklucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICB0ZXh0Q29sb3I6IHRleHRDb2xvclRvZ2dsZS5jaGVja2VkID8gdGV4dENvbG9ySW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGJvcmRlckNvbG9yOiBib3JkZXJDb2xvclRvZ2dsZS5jaGVja2VkID8gYm9yZGVyQ29sb3JJbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgYm9yZGVyV2lkdGg6IHBhcnNlTnVtYmVyKGJvcmRlcldpZHRoSW5wdXQudmFsdWUsIDAsIDYpLFxuICAgICAgICBzaGFwZTogc2hhcGUgPT09IFwicGlsbFwiIHx8IHNoYXBlID09PSBcInJlY3RhbmdsZVwiIHx8IHNoYXBlID09PSBcInJvdW5kZWRcIiA/IHNoYXBlIDogdW5kZWZpbmVkLFxuICAgICAgICBib2xkOiBwYXJzZUJvb2woYm9sZElucHV0LnZhbHVlKSwgaXRhbGljOiBwYXJzZUJvb2woaXRhbGljSW5wdXQudmFsdWUpLCB1bmRlcmxpbmU6IHBhcnNlQm9vbCh1bmRlcmxpbmVJbnB1dC52YWx1ZSksXG4gICAgICAgIGZvbnRTaXplOiBwYXJzZU51bWJlcihmb250U2l6ZUlucHV0LnZhbHVlLCAxMCwgMzIpXG4gICAgICB9O1xuICAgIH07XG5cbiAgICBsZXQgdGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgIGxldCBsYXN0ID0gSlNPTi5zdHJpbmdpZnkoY29sbGVjdFZhbHVlcyhmYWxzZSkpO1xuICAgIGNvbnN0IHNhdmVOb3cgPSAobW9kZTogXCJhdXRvc2F2ZVwiIHwgXCJjb21taXRcIiwgc2hvd05vdGljZSA9IGZhbHNlKTogYm9vbGVhbiA9PiB7XG4gICAgICBpZiAodGltZXIgIT09IG51bGwpIHsgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcik7IHRpbWVyID0gbnVsbDsgfVxuICAgICAgY29uc3QgdmFsdWVzID0gY29sbGVjdFZhbHVlcyhzaG93Tm90aWNlKTsgaWYgKCF2YWx1ZXMpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IHNpZ25hdHVyZSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlcyk7XG4gICAgICBpZiAoc2lnbmF0dXJlICE9PSBsYXN0KSB7IHRoaXMuc3VibWl0KHZhbHVlcywgbW9kZSk7IGxhc3QgPSBzaWduYXR1cmU7IH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgc2NoZWR1bGVBdXRvU2F2ZSA9ICgpOiB2b2lkID0+IHsgaWYgKHRpbWVyICE9PSBudWxsKSB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTsgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBzYXZlTm93KFwiYXV0b3NhdmVcIiksIDI4MCk7IH07XG4gICAgdGhpcy5zYXZlT25DbG9zZSA9ICgpID0+IHsgc2F2ZU5vdyhcImNvbW1pdFwiKTsgfTtcblxuICAgIFtpY29uSW5wdXQsIHRhc2tTZWxlY3QsIHNoYXBlU2VsZWN0LCB0YWdzSW5wdXQsIGJvcmRlcldpZHRoSW5wdXQsIGZvbnRTaXplSW5wdXQsIGJvbGRJbnB1dCwgaXRhbGljSW5wdXQsIHVuZGVybGluZUlucHV0LCBub3RlSW5wdXQsIGxpbmtJbnB1dF1cbiAgICAgIC5mb3JFYWNoKChpbnB1dCkgPT4geyBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgc2NoZWR1bGVBdXRvU2F2ZSk7IGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgc2NoZWR1bGVBdXRvU2F2ZSk7IH0pO1xuXG4gICAgY29uc3QgYnV0dG9ucyA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1mb3JtLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjbG9zZUJ1dHRvbiA9IGJ1dHRvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW9kLWN0YVwiLCB0ZXh0OiBcIlx1NEZERFx1NUI1OFx1NUU3Nlx1NTE3M1x1OTVFRFwiLCBhdHRyOiB7IHR5cGU6IFwiYnV0dG9uXCIgfSB9KTtcbiAgICBjbG9zZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4geyBpZiAoc2F2ZU5vdyhcImNvbW1pdFwiLCB0cnVlKSkgeyB0aGlzLmNsb3NlV2l0aG91dEZsdXNoID0gdHJ1ZTsgdGhpcy5jbG9zZSgpOyB9IH0pO1xuXG4gICAgdGhpcy5vdXRzaWRlUG9pbnRlckhhbmRsZXIgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCk6IHZvaWQgPT4ge1xuICAgICAgaWYgKHRoaXMubW9kYWxFbC5jb250YWlucyhldmVudC50YXJnZXQgYXMgTm9kZSkpIHJldHVybjtcbiAgICAgIHRoaXMuc2F2ZU9uQ2xvc2U/LigpOyB0aGlzLmNsb3NlV2l0aG91dEZsdXNoID0gdHJ1ZTsgdGhpcy5jbG9zZSgpO1xuICAgIH07XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHRoaXMub3V0c2lkZVBvaW50ZXJIYW5kbGVyISwgdHJ1ZSksIDApO1xuICB9XG5cbiAgb25DbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY2xvc2VXaXRob3V0Rmx1c2gpIHRoaXMuc2F2ZU9uQ2xvc2U/LigpO1xuICAgIGlmICh0aGlzLm91dHNpZGVQb2ludGVySGFuZGxlcikgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHRoaXMub3V0c2lkZVBvaW50ZXJIYW5kbGVyLCB0cnVlKTtcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG59XG5cbmNsYXNzIEFwcGVhcmFuY2VNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6IChhcHBlYXJhbmNlOiBNaW5kTWFwQXBwZWFyYW5jZSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSByZWFkb25seSByZXNldDogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgYXBwZWFyYW5jZTogTWluZE1hcEFwcGVhcmFuY2UsIHN1Ym1pdDogKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKSA9PiB2b2lkLCByZXNldDogKCkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5hcHBlYXJhbmNlID0gYXBwZWFyYW5jZTtcbiAgICB0aGlzLnN1Ym1pdCA9IHN1Ym1pdDtcbiAgICB0aGlzLnJlc2V0ID0gcmVzZXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTVGNTNcdTUyNERcdTgxMTFcdTU2RkVcdTU5MTZcdTg5QzJcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtYXBwZWFyYW5jZS1tb2RhbFwiKTtcbiAgICBjb25zdCBmb3JtID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJmb3JtXCIpO1xuICAgIGZvcm0uY3JlYXRlRWwoXCJwXCIsIHsgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLCB0ZXh0OiBcIlx1NTE0OFx1OTAwOVx1NjJFOVx1NEUwMFx1NTk1N1x1NEUzQlx1OTg5OFx1RkYwQ1x1NTE4RFx1NjMwOVx1OTcwMFx1ODk4MVx1NEZFRVx1NjUzOVx1ODBDQ1x1NjY2Rlx1MzAwMVx1ODI4Mlx1NzBCOVx1MzAwMVx1NUI1N1x1NEY1M1x1NTQ4Q1x1OEZERVx1N0VCRlx1MzAwMlx1OEJCRVx1N0Y2RVx1NTNFQVx1NEZERFx1NUI1OFx1NTIzMFx1NUY1M1x1NTI0RCAubWluZG1hcCBcdTY1ODdcdTRFRjZcdTMwMDJcIiB9KTtcblxuICAgIGxldCBzZWxlY3RlZFByZXNldDogTWluZE1hcFRoZW1lUHJlc2V0SWQgPSB0aGlzLmFwcGVhcmFuY2UudGhlbWVQcmVzZXQgPz8gXCJjbGFzc2ljLWluZGlnb1wiO1xuICAgIGNvbnN0IHRoZW1lU2VjdGlvbiA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10aGVtZS1waWNrZXJcIiB9KTtcbiAgICB0aGVtZVNlY3Rpb24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10aGVtZS1waWNrZXItdGl0bGVcIiwgdGV4dDogXCJcdTRFM0JcdTk4OThcdTZBMjFcdTY3N0ZcIiB9KTtcbiAgICBjb25zdCB0aGVtZUdyaWQgPSB0aGVtZVNlY3Rpb24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10aGVtZS1jYXJkLWdyaWRcIiB9KTtcbiAgICBjb25zdCB0aGVtZUNhcmRzID0gbmV3IE1hcDxNaW5kTWFwVGhlbWVQcmVzZXRJZCwgSFRNTEJ1dHRvbkVsZW1lbnQ+KCk7XG5cbiAgICBjb25zdCBncmlkID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWZvcm0tZ3JpZCBtbWMtYXBwZWFyYW5jZS1ncmlkXCIgfSk7XG4gICAgY29uc3QgYWRkQ29sb3IgPSAobGFiZWxUZXh0OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQsIGZhbGxiYWNrOiBzdHJpbmcpOiB7IHRvZ2dsZTogSFRNTElucHV0RWxlbWVudDsgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfSA9PiB7XG4gICAgICBjb25zdCBsYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsVGV4dCB9KTtcbiAgICAgIGNvbnN0IHJvdyA9IGxhYmVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29sb3Itcm93XCIgfSk7XG4gICAgICBjb25zdCB0b2dnbGUgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcbiAgICAgIGNvbnN0IGlucHV0ID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNvbG9yXCIgfSk7XG4gICAgICB0b2dnbGUuY2hlY2tlZCA9IEJvb2xlYW4odmFsdWUpO1xuICAgICAgaW5wdXQudmFsdWUgPSB2YWx1ZSA/PyBmYWxsYmFjaztcbiAgICAgIGlucHV0LmRpc2FibGVkID0gIXRvZ2dsZS5jaGVja2VkO1xuICAgICAgdG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4geyBpbnB1dC5kaXNhYmxlZCA9ICF0b2dnbGUuY2hlY2tlZDsgfSk7XG4gICAgICByZXR1cm4geyB0b2dnbGUsIGlucHV0IH07XG4gICAgfTtcblxuICAgIGNvbnN0IGJhY2tncm91bmQgPSBhZGRDb2xvcihcIlx1ODBDQ1x1NjY2Rlx1OTg5Q1x1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2UuYmFja2dyb3VuZENvbG9yLCBcIiNmOGZhZmNcIik7XG4gICAgY29uc3QgcGF0dGVybkxhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTgwQ0NcdTY2NkZcdTU2RkVcdTY4NDhcIiB9KTtcbiAgICBjb25zdCBwYXR0ZXJuU2VsZWN0ID0gcGF0dGVybkxhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3QgW3ZhbHVlLCBsYWJlbF0gb2YgW1tcIm5vbmVcIiwgXCJcdTY1RTBcIl0sIFtcImdyaWRcIiwgXCJcdTdGNTFcdTY4M0NcIl0sIFtcImRvdHNcIiwgXCJcdTcwQjlcdTk2MzVcIl1dIGFzIGNvbnN0KSBwYXR0ZXJuU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwsIGF0dHI6IHsgdmFsdWUgfSB9KTtcbiAgICBwYXR0ZXJuU2VsZWN0LnZhbHVlID0gdGhpcy5hcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID8/IFwiZ3JpZFwiO1xuICAgIGNvbnN0IHBhdHRlcm5Db2xvciA9IGFkZENvbG9yKFwiXHU1NkZFXHU2ODQ4XHU5ODlDXHU4MjcyXCIsIHRoaXMuYXBwZWFyYW5jZS5wYXR0ZXJuQ29sb3IsIFwiIzk0YTNiOFwiKTtcblxuICAgIGNvbnN0IGZvbnRMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU1QjU3XHU0RjUzXCIgfSk7XG4gICAgY29uc3QgZm9udFNlbGVjdCA9IGZvbnRMYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtbXCJvYnNpZGlhblwiLCBcIlx1OERERlx1OTY4RiBPYnNpZGlhblwiXSwgW1wic2Fuc1wiLCBcIlx1NjVFMFx1ODg2Q1x1N0VCRlwiXSwgW1wic2VyaWZcIiwgXCJcdTg4NkNcdTdFQkZcIl0sIFtcIm1vbm9cIiwgXCJcdTdCNDlcdTVCQkRcIl0sIFtcImN1c3RvbVwiLCBcIlx1ODFFQVx1NUI5QVx1NEU0OVwiXV0gYXMgY29uc3QpIGZvbnRTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB2YWx1ZSB9IH0pO1xuICAgIGZvbnRTZWxlY3QudmFsdWUgPSB0aGlzLmFwcGVhcmFuY2UuZm9udEZhbWlseSA/PyBcIm9ic2lkaWFuXCI7XG4gICAgY29uc3QgY3VzdG9tRm9udExhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTgxRUFcdTVCOUFcdTRFNDlcdTVCNTdcdTRGNTNcdTU0MERcdTc5RjBcIiB9KTtcbiAgICBjb25zdCBjdXN0b21Gb250SW5wdXQgPSBjdXN0b21Gb250TGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIk1pY3Jvc29mdCBZYUhlaVwiIH0gfSk7XG4gICAgY3VzdG9tRm9udElucHV0LnZhbHVlID0gdGhpcy5hcHBlYXJhbmNlLmN1c3RvbUZvbnQgPz8gXCJcIjtcbiAgICBjb25zdCB1cGRhdGVDdXN0b21Gb250ID0gKCk6IHZvaWQgPT4geyBjdXN0b21Gb250SW5wdXQuZGlzYWJsZWQgPSBmb250U2VsZWN0LnZhbHVlICE9PSBcImN1c3RvbVwiOyB9O1xuICAgIGZvbnRTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVDdXN0b21Gb250KTtcbiAgICB1cGRhdGVDdXN0b21Gb250KCk7XG5cbiAgICBjb25zdCBmb250U2l6ZUxhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTVCNTdcdTUzRjdcdUZGMDgxMFx1MjAxMzMwXHVGRjA5XCIgfSk7XG4gICAgY29uc3QgZm9udFNpemVJbnB1dCA9IGZvbnRTaXplTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIGF0dHI6IHsgbWluOiBcIjEwXCIsIG1heDogXCIzMFwiLCBzdGVwOiBcIjFcIiB9IH0pO1xuICAgIGZvbnRTaXplSW5wdXQudmFsdWUgPSBTdHJpbmcodGhpcy5hcHBlYXJhbmNlLmZvbnRTaXplID8/IDE0KTtcblxuICAgIGNvbnN0IHJvb3RDb2xvciA9IGFkZENvbG9yKFwiXHU0RTJEXHU1RkMzXHU0RTNCXHU5ODk4XHU5ODlDXHU4MjcyXCIsIHRoaXMuYXBwZWFyYW5jZS5yb290Q29sb3IsIFwiIzRmNDZlNVwiKTtcbiAgICBjb25zdCByb290VGV4dENvbG9yID0gYWRkQ29sb3IoXCJcdTRFMkRcdTVGQzNcdTRFM0JcdTk4OThcdTY1ODdcdTVCNTdcIiwgdGhpcy5hcHBlYXJhbmNlLnJvb3RUZXh0Q29sb3IsIFwiI2ZmZmZmZlwiKTtcbiAgICBjb25zdCBub2RlQ29sb3IgPSBhZGRDb2xvcihcIlx1ODI4Mlx1NzBCOVx1ODBDQ1x1NjY2Rlx1ODI3MlwiLCB0aGlzLmFwcGVhcmFuY2Uubm9kZUNvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgY29uc3QgdGV4dENvbG9yID0gYWRkQ29sb3IoXCJcdTY1ODdcdTVCNTdcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLnRleHRDb2xvciwgXCIjMGYxNzJhXCIpO1xuICAgIGNvbnN0IGJvcmRlckNvbG9yID0gYWRkQ29sb3IoXCJcdTgyODJcdTcwQjlcdThGQjlcdTY4NDZcdTk4OUNcdTgyNzJcIiwgdGhpcy5hcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvciwgXCIjOTRhM2I4XCIpO1xuICAgIGNvbnN0IGJvcmRlcldpZHRoTGFiZWwgPSBncmlkLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlx1OEZCOVx1Njg0Nlx1N0M5N1x1N0VDNlx1RkYwODBcdTIwMTM2XHVGRjA5XCIgfSk7XG4gICAgY29uc3QgYm9yZGVyV2lkdGhJbnB1dCA9IGJvcmRlcldpZHRoTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIGF0dHI6IHsgbWluOiBcIjBcIiwgbWF4OiBcIjZcIiwgc3RlcDogXCIwLjVcIiB9IH0pO1xuICAgIGJvcmRlcldpZHRoSW5wdXQudmFsdWUgPSBTdHJpbmcodGhpcy5hcHBlYXJhbmNlLm5vZGVCb3JkZXJXaWR0aCA/PyAxKTtcblxuICAgIGNvbnN0IGVkZ2VDb2xvciA9IGFkZENvbG9yKFwiXHU4RkRFXHU3RUJGXHU5ODlDXHU4MjcyXCIsIHRoaXMuYXBwZWFyYW5jZS5lZGdlQ29sb3IsIFwiIzdjOGFhNVwiKTtcbiAgICBjb25zdCBlZGdlU3R5bGVMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4RkRFXHU3RUJGXHU3QzdCXHU1NzhCXCIgfSk7XG4gICAgY29uc3QgZWRnZVN0eWxlU2VsZWN0ID0gZWRnZVN0eWxlTGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZm9yIChjb25zdCBbdmFsdWUsIGxhYmVsXSBvZiBbW1wiY3VydmVkXCIsIFwiXHU2NkYyXHU3RUJGXCJdLCBbXCJzdHJhaWdodFwiLCBcIlx1NzZGNFx1N0VCRlwiXSwgW1wiZWxib3dcIiwgXCJcdTYyOThcdTdFQkZcIl1dIGFzIGNvbnN0KSBlZGdlU3R5bGVTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB2YWx1ZSB9IH0pO1xuICAgIGVkZ2VTdHlsZVNlbGVjdC52YWx1ZSA9IHRoaXMuYXBwZWFyYW5jZS5lZGdlU3R5bGUgPz8gXCJjdXJ2ZWRcIjtcblxuICAgIGNvbnN0IGVkZ2VXaWR0aE1vZGVMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4RkRFXHU3RUJGXHU3Qzk3XHU3RUM2XHU2QTIxXHU1RjBGXCIgfSk7XG4gICAgY29uc3QgZWRnZVdpZHRoTW9kZVNlbGVjdCA9IGVkZ2VXaWR0aE1vZGVMYWJlbC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBlZGdlV2lkdGhNb2RlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcdTdFREZcdTRFMDBcdTdDOTdcdTdFQzZcIiwgYXR0cjogeyB2YWx1ZTogXCJ1bmlmb3JtXCIgfSB9KTtcbiAgICBlZGdlV2lkdGhNb2RlU2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcdTRFQ0VcdTdDOTdcdTUyMzBcdTdFQzZcIiwgYXR0cjogeyB2YWx1ZTogXCJ0YXBlcmVkXCIgfSB9KTtcbiAgICBlZGdlV2lkdGhNb2RlU2VsZWN0LnZhbHVlID0gdGhpcy5hcHBlYXJhbmNlLmVkZ2VXaWR0aE1vZGUgPz8gXCJ0YXBlcmVkXCI7XG5cbiAgICBjb25zdCBlZGdlV2lkdGhMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU4RDc3XHU1OUNCXHU3Qzk3XHU3RUM2XHVGRjA4MC41XHUyMDEzOFx1RkYwOVwiIH0pO1xuICAgIGNvbnN0IGVkZ2VXaWR0aElucHV0ID0gZWRnZVdpZHRoTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIGF0dHI6IHsgbWluOiBcIjAuNVwiLCBtYXg6IFwiOFwiLCBzdGVwOiBcIjAuMjVcIiB9IH0pO1xuICAgIGVkZ2VXaWR0aElucHV0LnZhbHVlID0gU3RyaW5nKHRoaXMuYXBwZWFyYW5jZS5lZGdlV2lkdGggPz8gNC4yKTtcbiAgICBjb25zdCBlZGdlTWluV2lkdGhMYWJlbCA9IGdyaWQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU2NzJCXHU3QUVGXHU2NzAwXHU3RUM2XHVGRjA4MC4yNVx1MjAxMzRcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBlZGdlTWluV2lkdGhJbnB1dCA9IGVkZ2VNaW5XaWR0aExhYmVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIwLjI1XCIsIG1heDogXCI0XCIsIHN0ZXA6IFwiMC4yNVwiIH0gfSk7XG4gICAgZWRnZU1pbldpZHRoSW5wdXQudmFsdWUgPSBTdHJpbmcodGhpcy5hcHBlYXJhbmNlLmVkZ2VNaW5XaWR0aCA/PyAxLjIpO1xuICAgIGNvbnN0IHVwZGF0ZUVkZ2VNaW4gPSAoKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB0YXBlcmVkID0gZWRnZVdpZHRoTW9kZVNlbGVjdC52YWx1ZSA9PT0gXCJ0YXBlcmVkXCI7XG4gICAgICBlZGdlTWluV2lkdGhJbnB1dC5kaXNhYmxlZCA9ICF0YXBlcmVkO1xuICAgICAgZWRnZU1pbldpZHRoTGFiZWwudG9nZ2xlQ2xhc3MoXCJpcy1kaXNhYmxlZFwiLCAhdGFwZXJlZCk7XG4gICAgICBlZGdlV2lkdGhMYWJlbC5jaGlsZE5vZGVzWzBdIS50ZXh0Q29udGVudCA9IHRhcGVyZWQgPyBcIlx1OEQ3N1x1NTlDQlx1N0M5N1x1N0VDNlx1RkYwODAuNVx1MjAxMzhcdUZGMDlcIiA6IFwiXHU4RkRFXHU3RUJGXHU3Qzk3XHU3RUM2XHVGRjA4MC41XHUyMDEzOFx1RkYwOVwiO1xuICAgIH07XG4gICAgZWRnZVdpZHRoTW9kZVNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUVkZ2VNaW4pO1xuICAgIHVwZGF0ZUVkZ2VNaW4oKTtcblxuICAgIGNvbnN0IGJyYW5jaExhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTVGNjlcdTgyNzJcdTUyMDZcdTY1MkZcIiB9KTtcbiAgICBjb25zdCBicmFuY2hUb2dnbGVSb3cgPSBicmFuY2hMYWJlbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXRvZ2dsZS1yb3dcIiB9KTtcbiAgICBjb25zdCBjb2xvcmZ1bEJyYW5jaGVzID0gYnJhbmNoVG9nZ2xlUm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgY29sb3JmdWxCcmFuY2hlcy5jaGVja2VkID0gdGhpcy5hcHBlYXJhbmNlLmNvbG9yZnVsQnJhbmNoZXMgPT09IHRydWU7XG4gICAgYnJhbmNoVG9nZ2xlUm93LmNyZWF0ZVNwYW4oeyB0ZXh0OiBcIlx1NjMwOVx1NEUwMFx1N0VBN1x1NTIwNlx1NjUyRlx1NUZBQVx1NzNBRlx1OTE0RFx1ODI3MlwiIH0pO1xuICAgIGNvbnN0IGJyYW5jaENvbG9yc0xhYmVsID0gZ3JpZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJcdTUyMDZcdTY1MkZcdTk4OUNcdTgyNzJcdUZGMDhcdTkwMTdcdTUzRjdcdTUyMDZcdTk2OTRcdUZGMDlcIiB9KTtcbiAgICBjb25zdCBicmFuY2hDb2xvcnNJbnB1dCA9IGJyYW5jaENvbG9yc0xhYmVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBhdHRyOiB7IHJvd3M6IFwiMlwiLCBwbGFjZWhvbGRlcjogXCIjNGY0NmU1LCAjMDI4NGM3LCAjMGY3NjZlXCIgfSB9KTtcbiAgICBicmFuY2hDb2xvcnNJbnB1dC52YWx1ZSA9ICh0aGlzLmFwcGVhcmFuY2UuYnJhbmNoQ29sb3JzID8/IFtdKS5qb2luKFwiLCBcIik7XG5cbiAgICBjb25zdCB0ZXh0U3R5bGVTZWN0aW9uID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLWFwcGVhcmFuY2UtdGV4dC1zdHlsZVwiIH0pO1xuICAgIHRleHRTdHlsZVNlY3Rpb24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1hcHBlYXJhbmNlLXRleHQtc3R5bGUtdGl0bGVcIiwgdGV4dDogXCJcdTY1ODdcdTVCNTdcdTY4MzdcdTVGMEZcIiB9KTtcbiAgICBjb25zdCB0ZXh0U3R5bGUgPSB0ZXh0U3R5bGVTZWN0aW9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtYXBwZWFyYW5jZS1zdHlsZS1vcHRpb25zXCIgfSk7XG4gICAgY29uc3QgYWRkQ2hlY2sgPSAodGV4dDogc3RyaW5nLCBjaGVja2VkOiBib29sZWFuKTogSFRNTElucHV0RWxlbWVudCA9PiB7XG4gICAgICBjb25zdCBsYWJlbCA9IHRleHRTdHlsZS5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcIm1tYy1hcHBlYXJhbmNlLXN0eWxlLW9wdGlvblwiIH0pO1xuICAgICAgY29uc3QgaW5wdXQgPSBsYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiIH0pO1xuICAgICAgaW5wdXQuY2hlY2tlZCA9IGNoZWNrZWQ7XG4gICAgICBsYWJlbC5jcmVhdGVTcGFuKHsgdGV4dCB9KTtcbiAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xuICAgIGNvbnN0IGJvbGQgPSBhZGRDaGVjayhcIlx1NjU4N1x1NUI1N1x1NTJBMFx1N0M5N1wiLCB0aGlzLmFwcGVhcmFuY2UuYm9sZCA9PT0gdHJ1ZSk7XG4gICAgY29uc3QgaXRhbGljID0gYWRkQ2hlY2soXCJcdTY1ODdcdTVCNTdcdTY1OUNcdTRGNTNcIiwgdGhpcy5hcHBlYXJhbmNlLml0YWxpYyA9PT0gdHJ1ZSk7XG4gICAgY29uc3QgdW5kZXJsaW5lID0gYWRkQ2hlY2soXCJcdTY1ODdcdTVCNTdcdTRFMEJcdTUyMTJcdTdFQkZcIiwgdGhpcy5hcHBlYXJhbmNlLnVuZGVybGluZSA9PT0gdHJ1ZSk7XG5cbiAgICBjb25zdCBzZXRDb2xvciA9IChjb250cm9sOiB7IHRvZ2dsZTogSFRNTElucHV0RWxlbWVudDsgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfSwgdmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZmFsbGJhY2s6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgY29udHJvbC50b2dnbGUuY2hlY2tlZCA9IEJvb2xlYW4odmFsdWUpO1xuICAgICAgY29udHJvbC5pbnB1dC52YWx1ZSA9IHZhbHVlID8/IGZhbGxiYWNrO1xuICAgICAgY29udHJvbC5pbnB1dC5kaXNhYmxlZCA9ICFjb250cm9sLnRvZ2dsZS5jaGVja2VkO1xuICAgIH07XG4gICAgY29uc3QgdXBkYXRlU2VsZWN0ZWRDYXJkcyA9ICgpOiB2b2lkID0+IHtcbiAgICAgIGZvciAoY29uc3QgW2lkLCBjYXJkXSBvZiB0aGVtZUNhcmRzKSBjYXJkLnRvZ2dsZUNsYXNzKFwiaXMtc2VsZWN0ZWRcIiwgaWQgPT09IHNlbGVjdGVkUHJlc2V0KTtcbiAgICB9O1xuICAgIGNvbnN0IGFwcGx5UHJlc2V0ID0gKHByZXNldElkOiBNaW5kTWFwVGhlbWVQcmVzZXRJZCk6IHZvaWQgPT4ge1xuICAgICAgc2VsZWN0ZWRQcmVzZXQgPSBwcmVzZXRJZDtcbiAgICAgIGNvbnN0IGFwcGVhcmFuY2UgPSBhcHBlYXJhbmNlRnJvbVRoZW1lUHJlc2V0KHByZXNldElkKTtcbiAgICAgIHNldENvbG9yKGJhY2tncm91bmQsIGFwcGVhcmFuY2UuYmFja2dyb3VuZENvbG9yLCBcIiNmOGZhZmNcIik7XG4gICAgICBwYXR0ZXJuU2VsZWN0LnZhbHVlID0gYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA/PyBcIm5vbmVcIjtcbiAgICAgIHNldENvbG9yKHBhdHRlcm5Db2xvciwgYXBwZWFyYW5jZS5wYXR0ZXJuQ29sb3IsIFwiIzk0YTNiOFwiKTtcbiAgICAgIGZvbnRTZWxlY3QudmFsdWUgPSBhcHBlYXJhbmNlLmZvbnRGYW1pbHkgPz8gXCJvYnNpZGlhblwiO1xuICAgICAgY3VzdG9tRm9udElucHV0LnZhbHVlID0gYXBwZWFyYW5jZS5jdXN0b21Gb250ID8/IFwiXCI7XG4gICAgICBmb250U2l6ZUlucHV0LnZhbHVlID0gU3RyaW5nKGFwcGVhcmFuY2UuZm9udFNpemUgPz8gMTQpO1xuICAgICAgc2V0Q29sb3Iocm9vdENvbG9yLCBhcHBlYXJhbmNlLnJvb3RDb2xvciwgXCIjNGY0NmU1XCIpO1xuICAgICAgc2V0Q29sb3Iocm9vdFRleHRDb2xvciwgYXBwZWFyYW5jZS5yb290VGV4dENvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgICBzZXRDb2xvcihub2RlQ29sb3IsIGFwcGVhcmFuY2Uubm9kZUNvbG9yLCBcIiNmZmZmZmZcIik7XG4gICAgICBzZXRDb2xvcih0ZXh0Q29sb3IsIGFwcGVhcmFuY2UudGV4dENvbG9yLCBcIiMwZjE3MmFcIik7XG4gICAgICBzZXRDb2xvcihib3JkZXJDb2xvciwgYXBwZWFyYW5jZS5ub2RlQm9yZGVyQ29sb3IsIFwiIzk0YTNiOFwiKTtcbiAgICAgIGJvcmRlcldpZHRoSW5wdXQudmFsdWUgPSBTdHJpbmcoYXBwZWFyYW5jZS5ub2RlQm9yZGVyV2lkdGggPz8gMSk7XG4gICAgICBzZXRDb2xvcihlZGdlQ29sb3IsIGFwcGVhcmFuY2UuZWRnZUNvbG9yLCBcIiM3YzhhYTVcIik7XG4gICAgICBlZGdlU3R5bGVTZWxlY3QudmFsdWUgPSBhcHBlYXJhbmNlLmVkZ2VTdHlsZSA/PyBcImN1cnZlZFwiO1xuICAgICAgZWRnZVdpZHRoTW9kZVNlbGVjdC52YWx1ZSA9IGFwcGVhcmFuY2UuZWRnZVdpZHRoTW9kZSA/PyBcInVuaWZvcm1cIjtcbiAgICAgIGVkZ2VXaWR0aElucHV0LnZhbHVlID0gU3RyaW5nKGFwcGVhcmFuY2UuZWRnZVdpZHRoID8/IDIuMik7XG4gICAgICBlZGdlTWluV2lkdGhJbnB1dC52YWx1ZSA9IFN0cmluZyhhcHBlYXJhbmNlLmVkZ2VNaW5XaWR0aCA/PyAxKTtcbiAgICAgIGNvbG9yZnVsQnJhbmNoZXMuY2hlY2tlZCA9IGFwcGVhcmFuY2UuY29sb3JmdWxCcmFuY2hlcyA9PT0gdHJ1ZTtcbiAgICAgIGJyYW5jaENvbG9yc0lucHV0LnZhbHVlID0gKGFwcGVhcmFuY2UuYnJhbmNoQ29sb3JzID8/IFtdKS5qb2luKFwiLCBcIik7XG4gICAgICBib2xkLmNoZWNrZWQgPSBhcHBlYXJhbmNlLmJvbGQgPT09IHRydWU7XG4gICAgICBpdGFsaWMuY2hlY2tlZCA9IGFwcGVhcmFuY2UuaXRhbGljID09PSB0cnVlO1xuICAgICAgdW5kZXJsaW5lLmNoZWNrZWQgPSBhcHBlYXJhbmNlLnVuZGVybGluZSA9PT0gdHJ1ZTtcbiAgICAgIHVwZGF0ZUN1c3RvbUZvbnQoKTtcbiAgICAgIHVwZGF0ZUVkZ2VNaW4oKTtcbiAgICAgIHVwZGF0ZVNlbGVjdGVkQ2FyZHMoKTtcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCBwcmVzZXQgb2YgTUlORE1BUF9USEVNRV9QUkVTRVRTKSB7XG4gICAgICBjb25zdCBjYXJkID0gdGhlbWVHcmlkLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1tYy10aGVtZS1jYXJkXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiwgdGl0bGU6IHByZXNldC5kZXNjcmlwdGlvbiB9IH0pO1xuICAgICAgdGhlbWVDYXJkcy5zZXQocHJlc2V0LmlkLCBjYXJkKTtcbiAgICAgIGNvbnN0IHByZXZpZXcgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGhlbWUtY2FyZC1wcmV2aWV3XCIgfSk7XG4gICAgICBwcmV2aWV3LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHByZXNldC5hcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvciA/PyBcIiNmZmZmZmZcIjtcbiAgICAgIGNvbnN0IHJvb3QgPSBwcmV2aWV3LmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRoZW1lLWNhcmQtcm9vdFwiIH0pO1xuICAgICAgcm9vdC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBwcmVzZXQuYXBwZWFyYW5jZS5yb290Q29sb3IgPz8gXCIjNGY0NmU1XCI7XG4gICAgICBjb25zdCBicmFuY2hlcyA9IHByZXZpZXcuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10aGVtZS1jYXJkLWJyYW5jaGVzXCIgfSk7XG4gICAgICAocHJlc2V0LmFwcGVhcmFuY2UuYnJhbmNoQ29sb3JzID8/IFtwcmVzZXQuYXBwZWFyYW5jZS5lZGdlQ29sb3IgPz8gXCIjN2M4YWE1XCJdKS5zbGljZSgwLCA0KS5mb3JFYWNoKChjb2xvciwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgbGluZSA9IGJyYW5jaGVzLmNyZWF0ZVNwYW4oKTtcbiAgICAgICAgbGluZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjtcbiAgICAgICAgbGluZS5zdHlsZS53aWR0aCA9IGAkezI4IC0gaW5kZXggKiA0fXB4YDtcbiAgICAgICAgbGluZS5zdHlsZS5oZWlnaHQgPSBgJHtNYXRoLm1heCgyLCA1IC0gaW5kZXgpfXB4YDtcbiAgICAgIH0pO1xuICAgICAgY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXRoZW1lLWNhcmQtbmFtZVwiLCB0ZXh0OiBwcmVzZXQubmFtZSB9KTtcbiAgICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGFwcGx5UHJlc2V0KHByZXNldC5pZCkpO1xuICAgIH1cbiAgICB1cGRhdGVTZWxlY3RlZENhcmRzKCk7XG5cbiAgICBjb25zdCBjbGFtcCA9ICh2YWx1ZTogc3RyaW5nLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIGZhbGxiYWNrOiBudW1iZXIpOiBudW1iZXIgPT4ge1xuICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgIHJldHVybiBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBwYXJzZWQpKSA6IGZhbGxiYWNrO1xuICAgIH07XG4gICAgY29uc3QgcGFyc2VCcmFuY2hDb2xvcnMgPSAoKTogc3RyaW5nW10gPT4gYnJhbmNoQ29sb3JzSW5wdXQudmFsdWVcbiAgICAgIC5zcGxpdCgvWyxcdUZGMENcXHNdKy8pXG4gICAgICAubWFwKCh2YWx1ZSkgPT4gdmFsdWUudHJpbSgpKVxuICAgICAgLmZpbHRlcigodmFsdWUpID0+IC9eI1swLTlhLWZdezZ9JC9pLnRlc3QodmFsdWUpKVxuICAgICAgLnNsaWNlKDAsIDEyKTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbW9kYWwtYWN0aW9uc1wiIH0pO1xuICAgIGNvbnN0IHJlc2V0ID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU2MDYyXHU1OTBEXHU1MTY4XHU1QzQwXHU5RUQ4XHU4QkE0XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1M0Q2XHU2RDg4XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3Qgc2F2ZSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUU5NFx1NzUyOFwiLCB0eXBlOiBcInN1Ym1pdFwiLCBjbHM6IFwibW9kLWN0YVwiIH0pO1xuICAgIHJlc2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMucmVzZXQoKTsgdGhpcy5jbG9zZSgpOyB9KTtcbiAgICBjYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IG1heFdpZHRoID0gY2xhbXAoZWRnZVdpZHRoSW5wdXQudmFsdWUsIDAuNSwgOCwgNC4yKTtcbiAgICAgIHRoaXMuc3VibWl0KHtcbiAgICAgICAgdGhlbWVQcmVzZXQ6IHNlbGVjdGVkUHJlc2V0LFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGJhY2tncm91bmQudG9nZ2xlLmNoZWNrZWQgPyBiYWNrZ3JvdW5kLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBiYWNrZ3JvdW5kUGF0dGVybjogcGF0dGVyblNlbGVjdC52YWx1ZSBhcyBCYWNrZ3JvdW5kUGF0dGVybixcbiAgICAgICAgcGF0dGVybkNvbG9yOiBwYXR0ZXJuQ29sb3IudG9nZ2xlLmNoZWNrZWQgPyBwYXR0ZXJuQ29sb3IuaW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGZvbnRGYW1pbHk6IGZvbnRTZWxlY3QudmFsdWUgYXMgRm9udEZhbWlseU1vZGUsXG4gICAgICAgIGN1c3RvbUZvbnQ6IGZvbnRTZWxlY3QudmFsdWUgPT09IFwiY3VzdG9tXCIgPyBjdXN0b21Gb250SW5wdXQudmFsdWUudHJpbSgpLnNsaWNlKDAsIDEyMCkgfHwgdW5kZWZpbmVkIDogdW5kZWZpbmVkLFxuICAgICAgICBmb250U2l6ZTogY2xhbXAoZm9udFNpemVJbnB1dC52YWx1ZSwgMTAsIDMwLCAxNCksXG4gICAgICAgIHJvb3RDb2xvcjogcm9vdENvbG9yLnRvZ2dsZS5jaGVja2VkID8gcm9vdENvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICByb290VGV4dENvbG9yOiByb290VGV4dENvbG9yLnRvZ2dsZS5jaGVja2VkID8gcm9vdFRleHRDb2xvci5pbnB1dC52YWx1ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZUNvbG9yOiBub2RlQ29sb3IudG9nZ2xlLmNoZWNrZWQgPyBub2RlQ29sb3IuaW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIHRleHRDb2xvcjogdGV4dENvbG9yLnRvZ2dsZS5jaGVja2VkID8gdGV4dENvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBub2RlQm9yZGVyQ29sb3I6IGJvcmRlckNvbG9yLnRvZ2dsZS5jaGVja2VkID8gYm9yZGVyQ29sb3IuaW5wdXQudmFsdWUgOiB1bmRlZmluZWQsXG4gICAgICAgIG5vZGVCb3JkZXJXaWR0aDogY2xhbXAoYm9yZGVyV2lkdGhJbnB1dC52YWx1ZSwgMCwgNiwgMSksXG4gICAgICAgIGVkZ2VDb2xvcjogZWRnZUNvbG9yLnRvZ2dsZS5jaGVja2VkID8gZWRnZUNvbG9yLmlucHV0LnZhbHVlIDogdW5kZWZpbmVkLFxuICAgICAgICBlZGdlV2lkdGg6IG1heFdpZHRoLFxuICAgICAgICBlZGdlU3R5bGU6IGVkZ2VTdHlsZVNlbGVjdC52YWx1ZSBhcyBFZGdlU3R5bGUsXG4gICAgICAgIGVkZ2VXaWR0aE1vZGU6IGVkZ2VXaWR0aE1vZGVTZWxlY3QudmFsdWUgYXMgRWRnZVdpZHRoTW9kZSxcbiAgICAgICAgZWRnZU1pbldpZHRoOiBNYXRoLm1pbihtYXhXaWR0aCwgY2xhbXAoZWRnZU1pbldpZHRoSW5wdXQudmFsdWUsIDAuMjUsIDQsIDEuMikpLFxuICAgICAgICBjb2xvcmZ1bEJyYW5jaGVzOiBjb2xvcmZ1bEJyYW5jaGVzLmNoZWNrZWQsXG4gICAgICAgIGJyYW5jaENvbG9yczogcGFyc2VCcmFuY2hDb2xvcnMoKSxcbiAgICAgICAgYm9sZDogYm9sZC5jaGVja2VkLFxuICAgICAgICBpdGFsaWM6IGl0YWxpYy5jaGVja2VkLFxuICAgICAgICB1bmRlcmxpbmU6IHVuZGVybGluZS5jaGVja2VkXG4gICAgICB9KTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBzYXZlLmZvY3VzKCksIDIwKTtcbiAgfVxufVxuXG5jbGFzcyBPdXRsaW5lTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbWFya2Rvd246IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSBvbkV4cG9ydDogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgbWFya2Rvd246IHN0cmluZywgb25FeHBvcnQ6ICgpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubWFya2Rvd24gPSBtYXJrZG93bjtcbiAgICB0aGlzLm9uRXhwb3J0ID0gb25FeHBvcnQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJNYXJrZG93biBcdTU5MjdcdTdFQjJcIik7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHsgY2xzOiBcIm1tYy1vdXRsaW5lLXRleHRhcmVhXCIgfSk7XG4gICAgdGV4dGFyZWEudmFsdWUgPSB0aGlzLm1hcmtkb3duO1xuICAgIHRleHRhcmVhLnJlYWRPbmx5ID0gdHJ1ZTtcbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1tb2RhbC1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgY29weSA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NTkwRFx1NTIzNlwiIH0pO1xuICAgIGNvbnN0IGV4cG9ydEJ1dHRvbiA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NUJGQ1x1NTFGQVx1NEUzQSAubWRcIiwgY2xzOiBcIm1vZC1jdGFcIiB9KTtcbiAgICBjb3B5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHRoaXMubWFya2Rvd24pO1xuICAgICAgbmV3IE5vdGljZShcIlx1NURGMlx1NTkwRFx1NTIzNiBNYXJrZG93biBcdTU5MjdcdTdFQjJcIik7XG4gICAgfSk7XG4gICAgZXhwb3J0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLm9uRXhwb3J0KCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn1cblxuY2xhc3MgU2VhcmNoTm9kZXNNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBub2RlczogTWluZE1hcE5vZGVbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBvblF1ZXJ5OiAocXVlcnk6IHN0cmluZykgPT4gdm9pZDtcbiAgcHJpdmF0ZSByZWFkb25seSBvblNlbGVjdDogKG5vZGU6IE1pbmRNYXBOb2RlKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBub2RlczogTWluZE1hcE5vZGVbXSwgb25RdWVyeTogKHF1ZXJ5OiBzdHJpbmcpID0+IHZvaWQsIG9uU2VsZWN0OiAobm9kZTogTWluZE1hcE5vZGUpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMubm9kZXMgPSBub2RlcztcbiAgICB0aGlzLm9uUXVlcnkgPSBvblF1ZXJ5O1xuICAgIHRoaXMub25TZWxlY3QgPSBvblNlbGVjdDtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlx1NjQxQ1x1N0QyMlx1ODI4Mlx1NzBCOVwiKTtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJtbWMtc2VhcmNoLW1vZGFsXCIpO1xuICAgIGNvbnN0IGlucHV0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwic2VhcmNoXCIsIGNsczogXCJtbWMtc2VhcmNoLWlucHV0XCIsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiXHU2NDFDXHU3RDIyXHU2NTg3XHU1QjU3XHUzMDAxXHU1OTA3XHU2Q0U4XHUzMDAxXHU2ODA3XHU3QjdFXHU2MjE2XHU5NEZFXHU2M0E1XHUyMDI2XCIgfSB9KTtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtc2VhcmNoLWNvdW50XCIgfSk7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtc2VhcmNoLXJlc3VsdHNcIiB9KTtcblxuICAgIGNvbnN0IHJlbmRlclJlc3VsdHMgPSAoKTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IGlucHV0LnZhbHVlLnRyaW0oKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgdGhpcy5vblF1ZXJ5KHF1ZXJ5KTtcbiAgICAgIHJlc3VsdHMuZW1wdHkoKTtcbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBxdWVyeVxuICAgICAgICA/IHRoaXMubm9kZXMuZmlsdGVyKChub2RlKSA9PiBub2RlU2VhcmNoVGV4dChub2RlKS5pbmNsdWRlcyhxdWVyeSkpLnNsaWNlKDAsIDgwKVxuICAgICAgICA6IHRoaXMubm9kZXMuc2xpY2UoMCwgNDApO1xuICAgICAgY291bnQuc2V0VGV4dChxdWVyeSA/IGBcdTYyN0VcdTUyMzAgJHttYXRjaGVzLmxlbmd0aH0gXHU0RTJBXHU4MjgyXHU3MEI5YCA6IGBcdTUxNzEgJHt0aGlzLm5vZGVzLmxlbmd0aH0gXHU0RTJBXHU4MjgyXHU3MEI5YCk7XG4gICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgbWF0Y2hlcykge1xuICAgICAgICBjb25zdCBidXR0b24gPSByZXN1bHRzLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1tYy1zZWFyY2gtcmVzdWx0XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgICAgIGNvbnN0IHRpdGxlID0gYnV0dG9uLmNyZWF0ZURpdih7IGNsczogXCJtbWMtc2VhcmNoLXJlc3VsdC10aXRsZVwiIH0pO1xuICAgICAgICBpZiAobm9kZS5pY29uKSB0aXRsZS5jcmVhdGVTcGFuKHsgdGV4dDogYCR7bm9kZS5pY29ufSBgIH0pO1xuICAgICAgICB0aXRsZS5jcmVhdGVTcGFuKHsgdGV4dDogbm9kZVBsYWluVGV4dChub2RlKSB8fCBcIlx1NTZGRVx1NzI0N1x1ODI4Mlx1NzBCOVwiIH0pO1xuICAgICAgICBjb25zdCBkZXRhaWxzID0gW25vZGUudGFzayA/ICh7IHRvZG86IFwiXHU1Rjg1XHU1MjlFXCIsIGRvaW5nOiBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiLCBkb25lOiBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIH0gYXMgY29uc3QpW25vZGUudGFza10gOiBcIlwiLCAuLi4obm9kZS50YWdzID8/IFtdKS5tYXAoKHRhZykgPT4gYCMke3RhZ31gKV1cbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLmpvaW4oXCIgXHUwMEI3IFwiKTtcbiAgICAgICAgaWYgKGRldGFpbHMpIGJ1dHRvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXNlYXJjaC1yZXN1bHQtbWV0YVwiLCB0ZXh0OiBkZXRhaWxzIH0pO1xuICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLm9uU2VsZWN0KG5vZGUpO1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoIW1hdGNoZXMubGVuZ3RoKSByZXN1bHRzLmNyZWF0ZURpdih7IGNsczogXCJtbWMtZW1wdHktc3RhdGVcIiwgdGV4dDogXCJcdTZDQTFcdTY3MDlcdTUzMzlcdTkxNERcdTc2ODRcdTgyODJcdTcwQjlcIiB9KTtcbiAgICB9O1xuXG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHJlbmRlclJlc3VsdHMpO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gcmVzdWx0cy5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcIi5tbWMtc2VhcmNoLXJlc3VsdFwiKTtcbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBmaXJzdC5jbGljaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVuZGVyUmVzdWx0cygpO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IGlucHV0LmZvY3VzKCksIDIwKTtcbiAgfVxufVxuXG5jbGFzcyBKc29uVHJhbnNmZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBkb2N1bWVudDogTWluZE1hcERvY3VtZW50O1xuICBwcml2YXRlIHJlYWRvbmx5IG9uSW1wb3J0OiAoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSByZWFkb25seSBvbkV4cG9ydDogKGpzb246IHN0cmluZykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCwgb25JbXBvcnQ6IChkb2N1bWVudDogTWluZE1hcERvY3VtZW50KSA9PiB2b2lkLCBvbkV4cG9ydDogKGpzb246IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgIHRoaXMub25JbXBvcnQgPSBvbkltcG9ydDtcbiAgICB0aGlzLm9uRXhwb3J0ID0gb25FeHBvcnQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJKU09OIFx1NUJGQ1x1NTE2NSAvIFx1NUJGQ1x1NTFGQVwiKTtcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiXHU1M0VGXHU0RUU1XHU1OTBEXHU1MjM2XHU1RjUzXHU1MjREIEpTT05cdUZGMENcdTRFNUZcdTUzRUZcdTRFRTVcdTdDOThcdThEMzRcdTUxNzZcdTRFRDYgTWluZE1hcCBTdHVkaW8gXHU2NTg3XHU2ODYzIEpTT04gXHU1NDBFXHU1QkZDXHU1MTY1XHUzMDAyXCIgfSk7XG4gICAgZGVzY3JpcHRpb24uYWRkQ2xhc3MoXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIik7XG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHsgY2xzOiBcIm1tYy1qc29uLXRleHRhcmVhXCIgfSk7XG4gICAgdGV4dGFyZWEudmFsdWUgPSBKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50LCBudWxsLCAyKTtcbiAgICBjb25zdCBhY3Rpb25zID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1tb2RhbC1hY3Rpb25zIG1tYy1qc29uLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjb3B5ID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU1OTBEXHU1MjM2IEpTT05cIiB9KTtcbiAgICBjb25zdCBleHBvcnRCdXR0b24gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTVCRkNcdTUxRkEgLmpzb25cIiB9KTtcbiAgICBjb25zdCBpbXBvcnRCdXR0b24gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTVCRkNcdTUxNjVcdTVFNzZcdTY2RkZcdTYzNjJcIiwgY2xzOiBcIm1vZC13YXJuaW5nXCIgfSk7XG4gICAgY29weS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0YXJlYS52YWx1ZSk7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1REYyXHU1OTBEXHU1MjM2IEpTT05cIik7XG4gICAgfSk7XG4gICAgZXhwb3J0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLm9uRXhwb3J0KHRleHRhcmVhLnZhbHVlKSk7XG4gICAgaW1wb3J0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHRleHRhcmVhLnZhbHVlKSBhcyBQYXJ0aWFsPE1pbmRNYXBEb2N1bWVudD47XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVEb2N1bWVudChwYXJzZWQsIHRoaXMuZG9jdW1lbnQudGl0bGUpO1xuICAgICAgICB0aGlzLm9uSW1wb3J0KG5vcm1hbGl6ZWQpO1xuICAgICAgICBuZXcgTm90aWNlKFwiSlNPTiBcdTVERjJcdTVCRkNcdTUxNjVcIik7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBKU09OIGltcG9ydCBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgICBuZXcgTm90aWNlKFwiSlNPTiBcdTY4M0NcdTVGMEZcdTY1RTBcdTY1NDhcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTU0MEVcdTkxQ0RcdThCRDVcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1pbmRNYXBFZGl0b3Ige1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwO1xuICBwcml2YXRlIHJlYWRvbmx5IGhvc3Q6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIHJlYWRvbmx5IGNhbGxiYWNrczogTWluZE1hcEVkaXRvckNhbGxiYWNrcztcbiAgcHJpdmF0ZSBvcHRpb25zOiBNaW5kTWFwRWRpdG9yT3B0aW9ucztcbiAgcHJpdmF0ZSByb290RWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSB0b29sYmFyRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBuYXZpZ2F0aW9uQmFyRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSB2aWV3cG9ydEVsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgc2NlbmVFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG5vZGVzTGF5ZXJFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIGVkZ2VzU3ZnITogU1ZHU1ZHRWxlbWVudDtcbiAgcHJpdmF0ZSBzdGF0dXNFbCE6IEhUTUxTcGFuRWxlbWVudDtcbiAgcHJpdmF0ZSB6b29tU3RhdHVzRWwhOiBIVE1MU3BhbkVsZW1lbnQ7XG4gIHByaXZhdGUgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudDtcbiAgcHJpdmF0ZSBsYXlvdXQ6IExheW91dFJlc3VsdDtcbiAgcHJpdmF0ZSBzZWxlY3RlZElkOiBzdHJpbmc7XG4gIHByaXZhdGUgem9vbSA9IDE7XG4gIHByaXZhdGUgcGFuWCA9IDA7XG4gIHByaXZhdGUgcGFuWSA9IDA7XG4gIHByaXZhdGUgaGlzdG9yeTogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBmdXR1cmU6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgZHJhZ2dpbmdJZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcGFubmluZyA9IGZhbHNlO1xuICBwcml2YXRlIHBhblN0YXJ0ID0geyB4OiAwLCB5OiAwLCBwYW5YOiAwLCBwYW5ZOiAwIH07XG4gIHByaXZhdGUgY2xlYW51cENhbGxiYWNrczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcbiAgcHJpdmF0ZSByZXNpemVPYnNlcnZlcjogUmVzaXplT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBicmFuY2hDbGlwYm9hcmQ6IE1pbmRNYXBOb2RlIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2VhcmNoUXVlcnkgPSBcIlwiO1xuICBwcml2YXRlIHJlYWRvbmx5IGltYWdlTG9hZFRpbWVycyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBob3N0OiBIVE1MRWxlbWVudCwgZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCwgY2FsbGJhY2tzOiBNaW5kTWFwRWRpdG9yQ2FsbGJhY2tzLCBvcHRpb25zOiBNaW5kTWFwRWRpdG9yT3B0aW9ucykge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuaG9zdCA9IGhvc3Q7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBjYWxsYmFja3M7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmRvY3VtZW50ID0gY2xvbmVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIHRoaXMubGF5b3V0ID0gY29tcHV0ZUxheW91dCh0aGlzLmRvY3VtZW50LnJvb3QsIHRoaXMuZG9jdW1lbnQubGF5b3V0LCB0aGlzLmdldEFwcGVhcmFuY2UoKS5mb250U2l6ZSA/PyAxNCk7XG4gICAgdGhpcy5idWlsZFVpKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9GaXRPbk9wZW4pIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDUwKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5jbGVhckltYWdlTG9hZFRpbWVycygpO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjaykgPT4gY2FsbGJhY2soKSk7XG4gICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzID0gW107XG4gICAgdGhpcy5yZXNpemVPYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICAgIHRoaXMucmVzaXplT2JzZXJ2ZXIgPSBudWxsO1xuICAgIHRoaXMuaG9zdC5lbXB0eSgpO1xuICB9XG5cbiAgc2V0RG9jdW1lbnQoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCwgcmVzZXRIaXN0b3J5ID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuZG9jdW1lbnQgPSBjbG9uZURvY3VtZW50KGRvY3VtZW50KTtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgaWYgKHJlc2V0SGlzdG9yeSkge1xuICAgICAgdGhpcy5oaXN0b3J5ID0gW107XG4gICAgICB0aGlzLmZ1dHVyZSA9IFtdO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b0ZpdE9uT3Blbikgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5maXRUb1ZpZXcoKSwgMjApO1xuICB9XG5cbiAgc2V0T3B0aW9ucyhvcHRpb25zOiBNaW5kTWFwRWRpdG9yT3B0aW9ucyk6IHZvaWQge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIGdldERvY3VtZW50KCk6IE1pbmRNYXBEb2N1bWVudCB7XG4gICAgcmV0dXJuIGNsb25lRG9jdW1lbnQodGhpcy5kb2N1bWVudCk7XG4gIH1cblxuICBtYXJrU2F2ZWQoKTogdm9pZCB7XG4gICAgdGhpcy5zdGF0dXNFbC5zZXRUZXh0KFwiXHU1REYyXHU0RkREXHU1QjU4XCIpO1xuICAgIHRoaXMucm9vdEVsLnJlbW92ZUNsYXNzKFwiaXMtZGlydHlcIik7XG4gIH1cblxuICBtYXJrU2F2aW5nKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdHVzRWwuc2V0VGV4dChcIlx1NEZERFx1NUI1OFx1NEUyRFx1MjAyNlwiKTtcbiAgICB0aGlzLnJvb3RFbC5hZGRDbGFzcyhcImlzLWRpcnR5XCIpO1xuICB9XG5cbiAgZm9jdXMoKTogdm9pZCB7XG4gICAgdGhpcy5yb290RWwuZm9jdXMoKTtcbiAgfVxuXG4gIGZvY3VzTm9kZUJ5SWQoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGlkKSkgdGhpcy5mb2N1c05vZGUoaWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFVpKCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdC5lbXB0eSgpO1xuICAgIHRoaXMucm9vdEVsID0gdGhpcy5ob3N0LmNyZWF0ZURpdih7IGNsczogXCJtbWMtZWRpdG9yXCIgfSk7XG4gICAgdGhpcy5yb290RWwudGFiSW5kZXggPSAwO1xuICAgIHRoaXMudG9vbGJhckVsID0gdGhpcy5yb290RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10b29sYmFyXCIgfSk7XG4gICAgdGhpcy5uYXZpZ2F0aW9uQmFyRWwgPSB0aGlzLnJvb3RFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uXCIgfSk7XG4gICAgdGhpcy52aWV3cG9ydEVsID0gdGhpcy5yb290RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy12aWV3cG9ydFwiIH0pO1xuICAgIHRoaXMuc2NlbmVFbCA9IHRoaXMudmlld3BvcnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXNjZW5lXCIgfSk7XG4gICAgdGhpcy5lZGdlc1N2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpO1xuICAgIHRoaXMuZWRnZXNTdmcuY2xhc3NMaXN0LmFkZChcIm1tYy1lZGdlc1wiKTtcbiAgICB0aGlzLnNjZW5lRWwuYXBwZW5kQ2hpbGQodGhpcy5lZGdlc1N2Zyk7XG4gICAgdGhpcy5ub2Rlc0xheWVyRWwgPSB0aGlzLnNjZW5lRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1ub2Rlcy1sYXllclwiIH0pO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcInBsdXMtY2lyY2xlXCIsIFwiXHU2REZCXHU1MkEwXHU1QjUwXHU4MjgyXHU3MEI5XHVGRjA4VGFiXHVGRjA5XCIsICgpID0+IHRoaXMuYWRkQ2hpbGQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwibGlzdC1wbHVzXCIsIFwiXHU2REZCXHU1MkEwXHU1NDBDXHU3RUE3XHU4MjgyXHU3MEI5XHVGRjA4RW50ZXJcdUZGMDlcIiwgKCkgPT4gdGhpcy5hZGRTaWJsaW5nKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcInBlbmNpbFwiLCBcIlx1N0YxNlx1OEY5MVx1ODI4Mlx1NzBCOVx1RkYwOEYyXHVGRjA5XCIsICgpID0+IHRoaXMuZWRpdFNlbGVjdGVkKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImNvcHktcGx1c1wiLCBcIlx1NTE0Qlx1OTY4Nlx1NTIwNlx1NjUyRlx1RkYwOEN0cmwvQ21kK0RcdUZGMDlcIiwgKCkgPT4gdGhpcy5kdXBsaWNhdGVTZWxlY3RlZCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ0cmFzaC0yXCIsIFwiXHU1MjIwXHU5NjY0XHU4MjgyXHU3MEI5XHVGRjA4RGVsZXRlXHVGRjA5XCIsICgpID0+IHRoaXMuZGVsZXRlU2VsZWN0ZWQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyU2VwYXJhdG9yKCk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiY2lyY2xlLWNoZWNrLWJpZ1wiLCBcIlx1NTIwN1x1NjM2Mlx1NEVGQlx1NTJBMVx1NzJCNlx1NjAwMVx1RkYwOEN0cmwvQ21kK0VudGVyXHVGRjA5XCIsICgpID0+IHRoaXMuY3ljbGVUYXNrKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImZvbGQtdmVydGljYWxcIiwgXCJcdTVDNTVcdTVGMDAvXHU2NTM2XHU4RDc3XHU4MjgyXHU3MEI5XHVGRjA4U3BhY2VcdUZGMDlcIiwgKCkgPT4gdGhpcy50b2dnbGVDb2xsYXBzZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJsaW5rXCIsIFwiXHU2MjUzXHU1RjAwXHU4MjgyXHU3MEI5XHU5NEZFXHU2M0E1XCIsICgpID0+IHRoaXMub3BlblNlbGVjdGVkTGluaygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJzZWFyY2hcIiwgXCJcdTY0MUNcdTdEMjJcdTVGNTNcdTUyNERcdTVCRkNcdTU2RkVcdUZGMDhDdHJsL0NtZCtGXHVGRjA5XCIsICgpID0+IHRoaXMub3BlblNlYXJjaCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJmaWxlLXNlYXJjaFwiLCBcIlx1NTE2OFx1NUM0MFx1NjQxQ1x1N0QyMlx1NjI0MFx1NjcwOVx1NUJGQ1x1NTZGRVx1RkYwOEN0cmwvQ21kK1NoaWZ0K0ZcdUZGMDlcIiwgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25HbG9iYWxTZWFyY2goKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyU2VwYXJhdG9yKCk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwidGFibGUtMlwiLCBcIlx1NjNEMlx1NTE2NVx1NjIxNlx1N0YxNlx1OEY5MVx1ODg2OFx1NjgzQ1wiLCAoKSA9PiB0aGlzLmVkaXRUYWJsZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJjb2RlLTJcIiwgXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTRFRTNcdTc4MDFcIiwgKCkgPT4gdGhpcy5lZGl0Q29kZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJpbWFnZS1wbHVzXCIsIFwiXHU3Qzk4XHU4RDM0XHU1NkZFXHU3MjQ3XHU1MjMwXHU1RjUzXHU1MjREXHU4MjgyXHU3MEI5XHVGRjA4Q3RybC9DbWQrVlx1RkYwOVwiLCAoKSA9PiBuZXcgTm90aWNlKFwiXHU1MTQ4XHU1OTBEXHU1MjM2XHU1NkZFXHU3MjQ3XHVGRjBDXHU1MThEXHU5MDA5XHU0RTJEXHU4MjgyXHU3MEI5XHU1RTc2XHU2MzA5IEN0cmwvQ21kK1ZcIikpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcIm5ldHdvcmtcIiwgXCJcdTUyMUJcdTVFRkFcdTYyMTZcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkVcIiwgKCkgPT4gdm9pZCB0aGlzLmNyZWF0ZU9yT3BlblN1Ym1hcCgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ1bmRvLTJcIiwgXCJcdTY0QTRcdTk1MDBcdUZGMDhDdHJsL0NtZCtaXHVGRjA5XCIsICgpID0+IHRoaXMudW5kbygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJyZWRvLTJcIiwgXCJcdTkxQ0RcdTUwNUFcdUZGMDhDdHJsL0NtZCtZXHVGRjA5XCIsICgpID0+IHRoaXMucmVkbygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJTZXBhcmF0b3IoKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJ6b29tLWluXCIsIFwiXHU2NTNFXHU1OTI3XCIsICgpID0+IHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gKiAxLjE1KSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiem9vbS1vdXRcIiwgXCJcdTdGMjlcdTVDMEZcIiwgKCkgPT4gdGhpcy5zZXRab29tKHRoaXMuem9vbSAvIDEuMTUpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJtYXhpbWl6ZVwiLCBcIlx1OTAwMlx1NUU5NFx1NzUzQlx1NUUwM1wiLCAoKSA9PiB0aGlzLmZpdFRvVmlldygpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJnaXQtZm9ya1wiLCBcIlx1NTIwN1x1NjM2Mlx1NTM1NVx1NEZBNy9cdTUzQ0NcdTRGQTdcdTVFMDNcdTVDNDBcIiwgKCkgPT4gdGhpcy50b2dnbGVMYXlvdXQoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwicGFsZXR0ZVwiLCBcIlx1NUY1M1x1NTI0RFx1ODExMVx1NTZGRVx1NTkxNlx1ODlDMlwiLCAoKSA9PiB0aGlzLmVkaXRBcHBlYXJhbmNlKCkpO1xuICAgIHRoaXMuYWRkVG9vbGJhclNlcGFyYXRvcigpO1xuICAgIHRoaXMuYWRkVG9vbGJhckJ1dHRvbihcImZpbGUtdGV4dFwiLCBcIlx1NjdFNVx1NzcwQiBNYXJrZG93biBcdTU5MjdcdTdFQjJcIiwgKCkgPT4gdGhpcy5zaG93T3V0bGluZSgpKTtcbiAgICB0aGlzLmFkZFRvb2xiYXJCdXR0b24oXCJicmFjZXNcIiwgXCJKU09OIFx1NUJGQ1x1NTE2NSAvIFx1NUJGQ1x1NTFGQVwiLCAoKSA9PiB0aGlzLnNob3dKc29uVHJhbnNmZXIoKSk7XG4gICAgdGhpcy5hZGRUb29sYmFyQnV0dG9uKFwiaW1hZ2VcIiwgXCJcdTVCRkNcdTUxRkEgU1ZHXCIsICgpID0+IHZvaWQgdGhpcy5jYWxsYmFja3Mub25FeHBvcnRTdmcoZG9jdW1lbnRUb1N2Zyh0aGlzLmRvY3VtZW50LnJvb3QsIHRoaXMuZG9jdW1lbnQubGF5b3V0LCB0aGlzLmRvY3VtZW50LnRpdGxlLCB0aGlzLmdldEFwcGVhcmFuY2UoKSkpKTtcblxuICAgIGNvbnN0IHNwYWNlciA9IHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRvb2xiYXItc3BhY2VyXCIgfSk7XG4gICAgc3BhY2VyLnNldEF0dHIoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gICAgdGhpcy56b29tU3RhdHVzRWwgPSB0aGlzLnRvb2xiYXJFbC5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tYy16b29tLXN0YXR1c1wiLCB0ZXh0OiBcIjEwMCVcIiB9KTtcbiAgICB0aGlzLnN0YXR1c0VsID0gdGhpcy50b29sYmFyRWwuY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtc2F2ZS1zdGF0dXNcIiwgdGV4dDogXCJcdTVERjJcdTRGRERcdTVCNThcIiB9KTtcblxuICAgIGNvbnN0IGtleWRvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHRoaXMuaGFuZGxlS2V5ZG93bihldmVudCk7XG4gICAgdGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5ZG93bik7XG4gICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzLnB1c2goKCkgPT4gdGhpcy5yb290RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5ZG93bikpO1xuXG4gICAgY29uc3QgcGFzdGUgPSAoZXZlbnQ6IENsaXBib2FyZEV2ZW50KTogdm9pZCA9PiB7IHZvaWQgdGhpcy5oYW5kbGVQYXN0ZShldmVudCk7IH07XG4gICAgdGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIHBhc3RlKTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnJvb3RFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicGFzdGVcIiwgcGFzdGUpKTtcblxuICAgIGNvbnN0IHdoZWVsID0gKGV2ZW50OiBXaGVlbEV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB3aGVlbFRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGlmICh3aGVlbFRhcmdldC5jbG9zZXN0KFwiLm1tYy1ub2RlLXRhYmxlLXdyYXAsIC5tbWMtY29kZS1ibG9ja1wiKSkgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnZpZXdwb3J0RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBwb2ludGVyWCA9IGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQgLSByZWN0LndpZHRoIC8gMjtcbiAgICAgIGNvbnN0IHBvaW50ZXJZID0gZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wIC0gcmVjdC5oZWlnaHQgLyAyO1xuICAgICAgY29uc3Qgb2xkWm9vbSA9IHRoaXMuem9vbTtcbiAgICAgIGNvbnN0IG5leHRab29tID0gdGhpcy5jbGFtcFpvb20odGhpcy56b29tICogKGV2ZW50LmRlbHRhWSA8IDAgPyAxLjEgOiAwLjkpKTtcbiAgICAgIGNvbnN0IHdvcmxkWCA9IChwb2ludGVyWCAtIHRoaXMucGFuWCkgLyBvbGRab29tO1xuICAgICAgY29uc3Qgd29ybGRZID0gKHBvaW50ZXJZIC0gdGhpcy5wYW5ZKSAvIG9sZFpvb207XG4gICAgICB0aGlzLnpvb20gPSBuZXh0Wm9vbTtcbiAgICAgIHRoaXMucGFuWCA9IHBvaW50ZXJYIC0gd29ybGRYICogbmV4dFpvb207XG4gICAgICB0aGlzLnBhblkgPSBwb2ludGVyWSAtIHdvcmxkWSAqIG5leHRab29tO1xuICAgICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICAgIH07XG4gICAgdGhpcy52aWV3cG9ydEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCB3aGVlbCwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcbiAgICB0aGlzLmNsZWFudXBDYWxsYmFja3MucHVzaCgoKSA9PiB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHdoZWVsKSk7XG5cbiAgICBjb25zdCBwb2ludGVyRG93biA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBpZiAodGFyZ2V0LmNsb3Nlc3QoXCIubW1jLW5vZGVcIikpIHJldHVybjtcbiAgICAgIGlmIChldmVudC5idXR0b24gIT09IDAgJiYgZXZlbnQuYnV0dG9uICE9PSAxKSByZXR1cm47XG4gICAgICB0aGlzLnBhbm5pbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wYW5TdGFydCA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSwgcGFuWDogdGhpcy5wYW5YLCBwYW5ZOiB0aGlzLnBhblkgfTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5zZXRQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLmFkZENsYXNzKFwiaXMtcGFubmluZ1wiKTtcbiAgICAgIHRoaXMuc2VsZWN0Tm9kZShudWxsKTtcbiAgICB9O1xuICAgIGNvbnN0IHBvaW50ZXJNb3ZlID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpOiB2b2lkID0+IHtcbiAgICAgIGlmICghdGhpcy5wYW5uaW5nKSByZXR1cm47XG4gICAgICB0aGlzLnBhblggPSB0aGlzLnBhblN0YXJ0LnBhblggKyBldmVudC5jbGllbnRYIC0gdGhpcy5wYW5TdGFydC54O1xuICAgICAgdGhpcy5wYW5ZID0gdGhpcy5wYW5TdGFydC5wYW5ZICsgZXZlbnQuY2xpZW50WSAtIHRoaXMucGFuU3RhcnQueTtcbiAgICAgIHRoaXMuYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICB9O1xuICAgIGNvbnN0IHBvaW50ZXJVcCA9IChldmVudDogUG9pbnRlckV2ZW50KTogdm9pZCA9PiB7XG4gICAgICBpZiAoIXRoaXMucGFubmluZykgcmV0dXJuO1xuICAgICAgdGhpcy5wYW5uaW5nID0gZmFsc2U7XG4gICAgICBpZiAodGhpcy52aWV3cG9ydEVsLmhhc1BvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCkpIHRoaXMudmlld3BvcnRFbC5yZWxlYXNlUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKTtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVDbGFzcyhcImlzLXBhbm5pbmdcIik7XG4gICAgfTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHBvaW50ZXJEb3duKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHBvaW50ZXJNb3ZlKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCBwb2ludGVyVXApO1xuICAgIHRoaXMudmlld3BvcnRFbC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmNhbmNlbFwiLCBwb2ludGVyVXApO1xuICAgIHRoaXMuY2xlYW51cENhbGxiYWNrcy5wdXNoKCgpID0+IHtcbiAgICAgIHRoaXMudmlld3BvcnRFbC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgcG9pbnRlckRvd24pO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCBwb2ludGVyTW92ZSk7XG4gICAgICB0aGlzLnZpZXdwb3J0RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCBwb2ludGVyVXApO1xuICAgICAgdGhpcy52aWV3cG9ydEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVyY2FuY2VsXCIsIHBvaW50ZXJVcCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHRoaXMuYXBwbHlUcmFuc2Zvcm0oKSk7XG4gICAgdGhpcy5yZXNpemVPYnNlcnZlci5vYnNlcnZlKHRoaXMudmlld3BvcnRFbCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFySW1hZ2VMb2FkVGltZXJzKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdGltZXIgb2YgdGhpcy5pbWFnZUxvYWRUaW1lcnMpIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRoaXMuaW1hZ2VMb2FkVGltZXJzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFkZFRvb2xiYXJCdXR0b24oaWNvbjogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCBhY3Rpb246ICgpID0+IHZvaWQpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy50b29sYmFyRWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb24gbW1jLXRvb2xiYXItYnV0dG9uXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGxhYmVsLCB0aXRsZTogbGFiZWwgfSB9KTtcbiAgICBzZXRJY29uKGJ1dHRvbiwgaWNvbik7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBhY3Rpb24oKTtcbiAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gYnV0dG9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRUb29sYmFyU2VwYXJhdG9yKCk6IHZvaWQge1xuICAgIHRoaXMudG9vbGJhckVsLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLXRvb2xiYXItc2VwYXJhdG9yXCIgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldEFwcGVhcmFuY2UoKTogTWluZE1hcEFwcGVhcmFuY2Uge1xuICAgIHJldHVybiBtZXJnZUFwcGVhcmFuY2UodGhpcy5vcHRpb25zLmRlZmF1bHRBcHBlYXJhbmNlLCB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb250RmFtaWx5Q3NzKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKTogc3RyaW5nIHtcbiAgICBpZiAoYXBwZWFyYW5jZS5mb250RmFtaWx5ID09PSBcInNlcmlmXCIpIHJldHVybiAnR2VvcmdpYSwgXCJUaW1lcyBOZXcgUm9tYW5cIiwgc2VyaWYnO1xuICAgIGlmIChhcHBlYXJhbmNlLmZvbnRGYW1pbHkgPT09IFwibW9ub1wiKSByZXR1cm4gJ1wiU0ZNb25vLVJlZ3VsYXJcIiwgQ29uc29sYXMsIFwiTGliZXJhdGlvbiBNb25vXCIsIG1vbm9zcGFjZSc7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJjdXN0b21cIiAmJiBhcHBlYXJhbmNlLmN1c3RvbUZvbnQ/LnRyaW0oKSkgcmV0dXJuIGBcIiR7YXBwZWFyYW5jZS5jdXN0b21Gb250LnRyaW0oKS5yZXBsYWNlQWxsKCdcIicsICcnKX1cIiwgc2Fucy1zZXJpZmA7XG4gICAgaWYgKGFwcGVhcmFuY2UuZm9udEZhbWlseSA9PT0gXCJzYW5zXCIpIHJldHVybiAnSW50ZXIsIC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgXCJTZWdvZSBVSVwiLCBzYW5zLXNlcmlmJztcbiAgICByZXR1cm4gXCJ2YXIoLS1mb250LWludGVyZmFjZSlcIjtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlBcHBlYXJhbmNlKGFwcGVhcmFuY2U6IE1pbmRNYXBBcHBlYXJhbmNlKTogdm9pZCB7XG4gICAgY29uc3Qgc2V0T3JSZW1vdmUgPSAobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgICBpZiAodmFsdWUpIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgIGVsc2UgdGhpcy5yb290RWwuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgfTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLWNhbnZhc1wiLCBhcHBlYXJhbmNlLmJhY2tncm91bmRDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1wYXR0ZXJuLWNvbG9yXCIsIGFwcGVhcmFuY2UucGF0dGVybkNvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLWVkZ2VcIiwgYXBwZWFyYW5jZS5lZGdlQ29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtcm9vdC1iZ1wiLCBhcHBlYXJhbmNlLnJvb3RDb2xvcik7XG4gICAgc2V0T3JSZW1vdmUoXCItLW1tYy1yb290LXRleHRcIiwgYXBwZWFyYW5jZS5yb290VGV4dENvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLW5vZGUtYmdcIiwgYXBwZWFyYW5jZS5ub2RlQ29sb3IpO1xuICAgIHNldE9yUmVtb3ZlKFwiLS1tbWMtbm9kZS10ZXh0XCIsIGFwcGVhcmFuY2UudGV4dENvbG9yKTtcbiAgICBzZXRPclJlbW92ZShcIi0tbW1jLW5vZGUtYm9yZGVyXCIsIGFwcGVhcmFuY2Uubm9kZUJvcmRlckNvbG9yKTtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLWZvbnQtZmFtaWx5XCIsIHRoaXMuZm9udEZhbWlseUNzcyhhcHBlYXJhbmNlKSk7XG4gICAgdGhpcy5yb290RWwuc3R5bGUuc2V0UHJvcGVydHkoXCItLW1tYy1lZGdlLXdpZHRoXCIsIGAke2FwcGVhcmFuY2UuZWRnZVdpZHRoID8/IDIuMn1weGApO1xuICAgIHRoaXMucm9vdEVsLnN0eWxlLnNldFByb3BlcnR5KFwiLS1tbWMtbm9kZS1ib3JkZXItd2lkdGhcIiwgYCR7YXBwZWFyYW5jZS5ub2RlQm9yZGVyV2lkdGggPz8gMX1weGApO1xuICAgIHRoaXMudmlld3BvcnRFbC50b2dnbGVDbGFzcyhcInBhdHRlcm4tZ3JpZFwiLCBhcHBlYXJhbmNlLmJhY2tncm91bmRQYXR0ZXJuID09PSBcImdyaWRcIik7XG4gICAgdGhpcy52aWV3cG9ydEVsLnRvZ2dsZUNsYXNzKFwicGF0dGVybi1kb3RzXCIsIGFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gPT09IFwiZG90c1wiKTtcbiAgICB0aGlzLnZpZXdwb3J0RWwudG9nZ2xlQ2xhc3MoXCJwYXR0ZXJuLW5vbmVcIiwgIWFwcGVhcmFuY2UuYmFja2dyb3VuZFBhdHRlcm4gfHwgYXBwZWFyYW5jZS5iYWNrZ3JvdW5kUGF0dGVybiA9PT0gXCJub25lXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJOYXZpZ2F0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsLmVtcHR5KCk7XG4gICAgY29uc3QgbmF2aWdhdGlvbiA9IHRoaXMuZG9jdW1lbnQubmF2aWdhdGlvbjtcbiAgICB0aGlzLm5hdmlnYXRpb25CYXJFbC50b2dnbGVDbGFzcyhcImlzLWhpZGRlblwiLCAhbmF2aWdhdGlvbj8ucGFyZW50UGF0aCk7XG4gICAgaWYgKCFuYXZpZ2F0aW9uPy5wYXJlbnRQYXRoKSByZXR1cm47XG5cbiAgICBjb25zdCBidXR0b24gPSB0aGlzLm5hdmlnYXRpb25CYXJFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uLWJ1dHRvblwiLFxuICAgICAgYXR0cjoge1xuICAgICAgICB0eXBlOiBcImJ1dHRvblwiLFxuICAgICAgICB0aXRsZTogYFx1OEZENFx1NTZERVx1NzIzNlx1NUJGQ1x1NTZGRVx1RkYxQSR7bmF2aWdhdGlvbi5wYXJlbnRQYXRofWBcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzZXRJY29uKGJ1dHRvbiwgXCJhcnJvdy1sZWZ0XCIpO1xuICAgIGNvbnN0IGxhYmVscyA9IGJ1dHRvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uLWxhYmVsc1wiIH0pO1xuICAgIGxhYmVscy5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXBhcmVudC1uYXZpZ2F0aW9uLXRpdGxlXCIsIHRleHQ6IGBcdThGRDRcdTU2REVcdTcyMzZcdTVCRkNcdTU2RkVcdUZGMUEke25hdmlnYXRpb24ucGFyZW50VGl0bGUgPz8gbmF2aWdhdGlvbi5wYXJlbnRQYXRoLnNwbGl0KFwiL1wiKS5hdCgtMSk/LnJlcGxhY2UoL1xcLm1pbmRtYXAkL2ksIFwiXCIpID8/IFwiXHU3MjM2XHU1QkZDXHU1NkZFXCJ9YCB9KTtcbiAgICBpZiAobmF2aWdhdGlvbi5wYXJlbnROb2RlVGV4dCkgbGFiZWxzLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tbm9kZVwiLCB0ZXh0OiBgXHU2NzY1XHU2RTkwXHU4MjgyXHU3MEI5XHVGRjFBJHtuYXZpZ2F0aW9uLnBhcmVudE5vZGVUZXh0fWAgfSk7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB2b2lkIHRoaXMuY2FsbGJhY2tzLm9uT3Blbk1pbmRNYXAobmF2aWdhdGlvbi5wYXJlbnRQYXRoLCBuYXZpZ2F0aW9uLnBhcmVudE5vZGVJZCkpO1xuICAgIHRoaXMubmF2aWdhdGlvbkJhckVsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtcGFyZW50LW5hdmlnYXRpb24tcGF0aFwiLCB0ZXh0OiBuYXZpZ2F0aW9uLnBhcmVudFBhdGggfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcbiAgICB0aGlzLmNsZWFySW1hZ2VMb2FkVGltZXJzKCk7XG4gICAgdGhpcy5yZW5kZXJOYXZpZ2F0aW9uKCk7XG4gICAgY29uc3QgYXBwZWFyYW5jZSA9IHRoaXMuZ2V0QXBwZWFyYW5jZSgpO1xuICAgIHRoaXMuYXBwbHlBcHBlYXJhbmNlKGFwcGVhcmFuY2UpO1xuICAgIHRoaXMubGF5b3V0ID0gY29tcHV0ZUxheW91dCh0aGlzLmRvY3VtZW50LnJvb3QsIHRoaXMuZG9jdW1lbnQubGF5b3V0LCBhcHBlYXJhbmNlLmZvbnRTaXplID8/IDE0KTtcbiAgICBjb25zdCBicmFuY2hDb2xvck1hcCA9IGFwcGVhcmFuY2UuY29sb3JmdWxCcmFuY2hlcyA/IGJ1aWxkQnJhbmNoQ29sb3JNYXAodGhpcy5kb2N1bWVudC5yb290LCBhcHBlYXJhbmNlLmJyYW5jaENvbG9ycykgOiBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICAgIHRoaXMubm9kZXNMYXllckVsLmVtcHR5KCk7XG4gICAgd2hpbGUgKHRoaXMuZWRnZXNTdmcuZmlyc3RDaGlsZCkgdGhpcy5lZGdlc1N2Zy5yZW1vdmVDaGlsZCh0aGlzLmVkZ2VzU3ZnLmZpcnN0Q2hpbGQpO1xuXG4gICAgY29uc3QgbWF4RGVwdGggPSBNYXRoLm1heCgxLCAuLi50aGlzLmxheW91dC5ub2Rlcy5tYXAoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbi5kZXB0aCkpO1xuXG4gICAgZm9yIChjb25zdCBwb3NpdGlvbiBvZiB0aGlzLmxheW91dC5ub2Rlcykge1xuICAgICAgaWYgKCFwb3NpdGlvbi5wYXJlbnRJZCkgY29udGludWU7XG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLmxheW91dC5ieUlkLmdldChwb3NpdGlvbi5wYXJlbnRJZCk7XG4gICAgICBpZiAoIXBhcmVudCkgY29udGludWU7XG4gICAgICBjb25zdCBwYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJwYXRoXCIpO1xuICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJkXCIsIGVkZ2VQYXRoKHBhcmVudCwgcG9zaXRpb24sIGFwcGVhcmFuY2UuZWRnZVN0eWxlID8/IFwiY3VydmVkXCIpKTtcbiAgICAgIHBhdGguc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgYG1tYy1lZGdlIGRlcHRoLSR7TWF0aC5taW4ocG9zaXRpb24uZGVwdGgsIDYpfWApO1xuICAgICAgY29uc3QgYnJhbmNoQ29sb3IgPSBicmFuY2hDb2xvck1hcC5nZXQocG9zaXRpb24ubm9kZS5pZCk7XG4gICAgICBpZiAocG9zaXRpb24ubm9kZS5zdHlsZT8uY29sb3IpIHBhdGguc3R5bGUuc3Ryb2tlID0gcG9zaXRpb24ubm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIGVsc2UgaWYgKGJyYW5jaENvbG9yKSBwYXRoLnN0eWxlLnN0cm9rZSA9IGJyYW5jaENvbG9yO1xuICAgICAgY29uc3QgZWRnZVdpZHRoID0gZWRnZVdpZHRoRm9yRGVwdGgoYXBwZWFyYW5jZSwgcG9zaXRpb24uZGVwdGgsIG1heERlcHRoKTtcbiAgICAgIC8vIFNldCBib3RoIHRoZSBTVkcgcHJlc2VudGF0aW9uIGF0dHJpYnV0ZSBhbmQgYW4gaW5saW5lIENTUyB2YXJpYWJsZS5cbiAgICAgIC8vIFRoaXMgcHJldmVudHMgY29tbXVuaXR5LXRoZW1lIHJ1bGVzIGZyb20gZm9yY2luZyBldmVyeSBlZGdlIGJhY2sgdG9cbiAgICAgIC8vIHRoZSBzYW1lIHdpZHRoLlxuICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgU3RyaW5nKGVkZ2VXaWR0aCkpO1xuICAgICAgcGF0aC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLWN1cnJlbnQtZWRnZS13aWR0aFwiLCBgJHtlZGdlV2lkdGh9cHhgKTtcbiAgICAgIHBhdGguc3R5bGUuc2V0UHJvcGVydHkoXCJzdHJva2Utd2lkdGhcIiwgYCR7ZWRnZVdpZHRofXB4YCwgXCJpbXBvcnRhbnRcIik7XG4gICAgICB0aGlzLmVkZ2VzU3ZnLmFwcGVuZENoaWxkKHBhdGgpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgcG9zaXRpb24gb2YgdGhpcy5sYXlvdXQubm9kZXMpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBwb3NpdGlvbi5ub2RlO1xuICAgICAgY29uc3Qgc2hhcGUgPSBub2RlLnN0eWxlPy5zaGFwZSA/PyB0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZTtcbiAgICAgIGNvbnN0IGNsYXNzZXMgPSBbXCJtbWMtbm9kZVwiLCBwb3NpdGlvbi5kZXB0aCA9PT0gMCA/IFwiaXMtcm9vdFwiIDogXCJcIiwgYHNoYXBlLSR7c2hhcGV9YF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCIgXCIpO1xuICAgICAgY29uc3Qgbm9kZUVsID0gdGhpcy5ub2Rlc0xheWVyRWwuY3JlYXRlRGl2KHsgY2xzOiBjbGFzc2VzIH0pO1xuICAgICAgbm9kZUVsLmRhdGFzZXQubm9kZUlkID0gbm9kZS5pZDtcbiAgICAgIG5vZGVFbC5zdHlsZS5sZWZ0ID0gYCR7cG9zaXRpb24ueH1weGA7XG4gICAgICBub2RlRWwuc3R5bGUudG9wID0gYCR7cG9zaXRpb24ueX1weGA7XG4gICAgICBub2RlRWwuc3R5bGUud2lkdGggPSBgJHtwb3NpdGlvbi53aWR0aH1weGA7XG4gICAgICBub2RlRWwuc3R5bGUubWluSGVpZ2h0ID0gYCR7cG9zaXRpb24uaGVpZ2h0fXB4YDtcbiAgICAgIG5vZGVFbC5kcmFnZ2FibGUgPSBwb3NpdGlvbi5kZXB0aCA+IDA7XG4gICAgICBpZiAodGhpcy5zZWxlY3RlZElkID09PSBub2RlLmlkKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1zZWxlY3RlZFwiKTtcbiAgICAgIGlmICh0aGlzLnNlYXJjaFF1ZXJ5ICYmIG5vZGVTZWFyY2hUZXh0KG5vZGUpLmluY2x1ZGVzKHRoaXMuc2VhcmNoUXVlcnkpKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1zZWFyY2gtbWF0Y2hcIik7XG4gICAgICBpZiAobm9kZS50YXNrKSBub2RlRWwuYWRkQ2xhc3MoYHRhc2stJHtub2RlLnRhc2t9YCk7XG4gICAgICBjb25zdCBpc1Jvb3QgPSBwb3NpdGlvbi5kZXB0aCA9PT0gMDtcbiAgICAgIGNvbnN0IGJvbGQgPSBub2RlLnN0eWxlPy5ib2xkID8/IGFwcGVhcmFuY2UuYm9sZCA/PyBmYWxzZTtcbiAgICAgIGNvbnN0IGl0YWxpYyA9IG5vZGUuc3R5bGU/Lml0YWxpYyA/PyBhcHBlYXJhbmNlLml0YWxpYyA/PyBmYWxzZTtcbiAgICAgIGNvbnN0IHVuZGVybGluZSA9IG5vZGUuc3R5bGU/LnVuZGVybGluZSA/PyBhcHBlYXJhbmNlLnVuZGVybGluZSA/PyBmYWxzZTtcbiAgICAgIGlmIChib2xkKSBub2RlRWwuYWRkQ2xhc3MoXCJpcy1ib2xkXCIpO1xuICAgICAgaWYgKGl0YWxpYykgbm9kZUVsLmFkZENsYXNzKFwiaXMtaXRhbGljXCIpO1xuICAgICAgaWYgKHVuZGVybGluZSkgbm9kZUVsLmFkZENsYXNzKFwiaXMtdW5kZXJsaW5lZFwiKTtcbiAgICAgIGlmIChub2RlLm5vdGUpIG5vZGVFbC5zZXRBdHRyKFwidGl0bGVcIiwgbm9kZS5ub3RlKTtcbiAgICAgIGNvbnN0IGJyYW5jaENvbG9yID0gYnJhbmNoQ29sb3JNYXAuZ2V0KG5vZGUuaWQpO1xuICAgICAgaWYgKG5vZGUuc3R5bGU/LmNvbG9yKSBub2RlRWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gbm9kZS5zdHlsZS5jb2xvcjtcbiAgICAgIGVsc2UgaWYgKGlzUm9vdCAmJiBhcHBlYXJhbmNlLnJvb3RDb2xvcikgbm9kZUVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGFwcGVhcmFuY2Uucm9vdENvbG9yO1xuICAgICAgZWxzZSBpZiAoIWlzUm9vdCAmJiBhcHBlYXJhbmNlLm5vZGVDb2xvcikgbm9kZUVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGFwcGVhcmFuY2Uubm9kZUNvbG9yO1xuICAgICAgaWYgKG5vZGUuc3R5bGU/LnRleHRDb2xvcikgbm9kZUVsLnN0eWxlLmNvbG9yID0gbm9kZS5zdHlsZS50ZXh0Q29sb3I7XG4gICAgICBlbHNlIGlmIChpc1Jvb3QgJiYgYXBwZWFyYW5jZS5yb290VGV4dENvbG9yKSBub2RlRWwuc3R5bGUuY29sb3IgPSBhcHBlYXJhbmNlLnJvb3RUZXh0Q29sb3I7XG4gICAgICBlbHNlIGlmICghaXNSb290ICYmIGFwcGVhcmFuY2UudGV4dENvbG9yKSBub2RlRWwuc3R5bGUuY29sb3IgPSBhcHBlYXJhbmNlLnRleHRDb2xvcjtcbiAgICAgIGlmIChub2RlLnN0eWxlPy5ib3JkZXJDb2xvcikgbm9kZUVsLnN0eWxlLmJvcmRlckNvbG9yID0gbm9kZS5zdHlsZS5ib3JkZXJDb2xvcjtcbiAgICAgIGVsc2UgaWYgKCFpc1Jvb3QgJiYgYnJhbmNoQ29sb3IpIG5vZGVFbC5zdHlsZS5ib3JkZXJDb2xvciA9IGJyYW5jaENvbG9yO1xuICAgICAgZWxzZSBpZiAoIWlzUm9vdCAmJiBhcHBlYXJhbmNlLm5vZGVCb3JkZXJDb2xvcikgbm9kZUVsLnN0eWxlLmJvcmRlckNvbG9yID0gYXBwZWFyYW5jZS5ub2RlQm9yZGVyQ29sb3I7XG4gICAgICBub2RlRWwuc3R5bGUuYm9yZGVyV2lkdGggPSBgJHtub2RlLnN0eWxlPy5ib3JkZXJXaWR0aCA/PyBhcHBlYXJhbmNlLm5vZGVCb3JkZXJXaWR0aCA/PyAoaXNSb290ID8gMiA6IDEpfXB4YDtcblxuICAgICAgY29uc3QgY29udGVudCA9IG5vZGVFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtY29udGVudFwiIH0pO1xuICAgICAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSk7XG4gICAgICBjb25zdCBoYXNUZXh0QmxvY2sgPSBibG9ja3Muc29tZSgoYmxvY2spID0+IGJsb2NrLnR5cGUgPT09IFwidGV4dFwiICYmIGJsb2NrLnRleHQudHJpbSgpKTtcbiAgICAgIGlmICgobm9kZS50YXNrIHx8IG5vZGUuaWNvbikgJiYgIWhhc1RleHRCbG9jaykge1xuICAgICAgICBjb25zdCBtZXRhID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtbWFpbiBtbWMtbm9kZS1tZXRhLW9ubHlcIiB9KTtcbiAgICAgICAgaWYgKG5vZGUudGFzaykge1xuICAgICAgICAgIGNvbnN0IHRhc2sgPSBtZXRhLmNyZWF0ZVNwYW4oeyBjbHM6IGBtbWMtdGFzay1pY29uIHRhc2stJHtub2RlLnRhc2t9YCwgdGV4dDogbm9kZS50YXNrID09PSBcImRvbmVcIiA/IFwiXHUyNzEzXCIgOiBub2RlLnRhc2sgPT09IFwiZG9pbmdcIiA/IFwiXHUyNUQwXCIgOiBcIlx1MjVDQlwiIH0pO1xuICAgICAgICAgIHRhc2suc2V0QXR0cihcImFyaWEtbGFiZWxcIiwgbm9kZS50YXNrID09PSBcImRvbmVcIiA/IFwiXHU1REYyXHU1QjhDXHU2MjEwXCIgOiBub2RlLnRhc2sgPT09IFwiZG9pbmdcIiA/IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIgOiBcIlx1NUY4NVx1NTI5RVwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5pY29uKSBtZXRhLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLW5vZGUtaWNvblwiLCB0ZXh0OiBub2RlLmljb24gfSk7XG4gICAgICB9XG4gICAgICBsZXQgcHJlZml4UmVuZGVyZWQgPSBmYWxzZTtcbiAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICAgIGlmIChibG9jay50eXBlID09PSBcImltYWdlXCIpIHtcbiAgICAgICAgICBjb25zdCB3cmFwID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtaW1hZ2UtYmxvY2tcIiB9KTtcbiAgICAgICAgICBjb25zdCBpbWFnZSA9IHdyYXAuY3JlYXRlRWwoXCJpbWdcIiwgeyBjbHM6IFwibW1jLW5vZGUtaW1hZ2UgaXMtbG9hZGluZ1wiLCBhdHRyOiB7IGFsdDogYmxvY2suYWx0ID8/IChub2RlUGxhaW5UZXh0KG5vZGUpIHx8IFwiXHU1NkZFXHU3MjQ3XCIpIH0gfSk7XG4gICAgICAgICAgY29uc3QgY2FuZGlkYXRlcyA9IHRoaXMub3B0aW9ucy5pbWFnZUZhaWxvdmVyRW5hYmxlZFxuICAgICAgICAgICAgPyBpbWFnZVNvdXJjZUNhbmRpZGF0ZXMoYmxvY2ssIHRoaXMub3B0aW9ucy5pbWFnZUZhaWxvdmVyVXNlTG9jYWxGYWxsYmFjaylcbiAgICAgICAgICAgIDogaW1hZ2VTb3VyY2VDYW5kaWRhdGVzKGJsb2NrLCBmYWxzZSkuc2xpY2UoMCwgMSk7XG4gICAgICAgICAgbGV0IGFjdGl2ZVJlc29sdmVkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICBsZXQgYXR0ZW1wdFRva2VuID0gMDtcbiAgICAgICAgICBsZXQgYXR0ZW1wdFRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICBjb25zdCBjbGVhckF0dGVtcHRUaW1lciA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChhdHRlbXB0VGltZXIgPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoYXR0ZW1wdFRpbWVyKTtcbiAgICAgICAgICAgIHRoaXMuaW1hZ2VMb2FkVGltZXJzLmRlbGV0ZShhdHRlbXB0VGltZXIpO1xuICAgICAgICAgICAgYXR0ZW1wdFRpbWVyID0gbnVsbDtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IG1hcmtSZW1vdGVGYWlsdXJlID0gKHNvdXJjZTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZW1vdGUgPSBibG9jay5yZW1vdGVTb3VyY2VzPy5maW5kKChpdGVtKSA9PiBpdGVtLnVybCA9PT0gc291cmNlKTtcbiAgICAgICAgICAgIGlmICghcmVtb3RlKSByZXR1cm47XG4gICAgICAgICAgICByZW1vdGUubGFzdEZhaWx1cmVBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgIHJlbW90ZS5mYWlsdXJlQ291bnQgPSBNYXRoLm1pbigxMDAwMDAwLCAocmVtb3RlLmZhaWx1cmVDb3VudCA/PyAwKSArIDEpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3QgdHJ5Q2FuZGlkYXRlID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGNsZWFyQXR0ZW1wdFRpbWVyKCk7XG4gICAgICAgICAgICBjb25zdCBjYW5kaWRhdGUgPSBjYW5kaWRhdGVzW2luZGV4XTtcbiAgICAgICAgICAgIGF0dGVtcHRUb2tlbiArPSAxO1xuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSBhdHRlbXB0VG9rZW47XG4gICAgICAgICAgICBpZiAoIWNhbmRpZGF0ZSkge1xuICAgICAgICAgICAgICBhY3RpdmVSZXNvbHZlZCA9IG51bGw7XG4gICAgICAgICAgICAgIGltYWdlLnJlbW92ZUF0dHJpYnV0ZShcInNyY1wiKTtcbiAgICAgICAgICAgICAgaW1hZ2UucmVtb3ZlQ2xhc3MoXCJpcy1sb2FkaW5nXCIpO1xuICAgICAgICAgICAgICBpbWFnZS5hZGRDbGFzcyhcImlzLXVucmVzb2x2ZWRcIik7XG4gICAgICAgICAgICAgIGltYWdlLnNldEF0dHIoXCJ0aXRsZVwiLCBcIlx1NjI0MFx1NjcwOVx1NTZGRVx1NzI0N1x1OTU1Q1x1NTBDRlx1NTc0N1x1NEUwRFx1NTNFRlx1NzUyOFwiKTtcbiAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICAgICAgICAgICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlKGNhbmRpZGF0ZS5zb3VyY2UpO1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlZCkge1xuICAgICAgICAgICAgICBtYXJrUmVtb3RlRmFpbHVyZShjYW5kaWRhdGUuc291cmNlKTtcbiAgICAgICAgICAgICAgdHJ5Q2FuZGlkYXRlKGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb2JlID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBjb25zdCBmYWlsID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICBpZiAodG9rZW4gIT09IGF0dGVtcHRUb2tlbikgcmV0dXJuO1xuICAgICAgICAgICAgICBjbGVhckF0dGVtcHRUaW1lcigpO1xuICAgICAgICAgICAgICBtYXJrUmVtb3RlRmFpbHVyZShjYW5kaWRhdGUuc291cmNlKTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbWFnZUZhaWxvdmVyRW5hYmxlZCkgdHJ5Q2FuZGlkYXRlKGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGltYWdlLnJlbW92ZUNsYXNzKFwiaXMtbG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICBpbWFnZS5hZGRDbGFzcyhcImlzLXVucmVzb2x2ZWRcIik7XG4gICAgICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cihcInRpdGxlXCIsIGBcdTU2RkVcdTcyNDdcdTUyQTBcdThGN0RcdTU5MzFcdThEMjVcdUZGMUEke2NhbmRpZGF0ZS5zb3VyY2V9YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwcm9iZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0b2tlbiAhPT0gYXR0ZW1wdFRva2VuIHx8IHByb2JlLm5hdHVyYWxXaWR0aCA8PSAwKSByZXR1cm47XG4gICAgICAgICAgICAgIGNsZWFyQXR0ZW1wdFRpbWVyKCk7XG4gICAgICAgICAgICAgIGFjdGl2ZVJlc29sdmVkID0gcmVzb2x2ZWQ7XG4gICAgICAgICAgICAgIGltYWdlLnNyYyA9IHJlc29sdmVkO1xuICAgICAgICAgICAgICBpbWFnZS5yZW1vdmVDbGFzcyhcImlzLWxvYWRpbmdcIik7XG4gICAgICAgICAgICAgIGltYWdlLnJlbW92ZUNsYXNzKFwiaXMtdW5yZXNvbHZlZFwiKTtcbiAgICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cihcInRpdGxlXCIsIGluZGV4ID09PSAwID8gXCJcdTcwQjlcdTUxRkJcdTY1M0VcdTU5MjdcdTU2RkVcdTcyNDdcIiA6IGBcdTVERjJcdTgxRUFcdTUyQThcdTUyMDdcdTYzNjJcdTUyMzBcdUZGMUEke2NhbmRpZGF0ZS5sYWJlbH1gKTtcbiAgICAgICAgICAgICAgY29uc3Qgc3dpdGNoZWQgPSBjYW5kaWRhdGUuc291cmNlICE9PSBibG9jay5zb3VyY2U7XG4gICAgICAgICAgICAgIGNvbnN0IHJlbW90ZSA9IGJsb2NrLnJlbW90ZVNvdXJjZXM/LmZpbmQoKGl0ZW0pID0+IGl0ZW0udXJsID09PSBjYW5kaWRhdGUuc291cmNlKTtcbiAgICAgICAgICAgICAgaWYgKHJlbW90ZSkgcmVtb3RlLmxhc3RTdWNjZXNzQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgICAgIGlmICghc3dpdGNoZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgY29uc3QgcHJldmlvdXMgPSBibG9jay5yZW1vdGVTb3VyY2VzPy5maW5kKChpdGVtKSA9PiBpdGVtLnVybCA9PT0gYmxvY2suc291cmNlKTtcbiAgICAgICAgICAgICAgYmxvY2suc291cmNlID0gY2FuZGlkYXRlLnNvdXJjZTtcbiAgICAgICAgICAgICAgc3luY05vZGVMZWdhY3lGaWVsZHMobm9kZSk7XG4gICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgICAgICAgICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgICAgICAgICAgICBjb25zdCBwcmV2aW91c0xhYmVsID0gcHJldmlvdXM/Lmhvc3ROYW1lIHx8IFwiXHU1RjUzXHU1MjREXHU1NkZFXHU1RThBXCI7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoYFx1NTZGRVx1NzI0N1x1NTczMFx1NTc0MFx1NTkzMVx1NjU0OFx1RkYwQ1x1NURGMlx1NEVDRSAke3ByZXZpb3VzTGFiZWx9IFx1ODFFQVx1NTJBOFx1NTIwN1x1NjM2Mlx1NTIzMCAke2NhbmRpZGF0ZS5sYWJlbH1gLCA2MDAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwcm9iZS5vbmVycm9yID0gZmFpbDtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXRNcyA9IE1hdGgubWF4KDIsIE1hdGgubWluKDMwLCB0aGlzLm9wdGlvbnMuaW1hZ2VGYWlsb3ZlclRpbWVvdXRTZWNvbmRzKSkgKiAxMDAwO1xuICAgICAgICAgICAgYXR0ZW1wdFRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoZmFpbCwgdGltZW91dE1zKTtcbiAgICAgICAgICAgIHRoaXMuaW1hZ2VMb2FkVGltZXJzLmFkZChhdHRlbXB0VGltZXIpO1xuICAgICAgICAgICAgcHJvYmUuc3JjID0gcmVzb2x2ZWQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVSZXNvbHZlZCkgbmV3IEltYWdlUHJldmlld01vZGFsKHRoaXMuYXBwLCBhY3RpdmVSZXNvbHZlZCwgYmxvY2suYWx0ID8/IFwiXHU1NkZFXHU3MjQ3XHU5ODg0XHU4OUM4XCIpLm9wZW4oKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0cnlDYW5kaWRhdGUoMCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFibG9jay50ZXh0LnRyaW0oKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IG1haW4gPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS1tYWluIG1tYy1ub2RlLXRleHQtYmxvY2tcIiB9KTtcbiAgICAgICAgaWYgKCFwcmVmaXhSZW5kZXJlZCAmJiBub2RlLnRhc2spIHtcbiAgICAgICAgICBjb25zdCB0YXNrID0gbWFpbi5jcmVhdGVTcGFuKHsgY2xzOiBgbW1jLXRhc2staWNvbiB0YXNrLSR7bm9kZS50YXNrfWAsIHRleHQ6IG5vZGUudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1MjcxM1wiIDogbm9kZS50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1MjVEMFwiIDogXCJcdTI1Q0JcIiB9KTtcbiAgICAgICAgICB0YXNrLnNldEF0dHIoXCJhcmlhLWxhYmVsXCIsIG5vZGUudGFzayA9PT0gXCJkb25lXCIgPyBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIDogbm9kZS50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiIDogXCJcdTVGODVcdTUyOUVcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwcmVmaXhSZW5kZXJlZCAmJiBub2RlLmljb24pIG1haW4uY3JlYXRlU3Bhbih7IGNsczogXCJtbWMtbm9kZS1pY29uXCIsIHRleHQ6IG5vZGUuaWNvbiB9KTtcbiAgICAgICAgcHJlZml4UmVuZGVyZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCB0ZXh0RWwgPSBtYWluLmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS10ZXh0XCIgfSk7XG4gICAgICAgIHJlbmRlclJpY2hUZXh0UnVucyh0ZXh0RWwsIGJsb2NrLnJpY2hUZXh0LCBibG9jay50ZXh0KTtcbiAgICAgICAgdGV4dEVsLnN0eWxlLmZvbnRTaXplID0gYCR7bm9kZS5zdHlsZT8uZm9udFNpemUgPz8gYXBwZWFyYW5jZS5mb250U2l6ZSA/PyAxNH1weGA7XG4gICAgICAgIHRleHRFbC5zZXRBdHRyKFwiYXJpYS1sYWJlbFwiLCBibG9jay50ZXh0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUuc3VibWFwKSB7XG4gICAgICAgIGNvbnN0IHN1Ym1hcEJ1dHRvbiA9IGNvbnRlbnQuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLXN1Ym1hcC1jYXJkXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGBcdThGREJcdTUxNjVcdTVCNTBcdTVCRkNcdTU2RkUgJHtub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRofWAgfSB9KTtcbiAgICAgICAgc2V0SWNvbihzdWJtYXBCdXR0b24sIFwibmV0d29ya1wiKTtcbiAgICAgICAgc3VibWFwQnV0dG9uLmNyZWF0ZVNwYW4oeyB0ZXh0OiBub2RlLnN1Ym1hcC50aXRsZSA/PyBub2RlLnN1Ym1hcC5wYXRoLnNwbGl0KFwiL1wiKS5hdCgtMSk/LnJlcGxhY2UoL1xcLm1pbmRtYXAkL2ksIFwiXCIpID8/IFwiXHU1QjUwXHU1QkZDXHU1NkZFXCIgfSk7XG4gICAgICAgIHN1Ym1hcEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdm9pZCB0aGlzLmNhbGxiYWNrcy5vbk9wZW5NaW5kTWFwKG5vZGUuc3VibWFwIS5wYXRoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChub2RlLnRhYmxlKSB0aGlzLnJlbmRlck5vZGVUYWJsZShjb250ZW50LCBub2RlKTtcbiAgICAgIGlmIChub2RlLmNvZGUpIHRoaXMucmVuZGVyTm9kZUNvZGUoY29udGVudCwgbm9kZSk7XG5cbiAgICAgIGlmIChub2RlLnRhZ3M/Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCB0YWdzID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW5vZGUtdGFnc1wiIH0pO1xuICAgICAgICBub2RlLnRhZ3Muc2xpY2UoMCwgNCkuZm9yRWFjaCgodGFnKSA9PiB0YWdzLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1jLW5vZGUtdGFnXCIsIHRleHQ6IGAjJHt0YWd9YCB9KSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd1Rhc2tQcm9ncmVzcyAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBwcm9ncmVzcyA9IGdldFRhc2tQcm9ncmVzcyhub2RlKTtcbiAgICAgICAgaWYgKHByb2dyZXNzLnRvdGFsKSB7XG4gICAgICAgICAgY29uc3QgcGVyY2VudCA9IE1hdGgucm91bmQoKHByb2dyZXNzLmRvbmUgLyBwcm9ncmVzcy50b3RhbCkgKiAxMDApO1xuICAgICAgICAgIGNvbnN0IHByb2dyZXNzRWwgPSBub2RlRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YXNrLXByb2dyZXNzXCIsIGF0dHI6IHsgdGl0bGU6IGAke3Byb2dyZXNzLmRvbmV9LyR7cHJvZ3Jlc3MudG90YWx9IFx1NEUyQVx1NEVGQlx1NTJBMVx1NURGMlx1NUI4Q1x1NjIxMGAgfSB9KTtcbiAgICAgICAgICBwcm9ncmVzc0VsLmNyZWF0ZURpdih7IGNsczogXCJtbWMtdGFzay1wcm9ncmVzcy1iYXJcIiwgYXR0cjogeyBzdHlsZTogYHdpZHRoOiR7cGVyY2VudH0lYCB9IH0pO1xuICAgICAgICAgIHByb2dyZXNzRWwuY3JlYXRlU3Bhbih7IHRleHQ6IGAke3BlcmNlbnR9JWAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGZvbGQgPSBub2RlRWwuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW1jLWZvbGQtYnV0dG9uXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IG5vZGUuY29sbGFwc2VkID8gXCJcdTVDNTVcdTVGMDBcIiA6IFwiXHU2NTM2XHU4RDc3XCIgfSB9KTtcbiAgICAgICAgZm9sZC5zZXRUZXh0KG5vZGUuY29sbGFwc2VkID8gYCske25vZGUuY2hpbGRyZW4ubGVuZ3RofWAgOiBcIlx1MjIxMlwiKTtcbiAgICAgICAgZm9sZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpO1xuICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGFwc2UoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxpbmsgPSB0aGlzLmdldE5vZGVMaW5rKG5vZGUpO1xuICAgICAgaWYgKGxpbmspIHtcbiAgICAgICAgY29uc3QgbGlua0J1dHRvbiA9IG5vZGVFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbWMtbm9kZS1saW5rXCIsIGF0dHI6IHsgXCJhcmlhLWxhYmVsXCI6IGBcdTYyNTNcdTVGMDAgJHtsaW5rfWAgfSB9KTtcbiAgICAgICAgc2V0SWNvbihsaW5rQnV0dG9uLCBcImV4dGVybmFsLWxpbmtcIik7XG4gICAgICAgIGxpbmtCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTGluayhsaW5rKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgIHRoaXMuZWRpdFNlbGVjdGVkKCk7XG4gICAgICB9KTtcbiAgICAgIG5vZGVFbC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGUobm9kZS5pZCk7XG4gICAgICAgIHRoaXMub3BlbkNvbnRleHRNZW51KGV2ZW50KTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuZHJhZ2dpbmdJZCA9IG5vZGUuaWQ7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlcj8uc2V0RGF0YShcInRleHQvcGxhaW5cIiwgbm9kZS5pZCk7XG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XG4gICAgICAgIG5vZGVFbC5hZGRDbGFzcyhcImlzLWRyYWdnaW5nXCIpO1xuICAgICAgfSk7XG4gICAgICBub2RlRWwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuY2FuUmVwYXJlbnQodGhpcy5kcmFnZ2luZ0lkLCBub2RlLmlkKSkgcmV0dXJuO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgICAgICBub2RlRWwuYWRkQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKCkgPT4gbm9kZUVsLnJlbW92ZUNsYXNzKFwiaXMtZHJvcC10YXJnZXRcIikpO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBub2RlRWwucmVtb3ZlQ2xhc3MoXCJpcy1kcm9wLXRhcmdldFwiKTtcbiAgICAgICAgY29uc3QgZHJhZ2dlZElkID0gdGhpcy5kcmFnZ2luZ0lkID8/IGV2ZW50LmRhdGFUcmFuc2Zlcj8uZ2V0RGF0YShcInRleHQvcGxhaW5cIikgPz8gbnVsbDtcbiAgICAgICAgaWYgKGRyYWdnZWRJZCkgdGhpcy5yZXBhcmVudE5vZGUoZHJhZ2dlZElkLCBub2RlLmlkKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZUVsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5kcmFnZ2luZ0lkID0gbnVsbDtcbiAgICAgICAgdGhpcy5ub2Rlc0xheWVyRWwucXVlcnlTZWxlY3RvckFsbChcIi5pcy1kcmFnZ2luZywgLmlzLWRyb3AtdGFyZ2V0XCIpLmZvckVhY2goKGVsZW1lbnQpID0+IGVsZW1lbnQucmVtb3ZlQ2xhc3NlcyhbXCJpcy1kcmFnZ2luZ1wiLCBcImlzLWRyb3AtdGFyZ2V0XCJdKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVRyYW5zZm9ybSgpOiB2b2lkIHtcbiAgICBjb25zdCByZWN0ID0gdGhpcy52aWV3cG9ydEVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHRoaXMuc2NlbmVFbC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7cmVjdC53aWR0aCAvIDIgKyB0aGlzLnBhblh9cHgsICR7cmVjdC5oZWlnaHQgLyAyICsgdGhpcy5wYW5ZfXB4KSBzY2FsZSgke3RoaXMuem9vbX0pYDtcbiAgICB0aGlzLnJvb3RFbC5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbW1jLXpvb21cIiwgU3RyaW5nKHRoaXMuem9vbSkpO1xuICAgIHRoaXMuem9vbVN0YXR1c0VsPy5zZXRUZXh0KGAke01hdGgucm91bmQodGhpcy56b29tICogMTAwKX0lYCk7XG4gIH1cblxuICBwcml2YXRlIHNlbGVjdE5vZGUoaWQ6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSBpZCA/PyBcIlwiO1xuICAgIHRoaXMubm9kZXNMYXllckVsLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubW1jLW5vZGUuaXMtc2VsZWN0ZWRcIikuZm9yRWFjaCgoZWxlbWVudCkgPT4gZWxlbWVudC5yZW1vdmVDbGFzcyhcImlzLXNlbGVjdGVkXCIpKTtcbiAgICBpZiAoaWQpIHRoaXMubm9kZXNMYXllckVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KGAubW1jLW5vZGVbZGF0YS1ub2RlLWlkPVwiJHtDU1MuZXNjYXBlKGlkKX1cIl1gKT8uYWRkQ2xhc3MoXCJpcy1zZWxlY3RlZFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgc2VsZWN0ZWROb2RlKCk6IE1pbmRNYXBOb2RlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRJZCA/IGZpbmROb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgdGhpcy5zZWxlY3RlZElkKSA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvbmZpZ3VyZWROb2RlKHRleHQgPSBcIlx1NjVCMFx1ODI4Mlx1NzBCOVwiKTogTWluZE1hcE5vZGUge1xuICAgIGNvbnN0IG5vZGUgPSBjcmVhdGVOb2RlKHRleHQpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSAhPT0gXCJyb3VuZGVkXCIpIG5vZGUuc3R5bGUgPSB7IHNoYXBlOiB0aGlzLm9wdGlvbnMuZGVmYXVsdE5vZGVTaGFwZSB9O1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRDaGlsZCgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWROb2RlKCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gbm9kZS5pZDtcbiAgICB9KTtcbiAgICB0aGlzLmVkaXRTZWxlY3RlZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRTaWJsaW5nKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8IHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyZWROb2RlKCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZCkgPT4gY2hpbGQuaWQgPT09IHNlbGVjdGVkLmlkKTtcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXggKyAxLCAwLCBub2RlKTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IG5vZGUuaWQ7XG4gICAgfSk7XG4gICAgdGhpcy5lZGl0U2VsZWN0ZWQoKTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdFNlbGVjdGVkKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkKSByZXR1cm47XG4gICAgbGV0IGhpc3RvcnlDYXB0dXJlZCA9IGZhbHNlO1xuICAgIG5ldyBOb2RlRWRpdE1vZGFsKHRoaXMuYXBwLCBzZWxlY3RlZCwgdGhpcy5vcHRpb25zLmRlZmF1bHROb2RlU2hhcGUsIHtcbiAgICAgIHJlc29sdmVJbWFnZTogdGhpcy5jYWxsYmFja3MucmVzb2x2ZUltYWdlLFxuICAgICAgb25TYXZlUGFzdGVkSW1hZ2U6IHRoaXMuY2FsbGJhY2tzLm9uU2F2ZVBhc3RlZEltYWdlLFxuICAgICAgZ2V0SW1hZ2VIb3N0czogdGhpcy5jYWxsYmFja3MuZ2V0SW1hZ2VIb3N0cyxcbiAgICAgIGdldERlZmF1bHRVcGxvYWRIb3N0SWRzOiB0aGlzLmNhbGxiYWNrcy5nZXREZWZhdWx0VXBsb2FkSG9zdElkcyxcbiAgICAgIG9uVXBsb2FkSW1hZ2U6IHRoaXMuY2FsbGJhY2tzLm9uVXBsb2FkSW1hZ2UsXG4gICAgICBvblJlYWRJbWFnZVNvdXJjZTogdGhpcy5jYWxsYmFja3Mub25SZWFkSW1hZ2VTb3VyY2VcbiAgICB9LCAodmFsdWVzKSA9PiB7XG4gICAgICAvLyBBIGNvbnRpbnVvdXNseSBvcGVuIGVkaXRvciBtYXkgYXV0b3NhdmUgbWFueSB0aW1lcy4gQ2FwdHVyZSBvbmUgdW5kb1xuICAgICAgLy8gc25hcHNob3QgZm9yIHRoZSB3aG9sZSBlZGl0aW5nIHNlc3Npb24gaW5zdGVhZCBvZiBvbmUgc25hcHNob3QgcGVyIGtleXByZXNzLlxuICAgICAgaWYgKCFoaXN0b3J5Q2FwdHVyZWQpIHtcbiAgICAgICAgdGhpcy5oaXN0b3J5LnB1c2goSlNPTi5zdHJpbmdpZnkodGhpcy5kb2N1bWVudCkpO1xuICAgICAgICB0aGlzLnRyaW1IaXN0b3J5KCk7XG4gICAgICAgIHRoaXMuZnV0dXJlID0gW107XG4gICAgICAgIGhpc3RvcnlDYXB0dXJlZCA9IHRydWU7XG4gICAgICB9XG4gICAgICBzZWxlY3RlZC5jb250ZW50ID0gdmFsdWVzLmNvbnRlbnQ7XG4gICAgICBzeW5jTm9kZUxlZ2FjeUZpZWxkcyhzZWxlY3RlZCk7XG4gICAgICBzZWxlY3RlZC5ub3RlID0gdmFsdWVzLm5vdGUgfHwgdW5kZWZpbmVkO1xuICAgICAgc2VsZWN0ZWQubGluayA9IHZhbHVlcy5saW5rIHx8IHVuZGVmaW5lZDtcbiAgICAgIHNlbGVjdGVkLmljb24gPSB2YWx1ZXMuaWNvbiB8fCB1bmRlZmluZWQ7XG4gICAgICBzZWxlY3RlZC50YWdzID0gdmFsdWVzLnRhZ3MubGVuZ3RoID8gdmFsdWVzLnRhZ3MgOiB1bmRlZmluZWQ7XG4gICAgICBzZWxlY3RlZC50YXNrID0gdmFsdWVzLnRhc2s7XG4gICAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgICAgY29sb3I6IHZhbHVlcy5jb2xvcixcbiAgICAgICAgdGV4dENvbG9yOiB2YWx1ZXMudGV4dENvbG9yLFxuICAgICAgICBib3JkZXJDb2xvcjogdmFsdWVzLmJvcmRlckNvbG9yLFxuICAgICAgICBib3JkZXJXaWR0aDogdmFsdWVzLmJvcmRlcldpZHRoLFxuICAgICAgICBzaGFwZTogdmFsdWVzLnNoYXBlLFxuICAgICAgICBib2xkOiB2YWx1ZXMuYm9sZCxcbiAgICAgICAgaXRhbGljOiB2YWx1ZXMuaXRhbGljLFxuICAgICAgICB1bmRlcmxpbmU6IHZhbHVlcy51bmRlcmxpbmUsXG4gICAgICAgIGZvbnRTaXplOiB2YWx1ZXMuZm9udFNpemVcbiAgICAgIH07XG4gICAgICBzZWxlY3RlZC5zdHlsZSA9IE9iamVjdC52YWx1ZXMoc3R5bGUpLnNvbWUoKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSA/IHN0eWxlIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgICAgY29uc3QgdGl0bGUgPSBub2RlUGxhaW5UZXh0KHNlbGVjdGVkKTtcbiAgICAgICAgaWYgKHRpdGxlKSB0aGlzLmRvY3VtZW50LnRpdGxlID0gdGl0bGU7XG4gICAgICB9XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vbkNoYW5nZSh0aGlzLmdldERvY3VtZW50KCkpO1xuICAgICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgZGVsZXRlU2VsZWN0ZWQoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQgfHwgc2VsZWN0ZWQuaWQgPT09IHRoaXMuZG9jdW1lbnQucm9vdC5pZCkge1xuICAgICAgbmV3IE5vdGljZShcIlx1NjgzOVx1ODI4Mlx1NzBCOVx1NEUwRFx1ODBGRFx1NTIyMFx1OTY2NFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gZmluZFBhcmVudCh0aGlzLmRvY3VtZW50LnJvb3QsIHNlbGVjdGVkLmlkKTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICByZW1vdmVOb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gcGFyZW50Py5pZCA/PyB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZUNvbGxhcHNlKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8ICFzZWxlY3RlZC5jaGlsZHJlbi5sZW5ndGgpIHJldHVybjtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLmNvbGxhcHNlZCA9ICFzZWxlY3RlZC5jb2xsYXBzZWQ7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjeWNsZVRhc2soKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQpIHJldHVybjtcbiAgICBjb25zdCBuZXh0OiBSZWNvcmQ8c3RyaW5nLCBUYXNrU3RhdHVzIHwgdW5kZWZpbmVkPiA9IHsgXCJcIjogXCJ0b2RvXCIsIHRvZG86IFwiZG9pbmdcIiwgZG9pbmc6IFwiZG9uZVwiLCBkb25lOiB1bmRlZmluZWQgfTtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLnRhc2sgPSBuZXh0W3NlbGVjdGVkLnRhc2sgPz8gXCJcIl07IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB0b2dnbGVMYXlvdXQoKTogdm9pZCB7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4geyB0aGlzLmRvY3VtZW50LmxheW91dCA9IHRoaXMuZG9jdW1lbnQubGF5b3V0ID09PSBcInJpZ2h0XCIgPyBcImJhbGFuY2VkXCIgOiBcInJpZ2h0XCI7IH0pO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuZml0VG9WaWV3KCksIDIwKTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdEFwcGVhcmFuY2UoKTogdm9pZCB7XG4gICAgbmV3IEFwcGVhcmFuY2VNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5nZXRBcHBlYXJhbmNlKCksXG4gICAgICAoYXBwZWFyYW5jZSkgPT4gdGhpcy5tdXRhdGUoKCkgPT4geyB0aGlzLmRvY3VtZW50LmFwcGVhcmFuY2UgPSBhcHBlYXJhbmNlOyB9KSxcbiAgICAgICgpID0+IHRoaXMubXV0YXRlKCgpID0+IHsgdGhpcy5kb2N1bWVudC5hcHBlYXJhbmNlID0gdW5kZWZpbmVkOyB9KVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBlZGl0VGFibGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBuZXcgVGFibGVFZGl0TW9kYWwodGhpcy5hcHAsIHNlbGVjdGVkLnRhYmxlLCAodGFibGUpID0+IHtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQudGFibGUgPSB0YWJsZTsgfSk7XG4gICAgfSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb252ZXJ0Q2hpbGRyZW5Ub1RhYmxlKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgY29uc3QgdGFibGUgPSBjaGlsZHJlblRvVGFibGUoc2VsZWN0ZWQpO1xuICAgIGlmICghdGFibGUpIHsgbmV3IE5vdGljZShcIlx1NUY1M1x1NTI0RFx1ODI4Mlx1NzBCOVx1NkNBMVx1NjcwOVx1NTNFRlx1OEY2Q1x1NjM2Mlx1NzY4NFx1NUI1MFx1ODI4Mlx1NzBCOVwiKTsgcmV0dXJuOyB9XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQudGFibGUgPSB0YWJsZTtcbiAgICAgIHNlbGVjdGVkLmNvbGxhcHNlZCA9IHRydWU7XG4gICAgfSk7XG4gICAgbmV3IE5vdGljZShcIlx1NURGMlx1NzUxRlx1NjIxMFx1NUI1MFx1ODI4Mlx1NzBCOVx1ODg2OFx1NjgzQ1x1RkYxQlx1NTM5Rlx1NUI1MFx1ODI4Mlx1NzBCOVx1NURGMlx1NEZERFx1NzU1OVx1NUU3Nlx1NjUzNlx1OEQ3N1wiKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlVGFibGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQ/LnRhYmxlKSByZXR1cm47XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQudGFibGUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoc2VsZWN0ZWQuY2hpbGRyZW4ubGVuZ3RoKSBzZWxlY3RlZC5jb2xsYXBzZWQgPSBmYWxzZTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZWRpdENvZGUoKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBuZXcgQ29kZUVkaXRNb2RhbCh0aGlzLmFwcCwgc2VsZWN0ZWQuY29kZSwgKGNvZGUpID0+IHtcbiAgICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29kZSA9IGNvZGU7IH0pO1xuICAgIH0pLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlQ29kZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZD8uY29kZSkgcmV0dXJuO1xuICAgIHRoaXMubXV0YXRlKCgpID0+IHsgc2VsZWN0ZWQuY29kZSA9IHVuZGVmaW5lZDsgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZU9yT3BlblN1Ym1hcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCkgPz8gdGhpcy5kb2N1bWVudC5yb290O1xuICAgIGlmIChzZWxlY3RlZC5zdWJtYXApIHtcbiAgICAgIGF3YWl0IHRoaXMuY2FsbGJhY2tzLm9uT3Blbk1pbmRNYXAoc2VsZWN0ZWQuc3VibWFwLnBhdGgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3VibWFwID0gYXdhaXQgdGhpcy5jYWxsYmFja3Mub25DcmVhdGVTdWJtYXAoc2VsZWN0ZWQpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5zdWJtYXAgPSBzdWJtYXA7IH0pO1xuICAgICAgYXdhaXQgdGhpcy5jYWxsYmFja3Mub25PcGVuTWluZE1hcChzdWJtYXAucGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJNaW5kTWFwIFN0dWRpbyBjcmVhdGUgc3VibWFwIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKFwiXHU1MjFCXHU1RUZBXHU1QjUwXHU1QkZDXHU1NkZFXHU1OTMxXHU4RDI1XCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTm9kZVRhYmxlKGNvbnRlbnQ6IEhUTUxFbGVtZW50LCBub2RlOiBNaW5kTWFwTm9kZSk6IHZvaWQge1xuICAgIGlmICghbm9kZS50YWJsZSkgcmV0dXJuO1xuICAgIGNvbnN0IHdyYXAgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJtbWMtbm9kZS10YWJsZS13cmFwXCIgfSk7XG4gICAgY29uc3QgdGFibGUgPSB3cmFwLmNyZWF0ZUVsKFwidGFibGVcIiwgeyBjbHM6IFwibW1jLW5vZGUtdGFibGVcIiB9KTtcbiAgICBjb25zdCBoZWFkID0gdGFibGUuY3JlYXRlRWwoXCJ0aGVhZFwiKS5jcmVhdGVFbChcInRyXCIpO1xuICAgIG5vZGUudGFibGUuaGVhZGVycy5mb3JFYWNoKChoZWFkZXIsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBjZWxsID0gaGVhZC5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogaGVhZGVyIHx8IGBcdTUyMTcgJHtpbmRleCArIDF9YCB9KTtcbiAgICAgIGNlbGwuc3R5bGUudGV4dEFsaWduID0gbm9kZS50YWJsZT8uYWxpZ25tZW50cz8uW2luZGV4XSA/PyBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCBib2R5ID0gdGFibGUuY3JlYXRlRWwoXCJ0Ym9keVwiKTtcbiAgICBub2RlLnRhYmxlLnJvd3MuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICBjb25zdCB0ciA9IGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICAgIG5vZGUudGFibGUhLmhlYWRlcnMuZm9yRWFjaCgoXywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHRyLmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiByb3dbaW5kZXhdID8/IFwiXCIgfSk7XG4gICAgICAgIGNlbGwuc3R5bGUudGV4dEFsaWduID0gbm9kZS50YWJsZT8uYWxpZ25tZW50cz8uW2luZGV4XSA/PyBcImxlZnRcIjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoZXZlbnQpID0+IGV2ZW50LnByZXZlbnREZWZhdWx0KCkpO1xuICAgIHdyYXAuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpOyB0aGlzLmVkaXRUYWJsZSgpOyB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTm9kZUNvZGUoY29udGVudDogSFRNTEVsZW1lbnQsIG5vZGU6IE1pbmRNYXBOb2RlKTogdm9pZCB7XG4gICAgaWYgKCFub2RlLmNvZGUpIHJldHVybjtcbiAgICBjb25zdCBibG9jayA9IGNvbnRlbnQuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2RlLWJsb2NrXCIgfSk7XG4gICAgY29uc3QgaGVhZGVyID0gYmxvY2suY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy1jb2RlLWhlYWRlclwiIH0pO1xuICAgIGhlYWRlci5jcmVhdGVTcGFuKHsgdGV4dDogbm9kZS5jb2RlLmxhbmd1YWdlIHx8IFwiY29kZVwiIH0pO1xuICAgIGNvbnN0IGNvcHkgPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiY2xpY2thYmxlLWljb25cIiwgYXR0cjogeyBcImFyaWEtbGFiZWxcIjogXCJcdTU5MERcdTUyMzZcdTRFRTNcdTc4MDFcIiB9IH0pO1xuICAgIHNldEljb24oY29weSwgXCJjb3B5XCIpO1xuICAgIGNvcHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KG5vZGUuY29kZSEuY29kZSkudGhlbigoKSA9PiBuZXcgTm90aWNlKFwiXHU0RUUzXHU3ODAxXHU1REYyXHU1OTBEXHU1MjM2XCIpKTtcbiAgICB9KTtcbiAgICBjb25zdCByZW5kZXJlZCA9IGJsb2NrLmNyZWF0ZURpdih7IGNsczogXCJtbWMtY29kZS1yZW5kZXJlZCBtYXJrZG93bi1yZW5kZXJlZFwiIH0pO1xuICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25SZW5kZXJDb2RlKG5vZGUuY29kZSwgcmVuZGVyZWQpO1xuICAgIGJsb2NrLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCAoZXZlbnQpID0+IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpKTtcbiAgICBibG9jay5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgYmxvY2suYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIChldmVudCkgPT4geyBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgdGhpcy5zZWxlY3ROb2RlKG5vZGUuaWQpOyB0aGlzLmVkaXRDb2RlKCk7IH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVQYXN0ZShldmVudDogQ2xpcGJvYXJkRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKHRhcmdldC5tYXRjaGVzKFwiaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QsIFtjb250ZW50ZWRpdGFibGU9J3RydWUnXVwiKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRhdGEgPSBldmVudC5jbGlwYm9hcmREYXRhO1xuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuICAgIGNvbnN0IGltYWdlSXRlbSA9IEFycmF5LmZyb20oZGF0YS5pdGVtcykuZmluZCgoaXRlbSkgPT4gaXRlbS5raW5kID09PSBcImZpbGVcIiAmJiBpdGVtLnR5cGUuc3RhcnRzV2l0aChcImltYWdlL1wiKSk7XG4gICAgaWYgKGltYWdlSXRlbSkge1xuICAgICAgY29uc3QgYmxvYiA9IGltYWdlSXRlbS5nZXRBc0ZpbGUoKTtcbiAgICAgIGlmICghYmxvYikgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBleHRlbnNpb24gPSBibG9iLnR5cGUuc3BsaXQoXCIvXCIpWzFdPy5yZXBsYWNlKFwianBlZ1wiLCBcImpwZ1wiKSB8fCBcInBuZ1wiO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGBtaW5kbWFwLWltYWdlLiR7ZXh0ZW5zaW9ufWA7XG4gICAgICAgIGNvbnN0IHBhdGggPSBhd2FpdCB0aGlzLmNhbGxiYWNrcy5vblNhdmVQYXN0ZWRJbWFnZShibG9iLCBmaWxlbmFtZSk7XG4gICAgICAgIGNvbnN0IGltYWdlQmxvY2s6IE1pbmRNYXBJbWFnZUNvbnRlbnRCbG9jayA9IHsgaWQ6IG5ld0lkKCksIHR5cGU6IFwiaW1hZ2VcIiwgc291cmNlOiBwYXRoLCBsb2NhbFNvdXJjZTogcGF0aCB9O1xuICAgICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYmxvY2tzID0gbm9kZUNvbnRlbnRCbG9ja3Moc2VsZWN0ZWQpO1xuICAgICAgICAgIGJsb2Nrcy5wdXNoKGltYWdlQmxvY2spO1xuICAgICAgICAgIHNlbGVjdGVkLmNvbnRlbnQgPSBibG9ja3M7XG4gICAgICAgICAgc3luY05vZGVMZWdhY3lGaWVsZHMoc2VsZWN0ZWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc2NoZWR1bGVkID0gdGhpcy5jYWxsYmFja3Mub25TY2hlZHVsZUF1dG9VcGxvYWQoc2VsZWN0ZWQuaWQsIGltYWdlQmxvY2suaWQsIHBhdGgsIGZpbGVuYW1lKTtcbiAgICAgICAgbmV3IE5vdGljZShzY2hlZHVsZWQgPyBgXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU1QjU4XHVGRjBDXHU3QjQ5XHU1Rjg1XHU4MUVBXHU1MkE4XHU0RTBBXHU0RjIwXHVGRjFBJHtwYXRofWAgOiBgXHU1NkZFXHU3MjQ3XHU1REYyXHU0RkREXHU1QjU4XHVGRjFBJHtwYXRofWApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk1pbmRNYXAgU3R1ZGlvIHBhc3RlIGltYWdlIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJcdTdDOThcdThEMzRcdTU2RkVcdTcyNDdcdTU5MzFcdThEMjVcIik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dCA9IGRhdGEuZ2V0RGF0YShcInRleHQvcGxhaW5cIik7XG4gICAgaWYgKCF0ZXh0LnRyaW0oKSkgcmV0dXJuO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKSA/PyB0aGlzLmRvY3VtZW50LnJvb3Q7XG4gICAgY29uc3QgdGFibGUgPSBwYXJzZU1hcmtkb3duVGFibGUodGV4dCk7XG4gICAgaWYgKHRhYmxlKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC50YWJsZSA9IHRhYmxlOyB9KTtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVERjJcdThCQzZcdTUyMkJcdTVFNzZcdTYzRDJcdTUxNjUgTWFya2Rvd24gXHU4ODY4XHU2ODNDXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjb2RlID0gcGFyc2VGZW5jZWRDb2RlKHRleHQpO1xuICAgIGlmIChjb2RlKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5tdXRhdGUoKCkgPT4geyBzZWxlY3RlZC5jb2RlID0gY29kZTsgfSk7XG4gICAgICBuZXcgTm90aWNlKGBcdTVERjJcdThCQzZcdTUyMkJcdTVFNzZcdTYzRDJcdTUxNjUke2NvZGUubGFuZ3VhZ2UgPyBgICR7Y29kZS5sYW5ndWFnZX1gIDogXCJcIn1cdTRFRTNcdTc4MDFgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYnJhbmNoID0gdGhpcy5wYXJzZUNsaXBib2FyZE5vZGUodGV4dCk7XG4gICAgaWYgKGJyYW5jaCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IGNsb25lID0gY2xvbmVOb2RlV2l0aEZyZXNoSWRzKGJyYW5jaCk7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiB7IHNlbGVjdGVkLmNvbGxhcHNlZCA9IGZhbHNlOyBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKGNsb25lKTsgdGhpcy5zZWxlY3RlZElkID0gY2xvbmUuaWQ7IH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb3BlblNlbGVjdGVkTGluaygpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgaWYgKCFzZWxlY3RlZCkgcmV0dXJuO1xuICAgIGNvbnN0IGxpbmsgPSB0aGlzLmdldE5vZGVMaW5rKHNlbGVjdGVkKTtcbiAgICBpZiAoIWxpbmspIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTVGNTNcdTUyNERcdTgyODJcdTcwQjlcdTZDQTFcdTY3MDlcdTk0RkVcdTYzQTVcdUZGMUJcdTUzRUZcdTYzMDkgRjIgXHU2REZCXHU1MkEwXHU5NEZFXHU2M0E1XHU2MjE2XHU1NzI4XHU2NTg3XHU1QjU3XHU0RTJEXHU1MTk5XHU1MTY1IFtbXHU3QjE0XHU4QkIwXHU1NDBEXV1cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZvaWQgdGhpcy5jYWxsYmFja3Mub25PcGVuTGluayhsaW5rKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Tm9kZUxpbmsobm9kZTogTWluZE1hcE5vZGUpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gbm9kZS5saW5rPy50cmltKCkgfHwgZXh0cmFjdEZpcnN0V2lraUxpbmsobm9kZVBsYWluVGV4dChub2RlKSkgfHwgZXh0cmFjdEZpcnN0V2lraUxpbmsobm9kZS5ub3RlID8/IFwiXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzaG93T3V0bGluZSgpOiB2b2lkIHtcbiAgICBjb25zdCBtYXJrZG93biA9IGRvY3VtZW50VG9NYXJrZG93bih0aGlzLmRvY3VtZW50KTtcbiAgICBuZXcgT3V0bGluZU1vZGFsKHRoaXMuYXBwLCBtYXJrZG93biwgKCkgPT4gdm9pZCB0aGlzLmNhbGxiYWNrcy5vbkV4cG9ydE1hcmtkb3duKG1hcmtkb3duKSkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBzaG93SnNvblRyYW5zZmVyKCk6IHZvaWQge1xuICAgIG5ldyBKc29uVHJhbnNmZXJNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgdGhpcy5nZXREb2N1bWVudCgpLFxuICAgICAgKGRvY3VtZW50KSA9PiB0aGlzLnJlcGxhY2VEb2N1bWVudChkb2N1bWVudCksXG4gICAgICAoanNvbikgPT4gdm9pZCB0aGlzLmNhbGxiYWNrcy5vbkV4cG9ydEpzb24oanNvbilcbiAgICApLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgb3BlblNlYXJjaCgpOiB2b2lkIHtcbiAgICBuZXcgU2VhcmNoTm9kZXNNb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgZmxhdHRlbk5vZGVzKHRoaXMuZG9jdW1lbnQucm9vdCksXG4gICAgICAocXVlcnkpID0+IHtcbiAgICAgICAgdGhpcy5zZWFyY2hRdWVyeSA9IHF1ZXJ5O1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSxcbiAgICAgIChub2RlKSA9PiB0aGlzLmZvY3VzTm9kZShub2RlLmlkKVxuICAgICkub3BlbigpO1xuICB9XG5cbiAgcHJpdmF0ZSBmb2N1c05vZGUoaWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGFuY2VzdG9ycyA9IGZpbmRBbmNlc3RvcnModGhpcy5kb2N1bWVudC5yb290LCBpZCk7XG4gICAgY29uc3QgY29sbGFwc2VkID0gYW5jZXN0b3JzLmZpbHRlcigobm9kZSkgPT4gbm9kZS5jb2xsYXBzZWQpO1xuICAgIGlmIChjb2xsYXBzZWQubGVuZ3RoKSB7XG4gICAgICB0aGlzLm11dGF0ZSgoKSA9PiBjb2xsYXBzZWQuZm9yRWFjaCgobm9kZSkgPT4geyBub2RlLmNvbGxhcHNlZCA9IGZhbHNlOyB9KSk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGlkO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5jZW50ZXJOb2RlKGlkKSwgMjApO1xuICB9XG5cbiAgcHJpdmF0ZSBjZW50ZXJOb2RlKGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMubGF5b3V0LmJ5SWQuZ2V0KGlkKTtcbiAgICBpZiAoIXBvc2l0aW9uKSByZXR1cm47XG4gICAgdGhpcy5wYW5YID0gLXBvc2l0aW9uLnggKiB0aGlzLnpvb207XG4gICAgdGhpcy5wYW5ZID0gLXBvc2l0aW9uLnkgKiB0aGlzLnpvb207XG4gICAgdGhpcy5hcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBvcGVuQ29udGV4dE1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWROb2RlKCk7XG4gICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU2REZCXHU1MkEwXHU1QjUwXHU4MjgyXHU3MEI5XCIpLnNldEljb24oXCJwbHVzLWNpcmNsZVwiKS5vbkNsaWNrKCgpID0+IHRoaXMuYWRkQ2hpbGQoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NkRGQlx1NTJBMFx1NTQwQ1x1N0VBN1x1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwibGlzdC1wbHVzXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5hZGRTaWJsaW5nKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTdGMTZcdThGOTFcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcInBlbmNpbFwiKS5vbkNsaWNrKCgpID0+IHRoaXMuZWRpdFNlbGVjdGVkKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcIikuc2V0SWNvbihcImNvcHktcGx1c1wiKS5vbkNsaWNrKCgpID0+IHRoaXMuZHVwbGljYXRlU2VsZWN0ZWQoKSkpO1xuICAgIG1lbnUuYWRkU2VwYXJhdG9yKCk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKHNlbGVjdGVkPy50YWJsZSA/IFwiXHU3RjE2XHU4RjkxXHU4ODY4XHU2ODNDXCIgOiBcIlx1NjNEMlx1NTE2NVx1ODg2OFx1NjgzQ1wiKS5zZXRJY29uKFwidGFibGUtMlwiKS5vbkNsaWNrKCgpID0+IHRoaXMuZWRpdFRhYmxlKCkpKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTVDMDZcdTVCNTBcdTgyODJcdTcwQjlcdTc1MUZcdTYyMTBcdTg4NjhcdTY4M0NcIikuc2V0SWNvbihcInRhYmxlLXByb3BlcnRpZXNcIikub25DbGljaygoKSA9PiB0aGlzLmNvbnZlcnRDaGlsZHJlblRvVGFibGUoKSkpO1xuICAgIGlmIChzZWxlY3RlZD8udGFibGUpIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NzlGQlx1OTY2NFx1ODg2OFx1NjgzQ1wiKS5zZXRJY29uKFwidGFibGUtMlwiKS5vbkNsaWNrKCgpID0+IHRoaXMucmVtb3ZlVGFibGUoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShzZWxlY3RlZD8uY29kZSA/IFwiXHU3RjE2XHU4RjkxXHU0RUUzXHU3ODAxXCIgOiBcIlx1NjNEMlx1NTE2NVx1NEVFM1x1NzgwMVwiKS5zZXRJY29uKFwiY29kZS0yXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5lZGl0Q29kZSgpKSk7XG4gICAgaWYgKHNlbGVjdGVkPy5jb2RlKSBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTc5RkJcdTk2NjRcdTRFRTNcdTc4MDFcIikuc2V0SWNvbihcImVyYXNlclwiKS5vbkNsaWNrKCgpID0+IHRoaXMucmVtb3ZlQ29kZSgpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKHNlbGVjdGVkPy5zdWJtYXAgPyBcIlx1OEZEQlx1NTE2NVx1NUI1MFx1NUJGQ1x1NTZGRVwiIDogXCJcdTUyMUJcdTVFRkFcdTVCNTBcdTVCRkNcdTU2RkVcIikuc2V0SWNvbihcIm5ldHdvcmtcIikub25DbGljaygoKSA9PiB2b2lkIHRoaXMuY3JlYXRlT3JPcGVuU3VibWFwKCkpKTtcbiAgICBtZW51LmFkZFNlcGFyYXRvcigpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NTkwRFx1NTIzNlx1NTIwNlx1NjUyRlwiKS5zZXRJY29uKFwiY29weVwiKS5vbkNsaWNrKCgpID0+IHZvaWQgdGhpcy5jb3B5U2VsZWN0ZWRCcmFuY2goKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1N0M5OFx1OEQzNFx1NEUzQVx1NUI1MFx1ODI4Mlx1NzBCOVwiKS5zZXRJY29uKFwiY2xpcGJvYXJkLXBhc3RlXCIpLm9uQ2xpY2soKCkgPT4gdm9pZCB0aGlzLnBhc3RlQXNDaGlsZCgpKSk7XG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoYFx1NEVGQlx1NTJBMVx1NzJCNlx1NjAwMVx1RkYxQSR7c2VsZWN0ZWQ/LnRhc2sgPT09IFwiZG9uZVwiID8gXCJcdTVERjJcdTVCOENcdTYyMTBcIiA6IHNlbGVjdGVkPy50YXNrID09PSBcImRvaW5nXCIgPyBcIlx1OEZEQlx1ODg0Q1x1NEUyRFwiIDogc2VsZWN0ZWQ/LnRhc2sgPT09IFwidG9kb1wiID8gXCJcdTVGODVcdTUyOUVcIiA6IFwiXHU2NUUwXCJ9YCkuc2V0SWNvbihcImNpcmNsZS1jaGVjay1iaWdcIikub25DbGljaygoKSA9PiB0aGlzLmN5Y2xlVGFzaygpKSk7XG4gICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiBpdGVtLnNldFRpdGxlKFwiXHU1QzU1XHU1RjAwL1x1NjUzNlx1OEQ3N1wiKS5zZXRJY29uKFwiZm9sZC12ZXJ0aWNhbFwiKS5vbkNsaWNrKCgpID0+IHRoaXMudG9nZ2xlQ29sbGFwc2UoKSkpO1xuICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4gaXRlbS5zZXRUaXRsZShcIlx1NjI1M1x1NUYwMFx1OTRGRVx1NjNBNVwiKS5zZXRJY29uKFwibGlua1wiKS5vbkNsaWNrKCgpID0+IHRoaXMub3BlblNlbGVjdGVkTGluaygpKSk7XG4gICAgbWVudS5hZGRTZXBhcmF0b3IoKTtcbiAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IGl0ZW0uc2V0VGl0bGUoXCJcdTUyMjBcdTk2NjRcdTgyODJcdTcwQjlcIikuc2V0SWNvbihcInRyYXNoLTJcIikub25DbGljaygoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkpKTtcbiAgICBtZW51LnNob3dBdE1vdXNlRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb3B5U2VsZWN0ZWRCcmFuY2goKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpO1xuICAgIGlmICghc2VsZWN0ZWQpIHJldHVybiBmYWxzZTtcbiAgICB0aGlzLmJyYW5jaENsaXBib2FyZCA9IGNsb25lRG9jdW1lbnQoeyB2ZXJzaW9uOiA5LCB0aXRsZTogbm9kZVBsYWluVGV4dChzZWxlY3RlZCkgfHwgXCJcdTU2RkVcdTcyNDdcdTgyODJcdTcwQjlcIiwgbGF5b3V0OiBcInJpZ2h0XCIsIHRoZW1lOiBcImF1dG9cIiwgcm9vdDogc2VsZWN0ZWQgfSkucm9vdDtcbiAgICBjb25zdCBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcIm1pbmRtYXAtc3R1ZGlvLW5vZGVcIiwgdmVyc2lvbjogMSwgbm9kZTogc2VsZWN0ZWQgfSwgbnVsbCwgMik7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHBheWxvYWQpO1xuICAgICAgbmV3IE5vdGljZShcIlx1NURGMlx1NTkwRFx1NTIzNlx1ODI4Mlx1NzBCOVx1NTIwNlx1NjUyRlwiKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdTgyODJcdTcwQjlcdTUyMDZcdTY1MkZcdTVERjJcdTU5MERcdTUyMzZcdTUyMzBcdTYzRDJcdTRFRjZcdTUxODVcdTkwRThcdTUyNkFcdThEMzRcdTY3N0ZcIik7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXN0ZUFzQ2hpbGQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBsZXQgc291cmNlTm9kZTogTWluZE1hcE5vZGUgfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQucmVhZFRleHQoKTtcbiAgICAgIGlmICh0ZXh0LnRyaW0oKSkgc291cmNlTm9kZSA9IHRoaXMucGFyc2VDbGlwYm9hcmROb2RlKHRleHQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gQnJvd3NlciBjbGlwYm9hcmQgcGVybWlzc2lvbiBjYW4gYmUgdW5hdmFpbGFibGU7IHVzZSBpbnRlcm5hbCBjbGlwYm9hcmQuXG4gICAgfVxuICAgIHNvdXJjZU5vZGUgPz89IHRoaXMuYnJhbmNoQ2xpcGJvYXJkO1xuICAgIGlmICghc291cmNlTm9kZSkge1xuICAgICAgbmV3IE5vdGljZShcIlx1NTI2QVx1OEQzNFx1Njc3Rlx1NEUyRFx1NkNBMVx1NjcwOVx1NTNFRlx1N0M5OFx1OEQzNFx1NzY4NCBNaW5kTWFwIFx1ODI4Mlx1NzBCOVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2xvbmUgPSBjbG9uZU5vZGVXaXRoRnJlc2hJZHMoc291cmNlTm9kZSk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgc2VsZWN0ZWQuY29sbGFwc2VkID0gZmFsc2U7XG4gICAgICBzZWxlY3RlZC5jaGlsZHJlbi5wdXNoKGNsb25lKTtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJZCA9IGNsb25lLmlkO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUNsaXBib2FyZE5vZGUodGV4dDogc3RyaW5nKTogTWluZE1hcE5vZGUgfCBudWxsIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZSh0ZXh0KSBhcyB7IHR5cGU/OiBzdHJpbmc7IG5vZGU/OiBQYXJ0aWFsPE1pbmRNYXBOb2RlPjsgcm9vdD86IFBhcnRpYWw8TWluZE1hcE5vZGU+OyB0ZXh0Pzogc3RyaW5nOyBjaGlsZHJlbj86IHVua25vd25bXSB9O1xuICAgICAgY29uc3QgaW5wdXQgPSAocGFyc2VkLnR5cGUgPT09IFwibWluZG1hcC1zdHVkaW8tbm9kZVwiIHx8IHBhcnNlZC50eXBlID09PSBcIm1tYy1saXRlLW5vZGVcIiB8fCBwYXJzZWQudHlwZSA9PT0gXCJzbW0tbGl0ZS1ub2RlXCIpICYmIHBhcnNlZC5ub2RlID8gcGFyc2VkLm5vZGUgOiBwYXJzZWQucm9vdCA/PyAodHlwZW9mIHBhcnNlZC50ZXh0ID09PSBcInN0cmluZ1wiICYmIEFycmF5LmlzQXJyYXkocGFyc2VkLmNoaWxkcmVuKSA/IHBhcnNlZCA6IG51bGwpO1xuICAgICAgaWYgKCFpbnB1dCkgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gbm9ybWFsaXplRG9jdW1lbnQoeyB0aXRsZTogaW5wdXQudGV4dCA/PyBcIlx1N0M5OFx1OEQzNFx1ODI4Mlx1NzBCOVwiLCByb290OiBpbnB1dCBhcyBNaW5kTWFwTm9kZSB9LCBpbnB1dC50ZXh0ID8/IFwiXHU3Qzk4XHU4RDM0XHU4MjgyXHU3MEI5XCIpLnJvb3Q7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGR1cGxpY2F0ZVNlbGVjdGVkKCk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gdGhpcy5zZWxlY3RlZE5vZGUoKTtcbiAgICBpZiAoIXNlbGVjdGVkIHx8IHNlbGVjdGVkLmlkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJcdThCRjdcdTkwMDlcdTYyRTlcdTk3NUVcdTY4MzlcdTgyODJcdTcwQjlcdTU0MEVcdTUxNEJcdTk2ODZcdTUyMDZcdTY1MkZcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudCA9IGZpbmRQYXJlbnQodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgaWYgKCFwYXJlbnQpIHJldHVybjtcbiAgICBjb25zdCBjbG9uZSA9IGNsb25lTm9kZVdpdGhGcmVzaElkcyhzZWxlY3RlZCk7XG4gICAgdGhpcy5tdXRhdGUoKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZCkgPT4gY2hpbGQuaWQgPT09IHNlbGVjdGVkLmlkKTtcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXggKyAxLCAwLCBjbG9uZSk7XG4gICAgICB0aGlzLnNlbGVjdGVkSWQgPSBjbG9uZS5pZDtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY2FuUmVwYXJlbnQoZHJhZ2dlZElkOiBzdHJpbmcgfCBudWxsLCB0YXJnZXRJZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCFkcmFnZ2VkSWQgfHwgZHJhZ2dlZElkID09PSB0aGlzLmRvY3VtZW50LnJvb3QuaWQgfHwgZHJhZ2dlZElkID09PSB0YXJnZXRJZCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGRyYWdnZWQgPSBmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGRyYWdnZWRJZCk7XG4gICAgcmV0dXJuIEJvb2xlYW4oZHJhZ2dlZCAmJiAhY29udGFpbnNOb2RlKGRyYWdnZWQsIHRhcmdldElkKSk7XG4gIH1cblxuICBwcml2YXRlIHJlcGFyZW50Tm9kZShkcmFnZ2VkSWQ6IHN0cmluZywgdGFyZ2V0SWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jYW5SZXBhcmVudChkcmFnZ2VkSWQsIHRhcmdldElkKSkgcmV0dXJuO1xuICAgIGNvbnN0IGRyYWdnZWQgPSBmaW5kTm9kZSh0aGlzLmRvY3VtZW50LnJvb3QsIGRyYWdnZWRJZCk7XG4gICAgY29uc3QgdGFyZ2V0ID0gZmluZE5vZGUodGhpcy5kb2N1bWVudC5yb290LCB0YXJnZXRJZCk7XG4gICAgaWYgKCFkcmFnZ2VkIHx8ICF0YXJnZXQpIHJldHVybjtcbiAgICB0aGlzLm11dGF0ZSgoKSA9PiB7XG4gICAgICByZW1vdmVOb2RlKHRoaXMuZG9jdW1lbnQucm9vdCwgZHJhZ2dlZElkKTtcbiAgICAgIHRhcmdldC5jaGlsZHJlbi5wdXNoKGRyYWdnZWQpO1xuICAgICAgdGFyZ2V0LmNvbGxhcHNlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZWxlY3RlZElkID0gZHJhZ2dlZElkO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZXBsYWNlRG9jdW1lbnQoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCk6IHZvaWQge1xuICAgIHRoaXMuaGlzdG9yeS5wdXNoKEpTT04uc3RyaW5naWZ5KHRoaXMuZG9jdW1lbnQpKTtcbiAgICB0aGlzLnRyaW1IaXN0b3J5KCk7XG4gICAgdGhpcy5mdXR1cmUgPSBbXTtcbiAgICB0aGlzLmRvY3VtZW50ID0gY2xvbmVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgdGhpcy5zZWxlY3RlZElkID0gdGhpcy5kb2N1bWVudC5yb290LmlkO1xuICAgIHRoaXMuY2FsbGJhY2tzLm9uQ2hhbmdlKHRoaXMuZ2V0RG9jdW1lbnQoKSk7XG4gICAgdGhpcy5tYXJrU2F2aW5nKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLmZpdFRvVmlldygpLCAyMCk7XG4gIH1cblxuICBwcml2YXRlIG11dGF0ZShhY3Rpb246ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy50cmltSGlzdG9yeSgpO1xuICAgIHRoaXMuZnV0dXJlID0gW107XG4gICAgYWN0aW9uKCk7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSB0cmltSGlzdG9yeSgpOiB2b2lkIHtcbiAgICBjb25zdCBsaW1pdCA9IE1hdGgubWF4KDEwLCBNYXRoLm1pbig1MDAsIHRoaXMub3B0aW9ucy5oaXN0b3J5TGltaXQpKTtcbiAgICB3aGlsZSAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+IGxpbWl0KSB0aGlzLmhpc3Rvcnkuc2hpZnQoKTtcbiAgfVxuXG4gIHByaXZhdGUgdW5kbygpOiB2b2lkIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuaGlzdG9yeS5wb3AoKTtcbiAgICBpZiAoIXByZXZpb3VzKSByZXR1cm47XG4gICAgdGhpcy5mdXR1cmUucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy5kb2N1bWVudCA9IEpTT04ucGFyc2UocHJldmlvdXMpIGFzIE1pbmRNYXBEb2N1bWVudDtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWRvKCk6IHZvaWQge1xuICAgIGNvbnN0IG5leHQgPSB0aGlzLmZ1dHVyZS5wb3AoKTtcbiAgICBpZiAoIW5leHQpIHJldHVybjtcbiAgICB0aGlzLmhpc3RvcnkucHVzaChKU09OLnN0cmluZ2lmeSh0aGlzLmRvY3VtZW50KSk7XG4gICAgdGhpcy50cmltSGlzdG9yeSgpO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBKU09OLnBhcnNlKG5leHQpIGFzIE1pbmRNYXBEb2N1bWVudDtcbiAgICB0aGlzLnNlbGVjdGVkSWQgPSB0aGlzLmRvY3VtZW50LnJvb3QuaWQ7XG4gICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICB0aGlzLm1hcmtTYXZpbmcoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaXRUb1ZpZXcoKTogdm9pZCB7XG4gICAgY29uc3QgcmVjdCA9IHRoaXMudmlld3BvcnRFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWF4KDEsIHRoaXMubGF5b3V0Lm1heFggLSB0aGlzLmxheW91dC5taW5YICsgMTAwKTtcbiAgICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heCgxLCB0aGlzLmxheW91dC5tYXhZIC0gdGhpcy5sYXlvdXQubWluWSArIDEwMCk7XG4gICAgdGhpcy56b29tID0gdGhpcy5jbGFtcFpvb20oTWF0aC5taW4oKHJlY3Qud2lkdGggLSA0MCkgLyB3aWR0aCwgKHJlY3QuaGVpZ2h0IC0gNDApIC8gaGVpZ2h0LCAxLjI1KSk7XG4gICAgY29uc3QgY2VudGVyWCA9ICh0aGlzLmxheW91dC5taW5YICsgdGhpcy5sYXlvdXQubWF4WCkgLyAyO1xuICAgIGNvbnN0IGNlbnRlclkgPSAodGhpcy5sYXlvdXQubWluWSArIHRoaXMubGF5b3V0Lm1heFkpIC8gMjtcbiAgICB0aGlzLnBhblggPSAtY2VudGVyWCAqIHRoaXMuem9vbTtcbiAgICB0aGlzLnBhblkgPSAtY2VudGVyWSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICBwcml2YXRlIHNldFpvb20odmFsdWU6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuem9vbSA9IHRoaXMuY2xhbXBab29tKHZhbHVlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICBwcml2YXRlIGNsYW1wWm9vbSh2YWx1ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5taW4oMi41LCBNYXRoLm1heCgwLjIsIHZhbHVlKSk7XG4gIH1cblxuICBwcml2YXRlIG5hdmlnYXRlU2VsZWN0aW9uKGRpcmVjdGlvbjogXCJwYXJlbnRcIiB8IFwiY2hpbGRcIiB8IFwicHJldmlvdXNcIiB8IFwibmV4dFwiKTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkTm9kZSgpID8/IHRoaXMuZG9jdW1lbnQucm9vdDtcbiAgICBsZXQgdGFyZ2V0OiBNaW5kTWFwTm9kZSB8IG51bGwgPSBudWxsO1xuICAgIGlmIChkaXJlY3Rpb24gPT09IFwicGFyZW50XCIpIHRhcmdldCA9IGZpbmRQYXJlbnQodGhpcy5kb2N1bWVudC5yb290LCBzZWxlY3RlZC5pZCk7XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gXCJjaGlsZFwiKSB0YXJnZXQgPSBzZWxlY3RlZC5jaGlsZHJlblswXSA/PyBudWxsO1xuICAgIGlmIChkaXJlY3Rpb24gPT09IFwicHJldmlvdXNcIiB8fCBkaXJlY3Rpb24gPT09IFwibmV4dFwiKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBmaW5kUGFyZW50KHRoaXMuZG9jdW1lbnQucm9vdCwgc2VsZWN0ZWQuaWQpO1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IHBhcmVudC5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkKSA9PiBjaGlsZC5pZCA9PT0gc2VsZWN0ZWQuaWQpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSBkaXJlY3Rpb24gPT09IFwicHJldmlvdXNcIiA/IC0xIDogMTtcbiAgICAgICAgdGFyZ2V0ID0gcGFyZW50LmNoaWxkcmVuW2luZGV4ICsgb2Zmc2V0XSA/PyBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICB0aGlzLnNlbGVjdE5vZGUodGFyZ2V0LmlkKTtcbiAgICAgIHRoaXMuY2VudGVyTm9kZSh0YXJnZXQuaWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICBpZiAodGFyZ2V0Lm1hdGNoZXMoXCJpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCwgW2NvbnRlbnRlZGl0YWJsZT0ndHJ1ZSddXCIpKSByZXR1cm47XG4gICAgY29uc3QgbW9kID0gZXZlbnQuY3RybEtleSB8fCBldmVudC5tZXRhS2V5O1xuICAgIGNvbnN0IGtleSA9IGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwic1wiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5jYWxsYmFja3Mub25DaGFuZ2UodGhpcy5nZXREb2N1bWVudCgpKTtcbiAgICAgIHRoaXMubWFya1NhdmluZygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGV2ZW50LnNoaWZ0S2V5ICYmIGtleSA9PT0gXCJmXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLmNhbGxiYWNrcy5vbkdsb2JhbFNlYXJjaCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJmXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLm9wZW5TZWFyY2goKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBrZXkgPT09IFwiZFwiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5kdXBsaWNhdGVTZWxlY3RlZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobW9kICYmIGtleSA9PT0gXCJjXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2b2lkIHRoaXMuY29weVNlbGVjdGVkQnJhbmNoKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcInhcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZvaWQgdGhpcy5jb3B5U2VsZWN0ZWRCcmFuY2goKS50aGVuKChjb3BpZWQpID0+IHsgaWYgKGNvcGllZCkgdGhpcy5kZWxldGVTZWxlY3RlZCgpOyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1vZCAmJiBldmVudC5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuY3ljbGVUYXNrKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtb2QgJiYga2V5ID09PSBcInpcIiAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnVuZG8oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKChtb2QgJiYga2V5ID09PSBcInlcIikgfHwgKG1vZCAmJiBldmVudC5zaGlmdEtleSAmJiBrZXkgPT09IFwielwiKSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMucmVkbygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZXZlbnQua2V5KSB7XG4gICAgICBjYXNlIFwiVGFiXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRW50ZXJcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5hZGRTaWJsaW5nKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkRlbGV0ZVwiOlxuICAgICAgY2FzZSBcIkJhY2tzcGFjZVwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmRlbGV0ZVNlbGVjdGVkKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkYyXCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuZWRpdFNlbGVjdGVkKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy50b2dnbGVDb2xsYXBzZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0xlZnRcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcInBhcmVudFwiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dSaWdodFwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLm5hdmlnYXRlU2VsZWN0aW9uKFwiY2hpbGRcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkFycm93VXBcIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcInByZXZpb3VzXCIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0Rvd25cIjpcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZVNlbGVjdGlvbihcIm5leHRcIik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIitcIjpcbiAgICAgIGNhc2UgXCI9XCI6XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb20gKiAxLjE1KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiLVwiOlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnNldFpvb20odGhpcy56b29tIC8gMS4xNSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIjBcIjpcbiAgICAgICAgaWYgKG1vZCkge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5maXRUb1ZpZXcoKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHtcbiAgcGFyc2VGZW5jZWRDb2RlLFxuICBwYXJzZU1hcmtkb3duVGFibGUsXG4gIHRhYmxlVG9NYXJrZG93bixcbiAgdHlwZSBNaW5kTWFwQ29kZUJsb2NrLFxuICB0eXBlIE1pbmRNYXBUYWJsZSxcbiAgdHlwZSBUYWJsZUFsaWdubWVudFxufSBmcm9tIFwiLi9tb2RlbFwiO1xuXG5mdW5jdGlvbiBjbG9uZVRhYmxlKHRhYmxlOiBNaW5kTWFwVGFibGUgfCB1bmRlZmluZWQpOiBNaW5kTWFwVGFibGUge1xuICBpZiAoIXRhYmxlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlYWRlcnM6IFtcIlx1NTIxNyAxXCIsIFwiXHU1MjE3IDJcIl0sXG4gICAgICByb3dzOiBbW1wiXCIsIFwiXCJdLCBbXCJcIiwgXCJcIl1dLFxuICAgICAgYWxpZ25tZW50czogW1wibGVmdFwiLCBcImxlZnRcIl0sXG4gICAgICBzb3VyY2U6IFwibWFudWFsXCJcbiAgICB9O1xuICB9XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRhYmxlKSkgYXMgTWluZE1hcFRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgVGFibGVFZGl0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgdGFibGU6IE1pbmRNYXBUYWJsZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6ICh0YWJsZTogTWluZE1hcFRhYmxlKSA9PiB2b2lkO1xuICBwcml2YXRlIGdyaWRFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIG1hcmtkb3duRWwhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCB0YWJsZTogTWluZE1hcFRhYmxlIHwgdW5kZWZpbmVkLCBzdWJtaXQ6ICh0YWJsZTogTWluZE1hcFRhYmxlKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnRhYmxlID0gY2xvbmVUYWJsZSh0YWJsZSk7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTg4NjhcdTY4M0NcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtdGFibGUtbW9kYWxcIik7XG5cbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlx1NTNFRlx1NEVFNVx1NzZGNFx1NjNBNVx1N0YxNlx1OEY5MVx1NTM1NVx1NTE0M1x1NjgzQ1x1RkYwQ1x1NEU1Rlx1NTNFRlx1NEVFNVx1N0M5OFx1OEQzNCBNYXJrZG93biBcdTg4NjhcdTY4M0NcdTU0MEVcdTcwQjlcdTUxRkJcdTIwMUNcdTg5RTNcdTY3OTAgTWFya2Rvd25cdTIwMURcdTMwMDJcIlxuICAgIH0pO1xuICAgIGRlc2NyaXB0aW9uLnNldEF0dHIoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XG5cbiAgICBjb25zdCB0b29sYmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tYy10YWJsZS10b29sYmFyXCIgfSk7XG4gICAgY29uc3QgYWRkUm93ID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTg4NENcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCByZW1vdmVSb3cgPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTIyMTIgXHU4ODRDXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgYWRkQ29sdW1uID0gdG9vbGJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiKyBcdTUyMTdcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCByZW1vdmVDb2x1bW4gPSB0b29sYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTIyMTIgXHU1MjE3XCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgY29uc3QgdG9NYXJrZG93biA9IHRvb2xiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1NzUxRlx1NjIxMCBNYXJrZG93blwiLCB0eXBlOiBcImJ1dHRvblwiIH0pO1xuXG4gICAgdGhpcy5ncmlkRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLXRhYmxlLWVkaXRvci1ncmlkXCIgfSk7XG4gICAgdGhpcy5yZW5kZXJHcmlkKCk7XG5cbiAgICBjb25zdCBtYXJrZG93bkxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiTWFya2Rvd24gXHU4ODY4XHU2ODNDXCIgfSk7XG4gICAgdGhpcy5tYXJrZG93bkVsID0gbWFya2Rvd25MYWJlbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJtbWMtdGFibGUtbWFya2Rvd25cIixcbiAgICAgIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwifCBcdTUyMTcgMSB8IFx1NTIxNyAyIHxcXG58IC0tLSB8IC0tLSB8XFxufCBcdTUxODVcdTVCQjkgfCBcdTUxODVcdTVCQjkgfFwiIH1cbiAgICB9KTtcbiAgICB0aGlzLm1hcmtkb3duRWwucm93cyA9IDg7XG4gICAgdGhpcy5tYXJrZG93bkVsLnZhbHVlID0gdGFibGVUb01hcmtkb3duKHRoaXMudGFibGUpO1xuICAgIGNvbnN0IHBhcnNlQnV0dG9uID0gbWFya2Rvd25MYWJlbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU4OUUzXHU2NzkwIE1hcmtkb3duXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG5cbiAgICBhZGRSb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIHRoaXMudGFibGUucm93cy5wdXNoKHRoaXMudGFibGUuaGVhZGVycy5tYXAoKCkgPT4gXCJcIikpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgcmVtb3ZlUm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5yb3dzLmxlbmd0aCkgdGhpcy50YWJsZS5yb3dzLnBvcCgpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgYWRkQ29sdW1uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCA+PSAxMikgeyBuZXcgTm90aWNlKFwiXHU2NzAwXHU1OTFBXHU2NTJGXHU2MzAxIDEyIFx1NTIxN1wiKTsgcmV0dXJuOyB9XG4gICAgICB0aGlzLnRhYmxlLmhlYWRlcnMucHVzaChgXHU1MjE3ICR7dGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCArIDF9YCk7XG4gICAgICB0aGlzLnRhYmxlLmFsaWdubWVudHMgPz89IFtdO1xuICAgICAgdGhpcy50YWJsZS5hbGlnbm1lbnRzLnB1c2goXCJsZWZ0XCIpO1xuICAgICAgdGhpcy50YWJsZS5yb3dzLmZvckVhY2goKHJvdykgPT4gcm93LnB1c2goXCJcIikpO1xuICAgICAgdGhpcy5yZW5kZXJHcmlkKCk7XG4gICAgfSk7XG4gICAgcmVtb3ZlQ29sdW1uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3RHcmlkKCk7XG4gICAgICBpZiAodGhpcy50YWJsZS5oZWFkZXJzLmxlbmd0aCA8PSAxKSByZXR1cm47XG4gICAgICB0aGlzLnRhYmxlLmhlYWRlcnMucG9wKCk7XG4gICAgICB0aGlzLnRhYmxlLmFsaWdubWVudHM/LnBvcCgpO1xuICAgICAgdGhpcy50YWJsZS5yb3dzLmZvckVhY2goKHJvdykgPT4gcm93LnBvcCgpKTtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgIH0pO1xuICAgIHRvTWFya2Rvd24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIHRoaXMubWFya2Rvd25FbC52YWx1ZSA9IHRhYmxlVG9NYXJrZG93bih0aGlzLnRhYmxlKTtcbiAgICB9KTtcbiAgICBwYXJzZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VNYXJrZG93blRhYmxlKHRoaXMubWFya2Rvd25FbC52YWx1ZSk7XG4gICAgICBpZiAoIXBhcnNlZCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiXHU2NzJBXHU4QkM2XHU1MjJCXHU1MjMwXHU2NzA5XHU2NTQ4XHU3Njg0IE1hcmtkb3duIFx1ODg2OFx1NjgzQ1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy50YWJsZSA9IHBhcnNlZDtcbiAgICAgIHRoaXMucmVuZGVyR3JpZCgpO1xuICAgICAgbmV3IE5vdGljZShcIk1hcmtkb3duIFx1ODg2OFx1NjgzQ1x1NURGMlx1ODlFM1x1Njc5MFwiKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjYW5jZWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTUzRDZcdTZEODhcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCBzYXZlID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU0RkREXHU1QjU4XHU4ODY4XHU2ODNDXCIsIHR5cGU6IFwiYnV0dG9uXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIHNhdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHRoaXMuY29sbGVjdEdyaWQoKTtcbiAgICAgIGlmICghdGhpcy50YWJsZS5oZWFkZXJzLnNvbWUoKGhlYWRlcikgPT4gaGVhZGVyLnRyaW0oKSkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlx1ODFGM1x1NUMxMVx1OTcwMFx1ODk4MVx1NEUwMFx1NEUyQVx1ODg2OFx1NTkzNFwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy50YWJsZS5zb3VyY2UgPSB0aGlzLnRhYmxlLnNvdXJjZSA/PyBcIm1hbnVhbFwiO1xuICAgICAgdGhpcy5zdWJtaXQodGhpcy50YWJsZSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckdyaWQoKTogdm9pZCB7XG4gICAgdGhpcy5ncmlkRWwuZW1wdHkoKTtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMuZ3JpZEVsLmNyZWF0ZUVsKFwidGFibGVcIik7XG4gICAgY29uc3QgaGVhZCA9IHRhYmxlLmNyZWF0ZUVsKFwidGhlYWRcIikuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICB0aGlzLnRhYmxlLmhlYWRlcnMuZm9yRWFjaCgoaGVhZGVyLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgdGggPSBoZWFkLmNyZWF0ZUVsKFwidGhcIik7XG4gICAgICBjb25zdCBpbnB1dCA9IHRoLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgYXR0cjogeyBcImRhdGEta2luZFwiOiBcImhlYWRlclwiLCBcImRhdGEtY29sdW1uXCI6IFN0cmluZyhpbmRleCkgfSB9KTtcbiAgICAgIGlucHV0LnZhbHVlID0gaGVhZGVyO1xuICAgICAgY29uc3QgYWxpZ24gPSB0aC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGF0dHI6IHsgXCJkYXRhLWtpbmRcIjogXCJhbGlnbm1lbnRcIiwgXCJkYXRhLWNvbHVtblwiOiBTdHJpbmcoaW5kZXgpLCBcImFyaWEtbGFiZWxcIjogYFx1N0IyQyAke2luZGV4ICsgMX0gXHU1MjE3XHU1QkY5XHU5RjUwXHU2NUI5XHU1RjBGYCB9IH0pO1xuICAgICAgKFtbJ2xlZnQnLCAnXHU1REU2J10sIFsnY2VudGVyJywgJ1x1NEUyRCddLCBbJ3JpZ2h0JywgJ1x1NTNGMyddXSBhcyBBcnJheTxbVGFibGVBbGlnbm1lbnQsIHN0cmluZ10+KS5mb3JFYWNoKChbdmFsdWUsIGxhYmVsXSkgPT4gYWxpZ24uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgYXR0cjogeyB2YWx1ZSB9IH0pKTtcbiAgICAgIGFsaWduLnZhbHVlID0gdGhpcy50YWJsZS5hbGlnbm1lbnRzPy5baW5kZXhdID8/IFwibGVmdFwiO1xuICAgIH0pO1xuICAgIGNvbnN0IGJvZHkgPSB0YWJsZS5jcmVhdGVFbChcInRib2R5XCIpO1xuICAgIHRoaXMudGFibGUucm93cy5mb3JFYWNoKChyb3csIHJvd0luZGV4KSA9PiB7XG4gICAgICBjb25zdCB0ciA9IGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICAgIHRoaXMudGFibGUuaGVhZGVycy5mb3JFYWNoKChfLCBjb2x1bW5JbmRleCkgPT4ge1xuICAgICAgICBjb25zdCB0ZCA9IHRyLmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gdGQuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiLCB7IGF0dHI6IHsgXCJkYXRhLWtpbmRcIjogXCJjZWxsXCIsIFwiZGF0YS1yb3dcIjogU3RyaW5nKHJvd0luZGV4KSwgXCJkYXRhLWNvbHVtblwiOiBTdHJpbmcoY29sdW1uSW5kZXgpIH0gfSk7XG4gICAgICAgIGlucHV0LnJvd3MgPSAyO1xuICAgICAgICBpbnB1dC52YWx1ZSA9IHJvd1tjb2x1bW5JbmRleF0gPz8gXCJcIjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb2xsZWN0R3JpZCgpOiB2b2lkIHtcbiAgICBjb25zdCBoZWFkZXJzID0gQXJyYXkuZnJvbSh0aGlzLmdyaWRFbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxJbnB1dEVsZW1lbnQ+KCdpbnB1dFtkYXRhLWtpbmQ9XCJoZWFkZXJcIl0nKSk7XG4gICAgaGVhZGVycy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgICAgY29uc3QgY29sdW1uID0gTnVtYmVyKGlucHV0LmRhdGFzZXQuY29sdW1uKTtcbiAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGNvbHVtbikpIHRoaXMudGFibGUuaGVhZGVyc1tjb2x1bW5dID0gaW5wdXQudmFsdWUudHJpbSgpLnNsaWNlKDAsIDIwMDApO1xuICAgIH0pO1xuICAgIGNvbnN0IGFsaWdubWVudHMgPSBBcnJheS5mcm9tKHRoaXMuZ3JpZEVsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFNlbGVjdEVsZW1lbnQ+KCdzZWxlY3RbZGF0YS1raW5kPVwiYWxpZ25tZW50XCJdJykpO1xuICAgIHRoaXMudGFibGUuYWxpZ25tZW50cyA9IHRoaXMudGFibGUuaGVhZGVycy5tYXAoKCkgPT4gXCJsZWZ0XCIpO1xuICAgIGFsaWdubWVudHMuZm9yRWFjaCgoaW5wdXQpID0+IHtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IE51bWJlcihpbnB1dC5kYXRhc2V0LmNvbHVtbik7XG4gICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihjb2x1bW4pKSB0aGlzLnRhYmxlLmFsaWdubWVudHMhW2NvbHVtbl0gPSBpbnB1dC52YWx1ZSA9PT0gXCJjZW50ZXJcIiB8fCBpbnB1dC52YWx1ZSA9PT0gXCJyaWdodFwiID8gaW5wdXQudmFsdWUgOiBcImxlZnRcIjtcbiAgICB9KTtcbiAgICBjb25zdCBjZWxscyA9IEFycmF5LmZyb20odGhpcy5ncmlkRWwucXVlcnlTZWxlY3RvckFsbDxIVE1MVGV4dEFyZWFFbGVtZW50PigndGV4dGFyZWFbZGF0YS1raW5kPVwiY2VsbFwiXScpKTtcbiAgICBjZWxscy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgICAgY29uc3Qgcm93ID0gTnVtYmVyKGlucHV0LmRhdGFzZXQucm93KTtcbiAgICAgIGNvbnN0IGNvbHVtbiA9IE51bWJlcihpbnB1dC5kYXRhc2V0LmNvbHVtbik7XG4gICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihyb3cpICYmIE51bWJlci5pc0ludGVnZXIoY29sdW1uKSAmJiB0aGlzLnRhYmxlLnJvd3Nbcm93XSkgdGhpcy50YWJsZS5yb3dzW3Jvd10hW2NvbHVtbl0gPSBpbnB1dC52YWx1ZS5zbGljZSgwLCAyMDAwKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29kZUVkaXRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBibG9jazogTWluZE1hcENvZGVCbG9jayB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJtaXQ6IChibG9jazogTWluZE1hcENvZGVCbG9jaykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgYmxvY2s6IE1pbmRNYXBDb2RlQmxvY2sgfCB1bmRlZmluZWQsIHN1Ym1pdDogKGJsb2NrOiBNaW5kTWFwQ29kZUJsb2NrKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmJsb2NrID0gYmxvY2s7XG4gICAgdGhpcy5zdWJtaXQgPSBzdWJtaXQ7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTYzRDJcdTUxNjVcdTYyMTZcdTdGMTZcdThGOTFcdTRFRTNcdTc4MDFcIik7XG4gICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJtbWMtY29kZS1tb2RhbFwiKTtcbiAgICBjb25zdCBsYW5ndWFnZUxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU0RUUzXHU3ODAxXHU4QkVEXHU4QTAwXCIgfSk7XG4gICAgY29uc3QgbGFuZ3VhZ2VJbnB1dCA9IGxhbmd1YWdlTGFiZWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcImphdmFzY3JpcHRcdTMwMDFweXRob25cdTMwMDFjc3NcdTIwMjZcIiB9IH0pO1xuICAgIGxhbmd1YWdlSW5wdXQudmFsdWUgPSB0aGlzLmJsb2NrPy5sYW5ndWFnZSA/PyBcIlwiO1xuXG4gICAgY29uc3QgY29kZUxhYmVsID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHU0RUUzXHU3ODAxXHU1MTg1XHU1QkI5XCIgfSk7XG4gICAgY29uc3QgY29kZUlucHV0ID0gY29kZUxhYmVsLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwgeyBjbHM6IFwibW1jLWNvZGUtdGV4dGFyZWFcIiwgYXR0cjogeyBzcGVsbGNoZWNrOiBcImZhbHNlXCIsIHBsYWNlaG9sZGVyOiBcIlx1NTNFRlx1NzZGNFx1NjNBNVx1N0M5OFx1OEQzNFx1NEVFM1x1NzgwMVx1RkYwQ1x1NjIxNlx1N0M5OFx1OEQzNCBgYGBcdThCRURcdThBMDAgLi4uIGBgYCBmZW5jZWQgY29kZSBibG9ja1wiIH0gfSk7XG4gICAgY29kZUlucHV0LnJvd3MgPSAxODtcbiAgICBjb2RlSW5wdXQudmFsdWUgPSB0aGlzLmJsb2NrPy5jb2RlID8/IFwiXCI7XG5cbiAgICBjb25zdCBkZXRlY3QgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU4QkM2XHU1MjJCIGZlbmNlZCBjb2RlXCIsIHR5cGU6IFwiYnV0dG9uXCIgfSk7XG4gICAgZGV0ZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUZlbmNlZENvZGUoY29kZUlucHV0LnZhbHVlKTtcbiAgICAgIGlmICghcGFyc2VkKSB7IG5ldyBOb3RpY2UoXCJcdTZDQTFcdTY3MDlcdThCQzZcdTUyMkJcdTUyMzBcdTVCOENcdTY1NzRcdTc2ODQgYGBgIGZlbmNlZCBjb2RlIGJsb2NrXCIpOyByZXR1cm47IH1cbiAgICAgIGxhbmd1YWdlSW5wdXQudmFsdWUgPSBwYXJzZWQubGFuZ3VhZ2UgPz8gXCJcIjtcbiAgICAgIGNvZGVJbnB1dC52YWx1ZSA9IHBhcnNlZC5jb2RlO1xuICAgICAgbmV3IE5vdGljZShcIlx1NEVFM1x1NzgwMVx1OEJFRFx1OEEwMFx1NTQ4Q1x1NTE4NVx1NUJCOVx1NURGMlx1OEJDNlx1NTIyQlwiKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1jLW1vZGFsLWFjdGlvbnNcIiB9KTtcbiAgICBjb25zdCBjYW5jZWwgPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJcdTUzRDZcdTZEODhcIiwgdHlwZTogXCJidXR0b25cIiB9KTtcbiAgICBjb25zdCBzYXZlID0gYWN0aW9ucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHU0RkREXHU1QjU4XHU0RUUzXHU3ODAxXCIsIHR5cGU6IFwiYnV0dG9uXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY2FuY2VsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgIHNhdmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGxldCBsYW5ndWFnZSA9IGxhbmd1YWdlSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgbGV0IGNvZGUgPSBjb2RlSW5wdXQudmFsdWU7XG4gICAgICBjb25zdCBmZW5jZWQgPSBwYXJzZUZlbmNlZENvZGUoY29kZSk7XG4gICAgICBpZiAoZmVuY2VkKSB7XG4gICAgICAgIGxhbmd1YWdlID0gZmVuY2VkLmxhbmd1YWdlID8/IGxhbmd1YWdlO1xuICAgICAgICBjb2RlID0gZmVuY2VkLmNvZGU7XG4gICAgICB9XG4gICAgICBpZiAoIWNvZGUudHJpbSgpKSB7IG5ldyBOb3RpY2UoXCJcdTRFRTNcdTc4MDFcdTUxODVcdTVCQjlcdTRFMERcdTgwRkRcdTRFM0FcdTdBN0FcIik7IHJldHVybjsgfVxuICAgICAgdGhpcy5zdWJtaXQoeyBsYW5ndWFnZTogbGFuZ3VhZ2UucmVwbGFjZSgvW15hLXowLTlfKyMuLV0vZ2ksIFwiXCIpLnNsaWNlKDAsIDQwKSB8fCB1bmRlZmluZWQsIGNvZGUgfSk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFRGaWxlLCBub3JtYWxpemVQYXRoLCBzZXRJY29uIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge1xuICBub2RlQ29udGVudEJsb2NrcyxcbiAgbm9kZVBsYWluVGV4dCxcbiAgbm9kZVNlYXJjaFRleHQsXG4gIHBhcnNlRG9jdW1lbnQsXG4gIHR5cGUgTWluZE1hcERvY3VtZW50LFxuICB0eXBlIE1pbmRNYXBOb2RlXG59IGZyb20gXCIuL21vZGVsXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFNlYXJjaEVudHJ5IHtcbiAga2V5OiBzdHJpbmc7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIGZpbGVUaXRsZTogc3RyaW5nO1xuICBub2RlSWQ6IHN0cmluZztcbiAgbm9kZVRleHQ6IHN0cmluZztcbiAgYnJlYWRjcnVtYjogc3RyaW5nW107XG4gIGRlcHRoOiBudW1iZXI7XG4gIHNlYXJjaGFibGVUZXh0OiBzdHJpbmc7XG4gIG5vdGU/OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbiAgbWF0Y2hlZEtpbmRzPzogc3RyaW5nW107XG4gIHN1Ym1hcFBhdGg/OiBzdHJpbmc7XG4gIGlzU3VibWFwRG9jdW1lbnQ/OiBib29sZWFuO1xuICBwYXJlbnRNYXBQYXRoPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1pbmRNYXBTZWFyY2hSZXN1bHQgZXh0ZW5kcyBNaW5kTWFwU2VhcmNoRW50cnkge1xuICBzY29yZTogbnVtYmVyO1xuICBtYXRjaGVkS2luZDogc3RyaW5nO1xuICBzbmlwcGV0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJbmRleGVkTWluZE1hcEZpbGUge1xuICBtdGltZTogbnVtYmVyO1xuICBzaXplOiBudW1iZXI7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGVudHJpZXM6IE1pbmRNYXBTZWFyY2hFbnRyeVtdO1xufVxuXG5pbnRlcmZhY2UgUGVyc2lzdGVkTWluZE1hcFNlYXJjaEluZGV4IHtcbiAgdmVyc2lvbjogMTtcbiAgZ2VuZXJhdGVkQXQ6IHN0cmluZztcbiAgZmlsZXM6IFJlY29yZDxzdHJpbmcsIEluZGV4ZWRNaW5kTWFwRmlsZT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWluZE1hcFNlYXJjaEluZGV4U3RhdHVzIHtcbiAgcmVhZHk6IGJvb2xlYW47XG4gIGJ1aWxkaW5nOiBib29sZWFuO1xuICBmaWxlczogbnVtYmVyO1xuICBub2RlczogbnVtYmVyO1xuICBsYXN0QnVpbHRBdD86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplZCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLm5vcm1hbGl6ZShcIk5GS0NcIikudG9Mb2NhbGVMb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXBhY3QodmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgbWF4ID0gMTgwKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgdGV4dCA9IHZhbHVlPy5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG4gIGlmICghdGV4dCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIHRleHQubGVuZ3RoID4gbWF4ID8gYCR7dGV4dC5zbGljZSgwLCBtYXggLSAxKX1cdTIwMjZgIDogdGV4dDtcbn1cblxuZnVuY3Rpb24gbm9kZURpc3BsYXlUZXh0KG5vZGU6IE1pbmRNYXBOb2RlKTogc3RyaW5nIHtcbiAgY29uc3QgdGV4dCA9IG5vZGVQbGFpblRleHQobm9kZSkudHJpbSgpO1xuICBpZiAodGV4dCkgcmV0dXJuIHRleHQ7XG4gIGlmIChub2RlLmNvZGU/LmNvZGUudHJpbSgpKSByZXR1cm4gYFx1NEVFM1x1NzgwMVx1RkYxQSR7Y29tcGFjdChub2RlLmNvZGUuY29kZSwgNjQpfWA7XG4gIGlmIChub2RlLnRhYmxlKSByZXR1cm4gYFx1ODg2OFx1NjgzQ1x1RkYxQSR7bm9kZS50YWJsZS5oZWFkZXJzLmpvaW4oXCIgLyBcIikgfHwgYCR7bm9kZS50YWJsZS5yb3dzLmxlbmd0aH0gXHU4ODRDYH1gO1xuICBpZiAobm9kZUNvbnRlbnRCbG9ja3Mobm9kZSkuc29tZSgoYmxvY2spID0+IGJsb2NrLnR5cGUgPT09IFwiaW1hZ2VcIikpIHJldHVybiBcIlx1NTZGRVx1NzI0N1x1ODI4Mlx1NzBCOVwiO1xuICByZXR1cm4gXCJcdTY3MkFcdTU0N0RcdTU0MERcdTgyODJcdTcwQjlcIjtcbn1cblxuZnVuY3Rpb24gZmllbGRWYWx1ZXMobm9kZTogTWluZE1hcE5vZGUpOiBBcnJheTx7IGtpbmQ6IHN0cmluZzsgdmFsdWU6IHN0cmluZyB9PiB7XG4gIGNvbnN0IHZhbHVlczogQXJyYXk8eyBraW5kOiBzdHJpbmc7IHZhbHVlOiBzdHJpbmcgfT4gPSBbXTtcbiAgY29uc3QgdGV4dCA9IG5vZGVQbGFpblRleHQobm9kZSkudHJpbSgpO1xuICBpZiAodGV4dCkgdmFsdWVzLnB1c2goeyBraW5kOiBcIlx1ODI4Mlx1NzBCOVx1NjU4N1x1NUI1N1wiLCB2YWx1ZTogdGV4dCB9KTtcbiAgaWYgKG5vZGUubm90ZT8udHJpbSgpKSB2YWx1ZXMucHVzaCh7IGtpbmQ6IFwiXHU1OTA3XHU2Q0U4XCIsIHZhbHVlOiBub2RlLm5vdGUgfSk7XG4gIGlmIChub2RlLnRhZ3M/Lmxlbmd0aCkgdmFsdWVzLnB1c2goeyBraW5kOiBcIlx1NjgwN1x1N0I3RVwiLCB2YWx1ZTogbm9kZS50YWdzLmpvaW4oXCIgXCIpIH0pO1xuICBpZiAobm9kZS5saW5rPy50cmltKCkpIHZhbHVlcy5wdXNoKHsga2luZDogXCJcdTk0RkVcdTYzQTVcIiwgdmFsdWU6IG5vZGUubGluayB9KTtcbiAgaWYgKG5vZGUuaWNvbj8udHJpbSgpKSB2YWx1ZXMucHVzaCh7IGtpbmQ6IFwiXHU1NkZFXHU2ODA3XCIsIHZhbHVlOiBub2RlLmljb24gfSk7XG4gIGlmIChub2RlLnRhc2spIHZhbHVlcy5wdXNoKHsga2luZDogXCJcdTRFRkJcdTUyQTFcIiwgdmFsdWU6IG5vZGUudGFzayB9KTtcbiAgaWYgKG5vZGUuc3VibWFwPy5wYXRoKSB2YWx1ZXMucHVzaCh7IGtpbmQ6IFwiXHU1QjUwXHU1QkZDXHU1NkZFXCIsIHZhbHVlOiBgJHtub2RlLnN1Ym1hcC50aXRsZSA/PyBcIlwifSAke25vZGUuc3VibWFwLnBhdGh9YCB9KTtcbiAgaWYgKG5vZGUuY29kZSkgdmFsdWVzLnB1c2goeyBraW5kOiBcIlx1NEVFM1x1NzgwMVwiLCB2YWx1ZTogYCR7bm9kZS5jb2RlLmxhbmd1YWdlID8/IFwiXCJ9XFxuJHtub2RlLmNvZGUuY29kZX1gIH0pO1xuICBpZiAobm9kZS50YWJsZSkgdmFsdWVzLnB1c2goeyBraW5kOiBcIlx1ODg2OFx1NjgzQ1wiLCB2YWx1ZTogWy4uLm5vZGUudGFibGUuaGVhZGVycywgLi4ubm9kZS50YWJsZS5yb3dzLmZsYXQoKV0uam9pbihcIiBcIikgfSk7XG4gIGNvbnN0IGltYWdlVmFsdWVzID0gbm9kZUNvbnRlbnRCbG9ja3Mobm9kZSlcbiAgICAuZmlsdGVyKChibG9jaykgPT4gYmxvY2sudHlwZSA9PT0gXCJpbWFnZVwiKVxuICAgIC5tYXAoKGJsb2NrKSA9PiBgJHtibG9jay5hbHQgPz8gXCJcIn0gJHtibG9jay5zb3VyY2V9ICR7YmxvY2subG9jYWxTb3VyY2UgPz8gXCJcIn1gKVxuICAgIC5qb2luKFwiIFwiKTtcbiAgaWYgKGltYWdlVmFsdWVzLnRyaW0oKSkgdmFsdWVzLnB1c2goeyBraW5kOiBcIlx1NTZGRVx1NzI0N1wiLCB2YWx1ZTogaW1hZ2VWYWx1ZXMgfSk7XG4gIHJldHVybiB2YWx1ZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFNlYXJjaEVudHJpZXMoZG9jdW1lbnQ6IE1pbmRNYXBEb2N1bWVudCwgZmlsZVBhdGg6IHN0cmluZyk6IE1pbmRNYXBTZWFyY2hFbnRyeVtdIHtcbiAgY29uc3QgZW50cmllczogTWluZE1hcFNlYXJjaEVudHJ5W10gPSBbXTtcbiAgY29uc3QgdmlzaXQgPSAobm9kZTogTWluZE1hcE5vZGUsIGFuY2VzdG9yczogc3RyaW5nW10sIGRlcHRoOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBjb25zdCBkaXNwbGF5ID0gbm9kZURpc3BsYXlUZXh0KG5vZGUpO1xuICAgIGNvbnN0IGZpZWxkcyA9IGZpZWxkVmFsdWVzKG5vZGUpO1xuICAgIGNvbnN0IGJyZWFkY3J1bWIgPSBbLi4uYW5jZXN0b3JzLCBkaXNwbGF5XTtcbiAgICBjb25zdCBzZWFyY2hUZXh0ID0gbm9ybWFsaXplZChbXG4gICAgICBkb2N1bWVudC50aXRsZSxcbiAgICAgIGZpbGVQYXRoLFxuICAgICAgLi4uYnJlYWRjcnVtYixcbiAgICAgIG5vZGVTZWFyY2hUZXh0KG5vZGUpLFxuICAgICAgLi4uZmllbGRzLm1hcCgoZmllbGQpID0+IGZpZWxkLnZhbHVlKVxuICAgIF0uam9pbihcIiBcIikpO1xuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBrZXk6IGAke2ZpbGVQYXRofTo6JHtub2RlLmlkfWAsXG4gICAgICBmaWxlUGF0aCxcbiAgICAgIGZpbGVUaXRsZTogZG9jdW1lbnQudGl0bGUgfHwgZmlsZVBhdGguc3BsaXQoXCIvXCIpLmF0KC0xKT8ucmVwbGFjZSgvXFwubWluZG1hcCQvaSwgXCJcIikgfHwgXCJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIixcbiAgICAgIG5vZGVJZDogbm9kZS5pZCxcbiAgICAgIG5vZGVUZXh0OiBkaXNwbGF5LFxuICAgICAgYnJlYWRjcnVtYixcbiAgICAgIGRlcHRoLFxuICAgICAgc2VhcmNoYWJsZVRleHQ6IHNlYXJjaFRleHQsXG4gICAgICBub3RlOiBjb21wYWN0KG5vZGUubm90ZSksXG4gICAgICB0YWdzOiBub2RlLnRhZ3M/LnNsaWNlKDAsIDIwKSxcbiAgICAgIG1hdGNoZWRLaW5kczogZmllbGRzLm1hcCgoZmllbGQpID0+IGZpZWxkLmtpbmQpLFxuICAgICAgc3VibWFwUGF0aDogbm9kZS5zdWJtYXA/LnBhdGgsXG4gICAgICBpc1N1Ym1hcERvY3VtZW50OiBCb29sZWFuKGRvY3VtZW50Lm5hdmlnYXRpb24/LnBhcmVudFBhdGgpLFxuICAgICAgcGFyZW50TWFwUGF0aDogZG9jdW1lbnQubmF2aWdhdGlvbj8ucGFyZW50UGF0aFxuICAgIH0pO1xuICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHZpc2l0KGNoaWxkLCBicmVhZGNydW1iLCBkZXB0aCArIDEpKTtcbiAgfTtcbiAgdmlzaXQoZG9jdW1lbnQucm9vdCwgW10sIDApO1xuICByZXR1cm4gZW50cmllcztcbn1cblxuZnVuY3Rpb24gcmVzdWx0U25pcHBldChlbnRyeTogTWluZE1hcFNlYXJjaEVudHJ5LCBxdWVyeTogc3RyaW5nKTogeyBraW5kOiBzdHJpbmc7IHNuaXBwZXQ6IHN0cmluZyB9IHtcbiAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gbm9ybWFsaXplZChxdWVyeSk7XG4gIGNvbnN0IGNhbmRpZGF0ZXM6IEFycmF5PHsga2luZDogc3RyaW5nOyB2YWx1ZT86IHN0cmluZyB9PiA9IFtcbiAgICB7IGtpbmQ6IFwiXHU4MjgyXHU3MEI5XHU2NTg3XHU1QjU3XCIsIHZhbHVlOiBlbnRyeS5ub2RlVGV4dCB9LFxuICAgIHsga2luZDogXCJcdTU5MDdcdTZDRThcIiwgdmFsdWU6IGVudHJ5Lm5vdGUgfSxcbiAgICB7IGtpbmQ6IFwiXHU2ODA3XHU3QjdFXCIsIHZhbHVlOiBlbnRyeS50YWdzPy5qb2luKFwiXHUzMDAxXCIpIH0sXG4gICAgeyBraW5kOiBcIlx1OERFRlx1NUY4NFwiLCB2YWx1ZTogZW50cnkuYnJlYWRjcnVtYi5qb2luKFwiIFx1MjAzQSBcIikgfSxcbiAgICB7IGtpbmQ6IFwiXHU2NTg3XHU0RUY2XCIsIHZhbHVlOiBgJHtlbnRyeS5maWxlVGl0bGV9ICR7ZW50cnkuZmlsZVBhdGh9YCB9LFxuICAgIHsga2luZDogXCJcdTUxODVcdTVCQjlcIiwgdmFsdWU6IGVudHJ5LnNlYXJjaGFibGVUZXh0IH1cbiAgXTtcbiAgY29uc3QgbWF0Y2hlZCA9IGNhbmRpZGF0ZXMuZmluZCgoY2FuZGlkYXRlKSA9PiBjYW5kaWRhdGUudmFsdWUgJiYgbm9ybWFsaXplZChjYW5kaWRhdGUudmFsdWUpLmluY2x1ZGVzKHF1ZXJ5Tm9ybWFsaXplZCkpO1xuICByZXR1cm4ge1xuICAgIGtpbmQ6IG1hdGNoZWQ/LmtpbmQgPz8gXCJcdTUxODVcdTVCQjlcIixcbiAgICBzbmlwcGV0OiBjb21wYWN0KG1hdGNoZWQ/LnZhbHVlID8/IGVudHJ5Lm5vZGVUZXh0LCAyMjApID8/IGVudHJ5Lm5vZGVUZXh0XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hFbnRyaWVzKGVudHJpZXM6IE1pbmRNYXBTZWFyY2hFbnRyeVtdLCBxdWVyeTogc3RyaW5nLCBsaW1pdCA9IDEwMCk6IE1pbmRNYXBTZWFyY2hSZXN1bHRbXSB7XG4gIGNvbnN0IHBocmFzZSA9IG5vcm1hbGl6ZWQocXVlcnkpO1xuICBpZiAoIXBocmFzZSkgcmV0dXJuIFtdO1xuICBjb25zdCB0ZXJtcyA9IHBocmFzZS5zcGxpdCgvXFxzKy8pLmZpbHRlcihCb29sZWFuKTtcbiAgY29uc3QgcmVzdWx0czogTWluZE1hcFNlYXJjaFJlc3VsdFtdID0gW107XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgIGlmICghdGVybXMuZXZlcnkoKHRlcm0pID0+IGVudHJ5LnNlYXJjaGFibGVUZXh0LmluY2x1ZGVzKHRlcm0pKSkgY29udGludWU7XG4gICAgY29uc3Qgbm9kZVRleHQgPSBub3JtYWxpemVkKGVudHJ5Lm5vZGVUZXh0KTtcbiAgICBjb25zdCBmaWxlVGl0bGUgPSBub3JtYWxpemVkKGVudHJ5LmZpbGVUaXRsZSk7XG4gICAgY29uc3QgYnJlYWRjcnVtYiA9IG5vcm1hbGl6ZWQoZW50cnkuYnJlYWRjcnVtYi5qb2luKFwiIFwiKSk7XG4gICAgbGV0IHNjb3JlID0gMDtcbiAgICBpZiAobm9kZVRleHQgPT09IHBocmFzZSkgc2NvcmUgKz0gNTAwO1xuICAgIGVsc2UgaWYgKG5vZGVUZXh0LnN0YXJ0c1dpdGgocGhyYXNlKSkgc2NvcmUgKz0gMzIwO1xuICAgIGVsc2UgaWYgKG5vZGVUZXh0LmluY2x1ZGVzKHBocmFzZSkpIHNjb3JlICs9IDIzMDtcbiAgICBpZiAoZmlsZVRpdGxlID09PSBwaHJhc2UpIHNjb3JlICs9IDE4MDtcbiAgICBlbHNlIGlmIChmaWxlVGl0bGUuaW5jbHVkZXMocGhyYXNlKSkgc2NvcmUgKz0gOTA7XG4gICAgaWYgKGJyZWFkY3J1bWIuaW5jbHVkZXMocGhyYXNlKSkgc2NvcmUgKz0gNzA7XG4gICAgaWYgKG5vcm1hbGl6ZWQoZW50cnkudGFncz8uam9pbihcIiBcIikgPz8gXCJcIikuaW5jbHVkZXMocGhyYXNlKSkgc2NvcmUgKz0gMTAwO1xuICAgIGlmIChub3JtYWxpemVkKGVudHJ5Lm5vdGUgPz8gXCJcIikuaW5jbHVkZXMocGhyYXNlKSkgc2NvcmUgKz0gNjA7XG4gICAgaWYgKGVudHJ5LmlzU3VibWFwRG9jdW1lbnQpIHNjb3JlICs9IDU7XG4gICAgc2NvcmUgKz0gTWF0aC5tYXgoMCwgMjUgLSBlbnRyeS5kZXB0aCAqIDIpO1xuICAgIGNvbnN0IHsga2luZCwgc25pcHBldCB9ID0gcmVzdWx0U25pcHBldChlbnRyeSwgcXVlcnkpO1xuICAgIHJlc3VsdHMucHVzaCh7IC4uLmVudHJ5LCBzY29yZSwgbWF0Y2hlZEtpbmQ6IGtpbmQsIHNuaXBwZXQgfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHMuc29ydCgobGVmdCwgcmlnaHQpID0+IHJpZ2h0LnNjb3JlIC0gbGVmdC5zY29yZSB8fCBsZWZ0LmZpbGVQYXRoLmxvY2FsZUNvbXBhcmUocmlnaHQuZmlsZVBhdGgpIHx8IGxlZnQuZGVwdGggLSByaWdodC5kZXB0aCkuc2xpY2UoMCwgbGltaXQpO1xufVxuXG5leHBvcnQgY2xhc3MgTWluZE1hcFNlYXJjaEluZGV4IHtcbiAgcHJpdmF0ZSBkYXRhOiBQZXJzaXN0ZWRNaW5kTWFwU2VhcmNoSW5kZXggPSB7IHZlcnNpb246IDEsIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgwKS50b0lTT1N0cmluZygpLCBmaWxlczoge30gfTtcbiAgcHJpdmF0ZSByZWFkeSA9IGZhbHNlO1xuICBwcml2YXRlIGJ1aWxkaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgc2F2ZVRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSBmaWxlVGltZXJzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSByZWJ1aWxkUHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSByZWFkb25seSBpbmRleFBhdGg6IHN0cmluZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV4dGVuc2lvbiA9IFwibWluZG1hcFwiXG4gICkge31cblxuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgIGF3YWl0IHRoaXMucmVidWlsZENoYW5nZWRGaWxlcygpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zYXZlVGltZXIgIT09IG51bGwpIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5zYXZlVGltZXIpO1xuICAgIGZvciAoY29uc3QgdGltZXIgb2YgdGhpcy5maWxlVGltZXJzLnZhbHVlcygpKSB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aGlzLmZpbGVUaW1lcnMuY2xlYXIoKTtcbiAgICB2b2lkIHRoaXMuc2F2ZU5vdygpO1xuICB9XG5cbiAgZ2V0U3RhdHVzKCk6IE1pbmRNYXBTZWFyY2hJbmRleFN0YXR1cyB7XG4gICAgY29uc3QgZmlsZXMgPSBPYmplY3Qua2V5cyh0aGlzLmRhdGEuZmlsZXMpLmxlbmd0aDtcbiAgICBjb25zdCBub2RlcyA9IE9iamVjdC52YWx1ZXModGhpcy5kYXRhLmZpbGVzKS5yZWR1Y2UoKHN1bSwgZmlsZSkgPT4gc3VtICsgZmlsZS5lbnRyaWVzLmxlbmd0aCwgMCk7XG4gICAgcmV0dXJuIHsgcmVhZHk6IHRoaXMucmVhZHksIGJ1aWxkaW5nOiB0aGlzLmJ1aWxkaW5nLCBmaWxlcywgbm9kZXMsIGxhc3RCdWlsdEF0OiB0aGlzLmRhdGEuZ2VuZXJhdGVkQXQgfTtcbiAgfVxuXG4gIGFsbEVudHJpZXMoKTogTWluZE1hcFNlYXJjaEVudHJ5W10ge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKHRoaXMuZGF0YS5maWxlcykuZmxhdE1hcCgoZmlsZSkgPT4gZmlsZS5lbnRyaWVzKTtcbiAgfVxuXG4gIHNlYXJjaChxdWVyeTogc3RyaW5nLCBsaW1pdCA9IDEwMCk6IE1pbmRNYXBTZWFyY2hSZXN1bHRbXSB7XG4gICAgcmV0dXJuIHNlYXJjaEVudHJpZXModGhpcy5hbGxFbnRyaWVzKCksIHF1ZXJ5LCBsaW1pdCk7XG4gIH1cblxuICBxdWV1ZUZpbGUoZmlsZTogVEZpbGUsIGRlbGF5ID0gNTAwKTogdm9pZCB7XG4gICAgaWYgKGZpbGUuZXh0ZW5zaW9uLnRvTG9jYWxlTG93ZXJDYXNlKCkgIT09IHRoaXMuZXh0ZW5zaW9uKSByZXR1cm47XG4gICAgY29uc3QgcHJldmlvdXMgPSB0aGlzLmZpbGVUaW1lcnMuZ2V0KGZpbGUucGF0aCk7XG4gICAgaWYgKHByZXZpb3VzICE9PSB1bmRlZmluZWQpIHdpbmRvdy5jbGVhclRpbWVvdXQocHJldmlvdXMpO1xuICAgIGNvbnN0IHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5maWxlVGltZXJzLmRlbGV0ZShmaWxlLnBhdGgpO1xuICAgICAgdm9pZCB0aGlzLmluZGV4RmlsZShmaWxlKS50aGVuKCgpID0+IHRoaXMuc2NoZWR1bGVTYXZlKCkpO1xuICAgIH0sIGRlbGF5KTtcbiAgICB0aGlzLmZpbGVUaW1lcnMuc2V0KGZpbGUucGF0aCwgdGltZXIpO1xuICB9XG5cbiAgcmVtb3ZlRmlsZShwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBub3JtYWxpemVkUGF0aCA9IG5vcm1hbGl6ZVBhdGgocGF0aCk7XG4gICAgaWYgKCF0aGlzLmRhdGEuZmlsZXNbbm9ybWFsaXplZFBhdGhdKSByZXR1cm47XG4gICAgZGVsZXRlIHRoaXMuZGF0YS5maWxlc1tub3JtYWxpemVkUGF0aF07XG4gICAgdGhpcy5kYXRhLmdlbmVyYXRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIHRoaXMuc2NoZWR1bGVTYXZlKCk7XG4gIH1cblxuICByZW5hbWVGaWxlKGZpbGU6IFRGaWxlLCBvbGRQYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnJlbW92ZUZpbGUob2xkUGF0aCk7XG4gICAgdGhpcy5xdWV1ZUZpbGUoZmlsZSwgNTApO1xuICB9XG5cbiAgYXN5bmMgcmVidWlsZEFsbCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5yZWJ1aWxkUHJvbWlzZSkgcmV0dXJuIHRoaXMucmVidWlsZFByb21pc2U7XG4gICAgdGhpcy5yZWJ1aWxkUHJvbWlzZSA9IHRoaXMucGVyZm9ybVJlYnVpbGQodHJ1ZSkuZmluYWxseSgoKSA9PiB7IHRoaXMucmVidWlsZFByb21pc2UgPSBudWxsOyB9KTtcbiAgICByZXR1cm4gdGhpcy5yZWJ1aWxkUHJvbWlzZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVidWlsZENoYW5nZWRGaWxlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5yZWJ1aWxkUHJvbWlzZSkgcmV0dXJuIHRoaXMucmVidWlsZFByb21pc2U7XG4gICAgdGhpcy5yZWJ1aWxkUHJvbWlzZSA9IHRoaXMucGVyZm9ybVJlYnVpbGQoZmFsc2UpLmZpbmFsbHkoKCkgPT4geyB0aGlzLnJlYnVpbGRQcm9taXNlID0gbnVsbDsgfSk7XG4gICAgcmV0dXJuIHRoaXMucmVidWlsZFByb21pc2U7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1SZWJ1aWxkKGZvcmNlOiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5idWlsZGluZyA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZXMoKS5maWx0ZXIoKGZpbGUpID0+IGZpbGUuZXh0ZW5zaW9uLnRvTG9jYWxlTG93ZXJDYXNlKCkgPT09IHRoaXMuZXh0ZW5zaW9uKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRQYXRocyA9IG5ldyBTZXQoZmlsZXMubWFwKChmaWxlKSA9PiBmaWxlLnBhdGgpKTtcbiAgICAgIGZvciAoY29uc3QgcGF0aCBvZiBPYmplY3Qua2V5cyh0aGlzLmRhdGEuZmlsZXMpKSB7XG4gICAgICAgIGlmICghY3VycmVudFBhdGhzLmhhcyhwYXRoKSkgZGVsZXRlIHRoaXMuZGF0YS5maWxlc1twYXRoXTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgICBjb25zdCBpbmRleGVkID0gdGhpcy5kYXRhLmZpbGVzW2ZpbGUucGF0aF07XG4gICAgICAgIGlmICghZm9yY2UgJiYgaW5kZXhlZCAmJiBpbmRleGVkLm10aW1lID09PSBmaWxlLnN0YXQubXRpbWUgJiYgaW5kZXhlZC5zaXplID09PSBmaWxlLnN0YXQuc2l6ZSkgY29udGludWU7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5kZXhGaWxlKGZpbGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5kYXRhLmdlbmVyYXRlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgdGhpcy5yZWFkeSA9IHRydWU7XG4gICAgICBhd2FpdCB0aGlzLnNhdmVOb3coKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5idWlsZGluZyA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW5kZXhGaWxlKGZpbGU6IFRGaWxlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNhY2hlZFJlYWQoZmlsZSk7XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHBhcnNlRG9jdW1lbnQoc291cmNlLCBmaWxlLmJhc2VuYW1lKTtcbiAgICAgIHRoaXMuZGF0YS5maWxlc1tmaWxlLnBhdGhdID0ge1xuICAgICAgICBtdGltZTogZmlsZS5zdGF0Lm10aW1lLFxuICAgICAgICBzaXplOiBmaWxlLnN0YXQuc2l6ZSxcbiAgICAgICAgdGl0bGU6IGRvY3VtZW50LnRpdGxlLFxuICAgICAgICBlbnRyaWVzOiBidWlsZFNlYXJjaEVudHJpZXMoZG9jdW1lbnQsIGZpbGUucGF0aClcbiAgICAgIH07XG4gICAgICB0aGlzLmRhdGEuZ2VuZXJhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICB0aGlzLnJlYWR5ID0gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKGBNaW5kTWFwIFN0dWRpbyBjb3VsZCBub3QgaW5kZXggJHtmaWxlLnBhdGh9YCwgZXJyb3IpO1xuICAgICAgZGVsZXRlIHRoaXMuZGF0YS5maWxlc1tmaWxlLnBhdGhdO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKCEoYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHModGhpcy5pbmRleFBhdGgpKSkge1xuICAgICAgICB0aGlzLnJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLnJlYWQodGhpcy5pbmRleFBhdGgpKSBhcyBQYXJ0aWFsPFBlcnNpc3RlZE1pbmRNYXBTZWFyY2hJbmRleD47XG4gICAgICBpZiAocGFyc2VkLnZlcnNpb24gPT09IDEgJiYgcGFyc2VkLmZpbGVzICYmIHR5cGVvZiBwYXJzZWQuZmlsZXMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgdGhpcy5kYXRhID0ge1xuICAgICAgICAgIHZlcnNpb246IDEsXG4gICAgICAgICAgZ2VuZXJhdGVkQXQ6IHR5cGVvZiBwYXJzZWQuZ2VuZXJhdGVkQXQgPT09IFwic3RyaW5nXCIgPyBwYXJzZWQuZ2VuZXJhdGVkQXQgOiBuZXcgRGF0ZSgwKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIGZpbGVzOiBwYXJzZWQuZmlsZXMgYXMgUmVjb3JkPHN0cmluZywgSW5kZXhlZE1pbmRNYXBGaWxlPlxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgdGhpcy5yZWFkeSA9IHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIk1pbmRNYXAgU3R1ZGlvIGNvdWxkIG5vdCBsb2FkIHRoZSBnbG9iYWwgc2VhcmNoIGluZGV4XCIsIGVycm9yKTtcbiAgICAgIHRoaXMuZGF0YSA9IHsgdmVyc2lvbjogMSwgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKDApLnRvSVNPU3RyaW5nKCksIGZpbGVzOiB7fSB9O1xuICAgICAgdGhpcy5yZWFkeSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzY2hlZHVsZVNhdmUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2F2ZVRpbWVyICE9PSBudWxsKSB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuc2F2ZVRpbWVyKTtcbiAgICB0aGlzLnNhdmVUaW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuc2F2ZVRpbWVyID0gbnVsbDtcbiAgICAgIHZvaWQgdGhpcy5zYXZlTm93KCk7XG4gICAgfSwgODAwKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2F2ZU5vdygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci53cml0ZSh0aGlzLmluZGV4UGF0aCwgSlNPTi5zdHJpbmdpZnkodGhpcy5kYXRhKSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIk1pbmRNYXAgU3R1ZGlvIGNvdWxkIG5vdCBzYXZlIHRoZSBnbG9iYWwgc2VhcmNoIGluZGV4XCIsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kSGlnaGxpZ2h0ZWRUZXh0KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHRleHQ6IHN0cmluZywgcXVlcnk6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBwaHJhc2UgPSBxdWVyeS50cmltKCk7XG4gIGlmICghcGhyYXNlKSB7XG4gICAgY29udGFpbmVyLnNldFRleHQodGV4dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGxvd2VyVGV4dCA9IHRleHQudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgY29uc3QgbG93ZXJQaHJhc2UgPSBwaHJhc2UudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgY29uc3QgaW5kZXggPSBsb3dlclRleHQuaW5kZXhPZihsb3dlclBocmFzZSk7XG4gIGlmIChpbmRleCA8IDApIHtcbiAgICBjb250YWluZXIuc2V0VGV4dCh0ZXh0KTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGluZGV4ID4gMCkgY29udGFpbmVyLmFwcGVuZFRleHQodGV4dC5zbGljZSgwLCBpbmRleCkpO1xuICBjb250YWluZXIuY3JlYXRlRWwoXCJtYXJrXCIsIHsgdGV4dDogdGV4dC5zbGljZShpbmRleCwgaW5kZXggKyBwaHJhc2UubGVuZ3RoKSB9KTtcbiAgaWYgKGluZGV4ICsgcGhyYXNlLmxlbmd0aCA8IHRleHQubGVuZ3RoKSBjb250YWluZXIuYXBwZW5kVGV4dCh0ZXh0LnNsaWNlKGluZGV4ICsgcGhyYXNlLmxlbmd0aCkpO1xufVxuXG5leHBvcnQgY2xhc3MgR2xvYmFsTWluZE1hcFNlYXJjaE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIGlucHV0RWwhOiBIVE1MSW5wdXRFbGVtZW50O1xuICBwcml2YXRlIHJlc3VsdHNFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHN1bW1hcnlFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIGFjdGl2ZUluZGV4ID0gLTE7XG4gIHByaXZhdGUgcmVuZGVyZWRSZXN1bHRzOiBNaW5kTWFwU2VhcmNoUmVzdWx0W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGluZGV4OiBNaW5kTWFwU2VhcmNoSW5kZXgsXG4gICAgcHJpdmF0ZSByZWFkb25seSBtYXhSZXN1bHRzOiBudW1iZXIsXG4gICAgcHJpdmF0ZSByZWFkb25seSBvbk9wZW5SZXN1bHQ6IChyZXN1bHQ6IE1pbmRNYXBTZWFyY2hSZXN1bHQpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb25SZWJ1aWxkOiAoKSA9PiBQcm9taXNlPHZvaWQ+XG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy5tb2RhbEVsLmFkZENsYXNzKFwibW1zLWdsb2JhbC1zZWFyY2gtbW9kYWxcIik7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJcdTUxNjhcdTVDNDBcdTY0MUNcdTdEMjJcdTYwMURcdTdFRjRcdTVCRkNcdTU2RkVcIik7XG4gICAgY29uc3Qgc2VhcmNoUm93ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1nbG9iYWwtc2VhcmNoLXJvd1wiIH0pO1xuICAgIGNvbnN0IGljb24gPSBzZWFyY2hSb3cuY3JlYXRlU3Bhbih7IGNsczogXCJtbXMtZ2xvYmFsLXNlYXJjaC1pY29uXCIgfSk7XG4gICAgc2V0SWNvbihpY29uLCBcInNlYXJjaFwiKTtcbiAgICB0aGlzLmlucHV0RWwgPSBzZWFyY2hSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInNlYXJjaFwiLFxuICAgICAgY2xzOiBcIm1tcy1nbG9iYWwtc2VhcmNoLWlucHV0XCIsXG4gICAgICBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIlx1NjQxQ1x1N0QyMlx1NjI0MFx1NjcwOVx1NUJGQ1x1NTZGRVx1MzAwMVx1NUI1MFx1ODI4Mlx1NzBCOVx1NTQ4Q1x1NUI1MFx1NUJGQ1x1NTZGRVx1MjAyNlwiLCBhdXRvY29tcGxldGU6IFwib2ZmXCIsIHNwZWxsY2hlY2s6IFwiZmFsc2VcIiB9XG4gICAgfSk7XG4gICAgY29uc3QgcmVidWlsZCA9IHNlYXJjaFJvdy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbXMtZ2xvYmFsLXNlYXJjaC1yZWJ1aWxkXCIsIGF0dHI6IHsgdHlwZTogXCJidXR0b25cIiwgdGl0bGU6IFwiXHU5MUNEXHU1RUZBXHU2NDFDXHU3RDIyXHU3RDIyXHU1RjE1XCIgfSB9KTtcbiAgICBzZXRJY29uKHJlYnVpbGQsIFwicmVmcmVzaC1jd1wiKTtcbiAgICB0aGlzLnN1bW1hcnlFbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtbXMtZ2xvYmFsLXNlYXJjaC1zdW1tYXJ5XCIgfSk7XG4gICAgdGhpcy5yZXN1bHRzRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWdsb2JhbC1zZWFyY2gtcmVzdWx0c1wiIH0pO1xuXG4gICAgY29uc3QgcmVuZGVyID0gKCk6IHZvaWQgPT4gdGhpcy5yZW5kZXJSZXN1bHRzKHRoaXMuaW5wdXRFbC52YWx1ZSk7XG4gICAgdGhpcy5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCByZW5kZXIpO1xuICAgIHRoaXMuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09IFwiQXJyb3dEb3duXCIpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5tb3ZlQWN0aXZlKDEpO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT09IFwiQXJyb3dVcFwiKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMubW92ZUFjdGl2ZSgtMSk7XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVuZGVyZWRSZXN1bHRzW3RoaXMuYWN0aXZlSW5kZXggPj0gMCA/IHRoaXMuYWN0aXZlSW5kZXggOiAwXTtcbiAgICAgICAgaWYgKHJlc3VsdCkgdm9pZCB0aGlzLm9wZW5SZXN1bHQocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZWJ1aWxkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICByZWJ1aWxkLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuc3VtbWFyeUVsLnNldFRleHQoXCJcdTZCNjNcdTU3MjhcdTkxQ0RcdTVFRkFcdTdEMjJcdTVGMTVcdTIwMjZcIik7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLm9uUmVidWlsZCgpO1xuICAgICAgICBuZXcgTm90aWNlKFwiXHU2MDFEXHU3RUY0XHU1QkZDXHU1NkZFXHU2NDFDXHU3RDIyXHU3RDIyXHU1RjE1XHU1REYyXHU5MUNEXHU1RUZBXCIpO1xuICAgICAgICByZW5kZXIoKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHJlYnVpbGQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLnJlbmRlclJlc3VsdHMoXCJcIik7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbnB1dEVsLmZvY3VzKCksIDIwKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUmVzdWx0cyhxdWVyeTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5yZXN1bHRzRWwuZW1wdHkoKTtcbiAgICB0aGlzLmFjdGl2ZUluZGV4ID0gLTE7XG4gICAgY29uc3Qgc3RhdHVzID0gdGhpcy5pbmRleC5nZXRTdGF0dXMoKTtcbiAgICBjb25zdCB0cmltbWVkID0gcXVlcnkudHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkge1xuICAgICAgdGhpcy5yZW5kZXJlZFJlc3VsdHMgPSBbXTtcbiAgICAgIHRoaXMuc3VtbWFyeUVsLnNldFRleHQoc3RhdHVzLmJ1aWxkaW5nXG4gICAgICAgID8gYFx1NkI2M1x1NTcyOFx1NUVGQVx1N0FDQlx1N0QyMlx1NUYxNVx1RkYwQ1x1NURGMlx1NjUzNlx1NUY1NSAke3N0YXR1cy5maWxlc30gXHU0RTJBXHU1QkZDXHU1NkZFXHUzMDAxJHtzdGF0dXMubm9kZXN9IFx1NEUyQVx1ODI4Mlx1NzBCOVx1MjAyNmBcbiAgICAgICAgOiBgXHU1REYyXHU3RDIyXHU1RjE1ICR7c3RhdHVzLmZpbGVzfSBcdTRFMkFcdTVCRkNcdTU2RkVcdTMwMDEke3N0YXR1cy5ub2Rlc30gXHU0RTJBXHU4MjgyXHU3MEI5XHUzMDAyXHU4RjkzXHU1MTY1XHU1MTczXHU5NTJFXHU4QkNEXHU1RjAwXHU1OUNCXHU2NDFDXHU3RDIyXHUzMDAyYCk7XG4gICAgICBjb25zdCBoaW50ID0gdGhpcy5yZXN1bHRzRWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1nbG9iYWwtc2VhcmNoLWVtcHR5XCIgfSk7XG4gICAgICBoaW50LmNyZWF0ZURpdih7IHRleHQ6IFwiXHU2NDFDXHU3RDIyXHU4MzAzXHU1NkY0XCIgfSk7XG4gICAgICBoaW50LmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiXHU4MjgyXHU3MEI5XHU2NTg3XHU1QjU3XHUzMDAxXHU1QkNDXHU2NTg3XHU2NzJDXHUzMDAxXHU1OTA3XHU2Q0U4XHUzMDAxXHU2ODA3XHU3QjdFXHUzMDAxXHU4ODY4XHU2ODNDXHUzMDAxXHU0RUUzXHU3ODAxXHUzMDAxXHU5NEZFXHU2M0E1XHUzMDAxXHU2Mjk4XHU1M0UwXHU1MjA2XHU2NTJGXHU1NDhDXHU2MjQwXHU2NzA5XHU1QjUwXHU1QkZDXHU1NkZFXHUzMDAyXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZW5kZXJlZFJlc3VsdHMgPSB0aGlzLmluZGV4LnNlYXJjaCh0cmltbWVkLCB0aGlzLm1heFJlc3VsdHMpO1xuICAgIHRoaXMuc3VtbWFyeUVsLnNldFRleHQoYFx1NjI3RVx1NTIzMCAke3RoaXMucmVuZGVyZWRSZXN1bHRzLmxlbmd0aH0ke3RoaXMucmVuZGVyZWRSZXN1bHRzLmxlbmd0aCA+PSB0aGlzLm1heFJlc3VsdHMgPyBcIitcIiA6IFwiXCJ9IFx1NEUyQVx1N0VEM1x1Njc5QyBcdTAwQjcgXHU3RDIyXHU1RjE1ICR7c3RhdHVzLmZpbGVzfSBcdTRFMkFcdTVCRkNcdTU2RkUgLyAke3N0YXR1cy5ub2Rlc30gXHU0RTJBXHU4MjgyXHU3MEI5YCk7XG4gICAgaWYgKCF0aGlzLnJlbmRlcmVkUmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVzdWx0c0VsLmNyZWF0ZURpdih7IGNsczogXCJtbXMtZ2xvYmFsLXNlYXJjaC1lbXB0eVwiLCB0ZXh0OiBzdGF0dXMuYnVpbGRpbmcgPyBcIlx1N0QyMlx1NUYxNVx1NEVDRFx1NTcyOFx1NUVGQVx1N0FDQlx1RkYwQ1x1OEJGN1x1N0EwRFx1NTQwRVx1OTFDRFx1OEJENVx1MzAwMlwiIDogXCJcdTZDQTFcdTY3MDlcdTUzMzlcdTkxNERcdTdFRDNcdTY3OUNcdTMwMDJcIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlcmVkUmVzdWx0cy5mb3JFYWNoKChyZXN1bHQsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBidXR0b24gPSB0aGlzLnJlc3VsdHNFbC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtbXMtZ2xvYmFsLXNlYXJjaC1yZXN1bHRcIiwgYXR0cjogeyB0eXBlOiBcImJ1dHRvblwiIH0gfSk7XG4gICAgICBjb25zdCBoZWFkZXIgPSBidXR0b24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1nbG9iYWwtc2VhcmNoLXJlc3VsdC1oZWFkZXJcIiB9KTtcbiAgICAgIGNvbnN0IHRpdGxlID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogXCJtbXMtZ2xvYmFsLXNlYXJjaC1yZXN1bHQtdGl0bGVcIiB9KTtcbiAgICAgIGFwcGVuZEhpZ2hsaWdodGVkVGV4dCh0aXRsZSwgcmVzdWx0Lm5vZGVUZXh0LCB0cmltbWVkKTtcbiAgICAgIGNvbnN0IGJhZGdlcyA9IGhlYWRlci5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWdsb2JhbC1zZWFyY2gtcmVzdWx0LWJhZGdlc1wiIH0pO1xuICAgICAgYmFkZ2VzLmNyZWF0ZVNwYW4oeyBjbHM6IFwibW1zLWdsb2JhbC1zZWFyY2gtYmFkZ2VcIiwgdGV4dDogcmVzdWx0Lm1hdGNoZWRLaW5kIH0pO1xuICAgICAgaWYgKHJlc3VsdC5pc1N1Ym1hcERvY3VtZW50KSBiYWRnZXMuY3JlYXRlU3Bhbih7IGNsczogXCJtbXMtZ2xvYmFsLXNlYXJjaC1iYWRnZSBpcy1zdWJtYXBcIiwgdGV4dDogXCJcdTVCNTBcdTVCRkNcdTU2RkVcIiB9KTtcbiAgICAgIGNvbnN0IGZpbGUgPSBidXR0b24uY3JlYXRlRGl2KHsgY2xzOiBcIm1tcy1nbG9iYWwtc2VhcmNoLXJlc3VsdC1maWxlXCIgfSk7XG4gICAgICBmaWxlLmNyZWF0ZVNwYW4oeyB0ZXh0OiByZXN1bHQuZmlsZVRpdGxlIH0pO1xuICAgICAgZmlsZS5jcmVhdGVTcGFuKHsgY2xzOiBcIm1tcy1nbG9iYWwtc2VhcmNoLXJlc3VsdC1wYXRoXCIsIHRleHQ6IHJlc3VsdC5maWxlUGF0aCB9KTtcbiAgICAgIGJ1dHRvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWdsb2JhbC1zZWFyY2gtcmVzdWx0LWJyZWFkY3J1bWJcIiwgdGV4dDogcmVzdWx0LmJyZWFkY3J1bWIuam9pbihcIiBcdTIwM0EgXCIpIH0pO1xuICAgICAgaWYgKHJlc3VsdC5zbmlwcGV0ICYmIHJlc3VsdC5zbmlwcGV0ICE9PSByZXN1bHQubm9kZVRleHQpIHtcbiAgICAgICAgY29uc3Qgc25pcHBldCA9IGJ1dHRvbi5jcmVhdGVEaXYoeyBjbHM6IFwibW1zLWdsb2JhbC1zZWFyY2gtcmVzdWx0LXNuaXBwZXRcIiB9KTtcbiAgICAgICAgYXBwZW5kSGlnaGxpZ2h0ZWRUZXh0KHNuaXBwZXQsIHJlc3VsdC5zbmlwcGV0LCB0cmltbWVkKTtcbiAgICAgIH1cbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwibW91c2VlbnRlclwiLCAoKSA9PiB0aGlzLnNldEFjdGl2ZShpbmRleCkpO1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB2b2lkIHRoaXMub3BlblJlc3VsdChyZXN1bHQpKTtcbiAgICB9KTtcbiAgICB0aGlzLnNldEFjdGl2ZSgwKTtcbiAgfVxuXG4gIHByaXZhdGUgbW92ZUFjdGl2ZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnJlbmRlcmVkUmVzdWx0cy5sZW5ndGgpIHJldHVybjtcbiAgICBjb25zdCBuZXh0ID0gdGhpcy5hY3RpdmVJbmRleCA8IDAgPyAwIDogKHRoaXMuYWN0aXZlSW5kZXggKyBkZWx0YSArIHRoaXMucmVuZGVyZWRSZXN1bHRzLmxlbmd0aCkgJSB0aGlzLnJlbmRlcmVkUmVzdWx0cy5sZW5ndGg7XG4gICAgdGhpcy5zZXRBY3RpdmUobmV4dCk7XG4gIH1cblxuICBwcml2YXRlIHNldEFjdGl2ZShpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5hY3RpdmVJbmRleCA9IGluZGV4O1xuICAgIGNvbnN0IGJ1dHRvbnMgPSBBcnJheS5mcm9tKHRoaXMucmVzdWx0c0VsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEJ1dHRvbkVsZW1lbnQ+KFwiLm1tcy1nbG9iYWwtc2VhcmNoLXJlc3VsdFwiKSk7XG4gICAgYnV0dG9ucy5mb3JFYWNoKChidXR0b24sIGJ1dHRvbkluZGV4KSA9PiBidXR0b24udG9nZ2xlQ2xhc3MoXCJpcy1hY3RpdmVcIiwgYnV0dG9uSW5kZXggPT09IGluZGV4KSk7XG4gICAgYnV0dG9uc1tpbmRleF0/LnNjcm9sbEludG9WaWV3KHsgYmxvY2s6IFwibmVhcmVzdFwiIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvcGVuUmVzdWx0KHJlc3VsdDogTWluZE1hcFNlYXJjaFJlc3VsdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICBhd2FpdCB0aGlzLm9uT3BlblJlc3VsdChyZXN1bHQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQVVPOzs7QUMrSkEsSUFBTSxxQkFB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QUFLLGNBQWMsSUFBSSxFQUFHO0FBQzNELFlBQU0sUUFBUSxlQUFlO0FBQzdCLFVBQUk7QUFDRixjQUFNLFNBQVMsTUFBTSxLQUFLLElBQUksTUFBTSxXQUFXLElBQUk7QUFDbkQsY0FBTUQsWUFBVyxjQUFjLFFBQVEsS0FBSyxRQUFRO0FBQ3BELDRCQUFvQixPQUFPQSxXQUFVLEVBQUUsS0FBSyxLQUFLLEtBQUssTUFBTSxXQUFXLEtBQUssU0FBUyxnQkFBZ0IsbUJBQW1CLHFCQUFxQixLQUFLLFFBQVEsRUFBRSxDQUFDO0FBQUEsTUFDL0osU0FBUyxPQUFPO0FBQ2QsZ0JBQVEsTUFBTSxzQ0FBc0MsS0FBSztBQUN6RCxjQUFNLE1BQU07QUFDWixjQUFNLFVBQVUsRUFBRSxLQUFLLG1CQUFtQixNQUFNLCtEQUFhLENBQUM7QUFBQSxNQUNoRTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJub3JtYWxpemVkIiwgInRleHQiLCAiX2EiLCAiY29tcGFjdCIsICJfYiIsICJfYSIsICJfYiIsICJ3aWR0aCIsICJfYyIsICJiYWNrZ3JvdW5kIiwgImRvY3VtZW50IiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9hIiwgIl9iIiwgIl9jIiwgIl9kIiwgIl9lIiwgIl9mIiwgIl9nIiwgIl9oIiwgIl9pIiwgIl9qIiwgImRvY3VtZW50IiwgIm5vcm1hbGl6ZWQiLCAic2VsZWN0ZWQiLCAiZG9jdW1lbnQiLCAiX2EiLCAiX2IiLCAiX2MiLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIl9iIiwgImRvY3VtZW50IiwgIl9hIiwgImRvY3VtZW50IiwgIm5vcm1hbGl6ZWQiXQp9Cg==
