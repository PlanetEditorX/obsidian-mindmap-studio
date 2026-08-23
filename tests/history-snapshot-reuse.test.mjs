import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let historyModule;
let cleanup;
let editorSource;
let mainBundle;

before(async () => {
  const result = await loadTypeScriptModule("src/editor/history-manager.ts");
  historyModule = result.module;
  cleanup = result.cleanup;
  [editorSource, mainBundle] = await Promise.all([
    readFile("src/editor/editor.ts", "utf8"),
    readFile("main.js", "utf8")
  ]);
});

after(async () => {
  if (cleanup) await cleanup();
});

function document(title) {
  return {
    title,
    layout: "right",
    root: { id: "root", text: title, children: [] }
  };
}

test("serialized history snapshots round-trip without reserializing the supplied state", () => {
  const { DocumentHistory } = historyModule;
  const history = new DocumentHistory(() => 10);
  const first = document("first");
  const second = document("second");
  const firstSnapshot = history.createSnapshot(first);
  const secondSnapshot = history.createSnapshot(second);

  history.captureSnapshot(firstSnapshot);
  const undoSnapshot = history.undoSnapshot(secondSnapshot);
  assert.equal(undoSnapshot, firstSnapshot);
  assert.equal(history.restoreSnapshot(undoSnapshot).title, "first");

  const redoSnapshot = history.redoSnapshot(firstSnapshot);
  assert.equal(redoSnapshot, secondSnapshot);
  assert.equal(history.restoreSnapshot(redoSnapshot).title, "second");
});

test("legacy document history API preserves existing undo and redo behavior", () => {
  const { DocumentHistory } = historyModule;
  const history = new DocumentHistory(() => 10);
  const first = document("first");
  const second = document("second");

  history.capture(first);
  assert.equal(history.undo(second)?.title, "first");
  assert.equal(history.redo(first)?.title, "second");
  history.reset();
  assert.equal(history.undo(second), null);
});

test("editor reuses the previous published JSON as the next undo snapshot", () => {
  assert.match(editorSource, /private documentSnapshotJson: string \| null = null;/);
  assert.match(editorSource, /private currentDocumentSnapshotJson\(\): string \{[\s\S]*this\.history\.createSnapshot\(this\.document\)/);
  assert.match(editorSource, /private captureHistorySnapshot\(\): void \{[\s\S]*this\.history\.captureSnapshot\(this\.currentDocumentSnapshotJson\(\)\)[\s\S]*this\.invalidateDocumentSnapshotJson\(\)/);
  assert.match(editorSource, /private notifyDocumentChange\([\s\S]*this\.createDetachedDocumentSnapshot\(true\)/);
  assert.doesNotMatch(editorSource, /this\.history\.capture\(this\.document\)/, "regular editor mutations must not stringify the same pre-change tree again");
  assert.match(editorSource, /const previousSnapshot = this\.currentDocumentSnapshotJson\(\);[\s\S]*uploadCurrentNodeImage/);
  assert.match(editorSource, /const historySnapshot = this\.currentDocumentSnapshotJson\(\);[\s\S]*moveNodeRelative/);
});

test("unnotified viewport and navigation writes invalidate the serialized snapshot cache", () => {
  assert.match(editorSource, /applyRecoveredNavigation\([\s\S]*this\.document\.navigation = \{ \.\.\.navigation \};[\s\S]*this\.invalidateDocumentSnapshotJson\(\)/);
  assert.match(editorSource, /private persistMindMapViewportState\(\): void \{[\s\S]*this\.document\.view = \{[\s\S]*zoom: this\.zoom,[\s\S]*panX: this\.panX,[\s\S]*panY: this\.panY[\s\S]*this\.invalidateDocumentSnapshotJson\(\)/);
  assert.match(editorSource, /private persistReadOnlyState\(\): void \{[\s\S]*this\.invalidateDocumentSnapshotJson\(\)/);
});


test("installed bundle carries serialized history snapshot reuse", () => {
  assert.match(mainBundle, /captureSnapshot\(snapshot\) \{[\s\S]*this\.undoStack\.push\(snapshot\)/);
  assert.match(mainBundle, /currentDocumentSnapshotJson\(\) \{[\s\S]*this\.history\.createSnapshot\(this\.document\)/);
  assert.match(mainBundle, /captureHistorySnapshot\(\) \{[\s\S]*this\.history\.captureSnapshot\(this\.currentDocumentSnapshotJson\(\)\)/);
  assert.match(mainBundle, /notifyDocumentChange\(articleContextImpact = "structure"\) \{[\s\S]*createDetachedDocumentSnapshot\(true\)/);
  assert.doesNotMatch(mainBundle, /this\.history\.capture\(this\.document\)/);
  assert.match(mainBundle, /const historySnapshot = this\.currentDocumentSnapshotJson\(\);[\s\S]*this\.history\.captureSnapshot\(historySnapshot\)/);
});
