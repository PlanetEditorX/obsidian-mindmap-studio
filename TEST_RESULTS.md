# Test Results

版本：1.45.3

## 本轮问题

- 用户反馈 1.45.2 仍存在：搜索结果已在后方页面完成跳转，但前台搜索弹窗内容被清空后仍不能自动隐藏。
- 核对后确认“全局搜索所有导图”和“当前导图及子导图搜索”不是两个独立 Modal，它们都实例化 `GlobalMindMapSearchModal`；因此 1.45.2 不是漏改第二个搜索类，而是关闭逻辑本身仍不足以覆盖 Obsidian 残留容器。
- 1.45.2 只同步处理了一个推断出的 `.modal-container`；若 `containerEl` 与最近祖先容器不是同一引用，或关闭生命周期期间仍有搜索 Modal DOM 存活，就可能继续留下空白前台层。

## 本轮实现

- `GlobalMindMapSearchModal.dismissResultPanel()` 同时捕获 `this.containerEl` 与 `this.modalEl.closest(".modal-container")`，避免只处理单一容器引用。
- 在 `Modal.close()` 之前，对 `modalEl` 和全部捕获容器同步设置 `display:none!important`、`visibility:hidden!important`、`pointer-events:none!important`，保证导航开始前视觉层先退出。
- 保留 `Modal.close()`，继续执行 Obsidian 自身 `onClose()` 和 Modal 生命周期。
- `close()` 返回后同步移除 `modalEl` 与全部捕获容器，并使用 `.mms-global-search-modal` 扫描 DOM，清理任何仍存活的 MindMap Studio 搜索 Modal/容器。
- `openingResult` 防重复点击与导航 `finally` 中的幂等二次清理保持不变。
- `main.js` 已同步同一运行逻辑，安装包不再只包含源码修复。

## 自动验证

- `node --test tests/global-search-contract.test.mjs`：**5 / 5 通过**，其中新增验证全局搜索和导图族搜索都实例化同一个 `GlobalMindMapSearchModal`。
- `node --test tests/global-search-contract.test.mjs tests/reading-editor-contract.test.mjs`：**37 / 37 通过**。
- `node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：通过。
- `npm run test:docs`：通过，**56 个源码模块、1135 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- `node --check main.js`：通过。
- `npm run test:unit`：共 345 项，**334 通过 / 11 失败**；11 项均在测试初始化阶段因上传依赖只有 Windows `@esbuild/win32-x64`、当前环境需要 Linux `@esbuild/linux-x64` 而失败。
- `npm run test:regression`：被同一 esbuild 平台依赖阻断。
- `npm run build`：TypeScript 前置检查可通过，但 esbuild 生产打包被同一平台依赖阻断。
- `npm run verify`：会被上述 esbuild 平台问题阻断，因此本轮无法声称完整 verify 通过。

## 仍需真实 Obsidian 手工验证

1. 安装 1.45.3 后完整重载 MindMap Studio 插件。
2. 从工具栏/命令打开“全局搜索所有导图”，输入关键词并点击结果，确认弹窗立即完全消失。
3. 在 MindMap Studio 视图按 `Ctrl/Cmd+F` 打开当前导图族搜索，重复点击结果验证。
4. 分别验证同文件节点跳转与跨文件节点跳转，确认目标节点正常展开、选中和居中。
5. 连续快速点击结果，确认只执行一次导航，不出现空白 Modal、遮罩或无法点击的透明前台层。

## 交付说明

- 本轮没有修改搜索索引格式、替换逻辑、快捷键语义或 `.mindmap` 数据格式。
- 当前 `main.js` 基于现有 1.45.2 bundle 同步应用与 TypeScript 源码等价的 1.45.3 修复，并经过语法与专项 bundle 契约验证；由于 Linux 环境缺少对应 esbuild 原生二进制，仍建议正式发布前在正常开发环境重新执行 `npm ci && npm run verify` 并生产构建。

## 本轮安装包

- 版本：1.45.3
- 安装 ZIP：`mindmap-studio-1.45.3-218845.zip`
- SHA-256：`faf6e84ba343f942ecf43c93d0d5864c35227918ab5e319cc4f5c6e713ae1603`
