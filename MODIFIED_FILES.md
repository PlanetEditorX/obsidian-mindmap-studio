# AI 修改要求同步修复清单

| 文件 | 变更 |
|---|---|
| `src/ai/edit.ts` | 新增 AI 编辑默认修改要求，以及询问/编辑模式独立草稿的创建与切换纯函数 |
| `src/ai/modal.ts` | 模式切换时同步加载对应输入内容；首次进入 AI 编辑显示整理导图要求，并保留两种模式各自草稿 |
| `tests/ai.test.mjs` | 新增模式草稿行为测试和弹窗接入契约，覆盖询问、编辑、本地替换之间的来回切换 |
| `docs/AI_ASSISTANT.zh-CN.md` | 说明默认修改要求和模式独立草稿行为 |
| `docs/AI_EDIT_PROMPT_SYNC_FIX.zh-CN.md` | 记录问题根因、修复行为、实现边界和冒烟步骤 |
| `README.md` | 增加 AI 输入草稿同步说明 |
| `CHANGELOG.md` | 记录切换到 AI 编辑仍显示询问默认问题的修复 |
| `docs/FUNCTION_REFERENCE.md` | 按当前源码重新生成函数参考 |
| `TEST_RESULTS.md` | 更新本轮实际验证和构建结果 |
