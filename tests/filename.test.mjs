import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let filename;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModule("src/utils/filename.ts");
  filename = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("sanitizeFilename removes path and control characters", () => {
  assert.equal(filename.sanitizeFilename('  研究/计划: 版本?1  '), "研究-计划-版本-1");
  assert.equal(filename.sanitizeFilename("a\u0000b\nc"), "a-b-c");
});

test("sanitizeFilename replaces all invalid characters", () => {
  assert.equal(filename.sanitizeFilename("a<b>c:d\"e/f\\g|h?i*j[k]l#m"), "a-b-c-d-e-f-g-h-i-j-k-l-m");
  const allInvalid = '\\/:*?"<>|#[]\u0000\u001f';
  assert.equal(filename.sanitizeFilename(`start${allInvalid}end`), "start-end");
});

test("sanitizeFilename normalizes whitespace, Unicode and trailing dots", () => {
  assert.equal(filename.sanitizeFilename("Cafe\u0301   方案..."), "Café 方案");
});

test("sanitizeFilename uses a fallback and protects Windows device names", () => {
  assert.equal(filename.sanitizeFilename("***", "后备"), "后备");
  assert.equal(filename.sanitizeFilename("CON"), "_CON");
  assert.equal(filename.sanitizeFilename("lpt1.txt"), "_lpt1.txt");
});

test("sanitizeFilename enforces a positive maximum length", () => {
  assert.equal(filename.sanitizeFilename("abcdefgh", "fallback", 5), "abcde");
  assert.equal(filename.sanitizeFilename("abc", "fallback", 0), "a");
});

test("sanitizeFileExtension accepts names and dot-prefixed extensions", () => {
  assert.equal(filename.sanitizeFileExtension("photo.PNG"), "png");
  assert.equal(filename.sanitizeFileExtension(".JPEG"), "jpeg");
  assert.equal(filename.sanitizeFileExtension("folder/archive.tar.GZ"), "gz");
});

test("sanitizeFileExtension handles various dot configurations", () => {
  assert.equal(filename.sanitizeFileExtension("no_extension"), "noextension");
  assert.equal(filename.sanitizeFileExtension("file.name.with.many.dots.txt"), "txt");
  assert.equal(filename.sanitizeFileExtension("file."), "png");
  assert.equal(filename.sanitizeFileExtension("."), "png");
});

test("sanitizeFileExtension falls back for an invalid extension", () => {
  assert.equal(filename.sanitizeFileExtension("image.???", "WEBP"), "webp");
  assert.equal(filename.sanitizeFileExtension("", ""), "png");
});

test("sanitizeFileExtension handles malformed fallback", () => {
  assert.equal(filename.sanitizeFileExtension("file.???", "???"), "png");
  assert.equal(filename.sanitizeFileExtension("file.???", "fallback!@#"), "fallback");
});

test("sanitizeFileExtension truncates long extensions and fallbacks", () => {
  assert.equal(filename.sanitizeFileExtension("file.averylongextensionthatgoesbeyond16chars"), "averylongextensi");
  assert.equal(filename.sanitizeFileExtension("file.???", "averylongfallbackthatgoesbeyond16chars"), "averylongfallbac");
});

test("buildCompactTimestamp is deterministic", () => {
  const date = new Date(2026, 6, 26, 9, 8, 7);
  assert.equal(filename.buildCompactTimestamp(date), "20260726-090807");
});

test("buildDefaultMindMapTitle trims the prefix", () => {
  const date = new Date(2026, 6, 26, 9, 8, 7);
  assert.equal(filename.buildDefaultMindMapTitle("  项目导图  ", date), "项目导图 2026-07-26 0908");
  assert.equal(filename.buildDefaultMindMapTitle("", date), "2026-07-26 0908");
});

test("mimeTypeFromFilename covers supported formats and unknown files", () => {
  assert.equal(filename.mimeTypeFromFilename("a.JPG"), "image/jpeg");
  assert.equal(filename.mimeTypeFromFilename("diagram.svg"), "image/svg+xml");
  assert.equal(filename.mimeTypeFromFilename("document.bin"), "application/octet-stream");
});

test("remoteImageSuggestedName returns the URL filename and covers malformed URL fallback", () => {
  assert.equal(filename.remoteImageSuggestedName("https://example.com/images/photo.webp?size=large"), "photo.webp");
  assert.equal(filename.remoteImageSuggestedName("https://example.com/"), "remote-image.png");
  assert.equal(filename.remoteImageSuggestedName("https://["), "remote-image.png");
  assert.equal(filename.remoteImageSuggestedName("https://[", "fallback.jpg"), "fallback.jpg");
});
