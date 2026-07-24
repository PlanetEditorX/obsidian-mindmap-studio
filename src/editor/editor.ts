/**
 * @file editor.ts
 * @description 编辑器领域的核心交互控制器。
 *
 * 负责三种视图、节点操作、富文本、图片、表格、代码、子导图、拖拽、尺寸、搜索、历史记录、只读锁和图床容灾。
 */

import { App, Menu, Modal, Notice, setIcon } from "obsidian";
import {
  cloneDocument,
  cloneNodeWithFreshIds,
  childrenToTable,
  containsNode,
  createNode,
  documentToMarkdown,
  extractFirstWikiLink,
  findAncestors,
  findNode,
  findParent,
  flattenNodes,
  getTaskProgress,
  imageSourceCandidates,
  mergeAppearance,
  nodeSearchText,
  newId,
  nodeContentBlocks,
  nodePlainText,
  nodePrimaryText,
  syncNodeLegacyFields,
  parseFencedCode,
  parseMarkdownTable,
  richTextCharacterStyles,
  characterStylesToRichText,
  applyRichTextStyleRange,
  type BackgroundPattern,
  type ArticleStyle,
  type DisplayMode,
  type EdgeStyle,
  type EdgeWidthMode,
  type FontFamilyMode,
  type MindMapAppearance,
  type MindMapThemePresetId,
  type MindMapDocument,
  type MindMapCodeBlock,
  type MindMapContentBlock,
  type MindMapImageContentBlock,
  type MindMapNode,
  type MindMapTextContentBlock,
  type MindMapSubmap,
  type MindMapTextStyle,
  type NodeShape,
  type NodeTextAlign,
  type TaskStatus,
  removeNode,
  type NodeDropPosition,
  moveNodeRelative
} from "../core/model";
import { buildBranchColorMap, computeLayout, documentToSvg, edgePath, edgeWidthForDepth, roundedElbowEdgePath, type LayoutResult } from "../render/layout";
import { CodeEditModal, TableEditModal } from "./content-modals";
import { TOOLBAR_ITEMS } from "../settings";
import { appearanceFromThemePreset, MINDMAP_THEME_PRESETS } from "../themes";
import { buildArticleNodeInfo, DISPLAY_MODE_ICONS, DISPLAY_MODE_LABELS, type ArticlePageNavigation, type ArticleTocEntry, type ReadingSection } from "../article/modes";
import { resolveArticleStyle } from "../article/article-style";
import type { MindMapEditorCallbacks, MindMapEditorOptions } from "./editor-types";
import { readRichTextEditor, renderRichTextRuns } from "./rich-text-dom";
import {
  ArticleStyleModal,
  DocumentExportModal,
  FormulaEditModal,
  ImagePreviewModal,
  JsonTransferModal,
  OutlineModal,
  SearchNodesModal
} from "./editor-modals";
import { parseClipboardHtml, parseClipboardNode } from "./clipboard-import";
import { selectNodeImage, uploadCurrentNodeImage } from "./node-image-actions";
import { renderNodeRichTextEditor } from "./node-rich-text-editor";
export type { MindMapEditorCallbacks, MindMapEditorOptions } from "./editor-types";

/**
 * NodeEditValues 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
interface NodeEditValues {
  content: MindMapContentBlock[];
  note: string;
  link: string;
  icon: string;
  tags: string[];
  task?: TaskStatus;
  skipArticleNumbering?: boolean;
  color?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shape?: NodeShape;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  textAlign?: NodeTextAlign;
  width?: number;
  minHeight?: number;
}

/**
 * NodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class NodeEditModal extends Modal {
  private readonly node: MindMapNode;
  private readonly defaultShape: NodeShape;
  private readonly callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource">;
  private readonly submit: (values: NodeEditValues, mode: "autosave" | "commit") => void;
  private saveOnClose: (() => void) | null = null;
  private closeWithoutFlush = false;
  private outsidePointerHandler: ((event: PointerEvent) => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private externalNodeHandler: ((event: Event) => void) | null = null;

  /**
   * 创建 NodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param node 当前处理的节点。
   * @param defaultShape 该参数用于 constructor 流程中的输入或控制。
   * @param callbacks 编辑器向视图层发送事件的一组回调。
   * @param submit 该参数用于 constructor 流程中的输入或控制。
   * @param position 编辑器显示在居中弹窗还是右侧画布面板。
   * @param panelHost 右侧面板需要限制在其中的画布元素。
   */
  constructor(
    app: App,
    node: MindMapNode,
    defaultShape: NodeShape,
    callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource">,
    submit: (values: NodeEditValues, mode: "autosave" | "commit") => void,
    private readonly position: "center" | "right" = "center",
    private readonly panelHost?: HTMLElement
  ) {
    super(app);
    this.node = node;
    this.defaultShape = defaultShape;
    this.callbacks = callbacks;
    this.submit = submit;
  }

  /**
   * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
   */
  onOpen(): void {
    this.modalEl.toggleClass("mms-node-editor-right", this.position === "right");
    if (this.position === "right" && this.panelHost) {
      const positionPanel = (): void => {
        const rect = this.panelHost!.getBoundingClientRect();
        const container = this.modalEl.parentElement;
        if (!container) return;
        container.style.left = `${rect.left}px`;
        container.style.top = `${rect.top}px`;
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;
        container.style.right = "auto";
        container.style.bottom = "auto";
      };
      this.resizeHandler = positionPanel;
      positionPanel();
      window.addEventListener("resize", positionPanel);
    }
    this.titleEl.setText("编辑节点内容");
    this.contentEl.addClass("mmc-node-edit-modal");
    const form = this.contentEl.createDiv({ cls: "mmc-node-edit-form" });
    form.createEl("p", {
      cls: "setting-item-description",
      text: "节点内容由可排序的文字块和图片块组成。可以只保留图片，也可以组合为图片→文字、文字→图片，或文字→图片→文字。"
    });

    let workingBlocks: MindMapContentBlock[] = JSON.parse(JSON.stringify(nodeContentBlocks(this.node))) as MindMapContentBlock[];
    if (!workingBlocks.length) workingBlocks = [{ id: newId(), type: "text", text: "新节点" }];
    let scheduleAutoSave: () => void = () => undefined;

    const actionRow = form.createDiv({ cls: "mmc-content-block-actions" });
    const blocksEl = form.createDiv({ cls: "mmc-content-block-list" });

    const cloneBlocks = (): MindMapContentBlock[] => JSON.parse(JSON.stringify(workingBlocks)) as MindMapContentBlock[];
    const validBlocks = (): MindMapContentBlock[] => cloneBlocks().filter((block) => block.type === "image" ? Boolean(block.source.trim()) : Boolean(block.text.trim()));

    const renderBlocks = (): void => {
      blocksEl.empty();
      workingBlocks.forEach((block, index) => {
        const card = blocksEl.createDiv({ cls: `mmc-content-block is-${block.type}` });
        const header = card.createDiv({ cls: "mmc-content-block-header" });
        header.createSpan({ cls: "mmc-content-block-title", text: block.type === "text" ? `文字块 ${index + 1}` : `图片块 ${index + 1}` });
        const controls = header.createDiv({ cls: "mmc-content-block-controls" });
        const control = (icon: string, title: string, action: () => void, disabled = false): void => {
          const btn = controls.createEl("button", { cls: "clickable-icon", attr: { type: "button", title, "aria-label": title } });
          setIcon(btn, icon); btn.disabled = disabled;
          btn.addEventListener("click", (event) => { event.preventDefault(); action(); });
        };
        control("arrow-up", "上移", () => { [workingBlocks[index - 1], workingBlocks[index]] = [workingBlocks[index]!, workingBlocks[index - 1]!]; renderBlocks(); scheduleAutoSave(); }, index === 0);
        control("arrow-down", "下移", () => { [workingBlocks[index + 1], workingBlocks[index]] = [workingBlocks[index]!, workingBlocks[index + 1]!]; renderBlocks(); scheduleAutoSave(); }, index === workingBlocks.length - 1);
        control("trash-2", "删除内容块", () => { workingBlocks.splice(index, 1); renderBlocks(); scheduleAutoSave(); });
        if (block.type === "text") {
          renderNodeRichTextEditor(
            card.createDiv({ cls: "mmc-content-block-body" }),
            block,
            scheduleAutoSave
          );
        } else {
          const body = card.createDiv({ cls: "mmc-content-block-body mmc-image-block-editor" });
          const preview = body.createDiv({ cls: "mmc-image-block-preview" });
          const refresh = (): void => {
            preview.empty();
            const resolved = this.callbacks.resolveImage(block.source);
            if (resolved) {
              const img = preview.createEl("img", { attr: { src: resolved, alt: block.alt || "图片" } });
              img.addEventListener("click", () => new ImagePreviewModal(this.app, resolved, block.alt || "图片").open());
            } else preview.createDiv({ cls: "mmc-image-placeholder", text: block.source ? "无法加载图片" : "尚未选择图片" });
            source.value = block.source;
            alt.value = block.alt ?? "";
          };
          const sourceLabel = body.createEl("label", { text: "图片路径或网址" });
          const source = sourceLabel.createEl("input", { type: "text", attr: { placeholder: "仓库路径、[[图片]] 或 https://..." } });
          const altLabel = body.createEl("label", { text: "图片说明（可选）" });
          const alt = altLabel.createEl("input", { type: "text", attr: { placeholder: "图片说明" } });
          source.addEventListener("input", () => {
            const next = source.value.trim();
            if (next !== block.source) {
              block.source = next;
              block.localSource = undefined;
              block.remoteSources = undefined;
            }
            refresh();
            scheduleAutoSave();
          });
          alt.addEventListener("input", () => { block.alt = alt.value.trim() || undefined; scheduleAutoSave(); });
          const actions = body.createDiv({ cls: "mmc-image-block-actions" });
          const local = actions.createEl("button", { text: "保存到仓库", attr: { type: "button" } });
          const applyImageAction = (action: Promise<boolean>): void => {
            void action.then((changed) => {
              if (!changed) return;
              refresh();
              scheduleAutoSave();
            });
          };
          local.addEventListener("click", () => {
            applyImageAction(selectNodeImage(this.app, block, "local", this.callbacks));
          });
          const remote = actions.createEl("button", { text: "选择文件并上传", attr: { type: "button" } });
          remote.addEventListener("click", () => {
            applyImageAction(selectNodeImage(this.app, block, "remote", this.callbacks));
          });
          if (block.localSource || (block.source && !/^https?:\/\//i.test(block.source))) {
            const uploadCurrent = actions.createEl("button", { text: "上传当前图片", attr: { type: "button" } });
            uploadCurrent.addEventListener("click", () => {
              applyImageAction(uploadCurrentNodeImage(this.app, block, this.callbacks));
            });
          }
          if (block.remoteSources?.length) {
            const mirrors = body.createDiv({ cls: "mms-image-mirrors" });
            mirrors.createSpan({ cls: "mms-image-mirrors-label", text: "远程镜像：" });
            block.remoteSources.forEach((item, mirrorIndex) => {
              const link = mirrors.createEl("a", {
                text: item.hostName || `图床 ${mirrorIndex + 1}`,
                href: item.url,
                attr: { target: "_blank", rel: "noopener" }
              });
              link.addEventListener("click", (event) => event.stopPropagation());
            });
          }
          refresh();
        }
      });
      if (!workingBlocks.length) blocksEl.createDiv({ cls: "mmc-empty-content-hint", text: "当前没有内容块。请添加文字或图片。" });
    };

    const addText = actionRow.createEl("button", { text: "+ 文字", attr: { type: "button" } });
    addText.addEventListener("click", () => { workingBlocks.push({ id: newId(), type: "text", text: "" }); renderBlocks(); scheduleAutoSave(); });
    const addImage = actionRow.createEl("button", { text: "+ 图片", attr: { type: "button" } });
    addImage.addEventListener("click", () => { workingBlocks.push({ id: newId(), type: "image", source: "" }); renderBlocks(); scheduleAutoSave(); });
    renderBlocks();
    if (this.position === "right" && this.panelHost) {
      this.externalNodeHandler = (event: Event): void => {
        const detail = (event as CustomEvent<{ nodeId?: string }>).detail;
        if (detail?.nodeId !== this.node.id) return;
        workingBlocks = JSON.parse(JSON.stringify(nodeContentBlocks(this.node))) as MindMapContentBlock[];
        renderBlocks();
      };
      this.panelHost.addEventListener("mms-inline-node-change", this.externalNodeHandler);
    }

    const detailsGrid = form.createDiv({ cls: "mmc-form-grid" });
    const iconLabel = detailsGrid.createEl("label", { text: "图标或 Emoji" });
    const iconInput = iconLabel.createEl("input", { type: "text", attr: { placeholder: "例如 💡" } });
    iconInput.value = this.node.icon ?? "";
    const taskLabel = detailsGrid.createEl("label", { text: "任务状态" });
    const taskSelect = taskLabel.createEl("select");
    for (const [value, label] of [["", "无"], ["todo", "待办"], ["doing", "进行中"], ["done", "已完成"]] as const) taskSelect.createEl("option", { text: label, attr: { value } });
    taskSelect.value = this.node.task ?? "";
    const shapeLabel = detailsGrid.createEl("label", { text: "节点形状" });
    const shapeSelect = shapeLabel.createEl("select");
    for (const [value, label] of [["rounded", "圆角"], ["pill", "胶囊"], ["rectangle", "直角"]] as const) shapeSelect.createEl("option", { text: label, attr: { value } });
    shapeSelect.value = this.node.style?.shape ?? this.defaultShape;
    const tagsLabel = detailsGrid.createEl("label", { text: "标签（逗号分隔）" });
    const tagsInput = tagsLabel.createEl("input", { type: "text" });
    tagsInput.value = this.node.tags?.join(", ") ?? "";

    const numberingLabel = detailsGrid.createEl("label", {
      cls: "mmc-checkbox-label mmc-article-numbering-option",
    });
    const numberingInput = numberingLabel.createEl("input", { type: "checkbox" });
    numberingInput.checked = this.node.skipArticleNumbering === true;
    numberingLabel.createSpan({ text: "文章模式不自动编号（前言、注释等）" });

    const styleGrid = form.createDiv({ cls: "mmc-form-grid mmc-style-grid" });
    const colorControl = (labelText: string, current: string | undefined, fallback: string): [HTMLInputElement, HTMLInputElement] => {
      const label = styleGrid.createEl("label", { text: labelText });
      const row = label.createDiv({ cls: "mmc-color-row" });
      const toggle = row.createEl("input", { type: "checkbox" });
      const color = row.createEl("input", { type: "color" });
      toggle.checked = Boolean(current); color.value = current ?? fallback; color.disabled = !toggle.checked;
      toggle.addEventListener("change", () => { color.disabled = !toggle.checked; scheduleAutoSave(); });
      color.addEventListener("change", scheduleAutoSave);
      return [toggle, color];
    };
    const [colorToggle, colorInput] = colorControl("节点颜色", this.node.style?.color, "#4f46e5");
    const [textColorToggle, textColorInput] = colorControl("整节点文字颜色", this.node.style?.textColor, "#ffffff");
    const [borderColorToggle, borderColorInput] = colorControl("边框颜色", this.node.style?.borderColor, "#94a3b8");
    const numberControl = (labelText: string, current: number | undefined, min: number, max: number, step: number): HTMLInputElement => {
      const label = styleGrid.createEl("label", { text: labelText });
      const input = label.createEl("input", { type: "number", attr: { min: String(min), max: String(max), step: String(step), placeholder: "跟随默认" } });
      input.value = current?.toString() ?? ""; return input;
    };
    const borderWidthInput = numberControl("边框粗细", this.node.style?.borderWidth, 0, 6, .5);
    const fontSizeInput = numberControl("字号", this.node.style?.fontSize, 10, 32, 1);
    const widthInput = numberControl("节点宽度（100–900）", this.node.style?.width, 100, 900, 10);
    widthInput.placeholder = "自动宽度";
    const minHeightInput = numberControl("节点最小高度（36–600）", this.node.style?.minHeight, 36, 600, 10);
    minHeightInput.placeholder = "自动高度";
    const alignLabel = styleGrid.createEl("label", { text: "文字对齐" });
    const alignSelect = alignLabel.createEl("select");
    alignSelect.createEl("option", { text: "跟随全局", attr: { value: "inherit" } });
    alignSelect.createEl("option", { text: "左对齐", attr: { value: "left" } });
    alignSelect.createEl("option", { text: "居中", attr: { value: "center" } });
    alignSelect.createEl("option", { text: "右对齐", attr: { value: "right" } });
    alignSelect.value = this.node.style?.textAlign ?? "inherit";
    const booleanControl = (labelText: string, current: boolean | undefined): HTMLSelectElement => {
      const label = styleGrid.createEl("label", { text: labelText });
      const select = label.createEl("select");
      select.createEl("option", { text: "跟随默认", attr: { value: "inherit" } });
      select.createEl("option", { text: "开启", attr: { value: "true" } });
      select.createEl("option", { text: "关闭", attr: { value: "false" } });
      select.value = current === undefined ? "inherit" : current ? "true" : "false"; return select;
    };
    const boldInput = booleanControl("整节点加粗", this.node.style?.bold);
    const italicInput = booleanControl("整节点斜体", this.node.style?.italic);
    const underlineInput = booleanControl("整节点下划线", this.node.style?.underline);

    const noteLabel = form.createEl("label", { text: "备注（可选）" });
    const noteInput = noteLabel.createEl("textarea"); noteInput.value = this.node.note ?? ""; noteInput.rows = 4;
    const linkLabel = form.createEl("label", { text: "链接（网址、笔记名或 [[双链]]）" });
    const linkInput = linkLabel.createEl("input", { type: "text" }); linkInput.value = this.node.link ?? "";

    const parseBool = (value: string): boolean | undefined => value === "true" ? true : value === "false" ? false : undefined;
    const parseNumber = (value: string, min: number, max: number): number | undefined => value.trim() && Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : undefined;
    const collectValues = (showNotice: boolean): NodeEditValues | null => {
      const content = validBlocks();
      if (!content.length) { if (showNotice) new Notice("节点至少需要一个文字块或图片块"); return null; }
      const task = taskSelect.value;
      const shape = shapeSelect.value;
      return {
        content,
        note: noteInput.value.trim(), link: linkInput.value.trim(), icon: iconInput.value.trim().slice(0, 12),
        tags: Array.from(new Set(tagsInput.value.split(/[,，]/).map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean))).slice(0, 12),
        task: task === "todo" || task === "doing" || task === "done" ? task : undefined,
        skipArticleNumbering: numberingInput.checked || undefined,
        color: colorToggle.checked ? colorInput.value : undefined,
        textColor: textColorToggle.checked ? textColorInput.value : undefined,
        borderColor: borderColorToggle.checked ? borderColorInput.value : undefined,
        borderWidth: parseNumber(borderWidthInput.value, 0, 6),
        shape: shape === "pill" || shape === "rectangle" || shape === "rounded" ? shape : undefined,
        bold: parseBool(boldInput.value), italic: parseBool(italicInput.value), underline: parseBool(underlineInput.value),
        fontSize: parseNumber(fontSizeInput.value, 10, 32),
        textAlign: alignSelect.value === "left" || alignSelect.value === "right" || alignSelect.value === "center" ? alignSelect.value : undefined,
        width: parseNumber(widthInput.value, 100, 900),
        minHeight: parseNumber(minHeightInput.value, 36, 600)
      };
    };

    let timer: number | null = null;
    let last = JSON.stringify(collectValues(false));
    const saveNow = (mode: "autosave" | "commit", showNotice = false): boolean => {
      if (timer !== null) { window.clearTimeout(timer); timer = null; }
      const values = collectValues(showNotice); if (!values) return false;
      const signature = JSON.stringify(values);
      if (signature !== last) { this.submit(values, mode); last = signature; }
      return true;
    };
    scheduleAutoSave = (): void => { if (timer !== null) window.clearTimeout(timer); timer = window.setTimeout(() => saveNow("autosave"), 280); };
    this.saveOnClose = () => { saveNow("commit"); };

    [iconInput, taskSelect, shapeSelect, tagsInput, numberingInput, borderWidthInput, fontSizeInput, widthInput, minHeightInput, alignSelect, boldInput, italicInput, underlineInput, noteInput, linkInput]
      .forEach((input) => { input.addEventListener("input", scheduleAutoSave); input.addEventListener("change", scheduleAutoSave); });

    const buttons = form.createDiv({ cls: "mmc-form-actions" });
    const closeButton = buttons.createEl("button", { cls: "mod-cta", text: "保存并关闭", attr: { type: "button" } });
    closeButton.addEventListener("click", () => { if (saveNow("commit", true)) { this.closeWithoutFlush = true; this.close(); } });

    this.outsidePointerHandler = (event: PointerEvent): void => {
      if (this.modalEl.contains(event.target as Node)) return;
      if (this.position === "right" && event.target instanceof HTMLElement && event.target.closest(".mmc-node")) return;
      this.saveOnClose?.(); this.closeWithoutFlush = true; this.close();
    };
    window.setTimeout(() => document.addEventListener("pointerdown", this.outsidePointerHandler!, true), 0);
  }

  /**
   * 在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。
   */
  onClose(): void {
    if (!this.closeWithoutFlush) this.saveOnClose?.();
    if (this.outsidePointerHandler) document.removeEventListener("pointerdown", this.outsidePointerHandler, true);
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    if (this.externalNodeHandler && this.panelHost) {
      this.panelHost.removeEventListener("mms-inline-node-change", this.externalNodeHandler);
    }
    this.contentEl.empty();
  }

  /**
   * 右侧面板与画布快速输入并存时，释放 Modal 的全局按键作用域。
   */
  releaseKeyboardScope(): void {
    this.app.keymap.popScope(this.scope);
  }
}

/**
 * AppearanceModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class AppearanceModal extends Modal {
  private readonly appearance: MindMapAppearance;
  private readonly submit: (appearance: MindMapAppearance) => void;
  private readonly reset: () => void;

  /**
   * 创建 AppearanceModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param appearance 导图外观配置。
   * @param submit 该参数用于 constructor 流程中的输入或控制。
   * @param reset 该参数用于 constructor 流程中的输入或控制。
   */
  constructor(app: App, appearance: MindMapAppearance, submit: (appearance: MindMapAppearance) => void, reset: () => void) {
    super(app);
    this.appearance = appearance;
    this.submit = submit;
    this.reset = reset;
  }

  /**
   * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
   */
  onOpen(): void {
    this.titleEl.setText("当前脑图外观");
    this.contentEl.addClass("mmc-appearance-modal");
    const form = this.contentEl.createEl("form");
    form.createEl("p", { cls: "setting-item-description", text: "先选择一套主题，再按需要修改背景、节点、字体和连线。设置只保存到当前 .mindmap 文件。" });

    let selectedPreset: MindMapThemePresetId = this.appearance.themePreset ?? "classic-indigo";
    const themeSection = form.createDiv({ cls: "mmc-theme-picker" });
    themeSection.createDiv({ cls: "mmc-theme-picker-title", text: "主题模板" });
    const themeGrid = themeSection.createDiv({ cls: "mmc-theme-card-grid" });
    const themeCards = new Map<MindMapThemePresetId, HTMLButtonElement>();

    const grid = form.createDiv({ cls: "mmc-form-grid mmc-appearance-grid" });
    const addColor = (labelText: string, value: string | undefined, fallback: string): { toggle: HTMLInputElement; input: HTMLInputElement } => {
      const label = grid.createEl("label", { text: labelText });
      const row = label.createDiv({ cls: "mmc-color-row" });
      const toggle = row.createEl("input", { type: "checkbox" });
      const input = row.createEl("input", { type: "color" });
      toggle.checked = Boolean(value);
      input.value = value ?? fallback;
      input.disabled = !toggle.checked;
      toggle.addEventListener("change", () => { input.disabled = !toggle.checked; });
      return { toggle, input };
    };

    const background = addColor("背景颜色", this.appearance.backgroundColor, "#f8fafc");
    const patternLabel = grid.createEl("label", { text: "背景图案" });
    const patternSelect = patternLabel.createEl("select");
    for (const [value, label] of [["none", "无"], ["grid", "网格"], ["dots", "点阵"]] as const) patternSelect.createEl("option", { text: label, attr: { value } });
    patternSelect.value = this.appearance.backgroundPattern ?? "grid";
    const patternColor = addColor("图案颜色", this.appearance.patternColor, "#94a3b8");

    const fontLabel = grid.createEl("label", { text: "字体" });
    const fontSelect = fontLabel.createEl("select");
    for (const [value, label] of [["obsidian", "跟随 Obsidian"], ["sans", "无衬线"], ["serif", "衬线"], ["mono", "等宽"], ["custom", "自定义"]] as const) fontSelect.createEl("option", { text: label, attr: { value } });
    fontSelect.value = this.appearance.fontFamily ?? "obsidian";
    const customFontLabel = grid.createEl("label", { text: "自定义字体名称" });
    const customFontInput = customFontLabel.createEl("input", { type: "text", attr: { placeholder: "Microsoft YaHei" } });
    customFontInput.value = this.appearance.customFont ?? "";
    const updateCustomFont = (): void => { customFontInput.disabled = fontSelect.value !== "custom"; };
    fontSelect.addEventListener("change", updateCustomFont);
    updateCustomFont();

    const fontSizeLabel = grid.createEl("label", { text: "字号（10–30）" });
    const fontSizeInput = fontSizeLabel.createEl("input", { type: "number", attr: { min: "10", max: "30", step: "1" } });
    fontSizeInput.value = String(this.appearance.fontSize ?? 14);
    const nodeVisualStyleLabel = grid.createEl("label", { text: "节点视觉样式" });
    const nodeVisualStyleSelect = nodeVisualStyleLabel.createEl("select");
    nodeVisualStyleSelect.createEl("option", { text: "卡片节点", attr: { value: "card" } });
    nodeVisualStyleSelect.createEl("option", { text: "圆角分支", attr: { value: "branch" } });
    nodeVisualStyleSelect.value = this.appearance.nodeVisualStyle ?? "card";
    const nodeTextAlignLabel = grid.createEl("label", { text: "节点文字对齐" });
    const nodeTextAlignSelect = nodeTextAlignLabel.createEl("select");
    nodeTextAlignSelect.createEl("option", { text: "左对齐", attr: { value: "left" } });
    nodeTextAlignSelect.createEl("option", { text: "居中", attr: { value: "center" } });
    nodeTextAlignSelect.createEl("option", { text: "右对齐", attr: { value: "right" } });
    nodeTextAlignSelect.value = this.appearance.nodeTextAlign ?? "center";

    const rootColor = addColor("中心主题颜色", this.appearance.rootColor, "#4f46e5");
    const rootTextColor = addColor("中心主题文字", this.appearance.rootTextColor, "#ffffff");
    const nodeColor = addColor("节点背景色", this.appearance.nodeColor, "#ffffff");
    const textColor = addColor("文字颜色", this.appearance.textColor, "#0f172a");
    const borderColor = addColor("节点边框颜色", this.appearance.nodeBorderColor, "#94a3b8");
    const borderWidthLabel = grid.createEl("label", { text: "边框粗细（0–6）" });
    const borderWidthInput = borderWidthLabel.createEl("input", { type: "number", attr: { min: "0", max: "6", step: "0.5" } });
    borderWidthInput.value = String(this.appearance.nodeBorderWidth ?? 1);

    const edgeColor = addColor("连线颜色", this.appearance.edgeColor, "#7c8aa5");
    const edgeStyleLabel = grid.createEl("label", { text: "连线类型" });
    const edgeStyleSelect = edgeStyleLabel.createEl("select");
    for (const [value, label] of [["curved", "曲线"], ["straight", "直线"], ["elbow", "折线"]] as const) edgeStyleSelect.createEl("option", { text: label, attr: { value } });
    edgeStyleSelect.value = this.appearance.edgeStyle ?? "curved";

    const edgeWidthModeLabel = grid.createEl("label", { text: "连线粗细模式" });
    const edgeWidthModeSelect = edgeWidthModeLabel.createEl("select");
    edgeWidthModeSelect.createEl("option", { text: "统一粗细", attr: { value: "uniform" } });
    edgeWidthModeSelect.createEl("option", { text: "从粗到细", attr: { value: "tapered" } });
    edgeWidthModeSelect.value = this.appearance.edgeWidthMode ?? "tapered";

    const edgeWidthLabel = grid.createEl("label", { text: "起始粗细（0.5–8）" });
    const edgeWidthInput = edgeWidthLabel.createEl("input", { type: "number", attr: { min: "0.5", max: "8", step: "0.25" } });
    edgeWidthInput.value = String(this.appearance.edgeWidth ?? 4.2);
    const edgeMinWidthLabel = grid.createEl("label", { text: "末端最细（0.25–4）" });
    const edgeMinWidthInput = edgeMinWidthLabel.createEl("input", { type: "number", attr: { min: "0.25", max: "4", step: "0.25" } });
    edgeMinWidthInput.value = String(this.appearance.edgeMinWidth ?? 1.2);
    const updateEdgeMin = (): void => {
      const tapered = edgeWidthModeSelect.value === "tapered";
      edgeMinWidthInput.disabled = !tapered;
      edgeMinWidthLabel.toggleClass("is-disabled", !tapered);
      edgeWidthLabel.childNodes[0]!.textContent = tapered ? "起始粗细（0.5–8）" : "连线粗细（0.5–8）";
    };
    edgeWidthModeSelect.addEventListener("change", updateEdgeMin);
    updateEdgeMin();

    const branchLabel = grid.createEl("label", { text: "彩色分支" });
    const branchToggleRow = branchLabel.createDiv({ cls: "mmc-toggle-row" });
    const colorfulBranches = branchToggleRow.createEl("input", { type: "checkbox" });
    colorfulBranches.checked = this.appearance.colorfulBranches === true;
    branchToggleRow.createSpan({ text: "按一级分支循环配色" });
    const branchColorsLabel = grid.createEl("label", { text: "分支颜色（逗号分隔）" });
    const branchColorsInput = branchColorsLabel.createEl("textarea", { attr: { rows: "2", placeholder: "#4f46e5, #0284c7, #0f766e" } });
    branchColorsInput.value = (this.appearance.branchColors ?? []).join(", ");

    const textStyleSection = form.createDiv({ cls: "mmc-appearance-text-style" });
    textStyleSection.createDiv({ cls: "mmc-appearance-text-style-title", text: "文字样式" });
    const textStyle = textStyleSection.createDiv({ cls: "mmc-appearance-style-options" });
    const addCheck = (text: string, checked: boolean): HTMLInputElement => {
      const label = textStyle.createEl("label", { cls: "mmc-appearance-style-option" });
      const input = label.createEl("input", { type: "checkbox" });
      input.checked = checked;
      label.createSpan({ text });
      return input;
    };
    const bold = addCheck("文字加粗", this.appearance.bold === true);
    const italic = addCheck("文字斜体", this.appearance.italic === true);
    const underline = addCheck("文字下划线", this.appearance.underline === true);

    const setColor = (control: { toggle: HTMLInputElement; input: HTMLInputElement }, value: string | undefined, fallback: string): void => {
      control.toggle.checked = Boolean(value);
      control.input.value = value ?? fallback;
      control.input.disabled = !control.toggle.checked;
    };
    const updateSelectedCards = (): void => {
      for (const [id, card] of themeCards) card.toggleClass("is-selected", id === selectedPreset);
    };
    const applyPreset = (presetId: MindMapThemePresetId): void => {
      selectedPreset = presetId;
      const appearance = appearanceFromThemePreset(presetId);
      setColor(background, appearance.backgroundColor, "#f8fafc");
      patternSelect.value = appearance.backgroundPattern ?? "none";
      setColor(patternColor, appearance.patternColor, "#94a3b8");
      fontSelect.value = appearance.fontFamily ?? "obsidian";
      customFontInput.value = appearance.customFont ?? "";
      fontSizeInput.value = String(appearance.fontSize ?? 14);
      nodeTextAlignSelect.value = appearance.nodeTextAlign ?? "center";
      setColor(rootColor, appearance.rootColor, "#4f46e5");
      setColor(rootTextColor, appearance.rootTextColor, "#ffffff");
      setColor(nodeColor, appearance.nodeColor, "#ffffff");
      setColor(textColor, appearance.textColor, "#0f172a");
      setColor(borderColor, appearance.nodeBorderColor, "#94a3b8");
      borderWidthInput.value = String(appearance.nodeBorderWidth ?? 1);
      setColor(edgeColor, appearance.edgeColor, "#7c8aa5");
      edgeStyleSelect.value = appearance.edgeStyle ?? "curved";
      edgeWidthModeSelect.value = appearance.edgeWidthMode ?? "uniform";
      edgeWidthInput.value = String(appearance.edgeWidth ?? 2.2);
      edgeMinWidthInput.value = String(appearance.edgeMinWidth ?? 1);
      colorfulBranches.checked = appearance.colorfulBranches === true;
      branchColorsInput.value = (appearance.branchColors ?? []).join(", ");
      bold.checked = appearance.bold === true;
      italic.checked = appearance.italic === true;
      underline.checked = appearance.underline === true;
      updateCustomFont();
      updateEdgeMin();
      updateSelectedCards();
    };

    for (const preset of MINDMAP_THEME_PRESETS) {
      const card = themeGrid.createEl("button", { cls: "mmc-theme-card", attr: { type: "button", title: preset.description } });
      themeCards.set(preset.id, card);
      const preview = card.createDiv({ cls: "mmc-theme-card-preview" });
      preview.style.backgroundColor = preset.appearance.backgroundColor ?? "#ffffff";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 112 44");
      svg.setAttribute("aria-hidden", "true");
      const colors = preset.appearance.branchColors ?? [preset.appearance.edgeColor ?? "#7c8aa5"];
      const rootColorValue = preset.appearance.rootColor ?? "#4f46e5";
      const rootNode = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rootNode.setAttribute("x", "8");
      rootNode.setAttribute("y", "15");
      rootNode.setAttribute("width", "32");
      rootNode.setAttribute("height", "14");
      rootNode.setAttribute("rx", "5");
      rootNode.setAttribute("fill", rootColorValue);
      svg.appendChild(rootNode);
      [8, 19, 30].forEach((y, index) => {
        const color = colors[index % colors.length] ?? rootColorValue;
        const edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
        edge.setAttribute("d", `M 40 22 C 51 22, 50 ${y + 3}, 61 ${y + 3} L 70 ${y + 3}`);
        edge.setAttribute("fill", "none");
        edge.setAttribute("stroke", color);
        edge.setAttribute("stroke-width", index === 0 ? "2.6" : "2");
        edge.setAttribute("stroke-linecap", "round");
        svg.appendChild(edge);
        const childNode = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        childNode.setAttribute("x", "70");
        childNode.setAttribute("y", String(y));
        childNode.setAttribute("width", String(31 - index * 3));
        childNode.setAttribute("height", "7");
        childNode.setAttribute("rx", "3");
        childNode.setAttribute("fill", color);
        childNode.setAttribute("fill-opacity", ".22");
        childNode.setAttribute("stroke", color);
        childNode.setAttribute("stroke-width", ".8");
        svg.appendChild(childNode);
      });
      preview.appendChild(svg);
      card.createDiv({ cls: "mmc-theme-card-name", text: preset.name });
      card.addEventListener("click", () => applyPreset(preset.id));
    }
    updateSelectedCards();

    const clamp = (value: string, min: number, max: number, fallback: number): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    };
    const parseBranchColors = (): string[] => branchColorsInput.value
      .split(/[,，\s]+/)
      .map((value) => value.trim())
      .filter((value) => /^#[0-9a-f]{6}$/i.test(value))
      .slice(0, 12);

    const actions = form.createDiv({ cls: "mmc-modal-actions" });
    const reset = actions.createEl("button", { text: "恢复全局默认", type: "button" });
    const cancel = actions.createEl("button", { text: "取消", type: "button" });
    const save = actions.createEl("button", { text: "应用", type: "submit", cls: "mod-cta" });
    reset.addEventListener("click", () => { this.reset(); this.close(); });
    cancel.addEventListener("click", () => this.close());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const maxWidth = clamp(edgeWidthInput.value, 0.5, 8, 4.2);
      this.submit({
        themePreset: selectedPreset,
        backgroundColor: background.toggle.checked ? background.input.value : undefined,
        backgroundPattern: patternSelect.value as BackgroundPattern,
        patternColor: patternColor.toggle.checked ? patternColor.input.value : undefined,
        fontFamily: fontSelect.value as FontFamilyMode,
        customFont: fontSelect.value === "custom" ? customFontInput.value.trim().slice(0, 120) || undefined : undefined,
        fontSize: clamp(fontSizeInput.value, 10, 30, 14),
        nodeVisualStyle: nodeVisualStyleSelect.value as "card" | "branch",
        nodeTextAlign: nodeTextAlignSelect.value as NodeTextAlign,
        rootColor: rootColor.toggle.checked ? rootColor.input.value : undefined,
        rootTextColor: rootTextColor.toggle.checked ? rootTextColor.input.value : undefined,
        nodeColor: nodeColor.toggle.checked ? nodeColor.input.value : undefined,
        textColor: textColor.toggle.checked ? textColor.input.value : undefined,
        nodeBorderColor: borderColor.toggle.checked ? borderColor.input.value : undefined,
        nodeBorderWidth: clamp(borderWidthInput.value, 0, 6, 1),
        edgeColor: edgeColor.toggle.checked ? edgeColor.input.value : undefined,
        edgeWidth: maxWidth,
        edgeStyle: edgeStyleSelect.value as EdgeStyle,
        edgeWidthMode: edgeWidthModeSelect.value as EdgeWidthMode,
        edgeMinWidth: Math.min(maxWidth, clamp(edgeMinWidthInput.value, 0.25, 4, 1.2)),
        colorfulBranches: colorfulBranches.checked,
        branchColors: parseBranchColors(),
        bold: bold.checked,
        italic: italic.checked,
        underline: underline.checked
      });
      this.close();
    });
    window.setTimeout(() => save.focus(), 20);
  }
}

/**
 * MindMapEditor 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class MindMapEditor {
  private readonly app: App;
  private readonly host: HTMLElement;
  private readonly callbacks: MindMapEditorCallbacks;
  private options: MindMapEditorOptions;
  private rootEl!: HTMLDivElement;
  private toolbarEl!: HTMLDivElement;
  private navigationBarEl!: HTMLDivElement;
  private canvasBreadcrumbEl!: HTMLDivElement;
  private viewportEl!: HTMLDivElement;
  private outlineEl!: HTMLDivElement;
  private articleEl!: HTMLDivElement;
  private sceneEl!: HTMLDivElement;
  private nodesLayerEl!: HTMLDivElement;
  private edgesSvg!: SVGSVGElement;
  private statusEl!: HTMLSpanElement;
  private zoomStatusEl!: HTMLSpanElement;
  private lockButton!: HTMLButtonElement;
  private articleLandingButton!: HTMLButtonElement;
  private articleStyleButton!: HTMLButtonElement;
  private readonly modeButtons = new Map<DisplayMode, HTMLButtonElement>();
  private readonly editControls: HTMLElement[] = [];
  private document: MindMapDocument;
  private layout: LayoutResult;
  private selectedId: string;
  private readonly selectedIds = new Set<string>();
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private history: string[] = [];
  private future: string[] = [];
  private draggingId: string | null = null;
  private dragDropPosition: NodeDropPosition | null = null;
  private dropPreviewEl: HTMLElement | null = null;
  private panning = false;
  private panStart = { x: 0, y: 0, panX: 0, panY: 0 };
  private cleanupCallbacks: Array<() => void> = [];
  private resizeObserver: ResizeObserver | null = null;
  private branchClipboard: MindMapNode | null = null;
  private searchQuery = "";
  private currentMode: DisplayMode;
  private readOnly: boolean;
  private readonly imageLoadTimers = new Set<number>();
  private inlineEditingId: string | null = null;
  private articleNavigationIndex: number | null = null;
  private readingProgressTimer: number | null = null;

  /**
   * 创建 MindMapEditor 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param host 当前图床配置或图床选择项。
   * @param document 要处理的思维导图文档。
   * @param callbacks 编辑器向视图层发送事件的一组回调。
   * @param options 控制当前操作行为的可选配置。
   */
  constructor(app: App, host: HTMLElement, document: MindMapDocument, callbacks: MindMapEditorCallbacks, options: MindMapEditorOptions) {
    this.app = app;
    this.host = host;
    this.callbacks = callbacks;
    this.options = options;
    this.document = cloneDocument(document);
    this.currentMode = this.resolveMode(options.defaultViewMode);
    this.readOnly = this.currentMode === "article" || this.currentMode === "reading" || this.document.view?.readOnly === true;
    this.selectedId = this.document.root.id;
    const initialAppearance = this.getAppearance();
    this.layout = computeLayout(this.document.root, this.document.layout, initialAppearance.fontSize ?? 14, initialAppearance.nodeVisualStyle ?? "card", initialAppearance);
    this.buildUi();
    this.render();
    if (this.options.autoFitOnOpen) window.setTimeout(() => this.fitToView(), 50);
  }

  /**
   * 执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  destroy(): void {
    this.clearImageLoadTimers();
    if (this.readingProgressTimer !== null) window.clearTimeout(this.readingProgressTimer);
    this.cleanupCallbacks.forEach((callback) => callback());
    this.cleanupCallbacks = [];
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.host.empty();
  }

  /**
   * 更新并应用document，并保持模型、界面和持久化状态的一致性。
   *
   * @param document 要处理的思维导图文档。
   * @param resetHistory 该参数用于 set document 流程中的输入或控制。
   */
  setDocument(document: MindMapDocument, resetHistory = true): void {
    this.document = cloneDocument(document);
    this.currentMode = this.resolveMode(this.options.defaultViewMode);
    this.readOnly = this.currentMode === "article" || this.currentMode === "reading" || this.document.view?.readOnly === true;
    this.selectedId = this.document.root.id;
    if (resetHistory) {
      this.history = [];
      this.future = [];
    }
    this.render();
    if (this.options.autoFitOnOpen) window.setTimeout(() => this.fitToView(), 20);
  }

  /**
   * 更新并应用options，并保持模型、界面和持久化状态的一致性。
   *
   * @param options 控制当前操作行为的可选配置。
   */
  setOptions(options: MindMapEditorOptions): void {
    const modesChanged = JSON.stringify(this.options.visibleModes) !== JSON.stringify(options.visibleModes);
    const toolbarChanged = JSON.stringify(this.options.visibleToolbarItems) !== JSON.stringify(options.visibleToolbarItems)
      || JSON.stringify(this.options.toolbarItemOrder) !== JSON.stringify(options.toolbarItemOrder);
    const globalModeChanged = this.options.defaultViewMode !== options.defaultViewMode;
    const navigationChanged = JSON.stringify(this.options.articleNavigation) !== JSON.stringify(options.articleNavigation);
    if (navigationChanged) this.articleNavigationIndex = null;
    this.options = options;
    const resolved = this.resolveMode(globalModeChanged ? options.defaultViewMode : this.currentMode);
    if (resolved !== this.currentMode) {
      const previousMode = this.currentMode;
      this.currentMode = resolved;
      this.readOnly = resolved === "article" || resolved === "reading"
        ? true
          : previousMode === "article" || previousMode === "reading"
          ? this.document.view?.readOnly === true
          : this.readOnly;
    }
    if (modesChanged || toolbarChanged) {
      this.cleanupCallbacks.forEach((callback) => callback());
      this.cleanupCallbacks = [];
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.modeButtons.clear();
      this.editControls.splice(0);
      this.buildUi();
    }
    if (this.inlineEditingId && !modesChanged && !toolbarChanged && !globalModeChanged) return;
    this.render();
  }

  /**
   * 更新并应用display mode，并保持模型、界面和持久化状态的一致性。
   *
   * @param mode 当前布局或显示模式。
   * @param notifyGlobal 该参数用于 set display mode 流程中的输入或控制。
   */
  setDisplayMode(mode: DisplayMode, notifyGlobal = true): void {
    if (!this.options.visibleModes.includes(mode)) return;
    const previousMode = this.currentMode;
    this.currentMode = mode;
    if ((mode === "article" || mode === "reading") && mode !== previousMode) {
      this.readOnly = true;
    } else if ((previousMode === "article" || previousMode === "reading") && mode !== "article" && mode !== "reading") {
      this.readOnly = this.document.view?.readOnly === true;
    }
    this.render();
    if (notifyGlobal) void this.callbacks.onDisplayModeChange(mode);
    if (mode === "mindmap" && this.options.autoFitOnOpen) window.setTimeout(() => this.fitToView(), 20);
  }

  /**
   * 应用global display mode，并保持模型、界面和持久化状态的一致性。
   *
   * @param mode 当前布局或显示模式。
   */
  applyGlobalDisplayMode(mode: DisplayMode): void {
    this.setDisplayMode(mode, false);
  }

  /**
   * 切换read only，并保持模型、界面和持久化状态的一致性。
   */
  toggleReadOnly(): void {
    this.readOnly = !this.readOnly;
    if (this.currentMode !== "article" && this.currentMode !== "reading") this.persistReadOnlyState();
    this.render();
    new Notice(this.readOnly ? "已进入只读模式" : "已进入编辑模式");
  }

  /**
   * 读取并返回document，并保持模型、界面和持久化状态的一致性。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  getDocument(): MindMapDocument {
    return cloneDocument(this.document);
  }

  /**
   * 执行“mark saved”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  markSaved(): void {
    this.statusEl.setText("已保存");
    this.rootEl.removeClass("is-dirty");
  }

  /**
   * 执行“mark saving”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  markSaving(): void {
    this.statusEl.setText("保存中…");
    this.rootEl.addClass("is-dirty");
  }

  /**
   * 定位相关数据，并保持模型、界面和持久化状态的一致性。
   */
  focus(): void {
    this.rootEl.focus();
  }

  /**
   * 定位node by id，并保持模型、界面和持久化状态的一致性。
   *
   * @param id 目标对象或节点的稳定标识。
   */
  focusNodeById(id: string): void {
    if (!findNode(this.document.root, id)) return;
    const navigationIndex = this.options.articleNavigation?.entries.findIndex((entry) => entry.nodeId === id) ?? -1;
    if (navigationIndex >= 0) this.articleNavigationIndex = navigationIndex;
    this.focusNode(id);
  }

  /**
   * Switches the current top-level document to its generated article directory.
   */
  showArticleDirectory(): void {
    this.currentMode = "article";
    this.mutate(() => {
      this.document.view = { ...(this.document.view ?? {}), articleLandingMode: "toc" };
    });
  }

  /**
   * 构建ui，并保持模型、界面和持久化状态的一致性。
   */
  private buildUi(): void {
    this.host.empty();
    this.rootEl = this.host.createDiv({ cls: "mmc-editor" });
    this.rootEl.tabIndex = 0;
    this.toolbarEl = this.rootEl.createDiv({ cls: "mmc-toolbar" });
    this.navigationBarEl = this.rootEl.createDiv({ cls: "mmc-parent-navigation" });
    this.viewportEl = this.rootEl.createDiv({ cls: "mmc-viewport" });
    this.canvasBreadcrumbEl = this.viewportEl.createDiv({ cls: "mmc-canvas-breadcrumb is-hidden" });
    this.sceneEl = this.viewportEl.createDiv({ cls: "mmc-scene" });
    this.edgesSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.edgesSvg.classList.add("mmc-edges");
    this.sceneEl.appendChild(this.edgesSvg);
    this.nodesLayerEl = this.sceneEl.createDiv({ cls: "mmc-nodes-layer" });
    this.outlineEl = this.rootEl.createDiv({ cls: "mms-outline-view" });
    this.articleEl = this.rootEl.createDiv({ cls: "mms-article-view" });

    const modeGroup = this.toolbarEl.createDiv({ cls: "mms-mode-switcher" });
    for (const mode of this.options.visibleModes) {
      const button = modeGroup.createEl("button", {
        cls: "mms-mode-button",
        attr: { type: "button", title: `${DISPLAY_MODE_LABELS[mode]}模式` }
      });
      setIcon(button, DISPLAY_MODE_ICONS[mode]);
      button.createSpan({ text: DISPLAY_MODE_LABELS[mode] });
      button.addEventListener("click", () => this.setDisplayMode(mode));
      this.modeButtons.set(mode, button);
    }
    this.lockButton = this.addToolbarButton("lock", "lock-open", "切换只读 / 编辑模式", () => this.toggleReadOnly());
    this.addToolbarSeparator();
    this.addToolbarButton("add-child", "plus-circle", "添加子节点（Tab）", () => this.addChild(), true);
    this.addToolbarButton("add-sibling", "list-plus", "添加同级节点（Enter）", () => this.addSibling(), true);
    this.addToolbarButton("edit", "pencil", "编辑节点（F2）", () => this.editSelected(), true);
    this.addToolbarButton("duplicate", "copy-plus", "克隆分支（Ctrl/Cmd+D）", () => this.duplicateSelected(), true);
    this.addToolbarButton("delete", "trash-2", "删除节点（Delete）", () => this.deleteSelected(), true);
    this.addToolbarSeparator();
    this.addToolbarButton("task", "circle-check-big", "切换任务状态（Ctrl/Cmd+Enter）", () => this.cycleTask(), true);
    this.addToolbarButton("collapse", "fold-vertical", "展开/收起节点（Space）", () => this.toggleCollapse(), true);
    this.addToolbarButton("link", "link", "打开节点链接", () => this.openSelectedLink());
    this.addToolbarButton("search", "search", "搜索当前导图及全部子导图（Ctrl/Cmd+F）", () => this.openSearch());
    this.addToolbarButton("global-search", "file-search", "全局搜索所有导图（Ctrl/Cmd+Shift+F）", () => this.callbacks.onGlobalSearch());
    this.addToolbarSeparator();
    this.addToolbarButton("table", "table-2", "插入或编辑表格", () => this.editTable(), true);
    this.addToolbarButton("code", "code-2", "插入或编辑代码", () => this.editCode(), true);
    this.addToolbarButton("image", "image-plus", "粘贴图片到当前节点（Ctrl/Cmd+V）", () => new Notice("先复制图片，再选中节点并按 Ctrl/Cmd+V"), true);
    this.addToolbarButton("submap", "network", "创建或进入子导图", () => void this.createOrOpenSubmap());
    this.addToolbarSeparator();
    this.addToolbarButton("undo", "undo-2", "撤销（Ctrl/Cmd+Z）", () => this.undo(), true);
    this.addToolbarButton("redo", "redo-2", "重做（Ctrl/Cmd+Y）", () => this.redo(), true);
    this.addToolbarSeparator();
    this.addToolbarButton("fit", "maximize", "适应画布", () => this.fitToView());
    this.addToolbarButton("layout", "git-fork", "切换单侧/双侧布局", () => this.toggleLayout(), true);
    this.addToolbarButton("appearance", "palette", "当前脑图外观", () => this.editAppearance(), true);
    this.articleLandingButton = this.addToolbarButton("article-landing", "list-tree", "切换目录 / 原始文章", () => this.toggleArticleLanding());
    this.articleStyleButton = this.addToolbarButton("article-style", "paintbrush", "文章样式", () => this.editArticleStyle(), true);
    this.addToolbarSeparator();
    this.addToolbarButton("markdown", "file-text", "查看 Markdown 大纲", () => this.showOutline());
    this.addToolbarButton("json", "braces", "JSON 导入 / 导出", () => this.showJsonTransfer(), true);
    this.addToolbarButton("export-document", "file-output", "导出 HTML / Word / PDF / Markdown", () => this.showDocumentExport());
    this.addToolbarButton("export-svg", "image", "导出 SVG", () => void this.callbacks.onExportSvg(documentToSvg(this.document.root, this.document.layout, this.document.title, this.getAppearance())));

    this.applyToolbarOrder();
    const spacer = this.toolbarEl.createSpan({ cls: "mmc-toolbar-spacer" });
    spacer.setAttr("aria-hidden", "true");
    const zoomControl = this.toolbarEl.createDiv({ cls: "mmc-zoom-control" });
    const zoomOut = zoomControl.createEl("button", { cls: "clickable-icon mmc-zoom-step", attr: { type: "button", title: "缩小", "aria-label": "缩小" } });
    setIcon(zoomOut, "minus");
    zoomOut.addEventListener("click", () => { this.setZoom(this.zoom / 1.15); this.focus(); });
    this.zoomStatusEl = zoomControl.createSpan({ cls: "mmc-zoom-status", text: "100%" });
    const zoomIn = zoomControl.createEl("button", { cls: "clickable-icon mmc-zoom-step", attr: { type: "button", title: "放大", "aria-label": "放大" } });
    setIcon(zoomIn, "plus");
    zoomIn.addEventListener("click", () => { this.setZoom(this.zoom * 1.15); this.focus(); });
    this.statusEl = this.toolbarEl.createSpan({ cls: "mmc-save-status", text: "已保存" });

    const keydown = (event: KeyboardEvent): void => this.handleKeydown(event);
    this.rootEl.addEventListener("keydown", keydown);
    this.cleanupCallbacks.push(() => this.rootEl.removeEventListener("keydown", keydown));

    const paste = (event: ClipboardEvent): void => { void this.handlePaste(event); };
    this.rootEl.addEventListener("paste", paste);
    this.cleanupCallbacks.push(() => this.rootEl.removeEventListener("paste", paste));

    const wheel = (event: WheelEvent): void => {
      const wheelTarget = event.target as HTMLElement;
      if (wheelTarget.closest(".mmc-node-table-wrap, .mmc-code-block")) return;
      event.preventDefault();
      const rect = this.viewportEl.getBoundingClientRect();
      const pointerX = event.clientX - rect.left - rect.width / 2;
      const pointerY = event.clientY - rect.top - rect.height / 2;
      const oldZoom = this.zoom;
      const nextZoom = this.clampZoom(this.zoom * (event.deltaY < 0 ? 1.1 : 0.9));
      const worldX = (pointerX - this.panX) / oldZoom;
      const worldY = (pointerY - this.panY) / oldZoom;
      this.zoom = nextZoom;
      this.panX = pointerX - worldX * nextZoom;
      this.panY = pointerY - worldY * nextZoom;
      this.applyTransform();
    };
    this.viewportEl.addEventListener("wheel", wheel, { passive: false });
    this.cleanupCallbacks.push(() => this.viewportEl.removeEventListener("wheel", wheel));

    const pointerDown = (event: PointerEvent): void => {
      const target = event.target as HTMLElement;
      if (target.closest(".mmc-node, .mmc-canvas-breadcrumb")) return;
      if (event.button !== 0 && event.button !== 1) return;
      if (event.button === 0 && event.shiftKey) {
        const viewportRect = this.viewportEl.getBoundingClientRect();
        const startX = event.clientX - viewportRect.left;
        const startY = event.clientY - viewportRect.top;
        const baseSelection = new Set(this.selectedIds);
        if (this.selectedId) baseSelection.add(this.selectedId);
        baseSelection.delete(this.document.root.id);
        const marquee = this.viewportEl.createDiv({ cls: "mmc-selection-marquee" });
        marquee.style.left = `${startX}px`;
        marquee.style.top = `${startY}px`;
        this.viewportEl.setPointerCapture(event.pointerId);
        const moveSelection = (moveEvent: PointerEvent): void => {
          const currentX = moveEvent.clientX - viewportRect.left;
          const currentY = moveEvent.clientY - viewportRect.top;
          marquee.style.left = `${Math.min(startX, currentX)}px`;
          marquee.style.top = `${Math.min(startY, currentY)}px`;
          marquee.style.width = `${Math.abs(currentX - startX)}px`;
          marquee.style.height = `${Math.abs(currentY - startY)}px`;
          const left = Math.min(event.clientX, moveEvent.clientX);
          const right = Math.max(event.clientX, moveEvent.clientX);
          const top = Math.min(event.clientY, moveEvent.clientY);
          const bottom = Math.max(event.clientY, moveEvent.clientY);
          this.selectedIds.clear();
          for (const id of baseSelection) this.selectedIds.add(id);
          for (const nodeEl of Array.from(this.nodesLayerEl.querySelectorAll<HTMLElement>(".mmc-node[data-node-id]"))) {
            const rect = nodeEl.getBoundingClientRect();
            if (rect.right >= left && rect.left <= right && rect.bottom >= top && rect.top <= bottom) {
              const id = nodeEl.dataset.nodeId;
              if (id && id !== this.document.root.id) this.selectedIds.add(id);
            }
          }
          this.selectedId = Array.from(this.selectedIds).at(-1) ?? "";
          this.applySelectionClasses();
        };
        const finishSelection = (upEvent: PointerEvent): void => {
          this.viewportEl.removeEventListener("pointermove", moveSelection);
          this.viewportEl.removeEventListener("pointerup", finishSelection);
          this.viewportEl.removeEventListener("pointercancel", finishSelection);
          if (this.viewportEl.hasPointerCapture(upEvent.pointerId)) this.viewportEl.releasePointerCapture(upEvent.pointerId);
          marquee.remove();
        };
        this.viewportEl.addEventListener("pointermove", moveSelection);
        this.viewportEl.addEventListener("pointerup", finishSelection);
        this.viewportEl.addEventListener("pointercancel", finishSelection);
        return;
      }
      this.panning = true;
      this.panStart = { x: event.clientX, y: event.clientY, panX: this.panX, panY: this.panY };
      this.viewportEl.setPointerCapture(event.pointerId);
      this.viewportEl.addClass("is-panning");
      this.selectNode(null);
    };
    const pointerMove = (event: PointerEvent): void => {
      if (!this.panning) return;
      this.panX = this.panStart.panX + event.clientX - this.panStart.x;
      this.panY = this.panStart.panY + event.clientY - this.panStart.y;
      this.applyTransform();
    };
    const pointerUp = (event: PointerEvent): void => {
      if (!this.panning) return;
      this.panning = false;
      if (this.viewportEl.hasPointerCapture(event.pointerId)) this.viewportEl.releasePointerCapture(event.pointerId);
      this.viewportEl.removeClass("is-panning");
    };
    this.viewportEl.addEventListener("pointerdown", pointerDown);
    this.viewportEl.addEventListener("pointermove", pointerMove);
    this.viewportEl.addEventListener("pointerup", pointerUp);
    this.viewportEl.addEventListener("pointercancel", pointerUp);
    const canvasContextMenu = (event: MouseEvent): void => {
      const target = event.target as HTMLElement;
      if (target.closest(".mmc-node, .mmc-canvas-breadcrumb")) return;
      event.preventDefault();
      this.openAllNodesContextMenu(event);
    };
    this.viewportEl.addEventListener("contextmenu", canvasContextMenu);
    this.cleanupCallbacks.push(() => {
      this.viewportEl.removeEventListener("pointerdown", pointerDown);
      this.viewportEl.removeEventListener("pointermove", pointerMove);
      this.viewportEl.removeEventListener("pointerup", pointerUp);
      this.viewportEl.removeEventListener("pointercancel", pointerUp);
      this.viewportEl.removeEventListener("contextmenu", canvasContextMenu);
    });

    this.resizeObserver = new ResizeObserver(() => this.applyTransform());
    this.resizeObserver.observe(this.viewportEl);
  }

  /**
   * 解析并确定mode，并保持模型、界面和持久化状态的一致性。
   *
   * @param preferred 该参数用于 resolve mode 流程中的输入或控制。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  private resolveMode(preferred: DisplayMode): DisplayMode {
    if (this.options.visibleModes.includes(preferred)) return preferred;
    return this.options.visibleModes[0] ?? "mindmap";
  }

  /**
   * 执行“persist read only state”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  private persistReadOnlyState(): void {
    this.document.view = { ...(this.document.view ?? {}), readOnly: this.readOnly };
    delete this.document.view.mode;
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
  }

  /**
   * 执行“update mode ui”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  private updateModeUi(): void {
    for (const [mode, button] of this.modeButtons) button.toggleClass("is-active", mode === this.currentMode);
    const isArticle = this.currentMode === "article";
    const hasLandingChoice = isArticle && this.options.showArticleToc;
    this.articleLandingButton.toggleClass("is-hidden", !hasLandingChoice || !this.options.visibleToolbarItems.includes("article-landing"));
    this.articleStyleButton.toggleClass("is-hidden", !isArticle || !this.options.visibleToolbarItems.includes("article-style"));
    if (hasLandingChoice) {
      const showingArticle = this.document.view?.articleLandingMode === "article";
      this.articleLandingButton.setAttr("aria-label", showingArticle ? "显示目录" : "显示原始文章");
      this.articleLandingButton.setAttr("title", showingArticle ? "显示目录" : "显示原始文章");
      this.articleLandingButton.empty();
      setIcon(this.articleLandingButton, showingArticle ? "list-tree" : "file-text");
      this.articleLandingButton.toggleClass("is-active", showingArticle);
    }
    this.lockButton.empty();
    setIcon(this.lockButton, this.readOnly ? "lock" : "lock-open");
    this.lockButton.setAttr("aria-label", this.readOnly ? "当前只读，点击切换到编辑模式" : "当前可编辑，点击切换到只读模式");
    this.lockButton.setAttr("title", this.readOnly ? "只读模式" : "编辑模式");
    this.lockButton.toggleClass("is-active", this.readOnly);
    this.rootEl.toggleClass("is-read-only", this.readOnly);
    for (const control of this.editControls) {
      if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement || control instanceof HTMLSelectElement) control.disabled = this.readOnly;
      control.toggleClass("is-read-only-disabled", this.readOnly);
    }
  }

  /**
   * 执行“ensure editable”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   * @returns 操作条件是否成立或处理是否成功。
   */
  private ensureEditable(): boolean {
    if (!this.readOnly) return true;
    new Notice("当前为只读模式，请先点击锁按钮切换到编辑模式");
    return false;
  }

  /**
   * 执行“clear image load timers”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  private clearImageLoadTimers(): void {
    for (const timer of this.imageLoadTimers) window.clearTimeout(timer);
    this.imageLoadTimers.clear();
  }

  /**
   * 添加toolbar button，并保持模型、界面和持久化状态的一致性。
   *
   * @param id 工具栏项目设置标识。
   * @param icon 该参数用于 add toolbar button 流程中的输入或控制。
   * @param label 该参数用于 add toolbar button 流程中的输入或控制。
   * @param action 该参数用于 add toolbar button 流程中的输入或控制。
   * @param editOnly 该参数用于 add toolbar button 流程中的输入或控制。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  private addToolbarButton(id: string, icon: string, label: string, action: () => void, editOnly = false): HTMLButtonElement {
    const button = this.toolbarEl.createEl("button", { cls: "clickable-icon mmc-toolbar-button", attr: { "aria-label": label, title: label, type: "button" } });
    button.dataset.toolbarId = id;
    setIcon(button, icon);
    button.toggleClass("is-hidden", !this.options.visibleToolbarItems.includes(id));
    if (editOnly) {
      button.addClass("mms-edit-only-control");
      this.editControls.push(button);
    }
    button.addEventListener("click", () => {
      if (editOnly && this.readOnly) return;
      action();
      this.focus();
    });
    return button;
  }

  /**
   * Applies the user-defined order to toolbar buttons.
   */
  private applyToolbarOrder(): void {
    const buttons = new Map<string, HTMLButtonElement>();
    for (const button of Array.from(this.toolbarEl.querySelectorAll<HTMLButtonElement>("[data-toolbar-id]"))) {
      const id = button.dataset.toolbarId;
      if (id) buttons.set(id, button);
    }
    for (const separator of Array.from(this.toolbarEl.querySelectorAll(".mmc-toolbar-separator"))) separator.remove();
    const order = [...this.options.toolbarItemOrder, ...TOOLBAR_ITEMS.map(([id]) => id)];
    for (const id of new Set(order)) {
      const button = buttons.get(id);
      if (button) this.toolbarEl.appendChild(button);
    }
  }

  /**
   * 添加toolbar separator，并保持模型、界面和持久化状态的一致性。
   */
  private addToolbarSeparator(): void {
    this.toolbarEl.createSpan({ cls: "mmc-toolbar-separator" });
  }

  /**
   * 读取并返回appearance，并保持模型、界面和持久化状态的一致性。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  private getAppearance(): MindMapAppearance {
    return mergeAppearance(this.options.defaultAppearance, this.document.appearance);
  }

  /**
   * 执行“font family css”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param appearance 导图外观配置。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  private fontFamilyCss(appearance: MindMapAppearance): string {
    if (appearance.fontFamily === "serif") return 'Georgia, "Times New Roman", serif';
    if (appearance.fontFamily === "mono") return '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
    if (appearance.fontFamily === "custom" && appearance.customFont?.trim()) return `"${appearance.customFont.trim().replaceAll('"', '')}", sans-serif`;
    if (appearance.fontFamily === "sans") return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    return "var(--font-interface)";
  }

  /**
   * 应用appearance，并保持模型、界面和持久化状态的一致性。
   *
   * @param appearance 导图外观配置。
   */
  private applyAppearance(appearance: MindMapAppearance): void {
    const setOrRemove = (name: string, value: string | undefined): void => {
      if (value) this.rootEl.style.setProperty(name, value);
      else this.rootEl.style.removeProperty(name);
    };
    setOrRemove("--mmc-canvas", appearance.backgroundColor);
    setOrRemove("--mmc-pattern-color", appearance.patternColor);
    setOrRemove("--mmc-edge", appearance.edgeColor);
    setOrRemove("--mmc-root-bg", appearance.rootColor);
    setOrRemove("--mmc-root-text", appearance.rootTextColor);
    setOrRemove("--mmc-node-bg", appearance.nodeColor);
    setOrRemove("--mmc-node-text", appearance.textColor);
    setOrRemove("--mmc-node-border", appearance.nodeBorderColor);
    this.rootEl.style.setProperty("--mmc-font-family", this.fontFamilyCss(appearance));
    this.rootEl.style.setProperty("--mmc-edge-width", `${appearance.edgeWidth ?? 2.2}px`);
    this.rootEl.style.setProperty("--mmc-node-border-width", `${appearance.nodeBorderWidth ?? 1}px`);
    this.rootEl.dataset.nodeVisualStyle = appearance.nodeVisualStyle ?? "card";
    this.viewportEl.toggleClass("pattern-grid", appearance.backgroundPattern === "grid");
    this.viewportEl.toggleClass("pattern-dots", appearance.backgroundPattern === "dots");
    this.viewportEl.toggleClass("pattern-none", !appearance.backgroundPattern || appearance.backgroundPattern === "none");
  }

  /**
   * 在画布左上角或文档顶部渲染父子导图导航。导图模式使用固定悬浮面包屑，文章和大纲模式使用文档流导航，均保持当前全局显示模式。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private renderNavigation(): void {
    this.navigationBarEl.empty();
    this.canvasBreadcrumbEl.empty();
    const navigation = this.document.navigation;
    const hasParent = Boolean(navigation?.parentPath);
    const showNavigationBar = hasParent && this.currentMode !== "mindmap";
    const showCanvasBreadcrumb = hasParent && this.currentMode === "mindmap";
    this.navigationBarEl.toggleClass("is-hidden", !showNavigationBar);
    this.canvasBreadcrumbEl.toggleClass("is-hidden", !showCanvasBreadcrumb);
    if (!navigation?.parentPath) return;

    const parentTitle = navigation.parentTitle
      ?? navigation.parentPath.split("/").at(-1)?.replace(/\.mindmap$/i, "")
      ?? "父导图";
    const currentTitle = nodePlainText(this.document.root) || this.document.title || "当前导图";
    const returnTitle = navigation.parentNodeText
      ? `返回父导图：${parentTitle}（来源节点：${navigation.parentNodeText}）`
      : `返回父导图：${parentTitle}`;
    const openParent = (): void => {
      void this.callbacks.onOpenMindMap(navigation.parentPath, navigation.parentNodeId);
    };

    if (showCanvasBreadcrumb) {
      const shell = this.canvasBreadcrumbEl.createDiv({ cls: "mmc-canvas-breadcrumb-shell" });
      const backButton = shell.createEl("button", {
        cls: "mmc-canvas-breadcrumb-back",
        attr: { type: "button", title: returnTitle, "aria-label": returnTitle }
      });
      setIcon(backButton, "arrow-left");
      backButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openParent();
      });

      const trail = shell.createDiv({ cls: "mmc-canvas-breadcrumb-trail" });
      const parent = trail.createEl("button", {
        cls: "mmc-canvas-breadcrumb-parent",
        text: parentTitle,
        attr: { type: "button", title: returnTitle }
      });
      parent.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openParent();
      });
      trail.createSpan({ cls: "mmc-canvas-breadcrumb-separator", text: "›" });
      trail.createSpan({ cls: "mmc-canvas-breadcrumb-current", text: currentTitle });
      shell.setAttr("title", navigation.parentPath);
    }

    if (!showNavigationBar) return;
    const button = this.navigationBarEl.createEl("button", {
      cls: "mmc-parent-navigation-button",
      attr: { type: "button", title: returnTitle }
    });
    setIcon(button, "arrow-left");
    const labels = button.createDiv({ cls: "mmc-parent-navigation-labels" });
    labels.createDiv({ cls: "mmc-parent-navigation-title", text: `返回父导图：${parentTitle}` });
    if (navigation.parentNodeText) labels.createDiv({ cls: "mmc-parent-navigation-node", text: `来源节点：${navigation.parentNodeText}` });
    button.addEventListener("click", openParent);
    this.navigationBarEl.createDiv({ cls: "mmc-parent-navigation-path", text: navigation.parentPath });
  }

  /**
   * 执行“update node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param node 当前处理的节点。
   * @param value 待校验、转换或比较的输入值。
   */
  private updateNodePrimaryText(node: MindMapNode, value: string): void {
    const next = value.replace(/\s+/g, " ").trim();
    const blocks = nodeContentBlocks(node);
    const firstText = blocks.find((block): block is MindMapTextContentBlock => block.type === "text");
    if (firstText) {
      firstText.text = next;
      firstText.richText = undefined;
    } else if (next) {
      blocks.unshift({ id: newId(), type: "text", text: next });
    }
    node.content = blocks.filter((block) => block.type !== "text" || block.text.trim());
    syncNodeLegacyFields(node);
    if (node.id === this.document.root.id && next) this.document.title = next;
  }

  /**
   * 创建并配置inline editable，并保持模型、界面和持久化状态的一致性。
   *
   * @param element 该参数用于 make inline editable 流程中的输入或控制。
   * @param node 当前处理的节点。
   * @param placeholder 该参数用于 make inline editable 流程中的输入或控制。
   */
  private makeInlineEditable(element: HTMLElement, node: MindMapNode, placeholder: string): void {
    element.contentEditable = this.readOnly ? "false" : "true";
    element.setAttr("role", "textbox");
    element.setAttr("aria-label", placeholder);
    if (!element.textContent?.trim()) element.dataset.placeholder = placeholder;
    if (this.readOnly) return;
    let original = nodePrimaryText(node);
    element.addEventListener("focus", () => { original = nodePrimaryText(node); });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        element.blur();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        element.setText(original);
        element.blur();
      }
    });
    element.addEventListener("blur", () => {
      const next = (element.textContent ?? "").replace(/\s+/g, " ").trim();
      if (next === original || (!next && node.id === this.document.root.id)) {
        element.setText(original);
        return;
      }
      this.mutate(() => this.updateNodePrimaryText(node, next));
    });
  }

  /**
   * 添加inline node actions，并保持模型、界面和持久化状态的一致性。
   *
   * @param container 接收渲染内容的 DOM 容器。
   * @param node 当前处理的节点。
   */
  private addInlineNodeActions(container: HTMLElement, node: MindMapNode): void {
    if (this.readOnly) return;
    const actions = container.createDiv({ cls: "mms-inline-node-actions" });
    const action = (icon: string, label: string, handler: () => void): void => {
      const button = actions.createEl("button", { cls: "clickable-icon", attr: { type: "button", title: label, "aria-label": label } });
      setIcon(button, icon);
      button.addEventListener("click", (event) => { event.stopPropagation(); this.selectNode(node.id); handler(); });
    };
    action("pencil", "完整编辑", () => this.editSelected());
    action("plus", "添加子节点", () => this.addChild());
    if (node.id !== this.document.root.id) action("trash-2", "删除节点", () => this.deleteSelected());
  }

  /**
   * 按照节点层级渲染可编辑大纲。节点标题、备注和子导图链接仍映射到同一份数据，任何修改都会通过统一变更链同步到导图和文章模式。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private renderOutline(): void {
    this.outlineEl.empty();
    const page = this.outlineEl.createDiv({ cls: "mms-outline-page" });
    const titleRow = page.createDiv({ cls: `mms-outline-row is-root${this.selectedId === this.document.root.id ? " is-selected" : ""}` });
    titleRow.dataset.nodeId = this.document.root.id;
    const title = titleRow.createDiv({ cls: "mms-outline-title is-root-title", text: nodePrimaryText(this.document.root) || this.document.title });
    this.makeInlineEditable(title, this.document.root, "导图标题");
    this.addInlineNodeActions(titleRow, this.document.root);
    titleRow.addEventListener("click", () => this.selectNode(this.document.root.id));

    const list = page.createDiv({ cls: "mms-outline-list" });
    const visit = (node: MindMapNode, depth: number): void => {
      const item = list.createDiv({ cls: `mms-outline-item depth-${Math.min(depth, 8)}` });
      item.style.setProperty("--mms-outline-depth", String(depth));
      const row = item.createDiv({ cls: `mms-outline-row${this.selectedId === node.id ? " is-selected" : ""}` });
      row.dataset.nodeId = node.id;
      row.createSpan({ cls: "mms-outline-bullet", text: node.children.length || node.submap ? "◆" : "•" });
      if (node.task) {
        const task = row.createEl("input", { type: "checkbox", cls: "mms-outline-task" });
        task.checked = node.task === "done";
        task.disabled = this.readOnly;
        task.addEventListener("change", (event) => {
          event.stopPropagation();
          this.selectNode(node.id);
          this.mutate(() => { node.task = task.checked ? "done" : "todo"; });
        });
      }
      const label = nodePlainText(node) || (node.submap?.title ?? "图片节点");
      if (node.submap) {
        const link = row.createEl("a", {
          cls: "mms-outline-title mms-submap-text-link",
          text: label,
          href: node.submap.path,
          attr: { title: `打开子导图：${node.submap.title ?? node.submap.path}` }
        });
        link.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.selectNode(node.id);
          void this.callbacks.onOpenMindMap(node.submap!.path);
        });
      } else {
        const text = row.createDiv({ cls: "mms-outline-title", text: label });
        this.makeInlineEditable(text, node, "节点文字");
      }
      if (node.skipArticleNumbering) row.createSpan({ cls: "mms-outline-badge", text: "文章不编号" });
      this.addInlineNodeActions(row, node);
      row.addEventListener("click", () => this.selectNode(node.id));
      row.addEventListener("dblclick", () => {
        this.selectNode(node.id);
        if (node.submap) void this.callbacks.onOpenMindMap(node.submap.path);
        else if (!this.readOnly) this.editSelected();
      });
      if (node.note) item.createDiv({ cls: "mms-outline-note", text: node.note });
      node.children.forEach((child) => visit(child, depth + 1));
    };
    this.document.root.children.forEach((child) => visit(child, 1));
  }

  /**
   * 渲染article content，并保持模型、界面和持久化状态的一致性。
   *
   * @param container 接收渲染内容的 DOM 容器。
   * @param node 当前处理的节点。
   * @param treatTextAsBody 该参数用于 render article content 流程中的输入或控制。
   */
  private renderArticleContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean): void {
    const blocks = nodeContentBlocks(node);
    let firstTextHandled = false;
    for (const block of blocks) {
      if (block.type === "text") {
        if (!treatTextAsBody && !firstTextHandled) { firstTextHandled = true; continue; }
        firstTextHandled = true;
        const paragraph = container.createEl("p", { cls: "mms-article-paragraph" });
        renderRichTextRuns(paragraph, block.richText, block.text);
        this.markWrappedArticleParagraph(paragraph);
        if (treatTextAsBody) this.makeInlineEditable(paragraph, node, "正文");
      } else {
        const resolved = this.callbacks.resolveImage(block.source);
        const image = container.createEl("img", { cls: "mms-article-image", attr: { src: resolved ?? block.source, alt: block.alt ?? "图片" } });
        image.addEventListener("click", () => new ImagePreviewModal(this.app, resolved ?? block.source, block.alt ?? "图片").open());
      }
    }
    if (node.note) container.createEl("p", { cls: "mms-article-note", text: node.note });
    if (node.table) {
      const wrap = container.createDiv({ cls: "mms-article-table-wrap" });
      const table = wrap.createEl("table", { cls: "mms-article-table" });
      const tr = table.createEl("thead").createEl("tr");
      node.table.headers.forEach((header) => tr.createEl("th", { text: header }));
      const body = table.createEl("tbody");
      node.table.rows.forEach((row) => {
        const rowEl = body.createEl("tr");
        node.table!.headers.forEach((_, index) => rowEl.createEl("td", { text: row[index] ?? "" }));
      });
    }
    if (node.code) {
      const code = container.createDiv({ cls: "mms-article-code markdown-rendered" });
      void this.callbacks.onRenderCode(node.code, code);
    }
  }

  /**
   * Adds a two-character first-line indent only when a body paragraph actually
   * occupies more than one rendered line.
   *
   * @param paragraph Rendered article body paragraph.
   */
  private markWrappedArticleParagraph(paragraph: HTMLParagraphElement): void {
    window.requestAnimationFrame(() => {
      if (!paragraph.isConnected || !paragraph.textContent?.trim()) return;
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      const lineTops = new Set(Array.from(range.getClientRects(), (rect) => Math.round(rect.top)));
      paragraph.toggleClass("is-multiline", lineTops.size > 1);
      range.detach();
    });
  }

  /**
   * 渲染文章目录页、章节编号、正文和跨子导图链接。顶层父导图可展示递归目录；子导图根据文章上下文继续父级编号。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private renderArticle(): void {
    this.articleEl.empty();
    const articleStyle = resolveArticleStyle(this.document.articleStyle);
    const page = this.articleEl.createDiv({ cls: `mms-article-page article-${articleStyle.preset} toc-${articleStyle.tocStyle ?? "card"}` });
    if (articleStyle.fontFamily) page.style.setProperty("--mms-article-font", articleStyle.fontFamily);
    if (articleStyle.textColor) page.style.setProperty("--mms-article-text", articleStyle.textColor);
    if (articleStyle.headingColor) page.style.setProperty("--mms-article-heading", articleStyle.headingColor);
    if (articleStyle.accentColor) page.style.setProperty("--mms-article-accent", articleStyle.accentColor);
    if (articleStyle.backgroundColor) page.style.setProperty("--mms-article-paper", articleStyle.backgroundColor);
    page.style.setProperty("--mms-article-font-size", `${articleStyle.fontSize ?? 16}px`);
    page.style.setProperty("--mms-article-line-height", String(articleStyle.lineHeight ?? 1.85));
    const title = page.createEl("h1", { cls: "mms-article-document-title", text: nodePrimaryText(this.document.root) || this.document.title });
    this.makeInlineEditable(title, this.document.root, "文章标题");
    this.addInlineNodeActions(page, this.document.root);

    const directoryOnly = this.options.showArticleToc
      && this.options.articleTocEntries.length > 0
      && this.document.view?.articleLandingMode !== "article";
    if (directoryOnly) {
      const tocPage = page.createEl("nav", { cls: "mms-article-toc mms-article-toc-page" });
      tocPage.createEl("h2", { text: "目录" });
      const list = tocPage.createEl("ol");
      for (const entry of this.options.articleTocEntries.filter((item) => item.depth <= this.options.articleTocMaxDepth)) {
        const item = list.createEl("li", { cls: `depth-${Math.min(entry.depth, 8)}` });
        item.style.setProperty("--mms-article-depth", String(entry.depth));
        const link = item.createEl("a", {
          text: entry.displayTitle || entry.title || "未命名标题",
          href: entry.filePath,
          attr: { title: entry.breadcrumb.join(" › ") }
        });
        link.addEventListener("click", (event) => {
          event.preventDefault();
          void this.callbacks.onOpenMindMap(entry.filePath, entry.nodeId);
        });
        if (entry.breadcrumb.length > 1) item.createSpan({ cls: "mms-article-toc-breadcrumb", text: entry.breadcrumb.join(" › ") });
      }
      return;
    }

    const infos = buildArticleNodeInfo(this.document.root, this.options.articleBaseDepth);
    for (const info of infos) {
      const section = page.createEl("section", { cls: `mms-article-node depth-${Math.min(info.depth, 8)}${this.selectedId === info.node.id ? " is-selected" : ""}` });
      section.dataset.nodeId = info.node.id;
      section.id = info.anchor;
      section.addEventListener("click", () => this.selectNode(info.node.id));
      if (info.isHeading) {
        const level = Math.min(6, info.depth + 1);
        const heading = section.createEl(`h${level}` as keyof HTMLElementTagNameMap, { cls: "mms-article-heading" });
        if (info.label) heading.createSpan({ cls: "mms-article-number", text: info.label });
        if (info.node.submap) {
          const headingLink = heading.createEl("a", {
            cls: "mms-article-heading-text mms-submap-text-link",
            text: info.title,
            href: info.node.submap.path,
            attr: { title: `打开子导图：${info.node.submap.title ?? info.node.submap.path}` }
          });
          headingLink.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.selectNode(info.node.id);
            void this.callbacks.onOpenMindMap(info.node.submap!.path);
          });
        } else {
          const headingText = heading.createSpan({ cls: "mms-article-heading-text", text: info.title });
          this.makeInlineEditable(headingText, info.node, "章节标题");
        }
        if (info.skipped) heading.createSpan({ cls: "mms-article-skip-badge", text: "不编号" });
        this.addInlineNodeActions(heading, info.node);
        this.renderArticleContent(section, info.node, false);
      } else {
        const firstTextBlock = nodeContentBlocks(info.node).find((block): block is MindMapTextContentBlock => block.type === "text");
        if (firstTextBlock || !this.readOnly) {
          const paragraph = section.createEl("p", { cls: "mms-article-leaf-text" });
          if (firstTextBlock) {
            renderRichTextRuns(paragraph, firstTextBlock.richText, firstTextBlock.text);
            this.markWrappedArticleParagraph(paragraph);
          }
          this.makeInlineEditable(paragraph, info.node, "正文段落");
        }
        this.addInlineNodeActions(section, info.node);
        this.renderArticleContent(section, info.node, false);
      }
    }
    this.renderArticlePager(page);
  }

  /**
   * Renders previous, parent, next, and end navigation for a child article page.
   *
   * @param page Article page container.
   */
  private renderArticlePager(page: HTMLElement): void {
    const navigation = this.options.articleNavigation;
    if (!navigation?.parentPath || !navigation.entries.length) return;
    const index = this.articleNavigationIndex ?? navigation.currentIndex;
    const previous = index > 0 ? navigation.entries[index - 1] : undefined;
    const next = index < navigation.entries.length - 1 ? navigation.entries[index + 1] : undefined;
    const pager = page.createEl("nav", { cls: "mms-article-pager", attr: { "aria-label": "文章前后页导航" } });
    const addTarget = (className: string, prefix: string, entry: ArticleTocEntry): void => {
      const link = pager.createEl("button", {
        cls: className,
        attr: { type: "button", title: entry.breadcrumb.join(" › ") }
      });
      link.createSpan({ cls: "mms-article-pager-direction", text: prefix.trim() });
      link.createSpan({ cls: "mms-article-pager-title", text: entry.displayTitle || entry.title });
      link.addEventListener("click", () => void this.callbacks.onOpenMindMap(entry.filePath, entry.nodeId));
    };
    if (previous) addTarget("mms-article-pager-previous", previous.depth <= 1 ? "上一章 " : "上一节 ", previous);
    else pager.createSpan({ cls: "mms-article-pager-placeholder" });
    const parent = pager.createEl("button", { cls: "mms-article-pager-parent", attr: { type: "button", title: "返回上一级" } });
    setIcon(parent, "corner-left-up");
    parent.createSpan({ text: "返回上一级" });
    parent.addEventListener("click", () => void this.callbacks.onOpenMindMap(navigation.parentPath!));
    if (next) addTarget("mms-article-pager-next", next.depth <= 1 ? "下一章 " : "下一节 ", next);
    else {
      const end = pager.createEl("button", { cls: "mms-article-pager-end", attr: { type: "button", title: "返回总目录" } });
      end.createSpan({ cls: "mms-article-pager-direction", text: "阅读完成" });
      end.createSpan({ cls: "mms-article-pager-title", text: "END · 返回目录" });
      end.addEventListener("click", () => void this.callbacks.onOpenArticleDirectory(navigation.homePath));
    }
  }

  /**
   * 渲染相关数据，并保持模型、界面和持久化状态的一致性。
   */
  private render(): void {
    for (const id of Array.from(this.selectedIds)) {
      if (!findNode(this.document.root, id)) this.selectedIds.delete(id);
    }
    if (this.selectedId && !this.selectedIds.has(this.selectedId)) {
      this.selectedIds.clear();
      this.selectedIds.add(this.selectedId);
    }
    this.clearImageLoadTimers();
    this.renderNavigation();
    const appearance = this.getAppearance();
    this.applyAppearance(appearance);
    this.updateModeUi();
    this.viewportEl.toggleClass("is-hidden", this.currentMode !== "mindmap");
    this.outlineEl.toggleClass("is-hidden", this.currentMode !== "outline");
    this.articleEl.toggleClass("is-hidden", this.currentMode !== "article" && this.currentMode !== "reading");
    this.rootEl.dataset.displayMode = this.currentMode;
    if (this.currentMode === "outline") this.renderOutline();
    else if (this.currentMode === "article") this.renderArticle();
    else if (this.currentMode === "reading") this.renderReading();
    else this.renderMindMap();
  }

  /**
   * 渲染可交互导图画布：计算布局、绘制连接线和节点、恢复选择状态、绑定拖拽与尺寸手柄、安装子导图整节点入口，并启动图片镜像加载探测。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private renderMindMap(): void {
    const appearance = this.getAppearance();
    this.layout = computeLayout(this.document.root, this.document.layout, appearance.fontSize ?? 14, appearance.nodeVisualStyle ?? "card", appearance);
    const branchColorMap = appearance.colorfulBranches ? buildBranchColorMap(this.document.root, appearance.branchColors) : new Map<string, string>();
    this.clearDropPreview();
    this.nodesLayerEl.empty();
    while (this.edgesSvg.firstChild) this.edgesSvg.removeChild(this.edgesSvg.firstChild);

    const maxDepth = Math.max(1, ...this.layout.nodes.map((position) => position.depth));

    for (const position of this.layout.nodes) {
      if (!position.parentId) continue;
      const parent = this.layout.byId.get(position.parentId);
      if (!parent) continue;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", appearance.nodeVisualStyle === "branch"
        ? roundedElbowEdgePath(parent, position)
        : edgePath(parent, position, appearance.edgeStyle ?? "curved"));
      path.setAttribute("class", `mmc-edge depth-${Math.min(position.depth, 6)}`);
      const branchColor = branchColorMap.get(position.node.id);
      if (position.node.style?.color) path.style.stroke = position.node.style.color;
      else if (branchColor) path.style.stroke = branchColor;
      const edgeWidth = edgeWidthForDepth(appearance, position.depth, maxDepth);
      // Set both the SVG presentation attribute and an inline CSS variable.
      // This prevents community-theme rules from forcing every edge back to
      // the same width.
      path.setAttribute("stroke-width", String(edgeWidth));
      path.style.setProperty("--mmc-current-edge-width", `${edgeWidth}px`);
      path.style.setProperty("stroke-width", `${edgeWidth}px`, "important");
      this.edgesSvg.appendChild(path);
    }

    for (const position of this.layout.nodes) {
      const node = position.node;
      const shape = node.style?.shape ?? this.options.defaultNodeShape;
      const textAlign = node.style?.textAlign ?? appearance.nodeTextAlign ?? "center";
      const classes = ["mmc-node", position.depth === 0 ? "is-root" : "", node.submap ? "is-submap-node" : "", `shape-${shape}`, `text-align-${textAlign}`].filter(Boolean).join(" ");
      const nodeEl = this.nodesLayerEl.createDiv({ cls: classes });
      nodeEl.dataset.nodeId = node.id;
      nodeEl.style.left = `${position.x}px`;
      nodeEl.style.top = `${position.y}px`;
      nodeEl.style.width = `${position.width}px`;
      nodeEl.style.minHeight = `${position.height}px`;
      nodeEl.style.setProperty("--mmc-node-text-align", textAlign);
      nodeEl.draggable = position.depth > 0 && !this.readOnly;
      if (this.selectedId === node.id || this.selectedIds.has(node.id)) nodeEl.addClass("is-selected");
      if (this.selectedIds.size > 1 && this.selectedIds.has(node.id)) nodeEl.addClass("is-multi-selected");
      if (this.searchQuery && nodeSearchText(node).includes(this.searchQuery)) nodeEl.addClass("is-search-match");
      if (node.task) nodeEl.addClass(`task-${node.task}`);
      const isRoot = position.depth === 0;
      const bold = node.style?.bold ?? appearance.bold ?? false;
      const italic = node.style?.italic ?? appearance.italic ?? false;
      const underline = node.style?.underline ?? appearance.underline ?? false;
      if (bold) nodeEl.addClass("is-bold");
      if (italic) nodeEl.addClass("is-italic");
      if (underline) nodeEl.addClass("is-underlined");
      if (node.note) nodeEl.setAttr("title", node.note);
      const branchColor = branchColorMap.get(node.id);
      if (node.style?.color) nodeEl.style.backgroundColor = node.style.color;
      else if (isRoot && appearance.rootColor) nodeEl.style.backgroundColor = appearance.rootColor;
      else if (!isRoot && branchColor && appearance.nodeVisualStyle === "branch") {
        nodeEl.style.backgroundColor = `color-mix(in srgb, ${branchColor} 16%, ${appearance.nodeColor ?? "#ffffff"})`;
      } else if (!isRoot && appearance.nodeColor) nodeEl.style.backgroundColor = appearance.nodeColor;
      if (node.style?.textColor) nodeEl.style.color = node.style.textColor;
      else if (isRoot && appearance.rootTextColor) nodeEl.style.color = appearance.rootTextColor;
      else if (!isRoot && appearance.textColor) nodeEl.style.color = appearance.textColor;
      if (node.style?.borderColor) nodeEl.style.borderColor = node.style.borderColor;
      else if (!isRoot && branchColor && appearance.nodeVisualStyle === "branch") {
        nodeEl.style.borderColor = `color-mix(in srgb, ${branchColor} 38%, transparent)`;
      } else if (!isRoot && branchColor) nodeEl.style.borderColor = branchColor;
      else if (!isRoot && appearance.nodeBorderColor) nodeEl.style.borderColor = appearance.nodeBorderColor;
      nodeEl.style.borderWidth = `${node.style?.borderWidth ?? appearance.nodeBorderWidth ?? (isRoot ? 2 : 1)}px`;

      const content = nodeEl.createDiv({ cls: "mmc-node-content" });
      const blocks = nodeContentBlocks(node);
      const hasTextBlock = blocks.some((block) => block.type === "text" && block.text.trim());
      if ((node.task || node.icon) && !hasTextBlock) {
        const meta = content.createDiv({ cls: "mmc-node-main mmc-node-meta-only" });
        if (node.task) {
          const task = meta.createSpan({ cls: `mmc-task-icon task-${node.task}`, text: node.task === "done" ? "✓" : node.task === "doing" ? "◐" : "○" });
          task.setAttr("aria-label", node.task === "done" ? "已完成" : node.task === "doing" ? "进行中" : "待办");
        }
        if (node.icon) meta.createSpan({ cls: "mmc-node-icon", text: node.icon });
      }
      let prefixRendered = false;
      for (const block of blocks) {
        if (block.type === "image") {
          const wrap = content.createDiv({ cls: "mmc-node-image-block" });
          const image = wrap.createEl("img", { cls: "mmc-node-image is-loading", attr: { alt: block.alt ?? (nodePlainText(node) || "图片") } });
          const candidates = this.options.imageFailoverEnabled
            ? imageSourceCandidates(block, this.options.imageFailoverUseLocalFallback)
            : imageSourceCandidates(block, false).slice(0, 1);
          let activeResolved: string | null = null;
          let attemptToken = 0;
          let attemptTimer: number | null = null;
          const clearAttemptTimer = (): void => {
            if (attemptTimer === null) return;
            window.clearTimeout(attemptTimer);
            this.imageLoadTimers.delete(attemptTimer);
            attemptTimer = null;
          };
          const markRemoteFailure = (source: string): void => {
            const remote = block.remoteSources?.find((item) => item.url === source);
            if (!remote) return;
            remote.lastFailureAt = new Date().toISOString();
            remote.failureCount = Math.min(1000000, (remote.failureCount ?? 0) + 1);
          };
          const tryCandidate = (index: number): void => {
            clearAttemptTimer();
            const candidate = candidates[index];
            attemptToken += 1;
            const token = attemptToken;
            if (!candidate) {
              activeResolved = null;
              image.removeAttribute("src");
              image.removeClass("is-loading");
              image.addClass("is-unresolved");
              image.setAttr("title", "所有图片镜像均不可用");
              this.callbacks.onChange(this.getDocument());
              this.markSaving();
              return;
            }
            const resolved = this.callbacks.resolveImage(candidate.source);
            if (!resolved) {
              markRemoteFailure(candidate.source);
              tryCandidate(index + 1);
              return;
            }
            const probe = new Image();
            const fail = (): void => {
              if (token !== attemptToken) return;
              clearAttemptTimer();
              markRemoteFailure(candidate.source);
              if (this.options.imageFailoverEnabled) tryCandidate(index + 1);
              else {
                image.removeClass("is-loading");
                image.addClass("is-unresolved");
                image.setAttr("title", `图片加载失败：${candidate.source}`);
              }
            };
            probe.onload = () => {
              if (token !== attemptToken || probe.naturalWidth <= 0) return;
              clearAttemptTimer();
              activeResolved = resolved;
              image.src = resolved;
              image.removeClass("is-loading");
              image.removeClass("is-unresolved");
              image.setAttr("title", index === 0 ? "点击放大图片" : `已自动切换到：${candidate.label}`);
              const switched = candidate.source !== block.source;
              const remote = block.remoteSources?.find((item) => item.url === candidate.source);
              if (remote) remote.lastSuccessAt = new Date().toISOString();
              if (!switched) return;
              const previous = block.remoteSources?.find((item) => item.url === block.source);
              block.source = candidate.source;
              syncNodeLegacyFields(node);
              this.callbacks.onChange(this.getDocument());
              this.markSaving();
              const previousLabel = previous?.hostName || "当前图床";
              new Notice(`图片地址失效，已从 ${previousLabel} 自动切换到 ${candidate.label}`, 6000);
            };
            probe.onerror = fail;
            const timeoutMs = Math.max(2, Math.min(30, this.options.imageFailoverTimeoutSeconds)) * 1000;
            attemptTimer = window.setTimeout(fail, timeoutMs);
            this.imageLoadTimers.add(attemptTimer);
            probe.src = resolved;
          };
          image.addEventListener("click", (event) => {
            event.stopPropagation();
            if (activeResolved) new ImagePreviewModal(this.app, activeResolved, block.alt ?? "图片预览").open();
          });
          tryCandidate(0);
          continue;
        }
        if (!block.text.trim()) continue;
        const main = content.createDiv({ cls: "mmc-node-main mmc-node-text-block" });
        if (!prefixRendered && node.task) {
          const task = main.createSpan({ cls: `mmc-task-icon task-${node.task}`, text: node.task === "done" ? "✓" : node.task === "doing" ? "◐" : "○" });
          task.setAttr("aria-label", node.task === "done" ? "已完成" : node.task === "doing" ? "进行中" : "待办");
        }
        if (!prefixRendered && node.icon) main.createSpan({ cls: "mmc-node-icon", text: node.icon });
        const isSubmapTitle = Boolean(node.submap) && !prefixRendered;
        prefixRendered = true;
        const textEl = main.createDiv({ cls: `mmc-node-text${isSubmapTitle ? " is-submap-link" : ""}` });
        renderRichTextRuns(textEl, block.richText, block.text);
        textEl.style.fontSize = `${node.style?.fontSize ?? appearance.fontSize ?? 14}px`;
        textEl.setAttr("aria-label", isSubmapTitle ? `打开子导图：${block.text}` : block.text);
        if (isSubmapTitle) {
          const indicator = textEl.createSpan({ cls: "mmc-submap-inline-indicator", attr: { "aria-hidden": "true" } });
          setIcon(indicator, "arrow-up-right");
          textEl.setAttr("title", `打开子导图：${node.submap!.title ?? node.submap!.path}`);
        }
      }

      if (node.submap && !hasTextBlock) {
        const submapIcon = nodeEl.createEl("button", {
          cls: "mmc-submap-corner-link",
          attr: {
            "aria-label": `打开子导图：${node.submap.title ?? node.submap.path}`,
            title: `打开子导图：${node.submap.title ?? node.submap.path}`
          }
        });
        setIcon(submapIcon, "arrow-up-right");
        submapIcon.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          void this.callbacks.onOpenMindMap(node.submap!.path);
        });
      }

      if (node.submap) {
        nodeEl.setAttr("role", "link");
        nodeEl.setAttr("tabindex", "0");
        nodeEl.setAttr("aria-label", `打开子导图：${node.submap.title ?? node.submap.path}`);
        nodeEl.setAttr("title", `打开子导图：${node.submap.title ?? node.submap.path}；右键可编辑节点`);
      }

      if (node.table) this.renderNodeTable(content, node);
      if (node.code) this.renderNodeCode(content, node);

      if (node.tags?.length) {
        const tags = content.createDiv({ cls: "mmc-node-tags" });
        node.tags.slice(0, 4).forEach((tag) => tags.createSpan({ cls: "mmc-node-tag", text: `#${tag}` }));
      }

      if (this.options.showTaskProgress && node.children.length) {
        const progress = getTaskProgress(node);
        if (progress.total) {
          const percent = Math.round((progress.done / progress.total) * 100);
          const progressEl = nodeEl.createDiv({ cls: "mmc-task-progress", attr: { title: `${progress.done}/${progress.total} 个任务已完成` } });
          progressEl.createDiv({ cls: "mmc-task-progress-bar", attr: { style: `width:${percent}%` } });
          progressEl.createSpan({ text: `${percent}%` });
        }
      }

      if (node.children.length) {
        const fold = nodeEl.createEl("button", { cls: "mmc-fold-button", attr: { "aria-label": node.collapsed ? "展开" : "收起" } });
        fold.setText(node.collapsed ? `+${node.children.length}` : "−");
        fold.addEventListener("click", (event) => {
          event.stopPropagation();
          this.selectNode(node.id);
          this.toggleCollapse();
        });
      }

      const link = this.getNodeLink(node);
      if (link) {
        const linkButton = nodeEl.createEl("button", { cls: "mmc-node-link", attr: { "aria-label": `打开 ${link}` } });
        setIcon(linkButton, "external-link");
        linkButton.addEventListener("click", (event) => {
          event.stopPropagation();
          void this.callbacks.onOpenLink(link);
        });
      }

      if (!this.readOnly) {
        const resizeHandle = nodeEl.createDiv({
          cls: "mmc-node-resize-handle",
          attr: { role: "separator", tabindex: "0", "aria-label": "拖动调整节点宽度和最小高度", title: "拖动调整节点大小；双击恢复自动大小" }
        });
        resizeHandle.setAttr("draggable", "false");
        resizeHandle.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); });
        resizeHandle.addEventListener("dblclick", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.mutate(() => {
            const next = { ...(node.style ?? {}), width: undefined, minHeight: undefined };
            node.style = Object.values(next).some((value) => value !== undefined) ? next : undefined;
          });
        });
        resizeHandle.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          const startX = event.clientX;
          const startY = event.clientY;
          const startWidth = position.width;
          const startHeight = position.height;
          let previewWidth = startWidth;
          let previewHeight = startHeight;
          resizeHandle.setPointerCapture(event.pointerId);
          nodeEl.addClass("is-resizing");
          const move = (moveEvent: PointerEvent): void => {
            const scale = Math.max(.1, this.zoom);
            previewWidth = Math.min(900, Math.max(100, startWidth + (moveEvent.clientX - startX) / scale));
            previewHeight = Math.min(600, Math.max(36, startHeight + (moveEvent.clientY - startY) / scale));
            nodeEl.style.width = `${Math.round(previewWidth)}px`;
            nodeEl.style.minHeight = `${Math.round(previewHeight)}px`;
          };
          const finish = (upEvent: PointerEvent): void => {
            resizeHandle.removeEventListener("pointermove", move);
            resizeHandle.removeEventListener("pointerup", finish);
            resizeHandle.removeEventListener("pointercancel", finish);
            if (resizeHandle.hasPointerCapture(upEvent.pointerId)) resizeHandle.releasePointerCapture(upEvent.pointerId);
            nodeEl.removeClass("is-resizing");
            this.mutate(() => {
              node.style = {
                ...(node.style ?? {}),
                width: Math.round(previewWidth),
                minHeight: Math.round(previewHeight)
              };
            });
          };
          resizeHandle.addEventListener("pointermove", move);
          resizeHandle.addEventListener("pointerup", finish);
          resizeHandle.addEventListener("pointercancel", finish);
        });
      }

      nodeEl.addEventListener("click", (event) => {
        event.stopPropagation();
        if (event.shiftKey) {
          this.toggleNodeSelection(node.id);
          return;
        }
        this.selectNode(node.id);
        if (node.submap) void this.callbacks.onOpenMindMap(node.submap.path);
      });
      if (node.submap) {
        nodeEl.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          this.selectNode(node.id);
          void this.callbacks.onOpenMindMap(node.submap!.path);
        });
      }
      nodeEl.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        this.selectNode(node.id);
        if (node.submap) {
          void this.callbacks.onOpenMindMap(node.submap.path);
        } else if (!this.readOnly) this.beginInlineEdit(node.id);
      });
      nodeEl.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.selectNode(node.id);
        this.openContextMenu(event);
      });
      nodeEl.addEventListener("dragstart", (event) => {
        if (this.readOnly) { event.preventDefault(); return; }
        this.draggingId = node.id;
        event.dataTransfer?.setData("text/plain", node.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        const draggingIds = this.selectedIds.has(node.id) ? this.selectedIds : new Set([node.id]);
        for (const draggingId of draggingIds) {
          this.nodesLayerEl.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(draggingId)}"]`)?.addClass("is-dragging");
        }
      });
      nodeEl.addEventListener("dragover", (event) => {
        if (!this.canMoveNode(this.draggingId, node.id)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        const position = this.dropPositionForEvent(event, nodeEl, node.id);
        this.dragDropPosition = position;
        this.clearDropIndicators();
        const indicator = position === "child" && this.isRightChildDrop(event, nodeEl)
          ? "is-drop-child-right"
          : `is-drop-${position}`;
        nodeEl.addClasses(["is-drop-target", indicator]);
        this.showDropPreview(node.id, position);
      });
      nodeEl.addEventListener("dragleave", (event) => {
        if (event.relatedTarget instanceof Node && nodeEl.contains(event.relatedTarget)) return;
        nodeEl.removeClasses(["is-drop-target", "is-drop-before", "is-drop-child", "is-drop-child-right", "is-drop-after"]);
        this.clearDropPreview();
      });
      nodeEl.addEventListener("drop", (event) => {
        event.preventDefault();
        const position = this.dragDropPosition ?? this.dropPositionForEvent(event, nodeEl, node.id);
        this.clearDropIndicators();
        this.clearDropPreview();
        const draggedId = this.draggingId ?? event.dataTransfer?.getData("text/plain") ?? null;
        if (draggedId) this.moveNode(draggedId, node.id, position);
      });
      nodeEl.addEventListener("dragend", () => {
        this.draggingId = null;
        this.dragDropPosition = null;
        this.clearDropIndicators();
        this.clearDropPreview();
        this.nodesLayerEl.querySelectorAll(".is-dragging").forEach((element) => element.removeClass("is-dragging"));
      });
    }
    this.applyTransform();
  }

  /**
   * 应用transform，并保持模型、界面和持久化状态的一致性。
   */
  private applyTransform(): void {
    const rect = this.viewportEl.getBoundingClientRect();
    this.sceneEl.style.transform = `translate(${rect.width / 2 + this.panX}px, ${rect.height / 2 + this.panY}px) scale(${this.zoom})`;
    this.rootEl.style.setProperty("--mmc-zoom", String(this.zoom));
    this.zoomStatusEl?.setText(`${Math.round(this.zoom * 100)}%`);
  }

  /**
   * 执行“select node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param id 目标对象或节点的稳定标识。
   */
  private selectNode(id: string | null): void {
    this.selectedIds.clear();
    this.selectedId = id ?? "";
    if (id) this.selectedIds.add(id);
    this.applySelectionClasses();
  }

  /**
   * Adds or removes one node from the current multi-selection.
   *
   * @param id Node identifier.
   */
  private toggleNodeSelection(id: string): void {
    if (id === this.document.root.id) return;
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.selectedId = Array.from(this.selectedIds).at(-1) ?? "";
    this.applySelectionClasses();
  }

  /**
   * Synchronizes selection classes across all editor views.
   */
  private applySelectionClasses(): void {
    this.rootEl.querySelectorAll(".is-selected, .is-multi-selected")
      .forEach((element) => element.removeClasses(["is-selected", "is-multi-selected"]));
    for (const id of this.selectedIds) {
      const multi = this.selectedIds.size > 1;
      for (const scope of [this.nodesLayerEl, this.outlineEl, this.articleEl]) {
        const element = scope.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`);
        element?.addClass("is-selected");
        if (multi) element?.addClass("is-multi-selected");
      }
    }
  }

  /**
   * 执行“selected node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  private selectedNode(): MindMapNode | null {
    return this.selectedId ? findNode(this.document.root, this.selectedId) : null;
  }

  /**
   * 创建configured node，并保持模型、界面和持久化状态的一致性。
   *
   * @param text 要显示、搜索、解析或写入的文本。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  private createConfiguredNode(text = "新节点"): MindMapNode {
    const node = createNode(text);
    if (this.options.defaultNodeShape !== "rounded") node.style = { shape: this.options.defaultNodeShape };
    return node;
  }

  /**
   * 判断键盘事件是否匹配用户配置的组合键。
   *
   * @param event 当前键盘事件。
   * @param shortcut 形如 Ctrl+B 或 Ctrl+Shift+C 的快捷键文本。
   * @returns 当前事件是否与快捷键一致。
   */
  private shortcutMatches(event: KeyboardEvent, shortcut: string): boolean {
    const parts = shortcut.toLowerCase().split("+").map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return false;
    const wantsMod = parts.includes("ctrl") || parts.includes("cmd") || parts.includes("mod");
    return event.key.toLowerCase() === parts.at(-1)
      && (event.ctrlKey || event.metaKey) === wantsMod
      && event.shiftKey === parts.includes("shift")
      && event.altKey === parts.includes("alt");
  }

  /** 在节点本体中启动轻量富文本输入。 */
  private beginInlineEdit(nodeId: string): void {
    if (this.readOnly) return;
    const node = findNode(this.document.root, nodeId);
    if (!node) return;
    this.selectNode(nodeId);
    this.inlineEditingId = nodeId;
    if (this.options.nodeEditorPosition === "right") this.editSelected();
    if (this.currentMode !== "mindmap") {
      const scope = this.currentMode === "outline" ? this.outlineEl : this.articleEl;
      scope.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(nodeId)}"] [contenteditable="true"]`)?.focus();
      return;
    }
    const nodeEl = this.nodesLayerEl.querySelector<HTMLElement>(`.mmc-node[data-node-id="${CSS.escape(nodeId)}"]`);
    const content = nodeEl?.querySelector<HTMLElement>(".mmc-node-content");
    if (!nodeEl || !content) return;
    let editor = content.querySelector<HTMLElement>(".mmc-node-text");
    if (!editor) editor = content.createDiv({ cls: "mmc-node-main mmc-node-text-block" }).createDiv({ cls: "mmc-node-text" });
    editor.contentEditable = "true";
    editor.spellcheck = true;
    editor.addClass("is-inline-editing");
    editor.setAttr("role", "textbox");
    editor.setAttr("aria-label", "输入节点文字");
    const firstText = nodeContentBlocks(node).find((block): block is MindMapTextContentBlock => block.type === "text");
    renderRichTextRuns(editor, firstText?.richText, firstText?.text ?? nodePlainText(node), false);

    let historyCaptured = false;
    const save = (): void => {
      const values = readRichTextEditor(editor!);
      if (!historyCaptured) {
        this.history.push(JSON.stringify(this.document));
        this.trimHistory();
        this.future = [];
        historyCaptured = true;
      }
      const blocks = nodeContentBlocks(node);
      let block = blocks.find((item): item is MindMapTextContentBlock => item.type === "text");
      if (!block) {
        block = { id: newId(), type: "text", text: "" };
        blocks.unshift(block);
      }
      block.text = values.text;
      block.richText = values.richText;
      node.content = blocks;
      syncNodeLegacyFields(node);
      if (node.id === this.document.root.id && values.text) this.document.title = values.text;
      this.callbacks.onChange(this.getDocument());
      this.markSaving();
      this.viewportEl.dispatchEvent(new CustomEvent("mms-inline-node-change", { detail: { nodeId } }));
    };
    let savedSelection: { start: number; end: number } | null = null;
    const rememberSelection = (): { start: number; end: number } | null => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return null;
      const range = selection.getRangeAt(0);
      if (!editor!.contains(range.commonAncestorContainer)) return null;
      const before = range.cloneRange();
      before.selectNodeContents(editor!);
      before.setEnd(range.startContainer, range.startOffset);
      savedSelection = { start: before.toString().length, end: before.toString().length + range.toString().length };
      return savedSelection;
    };
    const restoreSelection = (selected: { start: number; end: number }): void => {
      const walker = document.createTreeWalker(editor!, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      let offset = 0;
      let startNode: Node | null = null;
      let endNode: Node | null = null;
      let startOffset = 0;
      let endOffset = 0;
      while (node) {
        const length = node.textContent?.length ?? 0;
        if (!startNode && selected.start <= offset + length) {
          startNode = node;
          startOffset = Math.max(0, selected.start - offset);
        }
        if (!endNode && selected.end <= offset + length) {
          endNode = node;
          endOffset = Math.max(0, selected.end - offset);
          break;
        }
        offset += length;
        node = walker.nextNode();
      }
      if (!startNode || !endNode) return;
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    };
    const applyStyle = (patch: Partial<MindMapTextStyle>): void => {
      const selected = rememberSelection() ?? savedSelection;
      if (!selected || selected.start === selected.end) {
        new Notice("请先选择需要设置格式的文字");
        return;
      }
      save();
      const blocks = nodeContentBlocks(node);
      const block = blocks.find((item): item is MindMapTextContentBlock => item.type === "text");
      if (!block) return;
      const key = Object.keys(patch)[0] as keyof MindMapTextStyle;
      if (key !== "color") {
        const styles = richTextCharacterStyles(block.richText, block.text);
        const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
        patch = { [key]: !enabled };
      }
      block.richText = applyRichTextStyleRange(block.text, block.richText, selected.start, selected.end, patch);
      renderRichTextRuns(editor!, block.richText, block.text, false);
      save();
      editor!.focus();
      restoreSelection(selected);
    };
    const formatBar = nodeEl.createDiv({ cls: "mmc-inline-format-bar is-hidden" });
    const formatButton = (label: string, title: string, style: "bold" | "italic" | "underline"): void => {
      const button = formatBar.createEl("button", { text: label, attr: { type: "button", title, "aria-label": title } });
      button.addClass(`is-${style}`);
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        applyStyle({ [style]: true });
      });
    };
    formatButton("B", `加粗（${this.options.richTextShortcuts.bold}）`, "bold");
    formatButton("I", `斜体（${this.options.richTextShortcuts.italic}）`, "italic");
    formatButton("U", `下划线（${this.options.richTextShortcuts.underline}）`, "underline");
    const colorLabel = formatBar.createEl("label", { cls: "mmc-inline-format-color", attr: { title: "文字颜色" } });
    colorLabel.createSpan({ text: "A" });
    const color = colorLabel.createEl("input", { type: "color", attr: { "aria-label": "文字颜色" } });
    color.value = "#ef4444";
    color.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      rememberSelection();
    });
    color.addEventListener("input", () => applyStyle({ color: color.value }));
    color.addEventListener("change", () => {
      editor!.focus();
      if (savedSelection) restoreSelection(savedSelection);
    });
    const updateFormatBar = (): void => {
      const selected = rememberSelection();
      formatBar.toggleClass("is-hidden", !selected || selected.start === selected.end);
    };
    editor.addEventListener("mouseup", updateFormatBar);
    editor.addEventListener("keyup", updateFormatBar);
    const selectionChange = (): void => {
      if (document.activeElement === editor) updateFormatBar();
    };
    document.addEventListener("selectionchange", selectionChange);
    editor.addEventListener("input", save);
    let lastHandledShortcut = "";
    const handleFormatShortcut = (event: KeyboardEvent): boolean => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        save();
        editor!.blur();
        return true;
      }
      const command = this.shortcutMatches(event, this.options.richTextShortcuts.bold) ? "bold"
        : this.shortcutMatches(event, this.options.richTextShortcuts.italic) ? "italic"
          : this.shortcutMatches(event, this.options.richTextShortcuts.underline) ? "underline" : null;
      if (command) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        lastHandledShortcut = `${command}:${event.timeStamp}`;
        applyStyle({ [command]: true });
        return true;
      } else if (this.shortcutMatches(event, this.options.richTextShortcuts.color)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        lastHandledShortcut = `color:${event.timeStamp}`;
        rememberSelection();
        color.click();
        return true;
      } else if (event.key === "Escape") {
        event.preventDefault();
        editor!.blur();
      }
      return false;
    };
    editor.addEventListener("keydown", handleFormatShortcut, true);
    const windowShortcut = (event: KeyboardEvent): void => {
      if (document.activeElement === editor) handleFormatShortcut(event);
    };
    window.addEventListener("keydown", windowShortcut, true);
    const windowShortcutFallback = (event: KeyboardEvent): void => {
      if (document.activeElement !== editor) return;
      const handledAt = Number(lastHandledShortcut.split(":").at(-1) ?? 0);
      if (handledAt && event.timeStamp - handledAt < 1000) return;
      handleFormatShortcut(event);
    };
    window.addEventListener("keyup", windowShortcutFallback, true);
    editor.addEventListener("beforeinput", (event) => {
      const command = event.inputType === "formatBold" ? "bold"
        : event.inputType === "formatItalic" ? "italic"
          : event.inputType === "formatUnderline" ? "underline" : null;
      if (!command || lastHandledShortcut.startsWith(`${command}:`)) return;
      event.preventDefault();
      applyStyle({ [command]: true });
    });
    let editingFinished = false;
    editor.addEventListener("blur", (event) => {
      const related = event.relatedTarget;
      if (editingFinished || (related instanceof Node && (formatBar.contains(related)
        || document.querySelector(".mms-node-editor-right")?.contains(related)))) return;
      editingFinished = true;
      this.inlineEditingId = null;
      window.removeEventListener("keydown", windowShortcut, true);
      window.removeEventListener("keyup", windowShortcutFallback, true);
      document.removeEventListener("selectionchange", selectionChange);
      save();
      formatBar.remove();
      this.render();
    });
    const focusAtEnd = (): void => {
      if (!document.body.contains(editor!)) return;
      editor!.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor!);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    };
    focusAtEnd();
    if (this.options.nodeEditorPosition === "right") {
      window.requestAnimationFrame(focusAtEnd);
      window.setTimeout(focusAtEnd, 50);
    }
  }

  /**
   * 添加child，并保持模型、界面和持久化状态的一致性。
   */
  private addChild(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode() ?? this.document.root;
    const node = this.createConfiguredNode("");
    this.mutate(() => {
      selected.collapsed = false;
      selected.children.push(node);
      this.selectedId = node.id;
    });
    window.setTimeout(() => this.beginInlineEdit(node.id), 0);
  }

  /**
   * 添加sibling，并保持模型、界面和持久化状态的一致性。
   */
  private addSibling(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode();
    if (!selected || selected.id === this.document.root.id) {
      this.addChild();
      return;
    }
    const parent = findParent(this.document.root, selected.id);
    if (!parent) return;
    const node = this.createConfiguredNode("");
    this.mutate(() => {
      const index = parent.children.findIndex((child) => child.id === selected.id);
      parent.children.splice(index + 1, 0, node);
      this.selectedId = node.id;
    });
    window.setTimeout(() => this.beginInlineEdit(node.id), 0);
  }

  /**
   * 编辑selected，并保持模型、界面和持久化状态的一致性。
   */
  private editSelected(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode();
    if (!selected) return;
    let historyCaptured = false;
    const modal = new NodeEditModal(this.app, selected, this.options.defaultNodeShape, {
      resolveImage: this.callbacks.resolveImage,
      onSavePastedImage: this.callbacks.onSavePastedImage,
      getImageHosts: this.callbacks.getImageHosts,
      getDefaultUploadHostIds: this.callbacks.getDefaultUploadHostIds,
      onUploadImage: this.callbacks.onUploadImage,
      onReadImageSource: this.callbacks.onReadImageSource
    }, (values) => {
      // A continuously open editor may autosave many times. Capture one undo
      // snapshot for the whole editing session instead of one snapshot per keypress.
      if (!historyCaptured) {
        this.history.push(JSON.stringify(this.document));
        this.trimHistory();
        this.future = [];
        historyCaptured = true;
      }
      selected.content = values.content;
      syncNodeLegacyFields(selected);
      selected.note = values.note || undefined;
      selected.link = values.link || undefined;
      selected.icon = values.icon || undefined;
      selected.tags = values.tags.length ? values.tags : undefined;
      selected.task = values.task;
      selected.skipArticleNumbering = values.skipArticleNumbering || undefined;
      const style = {
        color: values.color,
        textColor: values.textColor,
        borderColor: values.borderColor,
        borderWidth: values.borderWidth,
        shape: values.shape,
        bold: values.bold,
        italic: values.italic,
        underline: values.underline,
        fontSize: values.fontSize,
        textAlign: values.textAlign,
        width: values.width,
        minHeight: values.minHeight
      };
      selected.style = Object.values(style).some((value) => value !== undefined) ? style : undefined;
      if (selected.id === this.document.root.id) {
        const title = nodePlainText(selected);
        if (title) this.document.title = title;
      }
      this.callbacks.onChange(this.getDocument());
      this.markSaving();
      if (this.inlineEditingId === selected.id) {
        const inline = this.nodesLayerEl.querySelector<HTMLElement>(
          `.mmc-node[data-node-id="${CSS.escape(selected.id)}"] .mmc-node-text.is-inline-editing`
        );
        const textBlock = nodeContentBlocks(selected).find((block): block is MindMapTextContentBlock => block.type === "text");
        if (inline && document.activeElement !== inline) renderRichTextRuns(inline, textBlock?.richText, textBlock?.text ?? "", false);
      } else {
        this.render();
      }
    }, this.options.nodeEditorPosition, this.viewportEl);
    modal.open();
    if (this.options.nodeEditorPosition === "right" && this.inlineEditingId === selected.id) {
      modal.releaseKeyboardScope();
    }
  }

  /**
   * 删除selected，并保持模型、界面和持久化状态的一致性。
   */
  private deleteSelected(): void {
    if (!this.ensureEditable()) return;
    const batch = Array.from(this.selectedIds)
      .filter((id) => id !== this.document.root.id)
      .filter((id, _index, ids) => {
        const node = findNode(this.document.root, id);
        return Boolean(node && !ids.some((otherId) => otherId !== id && node && containsNode(findNode(this.document.root, otherId) ?? this.document.root, id)));
      });
    if (batch.length > 1) {
      const fallback = findParent(this.document.root, this.selectedId)?.id ?? this.document.root.id;
      this.mutate(() => {
        for (const id of batch) removeNode(this.document.root, id);
        this.selectedIds.clear();
        this.selectedId = fallback;
        this.selectedIds.add(fallback);
      });
      new Notice(`已删除 ${batch.length} 个所选节点`);
      return;
    }
    const selected = this.selectedNode();
    if (!selected || selected.id === this.document.root.id) {
      new Notice("根节点不能删除");
      return;
    }
    const parent = findParent(this.document.root, selected.id);
    this.mutate(() => {
      removeNode(this.document.root, selected.id);
      this.selectedId = parent?.id ?? this.document.root.id;
      this.selectedIds.clear();
      this.selectedIds.add(this.selectedId);
    });
  }

  /**
   * 切换collapse，并保持模型、界面和持久化状态的一致性。
   */
  private toggleCollapse(): void {
    const selected = this.selectedNode();
    if (!selected || !selected.children.length) return;
    if (this.readOnly) {
      selected.collapsed = !selected.collapsed;
      this.render();
      return;
    }
    this.mutate(() => { selected.collapsed = !selected.collapsed; });
  }

  /**
   * Expands or collapses every branch while keeping the root visible.
   *
   * @param collapsed Whether branches should be collapsed.
   */
  private setAllNodesCollapsed(collapsed: boolean): void {
    const apply = (): void => {
      for (const node of flattenNodes(this.document.root)) {
        node.collapsed = node === this.document.root ? false : collapsed && node.children.length > 0;
      }
    };
    if (this.readOnly) {
      apply();
      this.render();
      return;
    }
    this.mutate(apply);
  }

  /**
   * 切换task，并保持模型、界面和持久化状态的一致性。
   */
  private cycleTask(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode();
    if (!selected) return;
    const next: Record<string, TaskStatus | undefined> = { "": "todo", todo: "doing", doing: "done", done: undefined };
    this.mutate(() => { selected.task = next[selected.task ?? ""]; });
  }

  /**
   * 切换layout，并保持模型、界面和持久化状态的一致性。
   */
  private toggleLayout(): void {
    if (!this.ensureEditable()) return;
    this.mutate(() => { this.document.layout = this.document.layout === "right" ? "balanced" : "right"; });
    window.setTimeout(() => this.fitToView(), 20);
  }

  /**
   * Switches the top-level article between its generated directory and original article content.
   */
  private toggleArticleLanding(): void {
    if (this.currentMode !== "article" || !this.options.showArticleToc) return;
    const current = this.document.view?.articleLandingMode ?? "toc";
    this.mutate(() => {
      this.document.view = { ...(this.document.view ?? {}), articleLandingMode: current === "toc" ? "article" : "toc" };
    });
  }

  /**
   * Opens article preset and typography controls for the current document.
   */
  private editArticleStyle(): void {
    if (!this.ensureEditable()) return;
    new ArticleStyleModal(this.app, this.document.articleStyle, (style) => {
      this.mutate(() => { this.document.articleStyle = style; });
    }).open();
  }

  /**
   * 编辑appearance，并保持模型、界面和持久化状态的一致性。
   */
  private editAppearance(): void {
    if (!this.ensureEditable()) return;
    new AppearanceModal(
      this.app,
      this.getAppearance(),
      (appearance) => this.mutate(() => { this.document.appearance = appearance; }),
      () => this.mutate(() => { this.document.appearance = undefined; })
    ).open();
  }

  /**
   * 编辑table，并保持模型、界面和持久化状态的一致性。
   */
  private editTable(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode() ?? this.document.root;
    new TableEditModal(this.app, selected.table, (table) => {
      this.mutate(() => { selected.table = table; });
    }).open();
  }

  /**
   * 转换children to table，并保持模型、界面和持久化状态的一致性。
   */
  private convertChildrenToTable(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode() ?? this.document.root;
    const table = childrenToTable(selected);
    if (!table) { new Notice("当前节点没有可转换的子节点"); return; }
    this.mutate(() => {
      selected.table = table;
      selected.collapsed = true;
    });
    new Notice("已生成子节点表格；原子节点已保留并收起");
  }

  /**
   * 删除table，并保持模型、界面和持久化状态的一致性。
   */
  private removeTable(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode();
    if (!selected?.table) return;
    this.mutate(() => {
      selected.table = undefined;
      if (selected.children.length) selected.collapsed = false;
    });
  }

  /**
   * 编辑code，并保持模型、界面和持久化状态的一致性。
   */
  private editCode(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode() ?? this.document.root;
    new CodeEditModal(this.app, selected.code, (code) => {
      this.mutate(() => { selected.code = code; });
    }).open();
  }

  /**
   * 删除code，并保持模型、界面和持久化状态的一致性。
   */
  private removeCode(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode();
    if (!selected?.code) return;
    this.mutate(() => { selected.code = undefined; });
  }

  /**
   * 如果节点已有子导图则打开；否则创建独立 .mindmap 文件并在父节点与子文件导航元数据中建立双向关系。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private async createOrOpenSubmap(): Promise<void> {
    const selected = this.selectedNode() ?? this.document.root;
    if (selected.submap) {
      await this.callbacks.onOpenMindMap(selected.submap.path);
      return;
    }
    if (!this.ensureEditable()) return;
    try {
      const submap = await this.callbacks.onCreateSubmap(selected);
      this.mutate(() => { selected.submap = submap; });
      await this.callbacks.onOpenMindMap(submap.path);
    } catch (error) {
      console.error("MindMap Studio create submap failed", error);
      new Notice("创建子导图失败");
    }
  }

  /**
   * Renders every map in the current parent/child family as one continuous,
   * read-only book with an integrated directory and persisted progress.
   */
  private renderReading(): void {
    this.articleEl.empty();
    const sections = this.options.readingSections.length
      ? this.options.readingSections
      : [{ filePath: this.options.articleNavigation?.homePath ?? "", document: this.document, baseDepth: 0 }];
    const style = resolveArticleStyle(this.document.articleStyle);
    const progress = this.articleEl.createDiv({ cls: `mms-reading-progress position-${this.options.readingProgressPosition}` });
    progress.createDiv({ cls: "mms-reading-progress-bar" });
    const initialProgress = `${Math.round(this.options.readingProgress * 100)}%`;
    progress.style.setProperty("--mms-reading-progress", initialProgress);
    progress.dataset.progress = initialProgress;
    progress.createSpan({ text: `阅读进度 ${initialProgress}` });
    const page = this.articleEl.createDiv({ cls: `mms-article-page mms-reading-page article-${style.preset}` });
    page.createEl("h1", { cls: "mms-article-document-title", text: nodePrimaryText(sections[0]!.document.root) || sections[0]!.document.title });

    const toc = page.createEl("nav", { cls: "mms-article-toc mms-reading-toc" });
    toc.createEl("h2", { text: "全书目录" });
    const tocList = toc.createEl("ol");
    for (const entry of this.options.articleTocEntries.filter((item) => item.depth <= this.options.articleTocMaxDepth)) {
      const fileKey = entry.filePath.replace(/[^a-zA-Z0-9_-]/g, "-");
      const anchor = entry.nodeId
        ? `reading-${fileKey}-${entry.nodeId.replace(/[^a-zA-Z0-9_-]/g, "-")}`
        : `reading-file-${fileKey}`;
      const item = tocList.createEl("li");
      item.addClass(`depth-${Math.min(entry.depth, 8)}`);
      const link = item.createEl("a", { text: entry.displayTitle || entry.title, href: `#${anchor}` });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        page.querySelector<HTMLElement>(`#${CSS.escape(anchor)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    for (const section of sections) {
      const anchor = `reading-file-${section.filePath.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
      const chapter = page.createEl("article", { cls: "mms-reading-book-section" });
      chapter.id = anchor;
      chapter.createEl("h2", { cls: "mms-reading-map-title", text: nodePrimaryText(section.document.root) || section.document.title });
      this.renderArticleContent(chapter, section.document.root, false);
      for (const info of buildArticleNodeInfo(section.document.root, section.baseDepth)) {
        const nodeSection = chapter.createEl("section", { cls: `mms-article-node depth-${Math.min(info.depth, 8)}` });
        nodeSection.id = `reading-${section.filePath.replace(/[^a-zA-Z0-9_-]/g, "-")}-${info.node.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
        if (info.isHeading) {
          const level = Math.min(6, info.depth + 1);
          nodeSection.createEl(`h${level}` as keyof HTMLElementTagNameMap, { text: info.displayTitle || info.title });
          this.renderArticleContent(nodeSection, info.node, false);
        } else {
          const firstTextBlock = nodeContentBlocks(info.node).find((block): block is MindMapTextContentBlock => block.type === "text");
          if (firstTextBlock) {
            const paragraph = nodeSection.createEl("p", { cls: "mms-article-leaf-text" });
            renderRichTextRuns(paragraph, firstTextBlock.richText, firstTextBlock.text);
            this.markWrappedArticleParagraph(paragraph);
          }
          this.renderArticleContent(nodeSection, info.node, false);
        }
      }
    }

    window.setTimeout(() => {
      const maximum = Math.max(0, this.articleEl.scrollHeight - this.articleEl.clientHeight);
      this.articleEl.scrollTop = maximum * this.options.readingProgress;
    }, 20);
    this.articleEl.onscroll = () => {
      const maximum = Math.max(1, this.articleEl.scrollHeight - this.articleEl.clientHeight);
      const next = Math.max(0, Math.min(1, this.articleEl.scrollTop / maximum));
      const nextProgress = `${Math.round(next * 100)}%`;
      progress.style.setProperty("--mms-reading-progress", nextProgress);
      progress.dataset.progress = nextProgress;
      progress.lastElementChild?.replaceChildren(`阅读进度 ${nextProgress}`);
      if (this.readingProgressTimer !== null) window.clearTimeout(this.readingProgressTimer);
      this.readingProgressTimer = window.setTimeout(() => {
        this.readingProgressTimer = null;
        const homePath = this.options.articleNavigation?.homePath ?? sections[0]?.filePath ?? "";
        if (homePath) void this.callbacks.onReadingProgressChange(homePath, next);
      }, 500);
    };
  }

  /**
   * Deletes the selected node's submap file when present and clears stale
   * links when the file was already removed outside the plugin.
   */
  private async deleteSelectedSubmap(): Promise<void> {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode();
    if (!selected?.submap) return;
    const confirmed = window.confirm(`删除子导图“${selected.submap.title ?? selected.submap.path}”及其链接？\n如果文件已不存在，将只移除失效链接。`);
    if (!confirmed) return;
    const submap = { ...selected.submap };
    try {
      const deleted = await this.callbacks.onDeleteSubmap(submap);
      this.mutate(() => { selected.submap = undefined; });
      new Notice(deleted ? "已删除子导图并移除链接" : "子导图文件不存在，已移除失效链接");
    } catch (error) {
      console.error("MindMap Studio delete submap failed", error);
      new Notice("删除子导图失败");
    }
  }

  /**
   * 渲染node table，并保持模型、界面和持久化状态的一致性。
   *
   * @param content 该参数用于 render node table 流程中的输入或控制。
   * @param node 当前处理的节点。
   */
  private renderNodeTable(content: HTMLElement, node: MindMapNode): void {
    if (!node.table) return;
    const wrap = content.createDiv({ cls: "mmc-node-table-wrap" });
    const table = wrap.createEl("table", { cls: "mmc-node-table" });
    const head = table.createEl("thead").createEl("tr");
    node.table.headers.forEach((header, index) => {
      const cell = head.createEl("th", { text: header || `列 ${index + 1}` });
      cell.style.textAlign = node.table?.alignments?.[index] ?? "left";
    });
    const body = table.createEl("tbody");
    node.table.rows.forEach((row) => {
      const tr = body.createEl("tr");
      node.table!.headers.forEach((_, index) => {
        const cell = tr.createEl("td", { text: row[index] ?? "" });
        cell.style.textAlign = node.table?.alignments?.[index] ?? "left";
      });
    });
    wrap.addEventListener("pointerdown", (event) => event.stopPropagation());
    wrap.addEventListener("dragstart", (event) => event.preventDefault());
    wrap.addEventListener("dblclick", (event) => { event.stopPropagation(); this.selectNode(node.id); this.editTable(); });
  }

  /**
   * 渲染node code，并保持模型、界面和持久化状态的一致性。
   *
   * @param content 该参数用于 render node code 流程中的输入或控制。
   * @param node 当前处理的节点。
   */
  private renderNodeCode(content: HTMLElement, node: MindMapNode): void {
    if (!node.code) return;
    const block = content.createDiv({ cls: "mmc-code-block" });
    const header = block.createDiv({ cls: "mmc-code-header" });
    header.createSpan({ text: node.code.language || "code" });
    const copy = header.createEl("button", { cls: "clickable-icon", attr: { "aria-label": "复制代码" } });
    setIcon(copy, "copy");
    copy.addEventListener("click", (event) => {
      event.stopPropagation();
      void navigator.clipboard.writeText(node.code!.code).then(() => new Notice("代码已复制"));
    });
    const rendered = block.createDiv({ cls: "mmc-code-rendered markdown-rendered" });
    void this.callbacks.onRenderCode(node.code, rendered);
    block.addEventListener("pointerdown", (event) => event.stopPropagation());
    block.addEventListener("dragstart", (event) => event.preventDefault());
    block.addEventListener("dblclick", (event) => { event.stopPropagation(); this.selectNode(node.id); this.editCode(); });
  }

  /**
   * 处理编辑器内粘贴：优先识别图片并保存为本地资源，其次识别表格、代码块、JSON 分支或普通文本。图片可按设置进入延迟自动上传流程。
   *
   * @param event 触发当前交互的浏览器或 Obsidian 事件。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private async handlePaste(event: ClipboardEvent): Promise<void> {
    if (this.readOnly) return;
    const target = event.target as HTMLElement;
    if (target.matches("input, textarea, select, [contenteditable='true']")) return;
    const data = event.clipboardData;
    if (!data) return;
    const imageItem = Array.from(data.items).find((item) => item.kind === "file" && item.type.startsWith("image/"));
    if (imageItem) {
      const blob = imageItem.getAsFile();
      if (!blob) return;
      event.preventDefault();
      const selected = this.selectedNode() ?? this.document.root;
      try {
        const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
        const filename = `mindmap-image.${extension}`;
        const path = await this.callbacks.onSavePastedImage(blob, filename);
        const imageBlock: MindMapImageContentBlock = { id: newId(), type: "image", source: path, localSource: path };
        this.mutate(() => {
          const blocks = nodeContentBlocks(selected);
          blocks.push(imageBlock);
          selected.content = blocks;
          syncNodeLegacyFields(selected);
        });
        const scheduled = this.callbacks.onScheduleAutoUpload(selected.id, imageBlock.id, path, filename);
        new Notice(scheduled ? `图片已保存，等待自动上传：${path}` : `图片已保存：${path}`);
      } catch (error) {
        console.error("MindMap Studio paste image failed", error);
        new Notice("粘贴图片失败");
      }
      return;
    }

    const htmlBranch = parseClipboardHtml(data.getData("text/html"));
    const text = data.getData("text/plain");
    if (!text.trim() && !htmlBranch) return;
    const selected = this.selectedNode() ?? this.document.root;
    const table = parseMarkdownTable(text);
    if (table) {
      event.preventDefault();
      this.mutate(() => { selected.table = table; });
      new Notice("已识别并插入 Markdown 表格");
      return;
    }
    const code = parseFencedCode(text);
    if (code) {
      event.preventDefault();
      this.mutate(() => { selected.code = code; });
      new Notice(`已识别并插入${code.language ? ` ${code.language}` : ""}代码`);
      return;
    }
    const branch = htmlBranch ?? parseClipboardNode(text);
    if (branch) {
      event.preventDefault();
      const clone = cloneNodeWithFreshIds(branch);
      this.mutate(() => { selected.collapsed = false; selected.children.push(clone); this.selectedId = clone.id; });
    }
  }

  /**
   * 打开selected link，并保持模型、界面和持久化状态的一致性。
   */
  private openSelectedLink(): void {
    const selected = this.selectedNode();
    if (!selected) return;
    const link = this.getNodeLink(selected);
    if (!link) {
      new Notice("当前节点没有链接；可按 F2 添加链接或在文字中写入 [[笔记名]]");
      return;
    }
    void this.callbacks.onOpenLink(link);
  }

  /**
   * 判断parent navigation backlink，并保持模型、界面和持久化状态的一致性。
   *
   * @param node 当前处理的节点。
   * @returns 操作条件是否成立或处理是否成功。
   */
  private isParentNavigationBacklink(node: MindMapNode): boolean {
    const navigation = this.document.navigation;
    if (!navigation?.parentPath) return false;
    if (node.id !== this.document.root.id) return false;
    const explicit = node.link?.trim();
    if (!explicit) return false;
    const candidate = explicit.startsWith("[[") ? extractFirstWikiLink(explicit) : explicit.split("|")[0]?.split("#")[0]?.trim();
    if (!candidate) return false;
    return candidate === navigation.parentPath;
  }

  /**
   * 读取并返回node link，并保持模型、界面和持久化状态的一致性。
   *
   * @param node 当前处理的节点。
   * @returns 计算、解析或序列化后的字符串结果。
   */
  private getNodeLink(node: MindMapNode): string | null {
    const explicit = node.link?.trim();
    if (explicit && !this.isParentNavigationBacklink(node)) return explicit;
    return extractFirstWikiLink(nodePlainText(node)) || extractFirstWikiLink(node.note ?? "");
  }

  /**
   * 执行“show outline”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  private showOutline(): void {
    const markdown = documentToMarkdown(this.document);
    new OutlineModal(this.app, markdown, () => void this.callbacks.onExportMarkdown(markdown)).open();
  }

  /**
   * 执行“show json transfer”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  private showJsonTransfer(): void {
    if (!this.ensureEditable()) return;
    new JsonTransferModal(
      this.app,
      this.getDocument(),
      (document) => this.replaceDocument(document),
      (json) => void this.callbacks.onExportJson(json)
    ).open();
  }

  /**
   * Opens the HTML, Word, PDF, and Markdown export chooser.
   */
  private showDocumentExport(): void {
    new DocumentExportModal(this.app, (format) => {
      void this.callbacks.onExportDocument(format);
    }).open();
  }

  /**
   * 打开search，并保持模型、界面和持久化状态的一致性。
   */
  private openSearch(): void {
    this.callbacks.onSearchMapFamily();
  }

  /**
   * 定位指定节点。必要时先展开全部祖先、切换到可显示该节点的视图并重渲染，然后选中节点并将其平滑移动到可视区域中央。
   *
   * @param id 目标对象或节点的稳定标识。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private focusNode(id: string): void {
    const ancestors = findAncestors(this.document.root, id);
    const collapsed = ancestors.filter((node) => node.collapsed);
    if (collapsed.length) {
      if (this.readOnly) collapsed.forEach((node) => { node.collapsed = false; });
      else this.mutate(() => collapsed.forEach((node) => { node.collapsed = false; }));
    }
    this.selectedId = id;
    this.render();
    window.setTimeout(() => {
      if (this.currentMode === "mindmap") this.centerNode(id);
      else {
        const selector = this.currentMode === "outline"
          ? `.mms-outline-row[data-node-id="${CSS.escape(id)}"]`
          : `.mms-article-node[data-node-id="${CSS.escape(id)}"]`;
        this.rootEl.querySelector<HTMLElement>(selector)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 20);
  }

  /**
   * 定位node，并保持模型、界面和持久化状态的一致性。
   *
   * @param id 目标对象或节点的稳定标识。
   */
  private centerNode(id: string): void {
    if (this.currentMode !== "mindmap") return;
    const position = this.layout.byId.get(id);
    if (!position) return;
    this.panX = -position.x * this.zoom;
    this.panY = -position.y * this.zoom;
    this.applyTransform();
  }

  /**
   * 打开context menu，并保持模型、界面和持久化状态的一致性。
   *
   * @param event 触发当前交互的浏览器或 Obsidian 事件。
   */
  private openContextMenu(event: MouseEvent): void {
    const selected = this.selectedNode();
    const menu = new Menu();
    if (this.readOnly) {
      if (selected?.submap) menu.addItem((item) => item.setTitle("进入子导图").setIcon("network").onClick(() => void this.createOrOpenSubmap()));
      menu.addItem((item) => item.setTitle("打开链接").setIcon("link").onClick(() => this.openSelectedLink()));
      menu.addItem((item) => item.setTitle("复制分支").setIcon("copy").onClick(() => void this.copySelectedBranch()));
      menu.showAtMouseEvent(event);
      return;
    }
    menu.addItem((item) => item.setTitle("添加子节点").setIcon("plus-circle").onClick(() => this.addChild()));
    menu.addItem((item) => item.setTitle("添加同级节点").setIcon("list-plus").onClick(() => this.addSibling()));
    menu.addItem((item) => item.setTitle("编辑节点").setIcon("pencil").onClick(() => this.editSelected()));
    if (selected?.style?.width !== undefined || selected?.style?.minHeight !== undefined) {
      menu.addItem((item) => item.setTitle("恢复节点自动大小").setIcon("maximize-2").onClick(() => {
        if (!selected) return;
        this.mutate(() => {
          const next = { ...(selected.style ?? {}), width: undefined, minHeight: undefined };
          selected.style = Object.values(next).some((value) => value !== undefined) ? next : undefined;
        });
      }));
    }
    menu.addItem((item) => item.setTitle("克隆分支").setIcon("copy-plus").onClick(() => this.duplicateSelected()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle(selected?.table ? "编辑表格" : "插入表格").setIcon("table-2").onClick(() => this.editTable()));
    menu.addItem((item) => item.setTitle("插入 LaTeX 公式").setIcon("sigma").onClick(() => this.insertFormula()));
    menu.addItem((item) => item.setTitle("将子节点生成表格").setIcon("table-properties").onClick(() => this.convertChildrenToTable()));
    if (selected?.table) menu.addItem((item) => item.setTitle("移除表格").setIcon("table-2").onClick(() => this.removeTable()));
    menu.addItem((item) => item.setTitle(selected?.code ? "编辑代码" : "插入代码").setIcon("code-2").onClick(() => this.editCode()));
    if (selected?.code) menu.addItem((item) => item.setTitle("移除代码").setIcon("eraser").onClick(() => this.removeCode()));
    menu.addItem((item) => item.setTitle(selected?.submap ? "进入子导图" : "创建子导图").setIcon("network").onClick(() => void this.createOrOpenSubmap()));
    if (selected?.submap) menu.addItem((item) => item.setTitle("删除子导图 / 移除链接").setIcon("unlink").onClick(() => void this.deleteSelectedSubmap()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("复制分支").setIcon("copy").onClick(() => void this.copySelectedBranch()));
    menu.addItem((item) => item.setTitle("粘贴为子节点").setIcon("clipboard-paste").onClick(() => void this.pasteAsChild()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle(`任务状态：${selected?.task === "done" ? "已完成" : selected?.task === "doing" ? "进行中" : selected?.task === "todo" ? "待办" : "无"}`).setIcon("circle-check-big").onClick(() => this.cycleTask()));
    menu.addItem((item) => item
      .setTitle(selected?.skipArticleNumbering ? "文章模式：恢复自动编号" : "文章模式：不参与自动编号")
      .setIcon("list-ordered")
      .onClick(() => { if (selected) this.mutate(() => { selected.skipArticleNumbering = selected.skipArticleNumbering ? undefined : true; }); }));
    menu.addItem((item) => item.setTitle("展开/收起").setIcon("fold-vertical").onClick(() => this.toggleCollapse()));
    menu.addItem((item) => item.setTitle("打开链接").setIcon("link").onClick(() => this.openSelectedLink()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("删除节点").setIcon("trash-2").onClick(() => this.deleteSelected()));
    menu.showAtMouseEvent(event);
  }

  /**
   * Opens the canvas and toolbar context menu for global branch visibility.
   *
   * @param event Mouse event used to position the menu.
   */
  private openAllNodesContextMenu(event: MouseEvent): void {
    const menu = new Menu();
    menu.addItem((item) => item
      .setTitle("展开所有节点")
      .setIcon("unfold-vertical")
      .onClick(() => this.setAllNodesCollapsed(false)));
    menu.addItem((item) => item
      .setTitle("收起所有节点")
      .setIcon("fold-vertical")
      .onClick(() => this.setAllNodesCollapsed(true)));
    menu.showAtMouseEvent(event);
  }

  /**
   * 打开图形化公式编辑器并把生成的公式追加到当前节点。
   */
  private insertFormula(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode() ?? this.document.root;
    new FormulaEditModal(this.app, (source) => {
      this.mutate(() => {
        const blocks = nodeContentBlocks(selected);
        const formula = `$$${source}$$`;
        const emptyText = blocks.find((block): block is MindMapTextContentBlock => block.type === "text" && !block.text.trim());
        if (emptyText) {
          emptyText.text = formula;
          emptyText.richText = undefined;
        } else {
          blocks.push({ id: newId(), type: "text", text: formula });
        }
        selected.content = blocks;
        syncNodeLegacyFields(selected);
      });
    }).open();
  }

  /**
   * 复制selected branch，并保持模型、界面和持久化状态的一致性。
   * @returns 操作条件是否成立或处理是否成功。
   */
  private async copySelectedBranch(): Promise<boolean> {
    const selected = this.selectedNode();
    if (!selected) return false;
    this.branchClipboard = cloneDocument({ version: 10, title: nodePlainText(selected) || "图片节点", layout: "right", theme: "auto", root: selected }).root;
    const payload = JSON.stringify({ type: "mindmap-studio-node", version: 1, node: selected }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      new Notice("已复制节点分支");
    } catch {
      new Notice("节点分支已复制到插件内部剪贴板");
    }
    return true;
  }

  /**
   * 粘贴as child，并保持模型、界面和持久化状态的一致性。
   */
  private async pasteAsChild(): Promise<void> {
    const selected = this.selectedNode() ?? this.document.root;
    let sourceNode: MindMapNode | null = null;
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) sourceNode = parseClipboardNode(text);
    } catch {
      // Browser clipboard permission can be unavailable; use internal clipboard.
    }
    sourceNode ??= this.branchClipboard;
    if (!sourceNode) {
      new Notice("剪贴板中没有可粘贴的 MindMap 节点");
      return;
    }
    const clone = cloneNodeWithFreshIds(sourceNode);
    this.mutate(() => {
      selected.collapsed = false;
      selected.children.push(clone);
      this.selectedId = clone.id;
    });
  }

  /**
   * 复制生成selected，并保持模型、界面和持久化状态的一致性。
   */
  private duplicateSelected(): void {
    if (!this.ensureEditable()) return;
    const selected = this.selectedNode();
    if (!selected || selected.id === this.document.root.id) {
      new Notice("请选择非根节点后克隆分支");
      return;
    }
    const parent = findParent(this.document.root, selected.id);
    if (!parent) return;
    const clone = cloneNodeWithFreshIds(selected);
    this.mutate(() => {
      const index = parent.children.findIndex((child) => child.id === selected.id);
      parent.children.splice(index + 1, 0, clone);
      this.selectedId = clone.id;
    });
  }

  /**
   * 判断reparent，并保持模型、界面和持久化状态的一致性。
   *
   * @param draggedId 该参数用于 can reparent 流程中的输入或控制。
   * @param targetId 该参数用于 can reparent 流程中的输入或控制。
   * @returns 操作条件是否成立或处理是否成功。
   */
  private canMoveNode(draggedId: string | null, targetId: string): boolean {
    if (!draggedId || draggedId === this.document.root.id || draggedId === targetId) return false;
    const candidateIds = this.selectedIds.has(draggedId) && this.selectedIds.size > 1
      ? Array.from(this.selectedIds)
      : [draggedId];
    if (candidateIds.includes(targetId) || candidateIds.includes(this.document.root.id)) return false;
    return candidateIds.every((id) => {
      const dragged = findNode(this.document.root, id);
      return Boolean(dragged && !containsNode(dragged, targetId));
    });
  }

  /**
   * 根据指针在目标节点的位置判断拖放意图。右侧和中间均成为子级；根节点仅接受子节点放置。
   *
   * @param event 当前拖放事件。
   * @param targetEl 目标节点 DOM。
   * @param targetId 目标节点标识。
   * @returns 右侧 28% 或中间区域为 child，上方 28% 为 before，下方 28% 为 after。
   */
  private dropPositionForEvent(event: DragEvent, targetEl: HTMLElement, targetId: string): NodeDropPosition {
    if (targetId === this.document.root.id) return "child";
    const rect = targetEl.getBoundingClientRect();
    if (this.isRightChildDrop(event, targetEl)) return "child";
    const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : .5;
    if (ratio < .28) return "before";
    if (ratio > .72) return "after";
    return "child";
  }

  /**
   * Checks whether the pointer is in the explicit right-side child drop zone.
   *
   * @param event Current drag event.
   * @param targetEl Target node element.
   * @returns Whether the rightmost 28% is active.
   */
  private isRightChildDrop(event: DragEvent, targetEl: HTMLElement): boolean {
    const rect = targetEl.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : .5;
    return ratio > .72;
  }

  /** 清理全部拖放目标样式，防止跨节点移动时残留指示线。 */
  private clearDropIndicators(): void {
    this.nodesLayerEl.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-child, .is-drop-child-right, .is-drop-after")
      .forEach((element) => element.removeClasses(["is-drop-target", "is-drop-before", "is-drop-child", "is-drop-child-right", "is-drop-after"]));
  }

  /**
   * Renders a magnetic placeholder at the exact location represented by the
   * current before, child, or after drop zone.
   *
   * @param targetId Drop target node identifier.
   * @param position Relative drop position.
   */
  private showDropPreview(targetId: string, position: NodeDropPosition): void {
    const target = this.layout.byId.get(targetId);
    const dragged = this.draggingId ? this.layout.byId.get(this.draggingId) : null;
    if (!target || !dragged) return;
    if (this.dropPreviewEl?.dataset.targetId === targetId && this.dropPreviewEl.dataset.position === position) return;
    this.clearDropPreview();
    const selectedCount = this.selectedIds.has(dragged.node.id) ? this.selectedIds.size : 1;
    const preview = this.nodesLayerEl.createDiv({ cls: `mmc-drop-preview is-${position}` });
    preview.dataset.targetId = targetId;
    preview.dataset.position = position;
    const width = Math.min(260, Math.max(100, dragged.width));
    const height = Math.min(72, Math.max(38, dragged.height));
    let x = target.x;
    let y = target.y;
    if (position === "before") y -= target.height / 2 + height / 2 + 12;
    if (position === "after") y += target.height / 2 + height / 2 + 12;
    if (position === "child") {
      const side = target.side === -1 ? -1 : 1;
      const gap = this.getAppearance().nodeVisualStyle === "branch" ? 54 : 112;
      x += side * (target.width / 2 + gap + width / 2);
    }
    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;
    preview.style.width = `${width}px`;
    preview.style.height = `${height}px`;
    preview.createSpan({
      cls: "mmc-drop-preview-label",
      text: selectedCount > 1 ? `移动 ${selectedCount} 个节点` : nodePrimaryText(dragged.node) || "节点"
    });
    preview.createSpan({
      cls: "mmc-drop-preview-hint",
      text: position === "child" ? "作为子节点" : position === "before" ? "插入到上方" : "插入到下方"
    });
    this.dropPreviewEl = preview;
  }

  /** Removes the temporary magnetic drop placeholder. */
  private clearDropPreview(): void {
    this.dropPreviewEl?.remove();
    this.dropPreviewEl = null;
  }

  /**
   * 在统一编辑事务中移动节点，支持同级前后排序和改变父子关系。
   *
   * @param draggedId 被移动节点标识。
   * @param targetId 目标节点标识。
   * @param position 相对目标节点的放置位置。
   */
  private moveNode(draggedId: string, targetId: string, position: NodeDropPosition): void {
    if (!this.ensureEditable() || !this.canMoveNode(draggedId, targetId)) return;
    const requestedIds = this.selectedIds.has(draggedId) && this.selectedIds.size > 1
      ? new Set(this.selectedIds)
      : new Set([draggedId]);
    const draggedIds = flattenNodes(this.document.root)
      .filter((node) => requestedIds.has(node.id))
      .filter((node) => !findAncestors(this.document.root, node.id).some((ancestor) => requestedIds.has(ancestor.id)))
      .map((node) => node.id);
    if (!draggedIds.length) return;
    const snapshot = JSON.stringify(this.document);
    const moveOrder = position === "after" ? [...draggedIds].reverse() : draggedIds;
    let changed = false;
    for (const id of moveOrder) {
      changed = moveNodeRelative(this.document.root, id, targetId, position) || changed;
    }
    if (!changed) return;
    this.history.push(snapshot);
    this.trimHistory();
    this.future = [];
    this.selectedId = draggedId;
    this.selectedIds.clear();
    for (const id of requestedIds) this.selectedIds.add(id);
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }

  /**
   * 替换document，并保持模型、界面和持久化状态的一致性。
   *
   * @param document 要处理的思维导图文档。
   */
  private replaceDocument(document: MindMapDocument): void {
    if (!this.ensureEditable()) return;
    this.history.push(JSON.stringify(this.document));
    this.trimHistory();
    this.future = [];
    this.document = cloneDocument(document);
    this.selectedId = this.document.root.id;
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
    window.setTimeout(() => this.fitToView(), 20);
  }

  /**
   * 所有用户可撤销写操作的统一入口。调用前克隆当前文档写入撤销栈，执行修改，规范化和重渲染，再通知视图自动保存；只读状态会在更上层阻止进入该流程。
   *
   * @param action 该参数用于 mutate 流程中的输入或控制。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private mutate(action: () => void): void {
    if (!this.ensureEditable()) return;
    this.history.push(JSON.stringify(this.document));
    this.trimHistory();
    this.future = [];
    action();
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }

  /**
   * 裁剪history，并保持模型、界面和持久化状态的一致性。
   */
  private trimHistory(): void {
    const limit = Math.max(10, Math.min(500, this.options.historyLimit));
    while (this.history.length > limit) this.history.shift();
  }

  /**
   * 撤销相关数据，并保持模型、界面和持久化状态的一致性。
   */
  private undo(): void {
    if (!this.ensureEditable()) return;
    const previous = this.history.pop();
    if (!previous) return;
    this.future.push(JSON.stringify(this.document));
    this.document = JSON.parse(previous) as MindMapDocument;
    this.selectedId = this.document.root.id;
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }

  /**
   * 重做相关数据，并保持模型、界面和持久化状态的一致性。
   */
  private redo(): void {
    if (!this.ensureEditable()) return;
    const next = this.future.pop();
    if (!next) return;
    this.history.push(JSON.stringify(this.document));
    this.trimHistory();
    this.document = JSON.parse(next) as MindMapDocument;
    this.selectedId = this.document.root.id;
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }

  /**
   * 执行“fit to view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  private fitToView(): void {
    const rect = this.viewportEl.getBoundingClientRect();
    const width = Math.max(1, this.layout.maxX - this.layout.minX + 100);
    const height = Math.max(1, this.layout.maxY - this.layout.minY + 100);
    this.zoom = this.clampZoom(Math.min((rect.width - 40) / width, (rect.height - 40) / height, 1.25));
    const centerX = (this.layout.minX + this.layout.maxX) / 2;
    const centerY = (this.layout.minY + this.layout.maxY) / 2;
    this.panX = -centerX * this.zoom;
    this.panY = -centerY * this.zoom;
    this.applyTransform();
  }

  /**
   * 更新并应用zoom，并保持模型、界面和持久化状态的一致性。
   *
   * @param value 待校验、转换或比较的输入值。
   */
  private setZoom(value: number): void {
    this.zoom = this.clampZoom(value);
    this.applyTransform();
  }

  /**
   * 执行“clamp zoom”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param value 待校验、转换或比较的输入值。
   * @returns 计算得到的数值结果。
   */
  private clampZoom(value: number): number {
    return Math.min(2.5, Math.max(0.2, value));
  }

  /**
   * 执行“navigate selection”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param direction 该参数用于 navigate selection 流程中的输入或控制。
   */
  private navigateSelection(direction: "parent" | "child" | "previous" | "next"): void {
    const selected = this.selectedNode() ?? this.document.root;
    let target: MindMapNode | null = null;
    if (direction === "parent") target = findParent(this.document.root, selected.id);
    if (direction === "child") target = selected.children[0] ?? null;
    if (direction === "previous" || direction === "next") {
      const parent = findParent(this.document.root, selected.id);
      if (parent) {
        const index = parent.children.findIndex((child) => child.id === selected.id);
        const offset = direction === "previous" ? -1 : 1;
        target = parent.children[index + offset] ?? null;
      }
    }
    if (target) {
      this.selectNode(target.id);
      this.centerNode(target.id);
    }
  }

  /**
   * 处理keydown，并保持模型、界面和持久化状态的一致性。
   *
   * @param event 触发当前交互的浏览器或 Obsidian 事件。
   */
  private handleKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target.matches("input, textarea, select, [contenteditable='true']")) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (mod && key === "s") {
      event.preventDefault();
      this.callbacks.onChange(this.getDocument());
      this.markSaving();
      return;
    }
    if (mod && event.shiftKey && key === "f") {
      event.preventDefault();
      this.callbacks.onGlobalSearch();
      return;
    }
    if (mod && key === "f") {
      event.preventDefault();
      this.openSearch();
      return;
    }
    if (this.currentMode === "article" && event.key === "Escape" && this.options.articleNavigation?.parentPath) {
      event.preventDefault();
      void this.callbacks.onOpenMindMap(this.options.articleNavigation.parentPath);
      return;
    }
    if (this.readOnly) {
      if (mod && key === "c") {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString()) return;
        event.preventDefault();
        void this.copySelectedBranch();
        return;
      }
      if (["arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
        event.preventDefault();
        const direction = key === "arrowleft" ? "parent" : key === "arrowright" ? "child" : key === "arrowup" ? "previous" : "next";
        this.navigateSelection(direction);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault(); this.setZoom(this.zoom * 1.15);
      } else if (event.key === "-") {
        event.preventDefault(); this.setZoom(this.zoom / 1.15);
      } else if (mod && key === "0") {
        event.preventDefault(); this.fitToView();
      } else if (event.key === " ") {
        event.preventDefault(); this.toggleCollapse();
      }
      return;
    }
    if (mod && key === "d") {
      event.preventDefault();
      this.duplicateSelected();
      return;
    }
    if (mod && key === "c") {
      event.preventDefault();
      void this.copySelectedBranch();
      return;
    }
    if (mod && key === "x") {
      event.preventDefault();
      void this.copySelectedBranch().then((copied) => { if (copied) this.deleteSelected(); });
      return;
    }
    if (mod && event.key === "Enter") {
      event.preventDefault();
      this.cycleTask();
      return;
    }
    if (mod && key === "z" && !event.shiftKey) {
      event.preventDefault();
      this.undo();
      return;
    }
    if ((mod && key === "y") || (mod && event.shiftKey && key === "z")) {
      event.preventDefault();
      this.redo();
      return;
    }

    switch (event.key) {
      case "Tab":
        event.preventDefault();
        this.addChild();
        break;
      case "Enter":
        event.preventDefault();
        this.addSibling();
        break;
      case "Delete":
      case "Backspace":
        event.preventDefault();
        this.deleteSelected();
        break;
      case "F2":
        event.preventDefault();
        this.editSelected();
        break;
      case " ":
        event.preventDefault();
        this.toggleCollapse();
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.navigateSelection("parent");
        break;
      case "ArrowRight":
        event.preventDefault();
        this.navigateSelection("child");
        break;
      case "ArrowUp":
        event.preventDefault();
        this.navigateSelection("previous");
        break;
      case "ArrowDown":
        event.preventDefault();
        this.navigateSelection("next");
        break;
      case "+":
      case "=":
        event.preventDefault();
        this.setZoom(this.zoom * 1.15);
        break;
      case "-":
        event.preventDefault();
        this.setZoom(this.zoom / 1.15);
        break;
      case "0":
        if (mod) {
          event.preventDefault();
          this.fitToView();
        }
        break;
      default:
        break;
    }
  }
}
