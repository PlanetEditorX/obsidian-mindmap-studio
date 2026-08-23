/**
 * @file selection-class-delta.ts
 * @description 计算节点选择样式需要更新的最小 ID 集合，避免每次选择变化扫描全部 DOM。
 */

/**
 * 返回两次选择状态之间必须重新同步 CSS 类的节点 ID。
 *
 * 普通单选切换只包含离开和进入选择的节点；当选择数量跨过多选边界时，
 * 仍处于选择中的节点也必须更新 `is-multi-selected`，因此会一并返回。
 *
 * @param previous 上一次已经同步到 DOM 的选择集合。
 * @param next 当前选择集合。
 * @returns 需要刷新选择 CSS 类的节点 ID 集合。
 */
export function selectionClassDelta(previous: ReadonlySet<string>, next: ReadonlySet<string>): Set<string> {
  const changed = new Set<string>();
  for (const id of previous) {
    if (!next.has(id)) changed.add(id);
  }
  for (const id of next) {
    if (!previous.has(id)) changed.add(id);
  }
  if ((previous.size > 1) !== (next.size > 1)) {
    for (const id of previous) changed.add(id);
    for (const id of next) changed.add(id);
  }
  return changed;
}
