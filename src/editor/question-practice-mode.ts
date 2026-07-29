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
  tag: string | null;
  currentNodeId: string | null;
  selectedOptionIds: string[];
  essayAnswer: string;
  answerVisible: boolean;
  lastCorrect: boolean | null;
  finished: boolean;
  orderedNodeIds: string[];
  orderMode: QuestionPracticeOrder | null;
}

/** Supported ordering modes for a single answer session. */
export type QuestionPracticeOrder = "random" | "sequential";

/** Dependencies required to render and persist one question-bank practice session. */
export interface QuestionPracticeOptions {
  document: MindMapDocument;
  state: QuestionPracticeState;
  resolveImage: (source: string) => string | null;
  order: QuestionPracticeOrder;
  memoryCurveEnabled: boolean;
  wrongBookMasteryCount: number;
  onRecord: (nodeId: string, correct: boolean) => void;
  onNotice: (message: string) => void;
}

/** Creates an empty practice state for an editor instance. */
export function createQuestionPracticeState(): QuestionPracticeState {
  return { filter: "all", tag: null, currentNodeId: null, selectedOptionIds: [], essayAnswer: "", answerVisible: false, lastCorrect: null, finished: false, orderedNodeIds: [], orderMode: null };
}

/** Renders a full-page, sequential question practice surface. */
export function renderQuestionPracticeMode(container: HTMLElement, options: QuestionPracticeOptions): void {
  container.empty();
  const allQuestionNodes = flattenNodes(options.document.root).filter((node) => node.question);
  const candidates = allQuestionNodes.filter((node) => node.question && (
    options.state.filter === "all"
    || node.question.status === "wrong"
    || (options.state.answerVisible && node.id === options.state.currentNodeId)
  ) && (!options.state.tag || node.question.tags.includes(options.state.tag)));
  const questions = orderPracticeQuestions(candidates, options.state, options.order);
  const shell = container.createDiv({ cls: "mms-question-practice-page" });
  const header = shell.createDiv({ cls: "mms-question-practice-header" });
  header.createEl("h2", { text: options.document.title || "答题" });
  const filters = header.createDiv({ cls: "mms-question-practice-filters" });
  for (const [filter, label] of [["all", "全部题目"], ["wrong", "错题本"]] as const) {
    const button = filters.createEl("button", { text: label, attr: { type: "button" } });
    button.toggleClass("is-active", options.state.filter === filter);
    button.onclick = () => {
      options.state.filter = filter;
      options.state.currentNodeId = null;
      options.state.selectedOptionIds = [];
      options.state.essayAnswer = "";
      options.state.answerVisible = false;
      options.state.lastCorrect = null;
      options.state.finished = false;
      options.state.orderedNodeIds = [];
      options.state.orderMode = null;
      renderQuestionPracticeMode(container, options);
    };
  }
  const tags = Array.from(new Set(allQuestionNodes.flatMap((node) => node.question!.tags))).sort((left, right) => left.localeCompare(right, "zh-CN"));
  if (tags.length) {
    const tagSelect = filters.createEl("select", { cls: "mms-question-practice-tag-filter", attr: { "aria-label": "题目标签" } });
    tagSelect.createEl("option", { value: "", text: "全部标签" });
    tags.forEach((tag) => tagSelect.createEl("option", { value: tag, text: tag }));
    tagSelect.value = options.state.tag ?? "";
    tagSelect.onchange = () => {
      options.state.tag = tagSelect.value || null;
      resetPracticeProgress(options.state);
      renderQuestionPracticeMode(container, options);
    };
  }
  if (!questions.length) {
    shell.createDiv({ cls: "mms-question-practice-empty", text: options.state.filter === "wrong" ? "错题本暂无题目" : "当前导图还没有题目节点" });
    return;
  }
  if (options.state.finished) {
    shell.createDiv({ cls: "mms-question-practice-finished", text: "本轮答题已完成" });
    const restart = shell.createEl("button", { cls: "mod-cta mms-question-practice-submit", text: "重新开始", attr: { type: "button" } });
    restart.onclick = () => {
      options.state.currentNodeId = null;
      options.state.selectedOptionIds = [];
      options.state.essayAnswer = "";
      options.state.answerVisible = false;
      options.state.lastCorrect = null;
      options.state.finished = false;
      options.state.orderedNodeIds = [];
      options.state.orderMode = null;
      renderQuestionPracticeMode(container, options);
    };
    return;
  }
  const currentIndex = Math.max(0, questions.findIndex((node) => node.id === options.state.currentNodeId));
  const node = questions[currentIndex] ?? questions[0];
  options.state.currentNodeId = node.id;
  const question = node.question!;
  const answerLabels = selectedAnswerLabels(node);
  const multiple = question.mode === "choice" && answerLabels.length > 1;
  const questionKind = question.mode === "essay" ? "大题" : question.mode === "judgment" ? "判断题" : multiple ? "多选题" : "单选题";
  shell.createDiv({ cls: "mms-question-practice-progress", text: `${currentIndex + 1} / ${questions.length} · ${questionKind}` });
  shell.createEl("h3", { cls: "mms-question-practice-stem", text: nodePlainText(node) || "未命名题目" });
  renderBlocks(shell, question.stem.filter((block) => block.type !== "text"), options.resolveImage);
  if (question.mode !== "essay") {
    const choices = shell.createDiv({ cls: "mms-question-practice-choices" });
    question.options.forEach((option) => {
      const choice = choices.createEl("label", { cls: "mms-question-practice-choice" });
      choice.toggleClass("is-selected", options.state.selectedOptionIds.includes(option.id));
      const input = choice.createEl("input", {
        attr: {
          type: multiple ? "checkbox" : "radio",
          name: `mms-question-${node.id}`,
          value: option.id,
          "aria-label": `选择${option.label}`
        }
      });
      input.checked = options.state.selectedOptionIds.includes(option.id);
      input.disabled = options.state.answerVisible;
      choice.createSpan({ cls: "mms-question-practice-option-label", text: option.label });
      renderBlocks(choice, option.content, options.resolveImage);
      input.addEventListener("change", () => {
        options.state.selectedOptionIds = multiple
          ? options.state.selectedOptionIds.includes(option.id)
            ? options.state.selectedOptionIds.filter((id) => id !== option.id)
            : [...options.state.selectedOptionIds, option.id]
          : [option.id];
        renderQuestionPracticeMode(container, options);
      });
    });
  } else {
    const answer = shell.createEl("textarea", { cls: "mms-question-practice-answer", attr: { placeholder: "输入你的答案", rows: "7" } });
    answer.value = options.state.essayAnswer;
    answer.disabled = options.state.answerVisible;
    answer.oninput = () => { options.state.essayAnswer = answer.value; };
  }
  if (!options.state.answerVisible) {
    const reveal = shell.createEl("button", { cls: "mod-cta mms-question-practice-submit", text: "查看答案与解析", attr: { type: "button" } });
    reveal.onclick = () => {
    const correct = question.mode === "essay"
      ? isExactQuestionAnswer(options.state.essayAnswer, blockText(question.answer))
      : question.mode === "judgment"
        ? isQuestionJudgmentCorrect(node, options.state.selectedOptionIds)
        : isQuestionChoiceCorrect(node, options.state.selectedOptionIds);
    if ((question.mode !== "essay" && !options.state.selectedOptionIds.length) || (question.mode === "essay" && !normalizeAnswer(options.state.essayAnswer))) {
      options.onNotice("请先作答");
      return;
    }
    options.state.answerVisible = true;
    options.state.lastCorrect = correct;
    options.onRecord(node.id, correct);
    options.onNotice(correct ? "回答正确" : "回答错误，已加入错题本");
    renderQuestionPracticeMode(container, options);
    };
    return;
  }
  const result = shell.createDiv({ cls: `mms-question-practice-result ${options.state.lastCorrect ? "is-correct" : "is-wrong"}`, text: options.state.lastCorrect ? "回答正确" : "回答错误，已加入错题本" });
  result.setAttr("role", "status");
  shell.createEl("h4", { text: "参考答案" });
  renderBlocks(shell, question.answer, options.resolveImage);
  if (question.explanation.length) {
    shell.createEl("h4", { text: "解析" });
    renderExplanationBlocks(shell, question.explanation, options.resolveImage);
  }
  const finalQuestion = currentIndex === questions.length - 1;
  const next = shell.createEl("button", { cls: "mod-cta mms-question-practice-submit", text: finalQuestion ? "结束答题" : "下一题", attr: { type: "button" } });
  next.onclick = () => {
    if (finalQuestion) {
      options.state.finished = true;
      options.state.selectedOptionIds = [];
      options.state.essayAnswer = "";
      options.state.answerVisible = false;
      options.state.lastCorrect = null;
      renderQuestionPracticeMode(container, options);
      return;
    }
    const nextNode = questions[(currentIndex + 1) % questions.length];
    options.state.currentNodeId = nextNode?.id ?? null;
    options.state.selectedOptionIds = [];
    options.state.essayAnswer = "";
    options.state.answerVisible = false;
    options.state.lastCorrect = null;
    renderQuestionPracticeMode(container, options);
  };
}

/** Keeps one session stable while adding new questions in the requested random or sequential order. */
function orderPracticeQuestions(nodes: MindMapNode[], state: QuestionPracticeState, order: QuestionPracticeOrder): MindMapNode[] {
  if (state.orderMode !== order) {
    state.orderMode = order;
    state.orderedNodeIds = [];
  }
  /* Tag filtering UI is rendered with the header filters above. */
  /*
  if (tags.length) {
    const tagSelect = filters.createEl("select", { cls: "mms-question-practice-tag-filter", attr: { "aria-label": "题目标签" } });
    tagSelect.createEl("option", { value: "", text: "全部标签" });
    tags.forEach((tag) => tagSelect.createEl("option", { value: tag, text: tag }));
    tagSelect.value = options.state.tag ?? "";
    tagSelect.onchange = () => {
      options.state.tag = tagSelect.value || null;
      resetPracticeProgress(options.state);
      renderQuestionPracticeMode(container, options);
    };
  }
  */
  const available = new Map(nodes.map((node) => [node.id, node]));
  const retained = state.orderedNodeIds.filter((id) => available.has(id));
  const appended = nodes.map((node) => node.id).filter((id) => !retained.includes(id));
  if (order === "random") shuffle(appended);
  state.orderedNodeIds = [...retained, ...appended];
  return state.orderedNodeIds.flatMap((id) => available.get(id) ?? []);
}

/** Performs an in-place Fisher-Yates shuffle for one answer session. */
function shuffle<T>(items: T[]): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target]!, items[index]!];
  }
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

/** Checks true-or-false answers expressed as A/B, correct/incorrect, or equivalent labels. */
export function isQuestionJudgmentCorrect(node: MindMapNode, selectedIds: readonly string[]): boolean {
  const selected = node.question!.options.find((option) => selectedIds.includes(option.id));
  if (!selected) return false;
  return normalizeJudgmentAnswer(blockText(selected.content) || selected.label) === normalizeJudgmentAnswer(blockText(node.question!.answer));
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

/** Renders A/B/C/D explanation paragraphs as separate readable lines. */
function renderExplanationBlocks(container: HTMLElement, blocks: readonly MindMapContentBlock[], resolveImage: (source: string) => string | null): void {
  for (const block of blocks) {
    if (block.type === "text") {
      splitExplanationLines(block.text).forEach((text) => container.createDiv({ cls: "mms-question-practice-explanation-item", text }));
    } else {
      renderBlocks(container, [block], resolveImage);
    }
  }
}

/** Splits common A/B/C/D analysis markers into individual display paragraphs. */
export function splitExplanationLines(value: string): string[] {
  const lines = value.split(/(?=[A-DＡ-Ｄ]项|综上所述[，,]?(?:正确选项|答案)(?:为|是)?|(?:正确选项|答案)(?:为|是)?)/u).map((line) => line.trim()).filter(Boolean);
  return lines.length ? lines : value.trim() ? [value.trim()] : [];
}

/** Clears transient practice state when the active question set changes. */
function resetPracticeProgress(state: QuestionPracticeState): void {
  state.currentNodeId = null;
  state.selectedOptionIds = [];
  state.essayAnswer = "";
  state.answerVisible = false;
  state.lastCorrect = null;
  state.finished = false;
  state.orderedNodeIds = [];
  state.orderMode = null;
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

/** Converts supported judgment-answer spellings into a comparable boolean. */
function normalizeJudgmentAnswer(value: string): boolean | null {
  const answer = normalizeAnswer(value);
  if (["正确", "对", "是", "true", "yes", "a"].includes(answer)) return true;
  if (["错误", "错", "否", "false", "no", "b"].includes(answer)) return false;
  return null;
}
