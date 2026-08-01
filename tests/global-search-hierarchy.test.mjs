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

test("resolveHierarchicalEntries basic parent-child relations", () => {
  const files = {
    "parent.mindmap": {
      mtime: 0,
      size: 0,
      title: "Parent Map",
      entries: [
        { breadcrumb: ["Parent Map", "Node 1"], nodeId: "1", filePath: "parent.mindmap", fileTitle: "Parent Map", key: "1", nodeText: "Node 1", depth: 1, searchableText: "node 1" }
      ]
    },
    "child.mindmap": {
      mtime: 0,
      size: 0,
      title: "Child Map",
      navigation: {
        parentPath: "parent.mindmap",
        parentTitle: "Parent Map",
        parentNodeText: "Node 1",
        parentNodeId: "1"
      },
      entries: [
        { breadcrumb: ["Child Map", "Node 2"], nodeId: "2", filePath: "child.mindmap", fileTitle: "Child Map", key: "2", nodeText: "Node 2", depth: 1, searchableText: "node 2" }
      ]
    }
  };

  const resolved = searchModule.resolveHierarchicalEntries(files);

  const parentEntry = resolved.find(e => e.filePath === "parent.mindmap");
  const childEntry = resolved.find(e => e.filePath === "child.mindmap");

  assert.deepEqual(parentEntry.mapHierarchy, ["Parent Map"]);
  assert.deepEqual(parentEntry.hierarchyBreadcrumb, ["Parent Map", "Node 1"]);
  assert.deepEqual(childEntry.mapHierarchy, ["Parent Map", "Node 1", "Child Map"]);
  assert.deepEqual(childEntry.hierarchyBreadcrumb, ["Parent Map", "Node 1", "Child Map", "Node 2"]);
});

test("resolveHierarchicalEntries overlapping merge", () => {
  const files = {
    "parent.mindmap": {
      mtime: 0,
      size: 0,
      title: "Ancient Poetry",
      entries: [
        { breadcrumb: ["Ancient Poetry", "Tang Dynasty"], nodeId: "1", filePath: "parent.mindmap", fileTitle: "Ancient Poetry", key: "1", nodeText: "Tang Dynasty", depth: 1, searchableText: "tang dynasty" }
      ]
    },
    "child.mindmap": {
      mtime: 0,
      size: 0,
      title: "Tang Dynasty",
      navigation: {
        parentPath: "parent.mindmap",
        parentTitle: "Ancient Poetry",
        parentNodeText: "Tang Dynasty",
        parentNodeId: "1"
      },
      entries: [
        { breadcrumb: ["Tang Dynasty", "Li Bai"], nodeId: "2", filePath: "child.mindmap", fileTitle: "Tang Dynasty", key: "2", nodeText: "Li Bai", depth: 1, searchableText: "li bai" }
      ]
    }
  };

  const resolved = searchModule.resolveHierarchicalEntries(files);
  const childEntry = resolved.find(e => e.filePath === "child.mindmap");

  // Should merge Ancient Poetry > Tang Dynasty with Tang Dynasty > Li Bai to Ancient Poetry > Tang Dynasty > Li Bai
  assert.deepEqual(childEntry.mapHierarchy, ["Ancient Poetry", "Tang Dynasty"]);
  assert.deepEqual(childEntry.hierarchyBreadcrumb, ["Ancient Poetry", "Tang Dynasty", "Li Bai"]);
});

test("resolveHierarchicalEntries cycle detection", () => {
  const files = {
    "a.mindmap": {
      mtime: 0,
      size: 0,
      title: "Map A",
      navigation: { parentPath: "b.mindmap", parentTitle: "Map B", parentNodeText: "Node B" },
      entries: [
        { breadcrumb: ["Map A", "Node A"], nodeId: "1", filePath: "a.mindmap", fileTitle: "Map A", key: "1", nodeText: "Node A", depth: 1, searchableText: "node a" }
      ]
    },
    "b.mindmap": {
      mtime: 0,
      size: 0,
      title: "Map B",
      navigation: { parentPath: "a.mindmap", parentTitle: "Map A", parentNodeText: "Node A" },
      entries: [
        { breadcrumb: ["Map B", "Node B"], nodeId: "2", filePath: "b.mindmap", fileTitle: "Map B", key: "2", nodeText: "Node B", depth: 1, searchableText: "node b" }
      ]
    }
  };

  const resolved = searchModule.resolveHierarchicalEntries(files);
  const aEntry = resolved.find(e => e.filePath === "a.mindmap");

  // Basic check that it doesn't infinite loop, and falls back gracefully.
  // When a tries to resolve, it goes to b. b goes to a, cycle detected. b falls back to parent info from its navigation [Map A, Node A].
  // Then a gets [Map A, Node A, Map B, Node B] or similar.
  assert.ok(Array.isArray(aEntry.hierarchyBreadcrumb));
});
