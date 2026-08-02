# Test Results

版本：1.39.6

- 单元测试：284 / 284 通过
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过（53 个源码模块、1061 个具名声明）
- 仓库检查：通过
- 生产构建：通过，`main.js` 已重新生成

本轮专项验证：

- 根据 Win10 截图确认：阅读态圆圈与正文正常，进入快速编辑后正文输入框新增 7px 顶部内边距，但生成序号仍使用阅读态 `top`，因此圆圈相对正文偏高。
- 修复仅作用于带圈编号的 `::before`：快速编辑时将圆圈的垂直位置增加现有 7px 顶部内边距；正文输入框的 padding、margin、宽度、正文起点和水平缩进均未修改。
- 阅读态、顶格/自动对齐、圆圈尺寸、数字字号、右侧间距、两位数编号和多行悬挂缩进保持 1.39.5 行为。
- 新增 CSS 契约：圆圈下移量必须等于编辑框块级顶部内边距，且快速编辑修正规则不得包含 padding、margin 或水平 inset。
- 文章缓存 DOM 结构未变化，继续使用 `article-node-cache-v4`；升级后无需清理缓存。

交付包验证：

- 源码 ZIP 第一层目录固定为 `obsidian-mindmap-studio/`，排除 `node_modules/`、`.git/`、临时目录、嵌套 ZIP 和本轮未修改的 `examples/`。
- 安装 ZIP 第一层目录固定为 `mindmap-studio/`，只包含 `main.js`、`manifest.json` 和 `styles.css`。
- Codex ZIP 第一层目录固定为 `Codex/`，外部文件名严格使用 `Codex-1.39.6-handoff-359116.zip`。
- Codex ZIP 的中文目录和文件名使用标准 UTF-8 主文件名和 general-purpose bit 11；Linux Info-ZIP 实际解压后不得存在字面量 `#Uxxxx`。
- 安装 ZIP SHA-256：`3f933d30d42ec1d40a22d36ad8368d5aaae13bec90d9fb31edb1c860ff647fa1`，已写入 `update.json`。

仍需真实 Obsidian 手工验证：

- 在截图对应的 Win10 文档中进入快速编辑，确认圆圈与正文首行垂直居中，同时正文输入框位置、宽度和文字起点与 1.39.5 完全一致。
- 分别检查 1 位、2 位编号以及自动/顶格模式；退出快速编辑后阅读态位置应保持不变。
