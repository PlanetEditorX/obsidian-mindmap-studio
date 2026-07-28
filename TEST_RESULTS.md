# AI 编辑修改要求同步修复验证报告

## 已通过

### 独立测试

```bash
npm run test:unit
```

结果：`60 / 60` 通过，其中 AI 专项 `19 / 19` 通过。

新增覆盖：

- 首次从询问模式切换到 AI 编辑时加载专用整理要求；
- 询问与编辑模式分别保存自己的输入草稿；
- 经过本地替换模式再返回时不会覆盖隐藏草稿；
- 用户修改后的询问和编辑内容可以在多次切换后分别恢复；
- 弹窗已接入共享草稿状态函数。

### 文档与仓库检查

```bash
node scripts/generate-function-reference.mjs
npm run test:docs
npm run test:repo
node --check scripts/test.mjs
```

结果：

- `636` 个命名声明文档检查通过；
- `38` 个 TypeScript 源模块纳入文档检查；
- 仓库结构与版本一致性检查通过；
- 综合回归脚本 JavaScript 语法检查通过；
- 函数参考已按当前源码重新生成。

### TypeScript 语法检查

使用 TypeScript 编译器 API 对 `src/` 下全部模块执行语法转译：

```text
38 个模块，0 个错误
```

## 当前环境未完成

源码包不包含 `node_modules`。尝试通过 npm registry 恢复锁定依赖时，环境 DNS/下载被中断，`esbuild`、`fflate` 和 `obsidian` 未形成可用安装，因此本环境未执行：

```bash
npm run test:regression
npm run build
npm run verify
```

仓库中的 `main.js` 仍是上一版构建产物，不包含本轮修改。正式安装或发布前必须在依赖完整环境执行：

```bash
rm -rf node_modules
npm ci --registry=https://registry.npmjs.org/
npm run verify
node --check main.js
```

## 手动冒烟建议

1. 打开 AI 窗口，确认默认处于“询问 AI”，内容为设置中的默认问题。
2. 切换到“AI 整理并重新生成”，确认内容自动变为整理层级和合并重复节点的要求。
3. 修改编辑要求，切换到询问模式，再切回编辑模式，确认修改后的要求仍存在。
4. 分别修改询问问题和编辑要求，经过本地替换模式来回切换，确认两份草稿互不覆盖。
5. 提交 AI 编辑请求，确认实际发送的是当前编辑模式显示的修改要求。
