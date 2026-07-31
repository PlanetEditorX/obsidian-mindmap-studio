/**
 * @file article-renderer.ts
 * @description 文章模式的目录、章节、正文和分页导航渲染器。
 */

import { App, setIcon } from "obsidian";
import {
  imageSourceCandidates,
  nodeContentBlocks,
  nodePrimaryText,
  type MindMapCodeBlock,
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
import type { MindMapEditorCallbacks } from "./editor-types";
import { ImagePreviewModal } from "./editor-modals";
import { renderInlineMarkdown, renderRichTextRuns } from "./rich-text-dom";
import { bindTableColumnResize, bindTableDoubleClick } from "./table-interaction";
import type { ArticleLeafBulletStyle } from "../settings";

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
}

/** 根据文档文章样式和文章上下文渲染完整文章页。 */
export function renderArticleMode(container: HTMLElement, options: ArticleRendererOptions): void {
  container.empty();
  const articleStyle = resolveArticleStyle(options.document.articleStyle);
  const page = container.createDiv({ cls: `mms-article-page article-${articleStyle.preset} toc-${articleStyle.tocStyle ?? "card"}` });
  page.dataset.nodeId = options.document.root.id;
  applyArticleStyle(page, articleStyle);
  const pageEntry = currentArticlePageEntry(options.articleNavigation);
  const rootTitle = nodePrimaryText(options.document.root) || options.document.title;
  const title = page.createEl("h1", { cls: "mms-article-document-title" });
  title.dataset.nodeId = options.document.root.id;
  if (pageEntry?.label) {
    const separator = /[、.）]$/.test(pageEntry.label) ? "" : " ";
    title.createSpan({ cls: "mms-article-number", text: `${pageEntry.label}${separator}` });
  }
  const titleText = title.createSpan({ cls: "mms-article-document-title-text" });
  const rootTextBlock = nodeContentBlocks(options.document.root).find((block): block is MindMapTextContentBlock => block.type === "text");
  renderRichTextRuns(titleText, rootTextBlock?.richText, rootTextBlock?.text ?? rootTitle);
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
    return;
  }

  for (const info of buildArticleNodeInfo(options.document.root, options.articleBaseDepth)) {
    const section = page.createEl("section", { cls: `mms-article-node depth-${Math.min(info.depth, 8)}${!options.readOnly && options.selectedId === info.node.id ? " is-selected" : ""}` });
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
      const headingBlock = nodeContentBlocks(info.node).find((block): block is MindMapTextContentBlock => block.type === "text");
      if (headingBlock) heading.dataset.blockId = headingBlock.id;
      if (info.skipped) heading.createSpan({ cls: "mms-article-skip-badge", text: "不编号" });
      options.addInlineNodeActions(heading, info.node);
      renderArticleNodeContent(section, info.node, false, options);
    } else {
      const blocks = nodeContentBlocks(info.node);
      const firstTextBlock = blocks.find((block): block is MindMapTextContentBlock => block.type === "text");
      if (firstTextBlock?.text.trim()) {
        const blockShell = createArticleContentBlock(section, firstTextBlock.id);
        const paragraph = blockShell.createEl("p", { cls: articleParagraphClass("mms-article-leaf-text", firstTextBlock, options.articleLeafBulletsEnabled) });
        paragraph.dataset.blockId = firstTextBlock.id;
        applyArticleLeafBulletStyle(paragraph, options);
        renderRichTextRuns(paragraph, firstTextBlock.richText, firstTextBlock.text);
        options.makeInlineEditable(paragraph, info.node, "正文段落", firstTextBlock.id);
      } else if (!options.readOnly && blocks.length === 0) {
        // 新建空白末端节点尚无内容块，需要临时渲染一个可编辑行，供
        // addChild()/addSibling() 聚焦；已有表格、图片或代码等内容的节点
        // 不应额外生成无关的空正文段落。
        const paragraph = section.createEl("p", { cls: articleParagraphClass("mms-article-leaf-text", undefined, options.articleLeafBulletsEnabled) });
        applyArticleLeafBulletStyle(paragraph, options);
        renderRichTextRuns(paragraph, undefined, "");
        options.makeInlineEditable(paragraph, info.node, "正文段落");
      }
      options.addInlineNodeActions(section, info.node);
      renderArticleNodeContent(section, info.node, false, options);
    }
  }
  renderArticlePager(page, options);
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
function articleParagraphClass(baseClass: string, block: MindMapTextContentBlock | undefined, bulleted = false): string {
  return `${baseClass}${bulleted ? " is-bulleted" : ""}${block?.paragraphIndent === "none" ? " is-flush" : ""}`;
}

/** Applies the configured terminal bullet color and visual style to one article paragraph. */
function applyArticleLeafBulletStyle(paragraph: HTMLElement, options: ArticleRendererOptions): void {
  if (!options.articleLeafBulletsEnabled) return;
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
    const textBlock = nodeContentBlocks(node).find((block): block is MindMapTextContentBlock => block.type === "text");
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
    const textBlock = nodeContentBlocks(node).find((block): block is MindMapTextContentBlock => block.type === "text");
    renderRichTextRuns(headingText, textBlock?.richText, textBlock?.text ?? title);
    options.makeInlineEditable(headingText, node, "章节标题", textBlock?.id);
  }
}

/** 渲染文章节点的正文块、图片、备注、表格和代码。 */
export function renderArticleNodeContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean, options: ArticleRendererOptions): void {
  let firstTextHandled = false;
  for (const block of nodeContentBlocks(node)) {
    if (block.type === "text") {
      if (!treatTextAsBody && !firstTextHandled) { firstTextHandled = true; continue; }
      firstTextHandled = true;
      const shell = createArticleContentBlock(container, block.id);
      const paragraph = shell.createEl("p", { cls: articleParagraphClass("mms-article-paragraph", block) });
      paragraph.dataset.blockId = block.id;
      renderRichTextRuns(paragraph, block.richText, block.text);
      options.makeInlineEditable(paragraph, node, "正文", block.id);
    } else if (block.type === "image") {
      const shell = createArticleContentBlock(container, block.id, true);
      const resolved = options.callbacks.resolveImage(block.source);
      const image = shell.createEl("img", { cls: `mms-article-image image-align-${block.align ?? "center"}`, attr: { src: resolved ?? block.source, alt: block.alt ?? "图片" } });
      image.dataset.blockId = block.id;
      if (block.width) image.style.width = `${block.width}px`;
      if (block.height) image.style.height = `${block.height}px`;
      image.addEventListener("click", () => new ImagePreviewModal(
        options.app,
        resolved ?? block.source,
        block.alt ?? "图片",
        imageSourceCandidates(block, true, options.imageHostPriorityIds),
        (source) => options.callbacks.resolveImage(source)
      ).open());
      image.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        options.selectNode(node.id);
        options.openImageContextMenu(event, node.id, block.id);
      });
    } else if (block.type === "table") {
      const shell = createArticleContentBlock(container, block.id, true);
      renderArticleTable(shell, node, block.table, block.id, options);
    } else {
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
  const pager = page.createEl("nav", { cls: "mms-article-pager", attr: { "aria-label": "文章前后页导航" } });
  const addTarget = (className: string, prefix: string, entry: ArticleTocEntry): void => {
    const link = pager.createEl("button", { cls: className, attr: { type: "button", title: entry.breadcrumb.join(" › ") } });
    link.createSpan({ cls: "mms-article-pager-direction", text: prefix.trim() });
    link.createSpan({ cls: "mms-article-pager-title", text: entry.displayTitle || entry.title });
    link.addEventListener("click", () => void options.callbacks.onOpenMindMap(entry.filePath, entry.nodeId));
  };
  if (previous) addTarget("mms-article-pager-previous", previous.depth <= 1 ? "上一章 " : "上一节 ", previous);
  else pager.createSpan({ cls: "mms-article-pager-placeholder" });
  const parent = pager.createEl("button", { cls: "mms-article-pager-parent", attr: { type: "button", title: "返回上一级" } });
  setIcon(parent, "corner-left-up");
  parent.createSpan({ text: "返回上一级" });
  parent.addEventListener("click", () => void options.callbacks.onOpenMindMap(navigation.parentPath!));
  if (next) addTarget("mms-article-pager-next", next.depth <= 1 ? "下一章 " : "下一节 ", next);
  else {
    const end = pager.createEl("button", { cls: "mms-article-pager-end", attr: { type: "button", title: "返回总目录" } });
    end.createSpan({ cls: "mms-article-pager-direction", text: "阅读完成" });
    end.createSpan({ cls: "mms-article-pager-title", text: "END · 返回目录" });
    end.addEventListener("click", () => void options.callbacks.onOpenArticleDirectory(navigation.homePath));
  }
}
