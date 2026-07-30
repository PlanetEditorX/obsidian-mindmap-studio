# 代码块行号、导图高度与内容块删除修复清单

## 文章空标题、表格编辑与列宽持久化

| 文件 | 变更 |
|---|---|
| `src/editor/article-renderer.ts` | 文章表格双击打开编辑器；编辑状态下显示列宽拖拽手柄并回写持久化宽度 |
| `src/editor/editor.ts` | 接入文章表格编辑和列宽更新回调；导图表格读取持久化列宽；行内标题的 Enter/Escape 不再进入节点结构快捷键链路 |
| `src/editor/outline-renderer.ts` | 大纲表格读取持久化列宽和列对齐 |
| `src/editor/content-modals.ts` | 表格增删列时同步列宽数组；代码语言新增 Nginx |
| `src/core/model.ts` | `MindMapTable` 新增可选 `columnWidths`，读取时按列数规范化并限制为 64–1200 px |
| `src/settings.ts` | 将“节点编辑器显示位置”迁入“视图与阅读” |
| `styles.css` | 空文档标题保留可点击占位尺寸；增加表格列宽拖拽和固定布局样式 |
| `tests/article-content-block.test.mjs`、`tests/code-block.test.mjs`、`tests/settings-layout.test.mjs` | 覆盖空标题、标题 Enter 隔离、表格双击/列宽、Nginx 和设置分类 |
| `main.js` | 重新生产构建，包含本次运行时修改 |
| `docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`CHANGELOG.md`、`TEST_RESULTS.md` | 更新数据格式、用户行为和验证记录 |

### 兼容边界

- `columnWidths` 是可选字段；旧文件没有该字段时继续使用原有自适应表格布局。
- 列宽按表头顺序保存为像素值，读取时限制到 64–1200 px；缺失列使用 160 px。
- Markdown 表格导入导出不嵌入列宽元数据；导入后可在文章编辑模式重新拖动设置。
- 阅读模式不显示拖拽手柄，也不开放双击编辑。

## 文章后续文字块编辑状态与插入焦点修复

| 文件 | 变更 |
|---|---|
| `src/editor/editor.ts` | 文章/大纲文字块激活时登记并在失焦后释放活动编辑节点；插入新文字块时保护初始焦点，右键菜单关闭后将光标恢复到目标块末尾 |
| `tests/article-content-block.test.mjs` | 覆盖后续块按 ID 编辑、活动状态生命周期和插入块焦点保护 |
| `tests/node-creation.test.mjs`、`tests/reading-editor-contract.test.mjs`、`scripts/test.mjs` | 同步共享内联编辑入口的新焦点保护契约 |
| `main.js` | 重新生产构建，包含文章文字块编辑状态与焦点修复 |
| `docs/FUNCTION_REFERENCE.md` | 根据内联编辑入口签名与注释重新生成 |
| `CHANGELOG.md`、`TEST_RESULTS.md` | 记录问题、修复和验证结果 |

### 行为边界

- 不改变 `.mindmap` 内容块格式；每个文字块继续使用原有独立 ID。
- 不合并“用户名：”与“OpenResty-X”等相邻文字块。
- 普通点击、双击和右键插入均进入对应文字块，不回退到首个文字块。
- 编辑结束后释放活动状态，后续设置与文章上下文仍可正常刷新。

| 文件 | 变更 |
|---|---|
| `src/render/code-block.ts` | 四模式共享代码块渲染器；集中处理行数、围栏、设置优先级、主题、折叠、Markdown 高亮与真实 DOM 行号栏 |
| `src/view.ts` | 统一委托 `renderCodeBlock()`，导图、大纲、文章和通读共用同一宿主回调 |
| `styles.css` | 使用真实行号栏/代码栏双栏布局，共享计算字体与内边距，并确保横向滚动不被导图节点样式覆盖 |
| `src/editor/editor.ts` | 不再把布局估算高度固化为节点 `min-height`；仅保留 36px 全局下限并尊重用户显式的更高最小高度；代码渲染完成及折叠切换后重新测量导图布局；节点编辑保存与结构化块删除改用权威内容替换入口 |
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
- 不改变用户手动节点宽度和最小高度的覆盖语义；新增的 36px 全局下限只阻止空节点塌缩。
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

## 子导图默认节点、文章空节点焦点与导图最低高度

| 文件 | 变更 |
|---|---|
| `src/main.ts` | 新建子导图不再清空默认子节点，保留“主题 1”和“主题 2” |
| `src/editor/article-renderer.ts` | 编辑模式仅为完全无内容块的末端节点渲染可聚焦占位行；表格、图片、代码节点不生成空正文 |
| `src/editor/editor.ts` | 导图节点运行时统一应用 36px 最低高度 |
| `src/render/layout.ts` | 初始估算和浏览器实测尺寸均应用相同最低高度，避免碰撞布局再次压扁空节点 |
| `styles.css` | `.mmc-node` 增加 36px 最低高度 |
| `main.js` | 同步上述运行时代码 |
| `tests/node-creation.test.mjs` | 覆盖子导图默认结构、文章空节点焦点目标和导图最低高度 |
| `package.json` | 将新增专项测试纳入单元测试 |
| `docs/SPECIAL_FEATURES.md`、`CHANGELOG.md` | 更新功能说明和修复记录 |
| `TEST_RESULTS.md` | 记录本次验证结果和构建环境限制 |


## 文章模式节点快捷操作与空节点删除

| 文件 | 变更 |
|---|---|
| `src/editor/editor.ts` | 文章节点快捷操作调整为“添加同级、添加子节点、删除、更多”；“更多”复用完整右键菜单，并新增“节点设置”进入完整编辑器；空节点删除改为按绑定 ID 执行，按钮按下时避免失焦抢先重绘 |
| `main.js` | 同步文章快捷操作、节点设置入口、定向删除和迟到 blur 防护 |
| `tests/article-context-edit.test.mjs` | 覆盖按钮集合、根节点边界、更多菜单、节点设置、定向删除和失焦竞争防护 |
| `docs/SPECIAL_FEATURES.md`、`CHANGELOG.md` | 更新文章节点快捷操作与空节点删除说明 |
| `TEST_RESULTS.md` | 记录专项测试和当前依赖限制 |

### 行为边界

- 普通文章节点：显示“添加同级、添加子节点、删除、更多”。
- 文章根节点：不允许同级或删除，仅显示“添加子节点、更多”。
- “更多”与右键菜单使用同一实现；“节点设置”保留原完整编辑能力。
- 空白节点即使仍处于行内输入状态，也能直接删除，不依赖当前选择状态。

## 文章模式“编辑当前内容”分流

| 文件 | 变更 |
|---|---|
| `src/editor/editor.ts` | 将“编辑节点”按显示模式分流：文章编辑模式直接聚焦行内内容；无正文的结构化内容节点创建临时正文输入行；导图和大纲继续打开完整节点编辑器；图片精确编辑仍强制打开完整编辑器 |
| `src/editor/article-renderer.ts` | 子导图章节标题注册为仅由显式编辑命令激活的行内编辑目标，普通点击仍进入子导图 |
| `main.js` | 同步文章编辑动作分流、临时正文输入和子导图标题显式编辑逻辑 |
| `tests/article-context-edit.test.mjs` | 覆盖模式分流、右键菜单名称、阅读模式隐藏、内容节点“添加正文”、子导图标题和图片完整编辑器契约 |
| `package.json` | 将文章右键编辑专项测试加入单元测试脚本 |
| `docs/SPECIAL_FEATURES.md`、`CHANGELOG.md` | 记录文章、阅读、导图模式下不同的编辑入口行为 |
| `TEST_RESULTS.md` | 记录专项测试、广泛单元测试、文档/仓库检查及构建环境限制 |

### 行为边界

- 文章编辑模式：有可编辑标题或正文时显示“编辑当前内容”，直接定位光标。
- 文章编辑模式：仅含图片、表格、代码等内容时显示“添加正文”，空输入失焦后自动移除临时行。
- 文章阅读模式：右键菜单不显示编辑入口。
- 导图和大纲模式：继续使用完整节点编辑器，不改变原有节点样式、备注、链接和内容块编辑能力。
