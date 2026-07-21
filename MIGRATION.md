# 从 MindMap Canvas 迁移到 MindMap Studio

0.9.0 将插件公开名称和插件 ID 从 `MindMap Canvas / mindmap-canvas` 改为 `MindMap Studio / mindmap-studio`，以免与 Obsidian 内置 Canvas 混淆。

## 升级步骤

1. 在 Obsidian 中关闭旧插件 MindMap Canvas。
2. 安装新版目录：

```text
.obsidian/plugins/mindmap-studio/
```

3. 首次启用新版时，插件会尝试读取：

```text
.obsidian/plugins/mindmap-canvas/data.json
```

并迁移旧设置。

4. 确认新版正常后，删除旧目录：

```text
.obsidian/plugins/mindmap-canvas/
```

不要同时启用新旧插件，否则两者可能同时注册 `.mindmap` 文件扩展名。

## 脑图文件

`.mindmap` 后缀没有变化，现有文件可直接打开。

旧版节点的 `text`、`richText` 和 `image` 会自动转换为新的有序内容块。原文件不会因为读取而丢失内容。
