/**
 * @file modal.ts
 * @description AI 问答、结构化导图编辑预览、本地替换和请求处理轨迹窗口。
 */

import { Component, MarkdownRenderer, Modal, Notice, setIcon, type App } from "obsidian";
import type { AiProfileConfig } from "./config";
import { formatByteSize, type AiMarkdownPayload } from "./markdown";
import type { AiCompletionResult } from "./client";
import type { AiEditPreview, AiInteractionMode, LocalReplacePreview } from "./edit";

/** 创建 AI 窗口所需的上下文、接口和安全应用回调。 */
export interface AiAskModalOptions {
  payload: AiMarkdownPayload;
  profiles: AiProfileConfig[];
  defaultProfileId: string;
  defaultQuestion: string;
  sourcePath: string;
  onAsk: (profileId: string, question: string) => Promise<AiCompletionResult>;
  onProposeEdit: (profileId: string, instruction: string) => Promise<AiCompletionResult>;
  onPreviewAiEdit: (responseText: string) => AiEditPreview;
  onApplyAiEdit: (preview: AiEditPreview) => boolean | Promise<boolean>;
  onPreviewLocalReplace: (query: string, replacement: string, caseSensitive: boolean) => LocalReplacePreview;
  onApplyLocalReplace: (preview: LocalReplacePreview) => boolean | Promise<boolean>;
}

/** 单个处理轨迹步骤的视觉状态。 */
type TraceState = "pending" | "active" | "done" | "error";

/** 显示 AI 问答、修改提案确认和不联网文字替换。 */
export class AiAskModal extends Modal {
  /** 承载 MarkdownRenderer 注册的子组件，并在窗口关闭时统一释放。 */
  private markdownRenderComponent: Component | null = null;
  /** 标识当前打开会话，防止关闭后的异步响应继续写入旧 DOM。 */
  private modalSession = 0;

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
        text: "当前 Markdown 超过 AI 输入大小限制。AI 问答和 AI 编辑将被阻止；本地替换仍可使用。"
      });
    }

    const form = this.contentEl.createEl("form", { cls: "mms-ai-form" });
    const modeLabel = form.createEl("label", { cls: "mms-ai-field" });
    modeLabel.createSpan({ text: "操作" });
    const mode = modeLabel.createEl("select");
    mode.createEl("option", { value: "ask", text: "询问 AI（不修改导图）" });
    mode.createEl("option", { value: "edit", text: "AI 整理并重新生成（确认后应用）" });
    mode.createEl("option", { value: "replace", text: "本地文字替换（不调用 AI）" });

    const providerLabel = form.createEl("label", { cls: "mms-ai-field" });
    providerLabel.createSpan({ text: "接口" });
    const provider = providerLabel.createEl("select");
    for (const profile of profiles) provider.createEl("option", { value: profile.id, text: `${profile.name} · ${profile.model}` });
    provider.value = profiles.some((profile) => profile.id === this.options.defaultProfileId)
      ? this.options.defaultProfileId
      : profiles[0]?.id ?? "";

    const questionLabel = form.createEl("label", { cls: "mms-ai-field" });
    const questionTitle = questionLabel.createSpan({ text: "问题" });
    const question = questionLabel.createEl("textarea", {
      attr: { rows: "6", placeholder: "例如：总结关键观点，或回答与当前导图有关的问题。" }
    });
    question.value = this.options.defaultQuestion;

    const replacePanel = form.createDiv({ cls: "mms-ai-replace-panel is-hidden" });
    const findLabel = replacePanel.createEl("label", { cls: "mms-ai-field" });
    findLabel.createSpan({ text: "查找文字" });
    const findInput = findLabel.createEl("input", { attr: { type: "text", placeholder: "例如：旧名称" } });
    const replacementLabel = replacePanel.createEl("label", { cls: "mms-ai-field" });
    replacementLabel.createSpan({ text: "替换为" });
    const replacementInput = replacementLabel.createEl("input", { attr: { type: "text", placeholder: "例如：新名称；可以留空表示删除" } });
    const caseLabel = replacePanel.createEl("label", { cls: "mms-ai-checkbox" });
    const caseSensitive = caseLabel.createEl("input", { attr: { type: "checkbox" } });
    caseLabel.createSpan({ text: "区分大小写" });
    replacePanel.createEl("p", {
      cls: "setting-item-description",
      text: "本地替换只处理节点文字、正文、备注和表格，不修改链接、代码、图片地址或子导图路径。"
    });

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
    const currentMode = (): AiInteractionMode => mode.value as AiInteractionMode;
    const setStep = (index: number, state: TraceState): void => { if (steps[index]) steps[index]!.dataset.state = state; };
    const resetOutput = (): void => {
      answerText = "";
      pendingAiPreview = null;
      pendingReplacePreview = null;
      result.empty();
      preview.empty();
      result.addClass("is-hidden");
      resultMeta.addClass("is-hidden");
      preview.addClass("is-hidden");
      copy.addClass("is-hidden");
      apply.addClass("is-hidden");
      steps.forEach((step, index) => { step.dataset.state = index === 0 ? "done" : "pending"; });
    };
    const setBusy = (busy: boolean): void => {
      submit.disabled = busy || (currentMode() !== "replace" && (payload.overLimit || !profiles.length));
      provider.disabled = busy;
      mode.disabled = busy;
      question.disabled = busy;
      findInput.disabled = busy;
      replacementInput.disabled = busy;
      caseSensitive.disabled = busy;
      apply.disabled = busy;
      form.toggleClass("is-busy", busy);
    };
    const updateMode = (): void => {
      resetOutput();
      const selected = currentMode();
      const local = selected === "replace";
      providerLabel.toggleClass("is-hidden", local);
      questionLabel.toggleClass("is-hidden", local);
      replacePanel.toggleClass("is-hidden", !local);
      track.toggleClass("is-hidden", local);
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
      } else {
        submitText.setText("预览替换");
        status.setText("本地替换不会联网，确认前不会修改导图。");
      }
      submit.disabled = selected !== "replace" && (payload.overLimit || !profiles.length);
      if (selected !== "replace" && !profiles.length) {
        status.setText("没有已启用且配置完整的 AI 接口；仍可切换到本地文字替换。");
      }
      window.setTimeout(() => (local ? findInput : question).focus(), 20);
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

    mode.addEventListener("change", updateMode);
    close.addEventListener("click", () => this.close());
    copy.addEventListener("click", () => {
      if (!answerText) return;
      void navigator.clipboard.writeText(answerText).then(() => new Notice("AI 回答已复制"));
    });
    apply.addEventListener("click", () => {
      const action = pendingAiPreview
        ? this.options.onApplyAiEdit(pendingAiPreview)
        : pendingReplacePreview
          ? this.options.onApplyLocalReplace(pendingReplacePreview)
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
            caseSensitive.checked
          );
          showReplacePreview(pendingReplacePreview);
        } catch (error) {
          status.setText(error instanceof Error ? error.message : "无法生成替换预览");
        }
        return;
      }

      const prompt = question.value.trim();
      if (!prompt) { new Notice(currentMode() === "edit" ? "请输入修改要求" : "请输入要询问的问题"); question.focus(); return; }
      if (!provider.value) { new Notice("请先配置并启用 AI 接口"); return; }
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
    this.markdownRenderComponent?.unload();
    this.markdownRenderComponent = null;
    this.contentEl.empty();
  }
}
