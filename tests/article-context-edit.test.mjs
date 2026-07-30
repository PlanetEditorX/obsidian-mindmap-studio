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
  const contextMenu = editorSource.match(/private openContextMenu\(event: MouseEvent, contextBlockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
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
  assert.match(articleRendererSource, /options\.makeInlineEditable\(headingLink, node, "章节标题", textBlock\?\.id\)/);
  assert.match(articleRendererSource, /if \(headingLink\.contentEditable === "true"\) return/);
  assert.match(editorSource, /element\.dataset\.mmsExplicitEditOnly === "true"/);
});


test("article inline actions expose high-frequency commands and route more to the full context menu", () => {
  const inlineActions = editorSource.match(/private addInlineNodeActions\(container: HTMLElement, node: MindMapNode\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(inlineActions, /button\.addEventListener\("pointerdown"[\s\S]*event\.preventDefault\(\)/, "action buttons must not blur an empty inline editor before their click runs");
  assert.match(inlineActions, /if \(this\.currentMode === "article"\)/);
  assert.match(inlineActions, /"添加同级节点"[\s\S]*this\.addSibling\(\)/);
  assert.match(inlineActions, /"添加子节点"[\s\S]*this\.addChild\(\)/);
  assert.match(inlineActions, /"删除节点"[\s\S]*this\.deleteNodeById\(node\.id\)/);
  assert.match(inlineActions, /"更多"[\s\S]*this\.openContextMenu\(event\)/);
  assert.match(inlineActions, /if \(node\.id !== this\.document\.root\.id\)[\s\S]*"添加同级节点"/, "the root must not offer an invalid sibling action");
  assert.match(inlineActions, /action\("pencil", "完整编辑"[\s\S]*this\.editSelected\(\)/, "outline mode keeps its existing full-editor shortcut");
});

test("article node settings remain available from the full context menu", () => {
  const contextMenu = editorSource.match(/private openContextMenu\(event: MouseEvent, contextBlockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(contextMenu, /if \(this\.currentMode === "article"\)[\s\S]*setTitle\("节点设置"\)[\s\S]*this\.openSelectedNodeEditor\(\)/);
  assert.match(contextMenu, /if \(selected\?\.id !== this\.document\.root\.id\)[\s\S]*setTitle\("添加同级节点"\)/, "the full menu must hide sibling insertion on the root");
  assert.match(contextMenu, /if \(selected\?\.id !== this\.document\.root\.id\)[\s\S]*setTitle\("删除节点"\)/, "the full menu must hide deletion on the root");
});

test("inline deletion targets the bound node and ignores a deleted editor's late blur", () => {
  const directDelete = editorSource.match(/private deleteNodeById\(nodeId: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const inlineEditor = editorSource.match(/private makeInlineEditable\(element: HTMLElement, node: MindMapNode, placeholder: string, blockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(directDelete, /findNode\(this\.document\.root, nodeId\)/);
  assert.match(directDelete, /deletionSelectionFallback\(this\.document\.root, \[nodeId\]\)/);
  assert.match(directDelete, /deleteNodes\(this\.document\.root, \[nodeId\]\)/);
  assert.doesNotMatch(directDelete, /this\.selectedNode\(\)/, "an inline delete must not depend on selection changed by blur or redraw");
  assert.match(inlineEditor, /if \(!findNode\(this\.document\.root, node\.id\)\) return/);
});

test("compiled plugin contains the article-specific edit routing", () => {
  assert.match(mainBundle, /\\u7F16\\u8F91\\u5F53\\u524D\\u5185\\u5BB9/);
  assert.match(mainBundle, /\\u6DFB\\u52A0\\u6B63\\u6587/);
  assert.match(mainBundle, /mmsTransientArticleBody/);
  assert.match(mainBundle, /\\u6DFB\\u52A0\\u540C\\u7EA7\\u8282\\u70B9/);
  assert.match(mainBundle, /\\u66F4\\u591A/);
  assert.match(mainBundle, /\\u8282\\u70B9\\u8BBE\\u7F6E/);
  assert.match(mainBundle, /deleteNodeById/);
});
