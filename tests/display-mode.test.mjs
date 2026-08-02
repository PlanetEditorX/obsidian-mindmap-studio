import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let displayMode;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModule("src/article/display-mode.ts");
  displayMode = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("outline is never restored as the next startup mode when mindmap is visible", () => {
  assert.equal(displayMode.resolveStartupDisplayMode("outline", ["mindmap", "outline", "article", "reading"]), "mindmap");
});

test("startup mode falls back to another persistent mode when mindmap is hidden", () => {
  assert.equal(displayMode.resolveStartupDisplayMode("outline", ["outline", "article", "reading"]), "article");
  assert.equal(displayMode.resolveStartupDisplayMode("article", ["outline", "reading"]), "reading");
});

test("only outline is session-only", () => {
  assert.equal(displayMode.shouldPersistDisplayMode("outline"), false);
  assert.equal(displayMode.shouldPersistDisplayMode("mindmap"), true);
  assert.equal(displayMode.shouldPersistDisplayMode("article"), true);
  assert.equal(displayMode.shouldPersistDisplayMode("reading"), true);
});


test("article entry policy supports a mode-local remembered lock state", () => {
  assert.equal(displayMode.normalizeArticleEntryLockMode("locked"), "locked");
  assert.equal(displayMode.normalizeArticleEntryLockMode("inherit"), "inherit");
  assert.equal(displayMode.normalizeArticleEntryLockMode("remember"), "remember");
  assert.equal(displayMode.normalizeArticleEntryLockMode("unknown"), "locked");

  assert.equal(displayMode.resolveArticleEntryReadOnly("locked", false, false), true);
  assert.equal(displayMode.resolveArticleEntryReadOnly("inherit", false, true), false);
  assert.equal(displayMode.resolveArticleEntryReadOnly("inherit", true, false), true);
  assert.equal(displayMode.resolveArticleEntryReadOnly("remember", true, false), false);
  assert.equal(displayMode.resolveArticleEntryReadOnly("remember", false, true), true);
});
