import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { loadTypeScriptModule, loadTypeScriptModules } from "./compile-typescript.mjs";

let config;
let markdown;
let protocol;
let edit;
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
  const loadedEdit = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/ai/markdown.ts",
    "src/ai/edit.ts"
  ], "src/ai/edit.ts");
  edit = loadedEdit.module;
  cleanups.push(loadedEdit.cleanup);
  const loadedProtocol = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/ai/config.ts",
    "src/ai/markdown.ts",
    "src/ai/edit.ts",
    "src/ai/protocol.ts"
  ], "src/ai/protocol.ts");
  protocol = loadedProtocol.module;
  cleanups.push(loadedProtocol.cleanup);
});

after(async () => Promise.all(cleanups.map((cleanup) => cleanup())));

test("AI presets include OpenAI, DeepSeek, SiliconFlow, FreeLLMAPI and custom profiles", () => {
  assert.equal(config.AI_PROFILE_PRESETS.openai.endpoint, "https://api.openai.com/v1/chat/completions");
  assert.equal(config.AI_PROFILE_PRESETS.deepseek.endpoint, "https://api.deepseek.com/chat/completions");
  assert.equal(config.AI_PROFILE_PRESETS.siliconflow.endpoint, "https://api.siliconflow.cn/v1");
  assert.equal(config.AI_PROFILE_PRESETS.siliconflow.model, "deepseek-ai/DeepSeek-V4-Flash");
  assert.deepEqual(config.AI_PROVIDER_MODEL_PRESETS.siliconflow, [
    "deepseek-ai/DeepSeek-V4-Flash",
    "deepseek-ai/DeepSeek-V4-Pro",
    "deepseek-ai/DeepSeek-OCR",
    "zai-org/GLM-4.5V",
    "zai-org/GLM-5.2"
  ]);
  assert.equal(config.AI_PROFILE_PRESETS.freellmapi.endpoint, "");
  assert.equal(config.AI_PROFILE_PRESETS.freellmapi.model, "auto");
  assert.equal(config.AI_PROFILE_PRESETS.custom.endpoint, "");
});

test("AI provider normalization preserves SiliconFlow and FreeLLMAPI presets", () => {
  assert.equal(config.normalizeAiProfileConfig({ provider: "siliconflow" }).provider, "siliconflow");
  assert.equal(config.normalizeAiProfileConfig({ provider: "freellmapi" }).provider, "freellmapi");
  assert.equal(config.createAiProfileConfig("freellmapi", 1).model, "auto");
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



test("AI protocol builds multimodal image recognition requests", () => {
  const profile = config.createAiProfileConfig("custom", 1);
  profile.model = "vision-model";
  profile.temperature = 1.1;
  const body = protocol.buildImageRecognitionCompletionBody(profile, "转录文字", "data:image/png;base64,AAAA");
  assert.equal(body.temperature, 0.2);
  assert.equal(body.messages.at(-1).role, "user");
  assert.deepEqual(body.messages.at(-1).content, [
    { type: "text", text: "转录文字" },
    { type: "image_url", image_url: { url: "data:image/png;base64,AAAA", detail: "high" } }
  ]);
  assert.match(body.messages[0].content, /只逐字转录图片中可见的文字/);
  assert.doesNotMatch(body.messages[0].content, /system/);
});

test("AI protocol accepts base URLs and builds a context-free connection check", () => {
  assert.equal(
    protocol.resolveAiChatCompletionsEndpoint("https://api.siliconflow.cn/v1"),
    "https://api.siliconflow.cn/v1/chat/completions"
  );
  assert.equal(
    protocol.resolveAiChatCompletionsEndpoint("https://example.com/v1/chat/completions/"),
    "https://example.com/v1/chat/completions"
  );
  const profile = config.createAiProfileConfig("freellmapi", 1);
  const body = protocol.buildAiConnectionTestBody(profile);
  assert.equal(body.model, "auto");
  assert.equal(body.stream, false);
  assert.equal(body.max_tokens, 8);
  assert.equal(body.messages.length, 1);
  assert.doesNotMatch(body.messages[0].content, /mindmap_markdown/);
});




test("AI edit proposal extracts Markdown and replaces only the selected subtree", () => {
  const source = structuredClone(document);
  source.root.children[0].style = { color: "#112233" };
  source.root.children[0].submap = { path: "child.mindmap" };
  const preview = edit.previewAiMarkdownEdit(
    source,
    "chapter",
    "说明文字\n```markdown\n# 重整后的第一章\n- 核心概念\n  - 测试方法\n- 结论\n```"
  );
  assert.equal(preview.originalNodeCount, 2);
  assert.equal(preview.replacementNodeCount, 4);
  const applied = edit.applyAiMarkdownEdit(source, preview);
  assert.equal(applied.document.root.children[0].id, "chapter");
  assert.equal(applied.document.root.children[0].text, "重整后的第一章");
  assert.deepEqual(applied.document.root.children[0].style, { color: "#112233" });
  assert.deepEqual(applied.document.root.children[0].submap, { path: "child.mindmap" });
  assert.equal(applied.document.root.children[1].text, "附录");
});

test("AI edit preview refuses stale documents and oversized node output", () => {
  const source = structuredClone(document);
  const preview = edit.previewAiMarkdownEdit(source, null, "# 新导图\n- A\n- B");
  source.root.children.push(node("late", "后来新增"));
  assert.throws(() => edit.applyAiMarkdownEdit(source, preview), /预览后已发生变化/);
  const huge = `# 大导图\n${Array.from({ length: 5001 }, (_, index) => `- 节点 ${index}`).join("\n")}`;
  assert.throws(() => edit.previewAiMarkdownEdit(document, null, huge), /超过 5000 个/);
});

test("local replacement previews and applies without calling AI", () => {
  const source = structuredClone(document);
  source.root.children[0].content = [{ id: "text-1", type: "text", text: "A 测试 A", richText: [{ text: "A", style: { bold: true } }, { text: " 测试 A" }] }];
  source.root.children[0].text = "A 测试 A";
  source.root.children[0].note = "a 备注";
  source.root.children[0].table = { headers: ["A"], rows: [["a"]] };
  const preview = edit.previewLocalTextReplace(source, "chapter", "a", "B", false);
  assert.equal(preview.matchCount, 5);
  assert.equal(preview.affectedNodeCount, 1);
  const applied = edit.applyLocalTextReplace(source, preview);
  const changed = applied.document.root.children[0];
  assert.equal(changed.text, "B 测试 B");
  assert.equal(changed.note, "B 备注");
  assert.deepEqual(changed.table.headers, ["B"]);
  assert.deepEqual(changed.table.rows, [["B"]]);
  assert.equal(source.root.children[0].text, "A 测试 A");
});

test("local replacement excludes links, code, images and submap paths", () => {
  const source = structuredClone(document);
  const target = source.root.children[0];
  target.text = "A 标题";
  target.link = "https://example.com/A";
  target.image = "assets/A.png";
  target.code = { language: "text", code: "const A = 1" };
  target.submap = { path: "books/A.mindmap", title: "A 子导图" };
  const preview = edit.previewLocalTextReplace(source, "chapter", "A", "B", true);
  const applied = edit.applyLocalTextReplace(source, preview);
  const changed = applied.document.root.children[0];
  assert.equal(changed.text, "B 标题");
  assert.equal(changed.link, "https://example.com/A");
  assert.equal(changed.image, "assets/A.png");
  assert.deepEqual(changed.code, { language: "text", code: "const A = 1" });
  assert.deepEqual(changed.submap, { path: "books/A.mindmap", title: "A 子导图" });
});

test("AI edit requires a heading and preserves page metadata", () => {
  const source = structuredClone(document);
  source.navigation = { parentPath: "parent.mindmap", parentNodeId: "p1" };
  source.view = { mode: "article", readOnly: false };
  source.root.style = { color: "#334455" };
  assert.throws(() => edit.previewAiMarkdownEdit(source, null, "- 没有标题"), /一级 Markdown 标题/);
  const preview = edit.previewAiMarkdownEdit(source, null, "# 重整页面\n- 新章节");
  const applied = edit.applyAiMarkdownEdit(source, preview);
  assert.equal(applied.document.root.id, "root");
  assert.equal(applied.document.root.style.color, "#334455");
  assert.deepEqual(applied.document.navigation, source.navigation);
  assert.deepEqual(applied.document.view, source.view);
});

test("AI edit protocol requires Markdown-only proposals", () => {
  const payload = markdown.buildAiMarkdownPayload(document, "chapter", "book.mindmap", 1024 * 1024);
  const profile = config.createAiProfileConfig("custom", 1);
  profile.model = "model-x";
  profile.temperature = 1.2;
  const body = protocol.buildAiEditCompletionBody(profile, payload, "整理并重新生成");
  assert.equal(body.temperature, 0.4);
  assert.equal(body.stream, false);
  assert.match(body.messages.at(-1).content, /只返回完整 Markdown/);
  assert.match(body.messages.at(-1).content, /整理并重新生成/);
});

test("AI prompt drafts switch to the edit instruction and preserve per-mode input", () => {
  let state = edit.createAiPromptDraftState("请分析这份思维导图，并回答我的问题。", "逐行识别图片");
  let switched = edit.switchAiPromptDraft(state, "我的询问草稿", "edit");
  state = switched.state;
  assert.equal(switched.value, "按主题重新整理层级，合并重复节点，并重新生成清晰的导图结构。");

  switched = edit.switchAiPromptDraft(state, "我的整理要求", "vision");
  state = switched.state;
  assert.equal(switched.value, "逐行识别图片");

  switched = edit.switchAiPromptDraft(state, "我的识图要求", "replace");
  state = switched.state;
  assert.equal(switched.value, "我的识图要求");

  switched = edit.switchAiPromptDraft(state, "不应覆盖隐藏草稿", "ask");
  state = switched.state;
  assert.equal(switched.value, "我的询问草稿");

  switched = edit.switchAiPromptDraft(state, "更新后的询问", "edit");
  state = switched.state;
  assert.equal(switched.value, "我的整理要求");

  switched = edit.switchAiPromptDraft(state, "更新后的整理", "vision");
  assert.equal(switched.value, "我的识图要求");
});

test("AI modal shows only the inputs required by the selected operation", async () => {
  const [modalSource, stylesSource] = await Promise.all([
    readFile("src/ai/modal.ts", "utf8"),
    readFile("styles.css", "utf8")
  ]);
  assert.match(modalSource, /replacePanel\.hidden = true/);
  assert.match(modalSource, /providerLabel\.hidden = localReplace \|\| localRecognition/);
  assert.match(modalSource, /questionLabel\.hidden = localReplace/);
  assert.match(modalSource, /replacePanel\.hidden = !localReplace/);
  assert.match(modalSource, /track\.hidden = localReplace/);
  assert.match(modalSource, /createAiPromptDraftState\([\s\S]*this\.options\.defaultQuestion,[\s\S]*this\.options\.defaultImageRecognitionPrompt/);
  assert.match(modalSource, /switchAiPromptDraft\(promptDraftState, question\.value, selected\)/);
  assert.match(
    modalSource,
    /onPreviewLocalReplace\([\s\S]*findInput\.value,[\s\S]*replacementInput\.value,[\s\S]*false/
  );
  assert.doesNotMatch(modalSource, /区分大小写/);
  assert.doesNotMatch(modalSource, /mms-ai-checkbox/);
  assert.match(stylesSource, /\.mms-ai-field\[hidden\],[\s\S]*display: none !important/);
  assert.doesNotMatch(stylesSource, /\.mms-ai-checkbox/);
});

test("AI integration exposes toolbar, shortcut, page scope and node scope contracts", async () => {
  const [settingsSource, mainSource, editorSource, viewSource, modalSource, editSource, editorModalsSource, stylesSource] = await Promise.all([
    readFile("src/settings.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/view.ts", "utf8"),
    readFile("src/ai/modal.ts", "utf8"),
    readFile("src/ai/edit.ts", "utf8"),
    readFile("src/editor/editor-modals.ts", "utf8"),
    readFile("styles.css", "utf8")
  ]);
  assert.match(settingsSource, /\["ai", "询问 AI"\]/);
  assert.match(settingsSource, /新增硅基流动/);
  assert.match(settingsSource, /新增 FreeLLMAPI/);
  assert.match(settingsSource, /text: "检测接口"/);
  assert.match(settingsSource, /imageRecognitionAiProfileId: ""/);
  assert.match(settingsSource, /AI 识图接口/);
  assert.match(settingsSource, /containerEl\.appendChild\(imageRecognitionSettings\)/);
  assert.match(settingsSource, /autoUploadDelaySeconds: 60/);
  assert.match(settingsSource, /imageRecognitionAutoConfirmDelaySeconds: null/);
  assert.match(settingsSource, /setLimits\(0, 120, 1\)/);
  assert.match(settingsSource, /screenshotShortcut: "Ctrl\+Shift\+S"/);
  assert.match(settingsSource, /globalSearchShortcut: "Ctrl\+Shift\+F"/);
  assert.match(settingsSource, /shortcutSetting\("全局搜索", "globalSearchShortcut"\)/);
  assert.match(settingsSource, /captureShortcut\(event, text, key, name\)/);
  assert.match(mainSource, /matchesRecordedShortcut\(event, this\.settings\.globalSearchShortcut\)/);
  assert.match(mainSource, /id: "ask-ai-about-mind-map"/);
  assert.match(mainSource, /async testAiProfile\(profileId: string\): Promise<void>/);
  assert.match(mainSource, /modifiers: \["Mod", "Shift"\], key: "A"/);
  assert.match(mainSource, /id: "capture-mind-map-screenshot"/);
  assert.match(mainSource, /modifiers: \["Mod", "Shift"\], key: "S"/);
  assert.match(mainSource, /imageRecognitionAiProfileId[\s\S]*aiProfileIds\.has/);
  assert.match(mainSource, /!stored\.includes\("screenshot"\)/);
  assert.match(editorSource, /aiScopeNodeId: string \| null = null/);
  assert.match(editorSource, /this\.shortcutMatches\(event, this\.options\.screenshotShortcut\)/);
  assert.match(editorSource, /this\.options\.screenshotShortcut \|\| "Ctrl\+Shift\+S"/);
  assert.match(settingsSource, /setIcon\("eye"/);
  assert.match(settingsSource, /显示 API 密钥/);
  assert.match(settingsSource, /mms-settings-search/);
  assert.match(settingsSource, /organizeSettingsSections/);
  assert.match(settingsSource, /mms-settings-section/);
  assert.match(editorSource, /询问 AI（此节点及全部子节点）/);
  assert.match(editorSource, /询问 AI（当前页面）/);
  assert.match(editorSource, /AI 识图/);
  assert.match(editorSource, /并转为文字/);
  assert.match(editorSource, /captureScreenshot\(\)/);
  assert.match(viewSource, /buildAiMarkdownPayload/);
  assert.match(viewSource, /defaultImageRecognitionProfileId: this\.plugin\.settings\.imageRecognitionAiProfileId \|\| this\.plugin\.settings\.defaultAiProfileId/);
  assert.match(viewSource, /screenshotShortcut: this\.plugin\.settings\.screenshotShortcut/);
  assert.match(viewSource, /resumePendingAutoUploads\(this\.file, this\.document\)/);
  assert.match(mainSource, /remoteUrl \|\| blob/);
  assert.match(mainSource, /Date\.now\(\) - localFile\.stat\.mtime/);
  assert.match(mainSource, /queueAutoUpload/);
  assert.match(mainSource, /Math\.min\(120 \* 60, Math\.round\(raw\.autoUploadDelaySeconds\)\)/);
  assert.match(mainSource, /deleteRecognizedImageLocalAsset/);
  assert.match(editorModalsSource, /candidate\.kind !== "local" \|\| Boolean\(this\.resolveSource/);
  assert.match(viewSource, /onProposeEdit/);
  assert.match(viewSource, /onPreviewImageTextReplacements/);
  assert.match(viewSource, /onApplyImageTextReplacements/);
  assert.match(editorSource, /applyAiEdit\(preview: AiEditPreview\)/);
  assert.match(editorSource, /applyLocalReplace\(preview: LocalReplacePreview\)/);
  assert.match(editorSource, /applyImageTextReplacements\(previews: ImageTextReplacementPreview\[\]\)/);
  assert.match(editorSource, /onDeleteRecognizedImageLocalAsset/);
  assert.match(editorSource, /autoUploadScheduleMessage/);
  assert.match(editSource, /sourceSnapshot/);
  assert.match(modalSource, /payload\.overLimit/);
  assert.match(modalSource, /AI 整理并重新生成（确认后应用）/);
  assert.match(modalSource, /整理为题目节点/);
  assert.match(modalSource, /onConvertToQuestion/);
  assert.match(editSource, /DEFAULT_AI_QUESTION_NODE_INSTRUCTION/);
  assert.match(modalSource, /图片 AI 识图（按顺序处理当前范围）/);
  assert.match(modalSource, /onRecognizeImages/);
  assert.match(modalSource, /onPreviewImageTextReplacements/);
  assert.match(modalSource, /确认原位替换/);
  assert.match(modalSource, /图片识图原位替换预览/);
  assert.match(modalSource, /imageRecognitionAutoConfirmDelaySeconds/);
  assert.match(modalSource, /defaultImageRecognitionProfileId/);
  assert.match(modalSource, /本地文字替换（不调用 AI）/);
  assert.match(modalSource, /确认应用变更/);
  assert.match(modalSource, /mms-ai-track/);
  assert.match(modalSource, /mms-ai-request-progress/);
  assert.match(modalSource, /requestProgressTimer = window\.setInterval\(renderRequestProgress, 1000\)/);
  assert.match(modalSource, /模型处理中[\s\S]*updateRequestProgress\("模型处理中"\)/);
  assert.match(modalSource, /已等待 \$\{elapsed\} 秒/);
  assert.match(modalSource, /finishRequestProgress\("done", "修改预览已生成"\)/);
  assert.match(modalSource, /onClose\(\): void[\s\S]*window\.clearInterval\(this\.requestProgressTimer\)/);
  assert.match(stylesSource, /\.mms-ai-request-progress\[data-state="active"\][\s\S]*mms-ai-request-progress 1\.35s/);
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
