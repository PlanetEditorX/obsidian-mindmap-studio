import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let cleanup;

before(async () => {
  ({ module: model, cleanup } = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts"
  ], "src/core/model.ts"));
});

after(async () => cleanup?.());

test("structured question creation has editable fields for choice and essay modes", () => {
  const choice = model.createMindMapQuestion();
  const essay = model.createMindMapQuestion("essay");
  assert.equal(choice.mode, "choice");
  assert.equal(choice.options.length, 4);
  assert.equal(choice.stem[0].type, "text");
  assert.equal(essay.mode, "essay");
  assert.deepEqual(essay.options, []);
});

test("question normalization mirrors stem and tags into standard node fields", () => {
  const document = model.normalizeDocument({
    title: "Question",
    root: {
      id: "root",
      text: "old title",
      children: [],
      tags: ["existing"],
      question: {
        mode: "choice",
        stem: [{ id: "stem", type: "text", text: "What is 2 + 2?" }],
        options: [{ id: "a", label: "A", content: [{ id: "answer-a", type: "text", text: "4" }] }],
        answer: [{ id: "answer", type: "text", text: "A" }],
        explanation: [],
        tags: ["math", "existing"]
      }
    }
  });
  assert.equal(document.root.text, "What is 2 + 2?");
  assert.deepEqual(document.root.tags, ["existing", "math"]);
  assert.equal(model.nodeSearchText(document.root).includes("math"), true);
  assert.equal(model.documentToMarkdown(document).includes("What is 2 + 2?"), true);
});
