# 行内编辑源码契约 CI 修复

## 故障表现

综合回归在 `scripts/test.mjs` 中失败，期望以下源码顺序：

```text
pointerdown → contentEditable = "true" → contentEditable = "false"
```

当前实现已经把激活逻辑抽到 `activateInlineEditable()`：

- `makeInlineEditable()` 注册 `pointerdown`，并委托共享激活方法；
- `activateInlineEditable()` 设置 `contentEditable = "true"`；
- `makeInlineEditable()` 的 `blur` 处理设置 `contentEditable = "false"`。

三项行为仍然存在，但它们不再按旧正则要求的文本顺序位于同一个方法中，所以旧测试产生误报。

## 修复

回归测试改为分别验证三个职责：

1. 指针事件调用 `activateInlineEditable(element, false)`；
2. 共享激活方法启用 `contentEditable` 和编辑期辅助属性；
3. 失焦处理关闭 `contentEditable` 并清理编辑期辅助属性。

同时将旧签名检查：

```ts
private activateInlineEditable(element: HTMLElement): void
```

更新为当前签名：

```ts
private activateInlineEditable(element: HTMLElement, focus = true): void
```

该参数允许鼠标按下时先进入编辑状态但不立即抢夺焦点，键盘快速编辑仍使用默认聚焦行为。

## 影响范围

本次只修改测试与说明，不修改运行时代码、`.mindmap` 数据格式或行内编辑行为。

## 验证

- 独立测试：50 / 50 通过。
- 阅读编辑器契约：9 / 9 通过。
- 文档检查：603 个声明通过。
- 仓库检查：通过。
- 37 个 TypeScript 模块语法转译：0 个错误。

完整综合回归需要在安装 `esbuild`、`fflate`、`obsidian` 等依赖后执行：

```bash
npm ci
npm run verify
```
