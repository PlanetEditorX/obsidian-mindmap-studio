# 1.24.4 代码行号对齐修复修改清单

## 本次增量修复

| 文件 | 变更 |
|---|---|
| `styles.css` | 为代码块行号文字增加 `0.08em` 基线补偿，只移动数字文字，不移动分隔线 |
| `tests/question.test.mjs` | 新增行号基线和分隔线布局契约测试 |
| `CHANGELOG.md` | 记录代码行号与正文基线对齐修复 |
| `TEST_RESULTS.md` | 记录单元测试、文档检查、渲染检查，以及完整测试和构建的依赖阻断 |
| `docs/FUNCTION_REFERENCE.md` | 已运行生成器复核；本轮未改 TypeScript/JSDoc，生成结果无内容差异 |
| `main.js` | 本轮未改 TypeScript 运行时代码，内容无需变化；语法检查通过 |

## 前一轮仓库一致性修复

- 示例导图已恢复为可读 UTF-8 路径。
- README 当前源码版本已与 `package.json` 统一为 `1.24.4`。
- 仓库检查已覆盖规范示例路径和 README 版本一致性。
