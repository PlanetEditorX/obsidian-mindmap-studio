# 1.24.4 仓库一致性修复 Git 交付说明

## 交付范围

本交付基于用户提供的 `obsidian-mindmap-studio-1.24.4-source.zip`。压缩包不包含 `.git` 历史，因此仓库内先建立一笔原始源码快照提交，再以独立提交完成本轮修复。

本轮修复内容：

- 将示例目录中的 `#Uxxxx` 编码文件名恢复为可读 UTF-8 路径。
- 保持父导图 `古诗.mindmap` 与子导图 `MindMap Assets/古诗/唐诗.mindmap` 的现有路径引用一致。
- 将 README 当前源码版本更新为 `1.24.4`。
- 增加 README 版本与 `package.json` 一致性检查，避免后续发布说明漂移。
- 更新变更记录、测试报告和 Git 交付文档。

## 提交结构

```text
chore: import 1.24.4 source snapshot
fix(repo): restore readable examples and version consistency
```

具体提交哈希以交付仓库中的以下命令为准：

```bash
git log --oneline --decorate -2
```

## 验证命令

```bash
npm test
npm run build
node --check main.js
git diff --check HEAD^
```

源码包不提交 `node_modules`。正式环境应使用 Node.js 20 或更高版本，并先执行：

```bash
npm ci
```

## 变更审查

查看独立修复提交：

```bash
git show --stat HEAD
git show --find-renames HEAD
```

生成可应用补丁：

```bash
git format-patch -1 HEAD --stdout > mindmap-studio-1.24.4-repository-fix.patch
```

## 回滚

```bash
git revert HEAD
```

该回滚会恢复编码示例路径、旧 README 版本说明及原有检查行为，不会修改 `.mindmap` 数据结构或 `main.js` 运行时代码。
