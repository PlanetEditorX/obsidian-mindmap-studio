/**
 * @file node-tree.ts
 * @description 思维导图节点树的遍历、查找、删除与相对移动操作。
 */

import type { MindMapNode } from "./model";

/** 可用于节点拖放的目标位置。 */
export type NodeDropPosition = "before" | "child" | "after";

/** 深度优先遍历节点树，并提供每个节点的父节点。 */
export function walkNodes(root: MindMapNode, visitor: (node: MindMapNode, parent: MindMapNode | null) => void): void {
  const visit = (node: MindMapNode, parent: MindMapNode | null): void => {
    visitor(node, parent);
    node.children.forEach((child) => visit(child, node));
  };
  visit(root, null);
}

/** 按深度优先顺序展平节点树。 */
export function flattenNodes(root: MindMapNode): MindMapNode[] {
  const nodes: MindMapNode[] = [];
  walkNodes(root, (node) => nodes.push(node));
  return nodes;
}

/** 按稳定标识查找节点。 */
export function findNode(root: MindMapNode, id: string): MindMapNode | null {
  let result: MindMapNode | null = null;
  walkNodes(root, (node) => {
    if (node.id === id) result = node;
  });
  return result;
}

/** 查找指定节点的直接父节点。 */
export function findParent(root: MindMapNode, id: string): MindMapNode | null {
  let result: MindMapNode | null = null;
  walkNodes(root, (node, parent) => {
    if (node.id === id) result = parent;
  });
  return result;
}

/** 返回从根节点到目标节点父级的祖先路径。 */
export function findAncestors(root: MindMapNode, id: string): MindMapNode[] {
  const path: MindMapNode[] = [];
  const visit = (node: MindMapNode): boolean => {
    if (node.id === id) return true;
    for (const child of node.children) {
      path.push(node);
      if (visit(child)) return true;
      path.pop();
    }
    return false;
  };
  return visit(root) ? path : [];
}

/** 判断节点树是否包含指定标识。 */
export function containsNode(root: MindMapNode, id: string): boolean {
  return findNode(root, id) !== null;
}

/** 从节点树中删除指定节点；根节点本身不会被删除。 */
export function removeNode(root: MindMapNode, id: string): boolean {
  for (let index = 0; index < root.children.length; index += 1) {
    if (root.children[index]?.id === id) {
      root.children.splice(index, 1);
      return true;
    }
    const child = root.children[index];
    if (child && removeNode(child, id)) return true;
  }
  return false;
}

/**
 * 将节点移动到目标节点之前、之后或内部。
 *
 * @returns 实际发生结构变更时返回 true。
 */
export function moveNodeRelative(root: MindMapNode, draggedId: string, targetId: string, position: NodeDropPosition): boolean {
  if (draggedId === root.id || draggedId === targetId) return false;
  const dragged = findNode(root, draggedId);
  const target = findNode(root, targetId);
  if (!dragged || !target || containsNode(dragged, targetId)) return false;

  const oldParent = findParent(root, draggedId);
  if (!oldParent) return false;
  const oldIndex = oldParent.children.findIndex((child) => child.id === draggedId);
  if (oldIndex < 0) return false;

  if (position === "child") {
    if (oldParent.id === target.id && oldIndex === target.children.length - 1) return false;
    oldParent.children.splice(oldIndex, 1);
    target.children.push(dragged);
    target.collapsed = false;
    return true;
  }

  if (target.id === root.id) return false;
  const targetParent = findParent(root, targetId);
  if (!targetParent) return false;
  const targetIndexBeforeRemoval = targetParent.children.findIndex((child) => child.id === targetId);
  if (targetIndexBeforeRemoval < 0) return false;

  let insertIndex = targetIndexBeforeRemoval + (position === "after" ? 1 : 0);
  if (oldParent.id === targetParent.id) {
    const currentDesiredIndex = position === "after" ? targetIndexBeforeRemoval + 1 : targetIndexBeforeRemoval;
    if (oldIndex === currentDesiredIndex || (position === "after" && oldIndex === targetIndexBeforeRemoval + 1)) return false;
    if (oldIndex < insertIndex) insertIndex -= 1;
  }

  oldParent.children.splice(oldIndex, 1);
  targetParent.children.splice(insertIndex, 0, dragged);
  return true;
}
