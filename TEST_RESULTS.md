# Test Results

版本：1.40.5

- 单元测试：**283 / 283 通过**
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过，**54 个源码模块、1049 个具名声明**
- 仓库检查：通过
- 生产构建：通过，`main.js` 已重新生成

## 本轮真实日志结论

- 用户提供的 1.40.4 日志中，章节打开先记录正确 `explicitTarget`，但同一次上下文刷新后的 `window-mounted` 已被替换为文件根节点；问题发生在 `setOptions()` 的恢复位置优先级，不在目录链接、节点查找或滚动选择器。
- 返回父导图成功打开父文件并消费父节点目标，但上下文刷新后旧子文件阅读位置又触发跨文件 `open-path-request`，导致界面立即返回子导图。
- 修复后，上下文刷新恢复顺序为“本次精确节点 → 当前 DOM 锚点 → 历史阅读位置”；文章入口过渡同样固定使用触发本次过渡的章节，后到的普通恢复不能覆盖。
- 视图层保留一次性 `preferredCurrentNodeId` 直到文章上下文完成，父级返回和跨文件章节不再从可变 `selectedId` 推断目标。
- 新增 `set-options-restore-choice` 调试事件，记录请求节点、当前 DOM 节点、历史节点和最终选择；新增两个可执行纯函数回归，直接覆盖日志中的父子文件冲突与章节/根节点冲突。

## 版本基线说明

- 用户日志元数据显示实际运行版本为 **1.40.4**。
- 当前会话可修改的完整源码基线为 **1.39.13**；本轮按 **1.40.5** 输出日志驱动热修复。
- 如果实际 1.40.4 还包含未提供源码的其他改动，本包不能证明完整保留那些差异；需要真实 1.40.4 源码才能进行无损合并。

## 交付包验证

- 源码 ZIP 第一层固定为 `obsidian-mindmap-studio/`，安装 ZIP 固定为 `mindmap-studio/`，Codex ZIP 固定为 `Codex/`。
- 三份 ZIP 的非 ASCII 路径使用 UTF-8 主文件名与 general-purpose bit 11，并执行实际解压验证。
- 安装包 SHA-256：`8f2ee9720233937087095eda6f25635c2a22c7f6f24a44996527f18e1e3aabfe`，已写入 `update.json`。
- 本轮交付后缀：`341942`。

## 仍需真实 Obsidian 手工验证

- 从目录连续点击当前文件章节和跨文件深层章节，确认 `render-decision.explicitTarget`、`set-options-restore-choice.chosenNodeId` 与 `window-mounted.latestTarget` 始终相同。
- 从深层子导图使用底部返回、顶部父级导航和 `Esc`，确认父文件打开后不再出现指向刚离开的子导图的自动 `open-path-request`。
- 快速连续点击多个章节并等待图片、表格、代码和字体加载，确认只有最后目标生效且无二次滚动。
- 若仍异常，开启调试模式后复制完整 JSONL；重点检查新增的 `set-options-restore-choice` 与相邻 `render-decision`、`window-mounted`、`open-path-request`。
