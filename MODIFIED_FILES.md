# 当前代码清理修改清单

## 节点跳转反馈环修复

- `src/article/reading-location.ts`
  - 新增视口锚点比例计算，节点点击可保留当前屏幕位置。
- `src/editor/editor.ts`
  - 程序恢复滚动位置期间暂停滚动采集。
  - 节点选择改用真实视口锚点，并识别通读中的物理文件路径。
  - 显式跨文件导航时优先采用当前文件位置。
- `src/editor/editor-types.ts`
  - 增加一次性“优先当前文件”上下文选项。
- `src/view.ts`、`src/main.ts`
  - 区分普通重新打开与显式父子导图导航，防止旧位置把视图拉回。
- `tests/reading-location.test.mjs`、`tests/reading-editor-contract.test.mjs`
  - 增加视口比例、程序滚动隔离和显式导航优先级测试。
- `docs/READING_JUMP_FIX.zh-CN.md`
  - 记录故障链路、修复策略、兼容性与验证场景。

## 运行时代码

- `src/main.ts`
  - 删除 Markdown 后缀脑图识别、自动转换、菜单和打开重定向。
  - 删除早期插件目录设置搬运、单图床设置转换和重复初始化分支。
  - 阅读位置改名只迁移语义状态，不再维护独立滚动百分比。
  - 内容同步统一调用 `syncNodeContentFields()`。
- `src/core/model.ts`
  - 删除文章编号布尔别名、外观枚举别名和围栏名称别名。
  - 删除未使用的 Wiki 链接收集导出。
  - 当前解析只支持原始 JSON、`mindmap-json` 和正式 Markdown 导入。
- `src/article/modes.ts`
  - 文章编号仅使用当前模式字段。
  - `tocDepth` 改为必需字段，不再回退到其他层级字段。
- `src/article/display-mode.ts`
  - 删除无效模式类型分支，保留当前显示模式规则。
- `src/editor/clipboard-import.ts`
  - 删除单节点包装函数和多套载荷名称。
  - 插件 JSON 只接受 `mindmap-studio-nodes`。
- `src/editor/editor-modals.ts`
  - 删除没有调用方的节点搜索弹窗。
- `src/editor/editor.ts`、`src/editor/editor-types.ts`、`src/view.ts`、`src/settings.ts`
  - 删除未使用导入、字段、尺寸配置和独立通读百分比持久化。
- `src/import/import-export.ts`
  - 删除没有调用方的单文档 HTML 包装导出。
- `src/render/layout.ts`
  - 删除未使用局部变量。
- `styles.css`
  - 删除旧视图类型选择器、孤立搜索弹窗样式、已更名富文本控件样式和其他未引用规则。
- `tsconfig.json`
  - 启用 `noUnusedLocals`、`noUnusedParameters`。
  - 删除自定义 `typeRoots`。

## 测试与检查

- `tests/repository-cleanup.test.mjs`
  - 检查 TypeScript 未使用项配置。
  - 检查插件 CSS 类引用。
  - 检查示例文件路径。
- `scripts/test.mjs`
  - 删除针对已移除名称和实现位置的源码断言。
  - 保留当前模块职责和行为契约。
- `scripts/check-docs.mjs`
  - 更新四模式文档要求。
- `scripts/check-repository.mjs`
  - 增加当前代码清理文档要求。
- `package.json`
  - 将仓库清洁度测试加入 `test:unit`。

## 示例

- 示例文件统一为 UTF-8 可读路径。
- 删除 `%xx`、`#Uxxxx` 和重复资源目录。
- 更新父子导图导航路径和当前文章编号字段。

## 文档

- 新增 `docs/CODE_CLEANUP.zh-CN.md`。
- 重写 `docs/MAINTENANCE_GUIDE.zh-CN.md`。
- 更新 README、项目说明、架构、数据模型、开发、测试、特殊功能和阅读位置说明。
- 重新生成 `docs/FUNCTION_REFERENCE.md`。
- 删除累计迁移说明和一次性 CI 故障说明。
- 更新 `CHANGELOG.md`、`TEST_RESULTS.md`、`MODIFIED_FILES.md` 和 Git 交付说明。

## 文字悬浮提示修复

| 文件 | 变更 |
|---|---|
| `src/editor/editor.ts` | 编辑辅助属性仅在行内编辑期间启用，阅读状态不再触发文字悬浮提示 |
| `tests/reading-editor-contract.test.mjs` | 增加静态文字不暴露编辑标签的契约测试 |
| `docs/HOVER_TOOLTIP_FIX.zh-CN.md` | 记录问题原因、修复边界和最终行为 |
| `CHANGELOG.md` | 增加未发布修复记录 |
| `TEST_RESULTS.md` | 记录本次实际验证结果 |


## AI 助手

| 文件 | 变更 |
|---|---|
| `src/ai/config.ts` | 新增 OpenAI、DeepSeek、自定义预设以及配置规范化 |
| `src/ai/markdown.ts` | 新增整页/节点子树 Markdown 转换、UTF-8 大小与超限判断 |
| `src/ai/protocol.ts` | 新增安全 Header 解析、Chat Completions 请求体和响应解析 |
| `src/ai/client.ts` | 新增唯一 AI HTTP 请求边界 |
| `src/ai/modal.ts` | 新增范围摘要、大小提示、处理轨迹和回答窗口 |
| `src/settings.ts` | 新增 AI 接口设置、默认接口、大小上限和默认问题 |
| `src/main.ts` | 新增 AI 快捷命令、配置迁移和请求服务 |
| `src/view.ts` | 根据页面或节点 ID 构建 AI 上下文 |
| `src/editor/editor-types.ts` | 新增编辑器到宿主层的 AI 回调 |
| `src/editor/editor.ts` | 新增工具栏按钮、节点/空白右键范围和范围状态 |
| `src/editor/outline-renderer.ts` | 大纲节点右键传递 AI 节点范围 |
| `src/editor/article-renderer.ts` | 文章节点右键传递 AI 节点范围 |
| `styles.css` | 新增 AI 设置卡片、窗口、大小警告和处理轨迹样式 |
| `tests/ai.test.mjs` | 新增 9 项 AI 配置、Markdown、协议和集成测试 |
| `tests/compile-typescript.mjs` | 支持联合编译多个 TypeScript 测试模块 |
| `scripts/test.mjs` | 新增 AI 集成契约并修正行内编辑辅助标签契约 |
| `package.json` | 将 AI 测试加入 `test:unit` |
| `docs/AI_ASSISTANT.zh-CN.md` | 新增完整使用、安全与故障排查说明 |
| `docs/GIT_DELIVERY_AI_ASSISTANT.zh-CN.md` | 新增补丁、mbox、Bundle、构建和回滚说明 |
| `README.md`、`CHANGELOG.md`、其他文档 | 更新功能、架构、测试和隐私说明 |

## 行内编辑契约测试修复

| 文件 | 变更 |
|---|---|
| `scripts/test.mjs` | 将旧的跨文件顺序正则拆为指针委托、共享激活、失焦释放三个稳定契约，并更新 `activateInlineEditable` 当前签名 |
| `tests/reading-editor-contract.test.mjs` | 新增共享行内编辑激活/释放路径的独立契约测试 |
| `docs/CI_FIX_INLINE_EDIT_CONTRACT.zh-CN.md` | 记录失败原因、修复策略和验证结果 |
| `CHANGELOG.md` | 增加未发布测试修复记录 |
| `TEST_RESULTS.md` | 记录本轮实际测试结果 |
