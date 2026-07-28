/**
 * @file modal.ts
 * @description AI 问答、结构化导图编辑、批量图片识别、本地替换和请求处理轨迹窗口。
 */

import { Component, MarkdownRenderer, Modal, Notice, setIcon, type App } from "obsidian";
import type {
  ImageRecognitionBatchResult,
  ImageRecognitionItemResult,
  ImageRecognitionMode,
  ImageTextReplacementPreview
} from "../vision/recognition";
import type { AiProfileConfig } from "./config";
import { formatByteSize, type AiMarkdownPayload } from "./markdown";
import type { AiCompletionResult } from "./client";
import {
  createAiPromptDraftState,
  switchAiPromptDraft,
  type AiEditPreview,
  type AiInteractionMode,
  type LocalReplacePreview
} from "./edit";

/** 创建 AI 窗口所需的上下文、接口和安全应用回调。 */
export interface AiAskModalOptions {
  payload: AiMarkdownPayload;
  profiles: AiProfileConfig[];
  defaultProfileId: string;
  defaultImageRecognitionProfileId: string;
  defaultQuestion: string;
  defaultImageRecognitionPrompt: string;
  imageRecognitionMode: ImageRecognitionMode;
  imageRecognitionAutoConfirmDelaySeconds: 0 | 5 | 10 | 15 | null;
  imageCount: number;
  sourcePath: string;
  onAsk: (profileId: string, question: string) => Promise<AiCompletionResult>;
  onProposeEdit: (profileId: string, instruction: string) => Promise<AiCompletionResult>;
  onRecognizeImages: (profileId: string, instruction: string) => Promise<ImageRecognitionBatchResult>;
  onPreviewImageTextReplacements: (items: ImageRecognitionItemResult[]) => ImageTextReplacementPreview[];
  onApplyImageTextReplacements: (previews: ImageTextReplacementPreview[]) => boolean | Promise<boolean>;
  onPreviewAiEdit: (responseText: string) => AiEditPreview;
  onApplyAiEdit: (preview: AiEditPreview) => boolean | Promise<boolean>;
  onPreviewLocalReplace: (query: string, replacement: string, caseSensitive: boolean) => LocalReplacePreview;
  onApplyLocalReplace: (preview: LocalReplacePreview) => boolean | Promise<boolean>;
}

/** 单个处理轨迹步骤的视觉状态。 */
type TraceState = "pending" | "active" | "done" | "error";

/** 显示 AI 问答、修改提案、批量识图确认和不联网文字替换。 */
export class AiAskModal extends Modal {
  /** 承载 MarkdownRenderer 注册的子组件，并在窗口关闭时统一释放。 */
  private markdownRenderComponent: Component | null = null;
  /** 标识当前打开会话，防止关闭后的异步响应继续写入旧 DOM。 */
  private modalSession = 0;
  private imageAutoConfirmTimer: number | null = null;

  /** 保存窗口上下文并初始化 Obsidian Modal。 */
  constructor(app: App, private readonly options: AiAskModalOptions) {
    super(app);
  }

  /** 构建模式选择、大小提示、处理轨迹、修改预览和确认应用区域。 */
  onOpen(): void {
    const session = ++this.modalSession;
    this.markdownRenderComponent?.unload();
    this.markdownRenderComponent = new Component();
    this.markdownRenderComponent.load();
    this.titleEl.setText("AI 助手");
    this.modalEl.addClass("mms-ai-modal");
    const { payload, profiles } = this.options;

    const summary = this.contentEl.createDiv({ cls: "mms-ai-context-summary" });
    summary.createDiv({ cls: "mms-ai-scope", text: payload.scopeLabel });
    const metrics = summary.createDiv({ cls: "mms-ai-context-metrics" });
    metrics.createSpan({ text: `${payload.nodeCount} 个节点` });
    metrics.createSpan({ text: `${payload.characterCount.toLocaleString()} 字符` });
    metrics.createSpan({ text: `${this.options.imageCount} 张图片` });
    const size = metrics.createSpan({ text: `${formatByteSize(payload.byteSize)} / ${formatByteSize(payload.maxInputBytes)}` });
    size.toggleClass("is-over-limit", payload.overLimit);
    summary.createEl("p", {
      cls: "setting-item-description",
      text: payload.scope === "subtree"
        ? "当前范围为右键节点及其全部子节点。"
        : "当前范围为当前物理 .mindmap 页面。"
    });

    if (payload.overLimit) {
      this.contentEl.createDiv({
        cls: "mms-ai-limit-warning",
        text: "当前 Markdown 超过 AI 输入大小限制。AI 问答和 AI 编辑将被阻止；图片识图与本地替换仍可使用。"
      });
    }

    const form = this.contentEl.createEl("form", { cls: "mms-ai-form" });
    const modeLabel = form.createEl("label", { cls: "mms-ai-field" });
    modeLabel.createSpan({ text: "操作" });
    const mode = modeLabel.createEl("select");
    mode.createEl("option", { value: "ask", text: "询问 AI（不修改导图）" });
    mode.createEl("option", { value: "edit", text: "AI 整理并重新生成（确认后应用）" });
    mode.createEl("option", {
      value: "vision",
      text: this.options.imageRecognitionMode === "ai"
        ? "图片 AI 识图（按顺序处理当前范围）"
        : "图片本地 OCR（按顺序处理当前范围）"
    });
    mode.createEl("option", { value: "replace", text: "本地文字替换（不调用 AI）" });

    const providerLabel = form.createEl("label", { cls: "mms-ai-field" });
    providerLabel.createSpan({ text: "接口" });
    const provider = providerLabel.createEl("select");
    for (const profile of profiles) provider.createEl("option", { value: profile.id, text: `${profile.name} · ${profile.model}` });
    const defaultProfileValue = (profileId: string): string => profiles.some((profile) => profile.id === profileId)
      ? profileId
      : profiles[0]?.id ?? "";
    provider.value = defaultProfileValue(this.options.defaultProfileId);

    const questionLabel = form.createEl("label", { cls: "mms-ai-field" });
    const questionTitle = questionLabel.createSpan({ text: "问题" });
    const question = questionLabel.createEl("textarea", {
      attr: { rows: "6", placeholder: "例如：总结关键观点，或回答与当前导图有关的问题。" }
    });
    question.value = this.options.defaultQuestion;
    let promptDraftState = createAiPromptDraftState(
      this.options.defaultQuestion,
      this.options.defaultImageRecognitionPrompt
    );

    const replacePanel = form.createDiv({ cls: "mms-ai-replace-panel" });
    replacePanel.hidden = true;
    const findLabel = replacePanel.createEl("label", { cls: "mms-ai-field" });
    findLabel.createSpan({ text: "查找文字" });
    const findInput = findLabel.createEl("input", { attr: { type: "text", placeholder: "例如：旧名称" } });
    const replacementLabel = replacePanel.createEl("label", { cls: "mms-ai-field" });
    replacementLabel.createSpan({ text: "替换为" });
    const replacementInput = replacementLabel.createEl("input", { attr: { type: "text", placeholder: "例如：新名称；可以留空表示删除" } });

    const track = form.createDiv({ cls: "mms-ai-track" });
    const steps = ["转换 Markdown", "上传上下文", "模型处理", "接收结果"].map((label, index) => {
      const step = track.createDiv({ cls: "mms-ai-track-step" });
      step.dataset.state = "pending";
      step.createSpan({ cls: "mms-ai-track-dot", text: String(index + 1) });
      step.createSpan({ cls: "mms-ai-track-label", text: label });
      return step;
    });
    steps[0]!.dataset.state = "done";

    const status = form.createDiv({ cls: "mms-ai-status", text: "Markdown 已生成，等待操作。" });
    const result = form.createDiv({ cls: "mms-ai-result markdown-rendered is-hidden" });
    const resultMeta = form.createDiv({ cls: "mms-ai-result-meta is-hidden" });
    const preview = form.createDiv({ cls: "mms-ai-edit-preview is-hidden" });
    const actions = form.createDiv({ cls: "mms-ai-actions" });
    const copy = actions.createEl("button", { attr: { type: "button" }, text: "复制回答" });
    copy.addClass("is-hidden");
    const apply = actions.createEl("button", { cls: "mod-warning is-hidden", attr: { type: "button" }, text: "确认应用变更" });
    const close = actions.createEl("button", { attr: { type: "button" }, text: "关闭" });
    const submit = actions.createEl("button", { cls: "mod-cta", attr: { type: "submit" } });
    setIcon(submit, "sparkles");
    const submitText = submit.createSpan({ text: "发送" });

    let answerText = "";
    let pendingAiPreview: AiEditPreview | null = null;
    let pendingReplacePreview: LocalReplacePreview | null = null;
    let pendingImagePreviews: ImageTextReplacementPreview[] = [];
    let imagePreviewInputs: HTMLTextAreaElement[] = [];
    const currentMode = (): AiInteractionMode => mode.value as AiInteractionMode;
    const recognitionUsesAi = (): boolean => currentMode() === "vision" && this.options.imageRecognitionMode === "ai";
    const requiresAiProfile = (): boolean => currentMode() === "ask" || currentMode() === "edit" || recognitionUsesAi();
    const isActionDisabled = (): boolean => {
      if (currentMode() === "replace") return false;
      if (currentMode() === "vision") return this.options.imageCount === 0 || (recognitionUsesAi() && !profiles.length);
      return payload.overLimit || !profiles.length;
    };
    const setStep = (index: number, state: TraceState): void => { if (steps[index]) steps[index]!.dataset.state = state; };
    const resetOutput = (): void => {
      if (this.imageAutoConfirmTimer !== null) window.clearTimeout(this.imageAutoConfirmTimer);
      this.imageAutoConfirmTimer = null;
      answerText = "";
      pendingAiPreview = null;
      pendingReplacePreview = null;
      pendingImagePreviews = [];
      imagePreviewInputs = [];
      result.empty();
      preview.empty();
      result.addClass("is-hidden");
      resultMeta.addClass("is-hidden");
      preview.addClass("is-hidden");
      copy.addClass("is-hidden");
      apply.addClass("is-hidden");
      apply.setText("确认应用变更");
      steps.forEach((step, index) => { step.dataset.state = index === 0 ? "done" : "pending"; });
    };
    const setBusy = (busy: boolean): void => {
      submit.disabled = busy || isActionDisabled();
      provider.disabled = busy;
      mode.disabled = busy;
      question.disabled = busy;
      findInput.disabled = busy;
      replacementInput.disabled = busy;
      imagePreviewInputs.forEach((input) => { input.disabled = busy; });
      apply.disabled = busy;
      form.toggleClass("is-busy", busy);
    };
    const updateMode = (): void => {
      resetOutput();
      const selected = currentMode();
      const promptDraft = switchAiPromptDraft(promptDraftState, question.value, selected);
      promptDraftState = promptDraft.state;
      question.value = promptDraft.value;
      const localReplace = selected === "replace";
      const localRecognition = selected === "vision" && this.options.imageRecognitionMode === "local-ocr";
      if (selected === "vision" && this.options.imageRecognitionMode === "ai") {
        provider.value = defaultProfileValue(this.options.defaultImageRecognitionProfileId);
      } else if (selected === "ask" || selected === "edit") {
        provider.value = defaultProfileValue(this.options.defaultProfileId);
      }
      providerLabel.hidden = localReplace || localRecognition;
      questionLabel.hidden = localReplace;
      replacePanel.hidden = !localReplace;
      track.hidden = localReplace;
      copy.setText(selected === "vision" ? "复制识图结果" : "复制回答");
      if (selected === "ask") {
        questionTitle.setText("问题");
        question.placeholder = "例如：总结关键观点，或回答与当前导图有关的问题。";
        submitText.setText("发送");
        status.setText("Markdown 已生成，等待发送。");
      } else if (selected === "edit") {
        questionTitle.setText("修改要求");
        question.placeholder = "例如：按主题重新整理层级，合并重复节点，并重新生成清晰的节点结构。";
        submitText.setText("生成修改预览");
        status.setText("AI 只生成 Markdown 提案；确认前不会修改导图。");
      } else if (selected === "vision") {
        questionTitle.setText("识图要求");
        question.placeholder = "例如：转录全部文字并保留段落；无文字时描述图片内容。";
        submitText.setText(`依次识别 ${this.options.imageCount} 张图片`);
        status.setText(this.options.imageCount
          ? `${localRecognition ? "本地 OCR" : "AI 识图"}将按节点树顺序逐张处理当前范围图片。`
          : "当前范围没有可识别的图片。");
      } else {
        submitText.setText("预览替换");
        status.setText("本地替换不会联网，确认前不会修改导图。");
      }
      submit.disabled = isActionDisabled();
      if (requiresAiProfile() && !profiles.length) {
        status.setText("没有已启用且配置完整的 AI 接口；仍可切换到本地 OCR 或本地文字替换。");
      }
      window.setTimeout(() => (localReplace ? findInput : question).focus(), 20);
    };

    const showEditPreview = (editPreview: AiEditPreview): void => {
      preview.empty();
      preview.createEl("h3", { text: "AI 修改预览" });
      preview.createEl("p", {
        text: `${editPreview.scopeLabel}：${editPreview.originalNodeCount} 个节点 → ${editPreview.replacementNodeCount} 个节点；生成 Markdown ${formatByteSize(editPreview.replacementByteSize)}。`
      });
      preview.createEl("p", {
        cls: "mms-ai-apply-warning",
        text: "应用后会替换所选范围的节点结构。操作会进入撤销历史，可以使用撤销恢复。"
      });
      const details = preview.createEl("details");
      details.createEl("summary", { text: "查看生成的 Markdown" });
      details.createEl("pre", { text: editPreview.markdown.slice(0, 60000) });
      if (editPreview.markdown.length > 60000) details.createEl("p", { text: "预览仅显示前 60,000 个字符。" });
      preview.removeClass("is-hidden");
      apply.removeClass("is-hidden");
      status.setText("修改提案已生成。请检查后点击“确认应用变更”。");
    };

    const showReplacePreview = (replacePreview: LocalReplacePreview): void => {
      preview.empty();
      preview.createEl("h3", { text: "本地替换预览" });
      preview.createEl("p", {
        text: `${replacePreview.scopeLabel}：找到 ${replacePreview.matchCount} 处，影响 ${replacePreview.affectedNodeCount} 个节点。`
      });
      preview.createEl("p", {
        cls: "mms-ai-apply-warning",
        text: `“${replacePreview.query}” → “${replacePreview.replacement}”。应用后可使用撤销恢复。`
      });
      preview.removeClass("is-hidden");
      apply.toggleClass("is-hidden", replacePreview.matchCount === 0);
      status.setText(replacePreview.matchCount ? "替换预览已生成，等待确认。" : "没有找到匹配文字，未修改导图。");
    };

    const showImageRecognitionPreview = (batch: ImageRecognitionBatchResult): void => {
      pendingImagePreviews = this.options.onPreviewImageTextReplacements(batch.items);
      preview.empty();
      preview.createEl("h3", { text: "图片识图原位替换预览" });
      preview.createEl("p", {
        text: "每项文字会替换其原图片所在的位置。可先逐项修改识别文字，确认后一次写入撤销历史。"
      });
      imagePreviewInputs = pendingImagePreviews.map((item, index) => {
        const card = preview.createDiv({ cls: "mms-ai-image-recognition-item" });
        card.createEl("h4", { text: `${batch.items[index]!.index}. ${batch.items[index]!.nodeLabel}` });
        const input = card.createEl("textarea", { attr: { rows: "5", "aria-label": `第 ${batch.items[index]!.index} 张图片识别文字` } });
        input.value = item.text;
        return input;
      });
      if (batch.failed.length) {
        const failed = preview.createDiv({ cls: "mms-ai-apply-warning" });
        failed.setText(`未成功识别 ${batch.failed.length} 张图片；它们不会被替换。`);
      }
      preview.removeClass("is-hidden");
      resultMeta.setText(`${batch.mode === "ai" ? "AI 识图" : "本地 OCR"} · 成功 ${batch.items.length}/${batch.items.length + batch.failed.length}`);
      resultMeta.removeClass("is-hidden");
      copy.toggleClass("is-hidden", !answerText);
      apply.toggleClass("is-hidden", pendingImagePreviews.length === 0);
      apply.setText("确认原位替换");
      status.setText(batch.failed.length
        ? `识图完成：成功 ${batch.items.length} 张，失败 ${batch.failed.length} 张。请检查后确认替换成功项。`
        : `识图完成：请检查 ${batch.items.length} 项文字后确认原位替换。`);
      const delay = this.options.imageRecognitionAutoConfirmDelaySeconds;
      if (delay !== null && pendingImagePreviews.length) {
        apply.setText(delay ? `${delay} 秒后自动确认` : "正在自动确认");
        this.imageAutoConfirmTimer = window.setTimeout(() => {
          this.imageAutoConfirmTimer = null;
          if (session === this.modalSession && pendingImagePreviews.length) apply.click();
        }, delay * 1000);
      }
    };

    mode.addEventListener("change", updateMode);
    close.addEventListener("click", () => this.close());
    copy.addEventListener("click", () => {
      if (!answerText) return;
      void navigator.clipboard.writeText(answerText).then(() => new Notice(currentMode() === "vision" ? "识图结果已复制" : "AI 回答已复制"));
    });
    apply.addEventListener("click", () => {
      if (this.imageAutoConfirmTimer !== null) window.clearTimeout(this.imageAutoConfirmTimer);
      this.imageAutoConfirmTimer = null;
      const imagePreviews = pendingImagePreviews.map((preview, index) => ({
        ...preview,
        text: imagePreviewInputs[index]?.value.trim() ?? preview.text
      })).filter((preview) => preview.text);
      const action = pendingAiPreview
        ? this.options.onApplyAiEdit(pendingAiPreview)
        : pendingReplacePreview
          ? this.options.onApplyLocalReplace(pendingReplacePreview)
          : imagePreviews.length
            ? this.options.onApplyImageTextReplacements(imagePreviews)
            : false;
      setBusy(true);
      void Promise.resolve(action)
        .then((applied) => {
          if (applied) this.close();
          else if (session === this.modalSession) status.setText("变更未应用。请检查只读状态或重新生成预览。");
        })
        .catch((error) => {
          if (session === this.modalSession) status.setText(error instanceof Error ? error.message : "应用变更失败");
        })
        .finally(() => { if (session === this.modalSession) setBusy(false); });
    });

    form.addEventListener("submit", (event: SubmitEvent) => {
      event.preventDefault();
      resetOutput();
      if (currentMode() === "replace") {
        try {
          pendingReplacePreview = this.options.onPreviewLocalReplace(
            findInput.value,
            replacementInput.value,
            false
          );
          showReplacePreview(pendingReplacePreview);
        } catch (error) {
          status.setText(error instanceof Error ? error.message : "无法生成替换预览");
        }
        return;
      }

      const prompt = question.value.trim();
      if (!prompt) {
        new Notice(currentMode() === "edit" ? "请输入修改要求" : currentMode() === "vision" ? "请输入识图要求" : "请输入要询问的问题");
        question.focus();
        return;
      }
      if (requiresAiProfile() && !provider.value) { new Notice("请先配置并启用 AI 接口"); return; }

      if (currentMode() === "vision") {
        setBusy(true);
        steps.forEach((step) => { step.dataset.state = "pending"; });
        setStep(0, "active");
        status.setText(`正在读取并依次识别 ${this.options.imageCount} 张图片…`);
        void this.options.onRecognizeImages(provider.value, prompt)
          .then((batch) => {
            if (session !== this.modalSession) return;
            setStep(0, "done");
            setStep(1, "done");
            setStep(2, "done");
            setStep(3, "active");
            answerText = batch.text;
            showImageRecognitionPreview(batch);
            setStep(3, batch.failed.length && !batch.items.length ? "error" : "done");
          })
          .catch((error) => {
            if (session !== this.modalSession) return;
            const activeIndex = steps.findIndex((step) => step.dataset.state === "active");
            setStep(Math.max(0, activeIndex), "error");
            status.setText(error instanceof Error ? error.message : "图片识别失败");
            console.error("MindMap Studio image recognition failed", error);
          })
          .finally(() => { if (session === this.modalSession) setBusy(false); });
        return;
      }

      setBusy(true);
      setStep(1, "active");
      status.setText(`正在发送 ${formatByteSize(payload.byteSize)} Markdown 上下文…`);
      const modelStageTimer = window.setTimeout(() => {
        if (session !== this.modalSession) return;
        setStep(1, "done");
        setStep(2, "active");
        status.setText("上下文已发送，模型处理中…");
      }, 180);
      const request = currentMode() === "edit"
        ? this.options.onProposeEdit(provider.value, prompt)
        : this.options.onAsk(provider.value, prompt);
      void request
        .then(async (response) => {
          window.clearTimeout(modelStageTimer);
          setStep(1, "done");
          setStep(2, "done");
          setStep(3, "active");
          if (session !== this.modalSession) return;
          if (currentMode() === "edit") {
            pendingAiPreview = this.options.onPreviewAiEdit(response.text);
            showEditPreview(pendingAiPreview);
          } else {
            status.setText("已接收回答，正在渲染…");
            if (!this.markdownRenderComponent) return;
            answerText = response.text;
            await MarkdownRenderer.render(this.app, answerText, result, this.options.sourcePath, this.markdownRenderComponent);
            if (session !== this.modalSession) return;
            result.removeClass("is-hidden");
            const usage = response.usage?.totalTokens ? ` · ${response.usage.totalTokens} tokens` : "";
            resultMeta.setText(`${response.model}${usage}`);
            resultMeta.removeClass("is-hidden");
            copy.removeClass("is-hidden");
            status.setText("完成");
          }
          setStep(3, "done");
        })
        .catch((error) => {
          window.clearTimeout(modelStageTimer);
          if (session !== this.modalSession) return;
          const failedStage = steps[2]?.dataset.state === "active" ? 2 : 1;
          setStep(failedStage, "error");
          status.setText(error instanceof Error ? error.message : "AI 请求失败");
          console.error("MindMap Studio AI request failed", error);
        })
        .finally(() => { if (session === this.modalSession) setBusy(false); });
    });

    updateMode();
  }

  /** 释放 Markdown 渲染器注册的子组件和事件，避免窗口关闭后继续更新 DOM。 */
  onClose(): void {
    this.modalSession += 1;
    if (this.imageAutoConfirmTimer !== null) window.clearTimeout(this.imageAutoConfirmTimer);
    this.imageAutoConfirmTimer = null;
    this.markdownRenderComponent?.unload();
    this.markdownRenderComponent = null;
    this.contentEl.empty();
  }
}
