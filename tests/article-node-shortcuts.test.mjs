import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile("src/editor/editor.ts", "utf8");
const runtime = await readFile("main.js", "utf8");
const body = source.match(/private handleKeydown\(event: KeyboardEvent\): void \{([\s\S]*?)\n  \}\n\}\s*$/)?.[1];
assert.ok(body, "the keyboard handler must be available for behavior testing");
// The handler contains only these TypeScript-only annotations; execute the
// actual shortcut path instead of reimplementing the decision tree in tests.
const handleKeydown = new Function("event", body.replaceAll(" as HTMLElement", "").replaceAll("<HTMLElement>", "").replaceAll("navigation.parentPath!", "navigation.parentPath"));

function setup({ key = "Enter", ctrlKey = true, mode = "article", editing = true, selectedId = "wrong", readOnly = false, type = "inline", repeat = false, isComposing = false, shiftKey = false, altKey = false } = {}) {
  const calls = [];
  const inlineTarget = type === "inline" && editing ? {
    dataset: { mmsProtectInitialFocus: "true" },
    blur() { calls.push("save"); editor.inlineEditingId = null; },
    closest(selector) { return selector === "[data-node-id]" ? { dataset: { nodeId: "node-A" } } : null; }
  } : null;
  const target = {
    closest(selector) {
      if (selector === "[data-mms-inline-editable='true']") return inlineTarget;
      if (selector === "input, textarea, select") return type === "code" ? this : null;
      if (selector === "[contenteditable='true']") return type === "inline" && editing ? inlineTarget : type === "code" ? this : null;
      if (selector === "input, textarea, select, [contenteditable='true']") return editing || type === "code" ? this : null;
      return null;
    }
  };
  const event = {
    target, key, ctrlKey, metaKey: false, shiftKey, altKey, isComposing, repeat,
    preventDefault() { calls.push("prevent"); },
    stopPropagation() { calls.push("stop"); },
    stopImmediatePropagation() { calls.push("immediate"); }
  };
  const editor = {
    currentMode: mode, readOnly, selectedId, inlineEditingId: editing && type === "inline" ? "node-A" : null,
    options: { screenshotRecognizeShortcut: "", screenshotShortcut: "" },
    pendingArticleClickMove: null, activeReadingRestore: null,
    shortcutMatches() { return false; },
    nodeById(id) { return id === "node-A" || id === "wrong" ? { id } : null; },
    selectNode(id) { calls.push(`select:${id}`); this.selectedId = id; },
    addSibling() { calls.push(`sibling:${this.selectedId}`); },
    addChild() { calls.push(`child:${this.selectedId}`); },
    handleReadOnlyKeydown() { calls.push("read-only"); }
  };
  return { calls, event, editor, inlineTarget, run: () => handleKeydown.call(editor, event) };
}

test("Ctrl+Enter commits article text, selects its own node, and inserts a sibling", () => {
  const env = setup();
  env.run();
  assert.deepEqual(env.calls, ["prevent", "stop", "immediate", "save", "select:node-A", "sibling:node-A"]);
  assert.equal(env.inlineTarget.dataset.mmsProtectInitialFocus, undefined);
});

test("Ctrl+Tab commits the article line and inserts a child", () => {
  const env = setup({ key: "Tab" });
  env.run();
  assert.deepEqual(env.calls, ["prevent", "stop", "immediate", "save", "select:node-A", "child:node-A"]);
});

test("both article shortcuts also act on a selected non-editing node", () => {
  for (const [key, action] of [["Enter", "sibling"], ["Tab", "child"]]) {
    const env = setup({ key, editing: false, selectedId: "node-A" });
    env.run();
    assert.deepEqual(env.calls, ["prevent", "stop", "immediate", `select:node-A`, `${action}:node-A`]);
  }
});

test("read-only, IME, repeat and different modes never create article nodes", () => {
  for (const args of [
    { readOnly: true }, { isComposing: true }, { repeat: true },
    { shiftKey: true }, { altKey: true }, { mode: "outline" }, { ctrlKey: false }
  ]) {
    const env = setup(args);
    env.run();
    assert.ok(!env.calls.some((call) => call.startsWith("sibling:") || call.startsWith("child:")), JSON.stringify(args));
    if (args.repeat) assert.ok(env.calls.includes("prevent"));
  }
});

test("article code editor retains its own Ctrl+Enter save behavior", () => {
  const env = setup({ type: "code", editing: false });
  env.run();
  assert.deepEqual(env.calls, []);
});

test("article input and shortcut wiring precede editable guard, while normal Enter remains unchanged", () => {
  const handler = source.match(/private handleKeydown\(event: KeyboardEvent\): void \{([\s\S]*?)\n  \}\n\}\s*$/)?.[1] ?? "";
  assert.ok(handler.indexOf('this.currentMode === "article" && !this.readOnly && mod') < handler.indexOf("if (this.inlineEditingId !== null) return;"));
  assert.match(handler, /event\.key === "Enter"\) this\.addSibling\(\);\s*else this\.addChild\(\);/);
  const plain = setup({ ctrlKey: false });
  plain.run();
  assert.deepEqual(plain.calls, []);
  assert.match(source, /if \(event\.key === "Enter" && !event\.shiftKey && !event\.isComposing\)/);
});

test("the distributable main.js includes the same article shortcut and save-before-create path", () => {
  const start = runtime.indexOf('handleKeydown(event) {');
  assert.ok(start >= 0);
  const handler = runtime.slice(start, start + 12500);
  assert.match(handler, /this\.currentMode === "article" && !this\.readOnly && mod/);
  assert.match(handler, /delete inlineTarget\.dataset\.mmsProtectInitialFocus;\s*inlineTarget\.blur\(\);/);
  assert.match(handler, /if \(event\.key === "Enter"\) this\.addSibling\(\);\s*else this\.addChild\(\);/);
});
