/**
 * @file article-renderer.ts
 * @description 文章模式的目录、章节、正文和分页导航渲染器。
 */

import { App, setIcon } from "obsidian";
import {
  nodeContentBlocks,
  nodePrimaryText,
  type MindMapDocument,
  type MindMapNode,
  type MindMapTextContentBlock
} from "../core/model";
import { buildArticleNodeInfo, type ArticlePageNavigation, type ArticleTocEntry } from "../article/modes";
import { resolveArticleStyle } from "../article/article-style";
import type { MindMapEditorCallbacks } from "./editor-types";
import { ImagePreviewModal } from "./editor-modals";
import { renderRichTextRuns } from "./rich-text-dom";

/** 文章渲染所需的编辑器状态和回调。 */
export interface ArticleRendererOptions {
  app: App;
  document: MindMapDocument;
  selectedId: string;
  readOnly: boolean;
  articleBaseDepth: number;
  showArticleToc: boolean;
  articleTocEntries: ArticleTocEntry[];
  articleTocMaxDepth: number;
  articleNavigation?: ArticlePageNavigation;
  articleNavigationIndex: number | null;
  callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onRenderCode" | "onOpenMindMap" | "onOpenArticleDirectory">;
  selectNode: (id: string) => void;
  makeInlineEditable: (element: HTMLElement, node: MindMapNode, placeholder: string) => void;
  addInlineNodeActions: (container: HTMLElement, node: MindMapNode) => void;
}

/** 根据文档文章样式和文章上下文渲染完整文章页。 */
export function renderArticleMode(container: HTMLElement, options: ArticleRendererOptions): void {
  container.empty();
  const articleStyle = resolveArticleStyle(options.document.articleStyle);
  const page = container.createDiv({ cls: `mms-article-page article-${articleStyle.preset} toc-${articleStyle.tocStyle ?? "card"}` });
  applyArticleStyle(page, articleStyle);
  const title = page.createEl("h1", { cls: "mms-article-document-title", text: nodePrimaryText(options.document.root) || options.document.title });
  options.makeInlineEditable(title, options.document.root, "文章标题");
  options.addInlineNodeActions(page, options.document.root);

  const directoryOnly = options.showArticleToc
    && options.articleTocEntries.length > 0
    && options.document.view?.articleLandingMode !== "article";
  if (directoryOnly) {
    renderDirectory(page, options);
    return;
  }

  for (const info of buildArticleNodeInfo(options.document.root, options.articleBaseDepth)) {
    const section = page.createEl("section", { cls: `mms-article-node depth-${Math.min(info.depth, 8)}${options.selectedId === info.node.id ? " is-selected" : ""}` });
    section.dataset.nodeId = info.node.id;
    section.id = info.anchor;
    section.addEventListener("click", () => options.selectNode(info.node.id));
    if (info.isHeading) {
      const level = Math.min(6, info.depth + 1);
      const heading = section.createEl(`h${level}` as keyof HTMLElementTagNameMap, { cls: "mms-article-heading" });
      if (info.label) heading.createSpan({ cls: "mms-article-number", text: info.label });
      renderHeading(heading, info.node, info.title, options);
      if (info.skipped) heading.createSpan({ cls: "mms-article-skip-badge", text: "不编号" });
      options.addInlineNodeActions(heading, info.node);
      renderArticleNodeContent(section, info.node, false, options);
    } else {
      const firstTextBlock = nodeContentBlocks(info.node).find((block): block is MindMapTextContentBlock => block.type === "text");
      if (firstTextBlock || !options.readOnly) {
        const paragraph = section.createEl("p", { cls: "mms-article-leaf-text" });
        if (firstTextBlock) {
          renderRichTextRuns(paragraph, firstTextBlock.richText, firstTextBlock.text);
        }
        options.makeInlineEditable(paragraph, info.node, "正文段落");
      }
      options.addInlineNodeActions(section, info.node);
      renderArticleNodeContent(section, info.node, false, options);
    }
  }
  renderArticlePager(page, options);
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
  for (const entry of options.articleTocEntries.filter((item) => item.depth <= options.articleTocMaxDepth)) {
    const item = list.createEl("li", { cls: `depth-${Math.min(entry.depth, 8)}` });
    item.style.setProperty("--mms-article-depth", String(entry.depth));
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
    const headingLink = heading.createEl("a", { cls: "mms-article-heading-text mms-submap-text-link", text: title, href: node.submap.path, attr: { title: `打开子导图：${node.submap.title ?? node.submap.path}` } });
    headingLink.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      options.selectNode(node.id);
      void options.callbacks.onOpenMindMap(node.submap!.path);
    });
  } else {
    const headingText = heading.createSpan({ cls: "mms-article-heading-text", text: title });
    options.makeInlineEditable(headingText, node, "章节标题");
  }
}

/** 渲染文章节点的正文块、图片、备注、表格和代码。 */
export function renderArticleNodeContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean, options: ArticleRendererOptions): void {
  let firstTextHandled = false;
  for (const block of nodeContentBlocks(node)) {
    if (block.type === "text") {
      if (!treatTextAsBody && !firstTextHandled) { firstTextHandled = true; continue; }
      firstTextHandled = true;
      const paragraph = container.createEl("p", { cls: "mms-article-paragraph" });
      renderRichTextRuns(paragraph, block.richText, block.text);
      if (treatTextAsBody) options.makeInlineEditable(paragraph, node, "正文");
    } else {
      const resolved = options.callbacks.resolveImage(block.source);
      const image = container.createEl("img", { cls: "mms-article-image", attr: { src: resolved ?? block.source, alt: block.alt ?? "图片" } });
      image.addEventListener("click", () => new ImagePreviewModal(options.app, resolved ?? block.source, block.alt ?? "图片").open());
    }
  }
  if (node.note) container.createEl("p", { cls: "mms-article-note", text: node.note });
  if (node.table) {
    const table = container.createDiv({ cls: "mms-article-table-wrap" }).createEl("table", { cls: "mms-article-table" });
    const tr = table.createEl("thead").createEl("tr");
    node.table.headers.forEach((header) => tr.createEl("th", { text: header }));
    const body = table.createEl("tbody");
    node.table.rows.forEach((row) => {
      const rowEl = body.createEl("tr");
      node.table!.headers.forEach((_, index) => rowEl.createEl("td", { text: row[index] ?? "" }));
    });
  }
  if (node.code) void options.callbacks.onRenderCode(node.code, container.createDiv({ cls: "mms-article-code markdown-rendered" }));
}

/** 渲染子文章上一节、父级、下一节与阅读完成导航。 */
function renderArticlePager(page: HTMLElement, options: ArticleRendererOptions): void {
  const navigation = options.articleNavigation;
  if (!navigation?.parentPath || !navigation.entries.length) return;
  const index = options.articleNavigationIndex ?? navigation.currentIndex;
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
