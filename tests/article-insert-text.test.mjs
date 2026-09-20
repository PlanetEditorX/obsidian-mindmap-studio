import assert from "node:assert/strict";
import test, { before } from "node:test";
import { readFile } from "node:fs/promises";

let editorSource;
let modalSource;
let rendererSource;
let cssSource;

before(async () => {
  [editorSource, modalSource, rendererSource, cssSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/node-edit-modal.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("styles.css", "utf8")
  ]);
});

test("article image blocks expose an insert-text entry point (hover button + context menu)", () => {
  // 右键菜单项
  assert.match(editorSource, /\.setTitle\("在上方插入文字"\)/);
  assert.match(editorSource, /\.onClick\(\(\) => this\.insertArticleTextBlockBefore\(nodeId, blockId\)\)/);
  // 悬停按钮回调通过 ArticleRendererOptions 注入
  assert.match(rendererSource, /insertTextBlockBefore: \(nodeId: string, blockId: string\) => void;/);
  assert.match(editorSource, /insertTextBlockBefore: \(nodeId: string, blockId: string\) => this\.insertArticleTextBlockBefore\(nodeId, blockId\)/);
  assert.match(rendererSource, /mms-article-insert-above/);
  assert.match(cssSource, /\.mms-article-insert-above \{/);
});

test("inserting a text block before an image persists via mutate and starts inline editing", () => {
  assert.match(editorSource, /private insertArticleTextBlockBefore\(nodeId: string, blockId: string\): void \{/);
  assert.match(editorSource, /blocks\.splice\(index, 0, \{ id: newBlockId, type: "text", text: "" \}\)/);
  assert.match(editorSource, /replaceNodeContentBlocks\(node, blocks\)/);
  // 插入属于结构变更，且插入后应立即聚焦到新块行内编辑
  assert.match(editorSource, /, undefined, "structure"\)/);
  assert.match(editorSource, /this\.beginInlineEdit\(nodeId, newBlockId, true\)/);
});

test("empty first text block on an image-only leaf is still rendered as an editable paragraph", () => {
  // 纯图片节点的空首 text 块也要显示为可编辑叶子段落，否则插入后无可编辑 DOM。
  assert.match(rendererSource, /if \(firstTextBlock\) \{/);
  assert.match(rendererSource, /if \(firstTextBlock\) \{[\s\S]{0,80}?createArticleContentBlock/);
});

test("node editor modal offers a LaTeX formula insert that targets the active text block", () => {
  assert.match(modalSource, /FormulaEditModal/);
  assert.match(modalSource, /text: "公式"/);
  // 记录当前聚焦的文字块 id 作为写回目标
  assert.match(modalSource, /activeTextBlockId/);
  assert.match(modalSource, /focusin/);
  // display 公式 → 在目标块后插入新块；inline 公式 → 追加到当前文字块末尾
  assert.match(modalSource, /value\.display \? `\$\$\$\{value\.source\}\$\$` : `\$\$\{value\.source\}\$`/);
  assert.match(modalSource, /workingBlocks\.splice\(idx \+ 1, 0, \{ id: newId\(\), type: "text", text: formula \}\)/);
  assert.match(modalSource, /textBlock\.text \+= addition/);
});