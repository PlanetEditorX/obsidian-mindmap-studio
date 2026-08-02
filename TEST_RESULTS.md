# Test Results

版本：1.40.11

- 单元测试：**288 / 288 通过**
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过，**54 个源码模块、1052 个具名声明**
- 仓库检查：通过
- 生产构建：通过，`main.js` 已重新生成

## 本轮实现

- 删除“加载前文/加载后文”加载状态中的圆角边框跑马灯。
- 删除 `@property --mms-article-loader-border-angle`、边框 `::before`、`conic-gradient` 遮罩和 `mms-article-loader-border-run` 无限动画。
- 保留按钮 Flex 双轴居中，文字不会恢复为偏下布局。
- 保留原有按钮内部流光作为加载反馈；系统启用“减少动态效果”时仍停止该动画。
- 文章 5 KB 目标窗口、上下扩展、目录与章节导航代码均未修改。

## 自动回归

- CSS 契约验证按钮继续使用 `display: flex`、`align-items: center` 和 `justify-content: center`。
- CSS 反向契约验证边框角度变量、边框伪元素和边框关键帧均不存在。
- CSS 契约验证内部流光保留，并在 `prefers-reduced-motion: reduce` 下停止。
- 文章窗口、目录返回和章节导航原有回归保持通过。

## 仍需真实 Obsidian 手工验证

- 在 Win10 Obsidian 中触发“加载前文”和“加载后文”，确认边框周围不再出现持续运行的高亮段。
- 在任务管理器或开发者工具中对比长时间停留于加载按钮时的渲染占用。
- 确认按钮文字仍横向、纵向居中，分片扩展可正常完成。

## 交付包验证

- 安装包 SHA-256：`9f43634d33147426afe90ff3a3d76b35a5bbe0308ab329e9f1f7aa00da8ab361`，已写入 `update.json`。
- 本轮交付后缀：`408168`。
