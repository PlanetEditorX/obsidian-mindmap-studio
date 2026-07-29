# 代码块与节点内容修复验证报告

## 修复结论

### 导图折叠代码后节点高度不变

根因是首帧 `computeLayout()` 的估算高度被写入节点 DOM 的 `min-height`。长代码的展开估算值由此成为不可下降的下限；即使 `<details>` 已折叠，节点外框和碰撞布局也无法缩小。

修复后估算高度只用于首帧坐标。DOM 仅应用用户显式保存的 `node.style.minHeight`；Markdown 高亮完成和代码 `<details>` 切换时都会请求实际尺寸测量，随后重新执行碰撞避让、节点定位、连接线和画布边界计算。

### 删除表格块/代码块后原内容恢复

根因是新版有序 `content` 与旧版节点级 `table` / `code` 镜像字段同时存在。编辑器删除内容块后若直接调用普通同步，旧文件迁移逻辑会把仍存在的镜像字段重新补入 `content`。

新增 `replaceNodeContentBlocks()` 作为完整编辑事务入口：先写入权威内容块，清理全部旧镜像，再从新内容重建兼容字段。节点编辑保存和结构化块删除均使用该入口。

## 已执行命令

```bash
npm run docs:generate
npm test
npm run build
node --check main.js
```

## 结果

- `npm test`：通过。
  - 单元测试：`85 / 85` 通过。
  - 代码块与动态高度专项契约：通过。
  - 权威内容替换与旧镜像清理行为测试：通过。
  - 综合回归：输出 `All MindMap Studio tests passed.`。
  - 文档检查：`46` 个 TypeScript 模块中的 `786` 个具名声明均有 JSDoc。
  - 仓库检查：版本、README、必需文件、样式引用和示例路径均符合约束。
- `npm run build`：退出码 `0`。
  - TypeScript 严格检查真实执行并通过。
  - 当前容器提供的是验证用 esbuild 桩，它只校验已有 bundle，不会重新打包；因此交付 `main.js` 通过对上一版生产 bundle 应用与 TypeScript 源码一一对应的确定性补丁更新。
  - 源码/产物契约检查确认 `replaceNodeContentBlocks()`、显式最小高度判断和代码折叠重测逻辑均已进入 `main.js`。
- `node --check main.js`：通过。
- `package-lock.json` 未因本地验证修改。

## 新增回归覆盖

- 节点 DOM 不得再使用 `position.height` 作为隐式 `min-height`。
- 用户显式 `node.style.minHeight` 仍被保留。
- 代码高亮完成后重新测量导图布局。
- 折叠 `<details>` 展开/收起时重新测量布局。
- 完整内容替换会清理旧 `table` 和 `code` 镜像。
- 删除后再次调用 `nodeContentBlocks()` 不会恢复已删除块。
- 节点编辑保存路径必须使用 `replaceNodeContentBlocks()`。

## 验证环境说明

交付源码不包含 `node_modules`。当前容器内部 npm 镜像缺少锁文件中的个别包，因此验证使用容器内已有、仅用于本次检查且不会进入 ZIP 的兼容依赖链接。该环境的 esbuild 为验证桩，无法重新生成 bundle；`main.js` 使用可审计的局部补丁更新后通过 JavaScript 语法检查、构建桩校验及源码/产物关键契约比对。生产源码、`package-lock.json` 和安装包不包含这些环境链接。

未在真实 Obsidian 桌面客户端中执行像素级手工冒烟。发布前建议按 `docs/CODE_BLOCK_RENDERING.zh-CN.md` 的矩阵重点复核：长代码反复折叠/展开时节点外框、相邻节点和连接线同步变化；删除表格/代码后保存、切换模式及重开文件均不恢复。
