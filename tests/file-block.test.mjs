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
let editorModalsSource;

before(async () => {
  const [loaded, editor, main, view, modal, fileView, canvas, article, outline, layout, styles, editorTypes, editorModals] = await Promise.all([
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
    readFile("src/editor/editor-types.ts", "utf8"),
    readFile("src/editor/editor-modals.ts", "utf8")
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
  editorModalsSource = editorModals;
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
  assert.match(safeDelete, /block\.type === "image" && block\.localSource === normalized/, "image local copies must also protect the asset from removal");
  assert.match(safeDelete, /this\.app\.vault\.trash\(target, true\)/, "removal must go to the system trash");
  assert.match(mainSource, /for \(const timer of this\.pendingFileDeletionTimers\.values\(\)\) window\.clearTimeout\(timer\)/, "onunload clears pending timers");
});

test("replaced and removed image local copies enter deferred recycling", () => {
  // 更新替换或删除图片块后，旧本地图片走与文件块相同的 60 秒延迟回收：
  // 撤销恢复引用会自动取消，到期前全库引用检查兜底。
  const collect = editorSource.match(/private collectFileAssetPaths\(\): string\[\] \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(collect, /block\.type === "image" && block\.localSource\) paths\.push\(block\.localSource\)/, "undo cancellation must also track image local copies");
  const deleted = editorSource.match(/private collectDeletedFileAssetPaths\(nodeIds: readonly string\[\]\): string\[\] \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(deleted, /block\.type === "image" && block\.localSource\) paths\.add\(block\.localSource\)/, "node deletion must recycle dropped image local copies");
  const replaceLocal = editorSource.match(/if \(change\.type === "replaceLocal"\) \{[\s\S]*?\n    \}/)?.[0] ?? "";
  assert.match(replaceLocal, /const previousLocal = located\.block\.localSource;/);
  assert.match(replaceLocal, /if \(sourceWasLocal\) located\.block\.source = path;/, "a local current source must follow the replacement so the preview keeps working after recycling");
  assert.match(replaceLocal, /if \(recycled\.size\) this\.callbacks\.onScheduleFileAssetDeletion\(\[\.\.\.recycled\]\);/, "replaced local images must enter deferred recycling");
  const removeBlock = editorSource.match(/private removeContentBlock\(nodeId: string, blockId: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(removeBlock, /removed\.type === "image" && removed\.localSource\) this\.callbacks\.onScheduleFileAssetDeletion\(\[removed\.localSource\]/, "deleted image blocks must recycle their local copy");
});

test("image local copies reveal in the system file explorer with selection", () => {
  assert.match(editorSource, /setTitle\("在文件资源管理器中显示"\)[\s\S]{0,120}onRevealFileInSystemExplorer\(block\.localSource!\)/);
  const reveal = mainSource.match(/async revealFileInSystemExplorer\(vaultPath: string\): Promise<void> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(reveal, /Platform\.isDesktopApp/, "mobile clients must be rejected gracefully");
  assert.match(reveal, /adapter\.getFullPath\(path\)/, "vault paths must translate to absolute disk paths");
  assert.match(reveal, /showItemInFolder\(absolutePath\)/, "explorer must open with the file selected");
  const requireFn = reveal.match(/require\??: \(id: string\) => unknown/);
  assert.ok(requireFn, "electron must be acquired lazily to keep mobile loading safe");
});

test("image preview source changes pin the article scroll position", () => {
  // 来源变更（替换/上传/设默认/删除来源）会触发文章全量重渲染与语义位置恢复，
  // warmup 高度不准导致恢复偏离真实位置，连续操作累积为“乱跳丢进度”。
  // 所有来源变更必须通过 runWithPinnedArticleScroll 钉住滚动，900ms 后放开接管。
  const pinned = editorSource.match(/private runWithPinnedArticleScroll\(run: \(\) => void\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(pinned, /const scrollTopBefore = scroller\.scrollTop;/);
  assert.match(pinned, /scroller\.addEventListener\("scroll", guard, true\)/, "capture-phase guard must also pin programmatic restores");
  assert.match(pinned, /window\.setTimeout\(detach, 900\)/, "the guard must release so user scrolling takes over");
  const changeBody = editorSource.match(/private async applyImagePreviewSourceChange\([\s\S]*?\n  \}/)?.[0] ?? "";
  const mutateCount = (changeBody.match(/this\.runWithPinnedArticleScroll\(\(\) => \{/g) ?? []).length;
  assert.ok(mutateCount >= 5, `reupload, add, replaceLocal, unsetDefault/setDefault and remove branches must pin the scroll (found ${mutateCount})`);
});

test("image preview source menu reveals local images in the system explorer", () => {
  // 预览弹窗“本地图片”来源行右键在“更新替换”后提供资源管理器定位入口。
  assert.match(editorModalsSource, /revealLocal\?: \(path: string\) => void;/);
  assert.match(editorModalsSource, /setTitle\("在文件资源管理器中打开"\)\s*\n\s*\.setIcon\("folder-open"\)\s*\n\s*\.onClick\(\(\) => this\.actions\?\.revealLocal\?\.\(candidate\.source\)\)/);
  assert.match(editorSource, /revealLocal: \(path\) => this\.callbacks\.onRevealFileInSystemExplorer\(path\)/);
});

test("node context menu uploads a file into the targeted node and stores the vault path", () => {
  assert.match(editorSource, /setTitle\("上传文件"\)[\s\S]{0,120}onClick\(\(\) => void this\.uploadFileToNode\(selected\.id, contextBlockId\)\)/);
  const upload = editorSource.match(/private async uploadFileToNode\(nodeId: string, afterBlockId\?: string\): Promise<void> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(upload, /await selectAnyFile\(\)/);
  assert.match(upload, /await this\.uploadFilesToNode\(nodeId, \[file\], afterBlockId\)/);
  const shared = editorSource.match(/private async uploadFilesToNode\(nodeId: string, files: File\[\], afterBlockId\?: string\): Promise<void> \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(shared, /await this\.callbacks\.onSaveAttachmentFile\(file\)/);
  assert.match(shared, /type: "file",/);
  assert.match(shared, /source: path/);
  assert.match(shared, /name: file\.name \|\| path\.split\("\/"\)\.pop\(\) \|\| "附件"/);
});

test("dragging external files drops them in place instead of opening the file picker", () => {
  assert.match(editorSource, /event\.dataTransfer\?\.types\.includes\("Files"\) && !this\.draggingContentBlock[\s\S]{0,500}void this\.uploadFilesToNode\(nodeId, files\)/);
  assert.match(editorSource, /const files = Array\.from\(event\.dataTransfer\.files \?\? \[\]\);/);
  assert.match(editorSource, /直接消费拖拽携带的文件，不再打开系统文件选择窗口/);
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
