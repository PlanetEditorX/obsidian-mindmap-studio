# MindMap Studio 1.15.1 手动文章层级测试结果

## 已完成

- `npm test` 通过：模型、文章编号、布局、搜索、导入导出及源码回归测试全部通过。
- 文档覆盖检查通过：27 个 TypeScript 模块中的 497 个命名声明均具备 JSDoc。
- `npm run build` 通过：TypeScript 类型检查成功，并重新生成 `main.js`。
- `main.js` 通过 `node --check` JavaScript 语法检查。
- `main.js` 使用 Obsidian API 运行时替身完成加载冒烟测试，默认插件导出为 `MindMapStudioPlugin`。
- 已重新运行 `npm run docs:generate`，更新 `docs/FUNCTION_REFERENCE.md`。

## 本次新增的重点行为测试

- 旧版 `skipArticleNumbering: true` 会兼容为 `articleNumberingMode: "none"`。
- 手动文章层级限制在 1–8。
- 手动层级 3/4 可生成“一、相得益彰 / （一）词义 / （二）易混淆成语 / （三）区分”。
- 手动层级 5/6 可生成“1.相得益彰 / （1）词义”。
- 手动编号的末端节点会作为文章标题显示。
- 根节点手动层级可作为整张导图的编号基准。
- 同一父节点下不同有效文章层级使用独立计数器。
- HTML 文档导出保留手动编号和手动末端标题。
- 文章目录、通读模式和跨子导图深度使用有效文章层级，而不是仅使用物理树深度。

## 环境说明

本次验证直接使用当前工作区可用的依赖完成，没有重新执行 `npm ci`。交付的源码包不包含 `node_modules`，在正常联网的开发环境中可按 `npm ci && npm test && npm run build` 重新安装并复现。
