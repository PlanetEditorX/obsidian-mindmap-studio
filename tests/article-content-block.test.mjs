import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { loadTypeScriptModule, loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let cleanup;
let interactionCleanup;
let tableInteraction;
let editorSource;
let rendererSource;
let styles;
let mainBundle;

before(async () => {
  const [loaded, interaction] = await Promise.all([
    loadTypeScriptModules([
      "src/core/node-tree.ts",
      "src/core/model.ts"
    ], "src/core/model.ts"),
    loadTypeScriptModule("src/editor/table-interaction.ts")
  ]);
  model = loaded.module;
  cleanup = loaded.cleanup;
  tableInteraction = interaction.module;
  interactionCleanup = interaction.cleanup;
  [editorSource, rendererSource, styles, mainBundle] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("styles.css", "utf8"),
    readFile("main.js", "utf8")
  ]);
});

after(async () => {
  await cleanup?.();
  await interactionCleanup?.();
});

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
  const updateNodeTextBlock = editorSource.match(/private updateNodeTextBlock\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(editorSource, /private makeInlineEditable\(element: HTMLElement, node: MindMapNode, placeholder: string, blockId\?: string\)/);
  assert.match(editorSource, /block\.type === "text" && block\.id === blockId/);
  assert.match(editorSource, /this\.updateNodeTextBlock\(node, next, blockId\)/);
  assert.match(updateNodeTextBlock, /exactTextBlock \?\? \([\s\S]*blockId && !node\.content\?\.length[\s\S]*blocks\.find/);
  assert.match(updateNodeTextBlock, /replaceNodeContentBlocks\(node, blocks\.filter\(\(block\) => block\.type !== "text" \|\| block\.text\.trim\(\)\)\)/);
  assert.match(rendererSource, /paragraph\.dataset\.blockId = block\.id/);
  assert.match(makeInlineEditable, /element\.addEventListener\("pointerdown"[\s\S]*this\.inlineEditingId = node\.id[\s\S]*this\.activateInlineEditable\(element, false\)/);
  assert.match(makeInlineEditable, /element\.addEventListener\("focus"[\s\S]*this\.inlineEditingId = node\.id/);
  assert.match(makeInlineEditable, /element\.dataset\.mmsProtectInitialFocus === "true"[\s\S]*window\.requestAnimationFrame\(\(\) => this\.activateInlineEditable\(element\)\)/);
  assert.match(makeInlineEditable, /if \(this\.inlineEditingId === node\.id\) this\.inlineEditingId = null/);
});

test("clearing the final article text block clears legacy mirrors instead of restoring stale text", () => {
  const node = model.createNode("待删除文字");
  const blocks = model.nodeContentBlocks(node).map((block) => block.type === "text" ? { ...block, text: "" } : block)
    .filter((block) => block.type !== "text" || block.text.trim());
  model.replaceNodeContentBlocks(node, blocks);
  assert.equal(node.text, "");
  assert.equal(node.content, undefined);
  assert.deepEqual(model.nodeContentBlocks(node), []);
});

test("Markdown import persists stable text-block IDs before article editing", () => {
  const document = model.markdownToDocument("# 第一章 教程");
  const persisted = document.root.content?.[0];
  assert.equal(persisted?.type, "text");
  assert.equal(persisted?.text, "第一章 教程");
  assert.equal(model.nodeContentBlocks(document.root)[0]?.id, persisted?.id);
});

test("empty article document title keeps a clickable inline-edit target after blur", () => {
  assert.match(rendererSource, /options\.makeInlineEditable\(titleText, options\.document\.root, "文章标题", rootTextBlock\?\.id\)/);
  assert.match(editorSource, /element\.addEventListener\("pointerdown"[\s\S]*this\.activateInlineEditable\(element, false\)/);
  assert.match(styles, /\.mms-article-document-title-text:empty::before/);
  assert.match(styles, /\.mms-article-document-title-text\s*\{[\s\S]*display:\s*inline-block[\s\S]*min-width:\s*4em[\s\S]*min-height:\s*1\.2em/);
});

test("article document title opens AI with the current-page scope", () => {
  const openAiScopeContextMenu = editorSource.match(/private openAiScopeContextMenu\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(rendererSource, /title\.addEventListener\("contextmenu", \(event\) => \{[\s\S]*options\.openAiContextMenu\(event, options\.document\.root\.id\)/);
  assert.match(openAiScopeContextMenu, /nodeId !== this\.document\.root\.id[\s\S]*\? nodeId : null/);
  assert.match(openAiScopeContextMenu, /询问 AI（当前页面）/);
});

test("terminal body marker and alignment stay independently configurable", async () => {
  const [settingsSource, viewSource, modalSource] = await Promise.all([
    readFile("src/settings.ts", "utf8"),
    readFile("src/view.ts", "utf8"),
    readFile("src/editor/editor-modals.ts", "utf8")
  ]);
  assert.match(settingsSource, /setName\("末端正文标识"\)/);
  assert.match(settingsSource, /setName\("末端正文对齐方式"\)[\s\S]*addOption\("flush", "顶格"\)[\s\S]*addOption\("auto", "自动（与上级标题对齐）"\)/);
  assert.match(viewSource, /document\?\.articleStyle\?\.leafMarkerEnabled \?\? this\.plugin\.settings\.articleLeafBulletsEnabled/);
  assert.match(viewSource, /document\?\.articleStyle\?\.leafTextAlignment \?\? this\.plugin\.settings\.articleLeafTextAlignment/);
  assert.match(modalSource, /text: "末端正文标识"[\s\S]*text: "末端正文对齐方式"/);
  assert.match(rendererSource, /is-auto-aligned/);
  assert.match(styles, /\.mms-article-leaf-text\.is-auto-aligned\s*\{[\s\S]*margin-inline-start:\s*1\.25em[\s\S]*text-indent:\s*1\.25em/);
  assert.match(styles, /\.mms-article-leaf-text\.is-auto-aligned\.is-bulleted\s*\{[\s\S]*text-indent:\s*0/);
});

test("terminal body siblings can switch to the next article numbering level", async () => {
  const [settingsSource, viewSource, modesSource, rendererSource, editorSource] = await Promise.all([
    readFile("src/settings.ts", "utf8"),
    readFile("src/view.ts", "utf8"),
    readFile("src/article/modes.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8")
  ]);
  assert.match(settingsSource, /articleLeafNumberingEnabled: boolean/);
  assert.match(settingsSource, /articleLeafNumberingThreshold: number/);
  assert.match(settingsSource, /setName\("末端正文标识转序号"\)[\s\S]*setName\("末端正文序号样式"\)[\s\S]*带圈数字（统一圆圈，支持 51\+）[\s\S]*setName\("末端正文转序号阈值"\)/);
  assert.match(viewSource, /document\?\.articleStyle\?\.leafNumberingEnabled \?\? this\.plugin\.settings\.articleLeafNumberingEnabled/);
  assert.match(viewSource, /document\?\.articleStyle\?\.leafNumberingStyle \?\? this\.plugin\.settings\.articleLeafNumberingStyle/);
  assert.match(modesSource, /for \(const child of parent\.children\) \{[\s\S]*else if \(child\.articleNumberingMode !== "none"\) terminalCount \+= 1/);
  assert.match(modesSource, /numberedLeaf/);
  assert.match(modesSource, /const displayLevel = numberedLeaf \? defaultLevel : numbering\.level/);
  assert.match(modesSource, /circledNumberLabel\(numberedIndex\)/);
  assert.match(modesSource, /articleNumberLabel\(displayLevel, numberedIndex\)/);
  assert.match(rendererSource, /info\.leafNumberingStyle === "circled"[\s\S]*String\(info\.leafNumberingIndex \?\? 1\)[\s\S]*: info\.label/);
  assert.match(rendererSource, /paragraph\.dataset\.articleNumberStyle = info\.leafNumberingStyle/);
  assert.match(editorSource, /buildArticleNodeInfo\(section\.document\.root, section\.baseDepth, \{ enabled: this\.options\.articleLeafNumberingEnabled, threshold: this\.options\.articleLeafNumberingThreshold, style: this\.options\.articleLeafNumberingStyle \}\)/);
  assert.match(editorSource, /info\.leafNumberingStyle === "circled"[\s\S]*String\(info\.leafNumberingIndex \?\? 1\)[\s\S]*: info\.label/);
  assert.doesNotMatch(editorSource, /articleNumberFallback/);
  assert.match(styles, /\.mms-article-leaf-text\.mms-article-leaf-numbered\s*\{[\s\S]*margin-inline-start:\s*0/);
  assert.match(styles, /\.mms-article-leaf-text\.mms-article-leaf-numbered::before\s*\{[\s\S]*content:\s*attr\(data-article-number\)/);
  assert.match(styles, /data-article-number-style="circled"\]\s*\{[\s\S]*padding-inline-start:\s*1\.9em/);
  assert.match(styles, /data-article-number-style="circled"\]\.is-auto-aligned\s*\{[\s\S]*width:\s*calc\(100% - 1\.25em\)[\s\S]*margin-inline-start:\s*1\.25em[\s\S]*padding-inline-start:\s*1\.25em/);
  assert.match(styles, /data-article-number-style="circled"\]::before\s*\{[\s\S]*position:\s*absolute[\s\S]*top:\s*\.39em[\s\S]*min-width:\s*1\.34em[\s\S]*height:\s*1\.34em[\s\S]*font-family:\s*inherit[\s\S]*font-size:\s*\.86em[\s\S]*font-variant-numeric:\s*tabular-nums/);
  assert.match(styles, /data-article-number-style="circled"\]\.is-auto-aligned::before\s*\{[\s\S]*inset-inline-start:\s*-\.13em/);
  assert.doesNotMatch(styles, /Segoe UI Symbol|data-article-number-fallback/);
});

test("quick editing moves only the circled marker with the editor block padding", () => {
  const rule = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return styles.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? "";
  };
  const marker = rule('.mms-article-leaf-text.mms-article-leaf-numbered[data-article-number-style="circled"].is-inline-editing::before');
  const blockPadding = Number(styles.match(/\.mms-article-leaf-text\.is-inline-editing,[\s\S]*?padding:\s*(\d+)px\s+\d+px/)?.[1]);
  const markerShift = Number(marker.match(/top:\s*calc\(\.39em \+ (\d+)px\)/)?.[1]);
  assert.equal(markerShift, blockPadding, "quick edit should offset only the marker by the existing block padding");
  assert.doesNotMatch(marker, /padding|margin|inset-inline-start/, "the quick-edit correction must not move or resize the body editor");
});

test("auto-aligned circled numbers align body text and keep a readable marker gap", () => {
  const rule = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return styles.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? "";
  };
  const em = (body, property) => Number(body.match(new RegExp(`${property}:\\s*(-?\\d*\\.?\\d+)em`))?.[1]);
  const bullet = rule(".mms-article-leaf-text.is-bulleted");
  const auto = rule(".mms-article-leaf-text.is-auto-aligned");
  const bulletBefore = rule(".mms-article-leaf-text.is-bulleted::before");
  const circledAuto = rule('.mms-article-leaf-text.mms-article-leaf-numbered[data-article-number-style="circled"].is-auto-aligned');
  const circledBefore = rule('.mms-article-leaf-text.mms-article-leaf-numbered[data-article-number-style="circled"]::before');
  const circledAutoBefore = rule('.mms-article-leaf-text.mms-article-leaf-numbered[data-article-number-style="circled"].is-auto-aligned::before');
  const bulletTextStart = em(auto, "margin-inline-start") + em(bullet, "padding-left");
  const circledTextStart = em(circledAuto, "margin-inline-start") + em(circledAuto, "padding-inline-start");
  const bulletCenter = em(auto, "margin-inline-start") + em(bulletBefore, "left") + em(bulletBefore, "width") / 2;
  const circledWidth = em(circledBefore, "min-width") * em(circledBefore, "font-size");
  const circledCenter = em(circledAuto, "margin-inline-start")
    + em(circledAutoBefore, "inset-inline-start")
    + circledWidth / 2;
  const circledTextGap = circledTextStart - (
    em(circledAuto, "margin-inline-start")
    + em(circledAutoBefore, "inset-inline-start")
    + circledWidth
  );
  assert.equal(circledTextStart, bulletTextStart);
  assert.ok(bulletCenter > circledCenter, "the wider circled marker should sit slightly left of the bullet center");
  assert.ok(bulletCenter - circledCenter <= 0.15, `marker columns differ by ${bulletCenter - circledCenter}em`);
  assert.ok(circledTextGap >= 0.18, `circled marker gap is only ${circledTextGap}em`);
});

test("Enter commits an article title while Shift+Enter keeps an inline line break", () => {
  const makeInlineEditable = editorSource.match(/private makeInlineEditable\(element: HTMLElement, node: MindMapNode, placeholder: string, blockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const handleKeydown = editorSource.match(/private handleKeydown\(event: KeyboardEvent\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(makeInlineEditable, /if \(event\.key === "Enter" && !event\.shiftKey && !event\.isComposing\) \{[\s\S]*event\.preventDefault\(\)[\s\S]*event\.stopPropagation\(\)[\s\S]*event\.stopImmediatePropagation\(\)[\s\S]*element\.blur\(\)/);
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
  assert.match(rendererSource, /bindTableDoubleClick\(table,[\s\S]*isReadOnly: options\.isReadOnly[\s\S]*options\.editTableBlock\(node, tableData, blockId\)/);
  assert.match(rendererSource, /bindTableColumnResize\(handle,[\s\S]*isReadOnly: options\.isReadOnly[\s\S]*options\.updateTableColumnWidths\(node, blockId, widths\)/);
  assert.match(rendererSource, /cls: "mms-table-column-resizer"/);
  assert.match(editorSource, /private updateTableColumnWidths\([\s\S]*columnWidths[\s\S]*this\.upsertStructuredBlock\(node, "table", \{ \.\.\.block\.table, columnWidths \}, blockId\)/);
  assert.match(styles, /\.mms-table-column-resizer[\s\S]*cursor:\s*col-resize/);
});

test("mind-map tables open their editor only on double click", () => {
  const renderNodeTable = editorSource.match(/private renderNodeTable\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(renderNodeTable, /wrap\.addEventListener\("click", \(event\) => event\.stopPropagation\(\)\)/);
  assert.match(renderNodeTable, /wrap\.addEventListener\("dblclick", \(event\) => \{[\s\S]*event\.preventDefault\(\)[\s\S]*this\.openTableBlockEditor\(node, tableData, blockId\)/);
  assert.match(mainBundle, /mmc-node-table-wrap/);
});

test("table interactions follow the live lock state and commit pointer resizing", () => {
  const tableTarget = new EventTarget();
  let readOnly = true;
  let editCount = 0;
  tableInteraction.bindTableDoubleClick(tableTarget, {
    isReadOnly: () => readOnly,
    isResizeTarget: () => false,
    edit: () => { editCount += 1; }
  });
  tableTarget.dispatchEvent(new Event("dblclick", { bubbles: true, cancelable: true }));
  assert.equal(editCount, 0);
  readOnly = false;
  const editEvent = new Event("dblclick", { bubbles: true, cancelable: true });
  tableTarget.dispatchEvent(editEvent);
  assert.equal(editCount, 1);
  assert.equal(editEvent.defaultPrevented, true);

  const handle = new EventTarget();
  handle.setPointerCapture = () => undefined;
  const pointerTarget = new EventTarget();
  const applied = [];
  let committed;
  const pointerEvent = (type, clientX) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, {
      button: { value: 0 },
      clientX: { value: clientX },
      pointerId: { value: 1 }
    });
    return event;
  };
  tableInteraction.bindTableColumnResize(handle, {
    eventTarget: pointerTarget,
    isReadOnly: () => readOnly,
    columnIndex: 0,
    initialWidths: () => [100, 200],
    applyWidths: (widths) => applied.push([...widths]),
    setResizing: () => undefined,
    commitWidths: (widths) => { committed = [...widths]; }
  });
  handle.dispatchEvent(pointerEvent("pointerdown", 100));
  pointerTarget.dispatchEvent(pointerEvent("pointermove", 145));
  pointerTarget.dispatchEvent(pointerEvent("pointerup", 145));
  assert.deepEqual(applied.at(-1), [145, 200]);
  assert.deepEqual(committed, [145, 200]);
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

test("article non-text blocks align with the first glyph of indented paragraphs", () => {
  assert.match(rendererSource, /function createArticleContentBlock\([\s\S]*indentToParagraph = false/);
  assert.match(rendererSource, /mms-article-content-block\$\{indentToParagraph \? " is-paragraph-aligned" : ""\}/);
  assert.match(rendererSource, /block\.type === "image"[\s\S]*createArticleContentBlock\(inline \? inlineImageRow! : container, block\.id, !inline\)/);
  assert.match(rendererSource, /mms-article-image-row/);
  assert.match(rendererSource, /block\.type === "table"[\s\S]*createArticleContentBlock\(container, block\.id, true\)/);
  assert.match(rendererSource, /else \{\s*inlineImageRow = null;\s*const shell = createArticleContentBlock\(container, block\.id, true\)/);
  assert.match(styles, /\.mms-article-content-block\.is-paragraph-aligned\s*\{[\s\S]*width:\s*calc\(100% - 2em\);[\s\S]*margin-left:\s*2em/);
});

test("article numbering inherits the surrounding text metrics", () => {
  assert.match(styles, /\.mms-article-number\s*\{[^}]*font-family:\s*inherit;[^}]*font-size:\s*1em;[^}]*font-weight:\s*inherit;[^}]*line-height:\s*inherit/);
  assert.doesNotMatch(styles, /\.mms-article-number\s*\{[^}]*font-weight:\s*700/);
});


test("pasted images report storage, insertion, and auto-upload failures independently", () => {
  const handlePaste = editorSource.match(/private async handlePaste\(event: ClipboardEvent\): Promise<void> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const imagePasteBranch = handlePaste.split(/\n    if \(target\.closest\("input, textarea/)[0] ?? handlePaste;
  const recoverPostCommit = editorSource.match(/private recoverPastedImagePostCommit\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(handlePaste, /path = await this\.callbacks\.onSavePastedImage\(blob, filename\)[\s\S]*paste image storage failed/);
  assert.match(handlePaste, /const articleTargetAllowed = this\.currentMode === "article" \|\| this\.currentMode === "reading"/);
  assert.match(handlePaste, /const nodeId = articleTargetAllowed[\s\S]*targetNode\?\.dataset\.nodeId \?\? this\.activeArticleBlock\?\.nodeId \?\? this\.selectedId[\s\S]*: this\.selectedId/);
  assert.match(handlePaste, /const afterBlockId = articleTargetAllowed[\s\S]*: undefined/);
  assert.match(handlePaste, /const selected = nodeId \? findNode\(this\.document\.root, nodeId\) : null[\s\S]*粘贴开始时选择的节点已不存在/);
  assert.doesNotMatch(imagePasteBranch, /this\.selectedNode\(\) \?\? this\.document\.root/);
  assert.match(handlePaste, /this\.mutate\(\(\) => \{/);
  assert.match(handlePaste, /if \(!inserted\)[\s\S]*paste image insertion failed[\s\S]*图片文件已保存，但插入节点失败/);
  assert.match(handlePaste, /post-commit synchronization deferred[\s\S]*recoverPastedImagePostCommit\(\)[\s\S]*onScheduleAutoUpload/);
  assert.match(handlePaste, /onScheduleAutoUpload\(selected\.id, imageBlock\.id, path, filename\)[\s\S]*paste image auto-upload scheduling failed[\s\S]*图片已保存：\$\{path\}；自动上传排程失败/);
  assert.match(recoverPostCommit, /markSaving\(\)[\s\S]*render\(\)[\s\S]*window\.setTimeout\([\s\S]*callbacks\.onChange\(this\.getDocument\(\)\)/);
  assert.doesNotMatch(handlePaste, /new Notice\("粘贴图片失败"\)/);
  assert.doesNotMatch(handlePaste, /保存同步出现异常/);
  assert.match(mainBundle, /paste image storage failed[\s\S]*paste image insertion failed[\s\S]*post-commit synchronization deferred[\s\S]*paste image auto-upload scheduling failed/);
  assert.match(mainBundle, /paste image save synchronization retry failed/);
  assert.doesNotMatch(mainBundle, /Notice\("\\u7C98\\u8D34\\u56FE\\u7247\\u5931\\u8D25"\)/);
  assert.doesNotMatch(mainBundle, /\\u4FDD\\u5B58\\u540C\\u6B65\\u51FA\\u73B0\\u5F02\\u5E38/);
});

test("node editor accepts clipboard images and schedules them for the exact edited node", () => {
  const nodeModal = editorSource.slice(editorSource.indexOf("class NodeEditModal"), editorSource.indexOf("class AppearanceModal"));
  assert.match(nodeModal, /onScheduleAutoUpload/);
  assert.match(nodeModal, /text: "\+ 粘贴图片"/);
  assert.match(nodeModal, /text: "粘贴剪贴板图片"/);
  assert.match(nodeModal, /navigator\.clipboard\.read\(\)/);
  assert.match(nodeModal, /form\.addEventListener\("paste"[\s\S]*item\.type\.startsWith\("image\/"\)[\s\S]*savePastedImage/);
  assert.match(nodeModal, /path = await this\.callbacks\.onSavePastedImage\(blob, filename\)/);
  assert.match(nodeModal, /pendingAutoUploads\.set\(block\.id, \{ path, filename \}\)/);
  assert.match(nodeModal, /this\.callbacks\.onScheduleAutoUpload\(this\.node\.id, blockId, pending\.path, pending\.filename\)/);
  assert.match(mainBundle, /node modal paste image storage failed/);
  assert.match(mainBundle, /node modal paste image auto-upload scheduling failed/);
});

test("mind-map image paste ignores stale DOM focus and uses the live selection", () => {
  const handlePaste = editorSource.match(/private async handlePaste\(event: ClipboardEvent\): Promise<void> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(handlePaste, /const nodeId = articleTargetAllowed[\s\S]*: this\.selectedId/);
  assert.doesNotMatch(handlePaste, /const nodeId = targetNode\?\.dataset\.nodeId\s*\?\?/);
  assert.match(handlePaste, /const selected = nodeId \? findNode\(this\.document\.root, nodeId\) : null/);
});

test("table edits preserve the visible anchor before synchronous and measured relayout", () => {
  const openTableBlockEditor = editorSource.match(/private openTableBlockEditor\([\s\S]*?\n  \}/)?.[0] ?? "";
  const updateTableColumnWidths = editorSource.match(/private updateTableColumnWidths\([\s\S]*?\n  \}/)?.[0] ?? "";
  const applyMeasuredMindMapLayout = editorSource.match(/private applyMeasuredMindMapLayout\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const restoreReadingLocation = editorSource.match(/private restoreReadingLocation\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(openTableBlockEditor, /captureMindMapViewportAnchor\(node\.id\)[\s\S]*this\.mutate\([\s\S]*restoreMindMapViewportAnchor\(viewportAnchor\)/);
  assert.match(updateTableColumnWidths, /captureMindMapViewportAnchor\(node\.id\)[\s\S]*this\.mutate\([\s\S]*restoreMindMapViewportAnchor\(viewportAnchor\)/);
  assert.match(applyMeasuredMindMapLayout, /captureMindMapViewportAnchor\(this\.selectedId\)[\s\S]*renderMindMapEdges[\s\S]*restoreMindMapViewportAnchor\(viewportAnchor\)/);
  assert.match(restoreReadingLocation, /const restore = \(\): void => \{[\s\S]*\n    restore\(\);\n    window\.setTimeout\(restore, 20\)/);
  assert.match(mainBundle, /captureMindMapViewportAnchor\(this\.selectedId\)[\s\S]*renderMindMapEdges[\s\S]*restoreMindMapViewportAnchor\(viewportAnchor\)/);
  assert.match(mainBundle, /new TableEditModal[\s\S]*captureMindMapViewportAnchor\(node\.id\)[\s\S]*restoreMindMapViewportAnchor\(viewportAnchor\)/);
  assert.match(mainBundle, /restore\(\);\n    window\.setTimeout\(restore, 20\)/);
});
