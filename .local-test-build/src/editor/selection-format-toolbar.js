"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSelectionFormatToolbar = attachSelectionFormatToolbar;
const COMMON_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#1f2937"
];
let lastColor = "#ef4444";
/**
 * @file selection-format-toolbar.ts
 * @description 文章、大纲和画布内联编辑可复用的文字选区悬浮格式栏。
 */
const model_1 = require("../core/model");
const rich_text_dom_1 = require("./rich-text-dom");
/** 为 contenteditable 元素安装随文字选区显示的格式栏。 */
function attachSelectionFormatToolbar(options) {
    const { editor } = options;
    const toolbar = document.body.createDiv({ cls: "mms-selection-format-toolbar is-hidden" });
    let savedSelection = null;
    const rememberSelection = () => {
        const selection = window.getSelection();
        if (!selection?.rangeCount)
            return null;
        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer))
            return null;
        const before = range.cloneRange();
        before.selectNodeContents(editor);
        before.setEnd(range.startContainer, range.startOffset);
        savedSelection = {
            start: before.toString().length,
            end: before.toString().length + range.toString().length
        };
        return savedSelection;
    };
    const restoreSelection = (selected) => {
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        let offset = 0;
        let startNode = null;
        let endNode = null;
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
        if (!startNode || !endNode)
            return;
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    };
    const positionToolbar = () => {
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
    const applyStyle = (patch) => {
        const selected = rememberSelection() ?? savedSelection;
        if (!selected || selected.start === selected.end)
            return;
        const value = (0, rich_text_dom_1.readRichTextEditor)(editor);
        const key = Object.keys(patch)[0];
        if (key !== "color") {
            const styles = (0, model_1.richTextCharacterStyles)(value.richText, value.text);
            const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
            patch = { [key]: !enabled };
        }
        const richText = (0, model_1.applyRichTextStyleRange)(value.text, value.richText, selected.start, selected.end, patch);
        (0, rich_text_dom_1.renderRichTextRuns)(editor, richText, value.text, false);
        editor.focus();
        restoreSelection(selected);
        positionToolbar();
    };
    const button = (label, title, key) => {
        const element = toolbar.createEl("button", { text: label, attr: { type: "button", title, "aria-label": title } });
        element.addClass(`is-${key}`);
        element.addEventListener("pointerdown", (event) => event.preventDefault());
        element.addEventListener("click", () => applyStyle({ [key]: true }));
    };
    button("B", `加粗（${options.shortcuts.bold}）`, "bold");
    button("I", `斜体（${options.shortcuts.italic}）`, "italic");
    button("U", `下划线（${options.shortcuts.underline}）`, "underline");
    // Color button with popover: common swatches + last color + custom picker
    const colorBtn = toolbar.createEl("button", {
        cls: "mms-color-btn",
        attr: { type: "button", title: "文字颜色" }
    });
    colorBtn.createSpan({ text: "A" });
    colorBtn.style.textDecorationColor = lastColor;
    const popover = toolbar.createDiv({ cls: "mms-color-popover is-hidden" });
    // Common color swatches
    for (const swatch of COMMON_COLORS) {
        const dot = popover.createEl("button", { attr: { type: "button", "data-color": swatch } });
        dot.style.backgroundColor = swatch;
        dot.addEventListener("click", () => {
            lastColor = swatch;
            colorBtn.style.textDecorationColor = swatch;
            applyStyle({ color: swatch });
            popover.addClass("is-hidden");
        });
    }
    // Last color row + native picker
    const customRow = popover.createDiv({ cls: "mms-color-popover-row" });
    const lastDot = customRow.createEl("button", {
        cls: "mms-color-last",
        attr: { type: "button", title: "上次颜色" }
    });
    lastDot.style.backgroundColor = lastColor;
    lastDot.addEventListener("click", () => {
        applyStyle({ color: lastColor });
        popover.addClass("is-hidden");
    });
    const nativeInput = customRow.createEl("input", {
        attr: { type: "color", "aria-label": "自定义" }
    });
    nativeInput.value = lastColor;
    nativeInput.addEventListener("input", () => {
        lastColor = nativeInput.value;
        colorBtn.style.textDecorationColor = nativeInput.value;
        lastDot.style.backgroundColor = nativeInput.value;
        applyStyle({ color: nativeInput.value });
        popover.addClass("is-hidden");
    });
    colorBtn.addEventListener("click", () => {
        rememberSelection();
        popover.toggleClass("is-hidden", !popover.hasClass("is-hidden"));
    });
    document.addEventListener("pointerdown", (closeEvent) => {
        if (!toolbar.contains(closeEvent.target) && !popover.contains(closeEvent.target)) {
            popover.addClass("is-hidden");
        }
    });
    const update = () => {
        const selected = rememberSelection();
        toolbar.toggleClass("is-hidden", !selected || selected.start === selected.end);
        if (selected && selected.start !== selected.end)
            positionToolbar();
    };
    const keydown = (event) => {
        const key = options.shortcutMatches(event, options.shortcuts.bold) ? "bold"
            : options.shortcutMatches(event, options.shortcuts.italic) ? "italic"
                : options.shortcutMatches(event, options.shortcuts.underline) ? "underline" : null;
        if (key) {
            event.preventDefault();
            applyStyle({ [key]: true });
        }
        else if (options.shortcutMatches(event, options.shortcuts.color)) {
            event.preventDefault();
            rememberSelection();
            applyStyle({ color: lastColor });
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
