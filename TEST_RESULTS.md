# MindMap Studio 阅读进度同步交付验证报告

## 验证范围

本报告记录“默认不恢复大纲模式”和“四模式统一阅读位置”在当前执行环境中的实际验证结果。结果严格区分已执行项目与受依赖环境阻塞的项目，不把未运行的检查标记为通过。

## CI 回归断言修复

后续 CI 日志显示综合回归已经成功加载源码，但在 `scripts/test.mjs` 中仍检查早期设计名 `captureReadingPosition`。当前实现使用统一语义位置 API：

- `captureCurrentLocation(mode)`：从导图选择或滚动视口提取位置。
- `restoreReadingLocation(mode, location)`：在目标模式恢复节点与节点内部比例。

测试已改为匹配这两个私有方法的完整 TypeScript 签名，避免仅命中调用点、注释或已经废弃的方法名。该修复不改变运行时代码。

## 已执行通过

### 独立单元与源码契约测试

命令：

```bash
npm run test:unit
```

结果：32 项通过，0 项失败。此次 CI 断言修复后已重新执行。

覆盖：

- 大纲不作为下次启动模式、可见模式回退及持久化规则。
- 节点祖先链、跨子导图父级链、节点和子导图缺失后的逐级回退。
- 路径重命名迁移、异常磁盘记录规范化和滚动比例边界。
- 通读目录页节点锚点，以及子导图章节对应的父挂载节点别名。
- 文章族上下文变化时旧键写回顺序，防止跨文件串写进度。
- 多视图全局模式广播时取消非发起视图的延迟写入，防止反向覆盖。
- 文件名非法字符、控制字符、Unicode、尾随点、Windows 保留名和长度限制。
- 扩展名、时间戳、默认标题和 MIME 映射。
- 图床 HTTP(S) 端点、Header、multipart、响应载荷和返回 URL 校验。

### 纯状态模块严格类型检查

命令：

```bash
./node_modules/typescript/bin/tsc \
  --noEmit \
  --target ES2022 \
  --module ESNext \
  --moduleResolution node \
  --strict \
  --skipLibCheck \
  src/article/display-mode.ts \
  src/article/reading-location.ts
```

结果：通过。新增的启动模式和语义位置领域模块在严格模式下没有类型错误。

### 文档覆盖检查

命令：

```bash
npm run test:docs
```

结果：通过。当前 32 个 TypeScript 模块中的 576 个命名声明满足仓库 JSDoc 检查规则。

### 仓库结构检查

命令：

```bash
npm run test:repo
```

结果：通过。

检查项包括版本文件一致、必需文档与脚本存在、README 结构有效、临时分析目录未进入交付，以及 `.gitignore` 覆盖构建和测试产物。

### 脚本语法与冲突标记

以下检查通过：

```bash
node --check scripts/test.mjs
node --check tests/display-mode.test.mjs
node --check tests/reading-location.test.mjs
node --check tests/reading-editor-contract.test.mjs
```

源码及文档中未发现 Git 冲突标记。

## 受环境阻塞

### 完整依赖安装

项目已经在 `devDependencies` 中声明 `obsidian`、`esbuild`、TypeScript 和 Node 类型，并在 `dependencies` 中声明 `fflate`。当前容器不能解析 `registry.npmjs.org`，因此不能恢复完整 `node_modules`。

### 综合回归、完整类型检查与生产构建

以下命令依赖尚未安装的 `esbuild`、`obsidian`、`fflate` 和相关类型包，未在当前环境完成：

```bash
npm run test:regression
npm run build
npm run verify
```

`npm run test:regression` 在加载阶段会因缺少 `esbuild` 退出，尚未进入原有 674 项断言；这不能解释为断言通过或失败。

## 构建产物说明

本交付更新的是完整 TypeScript 源码、测试、样式和说明文档。仓库中的 `main.js` 仍是此前 1.19.2 构建产物，不包含本次阅读进度同步实现，不能直接作为本功能的安装包。

在网络正常的开发机或 CI 中必须执行：

```bash
npm ci --registry=https://registry.npmjs.org/
npm run verify
node --check main.js
```

随后在独立 Obsidian 测试仓库完成四模式切换、退出重开、跨子导图跳转和逐级回退冒烟测试，再提交新生成的 `main.js`。

## 发布判定

| 检查 | 状态 |
|---|---|
| 独立单元与源码契约测试 | 32/32 通过 |
| 新增纯状态模块严格类型检查 | 通过 |
| 文档检查 | 576 个声明，通过 |
| 仓库检查 | 通过 |
| 脚本语法与冲突标记 | 通过 |
| 原 674 项综合回归 | 未执行：缺少完整依赖 |
| 全项目 TypeScript 检查 | 未执行：缺少 Obsidian 等依赖 |
| 生产构建 | 未执行：缺少 esbuild 等依赖 |
| Obsidian 宿主冒烟 | 未执行：无宿主环境 |

结论：交付物可用于审阅、应用补丁和继续集成；完成 `npm ci && npm run verify`、重新生成 `main.js` 并通过 Obsidian 手动冒烟前，不应创建正式发布标签。
