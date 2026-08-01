# Test Results

版本：1.38.4

- 单元测试：260 / 260 通过
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过（51 个源码模块、993 个具名声明）
- 仓库检查：通过
- 生产构建：通过，`main.js` 已重新生成

本轮专项验证：

- 大型文章渐进渲染期间，滚轮、触摸、指针按下以及方向键、PageUp/PageDown、Home、End、空格键会立即把文章视口标记为用户已接管。
- 用户接管视口后，待恢复的旧语义位置会被清除；后续 `onProgress` 批次只维持页面最小高度，不再写入旧 `scrollTop`。
- 全文渲染完成时，若用户已主动导航，不再执行旧语义锚点或打开瞬间像素位置恢复；若用户没有操作，原有阅读位置恢复仍然保留。
- 新增“user navigation owns the viewport while progressive article batches continue”专项回归，覆盖视口接管、旧位置清理、批次短路和完成回调保护。
- 1.38.3 的按需导图布局、子树高度缓存和文章首批正文立即显示逻辑继续通过全部回归。

交付包验证：

- 源码 ZIP 第一层目录固定为 `obsidian-mindmap-studio/`，排除 `node_modules/`、`.git/`、Codex、临时目录、嵌套 ZIP 和未修改的 `examples/`。
- 安装 ZIP 第一层目录固定为 `mindmap-studio/`，只包含 `main.js`、`manifest.json` 和 `styles.css`。
- Codex ZIP 第一层目录固定为 `Codex/`，外部文件名严格使用 `Codex-1.38.4-handoff-170537.zip`。
- 安装 ZIP SHA-256：`a40c33d3f539b3123bf00773b4d71d240d77faf7d956fa2b4fdb120cd97c65ad`，已写入 `update.json`。

仍需真实 Obsidian 手工验证：

- 在 Win10 中打开原先约 80 KB 的文章，首批正文出现后立即连续滚轮下滑，确认后台补齐期间不再回到顶部。
- 分别测试拖动滚动条、PageDown、触摸板双指滚动和点击正文后继续滚动，确认用户视口始终优先。
- 不进行任何滚动时重新打开文章，确认仍能恢复上次阅读位置。
- 在内容大量插入到当前视口上方时观察浏览器原生滚动锚定，确认没有明显段落跳动。
