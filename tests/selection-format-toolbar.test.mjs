import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let source;
let modelSource;

before(async () => {
  [source, modelSource] = await Promise.all([
    readFile("src/editor/selection-format-toolbar.ts", "utf8"),
    readFile("src/core/model.ts", "utf8"),
  ]);
});

test("selection toolbar clears every rich-text style in the selected range", () => {
  assert.match(source, /const applyStyle = \(patch: Partial<MindMapTextStyle> \| null\)/);
  assert.match(source, /const clearFormat = toolbar\.createEl\("button", \{ text: "Tx"/);
  assert.match(source, /clearFormat\.addEventListener\("click", \(\) => applyStyle\(null\)\)/);
  assert.match(modelSource, /if \(patch === null\) styles\[index\] = \{\}/);
});
