# 函数与类参考

> 本文档由 `npm run docs:generate` 根据 TypeScript 源码自动生成。源码中的 JSDoc 是说明的权威来源；修改函数签名或职责后，应同步更新注释并重新生成本文档。

## `src/content-modals.ts`

表格与代码块编辑弹窗。

### 函数 `cloneTable`

源码：`src/content-modals.ts:24`

执行“clone table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function cloneTable(table: MindMapTable | undefined): MindMapTable
```

### 类 `TableEditModal`

源码：`src/content-modals.ts:39`

TableEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class TableEditModal extends Modal
```

### 构造函数 `TableEditModal.constructor`

源码：`src/content-modals.ts:52`

创建 TableEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, table: MindMapTable | undefined, submit: (table: MindMapTable) => void)
```

### 方法 `TableEditModal.onOpen`

源码：`src/content-modals.ts:61`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `TableEditModal.renderGrid`

源码：`src/content-modals.ts:151`

渲染grid，并保持模型、界面和持久化状态的一致性。

```ts
private renderGrid(): void
```

### 方法 `TableEditModal.collectGrid`

源码：`src/content-modals.ts:178`

遍历并收集grid，并保持模型、界面和持久化状态的一致性。

```ts
private collectGrid(): void
```

### 类 `CodeEditModal`

源码：`src/content-modals.ts:202`

CodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class CodeEditModal extends Modal
```

### 构造函数 `CodeEditModal.constructor`

源码：`src/content-modals.ts:213`

创建 CodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, block: MindMapCodeBlock | undefined, submit: (block: MindMapCodeBlock) => void)
```

### 方法 `CodeEditModal.onOpen`

源码：`src/content-modals.ts:222`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

## `src/editor.ts`

MindMap Studio 核心交互编辑器。

### 接口 `MindMapEditorCallbacks`

源码：`src/editor.ts:69`

MindMapEditorCallbacks 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapEditorCallbacks
```

### 接口 `MindMapEditorOptions`

源码：`src/editor.ts:93`

MindMapEditorOptions 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapEditorOptions
```

### 接口 `NodeEditValues`

源码：`src/editor.ts:112`

NodeEditValues 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface NodeEditValues
```

### 函数 `styleEquals`

源码：`src/editor.ts:141`

执行“style equals”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function styleEquals(left: MindMapTextStyle | undefined, right: MindMapTextStyle | undefined): boolean
```

### 函数 `renderRichTextRuns`

源码：`src/editor.ts:152`

渲染rich text runs，并保持模型、界面和持久化状态的一致性。

```ts
function renderRichTextRuns(container: HTMLElement, runs: MindMapTextRun[] | undefined, fallbackText: string): void
```

### 函数 `styleFromElement`

源码：`src/editor.ts:177`

执行“style from element”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function styleFromElement(element: HTMLElement, inherited: MindMapTextStyle): MindMapTextStyle
```

### 函数 `readRichTextEditor`

源码：`src/editor.ts:209`

执行“read rich text editor”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function readRichTextEditor(editor: HTMLElement):
```

### 类 `ImagePreviewModal`

源码：`src/editor.ts:239`

ImagePreviewModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class ImagePreviewModal extends Modal
```

### 构造函数 `ImagePreviewModal.constructor`

源码：`src/editor.ts:249`

创建 ImagePreviewModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, private readonly source: string, private readonly alt: string)
```

### 方法 `ImagePreviewModal.onOpen`

源码：`src/editor.ts:256`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 类 `ImageHostPickerModal`

源码：`src/editor.ts:296`

ImageHostPickerModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class ImageHostPickerModal extends Modal
```

### 构造函数 `ImageHostPickerModal.constructor`

源码：`src/editor.ts:308`

创建 ImageHostPickerModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, private readonly hosts: ImageHostChoice[], initialIds: string[], private readonly resolveSelection: (ids: string[] | null) => void )
```

### 方法 `ImageHostPickerModal.onOpen`

源码：`src/editor.ts:321`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `ImageHostPickerModal.onClose`

源码：`src/editor.ts:356`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 函数 `chooseImageHosts`

源码：`src/editor.ts:369`

执行“choose image hosts”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function chooseImageHosts(app: App, hosts: ImageHostChoice[], initialIds: string[]): Promise<string[] | null>
```

### 类 `NodeEditModal`

源码：`src/editor.ts:382`

NodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class NodeEditModal extends Modal
```

### 构造函数 `NodeEditModal.constructor`

源码：`src/editor.ts:400`

创建 NodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, node: MindMapNode, defaultShape: NodeShape, callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource">, submit: (values: NodeEdit…
```

### 方法 `NodeEditModal.onOpen`

源码：`src/editor.ts:417`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `NodeEditModal.onClose`

源码：`src/editor.ts:800`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 类 `AppearanceModal`

源码：`src/editor.ts:810`

AppearanceModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class AppearanceModal extends Modal
```

### 构造函数 `AppearanceModal.constructor`

源码：`src/editor.ts:823`

创建 AppearanceModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, appearance: MindMapAppearance, submit: (appearance: MindMapAppearance) => void, reset: () => void)
```

### 方法 `AppearanceModal.onOpen`

源码：`src/editor.ts:833`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 类 `OutlineModal`

源码：`src/editor.ts:1057`

OutlineModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class OutlineModal extends Modal
```

### 构造函数 `OutlineModal.constructor`

源码：`src/editor.ts:1068`

创建 OutlineModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, markdown: string, onExport: () => void)
```

### 方法 `OutlineModal.onOpen`

源码：`src/editor.ts:1077`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `OutlineModal.onClose`

源码：`src/editor.ts:1098`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 类 `SearchNodesModal`

源码：`src/editor.ts:1106`

SearchNodesModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class SearchNodesModal extends Modal
```

### 构造函数 `SearchNodesModal.constructor`

源码：`src/editor.ts:1119`

创建 SearchNodesModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, nodes: MindMapNode[], onQuery: (query: string) => void, onSelect: (node: MindMapNode) => void)
```

### 方法 `SearchNodesModal.onOpen`

源码：`src/editor.ts:1129`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 类 `JsonTransferModal`

源码：`src/editor.ts:1179`

JsonTransferModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class JsonTransferModal extends Modal
```

### 构造函数 `JsonTransferModal.constructor`

源码：`src/editor.ts:1192`

创建 JsonTransferModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, document: MindMapDocument, onImport: (document: MindMapDocument) => void, onExport: (json: string) => void)
```

### 方法 `JsonTransferModal.onOpen`

源码：`src/editor.ts:1202`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 类 `MindMapEditor`

源码：`src/editor.ts:1235`

MindMapEditor 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapEditor
```

### 构造函数 `MindMapEditor.constructor`

源码：`src/editor.ts:1283`

创建 MindMapEditor 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, host: HTMLElement, document: MindMapDocument, callbacks: MindMapEditorCallbacks, options: MindMapEditorOptions)
```

### 方法 `MindMapEditor.destroy`

源码：`src/editor.ts:1301`

执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
destroy(): void
```

### 方法 `MindMapEditor.setDocument`

源码：`src/editor.ts:1316`

更新并应用document，并保持模型、界面和持久化状态的一致性。

```ts
setDocument(document: MindMapDocument, resetHistory = true): void
```

### 方法 `MindMapEditor.setOptions`

源码：`src/editor.ts:1334`

更新并应用options，并保持模型、界面和持久化状态的一致性。

```ts
setOptions(options: MindMapEditorOptions): void
```

### 方法 `MindMapEditor.setDisplayMode`

源码：`src/editor.ts:1358`

更新并应用display mode，并保持模型、界面和持久化状态的一致性。

```ts
setDisplayMode(mode: DisplayMode, notifyGlobal = true): void
```

### 方法 `MindMapEditor.applyGlobalDisplayMode`

源码：`src/editor.ts:1371`

应用global display mode，并保持模型、界面和持久化状态的一致性。

```ts
applyGlobalDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapEditor.toggleReadOnly`

源码：`src/editor.ts:1378`

切换read only，并保持模型、界面和持久化状态的一致性。

```ts
toggleReadOnly(): void
```

### 方法 `MindMapEditor.getDocument`

源码：`src/editor.ts:1389`

读取并返回document，并保持模型、界面和持久化状态的一致性。

```ts
getDocument(): MindMapDocument
```

### 方法 `MindMapEditor.markSaved`

源码：`src/editor.ts:1396`

执行“mark saved”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
markSaved(): void
```

### 方法 `MindMapEditor.markSaving`

源码：`src/editor.ts:1404`

执行“mark saving”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
markSaving(): void
```

### 方法 `MindMapEditor.focus`

源码：`src/editor.ts:1412`

定位相关数据，并保持模型、界面和持久化状态的一致性。

```ts
focus(): void
```

### 方法 `MindMapEditor.focusNodeById`

源码：`src/editor.ts:1421`

定位node by id，并保持模型、界面和持久化状态的一致性。

```ts
focusNodeById(id: string): void
```

### 方法 `MindMapEditor.buildUi`

源码：`src/editor.ts:1428`

构建ui，并保持模型、界面和持久化状态的一致性。

```ts
private buildUi(): void
```

### 方法 `MindMapEditor.resolveMode`

源码：`src/editor.ts:1562`

解析并确定mode，并保持模型、界面和持久化状态的一致性。

```ts
private resolveMode(preferred: DisplayMode): DisplayMode
```

### 方法 `MindMapEditor.persistReadOnlyState`

源码：`src/editor.ts:1570`

执行“persist read only state”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private persistReadOnlyState(): void
```

### 方法 `MindMapEditor.updateModeUi`

源码：`src/editor.ts:1580`

执行“update mode ui”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private updateModeUi(): void
```

### 方法 `MindMapEditor.ensureEditable`

源码：`src/editor.ts:1598`

执行“ensure editable”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private ensureEditable(): boolean
```

### 方法 `MindMapEditor.clearImageLoadTimers`

源码：`src/editor.ts:1607`

执行“clear image load timers”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private clearImageLoadTimers(): void
```

### 方法 `MindMapEditor.addToolbarButton`

源码：`src/editor.ts:1621`

添加toolbar button，并保持模型、界面和持久化状态的一致性。

```ts
private addToolbarButton(icon: string, label: string, action: () => void, editOnly = false): HTMLButtonElement
```

### 方法 `MindMapEditor.addToolbarSeparator`

源码：`src/editor.ts:1639`

添加toolbar separator，并保持模型、界面和持久化状态的一致性。

```ts
private addToolbarSeparator(): void
```

### 方法 `MindMapEditor.getAppearance`

源码：`src/editor.ts:1647`

读取并返回appearance，并保持模型、界面和持久化状态的一致性。

```ts
private getAppearance(): MindMapAppearance
```

### 方法 `MindMapEditor.fontFamilyCss`

源码：`src/editor.ts:1657`

执行“font family css”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private fontFamilyCss(appearance: MindMapAppearance): string
```

### 方法 `MindMapEditor.applyAppearance`

源码：`src/editor.ts:1670`

应用appearance，并保持模型、界面和持久化状态的一致性。

```ts
private applyAppearance(appearance: MindMapAppearance): void
```

### 方法 `MindMapEditor.renderNavigation`

源码：`src/editor.ts:1695`

在画布左上角或文档顶部渲染父子导图导航。导图模式使用固定悬浮面包屑，文章和大纲模式使用文档流导航，均保持当前全局显示模式。

```ts
private renderNavigation(): void
```

### 方法 `MindMapEditor.updateNodePrimaryText`

源码：`src/editor.ts:1765`

执行“update node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private updateNodePrimaryText(node: MindMapNode, value: string): void
```

### 方法 `MindMapEditor.makeInlineEditable`

源码：`src/editor.ts:1787`

创建并配置inline editable，并保持模型、界面和持久化状态的一致性。

```ts
private makeInlineEditable(element: HTMLElement, node: MindMapNode, placeholder: string): void
```

### 方法 `MindMapEditor.addInlineNodeActions`

源码：`src/editor.ts:1822`

添加inline node actions，并保持模型、界面和持久化状态的一致性。

```ts
private addInlineNodeActions(container: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.renderOutline`

源码：`src/editor.ts:1839`

按照节点层级渲染可编辑大纲。节点标题、备注和子导图链接仍映射到同一份数据，任何修改都会通过统一变更链同步到导图和文章模式。

```ts
private renderOutline(): void
```

### 方法 `MindMapEditor.renderArticleContent`

源码：`src/editor.ts:1905`

渲染article content，并保持模型、界面和持久化状态的一致性。

```ts
private renderArticleContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean): void
```

### 方法 `MindMapEditor.renderArticle`

源码：`src/editor.ts:1943`

渲染文章目录页、章节编号、正文和跨子导图链接。顶层父导图可展示递归目录；子导图根据文章上下文继续父级编号。

```ts
private renderArticle(): void
```

### 方法 `MindMapEditor.render`

源码：`src/editor.ts:2016`

渲染相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private render(): void
```

### 方法 `MindMapEditor.renderMindMap`

源码：`src/editor.ts:2035`

渲染可交互导图画布：计算布局、绘制连接线和节点、恢复选择状态、绑定拖拽与尺寸手柄、安装子导图整节点入口，并启动图片镜像加载探测。

```ts
private renderMindMap(): void
```

### 方法 `MindMapEditor.applyTransform`

源码：`src/editor.ts:2393`

应用transform，并保持模型、界面和持久化状态的一致性。

```ts
private applyTransform(): void
```

### 方法 `MindMapEditor.selectNode`

源码：`src/editor.ts:2405`

执行“select node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private selectNode(id: string | null): void
```

### 方法 `MindMapEditor.selectedNode`

源码：`src/editor.ts:2419`

执行“selected node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private selectedNode(): MindMapNode | null
```

### 方法 `MindMapEditor.createConfiguredNode`

源码：`src/editor.ts:2429`

创建configured node，并保持模型、界面和持久化状态的一致性。

```ts
private createConfiguredNode(text = "新节点"): MindMapNode
```

### 方法 `MindMapEditor.addChild`

源码：`src/editor.ts:2438`

添加child，并保持模型、界面和持久化状态的一致性。

```ts
private addChild(): void
```

### 方法 `MindMapEditor.addSibling`

源码：`src/editor.ts:2453`

添加sibling，并保持模型、界面和持久化状态的一致性。

```ts
private addSibling(): void
```

### 方法 `MindMapEditor.editSelected`

源码：`src/editor.ts:2474`

编辑selected，并保持模型、界面和持久化状态的一致性。

```ts
private editSelected(): void
```

### 方法 `MindMapEditor.deleteSelected`

源码：`src/editor.ts:2531`

删除selected，并保持模型、界面和持久化状态的一致性。

```ts
private deleteSelected(): void
```

### 方法 `MindMapEditor.toggleCollapse`

源码：`src/editor.ts:2548`

切换collapse，并保持模型、界面和持久化状态的一致性。

```ts
private toggleCollapse(): void
```

### 方法 `MindMapEditor.cycleTask`

源码：`src/editor.ts:2562`

切换task，并保持模型、界面和持久化状态的一致性。

```ts
private cycleTask(): void
```

### 方法 `MindMapEditor.toggleLayout`

源码：`src/editor.ts:2573`

切换layout，并保持模型、界面和持久化状态的一致性。

```ts
private toggleLayout(): void
```

### 方法 `MindMapEditor.editAppearance`

源码：`src/editor.ts:2582`

编辑appearance，并保持模型、界面和持久化状态的一致性。

```ts
private editAppearance(): void
```

### 方法 `MindMapEditor.editTable`

源码：`src/editor.ts:2595`

编辑table，并保持模型、界面和持久化状态的一致性。

```ts
private editTable(): void
```

### 方法 `MindMapEditor.convertChildrenToTable`

源码：`src/editor.ts:2606`

转换children to table，并保持模型、界面和持久化状态的一致性。

```ts
private convertChildrenToTable(): void
```

### 方法 `MindMapEditor.removeTable`

源码：`src/editor.ts:2621`

删除table，并保持模型、界面和持久化状态的一致性。

```ts
private removeTable(): void
```

### 方法 `MindMapEditor.editCode`

源码：`src/editor.ts:2634`

编辑code，并保持模型、界面和持久化状态的一致性。

```ts
private editCode(): void
```

### 方法 `MindMapEditor.removeCode`

源码：`src/editor.ts:2645`

删除code，并保持模型、界面和持久化状态的一致性。

```ts
private removeCode(): void
```

### 方法 `MindMapEditor.createOrOpenSubmap`

源码：`src/editor.ts:2656`

如果节点已有子导图则打开；否则创建独立 .mindmap 文件并在父节点与子文件导航元数据中建立双向关系。

```ts
private async createOrOpenSubmap(): Promise<void>
```

### 方法 `MindMapEditor.renderNodeTable`

源码：`src/editor.ts:2679`

渲染node table，并保持模型、界面和持久化状态的一致性。

```ts
private renderNodeTable(content: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.renderNodeCode`

源码：`src/editor.ts:2707`

渲染node code，并保持模型、界面和持久化状态的一致性。

```ts
private renderNodeCode(content: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.handlePaste`

源码：`src/editor.ts:2731`

处理编辑器内粘贴：优先识别图片并保存为本地资源，其次识别表格、代码块、JSON 分支或普通文本。图片可按设置进入延迟自动上传流程。

```ts
private async handlePaste(event: ClipboardEvent): Promise<void>
```

### 方法 `MindMapEditor.openSelectedLink`

源码：`src/editor.ts:2791`

打开selected link，并保持模型、界面和持久化状态的一致性。

```ts
private openSelectedLink(): void
```

### 方法 `MindMapEditor.isParentNavigationBacklink`

源码：`src/editor.ts:2808`

判断parent navigation backlink，并保持模型、界面和持久化状态的一致性。

```ts
private isParentNavigationBacklink(node: MindMapNode): boolean
```

### 方法 `MindMapEditor.getNodeLink`

源码：`src/editor.ts:2825`

读取并返回node link，并保持模型、界面和持久化状态的一致性。

```ts
private getNodeLink(node: MindMapNode): string | null
```

### 方法 `MindMapEditor.showOutline`

源码：`src/editor.ts:2834`

执行“show outline”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private showOutline(): void
```

### 方法 `MindMapEditor.showJsonTransfer`

源码：`src/editor.ts:2842`

执行“show json transfer”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private showJsonTransfer(): void
```

### 方法 `MindMapEditor.openSearch`

源码：`src/editor.ts:2855`

打开search，并保持模型、界面和持久化状态的一致性。

```ts
private openSearch(): void
```

### 方法 `MindMapEditor.focusNode`

源码：`src/editor.ts:2865`

定位指定节点。必要时先展开全部祖先、切换到可显示该节点的视图并重渲染，然后选中节点并将其平滑移动到可视区域中央。

```ts
private focusNode(id: string): void
```

### 方法 `MindMapEditor.centerNode`

源码：`src/editor.ts:2890`

定位node，并保持模型、界面和持久化状态的一致性。

```ts
private centerNode(id: string): void
```

### 方法 `MindMapEditor.openContextMenu`

源码：`src/editor.ts:2904`

打开context menu，并保持模型、界面和持久化状态的一致性。

```ts
private openContextMenu(event: MouseEvent): void
```

### 方法 `MindMapEditor.copySelectedBranch`

源码：`src/editor.ts:2954`

复制selected branch，并保持模型、界面和持久化状态的一致性。

```ts
private async copySelectedBranch(): Promise<boolean>
```

### 方法 `MindMapEditor.pasteAsChild`

源码：`src/editor.ts:2971`

粘贴as child，并保持模型、界面和持久化状态的一致性。

```ts
private async pasteAsChild(): Promise<void>
```

### 方法 `MindMapEditor.parseClipboardNode`

源码：`src/editor.ts:2999`

解析clipboard node，并保持模型、界面和持久化状态的一致性。

```ts
private parseClipboardNode(text: string): MindMapNode | null
```

### 方法 `MindMapEditor.duplicateSelected`

源码：`src/editor.ts:3013`

复制生成selected，并保持模型、界面和持久化状态的一致性。

```ts
private duplicateSelected(): void
```

### 方法 `MindMapEditor.canReparent`

源码：`src/editor.ts:3037`

判断reparent，并保持模型、界面和持久化状态的一致性。

```ts
private canReparent(draggedId: string | null, targetId: string): boolean
```

### 方法 `MindMapEditor.reparentNode`

源码：`src/editor.ts:3049`

执行“reparent node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private reparentNode(draggedId: string, targetId: string): void
```

### 方法 `MindMapEditor.replaceDocument`

源码：`src/editor.ts:3068`

替换document，并保持模型、界面和持久化状态的一致性。

```ts
private replaceDocument(document: MindMapDocument): void
```

### 方法 `MindMapEditor.mutate`

源码：`src/editor.ts:3087`

所有用户可撤销写操作的统一入口。调用前克隆当前文档写入撤销栈，执行修改，规范化和重渲染，再通知视图自动保存；只读状态会在更上层阻止进入该流程。

```ts
private mutate(action: () => void): void
```

### 方法 `MindMapEditor.trimHistory`

源码：`src/editor.ts:3101`

裁剪history，并保持模型、界面和持久化状态的一致性。

```ts
private trimHistory(): void
```

### 方法 `MindMapEditor.undo`

源码：`src/editor.ts:3109`

撤销相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private undo(): void
```

### 方法 `MindMapEditor.redo`

源码：`src/editor.ts:3124`

重做相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private redo(): void
```

### 方法 `MindMapEditor.fitToView`

源码：`src/editor.ts:3140`

执行“fit to view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private fitToView(): void
```

### 方法 `MindMapEditor.setZoom`

源码：`src/editor.ts:3157`

更新并应用zoom，并保持模型、界面和持久化状态的一致性。

```ts
private setZoom(value: number): void
```

### 方法 `MindMapEditor.clampZoom`

源码：`src/editor.ts:3168`

执行“clamp zoom”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private clampZoom(value: number): number
```

### 方法 `MindMapEditor.navigateSelection`

源码：`src/editor.ts:3177`

执行“navigate selection”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private navigateSelection(direction: "parent" | "child" | "previous" | "next"): void
```

### 方法 `MindMapEditor.handleKeydown`

源码：`src/editor.ts:3201`

处理keydown，并保持模型、界面和持久化状态的一致性。

```ts
private handleKeydown(event: KeyboardEvent): void
```

## `src/global-search.ts`

本地全局搜索索引与导图族搜索模块。

### 接口 `MindMapSearchEntry`

源码：`src/global-search.ts:21`

MindMapSearchEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchEntry
```

### 接口 `MindMapSearchResult`

源码：`src/global-search.ts:45`

MindMapSearchResult 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchResult extends MindMapSearchEntry
```

### 接口 `IndexedMindMapFile`

源码：`src/global-search.ts:54`

IndexedMindMapFile 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface IndexedMindMapFile
```

### 接口 `PersistedMindMapSearchIndex`

源码：`src/global-search.ts:65`

PersistedMindMapSearchIndex 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface PersistedMindMapSearchIndex
```

### 接口 `MindMapSearchIndexStatus`

源码：`src/global-search.ts:74`

MindMapSearchIndexStatus 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchIndexStatus
```

### 函数 `normalized`

源码：`src/global-search.ts:88`

校验并规范化d，并保持模型、界面和持久化状态的一致性。

```ts
function normalized(value: string): string
```

### 函数 `compact`

源码：`src/global-search.ts:99`

执行“compact”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function compact(value: string | undefined, max = 180): string | undefined
```

### 函数 `nodeDisplayText`

源码：`src/global-search.ts:111`

执行“node display text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function nodeDisplayText(node: MindMapNode): string
```

### 函数 `fieldValues`

源码：`src/global-search.ts:126`

执行“field values”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function fieldValues(node: MindMapNode): Array<
```

### 函数 `buildSearchEntries`

源码：`src/global-search.ts:153`

构建search entries，并保持模型、界面和持久化状态的一致性。

```ts
export function buildSearchEntries(document: MindMapDocument, filePath: string): MindMapSearchEntry[]
```

### 函数 `mergeHierarchy`

源码：`src/global-search.ts:195`

合并hierarchy，并保持模型、界面和持久化状态的一致性。

```ts
function mergeHierarchy(prefix: string[], suffix: string[]): string[]
```

### 函数 `resolveHierarchicalEntries`

源码：`src/global-search.ts:209`

Resolve parent/child map relations into paths such as 古诗 › 唐诗 › 李白.

```ts
export function resolveHierarchicalEntries(files: Record<string, IndexedMindMapFile>): MindMapSearchEntry[]
```

### 函数 `resultSnippet`

源码：`src/global-search.ts:278`

执行“result snippet”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function resultSnippet(entry: MindMapSearchEntry, query: string):
```

### 函数 `searchEntries`

源码：`src/global-search.ts:303`

执行“search entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function searchEntries(entries: MindMapSearchEntry[], query: string, limit = 100): MindMapSearchResult[]
```

### 函数 `collectIndexedFamilyPaths`

源码：`src/global-search.ts:338`

从当前文件向上寻找最顶层父导图，再向下递归收集全部后代子导图，形成 Ctrl/Cmd+F 使用的“当前导图族”搜索范围。

```ts
export function collectIndexedFamilyPaths( files: Record<string,
```

### 类 `MindMapSearchIndex`

源码：`src/global-search.ts:365`

MindMapSearchIndex 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapSearchIndex
```

### 构造函数 `MindMapSearchIndex.constructor`

源码：`src/global-search.ts:380`

创建 MindMapSearchIndex 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( private readonly app: App, private readonly indexPath: string, private readonly extension = "mindmap" )
```

### 方法 `MindMapSearchIndex.initialize`

源码：`src/global-search.ts:389`

执行“initialize”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async initialize(): Promise<void>
```

### 方法 `MindMapSearchIndex.destroy`

源码：`src/global-search.ts:397`

执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
destroy(): void
```

### 方法 `MindMapSearchIndex.getStatus`

源码：`src/global-search.ts:408`

读取并返回status，并保持模型、界面和持久化状态的一致性。

```ts
getStatus(): MindMapSearchIndexStatus
```

### 方法 `MindMapSearchIndex.allEntries`

源码：`src/global-search.ts:420`

执行“all entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
allEntries(filePaths?: ReadonlySet<string>): MindMapSearchEntry[]
```

### 方法 `MindMapSearchIndex.getScopedStatus`

源码：`src/global-search.ts:433`

读取并返回scoped status，并保持模型、界面和持久化状态的一致性。

```ts
getScopedStatus(filePaths: ReadonlySet<string>):
```

### 方法 `MindMapSearchIndex.search`

源码：`src/global-search.ts:454`

执行“search”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
search(query: string, limit = 100, filePaths?: ReadonlySet<string>): MindMapSearchResult[]
```

### 方法 `MindMapSearchIndex.refreshFamily`

源码：`src/global-search.ts:464`

Refresh a parent map and every recursively linked child map, then return the exact set of files that belongs to that map family. This is deliberately on-demand so an existing child map is searchable without recreating it or manually rebuilding the whole-vault index.

```ts
async refreshFamily(rootPath: string, currentDocument?: MindMapDocument): Promise<Set<string>>
```

### 方法 `MindMapSearchIndex.queueFile`

源码：`src/global-search.ts:546`

执行“queue file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
queueFile(file: TFile, delay = 500): void
```

### 方法 `MindMapSearchIndex.removeFile`

源码：`src/global-search.ts:562`

删除file，并保持模型、界面和持久化状态的一致性。

```ts
removeFile(path: string): void
```

### 方法 `MindMapSearchIndex.renameFile`

源码：`src/global-search.ts:576`

执行“rename file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
renameFile(file: TFile, oldPath: string): void
```

### 方法 `MindMapSearchIndex.rebuildAll`

源码：`src/global-search.ts:584`

重建all，并保持模型、界面和持久化状态的一致性。

```ts
async rebuildAll(): Promise<void>
```

### 方法 `MindMapSearchIndex.rebuildChangedFiles`

源码：`src/global-search.ts:593`

重建changed files，并保持模型、界面和持久化状态的一致性。

```ts
private async rebuildChangedFiles(): Promise<void>
```

### 方法 `MindMapSearchIndex.performRebuild`

源码：`src/global-search.ts:605`

执行全量或增量索引重建。它比较文件修改时间，仅解析变化的 .mindmap 文件，删除失效记录，随后重新解析跨文件层级并安排持久化。

```ts
private async performRebuild(force: boolean): Promise<void>
```

### 方法 `MindMapSearchIndex.indexFile`

源码：`src/global-search.ts:632`

读取并解析单个 .mindmap 文件，生成节点级搜索条目和子导图引用。读取或解析失败时移除该文件的旧索引，防止返回过期结果。

```ts
private async indexFile(file: TFile): Promise<void>
```

### 方法 `MindMapSearchIndex.walkNodes`

源码：`src/global-search.ts:657`

递归遍历nodes，并保持模型、界面和持久化状态的一致性。

```ts
private *walkNodes(root: MindMapNode): Generator<MindMapNode>
```

### 方法 `MindMapSearchIndex.resolveSubmapFile`

源码：`src/global-search.ts:674`

解析并确定submap file，并保持模型、界面和持久化状态的一致性。

```ts
private resolveSubmapFile(rawPath: string | undefined, sourcePath: string): TFile | null
```

### 方法 `MindMapSearchIndex.load`

源码：`src/global-search.ts:688`

加载相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private async load(): Promise<void>
```

### 方法 `MindMapSearchIndex.scheduleSave`

源码：`src/global-search.ts:716`

安排延迟执行save，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleSave(): void
```

### 方法 `MindMapSearchIndex.saveNow`

源码：`src/global-search.ts:727`

保存now，并保持模型、界面和持久化状态的一致性。

```ts
private async saveNow(): Promise<void>
```

### 函数 `appendHighlightedText`

源码：`src/global-search.ts:743`

执行“append highlighted text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function appendHighlightedText(container: HTMLElement, text: string, query: string): void
```

### 类 `GlobalMindMapSearchModal`

源码：`src/global-search.ts:764`

GlobalMindMapSearchModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class GlobalMindMapSearchModal extends Modal
```

### 构造函数 `GlobalMindMapSearchModal.constructor`

源码：`src/global-search.ts:783`

创建 GlobalMindMapSearchModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, private readonly index: MindMapSearchIndex, private readonly maxResults: number, private readonly onOpenResult: (result: MindMapSearchResult) => void | Promise<void>, private readonly onRebuild: () => Promise<void>, private readonly s…
```

### 方法 `GlobalMindMapSearchModal.onOpen`

源码：`src/global-search.ts:799`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `GlobalMindMapSearchModal.onClose`

源码：`src/global-search.ts:848`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 方法 `GlobalMindMapSearchModal.renderResults`

源码：`src/global-search.ts:857`

渲染results，并保持模型、界面和持久化状态的一致性。

```ts
private renderResults(query: string): void
```

### 方法 `GlobalMindMapSearchModal.moveActive`

源码：`src/global-search.ts:908`

执行“move active”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private moveActive(delta: number): void
```

### 方法 `GlobalMindMapSearchModal.setActive`

源码：`src/global-search.ts:919`

更新并应用active，并保持模型、界面和持久化状态的一致性。

```ts
private setActive(index: number): void
```

### 方法 `GlobalMindMapSearchModal.openResult`

源码：`src/global-search.ts:931`

打开result，并保持模型、界面和持久化状态的一致性。

```ts
private async openResult(result: MindMapSearchResult): Promise<void>
```

## `src/layout.ts`

思维导图布局计算与 SVG 导出模块。

### 接口 `NodePosition`

源码：`src/layout.ts:13`

NodePosition 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface NodePosition
```

### 接口 `LayoutResult`

源码：`src/layout.ts:27`

LayoutResult 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface LayoutResult
```

### 函数 `visibleChildren`

源码：`src/layout.ts:47`

执行“visible children”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function visibleChildren(node: MindMapNode): MindMapNode[]
```

### 函数 `estimatedTextLines`

源码：`src/layout.ts:59`

执行“estimated text lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function estimatedTextLines(text: string, width: number, fontSize: number): number
```

### 函数 `nodeDimensions`

源码：`src/layout.ts:74`

执行“node dimensions”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function nodeDimensions(node: MindMapNode, depth: number, defaultFontSize = 14):
```

### 函数 `subtreeHeight`

源码：`src/layout.ts:128`

执行“subtree height”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function subtreeHeight(node: MindMapNode, depth: number, defaultFontSize = 14): number
```

### 函数 `layoutBranch`

源码：`src/layout.ts:149`

执行“layout branch”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function layoutBranch( node: MindMapNode, parentId: string, parentX: number, parentWidth: number, side: -1 | 1, depth: number, centerY: number, output: NodePosition[], defaultFontSize = 14 ): void
```

### 函数 `computeLayout`

源码：`src/layout.ts:186`

计算当前可见节点的尺寸、坐标、深度和整体边界。折叠节点的后代不会参与布局；节点自定义宽度和最小高度会直接影响子树占位与连接线端点。

```ts
export function computeLayout(root: MindMapNode, mode: LayoutMode, defaultFontSize = 14): LayoutResult
```

### 函数 `buildBranchColorMap`

源码：`src/layout.ts:248`

构建branch color map，并保持模型、界面和持久化状态的一致性。

```ts
export function buildBranchColorMap(root: MindMapNode, colors: string[] | undefined): Map<string, string>
```

### 函数 `edgeWidthForDepth`

源码：`src/layout.ts:268`

根据连接线模式计算指定层级的线宽。统一模式始终返回起始宽度；渐细模式会按当前实际最大深度插值，并保证最深层达到最小宽度。

```ts
export function edgeWidthForDepth(appearance: MindMapAppearance, depth: number, maxDepth = 5): number
```

### 函数 `edgePath`

源码：`src/layout.ts:288`

执行“edge path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function edgePath(parent: NodePosition, child: NodePosition, style: EdgeStyle = "curved"): string
```

### 函数 `escapeXml`

源码：`src/layout.ts:303`

转义xml，并保持模型、界面和持久化状态的一致性。

```ts
export function escapeXml(value: string): string
```

### 函数 `validColor`

源码：`src/layout.ts:317`

执行“valid color”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function validColor(value: string | undefined, fallback: string): string
```

### 函数 `svgRadius`

源码：`src/layout.ts:327`

执行“svg radius”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgRadius(shape: NodeShape | undefined): number
```

### 函数 `taskGlyph`

源码：`src/layout.ts:339`

执行“task glyph”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function taskGlyph(node: MindMapNode): string
```

### 函数 `truncateRuns`

源码：`src/layout.ts:353`

执行“truncate runs”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function truncateRuns(runs: MindMapTextRun[], maxLength: number): MindMapTextRun[]
```

### 函数 `richTextTspans`

源码：`src/layout.ts:382`

执行“rich text tspans”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function richTextTspans(runs: MindMapTextRun[] | undefined, fallbackText: string, prefix: string, foreground: string, maxChars = 160): string
```

### 函数 `svgWrappedLines`

源码：`src/layout.ts:409`

执行“svg wrapped lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgWrappedLines(text: string, width: number, fontSize: number): string[]
```

### 函数 `svgFontFamily`

源码：`src/layout.ts:427`

执行“svg font family”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgFontFamily(mode: FontFamilyMode | undefined, customFont: string | undefined): string
```

### 函数 `documentToSvg`

源码：`src/layout.ts:444`

使用与编辑画布一致的布局、文本对齐、节点尺寸、主题颜色、富文本和渐细连线生成独立 SVG 字符串。导出过程不依赖 DOM。

```ts
export function documentToSvg(root: MindMapNode, mode: LayoutMode, title: string, appearance: MindMapAppearance =
```

## `src/main.ts`

插件入口与跨文件服务层。

### 类 `MindMapStudioPlugin`

源码：`src/main.ts:57`

MindMapStudioPlugin 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export default class MindMapStudioPlugin extends Plugin
```

### 方法 `MindMapStudioPlugin.onload`

源码：`src/main.ts:67`

执行“onload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async onload(): Promise<void>
```

### 方法 `MindMapStudioPlugin.onunload`

源码：`src/main.ts:222`

执行“onunload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
onunload(): void
```

### 方法 `MindMapStudioPlugin.openGlobalSearch`

源码：`src/main.ts:232`

打开global search，并保持模型、界面和持久化状态的一致性。

```ts
openGlobalSearch(): void
```

### 方法 `MindMapStudioPlugin.openGlobalSearchAfterIndexReady`

源码：`src/main.ts:239`

打开global search after index ready，并保持模型、界面和持久化状态的一致性。

```ts
private async openGlobalSearchAfterIndexReady(): Promise<void>
```

### 方法 `MindMapStudioPlugin.openMapFamilySearch`

源码：`src/main.ts:256`

打开map family search，并保持模型、界面和持久化状态的一致性。

```ts
async openMapFamilySearch(file: TFile, currentDocument?: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.rebuildGlobalSearchIndex`

源码：`src/main.ts:278`

重建global search index，并保持模型、界面和持久化状态的一致性。

```ts
async rebuildGlobalSearchIndex(): Promise<void>
```

### 方法 `MindMapStudioPlugin.getGlobalSearchIndexStatus`

源码：`src/main.ts:288`

读取并返回global search index status，并保持模型、界面和持久化状态的一致性。

```ts
getGlobalSearchIndexStatus()
```

### 方法 `MindMapStudioPlugin.openGlobalSearchResult`

源码：`src/main.ts:297`

打开global search result，并保持模型、界面和持久化状态的一致性。

```ts
private async openGlobalSearchResult(result: MindMapSearchResult): Promise<void>
```

### 方法 `MindMapStudioPlugin.loadSettings`

源码：`src/main.ts:310`

加载settings，并保持模型、界面和持久化状态的一致性。

```ts
async loadSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.saveSettings`

源码：`src/main.ts:419`

保存settings，并保持模型、界面和持久化状态的一致性。

```ts
async saveSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.setGlobalDisplayMode`

源码：`src/main.ts:429`

保存全局显示模式并通知所有已打开 MindMapStudioView 同步切换。之后打开的父导图、子导图和普通导图都会继承该模式。

```ts
async setGlobalDisplayMode(mode: DisplayMode): Promise<void>
```

### 方法 `MindMapStudioPlugin.resetAllSettings`

源码：`src/main.ts:443`

执行“reset all settings”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async resetAllSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.refreshOpenViews`

源码：`src/main.ts:452`

刷新open views，并保持模型、界面和持久化状态的一致性。

```ts
refreshOpenViews(): void
```

### 方法 `MindMapStudioPlugin.createConfiguredDocument`

源码：`src/main.ts:464`

创建configured document，并保持模型、界面和持久化状态的一致性。

```ts
createConfiguredDocument(title: string): MindMapDocument
```

### 方法 `MindMapStudioPlugin.resolveMindMapFile`

源码：`src/main.ts:480`

解析并确定mind map file，并保持模型、界面和持久化状态的一致性。

```ts
private resolveMindMapFile(path: string, sourcePath = ""): TFile | null
```

### 方法 `MindMapStudioPlugin.readMindMapDocument`

源码：`src/main.ts:495`

执行“read mind map document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async readMindMapDocument(file: TFile): Promise<MindMapDocument>
```

### 方法 `MindMapStudioPlugin.findNodeDepth`

源码：`src/main.ts:506`

查找node depth，并保持模型、界面和持久化状态的一致性。

```ts
private findNodeDepth(root: MindMapNode, nodeId: string): number | null
```

### 方法 `MindMapStudioPlugin.computeArticleBaseDepth`

源码：`src/main.ts:526`

执行“compute article base depth”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async computeArticleBaseDepth(file: TFile, document: MindMapDocument, visited = new Set<string>()): Promise<number>
```

### 方法 `MindMapStudioPlugin.buildArticleContext`

源码：`src/main.ts:555`

沿子导图 navigation.parentPath 逐级回溯父文件，计算当前子导图在整篇文章中的基础标题深度、完整面包屑和顶层目录数据，并防止循环引用。

```ts
async buildArticleContext(file: TFile, document: MindMapDocument): Promise<
```

### 类型 `Item`

源码：`src/main.ts:566`

Item 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
type Item =
```

### 方法 `MindMapStudioPlugin.getAvailablePath`

源码：`src/main.ts:633`

读取并返回available path，并保持模型、界面和持久化状态的一致性。

```ts
async getAvailablePath(preferredPath: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.createMindMap`

源码：`src/main.ts:650`

创建mind map，并保持模型、界面和持久化状态的一致性。

```ts
async createMindMap(options:
```

### 方法 `MindMapStudioPlugin.openAsMindMap`

源码：`src/main.ts:680`

打开as mind map，并保持模型、界面和持久化状态的一致性。

```ts
async openAsMindMap(file: TFile, preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.savePastedImage`

源码：`src/main.ts:701`

保存pasted image，并保持模型、界面和持久化状态的一致性。

```ts
async savePastedImage(blob: Blob, suggestedName: string, sourceFile: TFile | null): Promise<string>
```

### 方法 `MindMapStudioPlugin.readImageSource`

源码：`src/main.ts:727`

执行“read image source”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async readImageSource(source: string, sourceFile: TFile | null): Promise<
```

### 方法 `MindMapStudioPlugin.getImageHostChoices`

源码：`src/main.ts:743`

读取并返回image host choices，并保持模型、界面和持久化状态的一致性。

```ts
getImageHostChoices(): ImageHostChoice[]
```

### 方法 `MindMapStudioPlugin.getDefaultUploadHostIds`

源码：`src/main.ts:753`

读取并返回default upload host ids，并保持模型、界面和持久化状态的一致性。

```ts
getDefaultUploadHostIds(): string[]
```

### 方法 `MindMapStudioPlugin.uploadImageToHosts`

源码：`src/main.ts:767`

把同一张图片上传到多个已配置图床，分别收集成功与失败结果。只有所有选中图床成功且文档保存完成后，调用方才允许删除本地文件。

```ts
async uploadImageToHosts(blob: Blob, suggestedName: string, hostIds: string[]): Promise<ImageHostUploadBatch>
```

### 方法 `MindMapStudioPlugin.testImageHost`

源码：`src/main.ts:799`

执行“test image host”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async testImageHost(hostId: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.scheduleAutoUpload`

源码：`src/main.ts:838`

安排延迟执行auto upload，并保持模型、界面和持久化状态的一致性。

```ts
scheduleAutoUpload(file: TFile | null, nodeId: string, blockId: string, localPath: string, suggestedName: string): boolean
```

### 方法 `MindMapStudioPlugin.runAutoUploadTask`

源码：`src/main.ts:868`

执行延迟自动上传任务。它确认节点和图片块仍存在、读取本地资源、上传到默认图床、更新远程镜像列表并保存；任一图床失败时保留本地文件。

```ts
private async runAutoUploadTask( mindMapPath: string, nodeId: string, blockId: string, localPath: string, suggestedName: string, hostIds: string[] ): Promise<void>
```

### 方法 `MindMapStudioPlugin.uploadImageToHostConfig`

源码：`src/main.ts:938`

上传image to host config，并保持模型、界面和持久化状态的一致性。

```ts
private async uploadImageToHostConfig(host: ImageHostConfig, blob: Blob, suggestedName: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.flushOpenView`

源码：`src/main.ts:997`

执行“flush open view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async flushOpenView(path: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.refreshOpenMindMap`

源码：`src/main.ts:1009`

刷新open mind map，并保持模型、界面和持久化状态的一致性。

```ts
private async refreshOpenMindMap(file: TFile, document: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.deleteLocalAssetIfSafe`

源码：`src/main.ts:1025`

在删除本地图片前进行最终安全检查：远程源必须存在、当前文档必须已保存、资源路径必须是仓库内文件且没有其他节点继续引用。

```ts
private async deleteLocalAssetIfSafe(localPath: string, currentMindMapPath: string, blockId: string): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.mimeFromFilename`

源码：`src/main.ts:1060`

执行“mime from filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private mimeFromFilename(filename: string): string
```

### 方法 `MindMapStudioPlugin.createSubmapFile`

源码：`src/main.ts:1073`

在父导图资源目录下创建子导图文件，写入 parentPath、parentNodeId 和 parentTitle，并把生成路径回写到父节点，实现可靠的双向导航。

```ts
async createSubmapFile(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap>
```

### 方法 `MindMapStudioPlugin.openMindMapPath`

源码：`src/main.ts:1109`

打开mind map path，并保持模型、界面和持久化状态的一致性。

```ts
async openMindMapPath(path: string, sourcePath = "", preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.ensureFolderPath`

源码：`src/main.ts:1125`

执行“ensure folder path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async ensureFolderPath(folder: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.migrateLegacyFile`

源码：`src/main.ts:1143`

迁移legacy file，并保持模型、界面和持久化状态的一致性。

```ts
async migrateLegacyFile(file: TFile, openAfter = true): Promise<TFile | null>
```

### 方法 `MindMapStudioPlugin.isMindMapFile`

源码：`src/main.ts:1181`

判断mind map file，并保持模型、界面和持久化状态的一致性。

```ts
isMindMapFile(file: TFile): boolean
```

### 方法 `MindMapStudioPlugin.isLegacyMindMapFile`

源码：`src/main.ts:1191`

判断legacy mind map file，并保持模型、界面和持久化状态的一致性。

```ts
isLegacyMindMapFile(file: TFile): boolean
```

### 方法 `MindMapStudioPlugin.convertMarkdownFile`

源码：`src/main.ts:1200`

转换markdown file，并保持模型、界面和持久化状态的一致性。

```ts
private async convertMarkdownFile(file: TFile): Promise<void>
```

### 方法 `MindMapStudioPlugin.resolveFolder`

源码：`src/main.ts:1217`

解析并确定folder，并保持模型、界面和持久化状态的一致性。

```ts
private async resolveFolder(explicitFolder: string | undefined, activeFile: TFile | null): Promise<string>
```

### 方法 `MindMapStudioPlugin.buildNewTitle`

源码：`src/main.ts:1231`

构建new title，并保持模型、界面和持久化状态的一致性。

```ts
private buildNewTitle(): string
```

### 方法 `MindMapStudioPlugin.sanitizeFilename`

源码：`src/main.ts:1244`

执行“sanitize filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private sanitizeFilename(value: string): string
```

### 方法 `MindMapStudioPlugin.getSourceTitle`

源码：`src/main.ts:1254`

读取并返回source title，并保持模型、界面和持久化状态的一致性。

```ts
private getSourceTitle(context: MarkdownPostProcessorContext): string
```

### 方法 `MindMapStudioPlugin.processMindMapEmbeds`

源码：`src/main.ts:1266`

注册 Markdown 代码块静态渲染，并在阅读模式中解析嵌入的思维导图源。静态预览不会修改原文件。

```ts
private async processMindMapEmbeds(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<void>
```

## `src/model.ts`

MindMap Studio 的领域模型与序列化层。

### 类型 `LayoutMode`

源码：`src/model.ts:11`

定义 .mindmap 稳定数据结构，并负责旧版本兼容、字段规范化、富文本、内容块、节点树、Markdown 导入导出及图片镜像候选源排序。

```ts
export type LayoutMode = "right" | "balanced";
```

### 类型 `DisplayMode`

源码：`src/model.ts:15`

DisplayMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type DisplayMode = "mindmap" | "outline" | "article";
```

### 类型 `ThemeMode`

源码：`src/model.ts:19`

ThemeMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ThemeMode = "auto" | "light" | "dark";
```

### 类型 `NodeShape`

源码：`src/model.ts:23`

NodeShape 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type NodeShape = "rounded" | "pill" | "rectangle";
```

### 类型 `TaskStatus`

源码：`src/model.ts:27`

TaskStatus 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type TaskStatus = "todo" | "doing" | "done";
```

### 类型 `BackgroundPattern`

源码：`src/model.ts:31`

BackgroundPattern 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type BackgroundPattern = "none" | "grid" | "dots";
```

### 类型 `EdgeStyle`

源码：`src/model.ts:35`

EdgeStyle 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type EdgeStyle = "curved" | "straight" | "elbow";
```

### 类型 `EdgeWidthMode`

源码：`src/model.ts:39`

EdgeWidthMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type EdgeWidthMode = "uniform" | "tapered";
```

### 类型 `MindMapThemePresetId`

源码：`src/model.ts:43`

MindMapThemePresetId 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type MindMapThemePresetId = | "classic-indigo" | "ocean-blue" | "forest-green" | "sunset-orange" | "lavender-dream" | "candy-pop" | "paper-note" | "minimal-ink" | "dark-neon" | "mint-clean";
```

### 类型 `FontFamilyMode`

源码：`src/model.ts:57`

FontFamilyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type FontFamilyMode = "obsidian" | "sans" | "serif" | "mono" | "custom";
```

### 类型 `TableAlignment`

源码：`src/model.ts:61`

TableAlignment 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type TableAlignment = "left" | "center" | "right";
```

### 类型 `NodeTextAlign`

源码：`src/model.ts:65`

NodeTextAlign 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type NodeTextAlign = "left" | "center" | "right";
```

### 接口 `MindMapTextStyle`

源码：`src/model.ts:70`

MindMapTextStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextStyle
```

### 接口 `MindMapTextRun`

源码：`src/model.ts:81`

MindMapTextRun 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextRun
```

### 接口 `MindMapTable`

源码：`src/model.ts:89`

MindMapTable 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTable
```

### 接口 `MindMapCodeBlock`

源码：`src/model.ts:99`

MindMapCodeBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapCodeBlock
```

### 接口 `MindMapTextContentBlock`

源码：`src/model.ts:107`

MindMapTextContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextContentBlock
```

### 接口 `MindMapImageRemoteSource`

源码：`src/model.ts:117`

MindMapImageRemoteSource 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageRemoteSource
```

### 接口 `MindMapImageSourceCandidate`

源码：`src/model.ts:130`

MindMapImageSourceCandidate 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageSourceCandidate
```

### 接口 `MindMapImageContentBlock`

源码：`src/model.ts:141`

MindMapImageContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageContentBlock
```

### 类型 `MindMapContentBlock`

源码：`src/model.ts:155`

MindMapContentBlock 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type MindMapContentBlock = MindMapTextContentBlock | MindMapImageContentBlock;
```

### 接口 `MindMapSubmap`

源码：`src/model.ts:160`

MindMapSubmap 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSubmap
```

### 接口 `MindMapNavigation`

源码：`src/model.ts:168`

MindMapNavigation 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNavigation
```

### 接口 `MindMapAppearance`

源码：`src/model.ts:178`

MindMapAppearance 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapAppearance
```

### 接口 `MindMapNodeStyle`

源码：`src/model.ts:208`

MindMapNodeStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNodeStyle
```

### 接口 `MindMapNode`

源码：`src/model.ts:226`

MindMapNode 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNode
```

### 接口 `MindMapDocumentView`

源码：`src/model.ts:251`

MindMapDocumentView 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapDocumentView
```

### 接口 `MindMapDocument`

源码：`src/model.ts:259`

MindMapDocument 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapDocument
```

### 接口 `TaskProgress`

源码：`src/model.ts:273`

TaskProgress 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface TaskProgress
```

### 函数 `newId`

源码：`src/model.ts:285`

执行“new id”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function newId(): string
```

### 函数 `createNode`

源码：`src/model.ts:296`

创建node，并保持模型、界面和持久化状态的一致性。

```ts
export function createNode(text = "新节点"): MindMapNode
```

### 函数 `createDefaultDocument`

源码：`src/model.ts:306`

创建default document，并保持模型、界面和持久化状态的一致性。

```ts
export function createDefaultDocument(title = "新思维导图"): MindMapDocument
```

### 函数 `normalizeColor`

源码：`src/model.ts:329`

校验并规范化color，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeColor(value: unknown): string | undefined
```

### 函数 `normalizeNumber`

源码：`src/model.ts:343`

校验并规范化number，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNumber(value: unknown, min: number, max: number): number | undefined
```

### 函数 `normalizeBooleanOverride`

源码：`src/model.ts:354`

校验并规范化boolean override，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeBooleanOverride(value: unknown): boolean | undefined
```

### 函数 `normalizeAppearance`

源码：`src/model.ts:364`

校验并规范化appearance，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeAppearance(input: Partial<MindMapAppearance> | undefined): MindMapAppearance | undefined
```

### 函数 `mergeAppearance`

源码：`src/model.ts:424`

合并appearance，并保持模型、界面和持久化状态的一致性。

```ts
export function mergeAppearance(base: MindMapAppearance | undefined, override: MindMapAppearance | undefined): MindMapAppearance
```

### 函数 `normalizeStyle`

源码：`src/model.ts:434`

校验并规范化style，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeStyle(input: Partial<MindMapNodeStyle> | undefined): MindMapNodeStyle | undefined
```

### 函数 `normalizeTextStyle`

源码：`src/model.ts:462`

校验并规范化text style，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTextStyle(input: Partial<MindMapTextStyle> | undefined): MindMapTextStyle | undefined
```

### 函数 `textStyleKey`

源码：`src/model.ts:480`

执行“text style key”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function textStyleKey(style: MindMapTextStyle | undefined): string
```

### 函数 `normalizeRichText`

源码：`src/model.ts:491`

校验并规范化rich text，并保持模型、界面和持久化状态的一致性。

```ts
export function normalizeRichText(input: unknown, fallbackText = ""): MindMapTextRun[] | undefined
```

### 函数 `richTextPlainText`

源码：`src/model.ts:539`

执行“rich text plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextPlainText(runs: MindMapTextRun[] | undefined, fallbackText = ""): string
```

### 函数 `richTextCharacterStyles`

源码：`src/model.ts:550`

执行“rich text character styles”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextCharacterStyles(runs: MindMapTextRun[] | undefined, fallbackText = ""): MindMapTextStyle[]
```

### 函数 `characterStylesToRichText`

源码：`src/model.ts:571`

执行“character styles to rich text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function characterStylesToRichText(text: string, styles: MindMapTextStyle[]): MindMapTextRun[] | undefined
```

### 函数 `reconcileRichTextAfterEdit`

源码：`src/model.ts:596`

在纯文本被编辑后，尽可能保留原字符位置附近的富文本样式。它通过公共前缀和后缀映射样式，新增字符继承邻近样式，删除字符则自动丢弃对应区间。

```ts
export function reconcileRichTextAfterEdit( previousText: string, previousRuns: MindMapTextRun[] | undefined, nextText: string ): MindMapTextRun[] | undefined
```

### 函数 `applyRichTextStyleRange`

源码：`src/model.ts:632`

对字符半开区间应用或取消指定富文本样式，并重新合并连续、样式相同的文本段，避免产生大量碎片化运行段。

```ts
export function applyRichTextStyleRange( text: string, runs: MindMapTextRun[] | undefined, start: number, end: number, patch: Partial<MindMapTextStyle> | null ): MindMapTextRun[] | undefined
```

### 函数 `normalizeContentBlock`

源码：`src/model.ts:657`

校验并规范化content block，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeContentBlock(input: unknown): MindMapContentBlock | null
```

### 函数 `imageSourceCandidates`

源码：`src/model.ts:708`

为图片内容块构建有序、去重的加载候选列表。顺序从当前地址开始轮转到其他远程镜像，最后按设置选择本地地址，从而支持失效图床自动切换。

```ts
export function imageSourceCandidates(block: MindMapImageContentBlock, includeLocal = true): MindMapImageSourceCandidate[]
```

### 函数 `nodeContentBlocks`

源码：`src/model.ts:752`

执行“node content blocks”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodeContentBlocks(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): MindMapContentBlock[]
```

### 函数 `nodePlainText`

源码：`src/model.ts:772`

执行“node plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodePlainText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string
```

### 函数 `nodePrimaryText`

源码：`src/model.ts:783`

执行“node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodePrimaryText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string
```

### 函数 `syncNodeLegacyFields`

源码：`src/model.ts:794`

将新的有序 content 内容块同步回 text、richText 和 image 等旧字段。该桥接保证旧版本插件、旧导出逻辑和新内容块模型能够同时工作。

```ts
export function syncNodeLegacyFields(node: MindMapNode): void
```

### 函数 `normalizeCell`

源码：`src/model.ts:811`

校验并规范化cell，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeCell(value: unknown): string
```

### 函数 `normalizeTable`

源码：`src/model.ts:821`

校验并规范化table，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTable(input: Partial<MindMapTable> | undefined): MindMapTable | undefined
```

### 函数 `normalizeCode`

源码：`src/model.ts:845`

校验并规范化code，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeCode(input: Partial<MindMapCodeBlock> | undefined): MindMapCodeBlock | undefined
```

### 函数 `normalizeSubmap`

源码：`src/model.ts:859`

校验并规范化submap，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeSubmap(input: Partial<MindMapSubmap> | undefined): MindMapSubmap | undefined
```

### 函数 `normalizeNavigation`

源码：`src/model.ts:873`

校验并规范化navigation，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNavigation(input: Partial<MindMapNavigation> | undefined): MindMapNavigation | undefined
```

### 函数 `normalizeTask`

源码：`src/model.ts:889`

校验并规范化task，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTask(value: unknown): TaskStatus | undefined
```

### 函数 `normalizeTags`

源码：`src/model.ts:899`

校验并规范化tags，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTags(value: unknown): string[] | undefined
```

### 函数 `normalizeNode`

源码：`src/model.ts:916`

校验并规范化node，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNode(input: Partial<MindMapNode> | undefined, fallbackText: string): MindMapNode
```

### 函数 `normalizeDocumentView`

源码：`src/model.ts:961`

校验并规范化document view，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeDocumentView(input: Partial<MindMapDocumentView> | undefined): MindMapDocumentView | undefined
```

### 函数 `normalizeDocument`

源码：`src/model.ts:978`

把任意版本或不完整的输入对象转换为当前版本的 MindMapDocument。该函数会递归规范化节点、外观、视图状态和兼容字段，并保证根节点、数组及必需标识始终存在。

```ts
export function normalizeDocument(input: Partial<MindMapDocument> | undefined, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `serializeDocument`

源码：`src/model.ts:999`

在保存前再次规范化文档，并输出带缩进的稳定 JSON。这样可移除运行时临时值，同时保留可选兼容字段。

```ts
export function serializeDocument(doc: MindMapDocument): string
```

### 函数 `parseJsonDocument`

源码：`src/model.ts:1011`

解析json document，并保持模型、界面和持久化状态的一致性。

```ts
function parseJsonDocument(value: string, fallbackTitle: string): MindMapDocument | null
```

### 函数 `extractFencedJson`

源码：`src/model.ts:1026`

执行“extract fenced json”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function extractFencedJson(source: string, language: string): string | null
```

### 函数 `parseDocument`

源码：`src/model.ts:1040`

解析磁盘中的 .mindmap 文本。优先识别当前原始 JSON 格式，同时兼容历史 Markdown 围栏 JSON；解析失败时返回包含回退标题的安全默认文档，避免视图崩溃。

```ts
export function parseDocument(source: string, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `cloneDocument`

源码：`src/model.ts:1063`

执行“clone document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function cloneDocument(doc: MindMapDocument): MindMapDocument
```

### 函数 `cloneNodeWithFreshIds`

源码：`src/model.ts:1073`

执行“clone node with fresh ids”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function cloneNodeWithFreshIds(node: MindMapNode): MindMapNode
```

### 函数 `walkNodes`

源码：`src/model.ts:1087`

递归遍历nodes，并保持模型、界面和持久化状态的一致性。

```ts
export function walkNodes(root: MindMapNode, visitor: (node: MindMapNode, parent: MindMapNode | null) => void): void
```

### 函数 `flattenNodes`

源码：`src/model.ts:1101`

展平nodes，并保持模型、界面和持久化状态的一致性。

```ts
export function flattenNodes(root: MindMapNode): MindMapNode[]
```

### 函数 `findNode`

源码：`src/model.ts:1114`

查找node，并保持模型、界面和持久化状态的一致性。

```ts
export function findNode(root: MindMapNode, id: string): MindMapNode | null
```

### 函数 `findParent`

源码：`src/model.ts:1129`

查找parent，并保持模型、界面和持久化状态的一致性。

```ts
export function findParent(root: MindMapNode, id: string): MindMapNode | null
```

### 函数 `findAncestors`

源码：`src/model.ts:1144`

查找ancestors，并保持模型、界面和持久化状态的一致性。

```ts
export function findAncestors(root: MindMapNode, id: string): MindMapNode[]
```

### 函数 `containsNode`

源码：`src/model.ts:1165`

判断node，并保持模型、界面和持久化状态的一致性。

```ts
export function containsNode(root: MindMapNode, id: string): boolean
```

### 函数 `removeNode`

源码：`src/model.ts:1176`

删除node，并保持模型、界面和持久化状态的一致性。

```ts
export function removeNode(root: MindMapNode, id: string): boolean
```

### 函数 `collectWikiLinks`

源码：`src/model.ts:1194`

遍历并收集wiki links，并保持模型、界面和持久化状态的一致性。

```ts
export function collectWikiLinks(root: MindMapNode): Set<string>
```

### 函数 `extractFirstWikiLink`

源码：`src/model.ts:1221`

执行“extract first wiki link”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function extractFirstWikiLink(value: string): string | null
```

### 函数 `getTaskProgress`

源码：`src/model.ts:1232`

读取并返回task progress，并保持模型、界面和持久化状态的一致性。

```ts
export function getTaskProgress(root: MindMapNode): TaskProgress
```

### 函数 `nodeSearchText`

源码：`src/model.ts:1249`

执行“node search text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodeSearchText(node: MindMapNode): string
```

### 函数 `taskPrefix`

源码：`src/model.ts:1262`

执行“task prefix”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function taskPrefix(task: TaskStatus | undefined): string
```

### 函数 `escapeInlineMarkdown`

源码：`src/model.ts:1275`

转义inline markdown，并保持模型、界面和持久化状态的一致性。

```ts
function escapeInlineMarkdown(value: string): string
```

### 函数 `richTextToMarkdown`

源码：`src/model.ts:1286`

执行“rich text to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextToMarkdown(runs: MindMapTextRun[] | undefined, fallbackText: string): string
```

### 函数 `tableToMarkdown`

源码：`src/model.ts:1307`

执行“table to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function tableToMarkdown(table: MindMapTable): string
```

### 函数 `splitMarkdownTableRow`

源码：`src/model.ts:1325`

执行“split markdown table row”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function splitMarkdownTableRow(line: string): string[]
```

### 函数 `parseMarkdownTable`

源码：`src/model.ts:1346`

解析markdown table，并保持模型、界面和持久化状态的一致性。

```ts
export function parseMarkdownTable(markdown: string): MindMapTable | null
```

### 函数 `parseFencedCode`

源码：`src/model.ts:1380`

解析fenced code，并保持模型、界面和持久化状态的一致性。

```ts
export function parseFencedCode(markdown: string): MindMapCodeBlock | null
```

### 函数 `childrenToTable`

源码：`src/model.ts:1392`

执行“children to table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function childrenToTable(node: MindMapNode): MindMapTable | null
```

### 函数 `documentToMarkdown`

源码：`src/model.ts:1414`

执行“document to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function documentToMarkdown(doc: MindMapDocument): string
```

### 函数 `parseTaskText`

源码：`src/model.ts:1456`

解析task text，并保持模型、界面和持久化状态的一致性。

```ts
function parseTaskText(value: string):
```

### 函数 `markdownToDocument`

源码：`src/model.ts:1471`

执行“markdown to document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function markdownToDocument(markdown: string, fallbackTitle = "思维导图"): MindMapDocument
```

## `src/modes.ts`

三种显示模式共享的模式与文章编号工具。

### 函数 `chineseNumber`

源码：`src/modes.ts:31`

执行“chinese number”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function chineseNumber(value: number): string
```

### 函数 `articleNumberLabel`

源码：`src/modes.ts:51`

将文章标题深度和同级序号转换为“第一章、第一节、一、（一）、1.、（1）”等常见中文文章编号，更深层级使用可读的循环规则。

```ts
export function articleNumberLabel(depth: number, index: number): string
```

### 函数 `isArticleHeading`

源码：`src/modes.ts:68`

A node is an article heading when it owns local descendants or represents a linked child map. A sub-map node is therefore still a chapter/section even when its children live in another .mindmap file.

```ts
export function isArticleHeading(node: MindMapNode): boolean
```

### 接口 `ArticleNodeInfo`

源码：`src/modes.ts:75`

ArticleNodeInfo 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ArticleNodeInfo
```

### 接口 `ArticleTocEntry`

源码：`src/modes.ts:89`

ArticleTocEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ArticleTocEntry
```

### 函数 `buildArticleNodeInfo`

源码：`src/modes.ts:106`

Build the article representation for one physical .mindmap file. `baseDepth` is the absolute article depth represented by this file's root. For a top-level map it is 0; for a child map linked from a chapter it is 1, so that the child map's first descendants become sections rather than a new set of chapters.

```ts
export function buildArticleNodeInfo(root: MindMapNode, baseDepth = 0): ArticleNodeInfo[]
```

### 函数 `normalizeVisibleModes`

源码：`src/modes.ts:140`

校验并规范化visible modes，并保持模型、界面和持久化状态的一致性。

```ts
export function normalizeVisibleModes(modes: unknown): DisplayMode[]
```

## `src/settings.ts`

插件设置模型和设置页。

### 类型 `ImageHostBodyMode`

源码：`src/settings.ts:28`

ImageHostBodyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ImageHostBodyMode = "multipart" | "raw";
```

### 类型 `ImageHostMethod`

源码：`src/settings.ts:32`

ImageHostMethod 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ImageHostMethod = "POST" | "PUT";
```

### 接口 `ImageHostConfig`

源码：`src/settings.ts:37`

ImageHostConfig 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostConfig
```

### 接口 `ImageHostChoice`

源码：`src/settings.ts:52`

ImageHostChoice 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostChoice
```

### 接口 `ImageHostUploadSuccess`

源码：`src/settings.ts:60`

ImageHostUploadSuccess 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadSuccess
```

### 接口 `ImageHostUploadFailure`

源码：`src/settings.ts:69`

ImageHostUploadFailure 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadFailure
```

### 接口 `ImageHostUploadBatch`

源码：`src/settings.ts:78`

ImageHostUploadBatch 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadBatch
```

### 函数 `createImageHostConfig`

源码：`src/settings.ts:89`

创建image host config，并保持模型、界面和持久化状态的一致性。

```ts
export function createImageHostConfig(index = 1): ImageHostConfig
```

### 接口 `MindMapStudioSettings`

源码：`src/settings.ts:106`

MindMapStudioSettings 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapStudioSettings
```

### 函数 `settingsToAppearance`

源码：`src/settings.ts:212`

更新并应用tings to appearance，并保持模型、界面和持久化状态的一致性。

```ts
export function settingsToAppearance(settings: MindMapStudioSettings): MindMapAppearance
```

### 函数 `applyThemePresetToSettings`

源码：`src/settings.ts:247`

应用theme preset to settings，并保持模型、界面和持久化状态的一致性。

```ts
export function applyThemePresetToSettings(settings: MindMapStudioSettings, presetId: MindMapThemePresetId): void
```

### 类 `MindMapStudioSettingTab`

源码：`src/settings.ts:278`

MindMapStudioSettingTab 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapStudioSettingTab extends PluginSettingTab
```

### 构造函数 `MindMapStudioSettingTab.constructor`

源码：`src/settings.ts:287`

创建 MindMapStudioSettingTab 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, plugin: MindMapStudioPlugin)
```

### 方法 `MindMapStudioSettingTab.display`

源码：`src/settings.ts:296`

构建完整插件设置页，包括主题、显示模式、节点默认值、搜索、图片、图床容灾和恢复初始设置。所有控件写入后立即保存并刷新打开视图。

```ts
display(): void
```

### 方法 `MindMapStudioSettingTab.addOptionalColorSetting`

源码：`src/settings.ts:1030`

添加optional color setting，并保持模型、界面和持久化状态的一致性。

```ts
private addOptionalColorSetting( container: HTMLElement, name: string, description: string, getValue: () => string, setValue: (value: string) => Promise<void>, fallback: string, allowReset = true ): void
```

### 方法 `MindMapStudioSettingTab.saveAndRefresh`

源码：`src/settings.ts:1062`

保存and refresh，并保持模型、界面和持久化状态的一致性。

```ts
private async saveAndRefresh(): Promise<void>
```

## `src/static-render.ts`

Markdown 阅读模式的只读导图渲染入口。

### 函数 `renderStaticMindMap`

源码：`src/static-render.ts:19`

渲染static mind map，并保持模型、界面和持久化状态的一致性。

```ts
export function renderStaticMindMap( container: HTMLElement, document: MindMapDocument, options?:
```

### 函数 `renderStaticSource`

源码：`src/static-render.ts:50`

渲染static source，并保持模型、界面和持久化状态的一致性。

```ts
export function renderStaticSource(container: HTMLElement, source: string, fallbackTitle: string, defaultAppearance?: MindMapAppearance): void
```

## `src/themes.ts`

内置主题预设模块。

### 接口 `MindMapThemePreset`

源码：`src/themes.ts:13`

MindMapThemePreset 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapThemePreset
```

### 函数 `getMindMapThemePreset`

源码：`src/themes.ts:279`

读取并返回mind map theme preset，并保持模型、界面和持久化状态的一致性。

```ts
export function getMindMapThemePreset(id: MindMapThemePresetId | undefined): MindMapThemePreset | undefined
```

### 函数 `appearanceFromThemePreset`

源码：`src/themes.ts:289`

执行“appearance from theme preset”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function appearanceFromThemePreset(id: MindMapThemePresetId): MindMapAppearance
```

## `src/view.ts`

Obsidian TextFileView 适配层。

### 类 `MindMapStudioView`

源码：`src/view.ts:20`

MindMapStudioView 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapStudioView extends TextFileView
```

### 构造函数 `MindMapStudioView.constructor`

源码：`src/view.ts:38`

创建 MindMapStudioView 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(leaf: WorkspaceLeaf, plugin: MindMapStudioPlugin)
```

### 方法 `MindMapStudioView.getViewType`

源码：`src/view.ts:47`

读取并返回view type，并保持模型、界面和持久化状态的一致性。

```ts
getViewType(): string
```

### 方法 `MindMapStudioView.getDisplayText`

源码：`src/view.ts:55`

读取并返回display text，并保持模型、界面和持久化状态的一致性。

```ts
getDisplayText(): string
```

### 方法 `MindMapStudioView.getIcon`

源码：`src/view.ts:63`

读取并返回icon，并保持模型、界面和持久化状态的一致性。

```ts
getIcon(): string
```

### 方法 `MindMapStudioView.getViewData`

源码：`src/view.ts:72`

返回当前编辑器文档的序列化文本，供 Obsidian 自动保存。保存使用模型层统一序列化，确保兼容字段和版本号正确。

```ts
getViewData(): string
```

### 方法 `MindMapStudioView.setViewData`

源码：`src/view.ts:84`

接收 Obsidian 读取的文件文本，解析成领域文档并交给编辑器。重新加载时会保留全局显示模式，并异步刷新文章父子上下文。

```ts
setViewData(data: string, clear: boolean): void
```

### 方法 `MindMapStudioView.clear`

源码：`src/view.ts:146`

执行“clear”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
clear(): void
```

### 方法 `MindMapStudioView.save`

源码：`src/view.ts:158`

保存相关数据，并保持模型、界面和持久化状态的一致性。

```ts
async save(clear?: boolean): Promise<void>
```

### 方法 `MindMapStudioView.onClose`

源码：`src/view.ts:166`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
async onClose(): Promise<void>
```

### 方法 `MindMapStudioView.openMapFamilySearch`

源码：`src/view.ts:178`

打开map family search，并保持模型、界面和持久化状态的一致性。

```ts
private async openMapFamilySearch(): Promise<void>
```

### 方法 `MindMapStudioView.refreshAppearance`

源码：`src/view.ts:191`

刷新appearance，并保持模型、界面和持久化状态的一致性。

```ts
refreshAppearance(): void
```

### 方法 `MindMapStudioView.focusNode`

源码：`src/view.ts:201`

定位node，并保持模型、界面和持久化状态的一致性。

```ts
focusNode(nodeId: string): void
```

### 方法 `MindMapStudioView.setDisplayMode`

源码：`src/view.ts:214`

更新并应用display mode，并保持模型、界面和持久化状态的一致性。

```ts
setDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapStudioView.applyGlobalDisplayMode`

源码：`src/view.ts:223`

应用global display mode，并保持模型、界面和持久化状态的一致性。

```ts
applyGlobalDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapStudioView.toggleReadOnly`

源码：`src/view.ts:230`

切换read only，并保持模型、界面和持久化状态的一致性。

```ts
toggleReadOnly(): void
```

### 方法 `MindMapStudioView.getEditorOptions`

源码：`src/view.ts:237`

读取并返回editor options，并保持模型、界面和持久化状态的一致性。

```ts
private getEditorOptions()
```

### 方法 `MindMapStudioView.scheduleArticleContextRefresh`

源码：`src/view.ts:260`

安排延迟执行article context refresh，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleArticleContextRefresh(delay: number): void
```

### 方法 `MindMapStudioView.refreshArticleContext`

源码：`src/view.ts:271`

刷新article context，并保持模型、界面和持久化状态的一致性。

```ts
private async refreshArticleContext(): Promise<void>
```

### 方法 `MindMapStudioView.applyViewClasses`

源码：`src/view.ts:291`

应用view classes，并保持模型、界面和持久化状态的一致性。

```ts
private applyViewClasses(): void
```

### 方法 `MindMapStudioView.scheduleSavedIndicator`

源码：`src/view.ts:300`

安排延迟执行saved indicator，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleSavedIndicator(): void
```

### 方法 `MindMapStudioView.openLink`

源码：`src/view.ts:310`

打开link，并保持模型、界面和持久化状态的一致性。

```ts
private async openLink(rawLink: string): Promise<void>
```

### 方法 `MindMapStudioView.resolveImage`

源码：`src/view.ts:327`

解析并确定image，并保持模型、界面和持久化状态的一致性。

```ts
private resolveImage(rawSource: string): string | null
```

### 方法 `MindMapStudioView.exportTextFile`

源码：`src/view.ts:344`

执行“export text file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async exportTextFile(extension: "svg" | "md" | "json", content: string): Promise<void>
```

