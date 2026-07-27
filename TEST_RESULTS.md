# AI 接口预设与连通性检测验证报告

## 已通过

### 独立测试

```bash
npm run test:unit
```

结果：`52 / 52` 通过，其中 AI 专项 `11 / 11` 通过。

覆盖内容：

- OpenAI、DeepSeek、硅基流动、FreeLLMAPI 和自定义预设。
- 硅基流动基础地址与三个指定模型建议。
- FreeLLMAPI 空地址和 `auto` 默认模型。
- 旧配置规范化及新增 provider 值保留。
- `/v1` 基础地址自动补全为 `/chat/completions`。
- 连通性检测请求不包含导图 Markdown。
- 页面及节点子树 Markdown、UTF-8 大小限制和协议安全。
- AI 工具栏、快捷键、右键范围和设置页检测按钮源码契约。

### 文档与仓库检查

```bash
node scripts/generate-function-reference.mjs
node scripts/check-docs.mjs
node scripts/check-repository.mjs
node --check scripts/test.mjs
```

结果：

- `609` 个命名声明文档检查通过。
- `37` 个 TypeScript 源模块纳入文档检查。
- 仓库结构和版本一致性检查通过。
- 综合回归脚本语法检查通过。

### TypeScript 检查

- `37` 个 TypeScript 模块使用 TypeScript 编译器 API 完成语法转译，`0` 个诊断。
- AI 配置、Markdown 和协议纯模块通过严格类型检查。

## 未完成

当前运行环境无法解析 npm registry，`node_modules` 中的 `esbuild`、`fflate` 和 Obsidian 开发依赖没有完整恢复。因此未在本环境完成：

```bash
npm run test:regression
npm run build
npm run verify
```

仓库中的 `main.js` 仍是上一版构建产物，不包含本轮新增预设和检测按钮。正式安装或发布前必须在依赖完整环境执行：

```bash
rm -rf node_modules
npm ci --registry=https://registry.npmjs.org/
npm run verify
node --check main.js
```

## 发布判定

| 检查项 | 状态 |
|---|---|
| 独立测试 | 52 / 52 通过 |
| AI 专项测试 | 11 / 11 通过 |
| 文档检查 | 609 个声明通过 |
| 仓库检查 | 通过 |
| TypeScript 语法转译 | 37 个模块，0 诊断 |
| AI 纯模块严格类型检查 | 通过 |
| 综合回归 | 未执行：依赖不完整 |
| 全项目类型检查与生产构建 | 未执行：依赖不完整 |
| 真实第三方接口检测 | 未执行：未提供用户密钥和部署地址 |
