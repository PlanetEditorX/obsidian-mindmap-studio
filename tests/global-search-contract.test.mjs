import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let source;
let styles;

before(async () => {
  source = await readFile("src/search/global-search.ts", "utf8");
  styles = await readFile("styles.css", "utf8");
});

test("single-result replacement is right-aligned and vertically centered", () => {
  assert.match(source, /const actions = item\.createDiv\(\{ cls: "mms-global-search-result-actions" \}\)/);
  assert.match(source, /const replaceOneBtn = actions\.createEl\("button"/);
  assert.match(source, /replaceOneBtn\.createSpan\(\{ text: "替换此节点" \}\)/);
  assert.match(styles, /\.mms-global-search-result-actions \{[\s\S]*justify-content: flex-end/);
  assert.match(styles, /\.mms-global-search-replace-one \{[\s\S]*min-width: 132px;[\s\S]*min-height: 34px/);
});

test("global search indexes only node text while displaying the result file context", () => {
  assert.match(source, /const searchText = normalized\(nodePlainText\(node\)\)/);
  assert.doesNotMatch(source, /nodeSearchText\(node\)|fieldValues\(node\)|"子导图"/);
  assert.match(source, /matchedKinds: \["节点文字"\]/);
  assert.match(source, /const location = item\.createDiv\(\{ cls: "mms-global-search-result-file" \}\)/);
  assert.match(source, /text: result\.fileTitle/);
  assert.match(source, /text: result\.filePath/);
  assert.doesNotMatch(source, /mms-global-search-result-badges/);
  assert.match(styles, /\.mms-global-search-result-title \{[\s\S]*flex: 1 1 auto;[\s\S]*overflow-wrap: anywhere/);
  assert.match(styles, /\.mms-global-search-result \{[\s\S]*position: relative;[\s\S]*padding: 10px 166px 10px 14px/);
  assert.match(styles, /\.mms-global-search-result-actions \{[\s\S]*position: absolute;[\s\S]*top: 50%;[\s\S]*right: 14px;[\s\S]*transform: translateY\(-50%\)/);
  assert.match(styles, /\.mms-global-search-result-file \{[\s\S]*margin-top: 6px/);
  assert.match(styles, /\.mms-global-search-result-path \{[\s\S]*text-overflow: ellipsis/);
  assert.doesNotMatch(styles, /mms-global-search-badge/);
});
