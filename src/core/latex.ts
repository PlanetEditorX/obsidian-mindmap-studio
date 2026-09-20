/**
 * @file latex.ts
 * @description LaTeX delimiter recovery and MathJax-safe source normalization.
 */

/** One parsed text or formula segment from a rich-text block. */
export interface LatexTextSegment {
  type: "text" | "math";
  start: number;
  end: number;
  source: string;
  display: boolean;
}

/**
 * Removes accidental outer dollar delimiters from formula-editor input.
 *
 * The editor owns the inline/display choice, so pasted `$...$`, `$$...$$`,
 * or legacy repeated delimiters must not be wrapped a second time.
 */
export function normalizeFormulaEditorSource(value: string): string {
  let source = value.trim();
  const leading = source.match(/^\$+/)?.[0].length ?? 0;
  const trailing = source.match(/\$+$/)?.[0].length ?? 0;
  if (leading > 0 && trailing > 0 && leading + trailing < source.length) {
    source = source.slice(leading, source.length - trailing).trim();
  }
  return source;
}

/**
 * Converts unescaped CJK words in math mode into `\text{...}` groups.
 *
 * AI-generated formulas often contain readable labels such as `项数` or
 * `中间项`. MathJax can reject these when they are emitted as bare TeX math
 * characters, so the renderer wraps only the unprotected CJK runs while
 * leaving existing text-like commands intact.
 */
export function normalizeLatexForMathJax(value: string): string {
  const protectedGroups: string[] = [];
  const protectedSource = value.replace(
    /\\(?:text|textrm|textsf|texttt|mathrm|mathbf|mathit|operatorname)\{[^{}]*[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff][^{}]*\}/g,
    (match) => {
      const marker = `@@MMS_LATEX_TEXT_${protectedGroups.length}@@`;
      protectedGroups.push(match);
      return marker;
    }
  );
  const normalized = protectedSource.replace(
    /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g,
    (match) => `\\text{${match}}`
  );
  return normalized.replace(/@@MMS_LATEX_TEXT_(\d+)@@/g, (_match, index: string) => protectedGroups[Number(index)] ?? "");
}

/**
 * Breaks an over-long inline formula into an `aligned` multi-line block.
 *
 * Long chains such as `R=...=...=...` cannot wrap on their own, so they push
 * out of the page. Every top-level `=` becomes a line break inside an
 * `aligned` environment, which MathJax lays out as one multi-line block that
 * still flows with the surrounding text. Formulas that cannot be split keep
 * their original single-line rendering.
 *
 * @returns The aligned source, or null when the formula must stay as-is.
 */
export function wrapLatexForLineBreaks(value: string): string | null {
  const source = value.trim();
  if (!source || source.includes("\\begin{") || source.includes("\\end{")) return null;
  // `\left`/`\right` pairs must stay in one group, so they cannot be split.
  if (source.includes("\\left") || source.includes("\\right")) return null;
  const boxed = boxedContent(source);
  if (boxed !== null) {
    const inner = wrapLatexForLineBreaks(boxed);
    return inner ? `\\boxed{${inner}}` : null;
  }
  const parts = splitLatexAtTopLevelRelation(source);
  if (parts.length < 2 || parts.some((part) => !part.trim())) return null;
  const lines = parts.map((part, index) => (index ? `& ${part.trim()}` : part.trim()));
  return `\\begin{aligned} ${lines.join(" \\\\ ")} \\end{aligned}`;
}

/**
 * Returns the content of a source that is exactly one `\boxed{...}` group.
 *
 * @param source Trimmed formula source.
 * @returns The boxed content, or null when the source is not a single box.
 */
function boxedContent(source: string): string | null {
  const prefix = "\\boxed{";
  if (!source.startsWith(prefix) || !source.endsWith("}")) return null;
  let depth = 0;
  for (let index = prefix.length - 1; index < source.length; index += 1) {
    const char = source[index]!;
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index === source.length - 1 ? source.slice(prefix.length, index) : null;
    }
  }
  return null;
}

/**
 * Splits a formula source before every top-level `=`.
 *
 * Braces, escaped characters and command groups keep their operators intact,
 * so only the relations that separate the steps of the formula become breaks.
 *
 * @param source Trimmed formula source.
 * @returns The parts, with the first part starting the formula.
 */
function splitLatexAtTopLevelRelation(source: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cursor = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0 || char !== "=") continue;
    parts.push(source.slice(cursor, index));
    cursor = index;
  }
  parts.push(source.slice(cursor));
  return parts;
}

/**
 * Splits a text block into plain-text and formula segments.
 *
 * Double-dollar formulas only use display layout when the whole text block
 * contains that formula and whitespace. This recovers legacy content such as
 * `通项公式：$$a_n=...$$` as inline math. Repeated or asymmetric dollar runs
 * from older double-wrapping bugs are also recovered as inline formulas.
 */
export function splitLatexText(value: string): LatexTextSegment[] {
  const formulas: LatexTextSegment[] = [];
  let cursor = 0;
  while (cursor < value.length) {
    const start = value.indexOf("$", cursor);
    if (start < 0) break;
    let openerEnd = start;
    while (value[openerEnd] === "$") openerEnd += 1;
    const openerLength = openerEnd - start;
    if (openerLength === 1) {
      const lineEnd = value.indexOf("\n", openerEnd);
      const searchEnd = lineEnd < 0 ? value.length : lineEnd;
      let closing = value.indexOf("$", openerEnd);
      while (closing >= 0 && closing < searchEnd && value[closing - 1] === "\\") {
        closing = value.indexOf("$", closing + 1);
      }
      if (closing < 0 || closing >= searchEnd || closing === openerEnd) {
        cursor = openerEnd;
        continue;
      }
      let closingEnd = closing;
      while (value[closingEnd] === "$") closingEnd += 1;
      formulas.push({
        type: "math",
        start,
        end: closingEnd,
        source: value.slice(openerEnd, closing).trim(),
        display: false
      });
      cursor = closingEnd;
      continue;
    }

    let closing = openerEnd;
    let closingEnd = -1;
    while (closing < value.length) {
      closing = value.indexOf("$$", closing);
      if (closing < 0) break;
      closingEnd = closing;
      while (value[closingEnd] === "$") closingEnd += 1;
      if (closing > openerEnd) break;
      closing = Math.max(closingEnd, closing + 2);
    }
    if (closing < 0 || closingEnd < 0 || closing <= openerEnd) {
      cursor = openerEnd;
      continue;
    }
    const source = value.slice(openerEnd, closing).trim();
    if (!source) {
      cursor = closingEnd;
      continue;
    }
    const closerLength = closingEnd - closing;
    const blockOnly = !value.slice(0, start).trim() && !value.slice(closingEnd).trim();
    formulas.push({
      type: "math",
      start,
      end: closingEnd,
      source,
      display: openerLength === 2 && closerLength === 2 && blockOnly
    });
    cursor = closingEnd;
  }

  if (!formulas.length) return [{ type: "text", start: 0, end: value.length, source: value, display: false }];
  const result: LatexTextSegment[] = [];
  let offset = 0;
  for (const formula of formulas) {
    if (formula.start > offset) {
      result.push({ type: "text", start: offset, end: formula.start, source: value.slice(offset, formula.start), display: false });
    }
    result.push(formula);
    offset = formula.end;
  }
  if (offset < value.length) {
    result.push({ type: "text", start: offset, end: value.length, source: value.slice(offset), display: false });
  }
  return result;
}
