# 硅基流动、FreeLLMAPI 与接口检测修改清单

| 文件 | 变更 |
|---|---|
| `src/ai/config.ts` | 新增 `siliconflow`、`freellmapi` provider；加入硅基流动基础地址、三个模型建议、FreeLLMAPI 空地址与 `auto` 默认模型；新用户默认配置增加两个停用卡片 |
| `src/ai/protocol.ts` | 新增基础地址到 Chat Completions 地址的规范化；新增不包含导图正文的最小连通性检测请求体 |
| `src/ai/client.ts` | 抽取统一请求头和 Chat Completions 请求边界；新增 AI 接口检测客户端 |
| `src/main.ts` | 新增 `testAiProfile()`，显示检测耗时、实际模型、短响应或错误信息 |
| `src/settings.ts` | 新增“硅基流动”“FreeLLMAPI”按钮和预设类型；模型输入框增加建议列表；每个 AI 接口卡片新增“检测接口”按钮 |
| `styles.css` | 新增 AI 接口检测与删除按钮操作区样式 |
| `tests/ai.test.mjs` | AI 专项测试扩展到 11 项，覆盖预设、模型、地址补全和无导图检测请求 |
| `scripts/test.mjs` | 综合回归增加新增 provider、模型、检测按钮和最小检测请求的源码契约 |
| `README.md` | 更新内置接口、模型建议与检测按钮说明 |
| `docs/AI_ASSISTANT.zh-CN.md` | 增加硅基流动、FreeLLMAPI 配置表和检测接口说明 |
| `docs/PROJECT_GUIDE.zh-CN.md` | 更新 AI provider 与检测能力概览 |
| `docs/FUNCTION_REFERENCE.md` | 重新生成当前函数参考 |
| `CHANGELOG.md` | 增加未发布功能记录 |
| `TEST_RESULTS.md` | 更新本轮实际验证结果 |
| `examples/**` | 恢复源码包中被 ZIP 编码的 UTF-8 示例路径，保证仓库清洁度测试通过 |
