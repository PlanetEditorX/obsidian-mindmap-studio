import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let modelSource;
let editorSource;
let outlineSource;
let articleSource;
let stylesSource;

before(async () => {
  [modelSource, editorSource, outlineSource, articleSource, stylesSource] = await Promise.all([
    readFile("src/core/model.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/outline-renderer.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("styles.css", "utf8")
  ]);
});

test("image preview uses a screen-shaped stage without scrollbars", () => {
  assert.match(stylesSource, /\.mmc-image-preview-modal \{[\s\S]*--modal-width: min\(98vw, 1800px\)[\s\S]*--modal-height: min\(94vh, 1080px\)/);
  assert.match(stylesSource, /\.mmc-image-preview-modal \{[\s\S]*width: min\(98vw, 1800px\) !important[\s\S]*height: min\(94vh, 1080px\) !important/);
  assert.match(stylesSource, /\.mmc-image-preview-modal \.modal-content \{[\s\S]*overflow: hidden/);
  assert.match(stylesSource, /\.mmc-image-preview-stage \{[\s\S]*aspect-ratio: 16 \/ 9;[\s\S]*overflow: hidden/);
});

test("image alignment persists only for supported values", () => {
  assert.match(modelSource, /align\?: "left" \| "center" \| "right"/);
  assert.match(modelSource, /const align = image\.align === "left" \|\| image\.align === "center" \|\| image\.align === "right"[\s\S]*: undefined/);
  assert.match(modelSource, /return \{ id, type: "image", source, alt, align, width, height/);
});

test("image context menu exposes layout, sizing, upload and edit actions", () => {
  assert.match(editorSource, /setTitle\("左对齐"\)[\s\S]*setImageBlockAlignment/);
  assert.match(editorSource, /setTitle\("中尺寸（360px）"\)[\s\S]*setImageBlockWidth/);
  assert.match(editorSource, /setTitle\("上传到图床"\)[\s\S]*uploadImageBlock/);
  assert.match(editorSource, /setTitle\("自定义尺寸或替换图片…"\)[\s\S]*editImageBlock\(blockId\)/);
  assert.match(editorSource, /setTitle\("删除当前块"\)[\s\S]*removeImageBlock/);
  assert.match(editorSource, /private updateImageBlock\([\s\S]*replaceNodeContentBlocks\(node, blocks\)/);
  assert.match(editorSource, /private async uploadImageBlock[\s\S]*replaceNodeContentBlocks\(node, blocks\)/);
  assert.match(editorSource, /wrap\.addClass\(`image-align-\$\{block\.align \?\? "center"\}`\)/);
  assert.match(outlineSource, /image-align-\$\{block\.align \?\? "center"\}/);
  assert.match(articleSource, /image-align-\$\{block\.align \?\? "center"\}/);
});

test("canvas context menu uploads all current-page images with one host selection", () => {
  assert.match(editorSource, /setTitle\("上传当前页面所有图片"\)[\s\S]*uploadAllPageImages/);
  assert.match(editorSource, /private async uploadAllPageImages\(\): Promise<void>/);
  assert.match(editorSource, /const hostIds = await chooseImageHosts\([\s\S]*getDefaultUploadHostIds\(\)/);
  assert.match(editorSource, /const missingHostIds = hostIds\.filter\(\(hostId\) => !existing\.has\(hostId\)\)/);
  assert.match(editorSource, /onUploadImage\(image\.blob, image\.suggestedName, missingHostIds\)/);
  assert.match(editorSource, /replaceNodeContentBlocks\(node, blocks\)/);
});

test("selection-only resize notifications do not repeatedly relayout the whole mind map", () => {
  assert.match(editorSource, /observedMindMapNodeSizes = new Map<string, \{ width: number; height: number \}>/);
  assert.match(editorSource, /let nodeSizeChanged = false;[\s\S]*Math\.abs\(previous\.width - next\.width\) > 0\.5[\s\S]*Math\.abs\(previous\.height - next\.height\) > 0\.5/);
  assert.match(editorSource, /if \(nodeSizeChanged\) \{\s*this\.scheduleMeasuredMindMapLayout\(\)/);
  assert.match(editorSource, /this\.observedMindMapNodeSizes\.set\(id, measured\.get\(id\)!\)/);
});
