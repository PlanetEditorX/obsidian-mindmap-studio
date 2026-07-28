/**
 * @file question-bank-modal.ts
 * @description Searchable current-map question bank with tag statistics and random practice.
 */

import { App, Modal } from "obsidian";
import { flattenNodes, nodePlainText, type MindMapDocument, type MindMapQuestion, type MindMapQuestionStatus } from "../core/model";

const STATUS_LABELS: Record<MindMapQuestionStatus | "all", string> = {
  all: "全部状态",
  unanswered: "未做",
  completed: "已做",
  favorite: "收藏",
  wrong: "错题",
  mastered: "掌握"
};

/** Opens a compact question-bank browser over the active mind-map document. */
export class QuestionBankModal extends Modal {
  private query = "";
  private status: MindMapQuestionStatus | "all" = "all";
  private tag = "";
  private practiceNodeId: string | null = null;
  private selectedOptionId: string | null = null;
  private answerVisible = false;

  /** Creates the bank over one document and delegates navigation and learning-state updates. */
  constructor(
    app: App,
    private readonly document: MindMapDocument,
    private readonly onOpenNode: (nodeId: string) => void,
    private readonly onSetStatus: (nodeId: string, status: MindMapQuestionStatus) => void,
    private readonly onRecordPractice: (nodeId: string, correct: boolean) => void
  ) {
    super(app);
  }

  /** Initializes the modal and renders the current filters. */
  onOpen(): void {
    this.modalEl.addClass("mms-question-bank-modal");
    this.render();
  }

  /** Rebuilds filters and result cards from the latest in-memory document snapshot. */
  private render(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "题库" });
    if (this.practiceNodeId) {
      this.renderPractice();
      return;
    }
    const filters = this.contentEl.createDiv({ cls: "mms-question-bank-filters" });
    const query = filters.createEl("input", { attr: { placeholder: "搜索题干、选项、标签" } });
    query.value = this.query;
    query.oninput = () => { this.query = query.value.trim().toLocaleLowerCase(); this.renderResults(); };
    const status = filters.createEl("select");
    for (const [value, label] of Object.entries(STATUS_LABELS)) status.createEl("option", { value, text: label });
    status.value = this.status;
    status.onchange = () => { this.status = status.value as MindMapQuestionStatus | "all"; this.renderResults(); };
    const tags = Array.from(new Set(flattenNodes(this.document.root).flatMap((node) => node.question?.tags ?? []))).sort((left, right) => left.localeCompare(right, "zh-CN"));
    const tag = filters.createEl("select");
    tag.createEl("option", { value: "", text: "全部标签" });
    tags.forEach((value) => tag.createEl("option", { value, text: value }));
    tag.value = this.tag;
    tag.onchange = () => { this.tag = tag.value; this.renderResults(); };
    this.contentEl.createDiv({ cls: "mms-question-bank-results" });
    this.renderResults();
  }

  /** Renders matching question cards without rebuilding active filter controls. */
  private renderResults(): void {
    const results = this.contentEl.querySelector<HTMLElement>(".mms-question-bank-results");
    if (!results) return;
    results.empty();
    const matches = flattenNodes(this.document.root).filter((node) => {
      const question = node.question;
      if (!question) return false;
      if (this.status !== "all" && question.status !== this.status) return false;
      if (this.tag && !question.tags.includes(this.tag)) return false;
      const searchable = [nodePlainText(node), ...question.options.flatMap((option) => option.content.filter((block) => block.type === "text").map((block) => block.text)), ...question.tags].join(" ").toLocaleLowerCase();
      return !this.query || searchable.includes(this.query);
    });
    const correctAttempts = matches.reduce((total, node) => total + node.question!.correctCount, 0);
    const attempts = matches.reduce((total, node) => total + node.question!.attemptCount, 0);
    results.createDiv({ cls: "mms-question-bank-count", text: `${matches.length} 道题目 · 已练 ${attempts} 次${attempts ? ` · 正确率 ${Math.round(correctAttempts / attempts * 100)}%` : ""}` });
    const overview = results.createDiv({ cls: "mms-question-bank-overview" });
    const tagCounts = new Map<string, number>();
    matches.forEach((node) => node.question!.tags.forEach((value) => tagCounts.set(value, (tagCounts.get(value) ?? 0) + 1)));
    Array.from(tagCounts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN")).forEach(([value, count]) => {
      const button = overview.createEl("button", { text: `#${value} ${count}`, attr: { type: "button" } });
      button.onclick = () => { this.tag = value; this.render(); };
    });
    if (matches.length) {
      const random = results.createEl("button", { cls: "mod-cta mms-question-practice-start", text: "随机练习", attr: { type: "button" } });
      random.onclick = () => this.startPractice(matches[Math.floor(Math.random() * matches.length)].id);
    }
    for (const node of matches) {
      const question = node.question!;
      const card = results.createDiv({ cls: "mms-question-bank-item" });
      card.createDiv({ cls: "mms-question-bank-title", text: nodePlainText(node) || "未命名题目" });
      card.createDiv({ cls: "mms-question-bank-meta", text: `${STATUS_LABELS[question.status]} · ${question.tags.map((tag) => `#${tag}`).join(" ") || "无标签"}` });
      const actions = card.createDiv({ cls: "mms-question-bank-actions" });
      const open = actions.createEl("button", { text: "定位", attr: { type: "button" } });
      open.onclick = () => { this.onOpenNode(node.id); this.close(); };
      const practice = actions.createEl("button", { text: "练习", attr: { type: "button" } });
      practice.onclick = () => this.startPractice(node.id);
      const wrong = actions.createEl("button", { text: "错题", attr: { type: "button" } });
      wrong.onclick = () => { this.onSetStatus(node.id, "wrong"); this.render(); };
      const mastered = actions.createEl("button", { text: "掌握", attr: { type: "button" } });
      mastered.onclick = () => { this.onSetStatus(node.id, "mastered"); this.render(); };
    }
  }

  /** Opens one question in self-assessment mode without exposing its answer prematurely. */
  private startPractice(nodeId: string): void {
    this.practiceNodeId = nodeId;
    this.selectedOptionId = null;
    this.answerVisible = false;
    this.render();
  }

  /** Renders a choice or long-form question and records only explicit self-assessment outcomes. */
  private renderPractice(): void {
    const node = this.practiceNodeId ? flattenNodes(this.document.root).find((item) => item.id === this.practiceNodeId) : undefined;
    const question = node?.question;
    if (!node || !question) {
      this.practiceNodeId = null;
      this.render();
      return;
    }
    const practice = this.contentEl.createDiv({ cls: "mms-question-practice" });
    const back = practice.createEl("button", { text: "返回题库", attr: { type: "button" } });
    back.onclick = () => { this.practiceNodeId = null; this.render(); };
    practice.createEl("h3", { text: nodePlainText(node) || "未命名题目" });
    this.renderBlocks(practice, question.stem);
    if (question.mode === "choice") {
      const options = practice.createDiv({ cls: "mms-question-practice-options" });
      question.options.forEach((option) => {
        const optionButton = options.createEl("button", { text: `${option.label}. ${this.blocksText(option.content) || "（空选项）"}`, attr: { type: "button" } });
        optionButton.toggleClass("is-selected", this.selectedOptionId === option.id);
        optionButton.onclick = () => { this.selectedOptionId = option.id; this.render(); };
      });
    }
    if (!this.answerVisible) {
      const reveal = practice.createEl("button", { cls: "mod-cta", text: "查看答案与解析", attr: { type: "button" } });
      reveal.onclick = () => { this.answerVisible = true; this.render(); };
      return;
    }
    practice.createEl("h4", { text: "答案" });
    this.renderBlocks(practice, question.answer);
    practice.createEl("h4", { text: "解析" });
    this.renderBlocks(practice, question.explanation);
    const assessment = practice.createDiv({ cls: "mms-question-practice-assessment" });
    const correct = assessment.createEl("button", { text: "答对", cls: "mod-cta", attr: { type: "button" } });
    correct.onclick = () => this.finishPractice(node.id, true);
    const wrong = assessment.createEl("button", { text: "答错", attr: { type: "button" } });
    wrong.onclick = () => this.finishPractice(node.id, false);
  }

  /** Converts a content-block sequence to the visible practice text. */
  private blocksText(blocks: MindMapQuestion["stem"]): string {
    return blocks.filter((block) => block.type === "text").map((block) => block.text).join("\n");
  }

  /** Adds an explicit review result, then returns to the filtered bank results. */
  private finishPractice(nodeId: string, correct: boolean): void {
    this.onRecordPractice(nodeId, correct);
    this.practiceNodeId = null;
    this.selectedOptionId = null;
    this.answerVisible = false;
    this.render();
  }

  /** Renders only visible text blocks; image references remain available in their source node. */
  private renderBlocks(container: HTMLElement, blocks: MindMapQuestion["stem"]): void {
    const text = this.blocksText(blocks);
    if (text) container.createDiv({ cls: "mms-question-practice-text", text });
  }
}
