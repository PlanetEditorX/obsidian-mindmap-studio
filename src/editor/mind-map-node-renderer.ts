/** @file mind-map-node-renderer.ts
 * @description 导图节点的 DOM 渲染：内容块、拖拽、上下文菜单与选择行为经上下文对象接入编辑器。
 */

import { Notice, setIcon } from "obsidian";
import {
  imageSourceCandidates,
  nodeContentBlocks,
  nodePlainText,
  nodeSearchText,
  replaceNodeContentBlocks,
  type MindMapAppearance,
  type MindMapCodeBlock,
  type MindMapNode,
  type MindMapTable,
  type NodeDropPosition
} from "../core/model";

import { clearImageFailureDetails, renderImageFailureDetails } from "./image-failure-view";
import { renderRichTextRuns } from "./rich-text-dom";
import { isRightChildZone } from "./drag-drop";
import type { LayoutResult } from "../render/layout";
import type { ArticleContextChangeImpact, MindMapEditorCallbacks, MindMapEditorOptions } from "./editor-types";
import type { ReadingLocation } from "../article/reading-location";

export interface MindMapNodeRendererContext {
  /** 右键 AI 作用域节点；拖拽与右键交互会写回。 */
  aiScopeNodeId: string | null;
  beginInlineEdit(nodeId: string, blockId?: string, protectInitialFocus?: boolean): void;
  bindContentBlockAppendDropTarget(dropTarget: HTMLElement, nodeId: string): void;
  bindContentBlockDragHandle(blockElement: HTMLElement, nodeId: string, blockId: string): void;
  readonly callbacks: MindMapEditorCallbacks;
  canMoveNode(draggedId: string | null, targetId: string): boolean;
  clearDropIndicators(): void;
  clearDropPreview(): void;
  /** 拖拽悬停目标位置；节点渲染的拖拽处理器会写回。 */
  dragDropPosition: NodeDropPosition | null;
  /** 正在被拖拽的节点；拖拽处理器会写回。 */
  draggingId: string | null;
  dropPositionForEvent(event: DragEvent, targetEl: HTMLElement, targetId: string): NodeDropPosition;
  editQuestion(node?: MindMapNode): void;
  editSelected(initialBlockId?: string): void;
  getNodeLink(node: MindMapNode): string | null;
  readonly imageLoadTimers: Set<number>;
  isNearNodeEdge(event: MouseEvent, nodeEl: HTMLElement): boolean;
  markSaving(): void;
  readonly mindMapNodeElements: Map<string, HTMLElement>;
  moveNode(draggedId: string, targetId: string, position: NodeDropPosition): void;
  mutateWithoutArticleContext(action: () => void, restoreLocation?: ReadingLocation | null): void;
  navigateWithTransition(action: () => void | Promise<void>, title?: string, description?: string): Promise<void>;
  readonly nodesLayerEl: HTMLDivElement;
  notifyDocumentChange(articleContextImpact?: ArticleContextChangeImpact): void;
  openContextMenu(event: MouseEvent, contextBlockId?: string): void;
  openImageContextMenu(event: MouseEvent, nodeId: string, blockId: string): void;
  openImagePreviewWithSources(nodeId: string, blockId: string): void;
  readonly options: MindMapEditorOptions;
  readonly readOnly: boolean;
  renderNodeCode(content: HTMLElement, node: MindMapNode, codeData: MindMapCodeBlock, blockId?: string): HTMLElement;
  renderNodeTable(content: HTMLElement, node: MindMapNode, tableData: MindMapTable, blockId?: string): HTMLElement;
  renderQuestionSummary(content: HTMLElement, node: MindMapNode): void;
  readonly resizeObserver: ResizeObserver | null;
  readonly searchQuery: string;
  selectNode(id: string | null): void;
  readonly selectedId: string;
  readonly selectedIds: Set<string>;
  showDropPreview(targetId: string, position: NodeDropPosition): void;
  toggleCollapse(): void;
  toggleNodeSelection(id: string): void;
  updateAiScopeButton(): void;
  readonly zoom: number;
}

/** 渲染单个导图节点及其全部内容块与交互绑定；状态经 `ctx` 读写编辑器。 */
export function renderMindMapNode(
  ctx: MindMapNodeRendererContext,
  position: LayoutResult["nodes"][number],
  appearance: MindMapAppearance,
  branchColorMap: ReadonlyMap<string, string>
): void {  const node = position.node;
  const shape = node.style?.shape ?? ctx.options.defaultNodeShape;
  const textAlign = node.style?.textAlign ?? appearance.nodeTextAlign ?? "center";
  const classes = ["mmc-node", position.depth === 0 ? "is-root" : "", node.submap ? "is-submap-node" : "", `shape-${shape}`, `text-align-${textAlign}`].filter(Boolean).join(" ");
  const nodeEl = ctx.nodesLayerEl.createDiv({ cls: classes });
  nodeEl.dataset.nodeId = node.id;
  ctx.mindMapNodeElements.set(node.id, nodeEl);
  nodeEl.style.left = `${position.x}px`;
  nodeEl.style.top = `${position.y}px`;
  nodeEl.style.width = `${position.width}px`;
  // Layout estimates are only provisional coordinates. Keep a small global
  // floor so a brand-new empty node remains visible and editable, while
  // still allowing rich content and collapsed code blocks to shrink to
  // their real DOM height. User-defined minimum height continues to win.
  nodeEl.style.minHeight = `${Math.max(36, node.style?.minHeight ?? 0)}px`;
  nodeEl.style.setProperty("--mmc-node-text-align", textAlign);
  nodeEl.draggable = position.depth > 0 && !ctx.readOnly;
  if (ctx.selectedId === node.id || ctx.selectedIds.has(node.id)) nodeEl.addClass("is-selected");
  if (ctx.selectedIds.size > 1 && ctx.selectedIds.has(node.id)) nodeEl.addClass("is-multi-selected");
  if (ctx.searchQuery && nodeSearchText(node).includes(ctx.searchQuery)) nodeEl.addClass("is-search-match");
  const isRoot = position.depth === 0;
  const bold = node.style?.bold ?? appearance.bold ?? false;
  const italic = node.style?.italic ?? appearance.italic ?? false;
  const underline = node.style?.underline ?? appearance.underline ?? false;
  if (bold) nodeEl.addClass("is-bold");
  if (italic) nodeEl.addClass("is-italic");
  if (underline) nodeEl.addClass("is-underlined");
  const branchColor = branchColorMap.get(node.id);
  if (node.style?.color) nodeEl.style.backgroundColor = node.style.color;
  else if (isRoot && appearance.rootColor) nodeEl.style.backgroundColor = appearance.rootColor;
  else if (!isRoot && branchColor && appearance.nodeVisualStyle === "branch") {
    nodeEl.style.backgroundColor = `color-mix(in srgb, ${branchColor} 16%, ${appearance.nodeColor ?? "#ffffff"})`;
  } else if (!isRoot && appearance.nodeColor) nodeEl.style.backgroundColor = appearance.nodeColor;
  if (node.style?.textColor) nodeEl.style.color = node.style.textColor;
  else if (isRoot && appearance.rootTextColor) nodeEl.style.color = appearance.rootTextColor;
  else if (!isRoot && appearance.textColor) nodeEl.style.color = appearance.textColor;
  if (node.style?.borderColor) nodeEl.style.borderColor = node.style.borderColor;
  else if (!isRoot && branchColor && appearance.nodeVisualStyle === "branch") {
    nodeEl.style.borderColor = `color-mix(in srgb, ${branchColor} 38%, transparent)`;
  } else if (!isRoot && branchColor) nodeEl.style.borderColor = branchColor;
  else if (!isRoot && appearance.nodeBorderColor) nodeEl.style.borderColor = appearance.nodeBorderColor;
  nodeEl.style.borderWidth = `${node.style?.borderWidth ?? appearance.nodeBorderWidth ?? (isRoot ? 2 : 1)}px`;

  const content = nodeEl.createDiv({ cls: "mmc-node-content" });
  const blocks = nodeContentBlocks(node);
  const hasTextBlock = blocks.some((block) => block.type === "text" && block.text.trim());
  if (node.icon && !hasTextBlock) {
    const meta = content.createDiv({ cls: "mmc-node-main mmc-node-meta-only" });
    meta.createSpan({ cls: "mmc-node-icon", text: node.icon });
  }
  let prefixRendered = false;
  for (const block of blocks) {
    if (block.type === "image") {
      const wrap = content.createDiv({ cls: `mmc-node-image-block image-layout-${block.layout ?? "block"}` });
      wrap.addClass(`image-align-${block.align ?? "center"}`);
      wrap.dataset.blockId = block.id;
      const image = wrap.createEl("img", { cls: "mmc-node-image is-loading", attr: { alt: block.alt ?? (nodePlainText(node) || "图片") } });
      if (block.width) image.style.width = `${block.width}px`;
      if (block.height) image.style.height = `${block.height}px`;
      const candidates = ctx.options.imageFailoverEnabled
        ? imageSourceCandidates(block, ctx.options.imageFailoverUseLocalFallback, ctx.options.imageHostPriorityIds)
        : imageSourceCandidates(block, false, ctx.options.imageHostPriorityIds).slice(0, 1);
      let activeResolved: string | null = null;
      let attemptToken = 0;
      let attemptTimer: number | null = null;
      const clearAttemptTimer = (): void => {
        if (attemptTimer === null) return;
        window.clearTimeout(attemptTimer);
        ctx.imageLoadTimers.delete(attemptTimer);
        attemptTimer = null;
      };
      const markRemoteFailure = (source: string): void => {
        const remote = block.remoteSources?.find((item) => item.url === source);
        if (!remote) return;
        remote.lastFailureAt = new Date().toISOString();
        remote.failureCount = Math.min(1000000, (remote.failureCount ?? 0) + 1);
      };
      const tryCandidate = (index: number): void => {
        clearAttemptTimer();
        const candidate = candidates[index];
        attemptToken += 1;
        const token = attemptToken;
        if (!candidate) {
          activeResolved = null;
          image.removeAttribute("src");
          image.removeClass("is-loading");
          image.addClass("is-unresolved");
          image.addClass("is-hidden");
          renderImageFailureDetails(wrap, block, ctx.options.imageHostPriorityIds);
          return;
        }
        const resolved = ctx.callbacks.resolveImage(candidate.source);
        if (!resolved) {
          markRemoteFailure(candidate.source);
          tryCandidate(index + 1);
          return;
        }
        const probe = new Image();
        const fail = (): void => {
          if (token !== attemptToken) return;
          clearAttemptTimer();
          markRemoteFailure(candidate.source);
          if (ctx.options.imageFailoverEnabled) tryCandidate(index + 1);
          else {
            image.removeClass("is-loading");
            image.addClass("is-unresolved");
            image.addClass("is-hidden");
            renderImageFailureDetails(wrap, block, ctx.options.imageHostPriorityIds);
          }
        };
        probe.onload = () => {
          if (token !== attemptToken || probe.naturalWidth <= 0) return;
          clearAttemptTimer();
          activeResolved = resolved;
          image.src = resolved;
          image.removeClass("is-loading");
          image.removeClass("is-unresolved");
          image.removeClass("is-hidden");
          clearImageFailureDetails(wrap);
          image.setAttr("title", index === 0 ? "点击放大图片" : `已自动切换到：${candidate.label}`);
          const switched = candidate.source !== block.source;
          const remote = block.remoteSources?.find((item) => item.url === candidate.source);
          if (remote) remote.lastSuccessAt = new Date().toISOString();
          if (!switched) return;
          const previous = block.remoteSources?.find((item) => item.url === block.source);
          block.source = candidate.source;
          replaceNodeContentBlocks(node, blocks);
          ctx.notifyDocumentChange("none");
          ctx.markSaving();
          const previousLabel = previous?.hostName || "当前图床";
          new Notice(`图片地址失效，已从 ${previousLabel} 自动切换到 ${candidate.label}`, 6000);
        };
        probe.onerror = fail;
        const timeoutMs = Math.max(2, Math.min(30, ctx.options.imageFailoverTimeoutSeconds)) * 1000;
        attemptTimer = window.setTimeout(fail, timeoutMs);
        ctx.imageLoadTimers.add(attemptTimer);
        probe.src = resolved;
      };
      image.addEventListener("click", (event) => {
        event.stopPropagation();
        if (activeResolved) ctx.openImagePreviewWithSources(node.id, block.id);
      });
      image.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        ctx.selectNode(node.id);
        ctx.openImageContextMenu(event, node.id, block.id);
      });
      tryCandidate(0);
      ctx.bindContentBlockDragHandle(wrap, node.id, block.id);
      continue;
    }
    if (block.type === "table") {
      const shell = content.createDiv({ cls: "mmc-node-structured-block-shell" });
      ctx.renderNodeTable(shell, node, block.table, block.id);
      ctx.bindContentBlockDragHandle(shell, node.id, block.id);
      continue;
    }
    if (block.type === "code") {
      const shell = content.createDiv({ cls: "mmc-node-structured-block-shell" });
      ctx.renderNodeCode(shell, node, block.code, block.id);
      ctx.bindContentBlockDragHandle(shell, node.id, block.id);
      continue;
    }
    if (!block.text.trim()) continue;
    const main = content.createDiv({ cls: "mmc-node-main mmc-node-text-block" });
    main.dataset.blockId = block.id;
    if (!prefixRendered && node.icon) main.createSpan({ cls: "mmc-node-icon", text: node.icon });
    const isSubmapTitle = Boolean(node.submap) && !prefixRendered;
    prefixRendered = true;
    const textEl = main.createDiv({ cls: `mmc-node-text${isSubmapTitle ? " is-submap-link" : ""}` });
    textEl.dataset.blockId = block.id;
    renderRichTextRuns(textEl, block.richText, block.text);
    textEl.style.fontSize = `${node.style?.fontSize ?? appearance.fontSize ?? 14}px`;
    if (isSubmapTitle) {
      const indicator = textEl.createSpan({ cls: "mmc-submap-inline-indicator", attr: { "aria-hidden": "true" } });
      setIcon(indicator, "arrow-up-right");
    }
    ctx.bindContentBlockDragHandle(main, node.id, block.id);
  }

  if (node.submap && !hasTextBlock) {
    const submapIcon = nodeEl.createEl("button", {
      cls: "mmc-submap-corner-link",
      attr: {
        "aria-label": `打开子导图：${node.submap.title ?? node.submap.path}`,
        title: `打开子导图：${node.submap.title ?? node.submap.path}`
      }
    });
    setIcon(submapIcon, "arrow-up-right");
    submapIcon.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void ctx.navigateWithTransition(() => ctx.callbacks.onOpenMindMap(node.submap!.path));
    });
  }

  if (node.submap) {
    nodeEl.setAttr("role", "link");
    nodeEl.setAttr("tabindex", "0");
    nodeEl.setAttr("aria-label", `打开子导图：${node.submap.title ?? node.submap.path}`);
  }

  if (node.table && !blocks.some((block) => block.type === "table")) ctx.renderNodeTable(content, node, node.table);
  if (node.code && !blocks.some((block) => block.type === "code")) ctx.renderNodeCode(content, node, node.code);
  ctx.bindContentBlockAppendDropTarget(nodeEl, node.id);
  if (node.question) ctx.renderQuestionSummary(content, node);

  if (node.tags?.length) {
    const tags = content.createDiv({ cls: "mmc-node-tags" });
    node.tags.slice(0, 4).forEach((tag) => tags.createSpan({ cls: "mmc-node-tag", text: `#${tag}` }));
  }

  if (node.children.length) {
    const fold = nodeEl.createEl("button", { cls: "mmc-fold-button", attr: { "aria-label": node.collapsed ? "展开" : "收起" } });
    fold.setText(node.collapsed ? `+${node.children.length}` : "−");
    fold.addEventListener("click", (event) => {
      event.stopPropagation();
      ctx.selectNode(node.id);
      ctx.toggleCollapse();
    });
  }

  const link = ctx.getNodeLink(node);
  if (link) {
    const linkButton = nodeEl.createEl("button", { cls: "mmc-node-link", attr: { "aria-label": `打开 ${link}` } });
    setIcon(linkButton, "external-link");
    linkButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void ctx.callbacks.onOpenLink(link);
    });
  }

  {
    const resizeHandle = nodeEl.createDiv({
      cls: "mmc-node-resize-handle",
      attr: { role: "separator", tabindex: "0", "aria-label": "拖动调整节点宽度和最小高度", title: "拖动调整节点大小；双击恢复自动大小" }
    });
    resizeHandle.setAttr("draggable", "false");
    resizeHandle.addEventListener("click", (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
    });
    resizeHandle.addEventListener("dblclick", (event) => {
      if (ctx.readOnly) return;
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      ctx.mutateWithoutArticleContext(() => {
        const next = { ...(node.style ?? {}), width: undefined, minHeight: undefined };
        node.style = Object.values(next).some((value) => value !== undefined) ? next : undefined;
      });
    });
    resizeHandle.addEventListener("pointerdown", (event) => {
      if (ctx.readOnly) return;
      if (event.button !== 0) return;
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = position.width;
      const startHeight = position.height;
      let previewWidth = startWidth;
      let previewHeight = startHeight;
      resizeHandle.setPointerCapture(event.pointerId);
      nodeEl.addClass("is-resizing");
      const move = (moveEvent: PointerEvent): void => {
        const scale = Math.max(.1, ctx.zoom);
        previewWidth = Math.min(900, Math.max(100, startWidth + (moveEvent.clientX - startX) / scale));
        previewHeight = Math.min(600, Math.max(36, startHeight + (moveEvent.clientY - startY) / scale));
        nodeEl.style.width = `${Math.round(previewWidth)}px`;
        nodeEl.style.minHeight = `${Math.round(previewHeight)}px`;
      };
      const finish = (upEvent: PointerEvent): void => {
        resizeHandle.removeEventListener("pointermove", move);
        resizeHandle.removeEventListener("pointerup", finish);
        resizeHandle.removeEventListener("pointercancel", finish);
        if (resizeHandle.hasPointerCapture(upEvent.pointerId)) resizeHandle.releasePointerCapture(upEvent.pointerId);
        nodeEl.removeClass("is-resizing");
        ctx.mutateWithoutArticleContext(() => {
          node.style = {
            ...(node.style ?? {}),
            width: Math.round(previewWidth),
            minHeight: Math.round(previewHeight)
          };
        });
      };
      resizeHandle.addEventListener("pointermove", move);
      resizeHandle.addEventListener("pointerup", finish);
      resizeHandle.addEventListener("pointercancel", finish);
    });
  }

  nodeEl.addEventListener("click", (event) => {
    event.stopPropagation();
    if (event.shiftKey) {
      ctx.toggleNodeSelection(node.id);
      return;
    }
    ctx.selectNode(node.id);
    const submapPath = node.submap?.path;
    if (submapPath) void ctx.navigateWithTransition(() => ctx.callbacks.onOpenMindMap(submapPath));
  });
  if (node.submap) {
    nodeEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      ctx.selectNode(node.id);
      void ctx.navigateWithTransition(() => ctx.callbacks.onOpenMindMap(node.submap!.path));
    });
  }
  nodeEl.addEventListener("dblclick", (event) => {
    event.stopPropagation();
    ctx.selectNode(node.id);
    if (node.question && ctx.options.questionNodesEnabled) {
      ctx.editQuestion(node);
      return;
    }
    const submapPath = node.submap?.path;
    if (submapPath) {
      void ctx.navigateWithTransition(() => ctx.callbacks.onOpenMindMap(submapPath));
    } else if (!ctx.readOnly) {
      if (ctx.isNearNodeEdge(event, nodeEl)) ctx.editSelected();
      else {
        const target = event.target as HTMLElement;
        const blockId = target.closest<HTMLElement>("[data-block-id]")?.dataset.blockId;
        const block = blocks.find((item) => item.id === blockId);
        if (block?.type === "text") ctx.beginInlineEdit(node.id, block.id);
        else ctx.editSelected(blockId);
      }
    }
  });
  nodeEl.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    ctx.aiScopeNodeId = node.id;
    ctx.updateAiScopeButton();
    ctx.selectNode(node.id);
    const target = event.target as HTMLElement;
    const blockId = target.closest<HTMLElement>("[data-block-id]")?.dataset.blockId;
    ctx.openContextMenu(event, blockId);
  });
  nodeEl.addEventListener("dragstart", (event) => {
    if (ctx.readOnly) { event.preventDefault(); return; }
    ctx.draggingId = node.id;
    event.dataTransfer?.setData("text/plain", node.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    const draggingIds = ctx.selectedIds.has(node.id) ? ctx.selectedIds : new Set([node.id]);
    for (const draggingId of draggingIds) {
      ctx.mindMapNodeElements.get(draggingId)?.addClass("is-dragging");
    }
  });
  nodeEl.addEventListener("dragover", (event) => {
    if (!ctx.canMoveNode(ctx.draggingId, node.id)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const position = ctx.dropPositionForEvent(event, nodeEl, node.id);
    ctx.dragDropPosition = position;
    ctx.clearDropIndicators();
    const indicator = position === "child" && isRightChildZone(event, nodeEl.getBoundingClientRect())
      ? "is-drop-child-right"
      : `is-drop-${position}`;
    nodeEl.addClasses(["is-drop-target", indicator]);
    ctx.showDropPreview(node.id, position);
  });
  nodeEl.addEventListener("dragleave", (event) => {
    if (event.relatedTarget instanceof Node && nodeEl.contains(event.relatedTarget)) return;
    nodeEl.removeClasses(["is-drop-target", "is-drop-before", "is-drop-child", "is-drop-child-right", "is-drop-after"]);
    ctx.clearDropPreview();
  });
  nodeEl.addEventListener("drop", (event) => {
    event.preventDefault();
    const position = ctx.dragDropPosition ?? ctx.dropPositionForEvent(event, nodeEl, node.id);
    ctx.clearDropIndicators();
    ctx.clearDropPreview();
    const draggedId = ctx.draggingId ?? event.dataTransfer?.getData("text/plain") ?? null;
    if (draggedId) ctx.moveNode(draggedId, node.id, position);
  });
  nodeEl.addEventListener("dragend", () => {
    ctx.draggingId = null;
    ctx.dragDropPosition = null;
    ctx.clearDropIndicators();
    ctx.clearDropPreview();
    for (const draggingNode of ctx.mindMapNodeElements.values()) draggingNode.removeClass("is-dragging");
  });
  ctx.resizeObserver?.observe(nodeEl);

}
