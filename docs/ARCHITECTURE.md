# MindMap Studio 架构说明

## 1. 设计目标

MindMap Studio 是一个本地优先的 Obsidian 思维导图插件。核心设计原则如下：

1. `.mindmap` 文件是唯一事实来源，搜索索引、静态预览和界面状态都不能替代原始文件。
2. 导图、大纲、文章和通读四种模式共用同一棵节点树，任何模式中的修改都必须同步到其他模式。
3. 所有不可信输入都必须经过模型层规范化，包括磁盘文件、Markdown、剪贴板 JSON 和子导图元数据。
4. 用户编辑必须经过统一的撤销、重做和自动保存链路。
5. 跨文件功能集中在插件服务层，编辑器不直接自行读写仓库文件。
6. 仓库只维护当前公开数据结构；格式变更必须明确提升数据版本并提供独立转换工具。

## 2. 模块分层

```text
src/
├── main.ts / view.ts           插件入口、Obsidian 视图与跨文件服务
├── core/
│   ├── model.ts                数据模型、规范化与序列化
│   └── node-tree.ts            节点树遍历、查找与结构移动
├── editor/
│   ├── editor.ts               导图/大纲/文章 UI 与节点操作
│   ├── editor-types.ts         宿主服务契约
│   ├── editor-modals.ts        编辑器弹窗
│   ├── content-modals.ts       表格与代码弹窗
│   ├── clipboard-import.ts     剪贴板分支解析
│   ├── drag-drop.ts            拖放合法性与落点计算
│   ├── history-manager.ts      有界撤销与重做快照
│   ├── node-actions.ts         节点结构与状态操作
│   ├── outline-renderer.ts     大纲模式递归渲染
│   ├── article-renderer.ts     文章目录、正文与分页渲染
│   ├── rich-text-dom.ts        富文本 DOM 转换
│   ├── node-image-actions.ts   节点图片操作
│   ├── node-rich-text-editor.ts 节点富文本编辑
│   └── selection-format-toolbar.ts 文章/大纲选区悬浮格式栏
├── article/
│   ├── modes.ts                文章结构、编号与阅读分段
│   ├── display-mode.ts         启动模式和会话持久化规则
│   ├── reading-location.ts     跨模式、跨文件语义阅读位置
│   ├── render-window.ts        文章 5 KB 首屏窗口与边缘扩展范围
│   └── article-style.ts        文章与通读共用的阅读样式解析
├── render/
│   ├── layout.ts               坐标、连线与 SVG
│   ├── collision-layout.ts     节点碰撞检测与子树避让
│   ├── code-block.ts           四模式共享代码块展示与行号 DOM 布局
│   └── static-render.ts        Markdown 阅读模式静态预览
├── search/
│   └── global-search.ts        本地增量索引与搜索
├── import/
│   └── import-export.ts        XMind 多画布/图片/公式导入与文章导出
├── utils/
│   ├── coalesced-json-writer.ts 连续 JSON 保存请求的合并与串行写入
│   ├── filename.ts             文件名、扩展名、时间戳与 MIME
│   └── image-host.ts           图床端点、Header、multipart 与响应解析
├── file-explorer-filter.ts     文件浏览器筛选规则编译与语义签名
├── settings.ts                 设置与默认值
└── themes.ts                   主题预设
```

辅助模块：

- `src/settings.ts`：插件设置、默认值、主题同步和设置页；一级分类展开列表持久化在插件配置中，搜索产生的临时展开不写入记忆。
- `src/themes.ts`：内置主题预设。
- `src/article/article-style.ts`：文章与通读共用的阅读样式预设和纯样式解析，不依赖编辑器 DOM。
- `src/editor/editor-types.ts`：编辑器回调与运行参数契约，隔离插件服务和 UI 实现。
- `src/core/latex.ts`：纯函数解析公式分隔符、恢复历史重复美元、判断行内/独立布局，并在渲染前把裸露中文标签转换为 MathJax 可识别的 `\text{...}`。
- `src/editor/rich-text-dom.ts`：富文本运行段与 `contenteditable` DOM 的双向转换，以及 MathJax 渲染。公式先合并全部运行段再解析，因此分隔符跨颜色或加粗边界仍有效；查看态渲染公式，编辑态暂时显示源码，异步 MathJax 回调不得覆盖仍为 `contenteditable=true` 的活动编辑器。
- `src/editor/editor-modals.ts`：图片预览、图床选择、公式编辑、统一导入与导出、Markdown 大纲等弹窗；阅读样式已并入编辑器的统一“主题与外观”面板。
- XMind 归档先由 `xmindToImportResult()` 解析主题树、跨画布链接、公式和资源令牌；同名画布挂载通过 `mergeLinkedXMindSheetRoot()` 合并被链接根主题的非标题内容、备注和后代，避免深层画布根图片因只拼接子节点而丢失。`ImportExportModal` 再通过宿主图片保存回调把每个归档资源保存一次，最后由 `materializeXMindImages()` 原位改写所有图片块的 `source/localSource`。纯解析调用 `xmindToDocument()` 时使用数据 URL 自包含回退，避免资源静默丢失。
- `src/editor/clipboard-import.ts`：剪贴板 JSON、Markdown、缩进文本和 HTML 列表的单节点或有序多节点分支解析。
- `src/editor/node-image-actions.ts`：节点图片选择、本地保存、图床上传和远程镜像合并。
- `src/editor/node-rich-text-editor.ts`：节点文字块的选区样式、颜色、格式清理和实时预览。
- `src/editor/selection-format-toolbar.ts`：文章和大纲模式内联编辑时随文字选区显示的加粗、斜体、下划线及颜色工具栏。
- `src/editor/content-modals.ts`：表格、代码编辑弹窗。
- `src/render/code-block.ts`：解析节点/页面/全局代码设置，调用 Obsidian Markdown 高亮，并为四种显示模式安装统一的真实 DOM 行号栏。
- `src/render/static-render.ts`：Markdown 阅读模式中的只读 SVG 预览。
- `src/utils/coalesced-json-writer.ts`：将短时间内连续保存请求合并为最新快照，严格串行调用持久化回调，并让每个等待方只在其版本落盘后完成。
- `src/utils/filename.ts`：跨平台文件名、扩展名、时间戳与图片 MIME 的纯函数。
- `src/utils/image-host.ts`：不依赖 Obsidian 的图床输入校验、multipart 构造、响应 URL/删除令牌提取、SHA-256 计算和删除模板替换。
- `src/file-explorer-filter.ts`：预编译资源目录、后缀和隐藏目录规则，并生成稳定语义签名，供插件层判断是否需要重新扫描文件浏览器。
- `styles.css`：编辑器、四种模式、弹窗、搜索、尺寸手柄和响应式样式。

## 3. 文件加载与保存流程

### 3.0 插件设置保存

所有插件级设置变更统一进入 `CoalescedJsonWriter`。首轮写入采用 35 ms 尾随窗口吸收连续 UI 事件；真正写入时获取最新 JSON 快照，写入期间出现的新版本在当前写入结束后立即追加，禁止多个 `saveData()` 并发执行。设置导入、重置等调用仍可 `await saveSettings()`，并只在包含自身请求版本的快照完成后继续。插件卸载时刷新待写版本。

文件浏览器筛选的 DOM 扫描与普通设置保存、仓库文件写入事件解耦。布局初始化或筛选配置的规范化语义签名改变时执行完整扫描；平时由 MutationObserver 只收集文件浏览器内新增的 DOM 子树和 `data-path` 变更目标，合并嵌套根节点后局部应用规则。创建、修改、删除或重命名文件本身不再直接安排全树扫描，文件浏览器实际 DOM 更新会触发对应局部处理。每一批仍只编译一次规则。

### 3.1 打开文件

```text
Obsidian 读取文本
→ MindMapStudioView.setViewData()
→ parseDocument()
→ normalizeDocument()
→ MindMapEditor.setDocument()
→ 当前全局模式渲染
→ 异步刷新文章父子上下文
```

`parseDocument()` 支持两种当前输入：

- 原始 JSON。
- `mindmap-json` Markdown 围栏。

解析失败不会让视图崩溃，而是返回安全默认文档。

### 3.2 保存文件

```text
用户操作
→ MindMapEditor.mutate()
→ 写入撤销栈
→ 修改同一份 MindMapDocument
→ callbacks.onChange()
→ 结构变化执行 render()；纯文字提交执行局部 DOM 刷新与必要测量
→ TextFileView 自动保存
→ getViewData()
→ serializeDocument()
```

`serializeDocument()` 在输出前再次规范化数据，确保磁盘中不会残留临时 DOM 状态、无效颜色、非法尺寸或不完整节点。

视图保存前会比较当前中心节点纯文本标题与最近一次加载/保存的标题。只有标题本身发生变化时才调用 `syncMindMapTitleToFilename()`；表格列宽、样式或正文编辑不会因为文件名原本与标题不一致而触发隐式重命名。这样可避免保存时物理文件路径变化使文章族阅读位置进入跨文件回退链。

### 3.3 代码块渲染流程

```text
导图 editor.ts / 大纲 outline-renderer.ts / 文章与通读 article-renderer.ts
→ MindMapEditorCallbacks.onRenderCode
→ MindMapStudioView
→ render/code-block.ts::renderCodeBlock()
→ 解析节点、页面、全局设置与自动阈值
→ Obsidian MarkdownRenderer 生成 pre > code 与语法高亮 token
→ installCodeLineNumberLayout() 插入真实行号栏并共享计算样式
```

四种模式只负责提供代码块容器，不分别计算行号。`renderCodeBlock()` 保留 Obsidian 生成的完整 `code` 及 token 子元素；启用行号时，在同一 `pre` 内把 `span.mms-code-line-numbers` 插入到 `code.mms-code-content` 前。两栏共享运行时捕获的字体度量与上下内边距，横向溢出由代码块自身滚动，避免父容器样式覆盖。该结构不依赖伪元素、绝对定位或基线常量，具体不变量见 [代码块渲染说明](CODE_BLOCK_RENDERING.zh-CN.md)。

## 4. 编辑事务与历史记录

大多数可撤销编辑通过 `MindMapEditor.mutate()`：

1. 克隆修改前文档并压入 `history`。
2. 清空 `future`，避免分叉历史错误复用。
3. 执行调用方提供的修改函数。
4. 同步有序内容块与节点派生摘要字段。
5. 结构变化重新渲染当前模式；纯文字提交通过 `mutateInlineText()` 保留现有 DOM，只更新当前节点并安排必要的尺寸测量。
6. 通知视图保存。

文章表格列宽拖动是一个受限例外：拖动过程中 DOM 已实时反映最终结果，释放鼠标后 `updateTableColumnWidths()` 直接捕获历史、更新稳定表格块、通知保存并保留现有 DOM，不调用 `render()`，同时通过 `refreshArticleContext: false` 阻止视图层延迟重建文章族上下文。边界调整由 `resizeAdjacentTableColumns()` 同时修改当前列与右侧列，总宽度不变；渲染器把保存值转换为百分比列宽，表格继续适配当前页面。该例外仍保留撤销和自动保存，只跳过会造成文章闪烁与阅读位置竞争的同步整页重建。

不应在 UI 事件中直接修改 `this.document` 后绕过 `mutate()`，否则会产生以下问题：

- 无法撤销。
- 大纲、文章和导图不同步。
- 搜索索引可能读取到旧值。
- 自动保存提示不准确。

只读模式在进入写操作前由 `ensureEditable()` 统一阻止。

## 5. 四种显示模式

### 导图模式

- 使用 `computeLayout()` 计算节点坐标。
- 连接线与节点位于同一可缩放画布。
- 支持拖拽重组、平移、缩放、尺寸手柄和整节点子导图入口。
- `computeLayout()` 在真正进入导图模式时同步生成全树权威坐标和连接线；编辑器构造阶段不再预计算一次无用布局。单次布局通过 `WeakMap` 复用每个节点的子树高度，避免深层树重复递归；`incremental-render.ts` 只改变节点 DOM 的挂载顺序，不改变布局结果。
- 节点优先级为当前节点、当前兄弟、父节点、父节点兄弟及更高祖先；之后按当前视口、前后相邻一个视口、其余区域排序。每批在短帧预算内执行，并通过 `requestAnimationFrame()` 让出主线程。

### 大纲模式

- 递归按层级缩进。
- 直接编辑标题、备注和结构。
- 子导图节点标题本身作为链接，不显示重复按钮。
- 节点标题下显示额外文字块、图片缩略图、可滚动表格、代码预览和备注；大型内容使用局部滚动，避免破坏整体层级浏览。
- 纯表格、纯代码或纯图片节点不生成空标题行，内容区域本身承担选择和双击编辑入口。
- 内容区域只继承节点容器的一次层级缩进，不再按深度重复偏移；纯内容节点使用更紧凑的左边距。

### 文章模式

- 使用 `resolveArticleNumbering()` 统一解析自动、关闭和手动层级，再由 `buildArticleNodeInfo()` 生成正文节点信息。
- 文章上下文准备完成后，`renderArticleMode()` 先由 `buildArticleNodeInfo()` 建立轻量章节顺序，再通过 `render-window.ts` 计算目标节点前后各约 5 KB 的左闭右开窗口；只为该范围创建真实章节 DOM。接近顶部或底部时，控制器分别调用 `loadBefore()` / `loadAfter()` 再扩展约 5 KB。
- `MindMapDocumentView` 在打开文件时先将 `articleContextReady` 置为 `false`；文章编辑器只绘制与目标落地类型一致的目录或正文骨架，禁止在跨文件父子上下文未完成时用当前物理文件提前生成一次正文。上下文成功后一次性提交目录、分页与阅读快照；失败时回退当前文件上下文并显式结束准备态。
- 跨文件章节打开由插件在 `setViewState()` 前把 `filePath + nodeId` 写入短生命周期队列；新 `MindMapDocumentView.setViewData()` 创建编辑器前同步消费该目标，并在首次上下文刷新前调用 `focusNodeById()`。因此第一份真实章节信息直接使用目标节点，不会先用子文件根标题配合父章节编号绘制中间状态。显式节点目标不依赖 `showArticleToc`：只要队列或编辑器仍持有目标节点，目录落地配置就不能把本次导航改回目录。
- 需要入口反馈时，编辑器先挂载固定尺寸的 `.mms-article-entry-skeleton`，通过双 `requestAnimationFrame()` 确保骨架实际绘制后再调用 `renderArticleMode()`。骨架只存在于文章滚动容器内，不覆盖页面、不模拟章节高度；快速导航或切换模式会用令牌和帧取消旧任务。系统启用 `prefers-reduced-motion: reduce` 时跳过该绘制门。
- 向上插入前文时，编辑器记录扩展前后的 `scrollHeight` 差值并补偿 `scrollTop`，保持当前章节在屏幕中的位置。自动或手动扩展先让边缘按钮绘制一帧 `is-loading` 流光，再挂载约 5 KB 真实节点；新节点仅做短时淡入，不遮挡已显示内容。窗口移动和扩展后重新绑定章节折叠、缩略导航、选中状态与文章块移动 UI。
- 语义恢复在查询 DOM 前调用 `ensureNode(nodeId)`；目标不在窗口时直接围绕该节点重建窗口，再使用文档标题或 `.mms-article-node[data-node-id]` 精确定位。若入口骨架仍在绘制，`restoreReadingLocation()` 会把目标暂存到 `pendingArticleFocusLocation`，待真实窗口挂载后再执行，避免骨架阶段查询失败。从文章暂时切到导图或大纲再返回时，当前节点会在文章重绘前成为显式 `pendingArticleFocusLocation`，避免旧文章 DOM 的像素滚动值抢占语义目标；恢复事务存续期间也不会触发窗口边缘自动扩展。顶层目录的同文件章节直接调用 `focusNode()`，不经过文件重开；跨文件导航继续传递 `filePath + nodeId`。
- 文章位置采集使用模式专属选择器，只扫描 `.mms-article-document-title[data-node-id]` 与 `.mms-article-node[data-node-id]`。`.mms-article-page` 即使保存根节点 ID 也不参与当前位置判断，锚点恰好位于章节边界时采用下一个真实章节，避免把页面空白误记为根节点并在刷新后回到页首。
- 每次 `restoreReadingLocation()` 建立带递增令牌的“最后一次导航独占”事务；新事务会取消旧定时器、动画帧和 `ResizeObserver`，异步 `setOptions()` 重绘优先保留活动事务的精确 `ReadingLocation`。目标到位后，布局观察最多维持 5 秒，页面因图片、表格、代码或字体晚到而改变高度时重新应用同一语义锚点；滚轮、指针、触摸及 PageUp/PageDown/Home/End/方向键输入会立即取消事务。普通内容重绘仍保存并恢复当前语义位置。
- `MindMapEditor.setDocument()` 在物理文件变化时先取消上一文件的恢复定时器、动画帧、窗口扩展与布局观察，再原子提交新文档和新文件路径选项；旧事务不能在新 DOM 已挂载后继续写入 `scrollTop`。
- 章节重量只读取已规范化的原始文字、代码、表格等字段；不会在首屏前为全部节点执行内容块规范化或整节点 `JSON.stringify()`。实际挂载节点的内容块仍在当前渲染窗口内用 `WeakMap` 规范化一次。运行时不保存或恢复节点级 HTML 缓存。
- 异步文章族上下文刷新通过 `setOptions(..., true)` 标记来源。文章、导图和大纲仅更新阅读上下文；只有文章目录层级、目录项或分页导航发生变化时才重建当前文章，通读模式因渲染跨文件内容仍完整刷新。 `buildArticleContext()` 为每次刷新建立文件级文档缓存，并预先写入当前编辑器文档；遍历父子导图再次遇到当前物理文件时必须复用这份内存快照，避免编号或外观修改在合并保存完成前被旧磁盘内容覆盖。该构建器通过 `ArticleContextProgress` 回调上报阶段；编辑器仅在 `showArticleContextProgress=true` 且当前为文章/通读模式时挂载右下角浮层，默认关闭，100% 后自动清理。
- “返回上一级”、顶部父级导航和键盘 `Esc` 都传递父导图路径与父挂载节点 ID。插件打开目标前会校验该 ID 是否仍存在；缺失、过期或来自旧元数据时，读取来源子导图的父级关系，并按子导图规范路径在目标父导图节点树中反查真实挂载节点。无法反查时仍打开父导图根节点并提示目标已不存在。
- 自动模式把有子节点或关联子导图的节点视为自然标题；同级存在自然标题时，末端节点也按同级标题处理。手动模式只覆盖最高层级，不强制孤立末端节点标题化。
- `articleChildStartLevel()` 让中心节点的手动最高层级直接成为一级子节点层级，并处理跨子导图续接。`isDocumentArticleNumberingDisabled()` 单独解释根节点的 `none`：结构层级继续推进，但当前物理导图内的正文标签、目录标签、末端自动序号和子文章页标题编号统一为空；当该文件位于文章族上层时，`ReadingSection.numberingDisabled` 与文章导航状态把关闭语义继续传给全部挂载后代。普通节点的 `none` 仍由 `resolveArticleNumbering()` 作为单节点跳号处理。
- `ArticleTocEntry.depth` 保存编号层级，`tocDepth` 保存目录相对结构层级；目录最大深度、缩进和通读目录过滤只读取 `tocDepth`，避免自定义编号起点导致目录为空。
- `MindMapDocumentView.articleTocMaxDepth` 是可选的文件级目录深度覆盖；`resolveArticleTocMaxDepth()` 先读取当前脑图覆盖，再回退到插件全局设置，并统一供文章模式与通读模式使用。
- 同级编号按有效文章层级分别计数，目录、正文、通读和导出不得各自实现另一套规则。通读正文按 `filePath + nodeId` 复用递归目录中的层级和标签；标题编号与富文本标题使用独立 DOM 子元素，富文本重绘不得清空编号。标题编号样式只覆盖 1–8 级；更深结构继续参与标题树和目录深度计算，但不再循环复用 `A.` / `（A）`。第 7、8 级同级数量超过 26 时使用 AA、AB 等无冲突字母序号。末端正文达到阈值后可选择沿用下一层标题编号，或使用独立的带圈数字：`circledNumberLabel()` 仍为纯文本输出提供 1–50 的 Unicode `①–㊿` 与 51+ 可读回退；文章、通读和 HTML 从 `leafNumberingIndex` 取十进制数字并对全部序号使用同一 CSS 圆环，避免操作系统替换字形造成尺寸和基线差异。该样式不受八级标题编号边界限制。
- 所有正文段落统一使用 `2em` 首行缩进，不根据当前窗口下是否换行动态改变；标题和备注不缩进。代码、表格和图片不改变自身内容缩进，但其内容块整体左边缘与正文首行对齐，避免混排时出现中间过宽的视觉轮廓。文章表格固定为当前内容块的 100% 宽度，保存列宽按比例应用，单元格允许长内容断行且外壳隐藏横向溢出。文章正文内粘贴图片会先提交正在编辑的文字块，再将图片作为该块之后的有序内容块保存，避免浏览器临时图片在重绘后消失。
- 文章行内文字的公式生命周期固定为“查看态渲染 → 聚焦时还原源码 → 保存或取消失焦后立即重新渲染”。`makeInlineEditable()` 不得在初始化阶段把已挂载的 MathJax DOM替换成源码，也不能只更新模型而等待翻页或整页重绘。行内公式与普通文字共享同一文字块；独立公式仍用 `$$...$$` 表示。
- 题目编辑器通过同一个 `FormulaEditModal` 向题干、选项、答案和解答插入 `$...$` 或 `$$...$$`，并用 `renderRichTextRuns()` 即时预览。编辑器保存前必须剥离用户粘贴源码自带的美元分隔符，避免再次包裹。双美元公式只有在整个文字块仅包含该公式时才使用独立布局；与说明文字共存时按行内公式恢复。行内公式必须同时覆盖公式外层与 MathJax `mjx-container` 的块级默认样式，保持自适应宽度和行内基线；裸露中文标签只在渲染副本中转换为 `\text{...}`，模型源码不改写。题库练习模块通过注入的 `renderRichText` 回调复用渲染器，避免纯逻辑测试图直接依赖 Obsidian DOM 模块。
- 题目“AI 智能处理”通过可选 `AiStreamUpdate` 回调复用 AI 客户端的 SSE 流。题目弹窗保留五阶段处理状态，并仅显示接口实际返回的 `reasoning_content/reasoning` 与生成内容；最终 JSON 仍经 `parseQuestionEnrichment()` 校验后才回填。没有思考字段的兼容接口仍显示阶段和结构化输出。
- 只有存在非空正文文字时才创建正文段落，纯表格、代码或图片节点不会显示“正文段落”占位。
- 文章模式沿用原有入口条件：顶层脑图存在子导图时生成递归目录页；工具栏在纯目录页与原始文章之间切换，原始文章正文不内嵌目录。顶层目录是每次进入文章模式和每次重新打开文件的默认落点，不读取其它文件或历史阅读位置中的原始文章状态。全局“进入文章模式”策略默认为锁定，也可设为沿用切换前状态或恢复文章模式自己上次的锁定/编辑状态。`remember` 策略读取插件级 `articleLastReadOnly`，文章内切换锁时单独保存，不写回文档 `view.readOnly`，因此不会被导图、大纲、通读或其他文件级锁状态覆盖。
- 目录与原始文章的落地切换通过 `setArticleLandingMode()` 统一处理：先取消离开页面的阅读恢复，再更新当前编辑器会话并重绘，不进入历史或保存链路。顶层文件序列化时始终写回目录落点，因此“显示原始文章”不会跨重新进入或重开文件保留。两向切换都使用目标类型骨架；进入目录时不携带正文节点锚点，并在真实目录挂载后固定从顶部开始。目录中的显式章节点击仍可将本次导航切换为正文目标。
- 设置一级分类按职责组织：主题与外观承载明暗、画布、节点、连线、阅读和代码视觉默认；视图与阅读承载显示模式、默认布局和打开/嵌入行为；编辑与交互承载节点编辑器、触控手势和撤销；文件与资源承载保存位置、文件命名、资源路径和文件浏览器筛选。旧“代码行为”分类在规范化时迁移到“主题与外观”。
- 递归目录项与文章分页候选分离：`tocEntries` 保存全书节点；`resolveArticleSiblingPages()` 只从中选择当前物理文件的同父级、同结构层级兄弟子导图。页内子节点不会成为上一篇/下一篇目标。
- 子导图文章页的 H1 使用当前物理页面对应目录项的编号前缀，并将可编辑区域限制在根节点标题，避免编辑时把“第一章”等生成编号写回节点文本。
- 子导图通过父节点的有效文章层级延续编号；手动层级会覆盖物理树深度。

### 通读模式

- 按文章族顺序合并顶层导图与可达子导图。
- `articleContextReady=false` 时不使用当前文件临时拼接正文，而是由 `renderReadingLoading()` 显示带可见文案、`aria-busy`、`role=status` 和轻量骨架的解析状态；文章族上下文完成或安全回退后再一次性挂载全文，并以短暂淡入完成过渡。通读模式按钮同步使用 `is-loading`，减少动态效果时停止全部新增动画。
- 每个章节和节点 DOM 同时标记 `filePath` 与 `nodeId`，确保滚动位置可以映射回物理导图。
- 通读切换到其他模式时，如果目标属于子导图，由 `view.ts` 打开对应文件后再聚焦节点。

### 全局搜索批量替换

搜索结果列表只负责展示，允许由 `globalSearchMaxResults` 限制 20–500 条；批量替换不得复用这份截断数组。`GlobalMindMapSearchModal` 在执行“全部替换”时用 `Number.MAX_SAFE_INTEGER` 重新查询当前全局或导图族范围，把完整结果传给插件服务层。每个文件写回并校验后立即调用 `MindMapSearchIndex.refreshFile()` 更新索引，再刷新已打开视图，避免用户马上重搜时看到旧结果。单条替换继续复用同一持久化函数。

全局搜索与当前导图族搜索共用 `GlobalMindMapSearchModal`。打开结果时必须在导航 Promise 之前同步退出搜索 UI：同时隐藏 `modalEl`、Obsidian 暴露的 `containerEl` 与从 DOM 向上找到的 `.modal-container`，但 **不得** 手工 `remove()` 这些由 Obsidian Modal 管理的 DOM，也不得二次调用 `close()`。关闭 `shouldRestoreSelection` 后只调用一次 `Modal.close()`，再等待两个动画帧让宿主完成 Modal 栈与焦点 Scope 清理后才开始导航；`.mms-global-search-container-closing` 仅负责把可能残留的空壳视觉隐藏并禁用指针。这样既避免空白弹窗遮挡，也不会留下搜索后的持久焦点约束。

### 运行调试记录

`RuntimeDebugLog` 是插件级、会话级、有界内存缓冲区。只有“管理配置 → 调试模式”开启时才接收事件；启用会清空旧会话并记录新的 session 头，禁用或插件重载后不保留历史。宿主层捕获点击、双击、右键、指针、按键、滚轮、滚动、文件打开、活动叶变化、全局错误和未处理 Promise；编辑器与视图通过 `onDebugLog` 回调补充目标排队、上下文刷新、文章落地决策、窗口挂载、语义滚动事务和父级导航。

日志字段经过清洗、深度和长度限制。可编辑元素只记录标签、类名和节点 ID，普通字符键在输入上下文中记为 `[text]`；不写入文章正文、输入值、密钥或 AI 请求正文。命令“复制 MindMap Studio 调试记录”输出带插件版本、平台、活动文件和视图模式的 JSONL；优先使用 Clipboard API，失败时退回临时只读文本框和 `execCommand("copy")`。

### 页面过渡与大型操作状态

- `MindMapEditor.beginPageTransition()` 在编辑器根节点创建唯一的模态状态层，设置 `role=status`、`aria-live=polite` 和根级 `aria-busy`。状态层使用 latest-wins 令牌，后发导航会使旧完成回调失效。
- 所有可能跨文件或重建大页面的用户入口先等待两个 `requestAnimationFrame`，确保文字与遮罩已经绘制，再开始同步节点克隆、JSON 序列化、布局计算或目标页面渲染。动画不能让同步任务并行，但能避免主线程进入长任务前完全没有反馈。
- `navigateWithTransition()` 统一包装父子导图、文章目录、画布节点和文章链接导航；错误会关闭状态层并给出 Notice，避免未处理拒绝留下永久忙碌状态。
- `resolveParentReturnIntent()` 把父级返回分为 `article-directory` 与 `parent-map`：只有文章模式进入生成目录，导图、大纲、通读和题库模式必须通过 `onOpenMindMap()` 保持当前模式并聚焦父挂载节点。
- 提取、创建和合并子导图使用同一状态层更新阶段文案，不叠加多个遮罩。新页面挂载或模式切换完成后，仅对当前活动内容面应用约 210ms 的入口动画。
- `prefers-reduced-motion: reduce` 关闭图标脉冲、位移和淡入，但不会取消状态文字、输入阻断或两帧绘制门。

全局模式由 `MindMapStudioPlugin.setGlobalDisplayMode()` 广播。导图、文章和通读会保存为下次启动模式；大纲只保留在当前会话，插件重新加载后通过 `resolveStartupDisplayMode()` 回到导图或其他可持久化模式。

四种模式使用 `ReadingLocation` 同步阅读进度。记录包含目标物理文件、目标节点到根节点的回退链、跨子导图父挂载链、节点内部比例和视口锚点。恢复顺序为“精确节点 → 当前文件父级 → 父导图挂载节点及其父级 → 文章族根节点”。这种语义锚点不会因不同模式的页面高度差异而漂移。

导图视口仍由 `initializeMindMapViewport()`、`persistMindMapViewportState()` 和 `applyTransform()` 管理；统一阅读位置优先决定聚焦节点，缩放和平移字段负责保持画布视觉状态。

## 6. 父子导图结构

父节点保存：

```json
{
  "submap": {
    "path": "MindMap Assets/古诗/唐诗.mindmap",
    "title": "唐诗"
  }
}
```

子文件保存：

```json
{
  "navigation": {
    "parentPath": "古诗.mindmap",
    "parentNodeId": "node-id",
    "parentTitle": "古诗"
  }
}
```

这是双向关系：

- 父节点可以直接进入子导图。
- 子导图可以通过左上角悬浮面包屑返回父节点。
- 全局搜索可以解析整棵导图族。
- 文章模式可以计算跨文件标题层级和目录。

所有递归遍历都必须维护已访问路径集合，防止用户手工编辑文件后产生循环引用。

## 7. 布局与节点尺寸

`src/render/layout.ts` 是纯计算模块：

1. `nodeDimensions()` 根据文本、图片、表格、代码和手动尺寸计算节点大小。
2. `subtreeHeight()` 递归计算分支占位。
3. `layoutBranch()` 放置节点及后代。
4. `computeLayout()` 生成节点映射、可见最大深度和画布边界。

节点手动宽度是实际布局宽度；文字根据该宽度自动换行。节点高度使用“最小高度”，内容更多时仍可自动增高，不会裁切。

节点折叠按钮位于右侧中部，手动尺寸控制点固定在右下角，避免两个定位操作重叠。默认需按住 Ctrl/Cmd 才显示尺寸控制点；修饰键状态同时由键盘、指针事件、窗口失焦和页面可见性同步，避免失焦后遗留缩放光标或拦截普通点击。Shift 专用于多选与框选，避免手势冲突。

折叠节点的后代不参与当前布局，因此展开或折叠后需要重新计算。

编辑画布采用两阶段布局：先使用模型内容估算尺寸并生成初始坐标，节点挂载到 DOM 后再读取浏览器实际计算出的宽高。表格、代码、图片或社区主题造成实际尺寸变化时，`ResizeObserver` 会触发 `collision-layout.ts` 重新检测包围盒，整体平移发生碰撞的子树，并同步重绘连接线和画布边界。观察器会缓存每个节点最近一次外框尺寸；选择态、阴影或浏览器重复通知没有改变宽高时不再启动二次布局，避免视口锚点平移被重复累计。

## 8. 图片与图床架构

图片内容块同时可以保存：

- 当前使用地址 `source`。
- 本地仓库地址 `localSource`。
- 多个远程镜像 `remoteSources`，其中可包含服务端返回的删除令牌。
- 图片二进制 SHA-256 `contentHash`。
- 同行或独占一行排版 `layout`。

加载顺序由 `imageSourceCandidates()` 生成。图片加载错误或超时后，编辑器尝试下一个镜像；成功后更新当前地址并保存。HTTP 200 返回错误占位图无法仅凭浏览器加载事件判断。

自动上传流程由插件层负责，因为它需要读取仓库二进制文件、计算 SHA-256、调用网络请求并决定是否删除本地资源或最后引用对应的远程对象。上传缓存以“图床 ID + SHA-256”为键；同一二进制在同一图床复用 URL，不跨图床混用。上传与删除统一读取同一份当前请求头。远程删除默认开启但仍可关闭：图片块最后引用被删除且全仓库扫描无同哈希/URL 引用后，任务先写入持久化的 1 分钟安全队列；到期执行前再次保存打开视图并扫描全部导图，撤销恢复或重新引用会取消任务，插件重启也会恢复待执行队列。连通性测试图片复用同一延迟删除机制。Zipline 直接保存上传响应中的文件 ID；历史缓存或旧图片块缺少 ID 时，通过当前认证 Token 查询 v4 文件列表按 URL/文件名补回；ImgBB 保存秘密删除链接；Freeimage.host 公开 API 只参与上传。排程持有当前 `TFile` 对象而不是固定字符串路径，因此保存期间若根据中心节点标题重命名导图，任务会沿用更新后的文件路径继续执行。桌面 Markdown 图片的磁盘读取、去重复制和权威内容块改写下沉到 `src/utils/desktop-import.ts`；编辑器在导入节点获得最终 ID 后调用宿主排程，Markdown 转脑图则在文件保存后恢复待上传任务。画布级“上传当前页面所有图片”由编辑器一次选择图床、按图片读取来源并补传缺失镜像，最后通过统一内容块替换和保存链路写回。可确定的图床协议转换下沉到 `src/utils/image-host.ts`：端点只接受 HTTP(S)，Header 必须是无换行的扁平 JSON 对象，multipart 字段和值会清除请求头注入字符，响应地址也必须通过 HTTP(S) URL 校验。

```text
ImageHostConfig
→ normalizeHttpUrl() / parseUploadHeaders()
→ buildMultipartUploadBody() 或原始二进制
→ Obsidian requestUrl()
→ parseUploadResponsePayload()
→ sha256Blob() 并查询图床级缓存
→ extractImageUrlFromResponse() / 可选删除令牌
→ 更新 contentHash 与 remoteSources
→ 满足全部安全条件后可选删除本地资源
→ 删除最后引用时按显式图床删除模板清理远程对象
```

## 9. 搜索索引架构

索引文件位于插件数据目录，仅保存搜索缓存：

```text
mindmap-search-index.json
```

索引过程：

```text
监听 create/modify/rename/delete
→ 防抖队列
→ 仅解析发生变化的 .mindmap
→ buildSearchEntries()
→ resolveHierarchicalEntries()
→ 延迟保存索引
```

`Ctrl/Cmd+F` 搜索当前导图族，旧版 `Ctrl/Cmd+Alt+F` 继续兼容；配置项默认使用 `Ctrl/Cmd+Shift+F` 打开整个仓库的导图搜索。当前导图族快捷键由插件窗口捕获层在活动视图为 `MindMapStudioView` 时优先接管，因此不依赖 Obsidian 的“搜索当前文件”命令绑定；弹窗内按键不会被再次截获。全局与导图族搜索都只索引和显示节点文字，不匹配或展示子导图路径、备注、标签、链接、代码、表格和图片元数据。编辑器根节点仍保留同样的捕获阶段回退，并使用 `KeyboardEvent.code` 兼容非英文键盘布局。当前导图族搜索会在打开搜索时主动刷新父子链，不要求重新创建子导图。
搜索结果导航先同步隐藏当前搜索 `modal-container`，随后只由 `Modal.close()` 释放宿主拥有的 DOM/Modal 栈/焦点 Scope，并等待两个动画帧后再启动跨文件视图切换和节点聚焦 Promise。禁止在 `close()` 后手工删除 Modal DOM 或在导航完成后再次 `close()`；真实 Windows/Obsidian 1.12.7 日志证明这会让搜索后的文章 `contenteditable` 持续出现 `focus → blur(null)`。文章语义定位为了吸收图片、字体等迟到布局会短时保留 `ResizeObserver`、定时器与动画帧；因此搜索落点之后，**用户开始编辑必须高于仍存活的导航恢复事务**。`makeInlineEditable()` 的指针入口先调用 `claimInlineEditInteraction()`：取消 `activeReadingRestore` 与文章窗口边缘扩展、清除待处理文章定位，并在任何可能的延迟刷新之前建立 `inlineEditingId`/当前内容块保护；随后 `activateInlineEditableFromPointer()` 只打开 `contenteditable` 而不主动移动光标，让浏览器默认动作把光标落到实际点击位置。该指针入口仅在最初 120 ms 设置 `mmsProtectInitialFocus`，若 Obsidian 在同一交互中回收焦点则用 `focus({ preventScroll: true })` 恢复；保护期后普通 `blur` 仍提交。编辑接管、focus、blur 与恢复焦点分别记录 `inline-edit-claim`、`inline-edit-focus`、`inline-edit-blur`、`inline-edit-refocus` 调试事件。右键菜单“编辑当前内容/添加正文”仍统一经过 `editSelectedFromContextMenu()`，文章模式只在该边界调用 `editSelectedArticleContent(true)`；通用 `editSelected(initialBlockId?)` 保持完整节点编辑契约，不承载菜单时序状态。

## 10. 静态渲染与导出

`documentToSvg()` 使用与编辑画布相同的布局数据，支持：

- 主题与分支颜色。
- 节点自定义尺寸。
- 左、中、右文字对齐。
- 富文本颜色和样式。
- 表格和代码。
- 统一或层级渐细连接线。

静态 Markdown 预览只读取数据并生成 SVG，不绑定编辑事件，也不会修改原始文件。

## 11. 扩展功能时的边界

新增节点字段时：

1. 在 `model.ts` 接口中声明。
2. 在相应 `normalize*()` 中校验。
3. 确认 `cloneDocument()` 能保留该字段。
4. 检查 Markdown/SVG/搜索是否需要支持。
5. 为旧文件缺省值编写测试。

新增写操作时：

1. 从 `ensureEditable()` 进入。
2. 通过 `mutate()` 修改。
3. 不直接调用仓库写入，除非属于跨文件服务。
4. 确认四种模式都能表达修改后的数据。

新增编辑器宿主能力时：

1. 先在 `editor-types.ts` 扩展回调契约。
2. 由 `view.ts` 提供 Obsidian 相关实现。
3. `editor.ts` 只调用契约，不直接依赖插件主类。

新增阅读样式预设时，应在 `article-style.ts` 中维护预设和解析逻辑；文章、通读与统一“主题与外观”面板共用同一个解析入口。只读锁仅限制内容和结构写入，展示配置通过独立的 `mutatePresentation()` 保存。

富文本字符样式的规范化属于 `model.ts`，DOM 解析和渲染属于 `rich-text-dom.ts`。不要让模型层依赖浏览器 DOM 或 MathJax。

新增不直接修改编辑器内部状态的弹窗时，应优先放入 `editor-modals.ts`，通过构造参数和回调与 `MindMapEditor` 通信。

剪贴板载荷解析应集中在 `clipboard-import.ts`。编辑器只负责读取剪贴板、插入解析后的节点和记录撤销历史。

节点编辑弹窗中的图片 I/O 应通过 `node-image-actions.ts` 完成。弹窗只在操作成功后刷新预览并触发自动保存。

节点文字块的字符级格式编辑应通过 `node-rich-text-editor.ts` 完成，弹窗只提供内容块容器和变更回调。

新增跨文件功能时，应放在 `main.ts` 或专用服务类中，由 `view.ts` 和 `editor.ts` 通过回调调用。


## 图片识图、OCR 与截图边界

`src/vision/recognition.ts` 只负责确定性范围收集、提示词、结果规范化、不可变预览和过期快照校验；`src/vision/modal.ts` 负责原图/文字对比与确认；`src/vision/local-ocr.ts` 只在桌面功能实际触发时动态获取 Node.js API，通过 `execFile` 调用 Tesseract，避免移动端在插件加载阶段静态引用 Node 模块。AI 多模态请求仍由 `src/ai/protocol.ts` 和 `src/ai/client.ts` 构造与发送。

`src/utils/desktop-capture.ts` 优先尝试渲染器可用的 Electron `desktopCapturer`，并为该路径设置 3.5 秒硬超时；不可用或失败时，再通过按需加载的 Node.js API执行本机非交互式整屏抓取，Windows 使用 PowerShell 与 `System.Drawing`，macOS 使用固定范围 `screencapture`，Linux 依次尝试 `grim`、ImageMagick `import`、GNOME Screenshot 和 Spectacle，本机路径设置 18 秒总超时。抓取完成后不再调用异步 `window.open`，而是把全屏 `iframe` 直接挂载到当前 Obsidian 文档根节点，以最高层级承载 Canvas 选区、八方向缩放、坐标尺寸、标注、马赛克、复制和下载；截图源通过临时 Blob URL 传入，关闭时立即释放。这样可避免宿主返回不可见弹窗代理后命令永久等待。所有桌面 API 仍按需动态获取，移动端不会静态加载 Node/Electron 模块。系统交互式截图工具不再作为静默回退；抓取或覆盖层创建失败时直接返回明确错误，编辑器启动时先显示准备提示，控制台记录抓屏阶段。截图开始前由编辑器冻结焦点节点和 `data-block-id`，右键入口可显式覆盖目标；截图期间焦点变化不会改变插入位置。普通截图、截图并识别和识别并复制是独立动作。覆盖层打开或切换屏幕后默认选中当前屏幕完整范围，并通过显式模式参数区分交互：普通截图不启动自动关闭计时，双击选区才确认；截图并识别保留与普通截图相同的完整工具栏和样式栏 DOM，只通过 `opacity: 0` 与 `pointer-events: none` 视觉隐藏，避免脚本初始化访问空节点。倒计时沿用原有“秒后自动识别”胶囊提示，仅将数字显示为整数 `3、2、1`；鼠标悬停选区边框、拖动条或缩放手柄时暂停，离开这些区域或重新框选完成后从 3 秒重新开始。Esc 同时注册在内嵌 iframe 窗口和宿主窗口上。

图片转文字与截图插入都必须通过 `MindMapEditor.replaceDocumentFromExternalEdit()` 接入撤销、保存、重渲染和聚焦。网络层、本地 OCR 层和截图层不得直接修改 `MindMapDocument`。

## AI 助手边界

`src/ai/` 按职责拆分：`config.ts` 管理预设与持久化规范化；`markdown.ts` 负责页面/节点子树导出和 UTF-8 大小预检；`protocol.ts` 构造、校验 OpenAI 兼容 JSON；`client.ts` 是唯一网络请求边界；`edit.ts` 负责 AI Markdown 提案解析、过期预览校验、范围替换和不联网的本地文字替换；`modal.ts` 只负责模式选择、处理轨迹、预览和确认。网络层不能直接写入编辑器。所有结构化变更必须先生成不可变预览，再由 `MindMapEditor` 接入撤销、保存、重渲染和聚焦流程。

### 图片失败诊断、粘贴目标与后台上传事务

图片渲染由 `src/editor/image-failure-view.ts` 统一枚举当前地址、图床镜像和本地副本。全部候选均不可用时，不再只保留空白图片占位，而是在导图、文章、通读和大纲的原内容块位置展示地址卡片及复制操作。

剪贴板图片保存属于异步 I/O。编辑器在调用宿主保存前冻结事件发生时的节点 ID 和文章内容块 ID；网络、文件写入或用户后续选择变化都不能重定向插入位置。只有文章或通读模式的真实可编辑块事件才允许使用文章焦点，导图和大纲始终以当前节点选择为准。

重新打开导图恢复自动上传时，插件按 `TFile` 聚合同时到期的图片并串行处理同一文件。网络响应只生成 `MindMapImageUploadPatch`，随后按稳定节点 ID 和图片块 ID 合并到当前编辑器文档，或重新读取磁盘最新版本后一次写回。后台上传不得保存上传开始时的整份文档快照，也不得为每张图片刷新整个打开视图；这些约束用于避免重复成功通知、界面闪烁和最后写入覆盖造成的节点丢失。

- 任务状态交互已删除。模型层仍容忍历史 `task` 字段，以避免旧文件解析失败，但编辑器、设置、导出和渲染均忽略该字段。

### 工具栏可用性与排序

工具栏按钮先按用户可见配置和规范化顺序创建，再由 `toolbarItemAvailable()` 根据显示模式、只读状态、选择节点、撤销历史和功能开关计算实际可用性。不可用按钮保留 DOM 身份但收缩为零宽并移出键盘顺序，重新可用时恢复；首帧在启用过渡前完成一次过滤，防止整排按钮闪现。截图与截图识别作为不可拆分相邻组，统一“导入与导出”固定在末尾。旧 `json`、`export-document`、`export-svg` 和 `article-style` 只作为加载迁移别名。
