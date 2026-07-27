# 贡献指南

## 开始前

1. 阅读 `README.md`、`docs/ARCHITECTURE.md`、`docs/DATA_MODEL.md` 和 `docs/DEVELOPMENT.md`。
2. 搜索现有 Issue，避免重复实现。
3. 从最新 `main` 创建短生命周期分支。
4. 使用 Node.js 20 或更高版本和 `npm ci`。

## 开发

```bash
npm ci
npm run dev
```

修改应遵守以下边界：

- 数据兼容与规范化放在 `src/core/`。
- Obsidian 文件和跨文件能力放在插件服务层。
- 可确定逻辑优先放在 `src/utils/` 并增加单元测试。
- 可撤销编辑必须进入统一历史和保存链路。
- 外部 JSON 使用 `unknown` 并显式校验。

## 测试

提交前执行：

```bash
npm run verify
```

用户可见交互还应在独立 Obsidian 测试仓库完成手动冒烟。覆盖要求见 `docs/TESTING.md`。

## 文档

行为、数据、架构、测试或开发流程变化必须同步对应文档。用户可见变化加入 `CHANGELOG.md` 的“未发布”部分。README 只描述当前产品，不追加逐版本更新块。

## 提交与 PR

使用 Conventional Commits，例如：

```text
fix(search): preserve node replacement results
refactor(upload): validate image-host request data
test(model): cover legacy navigation normalization
```

PR 应说明目标、实现、兼容性、测试、风险和回滚方式。完整流程见 `docs/GIT_WORKFLOW.zh-CN.md`。
