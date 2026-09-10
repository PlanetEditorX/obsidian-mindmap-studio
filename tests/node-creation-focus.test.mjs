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
  const flows = editorSource.match(/window\.requestAnimationFrame\(\(\) => \{\s*\n\s*this\.bringNodeIntoView\([^)]*\);\s*\n\s*this\.beginInlineEdit\([^)]*\);\s*\n\s*\}\);/g) ?? [];
  assert.equal(flows.length, 3, "addChild, addSibling and insertTextBlock must all keep the created node visible");
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
