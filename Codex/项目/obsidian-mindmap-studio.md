# obsidian-mindmap-studio 项目交接

- 插件：MindMap Studio（Obsidian 本地优先 .mindmap 导图，含导图/大纲/文章/通读模式、全局搜索、图床、AI 助手与桌面截图链路）。
- 版本基线：1.48.0（package.json / manifest.json / versions.json / package-lock.json 已同步）。
- 仓库规则：见根目录 `AGENTS.md`；每轮代码交付三份 ZIP（源码 / 安装 / Codex 交接）共用同一六位后缀；验证入口 `npm run verify`。

## 当前状态（1.48.2 待发布 / 线上 1.48.1）

- 本轮修复：图片预览“更新上传”改为“图床选择弹窗 → 系统文件选择器选本地图片 → 上传并合并镜像”（此前误用了不上传文件的重传路径，未打开文件管理器）；`selectImageFile()` 已导出复用。契约测试同步锁定完整链路。
- 流程修复：新增 `.gitattributes`（`* text=auto eol=lf`）统一行尾，解决 Windows `autocrlf` 下 rebase 检出 CRLF 导致 4 项源码契约测试误报；并明确规则——版本号一律由 release 工作流自动递增，任何提交不得手动修改版本文件。
- 版本号说明：交付 ZIP 文件名中的版本（当前 1.48.1）是打包时的 manifest 追踪标识；GitHub Release 由工作流自动递增（本批将发布 1.48.2），两者允许相差一个自动 patch。

- 本轮完成一：图片来源管理。图片预览弹窗（画布点击、图片右键“放大预览”、文章、大纲、通读模式）注入 `ImagePreviewSourceActions`：来源按钮右键可“设为默认显示来源 / 更新上传（本地图片重新上传图床）/ 删除此来源”，同一行输入框可手动添加图片 URL 来源；变更走统一历史链路（`mutateWithoutArticleContext` / 冻结快照上传 / `removeImageBlock` 远程清理）；删除最后一个来源等价删除图片块并关闭弹窗，节点保留为空节点。
- 本轮完成二：新增图片块可选字段 `sourcePriority`（图片级来源优先级，16 条上限），`imageSourceCandidates()` 以其为主排序键；未设置时与旧排序逐项一致。数据模型、规范化与四个纯函数（`normalizeImageSourcePriority` / `removeImageSourceCandidate` / `createManualImageRemoteSource` / `setImageSourceDefault`）均在 `src/core/model.ts`。
- 本轮完成三：弹窗宽度三档统一（`--mms-modal-md/lg/xl`）。AI 助手、题目、表格、代码、全局搜索归 md（920px，修复 AI 弹窗被 Obsidian 默认宽度卡住过窄）；外观设置 lg（1280px）；图片预览与识图预览 xl（1440px）。
- 已知边界：节点编辑器内容块卡片内的图片点击预览保持只读（该处使用节点编辑器本地工作块与独立保存流程）。

## 验证基线

- `npm run verify` 本机完整通过：`test:unit` 400/400（`tests/image-source-candidates.test.mjs` 12 项，含 6 项来源管理纯函数 + 1 项接线契约）；`test:regression` 全部通过（文章/大纲渲染器契约改为锁定 `options.openImagePreview` 注入式预览）；`test:docs` 覆盖 58 个源码模块、1246 个具名声明；`test:repo` 通过；production esbuild 通过，`main.js` 已重建。
- 详细数据见根目录 `TEST_RESULTS.md` 1.48.0 小节。

## 待验证事项（需真实 Obsidian 桌面端手工冒烟）

- 右键来源“更新上传”：选图床 → 文件管理器选本地图片 → 上传成功后预览与默认来源切换；取消选图不产生撤销条目。
- 右键来源“更新上传”：选择图床 → 上传成功后镜像合并与默认来源切换；取消上传不产生撤销条目。
- 删除最后一个来源：图片块删除、弹窗关闭、可撤销恢复；远程文件按“未引用自动清理”设置处理。
- 手动添加 URL 来源可显示；设为默认后重开文档仍按该优先级显示。
- 各弹窗宽度在实际窗口（含小窗口）下的视觉检查。

## 下一步建议

- 编辑器侧优化仍待实施：把 `documentSnapshotJson` 失效与 `nodeTreeIndex` 重建收拢进 `mutate()` 单一入口；可加 debug 抽样断言缓存一致性。
- `src/editor/editor.ts` 约 9,000 行，后续可按文章渲染、视口手势、行内编辑、题目系统边界拆分。
- `src/ai/client.ts` 三处重复的 usage 提取可抽成 `buildCompletionResult()` 帮助函数。

## 最近交付包

- 后缀 `190027`：完整源码 `obsidian-mindmap-studio-1.48.0-190027.zip`、安装包 `mindmap-studio-1.48.0-test-190027.zip`（SHA-256 见 `MODIFIED_FILES.md`）、交接 `Codex-1.48.0-handoff-190027.zip`；三份 ZIP 已按新规则输出到仓库父目录 `D:\Downloads`，仓库内及 Git 历史不含任何 ZIP（1.47.1 的两个历史 ZIP 已通过重写历史剥离并强制推送）。
- 后续交付一律把三份 ZIP 输出到 `D:\Downloads`，严禁写入仓库内部或提交。
- 上一轮后缀 `741761`：AI 请求取消（1.47.1，已发布 1.47.2）。
