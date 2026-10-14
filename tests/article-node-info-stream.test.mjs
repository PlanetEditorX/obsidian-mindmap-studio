import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { build } from "esbuild";

let tempDir;
let modes;
let model;
let modesSource;

before(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mindmap-article-info-"));
  const modesOut = join(tempDir, "modes.cjs");
  const modelOut = join(tempDir, "model.cjs");
  await Promise.all([
    build({ entryPoints: ["src/article/modes.ts"], outfile: modesOut, bundle: true, platform: "node", format: "cjs", logLevel: "silent" }),
    build({ entryPoints: ["src/core/model.ts"], outfile: modelOut, bundle: true, platform: "node", format: "cjs", logLevel: "silent" })
  ]);
  const require = createRequire(import.meta.url);
  modes = require(modesOut);
  model = require(modelOut);
  modesSource = await readFile("src/article/modes.ts", "utf8");
});

after(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

/** 覆盖标题/末端/关闭编号/深层嵌套/多级同级的文章结构。 */
function articleFixture() {
  const document = model.createDefaultDocument("总纲");
  const numbering = model.createNode("速算技巧");
  numbering.children = ["百化分", "截位直除", "分数化简", "增长率", "比重", "平均数"].map((title) => model.createNode(title));
  const nested = model.createNode("资料分析");
  const level3 = model.createNode("一级子章节");
  level3.children = [model.createNode("二级末端一"), model.createNode("二级末端二"), model.createNode("二级末端三")];
  nested.children = [level3, model.createNode("同层末端"), model.createNode("另一末端")];
  const disabled = model.createNode("关闭编号章节");
  disabled.articleNumberingMode = "none";
  disabled.children = [model.createNode("N-1"), model.createNode("N-2")];
  const manual = model.createNode("手动层级章节");
  manual.articleNumberingMode = "manual";
  manual.articleNumberingLevel = 4;
  manual.children = [model.createNode("M-1")];
  document.root.children = [numbering, nested, disabled, manual, model.createNode("顶层末端"), model.createNode("顶层末端二")];
  return document;
}

/** 只保留与产物相关的字段，便于逐项比较。 */
function signature(infos) {
  return infos.map((info) => [
    info.node.id, info.depth, info.label, info.title, info.displayTitle, info.isHeading,
    info.numberedLeaf, info.leafNumberingStyle ?? null, info.leafNumberingIndex ?? null, info.skipped, info.anchor
  ]);
}

const OPTION_SETS = [
  { enabled: false, threshold: 4 },
  { enabled: true, threshold: 2, style: "circled" },
  { enabled: true, threshold: 1, style: "next-level" },
  { enabled: true, threshold: 2, style: "circled", numberingDisabled: true }
];

test("iterateArticleNodeInfo yields exactly what buildArticleNodeInfo collects", () => {
  const document = articleFixture();
  for (const [optionIndex, options] of OPTION_SETS.entries()) {
    for (const baseDepth of [0, 1, 3]) {
      const eager = modes.buildArticleNodeInfo(document.root, baseDepth, options);
      const lazy = [...modes.iterateArticleNodeInfo(document.root, baseDepth, options)];
      assert.ok(eager.length > 0, "用例必须覆盖到实际节点");
      assert.deepEqual(
        signature(lazy),
        signature(eager),
        `迭代器与全量构建在 options#${optionIndex} / baseDepth=${baseDepth} 上必须逐字段一致`
      );
    }
  }
});

test("iterateArticleNodeInfo is lazy: pulling one item does not traverse the whole tree", () => {
  const document = model.createDefaultDocument("惰性");
  const section = model.createNode("章节");
  section.children = Array.from({ length: 500 }, (_, index) => model.createNode(`要点 ${index + 1}`));
  document.root.children = [section];
  let visited = 0;
  const iterator = modes.iterateArticleNodeInfo(document.root, 0, { enabled: false, threshold: 4 }, (node) => {
    visited += 1;
    return model.nodePrimaryText(node);
  });
  assert.equal(typeof iterator.next, "function", "必须返回可逐步拉取的迭代器");
  const first = iterator.next();
  assert.equal(first.done, false);
  assert.equal(first.value.node.id, section.id, "首次产出必须是最靠前的节点");
  assert.ok(visited <= 1, "拉取一项不得遍历整棵树");
});

test("iterateArticleNodeInfo survives a very deep chain without stack overflow", () => {
  const document = model.createDefaultDocument("深链");
  let cursor = document.root;
  const depth = 6000;
  for (let index = 0; index < depth; index += 1) {
    const node = model.createNode(`层 ${index}`);
    cursor.children = [node];
    cursor = node;
  }
  let count = 0;
  for (const info of modes.iterateArticleNodeInfo(document.root, 0, { enabled: false, threshold: 4 })) {
    count += 1;
    assert.ok(info.node, "深链每一项都必须带节点");
  }
  assert.equal(count, depth, "深链导图的每个节点都必须被产出");
});

test("article node info iteration contract stays explicit-stack and backs the eager API", () => {
  assert.match(modesSource, /export function\* iterateArticleNodeInfo\(\n  root: MindMapNode,/);
  assert.match(modesSource, /\): Generator<ArticleNodeInfo, void, void> \{/);
  assert.match(modesSource, /const stack: ArticleInfoFrame\[\] = \[createFrame\(root, articleChildStartLevel\(root, baseDepth\)\)\];/);
  assert.match(modesSource, /while \(stack\.length\) \{/);
  assert.match(modesSource, /return Array\.from\(iterateArticleNodeInfo\(root, baseDepth, leafNumbering, primaryText\)\);/);
  assert.doesNotMatch(modesSource, /^\s*yield\*/m, "深链上递归 yield* 会退化为 O(节点数 × 深度)，遍历必须用显式栈");
});
