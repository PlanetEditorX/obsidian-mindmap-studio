import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(rootDir, "src/article/article-render-cache.ts");

test("article cache fingerprints are stable across object key order and change with node content", async () => {
  const { module, cleanup } = await loadTypeScriptModule(modulePath);
  try {
    assert.equal(module.stableStringify({ b: 2, a: 1 }), module.stableStringify({ a: 1, b: 2 }));
    assert.equal(module.articleCacheFingerprint({ b: 2, a: 1 }), module.articleCacheFingerprint({ a: 1, b: 2 }));
    assert.notEqual(module.articleCacheFingerprint({ text: "old" }), module.articleCacheFingerprint({ text: "new" }));
    assert.equal(module.normalizeArticleCachePath("./folder\\map.mindmap"), "folder/map.mindmap");
    const baseNode = { id: "root", text: "root", children: [{ id: "child", text: "old", children: [] }] };
    const changedDescendant = { id: "root", text: "root", children: [{ id: "child", text: "new", children: [] }] };
    assert.equal(
      module.articleNodeRenderFingerprint(baseNode, { depth: 1, label: "一、" }),
      module.articleNodeRenderFingerprint(changedDescendant, { depth: 1, label: "一、" }),
      "descendant edits must not invalidate an unchanged ancestor section"
    );
    assert.notEqual(
      module.articleNodeRenderFingerprint(baseNode, { depth: 1, label: "一、" }),
      module.articleNodeRenderFingerprint({ ...baseNode, text: "renamed" }, { depth: 1, label: "一、" })
    );
    assert.notEqual(
      module.articleNodeRenderFingerprint(baseNode, { depth: 1, label: "一、" }),
      module.articleNodeRenderFingerprint(baseNode, { depth: 2, label: "（一）" })
    );
  } finally {
    await cleanup();
  }
});

test("article cache store preloads snapshots for synchronous view opening and persists updates", async () => {
  const { module, cleanup } = await loadTypeScriptModule(modulePath);
  const previousWindow = globalThis.window;
  globalThis.window = globalThis;
  try {
    const initial = {
      schemaVersion: module.ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
      entries: [{
        schemaVersion: module.ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
        rendererRevision: module.ARTICLE_RENDERER_REVISION,
        filePath: "folder/map.mindmap",
        documentFingerprint: "doc-a",
        presentationFingerprint: "view-a",
        nodes: { n1: { fingerprint: "node-a", html: "<p>cached</p>" } },
        updatedAt: 1,
        lastAccessedAt: 1
      }]
    };
    let stored = JSON.stringify(initial);
    const adapter = {
      async exists(target) { return target === "cache/article-render-cache.json" ? Boolean(stored) : target === "cache"; },
      async read() { return stored; },
      async write(_target, value) { stored = value; },
      async mkdir() {}
    };
    const store = new module.ArticleRenderCacheStore(adapter, "cache", "cache/article-render-cache.json");
    await store.initialize();
    assert.equal(store.get("folder\\map.mindmap")?.nodes.n1.html, "<p>cached</p>");
    store.put({
      ...initial.entries[0],
      documentFingerprint: "doc-b",
      nodes: { n1: { fingerprint: "node-b", html: "<p>updated</p>" } }
    });
    await store.flush();
    const persisted = JSON.parse(stored);
    assert.equal(persisted.entries[0].documentFingerprint, "doc-b");
    assert.equal(persisted.entries[0].nodes.n1.html, "<p>updated</p>");
  } finally {
    globalThis.window = previousWindow;
    await cleanup();
  }
});

test("article cache restores oldest-to-newest LRU order before pruning", async () => {
  const { module, cleanup } = await loadTypeScriptModule(modulePath);
  const previousWindow = globalThis.window;
  globalThis.window = globalThis;
  try {
    const entries = Array.from({ length: 24 }, (_, index) => ({
      schemaVersion: module.ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
      rendererRevision: module.ARTICLE_RENDERER_REVISION,
      filePath: `folder/map-${index + 1}.mindmap`,
      documentFingerprint: `doc-${index + 1}`,
      presentationFingerprint: "view-a",
      nodes: { root: { fingerprint: `node-${index + 1}`, html: `<p>${index + 1}</p>` } },
      updatedAt: index + 1,
      lastAccessedAt: index + 1
    }));
    let stored = JSON.stringify({ schemaVersion: module.ARTICLE_RENDER_CACHE_SCHEMA_VERSION, entries });
    const adapter = {
      async exists(target) { return target === "cache/article-render-cache.json" ? Boolean(stored) : target === "cache"; },
      async read() { return stored; },
      async write(_target, value) { stored = value; },
      async mkdir() {}
    };
    const store = new module.ArticleRenderCacheStore(adapter, "cache", "cache/article-render-cache.json");
    await store.initialize();
    store.put({ ...entries.at(-1), filePath: "folder/map-25.mindmap", documentFingerprint: "doc-25" });
    await store.flush();
    const paths = JSON.parse(stored).entries.map((entry) => entry.filePath);
    assert.equal(paths.length, 24);
    assert.ok(!paths.includes("folder/map-1.mindmap"), "the least recently used preload must be evicted first");
    assert.ok(paths.includes("folder/map-24.mindmap"), "the newest preload must survive pruning");
    assert.ok(paths.includes("folder/map-25.mindmap"));
  } finally {
    globalThis.window = previousWindow;
    await cleanup();
  }
});

test("article renderer restores unchanged nodes before hydration and excludes asynchronous code nodes", async () => {
  const source = await readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8");
  assert.match(source, /compatibleArticleCache\(options\.articleCache/);
  assert.match(source, /articleNodeRenderFingerprint\(info\.node/);
  assert.doesNotMatch(source, /documentFingerprint:\s*articleCacheFingerprint\(options\.document\)/);
  assert.match(source, /restoreCachedArticleSection\(section, cached\.html/);
  assert.match(source, /cachedIds\.add\(info\.node\.id\)/);
  assert.match(source, /hydrateArticleNodeSection\(section, info, options\)/);
  assert.match(source, /return !nodeContentBlocks\(node\)\.some\(\(block\) => block\.type === "code"\)/);
  assert.match(source, /options\.onArticleCacheUpdate\(snapshot\)/);
});
