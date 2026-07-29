import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

async function filesBelow(root) {
  const result = [];
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else result.push(target);
    }
  };
  await visit(root);
  return result;
}

test("TypeScript compiler rejects unused declarations without custom type roots", async () => {
  const config = JSON.parse(await readFile("tsconfig.json", "utf8"));
  assert.equal(config.compilerOptions?.noUnusedLocals, true);
  assert.equal(config.compilerOptions?.noUnusedParameters, true);
  assert.equal("typeRoots" in (config.compilerOptions ?? {}), false);
});

test("every plugin CSS class is referenced by current source or tests", async () => {
  const css = await readFile("styles.css", "utf8");
  const classNames = [...new Set([...css.matchAll(/\.((?:mmc|mms)-[A-Za-z0-9_-]+)/g)].map((match) => match[1]))];
  const sourceFiles = [
    ...(await filesBelow("src")),
    ...(await filesBelow("scripts")),
    ...(await filesBelow("tests"))
  ];
  const searchable = (await Promise.all(sourceFiles.map((file) => readFile(file, "utf8")))).join("\n");
  const unreferenced = classNames.filter((className) => !searchable.includes(className));
  assert.deepEqual(unreferenced, []);
});

test("example assets use canonical readable paths", async () => {
  const files = await filesBelow("examples");
  const encoded = files.filter((file) => /(?:%[0-9A-F]{2}|#U[0-9A-F]{4})/i.test(file));
  assert.deepEqual(encoded, []);
  for (const expected of [
    path.join("examples", "中国文学示例.mindmap"),
    path.join("examples", "古诗.mindmap"),
    path.join("examples", "MindMap Assets", "古诗", "唐诗.mindmap")
  ]) {
    assert.ok(files.includes(expected), `missing canonical example path: ${expected}`);
  }
});

test("README source version matches package metadata", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const readme = await readFile("README.md", "utf8");
  assert.ok(readme.includes(`当前源码版本：\`${packageJson.version}\`。`));
});
