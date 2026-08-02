/**
 * @file file-explorer-filter.ts
 * @description 文件浏览器筛选规则的纯函数，供插件运行时和自动测试共同使用。
 */

/** File Explorer visibility preferences resolved from plugin settings. */
export interface FileExplorerFilterSettings {
  assetFolder: string;
  hideAssetFolderInFileExplorer: boolean;
  hideConfiguredFilesInFileExplorer: boolean;
  hiddenFileExtensions: string;
  hiddenFileFolders: string;
}

/** Converts a comma, semicolon, or line-separated extension list into normalized suffixes. */
export function normalizeHiddenFileExtensions(value: string): string[] {
  return [...new Set(value.split(/[;,\n\s]+/)
    .map((item) => item.trim().replace(/^\.+/, "").toLowerCase())
    .filter((item) => /^[a-z0-9][a-z0-9_-]{0,31}$/i.test(item)))];
}

/** Converts a comma, semicolon, or line-separated folder list into vault-relative paths. */
export function normalizeHiddenFolderPaths(value: string): string[] {
  return [...new Set(value.split(/[;,\n]+/)
    .map((item) => item.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean))];
}

/** Normalizes one vault-relative path without resolving it against the operating system. */
function normalizeVaultRelativePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

/** Builds a stable semantic key so unrelated settings saves do not rescan File Explorer. */
export function fileExplorerFilterSignature(settings: FileExplorerFilterSettings): string {
  return JSON.stringify({
    assetFolder: normalizeVaultRelativePath(settings.assetFolder),
    hideAssetFolder: settings.hideAssetFolderInFileExplorer,
    hideConfiguredFiles: settings.hideConfiguredFilesInFileExplorer,
    extensions: normalizeHiddenFileExtensions(settings.hiddenFileExtensions).sort(),
    folders: normalizeHiddenFolderPaths(settings.hiddenFileFolders).sort()
  });
}

/** Compiles normalized extension and folder rules once for an entire File Explorer scan. */
export function createFileExplorerPathFilter(settings: FileExplorerFilterSettings): (path: string) => boolean {
  const assetFolder = normalizeVaultRelativePath(settings.assetFolder);
  const assetName = settings.hideAssetFolderInFileExplorer && assetFolder
    ? assetFolder.split("/").at(-1) ?? ""
    : "";
  const hiddenExtensions = new Set(normalizeHiddenFileExtensions(settings.hiddenFileExtensions));
  const hiddenFolderSegments = new Set<string>();
  const hiddenFolderPaths: string[] = [];
  for (const folder of normalizeHiddenFolderPaths(settings.hiddenFileFolders)) {
    if (folder.includes("/")) hiddenFolderPaths.push(folder);
    else hiddenFolderSegments.add(folder);
  }

  return (path: string): boolean => {
    const normalizedPath = normalizeVaultRelativePath(path);
    if (!normalizedPath) return false;
    const pathSegments = normalizedPath.split("/");
    if (assetName && pathSegments.includes(assetName)) return true;
    if (!settings.hideConfiguredFilesInFileExplorer) return false;
    const fileName = pathSegments.at(-1)?.toLowerCase() ?? "";
    const extensionIndex = fileName.lastIndexOf(".");
    if (extensionIndex >= 0 && hiddenExtensions.has(fileName.slice(extensionIndex + 1))) return true;
    if (pathSegments.some((segment) => hiddenFolderSegments.has(segment))) return true;
    return hiddenFolderPaths.some((folder) => normalizedPath === folder || normalizedPath.startsWith(`${folder}/`));
  };
}

/** Returns whether a File Explorer path should be hidden without altering vault files. */
export function shouldHideFileExplorerPath(path: string, settings: FileExplorerFilterSettings): boolean {
  return createFileExplorerPathFilter(settings)(path);
}
