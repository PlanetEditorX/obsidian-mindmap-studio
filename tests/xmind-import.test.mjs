import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { strToU8, zipSync } from "fflate";

let tempDir;
let xmind;
let model;

before(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mindmap-xmind-import-"));
  const xmindOut = join(tempDir, "xmind.cjs");
  const modelOut = join(tempDir, "model.cjs");
  await Promise.all([
    build({ entryPoints: ["src/import/import-export.ts"], outfile: xmindOut, bundle: true, platform: "node", format: "cjs", logLevel: "silent" }),
    build({ entryPoints: ["src/core/model.ts"], outfile: modelOut, bundle: true, platform: "node", format: "cjs", logLevel: "silent" })
  ]);
  const require = createRequire(import.meta.url);
  xmind = require(xmindOut);
  model = require(modelOut);
});

after(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

function fixture({ missing = false } = {}) {
  const files = {
    "content.json": strToU8(JSON.stringify([{
      id: "sheet",
      rootTopic: {
        title: "图文公式",
        image: { src: "xap:resources/公式.png", width: "320", height: 180 },
        equation: { latex: "$$\\frac{项数}{2}$$", svg: "<svg>preview</svg>" },
        children: { attached: [{
          title: "共享资源",
          images: [{ source: "resources/公式.png", width: 240 }],
          formulas: [{ tex: "a_n=a_1+(n-1)d" }]
        }] }
      }
    }]))
  };
  if (!missing) files["resources/公式.png"] = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  return zipSync(files).buffer;
}

test("XMind images and LaTeX become ordered content blocks", () => {
  const result = xmind.xmindToImportResult(fixture(), "fallback");
  assert.equal(result.images.length, 1);
  assert.equal(result.imageReferenceCount, 2);
  assert.equal(result.equationCount, 2);
  assert.equal(result.missingImageCount, 0);
  const blocks = model.nodeContentBlocks(result.document.root);
  assert.deepEqual(blocks.map((block) => block.type), ["text", "text", "image"]);
  assert.equal(blocks[1].text, "$$\\frac{项数}{2}$$");
  assert.equal(blocks[2].width, 320);
  assert.equal(blocks[2].height, 180);
});

test("shared XMind resources are saved once and every reference is rewritten", async () => {
  const result = xmind.xmindToImportResult(fixture(), "fallback");
  let saveCalls = 0;
  const materialized = await xmind.materializeXMindImages(result, async (image) => {
    saveCalls += 1;
    assert.equal(image.mimeType, "image/png");
    assert.equal(image.filename, "公式.png");
    return "MindMap Assets/XMind/公式.png";
  });
  assert.equal(saveCalls, 1);
  assert.deepEqual(materialized, { saved: 1, rewritten: 2 });
  const allImages = [result.document.root, ...result.document.root.children]
    .flatMap((node) => model.nodeContentBlocks(node))
    .filter((block) => block.type === "image");
  assert.ok(allImages.every((block) => block.source === "MindMap Assets/XMind/公式.png"));
  assert.ok(allImages.every((block) => block.localSource === "MindMap Assets/XMind/公式.png"));
});

test("standalone XMind parsing embeds archive images instead of losing them", () => {
  const document = xmind.xmindToDocument(fixture(), "fallback");
  const image = model.nodeContentBlocks(document.root).find((block) => block.type === "image");
  assert.match(image?.source ?? "", /^data:image\/png;base64,/);
});

test("missing XMind resources are reported without broken image blocks", () => {
  const result = xmind.xmindToImportResult(fixture({ missing: true }), "fallback");
  assert.equal(result.missingImageCount, 2);
  assert.equal(result.images.length, 0);
  assert.deepEqual(model.nodeContentBlocks(result.document.root).map((block) => block.type), ["text", "text"]);
});
