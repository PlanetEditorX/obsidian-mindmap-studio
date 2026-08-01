import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let imageHost;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModule("src/utils/image-host.ts");
  imageHost = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("normalizeHttpUrl accepts HTTP(S) and rejects unsafe protocols", () => {
  assert.equal(imageHost.normalizeHttpUrl("  https://img.example/upload?q=1  "), "https://img.example/upload?q=1");
  assert.throws(() => imageHost.normalizeHttpUrl(""), /为空/);
  assert.throws(() => imageHost.normalizeHttpUrl("not a url"), /格式无效/);
  assert.throws(() => imageHost.normalizeHttpUrl("file:///tmp/image"), /HTTP 或 HTTPS/);
});

test("parseUploadHeaders converts scalar values without accepting nested objects", () => {
  assert.deepEqual(imageHost.parseUploadHeaders('{"Authorization":"Bearer token","X-Retry":2,"X-Enabled":true,"X-Empty":null}'), {
    Authorization: "Bearer token",
    "X-Retry": "2",
    "X-Enabled": "true",
    "X-Empty": ""
  });
  assert.deepEqual(imageHost.parseUploadHeaders("  "), {});
  assert.throws(() => imageHost.parseUploadHeaders("[]"), /必须是对象/);
  assert.throws(() => imageHost.parseUploadHeaders('{"X":{"nested":true}}'), /必须是字符串/);
});

test("parseUploadHeaders rejects malformed JSON and header injection", () => {
  assert.throws(() => imageHost.parseUploadHeaders("{"), /有效的 JSON/);
  assert.throws(() => imageHost.parseUploadHeaders('{"Bad Header":"x"}'), /名称无效/);
  assert.throws(() => imageHost.parseUploadHeaders('{"X-Test":"ok\\r\\nInjected: yes"}'), /不能包含换行符/);
});

test("buildMultipartUploadBody creates a deterministic single-file body", async () => {
  const result = await imageHost.buildMultipartUploadBody(
    'im"age\r\n',
    'demo".png\r\nInjected: yes',
    "image/png",
    new Blob([new Uint8Array([1, 2, 3])]),
    "----fixed-boundary"
  );
  assert.equal(result.contentType, "multipart/form-data; boundary=----fixed-boundary");
  assert.equal(result.boundary, "----fixed-boundary");
  const bytes = new Uint8Array(result.body);
  const text = new TextDecoder().decode(bytes);
  assert.match(text, /name="image"/);
  assert.match(text, /filename="demo.pngInjected: yes"/);
  assert.match(text, /Content-Type: image\/png/);
  assert.ok(bytes.includes(1) && bytes.includes(2) && bytes.includes(3));
  assert.match(text, /------fixed-boundary--\r\n$/);
});

test("buildMultipartUploadBody falls back to an octet-stream MIME", async () => {
  const result = await imageHost.buildMultipartUploadBody("file", "demo", "bad mime", new Blob(["x"]), "----b");
  assert.match(new TextDecoder().decode(result.body), /Content-Type: application\/octet-stream/);
});

test("buildMultipartUploadBody rejects an unsafe boundary", async () => {
  await assert.rejects(
    imageHost.buildMultipartUploadBody("file", "demo.png", "image/png", new Blob(["x"]), "bad\r\nboundary"),
    /boundary 格式无效/
  );
});

test("parseUploadResponsePayload prefers JSON and otherwise parses text", () => {
  assert.deepEqual(imageHost.parseUploadResponsePayload({ data: 1 }, '{"data":2}'), { data: 1 });
  assert.deepEqual(imageHost.parseUploadResponsePayload(undefined, '{"data":2}'), { data: 2 });
  assert.equal(imageHost.parseUploadResponsePayload(undefined, "plain text"), "plain text");
  assert.equal(imageHost.parseUploadResponsePayload(undefined, ""), undefined);
});

test("sha256Blob produces a stable content digest for upload deduplication", async () => {
  const first = await imageHost.sha256Blob(new Blob(["same image bytes"]));
  const second = await imageHost.sha256Blob(new Blob(["same image bytes"]));
  const different = await imageHost.sha256Blob(new Blob(["different image bytes"]));
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(first, second);
  assert.notEqual(first, different);
});

test("extractImageUrlFromResponse honors custom paths and built-in fallbacks", () => {
  assert.equal(imageHost.extractImageUrlFromResponse({ payload: { image: "https://cdn.example/a.png" } }, ["payload.image"]), "https://cdn.example/a.png");
  assert.equal(imageHost.extractImageUrlFromResponse({ data: { url: "http://cdn.example/b.jpg" } }), "http://cdn.example/b.jpg");
  assert.equal(imageHost.extractImageUrlFromResponse({ items: [{ url: "https://cdn.example/c.webp" }] }, ["items.0.url"]), "https://cdn.example/c.webp");
});

test("delete response values and templates support URL, hash and host tokens", () => {
  const payload = { data: { delete_key: 42 } };
  assert.equal(imageHost.extractResponseString(payload, "data.delete_key"), "42");
  assert.equal(imageHost.extractResponseString(payload, "missing"), undefined);
  assert.equal(
    imageHost.applyImageDeleteTemplate("https://api.example/delete/{deleteKey}?url={url}&hash={hash}", {
      url: "https://cdn.example/a b.png",
      hash: "abc",
      deleteKey: "token/1"
    }, "url"),
    "https://api.example/delete/token%2F1?url=https%3A%2F%2Fcdn.example%2Fa%20b.png&hash=abc"
  );
  assert.equal(
    imageHost.applyImageDeleteTemplate('{"url":"{url}","key":"{deleteKey}"}', {
      url: 'https://cdn.example/a"b.png',
      deleteKey: "token"
    }, "json"),
    '{"url":"https://cdn.example/a\\"b.png","key":"token"}'
  );
});

test("built-in host response paths cover Zipline, ImgBB and Freeimage shapes", () => {
  assert.equal(imageHost.extractImageUrlFromResponse({ files: [{ id: "file-id", url: "https://zipline.example/u/a.png" }] }, ["files.0.url"]), "https://zipline.example/u/a.png");
  assert.equal(imageHost.extractResponseString({ files: [{ id: "file-id" }] }, "files.0.id"), "file-id");
  assert.equal(imageHost.extractResponseString({ data: { delete_url: "https://ibb.co/delete/token" } }, "data.delete_url"), "https://ibb.co/delete/token");
  assert.equal(imageHost.extractImageUrlFromResponse({ image: { url: "https://iili.io/a.png" } }, ["image.url"]), "https://iili.io/a.png");
});


test("findZiplineFileId matches current v4 file lists by URL or filename", () => {
  const payload = {
    page: [
      { id: "exact-id", url: "https://zipline.example/u/exact.png", name: "other.png" },
      { id: "name-id", url: "/raw/different.png", name: "encoded name.png" }
    ]
  };
  assert.equal(imageHost.findZiplineFileId(payload, "https://zipline.example/u/exact.png", "https://zipline.example"), "exact-id");
  assert.equal(imageHost.findZiplineFileId(payload, "https://cdn.example/u/encoded%20name.png", "https://zipline.example"), "name-id");
  assert.equal(imageHost.findZiplineFileId(payload, "https://cdn.example/u/missing.png", "https://zipline.example"), undefined);
});

test("extractImageUrlFromResponse finds URLs in plain text and rejects non-HTTP values", () => {
  assert.equal(imageHost.extractImageUrlFromResponse("uploaded: https://cdn.example/a.png"), "https://cdn.example/a.png");
  assert.equal(imageHost.extractImageUrlFromResponse({ url: "ftp://cdn.example/a.png" }), null);
  assert.equal(imageHost.extractImageUrlFromResponse({ ok: true }), null);
});

test("readPath expose reusable validation primitives", () => {
  assert.equal(imageHost.readPath({ a: [{ b: 42 }] }, "a.0.b"), 42);
  assert.equal(imageHost.readPath({ a: 1 }, "a.b"), undefined);
});

test("isHttpUrl correctly validates HTTP(S) URLs and rejects others", () => {
  // Valid HTTP/HTTPS URLs
  assert.equal(imageHost.isHttpUrl("http://example.com"), true);
  assert.equal(imageHost.isHttpUrl("https://example.com/image.png"), true);
  assert.equal(imageHost.isHttpUrl("  https://example.com/with-spaces  "), true);

  // Invalid schemes
  assert.equal(imageHost.isHttpUrl("ftp://example.com"), false);
  assert.equal(imageHost.isHttpUrl("file:///tmp/test.png"), false);
  assert.equal(imageHost.isHttpUrl("wss://example.com"), false);
  assert.equal(imageHost.isHttpUrl("javascript:alert(1)"), false);

  // Missing protocols or just paths
  assert.equal(imageHost.isHttpUrl("example.com"), false);
  assert.equal(imageHost.isHttpUrl("/path/to/image.png"), false);
  assert.equal(imageHost.isHttpUrl(""), false);
  assert.equal(imageHost.isHttpUrl("   "), false);

  // Malformed strings
  assert.equal(imageHost.isHttpUrl("not a url"), false);
  assert.equal(imageHost.isHttpUrl("http://"), false);
});
