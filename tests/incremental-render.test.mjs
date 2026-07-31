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
  assert.match(editorSource, /renderArticleMode\(this\.articleEl, this\.articleRendererOptions\(incremental\)\)/);
  assert.match(editorSource, /this\.articleEl\.setAttr\("aria-busy", "true"\)/);
  assert.match(articleSource, /class ArticleIncrementalRenderOptions|interface ArticleIncrementalRenderOptions/);
  assert.match(articleSource, /mms-article-node is-render-pending/);
  assert.match(articleSource, /window\.requestAnimationFrame\(\(\) => renderBatch\(index\)\)/);
});

test("progressive article rerenders preserve viewport height and correct the semantic anchor after every batch", async () => {
  const [editorSource, articleSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8")
  ]);
  assert.match(editorSource, /articleRenderViewportSnapshot: \{ top: number; left: number; height: number \} \| null/);
  assert.match(editorSource, /loading\.style\.minHeight = `\$\{viewportSnapshot\.height\}px`/);
  assert.match(editorSource, /onProgress: \(\) => this\.maintainArticleRenderViewport\(token\)/);
  assert.match(editorSource, /target\.hasClass\("is-render-pending"\)/);
  assert.match(editorSource, /const restoredSemanticLocation = this\.maintainPendingArticleLocation\(\)/);
  assert.match(editorSource, /if \(!restoredSemanticLocation && snapshot\) this\.articleEl\.scrollTop = snapshot\.top/);
  assert.match(articleSource, /onProgress: \(\) => void/);
  assert.match(articleSource, /options\.incremental\?\.onProgress\(\)/);
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
