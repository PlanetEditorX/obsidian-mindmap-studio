# 代码块行号重构修改清单

| 文件 | 变更 |
|---|---|
| `src/render/code-block.ts` | 新增四模式共享代码块渲染器；集中处理行数、围栏、设置优先级、主题、折叠、Markdown 高亮与真实 DOM 行号栏 |
| `src/view.ts` | 删除内联代码块实现，统一委托 `renderCodeBlock()` |
| `styles.css` | 删除 `code::before` 行号及光学基线补偿，改为真实行号栏/代码栏双栏布局；共享计算字体与内边距，并确保横向滚动不被导图节点样式覆盖 |
| `main.js` | 更新生产插件入口，包含新的共享代码块渲染逻辑 |
| `tests/code-block.test.mjs` | 新增行数、围栏、设置优先级、DOM 布局、主题清理、渲染集成、四模式调用和 CSS 结构测试 |
| `tests/question.test.mjs` | 删除已被新测试替代的旧伪元素、光学基线和内联阈值源码断言 |
| `package.json` | 将代码块测试加入 `test:unit` |
| `README.md` | 补充四模式统一代码块渲染说明和专项文档入口 |
| `docs/CODE_BLOCK_RENDERING.zh-CN.md` | 新增项目调用链分析、根因、DOM 结构、布局不变量、兼容性、测试与手工验收矩阵 |
| `docs/ARCHITECTURE.md` | 增加 `render/code-block.ts` 分层与四模式渲染流程 |
| `docs/DATA_MODEL.md` | 补全代码块显示字段，并说明行号只属于展示层 |
| `docs/SPECIAL_FEATURES.md` | 将旧光学补偿说明替换为真实 DOM 行号栏方案 |
| `docs/TESTING.md` | 增加代码块自动测试范围和四模式手工冒烟矩阵 |
| `docs/FUNCTION_REFERENCE.md` | 根据新增 TypeScript 接口、函数和 JSDoc 重新生成 |
| `CHANGELOG.md` | 记录代码块行号完整重构及四模式覆盖 |
| `TEST_RESULTS.md` | 更新最终验证结果、范围和环境说明 |
| `examples/中国文学示例.mindmap`、`examples/古诗.mindmap`、`examples/MindMap Assets/古诗/唐诗.mindmap` | 将源码包原有 `#Uxxxx` 编码路径规范化为仓库测试要求的可读 UTF-8 名称；内容不变 |

## 未修改的功能域

本次没有改变数据格式版本、节点编辑事务、撤销重做、导图布局、文章编号、阅读位置、父子导图、搜索、AI、图片、图床或导入导出行为。代码块编辑字段和现有节点/页面/全局设置优先级保持兼容。
