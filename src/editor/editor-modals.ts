/**
 * @file editor-modals.ts
 * @description 编辑器领域的通用预览和导出弹窗。
 */

import { App, finishRenderMath, Menu, Modal, Notice, renderMath } from "obsidian";
import {
  markdownToDocument,
  normalizeDocument,
  type MindMapDocument,
  type MindMapImageSourceCandidate
} from "../core/model";
import { ensureMathJax } from "./rich-text-dom";
import { normalizeFormulaEditorSource, normalizeLatexForMathJax } from "../core/latex";
import type { ImageHostChoice } from "../settings";
import { materializeXMindImages, xmindToImportResult } from "../import/import-export";
import { setAllBranchesCollapsed } from "./node-actions";
import { selectDesktopImportFile } from "../utils/desktop-import";

/**
 * 选择一个或多个图片上传目标。
 */
class ImageHostPickerModal extends Modal {
  private resolved = false;
  private readonly selected = new Set<string>();

  /**
   * 创建图床选择弹窗。
   *
   * @param app Obsidian 应用实例。
   * @param hosts 可用图床。
   * @param initialIds 默认选中的图床 ID。
   * @param resolveSelection 选择结果回调。
   */
  constructor(
    app: App,
    private readonly hosts: ImageHostChoice[],
    initialIds: string[],
    private readonly resolveSelection: (ids: string[] | null) => void
  ) {
    super(app);
    initialIds.forEach((id) => this.selected.add(id));
  }

  /**
   * 创建图床多选列表。
   */
  onOpen(): void {
    this.titleEl.setText("选择上传图床");
    this.contentEl.addClass("mms-image-host-picker");
    this.contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "可以选择一个或多个图床。全部上传成功后，第一项的地址会作为节点当前显示地址，其余地址会作为镜像保存。"
    });
    const list = this.contentEl.createDiv({ cls: "mms-image-host-picker-list" });
    for (const host of this.hosts) {
      const label = list.createEl("label", { cls: "mms-image-host-picker-item" });
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.checked = this.selected.has(host.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.selected.add(host.id);
        else this.selected.delete(host.id);
      });
      label.createSpan({ text: host.name });
    }
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    actions.createEl("button", { text: "取消", attr: { type: "button" } })
      .addEventListener("click", () => this.close());
    const confirm = actions.createEl("button", { text: "确定", cls: "mod-cta", attr: { type: "button" } });
    confirm.addEventListener("click", () => {
      if (!this.selected.size) {
        new Notice("请至少选择一个图床");
        return;
      }
      this.resolved = true;
      this.resolveSelection(Array.from(this.selected));
      this.close();
    });
  }

  /**
   * 未确认时返回取消结果。
   */
  onClose(): void {
    if (!this.resolved) this.resolveSelection(null);
  }
}

/**
 * 打开图床选择器，并过滤已经失效的默认 ID。
 *
 * @param app Obsidian 应用实例。
 * @param hosts 可用图床。
 * @param initialIds 默认图床 ID。
 * @returns 用户选择的图床 ID；取消时返回 null。
 */
export function chooseImageHosts(
  app: App,
  hosts: ImageHostChoice[],
  initialIds: string[]
): Promise<string[] | null> {
  if (!hosts.length) {
    new Notice("没有可用图床，请先在插件设置中配置并启用图床");
    return Promise.resolve(null);
  }
  const allowed = new Set(hosts.map((host) => host.id));
  const initial = initialIds.filter((id) => allowed.has(id));
  return new Promise((resolve) => {
    new ImageHostPickerModal(app, hosts, initial.length ? initial : [hosts[0]!.id], resolve).open();
  });
}

/**
 * 图片预览弹窗内的一次来源变更请求。
 *
 * `reupload` 表示选择本地图片并上传图床（图床与手动 URL 来源）；`replaceLocal` 表示选择本地
 * 图片替换本地副本；`remove` 删除一个来源（没有任何剩余来源时由宿主删除整个图片块）；
 * `add` 把用户手动填写的 URL 添加为新来源；`setDefault` / `unsetDefault` 写入或取消图片级来源优先级。
 */
export type ImagePreviewSourceChange =
  | { type: "reupload" }
  | { type: "replaceLocal" }
  | { type: "remove"; source: string }
  | { type: "add"; url: string }
  | { type: "setDefault"; source: string }
  | { type: "unsetDefault"; source: string };

/**
 * 图片预览弹窗来源管理动作，由编辑器注入并走统一历史与保存链路。
 *
 * `applyChange` 返回 true 表示图片块仍然存在（弹窗保持打开并刷新来源栏），
 * 返回 false 表示图片块已被删除（弹窗应关闭）。
 */
export interface ImagePreviewSourceActions {
  /** 重新读取图片块的最新候选来源（含图片级优先级排序）。 */
  getSources: () => MindMapImageSourceCandidate[];
  /** 读取当前被显式固定为默认显示来源的地址；未固定时返回 null。 */
  getDefaultSource: () => string | null;
  /** 通过统一历史链路执行一次来源变更。 */
  applyChange: (change: ImagePreviewSourceChange) => Promise<boolean>;
}

/**
 * 图片放大预览弹窗：按来源优先级列出图床镜像、手动 URL 和本地副本，支持缩放与来源管理。
 */
export class ImagePreviewModal extends Modal {
  private scale = 1;
  /** 当前来源变更执行器；onOpen 时注入。 */
  private runSourceChangeImpl: ((change: ImagePreviewSourceChange) => Promise<void>) | null = null;

  /**
   * 创建图片预览弹窗。
   *
   * @param app Obsidian 应用实例。
   * @param source 图片资源地址。
   * @param alt 图片说明。
   * @param sources 当前图片已经保存的图床镜像及本地来源。
   * @param resolveSource 将仓库路径转换为可显示地址的解析器。
   * @param actions 可选的来源管理动作；缺省时预览保持只读。
   */
  constructor(
    app: App,
    private readonly source: string,
    private readonly alt: string,
    private readonly sources: MindMapImageSourceCandidate[] = [],
    private readonly resolveSource?: (source: string) => string | null,
    private readonly actions?: ImagePreviewSourceActions
  ) {
    super(app);
  }

  /** 统一入口：执行来源变更并容忍重复触发。 */
  private runSourceChange(change: ImagePreviewSourceChange): Promise<void> {
    return this.runSourceChangeImpl?.(change) ?? Promise.resolve();
  }

  /**
   * 创建图片预览界面和缩放控制。
   */
  onOpen(): void {
    this.modalEl.addClass("mmc-image-preview-modal");
    this.modalEl.style.setProperty("width", "min(98vw, 1440px)", "important");
    this.modalEl.style.setProperty("height", "min(82vh, 900px)", "important");
    this.titleEl.setText(this.alt || "图片预览");
    const toolbar = this.contentEl.createDiv({ cls: "mmc-image-preview-toolbar" });
    const sourceBar = this.contentEl.createDiv({ cls: "mmc-image-preview-sources" });
    const imageWrap = this.contentEl.createDiv({ cls: "mmc-image-preview-stage" });
    const image = imageWrap.createEl("img", { attr: { src: this.source, alt: this.alt || "图片", draggable: "false" } });
    let sourceStatus: HTMLElement;
    let baseWidth = 0;
    let baseHeight = 0;
    let activeSource = this.source;
    let panX = 0;
    let panY = 0;
    let addPanelOpen = false;
    const applyScale = (): void => {
      if (!baseWidth || !baseHeight) return;
      image.style.width = `${Math.max(1, Math.round(baseWidth * this.scale))}px`;
      image.style.height = `${Math.max(1, Math.round(baseHeight * this.scale))}px`;
      image.style.transform = `translate(${Math.round(panX)}px, ${Math.round(panY)}px)`;
    };
    let panPointerId: number | null = null;
    let panStartX = 0;
    let panStartY = 0;
    let panBaseX = 0;
    let panBaseY = 0;
    const resetPan = (): void => {
      panX = 0;
      panY = 0;
    };
    image.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      panPointerId = event.pointerId;
      panStartX = event.clientX;
      panStartY = event.clientY;
      panBaseX = panX;
      panBaseY = panY;
      image.setPointerCapture(event.pointerId);
      image.addClass("is-panning");
    });
    image.addEventListener("dragstart", (event) => event.preventDefault());
    image.addEventListener("pointermove", (event) => {
      if (panPointerId !== event.pointerId) return;
      panX = panBaseX + (event.clientX - panStartX);
      panY = panBaseY + (event.clientY - panStartY);
      applyScale();
    });
    const endPan = (event: PointerEvent): void => {
      if (panPointerId !== event.pointerId) return;
      panPointerId = null;
      image.removeClass("is-panning");
    };
    image.addEventListener("pointerup", endPan);
    image.addEventListener("pointercancel", endPan);
    image.addEventListener("load", () => {
      const availableWidth = Math.max(320, imageWrap.clientWidth * 0.9);
      const availableHeight = Math.max(220, imageWrap.clientHeight * 0.9);
      const fit = Math.min(1, availableWidth / Math.max(1, image.naturalWidth), availableHeight / Math.max(1, image.naturalHeight));
      baseWidth = Math.max(1, image.naturalWidth * fit);
      baseHeight = Math.max(1, image.naturalHeight * fit);
      applyScale();
      sourceStatus.setText(`${sourceStatus.dataset.label ?? "当前图片"} · ${image.naturalWidth}×${image.naturalHeight}`);
      sourceBar.removeClass("has-error");
    });
    image.addEventListener("error", () => {
      sourceStatus.setText(`${sourceStatus.dataset.label ?? "当前图片"} · 加载失败`);
      sourceBar.addClass("has-error");
    });
    const button = (label: string, action: () => void): void => {
      const element = toolbar.createEl("button", { text: label, attr: { type: "button" } });
      element.addEventListener("click", action);
    };
    button("−", () => { this.scale = Math.max(0.2, this.scale - 0.2); applyScale(); });
    button("100%", () => { this.scale = 1; applyScale(); });
    button("+", () => { this.scale = Math.min(5, this.scale + 0.2); applyScale(); });

    const candidates = (): MindMapImageSourceCandidate[] => {
      const list = this.actions?.getSources() ?? this.sources;
      const available = list.filter((candidate) => candidate.kind !== "local" || Boolean(this.resolveSource?.(candidate.source)));
      return available.length ? available : list.slice(0, 1);
    };
    const switchSource = (candidate: MindMapImageSourceCandidate): void => {
      const resolved = this.resolveSource?.(candidate.source) ?? candidate.source;
      this.scale = 1;
      baseWidth = 0;
      baseHeight = 0;
      resetPan();
      activeSource = candidate.source;
      sourceStatus.dataset.label = candidate.label;
      sourceStatus.setText(`${candidate.label} · 加载中…`);
      sourceBar.removeClass("has-error");
      sourceBar.querySelectorAll(".mmc-image-preview-source-button.is-active").forEach((item) => item.removeClass("is-active"));
      image.removeAttribute("style");
      image.src = resolved;
    };
    const showSourceMenu = (candidate: MindMapImageSourceCandidate, event: MouseEvent): void => {
      if (!this.actions) return;
      event.preventDefault();
      const menu = new Menu();
      const pinned = this.actions.getDefaultSource();
      if (pinned === candidate.source) {
        menu.addItem((item) => item
          .setTitle("取消默认显示来源")
          .setIcon("star-off")
          .onClick(() => void this.runSourceChange({ type: "unsetDefault", source: candidate.source })));
      } else {
        menu.addItem((item) => item
          .setTitle("设为默认显示来源")
          .setIcon("star")
          .onClick(() => void this.runSourceChange({ type: "setDefault", source: candidate.source })));
      }
      menu.addSeparator();
      if (candidate.kind === "local") {
        menu.addItem((item) => item
          .setTitle("更新替换（选择本地图片）")
          .setIcon("image-plus")
          .onClick(() => void this.runSourceChange({ type: "replaceLocal" })));
      } else {
        menu.addItem((item) => item
          .setTitle("更新上传（选择本地图片并上传图床）")
          .setIcon("refresh-cw")
          .onClick(() => void this.runSourceChange({ type: "reupload" })));
      }
      menu.addItem((item) => item
        .setTitle("删除此来源")
        .setIcon("trash-2")
        .onClick(() => void this.runSourceChange({ type: "remove", source: candidate.source })));
      menu.showAtMouseEvent(event);
    };
    const bindSourceStatus = (): void => {
      sourceStatus = sourceBar.querySelector<HTMLElement>(".mmc-image-preview-source-status")
        ?? sourceBar.createSpan({ cls: "mmc-image-preview-source-status", text: "当前图片" });
    };
    const renderSourceBar = (): void => {
      const list = candidates();
      const loading = activeSource;
      sourceBar.empty();
      sourceBar.createSpan({ cls: "mmc-image-preview-sources-label", text: "图片来源：" });
      for (const candidate of list) {
        const sourceButton = sourceBar.createEl("button", {
          text: candidate.label,
          cls: "mmc-image-preview-source-button",
          attr: { type: "button", title: `预览来源：${candidate.label}${this.actions ? "；右键可管理来源" : ""}` }
        });
        if (candidate.source === activeSource) sourceButton.addClass("is-active");
        sourceButton.addEventListener("click", () => switchSource(candidate));
        sourceButton.addEventListener("contextmenu", (event) => showSourceMenu(candidate, event));
      }
      if (!list.some((candidate) => candidate.source === activeSource) && list.length) {
        activeSource = list[0]!.source;
      }
      if (list.length && activeSource !== loading) {
        const resolved = this.resolveSource?.(activeSource) ?? activeSource;
        this.scale = 1;
        baseWidth = 0;
        baseHeight = 0;
        image.removeAttribute("style");
        image.src = resolved;
      }
      bindSourceStatus();
      const active = list.find((candidate) => candidate.source === activeSource);
      if (active) sourceStatus.dataset.label = active.label;
      if (!this.actions) return;
      const addWrap = sourceBar.createDiv({ cls: "mmc-image-preview-source-add" });
      addWrap.toggleClass("is-open", addPanelOpen);
      const toggle = addWrap.createEl("button", {
        text: "＋",
        cls: "mmc-image-preview-source-add-toggle",
        attr: { type: "button", title: "手动添加图片 URL 来源", "aria-expanded": String(addPanelOpen) }
      });
      const addPanel = addWrap.createDiv({ cls: "mmc-image-preview-source-add-panel" });
      const urlInput = addPanel.createEl("input", {
        cls: "mmc-image-preview-source-add-input",
        attr: { type: "text", placeholder: "手动添加图片 URL 来源" }
      });
      const submit = (): void => {
        const url = urlInput.value.trim();
        if (!url) return;
        urlInput.value = "";
        addPanelOpen = false;
        void this.runSourceChange({ type: "add", url });
      };
      addPanel.createEl("button", { text: "添加来源", attr: { type: "button" } })
        .addEventListener("click", submit);
      urlInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        }
      });
      toggle.addEventListener("click", () => {
        addPanelOpen = !addPanelOpen;
        addWrap.toggleClass("is-open", addPanelOpen);
        toggle.setAttribute("aria-expanded", String(addPanelOpen));
        if (addPanelOpen) urlInput.focus();
      });
    };
    renderSourceBar();

    imageWrap.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.scale = Math.min(5, Math.max(0.2, this.scale + (event.deltaY < 0 ? 0.15 : -0.15)));
      applyScale();
    }, { passive: false });
    image.addEventListener("dblclick", () => {
      this.scale = 1;
      resetPan();
      applyScale();
    });

    /** 执行一次来源变更并刷新来源栏；图片块被删除时关闭弹窗。 */
    this.runSourceChangeImpl = async (change: ImagePreviewSourceChange): Promise<void> => {
      if (!this.actions) return;
      const stillExists = await this.actions.applyChange(change);
      if (!stillExists) {
        this.close();
        return;
      }
      if (!candidates().length) {
        this.close();
        return;
      }
      renderSourceBar();
    };
  }
}

/** LaTeX 插入结果，display 为 true 时使用独立公式，false 时使用行内公式。 */
export interface FormulaInsertValue {
  source: string;
  display: boolean;
}

/**
 * 图形化 LaTeX 公式编辑器，提供常用结构、行内/独立模式和实时预览。
 */
export class FormulaEditModal extends Modal {
  /**
   * 创建公式编辑器。
   *
   * @param app Obsidian 应用实例。
   * @param submit 保存公式源码和显示方式的回调。
   * @param defaultDisplay 初始是否使用独立公式模式。
   */
  constructor(
    app: App,
    private readonly submit: (value: FormulaInsertValue) => void,
    private readonly defaultDisplay = false
  ) {
    super(app);
  }

  /**
   * 创建公式模板、源码输入和 MathJax 预览。
   */
  onOpen(): void {
    this.titleEl.setText("插入 LaTeX 公式");
    this.contentEl.addClass("mms-formula-editor");
    this.contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "行内公式可以和前后文字位于同一行；独立公式会单独居中显示。也可以直接修改 LaTeX 源码。"
    });
    const displayMode = this.contentEl.createEl("select", {
      cls: "mms-formula-display-mode",
      attr: { "aria-label": "公式显示方式" }
    });
    displayMode.createEl("option", { value: "inline", text: "行内公式（可与文字混排）" });
    displayMode.createEl("option", { value: "display", text: "独立公式（单独一行）" });
    displayMode.value = this.defaultDisplay ? "display" : "inline";
    const templates: Array<[string, string, string]> = [
      ["x²", "x^{2}", "上标"], ["xᵢ", "x_{i}", "下标"], ["a⁄b", "\\frac{a}{b}", "分数"],
      ["√x", "\\sqrt{x}", "根号"], ["Σ", "\\sum_{i=1}^{n} x_i", "求和"],
      ["∫", "\\int_{a}^{b} f(x)\\,dx", "积分"], ["lim", "\\lim_{x\\to\\infty} f(x)", "极限"],
      ["α", "\\alpha", "希腊字母"], ["→", "\\overrightarrow{AB}", "向量"],
      ["()", "\\left( \\frac{a}{b} \\right)", "自适应括号"],
      ["矩阵", "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}", "矩阵"],
      ["方程组", "\\begin{cases} x+y=1 \\\\ x-y=0 \\end{cases}", "方程组"]
    ];
    const arithmetic: Array<[string, string, string]> = [
      ["+", " + ", "加"], ["−", " - ", "减"], ["×", " \\times ", "乘"], ["÷", " \\div ", "除"],
      ["·", " \\cdot ", "点乘"], ["∗", " \\ast ", "星号乘"], ["/", " / ", "斜线除"],
      ["a⁄b", "\\frac{a}{b}", "分数"], ["±", " \\pm ", "正负"], ["∓", " \\mp ", "负正"],
      ["=", " = ", "等于"], ["%", " \\% ", "百分号"], [":", " : ", "比"]
    ];
    const relations: Array<[string, string, string]> = [
      ["≠", " \\neq ", "不等于"], ["≈", " \\approx ", "约等于"], ["≡", " \\equiv ", "恒等于"],
      ["≢", " \\not\\equiv ", "不恒等于"], ["≥", " \\geq ", "大于等于"], ["≫", " \\gg ", "远大于"],
      ["≤", " \\leq ", "小于等于"], ["≪", " \\ll ", "远小于"], ["∼", " \\sim ", "相似"],
      ["≃", " \\simeq ", "渐近相等"], ["≅", " \\cong ", "全等"]
    ];
    this.contentEl.createDiv({ cls: "mms-formula-section-title", text: "常用结构" });
    const palette = this.contentEl.createDiv({ cls: "mms-formula-palette" });
    this.contentEl.createDiv({ cls: "mms-formula-section-title", text: "基本运算" });
    const arithmeticPalette = this.contentEl.createDiv({ cls: "mms-formula-palette mms-formula-operators" });
    this.contentEl.createDiv({ cls: "mms-formula-section-title", text: "关系符号" });
    const relationPalette = this.contentEl.createDiv({ cls: "mms-formula-palette mms-formula-relations" });
    const source = this.contentEl.createEl("textarea", {
      cls: "mms-formula-source",
      attr: { rows: "5", spellcheck: "false", placeholder: "\\frac{a}{b}" }
    });
    const preview = this.contentEl.createDiv({ cls: "mms-formula-preview" });
    let previewToken = 0;
    const updatePreview = (): void => {
      const token = ++previewToken;
      const value = normalizeFormulaEditorSource(source.value);
      preview.empty();
      if (!value) {
        preview.createSpan({ cls: "setting-item-description", text: "公式预览" });
        return;
      }
      void ensureMathJax().then(() => {
        if (token !== previewToken || !preview.isConnected) return;
        preview.empty();
        try {
          preview.appendChild(renderMath(normalizeLatexForMathJax(value), displayMode.value === "display"));
          void finishRenderMath();
        } catch {
          preview.createSpan({ cls: "mod-warning", text: "公式语法暂时无法渲染" });
        }
      });
    };
    const insert = (template: string): void => {
      const start = source.selectionStart ?? source.value.length;
      const end = source.selectionEnd ?? start;
      source.setRangeText(template, start, end, "end");
      source.focus();
      updatePreview();
    };
    for (const [label, template, title] of templates) {
      const button = palette.createEl("button", { text: label, attr: { type: "button", title } });
      button.addEventListener("click", () => insert(template));
    }
    for (const [label, template, title] of arithmetic) {
      const button = arithmeticPalette.createEl("button", {
        text: label,
        attr: { type: "button", title: `${title}（${template}）` }
      });
      button.addEventListener("click", () => insert(template));
    }
    for (const [label, template, title] of relations) {
      const button = relationPalette.createEl("button", {
        text: label,
        attr: { type: "button", title: `${title}（${template}）` }
      });
      button.addEventListener("click", () => insert(template));
    }
    source.addEventListener("input", updatePreview);
    displayMode.addEventListener("change", updatePreview);
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    actions.createEl("button", { text: "取消", attr: { type: "button" } }).addEventListener("click", () => this.close());
    const save = actions.createEl("button", { text: "插入公式", cls: "mod-cta", attr: { type: "button" } });
    save.addEventListener("click", () => {
      const value = normalizeFormulaEditorSource(source.value);
      if (!value) {
        new Notice("请先输入或选择一个公式");
        return;
      }
      this.submit({ source: value, display: displayMode.value === "display" });
      this.close();
    });
    updatePreview();
    source.focus();
  }

  /**
   * 清理公式编辑器 DOM。
   */
  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * 导入、导出或合并思维导图 JSON。
 */
export class ImportExportModal extends Modal {
  /**
   * 创建 JSON 传输弹窗。
   *
   * @param app Obsidian 应用实例。
   * @param document 当前思维导图文档。
   * @param onImport 导入完成回调及目标方式。
   * @param onExport 导出回调。
   */
  constructor(
    app: App,
    private readonly document: MindMapDocument,
    private readonly onImport: (document: MindMapDocument, mode: "child" | "replace") => void,
    private readonly onExportJson: (json: string) => void,
    private readonly onExportDocument: (format: "html" | "doc" | "pdf" | "md") => void,
    private readonly onExportSvg: () => void,
    private readonly canImport: boolean,
    private readonly getLastImportFolder: () => string,
    private readonly onRememberImportFolder: (folder: string) => void | Promise<void>,
    private readonly onImportMarkdownImages: (document: MindMapDocument, sourceDirectory: string) => Promise<number>,
    private readonly onSaveImportedImage: (blob: Blob, suggestedName: string) => Promise<string>
  ) {
    super(app);
  }

  /**
   * 创建 JSON 文本区和文件导入操作。
   */
  onOpen(): void {
    this.titleEl.setText("导入与导出");
    const importSection = this.contentEl.createDiv({ cls: "mms-import-export-section is-import" });
    importSection.createEl("h3", { text: "导入" });
    const description = importSection.createEl("p", {
      text: "可导入 MindMap Studio JSON、XMind 或 Markdown 文件。默认作为当前选中节点的子分支导入。"
    });
    description.addClass("setting-item-description");
    const importProgress = importSection.createDiv({ cls: "mmc-import-progress" });
    const progressBar = importProgress.createEl("progress", { attr: { max: "100", value: "0" } });
    const progressStatus = importProgress.createSpan({ text: "等待选择导入文件" });
    const updateImportProgress = async (value: number, status: string): Promise<void> => {
      progressBar.value = value;
      progressStatus.setText(`${value}% · ${status}`);
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    };
    const parseXMind = async (source: ArrayBuffer, fallbackTitle: string): Promise<{
      document: MindMapDocument;
      copiedImages: number;
      equationCount: number;
      missingImages: number;
    }> => {
      const result = xmindToImportResult(source, fallbackTitle);
      if (result.images.length) await updateImportProgress(68, `正在提取 ${result.images.length} 个 XMind 图片资源`);
      const materialized = await materializeXMindImages(result, async (image) => {
        const content = image.content.slice();
        return this.onSaveImportedImage(new Blob([content.buffer], { type: image.mimeType }), image.filename);
      });
      return {
        document: result.document,
        copiedImages: materialized.saved,
        equationCount: result.equationCount,
        missingImages: result.missingImageCount
      };
    };
    const importNotice = (name: string, copiedImages: number, equationCount: number, missingImages: number): string => {
      const details: string[] = [];
      if (copiedImages > 0) details.push(`提取 ${copiedImages} 张图片`);
      if (equationCount > 0) details.push(`识别 ${equationCount} 个 LaTeX 公式`);
      if (missingImages > 0) details.push(`${missingImages} 张图片资源缺失`);
      return details.length ? `已导入：${name}，${details.join("，")}` : `已导入：${name}`;
    };
    const textarea = importSection.createEl("textarea", { cls: "mmc-json-textarea" });
    textarea.value = JSON.stringify(this.document, null, 2);
    const importMode = importSection.createEl("select", { cls: "mmc-import-mode", attr: { "aria-label": "导入方式" } });
    importMode.createEl("option", { text: "导入为子节点（默认）", value: "child" });
    importMode.createEl("option", { text: "导入并替换当前文件", value: "replace" });
    const applyImport = (document: MindMapDocument): boolean => {
      const mode = importMode.value === "replace" ? "replace" : "child";
      if (mode === "replace" && !window.confirm("将使用导入内容替换当前整张导图，此操作可通过撤销恢复。是否继续？")) return false;
      this.onImport(document, mode);
      return true;
    };
    const actions = importSection.createDiv({ cls: "mmc-modal-actions mmc-json-actions" });
    const copy = actions.createEl("button", { text: "复制 JSON" });
    const importFileButton = actions.createEl("button", { text: "导入文件", attr: { type: "button" } });
    const exportButton = actions.createEl("button", { text: "导出 .json" });
    const importButton = actions.createEl("button", { text: "导入 JSON" });
    copy.addEventListener("click", () => {
      void navigator.clipboard.writeText(textarea.value);
      new Notice("已复制 JSON");
    });
    importFileButton.addEventListener("click", () => {
      void (async () => {
        const selected = await selectDesktopImportFile(this.getLastImportFolder());
        if (selected.supported) {
          if (!selected.file) return;
          await this.onRememberImportFolder(selected.file.directory);
          try {
            const extension = selected.file.name.split(".").at(-1)?.toLowerCase();
            await updateImportProgress(10, `正在读取 ${selected.file.name}`);
            const source = extension === "xmind"
              ? selected.file.content.buffer.slice(selected.file.content.byteOffset, selected.file.content.byteOffset + selected.file.content.byteLength)
              : new TextDecoder().decode(selected.file.content);
            await updateImportProgress(55, extension === "xmind" ? "正在解析 XMind 画布和主题" : extension === "json" ? "正在校验 JSON 文件" : "正在解析 Markdown 标题和列表");
            let imported: MindMapDocument;
            let copiedImages = 0;
            let equationCount = 0;
            let missingImages = 0;
            if (extension === "xmind") {
              const parsed = await parseXMind(source as ArrayBuffer, selected.file.name.replace(/\.xmind$/i, ""));
              imported = parsed.document;
              copiedImages = parsed.copiedImages;
              equationCount = parsed.equationCount;
              missingImages = parsed.missingImages;
            } else if (extension === "json") {
              imported = normalizeDocument(JSON.parse(source as string) as Partial<MindMapDocument>, this.document.title);
            } else {
              imported = markdownToDocument(source as string, selected.file.name.replace(/\.(?:md|markdown)$/i, ""));
              await updateImportProgress(70, "正在读取并复制 Markdown 图片");
              copiedImages = await this.onImportMarkdownImages(imported, selected.file.directory);
            }
            await updateImportProgress(85, "正在生成思维导图");
            setAllBranchesCollapsed(imported.root, true);
            if (!applyImport(imported)) return;
            await updateImportProgress(100, "导入完成");
            new Notice(importNotice(selected.file.name, copiedImages, equationCount, missingImages));
            window.setTimeout(() => this.close(), 180);
          } catch (error) {
            console.error("MindMap Studio file import failed", error);
            const message = error instanceof Error ? error.message : "文件导入失败";
            progressStatus.setText(`导入失败：${message}`);
            new Notice(message);
          }
          return;
        }
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".xmind,.md,.markdown,.json";
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        void (async () => {
          try {
            const extension = file.name.split(".").at(-1)?.toLowerCase();
            await updateImportProgress(10, `正在读取 ${file.name}`);
            const source = extension === "xmind" ? await file.arrayBuffer() : await file.text();
            await updateImportProgress(55, extension === "xmind" ? "正在解析 XMind 画布和主题" : extension === "json" ? "正在校验 JSON 文档" : "正在解析 Markdown 标题和列表");
            let imported: MindMapDocument;
            let copiedImages = 0;
            let equationCount = 0;
            let missingImages = 0;
            if (extension === "xmind") {
              const parsed = await parseXMind(source as ArrayBuffer, file.name.replace(/\.xmind$/i, ""));
              imported = parsed.document;
              copiedImages = parsed.copiedImages;
              equationCount = parsed.equationCount;
              missingImages = parsed.missingImages;
            } else if (extension === "json") {
              imported = normalizeDocument(JSON.parse(source as string) as Partial<MindMapDocument>, this.document.title);
            } else {
              imported = markdownToDocument(source as string, file.name.replace(/\.(?:md|markdown)$/i, ""));
            }
            await updateImportProgress(85, "正在生成思维导图");
            setAllBranchesCollapsed(imported.root, true);
            if (!applyImport(imported)) return;
            await updateImportProgress(100, "导入完成");
            new Notice(importNotice(file.name, copiedImages, equationCount, missingImages));
            window.setTimeout(() => this.close(), 180);
          } catch (error) {
            console.error("MindMap Studio file import failed", error);
            const message = error instanceof Error ? error.message : "文件导入失败";
            progressStatus.setText(`导入失败：${message}`);
            new Notice(message);
          }
        })();
      }, { once: true });
      input.click();
      })();
    });
    exportButton.addEventListener("click", () => this.onExportJson(textarea.value));
    importButton.addEventListener("click", () => {
      try {
        const parsed = JSON.parse(textarea.value) as Partial<MindMapDocument>;
        const normalized = normalizeDocument(parsed, this.document.title);
        setAllBranchesCollapsed(normalized.root, true);
        if (!applyImport(normalized)) return;
        new Notice("JSON 已导入");
        this.close();
      } catch (error) {
        console.error("MindMap Studio JSON import failed", error);
        new Notice("JSON 格式无效，请检查后重试");
      }
    });
    if (!this.canImport) {
      description.setText("当前为只读状态；可复制或导出当前导图 JSON，切换到编辑模式后才会显示导入操作。");
      importProgress.remove();
      importMode.remove();
      importFileButton.remove();
      importButton.remove();
      textarea.readOnly = true;
    }

    const exportSection = this.contentEl.createDiv({ cls: "mms-import-export-section is-export" });
    exportSection.createEl("h3", { text: "导出" });
    exportSection.createEl("p", {
      cls: "setting-item-description",
      text: "JSON 与 SVG 导出当前物理导图；HTML、Word、PDF 和 Markdown 按父子导图关系导出完整通读内容。"
    });
    const formats = exportSection.createDiv({ cls: "mms-document-export-grid" });
    for (const [format, title, summary] of [
      ["svg", "SVG", "当前导图的矢量图"],
      ["html", "HTML", "独立网页，可用浏览器打开"],
      ["doc", "Word", "可编辑的 .docx 文档"],
      ["pdf", "PDF", "打开打印版并另存为 PDF"],
      ["md", "Markdown", "完整父子导图标题结构"]
    ] as const) {
      const button = formats.createEl("button", { attr: { type: "button" } });
      button.createEl("strong", { text: title });
      button.createSpan({ text: summary });
      button.addEventListener("click", () => {
        if (format === "svg") this.onExportSvg();
        else this.onExportDocument(format);
        this.close();
      });
    }
  }

  /** Clears import/export controls when the modal closes. */
  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * 显示只读 Markdown 大纲并提供复制和导出入口。
 */
export class OutlineModal extends Modal {
  /**
   * 创建 Markdown 大纲弹窗。
   *
   * @param app Obsidian 应用实例。
   * @param markdown 要显示的 Markdown。
   * @param onExport 导出回调。
   */
  constructor(app: App, private readonly markdown: string, private readonly onExport: () => void) {
    super(app);
  }

  /**
   * 创建大纲内容和操作按钮。
   */
  onOpen(): void {
    this.titleEl.setText("Markdown 大纲");
    const textarea = this.contentEl.createEl("textarea", { cls: "mmc-outline-textarea" });
    textarea.value = this.markdown;
    textarea.readOnly = true;
    const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
    const copy = actions.createEl("button", { text: "复制" });
    const exportButton = actions.createEl("button", { text: "导出为 .md", cls: "mod-cta" });
    copy.addEventListener("click", () => {
      void navigator.clipboard.writeText(this.markdown);
      new Notice("已复制 Markdown 大纲");
    });
    exportButton.addEventListener("click", () => {
      this.onExport();
      this.close();
    });
  }

  /**
   * 清理大纲弹窗 DOM。
   */
  onClose(): void {
    this.contentEl.empty();
  }
}
