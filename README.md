# MindMap Studio for Obsidian

MindMap Studio 是一个本地优先的 Obsidian 思维导图插件。它使用独立的 `.mindmap` 文件保存数据，并让导图、大纲、文章和通读四种视图共享同一棵节点树。插件支持富文本、图片、表格、代码、子导图、全局搜索、主题、导入导出和只读模式。

最低 Obsidian 版本：`1.5.0`。

## 功能概览

### 四种同步视图

- **导图模式**：可缩放画布、分支布局、拖放重组、节点尺寸、折叠与多选。
- **大纲模式**：按层级编辑标题、备注、任务、图片、表格和代码。
- **文章模式**：将当前物理导图呈现为带编号、目录和章节导航的文档。
- **通读模式**：按父子导图关系连续合并章节，适合整本阅读。

任一视图中的修改都会写回同一份 `MindMapDocument`，不会产生四套独立内容。

### 节点与内容

- 有序混合内容块：文字、图片、表格和代码可通过独立手柄在节点内排序或跨节点移动；右键只删除鼠标所在块。
- 文章编辑工具栏可显式选择“作为块移动”或“作为节点移动”：当前块追加到目标节点末尾，当前节点则完整插入到目标节点之后。
- 富文本：加粗、斜体、下划线、删除线和文字颜色。
- 任务、标签、备注、链接、图标、表格和代码块；代码块在导图、大纲、文章和通读中共用同一渲染链路，行号与语法高亮代码保持逐行对齐，导图节点会随代码展开/折叠重新计算高度。
- 节点内容编辑器使用有序内容块作为权威数据；删除表格块或代码块后会同步清理旧版兼容字段，保存并重开不会恢复已删除内容。
- 完整节点编辑器中 Enter 保存并关闭，Shift+Enter 插入换行；输入法候选确认不会触发保存。
- 单节点和多节点复制、粘贴、删除及拖放。
- 撤销、重做、只读锁和自动保存。
- AI 助手：支持问答、经预览确认的 AI 节点重整、按范围顺序识别全部图片，以及完全离线的本地文字替换；范围可选当前页面或右键节点子树。

### 父子导图

节点可以关联独立 `.mindmap` 文件。子导图保存父文件路径、父节点 ID 和父标题，父导图保存子文件引用，从而支持：

- 从节点创建或提取子导图。
- 在父导图和子导图之间导航。
- 父文件或子文件重命名后的引用维护。
- 将子导图内容合并回父导图。
- 跨父子导图的文章目录与全局搜索。

### 图片与图床

- 粘贴或选择本地图片后写入当前导图附近的资源目录。
- 支持多个 HTTP(S) 图床端点、JSON 请求头、`multipart/form-data` 或原始二进制请求体，并可为图床设置图片加载优先级。
- 可配置响应字段路径，并兼容常见 `data.url`、`result.url` 等结构；粘贴或截图图片默认在本地保留 1 分钟，可设置 0–120 分钟，期间可直接进行 AI 识图；到期或下次打开导图发现已到期时自动上传并保留可达图床 URL。
- 远程镜像与本地源并存；节点渲染和点击放大图片会先尝试优先级最高的可用图床地址，失败后再尝试下一个；仅在所有选定图床上传成功且确认没有其他引用时，才允许删除本地文件。
- 文件名、扩展名、MIME、请求头和返回 URL 经过独立工具层校验。
- 图片右键可运行 AI 视觉识图或本机 Tesseract OCR；AI 识图可跟随全局接口或单独指定视觉模型，模型角色标记等无效输出会在预览前清理。识别后可选择直接后台确认、5/10/15 秒后自动确认或手动确认；替换会保留原位置，并安全删除不再被引用的本地图片。
- 工具栏和可配置的编辑器截图快捷键可启动系统区域截图；编辑器默认快捷键为 `Ctrl/Cmd+Shift+S`，行内编辑文字时同样可用。可选自动最小化 Obsidian、插入截图前聚焦的节点/段落、仅复制到剪贴板或插入后自动识图。

### AI 助手

- 内置 OpenAI、DeepSeek、硅基流动、FreeLLMAPI 和自定义 OpenAI 兼容接口配置。
- 硅基流动预设提供 DeepSeek V4 Flash、DeepSeek V4 Pro、DeepSeek OCR、GLM-4.5V 和 GLM-5.2 模型建议；FreeLLMAPI 默认使用 `auto` 路由。
- 每个接口卡片提供“检测接口”按钮，以最小提示词验证地址、鉴权、模型和响应格式，不发送导图正文。
- 工具栏按钮与 `Ctrl/Cmd+Shift+A` 默认询问当前页面。
- 节点右键可仅发送该节点及全部子节点；页面空白处右键恢复整页范围。
- 发送前显示节点数、字符数和 UTF-8 大小；超过设置上限时禁止请求，不静默截断。
- AI 窗口提供问答、AI 整理并重新生成、图片识图和本地文字替换四种模式；识图按节点树顺序处理当前页面或右键节点子树中的全部图片，并可使用独立视觉接口避免纯文本默认模型拒绝图片请求。
- 询问问题与 AI 编辑要求分别保存草稿；切换到 AI 编辑时自动填入整理层级、合并重复节点的默认要求。
- AI 编辑先生成完整 Markdown 提案并显示节点数量和内容预览，用户确认后才替换页面或节点子树，并可撤销。
- 本地替换不联网，可在相同范围内替换节点文字、备注和表格，同时避开链接、代码、图片地址和子导图路径。
- 询问窗口显示“转换 Markdown、上传上下文、模型处理、接收结果”处理轨迹并渲染 Markdown 回答。

详细配置、安全边界和操作方式见 [docs/AI_ASSISTANT.zh-CN.md](docs/AI_ASSISTANT.zh-CN.md) 与 [docs/IMAGE_RECOGNITION_SCREENSHOT.zh-CN.md](docs/IMAGE_RECOGNITION_SCREENSHOT.zh-CN.md)。

### 搜索、导入与导出

- 本地增量索引与全局搜索、正则匹配和替换。
- Markdown、缩进文本、剪贴板分支和新版 XMind 导入。
- Markdown、HTML、SVG 及文章内容导出；文档导出始终按通读全文合并，目录层级跟随文章目录设置，子导图目录项会跳到对应章节；Markdown 使用普通标题链接，Word 生成带内部书签的 .docx，PDF 在桌面端直接保存到所选位置。
- Markdown 阅读模式中的静态导图预览。

## 安装

### 手动安装

1. 创建目录：

   ```text
   <你的仓库>/.obsidian/plugins/mindmap-studio/
   ```

2. 将以下三个文件复制到该目录：

   ```text
   main.js
   manifest.json
   styles.css
   ```

3. 重启 Obsidian，或重新加载插件列表。
4. 在“设置 → 第三方插件”中启用 **MindMap Studio**。
5. MindMap Studio 设置页支持折叠分区与顶部快速搜索，可直接输入设置名称、说明或接口名定位选项。

### 从源码构建

```bash
npm ci
npm run verify
```

构建完成后，仓库根目录的 `main.js`、`manifest.json` 和 `styles.css` 即为安装文件。生产构建不会内嵌 source map；若合并时 `main.js` 冲突，应先合并 `src/` 源码，再执行 `npm run build` 重新生成它。

## 基本使用

### 新建导图

通过左侧功能区的脑图按钮、命令面板中的“新建思维导图”，或文件夹右键菜单创建 `.mindmap` 文件。

### 切换视图

使用工具栏或命令面板切换导图、大纲、文章和通读模式。四种模式共享同一个“当前阅读节点”：

- 在导图中点击节点后切换模式，目标模式会聚焦同一节点。
- 在大纲、文章或通读中滚动到某一段后切换模式，会按视口锚点定位对应节点。
- 进度按文章族顶层文件持久化，关闭视图、重启 Obsidian 或重新打开文件后继续恢复。
- 通读位置属于子导图时，切换到导图、大纲或文章会自动打开对应子导图。
- 节点被删除时依次回退到父节点；子导图不存在时回退到父导图的挂载节点。

导图、文章和通读可作为下次启动模式。大纲只在当前会话同步，不会成为插件重启后的默认模式。

### 创建子导图

在节点操作中选择创建或提取子导图。文件默认保存到：

```text
父导图所在目录 / MindMap Assets / 父导图文件名 / 子导图.mindmap
```

资源目录名称可在插件设置中修改。

### 配置图床

插件设置的“管理配置”分类提供“导出配置”“导入配置”和“恢复初始配置”：可将全局设置（包括图床和 AI 接口）保存为 JSON 并在另一台设备恢复；导入或恢复只影响插件设置，不会修改任何 `.mindmap` 文件。

截图快捷键使用按键录制：点击设置框后按下单键，或包含 Ctrl、Shift、Alt 的两键、三键组合，即可立即保存。

图片识图转文字后，所在节点默认左对齐。包含多个文字块或图片块的节点可直接双击目标文字块进行行内编辑；双击图片块会打开并高亮对应的完整编辑卡片。

空节点截图后再进行 AI/OCR 识图时，识别结果会填入原有的第一个空文字块，不会额外留下空白文字块。

在插件设置中添加图床配置，并填写：

- 上传端点，必须是 HTTP 或 HTTPS URL。
- 请求方法：`POST` 或 `PUT`。
- 请求体：`multipart/form-data` 或原始二进制。
- 文件字段名。
- JSON 请求头。
- 返回图片 URL 的字段路径。
- 加载优先级：数值越小越优先，用于节点图片渲染和点击放大时的故障转移顺序。

建议先使用“测试连接”验证认证、请求格式和响应解析，再启用自动上传。

## 数据与隐私

- `.mindmap` 文件是唯一事实来源。
- 搜索索引是可重建缓存，不替代原始文件。
- 插件默认在本地读写 Obsidian 仓库。
- 只有配置并触发图床上传时，图片数据才会发送到用户指定的服务。
- 只有用户在 AI 窗口点击发送后，所选范围的 Markdown 才会发送到用户指定的 AI 服务。
- 图床和 AI 凭据保存在 Obsidian 插件设置数据中；请勿把包含真实令牌的设置文件提交到 Git。

数据结构详见 [docs/DATA_MODEL.md](docs/DATA_MODEL.md)。

## 仓库结构

```text
src/
├── main.ts                    插件入口与跨文件服务
├── view.ts                    Obsidian TextFileView
├── core/                      数据模型与节点树
├── editor/                    导图、大纲、文章编辑器
├── ai/                        AI 配置、Markdown 上下文、协议客户端与窗口
├── article/                   文章编号、目录与阅读结构
├── render/                    布局、碰撞与静态渲染
├── search/                    本地搜索索引
├── import/                    导入与导出
├── utils/                     无 Obsidian 依赖的纯工具
├── settings.ts                设置模型与设置页
└── themes.ts                  主题预设

tests/                         独立纯函数单元测试
scripts/test.mjs               既有综合回归测试
scripts/check-docs.mjs         JSDoc 与文档完整性检查
scripts/check-repository.mjs   仓库结构与发布元数据一致性检查
```

更完整的模块职责与数据流见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 开发与验证

要求 Node.js 20 或更高版本。

```bash
npm ci
npm run dev             # 监听构建
npm run test:unit       # 显示模式、阅读位置、文件名、图床与 AI 纯工具测试
npm run test:regression # 综合模型、布局、导入、搜索和样式回归
npm run test:docs       # 模块头与声明 JSDoc 检查
npm run test:repo       # 仓库清洁度和发布元数据一致性
npm run build           # 类型检查与生产构建
npm run verify          # 完整验证入口
```

提交前应执行：

```bash
npm run verify
```

测试设计与覆盖范围见 [docs/TESTING.md](docs/TESTING.md)。

## 发布

发布包只包含：

```text
mindmap-studio/
├── main.js
├── manifest.json
└── styles.css
```

版本号以发布元数据为准，必须在 `package.json`、`package-lock.json`、`manifest.json` 和 `versions.json` 中保持一致；README 不再硬编码当前源码版本。分支、提交、标签和回滚流程见 [docs/GIT_WORKFLOW.zh-CN.md](docs/GIT_WORKFLOW.zh-CN.md)。

## 文档

- [AI 助手](docs/AI_ASSISTANT.zh-CN.md)
- [图片识图、OCR 与截图](docs/IMAGE_RECOGNITION_SCREENSHOT.zh-CN.md)
- [架构说明](docs/ARCHITECTURE.md)
- [数据模型](docs/DATA_MODEL.md)
- [特殊功能实现](docs/SPECIAL_FEATURES.md)
- [四模式阅读进度同步](docs/READING_PROGRESS_SYNC.zh-CN.md)
- [开发指南](docs/DEVELOPMENT.md)
- [测试策略](docs/TESTING.md)
- [完整项目说明](docs/PROJECT_GUIDE.zh-CN.md)
- [维护与优化说明](docs/MAINTENANCE_GUIDE.zh-CN.md)
- [Git 工作流](docs/GIT_WORKFLOW.zh-CN.md)
- [AI 助手 Git 交付](docs/GIT_DELIVERY_AI_ASSISTANT.zh-CN.md)
- [本次 Git 交付说明](docs/GIT_DELIVERY.zh-CN.md)
- [函数参考](docs/FUNCTION_REFERENCE.md)
- [代码块渲染重构与排查说明](docs/CODE_BLOCK_RENDERING.zh-CN.md)
- [代码清理与当前支持边界](docs/CODE_CLEANUP.zh-CN.md)
- [更新记录](CHANGELOG.md)

## 许可证

本项目使用 [MIT License](LICENSE)。
