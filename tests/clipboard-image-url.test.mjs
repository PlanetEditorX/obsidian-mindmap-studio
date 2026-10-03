import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let clipboard;
let cleanup;
let editorSource;

before(async () => {
  const loaded = await loadTypeScriptModules(
    ["src/core/node-tree.ts", "src/core/model.ts", "src/editor/clipboard-import.ts"],
    "src/editor/clipboard-import.ts"
  );
  clipboard = loaded.module;
  cleanup = loaded.cleanup;
  editorSource = await readFile("src/editor/editor.ts", "utf8");
});

test("direct image URLs are recognized without a network probe", () => {
  assert.deepEqual(
    clipboard.parseClipboardImageUrl("https://cdn.example.com/photo.JPG?width=1200"),
    { url: "https://cdn.example.com/photo.JPG?width=1200", confident: true }
  );
  assert.deepEqual(
    clipboard.parseClipboardImageUrl("https://cdn.example.com/render?id=42&fm=webp"),
    { url: "https://cdn.example.com/render?id=42&fm=webp", confident: true }
  );
  assert.deepEqual(
    clipboard.parseClipboardImageUrl("https://cdn.example.com/render?id=42&type=image%2Fpng"),
    { url: "https://cdn.example.com/render?id=42&type=image%2Fpng", confident: true }
  );
});

test("extensionless http URLs are probe candidates while mixed or non-http text is ignored", () => {
  assert.deepEqual(
    clipboard.parseClipboardImageUrl("https://images.example.com/asset/12345"),
    { url: "https://images.example.com/asset/12345", confident: false }
  );
  assert.equal(clipboard.parseClipboardImageUrl("see https://example.com/photo.png"), null);
  assert.equal(clipboard.parseClipboardImageUrl("obsidian://open?vault=Demo"), null);
});

test("a clipboard HTML payload containing only one image is trusted", () => {
  assert.deepEqual(
    clipboard.parseClipboardImageUrl(
      "preview",
      '<a href="https://example.com"><img src="https://cdn.example.com/render?id=42&amp;size=large"></a>'
    ),
    { url: "https://cdn.example.com/render?id=42&size=large", confident: true }
  );
  assert.equal(
    clipboard.parseClipboardImageUrl("preview", '<p>caption</p><img src="https://cdn.example.com/photo.png">'),
    null
  );
});

test("editor freezes the destination before probing and inserts a remote image block directly", () => {
  assert.match(editorSource, /const frozenNodeId = [\s\S]{0,900}?await this\.probeRemoteImageUrl\(remoteImage\.url\)[\s\S]{0,900}?insertRemoteImageUrl\(frozenNodeId, remoteImage\.url, frozenAfterBlockId\)/);
  assert.match(editorSource, /private insertRemoteImageUrl\(nodeId: string, url: string, afterBlockId\?: string\): boolean[\s\S]{0,700}?type: "image", source: url/);
  assert.doesNotMatch(editorSource.match(/private insertRemoteImageUrl[\s\S]*?return true;/)?.[0] ?? "", /onScheduleAutoUpload|localSource/);
});

after(() => cleanup?.());
