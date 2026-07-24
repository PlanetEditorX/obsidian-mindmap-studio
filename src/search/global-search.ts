/**
 * @file global-search.ts
 * @description 搜索领域的本地索引与导图族搜索模块。
 *
 * 索引缓存节点文字、文件路径和层级，监听文件变化增量更新，并递归解析父导图与子导图。
 */

import { App, Modal, Notice, TFile, normalizePath, setIcon } from "obsidian";
import {
  nodeContentBlocks,
  nodePlainText,
  nodeSearchText,
  parseDocument,
  type MindMapDocument,
  type MindMapNode
} from "../core/model";

/**
 * MindMapSearchEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapSearchEntry {
  key: string;
  filePath: string;
  fileTitle: string;
  nodeId: string;
  nodeText: string;
  breadcrumb: string[];
  /** Full hierarchy including parent maps, e.g. 古诗 › 唐诗 › 李白. */
  hierarchyBreadcrumb?: string[];
  /** Map chain only, e.g. 古诗 › 唐诗. */
  mapHierarchy?: string[];
  depth: number;
  searchableText: string;
  note?: string;
  tags?: string[];
  matchedKinds?: string[];
  submapPath?: string;
  isSubmapDocument?: boolean;
  parentMapPath?: string;
}

/**
 * MindMapSearchResult 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapSearchResult extends MindMapSearchEntry {
  score: number;
  matchedKind: string;
  snippet: string;
}

/**
 * IndexedMindMapFile 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
interface IndexedMindMapFile {
  mtime: number;
  size: number;
  title: string;
  navigation?: MindMapDocument["navigation"];
  entries: MindMapSearchEntry[];
}

/**
 * PersistedMindMapSearchIndex 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
interface PersistedMindMapSearchIndex {
  version: 2;
  generatedAt: string;
  files: Record<string, IndexedMindMapFile>;
}

/**
 * MindMapSearchIndexStatus 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapSearchIndexStatus {
  ready: boolean;
  building: boolean;
  files: number;
  nodes: number;
  lastBuiltAt?: string;
}

/**
 * 校验并规范化d，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * 执行“compact”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param value 待校验、转换或比较的输入值。
 * @param max 该参数用于 compact 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function compact(value: string | undefined, max = 180): string | undefined {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * 执行“node display text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function nodeDisplayText(node: MindMapNode): string {
  const text = nodePlainText(node).trim();
  if (text) return text;
  if (node.code?.code.trim()) return `代码：${compact(node.code.code, 64)}`;
  if (node.table) return `表格：${node.table.headers.join(" / ") || `${node.table.rows.length} 行`}`;
  if (nodeContentBlocks(node).some((block) => block.type === "image")) return "图片节点";
  return "未命名节点";
}

/**
 * 执行“field values”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
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

/**
 * 构建search entries，并保持模型、界面和持久化状态的一致性。
 *
 * @param document 要处理的思维导图文档。
 * @param filePath 仓库内 .mindmap 文件路径。
 * @returns 按当前规则构建的集合结果。
 */
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

/**
 * 合并hierarchy，并保持模型、界面和持久化状态的一致性。
 *
 * @param prefix 该参数用于 merge hierarchy 流程中的输入或控制。
 * @param suffix 该参数用于 merge hierarchy 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function mergeHierarchy(prefix: string[], suffix: string[]): string[] {
  const left = prefix.map((item) => item.trim()).filter(Boolean);
  const right = suffix.map((item) => item.trim()).filter(Boolean);
  if (!left.length) return right;
  if (!right.length) return left;
  const merged = [...left];
  for (const item of right) {
    if (normalized(merged.at(-1) ?? "") === normalized(item)) continue;
    merged.push(item);
  }
  return merged;
}

/** Resolve parent/child map relations into paths such as 古诗 › 唐诗 › 李白. */
export function resolveHierarchicalEntries(files: Record<string, IndexedMindMapFile>): MindMapSearchEntry[] {
  const lineageCache = new Map<string, string[]>();
  const normalizedFiles = new Map<string, IndexedMindMapFile>();
  Object.entries(files).forEach(([path, file]) => normalizedFiles.set(normalizePath(path), file));

  const resolveLineage = (filePath: string, visiting = new Set<string>()): string[] => {
    const path = normalizePath(filePath);
    const cached = lineageCache.get(path);
    if (cached) return cached;
    const file = normalizedFiles.get(path);
    const navigation = file?.navigation;
    if (!file || !navigation?.parentPath) {
      lineageCache.set(path, []);
      return [];
    }
    if (visiting.has(path)) {
      const fallback = [navigation.parentTitle, navigation.parentNodeText].filter((item): item is string => Boolean(item?.trim()));
      lineageCache.set(path, fallback);
      return fallback;
    }

    const nextVisiting = new Set(visiting);
    nextVisiting.add(path);
    const parentPath = normalizePath(navigation.parentPath);
    const parentFile = normalizedFiles.get(parentPath);
    if (!parentFile) {
      const fallback = [navigation.parentTitle, navigation.parentNodeText].filter((item): item is string => Boolean(item?.trim()));
      lineageCache.set(path, fallback);
      return fallback;
    }

    const parentLineage = resolveLineage(parentPath, nextVisiting);
    const sourceEntry = navigation.parentNodeId
      ? parentFile.entries.find((entry) => entry.nodeId === navigation.parentNodeId)
      : undefined;
    const parentLocalPath = sourceEntry?.breadcrumb?.length
      ? sourceEntry.breadcrumb
      : [parentFile.title, navigation.parentNodeText].filter((item): item is string => Boolean(item?.trim()));
    const resolved = mergeHierarchy(parentLineage, parentLocalPath);
    lineageCache.set(path, resolved);
    return resolved;
  };

  const resolvedEntries: MindMapSearchEntry[] = [];
  for (const [rawPath, file] of Object.entries(files)) {
    const filePath = normalizePath(rawPath);
    const lineage = resolveLineage(filePath);
    const localRoot = file.entries[0]?.breadcrumb?.[0] ?? file.title;
    const mapHierarchy = mergeHierarchy(lineage, [localRoot]);
    for (const entry of file.entries) {
      const hierarchyBreadcrumb = mergeHierarchy(lineage, entry.breadcrumb);
      resolvedEntries.push({
        ...entry,
        hierarchyBreadcrumb,
        mapHierarchy,
        searchableText: normalized(`${entry.searchableText} ${hierarchyBreadcrumb.join(" ")} ${mapHierarchy.join(" ")}`)
      });
    }
  }
  return resolvedEntries;
}

/**
 * 执行“result snippet”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param entry 该参数用于 result snippet 流程中的输入或控制。
 * @param query 用户输入的搜索关键词。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function resultSnippet(entry: MindMapSearchEntry, query: string): { kind: string; snippet: string } {
  const queryNormalized = normalized(query);
  const candidates: Array<{ kind: string; value?: string }> = [
    { kind: "节点文字", value: entry.nodeText },
    { kind: "备注", value: entry.note },
    { kind: "标签", value: entry.tags?.join("、") },
    { kind: "层级路径", value: (entry.hierarchyBreadcrumb ?? entry.breadcrumb).join(" › ") },
    { kind: "文件", value: `${entry.fileTitle} ${entry.filePath}` },
    { kind: "内容", value: entry.searchableText }
  ];
  const matched = candidates.find((candidate) => candidate.value && normalized(candidate.value).includes(queryNormalized));
  return {
    kind: matched?.kind ?? "内容",
    snippet: compact(matched?.value ?? entry.nodeText, 220) ?? entry.nodeText
  };
}

/**
 * 执行“search entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param entries 该参数用于 search entries 流程中的输入或控制。
 * @param query 用户输入的搜索关键词。
 * @param limit 允许返回或保留的最大条目数。
 * @returns 按当前规则构建的集合结果。
 */
export function searchEntries(entries: MindMapSearchEntry[], query: string, limit = 100): MindMapSearchResult[] {
  const phrase = normalized(query);
  if (!phrase) return [];
  const terms = phrase.split(/\s+/).filter(Boolean);
  const results: MindMapSearchResult[] = [];
  for (const entry of entries) {
    if (!terms.every((term) => entry.searchableText.includes(term))) continue;
    const nodeText = normalized(entry.nodeText);
    const fileTitle = normalized(entry.fileTitle);
    const breadcrumb = normalized((entry.hierarchyBreadcrumb ?? entry.breadcrumb).join(" "));
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

/**
 * 从当前文件向上寻找最顶层父导图，再向下递归收集全部后代子导图，形成 Ctrl/Cmd+F 使用的“当前导图族”搜索范围。
 *
 * @param files 该参数用于 collect indexed family paths 流程中的输入或控制。
 * @param rootPath 该参数用于 collect indexed family paths 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
export function collectIndexedFamilyPaths(
  files: Record<string, { entries: MindMapSearchEntry[] }>,
  rootPath: string
): Set<string> {
  const normalizedFiles = new Map(Object.entries(files).map(([path, value]) => [normalizePath(path), value]));
  const family = new Set<string>();
  const queue = [normalizePath(rootPath)];
  while (queue.length) {
    const path = normalizePath(queue.shift() ?? "");
    if (!path || family.has(path) || !normalizedFiles.has(path)) continue;
    family.add(path);
    const indexed = normalizedFiles.get(path);
    for (const entry of indexed?.entries ?? []) {
      const childPath = entry.submapPath ? normalizePath(entry.submapPath) : "";
      if (childPath && normalizedFiles.has(childPath) && !family.has(childPath)) queue.push(childPath);
    }
    for (const [candidatePath, candidate] of normalizedFiles) {
      const parentPath = candidate.entries[0]?.parentMapPath;
      if (parentPath && normalizePath(parentPath) === path && !family.has(candidatePath)) queue.push(candidatePath);
    }
  }
  return family;
}

/**
 * MindMapSearchIndex 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class MindMapSearchIndex {
  private data: PersistedMindMapSearchIndex = { version: 2, generatedAt: new Date(0).toISOString(), files: {} };
  private ready = false;
  private building = false;
  private saveTimer: number | null = null;
  private readonly fileTimers = new Map<string, number>();
  private rebuildPromise: Promise<void> | null = null;

  /**
   * 创建 MindMapSearchIndex 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param indexPath 该参数用于 constructor 流程中的输入或控制。
   * @param extension 该参数用于 constructor 流程中的输入或控制。
   */
  constructor(
    private readonly app: App,
    private readonly indexPath: string,
    private readonly extension = "mindmap"
  ) {}

  /**
   * 执行“initialize”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  async initialize(): Promise<void> {
    await this.load();
    await this.rebuildChangedFiles();
  }

  /**
   * 执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   */
  destroy(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    for (const timer of this.fileTimers.values()) window.clearTimeout(timer);
    this.fileTimers.clear();
    void this.saveNow();
  }

  /**
   * 读取并返回status，并保持模型、界面和持久化状态的一致性。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  getStatus(): MindMapSearchIndexStatus {
    const files = Object.keys(this.data.files).length;
    const nodes = Object.values(this.data.files).reduce((sum, file) => sum + file.entries.length, 0);
    return { ready: this.ready, building: this.building, files, nodes, lastBuiltAt: this.data.generatedAt };
  }

  /**
   * 执行“all entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param filePaths 该参数用于 all entries 流程中的输入或控制。
   * @returns 按当前规则构建的集合结果。
   */
  allEntries(filePaths?: ReadonlySet<string>): MindMapSearchEntry[] {
    const resolved = resolveHierarchicalEntries(this.data.files);
    if (!filePaths) return resolved;
    const normalizedPaths = new Set(Array.from(filePaths, (path) => normalizePath(path)));
    return resolved.filter((entry) => normalizedPaths.has(normalizePath(entry.filePath)));
  }

  /**
   * 读取并返回scoped status，并保持模型、界面和持久化状态的一致性。
   *
   * @param filePaths 该参数用于 get scoped status 流程中的输入或控制。
   * @returns 计算得到的数值结果。
   */
  getScopedStatus(filePaths: ReadonlySet<string>): { files: number; nodes: number } {
    const normalizedPaths = new Set(Array.from(filePaths, (path) => normalizePath(path)));
    let files = 0;
    let nodes = 0;
    for (const path of normalizedPaths) {
      const indexed = this.data.files[path];
      if (!indexed) continue;
      files += 1;
      nodes += indexed.entries.length;
    }
    return { files, nodes };
  }

  /**
   * 执行“search”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param query 用户输入的搜索关键词。
   * @param limit 允许返回或保留的最大条目数。
   * @param filePaths 该参数用于 search 流程中的输入或控制。
   * @returns 按当前规则构建的集合结果。
   */
  search(query: string, limit = 100, filePaths?: ReadonlySet<string>): MindMapSearchResult[] {
    return searchEntries(this.allEntries(filePaths), query, limit);
  }

  /**
   * Refresh a parent map and every recursively linked child map, then return the
   * exact set of files that belongs to that map family. This is deliberately
   * on-demand so an existing child map is searchable without recreating it or
   * manually rebuilding the whole-vault index.
   */
  async refreshFamily(rootPath: string, currentDocument?: MindMapDocument): Promise<Set<string>> {
    const normalizedRoot = normalizePath(rootPath);
    const family = new Set<string>();
    const documents = new Map<string, MindMapDocument>();
    if (currentDocument) documents.set(normalizedRoot, currentDocument);

    // If search is opened from a child map, first climb to the top parent so
    // “唐诗” still belongs to the complete “古诗 › 唐诗” map family.
    let familyRoot = normalizedRoot;
    let climbDocument = currentDocument;
    const climbed = new Set<string>();
    while (climbDocument?.navigation?.parentPath && !climbed.has(familyRoot)) {
      climbed.add(familyRoot);
      const parent = this.resolveSubmapFile(climbDocument.navigation.parentPath, familyRoot);
      if (!parent) break;
      familyRoot = parent.path;
      try {
        climbDocument = parseDocument(await this.app.vault.cachedRead(parent), parent.basename);
        documents.set(parent.path, climbDocument);
      } catch (error) {
        console.warn(`MindMap Studio could not read parent map ${parent.path}`, error);
        break;
      }
    }

    const queue: string[] = [familyRoot];
    while (queue.length) {
      const path = normalizePath(queue.shift() ?? "");
      if (!path || family.has(path)) continue;
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile) || file.extension.toLocaleLowerCase() !== this.extension) continue;
      family.add(path);

      let document = documents.get(path);
      if (!document) {
        try {
          document = parseDocument(await this.app.vault.cachedRead(file), file.basename);
        } catch (error) {
          console.warn(`MindMap Studio could not read map family member ${path}`, error);
          continue;
        }
      }

      this.data.files[path] = {
        mtime: file.stat.mtime,
        size: file.stat.size,
        title: document.title,
        navigation: document.navigation,
        entries: buildSearchEntries(document, path)
      };

      for (const node of this.walkNodes(document.root)) {
        const child = this.resolveSubmapFile(node.submap?.path, path);
        if (child && !family.has(child.path)) queue.push(child.path);
      }

      // Compatibility fallback: a child document also records its parent path.
      // This recovers older maps whose parent node lost the submap field.
      for (const [candidatePath, indexed] of Object.entries(this.data.files)) {
        const parentPath = indexed.navigation?.parentPath ?? indexed.entries[0]?.parentMapPath;
        const resolvedParent = this.resolveSubmapFile(parentPath, candidatePath);
        if (resolvedParent?.path === path && !family.has(candidatePath)) queue.push(candidatePath);
      }
    }

    // Merge relationships already present in the index. This covers older child
    // maps that only retain navigation.parentPath and no longer have a matching
    // submap field on the parent node.
    for (const indexedPath of collectIndexedFamilyPaths(this.data.files, normalizedRoot)) family.add(indexedPath);

    this.data.generatedAt = new Date().toISOString();
    this.ready = true;
    this.scheduleSave();
    return family;
  }

  /**
   * 执行“queue file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param delay 该参数用于 queue file 流程中的输入或控制。
   */
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

  /**
   * 删除file，并保持模型、界面和持久化状态的一致性。
   *
   * @param path 仓库内目标路径。
   */
  removeFile(path: string): void {
    const normalizedPath = normalizePath(path);
    if (!this.data.files[normalizedPath]) return;
    delete this.data.files[normalizedPath];
    this.data.generatedAt = new Date().toISOString();
    this.scheduleSave();
  }

  /**
   * 执行“rename file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param file 目标 Obsidian 文件对象。
   * @param oldPath 该参数用于 rename file 流程中的输入或控制。
   */
  renameFile(file: TFile, oldPath: string): void {
    this.removeFile(oldPath);
    this.queueFile(file, 50);
  }

  /**
   * 重建all，并保持模型、界面和持久化状态的一致性。
   */
  async rebuildAll(): Promise<void> {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this.performRebuild(true).finally(() => { this.rebuildPromise = null; });
    return this.rebuildPromise;
  }

  /**
   * 重建changed files，并保持模型、界面和持久化状态的一致性。
   */
  private async rebuildChangedFiles(): Promise<void> {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this.performRebuild(false).finally(() => { this.rebuildPromise = null; });
    return this.rebuildPromise;
  }

  /**
   * 执行全量或增量索引重建。它比较文件修改时间，仅解析变化的 .mindmap 文件，删除失效记录，随后重新解析跨文件层级并安排持久化。
   *
   * @param force 该参数用于 perform rebuild 流程中的输入或控制。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
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

  /**
   * 读取并解析单个 .mindmap 文件，生成节点级搜索条目和子导图引用。读取或解析失败时移除该文件的旧索引，防止返回过期结果。
   *
   * @param file 目标 Obsidian 文件对象。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  private async indexFile(file: TFile): Promise<void> {
    try {
      const source = await this.app.vault.cachedRead(file);
      const document = parseDocument(source, file.basename);
      this.data.files[file.path] = {
        mtime: file.stat.mtime,
        size: file.stat.size,
        title: document.title,
        navigation: document.navigation,
        entries: buildSearchEntries(document, file.path)
      };
      this.data.generatedAt = new Date().toISOString();
      this.ready = true;
    } catch (error) {
      console.warn(`MindMap Studio could not index ${file.path}`, error);
      delete this.data.files[file.path];
    }
  }

  /**
   * 递归遍历nodes，并保持模型、界面和持久化状态的一致性。
   *
   * @param root 节点树的根节点。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  private *walkNodes(root: MindMapNode): Generator<MindMapNode> {
    const stack: MindMapNode[] = [root];
    while (stack.length) {
      const node = stack.pop();
      if (!node) continue;
      yield node;
      for (let index = node.children.length - 1; index >= 0; index -= 1) stack.push(node.children[index]);
    }
  }

  /**
   * 解析并确定submap file，并保持模型、界面和持久化状态的一致性。
   *
   * @param rawPath 该参数用于 resolve submap file 流程中的输入或控制。
   * @param sourcePath 该参数用于 resolve submap file 流程中的输入或控制。
   * @returns 当前操作生成、查找或规范化后的结果。
   */
  private resolveSubmapFile(rawPath: string | undefined, sourcePath: string): TFile | null {
    const raw = rawPath?.trim();
    if (!raw) return null;
    const unwrapped = raw.replace(/^!?\[\[|\]\]$/g, "").split("|")[0]?.split("#")[0]?.trim() ?? raw;
    const normalizedPath = normalizePath(unwrapped);
    const direct = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (direct instanceof TFile && direct.extension.toLocaleLowerCase() === this.extension) return direct;
    const resolved = this.app.metadataCache.getFirstLinkpathDest(unwrapped, sourcePath);
    return resolved instanceof TFile && resolved.extension.toLocaleLowerCase() === this.extension ? resolved : null;
  }

  /**
   * 加载相关数据，并保持模型、界面和持久化状态的一致性。
   */
  private async load(): Promise<void> {
    try {
      if (!(await this.app.vault.adapter.exists(this.indexPath))) {
        this.ready = true;
        return;
      }
      const parsed = JSON.parse(await this.app.vault.adapter.read(this.indexPath)) as Partial<PersistedMindMapSearchIndex>;
      if (parsed.version === 2 && parsed.files && typeof parsed.files === "object") {
        this.data = {
          version: 2,
          generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : new Date(0).toISOString(),
          files: parsed.files as Record<string, IndexedMindMapFile>
        };
      } else {
        // The previous flat index did not persist navigation metadata. Rebuild it.
        this.data = { version: 2, generatedAt: new Date(0).toISOString(), files: {} };
      }
      this.ready = true;
    } catch (error) {
      console.warn("MindMap Studio could not load the global search index", error);
      this.data = { version: 2, generatedAt: new Date(0).toISOString(), files: {} };
      this.ready = true;
    }
  }

  /**
   * 安排延迟执行save，并保持模型、界面和持久化状态的一致性。
   */
  private scheduleSave(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.saveNow();
    }, 800);
  }

  /**
   * 保存now，并保持模型、界面和持久化状态的一致性。
   */
  private async saveNow(): Promise<void> {
    try {
      await this.app.vault.adapter.write(this.indexPath, JSON.stringify(this.data));
    } catch (error) {
      console.warn("MindMap Studio could not save the global search index", error);
    }
  }
}

/**
 * 执行“append highlighted text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param container 接收渲染内容的 DOM 容器。
 * @param text 要显示、搜索、解析或写入的文本。
 * @param query 用户输入的搜索关键词。
 */
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

/**
 * GlobalMindMapSearchModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class GlobalMindMapSearchModal extends Modal {
  private inputEl!: HTMLInputElement;
  private resultsEl!: HTMLDivElement;
  private summaryEl!: HTMLDivElement;
  private activeIndex = -1;
  private renderedResults: MindMapSearchResult[] = [];

  /**
   * 创建 GlobalMindMapSearchModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param index 当前元素在同级或列表中的零基索引。
   * @param maxResults 该参数用于 constructor 流程中的输入或控制。
   * @param onOpenResult 该参数用于 constructor 流程中的输入或控制。
   * @param onRebuild 该参数用于 constructor 流程中的输入或控制。
   * @param scopePaths 该参数用于 constructor 流程中的输入或控制。
   * @param scopeTitle 该参数用于 constructor 流程中的输入或控制。
   * @param scopeDescription 该参数用于 constructor 流程中的输入或控制。
   */
  constructor(
    app: App,
    private readonly index: MindMapSearchIndex,
    private readonly maxResults: number,
    private readonly onOpenResult: (result: MindMapSearchResult) => void | Promise<void>,
    private readonly onRebuild: () => Promise<void>,
    private readonly scopePaths?: ReadonlySet<string>,
    private readonly scopeTitle = "全局搜索思维导图",
    private readonly scopeDescription = "所有导图、子节点和子导图"
  ) {
    super(app);
  }

  /**
   * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
   */
  onOpen(): void {
    this.modalEl.addClass("mms-global-search-modal");
    this.titleEl.setText(this.scopeTitle);
    const searchRow = this.contentEl.createDiv({ cls: "mms-global-search-row" });
    const icon = searchRow.createSpan({ cls: "mms-global-search-icon" });
    setIcon(icon, "search");
    this.inputEl = searchRow.createEl("input", {
      type: "search",
      cls: "mms-global-search-input",
      attr: { placeholder: `搜索${this.scopeDescription}…`, autocomplete: "off", spellcheck: "false" }
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

  /**
   * 在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。
   */
  onClose(): void {
    this.contentEl.empty();
  }

  /**
   * 渲染results，并保持模型、界面和持久化状态的一致性。
   *
   * @param query 用户输入的搜索关键词。
   */
  private renderResults(query: string): void {
    this.resultsEl.empty();
    this.activeIndex = -1;
    const status = this.index.getStatus();
    const scopedStatus = this.scopePaths ? this.index.getScopedStatus(this.scopePaths) : { files: status.files, nodes: status.nodes };
    const trimmed = query.trim();
    if (!trimmed) {
      this.renderedResults = [];
      this.summaryEl.setText(status.building && !this.scopePaths
        ? `正在建立索引，已收录 ${scopedStatus.files} 个导图、${scopedStatus.nodes} 个节点…`
        : `搜索范围包含 ${scopedStatus.files} 个导图、${scopedStatus.nodes} 个节点。输入关键词开始搜索。`);
      const hint = this.resultsEl.createDiv({ cls: "mms-global-search-empty" });
      hint.createDiv({ text: "搜索范围" });
      hint.createEl("p", { text: `${this.scopeDescription}中的节点文字、富文本、备注、标签、表格、代码、链接及折叠分支。` });
      return;
    }

    this.renderedResults = this.index.search(trimmed, this.maxResults, this.scopePaths);
    this.summaryEl.setText(`找到 ${this.renderedResults.length}${this.renderedResults.length >= this.maxResults ? "+" : ""} 个结果 · 范围 ${scopedStatus.files} 个导图 / ${scopedStatus.nodes} 个节点`);
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
      file.createSpan({ text: result.mapHierarchy?.join(" › ") || result.fileTitle });
      file.createSpan({ cls: "mms-global-search-result-path", text: result.filePath });
      button.createDiv({ cls: "mms-global-search-result-breadcrumb", text: (result.hierarchyBreadcrumb ?? result.breadcrumb).join(" › ") });
      if (result.snippet && result.snippet !== result.nodeText) {
        const snippet = button.createDiv({ cls: "mms-global-search-result-snippet" });
        appendHighlightedText(snippet, result.snippet, trimmed);
      }
      button.addEventListener("mouseenter", () => this.setActive(index));
      button.addEventListener("click", () => void this.openResult(result));
    });
    this.setActive(0);
  }

  /**
   * 执行“move active”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
   *
   * @param delta 该参数用于 move active 流程中的输入或控制。
   */
  private moveActive(delta: number): void {
    if (!this.renderedResults.length) return;
    const next = this.activeIndex < 0 ? 0 : (this.activeIndex + delta + this.renderedResults.length) % this.renderedResults.length;
    this.setActive(next);
  }

  /**
   * 更新并应用active，并保持模型、界面和持久化状态的一致性。
   *
   * @param index 当前元素在同级或列表中的零基索引。
   */
  private setActive(index: number): void {
    this.activeIndex = index;
    const buttons = Array.from(this.resultsEl.querySelectorAll<HTMLButtonElement>(".mms-global-search-result"));
    buttons.forEach((button, buttonIndex) => button.toggleClass("is-active", buttonIndex === index));
    buttons[index]?.scrollIntoView({ block: "nearest" });
  }

  /**
   * 打开result，并保持模型、界面和持久化状态的一致性。
   *
   * @param result 该参数用于 open result 流程中的输入或控制。
   */
  private async openResult(result: MindMapSearchResult): Promise<void> {
    this.close();
    await this.onOpenResult(result);
  }
}
