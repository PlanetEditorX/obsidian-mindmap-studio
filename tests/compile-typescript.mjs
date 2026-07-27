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


/**
 * Transpile a small dependency graph of TypeScript files and load one entry.
 * Relative imports between the supplied files are preserved in the temp tree.
 */
export async function loadTypeScriptModules(sourcePaths, entryPath) {
  const directory = await mkdtemp(path.join(tmpdir(), "mindmap-studio-unit-graph-"));
  for (const sourcePath of sourcePaths) {
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
      await rm(directory, { recursive: true, force: true });
      throw new Error(`TypeScript transpile failed for ${sourcePath}:\n${message}`);
    }
    const output = path.join(directory, sourcePath.replace(/\.ts$/, ".js"));
    await import("node:fs/promises").then(({ mkdir }) => mkdir(path.dirname(output), { recursive: true }));
    await writeFile(output, result.outputText, "utf8");
  }
  const require = createRequire(import.meta.url);
  return {
    module: require(path.join(directory, entryPath.replace(/\.ts$/, ".js"))),
    cleanup: () => rm(directory, { recursive: true, force: true })
  };
}
