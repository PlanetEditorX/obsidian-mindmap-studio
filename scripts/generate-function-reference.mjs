import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const srcDir = path.resolve("src");
const output = path.resolve("docs/FUNCTION_REFERENCE.md");
const files = (await readdir(srcDir)).filter((file) => file.endsWith(".ts")).sort();
const lines = [
  "# 函数与类参考",
  "",
  "> 本文档由 `npm run docs:generate` 根据 TypeScript 源码自动生成。源码中的 JSDoc 是说明的权威来源；修改函数签名或职责后，应同步更新注释并重新生成本文档。",
  ""
];

function cleanComment(raw) {
  const match = raw.match(/\/\*\*([\s\S]*?)\*\//);
  if (!match) return "";
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trimEnd())
    .filter((line) => !line.startsWith("@param") && !line.startsWith("@returns") && !line.startsWith("@remarks") && !line.startsWith("@file") && !line.startsWith("@description"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

for (const file of files) {
  const source = await readFile(path.join(srcDir, file), "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const moduleComment = source.match(/@description\s+([^\n*]+)/)?.[1]?.trim() ?? "";
  lines.push(`## \`src/${file}\``, "", moduleComment, "");
  const entries = [];
  function visit(node, className = "") {
    const nextClass = ts.isClassDeclaration(node) && node.name ? node.name.text : className;
    let kind = "";
    let name = "";
    if (ts.isFunctionDeclaration(node) && node.name) { kind = "函数"; name = node.name.text; }
    else if (ts.isClassDeclaration(node) && node.name) { kind = "类"; name = node.name.text; }
    else if (ts.isInterfaceDeclaration(node)) { kind = "接口"; name = node.name.text; }
    else if (ts.isTypeAliasDeclaration(node)) { kind = "类型"; name = node.name.text; }
    else if (ts.isMethodDeclaration(node) && node.name) { kind = "方法"; name = `${className}.${node.name.getText(sf)}`; }
    else if (ts.isConstructorDeclaration(node)) { kind = "构造函数"; name = `${className}.constructor`; }
    if (kind) {
      const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const leading = source.slice(node.getFullStart(), node.getStart());
      const summary = cleanComment(leading) || "参见源码中的实现和调用位置。";
      let signature = node.getText(sf).split("{")[0].trim().replace(/\s+/g, " ");
      if (signature.length > 260) signature = `${signature.slice(0, 257)}…`;
      entries.push({ line, kind, name, summary, signature });
    }
    ts.forEachChild(node, (child) => visit(child, nextClass));
  }
  visit(sf);
  for (const entry of entries) {
    lines.push(`### ${entry.kind} \`${entry.name}\``, "", `源码：\`src/${file}:${entry.line}\``, "", entry.summary, "", "```ts", entry.signature, "```", "");
  }
}

await writeFile(output, `${lines.join("\n")}\n`, "utf8");
console.log(`Generated ${output}`);
