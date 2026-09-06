import { readFile } from "node:fs/promises";

/**
 * 编辑器核心源码契约的统一加载清单。
 *
 * 新增拆分模块时只需在此追加文件，所有契约测试自动跟随；
 * 禁止在单个测试里内联多文件拼接表达式（历史教训：漏改一处导致 CI 误报）。
 */
const EDITOR_SOURCE_FILES = [
  "src/editor/editor.ts",
  "src/editor/node-edit-modal.ts",
  "src/editor/appearance-modal.ts",
  "src/editor/viewport-controller.ts",
  "src/editor/mind-map-node-renderer.ts"
];

/** 读取并拼接全部编辑器核心源码，供正则契约断言使用。 */
export async function loadEditorSources() {
  const parts = await Promise.all(EDITOR_SOURCE_FILES.map((file) => readFile(file, "utf8")));
  return parts.join("\n");
}
