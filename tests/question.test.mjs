import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let model;
let practice;
let cleanup;

before(async () => {
  ({ module: model, cleanup } = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/editor/question-practice-mode.ts"
  ], "src/core/model.ts"));
  ({ module: practice } = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/editor/question-practice-mode.ts"
  ], "src/editor/question-practice-mode.ts"));
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
  assert.equal(document.root.question.status, "unanswered");
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

test("legacy tables and code migrate into movable node content blocks", () => {
  const document = model.normalizeDocument({
    root: {
      text: "Mixed content",
      content: [{ id: "text", type: "text", text: "Before" }],
      table: { headers: ["A"], rows: [["1"]] },
      code: { language: "bash", code: "echo hello" },
      children: []
    }
  });
  assert.deepEqual(document.root.content.map((block) => block.type), ["text", "table", "code"]);
  assert.equal(document.root.table.headers[0], "A");
  assert.equal(document.root.code.language, "bash");
});

test("code block display settings persist while unsupported themes fall back safely", () => {
  const document = model.normalizeDocument({
    root: {
      text: "Code",
      code: { language: "typescript", code: "const value = 1;", collapsed: true, showLineNumbers: true, theme: "dracula" },
      children: []
    }
  });
  assert.deepEqual(document.root.code, {
    language: "typescript",
    code: "const value = 1;",
    collapsed: true,
    showLineNumbers: true,
    theme: "dracula"
  });
  const invalid = model.normalizeDocument({ root: { text: "Code", code: { code: "x", theme: "unknown" }, children: [] } });
  assert.equal(invalid.root.code.theme, undefined);
  const explicitOff = model.normalizeDocument({
    appearance: { codeCollapsed: true, codeShowLineNumbers: false, codeTheme: "github" },
    root: { text: "Code", code: { code: "x", collapsed: false, showLineNumbers: false }, children: [] }
  });
  assert.equal(explicitOff.appearance.codeCollapsed, true);
  assert.equal(explicitOff.appearance.codeShowLineNumbers, false);
  assert.equal(explicitOff.root.code.collapsed, false);
  assert.equal(explicitOff.root.code.showLineNumbers, false);
  assert.equal(typeof model.normalizeDocument({ root: { text: "One line", code: { code: "x" }, children: [] } }).root.code.collapsed, "undefined");
});

test("code line-number thresholds override inherited defaults while node settings stay first", async () => {
  const viewSource = await readFile(new URL("../src/view.ts", import.meta.url), "utf8");
  assert.match(viewSource, /lineNumberThreshold > 0 \? lineCount > lineNumberThreshold : undefined/);
  assert.match(viewSource, /block\.showLineNumbers \?\? autoLineNumbers \?\? pageCode\?\.codeShowLineNumbers/);
  assert.match(viewSource, /--mms-code-line-gutter-top/);
});

test("question-bank grading distinguishes single choice, multiple choice and normalized essay answers", () => {
  const choice = model.normalizeDocument({
    root: {
      text: "Choice", children: [], question: {
        mode: "choice", stem: [], tags: [], answer: [{ id: "answer", type: "text", text: "A、C" }], explanation: [],
        options: ["A", "B", "C"].map((label) => ({ id: label, label, content: [] }))
      }
    }
  }).root;
  assert.equal(practice.isQuestionChoiceCorrect(choice, ["A", "C"]), true);
  assert.equal(practice.isQuestionChoiceCorrect(choice, ["A"]), false);
  assert.equal(practice.isQuestionChoiceCorrect(choice, ["A", "B", "C"]), false);
  assert.equal(practice.isExactQuestionAnswer(" 资料 分析！", "资料分析"), true);
  assert.equal(practice.isExactQuestionAnswer("资料理解", "资料分析"), false);
});

test("question assistant keeps an intelligent image-to-question pipeline and visible answer fields", async () => {
  const [editorSource, articleSource, modalSource, practiceSource, mainSource, settingsSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/question-modal.ts", "utf8"),
    readFile("src/editor/question-practice-mode.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/settings.ts", "utf8")
  ]);
  assert.match(editorSource, /转为题目节点并智能处理/);
  assert.match(editorSource, /renderQuestionSummary/);
  assert.match(editorSource, /mmc-question-summary/);
  assert.match(editorSource, /显示答案与解析/);
  assert.match(articleSource, /renderArticleQuestionDetails/);
  assert.match(articleSource, /mms-question-panel/);
  assert.match(articleSource, /mms-question-reveal/);
  assert.match(modalSource, /AI 智能处理题目/);
  assert.match(editorSource, /renderQuestionPracticeMode/);
  assert.match(editorSource, /const activeBlockId = blockId \?\? textBlock\?\.id \?\? newId\(\)/);
  assert.doesNotMatch(editorSource, /selected\.text = plainText/);
  assert.doesNotMatch(editorSource, /addToolbarButton\("question-bank"/);
  const contentModalSource = await readFile("src/editor/content-modals.ts", "utf8");
  assert.match(contentModalSource, /CODE_LANGUAGE_OPTIONS/);
  assert.match(contentModalSource, /自定义语言/);
  assert.match(contentModalSource, /\|\| "bash"/);
  assert.match(editorSource, /\+ 表格/);
  assert.match(editorSource, /\+ 代码/);
  assert.match(practiceSource, /查看答案与解析/);
  assert.match(practiceSource, /下一题/);
  assert.match(practiceSource, /错题本/);
  assert.match(practiceSource, /isQuestionChoiceCorrect/);
  assert.match(practiceSource, /isExactQuestionAnswer/);
  assert.match(mainSource, /isQuestionBankFile/);
  assert.match(settingsSource, /题库文件夹/);
  assert.match(modalSource, /已由 AI 分析补齐缺失答案与解答/);
  assert.match(mainSource, /仍需基于题目独立分析/);
});
