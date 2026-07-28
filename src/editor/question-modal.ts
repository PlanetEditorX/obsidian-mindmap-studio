/**
 * @file question-modal.ts
 * @description Structured choice and essay question editor for mind-map nodes.
 */

import { App, Modal, Notice } from "obsidian";
import {
  createMindMapQuestion,
  newId,
  type MindMapContentBlock,
  type MindMapImageContentBlock,
  type MindMapQuestion,
  type MindMapQuestionMode,
  type MindMapQuestionOption
} from "../core/model";
import type { MindMapEditorCallbacks } from "./editor-types";

const QUESTION_TAGS = ["公务员", "事业单位", "申论", "职测", "言语", "判断", "数量", "资料分析"];

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
    const mode: MindMapQuestionMode = parsed.mode === "essay" ? "essay" : "choice";
    const rawOptions = Array.isArray(parsed.options) ? parsed.options : [];
    const options: MindMapQuestionOption[] = mode === "choice" ? rawOptions.slice(0, 12).flatMap((item, index) => {
      if (typeof item === "string") return [{ id: newId(), label: String.fromCharCode(65 + index), content: textBlocks(item) }];
      if (!item || typeof item !== "object") return [];
      const option = item as Record<string, unknown>;
      return [{ id: newId(), label: typeof option.label === "string" ? option.label : String.fromCharCode(65 + index), content: textBlocks(option.content ?? option.text) }];
    }) : [];
    const preservedImages = fallback.stem.filter((block): block is MindMapImageContentBlock => block.type === "image");
    return {
      mode,
      stem: [...textBlocks(parsed.stem ?? parsed.question), ...preservedImages],
      options,
      answer: textBlocks(parsed.answer),
      explanation: textBlocks(parsed.explanation ?? parsed.analysis),
      tags: Array.from(new Set([...(fallback.tags ?? []), ...(Array.isArray(parsed.tags) ? parsed.tags.filter((tag): tag is string => typeof tag === "string") : [])])).slice(0, 12)
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
    mode.createEl("option", { value: "essay", text: "大题" });
    mode.value = this.draft.mode;
    mode.onchange = () => {
      this.draft = { ...this.draft, mode: mode.value === "essay" ? "essay" : "choice", options: mode.value === "essay" ? [] : this.draft.options.length ? this.draft.options : createMindMapQuestion("choice").options };
      this.render();
    };
    this.renderBlocks("题干", this.draft.stem, (blocks) => { this.draft.stem = blocks; });
    if (this.draft.mode === "choice") {
      for (const option of this.draft.options) this.renderBlocks(`选项 ${option.label}`, option.content, (blocks) => { option.content = blocks; });
      const add = this.contentEl.createEl("button", { text: "添加选项", attr: { type: "button" } });
      add.onclick = () => { this.draft.options.push({ id: newId(), label: String.fromCharCode(65 + this.draft.options.length), content: [{ id: newId(), type: "text", text: "" }] }); this.render(); };
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
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    const enrich = actions.createEl("button", { text: "AI 智能处理题目", attr: { type: "button" } });
    enrich.onclick = () => void this.convertAndEnrichQuestion();
    const save = actions.createEl("button", { text: "保存", cls: "mod-cta", attr: { type: "button" } });
    save.onclick = () => { this.onSubmit(this.draft); this.close(); };
  }

  /** Renders a text and optional image-source editor for one question field. */
  private renderBlocks(label: string, blocks: MindMapContentBlock[], update: (blocks: MindMapContentBlock[]) => void): void {
    const section = this.contentEl.createDiv({ cls: "mms-question-field" });
    section.createEl("h3", { text: label });
    const text = blocks.filter((block): block is Extract<MindMapContentBlock, { type: "text" }> => block.type === "text").map((block) => block.text).join("\n");
    const textarea = section.createEl("textarea", { attr: { rows: "4", placeholder: `${label}文字` } });
    textarea.value = text;
    const image = blocks.find((block): block is MindMapImageContentBlock => block.type === "image");
    const imageSource = section.createEl("input", { attr: { placeholder: "图片路径、Obsidian 链接或 URL（可选）" } });
    imageSource.value = image?.source ?? "";
    const persist = (): void => {
      const next: MindMapContentBlock[] = [];
      if (textarea.value.trim()) next.push({ id: blocks.find((block) => block.type === "text")?.id ?? newId(), type: "text", text: textarea.value.trim() });
      if (imageSource.value.trim()) next.push({ id: image?.id ?? newId(), type: "image", source: imageSource.value.trim(), alt: label });
      update(next);
    };
    textarea.onchange = persist;
    imageSource.onchange = persist;
  }

  /** Sends the first question image to the configured vision service and applies a JSON result. */
  private async recognizeQuestion(showSuccess = true): Promise<boolean> {
    const image = [this.draft.stem, ...this.draft.options.map((option) => option.content), this.draft.answer, this.draft.explanation]
      .flat().find((block): block is MindMapImageContentBlock => block.type === "image");
    if (!image) { new Notice("请先在题干、选项、答案或解答中填写一张题图"); return false; }
    const source = await this.callbacks.onReadImageSource(image.source);
    if (!source) { new Notice("无法读取题图"); return false; }
    const instruction = "识别这道原题，只返回 JSON：{\"mode\":\"choice 或 essay\",\"stem\":\"题干\",\"options\":[{\"label\":\"A\",\"content\":\"选项\"}],\"answer\":\"答案\",\"explanation\":\"解答\",\"tags\":[\"标签\"]}。无法识别的字段留空。";
    try {
      const result = await this.callbacks.onRecognizeImage({ nodeId: this.nodeId, blockId: image.id, nodeLabel: "题目节点", source: image.source, alt: image.alt ?? "题图", index: 1, total: 1 }, source.blob, undefined, instruction);
      const parsed = parseRecognizedQuestion(result.text, this.draft);
      if (!parsed) { new Notice("AI 未返回可解析的题目结构，请检查题图或模型输出"); return false; }
      this.draft = parsed;
      this.render();
      if (showSuccess) new Notice("题目已由 AI 填充，请核对后保存");
      return true;
    } catch (error) {
      new Notice(`题图识别失败：${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /** Converts current text or image into a question, then looks up an original or generates missing analysis. */
  private async convertAndEnrichQuestion(): Promise<void> {
    const hasImage = [this.draft.stem, ...this.draft.options.map((option) => option.content), this.draft.answer, this.draft.explanation]
      .flat().some((block) => block.type === "image");
    if (hasImage && !await this.recognizeQuestion(false)) return;
    const questionText = [
      ...this.draft.stem,
      ...this.draft.options.flatMap((option) => option.content)
    ].filter((block): block is Extract<MindMapContentBlock, { type: "text" }> => block.type === "text")
      .map((block) => block.text.trim()).filter(Boolean).join("\n");
    if (!questionText) { new Notice("请先填写题目文字或题图"); return; }
    try {
      const result = parseQuestionEnrichment(await this.callbacks.onEnrichQuestion(questionText), this.draft);
      if (!result) { new Notice("AI 未返回可解析的检索结果"); return; }
      this.draft = result.question;
      this.render();
      new Notice(result.found ? "已找到原题并补齐答案与解析，请核对后保存" : "未找到可验证原题，已由 AI 分析补齐缺失答案与解答，请核对后保存");
    } catch (error) {
      new Notice(`原题检索失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
