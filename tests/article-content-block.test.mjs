import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let cleanup;
let editorSource;
let rendererSource;
let styles;
let mainBundle;

before(async () => {
  const loaded = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts"
  ], "src/core/model.ts");
  model = loaded.module;
  cleanup = loaded.cleanup;
  [editorSource, rendererSource, styles, mainBundle] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("styles.css", "utf8"),
    readFile("main.js", "utf8")
  ]);
});

after(async () => cleanup?.());

test("article block context inserts text immediately after the clicked code block", () => {
  const beginInlineEdit = editorSource.match(/private beginInlineEdit\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(rendererSource, /closest<HTMLElement>\("\[data-block-id\]"\)\?\.dataset\.blockId/);
  assert.match(rendererSource, /options\.openAiContextMenu\(event, info\.node\.id, blockId\)/);
  assert.match(editorSource, /private insertTextBlockAfter\(node: MindMapNode, afterBlockId\?: string\): string[\s\S]*findIndex\(\(block\) => block\.id === afterBlockId\)[\s\S]*blocks\.splice\(insertIndex, 0, \{ id: blockId, type: "text", text: "" \}\)/);
  assert.match(editorSource, /setTitle\(contextBlockId \? "在此块后插入文字" : "插入文字"\)[\s\S]*this\.insertTextBlock\(contextBlockId\)/);
  assert.match(editorSource, /\[data-block-id="\$\{CSS\.escape\(blockId\)\}"\]\[data-mms-inline-editable="true"\]/);
  assert.match(beginInlineEdit, /this\.activateInlineEditable\(inlineElement, true, protectInitialFocus\)/);
  assert.match(rendererSource, /options\.makeInlineEditable\(paragraph, node, "正文", block\.id\)/);
});

test("article inline editing updates the exact text block instead of the first block", () => {
  const makeInlineEditable = editorSource.match(/private makeInlineEditable\(element: HTMLElement, node: MindMapNode, placeholder: string, blockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(editorSource, /private makeInlineEditable\(element: HTMLElement, node: MindMapNode, placeholder: string, blockId\?: string\)/);
  assert.match(editorSource, /block\.type === "text" && block\.id === blockId/);
  assert.match(editorSource, /this\.updateNodeTextBlock\(node, next, blockId\)/);
  assert.match(rendererSource, /paragraph\.dataset\.blockId = block\.id/);
  assert.match(makeInlineEditable, /element\.addEventListener\("pointerdown"[\s\S]*this\.inlineEditingId = node\.id[\s\S]*this\.activateInlineEditable\(element, false\)/);
  assert.match(makeInlineEditable, /element\.addEventListener\("focus"[\s\S]*this\.inlineEditingId = node\.id/);
  assert.match(makeInlineEditable, /element\.dataset\.mmsProtectInitialFocus === "true"[\s\S]*window\.requestAnimationFrame\(\(\) => this\.activateInlineEditable\(element\)\)/);
  assert.match(makeInlineEditable, /if \(this\.inlineEditingId === node\.id\) this\.inlineEditingId = null/);
});

test("empty article document title keeps a clickable inline-edit target after blur", () => {
  assert.match(rendererSource, /options\.makeInlineEditable\(titleText, options\.document\.root, "文章标题", rootTextBlock\?\.id\)/);
  assert.match(editorSource, /element\.addEventListener\("pointerdown"[\s\S]*this\.activateInlineEditable\(element, false\)/);
  assert.match(styles, /\.mms-article-document-title-text:empty::before/);
  assert.match(styles, /\.mms-article-document-title-text\s*\{[\s\S]*display:\s*inline-block[\s\S]*min-width:\s*4em[\s\S]*min-height:\s*1\.2em/);
});

test("Enter commits an article title without creating a duplicate child block", () => {
  const makeInlineEditable = editorSource.match(/private makeInlineEditable\(element: HTMLElement, node: MindMapNode, placeholder: string, blockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const handleKeydown = editorSource.match(/private handleKeydown\(event: KeyboardEvent\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(makeInlineEditable, /if \(event\.key === "Enter"\) \{[\s\S]*event\.preventDefault\(\)[\s\S]*event\.stopPropagation\(\)[\s\S]*event\.stopImmediatePropagation\(\)[\s\S]*element\.blur\(\)/);
  assert.match(handleKeydown, /if \(this\.inlineEditingId !== null\) return;[\s\S]*if \(target\.closest\("input, textarea, select, \[contenteditable='true'\]"\)\) return/);
});

test("article tables open on double click and persist bounded column widths", () => {
  const node = {
    id: "root",
    text: "表格",
    content: [{
      id: "table-1",
      type: "table",
      table: {
        headers: ["A", "B", "C"],
        rows: [["1", "2", "3"]],
        columnWidths: [20, 2000, Number.NaN]
      }
    }],
    children: []
  };
  assert.deepEqual(model.nodeContentBlocks(node)[0].table.columnWidths, [64, 1200, 160]);
  assert.match(rendererSource, /wrap\.addEventListener\("dblclick"[\s\S]*options\.editTableBlock\(node, tableData, blockId\)/);
  assert.match(rendererSource, /cls: "mms-table-column-resizer"/);
  assert.match(rendererSource, /Math\.max\(64, Math\.min\(1200,[\s\S]*options\.updateTableColumnWidths\(node, blockId, widths\)/);
  assert.match(editorSource, /private updateTableColumnWidths\([\s\S]*columnWidths[\s\S]*this\.upsertStructuredBlock\(node, "table", \{ \.\.\.block\.table, columnWidths \}, blockId\)/);
  assert.match(styles, /\.mms-table-column-resizer[\s\S]*cursor:\s*col-resize/);
});

test("paragraph indentation is normalized, rendered, and toggled per text block", () => {
  const node = {
    id: "root",
    text: "第一段",
    content: [{ id: "text-1", type: "text", text: "第一段", paragraphIndent: "none" }],
    children: []
  };
  assert.equal(model.nodeContentBlocks(node)[0].paragraphIndent, "none");

  const invalid = {
    ...node,
    content: [{ id: "text-1", type: "text", text: "第一段", paragraphIndent: "unexpected" }]
  };
  assert.equal(model.nodeContentBlocks(invalid)[0].paragraphIndent, undefined);
  assert.match(rendererSource, /block\?\.paragraphIndent === "none" \? " is-flush" : ""/);
  assert.match(editorSource, /段落缩进：恢复首行两格[\s\S]*段落缩进：设为顶格/);
  assert.match(editorSource, /block\.paragraphIndent = block\.paragraphIndent === "none" \? undefined : "none"/);
  assert.match(styles, /\.mms-article-leaf-text\.is-flush,[\s\S]*\.mms-article-paragraph\.is-flush[\s\S]*text-indent:\s*0/);
});

test("compiled plugin contains exact block insertion and paragraph indentation routing", () => {
  assert.match(mainBundle, /insertTextBlockAfter/);
  assert.match(mainBundle, /articleParagraphClass[\s\S]*paragraphIndent/);
  assert.match(mainBundle, /\\u5728\\u6B64\\u5757\\u540E\\u63D2\\u5165\\u6587\\u5B57/);
  assert.match(mainBundle, /\\u6BB5\\u843D\\u7F29\\u8FDB/);
  assert.match(mainBundle, /mms-table-column-resizer/);
  assert.match(mainBundle, /updateTableColumnWidths/);
});
