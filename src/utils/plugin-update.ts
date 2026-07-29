/**
 * @file plugin-update.ts
 * @description GitHub Release 插件更新包的版本、资产和文件校验工具。
 */

import { strFromU8, unzipSync } from "fflate";

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

/** Finds the verified install ZIP link embedded in the latest GitHub Release page. */
export function findPluginInstallUrl(releasePageHtml: string, releasePageUrl: string): string | null {
  const hrefs = releasePageHtml.matchAll(/href=["']([^"']+)["']/gi);
  for (const match of hrefs) {
    try {
      const url = new URL(match[1]!.replace(/&amp;/g, "&"), releasePageUrl);
      const filename = url.pathname.split("/").at(-1) ?? "";
      if (
        url.protocol === "https:"
        && url.hostname === "github.com"
        && url.pathname.startsWith("/PlanetEditorX/obsidian-mindmap-studio/releases/download/")
        && /^mindmap-studio-[\w.-]+-install\.zip$/i.test(filename)
      ) return url.href;
    } catch {
      continue;
    }
  }
  return null;
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
