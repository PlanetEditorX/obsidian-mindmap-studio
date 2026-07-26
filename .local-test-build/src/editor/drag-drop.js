"use strict";
/**
 * @file drag-drop.ts
 * @description 节点拖放合法性与指针落点的纯计算规则。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.canMoveNodes = canMoveNodes;
exports.resolveDropPosition = resolveDropPosition;
exports.isRightChildZone = isRightChildZone;
const model_1 = require("../core/model");
/**
 * 判断一个或一组已选节点能否移动到目标节点。
 */
function canMoveNodes(root, selectedIds, draggedId, targetId) {
    if (!draggedId || draggedId === root.id || draggedId === targetId)
        return false;
    const candidateIds = selectedIds.has(draggedId) && selectedIds.size > 1
        ? Array.from(selectedIds)
        : [draggedId];
    if (candidateIds.includes(targetId) || candidateIds.includes(root.id))
        return false;
    return candidateIds.every((id) => {
        const dragged = (0, model_1.findNode)(root, id);
        return Boolean(dragged && !(0, model_1.containsNode)(dragged, targetId));
    });
}
/**
 * 根据指针在节点中的位置返回同级前置、成为子级或同级后置。
 */
function resolveDropPosition(pointer, rect, targetIsRoot) {
    if (targetIsRoot)
        return "child";
    if (isRightChildZone(pointer, rect))
        return "child";
    const verticalRatio = rect.height > 0 ? (pointer.clientY - rect.top) / rect.height : .5;
    if (verticalRatio < .28)
        return "before";
    if (verticalRatio > .72)
        return "after";
    return "child";
}
/** 判断指针是否位于节点右侧的显式子级投放区域。 */
function isRightChildZone(pointer, rect) {
    const horizontalRatio = rect.width > 0 ? (pointer.clientX - rect.left) / rect.width : .5;
    return horizontalRatio > .72;
}
