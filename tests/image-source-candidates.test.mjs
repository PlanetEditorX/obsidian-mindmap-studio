import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
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

test("image upload patches merge into the latest document without replacing unrelated edits", () => {
  const document = model.createDefaultDocument("批量上传");
  document.root.children.push({
    id: "target",
    text: "上传期间保留的用户编辑",
    children: [],
    content: [
      { id: "text", type: "text", text: "上传期间保留的用户编辑" },
      { id: "image", type: "image", source: "assets/a.png", localSource: "assets/a.png" }
    ]
  });
  document.root.children.push({ id: "sibling", text: "不能丢失的兄弟节点", children: [] });

  const updated = model.applyImageUploadPatches(document, [{
    nodeId: "target",
    blockId: "image",
    localPath: "assets/a.png",
    contentHash: "a".repeat(64),
    remoteSources: [{ hostId: "zipline", hostName: "Zipline", url: "https://img.example/a.png" }],
    preferredSource: "https://img.example/a.png"
  }]);

  assert.equal(updated, 1);
  const target = document.root.children.find((node) => node.id === "target");
  const sibling = document.root.children.find((node) => node.id === "sibling");
  assert.equal(target.text, "上传期间保留的用户编辑");
  assert.equal(sibling.text, "不能丢失的兄弟节点");
  const image = model.nodeContentBlocks(target).find((block) => block.type === "image");
  assert.equal(image.source, "https://img.example/a.png");
  assert.equal(image.localSource, "assets/a.png");
  assert.equal(image.remoteSources[0].hostId, "zipline");
});

test("image upload patches ignore stale local-image jobs", () => {
  const document = model.createDefaultDocument("过期任务");
  document.root.content = [{ id: "image", type: "image", source: "assets/new.png", localSource: "assets/new.png" }];
  const updated = model.applyImageUploadPatches(document, [{
    nodeId: document.root.id,
    blockId: "image",
    localPath: "assets/old.png",
    preferredSource: "https://img.example/old.png"
  }]);
  assert.equal(updated, 0);
  assert.equal(model.nodeContentBlocks(document.root)[0].source, "assets/new.png");
});

test("per-image source priority overrides global host priority and default display", () => {
  const block = {
    id: "img",
    type: "image",
    source: "https://fast.example/a.png",
    localSource: "assets/local.png",
    remoteSources: [
      { hostId: "fast", hostName: "快图床", url: "https://fast.example/a.png" },
      { hostId: "slow", hostName: "慢图床", url: "https://slow.example/a.png" }
    ]
  };
  assert.deepEqual(
    model.imageSourceCandidates(block, true, ["fast", "slow"]).map((candidate) => candidate.source),
    ["https://fast.example/a.png", "https://slow.example/a.png", "assets/local.png"]
  );

  block.sourcePriority = ["https://slow.example/a.png"];
  const ordered = model.imageSourceCandidates(block, true, ["fast", "slow"]).map((candidate) => candidate.source);
  assert.deepEqual(ordered, ["https://slow.example/a.png", "https://fast.example/a.png", "assets/local.png"]);

  block.sourcePriority = ["assets/local.png"];
  const localFirst = model.imageSourceCandidates(block, true, ["fast", "slow"]);
  assert.equal(localFirst[0].source, "assets/local.png");
  assert.equal(localFirst[0].kind, "local");
});

test("normalizeImageSourcePriority trims, de-duplicates and caps entries", () => {
  assert.deepEqual(
    model.normalizeImageSourcePriority([" https://a.example/1 ", "https://a.example/1", "", 42, "https://b.example/2"]),
    ["https://a.example/1", "https://b.example/2"]
  );
  assert.deepEqual(model.normalizeImageSourcePriority("not-an-array"), []);
  const many = Array.from({ length: 30 }, (_, index) => `https://host.example/${index}`);
  assert.equal(model.normalizeImageSourcePriority(many).length, 16);
});

test("removeImageSourceCandidate re-points default source and prunes per-image priority", () => {
  const block = {
    id: "img",
    type: "image",
    source: "https://fast.example/a.png",
    localSource: "assets/local.png",
    remoteSources: [
      { hostId: "fast", hostName: "快图床", url: "https://fast.example/a.png" },
      { hostId: "slow", hostName: "慢图床", url: "https://slow.example/a.png" }
    ],
    sourcePriority: ["https://fast.example/a.png", "https://slow.example/a.png"]
  };

  const removedFast = model.removeImageSourceCandidate(block, "https://fast.example/a.png");
  assert.equal(removedFast.source, "https://slow.example/a.png");
  assert.equal(removedFast.localSource, "assets/local.png");
  assert.deepEqual(removedFast.remoteSources.map((item) => item.url), ["https://slow.example/a.png"]);
  assert.deepEqual(removedFast.sourcePriority, ["https://slow.example/a.png"]);

  const removedLocal = model.removeImageSourceCandidate(block, "assets/local.png");
  assert.equal(removedLocal.localSource, undefined);
  assert.equal(removedLocal.source, "https://fast.example/a.png");
  assert.deepEqual(removedLocal.sourcePriority, ["https://fast.example/a.png", "https://slow.example/a.png"]);

  let current = { ...block, sourcePriority: undefined };
  for (const url of ["https://fast.example/a.png", "https://slow.example/a.png", "assets/local.png"]) {
    current = { ...current, ...model.removeImageSourceCandidate(current, url) };
  }
  assert.equal(model.removeImageSourceCandidate(current, current.source), null);
});

test("removeImageSourceCandidate returns null only when no source remains", () => {
  const block = { id: "img", type: "image", source: "https://only.example/a.png" };
  const remaining = model.removeImageSourceCandidate(block, "https://only.example/a.png");
  assert.equal(remaining, null);

  const localOnly = { id: "img", type: "image", source: "assets/local.png", localSource: "assets/local.png" };
  assert.equal(model.removeImageSourceCandidate(localOnly, "assets/local.png"), null);
});

test("createManualImageRemoteSource validates http(s) URLs and rejects duplicates by caller", () => {
  const entry = model.createManualImageRemoteSource("  https://cdn.example/pic.png  ");
  assert.equal(entry.hostId, "manual");
  assert.equal(entry.url, "https://cdn.example/pic.png");
  assert.equal(model.createManualImageRemoteSource("ftp://cdn.example/pic.png"), null);
  assert.equal(model.createManualImageRemoteSource("not a url"), null);
  assert.equal(model.createManualImageRemoteSource(""), null);
  assert.equal(model.createManualImageRemoteSource(`https://a.example/${"x".repeat(5000)}`), null);
});

test("setImageSourceDefault writes the chosen candidate to the front of per-image priority", () => {
  const block = {
    id: "img",
    type: "image",
    source: "https://fast.example/a.png",
    localSource: "assets/local.png",
    remoteSources: [{ hostId: "fast", hostName: "快图床", url: "https://fast.example/a.png" }]
  };
  assert.equal(model.setImageSourceDefault(block, "assets/local.png"), true);
  assert.equal(block.sourcePriority[0], "assets/local.png");
  assert.equal(model.setImageSourceDefault(block, "https://missing.example/x.png"), false);
});

test("clearImageSourceDefault unpins the source and drops the override when empty", () => {
  const block = {
    id: "img",
    type: "image",
    source: "https://fast.example/a.png",
    sourcePriority: ["https://slow.example/a.png", "https://fast.example/a.png"]
  };
  model.clearImageSourceDefault(block, "https://slow.example/a.png");
  assert.deepEqual(block.sourcePriority, ["https://fast.example/a.png"]);
  model.clearImageSourceDefault(block, "https://fast.example/a.png");
  assert.equal(block.sourcePriority, undefined);
  model.clearImageSourceDefault(block, "https://missing.example/x.png");
  assert.equal(block.sourcePriority, undefined);
});

test("image preview modal exposes source management and editor wires unified-history actions", async () => {
  const [modalSource, editorSource, articleSource, outlineSource, stylesSource] = await Promise.all([
    readFile("src/editor/editor-modals.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/outline-renderer.ts", "utf8"),
    readFile("styles.css", "utf8")
  ]);
  assert.match(modalSource, /export type ImagePreviewSourceChange/);
  assert.match(modalSource, /export interface ImagePreviewSourceActions/);
  assert.match(modalSource, /设为默认显示来源/);
  assert.match(modalSource, /取消默认显示来源/);
  assert.match(modalSource, /更新上传（选择本地图片并上传图床）/);
  assert.match(modalSource, /更新替换（选择本地图片）/);
  assert.match(modalSource, /candidate\.kind === "local"\s*\?\s*[\s\S]*replaceLocal|candidate\.kind === "local"[\s\S]*replaceLocal/s);
  assert.match(modalSource, /删除此来源/);
  assert.match(modalSource, /手动添加图片 URL 来源/);
  assert.match(modalSource, /mmc-image-preview-source-add-toggle/);
  assert.match(modalSource, /image\.setPointerCapture\(event\.pointerId\)/);
  assert.match(modalSource, /event\.preventDefault\(\);\s*panPointerId = event\.pointerId;/s);
  assert.match(modalSource, /addEventListener\("dragstart", \(event\) => event\.preventDefault\(\)\)/);
  assert.match(modalSource, /draggable: "false"/);
  assert.match(modalSource, /getDefaultSource: \(\) =>/);
  assert.match(stylesSource, /\.mmc-image-preview-source-add\.is-open \.mmc-image-preview-source-add-panel/);
  assert.match(stylesSource, /\.mmc-image-preview-stage img \{[\s\S]*touch-action: none;/);
  assert.match(modalSource, /contextmenu.*showSourceMenu|showSourceMenu\(candidate, event\)/s);
  assert.match(modalSource, /if \(!stillExists\) \{\s*this\.close\(\);/s);

  assert.match(editorSource, /applyImagePreviewSourceChange\(nodeId: string, blockId: string, change: ImagePreviewSourceChange\)/);
  assert.match(editorSource, /openImagePreviewWithSources\(nodeId: string, blockId: string\)/);
  assert.match(editorSource, /removeImageSourceCandidate\(located\.block, change\.source\)/);
  assert.match(editorSource, /await this\.removeImageBlock\(nodeId, blockId\);\s*return false;/s);
  assert.match(editorSource, /change\.type === "replaceLocal"/);
  assert.match(editorSource, /change\.type === "unsetDefault"/);
  assert.match(editorSource, /clearImageSourceDefault\(located\.block, change\.source\)/);
  assert.match(editorSource, /onSavePastedImage\(file, file\.name\)/);
  assert.match(editorSource, /change\.type === "reupload"[\s\S]*chooseImageHosts\(this\.app, this\.callbacks\.getImageHosts\(\)[\s\S]*selectImageFile\(\)[\s\S]*this\.callbacks\.onUploadImage\(file, file\.name, hostIds\)/, "preview re-upload must open the host picker and the system image file picker");

  assert.match(articleSource, /options\.openImagePreview\(node\.id, block\.id\)/);
  assert.match(outlineSource, /options\.openImagePreview\(node\.id, block\.id\)/);

  assert.match(stylesSource, /--mms-modal-md: min\(920px, 92vw\)/);
  assert.match(stylesSource, /--mms-modal-lg: min\(1280px, 96vw\)/);
  assert.match(stylesSource, /--mms-modal-xl: min\(1440px, 98vw\)/);
  assert.match(stylesSource, /\.mms-ai-modal \{\s*width: var\(--mms-modal-md\);/s);
  assert.match(stylesSource, /\.mms-image-recognition-modal \{\s*width: var\(--mms-modal-xl\);/s);
});
