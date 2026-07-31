import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let cleanup;
let editorSource;
let articleRendererSource;
let richTextSource;
let styles;
let mainBundle;

before(async () => {
  const [loaded, editor, articleRenderer, richText, css, bundle] = await Promise.all([
    loadTypeScriptModules(
      ["src/core/node-tree.ts", "src/core/model.ts"],
      "src/core/model.ts"
    ),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/node-rich-text-editor.ts", "utf8"),
    readFile("styles.css", "utf8"),
    readFile("main.js", "utf8")
  ]);
  model = loaded.module;
  cleanup = loaded.cleanup;
  editorSource = editor;
  articleRendererSource = articleRenderer;
  richTextSource = richText;
  styles = css;
  mainBundle = bundle;
});

function fixture() {
  return {
    id: "root",
    text: "根",
    children: [
      {
        id: "source",
        text: "第一段 第二段",
        content: [
          { id: "text-a", type: "text", text: "第一段" },
          { id: "code-a", type: "code", code: { language: "nginx", code: "server {}" } },
          { id: "text-b", type: "text", text: "第二段" }
        ],
        code: { language: "nginx", code: "server {}" },
        children: []
      },
      {
        id: "target",
        text: "目标",
        content: [{ id: "target-text", type: "text", text: "目标" }],
        children: []
      }
    ]
  };
}

test("content blocks reorder inside one node and preserve stable IDs", () => {
  const root = fixture();
  assert.equal(model.moveNodeContentBlock(root, "source", "code-a", "source", "text-a", "before"), true);
  assert.deepEqual(root.children[0].content.map((block) => block.id), ["code-a", "text-a", "text-b"]);
  assert.equal(root.children[0].code.code, "server {}");
  assert.equal(model.moveNodeContentBlock(root, "source", "code-a", "source", "text-a", "before"), false);
});

test("a block can be inserted between two existing blocks", () => {
  const root = fixture();
  const source = root.children[0];
  const target = root.children[1];
  assert.equal(model.moveNodeContentBlock(root, "source", "code-a", "target", "target-text", "after"), true);
  assert.equal(model.moveNodeContentBlock(root, "source", "text-b", "target", "code-a", "before"), true);
  assert.deepEqual(target.content.map((block) => block.id), ["target-text", "text-b", "code-a"]);
  assert.deepEqual(source.content.map((block) => block.id), ["text-a"]);
});

test("content blocks move across nodes and rebuild both legacy mirrors", () => {
  const root = fixture();
  assert.equal(model.moveNodeContentBlock(root, "source", "code-a", "target", "target-text", "after"), true);
  assert.deepEqual(root.children[0].content.map((block) => block.id), ["text-a", "text-b"]);
  assert.equal(root.children[0].code, undefined);
  assert.deepEqual(root.children[1].content.map((block) => block.id), ["target-text", "code-a"]);
  assert.equal(root.children[1].code.code, "server {}");
});

test("a content block can be appended to an empty target node", () => {
  const root = fixture();
  root.children[1].text = "";
  root.children[1].content = undefined;
  assert.equal(model.moveNodeContentBlock(root, "source", "code-a", "target", undefined, "append"), true);
  assert.deepEqual(root.children[0].content.map((block) => block.id), ["text-a", "text-b"]);
  assert.deepEqual(root.children[1].content.map((block) => block.id), ["code-a"]);
  assert.equal(root.children[1].code.code, "server {}");
});

test("moving the last block deletes only a truly empty source leaf node", () => {
  const root = fixture();
  root.children[0].content = [{ id: "text-a", type: "text", text: "第一段" }];
  root.children[0].text = "第一段";
  root.children[0].code = undefined;
  assert.equal(model.moveNodeContentBlock(root, "source", "text-a", "target", "target-text", "after"), true);
  assert.deepEqual(root.children.map((node) => node.id), ["target"]);
  assert.deepEqual(root.children[0].content.map((block) => block.id), ["target-text", "text-a"]);

  const guarded = fixture();
  guarded.children[0].content = [{ id: "text-a", type: "text", text: "第一段" }];
  guarded.children[0].text = "第一段";
  guarded.children[0].code = undefined;
  guarded.children[0].note = "保留节点";
  assert.equal(model.moveNodeContentBlock(guarded, "source", "text-a", "target", "target-text", "after"), true);
  assert.deepEqual(guarded.children.map((node) => node.id), ["source", "target"]);
});

test("moving the last meaningful block also removes blank text placeholders and the empty source leaf", () => {
  const root = fixture();
  root.children[0].content = [
    { id: "text-a", type: "text", text: "第一段" },
    { id: "blank-a", type: "text", text: "   " }
  ];
  root.children[0].text = "第一段";
  root.children[0].code = undefined;
  assert.equal(model.moveNodeContentBlock(root, "source", "text-a", "target", "target-text", "after"), true);
  assert.deepEqual(root.children.map((node) => node.id), ["target"]);
  assert.deepEqual(root.children[0].content.map((block) => block.id), ["target-text", "text-a"]);
});

test("only semantic empty leaves are removable after their final content is deleted", () => {
  const emptyLeaf = { id: "empty", text: "", content: [], children: [] };
  assert.equal(model.isRemovableEmptyNode(emptyLeaf), true);
  assert.equal(model.isRemovableEmptyNode({ ...emptyLeaf, children: [{ id: "child", text: "子节点", children: [] }] }), false);
  assert.equal(model.isRemovableEmptyNode({ ...emptyLeaf, note: "保留备注" }), false);
  assert.equal(model.isRemovableEmptyNode({ ...emptyLeaf, task: "todo" }), false);
});

test("explicit article node move inserts C immediately after A", () => {
  const root = {
    id: "root",
    text: "根",
    children: ["A", "B", "C"].map((id) => ({ id, text: id, children: [] }))
  };
  assert.equal(model.moveNodeRelative(root, "C", "A", "after"), true);
  assert.deepEqual(root.children.map((node) => node.id), ["A", "C", "B"]);
});

test("node editor Enter commits while Shift+Enter remains a stored line break", () => {
  assert.match(editorSource, /form\.addEventListener\("keydown", \(event\) => \{[\s\S]*event\.key !== "Enter" \|\| event\.shiftKey \|\| event\.isComposing[\s\S]*saveNow\("commit", true\)[\s\S]*this\.close\(\)/);
  assert.match(richTextSource, /source\.value\.replace\(\/\\r\\n\?\/g, "\\n"\)/);
  assert.doesNotMatch(richTextSource, /replace\(\/\\r\?\\n\/g, " "\)/);
});

test("mind-map keeps mouse block dragging while article mode uses explicit movement actions", () => {
  assert.match(editorSource, /mmc-content-block-editor-drag-handle[\s\S]*draggable: "true"/);
  assert.match(editorSource, /bindContentBlockDragHandle\(blockElement: HTMLElement, nodeId: string, blockId: string\)/);
  assert.match(editorSource, /moveNodeContentBlock\(this\.document\.root, sourceNodeId, blockId, targetNodeId, targetBlockId, position\)/);
  assert.match(editorSource, /cls: "mmc-node-structured-block-shell"[\s\S]*renderNodeTable\(shell,[\s\S]*bindContentBlockDragHandle\(shell/);
  assert.match(editorSource, /cls: "mmc-node-structured-block-shell"[\s\S]*renderNodeCode\(shell,[\s\S]*bindContentBlockDragHandle\(shell/);
  assert.match(editorSource, /bindContentBlockAppendDropTarget\(nodeEl, node\.id\)/);
  assert.match(editorSource, /private bindContentBlockAppendDropTarget\(dropTarget: HTMLElement, nodeId: string\)[\s\S]*stopImmediatePropagation\(\)[\s\S]*moveContentBlock\(dragging\.nodeId, dragging\.blockId, nodeId, undefined, "append"\)/);
  assert.doesNotMatch(articleRendererSource, /bindContentBlockDragHandle|bindContentBlockAppendDropTarget/);
  assert.match(articleRendererSource, /shell\.dataset\.blockId = blockId/);
  assert.doesNotMatch(editorSource, /articleKeyboardMovingBlock|bindArticleContentBlockMoveControl|moveArticleContentBlockByKeyboard|mms-article-block-move-button/);
  assert.match(editorSource, /target\.closest<HTMLElement>\("\[data-block-id\]"\)\?\.dataset\.blockId[\s\S]*openContextMenu\(event, blockId\)/);
  assert.match(editorSource, /setTitle\("删除当前块"\)[\s\S]*removeContentBlock\(selected\.id, contextBlock\.id\)/);
  assert.match(editorSource, /private removeNodeAfterContentDeletion\(node: MindMapNode, hadMeaningfulContent: boolean\): boolean/);
  assert.match(editorSource, /!hadMeaningfulContent \|\| node\.id === this\.document\.root\.id \|\| !isRemovableEmptyNode\(node\)/);
  assert.match(styles, /\.mmc-content-block-drag-handle[\s\S]*cursor: grab/);
  assert.match(styles, /\.mmc-content-block-drag-handle[\s\S]*left: -28px[\s\S]*transform: translateY\(-50%\)/);
  assert.match(styles, /\.mmc-node-structured-block-shell[\s\S]*position: relative/);
  assert.match(styles, /\.mmc-content-block-append-target\.is-block-drop-append::after/);
  assert.match(styles, /\.mmc-editor\.is-read-only \.mmc-content-block-drag-handle[\s\S]*display: none/);
  assert.doesNotMatch(styles, /mms-article-block-move-button|is-keyboard-moving/);
  assert.match(styles, /\.is-block-drop-before::before/);
  assert.match(mainBundle, /application\/x-mms-content-block/);
  assert.doesNotMatch(mainBundle, /mms-article-block-move-button/);
  assert.match(mainBundle, /\\u5220\\u9664\\u5F53\\u524D\\u5757/i);
});

test("article mode removes both floating movement controls", () => {
  assert.doesNotMatch(articleRendererSource, /bindArticleNodeDragHandle|bindArticleNodeDropTarget/);
  assert.doesNotMatch(editorSource, /bindArticleNodeDragHandle|bindArticleNodeDropTarget|articleNodeDropPosition/);
  assert.doesNotMatch(styles, /mms-article-node-drag-handle|mms-article-node-drag-source|is-node-drop-before|is-node-drop-child|is-node-drop-after/);
  assert.doesNotMatch(articleRendererSource, /bindContentBlockDragHandle|bindContentBlockAppendDropTarget/);
  assert.match(articleRendererSource, /heading\.dataset\.blockId = headingBlock\.id/);
});

test("article hierarchy commands demote to the previous sibling and promote after the parent", () => {
  const root = {
    id: "root",
    text: "根",
    children: [
      { id: "A", text: "A", children: [] },
      { id: "B", text: "B", children: [] },
      { id: "C", text: "C", children: [] }
    ]
  };
  assert.equal(model.moveNodeRelative(root, "B", "A", "child"), true);
  assert.deepEqual(root.children.map((node) => node.id), ["A", "C"]);
  assert.deepEqual(root.children[0].children.map((node) => node.id), ["B"]);
  assert.equal(model.moveNodeRelative(root, "B", "A", "after"), true);
  assert.deepEqual(root.children.map((node) => node.id), ["A", "B", "C"]);
});

after(() => cleanup?.());
