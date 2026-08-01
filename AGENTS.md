# 仓库工作规则

## 开始工作

1. 阅读 `README.md`、`CONTRIBUTING.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md` 和 `docs/DEVELOPMENT.md`。
2. 阅读 `Codex/README.md`、`Codex/偏好与交付规则.md` 与对应项目文件，以上一轮的当前状态、待验证和下一步为续接起点。
3. 修改前定位相关源码、调用方和测试；不要做无关重构。

## 实现与兼容性

- 保持 TypeScript、JSDoc 和现有代码风格一致；外部 JSON 使用 `unknown` 并显式校验。
- 数据兼容与规范化放在 `src/core/`；可撤销编辑必须进入统一历史和保存链路。
- `node.content` 是内容块的权威集合；旧字段仅作为兼容镜像。完整替换使用 `replaceNodeContentBlocks()`，移动使用 `moveNodeContentBlock()`，并同步来源和目标节点的兼容字段。
- 功能变更必须补充专项测试；行为、数据、架构、测试或开发流程变化必须同步文档。接口或函数注释变更后运行 `npm run docs:generate`。
- Obsidian 插件源码变化后必须重新构建 `main.js`。
- 截图与识别必须保持三条动作边界：普通截图只处理图片，截图并识别在图片完成后调用识别链路，“识别并复制”只复制文字；不得重新引入“截图后自动识图”开关。
- 截图覆盖层的选区、标注和输出由 `src/utils/desktop-capture.ts` 负责，编辑器只冻结插入目标并通过回调接入保存、撤销与识别；普通截图不得自动关闭，双击选区才复制并插入；截图并识别在选区拖拽或边框调整完成后等待 3 秒自动确认，选区内鼠标活动和边框调整必须重置计时。Windows 必须以完整虚拟桌面为截图源，保留每块显示器的全局坐标并按原始像素映射，禁止把截图强行拉伸到 Obsidian 窗口；截图编辑器打开或切换屏幕后，默认选区必须覆盖当前屏幕完整范围；PowerShell 脚本必须使用 UTF-8 BOM，显示器名称由编辑器本地生成以避免乱码。文字工具必须保持输入焦点并兼容中文输入法；箭头工具必须同时提供箭头和直线样式。桌面 API 必须继续按需动态获取，保持移动端可加载。不得静默回退到操作系统交互式截图工具，因为这会绕过边框、工具栏和计时状态机；整屏抓取或覆盖层创建失败时必须给出明确错误。

## 验证

代码完成前运行：

```bash
npm run verify
```

这会覆盖完整单元测试、综合回归、文档检查、仓库检查和生产构建。用户可见交互还需要在真实 Obsidian 桌面端手工冒烟；交付时明确说明尚待手工验证的项目。

## 交付

- 代码修复说明实际行为、兼容性、测试结果和仍需手工验证的事项；回答直接、精简。
- 每轮代码修改后必须同步返回三份交付物：完整源码 ZIP、Obsidian 本地测试安装 ZIP、最新 Codex 交接 ZIP；三者使用同一个六位随机数字后缀，不得只发送其中一份或沿用上一轮 Codex。
- 源码 ZIP 根目录固定为 `obsidian-mindmap-studio`，必须包含源码、测试、文档、`manifest.json`、`package.json`、`styles.css` 和重新构建的 `main.js`；排除 `Codex/`、`node_modules/`、`.git/`、临时目录、嵌套 ZIP 和未修改的 `examples/`。
- 安装 ZIP 根目录固定为 `mindmap-studio`，至少包含本轮重新构建的 `main.js`、`manifest.json` 和 `styles.css`。
- 打包前更新 `Codex/项目/obsidian-mindmap-studio.md` 的当前状态、验证基线、待验证事项、下一步和最近交付包；Codex ZIP 根目录固定为 `Codex`，仅包含长期衔接文件，不包含源码、依赖、历史归档和临时内容。
- 每次代码交付的回复必须同时给出三份 ZIP 下载链接和本轮中文 Git 说明；即使用户没有再次提出，也不得省略。

## Git

- 所有 Git 提示使用中文。
- 使用 Conventional Commits：首行 `type(scope): 中文主题`，后续直接以 `- ` 列出真实代码行为、兼容处理、测试、文档、Codex 更新和 `main.js` 重建。
- 只提供中文 Conventional Commits 提交说明，不输出 `git add`、`git commit` 等命令，也不得声称已经实际提交。

## 交付压缩包目录规则

- 完整源码 ZIP 的外部文件名可以包含版本号与六位交付后缀。
- 源码 ZIP 解压后的第一层目录必须固定为 `obsidian-mindmap-studio/`。
- 禁止在 ZIP 内部目录名追加版本号、随机后缀或日期，例如禁止 `obsidian-mindmap-studio-1.35.2/`。
- Obsidian 本地安装包仍按插件安装结构打包，不额外嵌套版本目录。
- 每次交付前必须使用 `unzip -l` 或等价命令检查压缩包第一层目录。
- ZIP 中包含中文文件名或目录名时，必须使用支持 UTF-8 文件名标志的打包方式；交付前检查每个中文条目的 UTF-8 标志及解压后的实际名称，禁止使用会将中文路径写成 CP437 乱码的打包命令。
