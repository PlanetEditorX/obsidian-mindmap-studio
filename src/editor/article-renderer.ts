/**
 * @file article-renderer.ts
 * @description 文章模式的目录、章节、正文和分页导航渲染器。
 */

import { App, setIcon } from "obsidian";
import {
  imageSourceCandidates,
  nodeContentBlocks,
  type ArticleLeafNumberingStyle,
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
  type ArticlePageNavigation,
  type ArticleTocEntry
} from "../article/modes";
import { resolveArticleStyle } from "../article/article-style";
import { buildHierarchyFocusOrder, prioritizeArticleNodeIds } from "../render/incremental-render";
import type { MindMapEditorCallbacks } from "./editor-types";
import { ImagePreviewModal } from "./editor-modals";
import { renderInlineMarkdown, renderRichTextRuns } from "./rich-text-dom";
import { bindTableColumnResize, bindTableDoubleClick } from "./table-interaction";
import type { ArticleLeafBulletStyle } from "../settings";
import { clearImageFailureDetails, loadImageWithFallback } from "./image-failure-view";
import {
  ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
  ARTICLE_RENDERER_REVISION,
  articleCacheFingerprint,
  articleNodeRenderFingerprint,
  normalizeArticleCachePath,
  type ArticleNodeRenderCacheEntry,
  type ArticleRenderCacheSnapshot
} from "../article/article-render-cache";

/** 大型文章分帧挂载时使用的取消与完成回调。 */
export interface ArticleIncrementalRenderOptions {
  isCancelled: () => boolean;
  /** 首批正文挂载后立即显示文章，不等待全部离屏节点完成。 */
  onFirstContent: () => void;
  /** 每批章节挂载后通知编辑器校正滚动锚点。 */
  onProgress: () => void;
  onComplete: () => void;
}

/** 文章渲染所需的编辑器状态和回调。 */
export interface ArticleRendererOptions {
  app: App;
  document: MindMapDocument;
  selectedId: string;
  readOnly: boolean;
  /** Returns the live lock state after render-free reading/editing toggles. */
  isReadOnly: () => boolean;
  articleBaseDepth: number;
  showArticleToc: boolean;
  articleTocEntries: ArticleTocEntry[];
  articleTocMaxDepth: number;
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
  openAiContextMenu: (event: MouseEvent, nodeId: string, blockId?: string) => void;
  openImageContextMenu: (event: MouseEvent, nodeId: string, blockId: string) => void;
  editTableBlock: (node: MindMapNode, table: MindMapTable, blockId: string) => void;
  updateTableColumnWidths: (node: MindMapNode, blockId: string, widths: number[]) => void;
  makeInlineEditable: (element: HTMLElement, node: MindMapNode, placeholder: string, blockId?: string) => void;
  makeInlineCodeEditable: (element: HTMLElement, node: MindMapNode, code: MindMapCodeBlock, blockId: string) => void;
  addInlineNodeActions: (container: HTMLElement, node: MindMapNode) => void;
  incremental?: ArticleIncrementalRenderOptions;
  currentFilePath: string;
  articleCache: ArticleRenderCacheSnapshot | null;
  onArticleCacheUpdate: (snapshot: ArticleRenderCacheSnapshot) => void;
  /** One-render memo for normalized content blocks; callers normally leave this unset. */
  contentBlockCache?: WeakMap<MindMapNode, MindMapContentBlock[]>;
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

/** 根据文档文章样式和文章上下文渲染完整文章页。 */
export function renderArticleMode(container: HTMLElement, options: ArticleRendererOptions): void {
  options = options.contentBlockCache ? options : { ...options, contentBlockCache: new WeakMap() };
  container.empty();
  const articleStyle = resolveArticleStyle(options.document.articleStyle);
  const page = container.createDiv({ cls: `mms-article-page article-${articleStyle.preset} toc-${articleStyle.tocStyle ?? "card"}` });
  page.dataset.nodeId = options.document.root.id;
  applyArticleStyle(page, articleStyle);
  const pageEntry = currentArticlePageEntry(options.articleNavigation);
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
    options.incremental?.onComplete();
    return;
  }

  const infos = buildArticleNodeInfo(options.document.root, options.articleBaseDepth, {
    enabled: options.articleLeafNumberingEnabled,
    threshold: options.articleLeafNumberingThreshold,
    style: options.articleLeafNumberingStyle
  }, (node) => articleNodeContentBlocks(node, options)
    .find((block): block is MindMapTextContentBlock => block.type === "text")?.text.trim() ?? "");
  if (!options.incremental) {
    for (const info of infos) {
      const section = page.createEl("section");
      renderArticleNodeSection(section, info, options);
    }
    renderArticlePager(page, options);
    return;
  }

  const presentationFingerprint = articlePresentationFingerprint(options);
  const previousCache = compatibleArticleCache(options.articleCache, options.currentFilePath, presentationFingerprint);
  const nextCacheNodes: Record<string, ArticleNodeRenderCacheEntry> = {};
  const sections = new Map<string, HTMLElement>();
  const infoById = new Map(infos.map((info) => [info.node.id, info]));
  const fingerprints = new Map<string, string>();
  const cachedEntries = new Map<string, ArticleNodeRenderCacheEntry>();

  for (const info of infos) {
    const section = page.createEl("section", { cls: `mms-article-node is-render-pending depth-${Math.min(info.depth, 8)}` });
    section.dataset.nodeId = info.node.id;
    section.id = info.anchor;
    sections.set(info.node.id, section);
    const fingerprint = articleNodeFingerprint(info, options);
    fingerprints.set(info.node.id, fingerprint);
    const cached = previousCache?.nodes[info.node.id];
    if (cached?.fingerprint === fingerprint && isArticleNodeCacheable(info.node, options)) {
      cachedEntries.set(info.node.id, cached);
    }
  }

  const orderedIds = prioritizeArticleNodeIds(
    infos.map((info) => info.node.id),
    buildHierarchyFocusOrder(options.document.root, options.selectedId)
  );
  let firstContentRevealed = false;

  const complete = (): void => {
    renderArticlePager(page, options);
    const now = Date.now();
    const snapshot: ArticleRenderCacheSnapshot = {
      schemaVersion: ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
      rendererRevision: ARTICLE_RENDERER_REVISION,
      filePath: options.currentFilePath,
      documentFingerprint: articleCacheFingerprint(infos.map((info) => [info.node.id, fingerprints.get(info.node.id) ?? ""])),
      presentationFingerprint,
      nodes: nextCacheNodes,
      updatedAt: now,
      lastAccessedAt: now
    };
    options.onArticleCacheUpdate(snapshot);
    options.incremental?.onComplete();
  };

  const renderBatch = (startIndex: number): void => {
    if (options.incremental?.isCancelled()) return;
    const startedAt = performance.now();
    let index = startIndex;
    const firstBatch = startIndex === 0;
    const minimumBatch = firstBatch ? 1 : 3;
    const frameBudget = firstBatch ? 4 : 10;
    while (index < orderedIds.length && (index - startIndex < minimumBatch || performance.now() - startedAt < frameBudget)) {
      const nodeId = orderedIds[index]!;
      const info = infoById.get(nodeId);
      const section = sections.get(nodeId);
      if (info && section) {
        const cached = cachedEntries.get(nodeId);
        const restored = cached ? restoreCachedArticleSection(section, cached.html, info, options) : false;
        if (restored && cached) {
          nextCacheNodes[nodeId] = cached;
          hydrateArticleNodeSection(section, info, options);
        } else {
          renderArticleNodeSection(section, info, options);
          if (isArticleNodeCacheable(info.node, options)) {
            nextCacheNodes[nodeId] = {
              fingerprint: fingerprints.get(nodeId) ?? articleNodeFingerprint(info, options),
              html: snapshotArticleSectionHtml(section)
            };
          }
        }
      }
      index += 1;
    }
    if (!firstContentRevealed && (firstBatch || index >= orderedIds.length)) {
      options.incremental?.onFirstContent();
      firstContentRevealed = true;
    }
    options.incremental?.onProgress();
    if (index < orderedIds.length) {
      window.requestAnimationFrame(() => renderBatch(index));
      return;
    }
    complete();
  };

  if (!orderedIds.length) {
    options.incremental.onFirstContent();
    complete();
    return;
  }
  renderBatch(0);
}

/** Returns a cache only when it belongs to the current file and presentation contract. */
function compatibleArticleCache(
  snapshot: ArticleRenderCacheSnapshot | null,
  filePath: string,
  presentationFingerprint: string
): ArticleRenderCacheSnapshot | null {
  if (!snapshot) return null;
  if (snapshot.schemaVersion !== ARTICLE_RENDER_CACHE_SCHEMA_VERSION) return null;
  if (snapshot.rendererRevision !== ARTICLE_RENDERER_REVISION) return null;
  if (normalizeArticleCachePath(snapshot.filePath) !== normalizeArticleCachePath(filePath)
    || snapshot.presentationFingerprint !== presentationFingerprint) return null;
  return snapshot;
}

/** Presentation changes invalidate snapshots even when node content is unchanged. */
function articlePresentationFingerprint(options: ArticleRendererOptions): string {
  return articleCacheFingerprint({
    rendererRevision: ARTICLE_RENDERER_REVISION,
    articleBaseDepth: options.articleBaseDepth,
    readOnly: options.readOnly,
    showArticleToc: options.showArticleToc,
    articleTocMaxDepth: options.articleTocMaxDepth,
    articleLeafBulletsEnabled: options.articleLeafBulletsEnabled,
    articleLeafBulletColor: options.articleLeafBulletColor,
    articleLeafBulletStyle: options.articleLeafBulletStyle,
    articleLeafTextAlignment: options.articleLeafTextAlignment,
    articleLeafNumberingEnabled: options.articleLeafNumberingEnabled,
    articleLeafNumberingStyle: options.articleLeafNumberingStyle,
    articleLeafNumberingThreshold: options.articleLeafNumberingThreshold,
    imageHostPriorityIds: options.imageHostPriorityIds,
    articleNavigation: options.articleNavigation,
    articleStyle: options.document.articleStyle,
    articleLandingMode: options.document.view?.articleLandingMode
  });
}

/** A moved, renumbered, restyled, or edited node receives a different fingerprint. */
function articleNodeFingerprint(
  info: ReturnType<typeof buildArticleNodeInfo>[number],
  options: ArticleRendererOptions
): string {
  return articleNodeRenderFingerprint(info.node, {
    rendererRevision: ARTICLE_RENDERER_REVISION,
    depth: info.depth,
    anchor: info.anchor,
    label: info.label,
    title: info.title,
    isHeading: info.isHeading,
    skipped: info.skipped,
    numberedLeaf: info.numberedLeaf,
    leafNumberingStyle: info.leafNumberingStyle,
    leafNumberingIndex: info.leafNumberingIndex,
    readOnly: options.readOnly,
    leafBullets: options.articleLeafBulletsEnabled,
    leafBulletColor: options.articleLeafBulletColor,
    leafBulletStyle: options.articleLeafBulletStyle,
    leafTextAlignment: options.articleLeafTextAlignment
  });
}

/** Code blocks own asynchronous Markdown components, so they are rebuilt instead of persisted as inert HTML. */
function isArticleNodeCacheable(node: MindMapNode, options: ArticleRendererOptions): boolean {
  return !articleNodeContentBlocks(node, options).some((block) => block.type === "code");
}

/** Restores safe static HTML immediately; interactive behavior is hydrated in a later frame. */
function restoreCachedArticleSection(
  section: HTMLElement,
  html: string,
  info: ReturnType<typeof buildArticleNodeInfo>[number],
  options: ArticleRendererOptions
): boolean {
  if (!html || /<\s*(script|iframe|object|embed)\b/i.test(html)) return false;
  section.innerHTML = html;
  section.querySelectorAll("script,iframe,object,embed").forEach((element) => element.remove());
  section.querySelectorAll<HTMLElement>("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
    }
  });
  section.className = `mms-article-node depth-${Math.min(info.depth, 8)}${!options.readOnly && options.selectedId === info.node.id ? " is-selected" : ""}`;
  section.dataset.nodeId = info.node.id;
  section.id = info.anchor;
  return true;
}

/** Stores only stable generated markup; live actions and edit state are recreated during hydration. */
function snapshotArticleSectionHtml(section: HTMLElement): string {
  const clone = section.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".mms-inline-node-actions").forEach((element) => element.remove());
  clone.querySelectorAll<HTMLElement>("*").forEach((element) => {
    element.removeAttribute("contenteditable");
    element.removeAttribute("spellcheck");
    element.removeAttribute("tabindex");
    for (const attribute of Array.from(element.attributes)) {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
    }
  });
  clone.querySelectorAll("script,iframe,object,embed").forEach((element) => element.remove());
  return clone.innerHTML;
}

/** Binds the current editor instance to one restored static node without rebuilding its visible DOM. */
function hydrateArticleNodeSection(
  section: HTMLElement,
  info: ReturnType<typeof buildArticleNodeInfo>[number],
  options: ArticleRendererOptions
): void {
  const blockElements = indexArticleBlockElements(section);
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
    const heading = section.querySelector<HTMLElement>(".mms-article-section-heading");
    const headingText = heading?.querySelector<HTMLElement>(".mms-article-heading-text");
    const textBlock = articleNodeContentBlocks(info.node, options).find((block): block is MindMapTextContentBlock => block.type === "text");
    if (headingText) {
      options.makeInlineEditable(headingText, info.node, "章节标题", textBlock?.id);
      if (info.node.submap && headingText instanceof HTMLAnchorElement) {
        headingText.dataset.mmsExplicitEditOnly = "true";
        headingText.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (headingText.contentEditable === "true") return;
          options.selectNode(info.node.id);
          void options.callbacks.onOpenMindMap(info.node.submap!.path);
        });
      }
    }
    if (heading) options.addInlineNodeActions(heading, info.node);
    hydrateArticleNodeContent(section, info.node, false, options, blockElements);
    return;
  }

  const blocks = articleNodeContentBlocks(info.node, options);
  const firstTextBlock = blocks.find((block): block is MindMapTextContentBlock => block.type === "text");
  if (firstTextBlock) {
    const paragraph = findBlockElement(blockElements, firstTextBlock.id, "p");
    if (paragraph) options.makeInlineEditable(paragraph, info.node, "正文段落", firstTextBlock.id);
  } else if (!options.readOnly && blocks.length === 0) {
    const paragraph = section.querySelector<HTMLElement>(".mms-article-leaf-text");
    if (paragraph) options.makeInlineEditable(paragraph, info.node, "正文段落");
  }
  options.addInlineNodeActions(section, info.node);
  hydrateArticleNodeContent(section, info.node, false, options, blockElements);
}

/** Rebinds text, image, table, and question interactions inside a restored node. */
function hydrateArticleNodeContent(
  container: HTMLElement,
  node: MindMapNode,
  treatTextAsBody: boolean,
  options: ArticleRendererOptions,
  blockElements: ArticleBlockElementIndex = indexArticleBlockElements(container)
): void {
  let firstTextHandled = false;
  for (const block of articleNodeContentBlocks(node, options)) {
    if (block.type === "text") {
      if (!treatTextAsBody && !firstTextHandled) { firstTextHandled = true; continue; }
      firstTextHandled = true;
      const paragraph = findBlockElement(blockElements, block.id, "p");
      if (paragraph) options.makeInlineEditable(paragraph, node, "正文", block.id);
    } else if (block.type === "image") {
      const shell = findBlockElement(blockElements, block.id, ".mms-article-content-block");
      const image = shell?.querySelector<HTMLImageElement>("img.mms-article-image");
      if (!shell || !image) continue;
      clearImageFailureDetails(shell);
      let activeResolved: string | null = null;
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
        new ImagePreviewModal(
          options.app,
          activeResolved,
          block.alt ?? "图片",
          imageSourceCandidates(block, true, options.imageHostPriorityIds),
          (source) => options.callbacks.resolveImage(source)
        ).open();
      });
      shell.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        options.selectNode(node.id);
        options.openImageContextMenu(event, node.id, block.id);
      });
    } else if (block.type === "table") {
      const wrap = findBlockElement(blockElements, block.id, ".mms-article-table-wrap");
      if (wrap) hydrateArticleTable(wrap, node, block.table, block.id, options);
    }
  }
  hydrateArticleQuestionDetails(container);
}

/** Elements carrying the same block ID, indexed once for cached-node hydration. */
type ArticleBlockElementIndex = Map<string, HTMLElement[]>;

/** Builds a block lookup in one subtree scan instead of querying the whole section for every block. */
function indexArticleBlockElements(container: HTMLElement): ArticleBlockElementIndex {
  const index: ArticleBlockElementIndex = new Map();
  container.querySelectorAll<HTMLElement>("[data-block-id]").forEach((element) => {
    const blockId = element.dataset.blockId;
    if (!blockId) return;
    const elements = index.get(blockId);
    if (elements) elements.push(element);
    else index.set(blockId, [element]);
  });
  return index;
}

/** Finds a generated element among the small same-ID bucket without relying on CSS.escape support. */
function findBlockElement(index: ArticleBlockElementIndex, blockId: string, selector: string): HTMLElement | null {
  return index.get(blockId)?.find((element) => element.matches(selector)) ?? null;
}

/** Reconnects resize and edit behavior to a table restored from cached HTML. */
function hydrateArticleTable(
  wrap: HTMLElement,
  node: MindMapNode,
  tableData: MindMapTable,
  blockId: string,
  options: ArticleRendererOptions
): void {
  const table = wrap.querySelector<HTMLTableElement>("table.mms-article-table");
  if (!table) return;
  const columns = Array.from(table.querySelectorAll<HTMLTableColElement>("colgroup col"));
  const headers = Array.from(table.querySelectorAll<HTMLTableCellElement>("thead th"));
  const applyWidths = (widths: readonly number[]): void => {
    table.addClass("has-custom-column-widths");
    columns.forEach((column, index) => { column.style.width = `${widths[index] ?? 160}px`; });
    table.style.width = `${widths.reduce((sum, width) => sum + width, 0)}px`;
  };
  if (tableData.columnWidths?.length) applyWidths(tableData.columnWidths);
  bindTableDoubleClick(table, {
    isReadOnly: options.isReadOnly,
    isResizeTarget: (target) => target instanceof HTMLElement && Boolean(target.closest(".mms-table-column-resizer")),
    edit: () => options.editTableBlock(node, tableData, blockId)
  });
  headers.forEach((header, index) => {
    let handle = header.querySelector<HTMLElement>(":scope > .mms-table-column-resizer");
    if (!handle) {
      handle = header.createSpan({
        cls: "mms-table-column-resizer",
        attr: { role: "separator", title: `拖动调整第 ${index + 1} 列宽度`, "aria-label": `调整第 ${index + 1} 列宽度` }
      });
    }
    handle.addEventListener("dblclick", (event) => event.stopPropagation());
    bindTableColumnResize(handle, {
      eventTarget: window,
      isReadOnly: options.isReadOnly,
      columnIndex: index,
      initialWidths: () => headers.map((cell, columnIndex) => tableData.columnWidths?.[columnIndex]
        ?? Math.max(64, Math.round(cell.getBoundingClientRect().width))),
      applyWidths,
      setResizing: (resizing) => wrap.toggleClass("is-resizing-columns", resizing),
      commitWidths: (widths) => options.updateTableColumnWidths(node, blockId, widths)
    });
  });
}

/** Restores the answer/explanation toggle for cached question panels. */
function hydrateArticleQuestionDetails(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>(".mms-question-panel").forEach((panel) => {
    const toggle = panel.querySelector<HTMLButtonElement>(".mms-question-toggle");
    const reveal = panel.querySelector<HTMLElement>(".mms-question-reveal");
    if (!toggle || !reveal) return;
    toggle.addEventListener("click", () => {
      const revealed = !reveal.hasClass("is-revealed");
      reveal.toggleClass("is-revealed", revealed);
      toggle.setText(revealed ? "隐藏答案与解析" : "显示答案与解析");
      toggle.setAttr("aria-expanded", String(revealed));
    });
  });
}

/** 挂载一个文章节点占位区的完整内容和交互。 */
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

/** 将解析后的文章样式写入文章页 CSS 变量。 */
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
    const link = item.createEl("a", { text: entry.displayTitle || entry.title || "未命名标题", href: entry.filePath, attr: { title: entry.breadcrumb.join(" › ") } });
    link.addEventListener("click", (event) => {
      event.preventDefault();
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
        new ImagePreviewModal(
          options.app,
          activeResolved,
          block.alt ?? "图片",
          imageSourceCandidates(block, true, options.imageHostPriorityIds),
          (source) => options.callbacks.resolveImage(source)
        ).open();
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
    columns.forEach((column, index) => {
      column.style.width = `${widths[index] ?? 160}px`;
    });
    table.style.width = `${widths.reduce((sum, width) => sum + width, 0)}px`;
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
  headers.forEach((header, index) => {
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
        const stored = tableData.columnWidths?.[columnIndex];
        return stored ?? Math.max(64, Math.round(cell.getBoundingClientRect().width));
      }),
      applyWidths,
      setResizing: (resizing) => wrap.toggleClass("is-resizing-columns", resizing),
      commitWidths: (widths) => options.updateTableColumnWidths(node, blockId, widths)
    });
  });
}

/** Renders structured question options, answers, explanations, and original source in article and reading modes. */
function renderArticleQuestionDetails(container: HTMLElement, node: MindMapNode): void {
  const question = node.question;
  if (!question) return;
  const plainText = (blocks: typeof question.stem): string => blocks
    .map((block) => block.type === "text" ? block.text.trim() : "[图片]")
    .filter(Boolean).join(" ");
  const panel = container.createDiv({ cls: "mms-question-panel" });
  const meta = panel.createDiv({ cls: "mms-question-meta" });
  meta.createDiv({ cls: "mms-question-kind", text: question.mode === "essay" ? "大题" : question.mode === "judgment" ? "判断题" : "选择题" });
  const statusLabels = { unanswered: "未做", completed: "已做", favorite: "收藏", wrong: "错题", mastered: "掌握" } as const;
  meta.createDiv({ cls: `mms-question-status is-${question.status}`, text: statusLabels[question.status] });
  const appendField = (container: HTMLElement, label: string, value: string, cls = ""): void => {
    if (!value) return;
    const row = container.createDiv({ cls: `mms-question-row ${cls}`.trim() });
    row.createEl("strong", { text: `${label}：` });
    row.createSpan({ text: value });
  };
  if (question.mode !== "essay") {
    for (const option of question.options) appendField(panel, option.label, plainText(option.content), "is-option");
  }
  const answer = plainText(question.answer);
  const explanation = plainText(question.explanation);
  if (answer || explanation) {
    const toggle = panel.createEl("button", { cls: "mms-question-toggle", text: "显示答案与解析", attr: { type: "button", "aria-expanded": "false" } });
    const reveal = panel.createDiv({ cls: "mms-question-reveal" });
    appendField(reveal, "答案", answer, "is-answer");
    appendField(reveal, "解答", explanation, "is-explanation");
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
  parent.addEventListener("click", () => void options.callbacks.onOpenMindMap(navigation.parentPath!));
  if (next) addTarget("mms-article-pager-next", next.depth <= 1 ? "下一章 " : "下一节 ", next);
  else {
    const end = pager.createEl("button", { cls: "mms-article-pager-end", attr: { type: "button" } });
    end.createSpan({ cls: "mms-article-pager-direction", text: "阅读完成" });
    end.createSpan({ cls: "mms-article-pager-title", text: "END · 返回目录" });
    end.addEventListener("click", () => void options.callbacks.onOpenArticleDirectory(navigation.homePath));
  }
}
