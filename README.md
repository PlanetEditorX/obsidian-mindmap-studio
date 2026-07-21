# MindMap Studio for Obsidian

MindMap Studio 是一个本地优先、可重新打开继续编辑的 Obsidian 思维导图插件。脑图保存为独立的 `.mindmap` JSON 文件，不会在第二次打开时变成 Markdown 源码或静态图片。

## 为什么不再叫 MindMap Canvas

旧名称中的 Canvas 只是指可缩放、可平移的编辑区域，但容易与 Obsidian 自带 Canvas 功能混淆。从 0.9.0 起，插件正式更名为 **MindMap Studio**：

- 插件显示名称：`MindMap Studio`
- 插件 ID 和安装目录：`mindmap-studio`
- 脑图文件后缀：`.mindmap`（保持不变）
- 旧插件设置：首次启动新版时会尝试从 `mindmap-canvas/data.json` 自动迁移

升级后请关闭并移除旧的 `mindmap-canvas` 插件目录，避免两个插件同时注册 `.mindmap` 文件类型。

## 0.9.0 重点功能

### 可排序的文字与图片内容块

节点不再固定为“一个标题加一张图片”，而是由多个内容块组成。内容块可以上下移动：

- 纯文字
- 纯图片
- 图片 → 文字
- 文字 → 图片
- 文字 → 图片 → 文字
- 多张图片和多段文字任意穿插

编辑节点时，可以删除默认的“新节点”文字块。只要还保留一个有效图片块，节点就会作为纯图片节点保存。

每个文字块都支持局部富文本：选择任意字符后设置加粗、斜体、下划线或颜色，下方实时预览。不同文字块可以分别设置格式。

### 图片点击放大

在可编辑脑图中点击任意图片会打开大图预览：

- 鼠标滚轮缩放
- `+` / `−` 调整缩放
- `100%` 恢复原始比例
- 双击图片恢复 100%
- 大图可在预览窗口中滚动查看

### 本地图片资源

粘贴图片或点击“保存到仓库”时，图片默认保存到：

```text
当前脑图所在目录 / 设置的资源文件夹 /
```

例如：

```text
Projects/
├── Plan.mindmap
└── MindMap Assets/
    └── Plan-20260720-123456.png
```

资源文件夹可在插件设置中修改，默认是 `MindMap Assets`。

### 自定义图床上传

图片块提供“上传到图床”按钮。插件不绑定特定服务，而是支持配置通用 HTTP 上传接口：

- 图床上传地址
- `multipart/form-data` 或原始二进制
- multipart 文件字段名
- 自定义请求头 JSON
- 返回图片地址字段，例如 `data.url`、`result.image`

大多数接口可使用：

```text
请求格式：multipart/form-data
文件字段：file
响应字段：data.url
```

自定义请求头会保存在插件的 `data.json` 中。不要在共享仓库或不可信设备中保存敏感令牌。

## 安装

1. 下载并解压安装包。
2. 将 `mindmap-studio` 文件夹放入：

```text
你的仓库/.obsidian/plugins/
```

最终目录：

```text
.obsidian/plugins/mindmap-studio/
├── main.js
├── manifest.json
└── styles.css
```

3. 删除或停用旧目录：

```text
.obsidian/plugins/mindmap-canvas/
```

4. 重启 Obsidian。
5. 在“设置 → 第三方插件”中启用 **MindMap Studio**。

## 节点内容编辑

双击节点或按 `F2` 打开编辑窗口。

### 添加内容块

点击：

- `+ 文字`
- `+ 图片`

每个内容块右上角有：

- 上移
- 下移
- 删除

图片块支持：

- 输入仓库路径
- 输入 `[[图片文件]]`
- 输入网络图片 URL
- 从电脑选择并保存到仓库
- 从电脑选择并上传到图床

### 创建纯图片节点

1. 新建节点。
2. 添加图片块并选择图片。
3. 删除默认文字块，或者清空文字后删除该文字块。
4. 保存并关闭。

节点将只显示图片，不会强制保留“新节点”。

## 其他已有功能

- `.mindmap` 文件再次打开仍是可编辑脑图
- 向右展开、左右平衡布局
- 拖动分支更改父节点
- 折叠与展开
- 撤销与重做
- 节点任务、标签、备注、链接和 Emoji
- 局部文字格式和整节点样式
- 背景、字体、节点与连线外观
- Markdown 表格转换和子节点转表格
- 代码识别与 Obsidian 代码渲染
- 子导图以及返回父导图导航
- Markdown、JSON 和 SVG 导出
- 搜索与定位节点
- Markdown 中嵌入脑图静态预览

## 子导图目录

假设父导图位于：

```text
Projects/Plan.mindmap
```

在节点“市场分析”上创建子导图后，默认生成：

```text
Projects/
├── Plan.mindmap
└── MindMap Assets/
    └── Plan/
        └── 市场分析.mindmap
```

子导图顶部会显示返回父导图的导航按钮，并保存父文件路径和来源节点 ID。

## 数据兼容

0.9.0 文件数据版本为 `7`。

旧版数据会自动转换为内容块：

- 旧 `image` 字段转换成图片块
- 旧 `text` / `richText` 字段转换成文字块
- 同时有图片和文字时，默认转换为“图片 → 文字”

旧字段仍会同步保留，用于兼容较早版本和部分导出逻辑。

## 开发

```bash
npm ci
npm run build
npm test
```

生产文件：

```text
main.js
manifest.json
styles.css
```
