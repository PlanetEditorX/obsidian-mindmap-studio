import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("question normalization keeps only verifiable original-question sources", () => {
  const valid = model.normalizeDocument({
    root: {
      text: "Question",
      children: [],
      question: {
        mode: "essay", stem: [], options: [], answer: [], explanation: [], tags: [],
        source: { title: "Official source", url: "https://example.com/question", matchedAt: "2026-07-28" }
      }
    }
  });
  assert.equal(valid.root.question.source.url, "https://example.com/question");
  const invalid = model.normalizeDocument({
    root: {
      text: "Question",
      children: [],
      question: {
        mode: "essay", stem: [], options: [], answer: [], explanation: [], tags: [],
        source: { title: "Unverified", url: "javascript:alert(1)", matchedAt: "2026-07-28" }
      }
    }
  });
  assert.equal(invalid.root.question.source, undefined);
});

test("question assistant keeps an intelligent image-to-question pipeline and visible answer fields", async () => {
  const [editorSource, articleSource, modalSource, mainSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/question-modal.ts", "utf8"),
    readFile("src/main.ts", "utf8")
  ]);
  assert.match(editorSource, /转为题目节点并智能处理/);
  assert.match(editorSource, /renderQuestionSummary/);
  assert.match(editorSource, /mmc-question-summary/);
  assert.match(editorSource, /显示答案与解析/);
  assert.match(articleSource, /renderArticleQuestionDetails/);
  assert.match(articleSource, /mms-question-panel/);
  assert.match(articleSource, /mms-question-reveal/);
  assert.match(modalSource, /AI 智能处理题目/);
  assert.match(modalSource, /已由 AI 分析补齐缺失答案与解答/);
  assert.match(mainSource, /仍需基于题目独立分析/);
});
