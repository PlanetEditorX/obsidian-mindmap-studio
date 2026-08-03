import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const rootDir = path.resolve(new URL("..", import.meta.url).pathname);

test("article context progress helper clamps totals, preserves the configured bounds, and finishes at the end bound", async () => {
  const source = await readFile(path.join(rootDir, "src/article/modes.ts"), "utf8");
  const helper = source.match(/export function resolveArticleContextProgressPercent\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(helper, /start = 12, end = 92/);
  assert.match(helper, /const safeTotal = Math\.max\(1, Math\.floor\(total\)\)/);
  assert.match(helper, /const safeProcessed = Math\.max\(0, Math\.min\(safeTotal, Math\.floor\(processed\)\)\)/);
  assert.match(helper, /if \(safeProcessed >= safeTotal\) return safeEnd/);
  assert.match(helper, /return safeStart \+ Math\.round\(\(safeProcessed \/ safeTotal\) \* span\)/);
});
