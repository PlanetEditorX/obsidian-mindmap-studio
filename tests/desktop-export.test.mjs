import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let desktopExport;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModule("src/utils/desktop-export.ts");
  desktopExport = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("sanitizeExportFilename removes invalid cross-platform characters", () => {
  assert.equal(desktopExport.sanitizeExportFilename('a<b>c:d"e/f\\g|h?i*j\x00k\x1Fl'), "a b c d e f g h i j k l");
});

test("sanitizeExportFilename normalizes multiple whitespaces", () => {
  assert.equal(desktopExport.sanitizeExportFilename("  multiple   spaces  test  "), "multiple spaces test");
});

test("sanitizeExportFilename removes trailing dots and spaces", () => {
  assert.equal(desktopExport.sanitizeExportFilename("trailing dots..."), "trailing dots");
  assert.equal(desktopExport.sanitizeExportFilename("trailing spaces and dots . . ."), "trailing spaces and dots");
});

test("sanitizeExportFilename applies fallback when empty after sanitization", () => {
  assert.equal(desktopExport.sanitizeExportFilename(""), "思维导图");
  assert.equal(desktopExport.sanitizeExportFilename("   "), "思维导图");
  assert.equal(desktopExport.sanitizeExportFilename("..."), "思维导图");
  assert.equal(desktopExport.sanitizeExportFilename("<>?*"), "思维导图");
  assert.equal(desktopExport.sanitizeExportFilename("", "Custom Fallback"), "Custom Fallback");
});
