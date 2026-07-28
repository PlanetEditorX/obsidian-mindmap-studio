/**
 * @file question-bank-modal.ts
 * @description Searchable current-map question bank with status and tag filters.
 */

import { App, Modal } from "obsidian";
import { flattenNodes, nodePlainText, type MindMapDocument, type MindMapQuestionStatus } from "../core/model";

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

  /** Creates the bank over one document and delegates navigation and learning-state updates. */
  constructor(
    app: App,
    private readonly document: MindMapDocument,
    private readonly onOpenNode: (nodeId: string) => void,
    private readonly onSetStatus: (nodeId: string, status: MindMapQuestionStatus) => void
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
    results.createDiv({ cls: "mms-question-bank-count", text: `${matches.length} 道题目` });
    for (const node of matches) {
      const question = node.question!;
      const card = results.createDiv({ cls: "mms-question-bank-item" });
      card.createDiv({ cls: "mms-question-bank-title", text: nodePlainText(node) || "未命名题目" });
      card.createDiv({ cls: "mms-question-bank-meta", text: `${STATUS_LABELS[question.status]} · ${question.tags.map((tag) => `#${tag}`).join(" ") || "无标签"}` });
      const actions = card.createDiv({ cls: "mms-question-bank-actions" });
      const open = actions.createEl("button", { text: "定位", attr: { type: "button" } });
      open.onclick = () => { this.onOpenNode(node.id); this.close(); };
      const wrong = actions.createEl("button", { text: "错题", attr: { type: "button" } });
      wrong.onclick = () => { this.onSetStatus(node.id, "wrong"); this.render(); };
      const mastered = actions.createEl("button", { text: "掌握", attr: { type: "button" } });
      mastered.onclick = () => { this.onSetStatus(node.id, "mastered"); this.render(); };
    }
  }
}
