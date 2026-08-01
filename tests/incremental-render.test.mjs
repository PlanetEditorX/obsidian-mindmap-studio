import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(rootDir, "src/render/incremental-render.ts");

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

test("article priority hydrates focused hierarchy first without changing final document order", async () => {
  const { module, cleanup } = await loadTypeScriptModule(modulePath);
  try {
    assert.deepEqual(
      module.prioritizeArticleNodeIds(["a", "a1", "a2", "b", "b1"], ["a2", "a1", "a", "b", "root"]),
      ["a2", "a1", "a", "b", "b1"]
    );
  } finally {
    await cleanup();
  }
});

test("editor contracts keep text commits local and defer large article rendering until after a paint", async () => {
  const [editorSource, articleSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8")
  ]);
  assert.match(editorSource, /this\.mutateInlineText\(node\.id, \(\) => \{/);
  assert.match(editorSource, /prioritizeSpatialRenderItems\(/);
  assert.match(editorSource, /this\.articleRenderFrame = window\.requestAnimationFrame\(\(\) => \{/);
  assert.match(editorSource, /renderArticleMode\(stage, this\.articleRendererOptions\(incremental\)\)/);
  assert.match(editorSource, /this\.articleEl\.setAttr\("aria-busy", "true"\)/);
  assert.match(articleSource, /class ArticleIncrementalRenderOptions|interface ArticleIncrementalRenderOptions/);
  assert.match(articleSource, /mms-article-node is-render-pending/);
  assert.match(articleSource, /window\.requestAnimationFrame\(\(\) => renderBatch\(index\)\)/);
});

test("progressive article rerenders retain the visible page while a hidden replacement is built", async () => {
  const [editorSource, articleSource, cssSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8"),
    readFile(path.join(rootDir, "styles.css"), "utf8")
  ]);
  assert.match(editorSource, /articleRenderViewportSnapshot: \{ top: number; left: number; height: number \} \| null/);
  assert.match(editorSource, /articleRenderStageEl: HTMLElement \| null/);
  assert.match(editorSource, /previousPage\.addClass\("is-render-retained"\)/);
  assert.match(editorSource, /mms-article-loading-shell/);
  assert.match(editorSource, /mms-article-transition-overlay/);
  assert.match(editorSource, /mms-article-render-stage/);
  assert.match(editorSource, /previousPage\?\.isConnected\) previousPage\.replaceWith\(page\)/);
  assert.match(editorSource, /onProgress: \(\) => this\.maintainArticleRenderViewport\(token\)/);
  assert.match(editorSource, /target\.hasClass\("is-render-pending"\)/);
  assert.match(editorSource, /const restoredSemanticLocation = page \? this\.maintainPendingArticleLocation\(\) : false/);
  assert.match(editorSource, /if \(!restoredSemanticLocation\) this\.articleEl\.scrollTop = snapshot\.top/);
  assert.match(articleSource, /onProgress: \(\) => void/);
  assert.match(articleSource, /options\.incremental\?\.onProgress\(\)/);
  assert.doesNotMatch(cssSource, /\.mms-article-view\.is-progressive-rendering\s*\{[^}]*cursor:\s*progress/s);
  assert.match(cssSource, /\.mms-article-page\.is-render-retained/);
  assert.match(cssSource, /\.mms-article-page\.is-render-entering/);
  assert.match(cssSource, /\.mms-article-transition-overlay\.is-leaving/);
});

test("article transition cleanup cannot leave hidden stages or stale loading overlays behind", async () => {
  const editorSource = await readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8");
  assert.match(editorSource, /this\.articleRenderStageEl\?\.remove\(\)/);
  assert.match(editorSource, /this\.articleRenderOverlayEl\?\.remove\(\)/);
  assert.match(editorSource, /this\.articleRenderPreviousPageEl\?\.removeClass\("is-render-retained"\)/);
  assert.match(editorSource, /this\.articleEl\?\.querySelector<HTMLElement>\(":scope > \.mms-article-loading-shell"\)\?\.remove\(\)/);
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


test("first article load skeleton fills the current viewport instead of showing only a few lines", async () => {
  const [editorSource, cssSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "styles.css"), "utf8")
  ]);
  assert.match(editorSource, /const viewportHeight = Math\.max\(this\.articleEl\.clientHeight, Math\.round\(window\.innerHeight \* 0\.72\), 520\)/);
  assert.match(editorSource, /const lineCount = Math\.max\(18, Math\.ceil\(\(viewportHeight - 150\) \/ 30\)\)/);
  assert.match(editorSource, /mms-article-loading-shell-subtitle/);
  assert.match(cssSource, /\.mms-article-loading-shell \{[\s\S]*width: calc\(100% - 24px\);[\s\S]*max-width: none;[\s\S]*--mms-loading-shell-height/);
});
