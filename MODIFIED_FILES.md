# Modified Files

## 1.35.3 图床延迟删除与文章加载骨架

- `src/settings.ts`：移除独立删除请求头配置，增加持久化远程删除队列数据结构；上传与删除共用图床请求头。
- `src/main.ts`：连通性测试图片和最后引用远程图片统一进入 1 分钟删除队列；到期前重新保存并扫描所有导图，撤销恢复时取消删除；插件重启后恢复待执行任务。
- `src/editor/editor.ts`、`styles.css`：文章首次加载骨架按当前视图高度动态增加行数，并横向铺满文章窗口。
- `tests/image-layout.test.mjs`、`tests/incremental-render.test.mjs`：增加共用请求头、延迟删除、撤销保护、测试图清理和视口骨架专项契约。
- `README.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/ARCHITECTURE.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/TESTING.md`、`CHANGELOG.md`、`TEST_RESULTS.md`：同步行为、数据边界和验证记录。

## 1.35.3 完整节点加粗快捷键与导入提示

- `src/editor/node-rich-text-editor.ts`：为完整节点编辑器的格式快捷键增加 `event.code` 匹配和 `keydown` / `beforeinput` 去重，避免 `Ctrl/Cmd+B` 加粗后被浏览器格式输入事件立即切换回去。
- `src/editor/editor-modals.ts`：导入入口提示改用“思维导图”通用称呼，保留 `.xmind` 解析能力。
- `tests/image-layout.test.mjs`、`tests/import-mode.test.mjs`：增加加粗双事件去重和导入提示品牌隐藏专项测试。
- `README.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`TEST_RESULTS.md`：同步行为、测试和交付记录。


## 1.35.3 图片布局、图床去重与编辑体验

- `src/core/model.ts`、`src/render/layout.ts`、`src/editor/editor.ts`、`src/editor/outline-renderer.ts`、`src/editor/article-renderer.ts`、`styles.css`：新增图片同行/独占一行字段、编辑入口和多模式布局；文章与大纲为连续同行图片创建 flex 行，修复小图仍各占一行；缩小图片预览窗口；无启用图床时隐藏图片右键“上传到图床”。
- `src/utils/image-host.ts`、`src/main.ts`、`src/settings.ts`、`src/editor/node-image-actions.ts`：增加 SHA-256 上传缓存、删除令牌解析、可配置删除 API；图床预设收敛为默认 Zipline、ImgBB、Freeimage.host 和自定义，旧 Zipline v3/v4 配置自动迁移；Zipline 删除复用当前 Token，并为历史图片回查文件 ID。
- `src/editor/node-rich-text-editor.ts`、`src/editor/editor.ts`：完整节点编辑器接入加粗、斜体、下划线和文字颜色快捷键，并通过窗口捕获层避免 Obsidian 抢占加粗/颜色组合键。
- `tests/image-host.test.mjs`、`tests/image-layout.test.mjs`、`tests/article-content-block.test.mjs`：增加哈希、删除模板、图床预设、同行图片 flex 行、快捷键与预览尺寸专项测试。
- `README.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/ARCHITECTURE.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/TESTING.md`：同步数据边界、使用方式和删除安全规则。

## 1.35.3 截图覆盖层运行时修复

- `src/utils/desktop-capture.ts`：Windows 抓屏改为 DPI 感知的完整虚拟桌面截图并记录所有显示器边界；覆盖层增加“全部屏幕 / 屏幕 N”切换、按比例显示和原始像素导出映射；几何图形、画笔、箭头、文字与序号增加颜色、线宽、形状和填充样式，文字输入修复为延迟稳定聚焦并支持中文组合输入；箭头增加直线样式；屏幕名称不再读取可能乱码的 PowerShell 标签；删除固定截图动作及相关原生窗口代码；默认选区改为当前屏幕完整范围；截图并识别模式保留完整工具栏与样式栏 DOM，仅以完全透明和禁用指针事件隐藏；倒计时保留原有小号胶囊样式和“秒后自动识别”文案，仅将小数秒改为整数 3、2、1；悬停边框/拖动条/缩放手柄时暂停，离开或重新框选后重启，并增加宿主窗口与 iframe 窗口双层 Esc 取消；选区保持圆角柔和边缘。
- `src/editor/editor.ts`：拆分截图与截图并识别链路，冻结节点/内容块插入目标，增加顶部工具栏和节点右键入口，并复用现有图片识别确认流程。
- `src/editor/editor-types.ts`、`src/view.ts`、`src/main.ts`：将普通截图与截图并识别模式参数传递到桌面覆盖层，保持快捷键、命令和桌面 API 延迟加载。
- `src/settings.ts`：将“截图与识别”调整为独立一级分类，增加两套可录制快捷键及旧分类迁移，移除“截图后自动识图”设置。
- `tests/ai.test.mjs`、`tests/image-recognition.test.mjs`：增加分类、独立命令、快捷键、右键菜单、实际生成覆盖层 HTML、脚本语法、虚拟桌面与多显示器元数据、DPI 感知、原始像素映射、样式工具栏、画布内文字输入、默认整屏选区、删除固定动作、文字输入焦点、箭头/直线样式、屏幕标签编码、透明完整控件树、整数倒计时、边框暂停状态机、iframe/宿主双层 Esc 和禁止静默系统截图回退的专项测试。
- `README.md`、`AGENTS.md`、`docs/AI_ASSISTANT.zh-CN.md`、`docs/ARCHITECTURE.md`、`docs/IMAGE_RECOGNITION_SCREENSHOT.zh-CN.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步功能边界、架构、测试和人工验证要求。
- `docs/FUNCTION_REFERENCE.md`：重新生成函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.35.3。
- `examples/中国文学示例.mindmap`、`examples/古诗.mindmap`、`examples/MindMap Assets/古诗/唐诗.mindmap`：恢复源码包缺失的规范 UTF-8 中文示例及父子导图路径。
- `examples/中国文学示例.mindmap`、`examples/古诗.mindmap`、`examples/MindMap Assets/古诗/唐诗.mindmap`：恢复仓库规范示例路径，保证中文路径可读并参与 ZIP UTF-8 验证。
- `main.js`：从修复后的 TypeScript 源码重新生产构建。
- `AGENTS.md`、`docs/PROJECT_GUIDE.zh-CN.md`：将 Codex 交接包外部文件名规则收紧为严格的 `Codex-<版本>-handoff-<六位后缀>.zip`，不得包含项目名。
