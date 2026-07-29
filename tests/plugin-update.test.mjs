import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import { build } from "esbuild";
import { zipSync, strToU8 } from "fflate";

let updater;
let tempDir;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "mindmap-studio-plugin-update-"));
  const output = path.join(tempDir, "plugin-update.cjs");
  await build({ entryPoints: ["src/utils/plugin-update.ts"], outfile: output, bundle: true, platform: "node", format: "cjs", logLevel: "silent" });
  updater = createRequire(import.meta.url)(output);
});

after(() => rm(tempDir, { recursive: true, force: true }));

test("plugin updater selects only the verified GitHub install link from the Release page", () => {
  assert.equal(updater.comparePluginVersions("1.25.4", "1.25.3") > 0, true);
  assert.equal(updater.comparePluginVersions("v1.25.4", "1.25.4"), 0);
  const pageUrl = "https://github.com/PlanetEditorX/obsidian-mindmap-studio/releases/latest";
  const html = '<a href="/PlanetEditorX/obsidian-mindmap-studio/releases/download/v1.25.4/mindmap-studio-1.25.4-install.zip">download</a>';
  assert.equal(updater.findPluginInstallUrl(html, pageUrl), "https://github.com/PlanetEditorX/obsidian-mindmap-studio/releases/download/v1.25.4/mindmap-studio-1.25.4-install.zip");
  assert.equal(updater.findPluginInstallUrl('<a href="https://example.com/mindmap-studio-1.25.4-install.zip">download</a>', pageUrl), null);
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
