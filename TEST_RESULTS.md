# Windows CRLF 下文章空节点测试兼容性验证

# 文章后续文字块编辑与插入焦点验证

## 本次修改

- 后续文字块通过自身 `data-block-id` 进入编辑，不再因文章上下文刷新立即被重绘。
- 右键“在此块后插入文字”使用短时初始焦点保护，菜单关闭造成失焦时自动恢复目标块和末尾光标。
- 编辑真正结束时清除活动编辑标记，避免阻止后续正常刷新。

## 回归覆盖

- `tests/article-content-block.test.mjs`：后续文字块状态、精确块 ID、插入块焦点保护。
- `tests/node-creation.test.mjs`：文章模式自动聚焦调用契约。
- `tests/reading-editor-contract.test.mjs`：文章/大纲共享内联编辑入口。
- `scripts/test.mjs`：综合源码契约。

## 验证结果

- 针对性测试：`4 / 4` 通过。
- 完整单元测试：`130 / 130` 通过。
- 综合回归测试：通过，输出 `All MindMap Studio tests passed.`。
- 文档检查：`48` 个 TypeScript 模块中的 `855` 个具名声明均有 JSDoc。
- 仓库检查：通过。
- `npm run build`：通过，已同步生成 `main.js`。
- `node --check main.js`：通过。

## 本次修改

- `tests/node-creation.test.mjs` 在执行源码正则契约检查前统一将 CRLF/CR 换行规范化为 LF。
- 文章模式空节点渲染、自动聚焦和非空正文路径的运行逻辑未变。

## 验证结果

- LF 工作区：`node --test tests/node-creation.test.mjs`，`3 / 3` 通过。
- CRLF 模拟工作区：同一测试 `3 / 3` 通过。
- 原失败断言 `if (firstTextBlock?.text.trim())` 可在 Windows 与 CI 环境稳定识别。

# 文章模式节点快捷操作与空节点删除验证

## 本次修改

- 文章编辑模式的节点下方快捷操作改为高频集合：普通节点显示“添加同级、添加子节点、删除、更多”，根节点仅显示“添加子节点、更多”。
- 原“完整编辑”不再作为文章节点常驻按钮；“更多”复用右键完整菜单，并新增“节点设置”进入完整节点编辑器。
- 快捷按钮在 `pointerdown` 阶段阻止编辑器先失焦，删除操作直接使用按钮绑定的节点 ID，不再依赖可能变化的当前选择。
- 行内编辑器在 blur 时检查节点是否仍存在，避免已删除节点的迟到失焦回调再次保存或重绘。
- 右键 / 更多菜单在根节点上隐藏无效的“添加同级节点”和“删除节点”。

## 验证命令

```bash
node --test tests/article-context-edit.test.mjs
node --test tests/code-block.test.mjs tests/display-mode.test.mjs tests/settings-layout.test.mjs tests/node-creation.test.mjs tests/filename.test.mjs tests/global-search-contract.test.mjs tests/image-host.test.mjs tests/image-layout.test.mjs tests/image-source-candidates.test.mjs tests/reading-location.test.mjs tests/reading-editor-contract.test.mjs tests/article-context-edit.test.mjs tests/repository-cleanup.test.mjs tests/selection-format-toolbar.test.mjs tests/import-mode.test.mjs tests/ai.test.mjs tests/image-recognition.test.mjs tests/question.test.mjs
node scripts/check-docs.mjs
node scripts/check-repository.mjs
node --check main.js
```

另使用容器全局 TypeScript 对 `src/editor/editor.ts` 执行 `transpileModule` 语法诊断。

## 结果

- 文章节点操作专项测试：`8 / 8` 通过。
- 除依赖 `esbuild` 的插件更新测试外，广泛单元测试：`124 / 124` 通过。
- 文档检查：`48` 个 TypeScript 模块中的 `852` 个具名声明均有 JSDoc。
- 仓库检查：通过。
- `main.js` JavaScript 语法检查：通过。
- `src/editor/editor.ts` TypeScript 语法转译检查：通过。

## 环境限制

当前 npm 镜像缺少锁文件要求的 `w3c-keyname@2.2.8`，并且无法提供 `esbuild` 包，因此未执行完整 `npm run verify` 和真实生产构建。运行版 `main.js` 已与 TypeScript 源码同步修改，并由专项源码—产物契约测试和 JavaScript 语法检查验证。测试期间创建的全局 TypeScript 临时链接不会进入交付压缩包。

# 设置分类与主题外观优化验证报告

## 本次修改

- 将“资源文件夹”“在文件浏览器隐藏资源文件夹”“文件浏览器自定义筛选”及其条件输入项统一移动到“文件与资源”类别。
- 在插件设置的“连线与分支”类别新增“分支外观”全局默认值，支持“圆润卡片分支（曲线）”和“圆角分支（折线）”；当前脑图在“主题与外观”中保存的页面设置仍具有更高优先级。
- 重新整理“主题与外观”弹窗，将设置按“主题模板、画布与字体、节点与文字、连线与分支、文章编号与目录、页面代码设置”分组；桌面端使用 1280px 上限的两列独立纵向卡片流，窄屏切换单列，并允许文字样式选项换行，避免大块空白和按钮文字溢出。
- 同步更新 `main.js`、样式、测试、功能文档和变更记录。

## 已执行检查

```bash
npm run test
node --check main.js
```

另使用容器内全局 TypeScript 对以下变更文件执行语法转译检查：

- `src/settings.ts`
- `src/main.ts`
- `src/editor/editor.ts`

## 结果

- 单元测试：`115 / 115` 通过，其中设置分类与外观布局专项测试 `3 / 3` 通过。
- 综合回归测试：通过，输出 `All MindMap Studio tests passed.`。
- 文档检查：`48` 个 TypeScript 模块中的 `847` 个具名声明均有 JSDoc。
- 仓库检查：通过。
- `main.js` JavaScript 语法检查：通过。
- 三个变更 TypeScript 文件的语法转译检查：通过。

## 环境限制

当前容器的 npm 镜像无法提供锁文件要求的完整 `esbuild`、`obsidian`、`fflate` 等依赖，因此未执行真实的完整生产构建。测试阶段使用了仅存在于工作目录、不会进入交付 ZIP 的兼容依赖链接与测试构建适配层；单元测试、综合回归、文档检查和仓库检查均已通过。`main.js` 已依据 TypeScript 源码进行确定性同步，并通过语法检查和源码/产物关键契约核对。

未在真实 Obsidian 桌面客户端中执行像素级手工冒烟。发布前建议重点检查：设置页分类顺序、全局分支外观对未覆盖页面的生效情况、当前脑图页面覆盖优先级，以及不同窗口宽度下“主题与外观”弹窗的双栏/单栏切换。

# 子导图默认节点、文章空节点编辑与节点最低高度验证

## 本次修改

- 新建子导图保留标准的“主题 1”“主题 2”两个初始子节点。
- 文章编辑模式为无内容末端节点生成真实的可编辑占位行，添加子节点后的 `beginInlineEdit()` 可直接定位并聚焦。
- 导图节点、布局初始估算和浏览器实测尺寸统一采用 36px 最低高度。

## 验证命令

```bash
node --test tests/node-creation.test.mjs
node --test tests/node-creation.test.mjs tests/reading-editor-contract.test.mjs tests/repository-cleanup.test.mjs
node --test tests/code-block.test.mjs tests/display-mode.test.mjs tests/settings-layout.test.mjs tests/node-creation.test.mjs tests/filename.test.mjs tests/global-search-contract.test.mjs tests/image-host.test.mjs tests/image-layout.test.mjs tests/image-source-candidates.test.mjs tests/reading-location.test.mjs tests/reading-editor-contract.test.mjs tests/repository-cleanup.test.mjs tests/selection-format-toolbar.test.mjs tests/import-mode.test.mjs tests/ai.test.mjs tests/image-recognition.test.mjs tests/question.test.mjs
node scripts/check-docs.mjs
node scripts/check-repository.mjs
node --check main.js
```

## 结果

- 新增专项测试：`3 / 3` 通过。
- 新增专项测试与阅读编辑、仓库清理联合回归：`24 / 24` 通过。
- 在当前可用依赖范围内执行的广泛单元测试：`116 / 116` 通过；仅未运行依赖缺失的插件更新测试。
- 文档检查：`48` 个 TypeScript 模块中的 `847` 个具名声明均有 JSDoc。
- 仓库检查：通过。
- `main.js` JavaScript 语法检查：通过。
- `src/main.ts`、`src/editor/article-renderer.ts`、`src/editor/editor.ts`、`src/render/layout.ts` 的 TypeScript 语法转译检查：通过。

## 环境限制

当前 npm 镜像缺少锁文件中的 `w3c-keyname@2.2.8`，无法安装完整依赖并执行真实 `esbuild` 生产构建。`main.js` 已与源码同步修改，并通过 JavaScript 语法检查及源码/产物关键契约核对。


## CI 回归补充修复

- 将普通正文渲染与新建空节点占位拆成两个独立分支：`if (firstTextBlock?.text.trim())` 负责已有正文，`else if (!options.readOnly && blocks.length === 0)` 只负责完全无内容块的新节点。
- 因而仅含表格、图片、代码等内容块的文章节点不会生成空正文占位，同时保留右键新增空白子节点后的直接聚焦输入能力。
- 已同步 `src/editor/article-renderer.ts`、`main.js` 与 `tests/node-creation.test.mjs`。

### 补充验证

- `node --test tests/node-creation.test.mjs`：`3 / 3` 通过。
- 除依赖 `esbuild` 的插件更新测试外，广泛单元测试：`116 / 116` 通过。
- 文档检查：通过，`48` 个 TypeScript 模块中的 `847` 个具名声明均有 JSDoc。
- 仓库检查：通过。
- `main.js` JavaScript 语法检查：通过。
- 当前容器缺少 `esbuild`，无法本地完整执行 `scripts/test.mjs`；CI 日志中唯一失败的 `if (firstTextBlock?.text.trim())` 契约已恢复，并由专项测试同时锁定空节点占位分支。

# 文章模式右键编辑行为验证

## 本次修改

- 文章编辑模式中的“编辑节点”改为“编辑当前内容”，直接聚焦当前章节标题或正文，不再打开导图节点编辑弹窗。
- 仅含图片、表格、代码等内容且没有正文的节点显示“添加正文”，创建可输入的临时正文行；未输入内容时失焦自动移除。
- 子导图标题普通点击仍进入子导图，只有右键编辑、F2 或文章内编辑按钮会显式进入标题行内编辑。
- 文章阅读模式沿用只读菜单，不显示编辑入口；导图和大纲继续打开完整节点编辑器。
- 图片块的“自定义尺寸或替换图片”仍进入完整节点编辑器，避免被文章行内编辑分流影响。

## 验证结果

- 文章右键编辑专项测试：`5 / 5` 通过。
- 与新建空节点、阅读编辑契约联合测试：`25 / 25` 通过。
- 除依赖 `esbuild` / `fflate` 的插件更新测试外，广泛单元测试：`121 / 121` 通过。
- 文档检查：通过，`48` 个 TypeScript 模块中的 `851` 个具名声明均有 JSDoc。
- 仓库检查：通过。
- `src/editor/editor.ts`、`src/editor/article-renderer.ts` TypeScript 语法转译检查：通过。
- `main.js` JavaScript 语法检查：通过。

## 环境限制

当前 npm 镜像缺少锁文件要求的 `w3c-keyname@2.2.8`，因此无法安装完整依赖；`scripts/test.mjs` 和插件更新测试依赖 `esbuild`，本地未能执行，真实生产构建也未重新运行。运行版 `main.js` 已按源码同步修改，并由专项源码—产物契约测试和 JavaScript 语法检查验证。
