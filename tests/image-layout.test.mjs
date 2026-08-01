import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let modelSource;
let editorSource;
let outlineSource;
let articleSource;
let richEditorSource;
let mainSource;
let settingsSource;
let stylesSource;

before(async () => {
  [modelSource, editorSource, outlineSource, articleSource, richEditorSource, mainSource, settingsSource, stylesSource] = await Promise.all([
    readFile("src/core/model.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/outline-renderer.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/node-rich-text-editor.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/settings.ts", "utf8"),
    readFile("styles.css", "utf8")
  ]);
});

test("image preview uses a screen-shaped stage without scrollbars", () => {
  assert.match(stylesSource, /\.mmc-image-preview-modal \{[\s\S]*--modal-width: min\(86vw, 1400px\)[\s\S]*--modal-height: min\(82vh, 900px\)/);
  assert.match(stylesSource, /\.mmc-image-preview-modal \{[\s\S]*width: min\(86vw, 1400px\) !important[\s\S]*height: min\(82vh, 900px\) !important/);
  assert.match(stylesSource, /\.mmc-image-preview-modal \.modal-content \{[\s\S]*overflow: hidden/);
  assert.match(stylesSource, /\.mmc-image-preview-stage \{[\s\S]*aspect-ratio: 16 \/ 9;[\s\S]*overflow: hidden/);
});

test("image alignment persists only for supported values", () => {
  assert.match(modelSource, /align\?: "left" \| "center" \| "right"/);
  assert.match(modelSource, /const align = image\.align === "left" \|\| image\.align === "center" \|\| image\.align === "right"[\s\S]*: undefined/);
  assert.match(modelSource, /layout\?: "inline" \| "block"/);
  assert.match(modelSource, /contentHash\?: string/);
  assert.match(modelSource, /const layout = image\.layout === "inline"/);
  assert.match(modelSource, /return \{ id, type: "image", source, alt, align, width, height, layout, contentHash/);
});

test("image context menu exposes layout, sizing, upload and edit actions", () => {
  assert.match(editorSource, /setTitle\("左对齐"\)[\s\S]*setImageBlockAlignment/);
  assert.match(editorSource, /setTitle\("中尺寸（360px）"\)[\s\S]*setImageBlockWidth/);
  assert.match(editorSource, /setTitle\("上传到图床"\)[\s\S]*uploadImageBlock/);
  assert.match(editorSource, /setTitle\("自定义尺寸或替换图片…"\)[\s\S]*editImageBlock\(blockId\)/);
  assert.match(editorSource, /setTitle\("与相邻图片同行"\)[\s\S]*setImageBlockLayout/);
  assert.match(editorSource, /setTitle\("独占一行"\)[\s\S]*setImageBlockLayout/);
  assert.match(editorSource, /setTitle\("删除当前块"\)[\s\S]*removeImageBlock/);
  assert.match(editorSource, /private updateImageBlock\([\s\S]*replaceNodeContentBlocks\(node, blocks\)/);
  assert.match(editorSource, /private async uploadImageBlock[\s\S]*replaceNodeContentBlocks\(node, blocks\)/);
  assert.match(editorSource, /image-layout-\$\{block\.layout \?\? "block"\}/);
  assert.match(outlineSource, /image-align-\$\{block\.align \?\? "center"\}/);
  assert.match(outlineSource, /image-layout-\$\{block\.layout \?\? "block"\}/);
  assert.match(articleSource, /image-align-\$\{block\.align \?\? "center"\}/);
  assert.match(articleSource, /image-layout-\$\{block\.layout \?\? "block"\}/);
  assert.match(stylesSource, /\.mmc-node-image-block\.image-layout-inline/);
  assert.match(stylesSource, /\.mms-article-content-block\.image-layout-inline/);
});

test("full node editor honors the same rich-text shortcuts as quick editing", () => {
  assert.match(editorSource, /renderNodeRichTextEditor\([\s\S]*this\.richTextShortcuts/);
  assert.match(richEditorSource, /source\.addEventListener\("keydown"/);
  assert.match(richEditorSource, /matches\(shortcuts\.bold\)[\s\S]*matches\(shortcuts\.italic\)[\s\S]*matches\(shortcuts\.underline\)/);
  assert.match(richEditorSource, /applyBoolean\(style\)/);
});

test("image uploads use SHA-256 cache and remote deletion requires an explicit host API", () => {
  assert.match(settingsSource, /imageUploadCache: Record<string, ImageUploadCacheEntry>/);
  assert.match(settingsSource, /deleteRemoteWhenUnreferenced: boolean/);
  assert.match(settingsSource, /setName\("最后引用删除时同步清理图床"\)/);
  assert.match(settingsSource, /setName\("删除 API（可选）"\)/);
  assert.match(mainSource, /const contentHash = await sha256Blob\(blob\)/);
  assert.match(mainSource, /const cacheKey = `\$\{host\.id\}:\$\{contentHash\}`/);
  assert.match(mainSource, /reused: true/);
  assert.match(mainSource, /cleanupRemovedImageRemoteAssets/);
  assert.match(mainSource, /if \(!host\?\.deleteEndpoint\.trim\(\)\)/);
  assert.match(mainSource, /deleteImageFromHostConfig/);
});

test("canvas context menu uploads all current-page images with one host selection", () => {
  assert.match(editorSource, /setTitle\("上传当前页面所有图片"\)[\s\S]*uploadAllPageImages/);
  assert.match(editorSource, /private async uploadAllPageImages\(\): Promise<void>/);
  assert.match(editorSource, /const hostIds = await chooseImageHosts\([\s\S]*getDefaultUploadHostIds\(\)/);
  assert.match(editorSource, /const missingHostIds = hostIds\.filter\(\(hostId\) => !existing\.has\(hostId\)\)/);
  assert.match(editorSource, /onUploadImage\(image\.blob, image\.suggestedName, missingHostIds\)/);
  assert.match(editorSource, /replaceNodeContentBlocks\(node, blocks\)/);
});

test("image failover persists the promoted source through the authoritative content blocks", () => {
  const failover = editorSource.match(/const tryCandidate = \(index: number\): void => \{[\s\S]*?tryCandidate\(0\);/)?.[0] ?? "";

  assert.match(failover, /block\.source = candidate\.source;\s*replaceNodeContentBlocks\(node, blocks\);/);
  assert.doesNotMatch(failover, /block\.source = candidate\.source;\s*syncNodeContentFields\(node\);/);
  assert.match(failover, /new Notice\(`图片地址失效，已从 \$\{previousLabel\} 自动切换到 \$\{candidate\.label\}`/);
});

test("selection-only resize notifications do not repeatedly relayout the whole mind map", () => {
  assert.match(editorSource, /observedMindMapNodeSizes = new Map<string, \{ width: number; height: number \}>/);
  assert.match(editorSource, /let nodeSizeChanged = false;[\s\S]*Math\.abs\(previous\.width - next\.width\) > 0\.5[\s\S]*Math\.abs\(previous\.height - next\.height\) > 0\.5/);
  assert.match(editorSource, /if \(nodeSizeChanged\) \{\s*this\.scheduleMeasuredMindMapLayout\(\)/);
  assert.match(editorSource, /this\.observedMindMapNodeSizes\.set\(id, measured\.get\(id\)!\)/);
});
