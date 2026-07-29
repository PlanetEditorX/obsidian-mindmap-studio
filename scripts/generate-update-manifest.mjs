import { writeFile } from "node:fs/promises";

const [version, sha256] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) throw new Error("Expected a semantic version");
if (!/^[a-f0-9]{64}$/i.test(sha256 ?? "")) throw new Error("Expected a SHA-256 checksum");

const manifest = {
  version,
  downloadUrl: `https://github.com/PlanetEditorX/obsidian-mindmap-studio/releases/download/v${version}/mindmap-studio-${version}-install.zip`,
  sha256: sha256.toLowerCase()
};
await writeFile("update.json", `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Generated update.json for v${version}`);
