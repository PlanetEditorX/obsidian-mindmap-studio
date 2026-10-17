/**
 * @file node-actions.ts
 * @description 不依赖 DOM 的节点新增、批量删除和折叠操作。
 */

import {
  buildNodeTreeIndex,
  findParent,
  flattenNodes,
  indexedHasAnyAncestor,
  nodeContentBlocks,
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
 * 判断节点自身是否完全没有内容，即“空白节点”。
 *
 * 只有「没有图片、表格、代码、文件、题目、备注、标签、链接和子导图引用，且所有文字块
 * 都是空白」时才视为空。带子导图引用的节点即使文字为空也保留——删除它会破坏父子导图
 * 关系。`task` 是已废弃的兼容字段，当前界面与导出都不再使用，因此不计入内容。
 *
 * @param node 待判断的节点。
 * @returns 节点自身是否完全空白。
 */
export function isNodeEmpty(node: MindMapNode): boolean {
  if (node.submap) return false;
  if (node.question) return false;
  if (node.icon?.trim()) return false;
  if (node.note?.trim()) return false;
  if (node.link?.trim()) return false;
  if (node.tags?.some((tag) => tag.trim())) return false;
  for (const block of nodeContentBlocks(node)) {
    if (block.type !== "text") return false;
    if (block.text.trim()) return false;
  }
  return true;
}

/**
 * 清理节点树中所有空白节点，把被清理节点的子节点原地提升到其父节点下。
 *
 * 根节点永远保留：它是文档锚点。有内容的节点不受影响，因此只在空白节点所在的位置用其
 * 子树替换它。遍历使用显式栈，避免深链导图触发递归栈溢出。
 *
 * @param root 文档根节点，会被原地改写。
 * @returns 实际删除的空白节点数量。
 */
export function removeEmptyNodes(root: MindMapNode): number {
  let removed = 0;
  const stack: MindMapNode[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    removed += promoteChildrenOfEmptyNodes(node);
    for (const child of node.children) stack.push(child);
  }
  return removed;
}

/**
 * 把某个节点直接子级中的空白节点替换成它们自己的子节点。
 *
 * 被提升的子节点本身可能也是空白（连续空白链），因此这里按队列逐层展开到全部为有内容
 * 的节点为止，保证一次调用后该层级只留下非空节点。
 *
 * @param parent 需要整理直接子级的节点，会被原地改写。
 * @returns 该层级实际删除的空白节点数量。
 */
function promoteChildrenOfEmptyNodes(parent: MindMapNode): number {
  let removed = 0;
  const queue: MindMapNode[] = [...parent.children];
  const kept: MindMapNode[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    if (isNodeEmpty(node)) {
      removed += 1;
      queue.unshift(...node.children);
      continue;
    }
    kept.push(node);
  }
  parent.children = kept;
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
