/**
 * @file selection-format-toolbar.ts
 * @description 文章、大纲和画布内联编辑可复用的文字选区悬浮格式栏。
 */

import {
  applyRichTextStyleRange,
  richTextCharacterStyles,
  type MindMapTextStyle
} from "../core/model";
import { readRichTextEditor, renderRichTextRuns } from "./rich-text-dom";

/** 悬浮格式栏支持的快捷键配置。 */
export interface SelectionFormatShortcuts {
  bold: string;
  italic: string;
  underline: string;
  color: string;
}

/** 挂载悬浮格式栏所需的行为。 */
export interface SelectionFormatToolbarOptions {
  editor: HTMLElement;
  shortcuts: SelectionFormatShortcuts;
  shortcutMatches: (event: KeyboardEvent, shortcut: string) => boolean;
}

/** 挂载结果，用于判断焦点和清理全局监听。 */
export interface SelectionFormatToolbarHandle {
  toolbar: HTMLElement;
  contains: (target: EventTarget | null) => boolean;
  cleanup: () => void;
}

/** 为 contenteditable 元素安装随文字选区显示的格式栏。 */
export function attachSelectionFormatToolbar(options: SelectionFormatToolbarOptions): SelectionFormatToolbarHandle {
  const { editor } = options;
  const toolbar = document.body.createDiv({ cls: "mms-selection-format-toolbar is-hidden" });
  let savedSelection: { start: number; end: number } | null = null;

  const rememberSelection = (): { start: number; end: number } | null => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;
    const before = range.cloneRange();
    before.selectNodeContents(editor);
    before.setEnd(range.startContainer, range.startOffset);
    savedSelection = {
      start: before.toString().length,
      end: before.toString().length + range.toString().length
    };
    return savedSelection;
  };

  const restoreSelection = (selected: { start: number; end: number }): void => {
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    let offset = 0;
    let startNode: Node | null = null;
    let endNode: Node | null = null;
    let startOffset = 0;
    let endOffset = 0;
    while (node) {
      const length = node.textContent?.length ?? 0;
      if (!startNode && selected.start <= offset + length) {
        startNode = node;
        startOffset = Math.max(0, selected.start - offset);
      }
      if (!endNode && selected.end <= offset + length) {
        endNode = node;
        endOffset = Math.max(0, selected.end - offset);
        break;
      }
      offset += length;
      node = walker.nextNode();
    }
    if (!startNode || !endNode) return;
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const positionToolbar = (): void => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) {
      toolbar.addClass("is-hidden");
      return;
    }
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      toolbar.addClass("is-hidden");
      return;
    }
    const rect = range.getBoundingClientRect();
    toolbar.removeClass("is-hidden");
    const width = toolbar.offsetWidth;
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2));
    const top = Math.max(8, rect.top - toolbar.offsetHeight - 8);
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  };

  const applyStyle = (patch: Partial<MindMapTextStyle>): void => {
    const selected = rememberSelection() ?? savedSelection;
    if (!selected || selected.start === selected.end) return;
    const value = readRichTextEditor(editor);
    const key = Object.keys(patch)[0] as keyof MindMapTextStyle;
    if (key !== "color") {
      const styles = richTextCharacterStyles(value.richText, value.text);
      const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
      patch = { [key]: !enabled };
    }
    const richText = applyRichTextStyleRange(value.text, value.richText, selected.start, selected.end, patch);
    renderRichTextRuns(editor, richText, value.text, false);
    editor.focus();
    restoreSelection(selected);
    positionToolbar();
  };

  const button = (label: string, title: string, key: "bold" | "italic" | "underline"): void => {
    const element = toolbar.createEl("button", { text: label, attr: { type: "button", title, "aria-label": title } });
    element.addClass(`is-${key}`);
    element.addEventListener("pointerdown", (event) => event.preventDefault());
    element.addEventListener("click", () => applyStyle({ [key]: true }));
  };
  button("B", `加粗（${options.shortcuts.bold}）`, "bold");
  button("I", `斜体（${options.shortcuts.italic}）`, "italic");
  button("U", `下划线（${options.shortcuts.underline}）`, "underline");
  const colorLabel = toolbar.createEl("label", { cls: "mms-selection-format-color", attr: { title: "文字颜色" } });
  colorLabel.createSpan({ text: "A" });
  const color = colorLabel.createEl("input", { type: "color", attr: { "aria-label": "文字颜色" } });
  color.value = "#ef4444";
  color.addEventListener("pointerdown", () => { rememberSelection(); });
  color.addEventListener("input", () => applyStyle({ color: color.value }));

  const update = (): void => {
    const selected = rememberSelection();
    toolbar.toggleClass("is-hidden", !selected || selected.start === selected.end);
    if (selected && selected.start !== selected.end) positionToolbar();
  };
  const keydown = (event: KeyboardEvent): void => {
    const key = options.shortcutMatches(event, options.shortcuts.bold) ? "bold"
      : options.shortcutMatches(event, options.shortcuts.italic) ? "italic"
        : options.shortcutMatches(event, options.shortcuts.underline) ? "underline" : null;
    if (key) {
      event.preventDefault();
      applyStyle({ [key]: true });
    } else if (options.shortcutMatches(event, options.shortcuts.color)) {
      event.preventDefault();
      rememberSelection();
      color.click();
    }
  };
  editor.addEventListener("mouseup", update);
  editor.addEventListener("keyup", update);
  editor.addEventListener("keydown", keydown);
  document.addEventListener("selectionchange", update);

  return {
    toolbar,
    contains: (target) => target instanceof Node && toolbar.contains(target),
    cleanup: () => {
      editor.removeEventListener("mouseup", update);
      editor.removeEventListener("keyup", update);
      editor.removeEventListener("keydown", keydown);
      document.removeEventListener("selectionchange", update);
      toolbar.remove();
    }
  };
}
