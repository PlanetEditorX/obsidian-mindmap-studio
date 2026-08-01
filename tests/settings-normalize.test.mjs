import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let settingsModule;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModule("src/settings.ts");
  settingsModule = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("normalizeReturnToTopVisibility handles valid numbers", () => {
  assert.equal(settingsModule.normalizeReturnToTopVisibility(50), 50);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(0), 0);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(100), 100);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(33.3), 33.3);
});

test("normalizeReturnToTopVisibility clamps out-of-bounds numbers", () => {
  assert.equal(settingsModule.normalizeReturnToTopVisibility(-10), 0);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(-0.1), 0);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(150), 100);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(100.1), 100);
});

test("normalizeReturnToTopVisibility parses valid strings", () => {
  assert.equal(settingsModule.normalizeReturnToTopVisibility("25"), 25);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("75%"), 75);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("  30  "), 30);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(" 40% "), 40);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("0"), 0);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("100"), 100);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("50.5"), 50.5);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("50.5%"), 50.5);
});

test("normalizeReturnToTopVisibility clamps parsed strings", () => {
  assert.equal(settingsModule.normalizeReturnToTopVisibility("-5"), 0);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("105"), 100);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("-10%"), 0);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("200%"), 100);
});

test("normalizeReturnToTopVisibility returns default for invalid inputs", () => {
  const DEFAULT = settingsModule.DEFAULT_SETTINGS.returnToTopVisibility;

  // Invalid numbers
  assert.equal(settingsModule.normalizeReturnToTopVisibility(Number.NaN), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(Number.POSITIVE_INFINITY), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(Number.NEGATIVE_INFINITY), DEFAULT);

  // Non-string/number types
  assert.equal(settingsModule.normalizeReturnToTopVisibility(null), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(undefined), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility({}), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility([]), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(true), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility(false), DEFAULT);

  // Invalid strings
  assert.equal(settingsModule.normalizeReturnToTopVisibility(""), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("   "), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("abc"), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("abc%"), DEFAULT);
  assert.equal(settingsModule.normalizeReturnToTopVisibility("%%"), DEFAULT);
});
