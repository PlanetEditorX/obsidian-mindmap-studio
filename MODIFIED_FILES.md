# 当前代码清理修改清单

## 运行时代码

- `src/main.ts`
  - 删除 Markdown 后缀脑图识别、自动转换、菜单和打开重定向。
  - 删除早期插件目录设置搬运、单图床设置转换和重复初始化分支。
  - 阅读位置改名只迁移语义状态，不再维护独立滚动百分比。
  - 内容同步统一调用 `syncNodeContentFields()`。
- `src/core/model.ts`
  - 删除文章编号布尔别名、外观枚举别名和围栏名称别名。
  - 删除未使用的 Wiki 链接收集导出。
  - 当前解析只支持原始 JSON、`mindmap-json` 和正式 Markdown 导入。
- `src/article/modes.ts`
  - 文章编号仅使用当前模式字段。
  - `tocDepth` 改为必需字段，不再回退到其他层级字段。
- `src/article/display-mode.ts`
  - 删除无效模式类型分支，保留当前显示模式规则。
- `src/editor/clipboard-import.ts`
  - 删除单节点包装函数和多套载荷名称。
  - 插件 JSON 只接受 `mindmap-studio-nodes`。
- `src/editor/editor-modals.ts`
  - 删除没有调用方的节点搜索弹窗。
- `src/editor/editor.ts`、`src/editor/editor-types.ts`、`src/view.ts`、`src/settings.ts`
  - 删除未使用导入、字段、尺寸配置和独立通读百分比持久化。
- `src/import/import-export.ts`
  - 删除没有调用方的单文档 HTML 包装导出。
- `src/render/layout.ts`
  - 删除未使用局部变量。
- `styles.css`
  - 删除旧视图类型选择器、孤立搜索弹窗样式、已更名富文本控件样式和其他未引用规则。
- `tsconfig.json`
  - 启用 `noUnusedLocals`、`noUnusedParameters`。
  - 删除自定义 `typeRoots`。

## 测试与检查

- `tests/repository-cleanup.test.mjs`
  - 检查 TypeScript 未使用项配置。
  - 检查插件 CSS 类引用。
  - 检查示例文件路径。
- `scripts/test.mjs`
  - 删除针对已移除名称和实现位置的源码断言。
  - 保留当前模块职责和行为契约。
- `scripts/check-docs.mjs`
  - 更新四模式文档要求。
- `scripts/check-repository.mjs`
  - 增加当前代码清理文档要求。
- `package.json`
  - 将仓库清洁度测试加入 `test:unit`。

## 示例

- 示例文件统一为 UTF-8 可读路径。
- 删除 `%xx`、`#Uxxxx` 和重复资源目录。
- 更新父子导图导航路径和当前文章编号字段。

## 文档

- 新增 `docs/CODE_CLEANUP.zh-CN.md`。
- 重写 `docs/MAINTENANCE_GUIDE.zh-CN.md`。
- 更新 README、项目说明、架构、数据模型、开发、测试、特殊功能和阅读位置说明。
- 重新生成 `docs/FUNCTION_REFERENCE.md`。
- 删除累计迁移说明和一次性 CI 故障说明。
- 更新 `CHANGELOG.md`、`TEST_RESULTS.md`、`MODIFIED_FILES.md` 和 Git 交付说明。
