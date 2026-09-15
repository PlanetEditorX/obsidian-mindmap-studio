import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("merge back deletes an emptied submap asset folder instead of leaving a blank directory", async () => {
  const mainSource = await readFile("src/main.ts", "utf8");
  // 合并回父导图后，子导图引用的附件迁移并回收，随即清理可能变空的资源目录
  assert.match(mainSource, /await this\.cleanupEmptySubmapAssetsFolder\(submapDirPath, parentFile\);/);
  // 子导图删除后 parent 被置空，须在 trash 前捕获其父目录路径
  assert.match(mainSource, /const submapDirPath = submapFile\.parent\?\.path \?\? "";/);
  // 仅在目录存在且为空时删除，非空目录保留，避免误删其它文件
  assert.match(mainSource, /node\.children\.length\) break;/);
  assert.match(mainSource, /private async cleanupEmptySubmapAssetsFolder\(submapDirPath: string, parentFile\?: TFile\)/);
  // 沿空目录链向上清理，并保留主导图自己的资源根目录
  assert.match(mainSource, /stopAt && currentPath === stopAt\) break;/);
  assert.match(mainSource, /assetFolder \|\| "MindMap Assets"/);
  // 重名附件用连字符序号追加（例如 a-2.png），而非空格 2
  assert.match(mainSource, /\$\{base\}-\$\{index\}\$\{extension\}/);
});