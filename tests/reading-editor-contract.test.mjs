import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let editorSource;
let viewSource;
let mainSource;
let articleRendererSource;

before(async () => {
  editorSource = await readFile("src/editor/editor.ts", "utf8");
  viewSource = await readFile("src/view.ts", "utf8");
  mainSource = await readFile("src/main.ts", "utf8");
  articleRendererSource = await readFile("src/editor/article-renderer.ts", "utf8");
});

test("continuous reading exposes semantic anchors for directory-only parent nodes", () => {
  assert.match(editorSource, /item\.dataset\.filePath = entry\.filePath/);
  assert.match(editorSource, /item\.dataset\.nodeId = entry\.nodeId/);
  assert.match(editorSource, /mms-reading-location-anchor/);
  assert.match(editorSource, /mountAnchor\.dataset\.filePath = section\.parentFilePath/);
  assert.match(editorSource, /mountAnchor\.dataset\.nodeId = section\.parentNodeId/);
});

test("switching article families flushes the previous delayed write before replacing options", () => {
  assert.match(editorSource, /const readingFamilyChanged = previousOptions\.readingHomePath !== options\.readingHomePath/);
  assert.match(editorSource, /onReadingLocationChange\(previousOptions\.readingHomePath, this\.lastReadingLocation\)/);
  assert.match(editorSource, /this\.lastReadingLocation = options\.readingLocation/);
});

test("pending local progress is not replaced by stale option refreshes", () => {
  assert.match(editorSource, /this\.readingLocationTimer === null[\s\S]*!sameReadingLocation\(this\.lastReadingLocation, options\.readingLocation\)/);
});

test("document mutations preserve the current article or reading anchor across a redraw", () => {
  const mutate = editorSource.match(/private mutate\(action: \(\) => void, restoreLocation\?: ReadingLocation \| null\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(mutate, /const location = restoreLocation \?\? \(this\.currentMode === "mindmap" \? null : this\.captureCurrentLocation\(this\.currentMode\)\)/);
  assert.match(mutate, /if \(location\) this\.rememberLocation\(location, true\)/);
  assert.match(mutate, /this\.render\(\);[\s\S]*if \(location\) this\.restoreReadingLocation\(this\.currentMode, location\)/);
});

test("article option refresh restores the rendered anchor after rebuilding the page", () => {
  const setOptions = editorSource.match(/setOptions\(options: MindMapEditorOptions\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(setOptions, /const renderedLocation = this\.currentMode === "mindmap"[\s\S]*this\.captureCurrentLocation\(this\.currentMode\) \?\? this\.lastReadingLocation/);
  assert.match(setOptions, /const locationToRestore = this\.currentMode === "mindmap" && !modeChanged[\s\S]*renderedLocation \?\? this\.lastReadingLocation/);
  assert.match(setOptions, /locationToRestore[\s\S]*this\.restoreReadingLocation\(this\.currentMode, locationToRestore\)/);
});

test("mind-map option refresh does not reopen ancestors after collapse-all", () => {
  const setOptions = editorSource.match(/setOptions\(options: MindMapEditorOptions\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(setOptions, /this\.currentMode === "mindmap" && !modeChanged\s*\? null/);
  assert.doesNotMatch(setOptions, /this\.restoreReadingLocation\(this\.currentMode, renderedLocation \?\? this\.lastReadingLocation\)/);
});

test("screenshot shortcut remains available while an article line is being edited", () => {
  const keydown = editorSource.match(/private handleKeydown\(event: KeyboardEvent\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(keydown, /this\.shortcutMatches\(event, this\.options\.screenshotShortcut\)[\s\S]*if \(this\.inlineEditingId !== null\) return/);
});

test("global mode broadcasts discard delayed writes from non-initiating views", () => {
  const applyGlobal = editorSource.match(/applyGlobalDisplayMode\(mode: DisplayMode\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(applyGlobal, /clearTimeout\(this\.readingCaptureTimer\)/);
  assert.match(applyGlobal, /clearTimeout\(this\.readingLocationTimer\)/);
  assert.match(applyGlobal, /this\.setDisplayMode\(mode, false, false\)/);
});

test("global search keeps Ctrl/Cmd+Shift+F while map-family search uses Ctrl/Cmd+Alt+F", () => {
  const keydown = editorSource.match(/private handleKeydown\(event: KeyboardEvent\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(keydown, /mod && event\.altKey && findKey && !event\.shiftKey/);
  assert.doesNotMatch(keydown, /mod && event\.shiftKey && findKey && !event\.altKey/);
  assert.match(editorSource, /搜索当前导图及全部子导图（Ctrl\/Cmd\+Alt\+F）/);
});

test("programmatic scroll restoration cannot feed back into reading capture", () => {
  assert.match(editorSource, /private readingCaptureBlocked = false/);
  assert.match(editorSource, /private blockReadingLocationCapture\(\): void/);
  assert.match(editorSource, /if \(this\.readingCaptureBlocked\) return;[\s\S]*scheduleReadingLocationCapture/);
  assert.match(editorSource, /if \(mode !== "mindmap"\) this\.blockReadingLocationCapture\(\)/);
});

test("node clicks preserve their current viewport anchor instead of forcing 35 percent", () => {
  assert.match(editorSource, /private createSelectionLocation\(id: string\): ReadingLocation/);
  assert.match(editorSource, /viewportAnchorRatio\(target\.rect\.top, target\.rect\.height, viewport\.top, viewport\.height/);
  assert.doesNotMatch(editorSource, /this\.rememberLocation\(createReadingLocation\([\s\S]{0,180}this\.currentMode === "mindmap" \? 0\.5 : 0\.35[\s\S]{0,60}\)\);/);
});

test("explicit child-map navigation wins over stale cross-file progress", () => {
  assert.match(viewSource, /markExplicitNavigation\(focusNodeId\?: string\): void/);
  assert.match(viewSource, /preferCurrentFileOnNextContextRefresh/);
  assert.match(viewSource, /this\.editor\?\.setOptions\(this\.getEditorOptions\(preferCurrentFile\)\)/);
  assert.match(mainSource, /leaf\.view\.markExplicitNavigation\(focusNodeId\)/);
  assert.match(editorSource, /options\.preferCurrentFileLocation[\s\S]*preferredCurrentLocation/);
});


test("inline editing activates and releases through the shared path", () => {
  const makeInlineEditable = editorSource.match(/private makeInlineEditable\(element: HTMLElement, node: MindMapNode, placeholder: string, blockId\?: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const activateInlineEditable = editorSource.match(/private activateInlineEditable\(element: HTMLElement, focus = true, protectInitialFocus = false\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(makeInlineEditable, /element\.addEventListener\("pointerdown"[\s\S]*this\.activateInlineEditable\(element, false\)/);
  assert.match(activateInlineEditable, /element\.contentEditable = "true"[\s\S]*this\.applyInlineEditingAccessibility\(element\)/);
  assert.match(makeInlineEditable, /element\.addEventListener\("blur"[\s\S]*element\.contentEditable = "false"[\s\S]*this\.clearInlineEditingAccessibility\(element\)/);
  assert.match(editorSource, /if \(this\.inlineEditingId && !modesChanged && !toolbarChanged && !globalModeChanged\) return;/, "article-context refreshes must not replace an active inline editor");
});

test("new-node inline editing ignores the initiating Enter keyup", () => {
  const inlineEdit = editorSource.match(/private beginInlineEdit\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(inlineEdit, /if \(initialFocusProtected \|\| document\.activeElement !== editor\) return/);
  assert.match(inlineEdit, /window\.requestAnimationFrame\(focusAtEnd\)[\s\S]*initialFocusProtected = false/);
});

test("Space starts inline editing for the selected editable mind-map node", () => {
  const keydown = editorSource.match(/private handleKeydown\(event: KeyboardEvent\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(keydown, /case " ":[\s\S]*if \(this\.selectedNode\(\)\) this\.beginInlineEdit\(this\.selectedId\)/);
});

test("rich-text links render as anchors and do not navigate while editing", async () => {
  const richTextDomSource = await readFile("src/editor/rich-text-dom.ts", "utf8");
  assert.match(richTextDomSource, /container\.createEl\("a", \{[\s\S]*href: style\.link/);
  assert.match(richTextDomSource, /container\.contentEditable === "true"[\s\S]*event\.preventDefault\(\)/);
  assert.match(richTextDomSource, /if \(tag === "a"\) style\.link = element\.getAttribute\("href"\)/);
});

test("article and outline text do not expose edit labels as hover tooltips", () => {
  const makeInlineEditable = editorSource.match(/private makeInlineEditable\([\s\S]*?\n  \}/)?.[0] ?? "";
  const activateInlineEditable = editorSource.match(/private activateInlineEditable\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(makeInlineEditable, /element\.dataset\.mmsEditLabel = placeholder/);
  assert.doesNotMatch(makeInlineEditable, /element\.setAttr\("aria-label", placeholder\)/);
  assert.match(editorSource, /private applyInlineEditingAccessibility\(element: HTMLElement\): void/);
  assert.match(editorSource, /element\.setAttr\("aria-label", element\.dataset\.mmsEditLabel \?\? "编辑文字"\)/);
  assert.match(editorSource, /private clearInlineEditingAccessibility\(element: HTMLElement\): void[\s\S]*element\.removeAttribute\("aria-label"\)/);
  assert.match(activateInlineEditable, /this\.applyInlineEditingAccessibility\(element\)/);
});

test("article code blocks enter direct editing on double click", () => {
  const codeRendering = articleRendererSource.match(/const shell = createArticleContentBlock\(container, block\.id, true\);\s*const code = shell\.createDiv\(\{ cls: "mms-article-code markdown-rendered" \}\);[\s\S]*?\n    \}/)?.[0] ?? "";
  assert.match(codeRendering, /code\.addEventListener\("dblclick"[\s\S]*makeInlineCodeEditable\(code, node, block\.code, block\.id\)/);
  assert.doesNotMatch(codeRendering, /if \(!options\.readOnly\)/, "the listener must survive switching from reading to edit mode without a redraw");
  assert.match(editorSource, /private makeInlineCodeEditable\(element: HTMLElement, node: MindMapNode, code: MindMapCodeBlock, blockId: string\): void/);
  assert.match(editorSource, /const showLineNumbers = Boolean\(element\.querySelector\("\.mms-code-line-numbers"\)\)/);
  assert.match(editorSource, /attr: \{ spellcheck: "false", wrap: "off", "aria-label": "编辑代码" \}/);
  assert.match(editorSource, /editor\.rows = Math\.max\(4, lineCount\)/);
  assert.match(editorSource, /gutter\.setText\(showLineNumbers \? buildCodeLineNumberText\(lineCount\) : ""\)/);
  assert.match(editorSource, /const syncGutterScroll = \(\): void => \{ gutter\.scrollTop = editor\.scrollTop; \}/);
  assert.match(editorSource, /editor\.addEventListener\("scroll", syncGutterScroll\)/);
  assert.match(editorSource, /editor\.addEventListener\("blur", \(\) => finish\(true\)\)/);
  assert.match(editorSource, /event\.key === "Escape"[\s\S]*finish\(false\)/);
});

test("article image paste commits the active paragraph and inserts after its content block", () => {
  const paste = editorSource.match(/private async handlePaste\(event: ClipboardEvent\): Promise<void> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(paste, /const targetBlock = target\.closest<HTMLElement>\("\[data-block-id\]"\)/);
  assert.match(paste, /if \(target\.closest\("\[contenteditable='true'\]"\)\) target\.blur\(\)/);
  assert.match(paste, /const afterIndex = afterBlockId \? blocks\.findIndex\(\(block\) => block\.id === afterBlockId\) : -1;/);
  assert.match(paste, /blocks\.splice\(afterIndex >= 0 \? afterIndex \+ 1 : blocks\.length, 0, imageBlock\)/);
});

test("deleting an article node restores the closest surviving sibling instead of the page top", () => {
  const directDelete = editorSource.match(/private deleteNodeById\(nodeId: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(directDelete, /const restoreLocation = this\.currentMode === "mindmap" \? null : this\.createSelectionLocation\(fallback\)/);
  assert.match(directDelete, /\}, restoreLocation\);/);
  const mutate = editorSource.match(/private mutate\(action: \(\) => void, restoreLocation\?: ReadingLocation \| null\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(mutate, /const location = restoreLocation \?\? \(this\.currentMode === "mindmap" \? null : this\.captureCurrentLocation\(this\.currentMode\)\)/);
});

test("structural mind-map changes use a reduced-motion-aware FLIP layout transition", () => {
  assert.match(editorSource, /private requestMindMapLayoutAnimation\(\): void/);
  assert.match(editorSource, /private captureMindMapNodeRects\(\): Map<string, DOMRect>/);
  assert.match(editorSource, /private playMindMapLayoutAnimation\(previousNodeRects: ReadonlyMap<string, DOMRect>\): void/);
  assert.match(editorSource, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/);
  assert.match(editorSource, /this\.requestMindMapLayoutAnimation\(\);[\s\S]{0,220}selected\.collapsed = !selected\.collapsed/);
  assert.match(editorSource, /this\.requestMindMapLayoutAnimation\(\);[\s\S]{0,160}this\.render\(\);/);
  assert.match(editorSource, /this\.applyMeasuredMindMapLayout\(\);[\s\S]{0,120}this\.playMindMapLayoutAnimation\(previousNodeRects\)/);
});

test("collapse-all ignores rapid duplicate toggles and smoothly preserves the current viewport", () => {
  const toggleAll = editorSource.match(/private toggleAllNodesCollapsed\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const setAll = editorSource.match(/private setAllNodesCollapsed\(collapsed: boolean\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(toggleAll, /if \(this\.allNodesCollapseToggleTimer !== null\) return/);
  assert.match(toggleAll, /window\.setTimeout\([\s\S]*260\)/);
  assert.match(setAll, /if \(!branches\.some\(\(node\) => node\.collapsed !== collapsed\)\) return/);
  assert.match(setAll, /this\.requestMindMapLayoutAnimation\(\)/);
  assert.doesNotMatch(setAll, /positionCollapsedMindMapRoot\(\)/);
  assert.match(editorSource, /private playMindMapLayoutAnimation\(previousNodeRects: ReadonlyMap<string, DOMRect>\)/);
});
