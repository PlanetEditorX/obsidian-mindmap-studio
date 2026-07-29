# 代码行号二次对齐验证报告

## 原因

上一版使用 `0.08em` 的 `padding-top` 给行号数字做基线补偿，但数字与右侧沟槽分隔线仍由同一个 `::before` 伪元素绘制。该实现存在两个问题：

- `0.08em` 在当前 11px 代码字号下只有约 `0.88px`，部分字体、显示缩放和抗锯齿组合下仍显得略高。
- 数字和分隔线耦合在同一盒模型中，只能通过内边距间接移动数字，难以独立校正视觉基线。

## 修复

- 行号数字继续使用 `::before`，直接通过 `top: calc(...)` 应用 `0.16em` 光学基线补偿。
- 沟槽分隔线移到独立的 `::after`，继续使用原始顶部和底部内边距定位。
- 行号继承代码块的字体和行高，补偿随代码字号缩放。
- 新增两项样式契约测试，分别约束数字偏移和分隔线固定定位。

## 浏览器渲染复核

使用系统 Chromium 以 11px 等宽字体、`line-height: 1.55` 和 2 倍设备像素比渲染对比：

- 旧实现：数字伪元素顶部 `10px`，内部补偿 `0.88px`。
- 新实现：数字顶部解析为 `11.76px`。
- 新分隔线顶部仍为 `10px`，位置未随数字下移。

预览文件：`code-line-number-alignment-preview.png`（交付目录外的验证产物）。

## 已通过

```bash
npm run test:unit
npm run test:docs
npm run test:repo
npm run docs:generate
node --check main.js
git diff --check
```

结果：

- 单元测试 `82 / 82` 通过。
- 新增的数字光学基线测试与固定分隔线测试通过。
- README 版本单一事实源策略测试继续通过。
- 文档覆盖检查通过：`45` 个 TypeScript 模块、`774` 个具名声明均有 JSDoc。
- 函数参考文档已重新生成；本轮未修改 TypeScript/JSDoc，生成结果无内容差异。
- 仓库检查、`main.js` JavaScript 语法检查和 Git 空白检查通过。

## 完整命令执行情况

已执行 `npm test`：

- `test:unit` 阶段 `82 / 82` 通过。
- `test:regression` 阶段因当前容器未安装 `esbuild`，以 `ERR_MODULE_NOT_FOUND` 中止。

已执行 `npm run build`：

- TypeScript 启动后因当前容器未安装 `obsidian` 及相关类型依赖而失败，未进入 esbuild 生产打包阶段。
- 本轮只修改 CSS、测试和文档，不涉及 TypeScript 运行时代码，因此 `main.js` 内容保持不变，并已通过语法检查。
- 在完整依赖环境中执行 `npm ci && npm test && npm run build` 可完成最终生产验证。
