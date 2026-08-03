/**
 * @file code-block.ts
 * @description 四种显示模式共享的代码块展示策略、Markdown 包装与行号 DOM 布局。
 */

import type { MindMapAppearance, MindMapCodeBlock } from "../core/model";

/** 代码块渲染时使用的全局默认值与自动阈值。 */
export interface CodeBlockGlobalDefaults {
  collapsed: boolean;
  showLineNumbers: boolean;
  theme: "obsidian" | "github" | "monokai" | "dracula";
  autoExpandMaxLines: number;
  autoLineNumbersMinLines: number;
}

/** 按节点、页面和全局设置解析后的代码块展示结果。 */
export interface ResolvedCodeBlockPresentation {
  collapsed: boolean;
  showLineNumbers: boolean;
  theme: "obsidian" | "github" | "monokai" | "dracula";
  lineCount: number;
}

/** 共享代码块渲染器所需的宿主参数。 */
export interface CodeBlockRenderOptions {
  block: MindMapCodeBlock;
  container: HTMLElement;
  pageAppearance?: Pick<MindMapAppearance, "codeCollapsed" | "codeShowLineNumbers" | "codeTheme">;
  defaults: CodeBlockGlobalDefaults;
  renderMarkdown: (markdown: string, target: HTMLElement) => void | Promise<void>;
}

const CODE_THEME_CLASS_NAMES = {
  github: "mms-code-theme-github",
  monokai: "mms-code-theme-monokai",
  dracula: "mms-code-theme-dracula"
} as const;

/** 将设置中的代码行数阈值限制为受支持的整数范围。 */
function normalizeCodeLineThreshold(value: number): number {
  return Math.max(0, Math.min(1000, Math.floor(value || 0)));
}

/**
 * 返回源码的逻辑行数，同时兼容 LF、CRLF 和旧式 CR 换行。
 *
 * @param code 原始代码文本。
 * @returns 至少为 1 的逻辑行数；末尾换行会保留一个空白逻辑行。
 */
export function countCodeLines(code: string): number {
  return code.split(/\r\n|\r|\n/).length;
}

/**
 * 构建行号栏使用的纯文本，确保每个号码恰好占用一个代码行高。
 *
 * @param lineCount 需要显示的代码行数。
 * @returns 由换行连接的连续行号文本。
 */
export function buildCodeLineNumberText(lineCount: number): string {
  const safeLineCount = Math.max(1, Math.floor(lineCount || 0));
  return Array.from({ length: safeLineCount }, (_, index) => String(index + 1)).join("\n");
}

/**
 * 用不会与正文反引号冲突的围栏包装代码，供 Obsidian Markdown 渲染器高亮。
 *
 * @param block 当前代码块。
 * @returns 可直接交给 MarkdownRenderer 的 fenced code Markdown。
 */
export function buildFencedCodeMarkdown(block: MindMapCodeBlock): string {
  const longestFence = Math.max(2, ...Array.from(block.code.matchAll(/`+/g), (match) => match[0].length));
  const fence = "`".repeat(longestFence + 1);
  return `${fence}${block.language ?? ""}\n${block.code}\n${fence}`;
}

/**
 * 按节点显式值、自动阈值、页面设置和插件全局设置解析代码块展示状态。
 *
 * @param block 当前代码块。
 * @param pageAppearance 当前导图的页面级代码外观设置。
 * @param defaults 插件全局默认值与自动阈值。
 * @returns 最终折叠状态、行号状态、主题和逻辑行数。
 */
export function resolveCodeBlockPresentation(
  block: MindMapCodeBlock,
  pageAppearance: CodeBlockRenderOptions["pageAppearance"],
  defaults: CodeBlockGlobalDefaults
): ResolvedCodeBlockPresentation {
  const lineCount = countCodeLines(block.code);
  const expandThreshold = normalizeCodeLineThreshold(defaults.autoExpandMaxLines);
  const lineNumberThreshold = normalizeCodeLineThreshold(defaults.autoLineNumbersMinLines);
  const autoExpand = expandThreshold > 0 && lineCount <= expandThreshold;
  const autoLineNumbers = lineNumberThreshold > 0 ? lineCount > lineNumberThreshold : undefined;
  return {
    collapsed: block.collapsed ?? (autoExpand ? false : pageAppearance?.codeCollapsed ?? defaults.collapsed),
    showLineNumbers: block.showLineNumbers ?? autoLineNumbers ?? pageAppearance?.codeShowLineNumbers ?? defaults.showLineNumbers,
    theme: block.theme ?? pageAppearance?.codeTheme ?? defaults.theme,
    lineCount
  };
}

/** 将渲染前的代码字体、行高和内边距保存为共享 CSS 变量。 */
function captureCodeLayoutMetrics(pre: HTMLElement, code: HTMLElement): void {
  const view = pre.ownerDocument.defaultView;
  if (!view) return;
  const preStyle = view.getComputedStyle(pre);
  const codeStyle = view.getComputedStyle(code);
  pre.style.setProperty("--mms-code-padding-top", preStyle.paddingTop);
  pre.style.setProperty("--mms-code-padding-right", preStyle.paddingRight);
  pre.style.setProperty("--mms-code-padding-bottom", preStyle.paddingBottom);
  pre.style.setProperty("--mms-code-padding-left", preStyle.paddingLeft);
  pre.style.setProperty("--mms-code-font-family", codeStyle.fontFamily);
  pre.style.setProperty("--mms-code-font-size", codeStyle.fontSize);
  pre.style.setProperty("--mms-code-font-weight", codeStyle.fontWeight);
  pre.style.setProperty("--mms-code-line-height", codeStyle.lineHeight);
  pre.style.setProperty("--mms-code-letter-spacing", codeStyle.letterSpacing);
}

/**
 * 将独立行号栏插入高亮代码旁边；两栏使用同一组字体、行高和上下内边距。
 *
 * @param pre Obsidian MarkdownRenderer 生成的 pre 元素。
 * @param code pre 中保留完整语法高亮标记的 code 元素。
 * @param lineCount 原始代码的逻辑行数。
 * @remarks 行号不再依赖伪元素或光学基线补偿，因此缩放、主题和不同显示模式不会分别漂移。
 */
export function installCodeLineNumberLayout(pre: HTMLElement, code: HTMLElement, lineCount: number): void {
  pre.querySelector<HTMLElement>(":scope > .mms-code-line-numbers")?.remove();
  captureCodeLayoutMetrics(pre, code);
  pre.classList.add("mms-code-with-line-numbers");
  code.classList.add("mms-code-content");
  const gutter = pre.ownerDocument.createElement("span");
  gutter.className = "mms-code-line-numbers";
  gutter.textContent = buildCodeLineNumberText(lineCount);
  gutter.setAttribute("aria-hidden", "true");
  gutter.setAttribute("role", "presentation");
  pre.insertBefore(gutter, code);
}

/**
 * 使用统一渲染链路创建代码块，并在 Markdown 高亮完成后安装稳定的行号布局。
 *
 * @param options 代码数据、宿主容器、继承设置和 Markdown 渲染回调。
 * @returns MarkdownRenderer 完成及 DOM 增强完成后的 Promise。
 */
export async function renderCodeBlock(options: CodeBlockRenderOptions): Promise<void> {
  const presentation = resolveCodeBlockPresentation(options.block, options.pageAppearance, options.defaults);
  options.container.replaceChildren();
  options.container.classList.add("mms-code-render-root");
  options.container.classList.remove(...Object.values(CODE_THEME_CLASS_NAMES));
  const themeClass = presentation.theme === "obsidian" ? undefined : CODE_THEME_CLASS_NAMES[presentation.theme];
  if (themeClass) options.container.classList.add(themeClass);

  let target = options.container;
  if (presentation.collapsed) {
    const details = options.container.ownerDocument.createElement("details");
    details.className = "mms-code-collapsed";
    const summary = options.container.ownerDocument.createElement("summary");
    summary.textContent = `展开 ${options.block.language || "code"} 代码`;
    details.appendChild(summary);
    target = options.container.ownerDocument.createElement("div");
    target.className = "mms-code-collapsed-content";
    details.appendChild(target);
    options.container.appendChild(details);
  }

  await options.renderMarkdown(buildFencedCodeMarkdown(options.block), target);
  const pre = target.querySelector<HTMLElement>("pre");
  const code = pre?.querySelector<HTMLElement>(":scope > code") ?? null;
  if (!pre || !code) return;
  pre.classList.add("mms-code-frame");
  pre.dataset.lineCount = String(presentation.lineCount);
  if (presentation.showLineNumbers) installCodeLineNumberLayout(pre, code, presentation.lineCount);
}
