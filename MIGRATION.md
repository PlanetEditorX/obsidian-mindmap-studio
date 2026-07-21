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

## 从 0.9.x 升级到 1.0.0

插件 ID 和安装目录没有变化，直接覆盖 `mindmap-studio` 即可。

旧版单图床配置会在首次启动时自动转换成名为“原图床”的第一项多图床配置。自动上传默认关闭，避免升级后未经确认就上传或删除本地图片。请进入“图片与图床”选择自动上传目标后再开启。

`.mindmap` 数据版本升级为 8。旧图片块仍可正常打开；新版本仅在发生多图床上传时增加 `localSource` 和 `remoteSources` 字段。
