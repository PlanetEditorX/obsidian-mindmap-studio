import assert from "node:assert/strict";
import test, { before } from "node:test";
import { readFile } from "node:fs/promises";

let editorSource;
let modalSource;
let rendererSource;

before(async () => {
  [editorSource, modalSource, rendererSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/node-edit-modal.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8")
  ]);
});

test("article image context menu exposes an insert-text entry point", () => {
  // 右键菜单项
  assert.match(editorSource, /\.setTitle\("在上方插入文字"\)/);
  assert.match(editorSource, /\.onClick\(\(\) => this\.insertArticleTextBlockBefore\(nodeId, blockId\)\)/);
});

test("inserting a text block before an image persists via the article-locally-scoped mutate and starts inline editing", () => {
  assert.match(editorSource, /private insertArticleTextBlockBefore\(nodeId: string, blockId: string\): void \{/);
  assert.match(editorSource, /blocks\.splice\(index, 0, \{ id: newBlockId, type: "text", text: "" \}\)/);
  assert.match(editorSource, /replaceNodeContentBlocks\(node, blocks\)/);
  // 只插入正文文字块：用 mutateWithoutArticleContext（非 structure 影响），
  // 避免触发文章族异步重建导致的“文本框闪现/图片抖动回退”。
  assert.match(editorSource, /private insertArticleTextBlockBefore[\s\S]{0,600}?mutateWithoutArticleContext\(\(\) => \{/);
  assert.match(editorSource, /this\.mutateWithoutArticleContext\(\(\) => \{/);
  // 送帧后再聚焦新块行内编辑
  assert.match(editorSource, /window\.requestAnimationFrame\(\(\) => \{/);
  assert.match(editorSource, /beginInlineEdit\(nodeId, newBlockId, true\)/);
});

test("article renderer only uses the context-menu insert entry, with no hover plus button", () => {
  assert.doesNotMatch(rendererSource, /mms-article-insert-above/, "the hover plus button was removed by user request");
  assert.doesNotMatch(rendererSource, /insertTextBlockBefore/, "renderer no longer carries the removed hover-button callback");
  assert.doesNotMatch(rendererSource, /setIcon\(insertAbove/, "no plus button is created above the image");
});

test("node editor modal opens the LaTeX formula editor on click", () => {
  // 与其它内容块按钮一致使用 “+ 公式”
  assert.match(modalSource, /text: "\+ 公式", attr: \{ type: "button", title: "插入 LaTeX 公式到当前文字块"/);
  assert.match(modalSource, /new FormulaEditModal\(this\.app, \(value\) => \{/);
  // 之前缺少 .open() 导致点击“公式”无任何反应；现在必须打开弹窗
  assert.match(modalSource, /new FormulaEditModal\(this\.app,[\s\S]{0,2000}?\.open\(\);/);
  // 记录当前聚焦的文字块 id 作为写回目标
  assert.match(modalSource, /activeTextBlockId/);
  assert.match(modalSource, /focusin/);
  // display 公式 → 在目标块后插入新块；inline 公式 → 追加到当前文字块末尾
  assert.match(modalSource, /value\.display \? `\$\$\$\{value\.source\}\$\$` : `\$\$\{value\.source\}\$`/);
  assert.match(modalSource, /workingBlocks\.splice\(idx \+ 1, 0, \{ id: newId\(\), type: "text", text: formula \}\)/);
  assert.match(modalSource, /textBlock\.text \+= addition/);
});