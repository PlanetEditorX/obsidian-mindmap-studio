# MindMap Studio 1.19.2 完整项目说明

## 1. 文档定位

本文是仓库的统一说明入口，面向使用者、维护者、审阅者和发布负责人。它描述当前版本的完整状态，而不是按修复时间连续追加更新记录。

文档职责如下：

| 文档 | 职责 |
|---|---|
| `README.md` | 产品简介、安装、基本使用和文档导航 |
| `docs/PROJECT_GUIDE.zh-CN.md` | 当前版本的完整使用、架构、开发、测试和发布说明 |
| `CHANGELOG.md` | 按版本记录历史变化 |
| `MIGRATION.md` | 数据迁移和兼容说明 |
| `docs/FUNCTION_REFERENCE.md` | 从 TypeScript 源码生成的函数参考 |

## 2. 项目概览

MindMap Studio 是 Obsidian 的本地优先思维导图插件。插件以 `.mindmap` 文件保存结构化文档，并提供导图、大纲、文章和通读四种同步视图。

核心能力包括：

- 节点创建、编辑、排序、折叠、多选和拖放。
- 文本、富文本、备注、标签、任务、代码、表格、链接和图片内容块。
- 导图、大纲、文章和通读模式间的内容与阅读位置同步。
- 父子导图创建、提取、合并和双向导航。
- 全局搜索、Markdown/XMind/FreeMind 导入以及多格式导出。
- 本地图片保存、可选图床上传、多图床镜像和安全删除检查。
- 主题、布局、快捷键、只读锁定和嵌入预览。

## 3. 安装与运行

### 3.1 手动安装发布包

发布目录必须只包含：

```text
mindmap-studio/
├── main.js
├── manifest.json
└── styles.css
```

将目录复制到 Obsidian 仓库的 `.obsidian/plugins/` 下，重启 Obsidian 后启用插件。

### 3.2 从源码构建

要求：

- Node.js 20 或更高版本。
- npm。

```bash
npm ci
npm run verify
```

`npm run verify` 会依次执行单元测试、综合回归、文档检查、仓库检查、TypeScript 类型检查和生产构建。

开发监听：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

## 4. 数据模型与兼容

`.mindmap` 文档由根节点、子节点、显示设置、导航信息和兼容字段组成。详细字段见 `docs/DATA_MODEL.md`。

维护时必须遵守：

1. 不直接删除已发布字段；先提供读取兼容和迁移路径。
2. 所有读取入口统一经过模型解析和规范化。
3. 富内容修改后调用兼容字段同步函数。
4. 父子导图的 `parentPath`、`parentNodeId`、`parentTitle` 和节点 `submap` 引用必须成对维护。
5. 数据版本变化必须同步更新迁移文档和回归测试。

本次功能没有更改 `.mindmap` 数据版本或父子导图目录布局。统一阅读位置保存在插件设置的 `readingLocations` 中，不写入业务文档。

## 5. 架构

### 5.1 主要模块

```text
src/
├── main.ts                  插件生命周期、文件服务、子导图和图床编排
├── view.ts                  Obsidian 视图适配
├── settings.ts              设置模型与设置页
├── core/                    数据模型、节点树和序列化
├── editor/                  编辑器、富文本、拖放、历史和工具栏
├── render/                  布局、碰撞与静态渲染
├── article/                 文章结构、显示模式规则与统一阅读位置
├── search/                  全局搜索
├── import/                  导入与导出
└── utils/                   无 Obsidian 依赖的确定性工具
```

### 5.2 依赖方向

```text
Obsidian 生命周期与 UI
        ↓
main.ts / view.ts / settings.ts
        ↓
领域编排与编辑器
        ↓
core / render / article / import / search
        ↓
utils 纯函数
```

`utils` 不得反向依赖 Obsidian、编辑器或插件实例。这样可以在 Node.js 中直接测试安全校验和格式转换。

### 5.3 统一阅读位置

`src/article/reading-location.ts` 使用语义位置代替单一滚动百分比：

```text
文章族顶层文件
  └─ 目标物理文件
       └─ 目标节点 → 父节点 → 祖先 → 根节点
  └─ 父导图挂载节点 → 祖先 → 根节点
```

每条记录同时保存目标节点内部比例和视口锚点比例。切换导图、大纲、文章或通读时，编辑器先解析最新节点树，再恢复到同一节点；目标位于子导图时，非通读模式由视图层打开对应物理文件。节点、子导图或路径发生变化时按保存的祖先链逐级回退。文件重命名事件会同步更新阅读位置和旧阅读百分比的路径。

`src/article/display-mode.ts` 将大纲定义为会话级模式：它会在当前已打开视图间同步，但不会写成下次启动模式。旧设置中保存的 `outline` 会在加载时迁移为导图；导图不可见时回退到可见的文章或通读模式。

### 5.4 本次新增边界

#### 文件名工具

`src/utils/filename.ts` 负责：

- Unicode NFC 规范化。
- 控制字符、路径字符和跨平台非法字符清洗。
- Windows 保留设备名保护。
- 长度、尾随点和空格限制。
- 扩展名、时间戳、默认标题和 MIME 推断。

#### 图床工具

`src/utils/image-host.ts` 负责：

- HTTP(S) 端点校验。
- Header JSON 解析、名称检查和 CRLF 防护。
- multipart boundary、字段名、文件名和 MIME 构造。
- JSON/文本响应解析。
- 自定义字段路径和常见 URL 字段提取。
- 返回地址协议校验。

网络请求仍由 Obsidian `requestUrl` 执行；工具层不访问网络。

#### 子导图公共流程

`src/main.ts` 中：

- `buildSubmapDocument()` 统一创建文档、复制可选内容和写入导航元数据。
- `persistSubmapDocument()` 统一目录创建、路径避冲突和文件写入。
- `createSubmapFile()` 创建空子图。
- `extractToSubmap()` 复制当前节点内容与后代。

## 6. 图片与图床流程

### 6.1 本地保存

粘贴图片时：

1. 解析父导图目录和配置的资源目录。
2. 清洗父文件名和扩展名。
3. 生成本地时间戳。
4. 选择无冲突路径。
5. 写入二进制资源。

### 6.2 上传

上传时：

1. 校验图床端点为 HTTP(S)。
2. 解析并校验自定义 Header。
3. 根据 `raw` 或 `multipart` 模式构造请求体。
4. 发送请求。
5. 优先读取 JSON，失败时解析文本。
6. 按自定义路径和后备路径提取 HTTP(S) URL。
7. 更新节点镜像来源。

### 6.3 本地文件删除条件

仅当以下条件同时满足时才尝试删除本地资源：

- 至少一个远程来源已成功保存到当前导图。
- 当前导图已经持久化。
- 资源是仓库内真实文件。
- 当前导图其他节点没有继续引用。
- 其他 `.mindmap` 文件也没有引用。

上传部分失败时保留本地文件。

## 7. 测试策略

### 7.1 分层命令

```bash
npm run test:unit       # 独立纯函数单元测试
npm run test:regression # 原有跨模块综合回归
npm run test:docs       # JSDoc 和函数参考一致性
npm run test:repo       # 仓库结构、版本和清洁度
npm run test            # 上述全部测试
npm run build           # 类型检查和生产构建
npm run verify          # test + build
```

### 7.2 单元测试范围

当前 32 项独立测试覆盖：

- 大纲不作为启动模式、可见模式回退和持久化规则。
- 节点祖先链、跨子导图父级链、节点/文件缺失回退和比例规范化。
- 目录页与父挂载节点语义锚点、文章族切换写回顺序和多视图延迟写入隔离。
- 文件名非法字符、Unicode、保留名、长度、扩展名和 MIME。
- HTTP(S) 端点与非法协议。
- Header JSON、嵌套值、非法名称和换行注入。
- multipart 二进制结构、MIME 后备值和 boundary 注入。
- JSON/文本响应、自定义字段路径、数组路径和 URL 协议。

### 7.3 回归与手动验证

综合回归继续覆盖模型、布局、搜索、文章模式、导入导出、历史、拖放和源码/CSS 契约。发布前还应在 Obsidian 中完成：

- 新建、打开、编辑、保存、撤销和重做。
- 四种视图切换、跨子导图跳转、退出重开恢复和节点删除逐级回退。
- 子导图创建、提取、跳转、合并和删除。
- 本地图片、图床成功、图床失败和部分成功。
- 全局搜索、嵌入预览和主要导出格式。

详细清单见 `docs/TESTING.md`。

## 8. 注释规范

注释解释“为什么”和“边界”，不重复代码字面含义。

导出函数、公共方法、数据结构和安全关键私有方法使用 JSDoc，至少说明：

- 职责。
- 参数语义。
- 返回值。
- 可能抛出的错误。
- 数据兼容、安全条件或副作用。

禁止使用“执行某某逻辑”“该参数用于某流程”这类没有领域信息的模板化描述。修改旧方法时应顺手把其注释升级为具体语义，但不要为改注释制造大范围无关 diff。

## 9. 仓库与 CI

### 9.1 CI

GitHub Actions 和 GitLab CI 均执行：

```bash
npm ci
npm run verify
```

CI 使用 Node.js 20，并通过 npm 缓存减少安装时间。

### 9.2 仓库清洁度

以下内容不得提交：

```text
node_modules/
coverage/
dist/
.local-test-build/
.ua/
start-dashboard.bat
真实图床凭据
个人 Obsidian 仓库数据
```

`scripts/check-repository.mjs` 会自动检查主要规则。

## 10. Git 工作流

分支：

- `feature/<topic>`
- `fix/<topic>`
- `refactor/<topic>`
- `docs/<topic>`

提交使用 Conventional Commits：

```text
refactor(upload): extract validated image-host helpers
test(utils): cover filename and multipart edge cases
docs(repo): regenerate the complete project guide
ci(repo): add unified repository verification
```

本次交付建议按逻辑拆分为五个提交，详见 `docs/GIT_WORKFLOW.zh-CN.md`。

## 11. 发布与回滚

发布前：

```bash
npm ci
npm run verify
node scripts/sync-version.mjs <version>
npm run verify
```

版本必须同步：

- `package.json`
- `package-lock.json`
- `manifest.json`
- `versions.json`

正式发布包使用 `main.js`、`manifest.json` 和 `styles.css`。共享分支上的问题使用 `git revert` 回滚，不重写已公开历史。

## 12. 当前优化结论

本次交付完成了低风险、可验证的基础治理：

- 把文件名和图床输入处理从入口类抽成纯函数。
- 收紧 URL、Header、multipart 和响应地址校验。
- 合并重复的子导图初始化与写入流程。
- 新增快速单元测试和仓库结构检查。
- 重写 README 和统一项目说明，不再堆叠版本说明。
- 增加贡献、安全、CI、PR、Issue 和 Git 发布规范。
- 从源码交付中移除本地分析和临时构建产物。

仍需后续分阶段处理的主要技术债是 `src/editor/editor.ts` 和 `src/main.ts` 的职责过重，以及综合回归脚本过于集中。此类拆分涉及大量宿主交互，不应在缺少 Obsidian 集成测试时一次性重写。
