# 开发与维护指南

## 环境要求

- Node.js 20 或更高版本。
- npm 与仓库内 `package-lock.json` 配套使用。
- Obsidian 1.5.0 或更高版本用于手动集成验证。

首次安装：

```bash
npm ci
```

禁止使用 `npm install` 随意刷新锁文件。只有依赖变更时才更新 `package.json` 与 `package-lock.json`，并在同一提交中解释原因。

## 常用命令

```bash
npm run dev
npm run test:unit
npm run test:regression
npm run test:docs
npm run test:repo
npm run build
npm run verify
```

`npm run verify` 是本地提交和 CI 的统一入口。它依次执行单元测试、综合回归、文档检查、仓库检查、TypeScript 类型检查和生产构建。

## 代码边界

### 模型层

`src/core/model.ts` 与 `src/core/node-tree.ts` 负责当前数据结构、规范化、序列化和树结构操作。磁盘数据、Markdown、剪贴板和 XMind 等不可信输入必须先进入模型层，不应在 UI 中重复实现解析逻辑。

### 编辑器层

`src/editor/` 负责交互和渲染。所有可撤销写操作应通过统一 mutation/history 链路；不要直接修改文档后绕过撤销和保存通知。只有 DOM 已在连续交互中实时得到最终结果、且同步重绘会破坏当前位置时，才允许像文章表格列宽提交一样显式执行 `history.capture()`、稳定块更新、`onChange(..., { refreshArticleContext: false })` 和保存标记，同时跳过 `render()` 与文章族上下文刷新，并必须补充专项契约。

### 插件服务层

`src/main.ts` 负责 Obsidian 生命周期、文件系统、跨文件子导图、图床与 AI 网络请求、桌面截图/本地 OCR 宿主调用、搜索索引和设置持久化。编辑器通过回调契约请求这些能力，不直接访问仓库服务。插件设置写入必须复用 `CoalescedJsonWriter`，不得在新路径中直接并发调用 `saveData()`；文件浏览器扫描应先编译筛选规则；完整扫描只允许由布局初始化或筛选配置语义变化触发，普通仓库写入不得直接刷新全树，日常 DOM 更新只处理新增或 `data-path` 改变的局部子树。

### 纯工具层

`src/utils/` 不依赖 Obsidian API，适合放置确定性转换和输入校验。新增纯函数时应同步增加 `tests/*.test.mjs` 测试，不要把可测试逻辑重新塞回 `main.ts`。

## TypeScript 规范

- 保持 `noImplicitAny`、`strictNullChecks`、`noImplicitReturns` 和 `noFallthroughCasesInSwitch`。
- 避免 `any`、`@ts-ignore` 和无说明类型断言。
- 外部 JSON 先使用 `unknown`，完成结构校验后再收窄类型。
- 公共接口使用稳定的类型别名或接口；跨模块避免依赖私有实现细节。
- Promise 不应被无意丢弃；有意不等待时使用 `void` 明确标记。

## 注释规范

每个 TypeScript 模块必须包含：

```ts
/**
 * @file example.ts
 * @description 模块职责和边界。
 */
```

函数、方法、类、接口和类型别名必须使用 JSDoc。注释应解释：

- 为什么存在该边界或规则。
- 输入输出和失败条件。
- 安全性、数据约束或事务原因。

不要使用“执行相关内部逻辑”一类无法帮助维护者判断行为的模板化描述。修改现有函数时，应优先把该函数的模板注释改为具体语义。

## 文档维护

代码变更时按影响更新文档：

- 架构或职责变化：`docs/ARCHITECTURE.md`。
- 数据字段变化：`docs/DATA_MODEL.md`。
- 用户行为变化：`README.md`、`docs/SPECIAL_FEATURES.md`。
- 测试边界变化：`docs/TESTING.md`。
- 开发流程变化：本文件与 `docs/GIT_WORKFLOW.zh-CN.md`。
- 用户可见修复或功能：`CHANGELOG.md` 的“未发布”区。

更新声明后运行：

```bash
npm run docs:generate
npm run test:docs
```

## 调试建议

- 先在纯工具或模型层复现，再进入 DOM 和 Obsidian 集成层。
- 文件保存问题同时检查 `parseDocument()`、`normalizeDocument()`、`serializeDocument()` 和视图 `getViewData()`。
- 文章编号问题确保目录、正文、通读和导出共用同一解析函数；标题编号只支持 1–8 级，更深结构不得循环复用第 7、8 级字母标签。末端正文的 `circled` 样式是独立展示序列，可跨越该深度边界；文章 DOM 与 HTML 必须对全部序号使用正文数字和统一 CSS 圆环，避免系统字体回退，Markdown/Word 等无 CSS 环境仍保留 1–50 Unicode 与 51+ 可读回退。自动对齐的带圈序号必须与普通末端圆点保持同一正文起点，不能被通用编号样式清除 `margin-inline-start`；圆圈允许在编号区内略向左补偿，但右边缘与正文之间必须保留至少 0.18em 的可读间距。快速编辑出现额外块级 padding 时只允许补偿 `::before` 的垂直位置，不得改正文编辑框的 padding、margin、宽度或正文起点。修改带圈编号 DOM 结构时必须提升 `ARTICLE_RENDERER_REVISION`，防止旧缓存恢复双圈或错误字形。
- 图床问题分别验证端点、Header、请求体、响应载荷和 URL 提取。
- 识图问题分别验证图片读取、AI/本地 OCR 模式、不可变预览和并发快照；桌面 API 必须按需动态加载，不能让移动端在插件启动时解析 `node:*` 或 `electron`。
- 子导图问题同时检查父节点 `submap` 与子文档 `navigation`。

## 发布前检查

1. `npm ci` 可从空依赖目录完成。
2. `npm run verify` 全部通过。
3. `git status --short` 只包含预期文件。
4. 版本文件一致。
5. `main.js`、`manifest.json`、`styles.css` 非空。
6. 在测试仓库中完成新建、编辑、保存、重开、导入、导出和子导图导航冒烟测试。
7. 确认源码包不含 `.ua/`、`.local-test-build/`、`node_modules/` 或真实凭据。

### 中文 ZIP 路径兼容

- 源码包包含中文文件或目录时，ZIP 主文件名必须直接写入 UTF-8，并设置 general-purpose bit 11；不要只依赖 `0x7075` Unicode Path Extra Field。
- 某些 Windows 打包器会把兼容主文件名写成 `#Uxxxx`，再把真实中文名放进 `0x7075` 扩展字段。Win10 工具可能显示正常，但 Linux Info-ZIP 可能解压成字面量 `#Uxxxx`。
- 在 Linux 接收这类包时，应使用可识别 Unicode Path Extra Field 的解压方式恢复中文名，再用标准 UTF-8 ZIP 重新打包。不要直接提交转义后的 examples 路径，也不要按正则盲目替换可能合法的文件名。
- 交付前检查 ZIP 清单、UTF-8 bit 11 和一次 Linux 实际解压结果；`examples/中国文学示例.mindmap`、`examples/古诗.mindmap` 与 `examples/MindMap Assets/古诗/唐诗.mindmap` 必须保持可读。

## AI 交付物同步规则

每轮代码修改完成后，必须使用同一个六位随机后缀同步生成并返回：完整源码 ZIP、Obsidian 本地测试安装 ZIP 和最新 Codex 交接 ZIP。生成 Codex 包前，应先更新项目衔接页中的当前状态、验证基线、待验证事项、下一步及最近交付包；不得复用上一轮 Codex 包。


## 页面切换与长任务维护边界

- 新增跨文件导航、整页模式或大文档结构操作时，必须接入 `beginPageTransition()` / `finishPageTransition()` 或 `navigateWithTransition()`，不得直接在点击回调中启动长时间同步克隆、序列化或布局。
- 状态必须在长任务前至少完成一次实际绘制；当前实现统一等待两个动画帧。不要用伪百分比，除非流程能够提供可靠总量。
- 多阶段任务只更新同一状态层的标题和说明，失败路径必须关闭遮罩并提示用户。
- 新页面动画只能用于明确的页面/模式切换，普通文字编辑和局部重绘不得反复淡入。减少动态效果下仍要保留可读状态和 `aria-busy`。

### 文章编号关闭语义

根节点的 `articleNumberingMode: "none"` 与普通节点语义不同：中心节点本身不显示编号，因此它代表当前物理导图的文章编号开关。文章正文、文章目录、导出和子文章页标题必须共同调用 `isDocumentArticleNumberingDisabled()`，不得各自回退到自动“第一章”；通读必须使用 `buildReadingArticleNodeInfo()` 和独立 `readingTocEntries`，只忽略中心节点关闭而继续尊重普通节点关闭与手动层级。通读目录完成跨文件标题分类后，正文必须调用 `reconcileReadingNodeInfo()` 合并同一 `filePath + nodeId` 的目录项，不能在子导图内再次独立决定节点是标题还是正文。

### 工具栏提示与模式边界

顶部工具栏按钮只保留 `aria-label`，由 Obsidian 显示统一黑底提示；不得同时写入 `title`，否则 Chromium 会额外显示白底原生提示。`collapse`、`collapse-all` 与 `fit` 仅在导图模式可见，模式切换时由 `updateModeUi()` 根据当前模式和用户可见项设置共同决定。节点链接通过节点内链接按钮或富文本锚点直接打开，不再维护独立的“打开节点链接”工具栏/右键命令。
