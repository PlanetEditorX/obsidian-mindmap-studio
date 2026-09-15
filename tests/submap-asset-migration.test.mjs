import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let cleanup;
let previousRequire;

before(async () => {
  previousRequire = globalThis.require;
  globalThis.require = createRequire(import.meta.url);
  ({ module: model, cleanup } = await loadTypeScriptModules(
    ["src/core/node-tree.ts", "src/core/model.ts"],
    "src/core/model.ts"
  ));
});

after(async () => {
  if (previousRequire === undefined) delete globalThis.require;
  else globalThis.require = previousRequire;
  await cleanup?.();
});

test("submap asset migration rewrites local image and file blocks to the target folder", () => {
  const root = {
    id: "root",
    text: "母图",
    content: [
      { id: "img-1", type: "image", source: "MindMap Assets/a.png", localSource: "MindMap Assets/a.png" },
      { id: "img-2", type: "file", source: "MindMap Assets/report.pdf", name: "report.pdf" }
    ],
    children: [
      {
        id: "child",
        text: "带远程图",
        content: [
          { id: "img-3", type: "image", source: "https://cdn.example.com/x.png", localSource: "MindMap Assets/b.png" }
        ],
        children: []
      }
    ]
  };

  const rewritten = model.migrateLocalAssetBlocks(root, (oldPath) =>
    oldPath.startsWith("MindMap Assets/") ? `Sunmap Assets/${oldPath.split("/").pop()}` : null);

  assert.equal(rewritten, 3);
  const image = root.content.find((block) => block.type === "image");
  assert.equal(image.localSource, "Sunmap Assets/a.png");
  assert.equal(image.source, "Sunmap Assets/a.png");
  const file = root.content.find((block) => block.type === "file");
  assert.equal(file.source, "Sunmap Assets/report.pdf");
  const remote = root.children[0].content.find((block) => block.type === "image");
  // 本地副本迁移到新目录
  assert.equal(remote.localSource, "Sunmap Assets/b.png");
  // 远程图床 URL 不受迁移影响
  assert.equal(remote.source, "https://cdn.example.com/x.png");
});

test("submap asset migration skips remote-only images and same-path results", () => {
  const root = {
    id: "root",
    text: "根",
    content: [
      { id: "img-1", type: "image", source: "https://cdn.example.com/a.png", localSource: undefined },
      { id: "img-2", type: "file", source: "MindMap Assets/doc.pdf", name: "doc.pdf" },
      { id: "nop-3", type: "text", text: "普通文本" }
    ],
    children: []
  };

  // 远程 URL 由调用方返回 null 表示不迁移；同路径结果视为无需改写
  const rewritten = model.migrateLocalAssetBlocks(root, (oldPath) =>
    oldPath.startsWith("MindMap Assets/") ? oldPath : null);

  assert.equal(rewritten, 0);
  assert.equal(root.content[0].source, "https://cdn.example.com/a.png");
  assert.equal(root.content[1].source, "MindMap Assets/doc.pdf");
});