# 1.24.5 README 与发布元数据一致性修复修改清单

## 本次增量修复

| 文件 | 变更 |
|---|---|
| `README.md` | 将当前源码版本同步为 `1.24.5`，修复 CI 中的版本一致性断言失败 |
| `package.json` | 将项目版本同步为 `1.24.5` |
| `package-lock.json` | 将根包与锁文件版本同步为 `1.24.5` |
| `manifest.json` | 将 Obsidian 插件版本同步为 `1.24.5` |
| `versions.json` | 增加 `1.24.5` 对应的最低 Obsidian 版本映射 |
| `CHANGELOG.md` | 记录 CI 版本说明修复 |
| `TEST_RESULTS.md` | 记录上传 CI 日志中的失败原因与本轮验证结果 |
| `docs/FUNCTION_REFERENCE.md` | 已重新运行生成器复核；本轮未改 TypeScript/JSDoc，生成结果无内容差异 |
| `main.js` | 本轮未改 TypeScript 运行时代码，内容无需变化；仅执行语法检查 |

## 前一轮代码行号对齐修复

| 文件 | 变更 |
|---|---|
| `styles.css` | 为代码块行号文字增加 `0.08em` 基线补偿，只移动数字文字，不移动分隔线 |
| `tests/question.test.mjs` | 新增行号基线和分隔线布局契约测试 |
| `CHANGELOG.md` | 记录代码行号与正文基线对齐修复 |
| `TEST_RESULTS.md` | 记录单元测试、文档检查、渲染检查，以及完整测试和构建的依赖阻断 |
| `docs/FUNCTION_REFERENCE.md` | 已运行生成器复核；本轮未改 TypeScript/JSDoc，生成结果无内容差异 |
| `main.js` | 本轮未改 TypeScript 运行时代码，内容无需变化；语法检查通过 |

## 更早的仓库一致性修复

- 示例导图已恢复为可读 UTF-8 路径。
- README 当前源码版本已与 `package.json` 统一为 `1.24.4`。
- 仓库检查已覆盖规范示例路径和 README 版本一致性。
