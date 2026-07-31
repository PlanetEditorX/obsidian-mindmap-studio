# Modified Files

- `src/main.ts`
  - 自动上传排程持有可随 Obsidian 文件重命名更新的 `TFile`，保存后按当前路径继续上传和写回。
- `src/editor/editor.ts`
  - 导图空白处右键新增“上传当前页面所有图片”，一次选择图床并仅补传缺失镜像。
  - 缓存节点实际外框尺寸，仅在尺寸真实变化时重新执行测量布局，阻止点击节点造成持续下移。
- `tests/import-mode.test.mjs`
  - 覆盖自动上传任务在保存期间导图重命名后的续传路径。
- `tests/image-layout.test.mjs`
  - 覆盖页面批量上传、缺失图床过滤、权威内容写回和节点尺寸变化阈值。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`CHANGELOG.md`、`TEST_RESULTS.md`
  - 同步自动上传、批量上传、布局稳定性和验证基线。
- `main.js`
  - 由生产构建重新生成。
