# 当前代码清理 Git 交付说明

## 基线

本交付以 `progress-sync-r2` 提交 `fc66680` 为基线，清理运行时兼容支线、重复状态、未引用代码、样式和示例资源。

## 提交结构

```text
refactor(core): remove obsolete compatibility paths
test(repo): enforce current-only codebase
docs(repo): document cleaned codebase
```

具体提交哈希以交付仓库中的 `git log --oneline` 为准。

## 应用累计补丁

在 `progress-sync-r2` 基线上：

```bash
git status --short
git switch -c refactor/remove-obsolete-code

git apply --check obsidian-mindmap-studio-1.19.2-clean-current-code.patch
git apply obsidian-mindmap-studio-1.19.2-clean-current-code.patch
```

## 保留提交历史

```bash
git switch -c refactor/remove-obsolete-code
git am obsidian-mindmap-studio-1.19.2-clean-current-code-series.mbox
```

## 使用 Git Bundle

```bash
git clone obsidian-mindmap-studio-1.19.2-clean-current-code.git.bundle obsidian-mindmap-studio
cd obsidian-mindmap-studio
git log --oneline --decorate
```

## 依赖与构建

源码包不包含 `node_modules`。安装依赖：

```bash
npm ci --registry=https://registry.npmjs.org/
```

编辑器提示找不到 `obsidian` 类型时，确认：

```text
node_modules/obsidian/obsidian.d.ts
```

存在，然后重启 TypeScript Server。不要使用空的 `declare module "obsidian"` 隐藏依赖问题。

完整验证和构建：

```bash
npm run verify
node --check main.js
```

## 行为变化

本次清理删除运行时兼容分支，属于有意的支持边界收敛：

- 不再自动识别和转换 Markdown 后缀脑图文件。
- 不再读取早期设置目录或单图床字段。
- 不再接受非当前文章编号、剪贴板载荷、外观枚举和围栏名称。
- 不再保存独立通读滚动百分比。

需要处理此类数据时，应先在旧版本中导出当前 `.mindmap` JSON，或使用独立转换脚本处理备份，不应在新运行时重新加入永久别名。

## 发布前手动验证

1. 创建、编辑、保存并重新打开 `.mindmap`。
2. 导图、大纲、文章、通读切换时保持同一节点。
3. 关闭并重新打开后恢复语义位置。
4. 创建、重命名、打开、合并和删除子导图。
5. 粘贴当前插件节点载荷、Markdown、缩进文本和 HTML 列表。
6. 本地图片、图床上传和安全删除。
7. Markdown/XMind 导入及 Markdown/HTML/SVG 导出。
8. 检查设置页不再出现已删除配置。

## 回滚

在共享分支上按相反顺序回滚：

```bash
git revert <docs-commit>
git revert 3fdf83b
git revert c74c103
```

回滚运行时代码会恢复已删除的解析和设置分支，因此应同时回滚对应测试与文档，避免仓库状态不一致。
