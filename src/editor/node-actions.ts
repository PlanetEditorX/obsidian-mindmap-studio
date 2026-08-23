/**
 * @file node-actions.ts
 * @description 不依赖 DOM 的节点新增、批量删除和折叠操作。
 */

import {
  buildNodeTreeIndex,
  findParent,
  flattenNodes,
  indexedHasAnyAncestor,
  removeNode,
  type MindMapNode,
  type NodeTreeIndex
} from "../core/model";

/** 在父节点末尾插入子节点并自动展开父节点。 */
export function appendChild(parent: MindMapNode, child: MindMapNode): void {
  parent.collapsed = false;
  parent.children.push(child);
}

/** 在目标节点之后插入同级节点。 */
export function insertSiblingAfter(
  root: MindMapNode,
  targetId: string,
  sibling: MindMapNode,
  existingIndex?: NodeTreeIndex
): boolean {
  const parent = existingIndex?.parentById.get(targetId) ?? findParent(root, targetId);
  if (!parent) return false;
  const index = parent.children.findIndex((child) => child.id === targetId);
  if (index < 0) return false;
  parent.children.splice(index + 1, 0, sibling);
  return true;
}

/**
 * 从多选集合中过滤掉根节点、无效节点以及已被另一所选祖先覆盖的后代。
 */
export function topLevelSelectedNodeIds(
  root: MindMapNode,
  selectedIds: Iterable<string>,
  existingIndex?: NodeTreeIndex
): string[] {
  const index = existingIndex ?? buildNodeTreeIndex(root);
  const ids = Array.from(selectedIds).filter((id) => id !== root.id);
  const selected = new Set(ids);
  return ids.filter((id) => index.byId.has(id) && !indexedHasAnyAncestor(index, id, selected));
}

/** 删除指定节点集合并返回实际删除数量。 */
export function deleteNodes(root: MindMapNode, ids: Iterable<string>): number {
  let removed = 0;
  for (const id of ids) {
    if (removeNode(root, id)) removed += 1;
  }
  return removed;
}

/**
 * Chooses the closest surviving location after deletion.
 *
 * The previous sibling keeps the user's visual reading position most naturally;
 * the next sibling is used only when there is no previous one. When a selected
 * ancestor is also being removed, the same rule is applied recursively until a
 * surviving parent or the protected root is reached.
 */
export function deletionSelectionFallback(
  root: MindMapNode,
  ids: Iterable<string>,
  existingIndex?: NodeTreeIndex
): string {
  const index = existingIndex ?? buildNodeTreeIndex(root);
  const targets = topLevelSelectedNodeIds(root, ids, index);
  const target = targets[0];
  if (!target) return root.id;
  const removed = new Set(targets);
  let current = index.byId.get(target) ?? null;
  while (current && current.id !== root.id) {
    const parent = index.parentById.get(current.id) ?? null;
    if (!parent) return root.id;
    const childIndex = parent.children.findIndex((node) => node.id === current!.id);
    const previous = parent.children.slice(0, childIndex).reverse().find((node) => !removed.has(node.id));
    const next = parent.children.slice(childIndex + 1).find((node) => !removed.has(node.id));
    if (previous) return previous.id;
    if (next) return next.id;
    if (!removed.has(parent.id)) return parent.id;
    current = parent;
  }
  return root.id;
}

/**
 * 展开或折叠节点分支，并可选地将传入节点本身也设为折叠状态。
 *
 * @param root 要处理的根节点。
 * @param collapsed 是否折叠包含子节点的分支。
 * @param includeRoot 是否将 root 也作为可折叠分支处理；导入文档时保持 false，粘贴分支时使用 true。
 */
export function setAllBranchesCollapsed(root: MindMapNode, collapsed: boolean, includeRoot = false): void {
  for (const node of flattenNodes(root)) {
    node.collapsed = (includeRoot || node !== root) && collapsed && node.children.length > 0;
  }
}
