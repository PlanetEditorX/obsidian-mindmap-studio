import assert from "node:assert/strict";
import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const srcDir = path.resolve("src");
async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".ts") ? [entryPath] : [];
  }));
  return files.flat().sort();
}

const files = await collectTypeScriptFiles(srcDir);
const missing = [];
let documentedDeclarations = 0;

for (const filePath of files) {
  const file = path.relative(srcDir, filePath).replaceAll("\\", "/");
  const source = await readFile(filePath, "utf8");
  const baseName = path.basename(file);
  assert.match(source, new RegExp(`@file\\s+${baseName.replace(".", "\\.")}`), `${file} must contain a module-level @file comment`);
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  function visit(node, className = "") {
    const nextClass = ts.isClassDeclaration(node) && node.name ? node.name.text : className;
    const named =
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node);
    if (named) {
      const label = ts.isConstructorDeclaration(node)
        ? `${className}.constructor`
        : "name" in node && node.name
          ? `${className && ts.isMethodDeclaration(node) ? `${className}.` : ""}${node.name.getText(sf)}`
          : "anonymous";
      const leading = source.slice(node.getFullStart(), node.getStart());
      if (!/\/\*\*[\s\S]*?\*\//.test(leading)) missing.push(`${file}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1} ${label}`);
      else documentedDeclarations += 1;
    }
    ts.forEachChild(node, (child) => visit(child, nextClass));
  }
  visit(sf);
}

assert.deepEqual(missing, [], `Declarations missing JSDoc:\n${missing.join("\n")}`);
for (const doc of ["docs/ARCHITECTURE.md", "docs/DATA_MODEL.md", "docs/SPECIAL_FEATURES.md", "docs/FUNCTION_REFERENCE.md", "docs/DEVELOPMENT.md"]) {
  await access(doc);
}
const special = await readFile("docs/SPECIAL_FEATURES.md", "utf8");
for (const keyword of ["子导图", "三种显示模式", "文章编号", "图床", "镜像", "全局搜索", "节点尺寸", "只读", "撤销", "SVG"]) {
  assert.ok(special.includes(keyword), `SPECIAL_FEATURES.md must explain ${keyword}`);
}
console.log(`Documentation coverage OK: ${documentedDeclarations} named declarations documented across ${files.length} source modules.`);
