/**
 * @file node-rich-text-editor.ts
 * @description 节点内容弹窗中的富文本块编辑、选区样式和实时预览。
 */

import { Notice } from "obsidian";
import {
  applyRichTextStyleRange,
  reconcileRichTextAfterEdit,
  richTextCharacterStyles,
  type MindMapTextContentBlock
} from "./model";
import { renderRichTextRuns } from "./rich-text-dom";

/**
 * 在指定容器中创建一个节点文字块编辑器。
 *
 * @param container 编辑器容器。
 * @param block 被直接编辑的文字内容块。
 * @param onChange 内容或格式变化后的回调。
 */
export function renderNodeRichTextEditor(
  container: HTMLElement,
  block: MindMapTextContentBlock,
  onChange: () => void
): void {
  const toolbar = container.createDiv({ cls: "mmc-rich-text-toolbar" });
  const source = container.createEl("textarea", {
    cls: "mmc-rich-text-source",
    attr: { rows: "3", spellcheck: "true", placeholder: "输入文字；可以全部删除，让节点只保留图片" }
  });
  source.value = block.text;
  let savedStart = source.value.length;
  let savedEnd = source.value.length;
  const selection = container.createDiv({ cls: "mmc-rich-selection-status" });
  container.createDiv({ cls: "mmc-rich-preview-label", text: "文字样式预览" });
  const preview = container.createDiv({ cls: "mmc-rich-text-preview" });
  const updatePreview = (): void => {
    renderRichTextRuns(preview, block.richText, block.text || "预览文字");
    preview.toggleClass("is-placeholder", !block.text);
  };
  const remember = (): void => {
    savedStart = source.selectionStart ?? 0;
    savedEnd = source.selectionEnd ?? savedStart;
    const from = Math.min(savedStart, savedEnd);
    const to = Math.max(savedStart, savedEnd);
    selection.setText(from === to ? `光标位置：${from + 1}` : `已选择第 ${from + 1}–${to} 个字符`);
  };
  const range = (): { start: number; end: number } | null => {
    const start = Math.max(0, Math.min(block.text.length, Math.min(savedStart, savedEnd)));
    const end = Math.max(start, Math.min(block.text.length, Math.max(savedStart, savedEnd)));
    if (start === end) {
      new Notice("请先选择需要设置格式的文字");
      source.focus();
      return null;
    }
    source.focus();
    source.setSelectionRange(start, end);
    return { start, end };
  };
  const styleButton = (
    label: string,
    title: string,
    action: () => void,
    cls = ""
  ): HTMLButtonElement => {
    const button = toolbar.createEl("button", {
      cls: `mmc-rich-toolbar-button ${cls}`.trim(),
      text: label,
      attr: { type: "button", title }
    });
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      action();
    });
    return button;
  };
  const applyBoolean = (key: "bold" | "italic" | "underline"): void => {
    const selected = range();
    if (!selected) return;
    const styles = richTextCharacterStyles(block.richText, block.text);
    const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
    block.richText = applyRichTextStyleRange(
      block.text,
      block.richText,
      selected.start,
      selected.end,
      { [key]: !enabled }
    );
    updatePreview();
    onChange();
    source.setSelectionRange(selected.start, selected.end);
    remember();
  };
  styleButton("B", "加粗所选文字", () => applyBoolean("bold"), "is-bold");
  styleButton("I", "斜体所选文字", () => applyBoolean("italic"), "is-italic");
  styleButton("U", "给所选文字加下划线", () => applyBoolean("underline"), "is-underline");
  const colorLabel = toolbar.createEl("label", {
    cls: "mmc-rich-color-button",
    attr: { title: "修改所选文字颜色" }
  });
  colorLabel.createSpan({ text: "颜色" });
  const colorLine = colorLabel.createSpan({ cls: "mmc-rich-color-line" });
  const color = colorLabel.createEl("input", { type: "color", attr: { "aria-label": "文字颜色" } });
  color.value = "#ef4444";
  colorLine.style.backgroundColor = color.value;
  color.addEventListener("input", () => {
    colorLine.style.backgroundColor = color.value;
  });
  color.addEventListener("change", () => {
    const selected = range();
    if (!selected) return;
    block.richText = applyRichTextStyleRange(
      block.text,
      block.richText,
      selected.start,
      selected.end,
      { color: color.value }
    );
    updatePreview();
    onChange();
  });
  styleButton("清除格式", "清除所选文字格式", () => {
    const selected = range();
    if (!selected) return;
    block.richText = applyRichTextStyleRange(
      block.text,
      block.richText,
      selected.start,
      selected.end,
      null
    );
    updatePreview();
    onChange();
  }, "is-wide");
  source.addEventListener("select", remember);
  source.addEventListener("keyup", remember);
  source.addEventListener("mouseup", remember);
  source.addEventListener("input", () => {
    const next = source.value.replace(/\r?\n/g, " ");
    block.richText = reconcileRichTextAfterEdit(block.text, block.richText, next);
    block.text = next;
    source.value = next;
    remember();
    updatePreview();
    onChange();
  });
  updatePreview();
  remember();
}
