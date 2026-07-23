/**
 * @file editor-modals.ts
 * @description 与编辑器状态弱耦合的通用预览、搜索和导出弹窗。
 */

import { App, Modal, Notice } from "obsidian";
import { nodePrimaryText, nodeSearchText, type MindMapNode } from "./model";

/**
 * 提供图片缩放和滚轮预览。
 */
export class ImagePreviewModal extends Modal {
  private scale = 1;

  /**
   * 创建图片预览弹窗。
   *
   * @param app Obsidian 应用实例。
   * @param source 图片资源地址。
   * @param alt 图片说明。
   */
  constructor(app: App, private readonly source: string, private readonly alt: string) {
    super(app);
  }

  /**
   * 创建图片预览界面和缩放控制。
   */
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
      const element = toolbar.createEl("button", { text: label, attr: { type: "button" } });
      element.addEventListener("click", action);
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

/**
 * 搜索当前文档中的节点。
 */
export class SearchNodesModal extends Modal {
  /**
   * 创建节点搜索弹窗。
   *
   * @param app Obsidian 应用实例。
   * @param nodes 可搜索节点。
   * @param onQuery 查询变化回调。
   * @param onSelect 节点选择回调。
   */
  constructor(
    app: App,
    private readonly nodes: MindMapNode[],
    private readonly onQuery: (query: string) => void,
    private readonly onSelect: (node: MindMapNode) => void
  ) {
    super(app);
  }

  /**
   * 创建搜索框和匹配结果列表。
   */
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
        title.createSpan({ text: nodePrimaryText(node) || "图片节点" });
        const details = [
          node.task ? ({ todo: "待办", doing: "进行中", done: "已完成" } as const)[node.task] : "",
          ...(node.tags ?? []).map((tag) => `#${tag}`)
        ].filter(Boolean).join(" · ");
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
      if (event.key !== "Enter") return;
      const first = results.querySelector<HTMLButtonElement>(".mmc-search-result");
      if (first) {
        event.preventDefault();
        first.click();
      }
    });
    renderResults();
    window.setTimeout(() => input.focus(), 20);
  }
}

/**
 * 提供可移植文档格式的导出选择。
 */
export class DocumentExportModal extends Modal {
  /**
   * 创建文档导出格式弹窗。
   *
   * @param app Obsidian 应用实例。
   * @param exportFormat 格式选择回调。
   */
  constructor(app: App, private readonly exportFormat: (format: "html" | "doc" | "pdf" | "md") => void) {
    super(app);
  }

  /**
   * 创建各导出格式按钮。
   */
  onOpen(): void {
    this.titleEl.setText("导出文档");
    this.contentEl.createEl("p", { cls: "setting-item-description", text: "选择适合阅读、编辑或打印的格式。" });
    const formats = this.contentEl.createDiv({ cls: "mms-document-export-grid" });
    for (const [format, title, description] of [
      ["html", "HTML", "独立网页，可用浏览器打开"],
      ["doc", "Word", "Word 兼容文档（.doc）"],
      ["pdf", "PDF", "打开打印版并另存为 PDF"],
      ["md", "Markdown", "保留标题和节点层级"]
    ] as const) {
      const button = formats.createEl("button", { attr: { type: "button" } });
      button.createEl("strong", { text: title });
      button.createSpan({ text: description });
      button.addEventListener("click", () => {
        this.exportFormat(format);
        this.close();
      });
    }
  }
}
