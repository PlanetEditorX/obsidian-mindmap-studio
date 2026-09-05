/**
 * @file article-renderer.ts
 * @description 文章模式的目录、章节、正文和分页导航渲染器。
 */

import { App, setIcon } from "obsidian";
import {
  nodeContentBlocks,
  type ArticleLeafNumberingStyle,
  type ArticleTocStyle,
  type MindMapCodeBlock,
  type MindMapContentBlock,
  type MindMapDocument,
  type MindMapNode,
  type MindMapTable,
  type MindMapTextContentBlock
} from "../core/model";
import {
  articleTocDepth,
  buildArticleNodeInfo,
  currentArticlePageEntry,
  isDocumentArticleNumberingDisabled,
  type ArticleNodeInfo,
  type ArticlePageNavigation,
  type ArticleTocEntry
} from "../article/modes";
import { resolveArticleStyle } from "../article/article-style";
import { resolveByteChunk, resolveByteWindow, utf8ByteLength } from "../article/render-window";
import type { MindMapEditorCallbacks } from "./editor-types";
import { renderInlineMarkdown, renderRichTextRuns } from "./rich-text-dom";
import { bindTableColumnResize, bindTableDoubleClick } from "./table-interaction";
import type { ArticleLeafBulletStyle } from "../settings";
import { loadImageWithFallback } from "./image-failure-view";

/** 文章渲染所需的编辑器状态和回调。 */
export interface ArticleRendererOptions {
  app: App;
  document: MindMapDocument;
  currentFilePath: string;
  selectedId: string;
  readOnly: boolean;
  /** Returns the live lock state after render-free reading/editing toggles. */
  isReadOnly: () => boolean;
  articleBaseDepth: number;
  showArticleToc: boolean;
  articleTocEntries: ArticleTocEntry[];
  articleTocMaxDepth: number;
  articleTocStyle: ArticleTocStyle;
  articleLeafBulletsEnabled: boolean;
  articleLeafBulletColor: string;
  articleLeafBulletStyle: ArticleLeafBulletStyle;
  articleLeafTextAlignment: "flush" | "auto";
  articleLeafNumberingEnabled: boolean;
  articleLeafNumberingStyle: ArticleLeafNumberingStyle;
  articleLeafNumberingThreshold: number;
  imageHostPriorityIds: string[];
  articleNavigation?: ArticlePageNavigation;
  callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onRenderCode" | "onOpenMindMap" | "onOpenArticleDirectory">;
  selectNode: (id: string) => void;
  focusNode: (id: string) => void;
  openAiContextMenu: (event: MouseEvent, nodeId: string, blockId?: string) => void;
  openImageContextMenu: (event: MouseEvent, nodeId: string, blockId: string) => void;
  openImagePreview: (nodeId: string, blockId: string) => void;
  editTableBlock: (node: MindMapNode, table: MindMapTable, blockId: string) => void;
  updateTableColumnWidths: (node: MindMapNode, blockId: string, widths: number[]) => void;
  makeInlineEditable: (element: HTMLElement, node: MindMapNode, placeholder: string, blockId?: string) => void;
  makeInlineCodeEditable: (element: HTMLElement, node: MindMapNode, code: MindMapCodeBlock, blockId: string) => void;
  addInlineNodeActions: (container: HTMLElement, node: MindMapNode) => void;
  /** One-render memo for normalized content blocks; callers normally leave this unset. */
  contentBlockCache?: WeakMap<MindMapNode, MindMapContentBlock[]>;
  /** Larger first window used after a verified article-context cache hit. */
  initialWindowByteBudget?: number;
  /** Requests another bounded article window when the reader approaches an unloaded edge. */
  onArticleWindowExpand?: (direction: "before" | "after") => void;
}

/** Runtime handle for bounded article DOM expansion. */
export interface ArticleRenderController {
  hasBefore: () => boolean;
  hasAfter: () => boolean;
  loadBefore: () => boolean;
  loadAfter: () => boolean;
  ensureNode: (nodeId: string) => boolean;
  containsNode: (nodeId: string) => boolean;
}


/** Normalizes one node at most once during a complete article render. */
function articleNodeContentBlocks(node: MindMapNode, options: ArticleRendererOptions): MindMapContentBlock[] {
  const cache = options.contentBlockCache;
  if (!cache) return nodeContentBlocks(node);
  const cached = cache.get(node);
  if (cached) return cached;
  const blocks = nodeContentBlocks(node);
  cache.set(node, blocks);
  return blocks;
}

/** Reads the already-normalized first text block without rebuilding every block in a large document. */
function articleNodePrimaryText(node: MindMapNode): string {
  const first = node.content?.find((block): block is MindMapTextContentBlock => block.type === "text");
  return (first?.text ?? node.text ?? "").trim();
}

/** Estimates the DOM work represented by one article node without serializing the complete node. */
function articleNodeRenderBytes(info: ArticleNodeInfo): number {
  const node = info.node;
  let bytes = utf8ByteLength(info.title)
    + utf8ByteLength(node.note ?? "")
    + utf8ByteLength(node.link ?? "")
    + (node.tags ?? []).reduce((sum, tag) => sum + utf8ByteLength(tag), 0);
  const blocks = node.content?.length ? node.content : undefined;
  if (blocks) {
    for (const block of blocks) {
      if (block.type === "text") bytes += utf8ByteLength(block.text);
      else if (block.type === "image") bytes += utf8ByteLength(block.alt ?? "") + 256;
      else if (block.type === "code") bytes += utf8ByteLength(block.code.code);
      else {
        bytes += block.table.headers.reduce((sum, cell) => sum + utf8ByteLength(cell), 0);
        for (const row of block.table.rows) bytes += row.reduce((sum, cell) => sum + utf8ByteLength(cell), 0);
      }
    }
  } else {
    bytes += utf8ByteLength(node.text ?? "");
    bytes += utf8ByteLength(node.code?.code ?? "");
    if (node.table) {
      bytes += node.table.headers.reduce((sum, cell) => sum + utf8ByteLength(cell), 0);
      for (const row of node.table.rows) bytes += row.reduce((sum, cell) => sum + utf8ByteLength(cell), 0);
    }
    if (node.image) bytes += 256;
  }
  return Math.max(192, bytes);
}

/** 根据文档阅读样式和文章上下文渲染文章页的首个稳定窗口。 */
export function renderArticleMode(container: HTMLElement, options: ArticleRendererOptions): ArticleRenderController | null {
  options = options.contentBlockCache ? options : { ...options, contentBlockCache: new WeakMap() };
  container.empty();
  const articleStyle = resolveArticleStyle({
    preset: options.document.articleStyle?.preset ?? "classic",
    ...options.document.articleStyle,
    tocStyle: options.document.articleStyle?.tocStyle ?? options.articleTocStyle
  });
  const page = container.createDiv({ cls: `mms-article-page article-${articleStyle.preset} toc-${articleStyle.tocStyle ?? "card"}` });
  page.dataset.nodeId = options.document.root.id;
  applyArticleStyle(page, articleStyle);
  const articleNumberingDisabled = options.articleNavigation?.numberingDisabled === true
    || isDocumentArticleNumberingDisabled(options.document.root);
  const pageEntry = articleNumberingDisabled
    ? undefined
    : currentArticlePageEntry(options.articleNavigation);
  const title = page.createEl("h1", { cls: "mms-article-document-title" });
  title.dataset.nodeId = options.document.root.id;
  if (pageEntry?.label) {
    const separator = /[、.）]$/.test(pageEntry.label) ? "" : " ";
    title.createSpan({ cls: "mms-article-number", text: `${pageEntry.label}${separator}` });
  }
  const titleText = title.createSpan({ cls: "mms-article-document-title-text" });
  const rootTextBlock = articleNodeContentBlocks(options.document.root, options).find((block): block is MindMapTextContentBlock => block.type === "text");
  renderRichTextRuns(titleText, rootTextBlock?.richText, rootTextBlock?.text ?? options.document.title);
  options.makeInlineEditable(titleText, options.document.root, "文章标题", rootTextBlock?.id);
  options.addInlineNodeActions(page, options.document.root);
  title.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    options.openAiContextMenu(event, options.document.root.id);
  });

  const directoryOnly = options.showArticleToc
    && options.articleTocEntries.length > 0
    && options.document.view?.articleLandingMode !== "article";
  if (directoryOnly) {
    renderDirectory(page, options);
    return null;
  }

  const infos = buildArticleNodeInfo(options.document.root, options.articleBaseDepth, {
    enabled: options.articleLeafNumberingEnabled,
    threshold: options.articleLeafNumberingThreshold,
    style: options.articleLeafNumberingStyle,
    numberingDisabled: articleNumberingDisabled
  }, articleNodePrimaryText);
  const weights = infos.map(articleNodeRenderBytes);
  const initialTarget = infos.findIndex((info) => info.node.id === options.selectedId);
  let { start, end } = resolveByteWindow(
    weights,
    initialTarget >= 0 ? initialTarget : 0,
    options.initialWindowByteBudget
  );
  const before = page.createEl("button", {
    cls: "mms-article-window-loader is-before",
    text: "加载前文",
    attr: { type: "button", "aria-label": "加载前文" }
  });
  const sections = page.createDiv({ cls: "mms-article-window" });
  const after = page.createEl("button", {
    cls: "mms-article-window-loader is-after",
    text: "加载后文",
    attr: { type: "button", "aria-label": "加载后文" }
  });

  const renderRange = (
    rangeStart: number,
    rangeEnd: number,
    prepend = false,
    entrance: "initial" | "before" | "after" | "target" = prepend ? "before" : "after"
  ): void => {
    const markEntering = (section: HTMLElement): void => {
      section.classList.add("is-window-entering", `is-enter-${entrance}`);
    };
    if (prepend) {
      for (let index = rangeEnd - 1; index >= rangeStart; index -= 1) {
        const section = sections.createEl("section");
        renderArticleNodeSection(section, infos[index]!, options);
        markEntering(section);
        sections.insertBefore(section, sections.firstChild);
      }
      return;
    }
    for (let index = rangeStart; index < rangeEnd; index += 1) {
      const section = sections.createEl("section");
      renderArticleNodeSection(section, infos[index]!, options);
      markEntering(section);
    }
  };
  const updateLoaders = (): void => {
    before.toggleClass("is-hidden", start <= 0);
    after.toggleClass("is-hidden", end >= infos.length);
  };
  const resetAround = (targetIndex: number): void => {
    const next = resolveByteWindow(weights, targetIndex);
    start = next.start;
    end = next.end;
    sections.empty();
    renderRange(start, end, false, "target");
    updateLoaders();
  };
  renderRange(start, end, false, "initial");
  updateLoaders();
  before.addEventListener("click", () => options.onArticleWindowExpand?.("before"));
  after.addEventListener("click", () => options.onArticleWindowExpand?.("after"));
  renderArticlePager(page, options);

  return {
    hasBefore: () => start > 0,
    hasAfter: () => end < infos.length,
    loadBefore: () => {
      const nextStart = resolveByteChunk(weights, start, "before");
      if (nextStart === start) return false;
      renderRange(nextStart, start, true);
      start = nextStart;
      updateLoaders();
      return true;
    },
    loadAfter: () => {
      const nextEnd = resolveByteChunk(weights, end, "after");
      if (nextEnd === end) return false;
      renderRange(end, nextEnd);
      end = nextEnd;
      updateLoaders();
      return true;
    },
    ensureNode: (nodeId: string) => {
      if (nodeId === options.document.root.id) return true;
      const targetIndex = infos.findIndex((info) => info.node.id === nodeId);
      if (targetIndex < 0) return false;
      if (targetIndex < start || targetIndex >= end) resetAround(targetIndex);
      return true;
    },
    containsNode: (nodeId: string) => nodeId === options.document.root.id
      || infos.slice(start, end).some((info) => info.node.id === nodeId)
  };
}

/** 渲染一个完整文章节点及其内容和交互。 */
function renderArticleNodeSection(
  section: HTMLElement,
  info: ReturnType<typeof buildArticleNodeInfo>[number],
  options: ArticleRendererOptions
): void {
  section.empty();
  section.className = `mms-article-node depth-${Math.min(info.depth, 8)}${!options.readOnly && options.selectedId === info.node.id ? " is-selected" : ""}`;
  section.dataset.nodeId = info.node.id;
  section.id = info.anchor;
  section.addEventListener("click", () => {
    if (!options.isReadOnly()) options.selectNode(info.node.id);
  });
  section.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target instanceof HTMLElement ? event.target : null;
    const blockId = target?.closest<HTMLElement>("[data-block-id]")?.dataset.blockId;
    options.selectNode(info.node.id);
    options.openAiContextMenu(event, info.node.id, blockId);
  });
  if (info.isHeading) {
    const level = Math.min(6, info.depth + 1);
    const heading = section.createEl(`h${level}` as keyof HTMLElementTagNameMap, {
      cls: `mms-article-heading mms-article-section-heading${/[、.）]$/.test(info.label) ? " is-compact-number" : ""}`
    });
    if (info.label) heading.createSpan({ cls: "mms-article-number", text: info.label });
    renderHeading(heading, info.node, info.title, options);
    const headingBlock = articleNodeContentBlocks(info.node, options).find((block): block is MindMapTextContentBlock => block.type === "text");
    if (headingBlock) heading.dataset.blockId = headingBlock.id;
    if (info.skipped) heading.createSpan({ cls: "mms-article-skip-badge", text: "不编号" });
    options.addInlineNodeActions(heading, info.node);
    renderArticleNodeContent(section, info.node, false, options);
    return;
  }

  const blocks = articleNodeContentBlocks(info.node, options);
  const firstTextBlock = blocks.find((block): block is MindMapTextContentBlock => block.type === "text");
  if (firstTextBlock?.text.trim()) {
    const blockShell = createArticleContentBlock(section, firstTextBlock.id);
    const paragraph = blockShell.createEl("p", { cls: `${articleParagraphClass("mms-article-leaf-text", firstTextBlock, options.articleLeafBulletsEnabled && !info.numberedLeaf, options.articleLeafTextAlignment)}${info.numberedLeaf ? " mms-article-leaf-numbered" : ""}` });
    paragraph.dataset.blockId = firstTextBlock.id;
    if (info.numberedLeaf) {
      paragraph.dataset.articleNumber = info.leafNumberingStyle === "circled"
        ? String(info.leafNumberingIndex ?? 1)
        : info.label;
      if (info.leafNumberingStyle) paragraph.dataset.articleNumberStyle = info.leafNumberingStyle;
    }
    applyArticleLeafBulletStyle(paragraph, options, info.numberedLeaf);
    renderRichTextRuns(paragraph, firstTextBlock.richText, firstTextBlock.text);
    options.makeInlineEditable(paragraph, info.node, "正文段落", firstTextBlock.id);
  } else if (!options.readOnly && blocks.length === 0) {
    const paragraph = section.createEl("p", { cls: articleParagraphClass("mms-article-leaf-text", undefined, options.articleLeafBulletsEnabled, options.articleLeafTextAlignment) });
    applyArticleLeafBulletStyle(paragraph, options);
    renderRichTextRuns(paragraph, undefined, "");
    options.makeInlineEditable(paragraph, info.node, "正文段落");
  }
  options.addInlineNodeActions(section, info.node);
  renderArticleNodeContent(section, info.node, false, options);
}

/** Creates an article block shell for right-click targeting without adding a floating drag handle. */
function createArticleContentBlock(
  container: HTMLElement,
  blockId: string,
  indentToParagraph = false
): HTMLElement {
  const shell = container.createDiv({
    cls: `mms-article-content-block${indentToParagraph ? " is-paragraph-aligned" : ""}`
  });
  shell.dataset.blockId = blockId;
  return shell;
}

/** Builds paragraph classes without changing the legacy first-line-indent default. */
function articleParagraphClass(baseClass: string, block: MindMapTextContentBlock | undefined, bulleted = false, alignment: "flush" | "auto" = "auto"): string {
  return `${baseClass}${bulleted ? " is-bulleted" : ""}${alignment === "auto" ? " is-auto-aligned" : ""}${block?.paragraphIndent === "none" ? " is-flush" : ""}`;
}

/** Applies the configured terminal bullet color and visual style to one article paragraph. */
function applyArticleLeafBulletStyle(paragraph: HTMLElement, options: ArticleRendererOptions, numberedLeaf = false): void {
  if (!options.articleLeafBulletsEnabled || numberedLeaf) return;
  paragraph.dataset.bulletStyle = options.articleLeafBulletStyle;
  if (options.articleLeafBulletColor) paragraph.style.setProperty("--mms-article-bullet-color", options.articleLeafBulletColor);
}

/** 将解析后的阅读样式写入文章页 CSS 变量。 */
function applyArticleStyle(page: HTMLElement, style: ReturnType<typeof resolveArticleStyle>): void {
  if (style.fontFamily) page.style.setProperty("--mms-article-font", style.fontFamily);
  if (style.textColor) page.style.setProperty("--mms-article-text", style.textColor);
  if (style.headingColor) page.style.setProperty("--mms-article-heading", style.headingColor);
  if (style.accentColor) page.style.setProperty("--mms-article-accent", style.accentColor);
  if (style.backgroundColor) page.style.setProperty("--mms-article-paper", style.backgroundColor);
  page.style.setProperty("--mms-article-font-size", `${style.fontSize ?? 16}px`);
  page.style.setProperty("--mms-article-line-height", String(style.lineHeight ?? 1.85));
}

/** 渲染文章目录页。 */
function renderDirectory(page: HTMLElement, options: ArticleRendererOptions): void {
  const tocPage = page.createEl("nav", { cls: "mms-article-toc mms-article-toc-page" });
  tocPage.createEl("h2", { text: "目录" });
  const list = tocPage.createEl("ol");
  for (const entry of options.articleTocEntries.filter((item) => articleTocDepth(item) <= options.articleTocMaxDepth)) {
    const tocDepth = articleTocDepth(entry);
    const item = list.createEl("li", { cls: `depth-${Math.min(tocDepth, 8)}` });
    item.style.setProperty("--mms-article-depth", String(tocDepth));
    const link = item.createEl("a", { href: entry.filePath, attr: { title: entry.breadcrumb.join(" › ") } });
    if (entry.label) link.createSpan({ cls: "mms-article-toc-number", text: entry.label });
    link.createSpan({ cls: "mms-article-toc-title", text: entry.title || "未命名标题" });
    link.dataset.nodeId = entry.nodeId;
    link.dataset.filePath = entry.filePath;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (entry.filePath === options.currentFilePath && entry.nodeId) {
        options.focusNode(entry.nodeId);
        return;
      }
      void options.callbacks.onOpenMindMap(entry.filePath, entry.nodeId);
    });
    if (entry.breadcrumb.length > 1) item.createSpan({ cls: "mms-article-toc-breadcrumb", text: entry.breadcrumb.join(" › ") });
  }
}

/** 渲染章节标题或子导图链接。 */
function renderHeading(heading: HTMLElement, node: MindMapNode, title: string, options: ArticleRendererOptions): void {
  if (node.submap) {
    const headingLink = heading.createEl("a", { cls: "mms-article-heading-text mms-submap-text-link", href: node.submap.path, attr: { title: `打开子导图：${node.submap.title ?? node.submap.path}` } });
    const textBlock = articleNodeContentBlocks(node, options).find((block): block is MindMapTextContentBlock => block.type === "text");
    renderRichTextRuns(headingLink, textBlock?.richText, textBlock?.text ?? title);
    headingLink.dataset.mmsExplicitEditOnly = "true";
    options.makeInlineEditable(headingLink, node, "章节标题", textBlock?.id);
    headingLink.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (headingLink.contentEditable === "true") return;
      options.selectNode(node.id);
      void options.callbacks.onOpenMindMap(node.submap!.path);
    });
  } else {
    const headingText = heading.createSpan({ cls: "mms-article-heading-text" });
    const textBlock = articleNodeContentBlocks(node, options).find((block): block is MindMapTextContentBlock => block.type === "text");
    renderRichTextRuns(headingText, textBlock?.richText, textBlock?.text ?? title);
    options.makeInlineEditable(headingText, node, "章节标题", textBlock?.id);
  }
}

/** 渲染文章节点的正文块、图片、备注、表格和代码。 */
export function renderArticleNodeContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean, options: ArticleRendererOptions): void {
  let firstTextHandled = false;
  let inlineImageRow: HTMLElement | null = null;
  for (const block of articleNodeContentBlocks(node, options)) {
    if (block.type === "text") {
      inlineImageRow = null;
      if (!treatTextAsBody && !firstTextHandled) { firstTextHandled = true; continue; }
      firstTextHandled = true;
      const shell = createArticleContentBlock(container, block.id);
      const paragraph = shell.createEl("p", { cls: articleParagraphClass("mms-article-paragraph", block) });
      paragraph.dataset.blockId = block.id;
      renderRichTextRuns(paragraph, block.richText, block.text);
      options.makeInlineEditable(paragraph, node, "正文", block.id);
    } else if (block.type === "image") {
      const inline = block.layout === "inline";
      if (inline && !inlineImageRow) inlineImageRow = container.createDiv({ cls: "mms-article-image-row" });
      if (!inline) inlineImageRow = null;
      const shell = createArticleContentBlock(inline ? inlineImageRow! : container, block.id, !inline);
      shell.addClass(`image-layout-${block.layout ?? "block"}`);
      let activeResolved: string | null = null;
      const image = shell.createEl("img", { cls: `mms-article-image image-align-${block.align ?? "center"}`, attr: { alt: block.alt ?? "图片" } });
      image.dataset.blockId = block.id;
      if (block.width) image.style.width = `${block.width}px`;
      if (block.height) image.style.height = `${block.height}px`;
      loadImageWithFallback(
        image,
        shell,
        block,
        options.imageHostPriorityIds,
        (source) => options.callbacks.resolveImage(source),
        (_source, resolved) => { activeResolved = resolved; }
      );
      image.addEventListener("click", () => {
        if (!activeResolved) return;
        options.openImagePreview(node.id, block.id);
      });
      shell.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        options.selectNode(node.id);
        options.openImageContextMenu(event, node.id, block.id);
      });
    } else if (block.type === "table") {
      inlineImageRow = null;
      const shell = createArticleContentBlock(container, block.id, true);
      renderArticleTable(shell, node, block.table, block.id, options);
    } else {
      inlineImageRow = null;
      const shell = createArticleContentBlock(container, block.id, true);
      const code = shell.createDiv({ cls: "mms-article-code markdown-rendered" });
      code.dataset.blockId = block.id;
      void options.callbacks.onRenderCode(block.code, code);
      code.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
        options.makeInlineCodeEditable(code, node, block.code, block.id);
      });
    }
  }
  if (node.note) container.createEl("p", { cls: "mms-article-note", text: node.note });
  if (node.question) renderArticleQuestionDetails(container, node);
}

/** Renders a persisted, resizable table block in article and continuous-reading views. */
function renderArticleTable(
  container: HTMLElement,
  node: MindMapNode,
  tableData: MindMapTable,
  blockId: string,
  options: ArticleRendererOptions
): void {
  const wrap = container.createDiv({ cls: "mms-article-table-wrap" });
  wrap.dataset.blockId = blockId;
  const table = wrap.createEl("table", { cls: "mms-article-table" });
  const colgroup = table.createEl("colgroup");
  const columns = tableData.headers.map(() => colgroup.createEl("col"));
  const applyWidths = (widths: readonly number[]): void => {
    table.addClass("has-custom-column-widths");
    const total = widths.reduce((sum, width) => sum + Math.max(1, width), 0) || 1;
    columns.forEach((column, index) => {
      column.style.width = `${((Math.max(1, widths[index] ?? 160) / total) * 100).toFixed(4)}%`;
    });
    table.style.width = "100%";
  };
  if (tableData.columnWidths?.length) applyWidths(tableData.columnWidths);
  const tr = table.createEl("thead").createEl("tr");
  const headers = tableData.headers.map((header, index) => {
    const cell = tr.createEl("th");
    renderInlineMarkdown(cell, header);
    cell.style.textAlign = tableData.alignments?.[index] ?? "left";
    return cell;
  });
  const body = table.createEl("tbody");
  tableData.rows.forEach((row) => {
    const rowEl = body.createEl("tr");
    tableData.headers.forEach((_, index) => {
      const cell = rowEl.createEl("td");
      renderInlineMarkdown(cell, row[index] ?? "");
      cell.style.textAlign = tableData.alignments?.[index] ?? "left";
    });
  });
  bindTableDoubleClick(table, {
    isReadOnly: options.isReadOnly,
    isResizeTarget: (target) => target instanceof HTMLElement && Boolean(target.closest(".mms-table-column-resizer")),
    edit: () => options.editTableBlock(node, tableData, blockId)
  });
  headers.slice(0, -1).forEach((header, index) => {
    const handle = header.createSpan({
      cls: "mms-table-column-resizer",
      attr: {
        role: "separator",
        title: `拖动调整第 ${index + 1} 列宽度`,
        "aria-label": `调整第 ${index + 1} 列宽度`
      }
    });
    handle.addEventListener("dblclick", (event) => event.stopPropagation());
    bindTableColumnResize(handle, {
      eventTarget: window,
      isReadOnly: options.isReadOnly,
      columnIndex: index,
      initialWidths: () => headers.map((cell, columnIndex) => {
        const measured = Math.round(cell.getBoundingClientRect().width);
        const stored = tableData.columnWidths?.[columnIndex];
        return measured > 0 ? measured : stored ?? 160;
      }),
      applyWidths,
      setResizing: (resizing) => wrap.toggleClass("is-resizing-columns", resizing),
      commitWidths: (widths) => options.updateTableColumnWidths(node, blockId, widths)
    });
  });
}

/** Returns whether a structured-question field contains visible text or an image. */
function questionFieldHasContent(blocks: readonly MindMapContentBlock[]): boolean {
  return blocks.some((block) => block.type === "text" ? Boolean(block.text.trim()) : block.type === "image");
}

/** Renders question text blocks with the same inline/display LaTeX rules as normal node text. */
function renderQuestionFieldValue(container: HTMLElement, blocks: readonly MindMapContentBlock[]): void {
  blocks.forEach((block, index) => {
    if (block.type === "text" && block.text.trim()) {
      const part = container.createSpan({ cls: "mms-question-text-part" });
      renderRichTextRuns(part, block.richText, block.text);
      if (index < blocks.length - 1) container.createEl("br");
    } else if (block.type === "image") {
      container.createSpan({ cls: "mms-question-image-placeholder", text: "[图片]" });
      if (index < blocks.length - 1) container.createEl("br");
    }
  });
}

/** Renders structured question options, answers, explanations, and original source in article and reading modes. */
function renderArticleQuestionDetails(container: HTMLElement, node: MindMapNode): void {
  const question = node.question;
  if (!question) return;
  const panel = container.createDiv({ cls: "mms-question-panel" });
  const meta = panel.createDiv({ cls: "mms-question-meta" });
  meta.createDiv({ cls: "mms-question-kind", text: question.mode === "essay" ? "大题" : question.mode === "judgment" ? "判断题" : "选择题" });
  const statusLabels = { unanswered: "未做", completed: "已做", favorite: "收藏", wrong: "错题", mastered: "掌握" } as const;
  meta.createDiv({ cls: `mms-question-status is-${question.status}`, text: statusLabels[question.status] });
  const appendField = (fieldContainer: HTMLElement, label: string, blocks: readonly MindMapContentBlock[], cls = ""): void => {
    if (!questionFieldHasContent(blocks)) return;
    const row = fieldContainer.createDiv({ cls: `mms-question-row ${cls}`.trim() });
    row.createEl("strong", { text: `${label}：` });
    const value = row.createSpan({ cls: "mms-question-value" });
    renderQuestionFieldValue(value, blocks);
  };
  if (question.mode !== "essay") {
    for (const option of question.options) appendField(panel, option.label, option.content, "is-option");
  }
  const hasAnswer = questionFieldHasContent(question.answer);
  const hasExplanation = questionFieldHasContent(question.explanation);
  if (hasAnswer || hasExplanation) {
    const toggle = panel.createEl("button", { cls: "mms-question-toggle", text: "显示答案与解析", attr: { type: "button", "aria-expanded": "false" } });
    const reveal = panel.createDiv({ cls: "mms-question-reveal" });
    appendField(reveal, "答案", question.answer, "is-answer");
    appendField(reveal, "解答", question.explanation, "is-explanation");
    toggle.addEventListener("click", () => {
      const revealed = !reveal.hasClass("is-revealed");
      reveal.toggleClass("is-revealed", revealed);
      toggle.setText(revealed ? "隐藏答案与解析" : "显示答案与解析");
      toggle.setAttr("aria-expanded", String(revealed));
    });
  }
  if (question.source) {
    const source = panel.createEl("a", { cls: "mms-question-source", text: `原题来源：${question.source.title}`, href: question.source.url });
    source.setAttr("target", "_blank");
    source.setAttr("rel", "noopener noreferrer");
  }
}

/** 渲染同层兄弟文章页的上一篇、父级、下一篇与阅读完成导航。 */
function renderArticlePager(page: HTMLElement, options: ArticleRendererOptions): void {
  const navigation = options.articleNavigation;
  if (!navigation?.parentPath || !navigation.entries.length) return;
  const index = navigation.currentIndex;
  const previous = index > 0 ? navigation.entries[index - 1] : undefined;
  const next = index < navigation.entries.length - 1 ? navigation.entries[index + 1] : undefined;
  const pager = page.createEl("nav", { cls: "mms-article-pager" });
  const addTarget = (className: string, prefix: string, entry: ArticleTocEntry): void => {
    const link = pager.createEl("button", { cls: className, attr: { type: "button" } });
    link.createSpan({ cls: "mms-article-pager-direction", text: prefix.trim() });
    link.createSpan({ cls: "mms-article-pager-title", text: entry.displayTitle || entry.title });
    link.addEventListener("click", () => void options.callbacks.onOpenMindMap(entry.filePath, entry.nodeId));
  };
  if (previous) addTarget("mms-article-pager-previous", previous.depth <= 1 ? "上一章 " : "上一节 ", previous);
  else pager.createSpan({ cls: "mms-article-pager-placeholder" });
  const parent = pager.createEl("button", { cls: "mms-article-pager-parent", attr: { type: "button" } });
  setIcon(parent, "corner-left-up");
  parent.createSpan({ text: "返回上一级" });
  parent.addEventListener("click", () => void options.callbacks.onOpenArticleDirectory(navigation.parentPath!, navigation.parentNodeId));
  if (next) addTarget("mms-article-pager-next", next.depth <= 1 ? "下一章 " : "下一节 ", next);
  else {
    const end = pager.createEl("button", { cls: "mms-article-pager-end", attr: { type: "button" } });
    end.createSpan({ cls: "mms-article-pager-direction", text: "阅读完成" });
    end.createSpan({ cls: "mms-article-pager-title", text: "END · 返回目录" });
    end.addEventListener("click", () => void options.callbacks.onOpenArticleDirectory(navigation.homePath));
  }
}
