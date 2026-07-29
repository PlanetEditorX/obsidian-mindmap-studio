/**
 * @file desktop-import.ts
 * @description Desktop-native file selection and reading helpers for mind-map imports.
 */

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
  };
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
