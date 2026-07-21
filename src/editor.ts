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
  mergeAppearance,
  nodeSearchText,
  normalizeDocument,
  newId,
  nodeContentBlocks,
  nodePlainText,
  syncNodeLegacyFields,
  parseFencedCode,
  parseMarkdownTable,
  normalizeRichText,
  richTextPlainText,
  richTextCharacterStyles,
  characterStylesToRichText,
  applyRichTextStyleRange,
  reconcileRichTextAfterEdit,
  type BackgroundPattern,
  type EdgeStyle,
  type FontFamilyMode,
  type MindMapAppearance,
  type MindMapDocument,
  type MindMapCodeBlock,
  type MindMapContentBlock,
  type MindMapImageContentBlock,
  type MindMapNode,
  type MindMapTextContentBlock,
  type MindMapSubmap,
  type MindMapTextRun,
  type MindMapTextStyle,
  type NodeShape,
  type TaskStatus,
  removeNode
} from "./model";
import { computeLayout, documentToSvg, edgePath, type LayoutResult } from "./layout";
import { CodeEditModal, TableEditModal } from "./content-modals";
import type { ImageHostChoice, ImageHostUploadBatch } from "./settings";

export interface MindMapEditorCallbacks {
  onChange: (document: MindMapDocument) => void;
  onOpenLink: (link: string) => void | Promise<void>;
  onExportSvg: (svg: string) => void | Promise<void>;
  onExportMarkdown: (markdown: string) => void | Promise<void>;
  onExportJson: (json: string) => void | Promise<void>;
  resolveImage: (source: string) => string | null;
  onSavePastedImage: (blob: Blob, suggestedName: string) => Promise<string>;
  getImageHosts: () => ImageHostChoice[];
  getDefaultUploadHostIds: () => string[];
  onUploadImage: (blob: Blob, suggestedName: string, hostIds: string[]) => Promise<ImageHostUploadBatch>;
  onReadImageSource: (source: string) => Promise<{ blob: Blob; suggestedName: string } | null>;
  onScheduleAutoUpload: (nodeId: string, blockId: string, localPath: string, suggestedName: string) => boolean;
  onCreateSubmap: (node: MindMapNode) => Promise<MindMapSubmap>;
  onOpenMindMap: (path: string, focusNodeId?: string) => void | Promise<void>;
  onRenderCode: (block: MindMapCodeBlock, container: HTMLElement) => void | Promise<void>;
}

export interface MindMapEditorOptions {
  defaultNodeShape: NodeShape;
  defaultAppearance: MindMapAppearance;
  showTaskProgress: boolean;
  autoFitOnOpen: boolean;
  historyLimit: number;
}

interface NodeEditValues {
  content: MindMapContentBlock[];
  note: string;
  link: string;
  icon: string;
  tags: string[];
  task?: TaskStatus;
  color?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shape?: NodeShape;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
}

function styleEquals(left: MindMapTextStyle | undefined, right: MindMapTextStyle | undefined): boolean {
  return JSON.stringify(left ?? {}) === JSON.stringify(right ?? {});
}

function renderRichTextRuns(container: HTMLElement, runs: MindMapTextRun[] | undefined, fallbackText: string): void {
  container.empty();
  if (!runs?.length) {
    container.setText(fallbackText);
    return;
  }
  for (const run of runs) {
    const span = container.createSpan({ cls: "mmc-rich-run", text: run.text });
    if (run.style?.bold !== undefined) span.style.fontWeight = run.style.bold ? "700" : "400";
    if (run.style?.italic !== undefined) span.style.fontStyle = run.style.italic ? "italic" : "normal";
    const decorations: string[] = [];
    if (run.style?.underline) decorations.push("underline");
    if (run.style?.strike) decorations.push("line-through");
    if (decorations.length) span.style.textDecorationLine = decorations.join(" ");
    if (run.style?.color) span.style.color = run.style.color;
  }
}

function styleFromElement(element: HTMLElement, inherited: MindMapTextStyle): MindMapTextStyle {
  const style: MindMapTextStyle = { ...inherited };
  const tag = element.tagName.toLowerCase();
  if (tag === "b" || tag === "strong") style.bold = true;
  if (tag === "i" || tag === "em") style.italic = true;
  if (tag === "u") style.underline = true;
  if (tag === "s" || tag === "strike" || tag === "del") style.strike = true;
  const inline = element.style;
  if (inline.fontWeight && (inline.fontWeight === "bold" || Number(inline.fontWeight) >= 600)) style.bold = true;
  if (inline.fontStyle === "italic") style.italic = true;
  const decoration = `${inline.textDecoration} ${inline.textDecorationLine}`;
  if (decoration.includes("underline")) style.underline = true;
  if (decoration.includes("line-through")) style.strike = true;
  const fontColor = tag === "font" ? element.getAttribute("color") : null;
  const color = inline.color || fontColor || "";
  if (color) {
    const probe = document.createElement("span");
    probe.style.color = color;
    document.body.appendChild(probe);
    const normalized = getComputedStyle(probe).color.match(/\d+/g)?.slice(0, 3).map(Number);
    probe.remove();
    if (normalized?.length === 3) style.color = `#${normalized.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }
  return style;
}

function readRichTextEditor(editor: HTMLElement): { text: string; richText?: MindMapTextRun[] } {
  const rawRuns: MindMapTextRun[] = [];
  const visit = (node: Node, inherited: MindMapTextStyle): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\r?\n/g, " ");
      if (!text) return;
      const style = Object.values(inherited).some((value) => value !== undefined) ? { ...inherited } : undefined;
      const previous = rawRuns.at(-1);
      if (previous && styleEquals(previous.style, style)) previous.text += text;
      else rawRuns.push({ text, style });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") {
      rawRuns.push({ text: " " });
      return;
    }
    const style = styleFromElement(node, inherited);
    node.childNodes.forEach((child) => visit(child, style));
    if (["DIV", "P"].includes(node.tagName) && rawRuns.length && !rawRuns.at(-1)?.text.endsWith(" ")) rawRuns.push({ text: " " });
  };
  editor.childNodes.forEach((child) => visit(child, {}));
  const fallback = editor.textContent?.replace(/\s+/g, " ").trim() ?? "";
  const richText = normalizeRichText(rawRuns, fallback);
  return { text: richTextPlainText(richText, fallback).trim(), richText };
}

class ImagePreviewModal extends Modal {
  private scale = 1;

  constructor(app: App, private readonly source: string, private readonly alt: string) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("mmc-image-preview-modal");
    this.titleEl.setText(this.alt || "图片预览");
    const toolbar = this.contentEl.createDiv({ cls: "mmc-image-preview-toolbar" });
    const imageWrap = this.contentEl.createDiv({ cls: "mmc-image-preview-stage" });
    const image = imageWrap.createEl("img", { attr: { src: this.source, alt: this.alt || "图片" } });
    let baseWidth = 0;
    let baseHeight = 0;
    const applyScale = (): void => {
      if (!baseWidth || !baseHeight) return;
      image.style.width = `${Math.max(1, Math.round(baseWidth * this.scale))}px`;
      image.style.height = `${Math.max(1, Math.round(baseHeight * this.scale))}px`;
    };
    image.addEventListener("load", () => {
      const availableWidth = Math.max(320, imageWrap.clientWidth * 0.9);
      const availableHeight = Math.max(220, imageWrap.clientHeight * 0.9);
      const fit = Math.min(1, availableWidth / Math.max(1, image.naturalWidth), availableHeight / Math.max(1, image.naturalHeight));
      baseWidth = Math.max(1, image.naturalWidth * fit);
      baseHeight = Math.max(1, image.naturalHeight * fit);
      applyScale();
    });
    const button = (label: string, action: () => void): void => {
      const el = toolbar.createEl("button", { text: label, attr: { type: "button" } });
      el.addEventListener("click", action);
    };
    button("−", () => { this.scale = Math.max(0.2, this.scale - 0.2); applyScale(); });
    button("100%", () => { this.scale = 1; applyScale(); });
    button("+", () => { this.scale = Math.min(5, this.scale + 0.2); applyScale(); });
    imageWrap.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.scale = Math.min(5, Math.max(0.2, this.scale + (event.deltaY < 0 ? 0.15 : -0.15)));
      applyScale();
    }, { passive: false });
    image.addEventListener("dblclick", () => { this.scale = 1; applyScale(); });
  }
}

class ImageHostPickerModal extends Modal {
  private resolved = false;
  private readonly selected = new Set<string>();

  constructor(
    app: App,
    private readonly hosts: ImageHostChoice[],
    initialIds: string[],
    private readonly resolveSelection: (ids: string[] | null) => void
  ) {
    super(app);
    initialIds.forEach((id) => this.selected.add(id));
  }

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
        if (checkbox.checked) this.selected.add(host.id); else this.selected.delete(host.id);
      });
      label.createSpan({ text: host.name });
    }
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    const cancel = actions.createEl("button", { text: "取消", attr: { type: "button" } });
    cancel.addEventListener("click", () => this.close());
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

  onClose(): void {
    if (!this.resolved) this.resolveSelection(null);
  }
}

function chooseImageHosts(app: App, hosts: ImageHostChoice[], initialIds: string[]): Promise<string[] | null> {
  if (!hosts.length) {
    new Notice("没有可用图床，请先在插件设置中配置并启用图床");
    return Promise.resolve(null);
  }
  const allowed = new Set(hosts.map((host) => host.id));
  const initial = initialIds.filter((id) => allowed.has(id));
  return new Promise((resolve) => new ImageHostPickerModal(app, hosts, initial.length ? initial : [hosts[0]!.id], resolve).open());
}

class NodeEditModal extends Modal {
  private readonly node: MindMapNode;
  private readonly defaultShape: NodeShape;
  private readonly callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource">;
  private readonly submit: (values: NodeEditValues, mode: "autosave" | "commit") => void;
  private saveOnClose: (() => void) | null = null;
  private closeWithoutFlush = false;
  private outsidePointerHandler: ((event: PointerEvent) => void) | null = null;

  constructor(
    app: App,
    node: MindMapNode,
    defaultShape: NodeShape,
    callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource">,
    submit: (values: NodeEditValues, mode: "autosave" | "commit") => void
  ) {
    super(app);
    this.node = node;
    this.defaultShape = defaultShape;
    this.callbacks = callbacks;
    this.submit = submit;
  }

  onOpen(): void {
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

    const renderTextBlock = (container: HTMLElement, block: MindMapTextContentBlock): void => {
      const toolbar = container.createDiv({ cls: "mmc-rich-text-toolbar" });
      const source = container.createEl("textarea", {
        cls: "mmc-rich-text-source",
        attr: { rows: "3", spellcheck: "true", placeholder: "输入文字；可以全部删除，让节点只保留图片" }
      });
      source.value = block.text;
      let savedStart = source.value.length;
      let savedEnd = source.value.length;
      const selection = container.createDiv({ cls: "mmc-rich-selection-status" });
      container.createDiv({ cls: "mmc-rich-preview-label", text: "文字样式预览" });
      const preview = container.createDiv({ cls: "mmc-rich-text-preview" });
      const updatePreview = (): void => {
        renderRichTextRuns(preview, block.richText, block.text || "预览文字");
        preview.toggleClass("is-placeholder", !block.text);
      };
      const remember = (): void => {
        savedStart = source.selectionStart ?? 0;
        savedEnd = source.selectionEnd ?? savedStart;
        const from = Math.min(savedStart, savedEnd);
        const to = Math.max(savedStart, savedEnd);
        selection.setText(from === to ? `光标位置：${from + 1}` : `已选择第 ${from + 1}–${to} 个字符`);
      };
      const range = (): { start: number; end: number } | null => {
        const start = Math.max(0, Math.min(block.text.length, Math.min(savedStart, savedEnd)));
        const end = Math.max(start, Math.min(block.text.length, Math.max(savedStart, savedEnd)));
        if (start === end) {
          new Notice("请先选择需要设置格式的文字");
          source.focus();
          return null;
        }
        source.focus(); source.setSelectionRange(start, end);
        return { start, end };
      };
      const styleButton = (label: string, title: string, action: () => void, cls = ""): HTMLButtonElement => {
        const btn = toolbar.createEl("button", { cls: `mmc-rich-toolbar-button ${cls}`.trim(), text: label, attr: { type: "button", title } });
        btn.addEventListener("mousedown", (event) => event.preventDefault());
        btn.addEventListener("click", (event) => { event.preventDefault(); action(); });
        return btn;
      };
      const applyBoolean = (key: "bold" | "italic" | "underline"): void => {
        const selected = range(); if (!selected) return;
        const styles = richTextCharacterStyles(block.richText, block.text);
        const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
        block.richText = applyRichTextStyleRange(block.text, block.richText, selected.start, selected.end, { [key]: !enabled });
        updatePreview(); scheduleAutoSave(); source.setSelectionRange(selected.start, selected.end); remember();
      };
      styleButton("B", "加粗所选文字", () => applyBoolean("bold"), "is-bold");
      styleButton("I", "斜体所选文字", () => applyBoolean("italic"), "is-italic");
      styleButton("U", "给所选文字加下划线", () => applyBoolean("underline"), "is-underline");
      const colorLabel = toolbar.createEl("label", { cls: "mmc-rich-color-button", attr: { title: "修改所选文字颜色" } });
      colorLabel.createSpan({ text: "颜色" });
      const colorLine = colorLabel.createSpan({ cls: "mmc-rich-color-line" });
      const color = colorLabel.createEl("input", { type: "color", attr: { "aria-label": "文字颜色" } });
      color.value = "#ef4444";
      colorLine.style.backgroundColor = color.value;
      color.addEventListener("input", () => { colorLine.style.backgroundColor = color.value; });
      color.addEventListener("change", () => {
        const selected = range(); if (!selected) return;
        block.richText = applyRichTextStyleRange(block.text, block.richText, selected.start, selected.end, { color: color.value });
        updatePreview(); scheduleAutoSave();
      });
      styleButton("清除格式", "清除所选文字格式", () => {
        const selected = range(); if (!selected) return;
        block.richText = applyRichTextStyleRange(block.text, block.richText, selected.start, selected.end, null);
        updatePreview(); scheduleAutoSave();
      }, "is-wide");
      source.addEventListener("select", remember);
      source.addEventListener("keyup", remember);
      source.addEventListener("mouseup", remember);
      source.addEventListener("input", () => {
        const next = source.value.replace(/\r?\n/g, " ");
        block.richText = reconcileRichTextAfterEdit(block.text, block.richText, next);
        block.text = next;
        source.value = next;
        remember(); updatePreview(); scheduleAutoSave();
      });
      updatePreview(); remember();
    };

    const chooseImage = (block: MindMapImageContentBlock, mode: "local" | "remote", refresh: () => void): void => {
      void (async () => {
        let hostIds: string[] = [];
        if (mode === "remote") {
          const chosen = await chooseImageHosts(this.app, this.callbacks.getImageHosts(), this.callbacks.getDefaultUploadHostIds());
          if (!chosen) return;
          hostIds = chosen;
        }
        const file = await new Promise<File | null>((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
          input.click();
        });
        if (!file) return;
        if (mode === "local") {
          const path = await this.callbacks.onSavePastedImage(file, file.name);
          block.source = path;
          block.localSource = path;
          block.remoteSources = undefined;
        } else {
          const batch = await this.callbacks.onUploadImage(file, file.name, hostIds);
          if (!batch.successes.length) {
            const message = batch.failures.map((item) => `${item.hostName}：${item.error}`).join("；") || "未知错误";
            throw new Error(message);
          }
          const uploadedAt = new Date().toISOString();
          block.source = batch.successes[0]!.url;
          block.localSource = undefined;
          block.remoteSources = batch.successes.map((item) => ({ ...item, uploadedAt }));
          if (batch.failures.length) {
            new Notice(`部分图床上传失败：${batch.failures.map((item) => item.hostName).join("、")}`, 7000);
          } else {
            new Notice(`已上传到：${batch.successes.map((item) => item.hostName).join("、")}`);
          }
        }
        if (!block.alt) block.alt = file.name.replace(/\.[^.]+$/, "");
        refresh();
        scheduleAutoSave();
      })().catch((error) => {
        console.error("MindMap Studio image operation failed", error);
        new Notice(`${mode === "remote" ? "上传图床" : "保存图片"}失败：${error instanceof Error ? error.message : String(error)}`, 7000);
      });
    };

    const uploadExistingImage = (block: MindMapImageContentBlock, refresh: () => void): void => {
      void (async () => {
        const chosen = await chooseImageHosts(this.app, this.callbacks.getImageHosts(), this.callbacks.getDefaultUploadHostIds());
        if (!chosen) return;
        const readableSource = block.localSource || block.source;
        const image = await this.callbacks.onReadImageSource(readableSource);
        if (!image) {
          new Notice("当前图片不是可读取的本地文件；请使用‘上传到图床’重新选择图片");
          return;
        }
        const batch = await this.callbacks.onUploadImage(image.blob, image.suggestedName, chosen);
        if (!batch.successes.length) {
          throw new Error(batch.failures.map((item) => `${item.hostName}：${item.error}`).join("；") || "上传失败");
        }
        const uploadedAt = new Date().toISOString();
        const existing = new Map((block.remoteSources ?? []).map((item) => [item.hostId, item]));
        batch.successes.forEach((item) => existing.set(item.hostId, { ...item, uploadedAt }));
        block.remoteSources = Array.from(existing.values());
        block.localSource = readableSource;
        if (!batch.failures.length) block.source = batch.successes[0]!.url;
        refresh();
        scheduleAutoSave();
        if (batch.failures.length) {
          new Notice(`部分图床上传失败，本地图片已保留：${batch.failures.map((item) => item.hostName).join("、")}`, 7000);
        } else {
          new Notice(`当前图片已上传到：${batch.successes.map((item) => item.hostName).join("、")}`);
        }
      })().catch((error) => {
        console.error("MindMap Studio existing image upload failed", error);
        new Notice(`上传当前图片失败：${error instanceof Error ? error.message : String(error)}`, 7000);
      });
    };

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
          renderTextBlock(card.createDiv({ cls: "mmc-content-block-body" }), block);
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
          local.addEventListener("click", () => chooseImage(block, "local", refresh));
          const remote = actions.createEl("button", { text: "选择文件并上传", attr: { type: "button" } });
          remote.addEventListener("click", () => chooseImage(block, "remote", refresh));
          if (block.localSource || (block.source && !/^https?:\/\//i.test(block.source))) {
            const uploadCurrent = actions.createEl("button", { text: "上传当前图片", attr: { type: "button" } });
            uploadCurrent.addEventListener("click", () => uploadExistingImage(block, refresh));
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
        color: colorToggle.checked ? colorInput.value : undefined,
        textColor: textColorToggle.checked ? textColorInput.value : undefined,
        borderColor: borderColorToggle.checked ? borderColorInput.value : undefined,
        borderWidth: parseNumber(borderWidthInput.value, 0, 6),
        shape: shape === "pill" || shape === "rectangle" || shape === "rounded" ? shape : undefined,
        bold: parseBool(boldInput.value), italic: parseBool(italicInput.value), underline: parseBool(underlineInput.value),
        fontSize: parseNumber(fontSizeInput.value, 10, 32)
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

    [iconInput, taskSelect, shapeSelect, tagsInput, borderWidthInput, fontSizeInput, boldInput, italicInput, underlineInput, noteInput, linkInput]
      .forEach((input) => { input.addEventListener("input", scheduleAutoSave); input.addEventListener("change", scheduleAutoSave); });

    const buttons = form.createDiv({ cls: "mmc-form-actions" });
    const closeButton = buttons.createEl("button", { cls: "mod-cta", text: "保存并关闭", attr: { type: "button" } });
    closeButton.addEventListener("click", () => { if (saveNow("commit", true)) { this.closeWithoutFlush = true; this.close(); } });

    this.outsidePointerHandler = (event: PointerEvent): void => {
      if (this.modalEl.contains(event.target as Node)) return;
      this.saveOnClose?.(); this.closeWithoutFlush = true; this.close();
    };
    window.setTimeout(() => document.addEventListener("pointerdown", this.outsidePointerHandler!, true), 0);
  }

  onClose(): void {
    if (!this.closeWithoutFlush) this.saveOnClose?.();
    if (this.outsidePointerHandler) document.removeEventListener("pointerdown", this.outsidePointerHandler, true);
    this.contentEl.empty();
  }
}

class AppearanceModal extends Modal {
  private readonly appearance: MindMapAppearance;
  private readonly submit: (appearance: MindMapAppearance) => void;
  private readonly reset: () => void;

  constructor(app: App, appearance: MindMapAppearance, submit: (appearance: MindMapAppearance) => void, reset: () => void) {
    super(app);
    this.appearance = appearance;
    this.submit = submit;
    this.reset = reset;
  }

  onOpen(): void {
    this.titleEl.setText("当前脑图外观");
    this.contentEl.addClass("mmc-appearance-modal");
    const form = this.contentEl.createEl("form");
    form.createEl("p", { cls: "setting-item-description", text: "这些设置只保存到当前 .mindmap 文件，不会修改插件全局默认值。" });

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

    const edgeColor = addColor("连线颜色", this.appearance.edgeColor, "#7c8aa5");
    const edgeStyleLabel = grid.createEl("label", { text: "连线类型" });
    const edgeStyleSelect = edgeStyleLabel.createEl("select");
    for (const [value, label] of [["curved", "曲线"], ["straight", "直线"], ["elbow", "折线"]] as const) edgeStyleSelect.createEl("option", { text: label, attr: { value } });
    edgeStyleSelect.value = this.appearance.edgeStyle ?? "curved";
    const edgeWidthLabel = grid.createEl("label", { text: "连线粗细（0.5–8）" });
    const edgeWidthInput = edgeWidthLabel.createEl("input", { type: "number", attr: { min: "0.5", max: "8", step: "0.5" } });
    edgeWidthInput.value = String(this.appearance.edgeWidth ?? 2.2);

    const nodeColor = addColor("节点背景色", this.appearance.nodeColor, "#ffffff");
    const textColor = addColor("文字颜色", this.appearance.textColor, "#0f172a");
    const borderColor = addColor("节点边框颜色", this.appearance.nodeBorderColor, "#94a3b8");
    const borderWidthLabel = grid.createEl("label", { text: "边框粗细（0–6）" });
    const borderWidthInput = borderWidthLabel.createEl("input", { type: "number", attr: { min: "0", max: "6", step: "0.5" } });
    borderWidthInput.value = String(this.appearance.nodeBorderWidth ?? 1);

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

    const clamp = (value: string, min: number, max: number, fallback: number): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    };
    const actions = form.createDiv({ cls: "mmc-modal-actions" });
    const reset = actions.createEl("button", { text: "恢复全局默认", type: "button" });
    const cancel = actions.createEl("button", { text: "取消", type: "button" });
    const save = actions.createEl("button", { text: "应用", type: "submit", cls: "mod-cta" });
    reset.addEventListener("click", () => { this.reset(); this.close(); });
    cancel.addEventListener("click", () => this.close());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit({
        backgroundColor: background.toggle.checked ? background.input.value : undefined,
        backgroundPattern: patternSelect.value as BackgroundPattern,
        patternColor: patternColor.toggle.checked ? patternColor.input.value : undefined,
        fontFamily: fontSelect.value as FontFamilyMode,
        customFont: fontSelect.value === "custom" ? customFontInput.value.trim().slice(0, 120) || undefined : undefined,
        fontSize: clamp(fontSizeInput.value, 10, 30, 14),
        edgeColor: edgeColor.toggle.checked ? edgeColor.input.value : undefined,
        edgeWidth: clamp(edgeWidthInput.value, 0.5, 8, 2.2),
        edgeStyle: edgeStyleSelect.value as EdgeStyle,
        nodeColor: nodeColor.toggle.checked ? nodeColor.input.value : undefined,
        textColor: textColor.toggle.checked ? textColor.input.value : undefined,
        nodeBorderColor: borderColor.toggle.checked ? borderColor.input.value : undefined,
        nodeBorderWidth: clamp(borderWidthInput.value, 0, 6, 1),
        bold: bold.checked,
        italic: italic.checked,
        underline: underline.checked
      });
      this.close();
    });
    window.setTimeout(() => save.focus(), 20);
  }
}

class OutlineModal extends Modal {
  private readonly markdown: string;
  private readonly onExport: () => void;

  constructor(app: App, markdown: string, onExport: () => void) {
    super(app);
    this.markdown = markdown;
    this.onExport = onExport;
  }

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

  onClose(): void {
    this.contentEl.empty();
  }
}

class SearchNodesModal extends Modal {
  private readonly nodes: MindMapNode[];
  private readonly onQuery: (query: string) => void;
  private readonly onSelect: (node: MindMapNode) => void;

  constructor(app: App, nodes: MindMapNode[], onQuery: (query: string) => void, onSelect: (node: MindMapNode) => void) {
    super(app);
    this.nodes = nodes;
    this.onQuery = onQuery;
    this.onSelect = onSelect;
  }

  onOpen(): void {
    this.titleEl.setText("搜索节点");
    this.modalEl.addClass("mmc-search-modal");
    const input = this.contentEl.createEl("input", { type: "search", cls: "mmc-search-input", attr: { placeholder: "搜索文字、备注、标签或链接…" } });
    const count = this.contentEl.createDiv({ cls: "mmc-search-count" });
    const results = this.contentEl.createDiv({ cls: "mmc-search-results" });

    const renderResults = (): void => {
      const query = input.value.trim().toLocaleLowerCase();
      this.onQuery(query);
      results.empty();
      const matches = query
        ? this.nodes.filter((node) => nodeSearchText(node).includes(query)).slice(0, 80)
        : this.nodes.slice(0, 40);
      count.setText(query ? `找到 ${matches.length} 个节点` : `共 ${this.nodes.length} 个节点`);
      for (const node of matches) {
        const button = results.createEl("button", { cls: "mmc-search-result", type: "button" });
        const title = button.createDiv({ cls: "mmc-search-result-title" });
        if (node.icon) title.createSpan({ text: `${node.icon} ` });
        title.createSpan({ text: nodePlainText(node) || "图片节点" });
        const details = [node.task ? ({ todo: "待办", doing: "进行中", done: "已完成" } as const)[node.task] : "", ...(node.tags ?? []).map((tag) => `#${tag}`)]
          .filter(Boolean)
          .join(" · ");
        if (details) button.createDiv({ cls: "mmc-search-result-meta", text: details });
        button.addEventListener("click", () => {
          this.onSelect(node);
          this.close();
        });
      }
      if (!matches.length) results.createDiv({ cls: "mmc-empty-state", text: "没有匹配的节点" });
    };

    input.addEventListener("input", renderResults);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const first = results.querySelector<HTMLButtonElement>(".mmc-search-result");
        if (first) {
          event.preventDefault();
          first.click();
        }
      }
    });
    renderResults();
    window.setTimeout(() => input.focus(), 20);
  }
}

class JsonTransferModal extends Modal {
  private readonly document: MindMapDocument;
  private readonly onImport: (document: MindMapDocument) => void;
  private readonly onExport: (json: string) => void;

  constructor(app: App, document: MindMapDocument, onImport: (document: MindMapDocument) => void, onExport: (json: string) => void) {
    super(app);
    this.document = document;
    this.onImport = onImport;
    this.onExport = onExport;
  }

  onOpen(): void {
    this.titleEl.setText("JSON 导入 / 导出");
    const description = this.contentEl.createEl("p", { text: "可以复制当前 JSON，也可以粘贴其他 MindMap Studio 文档 JSON 后导入。" });
    description.addClass("setting-item-description");
    const textarea = this.contentEl.createEl("textarea", { cls: "mmc-json-textarea" });
    textarea.value = JSON.stringify(this.document, null, 2);
    const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions mmc-json-actions" });
    const copy = actions.createEl("button", { text: "复制 JSON" });
    const exportButton = actions.createEl("button", { text: "导出 .json" });
    const importButton = actions.createEl("button", { text: "导入并替换", cls: "mod-warning" });
    copy.addEventListener("click", () => {
      void navigator.clipboard.writeText(textarea.value);
      new Notice("已复制 JSON");
    });
    exportButton.addEventListener("click", () => this.onExport(textarea.value));
    importButton.addEventListener("click", () => {
      try {
        const parsed = JSON.parse(textarea.value) as Partial<MindMapDocument>;
        const normalized = normalizeDocument(parsed, this.document.title);
        this.onImport(normalized);
        new Notice("JSON 已导入");
        this.close();
      } catch (error) {
        console.error("MindMap Studio JSON import failed", error);
        new Notice("JSON 格式无效，请检查后重试");
      }
    });
  }
}

export class MindMapEditor {
  private readonly app: App;
  private readonly host: HTMLElement;
  private readonly callbacks: MindMapEditorCallbacks;
  private options: MindMapEditorOptions;
  private rootEl!: HTMLDivElement;
  private toolbarEl!: HTMLDivElement;
  private navigationBarEl!: HTMLDivElement;
  private viewportEl!: HTMLDivElement;
  private sceneEl!: HTMLDivElement;
  private nodesLayerEl!: HTMLDivElement;
  private edgesSvg!: SVGSVGElement;
  private statusEl!: HTMLSpanElement;
  private zoomStatusEl!: HTMLSpanElement;
  private document: MindMapDocument;
  private layout: LayoutResult;
  private selectedId: string;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private history: string[] = [];
  private future: string[] = [];
  private draggingId: string | null = null;
  private panning = false;
  private panStart = { x: 0, y: 0, panX: 0, panY: 0 };
  private cleanupCallbacks: Array<() => void> = [];
  private resizeObserver: ResizeObserver | null = null;
  private branchClipboard: MindMapNode | null = null;
  private searchQuery = "";

  constructor(app: App, host: HTMLElement, document: MindMapDocument, callbacks: MindMapEditorCallbacks, options: MindMapEditorOptions) {
    this.app = app;
    this.host = host;
    this.callbacks = callbacks;
    this.options = options;
    this.document = cloneDocument(document);
    this.selectedId = this.document.root.id;
    this.layout = computeLayout(this.document.root, this.document.layout, this.getAppearance().fontSize ?? 14);
    this.buildUi();
    this.render();
    if (this.options.autoFitOnOpen) window.setTimeout(() => this.fitToView(), 50);
  }

  destroy(): void {
    this.cleanupCallbacks.forEach((callback) => callback());
    this.cleanupCallbacks = [];
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.host.empty();
  }

  setDocument(document: MindMapDocument, resetHistory = true): void {
    this.document = cloneDocument(document);
    this.selectedId = this.document.root.id;
    if (resetHistory) {
      this.history = [];
      this.future = [];
    }
    this.render();
    if (this.options.autoFitOnOpen) window.setTimeout(() => this.fitToView(), 20);
  }

  setOptions(options: MindMapEditorOptions): void {
    this.options = options;
    this.render();
  }

  getDocument(): MindMapDocument {
    return cloneDocument(this.document);
  }

  markSaved(): void {
    this.statusEl.setText("已保存");
    this.rootEl.removeClass("is-dirty");
  }

  markSaving(): void {
    this.statusEl.setText("保存中…");
    this.rootEl.addClass("is-dirty");
  }

  focus(): void {
    this.rootEl.focus();
  }

  focusNodeById(id: string): void {
    if (findNode(this.document.root, id)) this.focusNode(id);
  }

  private buildUi(): void {
    this.host.empty();
    this.rootEl = this.host.createDiv({ cls: "mmc-editor" });
    this.rootEl.tabIndex = 0;
    this.toolbarEl = this.rootEl.createDiv({ cls: "mmc-toolbar" });
    this.navigationBarEl = this.rootEl.createDiv({ cls: "mmc-parent-navigation" });
    this.viewportEl = this.rootEl.createDiv({ cls: "mmc-viewport" });
    this.sceneEl = this.viewportEl.createDiv({ cls: "mmc-scene" });
    this.edgesSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.edgesSvg.classList.add("mmc-edges");
    this.sceneEl.appendChild(this.edgesSvg);
    this.nodesLayerEl = this.sceneEl.createDiv({ cls: "mmc-nodes-layer" });
    this.addToolbarButton("plus-circle", "添加子节点（Tab）", () => this.addChild());
    this.addToolbarButton("list-plus", "添加同级节点（Enter）", () => this.addSibling());
    this.addToolbarButton("pencil", "编辑节点（F2）", () => this.editSelected());
    this.addToolbarButton("copy-plus", "克隆分支（Ctrl/Cmd+D）", () => this.duplicateSelected());
    this.addToolbarButton("trash-2", "删除节点（Delete）", () => this.deleteSelected());
    this.addToolbarSeparator();
    this.addToolbarButton("circle-check-big", "切换任务状态（Ctrl/Cmd+Enter）", () => this.cycleTask());
    this.addToolbarButton("fold-vertical", "展开/收起节点（Space）", () => this.toggleCollapse());
    this.addToolbarButton("link", "打开节点链接", () => this.openSelectedLink());
    this.addToolbarButton("search", "搜索节点（Ctrl/Cmd+F）", () => this.openSearch());
    this.addToolbarSeparator();
    this.addToolbarButton("table-2", "插入或编辑表格", () => this.editTable());
    this.addToolbarButton("code-2", "插入或编辑代码", () => this.editCode());
    this.addToolbarButton("image-plus", "粘贴图片到当前节点（Ctrl/Cmd+V）", () => new Notice("先复制图片，再选中节点并按 Ctrl/Cmd+V"));
    this.addToolbarButton("network", "创建或进入子导图", () => void this.createOrOpenSubmap());
    this.addToolbarSeparator();
    this.addToolbarButton("undo-2", "撤销（Ctrl/Cmd+Z）", () => this.undo());
    this.addToolbarButton("redo-2", "重做（Ctrl/Cmd+Y）", () => this.redo());
    this.addToolbarSeparator();
    this.addToolbarButton("zoom-in", "放大", () => this.setZoom(this.zoom * 1.15));
    this.addToolbarButton("zoom-out", "缩小", () => this.setZoom(this.zoom / 1.15));
    this.addToolbarButton("maximize", "适应画布", () => this.fitToView());
    this.addToolbarButton("git-fork", "切换单侧/双侧布局", () => this.toggleLayout());
    this.addToolbarButton("palette", "当前脑图外观", () => this.editAppearance());
    this.addToolbarSeparator();
    this.addToolbarButton("file-text", "查看 Markdown 大纲", () => this.showOutline());
    this.addToolbarButton("braces", "JSON 导入 / 导出", () => this.showJsonTransfer());
    this.addToolbarButton("image", "导出 SVG", () => void this.callbacks.onExportSvg(documentToSvg(this.document.root, this.document.layout, this.document.title, this.getAppearance())));

    const spacer = this.toolbarEl.createSpan({ cls: "mmc-toolbar-spacer" });
    spacer.setAttr("aria-hidden", "true");
    this.zoomStatusEl = this.toolbarEl.createSpan({ cls: "mmc-zoom-status", text: "100%" });
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
      if (target.closest(".mmc-node")) return;
      if (event.button !== 0 && event.button !== 1) return;
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
    this.cleanupCallbacks.push(() => {
      this.viewportEl.removeEventListener("pointerdown", pointerDown);
      this.viewportEl.removeEventListener("pointermove", pointerMove);
      this.viewportEl.removeEventListener("pointerup", pointerUp);
      this.viewportEl.removeEventListener("pointercancel", pointerUp);
    });

    this.resizeObserver = new ResizeObserver(() => this.applyTransform());
    this.resizeObserver.observe(this.viewportEl);
  }

  private addToolbarButton(icon: string, label: string, action: () => void): HTMLButtonElement {
    const button = this.toolbarEl.createEl("button", { cls: "clickable-icon mmc-toolbar-button", attr: { "aria-label": label, title: label } });
    setIcon(button, icon);
    button.addEventListener("click", () => {
      action();
      this.focus();
    });
    return button;
  }

  private addToolbarSeparator(): void {
    this.toolbarEl.createSpan({ cls: "mmc-toolbar-separator" });
  }

  private getAppearance(): MindMapAppearance {
    return mergeAppearance(this.options.defaultAppearance, this.document.appearance);
  }

  private fontFamilyCss(appearance: MindMapAppearance): string {
    if (appearance.fontFamily === "serif") return 'Georgia, "Times New Roman", serif';
    if (appearance.fontFamily === "mono") return '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
    if (appearance.fontFamily === "custom" && appearance.customFont?.trim()) return `"${appearance.customFont.trim().replaceAll('"', '')}", sans-serif`;
    if (appearance.fontFamily === "sans") return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    return "var(--font-interface)";
  }

  private applyAppearance(appearance: MindMapAppearance): void {
    const setOrRemove = (name: string, value: string | undefined): void => {
      if (value) this.rootEl.style.setProperty(name, value);
      else this.rootEl.style.removeProperty(name);
    };
    setOrRemove("--mmc-canvas", appearance.backgroundColor);
    setOrRemove("--mmc-pattern-color", appearance.patternColor);
    setOrRemove("--mmc-edge", appearance.edgeColor);
    setOrRemove("--mmc-node-bg", appearance.nodeColor);
    setOrRemove("--mmc-node-text", appearance.textColor);
    setOrRemove("--mmc-node-border", appearance.nodeBorderColor);
    this.rootEl.style.setProperty("--mmc-font-family", this.fontFamilyCss(appearance));
    this.rootEl.style.setProperty("--mmc-edge-width", `${appearance.edgeWidth ?? 2.2}px`);
    this.rootEl.style.setProperty("--mmc-node-border-width", `${appearance.nodeBorderWidth ?? 1}px`);
    this.viewportEl.toggleClass("pattern-grid", appearance.backgroundPattern === "grid");
    this.viewportEl.toggleClass("pattern-dots", appearance.backgroundPattern === "dots");
    this.viewportEl.toggleClass("pattern-none", !appearance.backgroundPattern || appearance.backgroundPattern === "none");
  }

  private renderNavigation(): void {
    this.navigationBarEl.empty();
    const navigation = this.document.navigation;
    this.navigationBarEl.toggleClass("is-hidden", !navigation?.parentPath);
    if (!navigation?.parentPath) return;

    const button = this.navigationBarEl.createEl("button", {
      cls: "mmc-parent-navigation-button",
      attr: {
        type: "button",
        title: `返回父导图：${navigation.parentPath}`
      }
    });
    setIcon(button, "arrow-left");
    const labels = button.createDiv({ cls: "mmc-parent-navigation-labels" });
    labels.createDiv({ cls: "mmc-parent-navigation-title", text: `返回父导图：${navigation.parentTitle ?? navigation.parentPath.split("/").at(-1)?.replace(/\.mindmap$/i, "") ?? "父导图"}` });
    if (navigation.parentNodeText) labels.createDiv({ cls: "mmc-parent-navigation-node", text: `来源节点：${navigation.parentNodeText}` });
    button.addEventListener("click", () => void this.callbacks.onOpenMindMap(navigation.parentPath, navigation.parentNodeId));
    this.navigationBarEl.createDiv({ cls: "mmc-parent-navigation-path", text: navigation.parentPath });
  }

  private render(): void {
    this.renderNavigation();
    const appearance = this.getAppearance();
    this.applyAppearance(appearance);
    this.layout = computeLayout(this.document.root, this.document.layout, appearance.fontSize ?? 14);
    this.nodesLayerEl.empty();
    while (this.edgesSvg.firstChild) this.edgesSvg.removeChild(this.edgesSvg.firstChild);

    for (const position of this.layout.nodes) {
      if (!position.parentId) continue;
      const parent = this.layout.byId.get(position.parentId);
      if (!parent) continue;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", edgePath(parent, position, appearance.edgeStyle ?? "curved"));
      path.setAttribute("class", `mmc-edge depth-${Math.min(position.depth, 6)}`);
      if (position.node.style?.color) path.style.stroke = position.node.style.color;
      this.edgesSvg.appendChild(path);
    }

    for (const position of this.layout.nodes) {
      const node = position.node;
      const shape = node.style?.shape ?? this.options.defaultNodeShape;
      const classes = ["mmc-node", position.depth === 0 ? "is-root" : "", `shape-${shape}`].filter(Boolean).join(" ");
      const nodeEl = this.nodesLayerEl.createDiv({ cls: classes });
      nodeEl.dataset.nodeId = node.id;
      nodeEl.style.left = `${position.x}px`;
      nodeEl.style.top = `${position.y}px`;
      nodeEl.style.width = `${position.width}px`;
      nodeEl.style.minHeight = `${position.height}px`;
      nodeEl.draggable = position.depth > 0;
      if (this.selectedId === node.id) nodeEl.addClass("is-selected");
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
      if (node.style?.color) nodeEl.style.backgroundColor = node.style.color;
      else if (!isRoot && appearance.nodeColor) nodeEl.style.backgroundColor = appearance.nodeColor;
      if (node.style?.textColor) nodeEl.style.color = node.style.textColor;
      else if (!isRoot && appearance.textColor) nodeEl.style.color = appearance.textColor;
      if (node.style?.borderColor) nodeEl.style.borderColor = node.style.borderColor;
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
          const resolved = this.callbacks.resolveImage(block.source);
          const wrap = content.createDiv({ cls: "mmc-node-image-block" });
          const image = wrap.createEl("img", { cls: "mmc-node-image", attr: { alt: block.alt ?? (nodePlainText(node) || "图片"), loading: "lazy" } });
          if (resolved) {
            image.src = resolved;
            image.setAttr("title", "点击放大图片");
            image.addEventListener("click", (event) => {
              event.stopPropagation();
              new ImagePreviewModal(this.app, resolved, block.alt ?? "图片预览").open();
            });
          } else {
            image.addClass("is-unresolved");
            image.setAttr("title", `找不到图片：${block.source}`);
          }
          continue;
        }
        if (!block.text.trim()) continue;
        const main = content.createDiv({ cls: "mmc-node-main mmc-node-text-block" });
        if (!prefixRendered && node.task) {
          const task = main.createSpan({ cls: `mmc-task-icon task-${node.task}`, text: node.task === "done" ? "✓" : node.task === "doing" ? "◐" : "○" });
          task.setAttr("aria-label", node.task === "done" ? "已完成" : node.task === "doing" ? "进行中" : "待办");
        }
        if (!prefixRendered && node.icon) main.createSpan({ cls: "mmc-node-icon", text: node.icon });
        prefixRendered = true;
        const textEl = main.createDiv({ cls: "mmc-node-text" });
        renderRichTextRuns(textEl, block.richText, block.text);
        textEl.style.fontSize = `${node.style?.fontSize ?? appearance.fontSize ?? 14}px`;
        textEl.setAttr("aria-label", block.text);
      }

      if (node.submap) {
        const submapButton = content.createEl("button", { cls: "mmc-submap-card", attr: { "aria-label": `进入子导图 ${node.submap.title ?? node.submap.path}` } });
        setIcon(submapButton, "network");
        submapButton.createSpan({ text: node.submap.title ?? node.submap.path.split("/").at(-1)?.replace(/\.mindmap$/i, "") ?? "子导图" });
        submapButton.addEventListener("click", (event) => {
          event.stopPropagation();
          void this.callbacks.onOpenMindMap(node.submap!.path);
        });
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

      nodeEl.addEventListener("click", (event) => {
        event.stopPropagation();
        this.selectNode(node.id);
      });
      nodeEl.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        this.selectNode(node.id);
        this.editSelected();
      });
      nodeEl.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.selectNode(node.id);
        this.openContextMenu(event);
      });
      nodeEl.addEventListener("dragstart", (event) => {
        this.draggingId = node.id;
        event.dataTransfer?.setData("text/plain", node.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        nodeEl.addClass("is-dragging");
      });
      nodeEl.addEventListener("dragover", (event) => {
        if (!this.canReparent(this.draggingId, node.id)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        nodeEl.addClass("is-drop-target");
      });
      nodeEl.addEventListener("dragleave", () => nodeEl.removeClass("is-drop-target"));
      nodeEl.addEventListener("drop", (event) => {
        event.preventDefault();
        nodeEl.removeClass("is-drop-target");
        const draggedId = this.draggingId ?? event.dataTransfer?.getData("text/plain") ?? null;
        if (draggedId) this.reparentNode(draggedId, node.id);
      });
      nodeEl.addEventListener("dragend", () => {
        this.draggingId = null;
        this.nodesLayerEl.querySelectorAll(".is-dragging, .is-drop-target").forEach((element) => element.removeClasses(["is-dragging", "is-drop-target"]));
      });
    }
    this.applyTransform();
  }

  private applyTransform(): void {
    const rect = this.viewportEl.getBoundingClientRect();
    this.sceneEl.style.transform = `translate(${rect.width / 2 + this.panX}px, ${rect.height / 2 + this.panY}px) scale(${this.zoom})`;
    this.rootEl.style.setProperty("--mmc-zoom", String(this.zoom));
    this.zoomStatusEl?.setText(`${Math.round(this.zoom * 100)}%`);
  }

  private selectNode(id: string | null): void {
    this.selectedId = id ?? "";
    this.nodesLayerEl.querySelectorAll(".mmc-node.is-selected").forEach((element) => element.removeClass("is-selected"));
    if (id) this.nodesLayerEl.querySelector<HTMLElement>(`.mmc-node[data-node-id="${CSS.escape(id)}"]`)?.addClass("is-selected");
  }

  private selectedNode(): MindMapNode | null {
    return this.selectedId ? findNode(this.document.root, this.selectedId) : null;
  }

  private createConfiguredNode(text = "新节点"): MindMapNode {
    const node = createNode(text);
    if (this.options.defaultNodeShape !== "rounded") node.style = { shape: this.options.defaultNodeShape };
    return node;
  }

  private addChild(): void {
    const selected = this.selectedNode() ?? this.document.root;
    const node = this.createConfiguredNode();
    this.mutate(() => {
      selected.collapsed = false;
      selected.children.push(node);
      this.selectedId = node.id;
    });
    this.editSelected();
  }

  private addSibling(): void {
    const selected = this.selectedNode();
    if (!selected || selected.id === this.document.root.id) {
      this.addChild();
      return;
    }
    const parent = findParent(this.document.root, selected.id);
    if (!parent) return;
    const node = this.createConfiguredNode();
    this.mutate(() => {
      const index = parent.children.findIndex((child) => child.id === selected.id);
      parent.children.splice(index + 1, 0, node);
      this.selectedId = node.id;
    });
    this.editSelected();
  }

  private editSelected(): void {
    const selected = this.selectedNode();
    if (!selected) return;
    let historyCaptured = false;
    new NodeEditModal(this.app, selected, this.options.defaultNodeShape, {
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
      const style = {
        color: values.color,
        textColor: values.textColor,
        borderColor: values.borderColor,
        borderWidth: values.borderWidth,
        shape: values.shape,
        bold: values.bold,
        italic: values.italic,
        underline: values.underline,
        fontSize: values.fontSize
      };
      selected.style = Object.values(style).some((value) => value !== undefined) ? style : undefined;
      if (selected.id === this.document.root.id) {
        const title = nodePlainText(selected);
        if (title) this.document.title = title;
      }
      this.callbacks.onChange(this.getDocument());
      this.markSaving();
      this.render();
    }).open();
  }

  private deleteSelected(): void {
    const selected = this.selectedNode();
    if (!selected || selected.id === this.document.root.id) {
      new Notice("根节点不能删除");
      return;
    }
    const parent = findParent(this.document.root, selected.id);
    this.mutate(() => {
      removeNode(this.document.root, selected.id);
      this.selectedId = parent?.id ?? this.document.root.id;
    });
  }

  private toggleCollapse(): void {
    const selected = this.selectedNode();
    if (!selected || !selected.children.length) return;
    this.mutate(() => { selected.collapsed = !selected.collapsed; });
  }

  private cycleTask(): void {
    const selected = this.selectedNode();
    if (!selected) return;
    const next: Record<string, TaskStatus | undefined> = { "": "todo", todo: "doing", doing: "done", done: undefined };
    this.mutate(() => { selected.task = next[selected.task ?? ""]; });
  }

  private toggleLayout(): void {
    this.mutate(() => { this.document.layout = this.document.layout === "right" ? "balanced" : "right"; });
    window.setTimeout(() => this.fitToView(), 20);
  }

  private editAppearance(): void {
    new AppearanceModal(
      this.app,
      this.getAppearance(),
      (appearance) => this.mutate(() => { this.document.appearance = appearance; }),
      () => this.mutate(() => { this.document.appearance = undefined; })
    ).open();
  }

  private editTable(): void {
    const selected = this.selectedNode() ?? this.document.root;
    new TableEditModal(this.app, selected.table, (table) => {
      this.mutate(() => { selected.table = table; });
    }).open();
  }

  private convertChildrenToTable(): void {
    const selected = this.selectedNode() ?? this.document.root;
    const table = childrenToTable(selected);
    if (!table) { new Notice("当前节点没有可转换的子节点"); return; }
    this.mutate(() => {
      selected.table = table;
      selected.collapsed = true;
    });
    new Notice("已生成子节点表格；原子节点已保留并收起");
  }

  private removeTable(): void {
    const selected = this.selectedNode();
    if (!selected?.table) return;
    this.mutate(() => {
      selected.table = undefined;
      if (selected.children.length) selected.collapsed = false;
    });
  }

  private editCode(): void {
    const selected = this.selectedNode() ?? this.document.root;
    new CodeEditModal(this.app, selected.code, (code) => {
      this.mutate(() => { selected.code = code; });
    }).open();
  }

  private removeCode(): void {
    const selected = this.selectedNode();
    if (!selected?.code) return;
    this.mutate(() => { selected.code = undefined; });
  }

  private async createOrOpenSubmap(): Promise<void> {
    const selected = this.selectedNode() ?? this.document.root;
    if (selected.submap) {
      await this.callbacks.onOpenMindMap(selected.submap.path);
      return;
    }
    try {
      const submap = await this.callbacks.onCreateSubmap(selected);
      this.mutate(() => { selected.submap = submap; });
      await this.callbacks.onOpenMindMap(submap.path);
    } catch (error) {
      console.error("MindMap Studio create submap failed", error);
      new Notice("创建子导图失败");
    }
  }

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

  private async handlePaste(event: ClipboardEvent): Promise<void> {
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

    const text = data.getData("text/plain");
    if (!text.trim()) return;
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
    const branch = this.parseClipboardNode(text);
    if (branch) {
      event.preventDefault();
      const clone = cloneNodeWithFreshIds(branch);
      this.mutate(() => { selected.collapsed = false; selected.children.push(clone); this.selectedId = clone.id; });
    }
  }

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

  private getNodeLink(node: MindMapNode): string | null {
    return node.link?.trim() || extractFirstWikiLink(nodePlainText(node)) || extractFirstWikiLink(node.note ?? "");
  }

  private showOutline(): void {
    const markdown = documentToMarkdown(this.document);
    new OutlineModal(this.app, markdown, () => void this.callbacks.onExportMarkdown(markdown)).open();
  }

  private showJsonTransfer(): void {
    new JsonTransferModal(
      this.app,
      this.getDocument(),
      (document) => this.replaceDocument(document),
      (json) => void this.callbacks.onExportJson(json)
    ).open();
  }

  private openSearch(): void {
    new SearchNodesModal(
      this.app,
      flattenNodes(this.document.root),
      (query) => {
        this.searchQuery = query;
        this.render();
      },
      (node) => this.focusNode(node.id)
    ).open();
  }

  private focusNode(id: string): void {
    const ancestors = findAncestors(this.document.root, id);
    const collapsed = ancestors.filter((node) => node.collapsed);
    if (collapsed.length) {
      this.mutate(() => collapsed.forEach((node) => { node.collapsed = false; }));
    }
    this.selectedId = id;
    this.render();
    window.setTimeout(() => this.centerNode(id), 20);
  }

  private centerNode(id: string): void {
    const position = this.layout.byId.get(id);
    if (!position) return;
    this.panX = -position.x * this.zoom;
    this.panY = -position.y * this.zoom;
    this.applyTransform();
  }

  private openContextMenu(event: MouseEvent): void {
    const selected = this.selectedNode();
    const menu = new Menu();
    menu.addItem((item) => item.setTitle("添加子节点").setIcon("plus-circle").onClick(() => this.addChild()));
    menu.addItem((item) => item.setTitle("添加同级节点").setIcon("list-plus").onClick(() => this.addSibling()));
    menu.addItem((item) => item.setTitle("编辑节点").setIcon("pencil").onClick(() => this.editSelected()));
    menu.addItem((item) => item.setTitle("克隆分支").setIcon("copy-plus").onClick(() => this.duplicateSelected()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle(selected?.table ? "编辑表格" : "插入表格").setIcon("table-2").onClick(() => this.editTable()));
    menu.addItem((item) => item.setTitle("将子节点生成表格").setIcon("table-properties").onClick(() => this.convertChildrenToTable()));
    if (selected?.table) menu.addItem((item) => item.setTitle("移除表格").setIcon("table-2").onClick(() => this.removeTable()));
    menu.addItem((item) => item.setTitle(selected?.code ? "编辑代码" : "插入代码").setIcon("code-2").onClick(() => this.editCode()));
    if (selected?.code) menu.addItem((item) => item.setTitle("移除代码").setIcon("eraser").onClick(() => this.removeCode()));
    menu.addItem((item) => item.setTitle(selected?.submap ? "进入子导图" : "创建子导图").setIcon("network").onClick(() => void this.createOrOpenSubmap()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("复制分支").setIcon("copy").onClick(() => void this.copySelectedBranch()));
    menu.addItem((item) => item.setTitle("粘贴为子节点").setIcon("clipboard-paste").onClick(() => void this.pasteAsChild()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle(`任务状态：${selected?.task === "done" ? "已完成" : selected?.task === "doing" ? "进行中" : selected?.task === "todo" ? "待办" : "无"}`).setIcon("circle-check-big").onClick(() => this.cycleTask()));
    menu.addItem((item) => item.setTitle("展开/收起").setIcon("fold-vertical").onClick(() => this.toggleCollapse()));
    menu.addItem((item) => item.setTitle("打开链接").setIcon("link").onClick(() => this.openSelectedLink()));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("删除节点").setIcon("trash-2").onClick(() => this.deleteSelected()));
    menu.showAtMouseEvent(event);
  }

  private async copySelectedBranch(): Promise<boolean> {
    const selected = this.selectedNode();
    if (!selected) return false;
    this.branchClipboard = cloneDocument({ version: 8, title: nodePlainText(selected) || "图片节点", layout: "right", theme: "auto", root: selected }).root;
    const payload = JSON.stringify({ type: "mindmap-studio-node", version: 1, node: selected }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      new Notice("已复制节点分支");
    } catch {
      new Notice("节点分支已复制到插件内部剪贴板");
    }
    return true;
  }

  private async pasteAsChild(): Promise<void> {
    const selected = this.selectedNode() ?? this.document.root;
    let sourceNode: MindMapNode | null = null;
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) sourceNode = this.parseClipboardNode(text);
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

  private parseClipboardNode(text: string): MindMapNode | null {
    try {
      const parsed = JSON.parse(text) as { type?: string; node?: Partial<MindMapNode>; root?: Partial<MindMapNode>; text?: string; children?: unknown[] };
      const input = (parsed.type === "mindmap-studio-node" || parsed.type === "mmc-lite-node" || parsed.type === "smm-lite-node") && parsed.node ? parsed.node : parsed.root ?? (typeof parsed.text === "string" && Array.isArray(parsed.children) ? parsed : null);
      if (!input) return null;
      return normalizeDocument({ title: input.text ?? "粘贴节点", root: input as MindMapNode }, input.text ?? "粘贴节点").root;
    } catch {
      return null;
    }
  }

  private duplicateSelected(): void {
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

  private canReparent(draggedId: string | null, targetId: string): boolean {
    if (!draggedId || draggedId === this.document.root.id || draggedId === targetId) return false;
    const dragged = findNode(this.document.root, draggedId);
    return Boolean(dragged && !containsNode(dragged, targetId));
  }

  private reparentNode(draggedId: string, targetId: string): void {
    if (!this.canReparent(draggedId, targetId)) return;
    const dragged = findNode(this.document.root, draggedId);
    const target = findNode(this.document.root, targetId);
    if (!dragged || !target) return;
    this.mutate(() => {
      removeNode(this.document.root, draggedId);
      target.children.push(dragged);
      target.collapsed = false;
      this.selectedId = draggedId;
    });
  }

  private replaceDocument(document: MindMapDocument): void {
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

  private mutate(action: () => void): void {
    this.history.push(JSON.stringify(this.document));
    this.trimHistory();
    this.future = [];
    action();
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }

  private trimHistory(): void {
    const limit = Math.max(10, Math.min(500, this.options.historyLimit));
    while (this.history.length > limit) this.history.shift();
  }

  private undo(): void {
    const previous = this.history.pop();
    if (!previous) return;
    this.future.push(JSON.stringify(this.document));
    this.document = JSON.parse(previous) as MindMapDocument;
    this.selectedId = this.document.root.id;
    this.callbacks.onChange(this.getDocument());
    this.markSaving();
    this.render();
  }

  private redo(): void {
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

  private setZoom(value: number): void {
    this.zoom = this.clampZoom(value);
    this.applyTransform();
  }

  private clampZoom(value: number): number {
    return Math.min(2.5, Math.max(0.2, value));
  }

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
    if (mod && key === "f") {
      event.preventDefault();
      this.openSearch();
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
