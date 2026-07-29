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

test("structured question creation has editable fields for choice, judgment, and essay modes", () => {
  const choice = model.createMindMapQuestion();
  const judgment = model.createMindMapQuestion("judgment");
  const essay = model.createMindMapQuestion("essay");
  assert.equal(choice.mode, "choice");
  assert.equal(choice.options.length, 4);
  assert.equal(choice.stem[0].type, "text");
  assert.equal(judgment.mode, "judgment");
  assert.deepEqual(judgment.options.map((option) => option.label), ["正确", "错误"]);
  assert.equal(judgment.answer[0].text, "正确");
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

test("authoritative content replacement permanently removes legacy table and code mirrors", () => {
  const document = model.normalizeDocument({
    root: {
      text: "Mixed content",
      content: [{ id: "text", type: "text", text: "Keep me" }],
      table: { headers: ["A"], rows: [["1"]] },
      code: { language: "bash", code: "echo old" },
      children: []
    }
  });

  const textOnly = document.root.content.filter((block) => block.type === "text");
  model.replaceNodeContentBlocks(document.root, textOnly);

  assert.deepEqual(document.root.content.map((block) => block.type), ["text"]);
  assert.equal(document.root.text, "Keep me");
  assert.equal(document.root.table, undefined);
  assert.equal(document.root.code, undefined);
  assert.deepEqual(model.nodeContentBlocks(document.root).map((block) => block.type), ["text"]);
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

test("Markdown clipping import preserves frontmatter title, hierarchy, text and linked images", () => {
  const document = model.markdownToDocument(`---
title: "全屋组网"
source: "https://example.com/post"
---

## 全屋组网

## 网络环境

光猫和客厅之间只有一根网线。

![网络拓扑](https://example.com/topology.png)

### 光猫配置

- 保存备份
[![配置截图](https://example.com/config.png)](https://example.com/original)
`, "导入文件");
  assert.equal(document.root.text, "全屋组网");
  assert.deepEqual(document.root.children.map((node) => node.text), ["网络环境"]);
  const network = document.root.children[0];
  assert.equal(network.children[0]?.text, "光猫和客厅之间只有一根网线。");
  assert.deepEqual(model.nodeContentBlocks(network).filter((block) => block.type === "image").map((block) => block.source), ["https://example.com/topology.png"]);
  const modem = network.children[1];
  assert.equal(modem.text, "光猫配置");
  assert.equal(modem.children[0]?.text, "保存备份");
  assert.deepEqual(model.nodeContentBlocks(modem.children[0]).filter((block) => block.type === "image").map((block) => block.source), ["https://example.com/config.png"]);
});

test("Markdown import does not invent a placeholder topic when no child node is parsed", () => {
  const document = model.markdownToDocument("Only plain text", "Imported note");
  assert.equal(document.root.children.length, 0);
  assert.doesNotMatch(JSON.stringify(document), /主题 1/);
});

test("Markdown import converts Obsidian image embeds into image blocks", () => {
  const document = model.markdownToDocument("# 导入笔记\n\n![[Pasted image 20260622014655.png]]", "导入文件");
  const images = model.nodeContentBlocks(document.root).filter((block) => block.type === "image");
  assert.deepEqual(images.map((block) => block.source), ["Pasted image 20260622014655.png"]);
  assert.doesNotMatch(JSON.stringify(document.root.content), /!\[\[/);
});

test("question-bank grading distinguishes single choice, multiple choice, judgment, and normalized essay answers", () => {
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
  const judgment = model.normalizeDocument({
    root: {
      text: "Judgment", children: [], question: {
        mode: "judgment", stem: [], tags: [], answer: [{ id: "answer", type: "text", text: "错误" }], explanation: [],
        options: [
          { id: "yes", label: "正确", content: [{ id: "yes-text", type: "text", text: "正确" }] },
          { id: "no", label: "错误", content: [{ id: "no-text", type: "text", text: "错误" }] }
        ]
      }
    }
  }).root;
  assert.equal(practice.isQuestionJudgmentCorrect(judgment, ["no"]), true);
  assert.equal(practice.isQuestionJudgmentCorrect(judgment, ["yes"]), false);
  assert.equal(practice.isExactQuestionAnswer(" 资料 分析！", "资料分析"), true);
  assert.equal(practice.isExactQuestionAnswer("资料理解", "资料分析"), false);
  assert.deepEqual(practice.splitExplanationLines("A项正确。B项错误。C项待定。"), ["A项正确。", "B项错误。", "C项待定。"]);
  assert.deepEqual(practice.splitExplanationLines("D项错误。综上所述，正确选项为 A、C、D。"), ["D项错误。", "综上所述，", "正确选项为 A、C、D。"]);
});

test("question-bank practice persists attempts, routes mistakes to review, and advances after showing feedback", async () => {
  const [editorSource, practiceSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/question-practice-mode.ts", "utf8")
  ]);
  assert.match(editorSource, /question\.attemptCount \+= 1/);
  assert.match(editorSource, /if \(correct\)[\s\S]*question\.correctCount \+= 1[\s\S]*question\.status = "completed"/);
  assert.match(editorSource, /else \{\s*question\.status = "wrong"/);
  assert.match(editorSource, /question\.lastPracticedAt = new Date\(\)\.toISOString\(\)/);
  assert.match(editorSource, /onRecord: \(nodeId, correct\) => this\.recordQuestionPractice\(nodeId, correct\)/);
  assert.doesNotMatch(editorSource, /onRecord: \(nodeId, correct\) => \{[\s\S]{0,320}this\.mutate\(/);
  assert.match(practiceSource, /node\.question\.status === "wrong"[\s\S]*options\.state\.filter === "wrong"/);
  assert.match(practiceSource, /type: multiple \? "checkbox" : "radio"/);
  assert.match(practiceSource, /choice\.toggleClass\("is-selected", options\.state\.selectedOptionIds\.includes\(option\.id\)\)/);
  assert.match(practiceSource, /input\.addEventListener\("change"/);
  assert.match(practiceSource, /text: finalQuestion \? "结束答题" : "下一题"/);
  assert.match(practiceSource, /if \(finalQuestion\) \{[\s\S]*options\.state\.finished = true/);
  assert.match(practiceSource, /text: "本轮答题已完成"/);
  assert.match(practiceSource, /question\.stem\.filter\(\(block\) => block\.type !== "text"\)/);
  assert.match(practiceSource, /orderPracticeQuestions\(candidates, options\.state, options\.order\)/);
  assert.match(practiceSource, /if \(order === "random"\) shuffle\(appended\)/);
  assert.match(practiceSource, /text: options\.document\.title \|\| "答题"/);
});

test("question assistant keeps an intelligent image-to-question pipeline and visible answer fields", async () => {
  const [editorSource, articleSource, modalSource, practiceSource, mainSource, settingsSource, viewSource] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("src/editor/question-modal.ts", "utf8"),
    readFile("src/editor/question-practice-mode.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/settings.ts", "utf8"),
    readFile("src/view.ts", "utf8")
  ]);
  assert.match(editorSource, /转为题目节点并智能处理/);
  assert.match(editorSource, /renderQuestionSummary/);
  assert.match(editorSource, /mmc-question-summary/);
  assert.match(editorSource, /显示答案与解析/);
  assert.match(articleSource, /renderArticleQuestionDetails/);
  assert.match(articleSource, /mms-question-panel/);
  assert.match(articleSource, /mms-question-reveal/);
  assert.match(modalSource, /AI 智能处理题目/);
  assert.match(modalSource, /value: "judgment", text: "判断题"/);
  assert.match(modalSource, /"常识判断", "时政", "政治", "经济", "法律"/);
  assert.match(practiceSource, /isQuestionJudgmentCorrect/);
  assert.match(editorSource, /addToolbarButton\("question", "file-plus-2"/);
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
  assert.match(editorSource, /replaceNodeContentBlocks\(selected, values\.content\)/);
  assert.match(practiceSource, /查看答案与解析/);
  assert.match(practiceSource, /下一题/);
  assert.match(practiceSource, /错题本/);
  assert.match(practiceSource, /isQuestionChoiceCorrect/);
  assert.match(practiceSource, /isExactQuestionAnswer/);
  assert.match(mainSource, /isQuestionBankFile/);
  assert.match(settingsSource, /题库文件夹/);
  assert.match(settingsSource, /questionPracticeOrder: "random"/);
  assert.match(settingsSource, /questionBankFolders: \[\]/);
  assert.match(settingsSource, /错题本记忆曲线/);
  assert.match(settingsSource, /错题移除前答对次数/);
  assert.match(practiceSource, /mms-question-practice-tag-filter/);
  assert.match(practiceSource, /options\.state\.tag/);
  assert.match(editorSource, /questionMemoryCurveEnabled/);
  assert.match(editorSource, /wrongBookMasteryCount/);
  assert.match(settingsSource, /setName\("答题顺序"\)/);
  assert.match(viewSource, /questionPracticeOrder: this\.plugin\.settings\.questionPracticeOrder/);
  assert.match(editorSource, /applyAndEnrichAiQuestion\(responseText: string, nodeId\?: string\): Promise<boolean>/);
  assert.match(editorSource, /parseRecognizedQuestion\(responseText, fallback\)/);
  assert.match(viewSource, /onConvertToQuestion: \(responseText\) => this\.editor\?\.applyAndEnrichAiQuestion\(responseText, nodeId\) \?\? false/);
  assert.match(modalSource, /已由 AI 分析补齐缺失答案与解答/);
  assert.match(mainSource, /仍需基于题目独立分析/);
});
