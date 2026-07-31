# Modified Files

- `src/utils/desktop-import.ts`
  - 读取并去重复制桌面 Markdown 图片。
  - 使用权威内容块替换写回新 `source/localSource`，避免规范化副本修改丢失。
- `src/main.ts`
  - 桌面导入委托统一复制改写流程。
  - 仓库内 Markdown 转脑图使用同样的权威块写回，并在保存后恢复自动上传。
- `src/editor/editor.ts`
  - 导入节点获得最终 ID 后为本地图片安排图床自动上传。
- `src/view.ts`
  - 新复制图片优先按完整仓库路径直接解析，再回退到元数据缓存。
- `tests/desktop-import.test.mjs`、`tests/import-mode.test.mjs`
  - 覆盖节点引用改写、兼容镜像和自动上传排程。
- `README.md`、`docs/DATA_MODEL.md`、`docs/ARCHITECTURE.md`、`CHANGELOG.md`、`TEST_RESULTS.md`
  - 同步导入图片复制、引用改写和自动上传行为。
- `main.js`
  - 由生产构建重新生成。
