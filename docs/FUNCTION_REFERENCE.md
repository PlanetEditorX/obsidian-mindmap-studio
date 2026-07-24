# 函数与类参考

> 本文档由 `npm run docs:generate` 根据 TypeScript 源码自动生成。源码中的 JSDoc 是说明的权威来源；修改函数签名或职责后，应同步更新注释并重新生成本文档。

## `src/article/article-style.ts`

文章领域的样式预设与解析。

### 函数 `resolveArticleStyle`

源码：`src/article/article-style.ts:21`

解析文章样式预设，并叠加当前文档的自定义值。

```ts
export function resolveArticleStyle(style: ArticleStyle | undefined): ArticleStyle
```

## `src/article/modes.ts`

文章领域与显示模式共享的编号工具。

### 接口 `ReadingSection`

源码：`src/article/modes.ts:26`

One physical map merged into the continuous reading view.

```ts
export interface ReadingSection
```

### 函数 `chineseNumber`

源码：`src/article/modes.ts:40`

执行“chinese number”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function chineseNumber(value: number): string
```

### 函数 `articleNumberLabel`

源码：`src/article/modes.ts:60`

将文章标题深度和同级序号转换为“第一章、第一节、一、（一）、1.、（1）”等常见中文文章编号，更深层级使用可读的循环规则。

```ts
export function articleNumberLabel(depth: number, index: number): string
```

### 函数 `isArticleHeading`

源码：`src/article/modes.ts:77`

A node is an article heading when it owns local descendants or represents a linked child map. A sub-map node is therefore still a chapter/section even when its children live in another .mindmap file.

```ts
export function isArticleHeading(node: MindMapNode): boolean
```

### 接口 `ArticleNodeInfo`

源码：`src/article/modes.ts:84`

ArticleNodeInfo 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ArticleNodeInfo
```

### 接口 `ArticleTocEntry`

源码：`src/article/modes.ts:98`

ArticleTocEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ArticleTocEntry
```

### 接口 `ArticlePageNavigation`

源码：`src/article/modes.ts:109`

Navigation state shared by every page in one article map family.

```ts
export interface ArticlePageNavigation
```

### 函数 `buildArticleNodeInfo`

源码：`src/article/modes.ts:123`

Build the article representation for one physical .mindmap file. `baseDepth` is the absolute article depth represented by this file's root. For a top-level map it is 0; for a child map linked from a chapter it is 1, so that the child map's first descendants become sections rather than a new set of chapters.

```ts
export function buildArticleNodeInfo(root: MindMapNode, baseDepth = 0): ArticleNodeInfo[]
```

### 函数 `normalizeVisibleModes`

源码：`src/article/modes.ts:157`

校验并规范化visible modes，并保持模型、界面和持久化状态的一致性。

```ts
export function normalizeVisibleModes(modes: unknown): DisplayMode[]
```

## `src/core/model.ts`

核心领域模型与序列化层。

### 类型 `LayoutMode`

源码：`src/core/model.ts:11`

定义 .mindmap 稳定数据结构，并负责旧版本兼容、字段规范化、富文本、内容块、节点树、Markdown 导入导出及图片镜像候选源排序。

```ts
export type LayoutMode = "right" | "balanced";
```

### 类型 `DisplayMode`

源码：`src/core/model.ts:15`

DisplayMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type DisplayMode = "mindmap" | "outline" | "article" | "reading";
```

### 类型 `ArticleLandingMode`

源码：`src/core/model.ts:17`

Top-level article landing content.

```ts
export type ArticleLandingMode = "toc" | "article";
```

### 类型 `ArticleStylePresetId`

源码：`src/core/model.ts:19`

Built-in article presentation presets.

```ts
export type ArticleStylePresetId = "classic" | "book" | "modern" | "minimal";
```

### 接口 `ArticleStyle`

源码：`src/core/model.ts:21`

Per-document article presentation overrides.

```ts
export interface ArticleStyle
```

### 类型 `ThemeMode`

源码：`src/core/model.ts:35`

ThemeMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ThemeMode = "auto" | "light" | "dark";
```

### 类型 `NodeShape`

源码：`src/core/model.ts:39`

NodeShape 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type NodeShape = "rounded" | "pill" | "rectangle";
```

### 类型 `NodeVisualStyle`

源码：`src/core/model.ts:41`

Overall sizing and density used when rendering mind-map nodes.

```ts
export type NodeVisualStyle = "card" | "branch";
```

### 类型 `NodeWidthMode`

源码：`src/core/model.ts:43`

Default width calculation used for nodes without a manual width.

```ts
export type NodeWidthMode = "fixed" | "auto";
```

### 类型 `TaskStatus`

源码：`src/core/model.ts:47`

TaskStatus 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type TaskStatus = "todo" | "doing" | "done";
```

### 类型 `BackgroundPattern`

源码：`src/core/model.ts:51`

BackgroundPattern 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type BackgroundPattern = "none" | "grid" | "dots";
```

### 类型 `EdgeStyle`

源码：`src/core/model.ts:55`

EdgeStyle 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type EdgeStyle = "curved" | "straight" | "elbow";
```

### 类型 `EdgeWidthMode`

源码：`src/core/model.ts:59`

EdgeWidthMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type EdgeWidthMode = "uniform" | "tapered";
```

### 类型 `MindMapThemePresetId`

源码：`src/core/model.ts:63`

MindMapThemePresetId 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type MindMapThemePresetId = | "classic-indigo" | "ocean-blue" | "forest-green" | "sunset-orange" | "lavender-dream" | "candy-pop" | "paper-note" | "minimal-ink" | "dark-neon" | "mint-clean" | "spectrum-flow" | "executive-navy" | "botanical-calm" | "m…
```

### 类型 `FontFamilyMode`

源码：`src/core/model.ts:83`

FontFamilyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type FontFamilyMode = "obsidian" | "sans" | "serif" | "mono" | "custom";
```

### 类型 `TableAlignment`

源码：`src/core/model.ts:87`

TableAlignment 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type TableAlignment = "left" | "center" | "right";
```

### 类型 `NodeTextAlign`

源码：`src/core/model.ts:91`

NodeTextAlign 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type NodeTextAlign = "left" | "center" | "right";
```

### 接口 `MindMapTextStyle`

源码：`src/core/model.ts:96`

MindMapTextStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextStyle
```

### 接口 `MindMapTextRun`

源码：`src/core/model.ts:107`

MindMapTextRun 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextRun
```

### 接口 `MindMapTable`

源码：`src/core/model.ts:115`

MindMapTable 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTable
```

### 接口 `MindMapCodeBlock`

源码：`src/core/model.ts:125`

MindMapCodeBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapCodeBlock
```

### 接口 `MindMapTextContentBlock`

源码：`src/core/model.ts:133`

MindMapTextContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextContentBlock
```

### 接口 `MindMapImageRemoteSource`

源码：`src/core/model.ts:143`

MindMapImageRemoteSource 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageRemoteSource
```

### 接口 `MindMapImageSourceCandidate`

源码：`src/core/model.ts:156`

MindMapImageSourceCandidate 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageSourceCandidate
```

### 接口 `MindMapImageContentBlock`

源码：`src/core/model.ts:167`

MindMapImageContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageContentBlock
```

### 类型 `MindMapContentBlock`

源码：`src/core/model.ts:181`

MindMapContentBlock 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type MindMapContentBlock = MindMapTextContentBlock | MindMapImageContentBlock;
```

### 接口 `MindMapSubmap`

源码：`src/core/model.ts:186`

MindMapSubmap 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSubmap
```

### 接口 `MindMapNavigation`

源码：`src/core/model.ts:194`

MindMapNavigation 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNavigation
```

### 接口 `MindMapAppearance`

源码：`src/core/model.ts:204`

MindMapAppearance 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapAppearance
```

### 接口 `MindMapNodeStyle`

源码：`src/core/model.ts:238`

MindMapNodeStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNodeStyle
```

### 接口 `MindMapNode`

源码：`src/core/model.ts:256`

MindMapNode 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNode
```

### 接口 `MindMapDocumentView`

源码：`src/core/model.ts:281`

MindMapDocumentView 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapDocumentView
```

### 接口 `MindMapDocument`

源码：`src/core/model.ts:290`

MindMapDocument 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapDocument
```

### 接口 `TaskProgress`

源码：`src/core/model.ts:305`

TaskProgress 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface TaskProgress
```

### 函数 `newId`

源码：`src/core/model.ts:317`

执行“new id”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function newId(): string
```

### 函数 `createNode`

源码：`src/core/model.ts:328`

创建node，并保持模型、界面和持久化状态的一致性。

```ts
export function createNode(text = "新节点"): MindMapNode
```

### 函数 `createDefaultDocument`

源码：`src/core/model.ts:338`

创建default document，并保持模型、界面和持久化状态的一致性。

```ts
export function createDefaultDocument(title = "新思维导图"): MindMapDocument
```

### 函数 `normalizeColor`

源码：`src/core/model.ts:361`

校验并规范化color，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeColor(value: unknown): string | undefined
```

### 函数 `normalizeNumber`

源码：`src/core/model.ts:375`

校验并规范化number，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNumber(value: unknown, min: number, max: number): number | undefined
```

### 函数 `normalizeBooleanOverride`

源码：`src/core/model.ts:386`

校验并规范化boolean override，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeBooleanOverride(value: unknown): boolean | undefined
```

### 函数 `normalizeAppearance`

源码：`src/core/model.ts:396`

校验并规范化appearance，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeAppearance(input: Partial<MindMapAppearance> | undefined): MindMapAppearance | undefined
```

### 函数 `mergeAppearance`

源码：`src/core/model.ts:467`

合并appearance，并保持模型、界面和持久化状态的一致性。

```ts
export function mergeAppearance(base: MindMapAppearance | undefined, override: MindMapAppearance | undefined): MindMapAppearance
```

### 函数 `normalizeStyle`

源码：`src/core/model.ts:477`

校验并规范化style，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeStyle(input: Partial<MindMapNodeStyle> | undefined): MindMapNodeStyle | undefined
```

### 函数 `normalizeTextStyle`

源码：`src/core/model.ts:505`

校验并规范化text style，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTextStyle(input: Partial<MindMapTextStyle> | undefined): MindMapTextStyle | undefined
```

### 函数 `textStyleKey`

源码：`src/core/model.ts:523`

执行“text style key”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function textStyleKey(style: MindMapTextStyle | undefined): string
```

### 函数 `normalizeRichText`

源码：`src/core/model.ts:534`

校验并规范化rich text，并保持模型、界面和持久化状态的一致性。

```ts
export function normalizeRichText(input: unknown, fallbackText = ""): MindMapTextRun[] | undefined
```

### 函数 `richTextPlainText`

源码：`src/core/model.ts:582`

执行“rich text plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextPlainText(runs: MindMapTextRun[] | undefined, fallbackText = ""): string
```

### 函数 `richTextCharacterStyles`

源码：`src/core/model.ts:593`

执行“rich text character styles”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextCharacterStyles(runs: MindMapTextRun[] | undefined, fallbackText = ""): MindMapTextStyle[]
```

### 函数 `characterStylesToRichText`

源码：`src/core/model.ts:614`

执行“character styles to rich text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function characterStylesToRichText(text: string, styles: MindMapTextStyle[]): MindMapTextRun[] | undefined
```

### 函数 `reconcileRichTextAfterEdit`

源码：`src/core/model.ts:639`

在纯文本被编辑后，尽可能保留原字符位置附近的富文本样式。它通过公共前缀和后缀映射样式，新增字符继承邻近样式，删除字符则自动丢弃对应区间。

```ts
export function reconcileRichTextAfterEdit( previousText: string, previousRuns: MindMapTextRun[] | undefined, nextText: string ): MindMapTextRun[] | undefined
```

### 函数 `applyRichTextStyleRange`

源码：`src/core/model.ts:675`

对字符半开区间应用或取消指定富文本样式，并重新合并连续、样式相同的文本段，避免产生大量碎片化运行段。

```ts
export function applyRichTextStyleRange( text: string, runs: MindMapTextRun[] | undefined, start: number, end: number, patch: Partial<MindMapTextStyle> | null ): MindMapTextRun[] | undefined
```

### 函数 `normalizeContentBlock`

源码：`src/core/model.ts:700`

校验并规范化content block，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeContentBlock(input: unknown): MindMapContentBlock | null
```

### 函数 `imageSourceCandidates`

源码：`src/core/model.ts:751`

为图片内容块构建有序、去重的加载候选列表。顺序从当前地址开始轮转到其他远程镜像，最后按设置选择本地地址，从而支持失效图床自动切换。

```ts
export function imageSourceCandidates(block: MindMapImageContentBlock, includeLocal = true): MindMapImageSourceCandidate[]
```

### 函数 `nodeContentBlocks`

源码：`src/core/model.ts:795`

执行“node content blocks”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodeContentBlocks(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): MindMapContentBlock[]
```

### 函数 `nodePlainText`

源码：`src/core/model.ts:815`

执行“node plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodePlainText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string
```

### 函数 `nodePrimaryText`

源码：`src/core/model.ts:826`

执行“node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodePrimaryText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string
```

### 函数 `syncNodeLegacyFields`

源码：`src/core/model.ts:837`

将新的有序 content 内容块同步回 text、richText 和 image 等旧字段。该桥接保证旧版本插件、旧导出逻辑和新内容块模型能够同时工作。

```ts
export function syncNodeLegacyFields(node: MindMapNode): void
```

### 函数 `normalizeCell`

源码：`src/core/model.ts:854`

校验并规范化cell，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeCell(value: unknown): string
```

### 函数 `normalizeTable`

源码：`src/core/model.ts:864`

校验并规范化table，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTable(input: Partial<MindMapTable> | undefined): MindMapTable | undefined
```

### 函数 `normalizeCode`

源码：`src/core/model.ts:888`

校验并规范化code，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeCode(input: Partial<MindMapCodeBlock> | undefined): MindMapCodeBlock | undefined
```

### 函数 `normalizeSubmap`

源码：`src/core/model.ts:902`

校验并规范化submap，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeSubmap(input: Partial<MindMapSubmap> | undefined): MindMapSubmap | undefined
```

### 函数 `normalizeNavigation`

源码：`src/core/model.ts:916`

校验并规范化navigation，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNavigation(input: Partial<MindMapNavigation> | undefined): MindMapNavigation | undefined
```

### 函数 `normalizeTask`

源码：`src/core/model.ts:932`

校验并规范化task，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTask(value: unknown): TaskStatus | undefined
```

### 函数 `normalizeTags`

源码：`src/core/model.ts:942`

校验并规范化tags，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTags(value: unknown): string[] | undefined
```

### 函数 `normalizeNode`

源码：`src/core/model.ts:959`

校验并规范化node，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNode(input: Partial<MindMapNode> | undefined, fallbackText: string): MindMapNode
```

### 函数 `normalizeDocumentView`

源码：`src/core/model.ts:1004`

校验并规范化document view，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeDocumentView(input: Partial<MindMapDocumentView> | undefined): MindMapDocumentView | undefined
```

### 函数 `normalizeArticleStyle`

源码：`src/core/model.ts:1026`

Normalizes per-document article presentation settings.

```ts
function normalizeArticleStyle(input: Partial<ArticleStyle> | undefined): ArticleStyle | undefined
```

### 函数 `normalizeDocument`

源码：`src/core/model.ts:1056`

把任意版本或不完整的输入对象转换为当前版本的 MindMapDocument。该函数会递归规范化节点、外观、视图状态和兼容字段，并保证根节点、数组及必需标识始终存在。

```ts
export function normalizeDocument(input: Partial<MindMapDocument> | undefined, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `serializeDocument`

源码：`src/core/model.ts:1078`

在保存前再次规范化文档，并输出带缩进的稳定 JSON。这样可移除运行时临时值，同时保留可选兼容字段。

```ts
export function serializeDocument(doc: MindMapDocument): string
```

### 函数 `parseJsonDocument`

源码：`src/core/model.ts:1090`

解析json document，并保持模型、界面和持久化状态的一致性。

```ts
function parseJsonDocument(value: string, fallbackTitle: string): MindMapDocument | null
```

### 函数 `extractFencedJson`

源码：`src/core/model.ts:1105`

执行“extract fenced json”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function extractFencedJson(source: string, language: string): string | null
```

### 函数 `parseDocument`

源码：`src/core/model.ts:1119`

解析磁盘中的 .mindmap 文本。优先识别当前原始 JSON 格式，同时兼容历史 Markdown 围栏 JSON；解析失败时返回包含回退标题的安全默认文档，避免视图崩溃。

```ts
export function parseDocument(source: string, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `cloneDocument`

源码：`src/core/model.ts:1142`

执行“clone document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function cloneDocument(doc: MindMapDocument): MindMapDocument
```

### 函数 `cloneNodeWithFreshIds`

源码：`src/core/model.ts:1152`

执行“clone node with fresh ids”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function cloneNodeWithFreshIds(node: MindMapNode): MindMapNode
```

### 函数 `walkNodes`

源码：`src/core/model.ts:1166`

递归遍历nodes，并保持模型、界面和持久化状态的一致性。

```ts
export function walkNodes(root: MindMapNode, visitor: (node: MindMapNode, parent: MindMapNode | null) => void): void
```

### 函数 `flattenNodes`

源码：`src/core/model.ts:1180`

展平nodes，并保持模型、界面和持久化状态的一致性。

```ts
export function flattenNodes(root: MindMapNode): MindMapNode[]
```

### 函数 `findNode`

源码：`src/core/model.ts:1193`

查找node，并保持模型、界面和持久化状态的一致性。

```ts
export function findNode(root: MindMapNode, id: string): MindMapNode | null
```

### 函数 `findParent`

源码：`src/core/model.ts:1208`

查找parent，并保持模型、界面和持久化状态的一致性。

```ts
export function findParent(root: MindMapNode, id: string): MindMapNode | null
```

### 函数 `findAncestors`

源码：`src/core/model.ts:1223`

查找ancestors，并保持模型、界面和持久化状态的一致性。

```ts
export function findAncestors(root: MindMapNode, id: string): MindMapNode[]
```

### 函数 `containsNode`

源码：`src/core/model.ts:1244`

判断node，并保持模型、界面和持久化状态的一致性。

```ts
export function containsNode(root: MindMapNode, id: string): boolean
```

### 函数 `removeNode`

源码：`src/core/model.ts:1255`

删除node，并保持模型、界面和持久化状态的一致性。

```ts
export function removeNode(root: MindMapNode, id: string): boolean
```

### 类型 `NodeDropPosition`

源码：`src/core/model.ts:1268`

可用于节点拖放的目标位置。

```ts
export type NodeDropPosition = "before" | "child" | "after";
```

### 函数 `moveNodeRelative`

源码：`src/core/model.ts:1280`

将节点移动到目标节点之前、之后或目标节点内部。

```ts
export function moveNodeRelative(root: MindMapNode, draggedId: string, targetId: string, position: NodeDropPosition): boolean
```

### 函数 `collectWikiLinks`

源码：`src/core/model.ts:1323`

遍历并收集wiki links，并保持模型、界面和持久化状态的一致性。

```ts
export function collectWikiLinks(root: MindMapNode): Set<string>
```

### 函数 `extractFirstWikiLink`

源码：`src/core/model.ts:1350`

执行“extract first wiki link”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function extractFirstWikiLink(value: string): string | null
```

### 函数 `getTaskProgress`

源码：`src/core/model.ts:1361`

读取并返回task progress，并保持模型、界面和持久化状态的一致性。

```ts
export function getTaskProgress(root: MindMapNode): TaskProgress
```

### 函数 `nodeSearchText`

源码：`src/core/model.ts:1378`

执行“node search text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodeSearchText(node: MindMapNode): string
```

### 函数 `taskPrefix`

源码：`src/core/model.ts:1391`

执行“task prefix”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function taskPrefix(task: TaskStatus | undefined): string
```

### 函数 `escapeInlineMarkdown`

源码：`src/core/model.ts:1404`

转义inline markdown，并保持模型、界面和持久化状态的一致性。

```ts
function escapeInlineMarkdown(value: string): string
```

### 函数 `richTextToMarkdown`

源码：`src/core/model.ts:1415`

执行“rich text to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextToMarkdown(runs: MindMapTextRun[] | undefined, fallbackText: string): string
```

### 函数 `tableToMarkdown`

源码：`src/core/model.ts:1436`

执行“table to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function tableToMarkdown(table: MindMapTable): string
```

### 函数 `splitMarkdownTableRow`

源码：`src/core/model.ts:1454`

执行“split markdown table row”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function splitMarkdownTableRow(line: string): string[]
```

### 函数 `parseMarkdownTable`

源码：`src/core/model.ts:1475`

解析markdown table，并保持模型、界面和持久化状态的一致性。

```ts
export function parseMarkdownTable(markdown: string): MindMapTable | null
```

### 函数 `parseFencedCode`

源码：`src/core/model.ts:1509`

解析fenced code，并保持模型、界面和持久化状态的一致性。

```ts
export function parseFencedCode(markdown: string): MindMapCodeBlock | null
```

### 函数 `childrenToTable`

源码：`src/core/model.ts:1521`

执行“children to table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function childrenToTable(node: MindMapNode): MindMapTable | null
```

### 函数 `documentToMarkdown`

源码：`src/core/model.ts:1543`

执行“document to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function documentToMarkdown(doc: MindMapDocument): string
```

### 函数 `parseTaskText`

源码：`src/core/model.ts:1585`

解析task text，并保持模型、界面和持久化状态的一致性。

```ts
function parseTaskText(value: string):
```

### 函数 `markdownToDocument`

源码：`src/core/model.ts:1600`

执行“markdown to document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function markdownToDocument(markdown: string, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `indentedTextToMarkdown`

源码：`src/core/model.ts:1657`

Converts tab- or space-indented outline text (including XMind clipboard fallback text) into Markdown while preserving its hierarchy.

```ts
export function indentedTextToMarkdown(text: string): string
```

## `src/editor/clipboard-import.ts`

编辑器剪贴板内容的节点分支解析。

### 函数 `parseClipboardNode`

源码：`src/editor/clipboard-import.ts:20`

解析剪贴板纯文本中的节点 JSON、Markdown 或缩进文本。

```ts
export function parseClipboardNode(text: string): MindMapNode | null
```

### 函数 `parseClipboardHtml`

源码：`src/editor/clipboard-import.ts:61`

解析富剪贴板提供的嵌套 HTML 列表。

```ts
export function parseClipboardHtml(html: string): MindMapNode | null
```

## `src/editor/content-modals.ts`

编辑器领域的表格与代码块弹窗。

### 函数 `cloneTable`

源码：`src/editor/content-modals.ts:24`

执行“clone table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function cloneTable(table: MindMapTable | undefined): MindMapTable
```

### 类 `TableEditModal`

源码：`src/editor/content-modals.ts:39`

TableEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class TableEditModal extends Modal
```

### 构造函数 `TableEditModal.constructor`

源码：`src/editor/content-modals.ts:52`

创建 TableEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, table: MindMapTable | undefined, submit: (table: MindMapTable) => void)
```

### 方法 `TableEditModal.onOpen`

源码：`src/editor/content-modals.ts:61`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `TableEditModal.renderGrid`

源码：`src/editor/content-modals.ts:151`

渲染grid，并保持模型、界面和持久化状态的一致性。

```ts
private renderGrid(): void
```

### 方法 `TableEditModal.collectGrid`

源码：`src/editor/content-modals.ts:178`

遍历并收集grid，并保持模型、界面和持久化状态的一致性。

```ts
private collectGrid(): void
```

### 类 `CodeEditModal`

源码：`src/editor/content-modals.ts:202`

CodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class CodeEditModal extends Modal
```

### 构造函数 `CodeEditModal.constructor`

源码：`src/editor/content-modals.ts:213`

创建 CodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, block: MindMapCodeBlock | undefined, submit: (block: MindMapCodeBlock) => void)
```

### 方法 `CodeEditModal.onOpen`

源码：`src/editor/content-modals.ts:222`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

## `src/editor/editor-modals.ts`

编辑器领域的通用预览、搜索和导出弹窗。

### 类 `ImageHostPickerModal`

源码：`src/editor/editor-modals.ts:25`

选择一个或多个图片上传目标。

```ts
class ImageHostPickerModal extends Modal
```

### 构造函数 `ImageHostPickerModal.constructor`

源码：`src/editor/editor-modals.ts:37`

创建图床选择弹窗。

```ts
constructor( app: App, private readonly hosts: ImageHostChoice[], initialIds: string[], private readonly resolveSelection: (ids: string[] | null) => void )
```

### 方法 `ImageHostPickerModal.onOpen`

源码：`src/editor/editor-modals.ts:50`

创建图床多选列表。

```ts
onOpen(): void
```

### 方法 `ImageHostPickerModal.onClose`

源码：`src/editor/editor-modals.ts:86`

未确认时返回取消结果。

```ts
onClose(): void
```

### 函数 `chooseImageHosts`

源码：`src/editor/editor-modals.ts:99`

打开图床选择器，并过滤已经失效的默认 ID。

```ts
export function chooseImageHosts( app: App, hosts: ImageHostChoice[], initialIds: string[] ): Promise<string[] | null>
```

### 类 `ImagePreviewModal`

源码：`src/editor/editor-modals.ts:118`

提供图片缩放和滚轮预览。

```ts
export class ImagePreviewModal extends Modal
```

### 构造函数 `ImagePreviewModal.constructor`

源码：`src/editor/editor-modals.ts:128`

创建图片预览弹窗。

```ts
constructor(app: App, private readonly source: string, private readonly alt: string)
```

### 方法 `ImagePreviewModal.onOpen`

源码：`src/editor/editor-modals.ts:135`

创建图片预览界面和缩放控制。

```ts
onOpen(): void
```

### 类 `FormulaEditModal`

源码：`src/editor/editor-modals.ts:175`

图形化 LaTeX 公式编辑器，提供常用结构按钮和实时预览。

```ts
export class FormulaEditModal extends Modal
```

### 构造函数 `FormulaEditModal.constructor`

源码：`src/editor/editor-modals.ts:182`

创建公式编辑器。

```ts
constructor(app: App, private readonly submit: (source: string) => void)
```

### 方法 `FormulaEditModal.onOpen`

源码：`src/editor/editor-modals.ts:189`

创建公式模板、源码输入和 MathJax 预览。

```ts
onOpen(): void
```

### 方法 `FormulaEditModal.onClose`

源码：`src/editor/editor-modals.ts:293`

清理公式编辑器 DOM。

```ts
onClose(): void
```

### 类 `ArticleStyleModal`

源码：`src/editor/editor-modals.ts:301`

编辑文章模式的预设、字体和颜色。

```ts
export class ArticleStyleModal extends Modal
```

### 构造函数 `ArticleStyleModal.constructor`

源码：`src/editor/editor-modals.ts:311`

创建文章样式编辑器。

```ts
constructor( app: App, style: ArticleStyle | undefined, private readonly submitStyle: (style: ArticleStyle) => void )
```

### 方法 `ArticleStyleModal.onOpen`

源码：`src/editor/editor-modals.ts:323`

创建文章样式预设和自定义控件。

```ts
onOpen(): void
```

### 类 `JsonTransferModal`

源码：`src/editor/editor-modals.ts:394`

导入、导出或替换完整的思维导图 JSON。

```ts
export class JsonTransferModal extends Modal
```

### 构造函数 `JsonTransferModal.constructor`

源码：`src/editor/editor-modals.ts:403`

创建 JSON 传输弹窗。

```ts
constructor( app: App, private readonly document: MindMapDocument, private readonly onImport: (document: MindMapDocument) => void, private readonly onExport: (json: string) => void )
```

### 方法 `JsonTransferModal.onOpen`

源码：`src/editor/editor-modals.ts:415`

创建 JSON 文本区和文件导入操作。

```ts
onOpen(): void
```

### 类 `OutlineModal`

源码：`src/editor/editor-modals.ts:477`

显示只读 Markdown 大纲并提供复制和导出入口。

```ts
export class OutlineModal extends Modal
```

### 构造函数 `OutlineModal.constructor`

源码：`src/editor/editor-modals.ts:485`

创建 Markdown 大纲弹窗。

```ts
constructor(app: App, private readonly markdown: string, private readonly onExport: () => void)
```

### 方法 `OutlineModal.onOpen`

源码：`src/editor/editor-modals.ts:492`

创建大纲内容和操作按钮。

```ts
onOpen(): void
```

### 方法 `OutlineModal.onClose`

源码：`src/editor/editor-modals.ts:513`

清理大纲弹窗 DOM。

```ts
onClose(): void
```

### 类 `SearchNodesModal`

源码：`src/editor/editor-modals.ts:521`

搜索当前文档中的节点。

```ts
export class SearchNodesModal extends Modal
```

### 构造函数 `SearchNodesModal.constructor`

源码：`src/editor/editor-modals.ts:530`

创建节点搜索弹窗。

```ts
constructor( app: App, private readonly nodes: MindMapNode[], private readonly onQuery: (query: string) => void, private readonly onSelect: (node: MindMapNode) => void )
```

### 方法 `SearchNodesModal.onOpen`

源码：`src/editor/editor-modals.ts:542`

创建搜索框和匹配结果列表。

```ts
onOpen(): void
```

### 类 `DocumentExportModal`

源码：`src/editor/editor-modals.ts:590`

提供可移植文档格式的导出选择。

```ts
export class DocumentExportModal extends Modal
```

### 构造函数 `DocumentExportModal.constructor`

源码：`src/editor/editor-modals.ts:597`

创建文档导出格式弹窗。

```ts
constructor(app: App, private readonly exportFormat: (format: "html" | "doc" | "pdf" | "md") => void)
```

### 方法 `DocumentExportModal.onOpen`

源码：`src/editor/editor-modals.ts:604`

创建各导出格式按钮。

```ts
onOpen(): void
```

## `src/editor/editor-types.ts`

编辑器领域与 Obsidian 宿主层之间的稳定类型契约。

### 接口 `MindMapEditorCallbacks`

源码：`src/editor/editor-types.ts:24`

Host services consumed by the editor. Keeping these callbacks outside the editor implementation makes the UI testable without constructing the complete Obsidian plugin.

```ts
export interface MindMapEditorCallbacks
```

### 接口 `MindMapEditorOptions`

源码：`src/editor/editor-types.ts:52`

Runtime editor configuration assembled by the view/plugin layer.

```ts
export interface MindMapEditorOptions
```

## `src/editor/editor.ts`

编辑器领域的核心交互控制器。

### 接口 `NodeEditValues`

源码：`src/editor/editor.ts:83`

NodeEditValues 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface NodeEditValues
```

### 类 `NodeEditModal`

源码：`src/editor/editor.ts:108`

NodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class NodeEditModal extends Modal
```

### 构造函数 `NodeEditModal.constructor`

源码：`src/editor/editor.ts:130`

创建 NodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, node: MindMapNode, defaultShape: NodeShape, callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource">, submit: (values: NodeEdit…
```

### 方法 `NodeEditModal.onOpen`

源码：`src/editor/editor.ts:149`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `NodeEditModal.onClose`

源码：`src/editor/editor.ts:417`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 方法 `NodeEditModal.releaseKeyboardScope`

源码：`src/editor/editor.ts:430`

右侧面板与画布快速输入并存时，释放 Modal 的全局按键作用域。

```ts
releaseKeyboardScope(): void
```

### 类 `AppearanceModal`

源码：`src/editor/editor.ts:438`

AppearanceModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class AppearanceModal extends Modal
```

### 构造函数 `AppearanceModal.constructor`

源码：`src/editor/editor.ts:451`

创建 AppearanceModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, appearance: MindMapAppearance, submit: (appearance: MindMapAppearance) => void, reset: () => void)
```

### 方法 `AppearanceModal.onOpen`

源码：`src/editor/editor.ts:461`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 类 `MindMapEditor`

源码：`src/editor/editor.ts:717`

MindMapEditor 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapEditor
```

### 构造函数 `MindMapEditor.constructor`

源码：`src/editor/editor.ts:773`

创建 MindMapEditor 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, host: HTMLElement, document: MindMapDocument, callbacks: MindMapEditorCallbacks, options: MindMapEditorOptions)
```

### 方法 `MindMapEditor.destroy`

源码：`src/editor/editor.ts:792`

执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
destroy(): void
```

### 方法 `MindMapEditor.setDocument`

源码：`src/editor/editor.ts:808`

更新并应用document，并保持模型、界面和持久化状态的一致性。

```ts
setDocument(document: MindMapDocument, resetHistory = true): void
```

### 方法 `MindMapEditor.setOptions`

源码：`src/editor/editor.ts:826`

更新并应用options，并保持模型、界面和持久化状态的一致性。

```ts
setOptions(options: MindMapEditorOptions): void
```

### 方法 `MindMapEditor.setDisplayMode`

源码：`src/editor/editor.ts:863`

更新并应用display mode，并保持模型、界面和持久化状态的一致性。

```ts
setDisplayMode(mode: DisplayMode, notifyGlobal = true): void
```

### 方法 `MindMapEditor.applyGlobalDisplayMode`

源码：`src/editor/editor.ts:882`

应用global display mode，并保持模型、界面和持久化状态的一致性。

```ts
applyGlobalDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapEditor.toggleReadOnly`

源码：`src/editor/editor.ts:889`

切换read only，并保持模型、界面和持久化状态的一致性。

```ts
toggleReadOnly(): void
```

### 方法 `MindMapEditor.getDocument`

源码：`src/editor/editor.ts:900`

读取并返回document，并保持模型、界面和持久化状态的一致性。

```ts
getDocument(): MindMapDocument
```

### 方法 `MindMapEditor.markSaved`

源码：`src/editor/editor.ts:907`

执行“mark saved”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
markSaved(): void
```

### 方法 `MindMapEditor.markSaving`

源码：`src/editor/editor.ts:915`

执行“mark saving”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
markSaving(): void
```

### 方法 `MindMapEditor.focus`

源码：`src/editor/editor.ts:923`

定位相关数据，并保持模型、界面和持久化状态的一致性。

```ts
focus(): void
```

### 方法 `MindMapEditor.focusNodeById`

源码：`src/editor/editor.ts:932`

定位node by id，并保持模型、界面和持久化状态的一致性。

```ts
focusNodeById(id: string): void
```

### 方法 `MindMapEditor.showArticleDirectory`

源码：`src/editor/editor.ts:942`

Switches the current top-level document to its generated article directory.

```ts
showArticleDirectory(): void
```

### 方法 `MindMapEditor.buildUi`

源码：`src/editor/editor.ts:952`

构建ui，并保持模型、界面和持久化状态的一致性。

```ts
private buildUi(): void
```

### 方法 `MindMapEditor.resolveMode`

源码：`src/editor/editor.ts:1149`

解析并确定mode，并保持模型、界面和持久化状态的一致性。

```ts
private resolveMode(preferred: DisplayMode): DisplayMode
```

### 方法 `MindMapEditor.persistReadOnlyState`

源码：`src/editor/editor.ts:1157`

执行“persist read only state”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private persistReadOnlyState(): void
```

### 方法 `MindMapEditor.updateModeUi`

源码：`src/editor/editor.ts:1167`

执行“update mode ui”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private updateModeUi(): void
```

### 方法 `MindMapEditor.ensureEditable`

源码：`src/editor/editor.ts:1197`

执行“ensure editable”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private ensureEditable(): boolean
```

### 方法 `MindMapEditor.clearImageLoadTimers`

源码：`src/editor/editor.ts:1206`

执行“clear image load timers”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private clearImageLoadTimers(): void
```

### 方法 `MindMapEditor.addToolbarButton`

源码：`src/editor/editor.ts:1221`

添加toolbar button，并保持模型、界面和持久化状态的一致性。

```ts
private addToolbarButton(id: string, icon: string, label: string, action: () => void, editOnly = false): HTMLButtonElement
```

### 方法 `MindMapEditor.applyToolbarOrder`

源码：`src/editor/editor.ts:1241`

Applies the user-defined order to toolbar buttons.

```ts
private applyToolbarOrder(): void
```

### 方法 `MindMapEditor.addToolbarSeparator`

源码：`src/editor/editor.ts:1258`

添加toolbar separator，并保持模型、界面和持久化状态的一致性。

```ts
private addToolbarSeparator(): void
```

### 方法 `MindMapEditor.getAppearance`

源码：`src/editor/editor.ts:1266`

读取并返回appearance，并保持模型、界面和持久化状态的一致性。

```ts
private getAppearance(): MindMapAppearance
```

### 方法 `MindMapEditor.fontFamilyCss`

源码：`src/editor/editor.ts:1276`

执行“font family css”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private fontFamilyCss(appearance: MindMapAppearance): string
```

### 方法 `MindMapEditor.applyAppearance`

源码：`src/editor/editor.ts:1289`

应用appearance，并保持模型、界面和持久化状态的一致性。

```ts
private applyAppearance(appearance: MindMapAppearance): void
```

### 方法 `MindMapEditor.renderNavigation`

源码：`src/editor/editor.ts:1315`

在画布左上角或文档顶部渲染父子导图导航。导图模式使用固定悬浮面包屑，文章和大纲模式使用文档流导航，均保持当前全局显示模式。

```ts
private renderNavigation(): void
```

### 方法 `MindMapEditor.updateNodePrimaryText`

源码：`src/editor/editor.ts:1385`

执行“update node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private updateNodePrimaryText(node: MindMapNode, value: string): void
```

### 方法 `MindMapEditor.makeInlineEditable`

源码：`src/editor/editor.ts:1407`

创建并配置inline editable，并保持模型、界面和持久化状态的一致性。

```ts
private makeInlineEditable(element: HTMLElement, node: MindMapNode, placeholder: string): void
```

### 方法 `MindMapEditor.addInlineNodeActions`

源码：`src/editor/editor.ts:1442`

添加inline node actions，并保持模型、界面和持久化状态的一致性。

```ts
private addInlineNodeActions(container: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.renderOutline`

源码：`src/editor/editor.ts:1459`

按照节点层级渲染可编辑大纲。节点标题、备注和子导图链接仍映射到同一份数据，任何修改都会通过统一变更链同步到导图和文章模式。

```ts
private renderOutline(): void
```

### 方法 `MindMapEditor.renderArticleContent`

源码：`src/editor/editor.ts:1525`

渲染article content，并保持模型、界面和持久化状态的一致性。

```ts
private renderArticleContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean): void
```

### 方法 `MindMapEditor.markWrappedArticleParagraph`

源码：`src/editor/editor.ts:1566`

Adds a two-character first-line indent only when a body paragraph actually occupies more than one rendered line.

```ts
private markWrappedArticleParagraph(paragraph: HTMLParagraphElement): void
```

### 方法 `MindMapEditor.renderArticle`

源码：`src/editor/editor.ts:1581`

渲染文章目录页、章节编号、正文和跨子导图链接。顶层父导图可展示递归目录；子导图根据文章上下文继续父级编号。

```ts
private renderArticle(): void
```

### 方法 `MindMapEditor.renderArticlePager`

源码：`src/editor/editor.ts:1672`

Renders previous, parent, next, and end navigation for a child article page.

```ts
private renderArticlePager(page: HTMLElement): void
```

### 方法 `MindMapEditor.render`

源码：`src/editor/editor.ts:1706`

渲染相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private render(): void
```

### 方法 `MindMapEditor.renderMindMap`

源码：`src/editor/editor.ts:1733`

渲染可交互导图画布：计算布局、绘制连接线和节点、恢复选择状态、绑定拖拽与尺寸手柄、安装子导图整节点入口，并启动图片镜像加载探测。

```ts
private renderMindMap(): void
```

### 方法 `MindMapEditor.applyTransform`

源码：`src/editor/editor.ts:2122`

应用transform，并保持模型、界面和持久化状态的一致性。

```ts
private applyTransform(): void
```

### 方法 `MindMapEditor.selectNode`

源码：`src/editor/editor.ts:2134`

执行“select node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private selectNode(id: string | null): void
```

### 方法 `MindMapEditor.toggleNodeSelection`

源码：`src/editor/editor.ts:2146`

Adds or removes one node from the current multi-selection.

```ts
private toggleNodeSelection(id: string): void
```

### 方法 `MindMapEditor.applySelectionClasses`

源码：`src/editor/editor.ts:2157`

Synchronizes selection classes across all editor views.

```ts
private applySelectionClasses(): void
```

### 方法 `MindMapEditor.selectedNode`

源码：`src/editor/editor.ts:2174`

执行“selected node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private selectedNode(): MindMapNode | null
```

### 方法 `MindMapEditor.createConfiguredNode`

源码：`src/editor/editor.ts:2184`

创建configured node，并保持模型、界面和持久化状态的一致性。

```ts
private createConfiguredNode(text = "新节点"): MindMapNode
```

### 方法 `MindMapEditor.shortcutMatches`

源码：`src/editor/editor.ts:2197`

判断键盘事件是否匹配用户配置的组合键。

```ts
private shortcutMatches(event: KeyboardEvent, shortcut: string): boolean
```

### 方法 `MindMapEditor.beginInlineEdit`

源码：`src/editor/editor.ts:2208`

在节点本体中启动轻量富文本输入。

```ts
private beginInlineEdit(nodeId: string): void
```

### 方法 `MindMapEditor.addChild`

源码：`src/editor/editor.ts:2450`

添加child，并保持模型、界面和持久化状态的一致性。

```ts
private addChild(): void
```

### 方法 `MindMapEditor.addSibling`

源码：`src/editor/editor.ts:2465`

添加sibling，并保持模型、界面和持久化状态的一致性。

```ts
private addSibling(): void
```

### 方法 `MindMapEditor.editSelected`

源码：`src/editor/editor.ts:2486`

编辑selected，并保持模型、界面和持久化状态的一致性。

```ts
private editSelected(): void
```

### 方法 `MindMapEditor.deleteSelected`

源码：`src/editor/editor.ts:2555`

删除selected，并保持模型、界面和持久化状态的一致性。

```ts
private deleteSelected(): void
```

### 方法 `MindMapEditor.toggleCollapse`

源码：`src/editor/editor.ts:2591`

切换collapse，并保持模型、界面和持久化状态的一致性。

```ts
private toggleCollapse(): void
```

### 方法 `MindMapEditor.setAllNodesCollapsed`

源码：`src/editor/editor.ts:2607`

Expands or collapses every branch while keeping the root visible.

```ts
private setAllNodesCollapsed(collapsed: boolean): void
```

### 方法 `MindMapEditor.cycleTask`

源码：`src/editor/editor.ts:2624`

切换task，并保持模型、界面和持久化状态的一致性。

```ts
private cycleTask(): void
```

### 方法 `MindMapEditor.toggleLayout`

源码：`src/editor/editor.ts:2635`

切换layout，并保持模型、界面和持久化状态的一致性。

```ts
private toggleLayout(): void
```

### 方法 `MindMapEditor.toggleArticleLanding`

源码：`src/editor/editor.ts:2644`

Switches the top-level article between its generated directory and original article content.

```ts
private toggleArticleLanding(): void
```

### 方法 `MindMapEditor.editArticleStyle`

源码：`src/editor/editor.ts:2655`

Opens article preset and typography controls for the current document.

```ts
private editArticleStyle(): void
```

### 方法 `MindMapEditor.editAppearance`

源码：`src/editor/editor.ts:2665`

编辑appearance，并保持模型、界面和持久化状态的一致性。

```ts
private editAppearance(): void
```

### 方法 `MindMapEditor.editTable`

源码：`src/editor/editor.ts:2678`

编辑table，并保持模型、界面和持久化状态的一致性。

```ts
private editTable(): void
```

### 方法 `MindMapEditor.convertChildrenToTable`

源码：`src/editor/editor.ts:2689`

转换children to table，并保持模型、界面和持久化状态的一致性。

```ts
private convertChildrenToTable(): void
```

### 方法 `MindMapEditor.removeTable`

源码：`src/editor/editor.ts:2704`

删除table，并保持模型、界面和持久化状态的一致性。

```ts
private removeTable(): void
```

### 方法 `MindMapEditor.editCode`

源码：`src/editor/editor.ts:2717`

编辑code，并保持模型、界面和持久化状态的一致性。

```ts
private editCode(): void
```

### 方法 `MindMapEditor.removeCode`

源码：`src/editor/editor.ts:2728`

删除code，并保持模型、界面和持久化状态的一致性。

```ts
private removeCode(): void
```

### 方法 `MindMapEditor.createOrOpenSubmap`

源码：`src/editor/editor.ts:2739`

如果节点已有子导图则打开；否则创建独立 .mindmap 文件并在父节点与子文件导航元数据中建立双向关系。

```ts
private async createOrOpenSubmap(): Promise<void>
```

### 方法 `MindMapEditor.renderReading`

源码：`src/editor/editor.ts:2760`

Renders every map in the current parent/child family as one continuous, read-only book with an integrated directory and persisted progress.

```ts
private renderReading(): void
```

### 方法 `MindMapEditor.deleteSelectedSubmap`

源码：`src/editor/editor.ts:2841`

Deletes the selected node's submap file when present and clears stale links when the file was already removed outside the plugin.

```ts
private async deleteSelectedSubmap(): Promise<void>
```

### 方法 `MindMapEditor.renderNodeTable`

源码：`src/editor/editor.ts:2864`

渲染node table，并保持模型、界面和持久化状态的一致性。

```ts
private renderNodeTable(content: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.renderNodeCode`

源码：`src/editor/editor.ts:2892`

渲染node code，并保持模型、界面和持久化状态的一致性。

```ts
private renderNodeCode(content: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.handlePaste`

源码：`src/editor/editor.ts:2916`

处理编辑器内粘贴：优先识别图片并保存为本地资源，其次识别表格、代码块、JSON 分支或普通文本。图片可按设置进入延迟自动上传流程。

```ts
private async handlePaste(event: ClipboardEvent): Promise<void>
```

### 方法 `MindMapEditor.openSelectedLink`

源码：`src/editor/editor.ts:2977`

打开selected link，并保持模型、界面和持久化状态的一致性。

```ts
private openSelectedLink(): void
```

### 方法 `MindMapEditor.isParentNavigationBacklink`

源码：`src/editor/editor.ts:2994`

判断parent navigation backlink，并保持模型、界面和持久化状态的一致性。

```ts
private isParentNavigationBacklink(node: MindMapNode): boolean
```

### 方法 `MindMapEditor.getNodeLink`

源码：`src/editor/editor.ts:3011`

读取并返回node link，并保持模型、界面和持久化状态的一致性。

```ts
private getNodeLink(node: MindMapNode): string | null
```

### 方法 `MindMapEditor.showOutline`

源码：`src/editor/editor.ts:3020`

执行“show outline”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private showOutline(): void
```

### 方法 `MindMapEditor.showJsonTransfer`

源码：`src/editor/editor.ts:3028`

执行“show json transfer”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private showJsonTransfer(): void
```

### 方法 `MindMapEditor.showDocumentExport`

源码：`src/editor/editor.ts:3041`

Opens the HTML, Word, PDF, and Markdown export chooser.

```ts
private showDocumentExport(): void
```

### 方法 `MindMapEditor.openSearch`

源码：`src/editor/editor.ts:3050`

打开search，并保持模型、界面和持久化状态的一致性。

```ts
private openSearch(): void
```

### 方法 `MindMapEditor.focusNode`

源码：`src/editor/editor.ts:3060`

定位指定节点。必要时先展开全部祖先、切换到可显示该节点的视图并重渲染，然后选中节点并将其平滑移动到可视区域中央。

```ts
private focusNode(id: string): void
```

### 方法 `MindMapEditor.centerNode`

源码：`src/editor/editor.ts:3085`

定位node，并保持模型、界面和持久化状态的一致性。

```ts
private centerNode(id: string): void
```

### 方法 `MindMapEditor.openContextMenu`

源码：`src/editor/editor.ts:3099`

打开context menu，并保持模型、界面和持久化状态的一致性。

```ts
private openContextMenu(event: MouseEvent): void
```

### 方法 `MindMapEditor.openAllNodesContextMenu`

源码：`src/editor/editor.ts:3152`

Opens the canvas and toolbar context menu for global branch visibility.

```ts
private openAllNodesContextMenu(event: MouseEvent): void
```

### 方法 `MindMapEditor.insertFormula`

源码：`src/editor/editor.ts:3168`

打开图形化公式编辑器并把生成的公式追加到当前节点。

```ts
private insertFormula(): void
```

### 方法 `MindMapEditor.copySelectedBranch`

源码：`src/editor/editor.ts:3192`

复制selected branch，并保持模型、界面和持久化状态的一致性。

```ts
private async copySelectedBranch(): Promise<boolean>
```

### 方法 `MindMapEditor.pasteAsChild`

源码：`src/editor/editor.ts:3209`

粘贴as child，并保持模型、界面和持久化状态的一致性。

```ts
private async pasteAsChild(): Promise<void>
```

### 方法 `MindMapEditor.duplicateSelected`

源码：`src/editor/editor.ts:3234`

复制生成selected，并保持模型、界面和持久化状态的一致性。

```ts
private duplicateSelected(): void
```

### 方法 `MindMapEditor.canMoveNode`

源码：`src/editor/editor.ts:3258`

判断reparent，并保持模型、界面和持久化状态的一致性。

```ts
private canMoveNode(draggedId: string | null, targetId: string): boolean
```

### 方法 `MindMapEditor.dropPositionForEvent`

源码：`src/editor/editor.ts:3278`

根据指针在目标节点的位置判断拖放意图。右侧和中间均成为子级；根节点仅接受子节点放置。

```ts
private dropPositionForEvent(event: DragEvent, targetEl: HTMLElement, targetId: string): NodeDropPosition
```

### 方法 `MindMapEditor.isRightChildDrop`

源码：`src/editor/editor.ts:3295`

Checks whether the pointer is in the explicit right-side child drop zone.

```ts
private isRightChildDrop(event: DragEvent, targetEl: HTMLElement): boolean
```

### 方法 `MindMapEditor.clearDropIndicators`

源码：`src/editor/editor.ts:3302`

清理全部拖放目标样式，防止跨节点移动时残留指示线。

```ts
private clearDropIndicators(): void
```

### 方法 `MindMapEditor.showDropPreview`

源码：`src/editor/editor.ts:3314`

Renders a magnetic placeholder at the exact location represented by the current before, child, or after drop zone.

```ts
private showDropPreview(targetId: string, position: NodeDropPosition): void
```

### 方法 `MindMapEditor.clearDropPreview`

源码：`src/editor/editor.ts:3351`

Removes the temporary magnetic drop placeholder.

```ts
private clearDropPreview(): void
```

### 方法 `MindMapEditor.moveNode`

源码：`src/editor/editor.ts:3363`

在统一编辑事务中移动节点，支持同级前后排序和改变父子关系。

```ts
private moveNode(draggedId: string, targetId: string, position: NodeDropPosition): void
```

### 方法 `MindMapEditor.replaceDocument`

源码：`src/editor/editor.ts:3396`

替换document，并保持模型、界面和持久化状态的一致性。

```ts
private replaceDocument(document: MindMapDocument): void
```

### 方法 `MindMapEditor.mutate`

源码：`src/editor/editor.ts:3415`

所有用户可撤销写操作的统一入口。调用前克隆当前文档写入撤销栈，执行修改，规范化和重渲染，再通知视图自动保存；只读状态会在更上层阻止进入该流程。

```ts
private mutate(action: () => void): void
```

### 方法 `MindMapEditor.trimHistory`

源码：`src/editor/editor.ts:3429`

裁剪history，并保持模型、界面和持久化状态的一致性。

```ts
private trimHistory(): void
```

### 方法 `MindMapEditor.undo`

源码：`src/editor/editor.ts:3437`

撤销相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private undo(): void
```

### 方法 `MindMapEditor.redo`

源码：`src/editor/editor.ts:3452`

重做相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private redo(): void
```

### 方法 `MindMapEditor.fitToView`

源码：`src/editor/editor.ts:3468`

执行“fit to view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private fitToView(): void
```

### 方法 `MindMapEditor.setZoom`

源码：`src/editor/editor.ts:3485`

更新并应用zoom，并保持模型、界面和持久化状态的一致性。

```ts
private setZoom(value: number): void
```

### 方法 `MindMapEditor.clampZoom`

源码：`src/editor/editor.ts:3496`

执行“clamp zoom”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private clampZoom(value: number): number
```

### 方法 `MindMapEditor.navigateSelection`

源码：`src/editor/editor.ts:3505`

执行“navigate selection”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private navigateSelection(direction: "parent" | "child" | "previous" | "next"): void
```

### 方法 `MindMapEditor.handleKeydown`

源码：`src/editor/editor.ts:3529`

处理keydown，并保持模型、界面和持久化状态的一致性。

```ts
private handleKeydown(event: KeyboardEvent): void
```

## `src/editor/node-image-actions.ts`

节点编辑器领域的图片保存、图床上传和镜像合并。

### 类型 `NodeImageCallbacks`

源码：`src/editor/node-image-actions.ts:14`

节点图片操作所需的最小宿主服务集合。

```ts
type NodeImageCallbacks = Pick< MindMapEditorCallbacks, "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource" >;
```

### 函数 `selectImageFile`

源码：`src/editor/node-image-actions.ts:28`

打开系统图片选择器。

```ts
function selectImageFile(): Promise<File | null>
```

### 函数 `selectNodeImage`

源码：`src/editor/node-image-actions.ts:47`

选择图片并保存到仓库或上传到图床。

```ts
export async function selectNodeImage( app: App, block: MindMapImageContentBlock, mode: "local" | "remote", callbacks: NodeImageCallbacks ): Promise<boolean>
```

### 函数 `uploadCurrentNodeImage`

源码：`src/editor/node-image-actions.ts:100`

上传图片块当前指向的本地图片，并合并已有远程镜像。

```ts
export async function uploadCurrentNodeImage( app: App, block: MindMapImageContentBlock, callbacks: NodeImageCallbacks ): Promise<boolean>
```

## `src/editor/node-rich-text-editor.ts`

节点编辑器领域的富文本块编辑、选区样式和预览。

### 函数 `renderNodeRichTextEditor`

源码：`src/editor/node-rich-text-editor.ts:22`

在指定容器中创建一个节点文字块编辑器。

```ts
export function renderNodeRichTextEditor( container: HTMLElement, block: MindMapTextContentBlock, onChange: () => void ): void
```

## `src/editor/rich-text-dom.ts`

编辑器领域中富文本模型与可编辑 DOM 的转换。

### 函数 `ensureMathJax`

源码：`src/editor/rich-text-dom.ts:22`

确保 Obsidian 的 MathJax 运行时已加载。

```ts
export function ensureMathJax(): Promise<void>
```

### 函数 `styleEquals`

源码：`src/editor/rich-text-dom.ts:35`

判断两个字符样式是否等价。

```ts
function styleEquals(left: MindMapTextStyle | undefined, right: MindMapTextStyle | undefined): boolean
```

### 函数 `renderRichTextRuns`

源码：`src/editor/rich-text-dom.ts:47`

将富文本运行段渲染到 DOM，并按需处理 LaTeX。

```ts
export function renderRichTextRuns( container: HTMLElement, runs: MindMapTextRun[] | undefined, fallbackText: string, latex = true ): void
```

### 函数 `styleFromElement`

源码：`src/editor/rich-text-dom.ts:110`

合并元素标签、内联样式与继承样式。

```ts
function styleFromElement(element: HTMLElement, inherited: MindMapTextStyle): MindMapTextStyle
```

### 函数 `readRichTextEditor`

源码：`src/editor/rich-text-dom.ts:144`

将 contenteditable DOM 解析回富文本运行段。

```ts
export function readRichTextEditor(editor: HTMLElement):
```

## `src/import/import-export.ts`

导入导出领域的 XMind 与文章文档转换工具。

### 类型 `XMindTopic`

源码：`src/import/import-export.ts:11`

Minimal modern XMind topic shape used during import.

```ts
type XMindTopic =
```

### 函数 `xmindToDocument`

源码：`src/import/import-export.ts:24`

Imports a modern XMind archive containing content.json.

```ts
export function xmindToDocument(source: ArrayBuffer, fallbackTitle = "XMind 导入"): MindMapDocument
```

### 函数 `documentToHtml`

源码：`src/import/import-export.ts:56`

Produces a standalone article-style HTML document suitable for browsers, Word-compatible .doc files, and printing to PDF.

```ts
export function documentToHtml(document: MindMapDocument): string
```

### 函数 `readingSectionsToHtml`

源码：`src/import/import-export.ts:67`

Produces one portable article from a map and all recursively collected child maps in the same order used by continuous reading mode.

```ts
export function readingSectionsToHtml(sections: ReadingSection[]): string
```

## `src/main.ts`

插件入口与跨文件服务层。

### 类 `MindMapStudioPlugin`

源码：`src/main.ts:58`

MindMapStudioPlugin 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export default class MindMapStudioPlugin extends Plugin
```

### 方法 `MindMapStudioPlugin.onload`

源码：`src/main.ts:68`

执行“onload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async onload(): Promise<void>
```

### 方法 `MindMapStudioPlugin.onunload`

源码：`src/main.ts:223`

执行“onunload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
onunload(): void
```

### 方法 `MindMapStudioPlugin.openGlobalSearch`

源码：`src/main.ts:233`

打开global search，并保持模型、界面和持久化状态的一致性。

```ts
openGlobalSearch(): void
```

### 方法 `MindMapStudioPlugin.openGlobalSearchAfterIndexReady`

源码：`src/main.ts:240`

打开global search after index ready，并保持模型、界面和持久化状态的一致性。

```ts
private async openGlobalSearchAfterIndexReady(): Promise<void>
```

### 方法 `MindMapStudioPlugin.openMapFamilySearch`

源码：`src/main.ts:257`

打开map family search，并保持模型、界面和持久化状态的一致性。

```ts
async openMapFamilySearch(file: TFile, currentDocument?: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.rebuildGlobalSearchIndex`

源码：`src/main.ts:279`

重建global search index，并保持模型、界面和持久化状态的一致性。

```ts
async rebuildGlobalSearchIndex(): Promise<void>
```

### 方法 `MindMapStudioPlugin.getGlobalSearchIndexStatus`

源码：`src/main.ts:289`

读取并返回global search index status，并保持模型、界面和持久化状态的一致性。

```ts
getGlobalSearchIndexStatus()
```

### 方法 `MindMapStudioPlugin.openGlobalSearchResult`

源码：`src/main.ts:298`

打开global search result，并保持模型、界面和持久化状态的一致性。

```ts
private async openGlobalSearchResult(result: MindMapSearchResult): Promise<void>
```

### 方法 `MindMapStudioPlugin.loadSettings`

源码：`src/main.ts:311`

加载settings，并保持模型、界面和持久化状态的一致性。

```ts
async loadSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.saveSettings`

源码：`src/main.ts:461`

保存settings，并保持模型、界面和持久化状态的一致性。

```ts
async saveSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.setGlobalDisplayMode`

源码：`src/main.ts:471`

保存全局显示模式并通知所有已打开 MindMapStudioView 同步切换。之后打开的父导图、子导图和普通导图都会继承该模式。

```ts
async setGlobalDisplayMode(mode: DisplayMode): Promise<void>
```

### 方法 `MindMapStudioPlugin.resetAllSettings`

源码：`src/main.ts:485`

执行“reset all settings”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async resetAllSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.refreshOpenViews`

源码：`src/main.ts:494`

刷新open views，并保持模型、界面和持久化状态的一致性。

```ts
refreshOpenViews(): void
```

### 方法 `MindMapStudioPlugin.createConfiguredDocument`

源码：`src/main.ts:506`

创建configured document，并保持模型、界面和持久化状态的一致性。

```ts
createConfiguredDocument(title: string): MindMapDocument
```

### 方法 `MindMapStudioPlugin.resolveMindMapFile`

源码：`src/main.ts:522`

解析并确定mind map file，并保持模型、界面和持久化状态的一致性。

```ts
private resolveMindMapFile(path: string, sourcePath = ""): TFile | null
```

### 方法 `MindMapStudioPlugin.readMindMapDocument`

源码：`src/main.ts:537`

执行“read mind map document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async readMindMapDocument(file: TFile): Promise<MindMapDocument>
```

### 方法 `MindMapStudioPlugin.findNodeDepth`

源码：`src/main.ts:548`

查找node depth，并保持模型、界面和持久化状态的一致性。

```ts
private findNodeDepth(root: MindMapNode, nodeId: string): number | null
```

### 方法 `MindMapStudioPlugin.computeArticleBaseDepth`

源码：`src/main.ts:568`

执行“compute article base depth”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async computeArticleBaseDepth(file: TFile, document: MindMapDocument, visited = new Set<string>()): Promise<number>
```

### 方法 `MindMapStudioPlugin.buildArticleContext`

源码：`src/main.ts:597`

沿子导图 navigation.parentPath 逐级回溯父文件，计算当前子导图在整篇文章中的基础标题深度、完整面包屑和顶层目录数据，并防止循环引用。

```ts
async buildArticleContext(file: TFile, document: MindMapDocument): Promise<
```

### 类型 `Item`

源码：`src/main.ts:618`

Item 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
type Item =
```

### 方法 `MindMapStudioPlugin.buildDescendantReadingSections`

源码：`src/main.ts:711`

Collects the current map and every reachable child map without walking up to its parent. This is the export counterpart of continuous reading.

```ts
async buildDescendantReadingSections(file: TFile, document: MindMapDocument): Promise<ReadingSection[]>
```

### 方法 `MindMapStudioPlugin.getAvailablePath`

源码：`src/main.ts:742`

读取并返回available path，并保持模型、界面和持久化状态的一致性。

```ts
async getAvailablePath(preferredPath: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.createMindMap`

源码：`src/main.ts:759`

创建mind map，并保持模型、界面和持久化状态的一致性。

```ts
async createMindMap(options:
```

### 方法 `MindMapStudioPlugin.openAsMindMap`

源码：`src/main.ts:789`

打开as mind map，并保持模型、界面和持久化状态的一致性。

```ts
async openAsMindMap(file: TFile, preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.savePastedImage`

源码：`src/main.ts:810`

保存pasted image，并保持模型、界面和持久化状态的一致性。

```ts
async savePastedImage(blob: Blob, suggestedName: string, sourceFile: TFile | null): Promise<string>
```

### 方法 `MindMapStudioPlugin.readImageSource`

源码：`src/main.ts:836`

执行“read image source”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async readImageSource(source: string, sourceFile: TFile | null): Promise<
```

### 方法 `MindMapStudioPlugin.getImageHostChoices`

源码：`src/main.ts:852`

读取并返回image host choices，并保持模型、界面和持久化状态的一致性。

```ts
getImageHostChoices(): ImageHostChoice[]
```

### 方法 `MindMapStudioPlugin.getDefaultUploadHostIds`

源码：`src/main.ts:862`

读取并返回default upload host ids，并保持模型、界面和持久化状态的一致性。

```ts
getDefaultUploadHostIds(): string[]
```

### 方法 `MindMapStudioPlugin.uploadImageToHosts`

源码：`src/main.ts:876`

把同一张图片上传到多个已配置图床，分别收集成功与失败结果。只有所有选中图床成功且文档保存完成后，调用方才允许删除本地文件。

```ts
async uploadImageToHosts(blob: Blob, suggestedName: string, hostIds: string[]): Promise<ImageHostUploadBatch>
```

### 方法 `MindMapStudioPlugin.testImageHost`

源码：`src/main.ts:908`

执行“test image host”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async testImageHost(hostId: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.scheduleAutoUpload`

源码：`src/main.ts:947`

安排延迟执行auto upload，并保持模型、界面和持久化状态的一致性。

```ts
scheduleAutoUpload(file: TFile | null, nodeId: string, blockId: string, localPath: string, suggestedName: string): boolean
```

### 方法 `MindMapStudioPlugin.runAutoUploadTask`

源码：`src/main.ts:977`

执行延迟自动上传任务。它确认节点和图片块仍存在、读取本地资源、上传到默认图床、更新远程镜像列表并保存；任一图床失败时保留本地文件。

```ts
private async runAutoUploadTask( mindMapPath: string, nodeId: string, blockId: string, localPath: string, suggestedName: string, hostIds: string[] ): Promise<void>
```

### 方法 `MindMapStudioPlugin.uploadImageToHostConfig`

源码：`src/main.ts:1047`

上传image to host config，并保持模型、界面和持久化状态的一致性。

```ts
private async uploadImageToHostConfig(host: ImageHostConfig, blob: Blob, suggestedName: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.flushOpenView`

源码：`src/main.ts:1106`

执行“flush open view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async flushOpenView(path: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.refreshOpenMindMap`

源码：`src/main.ts:1118`

刷新open mind map，并保持模型、界面和持久化状态的一致性。

```ts
private async refreshOpenMindMap(file: TFile, document: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.deleteLocalAssetIfSafe`

源码：`src/main.ts:1134`

在删除本地图片前进行最终安全检查：远程源必须存在、当前文档必须已保存、资源路径必须是仓库内文件且没有其他节点继续引用。

```ts
private async deleteLocalAssetIfSafe(localPath: string, currentMindMapPath: string, blockId: string): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.mimeFromFilename`

源码：`src/main.ts:1169`

执行“mime from filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private mimeFromFilename(filename: string): string
```

### 方法 `MindMapStudioPlugin.createSubmapFile`

源码：`src/main.ts:1182`

在父导图资源目录下创建子导图文件，写入 parentPath、parentNodeId 和 parentTitle，并把生成路径回写到父节点，实现可靠的双向导航。

```ts
async createSubmapFile(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap>
```

### 方法 `MindMapStudioPlugin.deleteSubmapFile`

源码：`src/main.ts:1217`

Moves a linked child mind-map file to the system trash.

```ts
async deleteSubmapFile(parentFile: TFile, submap: MindMapSubmap): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.openMindMapPath`

源码：`src/main.ts:1232`

打开mind map path，并保持模型、界面和持久化状态的一致性。

```ts
async openMindMapPath(path: string, sourcePath = "", preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.ensureFolderPath`

源码：`src/main.ts:1248`

执行“ensure folder path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async ensureFolderPath(folder: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.migrateLegacyFile`

源码：`src/main.ts:1266`

迁移legacy file，并保持模型、界面和持久化状态的一致性。

```ts
async migrateLegacyFile(file: TFile, openAfter = true): Promise<TFile | null>
```

### 方法 `MindMapStudioPlugin.isMindMapFile`

源码：`src/main.ts:1304`

判断mind map file，并保持模型、界面和持久化状态的一致性。

```ts
isMindMapFile(file: TFile): boolean
```

### 方法 `MindMapStudioPlugin.isLegacyMindMapFile`

源码：`src/main.ts:1314`

判断legacy mind map file，并保持模型、界面和持久化状态的一致性。

```ts
isLegacyMindMapFile(file: TFile): boolean
```

### 方法 `MindMapStudioPlugin.convertMarkdownFile`

源码：`src/main.ts:1323`

转换markdown file，并保持模型、界面和持久化状态的一致性。

```ts
private async convertMarkdownFile(file: TFile): Promise<void>
```

### 方法 `MindMapStudioPlugin.resolveFolder`

源码：`src/main.ts:1340`

解析并确定folder，并保持模型、界面和持久化状态的一致性。

```ts
private async resolveFolder(explicitFolder: string | undefined, activeFile: TFile | null): Promise<string>
```

### 方法 `MindMapStudioPlugin.buildNewTitle`

源码：`src/main.ts:1354`

构建new title，并保持模型、界面和持久化状态的一致性。

```ts
private buildNewTitle(): string
```

### 方法 `MindMapStudioPlugin.sanitizeFilename`

源码：`src/main.ts:1367`

执行“sanitize filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private sanitizeFilename(value: string): string
```

### 方法 `MindMapStudioPlugin.getSourceTitle`

源码：`src/main.ts:1377`

读取并返回source title，并保持模型、界面和持久化状态的一致性。

```ts
private getSourceTitle(context: MarkdownPostProcessorContext): string
```

### 方法 `MindMapStudioPlugin.processMindMapEmbeds`

源码：`src/main.ts:1389`

注册 Markdown 代码块静态渲染，并在阅读模式中解析嵌入的思维导图源。静态预览不会修改原文件。

```ts
private async processMindMapEmbeds(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<void>
```

## `src/render/layout.ts`

渲染领域的布局计算与 SVG 导出模块。

### 接口 `NodePosition`

源码：`src/render/layout.ts:13`

NodePosition 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface NodePosition
```

### 接口 `LayoutResult`

源码：`src/render/layout.ts:27`

LayoutResult 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface LayoutResult
```

### 函数 `visibleChildren`

源码：`src/render/layout.ts:47`

执行“visible children”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function visibleChildren(node: MindMapNode): MindMapNode[]
```

### 函数 `estimatedTextLines`

源码：`src/render/layout.ts:59`

执行“estimated text lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function estimatedTextLines(text: string, width: number, fontSize: number): number
```

### 函数 `nodeDimensions`

源码：`src/render/layout.ts:74`

执行“node dimensions”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function nodeDimensions(node: MindMapNode, depth: number, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance =
```

### 函数 `subtreeHeight`

源码：`src/render/layout.ts:140`

执行“subtree height”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function subtreeHeight(node: MindMapNode, depth: number, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance =
```

### 函数 `layoutBranch`

源码：`src/render/layout.ts:162`

执行“layout branch”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function layoutBranch( node: MindMapNode, parentId: string, parentX: number, parentWidth: number, side: -1 | 1, depth: number, centerY: number, output: NodePosition[], defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance =
```

### 函数 `computeLayout`

源码：`src/render/layout.ts:203`

计算当前可见节点的尺寸、坐标、深度和整体边界。折叠节点的后代不会参与布局；节点自定义宽度和最小高度会直接影响子树占位与连接线端点。

```ts
export function computeLayout(root: MindMapNode, mode: LayoutMode, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance =
```

### 函数 `buildBranchColorMap`

源码：`src/render/layout.ts:266`

构建branch color map，并保持模型、界面和持久化状态的一致性。

```ts
export function buildBranchColorMap(root: MindMapNode, colors: string[] | undefined): Map<string, string>
```

### 函数 `edgeWidthForDepth`

源码：`src/render/layout.ts:286`

根据连接线模式计算指定层级的线宽。统一模式始终返回起始宽度；渐细模式会按当前实际最大深度插值，并保证最深层达到最小宽度。

```ts
export function edgeWidthForDepth(appearance: MindMapAppearance, depth: number, maxDepth = 5): number
```

### 函数 `edgePath`

源码：`src/render/layout.ts:306`

执行“edge path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function edgePath(parent: NodePosition, child: NodePosition, style: EdgeStyle = "curved"): string
```

### 函数 `roundedElbowEdgePath`

源码：`src/render/layout.ts:323`

Builds an orthogonal branch with rounded corners for the rounded-branch visual style without relying on external assets.

```ts
export function roundedElbowEdgePath(parent: NodePosition, child: NodePosition): string
```

### 函数 `escapeXml`

源码：`src/render/layout.ts:348`

转义xml，并保持模型、界面和持久化状态的一致性。

```ts
export function escapeXml(value: string): string
```

### 函数 `validColor`

源码：`src/render/layout.ts:362`

执行“valid color”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function validColor(value: string | undefined, fallback: string): string
```

### 函数 `svgRadius`

源码：`src/render/layout.ts:372`

执行“svg radius”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgRadius(shape: NodeShape | undefined): number
```

### 函数 `taskGlyph`

源码：`src/render/layout.ts:384`

执行“task glyph”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function taskGlyph(node: MindMapNode): string
```

### 函数 `truncateRuns`

源码：`src/render/layout.ts:398`

执行“truncate runs”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function truncateRuns(runs: MindMapTextRun[], maxLength: number): MindMapTextRun[]
```

### 函数 `richTextTspans`

源码：`src/render/layout.ts:427`

执行“rich text tspans”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function richTextTspans(runs: MindMapTextRun[] | undefined, fallbackText: string, prefix: string, foreground: string, maxChars = 160): string
```

### 函数 `svgWrappedLines`

源码：`src/render/layout.ts:454`

执行“svg wrapped lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgWrappedLines(text: string, width: number, fontSize: number): string[]
```

### 函数 `svgFontFamily`

源码：`src/render/layout.ts:472`

执行“svg font family”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgFontFamily(mode: FontFamilyMode | undefined, customFont: string | undefined): string
```

### 函数 `documentToSvg`

源码：`src/render/layout.ts:489`

使用与编辑画布一致的布局、文本对齐、节点尺寸、主题颜色、富文本和渐细连线生成独立 SVG 字符串。导出过程不依赖 DOM。

```ts
export function documentToSvg(root: MindMapNode, mode: LayoutMode, title: string, appearance: MindMapAppearance =
```

## `src/render/static-render.ts`

渲染领域的 Markdown 只读导图入口。

### 函数 `renderStaticMindMap`

源码：`src/render/static-render.ts:19`

渲染static mind map，并保持模型、界面和持久化状态的一致性。

```ts
export function renderStaticMindMap( container: HTMLElement, document: MindMapDocument, options?:
```

### 函数 `renderStaticSource`

源码：`src/render/static-render.ts:50`

渲染static source，并保持模型、界面和持久化状态的一致性。

```ts
export function renderStaticSource(container: HTMLElement, source: string, fallbackTitle: string, defaultAppearance?: MindMapAppearance): void
```

## `src/search/global-search.ts`

搜索领域的本地索引与导图族搜索模块。

### 接口 `MindMapSearchEntry`

源码：`src/search/global-search.ts:21`

MindMapSearchEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchEntry
```

### 接口 `MindMapSearchResult`

源码：`src/search/global-search.ts:45`

MindMapSearchResult 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchResult extends MindMapSearchEntry
```

### 接口 `IndexedMindMapFile`

源码：`src/search/global-search.ts:54`

IndexedMindMapFile 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface IndexedMindMapFile
```

### 接口 `PersistedMindMapSearchIndex`

源码：`src/search/global-search.ts:65`

PersistedMindMapSearchIndex 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface PersistedMindMapSearchIndex
```

### 接口 `MindMapSearchIndexStatus`

源码：`src/search/global-search.ts:74`

MindMapSearchIndexStatus 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchIndexStatus
```

### 函数 `normalized`

源码：`src/search/global-search.ts:88`

校验并规范化d，并保持模型、界面和持久化状态的一致性。

```ts
function normalized(value: string): string
```

### 函数 `compact`

源码：`src/search/global-search.ts:99`

执行“compact”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function compact(value: string | undefined, max = 180): string | undefined
```

### 函数 `nodeDisplayText`

源码：`src/search/global-search.ts:111`

执行“node display text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function nodeDisplayText(node: MindMapNode): string
```

### 函数 `fieldValues`

源码：`src/search/global-search.ts:126`

执行“field values”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function fieldValues(node: MindMapNode): Array<
```

### 函数 `buildSearchEntries`

源码：`src/search/global-search.ts:153`

构建search entries，并保持模型、界面和持久化状态的一致性。

```ts
export function buildSearchEntries(document: MindMapDocument, filePath: string): MindMapSearchEntry[]
```

### 函数 `mergeHierarchy`

源码：`src/search/global-search.ts:195`

合并hierarchy，并保持模型、界面和持久化状态的一致性。

```ts
function mergeHierarchy(prefix: string[], suffix: string[]): string[]
```

### 函数 `resolveHierarchicalEntries`

源码：`src/search/global-search.ts:209`

Resolve parent/child map relations into paths such as 古诗 › 唐诗 › 李白.

```ts
export function resolveHierarchicalEntries(files: Record<string, IndexedMindMapFile>): MindMapSearchEntry[]
```

### 函数 `resultSnippet`

源码：`src/search/global-search.ts:278`

执行“result snippet”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function resultSnippet(entry: MindMapSearchEntry, query: string):
```

### 函数 `searchEntries`

源码：`src/search/global-search.ts:303`

执行“search entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function searchEntries(entries: MindMapSearchEntry[], query: string, limit = 100): MindMapSearchResult[]
```

### 函数 `collectIndexedFamilyPaths`

源码：`src/search/global-search.ts:338`

从当前文件向上寻找最顶层父导图，再向下递归收集全部后代子导图，形成 Ctrl/Cmd+F 使用的“当前导图族”搜索范围。

```ts
export function collectIndexedFamilyPaths( files: Record<string,
```

### 类 `MindMapSearchIndex`

源码：`src/search/global-search.ts:365`

MindMapSearchIndex 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapSearchIndex
```

### 构造函数 `MindMapSearchIndex.constructor`

源码：`src/search/global-search.ts:380`

创建 MindMapSearchIndex 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( private readonly app: App, private readonly indexPath: string, private readonly extension = "mindmap" )
```

### 方法 `MindMapSearchIndex.initialize`

源码：`src/search/global-search.ts:389`

执行“initialize”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async initialize(): Promise<void>
```

### 方法 `MindMapSearchIndex.destroy`

源码：`src/search/global-search.ts:397`

执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
destroy(): void
```

### 方法 `MindMapSearchIndex.getStatus`

源码：`src/search/global-search.ts:408`

读取并返回status，并保持模型、界面和持久化状态的一致性。

```ts
getStatus(): MindMapSearchIndexStatus
```

### 方法 `MindMapSearchIndex.allEntries`

源码：`src/search/global-search.ts:420`

执行“all entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
allEntries(filePaths?: ReadonlySet<string>): MindMapSearchEntry[]
```

### 方法 `MindMapSearchIndex.getScopedStatus`

源码：`src/search/global-search.ts:433`

读取并返回scoped status，并保持模型、界面和持久化状态的一致性。

```ts
getScopedStatus(filePaths: ReadonlySet<string>):
```

### 方法 `MindMapSearchIndex.search`

源码：`src/search/global-search.ts:454`

执行“search”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
search(query: string, limit = 100, filePaths?: ReadonlySet<string>): MindMapSearchResult[]
```

### 方法 `MindMapSearchIndex.refreshFamily`

源码：`src/search/global-search.ts:464`

Refresh a parent map and every recursively linked child map, then return the exact set of files that belongs to that map family. This is deliberately on-demand so an existing child map is searchable without recreating it or manually rebuilding the whole-vault index.

```ts
async refreshFamily(rootPath: string, currentDocument?: MindMapDocument): Promise<Set<string>>
```

### 方法 `MindMapSearchIndex.queueFile`

源码：`src/search/global-search.ts:546`

执行“queue file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
queueFile(file: TFile, delay = 500): void
```

### 方法 `MindMapSearchIndex.removeFile`

源码：`src/search/global-search.ts:562`

删除file，并保持模型、界面和持久化状态的一致性。

```ts
removeFile(path: string): void
```

### 方法 `MindMapSearchIndex.renameFile`

源码：`src/search/global-search.ts:576`

执行“rename file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
renameFile(file: TFile, oldPath: string): void
```

### 方法 `MindMapSearchIndex.rebuildAll`

源码：`src/search/global-search.ts:584`

重建all，并保持模型、界面和持久化状态的一致性。

```ts
async rebuildAll(): Promise<void>
```

### 方法 `MindMapSearchIndex.rebuildChangedFiles`

源码：`src/search/global-search.ts:593`

重建changed files，并保持模型、界面和持久化状态的一致性。

```ts
private async rebuildChangedFiles(): Promise<void>
```

### 方法 `MindMapSearchIndex.performRebuild`

源码：`src/search/global-search.ts:605`

执行全量或增量索引重建。它比较文件修改时间，仅解析变化的 .mindmap 文件，删除失效记录，随后重新解析跨文件层级并安排持久化。

```ts
private async performRebuild(force: boolean): Promise<void>
```

### 方法 `MindMapSearchIndex.indexFile`

源码：`src/search/global-search.ts:632`

读取并解析单个 .mindmap 文件，生成节点级搜索条目和子导图引用。读取或解析失败时移除该文件的旧索引，防止返回过期结果。

```ts
private async indexFile(file: TFile): Promise<void>
```

### 方法 `MindMapSearchIndex.walkNodes`

源码：`src/search/global-search.ts:657`

递归遍历nodes，并保持模型、界面和持久化状态的一致性。

```ts
private *walkNodes(root: MindMapNode): Generator<MindMapNode>
```

### 方法 `MindMapSearchIndex.resolveSubmapFile`

源码：`src/search/global-search.ts:674`

解析并确定submap file，并保持模型、界面和持久化状态的一致性。

```ts
private resolveSubmapFile(rawPath: string | undefined, sourcePath: string): TFile | null
```

### 方法 `MindMapSearchIndex.load`

源码：`src/search/global-search.ts:688`

加载相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private async load(): Promise<void>
```

### 方法 `MindMapSearchIndex.scheduleSave`

源码：`src/search/global-search.ts:716`

安排延迟执行save，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleSave(): void
```

### 方法 `MindMapSearchIndex.saveNow`

源码：`src/search/global-search.ts:727`

保存now，并保持模型、界面和持久化状态的一致性。

```ts
private async saveNow(): Promise<void>
```

### 函数 `appendHighlightedText`

源码：`src/search/global-search.ts:743`

执行“append highlighted text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function appendHighlightedText(container: HTMLElement, text: string, query: string): void
```

### 类 `GlobalMindMapSearchModal`

源码：`src/search/global-search.ts:764`

GlobalMindMapSearchModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class GlobalMindMapSearchModal extends Modal
```

### 构造函数 `GlobalMindMapSearchModal.constructor`

源码：`src/search/global-search.ts:783`

创建 GlobalMindMapSearchModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, private readonly index: MindMapSearchIndex, private readonly maxResults: number, private readonly onOpenResult: (result: MindMapSearchResult) => void | Promise<void>, private readonly onRebuild: () => Promise<void>, private readonly s…
```

### 方法 `GlobalMindMapSearchModal.onOpen`

源码：`src/search/global-search.ts:799`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `GlobalMindMapSearchModal.onClose`

源码：`src/search/global-search.ts:848`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 方法 `GlobalMindMapSearchModal.renderResults`

源码：`src/search/global-search.ts:857`

渲染results，并保持模型、界面和持久化状态的一致性。

```ts
private renderResults(query: string): void
```

### 方法 `GlobalMindMapSearchModal.moveActive`

源码：`src/search/global-search.ts:908`

执行“move active”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private moveActive(delta: number): void
```

### 方法 `GlobalMindMapSearchModal.setActive`

源码：`src/search/global-search.ts:919`

更新并应用active，并保持模型、界面和持久化状态的一致性。

```ts
private setActive(index: number): void
```

### 方法 `GlobalMindMapSearchModal.openResult`

源码：`src/search/global-search.ts:931`

打开result，并保持模型、界面和持久化状态的一致性。

```ts
private async openResult(result: MindMapSearchResult): Promise<void>
```

## `src/settings.ts`

插件设置模型和设置页。

### 类型 `ImageHostBodyMode`

源码：`src/settings.ts:40`

ImageHostBodyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ImageHostBodyMode = "multipart" | "raw";
```

### 类型 `ImageHostMethod`

源码：`src/settings.ts:44`

ImageHostMethod 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ImageHostMethod = "POST" | "PUT";
```

### 接口 `ImageHostConfig`

源码：`src/settings.ts:49`

ImageHostConfig 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostConfig
```

### 接口 `ImageHostChoice`

源码：`src/settings.ts:64`

ImageHostChoice 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostChoice
```

### 接口 `ImageHostUploadSuccess`

源码：`src/settings.ts:72`

ImageHostUploadSuccess 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadSuccess
```

### 接口 `ImageHostUploadFailure`

源码：`src/settings.ts:81`

ImageHostUploadFailure 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadFailure
```

### 接口 `ImageHostUploadBatch`

源码：`src/settings.ts:90`

ImageHostUploadBatch 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadBatch
```

### 函数 `createImageHostConfig`

源码：`src/settings.ts:101`

创建image host config，并保持模型、界面和持久化状态的一致性。

```ts
export function createImageHostConfig(index = 1): ImageHostConfig
```

### 接口 `MindMapStudioSettings`

源码：`src/settings.ts:118`

MindMapStudioSettings 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapStudioSettings
```

### 函数 `settingsToAppearance`

源码：`src/settings.ts:253`

更新并应用tings to appearance，并保持模型、界面和持久化状态的一致性。

```ts
export function settingsToAppearance(settings: MindMapStudioSettings): MindMapAppearance
```

### 函数 `applyThemePresetToSettings`

源码：`src/settings.ts:291`

应用theme preset to settings，并保持模型、界面和持久化状态的一致性。

```ts
export function applyThemePresetToSettings(settings: MindMapStudioSettings, presetId: MindMapThemePresetId): void
```

### 类 `MindMapStudioSettingTab`

源码：`src/settings.ts:322`

MindMapStudioSettingTab 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapStudioSettingTab extends PluginSettingTab
```

### 构造函数 `MindMapStudioSettingTab.constructor`

源码：`src/settings.ts:331`

创建 MindMapStudioSettingTab 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, plugin: MindMapStudioPlugin)
```

### 方法 `MindMapStudioSettingTab.display`

源码：`src/settings.ts:340`

构建完整插件设置页，包括主题、显示模式、节点默认值、搜索、图片、图床容灾和恢复初始设置。所有控件写入后立即保存并刷新打开视图。

```ts
display(): void
```

### 方法 `MindMapStudioSettingTab.addOptionalColorSetting`

源码：`src/settings.ts:1224`

添加optional color setting，并保持模型、界面和持久化状态的一致性。

```ts
private addOptionalColorSetting( container: HTMLElement, name: string, description: string, getValue: () => string, setValue: (value: string) => Promise<void>, fallback: string, allowReset = true ): void
```

### 方法 `MindMapStudioSettingTab.saveAndRefresh`

源码：`src/settings.ts:1256`

保存and refresh，并保持模型、界面和持久化状态的一致性。

```ts
private async saveAndRefresh(): Promise<void>
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

源码：`src/themes.ts:429`

读取并返回mind map theme preset，并保持模型、界面和持久化状态的一致性。

```ts
export function getMindMapThemePreset(id: MindMapThemePresetId | undefined): MindMapThemePreset | undefined
```

### 函数 `appearanceFromThemePreset`

源码：`src/themes.ts:439`

执行“appearance from theme preset”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function appearanceFromThemePreset(id: MindMapThemePresetId): MindMapAppearance
```

## `src/view.ts`

Obsidian TextFileView 适配层。

### 类 `MindMapStudioView`

源码：`src/view.ts:21`

MindMapStudioView 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapStudioView extends TextFileView
```

### 构造函数 `MindMapStudioView.constructor`

源码：`src/view.ts:41`

创建 MindMapStudioView 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(leaf: WorkspaceLeaf, plugin: MindMapStudioPlugin)
```

### 方法 `MindMapStudioView.getViewType`

源码：`src/view.ts:50`

读取并返回view type，并保持模型、界面和持久化状态的一致性。

```ts
getViewType(): string
```

### 方法 `MindMapStudioView.getDisplayText`

源码：`src/view.ts:58`

读取并返回display text，并保持模型、界面和持久化状态的一致性。

```ts
getDisplayText(): string
```

### 方法 `MindMapStudioView.getIcon`

源码：`src/view.ts:66`

读取并返回icon，并保持模型、界面和持久化状态的一致性。

```ts
getIcon(): string
```

### 方法 `MindMapStudioView.getViewData`

源码：`src/view.ts:75`

返回当前编辑器文档的序列化文本，供 Obsidian 自动保存。保存使用模型层统一序列化，确保兼容字段和版本号正确。

```ts
getViewData(): string
```

### 方法 `MindMapStudioView.setViewData`

源码：`src/view.ts:87`

接收 Obsidian 读取的文件文本，解析成领域文档并交给编辑器。重新加载时会保留全局显示模式，并异步刷新文章父子上下文。

```ts
setViewData(data: string, clear: boolean): void
```

### 方法 `MindMapStudioView.clear`

源码：`src/view.ts:165`

执行“clear”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
clear(): void
```

### 方法 `MindMapStudioView.showArticleDirectory`

源码：`src/view.ts:175`

Displays and persists the generated directory for the top-level article.

```ts
showArticleDirectory(): void
```

### 方法 `MindMapStudioView.save`

源码：`src/view.ts:184`

保存相关数据，并保持模型、界面和持久化状态的一致性。

```ts
async save(clear?: boolean): Promise<void>
```

### 方法 `MindMapStudioView.onClose`

源码：`src/view.ts:192`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
async onClose(): Promise<void>
```

### 方法 `MindMapStudioView.openMapFamilySearch`

源码：`src/view.ts:204`

打开map family search，并保持模型、界面和持久化状态的一致性。

```ts
private async openMapFamilySearch(): Promise<void>
```

### 方法 `MindMapStudioView.refreshAppearance`

源码：`src/view.ts:217`

刷新appearance，并保持模型、界面和持久化状态的一致性。

```ts
refreshAppearance(): void
```

### 方法 `MindMapStudioView.focusNode`

源码：`src/view.ts:227`

定位node，并保持模型、界面和持久化状态的一致性。

```ts
focusNode(nodeId: string): void
```

### 方法 `MindMapStudioView.setDisplayMode`

源码：`src/view.ts:240`

更新并应用display mode，并保持模型、界面和持久化状态的一致性。

```ts
setDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapStudioView.applyGlobalDisplayMode`

源码：`src/view.ts:249`

应用global display mode，并保持模型、界面和持久化状态的一致性。

```ts
applyGlobalDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapStudioView.toggleReadOnly`

源码：`src/view.ts:256`

切换read only，并保持模型、界面和持久化状态的一致性。

```ts
toggleReadOnly(): void
```

### 方法 `MindMapStudioView.getEditorOptions`

源码：`src/view.ts:263`

读取并返回editor options，并保持模型、界面和持久化状态的一致性。

```ts
private getEditorOptions()
```

### 方法 `MindMapStudioView.scheduleArticleContextRefresh`

源码：`src/view.ts:300`

安排延迟执行article context refresh，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleArticleContextRefresh(delay: number): void
```

### 方法 `MindMapStudioView.refreshArticleContext`

源码：`src/view.ts:311`

刷新article context，并保持模型、界面和持久化状态的一致性。

```ts
private async refreshArticleContext(): Promise<void>
```

### 方法 `MindMapStudioView.applyViewClasses`

源码：`src/view.ts:333`

应用view classes，并保持模型、界面和持久化状态的一致性。

```ts
private applyViewClasses(): void
```

### 方法 `MindMapStudioView.scheduleSavedIndicator`

源码：`src/view.ts:342`

安排延迟执行saved indicator，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleSavedIndicator(): void
```

### 方法 `MindMapStudioView.openLink`

源码：`src/view.ts:352`

打开link，并保持模型、界面和持久化状态的一致性。

```ts
private async openLink(rawLink: string): Promise<void>
```

### 方法 `MindMapStudioView.resolveImage`

源码：`src/view.ts:369`

解析并确定image，并保持模型、界面和持久化状态的一致性。

```ts
private resolveImage(rawSource: string): string | null
```

### 方法 `MindMapStudioView.exportTextFile`

源码：`src/view.ts:386`

执行“export text file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async exportTextFile(extension: "svg" | "md" | "json" | "html" | "doc", content: string): Promise<void>
```

### 方法 `MindMapStudioView.exportArticleFamily`

源码：`src/view.ts:402`

Exports the current map family as one continuous document. A top-level directory uses its already collected reading sections; a child page starts at the current map and recursively includes descendants only.

```ts
private async exportArticleFamily(format: "html" | "doc" | "pdf" | "md"): Promise<void>
```

### 方法 `MindMapStudioView.printHtmlToPdf`

源码：`src/view.ts:425`

Opens standalone HTML in a print window so the user can save it as PDF.

```ts
private printHtmlToPdf(html: string): void
```

