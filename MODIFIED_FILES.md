# 代码行号光学对齐修改清单

| 文件 | 变更 |
|---|---|
| `styles.css` | 将行号数字和沟槽分隔线拆分到 `::before` / `::after`；数字基线补偿从 `0.08em` 调整为 `0.16em`，分隔线不随数字移动 |
| `tests/question.test.mjs` | 将原单一样式断言拆分为数字光学基线和固定分隔线两项回归测试 |
| `docs/SPECIAL_FEATURES.md` | 补充行号继承代码字体/行高、数字与分隔线独立定位的说明 |
| `CHANGELOG.md` | 记录二次修复及根因 |
| `TEST_RESULTS.md` | 记录验证命令和结果 |
| `docs/FUNCTION_REFERENCE.md` | 重新运行生成器复核；本轮未改 TypeScript/JSDoc，预计无内容差异 |
| `main.js` | 本轮只修改 CSS、测试和文档，不涉及 TypeScript 运行时代码，内容不应变化 |
