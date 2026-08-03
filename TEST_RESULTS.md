# Test Results

版本：1.43.2

- 单元测试：**320 / 320 通过**
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过，**56 个源码模块、1123 个具名声明**
- 仓库检查：通过
- 生产构建：通过

## 本轮根因

- 子导图导航栏的父级返回回调无条件调用 `onOpenArticleDirectory()`。
- 即使当前处于导图模式，父文件仍会排队目录意图，加载后被强制切换为文章模式目录。
- 调试日志中的 `currentMode: "mindmap"` 后紧接 `open-article-directory-callback`、`open-directory-request` 和 `show-directory`，与该错误分流一致。

## 本轮实现

- 新增 `resolveParentReturnIntent()`，仅文章模式返回 `article-directory`，其他显示模式返回 `parent-map`。
- 导图、大纲、通读和题库使用 `onOpenMindMap()` 打开父导图并传递原挂载节点 ID。
- 文章模式继续使用 `onOpenArticleDirectory()`，文章分页器和 Escape 返回行为不变。
- 父级返回调试事件增加 `destinationIntent`，便于确认实际导航链路。

## 自动回归

- 验证文章模式返回父级目录。
- 验证导图、大纲、通读和题库返回普通父导图。
- 验证导图面包屑同时保留父节点 ID、页面过渡和普通导图入口。
- 验证文章分页器与 Escape 仍使用目录入口。

## 仍需真实 Obsidian 手工验证

- 在导图模式进入子导图后点击左上角返回，确认父导图保持导图模式并聚焦原挂载节点。
- 分别在大纲、通读和题库模式返回父导图，确认保持当前模式。
- 在文章模式返回父级，确认仍进入父导图文章目录。
- 开启调试后确认导图返回事件记录 `destinationIntent: "parent-map"`。

## 交付包验证

- 安装包 SHA-256：`0cd0cb26fb1d523b2320253bff850419413556f5496f93d0172b1e981ba23fa1`，已写入 `update.json`。
- 本轮交付后缀：`290987`。
