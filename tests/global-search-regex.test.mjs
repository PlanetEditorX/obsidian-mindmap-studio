import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";
import { Module } from "node:module";

// Mock obsidian module
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'obsidian') {
    return {
      App: class {},
      Modal: class {},
      Notice: class {},
      TFile: class {},
      normalizePath: (p) => p,
      setIcon: () => {}
    };
  }
  return originalRequire.apply(this, arguments);
};

let searchModule;
let cleanupFn;

before(async () => {
  const { module, cleanup } = await loadTypeScriptModules(
    ["src/search/global-search.ts", "src/core/model.ts", "src/core/node-tree.ts"],
    "src/search/global-search.ts"
  );
  searchModule = module;
  cleanupFn = cleanup;
});

after(async () => {
  if (cleanupFn) {
    await cleanupFn();
  }
  Module.prototype.require = originalRequire;
});

test("searchEntries invalid regex parsing fallback returns empty array", () => {
  const entries = [
    {
      key: "1",
      filePath: "test.md",
      fileTitle: "test",
      nodeId: "1",
      nodeText: "hello world",
      breadcrumb: [],
      depth: 0,
      searchableText: "hello world"
    }
  ];

  // Unclosed parenthesis (invalid regex)
  const result1 = searchModule.searchEntries(entries, "(hello", 100, true);
  assert.deepEqual(result1, []);

  // Unclosed bracket (invalid regex)
  const result2 = searchModule.searchEntries(entries, "[hello", 100, true);
  assert.deepEqual(result2, []);
});

test("searchEntries valid regex matches correctly", () => {
  const entries = [
    {
      key: "1",
      filePath: "test.md",
      fileTitle: "test",
      nodeId: "1",
      nodeText: "hello world",
      breadcrumb: [],
      depth: 0,
      searchableText: "hello world"
    },
    {
      key: "2",
      filePath: "test2.md",
      fileTitle: "test2",
      nodeId: "2",
      nodeText: "goodbye world",
      breadcrumb: [],
      depth: 0,
      searchableText: "goodbye world"
    }
  ];

  const result = searchModule.searchEntries(entries, "hello|world", 100, true);
  // Both match "world", but wait... resultSnippet requires entries to have proper structure if matched.
  // Actually, if we look at searchEntries it calls resultSnippet(entry, query, true) which might expect more fields?
  // Let's just check the length for now, or use a simpler mock if it fails.
  assert.equal(result.length, 2);
});
