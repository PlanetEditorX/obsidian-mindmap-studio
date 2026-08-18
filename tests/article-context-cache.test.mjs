import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheModulePath = path.join(rootDir, "src/article/article-context-cache.ts");
const graph = [
  path.join(rootDir, "src/core/node-tree.ts"),
  path.join(rootDir, "src/core/model.ts"),
  path.join(rootDir, "src/article/modes.ts"),
  cacheModulePath
];

function document(title = "章节") {
  return {
    version: 10,
    title,
    layout: "right",
    theme: "auto",
    root: { id: `root-${title}`, text: title, children: [] }
  };
}

function context(filePath = "book/chapter.mindmap") {
  return {
    baseDepth: 1,
    tocEntries: [{
      filePath,
      nodeId: "n1",
      depth: 2,
      tocDepth: 1,
      label: "第一节",
      title: "章节",
      displayTitle: "第一节 章节",
      breadcrumb: ["书", "章节"]
    }],
    showToc: false,
    navigation: {
      entries: [],
      currentIndex: 0,
      homePath: "book/root.mindmap",
      parentPath: "book/root.mindmap",
      parentNodeId: "mount"
    },
    readingSections: [
      { filePath: "book/root.mindmap", document: document("书"), baseDepth: 0 },
      { filePath, document: document("章节"), baseDepth: 1, parentFilePath: "book/root.mindmap", parentNodeId: "mount" }
    ]
  };
}

const revisions = {
  "book/root.mindmap": { path: "book/root.mindmap", mtime: 100, size: 1000 },
  "book/chapter.mindmap": { path: "book/chapter.mindmap", mtime: 200, size: 2000 }
};

test("article context cache persists, preloads synchronously, isolates callers, and invalidates changed dependencies", async () => {
  const { module, cleanup } = await loadTypeScriptModules(graph, cacheModulePath);
  const previousWindow = globalThis.window;
  globalThis.window = globalThis;
  try {
    let stored = "";
    const adapter = {
      async exists(target) { return target === "cache" || (target === "cache/article-context-cache.json" && Boolean(stored)); },
      async read() { return stored; },
      async write(_target, value) { stored = value; },
      async mkdir() {}
    };
    const dependencies = Object.values(revisions);
    const store = new module.ArticleContextCacheStore(adapter, "cache", "cache/article-context-cache.json");
    await store.initialize();
    store.put("book/chapter.mindmap", context(), dependencies);
    await store.flush();

    const first = store.get("book\\chapter.mindmap", (filePath) => revisions[filePath] ?? null);
    assert.ok(first);
    first.readingSections[0].document.root.text = "被调用方修改";
    const second = store.get("book/chapter.mindmap", (filePath) => revisions[filePath] ?? null);
    assert.equal(second?.readingSections[0].document.root.text, "书", "cache hits must return isolated document objects");

    const restarted = new module.ArticleContextCacheStore(adapter, "cache", "cache/article-context-cache.json");
    await restarted.initialize();
    assert.equal(restarted.get("book/chapter.mindmap", (filePath) => revisions[filePath] ?? null)?.tocEntries.length, 1);

    const changed = { ...revisions, "book/root.mindmap": { path: "book/root.mindmap", mtime: 101, size: 1000 } };
    assert.equal(restarted.get("book/chapter.mindmap", (filePath) => changed[filePath] ?? null), null, "one changed family dependency must invalidate the whole context");
    await restarted.flush();
    assert.equal(JSON.parse(stored).entries.length, 0, "invalidated snapshots must be removed from persistent cache");
  } finally {
    globalThis.window = previousWindow;
    await cleanup();
  }
});

test("article context invalidation removes every cached page that depends on the modified family file", async () => {
  const { module, cleanup } = await loadTypeScriptModules(graph, cacheModulePath);
  const previousWindow = globalThis.window;
  globalThis.window = globalThis;
  try {
    let stored = "";
    const adapter = {
      async exists(target) { return target === "cache"; },
      async read() { return stored; },
      async write(_target, value) { stored = value; },
      async mkdir() {}
    };
    const store = new module.ArticleContextCacheStore(adapter, "cache", "cache/article-context-cache.json");
    await store.initialize();
    store.put("book/chapter.mindmap", context(), Object.values(revisions));
    const rootContext = context("book/root.mindmap");
    rootContext.readingSections = [{ filePath: "book/root.mindmap", document: document("书"), baseDepth: 0 }];
    store.put("book/root.mindmap", rootContext, [revisions["book/root.mindmap"]]);

    store.invalidateDependency("book/root.mindmap");
    assert.equal(store.get("book/chapter.mindmap", (filePath) => revisions[filePath] ?? null), null);
    assert.equal(store.get("book/root.mindmap", (filePath) => revisions[filePath] ?? null), null);
  } finally {
    globalThis.window = previousWindow;
    await cleanup();
  }
});

test("mind map document cache is revision-aware and returns editable clones", async () => {
  const { module, cleanup } = await loadTypeScriptModules(graph, cacheModulePath);
  try {
    const cache = new module.MindMapDocumentCache();
    const revision = revisions["book/chapter.mindmap"];
    cache.put(revision, document("章节"));
    const first = cache.get(revision);
    assert.ok(first);
    first.root.text = "本地编辑";
    assert.equal(cache.get(revision)?.root.text, "章节");
    assert.equal(cache.get({ ...revision, mtime: revision.mtime + 1 }), null, "mtime changes must invalidate parsed documents");
  } finally {
    await cleanup();
  }
});

test("persistent article context rejects sections that are not covered by dependency revisions", async () => {
  const { module, cleanup } = await loadTypeScriptModules(graph, cacheModulePath);
  const previousWindow = globalThis.window;
  globalThis.window = globalThis;
  try {
    const stored = JSON.stringify({
      schemaVersion: module.ARTICLE_CONTEXT_CACHE_SCHEMA_VERSION,
      entries: [{
        schemaVersion: module.ARTICLE_CONTEXT_CACHE_SCHEMA_VERSION,
        cacheRevision: module.ARTICLE_CONTEXT_CACHE_REVISION,
        filePath: "book/chapter.mindmap",
        dependencies: [revisions["book/chapter.mindmap"]],
        context: context(),
        updatedAt: 1,
        lastAccessedAt: 1
      }]
    });
    const adapter = {
      async exists() { return true; },
      async read() { return stored; },
      async write() {},
      async mkdir() {}
    };
    const store = new module.ArticleContextCacheStore(adapter, "cache", "cache/article-context-cache.json");
    await store.initialize();
    assert.equal(store.get("book/chapter.mindmap", (filePath) => revisions[filePath] ?? null), null);
  } finally {
    globalThis.window = previousWindow;
    await cleanup();
  }
});

test("view and plugin wire cache hits into the real article opening path", async () => {
  const [viewSource, mainSource, bundleSource] = await Promise.all([
    readFile(path.join(rootDir, "src/view.ts"), "utf8"),
    readFile(path.join(rootDir, "src/main.ts"), "utf8"),
    readFile(path.join(rootDir, "main.js"), "utf8")
  ]);
  const setViewData = viewSource.slice(
    viewSource.indexOf("setViewData(data: string, clear: boolean): void"),
    viewSource.indexOf("  clear(): void", viewSource.indexOf("setViewData(data: string, clear: boolean): void"))
  );
  assert.ok(setViewData.indexOf("getCachedMindMapDocument") < setViewData.indexOf("parseDocument(data, title)"));
  assert.ok(setViewData.indexOf("getCachedArticleContext") < setViewData.indexOf("new MindMapEditor"));
  assert.match(setViewData, /if \(cachedArticleContext\)[\s\S]*this\.articleContextReady = true/);
  assert.match(setViewData, /if \(cachedArticleContext\)[\s\S]*this\.preferCurrentFileOnNextContextRefresh = false[\s\S]*else \{[\s\S]*this\.scheduleArticleContextRefresh\(0\)/);
  assert.match(setViewData, /this\.plugin\.invalidateMindMapCaches\(this\.file\.path\)/);

  const refresh = viewSource.slice(
    viewSource.indexOf("private async refreshArticleContext(): Promise<void>"),
    viewSource.indexOf("private applyViewClasses", viewSource.indexOf("private async refreshArticleContext(): Promise<void>"))
  );
  assert.match(refresh, /const cacheRevision = this\.plugin\.getMindMapCacheRevision\(\)/);
  assert.match(refresh, /this\.plugin\.cacheArticleContext\(file, context, cacheRevision\)/);

  assert.ok(mainSource.indexOf("await this.articleContextCache.initialize()") < mainSource.indexOf("this.registerView(VIEW_TYPE_MINDMAP_STUDIO"));
  assert.match(mainSource, /private async readMindMapDocument\(file: TFile\)[\s\S]*getCachedMindMapDocument\(file\)[\s\S]*cachedRead\(file\)/);
  assert.match(mainSource, /this\.app\.vault\.on\("modify"[\s\S]*this\.invalidateMindMapCaches\(file\.path\)/);
  assert.match(mainSource, /cacheArticleContext\(file: TFile, context: ArticleContextData, buildRevision: number\)[\s\S]*buildRevision !== this\.mindMapCacheRevision/);
  assert.match(bundleSource, /article-context-cache-v1/);
  assert.match(bundleSource, /getCachedArticleContext\(file, currentDocument\)/);
  assert.match(bundleSource, /"article-context", "cache-hit"/);
});


test("clean article navigation skips vault writes so cached family revisions survive a directory round trip", async () => {
  const [viewSource, bundleSource] = await Promise.all([
    readFile(path.join(rootDir, "src/view.ts"), "utf8"),
    readFile(path.join(rootDir, "main.js"), "utf8")
  ]);
  const setViewData = viewSource.slice(
    viewSource.indexOf("setViewData(data: string, clear: boolean): void"),
    viewSource.indexOf("  clear(): void", viewSource.indexOf("setViewData(data: string, clear: boolean): void"))
  );
  const saveSource = viewSource.slice(
    viewSource.indexOf("async save(clear?: boolean): Promise<void>"),
    viewSource.indexOf("  async onClose", viewSource.indexOf("async save(clear?: boolean): Promise<void>"))
  );
  assert.match(setViewData, /this\.documentChangeRevision = 0;[\s\S]*this\.savedDocumentChangeRevision = 0;/);
  assert.match(setViewData, /onChange: \(document, options\) => \{[\s\S]*this\.documentChangeRevision \+= 1;[\s\S]*invalidateMindMapCaches/);
  assert.match(saveSource, /const saveRevision = this\.documentChangeRevision/);
  assert.match(saveSource, /if \(saveRevision === this\.savedDocumentChangeRevision\) \{[\s\S]*save-skipped-clean[\s\S]*return;/);
  assert.ok(saveSource.indexOf("save-skipped-clean") < saveSource.indexOf("await super.save(clear)"), "clean navigation must return before TextFileView writes the vault file");
  assert.match(saveSource, /if \(this\.documentChangeRevision === saveRevision\) this\.savedDocumentChangeRevision = saveRevision/);
  assert.match(viewSource, /articleContextCacheHit: this\.articleContextCacheHit/);
  assert.match(bundleSource, /"view", "save-skipped-clean"/);
  assert.match(bundleSource, /this\.documentChangeRevision \+= 1/);
  assert.match(bundleSource, /articleContextCacheHit: this\.articleContextCacheHit/);
});
