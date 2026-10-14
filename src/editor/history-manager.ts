/**
 * @file history-manager.ts
 * @description 编辑器文档快照的撤销与重做管理器。
 */

import type { MindMapDocument } from "../core/model";

/**
 * 撤销栈允许占用的近似总字节上限（按字符串字符数计）。
 *
 * 仅靠数量上限（默认 120 份）在超大文档下会退化成数百 MB 的内存占用，例如一份 12 MB 的
 * 文档保留 120 份快照就超过 1.4 GB；总量预算保证历史内存有一个与文档大小无关的上限。
 * 常规中小文档（约 1 MB）保留满 120 份也只占约 120 MB，不会触及该预算。
 */
const HISTORY_BYTE_BUDGET = 128 * 1024 * 1024;

/**
 * 管理有界的文档快照栈，让编辑器本身只负责事务完成后的界面与保存通知。
 *
 * 历史同时受数量上限与总字节预算约束：数量上限控制条目数，字节预算控制内存规模，
 * 二者取先到者。至少保留一份快照，保证撤销始终可用。
 */
export class DocumentHistory {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  /** 撤销栈中所有快照的字符长度之和，与 `undoStack` 严格同步维护。 */
  private undoBytes = 0;

  /**
   * @param limitProvider 动态返回当前允许保留的历史记录数量。
   * @param byteLimitProvider 动态返回撤销栈允许占用的近似总字节上限。
   */
  constructor(
    private readonly limitProvider: () => number,
    private readonly byteLimitProvider: () => number = () => HISTORY_BYTE_BUDGET
  ) {}

  /** 清空撤销和重做记录。 */
  reset(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.undoBytes = 0;
  }

  /** 当前是否存在可撤销的文档快照。 */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** 当前是否存在可重做的文档快照。 */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 在修改前记录当前文档，并使已有重做分支失效。
   *
   * @param document 即将被修改的文档。
   */
  capture(document: MindMapDocument): void {
    this.captureSnapshot(this.createSnapshot(document));
  }

  /**
   * 直接记录已经序列化好的修改前文档，避免调用方为了撤销再次遍历整棵文档树。
   *
   * @param snapshot 与当前文档完全对应的 JSON 快照。
   */
  captureSnapshot(snapshot: string): void {
    this.undoStack.push(snapshot);
    this.undoBytes += snapshot.length;
    this.trim();
    this.redoStack = [];
  }

  /**
   * 返回上一份文档，同时把当前文档放入重做栈。
   *
   * @param current 当前文档。
   */
  undo(current: MindMapDocument): MindMapDocument | null {
    const previous = this.undoSnapshot(this.createSnapshot(current));
    return previous ? this.restoreSnapshot(previous) : null;
  }

  /**
   * 使用已经序列化好的当前状态执行撤销，并返回上一份 JSON 快照。
   *
   * @param currentSnapshot 当前文档的完整 JSON 快照。
   * @returns 上一份快照；没有可撤销记录时返回 null。
   */
  undoSnapshot(currentSnapshot: string): string | null {
    const previous = this.undoStack.pop();
    if (!previous) return null;
    this.undoBytes -= previous.length;
    this.redoStack.push(currentSnapshot);
    return previous;
  }

  /**
   * 返回下一份文档，同时把当前文档放回撤销栈。
   *
   * @param current 当前文档。
   */
  redo(current: MindMapDocument): MindMapDocument | null {
    const next = this.redoSnapshot(this.createSnapshot(current));
    return next ? this.restoreSnapshot(next) : null;
  }

  /**
   * 使用已经序列化好的当前状态执行重做，并返回下一份 JSON 快照。
   *
   * @param currentSnapshot 当前文档的完整 JSON 快照。
   * @returns 下一份快照；没有可重做记录时返回 null。
   */
  redoSnapshot(currentSnapshot: string): string | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(currentSnapshot);
    this.undoBytes += currentSnapshot.length;
    this.trim();
    return next;
  }

  /**
   * 按设置的数量上限与固定字节预算裁剪最旧的历史快照，二者取先到者。
   *
   * 数量上限控制条目数；字节预算保证超大文档不会因“120 份完整快照”而占用数百 MB。
   * 无论预算多小都至少保留一份快照，避免撤销功能被裁剪到不可用。
   */
  private trim(): void {
    const limit = Math.max(10, Math.min(500, this.limitProvider()));
    while (this.undoStack.length > limit) this.undoBytes -= this.undoStack.shift()!.length;
    const byteLimit = Math.max(1, this.byteLimitProvider());
    while (this.undoStack.length > 1 && this.undoBytes > byteLimit) {
      this.undoBytes -= this.undoStack.shift()!.length;
    }
  }

  /**
   * 将文档转换为与运行时对象隔离的 JSON 快照。
   *
   * @param document 要序列化的当前文档。
   * @returns 可直接放入历史栈或跨边界传递的完整 JSON。
   */
  createSnapshot(document: MindMapDocument): string {
    return JSON.stringify(document);
  }

  /**
   * 从 JSON 快照恢复新的文档对象。
   *
   * @param snapshot 完整文档 JSON。
   * @returns 与历史栈字符串隔离的新文档对象。
   */
  restoreSnapshot(snapshot: string): MindMapDocument {
    return JSON.parse(snapshot) as MindMapDocument;
  }
}
