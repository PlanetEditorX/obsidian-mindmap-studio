# Test Results

版本：1.45.2

## 本轮问题

- 搜索结果点击后，目标文件/节点已经完成跳转，但前台搜索弹窗只被 `onClose()` 清空内容，外层模态容器仍可能继续显示为空白遮罩。
- 现有实现虽然在导航前调用 `close()`，但把兜底移除放在 `requestAnimationFrame()`，跨文件视图切换时仍存在一帧之后未能可靠移除的窗口。

## 本轮实现

- `GlobalMindMapSearchModal.dismissResultPanel()` 改为先定位实际 `.modal-container`，同步设置隐藏与禁用指针事件，再调用 Obsidian `Modal.close()` 生命周期。
- `close()` 返回后若容器仍连接到 DOM，则立即同步移除，不再依赖下一帧。
- 保留 `openingResult` 防重复点击，并继续在导航 Promise 的 `finally` 中做第二次幂等清理。
- `main.js` 已同步同一逻辑，安装包可直接验证该修复。

## 自动验证

- `node --test tests/global-search-contract.test.mjs`：**4 / 4 通过**。
- `node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：通过。
- `npm run test:docs`：通过，**56 个源码模块、1135 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- `node --check main.js`：通过。
- `npm run verify`：未能完成。上传源码中的 `node_modules` 只包含 Windows `@esbuild/win32-x64` 可执行文件，当前验证环境为 Linux；单元测试运行到依赖 esbuild 的用例时统计为 **333 通过 / 11 初始化失败**，失败原因均为 esbuild 平台不匹配。
- 已尝试 `npm ci` 重新安装 Linux 依赖，但当前执行环境无法解析 `registry.npmjs.org`（`EAI_AGAIN`），因此综合回归与生产构建同样被 esbuild 平台依赖阻断。

## 仍需真实 Obsidian 手工验证

1. 打开全局搜索或当前导图族搜索，输入可命中的关键词。
2. 点击任一结果，确认搜索弹窗立即完全消失，不出现“内容清空但空白弹窗/遮罩仍在前台”的状态。
3. 验证同文件节点跳转与跨文件节点跳转均正常定位。
4. 连续快速点击结果时只执行一次导航，不出现重复打开或残留模态层。

## 交付说明

- 本轮没有修改数据格式、搜索索引格式或快捷键语义。
- 因验证环境缺少 Linux esbuild 二进制，本轮 `main.js` 是对现有 1.45.2 bundle 进行与 TypeScript 源码等价的同步补丁，并已通过语法与契约检查；仍建议在正常开发环境执行一次 `npm ci && npm run verify` 后再用于正式发布。
