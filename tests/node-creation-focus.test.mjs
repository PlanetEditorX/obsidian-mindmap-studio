import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { readFile } from "node:fs/promises";

let editorSource;
let cleanup;

before(async () => {
  editorSource = await readFile("src/editor/editor.ts", "utf8");
});

after(() => cleanup?.());

test("node creation flows bring the new node into view before inline editing", () => {
  // Child/sibling creation now shares a focus helper that retries after the
  // article's paginated DOM renders. Text-block insertion keeps its own frame.
  const addChild = editorSource.match(/private addChild\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const addSibling = editorSource.match(/private addSibling\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const insertText = editorSource.match(/private insertTextBlock\([^\n]*\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  const focus = editorSource.match(/private focusCreatedStructureNode\(nodeId: string\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(addChild, /this\.focusCreatedStructureNode\(node\.id\)/);
  assert.match(addSibling, /this\.focusCreatedStructureNode\(node\.id\)/);
  assert.match(focus, /this\.bringNodeIntoView\(nodeId\);\s*this\.beginInlineEdit\(nodeId, undefined, true\)/);
  assert.match(focus, /controller\.ensureNode\(nodeId\)/);
  assert.match(focus, /window\.setTimeout\(run, 90\)/);
  assert.match(insertText, /this\.bringNodeIntoView\(selected\.id\);\s*this\.beginInlineEdit\(selected\.id, blockId, true\)/);
  assert.match(editorSource, /private bringNodeIntoView\(nodeId: string\): void \{/);
  assert.match(editorSource, /if \(!dx && !dy\) return;/, "viewport must stay still when the node is already visible");
  assert.match(editorSource, /no forced recentering/);
});

test("inline editors survive the stale creating key press", () => {
  assert.match(editorSource, /protectInitialFocus \? 220 : 50/, "creation flows need a guard window longer than a slow key release");
  const blurGuard = editorSource.match(/if \(initialFocusProtected\) \{[\s\S]{0,400}?if \(!related\) \{\s*\n\s*window\.requestAnimationFrame\(focusAtEnd\);/);
  assert.ok(blurGuard, "programmatic blurs are pulled back while user clicks end editing normally");
  assert.match(editorSource, /A stale keyup from the creating Enter\/Tab press/);
});

test("Enter/Escape commit restores DOM focus to the mind-map editor root", () => {
  // handleKeydown is bound to rootEl (capture). When an inline edit commits via
  // blur with no relatedTarget, focus falls back to <body> and every following
  // Enter/Tab is lost (Enter no-op, Tab runs native tab navigation). The commit
  // path must refocus rootEl so global mind-map shortcuts resume.
  assert.match(editorSource, /if \(this\.currentMode === "mindmap" && !related\) \{/);
  assert.match(editorSource, /handleKeydown is bound to rootEl \(capture\)/);
  assert.match(editorSource, /this\.rootEl\.focus\(\{ preventScroll: true \}\)/);
});
