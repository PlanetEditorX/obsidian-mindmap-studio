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

test("circled terminal numbering uses Unicode through 50 and a numeric CSS fallback afterwards", () => {
  assert.equal(modes.circledNumberLabel(1), "①");
  assert.equal(modes.circledNumberLabel(20), "⑳");
  assert.equal(modes.circledNumberLabel(21), "㉑");
  assert.equal(modes.circledNumberLabel(35), "㉟");
  assert.equal(modes.circledNumberLabel(36), "㊱");
  assert.equal(modes.circledNumberLabel(50), "㊿");
  assert.equal(modes.circledNumberLabel(51), "51");
  assert.equal(modes.circledNumberLabel(67), "67");
});

test("circled terminal numbering continues through large sibling groups", () => {
  const root = model.createNode("根节点");
  root.children = Array.from({ length: 67 }, (_, index) => model.createNode(`要点 ${index + 1}`));
  const infos = modes.buildArticleNodeInfo(root, 0, { enabled: true, threshold: 4, style: "circled" });

  assert.equal(infos.length, 67);
  assert.equal(infos[0]?.label, "①");
  assert.equal(infos[19]?.label, "⑳");
  assert.equal(infos[20]?.label, "㉑");
  assert.equal(infos[34]?.label, "㉟");
  assert.equal(infos[35]?.label, "㊱");
  assert.equal(infos[49]?.label, "㊿");
  assert.equal(infos[50]?.label, "51");
  assert.equal(infos[50]?.displayTitle, "◯51 要点 51");
  assert.equal(infos[66]?.label, "67");
  assert.equal(infos[66]?.leafNumberingStyle, "circled");
  assert.equal(infos[66]?.leafNumberingIndex, 67);
});

test("circled terminal numbering remains available below level-eight headings", () => {
  const root = model.createNode("根节点");
  root.articleNumberingMode = "manual";
  root.articleNumberingLevel = 8;
  const parent = model.createNode("深层标题");
  parent.children = Array.from({ length: 4 }, (_, index) => model.createNode(`深层要点 ${index + 1}`));
  root.children = [parent];

  const circled = modes.buildArticleNodeInfo(root, 0, { enabled: true, threshold: 4, style: "circled" });
  const nextLevel = modes.buildArticleNodeInfo(root, 0, { enabled: true, threshold: 4, style: "next-level" });
  assert.equal(circled.find((info) => info.title === "深层要点 1")?.depth, 9);
  assert.equal(circled.find((info) => info.title === "深层要点 1")?.label, "①");
  assert.equal(nextLevel.find((info) => info.title === "深层要点 1")?.label, "");
});

test("per-document article style normalizes circled terminal numbering", () => {
  const document = model.normalizeDocument({
    title: "带圈序号",
    articleStyle: {
      preset: "classic",
      leafNumberingEnabled: true,
      leafNumberingStyle: "circled",
      leafNumberingThreshold: 80
    }
  });
  assert.equal(document.articleStyle?.leafNumberingStyle, "circled");
  assert.equal(document.articleStyle?.leafNumberingThreshold, 20);

  const invalid = model.normalizeDocument({
    title: "无效样式",
    articleStyle: { preset: "classic", leafNumberingStyle: "unknown" }
  });
  assert.equal(invalid.articleStyle?.leafNumberingStyle, undefined);
});
