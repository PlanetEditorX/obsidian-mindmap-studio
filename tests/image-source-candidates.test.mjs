import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts"
  ], "src/core/model.ts");
  model = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("image source candidates prefer configured image host priority before local fallback", () => {
  const block = {
    id: "img",
    type: "image",
    source: "assets/local.png",
    localSource: "assets/local.png",
    remoteSources: [
      { hostId: "slow", hostName: "慢图床", url: "https://slow.example/a.png" },
      { hostId: "fast", hostName: "快图床", url: "https://fast.example/a.png" }
    ]
  };

  const candidates = model.imageSourceCandidates(block, true, ["fast", "slow"]);

  assert.deepEqual(candidates.map((item) => item.source), [
    "https://fast.example/a.png",
    "https://slow.example/a.png",
    "assets/local.png"
  ]);
  assert.deepEqual(candidates.map((item) => item.label), ["快图床", "慢图床", "本地副本"]);
});

test("image source candidates de-duplicate current remote while keeping priority order", () => {
  const block = {
    id: "img",
    type: "image",
    source: "https://slow.example/a.png",
    remoteSources: [
      { hostId: "slow", hostName: "慢图床", url: "https://slow.example/a.png" },
      { hostId: "fast", hostName: "快图床", url: "https://fast.example/a.png" }
    ]
  };

  const candidates = model.imageSourceCandidates(block, false, ["fast", "slow"]);

  assert.deepEqual(candidates.map((item) => [item.source, item.kind]), [
    ["https://fast.example/a.png", "remote"],
    ["https://slow.example/a.png", "current"]
  ]);
});

test("replacing normalized image blocks persists a failover source and compatibility mirror", () => {
  const node = {
    id: "node",
    text: "",
    children: [],
    image: "https://broken.example/a.png",
    content: [{
      id: "img",
      type: "image",
      source: "https://broken.example/a.png",
      remoteSources: [
        { hostId: "broken", hostName: "失效图床", url: "https://broken.example/a.png" },
        { hostId: "zipline", hostName: "飞牛Zipline", url: "https://zipline.example/a.png" }
      ]
    }]
  };
  const blocks = model.nodeContentBlocks(node);
  const image = blocks.find((block) => block.type === "image");

  image.source = "https://zipline.example/a.png";
  model.replaceNodeContentBlocks(node, blocks);

  assert.equal(node.content[0].source, "https://zipline.example/a.png");
  assert.equal(node.image, "https://zipline.example/a.png");
});
