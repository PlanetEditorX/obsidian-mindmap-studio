# 代码块行号、导图高度与内容块删除修复清单

| 文件 | 变更 |
|---|---|
| `src/render/code-block.ts` | 四模式共享代码块渲染器；集中处理行数、围栏、设置优先级、主题、折叠、Markdown 高亮与真实 DOM 行号栏 |
| `src/view.ts` | 统一委托 `renderCodeBlock()`，导图、大纲、文章和通读共用同一宿主回调 |
| `styles.css` | 使用真实行号栏/代码栏双栏布局，共享计算字体与内边距，并确保横向滚动不被导图节点样式覆盖 |
| `src/editor/editor.ts` | 不再把布局估算高度固化为节点 `min-height`；仅尊重用户显式最小高度；代码渲染完成及折叠切换后重新测量导图布局；节点编辑保存与结构化块删除改用权威内容替换入口 |
| `src/core/model.ts` | 新增 `replaceNodeContentBlocks()`，完整替换 `content` 前清理旧版 `text/richText/image/table/code` 镜像，再从新内容重建兼容字段 |
| `main.js` | 重新生产构建，包含行号重构、动态节点高度和内容块删除修复 |
| `tests/code-block.test.mjs` | 覆盖行号结构、四模式调用、动态高度契约、折叠切换重新测量及旧伪元素禁止回归 |
| `tests/question.test.mjs` | 新增权威内容替换测试，验证删除表格/代码后旧镜像不会复活；锁定节点编辑器使用新入口 |
| `README.md` | 补充代码展开/折叠动态高度和内容块删除持久化说明 |
| `docs/CODE_BLOCK_RENDERING.zh-CN.md` | 增加导图动态高度根因、测量流程、兼容字段删除根因与修复方案 |
| `docs/DATA_MODEL.md` | 说明 `content` 权威替换与旧版字段迁移/镜像同步边界 |
| `docs/TESTING.md` | 增加折叠高度、连接线重排及表格/代码删除重开验证矩阵 |
| `docs/FUNCTION_REFERENCE.md` | 根据新增导出函数与 JSDoc 重新生成 |
| `CHANGELOG.md` | 记录两个新问题的修复 |
| `TEST_RESULTS.md` | 更新完整自动验证结果和环境说明 |
| `examples/中国文学示例.mindmap`、`examples/古诗.mindmap`、`examples/MindMap Assets/古诗/唐诗.mindmap` | 保持可读 UTF-8 规范路径，满足仓库检查 |

## 兼容边界

- 不改变 `.mindmap` 格式版本。
- 不改变代码块节点/页面/全局设置优先级。
- 不改变用户手动节点宽度和最小高度语义。
- 不改变旧文件读取时将节点级 `table` / `code` 迁移为内容块的能力。
- 不修改文章编号、阅读位置、父子导图、搜索、AI、图片、图床及导入导出业务逻辑。

## 设置分类与主题外观排版调整

| 文件 | 变更 |
|---|---|
| `src/settings.ts` | 将资源目录和文件浏览器筛选移入“文件与资源”；新增全局分支外观并写入默认外观映射 |
| `src/main.ts` | 规范化旧配置中缺失或非法的全局分支外观值 |
| `src/editor/editor.ts` | 将当前脑图“主题与外观”重排为主题、画布、节点、连线、阅读和代码分组，并使用两列独立纵向卡片流消除空白 |
| `main.js` | 同步全局分支外观、设置分类顺序和重排后的主题与外观弹窗运行代码 |
| `styles.css` | 增加外观设置卡片、1280px 宽屏弹窗、无空洞双列布局、窄屏单栏布局和可换行的文字样式选项 |
| `tests/settings-layout.test.mjs` | 锁定设置分类、全局分支外观继承和外观弹窗分组契约 |
| `package.json` | 将新增设置布局测试纳入单元测试脚本 |
| `docs/SPECIAL_FEATURES.md`、`CHANGELOG.md` | 更新功能说明和未发布记录 |
| `TEST_RESULTS.md` | 记录本次专项测试、语法检查及构建环境限制 |
