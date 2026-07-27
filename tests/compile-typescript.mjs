import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";

/**
 * Transpile and load a dependency-free TypeScript module for unit testing.
 * The caller must invoke the returned cleanup function.
 */
export async function loadTypeScriptModule(sourcePath) {
  const source = await readFile(sourcePath, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true
    },
    fileName: sourcePath,
    reportDiagnostics: true
  });
  const diagnostics = result.diagnostics ?? [];
  if (diagnostics.length) {
    const message = diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("\n");
    throw new Error(`TypeScript transpile failed for ${sourcePath}:\n${message}`);
  }
  const directory = await mkdtemp(path.join(tmpdir(), "mindmap-studio-unit-"));
  const output = path.join(directory, `${path.basename(sourcePath, ".ts")}.cjs`);
  await writeFile(output, result.outputText, "utf8");
  const require = createRequire(import.meta.url);
  return {
    module: require(output),
    cleanup: () => rm(directory, { recursive: true, force: true })
  };
}
