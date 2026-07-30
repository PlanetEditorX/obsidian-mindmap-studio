import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let editorSource;
let articleRendererSource;
let styles;
let mainBundle;
let nodeActionsSource;

before(async () => {
  [editorSource, articleRendererSource, styles, mainBundle, nodeActionsSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("styles.css", "utf8"),
    readFile("main.js", "utf8"),
    readFile("src/editor/node-actions.ts", "utf8")
  ]);
});

test("deleting nodes prefers the prior sibling and preserves its mind-map viewport position", () => {
  const fallback = nodeActionsSource.match(/export function deletionSelectionFallback\([\s\S]*?\n\}/)?.[0] ?? "";
  const directDelete = editorSource.match(/private deleteNodeById\(nodeId: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(fallback, /const previous = [\s\S]*const next = [\s\S]*if \(previous\) return previous\.id;[\s\S]*if \(next\) return next\.id/);
  assert.match(fallback, /if \(!removed\.has\(parent\.id\)\) return parent\.id;[\s\S]*current = parent/);
  assert.match(directDelete, /const mindMapAnchor = this\.captureMindMapViewportAnchor\(fallback\)/);
  assert.match(directDelete, /this\.restoreMindMapViewportAnchor\(mindMapAnchor\)/);
  assert.match(editorSource, /private restoreMindMapViewportAnchor\([\s\S]*this\.panX \+= \(anchor\.x - position\.x\) \* this\.zoom[\s\S]*this\.panY \+= \(anchor\.y - position\.y\) \* this\.zoom/);
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
  assert.match(inlineActions, /action\("grip-vertical", "作为块移动"[\s\S]*this\.startArticleBlockClickMove\(node\.id\)/);
  assert.match(inlineActions, /action\("git-branch", "作为节点移动"[\s\S]*this\.startArticleNodeClickMove\(node\.id\)/);
  assert.match(inlineActions, /action\("indent-increase", "降为上一个节点的子节点"[\s\S]*this\.demoteArticleNode\(node\.id\)/);
  assert.match(inlineActions, /action\("indent-decrease", "升为上一个节点的兄弟节点"[\s\S]*this\.promoteArticleNode\(node\.id\)/);
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

test("article context menu exposes the four explicit movement rules", () => {
  const contextMenu = editorSource.match(/private openContextMenu\(event: MouseEvent, contextBlockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const blockMove = editorSource.match(/private startArticleBlockClickMove\([\s\S]*?\n  \}/)?.[0] ?? "";
  const demote = editorSource.match(/private demoteArticleNode\([\s\S]*?\n  \}/)?.[0] ?? "";
  const promote = editorSource.match(/private promoteArticleNode\([\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(contextMenu, /this\.currentMode === "article" && selected && selected\.id !== this\.document\.root\.id[\s\S]*setTitle\("作为块移动"\)[\s\S]*setIcon\("grip-vertical"\)[\s\S]*contextBlock\?\.id/);
  assert.match(contextMenu, /setTitle\("作为节点移动"\)[\s\S]*setIcon\("git-branch"\)/);
  assert.match(contextMenu, /setTitle\("降为上一个节点的子节点"\)[\s\S]*this\.demoteArticleNode\(selected\.id\)/);
  assert.match(contextMenu, /setTitle\("升为上一个节点的兄弟节点"\)[\s\S]*this\.promoteArticleNode\(selected\.id\)/);
  assert.match(blockMove, /preferredBlockId \?\? \(active\?\.nodeId === nodeId \? active\.blockId : undefined\)/);
  assert.match(demote, /parent\?\.children\[index - 1\][\s\S]*this\.moveNode\(nodeId, previous\.id, "child"\)/);
  assert.match(promote, /findParent\(this\.document\.root, parent\.id\)[\s\S]*this\.moveNode\(nodeId, parent\.id, "after"\)/);
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

test("article click move keeps block and node semantics separate", () => {
  assert.match(editorSource, /type ArticleClickMove =[\s\S]*kind: "block"[\s\S]*blockId: string[\s\S]*kind: "node"/);
  assert.match(editorSource, /private startArticleBlockClickMove\([\s\S]*activeArticleBlock[\s\S]*pendingArticleClickMove = \{ kind: "block"/);
  assert.match(editorSource, /private completeArticleClickMove\([\s\S]*targetBlockId\?: string[\s\S]*position\?: "before" \| "after"[\s\S]*moveContentBlock\([\s\S]*targetBlockId[\s\S]*targetBlockId && position \? position : "append"/);
  assert.match(editorSource, /private completeArticleClickMove\([\s\S]*this\.selectNode\(pending\.sourceNodeId\)[\s\S]*this\.moveNode\(pending\.sourceNodeId, targetNodeId, "after"\)/);
  assert.match(editorSource, /private articleClickMoveTargetAllowed\([\s\S]*pending\.kind === "node" && pending\.sourceNodeId === targetNodeId[\s\S]*targetNodeId === this\.document\.root\.id[\s\S]*findAncestors\(this\.document\.root, targetNodeId\)/);
  assert.match(editorSource, /private articleBlockMoveTargetAllowed\([\s\S]*pending\.sourceNodeId === targetNodeId && pending\.blockId === targetBlockId/);
  assert.match(editorSource, /this\.articleEl\.addEventListener\("click", articleClickMoveTarget, true\)/);
  assert.match(editorSource, /this\.pendingArticleClickMove && event\.key === "Escape"[\s\S]*this\.cancelArticleClickMove\(\)/);
});

test("article click move exposes clear target feedback", () => {
  assert.match(articleRendererSource, /title\.dataset\.nodeId = options\.document\.root\.id/);
  assert.match(styles, /\.mms-article-click-move-hint[\s\S]*position: sticky/);
  assert.match(styles, /\.is-article-click-moving \.mms-article-node\.is-article-click-move-target:hover/);
  assert.match(styles, /\.is-article-click-moving \.is-article-click-move-invalid[\s\S]*cursor: not-allowed/);
  assert.match(editorSource, /articleBlockMovePointer[\s\S]*targetBlock\.getBoundingClientRect\(\)[\s\S]*is-article-block-drop-before[\s\S]*is-article-block-drop-after/);
  assert.match(styles, /\[data-block-id\]\.is-article-block-drop-before::before/);
  assert.match(styles, /\[data-block-id\]\.is-article-block-drop-after::after/);
});

test("compiled plugin contains the article-specific edit routing", () => {
  assert.match(mainBundle, /\\u7F16\\u8F91\\u5F53\\u524D\\u5185\\u5BB9/);
  assert.match(mainBundle, /\\u6DFB\\u52A0\\u6B63\\u6587/);
  assert.match(mainBundle, /mmsTransientArticleBody/);
  assert.match(mainBundle, /\\u6DFB\\u52A0\\u540C\\u7EA7\\u8282\\u70B9/);
  assert.match(mainBundle, /\\u66F4\\u591A/);
  assert.match(mainBundle, /\\u8282\\u70B9\\u8BBE\\u7F6E/);
  assert.match(mainBundle, /\\u4F5C\\u4E3A\\u5757\\u79FB\\u52A8/i);
  assert.match(mainBundle, /\\u4F5C\\u4E3A\\u8282\\u70B9\\u79FB\\u52A8/i);
  assert.match(mainBundle, /deleteNodeById/);
});
