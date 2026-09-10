# 新增文件内容块：节点右键上传文件 + 删除同步清理

## Context

用户需求：节点右键菜单新增"上传文件"，选择本地文件后复制到 vault 附件目录（与图片落盘同目录逻辑），节点插入 file 内容块；节点删除或块删除时同步删除磁盘文件。已确认的交互决策：

1. **删除去向**：`vault.trash(target, true)` 进系统回收站（仓库已有先例 main.ts L2926/L3290）。
2. **延迟删除**：删除引用后 60 秒才执行删文件；期间引用恢复（撤销/粘贴等任何文档变化）则取消；到期执行时仍做全库引用检查兜底（当前文档 + 全部其它 .mindmap，仿 `deleteLocalAssetIfSafe()`）。
3. **同时支持拖拽**：文件拖到节点即上传落盘并插入文件块。
4. **命名**：保留原文件名（sanitizeFilename 清洗 + getAvailablePath 防冲突）。

## 数据模型 — src/core/model.ts

- 新增 `MindMapFileContentBlock`：
  ```ts
  { id: string; type: "file"; source: string; name: string; size?: number }
  ```
  `source` = vault 相对路径（权威），`name` = 原文件名（显示/搜索用），`size` = 字节数（可选）。加入 `MindMapContentBlock` 联合类型（L276）。
- `normalizeContentBlock()`（L881-948）加 `file` 分支：source/name 必填非空（截断 2000/500），size 为非负整数时保留，否则丢弃。仿 image 分支写法。
- `nodeContentBlocks()`（L1107）自动包含 file 块（遍历 content 数组），**无 legacy 字段**、无镜像字段（`syncNodeContentFields`/`replaceNodeContentBlocks` 不需要改，file 块随 content 保留）。
- `nodeSearchText()`（L1758）加 file 分支：搜索 `name` + `source`。
- `documentToMarkdown()`（L1977-1993）加 file 分支：`` result.push(`[${block.name}](${block.source})`) `` —— 否则掉进 else 兜底被当 code 块序列化且 `block.code` 为 undefined 直接抛错。
- 序列化/解析走 `JSON.stringify(normalizeDocument())`，file 块自动持久化，无需额外处理。

## 插件层 — src/main.ts

- `saveAttachmentFile(file: File, sourceFile: TFile | null): Promise<string>`：复用 `savePastedImage()`（L2044-2059）目录逻辑（导图所在目录 + `settings.assetFolder`，`ensureFolderPath` L3031），文件名 = `sanitizeFilename(file.name)`，`getAvailablePath()`（L1886）防冲突，`vault.createBinary` 落盘，返回路径。
- 延迟删除管理（plugin 级字段 `private pendingFileDeletions = new Map<string, number>()`）：
  - `scheduleFileAssetDeletion(paths: string[], currentMindMapPath: string)`：按 path 去重登记 `window.setTimeout(60_000)`；到期时逐个执行 `deleteFileAssetIfSafe`。
  - `deleteFileAssetIfSafe(path, currentMindMapPath)`：仿 `deleteLocalAssetIfSafe`（L2806-2833）——TFile 存在性、当前文档引用检查（`block.type === "file" && block.source === normalized`）、其它 .mindmap `cachedRead().includes()` 检查；全部通过 → `vault.trash(target, true)`（系统回收站）。任一失败则放弃（宁留勿删）。
  - `cancelFileAssetDeletion(paths: string[])`：clearTimeout + 移除登记。
  - `onunload()`（L439 附近）：清空全部 pending 定时器（退出时放弃删除是安全方向）。
- `openFileAsset(path: string): Promise<void>`：`this.app.workspace.openLinkText(path, "")`。移动端兼容（无桌面 API 依赖）。

## 回调接线 — src/editor/editor-types.ts + src/view.ts

`MindMapEditorCallbacks` 新增 4 个字段（各带 JSDoc），view.ts L211-220 区域绑定到 plugin：

- `onSaveAttachmentFile: (file: File) => Promise<string>`
- `onScheduleFileAssetDeletion: (paths: string[]) => void`
- `onCancelFileAssetDeletion: (paths: string[]) => void`
- `onOpenFileAsset: (path: string) => Promise<void>`

## 编辑器 — src/editor/editor.ts

- 文件选择：node-image-actions.ts 新增 `selectAnyFile(): Promise<File | null>`（仿 `selectImageFile()` L28-36，不设 accept）。
- `openContextMenu()`（L6544-6670）："插入截图"（L6632-6639）附近加"上传文件"菜单项（icon `file-up`，只读分支 L6557 提前 return 天然隐藏）。
- `uploadFileToNode(nodeId: string, afterBlockId?: string): Promise<void>`：`selectAnyFile()` → `callbacks.onSaveAttachmentFile` → `mutateArticleContent()` 插入 file 块（位置仿 `insertTextBlockAfter()` L5135；无 afterBlockId 追加末尾）。成功后 Notice。
- **删除块同步**：`removeContentBlock()`（L5270-5278）：被删块为 file 类型时，mutate 后 `onScheduleFileAssetDeletion([removed.source])`（先快照块再 mutate，仿 `removeImageBlock()` L6526-6537；mutate 内部先触发保存，降低"未刷盘导致检查误放弃"概率）。**只挂显式删除入口**，`moveContentBlock()` 等重排不得经过此路径。
- **删除节点同步**：`deleteNodeById()`（L4856-4874）与 `deleteSelected()`（L4879-4910，含多选分支共 3 处 `deleteNodes`）：mutate **前** `flattenNodes` 收集被删子树全部 file 块 path，mutate **后** `onScheduleFileAssetDeletion(paths)`。
- **取消收口（单一）**：`notifyDocumentChange()` 内每次文档变化后，收集当前文档全部 file 块 path 调 `onCancelFileAssetDeletion(paths)`——覆盖撤销、重做、粘贴恢复、modal 重排等全部引用恢复场景（纯 Map clearTimeout，开销可忽略）。

## 拖拽上传 — editor.ts bindContentBlockAppendDropTarget（L5211-5234）

dragover 与 drop 的**现有判空之前**加 Files 分支（判定顺序关键，否则节点 drop handler 吞掉文件拖放）：

```ts
// dragover: 
if (this.readOnly) return;
if (event.dataTransfer?.types.includes("Files") && !this.draggingContentBlock) {
  event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  dropTarget.addClass("is-block-drop-append");
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  return;
}
// drop:
if (event.dataTransfer?.types.includes("Files") && !this.draggingContentBlock) {
  event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  void this.uploadFileToNode(nodeId);  // append 语义
  return;
}
```

绑定点已在 mind-map-node-renderer.ts L287（nodeEl 整节点为 append target）。移动端无拖拽事件，天然不触发。

## 渲染注册（五面）+ 样式

统一文件卡片形态：图标（`file-text`）+ 文件名 + 可读大小（`formatFileSize` 工具，可放 core 或 renderer 内联）。点击 → `callbacks.onOpenFileAsset(block.source)`；右键 → `openContextMenu(event, block.id)` 复用通用"删除当前块"。

1. **导图画布** mind-map-node-renderer.ts 块循环（L133-244）：image 分支后加 file 分支，`wrap.dataset.blockId = block.id`，绑定点 `bindContentBlockAppendDropTarget` 已覆盖。
2. **布局估算** render/layout.ts L107-155：file 块宽 = `min(900, max(120, name 长度估算))`，高 = 每块约 36 + 22 间距（计入 blocks 循环）。
3. **文章模式** article-renderer.ts `renderArticleNodeContent()`（L474-528）：image 分支后加 file 分支（`createArticleContentBlock` 壳 + dataset.blockId + 点击打开 + contextmenu）。
4. **大纲模式** outline-renderer.ts `renderOutlineContent()`（L108-161）：L112-113 提前 return 条件加 files；files 渲染仿 images 段（不参与 inline 行）。
5. **节点编辑弹窗** node-edit-modal.ts：`+ 文件`按钮（L415-424 区域）→ `selectAnyFile` + `onSaveAttachmentFile` 落盘后 push file 块；blockTitle L145 加"文件块"；validBlocks L131-136 加 `if (block.type === "file") return Boolean(block.source.trim());`；file 块卡片渲染（文件名 + 大小 + "打开文件"按钮）；块删除（L202-208 / L213）splice 前收集 file path，scheduleAutoSave 后 schedule 删除。
6. **hasContent 判定**（file 块计入内容，防止仅含文件的节点被当空节点跳过）：article-renderer.ts L604 `questionFieldHasContent` 不改（题目字段无 file 块），但文章空节点判定（editor.ts L5566 `hasContent`）需加 `|| block.type === "file"`；article-renderer.ts L115-117 缓存字节估算加 file 项（name/source 字节 + 256）。
7. **styles.css**：`.mmc-node-file-block`（画布内紧凑卡片）、`.mms-article-file-block`、`.mms-outline-file`、`is-unresolved` 状态（文件不存在时显示提示）。复用现有圆角/边框变量。
8. **global-search.ts** L116：类型标签加 file → "附件节点"（在 image 判断旁）。`ai/edit.ts` 查找替换只处理 text/table，file 块自然跳过，**不改**。

## 测试 — tests/file-block.test.mjs（新建，契约风格同 node-creation.test.mjs）

锁定以下契约（源码正则断言，经 tests/helpers/editor-sources.mjs 加载）：

1. model.ts：normalizeContentBlock file 分支（source/name 校验）、documentToMarkdown file 分支在 else 兜底之前、nodeSearchText 含 file。
2. main.ts：saveAttachmentFile 保留原名 + createBinary；scheduleFileAssetDeletion 60s + vault.trash(target, true)；onunload 清空 pendingFileDeletions。
3. editor.ts：openContextMenu 含"上传文件"；removeContentBlock 对 file 块调 onScheduleFileAssetDeletion；deleteSelected/deleteNodeById 收集子树 file path；notifyDocumentChange 后 onCancelFileAssetDeletion；bindContentBlockAppendDropTarget 的 Files 分支先于 draggingContentBlock 判空。
4. 渲染三面（renderer/article/outline）file 分支存在 + data-block-id；modal 含 `+ 文件` 按钮与文件块删除收集。

## 文档

- docs/DATA_MODEL.md：file 块类型、字段、延迟删除语义。
- docs/ARCHITECTURE.md / SPECIAL_FEATURES.md：涉及处同步。
- 新增公开函数全部 JSDoc（check-docs 强制），接口变更后 `npm run docs:generate`。

## 新增公开函数清单（JSDoc 必填）

- main.ts：`saveAttachmentFile`、`scheduleFileAssetDeletion`、`cancelFileAssetDeletion`、`openFileAsset`
- model.ts：`MindMapFileContentBlock`（导出类型）
- node-image-actions.ts：`selectAnyFile`
- editor.ts：`uploadFileToNode`
- editor-types.ts：4 个回调字段

## 验证

1. `npm run docs:generate`（接口变更后）
2. `npm run verify`（单测 + 回归 + 文档覆盖 + 仓库检查 + esbuild 产 main.js）
3. 手工冒烟（交付时列明待验证）：右键上传/拖拽上传 → 画布/文章/大纲/编辑弹窗显示 → 点击打开 → 删除块与删除节点后 60 秒文件进系统回收站 → 期间 Ctrl+Z 取消删除 → 克隆分支后删除单侧节点文件保留。

## 交付（仓库规则）

- 打包前更新 Codex/项目/obsidian-mindmap-studio.md（当前状态、验证基线、待验证、下一步）。
- 三份 ZIP 输出到 D:\Downloads（同一六位后缀）：源码 `obsidian-mindmap-studio-<版本>-<后缀>.zip`、安装 `mindmap-studio-<版本>-test-<后缀>.zip`、交接 `Codex-<版本>-handoff-<后缀>.zip`；UTF-8 文件名标志检查、第一层目录检查。
- 中文 Conventional Commit 说明（不实际执行 git 提交）。
