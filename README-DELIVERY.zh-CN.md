# 完整源码交付说明

本目录包含 TypeScript `src/`、测试 `tests/`、文档 `docs/`、构建配置、样式以及根据你提供的 1.55.2 实际运行文件修补的 `main.js`。

**重要：** 这不是从原 1.55.2 tag 导出的逐字节源码。TypeScript 基线取自你此前上传的源码包，补上了本轮修复，并保留原 1.55.2 二进制作为参考。真实安装测试请使用本包内 `main.js` 和与原版对应的 `styles.css`、`manifest.json`（插件目录已有者建议继续保留原文件）。

详情参见 `reference/version-notes.zh-CN.md`。


## 本轮 CI 测试同步

2026-10-13：针对先前 GitHub Actions 的 9 个失败，更新 `tests/article-node-shortcuts.test.mjs`、`tests/node-creation-focus.test.mjs`、`tests/node-creation.test.mjs` 和测试文档。未修改 TypeScript 实现或根目录 `main.js`，安装包沿用你上传的已修补 1.55.2 运行文件；当前环境缺少 npm 依赖，**未重新构建**，在可安装依赖的机器请运行 `npm ci && npm run verify` 再确认。不要将本源码 ZIP 的 `package.json` 1.54.9 基线误当作实际已发布的 1.55.2 源码快照。
