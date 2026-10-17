# obsidian-mindmap-studio 项目交接

- 插件：MindMap Studio（Obsidian 本地优先 .mindmap 导图，含导图/大纲/文章/通读模式、全局搜索、图床、AI 助手与桌面截图链路）。
- 版本基线：工作区版本文件为 1.55.8（Git Release 已发布 v1.55.8；上一轮导出冻结已入库为 `630c691`）；本轮为「仓库级清理空白节点」，交付追踪版本 1.55.8，交付后缀 274915。
- 仓库规则：见根目录 `AGENTS.md`；每轮代码交付三份 ZIP（源码 / 安装 / Agent 交接）共用同一六位后缀；验证入口 `npm run verify`。

## 当前状态（本轮：仓库级清理空白节点）

- 触发：用户要求「增加清理空白节点的选项」，并明确否决了画布右键/命令面板的方案，指定「设置页里一个统一的按钮，点击后清理当前仓库中所有空白节点」。
- 判定语义（集中在 `src/editor/node-actions.ts` 的纯函数 `isNodeEmpty()`）：只有「所有文字块都是空白，且没有图片、表格、代码、文件、题目、备注、标签、链接和子导图引用」才算空白节点；`task` 是已废弃兼容字段，不计入内容。带 `submap` 的节点即使内容为空也保留（删除会破坏父子导图引用）。
- 清理算法（`removeEmptyNodes(root)`）：显式栈遍历（深链不得递归），根节点永不清理，被清理节点的子节点在它原来的位置提升到父节点下并保持引用与顺序；连续空白链（A 空 → B 空 → C 有内容）在一次调用内解析完毕；有内容的节点不被替换或重建。返回实际删除数量。
- 入口链路（三层）：
  - `MindMapEditor.cleanEmptyNodes()`：先 `flattenNodes()` 预判「是否有非根空白节点」，无则直接返回 0，避免为无可清理内容的文档制造多余撤销快照与保存；有则走统一的 `mutate(…, null)`（撤销 + 保存链路），选中节点若被清掉则回退到根节点。新增只读探针 `get isReadOnly()`。
  - `MindMapStudioView.cleanEmptyNodes(): Promise<EmptyNodeCleanupResult>`（新增导出接口 `EmptyNodeCleanupResult { removed, skipped }`）：只读视图直接返回 `{ removed: 0, skipped: true }`，不静默跳过。
  - `MindMapStudioPlugin.cleanVaultEmptyNodes()`（`src/main.ts`）：遍历 `vault.getFiles()` 里全部 `.mindmap`，按路径匹配已打开的 `MindMapStudioView`——已打开必须走视图链路（否则写盘与视图内存状态不一致），未打开才 `vault.read()` → `parseDocument()` → `removeEmptyNodes()` → `vault.modify()`；回写沿用既有 vault modify 事件自动失效文档缓存并排队更新搜索索引；返回 `{ files, nodes, skipped }`。
- 设置入口（`src/settings.ts`「管理配置」分类，位于「检查插件更新」与「恢复初始配置」之间）：`setWarning()` 按钮「清理所有空白节点」+ `window.confirm` 二次确认（跨文件批量清理无法作为单文档撤销），执行中禁用按钮并显示「清理中…」，完成后 Notice 汇总 `已清理 N 个导图、共 M 个空白节点`，只读跳过时追加 `；另有 K 个只读导图已跳过`。
- 测试：新建 `tests/empty-node-cleanup.test.mjs`（9 条）——空判定正例/反例（图片、表格、代码、文件块、备注、链接、图标、标签、题目、子导图）、叶子删除计数、子节点原地提升（含引用同一个对象与顺序）、连续空白链一次解析、根节点永不清理、非空节点不被替换、2000 层深链无栈溢出、源码契约（显式栈、不得递归）。`scripts/test.mjs` 新增 9 条回归断言（纯函数存在性、`parent.children = kept`、`submap` 守卫、视图导出签名与只读 `skipped`、插件入口与打开/未打开分流、设置按钮文案）。已登记 `package.json` 的 `test:unit`。
- 验证：`npm run verify` 完整通过——`test:unit` **510 / 510**（新增 9 条）、`test:regression` 通过、`test:docs` **1348 处命名声明（64 个源模块）**、`test:repo` 通过、`tsc --noEmit` + production esbuild 通过；`docs/FUNCTION_REFERENCE.md` 已重新生成；文档同步 `docs/ARCHITECTURE.md`（新增「仓库级清理空白节点必须区分已打开与未打开导图」）、`docs/DEVELOPMENT.md`（空白节点清理三层排查规则）、`README.md`（管理配置说明）、`CHANGELOG.md`「未发布」。
- 待手工验证：真实 Obsidian 桌面端点击「设置 → 管理配置 → 清理所有空白节点」后，空白节点被删除且其子节点上提到原位置、有内容的节点不受影响、根节点保留；已打开导图清理后可撤销、内容与磁盘一致；只读导图被跳过且 Notice 正确汇总；大量 `.mindmap`（数百个）时按钮保持「清理中…」且界面不卡死。
- 下一轮候选（按价值排序）：① 让仓库级批量维护（清理空白节点、重建搜索索引）复用同一「已打开走视图 / 未打开走磁盘」的公共遍历器，避免后续维护操作重复实现；② 报告 P1 增量方向——`collectFileAssetPaths()` 的增量引用计数；③ `MutationDelta` / dirty 子树让 mutation 只更新受影响范围。

### 上一轮工作区（移动端适配核查 + 导出写入目标冻结）

- 触发：用户问「手机端匹配了吗、手机上 Obsidian 会不会视图异常」。本轮先做静态与运行核查，再修掉核查中发现的真实隐患。
- 核查结论（移动端适配，均为实测/产物证据，非推断）：
  - 构建产物 `main.js` 中 `new Worker` 出现次数 = **0**：`AsyncZipDeflate` / `AsyncUnzipInflate` 的 Worker 路径已被摇树移除。`URL.createObjectURL` 仅剩 2 处，且都属于既有桌面功能（JSON 导出下载链接、桌面截图），与本次分块链路无关。
  - `esbuild` `target: es2018`（`esbuild.config.mjs`），产物保留原生 `function* iterateArticleNodeInfo`、原生 `async/await`；生成器与 async 均为 ES2015/ES2017 语法，Obsidian 移动端 WebView（Android Chromium / iOS WKWebView 14+）原生支持。
  - `main.js` 中不存在模块作用域的 `require("node:*")` / `require("electron")`：桌面能力仍全部按需动态获取（`getNodeExportRuntime()` 在没有 `require` 时返回 null，`getElectronSaveRuntime()` 同理）。
  - 运行验证：删掉 `globalThis.Worker`、`globalThis.require`、`URL.createObjectURL`、`globalThis.process` 后重新构建（platform browser + target es2018）并执行——**Word 导出（5000 节点，document.xml 399868 字节，5 个 OOXML 部件齐全）与 XMind 导入（图片 1 张）都正常完成**。即两条分块链路在「无 Worker 的 WebView」里可用。
  - 移动端降级链：`manifest.json` 的 `isDesktopOnly` 为 `false`；导入导出弹窗的五个格式按钮（SVG/HTML/Word/PDF/Markdown）无条件创建，导出路径在移动端可达；Word 导出走 `saveDesktopExportFile()` → 无 `require` 时返回 null → 回退 `vault.createBinary()` 写入当前库；PDF 在移动端提示「PDF 导出仅支持 Obsidian 桌面端」（既有行为）。
- 修掉的真实隐患（本轮改动）：长异步导出期间写入目标会被重新读取。`exportArticleFamily()` 虽然一开始捕获了 `file`/`document`，但 `exportTextFile()` / `exportBinaryFile()` 在写入时再次读取 `this.file` / `this.document`；上一轮把导出改成持续让出主线程数秒后，用户在导出期间切换文件（移动端更容易发生）会导致产物写到**另一个导图旁边**并使用**错误文件名**。现在：
  - `view.ts` 新增模块级 `interface ExportWriteTarget { file: TFile | null; title: string | undefined }`，`exportArticleFamily()` 在开始时冻结 `target` 并传给三个写入调用（md / docx / html）。
  - 两个写入方法的 `target` 参数有默认值 `{ file: this.file, title: this.document?.title }`，因此无长异步等待的模态导出（SVG / JSON / Markdown 大纲）行为与旧实现完全一致。
  - 文件名解析抽为纯函数 `resolveExportBaseName(file, title)`（`src/utils/desktop-export.ts`），消除两处重复并补单测；语义与旧表达式 `file?.basename ?? this.document?.title ?? "思维导图"` 逐分支一致。
- 测试：`tests/desktop-export.test.mjs` 新增「`resolveExportBaseName` 优先冻结文件名、其次标题、最后兜底」5 个断言；`tests/docx-export.test.mjs` 契约断言增加冻结目标（`ExportWriteTarget` 结构、`const target: ExportWriteTarget = ...`、写入方法只读 `target.file` 且不再回读 `this.document`）与三处 `target` 传参；`scripts/test.mjs` 的对应断言同步为 `await this.exportBinaryFile("docx", docx, target)`。
- 验证：`npm run verify` 完整通过——`test:unit` **501 / 501**（新增 1 条）、`test:regression` 通过、`test:docs` 1341 处命名声明、`test:repo` 通过、`tsc --noEmit` + production esbuild 通过；`docs/FUNCTION_REFERENCE.md` 已重新生成；文档同步 `docs/ARCHITECTURE.md`（新增「导出的写入目标必须在长异步操作前冻结」「移动端可加载性是导出链路的硬约束」两条）、`docs/DEVELOPMENT.md`（新增导出冻结目标与移动端可加载规则）、`CHANGELOG.md`「未发布」。
- 移动端仍待真机验证（本轮只做了静态 + 隔离环境核查，**没有**在 Android / iOS 真机上跑过）：在手机上打开大型导图 → 导出 Word，界面应保持可交互且产物与桌面端一致；导出期间切换文件，产物应仍落在原导图目录并使用原文件名；XMind 导入大型归档时不应卡死。移动端 CPU 更弱，导出耗时预计是桌面的数倍（分批让出的批次大小是固定 2000 项/段，未按平台调整）。

- 触发：上一轮把 Word 打包（`zipSync`）迁出主线程后，用阶段探针实测 40k 节点单章节导出，发现残余阻塞全部集中在 `sectionInfos` 阶段 = 474.8 ms（`buildArticleNodeInfo()` 单次同步全量遍历；其余 toc 13.7 / body 88.4 / documentXml 11.5 / 已分块的 zip 255.7），即 `src/article/modes.ts` 是导出链路上最后一块无法让出的同步工作。本轮按同一「分块 + 让出主线程」模式收尾。
- 实现（`src/article/modes.ts`）：新增惰性迭代器 `export function* iterateArticleNodeInfo(root, baseDepth, leafNumbering, primaryText): Generator<ArticleNodeInfo, void, void>`，逐项产出与原实现**逐字段完全相同**的 `ArticleNodeInfo`；`buildArticleNodeInfo()` 改为 `Array.from(iterateArticleNodeInfo(...))` 的全量同步包装（渲染、HTML/Markdown 导出调用方零改动）。遍历用**显式栈**（新增非导出接口 `ArticleInfoFrame`：children/index/defaultLevel/siblingHasHeading/convertLeaves/numberedIndexes）实现，而不是递归 `yield*`——后者在深链导图上每产出一项都要穿透整条委托链，会退化为 O(节点数 × 深度)；显式栈同时消除了深树递归风险。遍历顺序仍是父先于子、同级左到右。
- 实现（`src/import/import-export.ts`）：新增常量 `EXPORT_ARTICLE_INFO_CHUNK_ITEMS`（2000 项）与 `EXPORT_BODY_CHUNK_PARAGRAPHS`（2000 段）。`sectionInfos` 改为用 `iterateArticleNodeInfo()` 按 2000 项分批拉取、批次之间 `await yieldToMainThread()`（章节之间同样让出），仍复用给正文循环与 `collectExportTocItems()` 的 `prebuiltInfos`；正文段落拼接改为 `for` 循环并按 2000 段让出（原 `sections.forEach` 无法 `await`）。
- 实测（隔离 Node，40k / 200k 末端节点单文件，预热后；「最长连续同步段」用探针包装 `yieldToMainThread()` 直接测量，「改动前」因整段同步、事件循环完全不执行，故等效阻塞 = 总耗时）：
  - 40k：最长连续同步段 **470 ms → 22 ms**；让出次数 58；总耗时 470 → 1130 ms。
  - 200k：最长连续同步段 **2973 ms → 78 ms**；让出次数 275；总耗时 2973 → 4263 ms。
  - `monitorEventLoopDelay` 复核（本轮）：40k 最大延迟 44.3 ms / p99 22.5 ms、200k 最大延迟 106.1 ms / p99 27.3 ms（改动前为 0.0 ms —— 全同步调用期间事件循环一次都不执行，直方图看不到）。
  - 总耗时上升是分批让出的预期代价（`setTimeout(0)` 在浏览器/Node 有 ~1–4 ms 钳制），换来的是主线程可控。
- 产物一致性核验（本轮真机外验证，不入库脚本）：以 `853998c`（v1.55.6，docx 改造前的同步 `zipSync` 实现）为参考，打包旧 `import-export.ts` + 旧 `modes.ts`，对同一份丰富文章族 fixture（父导图 + 挂载子导图 + 深层子导图 + 未挂载孤立章节 + `articleNumberingMode: none` + manual 层级节点 + 末端节点；`tocMaxDepth` 1/3/8 × 关闭编号/带圈/下一层序号三套选项 = 9 组）比对：**HTML、Markdown 字符串完全一致，`.docx` 每个 OOXML 部件逐字节一致**；`iterateArticleNodeInfo()` 与旧 `buildArticleNodeInfo()` 在 3 套编号选项 × baseDepth 0/1/3 共 9 组上逐字段一致；6000 层深链迭代产出 6000 项、无栈溢出（旧实现递归，深链会溢出）。
- 测试：新建 `tests/article-node-info-stream.test.mjs`（4 条）——迭代器与全量版逐字段一致（4 套编号选项 × 3 个 baseDepth）；**惰性**（注入计数 `primaryText`，拉取 1 项只调用 1 次，不遍历整棵树）；6000 层深链无栈溢出且逐项产出；源码契约（`export function*`、显式栈、`buildArticleNodeInfo` 是包装、代码中不得出现 `yield*`）。`tests/docx-export.test.mjs` 增至 6 条（新增「大型导出不得同步跑完」——`await Promise.resolve()` 后仍未结束；契约断言补两个新常量与两处分批让出）。`tests/article-content-block.test.mjs` 的源码契约断言改为 `frame.defaultLevel`。均已登记 `package.json` 的 `test:unit`。
- 验证：`npm run verify` 完整通过——`test:unit` **500 / 500**（新增 5 条）、`test:regression` 通过、`test:docs` 1339 处命名声明、`test:repo` 通过、`tsc --noEmit` + production esbuild 通过；`docs/FUNCTION_REFERENCE.md` 已重新生成；文档同步 `docs/ARCHITECTURE.md`（新增「文章节点信息提供惰性迭代器」「Word 导出按批让出」两条）与 `docs/DEVELOPMENT.md`（长遍历必须走 `iterateArticleNodeInfo()`），`CHANGELOG.md`「未发布」已更新。
- 待手工验证：真实 Obsidian 桌面端导出大型文章族（Word）期间界面应保持可交互（含滚动、切换视图），导出完成后 Notice 与产物与上一版一致；导出大文档过程中不应出现「界面卡住数秒」的体感。可顺带确认 HTML / Markdown / PDF 导出行为不变。
- 下一轮候选（按价值排序）：① 报告 P1 增量方向——`collectFileAssetPaths()` 的增量引用计数（或把「取消延迟删除」改为宿主在到期时查询打开视图的未保存引用），注意附件误删属数据丢失类风险，需保守设计；② `MutationDelta` / dirty 子树让 mutation 只更新受影响范围；③ 保存链路 `mutate() → notifyDocumentChange() → history.createSnapshot()` 与 `TextFileView.getViewData()` 的同步契约（在不动这两处前，保存前整文档 `JSON.stringify` 无法迁出主线程）。

### 上一轮工作区（Word 导出的文章节点信息改为惰性迭代 + 分批让出）

- 触发：上一轮把「XMind 解压迁出主线程」标为已完成，并在下一步里留下「导出/保存链路的阻塞操作」。本轮按同一模式处理导出链路的同步打包：`src/import/import-export.ts` 的 `readingSectionsToDocx()` 此前用一次 `zipSync()` 完成整份 `.docx` 压缩，大型文章族（正文 XML 可达数十 MB）期间主线程完全冻结。
- 实现（`src/import/import-export.ts`）：
  - 新增 `writeArchiveChunked(entries)`：改用 `fflate` 的流式 `Zip` + `ZipDeflate`，逐条 `add()` 后把每个条目的内容按新常量 `EXPORT_ZIP_CHUNK_BYTES`（256 KiB）分批 `push()`，批次之间 `await yieldToMainThread()`（新提取的共享边界，XMind 解压循环也改为复用它）。主线程单次最多压缩一批，条目顺序、条目名与未压缩内容与旧实现完全一致，产物仍是标准 ZIP（条目写入 data descriptor）。
  - 目录与正文此前各跑一遍整棵子树的 `buildArticleNodeInfo()`；现在按章节预建一次 `sectionInfos`（章节之间 `await`），正文循环与 `collectExportTocItems()` 复用同一份（该函数新增可选第 5 参 `prebuiltInfos`，不传时行为不变，HTML/Markdown 导出仍按需构建）。
  - 契约变化：`readingSectionsToDocx()` 改为 `Promise<Uint8Array<ArrayBuffer>>`；`src/view.ts` 的 `exportArticleFamily()` 改为 `const docx = await readingSectionsToDocx(...)` 再 `await this.exportBinaryFile("docx", docx)`；`scripts/test.mjs` 3 处调用改 `await`，源码契约断言改为新的调用形式并新增「必须先 await 再交给 exportBinaryFile」断言。
- 设计取舍：未采用 `AsyncZipDeflate`——它在缺少 `Worker` / `URL.createObjectURL` 的环境会直接抛错，移动端 WebView 有风险；分块 + 块间让出在桌面端、移动端与 Node 测试环境行为一致（与上一轮 XMind 解压同一标准）。
- 实测（隔离 Node 20+/22 环境，40k / 200k 末端节点单章节，预热后）：
  - 改动前 40k：总耗时 1611 ms，**最长连续主线程阻塞 = 整个导出 1611 ms**；改动后：总耗时 1168 ms，最长阻塞 924 ms（残余 = 该章节单次 `buildArticleNodeInfo()` 遍历）。
  - 改动前 200k：总耗时 6621 ms，最长阻塞 6621 ms；改动后：总耗时 4746 ms，最长阻塞 3594 ms。
  - 分块压缩本身：2.1 MB 正文 XML 整块 `push` 需 89.7 ms，按 256 KiB 分块后单批最长 19.4 ms。
  - `buildArticleNodeInfo()` 为线性：5k 65 ms / 40k 310 ms / 80k 639 ms（≈8 µs/节点），是当前残余阻塞的唯一来源，且位于 `src/article/modes.ts`（文章渲染与三种导出共用），未在本轮改动。
- 产物一致性核验（本轮真机外验证，不入库脚本）：用 `git show HEAD:src/import/import-export.ts` 打包旧实现，与新实现对同一份丰富文章族 fixture（父导图 + 挂载子导图 + 深层子导图 + 未挂载孤立章节 + `articleNumberingMode: none` + 备注 + 末端节点；`tocMaxDepth` 1/3/8 × 默认/带圈编号两套选项，共 6 组）逐字节比对，**每个 OOXML 部件的未压缩内容与条目顺序全部一致**（PARITY OK），目录超链接锚点与书签顺序也完全一致。另用 Python `zipfile`（独立实现）读取 40k 节点产物：`testzip()` 全部条目 CRC 通过、5 个部件顺序正确、`word/document.xml` 3.71 MB 解压为 40004 段并可被 `ElementTree` 解析。
- 测试：新建 `tests/docx-export.test.mjs`（5 条）——异步契约；OOXML 部件与顺序不变；5000 段落跨多个 256 KiB 批次的逐字与顺序一致性（并断言未压缩 XML > 256 KiB 以确保真的走了多批路径）；跨文件子导图章节在单次构建路径下仍生成目录超链接（4 条链接全部有对应书签）；源码契约（`export async function`、`EXPORT_ZIP_CHUNK_BYTES`、流式 5 步、`sectionInfos` 复用、`view.ts` 的 await 顺序、`zipSync` 已完全移除）。已登记到 `package.json` 的 `test:unit`。
- 验证：`npm run verify` 完整通过——`test:unit` **495 / 495**（新增 5 条）、`test:regression` 全部通过、`test:docs` 1337 处命名声明、`test:repo` 通过、`tsc --noEmit` + production esbuild 通过；`docs/FUNCTION_REFERENCE.md` 已重新生成；文档同步 `docs/ARCHITECTURE.md`（新增「归档打包导出同样分块让出主线程」与「Word 导出对每个章节只构建一次节点信息」两条，更新模块表与第 10 节）、`docs/DEVELOPMENT.md`（归档导入/导出排查规则）与 `CHANGELOG.md`「未发布」。
- 待手工验证：真实 Obsidian 桌面端对大型文章族导出 Word（导出 → 选择保存位置）时界面不应长时间无响应，导出进度提示与完成 Notice 正常；导出产物用 Word / WPS 打开应正常显示目录超链接、章节书签、带圈末端编号与正文缩进（与上一版一致）；多文件文章族（父导图 + 若干子导图）导出后目录项与正文顺序不变。

### 上一轮工作区（XMind 归档解压迁出主线程）

- 触发：上一轮 P0 批次把「XMind 解压迁出主线程」明确留作后续项，本轮回填该项。
- 实现（`src/import/import-export.ts`）：`readArchiveWithLimits()` 拆成两步。(a) 新增 `assertArchiveWithinLimits()`，用 `unzipSync(bytes, { filter: (file) => { assertArchiveBudget(budget, file.originalSize); return false; } })` 只读中央目录校验条目数 `ARCHIVE_MAX_ENTRIES`（4096）、单条解压后 `ARCHIVE_MAX_ENTRY_BYTES`（64 MiB）、解压总量 `ARCHIVE_MAX_TOTAL_BYTES`（256 MiB）：`filter` 返回 false 时 `fflate` 会完全跳过该条目的解压，因此解压炸弹仍在产生任何解压输出之前被拒绝。(b) 用 `fflate` 的 `Unzip` 流式解压器（注册 `UnzipInflate`）按 `ARCHIVE_UNZIP_CHUNK_BYTES`（256 KiB）分批 `push(bytes.subarray(...), end >= bytes.length)`，每批之间 `await new Promise((resolve) => setTimeout(resolve, 0))` 让出一次宏任务；`onfile` 中按实际产出累计校验单条 64 MiB 上限，并用 `concatArchiveChunks()` 合并分块输出。主线程单次只处理一批压缩输入，大 `content.json` + 多张图片的 XMind 导入不再一次性阻塞界面。
- 契约变化：`readArchiveWithLimits()`、`xmindToImportResult()`、`xmindToDocument()` 均改为 `async`（返回 `Promise`）。调用方同步更新：`src/editor/editor-modals.ts` 的 `parseXMind()` 内改为 `await xmindToImportResult(source, fallbackTitle)`（该方法本就在异步上下文，导入进度条时序不变）；`scripts/test.mjs` 5 处、`tests/xmind-import.test.mjs` 6 处调用改为 `await`，两条炸弹用例由 `assert.throws` 改为 `await assert.rejects`，`tests/import-mode.test.mjs` 的源码契约断言改为 `export async function` 与 `await xmindToImportResult(source, fallbackTitle)`。
- 设计取舍：未采用 `fflate` 的 Worker 版 `AsyncUnzipInflate` / 异步 `unzip()`——前者在缺少 `Worker`、`URL.createObjectURL` 的环境会直接抛错（Node 测试面与移动端 WebView 都有风险），后者的 `su < 524288 || sc > 0.8 * su` 分支对已压缩图片资源仍走主线程 `inflateSync`，对真实 XMind 归档收效有限。分块流式 + 块间让出在桌面端、移动端与 Node 测试环境行为一致，且不引入新依赖。
- 测试：`tests/xmind-import.test.mjs` 新增 2 条——异步契约（`xmindToImportResult()` 返回 `Promise`）与多批次逐字节一致性（700 KB 资源跨多个 256 KiB 批次）；原有 5 条行为用例改为 `await` 后保持通过。
- 验证：`npm run verify` 完整通过——`test:unit` **490 / 490**、`test:regression` 全部通过、`test:docs` 1334 处命名声明、`test:repo` 通过、`tsc --noEmit` + production esbuild 通过；`docs/FUNCTION_REFERENCE.md` 已重新生成；文档同步 `docs/ARCHITECTURE.md`（「XMind 归档解压设上限并分块让出主线程」）与 `CHANGELOG.md`「未发布」。
- 待手工验证：真实 Obsidian 桌面端导入大型 XMind（含多张图片资源）时界面不应长时间卡死；导入进度提示（读取 → 解析 XMind 画布和主题 → 提取图片资源 → 生成思维导图）仍按顺序刷新；正常与缺图 XMind 的导入结果与上一版一致；解压炸弹归档被拒绝时给出明确错误提示而非静默失败。

### 上一轮工作区（大型文档性能与健壮性 P0 批次）

- 触发：用户上传第三方深度研究报告（大型文件性能、代码问题与未来方向），并授权「开始优化」，落地报告 P0 清单。
- (1) 核心树遍历迭代化：`src/core/node-tree.ts` 的 `walkNodes()` / `findAncestors()` / `removeNode()`、`src/core/model.ts` 的 `normalizeNode()`、`src/search/global-search.ts` 的 `buildSearchEntries()` 全部改为显式栈前序遍历（逆序入栈子节点，出栈即访问，保持父先于子与同级左→右）。根因确认：V8 的 `JSON.parse` 是迭代实现（实测 20 万层不抛错），栈溢出真正来自递归的 `normalizeNode`，数千层深链文档会抛 `RangeError`。`model.ts` 拆出 `normalizeNodeFields()` 造单节点、`normalizeNode()` 用栈帧 `{ source, target }` 逐层展开子树。
- (2) JSON 解析错误与规范化错误分类：`parseJsonDocument()` 改为只吞 `SyntaxError`（`catch (error) { if (error instanceof SyntaxError) return null; throw error; }`），合法 JSON 的规范化异常直接抛出。旧实现 `try { return normalizeDocument(JSON.parse(...)) }` 的宽泛 `catch` 会把深链合法 JSON 的栈溢出误判为「非 JSON」并静默降级为 Markdown 导入，表现为根节点文字变成整段原始 JSON。`parseDocument()` 的 JSDoc 同步说明「只有 JSON 语法错误才按 Markdown 导入」。
- (3) 取消每次 mutation 的全树附件扫描：`editor-types.ts` 新增可选回调 `hasPendingFileAssetDeletions?: () => boolean`（含 JSDoc），`view.ts` 注入 `() => this.plugin.hasPendingFileAssetDeletions()`，`main.ts` 实现 `return this.pendingFileDeletionTimers.size > 0`；`MindMapEditor.notifyDocumentChange()` 改为 `if (this.callbacks.hasPendingFileAssetDeletions?.() !== false) { this.callbacks.onCancelFileAssetDeletion(...) }`。采用保守门控（未做增量引用计数，避免失同步），未实现回调的宿主仍按「可能有」处理，行为与旧版一致。
- (4) 撤销历史总字节预算：`src/editor/history-manager.ts` 新增模块常量 `HISTORY_BYTE_BUDGET = 128 * 1024 * 1024` 与私有字段 `undoBytes`（只跟踪 `undoStack`，在 `captureSnapshot` / `undoSnapshot` / `redoSnapshot` / `reset` 处同步增减）；构造函数第二参数 `byteLimitProvider` 默认返回该预算，`trim()` 同时施加条数上限与字节上限（字节超限从最旧一端裁剪，且至少保留一份快照）。未新增设置项，对 ~1MB 常规文档不触发。
- (5) XMind 解压炸弹限制：`src/import/import-export.ts` 新增 `ARCHIVE_MAX_ENTRIES = 4096`、`ARCHIVE_MAX_ENTRY_BYTES = 64 MiB`、`ARCHIVE_MAX_TOTAL_BYTES = 256 MiB` 与 `readArchiveWithLimits()`，在 `unzipSync(bytes, { filter })` 内累计条目数与解压体积并超限抛错（`filter` 在解压每个条目前被调用，抛错直接向上传播）；`xmindToImportResult()` 首行改用该函数。该轮保留了同步 API（`tests/xmind-import.test.mjs` 有 5 处同步调用），「解压迁出主线程」留作后续项，已在下一轮（当前状态）改为分块流式异步解压。
- 测试：`tests/node-tree.test.mjs` 新增 60000 层深链遍历契约；新建 `tests/model-parse-safety.test.mjs`（4 条：20000 层规范化、20000 层合法 JSON 保持节点树、仅语法错误回退 Markdown、`parseJsonDocument` 源码契约）；`tests/history-snapshot-reuse.test.mjs` 新增 3 条字节预算契约；`tests/xmind-import.test.mjs` 新增 2 条归档上限契约；`tests/file-block.test.mjs` 新增附件扫描门控契约；`tests/global-search-traversal.test.mjs` 新增 4000 层深链 + 显式栈源码契约。`package.json` 的 `test:unit` 已登记新测试文件。
- 验证：`npm run verify` 完整通过——`test:unit` **488 / 488**、`test:regression` 全部通过、`test:docs` 1330 处命名声明、`test:repo` 通过、`tsc --noEmit` + production esbuild 通过；`docs/FUNCTION_REFERENCE.md` 已重新生成；文档同步 `docs/ARCHITECTURE.md`（新增「大型文档鲁棒性与资源上限」小节）与 `CHANGELOG.md`「未发布」。
- 待手工验证：真实 Obsidian 打开含大量节点/附件的 `.mindmap` 应无卡顿，编辑、撤销、重做后附件 60 秒延迟回收仍能正常取消；导入正常 XMind 文件不受新上限影响；深链（数千层）导图能正常打开且不再退化为纯文本（根节点文字不应变成整段 JSON）。

### 上一轮工作区（修复文章模式 Ctrl/Cmd+Enter、Ctrl/Cmd+Tab 新建节点丢失焦点）

- 用户反馈（真实 Obsidian）：文章模式在节点行内编辑时按 Ctrl/Cmd+Enter 会创建兄弟节点、Ctrl/Cmd+Tab 会创建子节点，但新节点没有获得焦点，也没有进入编辑状态；期望新节点立即处于行内编辑。
- 根因：`addChild()` / `addSibling()`（`src/editor/editor.ts:5001` / `:5026`）调用 `mutate(action)` 时未传 `restoreLocation`，于是 `mutate` 按当前模式捕获**变更前**的 `ReadingLocation` 并在函数末尾恢复；文章模式的 `renderArticle()` → `renderWindow()` 内部还会再次用 `previousLocation`（`captureCurrentLocation("article")`，只能取到旧 DOM 中的来源节点）恢复。两处恢复都会执行 `this.selectedId = resolved.nodeId`，把 `action` 里刚写入的新节点选择覆盖回来源节点，`focusCreatedStructureNode()` 的守卫 `if (!this.nodeById(nodeId) || this.selectedId !== nodeId) return;` 随即直接放弃，新节点既不滚入视口也不进入行内编辑。导图模式本就传 `null`（不恢复）所以正常，只有文章模式（以及大纲模式的 mutate 后恢复）受影响。
- 修复一（跳过旧位置恢复）：`addChild()` / `addSibling()` 现在显式向 `mutate()` 传入 `null`，即文档中已定义的「不动阅读位置」语义，不再用变更前位置覆盖新选择。导图模式行为不变，大纲模式新建节点也因此重新获得聚焦。
- 修复二（文章渲染锚定新节点）：新增 `pendingStructureFocusNodeId` 字段与 `markStructureFocusTarget(nodeId)`（仅文章模式记录），`renderWindow()` 在计算恢复位置前一次性读取并清空它，用 `createReadingLocation(this.readingLocationSections(), this.options.currentFilePath, id, 0, 0.5)` 生成 `structureFocusLocation`，恢复链变为 `structureFocusLocation ?? latestRequestedLocation ?? previousLocation ?? rebuildLocation ?? lastReadingLocation`。新节点因此成为语义锚点并被 `restoreReadingLocation` + `holdArticleAnchor` 保持在视口内（分帧补载结束后仍保持）；如果文章窗口始终渲染不出该节点（例如 `articleContextReady` 未就绪），`focusCreatedStructureNode()` 在放弃时会清空该标记，避免它被之后某次无关渲染误消费。
- 测试：`tests/article-node-shortcuts.test.mjs` 新增 2 条行为契约——从 `main.js` 提取真实的 `addChild` / `addSibling` / `markStructureFocusTarget` / `focusCreatedStructureNode` 执行，用一个「文章渲染会按旧位置恢复并覆盖 `selectedId`」的 `mutate` 模拟，断言创建必须传 `null`、新节点保持选中且 `bringNodeIntoView` / `beginInlineEdit(id, undefined, true)` 都以新节点调用；另加 1 条源码契约锁定 `renderWindow` 对 `pendingStructureFocusNodeId` 的消费与恢复链顺序。两条行为契约在修复前对旧 `main.js` 实测失败（`restoreLocation: undefined`），修复后通过。`tests/incremental-render.test.mjs`、`tests/reading-editor-contract.test.mjs` 中锁定恢复链顺序的断言同步改为新表达式。
- 验证：`npm run verify` 完整通过——`test:unit` **475 / 475**、`test:regression` 全部通过、`test:docs` 1327 处命名声明、`test:repo` 通过、`tsc --noEmit` + production esbuild 通过；`docs/FUNCTION_REFERENCE.md` 已重新生成；文档同步 `docs/ARCHITECTURE.md`（新增“创建即导航”例外与锚点规则）与 `CHANGELOG.md`。
- 待手工验证：真实 Obsidian 文章模式行内编辑时 Ctrl/Cmd+Enter 应在来源节点后创建兄弟节点并立即滚入视口、进入行内编辑；Ctrl/Cmd+Tab 应创建子节点并同样聚焦（首次聚焦不丢）；大纲模式新建节点也应进入行内编辑；导图模式 Tab/Enter 行为保持不变；连续快速创建多个节点时视口不回跳。

### 上一轮工作区（修正 test:regression 中过期的节点聚焦契约，仅测试）

- 现象：`npm run verify` 在 `test:regression`（`scripts/test.mjs`）报错退出，断言位于 `scripts/test.mjs:1561`，期望正则 `/this\.bringNodeIntoView\(node\.id\);\s*\n\s*(?:this|ctx)\.beginInlineEdit\(node\.id, undefined, true\)/` 匹配 `editorSource`（由 `tests/helpers/editor-sources.mjs` 拼接的编辑器源码）失败（`operator: 'match'`，进程退出码 1）。
- 根因：该断言停留在重构前的即时写法 `requestAnimationFrame(() => { this.bringNodeIntoView(node.id); this.beginInlineEdit(node.id, …) })`；当前源码已把「新建节点聚焦」收敛进 `MindMapEditor.focusCreatedStructureNode(nodeId)`，函数体使用形参 `nodeId`（`this.bringNodeIntoView(nodeId);` + `this.beginInlineEdit(nodeId, undefined, true);`），因此 `node.id` 已不再出现。
- 修复（仅测试契约，未改运行时代码）：把 `scripts/test.mjs:1561` 的 `node\.id` 改为 `nodeId`，与 `tests/node-creation-focus.test.mjs:23`、`tests/node-creation.test.mjs:57` 中已在用的 `nodeId` 断言一致。语义不变，仍锁定「新建 Tab/Enter 节点先滚入视口、再保护首次聚焦行内编辑」。
- 验证：`npm run verify` 完整通过——`test:unit` 472/472、`test:regression` 全部通过、`test:docs` 1326 处命名声明、`test:repo` 通过、`tsc --noEmit` + production esbuild 通过。该轮无插件源码改动。

### 上一轮工作区（折叠代码块惰性渲染，修复万行代码卡死）

- 用户反馈（附 23 条调试日志）：打开 `浏览器/油猴.mindmap`（242 KB）会卡死数秒；补充关键线索——其中一个节点含接近 1 万行的代码块、默认折叠，「父节点一展开就会卡死」。
- 根因（`src/render/code-block.ts`）：折叠分支虽然把正文塞进 `<details class="mms-code-collapsed">`（`display: none`），却仍然立即 `await options.renderMarkdown(buildFencedCodeMarkdown(block), target)`。也就是说**不可见的正文照样走完整的 Markdown 解析与 Prism 语法高亮**：万行级脚本要为每行切出成百上千个 token 元素并触发样式计算，主线程被冻结数秒。日志中 454 ms 之后到 14 s 无任何事件，正是这段同步渲染；与「展开父节点（让该节点可见）即卡死」完全吻合。
- 修复一（惰性渲染）：`renderCodeBlock()` 折叠分支现在只创建 `<details>` / `<summary>` / `.mms-code-collapsed-content` 外壳并立即返回；首次 `toggle` 展开时才真正渲染，用 `requested` 标记保证只渲染一次（重复折叠/展开不重复解析）。`renderNodeCode()` 既有的 `toggle` 监听（`requestMindMapLayoutAnimation()` + `scheduleMeasuredMindMapLayout()`）在返回的 Promise 之后注册，时序不变；内容渲染完成后由节点级 `ResizeObserver` 再校正一次高度。
- 修复二（高亮上限）：新增 `SYNTAX_HIGHLIGHT_MAX_LINES = 2000`，超过该行数的代码块渲染时去掉语言围栏（`language: undefined`），让高亮器直接跳过词法分析。内容、逻辑行数、行号栏、复制与编辑行为都不变，只是不再着色——展开万行代码块也不会再卡死。
- 观测：`src/view.ts` 的 `onRenderCode` 包装现在记录 `render / code-block-render`（`lines`、`elapsedMs`），修复后折叠块耗时接近 0 ms，可作为回归判据。
- 测试：`tests/code-block.test.mjs` 新增 2 条行为契约（9000 行折叠块在展开前 `renderMarkdown` 调用次数必须为 0、首次展开只渲染一次且去掉语言围栏、展开后行号与 `data-line-count` 正确；小折叠块保持惰性且展开后仍保留语言围栏），并为 fake DOM 补 `addEventListener` / `dispatch`；`view.ts` 回调断言同步更新为新包装。
- 文档：`docs/CODE_BLOCK_RENDERING.zh-CN.md` 新增第 13 节并补充第 10/11 节断言与验收项；`docs/ARCHITECTURE.md` 的 `code-block.ts` 条目与 3.3 代码块渲染流程同步说明折叠惰性渲染与高亮上限；`CHANGELOG.md`「未发布」新增一条。
- 验证：`npm run verify` 通过（单元 462 条、文档 1319 处声明、仓库检查、生产构建）。
- 待手工验证：(1) 打开该 242 KB 导图应立刻可用（展开含万行代码块的父节点不再卡顿）；(2) 首次展开该代码块时内容完整、行号正确、可复制、可再次编辑保存，只是不再着色；(3) 折叠/展开反复切换不重复解析，节点框高与相邻节点避让正常；(4) 打开调试模式后导出日志，`render / code-block-render` 中折叠块耗时应在毫秒级。

### 上一轮已发布（v1.54.9，提交 `b81df52` / `b57902f`：管理配置折叠行缩进对齐）

- 用户反馈（附截图，红框圈出「管理配置」中折叠的「设置分类排序」行）：「缩进，这个折叠的，和外部处于同一列。应该缩进一下」。
- 根因：`.mms-settings-category-order` 是一个独立 `<details>`（带上下分隔线），但它的 `summary` 和展开内容此前只做了纵向间距（`padding: 10px 0` / `margin: 0`），没有任何水平内边距，于是折叠三角与文字贴齐了分组标题「管理配置」那一列，与同组 `setting-item` 的文字列（Obsidian 默认 16px 内边距）错位。
- 实测定位（截图 1538×1022、DPR≈2，Python + PIL 像素测量）：设置卡片左边缘 x=68、卡片内文字 x=101；该 `details` 边框盒左边缘 x=68、`summary` 三角 x=68、文字 x=110；分组标题「管理配置」的折叠标记 x=69 → 证实三角与分组标题同列。
- 修复（`styles.css` 第 5567–5589 行区块）：`.mms-settings-category-order > summary` 的 `padding: 10px 0` → `10px 16px`；新增 `.mms-settings-category-order > :not(summary) { margin-left: 16px; margin-right: 16px; }` 让展开后的说明、`恢复默认顺序` 与各分类上下箭头一起缩进；`.mms-settings-category-order > .setting-item-description` 的 `margin: 0 0 6px` → `margin: 0 16px 6px`。`.mms-settings-category-order` 自身的边框盒不变，因此上下分隔线仍与相邻设置卡片等宽，只缩进内容不动边框。
- 测试：`tests/settings-layout.test.mjs` 的 `management section leads with category order and ends with the destructive reset` 末尾新增 3 条 CSS 契约断言（`summary` 必须为 `padding: 10px 16px`、非 summary 子项必须左右 `margin: 16px`、说明段必须为 `margin: 0 16px 6px`），与原有的「管理配置顺序」断言一起锁定该分组。
- 文档：`CHANGELOG.md`「未发布」第 7 条补充折叠行与展开内容一起缩进 16px 的说明。
- 验证：`npm run verify` 通过（单元 460 条、文档 1319 处声明、仓库检查、生产构建）。本轮只有 CSS 改动，`main.js` 无变化。
- 待手工验证：真实 Obsidian 桌面端打开插件设置 →「管理配置」，折叠的「设置分类排序」三角与文字应与「调试模式」等条目处于同一缩进列（不再贴齐分组标题）；展开后「恢复默认顺序」与各分类上下箭头同样缩进；上下分隔线仍与相邻设置卡片等宽。

### 上一轮已发布（v1.54.7 / v1.54.8，提交 `a8695ee`、`da27331`、`1394cb6`：代码编辑弹窗整合 + 输入框高度 + 排序置顶）

- 用户反馈（附截图）：「插入或编辑代码」弹窗里的「识别 fenced code」按钮“和其它部分像是不一致，太突兀”，并询问 fenced code 是什么。
- 该按钮的用途：把用户整体粘贴进来的 ```` ```语言 … ``` ```` 围栏文本拆成「代码语言 + 代码内容」两段（`parseFencedCode()` 取语言并去掉围栏）。它只是**即时反馈**——保存时 `CodeEditModal` 本来就会调用同一个 `parseFencedCode()`，所以不点它也不会把 ``` 写进代码内容。
- 突兀的根因：按钮此前用 `this.contentEl.createEl("button", …)` 直接挂在弹窗中段、「显示设置」卡片下方，既不属于任何字段行，也没有类名，沿用 Obsidian 默认按钮的描边与尺寸，与上方卡片、下方 `.mmc-modal-actions` 操作栏风格割裂。
- 修复（`src/editor/content-modals.ts`）：「代码内容」字段改为 `.mmc-code-field` 包裹（标题行 `.mmc-code-field-header` + textarea）；识别按钮改名为「识别粘贴的代码块」并以 `mmc-code-detect` 并入标题行右侧；标题 `<label>` 用 `newId()` 生成的 id + `for` 关联 textarea，保留点击标题聚焦输入框的行为。
- 样式（`styles.css`）：新增 `.mmc-code-field`（与 `.mmc-code-modal > label` 同间距的纵向布局）、`.mmc-code-field-header`（两端对齐）、`.mmc-code-detect`（小字号 `--font-ui-smaller`、透明底、`--background-modifier-border` 描边、`--text-muted` 文字，hover 用 `--background-modifier-hover`），按钮不再使用默认按钮外观。
- 文案：输入框占位符与失败提示里的 “fenced code block” 改为「代码块」，成功提示改为「已识别语言并去除围栏」。
- 高度（同一轮的第二条反馈）：输入框默认高度由 `rows = 18` 降为 `rows = 10`，并在 `styles.css` 为 `.mmc-code-textarea` 增加 `max-height: min(35vh, 300px)`，让标题、两个字段、“显示设置”卡片与「取消 / 保存代码」在常见窗口高度下同屏可见、不必下滑；`resize: vertical` 保留，拖拽结果同样受 `max-height` 约束，界面缩放/字体放大时不会重新撑出滚动。
- 设置分组（同一轮第三条反馈，已确认方案）：把「管理配置 → 设置分类排序」上移为分组第一项，顺序变为 设置分类排序 → 调试模式 → 导出配置 → 导入配置 → 检查插件更新 → 恢复初始配置。理由：它只调整界面分类顺序，属于偏好类入口；带警告样式的破坏性操作「恢复初始配置」恢复为真正的分组末项，不再被可展开面板隔断。实现只是把 `categoryOrder` 这段 `<details>` 移到 h3 之后（`src/settings.ts`）。
- 测试：`tests/code-block.test.mjs` 新增 1 条契约（识别按钮位于 `.mmc-code-field-header` 内、旧的独立按钮不再存在、`保存代码` 仍会 `parseFencedCode(code)`、CSS 保留两端对齐与小字号次要按钮样式、输入框为 10 行且带 `min(35vh, 300px)` 上限）；`tests/settings-layout.test.mjs` 新增 1 条契约锁定「管理配置」顺序（设置分类排序最先、恢复初始配置最后，并校验构建产物一致）。
- 文档：`docs/CODE_BLOCK_RENDERING.zh-CN.md` 新增第 12 节说明入口用途、整合原因与“一屏完成编辑”的高度约束，并在第 10/11 节补充断言与手动验收项；`CHANGELOG.md`「未发布」新增两条条目。
- 验证：`npm run verify` 通过（单元 460 条、文档 1319 处声明、仓库检查、生产构建）。
- 待手工验证：(1) 真实 Obsidian 桌面端打开「插入或编辑代码」弹窗，确认“显示设置”与「取消 / 保存代码」无需下滑即可看到、识别按钮位于“代码内容”标题行右侧且风格与卡片/操作栏一致；粘贴完整 ``` 代码块后点它应填入语言并去掉围栏，不点直接保存也应得到同样结果；输入框仍可向下拖高。(2) 打开插件设置，「管理配置」中「设置分类排序」应位于分组最上方，展开后调整顺序、点「恢复默认顺序」均正常，「恢复初始配置」仍在最下方。

- 上一轮（1.54.5，已发布 `1cf6531`；本地图片换成同名其它格式后自动重新识别引用 + 显示兜底）
- 用户需求：同一张本地图片被转成其它格式（png → svg、png → jpg 等）并覆盖原文件后，导图里的旧引用断链，希望不必逐张手动替换；确认方案为「自动兜底 + 自动写回 + 设置开关（默认开启）」，匹配范围「同目录优先，其次全库」。
- 新增纯逻辑 `src/core/image-relink.ts`：`IMAGE_RELINK_EXTENSIONS`（svg 优先，其后 png/jpg/jpeg/webp/gif/bmp/avif/ico）、`localImageReferenceTarget()`（解析裸路径，支持 `![[图.png|别名]]` 与 `#锚点`，远程 http/data/blob 返回 null）、`findImageRelinkTarget()`（主干忽略大小写相同、扩展名必须不同、同目录优先其次全库、同层按扩展名优先级）、`relinkImageBlock()`（改写 `source`/`localSource`/图片级 `sourcePriority` 中的本地引用，远程镜像与 `contentHash` 不变；同一主干一次调用只解析一次）、`relinkDocumentImages()`（遍历整档，经 `replaceNodeContentBlocks()` 写回）。
- 显示兜底（`src/view.ts` `resolveImage()`）：原路径解析失败时先按重新识别到的文件渲染，图片立即可见；覆盖只读、未保存与打开期间才被替换的场景。
- 自动写回：`setViewData()` 末尾调用 `MindMapView.relinkMissingImageFiles()` → `MindMapEditor.relinkMissingImageFiles()`。该方法与 `applyImageUploadPatches()` 同属「后台自动纠正」：只更新文档模型 + `notifyDocumentChange("none")` + `markSaving()`，**不 render()**（显示已正确，重绘会扰动文章补载、阅读位置恢复与其它图片加载状态），随后由 View 保存并提示「已按同名文件重新识别 N 张图片」。
- 插件层（`src/main.ts`）：`findImageRelinkTarget(missingPath)` 在开关关闭、原文件仍存在（用户保留旧文件）或没有同名候选时返回 null，因此不会覆盖用户有意保留的图片；`getVaultImagePaths()` 惰性缓存仓库图片路径，仓库图片文件 create/delete/rename 时失效。
- 设置（`src/settings.ts`）：新增 `autoRelinkImageFormats`，默认 `true`，面板项「同名图片自动重新识别」放在「图片与图床」分区，位于「远程图片自动故障转移」组之后。
- 测试：新增 `tests/image-relink.test.mjs`（8 条：同目录优先/全库回退、同扩展名与非图片文件不匹配、主干大小写与 svg 优先、远程镜像与 contentHash 不变、wiki 包裹与别名保留且同一主干只解析一次、远程与完好引用不改写、整档遍历写回、裸路径解析边界），并登记到 `package.json` 的 `test:unit`。
- 文档：`docs/ARCHITECTURE.md` 新增「同名图片重新识别」小节（含「显示与持久化分两步、写回不得重绘」），`docs/DEVELOPMENT.md` 新增排查规则，`docs/SPECIAL_FEATURES.md` 第 14 节新增用户向说明，`docs/FUNCTION_REFERENCE.md` 重新生成。
- 验证：`npm run verify` 通过（单元 458 条、文档 1315 处声明、仓库检查、生产构建）。
- 待手工验证：真实 Obsidian 桌面端把某张本地图片换成同名 svg/jpg 后重开导图，确认图片直接显示、引用被改写为新路径、`撤销` 不因该自动改写产生多余步骤，以及关闭开关后不再改写也不兜底。

- 上一轮（1.54.4，已发布；断行时首个顶层 `=` 留在首行并作为对齐点）
- 用户反馈（v1.54.3 实测）：换行已生效、首个 `=` 也留在首行，但首行整段落在 `aligned` 的右对齐列，后续行的 `=` 被排到首行右边界之后，视觉上出现大段空档（“没对齐”）。
- 修复（`src/core/latex.ts`）：首行也写入对齐点 `&`——`a = b = c` → `\begin{aligned} a & = b \\ & = c \end{aligned}`，使首个 `=` 与后续每个 `=` 竖直对齐；**少于两个顶层 `=` 仍返回 `null`**（`a = b` 不换行）。整体 `\boxed{...}` 的内层递归同样遵循该规则；JSDoc 同步说明首行漏写 `&` 的后果。
- 真机外验证（本地 HTTP + 真实 MathJax v3 + 复刻插件公式 CSS，436px 容器）：旧写法首行 `=` 在 24.94px、后续 `=` 在 274.19px（差 249px，正是空档来源）；新写法全部 `=` 均在 42.65px（差 0），整块宽 290px、4 行，完整落在容器内。
- 测试：`tests/latex.test.mjs` 三条期望同步更新（新增 `a = b = c` → `a & = b \\ & = c` 用例，`\text{甲=乙} = x = y` 与 `\boxed{a = b = c}` 同步）。
- 文档：`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md` 记录「首个顶层 `=` 留在首行并写成对齐点 `&`、至少两个顶层 `=` 才断行、首行漏写 `&` 会产生大段空档」，`docs/FUNCTION_REFERENCE.md` 重新生成。

- 上一轮（1.54.2，已发布；修复长公式自动换行未生效——`max-width: 100%` 夹取导致量不出溢出）
- 用户反馈（1.54.1 实测）：长公式仍然没有换行。排查确认代码路径已生效（已安装 `main.js` 含 `is-wrapped`），失效点是**测量**：行内公式容器 `.mms-node-math:not(.is-display)` 自身带 `max-width: 100%`，超长公式的盒子被夹在容器宽度上，`getBoundingClientRect().width` 永远等于容器宽度，于是「是否超宽」判定恒为否，直接跳过替换。
- 修复（`src/editor/rich-text-dom.ts`）：新增 `measureUnclampedWidth()`——量宽度前临时给公式容器及其内部 `mjx-container` 打 `max-width: none !important`，量完立即还原（保留原有内联值与优先级），因此不改变公式最终排版；`wrapOverflowingInlineMath()` 改用该真实宽度判定，并保留 `math.scrollWidth` 作为溢出兜底信号。
- 真机外验证（本地 HTTP + 真实 MathJax v3 + 复刻插件公式 CSS，420px 容器）：`available=420`、`clampedWidth=420`（证实旧判定必然失败）、`scrollWidth=613`、`unclampedWidth=613`（新判定可识别溢出）；断行源码 `\begin{aligned}` 渲染为 4 行、宽 255px、高 111px，截图确认原公式溢出边框而断行版本完整落在框内。
- 测试与文档：`tests/question.test.mjs` 契约改为断言 `measureUnclampedWidth()` 与 `max-width: none !important` 的解除夹取路径；`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md` 明确「判断超宽前必须先解除 `max-width: 100%` 夹取」，`docs/FUNCTION_REFERENCE.md` 重新生成。
- 上一轮（1.54.1，已发布）：长行内公式按容器宽度自动换行 + 公式编辑器「方框」。
- 断行纯函数（`src/core/latex.ts`）：`wrapLatexForLineBreaks(source)` 只在顶层 `=` 处断行并输出 `\begin{aligned} a \\ & = b \end{aligned}`；花括号、转义字符（`\{`、`\\`）、`\text{}` 内等号、`\left/\right` 成对定界符与已有 `\begin{}` 环境一律不拆（`\left/\right` 跨行会 unbalanced 报错，直接放弃断行）；源码整体是 `\boxed{...}` 时递归断行内层并保留方框；不可断行返回 `null`。辅助函数 `boxedContent()`、`splitLatexAtTopLevelRelation()`。
- 渲染自动换行（`src/editor/rich-text-dom.ts`）：`renderRichTextRuns()` 挂载行内公式后调用 `wrapOverflowingInlineMath()`——源码长度 ≥ 40 才测量（避免为短公式强制同步布局），容器 `clientWidth` 已知且公式真实宽度超宽时，用断行源码重新 `renderMath(..., false)` 并 `replaceWith`，打上 `is-wrapped`。导图节点（`.mmc-node-text`，宽度自适应内容）、编辑态与容器宽度未知的预览保持单行；断行后渲染失败保留原公式。全流程同步执行，不引入异步重排，避免再次扰动文章模式补载/锚点体系。
- 公式编辑器「方框」（`src/editor/editor-modals.ts`）：`FormulaEditModal` 常用结构面板新增「方框」按钮——有选区包住选区；无选区包住整条公式；源码为空时插入 `\boxed{}` 并把光标放进花括号内。
- 测试：`tests/latex.test.mjs` 新增 3 条（顶层等号断行与 aligned 输出、花括号/转义/`\begin{}`/`\left\right` 保持不拆、`\boxed{}` 内层断行）；`tests/question.test.mjs` 新增 1 条契约（方框按钮写入行为 + 渲染层按宽度换行、跳过导图节点与编辑态）。
- 文档：`docs/ARCHITECTURE.md`（latex.ts / rich-text-dom.ts / 公式编辑器三条）、`docs/DEVELOPMENT.md`（LaTeX 维护规则补充方框与断行边界）、`docs/FUNCTION_REFERENCE.md` 重新生成。

- 上一轮（1.54.0，已发布；重锚跟随最后一次应用的语义锚点）：根因（日志 `mu9ofat9-7h12`，1.53.9）：一次右键「在上方插入文字」在 12ms 内触发了 3 次窗口重建，restore token 26/27 最终把视口锚在 `n_msd4rorv_9b9ba5q`（viewportRatio 0.573），此后 warmup 的 `holdArticleAnchor` 已把它稳定钉在 targetTop 534.46；但 6 秒后 `window-warmup-complete` 的 `reapplyArticleAnchor()` 读到的却是 token 24/25 留下的**过期**锚点 `n_msd4rorw_37ml8gm`，于是 28.676 把视口强行移动 **2017px** 去把那个旧节点放到 35% 处——补载期间已经稳定的视口被重锚自己拽走。
- 为什么过期：`pendingArticleAnchorLocation` 只在 `renderWindow` 里赋值（`const location = latestRequestedLocation ?? previousLocation ?? rebuildLocation ?? this.lastReadingLocation`），而更新的那次恢复是从其它入口（如 `setDisplayMode`）进来的，没有更新该字段。
- 修复（`editor.ts`）：在 `beginReadingLocationRestore()`（所有恢复应用的唯一漏斗，每次应用前都会记 `restore-transaction-start`）里补 `if (mode === "article") this.pendingArticleAnchorLocation = location;`，让重锚目标始终等于最后一次真正应用的语义位置。补载期间没有其它恢复入口，行为与之前一致；只有出现"多次重建 / 多入口恢复"时不再取到旧锚点。
- 契约测试：`tests/reading-editor-contract.test.mjs` 在「warmup 完成后重锚」用例里新增断言——`beginReadingLocationRestore` 必须为 article 模式记录锚点，且必须发生在 `restore-transaction-start` 之前。

- 上一轮（1.53.9，已发布）：逐帧锚点保持 `holdArticleAnchor()` / `stopArticleAnchorHold()` + `articleAnchorHoldFrame`，在 warmup 结束后按语义锚点每帧校正 `scrollTop`，直到「窗口补载完整 + 连续 30 帧稳定」或 360 帧兜底；wheel / pointerdown / touchstart / 切换模式立即释放。`reapplyArticleAnchor()` 接入该保持。
- 上上轮（1.53.8，已发布）：`loadArticleChunkBefore()` 向前补载按参照节点（语义锚点 → 窗口最前节点）的屏幕位移补偿，替代只按 `scrollHeight - previousHeight` 的差值补偿（1.53.7 实测前文插入 13788.9px 只补 10057.6px，少补 3731px）；`articlePrependAnchor()` 负责解析参照节点。

- 上一轮（表格单元格 LaTeX 公式可解析渲染）：
  - 表格单元格 LaTeX 渲染（`rich-text-dom.ts`）：表格渲染统一走 `renderInlineMarkdown`，此前末参 `latex=false` 关闭了公式识别，导致表格里的 `$...$`/`$$...$$` 不解析。现改为 `latex=true`，表格（导图画布、文章、大纲三种渲染器）单元格内 LaTeX 公式正常渲染为 MathJax；`markdownInlineToRichText` 不吞 `$` 分隔符，与 `splitLatexText` 兼容；单个孤立 `$5` 等无闭合符号仍按纯文本，不误判为公式。
  - 回归契约 `scripts/test.mjs` 新增断言：`renderInlineMarkdown` 必须以 `latex=true` 调用 `renderRichTextRuns`。
  - 公式整体放大：`.mms-node-math` 默认 1.2 倍（`--mms-math-scale` 可调），缓解嵌套分数过度缩小。
  - 图片默认加载优先级：手动选择的默认来源（`sourcePriority`）最高；未手动选择时本地图片优先，本地不存在才按图床顺序（`imageSourceCandidates` 本地候选 `hostRank` 由最大值改为 -1）。
  - 更早（已提交）：焦点位置记忆 `focusAnchorNodeId`（`captureCurrentLocation` 与 `articleRendererOptions.selectedId` 两处 `selectedId || focusAnchorNodeId` 兜底）；图片预览失效源自动回退；删除图片本地副本独立回收。

- 第二轮反馈修复（应用户实测反馈）：
  - 公式按钮“无任何反应”根因：`node-edit-modal.ts` 中 `new FormulaEditModal(...)` 只构造未调用 `.open()`，Obsidian 的 Modal 必须 `.open()` 才显示。已在构造末尾补 `).open()`。契约测试新增断言公式弹窗会被打开。
  - 文章“右键在上方插入文字”出现“文本框闪现→图片消失→数秒后文本框消失、图片复现”的回退：根因是 `insertArticleTextBlockBefore` 用了默认 `mutate(action, undefined, "structure")`，触发跨文件文章族异步重建从陈旧快照重渲染。已改为 `mutateWithoutArticleContext`（影响级别 “none”，仅改当前页正文、走统一历史/保存），并把聚焦延后到 `window.requestAnimationFrame` 再 `beginInlineEdit(新块, true)`——与已验证可用的“在此块后插入文字”（`insertTextBlock`/`insertTextBlockAfter`）完全一致。
  - 按用户要求去掉图片块的悬停“+”按钮（“图片+ 去除”）：删除 `article-renderer.ts` 中 `.mms-article-insert-above` 按钮创建与 `ArticleRendererOptions.insertTextBlockBefore` 字段、`assetRendererOptions()` 里的回调注入，及 `styles.css` 的 `.mms-article-insert-above` 样式；保留图片右键“在上方插入文字”。契约测试改为断言悬停按钮已移除且 renderer 不再携带该回调。
  - 前一轮基础：叶渲染条件由 `if (firstTextBlock?.text.trim())` 改为 `if (firstTextBlock)`，使纯图片节点的空首 text 块渲染为可编辑叶子段落（内容自由占位仍由 `else if blocks.length===0` 独占）。

- 前一轮两个新功能（已交付）：
  - 导图“编辑节点内容”弹窗：新增“公式”按钮（`node-edit-modal.ts`），点击打开 `FormulaEditModal`。display 公式在目标文字块后插入新的块级公式块；行内公式写入当前聚焦文字块末尾（带空格、追加 `richText`），无聚焦文字块时退回第一个文字块、完全无文字块则新增一个。用 `focusin` 实时记录当前聚焦文字块的 `activeTextBlockId` 作为写回目标。契约 `${value.source}` 公式拼接、`splice(idx+1,…)` 插块、`textBlock.text += addition` 追加。
  - 文章模式“在图片前插入文字”（`article-renderer.ts` + `editor.ts` + `styles.css`）：图片右键菜单新增“在上方插入文字”项，调用 `insertArticleTextBlockBefore(nodeId, blockId)`：在目标图片块前 `splice` 插入空 text 块 → 保存/渲染 → 聚焦编辑。
  - 契约练习：新增 `tests/article-insert-text.test.mjs`（覆盖公式写回与 `.open()`、插入入口、局部影响级 mutate、送帧聚焦，并断言悬停按钮已移除）；更新 `tests/node-creation.test.mjs:48/52` 与 `scripts/test.mjs:1755` 的叶渲染契约。文档同步 `SPECIAL_FEATURES.md`。
  - 修正：`node-edit-modal.ts` 补 `MindMapTextContentBlock` 类型导入，公式写回的 `find` 添加类型谓词（`is ...: MindMapTextContentBlock`）——此前因类型收窄缺失触发 TS2552/2339。
- 上一轮：导图多选与尺寸缩放手柄修饰键对调 —— 多选统一 `Ctrl/Cmd`（节点点击切换、空白拖拽框选），尺寸缩放手柄改为按住 `Shift` 悬停显示并拖拽；CSS 类 `mmc-ctrl-resize`/`is-ctrl-held` 改名 `mmc-shift-resize`/`is-shift-held`；契约 `scripts/test.mjs`/`tests/settings-layout.test.mjs` 及文档同步。
- 接上一轮：导图行内编辑回车提交后键盘失焦修复 —— `beginInlineEdit` 失焦提交清理末尾，mindmap + `!related`（回车/Esc 程序性失焦）时 `rootEl.focus({ preventScroll: true })` 拉回焦点，global `handleKeydown`（绑定 rootEl capture）恢复；真实点击不抢焦点。契约测试 `tests/node-creation-focus.test.mjs` 新增 Enter/Esc 提交回拉。
- 截图标注工具增强（应用户 5 点反馈，均在 `desktop-capture.ts` 内嵌编辑器）：(1) 箭头头部从圆形改为清晰三角尖——杆状路径在箭头基底 `bx,by` 处截断（`lineCap='butt'`），头部用填充三角形画到尖点，不再被圆头线段遮成圆点；(2) 箭头样式组新增“渐粗”喇叭形（`line-style=tapered`），自尾端到头部由细到粗的实心锥体，另保留原“箭头/直线”；(3) 线宽从“细/中/粗”三档改为 1~20 滑条（`#widthRange` + 数值标签），画布箭头/文字/矩形/椭圆/笔刷共用；(4) 序号数字 `textBaseline='middle'` 基础上向下微移 1.5px 实现光学居中；(5) 马赛克与橡皮擦大小跟随线宽滑条（此前橡皮擦固定、马赛克固定 32，且样式栏对马赛克/橡皮擦工具不显示，现 `setTool` 把二者纳入样式栏显示、`mosaicAt` size=strokeWidth*3、橡皮擦 lineWidth=max(8,strokeWidth*3)）。契约测试 `image-recognition.test.mjs` 新增“sharp tapered arrow, 1-20 width slider and resizable mosaic/eraser”。
- 子导图提取/合并迁移附件（应用户反馈）：“提取为子导图”与“合并回去”之前，导图引用的本地图片与上传文件都不迁移，文件仍留在原导图 MindMap Assets、引用原样保留，子导图依赖父导图附件。本轮修复：新增纯逻辑助手 `migrateLocalAssetBlocks()`（core/model，遍历内容块，把本地图片块与文件块迁移到新仓库路径并改写权威引用，`localSource`/`source` 同步、文件改 `source`，远程图床 URL 与 `remoteSources` 不迁移），并由 main.ts 的 `migrateSubmapAssets()` 复用 `copyImportedMarkdownImages` 的命名去重（重名追加序号）+ 批量复制（串行复制、全部成功后再按需回收）。提取时（`extractToSubmap`）：从父导图复制到子导图自己的 MindMap Assets 并改写子导图引用，父导图原图保留，`main.js` 重写后写回子导图文件，子导图完全自包含。合并时（`mergeFromSubmap`）：把子导图引用的本地图片/文件复制回父导图自己的 MindMap Assets 并改写引用，随后删除子导图时旧附件一并回收，父导图保持独立。专项测试 `tests/submap-asset-migration.test.mjs` 锁定“本地图片+文件+远程图混合节点正确迁移、远程 URL 不受影响、同路径/空解析跳过”。
- 子导图合并回父导图（应用户反馈）：合并完成后若子导图资源目录已因附件迁出+回收而清空，调用 `cleanupEmptySubmapAssetsFolder(submapFile)` 在目录空时才删除，非空目录保留、失败静默；重名附件序号改为连字符（`a-2.png`）而非空格（`a 2.png`，提取后 1 分钟内合并回主图时主图原图未回收会触发撞名所致）。
- 替换图片后阅读位置乱跳（多轮定位）：第一层 mutate(null) 挡 mutate 自身恢复（8b1b9ff）；第二层 suppressNextArticleSemanticRestore 跳过语义恢复走像素恢复（3173796）；第三、四层（v1.51.2/1.51.4）在 renderWindow 内取 previousScroll.top 作为像素目标、并以图片块所在节点为锚——但**都拿错了目标**：文章窗口重渲染先把 scrollHeight 压到极小、浏览器把 scrollTop 钳制到顶部，renderWindow 内读取的只是塌缩后的值（日志：原 20955 → 重建后 2677）。本轮（v1.51.5 工作区）改为在来源变更入口 `applyImagePreviewSourceChange` → `captureArticleNodeAnchor(nodeId)` **重建发生前**捕获真实 scrollTop，renderWindow 以它为 `pendingArticlePixelRestoreTop` 硬钉目标，warmup 按 `Math.min(target, maxScroll)` 分帧爬升，内容补齐后精确回位；wheel/pointerdown 立即接管。契约测试锁定“入口捕获真实值、非塌缩值”。
- 教训：验证构建产物必须搜 esbuild 编译形式（`void 0` 而非 `undefined`），且 Select-String 勿用 -First 截断；GitHub Release 产物只含已提交代码，工作区修复需提交发布后才能通过插件更新获取；overflow-anchor:none 已存在时不要臆断浏览器锚定参与补偿。
- 预览弹窗“本地图片”来源行右键新增“在文件资源管理器中打开”（位于“更新替换”之后）：`ImagePreviewSourceActions` 新增可选 `revealLocal` 回调，editor 注入 `onRevealFileInSystemExplorer`；actions 对象补 `ImagePreviewSourceActions` 显式类型标注。file-block.test.mjs 新增契约锁定来源跟随与 reveal 入口。

- 截图插入链路优化：`captureScreenshot` 原先独立实现插入——整份 `cloneDocument` + `replaceDocumentFromExternalEdit` 替换文档、`focusNodeById` 强制聚焦目标节点、`onSavePastedImage` 落盘后才校验目标节点（失败时孤儿文件无提示）。现重构出共用方法 `insertImageBlockToNode()`（落盘 → mutate 插入 → 自动上传排程 → 通知），截图、右键“插入图片”、粘贴图片三条入口全部收敛：截图插入改走统一 mutate 链路（保留撤销与阅读位置记忆，不再整份替换文档、不再强制聚焦拉走阅读位置、不再丢失多选状态），目标节点消失时统一提示含落盘路径。契约测试 `image-layout.test.mjs` 新增“screenshot, right-click image picker and paste share one insert chain”。
- 阅读进度丢失修复（应用户日志反馈）：文章/通读模式下翻到最后关闭 Obsidian，重开后停在文档标题。根因有两层：(1) 初次挂载时文章族上下文未加载，`getEditorOptions` 的 `readingHomePath` 回退为当前文件自身，读到的持久化位置键与滚动写入的族首键不一致，初始无位置可恢复；(2) 族上下文异步刷新完成后的 `setOptions` 恢复优先级是 `preferred → rendered → remembered`，此时 rendered 恒为“当前渲染位置”（标题/骨架），remembered（真实上次阅读位置）永远被遮蔽。修复：新增一次性授权 `initialReadingLocationRestorePending`（编辑器挂载与文件切换时对非导图模式置位），首次族上下文刷新时同文件的记忆位置优先于 rendered（`normalizeReadingLocation(...)?.filePath === currentFilePath` 才启用，目录落地页与导图模式排除）；用户滚动接管或完成一次恢复尝试即失效。契约测试 `reading-editor-contract.test.mjs` 新增“first family refresh after opening a file prefers the remembered reading position”，并更新原“article option refresh”断言适配新选择链。
- 右键插入图片（应用户反馈）：画布/大纲/文章/通读模式的节点右键菜单此前只有截图、上传文件，没有本地图片入口；新增“插入图片”（有锚点块时显示“在此块后插入图片”）。`insertImageToNode()` 复用既有链路：`selectImageFile()` 系统文件选择器 → `onSavePastedImage` 落盘附件目录 → `mutateWithoutArticleContext` 插入图片块（锚点后或末尾）→ `onScheduleAutoUpload` 自动上传排程；SVG 扩展名正确保留。契约测试 `image-layout.test.mjs` 新增“node context menu offers local image insertion reusing the paste save chain”。
- 交接体系更名：目录 `Codex/` → `Agent/`（git mv 保留历史），交接文档精简为当前状态 / 验证基线 / 待验证 / 下一步四节，历史交付包清单全部删除（历史版本以 GitHub Release 为准）；AGENTS.md、docs/DEVELOPMENT.md、docs/PROJECT_GUIDE.zh-CN.md 同步改名，交接 ZIP 外部命名改为 `Agent-<版本>-handoff-<六位后缀>.zip`、内部根目录固定为 `Agent/`。
- 近期已发布（v1.50.1 ~ v1.50.3，均已带契约测试并通过 verify）：编辑弹窗图片块未启用图床时隐藏“选择文件并上传”“上传当前图片”按钮；剪贴板按钮 SVG 兜底（`parseDataUrlImageFromHtml()` 从 text/html 提取内嵌 data URI，绕过 Chromium read() 白名单）；“尚未选择图片”占位双击选图（复用“保存到仓库”本地链路，`is-empty` 样式 + title 提示）。
- 上一轮（已随 v1.49.9/v1.50.0 发布）：Enter 创建节点失焦修复（保护窗口 50ms → 220ms，blur 拉回仅限程序性失焦）+ `bringNodeIntoView()` 新节点最小平移滚入视口；1.49.8 节点文件上传（右键/拖拽上传、五面统一文件卡片、60 秒延迟回收删除与撤销取消）。

## 验证基线

- `npm run verify` 本机完整通过：`test:unit` **501/501**、`test:regression` 全部通过、`test:docs` 全部通过（1341 处命名声明）、`test:repo` 通过、`tsc --noEmit` 与 production esbuild 通过（含本轮导出写入目标冻结与移动端可加载性的核查与测试）。
- 详细数据见根目录 `TEST_RESULTS.md`。

## 待验证事项（需真实 Obsidian 桌面端手工冒烟）

- **移动端（Android / iOS）真机验证（本轮，尚未做）**：本轮只做了构建产物静态核查 + 隔离环境（无 Worker / 无 require）运行核查，未在真机跑过。请在手机上确认：打开大型导图 → 导出 Word 界面保持可交互、产物与桌面一致；导出过程中切换到另一个导图，产物仍落在原导图目录并用原文件名（本轮修复点）；XMind 大归档导入不卡死；PDF 导出给出「仅支持桌面端」提示。
- **Word 导出分批让出主线程（上一轮，待实测）**：对大型文章族点「导出 → Word」，导出期间界面应保持可交互（滚动、切换视图不卡），完成后出现「已导出：<路径>」Notice；产物用 Word / WPS 打开需与上一版完全一致（目录超链接可跳转、章节书签、带圈末端编号、2em 正文缩进）。实测参考：40k 节点单文件的最长连续同步段由整段导出的 470 ms 降到 22 ms、200k 由 2973 ms 降到 78 ms（总耗时分别升到 1130 / 4263 ms，属让出的预期代价）。
- **Word 导出分块流式打包（上一轮，已随 v1.55.7 入库）**：对大型文章族点「导出 → Word」并选择保存位置，导出期间界面不应长时间无响应（改动前 `zipSync()` 会把整份 `.docx` 一次性压缩，实测 40k 节点单次阻塞 1611 ms、200k 节点 6621 ms；改动后残余阻塞来自单章节的 `buildArticleNodeInfo()`，40k/200k 分别约 924 ms / 3594 ms）；导出完成后应有「已导出：<路径>」Notice。产物用 Word / WPS 打开需与上一版完全一致：目录超链接可跳转、章节书签正常、带圈末端编号与 2em 正文缩进不变。若导出报错请附控制台信息（`writeArchiveChunked()` 会把 `fflate` 的压缩错误原样抛出）。
- **大型文档 P0 加固（上一轮，待实测）**：打开含大量节点或多张附件的大型 `.mindmap` 应无卡顿（编辑、撤销、重做后附件 60 秒延迟回收仍能正常取消）——门控只在宿主上报有待回收附件时才做全树扫描，未上报时与旧行为一致。导入一份正常 XMind 文件应不受新的解压上限影响（条目数/单条/总量均在限内时行为不变）。构造一份深链（数千层）导图应能正常打开且不再退化为纯文本导入（根节点文字不应变成整段 JSON）。
- **新建节点聚焦契约（上一轮，测试-only，待实测）**：真实 Obsidian 文章模式按 Ctrl/Cmd+Enter 创建兄弟节点、Ctrl/Cmd+Tab 创建子节点后，新节点应立即滚入视口并进入行内编辑且首次聚焦不丢（Ctrl+Tab 需确认未被宿主快捷键占用）。上一轮未改运行时代码，仅修正过期回归断言。
- **万行级折叠代码块不再卡死（上一轮新增，待实测）**：打开 `浏览器/油猴.mindmap`（242 KB）应立刻可用；展开含接近 1 万行代码块的父节点时不再卡顿数秒。首次展开该代码块应内容完整、逻辑行数与行号正确、可复制、可再次双击编辑保存，只是不再语法着色（超过 2000 行自动跳过高亮）。反复折叠/展开不应重复解析（第二次展开应立即呈现），节点框高与相邻节点避让正常。打开调试模式后导出日志，`render / code-block-render` 中折叠块耗时应为毫秒级（修复前为秒级）。
- **「管理配置」折叠行缩进（1.54.9 已发布，待实测确认）**：打开插件设置 →「管理配置」，「设置分类排序」这一折叠行的三角与文字应与同组的「调试模式」「导出配置」等 `setting-item` 处于同一缩进列，不再贴齐分组标题「管理配置」那一列；展开后说明文字、「恢复默认顺序」按钮与各分类上下箭头同样缩进 16px；该区块的上下分隔线仍与相邻设置卡片等宽（只缩进内容、不改边框盒）。
- **代码编辑弹窗按钮整合（1.54.7，待实测）**：打开导图 → 节点右键「+ 代码」→ 在弹窗里粘贴一段完整围栏代码块（```` ```python … ``` ````）→ 点“代码内容”标题右侧的「识别粘贴的代码块」，语言应切到 Python、正文去掉围栏；不点它直接「保存代码」也应得到同样结果。视觉上按钮应是标题行右侧的小号描边次要按钮，不再单独悬挂在“显示设置”卡片下方，与卡片和底部「取消 / 保存代码」风格一致；点击“代码内容”标题仍应把光标聚焦到输入框。
- **长公式自动换行（1.54.1 引入、1.54.2 修复测量、1.54.3 调整断行与对齐，待实测）**：文章/通读/大纲/题目预览中插入一条明显超过正文宽度的行内公式（如 `$R = 5.25\%,\ R \times (1-R) = 5.25\% \times (1-5.25\%) = 5.25\% - 5.25\% \times 5.25\% = 5\%$`），应自动断成按等号对齐的多行、不再把页面顶宽，且**首行必须保留第一个 `=` 并与后续 `=` 竖直对齐**（`R = 5.25\%, R × (1−R)` 首行，之后各行以对齐后的 `=` 开头，不应出现“首行结束后右侧一大段空档再排 `=`”）；只含一个顶层 `=` 的公式（如 `$a = b$`）保持单行不换行。同一条公式放在导图节点里应保持单行（节点宽度自适应内容）；已渲染的公式在窗口变窄后不会自动重排（判定只发生在重新渲染时），刷新或切换模式后生效。若仍不换行，请提供公式所在位置（文章正文/导图节点/题目预览）与是否含 `\left`/`\right`、`\begin{}` 等不可断行结构。
- **公式编辑器「方框」（本轮新增，待实测）**：编辑节点内容 →「+ 公式」→ 输入公式后点「方框」，源码应变为 `\boxed{公式}` 且预览出现方框；先选中部分源码再点「方框」只包住选区；源码为空时点「方框」得到 `\boxed{}` 且光标停在花括号内。`\boxed` 依赖 Obsidian 自带 MathJax 的 ams 包，若预览提示“公式语法暂时无法渲染”请回报。

- **文章模式图片节点内容变更后视口稳定（1.54.0 修复，仍待用户实测确认）**：文章模式滚动到较深章节（如第 18 节）→ 在图片块上右键“在上方插入文字”或做其它内容变更 → 页面重建、窗口分帧补载（约 6 秒）、补载完成后前文图片/公式继续排版的全过程里，视口应停在同一处正文，不再出现数千像素的来回跳；补载期间（约 6 秒）主动滚动或点击应立即接管，不再被钉住。该修复针对的是补载**结束瞬间**重锚用旧锚点拽走视口 2017px 的问题。
- 焦点位置记忆：导图双击某节点编辑 → 点空白画布取消选中 → 拖拽画布 → 切换到文章，应落在上次聚焦节点的文字内容上（不再跳到最前）；再点选其它节点后再切文章应落在新选节点。
- 图片预览失效源自动回退：图片含图床+本地两来源，停用/失效图床后点击图片预览，短暂尝试图床后应自动回退显示本地图片，不再停留在“加载失败”；来源栏高亮应指向实际显示的本地来源；全部来源失效时才显示失败卡。
- 删除带失效远端的图片：删除该图片块后约 1 分钟，本地图片应进入系统回收站（不因远端连接失败被阻塞）；即便如此远端删除失败仍会提示“删除失败”，属远端不可达的如实反馈。
- 导图“编辑节点内容”→“公式”：点击应立即弹出公式编辑器；选行内/块级公式分别写入当前聚焦文字块末尾/在其后新增块级公式块；公式能在导图与文章渲染为 MathJax；多个文字块之间切换聚焦，公式写回正确目标。
- 文章“在图片前插入文字”（右键入口，悬停“+”按钮已按要求移除）：纯图片节点右键图片 →“在上方插入文字”，图片上方出现可编辑空段落并直接聚焦，输入文字提交后保存、在图片前常驻且**不再闪现后回退**（右键后应保持稳定、图片不消失）；正文中的图片块（非叶子）前插文字也正常。
- 多选改 Ctrl/Cmd：按住 Ctrl（macOS Cmd）+点击节点逐个切换选中/取消；空白处按住 Ctrl+拖拽出现框选矩形、覆盖的节点被选中；macOS 下 Cmd+点击不被当作右键菜单。
- 缩放开 Shift：按住 Shift 悬停节点右下角才显示尺寸控制点并拖拽；常规点击/双击节点不再误触缩放；缩放手柄的双击恢复自动大小仍需按住 Shift；切窗松开 Shift 后手柄立即隐藏。
- 行内编辑提交后键盘恢复：导图模式下双击节点编辑文字 → 回车提交 → 再按回车应新增兄弟节点、按 Tab 应新增子节点（不再“无反应/焦点丢失/原生 Tab 跳到拖动图标”）；按 Esc 取消后同样恢复；编辑后点击空白或其它节点提交不应被强行拉回编辑框。
- 提取为子导图：子树内的本地图片与上传文件被复制到子导图自己的 MindMap Assets；打开子导图图片/文件正常显示；父导图原图与图片不受影响。
- 合并回父导图：子导图引用的本地图片/文件被复制回父导图 Mind Map Assets 并正常显示；子导图及其旧附件被回收后父导图依然自包含。
- 重名附件迁移后在目标导图资源目录追加序号，不互相覆盖。
- 截图标注（新）：至少在 Windows 桌面上截图，逐项确认——(a) 箭头头部为清晰三角尖（非圆形）；样式栏“箭头”组下拉选“渐粗”得到尾端到头部由细到粗的喇叭形箭头、选“直线”为纯直线；(b) 样式栏线宽滑条 1~20 拖动时箭头/文字/矩形/椭圆/笔刷随之增粗或变细；(c) 序号工具点出数字在圆圈内视觉居中（不再偏上）；(d) 选中马赛克/橡皮擦工具时样式栏带线宽滑条，拖动可改变马赛克方块与橡皮擦圆头大小。

- 替换本地图片：立即显示新图、来源列表只保留“本地图片”；**阅读位置完全不动**（以图片块所在节点为锚，替换/删除来源/上传后均保持同一视口偏移，不跳位）；60 秒后旧文件进入系统回收站；替换后立即撤销则恢复旧图并取消回收。
- 预览弹窗“本地图片”来源行右键“在文件资源管理器中打开”打开目录并选中文件。
- 图片块右键“在文件资源管理器中显示”打开目录并选中文件；预览来源栏与设置项显示“本地图片”。
- 阅读进度恢复：文章/通读模式翻到中间或末尾 → 关闭 Obsidian → 重新打开同一文件，应自动滚回上次阅读位置（首次族上下文刷新后约 1~2 秒内完成）；用户打开后立即滚动则完全接管，不会被记忆位置拉走。
- 节点右键 →“插入图片”弹出文件选择框，选图后在段落/块后正确插入并显示；画布模式同样可用；开启自动上传时插入后自动排程上传；SVG 文件可插入并正常渲染。

## 下一步建议

- 本轮已完成：Word 导出的文章节点信息改为 `iterateArticleNodeInfo()` 惰性迭代并按 2000 项/段分批让出，导出链路不再有数百毫秒级同步块（残余最大延迟 44 ms @40k、106 ms @200k，主要来自 GC）。
- 报告 P1 项（尚未实施，按价值排序）：
  - 增量附件引用：`collectFileAssetPaths()` 目前只在「宿主存在待回收附件」时全树扫描（P0 已门控）。进一步降到 O(Δ) 需要维护增量引用计数，但内容块写入口有 33 处（`replaceNodeContentBlocks` / `moveNodeContentBlock` 遍布 editor / main / import / utils / renderer），漏一处就会误删仍在使用的附件；更稳妥的替代是让宿主在 60 秒到期时查询打开视图的**未保存**引用（`deleteFileAssetIfSafe` 已有全库检查，缺的正是内存态）。
  - `MutationDelta` / dirty 子树：让 mutation 只更新受影响范围而不是重建索引，同时为上面的增量引用提供 delta 来源。
  - 保存链路仍是同步契约：`mutate()` → `notifyDocumentChange()` → `history.createSnapshot(this.document)` 与 Obsidian `TextFileView.getViewData()` 都要求同步返回字符串，因此「保存前整文档 `JSON.stringify`」在不动这两处前无法迁出主线程；`editor.ts` 的 `assertDocumentSnapshotCacheFresh()` 还有每 10 秒最多一次的全量抽样序列化。
  - HTML / Markdown / PDF 导出仍是同步纯函数（`documentToSvg` 亦同）。若要同样让出主线程，需要先决定是否把 `readingSectionsToHtml()` / `readingSectionsToMarkdown()` 改为异步契约。
- XMind 解压迁出主线程已完成（v1.55.6）：后续如需进一步降本，可评估把解压放进真正的 Worker（需先确认 Obsidian 移动端 WebView 的 Worker/Blob 支持）或按条目惰性解压。
- 长公式换行只在重新渲染时按容器宽度判定，窗口缩放后不重排；如需跟随窗口变化，可在 resize 后对可见公式重跑一次判定（需评估文章模式锚点抖动风险）。
- 断行目前只在顶层 `=` 处切分，且首个顶层 `=` 固定留在首行；如需在 `+`/`,` 或不等号处断行，可在 `splitLatexAtTopLevelRelation()` 扩展操作符集合（并保留“首个关系符不断行”的规则）。
- 文件块可选增强：右键菜单“在系统中显示/复制路径”；大量附件时的资源目录清理入口。
- 编辑器侧优化：把 `documentSnapshotJson` 失效与 `nodeTreeIndex` 重建收拢进 `mutate()` 单一入口。
- 编辑器拆分剩余批次（题目系统流程、行内编辑深化）收益递减，按需推进。

## 交付说明

- 三份 ZIP 均输出到 `D:\Downloads`（仓库工作区外），外部文件名：`obsidian-mindmap-studio-<版本>-<后缀>.zip`、`mindmap-studio-<版本>-test-<后缀>.zip`、`Agent-<版本>-handoff-<后缀>.zip`（内部根目录 `Agent/`）。`D:\Downloads` 在沙箱内写入会被拒绝，需以非沙箱方式运行打包脚本；打包后必须确认仓库工作区内没有任何 `.zip`。
- 最近交付包（后缀 591622，交付追踪版本 1.55.8）：`obsidian-mindmap-studio-1.55.8-591622.zip`（根目录 `obsidian-mindmap-studio/`）、`mindmap-studio-1.55.8-test-591622.zip`（根目录 `mindmap-studio/`）、`Agent-1.55.8-handoff-591622.zip`（根目录 `Agent/`）；实际发布版本以 GitHub Release 为准。
- 历史交付包记录已清理；历史版本以 GitHub Release 发布为准，本地交付 ZIP 见 `D:\Downloads`。
- 交付约束：沟通说明与中文 Git 提交说明中**不得**再写“- main.js 已重建。”这条；main.js 由 `npm run verify` 的 build 自动重建，交付时不要单独列出。
