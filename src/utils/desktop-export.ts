/**
 * @file desktop-export.ts
 * @description 桌面端导出文件保存位置选择与默认桌面写入工具。
 */

/** 外部导出文件格式。 */
export type DesktopExportExtension = "svg" | "md" | "json" | "html" | "doc" | "docx" | "pdf";

/** Electron 离屏 PDF 渲染窗口的最小接口。 */
interface ElectronPdfWindow {
  loadURL: (url: string) => Promise<void>;
  webContents: {
    printToPDF: (options: { pageSize: "A4"; printBackground: boolean }) => Promise<Uint8Array>;
  };
  isDestroyed: () => boolean;
  destroy: () => void;
}

/** Electron 离屏 PDF 渲染窗口构造器。 */
interface ElectronPdfWindowConstructor {
  new(options: {
    show: boolean;
    webPreferences?: {
      nodeIntegration?: boolean;
      contextIsolation?: boolean;
      sandbox?: boolean;
      javascript?: boolean;
    };
  }): ElectronPdfWindow;
}

/** Electron 保存对话框运行时的最小接口。 */
interface ElectronSaveRuntime {
  dialog?: {
    showSaveDialog: (options: { defaultPath: string; filters: Array<{ name: string; extensions: string[] }> }) => Promise<{ canceled: boolean; filePath?: string }>;
  };
  remote?: {
    dialog?: ElectronSaveRuntime["dialog"];
    BrowserWindow?: ElectronPdfWindowConstructor;
  };
  BrowserWindow?: ElectronPdfWindowConstructor;
}

/** Node.js 文件导出运行时的最小接口。 */
interface NodeExportRuntime {
  fs: {
    writeFile: (path: string, data: string | Uint8Array) => Promise<void>;
  };
  os: {
    homedir: () => string;
  };
  path: {
    join: (...parts: string[]) => string;
  };
}

/** 桌面导出保存结果。 */
export interface DesktopExportResult {
  path: string;
  selected: boolean;
}

/** 清理文件名中跨平台不安全字符。 */
export function sanitizeExportFilename(name: string, fallback = "思维导图"): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, " ").replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "") || fallback;
}

/** 从 Obsidian 桌面端获取保存对话框；不可用时返回 null。 */
function getElectronSaveRuntime(): ElectronSaveRuntime | null {
  const requireFunction = typeof window !== "undefined"
    ? (window as unknown as { require?: (id: string) => unknown }).require
    : undefined;
  if (!requireFunction) return null;
  try {
    return requireFunction("electron") as ElectronSaveRuntime;
  } catch {
    return null;
  }
}

/** 从 Obsidian 桌面端按需获取 Node.js 文件 API；移动端或受限环境返回 null。 */
function getNodeExportRuntime(): NodeExportRuntime | null {
  const requireFunction = (globalThis as unknown as { require?: (id: string) => unknown }).require
    ?? (typeof window !== "undefined" ? (window as unknown as { require?: (id: string) => unknown }).require : undefined);
  if (!requireFunction) return null;
  try {
    const fs = requireFunction("node:fs/promises") as NodeExportRuntime["fs"];
    const os = requireFunction("node:os") as NodeExportRuntime["os"];
    const path = requireFunction("node:path") as NodeExportRuntime["path"];
    return { fs, os, path };
  } catch {
    return null;
  }
}

/** 保存导出文本到用户选择的位置；无法打开选择器时默认写入桌面。 */
export async function saveDesktopExportFile(extension: DesktopExportExtension, baseName: string, content: string | Uint8Array): Promise<DesktopExportResult | null> {
  const nodeRuntime = getNodeExportRuntime();
  if (!nodeRuntime) return null;
  const filename = `${sanitizeExportFilename(baseName)}.${extension}`;
  const defaultPath = nodeRuntime.path.join(nodeRuntime.os.homedir(), "Desktop", filename);
  const dialog = getElectronSaveRuntime()?.dialog ?? getElectronSaveRuntime()?.remote?.dialog;
  const selected = dialog
    ? await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
    })
    : null;
  if (selected?.canceled) return { path: "", selected: true };
  const path = selected?.filePath || defaultPath;
  await nodeRuntime.fs.writeFile(path, content);
  return { path, selected: Boolean(selected?.filePath) };
}

/** 使用 Electron 的离屏窗口渲染 HTML，并直接写出 PDF，避免 Obsidian 拦截打印弹窗。 */
export async function saveDesktopPdfFile(baseName: string, html: string): Promise<DesktopExportResult | null> {
  const runtime = getElectronSaveRuntime();
  const BrowserWindow = runtime?.remote?.BrowserWindow ?? runtime?.BrowserWindow;
  if (!BrowserWindow) return null;
  let printWindow: ElectronPdfWindow | null = null;
  try {
    printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        javascript: false
      }
    });
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const pdf = await printWindow.webContents.printToPDF({ pageSize: "A4", printBackground: true });
    return await saveDesktopExportFile("pdf", baseName, pdf);
  } catch {
    return null;
  } finally {
    if (printWindow && !printWindow.isDestroyed()) printWindow.destroy();
  }
}
