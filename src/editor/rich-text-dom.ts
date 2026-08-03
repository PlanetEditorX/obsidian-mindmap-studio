/**
 * @file rich-text-dom.ts
 * @description 编辑器领域中富文本模型与可编辑 DOM 的转换。
 */

import { finishRenderMath, loadMathJax, renderMath } from "obsidian";
import {
  markdownInlineToRichText,
  normalizeRichText,
  richTextPlainText,
  type MindMapTextRun,
  type MindMapTextStyle
} from "../core/model";
import { normalizeLatexForMathJax, splitLatexText } from "../core/latex";

let mathJaxReady = false;
let mathJaxLoading: Promise<void> | null = null;

/**
 * 确保 Obsidian 的 MathJax 运行时已加载。
 *
 * @returns MathJax 可安全渲染时完成的 Promise。
 */
export function ensureMathJax(): Promise<void> {
  if (mathJaxReady) return Promise.resolve();
  mathJaxLoading ??= loadMathJax().then(() => { mathJaxReady = true; });
  return mathJaxLoading;
}

/**
 * 判断两个字符样式是否等价。
 *
 * @param left 左侧字符样式。
 * @param right 右侧字符样式。
 * @returns 两个样式是否具有相同字段和值。
 */
function styleEquals(left: MindMapTextStyle | undefined, right: MindMapTextStyle | undefined): boolean {
  return JSON.stringify(left ?? {}) === JSON.stringify(right ?? {});
}

/**
 * 将富文本运行段渲染到 DOM，并按需处理 LaTeX。
 *
 * @param container 接收渲染内容的 DOM 容器。
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 无运行段时使用的纯文本。
 * @param latex 是否识别 LaTeX 公式。
 */
export function renderRichTextRuns(
  container: HTMLElement,
  runs: MindMapTextRun[] | undefined,
  fallbackText: string,
  latex = true
): void {
  container.empty();
  const sourceRuns = runs?.length ? runs : [{ text: fallbackText }];
  const append = (text: string, style: MindMapTextStyle | undefined): void => {
    const span = style?.link
      ? container.createEl("a", {
        cls: "mmc-rich-run mmc-rich-link",
        text,
        attr: { href: style.link, target: "_blank", rel: "noopener noreferrer" }
      })
      : container.createSpan({ cls: "mmc-rich-run", text });
    if (style?.link) {
      span.addEventListener("click", (event) => {
        if (container.contentEditable === "true" || container.closest('[contenteditable="true"]')) event.preventDefault();
      });
    }
    span.toggleClass("is-inline-code", style?.code === true);
    if (style?.bold !== undefined) span.style.fontWeight = style.bold ? "700" : "400";
    if (style?.italic !== undefined) span.style.fontStyle = style.italic ? "italic" : "normal";
    const decorations: string[] = [];
    if (style?.underline) decorations.push("underline");
    if (style?.strike) decorations.push("line-through");
    if (decorations.length) span.style.textDecorationLine = decorations.join(" ");
    if (style?.color) span.style.color = style.color;
  };
  const combinedText = sourceRuns.map((run) => run.text).join("");
  const runRanges = sourceRuns.map((run, index) => ({
    run,
    start: sourceRuns.slice(0, index).reduce((total, item) => total + item.text.length, 0),
    end: sourceRuns.slice(0, index + 1).reduce((total, item) => total + item.text.length, 0)
  }));
  const appendRange = (start: number, end: number): void => {
    for (const range of runRanges) {
      const from = Math.max(start, range.start);
      const to = Math.min(end, range.end);
      if (to > from) append(combinedText.slice(from, to), range.run.style);
    }
  };
  const segments = latex ? splitLatexText(combinedText) : [];
  const hasMath = latex && segments.some((segment) => segment.type === "math");
  if (hasMath && !mathJaxReady) {
    sourceRuns.forEach((run) => append(run.text, run.style));
    void ensureMathJax().then(() => {
      if (container.isConnected && container.contentEditable !== "true") {
        renderRichTextRuns(container, runs, fallbackText, latex);
      }
    }).catch(() => undefined);
    return;
  }
  if (!latex || !hasMath) {
    sourceRuns.forEach((run) => append(run.text, run.style));
    return;
  }
  let renderedMath = false;
  for (const segment of segments) {
    if (segment.type === "text") {
      appendRange(segment.start, segment.end);
      continue;
    }
    try {
      const math = renderMath(normalizeLatexForMathJax(segment.source), segment.display);
      math.addClass("mms-node-math");
      math.toggleClass("is-display", segment.display);
      container.appendChild(math);
      renderedMath = true;
    } catch {
      appendRange(segment.start, segment.end);
    }
  }
  if (renderedMath) void finishRenderMath();
}

/** Renders the supported inline Markdown formatting used in table cells. */
export function renderInlineMarkdown(container: HTMLElement, markdown: string): void {
  const parsed = markdownInlineToRichText(markdown);
  renderRichTextRuns(container, parsed.richText, parsed.text, false);
}

/**
 * 合并元素标签、内联样式与继承样式。
 *
 * @param element 当前富文本元素。
 * @param inherited 从父元素继承的字符样式。
 * @returns 当前元素对应的字符样式。
 */
function styleFromElement(element: HTMLElement, inherited: MindMapTextStyle): MindMapTextStyle {
  const style: MindMapTextStyle = { ...inherited };
  const tag = element.tagName.toLowerCase();
  if (tag === "b" || tag === "strong") style.bold = true;
  if (tag === "i" || tag === "em") style.italic = true;
  if (tag === "u") style.underline = true;
  if (tag === "s" || tag === "strike" || tag === "del") style.strike = true;
  if (tag === "code" || element.hasClass("is-inline-code")) style.code = true;
  if (tag === "a") style.link = element.getAttribute("href") ?? undefined;
  const inline = element.style;
  if (inline.fontWeight && (inline.fontWeight === "bold" || Number(inline.fontWeight) >= 600)) style.bold = true;
  if (inline.fontStyle === "italic") style.italic = true;
  const decoration = `${inline.textDecoration} ${inline.textDecorationLine}`;
  if (decoration.includes("underline")) style.underline = true;
  if (decoration.includes("line-through")) style.strike = true;
  const fontColor = tag === "font" ? element.getAttribute("color") : null;
  const color = inline.color || fontColor || "";
  if (color) {
    const probe = document.createElement("span");
    probe.style.color = color;
    document.body.appendChild(probe);
    const normalized = getComputedStyle(probe).color.match(/\d+/g)?.slice(0, 3).map(Number);
    probe.remove();
    if (normalized?.length === 3) {
      style.color = `#${normalized.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    }
  }
  return style;
}

/**
 * 将 contenteditable DOM 解析回富文本运行段。
 *
 * @param editor 富文本编辑容器。
 * @returns 纯文本及规范化后的运行段。
 */
export function readRichTextEditor(editor: HTMLElement): { text: string; richText?: MindMapTextRun[] } {
  const rawRuns: MindMapTextRun[] = [];
  const visit = (node: Node, inherited: MindMapTextStyle): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\r\n?/g, "\n");
      if (!text) return;
      const style = Object.values(inherited).some((value) => value !== undefined) ? { ...inherited } : undefined;
      const previous = rawRuns.at(-1);
      if (previous && styleEquals(previous.style, style)) previous.text += text;
      else rawRuns.push({ text, style });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") {
      rawRuns.push({ text: "\n" });
      return;
    }
    const style = styleFromElement(node, inherited);
    node.childNodes.forEach((child) => visit(child, style));
    if (["DIV", "P"].includes(node.tagName) && rawRuns.length && !rawRuns.at(-1)?.text.endsWith("\n")) {
      rawRuns.push({ text: "\n" });
    }
  };
  editor.childNodes.forEach((child) => visit(child, {}));
  const fallback = editor.innerText.replace(/\r\n?/g, "\n").trim();
  const richText = normalizeRichText(rawRuns, fallback);
  return { text: richTextPlainText(richText, fallback).trim(), richText };
}
