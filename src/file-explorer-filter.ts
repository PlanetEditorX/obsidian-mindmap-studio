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

/** Returns whether a File Explorer path should be hidden without altering vault files. */
export function shouldHideFileExplorerPath(path: string, settings: FileExplorerFilterSettings): boolean {
  const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!normalizedPath) return false;
  const pathSegments = normalizedPath.split("/");
  const assetFolder = settings.assetFolder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (settings.hideAssetFolderInFileExplorer && assetFolder) {
    const assetSegments = assetFolder.split("/");
    const assetName = assetSegments[assetSegments.length - 1]!;
    if (pathSegments.includes(assetName)) return true;
  }
  if (!settings.hideConfiguredFilesInFileExplorer) return false;
  if (normalizeHiddenFileExtensions(settings.hiddenFileExtensions)
    .some((extension) => normalizedPath.toLowerCase().endsWith(`.${extension}`))) return true;
  return normalizeHiddenFolderPaths(settings.hiddenFileFolders).some((folder) => {
    if (folder.includes("/")) return normalizedPath === folder || normalizedPath.startsWith(`${folder}/`);
    return pathSegments.includes(folder);
  });
}
