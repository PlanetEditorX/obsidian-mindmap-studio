import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let mainSource;
let modelSource;
let editorSource;
let articleRendererSource;
let layoutSource;
let styles;
let mainBundle;

/** Normalize checkout line endings so source-contract regexes behave the same on Windows and CI. */
function normalizeNewlines(source) {
  return source.replace(/\r\n?/g, "\n");
}

before(async () => {
  const sources = await Promise.all([
    readFile("src/main.ts", "utf8"),
    readFile("src/core/model.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/render/layout.ts", "utf8"),
    readFile("styles.css", "utf8"),
    readFile("main.js", "utf8")
  ]);
  [mainSource, modelSource, editorSource, articleRendererSource, layoutSource, styles, mainBundle] = sources.map(normalizeNewlines);
});

test("new child maps retain the standard two starter topics", () => {
  const createDefault = modelSource.match(/export function createDefaultDocument\([\s\S]*?\n\}/)?.[0] ?? "";
  const buildSubmap = mainSource.match(/private buildSubmapDocument\([\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(createDefault, /text: "主题 1"[\s\S]*text: "主题 2"/);
  assert.match(buildSubmap, /const document = this\.createConfiguredDocument\(title\)/);
  assert.doesNotMatch(buildSubmap, /document\.root\.children = \[\]/);
  assert.match(buildSubmap, /document\.root\.content = \[\{ id: `\$\{document\.root\.id\}_title`, type: "text", text: title \}\]/);
  assert.doesNotMatch(mainBundle, /document2\.root\.children = \[\];[\s\S]{0,180}document2\.root\.content/);
});

test("article mode renders and focuses a newly added empty child", () => {
  const leafBranch = articleRendererSource.match(/function renderArticleNodeSection\([\s\S]*?\n\}/)?.[0] ?? "";
  const addChild = editorSource.match(/private addChild\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const beginInlineEdit = editorSource.match(/private beginInlineEdit\([\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(leafBranch, /if \(firstTextBlock\?\.text\.trim\(\)\)/, "non-empty text keeps the normal article paragraph path");
  assert.match(leafBranch, /else if \(!options\.readOnly && blocks\.length === 0\)/, "only a truly content-free editable node gets a transient placeholder");
  assert.match(leafBranch, /renderRichTextRuns\(paragraph, undefined, ""\)/);
  assert.match(leafBranch, /options\.makeInlineEditable\(paragraph, info\.node, "正文段落"\)/);
  assert.doesNotMatch(leafBranch, /firstTextBlock\?\.text\.trim\(\) \|\|/, "table/image/code nodes must not share the empty-node placeholder condition");
  assert.match(addChild, /window\.requestAnimationFrame\(\(\) => this\.beginInlineEdit\(node\.id, undefined, true\)\)/);
  assert.match(beginInlineEdit, /const nodeScope = scope\.querySelector<HTMLElement>\(`\[data-node-id="\$\{CSS\.escape\(nodeId\)\}"\]`\)/);
  assert.match(beginInlineEdit, /blockId[\s\S]*\[data-block-id="\$\{CSS\.escape\(blockId\)\}"\]\[data-mms-inline-editable="true"\]/);
  assert.match(beginInlineEdit, /if \(inlineElement\) this\.activateInlineEditable\(inlineElement, true, protectInitialFocus\)/);
  assert.match(mainBundle, /else if \(!options\.readOnly && blocks\.length === 0\)/);
});

test("mind-map nodes keep a non-zero global minimum height", () => {
  assert.match(layoutSource, /const MIN_NODE_HEIGHT = 36/);
  assert.match(layoutSource, /Math\.max\(measured\.height, node\.style\?\.minHeight \?\? 0, MIN_NODE_HEIGHT\)/);
  assert.match(layoutSource, /Math\.max\(height, node\.style\?\.minHeight \?\? 0, MIN_NODE_HEIGHT\)/);
  assert.match(editorSource, /nodeEl\.style\.minHeight = `\$\{Math\.max\(36, node\.style\?\.minHeight \?\? 0\)\}px`/);
  assert.match(styles, /\.mmc-node \{[\s\S]*?min-height: 36px;/);
  assert.match(mainBundle, /var MIN_NODE_HEIGHT = 36/);
  assert.match(mainBundle, /nodeEl\.style\.minHeight = `\$\{Math\.max\(36,/);
});
