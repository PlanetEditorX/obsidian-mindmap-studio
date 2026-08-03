import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let latex;
let cleanup;

before(async () => {
  ({ module: latex, cleanup } = await loadTypeScriptModule("src/core/latex.ts"));
});

after(async () => cleanup?.());

test("formula editor input removes accidental outer dollar delimiters", () => {
  assert.equal(latex.normalizeFormulaEditorSource("v=\\frac{s}{t}"), "v=\\frac{s}{t}");
  assert.equal(latex.normalizeFormulaEditorSource("$v=\\frac{s}{t}$"), "v=\\frac{s}{t}");
  assert.equal(latex.normalizeFormulaEditorSource("$$v=\\frac{s}{t}$$"), "v=\\frac{s}{t}");
  assert.equal(latex.normalizeFormulaEditorSource("$$$v=\\frac{s}{t}$$$"), "v=\\frac{s}{t}");
});

test("CJK labels are wrapped for MathJax without nesting existing text commands", () => {
  assert.equal(
    latex.normalizeLatexForMathJax("S=(首项+末项)\\frac{项数}{2}=a_{中间项}*项数"),
    "S=(\\text{首项}+\\text{末项})\\frac{\\text{项数}}{2}=a_{\\text{中间项}}*\\text{项数}"
  );
  assert.equal(
    latex.normalizeLatexForMathJax("\\text{项数}+末项"),
    "\\text{项数}+\\text{末项}"
  );
});

test("double-dollar formulas embedded with text render inline while formula-only blocks stay display", () => {
  const embedded = latex.splitLatexText("通项公式：$$a_n=a_1+(n-1)d$$");
  assert.deepEqual(embedded.map((segment) => [segment.type, segment.display]), [["text", false], ["math", false]]);
  assert.equal(embedded[1].source, "a_n=a_1+(n-1)d");

  const display = latex.splitLatexText("  $$a_n=a_1+(n-1)d$$  ");
  assert.equal(display.find((segment) => segment.type === "math")?.display, true);
});

test("legacy repeated and asymmetric dollar runs recover as inline formulas", () => {
  for (const value of [
    "求和：$$$S=(首项+末项)$$$",
    "求和：$$$S=(首项+末项)$$",
    "求和：$$S=(首项+末项)$$$"
  ]) {
    const math = latex.splitLatexText(value).find((segment) => segment.type === "math");
    assert.ok(math);
    assert.equal(math.display, false);
    assert.equal(math.source, "S=(首项+末项)");
  }
});

test("multiple inline formulas remain separate text-flow segments", () => {
  const segments = latex.splitLatexText("速度 $v=s/t$，时间 $t=s/v$。");
  assert.deepEqual(segments.map((segment) => segment.type), ["text", "math", "text", "math", "text"]);
  assert.equal(segments.filter((segment) => segment.type === "math").every((segment) => !segment.display), true);
});
