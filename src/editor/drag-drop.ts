/**
 * @file drag-drop.ts
 * @description 节点拖放合法性与指针落点的纯计算规则。
 */

import { containsNode, findNode, type MindMapNode, type NodeDropPosition } from "../core/model";

/** 拖放指针与目标节点矩形所需的最小坐标信息。 */
export interface DropPointer {
  clientX: number;
  clientY: number;
}

/** 目标节点矩形所需的最小尺寸信息。 */
export interface DropTargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 判断一个或一组已选节点能否移动到目标节点。
 */
export function canMoveNodes(root: MindMapNode, selectedIds: ReadonlySet<string>, draggedId: string | null, targetId: string): boolean {
  if (!draggedId || draggedId === root.id || draggedId === targetId) return false;
  const candidateIds = selectedIds.has(draggedId) && selectedIds.size > 1
    ? Array.from(selectedIds)
    : [draggedId];
  if (candidateIds.includes(targetId) || candidateIds.includes(root.id)) return false;
  return candidateIds.every((id) => {
    const dragged = findNode(root, id);
    return Boolean(dragged && !containsNode(dragged, targetId));
  });
}

/**
 * 根据指针在节点中的位置返回同级前置、成为子级或同级后置。
 */
export function resolveDropPosition(pointer: DropPointer, rect: DropTargetRect, targetIsRoot: boolean): NodeDropPosition {
  if (targetIsRoot) return "child";
  if (isRightChildZone(pointer, rect)) return "child";
  const verticalRatio = rect.height > 0 ? (pointer.clientY - rect.top) / rect.height : .5;
  if (verticalRatio < .28) return "before";
  if (verticalRatio > .72) return "after";
  return "child";
}

/** 判断指针是否位于节点右侧的显式子级投放区域。 */
export function isRightChildZone(pointer: DropPointer, rect: DropTargetRect): boolean {
  const horizontalRatio = rect.width > 0 ? (pointer.clientX - rect.left) / rect.width : .5;
  return horizontalRatio > .72;
}
