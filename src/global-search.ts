import { App, Modal, Notice, TFile, normalizePath, setIcon } from "obsidian";
import {
  nodeContentBlocks,
  nodePlainText,
  nodeSearchText,
  parseDocument,
  type MindMapDocument,
  type MindMapNode
} from "./model";

export interface MindMapSearchEntry {
  key: string;
  filePath: string;
  fileTitle: string;
  nodeId: string;
  nodeText: string;
  breadcrumb: string[];
  depth: number;
  searchableText: string;
  note?: string;
  tags?: string[];
  matchedKinds?: string[];
  submapPath?: string;
  isSubmapDocument?: boolean;
  parentMapPath?: string;
}

export interface MindMapSearchResult extends MindMapSearchEntry {
  score: number;
  matchedKind: string;
  snippet: string;
}

interface IndexedMindMapFile {
  mtime: number;
  size: number;
  title: string;
  entries: MindMapSearchEntry[];
}

interface PersistedMindMapSearchIndex {
  version: 1;
  generatedAt: string;
  files: Record<string, IndexedMindMapFile>;
}

export interface MindMapSearchIndexStatus {
  ready: boolean;
  building: boolean;
  files: number;
  nodes: number;
  lastBuiltAt?: string;
}

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function compact(value: string | undefined, max = 180): string | undefined {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function nodeDisplayText(node: MindMapNode): string {
  const text = nodePlainText(node).trim();
  if (text) return text;
  if (node.code?.code.trim()) return `代码：${compact(node.code.code, 64)}`;
  if (node.table) return `表格：${node.table.headers.join(" / ") || `${node.table.rows.length} 行`}`;
  if (nodeContentBlocks(node).some((block) => block.type === "image")) return "图片节点";
  return "未命名节点";
}

function fieldValues(node: MindMapNode): Array<{ kind: string; value: string }> {
  const values: Array<{ kind: string; value: string }> = [];
  const text = nodePlainText(node).trim();
  if (text) values.push({ kind: "节点文字", value: text });
  if (node.note?.trim()) values.push({ kind: "备注", value: node.note });
  if (node.tags?.length) values.push({ kind: "标签", value: node.tags.join(" ") });
  if (node.link?.trim()) values.push({ kind: "链接", value: node.link });
  if (node.icon?.trim()) values.push({ kind: "图标", value: node.icon });
  if (node.task) values.push({ kind: "任务", value: node.task });
  if (node.submap?.path) values.push({ kind: "子导图", value: `${node.submap.title ?? ""} ${node.submap.path}` });
  if (node.code) values.push({ kind: "代码", value: `${node.code.language ?? ""}\n${node.code.code}` });
  if (node.table) values.push({ kind: "表格", value: [...node.table.headers, ...node.table.rows.flat()].join(" ") });
  const imageValues = nodeContentBlocks(node)
    .filter((block) => block.type === "image")
    .map((block) => `${block.alt ?? ""} ${block.source} ${block.localSource ?? ""}`)
    .join(" ");
  if (imageValues.trim()) values.push({ kind: "图片", value: imageValues });
  return values;
}

export function buildSearchEntries(document: MindMapDocument, filePath: string): MindMapSearchEntry[] {
  const entries: MindMapSearchEntry[] = [];
  const visit = (node: MindMapNode, ancestors: string[], depth: number): void => {
    const display = nodeDisplayText(node);
    const fields = fieldValues(node);
    const breadcrumb = [...ancestors, display];
    const searchText = normalized([
      document.title,
      filePath,
      ...breadcrumb,
      nodeSearchText(node),
      ...fields.map((field) => field.value)
    ].join(" "));
    entries.push({
      key: `${filePath}::${node.id}`,
      filePath,
      fileTitle: document.title || filePath.split("/").at(-1)?.replace(/\.mindmap$/i, "") || "思维导图",
      nodeId: node.id,
      nodeText: display,
      breadcrumb,
      depth,
      searchableText: searchText,
      note: compact(node.note),
      tags: node.tags?.slice(0, 20),
      matchedKinds: fields.map((field) => field.kind),
      submapPath: node.submap?.path,
      isSubmapDocument: Boolean(document.navigation?.parentPath),
      parentMapPath: document.navigation?.parentPath
    });
    node.children.forEach((child) => visit(child, breadcrumb, depth + 1));
  };
  visit(document.root, [], 0);
  return entries;
}

function resultSnippet(entry: MindMapSearchEntry, query: string): { kind: string; snippet: string } {
  const queryNormalized = normalized(query);
  const candidates: Array<{ kind: string; value?: string }> = [
    { kind: "节点文字", value: entry.nodeText },
    { kind: "备注", value: entry.note },
    { kind: "标签", value: entry.tags?.join("、") },
    { kind: "路径", value: entry.breadcrumb.join(" › ") },
    { kind: "文件", value: `${entry.fileTitle} ${entry.filePath}` },
    { kind: "内容", value: entry.searchableText }
  ];
  const matched = candidates.find((candidate) => candidate.value && normalized(candidate.value).includes(queryNormalized));
  return {
    kind: matched?.kind ?? "内容",
    snippet: compact(matched?.value ?? entry.nodeText, 220) ?? entry.nodeText
  };
}

export function searchEntries(entries: MindMapSearchEntry[], query: string, limit = 100): MindMapSearchResult[] {
  const phrase = normalized(query);
  if (!phrase) return [];
  const terms = phrase.split(/\s+/).filter(Boolean);
  const results: MindMapSearchResult[] = [];
  for (const entry of entries) {
    if (!terms.every((term) => entry.searchableText.includes(term))) continue;
    const nodeText = normalized(entry.nodeText);
    const fileTitle = normalized(entry.fileTitle);
    const breadcrumb = normalized(entry.breadcrumb.join(" "));
    let score = 0;
    if (nodeText === phrase) score += 500;
    else if (nodeText.startsWith(phrase)) score += 320;
    else if (nodeText.includes(phrase)) score += 230;
    if (fileTitle === phrase) score += 180;
    else if (fileTitle.includes(phrase)) score += 90;
    if (breadcrumb.includes(phrase)) score += 70;
    if (normalized(entry.tags?.join(" ") ?? "").includes(phrase)) score += 100;
    if (normalized(entry.note ?? "").includes(phrase)) score += 60;
    if (entry.isSubmapDocument) score += 5;
    score += Math.max(0, 25 - entry.depth * 2);
    const { kind, snippet } = resultSnippet(entry, query);
    results.push({ ...entry, score, matchedKind: kind, snippet });
  }
  return results.sort((left, right) => right.score - left.score || left.filePath.localeCompare(right.filePath) || left.depth - right.depth).slice(0, limit);
}

export class MindMapSearchIndex {
  private data: PersistedMindMapSearchIndex = { version: 1, generatedAt: new Date(0).toISOString(), files: {} };
  private ready = false;
  private building = false;
  private saveTimer: number | null = null;
  private readonly fileTimers = new Map<string, number>();
  private rebuildPromise: Promise<void> | null = null;

  constructor(
    private readonly app: App,
    private readonly indexPath: string,
    private readonly extension = "mindmap"
  ) {}

  async initialize(): Promise<void> {
    await this.load();
    await this.rebuildChangedFiles();
  }

  destroy(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    for (const timer of this.fileTimers.values()) window.clearTimeout(timer);
    this.fileTimers.clear();
    void this.saveNow();
  }

  getStatus(): MindMapSearchIndexStatus {
    const files = Object.keys(this.data.files).length;
    const nodes = Object.values(this.data.files).reduce((sum, file) => sum + file.entries.length, 0);
    return { ready: this.ready, building: this.building, files, nodes, lastBuiltAt: this.data.generatedAt };
  }

  allEntries(): MindMapSearchEntry[] {
    return Object.values(this.data.files).flatMap((file) => file.entries);
  }

  search(query: string, limit = 100): MindMapSearchResult[] {
    return searchEntries(this.allEntries(), query, limit);
  }

  queueFile(file: TFile, delay = 500): void {
    if (file.extension.toLocaleLowerCase() !== this.extension) return;
    const previous = this.fileTimers.get(file.path);
    if (previous !== undefined) window.clearTimeout(previous);
    const timer = window.setTimeout(() => {
      this.fileTimers.delete(file.path);
      void this.indexFile(file).then(() => this.scheduleSave());
    }, delay);
    this.fileTimers.set(file.path, timer);
  }

  removeFile(path: string): void {
    const normalizedPath = normalizePath(path);
    if (!this.data.files[normalizedPath]) return;
    delete this.data.files[normalizedPath];
    this.data.generatedAt = new Date().toISOString();
    this.scheduleSave();
  }

  renameFile(file: TFile, oldPath: string): void {
    this.removeFile(oldPath);
    this.queueFile(file, 50);
  }

  async rebuildAll(): Promise<void> {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this.performRebuild(true).finally(() => { this.rebuildPromise = null; });
    return this.rebuildPromise;
  }

  private async rebuildChangedFiles(): Promise<void> {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this.performRebuild(false).finally(() => { this.rebuildPromise = null; });
    return this.rebuildPromise;
  }

  private async performRebuild(force: boolean): Promise<void> {
    this.building = true;
    try {
      const files = this.app.vault.getFiles().filter((file) => file.extension.toLocaleLowerCase() === this.extension);
      const currentPaths = new Set(files.map((file) => file.path));
      for (const path of Object.keys(this.data.files)) {
        if (!currentPaths.has(path)) delete this.data.files[path];
      }
      for (const file of files) {
        const indexed = this.data.files[file.path];
        if (!force && indexed && indexed.mtime === file.stat.mtime && indexed.size === file.stat.size) continue;
        await this.indexFile(file);
      }
      this.data.generatedAt = new Date().toISOString();
      this.ready = true;
      await this.saveNow();
    } finally {
      this.building = false;
    }
  }

  private async indexFile(file: TFile): Promise<void> {
    try {
      const source = await this.app.vault.cachedRead(file);
      const document = parseDocument(source, file.basename);
      this.data.files[file.path] = {
        mtime: file.stat.mtime,
        size: file.stat.size,
        title: document.title,
        entries: buildSearchEntries(document, file.path)
      };
      this.data.generatedAt = new Date().toISOString();
      this.ready = true;
    } catch (error) {
      console.warn(`MindMap Studio could not index ${file.path}`, error);
      delete this.data.files[file.path];
    }
  }

  private async load(): Promise<void> {
    try {
      if (!(await this.app.vault.adapter.exists(this.indexPath))) {
        this.ready = true;
        return;
      }
      const parsed = JSON.parse(await this.app.vault.adapter.read(this.indexPath)) as Partial<PersistedMindMapSearchIndex>;
      if (parsed.version === 1 && parsed.files && typeof parsed.files === "object") {
        this.data = {
          version: 1,
          generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : new Date(0).toISOString(),
          files: parsed.files as Record<string, IndexedMindMapFile>
        };
      }
      this.ready = true;
    } catch (error) {
      console.warn("MindMap Studio could not load the global search index", error);
      this.data = { version: 1, generatedAt: new Date(0).toISOString(), files: {} };
      this.ready = true;
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.saveNow();
    }, 800);
  }

  private async saveNow(): Promise<void> {
    try {
      await this.app.vault.adapter.write(this.indexPath, JSON.stringify(this.data));
    } catch (error) {
      console.warn("MindMap Studio could not save the global search index", error);
    }
  }
}

function appendHighlightedText(container: HTMLElement, text: string, query: string): void {
  const phrase = query.trim();
  if (!phrase) {
    container.setText(text);
    return;
  }
  const lowerText = text.toLocaleLowerCase();
  const lowerPhrase = phrase.toLocaleLowerCase();
  const index = lowerText.indexOf(lowerPhrase);
  if (index < 0) {
    container.setText(text);
    return;
  }
  if (index > 0) container.appendText(text.slice(0, index));
  container.createEl("mark", { text: text.slice(index, index + phrase.length) });
  if (index + phrase.length < text.length) container.appendText(text.slice(index + phrase.length));
}

export class GlobalMindMapSearchModal extends Modal {
  private inputEl!: HTMLInputElement;
  private resultsEl!: HTMLDivElement;
  private summaryEl!: HTMLDivElement;
  private activeIndex = -1;
  private renderedResults: MindMapSearchResult[] = [];

  constructor(
    app: App,
    private readonly index: MindMapSearchIndex,
    private readonly maxResults: number,
    private readonly onOpenResult: (result: MindMapSearchResult) => void | Promise<void>,
    private readonly onRebuild: () => Promise<void>
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("mms-global-search-modal");
    this.titleEl.setText("全局搜索思维导图");
    const searchRow = this.contentEl.createDiv({ cls: "mms-global-search-row" });
    const icon = searchRow.createSpan({ cls: "mms-global-search-icon" });
    setIcon(icon, "search");
    this.inputEl = searchRow.createEl("input", {
      type: "search",
      cls: "mms-global-search-input",
      attr: { placeholder: "搜索所有导图、子节点和子导图…", autocomplete: "off", spellcheck: "false" }
    });
    const rebuild = searchRow.createEl("button", { cls: "mms-global-search-rebuild", attr: { type: "button", title: "重建搜索索引" } });
    setIcon(rebuild, "refresh-cw");
    this.summaryEl = this.contentEl.createDiv({ cls: "mms-global-search-summary" });
    this.resultsEl = this.contentEl.createDiv({ cls: "mms-global-search-results" });

    const render = (): void => this.renderResults(this.inputEl.value);
    this.inputEl.addEventListener("input", render);
    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.moveActive(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        this.moveActive(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const result = this.renderedResults[this.activeIndex >= 0 ? this.activeIndex : 0];
        if (result) void this.openResult(result);
      }
    });
    rebuild.addEventListener("click", async () => {
      rebuild.disabled = true;
      this.summaryEl.setText("正在重建索引…");
      try {
        await this.onRebuild();
        new Notice("思维导图搜索索引已重建");
        render();
      } finally {
        rebuild.disabled = false;
      }
    });
    this.renderResults("");
    window.setTimeout(() => this.inputEl.focus(), 20);
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private renderResults(query: string): void {
    this.resultsEl.empty();
    this.activeIndex = -1;
    const status = this.index.getStatus();
    const trimmed = query.trim();
    if (!trimmed) {
      this.renderedResults = [];
      this.summaryEl.setText(status.building
        ? `正在建立索引，已收录 ${status.files} 个导图、${status.nodes} 个节点…`
        : `已索引 ${status.files} 个导图、${status.nodes} 个节点。输入关键词开始搜索。`);
      const hint = this.resultsEl.createDiv({ cls: "mms-global-search-empty" });
      hint.createDiv({ text: "搜索范围" });
      hint.createEl("p", { text: "节点文字、富文本、备注、标签、表格、代码、链接、折叠分支和所有子导图。" });
      return;
    }

    this.renderedResults = this.index.search(trimmed, this.maxResults);
    this.summaryEl.setText(`找到 ${this.renderedResults.length}${this.renderedResults.length >= this.maxResults ? "+" : ""} 个结果 · 索引 ${status.files} 个导图 / ${status.nodes} 个节点`);
    if (!this.renderedResults.length) {
      this.resultsEl.createDiv({ cls: "mms-global-search-empty", text: status.building ? "索引仍在建立，请稍后重试。" : "没有匹配结果。" });
      return;
    }

    this.renderedResults.forEach((result, index) => {
      const button = this.resultsEl.createEl("button", { cls: "mms-global-search-result", attr: { type: "button" } });
      const header = button.createDiv({ cls: "mms-global-search-result-header" });
      const title = header.createDiv({ cls: "mms-global-search-result-title" });
      appendHighlightedText(title, result.nodeText, trimmed);
      const badges = header.createDiv({ cls: "mms-global-search-result-badges" });
      badges.createSpan({ cls: "mms-global-search-badge", text: result.matchedKind });
      if (result.isSubmapDocument) badges.createSpan({ cls: "mms-global-search-badge is-submap", text: "子导图" });
      const file = button.createDiv({ cls: "mms-global-search-result-file" });
      file.createSpan({ text: result.fileTitle });
      file.createSpan({ cls: "mms-global-search-result-path", text: result.filePath });
      button.createDiv({ cls: "mms-global-search-result-breadcrumb", text: result.breadcrumb.join(" › ") });
      if (result.snippet && result.snippet !== result.nodeText) {
        const snippet = button.createDiv({ cls: "mms-global-search-result-snippet" });
        appendHighlightedText(snippet, result.snippet, trimmed);
      }
      button.addEventListener("mouseenter", () => this.setActive(index));
      button.addEventListener("click", () => void this.openResult(result));
    });
    this.setActive(0);
  }

  private moveActive(delta: number): void {
    if (!this.renderedResults.length) return;
    const next = this.activeIndex < 0 ? 0 : (this.activeIndex + delta + this.renderedResults.length) % this.renderedResults.length;
    this.setActive(next);
  }

  private setActive(index: number): void {
    this.activeIndex = index;
    const buttons = Array.from(this.resultsEl.querySelectorAll<HTMLButtonElement>(".mms-global-search-result"));
    buttons.forEach((button, buttonIndex) => button.toggleClass("is-active", buttonIndex === index));
    buttons[index]?.scrollIntoView({ block: "nearest" });
  }

  private async openResult(result: MindMapSearchResult): Promise<void> {
    this.close();
    await this.onOpenResult(result);
  }
}
