import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(rootDir, "src/render/incremental-render.ts");
const articleWindowModulePath = path.join(rootDir, "src/article/render-window.ts");

function node(id, children = []) {
  return { id, children };
}

test("hierarchy focus order prioritizes current node, siblings, parent families, and ancestors", async () => {
  const { module, cleanup } = await loadTypeScriptModule(modulePath);
  try {
    const root = node("root", [
      node("a", [node("a1"), node("a2")]),
      node("b", [node("b1")])
    ]);
    assert.deepEqual(module.buildHierarchyFocusOrder(root, "a2"), ["a2", "a1", "a", "b", "root"]);
    assert.deepEqual(module.buildHierarchyFocusOrder(root, "missing"), ["root"]);
  } finally {
    await cleanup();
  }
});

test("spatial priority renders hierarchy focus, current viewport, adjacent viewport, then distant nodes", async () => {
  const { module, cleanup } = await loadTypeScriptModule(modulePath);
  try {
    const items = [
      { id: "far", x: 1000, y: 1000, width: 40, height: 40, order: 0 },
      { id: "adjacent", x: 220, y: 40, width: 40, height: 40, order: 1 },
      { id: "visible", x: 40, y: 40, width: 40, height: 40, order: 2 },
      { id: "focus", x: 1800, y: 1800, width: 40, height: 40, order: 3 }
    ];
    const sorted = module.prioritizeSpatialRenderItems(items, ["focus"], {
      left: 0,
      top: 0,
      right: 100,
      bottom: 100
    });
    assert.deepEqual(sorted.map((item) => item.id), ["focus", "visible", "adjacent", "far"]);
    assert.deepEqual(items.map((item) => item.id), ["far", "adjacent", "visible", "focus"]);
  } finally {
    await cleanup();
  }
});

test("editor construction defers whole-tree mind-map layout until the canvas mode actually renders", async () => {
  const editorSource = await readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8");
  const constructorStart = editorSource.indexOf("  constructor(app: App, host: HTMLElement");
  const constructorEnd = editorSource.indexOf(`\n  /**\n   * 执行“destroy”`, constructorStart);
  const constructorSource = editorSource.slice(constructorStart, constructorEnd);
  assert.doesNotMatch(constructorSource, /computeLayout\(/);
  assert.match(constructorSource, /this\.layout = \{ nodes: \[\], byId: new Map\(\), minX: 0, maxX: 0, minY: 0, maxY: 0 \}/);
  const mindMapStart = editorSource.indexOf("  private renderMindMap(): void {");
  const mindMapEnd = editorSource.indexOf(`\n  /**`, mindMapStart + 4);
  const mindMapRenderer = editorSource.slice(mindMapStart, mindMapEnd);
  assert.match(mindMapRenderer, /this\.layout = computeLayout\(/);
});

test("article mode mounts a target-centered 5 KB window and expands only at rendered edges", async () => {
  const [editorSource, articleSource, cssSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8"),
    readFile(path.join(rootDir, "styles.css"), "utf8")
  ]);
  const articleRender = editorSource.match(/private renderArticle\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const articleMode = articleSource.match(/export function renderArticleMode\([\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(articleRender, /this\.articleRenderController = renderArticleMode\(this\.articleEl, this\.articleRendererOptions\(\)\)/);
  assert.match(articleMode, /resolveByteWindow\(weights, initialTarget >= 0 \? initialTarget : 0\)/);
  assert.match(articleMode, /loadBefore:[\s\S]*resolveByteChunk\(weights, start, "before"\)/);
  assert.match(articleMode, /loadAfter:[\s\S]*resolveByteChunk\(weights, end, "after"\)/);
  assert.match(editorSource, /previousTop \+ Math\.max\(0, this\.articleEl\.scrollHeight - previousHeight\)/);
  assert.match(cssSource, /\.mms-article-window-loader/);
  assert.match(cssSource, /\.mms-article-window-loader \{[\s\S]*?display: flex;[\s\S]*?align-items: center;[\s\S]*?justify-content: center;[\s\S]*?line-height: 1\.2;/);
  assert.match(cssSource, /@property --mms-article-loader-border-angle/);
  assert.match(cssSource, /\.mms-article-window-loader\.is-loading::before \{[\s\S]*?conic-gradient\([\s\S]*?-webkit-mask-composite: xor;[\s\S]*?animation: mms-article-loader-border-run 1\.35s linear infinite;/);
  assert.match(cssSource, /@keyframes mms-article-loader-border-run \{[\s\S]*?--mms-article-loader-border-angle: 360deg;/);
  assert.match(cssSource, /prefers-reduced-motion: reduce[\s\S]*?mms-article-window-loader\.is-loading::before[\s\S]*?animation: none;/);
  assert.match(articleSource, /articleNodePrimaryText/);
  assert.doesNotMatch(articleSource, /JSON\.stringify\(\{[\s\S]*?content: articleNodeContentBlocks/);
  assert.doesNotMatch(articleSource, /is-render-pending|ArticleIncrementalRenderOptions|onFirstContent|onProgress/);
});

test("article byte windows keep the target and independently cap both sides", async () => {
  const { module, cleanup } = await loadTypeScriptModule(articleWindowModulePath);
  try {
    assert.equal(module.ARTICLE_RENDER_WINDOW_BYTES, 5 * 1024);
    assert.equal(module.utf8ByteLength("abc中文"), 9);
    assert.deepEqual(module.resolveByteWindow([3000, 3000, 100, 3000, 3000], 2, 5000), { start: 0, end: 5 });
    assert.deepEqual(module.resolveByteWindow([6000, 100, 6000], 1, 5000), { start: 0, end: 3 });
    assert.equal(module.resolveByteChunk([2000, 2000, 2000, 2000], 2, "before", 3000), 0);
    assert.equal(module.resolveByteChunk([2000, 2000, 2000, 2000], 2, "after", 3000), 4);
  } finally {
    await cleanup();
  }
});

test("article semantic navigation mounts the requested real section before positioning", async () => {
  const [editorSource, cssSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "styles.css"), "utf8")
  ]);
  const applyLocation = editorSource.match(/private applyResolvedReadingLocation\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(applyLocation, /articleRenderController\?\.ensureNode\(resolved\.nodeId\)/);
  assert.match(applyLocation, /\.mms-article-node\[data-node-id=/);
  assert.match(applyLocation, /\.mms-article-document-title\[data-node-id=/);
  assert.match(applyLocation, /if \(!target\) \{[\s\S]*?restore-target-missing[\s\S]*?return false/);
  assert.doesNotMatch(applyLocation, /scrollIntoView/);
  assert.doesNotMatch(cssSource, /mms-article-node\.is-render-pending|mms-article-loading-shell|mms-article-render-stage|mms-article-transition-overlay/);
});

test("clicking a same-file directory chapter switches to article without reopening the file or racing the old anchor", async () => {
  const [editorSource, articleSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8")
  ]);
  const focusNode = editorSource.match(/private focusNode\(id: string, persistLocation = true\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const renderArticle = editorSource.match(/private renderArticle\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const renderDirectory = articleSource.match(/function renderDirectory\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(focusNode, /this\.currentMode === "article"[\s\S]*?id !== this\.document\.root\.id[\s\S]*?articleLandingMode !== "article"/);
  assert.doesNotMatch(focusNode, /id !== this\.document\.root\.id[\s\S]{0,120}this\.options\.showArticleToc/);
  assert.match(focusNode, /articleLandingMode: "article"/);
  assert.match(focusNode, /pendingArticleFocusLocation = location/);
  assert.match(focusNode, /if \(this\.currentMode !== "article"\) this\.restoreReadingLocation/);
  assert.match(renderArticle, /const explicitTarget = this\.pendingArticleFocusLocation/);
  assert.match(renderArticle, /const directoryOnly = !explicitTarget/);
  assert.match(renderArticle, /const requestedLocation = directoryOnly \? null : explicitTarget/);
  assert.match(renderArticle, /const previousLocation = !directoryOnly && !requestedLocation/);
  assert.match(renderArticle, /const latestRequestedLocation = directoryOnly[\s\S]*chooseArticleTransitionLocation\(requestedLocation, this\.pendingArticleFocusLocation\)/);
  assert.match(renderArticle, /const location = latestRequestedLocation \?\? previousLocation/);
  assert.match(renderArticle, /if \(location\) this\.restoreReadingLocation\("article", location\)/);
  assert.match(renderDirectory, /entry\.filePath === options\.currentFilePath && entry\.nodeId/);
  assert.match(renderDirectory, /options\.focusNode\(entry\.nodeId\)/);
  assert.doesNotMatch(focusNode, /scrollIntoView/);
});


test("article entry transition paints a bounded skeleton without delaying semantic navigation", async () => {
  const [editorSource, rendererSource, cssSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8"),
    readFile(path.join(rootDir, "styles.css"), "utf8")
  ]);
  const renderArticle = editorSource.match(/private renderArticle\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const restoreLocation = editorSource.match(/private restoreReadingLocation\([\s\S]*?\n  \}/)?.[0] ?? "";
  const expandWindow = editorSource.match(/private expandArticleWindow\([\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(renderArticle, /renderArticleSkeleton\(directoryOnly \? "toc" : "article"\)/);
  assert.match(renderArticle, /prefers-reduced-motion: reduce/);
  assert.match(renderArticle, /requestAnimationFrame\(\(\) => \{[\s\S]*?requestAnimationFrame/);
  assert.match(renderArticle, /latestRequestedLocation = directoryOnly[\s\S]*chooseArticleTransitionLocation\(requestedLocation, this\.pendingArticleFocusLocation\)/);
  assert.match(restoreLocation, /articleInitialRenderFrame !== null/);
  assert.match(restoreLocation, /pendingArticleFocusLocation = normalizedLocation/);
  assert.match(expandWindow, /mms-article-window-loader\.is-\$\{direction\}/);
  assert.match(expandWindow, /requestAnimationFrame\(\(\) => \{[\s\S]*?requestAnimationFrame/);
  assert.match(rendererSource, /is-window-entering/);
  assert.match(cssSource, /\.mms-article-entry-skeleton/);
  assert.match(cssSource, /mms-article-skeleton-shimmer/);
  assert.match(cssSource, /prefers-reduced-motion: reduce/);
  const skeletonRule = cssSource.match(/\.mms-article-entry-skeleton \{[\s\S]*?\}/)?.[0] ?? "";
  assert.doesNotMatch(skeletonRule, /position:\s*fixed/);
});


test("article context gates the first paint and landing transitions are symmetric", async () => {
  const [editorSource, viewSource, mainSource, typesSource, cssSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/view.ts"), "utf8"),
    readFile(path.join(rootDir, "src/main.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/editor-types.ts"), "utf8"),
    readFile(path.join(rootDir, "styles.css"), "utf8")
  ]);
  const renderArticle = editorSource.match(/private renderArticle\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const setLanding = editorSource.match(/private setArticleLandingMode\([\s\S]*?\n  \}/)?.[0] ?? "";
  const setViewData = viewSource.match(/setViewData\([\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(typesSource, /articleContextReady: boolean/);
  assert.ok(renderArticle.indexOf("if (!this.options.articleContextReady)") < renderArticle.indexOf("renderArticleMode(this.articleEl"));
  assert.match(renderArticle, /renderArticleSkeleton\(target\)/);
  assert.match(renderArticle, /existingDirectory !== directoryOnly/);
  assert.match(renderArticle, /renderArticleSkeleton\(directoryOnly \? "toc" : "article"\)/);
  assert.match(renderArticle, /if \(directoryOnly\) \{[\s\S]*?scrollTop = 0[\s\S]*?return/);
  assert.match(setLanding, /cancelReadingLocationRestore\(\)/);
  assert.match(setLanding, /pendingArticleFocusLocation = null/);
  assert.doesNotMatch(setLanding, /restoreReadingLocation|this\.mutate/);
  assert.match(setViewData, /consumePendingMindMapFocus/);
  assert.match(setViewData, /this\.editor\.focusNodeById\(nodeId, persistLocation\)/);
  assert.doesNotMatch(setViewData, /setTimeout\(\(\) => this\.editor\?\.focusNodeById/);
  assert.match(viewSource, /this\.articleContextReady = false/);
  assert.match(viewSource, /this\.articleContextReady = true/);
  assert.match(mainSource, /pendingMindMapFocus\.set\(file\.path, focusNodeId\)/);
  assert.match(mainSource, /resolveNavigationFocusNode\(resolved, sourcePath, focusNodeId\)/);
  assert.match(mainSource, /openAsMindMap\(resolved, preferredLeaf, resolvedFocusNodeId\)/);
  assert.match(cssSource, /\.mms-article-entry-skeleton\.is-directory/);
  assert.match(cssSource, /\.mms-article-skeleton-line\.is-toc-row/);
});

test("debug mode records runtime operations and exposes a clipboard command", async () => {
  const [mainSource, settingsSource, typesSource, debugSource] = await Promise.all([
    readFile(path.join(rootDir, "src/main.ts"), "utf8"),
    readFile(path.join(rootDir, "src/settings.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/editor-types.ts"), "utf8"),
    readFile(path.join(rootDir, "src/debug/runtime-debug.ts"), "utf8")
  ]);
  assert.match(settingsSource, /debugMode: boolean/);
  assert.match(settingsSource, /调试模式/);
  assert.match(mainSource, /id: "copy-mind-map-debug-log"/);
  assert.match(mainSource, /copyDebugLogToClipboard/);
  assert.match(mainSource, /installRuntimeDebugCapture/);
  assert.match(mainSource, /resolveNavigationFocusNode/);
  assert.match(typesSource, /onDebugLog:/);
  assert.match(debugSource, /MAX_ENTRIES = 5000/);
  assert.match(debugSource, /不会|document content|editable text/i);
});

test("article semantic navigation is latest-wins and never captures the page shell as the root node", async () => {
  const editorSource = await readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8");
  const captureLocation = editorSource.match(/private captureCurrentLocation\([\s\S]*?\n  \}/)?.[0] ?? "";
  const beginRestore = editorSource.match(/private beginReadingLocationRestore\([\s\S]*?\n  \}/)?.[0] ?? "";
  const cancelRestore = editorSource.match(/private cancelReadingLocationRestore\([\s\S]*?\n  \}/)?.[0] ?? "";
  const setOptions = editorSource.match(/setOptions\(options: MindMapEditorOptions, articleContextOnly = false\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(captureLocation, /\.mms-article-document-title\[data-node-id\], \.mms-article-node\[data-node-id\]/);
  assert.doesNotMatch(captureLocation, /querySelectorAll<HTMLElement>\("\[data-node-id\]"\)/);
  assert.match(captureLocation, /anchorY >= rect\.top && anchorY < rect\.bottom/);
  assert.match(beginRestore, /this\.cancelReadingLocationRestore\(\)/);
  assert.match(beginRestore, /activeReadingRestore\?\.token !== token/);
  assert.match(beginRestore, /new ResizeObserver/);
  assert.match(beginRestore, /readingRestoreDeadlineTimer[\s\S]*5000/);
  assert.doesNotMatch(beginRestore, /finishWhenQuiet/);
  assert.match(cancelRestore, /readingRestoreToken \+= 1/);
  assert.match(setOptions, /activeRestoreLocation[\s\S]*activeReadingRestore\?\.mode === this\.currentMode/);
  assert.match(editorSource, /\["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", " "\]\.includes\(event\.key\)[\s\S]*cancelReadingLocationRestore/);
});

test("article-context refreshes skip redundant current-page rebuilds", async () => {
  const [editorSource, viewSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/view.ts"), "utf8")
  ]);
  assert.match(editorSource, /setOptions\(options: MindMapEditorOptions, articleContextOnly = false\)/);
  assert.match(editorSource, /const articleContextPresentationChanged =/);
  assert.match(editorSource, /if \(articleContextOnly[\s\S]*?this\.currentMode !== "reading"[\s\S]*?articleContextPresentationChanged\)\) return/);
  assert.match(viewSource, /this\.editor\?\.setOptions\(this\.getEditorOptions\(preferCurrentFile, preferredCurrentNodeId\), true\)/);
});

test("article return paths preserve the parent mount node", async () => {
  const [editorSource, rendererSource, mainSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8"),
    readFile(path.join(rootDir, "src/main.ts"), "utf8")
  ]);
  assert.match(rendererSource, /onOpenArticleDirectory\(navigation\.parentPath!, navigation\.parentNodeId\)/);
  assert.match(editorSource, /onOpenArticleDirectory\(this\.options\.articleNavigation\.parentPath, this\.options\.articleNavigation\.parentNodeId\)/);
  assert.match(mainSource, /parentNodeId/);
});
