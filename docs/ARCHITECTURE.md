# MindMap Studio 架构说明

## 1. 设计目标

MindMap Studio 是一个本地优先的 Obsidian 思维导图插件。核心设计原则如下：

1. `.mindmap` 文件是唯一事实来源，搜索索引、静态预览和界面状态都不能替代原始文件。
2. 导图、大纲、文章三种模式共用同一棵节点树，任何模式中的修改都必须同步到其他模式。
3. 所有不可信输入都必须经过模型层规范化，包括磁盘文件、旧版本文件、Markdown、剪贴板 JSON 和子导图元数据。
4. 用户编辑必须经过统一的撤销、重做和自动保存链路。
5. 跨文件功能集中在插件服务层，编辑器不直接自行读写仓库文件。
6. 可选功能字段保持向后兼容，旧 `.mindmap` 文件无需重新创建。

## 2. 模块分层

```text
src/
├── main.ts / view.ts           插件入口、Obsidian 视图与跨文件服务
├── core/
│   ├── model.ts                数据模型、规范化与兼容
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
│   └── article-style.ts        文章样式解析
├── render/
│   ├── layout.ts               坐标、连线与 SVG
│   ├── collision-layout.ts     节点碰撞检测与子树避让
│   └── static-render.ts        阅读模式静态预览
├── search/
│   └── global-search.ts        本地增量索引与搜索
├── import/
│   └── import-export.ts        XMind 导入与文章导出
├── settings.ts                 设置与默认值
└── themes.ts                   主题预设
```

辅助模块：

- `src/settings.ts`：插件设置、默认值、主题同步和设置页。
- `src/themes.ts`：内置主题预设。
- `src/article/article-style.ts`：文章样式预设和纯样式解析，不依赖编辑器 DOM。
- `src/editor/editor-types.ts`：编辑器回调与运行参数契约，隔离插件服务和 UI 实现。
- `src/editor/rich-text-dom.ts`：富文本运行段与 `contenteditable` DOM 的双向转换，以及 MathJax 渲染。
- `src/editor/editor-modals.ts`：图片预览、图床选择、公式编辑、文章样式、节点搜索、JSON/文件导入、Markdown 大纲和文档导出等弹窗。
- `src/editor/clipboard-import.ts`：剪贴板 JSON、Markdown、缩进文本和 HTML 列表的节点分支解析。
- `src/editor/node-image-actions.ts`：节点图片选择、本地保存、图床上传和远程镜像合并。
- `src/editor/node-rich-text-editor.ts`：节点文字块的选区样式、颜色、格式清理和实时预览。
- `src/editor/selection-format-toolbar.ts`：文章和大纲模式内联编辑时随文字选区显示的加粗、斜体、下划线及颜色工具栏。
- `src/editor/content-modals.ts`：表格、代码编辑弹窗。
- `src/render/static-render.ts`：Markdown 阅读模式中的只读 SVG 预览。
- `styles.css`：编辑器、三种模式、弹窗、搜索、尺寸手柄和响应式样式。

## 3. 文件加载与保存流程

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

`parseDocument()` 兼容两种输入：

- 当前版本的原始 JSON。
- 早期版本使用的 Markdown 围栏 JSON。

解析失败不会让视图崩溃，而是返回安全默认文档。

### 3.2 保存文件

```text
用户操作
→ MindMapEditor.mutate()
→ 写入撤销栈
→ 修改同一份 MindMapDocument
→ render()
→ callbacks.onChange()
→ TextFileView 自动保存
→ getViewData()
→ serializeDocument()
```

`serializeDocument()` 在输出前再次规范化数据，确保磁盘中不会残留临时 DOM 状态、无效颜色、非法尺寸或不完整节点。

## 4. 编辑事务与历史记录

所有可撤销编辑都必须通过 `MindMapEditor.mutate()`：

1. 克隆修改前文档并压入 `history`。
2. 清空 `future`，避免分叉历史错误复用。
3. 执行调用方提供的修改函数。
4. 同步新内容块与旧兼容字段。
5. 重新渲染当前模式。
6. 通知视图保存。

不应在 UI 事件中直接修改 `this.document` 后绕过 `mutate()`，否则会产生以下问题：

- 无法撤销。
- 大纲、文章和导图不同步。
- 搜索索引可能读取到旧值。
- 自动保存提示不准确。

只读模式在进入写操作前由 `ensureEditable()` 统一阻止。

## 5. 三种显示模式

### 导图模式

- 使用 `computeLayout()` 计算节点坐标。
- 连接线与节点位于同一可缩放画布。
- 支持拖拽重组、平移、缩放、尺寸手柄和整节点子导图入口。

### 大纲模式

- 递归按层级缩进。
- 直接编辑标题、备注、任务状态和结构。
- 子导图节点标题本身作为链接，不显示重复按钮。
- 节点标题下显示额外文字块、图片缩略图、可滚动表格、代码预览和备注；大型内容使用局部滚动，避免破坏整体层级浏览。
- 纯表格、纯代码或纯图片节点不生成空标题行，内容区域本身承担选择和双击编辑入口。
- 内容区域只继承节点容器的一次层级缩进，不再按深度重复偏移；纯内容节点使用更紧凑的左边距。

### 文章模式

- 使用 `buildArticleNodeInfo()` 判断标题与正文。
- 有子节点或关联子导图的节点才参与编号。
- 末端节点作为正文，不继续编号。
- 所有正文段落统一使用 `2em` 首行缩进，不根据当前窗口下是否换行动态改变；标题、备注、表格和代码不缩进。
- 只有存在非空正文文字时才创建正文段落，纯表格、代码或图片节点不会显示“正文段落”占位。
- 顶层父导图可生成递归目录。
- 子导图通过 `articleBaseDepth` 延续父文档编号。

全局模式由 `MindMapStudioPlugin.setGlobalDisplayMode()` 保存并广播，打开任何其他 `.mindmap` 文件时继续使用最后选择的模式。

文章与大纲之间切换时，编辑器记录当前视口对应的节点标识、节点内部阅读百分比和视口锚点，再在目标模式定位相同节点。该语义锚点比直接复制滚动条百分比更适合高度差异明显的文章与大纲页面。

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

折叠节点的后代不参与当前布局，因此展开或折叠后需要重新计算。

编辑画布采用两阶段布局：先使用模型内容估算尺寸并生成初始坐标，节点挂载到 DOM 后再读取浏览器实际计算出的宽高。表格、代码、图片或社区主题造成实际尺寸变化时，`ResizeObserver` 会触发 `collision-layout.ts` 重新检测包围盒，整体平移发生碰撞的子树，并同步重绘连接线和画布边界。

## 8. 图片与图床架构

图片内容块同时可以保存：

- 当前使用地址 `source`。
- 本地仓库地址 `localSource`。
- 多个远程镜像 `remoteSources`。

加载顺序由 `imageSourceCandidates()` 生成。图片加载错误或超时后，编辑器尝试下一个镜像；成功后更新当前地址并保存。HTTP 200 返回错误占位图无法仅凭浏览器加载事件判断。

自动上传流程由插件层负责，因为它需要读取仓库二进制文件、调用网络请求并决定是否删除本地资源。

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

`Ctrl/Cmd+F` 搜索当前导图族；`Ctrl/Cmd+Shift+F` 搜索整个仓库。快捷键在编辑控件聚焦时也会于编辑器根节点的捕获阶段识别，并使用 `KeyboardEvent.code` 兼容非英文键盘布局。当前导图族搜索会在打开搜索时主动刷新父子链，不要求重新创建子导图。

## 10. 静态渲染与导出

`documentToSvg()` 使用与编辑画布相同的布局数据，支持：

- 主题与分支颜色。
- 节点自定义尺寸。
- 左、中、右文字对齐。
- 富文本颜色和样式。
- 表格、代码和任务状态。
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
4. 确认三种模式都能表达修改后的数据。

新增编辑器宿主能力时：

1. 先在 `editor-types.ts` 扩展回调契约。
2. 由 `view.ts` 提供 Obsidian 相关实现。
3. `editor.ts` 只调用契约，不直接依赖插件主类。

新增文章样式预设时，应在 `article-style.ts` 中维护预设和解析逻辑，文章渲染与样式编辑弹窗共用同一个解析入口。

富文本字符样式的规范化属于 `model.ts`，DOM 解析和渲染属于 `rich-text-dom.ts`。不要让模型层依赖浏览器 DOM 或 MathJax。

新增不直接修改编辑器内部状态的弹窗时，应优先放入 `editor-modals.ts`，通过构造参数和回调与 `MindMapEditor` 通信。

剪贴板格式兼容应集中在 `clipboard-import.ts`。编辑器只负责读取剪贴板、插入解析后的节点和记录撤销历史。

节点编辑弹窗中的图片 I/O 应通过 `node-image-actions.ts` 完成。弹窗只在操作成功后刷新预览并触发自动保存。

节点文字块的字符级格式编辑应通过 `node-rich-text-editor.ts` 完成，弹窗只提供内容块容器和变更回调。

新增跨文件功能时，应放在 `main.ts` 或专用服务类中，由 `view.ts` 和 `editor.ts` 通过回调调用。
