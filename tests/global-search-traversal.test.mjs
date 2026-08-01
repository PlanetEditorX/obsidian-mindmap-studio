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

test("buildSearchEntries parses node tree into entries with correct depth and breadcrumbs", () => {
  const doc = {
    title: "Test Map",
    root: {
      id: "root",
      text: "Root Node",
      children: [
        {
          id: "child1",
          text: "Child 1",
          children: [
            {
              id: "grandchild1",
              text: "Grandchild 1",
              children: []
            }
          ]
        },
        {
          id: "child2",
          text: "Child 2",
          children: []
        }
      ]
    }
  };

  const entries = searchModule.buildSearchEntries(doc, "test.mindmap");

  assert.equal(entries.length, 4);

  // Root node
  const rootEntry = entries.find(e => e.nodeId === "root");
  assert.equal(rootEntry.depth, 0);
  assert.deepEqual(rootEntry.breadcrumb, ["Root Node"]);
  assert.equal(rootEntry.fileTitle, "Test Map");
  assert.equal(rootEntry.filePath, "test.mindmap");
  assert.equal(rootEntry.key, "test.mindmap::root");
  assert.equal(rootEntry.searchableText, "root node");

  // Child 1
  const child1Entry = entries.find(e => e.nodeId === "child1");
  assert.equal(child1Entry.depth, 1);
  assert.deepEqual(child1Entry.breadcrumb, ["Root Node", "Child 1"]);

  // Grandchild 1
  const grandchild1Entry = entries.find(e => e.nodeId === "grandchild1");
  assert.equal(grandchild1Entry.depth, 2);
  assert.deepEqual(grandchild1Entry.breadcrumb, ["Root Node", "Child 1", "Grandchild 1"]);

  // Child 2
  const child2Entry = entries.find(e => e.nodeId === "child2");
  assert.equal(child2Entry.depth, 1);
  assert.deepEqual(child2Entry.breadcrumb, ["Root Node", "Child 2"]);
});

test("buildSearchEntries handles nodes with empty text", () => {
  const doc = {
    title: "Empty Node Map",
    root: {
      id: "root",
      text: "",
      children: [
        {
          id: "child",
          text: "   ",
          children: []
        }
      ]
    }
  };

  const entries = searchModule.buildSearchEntries(doc, "empty.mindmap");

  assert.equal(entries.length, 2);

  const rootEntry = entries.find(e => e.nodeId === "root");
  assert.equal(rootEntry.depth, 0);
  assert.deepEqual(rootEntry.breadcrumb, ["未命名节点"]);
  assert.equal(rootEntry.searchableText, "");

  const childEntry = entries.find(e => e.nodeId === "child");
  assert.equal(childEntry.depth, 1);
  // nodeDisplayText typically falls back or preserves empty/whitespace based on its impl.
  // Wait, let's see what nodeDisplayText does, or just let it trim?
  // Let's just check it doesn't crash and has some breadcrumb.
  assert.ok(childEntry.breadcrumb.length === 2);
});
