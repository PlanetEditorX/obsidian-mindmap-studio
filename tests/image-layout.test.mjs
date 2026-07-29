import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let modelSource;
let editorSource;
let outlineSource;
let articleSource;

before(async () => {
  [modelSource, editorSource, outlineSource, articleSource] = await Promise.all([
    readFile("src/core/model.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/outline-renderer.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8")
  ]);
});

test("image alignment persists only for supported values", () => {
  assert.match(modelSource, /align\?: "left" \| "center" \| "right"/);
  assert.match(modelSource, /const align = image\.align === "left" \|\| image\.align === "center" \|\| image\.align === "right"[\s\S]*: undefined/);
  assert.match(modelSource, /return \{ id, type: "image", source, alt, align, width, height/);
});

test("image context menu exposes layout, sizing, upload and edit actions", () => {
  assert.match(editorSource, /setTitle\("左对齐"\)[\s\S]*setImageBlockAlignment/);
  assert.match(editorSource, /setTitle\("中尺寸（360px）"\)[\s\S]*setImageBlockWidth/);
  assert.match(editorSource, /setTitle\("上传到图床"\)[\s\S]*uploadImageBlock/);
  assert.match(editorSource, /setTitle\("自定义尺寸或替换图片…"\)[\s\S]*editImageBlock\(blockId\)/);
  assert.match(editorSource, /setTitle\("删除图片"\)[\s\S]*removeImageBlock/);
  assert.match(editorSource, /wrap\.addClass\(`image-align-\$\{block\.align \?\? "center"\}`\)/);
  assert.match(outlineSource, /image-align-\$\{block\.align \?\? "center"\}/);
  assert.match(articleSource, /image-align-\$\{block\.align \?\? "center"\}/);
});
