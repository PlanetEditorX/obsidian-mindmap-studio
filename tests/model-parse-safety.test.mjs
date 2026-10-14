import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let modelSource;
let cleanup;

before(async () => {
  const result = await loadTypeScriptModules(
    ["src/core/model.ts", "src/core/node-tree.ts"],
    "src/core/model.ts"
  );
  model = result.module;
  cleanup = result.cleanup;
  modelSource = await readFile("src/core/model.ts", "utf8");
});

after(async () => {
  if (cleanup) await cleanup();
});

/** 直接拼接出任意深度的合法 JSON 节点链，避免 JSON.stringify 自身的递归深度限制。 */
function deepJson(depth) {
  const open = '{"root":{"id":"root","text":"r","children":[';
  const child = '{"id":"n","text":"n","children":[';
  // depth 个中间节点各自关闭自己的 children 数组与对象，再加根节点的那一对，最后补上最外层包裹对象。
  const closers = Array.from({ length: depth + 1 }, () => "]}").join("") + "}";
  return open + child.repeat(depth) + closers;
}

/** 直接构造任意深度的节点对象链，用于绕过 JSON 环节单独验证规范化。 */
function deepDocumentInput(depth) {
  const root = { id: "root", text: "r", children: [] };
  let current = root;
  for (let index = 0; index < depth; index += 1) {
    const child = { id: `n${index}`, text: "n", children: [] };
    current.children.push(child);
    current = child;
  }
  return { root };
}

/** 用迭代方式测量节点链深度，测试自身不得依赖递归。 */
function measureChainDepth(root) {
  let node = root;
  let depth = 0;
  while (node.children.length === 1) {
    node = node.children[0];
    depth += 1;
  }
  return depth;
}

// 旧实现里 normalizeNode 递归展开子树，约低数千层就会栈溢出；显式栈版本必须能处理远超调用栈的深度。
test("normalizeDocument handles a node chain far deeper than the call stack", () => {
  const DEPTH = 20000;
  const document = model.normalizeDocument(deepDocumentInput(DEPTH), "深层文档");
  assert.equal(measureChainDepth(document.root), DEPTH);
  assert.equal(document.title, "深层文档");
});

// 关键回归：深链合法 JSON 曾被递归规范化抛出的栈溢出吞掉，静默降级成 Markdown 导入，
// 表现为根节点文字变成整段原始 JSON。修复后必须真正解析为节点树。
test("parseDocument keeps deeply nested valid JSON instead of silently importing Markdown", () => {
  const DEPTH = 20000;
  const document = model.parseDocument(deepJson(DEPTH), "深层文档");
  assert.equal(measureChainDepth(document.root), DEPTH);
  assert.equal(document.root.text, "r");
});

test("parseDocument falls back to Markdown import only for JSON syntax errors", () => {
  const document = model.parseDocument("{ 这并不是 JSON }", "笔记");
  assert.equal(document.title, "笔记");
  // Markdown 导入的纯文本不会产生子节点；若被误当成 JSON 成功解析，这里会出现子节点。
  assert.equal(document.root.children.length, 0);
});

test("parseJsonDocument only swallows JSON syntax errors and rethrows everything else", () => {
  const body = modelSource.match(/function parseJsonDocument\(value: string, fallbackTitle: string\): MindMapDocument \| null \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.ok(body, "parseJsonDocument should remain in model.ts");
  assert.match(body, /catch \(error\) \{\s*if \(error instanceof SyntaxError\) return null;\s*throw error;\s*\}/);
  assert.match(body, /return normalizeDocument\(parsed as Partial<MindMapDocument>, fallbackTitle\);/);
  assert.doesNotMatch(
    modelSource,
    /try \{\s*return normalizeDocument\(JSON\.parse/,
    "JSON 解析与规范化不得共用一个宽泛 catch，否则规范化错误会静默降级成 Markdown"
  );
});
