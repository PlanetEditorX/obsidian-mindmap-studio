import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let relink;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/core/image-relink.ts"
  ], "src/core/image-relink.ts");
  relink = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("relink target prefers the same directory and then the whole vault", () => {
  const available = [
    "Archive/diagram.jpg",
    "MindMap Assets/diagram.jpg",
    "MindMap Assets/diagram.svg"
  ];

  const sameDirectory = relink.findImageRelinkTarget("MindMap Assets/diagram.png", available);
  assert.equal(sameDirectory.path, "MindMap Assets/diagram.svg");
  assert.equal(sameDirectory.sameDirectory, true);

  const vaultWide = relink.findImageRelinkTarget("MindMap Assets/gone.png", available);
  assert.equal(vaultWide, null, "没有同名主干候选时不匹配");

  const fallback = relink.findImageRelinkTarget("MindMap Assets/diagram.png", ["Archive/diagram.svg"]);
  assert.equal(fallback.path, "Archive/diagram.svg");
  assert.equal(fallback.sameDirectory, false);
});

test("relink target ignores same extension, non-image files and unrelated stems", () => {
  assert.equal(relink.findImageRelinkTarget("a/diagram.png", ["a/diagram.png"]), null);
  assert.equal(relink.findImageRelinkTarget("a/diagram.png", ["b/diagram.png"]), null);
  assert.equal(relink.findImageRelinkTarget("a/diagram.png", ["a/diagram.pdf"]), null);
  assert.equal(relink.findImageRelinkTarget("a/diagram.png", ["a/other.svg"]), null);
  assert.equal(relink.findImageRelinkTarget("a/diagram.png", ["a/diagram"]), null);
});

test("relink target matches stems case-insensitively and prefers vector svg", () => {
  const target = relink.findImageRelinkTarget("assets/Flow.PNG", ["assets/flow.svg", "assets/flow.jpg"]);
  assert.equal(target.path, "assets/flow.svg");
});

test("relink rewrites local references while keeping remote mirrors untouched", () => {
  const block = {
    id: "img-1",
    type: "image",
    source: "MindMap Assets/diagram.png",
    localSource: "MindMap Assets/diagram.png",
    contentHash: "a".repeat(64),
    remoteSources: [{ hostId: "h1", hostName: "图床", url: "https://cdn.example.com/diagram.png" }],
    sourcePriority: ["https://cdn.example.com/diagram.png", "MindMap Assets/diagram.png"]
  };

  const changed = relink.relinkImageBlock(block, (path) =>
    path === "MindMap Assets/diagram.png" ? "MindMap Assets/diagram.svg" : null);

  assert.equal(changed, true);
  assert.equal(block.source, "MindMap Assets/diagram.svg");
  assert.equal(block.localSource, "MindMap Assets/diagram.svg");
  assert.deepEqual(block.sourcePriority, ["https://cdn.example.com/diagram.png", "MindMap Assets/diagram.svg"]);
  assert.equal(block.remoteSources[0].url, "https://cdn.example.com/diagram.png");
  assert.equal(block.contentHash, "a".repeat(64));
});

test("relink preserves wiki wrappers and aliases and resolves each stem once", () => {
  const block = {
    id: "img-2",
    type: "image",
    source: "![[MindMap Assets/图.png|示意图]]",
    localSource: "MindMap Assets/图.png"
  };
  const seen = [];
  const changed = relink.relinkImageBlock(block, (path) => {
    seen.push(path);
    return path === "MindMap Assets/图.png" ? "MindMap Assets/图.svg" : null;
  });

  assert.equal(changed, true);
  assert.equal(block.source, "![[MindMap Assets/图.svg|示意图]]");
  assert.equal(block.localSource, "MindMap Assets/图.svg");
  assert.deepEqual(seen, ["MindMap Assets/图.png"], "同一主干只解析一次");
});

test("relink leaves remote-only images and intact references alone", () => {
  const remote = { id: "img-3", type: "image", source: "https://cdn.example.com/a.png" };
  assert.equal(relink.relinkImageBlock(remote, () => "should-not-apply.svg"), false);
  assert.equal(remote.source, "https://cdn.example.com/a.png");

  const intact = { id: "img-4", type: "image", source: "MindMap Assets/keep.png", localSource: "MindMap Assets/keep.png" };
  assert.equal(relink.relinkImageBlock(intact, () => null), false);
  assert.equal(intact.localSource, "MindMap Assets/keep.png");
});

test("relinkDocumentImages walks the whole tree and writes blocks back", () => {
  const document = {
    root: {
      id: "root",
      content: [
        { id: "img-1", type: "image", source: "MindMap Assets/a.png", localSource: "MindMap Assets/a.png" },
        { id: "text-1", type: "text", text: "普通文本" }
      ],
      children: [
        {
          id: "child",
          content: [
            { id: "img-2", type: "image", source: "https://cdn.example.com/b.png", localSource: "MindMap Assets/b.png" },
            { id: "img-3", type: "image", source: "MindMap Assets/c.png", localSource: "MindMap Assets/c.png" }
          ],
          children: []
        }
      ]
    }
  };

  const changed = relink.relinkDocumentImages(document, (path) => {
    if (path === "MindMap Assets/a.png") return "MindMap Assets/a.svg";
    if (path === "MindMap Assets/b.png") return "MindMap Assets/b.jpg";
    return null;
  });

  assert.equal(changed, 2);
  const image = document.root.content.find((block) => block.id === "img-1");
  assert.equal(image.source, "MindMap Assets/a.svg");
  assert.equal(image.localSource, "MindMap Assets/a.svg");
  const childImages = document.root.children[0].content;
  assert.equal(childImages[0].source, "https://cdn.example.com/b.png");
  assert.equal(childImages[0].localSource, "MindMap Assets/b.jpg");
  assert.equal(childImages[1].localSource, "MindMap Assets/c.png");
});

test("localImageReferenceTarget only accepts local image references", () => {
  assert.equal(relink.localImageReferenceTarget("MindMap Assets/a.png"), "MindMap Assets/a.png");
  assert.equal(relink.localImageReferenceTarget("![[a.png|别名]]"), "a.png");
  assert.equal(relink.localImageReferenceTarget("a.png#anchor"), "a.png");
  assert.equal(relink.localImageReferenceTarget("https://cdn.example.com/a.png"), null);
  assert.equal(relink.localImageReferenceTarget("data:image/png;base64,AAAA"), null);
  assert.equal(relink.localImageReferenceTarget("   "), null);
});
