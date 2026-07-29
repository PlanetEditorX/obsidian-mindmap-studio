# 1.24.4 仓库一致性修复验证报告

## 修复内容

- 将示例导图的 `#Uxxxx` 编码文件名恢复为可读 UTF-8 路径：
  - `examples/中国文学示例.mindmap`
  - `examples/古诗.mindmap`
  - `examples/MindMap Assets/古诗/唐诗.mindmap`
- 将 README 当前源码版本由 `1.20.1` 修正为 `1.24.4`。
- 新增 README 版本与 `package.json` 一致性测试和仓库检查。
- 重新生成并检查函数参考文档。

## 已通过验证

以下命令在当前源码树执行通过：

```bash
npm run test:unit
npm run test:docs
npm run test:repo
npm run docs:generate
node --check main.js
node --check scripts/check-repository.mjs
node --check tests/repository-cleanup.test.mjs
git diff --check
```

结果：

- 单元测试 `80 / 80` 通过。
- 文档覆盖检查通过：`45` 个 TypeScript 模块、`774` 个具名声明均有 JSDoc。
- 仓库结构、版本文件、示例路径和必需文档检查通过。
- `main.js` 及本轮修改的 JavaScript 测试/脚本语法检查通过。
- 本轮未修改 TypeScript 运行时代码，`src/` 与 `main.js` 相对导入快照保持不变。

## 受环境阻断的验证

已执行 `npm test`。单元测试通过后，回归阶段因当前环境无法安装 `esbuild` 与 `fflate`，在载入 `scripts/test.mjs` 时以 `ERR_MODULE_NOT_FOUND` 退出，因此该命令未能完整结束。

已执行 `npm run build`。TypeScript 启动后因依赖目录不完整，报告缺少 `codemirror`、`estree`、`node` 与 `tern` 类型定义，未进入 esbuild 生产打包阶段。

干净依赖安装已尝试，但当前执行环境无法解析 `registry.npmjs.org`，npm 返回 `EAI_AGAIN`。临时链接的环境内 TypeScript 仅用于运行不依赖第三方包的单元测试，没有提交到 Git。

正式发布环境应执行：

```bash
rm -rf node_modules
npm ci
npm test
npm run build
node --check main.js
```

由于本轮变更只涉及示例资源、测试与文档，现有 `main.js` 不需要内容更新；待依赖可用时重新执行生产构建，应生成与导入快照等价的运行时代码。
