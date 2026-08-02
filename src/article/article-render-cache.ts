/**
 * @file article-render-cache.ts
 * @description 文章节点渲染快照的稳定指纹、内存 LRU 与磁盘持久化缓存。
 */

import type { DataAdapter } from "obsidian";
import type { MindMapNode } from "../core/model";

export const ARTICLE_RENDER_CACHE_SCHEMA_VERSION = 1;
export const ARTICLE_RENDERER_REVISION = "article-node-cache-v2";

/** Minimal cross-platform path normalization for vault-relative and plugin cache paths. */
export function normalizeArticleCachePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
}
const MAX_CACHE_ENTRIES = 24;
const MAX_CACHE_CHARACTERS = 12_000_000;
const MAX_NODE_HTML_CHARACTERS = 1_000_000;

/** 一个未变化文章节点可直接恢复的静态 DOM 快照。 */
export interface ArticleNodeRenderCacheEntry {
  fingerprint: string;
  html: string;
}

/** 单个 .mindmap 文件的文章节点缓存。 */
export interface ArticleRenderCacheSnapshot {
  schemaVersion: number;
  rendererRevision: string;
  filePath: string;
  documentFingerprint: string;
  presentationFingerprint: string;
  nodes: Record<string, ArticleNodeRenderCacheEntry>;
  updatedAt: number;
  lastAccessedAt: number;
}

/** On-disk envelope for all preloaded article snapshots. */
interface PersistedArticleRenderCache {
  schemaVersion: number;
  entries: ArticleRenderCacheSnapshot[];
}

/** 对 JSON 兼容值执行键排序，避免对象属性插入顺序导致缓存误失效。 */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const visit = (candidate: unknown): string => {
    if (candidate === null || typeof candidate !== "object") return JSON.stringify(candidate) ?? "null";
    if (seen.has(candidate)) throw new TypeError("Article cache fingerprint cannot serialize cyclic data");
    seen.add(candidate);
    if (Array.isArray(candidate)) {
      const serialized = `[${candidate.map((item) => visit(item)).join(",")}]`;
      seen.delete(candidate);
      return serialized;
    }
    const record = candidate as Record<string, unknown>;
    const serialized = `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${visit(record[key])}`).join(",")}}`;
    seen.delete(candidate);
    return serialized;
  };
  return visit(value);
}

/** 快速同步散列，适合 UI 渲染路径中的中小型结构指纹。 */
export function articleCacheFingerprint(value: unknown): string {
  const source = typeof value === "string" ? value : stableStringify(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193) >>> 0;
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b) >>> 0;
  }
  return `${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
}

/**
 * 计算单个文章节点的渲染指纹，但不递归序列化后代节点。
 *
 * 文章章节 DOM 只由当前节点自身字段和调用方提供的层级、编号、只读状态等上下文决定；
 * 把 `children` 一并序列化会让深链文档退化为近似 O(n²)，并让任意后代编辑无谓地
 * 使所有祖先缓存失效。
 *
 * @param node 当前文章章节对应的节点。
 * @param context 影响该章节输出的派生层级、编号和显示设置。
 * @returns 不包含后代内容的稳定节点渲染指纹。
 */
export function articleNodeRenderFingerprint(node: MindMapNode, context: unknown): string {
  return articleCacheFingerprint({
    node: { ...node, children: [] },
    context
  });
}

/** 检查磁盘数据，拒绝异常大、旧版本或结构不完整的缓存。 */
export function normalizeArticleRenderCacheSnapshot(value: unknown): ArticleRenderCacheSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<ArticleRenderCacheSnapshot>;
  if (candidate.schemaVersion !== ARTICLE_RENDER_CACHE_SCHEMA_VERSION) return null;
  if (candidate.rendererRevision !== ARTICLE_RENDERER_REVISION) return null;
  if (typeof candidate.filePath !== "string" || !candidate.filePath.trim()) return null;
  if (typeof candidate.documentFingerprint !== "string" || typeof candidate.presentationFingerprint !== "string") return null;
  if (!candidate.nodes || typeof candidate.nodes !== "object" || Array.isArray(candidate.nodes)) return null;
  const nodes: Record<string, ArticleNodeRenderCacheEntry> = Object.create(null) as Record<string, ArticleNodeRenderCacheEntry>;
  let totalCharacters = 0;
  for (const [nodeId, rawEntry] of Object.entries(candidate.nodes)) {
    if (!nodeId || !rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) continue;
    const entry = rawEntry as Partial<ArticleNodeRenderCacheEntry>;
    if (typeof entry.fingerprint !== "string" || typeof entry.html !== "string") continue;
    if (entry.html.length > MAX_NODE_HTML_CHARACTERS) continue;
    totalCharacters += entry.html.length;
    if (totalCharacters > MAX_CACHE_CHARACTERS) return null;
    nodes[nodeId] = { fingerprint: entry.fingerprint, html: entry.html };
  }
  const now = Date.now();
  return {
    schemaVersion: ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
    rendererRevision: ARTICLE_RENDERER_REVISION,
    filePath: normalizeArticleCachePath(candidate.filePath),
    documentFingerprint: candidate.documentFingerprint,
    presentationFingerprint: candidate.presentationFingerprint,
    nodes,
    updatedAt: typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : now,
    lastAccessedAt: typeof candidate.lastAccessedAt === "number" && Number.isFinite(candidate.lastAccessedAt) ? candidate.lastAccessedAt : now
  };
}

/**
 * 插件级文章渲染缓存。启动时预载到内存，视图打开可同步命中；写盘通过防抖串行执行。
 */
export class ArticleRenderCacheStore {
  private readonly entries = new Map<string, ArticleRenderCacheSnapshot>();
  private persistTimer: number | null = null;
  private persistChain: Promise<void> = Promise.resolve();

  /** Creates a bounded cache store backed by one plugin-private JSON file. */
  constructor(
    private readonly adapter: DataAdapter,
    private readonly cacheDirectory: string,
    private readonly cacheFile: string
  ) {}

  /** 从磁盘加载最近使用的缓存，插件注册视图前即可完成。 */
  async initialize(): Promise<void> {
    try {
      this.entries.clear();
      if (!await this.adapter.exists(this.cacheFile)) return;
      const parsed = JSON.parse(await this.adapter.read(this.cacheFile)) as Partial<PersistedArticleRenderCache>;
      if (parsed.schemaVersion !== ARTICLE_RENDER_CACHE_SCHEMA_VERSION || !Array.isArray(parsed.entries)) return;
      const snapshots = parsed.entries
        .map((entry) => normalizeArticleRenderCacheSnapshot(entry))
        .filter((entry): entry is ArticleRenderCacheSnapshot => Boolean(entry))
        .sort((left, right) => right.lastAccessedAt - left.lastAccessedAt);
      const selected: ArticleRenderCacheSnapshot[] = [];
      let characters = 0;
      for (const snapshot of snapshots) {
        const size = this.snapshotCharacters(snapshot);
        if (selected.length >= MAX_CACHE_ENTRIES) break;
        if (characters + size > MAX_CACHE_CHARACTERS) continue;
        selected.push(snapshot);
        characters += size;
      }
      // Map iteration order is the in-memory LRU order: oldest first, newest last.
      for (const snapshot of selected.reverse()) this.entries.set(snapshot.filePath, snapshot);
    } catch (error) {
      console.warn("MindMap Studio article cache load failed", error);
      this.entries.clear();
    }
  }

  /** 同步读取内存快照，保证 TextFileView 打开路径不等待磁盘。 */
  get(filePath: string): ArticleRenderCacheSnapshot | null {
    const normalized = normalizeArticleCachePath(filePath);
    const snapshot = this.entries.get(normalized);
    if (!snapshot) return null;
    snapshot.lastAccessedAt = Date.now();
    this.entries.delete(normalized);
    this.entries.set(normalized, snapshot);
    return snapshot;
  }

  /** 更新内存并延迟写盘；旧文件节点由新快照自然淘汰。 */
  put(snapshot: ArticleRenderCacheSnapshot): void {
    const normalized = normalizeArticleRenderCacheSnapshot(snapshot);
    if (!normalized) return;
    normalized.lastAccessedAt = Date.now();
    normalized.updatedAt = Date.now();
    this.entries.delete(normalized.filePath);
    this.entries.set(normalized.filePath, normalized);
    this.prune();
    this.schedulePersist();
  }

  /** 文件删除时清除缓存。 */
  remove(filePath: string): void {
    if (!this.entries.delete(normalizeArticleCachePath(filePath))) return;
    this.schedulePersist();
  }

  /** 文件重命名时迁移缓存键，节点快照本身仍可复用。 */
  rename(oldPath: string, newPath: string): void {
    const oldNormalized = normalizeArticleCachePath(oldPath);
    const snapshot = this.entries.get(oldNormalized);
    if (!snapshot) return;
    this.entries.delete(oldNormalized);
    snapshot.filePath = normalizeArticleCachePath(newPath);
    snapshot.lastAccessedAt = Date.now();
    this.entries.set(snapshot.filePath, snapshot);
    this.schedulePersist();
  }

  /** 插件卸载前立即提交尚未写入的缓存。 */
  flush(): Promise<void> {
    if (this.persistTimer !== null) {
      window.clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.queuePersist();
    return this.persistChain;
  }

  /** Debounces repeated node updates into one disk write. */
  private schedulePersist(): void {
    if (this.persistTimer !== null) window.clearTimeout(this.persistTimer);
    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null;
      this.queuePersist();
    }, 800);
  }

  /** Serializes writes so a slower previous write cannot overwrite a newer snapshot. */
  private queuePersist(): void {
    const payload: PersistedArticleRenderCache = {
      schemaVersion: ARTICLE_RENDER_CACHE_SCHEMA_VERSION,
      entries: Array.from(this.entries.values())
    };
    this.persistChain = this.persistChain
      .catch(() => undefined)
      .then(async () => {
        if (!await this.adapter.exists(this.cacheDirectory)) await this.adapter.mkdir(this.cacheDirectory);
        await this.adapter.write(this.cacheFile, JSON.stringify(payload));
      })
      .catch((error) => console.warn("MindMap Studio article cache persist failed", error));
  }

  /** Applies entry-count and total-character LRU limits. */
  private prune(): void {
    while (this.entries.size > MAX_CACHE_ENTRIES) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      this.entries.delete(oldest);
    }
    let total = Array.from(this.entries.values()).reduce((sum, snapshot) => sum + this.snapshotCharacters(snapshot), 0);
    while (total > MAX_CACHE_CHARACTERS && this.entries.size > 1) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      const removed = this.entries.get(oldest);
      this.entries.delete(oldest);
      if (removed) total -= this.snapshotCharacters(removed);
    }
  }

  /** Estimates one snapshot size without repeatedly serializing the complete cache. */
  private snapshotCharacters(snapshot: ArticleRenderCacheSnapshot): number {
    return Object.values(snapshot.nodes).reduce((sum, entry) => sum + entry.html.length + entry.fingerprint.length, 0)
      + snapshot.filePath.length + snapshot.documentFingerprint.length + snapshot.presentationFingerprint.length + 128;
  }
}
