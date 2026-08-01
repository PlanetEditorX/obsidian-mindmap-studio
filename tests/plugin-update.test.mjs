import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import { build } from "esbuild";
import { zipSync, strToU8 } from "fflate";
import { readFile } from "node:fs/promises";

let updater;
let tempDir;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "mindmap-studio-plugin-update-"));
  const output = path.join(tempDir, "plugin-update.cjs");
  await build({ entryPoints: ["src/utils/plugin-update.ts"], outfile: output, bundle: true, platform: "node", format: "cjs", logLevel: "silent" });
  updater = createRequire(import.meta.url)(output);
});

after(() => rm(tempDir, { recursive: true, force: true }));

test("plugin updater compares semantic versions correctly", () => {
  // Equal versions
  assert.equal(updater.comparePluginVersions("1.0.0", "1.0.0"), 0);
  assert.equal(updater.comparePluginVersions("v1.25.4", "1.25.4"), 0);
  assert.equal(updater.comparePluginVersions("1.25.4", "v1.25.4"), 0);
  assert.equal(updater.comparePluginVersions("V1.25.4", "1.25.4"), 0);

  // Missing parts
  assert.equal(updater.comparePluginVersions("1.0", "1.0.0"), 0);
  assert.equal(updater.comparePluginVersions("1", "1.0.0"), 0);

  // Prerelease labels (ignored in this function)
  assert.equal(updater.comparePluginVersions("1.0.0-alpha", "1.0.0"), 0);
  assert.equal(updater.comparePluginVersions("1.0.0-beta.1", "1.0.0"), 0);

  // Greater versions
  assert.equal(updater.comparePluginVersions("2.0.0", "1.0.0") > 0, true);
  assert.equal(updater.comparePluginVersions("1.26.0", "1.25.4") > 0, true);
  assert.equal(updater.comparePluginVersions("1.25.4", "1.25.3") > 0, true);
  assert.equal(updater.comparePluginVersions("1.25.4.1", "1.25.4") > 0, true);
  assert.equal(updater.comparePluginVersions("10.0.0", "2.0.0") > 0, true);

  // Lesser versions
  assert.equal(updater.comparePluginVersions("1.0.0", "2.0.0") < 0, true);
  assert.equal(updater.comparePluginVersions("1.25.3", "1.25.4") < 0, true);
  assert.equal(updater.comparePluginVersions("1.25.4", "1.26.0") < 0, true);
  assert.equal(updater.comparePluginVersions("1.25.4", "1.25.4.1") < 0, true);
  assert.equal(updater.comparePluginVersions("2.0.0", "10.0.0") < 0, true);
});

test("plugin updater accepts only a complete verified update manifest", () => {
  const source = JSON.stringify({
    version: "1.25.4",
    downloadUrl: "https://github.com/PlanetEditorX/obsidian-mindmap-studio/releases/download/v1.25.4/mindmap-studio-1.25.4-install.zip",
    sha256: "a".repeat(64)
  });
  assert.equal(updater.parsePluginUpdateManifest(source).version, "1.25.4");
  assert.throws(() => updater.parsePluginUpdateManifest(JSON.stringify({ version: "1.25.4", downloadUrl: "https://example.com/update.zip", sha256: "a".repeat(64) })), /下载地址无效/);
  assert.throws(() => updater.parsePluginUpdateManifest("{}"), /缺少版本/);
});

test("plugin updater extracts only a complete validated plugin bundle", () => {
  const archive = zipSync({
    "mindmap-studio/main.js": strToU8("module.exports = {};"),
    "mindmap-studio/styles.css": strToU8(".plugin {}"),
    "mindmap-studio/manifest.json": strToU8('{"id":"mindmap-studio","version":"1.25.5"}')
  });
  const extracted = updater.extractPluginReleaseFiles(archive.buffer);
  assert.equal(extracted.manifest.version, "1.25.5");
  assert.equal(new TextDecoder().decode(extracted.main), "module.exports = {};");
  assert.throws(() => updater.extractPluginReleaseFiles(zipSync({ "main.js": strToU8("x") }).buffer), /styles\.css/);
});

test("plugin update requires a full Obsidian restart instead of a browser-only reload", async () => {
  const mainSource = await readFile("src/main.ts", "utf8");
  const start = mainSource.indexOf("async checkForPluginUpdate()");
  const end = mainSource.indexOf("\n  /**", start + 1);
  const updater = mainSource.slice(start, end);
  assert.match(updater, /请完整重启 Obsidian 以启用新版本/);
  assert.doesNotMatch(updater, /window\.location\.reload/);
});
