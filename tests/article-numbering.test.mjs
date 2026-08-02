import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let modes;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/article/modes.ts"
  ], "src/article/modes.ts");
  modes = loaded.module;
  cleanup = loaded.cleanup;

  const loadedModel = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts"
  ], "src/core/model.ts");
  model = loadedModel.module;
  const modesCleanup = cleanup;
  cleanup = async () => {
    await modesCleanup?.();
    await loadedModel.cleanup?.();
  };
});

after(async () => cleanup?.());

test("article numbering stops after the eighth supported level instead of cycling to A again", () => {
  assert.equal(modes.articleNumberLabel(7, 5), "E.");
  assert.equal(modes.articleNumberLabel(8, 1), "（A）");
  assert.equal(modes.articleNumberLabel(8, 2), "（B）");
  assert.equal(modes.articleNumberLabel(9, 1), "");
  assert.equal(modes.articleNumberLabel(10, 1), "");
});

test("alphabetic article numbering remains unique beyond Z", () => {
  assert.equal(modes.articleNumberLabel(7, 26), "Z.");
  assert.equal(modes.articleNumberLabel(7, 27), "AA.");
  assert.equal(modes.articleNumberLabel(8, 52), "（AZ）");
  assert.equal(modes.articleNumberLabel(8, 53), "（BA）");
});

test("children below a level-eight heading keep structure without receiving a recycled A or B prefix", () => {
  const heading = (text, children = [model.createNode(`${text} 正文`)]) => {
    const node = model.createNode(text);
    node.children = children;
    return node;
  };

  const keyword = heading("关键词区分");
  const dimension = heading("维度区分");
  const partA = heading("前置说明");
  const partB = heading("如何区分", [keyword, dimension]);
  const fifth = heading("第五部分", [partA, partB]);
  const root = model.createNode("根节点");
  root.articleNumberingMode = "manual";
  root.articleNumberingLevel = 7;
  root.children = [
    heading("第一部分"),
    heading("第二部分"),
    heading("第三部分"),
    heading("第四部分"),
    fifth
  ];

  const infos = modes.buildArticleNodeInfo(root);
  const byTitle = new Map(infos.map((info) => [info.title, info]));
  assert.equal(byTitle.get("第五部分")?.label, "E.");
  assert.equal(byTitle.get("前置说明")?.label, "（A）");
  assert.equal(byTitle.get("如何区分")?.label, "（B）");
  assert.equal(byTitle.get("关键词区分")?.depth, 9);
  assert.equal(byTitle.get("关键词区分")?.label, "");
  assert.equal(byTitle.get("维度区分")?.label, "");
  assert.equal(byTitle.get("关键词区分")?.displayTitle, "关键词区分");
});
