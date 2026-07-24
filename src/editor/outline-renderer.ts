/**
 * @file outline-renderer.ts
 * @description 大纲模式的递归 DOM 渲染器。
 */

import {
  nodePlainText,
  nodePrimaryText,
  type MindMapDocument,
  type MindMapNode
} from "../core/model";

/** 大纲渲染所需的编辑器回调边界。 */
export interface OutlineRendererOptions {
  document: MindMapDocument;
  selectedId: string;
  readOnly: boolean;
  selectNode: (id: string) => void;
  makeInlineEditable: (element: HTMLElement, node: MindMapNode, placeholder: string) => void;
  addInlineNodeActions: (container: HTMLElement, node: MindMapNode) => void;
  mutate: (action: () => void) => void;
  editSelected: () => void;
  openMindMap: (path: string) => void | Promise<void>;
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

  const list = page.createDiv({ cls: "mms-outline-list" });
  const visit = (node: MindMapNode, depth: number): void => {
    const item = list.createDiv({ cls: `mms-outline-item depth-${Math.min(depth, 8)}` });
    item.style.setProperty("--mms-outline-depth", String(depth));
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
    if (node.note) item.createDiv({ cls: "mms-outline-note", text: node.note });
    node.children.forEach((child) => visit(child, depth + 1));
  };
  root.children.forEach((child) => visit(child, 1));
}
