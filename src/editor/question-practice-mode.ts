/**
 * @file question-practice-mode.ts
 * @description Full-page sequential practice renderer for maps in a configured question-bank folder.
 */

import { flattenNodes, nodePlainText, type MindMapContentBlock, type MindMapDocument, type MindMapNode } from "../core/model";

/** Determines whether practice traverses every question or only automatically collected mistakes. */
type QuestionFilter = "all" | "wrong";

/** Stateful selection kept by the editor while the question-bank mode is visible. */
export interface QuestionPracticeState {
  filter: QuestionFilter;
  currentNodeId: string | null;
  selectedOptionIds: string[];
  essayAnswer: string;
}

/** Dependencies required to render and persist one question-bank practice session. */
export interface QuestionPracticeOptions {
  document: MindMapDocument;
  state: QuestionPracticeState;
  resolveImage: (source: string) => string | null;
  onRecord: (nodeId: string, correct: boolean) => void;
  onNotice: (message: string) => void;
}

/** Creates an empty practice state for an editor instance. */
export function createQuestionPracticeState(): QuestionPracticeState {
  return { filter: "all", currentNodeId: null, selectedOptionIds: [], essayAnswer: "" };
}

/** Renders a full-page, sequential question practice surface. */
export function renderQuestionPracticeMode(container: HTMLElement, options: QuestionPracticeOptions): void {
  container.empty();
  const questions = flattenNodes(options.document.root).filter((node) => node.question && (options.state.filter === "all" || node.question.status === "wrong"));
  const shell = container.createDiv({ cls: "mms-question-practice-page" });
  const header = shell.createDiv({ cls: "mms-question-practice-header" });
  header.createEl("h2", { text: options.document.title || "题库练习" });
  const filters = header.createDiv({ cls: "mms-question-practice-filters" });
  for (const [filter, label] of [["all", "全部题目"], ["wrong", "错题本"]] as const) {
    const button = filters.createEl("button", { text: label, attr: { type: "button" } });
    button.toggleClass("is-active", options.state.filter === filter);
    button.onclick = () => {
      options.state.filter = filter;
      options.state.currentNodeId = null;
      options.state.selectedOptionIds = [];
      options.state.essayAnswer = "";
      renderQuestionPracticeMode(container, options);
    };
  }
  if (!questions.length) {
    shell.createDiv({ cls: "mms-question-practice-empty", text: options.state.filter === "wrong" ? "错题本暂无题目" : "当前导图还没有题目节点" });
    return;
  }
  const currentIndex = Math.max(0, questions.findIndex((node) => node.id === options.state.currentNodeId));
  const node = questions[currentIndex] ?? questions[0];
  options.state.currentNodeId = node.id;
  const question = node.question!;
  const answerLabels = selectedAnswerLabels(node);
  const multiple = question.mode === "choice" && answerLabels.length > 1;
  shell.createDiv({ cls: "mms-question-practice-progress", text: `${currentIndex + 1} / ${questions.length} · ${question.mode === "essay" ? "大题" : multiple ? "多选题" : "单选题"}` });
  shell.createEl("h3", { cls: "mms-question-practice-stem", text: nodePlainText(node) || "未命名题目" });
  renderBlocks(shell, question.stem, options.resolveImage);
  if (question.mode === "choice") {
    const choices = shell.createDiv({ cls: "mms-question-practice-choices" });
    question.options.forEach((option) => {
      const choice = choices.createEl("button", { attr: { type: "button" } });
      choice.toggleClass("is-selected", options.state.selectedOptionIds.includes(option.id));
      choice.createSpan({ cls: "mms-question-practice-option-label", text: option.label });
      renderBlocks(choice, option.content, options.resolveImage);
      choice.onclick = () => {
        options.state.selectedOptionIds = multiple
          ? options.state.selectedOptionIds.includes(option.id)
            ? options.state.selectedOptionIds.filter((id) => id !== option.id)
            : [...options.state.selectedOptionIds, option.id]
          : [option.id];
        renderQuestionPracticeMode(container, options);
      };
    });
  } else {
    const answer = shell.createEl("textarea", { cls: "mms-question-practice-answer", attr: { placeholder: "输入你的答案", rows: "7" } });
    answer.value = options.state.essayAnswer;
    answer.oninput = () => { options.state.essayAnswer = answer.value; };
  }
  const submit = shell.createEl("button", { cls: "mod-cta mms-question-practice-submit", text: "提交并下一题", attr: { type: "button" } });
  submit.onclick = () => {
    const correct = question.mode === "choice"
      ? isQuestionChoiceCorrect(node, options.state.selectedOptionIds)
      : isExactQuestionAnswer(options.state.essayAnswer, blockText(question.answer));
    if ((question.mode === "choice" && !options.state.selectedOptionIds.length) || (question.mode === "essay" && !normalizeAnswer(options.state.essayAnswer))) {
      options.onNotice("请先作答");
      return;
    }
    const next = questions[(currentIndex + 1) % questions.length];
    options.state.currentNodeId = next?.id ?? null;
    options.state.selectedOptionIds = [];
    options.state.essayAnswer = "";
    options.onRecord(node.id, correct);
    options.onNotice(correct ? "回答正确，下一题" : "回答错误，已加入错题本");
    renderQuestionPracticeMode(container, options);
  };
}

/** Extracts option labels from the stored answer to determine whether a question is multiple-choice. */
function selectedAnswerLabels(node: MindMapNode): string[] {
  const question = node.question!;
  const compact = blockText(question.answer).toLocaleUpperCase().replace(/[^A-Z0-9]/g, "");
  return question.options.filter((option) => compact.includes(option.label.toLocaleUpperCase())).map((option) => option.label);
}

/** Checks selected option IDs against the labels encoded in the structured answer. */
export function isQuestionChoiceCorrect(node: MindMapNode, selectedIds: readonly string[]): boolean {
  const expected = new Set(selectedAnswerLabels(node));
  const selected = node.question!.options.filter((option) => selectedIds.includes(option.id)).map((option) => option.label);
  return expected.size > 0 && expected.size === selected.length && selected.every((label) => expected.has(label));
}

/** Renders text and image blocks in their original order. */
function renderBlocks(container: HTMLElement, blocks: readonly MindMapContentBlock[], resolveImage: (source: string) => string | null): void {
  blocks.forEach((block) => {
    if (block.type === "text" && block.text.trim()) container.createDiv({ cls: "mms-question-practice-text", text: block.text });
    if (block.type === "image") {
      const source = resolveImage(block.source);
      if (source) container.createEl("img", { cls: "mms-question-practice-image", attr: { src: source, alt: block.alt || "题目图片" } });
    }
  });
}

/** Joins text blocks into the stored reference answer. */
function blockText(blocks: readonly MindMapContentBlock[]): string {
  return blocks.filter((block) => block.type === "text").map((block) => block.text).join("\n");
}

/** Normalizes free-text answers for deterministic long-question comparison. */
export function isExactQuestionAnswer(value: string, reference: string): boolean {
  return normalizeAnswer(value) === normalizeAnswer(reference);
}

/** Normalizes free-text answers before deterministic long-question comparison. */
function normalizeAnswer(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}
