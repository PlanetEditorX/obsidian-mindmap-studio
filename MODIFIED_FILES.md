# Modified Files

- `src/editor/editor.ts`
  - 文章渐进重建前保存旧滚动位置与滚动高度；每批章节挂载后优先恢复语义节点，目标尚未挂载时使用旧像素位置兜底。
  - 异步文章族上下文刷新新增来源标记；目录层级、目录项和分页导航未变化时，不再重建当前文章、导图或大纲。
- `src/editor/article-renderer.ts`
  - 渐进渲染接口新增批次进度回调，每批正文填充后通知编辑器校正滚动锚点。
- `src/view.ts`
  - 文章族上下文刷新通过专用标记更新编辑器选项，避免普通文字保存触发延迟整页重绘。
- `tests/incremental-render.test.mjs`、`tests/reading-editor-contract.test.mjs`
  - 新增旧滚动高度保留、逐批语义锚点校正、像素兜底和上下文刷新去重建契约测试。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`
  - 同步文章滚动稳定策略、上下文刷新边界、自动验证和桌面冒烟项。
- `Codex/项目/obsidian-mindmap-studio.md`
  - 更新当前状态、验证基线、待验证事项和最新交付包。
- `main.js`
  - 由生产构建重新生成。
