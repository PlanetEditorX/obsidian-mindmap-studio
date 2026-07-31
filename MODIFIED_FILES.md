# 图片粘贴保存同步误报补充修复

| 文件 | 变更 |
|---|---|
| `src/editor/editor.ts` | 图片块已写入后，将后置保存通知或重绘异常改为静默恢复并在下一任务重试保存同步；不再弹出“保存同步出现异常”，且自动上传排程继续执行 |
| `tests/article-content-block.test.mjs` | 锁定已插入图片的异常恢复、延迟保存重试、自动上传不中断，以及源码和 `main.js` 均不含旧误报文案 |
| `main.js` | 同步运行时恢复与重试逻辑，移除旧误报弹窗 |
| `docs/FUNCTION_REFERENCE.md` | 重新生成函数参考，记录新增恢复方法 |
| `CHANGELOG.md`、`docs/TESTING.md`、`TEST_RESULTS.md` | 更新实际提示、手工复现边界和验证记录 |

### 行为边界

- 图片文件尚未保存时仍显示真实的本地保存失败；图片文件已保存但内容块尚未写入时仍显示插入失败。
- 图片块已经写入模型后，不因保存通知、状态更新或重绘的同步异常回滚图片，也不弹出误导性保存失败提示。
- 延迟重试只重新通知当前完整文档和恢复界面，不重复插入图片、不增加撤销记录。
- 自动上传排程与保存同步恢复相互独立，后置同步异常不会再提前 `return`。

# 图片粘贴误报与表格编辑跳动修复

| 文件 | 变更 |
|---|---|
| `src/editor/editor.ts` | 将图片保存、节点插入和自动上传排程分阶段判定；异步保存后重新定位节点；文章/大纲同步恢复阅读锚点；导图表格编辑、列宽保存和真实尺寸布局保持节点视口锚点 |
| `tests/article-content-block.test.mjs` | 覆盖三阶段图片错误提示、过期节点规避、表格同步/二次布局锚点，并断言 `main.js` 已包含对应运行时代码 |
| `main.js` | 同步更新运行时代码，移除成功粘贴后的通用失败误报并加入表格视口保持逻辑 |
| `CHANGELOG.md` | 记录图片粘贴误报与表格编辑跳动修复 |
| `docs/TESTING.md` | 补充连续粘贴图片、自动上传排程异常、表格编辑和列宽调整的手工冒烟项 |
| `TEST_RESULTS.md`、`MODIFIED_FILES.md` | 记录本次修改范围、自动验证结果和构建环境限制 |

### 行为边界

- 只有本地资源保存失败才显示“粘贴图片失败”；节点插入或自动上传排程失败使用明确的阶段性提示，已经保存/插入的图片不会被描述为整体失败。
- 自动上传排程失败不删除本地图片，也不回滚已插入的图片内容块。
- 文章和大纲优先在 DOM 替换同一帧恢复语义阅读位置；后续延迟恢复只用于图片、字体等晚到布局变化。
- 导图表格节点在初次重绘和实测尺寸二次布局中保持屏幕位置，不改变保存、撤销或表格数据格式。

# 文章工具栏显式块移动与节点移动

| 文件 | 变更 |
|---|---|
| `src/editor/editor.ts` | 增加文章点击选点移动状态；当前块追加到目标末尾，当前节点固定插入目标之后，并处理保存、取消、非法目标和单选边界 |
| `src/editor/article-renderer.ts` | 为文章根标题补充稳定节点目标标识 |
| `styles.css` | 增加移动提示栏、来源节点、可用目标和非法目标反馈 |
| `tests/article-context-edit.test.mjs` | 覆盖工具栏入口、两种移动状态、目标拦截、取消和视觉反馈契约 |
| `tests/content-block-drag.test.mjs` | 覆盖 `A、B、C` 中把 `C` 插到 `A` 后得到 `A、C、B` |
| `README.md`、`docs/SPECIAL_FEATURES.md`、`CHANGELOG.md`、`TEST_RESULTS.md` | 同步用户行为、限制条件和验证基线 |
| `docs/FUNCTION_REFERENCE.md`、`main.js` | 重新生成函数参考并执行生产构建 |

### 行为边界

- “作为块移动”只移动当前正在编辑且具有稳定 ID 的内容块，不会把整个节点及其元数据压平。
- “作为节点移动”只移动工具栏所属的单个节点，不继承其他视图中的多选状态，并固定使用目标之后的位置。
- 块不能移回来源节点；节点不能移到根节点、自身或自己的后代。非法目标不会退出待选状态。
- 选择目标前保存当前行内编辑内容；`Esc`、提示栏关闭按钮或文章空白区域可以取消。

# 空节点投放、空来源节点清理与文章鼠标拖动

| 文件 | 变更 |
|---|---|
| `src/editor/editor.ts` | 将空白节点和文章章节绑定为内容块末尾投放目标；移除文章按钮与方向键移动状态，统一复用拖动链路 |
| `src/editor/article-renderer.ts` | 为章节标题、正文、图片、表格和代码绑定共享拖动手柄，并为每个文章章节增加末尾投放目标 |
| `styles.css` | 移除文章键盘移动按钮和激活轮廓，增加导图节点与文章章节共用的末尾投放提示 |
| `tests/content-block-drag.test.mjs` | 覆盖向空节点追加、最后一块移出后删除空白来源节点，以及导图和文章共用鼠标拖动契约 |
| `docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`TEST_RESULTS.md` | 同步统一拖动行为、数据边界和验证结果 |
| `docs/FUNCTION_REFERENCE.md`、`main.js` | 重新生成函数参考并执行生产构建 |

### 行为边界

- 导图和文章编辑模式都只从内容块左侧手柄开始拖动，避免干扰文字选择和整节点拖动。
- 目标具体块按上半区/下半区前后插入；节点或文章章节空白区域按末尾追加，完全空节点也可接收。
- 跨节点移动继续复用稳定块 ID、兼容字段重建、撤销保存和真正空白来源叶节点清理规则。
- 导图表格单击只阻止节点级误操作，双击才打开表格编辑器；右键菜单仍保留编辑入口。

# 文章内容块拖动、空来源节点清理与手柄避让

| 文件 | 变更 |
|---|---|
| `src/core/model.ts` | 跨节点移动最后一个块后，删除真正空白且无结构/元数据的来源叶节点 |
| `src/editor/article-renderer.ts` | 为文章标题、正文、图片、表格和代码创建拖动入口与节点末尾放置目标 |
| `src/editor/editor.ts` | 向文章渲染器提供现有内容块拖动与追加目标回调 |
| `styles.css` | 将拖动手柄放到内容左侧外部，并增加文章块拖动壳层与放置提示 |
| `tests/content-block-drag.test.mjs` | 覆盖空来源节点删除、元数据节点保留、文章拖动入口和手柄避让 |
| `tests/reading-editor-contract.test.mjs` | 同步文章代码块新增拖动壳层后的双击编辑契约 |
| `main.js` | 重新生产构建，包含本次运行时修改 |
| `docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`CHANGELOG.md`、`TEST_RESULTS.md` | 同步数据边界、用户行为、修复记录和验证结果 |

### 行为边界

- 同一节点内部排序不会删除节点。
- 根节点不会因拖空而删除。
- 来源节点仍有子节点、备注、链接、子导图、图标、标签、题目或任务时不会自动删除。
- 文章阅读状态不显示拖动手柄，切换为编辑状态后按实时锁状态启用。

# Markdown 导入标题首次编辑重复追加修复

| 文件 | 变更 |
|---|---|
| `src/core/model.ts` | Markdown 解析文字时直接写入带稳定 ID 的 `content` 文字块 |
| `src/editor/editor.ts` | 旧版无 `content` 节点保存时原位更新兼容文字块，避免追加第二段 |
| `tests/article-content-block.test.mjs` | 覆盖 Markdown 导入稳定块 ID 和旧数据保存兜底契约 |
| `main.js` | 重新生产构建，包含本次运行时修复 |
| `docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`CHANGELOG.md`、`TEST_RESULTS.md` | 同步数据边界、用户行为、修复记录和验证结果 |

### 行为边界

- 不改变 Markdown 标题、列表、表格、图片和代码的既有层级解析规则。
- 不改变 `.mindmap` 数据格式版本；`content` 继续作为权威内容集合，`text/richText` 继续作为兼容镜像。
- 已有多文字块节点仍严格按块 ID 编辑；兼容回退仅在节点没有持久化 `content` 时生效。

# 代码块行号、导图高度与内容块删除修复清单

## 节点编辑键盘、内容块拖动与精确删除

| 文件 | 变更 |
|---|---|
| `src/core/model.ts` | 新增 `moveNodeContentBlock()`，支持稳定块 ID 的节点内重排和跨节点移动，并重建来源/目标兼容字段 |
| `src/editor/node-rich-text-editor.ts` | 文字块保留 Shift+Enter 输入的换行 |
| `src/editor/editor.ts` | 节点编辑器 Enter 保存关闭；编辑器块卡片与导图块增加独立拖动手柄；右键按目标块 ID 删除 |
| `styles.css` | 增加拖动手柄、拖动中状态、前后/末尾放置提示，并让节点文字保留换行 |
| `tests/content-block-drag.test.mjs` | 执行同节点和跨节点移动测试，并锁定键盘、手柄和右键删除契约 |
| `tests/image-layout.test.mjs`、`package.json` | 更新统一删除文案并将新专项测试纳入全量单元测试 |
| `main.js` | 重新生产构建，包含本次运行时修改 |
| `README.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`CHANGELOG.md`、`TEST_RESULTS.md` | 同步行为、数据边界、函数参考、测试范围与验证结果 |

### 行为边界

- 内容块拖动只在编辑模式显示，不影响只读模式。
- 仅从块手柄开始拖动，避免与整节点拖动、文字选择、图片预览、表格和代码交互冲突。
- 跨节点移动保留原块 ID，不复制块；来源节点允许变为空节点。
- Enter 在输入法组合状态下不提交；Shift+Enter 只在支持多行的控件中产生换行。

## Codex 记忆库同步

| 文件 | 变更 |
|---|---|
| `Codex/02_偏好与原则/README.md` | 记录每轮代码交付必须提供 Git 提交标题、变更内容、测试结果和可执行命令 |
| `Codex/03_工作流决策/README.md` | 固化完整源码 ZIP 和 Codex 同步规则 |
| `Codex/04_项目/obsidian-mindmap-studio.md` | 同步文章编辑、表格列宽、设置分类、Nginx 与 AI 进度的完成状态和验证结果 |
| `Codex/05_每日复盘/2026-07-30.md` | 补充本轮事实、决策、测试、待办与风险 |
| `Codex/06_待办与风险/待办总览.md` | 增加真实 Obsidian 手工冒烟与非流式 AI 进度边界 |
| `Codex/07_可复用工作流/README.md` | 增加完整源码包交付流程和非流式 AI 进度实现规则 |
| `Codex/10_索引/项目索引.md` | 更新项目当前状态 |

### 交付边界

- 完整保留用户上传的 Codex Vault 结构和既有内容，仅做增量同步。
- 该轮历史源码 ZIP 包含完整 `Codex/`；后续交付已按用户新规则改为排除 `Codex/`，并继续排除 `node_modules/`、临时测试目录、`.git/` 和嵌套 ZIP。

## AI 整理阶段进度与等待耗时

| 文件 | 变更 |
|---|---|
| `src/ai/modal.ts` | 为 AI 请求增加上传上下文、模型处理、解析结果等阶段提示；每秒更新等待耗时，并在完成、失败、重置和关闭时正确停止计时 |
| `styles.css` | 增加非流式动态进度条、完成和失败状态样式 |
| `tests/ai.test.mjs` | 锁定进度组件、每秒计时、模型阶段切换、整理完成状态和关闭清理契约 |
| `main.js` | 重新生产构建，包含 AI 进度显示 |
| `docs/SPECIAL_FEATURES.md`、`CHANGELOG.md`、`TEST_RESULTS.md` | 更新用户行为、变更记录和验证结果 |

### 行为边界

- 当前 OpenAI 兼容客户端采用非流式请求，无法取得服务端真实完成百分比，因此显示动态进度和准确等待时间，不伪造百分比。
- 进度覆盖询问、AI 整理、题目整理和图片识别；本地文字替换不显示网络请求进度。
- 窗口关闭、模式切换、重新提交、完成或失败都会清理计时器。

## 文章空标题、表格编辑与列宽持久化

| 文件 | 变更 |
|---|---|
| `src/editor/article-renderer.ts` | 文章表格双击打开编辑器；始终创建列宽拖拽手柄，并根据实时锁状态启用交互和回写持久化宽度 |
| `src/editor/table-interaction.ts` | 封装读取实时锁状态的双击编辑与 pointer 列宽拖拽事件，使无重绘模式切换后交互仍然有效并可独立测试 |
| `src/editor/editor.ts` | 向文章渲染器提供实时锁状态；接入文章表格编辑和列宽更新回调；导图表格读取持久化列宽；行内标题的 Enter/Escape 不再进入节点结构快捷键链路 |
| `src/editor/outline-renderer.ts` | 大纲表格读取持久化列宽和列对齐 |
| `src/editor/content-modals.ts` | 表格增删列时同步列宽数组；代码语言新增 Nginx |
| `src/core/model.ts` | `MindMapTable` 新增可选 `columnWidths`，读取时按列数规范化并限制为 64–1200 px |
| `src/settings.ts` | 将“节点编辑器显示位置”迁入“视图与阅读” |
| `styles.css` | 空文档标题保留可点击占位尺寸；增加更宽且可见的表格列宽拖拽热区，并在阅读状态隐藏 |
| `tests/article-content-block.test.mjs`、`tests/code-block.test.mjs`、`tests/settings-layout.test.mjs` | 覆盖空标题、标题 Enter 隔离、实时锁状态切换后的表格双击/指针拖拽、Nginx 和设置分类 |
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
## 2026-07-31 Markdown 导入兼容修复

- `src/core/model.ts`：支持依据源 Markdown 路径解析 Obsidian 相对图片嵌入；过滤块 ID；移除常见中文公文序号。
- `src/main.ts`：从仓库内 Markdown 转换时传入源文件路径。
- `tests/question.test.mjs`：增加 Obsidian 图片、块 ID 与公文序号回归测试。

