# Modified Files

## 1.46.3 第三批性能优化 CI 全选契约修复

- `scripts/test.mjs`：`selectAllNodesExceptRoot()` 综合回归从旧 `flattenNodes(this.document.root)` 实现文本更新为第三批节点树索引入口 `this.nodeTreeNodes()`；继续锁定排除 root、选择全部后代和 `Ctrl/Cmd+A` 路由。
- `CHANGELOG.md`、`TEST_RESULTS.md`、Codex 交接：记录用户 CI 已 **377 / 377 单测通过**，综合回归仅被该旧源码结构契约阻塞，以及本轮修复和下一次 CI 验收边界。
- 本轮没有修改 `src/`、`styles.css` 或运行时代码；`main.js` 保持第三批性能优化版本不变。

- 本轮测试安装包：`mindmap-studio-1.46.3-test-885141.zip`，SHA-256 `5a5385cbb1c35273ca3a765d67a4dabb8190b08637a2f92a57747fc16d52c9f2`；完整源码与 Codex 交接使用同一 `885141` 后缀。

## 1.46.3 第三批性能优化 CI 图片粘贴契约修复

- `tests/article-content-block.test.mjs`：两条图片粘贴源码契约从旧 `findNode(this.document.root, nodeId)` 更新为第三批节点树索引入口 `this.nodeById(nodeId)`；保留实时选择、目标节点消失提示、错误分流和自动上传排程边界。
- `docs/TESTING.md`：补充性能重构后的源码契约规则：若稳定抽象已经由扫描式 helper 替换为索引 helper，测试应锁定当前可执行接线/行为，不得继续要求已废弃 helper 名称。
- `CHANGELOG.md`、`TEST_RESULTS.md`、Codex 交接：记录用户 CI 的 **377 项中 375 通过 / 2 个旧契约失败**、修复范围和后续 GitHub Actions 验收边界。
- 本轮没有修改 `src/`、`styles.css` 或运行时代码；`main.js` 保持第三批性能优化版本不变。

- 本轮测试安装包：`mindmap-studio-1.46.3-test-465824.zip`，SHA-256 `5a5385cbb1c35273ca3a765d67a4dabb8190b08637a2f92a57747fc16d52c9f2`；完整源码与 Codex 交接使用同一 `465824` 后缀。

## 1.46.3 大型导图性能优化第三批

- `src/core/node-tree.ts`、`src/core/model.ts`：新增 `NodeTreeIndex`、`buildNodeTreeIndex()` 与父链祖先查询辅助函数；一次 DFS 建立稳定节点顺序、`nodeId → node`、`nodeId → parent` 和可折叠状态，并允许 `moveNodeRelative()` 在结构变化前的首步复用已有索引。
- `src/editor/editor.ts`：完整渲染开始统一重建节点树索引；选中节点、父节点/祖先、工具栏、多选复制/删除、删除回退、键盘与拖放热路径改为复用索引。文档根对象整体替换时通过根身份检查懒重建；纯内容修改不额外失效。
- `src/editor/node-actions.ts`：`topLevelSelectedNodeIds()`、`deletionSelectionFallback()` 与 `insertSiblingAfter()` 支持传入现有索引；多选顶层分支过滤沿 `parentById` 判断祖先，不再为每个候选反复 `findNode()` / `containsNode()` 扫描子树。
- `src/editor/drag-drop.ts`：`canMoveNodes()` 支持复用 `NodeTreeIndex`，通过父链判断目标是否位于任一拖动分支内部，替代重复子树 DFS。
- `tests/node-tree.test.mjs`、`tests/node-tree-index-actions.test.mjs`、`tests/incremental-render.test.mjs`、`tests/article-context-edit.test.mjs`、`scripts/test.mjs`：增加节点/父节点索引、父链查询、首步结构移动复用、顶层多选过滤/删除回退/拖放合法性行为及源码/安装 bundle 防退化契约，并更新原有节点查询文本契约。
- `package.json`：把 `node-tree-index-actions.test.mjs` 纳入正式 `test:unit`，让 CI 持续执行本批共享索引行为回归。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步第三批节点树索引生命周期、性能边界与测试要求。
- `main.js`：当前容器依赖安装仍不完整，无法执行正式 production esbuild；以现有 1.46.3 bundle 为基线等价同步本批运行逻辑，并由源码/bundle 契约、TypeScript 独立语法检查和 `node --check` 验证。正式发布前必须由完整 CI 重新 production build。
- 本轮不改变 `.mindmap` 数据格式、撤销/保存语义、父子导图导航或文章编号规则。

- 本轮测试安装包：`mindmap-studio-1.46.3-test-745464.zip`，SHA-256 `8a7589062fa296889fb51d0e913a1fabf255494bb22c541c497f3770b1b6fa0a`；完整源码与 Codex 交接使用同一 `745464` 后缀。

## 1.46.3 大型导图性能优化第二批

- `src/editor/editor.ts`：新增 `mindMapNodeElements`，为已挂载导图节点维护 `nodeId → HTMLElement` 直接索引；渐进挂载去重、拖拽状态、框选尺寸采集、实测尺寸、FLIP 动画、行内编辑与单节点刷新改为复用索引，不再在热路径反复 `querySelector()` / `querySelectorAll()` 扫描整个节点层。节点替换、销毁和整图重绘同步删除或清空索引。
- `src/editor/selection-class-delta.ts`：新增纯函数 `selectionClassDelta()`，计算前后选择集合中真正需要重写 CSS 类的节点 ID；选择数量跨越单选/多选边界时同时刷新仍被选中的节点，保证 `is-multi-selected` 一致。
- `src/editor/editor.ts`：新增 `appliedSelectionIds` 与选择同步有效位；普通点击、Ctrl/Cmd 多选和框选只更新选择差集，大纲/文章/通读 DOM 重建或扩展后才触发一次全量同步。隐藏模式不做重复选择样式写入。
- `tests/incremental-render.test.mjs`：新增选择差集行为测试，并锁定源码/安装 bundle 必须使用 DOM 索引、增量选择同步且不得在实测布局/单节点刷新重新退化为逐节点 selector 扫描。
- `tests/image-layout.test.mjs`：更新 ResizeObserver 缓存契约，要求尺寸采集直接遍历 `mindMapNodeElements` 并写入实测尺寸缓存。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步第二批大型导图交互热路径优化、索引生命周期、增量选择边界与回归测试。
- `main.js`：当前容器依赖不完整，无法执行正式 production esbuild；以现有 1.46.3 bundle 为基线等价同步本批运行逻辑，并由源码/bundle 契约、TypeScript 独立语法检查和 `node --check` 兜底。正式发布前仍应在完整依赖 CI 重新执行 production build。
- 本轮不改变 `.mindmap` 数据格式、撤销/保存语义、父子导图导航或文章编号规则。

- 本轮测试安装包：`mindmap-studio-1.46.3-test-634215.zip`，SHA-256 `8e35d04708f8b25c564e971eb1c6fc849c68b297c0418a365554ccf96441b3dd`；完整源码与 Codex 交接使用同一 `634215` 后缀。

## 1.46.3 CI production build 未使用代码修复

- `src/search/global-search.ts`：删除上一轮 `refreshFamily()` 索引复用重构后已不再调用的私有生成器 `walkNodes()`，修复 GitHub Actions `tsc --noEmit --skipLibCheck` 的 `TS6133`。
- `main.js`：同步移除同一无用类方法；运行时搜索/导航逻辑不变。
- `docs/FUNCTION_REFERENCE.md`：重新生成函数参考，具名声明由 1195 个降为 1194 个，对应被删除的无用私有方法。
- `CHANGELOG.md`、`TEST_RESULTS.md`、Codex 交接：同步用户 CI 已通过的 369/369 单测、综合回归、文档/仓库检查，以及本轮唯一 build 阻塞与修复。
- 本轮不改变 `.mindmap` 数据格式、搜索结果、父子导图恢复或第一批性能优化行为。

- 本轮测试安装包：`mindmap-studio-1.46.3-test-740774.zip`，SHA-256 `0053ba3e0a70dbb33913b6d9a2cfedaf3ce821abd71238a8c9af9296affb59c6`；完整源码与 Codex 交接使用同一 `740774` 后缀。

## 1.46.3 CI 综合回归契约修复

- `scripts/test.mjs`：删除对历史注释文本 `first climb to the top parent` 的脆弱断言，改为验证 `refreshFamily()` 实际执行“循环防护 → `familyIndexedFile()` → `navigation.parentPath` → 父文件解析 → 更新 `familyRoot`”的数据流。
- `tests/global-search-traversal.test.mjs`：无需改业务测试；现有行为用例继续锁定新鲜父子索引 **0 次读取**、过期祖先跨父链/向下遍历 **仅 1 次读取**。
- `docs/TESTING.md`：补充综合回归源码契约原则，禁止用实现注释或说明性 prose 作为行为存在性的唯一判据。
- `CHANGELOG.md`、`TEST_RESULTS.md`、Codex 交接：同步 CI 根因、验证边界和后续 GitHub Actions 验收。
- 本轮没有修改 `src/`、`styles.css` 或运行时代码，`main.js` 保持第一批性能优化交付版本不变。
- 本轮测试安装包：`mindmap-studio-1.46.3-test-527971.zip`，SHA-256 `02aae55163facd84e9c67cfbf938687cb73305373b86e1664410f80336b38fe3`；完整源码与 Codex 交接使用同一 `527971` 后缀。

## 1.46.3 大型导图性能优化第一批

- `src/editor/editor.ts`：`applyMeasuredMindMapLayout()` 改为直接复用 `computeLayout()` 已完成的碰撞消解、`byId` 与边界结果，删除调用方第二次 `resolveLayoutCollisions()` 和重复边界重算；新增 `ToolbarAvailabilityContext` / `toolbarAvailabilityContext()`，一次树遍历计算当前选择、有效非根选择和可折叠状态，全部工具栏按钮共享该上下文。
- `src/render/collision-layout.ts`：利用已按节点顶部排序的扫描顺序；当当前节点与后续节点已经满足 `verticalGap` 时立即结束内层循环，跳过不可能再发生纵向碰撞的剩余节点。
- `src/render/incremental-render.ts`：`prioritizeSpatialRenderItems()` 先为每个布局项预计算 band、focus rank 和距离，再进行纯数值排序，避免 `Array.sort()` 比较器重复执行视口相交、Map 查询与距离计算。
- `tests/incremental-render.test.mjs`：新增碰撞行为测试和性能结构契约，并同时检查 TypeScript 源码与安装 `main.js` 不得恢复重复碰撞、重复树扫描或比较器内几何计算。
- `tests/settings-layout.test.mjs`：更新工具栏可用性签名契约，要求共享 `ToolbarAvailabilityContext`。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步大型导图热路径优化、架构边界和回归测试。
- `main.js`：当前环境没有完整 `esbuild` / Obsidian 开发依赖，无法执行正式 production build；以现有 1.46.3 bundle 为基线等价同步本批三条运行热路径，并由源码/bundle 契约、`node --check` 和差分测试兜底。
- 本轮测试安装包：`mindmap-studio-1.46.3-test-736957.zip`，SHA-256 `3b0943a3b1db78d41d3e3616c385f30f1295d0c9c4adb77c0a6684bc882b4273`；完整源码与 Codex 交接使用同一 `736957` 后缀。

## 1.46.3 静态分析告警整改与导图族索引复用

- `src/editor/editor.ts`：新增 `handleReadOnlyKeydown()`，把只读复制、方向导航、缩放、适应视图和折叠从主 `handleKeydown()` 拆出；保留选中文字时的浏览器原生复制和全部既有快捷键语义。
- `src/utils/filename.ts`、`src/main.ts`：新增纯函数 `remoteImageSuggestedName()` 并由 `readImageSource()` 复用；无效 URL/无路径名称回退 `remote-image.png`，网络 `requestUrl` 失败继续抛错。
- `src/search/global-search.ts`：新增新鲜索引判断、文档快照写入和 `familyIndexedFile()`；`refreshFamily()` 优先用 `mtime + size` 新鲜索引完成父链/子图遍历，仅过期或缺失文件才 `cachedRead`，且父级爬升读取结果在同轮向下遍历复用。
- `tests/filename.test.mjs`：覆盖远程图片建议文件名正常、空路径与异常 URL 回退。
- `tests/global-search-traversal.test.mjs`：新增新鲜父子索引 **0 次文件读取**、过期祖先跨爬升/向下遍历 **仅 1 次读取** 的行为测试。
- `tests/reading-editor-contract.test.mjs`：锁定主键盘分发器只委派给独立只读处理函数，并检查方向键映射。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步缓存边界、异常测试与只读键盘职责。
- `main.js`：当前环境仍缺完整 production 构建依赖，因此基于现有 1.46.3 bundle 等价同步上述三项逻辑；需继续由 `node --check`、专项 bundle/source 契约和可运行单测验证，正式发布前在完整依赖环境重建。
- 本轮测试安装包：`mindmap-studio-1.46.3-test-146998.zip`，SHA-256 `d2d6fc54d917979156d410462e138749562033050fabf73fd0de7f4abf0af03a`；完整源码与 Codex 交接使用同一 `146998` 后缀。

## 1.46.3 子导图父级返回导航恢复

- `src/search/global-search.ts`：新增 `findParentNavigationForChild()`，在启动增量校验完成后的搜索索引中，仅接受父节点 `submap.path` 实际解析到当前子文件的条目，反查父文件、挂载节点 ID、父标题和来源节点文字。
- `src/main.ts`：新增 `recoverSubmapNavigation()`；旧子导图缺失 `navigation.parentPath` 时先等待 `searchIndexReady` 完成启动增量校验，再执行父级反查，索引失败时记录调试事件并安全降级。
- `src/view.ts`：`setViewData()` 对缺失父级导航的文档异步恢复运行态 `navigation`；恢复后失效文章上下文缓存、刷新文档缓存并重建文章上下文，但不提升编辑修订、不触发打开即保存。
- `src/editor/editor.ts`：新增 `applyRecoveredNavigation()`，只写入已验证导航并调用 `renderNavigation()`，让导图模式左上角 `← 父导图 › 当前导图` 重新出现，不进入撤销历史、不重绘整张画布。
- `tests/reading-editor-contract.test.mjs`：新增旧子导图父级反查契约，并检查源码与安装 `main.js` 均等待索引校验、使用真实 `submap.path`、局部刷新导航且不触发 `onChange` / history。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步旧子导图兼容恢复、缓存边界、调试入口、测试和真实 Obsidian 验证说明。
- `main.js`：上传源码包没有可用 `esbuild` / Obsidian 类型依赖，且当前环境无法联网恢复依赖；因此以现有 1.46.3 bundle 为基线等价同步本轮运行逻辑，并通过 `node --check`、专项源码/安装 bundle 契约。正式发布前仍应在依赖完整环境执行 production build。
- `TEST_RESULTS.md`、Codex 交接：记录专项 **33/33**、不依赖缺失包的单测 **353/353**、文档/仓库/语法检查，以及标准 `verify` 被 `esbuild`/`fflate` 与类型依赖缺失阻断的边界。
- 本轮测试安装包：`mindmap-studio-1.46.3-test-228042.zip`，SHA-256 `1cbef89d4977ee9c9ff42fbc901ae9b1ad7fa3a623ca9d865fa3268ddcef0028`；完整源码与 Codex 交接使用同一 `228042` 后缀。

## 1.46.2 文章窗口自动预热与目录往返缓存修复

- `src/editor/editor.ts`：正文真实窗口挂载并完成语义定位后启动 `scheduleArticleWindowWarmup()`；按动画帧优先补后文、再补前文，每帧最多 4 次约 5 KB 扩展，每批刷新折叠、缩略导航、选中态与文章块 UI。后台向前补载按新增 `scrollHeight` 补偿 `scrollTop`，并等待活动阅读恢复事务结束，避免自动加载与精确落点竞争；用户滚到边缘时原扩展逻辑继续作为兜底。
- `src/article/render-window.ts`、`src/editor/article-renderer.ts`、`src/editor/editor-types.ts`：新增 `ARTICLE_RENDER_CACHE_HIT_WINDOW_BYTES = 32 * 1024` 和可选 `initialWindowByteBudget`；文章上下文同步缓存 HIT 时使用更大的首个真实窗口，MISS 仍保持原 5 KB 快速首屏。
- `src/view.ts`：新增 `articleContextCacheHit`、`documentChangeRevision` 与 `savedDocumentChangeRevision`。真实编辑 `onChange` 才提升修订并失效缓存；纯阅读、章节定位、返回目录和文件切换未发生编辑时，`save()` 在 `super.save()` 前记录 `save-skipped-clean` 并返回，避免把临时 `articleLandingMode` 等视图状态写回 `.mindmap`、产生 vault `modify` 并清掉刚建立的文章族缓存。
- `tests/incremental-render.test.mjs`：新增后台自动预热、后文优先/前文补齐、缓存 HIT 32 KB 首窗以及 `main.js` 等价 bundle 契约。
- `tests/article-context-cache.test.mjs`：新增“干净文章导航不得写 vault”的回归，锁定 `onChange → revision`、无编辑 `save()` 早退、保存修订推进和 `articleContextCacheHit` 传递。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/FUNCTION_REFERENCE.md`：同步“首屏窗口 + 后台真实 DOM 预热”、缓存 HIT 32 KB 首窗、干净导航不写盘及真实 Obsidian 冒烟判据。
- `main.js`：以原 1.46.2 正式 esbuild bundle 为基线等价同步自动预热、32 KB 缓存命中首窗和干净导航保存守卫；`node --check`、TypeScript、专项源码/安装 bundle 契约均通过。当前 Linux 容器仍无法执行上传依赖中的 Windows-only esbuild production 二进制。
- `TEST_RESULTS.md`：记录用户日志证据、82/82 文章专项、362 项完整单测中的 352 通过 / 10 个 esbuild 平台失败、临时测试兼容层 362/362 与综合回归通过、文档/仓库检查及待真实 Obsidian 验证项。
- 本轮交付：`mindmap-studio-1.46.2-620401.zip`，SHA-256 `868a3d35447baba8dae831b15ddcbd5ef4a682c4fcd06b0457b3a85b71762597`；完整源码与 Codex 交接使用同一 `620401` 后缀。

## 1.46.2 文章上下文持久缓存与解析文档复用

- `src/article/article-context-cache.ts`：新增文章上下文 L1/L2 缓存、插件私有 JSON 预载/防抖写盘、依赖 `mtime + size` 同步校验、LRU 上限、不可信 JSON 规范化，以及会话级 `MindMapDocumentCache`。
- `src/main.ts`：插件启动预载 `cache/article-context-cache.json`；`readMindMapDocument()` 优先复用解析文档；新增文章上下文同步读取/写入、构建代数保护和 create/modify/delete/rename 失效处理；卸载时刷新持久缓存。
- `src/view.ts`：`setViewData()` 在编辑器构造前先读取文档缓存和文章上下文缓存；HIT 直接恢复目录、导航和通读章节且不安排首次 `refreshArticleContext(0)`，MISS 才沿用完整构建流程；编辑立即使相关缓存失效，保存后刷新文档缓存。
- `tests/article-context-cache.test.mjs`、`package.json`：新增 5 项缓存专项并加入 `test:unit`，覆盖跨重启同步预载、依赖变化、调用方隔离、不完整依赖 JSON、文档 LRU、真实加载主链和 `main.js` 接线。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步缓存边界、5 KB 渲染保持不变、失效策略、测试与人工验证说明。
- `main.js`：当前容器缺少 Linux esbuild 二进制，无法执行正式 production esbuild；以原 1.46.2 正式 bundle 为基线等价同步本轮缓存运行代码，并由语法、类型、专项 bundle 契约和现有 bundle 契约校验。
- `TEST_RESULTS.md`、Codex 交接：记录 81/81 文章相关专项、361 项完整单测中的 10 个 esbuild 平台失败、被阻断测试体的 10/10 临时兼容层补跑、综合回归补跑和真实 Obsidian 待验证项。
- 本轮安装包：`mindmap-studio-1.46.2-432839.zip`，SHA-256 `f8087586db7c3e5692842d43116073d757b058d6ab732e49db86b3ad5cd21393`。

## 1.45.16 空节点保留与文章空编辑高度

- `src/core/model.ts`：删除 `isRemovableEmptyNode()` 及 `moveNodeContentBlock()` 中“移动最后一个内容块后删除空来源节点”的隐式树结构修改；来源节点内容可为空，但节点本身始终保留。
- `src/editor/editor.ts`：移除 `nodeHasMeaningfulContent()` / `removeNodeAfterContentDeletion()` 及文章行内编辑、导图快速编辑、完整节点编辑、结构化块删除、普通内容块删除和图片删除中的自动空节点清理调用；内容操作不再等价于删除节点。
- `styles.css`：文章标题、末端正文和段落行内编辑统一增加一行最小高度与 content-box 盒模型，避免清空 contenteditable 后只剩 `<br>` 时高度塌缩。
- `tests/content-block-drag.test.mjs`、`tests/node-creation.test.mjs`：更新最后内容块移动契约为保留空来源节点，增加源码/`main.js` 不得包含旧自动删除 helper 的契约，并新增文章空编辑至少一行高度测试。
- `README.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步“内容为空不删除节点”语义、文章空编辑高度与手工验证边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：版本同步为 1.45.16；安装包 SHA-256 为 `b65509e55b23c7872846e7e7ebfaa392341a45c283d6bb30314e2ca0ed1e492f`。
- `main.js`：由于当前 Linux 环境无法运行上传依赖中的 Windows esbuild，按 TypeScript 源码等价同步取消空节点自动删除的运行逻辑；通过 TypeScript、专项 bundle 契约和 `node --check` 校验。
- `TEST_RESULTS.md`、Codex 交接：记录 59/59 相关专项、356 项单测中的 10 个 esbuild 平台失败、真实 Obsidian 冒烟范围和 1.45.16 交付包。

## 1.45.15 全局搜索重复实例去重

- `src/main.ts`：仅全局搜索入口增加 `globalSearchModal` 与 `globalSearchLaunchPending` 双重单例守卫，阻止同一快捷键被插件捕获层和 Obsidian 热键链重复处理时创建两层搜索 Modal；新增 `open-request`、`open-mounted`、`open-deduplicated` 调试事件。当前导图族 `openMapFamilySearch()` 保持独立。
- `src/search/global-search.ts`：新增 `isMounted()`，供全局入口判断当前搜索实例是否仍挂载；关闭流程本身不变。
- `tests/global-search-contract.test.mjs`、`scripts/test.mjs`：增加“全局搜索必须单实例、当前导图族搜索不受守卫影响”的专项与综合契约。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步重复实例根因、入口边界与调试判据。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：版本同步为 1.45.15；安装包 SHA-256 为 `d5af5c80b8b9f5dd0429689a6e68c5700927bfc9860d798fc93f20a165661c2c`。
- `main.js`：同步全局搜索单实例守卫；当前导图族搜索运行逻辑不变。
- `TEST_RESULTS.md`、Codex 交接：记录 1.45.14 真实日志证据、验证基线与待桌面端复测项。

## 1.45.14 原生 Modal.close 自动关闭收口

- `src/search/global-search.ts`：删除 1.45.13 的 `.modal-bg.click()` 合成关闭；结果点击后设置 `shouldRestoreSelection=false` 并只调用一次 `Modal.close()`，不再查询/模拟背景事件，不修改或删除宿主 Modal DOM；导航改为等待两个 `requestAnimationFrame`，不等待 `onClose()` Promise。新增 `result-close-request`、`result-close-return`、`modal-on-close`、`result-navigation-start` 调试事件。
- `src/main.ts`：全局搜索与当前导图族搜索统一注入 `global-search-modal` 调试回调，真实桌面端可以记录关闭生命周期。
- `styles.css`：移除 1.45.13 的 `mms-global-search-result-opening` 内容隐藏规则，使原生 `Modal.close()` 的宿主过渡不再受插件 CSS 干预。
- `tests/global-search-contract.test.mjs`、`scripts/test.mjs`：关闭契约改为“单次原生 close + 双 RAF 非阻塞导航”，明确禁止 backdrop click、合成 PointerEvent、手工 DOM 删除、外层隐藏 class 与 `onClose()` Promise 阻塞。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步 1.45.13 真实日志证据、原生关闭边界和调试事件。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：版本同步为 1.45.14；安装包 SHA-256 为 `e401f2c38078e7d4156e90a22a23da58e81cea71ed2e23c64f88bd588af13f4c`。
- `main.js`：按 TypeScript 源码等价同步单次 `Modal.close()`、双 RAF 导航和搜索 Modal 生命周期调试；当前 Linux 环境仍受 Windows esbuild 二进制限制。
- `TEST_RESULTS.md`、Codex 交接：记录 1.45.13 “合成背景 click 不关闭”真实日志、验证基线与 1.45.14 待桌面端复测项。

## 1.45.13 搜索背景宿主关闭与非阻塞导航

- `src/search/global-search.ts`：移除 `hostClosePromise` / `waitForHostClose()`；结果点击后设置 `shouldRestoreSelection=false`、隐藏搜索 Modal 内部内容，并自动 `click()` 当前 `.modal-bg` 复用宿主背景关闭路径；仅让出一个 `setTimeout(0)` 后导航，不再等待 `onClose()`。找不到背景节点时保留 `Modal.close()` 回退。
- `styles.css`：删除旧 `.mms-global-search-container-closing` 外层隐藏规则，改为 `.mms-global-search-result-opening > *` 只隐藏搜索 Modal 内部内容，不修改 `.modal-container` / `.modal-bg`。
- `tests/global-search-contract.test.mjs`、`scripts/test.mjs`：新增“背景点击关闭 + 非阻塞下一事件循环导航”契约，并禁止重新引入 `waitForHostClose`、外层 DOM 删除或 `display:none`。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步 1.45.12 真实日志和 1.45.13 关闭/导航边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：版本同步为 1.45.13；安装包 SHA-256 为 `e82ede2440b90e013b41ac26baeae551e1973dab742160fb16a2bdd681d632fb`。
- `main.js`：按 TypeScript 源码等价同步搜索 Modal 的背景关闭与非阻塞导航逻辑。
- `TEST_RESULTS.md`、Codex 交接：记录 1.45.12 “既不关闭也不跳转”的真实日志、验证基线与真实桌面端待复测项。

## 1.45.12 搜索结果自动隐藏与原生 Modal 关闭完成修复

- `src/search/global-search.ts`：搜索结果关闭流程新增 `waitForHostClose()` 与 `onClose()` 完成信号；结果点击后先启动唯一一次原生 `Modal.close()`，再仅用 `visibility:hidden` / `pointer-events:none` 立即视觉隐藏搜索层，禁止 `display:none` 和手工删除 Modal DOM；目标导航等待真实 `onClose()` 完成。
- `styles.css`：`.mms-global-search-container-closing` 删除 `display:none`，仅保留不可见与禁用指针，避免阻断宿主关闭 transition/completion。
- `tests/global-search-contract.test.mjs`、`scripts/test.mjs`：更新搜索关闭契约，验证单次 close、真实 onClose 完成、禁止 `display:none/remove()`、导航等待 teardown。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步 1.45.11 自动隐藏回归根因与 1.45.12 生命周期边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：版本同步为 1.45.12；安装包 SHA-256 为 `c1dd31e2eaee48048c9dc0baa7cdf290b81cd5b045ea605329a4adde6e653674`。
- `main.js`：按 TypeScript 源码等价同步搜索 Modal 的关闭完成等待逻辑。
- `TEST_RESULTS.md`、Codex 交接：记录 1.45.11 真实日志、1.45.12 验证基线和待真实桌面端复测项。

## 1.45.11 搜索 Modal 焦点 Scope 生命周期修复

- `src/search/global-search.ts`：修正结果打开时的 Modal 关闭边界；同步隐藏搜索 UI 后设置 `shouldRestoreSelection=false`，只调用一次 `Modal.close()`，不再手工 `remove()` `modalEl` / `containerEl` / `.modal-container`，也不再在导航结束后二次关闭。新增 `waitForModalFocusRelease()`，等待两个动画帧让 Obsidian 完成 Modal 栈与焦点 Scope 释放后再导航。
- `tests/global-search-contract.test.mjs`、`scripts/test.mjs`：更新搜索关闭契约，明确禁止绕过宿主 Modal 生命周期，并验证源码/安装 bundle 均不存在旧 `removeSearchLayers` 强制删除逻辑。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步 1.45.10 真实日志确认的最终根因、单次关闭与焦点 Scope 释放边界、测试和手工复测步骤。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`：版本同步为 1.45.11；`update.json` 已写入本轮安装包 SHA-256 `ec6b1b217ccb11f84c2b074a1de78e847014ddf528c24cc94a636da245152425`。
- `main.js`：由于上传依赖缺少 Linux esbuild 二进制，按 TypeScript 源码等价同步搜索 Modal 关闭逻辑，并通过语法、类型、专项 bundle 契约校验。
- `TEST_RESULTS.md`、Codex 交接：记录 1.45.10 Windows/Obsidian 1.12.7 焦点风暴日志、1.45.11 验证基线和真实桌面端待验证项。

## 1.45.10 搜索跳转后直接单击编辑事务接管

- `src/editor/editor.ts`：`makeInlineEditable()` 的指针入口新增 `claimInlineEditInteraction()`，在进入编辑前取消语义位置恢复和文章窗口扩展、清除待处理文章定位并建立当前行内编辑保护；新增 `activateInlineEditableFromPointer()`，保留点击位置光标并仅保护最初 120 ms 的宿主焦点交接。
- `src/editor/editor.ts`：新增 `inline-edit-claim`、`inline-edit-focus`、`inline-edit-blur`、`inline-edit-refocus` 调试事件，记录连接状态、初始焦点保护和 `blur.relatedTarget`，用于真实 Obsidian 复现闭环。
- `tests/article-context-edit.test.mjs`、`tests/article-content-block.test.mjs`、`tests/reading-editor-contract.test.mjs`、`scripts/test.mjs`：新增/更新直接指针编辑必须接管搜索导航事务的源码与综合回归契约；单元测试总数增至 355。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步真实日志根因、编辑事务优先级、焦点诊断事件与手工复测步骤。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`：版本同步为 1.45.10；`update.json` 已写入安装包 SHA-256 `8fc69cdccc651acabed54dc95899453c311e58e8830cd9566262faad69feae47`。
- `main.js`：由于上传依赖缺少 Linux esbuild 二进制，按 TypeScript 源码等价同步本轮运行逻辑，并执行语法、类型与 bundle 契约校验。
- `TEST_RESULTS.md`、Codex 交接：记录 1.45.9 真实调试日志、1.45.10 验证基线、待真实 Obsidian 冒烟项和本轮交付包。

## 1.45.8 文章菜单焦点保护契约收口

- `src/editor/editor.ts`：恢复 `editSelected(initialBlockId?)` 原签名，新增 `editSelectedFromContextMenu()`；只有文章右键菜单调用 `editSelectedArticleContent(true)`，导图/大纲完整编辑路径不再携带焦点保护状态。
- `tests/article-context-edit.test.mjs`、`scripts/test.mjs`：新增“菜单焦点保护必须与完整节点编辑 API 隔离”的专项和综合回归契约，并继续验证 `main.js`。
- `docs/ARCHITECTURE.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步内部边界、CI 回归判据与 1.45.8 说明。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`：版本同步为 1.45.8；`update.json` 已写入 1.45.8 安装包 SHA-256 `995025a2018e98783039d09b389cf5e8eebc9a43ba71c5e0be6a2d761180ae19`。
- `main.js`：同步 1.45.8 运行逻辑；当前 Linux 环境无法使用上传的跨平台 esbuild 二进制，因此以源码等价同步并执行语法、类型、专项 bundle 契约校验。
- `TEST_RESULTS.md`、Codex 交接：记录用户上传的 GitHub Actions 日志根因、验证基线和待真实 Obsidian 冒烟项。

## 1.45.7 搜索跳转后文章行内编辑焦点修复

- `src/editor/editor.ts`：文章右键菜单的“编辑当前内容/添加正文”改为显式启用初始焦点保护，并把保护参数传到现有 `activateInlineEditable()`；菜单关闭时的短暂 `blur` 会重新聚焦，保护窗口结束后恢复正常失焦提交。
- `tests/article-context-edit.test.mjs`：新增上下文菜单焦点交接专项契约，并验证安装 bundle 同步包含保护入口。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`docs/FUNCTION_REFERENCE.md`：同步搜索跳转后的编辑行为、焦点边界与测试要求。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`：版本同步为 1.45.7；`update.json` 已写入 1.45.7 安装包 SHA-256 `10de29533723c911562b54802d1d46fab7569f42332438529f0e255f86afaa4d`。
- `main.js`：同步 1.45.7 运行逻辑；若当前平台 esbuild 仍不可用，则以源码等价手工同步并执行语法、类型和 bundle 契约校验。
- `TEST_RESULTS.md`、Codex 交接：记录问题根因、验证基线、真实 Obsidian 待验证项和本轮交付包。

## 1.45.3 全局/导图族搜索弹窗强制退出修复

- `src/search/global-search.ts`：全局搜索与当前导图族搜索共用的结果打开流程改为同时隐藏 `modalEl`、`containerEl` 和实际 `.modal-container`，调用 `Modal.close()` 后同步移除捕获节点，并按 `.mms-global-search-modal` / `.mms-global-search-container-closing` 做同步及短延迟 DOM 兜底清理。
- `tests/global-search-contract.test.mjs`：增加两种搜索入口共用同一 Modal 的契约，并验证源码与安装 bundle 都包含强制 DOM 清理。
- `main.js`：同步应用 1.45.3 搜索弹窗强制退出逻辑；由于当前 Linux 环境只有 Windows esbuild，无法执行生产重构建，已通过 `node --check` 与专项 bundle 契约验证。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`CHANGELOG.md`：同步两种搜索统一关闭行为、架构边界和测试要求。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`：版本同步为 1.45.3；`update.json` 已写入 1.45.3 安装包 SHA-256 `faf6e84ba343f942ecf43c93d0d5864c35227918ab5e319cc4f5c6e713ae1603`。
- `TEST_RESULTS.md`、Codex 交接：记录真实问题复现反馈、当前验证结果和仍需 Obsidian 桌面端手工确认的事项。

## 1.45.2 搜索结果跳转弹窗同步关闭修复

- `src/search/global-search.ts`：搜索结果导航前同步隐藏并移除实际 `.modal-container`，同时保留 `Modal.close()` 生命周期与重复点击保护，避免页面已跳转但空白搜索弹窗残留。
- `tests/global-search-contract.test.mjs`：新增同步隐藏、同步移除、禁止下一帧延迟清理以及 `main.js` 安装 bundle 同步逻辑契约。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`CHANGELOG.md`：同步用户行为、架构边界、测试要求和函数参考。
- `TEST_RESULTS.md`：记录专项验证、类型/文档/仓库检查以及上传依赖为 Windows esbuild 导致完整 `npm run verify` 无法在当前 Linux 环境完成的限制。
- `main.js`：同步应用与 TypeScript 源码等价的搜索弹窗立即关闭逻辑，并通过 `node --check` 与契约测试验证。

## 1.43.9 文章与导图往返定位修复

- `src/editor/editor.ts`：文章正文暂时切到导图或大纲后，返回文章会把当前节点预先写入显式文章目标，避免旧 DOM 像素滚动值抢占语义位置；语义恢复期间暂停边缘窗口自动扩展。
- `tests/reading-editor-contract.test.mjs`：新增文章往返模式恢复当前节点、首次进入目录规则保持不变及恢复期间禁止自动加载前文的契约测试。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/READING_PROGRESS_SYNC.zh-CN.md`、`CHANGELOG.md`：同步文章往返定位行为和手工验证范围。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：版本统一为 1.43.9。

## 1.43.8 XMind 深层画布根图片保留

- `src/import/import-export.ts`：同名跨画布挂载改用首个标题内容判断，合并被链接画布根主题除重复标题外的图片、公式、备注和后代，避免深层根图片被丢弃或被额外套一层同名节点。
- `tests/xmind-import.test.mjs`：新增父导图 → 子导图 → 孙子导图两级链接场景，验证两层根图片、深层公式、备注、共享资源落盘和路径重写。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`CHANGELOG.md`：同步嵌套画布根内容合并规则。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：版本统一为 1.43.8。

## 1.43.7 Ctrl/Cmd+F 搜索入口修复

- `src/main.ts`、`src/view.ts`：活动 MindMap Studio 视图在窗口捕获阶段直接处理 `Ctrl/Cmd+F`，并通过公开视图边界打开当前父子导图族搜索；弹窗内保持原按键行为。
- `src/editor/editor.ts`、`src/search/global-search.ts`：编辑器根节点保留快捷键回退和旧版 `Ctrl/Cmd+Alt+F` 兼容，工具栏提示与搜索范围注释改为 `Ctrl/Cmd+F`。
- `tests/reading-editor-contract.test.mjs`、`scripts/test.mjs`：更新快捷键优先级、窗口捕获、可编辑控件和非英文键盘布局契约。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`：同步新的搜索快捷键行为。

## 1.43.6 加载进度开关与完整范围替换

- `src/settings.ts`、`src/main.ts`、`src/view.ts`、`src/editor/editor-types.ts`、`src/editor/editor.ts`：新增默认关闭的右下角加载进度开关，并只在文章/通读且开关启用时显示。
- `src/search/global-search.ts`、`src/main.ts`：全部替换重新查询完整搜索作用域，不受显示结果上限影响；写回后立即刷新单文件索引并增加批量替换调试事件。
- `tests/global-search-contract.test.mjs`、`tests/settings-layout.test.mjs`：新增完整范围替换、索引刷新和加载进度默认关闭契约测试。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`：同步用户行为、架构边界和手工验证范围。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：版本统一为 1.43.6。

## 1.43.4 CI 文档覆盖修复

- `src/article/modes.ts`：为 `ArticleContextProgress` 增加完整 JSDoc，说明阶段、百分比与动态计数用途。
- `src/editor/editor.ts`：为右下角文章上下文进度渲染方法增加 JSDoc，明确其只负责只读反馈。
- `docs/FUNCTION_REFERENCE.md`：重新生成函数参考，文档覆盖提升为 56 个源码模块、1127 个具名声明。
- `CHANGELOG.md`、`TEST_RESULTS.md`、版本元数据与交付配置：同步 1.43.4 CI 修复结果。


## 1.43.3 文章/通读右下角加载进度

- `src/main.ts`、`src/article/modes.ts`：为文章族上下文构建新增统一进度回调与百分比 helper，在父子导图遍历、目录/章节索引和导航整理阶段持续上报进度。
- `src/view.ts`、`src/editor/editor.ts`、`styles.css`：在文章模式与通读模式右下角新增非阻塞加载进度浮层，完成到 100% 后自动隐藏，失败回退也会收口并清理残留状态。
- `tests/article-context-progress.test.mjs`、`tests/incremental-render.test.mjs`、`package.json`：新增进度 helper 和右下角进度链路专项测试，并把新测试纳入单元测试入口。
- `CHANGELOG.md`、`package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：版本统一为 1.43.3，重新生成生产构建并写入本轮安装包 SHA-256。
## 1.42.11 XMind 图片与 LaTeX 资源导入

- `src/import/import-export.ts`：解析 XMind 主题图片、归档 `resources/` 二进制、共享资源引用和常见公式字段；保留图片尺寸，缺失资源不生成破损内容块，并为非界面调用提供 data URL 回退。
- `src/editor/editor-modals.ts`、`src/editor/editor.ts`：桌面与浏览器 XMind 导入统一保存图片到当前导图资源目录，显示图片提取、公式识别和缺失资源数量。
- `tests/xmind-import.test.mjs`、`tests/import-mode.test.mjs`、`scripts/test.mjs`：新增图片资源提取、共享去重、路径改写、LaTeX 字段、缺失资源和自包含回退测试。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：说明 XMind 图片与公式导入行为及维护边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：版本统一为 1.42.11；最终安装包校验值在打包后写入。

## 1.41.10 通读编号使用当前内存文档

- `src/main.ts`：文章族刷新建立文件级文档缓存，并把当前编辑器文档预置为当前物理文件的权威快照；从子导图进入通读后修改编号时，不再读取尚未保存完成的旧磁盘副本。
- `tests/article-numbering.test.mjs`：新增当前子导图编号修改在延迟保存期间仍被目录和正文读取的回归契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步行为、维护边界和验证结果。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：统一版本为 1.41.10，安装包 SHA-256 为 `1cde15007c5fb14f4d998b3206b2263b500733ee1bab73f8fe13f7acc3ec6c13`。

## 1.41.5 中心节点关闭文章编号的整页语义

- `src/article/modes.ts`：新增当前物理导图编号关闭判定；根节点为 `none` 时清空全部章节与末端序号，但保留结构深度；普通节点关闭仍只跳过自身。
- `src/main.ts`：递归文章目录构建复用整页关闭状态，避免目录继续显示“第一章”。
- `src/editor/article-renderer.ts`、`src/editor/editor.ts`：子文章页标题不再显示父级编号，并补充中心节点/普通节点关闭语义说明。
- `tests/article-numbering.test.mjs`：新增整页关闭、普通节点单点跳号和目录/标题集成契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步行为、架构、数据语义和验证结果。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：统一版本为 1.41.5，最终安装包 SHA-256 在打包后写入。

## 1.41.4 大文件操作与全局页面切换过渡

- `src/editor/editor.ts`：新增统一页面过渡状态机、两帧绘制门、目标页面入口动画和导航异常边界；合并、提取、创建、父子导图跳转及显示模式切换接入分阶段状态。
- `styles.css`：新增全屏模糊过渡层、状态卡片、主题图标脉冲、页面淡入及减少动态效果回退。
- `tests/incremental-render.test.mjs`、`tests/reading-editor-contract.test.mjs`：新增大操作先绘制状态、全局导航包装、父级返回过渡和动画回退契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步交互状态机、维护边界、测试与交付状态。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：统一版本为 1.41.4，最终安装包 SHA-256 在打包后写入并重新生成生产构建。

## 1.41.3 文章表格列宽稳定保存与页面适配

- `src/editor/table-interaction.ts`：新增相邻列守恒调整算法，拖动当前分隔线时只让当前列与右侧列反向变化，并保持总宽度和最小列宽边界。
- `src/editor/article-renderer.ts`：保存值按总和转换为百分比，表格固定铺满文章宽度；只为非末列创建拖动柄，并优先从实际页面宽度开始调整。
- `src/editor/editor.ts`：列宽释放后直接记录历史、更新稳定表格块并触发保存，不同步重建整篇文章 DOM，避免目录/正文状态和阅读位置竞争。
- `src/view.ts`：记录最近一次持久化的中心标题，仅在标题确实变化时同步文件名，避免表格或样式保存将既有文件路径意外改名。
- `styles.css`：表格和外壳限制为页面宽度，采用固定布局与单元格强制换行，隐藏横向溢出。
- `tests/article-content-block.test.mjs`：新增相邻列边界、比例列宽、无末列拖动柄、无整页重绘、无横向滚动和标题同步保护回归。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步行为、数据边界、测试与交付状态。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：统一版本为 1.41.3，写入最终安装包 SHA-256 并重新生成生产构建。

## 1.40.11 删除文章边缘加载按钮跑马灯

- `styles.css`：删除加载按钮的角度自定义属性、圆角边框伪元素、`conic-gradient` 遮罩和边框无限动画；保留文字双轴居中与原有内部流光。
- `tests/incremental-render.test.mjs`：新增跑马灯样式不存在的反向契约，并继续验证内部流光及减少动态效果回退。
- `README.md`、`CHANGELOG.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`TEST_RESULTS.md`：同步当前加载反馈和资源边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.40.11 版本、最终安装包校验和生产构建。

## 1.40.10 文章边缘加载按钮跑马灯与文字居中

- `styles.css`：加载按钮改为 Flex 双轴居中；实际加载时增加主题深色圆角边框跑马灯，保留内部流光，并兼容减少动态效果。
- `tests/incremental-render.test.mjs`：增加按钮居中、`conic-gradient` 边框动画、遮罩与减少动态效果契约。
- `README.md`、`CHANGELOG.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`TEST_RESULTS.md`：同步用户可见反馈、测试边界和验证结果。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.40.10 版本、最终安装包校验和生产构建。

## 1.40.9 目录页阻止历史子文件自动恢复

- `src/article/reading-location.ts`：新增 `chooseArticleLandingRefreshLocation()`，目录激活时明确返回空恢复目标。
- `src/editor/editor.ts`：识别生成目录终止状态，取消残留阅读恢复并禁止历史子文件位置触发 `onDisplayModeChange()`；调试事件增加 `articleDirectoryActive`。
- `tests/reading-location.test.mjs`、`tests/reading-editor-contract.test.mjs`：增加目录抑制跨文件恢复的纯函数回归和编辑器集成契约。
- `README.md`、`CHANGELOG.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步真实 1.40.8 日志根因、行为边界和验证判据。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.40.9 版本、最终安装包校验和生产构建。

## 1.40.5 真实日志驱动的目标优先级热修复

- `src/article/reading-location.ts`：新增文章上下文刷新目标与入口过渡目标的纯函数优先级选择，显式目标始终压过骨架/历史恢复。
- `src/view.ts`、`src/editor/editor-types.ts`：跨文件操作保留一次性精确 `preferredCurrentNodeId` 到上下文刷新完成，不再只传布尔标记。
- `src/editor/editor.ts`：`setOptions()` 优先恢复精确当前文件目标；入口骨架不允许后到的普通恢复覆盖本次显式章节；新增恢复选择调试事件。
- `tests/reading-location.test.mjs`、`tests/reading-editor-contract.test.mjs`、`tests/incremental-render.test.mjs`：增加真实日志冲突的可执行优先级回归和集成契约。
- `README.md`、`CHANGELOG.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`TEST_RESULTS.md`：同步真实根因、调试判据、源码基线差异与验证状态。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`：版本提升为 1.40.5；`update.json` 和安装包 SHA-256 在最终打包后更新。

## 1.39.13 父级返回、章节落地与运行调试记录

- `src/main.ts`：新增显式导航目标校验与父挂载节点反查；目标文件切换前解析最终节点并排队；加入运行调试捕获、剪贴板复制命令和设置同步。
- `src/editor/editor.ts`、`src/editor/editor-types.ts`、`src/view.ts`：显式章节目标始终高于目录落地配置；跨文件替换文档时原子提交新选项并取消旧滚动事务；记录文章上下文、窗口挂载、语义定位、父级导航和异常状态。
- `src/debug/runtime-debug.ts`：新增有界、会话级、结构化运行日志；限制字段长度并过滤可编辑正文，支持 JSONL 导出和高频事件节流。
- `src/settings.ts`：在“管理配置”增加“调试模式”开关，启停时立即重置或停止当前会话日志。
- `tests/incremental-render.test.mjs`：新增显式目标正文落地、文件切换事务取消、父节点反查与调试复制命令契约；单元测试增至 281 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步导航优先级、调试数据边界和人工复现流程。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.13 版本、生产构建和最终安装包校验。

## 1.39.12 文章目录首帧与双向过渡

- `src/view.ts`、`src/editor/editor-types.ts`：新增文章上下文准备态；打开文件时先消费排队的跨文件目标，上下文未完成前禁止真实文章首帧，失败时回退当前文件并结束准备态。
- `src/main.ts`：跨文件目录导航在切换视图前排队目标节点，新视图同步消费，避免父章节编号与子文件根标题的临时组合。
- `src/editor/editor.ts`：目录/正文按目标类型显示骨架并使用对称过渡；新增独立落地模式切换链，返回目录清除正文恢复任务并固定从顶部进入。
- `styles.css`：增加目录目标骨架的层级行样式，沿用减少动态效果兼容。
- `tests/incremental-render.test.mjs`：新增文章上下文首帧门、目录双向过渡、目录顶部落地、跨文件目标预排队与同步消费契约；单元测试增至 280 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步首帧状态机、过渡和人工验证边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.12 版本、生产构建和最终安装包校验。

## 1.39.11 文章章节定位事务化

- `src/editor/editor.ts`：文章当前位置采集改用标题/真实章节专属选择器；新增最后一次导航独占的可取消语义滚动事务，异步上下文刷新沿用活动目标，并用最长 5 秒的布局观察抵消图片、表格、代码和字体晚到；用户滚轮、触摸、指针或键盘翻页立即接管。
- `tests/incremental-render.test.mjs`、`tests/article-content-block.test.mjs`、`scripts/test.mjs`：新增文章页壳排除、章节边界、旧任务令牌取消、异步布局稳定、亚像素写入和用户输入取消契约；单元测试增至 279 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步根因、事务时序、稳定窗口和人工验证边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.11 版本、生产构建和最终安装包校验。

## 1.39.10 文章入口骨架与窗口过渡反馈

- `src/editor/editor.ts`：文章首次进入和目录跳转增加可取消的双帧骨架绘制门；骨架阶段暂存语义位置，真实窗口挂载后恢复；边缘扩展先绘制加载状态再挂载内容，并尊重减少动态效果。
- `src/editor/article-renderer.ts`：初始窗口、目标窗口和前后扩展新增方向感轻微淡入标记。
- `styles.css`：新增固定范围骨架、流光、文章页/章节淡入和减少动态效果回退；不使用整页覆盖或章节占位。
- `tests/incremental-render.test.mjs`：新增骨架双帧、位置暂存、边缘加载、淡入和减少动态效果契约；单元测试增至 278 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步过渡行为、边界和验证结果。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.10 版本、生产构建和最终安装包校验。

## 1.39.9 文章 5 KB 目标窗口与章节定位

- `src/article/render-window.ts`：新增 UTF-8 字节预算、目标前后独立窗口和单方向边缘扩展纯函数。
- `src/editor/article-renderer.ts`：文章首次只挂载目标附近真实章节，提供前后扩展与目标强制挂载控制器；目录同文件条目直接聚焦；全树预扫描改用原始字段重量，避免整节点序列化。
- `src/editor/editor.ts`：滚动到窗口边缘时按需扩展，向上补载补偿高度；精确章节定位前确保目标已挂载；显式目标独占本轮重绘，避免旧位置竞争。
- `styles.css`：新增文章窗口和前文/后文加载按钮样式。
- `tests/incremental-render.test.mjs`：新增 5 KB 窗口、边缘扩展、向上位置补偿、同文件目录直达、显式位置竞争和精确目标挂载契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步窗口架构、跳转时序和验证边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.9 版本、生产构建和最终安装包校验。

## 1.39.8 文章模式对齐通读渲染

- `src/editor/article-renderer.ts`、`src/editor/editor.ts`：删除文章逐帧占位、隐藏舞台、覆盖层和延迟补齐链路，直接挂载完整真实章节 DOM；保留语义位置恢复、折叠、缩略导航和行内编辑。
- `src/main.ts`、`src/article/modes.ts`：文章分页导航传递父挂载节点；旧子导图元数据缺失节点 ID 时按父导图中的子导图路径反查。
- `src/article/article-render-cache.ts`、`tests/article-render-cache.test.mjs`：移除不再使用的文章节点持久缓存及其专项测试。
- `styles.css`：移除文章骨架、占位、隐藏舞台、加载旋转和页面交换样式。
- `tests/incremental-render.test.mjs`、`tests/reading-editor-contract.test.mjs`：改为验证文章单次完整渲染、真实章节语义跳转、父级返回节点和上下文刷新边界。
- `examples/`：将归档中退化为 `#Uxxxx` 的示例路径恢复为标准 UTF-8 中文文件名。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步重构后的架构、测试与交付状态。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.8；最终安装包 SHA-256 在打包后写入。
- `main.js`：由重构后的 TypeScript 源码重新生产构建。

## 1.39.6 快速编辑带圈序号垂直对齐

- `styles.css`：快速编辑时仅将带圈序号伪元素按现有 7px 顶部内边距向下补偿，不修改正文输入框、正文起点或水平缩进。
- `tests/article-content-block.test.mjs`：新增快速编辑样式契约，校验圆圈位移量与编辑框块级内边距一致，并禁止规则改动正文布局属性。
- `README.md`、`CHANGELOG.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步快速编辑对齐行为和维护边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.6，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 快速编辑待验证事项。
- `main.js`：按仓库交付规则重新执行生产构建。

## 1.39.5 带圈序号正文间距修复

- `styles.css`：缩小带圈编号圆环并调整自动模式槽内偏移，在保持正文首字与普通圆点正文对齐的同时，为圆圈和正文预留稳定间距。
- `tests/article-content-block.test.mjs`：扩展 CSS 几何契约，校验正文起点一致、圆圈右侧间距不少于 0.18em，并限制编号列偏移范围。
- `README.md`、`CHANGELOG.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步用户可见行为、维护边界和专项验证。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.5，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录浏览器几何验证、完整测试基线和 Win10 待验证事项。
- `main.js`：按仓库交付规则重新执行生产构建。

## 1.39.4 带圈序号自动缩进对齐

- `styles.css`：恢复自动对齐带圈编号的上级标题缩进，将编号槽收敛到与普通末端圆点相同的 1.25em，并在槽内微调圆圈中心；顶格模式和普通下一级文章序号保持不变。
- `tests/article-content-block.test.mjs`：新增标识列几何契约，校验圆圈中心与圆点中心误差小于 0.02em、两类正文首字起点完全一致。
- `README.md`、`CHANGELOG.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步自动对齐行为、维护边界和专项验证。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.4，并写入最终安装包 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录 Chromium 几何验证、完整测试基线和 Win10 待验证事项。
- `main.js`：按仓库交付规则重新执行生产构建。

## 1.39.3 带圈序号字体与基线统一

- `src/editor/article-renderer.ts`、`src/editor/editor.ts`：文章与通读的带圈序号不再把 Unicode 圈号直接放入伪元素，统一传递十进制索引供视觉层绘制。
- `styles.css`：全部带圈序号使用当前正文的字体和字重，以固定首行编号槽、圆环尺寸和绝对定位统一大小、基线及多行缩进；移除 Windows 符号字体回退。
- `src/import/import-export.ts`：HTML 第 1 项起统一输出 `.circled-number` 圆环，Markdown 与 Word 的无 CSS 可读表示保持兼容。
- `src/article/article-render-cache.ts`：文章渲染修订提升到 v4，使 1.39.2 的旧缓存自动失效，避免恢复旧 Unicode 标记。
- `tests/article-content-block.test.mjs`、`scripts/test.mjs`：增加统一字体、圆环、首行基线、HTML 1/51/67 项和缓存修订契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步显示边界与验证说明。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.3，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录验证基线与真实 Win10 手工检查项。
- `main.js`：由修复后的 TypeScript 源码重新生产构建。

## 1.39.2 末端正文带圈序号

- `src/core/model.ts`、`src/settings.ts`、`src/main.ts`：新增 `next-level` / `circled` 末端序号样式，提供全局默认、配置规范化与当前页面覆盖。
- `src/article/modes.ts`：新增 `circledNumberLabel()`，原生映射 `①–㊿`；第 51 项以后保留十进制编号，并允许带圈末端序号跨越文章标题八级边界。
- `src/editor/article-renderer.ts`、`src/editor/editor.ts`、`src/editor/editor-types.ts`、`styles.css`：在文章、通读与缓存指纹中传递带圈样式；51 以上使用 CSS 圆圈呈现。
- `src/import/import-export.ts`、`src/view.ts`：HTML 导出支持 51 以上圆圈结构，Markdown 与 Word 使用 `◯51` 可读回退，页面覆盖优先于插件设置。
- `tests/article-numbering.test.mjs`、`tests/article-content-block.test.mjs`、`scripts/test.mjs`：新增 Unicode 边界、67 个同级节点、深层结构和多格式导出专项测试。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步功能边界、导出回退、测试和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.2，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 待验证事项。
- `main.js`：由新增功能后的 TypeScript 源码重新生产构建。

## 1.39.1 深层文章编号边界修复

- `src/article/modes.ts`：集中定义八级文章编号上限；第 9 级及更深结构不再循环复用 `A.` / `（A）`，第 7、8 级字母序号超过 Z 后使用 AA、AB。
- `src/editor/editor.ts`：在文章编号设置帮助中明确八级边界与更深结构行为。
- `tests/article-numbering.test.mjs`、`scripts/test.mjs`、`package.json`：新增深层编号、无循环字母和超过 Z 唯一性专项测试，单元测试扩展至 278 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步编号边界、测试和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.1，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 待验证事项。
- `main.js`：由修复后的 TypeScript 源码重新生产构建。

## 1.39.0 文件浏览器增量筛选与文章缓存写盘合并

- `src/main.ts`：文件浏览器观察器收集新增/改路径局部根节点并去重，只在布局或筛选设置变化时完整扫描；移除仓库文件事件触发的全树刷新，并在卸载时清理待扫描状态。
- `src/article/article-render-cache.ts`：缓存持久化改为修订号单飞循环，运行中更新合并为一份后续快照；只在缓存命中改变 LRU 顺序时写入访问状态，干净卸载和重复最新命中不再写盘。
- `tests/file-explorer-filter.test.mjs`、`tests/article-render-cache.test.mjs`：增加局部扫描、禁止仓库写入触发全扫、干净刷新、LRU 跨重启与活动写入合并专项测试，单元测试扩展至 275 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步增量筛选、缓存持久化边界、测试和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.0，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 待验证事项。
- `main.js`：由本轮 TypeScript 源码重新生产构建。

## 1.38.9 设置串行合并与文件浏览器筛选优化

- `src/utils/coalesced-json-writer.ts`：新增通用 JSON 保存协调器，35 ms 尾随合并连续请求，严格单飞写入，并按请求版本完成或拒绝等待方。
- `src/main.ts`：所有插件设置保存改走协调器；卸载时刷新待写状态。文件浏览器 MutationObserver 仅处理相关 DOM 变化，筛选设置语义未变化时不再无条件扫描。
- `src/file-explorer-filter.ts`：新增筛选规则预编译与稳定语义签名；单次扫描复用扩展名集合、目录集合和路径规则。
- `tests/coalesced-json-writer.test.mjs`、`tests/file-explorer-filter.test.mjs`、`package.json`：增加合并、串行、失败恢复、签名归一化和插件集成契约测试，单元测试扩展至 273 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步持久化边界、筛选触发条件、性能基准和验证说明。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.9，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证、专项基准和真实 Obsidian 待验证事项。
- `main.js`：由本轮 TypeScript 源码重新生产构建。

## 1.38.8 设置分区与文章锁状态记忆

- `src/settings.ts`：一级设置分类默认全部收起，新增持久化展开列表；搜索驱动的临时展开不会污染用户记忆。“进入文章模式”增加“记住上次文章状态”。
- `src/article/display-mode.ts`：新增文章入口策略规范化与锁状态解析纯函数，支持 `locked`、`inherit`、`remember` 三种策略。
- `src/editor/editor-types.ts`、`src/editor/editor.ts`、`src/view.ts`、`src/main.ts`：在插件、视图和编辑器边界传递并保存文章模式独立锁状态，避免写回文件级 `view.readOnly`。
- `tests/display-mode.test.mjs`、`tests/settings-layout.test.mjs`、`scripts/test.mjs`：新增文章记忆策略、设置分类默认收起与持久化契约测试，单元测试扩展至 267 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步用户行为、数据边界、架构和验证说明。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.8，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Obsidian 待验证事项。
- `main.js`：由本轮 TypeScript 源码重新生产构建。

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
