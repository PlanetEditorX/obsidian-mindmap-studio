# Test Results

版本：1.47.1

## 1.47.1 AI 请求可取消（AbortSignal）

### 实现与行为验证

- `AiAskModal` 每轮 AI 请求（问答、整理、识图批处理）持有独立 `AbortController`；窗口关闭或再次发送立即中止上一轮。流式路径把 `AbortSignal` 传入浏览器 Fetch，读取拒绝原样向上传播；`requestUrl` 路径在请求前后执行 `throwIfSignalAborted()` 校验（Obsidian `requestUrl` 不支持中途取消，已在架构文档明确该边界）。
- 取消与失败在 UI 上分离：主动取消显示“已取消本次 AI 请求 / 已取消本次图片识别”，不进入错误阶段、不输出错误日志；AI 识图错误包装放过取消错误，不再把取消误报为“模型不支持视觉输入”。
- 识图串行批处理每张图片处理前检查信号，取消后剩余图片不再发起网络请求，已完成的识别结果保留。
- `node --test tests/ai.test.mjs`：**30 / 30 通过**；其中新增 5 项——`isAiRequestCancelled()` 对 `AbortError`、`TimeoutError`、常见中止消息与普通网络错误的判定边界；`throwIfSignalAborted()` 对未中止/已中止信号的行为；`consumeAiStreamReader()` 跨块 SSE 事件累计、思考与正文增量回调、`model`/`usage` 覆盖与 `[DONE]` 忽略；读取器中止错误原样传播；modal/view 取消接线（关闭中止、`beginRequestSignal()`、识图取消不计入失败图片）的源码与安装 bundle 契约。
- 修复测试工具 `loadTypeScriptModules()` 的 Windows 兼容问题：调用方传入绝对源码路径时先按 `process.cwd()` 归一化为相对路径，避免 `path.join` 在 Windows 拼出含盘符的非法临时目录；Linux 行为不变。`tests/article-context-cache.test.mjs` 等 4 个此前在本机必然失败的测试文件恢复正常。
- `npm run verify`（本机完整执行）：`test:unit` **393 / 393 通过**；`test:regression` 全部通过（含 `main.js` 安装 bundle 契约）；`test:docs` 覆盖 **58 个源码模块、1236 个具名声明**；`test:repo` 通过；`tsc --noEmit` 与 production esbuild 通过，`main.js` 已用本批逻辑重新构建。

### 兼容性边界

- `requestAiCompletion()` / `requestAiEditProposal()` / `requestAiImageRecognition()` / `fetchAiProfileModels()` / `testAiProfileConnection()` 新增的 `AbortSignal` 参数全部可选；不传信号时行为与 1.47.0 完全一致。
- AI 请求体、SSE 解析结果、接口配置结构、撤销/保存链路与 `.mindmap` 数据格式均不变。

### 仍需手工验证

- 真实桌面端：流式问答进行中关闭 AI 窗口，确认状态不再停留“生成中”、无异常日志；再次发送时上一轮立即中止。
- 真实桌面端：识图批处理进行中关闭窗口，确认剩余图片不再请求，取消提示正确显示。
- 跨域回退路径（服务端未开放 CORS）下取消仅在前置校验生效，属预期行为。

## 1.46.3 mutation 序列化快照复用性能优化第五批 5.2

### 实现与行为验证

- `DocumentHistory` 新增字符串快照入口，但 undo/redo 仍保存完整文档 JSON。普通 mutation 通过 `captureHistorySnapshot()` 复用最近一次已发布修订字符串作为修改前历史，不再额外序列化旧树；`notifyDocumentChange()` 使用 `createDetachedDocumentSnapshot(true)` 强制只序列化一次修改后状态，再恢复一个与编辑器内部模型隔离的宿主对象。
- zoom/pan、恢复导航、只读、文章落地和阅读恢复折叠等未立即触发 `onChange` 的持久字段会显式使 `documentSnapshotJson` 失效；下一次读取/历史捕获自动回退完整序列化。异步图片上传、批量上传和拖放的备用 undo 也改为冻结字符串快照，避免为了“可能失败”先深拷贝整棵文档。
- `node --test tests/history-snapshot-reuse.test.mjs`：**5 / 5 通过**；覆盖字符串快照 `captureSnapshot / undoSnapshot / redoSnapshot` 往返、旧 `capture/undo/redo` API 兼容、普通 mutation 不再使用 `history.capture(this.document)`、未发布状态缓存失效以及安装 `main.js` 同等契约。
- 第五批 5.1 宿主快照 + 5.2 历史序列化 + 文章/阅读/渐进渲染联合专项：**75 / 75 通过**。
- 修改的 TypeScript 模块使用环境已有 TypeScript `transpileModule` 独立检查：`src/editor/history-manager.ts`、`src/editor/editor.ts` **2 / 2 通过**；`node --check main.js` 通过。
- 两条表格编辑测试原先硬编码 `history.capture(this.document)`；更新为 `captureHistorySnapshot()` 后，`article-content-block + history-snapshot-reuse + document-snapshot-reuse` 联合专项 **31 / 31 通过**。
- 恢复原仓库 `examples/` 仅用于测试后执行正式 `npm run test:unit`：共 **380 项**，其中 **378 项通过**；只有 `tests/plugin-update.test.mjs` 与 `tests/xmind-import.test.mjs` 在测试文件加载阶段因当前环境缺 `esbuild` 失败，没有第五批 5.2 业务断言失败。
- `npm run docs:generate`、`npm run test:docs`：通过，当前 **58 个源码模块、1228 个具名声明全部覆盖**；`npm run test:repo`：通过；`node --check tests/history-snapshot-reuse.test.mjs` / `tests/document-snapshot-reuse.test.mjs`：通过。

### 隔离性能基准

- 使用结构化文档模拟连续 mutation 的稳定态成本。旧方式每次执行“history 对修改前文档 `JSON.stringify` + change snapshot 对修改后文档 `JSON.stringify + JSON.parse`”；新方式直接复用上一修订字符串进入 history，只对新修订执行一次 `stringify + parse`。中位耗时：1,000 节点约 **0.689 ms → 0.537 ms（1.28×）**；5,000 节点约 **3.979 ms → 2.921 ms（1.36×）**；10,000 节点约 **7.271 ms → 5.583 ms（1.30×）**。该结果只衡量 mutation 边界被删除的一次旧树序列化，不代表 Obsidian 整帧同倍数加速。

### 本地环境边界

- `npm run test:regression` 在执行任何断言前因当前工作区缺 `esbuild` 退出；与本批业务逻辑无关。
- `npm run build` 在 TypeScript 检查阶段因当前源码交付环境缺 `obsidian` 及其扩展 DOM 类型而失败，未进入 production esbuild；这不是 5.2 的源码类型结论。`main.js` 按现有 1.46.3 bundle 等价同步，正式发布前需在完整 GitHub Actions 执行 `npm ci && npm run verify` 并重新生成 production bundle。
- 临时恢复的 `examples/` 和本地 TypeScript 软链接只用于验证，最终源码交付包按仓库规则排除 `examples/` 与 `node_modules/`。

### 安全边界

- `documentSnapshotJson` 只有在与当前可持久文档完全一致时才能复用；任何绕过 `notifyDocumentChange()` 的持久状态写入都必须显式失效。性能优化不能以复用过期 JSON 为代价。
- `DocumentHistory` 仍使用完整 JSON 快照、原 history limit 和原 undo/redo 行为；本批没有实现增量 patch history。
- View 第五批 5.1 的宿主快照复用保持不变；编辑器内部可变 `this.document` 仍不会直接暴露给 View 或异步服务。

### 本轮交付

- 测试安装 ZIP：`mindmap-studio-1.46.3-test-392641.zip`
- SHA-256：`4277a89bb1b287388a766e1f8f3fc48f9a49a3d31bd1e584cb20e1a83c8ab106`
- 完整源码与 Codex 交接使用相同 `392641` 后缀。

## 1.46.3 文档快照复用性能优化第五批 5.1

### 实现与行为验证

- 编辑器 `notifyDocumentChange()` 继续通过 `getDocument()` 在 mutation 边界生成一份与内部模型隔离的完整文档快照；View 不再在同一修订内重复调用 `editor.getDocument()`。`getViewData()` / `save()` 改为 `currentDocumentSnapshot(true)`，只从 `getPersistedViewState()` 合并最新 zoom/pan 等轻量 `view` 元数据。当前导图族搜索、AI 上下文、图片识别和完整文章上下文刷新直接复用当前宿主 `this.document` 快照。
- `node --test tests/document-snapshot-reuse.test.mjs`：**3 / 3 通过**；源码与 `main.js` 双重契约确认 View 内重复 `editor.getDocument()` 为 0 处，同时保留 change callback 的一次隔离 clone。
- 第四批文章上下文 + 第三批节点索引 + 第二批增量渲染 + 本批快照复用联合专项：**80 / 80 通过**。
- 恢复原仓库 `examples/` 仅用于测试后执行正式 `npm run test:unit`：共 **375 项**，其中 **373 项通过**；只有 `tests/plugin-update.test.mjs` 与 `tests/xmind-import.test.mjs` 在加载阶段因当前环境缺 `esbuild` 失败，没有第五批业务断言失败。
- 修改的 TypeScript 模块使用环境已有 TypeScript `transpileModule` 独立检查：`src/editor/editor.ts`、`src/view.ts` **2 / 2 通过**；`node --check main.js` 与 `node --check tests/document-snapshot-reuse.test.mjs`：通过。
- `npm run docs:generate`、`npm run test:docs`：通过，当前 **58 个源码模块、1221 个具名声明全部覆盖**；`npm run test:repo`：通过。

### 隔离性能基准

- 使用结构化 1,000 / 5,000 / 10,000 节点文档模拟“同一修订被 5 个宿主只读路径消费”。旧方式执行 5 次 `JSON.parse(JSON.stringify(doc))`；新方式执行 1 次隔离 clone + 4 次顶层/`view` 浅合并。中位耗时约为：1,000 节点 **3.05 ms → 0.57 ms**；5,000 节点 **17.88 ms → 3.53 ms**；10,000 节点 **33.10 ms → 7.39 ms**。该结果只衡量被删除的重复快照成本，不代表 Obsidian 完整帧耗时或整体加速倍数。

### 本地环境边界

- `npm run test:regression` 在执行任何断言前因当前工作区缺 `esbuild` 退出；与本批业务逻辑无关。
- 当前源码交付环境仍没有完整 `obsidian` / `esbuild` 等项目开发依赖，不能把本地 `npm run build` 作为 production 结论。`main.js` 按第四批现有 bundle 等价同步第五批 5.1 运行逻辑，正式发布前需在 GitHub Actions 或完整开发机执行 `npm ci && npm run verify` 并重新生成 production bundle。
- 临时恢复的 `examples/` 和本地 TypeScript 软链接只用于验证，最终源码交付包继续按仓库规则排除 `examples/` 与 `node_modules/`。

### 真实 Obsidian 重点复测

1. 5000+ 节点导图连续编辑文字/样式/图片后等待自动保存，确认保存状态与文件内容正确且交互卡顿降低。
2. 编辑后立即打开 AI、图片识别或 `Ctrl/Cmd+F` 当前导图族搜索，确认使用最新内容，不出现上一修订快照。
3. 仅缩放/平移画布后触发 Obsidian 保存或关闭重开，确认 zoom/pan 仍正确持久化。
4. 继续验证 undo/redo、父子导图返回、文章 change-impact 分级与后台图片上传；本批不应改变这些语义。

### 本轮交付

- 测试安装 ZIP：`mindmap-studio-1.46.3-test-517306.zip`
- SHA-256：`02a2dc424da95f4e47eb91d31f50699acce2da77f1e44068f142fe738cadd099`
- 完整源码与 Codex 交接使用同一 `517306` 后缀。

## 1.46.3 文章上下文性能优化第四批

### 实现与行为验证

- 新增 `none / content / structure` 三档文章上下文影响。`none` 只保存当前文档；`content` 使用已加载 `readingSections` 在内存中重算目录标题、编号与 breadcrumb；`structure` 保持完整父/子导图文章族构建。轻量重算检测到目录数量、编号层级或 `tocDepth` 与既有上下文不一致时返回 `null` 并自动安排完整刷新。
- 完整 `refreshArticleContext()` 捕获 `documentChangeRevision`；异步构建期间如果用户又编辑了当前文档，成功路径会记录 `refresh-stale-document` 并丢弃旧结果，异常路径同样不写入旧回退快照，二者都会立即安排最新完整刷新。
- `node --test tests/article-numbering.test.mjs tests/article-content-block.test.mjs tests/article-context-edit.test.mjs tests/article-context-cache.test.mjs tests/reading-editor-contract.test.mjs tests/incremental-render.test.mjs`：**112 / 112 通过**。
- 排除当前环境入口即缺少 `esbuild` 的 `tests/xmind-import.test.mjs` 与 `tests/plugin-update.test.mjs` 后，正式 `test:unit` 其余文件：**370 / 370 通过**。直接执行完整 `npm run test:unit` 显示 **370 个测试通过、2 个测试文件在加载阶段因 `ERR_MODULE_NOT_FOUND: esbuild` 失败**，没有第四批业务断言失败。
- 修改的 4 个 TypeScript 源码模块使用环境已有 TypeScript `transpileModule` 独立检查：**4 / 4 通过**。`node --check main.js` 与 `node --check scripts/test.mjs`：**通过**。
- `npm run docs:generate`、`npm run test:docs`：**通过**，当前 **58 个源码模块、1219 个具名声明全部覆盖**；`npm run test:repo`：**通过**。

### 本地环境边界

- `npm run test:regression` 在执行任何回归断言前即因当前源码工作区缺 `esbuild` 停止；不是 regression 业务失败。
- `npm run build` 无法在该工作区作为正式类型/production 结论：源码交付包按规则不包含完整 `node_modules`，当前仅临时复用全局 TypeScript，缺少 `obsidian` 等项目开发依赖会导致 Obsidian 基类属性/模块类型不可解析。正式发布前必须在 GitHub Actions 或完整开发机执行 `npm ci && npm run verify` 并重新生成 production `main.js`。
- 本轮 `main.js` 因此是与源码等价同步的安装 bundle，不声称为当前容器 production esbuild 产物。

### 真实 Obsidian 重点复测

1. 在父导图/子导图文章模式连续修改标题，目录标题、编号和 breadcrumb 应快速更新，且不跳页、不错误改变子导图目录项目标。
2. 连续修改图片、表格、代码、样式、节点尺寸与折叠状态，确认文章/通读当前位置稳定，不出现无意义的整族解析进度或页面闪烁。
3. 新增、删除、移动节点，修改文章编号或创建/删除子导图后，完整目录结构、分页和通读仍正确刷新。
4. 在首次/完整文章族解析仍进行时立即继续编辑标题，旧解析结果不得回写覆盖新标题；最终目录必须反映最新文档。
5. 继续复测前三批大型导图性能、旧子导图返回按钮、搜索和撤销/保存，确认第四批只改变文章上下文刷新成本。

### 本轮交付

- 测试安装 ZIP：`mindmap-studio-1.46.3-test-421786.zip`
- SHA-256：`3e0b96d6dea18a1875d5ee82289638663f1e1edfaddcb3c3e96b955e578ee6ed`
- 完整源码与 Codex 交接使用同一 `421786` 后缀。

## 1.46.3 第三批性能优化 CI 全选契约修复

### 用户 GitHub Actions 日志

- `npm ci` 成功；`npm run test:unit`：**377 / 377 通过**，说明上一轮图片粘贴 `nodeById()` 契约修复已经生效，第三批运行时行为没有单测回归。
- `npm run test:regression` 随后唯一失败于 `scripts/test.mjs` 的“select all must include all descendants while excluding the root node”源码契约；旧断言仍要求 `flattenNodes(this.document.root)`，而第三批已经把全选改为 `this.nodeTreeNodes()` 复用 `NodeTreeIndex.nodes`。
- CI 因 regression 非零退出未继续 docs、repo 或 production build；日志没有显示新的业务错误或 TypeScript 错误。

### 本轮修复与本地验证

- `scripts/test.mjs` 更新为验证 `selectAllNodesExceptRoot()` 调用 `this.nodeTreeNodes()`、过滤 `document.root.id` 并把 ID 写入 `selectedIds`；`Ctrl/Cmd+A` 捕获与调用入口契约保持不变。
- 对当前 `src/editor/editor.ts` 单独执行更新后的正则契约：**通过**；同时确认旧 `flattenNodes(this.document.root)` 全选契约已不存在。
- `node --check scripts/test.mjs`：**通过**。
- `npm run test:repo`：**通过**。
- 当前容器重新执行 `npm ci --ignore-scripts --no-audit --no-fund` 仍因 registry 获取超时，无法本地启动依赖 `esbuild` 的完整 `test:regression` / `npm run verify`。下一次 GitHub Actions 应首先验证 regression 继续通过，再观察 docs/repo/production build。
- 本轮没有修改 `src/` 或运行时代码，因此 `main.js` 与第三批性能优化版本保持一致。

### 本轮交付

- 测试安装 ZIP：`mindmap-studio-1.46.3-test-885141.zip`
- SHA-256：`5a5385cbb1c35273ca3a765d67a4dabb8190b08637a2f92a57747fc16d52c9f2`
- 完整源码与 Codex 交接使用同一 `885141` 后缀。

## 1.46.3 第三批性能优化 CI 图片粘贴契约修复

### 用户 GitHub Actions 日志

- `npm ci`：成功，安装 18 个包，审计 19 个包，0 个漏洞。
- `npm run test:unit` 共 **377 项，375 通过 / 2 失败**。两个失败都位于 `tests/article-content-block.test.mjs`，分别是“图片粘贴错误分流”和“导图图片粘贴使用实时选择”源码契约。
- 两个失败都仍硬编码匹配旧实现 `findNode(this.document.root, nodeId)`；第三批节点树索引已经把该查询等价优化为 `this.nodeById(nodeId)`，CI 日志中的实际 `handlePaste()` 同时保留“粘贴开始时选择的节点已不存在”提示以及实时 `selectedId` 目标冻结逻辑。
- 因 `test:unit` 非零退出，本次 CI 没有继续执行 `test:regression`、docs、repo 或 production build；日志没有显示第三批运行时代码失败。

### 本轮修复与本地验证

- `tests/article-content-block.test.mjs` 两条契约改为要求 `const selected = nodeId ? this.nodeById(nodeId) : null`，与第三批 `NodeTreeIndex` 热路径一致；继续验证导图模式不得被旧 DOM focus 覆盖实时选择，且异步保存完成时目标节点已不存在必须给出独立提示。
- 临时复用环境已有 TypeScript 后执行 `node --test tests/article-content-block.test.mjs`：**23 / 23 通过**，包括用户 CI 中失败的两条。
- 本轮没有修改 `src/`、`styles.css` 或运行时代码；`main.js` 与第三批性能优化交付保持一致，无需因测试正则变更而重构建。
- 当前容器尝试 `npm ci --ignore-scripts --no-audit --no-fund` 仍因网络获取超时，不能本地复现 GitHub Actions 的完整 `npm run verify`。下一次 CI 应先确认 377 项单测全部通过，再继续执行 regression/docs/repo/build。

### 本轮交付

- 测试安装 ZIP：`mindmap-studio-1.46.3-test-465824.zip`
- SHA-256：`5a5385cbb1c35273ca3a765d67a4dabb8190b08637a2f92a57747fc16d52c9f2`
- 完整源码与 Codex 交接使用同一 `465824` 后缀。

## 1.46.3 大型导图性能优化第三批

### 实现与专项验证

- 新增 `NodeTreeIndex`：完整渲染只做一次 DFS，建立 `nodes`、`byId`、`parentById` 与 `hasCollapsibleNodes`。普通选择、工具栏、键盘导航、节点编辑、删除回退与多数结构操作直接复用索引；多选顶层过滤和拖放合法性改为沿父链判断祖先。
- 结构生命周期采用“完整渲染统一重建 + 根对象变化懒重建”：纯内容编辑继续复用实时节点引用；批量移动第一步允许使用现有索引，后续树结构已变化时重新按当前树构建临时索引，避免缓存父关系过期。
- `node --test tests/article-context-edit.test.mjs tests/incremental-render.test.mjs tests/node-tree.test.mjs tests/node-tree-index-actions.test.mjs`：**51 / 51 通过**，包含节点索引 DFS 顺序、直接父节点、祖先判断、现有索引首步移动，以及文章编辑/第二批 DOM 性能回归。
- 本轮 5 个修改 TypeScript 模块使用环境已有 TypeScript `transpileModule` 做独立语法检查：**5 / 5 通过**；`node --check main.js`：**通过**。
- `npm run docs:generate`、`npm run test:docs`：**通过**，当前 **58 个源码模块、1210 个具名声明**全部覆盖；`npm run test:repo`：**通过**；`node --check scripts/test.mjs`：**通过**。
- 隔离算法微基准（非真实 Obsidian 帧耗时）：300 次工具栏/选择类查询在约 5000 节点树上，旧式重复树扫描约 **28.5 ms**，一次索引构建约 **2.1 ms**，索引热路径约 **0.19 ms**；约 20000 节点时旧扫描约 **95.1 ms**、索引构建约 **4.8 ms**、热路径约 **0.18 ms**。该数据只说明重复 DFS 被消除，不代表整个插件获得同倍数加速。

### 构建边界

- 当前工作区来自源码交付包，本就不包含完整 `node_modules`；本轮尝试 `npm ci` 时当前容器无法稳定访问 npm registry，留下的依赖目录不完整，无法在本地可信执行完整 `npm run verify` / production esbuild。正式发布前必须在 GitHub Actions / 完整开发机执行 `npm ci && npm run verify`。
- `tsc --noEmit --skipLibCheck` 当前在加载源码前即因不完整依赖缺少隐式类型库 `codemirror`、`estree`、`node`、`tern` 停止，因此该结果不能用于判断本批源码类型；修改文件另以 `transpileModule` 语法检查和专项行为测试兜底。
- `main.js` 因此继续采用现有 1.46.3 bundle 等价同步本批运行逻辑；源码与 bundle 契约测试、TypeScript 独立语法检查和 Node 语法检查用于本地防回退，不替代正式 production build。

### 真实 Obsidian 重点复测

1. 5000+ 节点导图持续快速单选、方向键导航和工具栏操作，确认节点定位与按钮可用性正确且响应稳定。
2. Ctrl/Cmd 多选父子节点后复制、删除、拖放，确认只处理顶层选择分支，顺序与旧版本一致。
3. 尝试把父节点拖入自己的任意深层后代，必须继续拒绝；合法跨分支移动、before/after/child 三种位置均保持正确。
4. 连续新增、删除、移动节点以及撤销/重做，确认每次结构变化后的选择回退、父节点判断和后续操作没有读取旧索引。
5. 继续复测第二批 DOM 索引、旧子导图返回父导图、全局搜索和文章/通读模式，确认本批只改变树查询成本，不改变跨文件行为。

### 本轮交付

- 测试安装 ZIP：`mindmap-studio-1.46.3-test-745464.zip`
- SHA-256：`8a7589062fa296889fb51d0e913a1fabf255494bb22c541c497f3770b1b6fa0a`
- 完整源码与 Codex 交接使用同一 `745464` 后缀。

## 1.46.3 大型导图性能优化第二批

### 实现与专项验证

- 已挂载导图节点新增 `nodeId → HTMLElement` 索引；渐进挂载、拖拽、框选矩形读取、实测尺寸、FLIP、行内编辑和单节点刷新不再为每个节点重新扫描整个节点层。普通单选从 A 切换到 B 时，选择 CSS 候选由“全部已渲染节点”缩小为 A/B 两个 ID；5000 节点场景的候选操作数理论上由 5000 降为 2，约减少 **99.96%**。该数字是 DOM 写入候选数量，不等同于真实 Obsidian 整帧耗时。
- `selectionClassDelta()` 覆盖普通单选切换、多选增加/移除以及单选↔多选边界；大纲/文章 DOM 重建后故意执行一次全量同步，避免新挂载章节漏掉选择样式。
- `node --test tests/incremental-render.test.mjs tests/image-layout.test.mjs`：**29 / 29 通过**。
- 除本地缺失依赖/交付源码省略资源以及两个与本批无关的历史文章缓存源码文本契约外，其余单测批量补跑：**356 / 356 通过**。其中 `article-render-cache.test.mjs` 的两条失败断言检查当前源码已不存在的旧 `compatibleArticleCache(...)` / `buildArticleNodeInfo(...callback)` 文本结构，本批未修改文章渲染器；`settings-normalize` 及 `plugin-update` / `xmind-import` 在当前不完整 `node_modules` 下分别缺 `obsidian` / `esbuild`，`repository-cleanup` 的样例路径检查则依赖按源码交付规则未包含的 `examples/`。
- 本轮两个修改 TypeScript 模块使用环境已有 TypeScript `transpileModule` 做独立语法检查：**2 / 2 通过**。
- `npm run docs:generate`、`npm run test:docs`：**通过**，当前 **58 个源码模块、1198 个具名声明**全部覆盖。
- `npm run test:repo`：**通过**。
- `node --check main.js`：**通过**。

### 构建边界

- 当前工作区此前尝试 `npm ci` 时网络超时，只留下不完整开发依赖。`npm run build` 在 TypeScript 前置检查阶段因缺 `codemirror`、`estree`、`node`、`tern` 类型定义停止，未进入 production esbuild；这属于当前容器依赖状态，不是本批 TypeScript 业务错误。
- 因此 `main.js` 为基于现有 1.46.3 bundle 的等价同步版本。正式发布前必须在依赖完整的 GitHub Actions / 开发机执行 `npm ci && npm run verify`，并以正式 esbuild 产物覆盖安装包。

### 真实 Obsidian 重点复测

1. 5000 节点以上导图中快速单选、Ctrl/Cmd 多选与取消多选，确认选择描边和 `is-multi-selected` 状态无残留，工具栏响应比上一版更稳定。
2. 持续拖拽节点、框选大区域和快速移动鼠标，确认拖拽提示、框选范围和节点命中保持正确，指针移动不再伴随明显 DOM 扫描卡顿。
3. 含图片、表格、代码的大分支连续展开/折叠，确认 ResizeObserver 实测尺寸、FLIP 动画、连接线和视口锚点保持稳定。
4. 在导图、大纲、文章、通读之间切换并保持已有选择，确认非导图 DOM 重建后的首次全量选择同步不会漏选或残留多选样式。
5. 继续复测旧子导图左上角返回父导图按钮、全局搜索和第一批碰撞/排序优化，确认跨文件行为未受本批 DOM 索引影响。

### 本轮交付

- 测试安装 ZIP：`mindmap-studio-1.46.3-test-634215.zip`
- SHA-256：`8e35d04708f8b25c564e971eb1c6fc849c68b297c0418a365554ccf96441b3dd`
- 完整源码与 Codex 交接使用同一 `634215` 后缀。

## 1.46.3 CI production build 未使用代码修复

### 用户 CI 日志

- `npm ci` 成功。
- `npm run test:unit`：**369 / 369 通过**。
- `npm run test:regression`：**通过**，上轮 `first climb to the top parent` 旧注释契约问题已修复。
- `npm run test:docs`：**通过**，当时为 57 个源码模块、1195 个具名声明。
- `npm run test:repo`：**通过**。
- `npm run build` 进入 TypeScript 前置检查后仅失败于 `src/search/global-search.ts(733,12): TS6133: 'walkNodes' is declared but its value is never read.`；没有第二个业务/类型错误。

### 本轮修复与本地验证

- 删除 `GlobalMindMapSearchIndex.walkNodes()`；该私有生成器在当前源码没有任何调用，属于索引重构后的残留死代码。
- `node --test tests/global-search-traversal.test.mjs`：**4 / 4 通过**。
- `npm run docs:generate`：**通过**；`npm run test:docs`：**通过**，当前 57 个源码模块、**1194 个具名声明**。
- `npm run test:repo`：**通过**。
- `node --check main.js`：**通过**；安装 bundle 同步删除无用方法。
- 当前容器重新执行 `npm ci` 因外部依赖获取超时，只获得不完整 `node_modules`；因此无法在本地重新执行完整 `npm run verify`/正式 esbuild production build。用户 CI 已证明修复前除该唯一 `TS6133` 外，369 个单测、regression、docs、repo 均通过；下一次 GitHub Actions 应验证 build 继续完成。

- 本轮测试安装包：`mindmap-studio-1.46.3-test-740774.zip`，SHA-256 `0053ba3e0a70dbb33913b6d9a2cfedaf3ce821abd71238a8c9af9296affb59c6`；完整源码与 Codex 交接使用同一 `740774` 后缀。

## 1.46.3 CI 综合回归契约修复

### 用户 CI 日志与根因

- 用户提供的 GitHub Actions 日志确认依赖安装成功，完整 `test:unit` 共 **369 / 369 通过**；第一批性能优化没有产生单元测试回归。
- `test:regression` 随后在 `scripts/test.mjs:1368` 失败，唯一原因是仍要求 `src/search/global-search.ts` 包含历史注释文本 `first climb to the top parent`。上一轮导图族索引优化已重写该段注释/实现说明，因此这是测试契约过期，不是父链搜索行为失败。
- 本轮把该断言改为检查 `refreshFamily()` 的实际父链数据流，不再把注释 wording 当成程序行为。

### 自动验证

- `node --test tests/global-search-traversal.test.mjs`：**4 / 4 通过**；其中包含“新鲜索引 0 次 `cachedRead`”与“过期祖先跨爬升/向下遍历只读 1 次”的真实行为测试。
- 新综合回归源码契约单独执行：**通过**；同时确认 `scripts/test.mjs` 已不存在旧 `first climb to the top parent` 断言。
- `npm run test:docs`：**通过**，当前 **57 个源码模块、1195 个具名声明**满足文档覆盖。
- `npm run test:repo`：**通过**。
- `node --check main.js`：**通过**。
- 当前本地源码包仍缺 `esbuild`，所以直接执行 `npm run test:regression` 会在 `import { build } from "esbuild"` 阶段退出，无法在本容器复现 GitHub Actions 的完整综合回归；用户日志已证明 GitHub CI 环境具备完整依赖。下一次 CI 应首先验证本轮修复后是否继续通过后续 regression/build 阶段。
- 本轮没有运行时代码修改，因此无需重新生成 `main.js`；安装包运行时与第一批性能优化版本一致。
- 本轮测试安装包：`mindmap-studio-1.46.3-test-527971.zip`，SHA-256 `02aae55163facd84e9c67cfbf938687cb73305373b86e1664410f80336b38fe3`；完整源码与 Codex 交接使用同一 `527971` 后缀。

## 1.46.3 大型导图性能优化第一批

### 实现与行为验证

- 实测尺寸二次布局现在只调用一次权威 `computeLayout()`；该函数内部已经完成碰撞消解、节点映射和画布边界计算，编辑器层不再重复执行第二轮 collision 或重新计算 `byId/minX/maxX/minY/maxY`。
- `resolveLayoutCollisions()` 保留原先的节点顺序与子树移动语义，但利用顶部排序提前结束已经满足纵向间距的后续扫描。随机生成 **300 组**树形布局逐组对比优化前后 `moves` 与全部节点坐标，**300 / 300 完全一致**。
- `prioritizeSpatialRenderItems()` 把 band、focus rank、distance 从 `sort` 比较器移到一次性预计算。随机生成 **500 组**布局项、视口和聚焦顺序逐组对比，**500 / 500 排序结果完全一致**。
- 隔离算法微基准仅用于方向性比较：5000 个纵向已分离节点的 collision 中位耗时约从 **71.7 ms 降至 7.3 ms（约 9.8×）**；20000 个布局项的空间排序约从 **13.5 ms 降至 7.9 ms（约 1.7×）**。这些数字不等同于真实 Obsidian 整体帧耗时。
- 工具栏可用性由 `toolbarAvailabilityContext()` 单次遍历节点树后共享给全部按钮；`delete/collapse-all/selected` 等判断不再为每个工具栏项重复调用 `findNode()` / `flattenNodes()`。

### 自动验证

- 第一批性能专项：`code-block + incremental-render + settings-layout` 共 **48 / 48 通过**。
- 完整 `npm run test:unit`：共 **361 项，359 通过 / 2 失败**；仅 `tests/plugin-update.test.mjs` 与 `tests/xmind-import.test.mjs` 在文件加载阶段因当前源码环境缺少 `esbuild` 报 `ERR_MODULE_NOT_FOUND`，未进入测试体。`examples/` 为按交付规则不进入源码 ZIP 的未修改样例，本轮验证时从用户原始 ZIP 恢复真实 UTF-8 路径后执行。
- `npm run test:regression`：`scripts/test.mjs` 启动时因缺少 `esbuild` 退出，未进入综合回归测试体。
- `npm run build`：上传源码没有完整 `obsidian` / `fflate` 等开发依赖和类型声明，TypeScript 前置检查阶段停止；production esbuild 未执行。
- 本轮 3 个修改 TypeScript 文件使用环境已有 TypeScript `transpileModule` 做独立语法检查：**3 / 3 通过**；临时 `node_modules/typescript` 链接不进入交付物。
- `npm run docs:generate`：**通过**；`npm run test:docs`：**通过**，当前 **57 个源码模块、1195 个具名声明**满足文档覆盖。
- `npm run test:repo`：**通过**。
- `node --check main.js`：**通过**；专项测试同时检查安装 bundle 已同步提前 collision break、排序键预计算、工具栏共享上下文和单次 measured layout。
- 当前容器因此不能声称标准 `npm run verify` 或正式 production build 全绿；正式发布前仍需在依赖完整开发机执行 `npm ci && npm run verify` 并用正式 esbuild 结果替换当前等价同步 bundle。

### 真实 Obsidian 重点复测

1. 1000–5000 节点导图中连续展开/折叠含表格、代码或图片的分支，确认实测尺寸重排后节点不重叠、连接线和视口锚点稳定。
2. 5000 节点以上导图中快速切换单选、多选并触发工具栏状态变化，确认按钮显示逻辑和优化前一致，点击响应无明显卡顿。
3. 打开节点分布很稀疏的大导图并缩放/移动视口，确认首批分帧挂载仍按“焦点关系链 → 当前视口 → 相邻视口 → 远端”顺序出现。
4. 继续复测上一轮旧子导图父级导航和全局搜索索引优化，确认本轮布局热路径变更没有影响跨文件逻辑。

### 本轮交付

- 版本：1.46.3
- 测试安装 ZIP：`mindmap-studio-1.46.3-test-736957.zip`
- SHA-256：`3b0943a3b1db78d41d3e3616c385f30f1295d0c9c4adb77c0a6684bc882b4273`
- 完整源码与 Codex 交接包使用同一 `736957` 后缀。

## 1.46.3 静态分析告警整改与导图族索引复用

### 处理结果

- `src/editor/editor.ts` 的告警属于真实可维护性问题：只读模式键盘分支已拆为独立 `handleReadOnlyKeydown()`，主 `handleKeydown()` 只负责委派。原生选中文字复制、方向键导航、缩放、适应视图、折叠等行为保持不变。
- `src/main.ts` 的“remote image load catch”告警描述与当前源码不完全一致：现有 `catch` 实际只保护从远程 URL 推导建议文件名，并不吞掉 `requestUrl()` 的网络读取错误。本轮把该解析抽成 `remoteImageSuggestedName()` 并补异常 URL / 空路径回退测试；网络失败仍继续抛错，避免被伪装成 `remote-image.png`。
- `src/search/global-search.ts` 的顺序父链读取属于真实性能优化点，但不能简单 `Promise.all()`，因为下一层父路径依赖上一层导航元数据。本轮让 `refreshFamily()` 优先复用已通过 `mtime + size` 校验的新鲜搜索索引；只有索引缺失或过期才 `cachedRead()`，且同一轮父链解析结果会被向下遍历复用。

### 自动验证

- 静态分析整改专项：`filename + global-search-traversal + reading-editor-contract + global-search-contract` 共 **58 / 58 通过**。
- 除当前环境启动即依赖 `esbuild` 的 `tests/plugin-update.test.mjs`、`tests/xmind-import.test.mjs` 外，其余完整单元测试：**357 / 357 通过**。
- 标准 `npm run verify` 已执行：单元测试共 **359 项，357 通过 / 2 失败**；两项失败均在测试文件加载阶段报 `ERR_MODULE_NOT_FOUND: Cannot find package 'esbuild'`，未进入测试体，verify 因 `test:unit` 非零退出按脚本设计停止。
- `npm run test:regression`：启动 `scripts/test.mjs` 时同样因缺少 `esbuild` 直接退出，未进入综合回归测试体。
- `npm run build`：TypeScript 前置检查因上传源码没有完整 `obsidian`、`fflate` 等依赖/类型声明而停止；production esbuild 未执行。
- 对本轮 4 个修改 TypeScript 文件单独执行 TypeScript `transpileModule` 语法检查：**4 / 4 通过**。
- `npm run docs:generate`、`npm run test:docs`：**通过**，当前 **57 个源码模块、1193 个具名声明**满足文档覆盖。
- `npm run test:repo`：**通过**。
- `node --check main.js`：**通过**；安装 bundle 已等价同步本轮只读键盘拆分、远程图片文件名解析和导图族索引复用逻辑。
- 当前容器因此不能声称标准 `npm run verify` 或正式 production build 全绿；`main.js` 继续以现有 1.46.3 bundle 为基线等价同步。正式发布前应在依赖完整的开发机执行 `npm ci && npm run verify` 重新生成 production bundle。

### 性能与行为回归重点

1. 在父子导图族搜索索引全部新鲜时打开当前导图族搜索，结果范围必须和修复前一致，同时不应为了找根节点重新读取每一级 `.mindmap`。
2. 修改一个祖先导图后再次搜索，只应读取并重新解析实际过期的族成员；同一祖先不能在“向上找根 + 向下遍历”两个阶段重复读取。
3. 继续复测上一轮旧子导图导航恢复：缺失 `navigation.parentPath` 的子导图仍应能通过父节点真实 `submap.path` 找回左上角返回按钮。
4. 只读模式复测 `Ctrl/Cmd+C`：浏览器已有文字选区时保持原生复制；无文字选区时复制当前分支；方向键、`+/-`、`Ctrl/Cmd+0`、空格折叠行为不变。
5. 远程图片正常 URL 仍以 URL 最后一段作为建议文件名；URL 结构异常时回退 `remote-image.png`；真实网络请求失败必须继续走原错误处理链，而不是假装成功返回文件名。

### 本轮交付

- 版本：1.46.3
- 测试安装 ZIP：`mindmap-studio-1.46.3-test-146998.zip`
- SHA-256：`d2d6fc54d917979156d410462e138749562033050fabf73fd0de7f4abf0af03a`
- 完整源码与 Codex 交接包使用同一 `146998` 后缀。

## 1.46.3 子导图父级返回导航恢复

### 根因与修复

- 左上角返回面包屑代码并未被删除；`MindMapEditor.renderNavigation()` 仍以 `document.navigation.parentPath` 作为唯一父级显示条件。旧子导图、异常写回或历史数据一旦丢失该字段，整个 `← 父导图 › 当前导图` 会被隐藏。
- 新恢复链路先等待全局搜索索引完成启动时的 `mtime + size` 增量校验，再从父节点索引的 `submap.path` 反查当前子文件。只有路径经 Obsidian 文件解析后真实指向当前 `.mindmap` 才接受，并恢复 `parentPath`、`parentNodeId`、父标题和来源节点文字。
- 恢复只修改当前会话文档和导航控件：编辑器只执行 `renderNavigation()`，不进入撤销历史、不调用编辑 `onChange`；视图同步失效文章上下文缓存并异步重建。用户之后产生真实内容编辑时，恢复出的 `navigation` 才随正常保存持久化。

### 自动验证

- `node --test tests/reading-editor-contract.test.mjs`：**33 / 33 通过**；新增契约同时检查 TypeScript 源码和 `main.js`，并锁定“索引校验完成后反查 → 真实 `submap.path` → 局部刷新导航 → 不进入保存/撤销链”。
- 除当前环境缺失 `esbuild` / `fflate` 的 `tests/plugin-update.test.mjs` 与 `tests/xmind-import.test.mjs` 外，其余单元测试：**353 / 353 通过**。
- `npm run test:repo`：**通过**。验证前从用户上传 ZIP 的 UTF-8 中央目录重新提取了原始中文 `examples/` 路径；该恢复仅用于测试，未修改示例内容，最终源码 ZIP 按仓库规则排除未修改 `examples/`。
- `npm run docs:generate`、`npm run test:docs`：**通过**，当前 **57 个源码模块、1188 个具名声明**满足文档覆盖。
- `node --check main.js`：**通过**。安装 bundle 已等价同步 `findParentNavigationForChild()`、`recoverSubmapNavigation()`、`recoverMissingSubmapNavigation()` 与 `applyRecoveredNavigation()`。
- 标准 `npm run verify` 已执行：单元测试阶段 **355 项，353 通过 / 2 失败**；失败均是测试文件启动时找不到中断安装后缺失的 `esbuild`/`fflate` 包，和本轮导航断言无关。由于 `test:unit` 非零退出，verify 按脚本设计停止。
- 单独 `npm run test:regression`：启动时找不到 `node_modules/esbuild/index.js`，未进入综合回归测试体。
- 单独 `npm run build`：当前 `node_modules` 来自网络不可达环境下中断的 `npm ci`，缺少 `codemirror`、`estree`、`node`、`tern` 类型定义，因此 TypeScript 前置阶段即停止；正式 esbuild production build 无法执行。上传源码本身没有完整依赖，本轮尝试恢复依赖时 registry DNS/网络不可用。
- 因此当前容器**不能声称标准 `npm run verify` 或正式 production build 全绿**；`main.js` 以现有 1.46.3 bundle 为基线等价同步，并由专项 bundle 契约和语法检查兜底。

### 仍需真实 Obsidian 验证

1. 准备父节点仍包含有效 `submap.path`、但子 `.mindmap` 手工移除 `navigation` 的旧格式样本；直接打开子导图，确认左上角自动恢复 `← 父导图 › 当前导图`。
2. 点击左箭头，确认返回正确父文件并聚焦原挂载节点；导图、大纲、通读和题库保持当前模式，文章模式仍按现有规则回父级文章目录。
3. 只打开旧子导图并返回、全程不编辑，确认子文件没有额外 `modify`；随后真实编辑一次并保存，确认恢复后的 `navigation` 正常持久化。
4. 顶层导图没有任何父节点 `submap.path` 指向它时，左上角不得误显示返回按钮；普通 Wiki 链接也不得被误判为父子关系。

### 本轮交付

- 版本：1.46.3
- 测试安装 ZIP：`mindmap-studio-1.46.3-test-228042.zip`
- SHA-256：`1cbef89d4977ee9c9ff42fbc901ae9b1ad7fa3a623ca9d865fa3268ddcef0028`
- 完整源码与 Codex 交接包使用同一 `228042` 后缀。

## 1.46.2 目录进入自动补载与二次打开缓存修复

### 用户日志确认的根因

- 第一次从父目录打开 `图形推理.mindmap` 时，文章上下文先 `cache-miss`，随后构建出 338 个目录项并挂载正文窗口；窗口挂载后没有主动扩展事件，后续页面高度变化与新增章节只伴随用户的 `wheel/scroll` 发生。
- 返回父目录后，缓存代数从 114 继续增加到 115、116；再次打开同一 `图形推理.mindmap` 仍记录 `cache-miss → refresh-start → refresh-success`，说明纯阅读往返触发了物理文件保存/`modify`，刚写入的文章族上下文因此被错误失效。
- 本轮同时修复这两个链路：正文窗口挂载后主动后台预热；纯阅读无编辑时不再调用 `TextFileView.save()` 写回物理 `.mindmap`。

### 实现验证

- MISS 首窗保持目标前后约 5 KB，以保证首次进入快速可见；文章上下文同步缓存 HIT 时首窗预算提升为 **32 KB**。
- `scheduleArticleWindowWarmup()` 在真实窗口挂载/目标恢复后启动，每个动画帧最多处理 4 个约 5 KB 分块，优先 `loadAfter()` 补齐后文，再 `loadBefore()` 补齐前文；每批都刷新文章窗口 Chrome，右侧缩略导航与滚动总高度应自动增长。活动语义恢复事务存在时先等待，向上补载按高度差补偿当前 `scrollTop`。
- `MindMapDocumentView` 现在以 `documentChangeRevision` 区分真实文档编辑与临时视图状态。只有编辑器 `onChange` 提升修订后才允许 `super.save()`；干净导航记录 `save-skipped-clean` 并直接返回，因此“正文 → 返回目录 → 再打开正文”不会因为临时 `articleLandingMode`/折叠状态产生无意义 vault `modify`。真实编辑仍即时失效文章族缓存并正常保存。
- 不恢复旧 `article-render-cache.json` 的节点级 HTML；后台预热直接分帧挂载当前渲染器产生的真实 DOM，图片、代码、表格、折叠、行内编辑和事件绑定继续走现有链路。

### 自动测试

- 核心缓存 + 文章窗口专项：`node --test tests/article-context-cache.test.mjs tests/incremental-render.test.mjs`：**21 / 21 通过**。
- 文章组合回归：`article-context-cache + article-context-progress + article-context-edit + incremental-render + reading-editor-contract + article-numbering`：**82 / 82 通过**。
- TypeScript：`node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：**通过**。
- `node --check main.js`：**通过**。
- `npm run docs:generate` / `npm run test:docs`：**通过**，当前 **57 个源码模块、1184 个具名声明**满足文档覆盖。
- `npm run test:repo`：**通过**。
- 原始上传依赖执行 `npm run test:unit`：**362 项，352 通过 / 10 失败**；10 项全部在 `plugin-update` / `xmind-import` 的测试构建钩子启动 esbuild 时失败，错误明确为当前 Linux 需要 `@esbuild/linux-x64`，而上传的 `node_modules` 只有 `@esbuild/win32-x64`。文章缓存、窗口和保存守卫没有新增失败。
- 为验证被平台二进制阻断的测试体，本轮使用只存在于临时测试目录、不会进入交付物的 TypeScript 打包兼容层执行完整单测：**362 / 362 通过**；同一临时兼容层执行 `node scripts/test.mjs`：**全部综合回归通过**。测试后已恢复原 `node_modules/esbuild/lib/main.js`。
- 标准 `npm run build`：TypeScript 前置检查通过，随后 production esbuild 因上述 Windows/Linux 二进制不匹配退出；因此当前容器不能声称正式 esbuild 重构建成功。`main.js` 以原 1.46.2 正式 bundle 为基线等价同步本轮运行逻辑，并由语法、类型、源码/安装 bundle 契约验证。

### 真实 Obsidian 重点复测

1. 从文章目录点击一篇大文章后不要滚动：首个正文窗口出现后，右侧缩略导航/滚动条高度应自行继续增长，后续正文自动出现，不需要先把滚动条拖到当前加载末端。
2. 返回目录后立即再次打开同一文章，且期间不编辑任何正文：应命中 `article-context` 缓存，第二次首窗明显更大，并继续自动补齐；日志应出现 `save-skipped-clean`，不应因“返回目录”本身再次出现该文章的 `cache-miss`。
3. 真正编辑一个节点并保存后再重开：缓存必须 MISS，重新构建并显示最新内容，以确认“干净导航不写盘”没有削弱真实编辑失效。
4. 在后台预热过程中从目录跳深层章节、快速连续点击多个目录项、拖动滚动条、滚轮/PageDown、返回父目录；最终语义目标必须保持最后一次用户操作，向上后台补载不能把当前段落顶走。
5. 复测图片、代码、表格、折叠、缩略导航和文章行内编辑；后台补齐结束后所有交互必须仍可用。

### 本轮交付

- 版本：1.46.2
- 安装 ZIP：`mindmap-studio-1.46.2-620401.zip`
- SHA-256：`868a3d35447baba8dae831b15ddcbd5ef4a682c4fcd06b0457b3a85b71762597`
- 完整源码与 Codex 交接包使用同一 `620401` 后缀。

## 1.46.2 文章上下文与解析文档缓存

- 新增 `ArticleContextCacheStore`：第一次完整构建文章族后，把 `baseDepth`、目录、分页导航和 `readingSections` 保存到插件私有 `cache/article-context-cache.json`；插件启动时预载到内存，`setViewData()` 可在创建编辑器之前同步命中。
- 每份文章上下文快照记录完整父/子 `.mindmap` 依赖的 `path + mtime + size`；任意依赖改变、删除或重命名都会让相关缓存失效，新建/重命名会保守清空文章上下文，避免此前缺失的子导图引用突然变为可解析。
- 新增会话级 `MindMapDocumentCache`，减少同一文件重复 `parseDocument()`；缓存对象克隆进出，避免编辑器原地修改污染缓存。
- 构建开始记录全局缓存代数；若构建期间发生任何 `.mindmap` 修改，本次旧结果不写入缓存。持久 JSON 按不可信输入校验，若 `readingSections` 存在未被依赖版本覆盖的文件会拒绝整个快照。
- 保留现有约 5 KB 文章窗口和现有编辑/搜索/目录定位流程，不恢复旧 `article-render-cache.json` 的节点 HTML 缓存。

## 1.46.2 自动验证

- 缓存专项：`node --test tests/article-context-cache.test.mjs`：**5 / 5 通过**；覆盖跨重启预载、调用方隔离、依赖变化失效、父文件级联失效、文档版本缓存、损坏/不完整依赖 JSON 拒绝，以及真实视图/插件/`main.js` 接线契约。
- 文章相关组合：`article-context-cache + article-context-progress + article-context-edit + incremental-render + reading-editor-contract + article-numbering`：**81 / 81 通过**。
- TypeScript：`npx tsc --noEmit --skipLibCheck`：通过。
- `node --check main.js`：通过；缓存专项同时确认安装 bundle 含 `article-context-cache-v1`、同步命中入口和 `cache-hit` 运行路径。
- `npm run docs:generate` / `npm run test:docs`：通过，**57 个源码模块、1182 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过；原上传 ZIP 的中文 `examples/` 已以真实 UTF-8 路径恢复后执行仓库测试。
- 原始依赖环境执行完整 `npm run test:unit`：**361 项，351 通过 / 10 失败**；10 项全部在测试启动时因上传包只包含 `@esbuild/win32-x64`、当前 Linux 缺少 `@esbuild/linux-x64` 而失败，和缓存断言无关。
- 为确认上述 10 个测试体本身没有回归，使用仅存在于临时测试目录、不进入任何交付物的 TypeScript 打包兼容层补跑 `plugin-update + xmind-import`：**10 / 10 通过**；同一临时兼容层执行 `scripts/test.mjs`：**全部综合回归通过**。
- 标准 `npm run test:regression`：在首次启动正式 esbuild 时被同一平台二进制问题阻断。标准 `npm run build`：TypeScript 前置检查通过，production esbuild 随后被同一问题阻断。
- 标准 `npm run verify` 已执行，并在 `test:unit` 的上述 10 个平台失败处停止。最终 `main.js` 以 1.46.2 上传包中的正式 esbuild bundle 为基线，等价同步本轮缓存运行逻辑，并通过语法、类型、缓存 bundle 契约和其余现有 bundle 契约；**当前容器不能声称正式 esbuild production 重构建全绿**。

## 1.46.2 仍需真实 Obsidian 验证

1. 第一次打开一个包含父/子导图的文章目录应正常构建；退出该页面后立即再次打开同一目录，在文件未修改时应直接命中缓存，不再先出现“正在解析文章结构”的加载过程。
2. 修改任意父导图或子导图后再次打开，同一文章族必须 MISS 并重新生成目录/通读上下文；新建、删除、重命名子导图也要验证不会复用旧结构。
3. 完全退出并重启 Obsidian 后，在文章族文件都未改变时再次打开，确认 `cache/article-context-cache.json` 能预载并同步命中。
4. 缓存命中后复测约 5 KB 前后文窗口、目录跳转、父/子导航、搜索落点、返回目录和文章行内编辑；编辑保存后再次进入应展示新内容而不是旧缓存。
5. 检查移动端/桌面端插件目录可正常创建 `cache/article-context-cache.json`，且缓存写入失败时只降级为重新构建，不影响文章打开。

## 1.46.2 本轮安装包

- 版本：1.46.2
- 安装 ZIP：`mindmap-studio-1.46.2-432839.zip`
- SHA-256：`f8087586db7c3e5692842d43116073d757b058d6ab732e49db86b3ad5cd21393`

## 1.45.16 输入与修复

- 用户要求取消“内容为空就自动删除导图节点”的行为，并反馈文章模式行内编辑清空后编辑区域会高度塌缩。
- 空节点语义统一调整为“节点结构与内容是否为空解耦”：文章行内文字清空、导图快速编辑清空、完整节点编辑清空、删除最后一个文字/图片/表格/代码块，以及跨节点移走最后一个有效内容块后，都只更新内容，不再隐式删除节点；只有显式“删除节点”操作才移除树结构。
- `moveNodeContentBlock()` 仍会清理无意义空文字占位块和同步旧版内容镜像，但来源节点即使最终没有任何内容块也保留在原树位置。
- 文章标题/正文行内编辑样式增加 `min-height: 1.4em` 兼容回退与 `min-height: 1lh` 精确行高，并使用 `box-sizing: content-box`；即使 contenteditable 清空后浏览器保留 `<br>`、`:empty` 不命中，也至少维持一行可点击输入区域。

## 1.45.16 自动验证

- 空节点与文章空编辑高度专项：`node --test tests/content-block-drag.test.mjs tests/node-creation.test.mjs`：**15 / 15 通过**。
- 相关内容模型/文章编辑组合：`node --test tests/content-block-drag.test.mjs tests/node-creation.test.mjs tests/article-content-block.test.mjs tests/article-context-edit.test.mjs tests/sync-node-content.test.mjs`：**59 / 59 通过**。
- TypeScript：`node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：通过。
- `node --check main.js`：通过；源码与安装 bundle 契约均确认不存在 `isRemovableEmptyNode` / `removeNodeAfterContentDeletion` 隐式清理入口。
- `npm run docs:generate`、`npm run test:docs`：通过，**56 个源码模块、1138 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- 使用规范 UTF-8 示例路径执行完整单元测试：共 **356 项，346 通过 / 10 失败**；10 项全部来自上传依赖仅包含 `@esbuild/win32-x64`，当前 Linux 需要 `@esbuild/linux-x64`。本轮空节点/高度相关断言均通过。
- `npm run test:regression`：在 `scripts/test.mjs` 首次启动 esbuild 时被同一平台二进制问题阻断。
- `npm run build`：TypeScript 前置检查通过，随后 production esbuild 被同一平台问题阻断。
- `npm run verify` 已执行，并在 `test:unit` 的上述 10 个平台失败处停止。当前环境不能声称生产重构建全绿，因此 `main.js` 按 TypeScript 源码等价同步，并通过语法、类型和专项 bundle 契约校验。

## 1.45.16 仍需真实 Obsidian 验证

1. 在文章模式新建空同级/子节点后直接按 Enter 或点击外部，空节点应继续保留，编辑区域不得缩成细条。
2. 清空已有标题或正文后退出编辑，节点应保留；再次点击空行应容易重新进入编辑。
3. 删除节点最后一个文字、图片、表格或代码块，以及把最后一个内容块移动到其他节点后，来源节点应继续保留为空节点。
4. 显式执行“删除节点”仍应正常删除节点及其既有树结构。

## 1.45.16 本轮安装包

- 版本：1.45.16
- 安装 ZIP：`mindmap-studio-1.45.16-480083.zip`
- SHA-256：`b65509e55b23c7872846e7e7ebfaa392341a45c283d6bb30314e2ca0ed1e492f`

## 1.45.15 输入与修复

- 用户明确确认：当前文件/当前导图族搜索点击结果后可以自动关闭，只有全局搜索仍会留下搜索层。
- 1.45.14 Windows / Obsidian 1.12.7 日志提供了重复实例的直接证据：点击全局搜索结果后先出现 `result-close-request → modal-on-close → result-close-return`，且首个实例的 `modalConnected=false / containerConnected=false`；随后页面正常开始 `open-view-start` 导航，但约 1.6 秒后用户再次点击残留 `.modal-bg` 时又出现第二次 `modal-on-close(openingResult=false)`。因此第一个 Modal 实际已正常关闭，前台残留的是同一次全局快捷键重复创建的第二个实例。
- `openGlobalSearch()` 现在只针对全局入口增加双重单例守卫：`globalSearchLaunchPending` 防止索引 ready 的异步窗口内重复创建，`globalSearchModal.isMounted()` 防止已有全局搜索层时再次创建。重复请求只记录 `open-deduplicated`。
- `openMapFamilySearch()` 完全不使用上述守卫，保持用户已经验证正常的当前文件/当前导图族搜索行为不变。
- 结果关闭仍沿用 1.45.14 的 `shouldRestoreSelection=false + 单次 Modal.close() + 双 requestAnimationFrame 非阻塞导航`，本轮不再修改关闭链。

## 1.45.15 自动验证

- 搜索/阅读/文章组合专项：`node --test tests/global-search-contract.test.mjs tests/reading-location.test.mjs tests/reading-editor-contract.test.mjs tests/article-context-edit.test.mjs tests/article-content-block.test.mjs`：**85 / 85 通过**。
- `tests/global-search-contract.test.mjs`：**6 / 6 通过**；新增契约同时检查 TypeScript 源码与 `main.js` 包含全局搜索单实例守卫，并明确 `openMapFamilySearch()` 不受守卫影响。
- TypeScript：`node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：通过。
- `node --check main.js`：通过。
- `npm run docs:generate`、`npm run test:docs`：通过，**56 个源码模块、1141 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- 使用恢复为规范 UTF-8 路径的原仓库 `examples/` 执行单元测试：共 **356 项，346 通过 / 10 失败**；10 项全部因为上传依赖仅包含 `@esbuild/win32-x64`，当前 Linux 缺少 `@esbuild/linux-x64`。新增全局搜索去重测试通过。
- `npm run verify` 已执行并在上述 `test:unit` 平台失败处停止；单独 `node scripts/test.mjs` 同样在首次启动 esbuild 时被平台二进制问题阻断。
- 当前环境无法生产重构建，因此 `main.js` 按 TypeScript 源码等价同步，并由专项 bundle 契约和 `node --check` 校验。

## 1.45.15 仍需真实 Obsidian 验证

1. 只测试全局搜索：使用配置的全局快捷键或工具栏“全局搜索所有导图”，确认界面只出现一个搜索框。
2. 点击全局搜索结果后，应只关闭一个搜索层且页面立即跳转，不再出现第二个残留遮罩。
3. 当前文件/当前导图族搜索保持原行为，点击结果仍能自动关闭。
4. 若仍异常，调试日志应能看到 `open-request → open-mounted`；同一打开动作若再次触发应记录 `open-deduplicated`，不能再出现两个独立实例的两次 `modal-on-close`。

## 1.45.15 本轮安装包

- 版本：1.45.15
- 安装 ZIP：`mindmap-studio-1.45.15-262176.zip`
- SHA-256：`d5af5c80b8b9f5dd0429689a6e68c5700927bfc9860d798fc93f20a165661c2c`

## 1.45.14 输入与修复

- 用户在 Windows 10 / Obsidian 1.12.7、插件 1.45.13 上复测：点击搜索结果后页面可以跳转，但搜索框仍不会自动关闭。
- 最新日志显示结果 `click` 后紧接着出现一条程序生成的 `.modal-bg` `click`，随后 `open-view-start` 正常进入导航；但约 3.4 秒后用户仍需真实 `pointerdown → click` 点击 `.modal-bg` 才把搜索 Modal 关闭。这证明 `HTMLElement.click()` 并不等价于 Obsidian 接受的真实背景关闭手势。
- `dismissResultPanel()` 现在彻底删除合成背景事件：设置 `shouldRestoreSelection=false` 后只调用一次公开 `Modal.close()`，不再查询 `.modal-bg`、不再 `click()` / dispatch PointerEvent，也不修改或删除任何宿主 Modal DOM。
- `openResult()` 不等待 `onClose()` Promise；原生 close 请求后只让出两个 `requestAnimationFrame` 绘制帧，再启动目标文件/节点导航，避免重现 1.45.12 的阻塞。
- 新增 `result-close-request`、`result-close-return`、`modal-on-close`、`result-navigation-start` 调试事件，下一份真实日志可直接判断宿主是否执行原生 close 回调，以及回调与导航的先后关系。

## 1.45.14 自动验证

- 搜索/阅读/文章组合专项：`node --test tests/global-search-contract.test.mjs tests/reading-location.test.mjs tests/reading-editor-contract.test.mjs tests/article-context-edit.test.mjs tests/article-content-block.test.mjs`：**84 / 84 通过**。
- `tests/global-search-contract.test.mjs`：**5 / 5 通过**；源码和 `main.js` 契约要求结果打开只调用一次 `Modal.close()`，禁止 `.modal-bg.click()`、PointerEvent/dispatchEvent、`display:none`、手工 remove、隐藏外层 Modal class 和阻塞式 `onClose()` Promise。
- TypeScript：`node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：通过。
- `node --check main.js`：通过；由于上传依赖缺少 Linux esbuild，本轮 `main.js` 按 TypeScript 源码等价同步原生关闭、双 RAF 导航与调试回调。
- `npm run test:docs`：通过，**56 个源码模块、1140 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- 使用恢复为规范 UTF-8 路径的原仓库 `examples/` 执行 `npm run verify`：单元测试共 **355 项，345 通过 / 10 失败**；10 项全部因为上传依赖仅包含 `@esbuild/win32-x64`，当前 Linux 缺少 `@esbuild/linux-x64`。由于 `test:unit` 非零退出，verify 未继续后续阶段。
- 单独 `node scripts/test.mjs`：在首次启动 esbuild 时被同一平台二进制问题阻断。
- 生产构建：TypeScript 前置检查已独立通过；esbuild production 无法在当前 Linux 使用上传的 Windows 二进制。

## 1.45.14 仍需真实 Obsidian 验证

1. 全局搜索点击结果后，搜索框/遮罩应由原生 `Modal.close()` 自动退出，无需再次点击背景，同时页面必须正常跳转。
2. `Ctrl/Cmd+F` 当前导图族搜索和键盘 Enter 打开结果重复同一路径。
3. 页面落点后直接单击标题/正文，确认搜索后行内编辑仍可稳定持焦并连续输入。
4. 若仍异常，导出调试日志；重点检查 `global-search-modal` 的 `result-close-request → modal-on-close → result-navigation-start` 顺序。

## 1.45.14 本轮安装包

- 版本：1.45.14
- 安装 ZIP：`mindmap-studio-1.45.14-272426.zip`
- SHA-256：`e401f2c38078e7d4156e90a22a23da58e81cea71ed2e23c64f88bd588af13f4c`

## 1.45.13 输入与修复

- 用户在 Windows 10 / Obsidian 1.12.7、插件 1.45.12 上复测：点击搜索结果后搜索层不关闭，页面也不跳转。
- 日志在结果 `click` 之后没有任何 `open-view-start` / `queue-focus`，约 2 秒后仍能点击 `.modal-bg`；这证明 1.45.12 的 `await waitForHostClose()` 在当前宿主没有完成 Promise，直接阻塞了 `onOpenResult()`。
- 同一用户前序日志已验证：手动点击当前搜索层的 `.modal-bg` 后，Modal 能真正退出，并且搜索后的文章行内编辑可以稳定持焦。因此本轮直接复用该宿主背景点击路径，而不再等待关闭回调。
- `dismissResultPanel()` 现在设置 `shouldRestoreSelection=false`，给搜索 `modalEl` 增加 `mms-global-search-result-opening` 仅隐藏内部内容，然后定位当前 `.modal-container .modal-bg` 并调用 `click()`；不修改/删除外层 Modal DOM。
- `openResult()` 只等待一个 `setTimeout(0)` 事件循环就调用 `onOpenResult()`；找不到背景元素时才回退 `Modal.close()`，因此关闭回调缺失也不会再卡住导航。

## 1.45.13 自动验证

- 搜索/阅读/文章专项：`node --test tests/article-context-edit.test.mjs tests/article-content-block.test.mjs tests/reading-editor-contract.test.mjs tests/global-search-contract.test.mjs`：**74 / 74 通过**。
- `tests/global-search-contract.test.mjs`：**5 / 5 通过**；源码契约验证 `.modal-bg.click()`、`setTimeout(0)` 非阻塞导航、`shouldRestoreSelection=false`，并禁止 `waitForHostClose`、`display:none`、手工删除 Modal DOM。
- TypeScript：`node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：通过。
- `node --check main.js`：通过；`main.js` 已按源码等价同步本轮运行逻辑。
- `npm run test:docs`：通过；文档生成/覆盖检查在本轮收口后重新执行。
- `npm run test:repo`：通过。
- 完整 `npm run verify` 已执行：单元测试阶段共 **355 项，345 通过 / 10 失败**；10 项全部因为上传依赖仅包含 `@esbuild/win32-x64`，当前 Linux 缺少 `@esbuild/linux-x64`。由于 `test:unit` 非零退出，verify 未继续后续阶段。
- 单独 `npm run test:regression`：在 `scripts/test.mjs` 首次启动 esbuild 时被同一平台二进制问题阻断。
- 单独 `npm run build`：TypeScript 前置检查通过，随后 esbuild production 启动被同一平台问题阻断。
- `npm run test:docs`、`npm run test:repo`、`node --check main.js`、`tsc --noEmit --skipLibCheck` 均通过。

## 1.45.13 仍需真实 Obsidian 验证

1. 全局搜索点击结果：搜索层应自动退出，并出现目标文件/节点跳转。
2. `Ctrl/Cmd+F` 当前导图族搜索重复同一路径。
3. 页面落点后直接单击标题/正文，确认仍可持续行内编辑。
4. 用键盘 Enter 打开激活结果，确认背景关闭与导航同样生效。

## 1.45.13 本轮安装包

- 版本：1.45.13
- 安装 ZIP：`mindmap-studio-1.45.13-737263.zip`
- SHA-256：`e82ede2440b90e013b41ac26baeae551e1973dab742160fb16a2bdd681d632fb`

## 1.45.12 输入与修复

- 用户在 Windows 10 / Obsidian 1.12.7、插件 1.45.11 上复测后确认：搜索跳转后的文章编辑已经恢复正常，但点击搜索结果后搜索框不会自动隐藏。
- 日志显示结果点击后导航已开始，约 1.4 秒后仍能点击 `.mms-global-search-results`，随后还能点击 `.modal-bg`；只有额外点击遮罩后搜索层才真正退出。
- 根因收口到 1.45.11 的视觉兜底：在 `Modal.close()` 前/关闭过程中把宿主管理元素设为 `display:none !important`，可能阻断依赖 transition/completion 的原生关闭完成路径。
- 本轮改为：关闭 selection 恢复，创建 `onClose()` 完成 Promise，启动唯一一次原生 `Modal.close()`，随后仅以 `visibility:hidden` / `pointer-events:none` 同步隐藏搜索 UI；导航必须等待真实 `onClose()` 解析后再执行。
- 继续禁止任何 `modalEl.remove()`、`container.remove()`、`removeSearchLayers` 和二次 `close()`。

## 自动验证

- 搜索/阅读/文章专项：`node --test tests/article-context-edit.test.mjs tests/article-content-block.test.mjs tests/reading-editor-contract.test.mjs tests/global-search-contract.test.mjs`：**74 / 74 通过**。
- `tests/global-search-contract.test.mjs`：**5 / 5 通过**；源码与 `main.js` 契约都明确禁止搜索关闭路径使用 `display:none`，要求真实 `onClose()` 解析关闭 Promise，并验证结果导航等待 Modal teardown。
- TypeScript：`npx tsc --noEmit --skipLibCheck`：通过。
- `node --check main.js`：通过；`main.js` 已按源码等价同步 `waitForHostClose()`、单次原生 `close()` 与 `await dismissResultPanel()`。
- `npm run test:docs`：通过，**56 个源码模块、1140 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- 使用恢复为规范 UTF-8 路径的原仓库 `examples/` 后，`npm run test:unit` / `npm run verify` 的单元测试阶段共 355 项：**345 通过 / 10 失败**。10 项全部因为上传依赖只有 `@esbuild/win32-x64`，当前 Linux 环境缺少 `@esbuild/linux-x64`；本轮搜索 Modal 契约与所有不依赖 esbuild 的测试均通过。
- `npm run test:regression` 与生产构建同样在首次启动 esbuild 时被平台二进制问题阻断，因此本地不能声称完整 `npm run verify` 全绿。

## 仍需真实 Obsidian 验证

1. 点击全局搜索或当前导图族搜索的任一结果，搜索框和遮罩应立即视觉消失，无需再次点击背景。
2. 页面完成跳转后直接单击标题/正文，行内编辑应继续稳定持焦并可连续输入。
3. 按 Enter 打开当前激活结果也应满足同样的自动隐藏与编辑行为。

## 本轮安装包

- 版本：1.45.12
- 安装 ZIP：`mindmap-studio-1.45.12-861788.zip`
- SHA-256：`c1dd31e2eaee48048c9dc0baa7cdf290b81cd5b045ea605329a4adde6e653674`

## 本轮输入与最终根因

- 用户提供的真实调试日志来自插件 **1.45.10**、Obsidian 1.12.7 / Windows 10。
- 同一会话中，搜索前直接单击文章文字进入行内编辑后可以稳定持焦并正常输入，直到用户主动点击页面外才产生带明确 `relatedTarget` 的正常 `blur`。
- 点击全局搜索结果跳转后，文章行内编辑器仍 `connected=true`，但每次获得焦点约 6–8 ms 后都会立即 `blur`，`relatedTarget=null`；1.45.10 的初始焦点保护因此形成连续 `focus/refocus → blur(null)`，保护结束后立即退出编辑。
- 这证明问题不是文章 DOM 被重建，也不是语义定位本身，而是 **GlobalMindMapSearchModal 关闭后遗留了宿主 Modal/focus Scope 约束**。
- 追溯到 1.45.3：为解决“空白 Modal 残留”，结果打开流程在 `Modal.close()` 后手工 `remove()` `modalEl`/`containerEl`/实际 `.modal-container`，并在导航完成后再次执行同一关闭流程。该实现绕过 Obsidian 对 Modal DOM、焦点 Scope 与栈状态的完整生命周期，能导致视觉弹窗已经消失但工作区仍无法稳定持有焦点。

## 1.45.11 实现

- `GlobalMindMapSearchModal.dismissResultPanel()` 仍会同步隐藏 `modalEl`、`containerEl` 和实际 `.modal-container`，保证点击结果后搜索 UI 立即从前台消失。
- 不再手工删除任何由 Obsidian Modal 管理的 DOM，不再扫描并 `remove()` 搜索层，也不再在导航完成后第二次调用关闭流程。
- 结果导航前设置 `shouldRestoreSelection = false`，只调用一次 `Modal.close()`，让 Obsidian 自己完成 Modal 栈、键盘/焦点 Scope 与 DOM 清理。
- 新增 `waitForModalFocusRelease()`，等待两个 `requestAnimationFrame` 后才执行目标文件/节点导航，让当前结果点击事件和宿主 Modal 关闭 bookkeeping 完整结束。
- `.mms-global-search-container-closing` 继续保留，只负责把主题/宿主可能残留的空壳设为不可见且不接收指针，不再承担 DOM 删除职责。
- 1.45.10 的 `claimInlineEditInteraction()`、指针编辑接管与初始焦点保护继续保留，作为搜索落点导航事务的独立防御层；本轮没有扩大通用编辑 API。
- `main.js` 已按 TypeScript 源码等价同步；当前容器无法使用上传依赖中的跨平台 esbuild 二进制，未能执行生产重构建。

## 1.45.11 验证记录

- 搜索/阅读/文章专项：`node --test tests/article-context-edit.test.mjs tests/article-content-block.test.mjs tests/reading-editor-contract.test.mjs tests/global-search-contract.test.mjs`：**74 / 74 通过**。
- `tests/global-search-contract.test.mjs`：**5 / 5 通过**，新增契约明确：只调用一次 `dismissResultPanel()`、设置 `shouldRestoreSelection=false`、禁止 `modalEl.remove()` / `container.remove()` / `removeSearchLayers`、等待两个动画帧后才导航，并验证安装 bundle 已同步。
- TypeScript：`node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：通过。
- `node --check main.js`：通过；bundle 检查确认存在 `shouldRestoreSelection = false` 与 `waitForModalFocusRelease()`，且不存在旧 `removeSearchLayers` / `modalEl.remove()` 搜索关闭逻辑。
- `npm run test:docs`：通过，**56 个源码模块、1140 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- 使用恢复为规范 UTF-8 路径的原仓库 `examples/` 后，本地 `npm run test:unit` / `npm run verify` 的单元测试阶段共 355 项：**345 通过 / 10 失败**。10 项全部在 esbuild 初始化阶段失败，因为上传依赖不包含当前 Linux 所需的 `@esbuild/linux-x64`；所有不依赖 esbuild 的测试（包括本轮搜索 Modal 焦点 Scope 契约）均通过。
- `npm run test:regression` 与 `npm run build` 在首次调用 esbuild 时被同一平台二进制问题阻断，因此不能声称本地完整 `npm run verify` 全绿。

## 仍需真实 Obsidian 验证

1. 安装 1.45.11 后先直接单击文章文字，确认普通编辑仍正常。
2. 打开全局搜索，点击一个当前导图文章结果，页面落点后直接单击标题或正文；确认不再出现立即退出，并可连续输入。
3. 再用 `Ctrl/Cmd+F` 当前导图族搜索重复同一路径。
4. 点击页面其他位置，确认正常失焦提交；复测右键“编辑当前内容/添加正文”。
5. 若仍失败，立即导出调试日志；本轮判断标准是搜索后不应再出现连续的 `inline-edit-focus/refocus → inline-edit-blur(relatedTarget=null)` 焦点风暴。

## 1.45.11 安装包

- 版本：1.45.11
- 安装 ZIP：`mindmap-studio-1.45.11-426131.zip`
- SHA-256：`ec6b1b217ccb11f84c2b074a1de78e847014ddf528c24cc94a636da245152425`
