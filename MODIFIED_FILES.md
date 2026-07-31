# Modified Files

- `src/render/incremental-render.ts`
  - 新增不依赖 DOM 的层级聚焦、当前/相邻视口和文章节点渐进渲染优先级计算。
- `src/editor/editor.ts`
  - 导图节点按短帧预算分批挂载；纯文字提交改为局部刷新；文章入口先绘制加载态，再恢复完整交互和语义阅读位置。
- `src/editor/article-renderer.ts`
  - 大型文章先创建轻量章节占位，再按当前节点关系链优先分帧填充正文。
- `styles.css`
  - 新增文章加载反馈、章节占位动画、模式按钮加载态，并兼容系统“减少动态效果”。
- `tests/incremental-render.test.mjs`、`tests/node-creation.test.mjs`、`package.json`
  - 新增优先级和渲染调度专项测试，并调整文章节点渲染源码契约以适配辅助函数拆分。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`
  - 同步大型文档性能策略、架构边界、测试与手工验证项。
- `Codex/项目/obsidian-mindmap-studio.md`
  - 更新当前状态、验证基线、待验证事项和最新交付包。
- `main.js`
  - 由生产构建重新生成。
