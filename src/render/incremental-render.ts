/**
 * @file incremental-render.ts
 * @description 大型导图与文章的确定性渲染优先级计算，不依赖浏览器 DOM。
 */

import type { MindMapNode } from "../core/model";

/** 可参与视口优先级排序的布局项。 */
export interface SpatialRenderItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  order: number;
}

/** 当前导图视口映射到布局世界坐标后的范围。 */
export interface SpatialViewport {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * 按“当前节点 → 当前节点兄弟 → 父节点 → 父节点兄弟 → 更高祖先”生成聚焦顺序。
 *
 * @param root 当前文档根节点。
 * @param selectedId 当前选中节点标识。
 * @returns 去重后的节点标识顺序；目标不存在时仅返回根节点。
 */
export function buildHierarchyFocusOrder(root: MindMapNode, selectedId: string): string[] {
  const parentById = new Map<string, MindMapNode | null>();
  const nodeById = new Map<string, MindMapNode>();
  const visit = (node: MindMapNode, parent: MindMapNode | null): void => {
    parentById.set(node.id, parent);
    nodeById.set(node.id, node);
    node.children.forEach((child) => visit(child, node));
  };
  visit(root, null);

  const selected = nodeById.get(selectedId) ?? root;
  const ordered: string[] = [];
  const seen = new Set<string>();
  const add = (node: MindMapNode | undefined | null): void => {
    if (!node || seen.has(node.id)) return;
    seen.add(node.id);
    ordered.push(node.id);
  };

  let current: MindMapNode | null = selected;
  while (current) {
    add(current);
    const parent: MindMapNode | null = parentById.get(current.id) ?? null;
    if (parent) parent.children.forEach((sibling) => add(sibling));
    current = parent;
  }
  add(root);
  return ordered;
}

/**
 * 在保持层级聚焦节点最优先的前提下，按当前视口、相邻视口和距离排序布局项。
 *
 * @param items 全部布局项。
 * @param focusOrder 层级聚焦节点顺序。
 * @param viewport 当前世界坐标视口；缺失时只使用层级和原始顺序。
 * @returns 新数组，不修改调用方数据。
 */
export function prioritizeSpatialRenderItems<T extends SpatialRenderItem>(
  items: readonly T[],
  focusOrder: readonly string[],
  viewport?: SpatialViewport
): T[] {
  const focusRank = new Map(focusOrder.map((id, index) => [id, index]));
  const viewportWidth = viewport ? Math.max(1, viewport.right - viewport.left) : 1;
  const viewportHeight = viewport ? Math.max(1, viewport.bottom - viewport.top) : 1;
  const centerX = viewport ? (viewport.left + viewport.right) / 2 : 0;
  const centerY = viewport ? (viewport.top + viewport.bottom) / 2 : 0;
  const intersects = (item: T, expansion: number): boolean => {
    if (!viewport) return false;
    const halfWidth = item.width / 2;
    const halfHeight = item.height / 2;
    return item.x + halfWidth >= viewport.left - viewportWidth * expansion
      && item.x - halfWidth <= viewport.right + viewportWidth * expansion
      && item.y + halfHeight >= viewport.top - viewportHeight * expansion
      && item.y - halfHeight <= viewport.bottom + viewportHeight * expansion;
  };

  const ranked = items.map((item) => {
    const rank = focusRank.get(item.id);
    const band = rank !== undefined ? -1 : intersects(item, 0) ? 0 : intersects(item, 1) ? 1 : 2;
    const dx = item.x - centerX;
    const dy = item.y - centerY;
    return {
      item,
      band,
      focusRank: rank ?? Number.MAX_SAFE_INTEGER,
      distance: viewport && band >= 0 ? dx * dx + dy * dy : 0
    };
  });

  ranked.sort((left, right) => {
    if (left.band !== right.band) return left.band - right.band;
    if (left.band === -1) return left.focusRank - right.focusRank;
    if (viewport) {
      const spatial = left.distance - right.distance;
      if (spatial) return spatial;
    }
    return left.item.order - right.item.order;
  });
  return ranked.map(({ item }) => item);
}
