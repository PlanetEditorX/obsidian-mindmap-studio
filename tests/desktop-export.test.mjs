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

test("resolveExportBaseName prefers the frozen file name, then the frozen title", () => {
  assert.equal(desktopExport.resolveExportBaseName({ basename: "课程" }, "课程"), "课程");
  assert.equal(desktopExport.resolveExportBaseName({ basename: "旧名字" }, "新标题"), "旧名字", "冻结的文件名必须优先于标题");
  assert.equal(desktopExport.resolveExportBaseName(null, "速算技巧"), "速算技巧", "文件缺失时回退到冻结标题");
  assert.equal(desktopExport.resolveExportBaseName(undefined, undefined), "思维导图");
  assert.equal(desktopExport.resolveExportBaseName(null, ""), "", "标题存在时不额外兜底，保持与旧表达式一致");
});
