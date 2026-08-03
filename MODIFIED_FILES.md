# Modified Files

## 1.43.7 Ctrl/Cmd+F 搜索入口修复

- `src/main.ts`、`src/view.ts`：活动 MindMap Studio 视图在窗口捕获阶段直接处理 `Ctrl/Cmd+F`，并通过公开视图边界打开当前父子导图族搜索；弹窗内保持原按键行为。
- `src/editor/editor.ts`、`src/search/global-search.ts`：编辑器根节点保留快捷键回退和旧版 `Ctrl/Cmd+Alt+F` 兼容，工具栏提示与搜索范围注释改为 `Ctrl/Cmd+F`。
- `tests/reading-editor-contract.test.mjs`、`scripts/test.mjs`：更新快捷键优先级、窗口捕获、可编辑控件和非英文键盘布局契约。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`：同步新的搜索快捷键行为。

## 1.43.6 加载进度开关与完整范围替换

- `src/settings.ts`、`src/main.ts`、`src/view.ts`、`src/editor/editor-types.ts`、`src/editor/editor.ts`：新增默认关闭的右下角加载进度开关，并只在文章/通读且开关启用时显示。
- `src/search/global-search.ts`、`src/main.ts`：全部替换重新查询完整搜索作用域，不受显示结果上限影响；写回后立即刷新单文件索引并增加批量替换调试事件。
- `tests/global-search-contract.test.mjs`、`tests/settings-layout.test.mjs`：新增完整范围替换、索引刷新和加载进度默认关闭契约测试。
- `README.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`：同步用户行为、架构边界和手工验证范围。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：版本统一为 1.43.6。

## 1.43.4 CI 文档覆盖修复

- `src/article/modes.ts`：为 `ArticleContextProgress` 增加完整 JSDoc，说明阶段、百分比与动态计数用途。
- `src/editor/editor.ts`：为右下角文章上下文进度渲染方法增加 JSDoc，明确其只负责只读反馈。
- `docs/FUNCTION_REFERENCE.md`：重新生成函数参考，文档覆盖提升为 56 个源码模块、1127 个具名声明。
- `CHANGELOG.md`、`TEST_RESULTS.md`、版本元数据与交付配置：同步 1.43.4 CI 修复结果。


## 1.43.3 文章/通读右下角加载进度

- `src/main.ts`、`src/article/modes.ts`：为文章族上下文构建新增统一进度回调与百分比 helper，在父子导图遍历、目录/章节索引和导航整理阶段持续上报进度。
- `src/view.ts`、`src/editor/editor.ts`、`styles.css`：在文章模式与通读模式右下角新增非阻塞加载进度浮层，完成到 100% 后自动隐藏，失败回退也会收口并清理残留状态。
- `tests/article-context-progress.test.mjs`、`tests/incremental-render.test.mjs`、`package.json`：新增进度 helper 和右下角进度链路专项测试，并把新测试纳入单元测试入口。
- `CHANGELOG.md`、`package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：版本统一为 1.43.3，重新生成生产构建并写入本轮安装包 SHA-256。
## 1.42.11 XMind 图片与 LaTeX 资源导入

- `src/import/import-export.ts`：解析 XMind 主题图片、归档 `resources/` 二进制、共享资源引用和常见公式字段；保留图片尺寸，缺失资源不生成破损内容块，并为非界面调用提供 data URL 回退。
- `src/editor/editor-modals.ts`、`src/editor/editor.ts`：桌面与浏览器 XMind 导入统一保存图片到当前导图资源目录，显示图片提取、公式识别和缺失资源数量。
- `tests/xmind-import.test.mjs`、`tests/import-mode.test.mjs`、`scripts/test.mjs`：新增图片资源提取、共享去重、路径改写、LaTeX 字段、缺失资源和自包含回退测试。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：说明 XMind 图片与公式导入行为及维护边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：版本统一为 1.42.11；最终安装包校验值在打包后写入。

## 1.41.10 通读编号使用当前内存文档

- `src/main.ts`：文章族刷新建立文件级文档缓存，并把当前编辑器文档预置为当前物理文件的权威快照；从子导图进入通读后修改编号时，不再读取尚未保存完成的旧磁盘副本。
- `tests/article-numbering.test.mjs`：新增当前子导图编号修改在延迟保存期间仍被目录和正文读取的回归契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步行为、维护边界和验证结果。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：统一版本为 1.41.10，安装包 SHA-256 为 `1cde15007c5fb14f4d998b3206b2263b500733ee1bab73f8fe13f7acc3ec6c13`。

## 1.41.5 中心节点关闭文章编号的整页语义

- `src/article/modes.ts`：新增当前物理导图编号关闭判定；根节点为 `none` 时清空全部章节与末端序号，但保留结构深度；普通节点关闭仍只跳过自身。
- `src/main.ts`：递归文章目录构建复用整页关闭状态，避免目录继续显示“第一章”。
- `src/editor/article-renderer.ts`、`src/editor/editor.ts`：子文章页标题不再显示父级编号，并补充中心节点/普通节点关闭语义说明。
- `tests/article-numbering.test.mjs`：新增整页关闭、普通节点单点跳号和目录/标题集成契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步行为、架构、数据语义和验证结果。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：统一版本为 1.41.5，最终安装包 SHA-256 在打包后写入。

## 1.41.4 大文件操作与全局页面切换过渡

- `src/editor/editor.ts`：新增统一页面过渡状态机、两帧绘制门、目标页面入口动画和导航异常边界；合并、提取、创建、父子导图跳转及显示模式切换接入分阶段状态。
- `styles.css`：新增全屏模糊过渡层、状态卡片、主题图标脉冲、页面淡入及减少动态效果回退。
- `tests/incremental-render.test.mjs`、`tests/reading-editor-contract.test.mjs`：新增大操作先绘制状态、全局导航包装、父级返回过渡和动画回退契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步交互状态机、维护边界、测试与交付状态。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：统一版本为 1.41.4，最终安装包 SHA-256 在打包后写入并重新生成生产构建。

## 1.41.3 文章表格列宽稳定保存与页面适配

- `src/editor/table-interaction.ts`：新增相邻列守恒调整算法，拖动当前分隔线时只让当前列与右侧列反向变化，并保持总宽度和最小列宽边界。
- `src/editor/article-renderer.ts`：保存值按总和转换为百分比，表格固定铺满文章宽度；只为非末列创建拖动柄，并优先从实际页面宽度开始调整。
- `src/editor/editor.ts`：列宽释放后直接记录历史、更新稳定表格块并触发保存，不同步重建整篇文章 DOM，避免目录/正文状态和阅读位置竞争。
- `src/view.ts`：记录最近一次持久化的中心标题，仅在标题确实变化时同步文件名，避免表格或样式保存将既有文件路径意外改名。
- `styles.css`：表格和外壳限制为页面宽度，采用固定布局与单元格强制换行，隐藏横向溢出。
- `tests/article-content-block.test.mjs`：新增相邻列边界、比例列宽、无末列拖动柄、无整页重绘、无横向滚动和标题同步保护回归。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步行为、数据边界、测试与交付状态。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：统一版本为 1.41.3，写入最终安装包 SHA-256 并重新生成生产构建。

## 1.40.11 删除文章边缘加载按钮跑马灯

- `styles.css`：删除加载按钮的角度自定义属性、圆角边框伪元素、`conic-gradient` 遮罩和边框无限动画；保留文字双轴居中与原有内部流光。
- `tests/incremental-render.test.mjs`：新增跑马灯样式不存在的反向契约，并继续验证内部流光及减少动态效果回退。
- `README.md`、`CHANGELOG.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`TEST_RESULTS.md`：同步当前加载反馈和资源边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.40.11 版本、最终安装包校验和生产构建。

## 1.40.10 文章边缘加载按钮跑马灯与文字居中

- `styles.css`：加载按钮改为 Flex 双轴居中；实际加载时增加主题深色圆角边框跑马灯，保留内部流光，并兼容减少动态效果。
- `tests/incremental-render.test.mjs`：增加按钮居中、`conic-gradient` 边框动画、遮罩与减少动态效果契约。
- `README.md`、`CHANGELOG.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`TEST_RESULTS.md`：同步用户可见反馈、测试边界和验证结果。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.40.10 版本、最终安装包校验和生产构建。

## 1.40.9 目录页阻止历史子文件自动恢复

- `src/article/reading-location.ts`：新增 `chooseArticleLandingRefreshLocation()`，目录激活时明确返回空恢复目标。
- `src/editor/editor.ts`：识别生成目录终止状态，取消残留阅读恢复并禁止历史子文件位置触发 `onDisplayModeChange()`；调试事件增加 `articleDirectoryActive`。
- `tests/reading-location.test.mjs`、`tests/reading-editor-contract.test.mjs`：增加目录抑制跨文件恢复的纯函数回归和编辑器集成契约。
- `README.md`、`CHANGELOG.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步真实 1.40.8 日志根因、行为边界和验证判据。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.40.9 版本、最终安装包校验和生产构建。

## 1.40.5 真实日志驱动的目标优先级热修复

- `src/article/reading-location.ts`：新增文章上下文刷新目标与入口过渡目标的纯函数优先级选择，显式目标始终压过骨架/历史恢复。
- `src/view.ts`、`src/editor/editor-types.ts`：跨文件操作保留一次性精确 `preferredCurrentNodeId` 到上下文刷新完成，不再只传布尔标记。
- `src/editor/editor.ts`：`setOptions()` 优先恢复精确当前文件目标；入口骨架不允许后到的普通恢复覆盖本次显式章节；新增恢复选择调试事件。
- `tests/reading-location.test.mjs`、`tests/reading-editor-contract.test.mjs`、`tests/incremental-render.test.mjs`：增加真实日志冲突的可执行优先级回归和集成契约。
- `README.md`、`CHANGELOG.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`TEST_RESULTS.md`：同步真实根因、调试判据、源码基线差异与验证状态。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`：版本提升为 1.40.5；`update.json` 和安装包 SHA-256 在最终打包后更新。

## 1.39.13 父级返回、章节落地与运行调试记录

- `src/main.ts`：新增显式导航目标校验与父挂载节点反查；目标文件切换前解析最终节点并排队；加入运行调试捕获、剪贴板复制命令和设置同步。
- `src/editor/editor.ts`、`src/editor/editor-types.ts`、`src/view.ts`：显式章节目标始终高于目录落地配置；跨文件替换文档时原子提交新选项并取消旧滚动事务；记录文章上下文、窗口挂载、语义定位、父级导航和异常状态。
- `src/debug/runtime-debug.ts`：新增有界、会话级、结构化运行日志；限制字段长度并过滤可编辑正文，支持 JSONL 导出和高频事件节流。
- `src/settings.ts`：在“管理配置”增加“调试模式”开关，启停时立即重置或停止当前会话日志。
- `tests/incremental-render.test.mjs`：新增显式目标正文落地、文件切换事务取消、父节点反查与调试复制命令契约；单元测试增至 281 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步导航优先级、调试数据边界和人工复现流程。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.13 版本、生产构建和最终安装包校验。

## 1.39.12 文章目录首帧与双向过渡

- `src/view.ts`、`src/editor/editor-types.ts`：新增文章上下文准备态；打开文件时先消费排队的跨文件目标，上下文未完成前禁止真实文章首帧，失败时回退当前文件并结束准备态。
- `src/main.ts`：跨文件目录导航在切换视图前排队目标节点，新视图同步消费，避免父章节编号与子文件根标题的临时组合。
- `src/editor/editor.ts`：目录/正文按目标类型显示骨架并使用对称过渡；新增独立落地模式切换链，返回目录清除正文恢复任务并固定从顶部进入。
- `styles.css`：增加目录目标骨架的层级行样式，沿用减少动态效果兼容。
- `tests/incremental-render.test.mjs`：新增文章上下文首帧门、目录双向过渡、目录顶部落地、跨文件目标预排队与同步消费契约；单元测试增至 280 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步首帧状态机、过渡和人工验证边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.12 版本、生产构建和最终安装包校验。

## 1.39.11 文章章节定位事务化

- `src/editor/editor.ts`：文章当前位置采集改用标题/真实章节专属选择器；新增最后一次导航独占的可取消语义滚动事务，异步上下文刷新沿用活动目标，并用最长 5 秒的布局观察抵消图片、表格、代码和字体晚到；用户滚轮、触摸、指针或键盘翻页立即接管。
- `tests/incremental-render.test.mjs`、`tests/article-content-block.test.mjs`、`scripts/test.mjs`：新增文章页壳排除、章节边界、旧任务令牌取消、异步布局稳定、亚像素写入和用户输入取消契约；单元测试增至 279 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步根因、事务时序、稳定窗口和人工验证边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.11 版本、生产构建和最终安装包校验。

## 1.39.10 文章入口骨架与窗口过渡反馈

- `src/editor/editor.ts`：文章首次进入和目录跳转增加可取消的双帧骨架绘制门；骨架阶段暂存语义位置，真实窗口挂载后恢复；边缘扩展先绘制加载状态再挂载内容，并尊重减少动态效果。
- `src/editor/article-renderer.ts`：初始窗口、目标窗口和前后扩展新增方向感轻微淡入标记。
- `styles.css`：新增固定范围骨架、流光、文章页/章节淡入和减少动态效果回退；不使用整页覆盖或章节占位。
- `tests/incremental-render.test.mjs`：新增骨架双帧、位置暂存、边缘加载、淡入和减少动态效果契约；单元测试增至 278 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步过渡行为、边界和验证结果。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.10 版本、生产构建和最终安装包校验。

## 1.39.9 文章 5 KB 目标窗口与章节定位

- `src/article/render-window.ts`：新增 UTF-8 字节预算、目标前后独立窗口和单方向边缘扩展纯函数。
- `src/editor/article-renderer.ts`：文章首次只挂载目标附近真实章节，提供前后扩展与目标强制挂载控制器；目录同文件条目直接聚焦；全树预扫描改用原始字段重量，避免整节点序列化。
- `src/editor/editor.ts`：滚动到窗口边缘时按需扩展，向上补载补偿高度；精确章节定位前确保目标已挂载；显式目标独占本轮重绘，避免旧位置竞争。
- `styles.css`：新增文章窗口和前文/后文加载按钮样式。
- `tests/incremental-render.test.mjs`：新增 5 KB 窗口、边缘扩展、向上位置补偿、同文件目录直达、显式位置竞争和精确目标挂载契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/READING_JUMP_FIX.zh-CN.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步窗口架构、跳转时序和验证边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`、`main.js`：同步 1.39.9 版本、生产构建和最终安装包校验。

## 1.39.8 文章模式对齐通读渲染

- `src/editor/article-renderer.ts`、`src/editor/editor.ts`：删除文章逐帧占位、隐藏舞台、覆盖层和延迟补齐链路，直接挂载完整真实章节 DOM；保留语义位置恢复、折叠、缩略导航和行内编辑。
- `src/main.ts`、`src/article/modes.ts`：文章分页导航传递父挂载节点；旧子导图元数据缺失节点 ID 时按父导图中的子导图路径反查。
- `src/article/article-render-cache.ts`、`tests/article-render-cache.test.mjs`：移除不再使用的文章节点持久缓存及其专项测试。
- `styles.css`：移除文章骨架、占位、隐藏舞台、加载旋转和页面交换样式。
- `tests/incremental-render.test.mjs`、`tests/reading-editor-contract.test.mjs`：改为验证文章单次完整渲染、真实章节语义跳转、父级返回节点和上下文刷新边界。
- `examples/`：将归档中退化为 `#Uxxxx` 的示例路径恢复为标准 UTF-8 中文文件名。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`、`TEST_RESULTS.md`：同步重构后的架构、测试与交付状态。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.8；最终安装包 SHA-256 在打包后写入。
- `main.js`：由重构后的 TypeScript 源码重新生产构建。

## 1.39.6 快速编辑带圈序号垂直对齐

- `styles.css`：快速编辑时仅将带圈序号伪元素按现有 7px 顶部内边距向下补偿，不修改正文输入框、正文起点或水平缩进。
- `tests/article-content-block.test.mjs`：新增快速编辑样式契约，校验圆圈位移量与编辑框块级内边距一致，并禁止规则改动正文布局属性。
- `README.md`、`CHANGELOG.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步快速编辑对齐行为和维护边界。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.6，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 快速编辑待验证事项。
- `main.js`：按仓库交付规则重新执行生产构建。

## 1.39.5 带圈序号正文间距修复

- `styles.css`：缩小带圈编号圆环并调整自动模式槽内偏移，在保持正文首字与普通圆点正文对齐的同时，为圆圈和正文预留稳定间距。
- `tests/article-content-block.test.mjs`：扩展 CSS 几何契约，校验正文起点一致、圆圈右侧间距不少于 0.18em，并限制编号列偏移范围。
- `README.md`、`CHANGELOG.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步用户可见行为、维护边界和专项验证。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.5，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录浏览器几何验证、完整测试基线和 Win10 待验证事项。
- `main.js`：按仓库交付规则重新执行生产构建。

## 1.39.4 带圈序号自动缩进对齐

- `styles.css`：恢复自动对齐带圈编号的上级标题缩进，将编号槽收敛到与普通末端圆点相同的 1.25em，并在槽内微调圆圈中心；顶格模式和普通下一级文章序号保持不变。
- `tests/article-content-block.test.mjs`：新增标识列几何契约，校验圆圈中心与圆点中心误差小于 0.02em、两类正文首字起点完全一致。
- `README.md`、`CHANGELOG.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步自动对齐行为、维护边界和专项验证。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.4，并写入最终安装包 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录 Chromium 几何验证、完整测试基线和 Win10 待验证事项。
- `main.js`：按仓库交付规则重新执行生产构建。

## 1.39.3 带圈序号字体与基线统一

- `src/editor/article-renderer.ts`、`src/editor/editor.ts`：文章与通读的带圈序号不再把 Unicode 圈号直接放入伪元素，统一传递十进制索引供视觉层绘制。
- `styles.css`：全部带圈序号使用当前正文的字体和字重，以固定首行编号槽、圆环尺寸和绝对定位统一大小、基线及多行缩进；移除 Windows 符号字体回退。
- `src/import/import-export.ts`：HTML 第 1 项起统一输出 `.circled-number` 圆环，Markdown 与 Word 的无 CSS 可读表示保持兼容。
- `src/article/article-render-cache.ts`：文章渲染修订提升到 v4，使 1.39.2 的旧缓存自动失效，避免恢复旧 Unicode 标记。
- `tests/article-content-block.test.mjs`、`scripts/test.mjs`：增加统一字体、圆环、首行基线、HTML 1/51/67 项和缓存修订契约。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步显示边界与验证说明。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.3，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录验证基线与真实 Win10 手工检查项。
- `main.js`：由修复后的 TypeScript 源码重新生产构建。

## 1.39.2 末端正文带圈序号

- `src/core/model.ts`、`src/settings.ts`、`src/main.ts`：新增 `next-level` / `circled` 末端序号样式，提供全局默认、配置规范化与当前页面覆盖。
- `src/article/modes.ts`：新增 `circledNumberLabel()`，原生映射 `①–㊿`；第 51 项以后保留十进制编号，并允许带圈末端序号跨越文章标题八级边界。
- `src/editor/article-renderer.ts`、`src/editor/editor.ts`、`src/editor/editor-types.ts`、`styles.css`：在文章、通读与缓存指纹中传递带圈样式；51 以上使用 CSS 圆圈呈现。
- `src/import/import-export.ts`、`src/view.ts`：HTML 导出支持 51 以上圆圈结构，Markdown 与 Word 使用 `◯51` 可读回退，页面覆盖优先于插件设置。
- `tests/article-numbering.test.mjs`、`tests/article-content-block.test.mjs`、`scripts/test.mjs`：新增 Unicode 边界、67 个同级节点、深层结构和多格式导出专项测试。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步功能边界、导出回退、测试和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.2，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 待验证事项。
- `main.js`：由新增功能后的 TypeScript 源码重新生产构建。

## 1.39.1 深层文章编号边界修复

- `src/article/modes.ts`：集中定义八级文章编号上限；第 9 级及更深结构不再循环复用 `A.` / `（A）`，第 7、8 级字母序号超过 Z 后使用 AA、AB。
- `src/editor/editor.ts`：在文章编号设置帮助中明确八级边界与更深结构行为。
- `tests/article-numbering.test.mjs`、`scripts/test.mjs`、`package.json`：新增深层编号、无循环字母和超过 Z 唯一性专项测试，单元测试扩展至 278 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步编号边界、测试和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.1，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 待验证事项。
- `main.js`：由修复后的 TypeScript 源码重新生产构建。

## 1.39.0 文件浏览器增量筛选与文章缓存写盘合并

- `src/main.ts`：文件浏览器观察器收集新增/改路径局部根节点并去重，只在布局或筛选设置变化时完整扫描；移除仓库文件事件触发的全树刷新，并在卸载时清理待扫描状态。
- `src/article/article-render-cache.ts`：缓存持久化改为修订号单飞循环，运行中更新合并为一份后续快照；只在缓存命中改变 LRU 顺序时写入访问状态，干净卸载和重复最新命中不再写盘。
- `tests/file-explorer-filter.test.mjs`、`tests/article-render-cache.test.mjs`：增加局部扫描、禁止仓库写入触发全扫、干净刷新、LRU 跨重启与活动写入合并专项测试，单元测试扩展至 275 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步增量筛选、缓存持久化边界、测试和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.39.0，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 待验证事项。
- `main.js`：由本轮 TypeScript 源码重新生产构建。

## 1.38.9 设置串行合并与文件浏览器筛选优化

- `src/utils/coalesced-json-writer.ts`：新增通用 JSON 保存协调器，35 ms 尾随合并连续请求，严格单飞写入，并按请求版本完成或拒绝等待方。
- `src/main.ts`：所有插件设置保存改走协调器；卸载时刷新待写状态。文件浏览器 MutationObserver 仅处理相关 DOM 变化，筛选设置语义未变化时不再无条件扫描。
- `src/file-explorer-filter.ts`：新增筛选规则预编译与稳定语义签名；单次扫描复用扩展名集合、目录集合和路径规则。
- `tests/coalesced-json-writer.test.mjs`、`tests/file-explorer-filter.test.mjs`、`package.json`：增加合并、串行、失败恢复、签名归一化和插件集成契约测试，单元测试扩展至 273 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/DEVELOPMENT.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步持久化边界、筛选触发条件、性能基准和验证说明。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.9，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证、专项基准和真实 Obsidian 待验证事项。
- `main.js`：由本轮 TypeScript 源码重新生产构建。

## 1.38.8 设置分区与文章锁状态记忆

- `src/settings.ts`：一级设置分类默认全部收起，新增持久化展开列表；搜索驱动的临时展开不会污染用户记忆。“进入文章模式”增加“记住上次文章状态”。
- `src/article/display-mode.ts`：新增文章入口策略规范化与锁状态解析纯函数，支持 `locked`、`inherit`、`remember` 三种策略。
- `src/editor/editor-types.ts`、`src/editor/editor.ts`、`src/view.ts`、`src/main.ts`：在插件、视图和编辑器边界传递并保存文章模式独立锁状态，避免写回文件级 `view.readOnly`。
- `tests/display-mode.test.mjs`、`tests/settings-layout.test.mjs`、`scripts/test.mjs`：新增文章记忆策略、设置分类默认收起与持久化契约测试，单元测试扩展至 267 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步用户行为、数据边界、架构和验证说明。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.8，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Obsidian 待验证事项。
- `main.js`：由本轮 TypeScript 源码重新生产构建。

## 1.38.7 缓存恢复分帧与 hydration 线性化

- `src/editor/article-renderer.ts`：缓存预扫描不再同步恢复所有章节 HTML；恢复、净化、交互绑定和普通节点重建共用帧预算。增加单次渲染内容块 `WeakMap`，并对缓存章节的 `data-block-id` 一次建索引。
- `src/article/modes.ts`：`buildArticleNodeInfo()` 可注入主文字读取回调，文章渲染复用内容块缓存；同级标题和末端正文统计合并为一次遍历。
- `tests/article-render-cache.test.mjs`：增加缓存恢复位置、内容块 memo、主文字缓存注入和块元素索引契约测试，单元测试扩展至 265 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步缓存命中首屏、复杂度边界、验证与函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.7，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`、Codex 项目衔接页：记录完整验证和真实 Win10 大文件待验证事项。
- `main.js`：由优化后的 TypeScript 源码重新生产构建。

## 1.38.6 文章缓存线性指纹与跨平台 ZIP 适配

- `src/article/article-render-cache.ts`：新增只覆盖节点自身与渲染上下文的文章节点指纹，避免递归序列化后代；缓存修订提升到 v2，修复启动预载 LRU 顺序，并使用无原型节点表。
- `src/editor/article-renderer.ts`：节点缓存改用局部指纹，文档摘要聚合现有节点指纹，缓存路径比较统一规范化 Windows/Unix 分隔符。
- `tests/article-render-cache.test.mjs`：新增后代编辑不使祖先失效、当前节点/上下文变化必须失效、重启预载后正确淘汰最旧条目的专项测试。
- `AGENTS.md`、`docs/DEVELOPMENT.md`：补充 Windows ZIP 的 `#Uxxxx` + `0x7075` 在 Linux 下恢复与标准 UTF-8 bit 11 重打包规则。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步缓存复杂度、复用边界、测试与函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.6，并在最终安装包生成后写入 SHA-256。
- `TEST_RESULTS.md`：记录完整验证、专项基准和真实 Win10 大文件待验证事项。
- `main.js`：由优化后的 TypeScript 源码重新生产构建。

## 1.38.5 文章节点级持久缓存

- `src/article/article-render-cache.ts`：新增稳定指纹、缓存结构校验、内存 LRU、插件私有 JSON 预载与串行防抖写盘；支持文件删除清理和重命名迁移。
- `src/editor/article-renderer.ts`：按文章展示签名和节点指纹恢复未变化节点静态 HTML，分帧重新绑定文字、图片、表格和题目交互；只重新渲染变化节点，代码块节点保持安全重建。
- `src/editor/editor-types.ts`、`src/editor/editor.ts`、`src/view.ts`、`src/main.ts`：在插件、视图和编辑器边界传递同步预载快照与完成回调，并在插件启动、卸载和文件生命周期中管理缓存。
- `tests/article-render-cache.test.mjs`、`tests/incremental-render.test.mjs`、`package.json`：新增指纹、预载、持久化和渲染契约专项测试，单元测试扩展至 263 项。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步缓存边界、降级策略和人工验证步骤。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.5，并在最终打包后写入安装包 SHA-256。
- `TEST_RESULTS.md`、`MODIFIED_FILES.md`：记录完整验证与真实 Win10 大文件待验证事项。
- `main.js`：由缓存实现后的 TypeScript 源码重新生产构建。

## 1.38.4 渐进文章加载期间滚动位置保护

- `src/editor/editor.ts`：增加渐进文章视口所有权状态；滚轮、触摸、指针和翻页键输入后清除旧待恢复位置，后续批次及完成回调不再写回打开瞬间的滚动快照。未发生用户导航时继续保留原有语义阅读位置恢复。
- `tests/incremental-render.test.mjs`：新增用户接管视口专项回归，并扩展渐进文章契约检查。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步滚动控制边界、人工验证步骤和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.4，并写入本轮安装包 SHA-256。
- `TEST_RESULTS.md`、`MODIFIED_FILES.md`：记录完整验证和真实 Obsidian 待验证事项。
- `main.js`：由修复后的 TypeScript 源码重新生产构建。

## 1.38.3 大型文章打开与深层导图布局性能优化

- `src/render/layout.ts`：在单次布局内缓存节点子树高度，消除深层链式结构的重复递归计算，同时保持原有位置、碰撞处理与布局语义。
- `src/editor/editor.ts`：文章、大纲和通读模式初始化时不再预计算完整导图布局；文章首批正文完成后立即显示，后续内容继续分帧填充，并完善部分页面的视口保持与取消清理。
- `src/editor/article-renderer.ts`：新增首批内容回调，收紧首帧预算并提高后续批次吞吐，使用户无需等待全文 DOM 构建完成即可开始阅读。
- `tests/incremental-render.test.mjs`、`scripts/test.mjs`：增加按需布局、首批显示及 1200 层深链布局性能回归测试。
- `README.md`、`CHANGELOG.md`、`docs/ARCHITECTURE.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`docs/FUNCTION_REFERENCE.md`：同步性能边界、渲染流程、测试方法和函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.38.3，并写入本轮安装包 SHA-256。
- `TEST_RESULTS.md`、`MODIFIED_FILES.md`：记录完整验证、开发基准和真实 Obsidian 待验证项。
- `main.js`：由优化后的 TypeScript 源码重新生产构建。

## 1.37.1 图片粘贴目标与节点弹窗剪贴板支持

- `src/editor/editor.ts`：导图和大纲图片粘贴严格使用当前选中节点；文章与通读继续按实际内容块目标插入。完整节点编辑器新增剪贴板读取、粘贴事件、图片块替换与自动上传排程。
- `tests/article-content-block.test.mjs`：增加旧焦点隔离、弹窗按钮、直接粘贴、仓库保存和精确节点自动上传专项契约。
- `examples/`：恢复规范 UTF-8 中文示例路径。
- 文档、版本元数据和生产 `main.js` 同步更新到 1.37.1。

## 1.37.0 图片诊断、粘贴目标与自动上传安全合并

- `src/editor/image-failure-view.ts`：新增统一失败地址卡片、候选源收集和复制地址操作。
- `src/editor/editor.ts`、`src/editor/article-renderer.ts`、`src/editor/outline-renderer.ts`、`styles.css`：四种模式显示失败地址；粘贴开始前锁定节点/内容块；移除文章前后页按钮悬浮提示属性。
- `src/core/model.ts`、`src/main.ts`、`src/view.ts`：新增 ID 级图片上传补丁；自动上传按文件批处理与串行，只向最新文档合并图片字段并显示汇总通知。
- `tests/image-source-candidates.test.mjs`、`tests/image-layout.test.mjs`、`tests/article-content-block.test.mjs`、`tests/reading-editor-contract.test.mjs`：增加补丁保留用户编辑、失败地址、粘贴目标、批处理和无悬浮提示专项测试。
- `examples/`：将编码占位文件名恢复为规范 UTF-8 中文路径。
- 文档、版本元数据和生产 `main.js` 同步更新到 1.37.0。

## 1.35.3 图床延迟删除与文章加载骨架

- `src/settings.ts`：移除独立删除请求头配置，增加持久化远程删除队列数据结构；上传与删除共用图床请求头。
- `src/main.ts`：连通性测试图片和最后引用远程图片统一进入 1 分钟删除队列；到期前重新保存并扫描所有导图，撤销恢复时取消删除；插件重启后恢复待执行任务。
- `src/editor/editor.ts`、`styles.css`：文章首次加载骨架按当前视图高度动态增加行数，并横向铺满文章窗口。
- `tests/image-layout.test.mjs`、`tests/incremental-render.test.mjs`：增加共用请求头、延迟删除、撤销保护、测试图清理和视口骨架专项契约。
- `README.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/ARCHITECTURE.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/TESTING.md`、`CHANGELOG.md`、`TEST_RESULTS.md`：同步行为、数据边界和验证记录。

## 1.35.3 完整节点加粗快捷键与导入提示

- `src/editor/node-rich-text-editor.ts`：为完整节点编辑器的格式快捷键增加 `event.code` 匹配和 `keydown` / `beforeinput` 去重，避免 `Ctrl/Cmd+B` 加粗后被浏览器格式输入事件立即切换回去。
- `src/editor/editor-modals.ts`：导入入口提示改用“思维导图”通用称呼，保留 `.xmind` 解析能力。
- `tests/image-layout.test.mjs`、`tests/import-mode.test.mjs`：增加加粗双事件去重和导入提示品牌隐藏专项测试。
- `README.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`、`CHANGELOG.md`、`TEST_RESULTS.md`：同步行为、测试和交付记录。


## 1.35.3 图片布局、图床去重与编辑体验

- `src/core/model.ts`、`src/render/layout.ts`、`src/editor/editor.ts`、`src/editor/outline-renderer.ts`、`src/editor/article-renderer.ts`、`styles.css`：新增图片同行/独占一行字段、编辑入口和多模式布局；文章与大纲为连续同行图片创建 flex 行，修复小图仍各占一行；缩小图片预览窗口；无启用图床时隐藏图片右键“上传到图床”。
- `src/utils/image-host.ts`、`src/main.ts`、`src/settings.ts`、`src/editor/node-image-actions.ts`：增加 SHA-256 上传缓存、删除令牌解析、可配置删除 API；图床预设收敛为默认 Zipline、ImgBB、Freeimage.host 和自定义，旧 Zipline v3/v4 配置自动迁移；Zipline 删除复用当前 Token，并为历史图片回查文件 ID。
- `src/editor/node-rich-text-editor.ts`、`src/editor/editor.ts`：完整节点编辑器接入加粗、斜体、下划线和文字颜色快捷键，并通过窗口捕获层避免 Obsidian 抢占加粗/颜色组合键。
- `tests/image-host.test.mjs`、`tests/image-layout.test.mjs`、`tests/article-content-block.test.mjs`：增加哈希、删除模板、图床预设、同行图片 flex 行、快捷键与预览尺寸专项测试。
- `README.md`、`docs/DATA_MODEL.md`、`docs/SPECIAL_FEATURES.md`、`docs/ARCHITECTURE.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/TESTING.md`：同步数据边界、使用方式和删除安全规则。

## 1.35.3 截图覆盖层运行时修复

- `src/utils/desktop-capture.ts`：Windows 抓屏改为 DPI 感知的完整虚拟桌面截图并记录所有显示器边界；覆盖层增加“全部屏幕 / 屏幕 N”切换、按比例显示和原始像素导出映射；几何图形、画笔、箭头、文字与序号增加颜色、线宽、形状和填充样式，文字输入修复为延迟稳定聚焦并支持中文组合输入；箭头增加直线样式；屏幕名称不再读取可能乱码的 PowerShell 标签；删除固定截图动作及相关原生窗口代码；默认选区改为当前屏幕完整范围；截图并识别模式保留完整工具栏与样式栏 DOM，仅以完全透明和禁用指针事件隐藏；倒计时保留原有小号胶囊样式和“秒后自动识别”文案，仅将小数秒改为整数 3、2、1；悬停边框/拖动条/缩放手柄时暂停，离开或重新框选后重启，并增加宿主窗口与 iframe 窗口双层 Esc 取消；选区保持圆角柔和边缘。
- `src/editor/editor.ts`：拆分截图与截图并识别链路，冻结节点/内容块插入目标，增加顶部工具栏和节点右键入口，并复用现有图片识别确认流程。
- `src/editor/editor-types.ts`、`src/view.ts`、`src/main.ts`：将普通截图与截图并识别模式参数传递到桌面覆盖层，保持快捷键、命令和桌面 API 延迟加载。
- `src/settings.ts`：将“截图与识别”调整为独立一级分类，增加两套可录制快捷键及旧分类迁移，移除“截图后自动识图”设置。
- `tests/ai.test.mjs`、`tests/image-recognition.test.mjs`：增加分类、独立命令、快捷键、右键菜单、实际生成覆盖层 HTML、脚本语法、虚拟桌面与多显示器元数据、DPI 感知、原始像素映射、样式工具栏、画布内文字输入、默认整屏选区、删除固定动作、文字输入焦点、箭头/直线样式、屏幕标签编码、透明完整控件树、整数倒计时、边框暂停状态机、iframe/宿主双层 Esc 和禁止静默系统截图回退的专项测试。
- `README.md`、`AGENTS.md`、`docs/AI_ASSISTANT.zh-CN.md`、`docs/ARCHITECTURE.md`、`docs/IMAGE_RECOGNITION_SCREENSHOT.zh-CN.md`、`docs/PROJECT_GUIDE.zh-CN.md`、`docs/SPECIAL_FEATURES.md`、`docs/TESTING.md`：同步功能边界、架构、测试和人工验证要求。
- `docs/FUNCTION_REFERENCE.md`：重新生成函数参考。
- `package.json`、`package-lock.json`、`manifest.json`、`versions.json`、`update.json`：统一版本元数据为 1.35.3。
- `examples/中国文学示例.mindmap`、`examples/古诗.mindmap`、`examples/MindMap Assets/古诗/唐诗.mindmap`：恢复源码包缺失的规范 UTF-8 中文示例及父子导图路径。
- `examples/中国文学示例.mindmap`、`examples/古诗.mindmap`、`examples/MindMap Assets/古诗/唐诗.mindmap`：恢复仓库规范示例路径，保证中文路径可读并参与 ZIP UTF-8 验证。
- `main.js`：从修复后的 TypeScript 源码重新生产构建。
- `AGENTS.md`、`docs/PROJECT_GUIDE.zh-CN.md`：将 Codex 交接包外部文件名规则收紧为严格的 `Codex-<版本>-handoff-<六位后缀>.zip`，不得包含项目名。
