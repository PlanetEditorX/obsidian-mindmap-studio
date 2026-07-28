# 函数与类参考

> 本文档由 `npm run docs:generate` 根据 TypeScript 源码自动生成。源码中的 JSDoc 是说明的权威来源；修改函数签名或职责后，应同步更新注释并重新生成本文档。

## `src/ai/client.ts`

OpenAI Chat Completions 兼容 AI 请求客户端。

### 接口 `AiCompletionResult`

源码：`src/ai/client.ts:22`

AI 请求完成后返回给界面的统一结果。

```ts
export interface AiCompletionResult
```

### 接口 `AiConnectionTestResult`

源码：`src/ai/client.ts:33`

AI 接口连通性检测结果。

```ts
export interface AiConnectionTestResult
```

### 函数 `requestAiCompletion`

源码：`src/ai/client.ts:73`

发送 OpenAI Chat Completions 兼容请求。

```ts
export async function requestAiCompletion( profile: AiProfileConfig, payload: AiMarkdownPayload, question: string ): Promise<AiCompletionResult>
```

### 函数 `requestAiEditProposal`

源码：`src/ai/client.ts:96`

请求 AI 返回可解析的 Markdown 修改提案；不会直接修改导图。

```ts
export async function requestAiEditProposal( profile: AiProfileConfig, payload: AiMarkdownPayload, instruction: string ): Promise<AiCompletionResult>
```

### 函数 `imageBlobToDataUrl`

源码：`src/ai/client.ts:119`

把图片 Blob 转为 Chat Completions 可直接发送的 data URL。

```ts
export async function imageBlobToDataUrl(blob: Blob): Promise<string>
```

### 函数 `requestAiImageRecognition`

源码：`src/ai/client.ts:131`

使用支持视觉输入的 OpenAI 兼容模型识别单张图片。

```ts
export async function requestAiImageRecognition( profile: AiProfileConfig, image: Blob | string, prompt: string ): Promise<AiCompletionResult>
```

### 函数 `testAiProfileConnection`

源码：`src/ai/client.ts:169`

使用最小提示词检测接口、鉴权和模型是否可用。 检测请求不会包含当前导图或节点正文。

```ts
export async function testAiProfileConnection(profile: AiProfileConfig): Promise<AiConnectionTestResult>
```

## `src/ai/config.ts`

AI 接口配置模型、预设和持久化数据规范化。

### 类型 `AiProviderKind`

源码：`src/ai/config.ts:7`

参见源码中的实现和调用位置。

```ts
export type AiProviderKind = "openai" | "deepseek" | "siliconflow" | "freellmapi" | "custom";
```

### 接口 `AiProfileConfig`

源码：`src/ai/config.ts:10`

单个可持久化 AI 接口配置。

```ts
export interface AiProfileConfig
```

### 接口 `AiProfilePreset`

源码：`src/ai/config.ts:25`

用于快速填充服务地址、模型和系统提示词的内置预设。

```ts
export interface AiProfilePreset
```

### 函数 `createAiProfileConfig`

源码：`src/ai/config.ts:136`

创建一个可编辑的 AI 接口配置。

```ts
export function createAiProfileConfig(provider: AiProviderKind, index = 1): AiProfileConfig
```

### 函数 `normalizeAiProfileConfig`

源码：`src/ai/config.ts:154`

规范化持久化的 AI 配置，防止异常值进入请求层。

```ts
export function normalizeAiProfileConfig(value: unknown, index = 1): AiProfileConfig | null
```

### 函数 `enabledAiProfiles`

源码：`src/ai/config.ts:176`

返回当前可用于请求的配置。

```ts
export function enabledAiProfiles(profiles: AiProfileConfig[]): AiProfileConfig[]
```

## `src/ai/edit.ts`

AI 结构化编辑预览、Markdown 应用和不联网的本地文字替换。

### 类型 `AiInteractionMode`

源码：`src/ai/edit.ts:23`

AI 窗口支持的问答、编辑、批量识图和本地替换模式。

```ts
export type AiInteractionMode = "ask" | "edit" | "vision" | "replace";
```

### 接口 `AiPromptDraftState`

源码：`src/ai/edit.ts:29`

分别保存询问和结构化编辑模式的输入草稿。

```ts
export interface AiPromptDraftState
```

### 函数 `createAiPromptDraftState`

源码：`src/ai/edit.ts:37`

创建 AI 弹窗的模式独立输入草稿。

```ts
export function createAiPromptDraftState( defaultQuestion: string, defaultVisionPrompt = "识别图片中的全部可见文字，并按阅读顺序转写；没有文字时简洁描述图片内容。" ): AiPromptDraftState
```

### 函数 `switchAiPromptDraft`

源码：`src/ai/edit.ts:50`

保存离开模式的输入并返回目标模式应显示的草稿。

```ts
export function switchAiPromptDraft( state: AiPromptDraftState, currentValue: string, nextMode: AiInteractionMode ):
```

### 接口 `AiEditPreview`

源码：`src/ai/edit.ts:73`

AI 返回 Markdown 后生成的可确认结构化修改预览。

```ts
export interface AiEditPreview
```

### 接口 `LocalReplacePreview`

源码：`src/ai/edit.ts:86`

本地文字替换的范围、命中数量和并发校验数据。

```ts
export interface LocalReplacePreview
```

### 接口 `AppliedAiEdit`

源码：`src/ai/edit.ts:99`

外部编辑成功应用后返回的文档和建议聚焦节点。

```ts
export interface AppliedAiEdit
```

### 函数 `aiEditScopeSnapshot`

源码：`src/ai/edit.ts:106`

返回当前页面或节点子树的稳定快照，用于阻止把过期预览应用到已变化内容。

```ts
export function aiEditScopeSnapshot(document: MindMapDocument, scopeNodeId?: string | null): string
```

### 函数 `buildAiEditUserMessage`

源码：`src/ai/edit.ts:113`

构建 AI 结构化编辑消息，要求模型只返回可解析 Markdown，不直接执行任何修改。

```ts
export function buildAiEditUserMessage(instruction: string, payload: AiMarkdownPayload): string
```

### 函数 `extractAiEditMarkdown`

源码：`src/ai/edit.ts:131`

从模型回答中提取 Markdown；优先使用 markdown/md 围栏，未使用围栏时保留完整回答。

```ts
export function extractAiEditMarkdown(responseText: string): string
```

### 函数 `refreshGeneratedNodeIds`

源码：`src/ai/edit.ts:138`

为 AI 生成的节点重新分配 ID，同时保留被替换范围根节点的稳定 ID。

```ts
function refreshGeneratedNodeIds(root: MindMapNode, stableRootId: string): void
```

### 函数 `preserveOperationalMetadata`

源码：`src/ai/edit.ts:149`

保留 Markdown 无法可靠表达的节点运行元数据，避免 AI 整理意外断开子导图和样式。

```ts
function preserveOperationalMetadata(existing: MindMapNode, generated: MindMapNode): void
```

### 函数 `previewAiMarkdownEdit`

源码：`src/ai/edit.ts:158`

解析并验证 AI 编辑结果，返回节点数量和字节大小预览，不直接修改导图。

```ts
export function previewAiMarkdownEdit( document: MindMapDocument, scopeNodeId: string | null | undefined, responseText: string ): AiEditPreview
```

### 函数 `applyAiMarkdownEdit`

源码：`src/ai/edit.ts:186`

将已经确认且仍未过期的 AI Markdown 预览应用到页面或节点子树。

```ts
export function applyAiMarkdownEdit(document: MindMapDocument, preview: AiEditPreview): AppliedAiEdit
```

### 函数 `replaceLiteral`

源码：`src/ai/edit.ts:216`

对字符串执行字面量替换并返回实际命中次数。

```ts
function replaceLiteral(value: string, query: string, replacement: string, caseSensitive: boolean):
```

### 函数 `replaceTextInScope`

源码：`src/ai/edit.ts:228`

在指定节点范围内执行本地文字替换；不修改链接、代码、图片地址或子导图路径。

```ts
function replaceTextInScope( document: MindMapDocument, scopeNodeId: string | null, query: string, replacement: string, caseSensitive: boolean ): AppliedAiEdit &
```

### 函数 `previewLocalTextReplace`

源码：`src/ai/edit.ts:293`

预览不联网的字面量替换，返回命中数和受影响节点数。

```ts
export function previewLocalTextReplace( document: MindMapDocument, scopeNodeId: string | null | undefined, query: string, replacement: string, caseSensitive = false ): LocalReplacePreview
```

### 函数 `applyLocalTextReplace`

源码：`src/ai/edit.ts:319`

应用已经确认且未过期的本地文字替换预览。

```ts
export function applyLocalTextReplace(document: MindMapDocument, preview: LocalReplacePreview): AppliedAiEdit
```

## `src/ai/markdown.ts`

将完整导图或指定节点子树转换为发送给 AI 的 Markdown，并计算 UTF-8 大小。

### 类型 `AiScopeKind`

源码：`src/ai/markdown.ts:9`

AI 上下文的语义范围。

```ts
export type AiScopeKind = "page" | "subtree";
```

### 接口 `AiMarkdownPayload`

源码：`src/ai/markdown.ts:12`

转换后等待发送的 Markdown 上下文及大小元数据。

```ts
export interface AiMarkdownPayload
```

### 函数 `utf8ByteLength`

源码：`src/ai/markdown.ts:26`

计算字符串的 UTF-8 字节数。

```ts
export function utf8ByteLength(value: string): number
```

### 函数 `formatByteSize`

源码：`src/ai/markdown.ts:31`

将字节数格式化为设置页和询问窗口使用的短文本。

```ts
export function formatByteSize(bytes: number): string
```

### 函数 `subtreeDocument`

源码：`src/ai/markdown.ts:38`

用指定节点构造只包含该分支的临时导图文档。

```ts
function subtreeDocument(document: MindMapDocument, root: MindMapNode): MindMapDocument
```

### 函数 `buildAiMarkdownPayload`

源码：`src/ai/markdown.ts:51`

构建 AI 上下文。nodeId 为空时使用当前页面；存在时仅包含该节点及其全部后代。 目标节点已被删除时安全回退到当前页面。

```ts
export function buildAiMarkdownPayload( document: MindMapDocument, nodeId: string | null | undefined, filePath: string, maxInputBytes: number ): AiMarkdownPayload
```

### 函数 `buildAiUserMessage`

源码：`src/ai/markdown.ts:78`

构建发送给模型的用户消息，明确问题与 Markdown 数据边界。

```ts
export function buildAiUserMessage(question: string, payload: AiMarkdownPayload): string
```

## `src/ai/modal.ts`

AI 问答、结构化导图编辑、批量图片识别、本地替换和请求处理轨迹窗口。

### 接口 `AiAskModalOptions`

源码：`src/ai/modal.ts:25`

创建 AI 窗口所需的上下文、接口和安全应用回调。

```ts
export interface AiAskModalOptions
```

### 类型 `TraceState`

源码：`src/ai/modal.ts:48`

单个处理轨迹步骤的视觉状态。

```ts
type TraceState = "pending" | "active" | "done" | "error";
```

### 类 `AiAskModal`

源码：`src/ai/modal.ts:51`

显示 AI 问答、修改提案、批量识图确认和不联网文字替换。

```ts
export class AiAskModal extends Modal
```

### 构造函数 `AiAskModal.constructor`

源码：`src/ai/modal.ts:59`

保存窗口上下文并初始化 Obsidian Modal。

```ts
constructor(app: App, private readonly options: AiAskModalOptions)
```

### 方法 `AiAskModal.onOpen`

源码：`src/ai/modal.ts:64`

构建模式选择、大小提示、处理轨迹、修改预览和确认应用区域。

```ts
onOpen(): void
```

### 方法 `AiAskModal.onClose`

源码：`src/ai/modal.ts:469`

释放 Markdown 渲染器注册的子组件和事件，避免窗口关闭后继续更新 DOM。

```ts
onClose(): void
```

## `src/ai/protocol.ts`

OpenAI Chat Completions 兼容协议的纯函数构造与解析。

### 接口 `AiTextContentPart`

源码：`src/ai/protocol.ts:11`

Chat Completions 多模态消息中的文字部分。

```ts
export interface AiTextContentPart
```

### 接口 `AiImageContentPart`

源码：`src/ai/protocol.ts:17`

Chat Completions 多模态消息中的图片地址部分。

```ts
export interface AiImageContentPart
```

### 类型 `AiMessageContent`

源码：`src/ai/protocol.ts:23`

OpenAI Chat Completions 兼容消息内容。

```ts
export type AiMessageContent = string | Array<AiTextContentPart | AiImageContentPart>;
```

### 接口 `AiChatCompletionBody`

源码：`src/ai/protocol.ts:26`

OpenAI Chat Completions 兼容请求体的最小结构。

```ts
export interface AiChatCompletionBody
```

### 函数 `resolveAiChatCompletionsEndpoint`

源码：`src/ai/protocol.ts:40`

将 OpenAI 兼容服务的基础地址或完整地址统一为 Chat Completions 端点。 例如 `https://api.example.com/v1` 会转换为 `https://api.example.com/v1/chat/completions`；已经填写完整路径时保持不变。

```ts
export function resolveAiChatCompletionsEndpoint(endpoint: string): string
```

### 函数 `parseAiHeaders`

源码：`src/ai/protocol.ts:49`

解析自定义请求头，并拒绝嵌套值、非法名称和 CRLF 注入。

```ts
export function parseAiHeaders(source: string): Record<string, string>
```

### 函数 `buildChatCompletionBody`

源码：`src/ai/protocol.ts:68`

构建 OpenAI Chat Completions 兼容请求体。

```ts
export function buildChatCompletionBody( profile: AiProfileConfig, payload: AiMarkdownPayload, question: string ): AiChatCompletionBody
```

### 函数 `buildAiEditCompletionBody`

源码：`src/ai/protocol.ts:87`

构建只返回 Markdown 修改提案的 OpenAI Chat Completions 请求体。

```ts
export function buildAiEditCompletionBody( profile: AiProfileConfig, payload: AiMarkdownPayload, instruction: string ): AiChatCompletionBody
```

### 函数 `buildImageRecognitionCompletionBody`

源码：`src/ai/protocol.ts:110`

构建单张图片的 OpenAI 兼容多模态识图请求。

```ts
export function buildImageRecognitionCompletionBody( profile: AiProfileConfig, prompt: string, imageDataUrl: string ): AiChatCompletionBody
```

### 函数 `buildAiConnectionTestBody`

源码：`src/ai/protocol.ts:135`

构建不包含导图正文的最小连通性检测请求。

```ts
export function buildAiConnectionTestBody(profile: AiProfileConfig): AiChatCompletionBody
```

### 函数 `extractAiResponseText`

源码：`src/ai/protocol.ts:146`

从 Chat Completions 及常见兼容响应中提取最终文本。

```ts
export function extractAiResponseText(payload: unknown): string
```

## `src/article/article-style.ts`

文章领域的样式预设与解析。

### 函数 `resolveArticleStyle`

源码：`src/article/article-style.ts:21`

解析文章样式预设，并叠加当前文档的自定义值。

```ts
export function resolveArticleStyle(style: ArticleStyle | undefined): ArticleStyle
```

## `src/article/display-mode.ts`

显示模式的启动恢复与持久化规则。

### 函数 `normalizeDisplayModes`

源码：`src/article/display-mode.ts:11`

去重并过滤设置中未知的显示模式，空列表恢复为导图模式。

```ts
export function normalizeDisplayModes(value: readonly unknown[]): DisplayMode[]
```

### 函数 `resolveStartupDisplayMode`

源码：`src/article/display-mode.ts:21`

解析插件启动时允许恢复的显示模式。大纲只属于当前会话； 重新加载插件时优先回到导图，其次选择可见的文章或通读模式。

```ts
export function resolveStartupDisplayMode(preferred: unknown, visibleModes: readonly unknown[]): DisplayMode
```

### 函数 `shouldPersistDisplayMode`

源码：`src/article/display-mode.ts:31`

大纲模式不写入下次启动设置，其他模式保持用户最后选择。

```ts
export function shouldPersistDisplayMode(mode: DisplayMode): boolean
```

## `src/article/modes.ts`

文章领域与显示模式共享的编号工具。

### 接口 `ReadingSection`

源码：`src/article/modes.ts:28`

One physical map merged into the continuous reading view.

```ts
export interface ReadingSection
```

### 函数 `readingAnchorPart`

源码：`src/article/modes.ts:43`

Encodes a file path or node id into a collision-free DOM anchor component. Percent markers remain visible as underscores, so different Chinese paths cannot collapse to the same replacement string.

```ts
export function readingAnchorPart(value: string): string
```

### 函数 `chineseNumber`

源码：`src/article/modes.ts:55`

执行“chinese number”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function chineseNumber(value: number): string
```

### 函数 `articleNumberLabel`

源码：`src/article/modes.ts:75`

将文章标题层级和同级序号转换为“第一章、第一节、一、（一）、1.、（1）”等常见中文文章编号，更深层级使用可读的循环规则。

```ts
export function articleNumberLabel(depth: number, index: number): string
```

### 函数 `articleDisplayTitle`

源码：`src/article/modes.ts:94`

按编号末尾标点决定标题是否需要空格，使“第一章 标题”与“一、标题”“1.标题”等格式同时保持自然。

```ts
export function articleDisplayTitle(label: string, title: string): string
```

### 函数 `isArticleHeading`

源码：`src/article/modes.ts:104`

A node is an article heading when it owns local descendants or represents a linked child map. A sub-map node is therefore still a chapter/section even when its children live in another .mindmap file.

```ts
export function isArticleHeading(node: MindMapNode): boolean
```

### 接口 `ArticleNumberingResolution`

源码：`src/article/modes.ts:109`

文章节点在自动、关闭或手动最高层级规则下的解析结果。

```ts
export interface ArticleNumberingResolution
```

### 函数 `resolveArticleNumbering`

源码：`src/article/modes.ts:126`

解析单个节点的文章编号状态。手动模式只覆盖当前节点所在子树的最高文章层级， 不再强制末端节点标题化；同级中只要存在自然标题，普通末端节点也会按同级标题编号， 从而避免首个“词义”等节点丢失序号。

```ts
export function resolveArticleNumbering(node: MindMapNode, defaultLevel: number, siblingHasHeading: boolean): ArticleNumberingResolution
```

### 函数 `articleChildStartLevel`

源码：`src/article/modes.ts:148`

计算一个物理导图根节点的首级子节点应使用的文章层级。根节点的手动层级表示 当前脑图正文的最高可见层级，文档标题本身不编号，一级子节点直接使用所选层级。

```ts
export function articleChildStartLevel(root: MindMapNode, baseDepth = 0): number
```

### 接口 `ArticleNodeInfo`

源码：`src/article/modes.ts:158`

ArticleNodeInfo 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ArticleNodeInfo
```

### 接口 `ArticleTocEntry`

源码：`src/article/modes.ts:172`

ArticleTocEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ArticleTocEntry
```

### 函数 `articleTocDepth`

源码：`src/article/modes.ts:191`

返回目录项的相对结构层级。

```ts
export function articleTocDepth(entry: ArticleTocEntry): number
```

### 函数 `resolveArticleTocMaxDepth`

源码：`src/article/modes.ts:203`

解析文章和通读目录使用的最大相对结构层级。当前脑图存在覆盖值时优先使用， 否则跟随插件全局设置；两者都异常时回退到 3 层。

```ts
export function resolveArticleTocMaxDepth(documentOverride: number | undefined, pluginDefault: number): number
```

### 接口 `ArticlePageNavigation`

源码：`src/article/modes.ts:209`

Navigation state shared by every physical article page in one map family.

```ts
export interface ArticlePageNavigation
```

### 接口 `ArticleSiblingPageResolution`

源码：`src/article/modes.ts:219`

当前物理文章页及其同层兄弟页的解析结果。

```ts
export interface ArticleSiblingPageResolution
```

### 函数 `sameBreadcrumb`

源码：`src/article/modes.ts:226`

比较两个目录面包屑片段是否完全一致。

```ts
function sameBreadcrumb(left: string[], right: string[]): boolean
```

### 函数 `resolveArticleSiblingPages`

源码：`src/article/modes.ts:239`

从递归全书目录中提取当前物理文件对应的同层兄弟页面。目录中的普通节点仍用于目录展示， 但不会进入上一篇/下一篇分页；因此打开“第一章”后会直接切换到“第二章”，而不会进入 当前文件内部的“第一节、第二节”。嵌套页面按相同规则在其父级下寻找兄弟页。

```ts
export function resolveArticleSiblingPages(entries: ArticleTocEntry[], currentFilePath: string): ArticleSiblingPageResolution
```

### 函数 `currentArticlePageEntry`

源码：`src/article/modes.ts:264`

返回文章页顶部应显示的目录编号标题。只有子导图物理页面使用该标题；顶层总目录文件 继续使用自身中心节点标题，避免把第一章误显示为整本书标题。

```ts
export function currentArticlePageEntry(navigation: ArticlePageNavigation | undefined): ArticleTocEntry | undefined
```

### 函数 `buildArticleNodeInfo`

源码：`src/article/modes.ts:281`

Build the article representation for one physical .mindmap file. `baseDepth` is the absolute article depth represented by this file's root. A manually configured node replaces its inferred highest level and its descendants continue from that level. Heading/body classification remains structural: leaf peers of headings become same-level headings, while an isolated terminal node remains body text.

```ts
export function buildArticleNodeInfo(root: MindMapNode, baseDepth = 0): ArticleNodeInfo[]
```

### 函数 `normalizeVisibleModes`

源码：`src/article/modes.ts:317`

校验并规范化visible modes，并保持模型、界面和持久化状态的一致性。

```ts
export function normalizeVisibleModes(modes: unknown): DisplayMode[]
```

## `src/article/reading-location.ts`

跨导图、大纲、文章和通读模式共享的语义阅读位置。

### 接口 `ReadingLocationFallback`

源码：`src/article/reading-location.ts:36`

同一物理导图内，从精确节点向根节点回退的一条候选链。

```ts
export interface ReadingLocationFallback
```

### 接口 `ReadingLocation`

源码：`src/article/reading-location.ts:42`

可持久化的统一阅读位置。

```ts
export interface ReadingLocation
```

### 接口 `ReadingLocationSection`

源码：`src/article/reading-location.ts:53`

构建和解析阅读位置所需的最小文章族信息。

```ts
export interface ReadingLocationSection
```

### 接口 `ResolvedReadingLocation`

源码：`src/article/reading-location.ts:61`

已在当前文章族中验证存在的具体位置。

```ts
export interface ResolvedReadingLocation
```

### 函数 `viewportAnchorRatio`

源码：`src/article/reading-location.ts:80`

将节点内部锚点换算为它当前所在的视口比例。 点击文章或大纲节点时使用真实屏幕位置，而不是强制写成固定 35%。 这样后续设置刷新或模式恢复不会把当前页面再次拉动到另一个位置。

```ts
export function viewportAnchorRatio( nodeTop: number, nodeHeight: number, viewportTop: number, viewportHeight: number, nodeRatio = 0.5, fallback = 0.35 ): number
```

### 函数 `nodeFallbackIds`

源码：`src/article/reading-location.ts:103`

返回目标节点到根节点的回退顺序：目标、直接父级、祖父级……根节点。

```ts
export function nodeFallbackIds(document: MindMapDocument, nodeId: string): string[]
```

### 函数 `createReadingLocation`

源码：`src/article/reading-location.ts:112`

根据当前文章族构建持久化位置，同时记录跨子导图的父级回退链。

```ts
export function createReadingLocation( sections: readonly ReadingLocationSection[], filePath: string, nodeId: string, nodeRatio = 0, viewportRatio = 0.35 ): ReadingLocation
```

### 函数 `normalizeReadingLocation`

源码：`src/article/reading-location.ts:157`

规范化磁盘设置中的未知值，丢弃空路径、空节点链和异常比例。

```ts
export function normalizeReadingLocation(value: unknown): ReadingLocation | null
```

### 函数 `resolveReadingLocation`

源码：`src/article/reading-location.ts:188`

在最新文档树中解析持久化位置。节点或文件失效时按保存的层级链回退。

```ts
export function resolveReadingLocation( location: ReadingLocation | null | undefined, sections: readonly ReadingLocationSection[], preferredFilePath = "" ): ResolvedReadingLocation | null
```

### 函数 `sameReadingLocation`

源码：`src/article/reading-location.ts:225`

比较两个位置是否具有相同语义，避免滚动期间重复写入设置。

```ts
export function sameReadingLocation(left: ReadingLocation | null | undefined, right: ReadingLocation | null | undefined): boolean
```

### 函数 `renameReadingLocationPath`

源码：`src/article/reading-location.ts:232`

在导图文件重命名后替换主路径和每一级跨文件回退路径。

```ts
export function renameReadingLocationPath(location: ReadingLocation, oldPath: string, newPath: string): ReadingLocation
```

## `src/core/model.ts`

核心领域模型与序列化层。

### 类型 `LayoutMode`

源码：`src/core/model.ts:24`

LayoutMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type LayoutMode = "right" | "balanced";
```

### 类型 `DisplayMode`

源码：`src/core/model.ts:28`

DisplayMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type DisplayMode = "mindmap" | "outline" | "article" | "reading" | "question-bank";
```

### 类型 `ArticleLandingMode`

源码：`src/core/model.ts:30`

Top-level article landing content.

```ts
export type ArticleLandingMode = "toc" | "article";
```

### 类型 `ArticleNumberingMode`

源码：`src/core/model.ts:32`

Per-node article numbering override; undefined keeps automatic behavior.

```ts
export type ArticleNumberingMode = "none" | "manual";
```

### 类型 `ArticleStylePresetId`

源码：`src/core/model.ts:34`

Built-in article presentation presets.

```ts
export type ArticleStylePresetId = "classic" | "book" | "modern" | "minimal";
```

### 接口 `ArticleStyle`

源码：`src/core/model.ts:36`

Per-document article presentation overrides.

```ts
export interface ArticleStyle
```

### 类型 `ThemeMode`

源码：`src/core/model.ts:50`

ThemeMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ThemeMode = "auto" | "light" | "dark";
```

### 类型 `NodeShape`

源码：`src/core/model.ts:54`

NodeShape 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type NodeShape = "rounded" | "pill" | "rectangle";
```

### 类型 `NodeVisualStyle`

源码：`src/core/model.ts:56`

Overall sizing and density used when rendering mind-map nodes.

```ts
export type NodeVisualStyle = "card" | "branch";
```

### 类型 `NodeWidthMode`

源码：`src/core/model.ts:58`

Default width calculation used for nodes without a manual width.

```ts
export type NodeWidthMode = "fixed" | "auto";
```

### 类型 `TaskStatus`

源码：`src/core/model.ts:62`

TaskStatus 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type TaskStatus = "todo" | "doing" | "done";
```

### 类型 `BackgroundPattern`

源码：`src/core/model.ts:66`

BackgroundPattern 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type BackgroundPattern = "none" | "grid" | "dots";
```

### 类型 `EdgeStyle`

源码：`src/core/model.ts:70`

EdgeStyle 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type EdgeStyle = "curved" | "straight" | "elbow";
```

### 类型 `EdgeWidthMode`

源码：`src/core/model.ts:74`

EdgeWidthMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type EdgeWidthMode = "uniform" | "tapered";
```

### 类型 `MindMapThemePresetId`

源码：`src/core/model.ts:78`

MindMapThemePresetId 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type MindMapThemePresetId = | "classic-indigo" | "ocean-blue" | "forest-green" | "sunset-orange" | "lavender-dream" | "candy-pop" | "paper-note" | "minimal-ink" | "dark-neon" | "mint-clean" | "spectrum-flow" | "executive-navy" | "botanical-calm" | "m…
```

### 类型 `FontFamilyMode`

源码：`src/core/model.ts:98`

FontFamilyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type FontFamilyMode = "obsidian" | "sans" | "serif" | "mono" | "custom";
```

### 类型 `TableAlignment`

源码：`src/core/model.ts:102`

TableAlignment 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type TableAlignment = "left" | "center" | "right";
```

### 类型 `NodeTextAlign`

源码：`src/core/model.ts:106`

NodeTextAlign 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type NodeTextAlign = "left" | "center" | "right";
```

### 接口 `MindMapTextStyle`

源码：`src/core/model.ts:111`

MindMapTextStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextStyle
```

### 接口 `MindMapTextRun`

源码：`src/core/model.ts:122`

MindMapTextRun 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextRun
```

### 接口 `MindMapTable`

源码：`src/core/model.ts:130`

MindMapTable 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTable
```

### 接口 `MindMapCodeBlock`

源码：`src/core/model.ts:140`

MindMapCodeBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapCodeBlock
```

### 接口 `MindMapTextContentBlock`

源码：`src/core/model.ts:151`

MindMapTextContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextContentBlock
```

### 接口 `MindMapImageRemoteSource`

源码：`src/core/model.ts:161`

MindMapImageRemoteSource 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageRemoteSource
```

### 接口 `MindMapImageSourceCandidate`

源码：`src/core/model.ts:174`

MindMapImageSourceCandidate 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageSourceCandidate
```

### 接口 `MindMapImageContentBlock`

源码：`src/core/model.ts:185`

MindMapImageContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageContentBlock
```

### 接口 `MindMapTableContentBlock`

源码：`src/core/model.ts:201`

A movable table block stored alongside text and images.

```ts
export interface MindMapTableContentBlock
```

### 接口 `MindMapCodeContentBlock`

源码：`src/core/model.ts:208`

A movable code block stored alongside text, images, and tables.

```ts
export interface MindMapCodeContentBlock
```

### 类型 `MindMapContentBlock`

源码：`src/core/model.ts:217`

MindMapContentBlock 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type MindMapContentBlock = MindMapTextContentBlock | MindMapImageContentBlock | MindMapTableContentBlock | MindMapCodeContentBlock;
```

### 接口 `MindMapSubmap`

源码：`src/core/model.ts:222`

MindMapSubmap 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSubmap
```

### 接口 `MindMapNavigation`

源码：`src/core/model.ts:230`

MindMapNavigation 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNavigation
```

### 接口 `MindMapAppearance`

源码：`src/core/model.ts:240`

MindMapAppearance 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapAppearance
```

### 接口 `MindMapNodeStyle`

源码：`src/core/model.ts:278`

MindMapNodeStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNodeStyle
```

### 类型 `MindMapQuestionMode`

源码：`src/core/model.ts:294`

A structured question can be either a multiple-choice or long-form exercise.

```ts
export type MindMapQuestionMode = "choice" | "essay";
```

### 类型 `MindMapQuestionStatus`

源码：`src/core/model.ts:297`

Learning state used by question-bank filtering and review workflows.

```ts
export type MindMapQuestionStatus = "unanswered" | "completed" | "favorite" | "wrong" | "mastered";
```

### 接口 `MindMapQuestionOption`

源码：`src/core/model.ts:300`

A selectable answer item in a structured question.

```ts
export interface MindMapQuestionOption
```

### 接口 `MindMapQuestionSource`

源码：`src/core/model.ts:307`

Verifiable provenance for an original question found by an AI-assisted lookup.

```ts
export interface MindMapQuestionSource
```

### 接口 `MindMapQuestion`

源码：`src/core/model.ts:314`

Persisted question content attached to a mind-map node.

```ts
export interface MindMapQuestion
```

### 接口 `MindMapNode`

源码：`src/core/model.ts:331`

MindMapNode 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNode
```

### 接口 `MindMapDocumentView`

源码：`src/core/model.ts:360`

MindMapDocumentView 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapDocumentView
```

### 接口 `MindMapDocument`

源码：`src/core/model.ts:376`

MindMapDocument 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapDocument
```

### 接口 `TaskProgress`

源码：`src/core/model.ts:391`

TaskProgress 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface TaskProgress
```

### 函数 `newId`

源码：`src/core/model.ts:402`

执行“new id”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function newId(): string
```

### 函数 `createNode`

源码：`src/core/model.ts:413`

创建node，并保持模型、界面和持久化状态的一致性。

```ts
export function createNode(text = "新节点"): MindMapNode
```

### 函数 `createMindMapQuestion`

源码：`src/core/model.ts:418`

Creates an editable structured question with a text block for every field.

```ts
export function createMindMapQuestion(mode: MindMapQuestionMode = "choice"): MindMapQuestion
```

### 函数 `createDefaultDocument`

源码：`src/core/model.ts:442`

创建default document，并保持模型、界面和持久化状态的一致性。

```ts
export function createDefaultDocument(title = "新思维导图"): MindMapDocument
```

### 函数 `normalizeColor`

源码：`src/core/model.ts:465`

校验并规范化color，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeColor(value: unknown): string | undefined
```

### 函数 `normalizeNumber`

源码：`src/core/model.ts:479`

校验并规范化number，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNumber(value: unknown, min: number, max: number): number | undefined
```

### 函数 `normalizeBooleanOverride`

源码：`src/core/model.ts:490`

校验并规范化boolean override，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeBooleanOverride(value: unknown): boolean | undefined
```

### 函数 `normalizeAppearance`

源码：`src/core/model.ts:500`

校验并规范化appearance，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeAppearance(input: Partial<MindMapAppearance> | undefined): MindMapAppearance | undefined
```

### 函数 `mergeAppearance`

源码：`src/core/model.ts:575`

合并appearance，并保持模型、界面和持久化状态的一致性。

```ts
export function mergeAppearance(base: MindMapAppearance | undefined, override: MindMapAppearance | undefined): MindMapAppearance
```

### 函数 `normalizeStyle`

源码：`src/core/model.ts:585`

校验并规范化style，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeStyle(input: Partial<MindMapNodeStyle> | undefined): MindMapNodeStyle | undefined
```

### 函数 `normalizeTextStyle`

源码：`src/core/model.ts:613`

校验并规范化text style，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTextStyle(input: Partial<MindMapTextStyle> | undefined): MindMapTextStyle | undefined
```

### 函数 `textStyleKey`

源码：`src/core/model.ts:631`

执行“text style key”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function textStyleKey(style: MindMapTextStyle | undefined): string
```

### 函数 `normalizeRichText`

源码：`src/core/model.ts:642`

校验并规范化rich text，并保持模型、界面和持久化状态的一致性。

```ts
export function normalizeRichText(input: unknown, fallbackText = ""): MindMapTextRun[] | undefined
```

### 函数 `richTextPlainText`

源码：`src/core/model.ts:690`

执行“rich text plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextPlainText(runs: MindMapTextRun[] | undefined, fallbackText = ""): string
```

### 函数 `richTextCharacterStyles`

源码：`src/core/model.ts:701`

执行“rich text character styles”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextCharacterStyles(runs: MindMapTextRun[] | undefined, fallbackText = ""): MindMapTextStyle[]
```

### 函数 `characterStylesToRichText`

源码：`src/core/model.ts:722`

执行“character styles to rich text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function characterStylesToRichText(text: string, styles: MindMapTextStyle[]): MindMapTextRun[] | undefined
```

### 函数 `reconcileRichTextAfterEdit`

源码：`src/core/model.ts:747`

在纯文本被编辑后，尽可能保留原字符位置附近的富文本样式。它通过公共前缀和后缀映射样式，新增字符继承邻近样式，删除字符则自动丢弃对应区间。

```ts
export function reconcileRichTextAfterEdit( previousText: string, previousRuns: MindMapTextRun[] | undefined, nextText: string ): MindMapTextRun[] | undefined
```

### 函数 `applyRichTextStyleRange`

源码：`src/core/model.ts:783`

对字符半开区间应用或取消指定富文本样式，并重新合并连续、样式相同的文本段，避免产生大量碎片化运行段。

```ts
export function applyRichTextStyleRange( text: string, runs: MindMapTextRun[] | undefined, start: number, end: number, patch: Partial<MindMapTextStyle> | null ): MindMapTextRun[] | undefined
```

### 函数 `normalizeContentBlock`

源码：`src/core/model.ts:808`

校验并规范化content block，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeContentBlock(input: unknown): MindMapContentBlock | null
```

### 函数 `imageSourceCandidates`

源码：`src/core/model.ts:874`

为图片内容块构建有序、去重的加载候选列表。远程镜像按图床优先级排序，最后按设置选择本地地址，从而支持失效图床自动切换。

```ts
export function imageSourceCandidates(block: MindMapImageContentBlock, includeLocal = true, hostPriorityIds: readonly string[] = []): MindMapImageSourceCandidate[]
```

### 函数 `nodeContentBlocks`

源码：`src/core/model.ts:914`

执行“node content blocks”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodeContentBlocks(node: Pick<MindMapNode, "content" | "text" | "richText" | "image" | "table" | "code">): MindMapContentBlock[]
```

### 函数 `nodePlainText`

源码：`src/core/model.ts:940`

执行“node plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodePlainText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string
```

### 函数 `nodePrimaryText`

源码：`src/core/model.ts:951`

执行“node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodePrimaryText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string
```

### 函数 `syncNodeContentFields`

源码：`src/core/model.ts:962`

将有序内容块同步到节点的文本摘要、单段富文本和首张图片字段。

```ts
export function syncNodeContentFields(node: MindMapNode): void
```

### 函数 `normalizeCell`

源码：`src/core/model.ts:983`

校验并规范化cell，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeCell(value: unknown): string
```

### 函数 `normalizeTable`

源码：`src/core/model.ts:993`

校验并规范化table，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTable(input: Partial<MindMapTable> | undefined): MindMapTable | undefined
```

### 函数 `normalizeCode`

源码：`src/core/model.ts:1017`

校验并规范化code，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeCode(input: Partial<MindMapCodeBlock> | undefined): MindMapCodeBlock | undefined
```

### 函数 `normalizeSubmap`

源码：`src/core/model.ts:1040`

校验并规范化submap，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeSubmap(input: Partial<MindMapSubmap> | undefined): MindMapSubmap | undefined
```

### 函数 `normalizeNavigation`

源码：`src/core/model.ts:1054`

校验并规范化navigation，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNavigation(input: Partial<MindMapNavigation> | undefined): MindMapNavigation | undefined
```

### 函数 `normalizeTask`

源码：`src/core/model.ts:1070`

校验并规范化task，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTask(value: unknown): TaskStatus | undefined
```

### 函数 `normalizeTags`

源码：`src/core/model.ts:1080`

校验并规范化tags，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTags(value: unknown): string[] | undefined
```

### 函数 `normalizeMindMapQuestion`

源码：`src/core/model.ts:1091`

Normalizes an untrusted structured-question payload from persisted JSON.

```ts
function normalizeMindMapQuestion(value: unknown): MindMapQuestion | undefined
```

### 函数 `syncMindMapQuestionFields`

源码：`src/core/model.ts:1145`

Mirrors question stem and tags into standard node fields used by existing renderers and exports.

```ts
export function syncMindMapQuestionFields(node: MindMapNode): void
```

### 函数 `normalizeNode`

源码：`src/core/model.ts:1159`

校验并规范化node，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNode(input: Partial<MindMapNode> | undefined, fallbackText: string): MindMapNode
```

### 函数 `normalizeDocumentView`

源码：`src/core/model.ts:1216`

校验并规范化document view，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeDocumentView(input: Partial<MindMapDocumentView> | undefined): MindMapDocumentView | undefined
```

### 函数 `normalizeArticleStyle`

源码：`src/core/model.ts:1243`

Normalizes per-document article presentation settings.

```ts
function normalizeArticleStyle(input: Partial<ArticleStyle> | undefined): ArticleStyle | undefined
```

### 函数 `normalizeDocument`

源码：`src/core/model.ts:1273`

把不完整的输入对象转换为当前 MindMapDocument。该函数会递归规范化节点、外观和视图状态，并保证根节点、数组及必需标识始终存在。

```ts
export function normalizeDocument(input: Partial<MindMapDocument> | undefined, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `serializeDocument`

源码：`src/core/model.ts:1295`

在保存前再次规范化文档，并输出带缩进的稳定 JSON。

```ts
export function serializeDocument(doc: MindMapDocument): string
```

### 函数 `parseJsonDocument`

源码：`src/core/model.ts:1307`

解析json document，并保持模型、界面和持久化状态的一致性。

```ts
function parseJsonDocument(value: string, fallbackTitle: string): MindMapDocument | null
```

### 函数 `extractFencedJson`

源码：`src/core/model.ts:1322`

执行“extract fenced json”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function extractFencedJson(source: string, language: string): string | null
```

### 函数 `parseDocument`

源码：`src/core/model.ts:1336`

解析磁盘中的 .mindmap 文本。优先识别原始 JSON 和当前 mindmap-json 围栏；解析失败时按 Markdown 导入，避免视图崩溃。

```ts
export function parseDocument(source: string, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `cloneDocument`

源码：`src/core/model.ts:1358`

执行“clone document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function cloneDocument(doc: MindMapDocument): MindMapDocument
```

### 函数 `cloneNodeWithFreshIds`

源码：`src/core/model.ts:1368`

执行“clone node with fresh ids”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function cloneNodeWithFreshIds(node: MindMapNode): MindMapNode
```

### 函数 `extractFirstWikiLink`

源码：`src/core/model.ts:1382`

执行“extract first wiki link”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function extractFirstWikiLink(value: string): string | null
```

### 函数 `getTaskProgress`

源码：`src/core/model.ts:1393`

读取并返回task progress，并保持模型、界面和持久化状态的一致性。

```ts
export function getTaskProgress(root: MindMapNode): TaskProgress
```

### 函数 `nodeSearchText`

源码：`src/core/model.ts:1410`

执行“node search text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodeSearchText(node: MindMapNode): string
```

### 函数 `taskPrefix`

源码：`src/core/model.ts:1428`

执行“task prefix”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function taskPrefix(task: TaskStatus | undefined): string
```

### 函数 `escapeInlineMarkdown`

源码：`src/core/model.ts:1441`

转义inline markdown，并保持模型、界面和持久化状态的一致性。

```ts
function escapeInlineMarkdown(value: string): string
```

### 函数 `richTextToMarkdown`

源码：`src/core/model.ts:1452`

执行“rich text to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextToMarkdown(runs: MindMapTextRun[] | undefined, fallbackText: string): string
```

### 函数 `tableToMarkdown`

源码：`src/core/model.ts:1473`

执行“table to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function tableToMarkdown(table: MindMapTable): string
```

### 函数 `splitMarkdownTableRow`

源码：`src/core/model.ts:1491`

执行“split markdown table row”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function splitMarkdownTableRow(line: string): string[]
```

### 函数 `parseMarkdownTable`

源码：`src/core/model.ts:1512`

解析markdown table，并保持模型、界面和持久化状态的一致性。

```ts
export function parseMarkdownTable(markdown: string): MindMapTable | null
```

### 函数 `parseFencedCode`

源码：`src/core/model.ts:1546`

解析fenced code，并保持模型、界面和持久化状态的一致性。

```ts
export function parseFencedCode(markdown: string): MindMapCodeBlock | null
```

### 函数 `childrenToTable`

源码：`src/core/model.ts:1558`

执行“children to table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function childrenToTable(node: MindMapNode): MindMapTable | null
```

### 函数 `documentToMarkdown`

源码：`src/core/model.ts:1580`

执行“document to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function documentToMarkdown(doc: MindMapDocument): string
```

### 函数 `parseTaskText`

源码：`src/core/model.ts:1624`

解析task text，并保持模型、界面和持久化状态的一致性。

```ts
function parseTaskText(value: string):
```

### 函数 `markdownToDocument`

源码：`src/core/model.ts:1639`

执行“markdown to document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function markdownToDocument(markdown: string, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `indentedTextToMarkdown`

源码：`src/core/model.ts:1825`

Converts tab- or space-indented outline text (including XMind clipboard fallback text) into Markdown while preserving its hierarchy.

```ts
export function indentedTextToMarkdown(text: string): string
```

## `src/core/node-tree.ts`

思维导图节点树的遍历、查找、删除与相对移动操作。

### 类型 `NodeDropPosition`

源码：`src/core/node-tree.ts:9`

可用于节点拖放的目标位置。

```ts
export type NodeDropPosition = "before" | "child" | "after";
```

### 函数 `walkNodes`

源码：`src/core/node-tree.ts:12`

深度优先遍历节点树，并提供每个节点的父节点。

```ts
export function walkNodes(root: MindMapNode, visitor: (node: MindMapNode, parent: MindMapNode | null) => void): void
```

### 函数 `flattenNodes`

源码：`src/core/node-tree.ts:21`

按深度优先顺序展平节点树。

```ts
export function flattenNodes(root: MindMapNode): MindMapNode[]
```

### 函数 `findNode`

源码：`src/core/node-tree.ts:28`

按稳定标识查找节点。

```ts
export function findNode(root: MindMapNode, id: string): MindMapNode | null
```

### 函数 `findParent`

源码：`src/core/node-tree.ts:37`

查找指定节点的直接父节点。

```ts
export function findParent(root: MindMapNode, id: string): MindMapNode | null
```

### 函数 `findAncestors`

源码：`src/core/node-tree.ts:46`

返回从根节点到目标节点父级的祖先路径。

```ts
export function findAncestors(root: MindMapNode, id: string): MindMapNode[]
```

### 函数 `containsNode`

源码：`src/core/node-tree.ts:61`

判断节点树是否包含指定标识。

```ts
export function containsNode(root: MindMapNode, id: string): boolean
```

### 函数 `removeNode`

源码：`src/core/node-tree.ts:66`

从节点树中删除指定节点；根节点本身不会被删除。

```ts
export function removeNode(root: MindMapNode, id: string): boolean
```

### 函数 `moveNodeRelative`

源码：`src/core/node-tree.ts:83`

将节点移动到目标节点之前、之后或内部。

```ts
export function moveNodeRelative(root: MindMapNode, draggedId: string, targetId: string, position: NodeDropPosition): boolean
```

## `src/editor/article-renderer.ts`

文章模式的目录、章节、正文和分页导航渲染器。

### 接口 `ArticleRendererOptions`

源码：`src/editor/article-renderer.ts:29`

文章渲染所需的编辑器状态和回调。

```ts
export interface ArticleRendererOptions
```

### 函数 `renderArticleMode`

源码：`src/editor/article-renderer.ts:52`

根据文档文章样式和文章上下文渲染完整文章页。

```ts
export function renderArticleMode(container: HTMLElement, options: ArticleRendererOptions): void
```

### 函数 `applyArticleLeafBulletStyle`

源码：`src/editor/article-renderer.ts:110`

Applies the configured terminal bullet color and visual style to one article paragraph.

```ts
function applyArticleLeafBulletStyle(paragraph: HTMLElement, options: ArticleRendererOptions): void
```

### 函数 `applyArticleStyle`

源码：`src/editor/article-renderer.ts:117`

将解析后的文章样式写入文章页 CSS 变量。

```ts
function applyArticleStyle(page: HTMLElement, style: ReturnType<typeof resolveArticleStyle>): void
```

### 函数 `renderDirectory`

源码：`src/editor/article-renderer.ts:128`

渲染文章目录页。

```ts
function renderDirectory(page: HTMLElement, options: ArticleRendererOptions): void
```

### 函数 `renderHeading`

源码：`src/editor/article-renderer.ts:146`

渲染章节标题或子导图链接。

```ts
function renderHeading(heading: HTMLElement, node: MindMapNode, title: string, options: ArticleRendererOptions): void
```

### 函数 `renderArticleNodeContent`

源码：`src/editor/article-renderer.ts:162`

渲染文章节点的正文块、图片、备注、表格和代码。

```ts
export function renderArticleNodeContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean, options: ArticleRendererOptions): void
```

### 函数 `renderArticleTable`

源码：`src/editor/article-renderer.ts:202`

Renders a movable table block in article and continuous-reading views.

```ts
function renderArticleTable(container: HTMLElement, tableData: MindMapNode["table"]): void
```

### 函数 `renderArticleQuestionDetails`

源码：`src/editor/article-renderer.ts:215`

Renders structured question options, answers, explanations, and original source in article and reading modes.

```ts
function renderArticleQuestionDetails(container: HTMLElement, node: MindMapNode): void
```

### 函数 `renderArticlePager`

源码：`src/editor/article-renderer.ts:254`

渲染同层兄弟文章页的上一篇、父级、下一篇与阅读完成导航。

```ts
function renderArticlePager(page: HTMLElement, options: ArticleRendererOptions): void
```

## `src/editor/clipboard-import.ts`

编辑器剪贴板内容的节点分支解析。

### 函数 `parseClipboardNodes`

源码：`src/editor/clipboard-import.ts:20`

解析剪贴板载荷中的一个或多个 MindMap Studio 节点，并保留多选分支的复制顺序。

```ts
export function parseClipboardNodes(text: string): MindMapNode[] | null
```

### 函数 `parseClipboardHtml`

源码：`src/editor/clipboard-import.ts:60`

解析富剪贴板提供的嵌套 HTML 列表。

```ts
export function parseClipboardHtml(html: string): MindMapNode | null
```

## `src/editor/content-modals.ts`

编辑器领域的表格与代码块弹窗。

### 函数 `cloneTable`

源码：`src/editor/content-modals.ts:31`

执行“clone table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function cloneTable(table: MindMapTable | undefined): MindMapTable
```

### 类 `TableEditModal`

源码：`src/editor/content-modals.ts:46`

TableEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class TableEditModal extends Modal
```

### 构造函数 `TableEditModal.constructor`

源码：`src/editor/content-modals.ts:59`

创建 TableEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, table: MindMapTable | undefined, submit: (table: MindMapTable) => void)
```

### 方法 `TableEditModal.onOpen`

源码：`src/editor/content-modals.ts:68`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `TableEditModal.renderGrid`

源码：`src/editor/content-modals.ts:158`

渲染grid，并保持模型、界面和持久化状态的一致性。

```ts
private renderGrid(): void
```

### 方法 `TableEditModal.collectGrid`

源码：`src/editor/content-modals.ts:185`

遍历并收集grid，并保持模型、界面和持久化状态的一致性。

```ts
private collectGrid(): void
```

### 类 `CodeEditModal`

源码：`src/editor/content-modals.ts:209`

CodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class CodeEditModal extends Modal
```

### 构造函数 `CodeEditModal.constructor`

源码：`src/editor/content-modals.ts:220`

创建 CodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, block: MindMapCodeBlock | undefined, submit: (block: MindMapCodeBlock) => void)
```

### 方法 `CodeEditModal.onOpen`

源码：`src/editor/content-modals.ts:229`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

## `src/editor/drag-drop.ts`

节点拖放合法性与指针落点的纯计算规则。

### 接口 `DropPointer`

源码：`src/editor/drag-drop.ts:9`

拖放指针与目标节点矩形所需的最小坐标信息。

```ts
export interface DropPointer
```

### 接口 `DropTargetRect`

源码：`src/editor/drag-drop.ts:15`

目标节点矩形所需的最小尺寸信息。

```ts
export interface DropTargetRect
```

### 函数 `canMoveNodes`

源码：`src/editor/drag-drop.ts:25`

判断一个或一组已选节点能否移动到目标节点。

```ts
export function canMoveNodes(root: MindMapNode, selectedIds: ReadonlySet<string>, draggedId: string | null, targetId: string): boolean
```

### 函数 `resolveDropPosition`

源码：`src/editor/drag-drop.ts:40`

根据指针在节点中的位置返回同级前置、成为子级或同级后置。

```ts
export function resolveDropPosition(pointer: DropPointer, rect: DropTargetRect, targetIsRoot: boolean): NodeDropPosition
```

### 函数 `isRightChildZone`

源码：`src/editor/drag-drop.ts:50`

判断指针是否位于节点右侧的显式子级投放区域。

```ts
export function isRightChildZone(pointer: DropPointer, rect: DropTargetRect): boolean
```

## `src/editor/editor-modals.ts`

编辑器领域的通用预览和导出弹窗。

### 类 `ImageHostPickerModal`

源码：`src/editor/editor-modals.ts:24`

选择一个或多个图片上传目标。

```ts
class ImageHostPickerModal extends Modal
```

### 构造函数 `ImageHostPickerModal.constructor`

源码：`src/editor/editor-modals.ts:36`

创建图床选择弹窗。

```ts
constructor( app: App, private readonly hosts: ImageHostChoice[], initialIds: string[], private readonly resolveSelection: (ids: string[] | null) => void )
```

### 方法 `ImageHostPickerModal.onOpen`

源码：`src/editor/editor-modals.ts:49`

创建图床多选列表。

```ts
onOpen(): void
```

### 方法 `ImageHostPickerModal.onClose`

源码：`src/editor/editor-modals.ts:85`

未确认时返回取消结果。

```ts
onClose(): void
```

### 函数 `chooseImageHosts`

源码：`src/editor/editor-modals.ts:98`

打开图床选择器，并过滤已经失效的默认 ID。

```ts
export function chooseImageHosts( app: App, hosts: ImageHostChoice[], initialIds: string[] ): Promise<string[] | null>
```

### 类 `ImagePreviewModal`

源码：`src/editor/editor-modals.ts:117`

提供图片缩放和滚轮预览。

```ts
export class ImagePreviewModal extends Modal
```

### 构造函数 `ImagePreviewModal.constructor`

源码：`src/editor/editor-modals.ts:129`

创建图片预览弹窗。

```ts
constructor( app: App, private readonly source: string, private readonly alt: string, private readonly sources: MindMapImageSourceCandidate[] = [], private readonly resolveSource?: (source: string) => string | null )
```

### 方法 `ImagePreviewModal.onOpen`

源码：`src/editor/editor-modals.ts:142`

创建图片预览界面和缩放控制。

```ts
onOpen(): void
```

### 类 `FormulaEditModal`

源码：`src/editor/editor-modals.ts:231`

图形化 LaTeX 公式编辑器，提供常用结构按钮和实时预览。

```ts
export class FormulaEditModal extends Modal
```

### 构造函数 `FormulaEditModal.constructor`

源码：`src/editor/editor-modals.ts:238`

创建公式编辑器。

```ts
constructor(app: App, private readonly submit: (source: string) => void)
```

### 方法 `FormulaEditModal.onOpen`

源码：`src/editor/editor-modals.ts:245`

创建公式模板、源码输入和 MathJax 预览。

```ts
onOpen(): void
```

### 方法 `FormulaEditModal.onClose`

源码：`src/editor/editor-modals.ts:349`

清理公式编辑器 DOM。

```ts
onClose(): void
```

### 类 `ArticleStyleModal`

源码：`src/editor/editor-modals.ts:357`

编辑文章模式的预设、字体和颜色。

```ts
export class ArticleStyleModal extends Modal
```

### 构造函数 `ArticleStyleModal.constructor`

源码：`src/editor/editor-modals.ts:367`

创建文章样式编辑器。

```ts
constructor( app: App, style: ArticleStyle | undefined, private readonly submitStyle: (style: ArticleStyle) => void )
```

### 方法 `ArticleStyleModal.onOpen`

源码：`src/editor/editor-modals.ts:379`

创建文章样式预设和自定义控件。

```ts
onOpen(): void
```

### 类 `JsonTransferModal`

源码：`src/editor/editor-modals.ts:450`

导入、导出或替换完整的思维导图 JSON。

```ts
export class JsonTransferModal extends Modal
```

### 构造函数 `JsonTransferModal.constructor`

源码：`src/editor/editor-modals.ts:459`

创建 JSON 传输弹窗。

```ts
constructor( app: App, private readonly document: MindMapDocument, private readonly onImport: (document: MindMapDocument) => void, private readonly onExport: (json: string) => void )
```

### 方法 `JsonTransferModal.onOpen`

源码：`src/editor/editor-modals.ts:471`

创建 JSON 文本区和文件导入操作。

```ts
onOpen(): void
```

### 类 `OutlineModal`

源码：`src/editor/editor-modals.ts:550`

显示只读 Markdown 大纲并提供复制和导出入口。

```ts
export class OutlineModal extends Modal
```

### 构造函数 `OutlineModal.constructor`

源码：`src/editor/editor-modals.ts:558`

创建 Markdown 大纲弹窗。

```ts
constructor(app: App, private readonly markdown: string, private readonly onExport: () => void)
```

### 方法 `OutlineModal.onOpen`

源码：`src/editor/editor-modals.ts:565`

创建大纲内容和操作按钮。

```ts
onOpen(): void
```

### 方法 `OutlineModal.onClose`

源码：`src/editor/editor-modals.ts:586`

清理大纲弹窗 DOM。

```ts
onClose(): void
```

### 类 `DocumentExportModal`

源码：`src/editor/editor-modals.ts:594`

提供可移植文档格式的导出选择。

```ts
export class DocumentExportModal extends Modal
```

### 构造函数 `DocumentExportModal.constructor`

源码：`src/editor/editor-modals.ts:601`

创建文档导出格式弹窗。

```ts
constructor(app: App, private readonly exportFormat: (format: "html" | "doc" | "pdf" | "md") => void)
```

### 方法 `DocumentExportModal.onOpen`

源码：`src/editor/editor-modals.ts:608`

创建各导出格式按钮。

```ts
onOpen(): void
```

## `src/editor/editor-types.ts`

编辑器领域与 Obsidian 宿主层之间的稳定类型契约。

### 接口 `MindMapEditorCallbacks`

源码：`src/editor/editor-types.ts:27`

Host services consumed by the editor. Keeping these callbacks outside the editor implementation makes the UI testable without constructing the complete Obsidian plugin.

```ts
export interface MindMapEditorCallbacks
```

### 接口 `MindMapEditorOptions`

源码：`src/editor/editor-types.ts:62`

Runtime editor configuration assembled by the view/plugin layer.

```ts
export interface MindMapEditorOptions
```

## `src/editor/editor.ts`

编辑器领域的核心交互控制器。

### 接口 `ScreenshotInsertionTarget`

源码：`src/editor/editor.ts:114`

NodeEditValues 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface ScreenshotInsertionTarget
```

### 接口 `NodeEditValues`

源码：`src/editor/editor.ts:120`

节点编辑弹窗读写的完整字段集合。

```ts
interface NodeEditValues
```

### 接口 `ArticleNumberingValues`

源码：`src/editor/editor.ts:144`

当前节点或中心节点保存的文章编号覆盖设置。

```ts
interface ArticleNumberingValues
```

### 接口 `ArticleNumberingControls`

源码：`src/editor/editor.ts:150`

文章编号控件返回的读取句柄。

```ts
interface ArticleNumberingControls
```

### 函数 `createArticleNumberingControls`

源码：`src/editor/editor.ts:164`

创建节点编辑与“主题与外观”共用的文章编号控件，确保两处设置语义和文案一致。 手动层级表示当前节点所在子树的最高文章层级；中心节点本身不编号，一级子节点直接使用所选层级。

```ts
function createArticleNumberingControls( container: HTMLElement, currentMode: ArticleNumberingMode | undefined, currentLevel: number | undefined, onChange?: () => void ): ArticleNumberingControls
```

### 类 `NodeEditModal`

源码：`src/editor/editor.ts:216`

NodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class NodeEditModal extends Modal
```

### 构造函数 `NodeEditModal.constructor`

源码：`src/editor/editor.ts:240`

创建 NodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, node: MindMapNode, defaultShape: NodeShape, callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource">, submit: (values: NodeEdit…
```

### 方法 `NodeEditModal.onOpen`

源码：`src/editor/editor.ts:260`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `NodeEditModal.onClose`

源码：`src/editor/editor.ts:590`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 方法 `NodeEditModal.releaseKeyboardScope`

源码：`src/editor/editor.ts:603`

右侧面板与画布快速输入并存时，释放 Modal 的全局按键作用域。

```ts
releaseKeyboardScope(): void
```

### 类 `AppearanceModal`

源码：`src/editor/editor.ts:611`

AppearanceModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class AppearanceModal extends Modal
```

### 构造函数 `AppearanceModal.constructor`

源码：`src/editor/editor.ts:633`

创建 AppearanceModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, appearance: MindMapAppearance, numbering: ArticleNumberingValues, articleTocMaxDepth: number | undefined, globalArticleTocMaxDepth: number, articleMiniMap: boolean | undefined, globalArticleMiniMap: boolean, pageCodeAppearance: MindMa…
```

### 方法 `AppearanceModal.onOpen`

源码：`src/editor/editor.ts:660`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 类 `MindMapEditor`

源码：`src/editor/editor.ts:972`

MindMapEditor 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapEditor
```

### 构造函数 `MindMapEditor.constructor`

源码：`src/editor/editor.ts:1048`

创建 MindMapEditor 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, host: HTMLElement, document: MindMapDocument, callbacks: MindMapEditorCallbacks, options: MindMapEditorOptions)
```

### 方法 `MindMapEditor.destroy`

源码：`src/editor/editor.ts:1074`

执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
destroy(): void
```

### 方法 `MindMapEditor.setDocument`

源码：`src/editor/editor.ts:1098`

更新并应用document，并保持模型、界面和持久化状态的一致性。

```ts
setDocument(document: MindMapDocument, resetHistory = true): void
```

### 方法 `MindMapEditor.setOptions`

源码：`src/editor/editor.ts:1116`

更新编辑器运行参数。文章族上下文或持久化阅读位置在异步加载完成后变化时， 会重新解析节点并恢复到同一语义位置，而不是恢复旧的像素滚动值。

```ts
setOptions(options: MindMapEditorOptions): void
```

### 方法 `MindMapEditor.setDisplayMode`

源码：`src/editor/editor.ts:1218`

切换显示模式，并将当前语义位置同步到目标模式。通读中的目标属于子导图时， 回调会在全局模式切换后打开对应物理文件并定位节点。

```ts
setDisplayMode(mode: DisplayMode, notifyGlobal = true, persistCapturedLocation = true): void
```

### 方法 `MindMapEditor.applyGlobalDisplayMode`

源码：`src/editor/editor.ts:1252`

应用其他已打开视图发出的全局模式切换，同时保留本视图自己的阅读位置。

```ts
applyGlobalDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapEditor.readingLocationSections`

源码：`src/editor/editor.ts:1268`

返回包含当前未保存文档的最新文章族快照。

```ts
private readingLocationSections(options: MindMapEditorOptions = this.options): ReadingSection[]
```

### 方法 `MindMapEditor.resolveStoredLocation`

源码：`src/editor/editor.ts:1279`

解析上次保存的位置，并在节点失效时逐级回退。

```ts
private resolveStoredLocation(): ResolvedReadingLocation | null
```

### 方法 `MindMapEditor.captureCurrentLocation`

源码：`src/editor/editor.ts:1288`

从当前模式的选择或滚动视口中提取统一语义位置。

```ts
private captureCurrentLocation(mode: DisplayMode): ReadingLocation | null
```

### 方法 `MindMapEditor.rememberLocation`

源码：`src/editor/editor.ts:1330`

将统一位置写回插件设置；滚动过程会去重并延迟写盘。

```ts
private rememberLocation(location: ReadingLocation, immediate = false): void
```

### 方法 `MindMapEditor.rememberCurrentLocation`

源码：`src/editor/editor.ts:1346`

捕获当前模式位置并按需立即保存。

```ts
private rememberCurrentLocation(mode: DisplayMode, immediate = false): ReadingLocation | null
```

### 方法 `MindMapEditor.scheduleReadingLocationCapture`

源码：`src/editor/editor.ts:1353`

对滚动事件进行轻量防抖，避免每个像素变化都扫描章节 DOM。

```ts
private scheduleReadingLocationCapture(mode: DisplayMode): void
```

### 方法 `MindMapEditor.blockReadingLocationCapture`

源码：`src/editor/editor.ts:1369`

在程序主动恢复滚动位置期间暂停滚动采集。 修改 `scrollTop` 同样会触发 scroll 事件；若把它当成用户滚动重新保存， 会形成“恢复 → 采集 → 保存 → 再恢复”的位置反馈环。

```ts
private blockReadingLocationCapture(): void
```

### 方法 `MindMapEditor.restoreReadingLocation`

源码：`src/editor/editor.ts:1386`

在目标模式中恢复节点和节点内部比例。目标位于其他物理文件时只返回解析结果， 由视图层在模式同步完成后打开该文件。

```ts
private restoreReadingLocation(mode: DisplayMode, location: ReadingLocation | null | undefined): ResolvedReadingLocation | null
```

### 方法 `MindMapEditor.toggleReadOnly`

源码：`src/editor/editor.ts:1432`

切换read only，并保持模型、界面和持久化状态的一致性。

```ts
toggleReadOnly(): void
```

### 方法 `MindMapEditor.askAi`

源码：`src/editor/editor.ts:1476`

使用最近一次右键范围询问 AI；未右键节点时默认询问当前页面。

```ts
askAi(): void
```

### 方法 `MindMapEditor.getDocument`

源码：`src/editor/editor.ts:1485`

读取并返回document，并保持模型、界面和持久化状态的一致性。

```ts
getDocument(): MindMapDocument
```

### 方法 `MindMapEditor.previewAiEdit`

源码：`src/editor/editor.ts:1491`

根据当前页面或节点范围生成 AI Markdown 修改预览，不直接修改文档。

```ts
previewAiEdit(responseText: string, scopeNodeId?: string): AiEditPreview
```

### 方法 `MindMapEditor.applyAiEdit`

源码：`src/editor/editor.ts:1496`

应用用户确认的 AI 修改预览，并写入撤销历史。

```ts
applyAiEdit(preview: AiEditPreview): boolean
```

### 方法 `MindMapEditor.previewLocalReplace`

源码：`src/editor/editor.ts:1510`

预览当前页面或节点子树中的本地文字替换，不调用任何 AI 接口。

```ts
previewLocalReplace(query: string, replacement: string, caseSensitive = false, scopeNodeId?: string): LocalReplacePreview
```

### 方法 `MindMapEditor.applyLocalReplace`

源码：`src/editor/editor.ts:1515`

应用用户确认的本地文字替换，并写入撤销历史。

```ts
applyLocalReplace(preview: LocalReplacePreview): boolean
```

### 方法 `MindMapEditor.captureScreenshot`

源码：`src/editor/editor.ts:1529`

启动系统截图；有编辑焦点时插入原节点，否则保留系统剪贴板中的截图。

```ts
async captureScreenshot(): Promise<void>
```

### 方法 `MindMapEditor.screenshotInsertionTarget`

源码：`src/editor/editor.ts:1577`

返回截图操作开始前实际聚焦的节点或文章段落；命令面板等外部焦点返回 null。

```ts
private screenshotInsertionTarget(): ScreenshotInsertionTarget | null
```

### 方法 `MindMapEditor.recognizeImageBlock`

源码：`src/editor/editor.ts:1603`

识别指定图片；直接确认时后台替换，否则打开原图/文字对比预览。

```ts
private async recognizeImageBlock(nodeId: string, blockId: string): Promise<void>
```

### 方法 `MindMapEditor.previewImageTextReplacements`

源码：`src/editor/editor.ts:1632`

为 AI 助手的每张识图结果创建独立且可校验的原位替换预览。

```ts
previewImageTextReplacements(items: ImageRecognitionItemResult[]): ImageTextReplacementPreview[]
```

### 方法 `MindMapEditor.applyImageTextReplacements`

源码：`src/editor/editor.ts:1637`

应用用户确认的图片转文字预览，并统一接入撤销、保存和聚焦。

```ts
async applyImageTextReplacements(previews: ImageTextReplacementPreview[]): Promise<boolean>
```

### 方法 `MindMapEditor.applyImageRecognitionPreview`

源码：`src/editor/editor.ts:1656`

应用单张图片识别预览。

```ts
private applyImageRecognitionPreview(preview: ImageTextReplacementPreview): Promise<boolean>
```

### 方法 `MindMapEditor.autoUploadScheduleMessage`

源码：`src/editor/editor.ts:1661`

格式化粘贴和截图后的自动上传提示。

```ts
private autoUploadScheduleMessage(): string
```

### 方法 `MindMapEditor.markSaved`

源码：`src/editor/editor.ts:1669`

执行“mark saved”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
markSaved(): void
```

### 方法 `MindMapEditor.markSaving`

源码：`src/editor/editor.ts:1677`

执行“mark saving”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
markSaving(): void
```

### 方法 `MindMapEditor.focus`

源码：`src/editor/editor.ts:1685`

定位相关数据，并保持模型、界面和持久化状态的一致性。

```ts
focus(): void
```

### 方法 `MindMapEditor.focusNodeById`

源码：`src/editor/editor.ts:1694`

定位node by id，并保持模型、界面和持久化状态的一致性。

```ts
focusNodeById(id: string, persistLocation = true): void
```

### 方法 `MindMapEditor.showArticleDirectory`

源码：`src/editor/editor.ts:1702`

Switches the current top-level document to its generated article directory.

```ts
showArticleDirectory(): void
```

### 方法 `MindMapEditor.buildUi`

源码：`src/editor/editor.ts:1712`

构建ui，并保持模型、界面和持久化状态的一致性。

```ts
private buildUi(): void
```

### 方法 `MindMapEditor.resolveMode`

源码：`src/editor/editor.ts:2027`

解析并确定mode，并保持模型、界面和持久化状态的一致性。

```ts
private resolveMode(preferred: DisplayMode): DisplayMode
```

### 方法 `MindMapEditor.persistReadOnlyState`

源码：`src/editor/editor.ts:2035`

执行“persist read only state”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private persistReadOnlyState(): void
```

### 方法 `MindMapEditor.applyReadOnlyStateToRenderedContent`

源码：`src/editor/editor.ts:2049`

Updates edit affordances in the existing DOM without rebuilding the map or article.

```ts
private applyReadOnlyStateToRenderedContent(): void
```

### 方法 `MindMapEditor.updateModeUi`

源码：`src/editor/editor.ts:2069`

执行“update mode ui”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private updateModeUi(): void
```

### 方法 `MindMapEditor.ensureEditable`

源码：`src/editor/editor.ts:2108`

执行“ensure editable”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private ensureEditable(): boolean
```

### 方法 `MindMapEditor.clearImageLoadTimers`

源码：`src/editor/editor.ts:2117`

执行“clear image load timers”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private clearImageLoadTimers(): void
```

### 方法 `MindMapEditor.updateAiScopeButton`

源码：`src/editor/editor.ts:2123`

更新 AI 工具栏提示，使用户知道下一次提问会使用页面还是右键节点。

```ts
private updateAiScopeButton(): void
```

### 方法 `MindMapEditor.addToolbarButton`

源码：`src/editor/editor.ts:2144`

添加toolbar button，并保持模型、界面和持久化状态的一致性。

```ts
private addToolbarButton(id: string, icon: string, label: string, action: () => void, editOnly = false): HTMLButtonElement
```

### 方法 `MindMapEditor.applyToolbarOrder`

源码：`src/editor/editor.ts:2164`

Applies the user-defined order to toolbar buttons.

```ts
private applyToolbarOrder(): void
```

### 方法 `MindMapEditor.addToolbarSeparator`

源码：`src/editor/editor.ts:2181`

添加toolbar separator，并保持模型、界面和持久化状态的一致性。

```ts
private addToolbarSeparator(): void
```

### 方法 `MindMapEditor.getAppearance`

源码：`src/editor/editor.ts:2189`

读取并返回appearance，并保持模型、界面和持久化状态的一致性。

```ts
private getAppearance(): MindMapAppearance
```

### 方法 `MindMapEditor.fontFamilyCss`

源码：`src/editor/editor.ts:2199`

执行“font family css”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private fontFamilyCss(appearance: MindMapAppearance): string
```

### 方法 `MindMapEditor.applyAppearance`

源码：`src/editor/editor.ts:2212`

应用appearance，并保持模型、界面和持久化状态的一致性。

```ts
private applyAppearance(appearance: MindMapAppearance): void
```

### 方法 `MindMapEditor.renderNavigation`

源码：`src/editor/editor.ts:2238`

在画布左上角或文档顶部渲染父子导图导航。导图模式使用固定悬浮面包屑，文章和大纲模式使用文档流导航，均保持当前全局显示模式。

```ts
private renderNavigation(): void
```

### 方法 `MindMapEditor.updateNodePrimaryText`

源码：`src/editor/editor.ts:2308`

执行“update node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private updateNodePrimaryText(node: MindMapNode, value:
```

### 方法 `MindMapEditor.makeInlineEditable`

源码：`src/editor/editor.ts:2330`

创建并配置inline editable，并保持模型、界面和持久化状态的一致性。

```ts
private makeInlineEditable(element: HTMLElement, node: MindMapNode, placeholder: string): void
```

### 方法 `MindMapEditor.applyInlineEditingAccessibility`

源码：`src/editor/editor.ts:2393`

Adds textbox semantics only while an inline line is actively editable.

```ts
private applyInlineEditingAccessibility(element: HTMLElement): void
```

### 方法 `MindMapEditor.clearInlineEditingAccessibility`

源码：`src/editor/editor.ts:2399`

Removes edit-only semantics so Obsidian does not show hover tooltips on reading text.

```ts
private clearInlineEditingAccessibility(element: HTMLElement): void
```

### 方法 `MindMapEditor.activateInlineEditable`

源码：`src/editor/editor.ts:2405`

Activates one article or outline line without changing the surrounding layout.

```ts
private activateInlineEditable(element: HTMLElement, focus = true): void
```

### 方法 `MindMapEditor.addInlineNodeActions`

源码：`src/editor/editor.ts:2418`

添加inline node actions，并保持模型、界面和持久化状态的一致性。

```ts
private addInlineNodeActions(container: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.renderOutline`

源码：`src/editor/editor.ts:2434`

按照节点层级渲染可编辑大纲。节点标题、备注和子导图链接仍映射到同一份数据，任何修改都会通过统一变更链同步到导图和文章模式。

```ts
private renderOutline(): void
```

### 方法 `MindMapEditor.renderArticle`

源码：`src/editor/editor.ts:2459`

渲染文章目录页、章节编号、正文和跨子导图链接。顶层父导图可展示递归目录；子导图根据文章上下文继续父级编号。

```ts
private renderArticle(): void
```

### 方法 `MindMapEditor.renderArticleMiniMap`

源码：`src/editor/editor.ts:2468`

Renders a compact structural navigator for article and continuous reading views.

```ts
private renderArticleMiniMap(): void
```

### 方法 `MindMapEditor.articleMiniMapDepth`

源码：`src/editor/editor.ts:2503`

Returns the structural article depth represented by a minimap target.

```ts
private articleMiniMapDepth(target: HTMLElement): number
```

### 方法 `MindMapEditor.articleMiniMapTargetLabel`

源码：`src/editor/editor.ts:2508`

Returns the complete chapter label for the minimap marker tooltip.

```ts
private articleMiniMapTargetLabel(target: HTMLElement): string
```

### 方法 `MindMapEditor.showArticleMiniMapTooltip`

源码：`src/editor/editor.ts:2515`

Shows a complete chapter label above its marker without clipping it to the navigator width.

```ts
private showArticleMiniMapTooltip(marker: HTMLElement, label: string): void
```

### 方法 `MindMapEditor.hideArticleMiniMapTooltip`

源码：`src/editor/editor.ts:2527`

Hides the standalone chapter label when its marker is no longer focused.

```ts
private hideArticleMiniMapTooltip(): void
```

### 方法 `MindMapEditor.scrollToArticleMiniMapTarget`

源码：`src/editor/editor.ts:2532`

Scrolls the article container to the exact top position of a minimap target.

```ts
private scrollToArticleMiniMapTarget(target: HTMLElement): void
```

### 方法 `MindMapEditor.articleMiniMapTargets`

源码：`src/editor/editor.ts:2540`

Returns the current page's highest and next-highest structural categories for the minimap.

```ts
private articleMiniMapTargets(): HTMLElement[]
```

### 方法 `MindMapEditor.updateArticleMiniMapActiveMarker`

源码：`src/editor/editor.ts:2551`

Updates the dark marker to match the article section currently being read.

```ts
private updateArticleMiniMapActiveMarker(): void
```

### 方法 `MindMapEditor.updateArticleMiniMapMarkerHover`

源码：`src/editor/editor.ts:2567`

Expands the nearest marker and progressively shortens its vertical neighbours.

```ts
private updateArticleMiniMapMarkerHover(focusedIndex: number | null): void
```

### 方法 `MindMapEditor.bindArticleMiniMapInteractions`

源码：`src/editor/editor.ts:2575`

Keeps the navigator discoverable while preventing it from permanently occupying the page edge.

```ts
private bindArticleMiniMapInteractions(track: HTMLElement): void
```

### 方法 `MindMapEditor.clearArticleMiniMap`

源码：`src/editor/editor.ts:2629`

Removes minimap listeners and pending timers before the next article render.

```ts
private clearArticleMiniMap(): void
```

### 方法 `MindMapEditor.updateArticleMiniMapVisibility`

源码：`src/editor/editor.ts:2640`

Hides the minimap when the article page leaves insufficient right-side gutter.

```ts
private updateArticleMiniMapVisibility(): void
```

### 方法 `MindMapEditor.articleRendererOptions`

源码：`src/editor/editor.ts:2651`

构造文章渲染器所需的最小状态边界。

```ts
private articleRendererOptions(): ArticleRendererOptions
```

### 方法 `MindMapEditor.effectiveArticleTocMaxDepth`

源码：`src/editor/editor.ts:2680`

返回当前脑图实际使用的目录最大层级。文档级覆盖优先，未设置时跟随插件全局选项。

```ts
private effectiveArticleTocMaxDepth(): number
```

### 方法 `MindMapEditor.renderArticleContent`

源码：`src/editor/editor.ts:2685`

将文章内容块渲染委托给文章模式模块。

```ts
private renderArticleContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean): void
```

### 方法 `MindMapEditor.installArticleSectionCollapse`

源码：`src/editor/editor.ts:2690`

Adds Markdown-style collapse controls to headings and hides their descendant article sections.

```ts
private installArticleSectionCollapse(): void
```

### 方法 `MindMapEditor.installReadingChapterCollapse`

源码：`src/editor/editor.ts:2734`

Adds the same collapse control to top-level chapters in continuous reading mode.

```ts
private installReadingChapterCollapse(): void
```

### 方法 `MindMapEditor.render`

源码：`src/editor/editor.ts:2763`

渲染相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private render(): void
```

### 方法 `MindMapEditor.renderQuestionPractice`

源码：`src/editor/editor.ts:2790`

Renders the configured-folder practice surface and persists each automatic grading result.

```ts
private renderQuestionPractice(): void
```

### 方法 `MindMapEditor.renderMindMap`

源码：`src/editor/editor.ts:2818`

渲染可交互导图画布：计算布局、绘制连接线和节点、恢复选择状态、绑定拖拽与尺寸手柄、安装子导图整节点入口，并启动图片镜像加载探测。

```ts
private renderMindMap(): void
```

### 方法 `MindMapEditor.renderMindMapEdges`

源码：`src/editor/editor.ts:3225`

使用当前布局坐标重新绘制全部连接线。

```ts
private renderMindMapEdges(appearance: MindMapAppearance, branchColorMap: Map<string, string>): void
```

### 方法 `MindMapEditor.scheduleMeasuredMindMapLayout`

源码：`src/editor/editor.ts:3249`

合并同一帧内的节点尺寸变化，避免表格和图片加载触发重复布局。

```ts
private scheduleMeasuredMindMapLayout(): void
```

### 方法 `MindMapEditor.applyMeasuredMindMapLayout`

源码：`src/editor/editor.ts:3263`

使用浏览器实际渲染尺寸重新执行碰撞避让。 表格、代码和图片节点的真实高度可能大于模型估算值，因此必须在 DOM 完成排版后更新包围盒、节点坐标、连接线和画布边界。

```ts
private applyMeasuredMindMapLayout(): void
```

### 方法 `MindMapEditor.applyTransform`

源码：`src/editor/editor.ts:3305`

应用transform，并保持模型、界面和持久化状态的一致性。

```ts
private applyTransform(): void
```

### 方法 `MindMapEditor.selectAllNodesExceptRoot`

源码：`src/editor/editor.ts:3315`

Selects every non-root node so bulk operations never affect the protected main node.

```ts
private selectAllNodesExceptRoot(): void
```

### 方法 `MindMapEditor.selectNode`

源码：`src/editor/editor.ts:3330`

Selects one node and clears any prior multi-selection.

```ts
private selectNode(id: string | null): void
```

### 方法 `MindMapEditor.toggleNodeSelection`

源码：`src/editor/editor.ts:3345`

Adds or removes one node from the current multi-selection.

```ts
private toggleNodeSelection(id: string): void
```

### 方法 `MindMapEditor.createSelectionLocation`

源码：`src/editor/editor.ts:3360`

为一次节点点击构建位置。文章、大纲和通读模式保留节点当前的屏幕比例， 防止后续设置刷新把刚点击的节点强制拉到固定 35% 高度。

```ts
private createSelectionLocation(id: string): ReadingLocation
```

### 方法 `MindMapEditor.applySelectionClasses`

源码：`src/editor/editor.ts:3391`

Synchronizes selection classes across all editor views.

```ts
private applySelectionClasses(): void
```

### 方法 `MindMapEditor.selectedNode`

源码：`src/editor/editor.ts:3408`

执行“selected node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private selectedNode(): MindMapNode | null
```

### 方法 `MindMapEditor.createConfiguredNode`

源码：`src/editor/editor.ts:3418`

创建configured node，并保持模型、界面和持久化状态的一致性。

```ts
private createConfiguredNode(text = "新节点"): MindMapNode
```

### 方法 `MindMapEditor.shortcutMatches`

源码：`src/editor/editor.ts:3431`

判断键盘事件是否匹配用户配置的组合键。

```ts
private shortcutMatches(event: KeyboardEvent, shortcut: string): boolean
```

### 方法 `MindMapEditor.isNearNodeEdge`

源码：`src/editor/editor.ts:3449`

Returns whether a double-click landed in the edge band reserved for the full node editor instead of the central quick-edit area.

```ts
private isNearNodeEdge(event: MouseEvent, nodeEl: HTMLElement): boolean
```

### 方法 `MindMapEditor.beginInlineEdit`

源码：`src/editor/editor.ts:3461`

在节点本体中启动轻量富文本输入。

```ts
private beginInlineEdit(nodeId: string, blockId?: string, protectInitialFocus = false): void
```

### 方法 `MindMapEditor.addChild`

源码：`src/editor/editor.ts:3754`

添加child，并保持模型、界面和持久化状态的一致性。

```ts
private addChild(): void
```

### 方法 `MindMapEditor.addSibling`

源码：`src/editor/editor.ts:3768`

添加sibling，并保持模型、界面和持久化状态的一致性。

```ts
private addSibling(): void
```

### 方法 `MindMapEditor.editSelected`

源码：`src/editor/editor.ts:3788`

编辑selected，并保持模型、界面和持久化状态的一致性。

```ts
private editSelected(initialBlockId?: string): void
```

### 方法 `MindMapEditor.addQuestionChild`

源码：`src/editor/editor.ts:3854`

Creates a structured question as a child of the selected node.

```ts
private addQuestionChild(): void
```

### 方法 `MindMapEditor.editQuestion`

源码：`src/editor/editor.ts:3869`

Opens the structured question editor and mirrors its stem into normal node content.

```ts
private editQuestion(node = this.selectedNode()): void
```

### 方法 `MindMapEditor.deleteSelected`

源码：`src/editor/editor.ts:3888`

删除selected，并保持模型、界面和持久化状态的一致性。

```ts
private deleteSelected(): void
```

### 方法 `MindMapEditor.toggleCollapse`

源码：`src/editor/editor.ts:3919`

切换collapse，并保持模型、界面和持久化状态的一致性。

```ts
private toggleCollapse(): void
```

### 方法 `MindMapEditor.setAllNodesCollapsed`

源码：`src/editor/editor.ts:3935`

Expands or collapses every branch while keeping the root visible.

```ts
private setAllNodesCollapsed(collapsed: boolean): void
```

### 方法 `MindMapEditor.toggleAllNodesCollapsed`

源码：`src/editor/editor.ts:3948`

Toggles every non-root branch between fully expanded and fully collapsed.

```ts
private toggleAllNodesCollapsed(): void
```

### 方法 `MindMapEditor.cycleTask`

源码：`src/editor/editor.ts:3956`

切换task，并保持模型、界面和持久化状态的一致性。

```ts
private cycleTask(): void
```

### 方法 `MindMapEditor.toggleLayout`

源码：`src/editor/editor.ts:3966`

切换layout，并保持模型、界面和持久化状态的一致性。

```ts
private toggleLayout(): void
```

### 方法 `MindMapEditor.toggleArticleLanding`

源码：`src/editor/editor.ts:3975`

Switches the top-level article between its generated directory and original article content.

```ts
private toggleArticleLanding(): void
```

### 方法 `MindMapEditor.editArticleStyle`

源码：`src/editor/editor.ts:3986`

Opens article preset and typography controls for the current document.

```ts
private editArticleStyle(): void
```

### 方法 `MindMapEditor.editAppearance`

源码：`src/editor/editor.ts:3996`

编辑appearance，并保持模型、界面和持久化状态的一致性。

```ts
private editAppearance(): void
```

### 方法 `MindMapEditor.editTable`

源码：`src/editor/editor.ts:4037`

编辑table，并保持模型、界面和持久化状态的一致性。

```ts
private editTable(): void
```

### 方法 `MindMapEditor.convertChildrenToTable`

源码：`src/editor/editor.ts:4048`

转换children to table，并保持模型、界面和持久化状态的一致性。

```ts
private convertChildrenToTable(): void
```

### 方法 `MindMapEditor.removeTable`

源码：`src/editor/editor.ts:4063`

删除table，并保持模型、界面和持久化状态的一致性。

```ts
private removeTable(): void
```

### 方法 `MindMapEditor.editCode`

源码：`src/editor/editor.ts:4076`

编辑code，并保持模型、界面和持久化状态的一致性。

```ts
private editCode(): void
```

### 方法 `MindMapEditor.removeCode`

源码：`src/editor/editor.ts:4087`

删除code，并保持模型、界面和持久化状态的一致性。

```ts
private removeCode(): void
```

### 方法 `MindMapEditor.upsertStructuredBlock`

源码：`src/editor/editor.ts:4101`

插入或更新第一个表格内容块，并保留该块当前的排序位置。

```ts
private upsertStructuredBlock(node: MindMapNode, type: "table", value: MindMapTable): void;
```

### 方法 `MindMapEditor.upsertStructuredBlock`

源码：`src/editor/editor.ts:4109`

插入或更新第一个代码内容块，并保留该块当前的排序位置。

```ts
private upsertStructuredBlock(node: MindMapNode, type: "code", value: MindMapCodeBlock): void;
```

### 方法 `MindMapEditor.upsertStructuredBlock`

源码：`src/editor/editor.ts:4117`

插入或更新首个结构化内容块，并同步兼容旧版节点字段。

```ts
private upsertStructuredBlock(node: MindMapNode, type: "table" | "code", value: MindMapTable | MindMapCodeBlock): void
```

### 方法 `MindMapEditor.removeStructuredBlocks`

源码：`src/editor/editor.ts:4130`

Removes all matching structured blocks and mirrors the legacy node fields for compatibility.

```ts
private removeStructuredBlocks(node: MindMapNode, type: "table" | "code"): void
```

### 方法 `MindMapEditor.createOrOpenSubmap`

源码：`src/editor/editor.ts:4139`

如果节点已有子导图则打开；否则创建独立 .mindmap 文件并在父节点与子文件导航元数据中建立双向关系。

```ts
private async createOrOpenSubmap(): Promise<void>
```

### 方法 `MindMapEditor.renderReading`

源码：`src/editor/editor.ts:4160`

Renders every map in the current parent/child family as one continuous, read-only book with an integrated directory and persisted progress.

```ts
private renderReading(): void
```

### 方法 `MindMapEditor.addArticleScrollToTopButton`

源码：`src/editor/editor.ts:4274`

Adds the shared floating control used to return article and continuous-reading views to their top.

```ts
private addArticleScrollToTopButton(): void
```

### 方法 `MindMapEditor.deleteSelectedSubmap`

源码：`src/editor/editor.ts:4300`

Deletes the selected node's submap file when present and clears stale links when the file was already removed outside the plugin.

```ts
private async deleteSelectedSubmap(): Promise<void>
```

### 方法 `MindMapEditor.renderQuestionSummary`

源码：`src/editor/editor.ts:4324`

渲染node table，并保持模型、界面和持久化状态的一致性。

```ts
private renderQuestionSummary(content: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.renderNodeTable`

源码：`src/editor/editor.ts:4365`

Renders the optional table payload beneath normal node and question content.

```ts
private renderNodeTable(content: HTMLElement, node: MindMapNode, tableData: MindMapTable, blockId?: string): void
```

### 方法 `MindMapEditor.renderNodeCode`

源码：`src/editor/editor.ts:4392`

渲染node code，并保持模型、界面和持久化状态的一致性。

```ts
private renderNodeCode(content: HTMLElement, node: MindMapNode, codeData: MindMapCodeBlock, blockId?: string): void
```

### 方法 `MindMapEditor.handlePaste`

源码：`src/editor/editor.ts:4415`

处理编辑器内粘贴：优先识别图片并保存为本地资源，其次识别表格、代码块或节点分支。普通文本也会作为当前节点的子节点插入。

```ts
private async handlePaste(event: ClipboardEvent): Promise<void>
```

### 方法 `MindMapEditor.openSelectedLink`

源码：`src/editor/editor.ts:4483`

打开selected link，并保持模型、界面和持久化状态的一致性。

```ts
private openSelectedLink(): void
```

### 方法 `MindMapEditor.isParentNavigationBacklink`

源码：`src/editor/editor.ts:4500`

判断parent navigation backlink，并保持模型、界面和持久化状态的一致性。

```ts
private isParentNavigationBacklink(node: MindMapNode): boolean
```

### 方法 `MindMapEditor.getNodeLink`

源码：`src/editor/editor.ts:4517`

读取并返回node link，并保持模型、界面和持久化状态的一致性。

```ts
private getNodeLink(node: MindMapNode): string | null
```

### 方法 `MindMapEditor.showOutline`

源码：`src/editor/editor.ts:4526`

执行“show outline”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private showOutline(): void
```

### 方法 `MindMapEditor.showJsonTransfer`

源码：`src/editor/editor.ts:4534`

执行“show json transfer”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private showJsonTransfer(): void
```

### 方法 `MindMapEditor.showDocumentExport`

源码：`src/editor/editor.ts:4547`

Opens the HTML, Word, PDF, and Markdown export chooser.

```ts
private showDocumentExport(): void
```

### 方法 `MindMapEditor.openSearch`

源码：`src/editor/editor.ts:4556`

打开search，并保持模型、界面和持久化状态的一致性。

```ts
private openSearch(): void
```

### 方法 `MindMapEditor.focusNode`

源码：`src/editor/editor.ts:4566`

定位指定节点。必要时先展开全部祖先、切换到可显示该节点的视图并重渲染，然后选中节点并将其平滑移动到可视区域中央。

```ts
private focusNode(id: string, persistLocation = true): void
```

### 方法 `MindMapEditor.centerNode`

源码：`src/editor/editor.ts:4602`

定位node，并保持模型、界面和持久化状态的一致性。

```ts
private centerNode(id: string): void
```

### 方法 `MindMapEditor.openAiScopeContextMenu`

源码：`src/editor/editor.ts:4613`

设置右键 AI 范围并显示只包含 AI 操作的上下文菜单。

```ts
private openAiScopeContextMenu(event: MouseEvent, nodeId: string | null): void
```

### 方法 `MindMapEditor.convertImageToQuestion`

源码：`src/editor/editor.ts:4626`

Converts one image block into a question node, then runs recognition, source lookup, and analysis.

```ts
private async convertImageToQuestion(nodeId: string, blockId: string): Promise<void>
```

### 方法 `MindMapEditor.openImageContextMenu`

源码：`src/editor/editor.ts:4677`

显示图片专用右键菜单，并按当前设置启动 AI 识图或本地 OCR。

```ts
private openImageContextMenu(event: MouseEvent, nodeId: string, blockId: string): void
```

### 方法 `MindMapEditor.openContextMenu`

源码：`src/editor/editor.ts:4698`

打开context menu，并保持模型、界面和持久化状态的一致性。

```ts
private openContextMenu(event: MouseEvent): void
```

### 方法 `MindMapEditor.extractToSubmap`

源码：`src/editor/editor.ts:4770`

将选中节点及其后代提取为子导图文件，然后从当前文档移除该节点。

```ts
private async extractToSubmap(): Promise<void>
```

### 方法 `MindMapEditor.mergeFromSubmap`

源码：`src/editor/editor.ts:4790`

将当前子导图合并回父导图并删除该子导图文件。

```ts
private async mergeFromSubmap(): Promise<void>
```

### 方法 `MindMapEditor.openAllNodesContextMenu`

源码：`src/editor/editor.ts:4805`

Opens the canvas and toolbar context menu for global branch visibility.

```ts
private openAllNodesContextMenu(event: MouseEvent): void
```

### 方法 `MindMapEditor.insertFormula`

源码：`src/editor/editor.ts:4826`

打开图形化公式编辑器并把生成的公式追加到当前节点。

```ts
private insertFormula(): void
```

### 方法 `MindMapEditor.copySelectedBranch`

源码：`src/editor/editor.ts:4851`

将当前分支或多选集合中的顶层分支复制到系统和插件内部剪贴板。

```ts
private async copySelectedBranch(): Promise<boolean>
```

### 方法 `MindMapEditor.pasteAsChild`

源码：`src/editor/editor.ts:4879`

将剪贴板中的一个或多个分支按顺序粘贴为当前节点的子节点。

```ts
private async pasteAsChild(): Promise<void>
```

### 方法 `MindMapEditor.duplicateSelected`

源码：`src/editor/editor.ts:4907`

复制生成selected，并保持模型、界面和持久化状态的一致性。

```ts
private duplicateSelected(): void
```

### 方法 `MindMapEditor.canMoveNode`

源码：`src/editor/editor.ts:4931`

判断reparent，并保持模型、界面和持久化状态的一致性。

```ts
private canMoveNode(draggedId: string | null, targetId: string): boolean
```

### 方法 `MindMapEditor.dropPositionForEvent`

源码：`src/editor/editor.ts:4943`

根据指针在目标节点的位置判断拖放意图。右侧和中间均成为子级；根节点仅接受子节点放置。

```ts
private dropPositionForEvent(event: DragEvent, targetEl: HTMLElement, targetId: string): NodeDropPosition
```

### 方法 `MindMapEditor.clearDropIndicators`

源码：`src/editor/editor.ts:4949`

清理全部拖放目标样式，防止跨节点移动时残留指示线。

```ts
private clearDropIndicators(): void
```

### 方法 `MindMapEditor.showDropPreview`

源码：`src/editor/editor.ts:4961`

Renders a magnetic placeholder at the exact location represented by the current before, child, or after drop zone.

```ts
private showDropPreview(targetId: string, position: NodeDropPosition): void
```

### 方法 `MindMapEditor.clearDropPreview`

源码：`src/editor/editor.ts:4998`

Removes the temporary magnetic drop placeholder.

```ts
private clearDropPreview(): void
```

### 方法 `MindMapEditor.moveNode`

源码：`src/editor/editor.ts:5010`

在统一编辑事务中移动节点，支持同级前后排序和改变父子关系。

```ts
private moveNode(draggedId: string, targetId: string, position: NodeDropPosition): void
```

### 方法 `MindMapEditor.replaceDocument`

源码：`src/editor/editor.ts:5041`

替换document，并保持模型、界面和持久化状态的一致性。

```ts
private replaceDocument(document: MindMapDocument): void
```

### 方法 `MindMapEditor.ensureExternalEditAllowed`

源码：`src/editor/editor.ts:5053`

允许文章和通读模式应用已确认的外部编辑，但尊重用户显式保存的文档只读锁。

```ts
private ensureExternalEditAllowed(): boolean
```

### 方法 `MindMapEditor.replaceDocumentFromExternalEdit`

源码：`src/editor/editor.ts:5060`

用外部确认的完整文档替换当前状态，并统一接入撤销、保存、渲染和聚焦。

```ts
private replaceDocumentFromExternalEdit(document: MindMapDocument, focusNodeId: string): void
```

### 方法 `MindMapEditor.mutate`

源码：`src/editor/editor.ts:5078`

所有用户可撤销写操作的统一入口。调用前克隆当前文档写入撤销栈，执行修改，规范化和重渲染，再通知视图自动保存；只读状态会在更上层阻止进入该流程。

```ts
private mutate(action: () => void): void
```

### 方法 `MindMapEditor.undo`

源码：`src/editor/editor.ts:5090`

撤销相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private undo(): void
```

### 方法 `MindMapEditor.redo`

源码：`src/editor/editor.ts:5104`

重做相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private redo(): void
```

### 方法 `MindMapEditor.fitToView`

源码：`src/editor/editor.ts:5118`

执行“fit to view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private fitToView(): void
```

### 方法 `MindMapEditor.initializeMindMapViewport`

源码：`src/editor/editor.ts:5137`

从文档视图状态恢复导图缩放与平移。没有已保存状态时，只在导图当前可见且启用自动适应时执行一次自适应； 若首次打开就是文章或通读模式，则把自适应延迟到第一次进入导图模式，避免在隐藏画布上计算出错误缩放。

```ts
private initializeMindMapViewport(delay: number): void
```

### 方法 `MindMapEditor.persistMindMapViewportState`

源码：`src/editor/editor.ts:5163`

把当前导图缩放和平移写回文档视图状态。该方法在离开导图模式和序列化文档前调用， 因此文章、大纲和通读模式重渲染不会把用户视口恢复为默认自适应大小。

```ts
private persistMindMapViewportState(): void
```

### 方法 `MindMapEditor.setZoom`

源码：`src/editor/editor.ts:5178`

更新并应用zoom，并保持模型、界面和持久化状态的一致性。

```ts
private setZoom(value: number): void
```

### 方法 `MindMapEditor.applyZoomInput`

源码：`src/editor/editor.ts:5187`

解析工具栏中的缩放百分比输入，并将有效值应用到画布。

```ts
private applyZoomInput(): void
```

### 方法 `MindMapEditor.beginTwoFingerGesture`

源码：`src/editor/editor.ts:5199`

记录当前双指手势的初始中心点、间距和画布位置。

```ts
private beginTwoFingerGesture(): void
```

### 方法 `MindMapEditor.updateTwoFingerGesture`

源码：`src/editor/editor.ts:5215`

按设置将双指手势解释为缩放或画布平移。

```ts
private updateTwoFingerGesture(): void
```

### 方法 `MindMapEditor.clampZoom`

源码：`src/editor/editor.ts:5252`

执行“clamp zoom”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private clampZoom(value: number): number
```

### 方法 `MindMapEditor.navigateSelection`

源码：`src/editor/editor.ts:5261`

执行“navigate selection”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private navigateSelection(direction: "parent" | "child" | "previous" | "next"): void
```

### 方法 `MindMapEditor.handleKeydown`

源码：`src/editor/editor.ts:5285`

处理keydown，并保持模型、界面和持久化状态的一致性。

```ts
private handleKeydown(event: KeyboardEvent): void
```

## `src/editor/history-manager.ts`

编辑器文档快照的撤销与重做管理器。

### 类 `DocumentHistory`

源码：`src/editor/history-manager.ts:11`

管理有界的文档快照栈，让编辑器本身只负责事务完成后的界面与保存通知。

```ts
export class DocumentHistory
```

### 构造函数 `DocumentHistory.constructor`

源码：`src/editor/history-manager.ts:18`

参见源码中的实现和调用位置。

```ts
constructor(private readonly limitProvider: () => number)
```

### 方法 `DocumentHistory.reset`

源码：`src/editor/history-manager.ts:21`

清空撤销和重做记录。

```ts
reset(): void
```

### 方法 `DocumentHistory.capture`

源码：`src/editor/history-manager.ts:31`

在修改前记录当前文档，并使已有重做分支失效。

```ts
capture(document: MindMapDocument): void
```

### 方法 `DocumentHistory.undo`

源码：`src/editor/history-manager.ts:42`

返回上一份文档，同时把当前文档放入重做栈。

```ts
undo(current: MindMapDocument): MindMapDocument | null
```

### 方法 `DocumentHistory.redo`

源码：`src/editor/history-manager.ts:54`

返回下一份文档，同时把当前文档放回撤销栈。

```ts
redo(current: MindMapDocument): MindMapDocument | null
```

### 方法 `DocumentHistory.trim`

源码：`src/editor/history-manager.ts:63`

按设置限制裁剪最旧的历史快照。

```ts
private trim(): void
```

### 方法 `DocumentHistory.serialize`

源码：`src/editor/history-manager.ts:69`

将文档转换为与运行时对象隔离的快照。

```ts
private serialize(document: MindMapDocument): string
```

### 方法 `DocumentHistory.deserialize`

源码：`src/editor/history-manager.ts:74`

从内部快照恢复文档对象。

```ts
private deserialize(snapshot: string): MindMapDocument
```

## `src/editor/node-actions.ts`

不依赖 DOM 的节点新增、批量删除、折叠和任务状态操作。

### 函数 `appendChild`

源码：`src/editor/node-actions.ts:17`

在父节点末尾插入子节点并自动展开父节点。

```ts
export function appendChild(parent: MindMapNode, child: MindMapNode): void
```

### 函数 `insertSiblingAfter`

源码：`src/editor/node-actions.ts:23`

在目标节点之后插入同级节点。

```ts
export function insertSiblingAfter(root: MindMapNode, targetId: string, sibling: MindMapNode): boolean
```

### 函数 `topLevelSelectedNodeIds`

源码：`src/editor/node-actions.ts:35`

从多选集合中过滤掉根节点、无效节点以及已被另一所选祖先覆盖的后代。

```ts
export function topLevelSelectedNodeIds(root: MindMapNode, selectedIds: Iterable<string>): string[]
```

### 函数 `deleteNodes`

源码：`src/editor/node-actions.ts:46`

删除指定节点集合并返回实际删除数量。

```ts
export function deleteNodes(root: MindMapNode, ids: Iterable<string>): number
```

### 函数 `setAllBranchesCollapsed`

源码：`src/editor/node-actions.ts:61`

展开或折叠节点分支，并可选地将传入节点本身也设为折叠状态。

```ts
export function setAllBranchesCollapsed(root: MindMapNode, collapsed: boolean, includeRoot = false): void
```

### 函数 `nextTaskStatus`

源码：`src/editor/node-actions.ts:68`

按未设置、待办、进行中、完成的顺序循环任务状态。

```ts
export function nextTaskStatus(current: TaskStatus | undefined): TaskStatus | undefined
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

## `src/editor/outline-renderer.ts`

大纲模式的递归 DOM 渲染器。

### 接口 `OutlineRendererOptions`

源码：`src/editor/outline-renderer.ts:22`

大纲渲染所需的编辑器回调边界。

```ts
export interface OutlineRendererOptions
```

### 函数 `renderOutlineMode`

源码：`src/editor/outline-renderer.ts:43`

将同一份节点树渲染为可编辑大纲。

```ts
export function renderOutlineMode(container: HTMLElement, options: OutlineRendererOptions): void
```

### 函数 `renderOutlineContent`

源码：`src/editor/outline-renderer.ts:117`

渲染节点主标题以外的文字、图片、表格、代码和备注内容。

```ts
function renderOutlineContent(container: HTMLElement, node: MindMapNode, depth: number, options: OutlineRendererOptions): void
```

## `src/editor/question-modal.ts`

Structured choice and essay question editor for mind-map nodes.

### 函数 `parseRecognizedQuestion`

源码：`src/editor/question-modal.ts:23`

Parses a JSON-only vision result into the question fields supported by the editor.

```ts
export function parseRecognizedQuestion(value: string, fallback: MindMapQuestion): MindMapQuestion | null
```

### 函数 `parseQuestionEnrichment`

源码：`src/editor/question-modal.ts:62`

Applies an AI lookup result only when it explicitly includes a verifiable original-question source.

```ts
export function parseQuestionEnrichment(value: string, fallback: MindMapQuestion):
```

### 类 `QuestionEditModal`

源码：`src/editor/question-modal.ts:88`

Modal editor for the structured question attached to a node.

```ts
export class QuestionEditModal extends Modal
```

### 构造函数 `QuestionEditModal.constructor`

源码：`src/editor/question-modal.ts:92`

Creates a modal around the selected node's existing question payload.

```ts
constructor( app: App, question: MindMapQuestion | undefined, private readonly nodeId: string, private readonly callbacks: Pick<MindMapEditorCallbacks, "onEnrichQuestion" | "onReadImageSource" | "onRecognizeImage">, private readonly onSubmit: (question: Min…
```

### 方法 `QuestionEditModal.onOpen`

源码：`src/editor/question-modal.ts:104`

Initializes the modal surface and renders the current draft.

```ts
onOpen(): void
```

### 方法 `QuestionEditModal.render`

源码：`src/editor/question-modal.ts:110`

Rebuilds the compact question form after a mode, tag, or field change.

```ts
private render(): void
```

### 方法 `QuestionEditModal.renderBlocks`

源码：`src/editor/question-modal.ts:156`

Renders a text and optional image-source editor for one question field.

```ts
private renderBlocks(label: string, blocks: MindMapContentBlock[], update: (blocks: MindMapContentBlock[]) => void): void
```

### 方法 `QuestionEditModal.recognizeQuestion`

源码：`src/editor/question-modal.ts:176`

Sends the first question image to the configured vision service and applies a JSON result.

```ts
private async recognizeQuestion(showSuccess = true): Promise<boolean>
```

### 方法 `QuestionEditModal.convertAndEnrichQuestion`

源码：`src/editor/question-modal.ts:198`

Converts current text or image into a question, then looks up an original or generates missing analysis.

```ts
private async convertAndEnrichQuestion(): Promise<void>
```

## `src/editor/question-practice-mode.ts`

Full-page sequential practice renderer for maps in a configured question-bank folder.

### 类型 `QuestionFilter`

源码：`src/editor/question-practice-mode.ts:9`

Determines whether practice traverses every question or only automatically collected mistakes.

```ts
type QuestionFilter = "all" | "wrong";
```

### 接口 `QuestionPracticeState`

源码：`src/editor/question-practice-mode.ts:12`

Stateful selection kept by the editor while the question-bank mode is visible.

```ts
export interface QuestionPracticeState
```

### 接口 `QuestionPracticeOptions`

源码：`src/editor/question-practice-mode.ts:22`

Dependencies required to render and persist one question-bank practice session.

```ts
export interface QuestionPracticeOptions
```

### 函数 `createQuestionPracticeState`

源码：`src/editor/question-practice-mode.ts:31`

Creates an empty practice state for an editor instance.

```ts
export function createQuestionPracticeState(): QuestionPracticeState
```

### 函数 `renderQuestionPracticeMode`

源码：`src/editor/question-practice-mode.ts:36`

Renders a full-page, sequential question practice surface.

```ts
export function renderQuestionPracticeMode(container: HTMLElement, options: QuestionPracticeOptions): void
```

### 函数 `selectedAnswerLabels`

源码：`src/editor/question-practice-mode.ts:137`

Extracts option labels from the stored answer to determine whether a question is multiple-choice.

```ts
function selectedAnswerLabels(node: MindMapNode): string[]
```

### 函数 `isQuestionChoiceCorrect`

源码：`src/editor/question-practice-mode.ts:144`

Checks selected option IDs against the labels encoded in the structured answer.

```ts
export function isQuestionChoiceCorrect(node: MindMapNode, selectedIds: readonly string[]): boolean
```

### 函数 `renderBlocks`

源码：`src/editor/question-practice-mode.ts:151`

Renders text and image blocks in their original order.

```ts
function renderBlocks(container: HTMLElement, blocks: readonly MindMapContentBlock[], resolveImage: (source: string) => string | null): void
```

### 函数 `blockText`

源码：`src/editor/question-practice-mode.ts:162`

Joins text blocks into the stored reference answer.

```ts
function blockText(blocks: readonly MindMapContentBlock[]): string
```

### 函数 `isExactQuestionAnswer`

源码：`src/editor/question-practice-mode.ts:167`

Normalizes free-text answers for deterministic long-question comparison.

```ts
export function isExactQuestionAnswer(value: string, reference: string): boolean
```

### 函数 `normalizeAnswer`

源码：`src/editor/question-practice-mode.ts:172`

Normalizes free-text answers before deterministic long-question comparison.

```ts
function normalizeAnswer(value: string): string
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

## `src/editor/selection-format-toolbar.ts`

文章、大纲和画布内联编辑可复用的文字选区悬浮格式栏。

### 接口 `SelectionFormatShortcuts`

源码：`src/editor/selection-format-toolbar.ts:20`

悬浮格式栏支持的快捷键配置。

```ts
export interface SelectionFormatShortcuts
```

### 接口 `SelectionFormatToolbarOptions`

源码：`src/editor/selection-format-toolbar.ts:28`

挂载悬浮格式栏所需的行为。

```ts
export interface SelectionFormatToolbarOptions
```

### 接口 `SelectionFormatToolbarHandle`

源码：`src/editor/selection-format-toolbar.ts:35`

挂载结果，用于判断焦点和清理全局监听。

```ts
export interface SelectionFormatToolbarHandle
```

### 函数 `attachSelectionFormatToolbar`

源码：`src/editor/selection-format-toolbar.ts:42`

为 contenteditable 元素安装随文字选区显示的格式栏。

```ts
export function attachSelectionFormatToolbar(options: SelectionFormatToolbarOptions): SelectionFormatToolbarHandle
```

## `src/file-explorer-filter.ts`

文件浏览器筛选规则的纯函数，供插件运行时和自动测试共同使用。

### 接口 `FileExplorerFilterSettings`

源码：`src/file-explorer-filter.ts:7`

参见源码中的实现和调用位置。

```ts
export interface FileExplorerFilterSettings
```

### 函数 `normalizeHiddenFileExtensions`

源码：`src/file-explorer-filter.ts:16`

Converts a comma, semicolon, or line-separated extension list into normalized suffixes.

```ts
export function normalizeHiddenFileExtensions(value: string): string[]
```

### 函数 `normalizeHiddenFolderPaths`

源码：`src/file-explorer-filter.ts:23`

Converts a comma, semicolon, or line-separated folder list into vault-relative paths.

```ts
export function normalizeHiddenFolderPaths(value: string): string[]
```

### 函数 `shouldHideFileExplorerPath`

源码：`src/file-explorer-filter.ts:30`

Returns whether a File Explorer path should be hidden without altering vault files.

```ts
export function shouldHideFileExplorerPath(path: string, settings: FileExplorerFilterSettings): boolean
```

## `src/import/import-export.ts`

导入导出领域的 XMind 与文章文档转换工具。

### 类型 `XMindTopic`

源码：`src/import/import-export.ts:11`

新版 XMind 导入时需要保留的主题字段与画布链接。

```ts
type XMindTopic =
```

### 类型 `XMindSheet`

源码：`src/import/import-export.ts:20`

新版 XMind 画布及其根主题的最小数据形状。

```ts
type XMindSheet =
```

### 函数 `xmindToDocument`

源码：`src/import/import-export.ts:33`

导入包含 content.json 的新版 XMind 归档，保留嵌套主题、画布链接和未链接画布。

```ts
export function xmindToDocument(source: ArrayBuffer, fallbackTitle = "XMind 导入"): MindMapDocument
```

### 函数 `exportAnchor`

源码：`src/import/import-export.ts:95`

生成跨文件导出时稳定且唯一的标题锚点。

```ts
function exportAnchor(sectionIndex: number, anchor: string): string
```

### 函数 `markdownTitle`

源码：`src/import/import-export.ts:100`

返回带目录编号的 Markdown 标题文本。

```ts
function markdownTitle(label: string, title: string, fallback = "未命名"): string
```

### 函数 `parentNodeKey`

源码：`src/import/import-export.ts:105`

返回跨文件目录项映射键。

```ts
function parentNodeKey(filePath: string | undefined, nodeId: string | undefined): string | null
```

### 函数 `normalizedExportTocMaxDepth`

源码：`src/import/import-export.ts:110`

返回导出目录允许显示的层级。

```ts
function normalizedExportTocMaxDepth(value: number): number
```

### 函数 `markdownHeading`

源码：`src/import/import-export.ts:115`

生成兼容常用 Markdown 渲染器的标题片段。

```ts
function markdownHeading(level: number, title: string): string
```

### 函数 `markdownAnchor`

源码：`src/import/import-export.ts:120`

按常见 Markdown 标题规则生成目录片段。

```ts
function markdownAnchor(title: string): string
```

### 函数 `htmlTocList`

源码：`src/import/import-export.ts:131`

将扁平的层级目录条目转换为兼容 Word 的嵌套列表。

```ts
function htmlTocList(items: Array<
```

### 类型 `TocBranch`

源码：`src/import/import-export.ts:133`

嵌套目录中的单个章节及其下级章节。

```ts
type TocBranch =
```

### 函数 `escapeXml`

源码：`src/import/import-export.ts:149`

转义 OOXML 文本内容。

```ts
function escapeXml(value: string): string
```

### 函数 `collectExportTocItems`

源码：`src/import/import-export.ts:154`

将导出章节收集为父子导图顺序一致的目录项。

```ts
function collectExportTocItems(sections: ReadingSection[], maxTocDepth: number, includeTerminalHeadings = true): Array<
```

### 函数 `readingSectionsToHtml`

源码：`src/import/import-export.ts:195`

Produces one portable article from a map and all recursively collected child maps in the same order used by continuous reading mode.

```ts
export function readingSectionsToHtml(sections: ReadingSection[], tocMaxDepth = 3): string
```

### 函数 `readingSectionsToDocx`

源码：`src/import/import-export.ts:273`

Produces a native Word document with bookmarks and internal TOC hyperlinks.

```ts
export function readingSectionsToDocx(sections: ReadingSection[], tocMaxDepth = 3): Uint8Array
```

### 函数 `readingSectionsToMarkdown`

源码：`src/import/import-export.ts:345`

Produces article-oriented Markdown with a linked table of contents.

```ts
export function readingSectionsToMarkdown(sections: ReadingSection[], tocMaxDepth = 3): string
```

## `src/main.ts`

插件入口与跨文件服务层。

### 类 `MindMapStudioPlugin`

源码：`src/main.ts:106`

MindMapStudioPlugin 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export default class MindMapStudioPlugin extends Plugin
```

### 方法 `MindMapStudioPlugin.onload`

源码：`src/main.ts:119`

执行“onload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async onload(): Promise<void>
```

### 方法 `MindMapStudioPlugin.onunload`

源码：`src/main.ts:271`

执行“onunload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
onunload(): void
```

### 方法 `MindMapStudioPlugin.openGlobalSearch`

源码：`src/main.ts:284`

打开global search，并保持模型、界面和持久化状态的一致性。

```ts
openGlobalSearch(): void
```

### 方法 `MindMapStudioPlugin.openGlobalSearchAfterIndexReady`

源码：`src/main.ts:291`

打开global search after index ready，并保持模型、界面和持久化状态的一致性。

```ts
private async openGlobalSearchAfterIndexReady(): Promise<void>
```

### 方法 `MindMapStudioPlugin.openMapFamilySearch`

源码：`src/main.ts:309`

打开map family search，并保持模型、界面和持久化状态的一致性。

```ts
async openMapFamilySearch(file: TFile, currentDocument?: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.rebuildGlobalSearchIndex`

源码：`src/main.ts:332`

重建global search index，并保持模型、界面和持久化状态的一致性。

```ts
async rebuildGlobalSearchIndex(): Promise<void>
```

### 方法 `MindMapStudioPlugin.getGlobalSearchIndexStatus`

源码：`src/main.ts:342`

读取并返回global search index status，并保持模型、界面和持久化状态的一致性。

```ts
getGlobalSearchIndexStatus()
```

### 方法 `MindMapStudioPlugin.openGlobalSearchResult`

源码：`src/main.ts:351`

打开global search result，并保持模型、界面和持久化状态的一致性。

```ts
private async openGlobalSearchResult(result: MindMapSearchResult): Promise<void>
```

### 方法 `MindMapStudioPlugin.replaceAllInSearchResults`

源码：`src/main.ts:364`

批量替换搜索结果中的节点文字。

```ts
private async replaceAllInSearchResults(results: MindMapSearchResult[], query: string, replacement: string, useRegex: boolean): Promise<number>
```

### 方法 `MindMapStudioPlugin.loadSettings`

源码：`src/main.ts:447`

加载settings，并保持模型、界面和持久化状态的一致性。

```ts
async loadSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.applyLoadedSettings`

源码：`src/main.ts:453`

规范化已加载或导入的插件配置，并应用到当前会话。

```ts
private applyLoadedSettings(loaded: Partial<MindMapStudioSettings> | null): void
```

### 方法 `MindMapStudioPlugin.importSettings`

源码：`src/main.ts:636`

导入插件配置，规范化后立即保存并刷新所有已打开视图。

```ts
async importSettings(settings: unknown): Promise<void>
```

### 方法 `MindMapStudioPlugin.saveSettings`

源码：`src/main.ts:648`

保存settings，并保持模型、界面和持久化状态的一致性。

```ts
async saveSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.askAi`

源码：`src/main.ts:654`

使用指定 AI 配置发送当前 Markdown 上下文。

```ts
async askAi(profileId: string, payload: AiMarkdownPayload, question: string): Promise<AiCompletionResult>
```

### 方法 `MindMapStudioPlugin.enrichQuestion`

源码：`src/main.ts:661`

Converts a transcribed question into a verified original-question lookup result when the selected model supports web retrieval.

```ts
async enrichQuestion(questionText: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.proposeAiEdit`

源码：`src/main.ts:690`

使用指定 AI 配置生成 Markdown 修改提案，但不直接修改导图。

```ts
async proposeAiEdit(profileId: string, payload: AiMarkdownPayload, instruction: string): Promise<AiCompletionResult>
```

### 方法 `MindMapStudioPlugin.recognizeImage`

源码：`src/main.ts:697`

使用当前识图模式处理单张图片；AI 模式可指定接口，本地 OCR 模式不会联网。

```ts
async recognizeImage( image: RecognizableImage, blob: Blob, profileId?: string, instruction?: string, remoteUrl?: string ): Promise<ImageRecognitionItemResult>
```

### 方法 `MindMapStudioPlugin.captureScreenshot`

源码：`src/main.ts:729`

调用桌面系统截图工具，并根据设置决定是否临时最小化 Obsidian。

```ts
async captureScreenshot(): Promise<DesktopCaptureResult>
```

### 方法 `MindMapStudioPlugin.testAiProfile`

源码：`src/main.ts:734`

使用最小请求检测 AI 接口、鉴权和模型是否可用。

```ts
async testAiProfile(profileId: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.installFileExplorerFilter`

源码：`src/main.ts:761`

Installs a lightweight File Explorer observer; it changes visibility only, never vault data.

```ts
private installFileExplorerFilter(): void
```

### 方法 `MindMapStudioPlugin.scheduleFileExplorerFilter`

源码：`src/main.ts:773`

Defers File Explorer filtering so expanding a folder does not cause repeated synchronous DOM scans.

```ts
private scheduleFileExplorerFilter(): void
```

### 方法 `MindMapStudioPlugin.getActiveDisplayMode`

源码：`src/main.ts:789`

返回当前会话正在使用的显示模式。大纲可在会话内同步，但不会成为下次启动默认值。

```ts
getActiveDisplayMode(): DisplayMode
```

### 方法 `MindMapStudioPlugin.isQuestionBankFile`

源码：`src/main.ts:798`

Returns whether a map path belongs to the configured question-bank folder or one of its descendants.

```ts
isQuestionBankFile(file: TFile | null): boolean
```

### 方法 `MindMapStudioPlugin.setGlobalDisplayMode`

源码：`src/main.ts:809`

同步所有已打开视图的显示模式。导图、文章和通读会持久化为下次启动模式； 大纲仅记录在当前会话，避免重新打开插件时默认进入大纲。

```ts
async setGlobalDisplayMode(mode: DisplayMode): Promise<void>
```

### 方法 `MindMapStudioPlugin.renameReadingLocationPathInSettings`

源码：`src/main.ts:824`

将文件重命名同步到所有语义阅读位置链，避免改名后恢复记录失联。

```ts
private async renameReadingLocationPathInSettings(oldPath: string, newPath: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.resetAllSettings`

源码：`src/main.ts:845`

执行“reset all settings”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async resetAllSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.refreshOpenViews`

源码：`src/main.ts:855`

刷新open views，并保持模型、界面和持久化状态的一致性。

```ts
refreshOpenViews(): void
```

### 方法 `MindMapStudioPlugin.createConfiguredDocument`

源码：`src/main.ts:867`

创建configured document，并保持模型、界面和持久化状态的一致性。

```ts
createConfiguredDocument(title: string): MindMapDocument
```

### 方法 `MindMapStudioPlugin.resolveMindMapFile`

源码：`src/main.ts:883`

解析并确定mind map file，并保持模型、界面和持久化状态的一致性。

```ts
private resolveMindMapFile(path: string, sourcePath = ""): TFile | null
```

### 方法 `MindMapStudioPlugin.readMindMapDocument`

源码：`src/main.ts:898`

执行“read mind map document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async readMindMapDocument(file: TFile): Promise<MindMapDocument>
```

### 方法 `MindMapStudioPlugin.findArticleNodeDepth`

源码：`src/main.ts:910`

按自动或手动文章层级查找目标节点的绝对深度，而不是直接使用物理树深度。

```ts
private findArticleNodeDepth(root: MindMapNode, nodeId: string, baseDepth = 0): number | null
```

### 方法 `MindMapStudioPlugin.computeArticleBaseDepth`

源码：`src/main.ts:922`

执行“compute article base depth”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async computeArticleBaseDepth(file: TFile, document: MindMapDocument, visited = new Set<string>()): Promise<number>
```

### 方法 `MindMapStudioPlugin.buildArticleContext`

源码：`src/main.ts:950`

沿子导图 navigation.parentPath 逐级回溯父文件，计算当前子导图在整篇文章中的基础标题深度、完整面包屑和顶层目录数据，并防止循环引用。

```ts
async buildArticleContext(file: TFile, document: MindMapDocument): Promise<
```

### 类型 `Item`

源码：`src/main.ts:971`

Item 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
type Item =
```

### 方法 `MindMapStudioPlugin.buildDescendantReadingSections`

源码：`src/main.ts:1074`

Collects the current map and every reachable child map without walking up to its parent. This is the export counterpart of continuous reading.

```ts
async buildDescendantReadingSections(file: TFile, document: MindMapDocument): Promise<ReadingSection[]>
```

### 方法 `MindMapStudioPlugin.getAvailablePath`

源码：`src/main.ts:1113`

读取并返回available path，并保持模型、界面和持久化状态的一致性。

```ts
async getAvailablePath(preferredPath: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.createMindMap`

源码：`src/main.ts:1130`

创建mind map，并保持模型、界面和持久化状态的一致性。

```ts
async createMindMap(options:
```

### 方法 `MindMapStudioPlugin.syncMindMapTitleToFilename`

源码：`src/main.ts:1161`

Synchronizes a saved map's filename with its root node title and preserves parent/child navigation references when the map is linked as a submap.

```ts
async syncMindMapTitleToFilename(file: TFile, document: MindMapDocument): Promise<TFile>
```

### 方法 `MindMapStudioPlugin.updateParentSubmapReference`

源码：`src/main.ts:1182`

Updates the parent node that links to a renamed child map.

```ts
private async updateParentSubmapReference(file: TFile, oldPath: string, parentPath: string | undefined, parentNodeId: string | undefined): Promise<void>
```

### 方法 `MindMapStudioPlugin.updateChildSubmapNavigation`

源码：`src/main.ts:1197`

Updates navigation metadata in child maps after their parent map was renamed.

```ts
private async updateChildSubmapNavigation(file: TFile, oldPath: string, document: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.openAsMindMap`

源码：`src/main.ts:1218`

打开as mind map，并保持模型、界面和持久化状态的一致性。

```ts
async openAsMindMap(file: TFile, preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<WorkspaceLeaf>
```

### 方法 `MindMapStudioPlugin.savePastedImage`

源码：`src/main.ts:1238`

保存pasted image，并保持模型、界面和持久化状态的一致性。

```ts
async savePastedImage(blob: Blob, suggestedName: string, sourceFile: TFile | null): Promise<string>
```

### 方法 `MindMapStudioPlugin.readImageSource`

源码：`src/main.ts:1262`

执行“read image source”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async readImageSource(source: string, sourceFile: TFile | null): Promise<
```

### 方法 `MindMapStudioPlugin.getImageHostChoices`

源码：`src/main.ts:1293`

读取并返回image host choices，并保持模型、界面和持久化状态的一致性。

```ts
getImageHostChoices(): ImageHostChoice[]
```

### 方法 `MindMapStudioPlugin.getImageHostPriorityIds`

源码：`src/main.ts:1301`

Returns enabled image host IDs ordered by render failover priority.

```ts
getImageHostPriorityIds(): string[]
```

### 方法 `MindMapStudioPlugin.getDefaultUploadHostIds`

源码：`src/main.ts:1312`

读取并返回default upload host ids，并保持模型、界面和持久化状态的一致性。

```ts
getDefaultUploadHostIds(): string[]
```

### 方法 `MindMapStudioPlugin.uploadImageToHosts`

源码：`src/main.ts:1326`

把同一张图片上传到多个已配置图床，分别收集成功与失败结果。只有所有选中图床成功且文档保存完成后，调用方才允许删除本地文件。

```ts
async uploadImageToHosts(blob: Blob, suggestedName: string, hostIds: string[]): Promise<ImageHostUploadBatch>
```

### 方法 `MindMapStudioPlugin.testImageHost`

源码：`src/main.ts:1358`

执行“test image host”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async testImageHost(hostId: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.scheduleAutoUpload`

源码：`src/main.ts:1397`

安排延迟执行auto upload，并保持模型、界面和持久化状态的一致性。

```ts
scheduleAutoUpload(file: TFile | null, nodeId: string, blockId: string, localPath: string, suggestedName: string): boolean
```

### 方法 `MindMapStudioPlugin.deleteRecognizedImageLocalAsset`

源码：`src/main.ts:1409`

删除已被识图文字替换的本地图片；共享资源会保留。

```ts
async deleteRecognizedImageLocalAsset(mindMapPath: string, localPath: string, blockId: string): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.resumePendingAutoUploads`

源码：`src/main.ts:1415`

根据本地图片文件时间恢复延迟上传；到期图片在重新打开导图后立即上传。

```ts
async resumePendingAutoUploads(file: TFile, document: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.queueAutoUpload`

源码：`src/main.ts:1434`

安排一次可去重的本地图片自动上传。

```ts
private queueAutoUpload( mindMapPath: string, nodeId: string, blockId: string, localPath: string, suggestedName: string, hostIds: string[], delayMs: number ): void
```

### 方法 `MindMapStudioPlugin.runAutoUploadTask`

源码：`src/main.ts:1464`

执行延迟自动上传任务。它确认节点和图片块仍存在、读取本地资源、上传到默认图床、更新远程镜像列表并保存；任一图床失败时保留本地文件。

```ts
private async runAutoUploadTask( mindMapPath: string, nodeId: string, blockId: string, localPath: string, suggestedName: string, hostIds: string[] ): Promise<void>
```

### 方法 `MindMapStudioPlugin.uploadImageToHostConfig`

源码：`src/main.ts:1535`

按单个图床配置上传图片，并从 JSON 或文本响应中解析最终图片地址。 @throws 配置、请求体或响应格式不合法，以及网络请求失败时抛出错误。

```ts
private async uploadImageToHostConfig(host: ImageHostConfig, blob: Blob, suggestedName: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.flushOpenView`

源码：`src/main.ts:1576`

执行“flush open view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async flushOpenView(path: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.refreshOpenMindMap`

源码：`src/main.ts:1588`

刷新open mind map，并保持模型、界面和持久化状态的一致性。

```ts
private async refreshOpenMindMap(file: TFile, document: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.deleteLocalAssetIfSafe`

源码：`src/main.ts:1604`

在删除本地图片前进行最终安全检查：远程源必须存在、当前文档必须已保存、资源路径必须是仓库内文件且没有其他节点继续引用。

```ts
private async deleteLocalAssetIfSafe(localPath: string, currentMindMapPath: string, blockId: string): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.mimeFromFilename`

源码：`src/main.ts:1639`

根据资源文件名推断图片 MIME，未知扩展名按二进制流处理。

```ts
private mimeFromFilename(filename: string): string
```

### 方法 `MindMapStudioPlugin.createSubmapFile`

源码：`src/main.ts:1651`

在父导图资源目录下创建子导图文件，写入 parentPath、parentNodeId 和 parentTitle，并把生成路径回写到父节点，实现可靠的双向导航。

```ts
async createSubmapFile(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap>
```

### 方法 `MindMapStudioPlugin.buildSubmapDocument`

源码：`src/main.ts:1664`

创建子导图文档并统一写入双向导航元数据。

```ts
private buildSubmapDocument(parentFile: TFile, node: MindMapNode, includeNodeContent: boolean): MindMapDocument
```

### 方法 `MindMapStudioPlugin.persistSubmapDocument`

源码：`src/main.ts:1701`

把子导图写入父导图专属资源目录，避免多个父导图的同名子图发生路径冲突。

```ts
private async persistSubmapDocument(parentFile: TFile, node: MindMapNode, document: MindMapDocument): Promise<MindMapSubmap>
```

### 方法 `MindMapStudioPlugin.deleteSubmapFile`

源码：`src/main.ts:1720`

Moves a linked child mind-map file to the system trash.

```ts
async deleteSubmapFile(parentFile: TFile, submap: MindMapSubmap): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.openMindMapPath`

源码：`src/main.ts:1735`

打开mind map path，并保持模型、界面和持久化状态的一致性。

```ts
async openMindMapPath(path: string, sourcePath = "", preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.ensureFolderPath`

源码：`src/main.ts:1752`

执行“ensure folder path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async ensureFolderPath(folder: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.isMindMapFile`

源码：`src/main.ts:1769`

判断mind map file，并保持模型、界面和持久化状态的一致性。

```ts
isMindMapFile(file: TFile): boolean
```

### 方法 `MindMapStudioPlugin.convertMarkdownFile`

源码：`src/main.ts:1778`

转换markdown file，并保持模型、界面和持久化状态的一致性。

```ts
private async convertMarkdownFile(file: TFile): Promise<void>
```

### 方法 `MindMapStudioPlugin.resolveFolder`

源码：`src/main.ts:1795`

解析并确定folder，并保持模型、界面和持久化状态的一致性。

```ts
private async resolveFolder(explicitFolder: string | undefined, activeFile: TFile | null): Promise<string>
```

### 方法 `MindMapStudioPlugin.buildNewTitle`

源码：`src/main.ts:1809`

构建new title，并保持模型、界面和持久化状态的一致性。

```ts
private buildNewTitle(): string
```

### 方法 `MindMapStudioPlugin.sanitizeFilename`

源码：`src/main.ts:1819`

执行“sanitize filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
sanitizeFilename(value: string): string
```

### 方法 `MindMapStudioPlugin.getSourceTitle`

源码：`src/main.ts:1829`

读取并返回source title，并保持模型、界面和持久化状态的一致性。

```ts
private getSourceTitle(context: MarkdownPostProcessorContext): string
```

### 方法 `MindMapStudioPlugin.processMindMapEmbeds`

源码：`src/main.ts:1841`

注册 Markdown 代码块静态渲染，并在阅读模式中解析嵌入的思维导图源。静态预览不会修改原文件。

```ts
private async processMindMapEmbeds(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<void>
```

### 方法 `MindMapStudioPlugin.extractToSubmap`

源码：`src/main.ts:1870`

将指定节点及其后代提取为独立子导图文件。

```ts
async extractToSubmap(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap>
```

### 方法 `MindMapStudioPlugin.mergeFromSubmap`

源码：`src/main.ts:1880`

将当前子导图合并回其父导图。

```ts
async mergeFromSubmap(submapFile: TFile): Promise<void>
```

## `src/render/collision-layout.ts`

导图节点包围盒碰撞检测与子树纵向避让。

### 接口 `CollisionNode`

源码：`src/render/collision-layout.ts:7`

参见源码中的实现和调用位置。

```ts
export interface CollisionNode
```

### 函数 `resolveLayoutCollisions`

源码：`src/render/collision-layout.ts:23`

检测相交的节点矩形，并把其中一棵子树整体向下移动。

```ts
export function resolveLayoutCollisions<T extends CollisionNode>(nodes: T[], verticalGap: number): number
```

## `src/render/layout.ts`

渲染领域的布局计算与 SVG 导出模块。

### 接口 `NodePosition`

源码：`src/render/layout.ts:14`

NodePosition 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface NodePosition
```

### 接口 `LayoutResult`

源码：`src/render/layout.ts:28`

LayoutResult 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface LayoutResult
```

### 函数 `visibleChildren`

源码：`src/render/layout.ts:48`

执行“visible children”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function visibleChildren(node: MindMapNode): MindMapNode[]
```

### 函数 `estimatedTextLines`

源码：`src/render/layout.ts:60`

执行“estimated text lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function estimatedTextLines(text: string, width: number, fontSize: number): number
```

### 函数 `nodeDimensions`

源码：`src/render/layout.ts:75`

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

源码：`src/render/layout.ts:267`

构建branch color map，并保持模型、界面和持久化状态的一致性。

```ts
export function buildBranchColorMap(root: MindMapNode, colors: string[] | undefined): Map<string, string>
```

### 函数 `edgeWidthForDepth`

源码：`src/render/layout.ts:287`

根据连接线模式计算指定层级的线宽。统一模式始终返回起始宽度；渐细模式会按当前实际最大深度插值，并保证最深层达到最小宽度。

```ts
export function edgeWidthForDepth(appearance: MindMapAppearance, depth: number, maxDepth = 5): number
```

### 函数 `edgePath`

源码：`src/render/layout.ts:307`

执行“edge path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function edgePath(parent: NodePosition, child: NodePosition, style: EdgeStyle = "curved"): string
```

### 函数 `roundedElbowEdgePath`

源码：`src/render/layout.ts:324`

Builds an orthogonal branch with rounded corners for the rounded-branch visual style without relying on external assets.

```ts
export function roundedElbowEdgePath(parent: NodePosition, child: NodePosition): string
```

### 函数 `escapeXml`

源码：`src/render/layout.ts:349`

转义xml，并保持模型、界面和持久化状态的一致性。

```ts
export function escapeXml(value: string): string
```

### 函数 `validColor`

源码：`src/render/layout.ts:363`

执行“valid color”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function validColor(value: string | undefined, fallback: string): string
```

### 函数 `svgRadius`

源码：`src/render/layout.ts:373`

执行“svg radius”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgRadius(shape: NodeShape | undefined): number
```

### 函数 `taskGlyph`

源码：`src/render/layout.ts:385`

执行“task glyph”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function taskGlyph(node: MindMapNode): string
```

### 函数 `truncateRuns`

源码：`src/render/layout.ts:399`

执行“truncate runs”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function truncateRuns(runs: MindMapTextRun[], maxLength: number): MindMapTextRun[]
```

### 函数 `richTextTspans`

源码：`src/render/layout.ts:428`

执行“rich text tspans”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function richTextTspans(runs: MindMapTextRun[] | undefined, fallbackText: string, prefix: string, foreground: string, maxChars = 160): string
```

### 函数 `svgWrappedLines`

源码：`src/render/layout.ts:455`

执行“svg wrapped lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgWrappedLines(text: string, width: number, fontSize: number): string[]
```

### 函数 `svgFontFamily`

源码：`src/render/layout.ts:473`

执行“svg font family”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgFontFamily(mode: FontFamilyMode | undefined, customFont: string | undefined): string
```

### 函数 `documentToSvg`

源码：`src/render/layout.ts:490`

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

源码：`src/search/global-search.ts:196`

合并hierarchy，并保持模型、界面和持久化状态的一致性。

```ts
function mergeHierarchy(prefix: string[], suffix: string[]): string[]
```

### 函数 `resolveHierarchicalEntries`

源码：`src/search/global-search.ts:210`

Resolve parent/child map relations into paths such as 古诗 › 唐诗 › 李白.

```ts
export function resolveHierarchicalEntries(files: Record<string, IndexedMindMapFile>): MindMapSearchEntry[]
```

### 函数 `resultSnippet`

源码：`src/search/global-search.ts:278`

执行“result snippet”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function resultSnippet(entry: MindMapSearchEntry, query: string, useRegex = false):
```

### 函数 `searchEntries`

源码：`src/search/global-search.ts:309`

执行“search entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function searchEntries(entries: MindMapSearchEntry[], query: string, limit = 100, useRegex = false): MindMapSearchResult[]
```

### 函数 `collectIndexedFamilyPaths`

源码：`src/search/global-search.ts:355`

从当前文件向上寻找最顶层父导图，再向下递归收集全部后代子导图，形成 Ctrl/Cmd+Shift+F 使用的“当前导图族”搜索范围。

```ts
export function collectIndexedFamilyPaths( files: Record<string,
```

### 类 `MindMapSearchIndex`

源码：`src/search/global-search.ts:382`

MindMapSearchIndex 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapSearchIndex
```

### 构造函数 `MindMapSearchIndex.constructor`

源码：`src/search/global-search.ts:397`

创建 MindMapSearchIndex 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( private readonly app: App, private readonly indexPath: string, private readonly extension = "mindmap" )
```

### 方法 `MindMapSearchIndex.initialize`

源码：`src/search/global-search.ts:406`

执行“initialize”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async initialize(): Promise<void>
```

### 方法 `MindMapSearchIndex.destroy`

源码：`src/search/global-search.ts:414`

执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
destroy(): void
```

### 方法 `MindMapSearchIndex.getStatus`

源码：`src/search/global-search.ts:425`

读取并返回status，并保持模型、界面和持久化状态的一致性。

```ts
getStatus(): MindMapSearchIndexStatus
```

### 方法 `MindMapSearchIndex.allEntries`

源码：`src/search/global-search.ts:437`

执行“all entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
allEntries(filePaths?: ReadonlySet<string>): MindMapSearchEntry[]
```

### 方法 `MindMapSearchIndex.getScopedStatus`

源码：`src/search/global-search.ts:450`

读取并返回scoped status，并保持模型、界面和持久化状态的一致性。

```ts
getScopedStatus(filePaths: ReadonlySet<string>):
```

### 方法 `MindMapSearchIndex.search`

源码：`src/search/global-search.ts:471`

执行“search”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
search(query: string, limit = 100, filePaths?: ReadonlySet<string>, useRegex = false): MindMapSearchResult[]
```

### 方法 `MindMapSearchIndex.refreshFamily`

源码：`src/search/global-search.ts:481`

Refresh a parent map and every recursively linked child map, then return the exact set of files that belongs to that map family. This is deliberately on-demand so an existing child map is searchable without recreating it or manually rebuilding the whole-vault index.

```ts
async refreshFamily(rootPath: string, currentDocument?: MindMapDocument): Promise<Set<string>>
```

### 方法 `MindMapSearchIndex.queueFile`

源码：`src/search/global-search.ts:563`

执行“queue file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
queueFile(file: TFile, delay = 500): void
```

### 方法 `MindMapSearchIndex.removeFile`

源码：`src/search/global-search.ts:579`

删除file，并保持模型、界面和持久化状态的一致性。

```ts
removeFile(path: string): void
```

### 方法 `MindMapSearchIndex.renameFile`

源码：`src/search/global-search.ts:593`

执行“rename file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
renameFile(file: TFile, oldPath: string): void
```

### 方法 `MindMapSearchIndex.rebuildAll`

源码：`src/search/global-search.ts:601`

重建all，并保持模型、界面和持久化状态的一致性。

```ts
async rebuildAll(): Promise<void>
```

### 方法 `MindMapSearchIndex.rebuildChangedFiles`

源码：`src/search/global-search.ts:610`

重建changed files，并保持模型、界面和持久化状态的一致性。

```ts
private async rebuildChangedFiles(): Promise<void>
```

### 方法 `MindMapSearchIndex.performRebuild`

源码：`src/search/global-search.ts:622`

执行全量或增量索引重建。它比较文件修改时间，仅解析变化的 .mindmap 文件，删除失效记录，随后重新解析跨文件层级并安排持久化。

```ts
private async performRebuild(force: boolean): Promise<void>
```

### 方法 `MindMapSearchIndex.indexFile`

源码：`src/search/global-search.ts:649`

读取并解析单个 .mindmap 文件，生成节点级搜索条目和子导图引用。读取或解析失败时移除该文件的旧索引，防止返回过期结果。

```ts
private async indexFile(file: TFile): Promise<void>
```

### 方法 `MindMapSearchIndex.walkNodes`

源码：`src/search/global-search.ts:674`

递归遍历nodes，并保持模型、界面和持久化状态的一致性。

```ts
private *walkNodes(root: MindMapNode): Generator<MindMapNode>
```

### 方法 `MindMapSearchIndex.resolveSubmapFile`

源码：`src/search/global-search.ts:691`

解析并确定submap file，并保持模型、界面和持久化状态的一致性。

```ts
private resolveSubmapFile(rawPath: string | undefined, sourcePath: string): TFile | null
```

### 方法 `MindMapSearchIndex.load`

源码：`src/search/global-search.ts:705`

加载相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private async load(): Promise<void>
```

### 方法 `MindMapSearchIndex.scheduleSave`

源码：`src/search/global-search.ts:733`

安排延迟执行save，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleSave(): void
```

### 方法 `MindMapSearchIndex.saveNow`

源码：`src/search/global-search.ts:744`

保存now，并保持模型、界面和持久化状态的一致性。

```ts
private async saveNow(): Promise<void>
```

### 函数 `appendHighlightedText`

源码：`src/search/global-search.ts:760`

执行“append highlighted text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function appendHighlightedText(container: HTMLElement, text: string, query: string, useRegex = false): void
```

### 类 `GlobalMindMapSearchModal`

源码：`src/search/global-search.ts:797`

GlobalMindMapSearchModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class GlobalMindMapSearchModal extends Modal
```

### 构造函数 `GlobalMindMapSearchModal.constructor`

源码：`src/search/global-search.ts:819`

创建 GlobalMindMapSearchModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, private readonly index: MindMapSearchIndex, private readonly maxResults: number, private readonly onOpenResult: (result: MindMapSearchResult) => void | Promise<void>, private readonly onRebuild: () => Promise<void>, private readonly o…
```

### 方法 `GlobalMindMapSearchModal.onOpen`

源码：`src/search/global-search.ts:836`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `GlobalMindMapSearchModal.onClose`

源码：`src/search/global-search.ts:934`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 方法 `GlobalMindMapSearchModal.renderResults`

源码：`src/search/global-search.ts:943`

渲染results，并保持模型、界面和持久化状态的一致性。

```ts
private renderResults(query: string): void
```

### 方法 `GlobalMindMapSearchModal.renderResultList`

源码：`src/search/global-search.ts:973`

从当前 renderedResults 列表重新渲染结果，不重新查询索引。

```ts
private renderResultList(): void
```

### 方法 `GlobalMindMapSearchModal.renderResultItems`

源码：`src/search/global-search.ts:988`

渲染结果列表项。

```ts
private renderResultItems(query: string): void
```

### 方法 `GlobalMindMapSearchModal.moveActive`

源码：`src/search/global-search.ts:1050`

执行“move active”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private moveActive(delta: number): void
```

### 方法 `GlobalMindMapSearchModal.setActive`

源码：`src/search/global-search.ts:1061`

更新并应用active，并保持模型、界面和持久化状态的一致性。

```ts
private setActive(index: number): void
```

### 方法 `GlobalMindMapSearchModal.openResult`

源码：`src/search/global-search.ts:1073`

打开result，并保持模型、界面和持久化状态的一致性。

```ts
private async openResult(result: MindMapSearchResult): Promise<void>
```

## `src/settings.ts`

插件设置模型和设置页。

### 类型 `ImageHostBodyMode`

源码：`src/settings.ts:52`

ImageHostBodyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ImageHostBodyMode = "multipart" | "raw";
```

### 类型 `ImageHostMethod`

源码：`src/settings.ts:56`

ImageHostMethod 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ImageHostMethod = "POST" | "PUT";
```

### 类型 `ArticleLeafBulletStyle`

源码：`src/settings.ts:59`

Visual shape used for unnumbered terminal article bullets.

```ts
export type ArticleLeafBulletStyle = "solid" | "hollow" | "square" | "dash";
```

### 接口 `ImageHostConfig`

源码：`src/settings.ts:64`

ImageHostConfig 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostConfig
```

### 接口 `ImageHostChoice`

源码：`src/settings.ts:81`

ImageHostChoice 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostChoice
```

### 接口 `ImageHostUploadSuccess`

源码：`src/settings.ts:89`

ImageHostUploadSuccess 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadSuccess
```

### 接口 `ImageHostUploadFailure`

源码：`src/settings.ts:98`

ImageHostUploadFailure 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadFailure
```

### 接口 `ImageHostUploadBatch`

源码：`src/settings.ts:107`

ImageHostUploadBatch 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadBatch
```

### 函数 `createImageHostConfig`

源码：`src/settings.ts:118`

创建image host config，并保持模型、界面和持久化状态的一致性。

```ts
export function createImageHostConfig(index = 1): ImageHostConfig
```

### 类型 `ImageRecognitionAutoConfirmDelaySeconds`

源码：`src/settings.ts:136`

MindMapStudioSettings 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export type ImageRecognitionAutoConfirmDelaySeconds = 0 | 5 | 10 | 15 | null;
```

### 接口 `MindMapStudioSettings`

源码：`src/settings.ts:139`

MindMap Studio 的持久化设置集合。

```ts
export interface MindMapStudioSettings
```

### 函数 `normalizeReturnToTopVisibility`

源码：`src/settings.ts:355`

Normalizes the article return-to-top threshold from a number or percentage string.

```ts
export function normalizeReturnToTopVisibility(value: unknown): number
```

### 函数 `settingsToAppearance`

源码：`src/settings.ts:371`

更新并应用tings to appearance，并保持模型、界面和持久化状态的一致性。

```ts
export function settingsToAppearance(settings: MindMapStudioSettings): MindMapAppearance
```

### 函数 `applyThemePresetToSettings`

源码：`src/settings.ts:412`

应用theme preset to settings，并保持模型、界面和持久化状态的一致性。

```ts
export function applyThemePresetToSettings(settings: MindMapStudioSettings, presetId: MindMapThemePresetId): void
```

### 类 `MindMapStudioSettingTab`

源码：`src/settings.ts:443`

MindMapStudioSettingTab 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapStudioSettingTab extends PluginSettingTab
```

### 构造函数 `MindMapStudioSettingTab.constructor`

源码：`src/settings.ts:456`

创建 MindMapStudioSettingTab 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, plugin: MindMapStudioPlugin)
```

### 方法 `MindMapStudioSettingTab.display`

源码：`src/settings.ts:465`

构建完整插件设置页，包括主题、显示模式、节点默认值、搜索、图片、图床容灾和恢复初始设置。所有控件写入后立即保存并刷新打开视图。

```ts
display(): void
```

### 方法 `MindMapStudioSettingTab.organizeSettingsSections`

源码：`src/settings.ts:1932`

将一级设置分区折叠显示，并按顶部搜索词过滤匹配分区。

```ts
private organizeSettingsSections(): void
```

### 方法 `MindMapStudioSettingTab.addOptionalColorSetting`

源码：`src/settings.ts:1986`

添加optional color setting，并保持模型、界面和持久化状态的一致性。

```ts
private addOptionalColorSetting( container: HTMLElement, name: string, description: string, getValue: () => string, setValue: (value: string) => Promise<void>, fallback: string, allowReset = true ): void
```

### 方法 `MindMapStudioSettingTab.saveAndRefresh`

源码：`src/settings.ts:2018`

保存and refresh，并保持模型、界面和持久化状态的一致性。

```ts
private async saveAndRefresh(): Promise<void>
```

### 方法 `MindMapStudioSettingTab.captureScreenshotShortcut`

源码：`src/settings.ts:2024`

记录截图快捷键；修饰键必须与一个非修饰主键同时按下。

```ts
private async captureScreenshotShortcut(event: KeyboardEvent, text: TextComponent): Promise<void>
```

### 方法 `MindMapStudioSettingTab.shortcutFromKeyboardEvent`

源码：`src/settings.ts:2042`

将实际键盘事件转换为编辑器可识别的 1 至 3 键快捷键文本。

```ts
private shortcutFromKeyboardEvent(event: KeyboardEvent): string | null
```

### 方法 `MindMapStudioSettingTab.exportSettings`

源码：`src/settings.ts:2058`

导出当前插件设置；桌面端优先显示系统保存位置选择器。

```ts
private async exportSettings(): Promise<void>
```

### 方法 `MindMapStudioSettingTab.openSettingsImportPicker`

源码：`src/settings.ts:2078`

打开 JSON 配置文件选择器，并在成功导入后重新绘制设置页。

```ts
private openSettingsImportPicker(): void
```

### 方法 `MindMapStudioSettingTab.importSettingsFile`

源码：`src/settings.ts:2087`

读取并导入用户选中的配置 JSON 文件。

```ts
private async importSettingsFile(file: File | undefined): Promise<void>
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

## `src/utils/desktop-capture.ts`

调用桌面系统截图工具并从 Electron 剪贴板读取 PNG 图片。

### 接口 `DesktopCaptureResult`

源码：`src/utils/desktop-capture.ts:7`

参见源码中的实现和调用位置。

```ts
export interface DesktopCaptureResult
```

### 接口 `ElectronCaptureRuntime`

源码：`src/utils/desktop-capture.ts:13`

Electron 运行时中截图功能使用的最小宿主接口。

```ts
interface ElectronCaptureRuntime
```

### 接口 `ElectronWindowRuntime`

源码：`src/utils/desktop-capture.ts:30`

Electron 主窗口控制所需的最小运行时接口。

```ts
interface ElectronWindowRuntime
```

### 接口 `ElectronWindowHandle`

源码：`src/utils/desktop-capture.ts:36`

截图前临时最小化、截图后恢复所需的主窗口接口。

```ts
interface ElectronWindowHandle
```

### 接口 `NodeCaptureRuntime`

源码：`src/utils/desktop-capture.ts:46`

桌面截图命令使用的最小 Node.js 运行时接口。

```ts
interface NodeCaptureRuntime
```

### 函数 `screenshotCommandCandidates`

源码：`src/utils/desktop-capture.ts:62`

返回当前桌面平台对应的截图命令候选，按优先级依次尝试。

```ts
export function screenshotCommandCandidates(platform: string): Array<
```

### 函数 `copyBytesToArrayBuffer`

源码：`src/utils/desktop-capture.ts:76`

将任意 Uint8Array 复制为 Blob 接受的普通 ArrayBuffer，兼容 SharedArrayBuffer 类型声明。

```ts
export function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer
```

### 函数 `pngFingerprint`

源码：`src/utils/desktop-capture.ts:83`

将剪贴板 PNG 二进制转换为稳定摘要，用于检测截图是否产生了新图片。

```ts
export function pngFingerprint(bytes: Uint8Array): string
```

### 函数 `getElectronRuntime`

源码：`src/utils/desktop-capture.ts:95`

从 Obsidian 桌面端窗口获取 Electron API；移动端或受限环境返回 null。

```ts
function getElectronRuntime(): ElectronCaptureRuntime | null
```

### 函数 `getCurrentObsidianWindow`

源码：`src/utils/desktop-capture.ts:116`

从 Electron 的新旧渲染器接口中取得当前 Obsidian 主窗口。

```ts
function getCurrentObsidianWindow(runtime: ElectronCaptureRuntime): ElectronWindowHandle | null
```

### 函数 `waitForWindowMinimized`

源码：`src/utils/desktop-capture.ts:124`

等待窗口完成最小化，避免截图工具启动时仍捕获到 Obsidian 窗口。

```ts
async function waitForWindowMinimized(windowHandle: ElectronWindowHandle): Promise<void>
```

### 函数 `getNodeCaptureRuntime`

源码：`src/utils/desktop-capture.ts:132`

从 Obsidian 桌面端按需获取 Node.js API，避免移动端加载插件时静态引用 Node 模块。

```ts
function getNodeCaptureRuntime(): NodeCaptureRuntime | null
```

### 函数 `waitForClipboardImage`

源码：`src/utils/desktop-capture.ts:146`

等待系统截图工具把一张新图片写入剪贴板。

```ts
async function waitForClipboardImage(runtime: ElectronCaptureRuntime, previousFingerprint: string, timeoutMs = 120_000): Promise<Uint8Array>
```

### 函数 `executeCaptureCommand`

源码：`src/utils/desktop-capture.ts:158`

使用 execFile 执行一个截图候选命令。

```ts
function executeCaptureCommand(runtime: NodeCaptureRuntime, command: string, args: string[]): Promise<void>
```

### 函数 `runScreenshotCommand`

源码：`src/utils/desktop-capture.ts:168`

执行系统截图命令；交互式命令失败时继续尝试下一个候选。

```ts
async function runScreenshotCommand( runtime: NodeCaptureRuntime, candidates: Array<
```

### 函数 `captureDesktopScreenshot`

源码：`src/utils/desktop-capture.ts:190`

启动交互式区域截图，可选先最小化 Obsidian，完成后恢复窗口并返回剪贴板 PNG。

```ts
export async function captureDesktopScreenshot(hideObsidian: boolean): Promise<DesktopCaptureResult>
```

## `src/utils/desktop-export.ts`

桌面端导出文件保存位置选择与默认桌面写入工具。

### 类型 `DesktopExportExtension`

源码：`src/utils/desktop-export.ts:7`

参见源码中的实现和调用位置。

```ts
export type DesktopExportExtension = "svg" | "md" | "json" | "html" | "doc" | "docx" | "pdf";
```

### 接口 `ElectronPdfWindow`

源码：`src/utils/desktop-export.ts:10`

Electron 离屏 PDF 渲染窗口的最小接口。

```ts
interface ElectronPdfWindow
```

### 接口 `ElectronPdfWindowConstructor`

源码：`src/utils/desktop-export.ts:20`

Electron 离屏 PDF 渲染窗口构造器。

```ts
interface ElectronPdfWindowConstructor
```

### 接口 `ElectronSaveRuntime`

源码：`src/utils/desktop-export.ts:25`

Electron 保存对话框运行时的最小接口。

```ts
interface ElectronSaveRuntime
```

### 接口 `NodeExportRuntime`

源码：`src/utils/desktop-export.ts:37`

Node.js 文件导出运行时的最小接口。

```ts
interface NodeExportRuntime
```

### 接口 `DesktopExportResult`

源码：`src/utils/desktop-export.ts:50`

桌面导出保存结果。

```ts
export interface DesktopExportResult
```

### 函数 `sanitizeExportFilename`

源码：`src/utils/desktop-export.ts:56`

清理文件名中跨平台不安全字符。

```ts
export function sanitizeExportFilename(name: string, fallback = "思维导图"): string
```

### 函数 `getElectronSaveRuntime`

源码：`src/utils/desktop-export.ts:61`

从 Obsidian 桌面端获取保存对话框；不可用时返回 null。

```ts
function getElectronSaveRuntime(): ElectronSaveRuntime | null
```

### 函数 `getNodeExportRuntime`

源码：`src/utils/desktop-export.ts:74`

从 Obsidian 桌面端按需获取 Node.js 文件 API；移动端或受限环境返回 null。

```ts
function getNodeExportRuntime(): NodeExportRuntime | null
```

### 函数 `saveDesktopExportFile`

源码：`src/utils/desktop-export.ts:89`

保存导出文本到用户选择的位置；无法打开选择器时默认写入桌面。

```ts
export async function saveDesktopExportFile(extension: DesktopExportExtension, baseName: string, content: string | Uint8Array): Promise<DesktopExportResult | null>
```

### 函数 `saveDesktopPdfFile`

源码：`src/utils/desktop-export.ts:108`

使用 Electron 的离屏窗口渲染 HTML，并直接写出 PDF，避免 Obsidian 拦截打印弹窗。

```ts
export async function saveDesktopPdfFile(baseName: string, html: string): Promise<DesktopExportResult | null>
```

## `src/utils/filename.ts`

跨平台文件名、扩展名、时间戳与图片 MIME 类型工具。

### 函数 `sanitizeFilename`

源码：`src/utils/filename.ts:20`

将任意标题转换为可在常见桌面文件系统中使用的文件名。

```ts
export function sanitizeFilename(value: string, fallback = "思维导图", maxLength = DEFAULT_MAX_FILENAME_LENGTH): string
```

### 函数 `sanitizeFileExtension`

源码：`src/utils/filename.ts:42`

从用户提供的文件名或扩展名中提取安全的小写扩展名。

```ts
export function sanitizeFileExtension(value: string, fallback = "png"): string
```

### 函数 `buildCompactTimestamp`

源码：`src/utils/filename.ts:55`

生成适合资源文件名的本地时间戳。

```ts
export function buildCompactTimestamp(date: Date): string
```

### 函数 `buildDefaultMindMapTitle`

源码：`src/utils/filename.ts:67`

生成新建导图使用的默认标题。

```ts
export function buildDefaultMindMapTitle(prefix: string, date: Date): string
```

### 函数 `mimeTypeFromFilename`

源码：`src/utils/filename.ts:79`

根据文件扩展名返回常见图片 MIME 类型。

```ts
export function mimeTypeFromFilename(filename: string): string
```

## `src/utils/image-host.ts`

图床端点校验、请求头解析、multipart 请求构造和响应 URL 提取工具。

### 接口 `MultipartUploadBody`

源码：`src/utils/image-host.ts:12`

multipart 构造结果。

```ts
export interface MultipartUploadBody
```

### 函数 `normalizeHttpUrl`

源码：`src/utils/image-host.ts:29`

校验上传端点是否为 HTTP(S) URL，同时保留用户填写的原始格式。 @throws 端点为空、格式无效或协议不是 HTTP(S) 时抛出错误。

```ts
export function normalizeHttpUrl(value: string, label = "URL"): string
```

### 函数 `parseUploadHeaders`

源码：`src/utils/image-host.ts:49`

将设置中的 JSON 请求头解析为扁平字符串对象。 @throws JSON 非对象、字段名非法、字段值为复杂对象或包含换行符时抛出错误。

```ts
export function parseUploadHeaders(source: string): Record<string, string>
```

### 函数 `createMultipartBoundary`

源码：`src/utils/image-host.ts:76`

创建不可预测且符合 multipart 语法的 boundary。

```ts
export function createMultipartBoundary(): string
```

### 函数 `buildMultipartUploadBody`

源码：`src/utils/image-host.ts:93`

构造单文件 multipart/form-data 请求体。

```ts
export async function buildMultipartUploadBody( fieldName: string, filename: string, mime: string, blob: Blob, boundary = createMultipartBoundary() ): Promise<MultipartUploadBody>
```

### 函数 `parseUploadResponsePayload`

源码：`src/utils/image-host.ts:126`

优先使用请求 API 已解析的 JSON，否则尝试解析文本内容。

```ts
export function parseUploadResponsePayload(json: unknown, text: string): unknown
```

### 函数 `extractImageUrlFromResponse`

源码：`src/utils/image-host.ts:143`

从图床响应中提取第一个合法的 HTTP(S) 图片地址。

```ts
export function extractImageUrlFromResponse(payload: unknown, preferredPaths: readonly string[] = []): string | null
```

### 函数 `readPath`

源码：`src/utils/image-host.ts:163`

按点分隔路径读取对象属性。

```ts
export function readPath(value: unknown, path: string): unknown
```

### 函数 `isHttpUrl`

源码：`src/utils/image-host.ts:176`

判断字符串是否为 HTTP(S) URL。

```ts
export function isHttpUrl(value: string): boolean
```

### 函数 `validateMultipartBoundary`

源码：`src/utils/image-host.ts:192`

校验 multipart boundary，避免调用方通过测试注入点写入非法请求头字符。 @throws boundary 为空、过长或包含非法字符时抛出错误。

```ts
function validateMultipartBoundary(boundary: string): string
```

### 函数 `sanitizeContentDispositionValue`

源码：`src/utils/image-host.ts:198`

清除 Content-Disposition 参数中的引号、反斜杠和换行，防止请求头注入。

```ts
function sanitizeContentDispositionValue(value: string, fallback: string): string
```

## `src/view.ts`

Obsidian TextFileView 适配层。

### 类 `MindMapStudioView`

源码：`src/view.ts:37`

MindMapStudioView 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapStudioView extends TextFileView
```

### 构造函数 `MindMapStudioView.constructor`

源码：`src/view.ts:59`

创建 MindMapStudioView 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(leaf: WorkspaceLeaf, plugin: MindMapStudioPlugin)
```

### 方法 `MindMapStudioView.getViewType`

源码：`src/view.ts:68`

读取并返回view type，并保持模型、界面和持久化状态的一致性。

```ts
getViewType(): string
```

### 方法 `MindMapStudioView.getDisplayText`

源码：`src/view.ts:76`

读取并返回display text，并保持模型、界面和持久化状态的一致性。

```ts
getDisplayText(): string
```

### 方法 `MindMapStudioView.getIcon`

源码：`src/view.ts:84`

读取并返回icon，并保持模型、界面和持久化状态的一致性。

```ts
getIcon(): string
```

### 方法 `MindMapStudioView.getViewData`

源码：`src/view.ts:93`

返回当前编辑器文档的序列化文本，供 Obsidian 自动保存。保存使用模型层统一序列化，确保字段规范和版本号正确。

```ts
getViewData(): string
```

### 方法 `MindMapStudioView.setViewData`

源码：`src/view.ts:105`

接收 Obsidian 读取的文件文本，解析成领域文档并交给编辑器。重新加载时会保留全局显示模式，并异步刷新文章父子上下文。

```ts
setViewData(data: string, clear: boolean): void
```

### 方法 `MindMapStudioView.clear`

源码：`src/view.ts:230`

执行“clear”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
clear(): void
```

### 方法 `MindMapStudioView.showArticleDirectory`

源码：`src/view.ts:240`

Displays and persists the generated directory for the top-level article.

```ts
showArticleDirectory(): void
```

### 方法 `MindMapStudioView.save`

源码：`src/view.ts:249`

保存相关数据，并保持模型、界面和持久化状态的一致性。

```ts
async save(clear?: boolean): Promise<void>
```

### 方法 `MindMapStudioView.onClose`

源码：`src/view.ts:260`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
async onClose(): Promise<void>
```

### 方法 `MindMapStudioView.openMapFamilySearch`

源码：`src/view.ts:272`

打开map family search，并保持模型、界面和持久化状态的一致性。

```ts
private async openMapFamilySearch(): Promise<void>
```

### 方法 `MindMapStudioView.refreshAppearance`

源码：`src/view.ts:285`

刷新appearance，并保持模型、界面和持久化状态的一致性。

```ts
refreshAppearance(): void
```

### 方法 `MindMapStudioView.focusNode`

源码：`src/view.ts:295`

定位node，并保持模型、界面和持久化状态的一致性。

```ts
focusNode(nodeId: string): void
```

### 方法 `MindMapStudioView.markExplicitNavigation`

源码：`src/view.ts:310`

标记当前文件由用户或跨模式导航显式打开。 下一次文章族上下文加载完成时以当前文件为准，避免旧的跨文件阅读记录 立即把视图跳回刚离开的父导图或子导图。

```ts
markExplicitNavigation(focusNodeId?: string): void
```

### 方法 `MindMapStudioView.setDisplayMode`

源码：`src/view.ts:327`

更新并应用display mode，并保持模型、界面和持久化状态的一致性。

```ts
setDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapStudioView.applyGlobalDisplayMode`

源码：`src/view.ts:336`

应用global display mode，并保持模型、界面和持久化状态的一致性。

```ts
applyGlobalDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapStudioView.toggleReadOnly`

源码：`src/view.ts:343`

切换read only，并保持模型、界面和持久化状态的一致性。

```ts
toggleReadOnly(): void
```

### 方法 `MindMapStudioView.askAi`

源码：`src/view.ts:348`

打开 AI 询问窗口；默认使用当前页面，节点右键后使用该节点子树。

```ts
askAi(): void
```

### 方法 `MindMapStudioView.captureScreenshot`

源码：`src/view.ts:354`

启动截图并让编辑器根据截图前焦点决定插入节点或保留剪贴板。

```ts
async captureScreenshot(): Promise<void>
```

### 方法 `MindMapStudioView.openAiModal`

源码：`src/view.ts:363`

构建 Markdown 上下文并打开 AI 窗口。

```ts
private openAiModal(nodeId?: string): void
```

### 方法 `MindMapStudioView.recognizeImages`

源码：`src/view.ts:406`

按节点树顺序逐张读取并识别当前页面或节点子树中的全部图片。

```ts
private async recognizeImages(nodeId: string | undefined, profileId: string, instruction: string): Promise<ImageRecognitionBatchResult>
```

### 方法 `MindMapStudioView.getEditorOptions`

源码：`src/view.ts:434`

读取并返回editor options，并保持模型、界面和持久化状态的一致性。

```ts
private getEditorOptions(preferCurrentFileLocation = false)
```

### 方法 `MindMapStudioView.scheduleArticleContextRefresh`

源码：`src/view.ts:495`

安排延迟执行article context refresh，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleArticleContextRefresh(delay: number): void
```

### 方法 `MindMapStudioView.refreshArticleContext`

源码：`src/view.ts:506`

刷新article context，并保持模型、界面和持久化状态的一致性。

```ts
private async refreshArticleContext(): Promise<void>
```

### 方法 `MindMapStudioView.applyViewClasses`

源码：`src/view.ts:530`

应用view classes，并保持模型、界面和持久化状态的一致性。

```ts
private applyViewClasses(): void
```

### 方法 `MindMapStudioView.scheduleSavedIndicator`

源码：`src/view.ts:539`

安排延迟执行saved indicator，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleSavedIndicator(): void
```

### 方法 `MindMapStudioView.openLink`

源码：`src/view.ts:549`

打开link，并保持模型、界面和持久化状态的一致性。

```ts
private async openLink(rawLink: string): Promise<void>
```

### 方法 `MindMapStudioView.resolveImage`

源码：`src/view.ts:566`

解析并确定image，并保持模型、界面和持久化状态的一致性。

```ts
private resolveImage(rawSource: string): string | null
```

### 方法 `MindMapStudioView.exportTextFile`

源码：`src/view.ts:583`

执行“export text file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async exportTextFile(extension: "svg" | "md" | "json" | "html" | "doc", content: string, preferExternal = false): Promise<void>
```

### 方法 `MindMapStudioView.exportBinaryFile`

源码：`src/view.ts:600`

将二进制文档写入所选位置或当前库。

```ts
private async exportBinaryFile(extension: "docx", content: Uint8Array): Promise<void>
```

### 方法 `MindMapStudioView.exportArticleFamily`

源码：`src/view.ts:623`

Exports the current map family as one continuous document. A top-level directory uses its already collected reading sections; a child page starts at the current map and recursively includes descendants only.

```ts
private async exportArticleFamily(format: "html" | "doc" | "pdf" | "md"): Promise<void>
```

## `src/vision/local-ocr.ts`

桌面端本地 Tesseract OCR 命令调用和安全参数解析。

### 接口 `LocalOcrOptions`

源码：`src/vision/local-ocr.ts:9`

本地 OCR 命令配置。

```ts
export interface LocalOcrOptions
```

### 接口 `LocalOcrRuntime`

源码：`src/vision/local-ocr.ts:17`

桌面端本地 OCR 所需的最小 Node.js 运行时接口。

```ts
interface LocalOcrRuntime
```

### 函数 `getLocalOcrRuntime`

源码：`src/vision/local-ocr.ts:32`

从 Obsidian 桌面端按需获取 Node.js API，避免移动端加载插件时静态引用 Node 模块。

```ts
function getLocalOcrRuntime(): LocalOcrRuntime | null
```

### 函数 `parseCommandArguments`

源码：`src/vision/local-ocr.ts:55`

把用户填写的附加命令参数解析为 execFile 参数数组，不经过 shell。

```ts
export function parseCommandArguments(source: string): string[]
```

### 函数 `executeTesseract`

源码：`src/vision/local-ocr.ts:95`

使用 execFile 执行 Tesseract，参数不经过 shell。

```ts
function executeTesseract( runtime: LocalOcrRuntime, executable: string, args: string[], timeoutMs: number ): Promise<
```

### 函数 `formatLocalOcrError`

源码：`src/vision/local-ocr.ts:115`

Formats low-level execFile failures into actionable local OCR messages.

```ts
export function formatLocalOcrError(error: unknown, executable: string): string
```

### 函数 `recognizeImageWithLocalOcr`

源码：`src/vision/local-ocr.ts:128`

使用本机 Tesseract 可执行文件识别图片，不上传任何图片数据。

```ts
export async function recognizeImageWithLocalOcr(blob: Blob, options: LocalOcrOptions): Promise<string>
```

## `src/vision/modal.ts`

图片与识别文字并排对比、取消返回和确认替换弹窗。

### 接口 `ImageRecognitionPreviewModalOptions`

源码：`src/vision/modal.ts:10`

图片识别预览弹窗所需的显示数据和确认回调。

```ts
export interface ImageRecognitionPreviewModalOptions
```

### 类 `ImageRecognitionPreviewModal`

源码：`src/vision/modal.ts:19`

显示原图片与识别文字，只有用户确认后才执行替换。

```ts
export class ImageRecognitionPreviewModal extends Modal
```

### 构造函数 `ImageRecognitionPreviewModal.constructor`

源码：`src/vision/modal.ts:23`

保存预览参数并初始化 Obsidian Modal。

```ts
constructor(app: App, private readonly options: ImageRecognitionPreviewModalOptions)
```

### 方法 `ImageRecognitionPreviewModal.onOpen`

源码：`src/vision/modal.ts:28`

构建图片、可编辑文字和取消/确认按钮。

```ts
onOpen(): void
```

### 方法 `ImageRecognitionPreviewModal.onClose`

源码：`src/vision/modal.ts:85`

关闭时清空临时 DOM。

```ts
onClose(): void
```

## `src/vision/recognition.ts`

图片识图范围收集、提示词构造、识别结果规范化和图片转文字预览应用。

### 类型 `ImageRecognitionMode`

源码：`src/vision/recognition.ts:18`

插件支持的图片文字识别执行模式。

```ts
export type ImageRecognitionMode = "ai" | "local-ocr";
```

### 接口 `RecognizableImage`

源码：`src/vision/recognition.ts:21`

当前页面或节点子树中的单张待识别图片。

```ts
export interface RecognizableImage
```

### 接口 `ImageRecognitionItemResult`

源码：`src/vision/recognition.ts:32`

单张图片识别后的统一结果。

```ts
export interface ImageRecognitionItemResult extends RecognizableImage
```

### 接口 `ImageRecognitionBatchResult`

源码：`src/vision/recognition.ts:39`

顺序处理多张图片后返回给 AI 助手的批量结果。

```ts
export interface ImageRecognitionBatchResult
```

### 接口 `ImageTextReplacementPreview`

源码：`src/vision/recognition.ts:47`

图片右键转文字时用于并发校验和确认应用的预览。

```ts
export interface ImageTextReplacementPreview
```

### 函数 `collectRecognizableImages`

源码：`src/vision/recognition.ts:59`

收集当前页面或指定节点子树中的全部图片，并保持稳定的深度优先顺序。

```ts
export function collectRecognizableImages(document: MindMapDocument, scopeNodeId?: string | null): RecognizableImage[]
```

### 函数 `normalizeRecognizedText`

源码：`src/vision/recognition.ts:75`

规范化 OCR 或视觉模型返回文字，去除围栏和无意义的首尾空白。

```ts
export function normalizeRecognizedText(value: string): string
```

### 函数 `buildImageRecognitionPrompt`

源码：`src/vision/recognition.ts:95`

构建单张图片的识图提示词，要求模型优先转录文字并补充必要的视觉说明。

```ts
export function buildImageRecognitionPrompt(image: RecognizableImage, instruction: string): string
```

### 函数 `imageBlockSnapshot`

源码：`src/vision/recognition.ts:110`

读取指定图片块的稳定快照，供预览应用前检测并发修改。

```ts
export function imageBlockSnapshot(document: MindMapDocument, nodeId: string, blockId: string): string
```

### 函数 `previewImageTextReplacement`

源码：`src/vision/recognition.ts:117`

创建图片转文字预览；该步骤不会修改导图。

```ts
export function previewImageTextReplacement( document: MindMapDocument, nodeId: string, blockId: string, recognizedText: string ): ImageTextReplacementPreview
```

### 函数 `applyImageTextReplacement`

源码：`src/vision/recognition.ts:142`

应用已经确认且未过期的图片转文字预览，并保持原内容块位置不变。

```ts
export function applyImageTextReplacement(document: MindMapDocument, preview: ImageTextReplacementPreview): MindMapDocument
```

### 函数 `applyImageTextReplacements`

源码：`src/vision/recognition.ts:168`

批量应用已经确认的图片转文字预览；任一快照过期时不会向编辑器写入部分变更。

```ts
export function applyImageTextReplacements( document: MindMapDocument, previews: ImageTextReplacementPreview[] ): MindMapDocument
```

