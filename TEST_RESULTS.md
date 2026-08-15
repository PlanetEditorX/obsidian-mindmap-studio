# Test Results

版本：1.45.8

## 本轮输入与根因

- 用户上传了 1.45.7 的 GitHub Actions `verify` 日志。
- 日志显示 Ubuntu CI 已先完成 **354 / 354 单元测试通过**；随后 `npm run test:regression` 在 `scripts/test.mjs:1534` 失败。
- 唯一失败断言要求 `editor.ts` 保持 `private editSelected(initialBlockId?: string): void`。1.45.7 为了把文章右键菜单的初始焦点保护传入行内编辑，临时把该方法改成 `editSelected(initialBlockId?, protectInitialFocus=false)`，因此破坏了完整节点编辑的既有契约。
- 焦点修复本身仍然需要保留：文章右键菜单关闭时，Obsidian 可能回收焦点，使刚打开的 `contenteditable` 立即 `blur`。

## 1.45.8 实现

- 恢复 `editSelected(initialBlockId?: string)` 原签名；文章普通编辑继续调用 `editSelectedArticleContent()`，导图/大纲继续打开完整节点编辑器。
- 新增 `editSelectedFromContextMenu()`，只供右键菜单编辑动作使用：文章模式调用 `editSelectedArticleContent(true)`，其他模式调用原 `editSelected()`。
- `editSelectedArticleContent(true)` 继续把 `protectInitialFocus` 传给 `activateInlineEditable()`，因此 1.45.7 的“菜单关闭时焦点回收保护”仍保留。
- 新增/更新契约，明确菜单焦点保护不得再进入完整节点编辑 API。
- `main.js` 已按源码做等价同步；当前容器无法使用上传依赖中的跨平台 esbuild 二进制，未能执行生产重构建。

## 自动验证

- 文章/阅读/搜索相关专项：`node --test tests/article-context-edit.test.mjs tests/reading-editor-contract.test.mjs tests/global-search-contract.test.mjs`：**50 / 50 通过**。
- 文章上下文编辑专项：**13 / 13 通过**。
- 对 GitHub Actions 原失败契约做静态回归：`editSelected(initialBlockId?)` 原签名通过；`editSelectedFromContextMenu()` 菜单隔离通过；`protectInitialFocus` 未泄漏进完整编辑 API。
- TypeScript：`tsc --noEmit --skipLibCheck` 通过。
- `npm run test:docs`：通过，**56 个源码模块、1137 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- `node --check main.js`：通过。
- 本地 `npm run test:unit`：354 项中 **343 通过 / 11 失败**；11 项均因上传的原始 `node_modules` 缺少当前 Linux 所需的 `@esbuild/linux-x64`，在 esbuild 初始化阶段失败。该限制与用户上传的 GitHub Actions 日志不同：GitHub Actions 使用正确 Ubuntu 依赖时，1.45.7 的 354 项单元测试已全部通过。
- 当前环境无法完整执行 `npm run test:regression` / `npm run build`，原因同样是 esbuild 平台二进制；因此不能声称本地 `npm run verify` 全绿。

## 仍需验证

1. 将 1.45.8 源码推到 GitHub Actions，确认 `test:regression` 中原 `editSelected(initialBlockId?)` 断言已通过，并完成整套 `npm run verify`。
2. 在真实 Obsidian 桌面端从全局搜索或当前导图族搜索跳转到文章节点，右键选择“编辑当前内容”，确认不会立即退出。
3. 对仅含图片/表格/代码的节点验证“添加正文”同样保持焦点。
4. 验证导图/大纲完整节点编辑仍能按目标内容块打开，双击/键盘快速编辑和普通失焦提交均无变化。

## 本轮安装包

- 版本：1.45.8
- 安装 ZIP：`mindmap-studio-1.45.8-184393.zip`
- SHA-256：`995025a2018e98783039d09b389cf5e8eebc9a43ba71c5e0be6a2d761180ae19`
