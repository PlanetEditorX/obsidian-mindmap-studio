"use strict";
/**
 * @file node-actions.ts
 * @description 不依赖 DOM 的节点新增、批量删除、折叠和任务状态操作。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendChild = appendChild;
exports.insertSiblingAfter = insertSiblingAfter;
exports.topLevelSelectedNodeIds = topLevelSelectedNodeIds;
exports.deleteNodes = deleteNodes;
exports.setAllBranchesCollapsed = setAllBranchesCollapsed;
exports.nextTaskStatus = nextTaskStatus;
const model_1 = require("../core/model");
/** 在父节点末尾插入子节点并自动展开父节点。 */
function appendChild(parent, child) {
    parent.collapsed = false;
    parent.children.push(child);
}
/** 在目标节点之后插入同级节点。 */
function insertSiblingAfter(root, targetId, sibling) {
    const parent = (0, model_1.findParent)(root, targetId);
    if (!parent)
        return false;
    const index = parent.children.findIndex((child) => child.id === targetId);
    if (index < 0)
        return false;
    parent.children.splice(index + 1, 0, sibling);
    return true;
}
/**
 * 从多选集合中过滤掉根节点、无效节点以及已被另一所选祖先覆盖的后代。
 */
function topLevelSelectedNodeIds(root, selectedIds) {
    const ids = Array.from(selectedIds).filter((id) => id !== root.id);
    return ids.filter((id) => {
        const node = (0, model_1.findNode)(root, id);
        return Boolean(node && !ids.some((otherId) => otherId !== id && node && (0, model_1.containsNode)((0, model_1.findNode)(root, otherId) ?? root, id)));
    });
}
/** 删除指定节点集合并返回实际删除数量。 */
function deleteNodes(root, ids) {
    let removed = 0;
    for (const id of ids) {
        if ((0, model_1.removeNode)(root, id))
            removed += 1;
    }
    return removed;
}
/**
 * 展开或折叠节点分支，并可选地将传入节点本身也设为折叠状态。
 *
 * @param root 要处理的根节点。
 * @param collapsed 是否折叠包含子节点的分支。
 * @param includeRoot 是否将 root 也作为可折叠分支处理；导入文档时保持 false，粘贴分支时使用 true。
 */
function setAllBranchesCollapsed(root, collapsed, includeRoot = false) {
    for (const node of (0, model_1.flattenNodes)(root)) {
        node.collapsed = (includeRoot || node !== root) && collapsed && node.children.length > 0;
    }
}
/** 按未设置、待办、进行中、完成的顺序循环任务状态。 */
function nextTaskStatus(current) {
    const states = {
        "": "todo",
        todo: "doing",
        doing: "done",
        done: undefined
    };
    return states[current ?? ""];
}
