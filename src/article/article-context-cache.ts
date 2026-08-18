/**
 * @file article-context-cache.ts
 * @description 文章族上下文与已解析文档的同步内存缓存、依赖版本校验和插件私有 JSON 持久化。
 */

import { normalizeDocument, type MindMapDocument } from "../core/model";
import type { ArticlePageNavigation, ArticleTocEntry, ReadingSection } from "./modes";

export const ARTICLE_CONTEXT_CACHE_SCHEMA_VERSION = 1;
export const ARTICLE_CONTEXT_CACHE_REVISION = "article-context-cache-v1";
const MAX_CONTEXT_CACHE_ENTRIES = 12;
const MAX_CONTEXT_CACHE_CHARACTERS = 24_000_000;
const MAX_PERSISTED_CACHE_CHARACTERS = 28_000_000;
const MAX_DOCUMENT_CACHE_ENTRIES = 32;

/** 文章缓存只依赖 DataAdapter 的最小文件接口，便于纯单元测试复用。 */
export interface ArticleContextCacheAdapter {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

/** 一个仓库文件用于缓存失效判断的轻量版本。 */
export interface MindMapFileRevision {
  path: string;
  mtime: number;
  size: number;
}

/** buildArticleContext() 的可持久化结果。 */
export interface ArticleContextData {
  baseDepth: number;
  tocEntries: ArticleTocEntry[];
  showToc: boolean;
  navigation?: ArticlePageNavigation;
  readingSections: ReadingSection[];
}

/** 一个文章页缓存及其完整父子导图依赖。 */
export interface ArticleContextCacheSnapshot {
  schemaVersion: number;
  cacheRevision: string;
  filePath: string;
  dependencies: MindMapFileRevision[];
  context: ArticleContextData;
  updatedAt: number;
  lastAccessedAt: number;
}

/** 磁盘上的文章上下文缓存信封。 */
interface PersistedArticleContextCache {
  schemaVersion: number;
  entries: ArticleContextCacheSnapshot[];
}

/** 内存文档缓存条目；文档永远以克隆形式进出，避免编辑器污染缓存。 */
interface MindMapDocumentCacheEntry {
  revision: MindMapFileRevision;
  document: MindMapDocument;
}

/** 将 Windows 或重复分隔符路径规范为仓库相对路径。 */
export function normalizeArticleContextCachePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
}

/** 克隆纯 JSON 领域对象；现代 Obsidian 优先使用原生 structuredClone。 */
function cloneJsonValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/** 判断外部 JSON 值是否为普通对象。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** 规范化有限整数。 */
function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** 规范化字符串数组。 */
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/** 从不可信 JSON 恢复一个目录项。 */
function normalizeTocEntry(value: unknown): ArticleTocEntry | null {
  if (!isRecord(value)) return null;
  if (typeof value.filePath !== "string" || typeof value.title !== "string") return null;
  return {
    filePath: normalizeArticleContextCachePath(value.filePath),
    nodeId: typeof value.nodeId === "string" ? value.nodeId : undefined,
    depth: Math.max(0, Math.floor(finiteNumber(value.depth))),
    tocDepth: Math.max(1, Math.floor(finiteNumber(value.tocDepth, 1))),
    label: typeof value.label === "string" ? value.label : "",
    title: value.title,
    displayTitle: typeof value.displayTitle === "string" ? value.displayTitle : value.title,
    breadcrumb: stringArray(value.breadcrumb)
  };
}

/** 从不可信 JSON 恢复文章分页导航。 */
function normalizeNavigation(value: unknown): ArticlePageNavigation | undefined {
  if (!isRecord(value) || typeof value.homePath !== "string") return undefined;
  const entries = Array.isArray(value.entries)
    ? value.entries.map(normalizeTocEntry).filter((entry): entry is ArticleTocEntry => Boolean(entry))
    : [];
  return {
    entries,
    currentIndex: Math.max(0, Math.floor(finiteNumber(value.currentIndex))),
    homePath: normalizeArticleContextCachePath(value.homePath),
    parentPath: typeof value.parentPath === "string" ? normalizeArticleContextCachePath(value.parentPath) : undefined,
    parentNodeId: typeof value.parentNodeId === "string" ? value.parentNodeId : undefined,
    numberingDisabled: typeof value.numberingDisabled === "boolean" ? value.numberingDisabled : undefined
  };
}

/** 从不可信 JSON 恢复一个通读物理页，并通过模型层重新规范化文档。 */
function normalizeReadingSection(value: unknown): ReadingSection | null {
  if (!isRecord(value) || typeof value.filePath !== "string" || !isRecord(value.document)) return null;
  const filePath = normalizeArticleContextCachePath(value.filePath);
  const fallbackTitle = filePath.split("/").at(-1)?.replace(/\.mindmap$/i, "") || "思维导图";
  return {
    filePath,
    document: normalizeDocument(value.document as Partial<MindMapDocument>, fallbackTitle),
    baseDepth: Math.max(0, Math.floor(finiteNumber(value.baseDepth))),
    parentFilePath: typeof value.parentFilePath === "string" ? normalizeArticleContextCachePath(value.parentFilePath) : undefined,
    parentNodeId: typeof value.parentNodeId === "string" ? value.parentNodeId : undefined,
    numberingDisabled: typeof value.numberingDisabled === "boolean" ? value.numberingDisabled : undefined
  };
}

/** 从不可信 JSON 恢复文章上下文。 */
function normalizeArticleContext(value: unknown): ArticleContextData | null {
  if (!isRecord(value)) return null;
  const readingSections = Array.isArray(value.readingSections)
    ? value.readingSections.map(normalizeReadingSection).filter((section): section is ReadingSection => Boolean(section))
    : [];
  if (!readingSections.length) return null;
  const tocEntries = Array.isArray(value.tocEntries)
    ? value.tocEntries.map(normalizeTocEntry).filter((entry): entry is ArticleTocEntry => Boolean(entry))
    : [];
  return {
    baseDepth: Math.max(0, Math.floor(finiteNumber(value.baseDepth))),
    tocEntries,
    showToc: value.showToc === true,
    navigation: normalizeNavigation(value.navigation),
    readingSections
  };
}

/** 从不可信 JSON 恢复一个文件版本。 */
function normalizeRevision(value: unknown): MindMapFileRevision | null {
  if (!isRecord(value) || typeof value.path !== "string" || !value.path.trim()) return null;
  if (typeof value.mtime !== "number" || !Number.isFinite(value.mtime)) return null;
  if (typeof value.size !== "number" || !Number.isFinite(value.size)) return null;
  return {
    path: normalizeArticleContextCachePath(value.path),
    mtime: value.mtime,
    size: value.size
  };
}

/**
 * 校验并规范化一个持久文章上下文快照。
 *
 * @param value 来自插件私有 JSON 的不可信值。
 * @returns 可安全放入内存缓存的快照；版本或结构不兼容时返回 null。
 */
export function normalizeArticleContextCacheSnapshot(value: unknown): ArticleContextCacheSnapshot | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== ARTICLE_CONTEXT_CACHE_SCHEMA_VERSION || value.cacheRevision !== ARTICLE_CONTEXT_CACHE_REVISION) return null;
  if (typeof value.filePath !== "string" || !value.filePath.trim()) return null;
  const filePath = normalizeArticleContextCachePath(value.filePath);
  const dependencies = Array.isArray(value.dependencies)
    ? value.dependencies.map(normalizeRevision).filter((revision): revision is MindMapFileRevision => Boolean(revision))
    : [];
  if (!dependencies.length || !dependencies.some((dependency) => dependency.path === filePath)) return null;
  const context = normalizeArticleContext(value.context);
  if (!context) return null;
  const dependencyPaths = new Set(dependencies.map((dependency) => dependency.path));
  if (context.readingSections.some((section) => !dependencyPaths.has(section.filePath))) return null;
  const now = Date.now();
  return {
    schemaVersion: ARTICLE_CONTEXT_CACHE_SCHEMA_VERSION,
    cacheRevision: ARTICLE_CONTEXT_CACHE_REVISION,
    filePath,
    dependencies,
    context,
    updatedAt: finiteNumber(value.updatedAt, now),
    lastAccessedAt: finiteNumber(value.lastAccessedAt, now)
  };
}

/** 比较两个文件版本是否完全一致。 */
export function sameMindMapFileRevision(left: MindMapFileRevision, right: MindMapFileRevision): boolean {
  return normalizeArticleContextCachePath(left.path) === normalizeArticleContextCachePath(right.path)
    && left.mtime === right.mtime
    && left.size === right.size;
}

/**
 * 插件级文章上下文缓存。initialize() 预载到内存后，视图打开可以同步校验全部依赖并命中。
 */
export class ArticleContextCacheStore {
  private readonly entries = new Map<string, ArticleContextCacheSnapshot>();
  private persistTimer: number | null = null;
  private requestedPersistRevision = 0;
  private persistedRevision = 0;
  private persistRunner: Promise<void> | null = null;

  /** 创建一个以插件私有 JSON 文件为后端的有界缓存。 */
  constructor(
    private readonly adapter: ArticleContextCacheAdapter,
    private readonly cacheDirectory: string,
    private readonly cacheFile: string
  ) {}

  /** 从磁盘预载最近使用的有效快照；异常缓存会被忽略而不会阻断插件启动。 */
  async initialize(): Promise<void> {
    this.entries.clear();
    try {
      if (!await this.adapter.exists(this.cacheFile)) return;
      const source = await this.adapter.read(this.cacheFile);
      if (source.length > MAX_PERSISTED_CACHE_CHARACTERS) return;
      const parsed = JSON.parse(source) as unknown;
      if (!isRecord(parsed) || parsed.schemaVersion !== ARTICLE_CONTEXT_CACHE_SCHEMA_VERSION || !Array.isArray(parsed.entries)) return;
      const snapshots = parsed.entries
        .map(normalizeArticleContextCacheSnapshot)
        .filter((snapshot): snapshot is ArticleContextCacheSnapshot => Boolean(snapshot))
        .sort((left, right) => right.lastAccessedAt - left.lastAccessedAt);
      const selected: ArticleContextCacheSnapshot[] = [];
      let characters = 0;
      for (const snapshot of snapshots) {
        const size = this.snapshotCharacters(snapshot);
        if (selected.length >= MAX_CONTEXT_CACHE_ENTRIES) break;
        if (characters + size > MAX_CONTEXT_CACHE_CHARACTERS) continue;
        selected.push(snapshot);
        characters += size;
      }
      for (const snapshot of selected.reverse()) this.entries.set(snapshot.filePath, snapshot);
    } catch (error) {
      console.warn("MindMap Studio article context cache load failed", error);
      this.entries.clear();
    }
  }

  /**
   * 同步读取一个文章上下文；任意父/子导图的 mtime 或 size 不一致都会立即失效整个快照。
   *
   * @param filePath 当前打开的物理导图路径。
   * @param resolveRevision 按依赖路径读取当前仓库文件版本的同步回调。
   * @returns 命中时返回隔离克隆，避免调用方修改缓存对象。
   */
  get(filePath: string, resolveRevision: (path: string) => MindMapFileRevision | null): ArticleContextData | null {
    const normalizedPath = normalizeArticleContextCachePath(filePath);
    const snapshot = this.entries.get(normalizedPath);
    if (!snapshot) return null;
    const valid = snapshot.dependencies.every((dependency) => {
      const current = resolveRevision(dependency.path);
      return Boolean(current && sameMindMapFileRevision(dependency, current));
    });
    if (!valid) {
      this.entries.delete(normalizedPath);
      this.markDirty();
      return null;
    }
    const newestPath = Array.from(this.entries.keys()).at(-1);
    snapshot.lastAccessedAt = Date.now();
    this.entries.delete(normalizedPath);
    this.entries.set(normalizedPath, snapshot);
    if (newestPath !== normalizedPath) this.markDirty();
    return cloneJsonValue(snapshot.context);
  }

  /** 写入一次完整文章族构建结果和构建结束时确认过的全部依赖版本。 */
  put(filePath: string, context: ArticleContextData, dependencies: readonly MindMapFileRevision[]): void {
    const normalizedPath = normalizeArticleContextCachePath(filePath);
    const uniqueDependencies = new Map<string, MindMapFileRevision>();
    for (const dependency of dependencies) {
      uniqueDependencies.set(normalizeArticleContextCachePath(dependency.path), {
        path: normalizeArticleContextCachePath(dependency.path),
        mtime: dependency.mtime,
        size: dependency.size
      });
    }
    if (!uniqueDependencies.has(normalizedPath)) return;
    if (context.readingSections.some((section) => !uniqueDependencies.has(normalizeArticleContextCachePath(section.filePath)))) return;
    const now = Date.now();
    const snapshot: ArticleContextCacheSnapshot = {
      schemaVersion: ARTICLE_CONTEXT_CACHE_SCHEMA_VERSION,
      cacheRevision: ARTICLE_CONTEXT_CACHE_REVISION,
      filePath: normalizedPath,
      dependencies: Array.from(uniqueDependencies.values()),
      context: cloneJsonValue(context),
      updatedAt: now,
      lastAccessedAt: now
    };
    this.entries.delete(normalizedPath);
    this.entries.set(normalizedPath, snapshot);
    this.prune();
    this.markDirty();
  }

  /** 清空全部文章上下文；用于新建或重命名可能让旧的“缺失子导图”引用突然可解析的情况。 */
  clear(): void {
    if (!this.entries.size) return;
    this.entries.clear();
    this.markDirty();
  }

  /** 当前文件或任意依赖文件被修改、删除、重命名时，清除所有包含它的文章族快照。 */
  invalidateDependency(filePath: string): void {
    const normalizedPath = normalizeArticleContextCachePath(filePath);
    let changed = false;
    for (const [key, snapshot] of Array.from(this.entries.entries())) {
      if (snapshot.filePath !== normalizedPath && !snapshot.dependencies.some((dependency) => dependency.path === normalizedPath)) continue;
      this.entries.delete(key);
      changed = true;
    }
    if (changed) this.markDirty();
  }

  /** 插件卸载前提交全部尚未写盘的 LRU/内容变化。 */
  async flush(): Promise<void> {
    if (this.persistTimer !== null) {
      window.clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.startPersistRunner();
    if (this.persistRunner) await this.persistRunner;
  }

  /** 标记内存状态需要持久化，并吸收连续更新。 */
  private markDirty(): void {
    this.requestedPersistRevision += 1;
    this.schedulePersist();
  }

  /** 以尾随防抖减少连续文章打开造成的磁盘写入。 */
  private schedulePersist(): void {
    if (this.persistRunner) return;
    if (this.persistTimer !== null) window.clearTimeout(this.persistTimer);
    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null;
      this.startPersistRunner();
    }, 800);
  }

  /** 启动唯一串行写入循环。 */
  private startPersistRunner(): void {
    if (this.persistRunner || this.persistedRevision >= this.requestedPersistRevision) return;
    if (this.persistTimer !== null) {
      window.clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.persistRunner = this.runPersistLoop().finally(() => {
      this.persistRunner = null;
      if (this.persistedRevision < this.requestedPersistRevision) this.startPersistRunner();
    });
  }

  /** 串行保存最新稳定快照，写入期间的新变化合并到下一轮。 */
  private async runPersistLoop(): Promise<void> {
    while (this.persistedRevision < this.requestedPersistRevision) {
      const targetRevision = this.requestedPersistRevision;
      const content = JSON.stringify({
        schemaVersion: ARTICLE_CONTEXT_CACHE_SCHEMA_VERSION,
        entries: Array.from(this.entries.values())
      } satisfies PersistedArticleContextCache);
      try {
        if (!await this.adapter.exists(this.cacheDirectory)) await this.adapter.mkdir(this.cacheDirectory);
        await this.adapter.write(this.cacheFile, content);
      } catch (error) {
        console.warn("MindMap Studio article context cache persist failed", error);
        this.persistedRevision = targetRevision;
        return;
      }
      this.persistedRevision = targetRevision;
    }
  }

  /** 应用条目数与总字符数双重 LRU 上限。 */
  private prune(): void {
    while (this.entries.size > MAX_CONTEXT_CACHE_ENTRIES) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      this.entries.delete(oldest);
    }
    let total = Array.from(this.entries.values()).reduce((sum, snapshot) => sum + this.snapshotCharacters(snapshot), 0);
    while (total > MAX_CONTEXT_CACHE_CHARACTERS && this.entries.size > 1) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      const removed = this.entries.get(oldest);
      this.entries.delete(oldest);
      if (removed) total -= this.snapshotCharacters(removed);
    }
  }

  /** 估算单个快照字符数，用于持久缓存上限。 */
  private snapshotCharacters(snapshot: ArticleContextCacheSnapshot): number {
    return JSON.stringify(snapshot).length;
  }
}

/**
 * 已解析 MindMapDocument 的会话级 LRU。它只解决重复 parseDocument，不写盘；跨重启由 ArticleContextCacheStore 恢复完整上下文。
 */
export class MindMapDocumentCache {
  private readonly entries = new Map<string, MindMapDocumentCacheEntry>();

  /** 按文件版本同步读取隔离文档副本；版本不一致时自动清除。 */
  get(revision: MindMapFileRevision): MindMapDocument | null {
    const path = normalizeArticleContextCachePath(revision.path);
    const entry = this.entries.get(path);
    if (!entry) return null;
    if (!sameMindMapFileRevision(entry.revision, { ...revision, path })) {
      this.entries.delete(path);
      return null;
    }
    this.entries.delete(path);
    this.entries.set(path, entry);
    return cloneJsonValue(entry.document);
  }

  /** 保存一个解析后的文档副本，并维持固定 LRU 容量。 */
  put(revision: MindMapFileRevision, document: MindMapDocument): void {
    const path = normalizeArticleContextCachePath(revision.path);
    this.entries.delete(path);
    this.entries.set(path, {
      revision: { ...revision, path },
      document: cloneJsonValue(document)
    });
    while (this.entries.size > MAX_DOCUMENT_CACHE_ENTRIES) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      this.entries.delete(oldest);
    }
  }

  /** 文件内容或路径发生变化时清除解析结果。 */
  remove(filePath: string): void {
    this.entries.delete(normalizeArticleContextCachePath(filePath));
  }
}
