# Test Results

版本：1.38.7

- 单元测试：265 / 265 通过
- 综合回归：通过
- TypeScript 类型检查：通过
- 文档覆盖检查：通过（52 个源码模块、1029 个具名声明）
- 仓库检查：通过
- 生产构建：通过，`main.js` 已重新生成

本轮专项验证：

- 文章缓存预扫描阶段只创建占位、计算节点指纹并记录候选缓存，不再同步执行整篇缓存 HTML 的恢复、清洗和交互 hydration。
- 命中缓存的章节恢复被纳入与新渲染相同的 `requestAnimationFrame` 帧预算；当前焦点及高优先级章节先恢复，离屏章节随后分批补齐，避免二次打开仍被整篇同步恢复阻塞首屏。
- 每次文章渲染使用 `WeakMap<MindMapNode, MindMapContentBlock[]>` 记忆节点内容块；标题判断、缓存判定、指纹计算和正文渲染复用同一规范化结果，避免同一节点重复解析。
- 缓存章节 hydration 只扫描一次 `[data-block-id]` 建立索引，再在同 ID 小桶中用 `matches()` 精确匹配；不再为每个内容块重复查询整段 DOM，块数量较大时由近似二次扫描收敛为线性索引加局部查找。
- `buildArticleNodeInfo()` 支持注入已记忆的主文本读取器，并在一次子节点遍历中同时计算“同级存在标题”和末端节点数量，减少重复树遍历。
- 缓存安全边界保持不变：含 `script`、`iframe`、`object`、`embed` 或事件属性的缓存 HTML 会被拒绝或清理；代码块章节仍重新渲染，其他安全章节继续复用。
- 1.38.6 的节点局部指纹、LRU 顺序、Windows/Linux 路径规范化和标准 UTF-8 中文 ZIP 路径兼容继续保留。

交付包验证：

- 源码 ZIP 第一层目录固定为 `obsidian-mindmap-studio/`，排除 `node_modules/`、`.git/`、运行时缓存、临时目录和嵌套 ZIP，并按仓库交付规则排除本轮未修改的 `examples/`。
- 安装 ZIP 第一层目录固定为 `mindmap-studio/`，只包含 `main.js`、`manifest.json` 和 `styles.css`。
- Codex ZIP 第一层目录固定为 `Codex/`，外部文件名严格使用 `Codex-1.38.7-handoff-485107.zip`。
- Codex ZIP 的中文目录和文件名使用标准 UTF-8 主文件名和 general-purpose bit 11，不依赖 `0x7075` 扩展字段；Linux Info-ZIP 实际解压后不存在字面量 `#Uxxxx`。
- 工作树中的三个中文 examples 路径仍保持规范名称；它们因本轮未修改而按交付规则不重复放入源码 ZIP。
- 安装 ZIP SHA-256：`9f10ec493846678336e4ec5168c24ee5c7bd82ab3af93c69819dc9ecf1e40352`，已写入 `update.json`。

仍需真实 Obsidian 手工验证：

- 在 Win10 中使用原先约 80 KB 的深层文章测试首次打开、二次打开和完全重启后的缓存命中，确认当前/焦点章节快速显示，离屏章节补齐期间界面不冻结。
- 在缓存分批恢复期间立即滚动、按 PageDown 或跳转目录，确认阅读位置不会被后台补齐拉回顶部。
- 缓存命中后验证图片、表格、题目、链接和行内编辑等交互均已正确 hydration。
- 打开含代码块的文章，确认代码块章节重新渲染，而其他安全章节仍从缓存恢复。
- 在 Win10 与 Linux 使用完整仓库或上一轮含 examples 的源码包时，继续确认三个中文 examples 路径可读；本轮源码 ZIP 按规则不重复包含未修改 examples。
