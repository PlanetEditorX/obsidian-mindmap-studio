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

test("content blocks move across nodes and rebuild both legacy mirrors", () => {
  const root = fixture();
  assert.equal(model.moveNodeContentBlock(root, "source", "code-a", "target", "target-text", "after"), true);
  assert.deepEqual(root.children[0].content.map((block) => block.id), ["text-a", "text-b"]);
  assert.equal(root.children[0].code, undefined);
  assert.deepEqual(root.children[1].content.map((block) => block.id), ["target-text", "code-a"]);
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

test("node editor Enter commits while Shift+Enter remains a stored line break", () => {
  assert.match(editorSource, /form\.addEventListener\("keydown", \(event\) => \{[\s\S]*event\.key !== "Enter" \|\| event\.shiftKey \|\| event\.isComposing[\s\S]*saveNow\("commit", true\)[\s\S]*this\.close\(\)/);
  assert.match(richTextSource, /source\.value\.replace\(\/\\r\\n\?\/g, "\\n"\)/);
  assert.doesNotMatch(richTextSource, /replace\(\/\\r\?\\n\/g, " "\)/);
});

test("mind-map blocks keep mouse drag while article blocks use persistent keyboard movement", () => {
  assert.match(editorSource, /mmc-content-block-editor-drag-handle[\s\S]*draggable: "true"/);
  assert.match(editorSource, /bindContentBlockDragHandle\(blockElement: HTMLElement, nodeId: string, blockId: string\)/);
  assert.match(editorSource, /moveNodeContentBlock\(this\.document\.root, sourceNodeId, blockId, targetNodeId, targetBlockId, position\)/);
  assert.match(editorSource, /cls: "mmc-node-structured-block-shell"[\s\S]*renderNodeTable\(shell,[\s\S]*bindContentBlockDragHandle\(shell/);
  assert.match(editorSource, /cls: "mmc-node-structured-block-shell"[\s\S]*renderNodeCode\(shell,[\s\S]*bindContentBlockDragHandle\(shell/);
  assert.match(articleRendererSource, /bindContentBlockKeyboardMoveControl: \(element: HTMLElement, nodeId: string, blockId: string\) => void/);
  assert.match(articleRendererSource, /createArticleContentBlock\([\s\S]*options\.bindContentBlockKeyboardMoveControl\(shell, node\.id, blockId\)/);
  assert.match(articleRendererSource, /options\.bindContentBlockKeyboardMoveControl\(heading, info\.node\.id, headingBlock\.id\)/);
  assert.doesNotMatch(articleRendererSource, /bindContentBlockDragHandle|bindContentBlockAppendDropTarget|draggable/);
  assert.match(editorSource, /private articleKeyboardMovingBlock: \{ nodeId: string; blockId: string \} \| null = null/);
  assert.match(editorSource, /private bindArticleContentBlockMoveControl\([\s\S]*mms-article-block-move-button[\s\S]*"ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"[\s\S]*requestAnimationFrame\(\(\) => handle\.focus\(\)\)/);
  assert.doesNotMatch(editorSource.match(/private bindArticleContentBlockMoveControl\([\s\S]*?\n  \}/)?.[0] ?? "", /if \(this\.readOnly\) return;[\s\S]*blockElement\.dataset/);
  assert.match(editorSource, /private moveArticleContentBlockByKeyboard\([\s\S]*findParent\(this\.document\.root, sourceNodeId\)[\s\S]*sourceNode\.children\[0\][\s\S]*articleKeyboardMovingBlock = \{ nodeId: targetNodeId, blockId \}/);
  assert.match(editorSource, /target\.closest<HTMLElement>\("\[data-block-id\]"\)\?\.dataset\.blockId[\s\S]*openContextMenu\(event, blockId\)/);
  assert.match(editorSource, /setTitle\("删除当前块"\)[\s\S]*removeContentBlock\(selected\.id, contextBlock\.id\)/);
  assert.match(styles, /\.mmc-content-block-drag-handle[\s\S]*cursor: grab/);
  assert.match(styles, /\.mmc-content-block-drag-handle[\s\S]*left: -28px[\s\S]*transform: translateY\(-50%\)/);
  assert.match(styles, /\.mmc-node-structured-block-shell[\s\S]*position: relative/);
  assert.match(styles, /\.mms-article-block-move-button[\s\S]*left: -32px[\s\S]*cursor: pointer/);
  assert.match(styles, /\.mms-article-content-block\.is-keyboard-moving/);
  assert.match(styles, /\.mmc-editor\.is-read-only \.mms-article-block-move-button[\s\S]*display: none/);
  assert.match(styles, /\.is-block-drop-before::before/);
  assert.match(mainBundle, /application\/x-mms-content-block/);
  assert.match(mainBundle, /mms-article-block-move-button/);
  assert.match(mainBundle, /\\u5220\\u9664\\u5F53\\u524D\\u5757/i);
});

after(() => cleanup?.());
