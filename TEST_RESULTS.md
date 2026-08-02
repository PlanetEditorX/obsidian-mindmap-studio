# Test Results

版本：1.39.10

- 单元测试：278 / 278 通过
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过（53 个源码模块、1027 个具名声明）
- 仓库检查：通过
- 生产构建：通过，`main.js` 已重新生成

本轮专项验证：

- 文章首次进入正文、目录点击目标章节或切换到另一篇文章时，只显示固定范围的 `.mms-article-entry-skeleton`，并通过双 `requestAnimationFrame()` 让骨架先完成绘制，再挂载真实 5 KB 目标窗口。
- 骨架位于文章滚动容器内，不使用 `position: fixed`，不覆盖已渲染正文、不创建章节占位，也不参与目标章节高度或滚动位置计算。
- 骨架阶段收到的 `ReadingLocation` 会写入 `pendingArticleFocusLocation`，真实窗口挂载后再由精确 `.mms-article-node[data-node-id]` 定位；快速连续导航会取消旧动画帧，只保留最后一个目标。
- 初始窗口、目标重建和边缘新增章节使用约 140–150 ms 淡入；向前补载从上方进入，向后补载从下方进入。
- 自动或手动边缘扩展先让“加载前文/后文”按钮绘制流光，再挂载约 5 KB 真实节点；已显示正文保持可读，向上补载仍按新增 `scrollHeight` 补偿 `scrollTop`。
- `prefers-reduced-motion: reduce` 下跳过入口骨架等待，并关闭骨架、文章页、章节和边缘流光动画。
- 目标窗口、精确子章节定位、父级返回、内容块编辑、折叠、缩略导航、图片、表格、代码和导出专项保持通过。

交付包验证：

- 源码 ZIP 第一层固定为 `obsidian-mindmap-studio/`，安装 ZIP 固定为 `mindmap-studio/`，Codex ZIP 固定为 `Codex/`。
- 三份 ZIP 的非 ASCII 路径使用 UTF-8 主文件名与 general-purpose bit 11，并执行实际解压验证。
- 安装包 SHA-256：`2389c420b3bda6d0be1842cdef1e49b2365bdadb4a0e8d9da6270eef1a43e5c4`，已写入 `update.json`。
- 本轮交付后缀：`940696`。

仍需真实 Obsidian 手工验证：

- 在 Win10 Obsidian 中打开 80 KB 以上、含图片/代码/表格的文章，确认骨架能立即出现，真实目标章节随后淡入且界面不长时间无响应。
- 从目录快速连续点击两个远端章节，确认旧骨架被取消，最终只落到最后一次点击的章节。
- 连续双向滚动跨越多个 5 KB 窗口，确认边缘流光不遮挡正文，向上补载不改变当前段落屏幕位置。
- 在系统“减少动态效果”开启后确认文章直接渲染，无骨架等待和新增动画。
