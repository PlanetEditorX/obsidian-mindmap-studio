import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let editorSource;
let modalSource;

before(async () => {
  [editorSource, modalSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/editor-modals.ts", "utf8"),
  ]);
});

test("file import defaults to a child branch and keeps replacement explicit", () => {
  assert.match(modalSource, /text: "导入文件"/);
  assert.match(modalSource, /导入为子节点（默认）/);
  assert.match(modalSource, /导入并替换当前文件/);
  assert.match(modalSource, /mode === "replace" && !window\.confirm/);
  assert.match(editorSource, /private importDocument\(document: MindMapDocument, mode: "child" \| "replace"\): void/);
  assert.match(editorSource, /const importedRoot = cloneNodeWithFreshIds\(document\.root\)/);
  assert.match(editorSource, /appendChild\(parent, importedRoot\)/);
});
