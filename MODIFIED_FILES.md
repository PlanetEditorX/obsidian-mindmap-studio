# Modified Files

- `src/editor/editor.ts`
  - 文章重建改为双缓冲流程：保留当前可见页面，在隐藏渲染区完成新页后原位交换。
  - 首次进入时创建静态文章骨架；交换阶段保留滚动快照并恢复语义或像素位置。
  - 取消或覆盖未完成重建时清理隐藏渲染区、加载层、骨架、保留页样式和延迟计时器。
- `styles.css`
  - 新增加载提示、旋转图标、静态骨架、旧页弱化、新页淡入和覆盖层淡出样式。
  - 移除文章渐进加载期间的全局 `progress` 光标，兼容系统“减少动态效果”。
- `tests/incremental-render.test.mjs`
  - 新增旧页保留、隐藏渲染区、首次骨架、无全局加载光标、过渡样式和取消清理契约测试。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`TEST_RESULTS.md`
  - 同步文章双缓冲加载策略、用户可见行为、验证范围和桌面端冒烟项。
- `Codex/项目/obsidian-mindmap-studio.md`
  - 更新当前状态、验证基线、待验证事项、下一步和最近交付包。
- `main.js`
  - 由生产构建重新生成。
