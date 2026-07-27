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
