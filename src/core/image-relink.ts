/**
 * @file image-relink.ts
 * @description 导图引用的本地图片在磁盘上被替换成同名其它格式（如 png 改成 svg 或 jpg）后，
 * 按文件名主干重新定位仓库中的图片文件，供显示兜底与引用改写复用。
 */

import { nodeContentBlocks, replaceNodeContentBlocks, type MindMapDocument, type MindMapImageContentBlock } from "./model";
import { flattenNodes } from "./node-tree";

/**
 * 参与同名重新识别的图片扩展名，按匹配优先级从高到低排列（矢量图优先）。
 * 未列出的扩展名（含非图片文件）一律不参与匹配。
 */
export const IMAGE_RELINK_EXTENSIONS: readonly string[] = ["svg", "png", "jpg", "jpeg", "webp", "gif", "bmp", "avif", "ico"];

/**
 * 一次同名图片重新识别的匹配结果。
 */
export interface ImageRelinkTarget {
  /** 匹配到的仓库路径。 */
  path: string;
  /** 是否与原引用位于同一目录；否则来自全库搜索。 */
  sameDirectory: boolean;
}

/** 拆分后的引用路径。 */
interface SplitReferencePath {
  directory: string;
  stem: string;
  extension: string;
}

/**
 * 拆分引用路径的目录、文件名主干与小写扩展名。
 *
 * @param reference 仓库路径或相对引用。
 * @returns 拆分结果；文件名主干为空时返回 null。
 */
function splitReferencePath(reference: string): SplitReferencePath | null {
  const normalized = reference.replace(/\\/g, "/").trim();
  if (!normalized) return null;
  const slash = normalized.lastIndexOf("/");
  const directory = slash >= 0 ? normalized.slice(0, slash) : "";
  const fileName = slash >= 0 ? normalized.slice(slash + 1) : normalized;
  const dot = fileName.lastIndexOf(".");
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  if (!stem) return null;
  return { directory, stem, extension: dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "" };
}

/**
 * 从图片引用中解析出可用于仓库定位的裸路径。
 *
 * 远程地址（http/data/blob）返回 null；Wiki 引用（`![[图.png]]` 或 `![[图.png|别名]]`）
 * 会去掉包裹、别名与 `#` 锚点后返回其中的路径。
 *
 * @param reference 图片块保存的原始引用字符串。
 * @returns 裸路径；引用不是本地图片时返回 null。
 */
export function localImageReferenceTarget(reference: string): string | null {
  const value = reference.trim();
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return null;
  const wiki = value.match(/^!?\[\[([\s\S]+?)\]\]$/);
  const target = (wiki?.[1] ?? value).split("|")[0]?.split("#")[0]?.trim() ?? "";
  return target || null;
}

/**
 * 把引用字符串中的裸路径替换为新路径，保留 Wiki 包裹与别名等原有结构。
 *
 * @param reference 原始引用字符串。
 * @param previous 被替换的裸路径。
 * @param next 新的裸路径。
 * @returns 替换后的引用字符串；原字符串不含旧路径时直接返回新路径。
 */
function replaceReferenceTarget(reference: string, previous: string, next: string): string {
  const index = reference.indexOf(previous);
  if (index < 0) return next;
  return `${reference.slice(0, index)}${next}${reference.slice(index + previous.length)}`;
}

/**
 * 在仓库图片文件列表中为已失效的本地图片引用寻找同名不同扩展名的替换路径。
 *
 * 匹配规则：文件名主干忽略大小写相同，且候选扩展名属于 {@link IMAGE_RELINK_EXTENSIONS}
 * 并与原扩展名不同（同名同扩展名就是原文件本身，不参与匹配）。同目录候选优先于全库候选；
 * 同一层级内按 {@link IMAGE_RELINK_EXTENSIONS} 的顺序选取，因此矢量图 svg 优先。
 *
 * @param missingPath 已失效的本地图片路径。
 * @param availableFiles 仓库内全部图片文件路径。
 * @returns 匹配结果；没有同名候选时返回 null。
 */
export function findImageRelinkTarget(missingPath: string, availableFiles: readonly string[]): ImageRelinkTarget | null {
  const missing = splitReferencePath(missingPath);
  if (!missing) return null;
  const stemKey = missing.stem.toLowerCase();
  let sameDirectoryBest: ImageRelinkTarget | null = null;
  let sameDirectoryRank = Number.MAX_SAFE_INTEGER;
  let fallbackBest: ImageRelinkTarget | null = null;
  let fallbackRank = Number.MAX_SAFE_INTEGER;

  for (const candidate of availableFiles) {
    const parsed = splitReferencePath(candidate);
    if (!parsed || !parsed.extension) continue;
    if (parsed.stem.toLowerCase() !== stemKey) continue;
    if (parsed.extension === missing.extension) continue;
    const rank = IMAGE_RELINK_EXTENSIONS.indexOf(parsed.extension);
    if (rank < 0) continue;
    if (parsed.directory === missing.directory) {
      if (rank < sameDirectoryRank) {
        sameDirectoryRank = rank;
        sameDirectoryBest = { path: candidate, sameDirectory: true };
      }
      continue;
    }
    if (rank < fallbackRank) {
      fallbackRank = rank;
      fallbackBest = { path: candidate, sameDirectory: false };
    }
  }

  return sameDirectoryBest ?? fallbackBest;
}

/**
 * 把单个图片块中已失效的本地引用改写为重新识别到的新路径。
 *
 * `source`、`localSource` 与图片级来源优先级中的本地地址都会同步改写；远程图床镜像
 * 与内容哈希保持不变。同一主干路径在一次调用内只解析一次，避免重复扫描仓库文件列表。
 *
 * @param block 需要处理的图片内容块，会被原地改写。
 * @param findReplacement 为失效的裸路径返回替换路径；原文件仍存在或没有同名候选时返回 null。
 * @returns 图片块是否发生改写。
 */
export function relinkImageBlock(
  block: MindMapImageContentBlock,
  findReplacement: (path: string) => string | null
): boolean {
  const cache = new Map<string, string | null>();
  const resolve = (reference: string | undefined): string | null => {
    if (!reference) return null;
    const target = localImageReferenceTarget(reference);
    if (!target) return null;
    if (!cache.has(target)) cache.set(target, findReplacement(target));
    const next = cache.get(target) ?? null;
    if (!next) return null;
    const rewritten = replaceReferenceTarget(reference, target, next);
    return rewritten === reference ? null : rewritten;
  };

  let changed = false;
  const nextSource = resolve(block.source);
  if (nextSource) {
    block.source = nextSource;
    changed = true;
  }
  const nextLocalSource = resolve(block.localSource);
  if (nextLocalSource) {
    block.localSource = nextLocalSource;
    changed = true;
  }
  const priority = block.sourcePriority;
  if (priority?.length) {
    const nextPriority = priority.map((item) => resolve(item) ?? item);
    if (nextPriority.some((item, index) => item !== priority[index])) {
      block.sourcePriority = nextPriority;
      changed = true;
    }
  }
  return changed;
}

/**
 * 遍历整份文档，把全部已失效的本地图片引用重新指向同名其它格式的仓库文件。
 *
 * 纯逻辑函数，不执行任何文件系统操作；`findReplacement` 由调用方实现。改写通过
 * `replaceNodeContentBlocks()` 写回节点，确保兼容镜像字段同步。
 *
 * @param document 需要处理的思维导图文档，节点内容会被原地改写。
 * @param findReplacement 为失效的裸路径返回替换路径；原文件仍存在或没有同名候选时返回 null。
 * @returns 实际改写的图片块数量。
 */
export function relinkDocumentImages(
  document: MindMapDocument,
  findReplacement: (path: string) => string | null
): number {
  let changed = 0;
  for (const node of flattenNodes(document.root)) {
    const blocks = nodeContentBlocks(node);
    let nodeChanged = false;
    for (const block of blocks) {
      if (block.type !== "image") continue;
      if (relinkImageBlock(block, findReplacement)) {
        nodeChanged = true;
        changed += 1;
      }
    }
    if (nodeChanged) replaceNodeContentBlocks(node, blocks);
  }
  return changed;
}
