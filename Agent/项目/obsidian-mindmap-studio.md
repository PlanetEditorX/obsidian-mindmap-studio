# obsidian-mindmap-studio 项目交接

- 插件：MindMap Studio（Obsidian 本地优先 .mindmap 导图，含导图/大纲/文章/通读模式、全局搜索、图床、AI 助手与桌面截图链路）。
- 版本基线：线上已发布 v1.54.2（提交 `d2f14d6`）；本轮工作区（未提交）为断行规则调整（首个等号留在首行），发布后应为 v1.54.3。
- 仓库规则：见根目录 `AGENTS.md`；每轮代码交付三份 ZIP（源码 / 安装 / Agent 交接）共用同一六位后缀；验证入口 `npm run verify`。

## 当前状态（本轮：断行时首个顶层 `=` 留在首行）

- 用户反馈（1.54.2 实测）：换行已生效，但首行只剩 `R`，希望第一个 `=` 不要换行。
- 修复（`src/core/latex.ts`）：断行时把首个片段与紧跟的第一个顶层 `=` 合并为首行，之后每个顶层 `=` 才另起一行——`a = b = c` → `\begin{aligned} a = b \\ & = c \end{aligned}`；因此**少于两个顶层 `=` 不再断行**（如 `a = b` 返回 `null`），避免首行只剩左侧式子。整体 `\boxed{...}` 的内层递归同样遵循该规则。
- 测试：`tests/latex.test.mjs` 三条期望同步更新（首行保留首个等号、`a = b` 返回 `null`、`\text{甲=乙} = x = y` 与 `\boxed{a = b = c}` 的新输出）。
- 文档：`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md` 记录「首个顶层 `=` 留在首行、至少两个顶层 `=` 才断行」，`docs/FUNCTION_REFERENCE.md` 重新生成。

- 上一轮（1.54.2，已发布；修复长公式自动换行未生效——`max-width: 100%` 夹取导致量不出溢出）
- 用户反馈（1.54.1 实测）：长公式仍然没有换行。排查确认代码路径已生效（已安装 `main.js` 含 `is-wrapped`），失效点是**测量**：行内公式容器 `.mms-node-math:not(.is-display)` 自身带 `max-width: 100%`，超长公式的盒子被夹在容器宽度上，`getBoundingClientRect().width` 永远等于容器宽度，于是「是否超宽」判定恒为否，直接跳过替换。
- 修复（`src/editor/rich-text-dom.ts`）：新增 `measureUnclampedWidth()`——量宽度前临时给公式容器及其内部 `mjx-container` 打 `max-width: none !important`，量完立即还原（保留原有内联值与优先级），因此不改变公式最终排版；`wrapOverflowingInlineMath()` 改用该真实宽度判定，并保留 `math.scrollWidth` 作为溢出兜底信号。
- 真机外验证（本地 HTTP + 真实 MathJax v3 + 复刻插件公式 CSS，420px 容器）：`available=420`、`clampedWidth=420`（证实旧判定必然失败）、`scrollWidth=613`、`unclampedWidth=613`（新判定可识别溢出）；断行源码 `\begin{aligned}` 渲染为 4 行、宽 255px、高 111px，截图确认原公式溢出边框而断行版本完整落在框内。
- 测试与文档：`tests/question.test.mjs` 契约改为断言 `measureUnclampedWidth()` 与 `max-width: none !important` 的解除夹取路径；`docs/ARCHITECTURE.md`、`docs/DEVELOPMENT.md` 明确「判断超宽前必须先解除 `max-width: 100%` 夹取」，`docs/FUNCTION_REFERENCE.md` 重新生成。
- 上一轮（1.54.1，已发布）：长行内公式按容器宽度自动换行 + 公式编辑器「方框」。
- 断行纯函数（`src/core/latex.ts`）：`wrapLatexForLineBreaks(source)` 只在顶层 `=` 处断行并输出 `\begin{aligned} a \\ & = b \end{aligned}`；花括号、转义字符（`\{`、`\\`）、`\text{}` 内等号、`\left/\right` 成对定界符与已有 `\begin{}` 环境一律不拆（`\left/\right` 跨行会 unbalanced 报错，直接放弃断行）；源码整体是 `\boxed{...}` 时递归断行内层并保留方框；不可断行返回 `null`。辅助函数 `boxedContent()`、`splitLatexAtTopLevelRelation()`。
- 渲染自动换行（`src/editor/rich-text-dom.ts`）：`renderRichTextRuns()` 挂载行内公式后调用 `wrapOverflowingInlineMath()`——源码长度 ≥ 40 才测量（避免为短公式强制同步布局），容器 `clientWidth` 已知且公式真实宽度超宽时，用断行源码重新 `renderMath(..., false)` 并 `replaceWith`，打上 `is-wrapped`。导图节点（`.mmc-node-text`，宽度自适应内容）、编辑态与容器宽度未知的预览保持单行；断行后渲染失败保留原公式。全流程同步执行，不引入异步重排，避免再次扰动文章模式补载/锚点体系。
- 公式编辑器「方框」（`src/editor/editor-modals.ts`）：`FormulaEditModal` 常用结构面板新增「方框」按钮——有选区包住选区；无选区包住整条公式；源码为空时插入 `\boxed{}` 并把光标放进花括号内。
- 测试：`tests/latex.test.mjs` 新增 3 条（顶层等号断行与 aligned 输出、花括号/转义/`\begin{}`/`\left\right` 保持不拆、`\boxed{}` 内层断行）；`tests/question.test.mjs` 新增 1 条契约（方框按钮写入行为 + 渲染层按宽度换行、跳过导图节点与编辑态）。
- 文档：`docs/ARCHITECTURE.md`（latex.ts / rich-text-dom.ts / 公式编辑器三条）、`docs/DEVELOPMENT.md`（LaTeX 维护规则补充方框与断行边界）、`docs/FUNCTION_REFERENCE.md` 重新生成。

- 上一轮（1.54.0，已发布；重锚跟随最后一次应用的语义锚点）：根因（日志 `mu9ofat9-7h12`，1.53.9）：一次右键「在上方插入文字」在 12ms 内触发了 3 次窗口重建，restore token 26/27 最终把视口锚在 `n_msd4rorv_9b9ba5q`（viewportRatio 0.573），此后 warmup 的 `holdArticleAnchor` 已把它稳定钉在 targetTop 534.46；但 6 秒后 `window-warmup-complete` 的 `reapplyArticleAnchor()` 读到的却是 token 24/25 留下的**过期**锚点 `n_msd4rorw_37ml8gm`，于是 28.676 把视口强行移动 **2017px** 去把那个旧节点放到 35% 处——补载期间已经稳定的视口被重锚自己拽走。
- 为什么过期：`pendingArticleAnchorLocation` 只在 `renderWindow` 里赋值（`const location = latestRequestedLocation ?? previousLocation ?? rebuildLocation ?? this.lastReadingLocation`），而更新的那次恢复是从其它入口（如 `setDisplayMode`）进来的，没有更新该字段。
- 修复（`editor.ts`）：在 `beginReadingLocationRestore()`（所有恢复应用的唯一漏斗，每次应用前都会记 `restore-transaction-start`）里补 `if (mode === "article") this.pendingArticleAnchorLocation = location;`，让重锚目标始终等于最后一次真正应用的语义位置。补载期间没有其它恢复入口，行为与之前一致；只有出现"多次重建 / 多入口恢复"时不再取到旧锚点。
- 契约测试：`tests/reading-editor-contract.test.mjs` 在「warmup 完成后重锚」用例里新增断言——`beginReadingLocationRestore` 必须为 article 模式记录锚点，且必须发生在 `restore-transaction-start` 之前。

- 上一轮（1.53.9，已发布）：逐帧锚点保持 `holdArticleAnchor()` / `stopArticleAnchorHold()` + `articleAnchorHoldFrame`，在 warmup 结束后按语义锚点每帧校正 `scrollTop`，直到「窗口补载完整 + 连续 30 帧稳定」或 360 帧兜底；wheel / pointerdown / touchstart / 切换模式立即释放。`reapplyArticleAnchor()` 接入该保持。
- 上上轮（1.53.8，已发布）：`loadArticleChunkBefore()` 向前补载按参照节点（语义锚点 → 窗口最前节点）的屏幕位移补偿，替代只按 `scrollHeight - previousHeight` 的差值补偿（1.53.7 实测前文插入 13788.9px 只补 10057.6px，少补 3731px）；`articlePrependAnchor()` 负责解析参照节点。

- 上一轮（表格单元格 LaTeX 公式可解析渲染）：
  - 表格单元格 LaTeX 渲染（`rich-text-dom.ts`）：表格渲染统一走 `renderInlineMarkdown`，此前末参 `latex=false` 关闭了公式识别，导致表格里的 `$...$`/`$$...$$` 不解析。现改为 `latex=true`，表格（导图画布、文章、大纲三种渲染器）单元格内 LaTeX 公式正常渲染为 MathJax；`markdownInlineToRichText` 不吞 `$` 分隔符，与 `splitLatexText` 兼容；单个孤立 `$5` 等无闭合符号仍按纯文本，不误判为公式。
  - 回归契约 `scripts/test.mjs` 新增断言：`renderInlineMarkdown` 必须以 `latex=true` 调用 `renderRichTextRuns`。
  - 公式整体放大：`.mms-node-math` 默认 1.2 倍（`--mms-math-scale` 可调），缓解嵌套分数过度缩小。
  - 图片默认加载优先级：手动选择的默认来源（`sourcePriority`）最高；未手动选择时本地图片优先，本地不存在才按图床顺序（`imageSourceCandidates` 本地候选 `hostRank` 由最大值改为 -1）。
  - 更早（已提交）：焦点位置记忆 `focusAnchorNodeId`（`captureCurrentLocation` 与 `articleRendererOptions.selectedId` 两处 `selectedId || focusAnchorNodeId` 兜底）；图片预览失效源自动回退；删除图片本地副本独立回收。

- 第二轮反馈修复（应用户实测反馈）：
  - 公式按钮“无任何反应”根因：`node-edit-modal.ts` 中 `new FormulaEditModal(...)` 只构造未调用 `.open()`，Obsidian 的 Modal 必须 `.open()` 才显示。已在构造末尾补 `).open()`。契约测试新增断言公式弹窗会被打开。
  - 文章“右键在上方插入文字”出现“文本框闪现→图片消失→数秒后文本框消失、图片复现”的回退：根因是 `insertArticleTextBlockBefore` 用了默认 `mutate(action, undefined, "structure")`，触发跨文件文章族异步重建从陈旧快照重渲染。已改为 `mutateWithoutArticleContext`（影响级别 “none”，仅改当前页正文、走统一历史/保存），并把聚焦延后到 `window.requestAnimationFrame` 再 `beginInlineEdit(新块, true)`——与已验证可用的“在此块后插入文字”（`insertTextBlock`/`insertTextBlockAfter`）完全一致。
  - 按用户要求去掉图片块的悬停“+”按钮（“图片+ 去除”）：删除 `article-renderer.ts` 中 `.mms-article-insert-above` 按钮创建与 `ArticleRendererOptions.insertTextBlockBefore` 字段、`assetRendererOptions()` 里的回调注入，及 `styles.css` 的 `.mms-article-insert-above` 样式；保留图片右键“在上方插入文字”。契约测试改为断言悬停按钮已移除且 renderer 不再携带该回调。
  - 前一轮基础：叶渲染条件由 `if (firstTextBlock?.text.trim())` 改为 `if (firstTextBlock)`，使纯图片节点的空首 text 块渲染为可编辑叶子段落（内容自由占位仍由 `else if blocks.length===0` 独占）。

- 前一轮两个新功能（已交付）：
  - 导图“编辑节点内容”弹窗：新增“公式”按钮（`node-edit-modal.ts`），点击打开 `FormulaEditModal`。display 公式在目标文字块后插入新的块级公式块；行内公式写入当前聚焦文字块末尾（带空格、追加 `richText`），无聚焦文字块时退回第一个文字块、完全无文字块则新增一个。用 `focusin` 实时记录当前聚焦文字块的 `activeTextBlockId` 作为写回目标。契约 `${value.source}` 公式拼接、`splice(idx+1,…)` 插块、`textBlock.text += addition` 追加。
  - 文章模式“在图片前插入文字”（`article-renderer.ts` + `editor.ts` + `styles.css`）：图片右键菜单新增“在上方插入文字”项，调用 `insertArticleTextBlockBefore(nodeId, blockId)`：在目标图片块前 `splice` 插入空 text 块 → 保存/渲染 → 聚焦编辑。
  - 契约练习：新增 `tests/article-insert-text.test.mjs`（覆盖公式写回与 `.open()`、插入入口、局部影响级 mutate、送帧聚焦，并断言悬停按钮已移除）；更新 `tests/node-creation.test.mjs:48/52` 与 `scripts/test.mjs:1755` 的叶渲染契约。文档同步 `SPECIAL_FEATURES.md`。
  - 修正：`node-edit-modal.ts` 补 `MindMapTextContentBlock` 类型导入，公式写回的 `find` 添加类型谓词（`is ...: MindMapTextContentBlock`）——此前因类型收窄缺失触发 TS2552/2339。
- 上一轮：导图多选与尺寸缩放手柄修饰键对调 —— 多选统一 `Ctrl/Cmd`（节点点击切换、空白拖拽框选），尺寸缩放手柄改为按住 `Shift` 悬停显示并拖拽；CSS 类 `mmc-ctrl-resize`/`is-ctrl-held` 改名 `mmc-shift-resize`/`is-shift-held`；契约 `scripts/test.mjs`/`tests/settings-layout.test.mjs` 及文档同步。
- 接上一轮：导图行内编辑回车提交后键盘失焦修复 —— `beginInlineEdit` 失焦提交清理末尾，mindmap + `!related`（回车/Esc 程序性失焦）时 `rootEl.focus({ preventScroll: true })` 拉回焦点，global `handleKeydown`（绑定 rootEl capture）恢复；真实点击不抢焦点。契约测试 `tests/node-creation-focus.test.mjs` 新增 Enter/Esc 提交回拉。
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

- `npm run verify` 本机完整通过：`test:unit` 450/450（1.54.1 新增 4 条：`tests/latex.test.mjs` 3 条断行、`tests/question.test.mjs` 1 条方框/换行契约；1.54.2 该契约改为断言解除夹取的测量路径；本轮断行期望改为「首个顶层 `=` 留在首行、少于两个顶层 `=` 返回 `null`」，用例条数不变）、`test:regression` 全部通过、`test:docs` 全部通过（1303 处命名声明）、`test:repo` 通过、`tsc --noEmit` 与 production esbuild 通过。
- 详细数据见根目录 `TEST_RESULTS.md`。

## 待验证事项（需真实 Obsidian 桌面端手工冒烟）

- **长公式自动换行（1.54.1 引入、1.54.2 修复测量、本轮调整断行位置，待实测）**：文章/通读/大纲/题目预览中插入一条明显超过正文宽度的行内公式（如 `$R = 5.25\%,\ R \times (1-R) = 5.25\% \times (1-5.25\%) = 5.25\% - 0.25\% = 5\%$`），应自动断成按等号对齐的多行、不再把页面顶宽，且**首行必须保留第一个 `=`**（`R = 5.25\%, …`，只有第二个及之后的 `=` 才另起一行）；只含一个顶层 `=` 的公式（如 `$a = b$`）保持单行不换行。同一条公式放在导图节点里应保持单行（节点宽度自适应内容）；已渲染的公式在窗口变窄后不会自动重排（判定只发生在重新渲染时），刷新或切换模式后生效。若仍不换行，请提供公式所在位置（文章正文/导图节点/题目预览）与是否含 `\left`/`\right`、`\begin{}` 等不可断行结构。
- **公式编辑器「方框」（本轮新增，待实测）**：编辑节点内容 →「+ 公式」→ 输入公式后点「方框」，源码应变为 `\boxed{公式}` 且预览出现方框；先选中部分源码再点「方框」只包住选区；源码为空时点「方框」得到 `\boxed{}` 且光标停在花括号内。`\boxed` 依赖 Obsidian 自带 MathJax 的 ams 包，若预览提示“公式语法暂时无法渲染”请回报。

- **文章模式图片节点内容变更后视口稳定（1.54.0 修复，仍待用户实测确认）**：文章模式滚动到较深章节（如第 18 节）→ 在图片块上右键“在上方插入文字”或做其它内容变更 → 页面重建、窗口分帧补载（约 6 秒）、补载完成后前文图片/公式继续排版的全过程里，视口应停在同一处正文，不再出现数千像素的来回跳；补载期间（约 6 秒）主动滚动或点击应立即接管，不再被钉住。该修复针对的是补载**结束瞬间**重锚用旧锚点拽走视口 2017px 的问题。
- 焦点位置记忆：导图双击某节点编辑 → 点空白画布取消选中 → 拖拽画布 → 切换到文章，应落在上次聚焦节点的文字内容上（不再跳到最前）；再点选其它节点后再切文章应落在新选节点。
- 图片预览失效源自动回退：图片含图床+本地两来源，停用/失效图床后点击图片预览，短暂尝试图床后应自动回退显示本地图片，不再停留在“加载失败”；来源栏高亮应指向实际显示的本地来源；全部来源失效时才显示失败卡。
- 删除带失效远端的图片：删除该图片块后约 1 分钟，本地图片应进入系统回收站（不因远端连接失败被阻塞）；即便如此远端删除失败仍会提示“删除失败”，属远端不可达的如实反馈。
- 导图“编辑节点内容”→“公式”：点击应立即弹出公式编辑器；选行内/块级公式分别写入当前聚焦文字块末尾/在其后新增块级公式块；公式能在导图与文章渲染为 MathJax；多个文字块之间切换聚焦，公式写回正确目标。
- 文章“在图片前插入文字”（右键入口，悬停“+”按钮已按要求移除）：纯图片节点右键图片 →“在上方插入文字”，图片上方出现可编辑空段落并直接聚焦，输入文字提交后保存、在图片前常驻且**不再闪现后回退**（右键后应保持稳定、图片不消失）；正文中的图片块（非叶子）前插文字也正常。
- 多选改 Ctrl/Cmd：按住 Ctrl（macOS Cmd）+点击节点逐个切换选中/取消；空白处按住 Ctrl+拖拽出现框选矩形、覆盖的节点被选中；macOS 下 Cmd+点击不被当作右键菜单。
- 缩放开 Shift：按住 Shift 悬停节点右下角才显示尺寸控制点并拖拽；常规点击/双击节点不再误触缩放；缩放手柄的双击恢复自动大小仍需按住 Shift；切窗松开 Shift 后手柄立即隐藏。
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

- 长公式换行只在重新渲染时按容器宽度判定，窗口缩放后不重排；如需跟随窗口变化，可在 resize 后对可见公式重跑一次判定（需评估文章模式锚点抖动风险）。
- 断行目前只在顶层 `=` 处切分，且首个顶层 `=` 固定留在首行；如需在 `+`/`,` 或不等号处断行，可在 `splitLatexAtTopLevelRelation()` 扩展操作符集合（并保留“首个关系符不断行”的规则）。
- 文件块可选增强：右键菜单“在系统中显示/复制路径”；大量附件时的资源目录清理入口。
- 编辑器侧优化：把 `documentSnapshotJson` 失效与 `nodeTreeIndex` 重建收拢进 `mutate()` 单一入口。
- 编辑器拆分剩余批次（题目系统流程、行内编辑深化）收益递减，按需推进。

## 交付说明

- 三份 ZIP 均输出到 `D:\Downloads`（仓库工作区外），外部文件名：`obsidian-mindmap-studio-<版本>-<后缀>.zip`、`mindmap-studio-<版本>-test-<后缀>.zip`、`Agent-<版本>-handoff-<后缀>.zip`（内部根目录 `Agent/`）。本机 `D:\Downloads` 拒绝写入（OS 权限），本轮实际生成在 `%TEMP%\mms-delivery-<后缀>\`，需自行移动。
- 最近交付包（后缀 074016，交付追踪版本 1.54.3）：`obsidian-mindmap-studio-1.54.3-074016.zip`、`mindmap-studio-1.54.3-test-074016.zip`、`Agent-1.54.3-handoff-074016.zip`；实际发布版本以 GitHub Release 为准。
- 历史交付包记录已清理；历史版本以 GitHub Release 发布为准，本地交付 ZIP 见 `D:\Downloads`。
- 交付约束：沟通说明与中文 Git 提交说明中**不得**再写“- main.js 已重建。”这条；main.js 由 `npm run verify` 的 build 自动重建，交付时不要单独列出。
