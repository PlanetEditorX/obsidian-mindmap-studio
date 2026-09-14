# obsidian-mindmap-studio 项目交接

- 插件：MindMap Studio（Obsidian 本地优先 .mindmap 导图，含导图/大纲/文章/通读模式、全局搜索、图床、AI 助手与桌面截图链路）。
- 版本基线：1.51.0（线上已发布；工作区提交基线 v1.51.3：节点锚点来源变更恢复——图片块所在节点为锚，替换/删除来源后按节点视口偏移恢复阅读位置）。
- 仓库规则：见根目录 `AGENTS.md`；每轮代码交付三份 ZIP（源码 / 安装 / Agent 交接）共用同一六位后缀；验证入口 `npm run verify`。

## 当前状态（待提交：来源变更像素恢复修复；上一轮 8b1b9ff + v1.51.0 已发布但修复不完整）

- 替换本地图片后当前来源不跟随（应用户反馈）：`replaceLocal` 原先只更新 `localSource`，`source` 仍指向旧本地路径，来源列表出现“当前图片（旧）+ 本地图片（新）”两个候选；旧文件 60 秒回收后“当前图片”加载失败。修复：当前显示来源为本地路径（非 http(s)）时随替换更新为新路径，图片级默认来源（sourcePriority）中引用旧路径的项同步映射；被替换的旧 source 与旧 localSource 去重后进入 60 秒延迟回收。纯远程镜像块替换本地副本不影响 source。
- 替换图片后阅读位置乱跳（应用户四轮日志定位）：第一层 mutate(null) 挡住 mutate 自身恢复（8b1b9ff）；第二层 suppressNextArticleSemanticRestore 让 renderArticle 窗口渲染跳过语义恢复、走像素 scrollTop 恢复（3173796 / v1.51.1）；第三层 pendingArticlePixelRestoreTop 像素目标 + warmup 分帧钉住 + capture 阶段 guard（v1.51.2）；第四层（本轮 v1.51.3）：用户仍反馈“还是不行，图片块总在一个节点里面”。根因：绝对像素目标本身会被顺位内容高度变化破坏——替换/删除来源改变图片块高度，图片块及其后内容被挤压，同一 scrollTop 已不再对应原阅读位置。修复：改为节点锚点恢复——图片块总在某个节点内，渲染前 `captureArticleNodeAnchor(nodeId)` 记录该节点在视口中的滚动无关偏移量（`offsetTop` 经由 `getBoundingClientRect` 差值，不依赖定位祖先）；重渲染后 `startArticleNodeAnchorGuard()` 以 capture 阶段 scroll guard 把该节点按原视口偏移实时钉回，保持阅读位置相对该节点不变，不再使用会被高度变化破坏的绝对像素；warmup 的 `loadedBefore` 在节点锚点激活时跳过像素增量以免污染；用户 wheel/pointerdown/touch 立即接管。所有来源变更分支（reupload/add/replaceLocal/unsetDefault/setDefault/remove）统一在 `applyImagePreviewSourceChange` 入口捕获锚点。契约测试 `file-block.test.mjs` 扩展锁定节点锚点优先、capture 守卫与入口捕获。
- 教训：验证构建产物必须搜 esbuild 编译形式（`void 0` 而非 `undefined`），且 Select-String 勿用 -First 截断；GitHub Release 产物只含已提交代码，工作区修复需提交发布后才能通过插件更新获取；overflow-anchor:none 已存在时不要臆断浏览器锚定参与补偿。
- 预览弹窗“本地图片”来源行右键新增“在文件资源管理器中打开”（位于“更新替换”之后）：`ImagePreviewSourceActions` 新增可选 `revealLocal` 回调，editor 注入 `onRevealFileInSystemExplorer`；actions 对象补 `ImagePreviewSourceActions` 显式类型标注。file-block.test.mjs 新增契约锁定来源跟随与 reveal 入口。

- 截图插入链路优化：`captureScreenshot` 原先独立实现插入——整份 `cloneDocument` + `replaceDocumentFromExternalEdit` 替换文档、`focusNodeById` 强制聚焦目标节点、`onSavePastedImage` 落盘后才校验目标节点（失败时孤儿文件无提示）。现重构出共用方法 `insertImageBlockToNode()`（落盘 → mutate 插入 → 自动上传排程 → 通知），截图、右键“插入图片”、粘贴图片三条入口全部收敛：截图插入改走统一 mutate 链路（保留撤销与阅读位置记忆，不再整份替换文档、不再强制聚焦拉走阅读位置、不再丢失多选状态），目标节点消失时统一提示含落盘路径。契约测试 `image-layout.test.mjs` 新增“screenshot, right-click image picker and paste share one insert chain”。
- 阅读进度丢失修复（应用户日志反馈）：文章/通读模式下翻到最后关闭 Obsidian，重开后停在文档标题。根因有两层：(1) 初次挂载时文章族上下文未加载，`getEditorOptions` 的 `readingHomePath` 回退为当前文件自身，读到的持久化位置键与滚动写入的族首键不一致，初始无位置可恢复；(2) 族上下文异步刷新完成后的 `setOptions` 恢复优先级是 `preferred → rendered → remembered`，此时 rendered 恒为“当前渲染位置”（标题/骨架），remembered（真实上次阅读位置）永远被遮蔽。修复：新增一次性授权 `initialReadingLocationRestorePending`（编辑器挂载与文件切换时对非导图模式置位），首次族上下文刷新时同文件的记忆位置优先于 rendered（`normalizeReadingLocation(...)?.filePath === currentFilePath` 才启用，目录落地页与导图模式排除）；用户滚动接管或完成一次恢复尝试即失效。契约测试 `reading-editor-contract.test.mjs` 新增“first family refresh after opening a file prefers the remembered reading position”，并更新原“article option refresh”断言适配新选择链。
- 右键插入图片（应用户反馈）：画布/大纲/文章/通读模式的节点右键菜单此前只有截图、上传文件，没有本地图片入口；新增“插入图片”（有锚点块时显示“在此块后插入图片”）。`insertImageToNode()` 复用既有链路：`selectImageFile()` 系统文件选择器 → `onSavePastedImage` 落盘附件目录 → `mutateWithoutArticleContext` 插入图片块（锚点后或末尾）→ `onScheduleAutoUpload` 自动上传排程；SVG 扩展名正确保留。契约测试 `image-layout.test.mjs` 新增“node context menu offers local image insertion reusing the paste save chain”。
- 交接体系更名：目录 `Codex/` → `Agent/`（git mv 保留历史），交接文档精简为当前状态 / 验证基线 / 待验证 / 下一步四节，历史交付包清单全部删除（历史版本以 GitHub Release 为准）；AGENTS.md、docs/DEVELOPMENT.md、docs/PROJECT_GUIDE.zh-CN.md 同步改名，交接 ZIP 外部命名改为 `Agent-<版本>-handoff-<六位后缀>.zip`、内部根目录固定为 `Agent/`。
- 近期已发布（v1.50.1 ~ v1.50.3，均已带契约测试并通过 verify）：编辑弹窗图片块未启用图床时隐藏“选择文件并上传”“上传当前图片”按钮；剪贴板按钮 SVG 兜底（`parseDataUrlImageFromHtml()` 从 text/html 提取内嵌 data URI，绕过 Chromium read() 白名单）；“尚未选择图片”占位双击选图（复用“保存到仓库”本地链路，`is-empty` 样式 + title 提示）。
- 上一轮（已随 v1.49.9/v1.50.0 发布）：Enter 创建节点失焦修复（保护窗口 50ms → 220ms，blur 拉回仅限程序性失焦）+ `bringNodeIntoView()` 新节点最小平移滚入视口；1.49.8 节点文件上传（右键/拖拽上传、五面统一文件卡片、60 秒延迟回收删除与撤销取消）。

## 验证基线

- `npm run verify` 本机完整通过：`test:unit` 431/431；`test:regression` 全部通过；`test:docs` 覆盖 63 个源码模块、1288 个具名声明；`test:repo` 通过；production esbuild 通过，`main.js` 已重建。
- 详细数据见根目录 `TEST_RESULTS.md`。

## 待验证事项（需真实 Obsidian 桌面端手工冒烟）

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
