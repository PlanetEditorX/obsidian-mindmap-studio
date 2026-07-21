# 更新记录

## 1.5.1

- 为全部 11 个 TypeScript 源码模块添加模块级职责和边界说明。
- 为 376 个命名声明补齐 JSDoc，覆盖类型、接口、类、构造函数、顶层函数和类方法。
- 函数注释说明用途、参数、返回值、状态修改、兼容行为和关键失败路径。
- 对文档解析、模型规范化、富文本、布局、SVG、文章编号、全局搜索、子导图、图床上传、图片镜像、自动保存和撤销链路增加重点说明。
- 新增 `docs/ARCHITECTURE.md`，说明模块分层、加载保存、编辑事务和跨文件服务。
- 新增 `docs/DATA_MODEL.md`，完整说明 `.mindmap` 文档、节点、内容块、富文本、样式、子导图和图片镜像字段。
- 新增 `docs/SPECIAL_FEATURES.md`，详细介绍三模式、只读、文章目录、图床容灾、搜索索引、节点尺寸、渐细连线等特殊功能。
- 新增自动生成的 `docs/FUNCTION_REFERENCE.md`，列出全部函数、方法、类和接口的签名、位置与说明。
- 新增 `docs/DEVELOPMENT.md`，说明注释规范、测试重点、文档生成和发布流程。
- 新增 `npm run docs:generate` 与 `npm run docs:check`；`npm test` 会强制检查源码注释覆盖。
- 本版本不修改 `.mindmap` 数据结构，现有文件无需迁移。

## 1.5.0

- 子导图节点改为整块可点击：点击节点文字或周围空白区域都会直接进入对应子导图，不再要求精确点中文字。
- 子导图节点增加完整悬停和键盘焦点反馈；右键菜单仍可编辑、调整样式和执行其他节点操作。
- 新增全局节点文字对齐设置：左对齐、居中、右对齐。
- 节点编辑窗口新增单节点文字对齐覆盖，可选择跟随全局或独立设置。
- 新增节点宽度和最小高度设置，宽度范围 100–900 像素，高度范围 36–600 像素。
- 选中节点后显示右下角拖动控制点，可直接调整节点大小；双击控制点或右键“恢复节点自动大小”可还原。
- 节点文字根据实际宽度自动换行；加宽后可保持单行，缩窄后自动形成多行。
- 布局计算、连线位置和 SVG 导出同步使用自定义节点尺寸、文字对齐和换行结果。
- 新增尺寸和对齐字段均为可选字段，现有 `.mindmap` 文件无需迁移。

## 1.4.7

- 优化导图模式中子导图标题的鼠标悬停效果。
- 修复子导图标题继承文字块 `width: 100%` 后，悬停背景铺满整行形成灰色横条的问题。
- 子导图链接现在只包裹标题文字本身，不改变节点原有背景、圆角和配色。
- 悬停反馈改为短下划线展开和右上箭头轻微移动；键盘聚焦仍保留清晰但紧凑的可访问性轮廓。

## 1.4.6

- 合并导图模式中的子导图节点标题与进入入口。
- 删除节点下方重复显示的同名“进入子导图”卡片。
- 子导图节点的第一段文字现在直接作为链接，标题末尾显示轻量箭头。
- 点击标题进入子导图；点击节点其他区域仍用于选中，编辑可继续使用双击节点空白区域、F2 或右键菜单。
- 纯图片或无文字的子导图节点使用右上角小型箭头入口，不再生成同名文字。
- 节点高度不再为重复子导图卡片额外预留空间，导图更紧凑。
- SVG 导出以标题末尾箭头表示子导图，不再绘制重复卡片。

## 1.4.5

- 修复节点编辑器中“文章模式不自动编号”复选框被通用输入框样式拉成长条的问题。
- 复选框恢复为固定 16×16 像素的小方框，与说明文字横向居中对齐。
- 该选项独占一整行，并增加轻量边框和背景，窄窗口下也不会变形。

# Changelog

## 1.4.4

- Replaced the parent-map control attached to the root node with a fixed breadcrumb overlay in the upper-left corner of mind-map mode.
- Added a conventional back-arrow button plus “parent › current” breadcrumb text.
- The navigation stays fixed while the canvas pans or zooms and no longer changes the root node's appearance.
- Added responsive truncation, keyboard focus styling, translucent theme-aware background, and mobile sizing.

## 1.4.3
- Replace the abrupt top-right circular parent-return marker with an attached breadcrumb tab on the upper-left edge of the submap root node.
- The tab shows a left arrow and the parent-map title, uses the current root-node theme colors, and truncates long titles without covering the node content.
- In mind-map mode, parent navigation is handled by the root-node tab; outline and article modes continue to use the full-width parent breadcrumb bar.
- The return control stops node selection and drag interactions, supports keyboard focus, and opens the recorded parent node directly.

## 1.4.2
- Remove the unconventional top-right round parent-back button from submap root nodes. Parent navigation now relies on the dedicated top breadcrumb/navigation bar.
- Existing submaps that still contain an auto-generated parent wiki-link on the root node will no longer render that floating dot button.
- Newly created submaps no longer write the parent file link into the root node.

# 更新记录

## 1.4.1

- 修复文章模式中独立子导图节点没有生成编号的问题。
- 子导图节点现在即使没有本地子节点，只要存在 `submap.path` 也会被识别为文章标题。
- 文章编号跨父子导图连续计算：父导图的“第一章”进入子导图后继续为“第一节”，不会重新从章开始。
- 显示模式改为全局记忆；切换模式后，之后打开的所有父导图和子导图保持同一模式。
- 每个 `.mindmap` 文件中旧的 `view.mode` 仅作兼容读取，不再控制打开模式；只读状态仍按文件保存。
- 大纲和文章模式中的子导图入口改为节点标题文字超链接，移除独立“进入子导图”按钮。
- 顶层文章模式新增跨子导图的独立目录页。
- 目录递归收录后代子导图的章节标题，点击可打开对应文件并定位节点。
- 现有父子导图无需重新创建，数据结构版本保持 10。

## 1.4.0

- 新增导图、大纲、文章三种同步显示模式。
- 三种模式共用同一份节点数据，在任意模式修改都会同步到其他模式。
- 工具栏新增模式切换按钮，并可在设置中选择显示哪些模式。
- 新增只读锁，三种模式均可在只读和编辑状态之间切换。
- 只读模式禁用新增、删除、拖拽、粘贴、样式和内容修改，同时保留查看、搜索、链接、缩放及临时展开功能。
- 大纲模式支持层级缩进、直接编辑文字、任务状态、备注和子导图入口。
- 文章模式新增自动目录与层级编号：章、节、一、（一）、1.、（1）。
- 仅有子级的节点参与标题编号；末端节点作为正文，不继续编号也不占用序号。
- 节点新增“文章模式不自动编号”，适合前言、注释、摘要和附录。
- 当前模式与只读状态保存到 `.mindmap` 文件，数据格式升级为版本 10。
- 设置页新增“一键还原所有插件设置”，不会修改脑图原文件。

## 1.3.1

- 修复在父导图中使用 `Ctrl/Cmd + F` 无法搜索独立子导图节点的问题。
- 当前搜索改为递归搜索父导图及其全部后代子导图。
- 搜索打开时按需刷新当前导图族，不需要重新创建子导图，也不需要手动重建整个索引。
- 支持根据父节点的 `submap.path` 和子导图的 `navigation.parentPath` 双向恢复父子关系。
- 从子导图发起搜索时，会自动向上找到最高层父导图，再搜索完整导图树。
- 搜索结果增加完整父子导图层级，例如“古诗 › 唐诗 › 李白”。
- 支持使用多个层级关键词搜索，例如“古诗 唐诗 李白”。
- 搜索索引格式升级为版本 2；旧的平铺索引会自动重建，不影响 `.mindmap` 原文件。
- `Ctrl/Cmd + Shift + F` 继续用于整个仓库的全局搜索。

## 1.3.0

- 新增跨整个仓库的思维导图全局搜索。
- 全量索引所有 `.mindmap` 文件，包括普通子节点、折叠分支和独立子导图。
- 索引节点文字、富文本、备注、标签、链接、表格、代码、图片说明和子导图路径。
- 搜索结果可直接打开目标导图，展开祖先分支并定位到具体节点。
- 新增本地增量索引库 `mindmap-search-index.json`，避免每次搜索重新扫描全部文件。
- 监听脑图的新建、修改、重命名和删除并自动维护索引。
- 新增工具栏按钮、侧边栏按钮、命令面板命令和 `Ctrl/Cmd + Shift + F` 快捷键。
- 设置页新增索引统计、结果数量上限和手动重建按钮。
- 改进跨文件打开后的节点定位，视图尚未完成加载时也会保留待定位节点。

## 1.2.1

- 修复“从粗到细”连线模式在两三层导图中变化不明显的问题。
- 连线宽度改为按当前可见导图的实际最大层级插值：一级连线使用起始粗细，最深层连线达到末端最细宽度。
- 同时写入 SVG `stroke-width` 属性和内联样式，避免部分 Obsidian 社区主题把所有连线覆盖为统一宽度。
- SVG 导出与编辑画布使用相同的实际层级渐细算法。

# Changelog

## 1.2.0

- 新增 10 套可预览、可一键应用的脑图主题模板。
- 主题同时控制背景、中心主题、节点、文字、分支颜色、字体和连线。
- 新增彩色分支：一级分支及其全部后代使用一致的连线和节点边框颜色。
- 新增中心主题背景色与文字颜色设置。
- 连线新增“统一粗细”和“从粗到细”两种模式。
- 渐细连线可设置起始粗细和末端最细宽度。
- SVG 导出和静态预览保留主题、分支颜色及层级线宽。
- 当前脑图外观窗口新增主题预览卡片；插件设置页新增默认主题选择。
- 数据格式升级为版本 9，旧文件可直接读取。
- 旧用户的既有全局配置默认保持统一粗细且不自动开启彩色分支，避免升级后外观突变。

## 1.1.0

- 新增多图床镜像自动故障转移。
- 当前图片地址加载报错或超过设定时间后，按镜像顺序尝试下一个地址。
- 备用地址成功加载后，自动替换为新的主地址并保存脑图。
- 当前镜像失效后，下一次会优先从当前地址之后的镜像继续尝试，再回到更早的镜像，避免重复地址。
- 可选择将本地图片作为所有远程镜像失败后的最后回退。
- 新增 2–30 秒单镜像等待时间设置。
- 镜像记录新增最近成功时间、最近失败时间和失败次数，可向后兼容旧文件。
- 数据格式版本仍为 8，旧 `.mindmap` 文件无需迁移。

## 1.0.0

- 支持配置多个图床。
- 支持粘贴图片后延迟自动上传。
- 支持手动选择一个或多个图床。
- 所有目标图床成功后可安全删除本地图片。
- 新增图床 API 实际上传连通性检测。
