# 开发与维护指南

## 1. 环境

```bash
npm ci
npm test
npm run build
```

- `npm test`：运行模型、布局、文章模式、搜索等行为测试，并执行源码注释覆盖检查。
- `npm run docs:generate`：根据源码 JSDoc 重新生成完整函数参考。
- `npm run docs:check`：单独检查模块注释、声明注释和特殊功能文档。
- `npm run build`：TypeScript 类型检查后生成 `main.js`。

## 2. 注释规范

所有以下声明必须有 JSDoc：

- 类型别名。
- 接口。
- 类。
- 构造函数。
- 顶层函数。
- 类方法，包括私有方法。

函数注释至少应说明：

1. 为什么存在，而不仅是复述函数名。
2. 输入参数含义。
3. 返回值含义。
4. 是否修改文档、DOM、索引或仓库。
5. 特殊兼容和失败行为。

关键流程使用 `@remarks` 提醒维护者同步检查数据兼容、撤销保存链路和测试。

匿名事件回调不要求单独 JSDoc，但复杂回调内部应使用行内注释解释非显然分支。

## 3. 文档维护

源码注释是函数级说明的权威来源。修改函数后：

```bash
npm run docs:generate
npm run docs:check
```

架构或特殊功能发生变化时，还应更新：

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/SPECIAL_FEATURES.md`
- `README.md`
- `CHANGELOG.md`

## 4. 版本更新

发布补丁版本时同步修改：

- `package.json`
- `manifest.json`
- `versions.json`
- `CHANGELOG.md`

数据结构兼容级别由 `MindMapDocument.version` 单独控制。插件版本升级不一定需要提高数据版本。

## 5. 测试重点

### 模型层

- 旧文件解析。
- 无效输入规范化。
- 显式 `false` 样式保留。
- 富文本编辑后样式迁移。
- 内容块与旧字段同步。

### 布局层

- 折叠节点。
- 自定义宽度和最小高度。
- 自动换行。
- 左右布局。
- 渐细线宽实际达到最小值。

### 文章模式

- 末端正文不编号。
- 跳过编号不占序号。
- 子导图延续父级深度。
- 顶层目录递归和循环保护。

### 搜索

- 折叠节点。
- 子导图深层节点。
- 表格和代码。
- 文件重命名和删除。
- 点击结果后定位。

### 图片

- 多镜像候选顺序。
- 本地回退。
- 任一图床失败时不删除本地文件。
- 远程更新后兼容字段同步。

## 6. 发布包结构

安装 ZIP 必须只有：

```text
mindmap-studio/
├── main.js
├── manifest.json
└── styles.css
```

源码 ZIP 应排除：

- `node_modules`
- 临时构建目录
- 发布缓存目录

发布前在全新目录执行 `npm ci`、`npm test` 和 `npm run build`，避免本地缓存掩盖依赖或生成问题。
