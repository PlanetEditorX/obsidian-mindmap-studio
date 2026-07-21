export type LayoutMode = "right" | "balanced";
export type ThemeMode = "auto" | "light" | "dark";
export type NodeShape = "rounded" | "pill" | "rectangle";
export type TaskStatus = "todo" | "doing" | "done";
export type BackgroundPattern = "none" | "grid" | "dots";
export type EdgeStyle = "curved" | "straight" | "elbow";
export type EdgeWidthMode = "uniform" | "tapered";
export type MindMapThemePresetId =
  | "classic-indigo"
  | "ocean-blue"
  | "forest-green"
  | "sunset-orange"
  | "lavender-dream"
  | "candy-pop"
  | "paper-note"
  | "minimal-ink"
  | "dark-neon"
  | "mint-clean";
export type FontFamilyMode = "obsidian" | "sans" | "serif" | "mono" | "custom";
export type TableAlignment = "left" | "center" | "right";

export interface MindMapTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
}

export interface MindMapTextRun {
  text: string;
  style?: MindMapTextStyle;
}

export interface MindMapTable {
  headers: string[];
  rows: string[][];
  alignments?: TableAlignment[];
  source?: "manual" | "markdown" | "children";
}

export interface MindMapCodeBlock {
  language?: string;
  code: string;
}

export interface MindMapTextContentBlock {
  id: string;
  type: "text";
  text: string;
  richText?: MindMapTextRun[];
}

export interface MindMapImageRemoteSource {
  hostId: string;
  hostName?: string;
  url: string;
  uploadedAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  failureCount?: number;
}

export interface MindMapImageSourceCandidate {
  source: string;
  label: string;
  hostId?: string;
  hostName?: string;
  kind: "current" | "remote" | "local";
}

export interface MindMapImageContentBlock {
  id: string;
  type: "image";
  source: string;
  alt?: string;
  /** Original local vault path retained until every selected image host succeeds. */
  localSource?: string;
  /** Mirror URLs returned by one or more configured image hosts. */
  remoteSources?: MindMapImageRemoteSource[];
}

export type MindMapContentBlock = MindMapTextContentBlock | MindMapImageContentBlock;

export interface MindMapSubmap {
  path: string;
  title?: string;
}

export interface MindMapNavigation {
  parentPath: string;
  parentNodeId?: string;
  parentTitle?: string;
  parentNodeText?: string;
}

export interface MindMapAppearance {
  themePreset?: MindMapThemePresetId;
  backgroundColor?: string;
  backgroundPattern?: BackgroundPattern;
  patternColor?: string;
  fontFamily?: FontFamilyMode;
  customFont?: string;
  fontSize?: number;
  edgeColor?: string;
  edgeWidth?: number;
  edgeStyle?: EdgeStyle;
  edgeWidthMode?: EdgeWidthMode;
  edgeMinWidth?: number;
  rootColor?: string;
  rootTextColor?: string;
  colorfulBranches?: boolean;
  branchColors?: string[];
  nodeColor?: string;
  textColor?: string;
  nodeBorderColor?: string;
  nodeBorderWidth?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface MindMapNodeStyle {
  color?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shape?: NodeShape;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
}

export interface MindMapNode {
  id: string;
  text: string;
  richText?: MindMapTextRun[];
  /** Ordered text and image blocks. Legacy text/richText/image fields remain for compatibility. */
  content?: MindMapContentBlock[];
  note?: string;
  link?: string;
  image?: string;
  table?: MindMapTable;
  code?: MindMapCodeBlock;
  submap?: MindMapSubmap;
  icon?: string;
  tags?: string[];
  task?: TaskStatus;
  style?: MindMapNodeStyle;
  collapsed?: boolean;
  children: MindMapNode[];
}

export interface MindMapDocument {
  version: 9;
  title: string;
  layout: LayoutMode;
  theme: ThemeMode;
  appearance?: MindMapAppearance;
  navigation?: MindMapNavigation;
  root: MindMapNode;
}

export interface TaskProgress {
  done: number;
  total: number;
}

export const MINDMAP_CODE_BLOCK = "mindmap-json";
const LEGACY_CODE_BLOCKS = ["smm-json", "mmc-json"] as const;

export function newId(): string {
  const random = Math.random().toString(36).slice(2, 9);
  return `n_${Date.now().toString(36)}_${random}`;
}

export function createNode(text = "新节点"): MindMapNode {
  return { id: newId(), text, children: [] };
}

export function createDefaultDocument(title = "新思维导图"): MindMapDocument {
  return {
    version: 9,
    title,
    layout: "right",
    theme: "auto",
    root: {
      id: newId(),
      text: title,
      children: [
        { id: newId(), text: "主题 1", children: [] },
        { id: newId(), text: "主题 2", children: [] }
      ]
    }
  };
}

function normalizeColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : undefined;
}

function normalizeNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

function normalizeBooleanOverride(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeAppearance(input: Partial<MindMapAppearance> | undefined): MindMapAppearance | undefined {
  if (!input) return undefined;
  const backgroundPattern: BackgroundPattern | undefined = input.backgroundPattern === "none" || input.backgroundPattern === "grid" || input.backgroundPattern === "dots"
    ? input.backgroundPattern
    : undefined;
  const fontFamily: FontFamilyMode | undefined = input.fontFamily === "obsidian" || input.fontFamily === "sans" || input.fontFamily === "serif" || input.fontFamily === "mono" || input.fontFamily === "custom"
    ? input.fontFamily
    : undefined;
  const edgeStyle: EdgeStyle | undefined = input.edgeStyle === "curved" || input.edgeStyle === "straight" || input.edgeStyle === "elbow"
    ? input.edgeStyle
    : undefined;
  const edgeWidthMode: EdgeWidthMode | undefined = input.edgeWidthMode === "uniform" || input.edgeWidthMode === "tapered"
    ? input.edgeWidthMode
    : undefined;
  const themePreset: MindMapThemePresetId | undefined = [
    "classic-indigo", "ocean-blue", "forest-green", "sunset-orange", "lavender-dream",
    "candy-pop", "paper-note", "minimal-ink", "dark-neon", "mint-clean"
  ].includes(String(input.themePreset)) ? input.themePreset as MindMapThemePresetId : undefined;
  const branchColors = Array.isArray(input.branchColors)
    ? input.branchColors.map(normalizeColor).filter((color): color is string => Boolean(color)).slice(0, 12)
    : undefined;
  const customFont = typeof input.customFont === "string" && input.customFont.trim()
    ? input.customFont.trim().slice(0, 120)
    : undefined;
  const appearance: MindMapAppearance = {
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
    branchColors: branchColors?.length ? branchColors : undefined,
    nodeColor: normalizeColor(input.nodeColor),
    textColor: normalizeColor(input.textColor),
    nodeBorderColor: normalizeColor(input.nodeBorderColor),
    nodeBorderWidth: normalizeNumber(input.nodeBorderWidth, 0, 6),
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline)
  };
  return Object.values(appearance).some((value) => value !== undefined) ? appearance : undefined;
}

export function mergeAppearance(base: MindMapAppearance | undefined, override: MindMapAppearance | undefined): MindMapAppearance {
  return { ...(base ?? {}), ...(override ?? {}) };
}

function normalizeStyle(input: Partial<MindMapNodeStyle> | undefined): MindMapNodeStyle | undefined {
  if (!input) return undefined;
  const shape: NodeShape | undefined = input.shape === "pill" || input.shape === "rectangle" || input.shape === "rounded"
    ? input.shape
    : undefined;
  const style: MindMapNodeStyle = {
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
  return Object.values(style).some((value) => value !== undefined) ? style : undefined;
}

function normalizeTextStyle(input: Partial<MindMapTextStyle> | undefined): MindMapTextStyle | undefined {
  if (!input) return undefined;
  const style: MindMapTextStyle = {
    bold: normalizeBooleanOverride(input.bold),
    italic: normalizeBooleanOverride(input.italic),
    underline: normalizeBooleanOverride(input.underline),
    strike: normalizeBooleanOverride(input.strike),
    color: normalizeColor(input.color)
  };
  return Object.values(style).some((value) => value !== undefined) ? style : undefined;
}

function textStyleKey(style: MindMapTextStyle | undefined): string {
  return JSON.stringify(style ?? {});
}

export function normalizeRichText(input: unknown, fallbackText = ""): MindMapTextRun[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const runs: MindMapTextRun[] = [];
  for (const raw of input.slice(0, 500)) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Partial<MindMapTextRun>;
    if (typeof candidate.text !== "string" || !candidate.text) continue;
    const text = candidate.text.replace(/\r?\n/g, " ").slice(0, 10000);
    if (!text) continue;
    const style = normalizeTextStyle(candidate.style);
    const previous = runs.at(-1);
    if (previous && textStyleKey(previous.style) === textStyleKey(style)) previous.text += text;
    else runs.push({ text, style });
  }
  if (!runs.length) return undefined;

  const combined = runs.map((run) => run.text).join("");
  const leading = combined.length - combined.trimStart().length;
  const trailing = combined.length - combined.trimEnd().length;
  if (leading || trailing) {
    let start = leading;
    let remaining = combined.length - leading - trailing;
    const trimmed: MindMapTextRun[] = [];
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

  if (!runs.length) return fallbackText.trim() ? [{ text: fallbackText.trim() }] : undefined;
  return runs.some((run) => run.style && Object.values(run.style).some((value) => value !== undefined)) ? runs : undefined;
}

export function richTextPlainText(runs: MindMapTextRun[] | undefined, fallbackText = ""): string {
  return runs?.map((run) => run.text).join("") ?? fallbackText;
}

export function richTextCharacterStyles(runs: MindMapTextRun[] | undefined, fallbackText = ""): MindMapTextStyle[] {
  const text = richTextPlainText(runs, fallbackText);
  const styles: MindMapTextStyle[] = Array.from({ length: text.length }, () => ({}));
  if (!runs?.length) return styles;
  let offset = 0;
  for (const run of runs) {
    const style = run.style ? { ...run.style } : {};
    const end = Math.min(text.length, offset + run.text.length);
    for (let index = offset; index < end; index += 1) styles[index] = { ...style };
    offset = end;
  }
  return styles;
}

export function characterStylesToRichText(text: string, styles: MindMapTextStyle[]): MindMapTextRun[] | undefined {
  if (!text) return undefined;
  const runs: MindMapTextRun[] = [];
  let start = 0;
  let current = normalizeTextStyle(styles[0]);
  for (let index = 1; index <= text.length; index += 1) {
    const next = index < text.length ? normalizeTextStyle(styles[index]) : undefined;
    if (index < text.length && textStyleKey(current) === textStyleKey(next)) continue;
    const segment = text.slice(start, index);
    if (segment) runs.push({ text: segment, style: current });
    start = index;
    current = next;
  }
  return normalizeRichText(runs, text);
}

export function reconcileRichTextAfterEdit(
  previousText: string,
  previousRuns: MindMapTextRun[] | undefined,
  nextText: string
): MindMapTextRun[] | undefined {
  if (previousText === nextText) return normalizeRichText(previousRuns, nextText);
  const previousStyles = richTextCharacterStyles(previousRuns, previousText);
  const nextStyles: MindMapTextStyle[] = Array.from({ length: nextText.length }, () => ({}));
  let prefix = 0;
  while (prefix < previousText.length && prefix < nextText.length && previousText[prefix] === nextText[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < previousText.length - prefix
    && suffix < nextText.length - prefix
    && previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) suffix += 1;
  for (let index = 0; index < prefix; index += 1) nextStyles[index] = { ...(previousStyles[index] ?? {}) };
  for (let index = 0; index < suffix; index += 1) {
    const previousIndex = previousText.length - suffix + index;
    const nextIndex = nextText.length - suffix + index;
    nextStyles[nextIndex] = { ...(previousStyles[previousIndex] ?? {}) };
  }
  return characterStylesToRichText(nextText, nextStyles);
}

export function applyRichTextStyleRange(
  text: string,
  runs: MindMapTextRun[] | undefined,
  start: number,
  end: number,
  patch: Partial<MindMapTextStyle> | null
): MindMapTextRun[] | undefined {
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


function normalizeContentBlock(input: unknown): MindMapContentBlock | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<MindMapContentBlock>;
  const id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : newId();
  if (candidate.type === "image") {
    const image = candidate as Partial<MindMapImageContentBlock>;
    const source = typeof image.source === "string" ? image.source.trim().slice(0, 2000) : "";
    if (!source) return null;
    const alt = typeof image.alt === "string" && image.alt.trim() ? image.alt.trim().slice(0, 500) : undefined;
    const localSource = typeof image.localSource === "string" && image.localSource.trim()
      ? image.localSource.trim().slice(0, 2000)
      : undefined;
    const remoteSources = Array.isArray(image.remoteSources)
      ? image.remoteSources.slice(0, 12).flatMap((raw) => {
        if (!raw || typeof raw !== "object") return [];
        const item = raw as Partial<MindMapImageRemoteSource>;
        const hostId = typeof item.hostId === "string" ? item.hostId.trim().slice(0, 160) : "";
        const url = typeof item.url === "string" ? item.url.trim().slice(0, 4000) : "";
        if (!hostId || !/^https?:\/\//i.test(url)) return [];
        return [{
          hostId,
          hostName: typeof item.hostName === "string" && item.hostName.trim() ? item.hostName.trim().slice(0, 200) : undefined,
          url,
          uploadedAt: typeof item.uploadedAt === "string" && item.uploadedAt.trim() ? item.uploadedAt.trim().slice(0, 80) : undefined,
          lastSuccessAt: typeof item.lastSuccessAt === "string" && item.lastSuccessAt.trim() ? item.lastSuccessAt.trim().slice(0, 80) : undefined,
          lastFailureAt: typeof item.lastFailureAt === "string" && item.lastFailureAt.trim() ? item.lastFailureAt.trim().slice(0, 80) : undefined,
          failureCount: typeof item.failureCount === "number" && Number.isFinite(item.failureCount)
            ? Math.max(0, Math.min(1000000, Math.floor(item.failureCount)))
            : undefined
        }];
      })
      : undefined;
    return { id, type: "image", source, alt, localSource, remoteSources: remoteSources?.length ? remoteSources : undefined };
  }
  if (candidate.type === "text") {
    const fallbackText = typeof candidate.text === "string" ? candidate.text.replace(/\r?\n/g, " ").slice(0, 20000) : "";
    const richText = normalizeRichText(candidate.richText, fallbackText);
    const text = richTextPlainText(richText, fallbackText);
    return { id, type: "text", text, richText };
  }
  return null;
}

export function imageSourceCandidates(block: MindMapImageContentBlock, includeLocal = true): MindMapImageSourceCandidate[] {
  const candidates: MindMapImageSourceCandidate[] = [];
  const seen = new Set<string>();
  const add = (candidate: MindMapImageSourceCandidate): void => {
    const source = candidate.source.trim();
    if (!source || seen.has(source)) return;
    seen.add(source);
    candidates.push({ ...candidate, source });
  };

  const currentRemote = block.remoteSources?.find((item) => item.url === block.source);
  add({
    source: block.source,
    label: currentRemote?.hostName || (currentRemote ? "当前图床" : "当前图片"),
    hostId: currentRemote?.hostId,
    hostName: currentRemote?.hostName,
    kind: "current"
  });
  const remotes = block.remoteSources ?? [];
  const currentIndex = remotes.findIndex((item) => item.url === block.source);
  const orderedRemotes = currentIndex >= 0
    ? [...remotes.slice(currentIndex + 1), ...remotes.slice(0, currentIndex)]
    : remotes;
  for (const remote of orderedRemotes) {
    add({
      source: remote.url,
      label: remote.hostName || "备用图床",
      hostId: remote.hostId,
      hostName: remote.hostName,
      kind: "remote"
    });
  }
  if (includeLocal && block.localSource) {
    add({ source: block.localSource, label: "本地副本", kind: "local" });
  }
  return candidates;
}

export function nodeContentBlocks(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): MindMapContentBlock[] {
  if (Array.isArray(node.content) && node.content.length) {
    const normalized = node.content.map(normalizeContentBlock).filter((block): block is MindMapContentBlock => Boolean(block));
    if (normalized.length) return normalized;
  }
  const blocks: MindMapContentBlock[] = [];
  if (node.image?.trim()) blocks.push({ id: newId(), type: "image", source: node.image.trim(), alt: node.text || undefined });
  if (node.text || node.richText?.length) {
    const richText = normalizeRichText(node.richText, node.text);
    blocks.push({ id: newId(), type: "text", text: richTextPlainText(richText, node.text), richText });
  }
  return blocks;
}

export function nodePlainText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string {
  const blocks = nodeContentBlocks(node);
  return blocks.filter((block): block is MindMapTextContentBlock => block.type === "text").map((block) => block.text).join(" ").trim();
}

export function syncNodeLegacyFields(node: MindMapNode): void {
  const blocks = nodeContentBlocks(node);
  node.content = blocks.length ? blocks : undefined;
  const textBlocks = blocks.filter((block): block is MindMapTextContentBlock => block.type === "text");
  const imageBlocks = blocks.filter((block): block is MindMapImageContentBlock => block.type === "image");
  node.text = textBlocks.map((block) => block.text).join(" ").trim();
  node.richText = textBlocks.length === 1 ? normalizeRichText(textBlocks[0]?.richText, textBlocks[0]?.text ?? "") : undefined;
  node.image = imageBlocks[0]?.source;
}


function normalizeCell(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 2000) : String(value ?? "").trim().slice(0, 2000);
}

function normalizeTable(input: Partial<MindMapTable> | undefined): MindMapTable | undefined {
  if (!input || !Array.isArray(input.headers)) return undefined;
  const headers = input.headers.map(normalizeCell).slice(0, 12);
  if (!headers.length) return undefined;
  const rows = Array.isArray(input.rows)
    ? input.rows.slice(0, 100).map((row) => {
      const values = Array.isArray(row) ? row.map(normalizeCell).slice(0, headers.length) : [];
      while (values.length < headers.length) values.push("");
      return values;
    })
    : [];
  const alignments = Array.isArray(input.alignments)
    ? input.alignments.slice(0, headers.length).map((value) => value === "center" || value === "right" ? value : "left")
    : undefined;
  const source = input.source === "markdown" || input.source === "children" ? input.source : "manual";
  return { headers, rows, alignments, source };
}

function normalizeCode(input: Partial<MindMapCodeBlock> | undefined): MindMapCodeBlock | undefined {
  if (!input || typeof input.code !== "string" || !input.code.trim()) return undefined;
  const language = typeof input.language === "string" && input.language.trim()
    ? input.language.trim().replace(/[^a-z0-9_+#.-]/gi, "").slice(0, 40)
    : undefined;
  return { language, code: input.code.replace(/\r\n/g, "\n").slice(0, 100000) };
}

function normalizeSubmap(input: Partial<MindMapSubmap> | undefined): MindMapSubmap | undefined {
  if (!input || typeof input.path !== "string" || !input.path.trim()) return undefined;
  return {
    path: input.path.trim().slice(0, 500),
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim().slice(0, 200) : undefined
  };
}

function normalizeNavigation(input: Partial<MindMapNavigation> | undefined): MindMapNavigation | undefined {
  if (!input || typeof input.parentPath !== "string" || !input.parentPath.trim()) return undefined;
  return {
    parentPath: input.parentPath.trim().slice(0, 500),
    parentNodeId: typeof input.parentNodeId === "string" && input.parentNodeId.trim() ? input.parentNodeId.trim().slice(0, 160) : undefined,
    parentTitle: typeof input.parentTitle === "string" && input.parentTitle.trim() ? input.parentTitle.trim().slice(0, 200) : undefined,
    parentNodeText: typeof input.parentNodeText === "string" && input.parentNodeText.trim() ? input.parentNodeText.trim().slice(0, 200) : undefined
  };
}

function normalizeTask(value: unknown): TaskStatus | undefined {
  return value === "todo" || value === "doing" || value === "done" ? value : undefined;
}

function normalizeTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const tags = Array.from(new Set(value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean)))
    .slice(0, 12);
  return tags.length ? tags : undefined;
}

function normalizeNode(input: Partial<MindMapNode> | undefined, fallbackText: string): MindMapNode {
  const fallbackNodeText = typeof input?.text === "string" ? input.text : fallbackText;
  const normalizedContent = Array.isArray(input?.content)
    ? input.content.map(normalizeContentBlock).filter((block): block is MindMapContentBlock => Boolean(block))
    : [];
  if (!normalizedContent.length) {
    if (typeof input?.image === "string" && input.image.trim()) {
      normalizedContent.push({ id: newId(), type: "image", source: input.image.trim(), alt: fallbackNodeText || undefined });
    }
    const richText = normalizeRichText(input?.richText, fallbackNodeText);
    const text = richTextPlainText(richText, fallbackNodeText);
    if (text) normalizedContent.push({ id: newId(), type: "text", text, richText });
  }
  const textBlocks = normalizedContent.filter((block): block is MindMapTextContentBlock => block.type === "text");
  const imageBlocks = normalizedContent.filter((block): block is MindMapImageContentBlock => block.type === "image");
  const text = textBlocks.map((block) => block.text).join(" ").trim();
  return {
    id: typeof input?.id === "string" && input.id ? input.id : newId(),
    text,
    richText: textBlocks.length === 1 ? textBlocks[0]?.richText : undefined,
    content: normalizedContent.length ? normalizedContent : undefined,
    note: typeof input?.note === "string" && input.note.trim() ? input.note.trim() : undefined,
    link: typeof input?.link === "string" && input.link.trim() ? input.link.trim() : undefined,
    image: imageBlocks[0]?.source,
    table: normalizeTable(input?.table),
    code: normalizeCode(input?.code),
    submap: normalizeSubmap(input?.submap),
    icon: typeof input?.icon === "string" && input.icon.trim() ? input.icon.trim().slice(0, 12) : undefined,
    tags: normalizeTags(input?.tags),
    task: normalizeTask(input?.task),
    style: normalizeStyle(input?.style),
    collapsed: input?.collapsed === true || undefined,
    children: Array.isArray(input?.children)
      ? input.children.map((child, index) => normalizeNode(child, `节点 ${index + 1}`))
      : []
  };
}

export function normalizeDocument(input: Partial<MindMapDocument> | undefined, fallbackTitle = "思维导图"): MindMapDocument {
  const title = typeof input?.title === "string" && input.title.trim() ? input.title.trim() : fallbackTitle;
  return {
    version: 9,
    title,
    layout: input?.layout === "balanced" ? "balanced" : "right",
    theme: input?.theme === "light" || input?.theme === "dark" ? input.theme : "auto",
    appearance: normalizeAppearance(input?.appearance),
    navigation: normalizeNavigation(input?.navigation),
    root: normalizeNode(input?.root, title)
  };
}

export function serializeDocument(doc: MindMapDocument): string {
  const normalized = normalizeDocument(doc, doc.title);
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

function parseJsonDocument(value: string, fallbackTitle: string): MindMapDocument | null {
  try {
    return normalizeDocument(JSON.parse(value) as Partial<MindMapDocument>, fallbackTitle);
  } catch {
    return null;
  }
}

function extractFencedJson(source: string, language: string): string | null {
  const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp("```" + escaped + "\\s*([\\s\\S]*?)```", "i"));
  return match?.[1]?.trim() ?? null;
}

export function parseDocument(source: string, fallbackTitle = "思维导图"): MindMapDocument {
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

export function cloneDocument(doc: MindMapDocument): MindMapDocument {
  return JSON.parse(JSON.stringify(doc)) as MindMapDocument;
}

export function cloneNodeWithFreshIds(node: MindMapNode): MindMapNode {
  const clone = JSON.parse(JSON.stringify(node)) as MindMapNode;
  walkNodes(clone, (current) => {
    current.id = newId();
  });
  return clone;
}

export function walkNodes(root: MindMapNode, visitor: (node: MindMapNode, parent: MindMapNode | null) => void): void {
  const visit = (node: MindMapNode, parent: MindMapNode | null): void => {
    visitor(node, parent);
    node.children.forEach((child) => visit(child, node));
  };
  visit(root, null);
}

export function flattenNodes(root: MindMapNode): MindMapNode[] {
  const nodes: MindMapNode[] = [];
  walkNodes(root, (node) => nodes.push(node));
  return nodes;
}

export function findNode(root: MindMapNode, id: string): MindMapNode | null {
  let result: MindMapNode | null = null;
  walkNodes(root, (node) => {
    if (node.id === id) result = node;
  });
  return result;
}

export function findParent(root: MindMapNode, id: string): MindMapNode | null {
  let result: MindMapNode | null = null;
  walkNodes(root, (node, parent) => {
    if (node.id === id) result = parent;
  });
  return result;
}

export function findAncestors(root: MindMapNode, id: string): MindMapNode[] {
  const path: MindMapNode[] = [];
  const visit = (node: MindMapNode): boolean => {
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

export function containsNode(root: MindMapNode, id: string): boolean {
  return findNode(root, id) !== null;
}

export function removeNode(root: MindMapNode, id: string): boolean {
  for (let index = 0; index < root.children.length; index += 1) {
    if (root.children[index]?.id === id) {
      root.children.splice(index, 1);
      return true;
    }
    const child = root.children[index];
    if (child && removeNode(child, id)) return true;
  }
  return false;
}

export function collectWikiLinks(root: MindMapNode): Set<string> {
  const links = new Set<string>();
  const pattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  walkNodes(root, (node) => {
    const values = [nodePlainText(node), node.note ?? "", node.link ?? "", ...nodeContentBlocks(node).filter((block): block is MindMapImageContentBlock => block.type === "image").map((block) => block.source), node.submap?.path ?? ""];
    for (const value of values) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(value)) !== null) {
        if (match[1]) links.add(match[1].trim());
      }
      pattern.lastIndex = 0;
    }
    const explicitLink = node.link?.trim();
    if (explicitLink && !/^https?:\/\//i.test(explicitLink) && !explicitLink.includes("[[")) {
      const target = explicitLink.split("|")[0]?.split("#")[0]?.trim();
      if (target) links.add(target);
    }
  });
  return links;
}

export function extractFirstWikiLink(value: string): string | null {
  const match = value.match(/\[\[([^\]|#]+(?:#[^\]|]+)?)(?:\|[^\]]+)?\]\]/);
  return match?.[1]?.trim() ?? null;
}

export function getTaskProgress(root: MindMapNode): TaskProgress {
  let done = 0;
  let total = 0;
  walkNodes(root, (node) => {
    if (!node.task) return;
    total += 1;
    if (node.task === "done") done += 1;
  });
  return { done, total };
}

export function nodeSearchText(node: MindMapNode): string {
  return [nodePlainText(node), node.note, node.link, ...nodeContentBlocks(node).map((block) => block.type === "image" ? `${block.source} ${block.alt ?? ""}` : block.text), node.icon, node.submap?.path, node.code?.language, node.code?.code, ...(node.table?.headers ?? []), ...(node.table?.rows.flat() ?? []), ...(node.tags ?? [])]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase();
}

function taskPrefix(task: TaskStatus | undefined): string {
  if (task === "done") return "[x] ";
  if (task === "doing") return "[-] ";
  if (task === "todo") return "[ ] ";
  return "";
}

function escapeInlineMarkdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]<>])/g, "\\$1");
}

export function richTextToMarkdown(runs: MindMapTextRun[] | undefined, fallbackText: string): string {
  if (!runs?.length) return escapeInlineMarkdown(fallbackText);
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

export function tableToMarkdown(table: MindMapTable): string {
  const escapeCell = (value: string): string => value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
  const headers = `| ${table.headers.map(escapeCell).join(" | ")} |`;
  const alignments = table.headers.map((_, index) => {
    const alignment = table.alignments?.[index] ?? "left";
    return alignment === "center" ? ":---:" : alignment === "right" ? "---:" : "---";
  });
  const separator = `| ${alignments.join(" | ")} |`;
  const rows = table.rows.map((row) => `| ${table.headers.map((_, index) => escapeCell(row[index] ?? "")).join(" | ")} |`);
  return [headers, separator, ...rows].join("\n");
}

function splitMarkdownTableRow(line: string): string[] {
  const value = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (const char of value) {
    if (escaped) { current += char; escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (char === "|") { cells.push(current.trim().replaceAll("<br>", "\n")); current = ""; continue; }
    current += char;
  }
  cells.push(current.trim().replaceAll("<br>", "\n"));
  return cells;
}

export function parseMarkdownTable(markdown: string): MindMapTable | null {
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = lines[index]?.trim() ?? "";
    const separatorLine = lines[index + 1]?.trim() ?? "";
    if (!headerLine.includes("|") || !separatorLine.includes("|")) continue;
    const headers = splitMarkdownTableRow(headerLine);
    const separators = splitMarkdownTableRow(separatorLine);
    if (!headers.length || separators.length !== headers.length || !separators.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))) continue;
    const alignments: TableAlignment[] = separators.map((cell) => {
      const compact = cell.replace(/\s/g, "");
      if (compact.startsWith(":") && compact.endsWith(":")) return "center";
      if (compact.endsWith(":")) return "right";
      return "left";
    });
    const rows: string[][] = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const rowLine = lines[rowIndex]?.trim() ?? "";
      if (!rowLine || !rowLine.includes("|")) break;
      const row = splitMarkdownTableRow(rowLine).slice(0, headers.length);
      while (row.length < headers.length) row.push("");
      rows.push(row);
    }
    return normalizeTable({ headers, rows, alignments, source: "markdown" }) ?? null;
  }
  return null;
}

export function parseFencedCode(markdown: string): MindMapCodeBlock | null {
  const match = markdown.match(/```([^\n`]*)\n([\s\S]*?)\n```/);
  if (!match) return null;
  return normalizeCode({ language: match[1]?.trim(), code: match[2] ?? "" }) ?? null;
}

export function childrenToTable(node: MindMapNode): MindMapTable | null {
  if (!node.children.length) return null;
  return {
    headers: ["子节点", "备注", "状态", "标签", "下级数量"],
    rows: node.children.map((child) => [
      nodePlainText(child),
      child.note ?? "",
      child.task === "done" ? "已完成" : child.task === "doing" ? "进行中" : child.task === "todo" ? "待办" : "",
      child.tags?.join(", ") ?? "",
      String(child.children.length)
    ]),
    alignments: ["left", "left", "center", "left", "right"],
    source: "children"
  };
}

export function documentToMarkdown(doc: MindMapDocument): string {
  const renderBlocks = (node: MindMapNode): string[] => {
    const result: string[] = [];
    for (const block of nodeContentBlocks(node)) {
      if (block.type === "text") {
        const value = richTextToMarkdown(block.richText, block.text);
        if (value) result.push(value);
      } else {
        result.push(`![${escapeInlineMarkdown(block.alt ?? "图片")}](${block.source})`);
      }
    }
    return result;
  };
  const rootBlocks = renderBlocks(doc.root);
  const rootTitle = rootBlocks.find((value) => !value.startsWith("![")) ?? doc.title;
  const rootSuffix = doc.root.tags?.length ? ` ${doc.root.tags.map((tag) => `#${tag}`).join(" ")}` : "";
  const lines: string[] = [`# ${doc.root.icon ? `${doc.root.icon} ` : ""}${rootTitle}${rootSuffix}`];
  rootBlocks.filter((value) => value !== rootTitle).forEach((value) => lines.push(value));
  const visit = (node: MindMapNode, depth: number): void => {
    const indent = "  ".repeat(Math.max(0, depth - 1));
    const tags = node.tags?.length ? ` ${node.tags.map((tag) => `#${tag}`).join(" ")}` : "";
    const link = node.link ? ` → ${node.link}` : "";
    const blocks = renderBlocks(node);
    const firstText = blocks.find((value) => !value.startsWith("![")) ?? (blocks[0] ?? "图片节点");
    lines.push(`${indent}- ${taskPrefix(node.task)}${node.icon ? `${node.icon} ` : ""}${firstText}${tags}${link}`);
    blocks.filter((value) => value !== firstText).forEach((value) => lines.push(`${indent}  ${value}`));
    if (node.note) lines.push(`${indent}  > ${node.note.replaceAll("\n", " ")}`);
    if (node.submap) lines.push(`${indent}  > 子导图：[[${node.submap.path}]]`);
    if (node.table) lines.push("", ...tableToMarkdown(node.table).split("\n").map((line) => `${indent}  ${line}`), "");
    if (node.code) lines.push(`${indent}  \`\`\`${node.code.language ?? ""}`, ...node.code.code.split("\n").map((line) => `${indent}  ${line}`), `${indent}  \`\`\``);
    node.children.forEach((child) => visit(child, depth + 1));
  };
  doc.root.children.forEach((child) => visit(child, 1));
  return lines.join("\n");
}

function parseTaskText(value: string): { text: string; task?: TaskStatus } {
  const match = value.match(/^\[( |x|X|-)\]\s+(.+)$/);
  if (!match) return { text: value };
  const marker = match[1];
  const task: TaskStatus = marker === "x" || marker === "X" ? "done" : marker === "-" ? "doing" : "todo";
  return { text: match[2]?.trim() || "任务", task };
}

export function markdownToDocument(markdown: string, fallbackTitle = "思维导图"): MindMapDocument {
  const doc = createDefaultDocument(fallbackTitle);
  doc.root.children = [];
  const stack: Array<{ level: number; node: MindMapNode }> = [{ level: 0, node: doc.root }];
  let rootAssigned = false;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("---") || line.trimStart().startsWith("```") || /^\s*>/.test(line)) continue;

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    const bullet = line.match(/^(\s*)[-*+]\s+(.+?)\s*$/);
    const numbered = line.match(/^(\s*)\d+[.)]\s+(.+?)\s*$/);

    if (heading) {
      const level = heading[1]?.length ?? 1;
      const text = heading[2]?.trim() ?? "节点";
      if (level === 1 && !rootAssigned) {
        doc.root.text = text;
        doc.title = text;
        rootAssigned = true;
        stack.length = 1;
      } else {
        const node = createNode(text);
        while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level) stack.pop();
        const parent = stack.at(-1)?.node ?? doc.root;
        parent.children.push(node);
        stack.push({ level, node });
      }
      continue;
    }

    const listMatch = bullet ?? numbered;
    if (listMatch) {
      const spaces = (listMatch[1] ?? "").replaceAll("\t", "  ").length;
      const level = Math.floor(spaces / 2) + 2;
      const parsed = parseTaskText((listMatch[2] ?? "节点").trim());
      const node = createNode(parsed.text);
      node.task = parsed.task;
      while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level) stack.pop();
      const parent = stack.at(-1)?.node ?? doc.root;
      parent.children.push(node);
      stack.push({ level, node });
    }
  }

  if (!doc.root.children.length) doc.root.children.push(createNode("主题 1"));
  return doc;
}
