/**
 * @file reading-location.ts
 * @description 跨导图、大纲、文章和通读模式共享的语义阅读位置。
 *
 * 位置以“物理文件 + 节点祖先链”表示，而不是只保存像素滚动值。
 * 当目标节点或子导图被删除时，解析器会依次回退到当前节点的父级、
 * 父导图中的挂载节点及其父级，最终回到整本导图的根节点。
 */

import type { MindMapDocument, MindMapNode } from "../core/model";

const findNode = (root: MindMapNode, id: string): MindMapNode | null => {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
};

const findAncestors = (root: MindMapNode, id: string): MindMapNode[] => {
  const path: MindMapNode[] = [];
  const visit = (node: MindMapNode): boolean => {
    if (node.id === id) return true;
    for (const child of node.children) {
      path.push(node);
      if (visit(child)) return true;
      path.pop();
    }
    return false;
  };
  return visit(root) ? path : [];
};

/** 同一物理导图内，从精确节点向根节点回退的一条候选链。 */
export interface ReadingLocationFallback {
  filePath: string;
  nodeIds: string[];
}

/** 可持久化的统一阅读位置。 */
export interface ReadingLocation {
  filePath: string;
  nodeIds: string[];
  fallbacks: ReadingLocationFallback[];
  /** 锚点在目标节点内部的相对位置，范围 0–1。 */
  nodeRatio: number;
  /** 锚点在滚动视口中的相对位置，范围 0–1。 */
  viewportRatio: number;
}

/** 构建和解析阅读位置所需的最小文章族信息。 */
export interface ReadingLocationSection {
  filePath: string;
  document: MindMapDocument;
  parentFilePath?: string;
  parentNodeId?: string;
}

/** 已在当前文章族中验证存在的具体位置。 */
export interface ResolvedReadingLocation {
  filePath: string;
  nodeId: string;
  nodeRatio: number;
  viewportRatio: number;
}

const clampRatio = (value: unknown, fallback: number): number => (
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback
);

/**
 * 返回目标节点到根节点的回退顺序：目标、直接父级、祖父级……根节点。
 */
export function nodeFallbackIds(document: MindMapDocument, nodeId: string): string[] {
  const target = findNode(document.root, nodeId);
  if (!target) return [document.root.id];
  return [target.id, ...findAncestors(document.root, target.id).reverse().map((node) => node.id)];
}

/**
 * 根据当前文章族构建持久化位置，同时记录跨子导图的父级回退链。
 */
export function createReadingLocation(
  sections: readonly ReadingLocationSection[],
  filePath: string,
  nodeId: string,
  nodeRatio = 0,
  viewportRatio = 0.35
): ReadingLocation {
  const byPath = new Map(sections.map((section) => [section.filePath, section]));
  const primary = byPath.get(filePath) ?? sections[0];
  if (!primary) {
    return {
      filePath: filePath.trim(),
      nodeIds: nodeId.trim() ? [nodeId.trim()] : [],
      fallbacks: [],
      nodeRatio: clampRatio(nodeRatio, 0),
      viewportRatio: clampRatio(viewportRatio, 0.35)
    };
  }

  const fallbacks: ReadingLocationFallback[] = [];
  const visited = new Set<string>([primary.filePath]);
  let current = primary;
  while (current.parentFilePath && !visited.has(current.parentFilePath)) {
    const parent = byPath.get(current.parentFilePath);
    if (!parent) break;
    visited.add(parent.filePath);
    fallbacks.push({
      filePath: parent.filePath,
      nodeIds: nodeFallbackIds(parent.document, current.parentNodeId ?? parent.document.root.id)
    });
    current = parent;
  }

  return {
    filePath: primary.filePath,
    nodeIds: nodeFallbackIds(primary.document, nodeId),
    fallbacks,
    nodeRatio: clampRatio(nodeRatio, 0),
    viewportRatio: clampRatio(viewportRatio, 0.35)
  };
}

/**
 * 规范化磁盘设置中的未知值，丢弃空路径、空节点链和异常比例。
 */
export function normalizeReadingLocation(value: unknown): ReadingLocation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Partial<ReadingLocation>;
  const filePath = typeof input.filePath === "string" ? input.filePath.trim() : "";
  const nodeIds = Array.isArray(input.nodeIds)
    ? [...new Set(input.nodeIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())).map((id) => id.trim()))]
    : [];
  if (!filePath || !nodeIds.length) return null;
  const fallbacks = Array.isArray(input.fallbacks)
    ? input.fallbacks.flatMap((fallback) => {
      if (!fallback || typeof fallback !== "object" || Array.isArray(fallback)) return [];
      const candidate = fallback as Partial<ReadingLocationFallback>;
      const fallbackPath = typeof candidate.filePath === "string" ? candidate.filePath.trim() : "";
      const fallbackNodeIds = Array.isArray(candidate.nodeIds)
        ? [...new Set(candidate.nodeIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())).map((id) => id.trim()))]
        : [];
      return fallbackPath && fallbackNodeIds.length ? [{ filePath: fallbackPath, nodeIds: fallbackNodeIds }] : [];
    })
    : [];
  return {
    filePath,
    nodeIds,
    fallbacks,
    nodeRatio: clampRatio(input.nodeRatio, 0),
    viewportRatio: clampRatio(input.viewportRatio, 0.35)
  };
}

/**
 * 在最新文档树中解析持久化位置。节点或文件失效时按保存的层级链回退。
 */
export function resolveReadingLocation(
  location: ReadingLocation | null | undefined,
  sections: readonly ReadingLocationSection[],
  preferredFilePath = ""
): ResolvedReadingLocation | null {
  if (!sections.length) return null;
  const byPath = new Map(sections.map((section) => [section.filePath, section]));
  const normalized = normalizeReadingLocation(location);
  const chains = normalized
    ? [{ filePath: normalized.filePath, nodeIds: normalized.nodeIds }, ...normalized.fallbacks]
    : [];

  for (const chain of chains) {
    const section = byPath.get(chain.filePath);
    if (!section) continue;
    for (const nodeId of chain.nodeIds) {
      if (findNode(section.document.root, nodeId)) {
        return {
          filePath: section.filePath,
          nodeId,
          nodeRatio: normalized?.nodeRatio ?? 0,
          viewportRatio: normalized?.viewportRatio ?? 0.35
        };
      }
    }
  }

  const fallbackSection = byPath.get(preferredFilePath) ?? sections[0]!;
  return {
    filePath: fallbackSection.filePath,
    nodeId: fallbackSection.document.root.id,
    nodeRatio: 0,
    viewportRatio: normalized?.viewportRatio ?? 0.35
  };
}

/** 比较两个位置是否具有相同语义，避免滚动期间重复写入设置。 */
export function sameReadingLocation(left: ReadingLocation | null | undefined, right: ReadingLocation | null | undefined): boolean {
  const a = normalizeReadingLocation(left);
  const b = normalizeReadingLocation(right);
  return JSON.stringify(a) === JSON.stringify(b);
}

/** 在导图文件重命名后替换主路径和每一级跨文件回退路径。 */
export function renameReadingLocationPath(location: ReadingLocation, oldPath: string, newPath: string): ReadingLocation {
  if (!oldPath || oldPath === newPath) return location;
  return {
    ...location,
    filePath: location.filePath === oldPath ? newPath : location.filePath,
    fallbacks: location.fallbacks.map((fallback) => ({
      ...fallback,
      filePath: fallback.filePath === oldPath ? newPath : fallback.filePath
    }))
  };
}
