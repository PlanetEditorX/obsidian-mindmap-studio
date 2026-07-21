# 升级到 MindMap Studio 1.3.0

1. 关闭 Obsidian 中的 MindMap Studio。
2. 用 1.3.0 安装包中的 `mindmap-studio` 文件夹覆盖旧目录。
3. 重启 Obsidian 或重新启用插件。

`.mindmap` 文件的数据结构版本仍为 9，现有脑图不需要转换。首次启动 1.3.0 后，插件会在后台建立本地搜索索引。导图数量较多时，最初几秒内搜索结果可能逐步增加，但编辑功能不受影响。

## 新增本地索引文件

插件目录会生成：

```text
.obsidian/plugins/mindmap-studio/mindmap-search-index.json
```

该文件是可重新生成的缓存，不是脑图源数据：

- 删除它不会删除任何脑图；
- 插件下次启动会自动重建；
- 不需要纳入版本控制；
- 不会上传到图床或其他网络服务。

## 搜索入口

- 导图工具栏中的全局搜索按钮；
- Obsidian 左侧功能区的搜索按钮；
- 命令面板中的“全局搜索所有思维导图”；
- 快捷键 `Ctrl/Cmd + Shift + F`。

旧的 `Ctrl/Cmd + F` 继续只搜索当前打开的导图。
