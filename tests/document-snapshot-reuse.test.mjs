import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function methodBlock(source, signature, nextSignature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `missing method ${signature}`);
  const end = source.indexOf(nextSignature, start + signature.length);
  assert.notEqual(end, -1, `missing method boundary ${nextSignature}`);
  return source.slice(start, end);
}

test("view reuses the detached change snapshot instead of recloning the full document tree", async () => {
  const [viewSource, editorSource] = await Promise.all([
    readFile(path.join(rootDir, "src/view.ts"), "utf8"),
    readFile(path.join(rootDir, "src/editor/editor.ts"), "utf8")
  ]);

  assert.match(editorSource, /getPersistedViewState\(\): MindMapDocument\["view"\][\s\S]*persistMindMapViewportState\(\)[\s\S]*return this\.document\.view \? \{ \.\.\.this\.document\.view \} : undefined;/);
  assert.match(editorSource, /this\.callbacks\.onChange\(this\.getDocument\(\), \{ articleContextImpact \}\)/, "change callbacks must still receive one isolated document clone");

  const getViewData = methodBlock(viewSource, "getViewData(): string", "async applyImageUploadPatches");
  assert.match(getViewData, /currentDocumentSnapshot\(true\)/);
  assert.doesNotMatch(getViewData, /getDocument\(\)/);

  const save = methodBlock(viewSource, "async save(clear?: boolean): Promise<void>", "async onClose");
  assert.match(save, /currentDocumentSnapshot\(true\)/);
  assert.doesNotMatch(save, /getDocument\(\)/);

  const helper = methodBlock(viewSource, "private currentDocumentSnapshot", "async save(clear?: boolean): Promise<void>");
  assert.match(helper, /getPersistedViewState\(\)/);
  assert.match(helper, /this\.document = \{ \.\.\.document, view \}/);

  assert.equal((viewSource.match(/\.getDocument\(\)/g) ?? []).length, 0, "host view should not request repeated full-tree editor clones");
});

test("read-only host consumers use the current revision snapshot for search, AI, recognition, and article rebuild", async () => {
  const viewSource = await readFile(path.join(rootDir, "src/view.ts"), "utf8");

  const familySearch = methodBlock(viewSource, "private async openMapFamilySearch", "refreshAppearance(): void");
  assert.match(familySearch, /openMapFamilySearch\(file, this\.document \?\? undefined\)/);

  const ai = methodBlock(viewSource, "private openAiModal", "private async recognizeImages");
  assert.match(ai, /const document = this\.document;/);

  const recognition = methodBlock(viewSource, "private async recognizeImages", "private getEditorOptions");
  assert.match(recognition, /const document = this\.document;/);

  const article = methodBlock(viewSource, "private async refreshArticleContext", "private applyViewClasses");
  assert.match(article, /const document = this\.document;/);
});

test("installed bundle carries the same snapshot reuse contract", async () => {
  const bundle = await readFile(path.join(rootDir, "main.js"), "utf8");
  assert.match(bundle, /getPersistedViewState\(\) \{[\s\S]*persistMindMapViewportState\(\)[\s\S]*return this\.document\.view \? \{ \.\.\.this\.document\.view \} : void 0;/);
  assert.match(bundle, /currentDocumentSnapshot\(includeViewport = false\)/);
  assert.match(bundle, /const document2 = this\.currentDocumentSnapshot\(true\);/);

  const viewStart = bundle.indexOf("var MindMapStudioView = class");
  const viewEnd = bundle.indexOf("// src/", viewStart + 30);
  const viewBundle = bundle.slice(viewStart, viewEnd > viewStart ? viewEnd : undefined);
  assert.equal((viewBundle.match(/\.getDocument\(\)/g) ?? []).length, 0, "installed view must not re-clone the editor document");
});
