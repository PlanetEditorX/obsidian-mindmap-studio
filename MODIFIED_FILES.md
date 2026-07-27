# 修改文件清单

## 代码

- `src/main.ts`：接入纯工具；合并子导图公共流程；实现会话级大纲模式、阅读位置加载、跨文件父级元数据和重命名迁移。
- `src/article/display-mode.ts`：新增启动显示模式和持久化规则。
- `src/article/reading-location.ts`：新增跨模式、跨物理文件的语义阅读位置与逐级回退。
- `src/article/modes.ts`：为通读章节补充父文件与挂载节点元数据。
- `src/editor/editor.ts`、`src/editor/editor-types.ts`：捕获、保存、恢复和跨文件导航统一阅读位置；增加目录/父挂载语义锚点，并隔离文章族切换与多视图广播中的延迟写入。
- `src/view.ts`、`src/settings.ts`：连接插件设置、编辑器和物理文件导航。
- `styles.css`：增加零高度通读语义锚点样式，不影响正文排版。
- `src/utils/filename.ts`：新增跨平台文件名、扩展名、时间戳、标题和 MIME 工具。
- `src/utils/image-host.ts`：新增端点、Header、multipart 和响应解析工具。

## 测试与检查

- `tests/compile-typescript.mjs`：测试期 TypeScript 模块加载器。
- `tests/display-mode.test.mjs`：启动模式和会话持久化单元测试。
- `tests/reading-location.test.mjs`：祖先链、跨文件链、删除回退和规范化测试。
- `tests/reading-editor-contract.test.mjs`：目录/父挂载锚点、文章族切换写回和多视图并发契约。
- `tests/filename.test.mjs`：文件名工具单元测试。
- `tests/image-host.test.mjs`：图床工具单元测试。
- `scripts/test.mjs`：增加显示模式、语义阅读位置、跨文件恢复和改名迁移源码契约；修正 multipart 模块迁移断言；将旧的阅读位置方法名检查更新为当前完整签名；将旧的编辑器内联 `nodeRatio` 截断检查更新为共享 `clampRatio()` 工具契约。
- `scripts/check-repository.mjs`：仓库结构、版本和清洁度检查。
- `package.json`、`package-lock.json`：分层测试、统一验证和 Node 版本要求。

## 文档

- `README.md`：重写为当前产品说明。
- `docs/PROJECT_GUIDE.zh-CN.md`：新增完整统一说明。
- `docs/DEVELOPMENT.md`：重写开发说明。
- `docs/TESTING.md`：更新显示模式和语义位置测试策略。
- `docs/READING_PROGRESS_SYNC.zh-CN.md`：新增四模式进度同步、持久化和回退算法说明。
- `docs/GIT_WORKFLOW.zh-CN.md`：新增 Git、版本、发布和回滚说明。
- `docs/MAINTENANCE_GUIDE.zh-CN.md`：新增分析、优化和后续治理说明。
- `docs/ARCHITECTURE.md`：补充工具层和图床流程。
- `docs/FUNCTION_REFERENCE.md`：从当前源码重新生成。
- `CHANGELOG.md`：更新未发布工程化变更。
- `TEST_RESULTS.md`：重写为本次真实验证报告。
- `CONTRIBUTING.md`、`SECURITY.md`：新增贡献和安全流程。

## CI 与协作模板

- `.github/workflows/ci.yml`
- `.gitlab-ci.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.gitignore`

## 从交付中移除

- `.ua/`
- `.local-test-build/`
- `start-dashboard.bat`

这些是本地分析或临时构建产物，不属于源码和发布文件。
