# AI 结构化编辑与本地替换验证报告

## 已通过

### 独立测试

```bash
npm run test:unit
```

结果：`59 / 59` 通过，其中 AI 专项 `18 / 18` 通过。

覆盖内容：

- OpenAI、DeepSeek、硅基流动、FreeLLMAPI 和自定义预设。
- 页面与右键节点子树的 Markdown 范围和 UTF-8 大小限制。
- AI 问答、AI Markdown 编辑提案和本地文字替换三种模式。
- 三种模式的输入字段严格隔离：本地替换只显示查找和替换，其他模式不显示替换字段。
- AI 编辑只返回 Markdown、温度上限和非流式协议。
- 页面和节点子树替换、稳定根 ID、兄弟分支隔离和运行元数据保留。
- 预览后内容变化时拒绝应用旧提案。
- AI 输出一级标题、`2 MB` 和 `5000` 节点保护。
- 本地替换的大小写、命中数、富文本协调、备注和表格处理。
- 本地替换不修改链接、代码、图片地址和子导图路径。
- 工具栏、快捷键、右键范围、确认应用和撤销接入的源码契约。

### 文档与仓库检查

```bash
node scripts/generate-function-reference.mjs
npm run test:docs
npm run test:repo
node --check scripts/test.mjs
```

结果：

- `633` 个命名声明文档检查通过。
- `38` 个 TypeScript 源模块纳入文档检查。
- 仓库结构和版本一致性检查通过。
- 综合回归脚本语法检查通过。
- 函数参考已按当前源码重新生成。

### TypeScript 检查

- `38` 个 TypeScript 模块使用 TypeScript 编译器 API 完成语法转译，`0` 个诊断。
- `src/ai/edit.ts`、AI 配置、Markdown、协议及核心模型纯模块通过严格类型检查。

## 未完成

当前运行环境访问 npm registry 时安装中断，只创建了不完整的依赖目录。`obsidian`、`fflate` 和 `esbuild` 未完整恢复，因此未在本环境完成：

```bash
npm run test:regression
npm run build
npm run verify
```

仓库中的 `main.js` 仍是上一版构建产物，不包含本轮 AI 编辑与本地替换。正式安装或发布前必须在依赖完整环境执行：

```bash
rm -rf node_modules
npm ci --registry=https://registry.npmjs.org/
npm run verify
node --check main.js
```

## 手动冒烟建议

1. 在当前页面执行 AI 重整，确认预览前文件没有变化，确认后节点被替换且可撤销。
2. 右键中间节点执行 AI 重整，确认兄弟节点和父节点不变。
3. 生成预览后手动编辑目标范围，再点击应用，确认提示预览过期。
4. 本地将 `A` 替换为 `B`，确认不产生网络请求，链接、代码、图片和子导图路径不变。
5. 在显式只读锁定状态尝试应用，确认操作被拒绝。

## 发布判定

| 检查项 | 状态 |
|---|---|
| 独立测试 | 59 / 59 通过 |
| AI 专项测试 | 18 / 18 通过 |
| 文档检查 | 633 个声明通过 |
| 仓库检查 | 通过 |
| TypeScript 语法转译 | 38 个模块，0 诊断 |
| AI 纯模块严格类型检查 | 通过 |
| 综合回归 | 未执行：依赖不完整 |
| 全项目类型检查与生产构建 | 未执行：依赖不完整 |
| 真实第三方 AI 编辑 | 未执行：未提供用户密钥和非敏感测试导图 |
