# obsidian-mindmap-studio 项目交接

- 插件：MindMap Studio（Obsidian 本地优先 .mindmap 导图，含导图/大纲/文章/通读模式、全局搜索、图床、AI 助手与桌面截图链路）。
- 版本基线：1.48.0（package.json / manifest.json / versions.json / package-lock.json 已同步）。
- 仓库规则：见根目录 `AGENTS.md`；每轮代码交付三份 ZIP（源码 / 安装 / Codex 交接）共用同一六位后缀；验证入口 `npm run verify`。

## 当前状态（1.49.3 待发布 / 线上 1.49.2）

- 本轮按用户实测反馈二次调整目录主题：移除书脊索引/编辑部极简；暗色玻璃改跟随主题强调色（光斑/标题渐变/边框/悬停全取 `--mms-article-accent`）；杂志网格去除子条目“—”前缀；新增极光列表/墨韵书卷/落日暖橙，合计 10 种。书籍预设目录改为墨韵书卷。历史值（editorial/index）自动回退。

- 本轮完成目录主题重整（应用户实测反馈“原先的样式不好看”）：保留并重命名卡片/简洁列表/素雅面板/极简书页 4 种，移除引导线/现代报告/杂志索引旧实现/层级树线 4 种（历史值自动回退），新增杂志网格/垂直时间线/编辑部极简/暗色玻璃/书脊索引 5 种设计移植，合计 9 种。
- `renderDirectory` 支持章节分组卡片（magazine/glass，含大数字编号）与书脊索引侧轨过滤（index）；书籍预设目录改为编辑部极简。设计稿预览保留在 `D:\Downloads	oc-theme-previews\`。
- 拆分剩余批次：题目系统流程、行内编辑深化（收益递减，按需推进）。

- 本轮维护整固：契约源码加载收敛到 `tests/helpers/editor-sources.mjs`（12 处内联拼接 → 1 处清单，杜绝漏改导致的 CI 误报）；`restoreReadingLocation()` 与图片“更新上传”热路径去重。不触碰发布触发路径，无新版本。
- 编辑器拆分剩余批次（题目系统流程、行内编辑深化）收益递减，建议按需推进；`nodeContentBlocks()` 记忆化因旧格式临时块 ID 的语义设计暂不实施。

- 本轮修复文章模式懒加载视口跳变：`.mms-article-view` 显式 `overflow-anchor: none`，消除 Chromium 原生滚动锚定与懒加载手动补偿的双重叠加（用户滚轮取消恢复事务后视口被推飞、焦点看起来跳到其它节点）。契约锁定该 CSS 规则。
- 行为澄清：首次打开的分窗口加载（先出聚焦窗口再后台预热全文）是设计行为；同会话未修改文件时窗口缓存命中。

- 本轮修复 CI 抓到的契约拼接跨文件误报：表格双击 `doesNotMatch` 契约限定在处理器体内检查；24 处引用已迁移成员的断言统一接受 `this.` / `ctx.` 前缀；补回两处缺失 JSDoc。
- 经验教训：多文件拼接的契约中，`doesNotMatch(/A[\s\S]*B/)` 类跨标记模式天然脆弱，新增此类契约时必须限定作用域；引用已迁移成员的断言一律写 `(?:this|ctx).` 前缀。

- 本轮完成编辑器拆分第三批（节点渲染）：`renderMindMapNode` 迁移为 `mind-map-node-renderer.ts`（469 行）纯渲染函数，经 `MindMapNodeRendererContext`（41 成员：get/set 接回可写拖拽状态、getter 实时读取、回调箭头封装）接入编辑器。`editor.ts` 7,734 → 7,485 行。DOM 输出与拆分前一致。
- 拆分剩余批次：题目系统流程、行内编辑深化。核心大方法（buildUi 402 行、beginInlineEdit 325 行）与实例状态耦合极深，后续批次收益递减，建议按需推进。

- 本轮完成编辑器拆分第二批（视口手势与缩放）：`ViewportController`（viewport-controller.ts，约 190 行）持有 zoom/pan/双指手势状态与变换、适应视图、动画机制；编辑器经存取器转发保持既有引用与调用点零改动，交互监听原地保留。`editor.ts` 7,842 → 约 7,700 行。
- 拆分剩余批次：行内编辑与富文本协调、题目系统流程。

- 本轮完成审查清单第 5 项（编辑器拆分第一批）：`editor.ts` 9,094 → 7,842 行；`NodeEditModal`（node-edit-modal.ts，618 行）与 `AppearanceModal`（appearance-modal.ts，675 行）拆为独立模块（构造参数 + 回调注入，不共享实例状态）；编辑器核心契约测试改为读取 editor.ts + 两个新文件的拼接内容，与代码所在文件解耦。运行时行为与数据格式不变。
- 拆分后续批次（建议单独排期，每批保持契约全绿）：视口手势与缩放、行内编辑与富文本协调、题目系统流程——三者与实例状态耦合更深，需按“上下文对象 + 独立类”模式迁移。

- 本轮完成审查清单第 2、3 项编辑器加固：`documentSnapshotJson` 缓存命中读取由 10 秒间隔的抽样自愈校验兜底（不一致立即失效并发出 `document-snapshot-cache-mismatch` 调试事件，防止过期 JSON 进入撤销栈/保存链路）；节点树索引新增 `nodeTreeIndexStale` 过期标记，`captureHistorySnapshot()` / `mutate()` / 拖拽移动流程统一标记，`currentNodeTreeIndex()` 三条件重建。正确代码下运行时行为不变。
- 本轮完成审查清单第 4 项：`src/ai/client.ts` 抽取 `buildCompletionResult()`，四个公开请求函数共用文本/模型/usage 汇总，删除四处重复实现；契约锁定 usage 抽取全局唯一。
- 审查清单剩余建议：`src/editor/editor.ts` 约 9,000 行可按文章渲染、视口手势、行内编辑、题目系统边界拆分（大工程，建议独立一轮）。

- 本轮修复：图片预览放大后拖拽平移只动几像素——`<img>` 浏览器原生 HTML5 拖拽接管指针事件掐断 `pointermove` 流。修复：`draggable="false"` + `pointerdown` 阻止默认 + `dragstart` 拦截 + CSS `-webkit-user-drag: none` / `user-select: none`。契约测试锁定三要素。

- 本轮改进：来源右键菜单按状态区分默认来源（已固定显示“取消默认显示来源”，取消后回退全局优先级）；更新动作按来源类型区分——图床/手动 URL 为“更新上传（选择本地图片并上传图床）”，本地副本为“更新替换（选择本地图片）”（`onSavePastedImage` 存库后更新 `localSource`）；来源栏手动添加 URL 改为“＋”按钮点击展开；预览图片支持指针拖拽平移（切换来源/双击复位归零）。新增 `clearImageSourceDefault()` 纯函数。

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

- 后缀 `862881`：完整源码 `obsidian-mindmap-studio-1.48.2-862881.zip`、安装包 `mindmap-studio-1.48.2-test-862881.zip`（SHA-256 `15b7dfbd00e1496d8c79ffa67031b0a85daee633efc2d442a4e57cc5784724fb`）、交接 `Codex-1.48.2-handoff-862881.zip`。

- 后缀 `302400`：完整源码 `obsidian-mindmap-studio-1.48.3-302400.zip`、安装包 `mindmap-studio-1.48.3-test-302400.zip`（SHA-256 `58f16c77d09c5011c639b43fb110126b97943f9ab8905134f58d87440b4da709`）、交接 `Codex-1.48.3-handoff-302400.zip`。

- 后缀 `877178`：完整源码 `obsidian-mindmap-studio-1.48.4-877178.zip`、安装包 `mindmap-studio-1.48.4-test-877178.zip`（SHA-256 `b6ad78088952ecd78c0c60679211f82d139c1f57250650455b0dac44e8b281aa`）、交接 `Codex-1.48.4-handoff-877178.zip`。

- 后缀 `631488`：完整源码 `obsidian-mindmap-studio-1.48.5-631488.zip`、安装包 `mindmap-studio-1.48.5-test-631488.zip`（SHA-256 `31f44d8023f25ec6ce468811c28b23eae2b9d0b5a8146c429ecccedccd247bfa`）、交接 `Codex-1.48.5-handoff-631488.zip`。

- 后缀 `816555`：完整源码 `obsidian-mindmap-studio-1.48.6-816555.zip`、安装包 `mindmap-studio-1.48.6-test-816555.zip`（SHA-256 `9c0eff6ce82296470e8264a2e0694dec8250917a41d6a1d48b23a494edf3470c`）、交接 `Codex-1.48.6-handoff-816555.zip`。

- 后缀 `722319`：完整源码 `obsidian-mindmap-studio-1.48.7-722319.zip`、安装包 `mindmap-studio-1.48.7-test-722319.zip`（SHA-256 `3c5258afb5a9b535d302d0633d4c1d5e3c89be64ad8151b714d1873bdf7ffd7b`）、交接 `Codex-1.48.7-handoff-722319.zip`；对应线上 Release v1.48.7（编辑器拆分 + CI 修复）。

- 后缀 `801804`：完整源码 `obsidian-mindmap-studio-1.48.7-801804.zip`、安装包 `mindmap-studio-1.48.7-test-801804.zip`（SHA-256 `c9df7db36437d6edf92f66e33bed15a505a13a4571947de5162e1bfac368a4a0`）、交接 `Codex-1.48.7-handoff-801804.zip`。

- 后缀 `105752`：完整源码 `obsidian-mindmap-studio-1.48.8-105752.zip`、安装包 `mindmap-studio-1.48.8-test-105752.zip`（SHA-256 `8f90952b70443e4a58f9ff1cf9e273b6ef8b49cfd0a56366c57a294f10c6e61a`）、交接 `Codex-1.48.8-handoff-105752.zip`。

- 后缀 `625169`：完整源码 `obsidian-mindmap-studio-1.48.9-625169.zip`、安装包 `mindmap-studio-1.48.9-test-625169.zip`（SHA-256 `6cbe1a4c055d2ceb867d465631a5da831b88d78eff11e110f530b821739338d4`）、交接 `Codex-1.48.9-handoff-625169.zip`。

- 后缀 `917448`：完整源码 `obsidian-mindmap-studio-1.48.10-917448.zip`、安装包 `mindmap-studio-1.48.10-test-917448.zip`（SHA-256 `ce1a8ac611e605ef1b47e8638ae4e9ab2c43f7faf750c140dd6e51858a3d0215`）、交接 `Codex-1.48.10-handoff-917448.zip`。

- 后缀 `246457`：完整源码 `obsidian-mindmap-studio-1.48.10-246457.zip`、安装包 `mindmap-studio-1.48.10-test-246457.zip`（SHA-256 `518561b5e57f6ab14cc5c3ad7b17d06b598183870a7dc5cd903fc7a28cf34621`）、交接 `Codex-1.48.10-handoff-246457.zip`。

- 后缀 `287157`：完整源码 `obsidian-mindmap-studio-1.49.1-287157.zip`、安装包 `mindmap-studio-1.49.1-test-287157.zip`（SHA-256 `5cd49ea5e4ff17b179f0915d35fbc8b33558822c85a46c7862387b8fd47a0db3`）、交接 `Codex-1.49.1-handoff-287157.zip`。

- 后缀 `552380`：完整源码 `obsidian-mindmap-studio-1.49.1-552380.zip`、安装包 `mindmap-studio-1.49.1-test-552380.zip`（SHA-256 `cf1b6cb9ff0f6abf094b71a0039933405594f6071a118b6fddf358c62e78cf07`）、交接 `Codex-1.49.1-handoff-552380.zip`；内容与 287157 一致并附加书籍预设契约修正。

- 后缀 `668980`：完整源码 `obsidian-mindmap-studio-1.49.2-668980.zip`、安装包 `mindmap-studio-1.49.2-test-668980.zip`（SHA-256 `ccf8ba56a4d528004cbc35f5c24b2479bfc3639c419e6e40931ac235ba6b692d`）、交接 `Codex-1.49.2-handoff-668980.zip`。

## 最近交付包（历史）（历史）（历史）（历史）（历史）

- 后缀 `190027`：完整源码 `obsidian-mindmap-studio-1.48.0-190027.zip`、安装包 `mindmap-studio-1.48.0-test-190027.zip`（SHA-256 见 `MODIFIED_FILES.md`）、交接 `Codex-1.48.0-handoff-190027.zip`；三份 ZIP 已按新规则输出到仓库父目录 `D:\Downloads`，仓库内及 Git 历史不含任何 ZIP（1.47.1 的两个历史 ZIP 已通过重写历史剥离并强制推送）。
- 后续交付一律把三份 ZIP 输出到 `D:\Downloads`，严禁写入仓库内部或提交。
- 上一轮后缀 `741761`：AI 请求取消（1.47.1，已发布 1.47.2）。
