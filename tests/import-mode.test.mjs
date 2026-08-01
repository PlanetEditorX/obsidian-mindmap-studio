import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let editorSource;
let modalSource;
let desktopImportSource;
let settingsSource;
let mainSource;
let viewSource;
let editorTypesSource;

before(async () => {
  [editorSource, modalSource, desktopImportSource, settingsSource, mainSource, viewSource, editorTypesSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/editor-modals.ts", "utf8"),
    readFile("src/utils/desktop-import.ts", "utf8"),
    readFile("src/settings.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/view.ts", "utf8"),
    readFile("src/editor/editor-types.ts", "utf8"),
  ]);
});

test("desktop import remembers the selected folder and does not reopen a fallback picker on cancel", () => {
  assert.match(desktopImportSource, /export async function selectDesktopImportFile\(lastDirectory: string\)/);
  assert.match(desktopImportSource, /defaultPath: lastDirectory \|\| undefined/);
  assert.match(desktopImportSource, /properties: \["openFile"\]/);
  assert.match(desktopImportSource, /extensions: \["xmind", "md", "markdown", "json"\]/);
  assert.match(modalSource, /selectDesktopImportFile\(this\.getLastImportFolder\(\)\)/);
  assert.match(modalSource, /if \(selected\.supported\) \{\s*if \(!selected\.file\) return;/);
  assert.match(modalSource, /onRememberImportFolder\(selected\.file\.directory\)/);
  assert.match(settingsSource, /lastImportFolder: ""/);
});

test("desktop Markdown import copies referenced images into the current mind-map asset folder", () => {
  assert.match(desktopImportSource, /export function desktopMarkdownImageRelativeCandidates\(source: string\)/);
  assert.match(desktopImportSource, /segments\[0\]\?\.toLowerCase\(\) === "assets"/);
  assert.match(desktopImportSource, /export async function readDesktopMarkdownImage\(sourceDirectory: string, source: string\)/);
  assert.match(editorTypesSource, /onImportMarkdownImages: \(document: MindMapDocument, sourceDirectory: string\) => Promise<number>/);
  assert.match(viewSource, /this\.plugin\.importDesktopMarkdownImages\(document, sourceDirectory, this\.file\)/);
  assert.match(modalSource, /await this\.onImportMarkdownImages\(imported, selected\.file\.directory\)/);
  assert.match(mainSource, /async importDesktopMarkdownImages\(document: MindMapDocument, sourceDirectory: string, mindMapFile: TFile \| null\)/);
  assert.match(mainSource, /copyDesktopMarkdownImagesToDocument\(/);
  assert.match(desktopImportSource, /block\.source = targetPath;\s*block\.localSource = targetPath;[\s\S]*replaceNodeContentBlocks\(node, blocks\)/);
  const directImageLookup = viewSource.indexOf('getAbstractFileByPath(normalizePath(target.replace(/^\\\/+/, "")))');
  const cachedImageLookup = viewSource.indexOf("getFirstLinkpathDest(target", directImageLookup);
  assert.ok(directImageLookup >= 0 && cachedImageLookup > directImageLookup);
});

test("imported local images schedule automatic image-host upload after final node IDs are assigned", () => {
  assert.match(editorSource, /private scheduleImportedImageUploads\(root: MindMapNode\): number/);
  assert.match(editorSource, /block\.localSource\?\.trim\(\)/);
  assert.match(editorSource, /onScheduleAutoUpload\(node\.id, block\.id, localPath, suggestedName\)/);
  assert.match(editorSource, /this\.mutate\([\s\S]*appendChild\(parent, importedRoot\)[\s\S]*this\.scheduleImportedImageUploads\(importedRoot\)/);
  assert.match(editorSource, /this\.replaceDocument\(document\);\s*this\.scheduleImportedImageUploads\(this\.document\.root\)/);
  assert.match(mainSource, /await this\.resumePendingAutoUploads\(mindMapFile, document\)/);
});

test("automatic image uploads follow a mind-map file renamed during the pre-upload save", () => {
  assert.match(mainSource, /private queueAutoUpload\(\s*mindMapFile: TFile/);
  assert.match(mainSource, /enqueueReadyAutoUpload\(\{ key, mindMapFile, nodeId, blockId, localPath, suggestedName, hostIds:/);
  assert.match(mainSource, /private startAutoUploadBatch\(mindMapFile: TFile/);
  assert.match(mainSource, /private async runAutoUploadBatch\(mindMapFile: TFile/);
  assert.match(mainSource, /await this\.flushOpenView\(mindMapFile\.path\);\s*const mapFile = this\.app\.vault\.getAbstractFileByPath\(mindMapFile\.path\)/);
  assert.match(mainSource, /deleteLocalAssetIfSafe\(item\.job\.localPath, mapFile\.path, item\.job\.blockId\)/);
});

test("file import defaults to a child branch and keeps replacement explicit", () => {
  assert.match(modalSource, /text: "导入文件"/);
  assert.match(modalSource, /可导入 MindMap Studio JSON、思维导图或 Markdown 文件/);
  assert.doesNotMatch(modalSource, /可导入 MindMap Studio JSON、XMind 或 Markdown 文件/);
  assert.match(modalSource, /导入为子节点（默认）/);
  assert.match(modalSource, /导入并替换当前文件/);
  assert.match(modalSource, /mode === "replace" && !window\.confirm/);
  assert.match(editorSource, /private importDocument\(document: MindMapDocument, mode: "child" \| "replace"\): void/);
  assert.match(editorSource, /const importedRoot = cloneNodeWithFreshIds\(document\.root\)/);
  assert.match(editorSource, /appendChild\(parent, importedRoot\)/);
});
