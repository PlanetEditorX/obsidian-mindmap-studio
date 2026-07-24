/**
 * @file outline-renderer.ts
 * @description 大纲模式的递归 DOM 渲染器。
 */

import { App } from "obsidian";
import {
  nodeContentBlocks,
  nodePlainText,
  nodePrimaryText,
  type MindMapDocument,
  type MindMapNode,
  type MindMapTextContentBlock
} from "../core/model";
import type { MindMapEditorCallbacks } from "./editor-types";
import { ImagePreviewModal } from "./editor-modals";
import { renderRichTextRuns } from "./rich-text-dom";

/** 大纲渲染所需的编辑器回调边界。 */
export interface OutlineRendererOptions {
  app: App;
  document: MindMapDocument;
  selectedId: string;
  readOnly: boolean;
  selectNode: (id: string) => void;
  makeInlineEditable: (element: HTMLElement, node: MindMapNode, placeholder: string) => void;
  addInlineNodeActions: (container: HTMLElement, node: MindMapNode) => void;
  mutate: (action: () => void) => void;
  editSelected: () => void;
  openMindMap: (path: string) => void | Promise<void>;
  resolveImage: MindMapEditorCallbacks["resolveImage"];
  renderCode: MindMapEditorCallbacks["onRenderCode"];
}

/**
 * 将同一份节点树渲染为可编辑大纲。
 */
export function renderOutlineMode(container: HTMLElement, options: OutlineRendererOptions): void {
  container.empty();
  const page = container.createDiv({ cls: "mms-outline-page" });
  const root = options.document.root;
  const titleRow = page.createDiv({ cls: `mms-outline-row is-root${options.selectedId === root.id ? " is-selected" : ""}` });
  titleRow.dataset.nodeId = root.id;
  const title = titleRow.createDiv({ cls: "mms-outline-title is-root-title", text: nodePrimaryText(root) || options.document.title });
  options.makeInlineEditable(title, root, "导图标题");
  options.addInlineNodeActions(titleRow, root);
  titleRow.addEventListener("click", () => options.selectNode(root.id));
  renderOutlineContent(page, root, 0, options);

  const list = page.createDiv({ cls: "mms-outline-list" });
  const visit = (node: MindMapNode, depth: number): void => {
    const item = list.createDiv({ cls: `mms-outline-item depth-${Math.min(depth, 8)}` });
    item.style.setProperty("--mms-outline-depth", String(depth));
    const firstTextBlock = nodeContentBlocks(node).find((block): block is MindMapTextContentBlock => block.type === "text");
    const contentOnly = !firstTextBlock?.text.trim() && !node.submap
      && Boolean(node.table || node.code || node.note || nodeContentBlocks(node).some((block) => block.type === "image"));
    item.toggleClass("is-content-only", contentOnly);
    const row = item.createDiv({ cls: `mms-outline-row${options.selectedId === node.id ? " is-selected" : ""}` });
    row.dataset.nodeId = node.id;
    row.createSpan({ cls: "mms-outline-bullet", text: node.children.length || node.submap ? "◆" : "•" });
    if (node.task) {
      const task = row.createEl("input", { type: "checkbox", cls: "mms-outline-task" });
      task.checked = node.task === "done";
      task.disabled = options.readOnly;
      task.addEventListener("change", (event) => {
        event.stopPropagation();
        options.selectNode(node.id);
        options.mutate(() => { node.task = task.checked ? "done" : "todo"; });
      });
    }
    const label = nodePlainText(node) || (node.submap?.title ?? "图片节点");
    if (node.submap) {
      const link = row.createEl("a", {
        cls: "mms-outline-title mms-submap-text-link",
        text: label,
        href: node.submap.path,
        attr: { title: `打开子导图：${node.submap.title ?? node.submap.path}` }
      });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        options.selectNode(node.id);
        void options.openMindMap(node.submap!.path);
      });
    } else {
      const text = row.createDiv({ cls: "mms-outline-title", text: label });
      options.makeInlineEditable(text, node, "节点文字");
    }
    if (node.skipArticleNumbering) row.createSpan({ cls: "mms-outline-badge", text: "文章不编号" });
    options.addInlineNodeActions(row, node);
    row.addEventListener("click", () => options.selectNode(node.id));
    row.addEventListener("dblclick", () => {
      options.selectNode(node.id);
      if (node.submap) void options.openMindMap(node.submap.path);
      else if (!options.readOnly) options.editSelected();
    });
    renderOutlineContent(item, node, depth, options);
    node.children.forEach((child) => visit(child, depth + 1));
  };
  root.children.forEach((child) => visit(child, 1));
}

/** 渲染节点主标题以外的文字、图片、表格、代码和备注内容。 */
function renderOutlineContent(container: HTMLElement, node: MindMapNode, depth: number, options: OutlineRendererOptions): void {
  const blocks = nodeContentBlocks(node);
  const additionalText = blocks.filter((block): block is MindMapTextContentBlock => block.type === "text").slice(1);
  const images = blocks.filter((block) => block.type === "image");
  if (!additionalText.length && !images.length && !node.table && !node.code && !node.note) return;

  const content = container.createDiv({ cls: "mms-outline-content" });
  content.style.setProperty("--mms-outline-content-depth", String(depth));
  content.addEventListener("click", (event) => {
    event.stopPropagation();
    options.selectNode(node.id);
  });
  content.addEventListener("dblclick", (event) => {
    event.stopPropagation();
    options.selectNode(node.id);
    if (!options.readOnly) options.editSelected();
  });
  for (const block of additionalText) {
    const paragraph = content.createDiv({ cls: "mms-outline-text-block" });
    renderRichTextRuns(paragraph, block.richText, block.text);
  }
  for (const block of images) {
    const resolved = options.resolveImage(block.source);
    const figure = content.createEl("figure", { cls: "mms-outline-image" });
    if (resolved) {
      const image = figure.createEl("img", { attr: { src: resolved, alt: block.alt ?? "图片", loading: "lazy" } });
      image.addEventListener("click", () => new ImagePreviewModal(options.app, resolved, block.alt ?? "图片").open());
    } else {
      figure.createDiv({ cls: "mms-outline-image-placeholder", text: "图片无法加载" });
    }
    if (block.alt) figure.createEl("figcaption", { text: block.alt });
  }
  if (node.table) {
    const tableWrap = content.createDiv({ cls: "mms-outline-table-wrap" });
    const table = tableWrap.createEl("table", { cls: "mms-outline-table" });
    const heading = table.createEl("thead").createEl("tr");
    node.table.headers.forEach((header) => heading.createEl("th", { text: header }));
    const body = table.createEl("tbody");
    node.table.rows.forEach((row) => {
      const rowElement = body.createEl("tr");
      node.table!.headers.forEach((_, index) => rowElement.createEl("td", { text: row[index] ?? "" }));
    });
  }
  if (node.code) {
    const code = content.createDiv({ cls: "mms-outline-code markdown-rendered" });
    void options.renderCode(node.code, code);
  }
  if (node.note) content.createDiv({ cls: "mms-outline-note", text: node.note });
}
