import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let nodeActions;
let dragDrop;
let cleanupModel;
let cleanupActions;
let cleanupDragDrop;

before(async () => {
  const graph = [
    "src/core/model.ts",
    "src/core/node-tree.ts",
    "src/editor/node-actions.ts",
    "src/editor/drag-drop.ts"
  ];
  const modelResult = await loadTypeScriptModules(graph, "src/core/model.ts");
  model = modelResult.module;
  cleanupModel = modelResult.cleanup;
  const actionsResult = await loadTypeScriptModules(graph, "src/editor/node-actions.ts");
  nodeActions = actionsResult.module;
  cleanupActions = actionsResult.cleanup;
  const dragResult = await loadTypeScriptModules(graph, "src/editor/drag-drop.ts");
  dragDrop = dragResult.module;
  cleanupDragDrop = dragResult.cleanup;
});

after(async () => {
  if (cleanupModel) await cleanupModel();
  if (cleanupActions) await cleanupActions();
  if (cleanupDragDrop) await cleanupDragDrop();
});

function node(id, children = []) {
  return { id, text: id, children };
}

function fixture() {
  return node("root", [
    node("a", [node("a1"), node("a2")]),
    node("b", [node("b1")])
  ]);
}

test("top-level multi-selection filtering reuses parent links and preserves DFS-compatible input order", () => {
  const root = fixture();
  const index = model.buildNodeTreeIndex(root);
  assert.deepEqual(nodeActions.topLevelSelectedNodeIds(root, ["a", "a1", "b1"], index), ["a", "b1"]);
});

test("deletion fallback uses the indexed direct parent and sibling order", () => {
  const root = fixture();
  const index = model.buildNodeTreeIndex(root);
  assert.equal(nodeActions.deletionSelectionFallback(root, ["a1"], index), "a2");
});

test("drag validation rejects moving a branch into its own descendant with an existing index", () => {
  const root = fixture();
  const index = model.buildNodeTreeIndex(root);
  assert.equal(dragDrop.canMoveNodes(root, new Set(["a"]), "a", "a1", index), false);
  assert.equal(dragDrop.canMoveNodes(root, new Set(["a1"]), "a1", "b", index), true);
});

test("insertSiblingAfter can resolve the target parent from the shared index", () => {
  const root = fixture();
  const index = model.buildNodeTreeIndex(root);
  assert.equal(nodeActions.insertSiblingAfter(root, "a1", node("new"), index), true);
  assert.deepEqual(root.children[0].children.map((child) => child.id), ["a1", "new", "a2"]);
});
