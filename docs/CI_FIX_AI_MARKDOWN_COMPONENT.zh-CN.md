# AI Markdown 渲染 Component 类型修复

## 故障

所有测试通过后，TypeScript 构建在 `src/ai/modal.ts` 失败：

```text
error TS2345: Argument of type 'this' is not assignable to parameter of type 'Component'.
Type 'AiAskModal' is missing the following properties from type 'Component':
load, onload, unload, onunload, and 6 more.
```

旧实现把 `AiAskModal` 自身作为 `MarkdownRenderer.render()` 的最后一个参数：

```ts
await MarkdownRenderer.render(this.app, answerText, result, sourcePath, this);
```

`AiAskModal` 继承自 `Modal`，并不是 Obsidian `Component`。`MarkdownRenderer` 的最后一个参数用于管理渲染过程中产生的子组件和事件生命周期，因此不能用类型断言掩盖。

## 修复

窗口内部创建独立的 `Component`：

```ts
private markdownRenderComponent: Component | null = null;
```

打开窗口时创建并加载：

```ts
this.markdownRenderComponent = new Component();
this.markdownRenderComponent.load();
```

渲染回答时传入该组件：

```ts
await MarkdownRenderer.render(
  this.app,
  answerText,
  result,
  this.options.sourcePath,
  this.markdownRenderComponent
);
```

关闭窗口时卸载：

```ts
this.markdownRenderComponent?.unload();
this.markdownRenderComponent = null;
```

同时增加会话编号。AI 请求在窗口关闭后返回时，不再更新已销毁的 DOM，也不会重新启用旧表单。

## 防回归

测试现在要求：

1. AI 窗口创建真正的 `Component`；
2. 渲染前调用 `load()`；
3. `MarkdownRenderer.render()` 使用该组件；
4. 禁止将 `this`（Modal）作为最后一个参数；
5. `onClose()` 调用 `unload()`；
6. 关闭后的异步结果受会话编号隔离。

## 验证命令

```bash
npm ci
npm run test
npm run build
node --check main.js
```

预期不再出现 `AiAskModal is missing ... Component` 的 TS2345 错误。
