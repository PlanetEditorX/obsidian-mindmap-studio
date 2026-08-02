# Test Results

版本：1.40.7

- 单元测试：**286 / 286 通过**
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过，**54 个源码模块、1051 个具名声明**
- 仓库检查：通过
- 生产构建：通过，`main.js` 已重新生成

## 本轮真实日志结论

- 用户提供的 1.40.6 日志显示，工具栏切换目录本身成功：`set-landing-mode(requestedMode="toc")` 后 `render-decision.directoryOnly=true` 且目录窗口完成挂载。
- 异常发生在从子导图返回父导图：父节点 ID 被通用 `focusNode()` 消费，日志中的 `landingMode` 从 `toc` 改为 `article`，随后 `render-decision.directoryOnly=false`，因此展示父导图原始文章正文。
- 修复后，父级返回、底部“返回上一级”和 Esc 使用独立目录意图。父节点只负责目录条目定位，不再成为正文 `ReadingLocation`。
- 目录意图在父文件编辑器构造前消费，首帧直接采用目录骨架/目录页面，不先显示原始文章。

## 新增调试判据

正常父级返回应依次出现：

1. `open-directory-request`
2. `queue-directory`
3. `consume-pending-directory`（新文件加载时）
4. `apply-pending-directory`
5. `show-directory`
6. `render-decision.directoryOnly=true`
7. `window-mounted.directoryOnly=true`
8. 可选 `directory-focus-applied`

该链路中不应出现针对父节点的 `focus-node-start` 或 `pendingArticleTarget`。

## 版本基线说明

- 用户日志元数据显示实际运行版本为 **1.40.6**。
- 当前可修改源码基线来自上一轮 **1.40.5** 源码包；本轮输出 **1.40.7** 候选修复。
- 真实 Win10 + Obsidian 仍需安装后验证，自动测试通过不能替代实际界面验证。

## 仍需真实 Obsidian 手工验证

- 从深层子导图分别使用顶部“返回父导图”、底部“返回上一级”和 Esc，确认父文件首帧直接为目录。
- 确认目录自动滚动到来源条目附近，并且不会在随后上下文刷新后切回原始文章。
- 返回目录后等待 5 秒并滚动，确认没有正文恢复任务再次接管。
- 从目录点击章节，确认仍正常进入目标正文；目录意图不能影响普通章节跳转。

## 交付包验证

- 源码 ZIP 第一层固定为 `obsidian-mindmap-studio/`，安装 ZIP 固定为 `mindmap-studio/`，Codex ZIP 固定为 `Codex/`。
- 三份 ZIP 的非 ASCII 路径使用 UTF-8 主文件名与 general-purpose bit 11，并执行实际解压验证。
- 安装包 SHA-256：`6102a0b56864c6acc9f69e0d1fa96f10fbf5c0bf613acbd59cb8ec9a420fb391`，已写入 `update.json`。
- 本轮交付后缀：`724375`。
