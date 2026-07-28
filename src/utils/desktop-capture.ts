/**
 * @file desktop-capture.ts
 * @description 调用桌面系统截图工具并从 Electron 剪贴板读取 PNG 图片。
 */

/** 系统截图完成后返回的图片及建议文件名。 */
export interface DesktopCaptureResult {
  blob: Blob;
  suggestedName: string;
}

/** Electron 运行时中截图功能使用的最小宿主接口。 */
interface ElectronCaptureRuntime {
  clipboard: {
    readImage: () => { isEmpty: () => boolean; toPNG: () => Uint8Array };
  };
  BrowserWindow?: {
    getFocusedWindow?: () => {
      minimize: () => void;
      restore: () => void;
      show: () => void;
      focus: () => void;
      isDestroyed: () => boolean;
    } | null;
  };
  remote?: ElectronWindowRuntime;
}

/** Electron 主窗口控制所需的最小运行时接口。 */
interface ElectronWindowRuntime {
  getCurrentWindow?: () => ElectronWindowHandle | null;
  BrowserWindow?: ElectronCaptureRuntime["BrowserWindow"];
}

/** 截图前临时最小化、截图后恢复所需的主窗口接口。 */
interface ElectronWindowHandle {
  minimize: () => void;
  restore: () => void;
  show: () => void;
  focus: () => void;
  isDestroyed: () => boolean;
  isMinimized?: () => boolean;
}

/** 桌面截图命令使用的最小 Node.js 运行时接口。 */
interface NodeCaptureRuntime {
  platform: string;
  execFile: (
    command: string,
    args: string[],
    options: Record<string, unknown>,
    callback: (error: Error | null) => void
  ) => void;
  spawn: (
    command: string,
    args: string[],
    options: Record<string, unknown>
  ) => { unref: () => void };
}

/** 返回当前桌面平台对应的截图命令候选，按优先级依次尝试。 */
export function screenshotCommandCandidates(platform: string): Array<{ command: string; args: string[]; detached?: boolean }> {
  if (platform === "darwin") return [{ command: "screencapture", args: ["-i", "-c"] }];
  if (platform === "win32") return [
    { command: "SnippingTool.exe", args: ["/clip"], detached: true },
    { command: "explorer.exe", args: ["ms-screenclip:"], detached: true }
  ];
  return [
    { command: "gnome-screenshot", args: ["-a", "-c"] },
    { command: "spectacle", args: ["-r", "-b", "-n", "--clipboard"] },
    { command: "flameshot", args: ["gui", "--clipboard"] }
  ];
}

/** 将任意 Uint8Array 复制为 Blob 接受的普通 ArrayBuffer，兼容 SharedArrayBuffer 类型声明。 */
export function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

/** 将剪贴板 PNG 二进制转换为稳定摘要，用于检测截图是否产生了新图片。 */
export function pngFingerprint(bytes: Uint8Array): string {
  if (!bytes.length) return "";
  let hash = 2166136261;
  const step = Math.max(1, Math.floor(bytes.length / 4096));
  for (let index = 0; index < bytes.length; index += step) {
    hash ^= bytes[index] ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `${bytes.length}:${(hash >>> 0).toString(16)}`;
}

/** 从 Obsidian 桌面端窗口获取 Electron API；移动端或受限环境返回 null。 */
function getElectronRuntime(): ElectronCaptureRuntime | null {
  const requireFunction = typeof window !== "undefined"
    ? (window as unknown as { require?: (id: string) => unknown }).require
    : undefined;
  if (!requireFunction) return null;
  try {
    const electron = requireFunction("electron") as ElectronCaptureRuntime;
    if (!electron.remote) {
      try {
        electron.remote = requireFunction("@electron/remote") as ElectronWindowRuntime;
      } catch {
        // Newer desktop runtimes may intentionally omit @electron/remote.
      }
    }
    return electron;
  } catch {
    return null;
  }
}

/** 从 Electron 的新旧渲染器接口中取得当前 Obsidian 主窗口。 */
function getCurrentObsidianWindow(runtime: ElectronCaptureRuntime): ElectronWindowHandle | null {
  return runtime.BrowserWindow?.getFocusedWindow?.()
    ?? runtime.remote?.getCurrentWindow?.()
    ?? runtime.remote?.BrowserWindow?.getFocusedWindow?.()
    ?? null;
}

/** 等待窗口完成最小化，避免截图工具启动时仍捕获到 Obsidian 窗口。 */
async function waitForWindowMinimized(windowHandle: ElectronWindowHandle): Promise<void> {
  const started = Date.now();
  while (!windowHandle.isDestroyed() && !windowHandle.isMinimized?.() && Date.now() - started < 1_000) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
}

/** 从 Obsidian 桌面端按需获取 Node.js API，避免移动端加载插件时静态引用 Node 模块。 */
function getNodeCaptureRuntime(): NodeCaptureRuntime | null {
  const requireFunction = (globalThis as unknown as { require?: (id: string) => unknown }).require
    ?? (typeof window !== "undefined" ? (window as unknown as { require?: (id: string) => unknown }).require : undefined);
  if (!requireFunction) return null;
  try {
    const childProcess = requireFunction("node:child_process") as Pick<NodeCaptureRuntime, "execFile" | "spawn">;
    const processModule = requireFunction("node:process") as { platform: string };
    return { platform: processModule.platform, execFile: childProcess.execFile, spawn: childProcess.spawn };
  } catch {
    return null;
  }
}

/** 等待系统截图工具把一张新图片写入剪贴板。 */
async function waitForClipboardImage(runtime: ElectronCaptureRuntime, previousFingerprint: string, timeoutMs = 120_000): Promise<Uint8Array> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const image = runtime.clipboard.readImage();
    const bytes = image.isEmpty() ? new Uint8Array() : image.toPNG();
    if (bytes.length && pngFingerprint(bytes) !== previousFingerprint) return bytes;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("没有检测到新的截图；可能已取消截图操作");
}

/** 使用 execFile 执行一个截图候选命令。 */
function executeCaptureCommand(runtime: NodeCaptureRuntime, command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    runtime.execFile(command, args, { windowsHide: true, timeout: 120_000 }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/** 执行系统截图命令；交互式命令失败时继续尝试下一个候选。 */
async function runScreenshotCommand(
  runtime: NodeCaptureRuntime,
  candidates: Array<{ command: string; args: string[]; detached?: boolean }>
): Promise<void> {
  let lastError = "未找到可用截图工具";
  for (const candidate of candidates) {
    try {
      if (candidate.detached) {
        const child = runtime.spawn(candidate.command, candidate.args, { detached: true, stdio: "ignore", windowsHide: true });
        child.unref();
      } else {
        await executeCaptureCommand(runtime, candidate.command, candidate.args);
      }
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`无法启动系统截图工具：${lastError}`);
}

/** 启动交互式区域截图，可选先最小化 Obsidian，完成后恢复窗口并返回剪贴板 PNG。 */
export async function captureDesktopScreenshot(hideObsidian: boolean): Promise<DesktopCaptureResult> {
  const electronRuntime = getElectronRuntime();
  const nodeRuntime = getNodeCaptureRuntime();
  if (!electronRuntime || !nodeRuntime) throw new Error("截图仅支持 Obsidian 桌面端");
  const beforeImage = electronRuntime.clipboard.readImage();
  const beforeBytes = beforeImage.isEmpty() ? new Uint8Array() : beforeImage.toPNG();
  const beforeFingerprint = pngFingerprint(beforeBytes);
  const windowHandle = getCurrentObsidianWindow(electronRuntime);
  try {
    if (hideObsidian && windowHandle && !windowHandle.isDestroyed()) {
      windowHandle.minimize();
      await waitForWindowMinimized(windowHandle);
    }
    await new Promise((resolve) => setTimeout(resolve, hideObsidian ? 350 : 50));
    await runScreenshotCommand(nodeRuntime, screenshotCommandCandidates(nodeRuntime.platform));
    const bytes = await waitForClipboardImage(electronRuntime, beforeFingerprint);
    return {
      blob: new Blob([copyBytesToArrayBuffer(bytes)], { type: "image/png" }),
      suggestedName: "mindmap-screenshot.png"
    };
  } finally {
    if (hideObsidian && windowHandle && !windowHandle.isDestroyed()) {
      windowHandle.restore();
      windowHandle.show();
      windowHandle.focus();
    }
  }
}
