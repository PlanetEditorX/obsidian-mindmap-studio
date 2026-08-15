# Test Results

版本：1.45.11

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

## 自动验证

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

## 本轮安装包

- 版本：1.45.11
- 安装 ZIP：`mindmap-studio-1.45.11-426131.zip`
- SHA-256：`ec6b1b217ccb11f84c2b074a1de78e847014ddf528c24cc94a636da245152425`
