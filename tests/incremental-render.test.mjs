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
  assert.match(applyLocation, /if \(!target\) return false/);
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
  assert.match(focusNode, /this\.options\.showArticleToc/);
  assert.match(focusNode, /articleLandingMode: "article"/);
  assert.match(focusNode, /pendingArticleFocusLocation = location/);
  assert.match(focusNode, /if \(this\.currentMode !== "article"\) this\.restoreReadingLocation/);
  assert.match(renderArticle, /const requestedLocation = this\.pendingArticleFocusLocation/);
  assert.match(renderArticle, /const previousLocation = !requestedLocation/);
  assert.match(renderArticle, /if \(requestedLocation\) this\.restoreReadingLocation\("article", requestedLocation\)/);
  assert.match(renderDirectory, /entry\.filePath === options\.currentFilePath && entry\.nodeId/);
  assert.match(renderDirectory, /options\.focusNode\(entry\.nodeId\)/);
  assert.doesNotMatch(focusNode, /scrollIntoView/);
});

test("article-context refreshes skip redundant current-page rebuilds", async () => {
  const [editorSource, viewSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/view.ts"), "utf8")
  ]);
  assert.match(editorSource, /setOptions\(options: MindMapEditorOptions, articleContextOnly = false\)/);
  assert.match(editorSource, /const articleContextPresentationChanged =/);
  assert.match(editorSource, /if \(articleContextOnly[\s\S]*?this\.currentMode !== "reading"[\s\S]*?articleContextPresentationChanged\)\) return/);
  assert.match(viewSource, /this\.editor\?\.setOptions\(this\.getEditorOptions\(preferCurrentFile\), true\)/);
});

test("article return paths preserve the parent mount node", async () => {
  const [editorSource, rendererSource, mainSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8"),
    readFile(path.join(rootDir, "src/main.ts"), "utf8")
  ]);
  assert.match(rendererSource, /onOpenMindMap\(navigation\.parentPath!, navigation\.parentNodeId\)/);
  assert.match(editorSource, /onOpenMindMap\(this\.options\.articleNavigation\.parentPath, this\.options\.articleNavigation\.parentNodeId\)/);
  assert.match(mainSource, /parentNodeId/);
});
