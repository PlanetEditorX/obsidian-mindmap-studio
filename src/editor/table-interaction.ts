/**
 * @file table-interaction.ts
 * @description 文章表格的动态锁状态、双击编辑和列宽拖拽事件绑定。
 */

/** Supports pointer capture without requiring a concrete browser element in tests. */
export interface PointerCaptureEventTarget extends EventTarget {
  setPointerCapture?: (pointerId: number) => void;
}

/** Options for a table double-click edit binding. */
export interface TableEditInteractionOptions {
  isReadOnly: () => boolean;
  isResizeTarget: (target: EventTarget | null) => boolean;
  edit: () => void;
}

/** Options for one table-column resize handle. */
export interface TableColumnResizeOptions {
  eventTarget: EventTarget;
  isReadOnly: () => boolean;
  columnIndex: number;
  initialWidths: () => number[];
  applyWidths: (widths: readonly number[]) => void;
  setResizing: (resizing: boolean) => void;
  commitWidths: (widths: number[]) => void;
}

/**
 * Resizes one table boundary while keeping the total table width unchanged.
 * The column on the right absorbs the inverse delta, so article tables stay
 * fitted to their page instead of creating a horizontal scrolling surface.
 */
export function resizeAdjacentTableColumns(
  sourceWidths: readonly number[],
  columnIndex: number,
  delta: number,
  minimumWidth = 64
): number[] {
  const widths = sourceWidths.map((width) => Math.max(1, Math.round(width)));
  const adjacentIndex = columnIndex + 1;
  if (columnIndex < 0 || adjacentIndex >= widths.length) return widths;
  const left = widths[columnIndex] ?? minimumWidth;
  const right = widths[adjacentIndex] ?? minimumWidth;
  const minimum = Math.max(24, Math.min(minimumWidth, Math.floor((left + right) / 2)));
  const boundedDelta = Math.max(minimum - left, Math.min(right - minimum, Math.round(delta)));
  widths[columnIndex] = left + boundedDelta;
  widths[adjacentIndex] = right - boundedDelta;
  return widths;
}

/**
 * Binds table editing to the live lock state instead of the state captured
 * when article DOM was first rendered.
 *
 * @param target Table receiving double-click events.
 * @param options Live state and edit callbacks.
 */
export function bindTableDoubleClick(target: EventTarget, options: TableEditInteractionOptions): void {
  target.addEventListener("dblclick", (event) => {
    if (options.isReadOnly() || options.isResizeTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    options.edit();
  }, true);
}

/**
 * Binds a pointer drag that resizes one table column and commits all widths
 * after release.
 *
 * @param handle Resize handle rendered at a header boundary.
 * @param options Live state, width and persistence callbacks.
 */
export function bindTableColumnResize(handle: PointerCaptureEventTarget, options: TableColumnResizeOptions): void {
  handle.addEventListener("pointerdown", ((rawEvent: Event) => {
    const event = rawEvent as PointerEvent;
    if (options.isReadOnly() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    handle.setPointerCapture?.(event.pointerId);
    const startX = event.clientX;
    const initialWidths = options.initialWidths();
    let widths = [...initialWidths];
    options.applyWidths(widths);
    options.setResizing(true);
    const move = (rawMoveEvent: Event): void => {
      const moveEvent = rawMoveEvent as PointerEvent;
      widths = resizeAdjacentTableColumns(initialWidths, options.columnIndex, moveEvent.clientX - startX);
      options.applyWidths(widths);
    };
    const finish = (): void => {
      options.eventTarget.removeEventListener("pointermove", move, true);
      options.eventTarget.removeEventListener("pointerup", finish, true);
      options.eventTarget.removeEventListener("pointercancel", finish, true);
      options.setResizing(false);
      options.commitWidths(widths);
    };
    options.eventTarget.addEventListener("pointermove", move, true);
    options.eventTarget.addEventListener("pointerup", finish, true);
    options.eventTarget.addEventListener("pointercancel", finish, true);
  }) as EventListener, true);
}
