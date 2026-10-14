import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// The article shortcuts were moved out of handleKeydown into a shared entry
// used by both window-capture and Obsidian's command dispatcher. Exercise the
// distributable methods instead of invoking handleKeydown on a partial mock
// that does not contain the delegated method.
const source = await readFile("src/editor/editor.ts", "utf8");
const runtime = await readFile("main.js", "utf8");

function compiledMethod(name) {
  const match = runtime.match(new RegExp(`(?:^|\\n)  ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n  \\}`));
  assert.ok(match, `built plugin must contain ${name}`);
  return match[0].trim();
}

class FakeHTMLElement {
  constructor(type = "root") {
    this.type = type;
    this.dataset = {};
    this.contentEditable = type === "inline" ? "true" : "false";
    this.nodeId = "node-A";
  }
  closest(selector) {
    if (selector.includes("input, textarea, select")) return this.type === "code" || this.type === "input" ? this : null;
    if (selector.includes(":not(")) return this.type === "code" ? this : null;
    if (selector.includes("data-mms-inline-editable")) return this.type === "inline" ? this : null;
    if (selector.includes("data-node-id")) return { dataset: { nodeId: this.nodeId } };
    return null;
  }
}

// Include canRunArticleStructureShortcut when compiling from the newer TypeScript
// baseline. The patched 1.55.2 binary uses the equivalent checks inline.
const methods = ["canRunArticleStructureShortcut", "createArticleNodeFromShortcut", "handleArticleStructureShortcut", "focusCreatedStructureNode", "handleKeydown"]
  .filter((name) => new RegExp(`(?:^|\\n)  ${name}\\(`).test(runtime))
  .map(compiledMethod).join("\n");
const context = {
  HTMLElement: FakeHTMLElement,
  document: { activeElement: null },
  CSS: { escape: (value) => value },
  window: { requestAnimationFrame: (fn) => fn(), setTimeout: (fn) => fn() }
};
const RuntimeEditor = new Function(...Object.keys(context), `return class RuntimeEditor { ${methods} };`)(...Object.values(context));

function setup({ key = "Enter", ctrlKey = true, metaKey = false, modifierHeld = false, mode = "article", editing = true,
  selectedId = "wrong", readOnly = false, type = "inline", repeat = false, isComposing = false,
  shiftKey = false, altKey = false } = {}) {
  const calls = [];
  const editor = new RuntimeEditor();
  const inlineTarget = new FakeHTMLElement("inline");
  inlineTarget.dataset.mmsProtectInitialFocus = "true";
  inlineTarget.blur = () => { calls.push("save"); editor.inlineEditingId = null; };
  const target = type === "inline" && editing ? inlineTarget : new FakeHTMLElement(type === "inline" ? "root" : type);
  const event = {
    target, key, code: key, ctrlKey, metaKey, shiftKey, altKey, isComposing, repeat,
    preventDefault() { calls.push("prevent"); },
    stopPropagation() { calls.push("stop"); },
    stopImmediatePropagation() { calls.push("immediate"); }
  };
  editor.currentMode = mode;
  editor.readOnly = readOnly;
  editor.selectedId = selectedId;
  editor.inlineEditingId = editing && type === "inline" ? "node-A" : null;
  editor.options = { screenshotShortcut: "", screenshotRecognizeShortcut: "" };
  editor.pendingArticleClickMove = null;
  editor.activeReadingRestore = null;
  editor.rootEl = {
    contains: (element) => element instanceof FakeHTMLElement,
    querySelector: () => editing && type === "inline" ? inlineTarget : null
  };
  editor.ensureEditable = () => !readOnly;
  editor.callbacks = { onDebugLog() {} };
  editor.shortcutMatches = () => false;
  editor.nodeById = (id) => ["node-A", "wrong"].includes(id) ? { id } : null;
  editor.selectNode = (id) => { calls.push(`select:${id}`); editor.selectedId = id; };
  editor.addSibling = () => calls.push(`sibling:${editor.selectedId}`);
  editor.addChild = () => calls.push(`child:${editor.selectedId}`);
  editor.handleReadOnlyKeydown = () => calls.push("read-only");
  context.document.activeElement = target;
  return { calls, event, editor, inlineTarget, run: () => editor.handleArticleStructureShortcut(event, modifierHeld) };
}

test("Ctrl+Enter commits article text, selects its own node, and inserts a sibling", () => {
  const env = setup();
  assert.equal(env.run(), true);
  assert.deepEqual(env.calls, ["prevent", "stop", "immediate", "save", "select:node-A", "sibling:node-A"]);
  assert.equal(env.inlineTarget.dataset.mmsProtectInitialFocus, undefined);
});

test("Ctrl+Tab commits the article line and inserts a child", () => {
  const env = setup({ key: "Tab" });
  assert.equal(env.run(), true);
  assert.deepEqual(env.calls, ["prevent", "stop", "immediate", "save", "select:node-A", "child:node-A"]);
});

test("both article shortcuts also act on a selected non-editing node", () => {
  for (const [key, action] of [["Enter", "sibling"], ["Tab", "child"]]) {
    const env = setup({ key, editing: false, selectedId: "node-A" });
    assert.equal(env.run(), true);
    assert.deepEqual(env.calls, ["prevent", "stop", "immediate", "select:node-A", `${action}:node-A`]);
  }
});

test("read-only, IME, repeat and different modes never create article nodes", () => {
  for (const args of [
    { readOnly: true }, { isComposing: true }, { repeat: true }, { shiftKey: true },
    { altKey: true }, { mode: "outline" }, { ctrlKey: false }
  ]) {
    const env = setup(args);
    env.run();
    assert.ok(!env.calls.some((call) => call.startsWith("sibling:") || call.startsWith("child:")), JSON.stringify(args));
    if (args.repeat) assert.ok(env.calls.includes("prevent"));
  }
});

test("article code editor retains its own Ctrl+Enter save behavior", () => {
  const env = setup({ type: "code", editing: false });
  assert.equal(env.run(), false);
  assert.deepEqual(env.calls, []);
});

test("article input and shared shortcut wiring precede editable guard, while normal Enter remains unchanged", () => {
  const handler = source.match(/private handleKeydown\(event: KeyboardEvent\): void \{([\s\S]*?)\n  \}\n\}\s*$/)?.[1] ?? "";
  assert.ok(handler.includes("this.handleArticleStructureShortcut(event)"));
  assert.ok(handler.indexOf("this.handleArticleStructureShortcut(event)") < handler.indexOf("if (this.inlineEditingId !== null) return;"));
  assert.match(source, /handleArticleStructureShortcut\(event: KeyboardEvent, modifierHeld = false\): boolean/);
  assert.match(source, /return this\.createArticleNodeFromShortcut\(kind, event\.target\)/);
  assert.match(source, /if \(kind === "sibling"\) this\.addSibling\(\);\s*else this\.addChild\(\);/);
  const plain = setup({ ctrlKey: false });
  assert.equal(plain.run(), false);
  assert.deepEqual(plain.calls, []);
  assert.match(source, /if \(event\.key === "Enter" && !event\.shiftKey && !event\.isComposing\)/);
});


test("window-capture modifier fallback works even if key event omits Ctrl state", () => {
  const env = setup({ ctrlKey: false, modifierHeld: true });
  assert.equal(env.run(), true);
  assert.deepEqual(env.calls, ["prevent", "stop", "immediate", "save", "select:node-A", "sibling:node-A"]);
});

test("created article nodes wait for the paginated DOM before inline focus", () => {
  const env = setup({ selectedId: "node-A", editing: false });
  let queries = 0;
  let edits = 0;
  env.editor.articleRenderController = { containsNode: () => true };
  env.editor.articleEl = { querySelector: () => (++queries >= 3 ? {} : null) };
  env.editor.bringNodeIntoView = () => env.calls.push("visible");
  env.editor.beginInlineEdit = (id, blockId, protect) => {
    assert.equal(id, "node-A");
    assert.equal(protect, true);
    edits++;
  };
  env.editor.focusCreatedStructureNode("node-A");
  assert.equal(queries, 3);
  assert.equal(edits, 1);
  assert.deepEqual(env.calls, ["visible"]);
});

test("the distributable main.js routes shortcuts through save-before-create", () => {
  const handler = compiledMethod("handleKeydown");
  const shortcut = compiledMethod("handleArticleStructureShortcut");
  const insertion = compiledMethod("createArticleNodeFromShortcut");
  assert.match(handler, /this\.handleArticleStructureShortcut\(event\)/);
  assert.match(shortcut, /event\.preventDefault\(\)/);
  assert.match(insertion, /delete inlineEditor\.dataset\.mmsProtectInitialFocus;\s*inlineEditor\.blur\(\);/);
  assert.match(insertion, /this\.addSibling\(\)/);
  assert.match(insertion, /this\.addChild\(\)/);
});

test("window-capture and Obsidian commands share the article structure entry", async () => {
  const main = await readFile("src/main.ts", "utf8");
  assert.match(main, /this\.registerDomEvent\(window, "keydown"/);
  assert.match(main, /view\.handleArticleStructureShortcut\(event, ctrlHeld \|\| metaHeld\)/);
  assert.match(main, /id: "article-create-sibling"/);
  assert.match(main, /id: "article-create-child"/);
});

// ---------------------------------------------------------------------------
// Real addChild/addSibling from the distributable plugin. Article mode renders
// with a reading-location restore that re-selects the pre-mutation node, which
// used to steal focus from the node the user just created. The creation must
// skip that stale restore and hand the new node to the render as its anchor.
// ---------------------------------------------------------------------------

const structureMethods = ["markStructureFocusTarget", "addChild", "addSibling", "focusCreatedStructureNode"]
  .filter((name) => new RegExp(`(?:^|\\n)  ${name}\\(`).test(runtime))
  .map(compiledMethod).join("\n");

function structureRuntime() {
  const context = {
    HTMLElement: FakeHTMLElement,
    document: { activeElement: null },
    CSS: { escape: (value) => value },
    window: { requestAnimationFrame: (fn) => fn(), setTimeout: (fn) => fn() },
    appendChild: (parent, node) => { parent.children.push(node); },
    insertSiblingAfter: (root, selectedId, node) => {
      root.children.splice(root.children.findIndex((child) => child.id === selectedId) + 1, 0, node);
    }
  };
  return new Function(...Object.keys(context), `return class StructureEditor { ${structureMethods} };`)(...Object.values(context));
}

const StructureEditor = structureRuntime();

function setupStructure({ mode = "article", selectedId = "source" } = {}) {
  const calls = [];
  const editor = new StructureEditor();
  editor.currentMode = mode;
  editor.selectedId = selectedId;
  editor.pendingStructureFocusNodeId = null;
  editor.callbacks = { onDebugLog() {} };
  editor.document = {
    root: { id: "root", children: [{ id: "source", children: [] }] }
  };
  editor.ensureEditable = () => true;
  editor.selectedNode = () => editor.document.root.children.find((child) => child.id === selectedId);
  editor.parentNodeById = () => editor.document.root;
  editor.createConfiguredNode = () => ({ id: "new-node", children: [] });
  editor.currentNodeTreeIndex = () => ({});
  editor.nodeById = (id) => ["root", "source", "new-node"].includes(id) ? { id, children: [] } : null;
  // Models the article render: it anchors the viewport on the pending structure
  // target and keeps that node selected; without that target it restores the
  // pre-mutation reading location and overwrites the selection.
  editor.mutate = (action, restoreLocation) => {
    calls.push({ restoreLocation });
    action();
    const focusTarget = editor.pendingStructureFocusNodeId;
    editor.pendingStructureFocusNodeId = null;
    if (focusTarget) editor.selectedId = focusTarget;
    else if (restoreLocation !== null) editor.selectedId = "source";
  };
  editor.articleRenderController = { containsNode: () => true };
  editor.articleEl = { querySelector: () => ({}) };
  editor.bringNodeIntoView = (id) => calls.push(`visible:${id}`);
  editor.beginInlineEdit = (id, blockId, protect) => calls.push(`edit:${id}:${protect}`);
  return { calls, editor };
}

test("article Ctrl+Tab node creation hands the new node to the render and keeps inline focus", () => {
  const { calls, editor } = setupStructure();
  editor.addChild();
  assert.equal(editor.document.root.children[0].children.map((child) => child.id).join(","), "new-node",
    "the child must be appended under the selected node");
  assert.deepEqual(calls[0], { restoreLocation: null }, "creation must skip the stale reading restore");
  assert.deepEqual(calls.slice(1), ["visible:new-node", "edit:new-node:true"],
    "the new child must stay selected, be brought into view and enter inline editing");
});

test("article Ctrl+Enter node creation hands the new sibling to the render and keeps inline focus", () => {
  const { calls, editor } = setupStructure();
  editor.addSibling();
  assert.equal(editor.document.root.children.map((child) => child.id).join(","), "source,new-node");
  assert.deepEqual(calls[0], { restoreLocation: null }, "creation must skip the stale reading restore");
  assert.deepEqual(calls.slice(1), ["visible:new-node", "edit:new-node:true"],
    "the new sibling must stay selected, be brought into view and enter inline editing");
});

test("the article render anchors on the pending structure focus instead of the stale location", () => {
  const renderWindow = source.match(/const renderWindow = \(\): void => \{([\s\S]*?)\n    \};/)?.[1] ?? "";
  assert.ok(renderWindow, "source must define the article renderWindow closure");
  assert.match(renderWindow, /const structureFocusNodeId = this\.pendingStructureFocusNodeId;\s*\n\s*this\.pendingStructureFocusNodeId = null;/);
  assert.match(renderWindow, /const location = structureFocusLocation\s*\n\s*\?\? latestRequestedLocation/);
  assert.match(renderWindow, /structureFocusNodeId[\s\S]*?createReadingLocation\(/);
  assert.match(renderWindow, /this\.restoreReadingLocation\("article", location\)/);
});

