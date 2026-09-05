# obsidian-mindmap-studio 项目交接

- 插件：MindMap Studio（Obsidian 本地优先 .mindmap 导图，含导图/大纲/文章/通读模式、全局搜索、图床、AI 助手与桌面截图链路）。
- 版本基线：1.47.1（package.json / manifest.json / versions.json / package-lock.json 已同步）。
- 仓库规则：见根目录 `AGENTS.md`；每轮代码交付三份 ZIP（源码 / 安装 / Codex 交接）共用同一六位后缀；验证入口 `npm run verify`。

## 当前状态（1.47.1）

- 本轮完成：AI 网络请求支持主动取消。`src/ai/protocol.ts` 新增 `isAiRequestCancelled()`、`throwIfSignalAborted()`、`createAiAbortError()` 与 `consumeAiStreamReader()`（SSE 事件累计器与完整文本解析共用）；`src/ai/client.ts` 全部公开请求函数新增可选 `AbortSignal`（流式传入 Fetch，`requestUrl` 路径前后校验）；`src/ai/modal.ts` 每轮请求持有 `AbortController`，窗口关闭或再次发送时中止；`src/view.ts` 识图串行批处理每张图片前检查信号，取消不计入失败图片；取消与失败在 UI 分离显示。
- 顺带修复：`tests/compile-typescript.mjs` 的 `loadTypeScriptModules()` 对绝对源码路径先按 `process.cwd()` 归一化，修复 Windows 下临时目录拼出盘符段导致 `article-context-cache` 等 4 个测试文件必然失败的问题；Linux 行为不变。

## 验证基线

- `npm run verify` 本机完整通过：`test:unit` 393/393（含 `tests/ai.test.mjs` 30 项，其中本轮新增 5 项取消契约）；`test:regression` 全部通过（含 `main.js` 安装 bundle 契约）；`test:docs` 覆盖 58 个源码模块、1236 个具名声明；`test:repo` 通过；`tsc --noEmit` + production esbuild 通过，`main.js` 已重建。
- 详细数据见根目录 `TEST_RESULTS.md` 1.47.1 小节。

## 待验证事项（需真实 Obsidian 桌面端手工冒烟）

- 流式问答/整理进行中关闭 AI 窗口：状态不停留“生成中”，无异常日志，后台连接被中断。
- 请求进行中再次点击发送：上一轮立即中止并开始新一轮。
- 识图批处理进行中关闭窗口：剩余图片不再发起请求，取消提示正确，已完成结果保留。
- 跨域回退路径（服务端未开放 CORS）取消仅在前置校验生效，属预期边界。

## 下一步建议

- 编辑器侧两项性能优化仍待实施（见 1.47.0 审查结论）：把 `documentSnapshotJson` 失效与 `nodeTreeIndex` 重建收拢进 `mutate()` 单一入口，降低绕过统一入口的回归风险；可考虑 debug 抽样断言缓存一致性。
- `src/editor/editor.ts` 约 8,900 行，后续可按文章渲染、视口手势、行内编辑、题目系统边界拆分。
- `src/ai/client.ts` 三处重复的 usage 提取可抽取 `buildCompletionResult()` 帮助函数。

## 最近交付包

- 后缀 `741761`：完整源码 `obsidian-mindmap-studio-1.47.1-741761.zip`、安装包 `mindmap-studio-1.47.1-test-741761.zip`（SHA-256 `b110c15eda0401880738734cf8ccd63a826570932364de6d3372c7c4792c8ad2`）、交接 `Codex-1.47.1-handoff-741761.zip`。
