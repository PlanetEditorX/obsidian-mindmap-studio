# README 版本硬编码移除验证报告

## CI 根因

上传的 GitHub Actions 日志显示：

- 测试运行的包版本已升级为 `1.24.6`。
- 代码行号基线回归测试通过。
- 81 个单元测试中前 80 个通过，唯一失败项是 `README source version matches package metadata`。
- 失败断言要求 README 精确包含 `当前源码版本：` 与 `package.json.version`，因此每次发布版本提升而 README 未同步时都会重复失败。

这不是 `1.24.6` 功能代码或代码行号样式问题，而是 README 重复保存发布版本造成的多事实源漂移。

## 修复策略

采用“方案 2”：

- 删除 README 中的“当前源码版本”文本，仅保留最低 Obsidian 版本。
- 当前版本只由 `package.json`、`package-lock.json`、`manifest.json` 和 `versions.json` 约束。
- 将单元测试和仓库检查从“README 必须匹配当前版本”改为“README 不允许重新硬编码当前版本”。
- 后续升级到 `1.24.6` 或更高版本时，README 无需跟随修改。

## 已通过验证

为当前未安装依赖的源码树临时复用环境内 TypeScript 编译器后，以下命令通过：

```bash
npm run test:unit
npm run test:repo
npm run test:docs
npm run docs:generate
node --check main.js
git diff --check
```

结果：

- 单元测试 `81 / 81` 通过。
- 新策略测试 `README does not hard-code the current source version` 通过。
- 代码行号基线回归测试继续通过。
- 仓库检查通过；四份发布元数据仍保持一致。
- 文档覆盖检查通过：`45` 个 TypeScript 模块、`774` 个具名声明均有 JSDoc。
- 函数参考文档已重新生成；本轮未修改 TypeScript/JSDoc，生成结果无内容差异。
- `main.js` JavaScript 语法检查与 Git 空白检查通过。

## 完整命令执行情况

已执行 `npm test`：

- `test:unit` 阶段 `81 / 81` 通过。
- `test:regression` 阶段因当前容器未安装 `esbuild`，以 `ERR_MODULE_NOT_FOUND` 中止。

已执行 `npm run build`：

- TypeScript 启动后因当前容器未安装 `obsidian` 及其扩展 DOM 类型而失败，未进入 esbuild 生产打包阶段。
- 本轮只修改 README、仓库策略测试和说明文档，不修改 TypeScript、CSS 或运行时代码，因此 `main.js` 内容不应变化。
- 在完整依赖环境执行 `npm ci && npm test && npm run build` 可完成最终生产验证。
