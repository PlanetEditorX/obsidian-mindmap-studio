# 文章模式快捷键修复

## 功能

- Ctrl/Cmd+Enter：提交正在输入的正文/标题，在同级后插入兄弟节点（根节点退化为子节点）。
- Ctrl/Cmd+Tab：提交正在输入的正文/标题，在当前节点下插入子节点。
- 新节点进入编辑状态；若文章窗口尚未挂载新节点，等待分页窗口完成渲染。
- 文章只读模式、其他视图、代码编辑器和其他表单控件不受影响。

## 实现

`src/main.ts` 在 window capture 阶段监听组合键，同时注册两个 Obsidian 可配置命令；`src/view.ts` 将命令转发到当前编辑器；`src/editor/editor.ts` 负责保存/插入/重聚焦。

## 待人工验证

必须在 Windows 版 Obsidian 编辑正文时测试两种快捷键；Ctrl+Tab 可能被 Obsidian 原生的切换标签页快捷键抢占，需在设置 → 快捷键中解除该冲突。日志应出现 `article-hotkeys/window-combination` 或 `article-hotkeys/command-fired` 和 `editor/article-structure-shortcut`。
