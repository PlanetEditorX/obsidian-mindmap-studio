# 1.24.4 仓库一致性修复修改清单

| 文件/目录 | 变更 |
|---|---|
| `examples/中国文学示例.mindmap` | 将原 `#Uxxxx` 编码文件名恢复为可读 UTF-8 名称 |
| `examples/古诗.mindmap` | 恢复父导图可读文件名，并保留其对子导图的现有 UTF-8 路径引用 |
| `examples/MindMap Assets/古诗/唐诗.mindmap` | 恢复子导图目录和文件名，保持父子导图元数据一致 |
| `tests/repository-cleanup.test.mjs` | 补充三个规范示例路径必须存在的回归断言，并校验 README 版本 |
| `scripts/check-repository.mjs` | 将 README 当前源码版本纳入仓库一致性检查 |
| `README.md` | 将当前源码版本修正为 `1.24.4` |
| `CHANGELOG.md` | 记录示例路径和版本说明修复 |
| `docs/GIT_DELIVERY.zh-CN.md` | 记录无原始 Git 历史时的基线提交、修复提交、审查与回滚方式 |
| `docs/FUNCTION_REFERENCE.md` | 已运行生成器复核；本轮未改 TypeScript/JSDoc，生成结果无内容差异 |
| `TEST_RESULTS.md` | 记录实际通过项、依赖安装阻断和正式环境复核命令 |
| `main.js` | 本轮未改 TypeScript 运行时代码，文件保持导入快照内容；语法检查通过 |
