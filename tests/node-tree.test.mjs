import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let nodeTree;
let cleanup;

before(async () => {
  const result = await loadTypeScriptModule("src/core/node-tree.ts");
  nodeTree = result.module;
  cleanup = result.cleanup;
});

after(async () => {
  if (cleanup) await cleanup();
});

function createNode(id, children = []) {
  return { id, text: `Node ${id}`, children };
}

test("walkNodes visits every node in depth-first order and provides the correct parent", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1"), createNode("a2")]),
    createNode("b")
  ]);

  const visited = [];
  nodeTree.walkNodes(root, (node, parent) => {
    visited.push({ id: node.id, parentId: parent ? parent.id : null });
  });

  assert.deepEqual(visited, [
    { id: "root", parentId: null },
    { id: "a", parentId: "root" },
    { id: "a1", parentId: "a" },
    { id: "a2", parentId: "a" },
    { id: "b", parentId: "root" }
  ]);
});

test("flattenNodes returns an array of nodes in depth-first order", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1"), createNode("a2")]),
    createNode("b")
  ]);

  const flattened = nodeTree.flattenNodes(root);
  assert.equal(flattened.length, 5);
  assert.equal(flattened[0].id, "root");
  assert.equal(flattened[1].id, "a");
  assert.equal(flattened[2].id, "a1");
  assert.equal(flattened[3].id, "a2");
  assert.equal(flattened[4].id, "b");
});

test("findNode locates a node by its stable ID", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1"), createNode("a2")]),
    createNode("b")
  ]);

  const found = nodeTree.findNode(root, "a1");
  assert.ok(found);
  assert.equal(found.id, "a1");

  const notFound = nodeTree.findNode(root, "non-existent");
  assert.equal(notFound, null);
});

test("findParent locates the direct parent of a specified node", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1"), createNode("a2")]),
    createNode("b")
  ]);

  const parent = nodeTree.findParent(root, "a1");
  assert.ok(parent);
  assert.equal(parent.id, "a");

  const rootParent = nodeTree.findParent(root, "root");
  assert.equal(rootParent, null);

  const nonExistentParent = nodeTree.findParent(root, "non-existent");
  assert.equal(nonExistentParent, null);
});

test("findAncestors returns the path from root to the parent of the target node", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1", [createNode("a1_1")]), createNode("a2")]),
    createNode("b")
  ]);

  const ancestors = nodeTree.findAncestors(root, "a1_1");
  assert.equal(ancestors.length, 3);
  assert.equal(ancestors[0].id, "root");
  assert.equal(ancestors[1].id, "a");
  assert.equal(ancestors[2].id, "a1");

  const rootAncestors = nodeTree.findAncestors(root, "root");
  assert.equal(rootAncestors.length, 0);

  const notFoundAncestors = nodeTree.findAncestors(root, "non-existent");
  assert.equal(notFoundAncestors.length, 0);
});

test("containsNode checks if a node exists in the tree", () => {
  const root = createNode("root", [createNode("a")]);

  assert.equal(nodeTree.containsNode(root, "a"), true);
  assert.equal(nodeTree.containsNode(root, "b"), false);
  assert.equal(nodeTree.containsNode(root, "root"), true);
});

test("removeNode deletes a node from the tree and returns true if successful", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1"), createNode("a2")]),
    createNode("b")
  ]);

  const result = nodeTree.removeNode(root, "a1");
  assert.equal(result, true);
  assert.equal(nodeTree.containsNode(root, "a1"), false);
  assert.equal(root.children[0].children.length, 1);

  const nonExistentResult = nodeTree.removeNode(root, "non-existent");
  assert.equal(nonExistentResult, false);

  // Root cannot be removed by removeNode
  const rootResult = nodeTree.removeNode(root, "root");
  assert.equal(rootResult, false);
});

test("moveNodeRelative correctly moves a node before another node", () => {
  const root = createNode("root", [
    createNode("a"),
    createNode("b", [createNode("b1"), createNode("b2")])
  ]);

  const result = nodeTree.moveNodeRelative(root, "b1", "a", "before");
  assert.equal(result, true);
  assert.equal(root.children[0].id, "b1");
  assert.equal(root.children[1].id, "a");
  assert.equal(root.children[2].id, "b");
  assert.equal(root.children[2].children.length, 1);
});

test("moveNodeRelative correctly moves a node after another node", () => {
  const root = createNode("root", [
    createNode("a"),
    createNode("b", [createNode("b1"), createNode("b2")])
  ]);

  const result = nodeTree.moveNodeRelative(root, "b1", "a", "after");
  assert.equal(result, true);
  assert.equal(root.children[0].id, "a");
  assert.equal(root.children[1].id, "b1");
  assert.equal(root.children[2].id, "b");
  assert.equal(root.children[2].children.length, 1);
});

test("moveNodeRelative correctly moves a node inside another node as a child", () => {
  const root = createNode("root", [
    createNode("a"),
    createNode("b", [createNode("b1"), createNode("b2")])
  ]);

  const result = nodeTree.moveNodeRelative(root, "b1", "a", "child");
  assert.equal(result, true);
  assert.equal(root.children[0].id, "a");
  assert.equal(root.children[0].children[0].id, "b1");
  assert.equal(root.children[0].collapsed, false);
  assert.equal(root.children[1].id, "b");
  assert.equal(root.children[1].children.length, 1);
});

test("moveNodeRelative fails when moving a node into its own descendant", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1")])
  ]);

  const result = nodeTree.moveNodeRelative(root, "a", "a1", "child");
  assert.equal(result, false);
});

test("moveNodeRelative fails when draggedId is root or targetId", () => {
  const root = createNode("root", [createNode("a")]);

  assert.equal(nodeTree.moveNodeRelative(root, "root", "a", "child"), false);
  assert.equal(nodeTree.moveNodeRelative(root, "a", "a", "child"), false);
});

test("buildNodeTreeIndex provides stable DFS nodes plus O(1) node and parent lookups", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1"), createNode("a2")]),
    createNode("b")
  ]);

  const index = nodeTree.buildNodeTreeIndex(root);
  assert.deepEqual(index.nodes.map((node) => node.id), ["root", "a", "a1", "a2", "b"]);
  assert.equal(index.byId.get("a1"), root.children[0].children[0]);
  assert.equal(index.parentById.get("a1"), root.children[0]);
  assert.equal(index.parentById.get("root"), null);
  assert.equal(index.hasCollapsibleNodes, true);
});

test("indexed ancestor helpers climb parent links without rescanning subtrees", () => {
  const root = createNode("root", [
    createNode("a", [createNode("a1", [createNode("a1_1")]), createNode("a2")]),
    createNode("b")
  ]);
  const index = nodeTree.buildNodeTreeIndex(root);

  assert.deepEqual(nodeTree.indexedAncestors(index, "a1_1").map((node) => node.id), ["root", "a", "a1"]);
  assert.equal(nodeTree.indexedHasAncestor(index, "a1_1", "a"), true);
  assert.equal(nodeTree.indexedHasAncestor(index, "a", "a1_1"), false);
  assert.equal(nodeTree.indexedHasAnyAncestor(index, "a1_1", new Set(["a", "b"])), true);
  assert.equal(nodeTree.indexedHasAnyAncestor(index, "a2", new Set(["a1", "b"])), false);
  assert.equal(nodeTree.indexedHasAnyAncestor(index, "missing", new Set(["root"])), false);
});

test("moveNodeRelative reuses a provided tree index for the first structural move", () => {
  const root = createNode("root", [
    createNode("a"),
    createNode("b", [createNode("b1"), createNode("b2")])
  ]);
  const index = nodeTree.buildNodeTreeIndex(root);

  const result = nodeTree.moveNodeRelative(root, "b1", "a", "child", index);
  assert.equal(result, true);
  assert.deepEqual(root.children.map((node) => node.id), ["a", "b"]);
  assert.deepEqual(root.children[0].children.map((node) => node.id), ["b1"]);
  assert.deepEqual(root.children[1].children.map((node) => node.id), ["b2"]);
});
