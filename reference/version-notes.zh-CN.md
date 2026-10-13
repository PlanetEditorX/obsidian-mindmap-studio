# 版本与源码对应关系

- TypeScript 项目基线：用户此前上传的 1.55.0 源码（其 manifest/package 元数据仍标为 1.54.9），含上一轮行内编辑快捷键实现。
- 原安装版本：用户随后上传的 1.55.2 `main.js`，保存在 `reference/original-installed-1.55.2-main.js`。
- 本包根目录 `main.js`：基于该 1.55.2 实际运行文件修补后的测试版。
- TypeScript 文件 `src/editor/editor.ts`、`src/view.ts`、`src/main.ts` 已同步相应快捷键逻辑，可继续维护。
- 已确认原版 1.55.2 和 1.55.0 已有 main.js 的代码差异主要集中在文章快捷键处理，但未获得原版 1.55.2 的完整源码快照。因此此包不能保证与原 1.55.2 的每一份源码及依赖锁文件字节一致。
- 缺少 esbuild / obsidian 的构建依赖，根目录 main.js 不是在本次会话中从 TypeScript 完整重编译得到，运行逻辑按此前 1.55.2 的二进制补丁为准。正式发布应在安装依赖后 `npm run verify`、`npm run build`，重新生成功能一致的 main.js，并在真实 Obsidian 桌面端检查 Ctrl+Tab 占用。
- 版本元数据未做未经发布流程的手工递增。请勿把本包的 package.json/manifest.json 当成准确的 1.55.2 发布元数据。
