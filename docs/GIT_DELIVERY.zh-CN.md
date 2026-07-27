# 阅读进度同步功能 Git 交付说明

## 交付基线与内容

本交付以 `obsidian-mindmap-studio-1.19.2-optimized-r1` 为基线，增加：

- 大纲模式只在当前会话生效，不再作为插件重启后的启动模式。
- 导图、大纲、文章和通读共享按节点保存的语义阅读位置。
- 关闭、重开和重启后的进度恢复。
- 子导图跨文件定位、节点删除逐级回退和文件改名迁移。
- 通读目录页与父导图挂载节点锚点。
- 文章族异步刷新和多个已打开视图之间的延迟写入隔离。
- 对应自动测试、迁移说明和完整功能文档。

交付包不包含 `node_modules`。仓库中的 `main.js` 仍是基线构建，必须安装依赖并重新构建后才能发布。

## 方式一：使用完整源码

```bash
unzip obsidian-mindmap-studio-1.19.2-progress-sync-source.zip
cd obsidian-mindmap-studio-1.19.2-progress-sync-source

npm ci --registry=https://registry.npmjs.org/
npm run verify
node --check main.js
```

## 方式二：在 optimized-r1 基线上应用累计补丁

```bash
git status --short
git switch -c feat/reading-progress-sync

git apply --check obsidian-mindmap-studio-1.19.2-progress-sync.patch
git apply obsidian-mindmap-studio-1.19.2-progress-sync.patch
```

补丁基线必须是上一版 `optimized-r1` 完整源码，而不是未经优化的原始 1.19.2。若从原始 1.19.2 开始，应先应用 `optimized-r1` 累计补丁，或直接使用本次完整源码包/Git Bundle。

## 方式三：克隆 Git Bundle

```bash
git clone obsidian-mindmap-studio-1.19.2-progress-sync.git.bundle obsidian-mindmap-studio
cd obsidian-mindmap-studio
git log --oneline --decorate
```

Bundle 保存基线提交、功能提交、测试提交和文档提交，适合直接审阅历史。

## 推荐提交结构

```text
feat(reading): synchronize semantic progress across display modes
test(reading): cover startup recovery and progress fallbacks
docs(reading): document persistent cross-mode navigation
```

功能提交应包含领域状态、编辑器、视图、设置和样式；测试提交包含 `tests/`、`scripts/test.mjs` 与测试命令；说明文档单独提交，便于评审。

## 本地与 CI 验证

开发机需使用 Node.js 20 或更高版本：

```bash
npm ci --registry=https://registry.npmjs.org/
npm run test:unit
npm run test:regression
npm run test:docs
npm run test:repo
npm run build
```

统一入口：

```bash
npm run verify
```

若编辑器提示“找不到模块 `obsidian` 或其相应的类型声明”，说明依赖尚未安装完整；不要添加 `declare module "obsidian"` 来隐藏错误。重新执行 `npm ci`，确认 `node_modules/obsidian/obsidian.d.ts` 存在后重启 TypeScript Server。

## Obsidian 手动冒烟

1. 在导图中选择“第二章 → 第二节 → 测试”，依次切换大纲、文章、通读和导图，确认同一节点保持聚焦。
2. 在通读滚动到子导图章节，切换文章/大纲/导图，确认打开正确物理文件。
3. 关闭视图、重启 Obsidian，再从顶层导图和子导图分别打开，确认恢复同一位置。
4. 删除目标节点，确认回退到直接父级；继续删除父级，确认继续向上回退。
5. 删除目标子导图，确认回到父导图挂载节点或目录项。
6. 重命名顶层和子导图，确认进度路径仍有效。
7. 同时打开多个导图，在一个视图切换模式，确认其他视图不会稍后覆盖发起视图的位置。

## 构建提交与发布

完整验证通过后提交重新生成的构建文件：

```bash
git add main.js styles.css manifest.json
git commit -m "build(plugin): regenerate progress-sync bundle"
```

然后再创建 Patch 版本和标签。不要在 `main.js` 尚未重建或宿主冒烟未通过时发布。

## 回滚

功能尚未合并时可直接删除功能分支。已经合并时使用：

```bash
git revert <docs-commit>
git revert <test-commit>
git revert <feature-commit>
```

若仅需临时停用持久化位置，可回滚功能提交；新增 `readingLocations` 位于插件设置，旧版本会忽略该字段，不影响 `.mindmap` 文件数据。
