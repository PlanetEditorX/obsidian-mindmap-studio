# Modified Files

- `src/editor/editor.ts`：收起全部后自动适应画布；适应画布增加平滑视口插值动画。
- `src/settings.ts`：调整全局设置分类顺序、作用域命名和旧配置迁移。
- `tests/settings-layout.test.mjs`：增加视口动画及设置命名契约测试。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本为 1.35.2。
- `main.js`：重新生产构建。
- `examples/`：恢复示例文件的可读中文路径。

## 1.35.2 设置重构与交付结构修正

- `src/settings.ts`：重构全局设置分类；全局“主题与外观”按页面工具栏同名面板分为主题模板、画布与字体、节点与文字、连线与分支、阅读外观、代码外观。
- `styles.css`：增加全局主题设置分组样式。
- `tests/settings-layout.test.mjs`、`scripts/test.mjs`：更新分类与对应关系测试。
- `AGENTS.md`、`docs/PROJECT_GUIDE.zh-CN.md`：写入源码 ZIP 内部目录必须固定为 `obsidian-mindmap-studio/` 的 Codex 交付规则。
