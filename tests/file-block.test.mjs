import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { readFile } from "node:fs/promises";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let cleanup;
let editorSource;
let mainSource;
let viewSource;
let modalSource;
let fileViewSource;
let canvasRendererSource;
let articleSource;
let outlineSource;
let layoutSource;
let stylesSource;
let editorTypesSource;

before(async () => {
  const [loaded, editor, main, view, modal, fileView, canvas, article, outline, layout, styles, editorTypes] = await Promise.all([
    loadTypeScriptModules(["src/core/node-tree.ts", "src/core/model.ts"], "src/core/model.ts"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/view.ts", "utf8"),
    readFile("src/editor/node-edit-modal.ts", "utf8"),
    readFile("src/editor/file-block-view.ts", "utf8"),
    readFile("src/editor/mind-map-node-renderer.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/outline-renderer.ts", "utf8"),
    readFile("src/render/layout.ts", "utf8"),
    readFile("styles.css", "utf8"),
    readFile("src/editor/editor-types.ts", "utf8")
  ]);
  model = loaded.module;
  cleanup = loaded.cleanup;
  editorSource = editor;
  mainSource = main;
  viewSource = view;
  modalSource = modal;
  fileViewSource = fileView;
  canvasRendererSource = canvas;
  articleSource = article;
  outlineSource = outline;
  layoutSource = layout;
  stylesSource = styles;
  editorTypesSource = editorTypes;
});

after(() => cleanup?.());

test("file content blocks survive parsing, search text and markdown export", () => {
  const document = model.parseDocument(JSON.stringify({
    id: "doc",
    title: "附件导图",
    root: {
      id: "root",
      text: "根节点",
      children: [
        {
          id: "n1",
          text: "报告",
          content: [
            { id: "b1", type: "file", source: "  MindMap Assets/年度报告.pdf  ", name: " 年度报告.pdf ", size: 2048.4 },
            { id: "b2", type: "file", source: "   ", name: "空块" },
            { id: "b3", type: "file", source: "MindMap Assets/数据.xlsx", name: "数据.xlsx" }
          ]
        }
      ]
    }
  }), "附件导图");
  const child = document.root.children[0];
  assert.equal(child.content.length, 2, "file block without source must be dropped by normalization");
  assert.deepEqual(child.content[0], { id: "b1", type: "file", source: "MindMap Assets/年度报告.pdf", name: "年度报告.pdf", size: 2048 });
  assert.equal(child.content[1].size, undefined, "missing size stays undefined instead of NaN");

  const searchText = model.nodeSearchText(child);
  assert.ok(searchText.includes("年度报告.pdf"));
  assert.ok(searchText.includes("mindmap assets/数据.xlsx"));

  const markdown = model.documentToMarkdown(document);
  assert.match(markdown, /\[年度报告\.pdf\]\(MindMap Assets\/年度报告\.pdf\)/);
  assert.match(markdown, /\[数据\.xlsx\]\(MindMap Assets\/数据\.xlsx\)/);
});

test("editor callbacks expose the four file asset hooks used by the plugin layer", () => {
  assert.match(editorTypesSource, /onSaveAttachmentFile: \(file: File\) => Promise<string>/);
  assert.match(editorTypesSource, /onScheduleFileAssetDeletion: \(paths: string\[\]\) => void/);
  assert.match(editorTypesSource, /onCancelFileAssetDeletion: \(paths: string\[\]\) => void/);
  assert.match(editorTypesSource, /onOpenFileAsset: \(path: string\) => Promise<void>/);
  assert.match(viewSource, /onSaveAttachmentFile: async \(file\) => this\.plugin\.saveAttachmentFile\(file, this\.file\)/);
  assert.match(viewSource, /onScheduleFileAssetDeletion: \(paths\) => this\.plugin\.scheduleFileAssetDeletion\(paths, this\.file\?\.path \?\? ""\)/);
  assert.match(viewSource, /onCancelFileAssetDeletion: \(paths\) => this\.plugin\.cancelFileAssetDeletion\(paths\)/);
  assert.match(viewSource, /onOpenFileAsset: async \(path\) => this\.plugin\.openFileAsset\(path\)/);
});

test("plugin saves uploads under the per-map asset folder keeping the original name", () => {
  const save = mainSource.match(/async saveAttachmentFile\(file: File, sourceFile: TFile \| null\): Promise<string> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(save, /this\.sanitizeFilename\(file\.name \|\| "附件"\)/);
  assert.match(save, /this\.getAvailablePath\(preferred\)/);
  assert.match(save, /this\.app\.vault\.createBinary\(path, await file\.arrayBuffer\(\)\)/);
  assert.match(mainSource, /settings\.assetFolder \|\| "MindMap Assets"/);
});

test("plugin deletes unreferenced file assets to the system trash after a cancellable delay", () => {
  const schedule = mainSource.match(/scheduleFileAssetDeletion\(paths: string\[\], currentMindMapPath: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(schedule, /60_000/);
  assert.match(schedule, /this\.pendingFileDeletionTimers\.has\(path\)/, "duplicate paths must not spawn a second timer");

  const cancel = mainSource.match(/cancelFileAssetDeletion\(paths: string\[\]\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(cancel, /window\.clearTimeout\(timer\)/);
  assert.match(cancel, /this\.pendingFileDeletionTimers\.delete\(path\)/);

  const safeDelete = mainSource.match(/private async deleteFileAssetIfSafe\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(safeDelete, /block\.type === "file" && block\.source === normalized/, "final check scans every .mindmap for remaining references");
  assert.match(safeDelete, /this\.app\.vault\.trash\(target, true\)/, "removal must go to the system trash");
  assert.match(mainSource, /for \(const timer of this\.pendingFileDeletionTimers\.values\(\)\) window\.clearTimeout\(timer\)/, "onunload clears pending timers");
});

test("node context menu uploads a file into the targeted node and stores the vault path", () => {
  assert.match(editorSource, /setTitle\("上传文件"\)[\s\S]{0,120}onClick\(\(\) => void this\.uploadFileToNode\(selected\.id, contextBlockId\)\)/);
  const upload = editorSource.match(/private async uploadFileToNode\(nodeId: string, afterBlockId\?: string\): Promise<void> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(upload, /await selectAnyFile\(\)/);
  assert.match(upload, /await this\.callbacks\.onSaveAttachmentFile\(file\)/);
  assert.match(upload, /type: "file",/);
  assert.match(upload, /source: path/);
  assert.match(upload, /name: file\.name \|\| path\.split\("\/"\)\.pop\(\) \|\| "附件"/);
});

test("dragging external files onto a node appends a file upload before content-block drags", () => {
  assert.match(editorSource, /event\.dataTransfer\?\.types\.includes\("Files"\) && !this\.draggingContentBlock[\s\S]{0,320}void this\.uploadFileToNode\(nodeId\)/);
  assert.match(editorSource, /外部文件拖入必须先于内容块拖拽判空处理/);
});

test("block and node deletions schedule delayed file asset cleanup with undo cancellation", () => {
  assert.match(editorSource, /private collectFileAssetPaths\(\)[\s\S]*?if \(block\.type === "file"\) paths\.push\(block\.source\)/);
  assert.match(editorSource, /this\.callbacks\.onCancelFileAssetDeletion\(this\.collectFileAssetPaths\(\)\)/);
  assert.match(editorSource, /if \(removedFileAssets\.length\) this\.callbacks\.onScheduleFileAssetDeletion\(removedFileAssets\)/);
  assert.match(editorSource, /if \(removed\.type === "file"\) this\.callbacks\.onScheduleFileAssetDeletion\(\[removed\.source\]\)/);
});

test("node edit modal adds files and routes removals through the delayed deletion path", () => {
  const remove = modalSource.match(/const removeWorkingBlock = \(blockId: string\): void => \{[\s\S]*?\n    \};/)?.[0] ?? "";
  assert.match(remove, /removed\?\.type === "file" && removed\.source\.trim\(\)/);
  assert.match(remove, /this\.callbacks\.onScheduleFileAssetDeletion\(\[removed\.source\]\)/);
  assert.match(modalSource, /control\("trash-2", "删除内容块", \(\) => removeWorkingBlock\(block\.id\)\)/);
  assert.match(modalSource, /item\.setTitle\("删除当前块"\)[\s\S]{0,80}removeWorkingBlock\(block\.id\)/);
  assert.match(modalSource, /"\+ 文件"/);
  const addFile = modalSource.match(/const file = await selectAnyFile\(\);[\s\S]{0,400}?type: "file",/s)?.[0] ?? "";
  assert.match(addFile, /await this\.callbacks\.onSaveAttachmentFile\(file\)/);
  assert.match(modalSource, /block\.type === "file" \? "文件块"/);
});

test("shared file card renderer is reused by canvas, article, outline and editor surfaces", () => {
  assert.match(fileViewSource, /export function renderFileCard\(container: HTMLElement, block: MindMapFileContentBlock, options: FileCardOptions\): HTMLElement/);
  assert.match(fileViewSource, /export function fileCardSizeLabel\(block: Pick<MindMapFileContentBlock, "size">\): string/);
  assert.match(fileViewSource, /setIcon\(icon, "file-text"\)/);
  assert.match(fileViewSource, /card\.dataset\.blockId = block\.id/);
  assert.match(canvasRendererSource, /renderFileCard\(wrap, block, \{\s*\n\s*cls: "is-canvas"/);
  assert.match(articleSource, /renderFileCard\(shell, block, \{\s*cls: "is-article"/);
  assert.match(outlineSource, /renderFileCard\(wrap, block, \{\s*cls: "is-outline"/);
  assert.match(modalSource, /renderFileCard\(body, block, \{\s*cls: "is-editor"/);
  for (const source of [canvasRendererSource, articleSource, outlineSource, modalSource]) {
    assert.match(source, /import \{ renderFileCard \} from "\.\/file-block-view";/);
  }
});

test("file blocks participate in canvas layout estimation and svg export", () => {
  assert.match(layoutSource, /block\.type === "file"[\s\S]{0,80}width = Math\.max\(width, Math\.min\(900, 268\)\)/);
  assert.match(layoutSource, /block\.type === "file"[\s\S]{0,80}height \+= 40/);
  assert.match(layoutSource, /block\.type === "file"[\s\S]{0,160}📎 \$\{escapeXml\(block\.name\.slice\(0, 24\)\)\}/);
});

test("outline and global search treat file-only nodes as first-class content", () => {
  assert.match(outlineSource, /const files = blocks\.filter\(\(block\) => block\.type === "file"\)/);
  assert.match(outlineSource, /block\.type === "image" \|\| block\.type === "file"\)/);
  assert.match(outlineSource, /\? "文件节点" : "图片节点"/);
});

test("file cards ship shared styles for every host surface", () => {
  assert.match(stylesSource, /\.mmc-file-card \{/);
  assert.match(stylesSource, /\.mmc-file-card-name \{/);
  assert.match(stylesSource, /\.mmc-file-card-size \{/);
  assert.match(stylesSource, /\.mmc-file-card\.is-article,/);
  assert.match(stylesSource, /\.mmc-node-file-block \{/);
  assert.match(stylesSource, /\.mms-article-file-block-wrap \{/);
  assert.match(stylesSource, /\.mms-outline-file \{/);
  assert.match(stylesSource, /\.mmc-file-block-editor \{/);
});
