import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { loadTypeScriptModule, loadTypeScriptModules } from "./compile-typescript.mjs";

let config;
let markdown;
let protocol;
const cleanups = [];

const node = (id, text, children = []) => ({ id, text, children });
const document = {
  version: 10,
  title: "测试导图",
  layout: "right",
  theme: "auto",
  root: node("root", "测试导图", [
    node("chapter", "第一章", [node("section", "第一节")]),
    node("other", "附录")
  ])
};

before(async () => {
  const loadedConfig = await loadTypeScriptModule("src/ai/config.ts");
  config = loadedConfig.module;
  cleanups.push(loadedConfig.cleanup);
  const loadedMarkdown = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/ai/markdown.ts"
  ], "src/ai/markdown.ts");
  markdown = loadedMarkdown.module;
  cleanups.push(loadedMarkdown.cleanup);
  const loadedProtocol = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/ai/config.ts",
    "src/ai/markdown.ts",
    "src/ai/protocol.ts"
  ], "src/ai/protocol.ts");
  protocol = loadedProtocol.module;
  cleanups.push(loadedProtocol.cleanup);
});

after(async () => Promise.all(cleanups.map((cleanup) => cleanup())));

test("AI presets include OpenAI, DeepSeek and custom Chat Completions profiles", () => {
  assert.equal(config.AI_PROFILE_PRESETS.openai.endpoint, "https://api.openai.com/v1/chat/completions");
  assert.equal(config.AI_PROFILE_PRESETS.deepseek.endpoint, "https://api.deepseek.com/chat/completions");
  assert.equal(config.AI_PROFILE_PRESETS.custom.endpoint, "");
});

test("normalizeAiProfileConfig clamps unsafe numeric values and trims text", () => {
  const profile = config.normalizeAiProfileConfig({
    id: " profile ",
    name: " Custom ",
    provider: "custom",
    enabled: true,
    endpoint: " https://example.com/v1/chat/completions ",
    apiKey: " secret ",
    model: " model-x ",
    temperature: 99,
    maxOutputTokens: 1,
    headers: "{}"
  });
  assert.equal(profile.id, "profile");
  assert.equal(profile.endpoint, "https://example.com/v1/chat/completions");
  assert.equal(profile.temperature, 2);
  assert.equal(profile.maxOutputTokens, 64);
});

test("page AI context converts the whole document to Markdown and reports UTF-8 size", () => {
  const payload = markdown.buildAiMarkdownPayload(document, null, "book.mindmap", 1024 * 1024);
  assert.equal(payload.scope, "page");
  assert.equal(payload.nodeCount, 4);
  assert.match(payload.markdown, /^# 测试导图/m);
  assert.match(payload.markdown, /第一章/);
  assert.match(payload.markdown, /附录/);
  assert.equal(payload.byteSize, markdown.utf8ByteLength(payload.markdown));
  assert.equal(payload.overLimit, false);
});

test("node AI context includes only the right-clicked node and descendants", () => {
  const payload = markdown.buildAiMarkdownPayload(document, "chapter", "book.mindmap", 1024 * 1024);
  assert.equal(payload.scope, "subtree");
  assert.equal(payload.scopeNodeId, "chapter");
  assert.equal(payload.nodeCount, 2);
  assert.match(payload.markdown, /第一章/);
  assert.match(payload.markdown, /第一节/);
  assert.doesNotMatch(payload.markdown, /附录/);
});

test("AI context blocks oversized Markdown without silently truncating it", () => {
  const large = structuredClone(document);
  large.root.children[0].text = "内容".repeat(20000);
  const payload = markdown.buildAiMarkdownPayload(large, null, "large.mindmap", 16 * 1024);
  assert.equal(payload.overLimit, true);
  assert.ok(payload.byteSize > payload.maxInputBytes);
  assert.match(payload.markdown, /内容/);
});

test("AI user message keeps the question outside an explicit Markdown boundary", () => {
  const payload = markdown.buildAiMarkdownPayload(document, "chapter", "book.mindmap", 1024 * 1024);
  const message = markdown.buildAiUserMessage("总结本章", payload);
  assert.match(message, /用户问题：\n总结本章/);
  assert.match(message, /<mindmap_markdown>/);
  assert.match(message, /<\/mindmap_markdown>/);
});


test("AI protocol rejects header injection and nested header values", () => {
  assert.deepEqual(protocol.parseAiHeaders('{"X-Trace":"yes","X-Retry":2}'), { "X-Trace": "yes", "X-Retry": "2" });
  assert.throws(() => protocol.parseAiHeaders('{"X-Test":"ok\\r\\nInjected: yes"}'), /非法换行/);
  assert.throws(() => protocol.parseAiHeaders('{"X-Test":{"nested":true}}'), /只能使用/);
});

test("AI protocol builds non-streaming Markdown requests and extracts compatible responses", () => {
  const payload = markdown.buildAiMarkdownPayload(document, "chapter", "book.mindmap", 1024 * 1024);
  const profile = config.createAiProfileConfig("custom", 1);
  profile.model = "model-x";
  profile.systemPrompt = "system";
  const body = protocol.buildChatCompletionBody(profile, payload, "总结");
  assert.equal(body.stream, false);
  assert.equal(body.messages[0].role, "system");
  assert.match(body.messages[1].content, /<mindmap_markdown>/);
  assert.equal(protocol.extractAiResponseText({ choices: [{ message: { content: " answer " } }] }), "answer");
  assert.equal(protocol.extractAiResponseText({ output_text: "fallback" }), "fallback");
});


test("AI integration exposes toolbar, shortcut, page scope and node scope contracts", async () => {
  const [settingsSource, mainSource, editorSource, viewSource, modalSource] = await Promise.all([
    readFile("src/settings.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/view.ts", "utf8"),
    readFile("src/ai/modal.ts", "utf8")
  ]);
  assert.match(settingsSource, /\["ai", "询问 AI"\]/);
  assert.match(mainSource, /id: "ask-ai-about-mind-map"/);
  assert.match(mainSource, /modifiers: \["Mod", "Shift"\], key: "A"/);
  assert.match(editorSource, /aiScopeNodeId: string \| null = null/);
  assert.match(editorSource, /询问 AI（此节点及全部子节点）/);
  assert.match(editorSource, /询问 AI（当前页面）/);
  assert.match(viewSource, /buildAiMarkdownPayload/);
  assert.match(modalSource, /payload\.overLimit/);
  assert.match(modalSource, /mms-ai-track/);
  assert.match(modalSource, /new Component\(\)/);
  assert.match(modalSource, /this\.markdownRenderComponent\.load\(\)/);
  assert.match(
    modalSource,
    /MarkdownRenderer\.render\([\s\S]*this\.markdownRenderComponent[\s\S]*\)/
  );
  assert.doesNotMatch(
    modalSource,
    /MarkdownRenderer\.render\([\s\S]*this\.options\.sourcePath,\s*this\s*\)/
  );
  assert.match(modalSource, /onClose\(\): void[\s\S]*markdownRenderComponent\?\.unload\(\)/);
});
