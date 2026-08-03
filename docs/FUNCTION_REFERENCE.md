# 函数与类参考

> 本文档由 `npm run docs:generate` 根据 TypeScript 源码自动生成。源码中的 JSDoc 是说明的权威来源；修改函数签名或职责后，应同步更新注释并重新生成本文档。

## `src/ai/client.ts`

OpenAI Chat Completions 兼容 AI 请求客户端。

### 类型 `AiStreamUpdate`

源码：`src/ai/client.ts:25`

流式响应到达时通知界面，以便即时显示模型思考和正文。

```ts
export type AiStreamUpdate =
```

### 接口 `AiCompletionResult`

源码：`src/ai/client.ts:28`

AI 请求完成后返回给界面的统一结果。

```ts
export interface AiCompletionResult
```

### 接口 `AiConnectionTestResult`

源码：`src/ai/client.ts:39`

AI 接口连通性检测结果。

```ts
export interface AiConnectionTestResult
```

### 函数 `fetchAiProfileModels`

源码：`src/ai/client.ts:45`

向兼容服务的 /models 目录请求可用模型 ID。

```ts
export async function fetchAiProfileModels(profile: AiProfileConfig): Promise<string[]>
```

### 函数 `requestAiCompletion`

源码：`src/ai/client.ts:143`

发送 OpenAI Chat Completions 兼容请求。

```ts
export async function requestAiCompletion( profile: AiProfileConfig, payload: AiMarkdownPayload, question: string, onStreamUpdate?: (update: AiStreamUpdate) => void ): Promise<AiCompletionResult>
```

### 函数 `requestAiEditProposal`

源码：`src/ai/client.ts:167`

请求 AI 返回可解析的 Markdown 修改提案；不会直接修改导图。

```ts
export async function requestAiEditProposal( profile: AiProfileConfig, payload: AiMarkdownPayload, instruction: string, onStreamUpdate?: (update: AiStreamUpdate) => void ): Promise<AiCompletionResult>
```

### 函数 `imageBlobToDataUrl`

源码：`src/ai/client.ts:191`

把图片 Blob 转为 Chat Completions 可直接发送的 data URL。

```ts
export async function imageBlobToDataUrl(blob: Blob): Promise<string>
```

### 函数 `requestAiImageRecognition`

源码：`src/ai/client.ts:203`

使用支持视觉输入的 OpenAI 兼容模型识别单张图片。

```ts
export async function requestAiImageRecognition( profile: AiProfileConfig, image: Blob | string, prompt: string ): Promise<AiCompletionResult>
```

### 函数 `testAiProfileConnection`

源码：`src/ai/client.ts:241`

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

### 类型 `AiThinkingMode`

源码：`src/ai/config.ts:10`

是否由插件显式请求模型启用推理；auto 保持服务端和模型默认行为。

```ts
export type AiThinkingMode = "auto" | "on" | "off";
```

### 接口 `AiProfileConfig`

源码：`src/ai/config.ts:13`

单个可持久化 AI 接口配置。

```ts
export interface AiProfileConfig
```

### 接口 `AiProfilePreset`

源码：`src/ai/config.ts:31`

用于快速填充服务地址、模型和系统提示词的内置预设。

```ts
export interface AiProfilePreset
```

### 函数 `createAiProfileConfig`

源码：`src/ai/config.ts:150`

创建一个可编辑的 AI 接口配置。

```ts
export function createAiProfileConfig(provider: AiProviderKind, index = 1): AiProfileConfig
```

### 函数 `normalizeAiProfileConfig`

源码：`src/ai/config.ts:170`

规范化持久化的 AI 配置，防止异常值进入请求层。

```ts
export function normalizeAiProfileConfig(value: unknown, index = 1): AiProfileConfig | null
```

### 函数 `enabledAiProfiles`

源码：`src/ai/config.ts:196`

返回当前可用于请求的配置。

```ts
export function enabledAiProfiles(profiles: AiProfileConfig[]): AiProfileConfig[]
```

## `src/ai/edit.ts`

AI 结构化编辑预览、Markdown 应用和不联网的本地文字替换。

### 类型 `AiInteractionMode`

源码：`src/ai/edit.ts:23`

AI 窗口支持的问答、编辑、题目整理、批量识图和本地替换模式。

```ts
export type AiInteractionMode = "ask" | "edit" | "question" | "vision" | "replace";
```

### 接口 `AiPromptDraftState`

源码：`src/ai/edit.ts:32`

分别保存询问和结构化编辑模式的输入草稿。

```ts
export interface AiPromptDraftState
```

### 函数 `createAiPromptDraftState`

源码：`src/ai/edit.ts:41`

创建 AI 弹窗的模式独立输入草稿。

```ts
export function createAiPromptDraftState( defaultQuestion: string, defaultVisionPrompt = "识别图片中的全部可见文字，并按阅读顺序转写；没有文字时简洁描述图片内容。" ): AiPromptDraftState
```

### 函数 `switchAiPromptDraft`

源码：`src/ai/edit.ts:55`

保存离开模式的输入并返回目标模式应显示的草稿。

```ts
export function switchAiPromptDraft( state: AiPromptDraftState, currentValue: string, nextMode: AiInteractionMode ):
```

### 接口 `AiEditPreview`

源码：`src/ai/edit.ts:81`

AI 返回 Markdown 后生成的可确认结构化修改预览。

```ts
export interface AiEditPreview
```

### 接口 `LocalReplacePreview`

源码：`src/ai/edit.ts:94`

本地文字替换的范围、命中数量和并发校验数据。

```ts
export interface LocalReplacePreview
```

### 接口 `AppliedAiEdit`

源码：`src/ai/edit.ts:107`

外部编辑成功应用后返回的文档和建议聚焦节点。

```ts
export interface AppliedAiEdit
```

### 函数 `aiEditScopeSnapshot`

源码：`src/ai/edit.ts:114`

返回当前页面或节点子树的稳定快照，用于阻止把过期预览应用到已变化内容。

```ts
export function aiEditScopeSnapshot(document: MindMapDocument, scopeNodeId?: string | null): string
```

### 函数 `buildAiEditUserMessage`

源码：`src/ai/edit.ts:121`

构建 AI 结构化编辑消息，要求模型只返回可解析 Markdown，不直接执行任何修改。

```ts
export function buildAiEditUserMessage(instruction: string, payload: AiMarkdownPayload): string
```

### 函数 `extractAiEditMarkdown`

源码：`src/ai/edit.ts:139`

从模型回答中提取 Markdown；优先使用 markdown/md 围栏，未使用围栏时保留完整回答。

```ts
export function extractAiEditMarkdown(responseText: string): string
```

### 函数 `refreshGeneratedNodeIds`

源码：`src/ai/edit.ts:146`

为 AI 生成的节点重新分配 ID，同时保留被替换范围根节点的稳定 ID。

```ts
function refreshGeneratedNodeIds(root: MindMapNode, stableRootId: string): void
```

### 函数 `preserveOperationalMetadata`

源码：`src/ai/edit.ts:157`

保留 Markdown 无法可靠表达的节点运行元数据，避免 AI 整理意外断开子导图和样式。

```ts
function preserveOperationalMetadata(existing: MindMapNode, generated: MindMapNode): void
```

### 函数 `previewAiMarkdownEdit`

源码：`src/ai/edit.ts:166`

解析并验证 AI 编辑结果，返回节点数量和字节大小预览，不直接修改导图。

```ts
export function previewAiMarkdownEdit( document: MindMapDocument, scopeNodeId: string | null | undefined, responseText: string ): AiEditPreview
```

### 函数 `applyAiMarkdownEdit`

源码：`src/ai/edit.ts:194`

将已经确认且仍未过期的 AI Markdown 预览应用到页面或节点子树。

```ts
export function applyAiMarkdownEdit(document: MindMapDocument, preview: AiEditPreview): AppliedAiEdit
```

### 函数 `replaceLiteral`

源码：`src/ai/edit.ts:224`

对字符串执行字面量替换并返回实际命中次数。

```ts
function replaceLiteral(value: string, query: string, replacement: string, caseSensitive: boolean):
```

### 函数 `replaceTextInScope`

源码：`src/ai/edit.ts:236`

在指定节点范围内执行本地文字替换；不修改链接、代码、图片地址或子导图路径。

```ts
function replaceTextInScope( document: MindMapDocument, scopeNodeId: string | null, query: string, replacement: string, caseSensitive: boolean ): AppliedAiEdit &
```

### 函数 `previewLocalTextReplace`

源码：`src/ai/edit.ts:301`

预览不联网的字面量替换，返回命中数和受影响节点数。

```ts
export function previewLocalTextReplace( document: MindMapDocument, scopeNodeId: string | null | undefined, query: string, replacement: string, caseSensitive = false ): LocalReplacePreview
```

### 函数 `applyLocalTextReplace`

源码：`src/ai/edit.ts:327`

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

源码：`src/ai/modal.ts:50`

单个处理轨迹步骤的视觉状态。

```ts
type TraceState = "pending" | "active" | "done" | "error";
```

### 类 `AiAskModal`

源码：`src/ai/modal.ts:53`

显示 AI 问答、修改提案、批量识图确认和不联网文字替换。

```ts
export class AiAskModal extends Modal
```

### 构造函数 `AiAskModal.constructor`

源码：`src/ai/modal.ts:63`

保存窗口上下文并初始化 Obsidian Modal。

```ts
constructor(app: App, private readonly options: AiAskModalOptions)
```

### 方法 `AiAskModal.onOpen`

源码：`src/ai/modal.ts:68`

构建模式选择、大小提示、处理轨迹、修改预览和确认应用区域。

```ts
onOpen(): void
```

### 方法 `AiAskModal.onClose`

源码：`src/ai/modal.ts:616`

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

### 接口 `AiStreamDelta`

源码：`src/ai/protocol.ts:41`

流式响应中单个可显示的思考或正文片段。

```ts
export interface AiStreamDelta
```

### 函数 `resolveAiChatCompletionsEndpoint`

源码：`src/ai/protocol.ts:52`

将 OpenAI 兼容服务的基础地址或完整地址统一为 Chat Completions 端点。 例如 `https://api.example.com/v1` 会转换为 `https://api.example.com/v1/chat/completions`；已经填写完整路径时保持不变。

```ts
export function resolveAiChatCompletionsEndpoint(endpoint: string): string
```

### 函数 `resolveAiModelsEndpoint`

源码：`src/ai/protocol.ts:61`

将配置的基础地址或完整聊天地址转换为模型目录端点。

```ts
export function resolveAiModelsEndpoint(endpoint: string): string
```

### 函数 `extractAiModelIds`

源码：`src/ai/protocol.ts:70`

从 OpenAI 兼容的 /models 响应中提取可供选择的模型 ID。

```ts
export function extractAiModelIds(payload: unknown): string[]
```

### 函数 `withThinkingMode`

源码：`src/ai/protocol.ts:84`

按服务商协议追加思考控制字段；auto 时完全不改变原始请求。

```ts
function withThinkingMode(profile: AiProfileConfig, body: AiChatCompletionBody): AiChatCompletionBody
```

### 函数 `parseAiHeaders`

源码：`src/ai/protocol.ts:99`

解析自定义请求头，并拒绝嵌套值、非法名称和 CRLF 注入。

```ts
export function parseAiHeaders(source: string): Record<string, string>
```

### 函数 `buildChatCompletionBody`

源码：`src/ai/protocol.ts:118`

构建 OpenAI Chat Completions 兼容请求体。

```ts
export function buildChatCompletionBody( profile: AiProfileConfig, payload: AiMarkdownPayload, question: string, stream = false ): AiChatCompletionBody
```

### 函数 `buildAiEditCompletionBody`

源码：`src/ai/protocol.ts:138`

构建只返回 Markdown 修改提案的 OpenAI Chat Completions 请求体。

```ts
export function buildAiEditCompletionBody( profile: AiProfileConfig, payload: AiMarkdownPayload, instruction: string, stream = false ): AiChatCompletionBody
```

### 函数 `buildImageRecognitionCompletionBody`

源码：`src/ai/protocol.ts:162`

构建单张图片的 OpenAI 兼容多模态识图请求。

```ts
export function buildImageRecognitionCompletionBody( profile: AiProfileConfig, prompt: string, imageDataUrl: string ): AiChatCompletionBody
```

### 函数 `buildAiConnectionTestBody`

源码：`src/ai/protocol.ts:187`

构建不包含导图正文的最小连通性检测请求。

```ts
export function buildAiConnectionTestBody(profile: AiProfileConfig): AiChatCompletionBody
```

### 函数 `extractAiResponseText`

源码：`src/ai/protocol.ts:198`

从 Chat Completions 及常见兼容响应中提取最终文本。

```ts
export function extractAiResponseText(payload: unknown): string
```

### 函数 `extractAiStreamDelta`

源码：`src/ai/protocol.ts:220`

从 OpenAI Chat Completions SSE 事件中读取思考与正文增量，兼容常见字段命名。

```ts
export function extractAiStreamDelta(payload: unknown): AiStreamDelta
```

## `src/article/article-render-cache.ts`

文章节点渲染快照的稳定指纹、内存 LRU 与磁盘持久化缓存。

### 函数 `normalizeArticleCachePath`

源码：`src/article/article-render-cache.ts:13`

Minimal cross-platform path normalization for vault-relative and plugin cache paths.

```ts
export function normalizeArticleCachePath(value: string): string
```

### 接口 `ArticleNodeRenderCacheEntry`

源码：`src/article/article-render-cache.ts:21`

一个未变化文章节点可直接恢复的静态 DOM 快照。

```ts
export interface ArticleNodeRenderCacheEntry
```

### 接口 `ArticleRenderCacheSnapshot`

源码：`src/article/article-render-cache.ts:27`

单个 .mindmap 文件的文章节点缓存。

```ts
export interface ArticleRenderCacheSnapshot
```

### 接口 `PersistedArticleRenderCache`

源码：`src/article/article-render-cache.ts:39`

On-disk envelope for all preloaded article snapshots.

```ts
interface PersistedArticleRenderCache
```

### 函数 `stableStringify`

源码：`src/article/article-render-cache.ts:45`

对 JSON 兼容值执行键排序，避免对象属性插入顺序导致缓存误失效。

```ts
export function stableStringify(value: unknown): string
```

### 函数 `articleCacheFingerprint`

源码：`src/article/article-render-cache.ts:65`

快速同步散列，适合 UI 渲染路径中的中小型结构指纹。

```ts
export function articleCacheFingerprint(value: unknown): string
```

### 函数 `articleNodeRenderFingerprint`

源码：`src/article/article-render-cache.ts:90`

计算单个文章节点的渲染指纹，但不递归序列化后代节点。 文章章节 DOM 只由当前节点自身字段和调用方提供的层级、编号、只读状态等上下文决定； 把 `children` 一并序列化会让深链文档退化为近似 O(n²)，并让任意后代编辑无谓地 使所有祖先缓存失效。

```ts
export function articleNodeRenderFingerprint(node: MindMapNode, context: unknown): string
```

### 函数 `normalizeArticleRenderCacheSnapshot`

源码：`src/article/article-render-cache.ts:98`

检查磁盘数据，拒绝异常大、旧版本或结构不完整的缓存。

```ts
export function normalizeArticleRenderCacheSnapshot(value: unknown): ArticleRenderCacheSnapshot | null
```

### 类 `ArticleRenderCacheStore`

源码：`src/article/article-render-cache.ts:133`

插件级文章渲染缓存。启动时预载到内存，视图打开可同步命中；写盘通过防抖串行执行。

```ts
export class ArticleRenderCacheStore
```

### 构造函数 `ArticleRenderCacheStore.constructor`

源码：`src/article/article-render-cache.ts:141`

Creates a bounded cache store backed by one plugin-private JSON file.

```ts
constructor( private readonly adapter: DataAdapter, private readonly cacheDirectory: string, private readonly cacheFile: string )
```

### 方法 `ArticleRenderCacheStore.initialize`

源码：`src/article/article-render-cache.ts:148`

从磁盘加载最近使用的缓存，插件注册视图前即可完成。

```ts
async initialize(): Promise<void>
```

### 方法 `ArticleRenderCacheStore.get`

源码：`src/article/article-render-cache.ts:176`

同步读取内存快照，保证 TextFileView 打开路径不等待磁盘。

```ts
get(filePath: string): ArticleRenderCacheSnapshot | null
```

### 方法 `ArticleRenderCacheStore.put`

源码：`src/article/article-render-cache.ts:189`

更新内存并延迟写盘；旧文件节点由新快照自然淘汰。

```ts
put(snapshot: ArticleRenderCacheSnapshot): void
```

### 方法 `ArticleRenderCacheStore.remove`

源码：`src/article/article-render-cache.ts:201`

文件删除时清除缓存。

```ts
remove(filePath: string): void
```

### 方法 `ArticleRenderCacheStore.rename`

源码：`src/article/article-render-cache.ts:207`

文件重命名时迁移缓存键，节点快照本身仍可复用。

```ts
rename(oldPath: string, newPath: string): void
```

### 方法 `ArticleRenderCacheStore.flush`

源码：`src/article/article-render-cache.ts:219`

插件卸载前立即提交尚未写入的缓存。

```ts
async flush(): Promise<void>
```

### 方法 `ArticleRenderCacheStore.markDirty`

源码：`src/article/article-render-cache.ts:229`

Marks the latest in-memory LRU state dirty and absorbs repeated updates into one trailing write.

```ts
private markDirty(): void
```

### 方法 `ArticleRenderCacheStore.schedulePersist`

源码：`src/article/article-render-cache.ts:235`

Debounces repeated node updates into one disk write when no write loop is already active.

```ts
private schedulePersist(): void
```

### 方法 `ArticleRenderCacheStore.startPersistRunner`

源码：`src/article/article-render-cache.ts:245`

Starts the unique persistence loop; updates arriving during a write are folded into its next pass.

```ts
private startPersistRunner(): void
```

### 方法 `ArticleRenderCacheStore.runPersistLoop`

源码：`src/article/article-render-cache.ts:258`

Persists stable JSON snapshots serially while coalescing all changes observed during an active write.

```ts
private async runPersistLoop(): Promise<void>
```

### 方法 `ArticleRenderCacheStore.prune`

源码：`src/article/article-render-cache.ts:278`

Applies entry-count and total-character LRU limits.

```ts
private prune(): void
```

### 方法 `ArticleRenderCacheStore.snapshotCharacters`

源码：`src/article/article-render-cache.ts:295`

Estimates one snapshot size without repeatedly serializing the complete cache.

```ts
private snapshotCharacters(snapshot: ArticleRenderCacheSnapshot): number
```

## `src/article/article-style.ts`

文章领域的样式预设与解析。

### 函数 `resolveArticleStyle`

源码：`src/article/article-style.ts:21`

解析阅读样式预设，并叠加当前文档的自定义值。

```ts
export function resolveArticleStyle(style: ArticleStyle | undefined): ArticleStyle
```

## `src/article/display-mode.ts`

显示模式的启动恢复与持久化规则。

### 类型 `ArticleEntryLockMode`

源码：`src/article/display-mode.ts:11`

Controls how article mode chooses its lock state when entered.

```ts
export type ArticleEntryLockMode = "locked" | "inherit" | "remember";
```

### 函数 `normalizeArticleEntryLockMode`

源码：`src/article/display-mode.ts:14`

Normalizes persisted article-entry policies from older or malformed settings.

```ts
export function normalizeArticleEntryLockMode(value: unknown): ArticleEntryLockMode
```

### 函数 `resolveArticleEntryReadOnly`

源码：`src/article/display-mode.ts:19`

Resolves article mode's lock state without allowing unrelated modes to overwrite remembered state.

```ts
export function resolveArticleEntryReadOnly( mode: ArticleEntryLockMode, inheritedReadOnly: boolean, rememberedReadOnly: boolean ): boolean
```

### 函数 `normalizeDisplayModes`

源码：`src/article/display-mode.ts:30`

去重并过滤设置中未知的显示模式，空列表恢复为导图模式。

```ts
export function normalizeDisplayModes(value: readonly unknown[]): DisplayMode[]
```

### 函数 `resolveStartupDisplayMode`

源码：`src/article/display-mode.ts:40`

解析插件启动时允许恢复的显示模式。大纲只属于当前会话； 重新加载插件时优先回到导图，其次选择可见的文章或通读模式。

```ts
export function resolveStartupDisplayMode(preferred: unknown, visibleModes: readonly unknown[]): DisplayMode
```

### 函数 `shouldPersistDisplayMode`

源码：`src/article/display-mode.ts:50`

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

源码：`src/article/modes.ts:45`

Encodes a file path or node id into a collision-free DOM anchor component. Percent markers remain visible as underscores, so different Chinese paths cannot collapse to the same replacement string.

```ts
export function readingAnchorPart(value: string): string
```

### 函数 `chineseNumber`

源码：`src/article/modes.ts:62`

执行“chinese number”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function chineseNumber(value: number): string
```

### 函数 `alphabeticNumber`

源码：`src/article/modes.ts:75`

将一基序号转换为 Excel 风格的大写字母编号，例如 1 → A、26 → Z、27 → AA。

```ts
function alphabeticNumber(index: number): string
```

### 函数 `articleNumberLabel`

源码：`src/article/modes.ts:95`

将文章标题层级和同级序号转换为“第一章、第一节、一、（一）、1.、（1）、A.、（A）”等八级中文文章编号。 第 8 级之后只保留结构层级，不再从 A. 重新循环，避免深层节点与上级编号混淆。

```ts
export function articleNumberLabel(depth: number, index: number): string
```

### 函数 `circledNumberLabel`

源码：`src/article/modes.ts:117`

返回带圈数字标签。1–50 使用 Unicode 单字符，51 及以上返回普通数字， 由文章 DOM 使用 CSS 圆圈渲染；纯文本导出可据此提供可读回退。

```ts
export function circledNumberLabel(index: number): string
```

### 函数 `articleDisplayTitle`

源码：`src/article/modes.ts:132`

按编号末尾标点决定标题是否需要空格，使“第一章 标题”与“一、标题”“1.标题”等格式同时保持自然。

```ts
export function articleDisplayTitle(label: string, title: string): string
```

### 函数 `isArticleHeading`

源码：`src/article/modes.ts:142`

A node is an article heading when it owns local descendants or represents a linked child map. A sub-map node is therefore still a chapter/section even when its children live in another .mindmap file.

```ts
export function isArticleHeading(node: MindMapNode): boolean
```

### 函数 `isDocumentArticleNumberingDisabled`

源码：`src/article/modes.ts:154`

判断当前物理导图是否关闭整页文章编号。中心节点本身不参与编号， 因此保存在根节点上的 `none` 必须作用于该文件内全部正文标题和末端序号。 普通非根节点的 `none` 仍只跳过该节点，不影响后代的结构层级。

```ts
export function isDocumentArticleNumberingDisabled(root: MindMapNode): boolean
```

### 接口 `ArticleNumberingResolution`

源码：`src/article/modes.ts:159`

文章节点在自动、关闭或手动最高层级规则下的解析结果。

```ts
export interface ArticleNumberingResolution
```

### 函数 `resolveArticleNumbering`

源码：`src/article/modes.ts:176`

解析单个节点的文章编号状态。手动模式只覆盖当前节点所在子树的最高文章层级， 不再强制末端节点标题化；同级中只要存在自然标题，普通末端节点也会按同级标题编号， 从而避免首个“词义”等节点丢失序号。

```ts
export function resolveArticleNumbering(node: MindMapNode, defaultLevel: number, siblingHasHeading: boolean): ArticleNumberingResolution
```

### 函数 `articleChildStartLevel`

源码：`src/article/modes.ts:198`

计算一个物理导图根节点的首级子节点应使用的文章层级。根节点的手动层级表示 当前脑图正文的最高可见层级，文档标题本身不编号，一级子节点直接使用所选层级。

```ts
export function articleChildStartLevel(root: MindMapNode, baseDepth = 0): number
```

### 接口 `ArticleNodeInfo`

源码：`src/article/modes.ts:208`

ArticleNodeInfo 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ArticleNodeInfo
```

### 接口 `ArticleTocEntry`

源码：`src/article/modes.ts:228`

ArticleTocEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ArticleTocEntry
```

### 函数 `articleTocDepth`

源码：`src/article/modes.ts:247`

返回目录项的相对结构层级。

```ts
export function articleTocDepth(entry: ArticleTocEntry): number
```

### 函数 `resolveArticleTocMaxDepth`

源码：`src/article/modes.ts:259`

解析文章和通读目录使用的最大相对结构层级。当前脑图存在覆盖值时优先使用， 否则跟随插件全局设置；两者都异常时回退到 3 层。

```ts
export function resolveArticleTocMaxDepth(documentOverride: number | undefined, pluginDefault: number): number
```

### 接口 `ArticlePageNavigation`

源码：`src/article/modes.ts:265`

Navigation state shared by every physical article page in one map family.

```ts
export interface ArticlePageNavigation
```

### 接口 `ArticleSiblingPageResolution`

源码：`src/article/modes.ts:279`

当前物理文章页及其同层兄弟页的解析结果。

```ts
export interface ArticleSiblingPageResolution
```

### 函数 `sameBreadcrumb`

源码：`src/article/modes.ts:286`

比较两个目录面包屑片段是否完全一致。

```ts
function sameBreadcrumb(left: string[], right: string[]): boolean
```

### 函数 `resolveArticleSiblingPages`

源码：`src/article/modes.ts:299`

从递归全书目录中提取当前物理文件对应的同层兄弟页面。目录中的普通节点仍用于目录展示， 但不会进入上一篇/下一篇分页；因此打开“第一章”后会直接切换到“第二章”，而不会进入 当前文件内部的“第一节、第二节”。嵌套页面按相同规则在其父级下寻找兄弟页。

```ts
export function resolveArticleSiblingPages(entries: ArticleTocEntry[], currentFilePath: string): ArticleSiblingPageResolution
```

### 函数 `currentArticlePageEntry`

源码：`src/article/modes.ts:324`

返回文章页顶部应显示的目录编号标题。只有子导图物理页面使用该标题；顶层总目录文件 继续使用自身中心节点标题，避免把第一章误显示为整本书标题。

```ts
export function currentArticlePageEntry(navigation: ArticlePageNavigation | undefined): ArticleTocEntry | undefined
```

### 接口 `ArticleLeafNumberingOptions`

源码：`src/article/modes.ts:343`

Build the article representation for one physical .mindmap file. `baseDepth` is the absolute article depth represented by this file's root. A manually configured node replaces its inferred highest level and its descendants continue from that level. Heading/body classification remains structural: leaf peers of headings become same-level headings, while an isolated terminal node remains body text.

```ts
export interface ArticleLeafNumberingOptions
```

### 函数 `buildArticleNodeInfo`

源码：`src/article/modes.ts:355`

展开文章节点，并按同一上级下的末端正文数量决定是否使用下一层序号。

```ts
export function buildArticleNodeInfo( root: MindMapNode, baseDepth = 0, leafNumbering: ArticleLeafNumberingOptions =
```

### 函数 `normalizeVisibleModes`

源码：`src/article/modes.ts:424`

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

### 函数 `chooseArticleRefreshLocation`

源码：`src/article/reading-location.ts:230`

Chooses the semantic location used after an asynchronous article-context refresh. An explicit node in the newly opened physical file must outrank both the location captured from the temporary skeleton and the persisted family reading position.

```ts
export function chooseArticleRefreshLocation( preferredCurrent: ReadingLocation | null | undefined, rendered: ReadingLocation | null | undefined, remembered: ReadingLocation | null | undefined ): ReadingLocation | null
```

### 函数 `chooseArticleLandingRefreshLocation`

源码：`src/article/reading-location.ts:244`

Chooses the semantic location used after an article refresh while respecting the generated directory as a terminal landing page. A directory must never restore a remembered child-map location, because that would immediately reopen the child and make a successful parent-directory return disappear.

```ts
export function chooseArticleLandingRefreshLocation( directoryActive: boolean, preferredCurrent: ReadingLocation | null | undefined, rendered: ReadingLocation | null | undefined, remembered: ReadingLocation | null | undefined ): ReadingLocation | null
```

### 函数 `chooseArticleTransitionLocation`

源码：`src/article/reading-location.ts:260`

Chooses the target owned by one article entry transition. The target captured when the transition began outranks a later generic restore request; a genuinely newer explicit click starts a new render token and therefore a new transition.

```ts
export function chooseArticleTransitionLocation( requested: ReadingLocation | null | undefined, pendingRestore: ReadingLocation | null | undefined ): ReadingLocation | null
```

### 函数 `sameReadingLocation`

源码：`src/article/reading-location.ts:268`

比较两个位置是否具有相同语义，避免滚动期间重复写入设置。

```ts
export function sameReadingLocation(left: ReadingLocation | null | undefined, right: ReadingLocation | null | undefined): boolean
```

### 函数 `renameReadingLocationPath`

源码：`src/article/reading-location.ts:275`

在导图文件重命名后替换主路径和每一级跨文件回退路径。

```ts
export function renameReadingLocationPath(location: ReadingLocation, oldPath: string, newPath: string): ReadingLocation
```

## `src/article/render-window.ts`

文章模式按内容字节预算计算首屏窗口与滚动扩展范围。

### 函数 `utf8ByteLength`

源码：`src/article/render-window.ts:10`

不创建编码缓冲区地估算字符串的 UTF-8 字节数。

```ts
export function utf8ByteLength(value: string): number
```

### 函数 `resolveByteWindow`

源码：`src/article/render-window.ts:27`

计算目标条目前后独立受字节预算限制的初始窗口。

```ts
export function resolveByteWindow( weights: readonly number[], targetIndex: number, byteBudget = ARTICLE_RENDER_WINDOW_BYTES ):
```

### 函数 `resolveByteChunk`

源码：`src/article/render-window.ts:59`

从当前窗口边缘向一个方向扩展一个受字节预算限制的块。

```ts
export function resolveByteChunk( weights: readonly number[], edge: number, direction: "before" | "after", byteBudget = ARTICLE_RENDER_WINDOW_BYTES ): number
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

### 类型 `ArticleLeafNumberingStyle`

源码：`src/core/model.ts:34`

Numbering style used when terminal body siblings are converted into generated markers.

```ts
export type ArticleLeafNumberingStyle = "next-level" | "circled";
```

### 类型 `ArticleStylePresetId`

源码：`src/core/model.ts:36`

Built-in reading-presentation presets shared by article and continuous-reading modes.

```ts
export type ArticleStylePresetId = "classic" | "book" | "modern" | "minimal";
```

### 接口 `ArticleStyle`

源码：`src/core/model.ts:38`

Per-document reading-style overrides shared by article and continuous-reading modes.

```ts
export interface ArticleStyle
```

### 类型 `ThemeMode`

源码：`src/core/model.ts:66`

ThemeMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ThemeMode = "auto" | "light" | "dark";
```

### 类型 `NodeShape`

源码：`src/core/model.ts:70`

NodeShape 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type NodeShape = "rounded" | "pill" | "rectangle";
```

### 类型 `NodeVisualStyle`

源码：`src/core/model.ts:72`

Overall sizing and density used when rendering mind-map nodes.

```ts
export type NodeVisualStyle = "card" | "branch";
```

### 类型 `NodeWidthMode`

源码：`src/core/model.ts:74`

Default width calculation used for nodes without a manual width.

```ts
export type NodeWidthMode = "fixed" | "auto";
```

### 类型 `TaskStatus`

源码：`src/core/model.ts:76`

Legacy task-state values kept only so old files continue to parse without data loss.

```ts
export type TaskStatus = "todo" | "doing" | "done";
```

### 类型 `BackgroundPattern`

源码：`src/core/model.ts:80`

BackgroundPattern 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type BackgroundPattern = "none" | "grid" | "dots";
```

### 类型 `EdgeStyle`

源码：`src/core/model.ts:84`

EdgeStyle 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type EdgeStyle = "curved" | "straight" | "elbow";
```

### 类型 `EdgeWidthMode`

源码：`src/core/model.ts:88`

EdgeWidthMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type EdgeWidthMode = "uniform" | "tapered";
```

### 类型 `MindMapThemePresetId`

源码：`src/core/model.ts:92`

MindMapThemePresetId 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type MindMapThemePresetId = | "classic-indigo" | "ocean-blue" | "forest-green" | "sunset-orange" | "lavender-dream" | "candy-pop" | "paper-note" | "minimal-ink" | "dark-neon" | "mint-clean" | "spectrum-flow" | "executive-navy" | "botanical-calm" | "m…
```

### 类型 `FontFamilyMode`

源码：`src/core/model.ts:112`

FontFamilyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type FontFamilyMode = "obsidian" | "sans" | "serif" | "mono" | "custom";
```

### 类型 `TableAlignment`

源码：`src/core/model.ts:116`

TableAlignment 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type TableAlignment = "left" | "center" | "right";
```

### 类型 `NodeTextAlign`

源码：`src/core/model.ts:120`

NodeTextAlign 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type NodeTextAlign = "left" | "center" | "right";
```

### 类型 `ArticleParagraphIndent`

源码：`src/core/model.ts:122`

Per-text-block paragraph indentation used by article and reading modes.

```ts
export type ArticleParagraphIndent = "first-line" | "none";
```

### 接口 `MindMapTextStyle`

源码：`src/core/model.ts:127`

MindMapTextStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextStyle
```

### 接口 `MindMapTextRun`

源码：`src/core/model.ts:141`

MindMapTextRun 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextRun
```

### 接口 `MindMapTable`

源码：`src/core/model.ts:149`

MindMapTable 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTable
```

### 接口 `MindMapCodeBlock`

源码：`src/core/model.ts:161`

MindMapCodeBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapCodeBlock
```

### 接口 `MindMapTextContentBlock`

源码：`src/core/model.ts:172`

MindMapTextContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapTextContentBlock
```

### 接口 `MindMapImageRemoteSource`

源码：`src/core/model.ts:184`

MindMapImageRemoteSource 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageRemoteSource
```

### 接口 `MindMapImageSourceCandidate`

源码：`src/core/model.ts:199`

MindMapImageSourceCandidate 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageSourceCandidate
```

### 接口 `MindMapImageContentBlock`

源码：`src/core/model.ts:210`

MindMapImageContentBlock 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapImageContentBlock
```

### 接口 `MindMapImageUploadPatch`

源码：`src/core/model.ts:237`

后台图床上传完成后写回图片块的最小补丁。 只按稳定的节点和内容块 ID 合并图片字段，避免网络请求完成后用旧文档快照 覆盖用户在上传期间继续进行的节点编辑。

```ts
export interface MindMapImageUploadPatch
```

### 接口 `MindMapTableContentBlock`

源码：`src/core/model.ts:248`

A movable table block stored alongside text and images.

```ts
export interface MindMapTableContentBlock
```

### 接口 `MindMapCodeContentBlock`

源码：`src/core/model.ts:255`

A movable code block stored alongside text, images, and tables.

```ts
export interface MindMapCodeContentBlock
```

### 类型 `MindMapContentBlock`

源码：`src/core/model.ts:264`

MindMapContentBlock 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type MindMapContentBlock = MindMapTextContentBlock | MindMapImageContentBlock | MindMapTableContentBlock | MindMapCodeContentBlock;
```

### 接口 `MindMapSubmap`

源码：`src/core/model.ts:269`

MindMapSubmap 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSubmap
```

### 接口 `MindMapNavigation`

源码：`src/core/model.ts:277`

MindMapNavigation 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNavigation
```

### 接口 `MindMapAppearance`

源码：`src/core/model.ts:287`

MindMapAppearance 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapAppearance
```

### 接口 `MindMapNodeStyle`

源码：`src/core/model.ts:325`

MindMapNodeStyle 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNodeStyle
```

### 类型 `MindMapQuestionMode`

源码：`src/core/model.ts:341`

A structured question can be a choice, true-or-false, or long-form exercise.

```ts
export type MindMapQuestionMode = "choice" | "judgment" | "essay";
```

### 类型 `MindMapQuestionStatus`

源码：`src/core/model.ts:344`

Learning state used by question-bank filtering and review workflows.

```ts
export type MindMapQuestionStatus = "unanswered" | "completed" | "favorite" | "wrong" | "mastered";
```

### 接口 `MindMapQuestionOption`

源码：`src/core/model.ts:347`

A selectable answer item in a structured question.

```ts
export interface MindMapQuestionOption
```

### 接口 `MindMapQuestionSource`

源码：`src/core/model.ts:354`

Verifiable provenance for an original question found by an AI-assisted lookup.

```ts
export interface MindMapQuestionSource
```

### 接口 `MindMapQuestion`

源码：`src/core/model.ts:361`

Persisted question content attached to a mind-map node.

```ts
export interface MindMapQuestion
```

### 接口 `MindMapNode`

源码：`src/core/model.ts:378`

MindMapNode 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapNode
```

### 接口 `MindMapDocumentView`

源码：`src/core/model.ts:408`

MindMapDocumentView 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapDocumentView
```

### 接口 `MindMapDocument`

源码：`src/core/model.ts:424`

MindMapDocument 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapDocument
```

### 函数 `newId`

源码：`src/core/model.ts:442`

执行“new id”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function newId(): string
```

### 函数 `createNode`

源码：`src/core/model.ts:453`

创建node，并保持模型、界面和持久化状态的一致性。

```ts
export function createNode(text = "新节点"): MindMapNode
```

### 函数 `createQuestionOptions`

源码：`src/core/model.ts:458`

Creates the standard options used by choice and true-or-false questions.

```ts
function createQuestionOptions(mode: MindMapQuestionMode): MindMapQuestionOption[]
```

### 函数 `createMindMapQuestion`

源码：`src/core/model.ts:464`

Creates an editable structured question with a text block for every field.

```ts
export function createMindMapQuestion(mode: MindMapQuestionMode = "choice"): MindMapQuestion
```

### 函数 `createDefaultDocument`

源码：`src/core/model.ts:486`

创建default document，并保持模型、界面和持久化状态的一致性。

```ts
export function createDefaultDocument(title = "新思维导图"): MindMapDocument
```

### 函数 `normalizeColor`

源码：`src/core/model.ts:509`

校验并规范化color，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeColor(value: unknown): string | undefined
```

### 函数 `normalizeNumber`

源码：`src/core/model.ts:523`

校验并规范化number，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNumber(value: unknown, min: number, max: number): number | undefined
```

### 函数 `normalizeBooleanOverride`

源码：`src/core/model.ts:534`

校验并规范化boolean override，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeBooleanOverride(value: unknown): boolean | undefined
```

### 函数 `normalizeAppearance`

源码：`src/core/model.ts:544`

校验并规范化appearance，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeAppearance(input: Partial<MindMapAppearance> | undefined): MindMapAppearance | undefined
```

### 函数 `mergeAppearance`

源码：`src/core/model.ts:619`

合并appearance，并保持模型、界面和持久化状态的一致性。

```ts
export function mergeAppearance(base: MindMapAppearance | undefined, override: MindMapAppearance | undefined): MindMapAppearance
```

### 函数 `normalizeStyle`

源码：`src/core/model.ts:629`

校验并规范化style，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeStyle(input: Partial<MindMapNodeStyle> | undefined): MindMapNodeStyle | undefined
```

### 函数 `normalizeTextStyle`

源码：`src/core/model.ts:657`

校验并规范化text style，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTextStyle(input: Partial<MindMapTextStyle> | undefined): MindMapTextStyle | undefined
```

### 函数 `normalizeLinkTarget`

源码：`src/core/model.ts:672`

Keeps only link schemes that can be safely rendered as a clickable anchor.

```ts
function normalizeLinkTarget(input: unknown): string | undefined
```

### 函数 `textStyleKey`

源码：`src/core/model.ts:690`

执行“text style key”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function textStyleKey(style: MindMapTextStyle | undefined): string
```

### 函数 `normalizeRichText`

源码：`src/core/model.ts:701`

校验并规范化rich text，并保持模型、界面和持久化状态的一致性。

```ts
export function normalizeRichText(input: unknown, fallbackText = ""): MindMapTextRun[] | undefined
```

### 函数 `richTextPlainText`

源码：`src/core/model.ts:749`

执行“rich text plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextPlainText(runs: MindMapTextRun[] | undefined, fallbackText = ""): string
```

### 函数 `richTextCharacterStyles`

源码：`src/core/model.ts:760`

执行“rich text character styles”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextCharacterStyles(runs: MindMapTextRun[] | undefined, fallbackText = ""): MindMapTextStyle[]
```

### 函数 `characterStylesToRichText`

源码：`src/core/model.ts:781`

执行“character styles to rich text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function characterStylesToRichText(text: string, styles: MindMapTextStyle[]): MindMapTextRun[] | undefined
```

### 函数 `reconcileRichTextAfterEdit`

源码：`src/core/model.ts:806`

在纯文本被编辑后，尽可能保留原字符位置附近的富文本样式。它通过公共前缀和后缀映射样式，新增字符继承邻近样式，删除字符则自动丢弃对应区间。

```ts
export function reconcileRichTextAfterEdit( previousText: string, previousRuns: MindMapTextRun[] | undefined, nextText: string ): MindMapTextRun[] | undefined
```

### 函数 `applyRichTextStyleRange`

源码：`src/core/model.ts:842`

对字符半开区间应用或取消指定富文本样式，并重新合并连续、样式相同的文本段，避免产生大量碎片化运行段。

```ts
export function applyRichTextStyleRange( text: string, runs: MindMapTextRun[] | undefined, start: number, end: number, patch: Partial<MindMapTextStyle> | null ): MindMapTextRun[] | undefined
```

### 函数 `normalizeContentBlock`

源码：`src/core/model.ts:867`

校验并规范化content block，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeContentBlock(input: unknown): MindMapContentBlock | null
```

### 函数 `imageSourceCandidates`

源码：`src/core/model.ts:944`

为图片内容块构建有序、去重的加载候选列表。远程镜像按图床优先级排序，最后按设置选择本地地址，从而支持失效图床自动切换。

```ts
export function imageSourceCandidates(block: MindMapImageContentBlock, includeLocal = true, hostPriorityIds: readonly string[] = []): MindMapImageSourceCandidate[]
```

### 函数 `nodeContentBlocks`

源码：`src/core/model.ts:984`

执行“node content blocks”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodeContentBlocks(node: Pick<MindMapNode, "content" | "text" | "richText" | "image" | "table" | "code">): MindMapContentBlock[]
```

### 函数 `nodePlainText`

源码：`src/core/model.ts:1010`

执行“node plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodePlainText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string
```

### 函数 `nodePrimaryText`

源码：`src/core/model.ts:1021`

执行“node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodePrimaryText(node: Pick<MindMapNode, "content" | "text" | "richText" | "image">): string
```

### 函数 `syncNodeContentFields`

源码：`src/core/model.ts:1032`

将有序内容块同步到节点的文本摘要、单段富文本和首张图片字段。

```ts
export function syncNodeContentFields(node: MindMapNode): void
```

### 函数 `replaceNodeContentBlocks`

源码：`src/core/model.ts:1056`

使用调用方提供的有序内容块完整替换节点内容，并重新生成旧版兼容字段。 `nodeContentBlocks()` 会在迁移旧文档时把 `node.table` 与 `node.code` 补入缺少对应块的 `content`。因此编辑器执行“删除表格/代码块”时，必须先 清除这些旧版镜像字段，否则后续同步会把刚删除的块重新补回。

```ts
export function replaceNodeContentBlocks(node: MindMapNode, blocks: MindMapContentBlock[]): void
```

### 函数 `applyImageUploadPatches`

源码：`src/core/model.ts:1077`

将图床上传结果按节点和内容块 ID 合并到当前最新文档。 该函数不替换整份文档，也不使用上传开始时的旧快照。调用方应在网络请求 完成后把补丁应用到当前编辑器文档或重新读取的最新磁盘文档，以避免并发 自动上传造成最后写入覆盖和节点丢失。

```ts
export function applyImageUploadPatches(document: MindMapDocument, patches: readonly MindMapImageUploadPatch[]): number
```

### 函数 `isRemovableEmptyNode`

源码：`src/core/model.ts:1130`

判断一个非根节点是否只剩可安全清理的空壳。 内容删除后，子节点、备注、链接、子导图、图标、标签、题目和任务都仍是 独立语义，不能因为没有内容块而丢失。空白文字占位不视为有效内容。

```ts
export function isRemovableEmptyNode(node: Pick<MindMapNode, "content" | "text" | "richText" | "image" | "table" | "code" | "children" | "note" | "link" | "submap" | "icon" | "tags" | "question">): boolean
```

### 类型 `ContentBlockDropPosition`

源码：`src/core/model.ts:1143`

内容块相对目标块的放置位置；append 表示放到目标节点末尾。

```ts
export type ContentBlockDropPosition = "before" | "after" | "append";
```

### 函数 `moveNodeContentBlock`

源码：`src/core/model.ts:1156`

在同一节点内重排内容块，或把一个内容块移动到另一节点。

```ts
export function moveNodeContentBlock( root: MindMapNode, sourceNodeId: string, blockId: string, targetNodeId: string, targetBlockId: string | undefined, position: ContentBlockDropPosition ): boolean
```

### 函数 `normalizeCell`

源码：`src/core/model.ts:1215`

校验并规范化cell，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeCell(value: unknown): string
```

### 函数 `normalizeTable`

源码：`src/core/model.ts:1225`

校验并规范化table，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTable(input: Partial<MindMapTable> | undefined): MindMapTable | undefined
```

### 函数 `normalizeCode`

源码：`src/core/model.ts:1259`

校验并规范化code，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeCode(input: Partial<MindMapCodeBlock> | undefined): MindMapCodeBlock | undefined
```

### 函数 `normalizeSubmap`

源码：`src/core/model.ts:1282`

校验并规范化submap，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeSubmap(input: Partial<MindMapSubmap> | undefined): MindMapSubmap | undefined
```

### 函数 `normalizeNavigation`

源码：`src/core/model.ts:1296`

校验并规范化navigation，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNavigation(input: Partial<MindMapNavigation> | undefined): MindMapNavigation | undefined
```

### 函数 `normalizeTask`

源码：`src/core/model.ts:1312`

校验并规范化task，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTask(value: unknown): TaskStatus | undefined
```

### 函数 `normalizeTags`

源码：`src/core/model.ts:1322`

校验并规范化tags，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeTags(value: unknown): string[] | undefined
```

### 函数 `normalizeMindMapQuestion`

源码：`src/core/model.ts:1333`

Normalizes an untrusted structured-question payload from persisted JSON.

```ts
function normalizeMindMapQuestion(value: unknown): MindMapQuestion | undefined
```

### 函数 `syncMindMapQuestionFields`

源码：`src/core/model.ts:1387`

Mirrors question stem and tags into standard node fields used by existing renderers and exports.

```ts
export function syncMindMapQuestionFields(node: MindMapNode): void
```

### 函数 `normalizeNode`

源码：`src/core/model.ts:1401`

校验并规范化node，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeNode(input: Partial<MindMapNode> | undefined, fallbackText: string): MindMapNode
```

### 函数 `normalizeDocumentView`

源码：`src/core/model.ts:1457`

校验并规范化document view，并保持模型、界面和持久化状态的一致性。

```ts
function normalizeDocumentView(input: Partial<MindMapDocumentView> | undefined): MindMapDocumentView | undefined
```

### 函数 `normalizeArticleStyle`

源码：`src/core/model.ts:1484`

Normalizes per-document article presentation settings.

```ts
function normalizeArticleStyle(input: Partial<ArticleStyle> | undefined): ArticleStyle | undefined
```

### 函数 `normalizeDocument`

源码：`src/core/model.ts:1521`

把不完整的输入对象转换为当前 MindMapDocument。该函数会递归规范化节点、外观和视图状态，并保证根节点、数组及必需标识始终存在。

```ts
export function normalizeDocument(input: Partial<MindMapDocument> | undefined, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `serializeDocument`

源码：`src/core/model.ts:1543`

在保存前再次规范化文档，并输出带缩进的稳定 JSON。

```ts
export function serializeDocument(doc: MindMapDocument): string
```

### 函数 `parseJsonDocument`

源码：`src/core/model.ts:1555`

解析json document，并保持模型、界面和持久化状态的一致性。

```ts
function parseJsonDocument(value: string, fallbackTitle: string): MindMapDocument | null
```

### 函数 `extractFencedJson`

源码：`src/core/model.ts:1570`

执行“extract fenced json”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function extractFencedJson(source: string, language: string): string | null
```

### 函数 `parseDocument`

源码：`src/core/model.ts:1584`

解析磁盘中的 .mindmap 文本。优先识别原始 JSON 和当前 mindmap-json 围栏；解析失败时按 Markdown 导入，避免视图崩溃。

```ts
export function parseDocument(source: string, fallbackTitle = "思维导图"): MindMapDocument
```

### 函数 `cloneDocument`

源码：`src/core/model.ts:1606`

执行“clone document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function cloneDocument(doc: MindMapDocument): MindMapDocument
```

### 函数 `cloneNodeWithFreshIds`

源码：`src/core/model.ts:1616`

执行“clone node with fresh ids”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function cloneNodeWithFreshIds(node: MindMapNode): MindMapNode
```

### 函数 `extractFirstWikiLink`

源码：`src/core/model.ts:1630`

执行“extract first wiki link”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function extractFirstWikiLink(value: string): string | null
```

### 函数 `nodeSearchText`

源码：`src/core/model.ts:1641`

执行“node search text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function nodeSearchText(node: MindMapNode): string
```

### 函数 `escapeInlineMarkdown`

源码：`src/core/model.ts:1659`

转义inline markdown，并保持模型、界面和持久化状态的一致性。

```ts
function escapeInlineMarkdown(value: string): string
```

### 函数 `markdownInlineToRichText`

源码：`src/core/model.ts:1664`

Converts supported inline Markdown markers into the editor's rich-text model.

```ts
export function markdownInlineToRichText(value: string):
```

### 函数 `normalizeMarkdownRichText`

源码：`src/core/model.ts:1700`

Converts inline Markdown in unformatted runs while preserving styles applied by the editor. This keeps imported and manually entered node text on the same rich-text path.

```ts
export function normalizeMarkdownRichText( runs: MindMapTextRun[] | undefined, fallbackText: string ):
```

### 函数 `richTextToMarkdown`

源码：`src/core/model.ts:1734`

执行“rich text to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function richTextToMarkdown(runs: MindMapTextRun[] | undefined, fallbackText: string): string
```

### 函数 `tableToMarkdown`

源码：`src/core/model.ts:1757`

执行“table to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function tableToMarkdown(table: MindMapTable): string
```

### 函数 `splitMarkdownTableRow`

源码：`src/core/model.ts:1775`

执行“split markdown table row”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function splitMarkdownTableRow(line: string): string[]
```

### 函数 `parseMarkdownTable`

源码：`src/core/model.ts:1796`

解析markdown table，并保持模型、界面和持久化状态的一致性。

```ts
export function parseMarkdownTable(markdown: string): MindMapTable | null
```

### 函数 `parseFencedCode`

源码：`src/core/model.ts:1830`

解析fenced code，并保持模型、界面和持久化状态的一致性。

```ts
export function parseFencedCode(markdown: string): MindMapCodeBlock | null
```

### 函数 `childrenToTable`

源码：`src/core/model.ts:1842`

执行“children to table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function childrenToTable(node: MindMapNode): MindMapTable | null
```

### 函数 `documentToMarkdown`

源码：`src/core/model.ts:1863`

执行“document to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function documentToMarkdown(doc: MindMapDocument): string
```

### 函数 `sanitizeImportedMarkdownSource`

源码：`src/core/model.ts:1908`

删除 Markdown 文本末尾的 Obsidian 块 ID，并把块锚点链接退化为普通标签。

```ts
function sanitizeImportedMarkdownSource(value: string): string
```

### 函数 `isImportedNavigationAnchor`

源码：`src/core/model.ts:1917`

判断一整行是否只是指向 Obsidian 块 ID 的目录或顶部导航链接。

```ts
function isImportedNavigationAnchor(value: string): boolean
```

### 函数 `trimRichTextStart`

源码：`src/core/model.ts:1927`

从富文本运行段头部移除指定字符数，同时保留剩余字符样式。

```ts
function trimRichTextStart(runs: MindMapTextRun[] | undefined, count: number): MindMapTextRun[] | undefined
```

### 函数 `importedMarkdownText`

源码：`src/core/model.ts:1944`

将导入文本解析为富文本，并移除可重新生成的开头序号。

```ts
function importedMarkdownText(value: string):
```

### 函数 `markdownToDocument`

源码：`src/core/model.ts:1961`

执行“markdown to document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function markdownToDocument(markdown: string, fallbackTitle = "思维导图", options:
```

### 函数 `indentedTextToMarkdown`

源码：`src/core/model.ts:2254`

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

## `src/debug/runtime-debug.ts`

Bounded in-memory diagnostic log for navigation and user-interaction debugging.

### 接口 `RuntimeDebugEntry`

源码：`src/debug/runtime-debug.ts:6`

参见源码中的实现和调用位置。

```ts
export interface RuntimeDebugEntry
```

### 函数 `sanitizeDebugValue`

源码：`src/debug/runtime-debug.ts:22`

Converts runtime values into JSON-safe, bounded diagnostic details without copying document content.

```ts
function sanitizeDebugValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown
```

### 函数 `describeDebugTarget`

源码：`src/debug/runtime-debug.ts:49`

Describes an event target without recording editable text or document body content.

```ts
export function describeDebugTarget(target: EventTarget | null): Record<string, unknown> | null
```

### 类 `RuntimeDebugLog`

源码：`src/debug/runtime-debug.ts:68`

Keeps one bounded diagnostic session in memory and exports it as line-delimited JSON.

```ts
export class RuntimeDebugLog
```

### 方法 `RuntimeDebugLog.setEnabled`

源码：`src/debug/runtime-debug.ts:77`

Enables or disables collection. Enabling starts a fresh session.

```ts
setEnabled(enabled: boolean, reason = "settings"): void
```

### 方法 `RuntimeDebugLog.isEnabled`

源码：`src/debug/runtime-debug.ts:91`

Returns whether the current session accepts events.

```ts
isEnabled(): boolean
```

### 方法 `RuntimeDebugLog.log`

源码：`src/debug/runtime-debug.ts:96`

Appends one bounded structured event.

```ts
log(scope: string, event: string, details?: unknown): void
```

### 方法 `RuntimeDebugLog.logThrottled`

源码：`src/debug/runtime-debug.ts:112`

Appends an event no more frequently than the requested interval for the same key.

```ts
logThrottled(key: string, intervalMs: number, scope: string, event: string, details?: unknown): void
```

### 方法 `RuntimeDebugLog.exportText`

源码：`src/debug/runtime-debug.ts:122`

Exports the complete current session with environment and active-view metadata.

```ts
exportText(metadata: Record<string, unknown>): string
```

### 方法 `RuntimeDebugLog.size`

源码：`src/debug/runtime-debug.ts:135`

Number of retained events in the current session.

```ts
size(): number
```

## `src/editor/article-renderer.ts`

文章模式的目录、章节、正文和分页导航渲染器。

### 接口 `ArticleRendererOptions`

源码：`src/editor/article-renderer.ts:37`

文章渲染所需的编辑器状态和回调。

```ts
export interface ArticleRendererOptions
```

### 接口 `ArticleRenderController`

源码：`src/editor/article-renderer.ts:75`

Runtime handle for bounded article DOM expansion.

```ts
export interface ArticleRenderController
```

### 函数 `articleNodeContentBlocks`

源码：`src/editor/article-renderer.ts:86`

Normalizes one node at most once during a complete article render.

```ts
function articleNodeContentBlocks(node: MindMapNode, options: ArticleRendererOptions): MindMapContentBlock[]
```

### 函数 `articleNodePrimaryText`

源码：`src/editor/article-renderer.ts:97`

Reads the already-normalized first text block without rebuilding every block in a large document.

```ts
function articleNodePrimaryText(node: MindMapNode): string
```

### 函数 `articleNodeRenderBytes`

源码：`src/editor/article-renderer.ts:103`

Estimates the DOM work represented by one article node without serializing the complete node.

```ts
function articleNodeRenderBytes(info: ArticleNodeInfo): number
```

### 函数 `renderArticleMode`

源码：`src/editor/article-renderer.ts:133`

根据文档阅读样式和文章上下文渲染文章页的首个稳定窗口。

```ts
export function renderArticleMode(container: HTMLElement, options: ArticleRendererOptions): ArticleRenderController | null
```

### 函数 `renderArticleNodeSection`

源码：`src/editor/article-renderer.ts:265`

渲染一个完整文章节点及其内容和交互。

```ts
function renderArticleNodeSection( section: HTMLElement, info: ReturnType<typeof buildArticleNodeInfo>[number], options: ArticleRendererOptions ): void
```

### 函数 `createArticleContentBlock`

源码：`src/editor/article-renderer.ts:326`

Creates an article block shell for right-click targeting without adding a floating drag handle.

```ts
function createArticleContentBlock( container: HTMLElement, blockId: string, indentToParagraph = false ): HTMLElement
```

### 函数 `articleParagraphClass`

源码：`src/editor/article-renderer.ts:339`

Builds paragraph classes without changing the legacy first-line-indent default.

```ts
function articleParagraphClass(baseClass: string, block: MindMapTextContentBlock | undefined, bulleted = false, alignment: "flush" | "auto" = "auto"): string
```

### 函数 `applyArticleLeafBulletStyle`

源码：`src/editor/article-renderer.ts:344`

Applies the configured terminal bullet color and visual style to one article paragraph.

```ts
function applyArticleLeafBulletStyle(paragraph: HTMLElement, options: ArticleRendererOptions, numberedLeaf = false): void
```

### 函数 `applyArticleStyle`

源码：`src/editor/article-renderer.ts:351`

将解析后的阅读样式写入文章页 CSS 变量。

```ts
function applyArticleStyle(page: HTMLElement, style: ReturnType<typeof resolveArticleStyle>): void
```

### 函数 `renderDirectory`

源码：`src/editor/article-renderer.ts:362`

渲染文章目录页。

```ts
function renderDirectory(page: HTMLElement, options: ArticleRendererOptions): void
```

### 函数 `renderHeading`

源码：`src/editor/article-renderer.ts:386`

渲染章节标题或子导图链接。

```ts
function renderHeading(heading: HTMLElement, node: MindMapNode, title: string, options: ArticleRendererOptions): void
```

### 函数 `renderArticleNodeContent`

源码：`src/editor/article-renderer.ts:409`

渲染文章节点的正文块、图片、备注、表格和代码。

```ts
export function renderArticleNodeContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean, options: ArticleRendererOptions): void
```

### 函数 `renderArticleTable`

源码：`src/editor/article-renderer.ts:479`

Renders a persisted, resizable table block in article and continuous-reading views.

```ts
function renderArticleTable( container: HTMLElement, node: MindMapNode, tableData: MindMapTable, blockId: string, options: ArticleRendererOptions ): void
```

### 函数 `questionFieldHasContent`

源码：`src/editor/article-renderer.ts:548`

Returns whether a structured-question field contains visible text or an image.

```ts
function questionFieldHasContent(blocks: readonly MindMapContentBlock[]): boolean
```

### 函数 `renderQuestionFieldValue`

源码：`src/editor/article-renderer.ts:553`

Renders question text blocks with the same inline/display LaTeX rules as normal node text.

```ts
function renderQuestionFieldValue(container: HTMLElement, blocks: readonly MindMapContentBlock[]): void
```

### 函数 `renderArticleQuestionDetails`

源码：`src/editor/article-renderer.ts:567`

Renders structured question options, answers, explanations, and original source in article and reading modes.

```ts
function renderArticleQuestionDetails(container: HTMLElement, node: MindMapNode): void
```

### 函数 `renderArticlePager`

源码：`src/editor/article-renderer.ts:607`

渲染同层兄弟文章页的上一篇、父级、下一篇与阅读完成导航。

```ts
function renderArticlePager(page: HTMLElement, options: ArticleRendererOptions): void
```

## `src/editor/clipboard-import.ts`

编辑器剪贴板内容的节点分支解析。

### 函数 `parseClipboardContentBlocks`

源码：`src/editor/clipboard-import.ts:23`

将包含 fenced code 的剪贴板文本拆分为保持原顺序的文字块和代码块。

```ts
export function parseClipboardContentBlocks(text: string): MindMapContentBlock[] | null
```

### 函数 `parseClipboardNodes`

源码：`src/editor/clipboard-import.ts:49`

解析剪贴板载荷中的一个或多个 MindMap Studio 节点，并保留多选分支的复制顺序。

```ts
export function parseClipboardNodes(text: string): MindMapNode[] | null
```

### 函数 `parseClipboardHtml`

源码：`src/editor/clipboard-import.ts:89`

解析富剪贴板提供的嵌套 HTML 列表。

```ts
export function parseClipboardHtml(html: string): MindMapNode | null
```

## `src/editor/content-modals.ts`

编辑器领域的表格与代码块弹窗。

### 函数 `cloneTable`

源码：`src/editor/content-modals.ts:32`

执行“clone table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function cloneTable(table: MindMapTable | undefined): MindMapTable
```

### 类 `TableEditModal`

源码：`src/editor/content-modals.ts:47`

TableEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class TableEditModal extends Modal
```

### 构造函数 `TableEditModal.constructor`

源码：`src/editor/content-modals.ts:60`

创建 TableEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, table: MindMapTable | undefined, submit: (table: MindMapTable) => void)
```

### 方法 `TableEditModal.onOpen`

源码：`src/editor/content-modals.ts:69`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `TableEditModal.renderGrid`

源码：`src/editor/content-modals.ts:161`

渲染grid，并保持模型、界面和持久化状态的一致性。

```ts
private renderGrid(): void
```

### 方法 `TableEditModal.collectGrid`

源码：`src/editor/content-modals.ts:188`

遍历并收集grid，并保持模型、界面和持久化状态的一致性。

```ts
private collectGrid(): void
```

### 类 `CodeEditModal`

源码：`src/editor/content-modals.ts:212`

CodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class CodeEditModal extends Modal
```

### 构造函数 `CodeEditModal.constructor`

源码：`src/editor/content-modals.ts:223`

创建 CodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, block: MindMapCodeBlock | undefined, submit: (block: MindMapCodeBlock) => void)
```

### 方法 `CodeEditModal.onOpen`

源码：`src/editor/content-modals.ts:232`

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
export function resolveDropPosition(pointer: DropPointer, rect: DropTargetRect, targetIsRoot: boolean)
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

源码：`src/editor/editor-modals.ts:22`

选择一个或多个图片上传目标。

```ts
class ImageHostPickerModal extends Modal
```

### 构造函数 `ImageHostPickerModal.constructor`

源码：`src/editor/editor-modals.ts:34`

创建图床选择弹窗。

```ts
constructor( app: App, private readonly hosts: ImageHostChoice[], initialIds: string[], private readonly resolveSelection: (ids: string[] | null) => void )
```

### 方法 `ImageHostPickerModal.onOpen`

源码：`src/editor/editor-modals.ts:47`

创建图床多选列表。

```ts
onOpen(): void
```

### 方法 `ImageHostPickerModal.onClose`

源码：`src/editor/editor-modals.ts:83`

未确认时返回取消结果。

```ts
onClose(): void
```

### 函数 `chooseImageHosts`

源码：`src/editor/editor-modals.ts:96`

打开图床选择器，并过滤已经失效的默认 ID。

```ts
export function chooseImageHosts( app: App, hosts: ImageHostChoice[], initialIds: string[] ): Promise<string[] | null>
```

### 类 `ImagePreviewModal`

源码：`src/editor/editor-modals.ts:115`

提供图片缩放和滚轮预览。

```ts
export class ImagePreviewModal extends Modal
```

### 构造函数 `ImagePreviewModal.constructor`

源码：`src/editor/editor-modals.ts:127`

创建图片预览弹窗。

```ts
constructor( app: App, private readonly source: string, private readonly alt: string, private readonly sources: MindMapImageSourceCandidate[] = [], private readonly resolveSource?: (source: string) => string | null )
```

### 方法 `ImagePreviewModal.onOpen`

源码：`src/editor/editor-modals.ts:140`

创建图片预览界面和缩放控制。

```ts
onOpen(): void
```

### 接口 `FormulaInsertValue`

源码：`src/editor/editor-modals.ts:229`

LaTeX 插入结果，display 为 true 时使用独立公式，false 时使用行内公式。

```ts
export interface FormulaInsertValue
```

### 类 `FormulaEditModal`

源码：`src/editor/editor-modals.ts:237`

图形化 LaTeX 公式编辑器，提供常用结构、行内/独立模式和实时预览。

```ts
export class FormulaEditModal extends Modal
```

### 构造函数 `FormulaEditModal.constructor`

源码：`src/editor/editor-modals.ts:245`

创建公式编辑器。

```ts
constructor( app: App, private readonly submit: (value: FormulaInsertValue) => void, private readonly defaultDisplay = false )
```

### 方法 `FormulaEditModal.onOpen`

源码：`src/editor/editor-modals.ts:256`

创建公式模板、源码输入和 MathJax 预览。

```ts
onOpen(): void
```

### 方法 `FormulaEditModal.onClose`

源码：`src/editor/editor-modals.ts:368`

清理公式编辑器 DOM。

```ts
onClose(): void
```

### 类 `ImportExportModal`

源码：`src/editor/editor-modals.ts:376`

导入、导出或合并思维导图 JSON。

```ts
export class ImportExportModal extends Modal
```

### 构造函数 `ImportExportModal.constructor`

源码：`src/editor/editor-modals.ts:385`

创建 JSON 传输弹窗。

```ts
constructor( app: App, private readonly document: MindMapDocument, private readonly onImport: (document: MindMapDocument, mode: "child" | "replace") => void, private readonly onExportJson: (json: string) => void, private readonly onExportDocument: (format: …
```

### 方法 `ImportExportModal.onOpen`

源码：`src/editor/editor-modals.ts:403`

创建 JSON 文本区和文件导入操作。

```ts
onOpen(): void
```

### 方法 `ImportExportModal.onClose`

源码：`src/editor/editor-modals.ts:562`

Clears import/export controls when the modal closes.

```ts
onClose(): void
```

### 类 `OutlineModal`

源码：`src/editor/editor-modals.ts:570`

显示只读 Markdown 大纲并提供复制和导出入口。

```ts
export class OutlineModal extends Modal
```

### 构造函数 `OutlineModal.constructor`

源码：`src/editor/editor-modals.ts:578`

创建 Markdown 大纲弹窗。

```ts
constructor(app: App, private readonly markdown: string, private readonly onExport: () => void)
```

### 方法 `OutlineModal.onOpen`

源码：`src/editor/editor-modals.ts:585`

创建大纲内容和操作按钮。

```ts
onOpen(): void
```

### 方法 `OutlineModal.onClose`

源码：`src/editor/editor-modals.ts:606`

清理大纲弹窗 DOM。

```ts
onClose(): void
```

## `src/editor/editor-types.ts`

编辑器领域与 Obsidian 宿主层之间的稳定类型契约。

### 接口 `MindMapEditorChangeOptions`

源码：`src/editor/editor-types.ts:25`

Controls host-side work after an editor document change.

```ts
export interface MindMapEditorChangeOptions
```

### 接口 `MindMapEditorCallbacks`

源码：`src/editor/editor-types.ts:36`

Host services consumed by the editor. Keeping these callbacks outside the editor implementation makes the UI testable without constructing the complete Obsidian plugin.

```ts
export interface MindMapEditorCallbacks
```

### 接口 `MindMapEditorOptions`

源码：`src/editor/editor-types.ts:80`

Runtime editor configuration assembled by the view/plugin layer.

```ts
export interface MindMapEditorOptions
```

## `src/editor/editor.ts`

编辑器领域的核心交互控制器。

### 接口 `ScreenshotInsertionTarget`

源码：`src/editor/editor.ts:129`

NodeEditValues 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface ScreenshotInsertionTarget
```

### 接口 `NodeEditValues`

源码：`src/editor/editor.ts:165`

节点编辑弹窗读写的完整字段集合。

```ts
interface NodeEditValues
```

### 接口 `ArticleNumberingValues`

源码：`src/editor/editor.ts:188`

当前节点或中心节点保存的文章编号覆盖设置。

```ts
interface ArticleNumberingValues
```

### 接口 `ArticleNumberingControls`

源码：`src/editor/editor.ts:194`

文章编号控件返回的读取句柄。

```ts
interface ArticleNumberingControls
```

### 接口 `ReadingStyleDefaults`

源码：`src/editor/editor.ts:199`

插件级阅读样式默认值；当前页面可在“主题与外观”中覆盖。

```ts
interface ReadingStyleDefaults
```

### 接口 `ReadingStyleControls`

源码：`src/editor/editor.ts:210`

“阅读样式”控件在提交时返回的读取句柄。

```ts
interface ReadingStyleControls
```

### 函数 `createReadingStyleControls`

源码：`src/editor/editor.ts:222`

创建文章与通读共用的阅读样式控件。

```ts
function createReadingStyleControls( container: HTMLElement, style: ArticleStyle | undefined, globalDefaults: ReadingStyleDefaults ): ReadingStyleControls
```

### 类型 `ArticleClickMove`

源码：`src/editor/editor.ts:342`

文章编辑工具栏发起的点击选点移动；块移动与整节点移动必须保持独立状态。

```ts
type ArticleClickMove = |
```

### 函数 `createArticleNumberingControls`

源码：`src/editor/editor.ts:357`

创建节点编辑与“主题与外观”共用的文章编号控件，确保两处设置语义和文案一致。 中心节点选择关闭时禁用当前物理导图的全部文章编号；普通节点选择关闭时只跳过该节点。 手动层级表示当前节点所在子树的最高文章层级；中心节点本身不编号，一级子节点直接使用所选层级。

```ts
function createArticleNumberingControls( container: HTMLElement, currentMode: ArticleNumberingMode | undefined, currentLevel: number | undefined, onChange?: () => void ): ArticleNumberingControls
```

### 类 `NodeEditModal`

源码：`src/editor/editor.ts:409`

NodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class NodeEditModal extends Modal
```

### 构造函数 `NodeEditModal.constructor`

源码：`src/editor/editor.ts:433`

创建 NodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, node: MindMapNode, defaultShape: NodeShape, callbacks: Pick<MindMapEditorCallbacks, "resolveImage" | "onSavePastedImage" | "getImageHosts" | "getDefaultUploadHostIds" | "onUploadImage" | "onReadImageSource" | "onScheduleAutoUpload">, …
```

### 方法 `NodeEditModal.onOpen`

源码：`src/editor/editor.ts:454`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `NodeEditModal.onClose`

源码：`src/editor/editor.ts:956`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 方法 `NodeEditModal.releaseKeyboardScope`

源码：`src/editor/editor.ts:969`

右侧面板与画布快速输入并存时，释放 Modal 的全局按键作用域。

```ts
releaseKeyboardScope(): void
```

### 类 `AppearanceModal`

源码：`src/editor/editor.ts:977`

AppearanceModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
class AppearanceModal extends Modal
```

### 构造函数 `AppearanceModal.constructor`

源码：`src/editor/editor.ts:1001`

创建 AppearanceModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, appearance: MindMapAppearance, numbering: ArticleNumberingValues, articleTocMaxDepth: number | undefined, globalArticleTocMaxDepth: number, articleMiniMap: boolean | undefined, globalArticleMiniMap: boolean, pageCodeAppearance: MindMa…
```

### 方法 `AppearanceModal.onOpen`

源码：`src/editor/editor.ts:1032`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 类 `MindMapEditor`

源码：`src/editor/editor.ts:1377`

MindMapEditor 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapEditor
```

### 构造函数 `MindMapEditor.constructor`

源码：`src/editor/editor.ts:1492`

创建 MindMapEditor 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, host: HTMLElement, document: MindMapDocument, callbacks: MindMapEditorCallbacks, options: MindMapEditorOptions)
```

### 方法 `MindMapEditor.destroy`

源码：`src/editor/editor.ts:1525`

执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
destroy(): void
```

### 方法 `MindMapEditor.setDocument`

源码：`src/editor/editor.ts:1564`

更新并应用document，并保持模型、界面和持久化状态的一致性。

```ts
setDocument(document: MindMapDocument, resetHistory = true, options?: MindMapEditorOptions): void
```

### 方法 `MindMapEditor.setOptions`

源码：`src/editor/editor.ts:1609`

更新编辑器运行参数。文章族上下文或持久化阅读位置在异步加载完成后变化时， 会重新解析节点并恢复到同一语义位置，而不是恢复旧的像素滚动值。

```ts
setOptions(options: MindMapEditorOptions, articleContextOnly = false): void
```

### 方法 `MindMapEditor.waitForTransitionPaint`

源码：`src/editor/editor.ts:1774`

Waits until the transition overlay has had a chance to paint before starting expensive work.

```ts
private waitForTransitionPaint(): Promise<void>
```

### 方法 `MindMapEditor.beginPageTransition`

源码：`src/editor/editor.ts:1781`

Displays a blocking, semantic page transition and returns the latest-wins token.

```ts
private async beginPageTransition(title: string, description: string, icon = "loader-circle"): Promise<number>
```

### 方法 `MindMapEditor.updatePageTransition`

源码：`src/editor/editor.ts:1799`

Updates an already visible transition without resetting its animation.

```ts
private updatePageTransition(token: number, title: string, description: string, icon?: string): void
```

### 方法 `MindMapEditor.finishPageTransition`

源码：`src/editor/editor.ts:1810`

Fades out the current transition and reveals the newly mounted page.

```ts
private finishPageTransition(token: number): void
```

### 方法 `MindMapEditor.playPageEnterTransition`

源码：`src/editor/editor.ts:1826`

Adds a short entrance animation only to the newly active content surface.

```ts
private playPageEnterTransition(): void
```

### 方法 `MindMapEditor.navigateWithTransition`

源码：`src/editor/editor.ts:1845`

Runs a cross-file navigation behind a painted transition overlay.

```ts
private async navigateWithTransition( action: () => void | Promise<void>, title = "正在切换导图…", description = "正在保存当前位置并加载目标页面" ): Promise<void>
```

### 方法 `MindMapEditor.setDisplayMode`

源码：`src/editor/editor.ts:1865`

切换显示模式，并将当前语义位置同步到目标模式。通读中的目标属于子导图时， 回调会在全局模式切换后打开对应物理文件并定位节点。

```ts
setDisplayMode(mode: DisplayMode, notifyGlobal = true, persistCapturedLocation = true): void
```

### 方法 `MindMapEditor.transitionDisplayMode`

源码：`src/editor/editor.ts:1871`

Paints a transition before rendering a potentially large target mode.

```ts
private async transitionDisplayMode(mode: DisplayMode, notifyGlobal: boolean, persistCapturedLocation: boolean): Promise<void>
```

### 方法 `MindMapEditor.applyDisplayMode`

源码：`src/editor/editor.ts:1889`

Applies a display mode immediately after its transition has painted.

```ts
private applyDisplayMode(mode: DisplayMode, notifyGlobal = true, persistCapturedLocation = true): void
```

### 方法 `MindMapEditor.applyGlobalDisplayMode`

源码：`src/editor/editor.ts:1934`

应用其他已打开视图发出的全局模式切换，同时保留本视图自己的阅读位置。

```ts
applyGlobalDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapEditor.readingLocationSections`

源码：`src/editor/editor.ts:1950`

返回包含当前未保存文档的最新文章族快照。

```ts
private readingLocationSections(options: MindMapEditorOptions = this.options)
```

### 方法 `MindMapEditor.resolveStoredLocation`

源码：`src/editor/editor.ts:1961`

解析上次保存的位置，并在节点失效时逐级回退。

```ts
private resolveStoredLocation(): ResolvedReadingLocation | null
```

### 方法 `MindMapEditor.captureCurrentLocation`

源码：`src/editor/editor.ts:1970`

从当前模式的选择或滚动视口中提取统一语义位置。

```ts
private captureCurrentLocation(mode: DisplayMode): ReadingLocation | null
```

### 方法 `MindMapEditor.rememberLocation`

源码：`src/editor/editor.ts:2017`

将统一位置写回插件设置；滚动过程会去重并延迟写盘。

```ts
private rememberLocation(location: ReadingLocation, immediate = false): void
```

### 方法 `MindMapEditor.rememberCurrentLocation`

源码：`src/editor/editor.ts:2033`

捕获当前模式位置并按需立即保存。

```ts
private rememberCurrentLocation(mode: DisplayMode, immediate = false): ReadingLocation | null
```

### 方法 `MindMapEditor.scheduleReadingLocationCapture`

源码：`src/editor/editor.ts:2040`

对滚动事件进行轻量防抖，避免每个像素变化都扫描章节 DOM。

```ts
private scheduleReadingLocationCapture(mode: DisplayMode): void
```

### 方法 `MindMapEditor.blockReadingLocationCapture`

源码：`src/editor/editor.ts:2056`

在程序主动恢复滚动位置期间暂停滚动采集。 修改 `scrollTop` 同样会触发 scroll 事件；若把它当成用户滚动重新保存， 会形成“恢复 → 采集 → 保存 → 再恢复”的位置反馈环。

```ts
private blockReadingLocationCapture(): void
```

### 方法 `MindMapEditor.cancelReadingLocationRestore`

源码：`src/editor/editor.ts:2070`

Clears all delayed work owned by the current semantic scroll transaction.

```ts
private cancelReadingLocationRestore(): void
```

### 方法 `MindMapEditor.finishReadingLocationRestore`

源码：`src/editor/editor.ts:2084`

Finishes one still-current semantic scroll transaction without invalidating newer work.

```ts
private finishReadingLocationRestore(token: number): void
```

### 方法 `MindMapEditor.beginReadingLocationRestore`

源码：`src/editor/editor.ts:2098`

Keeps the selected semantic anchor stable until late article layout changes become quiet.

```ts
private beginReadingLocationRestore( mode: DisplayMode, location: ReadingLocation, resolved: ResolvedReadingLocation ): void
```

### 方法 `MindMapEditor.restoreReadingLocation`

源码：`src/editor/editor.ts:2150`

在目标模式中恢复节点和节点内部比例。目标位于其他物理文件时只返回解析结果， 由视图层在模式同步完成后打开该文件。每次调用都会使旧重试失效，确保最后一次导航独占滚动位置。

```ts
private restoreReadingLocation(mode: DisplayMode, location: ReadingLocation | null | undefined): ResolvedReadingLocation | null
```

### 方法 `MindMapEditor.applyResolvedReadingLocation`

源码：`src/editor/editor.ts:2188`

把已解析的语义位置应用到当前 DOM；目标不存在时返回 false。

```ts
private applyResolvedReadingLocation(mode: DisplayMode, resolved: ResolvedReadingLocation): boolean
```

### 方法 `MindMapEditor.toggleReadOnly`

源码：`src/editor/editor.ts:2233`

切换read only，并保持模型、界面和持久化状态的一致性。

```ts
toggleReadOnly(): void
```

### 方法 `MindMapEditor.askAi`

源码：`src/editor/editor.ts:2282`

使用最近一次右键范围询问 AI；未右键节点时默认询问当前页面。

```ts
askAi(): void
```

### 方法 `MindMapEditor.getDocument`

源码：`src/editor/editor.ts:2291`

读取并返回document，并保持模型、界面和持久化状态的一致性。

```ts
getDocument(): MindMapDocument
```

### 方法 `MindMapEditor.applyImageUploadPatches`

源码：`src/editor/editor.ts:2302`

把后台图床上传结果合并到编辑器当前最新文档，不替换用户在上传期间继续编辑的节点树。

```ts
applyImageUploadPatches(patches: readonly MindMapImageUploadPatch[]): number
```

### 方法 `MindMapEditor.previewAiEdit`

源码：`src/editor/editor.ts:2312`

根据当前页面或节点范围生成 AI Markdown 修改预览，不直接修改文档。

```ts
previewAiEdit(responseText: string, scopeNodeId?: string): AiEditPreview
```

### 方法 `MindMapEditor.applyAiEdit`

源码：`src/editor/editor.ts:2317`

应用用户确认的 AI 修改预览，并写入撤销历史。

```ts
applyAiEdit(preview: AiEditPreview): boolean
```

### 方法 `MindMapEditor.previewLocalReplace`

源码：`src/editor/editor.ts:2331`

预览当前页面或节点子树中的本地文字替换，不调用任何 AI 接口。

```ts
previewLocalReplace(query: string, replacement: string, caseSensitive = false, scopeNodeId?: string): LocalReplacePreview
```

### 方法 `MindMapEditor.applyLocalReplace`

源码：`src/editor/editor.ts:2336`

应用用户确认的本地文字替换，并写入撤销历史。

```ts
applyLocalReplace(preview: LocalReplacePreview): boolean
```

### 方法 `MindMapEditor.captureScreenshot`

源码：`src/editor/editor.ts:2350`

启动截图编辑器；普通截图与截图并识别使用完全独立的调用链。

```ts
async captureScreenshot(recognizeAfter = false, targetOverride?: ScreenshotInsertionTarget): Promise<void>
```

### 方法 `MindMapEditor.recognizeCapturedScreenshotToClipboard`

源码：`src/editor/editor.ts:2409`

识别截图编辑器中的当前选区，并把纯文字结果复制到系统剪贴板。

```ts
private async recognizeCapturedScreenshotToClipboard(blob: Blob): Promise<void>
```

### 方法 `MindMapEditor.screenshotInsertionTarget`

源码：`src/editor/editor.ts:2425`

返回截图操作开始前实际聚焦的节点或文章段落；命令面板等外部焦点返回 null。

```ts
private screenshotInsertionTarget(): ScreenshotInsertionTarget | null
```

### 方法 `MindMapEditor.recognizeImageBlock`

源码：`src/editor/editor.ts:2451`

识别指定图片；直接确认时后台替换，否则打开原图/文字对比预览。

```ts
private async recognizeImageBlock(nodeId: string, blockId: string): Promise<void>
```

### 方法 `MindMapEditor.previewImageTextReplacements`

源码：`src/editor/editor.ts:2480`

为 AI 助手的每张识图结果创建独立且可校验的原位替换预览。

```ts
previewImageTextReplacements(items: ImageRecognitionItemResult[]): ImageTextReplacementPreview[]
```

### 方法 `MindMapEditor.applyImageTextReplacements`

源码：`src/editor/editor.ts:2485`

应用用户确认的图片转文字预览，并统一接入撤销、保存和聚焦。

```ts
async applyImageTextReplacements(previews: ImageTextReplacementPreview[]): Promise<boolean>
```

### 方法 `MindMapEditor.applyImageRecognitionPreview`

源码：`src/editor/editor.ts:2504`

应用单张图片识别预览。

```ts
private applyImageRecognitionPreview(preview: ImageTextReplacementPreview): Promise<boolean>
```

### 方法 `MindMapEditor.autoUploadScheduleMessage`

源码：`src/editor/editor.ts:2509`

格式化粘贴和截图后的自动上传提示。

```ts
private autoUploadScheduleMessage(): string
```

### 方法 `MindMapEditor.recoverPastedImagePostCommit`

源码：`src/editor/editor.ts:2519`

Recovers the save notification and redraw after a pasted image has already been committed to the in-memory document. A transient synchronous failure must not be reported as an image-paste failure or roll back the image.

```ts
private recoverPastedImagePostCommit(): void
```

### 方法 `MindMapEditor.markSaved`

源码：`src/editor/editor.ts:2542`

执行“mark saved”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
markSaved(): void
```

### 方法 `MindMapEditor.markSaving`

源码：`src/editor/editor.ts:2550`

执行“mark saving”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
markSaving(): void
```

### 方法 `MindMapEditor.focus`

源码：`src/editor/editor.ts:2559`

定位相关数据，并保持模型、界面和持久化状态的一致性。

```ts
focus(): void
```

### 方法 `MindMapEditor.focusNodeById`

源码：`src/editor/editor.ts:2568`

定位node by id，并保持模型、界面和持久化状态的一致性。

```ts
focusNodeById(id: string, persistLocation = true): void
```

### 方法 `MindMapEditor.showArticleDirectory`

源码：`src/editor/editor.ts:2575`

Switches the current top-level document to its generated article directory.

```ts
showArticleDirectory(focusNodeId?: string): void
```

### 方法 `MindMapEditor.buildUi`

源码：`src/editor/editor.ts:2598`

构建ui，并保持模型、界面和持久化状态的一致性。

```ts
private buildUi(): void
```

### 方法 `MindMapEditor.resolveMode`

源码：`src/editor/editor.ts:2996`

解析并确定mode，并保持模型、界面和持久化状态的一致性。

```ts
private resolveMode(preferred: DisplayMode): DisplayMode
```

### 方法 `MindMapEditor.persistReadOnlyState`

源码：`src/editor/editor.ts:3004`

执行“persist read only state”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private persistReadOnlyState(): void
```

### 方法 `MindMapEditor.rememberArticleReadOnlyState`

源码：`src/editor/editor.ts:3018`

Persists article mode's own lock state without writing it into the current mind-map document.

```ts
private rememberArticleReadOnlyState(): void
```

### 方法 `MindMapEditor.applyReadOnlyStateToRenderedContent`

源码：`src/editor/editor.ts:3025`

Updates edit affordances in the existing DOM without rebuilding the map or article.

```ts
private applyReadOnlyStateToRenderedContent(): void
```

### 方法 `MindMapEditor.updateModeUi`

源码：`src/editor/editor.ts:3045`

执行“update mode ui”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private updateModeUi(): void
```

### 方法 `MindMapEditor.ensureEditable`

源码：`src/editor/editor.ts:3087`

执行“ensure editable”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private ensureEditable(): boolean
```

### 方法 `MindMapEditor.clearImageLoadTimers`

源码：`src/editor/editor.ts:3096`

执行“clear image load timers”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private clearImageLoadTimers(): void
```

### 方法 `MindMapEditor.toolbarItemAvailable`

源码：`src/editor/editor.ts:3102`

Returns whether one configured toolbar action can perform a meaningful operation now.

```ts
private toolbarItemAvailable(id: ToolbarItemId): boolean
```

### 方法 `MindMapEditor.updateToolbarAvailability`

源码：`src/editor/editor.ts:3146`

Hides actions that cannot currently run and marks visual group starts after filtering, so the toolbar contracts smoothly instead of leaving disabled icons.

```ts
private updateToolbarAvailability(animate = true): void
```

### 方法 `MindMapEditor.updateAiScopeButton`

源码：`src/editor/editor.ts:3178`

更新 AI 工具栏提示，使用户知道下一次提问会使用页面还是右键节点。

```ts
private updateAiScopeButton(): void
```

### 方法 `MindMapEditor.addToolbarButton`

源码：`src/editor/editor.ts:3199`

添加toolbar button，并保持模型、界面和持久化状态的一致性。

```ts
private addToolbarButton(id: ToolbarItemId, icon: string, label: string, action: () => void, editOnly = false): HTMLButtonElement
```

### 方法 `MindMapEditor.applyToolbarOrder`

源码：`src/editor/editor.ts:3219`

Applies the user-defined order to toolbar buttons.

```ts
private applyToolbarOrder(): void
```

### 方法 `MindMapEditor.getAppearance`

源码：`src/editor/editor.ts:3236`

读取并返回appearance，并保持模型、界面和持久化状态的一致性。

```ts
private getAppearance(): MindMapAppearance
```

### 方法 `MindMapEditor.fontFamilyCss`

源码：`src/editor/editor.ts:3246`

执行“font family css”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private fontFamilyCss(appearance: MindMapAppearance): string
```

### 方法 `MindMapEditor.applyAppearance`

源码：`src/editor/editor.ts:3259`

应用appearance，并保持模型、界面和持久化状态的一致性。

```ts
private applyAppearance(appearance: MindMapAppearance): void
```

### 方法 `MindMapEditor.renderNavigation`

源码：`src/editor/editor.ts:3285`

在画布左上角或文档顶部渲染父子导图导航。导图模式使用固定悬浮面包屑，文章和大纲模式使用文档流导航，均保持当前全局显示模式。

```ts
private renderNavigation(): void
```

### 方法 `MindMapEditor.updateNodeTextBlock`

源码：`src/editor/editor.ts:3359`

更新指定文字块；未提供块标识时兼容更新节点的首个文字块。

```ts
private updateNodeTextBlock( node: MindMapNode, value:
```

### 方法 `MindMapEditor.makeInlineEditable`

源码：`src/editor/editor.ts:3399`

创建并配置inline editable，并保持模型、界面和持久化状态的一致性。

```ts
private makeInlineEditable(element: HTMLElement, node: MindMapNode, placeholder: string, blockId?: string): void
```

### 方法 `MindMapEditor.applyInlineEditingAccessibility`

源码：`src/editor/editor.ts:3498`

Adds textbox semantics only while an inline line is actively editable.

```ts
private applyInlineEditingAccessibility(element: HTMLElement): void
```

### 方法 `MindMapEditor.clearInlineEditingAccessibility`

源码：`src/editor/editor.ts:3504`

Removes edit-only semantics so Obsidian does not show hover tooltips on reading text.

```ts
private clearInlineEditingAccessibility(element: HTMLElement): void
```

### 方法 `MindMapEditor.activateInlineEditable`

源码：`src/editor/editor.ts:3513`

Activates one article or outline line without changing the surrounding layout, optionally reclaiming focus after a context menu closes.

```ts
private activateInlineEditable(element: HTMLElement, focus = true, protectInitialFocus = false): void
```

### 方法 `MindMapEditor.makeInlineCodeEditable`

源码：`src/editor/editor.ts:3539`

Activates direct code editing for a code block rendered in article mode.

```ts
private makeInlineCodeEditable(element: HTMLElement, node: MindMapNode, code: MindMapCodeBlock, blockId: string): void
```

### 方法 `MindMapEditor.addInlineNodeActions`

源码：`src/editor/editor.ts:3600`

添加inline node actions，并保持模型、界面和持久化状态的一致性。

```ts
private addInlineNodeActions(container: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.startArticleBlockClickMove`

源码：`src/editor/editor.ts:3638`

从当前文章文字或代码编辑器进入“选择目标节点后追加当前块”的模式。

```ts
private startArticleBlockClickMove(nodeId: string, preferredBlockId?: string): void
```

### 方法 `MindMapEditor.startArticleNodeClickMove`

源码：`src/editor/editor.ts:3662`

从文章编辑工具栏进入“选择目标节点后插入其后”的单节点移动模式。

```ts
private startArticleNodeClickMove(nodeId: string): void
```

### 方法 `MindMapEditor.demoteArticleNode`

源码：`src/editor/editor.ts:3678`

将当前文章节点降为同级上一个节点的子节点，保留全部内容、子树和元数据。

```ts
private demoteArticleNode(nodeId: string): void
```

### 方法 `MindMapEditor.promoteArticleNode`

源码：`src/editor/editor.ts:3692`

将当前文章节点升为其父节点的同级节点，并紧跟在父节点之后。

```ts
private promoteArticleNode(nodeId: string): void
```

### 方法 `MindMapEditor.completeArticleClickMove`

源码：`src/editor/editor.ts:3705`

完成工具栏发起的点击移动；非法目标保持待选状态，便于重新选择。

```ts
private completeArticleClickMove( targetNodeId: string, targetBlockId?: string, position?: "before" | "after" ): void
```

### 方法 `MindMapEditor.articleClickMoveTargetAllowed`

源码：`src/editor/editor.ts:3737`

判断一个文章节点能否作为当前点击移动的目标。

```ts
private articleClickMoveTargetAllowed(pending: ArticleClickMove, targetNodeId: string): boolean
```

### 方法 `MindMapEditor.articleBlockMoveTargetAllowed`

源码：`src/editor/editor.ts:3749`

判断一个内容块能否作为文章块移动的精确前后插入目标。

```ts
private articleBlockMoveTargetAllowed(pending: Extract<ArticleClickMove,
```

### 方法 `MindMapEditor.applyArticleClickMoveUi`

源码：`src/editor/editor.ts:3756`

绘制点击移动提示与目标可用状态；文档重绘后可安全重复调用。

```ts
private applyArticleClickMoveUi(): void
```

### 方法 `MindMapEditor.cancelArticleClickMove`

源码：`src/editor/editor.ts:3791`

取消文章点击移动并清除提示，不修改文档。

```ts
private cancelArticleClickMove(): void
```

### 方法 `MindMapEditor.clearArticleClickMoveUi`

源码：`src/editor/editor.ts:3798`

清理点击移动的临时 DOM；可选择是否同时移除根状态。

```ts
private clearArticleClickMoveUi(clearRoot = true): void
```

### 方法 `MindMapEditor.clearArticleBlockMoveIndicators`

源码：`src/editor/editor.ts:3815`

清除文章块移动时随鼠标显示的前后插入线。

```ts
private clearArticleBlockMoveIndicators(): void
```

### 方法 `MindMapEditor.renderOutline`

源码：`src/editor/editor.ts:3824`

按照节点层级渲染可编辑大纲。节点标题、备注和子导图链接仍映射到同一份数据，任何修改都会通过统一变更链同步到导图和文章模式。

```ts
private renderOutline(): void
```

### 方法 `MindMapEditor.renderArticle`

源码：`src/editor/editor.ts:3849`

渲染文章目录页、章节编号、正文和跨子导图链接。顶层父导图可展示递归目录；子导图根据文章上下文继续父级编号。

```ts
private renderArticle(): void
```

### 方法 `MindMapEditor.renderArticleSkeleton`

源码：`src/editor/editor.ts:3969`

Paints a bounded article skeleton before the first real target window is mounted.

```ts
private renderArticleSkeleton(target: "toc" | "article" = "article"): void
```

### 方法 `MindMapEditor.cancelArticleInitialRender`

源码：`src/editor/editor.ts:4006`

Cancels a stale entry skeleton before another mode or document render starts.

```ts
private cancelArticleInitialRender(): void
```

### 方法 `MindMapEditor.refreshArticleWindowChrome`

源码：`src/editor/editor.ts:4014`

Rebinds article-only controls after a bounded window grows or moves.

```ts
private refreshArticleWindowChrome(): void
```

### 方法 `MindMapEditor.cancelArticleWindowExpansion`

源码：`src/editor/editor.ts:4022`

Cancels a deferred edge expansion before the article DOM is rebuilt.

```ts
private cancelArticleWindowExpansion(): void
```

### 方法 `MindMapEditor.expandArticleWindow`

源码：`src/editor/editor.ts:4032`

Expands one approximately 5 KB article chunk after painting a non-blocking edge indicator.

```ts
private expandArticleWindow(direction: "before" | "after"): void
```

### 方法 `MindMapEditor.scheduleArticleWindowExpansion`

源码：`src/editor/editor.ts:4057`

Loads another window only when the reader reaches a rendered edge.

```ts
private scheduleArticleWindowExpansion(): void
```

### 方法 `MindMapEditor.renderArticleMiniMap`

源码：`src/editor/editor.ts:4070`

Renders a compact structural navigator for article and continuous reading views.

```ts
private renderArticleMiniMap(): void
```

### 方法 `MindMapEditor.articleMiniMapDepth`

源码：`src/editor/editor.ts:4105`

Returns the structural article depth represented by a minimap target.

```ts
private articleMiniMapDepth(target: HTMLElement): number
```

### 方法 `MindMapEditor.articleMiniMapTargetLabel`

源码：`src/editor/editor.ts:4110`

Returns the complete chapter label for the minimap marker tooltip.

```ts
private articleMiniMapTargetLabel(target: HTMLElement): string
```

### 方法 `MindMapEditor.showArticleMiniMapTooltip`

源码：`src/editor/editor.ts:4117`

Shows a complete chapter label above its marker without clipping it to the navigator width.

```ts
private showArticleMiniMapTooltip(marker: HTMLElement, label: string): void
```

### 方法 `MindMapEditor.hideArticleMiniMapTooltip`

源码：`src/editor/editor.ts:4129`

Hides the standalone chapter label when its marker is no longer focused.

```ts
private hideArticleMiniMapTooltip(): void
```

### 方法 `MindMapEditor.scrollToArticleMiniMapTarget`

源码：`src/editor/editor.ts:4134`

Scrolls the article container to the exact top position of a minimap target.

```ts
private scrollToArticleMiniMapTarget(target: HTMLElement): void
```

### 方法 `MindMapEditor.articleMiniMapTargets`

源码：`src/editor/editor.ts:4142`

Returns the current page's highest and next-highest structural categories for the minimap.

```ts
private articleMiniMapTargets(): HTMLElement[]
```

### 方法 `MindMapEditor.updateArticleMiniMapActiveMarker`

源码：`src/editor/editor.ts:4153`

Updates the dark marker to match the article section currently being read.

```ts
private updateArticleMiniMapActiveMarker(): void
```

### 方法 `MindMapEditor.updateArticleMiniMapMarkerHover`

源码：`src/editor/editor.ts:4169`

Expands the nearest marker and progressively shortens its vertical neighbours.

```ts
private updateArticleMiniMapMarkerHover(focusedIndex: number | null): void
```

### 方法 `MindMapEditor.bindArticleMiniMapInteractions`

源码：`src/editor/editor.ts:4177`

Keeps the navigator discoverable while preventing it from permanently occupying the page edge.

```ts
private bindArticleMiniMapInteractions(track: HTMLElement): void
```

### 方法 `MindMapEditor.clearArticleMiniMap`

源码：`src/editor/editor.ts:4231`

Removes minimap listeners and pending timers before the next article render.

```ts
private clearArticleMiniMap(): void
```

### 方法 `MindMapEditor.updateArticleMiniMapVisibility`

源码：`src/editor/editor.ts:4242`

Hides the minimap when the article page leaves insufficient right-side gutter.

```ts
private updateArticleMiniMapVisibility(): void
```

### 方法 `MindMapEditor.articleRendererOptions`

源码：`src/editor/editor.ts:4253`

构造文章渲染器所需的最小状态边界。

```ts
private articleRendererOptions()
```

### 方法 `MindMapEditor.effectiveArticleTocMaxDepth`

源码：`src/editor/editor.ts:4303`

返回当前脑图实际使用的目录最大层级。文档级覆盖优先，未设置时跟随插件全局选项。

```ts
private effectiveArticleTocMaxDepth(): number
```

### 方法 `MindMapEditor.renderArticleContent`

源码：`src/editor/editor.ts:4308`

将文章内容块渲染委托给文章模式模块。

```ts
private renderArticleContent(container: HTMLElement, node: MindMapNode, treatTextAsBody: boolean): void
```

### 方法 `MindMapEditor.installArticleSectionCollapse`

源码：`src/editor/editor.ts:4313`

Adds Markdown-style collapse controls to headings and hides their descendant article sections.

```ts
private installArticleSectionCollapse(): void
```

### 方法 `MindMapEditor.installReadingChapterCollapse`

源码：`src/editor/editor.ts:4358`

Adds the same collapse control to top-level chapters in continuous reading mode.

```ts
private installReadingChapterCollapse(): void
```

### 方法 `MindMapEditor.render`

源码：`src/editor/editor.ts:4387`

渲染相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private render(): void
```

### 方法 `MindMapEditor.renderQuestionPractice`

源码：`src/editor/editor.ts:4419`

Renders the configured-folder practice surface and persists each automatic grading result.

```ts
private renderQuestionPractice(): void
```

### 方法 `MindMapEditor.recordQuestionPractice`

源码：`src/editor/editor.ts:4434`

Persists learning progress from the read-only practice surface without enabling document editing.

```ts
private recordQuestionPractice(nodeId: string, correct: boolean): void
```

### 方法 `MindMapEditor.cancelIncrementalRender`

源码：`src/editor/editor.ts:4455`

取消尚未完成的分帧导图挂载，并使旧回调自动失效。

```ts
private cancelIncrementalRender(): void
```

### 方法 `MindMapEditor.beginIncrementalRender`

源码：`src/editor/editor.ts:4463`

开始一次新的分帧导图挂载并返回本轮令牌。

```ts
private beginIncrementalRender(): number
```

### 方法 `MindMapEditor.currentMindMapWorldViewport`

源码：`src/editor/editor.ts:4471`

把当前缩放和平移转换为布局世界坐标，供当前和相邻视口优先排序。

```ts
private currentMindMapWorldViewport():
```

### 方法 `MindMapEditor.renderMindMap`

源码：`src/editor/editor.ts:4490`

渲染可交互导图画布：计算布局、绘制连接线和节点、恢复选择状态、绑定拖拽与尺寸手柄、安装子导图整节点入口，并启动图片镜像加载探测。

```ts
private renderMindMap(): void
```

### 方法 `MindMapEditor.renderMindMapNode`

源码：`src/editor/editor.ts:4548`

将一个已完成布局的导图节点挂载到画布，并绑定其内容、选择、拖放和尺寸交互。

```ts
private renderMindMapNode( position: LayoutResult["nodes"][number], appearance: MindMapAppearance, branchColorMap: ReadonlyMap<string, string> ): void
```

### 方法 `MindMapEditor.renderMindMapEdges`

源码：`src/editor/editor.ts:4950`

使用当前布局坐标重新绘制全部连接线。

```ts
private renderMindMapEdges(appearance: MindMapAppearance, branchColorMap: Map<string, string>): void
```

### 方法 `MindMapEditor.requestMindMapLayoutAnimation`

源码：`src/editor/editor.ts:4974`

标记下一次导图重绘为结构变化过渡，避免节点直接跳到新的布局位置。

```ts
private requestMindMapLayoutAnimation(): void
```

### 方法 `MindMapEditor.captureMindMapViewportAnchor`

源码：`src/editor/editor.ts:4979`

Captures a surviving node's world position before a deletion changes the layout.

```ts
private captureMindMapViewportAnchor(nodeId: string):
```

### 方法 `MindMapEditor.restoreMindMapViewportAnchor`

源码：`src/editor/editor.ts:4986`

Keeps the deletion fallback node under the same screen position after relayout.

```ts
private restoreMindMapViewportAnchor(anchor:
```

### 方法 `MindMapEditor.captureMindMapNodeRects`

源码：`src/editor/editor.ts:5001`

在销毁旧节点前记录其屏幕矩形，供下一次重绘使用 FLIP 过渡。

```ts
private captureMindMapNodeRects(): Map<string, DOMRect>
```

### 方法 `MindMapEditor.playMindMapLayoutAnimation`

源码：`src/editor/editor.ts:5017`

让重建后仍存在的节点从旧位置平滑移动到新位置，并短暂淡入重新绘制的连线。

```ts
private playMindMapLayoutAnimation(previousNodeRects: ReadonlyMap<string, DOMRect>): void
```

### 方法 `MindMapEditor.scheduleMeasuredMindMapLayout`

源码：`src/editor/editor.ts:5043`

合并同一帧内的节点尺寸变化，避免表格和图片加载触发重复布局。

```ts
private scheduleMeasuredMindMapLayout(): void
```

### 方法 `MindMapEditor.applyMeasuredMindMapLayout`

源码：`src/editor/editor.ts:5057`

使用浏览器实际渲染尺寸重新执行碰撞避让。 表格、代码和图片节点的真实高度可能大于模型估算值，因此必须在 DOM 完成排版后更新包围盒、节点坐标、连接线和画布边界。

```ts
private applyMeasuredMindMapLayout(): void
```

### 方法 `MindMapEditor.applyTransform`

源码：`src/editor/editor.ts:5098`

应用transform，并保持模型、界面和持久化状态的一致性。

```ts
private applyTransform(): void
```

### 方法 `MindMapEditor.selectAllNodesExceptRoot`

源码：`src/editor/editor.ts:5108`

Selects every non-root node so bulk operations never affect the protected main node.

```ts
private selectAllNodesExceptRoot(): void
```

### 方法 `MindMapEditor.selectNode`

源码：`src/editor/editor.ts:5123`

Selects one node and clears any prior multi-selection.

```ts
private selectNode(id: string | null): void
```

### 方法 `MindMapEditor.toggleNodeSelection`

源码：`src/editor/editor.ts:5138`

Adds or removes one node from the current multi-selection.

```ts
private toggleNodeSelection(id: string): void
```

### 方法 `MindMapEditor.createSelectionLocation`

源码：`src/editor/editor.ts:5155`

为一次节点点击构建位置。文章、大纲和通读模式保留节点当前的屏幕比例， 防止后续设置刷新把刚点击的节点强制拉到固定 35% 高度。

```ts
private createSelectionLocation(id: string): ReadingLocation
```

### 方法 `MindMapEditor.applySelectionClasses`

源码：`src/editor/editor.ts:5186`

Synchronizes selection classes across all editor views.

```ts
private applySelectionClasses(): void
```

### 方法 `MindMapEditor.selectedNode`

源码：`src/editor/editor.ts:5210`

执行“selected node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private selectedNode(): MindMapNode | null
```

### 方法 `MindMapEditor.createConfiguredNode`

源码：`src/editor/editor.ts:5220`

创建configured node，并保持模型、界面和持久化状态的一致性。

```ts
private createConfiguredNode(text = "新节点"): MindMapNode
```

### 方法 `MindMapEditor.shortcutMatches`

源码：`src/editor/editor.ts:5233`

判断键盘事件是否匹配用户配置的组合键。

```ts
private shortcutMatches(event: KeyboardEvent, shortcut: string): boolean
```

### 方法 `MindMapEditor.isNearNodeEdge`

源码：`src/editor/editor.ts:5251`

Returns whether a double-click landed in the edge band reserved for the full node editor instead of the central quick-edit area.

```ts
private isNearNodeEdge(event: MouseEvent, nodeEl: HTMLElement): boolean
```

### 方法 `MindMapEditor.beginInlineEdit`

源码：`src/editor/editor.ts:5263`

在节点本体中启动轻量富文本输入。

```ts
private beginInlineEdit(nodeId: string, blockId?: string, protectInitialFocus = false): void
```

### 方法 `MindMapEditor.addChild`

源码：`src/editor/editor.ts:5593`

添加child，并保持模型、界面和持久化状态的一致性。

```ts
private addChild(): void
```

### 方法 `MindMapEditor.addSibling`

源码：`src/editor/editor.ts:5607`

添加sibling，并保持模型、界面和持久化状态的一致性。

```ts
private addSibling(): void
```

### 方法 `MindMapEditor.insertTextBlock`

源码：`src/editor/editor.ts:5625`

Inserts a text block after the context block, or appends it when no block was targeted.

```ts
private insertTextBlock(afterBlockId?: string): void
```

### 方法 `MindMapEditor.editSelected`

源码：`src/editor/editor.ts:5637`

编辑selected，并保持模型、界面和持久化状态的一致性。

```ts
private editSelected(initialBlockId?: string): void
```

### 方法 `MindMapEditor.openSelectedNodeEditor`

源码：`src/editor/editor.ts:5646`

Opens the complete node editor used by the mind-map and outline modes.

```ts
private openSelectedNodeEditor(initialBlockId?: string): void
```

### 方法 `MindMapEditor.articleInlineEditable`

源码：`src/editor/editor.ts:5717`

Returns the first inline-editable article element for one rendered node.

```ts
private articleInlineEditable(nodeId: string): HTMLElement | null
```

### 方法 `MindMapEditor.articleEditActionLabel`

源码：`src/editor/editor.ts:5724`

Returns the article-specific edit action shown in context and inline menus.

```ts
private articleEditActionLabel(node: MindMapNode | null): string
```

### 方法 `MindMapEditor.editSelectedArticleContent`

源码：`src/editor/editor.ts:5730`

Focuses the current article line, or creates a temporary body line for content-only nodes.

```ts
private editSelectedArticleContent(): void
```

### 方法 `MindMapEditor.addQuestionChild`

源码：`src/editor/editor.ts:5763`

Creates a structured question as a child of the selected node.

```ts
private addQuestionChild(): void
```

### 方法 `MindMapEditor.applyAiQuestion`

源码：`src/editor/editor.ts:5778`

Applies an AI JSON response to the scoped node or adds it as a question child for page-wide AI.

```ts
applyAiQuestion(responseText: string, nodeId?: string): boolean
```

### 方法 `MindMapEditor.applyAndEnrichAiQuestion`

源码：`src/editor/editor.ts:5807`

Converts AI JSON into a question node, then fills missing answers and analysis through the configured question assistant.

```ts
async applyAndEnrichAiQuestion(responseText: string, nodeId?: string): Promise<boolean>
```

### 方法 `MindMapEditor.editQuestion`

源码：`src/editor/editor.ts:5825`

Opens the structured question editor and mirrors its stem into normal node content.

```ts
private editQuestion(node = this.selectedNode()): void
```

### 方法 `MindMapEditor.deleteNodeById`

源码：`src/editor/editor.ts:5842`

Deletes the node bound to an inline action without relying on mutable selection state.

```ts
private deleteNodeById(nodeId: string): void
```

### 方法 `MindMapEditor.deleteSelected`

源码：`src/editor/editor.ts:5865`

删除selected，并保持模型、界面和持久化状态的一致性。

```ts
private deleteSelected(): void
```

### 方法 `MindMapEditor.toggleCollapse`

源码：`src/editor/editor.ts:5902`

切换collapse，并保持模型、界面和持久化状态的一致性。

```ts
private toggleCollapse(): void
```

### 方法 `MindMapEditor.setAllNodesCollapsed`

源码：`src/editor/editor.ts:5919`

Expands or collapses every branch while keeping the root visible.

```ts
private setAllNodesCollapsed(collapsed: boolean): void
```

### 方法 `MindMapEditor.toggleAllNodesCollapsed`

源码：`src/editor/editor.ts:5943`

Toggles every non-root branch between fully expanded and fully collapsed.

```ts
private toggleAllNodesCollapsed(): void
```

### 方法 `MindMapEditor.toggleLayout`

源码：`src/editor/editor.ts:5957`

切换layout，并保持模型、界面和持久化状态的一致性。

```ts
private toggleLayout(): void
```

### 方法 `MindMapEditor.toggleArticleLanding`

源码：`src/editor/editor.ts:5966`

Switches the top-level article between its generated directory and original article content.

```ts
private toggleArticleLanding(): void
```

### 方法 `MindMapEditor.setArticleLandingMode`

源码：`src/editor/editor.ts:5973`

Persists one article landing choice without restoring the outgoing page's chapter anchor.

```ts
private setArticleLandingMode(mode: "toc" | "article"): void
```

### 方法 `MindMapEditor.editAppearance`

源码：`src/editor/editor.ts:5992`

编辑appearance，并保持模型、界面和持久化状态的一致性。

```ts
private editAppearance(): void
```

### 方法 `MindMapEditor.editTable`

源码：`src/editor/editor.ts:6044`

编辑table，并保持模型、界面和持久化状态的一致性。

```ts
private editTable(): void
```

### 方法 `MindMapEditor.convertChildrenToTable`

源码：`src/editor/editor.ts:6055`

转换children to table，并保持模型、界面和持久化状态的一致性。

```ts
private convertChildrenToTable(): void
```

### 方法 `MindMapEditor.editCode`

源码：`src/editor/editor.ts:6070`

编辑code，并保持模型、界面和持久化状态的一致性。

```ts
private editCode(): void
```

### 方法 `MindMapEditor.upsertStructuredBlock`

源码：`src/editor/editor.ts:6085`

插入或更新第一个表格内容块，并保留该块当前的排序位置。

```ts
private upsertStructuredBlock(node: MindMapNode, type: "table", value: MindMapTable, blockId?: string): void;
```

### 方法 `MindMapEditor.upsertStructuredBlock`

源码：`src/editor/editor.ts:6093`

插入或更新第一个代码内容块，并保留该块当前的排序位置。

```ts
private upsertStructuredBlock(node: MindMapNode, type: "code", value: MindMapCodeBlock, blockId?: string): void;
```

### 方法 `MindMapEditor.upsertStructuredBlock`

源码：`src/editor/editor.ts:6101`

插入或更新首个结构化内容块，并同步兼容旧版节点字段。

```ts
private upsertStructuredBlock(node: MindMapNode, type: "table" | "code", value: MindMapTable | MindMapCodeBlock, blockId?: string): void
```

### 方法 `MindMapEditor.appendCodeBlock`

源码：`src/editor/editor.ts:6114`

Appends a new code block without replacing code blocks already present on the node.

```ts
private appendCodeBlock(node: MindMapNode, code: MindMapCodeBlock): void
```

### 方法 `MindMapEditor.insertTextBlockAfter`

源码：`src/editor/editor.ts:6119`

Inserts an empty text block immediately after a targeted block and returns its ID.

```ts
private insertTextBlockAfter(node: MindMapNode, afterBlockId?: string): string
```

### 方法 `MindMapEditor.removeStructuredBlock`

源码：`src/editor/editor.ts:6130`

Removes one structured block identified by its content-block ID.

```ts
private removeStructuredBlock(node: MindMapNode, blockId: string): void
```

### 方法 `MindMapEditor.bindContentBlockDragHandle`

源码：`src/editor/editor.ts:6137`

Adds the explicit grip used to move one rendered content block without dragging its whole node.

```ts
private bindContentBlockDragHandle(blockElement: HTMLElement, nodeId: string, blockId: string): void
```

### 方法 `MindMapEditor.bindContentBlockAppendDropTarget`

源码：`src/editor/editor.ts:6197`

Lets a dragged content block be appended after all blocks in a target node.

```ts
private bindContentBlockAppendDropTarget(dropTarget: HTMLElement, nodeId: string): void
```

### 方法 `MindMapEditor.moveContentBlock`

源码：`src/editor/editor.ts:6223`

Applies a node-internal reorder or cross-node content-block move through the normal history path.

```ts
private moveContentBlock( sourceNodeId: string, blockId: string, targetNodeId: string, targetBlockId: string | undefined, position: "before" | "after" | "append" ): void
```

### 方法 `MindMapEditor.clearContentBlockDropIndicators`

源码：`src/editor/editor.ts:6246`

Clears temporary block drag styling while optionally preserving the active drag state.

```ts
private clearContentBlockDropIndicators(clearDragging = true): void
```

### 方法 `MindMapEditor.removeContentBlock`

源码：`src/editor/editor.ts:6256`

Deletes exactly one content block selected by its owning node and stable block ID.

```ts
private removeContentBlock(nodeId: string, blockId: string): void
```

### 方法 `MindMapEditor.nodeHasMeaningfulContent`

源码：`src/editor/editor.ts:6269`

Returns whether a node currently has a non-blank text or structured content block.

```ts
private nodeHasMeaningfulContent(node: MindMapNode): boolean
```

### 方法 `MindMapEditor.removeNodeAfterContentDeletion`

源码：`src/editor/editor.ts:6277`

Removes a node after its final real content was deleted, while keeping a just-created empty node available for its first input and preserving nodes with independent semantics.

```ts
private removeNodeAfterContentDeletion(node: MindMapNode, hadMeaningfulContent: boolean): boolean
```

### 方法 `MindMapEditor.createOrOpenSubmap`

源码：`src/editor/editor.ts:6292`

如果节点已有子导图则打开；否则创建独立 .mindmap 文件并在父节点与子文件导航元数据中建立双向关系。

```ts
private async createOrOpenSubmap(): Promise<void>
```

### 方法 `MindMapEditor.renderReadingLoading`

源码：`src/editor/editor.ts:6315`

Renders a semantic loading state while the parent/child map family is being resolved.

```ts
private renderReadingLoading(): void
```

### 方法 `MindMapEditor.renderReading`

源码：`src/editor/editor.ts:6364`

Renders every map in the current parent/child family as one continuous, read-only book with an integrated directory and persisted progress.

```ts
private renderReading(): void
```

### 方法 `MindMapEditor.addArticleScrollToTopButton`

源码：`src/editor/editor.ts:6518`

Adds the shared floating control used to return article and continuous-reading views to their top.

```ts
private addArticleScrollToTopButton(): void
```

### 方法 `MindMapEditor.deleteSelectedSubmap`

源码：`src/editor/editor.ts:6544`

Deletes the selected node's submap file when present and clears stale links when the file was already removed outside the plugin.

```ts
private async deleteSelectedSubmap(): Promise<void>
```

### 方法 `MindMapEditor.renderQuestionSummary`

源码：`src/editor/editor.ts:6568`

渲染node table，并保持模型、界面和持久化状态的一致性。

```ts
private renderQuestionSummary(content: HTMLElement, node: MindMapNode): void
```

### 方法 `MindMapEditor.renderNodeTable`

源码：`src/editor/editor.ts:6623`

Renders the optional table payload beneath normal node and question content.

```ts
private renderNodeTable(content: HTMLElement, node: MindMapNode, tableData: MindMapTable, blockId?: string): HTMLElement
```

### 方法 `MindMapEditor.renderNodeCode`

源码：`src/editor/editor.ts:6672`

渲染node code，并保持模型、界面和持久化状态的一致性。

```ts
private renderNodeCode(content: HTMLElement, node: MindMapNode, codeData: MindMapCodeBlock, blockId?: string): HTMLElement
```

### 方法 `MindMapEditor.openTableBlockContextMenu`

源码：`src/editor/editor.ts:6712`

Opens edit and block-specific removal actions for a rendered table.

```ts
private openTableBlockContextMenu(event: MouseEvent, node: MindMapNode, table: MindMapTable, blockId?: string): void
```

### 方法 `MindMapEditor.openCodeBlockContextMenu`

源码：`src/editor/editor.ts:6723`

Opens edit and block-specific removal actions for a rendered code block.

```ts
private openCodeBlockContextMenu(event: MouseEvent, node: MindMapNode, code: MindMapCodeBlock, blockId?: string): void
```

### 方法 `MindMapEditor.openTableBlockEditor`

源码：`src/editor/editor.ts:6734`

Opens the selected table block directly instead of routing through the node editor.

```ts
private openTableBlockEditor(node: MindMapNode, table: MindMapTable, blockId?: string): void
```

### 方法 `MindMapEditor.updateTableColumnWidths`

源码：`src/editor/editor.ts:6745`

Persists article table column widths after a pointer resize gesture.

```ts
private updateTableColumnWidths(node: MindMapNode, blockId: string, widths: number[]): void
```

### 方法 `MindMapEditor.openCodeBlockEditor`

源码：`src/editor/editor.ts:6759`

Opens the selected code block directly instead of routing through the node editor.

```ts
private openCodeBlockEditor(node: MindMapNode, code: MindMapCodeBlock, blockId?: string): void
```

### 方法 `MindMapEditor.handlePaste`

源码：`src/editor/editor.ts:6773`

处理编辑器内粘贴：优先识别图片并保存为本地资源，其次识别表格、代码块或节点分支。普通文本也会作为当前节点的子节点插入。

```ts
private async handlePaste(event: ClipboardEvent): Promise<void>
```

### 方法 `MindMapEditor.isParentNavigationBacklink`

源码：`src/editor/editor.ts:6900`

判断parent navigation backlink，并保持模型、界面和持久化状态的一致性。

```ts
private isParentNavigationBacklink(node: MindMapNode): boolean
```

### 方法 `MindMapEditor.getNodeLink`

源码：`src/editor/editor.ts:6917`

读取并返回node link，并保持模型、界面和持久化状态的一致性。

```ts
private getNodeLink(node: MindMapNode): string | null
```

### 方法 `MindMapEditor.showOutline`

源码：`src/editor/editor.ts:6926`

执行“show outline”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private showOutline(): void
```

### 方法 `MindMapEditor.showImportExport`

源码：`src/editor/editor.ts:6932`

Opens the unified import/export surface; read-only mode keeps export actions available.

```ts
private showImportExport(): void
```

### 方法 `MindMapEditor.importDocument`

源码：`src/editor/editor.ts:6948`

Imports a document as a child branch or replaces the current document.

```ts
private importDocument(document: MindMapDocument, mode: "child" | "replace"): void
```

### 方法 `MindMapEditor.scheduleImportedImageUploads`

源码：`src/editor/editor.ts:6970`

为已经复制进当前导图资源目录的导入图片安排自动上传。

```ts
private scheduleImportedImageUploads(root: MindMapNode): number
```

### 方法 `MindMapEditor.openSearch`

源码：`src/editor/editor.ts:6987`

打开search，并保持模型、界面和持久化状态的一致性。

```ts
private openSearch(): void
```

### 方法 `MindMapEditor.focusNode`

源码：`src/editor/editor.ts:6997`

定位指定节点。必要时先展开全部祖先、切换到可显示该节点的视图并重渲染，然后选中节点并将其平滑移动到可视区域中央。

```ts
private focusNode(id: string, persistLocation = true): void
```

### 方法 `MindMapEditor.centerNode`

源码：`src/editor/editor.ts:7040`

定位node，并保持模型、界面和持久化状态的一致性。

```ts
private centerNode(id: string): void
```

### 方法 `MindMapEditor.openAiScopeContextMenu`

源码：`src/editor/editor.ts:7054`

设置右键 AI 范围并显示只包含 AI 操作的上下文菜单。 根节点代表当前物理页面，必须使用整页范围而不是把它当作普通子树。

```ts
private openAiScopeContextMenu(event: MouseEvent, nodeId: string | null): void
```

### 方法 `MindMapEditor.convertImageToQuestion`

源码：`src/editor/editor.ts:7067`

Converts one image block into a question node, then runs recognition, source lookup, and analysis.

```ts
private async convertImageToQuestion(nodeId: string, blockId: string): Promise<void>
```

### 方法 `MindMapEditor.openImageContextMenu`

源码：`src/editor/editor.ts:7118`

显示图片专用右键菜单，提供识图、布局、图床和编辑等快速操作。

```ts
private openImageContextMenu(event: MouseEvent, nodeId: string, blockId: string): void
```

### 方法 `MindMapEditor.previewImageBlock`

源码：`src/editor/editor.ts:7176`

打开图片预览，并按当前图床优先级提供候选地址。

```ts
private previewImageBlock(block: MindMapImageContentBlock): void
```

### 方法 `MindMapEditor.setImageBlockAlignment`

源码：`src/editor/editor.ts:7182`

将图片块设置为指定的水平对齐方式。

```ts
private setImageBlockAlignment(nodeId: string, blockId: string, align: "left" | "center" | "right"): void
```

### 方法 `MindMapEditor.setImageBlockWidth`

源码：`src/editor/editor.ts:7189`

设定图片显示宽度；缺省宽度表示恢复为适应当前节点。

```ts
private setImageBlockWidth(nodeId: string, blockId: string, width?: number): void
```

### 方法 `MindMapEditor.setImageBlockLayout`

源码：`src/editor/editor.ts:7197`

Switches one image between inline gallery flow and a dedicated row.

```ts
private setImageBlockLayout(nodeId: string, blockId: string, layout: "inline" | "block"): void
```

### 方法 `MindMapEditor.updateImageBlock`

源码：`src/editor/editor.ts:7210`

更新一张图片的规范化内容块，并将整组内容写回节点以确保修改能够持久化。

```ts
private updateImageBlock(nodeId: string, blockId: string, update: (block: MindMapImageContentBlock) => void): void
```

### 方法 `MindMapEditor.toggleTextBlockParagraphIndent`

源码：`src/editor/editor.ts:7223`

Toggles one article text block between the default first-line indent and flush-left.

```ts
private toggleTextBlockParagraphIndent(nodeId: string, blockId: string): void
```

### 方法 `MindMapEditor.editImageBlock`

源码：`src/editor/editor.ts:7236`

打开当前图片块的编辑面板，用于精确尺寸和替换来源。

```ts
private editImageBlock(blockId: string): void
```

### 方法 `MindMapEditor.uploadImageBlock`

源码：`src/editor/editor.ts:7241`

将当前图片上传到用户选择的图床，并保留本地来源与已有镜像。

```ts
private async uploadImageBlock(nodeId: string, blockId: string): Promise<void>
```

### 方法 `MindMapEditor.uploadAllPageImages`

源码：`src/editor/editor.ts:7257`

Uploads every readable image on the current physical page to one selected host set.

```ts
private async uploadAllPageImages(): Promise<void>
```

### 方法 `MindMapEditor.copyImageSource`

源码：`src/editor/editor.ts:7333`

复制当前图片的主地址，供外部编辑器或浏览器直接使用。

```ts
private async copyImageSource(source: string): Promise<void>
```

### 方法 `MindMapEditor.removeImageBlock`

源码：`src/editor/editor.ts:7343`

从节点的有序内容块中移除指定图片。

```ts
private async removeImageBlock(nodeId: string, blockId: string): Promise<void>
```

### 方法 `MindMapEditor.openContextMenu`

源码：`src/editor/editor.ts:7363`

打开context menu，并保持模型、界面和持久化状态的一致性。

```ts
private openContextMenu(event: MouseEvent, contextBlockId?: string): void
```

### 方法 `MindMapEditor.extractToSubmap`

源码：`src/editor/editor.ts:7494`

将选中节点及其后代提取为子导图文件，然后从当前文档移除该节点。

```ts
private async extractToSubmap(): Promise<void>
```

### 方法 `MindMapEditor.mergeFromSubmap`

源码：`src/editor/editor.ts:7520`

将当前子导图合并回父导图并删除该子导图文件。

```ts
private async mergeFromSubmap(): Promise<void>
```

### 方法 `MindMapEditor.openAllNodesContextMenu`

源码：`src/editor/editor.ts:7539`

Opens the canvas and toolbar context menu for global branch visibility.

```ts
private openAllNodesContextMenu(event: MouseEvent): void
```

### 方法 `MindMapEditor.insertFormula`

源码：`src/editor/editor.ts:7566`

打开图形化公式编辑器并把生成的公式追加到当前节点。

```ts
private insertFormula(): void
```

### 方法 `MindMapEditor.copySelectedBranch`

源码：`src/editor/editor.ts:7600`

将当前分支或多选集合中的顶层分支复制到系统和插件内部剪贴板。

```ts
private async copySelectedBranch(): Promise<boolean>
```

### 方法 `MindMapEditor.pasteAsChild`

源码：`src/editor/editor.ts:7628`

将剪贴板中的一个或多个分支按顺序粘贴为当前节点的子节点。

```ts
private async pasteAsChild(): Promise<void>
```

### 方法 `MindMapEditor.duplicateSelected`

源码：`src/editor/editor.ts:7656`

复制生成selected，并保持模型、界面和持久化状态的一致性。

```ts
private duplicateSelected(): void
```

### 方法 `MindMapEditor.canMoveNode`

源码：`src/editor/editor.ts:7680`

判断reparent，并保持模型、界面和持久化状态的一致性。

```ts
private canMoveNode(draggedId: string | null, targetId: string): boolean
```

### 方法 `MindMapEditor.dropPositionForEvent`

源码：`src/editor/editor.ts:7692`

根据指针在目标节点的位置判断拖放意图。右侧和中间均成为子级；根节点仅接受子节点放置。

```ts
private dropPositionForEvent(event: DragEvent, targetEl: HTMLElement, targetId: string): NodeDropPosition
```

### 方法 `MindMapEditor.clearDropIndicators`

源码：`src/editor/editor.ts:7698`

清理全部拖放目标样式，防止跨节点移动时残留指示线。

```ts
private clearDropIndicators(): void
```

### 方法 `MindMapEditor.showDropPreview`

源码：`src/editor/editor.ts:7710`

Renders a magnetic placeholder at the exact location represented by the current before, child, or after drop zone.

```ts
private showDropPreview(targetId: string, position: NodeDropPosition): void
```

### 方法 `MindMapEditor.clearDropPreview`

源码：`src/editor/editor.ts:7747`

Removes the temporary magnetic drop placeholder.

```ts
private clearDropPreview(): void
```

### 方法 `MindMapEditor.moveNode`

源码：`src/editor/editor.ts:7759`

在统一编辑事务中移动节点，支持同级前后排序和改变父子关系。

```ts
private moveNode(draggedId: string, targetId: string, position: NodeDropPosition): void
```

### 方法 `MindMapEditor.replaceDocument`

源码：`src/editor/editor.ts:7791`

替换document，并保持模型、界面和持久化状态的一致性。

```ts
private replaceDocument(document: MindMapDocument): void
```

### 方法 `MindMapEditor.ensureExternalEditAllowed`

源码：`src/editor/editor.ts:7803`

允许文章和通读模式应用已确认的外部编辑，但尊重用户显式保存的文档只读锁。

```ts
private ensureExternalEditAllowed(): boolean
```

### 方法 `MindMapEditor.replaceDocumentFromExternalEdit`

源码：`src/editor/editor.ts:7810`

用外部确认的完整文档替换当前状态，并统一接入撤销、保存、渲染和聚焦。

```ts
private replaceDocumentFromExternalEdit(document: MindMapDocument, focusNodeId: string): void
```

### 方法 `MindMapEditor.mutateInlineText`

源码：`src/editor/editor.ts:7828`

提交行内文字时保留现有 DOM，仅在节点被删除时回退到完整重绘。

```ts
private mutateInlineText(nodeId: string, action: () => void): void
```

### 方法 `MindMapEditor.refreshAfterInlineTextCommit`

源码：`src/editor/editor.ts:7846`

在不销毁当前编辑节点的情况下刷新文字提交后的轻量状态和布局。

```ts
private refreshAfterInlineTextCommit(nodeId: string): void
```

### 方法 `MindMapEditor.refreshMindMapNode`

源码：`src/editor/editor.ts:7864`

只替换导图中的一个节点 DOM，并把真实尺寸变化交给统一测量布局处理。

```ts
private refreshMindMapNode(nodeId: string): void
```

### 方法 `MindMapEditor.mutatePresentation`

源码：`src/editor/editor.ts:7890`

保存当前页面的主题、阅读样式和其他展示配置。 只读状态只锁定正文与结构编辑，不阻止这些展示设置写回当前文件。

```ts
private mutatePresentation(action: () => void): void
```

### 方法 `MindMapEditor.mutate`

源码：`src/editor/editor.ts:7907`

所有用户可撤销写操作的统一入口。调用前克隆当前文档写入撤销栈，执行修改，规范化和重渲染，再通知视图自动保存；只读状态会在更上层阻止进入该流程。

```ts
private mutate(action: () => void, restoreLocation?: ReadingLocation | null): void
```

### 方法 `MindMapEditor.undo`

源码：`src/editor/editor.ts:7922`

撤销相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private undo(): void
```

### 方法 `MindMapEditor.redo`

源码：`src/editor/editor.ts:7936`

重做相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private redo(): void
```

### 方法 `MindMapEditor.fitToView`

源码：`src/editor/editor.ts:7950`

执行“fit to view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private fitToView(animated = true): void
```

### 方法 `MindMapEditor.animateViewportTo`

源码：`src/editor/editor.ts:7964`

Smoothly interpolates the canvas transform instead of jumping to its destination.

```ts
private animateViewportTo(targetZoom: number, targetPanX: number, targetPanY: number, animated = true): void
```

### 方法 `MindMapEditor.initializeMindMapViewport`

源码：`src/editor/editor.ts:8005`

从文档视图状态恢复导图缩放与平移。没有已保存状态时，只在导图当前可见且启用自动适应时执行一次自适应； 若首次打开就是文章或通读模式，则把自适应延迟到第一次进入导图模式，避免在隐藏画布上计算出错误缩放。

```ts
private initializeMindMapViewport(delay: number): void
```

### 方法 `MindMapEditor.persistMindMapViewportState`

源码：`src/editor/editor.ts:8031`

把当前导图缩放和平移写回文档视图状态。该方法在离开导图模式和序列化文档前调用， 因此文章、大纲和通读模式重渲染不会把用户视口恢复为默认自适应大小。

```ts
private persistMindMapViewportState(): void
```

### 方法 `MindMapEditor.setZoom`

源码：`src/editor/editor.ts:8046`

更新并应用zoom，并保持模型、界面和持久化状态的一致性。

```ts
private setZoom(value: number): void
```

### 方法 `MindMapEditor.applyZoomInput`

源码：`src/editor/editor.ts:8055`

解析工具栏中的缩放百分比输入，并将有效值应用到画布。

```ts
private applyZoomInput(): void
```

### 方法 `MindMapEditor.beginTwoFingerGesture`

源码：`src/editor/editor.ts:8067`

记录当前双指手势的初始中心点、间距和画布位置。

```ts
private beginTwoFingerGesture(): void
```

### 方法 `MindMapEditor.updateTwoFingerGesture`

源码：`src/editor/editor.ts:8083`

按设置将双指手势解释为缩放或画布平移。

```ts
private updateTwoFingerGesture(): void
```

### 方法 `MindMapEditor.clampZoom`

源码：`src/editor/editor.ts:8120`

执行“clamp zoom”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private clampZoom(value: number): number
```

### 方法 `MindMapEditor.navigateSelection`

源码：`src/editor/editor.ts:8129`

执行“navigate selection”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private navigateSelection(direction: "parent" | "child" | "previous" | "next"): void
```

### 方法 `MindMapEditor.handleKeydown`

源码：`src/editor/editor.ts:8153`

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

### 方法 `DocumentHistory.canUndo`

源码：`src/editor/history-manager.ts:27`

当前是否存在可撤销的文档快照。

```ts
canUndo(): boolean
```

### 方法 `DocumentHistory.canRedo`

源码：`src/editor/history-manager.ts:32`

当前是否存在可重做的文档快照。

```ts
canRedo(): boolean
```

### 方法 `DocumentHistory.capture`

源码：`src/editor/history-manager.ts:41`

在修改前记录当前文档，并使已有重做分支失效。

```ts
capture(document: MindMapDocument): void
```

### 方法 `DocumentHistory.undo`

源码：`src/editor/history-manager.ts:52`

返回上一份文档，同时把当前文档放入重做栈。

```ts
undo(current: MindMapDocument): MindMapDocument | null
```

### 方法 `DocumentHistory.redo`

源码：`src/editor/history-manager.ts:64`

返回下一份文档，同时把当前文档放回撤销栈。

```ts
redo(current: MindMapDocument): MindMapDocument | null
```

### 方法 `DocumentHistory.trim`

源码：`src/editor/history-manager.ts:73`

按设置限制裁剪最旧的历史快照。

```ts
private trim(): void
```

### 方法 `DocumentHistory.serialize`

源码：`src/editor/history-manager.ts:79`

将文档转换为与运行时对象隔离的快照。

```ts
private serialize(document: MindMapDocument): string
```

### 方法 `DocumentHistory.deserialize`

源码：`src/editor/history-manager.ts:84`

从内部快照恢复文档对象。

```ts
private deserialize(snapshot: string): MindMapDocument
```

## `src/editor/image-failure-view.ts`

为导图、大纲、文章和通读模式提供统一的图片加载失败地址卡片。

### 函数 `imageFailureSources`

源码：`src/editor/image-failure-view.ts:15`

返回图片块所有可诊断地址，按当前图床优先级排序并去重。

```ts
export function imageFailureSources(block: MindMapImageContentBlock, imageHostPriorityIds: string[] = []): string[]
```

### 函数 `clearImageFailureDetails`

源码：`src/editor/image-failure-view.ts:26`

清除容器内已有的图片失败地址卡片，供重新尝试或镜像切换成功后复用。

```ts
export function clearImageFailureDetails(container: HTMLElement): void
```

### 函数 `renderImageFailureDetails`

源码：`src/editor/image-failure-view.ts:37`

在图片位置显示明确的失败状态、全部候选地址和复制操作。

```ts
export function renderImageFailureDetails( container: HTMLElement, block: MindMapImageContentBlock, imageHostPriorityIds: string[] = [] ): HTMLElement
```

### 函数 `loadImageWithFallback`

源码：`src/editor/image-failure-view.ts:80`

依次尝试图片块的远程镜像和本地来源，全部失败时显示地址卡片。

```ts
export function loadImageWithFallback( image: HTMLImageElement, container: HTMLElement, block: MindMapImageContentBlock, imageHostPriorityIds: string[], resolveImage: (source: string) => string | null, onResolved?: (source: string, resolved: string) => void…
```

## `src/editor/node-actions.ts`

不依赖 DOM 的节点新增、批量删除和折叠操作。

### 函数 `appendChild`

源码：`src/editor/node-actions.ts:16`

在父节点末尾插入子节点并自动展开父节点。

```ts
export function appendChild(parent: MindMapNode, child: MindMapNode): void
```

### 函数 `insertSiblingAfter`

源码：`src/editor/node-actions.ts:22`

在目标节点之后插入同级节点。

```ts
export function insertSiblingAfter(root: MindMapNode, targetId: string, sibling: MindMapNode): boolean
```

### 函数 `topLevelSelectedNodeIds`

源码：`src/editor/node-actions.ts:34`

从多选集合中过滤掉根节点、无效节点以及已被另一所选祖先覆盖的后代。

```ts
export function topLevelSelectedNodeIds(root: MindMapNode, selectedIds: Iterable<string>): string[]
```

### 函数 `deleteNodes`

源码：`src/editor/node-actions.ts:45`

删除指定节点集合并返回实际删除数量。

```ts
export function deleteNodes(root: MindMapNode, ids: Iterable<string>): number
```

### 函数 `deletionSelectionFallback`

源码：`src/editor/node-actions.ts:61`

Chooses the closest surviving location after deletion. The previous sibling keeps the user's visual reading position most naturally; the next sibling is used only when there is no previous one. When a selected ancestor is also being removed, the same rule is applied recursively until a surviving parent or the protected root is reached.

```ts
export function deletionSelectionFallback(root: MindMapNode, ids: Iterable<string>): string
```

### 函数 `setAllBranchesCollapsed`

源码：`src/editor/node-actions.ts:88`

展开或折叠节点分支，并可选地将传入节点本身也设为折叠状态。

```ts
export function setAllBranchesCollapsed(root: MindMapNode, collapsed: boolean, includeRoot = false): void
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

源码：`src/editor/node-image-actions.ts:108`

上传图片块当前指向的本地图片，并合并已有远程镜像。

```ts
export async function uploadCurrentNodeImage( app: App, block: MindMapImageContentBlock, callbacks: NodeImageCallbacks ): Promise<boolean>
```

## `src/editor/node-rich-text-editor.ts`

节点编辑器领域的富文本块编辑、选区样式和预览。

### 函数 `renderNodeRichTextEditor`

源码：`src/editor/node-rich-text-editor.ts:23`

在指定容器中创建一个节点文字块编辑器。

```ts
export function renderNodeRichTextEditor( container: HTMLElement, block: MindMapTextContentBlock, onChange: () => void, shortcuts:
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

源码：`src/editor/outline-renderer.ts:110`

渲染节点主标题以外的文字、图片、表格、代码和备注内容。

```ts
function renderOutlineContent(container: HTMLElement, node: MindMapNode, depth: number, options: OutlineRendererOptions): void
```

## `src/editor/question-modal.ts`

Structured choice and essay question editor for mind-map nodes.

### 函数 `parseRecognizedQuestion`

源码：`src/editor/question-modal.ts:29`

Parses a JSON-only vision result into the question fields supported by the editor.

```ts
export function parseRecognizedQuestion(value: string, fallback: MindMapQuestion): MindMapQuestion | null
```

### 函数 `parseQuestionEnrichment`

源码：`src/editor/question-modal.ts:68`

Applies an AI lookup result only when it explicitly includes a verifiable original-question source.

```ts
export function parseQuestionEnrichment(value: string, fallback: MindMapQuestion):
```

### 类 `QuestionEditModal`

源码：`src/editor/question-modal.ts:94`

Modal editor for the structured question attached to a node.

```ts
export class QuestionEditModal extends Modal
```

### 构造函数 `QuestionEditModal.constructor`

源码：`src/editor/question-modal.ts:98`

Creates a modal around the selected node's existing question payload.

```ts
constructor( app: App, question: MindMapQuestion | undefined, private readonly nodeId: string, private readonly callbacks: Pick<MindMapEditorCallbacks, "onEnrichQuestion" | "onReadImageSource" | "onRecognizeImage">, private readonly onSubmit: (question: Min…
```

### 方法 `QuestionEditModal.onOpen`

源码：`src/editor/question-modal.ts:110`

Initializes the modal surface and renders the current draft.

```ts
onOpen(): void
```

### 方法 `QuestionEditModal.render`

源码：`src/editor/question-modal.ts:116`

Rebuilds the compact question form after a mode, tag, or field change.

```ts
private render(): void
```

### 方法 `QuestionEditModal.renderBlocks`

源码：`src/editor/question-modal.ts:174`

Renders one question field with inline LaTeX insertion and a live MathJax preview.

```ts
private renderBlocks(label: string, blocks: MindMapContentBlock[], update: (blocks: MindMapContentBlock[]) => void): void
```

### 方法 `QuestionEditModal.recognizeQuestion`

源码：`src/editor/question-modal.ts:226`

Sends the first question image to the configured vision service and applies a JSON result.

```ts
private async recognizeQuestion(showSuccess = true): Promise<boolean>
```

### 方法 `QuestionEditModal.convertAndEnrichQuestion`

源码：`src/editor/question-modal.ts:248`

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

### 类型 `QuestionPracticeOrder`

源码：`src/editor/question-practice-mode.ts:26`

Supported ordering modes for a single answer session.

```ts
export type QuestionPracticeOrder = "random" | "sequential";
```

### 接口 `QuestionPracticeOptions`

源码：`src/editor/question-practice-mode.ts:29`

Dependencies required to render and persist one question-bank practice session.

```ts
export interface QuestionPracticeOptions
```

### 函数 `createQuestionPracticeState`

源码：`src/editor/question-practice-mode.ts:42`

Creates an empty practice state for an editor instance.

```ts
export function createQuestionPracticeState(): QuestionPracticeState
```

### 函数 `renderQuestionPracticeMode`

源码：`src/editor/question-practice-mode.ts:47`

Renders a full-page, sequential question practice surface.

```ts
export function renderQuestionPracticeMode(container: HTMLElement, options: QuestionPracticeOptions): void
```

### 函数 `orderPracticeQuestions`

源码：`src/editor/question-practice-mode.ts:202`

Keeps one session stable while adding new questions in the requested random or sequential order.

```ts
function orderPracticeQuestions(nodes: MindMapNode[], state: QuestionPracticeState, order: QuestionPracticeOrder): MindMapNode[]
```

### 函数 `shuffle`

源码：`src/editor/question-practice-mode.ts:230`

Performs an in-place Fisher-Yates shuffle for one answer session.

```ts
function shuffle<T>(items: T[]): void
```

### 函数 `selectedAnswerLabels`

源码：`src/editor/question-practice-mode.ts:238`

Extracts option labels from the stored answer to determine whether a question is multiple-choice.

```ts
function selectedAnswerLabels(node: MindMapNode): string[]
```

### 函数 `isQuestionChoiceCorrect`

源码：`src/editor/question-practice-mode.ts:245`

Checks selected option IDs against the labels encoded in the structured answer.

```ts
export function isQuestionChoiceCorrect(node: MindMapNode, selectedIds: readonly string[]): boolean
```

### 函数 `isQuestionJudgmentCorrect`

源码：`src/editor/question-practice-mode.ts:252`

Checks true-or-false answers expressed as A/B, correct/incorrect, or equivalent labels.

```ts
export function isQuestionJudgmentCorrect(node: MindMapNode, selectedIds: readonly string[]): boolean
```

### 函数 `renderQuestionTextBlocks`

源码：`src/editor/question-practice-mode.ts:259`

Renders one or more question text blocks with inline/display LaTeX support.

```ts
function renderQuestionTextBlocks( container: HTMLElement, blocks: readonly MindMapContentBlock[], fallback: string, renderRichText: QuestionPracticeOptions["renderRichText"] ): void
```

### 函数 `renderBlocks`

源码：`src/editor/question-practice-mode.ts:278`

Renders text and image blocks in their original order.

```ts
function renderBlocks( container: HTMLElement, blocks: readonly MindMapContentBlock[], resolveImage: (source: string) => string | null, renderRichText: QuestionPracticeOptions["renderRichText"] ): void
```

### 函数 `renderExplanationBlocks`

源码：`src/editor/question-practice-mode.ts:297`

Renders A/B/C/D explanation paragraphs as separate readable lines.

```ts
function renderExplanationBlocks( container: HTMLElement, blocks: readonly MindMapContentBlock[], resolveImage: (source: string) => string | null, renderRichText: QuestionPracticeOptions["renderRichText"] ): void
```

### 函数 `splitExplanationLines`

源码：`src/editor/question-practice-mode.ts:316`

Splits the introduction, A/B/C/D analyses, and the trailing conclusion into readable paragraphs.

```ts
export function splitExplanationLines(value: string): string[]
```

### 函数 `splitFinalOptionConclusion`

源码：`src/editor/question-practice-mode.ts:344`

Separates a final-answer summary from the last option analysis without fragmenting its wording.

```ts
function splitFinalOptionConclusion(segment: string): string[]
```

### 函数 `resetPracticeProgress`

源码：`src/editor/question-practice-mode.ts:373`

Clears transient practice state when the active question set changes.

```ts
function resetPracticeProgress(state: QuestionPracticeState): void
```

### 函数 `blockText`

源码：`src/editor/question-practice-mode.ts:385`

Joins text blocks into the stored reference answer.

```ts
function blockText(blocks: readonly MindMapContentBlock[]): string
```

### 函数 `isExactQuestionAnswer`

源码：`src/editor/question-practice-mode.ts:390`

Normalizes free-text answers for deterministic long-question comparison.

```ts
export function isExactQuestionAnswer(value: string, reference: string): boolean
```

### 函数 `normalizeAnswer`

源码：`src/editor/question-practice-mode.ts:395`

Normalizes free-text answers before deterministic long-question comparison.

```ts
function normalizeAnswer(value: string): string
```

### 函数 `normalizeJudgmentAnswer`

源码：`src/editor/question-practice-mode.ts:400`

Converts supported judgment-answer spellings into a comparable boolean.

```ts
function normalizeJudgmentAnswer(value: string): boolean | null
```

## `src/editor/rich-text-dom.ts`

编辑器领域中富文本模型与可编辑 DOM 的转换。

### 函数 `ensureMathJax`

源码：`src/editor/rich-text-dom.ts:23`

确保 Obsidian 的 MathJax 运行时已加载。

```ts
export function ensureMathJax(): Promise<void>
```

### 函数 `styleEquals`

源码：`src/editor/rich-text-dom.ts:36`

判断两个字符样式是否等价。

```ts
function styleEquals(left: MindMapTextStyle | undefined, right: MindMapTextStyle | undefined): boolean
```

### 函数 `renderRichTextRuns`

源码：`src/editor/rich-text-dom.ts:48`

将富文本运行段渲染到 DOM，并按需处理 LaTeX。

```ts
export function renderRichTextRuns( container: HTMLElement, runs: MindMapTextRun[] | undefined, fallbackText: string, latex = true ): void
```

### 函数 `renderInlineMarkdown`

源码：`src/editor/rich-text-dom.ts:119`

Renders the supported inline Markdown formatting used in table cells.

```ts
export function renderInlineMarkdown(container: HTMLElement, markdown: string): void
```

### 函数 `styleFromElement`

源码：`src/editor/rich-text-dom.ts:131`

合并元素标签、内联样式与继承样式。

```ts
function styleFromElement(element: HTMLElement, inherited: MindMapTextStyle): MindMapTextStyle
```

### 函数 `readRichTextEditor`

源码：`src/editor/rich-text-dom.ts:167`

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

## `src/editor/table-interaction.ts`

文章表格的动态锁状态、双击编辑和列宽拖拽事件绑定。

### 接口 `PointerCaptureEventTarget`

源码：`src/editor/table-interaction.ts:7`

参见源码中的实现和调用位置。

```ts
export interface PointerCaptureEventTarget extends EventTarget
```

### 接口 `TableEditInteractionOptions`

源码：`src/editor/table-interaction.ts:12`

Options for a table double-click edit binding.

```ts
export interface TableEditInteractionOptions
```

### 接口 `TableColumnResizeOptions`

源码：`src/editor/table-interaction.ts:19`

Options for one table-column resize handle.

```ts
export interface TableColumnResizeOptions
```

### 函数 `resizeAdjacentTableColumns`

源码：`src/editor/table-interaction.ts:34`

Resizes one table boundary while keeping the total table width unchanged. The column on the right absorbs the inverse delta, so article tables stay fitted to their page instead of creating a horizontal scrolling surface.

```ts
export function resizeAdjacentTableColumns( sourceWidths: readonly number[], columnIndex: number, delta: number, minimumWidth = 64 ): number[]
```

### 函数 `bindTableDoubleClick`

源码：`src/editor/table-interaction.ts:59`

Binds table editing to the live lock state instead of the state captured when article DOM was first rendered.

```ts
export function bindTableDoubleClick(target: EventTarget, options: TableEditInteractionOptions): void
```

### 函数 `bindTableColumnResize`

源码：`src/editor/table-interaction.ts:75`

Binds a pointer drag that resizes one table column and commits all widths after release.

```ts
export function bindTableColumnResize(handle: PointerCaptureEventTarget, options: TableColumnResizeOptions): void
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

### 函数 `normalizeVaultRelativePath`

源码：`src/file-explorer-filter.ts:30`

Normalizes one vault-relative path without resolving it against the operating system.

```ts
function normalizeVaultRelativePath(path: string): string
```

### 函数 `fileExplorerFilterSignature`

源码：`src/file-explorer-filter.ts:35`

Builds a stable semantic key so unrelated settings saves do not rescan File Explorer.

```ts
export function fileExplorerFilterSignature(settings: FileExplorerFilterSettings): string
```

### 函数 `createFileExplorerPathFilter`

源码：`src/file-explorer-filter.ts:46`

Compiles normalized extension and folder rules once for an entire File Explorer scan.

```ts
export function createFileExplorerPathFilter(settings: FileExplorerFilterSettings): (path: string) => boolean
```

### 函数 `shouldHideFileExplorerPath`

源码：`src/file-explorer-filter.ts:74`

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

### 接口 `ArticleExportOptions`

源码：`src/import/import-export.ts:95`

Global defaults used when a physical document does not override terminal numbering.

```ts
export interface ArticleExportOptions
```

### 函数 `exportLeafNumbering`

源码：`src/import/import-export.ts:102`

Resolves terminal numbering with per-document style taking precedence over plugin defaults.

```ts
function exportLeafNumbering( document: MindMapDocument, options: ArticleExportOptions, numberingDisabled = false ): ArticleLeafNumberingOptions
```

### 函数 `htmlArticleDisplayTitle`

源码：`src/import/import-export.ts:116`

Returns HTML title markup with a font-independent CSS ring for every circled terminal number.

```ts
function htmlArticleDisplayTitle(info: ArticleNodeInfo): string
```

### 函数 `exportAnchor`

源码：`src/import/import-export.ts:125`

生成跨文件导出时稳定且唯一的标题锚点。

```ts
function exportAnchor(sectionIndex: number, anchor: string): string
```

### 函数 `markdownTitle`

源码：`src/import/import-export.ts:130`

返回带目录编号的 Markdown 标题文本。

```ts
function markdownTitle(label: string, title: string, fallback = "未命名"): string
```

### 函数 `parentNodeKey`

源码：`src/import/import-export.ts:135`

返回跨文件目录项映射键。

```ts
function parentNodeKey(filePath: string | undefined, nodeId: string | undefined): string | null
```

### 函数 `normalizedExportTocMaxDepth`

源码：`src/import/import-export.ts:140`

返回导出目录允许显示的层级。

```ts
function normalizedExportTocMaxDepth(value: number): number
```

### 函数 `markdownHeading`

源码：`src/import/import-export.ts:145`

生成兼容常用 Markdown 渲染器的标题片段。

```ts
function markdownHeading(level: number, title: string): string
```

### 函数 `markdownAnchor`

源码：`src/import/import-export.ts:150`

按常见 Markdown 标题规则生成目录片段。

```ts
function markdownAnchor(title: string): string
```

### 函数 `htmlTocList`

源码：`src/import/import-export.ts:161`

将扁平的层级目录条目转换为兼容 Word 的嵌套列表。

```ts
function htmlTocList(items: Array<
```

### 类型 `TocBranch`

源码：`src/import/import-export.ts:163`

嵌套目录中的单个章节及其下级章节。

```ts
type TocBranch =
```

### 函数 `escapeXml`

源码：`src/import/import-export.ts:179`

转义 OOXML 文本内容。

```ts
function escapeXml(value: string): string
```

### 函数 `collectExportTocItems`

源码：`src/import/import-export.ts:184`

将导出章节收集为父子导图顺序一致的目录项。

```ts
function collectExportTocItems( sections: ReadingSection[], maxTocDepth: number, includeTerminalHeadings = true, options: ArticleExportOptions =
```

### 函数 `readingSectionsToHtml`

源码：`src/import/import-export.ts:230`

Produces one portable article from a map and all recursively collected child maps in the same order used by continuous reading mode.

```ts
export function readingSectionsToHtml(sections: ReadingSection[], tocMaxDepth = 3, options: ArticleExportOptions =
```

### 函数 `readingSectionsToDocx`

源码：`src/import/import-export.ts:314`

Produces a native Word document with bookmarks and internal TOC hyperlinks.

```ts
export function readingSectionsToDocx(sections: ReadingSection[], tocMaxDepth = 3, options: ArticleExportOptions =
```

### 函数 `readingSectionsToMarkdown`

源码：`src/import/import-export.ts:386`

Produces article-oriented Markdown with a linked table of contents.

```ts
export function readingSectionsToMarkdown(sections: ReadingSection[], tocMaxDepth = 3, options: ArticleExportOptions =
```

## `src/main.ts`

插件入口与跨文件服务层。

### 接口 `PendingAutoUploadJob`

源码：`src/main.ts:131`

One deduplicated image auto-upload request waiting for its file batch.

```ts
interface PendingAutoUploadJob
```

### 接口 `CompletedAutoUploadJob`

源码：`src/main.ts:142`

Network result retained until it can be merged into the latest live document.

```ts
interface CompletedAutoUploadJob
```

### 函数 `matchesRecordedShortcut`

源码：`src/main.ts:151`

Returns whether a keyboard event exactly matches one recorded plugin shortcut.

```ts
function matchesRecordedShortcut(event: KeyboardEvent, shortcut: string): boolean
```

### 类 `MindMapStudioPlugin`

源码：`src/main.ts:170`

MindMapStudioPlugin 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export default class MindMapStudioPlugin extends Plugin
```

### 方法 `MindMapStudioPlugin.onload`

源码：`src/main.ts:200`

执行“onload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async onload(): Promise<void>
```

### 方法 `MindMapStudioPlugin.onunload`

源码：`src/main.ts:386`

执行“onunload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
onunload(): void
```

### 方法 `MindMapStudioPlugin.openGlobalSearch`

源码：`src/main.ts:411`

打开global search，并保持模型、界面和持久化状态的一致性。

```ts
openGlobalSearch(): void
```

### 方法 `MindMapStudioPlugin.openGlobalSearchAfterIndexReady`

源码：`src/main.ts:418`

打开global search after index ready，并保持模型、界面和持久化状态的一致性。

```ts
private async openGlobalSearchAfterIndexReady(): Promise<void>
```

### 方法 `MindMapStudioPlugin.openMapFamilySearch`

源码：`src/main.ts:436`

打开map family search，并保持模型、界面和持久化状态的一致性。

```ts
async openMapFamilySearch(file: TFile, currentDocument?: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.rebuildGlobalSearchIndex`

源码：`src/main.ts:459`

重建global search index，并保持模型、界面和持久化状态的一致性。

```ts
async rebuildGlobalSearchIndex(): Promise<void>
```

### 方法 `MindMapStudioPlugin.getGlobalSearchIndexStatus`

源码：`src/main.ts:469`

读取并返回global search index status，并保持模型、界面和持久化状态的一致性。

```ts
getGlobalSearchIndexStatus()
```

### 方法 `MindMapStudioPlugin.openGlobalSearchResult`

源码：`src/main.ts:478`

打开global search result，并保持模型、界面和持久化状态的一致性。

```ts
private async openGlobalSearchResult(result: MindMapSearchResult): Promise<void>
```

### 方法 `MindMapStudioPlugin.replaceAllInSearchResults`

源码：`src/main.ts:491`

批量替换搜索结果中的节点文字。

```ts
private async replaceAllInSearchResults(results: MindMapSearchResult[], query: string, replacement: string, useRegex: boolean): Promise<number>
```

### 方法 `MindMapStudioPlugin.logDebug`

源码：`src/main.ts:572`

Writes one structured event into the current in-memory diagnostic session.

```ts
logDebug(scope: string, event: string, details?: unknown): void
```

### 方法 `MindMapStudioPlugin.setDebugMode`

源码：`src/main.ts:577`

Enables or disables runtime diagnostics and persists the setting.

```ts
async setDebugMode(enabled: boolean): Promise<void>
```

### 方法 `MindMapStudioPlugin.copyDebugLogToClipboard`

源码：`src/main.ts:585`

Copies the current bounded diagnostic session as line-delimited JSON.

```ts
async copyDebugLogToClipboard(): Promise<void>
```

### 方法 `MindMapStudioPlugin.installRuntimeDebugCapture`

源码：`src/main.ts:618`

Captures user operations and uncaught failures while debug mode is enabled.

```ts
private installRuntimeDebugCapture(): void
```

### 方法 `MindMapStudioPlugin.loadSettings`

源码：`src/main.ts:663`

加载settings，并保持模型、界面和持久化状态的一致性。

```ts
async loadSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.applyLoadedSettings`

源码：`src/main.ts:669`

规范化已加载或导入的插件配置，并应用到当前会话。

```ts
private applyLoadedSettings(loaded: Partial<MindMapStudioSettings> | null): void
```

### 方法 `MindMapStudioPlugin.importSettings`

源码：`src/main.ts:946`

导入插件配置，规范化后立即保存并刷新所有已打开视图。

```ts
async importSettings(settings: unknown): Promise<void>
```

### 方法 `MindMapStudioPlugin.createSettingsWriter`

源码：`src/main.ts:958`

Creates the single-flight settings writer used by every settings mutation path.

```ts
private createSettingsWriter(): CoalescedJsonWriter<MindMapStudioSettings>
```

### 方法 `MindMapStudioPlugin.saveSettings`

源码：`src/main.ts:976`

合并短时间内连续触发的设置保存，并保证所有磁盘写入严格串行。

```ts
async saveSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.checkForPluginUpdate`

源码：`src/main.ts:982`

Checks the release-workflow update manifest, verifies its archive, and requires a full app restart to activate it.

```ts
async checkForPluginUpdate(): Promise<"up-to-date" | "updated">
```

### 方法 `MindMapStudioPlugin.askAi`

源码：`src/main.ts:1021`

使用指定 AI 配置发送当前 Markdown 上下文。

```ts
async askAi(profileId: string, payload: AiMarkdownPayload, question: string, onStreamUpdate?: (update: AiStreamUpdate) => void): Promise<AiCompletionResult>
```

### 方法 `MindMapStudioPlugin.enrichQuestion`

源码：`src/main.ts:1028`

Converts a transcribed question into a verified original-question lookup result when the selected model supports web retrieval.

```ts
async enrichQuestion(questionText: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.proposeAiEdit`

源码：`src/main.ts:1057`

使用指定 AI 配置生成 Markdown 修改提案，但不直接修改导图。

```ts
async proposeAiEdit(profileId: string, payload: AiMarkdownPayload, instruction: string, onStreamUpdate?: (update: AiStreamUpdate) => void): Promise<AiCompletionResult>
```

### 方法 `MindMapStudioPlugin.recognizeImage`

源码：`src/main.ts:1064`

使用当前识图模式处理单张图片；AI 模式可指定接口，本地 OCR 模式不会联网。

```ts
async recognizeImage( image: RecognizableImage, blob: Blob, profileId?: string, instruction?: string, remoteUrl?: string ): Promise<ImageRecognitionItemResult>
```

### 方法 `MindMapStudioPlugin.captureScreenshot`

源码：`src/main.ts:1096`

按普通截图或截图并识别模式启动桌面覆盖层，并根据设置决定是否隐藏 Obsidian。

```ts
async captureScreenshot(recognizeAfter = false)
```

### 方法 `MindMapStudioPlugin.testAiProfile`

源码：`src/main.ts:1104`

使用最小请求检测 AI 接口、鉴权和模型是否可用。

```ts
async testAiProfile(profileId: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.getAiProfileModels`

源码：`src/main.ts:1131`

获取配置服务公开的模型目录，不改变当前选择的模型。

```ts
async getAiProfileModels(profileId: string): Promise<string[]>
```

### 方法 `MindMapStudioPlugin.setAiProfileThinkingMode`

源码：`src/main.ts:1139`

保存由 AI 助手窗口切换的深度思考状态，并与设置页共用同一配置。

```ts
async setAiProfileThinkingMode(profileId: string, enabled: boolean): Promise<void>
```

### 方法 `MindMapStudioPlugin.installFileExplorerFilter`

源码：`src/main.ts:1147`

Installs a lightweight File Explorer observer; it changes visibility only, never vault data.

```ts
private installFileExplorerFilter(): void
```

### 方法 `MindMapStudioPlugin.fileExplorerMutationRoots`

源码：`src/main.ts:1167`

Collects only added or retargeted File Explorer subtrees that can contain unfiltered paths.

```ts
private fileExplorerMutationRoots(records: MutationRecord[]): Element[]
```

### 方法 `MindMapStudioPlugin.queueFileExplorerFilterRoot`

源码：`src/main.ts:1189`

Adds one incremental scan root while removing nested duplicates from the pending batch.

```ts
private queueFileExplorerFilterRoot(root: Element): void
```

### 方法 `MindMapStudioPlugin.applyFileExplorerFilterRoot`

源码：`src/main.ts:1198`

Applies the compiled visibility rule to one File Explorer subtree.

```ts
private applyFileExplorerFilterRoot(root: Element, shouldHidePath: (path: string) => boolean): void
```

### 方法 `MindMapStudioPlugin.scheduleFileExplorerFilter`

源码：`src/main.ts:1212`

Defers filtering and scans either the whole File Explorer or only newly changed subtrees.

```ts
private scheduleFileExplorerFilter(roots?: Iterable<Element>): void
```

### 方法 `MindMapStudioPlugin.getActiveDisplayMode`

源码：`src/main.ts:1239`

返回当前会话正在使用的显示模式。大纲可在会话内同步，但不会成为下次启动默认值。

```ts
getActiveDisplayMode(): DisplayMode
```

### 方法 `MindMapStudioPlugin.isQuestionBankFile`

源码：`src/main.ts:1248`

Returns whether a map path belongs to the configured question-bank folder or one of its descendants.

```ts
isQuestionBankFile(file: TFile | null): boolean
```

### 方法 `MindMapStudioPlugin.setGlobalDisplayMode`

源码：`src/main.ts:1260`

同步所有已打开视图的显示模式。导图、文章和通读会持久化为下次启动模式； 大纲仅记录在当前会话，避免重新打开插件时默认进入大纲。

```ts
async setGlobalDisplayMode(mode: DisplayMode): Promise<void>
```

### 方法 `MindMapStudioPlugin.renameReadingLocationPathInSettings`

源码：`src/main.ts:1275`

将文件重命名同步到所有语义阅读位置链，避免改名后恢复记录失联。

```ts
private async renameReadingLocationPathInSettings(oldPath: string, newPath: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.resetAllSettings`

源码：`src/main.ts:1296`

执行“reset all settings”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async resetAllSettings(): Promise<void>
```

### 方法 `MindMapStudioPlugin.refreshOpenViews`

源码：`src/main.ts:1307`

刷新open views，并保持模型、界面和持久化状态的一致性。

```ts
refreshOpenViews(): void
```

### 方法 `MindMapStudioPlugin.createConfiguredDocument`

源码：`src/main.ts:1319`

创建configured document，并保持模型、界面和持久化状态的一致性。

```ts
createConfiguredDocument(title: string): MindMapDocument
```

### 方法 `MindMapStudioPlugin.resolveMindMapFile`

源码：`src/main.ts:1335`

解析并确定mind map file，并保持模型、界面和持久化状态的一致性。

```ts
private resolveMindMapFile(path: string, sourcePath = ""): TFile | null
```

### 方法 `MindMapStudioPlugin.readMindMapDocument`

源码：`src/main.ts:1350`

执行“read mind map document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async readMindMapDocument(file: TFile): Promise<MindMapDocument>
```

### 方法 `MindMapStudioPlugin.findArticleNodeDepth`

源码：`src/main.ts:1362`

按自动或手动文章层级查找目标节点的绝对深度，而不是直接使用物理树深度。

```ts
private findArticleNodeDepth(root: MindMapNode, nodeId: string, baseDepth = 0): number | null
```

### 方法 `MindMapStudioPlugin.computeArticleBaseDepth`

源码：`src/main.ts:1374`

执行“compute article base depth”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async computeArticleBaseDepth(file: TFile, document: MindMapDocument, visited = new Set<string>()): Promise<number>
```

### 方法 `MindMapStudioPlugin.buildArticleContext`

源码：`src/main.ts:1402`

沿子导图 navigation.parentPath 逐级回溯父文件，计算当前子导图在整篇文章中的基础标题深度、完整面包屑和顶层目录数据，并防止循环引用。

```ts
async buildArticleContext(file: TFile, document: MindMapDocument): Promise<
```

### 类型 `Item`

源码：`src/main.ts:1442`

Item 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
type Item =
```

### 方法 `MindMapStudioPlugin.buildDescendantReadingSections`

源码：`src/main.ts:1576`

Collects the current map and every reachable child map without walking up to its parent. This is the export counterpart of continuous reading.

```ts
async buildDescendantReadingSections(file: TFile, document: MindMapDocument): Promise<ReadingSection[]>
```

### 方法 `MindMapStudioPlugin.getAvailablePath`

源码：`src/main.ts:1629`

读取并返回available path，并保持模型、界面和持久化状态的一致性。

```ts
async getAvailablePath(preferredPath: string): Promise<string>
```

### 方法 `MindMapStudioPlugin.createMindMap`

源码：`src/main.ts:1646`

创建mind map，并保持模型、界面和持久化状态的一致性。

```ts
async createMindMap(options:
```

### 方法 `MindMapStudioPlugin.syncMindMapTitleToFilename`

源码：`src/main.ts:1677`

Synchronizes a saved map's filename with its root node title and preserves parent/child navigation references when the map is linked as a submap.

```ts
async syncMindMapTitleToFilename(file: TFile, document: MindMapDocument): Promise<TFile>
```

### 方法 `MindMapStudioPlugin.updateParentSubmapReference`

源码：`src/main.ts:1698`

Updates the parent node that links to a renamed child map.

```ts
private async updateParentSubmapReference(file: TFile, oldPath: string, parentPath: string | undefined, parentNodeId: string | undefined): Promise<void>
```

### 方法 `MindMapStudioPlugin.updateChildSubmapNavigation`

源码：`src/main.ts:1713`

Updates navigation metadata in child maps after their parent map was renamed.

```ts
private async updateChildSubmapNavigation(file: TFile, oldPath: string, document: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.consumePendingMindMapFocus`

源码：`src/main.ts:1728`

Returns and clears a chapter target queued before a mind-map view starts loading its file.

```ts
consumePendingMindMapFocus(filePath: string): string | null
```

### 方法 `MindMapStudioPlugin.consumePendingMindMapDirectory`

源码：`src/main.ts:1737`

Returns and clears a queued directory landing intent for the file being loaded.

```ts
consumePendingMindMapDirectory(filePath: string):
```

### 方法 `MindMapStudioPlugin.openAsMindMap`

源码：`src/main.ts:1757`

打开as mind map，并保持模型、界面和持久化状态的一致性。

```ts
async openAsMindMap(file: TFile, preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<WorkspaceLeaf>
```

### 方法 `MindMapStudioPlugin.savePastedImage`

源码：`src/main.ts:1787`

保存pasted image，并保持模型、界面和持久化状态的一致性。

```ts
async savePastedImage(blob: Blob, suggestedName: string, sourceFile: TFile | null): Promise<string>
```

### 方法 `MindMapStudioPlugin.importDesktopMarkdownImages`

源码：`src/main.ts:1812`

读取桌面 Markdown 同目录或附件回退路径中的图片，并复制到当前导图资源目录。

```ts
async importDesktopMarkdownImages(document: MindMapDocument, sourceDirectory: string, mindMapFile: TFile | null): Promise<number>
```

### 方法 `MindMapStudioPlugin.readImageSource`

源码：`src/main.ts:1839`

执行“read image source”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async readImageSource(source: string, sourceFile: TFile | null): Promise<
```

### 方法 `MindMapStudioPlugin.getImageHostChoices`

源码：`src/main.ts:1870`

读取并返回image host choices，并保持模型、界面和持久化状态的一致性。

```ts
getImageHostChoices(): ImageHostChoice[]
```

### 方法 `MindMapStudioPlugin.getImageHostPriorityIds`

源码：`src/main.ts:1878`

Returns enabled image host IDs ordered by render failover priority.

```ts
getImageHostPriorityIds(): string[]
```

### 方法 `MindMapStudioPlugin.getDefaultUploadHostIds`

源码：`src/main.ts:1889`

读取并返回default upload host ids，并保持模型、界面和持久化状态的一致性。

```ts
getDefaultUploadHostIds(): string[]
```

### 方法 `MindMapStudioPlugin.uploadImageToHosts`

源码：`src/main.ts:1903`

把同一张图片上传到多个已配置图床，分别收集成功与失败结果。只有所有选中图床成功且文档保存完成后，调用方才允许删除本地文件。

```ts
async uploadImageToHosts(blob: Blob, suggestedName: string, hostIds: string[]): Promise<ImageHostUploadBatch>
```

### 方法 `MindMapStudioPlugin.testImageHost`

源码：`src/main.ts:1967`

执行“test image host”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async testImageHost(hostId: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.scheduleAutoUpload`

源码：`src/main.ts:2013`

安排延迟执行auto upload，并保持模型、界面和持久化状态的一致性。

```ts
scheduleAutoUpload(file: TFile | null, nodeId: string, blockId: string, localPath: string, suggestedName: string): boolean
```

### 方法 `MindMapStudioPlugin.deleteRecognizedImageLocalAsset`

源码：`src/main.ts:2025`

删除已被识图文字替换的本地图片；共享资源会保留。

```ts
async deleteRecognizedImageLocalAsset(mindMapPath: string, localPath: string, blockId: string): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.cleanupRemovedImageRemoteAssets`

源码：`src/main.ts:2034`

Schedules remote mirrors for deletion after a one-minute Undo safety window. The final timer callback rescans every map and cancels deletion when the image has been restored.

```ts
async cleanupRemovedImageRemoteAssets( currentMindMapPath: string, removed: MindMapImageContentBlock, documentAfterRemoval: MindMapDocument ): Promise<void>
```

### 方法 `MindMapStudioPlugin.scheduleImageHostDeletion`

源码：`src/main.ts:2089`

Adds or refreshes one persistent one-minute remote deletion task.

```ts
private async scheduleImageHostDeletion( host: ImageHostConfig, image:
```

### 方法 `MindMapStudioPlugin.resumePendingImageHostDeletions`

源码：`src/main.ts:2114`

Restores delayed deletion timers after Obsidian restarts.

```ts
private resumePendingImageHostDeletions(): void
```

### 方法 `MindMapStudioPlugin.armPendingImageHostDeletion`

源码：`src/main.ts:2119`

Arms one task using its persisted due time.

```ts
private armPendingImageHostDeletion(pending: PendingImageHostDeletion): void
```

### 方法 `MindMapStudioPlugin.executePendingImageHostDeletion`

源码：`src/main.ts:2131`

Executes one task only after references are checked again at the end of the safety window.

```ts
private async executePendingImageHostDeletion(id: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.isPendingRemoteImageReferenced`

源码：`src/main.ts:2164`

Returns true when any currently saved or open mind map references a pending remote image.

```ts
private async isPendingRemoteImageReferenced(pending: PendingImageHostDeletion): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.shortStableId`

源码：`src/main.ts:2187`

Creates a compact deterministic identifier without persisting a full URL in a record key.

```ts
private shortStableId(value: string): string
```

### 方法 `MindMapStudioPlugin.documentReferencesImage`

源码：`src/main.ts:2197`

Returns whether one document still references an image by SHA-256 or any remote URL.

```ts
private documentReferencesImage(document: MindMapDocument, image: MindMapImageContentBlock): boolean
```

### 方法 `MindMapStudioPlugin.resumePendingAutoUploads`

源码：`src/main.ts:2207`

根据本地图片文件时间恢复延迟上传；到期图片在重新打开导图后立即上传。

```ts
async resumePendingAutoUploads(file: TFile, document: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.queueAutoUpload`

源码：`src/main.ts:2226`

安排一次可去重的本地图片自动上传。

```ts
private queueAutoUpload( mindMapFile: TFile, nodeId: string, blockId: string, localPath: string, suggestedName: string, hostIds: string[], delayMs: number ): void
```

### 方法 `MindMapStudioPlugin.enqueueReadyAutoUpload`

源码：`src/main.ts:2252`

Collects simultaneously due uploads into one file-level transaction and one user notice.

```ts
private enqueueReadyAutoUpload(job: PendingAutoUploadJob): void
```

### 方法 `MindMapStudioPlugin.startAutoUploadBatch`

源码：`src/main.ts:2272`

Serializes batches for the same TFile so stale snapshots can never overwrite each other.

```ts
private startAutoUploadBatch(mindMapFile: TFile, jobs: PendingAutoUploadJob[]): void
```

### 方法 `MindMapStudioPlugin.runAutoUploadBatch`

源码：`src/main.ts:2295`

Uploads one file's due images as a batch, then merges network results into the latest live document. Network requests intentionally finish before any document write. Results are applied as ID-based image patches to the current editor document, or to a freshly re-read disk document when closed. This prevents concurrent auto uploads from repeatedly replacing the whole map with stale snapshots.

```ts
private async runAutoUploadBatch(mindMapFile: TFile, jobs: PendingAutoUploadJob[]): Promise<void>
```

### 方法 `MindMapStudioPlugin.applyAutoUploadPatches`

源码：`src/main.ts:2401`

Applies upload patches to live views when open, otherwise to a freshly re-read disk document.

```ts
private async applyAutoUploadPatches(file: TFile, patches: readonly MindMapImageUploadPatch[]): Promise<number>
```

### 方法 `MindMapStudioPlugin.uploadImageToHostConfig`

源码：`src/main.ts:2425`

按单个图床配置上传图片，并从 JSON 或文本响应中解析最终图片地址。 @throws 配置、请求体或响应格式不合法，以及网络请求失败时抛出错误。

```ts
private async uploadImageToHostConfig(host: ImageHostConfig, blob: Blob, suggestedName: string): Promise<
```

### 方法 `MindMapStudioPlugin.resolveZiplineFileId`

源码：`src/main.ts:2470`

Resolve a Zipline file URL back to its current v4 file ID for legacy cache entries or incomplete upload responses.

```ts
private async resolveZiplineFileId(host: ImageHostConfig, imageUrl: string): Promise<string | undefined>
```

### 方法 `MindMapStudioPlugin.deleteImageFromHostConfig`

源码：`src/main.ts:2485`

Calls one explicitly configured image-host deletion API.

```ts
private async deleteImageFromHostConfig(host: ImageHostConfig, url: string, hash?: string, deleteKey?: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.flushOpenView`

源码：`src/main.ts:2512`

执行“flush open view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async flushOpenView(path: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.refreshOpenMindMap`

源码：`src/main.ts:2524`

刷新open mind map，并保持模型、界面和持久化状态的一致性。

```ts
private async refreshOpenMindMap(file: TFile, document: MindMapDocument): Promise<void>
```

### 方法 `MindMapStudioPlugin.deleteLocalAssetIfSafe`

源码：`src/main.ts:2540`

在删除本地图片前进行最终安全检查：远程源必须存在、当前文档必须已保存、资源路径必须是仓库内文件且没有其他节点继续引用。

```ts
private async deleteLocalAssetIfSafe(localPath: string, currentMindMapPath: string, blockId: string): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.mimeFromFilename`

源码：`src/main.ts:2575`

根据资源文件名推断图片 MIME，未知扩展名按二进制流处理。

```ts
private mimeFromFilename(filename: string): string
```

### 方法 `MindMapStudioPlugin.createSubmapFile`

源码：`src/main.ts:2587`

在父导图资源目录下创建子导图文件，写入 parentPath、parentNodeId 和 parentTitle，并把生成路径回写到父节点，实现可靠的双向导航。

```ts
async createSubmapFile(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap>
```

### 方法 `MindMapStudioPlugin.buildSubmapDocument`

源码：`src/main.ts:2600`

创建子导图文档并统一写入双向导航元数据。

```ts
private buildSubmapDocument(parentFile: TFile, node: MindMapNode, includeNodeContent: boolean): MindMapDocument
```

### 方法 `MindMapStudioPlugin.persistSubmapDocument`

源码：`src/main.ts:2638`

把子导图写入父导图专属资源目录，避免多个父导图的同名子图发生路径冲突。

```ts
private async persistSubmapDocument(parentFile: TFile, node: MindMapNode, document: MindMapDocument): Promise<MindMapSubmap>
```

### 方法 `MindMapStudioPlugin.deleteSubmapFile`

源码：`src/main.ts:2657`

Moves a linked child mind-map file to the system trash.

```ts
async deleteSubmapFile(parentFile: TFile, submap: MindMapSubmap): Promise<boolean>
```

### 方法 `MindMapStudioPlugin.openMindMapPath`

源码：`src/main.ts:2672`

打开mind map path，并保持模型、界面和持久化状态的一致性。

```ts
async openMindMapPath(path: string, sourcePath = "", preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.openArticleDirectoryPath`

源码：`src/main.ts:2688`

Opens a parent/home map as its generated directory without treating the mount node as an article chapter target.

```ts
async openArticleDirectoryPath(path: string, sourcePath = "", preferredLeaf?: WorkspaceLeaf, focusNodeId?: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.resolveNavigationFocusNode`

源码：`src/main.ts:2720`

Validates explicit chapter targets and recovers a stale/missing parent mount node by child-map path.

```ts
private async resolveNavigationFocusNode(targetFile: TFile, sourcePath: string, requestedNodeId?: string): Promise<string | undefined>
```

### 方法 `MindMapStudioPlugin.ensureFolderPath`

源码：`src/main.ts:2765`

执行“ensure folder path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async ensureFolderPath(folder: string): Promise<void>
```

### 方法 `MindMapStudioPlugin.isMindMapFile`

源码：`src/main.ts:2782`

判断mind map file，并保持模型、界面和持久化状态的一致性。

```ts
isMindMapFile(file: TFile): boolean
```

### 方法 `MindMapStudioPlugin.convertMarkdownFile`

源码：`src/main.ts:2791`

转换markdown file，并保持模型、界面和持久化状态的一致性。

```ts
private async convertMarkdownFile(file: TFile): Promise<void>
```

### 方法 `MindMapStudioPlugin.copyImportedMarkdownImages`

源码：`src/main.ts:2815`

将 Markdown 中引用的本地图片复制到新导图自己的资源目录，并改写图片块引用。 导入完成后，导图不再依赖原 Markdown 附件目录，移动或删除原笔记也不会导致图片失效。

```ts
private async copyImportedMarkdownImages(document: MindMapDocument, markdownFile: TFile, mindMapFile: TFile): Promise<number>
```

### 方法 `MindMapStudioPlugin.resolveImportedMarkdownImage`

源码：`src/main.ts:2862`

按固定回退顺序查找 Markdown 中的本地图片。 例如 Markdown 引用 `assets/公文/a.png` 时，依次尝试： 1. `<Markdown目录>/assets/公文/a.png` 2. `<Markdown目录>/公文/a.png` 3. `<Markdown目录>/a.png` 三个明确候选都不存在时，再交给 Obsidian 链接解析器兼容其他附件配置。

```ts
private resolveImportedMarkdownImage(linkPath: string, markdownFile: TFile): TFile | null
```

### 方法 `MindMapStudioPlugin.resolveFolder`

源码：`src/main.ts:2889`

解析并确定folder，并保持模型、界面和持久化状态的一致性。

```ts
private async resolveFolder(explicitFolder: string | undefined, activeFile: TFile | null): Promise<string>
```

### 方法 `MindMapStudioPlugin.buildNewTitle`

源码：`src/main.ts:2903`

构建new title，并保持模型、界面和持久化状态的一致性。

```ts
private buildNewTitle(): string
```

### 方法 `MindMapStudioPlugin.sanitizeFilename`

源码：`src/main.ts:2913`

执行“sanitize filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
sanitizeFilename(value: string): string
```

### 方法 `MindMapStudioPlugin.getSourceTitle`

源码：`src/main.ts:2923`

读取并返回source title，并保持模型、界面和持久化状态的一致性。

```ts
private getSourceTitle(context: MarkdownPostProcessorContext): string
```

### 方法 `MindMapStudioPlugin.processMindMapEmbeds`

源码：`src/main.ts:2935`

注册 Markdown 代码块静态渲染，并在阅读模式中解析嵌入的思维导图源。静态预览不会修改原文件。

```ts
private async processMindMapEmbeds(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<void>
```

### 方法 `MindMapStudioPlugin.extractToSubmap`

源码：`src/main.ts:2964`

将指定节点及其后代提取为独立子导图文件。

```ts
async extractToSubmap(parentFile: TFile, node: MindMapNode): Promise<MindMapSubmap>
```

### 方法 `MindMapStudioPlugin.mergeFromSubmap`

源码：`src/main.ts:2974`

将当前子导图合并回其父导图。

```ts
async mergeFromSubmap(submapFile: TFile): Promise<void>
```

## `src/render/code-block.ts`

四种显示模式共享的代码块展示策略、Markdown 包装与行号 DOM 布局。

### 接口 `CodeBlockGlobalDefaults`

源码：`src/render/code-block.ts:9`

代码块渲染时使用的全局默认值与自动阈值。

```ts
export interface CodeBlockGlobalDefaults
```

### 接口 `ResolvedCodeBlockPresentation`

源码：`src/render/code-block.ts:18`

按节点、页面和全局设置解析后的代码块展示结果。

```ts
export interface ResolvedCodeBlockPresentation
```

### 接口 `CodeBlockRenderOptions`

源码：`src/render/code-block.ts:26`

共享代码块渲染器所需的宿主参数。

```ts
export interface CodeBlockRenderOptions
```

### 函数 `normalizeCodeLineThreshold`

源码：`src/render/code-block.ts:41`

将设置中的代码行数阈值限制为受支持的整数范围。

```ts
function normalizeCodeLineThreshold(value: number): number
```

### 函数 `countCodeLines`

源码：`src/render/code-block.ts:51`

返回源码的逻辑行数，同时兼容 LF、CRLF 和旧式 CR 换行。

```ts
export function countCodeLines(code: string): number
```

### 函数 `buildCodeLineNumberText`

源码：`src/render/code-block.ts:61`

构建行号栏使用的纯文本，确保每个号码恰好占用一个代码行高。

```ts
export function buildCodeLineNumberText(lineCount: number): string
```

### 函数 `buildFencedCodeMarkdown`

源码：`src/render/code-block.ts:72`

用不会与正文反引号冲突的围栏包装代码，供 Obsidian Markdown 渲染器高亮。

```ts
export function buildFencedCodeMarkdown(block: MindMapCodeBlock): string
```

### 函数 `resolveCodeBlockPresentation`

源码：`src/render/code-block.ts:86`

按节点显式值、自动阈值、页面设置和插件全局设置解析代码块展示状态。

```ts
export function resolveCodeBlockPresentation( block: MindMapCodeBlock, pageAppearance: CodeBlockRenderOptions["pageAppearance"], defaults: CodeBlockGlobalDefaults ): ResolvedCodeBlockPresentation
```

### 函数 `captureCodeLayoutMetrics`

源码：`src/render/code-block.ts:105`

将渲染前的代码字体、行高和内边距保存为共享 CSS 变量。

```ts
function captureCodeLayoutMetrics(pre: HTMLElement, code: HTMLElement): void
```

### 函数 `installCodeLineNumberLayout`

源码：`src/render/code-block.ts:129`

将独立行号栏插入高亮代码旁边；两栏使用同一组字体、行高和上下内边距。

```ts
export function installCodeLineNumberLayout(pre: HTMLElement, code: HTMLElement, lineCount: number): void
```

### 函数 `renderCodeBlock`

源码：`src/render/code-block.ts:148`

使用统一渲染链路创建代码块，并在 Markdown 高亮完成后安装稳定的行号布局。

```ts
export async function renderCodeBlock(options: CodeBlockRenderOptions): Promise<void>
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

## `src/render/incremental-render.ts`

大型导图与文章的确定性渲染优先级计算，不依赖浏览器 DOM。

### 接口 `SpatialRenderItem`

源码：`src/render/incremental-render.ts:9`

可参与视口优先级排序的布局项。

```ts
export interface SpatialRenderItem
```

### 接口 `SpatialViewport`

源码：`src/render/incremental-render.ts:19`

当前导图视口映射到布局世界坐标后的范围。

```ts
export interface SpatialViewport
```

### 函数 `buildHierarchyFocusOrder`

源码：`src/render/incremental-render.ts:33`

按“当前节点 → 当前节点兄弟 → 父节点 → 父节点兄弟 → 更高祖先”生成聚焦顺序。

```ts
export function buildHierarchyFocusOrder(root: MindMapNode, selectedId: string): string[]
```

### 函数 `prioritizeSpatialRenderItems`

源码：`src/render/incremental-render.ts:71`

在保持层级聚焦节点最优先的前提下，按当前视口、相邻视口和距离排序布局项。

```ts
export function prioritizeSpatialRenderItems<T extends SpatialRenderItem>( items: readonly T[], focusOrder: readonly string[], viewport?: SpatialViewport ): T[]
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

### 接口 `MeasuredNodeDimensions`

源码：`src/render/layout.ts:38`

Browser-measured dimensions used when rich node content changes size.

```ts
export interface MeasuredNodeDimensions
```

### 函数 `visibleChildren`

源码：`src/render/layout.ts:56`

执行“visible children”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function visibleChildren(node: MindMapNode): MindMapNode[]
```

### 函数 `estimatedTextLines`

源码：`src/render/layout.ts:68`

执行“estimated text lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function estimatedTextLines(text: string, width: number, fontSize: number): number
```

### 函数 `nodeDimensions`

源码：`src/render/layout.ts:83`

执行“node dimensions”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function nodeDimensions(node: MindMapNode, depth: number, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance =
```

### 函数 `subtreeHeight`

源码：`src/render/layout.ts:182`

执行“subtree height”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function subtreeHeight(node: MindMapNode, depth: number, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance =
```

### 函数 `layoutBranch`

源码：`src/render/layout.ts:215`

执行“layout branch”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function layoutBranch( node: MindMapNode, parentId: string, parentX: number, parentWidth: number, side: -1 | 1, depth: number, centerY: number, output: NodePosition[], defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance =
```

### 函数 `computeLayout`

源码：`src/render/layout.ts:258`

计算当前可见节点的尺寸、坐标、深度和整体边界。折叠节点的后代不会参与布局；节点自定义宽度和最小高度会直接影响子树占位与连接线端点。

```ts
export function computeLayout(root: MindMapNode, mode: LayoutMode, defaultFontSize = 14, visualStyle: NodeVisualStyle = "card", appearance: MindMapAppearance =
```

### 函数 `buildBranchColorMap`

源码：`src/render/layout.ts:325`

构建branch color map，并保持模型、界面和持久化状态的一致性。

```ts
export function buildBranchColorMap(root: MindMapNode, colors: string[] | undefined): Map<string, string>
```

### 函数 `edgeWidthForDepth`

源码：`src/render/layout.ts:345`

根据连接线模式计算指定层级的线宽。统一模式始终返回起始宽度；渐细模式会按当前实际最大深度插值，并保证最深层达到最小宽度。

```ts
export function edgeWidthForDepth(appearance: MindMapAppearance, depth: number, maxDepth = 5): number
```

### 函数 `edgePath`

源码：`src/render/layout.ts:365`

执行“edge path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function edgePath(parent: NodePosition, child: NodePosition, style: "curved" | "straight" | "elbow" = "curved"): string
```

### 函数 `roundedElbowEdgePath`

源码：`src/render/layout.ts:382`

Builds an orthogonal branch with rounded corners for the rounded-branch visual style without relying on external assets.

```ts
export function roundedElbowEdgePath(parent: NodePosition, child: NodePosition): string
```

### 函数 `escapeXml`

源码：`src/render/layout.ts:407`

转义xml，并保持模型、界面和持久化状态的一致性。

```ts
export function escapeXml(value: string): string
```

### 函数 `validColor`

源码：`src/render/layout.ts:421`

执行“valid color”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function validColor(value: string | undefined, fallback: string): string
```

### 函数 `svgRadius`

源码：`src/render/layout.ts:431`

执行“svg radius”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgRadius(shape: NodeShape | undefined): number
```

### 函数 `truncateRuns`

源码：`src/render/layout.ts:444`

执行“truncate runs”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function truncateRuns(runs: MindMapTextRun[], maxLength: number): MindMapTextRun[]
```

### 函数 `richTextTspans`

源码：`src/render/layout.ts:473`

执行“rich text tspans”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function richTextTspans(runs: MindMapTextRun[] | undefined, fallbackText: string, prefix: string, foreground: string, maxChars = 160): string
```

### 函数 `svgWrappedLines`

源码：`src/render/layout.ts:501`

执行“svg wrapped lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgWrappedLines(text: string, width: number, fontSize: number): string[]
```

### 函数 `svgFontFamily`

源码：`src/render/layout.ts:519`

执行“svg font family”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function svgFontFamily(mode: FontFamilyMode | undefined, customFont: string | undefined): string
```

### 函数 `documentToSvg`

源码：`src/render/layout.ts:536`

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

源码：`src/search/global-search.ts:20`

MindMapSearchEntry 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchEntry
```

### 接口 `MindMapSearchResult`

源码：`src/search/global-search.ts:44`

MindMapSearchResult 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchResult extends MindMapSearchEntry
```

### 接口 `IndexedMindMapFile`

源码：`src/search/global-search.ts:53`

IndexedMindMapFile 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface IndexedMindMapFile
```

### 接口 `PersistedMindMapSearchIndex`

源码：`src/search/global-search.ts:64`

PersistedMindMapSearchIndex 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
interface PersistedMindMapSearchIndex
```

### 接口 `MindMapSearchIndexStatus`

源码：`src/search/global-search.ts:73`

MindMapSearchIndexStatus 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface MindMapSearchIndexStatus
```

### 函数 `normalized`

源码：`src/search/global-search.ts:87`

校验并规范化d，并保持模型、界面和持久化状态的一致性。

```ts
function normalized(value: string): string
```

### 函数 `compact`

源码：`src/search/global-search.ts:98`

执行“compact”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function compact(value: string | undefined, max = 180): string | undefined
```

### 函数 `nodeDisplayText`

源码：`src/search/global-search.ts:110`

执行“node display text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function nodeDisplayText(node: MindMapNode): string
```

### 函数 `buildSearchEntries`

源码：`src/search/global-search.ts:132`

执行“field values”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function buildSearchEntries(document: MindMapDocument, filePath: string): MindMapSearchEntry[]
```

### 函数 `mergeHierarchy`

源码：`src/search/global-search.ts:169`

合并hierarchy，并保持模型、界面和持久化状态的一致性。

```ts
function mergeHierarchy(prefix: string[], suffix: string[]): string[]
```

### 函数 `resolveHierarchicalEntries`

源码：`src/search/global-search.ts:183`

Resolve parent/child map relations into paths such as 古诗 › 唐诗 › 李白.

```ts
export function resolveHierarchicalEntries(files: Record<string, IndexedMindMapFile>): MindMapSearchEntry[]
```

### 函数 `resultSnippet`

源码：`src/search/global-search.ts:251`

执行“result snippet”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function resultSnippet(entry: MindMapSearchEntry, query: string, useRegex = false):
```

### 函数 `searchEntries`

源码：`src/search/global-search.ts:277`

执行“search entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
export function searchEntries(entries: MindMapSearchEntry[], query: string, limit = 100, useRegex = false): MindMapSearchResult[]
```

### 函数 `collectIndexedFamilyPaths`

源码：`src/search/global-search.ts:321`

从当前文件向上寻找最顶层父导图，再向下递归收集全部后代子导图，形成 Ctrl/Cmd+Shift+F 使用的“当前导图族”搜索范围。

```ts
export function collectIndexedFamilyPaths( files: Record<string,
```

### 类 `MindMapSearchIndex`

源码：`src/search/global-search.ts:348`

MindMapSearchIndex 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapSearchIndex
```

### 构造函数 `MindMapSearchIndex.constructor`

源码：`src/search/global-search.ts:363`

创建 MindMapSearchIndex 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( private readonly app: App, private readonly indexPath: string, private readonly extension = "mindmap" )
```

### 方法 `MindMapSearchIndex.initialize`

源码：`src/search/global-search.ts:372`

执行“initialize”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
async initialize(): Promise<void>
```

### 方法 `MindMapSearchIndex.destroy`

源码：`src/search/global-search.ts:380`

执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
destroy(): void
```

### 方法 `MindMapSearchIndex.getStatus`

源码：`src/search/global-search.ts:391`

读取并返回status，并保持模型、界面和持久化状态的一致性。

```ts
getStatus(): MindMapSearchIndexStatus
```

### 方法 `MindMapSearchIndex.allEntries`

源码：`src/search/global-search.ts:403`

执行“all entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
allEntries(filePaths?: ReadonlySet<string>): MindMapSearchEntry[]
```

### 方法 `MindMapSearchIndex.getScopedStatus`

源码：`src/search/global-search.ts:416`

读取并返回scoped status，并保持模型、界面和持久化状态的一致性。

```ts
getScopedStatus(filePaths: ReadonlySet<string>):
```

### 方法 `MindMapSearchIndex.search`

源码：`src/search/global-search.ts:437`

执行“search”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
search(query: string, limit = 100, filePaths?: ReadonlySet<string>, useRegex = false): MindMapSearchResult[]
```

### 方法 `MindMapSearchIndex.refreshFamily`

源码：`src/search/global-search.ts:447`

Refresh a parent map and every recursively linked child map, then return the exact set of files that belongs to that map family. This is deliberately on-demand so an existing child map is searchable without recreating it or manually rebuilding the whole-vault index.

```ts
async refreshFamily(rootPath: string, currentDocument?: MindMapDocument): Promise<Set<string>>
```

### 方法 `MindMapSearchIndex.queueFile`

源码：`src/search/global-search.ts:529`

执行“queue file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
queueFile(file: TFile, delay = 500): void
```

### 方法 `MindMapSearchIndex.removeFile`

源码：`src/search/global-search.ts:545`

删除file，并保持模型、界面和持久化状态的一致性。

```ts
removeFile(path: string): void
```

### 方法 `MindMapSearchIndex.renameFile`

源码：`src/search/global-search.ts:559`

执行“rename file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
renameFile(file: TFile, oldPath: string): void
```

### 方法 `MindMapSearchIndex.rebuildAll`

源码：`src/search/global-search.ts:567`

重建all，并保持模型、界面和持久化状态的一致性。

```ts
async rebuildAll(): Promise<void>
```

### 方法 `MindMapSearchIndex.rebuildChangedFiles`

源码：`src/search/global-search.ts:576`

重建changed files，并保持模型、界面和持久化状态的一致性。

```ts
private async rebuildChangedFiles(): Promise<void>
```

### 方法 `MindMapSearchIndex.performRebuild`

源码：`src/search/global-search.ts:588`

执行全量或增量索引重建。它比较文件修改时间，仅解析变化的 .mindmap 文件，删除失效记录，随后重新解析跨文件层级并安排持久化。

```ts
private async performRebuild(force: boolean): Promise<void>
```

### 方法 `MindMapSearchIndex.indexFile`

源码：`src/search/global-search.ts:617`

读取并解析单个 .mindmap 文件，生成节点级搜索条目和子导图引用。读取或解析失败时移除该文件的旧索引，防止返回过期结果。

```ts
private async indexFile(file: TFile): Promise<void>
```

### 方法 `MindMapSearchIndex.walkNodes`

源码：`src/search/global-search.ts:642`

递归遍历nodes，并保持模型、界面和持久化状态的一致性。

```ts
private *walkNodes(root: MindMapNode): Generator<MindMapNode>
```

### 方法 `MindMapSearchIndex.resolveSubmapFile`

源码：`src/search/global-search.ts:659`

解析并确定submap file，并保持模型、界面和持久化状态的一致性。

```ts
private resolveSubmapFile(rawPath: string | undefined, sourcePath: string): TFile | null
```

### 方法 `MindMapSearchIndex.load`

源码：`src/search/global-search.ts:673`

加载相关数据，并保持模型、界面和持久化状态的一致性。

```ts
private async load(): Promise<void>
```

### 方法 `MindMapSearchIndex.scheduleSave`

源码：`src/search/global-search.ts:701`

安排延迟执行save，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleSave(): void
```

### 方法 `MindMapSearchIndex.saveNow`

源码：`src/search/global-search.ts:712`

保存now，并保持模型、界面和持久化状态的一致性。

```ts
private async saveNow(): Promise<void>
```

### 函数 `appendHighlightedText`

源码：`src/search/global-search.ts:728`

执行“append highlighted text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
function appendHighlightedText(container: HTMLElement, text: string, query: string, useRegex = false): void
```

### 类 `GlobalMindMapSearchModal`

源码：`src/search/global-search.ts:765`

GlobalMindMapSearchModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class GlobalMindMapSearchModal extends Modal
```

### 构造函数 `GlobalMindMapSearchModal.constructor`

源码：`src/search/global-search.ts:787`

创建 GlobalMindMapSearchModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor( app: App, private readonly index: MindMapSearchIndex, private readonly maxResults: number, private readonly onOpenResult: (result: MindMapSearchResult) => void | Promise<void>, private readonly onRebuild: () => Promise<void>, private readonly o…
```

### 方法 `GlobalMindMapSearchModal.onOpen`

源码：`src/search/global-search.ts:804`

在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。

```ts
onOpen(): void
```

### 方法 `GlobalMindMapSearchModal.onClose`

源码：`src/search/global-search.ts:902`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
onClose(): void
```

### 方法 `GlobalMindMapSearchModal.renderResults`

源码：`src/search/global-search.ts:911`

渲染results，并保持模型、界面和持久化状态的一致性。

```ts
private renderResults(query: string): void
```

### 方法 `GlobalMindMapSearchModal.renderResultList`

源码：`src/search/global-search.ts:941`

从当前 renderedResults 列表重新渲染结果，不重新查询索引。

```ts
private renderResultList(): void
```

### 方法 `GlobalMindMapSearchModal.renderResultItems`

源码：`src/search/global-search.ts:956`

渲染结果列表项。

```ts
private renderResultItems(query: string): void
```

### 方法 `GlobalMindMapSearchModal.moveActive`

源码：`src/search/global-search.ts:1016`

执行“move active”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private moveActive(delta: number): void
```

### 方法 `GlobalMindMapSearchModal.setActive`

源码：`src/search/global-search.ts:1027`

更新并应用active，并保持模型、界面和持久化状态的一致性。

```ts
private setActive(index: number): void
```

### 方法 `GlobalMindMapSearchModal.openResult`

源码：`src/search/global-search.ts:1039`

打开result，并保持模型、界面和持久化状态的一致性。

```ts
private async openResult(result: MindMapSearchResult): Promise<void>
```

## `src/settings.ts`

插件设置模型和设置页。

### 类型 `ToolbarItemId`

源码：`src/settings.ts:55`

Stable toolbar item identifier used by settings, migration, and the editor.

```ts
export type ToolbarItemId = typeof TOOLBAR_ITEMS[number][0];
```

### 函数 `normalizeToolbarItemId`

源码：`src/settings.ts:65`

Converts one persisted toolbar identifier to the current identifier set.

```ts
export function normalizeToolbarItemId(value: unknown): ToolbarItemId | null
```

### 函数 `normalizeToolbarItemOrder`

源码：`src/settings.ts:75`

Normalizes toolbar order while keeping the two screenshot actions adjacent and the unified import/export entry at the end of the user-action area.

```ts
export function normalizeToolbarItemOrder(values: readonly unknown[] | undefined): ToolbarItemId[]
```

### 类型 `SettingsSectionTitle`

源码：`src/settings.ts:102`

A valid first-level settings category title.

```ts
export type SettingsSectionTitle = typeof SETTINGS_SECTION_TITLES[number];
```

### 类型 `MovableSettingsSectionTitle`

源码：`src/settings.ts:104`

A category that can move; configuration management remains permanently last.

```ts
type MovableSettingsSectionTitle = Exclude<SettingsSectionTitle, "管理配置">;
```

### 类型 `ImageHostBodyMode`

源码：`src/settings.ts:109`

ImageHostBodyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ImageHostBodyMode = "multipart" | "raw";
```

### 类型 `ImageHostMethod`

源码：`src/settings.ts:113`

ImageHostMethod 类型定义，用于限制可接受值并让序列化数据保持稳定。

```ts
export type ImageHostMethod = "POST" | "PUT";
```

### 类型 `ImageHostDeleteMethod`

源码：`src/settings.ts:115`

HTTP methods supported by optional remote image deletion APIs.

```ts
export type ImageHostDeleteMethod = "GET" | "DELETE" | "POST";
```

### 类型 `ImageHostPreset`

源码：`src/settings.ts:117`

Built-in image-host configuration templates.

```ts
export type ImageHostPreset = "custom" | "zipline" | "imgbb" | "freeimage";
```

### 类型 `ArticleLeafBulletStyle`

源码：`src/settings.ts:120`

Visual shape used for unnumbered terminal article bullets.

```ts
export type ArticleLeafBulletStyle = "solid" | "hollow" | "square" | "dash";
```

### 类型 `ArticleLeafTextAlignment`

源码：`src/settings.ts:122`

Alignment used by terminal article paragraphs independently from their marker.

```ts
export type ArticleLeafTextAlignment = "flush" | "auto";
```

### 接口 `ImageHostConfig`

源码：`src/settings.ts:127`

ImageHostConfig 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostConfig
```

### 接口 `ImageUploadCacheEntry`

源码：`src/settings.ts:151`

One persistent SHA-256 upload-cache entry.

```ts
export interface ImageUploadCacheEntry
```

### 接口 `PendingImageHostDeletion`

源码：`src/settings.ts:162`

One persisted remote-image deletion delayed long enough for Undo to restore the reference.

```ts
export interface PendingImageHostDeletion
```

### 接口 `ImageHostChoice`

源码：`src/settings.ts:176`

ImageHostChoice 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostChoice
```

### 接口 `ImageHostUploadSuccess`

源码：`src/settings.ts:184`

ImageHostUploadSuccess 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadSuccess
```

### 接口 `ImageHostUploadFailure`

源码：`src/settings.ts:196`

ImageHostUploadFailure 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadFailure
```

### 接口 `ImageHostUploadBatch`

源码：`src/settings.ts:205`

ImageHostUploadBatch 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export interface ImageHostUploadBatch
```

### 函数 `createImageHostConfig`

源码：`src/settings.ts:217`

创建image host config，并保持模型、界面和持久化状态的一致性。

```ts
export function createImageHostConfig(index = 1): ImageHostConfig
```

### 函数 `applyImageHostPreset`

源码：`src/settings.ts:238`

Apply one maintained image-host preset while preserving existing credentials when possible.

```ts
export function applyImageHostPreset(host: ImageHostConfig, preset: ImageHostPreset): void
```

### 类型 `ImageRecognitionAutoConfirmDelaySeconds`

源码：`src/settings.ts:297`

MindMapStudioSettings 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。

```ts
export type ImageRecognitionAutoConfirmDelaySeconds = 0 | 5 | 10 | 15 | null;
```

### 类型 `QuestionPracticeOrder`

源码：`src/settings.ts:300`

Determines whether answer-mode sessions shuffle questions or follow map order.

```ts
export type QuestionPracticeOrder = "random" | "sequential";
```

### 接口 `MindMapStudioSettings`

源码：`src/settings.ts:303`

MindMap Studio 的持久化设置集合。

```ts
export interface MindMapStudioSettings
```

### 函数 `normalizeSettingsExpandedSections`

源码：`src/settings.ts:567`

Keeps only known first-level sections in the stored expanded-section list.

```ts
export function normalizeSettingsExpandedSections(value: unknown): SettingsSectionTitle[]
```

### 函数 `normalizeSettingsSectionOrder`

源码：`src/settings.ts:577`

Normalizes stored category order while keeping configuration management at the end.

```ts
export function normalizeSettingsSectionOrder(value: unknown): SettingsSectionTitle[]
```

### 函数 `normalizeReturnToTopVisibility`

源码：`src/settings.ts:623`

Normalizes the article return-to-top threshold from a number or percentage string.

```ts
export function normalizeReturnToTopVisibility(value: unknown): number
```

### 函数 `settingsToAppearance`

源码：`src/settings.ts:639`

更新并应用tings to appearance，并保持模型、界面和持久化状态的一致性。

```ts
export function settingsToAppearance(settings: MindMapStudioSettings): MindMapAppearance
```

### 函数 `applyThemePresetToSettings`

源码：`src/settings.ts:681`

应用theme preset to settings，并保持模型、界面和持久化状态的一致性。

```ts
export function applyThemePresetToSettings(settings: MindMapStudioSettings, presetId: MindMapThemePresetId): void
```

### 类 `MindMapStudioSettingTab`

源码：`src/settings.ts:712`

MindMapStudioSettingTab 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapStudioSettingTab extends PluginSettingTab
```

### 构造函数 `MindMapStudioSettingTab.constructor`

源码：`src/settings.ts:725`

创建 MindMapStudioSettingTab 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(app: App, plugin: MindMapStudioPlugin)
```

### 方法 `MindMapStudioSettingTab.display`

源码：`src/settings.ts:735`

构建完整插件设置页，包括主题、显示模式、节点默认值、搜索、图片、图床容灾和恢复初始设置。所有控件写入后立即保存并刷新打开视图。

```ts
display(): void
```

### 方法 `MindMapStudioSettingTab.organizeGlobalAppearanceSettings`

源码：`src/settings.ts:2459`

将一级设置分区折叠显示，并按顶部搜索词过滤匹配分区。

```ts
private organizeGlobalAppearanceSettings(): void
```

### 方法 `MindMapStudioSettingTab.organizeSettingsSections`

源码：`src/settings.ts:2516`

Converts top-level headings into searchable, reorderable collapsible settings sections.

```ts
private organizeSettingsSections(): void
```

### 方法 `MindMapStudioSettingTab.syncExpandedSettingsSectionsFromSettings`

源码：`src/settings.ts:2568`

Reloads the remembered section list after imports, resets, or settings-page redraws.

```ts
private syncExpandedSettingsSectionsFromSettings(): void
```

### 方法 `MindMapStudioSettingTab.setSettingsSectionOpen`

源码：`src/settings.ts:2574`

Changes a details element without treating search-driven expansion as a user preference.

```ts
private setSettingsSectionOpen(section: HTMLDetailsElement, open: boolean): void
```

### 方法 `MindMapStudioSettingTab.addSettingsSectionOrderControls`

源码：`src/settings.ts:2581`

Renders persistent up/down controls for every movable settings category.

```ts
private addSettingsSectionOrderControls(container: HTMLElement): void
```

### 方法 `MindMapStudioSettingTab.moveSettingsSection`

源码：`src/settings.ts:2600`

Moves one settings category, persists the order, and redraws the settings page.

```ts
private async moveSettingsSection(title: MovableSettingsSectionTitle, direction: -1 | 1): Promise<void>
```

### 方法 `MindMapStudioSettingTab.addOptionalColorSetting`

源码：`src/settings.ts:2622`

添加optional color setting，并保持模型、界面和持久化状态的一致性。

```ts
private addOptionalColorSetting( container: HTMLElement, name: string, description: string, getValue: () => string, setValue: (value: string) => Promise<void>, fallback: string, allowReset = true ): void
```

### 方法 `MindMapStudioSettingTab.saveAndRefresh`

源码：`src/settings.ts:2654`

保存and refresh，并保持模型、界面和持久化状态的一致性。

```ts
private async saveAndRefresh(): Promise<void>
```

### 方法 `MindMapStudioSettingTab.captureScreenshotShortcut`

源码：`src/settings.ts:2660`

记录截图快捷键；修饰键必须与一个非修饰主键同时按下。

```ts
private async captureScreenshotShortcut(event: KeyboardEvent, text: TextComponent): Promise<void>
```

### 方法 `MindMapStudioSettingTab.captureScreenshotRecognizeShortcut`

源码：`src/settings.ts:2665`

记录截图并识别快捷键，并与普通截图快捷键保持独立。

```ts
private async captureScreenshotRecognizeShortcut(event: KeyboardEvent, text: TextComponent): Promise<void>
```

### 方法 `MindMapStudioSettingTab.captureShortcut`

源码：`src/settings.ts:2670`

Records one shortcut setting from a physical keyboard event.

```ts
private async captureShortcut( event: KeyboardEvent, text: TextComponent, key: keyof Pick<MindMapStudioSettings, "screenshotShortcut" | "screenshotRecognizeShortcut" | "globalSearchShortcut" | "richTextBoldShortcut" | "richTextItalicShortcut" | "richTextUnd…
```

### 方法 `MindMapStudioSettingTab.shortcutFromKeyboardEvent`

源码：`src/settings.ts:2693`

将实际键盘事件转换为编辑器可识别的 1 至 3 键快捷键文本。

```ts
private shortcutFromKeyboardEvent(event: KeyboardEvent): string | null
```

### 方法 `MindMapStudioSettingTab.exportSettings`

源码：`src/settings.ts:2709`

导出当前插件设置；桌面端优先显示系统保存位置选择器。

```ts
private async exportSettings(): Promise<void>
```

### 方法 `MindMapStudioSettingTab.openSettingsImportPicker`

源码：`src/settings.ts:2729`

打开 JSON 配置文件选择器，并在成功导入后重新绘制设置页。

```ts
private openSettingsImportPicker(): void
```

### 方法 `MindMapStudioSettingTab.importSettingsFile`

源码：`src/settings.ts:2738`

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

## `src/utils/coalesced-json-writer.ts`

将短时间内重复触发的 JSON 持久化请求合并为串行写入，并保证等待方只在对应版本落盘后完成。

### 接口 `CoalescedJsonWriterOptions`

源码：`src/utils/coalesced-json-writer.ts:7`

参见源码中的实现和调用位置。

```ts
export interface CoalescedJsonWriterOptions<T>
```

### 接口 `CoalescedJsonWriterWaiter`

源码：`src/utils/coalesced-json-writer.ts:17`

等待某一请求版本完成或失败的内部记录。

```ts
interface CoalescedJsonWriterWaiter
```

### 类 `CoalescedJsonWriter`

源码：`src/utils/coalesced-json-writer.ts:29`

合并连续保存请求，并在写入期间继续吸收新请求。 每轮只持久化开始写入时的最新状态；若写入期间状态再次变化，当前写入结束后 会立即追加一轮最新快照，避免旧写入晚于新写入完成而覆盖较新的配置。

```ts
export class CoalescedJsonWriter<T>
```

### 构造函数 `CoalescedJsonWriter.constructor`

源码：`src/utils/coalesced-json-writer.ts:38`

保存回调与合并延迟，但不会在构造时发起写入。

```ts
constructor(private readonly options: CoalescedJsonWriterOptions<T>)
```

### 方法 `CoalescedJsonWriter.request`

源码：`src/utils/coalesced-json-writer.ts:43`

请求保存当前最新状态，并在包含本次请求的快照落盘后完成。

```ts
request(): Promise<void>
```

### 方法 `CoalescedJsonWriter.flush`

源码：`src/utils/coalesced-json-writer.ts:53`

取消等待延迟并立即完成当前所有待写版本，供卸载或测试收尾使用。

```ts
async flush(): Promise<void>
```

### 方法 `CoalescedJsonWriter.schedule`

源码：`src/utils/coalesced-json-writer.ts:63`

在没有运行中任务时安排一次尾随写入。

```ts
private schedule(): void
```

### 方法 `CoalescedJsonWriter.startRunner`

源码：`src/utils/coalesced-json-writer.ts:72`

启动唯一写入循环，并在运行期间保持单飞。

```ts
private startRunner(): void
```

### 方法 `CoalescedJsonWriter.run`

源码：`src/utils/coalesced-json-writer.ts:81`

串行写入最新快照，并按版本完成等待方。

```ts
private async run(): Promise<void>
```

### 方法 `CoalescedJsonWriter.settleWaiters`

源码：`src/utils/coalesced-json-writer.ts:98`

完成不晚于指定版本的等待方；传入错误时改为拒绝。

```ts
private settleWaiters(revision: number, error?: unknown): void
```

## `src/utils/desktop-capture.ts`

桌面截图覆盖层、选区标注与本机静默抓屏回退。

### 类型 `DesktopCaptureMode`

源码：`src/utils/desktop-capture.ts:7`

参见源码中的实现和调用位置。

```ts
export type DesktopCaptureMode = "capture" | "capture-recognize";
```

### 类型 `DesktopCaptureAction`

源码：`src/utils/desktop-capture.ts:10`

截图编辑器完成后的用户动作。

```ts
export type DesktopCaptureAction = "copy" | "recognize-copy" | "download";
```

### 接口 `DesktopCaptureResult`

源码：`src/utils/desktop-capture.ts:13`

截图完成后返回的图片、动作及建议文件名。

```ts
export interface DesktopCaptureResult
```

### 接口 `ElectronNativeImage`

源码：`src/utils/desktop-capture.ts:20`

Electron 原生图片的最小接口。

```ts
interface ElectronNativeImage
```

### 接口 `ElectronDesktopSource`

源码：`src/utils/desktop-capture.ts:26`

Electron 截图源。

```ts
interface ElectronDesktopSource
```

### 接口 `ElectronDisplay`

源码：`src/utils/desktop-capture.ts:32`

Electron 显示器边界。

```ts
interface ElectronDisplay
```

### 接口 `ElectronCaptureWebContents`

源码：`src/utils/desktop-capture.ts:43`

Electron 浏览器窗口网页内容接口。

```ts
interface ElectronCaptureWebContents
```

### 接口 `ElectronCaptureWindow`

源码：`src/utils/desktop-capture.ts:49`

Electron 浏览器窗口最小接口。

```ts
interface ElectronCaptureWindow
```

### 接口 `ElectronCaptureWindowConstructor`

源码：`src/utils/desktop-capture.ts:61`

Electron 浏览器窗口构造器。

```ts
interface ElectronCaptureWindowConstructor
```

### 接口 `ElectronCaptureRuntime`

源码：`src/utils/desktop-capture.ts:85`

Electron 运行时中截图功能使用的最小宿主接口。

```ts
interface ElectronCaptureRuntime
```

### 接口 `ElectronWindowRuntime`

源码：`src/utils/desktop-capture.ts:116`

Electron 主窗口控制与主进程 API 所需的最小运行时接口。

```ts
interface ElectronWindowRuntime
```

### 接口 `ElectronWindowHandle`

源码：`src/utils/desktop-capture.ts:124`

截图前临时最小化、截图后恢复所需的主窗口接口。

```ts
interface ElectronWindowHandle
```

### 接口 `NodeCaptureRuntime`

源码：`src/utils/desktop-capture.ts:134`

桌面截图命令使用的最小 Node.js 运行时接口。

```ts
interface NodeCaptureRuntime
```

### 函数 `copyBytesToArrayBuffer`

源码：`src/utils/desktop-capture.ts:158`

将任意 Uint8Array 复制为 Blob 接受的普通 ArrayBuffer，兼容 SharedArrayBuffer 类型声明。

```ts
export function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer
```

### 函数 `getElectronRuntime`

源码：`src/utils/desktop-capture.ts:165`

从 Obsidian 桌面端获取 Electron API；移动端或受限环境返回 null。

```ts
function getElectronRuntime(): ElectronCaptureRuntime | null
```

### 函数 `getCurrentObsidianWindow`

源码：`src/utils/desktop-capture.ts:186`

从 Electron 的新旧渲染器接口中取得当前 Obsidian 主窗口。

```ts
function getCurrentObsidianWindow(runtime: ElectronCaptureRuntime): ElectronWindowHandle | null
```

### 函数 `waitForWindowMinimized`

源码：`src/utils/desktop-capture.ts:194`

等待窗口完成最小化，避免截图源中仍包含 Obsidian 窗口。

```ts
async function waitForWindowMinimized(windowHandle: ElectronWindowHandle): Promise<void>
```

### 函数 `getNodeCaptureRuntime`

源码：`src/utils/desktop-capture.ts:202`

从 Obsidian 桌面端按需获取 Node.js API，避免移动端加载插件时静态引用 Node 模块。

```ts
function getNodeCaptureRuntime(): NodeCaptureRuntime | null
```

### 函数 `executeCaptureCommand`

源码：`src/utils/desktop-capture.ts:219`

使用 execFile 执行一个截图候选命令。

```ts
function executeCaptureCommand(runtime: NodeCaptureRuntime, command: string, args: string[], timeoutMs = 15_000): Promise<void>
```

### 函数 `withCaptureTimeout`

源码：`src/utils/desktop-capture.ts:229`

为可能被桌面权限或宿主 API 卡住的抓屏调用设置硬超时。

```ts
export async function withCaptureTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T>
```

### 函数 `pngDataUrlToBytes`

源码：`src/utils/desktop-capture.ts:244`

将 data URL 中的 PNG 转成二进制。

```ts
function pngDataUrlToBytes(dataUrl: string): Uint8Array
```

### 接口 `CaptureEditorMessage`

源码：`src/utils/desktop-capture.ts:254`

截图编辑器向宿主窗口发送的消息。

```ts
interface CaptureEditorMessage
```

### 接口 `BrowserDisplayMetrics`

源码：`src/utils/desktop-capture.ts:265`

浏览器渲染器可直接提供的显示器信息。

```ts
interface BrowserDisplayMetrics
```

### 接口 `CaptureEditorHost`

源码：`src/utils/desktop-capture.ts:281`

截图覆盖层宿主，可由独立窗口或 Obsidian 内嵌 iframe 提供。

```ts
interface CaptureEditorHost
```

### 函数 `normalizeBrowserDisplay`

源码：`src/utils/desktop-capture.ts:289`

将浏览器显示器数据规范化为可用于截图和全局坐标显示的边界。

```ts
export function normalizeBrowserDisplay(metrics: BrowserDisplayMetrics): ElectronDisplay
```

### 函数 `getBrowserDisplay`

源码：`src/utils/desktop-capture.ts:314`

读取鼠标所在 Obsidian 窗口对应的浏览器显示器信息，不依赖 Electron 主进程 screen API。

```ts
function getBrowserDisplay(): ElectronDisplay
```

### 函数 `captureEditorHtml`

源码：`src/utils/desktop-capture.ts:326`

生成截图覆盖层页面；普通截图双击确认，截图并识别按三秒空闲计时确认。

```ts
export function captureEditorHtml(display: ElectronDisplay, mode: DesktopCaptureMode, imageDataUrl = "screen.png", messageToken = "test-token"): string
```

### 函数 `saveCaptureDownload`

源码：`src/utils/desktop-capture.ts:438`

保存截图到用户选择的位置；取消保存时仍返回 false。

```ts
async function saveCaptureDownload(runtime: ElectronCaptureRuntime, nodeRuntime: NodeCaptureRuntime, bytes: Uint8Array): Promise<boolean>
```

### 函数 `nativeCaptureCommandCandidates`

源码：`src/utils/desktop-capture.ts:450`

返回当前平台用于静默抓取显示器图像的命令候选，不启动系统交互式选区。

```ts
export function nativeCaptureCommandCandidates( platform: string, display: ElectronDisplay, imagePath: string ): Array<
```

### 函数 `runNativeCaptureCandidates`

源码：`src/utils/desktop-capture.ts:472`

执行候选命令，直到真正生成非空 PNG 文件。

```ts
async function runNativeCaptureCandidates( runtime: NodeCaptureRuntime, candidates: Array<
```

### 函数 `captureWindowsDisplay`

源码：`src/utils/desktop-capture.ts:492`

Windows 使用 DPI 感知的 PowerShell 与系统绘图 API 抓取完整虚拟桌面，并返回全部显示器边界。

```ts
async function captureWindowsDisplay( runtime: NodeCaptureRuntime, directory: string, imagePath: string, fallbackDisplay: ElectronDisplay, hideForegroundWindow: boolean ): Promise<
```

### 函数 `captureDisplayWithNativeCommand`

源码：`src/utils/desktop-capture.ts:613`

使用本机非交互式命令抓取显示器或完整虚拟桌面，完全绕开 Electron 主进程 BrowserWindow/screen API。

```ts
async function captureDisplayWithNativeCommand( runtime: NodeCaptureRuntime, display: ElectronDisplay, hideForegroundWindow: boolean ): Promise<
```

### 函数 `captureDisplayWithRendererElectron`

源码：`src/utils/desktop-capture.ts:640`

本机命令失败时，仅用渲染器可用的 desktopCapturer 抓取整屏；不会退回系统交互式截图。

```ts
async function captureDisplayWithRendererElectron( runtime: ElectronCaptureRuntime, display: ElectronDisplay ): Promise<
```

### 函数 `captureDisplaySource`

源码：`src/utils/desktop-capture.ts:661`

抓取截图源；Windows 优先抓取完整虚拟桌面，其他平台优先使用快速渲染器。

```ts
async function captureDisplaySource( electronRuntime: ElectronCaptureRuntime, nodeRuntime: NodeCaptureRuntime, hideObsidian: boolean ): Promise<
```

### 函数 `openCaptureEditorHost`

源码：`src/utils/desktop-capture.ts:753`

在当前 Obsidian 窗口内创建全屏截图覆盖层，避免异步 window.open 被宿主拦截后形成不可见悬挂窗口。

```ts
function openCaptureEditorHost(html: string, _display: ElectronDisplay): CaptureEditorHost
```

### 函数 `writePngToClipboard`

源码：`src/utils/desktop-capture.ts:800`

将裁剪结果写入系统剪贴板；Electron 剪贴板不可用时使用标准 Clipboard API。

```ts
async function writePngToClipboard(runtime: ElectronCaptureRuntime, bytes: Uint8Array): Promise<void>
```

### 函数 `editCapturedDisplay`

源码：`src/utils/desktop-capture.ts:814`

在真实可达的渲染器窗口中运行截图编辑器并处理复制、下载和取消动作。

```ts
async function editCapturedDisplay( runtime: ElectronCaptureRuntime, nodeRuntime: NodeCaptureRuntime, captured:
```

### 函数 `captureDesktopScreenshot`

源码：`src/utils/desktop-capture.ts:904`

启动指定交互模式的桌面截图覆盖层；高级编辑器失败时给出明确错误，禁止静默回退系统截图。

```ts
export async function captureDesktopScreenshot(hideObsidian: boolean, mode: DesktopCaptureMode = "capture"): Promise<DesktopCaptureResult>
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

源码：`src/utils/desktop-export.ts:33`

Electron 保存对话框运行时的最小接口。

```ts
interface ElectronSaveRuntime
```

### 接口 `NodeExportRuntime`

源码：`src/utils/desktop-export.ts:45`

Node.js 文件导出运行时的最小接口。

```ts
interface NodeExportRuntime
```

### 接口 `DesktopExportResult`

源码：`src/utils/desktop-export.ts:58`

桌面导出保存结果。

```ts
export interface DesktopExportResult
```

### 函数 `sanitizeExportFilename`

源码：`src/utils/desktop-export.ts:64`

清理文件名中跨平台不安全字符。

```ts
export function sanitizeExportFilename(name: string, fallback = "思维导图"): string
```

### 函数 `getElectronSaveRuntime`

源码：`src/utils/desktop-export.ts:69`

从 Obsidian 桌面端获取保存对话框；不可用时返回 null。

```ts
function getElectronSaveRuntime(): ElectronSaveRuntime | null
```

### 函数 `getNodeExportRuntime`

源码：`src/utils/desktop-export.ts:82`

从 Obsidian 桌面端按需获取 Node.js 文件 API；移动端或受限环境返回 null。

```ts
function getNodeExportRuntime(): NodeExportRuntime | null
```

### 函数 `saveDesktopExportFile`

源码：`src/utils/desktop-export.ts:97`

保存导出文本到用户选择的位置；无法打开选择器时默认写入桌面。

```ts
export async function saveDesktopExportFile(extension: DesktopExportExtension, baseName: string, content: string | Uint8Array): Promise<DesktopExportResult | null>
```

### 函数 `saveDesktopPdfFile`

源码：`src/utils/desktop-export.ts:116`

使用 Electron 的离屏窗口渲染 HTML，并直接写出 PDF，避免 Obsidian 拦截打印弹窗。

```ts
export async function saveDesktopPdfFile(baseName: string, html: string): Promise<DesktopExportResult | null>
```

## `src/utils/desktop-import.ts`

Desktop-native file selection and reading helpers for mind-map imports.

### 接口 `DesktopImportFile`

源码：`src/utils/desktop-import.ts:14`

A file chosen through Obsidian Desktop's native open dialog.

```ts
export interface DesktopImportFile
```

### 接口 `DesktopImportSelectionResult`

源码：`src/utils/desktop-import.ts:21`

Result of attempting to open the Desktop-native import dialog.

```ts
export interface DesktopImportSelectionResult
```

### 接口 `ElectronOpenRuntime`

源码：`src/utils/desktop-import.ts:27`

Minimal Electron dialog API used by the renderer.

```ts
interface ElectronOpenRuntime
```

### 接口 `NodeImportRuntime`

源码：`src/utils/desktop-import.ts:41`

Minimal Node.js file APIs used after a native path is selected.

```ts
interface NodeImportRuntime
```

### 接口 `DesktopMarkdownImageFile`

源码：`src/utils/desktop-import.ts:55`

Desktop Markdown 图片读取结果，包含去重所需的绝对路径。

```ts
export interface DesktopMarkdownImageFile
```

### 函数 `getElectronOpenRuntime`

源码：`src/utils/desktop-import.ts:62`

Reads Electron lazily so mobile and restricted runtimes remain supported.

```ts
function getElectronOpenRuntime(): ElectronOpenRuntime | null
```

### 函数 `getNodeImportRuntime`

源码：`src/utils/desktop-import.ts:75`

Reads Node file APIs lazily so the module can be bundled for every Obsidian platform.

```ts
function getNodeImportRuntime(): NodeImportRuntime | null
```

### 函数 `selectDesktopImportFile`

源码：`src/utils/desktop-import.ts:95`

Opens a native import dialog at the last selected folder when Desktop APIs are available. A supported result with no file means the user cancelled; an unsupported result lets the caller fall back to the browser file picker on mobile or restricted runtimes.

```ts
export async function selectDesktopImportFile(lastDirectory: string): Promise<DesktopImportSelectionResult>
```

### 函数 `desktopMarkdownImageRelativeCandidates`

源码：`src/utils/desktop-import.ts:127`

生成 Markdown 图片链接相对于源笔记目录的候选路径。 Obsidian 笔记可能位于附件目录内部，却仍保存从仓库根目录生成的 `assets/分类/图片.png` 链接，因此除原路径外还依次尝试去掉 `assets/` 前缀和仅使用文件名。

```ts
export function desktopMarkdownImageRelativeCandidates(source: string): string[]
```

### 函数 `readDesktopMarkdownImage`

源码：`src/utils/desktop-import.ts:150`

按 Obsidian 常见附件路径回退顺序读取桌面 Markdown 引用的本地图片。 该函数仅在 Desktop 原生导入已获得用户选择的源目录后调用；移动端和 受限运行时返回 `null`，由调用方保留原始引用。

```ts
export async function readDesktopMarkdownImage(sourceDirectory: string, source: string): Promise<DesktopMarkdownImageFile | null>
```

### 接口 `DesktopMarkdownImageCopyResult`

源码：`src/utils/desktop-import.ts:171`

桌面 Markdown 图片复制与节点引用改写结果。

```ts
export interface DesktopMarkdownImageCopyResult
```

### 函数 `copyDesktopMarkdownImagesToDocument`

源码：`src/utils/desktop-import.ts:182`

读取桌面 Markdown 引用的本地图片，保存到调用方指定位置，并原位改写权威内容块。 `nodeContentBlocks()` 返回规范化副本，因此必须在改写后使用 `replaceNodeContentBlocks()` 写回节点；仅修改遍历得到的块会在后续同步时丢失。

```ts
export async function copyDesktopMarkdownImagesToDocument( document: MindMapDocument, sourceDirectory: string, saveImage: (image: DesktopMarkdownImageFile) => Promise<string> ): Promise<DesktopMarkdownImageCopyResult>
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

### 函数 `sha256Blob`

源码：`src/utils/image-host.ts:137`

Compute the stable lowercase SHA-256 digest of an image blob.

```ts
export async function sha256Blob(blob: Blob): Promise<string>
```

### 函数 `extractImageUrlFromResponse`

源码：`src/utils/image-host.ts:151`

从图床响应中提取第一个合法的 HTTP(S) 图片地址。

```ts
export function extractImageUrlFromResponse(payload: unknown, preferredPaths: readonly string[] = []): string | null
```

### 函数 `extractResponseString`

源码：`src/utils/image-host.ts:165`

Read one optional scalar string from an upload response path.

```ts
export function extractResponseString(payload: unknown, path: string): string | undefined
```

### 函数 `findZiplineFileId`

源码：`src/utils/image-host.ts:176`

Find one Zipline v4 file ID in a paginated file-list response by exact URL or stored name.

```ts
export function findZiplineFileId(payload: unknown, imageUrl: string, origin: string): string | undefined
```

### 函数 `applyImageDeleteTemplate`

源码：`src/utils/image-host.ts:204`

Replace remote-delete placeholders with URL-encoded or JSON-escaped values.

```ts
export function applyImageDeleteTemplate( template: string, values:
```

### 函数 `readPath`

源码：`src/utils/image-host.ts:225`

按点分隔路径读取对象属性。

```ts
export function readPath(value: unknown, path: string): unknown
```

### 函数 `isHttpUrl`

源码：`src/utils/image-host.ts:238`

判断字符串是否为 HTTP(S) URL。

```ts
export function isHttpUrl(value: string): boolean
```

### 函数 `validateMultipartBoundary`

源码：`src/utils/image-host.ts:254`

校验 multipart boundary，避免调用方通过测试注入点写入非法请求头字符。 @throws boundary 为空、过长或包含非法字符时抛出错误。

```ts
function validateMultipartBoundary(boundary: string): string
```

### 函数 `sanitizeContentDispositionValue`

源码：`src/utils/image-host.ts:260`

清除 Content-Disposition 参数中的引号、反斜杠和换行，防止请求头注入。

```ts
function sanitizeContentDispositionValue(value: string, fallback: string): string
```

## `src/utils/plugin-update.ts`

GitHub Release 插件更新包的版本、资产和文件校验工具。

### 接口 `PluginReleaseManifest`

源码：`src/utils/plugin-update.ts:9`

Manifest fields validated before a release can replace the installed plugin.

```ts
export interface PluginReleaseManifest
```

### 接口 `PluginReleaseFiles`

源码：`src/utils/plugin-update.ts:15`

Validated executable, style, and manifest files extracted from an install ZIP.

```ts
export interface PluginReleaseFiles
```

### 接口 `PluginUpdateManifest`

源码：`src/utils/plugin-update.ts:23`

Public update manifest generated by the release workflow.

```ts
export interface PluginUpdateManifest
```

### 函数 `comparePluginVersions`

源码：`src/utils/plugin-update.ts:30`

Compares two numeric dot-separated versions, ignoring optional prerelease labels.

```ts
export function comparePluginVersions(left: string, right: string): number
```

### 函数 `parsePluginUpdateManifest`

源码：`src/utils/plugin-update.ts:43`

Parses a release-workflow update manifest and accepts only this plugin's GitHub ZIP URL.

```ts
export function parsePluginUpdateManifest(source: string): PluginUpdateManifest
```

### 函数 `verifyPluginArchiveHash`

源码：`src/utils/plugin-update.ts:69`

Verifies a downloaded release archive against the SHA-256 from the update manifest.

```ts
export async function verifyPluginArchiveHash(archive: ArrayBuffer, expectedSha256: string): Promise<boolean>
```

### 函数 `extractPluginReleaseFiles`

源码：`src/utils/plugin-update.ts:76`

Extracts the three files that an Obsidian plugin may safely self-update.

```ts
export function extractPluginReleaseFiles(archive: ArrayBuffer): PluginReleaseFiles
```

## `src/view.ts`

Obsidian TextFileView 适配层。

### 类 `MindMapStudioView`

源码：`src/view.ts:32`

MindMapStudioView 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。

```ts
export class MindMapStudioView extends TextFileView
```

### 构造函数 `MindMapStudioView.constructor`

源码：`src/view.ts:58`

创建 MindMapStudioView 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。

```ts
constructor(leaf: WorkspaceLeaf, plugin: MindMapStudioPlugin)
```

### 方法 `MindMapStudioView.getViewType`

源码：`src/view.ts:67`

读取并返回view type，并保持模型、界面和持久化状态的一致性。

```ts
getViewType(): string
```

### 方法 `MindMapStudioView.getDisplayText`

源码：`src/view.ts:75`

读取并返回display text，并保持模型、界面和持久化状态的一致性。

```ts
getDisplayText(): string
```

### 方法 `MindMapStudioView.getIcon`

源码：`src/view.ts:83`

读取并返回icon，并保持模型、界面和持久化状态的一致性。

```ts
getIcon(): string
```

### 方法 `MindMapStudioView.getViewData`

源码：`src/view.ts:92`

返回当前编辑器文档的序列化文本，供 Obsidian 自动保存。保存使用模型层统一序列化，确保字段规范和版本号正确。

```ts
getViewData(): string
```

### 方法 `MindMapStudioView.applyImageUploadPatches`

源码：`src/view.ts:107`

将后台上传结果合并到当前编辑器文档并立即保存，避免用上传开始时的旧快照刷新整棵节点树。

```ts
async applyImageUploadPatches(patches: readonly MindMapImageUploadPatch[]): Promise<number>
```

### 方法 `MindMapStudioView.setViewData`

源码：`src/view.ts:123`

接收 Obsidian 读取的文件文本，解析成领域文档并交给编辑器。重新加载时会保留全局显示模式，并异步刷新文章父子上下文。

```ts
setViewData(data: string, clear: boolean): void
```

### 方法 `MindMapStudioView.clear`

源码：`src/view.ts:279`

执行“clear”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
clear(): void
```

### 方法 `MindMapStudioView.showArticleDirectory`

源码：`src/view.ts:289`

Displays and persists the generated directory for the top-level article.

```ts
showArticleDirectory(focusNodeId?: string): void
```

### 方法 `MindMapStudioView.save`

源码：`src/view.ts:299`

保存相关数据，并保持模型、界面和持久化状态的一致性。

```ts
async save(clear?: boolean): Promise<void>
```

### 方法 `MindMapStudioView.onClose`

源码：`src/view.ts:313`

在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。

```ts
async onClose(): Promise<void>
```

### 方法 `MindMapStudioView.openMapFamilySearch`

源码：`src/view.ts:325`

打开map family search，并保持模型、界面和持久化状态的一致性。

```ts
private async openMapFamilySearch(): Promise<void>
```

### 方法 `MindMapStudioView.refreshAppearance`

源码：`src/view.ts:338`

刷新appearance，并保持模型、界面和持久化状态的一致性。

```ts
refreshAppearance(): void
```

### 方法 `MindMapStudioView.focusNode`

源码：`src/view.ts:348`

定位node，并保持模型、界面和持久化状态的一致性。

```ts
focusNode(nodeId: string): void
```

### 方法 `MindMapStudioView.markExplicitNavigation`

源码：`src/view.ts:363`

标记当前文件由用户或跨模式导航显式打开。 下一次文章族上下文加载完成时以当前文件为准，避免旧的跨文件阅读记录 立即把视图跳回刚离开的父导图或子导图。

```ts
markExplicitNavigation(focusNodeId?: string): void
```

### 方法 `MindMapStudioView.setDisplayMode`

源码：`src/view.ts:382`

更新并应用display mode，并保持模型、界面和持久化状态的一致性。

```ts
setDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapStudioView.applyGlobalDisplayMode`

源码：`src/view.ts:391`

应用global display mode，并保持模型、界面和持久化状态的一致性。

```ts
applyGlobalDisplayMode(mode: DisplayMode): void
```

### 方法 `MindMapStudioView.toggleReadOnly`

源码：`src/view.ts:398`

切换read only，并保持模型、界面和持久化状态的一致性。

```ts
toggleReadOnly(): void
```

### 方法 `MindMapStudioView.askAi`

源码：`src/view.ts:403`

打开 AI 询问窗口；默认使用当前页面，节点右键后使用该节点子树。

```ts
askAi(): void
```

### 方法 `MindMapStudioView.captureScreenshot`

源码：`src/view.ts:409`

启动截图并让编辑器根据截图前焦点决定插入节点或保留剪贴板。

```ts
async captureScreenshot(recognizeAfter = false): Promise<void>
```

### 方法 `MindMapStudioView.openAiModal`

源码：`src/view.ts:418`

构建 Markdown 上下文并打开 AI 窗口。

```ts
private openAiModal(nodeId?: string): void
```

### 方法 `MindMapStudioView.recognizeImages`

源码：`src/view.ts:463`

按节点树顺序逐张读取并识别当前页面或节点子树中的全部图片。

```ts
private async recognizeImages(nodeId: string | undefined, profileId: string, instruction: string): Promise<ImageRecognitionBatchResult>
```

### 方法 `MindMapStudioView.getEditorOptions`

源码：`src/view.ts:491`

读取并返回editor options，并保持模型、界面和持久化状态的一致性。

```ts
private getEditorOptions(preferCurrentFileLocation = false, preferredCurrentNodeId: string | null = null)
```

### 方法 `MindMapStudioView.scheduleArticleContextRefresh`

源码：`src/view.ts:562`

安排延迟执行article context refresh，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleArticleContextRefresh(delay: number): void
```

### 方法 `MindMapStudioView.refreshArticleContext`

源码：`src/view.ts:573`

刷新article context，并保持模型、界面和持久化状态的一致性。

```ts
private async refreshArticleContext(): Promise<void>
```

### 方法 `MindMapStudioView.applyViewClasses`

源码：`src/view.ts:621`

应用view classes，并保持模型、界面和持久化状态的一致性。

```ts
private applyViewClasses(): void
```

### 方法 `MindMapStudioView.scheduleSavedIndicator`

源码：`src/view.ts:630`

安排延迟执行saved indicator，并保持模型、界面和持久化状态的一致性。

```ts
private scheduleSavedIndicator(): void
```

### 方法 `MindMapStudioView.openLink`

源码：`src/view.ts:640`

打开link，并保持模型、界面和持久化状态的一致性。

```ts
private async openLink(rawLink: string): Promise<void>
```

### 方法 `MindMapStudioView.resolveImage`

源码：`src/view.ts:657`

解析并确定image，并保持模型、界面和持久化状态的一致性。

```ts
private resolveImage(rawSource: string): string | null
```

### 方法 `MindMapStudioView.exportTextFile`

源码：`src/view.ts:677`

执行“export text file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。

```ts
private async exportTextFile(extension: "svg" | "md" | "json" | "html" | "doc", content: string, preferExternal = false): Promise<void>
```

### 方法 `MindMapStudioView.exportBinaryFile`

源码：`src/view.ts:694`

将二进制文档写入所选位置或当前库。

```ts
private async exportBinaryFile(extension: "docx", content: Uint8Array): Promise<void>
```

### 方法 `MindMapStudioView.exportArticleFamily`

源码：`src/view.ts:717`

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

源码：`src/vision/local-ocr.ts:105`

使用 execFile 执行 Tesseract，参数不经过 shell。

```ts
function executeTesseract( runtime: LocalOcrRuntime, executable: string, args: string[], timeoutMs: number ): Promise<
```

### 函数 `formatLocalOcrError`

源码：`src/vision/local-ocr.ts:125`

Formats low-level execFile failures into actionable local OCR messages.

```ts
export function formatLocalOcrError(error: unknown, executable: string): string
```

### 函数 `recognizeImageWithLocalOcr`

源码：`src/vision/local-ocr.ts:138`

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
constructor(app: Modal["app"], private readonly options: ImageRecognitionPreviewModalOptions)
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

