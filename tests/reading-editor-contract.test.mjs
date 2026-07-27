import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let editorSource;

before(async () => {
  editorSource = await readFile("src/editor/editor.ts", "utf8");
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
