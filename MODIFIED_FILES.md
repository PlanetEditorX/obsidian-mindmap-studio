# Modified Files

- `src/editor/editor.ts`
  - 图片镜像容灾成功后通过 `replaceNodeContentBlocks()` 写回权威图片块，避免重绘后恢复失效地址并重复提示。
- `tests/image-layout.test.mjs`
  - 覆盖容灾切换必须使用权威内容块替换链路，不得回退到仅同步兼容字段的旧路径。
- `tests/image-source-candidates.test.mjs`
  - 覆盖规范化图片块切换后同时持久化 `content[].source` 和 `node.image`。
- `CHANGELOG.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`TEST_RESULTS.md`
  - 同步容灾持久化行为、专项测试和完整验证结果。
- `Codex/项目/obsidian-mindmap-studio.md`
  - 更新当前状态、验证基线、待手工验证项和最新交付包。
- `main.js`
  - 由生产构建重新生成。
