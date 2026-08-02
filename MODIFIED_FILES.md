# Modified Files

## 1.38.7 缓存恢复分帧与 hydration 线性化

- `src/editor/article-renderer.ts`：缓存预扫描不再同步恢复所有章节 HTML；恢复、净化、交互绑定和普通节点重建共用帧预算。增加单次渲染内容块 `WeakMap`，并对缓存章节的 `data-block-id` 一次建索引。
- `src/article/modes.ts`：`buildArticleNodeInfo()` 可注入主文字读取回调，文章渲染复用内容块缓存；同级标题和末端正文统计合并为一次遍历。
- `tests/article-render-cache.test.mjs`：增加缓存恢复位置、内容块 memo、主文字缓存注入和块元素索引契约测试，单元测试扩展至 265 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步缓存命中首屏、复杂度边界、验证与函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.7，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 大文件待验证事项。
- `main.js`：由优化后的 TypeScript 源码重新生产构建。

## 1.38.6 文章缓存线性指纹与跨平台 ZIP 适配

- `src/article/article-render-cache.ts`：新增只覆盖节点自身与渲染上下文的文章节点指纹，避免递归序列化后代；缓存修订提升到 v2，修复启动预载 LRU 顺序，并使用无原型节点表。
- `src/editor/article-renderer.ts`：节点缓存改用局部指纹，文档摘要聚合现有节点指纹，缓存路径比较统一规范化 Windows/Unix 分隔符。
- `tests/article-render-cache.test.mjs`：新增后代编辑不使祖先失效、当前节点/上下文变化必须失效、重启预载后正确淘汰最旧条目的专项测试。
- `AGENTS.md`、`docs/DEVELOPMENT.md`：补充 Windows ZIP 的 `#Uxxxx` + `0x7075` 在 Linux 下恢复与标准 UTF-8 bit 11 重打包规则。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步缓存复杂度、复用边界、测试与函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.6，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`：记录完整验证、专项基准和真实 Win10 大文件待验证事项。
- `main.js`：由优化后的 TypeScript 源码重新生产构建。

## 1.38.5 文章节点级持久缓存

- `src/article/article-render-cache.ts`：新增稳定指纹、缓存结构校验、内存 LRU、插件私有 JSON 预载与串行防抖写盘；支持文件删除清理和重命名迁移。
- `src/editor/article-renderer.ts`：按文章展示签名和节点指纹恢复未变化节点静态 HTML，分帧重新绑定文字、图片、表格和题目交互；只重新渲染变化节点，代码块节点保持安全重建。
- `src/editor/editor-types.ts`、`src/editor/editor.ts`、`src/view.ts`、`src/main.ts`：在插件、视图和编辑器边界传递同步预载快照与完成回调，并在插件启动、卸载和文件生命周期中管理缓存。
- `tests/article-render-cache.test.mjs`、`tests/incremental-render.test.mjs`、`package.json`：新增指纹、预载、持久化和渲染契约专项测试，单元测试扩展至 263 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步缓存边界、降级策略和人工验证步骤。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.5，并在最终打包后写入安装包 SHA-256。
- `TEST_RESULTS.md`、`MODIFIED_FILES.md`：记录完整验证与真实 Win10 大文件待验证事项。
- `main.js`：由缓存实现后的 TypeScript 源码重新生产构建。

## 1.38.4 渐进文章加载期间滚动位置保护

- `src/editor/editor.ts`：增加渐进文章视口所有权状态；滚轮、触摸、指针和翻页键输入后清除旧待恢复位置，后续批次及完成回调不再写回打开瞬间的滚动快照。未发生用户导航时继续保留原有语义阅读位置恢复。
- `tests/incremental-render.test.mjs`：新增用户接管视口专项回归，并扩展渐进文章契约检查。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步滚动控制边界、人工验证步骤和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.4，并写入本轮安装包 SHA-256。
- `TEST_RESULTS.md`、`MODIFIED_FILES.md`：记录完整验证和真实 Obsidian 待验证事项。
- `main.js`：由修复后的 TypeScript 源码重新生产构建。

## 1.38.3 大型文章打开与深层导图布局性能优化

- `src/render/layout.ts`：在单次布局内缓存节点子树高度，消除深层链式结构的重复递归计算，同时保持原有位置、碰撞处理与布局语义。
- `src/editor/editor.ts`：文章、大纲和通读模式初始化时不再预计算完整导图布局；文章首批正文完成后立即显示，后续内容继续分帧填充，并完善部分页面的视口保持与取消清理。
- `src/editor/article-renderer.ts`：新增首批内容回调，收紧首帧预算并提高后续批次吞吐，使用户无需等待全文 DOM 构建完成即可开始阅读。
- `tests/incremental-render.test.mjs`、`scripts/test.mjs`：增加按需布局、首批显示及 1200 层深链布局性能回归测试。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步性能边界、渲染流程、测试方法和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.3，并写入本轮安装包 SHA-256。
- `TEST_RESULTS.md`、`MODIFIED_FILES.md`：记录完整验证、开发基准和真实 Obsidian 待验证项。
- `main.js`：由优化后的 TypeScript 源码重新生产构建。

## 1.37.1 图片粘贴目标与节点弹窗剪贴板支持

- `src/editor/editor.ts`：导图和大纲图片粘贴严格使用当前选中节点；文章与通读继续按实际内容块目标插入。完整节点编辑器新增剪贴板读取、粘贴事件、图片块替换与自动上传排程。
- `tests/article-content-block.test.mjs`：增加旧焦点隔离、弹窗按钮、直接粘贴、仓库保存和精确节点自动上传专项契约。
- `examples/`：恢复规范 UTF-8 中文示例路径。
- 文档、版本元数据和生产 `main.js` 同步更新到 1.37.1。

## 1.37.0 图片诊断、粘贴目标与自动上传安全合并

- `src/editor/image-failure-view.ts`：新增统一失败地址卡片、候选源收集和复制地址操作。
- `src/editor/editor.ts`、`src/editor/article-renderer.ts`、`src/editor/outline-renderer.ts`、`styles.css`：四种模式显示失败地址；粘贴开始前锁定节点/内容块；移除文章前后页按钮悬浮提示属性。
- `src/core/model.ts`、`src/main.ts`、`src/view.ts`：新增 ID 级图片上传补丁；自动上传按文件批处理与串行，只向最新文档合并图片字段并显示汇总通知。
- `tests/image-source-candidates.test.mjs`、`tests/image-layout.test.mjs`、`tests/article-content-block.test.mjs`、`tests/reading-editor-contract.test.mjs`：增加补丁保留用户编辑、失败地址、粘贴目标、批处理和无悬浮提示专项测试。
- `examples/`：将编码占位文件名恢复为规范 UTF-8 中文路径。
- 文档、版本元数据和生产 `main.js` 同步更新到 1.37.0。

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
