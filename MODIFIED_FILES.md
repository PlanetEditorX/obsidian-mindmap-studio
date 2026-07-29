# README 版本硬编码移除修改清单

## 本次修复

| 文件 | 变更 |
|---|---|
| `README.md` | 删除“当前源码版本”硬编码，仅保留最低 Obsidian 版本；发布章节明确版本以发布元数据为准 |
| `tests/repository-cleanup.test.mjs` | 将 README 与 `package.json` 的精确版本匹配测试替换为“不允许硬编码当前源码版本”的策略测试 |
| `scripts/check-repository.mjs` | 删除 README 版本同步断言，继续校验四份发布元数据一致，并禁止重新引入 README 当前版本文本 |
| `docs/TESTING.md` | 更新仓库检查范围说明 |
| `CHANGELOG.md` | 记录版本单一事实源策略 |
| `TEST_RESULTS.md` | 记录 CI 根因、修复策略和验证结果 |
| `docs/FUNCTION_REFERENCE.md` | 重新运行生成器复核；本轮未改 TypeScript/JSDoc，预计无内容差异 |
| `main.js` | 本轮未改 TypeScript 运行时代码，不应产生内容变化 |

## 策略结果

- README 不再随每次版本发布修改。
- 当前版本由 `package.json`、`package-lock.json`、`manifest.json` 和 `versions.json` 共同约束。
- 版本从 `1.24.5`、`1.24.6` 或后续版本升级时，不再因 README 文本漏同步导致 CI 失败。
