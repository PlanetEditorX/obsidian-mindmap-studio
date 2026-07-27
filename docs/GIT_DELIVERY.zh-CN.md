# 本次优化的 Git 交付说明

## 交付内容

- 完整优化源码：`obsidian-mindmap-studio-1.19.2-optimized-source.zip`
- 有效源码与文档补丁：`obsidian-mindmap-studio-1.19.2-optimized.patch`
- 校验值：同目录 `SHA256SUMS.txt`

补丁排除了原压缩包中的 `.ua/`、`.local-test-build/` 和 `start-dashboard.bat` 大型本地产物。应用补丁后需按下文显式删除这些目录。

## 方式一：以完整源码建立分支

```bash
unzip obsidian-mindmap-studio-1.19.2-optimized-source.zip
cd obsidian-mindmap-studio-1.19.2-optimized-source

git init
git switch -c refactor/maintenance-baseline
git add .
git commit -m "refactor(repo): establish validated maintenance baseline"
```

已有远程仓库时，将其设为 `origin` 后推送：

```bash
git remote add origin <repository-url>
git push -u origin refactor/maintenance-baseline
```

## 方式二：对现有 1.19.2 工作树应用补丁

先确保工作树干净：

```bash
git status --short
git switch -c refactor/maintenance-baseline
```

检查并应用：

```bash
git apply --check obsidian-mindmap-studio-1.19.2-optimized.patch
git apply obsidian-mindmap-studio-1.19.2-optimized.patch
rm -rf .ua .local-test-build start-dashboard.bat
```

Windows PowerShell：

```powershell
Remove-Item -Recurse -Force .ua, .local-test-build -ErrorAction SilentlyContinue
Remove-Item -Force start-dashboard.bat -ErrorAction SilentlyContinue
```

## 推荐提交拆分

为便于审阅，建议使用以下提交顺序：

```text
refactor(core): extract filename and image-host utilities
refactor(submap): consolidate child-map persistence flow
test(utils): add deterministic input-boundary coverage
docs(repo): regenerate current project documentation
ci(repo): enforce complete verification and clean delivery
```

可使用 `git add -p` 按逻辑暂存：

```bash
git add -p src/main.ts src/utils
git commit -m "refactor(core): extract validated utility boundaries"

git add tests package.json package-lock.json scripts/check-repository.mjs
git commit -m "test(utils): cover filename and image-host edge cases"

git add README.md CHANGELOG.md TEST_RESULTS.md MODIFIED_FILES.md docs CONTRIBUTING.md SECURITY.md
git commit -m "docs(repo): regenerate current project documentation"

git add .github .gitlab-ci.yml .gitignore
git commit -m "ci(repo): enforce complete verification and clean delivery"
```

子导图重构位于 `src/main.ts`，如需严格分离，可在第一步使用 `git add -p` 将相关区块单独提交。

## 验证与发布门槛

当前交付中已通过独立单元测试、文档检查、仓库检查和 TypeScript 语法诊断。当前执行环境的 npm 镜像返回 503，因此完整依赖安装、原 674 项回归和生产构建未完成。

网络正常的开发机或 CI 必须执行：

```bash
npm ci
npm run verify
node --check main.js
```

全部通过后再提交重新生成的 `main.js`：

```bash
git add main.js

git commit -m "build(plugin): regenerate optimized production bundle"
```

不要直接把本次源码交付标记为正式发布标签，因为仓库内 `main.js` 仍是原始 1.19.2 构建产物。

## PR 标题与说明建议

PR 标题：

```text
refactor(repo): harden upload boundaries and regenerate project documentation
```

PR 说明应包含：

- 不改变 `.mindmap` 数据版本和持久化字段。
- 合并子导图重复流程。
- 收紧图床 URL、Header、multipart 和响应 URL 校验。
- 新增 19 项独立单元测试及仓库检查。
- README 改为当前状态说明，版本历史保留在 CHANGELOG。
- 完整回归和构建需由依赖可用的 CI 完成。

## 回滚

合并后发现问题时使用：

```bash
git revert <merge-or-commit-sha>
git push origin main
```

不要删除已公开标签或强推共享分支。若问题已发布，回滚后增加 Patch 版本并重新运行完整验证。
