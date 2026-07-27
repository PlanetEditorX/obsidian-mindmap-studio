import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let editorSource;
let viewSource;
let mainSource;

before(async () => {
  editorSource = await readFile("src/editor/editor.ts", "utf8");
  viewSource = await readFile("src/view.ts", "utf8");
  mainSource = await readFile("src/main.ts", "utf8");
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

test("global mode broadcasts discard delayed writes from non-initiating views", () => {
  const applyGlobal = editorSource.match(/applyGlobalDisplayMode\(mode: DisplayMode\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(applyGlobal, /clearTimeout\(this\.readingCaptureTimer\)/);
  assert.match(applyGlobal, /clearTimeout\(this\.readingLocationTimer\)/);
  assert.match(applyGlobal, /this\.setDisplayMode\(mode, false, false\)/);
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
