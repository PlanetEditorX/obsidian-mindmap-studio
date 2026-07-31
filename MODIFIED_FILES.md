# Modified Files

## 1.35.3 截图覆盖层运行时修复

- `src/utils/desktop-capture.ts`：移除异步抓屏完成后可能被 Obsidian 拦截的 `window.open` 路径，截图编辑器统一直接挂载到当前文档根节点的最高层级全屏 `iframe`；截图源改用临时 Blob URL 并在关闭时释放；优先尝试 Electron 渲染器抓屏并设置 3.5 秒超时，本机抓屏设置 18 秒总超时，PowerShell 增加 STA 模式，临时目录清理失败不再覆盖成功结果；保留明显边框、12 项工具、普通截图双击确认与截图并识别 3 秒空闲计时。
- `src/editor/editor.ts`：拆分截图与截图并识别链路，冻结节点/内容块插入目标，增加顶部工具栏和节点右键入口，启动时立即显示“正在准备截图编辑器/截图并识别”提示，并复用现有图片识别确认流程。
- `src/editor/editor-types.ts`、`src/view.ts`、`src/main.ts`：将普通截图与截图并识别模式参数传递到桌面覆盖层，保持快捷键、命令和桌面 API 延迟加载。
- `src/settings.ts`：将“截图与识别”调整为独立一级分类，增加两套可录制快捷键及旧分类迁移，移除“截图后自动识图”设置。
- `tests/ai.test.mjs`、`tests/image-recognition.test.mjs`：增加分类、独立命令、快捷键、右键菜单、实际生成覆盖层 HTML、明显边框、12 项工具栏、本机抓屏候选、文档根节点内嵌覆盖层、禁止异步 `window.open`/静默系统截图回退、抓屏硬超时和 Blob URL 释放的专项测试。
- `README.md`、`AGENTS.md`、`docs/AI_ASSISTANT.zh-CN.md`、`docs/ARCHITECTURE.md`、`docs/IMAGE_RECOGNITION_SCREENSHOT.zh-CN.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步功能边界、架构、测试和人工验证要求。
- `docs/FUNCTION_REFERENCE.md`：重新生成函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.35.3。
- `examples/中国文学示例.mindmap`、`examples/古诗.mindmap`、`examples/MindMap Assets/古诗/唐诗.mindmap`：恢复源码包缺失的规范 UTF-8 中文示例及父子导图路径。
- `examples/中国文学示例.mindmap`、`examples/古诗.mindmap`、`examples/MindMap Assets/古诗/唐诗.mindmap`：恢复仓库规范示例路径，保证中文路径可读并参与 ZIP UTF-8 验证。
- `main.js`：从修复后的 TypeScript 源码重新生产构建。
