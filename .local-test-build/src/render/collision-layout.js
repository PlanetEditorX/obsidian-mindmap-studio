"use strict";
/**
 * @file collision-layout.ts
 * @description 导图节点包围盒碰撞检测与子树纵向避让。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLayoutCollisions = resolveLayoutCollisions;
/**
 * 检测相交的节点矩形，并把其中一棵子树整体向下移动。
 *
 * @param nodes 当前布局中的可见节点；坐标会被原地调整。
 * @param verticalGap 避让后两个节点包围盒之间保留的最小纵向间距。
 * @returns 实际执行的子树平移次数。
 */
function resolveLayoutCollisions(nodes, verticalGap) {
    if (nodes.length < 2)
        return 0;
    const children = new Map();
    const byId = new Map(nodes.map((node) => [node.node.id, node]));
    for (const node of nodes) {
        if (!node.parentId)
            continue;
        const siblings = children.get(node.parentId) ?? [];
        siblings.push(node);
        children.set(node.parentId, siblings);
    }
    const descendants = (root) => {
        const result = [];
        const visit = (node) => {
            result.push(node);
            for (const child of children.get(node.node.id) ?? [])
                visit(child);
        };
        visit(root);
        return result;
    };
    const moveSubtree = (root, offset) => {
        for (const node of descendants(root))
            node.y += offset;
    };
    const overlapsHorizontally = (a, b) => a.x - a.width / 2 < b.x + b.width / 2
        && a.x + a.width / 2 > b.x - b.width / 2;
    const contains = (ancestor, candidate) => {
        let current = candidate;
        while (current?.parentId) {
            if (current.parentId === ancestor.node.id)
                return true;
            current = byId.get(current.parentId);
        }
        return false;
    };
    let moves = 0;
    const maxPasses = Math.max(4, nodes.length * 2);
    for (let pass = 0; pass < maxPasses; pass += 1) {
        let changed = false;
        const ordered = [...nodes].sort((a, b) => (a.y - a.height / 2) - (b.y - b.height / 2)
            || a.x - b.x);
        for (let firstIndex = 0; firstIndex < ordered.length; firstIndex += 1) {
            const first = ordered[firstIndex];
            for (let secondIndex = firstIndex + 1; secondIndex < ordered.length; secondIndex += 1) {
                const second = ordered[secondIndex];
                if (!overlapsHorizontally(first, second))
                    continue;
                const firstBottom = first.y + first.height / 2;
                const secondTop = second.y - second.height / 2;
                const requiredOffset = firstBottom + verticalGap - secondTop;
                if (requiredOffset <= 0)
                    continue;
                // 根节点固定在画布中心；与根节点相交时移动相邻分支。
                const moving = second.parentId === null || contains(second, first) ? first : second;
                const stationary = moving === second ? first : second;
                const offset = moving === second
                    ? stationary.y + stationary.height / 2 + verticalGap - (moving.y - moving.height / 2)
                    : stationary.y - stationary.height / 2 - verticalGap - (moving.y + moving.height / 2);
                if (offset === 0)
                    continue;
                moveSubtree(moving, offset);
                moves += 1;
                changed = true;
                break;
            }
            if (changed)
                break;
        }
        if (!changed)
            break;
    }
    return moves;
}
