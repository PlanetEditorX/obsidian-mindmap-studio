# `.mindmap` 数据模型

## 1. 文档版本

当前数据版本为 `10`。版本号表示文件结构级别，不等同于插件版本号。增加不改变现有语义的可选字段时可以保持版本不变；改变必需结构或字段语义时必须提高数据版本并提供显式转换工具。

## 2. 顶层文档

```ts
interface MindMapDocument {
  version: number;
  title: string;
  layout: "right" | "balanced";
  root: MindMapNode;
  appearance?: MindMapAppearance;
  navigation?: MindMapNavigation;
  view?: MindMapDocumentView;
}
```

字段说明：

- `version`：数据格式版本。
- `title`：导图标题和默认文件标题。
- `layout`：向右布局或左右均衡布局。
- `root`：唯一根节点。
- `appearance`：该文件的外观覆盖；缺失字段继承插件设置。
- `navigation`：当前文件是子导图时的父导图信息。
- `view`：文件级只读状态、导图视口和文章目录覆盖等视图信息。显示模式由插件全局设置控制。

## 3. 节点结构

```ts
interface MindMapNode {
  id: string;
  text: string;
  richText?: MindMapTextRun[];
  content?: MindMapContentBlock[];
  children: MindMapNode[];
  collapsed?: boolean;
  icon?: string;
  note?: string;
  tags?: string[];
  question?: MindMapQuestion;
  link?: string;
  task?: "todo" | "doing" | "done";
  image?: string;
  table?: MindMapTable;
  code?: MindMapCodeBlock;
  submap?: MindMapSubmap;
  articleNumberingMode?: "none" | "manual";
  articleNumberingLevel?: number;
  style?: MindMapNodeStyle;
}
```

重要约束：

- `id` 在同一文档中必须唯一。
- `children` 始终是数组。
- `content` 是当前推荐的有序内容模型。
- `text`、`richText`、`image`、`table`、`code` 是当前节点的派生或旧版兼容字段，由内容块同步逻辑维护，供旧文件兼容、搜索、快速渲染和导出使用。
- 增量修改现有内容时可调用 `syncNodeContentFields()`；编辑器完整替换内容块集合时必须调用 `replaceNodeContentBlocks()`，该函数先清理旧镜像再从新 `content` 重建，确保删除表格或代码不会被迁移兼容逻辑恢复。
- `collapsed` 只影响导图可见布局，不删除后代。
- `submap` 表示该节点关联独立子导图文件。
- `articleNumberingMode` 缺失时表示自动；`none` 表示关闭编号；`manual` 表示使用手动文章层级。
- `articleNumberingLevel` 仅在手动模式下生效，规范化时限制为 `1–8`。
- 手动模式只覆盖当前标题或中心节点子树的最高文章层级，并让后代从该层级继续递增；它不改变导图中的真实 `children` 结构，也不强制孤立末端节点成为标题。
- 中心节点的手动层级直接作为整张导图一级内容的最高可见层级，中心标题本身仍不添加编号。
- 不同文章层级使用独立的同级计数器，混用“一、”和“1.”时不会互相占用序号。
- 同级存在自然标题时，普通末端节点按同级标题编号；孤立末端节点仍作为正文。
- `view.zoom`、`view.panX`、`view.panY` 保存导图视口，显示模式切换不会清除这些可选字段。

### 题目节点

`question` 是可选的结构化题目数据，支持 `choice`、`judgment` 和 `essay` 三种模式。判断题固定提供“正确 / 错误”两个选择项，参考答案兼容“正确 / 错误”及 `A / B` 写法。它包含图文题干、选择项、答案、解答及标签；题干会同步到标准 `content` 字段，保证既有的导出、搜索和阅读模式仍按普通节点工作。AI 找到原题后会记录 `source.title`、`source.url` 与匹配时间；仅接受 HTTP(S) 来源。未找到可验证原题时，智能处理会保留空来源并由 AI 分析补齐缺失答案和解答，供用户核对。

题目还记录 `status`（未做、已做、收藏、错题、掌握）、`attemptCount`、`correctCount` 和 `lastPracticedAt`，用于题库文件夹内导图的整页练习和错题复盘；旧文件缺少这些字段时会自动初始化为“未做”。选择题根据答案中的选项标签自动判题，多答案标签会自动呈现为多选；大题以规范化文本与参考答案精确比对，答错会自动标为错题。
- `view.articleTocMaxDepth` 是可选的 1–8 层目录深度覆盖。字段缺失时，文章模式和通读模式跟随插件全局 `articleTocMaxDepth`；字段存在时当前脑图优先。

文章样式还可保存 `leafNumberingEnabled`、`leafNumberingStyle` 与 `leafNumberingThreshold`，用于覆盖插件全局的末端正文转序号开关、样式和阈值。`leafNumberingStyle` 可选 `next-level` 或 `circled`：前者使用上级标题的下一层文章编号，并遵守八级标题编号边界；后者第 1–50 项生成 Unicode `①–㊿`，第 51 项以后保留普通数字供文章与 HTML 使用 CSS 圆圈呈现，因此可继续支持六七十项及更多。阈值未达到时仍使用末端正文标识。自动结构可以继续深入到第 9 级及以后，但标题编号不会循环复用第 7、8 级的 `A.` / `（A）`；带圈末端序号则可在这些更深层级继续使用。

## 4. 有序内容块

内容块的 `id` 在节点内排序和跨节点移动时保持不变。`moveNodeContentBlock()` 会从来源节点移除目标块，按目标块之前、之后或目标节点末尾插入，并对来源和目标分别调用权威内容替换逻辑，从而同步清理和重建 `text`、`richText`、`image`、`table`、`code` 兼容字段。移动只改变内容块归属与顺序，不复制内容，也不改变节点树结构。

跨节点移动后，如果来源节点已无内容块，并且它不是根节点、没有子节点，也没有备注、链接、子导图、图标、标签、题目或任务等独立语义，则该空白叶节点会自动从树中删除。仍承载子树或附加元数据的节点会保留，避免移动一个标题块时连带删除有效结构。

同一规则也用于删除内容：除首次新建且尚未输入内容的临时空节点外，删除最后一个有效文字、图片、表格或代码块后，真正空白的非根叶节点会自动删除。根节点以及仍承载子节点、备注、链接、子导图、图标、标签、题目或任务的节点不会因内容块为空而删除。

交互层不改变上述模型语义：导图编辑模式的块手柄负责开始拖动，目标块上半区和下半区分别对应前后插入，节点空白区域对应末尾追加。文章编辑模式不显示块或整节点的悬浮拖动手柄；“作为块移动”进入临时选位模式，目标块上半区/下半区分别对应 `before`/`after`，节点空白区域对应 `append`，因此同时支持跨节点精确插入和同节点排序，且始终只调用 `moveNodeContentBlock()`。“作为节点移动”固定插入所选目标之后。“降为上一个节点的子节点”移动到同级前一节点之下；“升为上一个节点的兄弟节点”移动到父节点之后。上述操作均保留块 ID、兼容字段重建、撤销保存和空来源节点清理规则；只剩空文字占位块的来源叶节点也按真正空节点清理。

Markdown 导入会在解析标题、列表和普通文本时立即创建带稳定 `id` 的文字内容块，而不是只写入旧版 `text/richText` 镜像。标题后的正文、图片、表格和 fenced 代码按原始出现顺序追加到同一节点的 `content`，因此多段正文与多个代码块不会集中到节点开头或末尾。文章模式因此可在首次渲染、编辑和失焦保存之间定位同一文字块。对于尚未经过规范化、只有旧版文字字段的文档，保存端会把渲染时的兼容文字块视为原块并原位更新，避免把修改内容追加成第二段。

导入文本会在 Markdown 行内样式解析后移除常见的“一、”“（一）”“1.”等章节序号，因此序号位于加粗等标记内部时也不会残留；文章模式可按当前层级重新生成编号。整行仅用于返回目录或顶部的 Obsidian 块锚点不会生成节点，其他指向 `#^块ID` 的链接只保留可读标签，不保留原笔记锚点。桌面文件导入会把可读取的本地图片复制进当前导图资源目录，并通过 `replaceNodeContentBlocks()` 将新路径写回权威图片块的 `source/localSource`，同时重建 `node.image` 兼容镜像；仅修改 `nodeContentBlocks()` 返回的规范化副本不会持久化。无法读取时保留原始引用，不修改数据版本。图片进入最终导入节点树并获得稳定节点 ID 后，现有图床自动上传排程会按全局设置继续处理这些本地副本。渲染新复制资源时先按完整仓库路径直接读取，再回退到 Obsidian 链接缓存，避免缓存尚未索引时短暂加载失败。

### 文字块

文字块可选保存 `paragraphIndent`：

- 字段缺失或为 `first-line`：文章模式和通读模式使用默认首行缩进两字符；
- `none`：该文字块顶格显示；
- 此字段只控制段落级排版，不改变字符级 `richText`，旧文件缺失字段时保持原有显示。

```ts
interface MindMapTextContentBlock {
  id: string;
  type: "text";
  text: string;
  richText?: MindMapTextRun[];
  paragraphIndent?: "first-line" | "none";
}
```

### 图片块

```ts
interface MindMapImageContentBlock {
  id: string;
  type: "image";
  source: string;
  alt?: string;
  align?: "left" | "center" | "right";
  width?: number;
  height?: number;
  layout?: "inline" | "block";
  contentHash?: string; // 图片二进制 SHA-256
  localSource?: string;
  remoteSources?: MindMapImageRemoteSource[];
}
```

`content` 可以表达任意顺序：

```text
图片 → 文字 → 图片 → 文字
```

节点可以是纯图片节点，不强制存在文字。`layout: "inline"` 会让连续图片在导图、文章、通读和大纲中进入同一横向容器，按内容块顺序同行并自动换行；`block` 或缺失时独占一行。`contentHash` 用于同一图床内上传去重和最后引用删除判断，不替代图片地址。

## 5. 富文本

```ts
interface MindMapTextRun {
  text: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: string;
  };
}
```

富文本按连续字符运行段保存。相邻且样式相同的运行段会自动合并。`text` 字段始终保存所有运行段拼接后的纯文本，便于搜索、预览和 Markdown 导出。

## 6. 节点样式

```ts
interface MindMapNodeStyle {
  background?: string;
  foreground?: string;
  borderColor?: string;
  borderWidth?: number;
  shape?: "rounded" | "pill" | "rectangle";
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: "left" | "center" | "right";
  width?: number;
  minHeight?: number;
}
```

- 字段缺失表示继承导图外观或插件全局默认值。
- 布尔值 `false` 是有效显式覆盖，不能在规范化时误删。
- `width` 控制实际节点宽度并触发自动换行。
- `minHeight` 只规定最小高度，内容可继续撑高节点。

## 7. 导图外观

`MindMapAppearance` 包含：

- 主题预设标识。
- 背景颜色和网格/点阵。
- 字体族、字号和全局文字样式。
- 根节点、普通节点、边框颜色。
- 节点默认文字对齐。
- 连接线颜色、样式和宽度。
- 统一/渐细宽度模式与末端最小宽度。
- 彩色分支开关和颜色列表。

主题只是一次性生成一组外观字段，用户仍可继续手动修改具体字段。

## 8. 表格与代码

```ts
interface MindMapTable {
  headers: string[];
  rows: string[][];
  alignments?: ("left" | "center" | "right")[];
  columnWidths?: number[];
  source?: "manual" | "markdown" | "children";
}
```

```ts
interface MindMapCodeBlock {
  language?: string;
  code: string;
  collapsed?: boolean;
  showLineNumbers?: boolean;
  theme?: "obsidian" | "github" | "monokai" | "dracula";
}
```

表格与代码可作为有稳定 ID 的内容块，与文字、图片一起排序；旧文件中的节点级 `table`、`code` 字段在读取时会自动迁移到内容块列表。完整编辑后的 `content` 是权威集合，`replaceNodeContentBlocks()` 会在重建旧版镜像前先清空它们，因此删除操作不会触发反向迁移。表格行会按表头列数补齐或截断。`columnWidths` 按表头顺序保存各列像素宽度；字段缺失时沿用自适应布局，存在时按列数补齐并限制为 64–1200 px。代码块可在节点、页面外观和插件全局三个层级配置默认折叠、行号与 Obsidian、GitHub、Monokai、Dracula 样式；节点优先级最高，未设置时向下跟随。全局可为自动展开和自动行号分别设置行数阈值，节点显式设置仍优先。渲染时先交给 Obsidian Markdown 渲染器生成语法高亮，再由四模式共享的 `render/code-block.ts` 在同一 `pre` 中插入真实行号栏。行号栏不写入文档数据，也不改变高亮 token，只复用代码元素的计算字体、行高和内边距。导图中的节点高度由实际 DOM 测量值回写布局；代码折叠状态变化时会重新测量，布局估算高度不会作为隐式最小高度保存。

## 9. 子导图导航

父节点：

```ts
interface MindMapSubmap {
  path: string;
  title?: string;
}
```

子文件：

```ts
interface MindMapNavigation {
  parentPath?: string;
  parentNodeId?: string;
  parentTitle?: string;
}
```

双向字段允许以下功能可靠工作：

- 进入和返回。
- 搜索父子导图族。
- 文章编号续接。
- 顶层递归目录。
- 返回父导图后定位来源节点。

## 10. 图片镜像元数据

```ts
interface MindMapImageRemoteSource {
  hostId: string;
  hostName?: string;
  url: string;
  deleteKey?: string; // 图床上传响应返回的可选删除令牌
  uploadedAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  failureCount?: number;
}
```

运行时会记录最近成功和失败时间。字段都是可选的，缺失时按默认状态处理。`deleteKey` 只有图床上传响应明确提供或 Zipline 通过认证文件列表安全回查时才保存；远程删除仍要求预设或用户配置明确提供删除能力。ImgBB 的 `deleteKey` 是秘密删除链接，Zipline 的 `deleteKey` 是文件 ID，Freeimage.host 公开 API 不产生该字段。

## 11. 规范化规则

所有磁盘输入经过 `normalizeDocument()`：

- 非法颜色被忽略。
- 数字被限制到安全范围。
- 未知枚举回退到默认值。
- 缺失标识自动生成。
- 富文本运行段重新合并。
- 内容块无效项被丢弃。
- 缺失的派生摘要字段根据内容块补齐。
- 子节点递归规范化。

调用方不应假设 `JSON.parse()` 后的数据已经安全。


图床删除队列保存在插件设置 `pendingImageHostDeletions` 中，每项记录图床、URL、可选哈希/删除令牌、到期时间和来源（图片删除或连通性测试）。队列只保存最多 200 条；到期前恢复图片引用会取消删除。上传与删除不保存两份请求头，均读取图床配置的 `headers`。

## 12. 插件级界面状态

以下字段保存在插件 `data.json`，不属于 `.mindmap` 文档模型：

插件层对 `data.json` 的连续修改采用短窗口合并和严格串行写入。该机制不改变字段结构：每轮开始写入时截取最新 JSON 快照，写入期间的新状态在下一轮保存，避免旧请求晚完成后覆盖新状态。

- `settingsExpandedSections: SettingsSectionTitle[]`：设置页上次由用户手动展开的一级分类。缺失或非法值规范化为空数组，因此首次打开默认全部收起；搜索命中的临时展开不写入此字段。
- `articleEntryLockMode: "locked" | "inherit" | "remember"`：进入文章模式时的锁状态策略。旧配置缺失或非法时回退为 `locked`。
- `articleLastReadOnly: boolean`：`remember` 策略使用的文章模式独立锁状态，默认 `true`。它不会写入 `MindMapDocumentView.readOnly`，因此不改变导图或大纲的文件级只读偏好。

## 后台图片上传补丁

`MindMapImageUploadPatch` 不是持久化文档字段，而是后台上传结果的临时合并协议。补丁仅包含 `nodeId`、`blockId`、本地路径校验值、内容哈希、远程源和首选地址。`applyImageUploadPatches()` 必须在最新文档上按稳定 ID 找到图片块；本地来源已经变化的过期任务会被忽略。该流程只更新图片字段并通过 `replaceNodeContentBlocks()` 重建兼容镜像，不替换根节点、兄弟节点或上传期间产生的文字编辑。
