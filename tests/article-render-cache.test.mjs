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


test("article renderer restores cached nodes inside the frame budget and excludes asynchronous code nodes", async () => {
  const source = await readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8");
  assert.match(source, /compatibleArticleCache\(options\.articleCache/);
  assert.match(source, /articleNodeRenderFingerprint\(info\.node/);
  assert.doesNotMatch(source, /documentFingerprint:\s*articleCacheFingerprint\(options\.document\)/);
  assert.match(source, /const cachedEntries = new Map<string, ArticleNodeRenderCacheEntry>\(\)/);
  const setupStart = source.indexOf("  for (const info of infos) {");
  const batchStart = source.indexOf("  const renderBatch = (startIndex: number): void => {");
  const setupSource = source.slice(setupStart, batchStart);
  const batchSource = source.slice(batchStart, source.indexOf("  if (!orderedIds.length)", batchStart));
  assert.doesNotMatch(setupSource, /restoreCachedArticleSection\(/, "cache HTML must not be restored before the first frame batch");
  assert.match(batchSource, /restoreCachedArticleSection\(section, cached\.html, info, options\)/);
  assert.match(batchSource, /hydrateArticleNodeSection\(section, info, options\)/);
  assert.match(source, /return !articleNodeContentBlocks\(node, options\)\.some\(\(block\) => block\.type === "code"\)/);
  assert.match(source, /options\.onArticleCacheUpdate\(snapshot\)/);
});

test("cached article hydration indexes block elements and memoizes normalized blocks per render", async () => {
  const [source, modesSource] = await Promise.all([
    readFile(path.join(rootDir, "src/editor/article-renderer.ts"), "utf8"),
    readFile(path.join(rootDir, "src/article/modes.ts"), "utf8")
  ]);
  assert.match(source, /contentBlockCache\?: WeakMap<MindMapNode, MindMapContentBlock\[\]>/);
  assert.match(source, /contentBlockCache: new WeakMap\(\)/);
  assert.match(source, /function articleNodeContentBlocks\(/);
  assert.match(source, /buildArticleNodeInfo\([\s\S]*?\(node\) => articleNodeContentBlocks\(node, options\)/);
  assert.match(modesSource, /primaryText: \(node: MindMapNode\) => string = nodePrimaryText/);
  assert.match(modesSource, /const title = primaryText\(child\)/);
  assert.match(source, /const blockElements = indexArticleBlockElements\(section\)/);
  assert.match(source, /querySelectorAll<HTMLElement>\("\[data-block-id\]"\)/);
  assert.match(source, /index\.get\(blockId\)\?\.find\(\(element\) => element\.matches\(selector\)\)/);
  assert.doesNotMatch(source, /Array\.from\(container\.querySelectorAll<HTMLElement>\(selector\)\)/);
});

test("article cache persists access-only LRU changes and skips clean flushes", async () => {
  const { module, cleanup } = await loadTypeScriptModule(modulePath);
  const previousWindow = globalThis.window;
  globalThis.window = globalThis;
  try {
    const initial = {
      schemaVersion: module.ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
      entries: [{
        schemaVersion: module.ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
        rendererRevision: module.ARTICLE_RENDERER_REVISION,
        filePath: "folder/older.mindmap",
        documentFingerprint: "doc-old",
        presentationFingerprint: "view-a",
        nodes: { n1: { fingerprint: "node-old", html: "<p>older</p>" } },
        updatedAt: 1,
        lastAccessedAt: 1
      }, {
        schemaVersion: module.ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
        rendererRevision: module.ARTICLE_RENDERER_REVISION,
        filePath: "folder/newer.mindmap",
        documentFingerprint: "doc-new",
        presentationFingerprint: "view-a",
        nodes: { n1: { fingerprint: "node-new", html: "<p>newer</p>" } },
        updatedAt: 2,
        lastAccessedAt: 2
      }]
    };
    let stored = JSON.stringify(initial);
    let writes = 0;
    const adapter = {
      async exists(target) { return target === "cache/article-render-cache.json" ? Boolean(stored) : target === "cache"; },
      async read() { return stored; },
      async write(_target, value) { writes += 1; stored = value; },
      async mkdir() {}
    };
    const store = new module.ArticleRenderCacheStore(adapter, "cache", "cache/article-render-cache.json");
    await store.initialize();
    await store.flush();
    assert.equal(writes, 0, "a clean cache must not rewrite its disk file during unload");

    assert.ok(store.get("folder/older.mindmap"));
    await store.flush();
    assert.equal(writes, 1);
    const persisted = JSON.parse(stored).entries;
    assert.equal(persisted.at(-1).filePath, "folder/older.mindmap", "cache hits must persist cross-restart LRU order");
    assert.ok(persisted.at(-1).lastAccessedAt > 1);

    assert.ok(store.get("folder/older.mindmap"));
    await store.flush();
    assert.equal(writes, 1, "reopening the already newest cache entry must not cause another disk write");
  } finally {
    globalThis.window = previousWindow;
    await cleanup();
  }
});

test("article cache coalesces updates that arrive during an active disk write", async () => {
  const { module, cleanup } = await loadTypeScriptModule(modulePath);
  const previousWindow = globalThis.window;
  globalThis.window = globalThis;
  try {
    let stored = "";
    const writes = [];
    let releaseFirstWrite;
    let firstWriteStarted;
    const started = new Promise((resolve) => { firstWriteStarted = resolve; });
    const gate = new Promise((resolve) => { releaseFirstWrite = resolve; });
    const adapter = {
      async exists(target) { return target === "cache"; },
      async read() { return stored; },
      async write(_target, value) {
        writes.push(JSON.parse(value));
        if (writes.length === 1) {
          firstWriteStarted();
          await gate;
        }
        stored = value;
      },
      async mkdir() {}
    };
    const base = {
      schemaVersion: module.ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
      rendererRevision: module.ARTICLE_RENDERER_REVISION,
      filePath: "folder/map.mindmap",
      documentFingerprint: "doc-a",
      presentationFingerprint: "view-a",
      nodes: { n1: { fingerprint: "node-a", html: "<p>a</p>" } },
      updatedAt: 1,
      lastAccessedAt: 1
    };
    const store = new module.ArticleRenderCacheStore(adapter, "cache", "cache/article-render-cache.json");
    await store.initialize();
    store.put(base);
    const flushing = store.flush();
    await started;
    store.put({ ...base, documentFingerprint: "doc-b", nodes: { n1: { fingerprint: "node-b", html: "<p>b</p>" } } });
    releaseFirstWrite();
    await flushing;

    assert.equal(writes.length, 2, "one active write should absorb all later changes into one follow-up snapshot");
    assert.equal(writes[0].entries[0].documentFingerprint, "doc-a");
    assert.equal(writes[1].entries[0].documentFingerprint, "doc-b");
    assert.equal(JSON.parse(stored).entries[0].nodes.n1.html, "<p>b</p>");
  } finally {
    globalThis.window = previousWindow;
    await cleanup();
  }
});
