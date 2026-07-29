import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let source;
let styles;

before(async () => {
  source = await readFile("src/search/global-search.ts", "utf8");
  styles = await readFile("styles.css", "utf8");
});

test("single-result replacement is a right-aligned, labeled action", () => {
  assert.match(source, /const actions = header\.createDiv\(\{ cls: "mms-global-search-result-actions" \}\)/);
  assert.match(source, /const replaceOneBtn = actions\.createEl\("button"/);
  assert.match(source, /replaceOneBtn\.createSpan\(\{ text: "替换此节点" \}\)/);
  assert.match(styles, /\.mms-global-search-result-actions \{[\s\S]*justify-content: flex-end/);
  assert.match(styles, /\.mms-global-search-replace-one \{[\s\S]*min-width: 132px;[\s\S]*min-height: 34px/);
});
