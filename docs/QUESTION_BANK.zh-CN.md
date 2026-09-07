# 题库构建指南（数据结构与批量导入）

> 目标：不读插件源码也能正确生成题库文件。这里给出题库的文件格式、题目数据结构、判题规则和批量导入核对清单。
> 功能背景见 [SPECIAL_FEATURES.md](SPECIAL_FEATURES.md) 的「题库练习与错题回顾」章节，完整字段定义见 [DATA_MODEL.md](DATA_MODEL.md)。

## 1. 题库是如何被识别的

题库不是独立的题目文件，而是**普通导图节点上的结构化扩展字段**外加一个按文件夹开启的练习模式：

1. 插件设置 →「答题与题库」→「题库文件夹」（多行，vault 内相对路径）。对应设置项 `questionBankFolders`。
2. 路径落在题库文件夹（含子目录）内的导图文件会额外获得「答题」模式（`question-bank`），工具栏出现「新建题目子节点」，可整页刷题、错题本复盘。
3. 练习模式收集导图内**所有**带 `question` 字段的节点（`flattenNodes` 遍历，层级不限），因此一个文件就是一个练习单元，建议一个类别一个文件。

## 2. 文件格式（两种皆可，二选一）

| 格式 | 说明 |
|---|---|
| `.mindmap` 独立文件 | 插件注册的原生格式，**文件内容就是 MindMapDocument JSON**（带缩进的纯 JSON）。双击直接用导图视图打开。批量导入推荐用这种。 |
| `.md` 内嵌围栏 | Markdown 文件里放一个 ` ```mindmap-json ` 围栏，围栏内为同样的 JSON；围栏外可写普通 Markdown。 |

两种文件读取时都会经过 `parseDocument()` → `normalizeDocument()`（`src/core/model.ts`），缺省字段自动补全、非法值回退默认，因此生成端只需写「最小字段集」（见 §4）。

## 3. MindMapDocument 最小骨架

```json
{
  "version": 10,
  "title": "常识判断题库",
  "layout": "right",
  "theme": "auto",
  "root": {
    "text": "常识判断题库",
    "children": [
      { "text": "第一组　科技史", "children": [] }
    ]
  }
}
```

- `version` 必须是 `10`；`layout` 只有 `right` / `balanced`；`theme` 只有 `light` / `dark` / `auto`，非法值回退 `auto`。
- 节点的 `id` 可省略，规范化时自动生成；`children` 缺省视为空数组。
- 组节点（分类节点）就是普通节点，只写 `text` 即可；题目节点在普通节点基础上多一个 `question` 字段。

## 4. 题目节点：`question` 字段（MindMapQuestion）

```json
{
  "text": "题干文本（可省略，会由 stem 自动镜像）",
  "question": {
    "mode": "choice",
    "stem": [{ "type": "text", "text": "题干，可含 $行内公式$ 与 $$独立公式$$" }],
    "options": [
      { "label": "A", "content": [{ "type": "text", "text": "选项内容" }] }
    ],
    "answer": [{ "type": "text", "text": "C" }],
    "explanation": [{ "type": "text", "text": "解析文字" }],
    "tags": ["事业单位", "常识判断"]
  }
}
```

### 字段说明与缺省行为

| 字段 | 说明 | 缺省时 |
|---|---|---|
| `mode` | `choice` 选择 / `judgment` 判断 / `essay` 大题 | 回退 `choice` |
| `stem` | 题干，内容块数组 | 允许为空（练习页会回退节点文本） |
| `options` | 选项数组，每项 `{label, content}` | choice 自动补 A–D；judgment 自动补「正确/错误」；essay 强制为空。上限 12 个 |
| `answer` | 参考答案，内容块数组。**写法约束见 §5** | 空数组（选择题无答案会被判为答错） |
| `explanation` | 解析，内容块数组 | 空 |
| `tags` | 标签数组，去重、去 `#` 前缀，最多 12 个。练习模式按标签筛选 | 空数组 |
| `status` | `unanswered` / `completed` / `favorite` / `wrong` / `mastered` | `unanswered`。导入新题不要写此字段 |
| `attemptCount` / `correctCount` / `lastPracticedAt` | 练习统计 | 0 / 0 / 空 |
| `source` | `{title, url, matchedAt}`，AI 检索到的原题来源，url 必须 http(s) | 空 |

### 内容块（`MindMapContentBlock`）

只有两种常用类型，块的 `id` 可省略（自动生成）：

- 文字块：`{ "type": "text", "text": "..." }`，文字可内嵌 `$...$` 行内公式；整块**仅**由一个 `$$...$$` 组成时按独立公式居中渲染。
- 图片块：`{ "type": "image", "source": "vault相对路径 或 https://URL", "alt": "题图" }`。

### 自动镜像（写文件时可以不管，但要知道）

加载时 `syncMindMapQuestionFields()` 会把 `stem` 镜像为节点的 `content` 与 `text`、把 `question.tags` 合并进 `node.tags`。因此题目节点**不必**手写 `text`/`content`，写了也会以 `stem` 为准。

## 5. 判题规则（决定 `answer` 的正确写法）

练习页「查看答案」时按 `mode` 判分（`src/editor/question-practice-mode.ts`）：

- **选择题**：从 `answer` 文本中提取 A–D 字母判定。`answer` 写 `C` 为单选，写 `AC` 自动按多选判。
  ⚠️ **`answer` 里只写字母**。解析、理由一律放 `explanation`——解释文字里出现「A 项…」这类字母会被判题逻辑误读为答案标签。
- **判断题**：`answer` 写「正确」或「错误」；「对/错/是/否/A/B/true/false」等同义词也会归一化识别。选项文本或 label 与答案归一化比对。
- **大题（essay）**：无选项，练习者输入文本后与 `answer` 做**规范化精确比对**（去空白、标点、符号，忽略大小写）。参考答案写要点式短句利于命中；逐字长文几乎无法精确匹配，适合当「对照自查」用。

## 6. 批量导入流程（外部题源 → 题库文件）

以「C 类备考资料 → Obsidian 题库」的实际转换为例，流程分四步：

1. **盘点源格式**：确认题目的编号方式、选项标记（`A.` / `A、` / 行内 `A．B．`）、答案区位置（文末集中 vs 跟题）、共用材料（资料分析/阅读材料的引用段）。
2. **写一次性解析脚本**（Node/Python，放临时目录，不入仓库）：切题 → 切选项 → 解析答案与解析 → 生成 JSON。经验教训：
   - 带 `^` 行首锚点的正则**必须加 `m` 标志**（否则只匹配文件开头，切出 0 题）。
   - PDF 提取类文本会混入页眉、页码、题号独立成行等噪声，先按已知顺序号或分节标题切题再清洗。
   - 共用材料（资料分析、文献阅读）并入该组每题的 `stem`，或挂到一个普通父节点的 `content` 上。
3. **生成 `.mindmap` 纯 JSON 文件**（`JSON.stringify(doc, null, 2) + "\n"`），文件名即类别名，输出到题库文件夹。
4. **跑核对清单**（§7），再在真实 Obsidian 桌面端打开抽查。

## 7. 导入后核对清单

- [ ] 每个文件 `JSON.parse` 通过且 `version === 10`。
- [ ] 统计每文件 `choice` / `essay` 题数，与源文档题数一致（注意：源文档标题写「8 题」实际可能只有 7 题，以实际内容为准）。
- [ ] 每道选择题 `answer` 为纯字母串 `^[A-D]{1,4}$` 且有解析；缺失的单独列警告。
- [ ] 每道大题 `answer` 非空。
- [ ] 题干/答案/解析中无残留 Markdown 分隔线（`---` 整行）——切题边界漏判的典型症状（注意区分：选词填空的 `________` 下划线是正常内容）。
- [ ] 抽查 1–2 题：选项无重复标签、共用材料完整、公式 `$...$` 未被二次转义。
- [ ] 在 Obsidian 中打开文件确认出现在「答题」模式，且练习页判题正确。

## 8. 相关代码与设置索引（按函数名检索）

| 主题 | 位置 |
|---|---|
| 数据结构定义、规范化、镜像 | `src/core/model.ts`：`MindMapQuestion`、`createMindMapQuestion`、`normalizeMindMapQuestion`、`syncMindMapQuestionFields`、`normalizeDocument`、`parseDocument`、`serializeDocument` |
| 文件扩展名注册（`.mindmap`） | `src/main.ts`：`MINDMAP_EXTENSION`、`registerExtensions` |
| 题库文件夹设置与命中判断 | `src/settings.ts`（`questionBankFolders`）、`src/main.ts`（`isQuestionBankFile`） |
| 题目编辑弹窗（UI 加题入口） | `src/editor/question-modal.ts`：`QuestionEditModal` |
| 练习页与判题 | `src/editor/question-practice-mode.ts`：`isQuestionChoiceCorrect`、`isQuestionJudgmentCorrect`、`isExactQuestionAnswer` |
| 新建/转换题目节点 | `src/editor/editor.ts`：`addQuestionChild`、`editQuestion` |
