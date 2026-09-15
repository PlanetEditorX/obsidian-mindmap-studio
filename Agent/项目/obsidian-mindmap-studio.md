# obsidian-mindmap-studio 项目交接

- 插件：MindMap Studio（Obsidian 本地优先 .mindmap 导图，含导图/大纲/文章/通读模式、全局搜索、图床、AI 助手与桌面截图链路）。
- 版本基线：1.51.5（线上 1.51.0 已发布；工作区提交基线 v1.51.3：节点锚点来源变更恢复；本轮工作区：子导图提取/合并迁移本地图片与上传文件（含 60 秒延迟回收）＋截图标注工具增强（箭头/线宽/序号/橡皮擦））。
- 仓库规则：见根目录 `AGENTS.md`；每轮代码交付三份 ZIP（源码 / 安装 / Agent 交接）共用同一六位后缀；验证入口 `npm run verify`。

## 当前状态（本轮：导图行内编辑提交后键盘失焦修复）

- 行内编辑回车提交后键盘捷径失效（应用户日志反馈）：导图节点行内编辑完成按回车/Esc 提交时，`editor.blur()` 无 `relatedTarget`，DOM 焦点落到 `<body>`；而全局 `handleKeydown` 以 capture 绑定在 `rootEl` 上，焦点在 `body`（rootEl 之外）时后续按键根本不进入 `rootEl`，表现为“回车无反应、像失焦、节点外残留蓝色选中遮罩、Tab 原生跳到第一个兄弟节点内容块拖动悬浮图标、再按 Tab/回车又回到原节点执行对应操作”。修复：在 `beginInlineEdit` 的失焦提交清理末尾，当 `currentMode === "mindmap"` 且提交为程序性失焦（`!related`）时调用 `rootEl.focus({ preventScroll: true })` 把焦点拉回编辑器根，global mind-map 快捷键恢复；真实点击（带 `relatedTarget`）不回抢焦点。契约测试 `tests/node-creation-focus.test.mjs` 新增“Enter/Escape commit restores DOM focus to the mind-map editor root”。
- 截图标注工具增强（应用户 5 点反馈，均在 `desktop-capture.ts` 内嵌编辑器）：(1) 箭头头部从圆形改为清晰三角尖——杆状路径在箭头基底 `bx,by` 处截断（`lineCap='butt'`），头部用填充三角形画到尖点，不再被圆头线段遮成圆点；(2) 箭头样式组新增“渐粗”喇叭形（`line-style=tapered`），自尾端到头部由细到粗的实心锥体，另保留原“箭头/直线”；(3) 线宽从“细/中/粗”三档改为 1~20 滑条（`#widthRange` + 数值标签），画布箭头/文字/矩形/椭圆/笔刷共用；(4) 序号数字 `textBaseline='middle'` 基础上向下微移 1.5px 实现光学居中；(5) 马赛克与橡皮擦大小跟随线宽滑条（此前橡皮擦固定、马赛克固定 32，且样式栏对马赛克/橡皮擦工具不显示，现 `setTool` 把二者纳入样式栏显示、`mosaicAt` size=strokeWidth*3、橡皮擦 lineWidth=max(8,strokeWidth*3)）。契约测试 `image-recognition.test.mjs` 新增“sharp tapered arrow, 1-20 width slider and resizable mosaic/eraser”。
- 子导图提取/合并迁移附件（应用户反馈）：“提取为子导图”与“合并回去”之前，导图引用的本地图片与上传文件都不迁移，文件仍留在原导图 MindMap Assets、引用原样保留，子导图依赖父导图附件。本轮修复：新增纯逻辑助手 `migrateLocalAssetBlocks()`（core/model，遍历内容块，把本地图片块与文件块迁移到新仓库路径并改写权威引用，`localSource`/`source` 同步、文件改 `source`，远程图床 URL 与 `remoteSources` 不迁移），并由 main.ts 的 `migrateSubmapAssets()` 复用 `copyImportedMarkdownImages` 的命名去重（重名追加序号）+ 批量复制（串行复制、全部成功后再按需回收）。提取时（`extractToSubmap`）：从父导图复制到子导图自己的 MindMap Assets 并改写子导图引用，父导图原图保留，`main.js` 重写后写回子导图文件，子导图完全自包含。合并时（`mergeFromSubmap`）：把子导图引用的本地图片/文件复制回父导图自己的 MindMap Assets 并改写引用，随后删除子导图时旧附件一并回收，父导图保持独立。专项测试 `tests/submap-asset-migration.test.mjs` 锁定“本地图片+文件+远程图混合节点正确迁移、远程 URL 不受影响、同路径/空解析跳过”。
- 子导图合并回父导图（应用户反馈）：合并完成后若子导图资源目录已因附件迁出+回收而清空，调用 `cleanupEmptySubmapAssetsFolder(submapFile)` 在目录空时才删除，非空目录保留、失败静默；重名附件序号改为连字符（`a-2.png`）而非空格（`a 2.png`，提取后 1 分钟内合并回主图时主图原图未回收会触发撞名所致）。
- 替换图片后阅读位置乱跳（多轮定位）：第一层 mutate(null) 挡 mutate 自身恢复（8b1b9ff）；第二层 suppressNextArticleSemanticRestore 跳过语义恢复走像素恢复（3173796）；第三、四层（v1.51.2/1.51.4）在 renderWindow 内取 previousScroll.top 作为像素目标、并以图片块所在节点为锚——但**都拿错了目标**：文章窗口重渲染先把 scrollHeight 压到极小、浏览器把 scrollTop 钳制到顶部，renderWindow 内读取的只是塌缩后的值（日志：原 20955 → 重建后 2677）。本轮（v1.51.5 工作区）改为在来源变更入口 `applyImagePreviewSourceChange` → `captureArticleNodeAnchor(nodeId)` **重建发生前**捕获真实 scrollTop，renderWindow 以它为 `pendingArticlePixelRestoreTop` 硬钉目标，warmup 按 `Math.min(target, maxScroll)` 分帧爬升，内容补齐后精确回位；wheel/pointerdown 立即接管。契约测试锁定“入口捕获真实值、非塌缩值”。
- 教训：验证构建产物必须搜 esbuild 编译形式（`void 0` 而非 `undefined`），且 Select-String 勿用 -First 截断；GitHub Release 产物只含已提交代码，工作区修复需提交发布后才能通过插件更新获取；overflow-anchor:none 已存在时不要臆断浏览器锚定参与补偿。
- 预览弹窗“本地图片”来源行右键新增“在文件资源管理器中打开”（位于“更新替换”之后）：`ImagePreviewSourceActions` 新增可选 `revealLocal` 回调，editor 注入 `onRevealFileInSystemExplorer`；actions 对象补 `ImagePreviewSourceActions` 显式类型标注。file-block.test.mjs 新增契约锁定来源跟随与 reveal 入口。

- 截图插入链路优化：`captureScreenshot` 原先独立实现插入——整份 `cloneDocument` + `replaceDocumentFromExternalEdit` 替换文档、`focusNodeById` 强制聚焦目标节点、`onSavePastedImage` 落盘后才校验目标节点（失败时孤儿文件无提示）。现重构出共用方法 `insertImageBlockToNode()`（落盘 → mutate 插入 → 自动上传排程 → 通知），截图、右键“插入图片”、粘贴图片三条入口全部收敛：截图插入改走统一 mutate 链路（保留撤销与阅读位置记忆，不再整份替换文档、不再强制聚焦拉走阅读位置、不再丢失多选状态），目标节点消失时统一提示含落盘路径。契约测试 `image-layout.test.mjs` 新增“screenshot, right-click image picker and paste share one insert chain”。
- 阅读进度丢失修复（应用户日志反馈）：文章/通读模式下翻到最后关闭 Obsidian，重开后停在文档标题。根因有两层：(1) 初次挂载时文章族上下文未加载，`getEditorOptions` 的 `readingHomePath` 回退为当前文件自身，读到的持久化位置键与滚动写入的族首键不一致，初始无位置可恢复；(2) 族上下文异步刷新完成后的 `setOptions` 恢复优先级是 `preferred → rendered → remembered`，此时 rendered 恒为“当前渲染位置”（标题/骨架），remembered（真实上次阅读位置）永远被遮蔽。修复：新增一次性授权 `initialReadingLocationRestorePending`（编辑器挂载与文件切换时对非导图模式置位），首次族上下文刷新时同文件的记忆位置优先于 rendered（`normalizeReadingLocation(...)?.filePath === currentFilePath` 才启用，目录落地页与导图模式排除）；用户滚动接管或完成一次恢复尝试即失效。契约测试 `reading-editor-contract.test.mjs` 新增“first family refresh after opening a file prefers the remembered reading position”，并更新原“article option refresh”断言适配新选择链。
- 右键插入图片（应用户反馈）：画布/大纲/文章/通读模式的节点右键菜单此前只有截图、上传文件，没有本地图片入口；新增“插入图片”（有锚点块时显示“在此块后插入图片”）。`insertImageToNode()` 复用既有链路：`selectImageFile()` 系统文件选择器 → `onSavePastedImage` 落盘附件目录 → `mutateWithoutArticleContext` 插入图片块（锚点后或末尾）→ `onScheduleAutoUpload` 自动上传排程；SVG 扩展名正确保留。契约测试 `image-layout.test.mjs` 新增“node context menu offers local image insertion reusing the paste save chain”。
- 交接体系更名：目录 `Codex/` → `Agent/`（git mv 保留历史），交接文档精简为当前状态 / 验证基线 / 待验证 / 下一步四节，历史交付包清单全部删除（历史版本以 GitHub Release 为准）；AGENTS.md、docs/DEVELOPMENT.md、docs/PROJECT_GUIDE.zh-CN.md 同步改名，交接 ZIP 外部命名改为 `Agent-<版本>-handoff-<六位后缀>.zip`、内部根目录固定为 `Agent/`。
- 近期已发布（v1.50.1 ~ v1.50.3，均已带契约测试并通过 verify）：编辑弹窗图片块未启用图床时隐藏“选择文件并上传”“上传当前图片”按钮；剪贴板按钮 SVG 兜底（`parseDataUrlImageFromHtml()` 从 text/html 提取内嵌 data URI，绕过 Chromium read() 白名单）；“尚未选择图片”占位双击选图（复用“保存到仓库”本地链路，`is-empty` 样式 + title 提示）。
- 上一轮（已随 v1.49.9/v1.50.0 发布）：Enter 创建节点失焦修复（保护窗口 50ms → 220ms，blur 拉回仅限程序性失焦）+ `bringNodeIntoView()` 新节点最小平移滚入视口；1.49.8 节点文件上传（右键/拖拽上传、五面统一文件卡片、60 秒延迟回收删除与撤销取消）。

## 验证基线

- `npm run verify` 本机完整通过：`test:unit` 433/433（含新增行内编辑提交失焦回拉契约测试 1 条；下行的小计沿用既有计数值）；`test:regression` 全部通过；`test:docs` 全部通过；`test:repo` 通过；production esbuild 通过。
- 详细数据见根目录 `TEST_RESULTS.md`。

## 待验证事项（需真实 Obsidian 桌面端手工冒烟）

- 行内编辑提交后键盘恢复：导图模式下双击节点编辑文字 → 回车提交 → 再按回车应新增兄弟节点、按 Tab 应新增子节点（不再“无反应/焦点丢失/原生 Tab 跳到拖动图标”）；按 Esc 取消后同样恢复；编辑后点击空白或其它节点提交不应被强行拉回编辑框。
- 提取为子导图：子树内的本地图片与上传文件被复制到子导图自己的 MindMap Assets；打开子导图图片/文件正常显示；父导图原图与图片不受影响。
- 合并回父导图：子导图引用的本地图片/文件被复制回父导图 Mind Map Assets 并正常显示；子导图及其旧附件被回收后父导图依然自包含。
- 重名附件迁移后在目标导图资源目录追加序号，不互相覆盖。
- 截图标注（新）：至少在 Windows 桌面上截图，逐项确认——(a) 箭头头部为清晰三角尖（非圆形）；样式栏“箭头”组下拉选“渐粗”得到尾端到头部由细到粗的喇叭形箭头、选“直线”为纯直线；(b) 样式栏线宽滑条 1~20 拖动时箭头/文字/矩形/椭圆/笔刷随之增粗或变细；(c) 序号工具点出数字在圆圈内视觉居中（不再偏上）；(d) 选中马赛克/橡皮擦工具时样式栏带线宽滑条，拖动可改变马赛克方块与橡皮擦圆头大小。

- 替换本地图片：立即显示新图、来源列表只保留“本地图片”；**阅读位置完全不动**（以图片块所在节点为锚，替换/删除来源/上传后均保持同一视口偏移，不跳位）；60 秒后旧文件进入系统回收站；替换后立即撤销则恢复旧图并取消回收。
- 预览弹窗“本地图片”来源行右键“在文件资源管理器中打开”打开目录并选中文件。
- 图片块右键“在文件资源管理器中显示”打开目录并选中文件；预览来源栏与设置项显示“本地图片”。
- 阅读进度恢复：文章/通读模式翻到中间或末尾 → 关闭 Obsidian → 重新打开同一文件，应自动滚回上次阅读位置（首次族上下文刷新后约 1~2 秒内完成）；用户打开后立即滚动则完全接管，不会被记忆位置拉走。
- 节点右键 →“插入图片”弹出文件选择框，选图后在段落/块后正确插入并显示；画布模式同样可用；开启自动上传时插入后自动排程上传；SVG 文件可插入并正常渲染。

## 下一步建议

- 文件块可选增强：右键菜单“在系统中显示/复制路径”；大量附件时的资源目录清理入口。
- 编辑器侧优化：把 `documentSnapshotJson` 失效与 `nodeTreeIndex` 重建收拢进 `mutate()` 单一入口。
- 编辑器拆分剩余批次（题目系统流程、行内编辑深化）收益递减，按需推进。

## 交付说明

- 三份 ZIP 均输出到仓库父目录 `D:\Downloads`，外部文件名：`obsidian-mindmap-studio-<版本>-<后缀>.zip`、`mindmap-studio-<版本>-test-<后缀>.zip`、`Agent-<版本>-handoff-<后缀>.zip`（内部根目录 `Agent/`）。
- 历史交付包记录已清理；历史版本以 GitHub Release 发布为准，本地交付 ZIP 见 `D:\Downloads`。
- 交付约束：沟通说明与中文 Git 提交说明中**不得**再写“- main.js 已重建。”这条；main.js 由 `npm run verify` 的 build 自动重建，交付时不要单独列出。
