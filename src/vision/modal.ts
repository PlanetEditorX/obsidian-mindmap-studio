/**
 * @file modal.ts
 * @description 图片与识别文字并排对比、取消返回和确认替换弹窗。
 */

import { Modal, Notice } from "obsidian";
import type { ImageTextReplacementPreview } from "./recognition";

/** 图片识别预览弹窗所需的显示数据和确认回调。 */
export interface ImageRecognitionPreviewModalOptions {
  preview: ImageTextReplacementPreview;
  resolvedImageSource: string;
  modeLabel: string;
  autoConfirmDelaySeconds: 0 | 5 | 10 | 15 | null;
  onConfirm: (preview: ImageTextReplacementPreview) => boolean | Promise<boolean>;
}

/** 显示原图片与识别文字，只有用户确认后才执行替换。 */
export class ImageRecognitionPreviewModal extends Modal {
  private autoConfirmTimer: number | null = null;

  /** 保存预览参数并初始化 Obsidian Modal。 */
  constructor(app: Modal["app"], private readonly options: ImageRecognitionPreviewModalOptions) {
    super(app);
  }

  /** 构建图片、可编辑文字和取消/确认按钮。 */
  onOpen(): void {
    this.titleEl.setText("图片识图预览");
    this.modalEl.addClass("mms-image-recognition-modal");
    const compare = this.contentEl.createDiv({ cls: "mms-image-recognition-compare" });
    const original = compare.createDiv({ cls: "mms-image-recognition-pane" });
    original.createEl("h3", { text: "原图片" });
    original.createEl("img", {
      attr: {
        src: this.options.resolvedImageSource,
        alt: this.options.preview.imageAlt || "待识别图片"
      }
    });
    const recognized = compare.createDiv({ cls: "mms-image-recognition-pane" });
    recognized.createEl("h3", { text: `识别文字 · ${this.options.modeLabel}` });
    const text = recognized.createEl("textarea", { attr: { rows: "18" } });
    text.value = this.options.preview.text;
    recognized.createEl("p", {
      cls: "setting-item-description",
      text: "可在确认前修正文字。确定后会在原位置用文字块替换图片，并可通过撤销恢复。"
    });
    const actions = this.contentEl.createDiv({ cls: "mms-image-recognition-actions" });
    const cancel = actions.createEl("button", { attr: { type: "button" }, text: "取消返回" });
    const confirm = actions.createEl("button", { cls: "mod-cta", attr: { type: "button" }, text: "确定替换" });
    cancel.addEventListener("click", () => this.close());
    const confirmReplacement = (): void => {
      if (this.autoConfirmTimer !== null) {
        window.clearTimeout(this.autoConfirmTimer);
        this.autoConfirmTimer = null;
      }
      const nextText = text.value.trim();
      if (!nextText) {
        new Notice("识别文字不能为空");
        text.focus();
        return;
      }
      confirm.disabled = true;
      const preview = { ...this.options.preview, text: nextText };
      void Promise.resolve(this.options.onConfirm(preview))
        .then((applied) => {
          if (applied) this.close();
          else confirm.disabled = false;
        })
        .catch((error) => {
          confirm.disabled = false;
          new Notice(error instanceof Error ? error.message : "图片替换失败");
        });
    };
    confirm.addEventListener("click", confirmReplacement);
    const delay = this.options.autoConfirmDelaySeconds;
    if (delay !== null) {
      confirm.setText(delay ? `${delay} 秒后自动确认` : "正在自动确认");
      this.autoConfirmTimer = window.setTimeout(confirmReplacement, delay * 1000);
    }
    window.setTimeout(() => text.focus(), 20);
  }

  /** 关闭时清空临时 DOM。 */
  onClose(): void {
    if (this.autoConfirmTimer !== null) window.clearTimeout(this.autoConfirmTimer);
    this.autoConfirmTimer = null;
    this.contentEl.empty();
  }
}
