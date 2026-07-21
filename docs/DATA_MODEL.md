# `.mindmap` 数据模型

## 1. 文档版本

当前数据版本为 `10`。版本号表示文件结构兼容级别，不等同于插件版本号。新增可选字段且不破坏旧文件时，可以保持数据版本不变；只有需要迁移语义或改变必需结构时才提高数据版本。

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
- `view`：文件级只读状态等视图信息。显示模式现由全局设置控制，旧字段仍兼容读取。

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
  link?: string;
  task?: "todo" | "doing" | "done";
  image?: string;
  table?: MindMapTable;
  code?: MindMapCodeBlock;
  submap?: MindMapSubmap;
  skipArticleNumbering?: boolean;
  style?: MindMapNodeStyle;
}
```

重要约束：

- `id` 在同一文档中必须唯一。
- `children` 始终是数组。
- `content` 是当前推荐的有序内容模型。
- `text`、`richText`、`image` 是兼容字段，由 `syncNodeLegacyFields()` 与内容块同步。
- `collapsed` 只影响导图可见布局，不删除后代。
- `submap` 表示该节点关联独立子导图文件。
- `skipArticleNumbering` 仅影响文章模式编号，不改变树层级。

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

富文本按连续字符运行段保存。相邻且样式相同的运行段会自动合并。`text` 字段始终保存所有运行段拼接后的纯文本，便于搜索、旧版本兼容和 Markdown 导出。

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

运行时会记录最近成功和失败时间。字段都是可选的，因此旧图片数据仍可打开。

## 11. 规范化规则

所有磁盘输入经过 `normalizeDocument()`：

- 非法颜色被忽略。
- 数字被限制到安全范围。
- 未知枚举回退到默认值。
- 缺失标识自动生成。
- 富文本运行段重新合并。
- 内容块无效项被丢弃。
- 旧字段迁移到新内容块。
- 子节点递归规范化。

调用方不应假设 `JSON.parse()` 后的数据已经安全。
