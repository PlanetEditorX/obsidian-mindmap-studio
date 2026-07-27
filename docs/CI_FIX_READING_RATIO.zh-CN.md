# 阅读比例回归断言修复

## 故障现象

CI 在 `scripts/test.mjs` 中失败，期望源码出现：

```text
nodeRatio: Math.max(0, Math.min(1, ...))
```

## 根因

该断言来自早期实现。当时编辑器直接计算并截断节点内部比例。阅读进度重构后，所有可持久化比例都由 `src/article/reading-location.ts` 的 `clampRatio()` 统一规范化：

- `createReadingLocation()` 处理新捕获的位置；
- `normalizeReadingLocation()` 处理磁盘中的旧值或异常值；
- `resolveReadingLocation()` 只消费已经规范化的比例。

因此，在 `src/editor/editor.ts` 查找旧内联表达式会产生假失败。

## 修复

综合回归现在验证：

1. 阅读位置模块存在共享 `clampRatio()`；
2. `nodeRatio` 在创建和规范化路径中调用共享工具；
3. 行为测试继续验证超界值被截断到 `0–1`。

本次修改不改变插件运行时代码、设置结构或 `.mindmap` 文件格式。

## 验证

已执行：

```text
32 / 32 独立测试通过
576 个命名声明文档检查通过
仓库结构检查通过
scripts/test.mjs 语法检查通过
共享比例工具定向契约检查通过
```

完整综合回归仍需要安装项目声明的 `esbuild`、`fflate`、`obsidian` 等依赖后在 CI 或联网开发机执行。
