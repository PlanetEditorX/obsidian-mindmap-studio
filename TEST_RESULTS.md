# Test Results

版本：1.40.9

- 单元测试：**288 / 288 通过**
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过，**54 个源码模块、1052 个具名声明**
- 仓库检查：通过
- 生产构建：通过，`main.js` 已重新生成

## 本轮真实日志结论

- 用户提供的 1.40.8 日志中，父级目录意图已经完整成功：`open-directory-request`、`consume-pending-directory`、`show-directory`、`render-decision(directoryOnly=true)` 均出现。
- 真正失败发生在目录上下文刷新后的 `set-options-restore-choice`：它仍选择刚离开的子文件阅读位置，随后立即发出新的 `open-path-request`，因此目录只短暂出现后又回到子文章。
- 1.40.9 将生成目录定义为恢复链路的终止落地页。目录激活时，章节恢复目标固定为 `null`，不执行滚动恢复，也不允许历史子文件位置触发跨文件导航。
- 调试事件新增 `articleDirectoryActive`。该值为 `true` 时，`chosenNodeId` 和 `chosenFilePath` 应为空，后续不应出现由恢复链触发的 `open-path-request`。

## 自动回归

- `chooseArticleLandingRefreshLocation(true, ...)` 必须返回 `null`，即使当前 DOM 锚点或历史位置指向子文件。
- 正文激活时仍保持“显式目标 → 当前 DOM 锚点 → 历史阅读位置”的恢复顺序。
- 源码契约验证目录状态会清理待导航键并取消残留恢复事务。

## 版本基线说明

- 用户日志元数据显示实际运行版本为 **1.40.8**。
- 当前会话可修改的完整源码基线为 **1.40.7**；本轮按 **1.40.9** 输出日志驱动候选修复。
- 若实际 1.40.8 包含未提供源码的其他变化，本包不能证明完整保留那些差异。

## 仍需真实 Obsidian 手工验证

- 从深层子导图使用顶部返回、底部返回与 `Esc`，确认父目录稳定保留，不再自动回到刚离开的子文件。
- 检查 `set-options-restore-choice.articleDirectoryActive=true` 时 `chosenNodeId`、`chosenFilePath` 为空，且之后不出现恢复触发的 `open-path-request`。
- 在目录中再次主动点击章节，确认仍能进入对应正文，不受本轮“目录禁止自动恢复”影响。

## 交付包验证

- 安装包 SHA-256：`b15c24b8b1f7ce5dcc8784e9255859f2e8b4e78acf2c5c78abd5935136b95a13`，已写入 `update.json`。
- 本轮交付后缀：`384418`。
