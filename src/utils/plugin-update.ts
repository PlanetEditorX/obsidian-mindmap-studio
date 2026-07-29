/**
 * @file plugin-update.ts
 * @description GitHub Release 插件更新包的版本、资产和文件校验工具。
 */

import { strFromU8, unzipSync } from "fflate";

/** Minimal GitHub Release asset shape needed to locate the install ZIP. */
export interface PluginReleaseAsset {
  name: string;
  browser_download_url: string;
}

/** Minimal GitHub latest-release response consumed by the updater. */
export interface PluginReleaseInfo {
  tag_name?: string;
  assets?: PluginReleaseAsset[];
}

/** Manifest fields validated before a release can replace the installed plugin. */
export interface PluginReleaseManifest {
  id: string;
  version: string;
}

/** Validated executable, style, and manifest files extracted from an install ZIP. */
export interface PluginReleaseFiles {
  manifest: PluginReleaseManifest;
  main: ArrayBuffer;
  styles: ArrayBuffer;
  manifestText: string;
}

/** Compares two numeric dot-separated versions, ignoring optional prerelease labels. */
export function comparePluginVersions(left: string, right: string): number {
  const parse = (value: string): number[] => value.replace(/^v/i, "").split("-")[0]!.split(".").map((part) => Number(part) || 0);
  const leftParts = parse(left);
  const rightParts = parse(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

/** Finds the install ZIP exposed by a GitHub Release. */
export function findPluginInstallAsset(release: PluginReleaseInfo): PluginReleaseAsset | null {
  return release.assets?.find((asset) => {
    try {
      const url = new URL(asset.browser_download_url);
      return /^mindmap-studio-[\w.-]+-install\.zip$/i.test(asset.name) && url.protocol === "https:" && url.hostname === "github.com";
    } catch {
      return false;
    }
  }) ?? null;
}

/** Extracts the three files that an Obsidian plugin may safely self-update. */
export function extractPluginReleaseFiles(archive: ArrayBuffer): PluginReleaseFiles {
  const entries = unzipSync(new Uint8Array(archive));
  const read = (filename: "main.js" | "styles.css" | "manifest.json"): Uint8Array => {
    const entry = Object.entries(entries).find(([path]) => path.split("/").at(-1) === filename)?.[1];
    if (!entry?.length) throw new Error(`更新包缺少 ${filename}`);
    return entry;
  };
  const main = read("main.js");
  const styles = read("styles.css");
  const manifestBytes = read("manifest.json");
  const manifestText = strFromU8(manifestBytes);
  let manifest: PluginReleaseManifest;
  try {
    manifest = JSON.parse(manifestText) as PluginReleaseManifest;
  } catch {
    throw new Error("更新包中的 manifest.json 无效");
  }
  if (!manifest.id || !manifest.version) throw new Error("更新包中的 manifest.json 缺少插件标识或版本");
  const toArrayBuffer = (value: Uint8Array): ArrayBuffer => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
  return { manifest, main: toArrayBuffer(main), styles: toArrayBuffer(styles), manifestText };
}
