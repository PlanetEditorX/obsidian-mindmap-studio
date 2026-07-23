# MindMap Studio 1.6.0 测试结果

## 已完成

- `main.js` 通过 `node --check` JavaScript 语法检查。
- `src/model.ts` 使用本地 TypeScript 编译器独立编译成功。
- 同级节点向上移动测试通过。
- 同级节点向下移动测试通过。
- 拖到节点中间变更父子关系测试通过。
- 禁止拖入自身后代测试通过。
- 禁止移动根节点测试通过。
- 安装包目录结构检查通过，仅包含：
  - `mindmap-studio/main.js`
  - `mindmap-studio/manifest.json`
  - `mindmap-studio/styles.css`

## 当前环境未完成

当前运行环境无法正常下载 npm 依赖，因此未能执行完整的：

- `npm ci`
- `npm test`
- `npm run build`
- `npm run docs:check`
- 全新依赖目录二次构建

安装包中的 `main.js` 已在原 1.5.1 构建产物基础上同步加入本次拖拽排序修复，并通过 JavaScript 语法检查。

真实 Obsidian GUI 拖拽交互仍建议安装后进行一次实机验证。
