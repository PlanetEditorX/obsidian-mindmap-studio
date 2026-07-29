import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let codeBlock;
let cleanup;
let editorSource;
let contentModalSource;

before(async () => {
  const [loaded, editor, contentModal] = await Promise.all([
    loadTypeScriptModule("src/render/code-block.ts"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/content-modals.ts", "utf8")
  ]);
  codeBlock = loaded.module;
  cleanup = loaded.cleanup;
  editorSource = editor;
  contentModalSource = contentModal;
});

test("code insertion appends blocks and block menus remove only the targeted code or table", () => {
  assert.match(contentModalSource, /\["dockerfile", "Dockerfile"\]/);
  assert.match(contentModalSource, /\["ini", "INI"\]/);
  assert.match(editorSource, /private appendCodeBlock\(node: MindMapNode, code: MindMapCodeBlock\): void[\s\S]*nodeContentBlocks\(node\), \{ id: newId\(\), type: "code", code \}/);
  assert.match(editorSource, /new CodeEditModal\(this\.app, undefined, \(code\) =>[\s\S]*appendCodeBlock\(selected, code\)/);
  assert.match(editorSource, /private removeStructuredBlock\(node: MindMapNode, blockId: string\): void[\s\S]*block\.id !== blockId/);
  assert.match(editorSource, /openTableBlockContextMenu\(event, node, tableData, blockId\)/);
  assert.match(editorSource, /openCodeBlockContextMenu\(event, node, codeData, blockId\)/);
  assert.doesNotMatch(editorSource, /private removeStructuredBlocks\(/);
});

test("node context menu appends a text block and starts editing that exact block", () => {
  assert.match(editorSource, /private appendTextBlock\(node: MindMapNode\): string[\s\S]*type: "text", text: ""/);
  assert.match(editorSource, /private insertTextBlock\(\): void[\s\S]*appendTextBlock\(selected\)[\s\S]*beginInlineEdit\(selected\.id, blockId, true\)/);
  assert.match(editorSource, /setTitle\("插入文字"\)\.setIcon\("text-cursor-input"\)\.onClick\(\(\) => this\.insertTextBlock\(\)\)/);
});

test("clearing a text block removes it unless it is the node's only content block", () => {
  const inlineEdit = editorSource.match(/private beginInlineEdit\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(inlineEdit, /if \(!normalized\.text\.trim\(\) && blocks\.length\) return/);
  assert.match(inlineEdit, /if \(!normalized\.text\.trim\(\) && blocks\.length > 1\) blocks\.splice\(blockIndex, 1\)/);
});

test("mind-map code blocks use double click for editing", () => {
  const renderNodeCode = editorSource.match(/private renderNodeCode\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(renderNodeCode, /block\.addEventListener\("dblclick", \(event\) => \{[\s\S]*openCodeBlockEditor\(node, codeData, blockId\)/);
  assert.doesNotMatch(renderNodeCode, /block\.addEventListener\("click",[\s\S]{0,180}openCodeBlockEditor/);
});

test("collapsed code blocks recompute branch positions from measured node heights", () => {
  assert.match(editorSource, /details\.mms-code-collapsed[\s\S]*addEventListener\("toggle", \(\) => \{[\s\S]*requestMindMapLayoutAnimation\(\)[\s\S]*scheduleMeasuredMindMapLayout\(\)/);
  assert.match(editorSource, /computeLayout\(this\.document\.root, this\.document\.layout[\s\S]*appearance, measured\)/);
  assert.match(editorSource, /const previousNodeRects = this\.captureMindMapNodeRects\(\);[\s\S]*playMindMapLayoutAnimation\(previousNodeRects\)/);
});

after(() => cleanup?.());

class FakeClassList {
  values = new Set();
  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
}

class FakeStyle {
  values = new Map();
  setProperty(name, value) { this.values.set(name, value); }
  getPropertyValue(name) { return this.values.get(name) ?? ""; }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.classList = new FakeClassList();
    this.style = new FakeStyle();
    this.children = [];
    this.attributes = new Map();
    this.parentElement = null;
    this.textContent = "";
    this.computedStyle = {};
    this.dataset = {};
  }

  set className(value) {
    this.classList = new FakeClassList();
    value.split(/\s+/).filter(Boolean).forEach((name) => this.classList.add(name));
  }

  get className() {
    return [...this.classList.values].join(" ");
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this.children.forEach((child) => { child.parentElement = null; });
    this.children = [];
    children.forEach((child) => this.appendChild(child));
  }

  insertBefore(child, reference) {
    const index = this.children.indexOf(reference);
    assert.notEqual(index, -1, "reference child must exist");
    child.parentElement = this;
    this.children.splice(index, 0, child);
    return child;
  }

  querySelector(selector) {
    if (selector === ":scope > .mms-code-line-numbers") {
      return this.children.find((child) => child.classList.contains("mms-code-line-numbers")) ?? null;
    }
    if (selector === ":scope > code") {
      return this.children.find((child) => child.tagName === "CODE") ?? null;
    }
    if (selector === "pre") {
      if (this.tagName === "PRE") return this;
      for (const child of this.children) {
        const match = child.querySelector("pre");
        if (match) return match;
      }
    }
    return null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }
}

function createFakeDocument() {
  const ownerDocument = {
    defaultView: {
      getComputedStyle: (element) => ({
        paddingTop: "10px",
        paddingRight: "12px",
        paddingBottom: "10px",
        paddingLeft: "12px",
        fontFamily: "MindMap Mono",
        fontSize: "13px",
        fontWeight: "400",
        lineHeight: "20px",
        letterSpacing: "0px",
        ...element.computedStyle
      })
    },
    createElement: (tagName) => new FakeElement(tagName, ownerDocument)
  };
  return ownerDocument;
}

function createCodeDom() {
  const ownerDocument = createFakeDocument();
  const pre = new FakeElement("pre", ownerDocument);
  const code = new FakeElement("code", ownerDocument);
  pre.appendChild(code);
  return { pre, code };
}

test("code line helpers preserve logical blank lines and fence safety", () => {
  assert.equal(codeBlock.countCodeLines(""), 1);
  assert.equal(codeBlock.countCodeLines("a\nb"), 2);
  assert.equal(codeBlock.countCodeLines("a\r\nb\r"), 3);
  assert.equal(codeBlock.countCodeLines("a\n"), 2);
  assert.equal(codeBlock.buildCodeLineNumberText(3), "1\n2\n3");
  const markdown = codeBlock.buildFencedCodeMarkdown({ language: "ts", code: "const fence = ```;" });
  assert.match(markdown, /^````ts\n/);
  assert.match(markdown, /\n````$/);
});

test("code presentation preserves node precedence and automatic thresholds", () => {
  const defaults = {
    collapsed: true,
    showLineNumbers: false,
    theme: "obsidian",
    autoExpandMaxLines: 2,
    autoLineNumbersMinLines: 2
  };
  assert.deepEqual(codeBlock.resolveCodeBlockPresentation(
    { code: "a\nb", language: "text" },
    { codeCollapsed: true, codeShowLineNumbers: false, codeTheme: "github" },
    defaults
  ), {
    collapsed: false,
    showLineNumbers: false,
    theme: "github",
    lineCount: 2
  });
  assert.deepEqual(codeBlock.resolveCodeBlockPresentation(
    { code: "a\nb\nc", collapsed: false, showLineNumbers: false, theme: "dracula" },
    { codeCollapsed: true, codeShowLineNumbers: true, codeTheme: "github" },
    defaults
  ), {
    collapsed: false,
    showLineNumbers: false,
    theme: "dracula",
    lineCount: 3
  });
});

test("line-number layout creates a real sibling gutter with identical metrics", () => {
  const { pre, code } = createCodeDom();
  codeBlock.installCodeLineNumberLayout(pre, code, 12);
  const gutter = pre.children[0];
  assert.equal(gutter.classList.contains("mms-code-line-numbers"), true);
  assert.equal(gutter.textContent, Array.from({ length: 12 }, (_, index) => index + 1).join("\n"));
  assert.equal(gutter.attributes.get("aria-hidden"), "true");
  assert.equal(pre.children[1], code);
  assert.equal(pre.classList.contains("mms-code-with-line-numbers"), true);
  assert.equal(code.classList.contains("mms-code-content"), true);
  assert.equal(pre.style.getPropertyValue("--mms-code-font-family"), "MindMap Mono");
  assert.equal(pre.style.getPropertyValue("--mms-code-font-size"), "13px");
  assert.equal(pre.style.getPropertyValue("--mms-code-font-weight"), "400");
  assert.equal(pre.style.getPropertyValue("--mms-code-line-height"), "20px");
  assert.equal(pre.style.getPropertyValue("--mms-code-letter-spacing"), "0px");
  assert.equal(pre.style.getPropertyValue("--mms-code-padding-top"), "10px");
  assert.equal(pre.style.getPropertyValue("--mms-code-padding-bottom"), "10px");

  codeBlock.installCodeLineNumberLayout(pre, code, 2);
  assert.equal(pre.children.length, 2, "re-rendering must replace rather than duplicate the gutter");
  assert.equal(pre.children[0].textContent, "1\n2");
});

test("shared renderer clears stale themes and augments Markdown-highlighted DOM", async () => {
  const ownerDocument = createFakeDocument();
  const container = new FakeElement("div", ownerDocument);
  container.classList.add("mms-code-theme-monokai");
  let renderedMarkdown = "";
  const renderMarkdown = (markdown, target) => {
    renderedMarkdown = markdown;
    const pre = new FakeElement("pre", ownerDocument);
    const code = new FakeElement("code", ownerDocument);
    pre.appendChild(code);
    target.appendChild(pre);
  };
  const defaults = {
    collapsed: false,
    showLineNumbers: true,
    theme: "github",
    autoExpandMaxLines: 0,
    autoLineNumbersMinLines: 0
  };

  await codeBlock.renderCodeBlock({
    block: { language: "ts", code: "const a = 1;\nconst b = 2;" },
    container,
    defaults,
    renderMarkdown
  });

  assert.match(renderedMarkdown, /^```ts\n/);
  assert.equal(container.classList.contains("mms-code-render-root"), true);
  assert.equal(container.classList.contains("mms-code-theme-monokai"), false);
  assert.equal(container.classList.contains("mms-code-theme-github"), true);
  const pre = container.querySelector("pre");
  assert.equal(pre.classList.contains("mms-code-frame"), true);
  assert.equal(pre.dataset.lineCount, "2");
  assert.equal(pre.children[0].textContent, "1\n2");
  assert.equal(pre.children[1].classList.contains("mms-code-content"), true);

  await codeBlock.renderCodeBlock({
    block: { language: "text", code: "plain", showLineNumbers: false, theme: "obsidian" },
    container,
    defaults,
    renderMarkdown
  });
  assert.equal(container.classList.contains("mms-code-theme-github"), false);
  assert.equal(container.querySelector("pre").children.length, 1);
});

test("all four display modes use the same host callback and no pseudo-element line numbers remain", async () => {
  const [viewSource, editorSource, outlineSource, articleSource, styles] = await Promise.all([
    readFile("src/view.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/editor/outline-renderer.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
    readFile("styles.css", "utf8")
  ]);
  assert.match(viewSource, /onRenderCode:\s*\(block, container\) => renderCodeBlock/);
  assert.match(editorSource, /this\.callbacks\.onRenderCode\(codeData, rendered\)/);
  assert.match(editorSource, /details\.mms-code-collapsed[\s\S]*addEventListener\("toggle"[\s\S]*scheduleMeasuredMindMapLayout/);
  assert.match(editorSource, /if \(node\.style\?\.minHeight !== undefined\) nodeEl\.style\.minHeight/);
  assert.doesNotMatch(editorSource, /nodeEl\.style\.minHeight = `\$\{position\.height\}px`/);
  assert.match(outlineSource, /options\.renderCode\(node\.code, code\)/);
  assert.match(articleSource, /options\.callbacks\.onRenderCode\(block\.code/);
  assert.match(styles, /> \.mms-code-line-numbers/);
  assert.match(styles, /> code\.mms-code-content/);
  assert.match(styles, /mms-code-render-root pre\.mms-code-with-line-numbers\s*\{[^}]*overflow:\s*auto/s);
  assert.doesNotMatch(styles, /code::before|data-line-numbers|mms-code-line-baseline-offset/);
});
