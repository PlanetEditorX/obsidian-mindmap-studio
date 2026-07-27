# 当前代码边界与清理说明

## 目的

本轮清理将仓库收敛到当前公开的数据结构、设置模型和交互入口。已经没有调用方的实现直接删除，不再保留同名包装函数、重复设置、隐式别名或只为源码断言存在的分支。

## 已删除内容

### 插件入口和设置

- Markdown 后缀脑图的自动识别、菜单入口、打开重定向和文件转换服务。
- 早期插件目录的数据文件搬运逻辑。
- 单图床设置向多图床数组的运行时转换。
- 已被当前显示模式、工具栏和背景设置替代的初始化标记与重复配置。
- 独立的通读滚动百分比持久化；当前位置只保存为语义节点位置。

### 数据模型

- 文章编号的布尔别名；当前只使用 `articleNumberingMode` 和 `articleNumberingLevel`。
- 外观枚举的非公开别名。
- Markdown 围栏名称别名；当前只接受原始 JSON 和 `mindmap-json`。
- 未使用的 Wiki 链接收集导出和单文档 HTML 包装导出。
- 只为过渡存在的函数名称；内容同步统一使用 `syncNodeContentFields()`。

### 编辑器

- 未挂载的节点搜索弹窗及其 CSS。
- 单节点剪贴板包装函数和多套载荷名称；插件复制只写入当前多节点载荷。
- 已被当前富文本编辑器替代的样式选择器。
- 未读取的字段、导入、布局局部变量和尺寸设置。

### 仓库资源

- URL 编码或转义名称的重复示例文件。
- 一次性 CI 故障说明和累计迁移说明。
- 本地分析缓存、临时构建目录及启动脚本。

## 当前支持边界

### `.mindmap` 文件

- 原始 JSON。
- `mindmap-json` Markdown 围栏。
- 当前数据版本 `10` 的字段模型。

格式发生不兼容变化时，应提升数据版本，并在仓库外提供显式转换命令或工具；运行时不继续累积永久双轨解析。

### 剪贴板

插件内部节点复制格式为：

```json
{
  "type": "mindmap-studio-nodes",
  "nodes": []
}
```

通用文本导入仍支持 Markdown、缩进文本和 HTML 列表，因为这些属于正式输入能力，不是历史别名。

### 阅读位置

只保存 `readingLocations` 语义位置。通读百分比在渲染时根据滚动位置实时显示，不单独持久化。

## 防回归规则

- `tsconfig.json` 启用 `noUnusedLocals` 与 `noUnusedParameters`。
- 不配置自定义 `typeRoots`，`obsidian` 类型由 npm 包解析。
- `tests/repository-cleanup.test.mjs` 检查未引用插件 CSS 类和示例文件路径。
- `scripts/check-repository.mjs` 检查必需文档、版本一致性和临时产物。
- 函数参考由 `npm run docs:generate` 从当前源码重新生成。

## 发布注意

源码清理涉及运行时 TypeScript。发布前必须重新安装依赖并生成 `main.js`：

```bash
npm ci
npm run verify
```

没有重新构建的 `main.js` 不包含本轮清理结果。
