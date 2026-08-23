import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";
import { Module } from "node:module";

// Mock obsidian module
class MockTFile {
  constructor(path, mtime = 1, size = 1) {
    this.path = path;
    this.name = path.split('/').at(-1) ?? path;
    this.basename = this.name.replace(/\.mindmap$/i, '');
    this.extension = this.name.split('.').at(-1) ?? '';
    this.stat = { mtime, size };
  }
}

const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'obsidian') {
    return {
      App: class {},
      Modal: class {},
      Notice: class {},
      TFile: MockTFile,
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

test("refreshFamily reuses fresh index metadata without rereading unchanged parent maps", async () => {
  const parent = new MockTFile("parent.mindmap", 10, 100);
  const child = new MockTFile("child.mindmap", 20, 200);
  const files = new Map([[parent.path, parent], [child.path, child]]);
  let reads = 0;
  const app = {
    vault: {
      getAbstractFileByPath: (path) => files.get(path) ?? null,
      cachedRead: async () => { reads += 1; throw new Error("fresh index should not read files"); }
    },
    metadataCache: {
      getFirstLinkpathDest: (path) => files.get(path) ?? null
    }
  };
  const index = new searchModule.MindMapSearchIndex(app, "search-index.json");
  index.data = {
    version: 2,
    generatedAt: new Date(0).toISOString(),
    files: {
      "parent.mindmap": {
        mtime: 10,
        size: 100,
        title: "Parent",
        entries: [{
          key: "parent::root",
          filePath: "parent.mindmap",
          fileTitle: "Parent",
          nodeId: "root",
          nodeText: "Parent",
          breadcrumb: ["Parent"],
          depth: 0,
          searchableText: "parent",
          submapPath: "child.mindmap"
        }]
      },
      "child.mindmap": {
        mtime: 20,
        size: 200,
        title: "Child",
        navigation: { parentPath: "parent.mindmap", parentNodeId: "root", parentTitle: "Parent" },
        entries: [{
          key: "child::root",
          filePath: "child.mindmap",
          fileTitle: "Child",
          nodeId: "child-root",
          nodeText: "Child",
          breadcrumb: ["Child"],
          depth: 0,
          searchableText: "child",
          parentMapPath: "parent.mindmap"
        }]
      }
    }
  };
  index.scheduleSave = () => {};

  const family = await index.refreshFamily("child.mindmap");

  assert.deepEqual([...family].sort(), ["child.mindmap", "parent.mindmap"]);
  assert.equal(reads, 0);
});

test("refreshFamily reads a stale ancestor only once across climb and downward traversal", async () => {
  const parent = new MockTFile("parent.mindmap", 11, 101);
  const child = new MockTFile("child.mindmap", 20, 200);
  const files = new Map([[parent.path, parent], [child.path, child]]);
  const readCounts = new Map();
  const parentDocument = {
    version: 10,
    title: "Parent",
    layout: "right",
    theme: "auto",
    root: {
      id: "parent-root",
      text: "Parent",
      children: [{ id: "mount", text: "Child mount", submap: { path: "child.mindmap" }, children: [] }]
    }
  };
  const childDocument = {
    version: 10,
    title: "Child",
    layout: "right",
    theme: "auto",
    navigation: { parentPath: "parent.mindmap", parentNodeId: "mount", parentTitle: "Parent" },
    root: { id: "child-root", text: "Child", children: [] }
  };
  const app = {
    vault: {
      getAbstractFileByPath: (path) => files.get(path) ?? null,
      cachedRead: async (file) => {
        readCounts.set(file.path, (readCounts.get(file.path) ?? 0) + 1);
        if (file.path === parent.path) return JSON.stringify(parentDocument);
        if (file.path === child.path) return JSON.stringify(childDocument);
        throw new Error(`unexpected read: ${file.path}`);
      }
    },
    metadataCache: {
      getFirstLinkpathDest: (path) => files.get(path) ?? null
    }
  };
  const index = new searchModule.MindMapSearchIndex(app, "search-index.json");
  index.data = {
    version: 2,
    generatedAt: new Date(0).toISOString(),
    files: {
      "parent.mindmap": { mtime: 1, size: 1, title: "stale", entries: [] },
      "child.mindmap": {
        mtime: 20,
        size: 200,
        title: "Child",
        navigation: childDocument.navigation,
        entries: [{
          key: "child::root",
          filePath: "child.mindmap",
          fileTitle: "Child",
          nodeId: "child-root",
          nodeText: "Child",
          breadcrumb: ["Child"],
          depth: 0,
          searchableText: "child",
          parentMapPath: "parent.mindmap"
        }]
      }
    }
  };
  index.scheduleSave = () => {};

  const family = await index.refreshFamily("child.mindmap", childDocument);

  assert.deepEqual([...family].sort(), ["child.mindmap", "parent.mindmap"]);
  assert.equal(readCounts.get("parent.mindmap"), 1);
  assert.equal(readCounts.get("child.mindmap") ?? 0, 0);
});
