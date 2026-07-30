import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let editorSource;
let articleRendererSource;
let mainBundle;

before(async () => {
  [editorSource, articleRendererSource, mainBundle] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("main.js", "utf8")
  ]);
});

test("article edit actions use inline editing while other modes keep the full node editor", () => {
  const editSelected = editorSource.match(/private editSelected\(initialBlockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const beginInlineEdit = editorSource.match(/private beginInlineEdit\([\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(editSelected, /this\.currentMode === "article"[\s\S]*this\.editSelectedArticleContent\(\)/);
  assert.match(editSelected, /this\.openSelectedNodeEditor\(initialBlockId\)/);
  assert.match(beginInlineEdit, /this\.currentMode === "mindmap" && this\.options\.nodeEditorPosition === "right"[\s\S]*this\.openSelectedNodeEditor\(\)/);
  assert.doesNotMatch(beginInlineEdit, /this\.options\.nodeEditorPosition === "right"\) this\.editSelected\(\)/);
});

test("article context menu shows edit-current-content or add-body and reading mode hides it", () => {
  const contextMenu = editorSource.match(/private openContextMenu\(event: MouseEvent\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const label = editorSource.match(/private articleEditActionLabel\([\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(contextMenu, /if \(this\.readOnly\) \{[\s\S]*menu\.showAtMouseEvent\(event\);[\s\S]*return;/);
  assert.match(contextMenu, /setTitle\(this\.articleEditActionLabel\(selected\)\)/);
  assert.match(label, /this\.articleInlineEditable\(node\.id\) \? "编辑当前内容" : "添加正文"/);
});

test("article edit focuses the rendered line and creates a removable body editor for content-only nodes", () => {
  const editArticle = editorSource.match(/private editSelectedArticleContent\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const imageEdit = editorSource.match(/private editImageBlock\(blockId: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(editArticle, /const inlineElement = this\.articleInlineEditable\(selected\.id\)/);
  assert.match(editArticle, /if \(inlineElement\) \{[\s\S]*this\.activateInlineEditable\(inlineElement\)/);
  assert.match(editArticle, /paragraph\.dataset\.mmsTransientArticleBody = "true"/);
  assert.match(editArticle, /this\.makeInlineEditable\(paragraph, selected, "正文段落"\)/);
  assert.match(editArticle, /if \(paragraph\.isConnected && !paragraph\.textContent\?\.trim\(\)\) paragraph\.remove\(\)/);
  assert.match(editArticle, /this\.activateInlineEditable\(paragraph\)/);
  assert.match(imageEdit, /this\.openSelectedNodeEditor\(blockId\)/, "image-specific editing must still open the full editor");
});


test("submap headings keep normal navigation but can be edited from the explicit article action", () => {
  assert.match(articleRendererSource, /headingLink\.dataset\.mmsExplicitEditOnly = "true"/);
  assert.match(articleRendererSource, /options\.makeInlineEditable\(headingLink, node, "章节标题"\)/);
  assert.match(articleRendererSource, /if \(headingLink\.contentEditable === "true"\) return/);
  assert.match(editorSource, /element\.dataset\.mmsExplicitEditOnly === "true"/);
});

test("compiled plugin contains the article-specific edit routing", () => {
  assert.match(mainBundle, /\\u7F16\\u8F91\\u5F53\\u524D\\u5185\\u5BB9/);
  assert.match(mainBundle, /\\u6DFB\\u52A0\\u6B63\\u6587/);
  assert.match(mainBundle, /mmsTransientArticleBody/);
});
