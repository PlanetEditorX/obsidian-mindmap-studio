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
