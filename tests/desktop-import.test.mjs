import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadTypeScriptModules } from "./compile-typescript.mjs";

let desktopImport;
let cleanup;
let previousRequire;

before(async () => {
  previousRequire = globalThis.require;
  globalThis.require = createRequire(import.meta.url);
  ({ module: desktopImport, cleanup } = await loadTypeScriptModules(
    ["src/core/node-tree.ts", "src/core/model.ts", "src/utils/desktop-import.ts"],
    "src/utils/desktop-import.ts"
  ));
});

after(async () => {
  if (previousRequire === undefined) delete globalThis.require;
  else globalThis.require = previousRequire;
  await cleanup?.();
});

test("desktop Markdown image candidates support notes stored inside their assets folder", () => {
  assert.deepEqual(
    desktopImport.desktopMarkdownImageRelativeCandidates("assets/公文/08147568898c75f1.png"),
    ["assets/公文/08147568898c75f1.png", "公文/08147568898c75f1.png", "08147568898c75f1.png"]
  );
});

test("desktop Markdown image reading falls back to the source note directory filename", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mindmap-studio-desktop-import-"));
  try {
    const sourceDirectory = path.join(root, "【1】常识", "assets", "公文");
    await mkdir(sourceDirectory, { recursive: true });
    const imagePath = path.join(sourceDirectory, "08147568898c75f1.png");
    const expected = new Uint8Array([137, 80, 78, 71]);
    await writeFile(imagePath, expected);

    const image = await desktopImport.readDesktopMarkdownImage(
      sourceDirectory,
      "assets/公文/08147568898c75f1.png"
    );

    assert.equal(image?.path, imagePath);
    assert.equal(image?.name, "08147568898c75f1.png");
    assert.deepEqual(Array.from(image?.content ?? []), Array.from(expected));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("desktop Markdown image copying rewrites the authoritative node content and compatibility mirror", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "mindmap-studio-desktop-rewrite-"));
  try {
    const sourceDirectory = path.join(root, "【1】常识", "assets", "公文");
    await mkdir(sourceDirectory, { recursive: true });
    const imageName = "08147568898c75f1.png";
    await writeFile(path.join(sourceDirectory, imageName), new Uint8Array([137, 80, 78, 71]));
    const document = {
      version: 10,
      title: "公文",
      layout: "right",
      theme: "auto",
      root: {
        id: "root",
        text: "公文",
        image: `assets/公文/${imageName}`,
        content: [{ id: "image-block", type: "image", source: `assets/公文/${imageName}` }],
        children: []
      }
    };
    const targetPath = "MindMap Assets/公文的构成要素及格式规范-20260731-162538.png";

    const result = await desktopImport.copyDesktopMarkdownImagesToDocument(
      document,
      sourceDirectory,
      async () => targetPath
    );

    assert.deepEqual(result, { copied: 1, rewritten: 1 });
    assert.equal(document.root.content[0].source, targetPath);
    assert.equal(document.root.content[0].localSource, targetPath);
    assert.equal(document.root.image, targetPath);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

