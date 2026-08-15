import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let cleanup;

before(async () => {
  const result = await loadTypeScriptModules(
    ["src/core/model.ts", "src/core/node-tree.ts"],
    "src/core/model.ts"
  );
  model = result.module;
  cleanup = result.cleanup;
});

after(async () => {
  if (cleanup) await cleanup();
});

test("syncNodeContentFields handles empty node content", () => {
  const node = { id: "1", content: [] };
  model.syncNodeContentFields(node);
  assert.equal(node.content, undefined);
  assert.equal(node.text, "");
  assert.equal(node.richText, undefined);
  assert.equal(node.image, undefined);
  assert.equal(node.table, undefined);
  assert.equal(node.code, undefined);
});

test("syncNodeContentFields aggregates multiple text blocks into a single string", () => {
  const node = {
    id: "1",
    content: [
      { id: "t1", type: "text", text: "Hello" },
      { id: "t2", type: "text", text: "World" }
    ]
  };
  model.syncNodeContentFields(node);
  assert.equal(node.text, "Hello World");
  assert.equal(node.richText, undefined);
});

test("syncNodeContentFields normalizes rich text when there is exactly one text block", () => {
  const node = {
    id: "1",
    content: [
      { id: "t1", type: "text", text: "Hello", richText: [{ text: "Hello", style: { bold: true } }] }
    ]
  };
  model.syncNodeContentFields(node);
  assert.equal(node.text, "Hello");
  assert.deepEqual(node.richText, [
    {
      text: "Hello",
      style: {
        bold: true,
        italic: undefined,
        underline: undefined,
        strike: undefined,
        code: undefined,
        color: undefined,
        link: undefined
      }
    }
  ]);
});

test("syncNodeContentFields assigns the first image block to node.image", () => {
  const node = {
    id: "1",
    content: [
      { id: "i1", type: "image", source: "image1.png" },
      { id: "i2", type: "image", source: "image2.png" }
    ]
  };
  model.syncNodeContentFields(node);
  assert.equal(node.image, "image1.png");
});

test("syncNodeContentFields assigns the first table block to node.table", () => {
  const tableDef = { headers: ["C1"], rows: [["V1"]] };
  const expectedTableDef = { headers: ["C1"], rows: [["V1"]], source: "manual", alignments: undefined, columnWidths: undefined };
  const node = {
    id: "1",
    content: [
      { id: "tb1", type: "table", table: tableDef },
      { id: "tb2", type: "table", table: { headers: [], rows: [] } }
    ]
  };
  model.syncNodeContentFields(node);
  assert.deepEqual(node.table, expectedTableDef);
});

test("syncNodeContentFields assigns the first code block to node.code", () => {
  const codeDef = { language: "js", code: "console.log(1);" };
  const node = {
    id: "1",
    content: [
      { id: "c1", type: "code", code: codeDef },
      { id: "c2", type: "code", code: { language: "ts", code: "" } }
    ]
  };
  model.syncNodeContentFields(node);
  assert.deepEqual(node.code, codeDef);
});

test("syncNodeContentFields retains content array when it has items", () => {
  const node = {
    id: "1",
    content: [
      { id: "t1", type: "text", text: "Test" },
      { id: "c1", type: "code", code: { language: "js", code: "test" } }
    ]
  };
  model.syncNodeContentFields(node);
  assert.ok(Array.isArray(node.content));
  assert.equal(node.content.length, 2);
  assert.equal(node.text, "Test");
  assert.equal(node.code.language, "js");
});
