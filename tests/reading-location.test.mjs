import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let readingLocation;
let cleanup;

const node = (id, children = []) => ({ id, text: id, children });
const document = (root, navigation) => ({
  version: 10,
  title: root.id,
  layout: "right",
  theme: "auto",
  navigation,
  root
});

before(async () => {
  const loaded = await loadTypeScriptModule("src/article/reading-location.ts");
  readingLocation = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("nodeFallbackIds orders the target before every ancestor", () => {
  const doc = document(node("root", [node("chapter", [node("section", [node("target")])])]));
  assert.deepEqual(readingLocation.nodeFallbackIds(doc, "target"), ["target", "section", "chapter", "root"]);
});

test("createReadingLocation records cross-file parent fallbacks", () => {
  const parent = document(node("book", [node("chapter-link", [node("parent-note")])]));
  const child = document(node("chapter-root", [node("section", [node("target")])]), {
    parentPath: "book.mindmap",
    parentNodeId: "chapter-link"
  });
  const location = readingLocation.createReadingLocation([
    { filePath: "book.mindmap", document: parent, baseDepth: 0 },
    { filePath: "chapter.mindmap", document: child, baseDepth: 1, parentFilePath: "book.mindmap", parentNodeId: "chapter-link" }
  ], "chapter.mindmap", "target", 0.4, 0.35);
  assert.deepEqual(location.nodeIds, ["target", "section", "chapter-root"]);
  assert.deepEqual(location.fallbacks, [{ filePath: "book.mindmap", nodeIds: ["chapter-link", "book"] }]);
});

test("resolveReadingLocation falls back to the nearest surviving ancestor", () => {
  const current = document(node("root", [node("chapter", [node("section")])]));
  const location = {
    filePath: "book.mindmap",
    nodeIds: ["deleted-target", "section", "chapter", "root"],
    fallbacks: [],
    nodeRatio: 0.6,
    viewportRatio: 0.35
  };
  assert.deepEqual(readingLocation.resolveReadingLocation(location, [
    { filePath: "book.mindmap", document: current, baseDepth: 0 }
  ]), {
    filePath: "book.mindmap",
    nodeId: "section",
    nodeRatio: 0.6,
    viewportRatio: 0.35
  });
});

test("resolveReadingLocation falls back to the parent map when a child file disappears", () => {
  const parent = document(node("book", [node("chapter-link") ]));
  const location = {
    filePath: "missing-child.mindmap",
    nodeIds: ["target", "child-root"],
    fallbacks: [{ filePath: "book.mindmap", nodeIds: ["chapter-link", "book"] }],
    nodeRatio: 0.2,
    viewportRatio: 0.35
  };
  assert.equal(readingLocation.resolveReadingLocation(location, [
    { filePath: "book.mindmap", document: parent, baseDepth: 0 }
  ]).nodeId, "chapter-link");
});

test("normalizeReadingLocation rejects malformed records and clamps ratios", () => {
  assert.equal(readingLocation.normalizeReadingLocation({ filePath: "", nodeIds: [] }), null);
  assert.deepEqual(readingLocation.normalizeReadingLocation({
    filePath: " book.mindmap ",
    nodeIds: [" target ", "target", ""],
    fallbacks: [{ filePath: "parent.mindmap", nodeIds: ["parent"] }, { filePath: "", nodeIds: [] }],
    nodeRatio: 3,
    viewportRatio: -1
  }), {
    filePath: "book.mindmap",
    nodeIds: ["target"],
    fallbacks: [{ filePath: "parent.mindmap", nodeIds: ["parent"] }],
    nodeRatio: 1,
    viewportRatio: 0
  });
});

test("renameReadingLocationPath migrates the primary and parent fallback paths", () => {
  const original = {
    filePath: "child.mindmap",
    nodeIds: ["target", "root"],
    fallbacks: [{ filePath: "book.mindmap", nodeIds: ["chapter", "book-root"] }],
    nodeRatio: 0.3,
    viewportRatio: 0.35
  };
  assert.deepEqual(readingLocation.renameReadingLocationPath(original, "child.mindmap", "renamed.mindmap"), {
    ...original,
    filePath: "renamed.mindmap"
  });
  assert.deepEqual(readingLocation.renameReadingLocationPath(original, "book.mindmap", "library.mindmap"), {
    ...original,
    fallbacks: [{ filePath: "library.mindmap", nodeIds: ["chapter", "book-root"] }]
  });
});

test("viewportAnchorRatio preserves the clicked node's current visual position", () => {
  assert.equal(readingLocation.viewportAnchorRatio(420, 80, 100, 800, 0.5, 0.35), 0.45);
  assert.equal(readingLocation.viewportAnchorRatio(-200, 100, 100, 800, 0.5, 0.35), 0);
  assert.equal(readingLocation.viewportAnchorRatio(1000, 100, 100, 800, 0.5, 0.35), 1);
  assert.equal(readingLocation.viewportAnchorRatio(0, 0, 0, 0, 0.5, 0.35), 0.35);
});


test("explicit current-file targets outrank stale skeleton and persisted locations", () => {
  const explicit = { filePath: "parent.mindmap", nodeIds: ["parent-node"], fallbacks: [], nodeRatio: 0, viewportRatio: 0.35 };
  const skeleton = { filePath: "child.mindmap", nodeIds: ["child-root"], fallbacks: [], nodeRatio: 0, viewportRatio: 0.35 };
  const persisted = { filePath: "child.mindmap", nodeIds: ["old-section"], fallbacks: [], nodeRatio: 0.4, viewportRatio: 0.35 };
  assert.equal(readingLocation.chooseArticleRefreshLocation(explicit, skeleton, persisted), explicit);
  assert.equal(readingLocation.chooseArticleRefreshLocation(null, skeleton, persisted), skeleton);
  assert.equal(readingLocation.chooseArticleRefreshLocation(null, null, persisted), persisted);
});

test("the chapter that started an entry transition outranks a later generic restore", () => {
  const clicked = { filePath: "chapter.mindmap", nodeIds: ["clicked-section"], fallbacks: [], nodeRatio: 0, viewportRatio: 0.35 };
  const staleRoot = { filePath: "chapter.mindmap", nodeIds: ["document-root"], fallbacks: [], nodeRatio: 0, viewportRatio: 0.35 };
  assert.equal(readingLocation.chooseArticleTransitionLocation(clicked, staleRoot), clicked);
  assert.equal(readingLocation.chooseArticleTransitionLocation(null, staleRoot), staleRoot);
});
