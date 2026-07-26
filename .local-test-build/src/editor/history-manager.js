"use strict";
/**
 * @file history-manager.ts
 * @description 编辑器文档快照的撤销与重做管理器。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentHistory = void 0;
/**
 * 管理有界的文档快照栈，让编辑器本身只负责事务完成后的界面与保存通知。
 */
class DocumentHistory {
    /**
     * @param limitProvider 动态返回当前允许保留的历史记录数量。
     */
    constructor(limitProvider) {
        this.limitProvider = limitProvider;
        this.undoStack = [];
        this.redoStack = [];
    }
    /** 清空撤销和重做记录。 */
    reset() {
        this.undoStack = [];
        this.redoStack = [];
    }
    /**
     * 在修改前记录当前文档，并使已有重做分支失效。
     *
     * @param document 即将被修改的文档。
     */
    capture(document) {
        this.undoStack.push(this.serialize(document));
        this.trim();
        this.redoStack = [];
    }
    /**
     * 返回上一份文档，同时把当前文档放入重做栈。
     *
     * @param current 当前文档。
     */
    undo(current) {
        const previous = this.undoStack.pop();
        if (!previous)
            return null;
        this.redoStack.push(this.serialize(current));
        return this.deserialize(previous);
    }
    /**
     * 返回下一份文档，同时把当前文档放回撤销栈。
     *
     * @param current 当前文档。
     */
    redo(current) {
        const next = this.redoStack.pop();
        if (!next)
            return null;
        this.undoStack.push(this.serialize(current));
        this.trim();
        return this.deserialize(next);
    }
    /** 按设置限制裁剪最旧的历史快照。 */
    trim() {
        const limit = Math.max(10, Math.min(500, this.limitProvider()));
        while (this.undoStack.length > limit)
            this.undoStack.shift();
    }
    /** 将文档转换为与运行时对象隔离的快照。 */
    serialize(document) {
        return JSON.stringify(document);
    }
    /** 从内部快照恢复文档对象。 */
    deserialize(snapshot) {
        return JSON.parse(snapshot);
    }
}
exports.DocumentHistory = DocumentHistory;
