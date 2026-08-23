/**
 * @file collision-layout.ts
 * @description 导图节点包围盒碰撞检测与子树纵向避让。
 */

/** 碰撞消解所需的最小节点布局信息。 */
export interface CollisionNode {
  node: { id: string };
  parentId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 检测相交的节点矩形，并把其中一棵子树整体向下移动。
 *
 * @param nodes 当前布局中的可见节点；坐标会被原地调整。
 * @param verticalGap 避让后两个节点包围盒之间保留的最小纵向间距。
 * @returns 实际执行的子树平移次数。
 */
export function resolveLayoutCollisions<T extends CollisionNode>(nodes: T[], verticalGap: number): number {
  if (nodes.length < 2) return 0;
  const children = new Map<string, T[]>();
  const byId = new Map(nodes.map((node) => [node.node.id, node]));
  for (const node of nodes) {
    if (!node.parentId) continue;
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }
  const siblingIndexes = new Map<string, number>();
  for (const siblings of children.values()) {
    siblings.forEach((node, index) => siblingIndexes.set(node.node.id, index));
  }

  const descendants = (root: T): T[] => {
    const result: T[] = [];
    const visit = (node: T): void => {
      result.push(node);
      for (const child of children.get(node.node.id) ?? []) visit(child);
    };
    visit(root);
    return result;
  };
  const moveSubtree = (root: T, offset: number): void => {
    for (const node of descendants(root)) node.y += offset;
  };
  const overlapsHorizontally = (a: T, b: T): boolean =>
    a.x - a.width / 2 < b.x + b.width / 2
    && a.x + a.width / 2 > b.x - b.width / 2;
  const contains = (ancestor: T, candidate: T): boolean => {
    let current: T | undefined = candidate;
    while (current?.parentId) {
      if (current.parentId === ancestor.node.id) return true;
      current = byId.get(current.parentId);
    }
    return false;
  };

  let moves = 0;
  const maxPasses = Math.max(4, nodes.length * 2);
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    const ordered = [...nodes].sort((a, b) =>
      (a.y - a.height / 2) - (b.y - b.height / 2)
      || a.x - b.x
    );
    for (let firstIndex = 0; firstIndex < ordered.length; firstIndex += 1) {
      const first = ordered[firstIndex]!;
      const firstBottom = first.y + first.height / 2;
      for (let secondIndex = firstIndex + 1; secondIndex < ordered.length; secondIndex += 1) {
        const second = ordered[secondIndex]!;
        const secondTop = second.y - second.height / 2;
        const requiredOffset = firstBottom + verticalGap - secondTop;
        // ordered is sorted by top edge; once the vertical gap is already
        // satisfied, every remaining node is even farther below this node.
        if (requiredOffset <= 0) break;
        if (!overlapsHorizontally(first, second)) continue;

        // Measured content can be much taller than its initial estimate.
        // Preserve sibling order instead of moving an earlier sibling below a
        // later one during collision resolution.
        if (first.parentId && first.parentId === second.parentId) {
          const firstIndex = siblingIndexes.get(first.node.id) ?? 0;
          const secondIndex = siblingIndexes.get(second.node.id) ?? 0;
          const earlier = firstIndex <= secondIndex ? first : second;
          const later = earlier === first ? second : first;
          const offset = earlier.y + earlier.height / 2 + verticalGap - (later.y - later.height / 2);
          if (offset > 0) {
            moveSubtree(later, offset);
            moves += 1;
            changed = true;
            break;
          }
        }

        // 根节点固定在画布中心；与根节点相交时移动相邻分支。
        const moving = second.parentId === null || contains(second, first) ? first : second;
        const stationary = moving === second ? first : second;
        const offset = moving === second
          ? stationary.y + stationary.height / 2 + verticalGap - (moving.y - moving.height / 2)
          : stationary.y - stationary.height / 2 - verticalGap - (moving.y + moving.height / 2);
        if (offset === 0) continue;
        moveSubtree(moving, offset);
        moves += 1;
        changed = true;
        break;
      }
      if (changed) break;
    }
    if (!changed) break;
  }
  return moves;
}
