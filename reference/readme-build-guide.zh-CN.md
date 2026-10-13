# 编译与测试

1. `npm ci` 还原依赖。
2. `npm run test:unit` 执行项目原有测试，`node tests/article-hotkeys-1552.test.cjs` 执行本轮专项测试。
3. `npm run build` 从 TypeScript 重新构建。注意：构建依赖就绪后，重新构建的 main.js 应与本包的补丁行为人工对照检验。
4. 原源码基线中的 package/manifest 版本为 1.54.9；**编译打包时应按你实际的 1.55.2 发布元数据同步，不能直接把历史 update.json 作为最新更新源提交**。
5. 这一份 `main.js` 基于用户上传的 1.55.2 原运行代码执行二进制补丁，并非本会话新编译产物。
