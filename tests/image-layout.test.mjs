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
let imageFailureSource;
let viewSource;

before(async () => {
  [modelSource, editorSource, outlineSource, articleSource, richEditorSource, mainSource, settingsSource, stylesSource, imageFailureSource, viewSource] = await Promise.all([
    readFile("src/core/model.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/outline-renderer.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/node-rich-text-editor.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/settings.ts", "utf8"),
    readFile("styles.css", "utf8"),
    readFile("src/editor/image-failure-view.ts", "utf8"),
    readFile("src/view.ts", "utf8")
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
  assert.match(editorSource, /const hasEnabledImageHost = this\.callbacks\.getImageHosts\(\)\.length > 0/);
  assert.match(editorSource, /hasEnabledImageHost && \(block\.localSource/);
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
  assert.match(articleSource, /mms-article-image-row/);
  assert.match(articleSource, /createArticleContentBlock\(inline \? inlineImageRow! : container/);
  assert.match(outlineSource, /mms-outline-image-row/);
  assert.match(outlineSource, /\(inline \? inlineImageRow! : content\)\.createEl\("figure"/);
  assert.match(stylesSource, /\.mmc-node-image-block\.image-layout-inline/);
  assert.match(stylesSource, /\.mms-outline-image-row \{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap/);
  assert.match(stylesSource, /\.mms-outline-image\.image-layout-inline \{ flex: 0 1 auto; margin: 0; \}/);
  assert.match(stylesSource, /\.mms-article-image-row \{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap/);
  assert.match(stylesSource, /\.mms-article-content-block\.image-layout-inline/);
});

test("full node editor honors the same rich-text shortcuts as quick editing", () => {
  assert.match(editorSource, /renderNodeRichTextEditor\([\s\S]*this\.richTextShortcuts/);
  assert.match(richEditorSource, /source\.addEventListener\("keydown"/);
  assert.match(richEditorSource, /matches\(shortcuts\.bold\)[\s\S]*matches\(shortcuts\.italic\)[\s\S]*matches\(shortcuts\.underline\)/);
  assert.match(richEditorSource, /matches\(shortcuts\.color\)/);
  assert.match(richEditorSource, /ownerWindow\?\.addEventListener\("keydown", windowShortcut, true\)/);
  assert.match(richEditorSource, /event\.code\.toLowerCase\(\) === `key\$\{key\}`/);
  assert.match(richEditorSource, /lastHandledShortcut = \{ command: style \?\? "color", timeStamp: event\.timeStamp \}/);
  assert.match(richEditorSource, /event\.inputType === "formatBold" \? "bold"/);
  assert.match(richEditorSource, /lastHandledShortcut\?\.command === command && event\.timeStamp - lastHandledShortcut\.timeStamp < 1000/);
  assert.match(richEditorSource, /applyBoolean\(style\)/);
  assert.match(richEditorSource, /else applyColor\(\)/);
});

test("full node editor does not undo Ctrl+B when Chromium emits formatBold beforeinput", () => {
  assert.match(richEditorSource, /let lastHandledShortcut: \{ command: "bold" \| "italic" \| "underline" \| "color"; timeStamp: number \} \| null = null/);
  assert.match(richEditorSource, /lastHandledShortcut = \{ command: style \?\? "color", timeStamp: event\.timeStamp \}/);
  assert.match(richEditorSource, /event\.inputType === "formatBold" \? "bold"/);
  assert.match(richEditorSource, /event\.stopImmediatePropagation\(\);[\s\S]*lastHandledShortcut\?\.command === command && event\.timeStamp - lastHandledShortcut\.timeStamp < 1000/);
  assert.match(richEditorSource, /lastHandledShortcut = \{ command, timeStamp: event\.timeStamp \};[\s\S]*applyBoolean\(command\)/);
});

test("image uploads use SHA-256 cache and remote deletion requires an explicit host API", () => {
  assert.match(settingsSource, /imageUploadCache: Record<string, ImageUploadCacheEntry>/);
  assert.match(settingsSource, /deleteRemoteWhenUnreferenced: boolean/);
  assert.match(settingsSource, /setName\("最后引用删除时同步清理图床"\)/);
  assert.match(settingsSource, /setName\("删除 API（可选）"\)/);
  assert.match(settingsSource, /上传与删除请求共用同一组请求头/);
  assert.doesNotMatch(settingsSource, /setName\("删除请求头 JSON"\)/);
  assert.match(settingsSource, /pendingImageHostDeletions: Record<string, PendingImageHostDeletion>/);
  assert.match(settingsSource, /setName\("图床预设"\)/);
  assert.match(settingsSource, /preset: "zipline"/);
  assert.match(settingsSource, /addOption\("zipline", "Zipline（默认）"\)/);
  assert.doesNotMatch(settingsSource, /addOption\("zipline-v3"/);
  assert.match(settingsSource, /addOption\("imgbb", "ImgBB"\)/);
  assert.match(settingsSource, /addOption\("freeimage", "Freeimage\.host"\)/);
  assert.match(settingsSource, /deleteEndpoint = "\{deleteKey\}"/);
  assert.match(mainSource, /const contentHash = await sha256Blob\(blob\)/);
  assert.match(mainSource, /const cacheKey = `\$\{host\.id\}:\$\{contentHash\}`/);
  assert.match(mainSource, /reused: true/);
  assert.match(mainSource, /cleanupRemovedImageRemoteAssets/);
  assert.match(mainSource, /const remoteSources = \[\.\.\.\(removed\.remoteSources \?\? \[\]\)\]/);
  assert.match(mainSource, /if \(!host\?\.deleteEndpoint\.trim\(\)\)/);
  assert.match(mainSource, /deleteImageFromHostConfig/);
  assert.match(mainSource, /resolveZiplineFileId/);
  assert.match(mainSource, /const headers = parseUploadHeaders\(host\.headers\)/);
  assert.doesNotMatch(mainSource, /deleteHeaders/);
  assert.match(mainSource, /const REMOTE_IMAGE_DELETE_DELAY_MS = 60_000/);
  assert.match(mainSource, /scheduleImageHostDeletion/);
  assert.match(mainSource, /pending\.reason === "removed-image" && await this\.isPendingRemoteImageReferenced\(pending\)/);
  assert.match(mainSource, /检测到图片已恢复，已取消图床删除/);
  assert.match(mainSource, /测试图片将在 1 分钟后自动删除/);
  assert.match(mainSource, /\/api\/user\/files\?\$\{query\.toString\(\)\}/);
  assert.doesNotMatch(mainSource, /resolveZiplineV3FileId/);
  assert.doesNotMatch(mainSource, /host\.preset === "zipline-v3"/);
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

test("failed images expose every source address in map, outline, article, and reading renderers", () => {
  assert.match(imageFailureSource, /imageFailureSources[\s\S]*imageSourceCandidates\(block, true, imageHostPriorityIds\)/);
  assert.match(imageFailureSource, /图片加载失败[\s\S]*复制地址/);
  assert.match(imageFailureSource, /loadImageWithFallback[\s\S]*renderImageFailureDetails[\s\S]*image\.onerror = attempt/);
  assert.match(editorSource, /renderImageFailureDetails\(wrap, block, this\.options\.imageHostPriorityIds\)/);
  assert.doesNotMatch(editorSource.match(/if \(!candidate\) \{[\s\S]*?return;\n          \}/)?.[0] ?? "", /callbacks\.onChange|markSaving/);
  assert.match(outlineSource, /loadImageWithFallback\([\s\S]*figure/);
  assert.match(articleSource, /loadImageWithFallback\([\s\S]*shell/);
  assert.match(stylesSource, /\.mms-image-failure-card \{/);
  assert.match(stylesSource, /\.mms-image-failure-address code \{[\s\S]*overflow-wrap: anywhere/);
});

test("auto uploads are batched and merged into the live document instead of refreshing stale snapshots", () => {
  assert.match(mainSource, /readyAutoUploadJobs/);
  assert.match(mainSource, /autoUploadInFlightKeys/);
  assert.match(mainSource, /private async runAutoUploadBatch\([\s\S]*const completed: CompletedAutoUploadJob\[\]/);
  assert.match(mainSource, /const patches = completed\.flatMap[\s\S]*applyAutoUploadPatches\(mapFile, patches\)/);
  assert.match(mainSource, /已自动上传 \$\{succeeded\} 张图片/);
  const batch = mainSource.match(/private async runAutoUploadBatch\([\s\S]*?\n  \}\n\n  \/\*\* Applies upload patches/)?.[0] ?? "";
  assert.doesNotMatch(batch, /refreshOpenMindMap/);
  assert.match(viewSource, /async applyImageUploadPatches\([\s\S]*this\.editor\.applyImageUploadPatches\(patches\)[\s\S]*await this\.save\(\)/);
  assert.match(editorSource, /applyImageUploadPatches\(patches:[\s\S]*applyImageUploadPatches\(this\.document, patches\)/);
});
