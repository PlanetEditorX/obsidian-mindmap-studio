import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let nodeActions;
let cleanup;

before(async () => {
  const graph = [
    "src/core/model.ts",
    "src/core/node-tree.ts",
    "src/editor/node-actions.ts"
  ];
  const loaded = await loadTypeScriptModules(graph, "src/editor/node-actions.ts");
  nodeActions = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

/** 构造一个测试节点；默认无文字、无内容块，因此是空白节点。 */
function node(id, extra = {}) {
  return { id, text: "", children: [], ...extra };
}

function textNode(id, text, children = []) {
  return { id, text, children };
}

test("isNodeEmpty treats text-only nodes with blank content as empty", () => {
  assert.equal(nodeActions.isNodeEmpty(node("a")), true, "没有内容块的节点视为空白");
  assert.equal(nodeActions.isNodeEmpty(textNode("a", "   ")), true, "纯空白文字视为空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", {
    text: " ",
    content: [{ id: "b1", type: "text", text: "" }, { id: "b2", type: "text", text: " \n " }]
  })), true, "多个空白文字块仍是空白节点");
});

test("isNodeEmpty keeps nodes that carry any real content", () => {
  assert.equal(nodeActions.isNodeEmpty(textNode("a", "正文")), false, "有文字不是空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", { image: "Assets/图.png" })), false, "有图片不是空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", { table: { rows: [["单元格"]] } })), false, "有表格不是空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", { code: { language: "js", content: "let a = 1;" } })), false, "有代码块不是空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", {
    content: [{ id: "f1", type: "file", source: "Assets/报告.pdf", name: "报告.pdf" }]
  })), false, "有文件块不是空白");
});

test("isNodeEmpty keeps structural and auxiliary node data", () => {
  assert.equal(nodeActions.isNodeEmpty(node("a", { submap: { path: "子导图.mindmap" } })), false, "带子导图引用的节点必须保留");
  assert.equal(nodeActions.isNodeEmpty(node("a", { note: "备注" })), false, "有备注不是空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", { link: "https://example.com" })), false, "有链接不是空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", { icon: "star" })), false, "有图标不是空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", { tags: ["标签"] })), false, "有标签不是空白");
  assert.equal(nodeActions.isNodeEmpty(node("a", { question: { mode: "choice" } })), false, "题目节点不是空白");
});

test("removeEmptyNodes deletes blank leaves and reports the count", () => {
  const root = node("root");
  root.children = [textNode("keep", "正文"), node("blank-1"), node("blank-2"), textNode("keep-2", "另一个")];
  assert.equal(nodeActions.removeEmptyNodes(root), 2);
  assert.deepEqual(root.children.map((child) => child.id), ["keep", "keep-2"]);
  assert.equal(nodeActions.removeEmptyNodes(root), 0, "再次清理不应继续删除");
});

test("removeEmptyNodes promotes children of a blank node to its own position", () => {
  const root = node("root");
  const a1 = textNode("a1", "A1");
  const a2 = textNode("a2", "A2");
  const blank = node("blank", { children: [a1, a2] });
  root.children = [textNode("head", "开头"), blank, textNode("tail", "结尾")];
  assert.equal(nodeActions.removeEmptyNodes(root), 1);
  assert.deepEqual(root.children.map((child) => child.id), ["head", "a1", "a2", "tail"], "子节点必须原地提升并保持顺序");
  assert.equal(root.children[1], a1, "提升的是原节点引用，不是副本");
});

test("removeEmptyNodes resolves blank chains in a single pass", () => {
  const root = node("root");
  const head = textNode("head", "开头");
  const tail = textNode("tail", "结尾");
  root.children = [head, node("blank-1", { children: [node("blank-2", { children: [node("blank-3", { children: [tail] })] })] })];
  assert.equal(nodeActions.removeEmptyNodes(root), 3, "连续空白链上的每一层都必须计数");
  assert.deepEqual(root.children.map((child) => child.id), ["head", "tail"]);
});

test("removeEmptyNodes never removes the root even when it is blank", () => {
  const root = node("root", { children: [textNode("keep", "正文")] });
  assert.equal(nodeActions.removeEmptyNodes(root), 0);
  assert.equal(root.children.length, 1);
  const emptyRoot = node("root");
  emptyRoot.children = [textNode("keep", "正文")];
  assert.equal(nodeActions.removeEmptyNodes(emptyRoot), 0);
  assert.equal(emptyRoot.id, "root", "根节点始终保留");
});

test("removeEmptyNodes keeps non-empty nodes untouched and handles deep chains", () => {
  const root = node("root");
  const keep = textNode("keep", "正文");
  root.children = [keep];
  assert.equal(nodeActions.removeEmptyNodes(root), 0);
  assert.equal(root.children[0], keep, "有内容的节点不得被替换或重建");
  const deepRoot = node("root");
  let cursor = deepRoot;
  for (let index = 0; index < 2000; index += 1) {
    const next = index === 1999 ? textNode("leaf", "底部正文") : node(`blank-${index}`);
    cursor.children = [next];
    cursor = next;
  }
  assert.equal(nodeActions.removeEmptyNodes(deepRoot), 1999, "深链不应触发递归栈溢出");
  assert.deepEqual(deepRoot.children.map((child) => child.id), ["leaf"]);
});

test("empty-node cleanup walks the tree with an explicit stack instead of recursion", async () => {
  const source = await readFile("src/editor/node-actions.ts", "utf8");
  assert.match(source, /export function removeEmptyNodes\(root: MindMapNode\): number \{/);
  assert.match(source, /const stack: MindMapNode\[\] = \[root\];/, "清理遍历必须使用显式栈");
  assert.doesNotMatch(source, /removeEmptyNodes[\s\S]{0,400}?removeEmptyNodes\(/, "导出入口不得递归调用自身");
});
