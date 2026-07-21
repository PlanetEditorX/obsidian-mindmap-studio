# 升级到 MindMap Studio 1.1.0

1. 关闭 Obsidian 中的 MindMap Studio。
2. 用 1.1.0 安装包中的 `mindmap-studio` 文件夹覆盖旧目录。
3. 重启 Obsidian 或重新启用插件。

`.mindmap` 数据版本仍为 8，不需要转换现有文件。

新版默认开启“远程图片自动故障转移”，默认等待时间为 8 秒。可在“设置 → MindMap Studio → 图片与图床”中关闭或修改。

故障转移只在图片被实际加载时执行。直接打开可编辑脑图会触发；Markdown 静态嵌入会在下一次可编辑脑图完成切换并保存后使用新的主地址。
