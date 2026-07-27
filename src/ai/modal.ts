/**
 * @file modal.ts
 * @description AI 提问窗口、Markdown 大小提示和请求处理轨迹。
 */

import { MarkdownRenderer, Modal, Notice, setIcon, type App } from "obsidian";
import type { AiProfileConfig } from "./config";
import { formatByteSize, type AiMarkdownPayload } from "./markdown";
import type { AiCompletionResult } from "./client";

/** 创建 AI 询问窗口所需的上下文、接口和回调。 */
export interface AiAskModalOptions {
  payload: AiMarkdownPayload;
  profiles: AiProfileConfig[];
  defaultProfileId: string;
  defaultQuestion: string;
  sourcePath: string;
  onSubmit: (profileId: string, question: string) => Promise<AiCompletionResult>;
}

/** 单个处理轨迹步骤的视觉状态。 */
type TraceState = "pending" | "active" | "done" | "error";

/** 显示 AI 范围、输入大小、请求轨迹和 Markdown 回答。 */
export class AiAskModal extends Modal {
  /** 保存窗口上下文并初始化 Obsidian Modal。 */
  constructor(app: App, private readonly options: AiAskModalOptions) {
    super(app);
  }

  /** 构建范围摘要、大小提示、处理轨迹和回答区域。 */
  onOpen(): void {
    this.titleEl.setText("询问 AI");
    this.modalEl.addClass("mms-ai-modal");
    const { payload, profiles } = this.options;
    const summary = this.contentEl.createDiv({ cls: "mms-ai-context-summary" });
    summary.createDiv({ cls: "mms-ai-scope", text: payload.scopeLabel });
    const metrics = summary.createDiv({ cls: "mms-ai-context-metrics" });
    metrics.createSpan({ text: `${payload.nodeCount} 个节点` });
    metrics.createSpan({ text: `${payload.characterCount.toLocaleString()} 字符` });
    const size = metrics.createSpan({ text: `${formatByteSize(payload.byteSize)} / ${formatByteSize(payload.maxInputBytes)}` });
    size.toggleClass("is-over-limit", payload.overLimit);
    summary.createEl("p", {
      cls: "setting-item-description",
      text: payload.scope === "subtree"
        ? "将仅上传该节点及其全部子节点转换后的 Markdown。"
        : "将上传当前页面全部节点转换后的 Markdown。"
    });

    if (payload.overLimit) {
      this.contentEl.createDiv({
        cls: "mms-ai-limit-warning",
        text: "当前 Markdown 超过 AI 输入大小限制。请在节点上右键缩小范围，或在设置中提高限制。"
      });
    }

    const form = this.contentEl.createEl("form", { cls: "mms-ai-form" });
    const providerLabel = form.createEl("label", { cls: "mms-ai-field" });
    providerLabel.createSpan({ text: "接口" });
    const provider = providerLabel.createEl("select");
    for (const profile of profiles) provider.createEl("option", { value: profile.id, text: `${profile.name} · ${profile.model}` });
    provider.value = profiles.some((profile) => profile.id === this.options.defaultProfileId)
      ? this.options.defaultProfileId
      : profiles[0]?.id ?? "";

    const questionLabel = form.createEl("label", { cls: "mms-ai-field" });
    questionLabel.createSpan({ text: "问题" });
    const question = questionLabel.createEl("textarea", {
      attr: { rows: "6", placeholder: "例如：总结关键观点、检查逻辑漏洞，或根据内容回答问题。" }
    });
    question.value = this.options.defaultQuestion;

    const track = form.createDiv({ cls: "mms-ai-track" });
    const steps = ["转换 Markdown", "上传上下文", "模型处理", "接收结果"].map((label, index) => {
      const step = track.createDiv({ cls: "mms-ai-track-step" });
      step.dataset.state = "pending";
      step.createSpan({ cls: "mms-ai-track-dot", text: String(index + 1) });
      step.createSpan({ cls: "mms-ai-track-label", text: label });
      return step;
    });
    steps[0]!.dataset.state = "done";

    const status = form.createDiv({ cls: "mms-ai-status", text: "Markdown 已生成，等待发送。" });
    const result = form.createDiv({ cls: "mms-ai-result markdown-rendered is-hidden" });
    const resultMeta = form.createDiv({ cls: "mms-ai-result-meta is-hidden" });
    const actions = form.createDiv({ cls: "mms-ai-actions" });
    const copy = actions.createEl("button", { attr: { type: "button" }, text: "复制回答" });
    copy.addClass("is-hidden");
    const close = actions.createEl("button", { attr: { type: "button" }, text: "关闭" });
    const submit = actions.createEl("button", { cls: "mod-cta", attr: { type: "submit" } });
    setIcon(submit, "sparkles");
    submit.createSpan({ text: "发送" });
    submit.disabled = payload.overLimit || !profiles.length;
    if (!profiles.length) status.setText("没有已启用且配置完整的 AI 接口，请先打开插件设置。");

    let answerText = "";
    const setStep = (index: number, state: TraceState): void => { if (steps[index]) steps[index]!.dataset.state = state; };
    const setBusy = (busy: boolean): void => {
      submit.disabled = busy || payload.overLimit || !profiles.length;
      provider.disabled = busy;
      question.disabled = busy;
      form.toggleClass("is-busy", busy);
    };

    close.addEventListener("click", () => this.close());
    copy.addEventListener("click", () => {
      if (!answerText) return;
      void navigator.clipboard.writeText(answerText).then(() => new Notice("AI 回答已复制"));
    });
    form.addEventListener("submit", (event: SubmitEvent) => {
      event.preventDefault();
      const prompt = question.value.trim();
      if (!prompt) { new Notice("请输入要询问的问题"); question.focus(); return; }
      if (!provider.value) { new Notice("请先配置并启用 AI 接口"); return; }
      setBusy(true);
      result.addClass("is-hidden");
      resultMeta.addClass("is-hidden");
      copy.addClass("is-hidden");
      result.empty();
      setStep(1, "active");
      status.setText(`正在发送 ${formatByteSize(payload.byteSize)} Markdown 上下文…`);
      const modelStageTimer = window.setTimeout(() => {
        setStep(1, "done");
        setStep(2, "active");
        status.setText("上下文已发送，模型处理中…");
      }, 180);
      void this.options.onSubmit(provider.value, prompt)
        .then(async (response) => {
          window.clearTimeout(modelStageTimer);
          setStep(1, "done");
          setStep(2, "done");
          setStep(3, "active");
          status.setText("已接收回答，正在渲染…");
          answerText = response.text;
          await MarkdownRenderer.render(this.app, answerText, result, this.options.sourcePath, this);
          result.removeClass("is-hidden");
          const usage = response.usage?.totalTokens ? ` · ${response.usage.totalTokens} tokens` : "";
          resultMeta.setText(`${response.model}${usage}`);
          resultMeta.removeClass("is-hidden");
          copy.removeClass("is-hidden");
          setStep(3, "done");
          status.setText("完成");
        })
        .catch((error) => {
          window.clearTimeout(modelStageTimer);
          const failedStage = steps[2]?.dataset.state === "active" ? 2 : 1;
          setStep(failedStage, "error");
          status.setText(error instanceof Error ? error.message : "AI 请求失败");
          console.error("MindMap Studio AI request failed", error);
        })
        .finally(() => setBusy(false));
    });
    window.setTimeout(() => question.focus(), 20);
  }
}
