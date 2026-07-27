# AI 助手 Git 交付说明

## 基线

本交付以 `obsidian-mindmap-studio-1.19.2-hover-tooltip-fix-source.zip` 为基线，目标分支为：

```text
feat/ai-assistant
```

提交按职责拆分：

```text
fix(repo): restore readable example paths
feat(ai): add configurable map-aware assistant
test(ai): cover context sizing and protocol safety
docs(ai): document configuration scopes and privacy
```

具体哈希以交付 Bundle 或 `git log --oneline` 输出为准。

## 推荐方式：应用累计补丁

在未修改的 hover-tooltip-fix 源码根目录执行：

```bash
git switch -c feat/ai-assistant
git apply --check obsidian-mindmap-studio-1.19.2-ai-assistant.patch
git apply obsidian-mindmap-studio-1.19.2-ai-assistant.patch
```

累计补丁不保留原提交历史。应用后可自行提交：

```bash
git add .
git commit -m "feat(ai): add configurable map-aware assistant"
```

## 保留提交历史：应用 mbox

```bash
git switch -c feat/ai-assistant
git am obsidian-mindmap-studio-1.19.2-ai-assistant-series.mbox
```

发生冲突时：

```bash
git status
# 修复冲突后
git add <已解决文件>
git am --continue
```

取消本次应用：

```bash
git am --abort
```

## 直接克隆 Bundle

```bash
git clone \
  -b feat/ai-assistant \
  obsidian-mindmap-studio-1.19.2-ai-assistant.git.bundle \
  obsidian-mindmap-studio
```

验证 Bundle：

```bash
git bundle verify obsidian-mindmap-studio-1.19.2-ai-assistant.git.bundle
```

## 构建与验证

源码包不包含 `node_modules`。根目录中的既有 `main.js` 是基线构建，不包含 AI 功能。安装或发布前必须执行：

```bash
rm -rf node_modules
npm ci --registry=https://registry.npmjs.org/
npm run verify
node --check main.js
```

仅验证独立测试：

```bash
npm run test:unit
npm run test:docs
npm run test:repo
```

## 安装到 Obsidian

构建后复制：

```text
main.js
manifest.json
styles.css
```

到：

```text
<仓库>/.obsidian/plugins/mindmap-studio/
```

重载插件后，在设置页配置 AI 接口。

## 回滚

整组回滚四个提交：

```bash
git log --oneline -5
git revert --no-commit <最早功能提交>^..<最新文档提交>
git commit -m "revert(ai): remove map-aware assistant"
```

尚未推送且允许重置时：

```bash
git reset --hard <基线提交>
```

## 发布前检查

- 使用测试密钥验证 OpenAI 或 DeepSeek 预设。
- 验证自定义接口 Header 和响应兼容性。
- 验证整页与节点子树范围。
- 验证超过 Markdown 大小上限时不可发送。
- 验证工具栏、快捷键和四种视图右键菜单。
- 确认 `data.json`、API 密钥和真实导图未进入 Git。
