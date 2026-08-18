# Test Results

版本：1.46.2

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
