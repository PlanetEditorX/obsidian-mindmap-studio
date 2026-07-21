/**
 * @file content-modals.ts
 * @description 表格与代码块编辑弹窗。
 *
 * 弹窗收集结构化输入；实际文档写入、撤销记录和自动保存由 MindMapEditor 统一处理。
 */

import { App, Modal, Notice } from "obsidian";
import {
  parseFencedCode,
  parseMarkdownTable,
  tableToMarkdown,
  type MindMapCodeBlock,
  type MindMapTable,
  type TableAlignment
} from "./model";

/**
 * 执行“clone table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param table 待编辑、转换或导出的表格数据。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function cloneTable(table: MindMapTable | undefined): MindMapTable {
  if (!table) {
    return {
      headers: ["列 1", "列 2"],
      rows: [["", ""], ["", ""]],
      alignments: ["left", "left"],
      source: "manual"
    };
  }
  return JSON.parse(JSON.stringify(table)) as MindMapTable;
}

/**
 * TableEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class TableEditModal extends Modal {
  private table: MindMapTable;
  private readonly submit: (table: MindMapTable) => void;
  private gridEl!: HTMLDivElement;
  private markdownEl!: HTMLTextAreaElement;

  /**
   * 创建 TableEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param table 待编辑、转换或导出的表格数据。
   * @param submit 该参数用于 constructor 流程中的输入或控制。
   */
  constructor(app: App, table: MindMapTable | undefined, submit: (table: MindMapTable) => void) {
    super(app);
    this.table = cloneTable(table);
    this.submit = submit;
  }

  /**
   * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
   */
  onOpen(): void {
    this.titleEl.setText("插入或编辑表格");
    this.contentEl.addClass("mmc-table-modal");

    const description = this.contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "可以直接编辑单元格，也可以粘贴 Markdown 表格后点击“解析 Markdown”。"
    });
    description.setAttr("aria-live", "polite");

    const toolbar = this.contentEl.createDiv({ cls: "mmc-table-toolbar" });
    const addRow = toolbar.createEl("button", { text: "+ 行", type: "button" });
    const removeRow = toolbar.createEl("button", { text: "− 行", type: "button" });
    const addColumn = toolbar.createEl("button", { text: "+ 列", type: "button" });
    const removeColumn = toolbar.createEl("button", { text: "− 列", type: "button" });
    const toMarkdown = toolbar.createEl("button", { text: "生成 Markdown", type: "button" });

    this.gridEl = this.contentEl.createDiv({ cls: "mmc-table-editor-grid" });
    this.renderGrid();

    const markdownLabel = this.contentEl.createEl("label", { text: "Markdown 表格" });
    this.markdownEl = markdownLabel.createEl("textarea", {
      cls: "mmc-table-markdown",
      attr: { placeholder: "| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |" }
    });
    this.markdownEl.rows = 8;
    this.markdownEl.value = tableToMarkdown(this.table);
    const parseButton = markdownLabel.createEl("button", { text: "解析 Markdown", type: "button" });

    addRow.addEventListener("click", () => {
      this.collectGrid();
      this.table.rows.push(this.table.headers.map(() => ""));
      this.renderGrid();
    });
    removeRow.addEventListener("click", () => {
      this.collectGrid();
      if (this.table.rows.length) this.table.rows.pop();
      this.renderGrid();
    });
    addColumn.addEventListener("click", () => {
      this.collectGrid();
      if (this.table.headers.length >= 12) { new Notice("最多支持 12 列"); return; }
      this.table.headers.push(`列 ${this.table.headers.length + 1}`);
      this.table.alignments ??= [];
      this.table.alignments.push("left");
      this.table.rows.forEach((row) => row.push(""));
      this.renderGrid();
    });
    removeColumn.addEventListener("click", () => {
      this.collectGrid();
      if (this.table.headers.length <= 1) return;
      this.table.headers.pop();
      this.table.alignments?.pop();
      this.table.rows.forEach((row) => row.pop());
      this.renderGrid();
    });
    toMarkdown.addEventListener("click", () => {
      this.collectGrid();
      this.markdownEl.value = tableToMarkdown(this.table);
    });
    parseButton.addEventListener("click", () => {
      const parsed = parseMarkdownTable(this.markdownEl.value);
      if (!parsed) {
        new Notice("未识别到有效的 Markdown 表格");
        return;
      }
      this.table = parsed;
      this.renderGrid();
      new Notice("Markdown 表格已解析");
    });

    const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消", type: "button" });
    const save = actions.createEl("button", { text: "保存表格", type: "button", cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    save.addEventListener("click", () => {
      this.collectGrid();
      if (!this.table.headers.some((header) => header.trim())) {
        new Notice("至少需要一个表头");
        return;
      }
      this.table.source = this.table.source ?? "manual";
      this.submit(this.table);
      this.close();
    });
  }

  /**
   * 渲染grid，并保持模型、界面和持久化状态的一致性。
   */
  private renderGrid(): void {
    this.gridEl.empty();
    const table = this.gridEl.createEl("table");
    const head = table.createEl("thead").createEl("tr");
    this.table.headers.forEach((header, index) => {
      const th = head.createEl("th");
      const input = th.createEl("input", { type: "text", attr: { "data-kind": "header", "data-column": String(index) } });
      input.value = header;
      const align = th.createEl("select", { attr: { "data-kind": "alignment", "data-column": String(index), "aria-label": `第 ${index + 1} 列对齐方式` } });
      ([['left', '左'], ['center', '中'], ['right', '右']] as Array<[TableAlignment, string]>).forEach(([value, label]) => align.createEl("option", { text: label, attr: { value } }));
      align.value = this.table.alignments?.[index] ?? "left";
    });
    const body = table.createEl("tbody");
    this.table.rows.forEach((row, rowIndex) => {
      const tr = body.createEl("tr");
      this.table.headers.forEach((_, columnIndex) => {
        const td = tr.createEl("td");
        const input = td.createEl("textarea", { attr: { "data-kind": "cell", "data-row": String(rowIndex), "data-column": String(columnIndex) } });
        input.rows = 2;
        input.value = row[columnIndex] ?? "";
      });
    });
  }

  /**
   * 遍历并收集grid，并保持模型、界面和持久化状态的一致性。
   */
  private collectGrid(): void {
    const headers = Array.from(this.gridEl.querySelectorAll<HTMLInputElement>('input[data-kind="header"]'));
    headers.forEach((input) => {
      const column = Number(input.dataset.column);
      if (Number.isInteger(column)) this.table.headers[column] = input.value.trim().slice(0, 2000);
    });
    const alignments = Array.from(this.gridEl.querySelectorAll<HTMLSelectElement>('select[data-kind="alignment"]'));
    this.table.alignments = this.table.headers.map(() => "left");
    alignments.forEach((input) => {
      const column = Number(input.dataset.column);
      if (Number.isInteger(column)) this.table.alignments![column] = input.value === "center" || input.value === "right" ? input.value : "left";
    });
    const cells = Array.from(this.gridEl.querySelectorAll<HTMLTextAreaElement>('textarea[data-kind="cell"]'));
    cells.forEach((input) => {
      const row = Number(input.dataset.row);
      const column = Number(input.dataset.column);
      if (Number.isInteger(row) && Number.isInteger(column) && this.table.rows[row]) this.table.rows[row]![column] = input.value.slice(0, 2000);
    });
  }
}

/**
 * CodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class CodeEditModal extends Modal {
  private readonly block: MindMapCodeBlock | undefined;
  private readonly submit: (block: MindMapCodeBlock) => void;

  /**
   * 创建 CodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param block 当前内容块，通常是文字块或图片块。
   * @param submit 该参数用于 constructor 流程中的输入或控制。
   */
  constructor(app: App, block: MindMapCodeBlock | undefined, submit: (block: MindMapCodeBlock) => void) {
    super(app);
    this.block = block;
    this.submit = submit;
  }

  /**
   * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
   */
  onOpen(): void {
    this.titleEl.setText("插入或编辑代码");
    this.contentEl.addClass("mmc-code-modal");
    const languageLabel = this.contentEl.createEl("label", { text: "代码语言" });
    const languageInput = languageLabel.createEl("input", { type: "text", attr: { placeholder: "javascript、python、css…" } });
    languageInput.value = this.block?.language ?? "";

    const codeLabel = this.contentEl.createEl("label", { text: "代码内容" });
    const codeInput = codeLabel.createEl("textarea", { cls: "mmc-code-textarea", attr: { spellcheck: "false", placeholder: "可直接粘贴代码，或粘贴 ```语言 ... ``` fenced code block" } });
    codeInput.rows = 18;
    codeInput.value = this.block?.code ?? "";

    const detect = this.contentEl.createEl("button", { text: "识别 fenced code", type: "button" });
    detect.addEventListener("click", () => {
      const parsed = parseFencedCode(codeInput.value);
      if (!parsed) { new Notice("没有识别到完整的 ``` fenced code block"); return; }
      languageInput.value = parsed.language ?? "";
      codeInput.value = parsed.code;
      new Notice("代码语言和内容已识别");
    });

    const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消", type: "button" });
    const save = actions.createEl("button", { text: "保存代码", type: "button", cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    save.addEventListener("click", () => {
      let language = languageInput.value.trim();
      let code = codeInput.value;
      const fenced = parseFencedCode(code);
      if (fenced) {
        language = fenced.language ?? language;
        code = fenced.code;
      }
      if (!code.trim()) { new Notice("代码内容不能为空"); return; }
      this.submit({ language: language.replace(/[^a-z0-9_+#.-]/gi, "").slice(0, 40) || undefined, code });
      this.close();
    });
  }
}
