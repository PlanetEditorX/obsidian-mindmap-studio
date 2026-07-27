# MindMap Studio 维护基线

## 维护目标

仓库只保留当前产品能力和明确使用中的公共数据。修改应优先减少重复状态、重复解析和跨层依赖，而不是新增长期兼容分支。

## 模块职责

- `src/core/`：当前数据模型、规范化、序列化和节点树操作。
- `src/article/`：文章结构、显示模式规则和语义阅读位置。
- `src/editor/`：四模式交互、编辑事务、富文本、拖放和弹窗。
- `src/main.ts`：Obsidian 生命周期、文件服务、子导图、图床和设置持久化。
- `src/view.ts`：`TextFileView` 与编辑器回调适配。
- `src/utils/`：不依赖 Obsidian 的确定性工具。

跨层新增能力应先扩展 `editor-types.ts` 契约，由视图提供宿主实现；编辑器不得直接访问插件实例或仓库适配器。

## 当前数据规则

- `.mindmap` 版本为 `10`。
- 有序 `content` 是节点正文结构。
- `text`、`richText` 和 `image` 是派生摘要字段，由 `syncNodeContentFields()` 统一同步。
- 文章编号只使用 `articleNumberingMode` 和 `articleNumberingLevel`。
- 显示位置只使用 `readingLocations` 语义记录。
- 当前插件剪贴板载荷为 `mindmap-studio-nodes`。

不得在 UI 层增加字段迁移。确需更改文件语义时，应提升数据版本并提供可审计的显式转换工具。

## 删除代码的判断标准

以下情况应直接删除：

1. 项目内没有调用方的导出、类、字段或样式。
2. 当前设置已经有唯一替代字段的重复配置。
3. 只转发到另一个函数且没有独立语义的包装 API。
4. 仅用于早期文件名、载荷名、枚举值或目录名的别名分支。
5. 只为过时源码正则断言保留的实现细节。
6. 一次性交付或故障文档已经失去维护价值。

以下内容不能按“未引用”简单删除：

- Obsidian 通过注册名称或反射调用的生命周期方法。
- HTML/CSS 中由动态字符串生成的类名。
- `manifest.json`、`versions.json` 等发布入口。
- 当前文件格式的可选字段。

## 编译与静态约束

`tsconfig.json` 必须保持：

```json
{
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

不要增加自定义 `typeRoots`。依赖安装后，TypeScript 应从 `node_modules/obsidian/obsidian.d.ts` 解析宿主类型。

## 测试分层

```bash
npm run test:unit
npm run test:regression
npm run test:docs
npm run test:repo
npm run build
npm run verify
```

- 单元测试覆盖纯工具、显示模式、语义位置和仓库清洁度。
- 综合回归覆盖跨模块行为与必要的 DOM/CSS 源码契约。
- 文档检查要求模块头和声明 JSDoc 完整。
- 仓库检查验证版本、必需文件和临时产物。
- 构建负责完整类型图与生产包。

源码契约测试应验证稳定的模块职责或公开行为，不应绑定已经抽取到工具层的内联表达式。

## 文档职责

- `README.md`：当前产品和入口。
- `docs/PROJECT_GUIDE.zh-CN.md`：完整项目说明。
- `docs/CODE_CLEANUP.zh-CN.md`：当前支持边界和已移除内容。
- `docs/DATA_MODEL.md`：当前文件结构。
- `docs/ARCHITECTURE.md`：依赖方向与数据流。
- `docs/TESTING.md`：测试边界。
- `docs/FUNCTION_REFERENCE.md`：从源码生成，不手工维护。
- `CHANGELOG.md`：版本历史。

## 发布前检查

1. 从空 `node_modules` 执行 `npm ci`。
2. 执行 `npm run verify`。
3. 确认 `main.js` 已由当前源码重新生成。
4. 确认源码包不含 `.git`、`node_modules`、分析缓存或真实凭据。
5. 在 Obsidian 测试仓库验证创建、保存、重开、四模式定位、子导图、图片和导入导出。
6. 四个版本文件必须一致。

## 后续拆分顺序

1. 将 `editor.ts` 中画布手势、通读渲染和节点弹窗编排继续拆为控制器。
2. 将 `main.ts` 中子导图与图片服务拆成可注入服务对象。
3. 将综合回归中的纯函数断言迁移到领域测试。
4. 为关键 DOM 交互增加宿主或浏览器集成测试。
