/**
 * @file desktop-import.ts
 * @description Desktop-native file selection and reading helpers for mind-map imports.
 */

import {
  flattenNodes,
  nodeContentBlocks,
  replaceNodeContentBlocks,
  type MindMapDocument
} from "../core/model";

/** A file chosen through Obsidian Desktop's native open dialog. */
export interface DesktopImportFile {
  name: string;
  directory: string;
  content: Uint8Array;
}

/** Result of attempting to open the Desktop-native import dialog. */
export interface DesktopImportSelectionResult {
  supported: boolean;
  file: DesktopImportFile | null;
}

/** Minimal Electron dialog API used by the renderer. */
interface ElectronOpenRuntime {
  dialog?: {
    showOpenDialog: (options: {
      defaultPath?: string;
      filters: Array<{ name: string; extensions: string[] }>;
      properties: ["openFile"];
    }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  };
  remote?: {
    dialog?: ElectronOpenRuntime["dialog"];
  };
}

/** Minimal Node.js file APIs used after a native path is selected. */
interface NodeImportRuntime {
  fs: {
    readFile: (path: string) => Promise<Uint8Array>;
  };
  path: {
    basename: (path: string) => string;
    dirname: (path: string) => string;
    isAbsolute: (path: string) => boolean;
    resolve: (...paths: string[]) => string;
    sep: string;
  };
}

/** Desktop Markdown 图片读取结果，包含去重所需的绝对路径。 */
export interface DesktopMarkdownImageFile {
  path: string;
  name: string;
  content: Uint8Array;
}

/** Reads Electron lazily so mobile and restricted runtimes remain supported. */
function getElectronOpenRuntime(): ElectronOpenRuntime | null {
  const requireFunction = typeof window !== "undefined"
    ? (window as unknown as { require?: (id: string) => unknown }).require
    : undefined;
  if (!requireFunction) return null;
  try {
    return requireFunction("electron") as ElectronOpenRuntime;
  } catch {
    return null;
  }
}

/** Reads Node file APIs lazily so the module can be bundled for every Obsidian platform. */
function getNodeImportRuntime(): NodeImportRuntime | null {
  const requireFunction = (globalThis as unknown as { require?: (id: string) => unknown }).require
    ?? (typeof window !== "undefined" ? (window as unknown as { require?: (id: string) => unknown }).require : undefined);
  if (!requireFunction) return null;
  try {
    return {
      fs: requireFunction("node:fs/promises") as NodeImportRuntime["fs"],
      path: requireFunction("node:path") as NodeImportRuntime["path"]
    };
  } catch {
    return null;
  }
}

/**
 * Opens a native import dialog at the last selected folder when Desktop APIs are available.
 *
 * A supported result with no file means the user cancelled; an unsupported result lets the
 * caller fall back to the browser file picker on mobile or restricted runtimes.
 */
export async function selectDesktopImportFile(lastDirectory: string): Promise<DesktopImportSelectionResult> {
  const nodeRuntime = getNodeImportRuntime();
  const electronRuntime = getElectronOpenRuntime();
  const dialog = electronRuntime?.dialog ?? electronRuntime?.remote?.dialog;
  if (!nodeRuntime || !dialog) return { supported: false, file: null };
  const selected = await dialog.showOpenDialog({
    defaultPath: lastDirectory || undefined,
    filters: [
      { name: "Mind map files", extensions: ["xmind", "md", "markdown", "json"] },
      { name: "All files", extensions: ["*"] }
    ],
    properties: ["openFile"]
  });
  const filePath = selected.canceled ? undefined : selected.filePaths[0];
  if (!filePath) return { supported: true, file: null };
  return {
    supported: true,
    file: {
      name: nodeRuntime.path.basename(filePath),
      directory: nodeRuntime.path.dirname(filePath),
      content: await nodeRuntime.fs.readFile(filePath)
    }
  };
}

/**
 * 生成 Markdown 图片链接相对于源笔记目录的候选路径。
 *
 * Obsidian 笔记可能位于附件目录内部，却仍保存从仓库根目录生成的
 * `assets/分类/图片.png` 链接，因此除原路径外还依次尝试去掉
 * `assets/` 前缀和仅使用文件名。
 */
export function desktopMarkdownImageRelativeCandidates(source: string): string[] {
  const raw = source.trim().replace(/^!?\[\[|\]\]$/g, "").split("|")[0]?.split("#")[0]?.trim() ?? "";
  if (!raw || /^(?:https?:|data:|blob:|file:)/i.test(raw)) return [];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const normalized = decoded.replace(/\\/g, "/").replace(/^\.\//, "");
  const segments = normalized.split("/").filter(Boolean);
  if (!segments.length) return [];
  const withoutAssets = segments[0]?.toLowerCase() === "assets" ? segments.slice(1).join("/") : "";
  const filename = segments.at(-1) ?? "";
  return Array.from(new Set([normalized, withoutAssets, filename].filter(Boolean)));
}

/**
 * 按 Obsidian 常见附件路径回退顺序读取桌面 Markdown 引用的本地图片。
 *
 * 该函数仅在 Desktop 原生导入已获得用户选择的源目录后调用；移动端和
 * 受限运行时返回 `null`，由调用方保留原始引用。
 */
export async function readDesktopMarkdownImage(sourceDirectory: string, source: string): Promise<DesktopMarkdownImageFile | null> {
  const nodeRuntime = getNodeImportRuntime();
  if (!nodeRuntime || !sourceDirectory.trim()) return null;
  const raw = source.trim().replace(/^!?\[\[|\]\]$/g, "").split("|")[0]?.split("#")[0]?.trim() ?? "";
  const absoluteCandidate = raw && nodeRuntime.path.isAbsolute(raw) ? [raw] : [];
  const relativeCandidates = desktopMarkdownImageRelativeCandidates(raw)
    .map((candidate) => nodeRuntime.path.resolve(sourceDirectory, candidate.split("/").join(nodeRuntime.path.sep)));
  for (const candidate of Array.from(new Set([...absoluteCandidate, ...relativeCandidates]))) {
    try {
      return {
        path: candidate,
        name: nodeRuntime.path.basename(candidate),
        content: await nodeRuntime.fs.readFile(candidate)
      };
    } catch {
      // Continue through the explicit fallback list; a missing candidate is expected.
    }
  }
  return null;
}
/** 桌面 Markdown 图片复制与节点引用改写结果。 */
export interface DesktopMarkdownImageCopyResult {
  copied: number;
  rewritten: number;
}

/**
 * 读取桌面 Markdown 引用的本地图片，保存到调用方指定位置，并原位改写权威内容块。
 *
 * `nodeContentBlocks()` 返回规范化副本，因此必须在改写后使用
 * `replaceNodeContentBlocks()` 写回节点；仅修改遍历得到的块会在后续同步时丢失。
 */
export async function copyDesktopMarkdownImagesToDocument(
  document: MindMapDocument,
  sourceDirectory: string,
  saveImage: (image: DesktopMarkdownImageFile) => Promise<string>
): Promise<DesktopMarkdownImageCopyResult> {
  if (!sourceDirectory.trim()) return { copied: 0, rewritten: 0 };
  const copiedPaths = new Map<string, string>();
  let copied = 0;
  let rewritten = 0;

  for (const node of flattenNodes(document.root)) {
    const blocks = nodeContentBlocks(node);
    let changed = false;
    for (const block of blocks) {
      if (block.type !== "image") continue;
      const rawSource = (block.localSource || block.source || "").trim();
      if (!rawSource || /^(?:https?:|data:|blob:|file:)/i.test(rawSource)) continue;
      const image = await readDesktopMarkdownImage(sourceDirectory, rawSource);
      if (!image) continue;
      let targetPath = copiedPaths.get(image.path);
      if (!targetPath) {
        targetPath = await saveImage(image);
        copiedPaths.set(image.path, targetPath);
        copied += 1;
      }
      block.source = targetPath;
      block.localSource = targetPath;
      changed = true;
      rewritten += 1;
    }
    if (changed) replaceNodeContentBlocks(node, blocks);
  }

  return { copied, rewritten };
}

