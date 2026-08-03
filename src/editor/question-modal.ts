/**
 * @file question-modal.ts
 * @description Structured choice and essay question editor for mind-map nodes.
 */

import { App, Menu, Modal, Notice } from "obsidian";
import {
  createMindMapQuestion,
  newId,
  type MindMapContentBlock,
  type MindMapImageContentBlock,
  type MindMapQuestion,
  type MindMapQuestionMode,
  type MindMapQuestionOption,
  type MindMapQuestionStatus
} from "../core/model";
import type { AiStreamUpdate } from "../ai/client";
import type { MindMapEditorCallbacks } from "./editor-types";
import { FormulaEditModal } from "./editor-modals";
import { renderRichTextRuns } from "./rich-text-dom";

const QUESTION_TAGS = [
  "公务员", "事业单位", "选调生", "三支一扶", "申论", "职测", "行测", "公共基础知识",
  "常识判断", "时政", "政治", "经济", "法律", "人文历史", "地理科技",
  "言语理解", "判断推理", "数量关系", "资料分析", "面试"
];
const QUESTION_STATUS_LABELS: Record<MindMapQuestionStatus, string> = { unanswered: "未做", completed: "已做", favorite: "收藏", wrong: "错题", mastered: "掌握" };

/** Visual states used by the question AI processing panel. */
type QuestionAiProcessStatus = "idle" | "active" | "done" | "error";

/** Runtime state retained while the question modal re-renders its form. */
interface QuestionAiProcessState {
  status: QuestionAiProcessStatus;
  steps: Array<"pending" | "active" | "done" | "error">;
  message: string;
  thinking: string;
  content: string;
}

/** Connected DOM references for updating the visible AI processing trace. */
interface QuestionAiProcessView {
  root: HTMLElement;
  steps: HTMLElement[];
  message: HTMLElement;
  thinking: HTMLDetailsElement;
  thinkingText: HTMLElement;
  content: HTMLDetailsElement;
  contentText: HTMLElement;
}

/** Parses a JSON-only vision result into the question fields supported by the editor. */
export function parseRecognizedQuestion(value: string, fallback: MindMapQuestion): MindMapQuestion | null {
  const source = value.trim().replace(/^```json\s*|```$/gim, "");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(source.slice(start, end + 1)) as Record<string, unknown>;
    const textBlocks = (input: unknown): MindMapContentBlock[] => {
      const text = Array.isArray(input) ? input.join("\n") : typeof input === "string" ? input : "";
      return text.trim() ? [{ id: newId(), type: "text", text: text.trim() }] : [];
    };
    const mode: MindMapQuestionMode = parsed.mode === "essay" ? "essay" : parsed.mode === "judgment" ? "judgment" : "choice";
    const rawOptions = Array.isArray(parsed.options) ? parsed.options : [];
    const options: MindMapQuestionOption[] = mode === "choice" ? rawOptions.slice(0, 12).flatMap((item, index) => {
      if (typeof item === "string") return [{ id: newId(), label: String.fromCharCode(65 + index), content: textBlocks(item) }];
      if (!item || typeof item !== "object") return [];
      const option = item as Record<string, unknown>;
      return [{ id: newId(), label: typeof option.label === "string" ? option.label : String.fromCharCode(65 + index), content: textBlocks(option.content ?? option.text) }];
    }) : mode === "judgment" ? createMindMapQuestion("judgment").options : [];
    const preservedImages = fallback.stem.filter((block): block is MindMapImageContentBlock => block.type === "image");
    return {
      mode,
      stem: [...textBlocks(parsed.stem ?? parsed.question), ...preservedImages],
      options,
      answer: textBlocks(parsed.answer),
      explanation: textBlocks(parsed.explanation ?? parsed.analysis),
      tags: Array.from(new Set([...(fallback.tags ?? []), ...(Array.isArray(parsed.tags) ? parsed.tags.filter((tag): tag is string => typeof tag === "string") : [])])).slice(0, 12),
      source: fallback.source,
      status: fallback.status,
      attemptCount: fallback.attemptCount,
      correctCount: fallback.correctCount,
      lastPracticedAt: fallback.lastPracticedAt
    };
  } catch {
    return null;
  }
}

/** Applies an AI lookup result only when it explicitly includes a verifiable original-question source. */
export function parseQuestionEnrichment(value: string, fallback: MindMapQuestion): { found: boolean; question: MindMapQuestion } | null {
  const source = value.trim().replace(/^```json\s*|```$/gim, "");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(source.slice(start, end + 1)) as Record<string, unknown>;
    const found = parsed.found === true;
    const question = parseRecognizedQuestion(source, fallback) ?? fallback;
    const sourceUrl = typeof parsed.sourceUrl === "string" ? parsed.sourceUrl.trim() : "";
    const sourceTitle = typeof parsed.sourceTitle === "string" ? parsed.sourceTitle.trim() : "";
    if (!found) return { found: false, question: { ...question, source: undefined } };
    if (!/^https?:\/\//i.test(sourceUrl) || !sourceTitle) return { found: false, question: { ...question, source: undefined } };
    return {
      found: true,
      question: {
        ...question,
        source: { title: sourceTitle.slice(0, 300), url: sourceUrl.slice(0, 2000), matchedAt: new Date().toISOString() }
      }
    };
  } catch {
    return null;
  }
}

/** Modal editor for the structured question attached to a node. */
export class QuestionEditModal extends Modal {
  private draft: MindMapQuestion;
  private aiProcess: QuestionAiProcessState = {
    status: "idle",
    steps: ["pending", "pending", "pending", "pending", "pending"],
    message: "",
    thinking: "",
    content: ""
  };
  private aiProcessView: QuestionAiProcessView | null = null;

  /** Creates a modal around the selected node's existing question payload. */
  constructor(
    app: App,
    question: MindMapQuestion | undefined,
    private readonly nodeId: string,
    private readonly callbacks: Pick<MindMapEditorCallbacks, "onEnrichQuestion" | "onReadImageSource" | "onRecognizeImage">,
    private readonly onSubmit: (question: MindMapQuestion) => void
  ) {
    super(app);
    this.draft = JSON.parse(JSON.stringify(question ?? createMindMapQuestion())) as MindMapQuestion;
  }

  /** Initializes the modal surface and renders the current draft. */
  onOpen(): void {
    this.modalEl.addClass("mms-question-modal");
    this.render();
  }

  /** Rebuilds the compact question form after a mode, tag, or field change. */
  private render(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "题目节点" });
    const mode = this.contentEl.createEl("select");
    mode.createEl("option", { value: "choice", text: "选择题" });
    mode.createEl("option", { value: "judgment", text: "判断题" });
    mode.createEl("option", { value: "essay", text: "大题" });
    mode.value = this.draft.mode;
    mode.onchange = () => {
      const nextMode: MindMapQuestionMode = mode.value === "essay" ? "essay" : mode.value === "judgment" ? "judgment" : "choice";
      this.draft = {
        ...this.draft,
        mode: nextMode,
        options: nextMode === "essay"
          ? []
          : nextMode === "judgment"
            ? createMindMapQuestion("judgment").options
            : this.draft.mode === "choice" && this.draft.options.length ? this.draft.options : createMindMapQuestion("choice").options
      };
      this.render();
    };
    const status = this.contentEl.createEl("select", { cls: "mms-question-status" });
    for (const [value, label] of Object.entries(QUESTION_STATUS_LABELS)) status.createEl("option", { value, text: label });
    status.value = this.draft.status;
    status.onchange = () => { this.draft.status = status.value as MindMapQuestionStatus; };
    this.renderBlocks("题干", this.draft.stem, (blocks) => { this.draft.stem = blocks; });
    if (this.draft.mode !== "essay") {
      for (const option of this.draft.options) this.renderBlocks(`选项 ${option.label}`, option.content, (blocks) => { option.content = blocks; });
      if (this.draft.mode === "choice") {
        const add = this.contentEl.createEl("button", { text: "添加选项", attr: { type: "button" } });
        add.onclick = () => { this.draft.options.push({ id: newId(), label: String.fromCharCode(65 + this.draft.options.length), content: [{ id: newId(), type: "text", text: "" }] }); this.render(); };
      }
    }
    this.renderBlocks("答案", this.draft.answer, (blocks) => { this.draft.answer = blocks; });
    this.renderBlocks("解答", this.draft.explanation, (blocks) => { this.draft.explanation = blocks; });
    const tagRow = this.contentEl.createDiv({ cls: "mms-question-tags" });
    tagRow.createSpan({ text: "标签" });
    for (const tag of QUESTION_TAGS) {
      const button = tagRow.createEl("button", { text: tag, attr: { type: "button" } });
      button.toggleClass("is-active", this.draft.tags.includes(tag));
      button.onclick = () => { this.draft.tags = this.draft.tags.includes(tag) ? this.draft.tags.filter((item) => item !== tag) : [...this.draft.tags, tag]; this.render(); };
    }
    const customTags = this.contentEl.createEl("input", { attr: { placeholder: "补充标签，使用逗号分隔" } });
    customTags.value = this.draft.tags.filter((tag) => !QUESTION_TAGS.includes(tag)).join(", ");
    customTags.onchange = () => { this.draft.tags = Array.from(new Set([...this.draft.tags.filter((tag) => QUESTION_TAGS.includes(tag)), ...customTags.value.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean)])).slice(0, 12); };
    if (this.draft.source) {
      const source = this.contentEl.createEl("a", { text: `原题来源：${this.draft.source.title}`, href: this.draft.source.url });
      source.setAttr("target", "_blank");
      source.setAttr("rel", "noopener noreferrer");
    }
    this.renderAiProcess();
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    const enrich = actions.createEl("button", {
      text: this.aiProcess.status === "active" ? "AI 正在处理…" : "AI 智能处理题目",
      attr: { type: "button" }
    });
    enrich.disabled = this.aiProcess.status === "active";
    enrich.onclick = () => void this.convertAndEnrichQuestion();
    const save = actions.createEl("button", { text: "保存", cls: "mod-cta", attr: { type: "button" } });
    save.disabled = this.aiProcess.status === "active";
    save.onclick = () => { this.onSubmit(this.draft); this.close(); };
  }

  /** Renders the retained AI processing trace below the question fields. */
  private renderAiProcess(): void {
    const root = this.contentEl.createDiv({ cls: "mms-question-ai-process" });
    const title = root.createDiv({ cls: "mms-question-ai-process-title" });
    title.createEl("strong", { text: "AI 解析过程" });
    title.createSpan({ text: "显示处理阶段，以及接口实际返回的思考和结构化内容。" });
    const track = root.createDiv({ cls: "mms-question-ai-track" });
    const labels = ["读取题目", "识别题图与题型", "检索并分析", "接收答案与解析", "回填题目"];
    const steps = labels.map((label, index) => {
      const step = track.createDiv({ cls: "mms-question-ai-step" });
      step.createSpan({ cls: "mms-question-ai-step-dot", text: String(index + 1) });
      step.createSpan({ text: label });
      return step;
    });
    const message = root.createDiv({ cls: "mms-question-ai-message" });
    const thinking = root.createEl("details", { cls: "mms-question-ai-output" });
    thinking.createEl("summary", { text: "模型分析（由当前 AI 接口返回）" });
    const thinkingText = thinking.createEl("pre");
    const content = root.createEl("details", { cls: "mms-question-ai-output" });
    content.createEl("summary", { text: "正在生成的题目结构" });
    const contentText = content.createEl("pre");
    this.aiProcessView = { root, steps, message, thinking, thinkingText, content, contentText };
    this.syncAiProcessView();
  }

  /** Synchronizes the visible processing panel with retained request state. */
  private syncAiProcessView(): void {
    const view = this.aiProcessView;
    if (!view?.root.isConnected) return;
    view.root.toggleClass("is-hidden", this.aiProcess.status === "idle");
    view.root.dataset.state = this.aiProcess.status;
    view.steps.forEach((step, index) => { step.dataset.state = this.aiProcess.steps[index] ?? "pending"; });
    view.message.setText(this.aiProcess.message);
    view.thinking.hidden = !this.aiProcess.thinking.trim();
    view.thinking.open = this.aiProcess.status === "active" && Boolean(this.aiProcess.thinking.trim());
    view.thinkingText.setText(this.aiProcess.thinking);
    view.content.hidden = !this.aiProcess.content.trim();
    view.content.open = this.aiProcess.status === "active" && Boolean(this.aiProcess.content.trim());
    view.contentText.setText(this.aiProcess.content);
  }

  /** Starts a new five-stage AI question processing trace. */
  private startAiProcess(message: string): void {
    this.aiProcess = {
      status: "active",
      steps: ["active", "pending", "pending", "pending", "pending"],
      message,
      thinking: "",
      content: ""
    };
    this.syncAiProcessView();
  }

  /** Moves the trace to one stage while preserving completed stages. */
  private setAiProcessStep(index: number, message: string): void {
    this.aiProcess.steps = this.aiProcess.steps.map((state, stepIndex) => {
      if (stepIndex < index) return "done";
      if (stepIndex === index) return "active";
      return state === "done" ? state : "pending";
    });
    this.aiProcess.message = message;
    this.syncAiProcessView();
  }

  /** Appends model-provided reasoning and generated JSON deltas to the visible trace. */
  private appendAiProcessStream(update: AiStreamUpdate): void {
    if (update.thinking) this.aiProcess.thinking += update.thinking;
    if (update.content) this.aiProcess.content += update.content;
    if (update.thinking) this.aiProcess.message = "模型正在分析题目条件与解题路径…";
    else if (update.content) this.aiProcess.message = "模型正在生成答案、解析和题目结构…";
    this.syncAiProcessView();
  }

  /** Completes or fails the current AI processing trace. */
  private finishAiProcess(status: "done" | "error", message: string): void {
    const activeIndex = this.aiProcess.steps.findIndex((state) => state === "active");
    if (status === "done") this.aiProcess.steps = this.aiProcess.steps.map(() => "done");
    else if (activeIndex >= 0) this.aiProcess.steps[activeIndex] = "error";
    this.aiProcess.status = status;
    this.aiProcess.message = message;
    this.syncAiProcessView();
  }

  /** Renders one question field with inline LaTeX insertion and a live MathJax preview. */
  private renderBlocks(label: string, blocks: MindMapContentBlock[], update: (blocks: MindMapContentBlock[]) => void): void {
    const section = this.contentEl.createDiv({ cls: "mms-question-field" });
    const heading = section.createDiv({ cls: "mms-question-field-heading" });
    heading.createEl("h3", { text: label });
    heading.createSpan({ cls: "setting-item-description", text: "右键文字框可插入 LaTeX" });
    const textBlocks = blocks.filter((block): block is Extract<MindMapContentBlock, { type: "text" }> => block.type === "text");
    const textarea = section.createEl("textarea", { attr: { rows: "4", placeholder: `${label}文字，可在文字中使用 $...$ 行内公式` } });
    textarea.value = textBlocks.map((block) => block.text).join("\n");
    const image = blocks.find((block): block is MindMapImageContentBlock => block.type === "image");
    const imageSource = section.createEl("input", { attr: { placeholder: "图片路径、Obsidian 链接或 URL（可选）" } });
    imageSource.value = image?.source ?? "";
    const preview = section.createDiv({ cls: "mms-question-field-preview" });
    const renderPreview = (): void => {
      preview.empty();
      const value = textarea.value.replace(/\r\n?/g, "\n").trim();
      if (!value) {
        preview.createSpan({ cls: "setting-item-description", text: `${label}预览` });
        return;
      }
      renderRichTextRuns(preview, undefined, value);
    };
    const persist = (): void => {
      const next: MindMapContentBlock[] = [];
      const value = textarea.value.replace(/\r\n?/g, "\n").trim();
      if (value) next.push({ id: textBlocks[0]?.id ?? newId(), type: "text", text: value });
      if (imageSource.value.trim()) next.push({ id: image?.id ?? newId(), type: "image", source: imageSource.value.trim(), alt: label });
      update(next);
      renderPreview();
    };
    const insertFormula = (source: string, display: boolean): void => {
      const token = display ? `$$${source}$$` : `$${source}$`;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? start;
      textarea.setRangeText(token, start, end, "end");
      persist();
      textarea.focus();
    };
    textarea.addEventListener("input", persist);
    textarea.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const menu = new Menu();
      menu.addItem((item) => item
        .setTitle("插入 LaTeX 公式")
        .setIcon("sigma")
        .onClick(() => new FormulaEditModal(this.app, (value) => insertFormula(value.source, value.display)).open()));
      menu.showAtMouseEvent(event);
    });
    imageSource.addEventListener("input", persist);
    renderPreview();
  }

  /** Sends the first question image to the configured vision service and applies a JSON result. */
  private async recognizeQuestion(showSuccess = true, rerender = true): Promise<boolean> {
    const image = [this.draft.stem, ...this.draft.options.map((option) => option.content), this.draft.answer, this.draft.explanation]
      .flat().find((block): block is MindMapImageContentBlock => block.type === "image");
    if (!image) { new Notice("请先在题干、选项、答案或解答中填写一张题图"); return false; }
    const source = await this.callbacks.onReadImageSource(image.source);
    if (!source) { new Notice("无法读取题图"); return false; }
    const instruction = "识别这道原题，只返回 JSON：{\"mode\":\"choice、judgment 或 essay\",\"stem\":\"题干\",\"options\":[{\"label\":\"A\",\"content\":\"选项\"}],\"answer\":\"答案\",\"explanation\":\"解答\",\"tags\":[\"标签\"]}。判断题 mode 为 judgment，答案使用 正确 或 错误。无法识别的字段留空。";
    try {
      const result = await this.callbacks.onRecognizeImage({ nodeId: this.nodeId, blockId: image.id, nodeLabel: "题目节点", source: image.source, alt: image.alt ?? "题图", index: 1, total: 1 }, source.blob, undefined, instruction);
      const parsed = parseRecognizedQuestion(result.text, this.draft);
      if (!parsed) { new Notice("AI 未返回可解析的题目结构，请检查题图或模型输出"); return false; }
      this.draft = parsed;
      if (rerender) this.render();
      if (showSuccess) new Notice("题目已由 AI 填充，请核对后保存");
      return true;
    } catch (error) {
      new Notice(`题图识别失败：${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /** Converts current text or image into a question, then streams lookup and solution analysis into the visible trace. */
  private async convertAndEnrichQuestion(): Promise<void> {
    if (this.aiProcess.status === "active") return;
    this.startAiProcess("正在读取题干、选项和已有答案…");
    const hasImage = [this.draft.stem, ...this.draft.options.map((option) => option.content), this.draft.answer, this.draft.explanation]
      .flat().some((block) => block.type === "image");
    try {
      this.setAiProcessStep(1, hasImage ? "正在识别题图并整理题型…" : "未发现题图，正在识别文字题型…");
      if (hasImage && !await this.recognizeQuestion(false, false)) {
        this.finishAiProcess("error", "题图识别失败，未继续执行 AI 解析。请检查题图或视觉模型。");
        this.render();
        return;
      }
      const questionText = [
        ...this.draft.stem,
        ...this.draft.options.flatMap((option) => option.content)
      ].filter((block): block is Extract<MindMapContentBlock, { type: "text" }> => block.type === "text")
        .map((block) => block.text.trim()).filter(Boolean).join("\n");
      if (!questionText) {
        this.finishAiProcess("error", "没有可发送给 AI 的题目文字。");
        this.render();
        new Notice("请先填写题目文字或题图");
        return;
      }
      this.setAiProcessStep(2, "正在检索可验证原题；未找到时将独立分析并生成完整解题过程…");
      const response = await this.callbacks.onEnrichQuestion(questionText, (update) => this.appendAiProcessStream(update));
      if (!this.aiProcess.content.trim()) this.aiProcess.content = response;
      this.setAiProcessStep(3, "已收到模型结果，正在校验答案、解析和来源字段…");
      const result = parseQuestionEnrichment(response, this.draft);
      if (!result) throw new Error("AI 未返回可解析的检索结果");
      this.setAiProcessStep(4, "正在把答案与 AI 解析过程回填到题目节点…");
      this.draft = result.question;
      this.finishAiProcess("done", result.found
        ? "处理完成：已找到可验证原题，并回填答案与完整解析。"
        : "处理完成：未找到可靠原题，已由 AI 独立分析并回填答案与完整解析。");
      this.render();
      new Notice(result.found ? "已找到原题并补齐答案与解析，请核对后保存" : "未找到可验证原题，已由 AI 分析补齐答案与解答，请核对后保存");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.finishAiProcess("error", `AI 智能处理失败：${message}`);
      this.render();
      new Notice(`原题检索失败：${message}`);
    }
  }
}
