/**
 * @file render-window.ts
 * @description 文章模式按内容字节预算计算首屏窗口与滚动扩展范围。
 */

/** 目标节点前后各自默认挂载的近似 UTF-8 内容预算。 */
export const ARTICLE_RENDER_WINDOW_BYTES = 5 * 1024;

/** 不创建编码缓冲区地估算字符串的 UTF-8 字节数。 */
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}

/**
 * 计算目标条目前后独立受字节预算限制的初始窗口。
 *
 * @param weights 每个文章节点的近似渲染字节数。
 * @param targetIndex 目标节点在文章顺序中的索引。
 * @param byteBudget 目标前、后分别允许的字节预算。
 * @returns 左闭右开的稳定索引范围。
 */
export function resolveByteWindow(
  weights: readonly number[],
  targetIndex: number,
  byteBudget = ARTICLE_RENDER_WINDOW_BYTES
): { start: number; end: number } {
  if (!weights.length) return { start: 0, end: 0 };
  const budget = Math.max(1, Math.floor(byteBudget));
  const target = Math.max(0, Math.min(weights.length - 1, Math.floor(targetIndex)));
  let start = target;
  let end = target + 1;
  let beforeBytes = 0;
  let afterBytes = 0;
  while (start > 0 && beforeBytes < budget) {
    start -= 1;
    beforeBytes += Math.max(0, weights[start] ?? 0);
  }
  while (end < weights.length && afterBytes < budget) {
    afterBytes += Math.max(0, weights[end] ?? 0);
    end += 1;
  }
  return { start, end };
}

/**
 * 从当前窗口边缘向一个方向扩展一个受字节预算限制的块。
 *
 * @param weights 每个文章节点的近似渲染字节数。
 * @param edge 当前左边缘或右边缘索引。
 * @param direction 扩展到前文或后文。
 * @param byteBudget 单次扩展字节预算。
 * @returns 新的左边缘或右边缘索引。
 */
export function resolveByteChunk(
  weights: readonly number[],
  edge: number,
  direction: "before" | "after",
  byteBudget = ARTICLE_RENDER_WINDOW_BYTES
): number {
  const budget = Math.max(1, Math.floor(byteBudget));
  let next = Math.max(0, Math.min(weights.length, Math.floor(edge)));
  let bytes = 0;
  if (direction === "before") {
    while (next > 0 && bytes < budget) {
      next -= 1;
      bytes += Math.max(0, weights[next] ?? 0);
    }
  } else {
    while (next < weights.length && bytes < budget) {
      bytes += Math.max(0, weights[next] ?? 0);
      next += 1;
    }
  }
  return next;
}
