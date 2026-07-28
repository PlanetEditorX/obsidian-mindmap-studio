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
- `text`、`richText`、`image` 是当前节点的派生摘要字段，由 `syncNodeContentFields()` 与有序内容块同步，供搜索、快速渲染和导出使用。
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

`question` 是可选的结构化题目数据，支持 `choice` 和 `essay` 两种模式。它包含图文题干、选择项、答案、解答及标签；题干会同步到标准 `content` 字段，保证既有的导出、搜索和阅读模式仍按普通节点工作。
- `view.articleTocMaxDepth` 是可选的 1–8 层目录深度覆盖。字段缺失时，文章模式和通读模式跟随插件全局 `articleTocMaxDepth`；字段存在时当前脑图优先。

## 4. 有序内容块

### 文字块

```ts
interface MindMapTextContentBlock {
  id: string;
  type: "text";
  text: string;
  richText?: MindMapTextRun[];
}
```

### 图片块

```ts
interface MindMapImageContentBlock {
  id: string;
  type: "image";
  source: string;
  alt?: string;
  localSource?: string;
  remoteSources?: MindMapImageRemoteSource[];
}
```

`content` 可以表达任意顺序：

```text
图片 → 文字 → 图片 → 文字
```

节点可以是纯图片节点，不强制存在文字。

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
  source?: "manual" | "markdown" | "children";
}
```

```ts
interface MindMapCodeBlock {
  language?: string;
  code: string;
}
```

表格行会按表头列数补齐或截断。代码块保留语言名称，渲染时交给 Obsidian Markdown 渲染器进行语法高亮。

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
  uploadedAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  failureCount?: number;
}
```

运行时会记录最近成功和失败时间。字段都是可选的，缺失时按默认状态处理。

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
