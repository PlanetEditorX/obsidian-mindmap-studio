# 修改文件清单

## 代码

- `src/main.ts`：接入纯工具；合并子导图公共流程；改进关键方法注释。
- `src/utils/filename.ts`：新增跨平台文件名、扩展名、时间戳、标题和 MIME 工具。
- `src/utils/image-host.ts`：新增端点、Header、multipart 和响应解析工具。

## 测试与检查

- `tests/compile-typescript.mjs`：测试期 TypeScript 模块加载器。
- `tests/filename.test.mjs`：文件名工具单元测试。
- `tests/image-host.test.mjs`：图床工具单元测试。
- `scripts/check-repository.mjs`：仓库结构、版本和清洁度检查。
- `package.json`、`package-lock.json`：分层测试、统一验证和 Node 版本要求。

## 文档

- `README.md`：重写为当前产品说明。
- `docs/PROJECT_GUIDE.zh-CN.md`：新增完整统一说明。
- `docs/DEVELOPMENT.md`：重写开发说明。
- `docs/TESTING.md`：新增测试策略。
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
