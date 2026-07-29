# 代码块行号重构验证报告

## 根因结论

旧实现把全部行号写入 `code::before`，行号伪元素与 Obsidian 语法高亮生成的真实代码 token 不共享同一组行盒。固定像素或 `em` 光学补偿只能适配局部字体、缩放和容器组合，无法保证导图、大纲、文章和通读中的逐行基线一致。

新实现保留 Obsidian 的 `pre > code` 高亮结果，在同一 `pre` 内插入真实 `span.mms-code-line-numbers` 兄弟栏。行号栏和代码栏共享运行时读取的字体、字号、字重、行高、字距及上下内边距，并统一使用 `white-space: pre`。旧伪元素、绝对定位和基线补偿已删除。

## 已执行命令

```bash
npm run docs:generate
npm test
npm run build
node --check main.js
```

## 结果

- `npm test`：通过。
  - 单元测试：`84 / 84` 通过，其中代码块专项测试 `5 / 5` 通过。
  - 综合回归：通过，输出 `All MindMap Studio tests passed.`。
  - 文档检查：通过，`46` 个 TypeScript 模块中的 `785` 个具名声明均有 JSDoc。
  - 仓库检查：通过，版本、README、必需文件、样式引用和示例路径均符合约束。
- `npm run build`：退出码 `0`。
  - TypeScript 严格检查通过。
  - 更新后的 `main.js` 包含共享代码块渲染器和四模式委托代码。
- `node --check main.js`：通过。
- `package-lock.json` 与上传源码保持一致，没有因本地验证改写依赖版本。

## 代码块专项覆盖

- LF、CRLF、CR 与末尾空白逻辑行。
- 代码正文含连续反引号时的安全 fenced code 围栏。
- 节点设置、自动阈值、页面设置、全局设置优先级。
- 真实 DOM 行号栏、展示性无障碍属性和重复渲染幂等性。
- 字体、字号、字重、行高、字距、顶部/底部内边距共享。
- 旧主题类清除、Obsidian 默认主题回退和 Markdown 高亮 DOM 增强。
- 导图、大纲、文章、通读统一进入同一宿主回调。
- CSS 中不存在旧 `code::before`、`data-line-numbers` 或光学基线常量。
- 导图节点的 `overflow: visible` 不会覆盖代码块横向滚动。

## 验证环境说明

上传源码不包含 `node_modules`，且当前容器的内部 npm 镜像无法提供锁文件中的部分依赖包。为完成静态检查和测试，验证目录使用了仅限当前容器、不会进入交付 ZIP 的兼容依赖与类型环境；源码包仍保留原始 `package-lock.json`。更新后的 `main.js` 已写入新运行时代码并通过语法检查。

未在真实 Obsidian 桌面客户端中执行像素级手工冒烟。发布前仍建议在目标主题、字体和 100%/125%/150% 缩放下按 `docs/CODE_BLOCK_RENDERING.zh-CN.md` 的验收矩阵复核四种模式。
