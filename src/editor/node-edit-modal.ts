/** @file node-edit-modal.ts
 * @description 节点编辑弹窗：内容块、备注、链接、图标与外观字段的完整编辑界面。
 */
import { App, Menu, Modal, Notice, setIcon } from "obsidian";
import {
  imageSourceCandidates,
  newId,
  type ArticleNumberingMode,
  nodeContentBlocks,
  type MindMapContentBlock,
  type MindMapImageContentBlock,
  type MindMapNode,
  type NodeShape,
  type NodeTextAlign
} from "../core/model";
import { TableEditModal, CodeEditModal } from "./content-modals";
import { selectNodeImage, selectAnyFile, uploadCurrentNodeImage } from "./node-image-actions";
import { renderFileCard } from "./file-block-view";
import { renderNodeRichTextEditor } from "./node-rich-text-editor";
import { ImagePreviewModal } from "./editor-modals";
import { createArticleNumberingControls } from "./appearance-modal";
import type { MindMapEditorCallbacks, MindMapEditorOptions } from "./editor-types";


/** 节点编辑弹窗读写的完整字段集合。 */
export interface NodeEditValues {
  content: MindMapContentBlock[];
  note: string;
  link: string;
  icon: string;
  tags: string[];
  articleNumberingMode?: ArticleNumberingMode;
  articleNumberingLevel?: number;
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
export class NodeEditModal extends Modal {
  private readonly node: MindMapNode;
  private readonly defaultShape: NodeShape;
  private readonly callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource" | "onScheduleAutoUpload" | "onSaveAttachmentFile" | "onScheduleFileAssetDeletion" | "onOpenFileAsset">;
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
   * @param articleMiniMap 当前脑图保存的阅读缩略导航图覆盖值；undefined 表示跟随插件设置。
   * @param globalArticleMiniMap 插件设置中的阅读缩略导航图默认值，用于界面提示和回退。
   * @param submit 提交主题、文章编号、目录及缩略导航图配置的回调。
   * @param position 编辑器显示在居中弹窗还是右侧画布面板。
   * @param panelHost 右侧面板需要限制在其中的画布元素。
   */
  constructor(
    app: App,
    node: MindMapNode,
    defaultShape: NodeShape,
    callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource" | "onScheduleAutoUpload" | "onSaveAttachmentFile" | "onScheduleFileAssetDeletion" | "onOpenFileAsset">,
    submit: (values: NodeEditValues, mode: "autosave" | "commit") => void,
    private readonly richTextShortcuts: Pick<MindMapEditorOptions["richTextShortcuts"], "bold" | "italic" | "underline" | "color">,
    private readonly position: "center" | "right" = "center",
    private readonly panelHost?: HTMLElement,
    private readonly initialBlockId?: string
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
      text: "节点内容由可排序的文字、图片、表格和代码块组成，可按需要组合和调整顺序。"
    });

    let workingBlocks: MindMapContentBlock[] = JSON.parse(JSON.stringify(nodeContentBlocks(this.node))) as MindMapContentBlock[];
    if (!workingBlocks.length) workingBlocks = [{ id: newId(), type: "text", text: "新节点" }];
    let scheduleAutoSave: () => void = () => undefined;
    const pendingAutoUploads = new Map<string, { path: string; filename: string }>();

    const actionRow = form.createDiv({ cls: "mmc-content-block-actions" });
    const blocksEl = form.createDiv({ cls: "mmc-content-block-list" });
    let draggedBlockId: string | null = null;

    const cloneBlocks = (): MindMapContentBlock[] => JSON.parse(JSON.stringify(workingBlocks)) as MindMapContentBlock[];
    /** 从工作块列表移除一个块；文件块引用被删除后进入插件层 60 秒延迟回收。 */
    const removeWorkingBlock = (blockId: string): void => {
      const currentIndex = workingBlocks.findIndex((item) => item.id === blockId);
      if (currentIndex < 0) return;
      const [removed] = workingBlocks.splice(currentIndex, 1);
      if (removed?.type === "file" && removed.source.trim()) {
        this.callbacks.onScheduleFileAssetDeletion([removed.source]);
      }
      renderBlocks();
      scheduleAutoSave();
    };
    const validBlocks = (): MindMapContentBlock[] => cloneBlocks().filter((block) => {
      if (block.type === "image") return Boolean(block.source.trim());
      if (block.type === "file") return Boolean(block.source.trim() && block.name.trim());
      if (block.type === "table") return Boolean(block.table.headers.some((header) => header.trim()));
      if (block.type === "code") return Boolean(block.code.code.trim());
      return Boolean(block.text.trim());
    });

    const renderBlocks = (): void => {
      blocksEl.empty();
      workingBlocks.forEach((block, index) => {
        const card = blocksEl.createDiv({ cls: `mmc-content-block is-${block.type}` });
        card.dataset.blockId = block.id;
        card.toggleClass("is-targeted", block.id === this.initialBlockId);
        const header = card.createDiv({ cls: "mmc-content-block-header" });
        const blockTitle = block.type === "text" ? "文字块" : block.type === "image" ? "图片块" : block.type === "table" ? "表格块" : block.type === "file" ? "文件块" : "代码块";
        header.createSpan({ cls: "mmc-content-block-title", text: `${blockTitle} ${index + 1}` });
        const controls = header.createDiv({ cls: "mmc-content-block-controls" });
        const control = (icon: string, title: string, action: () => void, disabled = false): void => {
          const btn = controls.createEl("button", { cls: "clickable-icon", attr: { type: "button", title, "aria-label": title } });
          setIcon(btn, icon); btn.disabled = disabled;
          btn.addEventListener("click", (event) => { event.preventDefault(); action(); });
        };
        const dragHandle = controls.createEl("button", {
          cls: "clickable-icon mmc-content-block-editor-drag-handle",
          attr: { type: "button", title: "拖动内容块", "aria-label": "拖动内容块", draggable: "true" }
        });
        setIcon(dragHandle, "grip-vertical");
        dragHandle.addEventListener("pointerdown", (event) => event.stopPropagation());
        dragHandle.addEventListener("click", (event) => event.preventDefault());
        dragHandle.addEventListener("dragstart", (event) => {
          event.stopPropagation();
          draggedBlockId = block.id;
          event.dataTransfer?.setData("application/x-mms-content-block", block.id);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
          card.addClass("is-block-dragging");
        });
        dragHandle.addEventListener("dragend", () => {
          draggedBlockId = null;
          blocksEl.querySelectorAll(".is-block-dragging, .is-block-drop-before, .is-block-drop-after")
            .forEach((element) => element.removeClasses(["is-block-dragging", "is-block-drop-before", "is-block-drop-after"]));
        });
        card.addEventListener("dragover", (event) => {
          if (!draggedBlockId || draggedBlockId === block.id) return;
          event.preventDefault();
          event.stopPropagation();
          blocksEl.querySelectorAll(".is-block-drop-before, .is-block-drop-after")
            .forEach((element) => element.removeClasses(["is-block-drop-before", "is-block-drop-after"]));
          const position = event.clientY < card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2 ? "before" : "after";
          card.addClass(`is-block-drop-${position}`);
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        });
        card.addEventListener("drop", (event) => {
          if (!draggedBlockId || draggedBlockId === block.id) return;
          event.preventDefault();
          event.stopPropagation();
          const sourceIndex = workingBlocks.findIndex((item) => item.id === draggedBlockId);
          const targetIndex = workingBlocks.findIndex((item) => item.id === block.id);
          if (sourceIndex < 0 || targetIndex < 0) return;
          const position = event.clientY < card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2 ? "before" : "after";
          const [moving] = workingBlocks.splice(sourceIndex, 1);
          if (!moving) return;
          const updatedTargetIndex = workingBlocks.findIndex((item) => item.id === block.id);
          workingBlocks.splice(updatedTargetIndex + (position === "after" ? 1 : 0), 0, moving);
          draggedBlockId = null;
          renderBlocks();
          scheduleAutoSave();
        });
        card.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const menu = new Menu();
          menu.addItem((item) => item.setTitle("删除当前块").setIcon("trash-2").onClick(() => removeWorkingBlock(block.id)));
          menu.showAtMouseEvent(event);
        });
        control("arrow-up", "上移", () => { [workingBlocks[index - 1], workingBlocks[index]] = [workingBlocks[index]!, workingBlocks[index - 1]!]; renderBlocks(); scheduleAutoSave(); }, index === 0);
        control("arrow-down", "下移", () => { [workingBlocks[index + 1], workingBlocks[index]] = [workingBlocks[index]!, workingBlocks[index + 1]!]; renderBlocks(); scheduleAutoSave(); }, index === workingBlocks.length - 1);
        control("trash-2", "删除内容块", () => removeWorkingBlock(block.id));
        if (block.type === "text") {
          renderNodeRichTextEditor(
            card.createDiv({ cls: "mmc-content-block-body" }),
            block,
            scheduleAutoSave,
            this.richTextShortcuts
          );
        } else if (block.type === "image") {
          const body = card.createDiv({ cls: "mmc-content-block-body mmc-image-block-editor" });
          const preview = body.createDiv({ cls: "mmc-image-block-preview" });
          const refresh = (): void => {
            preview.empty();
            const resolved = this.callbacks.resolveImage(block.source);
            if (resolved) {
              const img = preview.createEl("img", { attr: { src: resolved, alt: block.alt || "图片" } });
              img.addEventListener("click", () => new ImagePreviewModal(
                this.app,
                resolved,
                block.alt || "图片",
                imageSourceCandidates(block, true),
                (source) => this.callbacks.resolveImage(source)
              ).open());
            } else preview.createDiv({ cls: "mmc-image-placeholder", text: block.source ? "无法加载图片" : "尚未选择图片" });
            source.value = block.source;
            alt.value = block.alt ?? "";
          };
          const sourceLabel = body.createEl("label", { text: "图片路径或网址" });
          const source = sourceLabel.createEl("input", { type: "text", attr: { placeholder: "仓库路径、[[图片]] 或 https://..." } });
          const altLabel = body.createEl("label", { text: "图片说明（可选）" });
          const alt = altLabel.createEl("input", { type: "text", attr: { placeholder: "图片说明" } });
          const sizeGrid = body.createDiv({ cls: "mmc-image-size-inputs" });
          const addSizeInput = (labelText: string, key: "width" | "height"): void => {
            const label = sizeGrid.createEl("label", { text: labelText });
            const input = label.createEl("input", { type: "number", attr: { min: "20", max: "2000", step: "1", placeholder: "自动" } });
            input.value = block[key] === undefined ? "" : String(block[key]);
            input.addEventListener("input", () => {
              const value = Number(input.value);
              block[key] = input.value && Number.isFinite(value) ? Math.max(20, Math.min(2000, Math.round(value))) : undefined;
              scheduleAutoSave();
            });
          };
          addSizeInput("显示宽度（px）", "width");
          addSizeInput("显示高度（px）", "height");
          const layoutLabel = body.createEl("label", { text: "图片排版" });
          const layout = layoutLabel.createEl("select");
          layout.createEl("option", { value: "block", text: "独占一行" });
          layout.createEl("option", { value: "inline", text: "与相邻图片同行" });
          layout.value = block.layout ?? "block";
          layout.addEventListener("change", () => {
            block.layout = layout.value === "inline" ? "inline" : undefined;
            scheduleAutoSave();
          });
          const alignLabel = body.createEl("label", { text: "图片对齐" });
          const align = alignLabel.createEl("select");
          ([
            ["left", "左对齐"],
            ["center", "居中"],
            ["right", "右对齐"]
          ] as const).forEach(([value, label]) => align.createEl("option", { value, text: label }));
          align.value = block.align ?? "center";
          align.addEventListener("change", () => {
            block.align = align.value === "left" || align.value === "right" ? align.value : undefined;
            scheduleAutoSave();
          });
          source.addEventListener("input", () => {
            const next = source.value.trim();
            if (next !== block.source) {
              block.source = next;
              block.localSource = undefined;
              block.remoteSources = undefined;
              block.contentHash = undefined;
            }
            refresh();
            scheduleAutoSave();
          });
          alt.addEventListener("input", () => { block.alt = alt.value.trim() || undefined; scheduleAutoSave(); });
          const actions = body.createDiv({ cls: "mmc-image-block-actions" });
          const pasteCurrent = actions.createEl("button", { text: "粘贴剪贴板图片", attr: { type: "button" } });
          pasteCurrent.addEventListener("click", () => { void pasteClipboardImage(block); });
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
        } else if (block.type === "file") {
          const body = card.createDiv({ cls: "mmc-content-block-body mmc-file-block-editor" });
          renderFileCard(body, block, {
            cls: "is-editor",
            onOpen: () => void this.callbacks.onOpenFileAsset(block.source)
          });
          body.createDiv({ cls: "setting-item-description", text: `附件路径：${block.source}` });
        } else if (block.type === "table") {
          const body = card.createDiv({ cls: "mmc-content-block-body" });
          body.createDiv({ cls: "setting-item-description", text: `${block.table.headers.length} 列 · ${block.table.rows.length} 行` });
          const edit = body.createEl("button", { text: "编辑表格", attr: { type: "button" } });
          edit.addEventListener("click", () => new TableEditModal(this.app, block.table, (table) => {
            block.table = table;
            renderBlocks();
            scheduleAutoSave();
          }).open());
        } else {
          const body = card.createDiv({ cls: "mmc-content-block-body" });
          body.createDiv({ cls: "setting-item-description", text: block.code.language || "bash" });
          const edit = body.createEl("button", { text: "编辑代码", attr: { type: "button" } });
          edit.addEventListener("click", () => new CodeEditModal(this.app, block.code, (code) => {
            block.code = code;
            renderBlocks();
            scheduleAutoSave();
          }).open());
        }
      });
      if (!workingBlocks.length) blocksEl.createDiv({ cls: "mmc-empty-content-hint", text: "当前没有内容块。请添加文字、图片、表格或代码。" });
    };

    const suggestedClipboardImageName = (blob: Blob): string => {
      const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg").replace("svg+xml", "svg") || "png";
      return `mindmap-image.${extension}`;
    };

    const savePastedImage = async (blob: Blob, existingBlock?: MindMapImageContentBlock, suppliedName?: string): Promise<void> => {
      const filename = suppliedName || suggestedClipboardImageName(blob);
      let path: string;
      try {
        path = await this.callbacks.onSavePastedImage(blob, filename);
      } catch (error) {
        console.error("MindMap Studio node modal paste image storage failed", error);
        new Notice(`粘贴图片失败：${error instanceof Error ? error.message : String(error)}`, 7000);
        return;
      }
      const block = existingBlock ?? { id: newId(), type: "image", source: "" };
      block.source = path;
      block.localSource = path;
      block.remoteSources = undefined;
      block.contentHash = undefined;
      if (!existingBlock) workingBlocks.push(block);
      pendingAutoUploads.set(block.id, { path, filename });
      renderBlocks();
      scheduleAutoSave();
      new Notice("图片已从剪贴板添加到当前节点");
    };

    const readClipboardImage = async (): Promise<{ blob: Blob; filename: string } | null> => {
      if (!navigator.clipboard?.read) {
        new Notice("当前环境无法直接读取剪贴板，请在编辑节点窗口中按 Ctrl/Cmd+V");
        return null;
      }
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const type = item.types.find((candidate) => candidate.startsWith("image/"));
          if (!type) continue;
          const blob = await item.getType(type);
          return { blob, filename: suggestedClipboardImageName(blob) };
        }
      } catch (error) {
        console.error("MindMap Studio node modal clipboard read failed", error);
        new Notice("无法直接读取剪贴板，请在编辑节点窗口中按 Ctrl/Cmd+V");
        return null;
      }
      new Notice("剪贴板中没有可粘贴的图片");
      return null;
    };

    const pasteClipboardImage = async (existingBlock?: MindMapImageContentBlock): Promise<void> => {
      const image = await readClipboardImage();
      if (!image) return;
      await savePastedImage(image.blob, existingBlock, image.filename);
    };

    form.addEventListener("paste", (event) => {
      const imageItem = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.kind === "file" && item.type.startsWith("image/"));
      const blob = imageItem?.getAsFile();
      if (!blob) return;
      event.preventDefault();
      event.stopPropagation();
      void savePastedImage(blob, undefined, blob.name || suggestedClipboardImageName(blob));
    }, true);

    const addText = actionRow.createEl("button", { text: "+ 文字", attr: { type: "button" } });
    addText.addEventListener("click", () => { workingBlocks.push({ id: newId(), type: "text", text: "" }); renderBlocks(); scheduleAutoSave(); });
    const addImage = actionRow.createEl("button", { text: "+ 图片", attr: { type: "button" } });
    addImage.addEventListener("click", () => { workingBlocks.push({ id: newId(), type: "image", source: "" }); renderBlocks(); scheduleAutoSave(); });
    const pasteImage = actionRow.createEl("button", { text: "+ 粘贴图片", attr: { type: "button" } });
    pasteImage.addEventListener("click", () => { void pasteClipboardImage(); });
    const addTable = actionRow.createEl("button", { text: "+ 表格", attr: { type: "button" } });
    addTable.addEventListener("click", () => { workingBlocks.push({ id: newId(), type: "table", table: { headers: ["列 1", "列 2"], rows: [["", ""]], source: "manual" } }); renderBlocks(); scheduleAutoSave(); });
    const addCode = actionRow.createEl("button", { text: "+ 代码", attr: { type: "button" } });
    addCode.addEventListener("click", () => { workingBlocks.push({ id: newId(), type: "code", code: { language: "bash", code: "" } }); renderBlocks(); scheduleAutoSave(); });
    const addFile = actionRow.createEl("button", { text: "+ 文件", attr: { type: "button" } });
    addFile.addEventListener("click", () => {
      void (async (): Promise<void> => {
        try {
          const file = await selectAnyFile();
          if (!file) return;
          const path = await this.callbacks.onSaveAttachmentFile(file);
          workingBlocks.push({
            id: newId(),
            type: "file",
            source: path,
            name: file.name || path.split("/").pop() || "附件",
            size: file.size > 0 ? file.size : undefined
          });
          renderBlocks();
          scheduleAutoSave();
          new Notice("文件已添加到当前节点");
        } catch (error) {
          console.error("MindMap Studio node modal file upload failed", error);
          new Notice(`添加文件失败：${error instanceof Error ? error.message : String(error)}`, 7000);
        }
      })();
    });
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
    const shapeLabel = detailsGrid.createEl("label", { text: "节点形状" });
    const shapeSelect = shapeLabel.createEl("select");
    for (const [value, label] of [["rounded", "圆角"], ["pill", "胶囊"], ["rectangle", "直角"]] as const) shapeSelect.createEl("option", { text: label, attr: { value } });
    shapeSelect.value = this.node.style?.shape ?? this.defaultShape;
    const tagsLabel = detailsGrid.createEl("label", { text: "标签（逗号分隔）" });
    const tagsInput = tagsLabel.createEl("input", { type: "text" });
    tagsInput.value = this.node.tags?.join(", ") ?? "";

    const numberingControls = createArticleNumberingControls(
      detailsGrid,
      this.node.articleNumberingMode,
      this.node.articleNumberingLevel,
      () => scheduleAutoSave()
    );

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
      if (!content.length) {
        if (showNotice) {
          new Notice("节点至少需要一个内容块");
        }
        return null;
      }
      const shape = shapeSelect.value;
      const numbering = numberingControls.read();
      return {
        content,
        note: noteInput.value.trim(), link: linkInput.value.trim(), icon: iconInput.value.trim().slice(0, 12),
        tags: Array.from(new Set(tagsInput.value.split(/[,，]/).map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean))).slice(0, 12),
        articleNumberingMode: numbering.articleNumberingMode,
        articleNumberingLevel: numbering.articleNumberingLevel,
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
      if (signature !== last) {
        this.submit(values, mode);
        last = signature;
        for (const [blockId, pending] of pendingAutoUploads) {
          if (!values.content.some((block) => block.type === "image" && block.id === blockId)) {
            pendingAutoUploads.delete(blockId);
            continue;
          }
          try {
            this.callbacks.onScheduleAutoUpload(this.node.id, blockId, pending.path, pending.filename);
          } catch (error) {
            console.error("MindMap Studio node modal paste image auto-upload scheduling failed", error);
          } finally {
            pendingAutoUploads.delete(blockId);
          }
        }
      }
      return true;
    };
    scheduleAutoSave = (): void => { if (timer !== null) window.clearTimeout(timer); timer = window.setTimeout(() => saveNow("autosave"), 280); };
    this.saveOnClose = () => { saveNow("commit"); };
    form.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (saveNow("commit", true)) {
        this.closeWithoutFlush = true;
        this.close();
      }
    }, true);

    [iconInput, shapeSelect, tagsInput, borderWidthInput, fontSizeInput, widthInput, minHeightInput, alignSelect, boldInput, italicInput, underlineInput, noteInput, linkInput]
      .forEach((input) => { input.addEventListener("input", scheduleAutoSave); input.addEventListener("change", scheduleAutoSave); });

    const buttons = form.createDiv({ cls: "mmc-form-actions" });
    const closeButton = buttons.createEl("button", { cls: "mod-cta", text: "保存并关闭", attr: { type: "button" } });
    closeButton.addEventListener("click", () => { if (saveNow("commit", true)) { this.closeWithoutFlush = true; this.close(); } });

    this.outsidePointerHandler = (event: PointerEvent): void => {
      const targetNode = event.target as Node | null;
      const targetElement = targetNode instanceof Element ? targetNode : targetNode?.parentElement;
      if (targetNode && this.modalEl.contains(targetNode)) return;

      // 图床选择、图片预览等子弹窗拥有独立的 modal-container。
      // 它们打开期间的点击（包括遮罩和关闭按钮）不应关闭节点编辑面板。
      const ownModalContainer = this.modalEl.closest(".modal-container");
      const targetModal = targetElement?.closest(".modal");
      const targetModalContainer = targetElement?.closest(".modal-container");
      if (targetModal && targetModal !== this.modalEl) return;
      if (targetModalContainer && ownModalContainer && targetModalContainer !== ownModalContainer) return;

      if (this.position === "right" && targetElement?.closest(".mmc-node")) return;
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
