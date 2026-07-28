# AI 结构化编辑与本地替换修改清单

| 文件 | 变更 |
|---|---|
| `src/ai/edit.ts` | 新增 AI Markdown 修改提案解析、页面/子树替换、稳定 ID、运行元数据保留、过期预览保护、输出限制，以及不联网的本地文字替换 |
| `src/ai/protocol.ts` | 新增 Markdown-only AI 编辑请求体，限制编辑温度并保持非流式协议 |
| `src/ai/client.ts` | 新增 AI 编辑提案请求边界，不直接接触或修改导图模型 |
| `src/main.ts` | 新增 `proposeAiEdit()`，按启用的接口配置请求结构化修改提案 |
| `src/view.ts` | 将当前页面或右键节点范围接入 AI 预览、确认应用和本地替换回调 |
| `src/editor/editor.ts` | 新增 AI 编辑和本地替换的预览/应用入口，统一接入撤销、保存、渲染、聚焦和只读保护 |
| `src/ai/modal.ts` | AI 窗口新增问答、AI 重整、本地替换三种模式；增加节点数和 Markdown 预览、命中预览及明确确认按钮 |
| `styles.css` | 新增 AI 编辑预览、本地替换表单、警告和 Markdown 内容预览样式 |
| `tests/ai.test.mjs` | AI 专项测试扩展到 17 项，覆盖结构化替换、元数据、并发保护、输出限制和离线替换边界 |
| `scripts/test.mjs` | 综合回归增加 AI 编辑协议、预览/应用分离、过期保护、本地替换和确认按钮契约 |
| `README.md` | 增加 AI 节点重整和本地替换功能概览 |
| `docs/AI_ASSISTANT.zh-CN.md` | 重写为三模式完整说明，补充安全流程、范围、撤销、限制和操作示例 |
| `docs/ARCHITECTURE.md` | 增加 `src/ai/edit.ts` 领域边界和网络层不得直接写模型的约束 |
| `docs/TESTING.md` | 补充 AI 编辑与本地替换测试范围 |
| `docs/SPECIAL_FEATURES.md` | 更新 AI 功能当前行为 |
| `docs/PROJECT_GUIDE.zh-CN.md` | 更新 AI 可确认编辑和离线替换概览 |
| `docs/FUNCTION_REFERENCE.md` | 按 38 个当前 TypeScript 模块重新生成函数参考 |
| `CHANGELOG.md` | 记录 AI 结构化编辑、本地替换和安全限制 |
| `TEST_RESULTS.md` | 更新本轮实际验证结果和构建限制 |
