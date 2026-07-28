# 图片识图、OCR 与截图修改清单

| 文件/目录 | 变更 |
|---|---|
| `src/vision/recognition.ts` | 图片范围收集、识图提示词、结果规范化、不可变预览、过期校验与原位置替换 |
| `src/vision/local-ocr.ts` | 桌面端按需调用本机 Tesseract，参数不经过 shell并清理临时文件 |
| `src/vision/modal.ts` | 原图与可编辑识别文字并排预览、取消和确认替换 |
| `src/utils/desktop-capture.ts` | macOS/Windows/Linux 系统截图、可选最小化、剪贴板 PNG 读取与窗口恢复 |
| `src/ai/protocol.ts`、`src/ai/client.ts` | OpenAI 兼容多模态消息、图片 Data URL 与视觉识图请求 |
| `src/ai/edit.ts`、`src/ai/modal.ts` | 新增识图操作模式和独立提示草稿，批量结果渲染与复制 |
| `src/editor/editor.ts`、`editor-types.ts` | 图片右键识图、截图插入目标快照、撤销保存链路、工具栏入口与自动识图 |
| `src/editor/article-renderer.ts`、`outline-renderer.ts` | 图片右键识图和内容块定位标记 |
| `src/view.ts`、`src/main.ts` | 插件服务回调、顺序批量识图、图片读取、截图命令与设置规范化 |
| `src/settings.ts` | AI/本地 OCR 模式、Tesseract、截图隐藏与截图后自动识图设置 |
| `styles.css` | 图片识图对比预览样式 |
| `tests/ai.test.mjs`、`tests/image-recognition.test.mjs` | 多模态协议、UI 契约、识图替换、OCR、截图与移动端兼容测试 |
| `README.md`、`CHANGELOG.md`、`docs/*.md` | 用户说明、架构、测试、开发指南及新增专项文档 |
| `docs/FUNCTION_REFERENCE.md` | 按当前 TypeScript/JSDoc 重新生成函数参考 |
| `main.js` | 已重新构建并包含全部新增功能 |
| `examples/` | 将编码名称示例恢复为可读 UTF-8 路径，以满足仓库一致性检查 |
| `package.json` | 将新增测试加入 `test:unit` |
| `TEST_RESULTS.md` | 记录本轮完整自动验证和环境说明 |
