import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let themes;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModule("src/themes.ts");
  themes = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("getMindMapThemePreset finds a known theme preset", () => {
  const preset = themes.getMindMapThemePreset("classic-indigo");
  assert.ok(preset);
  assert.equal(preset.id, "classic-indigo");
  assert.equal(preset.name, "经典靛蓝");
  assert.ok(preset.appearance);
});

test("getMindMapThemePreset returns undefined for an unknown theme preset", () => {
  const preset = themes.getMindMapThemePreset("unknown-theme-id");
  assert.equal(preset, undefined);
});

test("getMindMapThemePreset returns undefined for undefined id", () => {
  const preset = themes.getMindMapThemePreset(undefined);
  assert.equal(preset, undefined);
});

test("appearanceFromThemePreset populates the themePreset property", () => {
  const appearance = themes.appearanceFromThemePreset("classic-indigo");
  assert.equal(appearance.themePreset, "classic-indigo");
  // ensure it copied other properties too
  assert.equal(appearance.edgeStyle, "curved");
});

test("appearanceFromThemePreset clones branchColors array to prevent mutation", () => {
  const appearance = themes.appearanceFromThemePreset("classic-indigo");
  assert.ok(Array.isArray(appearance.branchColors));

  const preset = themes.getMindMapThemePreset("classic-indigo");
  assert.ok(Array.isArray(preset.appearance.branchColors));

  // They should not have the same reference
  assert.notEqual(appearance.branchColors, preset.appearance.branchColors);
  assert.deepEqual(appearance.branchColors, preset.appearance.branchColors);

  // Modifying the returned appearance shouldn't modify the preset
  appearance.branchColors.push("#000000");
  assert.notDeepEqual(appearance.branchColors, preset.appearance.branchColors);
});

test("appearanceFromThemePreset handles missing branchColors", () => {
  const appearance = themes.appearanceFromThemePreset("minimal-ink");
  assert.equal(appearance.themePreset, "minimal-ink");

  const preset = themes.getMindMapThemePreset("minimal-ink");
  if (preset.appearance.branchColors) {
     assert.ok(Array.isArray(appearance.branchColors));
     assert.notEqual(appearance.branchColors, preset.appearance.branchColors);
     assert.deepEqual(appearance.branchColors, preset.appearance.branchColors);
  } else {
     assert.equal(appearance.branchColors, undefined);
  }
});

test("appearanceFromThemePreset falls back to first preset on unknown ID", () => {
  const appearance = themes.appearanceFromThemePreset("unknown-theme-id");
  const fallbackPreset = themes.MINDMAP_THEME_PRESETS[0];

  assert.equal(appearance.themePreset, fallbackPreset.id);
  assert.deepEqual(appearance.branchColors, fallbackPreset.appearance.branchColors);
  assert.notEqual(appearance.branchColors, fallbackPreset.appearance.branchColors);
});
