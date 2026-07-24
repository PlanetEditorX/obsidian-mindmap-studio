/**
 * @file node-actions.ts
 * @description 不依赖 DOM 的节点新增、批量删除、折叠和任务状态操作。
 */

import {
  containsNode,
  findNode,
  findParent,
  flattenNodes,
  removeNode,
  type MindMapNode,
  type TaskStatus
} from "../core/model";

/** 在父节点末尾插入子节点并自动展开父节点。 */
export function appendChild(parent: MindMapNode, child: MindMapNode): void {
  parent.collapsed = false;
  parent.children.push(child);
}

/** 在目标节点之后插入同级节点。 */
export function insertSiblingAfter(root: MindMapNode, targetId: string, sibling: MindMapNode): boolean {
  const parent = findParent(root, targetId);
  if (!parent) return false;
  const index = parent.children.findIndex((child) => child.id === targetId);
  if (index < 0) return false;
  parent.children.splice(index + 1, 0, sibling);
  return true;
}

/**
 * 从多选集合中过滤掉根节点、无效节点以及已被另一所选祖先覆盖的后代。
 */
export function topLevelSelectedNodeIds(root: MindMapNode, selectedIds: Iterable<string>): string[] {
  const ids = Array.from(selectedIds).filter((id) => id !== root.id);
  return ids.filter((id) => {
    const node = findNode(root, id);
    return Boolean(node && !ids.some((otherId) =>
      otherId !== id && node && containsNode(findNode(root, otherId) ?? root, id)
    ));
  });
}

/** 删除指定节点集合并返回实际删除数量。 */
export function deleteNodes(root: MindMapNode, ids: Iterable<string>): number {
  let removed = 0;
  for (const id of ids) {
    if (removeNode(root, id)) removed += 1;
  }
  return removed;
}

/** 展开或折叠全部分支，并始终保持根节点展开。 */
export function setAllBranchesCollapsed(root: MindMapNode, collapsed: boolean): void {
  for (const node of flattenNodes(root)) {
    node.collapsed = node === root ? false : collapsed && node.children.length > 0;
  }
}

/** 按未设置、待办、进行中、完成的顺序循环任务状态。 */
export function nextTaskStatus(current: TaskStatus | undefined): TaskStatus | undefined {
  const states: Record<string, TaskStatus | undefined> = {
    "": "todo",
    todo: "doing",
    doing: "done",
    done: undefined
  };
  return states[current ?? ""];
}
