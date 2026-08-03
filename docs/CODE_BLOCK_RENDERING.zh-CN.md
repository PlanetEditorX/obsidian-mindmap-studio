# 代码块渲染重构与行号对齐说明

## 1. 项目与调用链分析

MindMap Studio 以 `MindMapDocument` 作为唯一内容模型。`src/core/model.ts` 负责代码块数据的规范化与序列化；`src/editor/content-modals.ts` 负责编辑代码内容、语言、折叠、行号和主题；`src/editor/editor.ts`、`src/editor/outline-renderer.ts`、`src/editor/article-renderer.ts` 分别在导图、大纲、文章/通读中创建展示容器。文章和通读共用文章渲染器，但提供不同的章节集合。

四种模式最终都通过 `MindMapEditorCallbacks.onRenderCode` 进入 `src/view.ts`。本次重构将设置解析、Markdown 包装、语法高亮调用和行号 DOM 增强全部集中到 `src/render/code-block.ts`，避免各模式维护不同的行号算法。

```text
MindMapCodeBlock
├─ 导图：editor.ts
├─ 大纲：outline-renderer.ts
└─ 文章 / 通读：article-renderer.ts
       ↓
MindMapEditorCallbacks.onRenderCode
       ↓
MindMapStudioView
       ↓
renderCodeBlock()
       ↓
Obsidian MarkdownRenderer
       ↓
installCodeLineNumberLayout()
```

## 2. 原实现与根因

原实现把 `1\n2\n3...` 写入 `code[data-line-numbers]`，再由 `code::before` 一次性绘制所有行号。为了修正肉眼可见的偏差，CSS 又增加固定 `em` 光学基线补偿，并把分隔线拆到另一个伪元素。

该方案存在结构性问题：

1. 行号伪元素和真实代码不是同一组行盒。Obsidian 高亮器会在 `code` 内生成多层 token `span`，主题也可改变这些元素的行高、字体或继承关系。
2. 固定像素或 `em` 补偿只能适配某个字体、字号、设备像素比和缩放比例，不能证明所有行都共享同一基线。
3. 导图节点、大纲、文章和通读的祖先选择器与溢出策略不同，伪元素的定位参照和裁剪行为容易被模式样式影响。
4. 代码软换行或父容器覆盖 `overflow` 时，代码的视觉行数可能与原始逻辑行数不同。
5. 伪元素无法作为可测试的真实节点检查顺序、数量和无障碍属性，长期维护只能继续增加视觉补丁。

因此问题不是再调整一次 `top` 或 `padding-top` 可以彻底解决，而是行号与代码没有共享同一套确定的布局度量。

## 3. 新 DOM 结构

Obsidian 完成 Markdown 与语法高亮后，保留原始 `code` 和全部 token，只在同一个 `pre` 中插入一个真实兄弟节点：

```html
<div class="mms-code-render-root">
  <pre class="mms-code-frame mms-code-with-line-numbers">
    <span class="mms-code-line-numbers" aria-hidden="true" role="presentation">1
2
3</span>
    <code class="mms-code-content"><span class="token keyword">const</span> value = 1;
...</code>
  </pre>
</div>
```

行号被标记为展示性内容，不能获得指针事件，也不能被选择。因此用户复制代码时不会复制行号。

## 4. 对齐不变量

`captureCodeLayoutMetrics()` 在改变 `pre` 布局前读取 Obsidian 实际计算结果，并保存为 CSS 变量：

- `font-family`
- `font-size`
- `font-weight`
- `line-height`
- `letter-spacing`
- `padding-top/right/bottom/left`

行号栏与代码栏随后共同使用这些变量，并共同满足：

- `white-space: pre`
- 相同字体与行高
- 相同顶部和底部内边距
- 行号栏不换行，代码栏不软换行
- 语法 token 的行高强制继承代码栏
- `pre` 负责横向滚动

这使第 N 个行号和第 N 个代码逻辑行从相同的顶部内边距开始，并以完全相同的行高递增。实现不再包含伪元素、多行 `content`、绝对定位或光学基线常量。

## 5. 设置解析保持兼容

`resolveCodeBlockPresentation()` 使用统一“代码外观”优先级：

1. 节点代码块显式设置。
2. 当前页面“主题与外观 → 代码外观”覆盖。
3. 插件全局“主题与外观 → 代码外观”默认。

页面和全局层都包含默认折叠、默认行号、代码主题、自动保持展开阈值与自动显示行号阈值。页面字段缺失时逐项跟随全局；自动展开阈值仅在代码行数不超过阈值时强制展开，自动行号阈值仅在代码行数超过阈值时决定是否显示。阈值会被规范化到 `0–1000`，`0` 表示禁用自动规则。

行数由 `countCodeLines()` 统一处理 LF、CRLF 和旧式 CR；末尾换行保留一个空白逻辑行。Markdown 围栏长度根据代码中最长连续反引号动态增加，避免代码正文提前关闭围栏。

## 6. 四模式覆盖

- **导图**：`src/editor/editor.ts` 在节点内容块中调用 `callbacks.onRenderCode`。
- **大纲**：`src/editor/outline-renderer.ts` 把同一回调作为 `renderCode` 使用。
- **文章**：`src/editor/article-renderer.ts` 遍历文章内容块并调用同一回调。
- **通读**：复用文章渲染器和相同回调，仅章节数据来自连续阅读集合。

所有模式只创建宿主容器；它们不生成行号、不计算阈值、不复制主题类。主题切换时共享渲染器会先清除旧的代码主题类，避免复用容器时残留样式。

## 7. 导图节点动态高度

导图布局会先根据数据模型估算节点宽高，以便生成首帧坐标。但估算值只能用于布局计算，不能直接成为节点 DOM 的最小高度。

旧处理把 `position.height` 写入 `nodeEl.style.minHeight`。长代码展开时估算高度较大；之后即使 `<details>` 折叠，浏览器计算出的自然高度也不能低于这个值，因此节点外框、碰撞占位和连接线仍保持展开状态。

现在遵循以下规则：

- 布局估算高度只参与 `computeLayout()` 的首帧坐标计算。
- 只有用户通过节点尺寸功能明确保存了 `node.style.minHeight`，才向 DOM 写入 `min-height`。
- Markdown 高亮异步完成后主动调用测量布局。
- 折叠代码使用的 `<details>` 发生 `toggle` 时再次请求测量。
- `ResizeObserver` 继续覆盖字体、主题、图片和其他异步尺寸变化。
- 测量结果重新进入碰撞处理，并刷新节点坐标、连接线和画布边界。

因此默认自动尺寸节点可以在代码折叠时缩小、展开时增大；用户手动设置的最小高度仍被尊重。

## 8. 内容块删除与兼容字段

旧版 `.mindmap` 节点可直接保存 `table` 和 `code` 字段，新版推荐把它们保存为有序 `content` 块。读取旧文档时，`nodeContentBlocks()` 会把尚未进入 `content` 的旧字段补入内容块列表，这是必要的迁移兼容行为。

但节点编辑器删除表格或代码后，新的 `content` 与旧的 `node.table` / `node.code` 曾短暂并存。若直接调用普通同步函数，迁移逻辑会误以为内容块缺失，再把旧字段补回来。

`replaceNodeContentBlocks()` 现在用于完整编辑事务：

1. 写入编辑器提交的权威内容块集合。
2. 清理 `text`、`richText`、`image`、`table`、`code` 旧版镜像字段。
3. 从新的 `content` 重新生成所有兼容摘要字段。

该入口用于节点编辑器保存和结构化块删除，不改变旧文档读取时的自动迁移能力。

## 9. 修改范围

运行时代码只修改以下链路：

- 新增 `src/render/code-block.ts`。
- `src/view.ts` 将旧内联实现替换为共享渲染器调用。
- `styles.css` 将伪元素行号替换为真实双栏布局，并增加针对导图节点溢出规则的高优先级覆盖。
- `src/editor/editor.ts` 仅将节点 DOM 的最小高度限制为用户显式值，并在代码折叠切换后触发测量布局。
- `src/core/model.ts` 增加权威内容块替换入口，防止删除表格/代码后旧兼容字段复活。
- 重新构建 `main.js`。

文档格式版本、代码块设置优先级、用户手动节点尺寸、撤销保存链路、导入导出、搜索、AI、图床和阅读位置逻辑均保持兼容。示例文件仅将仓库中已有的 `#Uxxxx` 编码路径规范化为测试要求的可读 UTF-8 名称。

## 10. 自动测试

`tests/code-block.test.mjs` 验证：

- 行数与围栏边界。
- 设置优先级和自动阈值。
- 真实行号兄弟节点、无障碍属性和重复渲染幂等性。
- 运行时计算度量写入共享 CSS 变量。
- 四模式共享同一回调。
- CSS 中不存在旧 `code::before`、`data-line-numbers` 或基线补偿。
- 横向滚动规则不会被导图节点的 `overflow: visible` 覆盖。
- 导图节点不再把 `position.height` 写为 DOM `min-height`，并为折叠切换安装测量布局回调。
- 权威内容替换后，旧版 `table` / `code` 镜像不会重新生成已删除块。

完整仓库验证使用：

```bash
npm test
npm run build
node --check main.js
```

## 11. 手动验收矩阵

在 Obsidian 测试仓库分别进入导图、大纲、文章和通读模式，至少检查：

- 1 行、2 行、10 行和超过 100 行的代码。
- 中间空行与末尾空行。
- Tab 缩进、中文、ASCII、宽字符和长行横向滚动。
- 从 Windows 文本复制的 CRLF 代码。
- Obsidian、GitHub、Monokai、Dracula 四种代码主题。
- 100%、125%、150% 界面缩放和不同等宽字体。
- 折叠后展开、切换模式和重新打开文件。
- 在导图中反复展开/折叠长代码，确认节点外框、相邻节点避让和连接线立即随高度变化。
- 在节点编辑器删除表格块、代码块，保存关闭并重新打开文件，确认内容不再出现。
- 复制代码时剪贴板不包含行号。

自动测试锁定结构不变量；最终像素表现仍应在真实 Obsidian、用户主题和目标平台上完成上述冒烟测试。
