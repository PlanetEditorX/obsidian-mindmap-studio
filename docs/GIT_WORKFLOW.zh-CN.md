# Git 工作流与交付说明

## 分支模型

仓库采用短生命周期分支：

- `main`：随时可构建、可验证、可发布。
- `feature/<topic>`：新功能。
- `fix/<topic>`：缺陷修复。
- `refactor/<topic>`：不改变外部行为的重构。
- `docs/<topic>`：仅文档。
- `release/<version>`：仅在需要人工冻结发布时使用。

分支应从最新 `main` 创建，并通过 Pull Request 合并。避免长期维护独立开发分支。

## 提交规范

使用 Conventional Commits：

```text
<type>(<scope>): <summary>
```

常用类型：

- `feat`：用户可见功能。
- `fix`：缺陷修复。
- `refactor`：行为不变的结构调整。
- `test`：测试。
- `docs`：文档。
- `build`：构建或依赖。
- `ci`：持续集成。
- `chore`：其他维护。

示例：

```text
refactor(upload): extract validated image-host helpers
test(utils): cover multipart and filename edge cases
docs(repo): replace stacked release notes with current guide
```

一个提交只承担一个可解释目的。不要把源码重构、格式化、版本升级和无关文档混在同一提交。

## 推荐提交序列

本次优化可拆成以下提交：

```text
refactor(core): extract filename and image-host utilities
refactor(submap): consolidate child-map document creation
test(utils): add deterministic boundary tests
docs(repo): regenerate project and maintenance documentation
ci(repo): add unified verification and repository checks
```

需要压缩历史时，可在合并前交互式 rebase，但应保留审阅所需的逻辑边界。

## 开发流程

```bash
git switch main
git pull --ff-only
git switch -c refactor/validated-upload-boundaries

npm ci
npm run verify

git add -p
git commit -m "refactor(upload): extract validated image-host helpers"
git push -u origin refactor/validated-upload-boundaries
```

创建 PR 前再次执行：

```bash
npm ci
npm run verify
git status --short
```

## Pull Request 要求

PR 描述必须包含：

- 问题与目标。
- 关键设计选择。
- 用户可见变化与兼容性。
- 自动测试和手动验证。
- 风险、迁移与回滚方式。
- 文档和更新记录是否已同步。

至少一名审阅者确认以下内容后再合并：

1. 没有绕过模型规范化、撤销保存链路或安全删除条件。
2. 新增外部输入已经使用 `unknown` 和显式校验。
3. 测试覆盖成功、失败和边界路径。
4. 源码包没有凭据、缓存和本地分析文件。
5. CI 完整通过。

## 版本与标签

版本遵循 SemVer：

- Patch：兼容修复和内部优化。
- Minor：向后兼容的新功能。
- Major：数据或用户行为存在破坏性变化。

版本必须同步：

```text
package.json
package-lock.json
manifest.json
versions.json
```

发布标签格式：

```text
v1.19.3
```

发布前执行：

```bash
node scripts/sync-version.mjs 1.19.3
npm run verify
git add package.json package-lock.json manifest.json versions.json main.js CHANGELOG.md
git commit -m "chore(release): v1.19.3"
git tag -a v1.19.3 -m "MindMap Studio v1.19.3"
git push origin main --follow-tags
```

不要在普通功能提交中提前创建标签。

## 发布包

安装包目录必须为：

```text
mindmap-studio/
├── main.js
├── manifest.json
└── styles.css
```

源码包通过 `git archive` 从已提交内容生成，不应包含：

```text
node_modules/
.ua/
.local-test-build/
coverage/
dist/
真实图床凭据
个人 Obsidian 仓库数据
```

建议同时发布 SHA-256 校验文件。

## 回滚

已经合并到共享分支的提交使用 `git revert`，不要重写公共历史：

```bash
git revert <commit-sha>
git push origin main
```

已发布版本需要回滚时：

1. 对故障提交执行 `git revert`。
2. 增加 Patch 版本。
3. 运行完整验证。
4. 发布新标签，不删除已公开标签。
5. 在 `CHANGELOG.md` 说明故障范围与恢复方式。

## 本次交付应用方式

收到完整源码包后，可用以下流程替换工作区：

```bash
unzip obsidian-mindmap-studio-1.19.2-optimized-source.zip
cd obsidian-mindmap-studio-1.19.2-optimized
git init
git add .
git commit -m "refactor(repo): apply validated maintenance baseline"
```

若已有原仓库，建议先解压到独立目录，再使用补丁：

```bash
git switch -c refactor/maintenance-baseline
git apply --check obsidian-mindmap-studio-1.19.2-optimized.patch
git apply obsidian-mindmap-studio-1.19.2-optimized.patch
npm ci
npm run verify
```
