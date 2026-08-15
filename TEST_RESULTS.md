# Test Results

版本：1.45.7

## 本轮问题

- 用户反馈：全局搜索或当前导图族搜索点击匹配项并跳转到文章位置后，再通过右键菜单选择“编辑当前内容/添加正文”，行内编辑器会刚进入就立即退出。
- 搜索结果导航本身已经在 1.45.3 统一先关闭搜索 Modal；本轮继续追踪后确认，退出发生在文章右键菜单回调之后：菜单回调立即聚焦 `contenteditable`，而 Obsidian 随后的菜单关闭阶段会回收焦点，使新编辑器马上收到 `blur`。
- 现有 `activateInlineEditable(..., protectInitialFocus)` 已具备短暂焦点保护能力，但文章右键菜单编辑入口此前没有把该保护参数传入，因此搜索跳转后更容易稳定暴露这一时序。

## 本轮实现

- `editSelected()` 新增可选 `protectInitialFocus` 参数；文章模式会继续把该参数传给 `editSelectedArticleContent()`，导图/大纲的完整节点编辑路径不变。
- 文章右键菜单的“编辑当前内容/添加正文”现在调用 `editSelected(undefined, true)`，只为菜单触发的行内编辑启用初始焦点保护。
- 已有正文时通过 `activateInlineEditable(inlineElement, true, protectInitialFocus)` 聚焦；仅含图片/表格/代码等内容时创建的临时正文行也使用同一保护。
- `activateInlineEditable()` 原有机制保持不变：保护窗口内若收到菜单焦点回收导致的 `blur`，下一帧重新取得焦点；短暂窗口结束后移除保护标记，普通失焦继续按既有规则提交。
- 双击正文、键盘快速编辑、Space/F2、正常失焦保存和搜索索引/导航逻辑均未改变。
- `main.js` 已按 TypeScript 源码等价同步 1.45.7 运行逻辑。

## 自动验证

- `node --test tests/article-context-edit.test.mjs tests/reading-editor-contract.test.mjs tests/global-search-contract.test.mjs`：**50 / 50 通过**。
- `node node_modules/typescript/bin/tsc --noEmit --skipLibCheck`：通过。
- `npm run test:docs`：通过，**56 个源码模块、1136 个具名声明**满足文档覆盖。
- `npm run test:repo`：通过。
- `node --check main.js`：通过。
- `npm run verify`：已执行；单元测试共 **354 项，343 通过 / 11 失败**。11 项均在需要 esbuild 的初始化阶段失败，原因是上传源码只包含 Windows `@esbuild/win32-x64`，当前 Linux 环境需要 `@esbuild/linux-x64`。
- `npm run test:regression`：被同一 esbuild 平台依赖阻断。
- `npm run build`：TypeScript 前置检查通过，随后生产 esbuild 被同一平台依赖阻断。
- 因此本轮不能声称完整 `npm run verify` 全绿；正式发布前仍需在当前平台正常依赖环境执行 `npm ci && npm run verify`，用源码重新生产构建 `main.js`。

## 仍需真实 Obsidian 手工验证

1. 完整替换/重载 1.45.7 插件，打开“全局搜索所有导图”，点击文章模式中的匹配项，确认搜索弹窗退出且目标位置正确落地。
2. 在 MindMap Studio 视图按 `Ctrl/Cmd+F` 打开当前导图族搜索，重复同一验证。
3. 在跳转后的目标节点右键选择“编辑当前内容”，确认编辑框保持激活，不会立即退出。
4. 对仅含图片/表格/代码、需要“添加正文”的文章节点重复验证。
5. 双击正文和键盘快速编辑后点击页面其他位置，确认仍正常失焦提交，没有被焦点保护长期锁住。

## 交付说明

- 本轮没有修改 `.mindmap` 数据格式、搜索索引格式、替换逻辑或搜索快捷键。
- 安装包 SHA-256：`10de29533723c911562b54802d1d46fab7569f42332438529f0e255f86afaa4d`。
- 当前 `main.js` 是在上传的 1.45.6 bundle 上按 1.45.7 TypeScript 源码做的等价同步，并经过语法、类型和专项 bundle 契约验证；正式发布仍建议在正常当前平台依赖环境重新生产构建。

## 本轮安装包

- 版本：1.45.7
- 安装 ZIP：`mindmap-studio-1.45.7-525251.zip`
- SHA-256：`10de29533723c911562b54802d1d46fab7569f42332438529f0e255f86afaa4d`
