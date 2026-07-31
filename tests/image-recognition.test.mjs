import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { loadTypeScriptModule, loadTypeScriptModules } from "./compile-typescript.mjs";

let recognition;
let localOcr;
let desktopCapture;
const cleanups = [];

const image = (id, source, alt = "") => ({ id, type: "image", source, alt });
const text = (id, value) => ({ id, type: "text", text: value });
const node = (id, value, content = undefined, children = []) => ({ id, text: value, content, children });

const document = {
  version: 10,
  title: "图片测试",
  layout: "right",
  theme: "auto",
  root: node("root", "图片测试", [text("root-text", "图片测试"), image("root-image", "assets/root.png", "根图")], [
    node("chapter", "章节", [text("chapter-text", "章节"), image("chapter-image-1", "assets/one.png"), image("chapter-image-2", "assets/two.png", "第二张")]),
    node("appendix", "附录", [image("appendix-image", "assets/appendix.png")])
  ])
};

before(async () => {
  const loadedRecognition = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/vision/recognition.ts"
  ], "src/vision/recognition.ts");
  recognition = loadedRecognition.module;
  cleanups.push(loadedRecognition.cleanup);

  const loadedLocalOcr = await loadTypeScriptModules([
    "src/core/node-tree.ts",
    "src/core/model.ts",
    "src/vision/recognition.ts",
    "src/vision/local-ocr.ts"
  ], "src/vision/local-ocr.ts");
  localOcr = loadedLocalOcr.module;
  cleanups.push(loadedLocalOcr.cleanup);

  const loadedDesktopCapture = await loadTypeScriptModule("src/utils/desktop-capture.ts");
  desktopCapture = loadedDesktopCapture.module;
  cleanups.push(loadedDesktopCapture.cleanup);
});

after(async () => Promise.all(cleanups.map((cleanup) => cleanup())));

test("image recognition collects page and subtree images in stable node order", () => {
  const pageImages = recognition.collectRecognizableImages(document);
  assert.deepEqual(pageImages.map((item) => item.blockId), [
    "root-image",
    "chapter-image-1",
    "chapter-image-2",
    "appendix-image"
  ]);
  assert.deepEqual(pageImages.map((item) => [item.index, item.total]), [[1, 4], [2, 4], [3, 4], [4, 4]]);

  const subtreeImages = recognition.collectRecognizableImages(document, "chapter");
  assert.deepEqual(subtreeImages.map((item) => item.blockId), ["chapter-image-1", "chapter-image-2"]);
  assert.equal(subtreeImages[1].nodeLabel, "章节");
  assert.throws(() => recognition.collectRecognizableImages(document, "missing"), /节点已经不存在/);
});

test("image recognition prompt identifies sequence, node and untrusted image context", () => {
  const [item] = recognition.collectRecognizableImages(document, "chapter");
  const prompt = recognition.buildImageRecognitionPrompt(item, "逐行转录");
  assert.match(prompt, /第 1\/2 张图片/);
  assert.match(prompt, /所属节点：章节/);
  assert.match(prompt, /任务：逐行转录/);
  assert.match(prompt, /只返回图片中实际可见的文字/);
  assert.doesNotMatch(prompt, /严格按任务要求返回一个可解析的 JSON 对象/);

  const jsonPrompt = recognition.buildImageRecognitionPrompt(item, "输出 JSON 格式");
  assert.match(jsonPrompt, /严格按任务要求返回一个可解析的 JSON 对象/);
  assert.doesNotMatch(jsonPrompt, /只返回图片中实际可见的文字/);

  assert.equal(recognition.normalizeRecognizedText("```text\r\nA  \r\n\r\n\r\nB\r\n```"), "A\n\nB");
  assert.equal(
    recognition.normalizeRecognizedText("识别正文\n}<|assistant|>根据背景材料写一篇议论文{|markdown|}"),
    "识别正文"
  );
  assert.equal(
    recognition.normalizeRecognizedText("## 主题\n}\n<|box_start|>text<|box_end|>The image displays a screenshot."),
    "主题"
  );
  assert.equal(recognition.normalizeRecognizedText("A<|end_of_box|><|begin_of_box|>B"), "AB");
  assert.match(prompt, /直接把图片和本提示发送给视觉模型/);
});

test("image-to-text preview preserves block position and rejects stale replacement", () => {
  const source = structuredClone(document);
  const preview = recognition.previewImageTextReplacement(source, "chapter", "chapter-image-1", " 第一行\n第二行 ");
  assert.equal(preview.localSource, "assets/one.png");
  const applied = recognition.applyImageTextReplacement(source, preview);
  const blocks = applied.root.children[0].content;
  assert.deepEqual(blocks.map((block) => [block.id, block.type]), [
    ["chapter-text", "text"],
    ["chapter-image-1", "text"],
    ["chapter-image-2", "image"]
  ]);
  assert.equal(blocks[1].text, "第一行\n第二行");
  assert.equal(applied.root.children[0].style?.textAlign, "left");
  assert.equal(source.root.children[0].content[1].type, "image");

  source.root.children[0].content[1].source = "assets/changed.png";
  assert.throws(() => recognition.applyImageTextReplacement(source, preview), /预览后已发生变化/);
});

test("batch image-to-text replacement keeps every recognized item at its original position", () => {
  const source = structuredClone(document);
  const previews = [
    recognition.previewImageTextReplacement(source, "chapter", "chapter-image-1", "第一张图片文字"),
    recognition.previewImageTextReplacement(source, "appendix", "appendix-image", "附录图片文字")
  ];
  const applied = recognition.applyImageTextReplacements(source, previews);
  const chapterBlocks = applied.root.children[0].content;
  const appendixBlocks = applied.root.children[1].content;

  assert.deepEqual(chapterBlocks.map((block) => [block.id, block.type]), [
    ["chapter-text", "text"],
    ["chapter-image-1", "text"],
    ["chapter-image-2", "image"]
  ]);
  assert.equal(chapterBlocks[1].text, "第一张图片文字");
  assert.deepEqual(appendixBlocks.map((block) => [block.id, block.type, block.text]), [
    ["appendix-image", "text", "附录图片文字"]
  ]);
  assert.equal(source.root.children[0].content[1].type, "image");
  assert.equal(source.root.children[1].content[0].type, "image");
});

test("image-to-text replacement fills an existing empty text block", () => {
  const source = structuredClone(document);
  source.root.children[0].content = [text("empty-text", ""), image("only-image", "assets/only.png")];
  const preview = recognition.previewImageTextReplacement(source, "chapter", "only-image", "识别结果");
  const applied = recognition.applyImageTextReplacement(source, preview);
  assert.deepEqual(applied.root.children[0].content.map((block) => [block.id, block.type, block.text]), [
    ["empty-text", "text", "识别结果"]
  ]);
});

test("local OCR arguments are parsed without a shell", () => {
  assert.deepEqual(localOcr.parseCommandArguments('--psm 6 -c "preserve_interword_spaces=1"'), [
    "--psm",
    "6",
    "-c",
    "preserve_interword_spaces=1"
  ]);
  assert.deepEqual(localOcr.parseCommandArguments("--user-words 'my words.txt'"), ["--user-words", "my words.txt"]);
  assert.deepEqual(localOcr.parseCommandArguments('"" ""'), ["", ""]);
  assert.deepEqual(localOcr.parseCommandArguments("'' ''"), ["", ""]);
  assert.deepEqual(localOcr.parseCommandArguments('a""b'), ["ab"]);
  assert.deepEqual(localOcr.parseCommandArguments('a\\ b'), ["a b"]);
  assert.throws(() => localOcr.parseCommandArguments("--psm '6"), /未闭合引号/);
  assert.match(
    localOcr.formatLocalOcrError(Object.assign(new Error("spawn tesseract ENOENT"), { code: "ENOENT" }), "tesseract"),
    /填写 tesseract\.exe 的完整路径/
  );
});

test("desktop screenshot helpers expose platform commands and stable clipboard fingerprints", () => {
  const sourceBytes = new Uint8Array([1, 2, 3, 4]);
  const copiedBuffer = desktopCapture.copyBytesToArrayBuffer(sourceBytes);
  assert.ok(copiedBuffer instanceof ArrayBuffer);
  assert.deepEqual([...new Uint8Array(copiedBuffer)], [1, 2, 3, 4]);
  sourceBytes[0] = 9;
  assert.equal(new Uint8Array(copiedBuffer)[0], 1);
  assert.deepEqual(desktopCapture.screenshotCommandCandidates("darwin"), [{ command: "screencapture", args: ["-i", "-c"] }]);
  assert.equal(desktopCapture.screenshotCommandCandidates("win32")[0].command, "SnippingTool.exe");
  assert.equal(desktopCapture.screenshotCommandCandidates("linux")[0].command, "gnome-screenshot");
  const one = desktopCapture.pngFingerprint(new Uint8Array([1, 2, 3, 4]));
  assert.equal(one, desktopCapture.pngFingerprint(new Uint8Array([1, 2, 3, 4])));
  assert.notEqual(one, desktopCapture.pngFingerprint(new Uint8Array([1, 2, 3, 5])));
  assert.equal(desktopCapture.pngFingerprint(new Uint8Array()), "");
});



test("screenshot editor provides adjustable bounds, annotation tools and independent recognition actions", async () => {
  const [captureSource, settingsSource, editorSource] = await Promise.all([
    readFile("src/utils/desktop-capture.ts", "utf8"),
    readFile("src/settings.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8")
  ]);
  assert.match(captureSource, /desktopCapturer\.getSources/);
  assert.match(captureSource, /data-handle="nw"[\s\S]*data-handle="se"/);
  assert.match(captureSource, /X '\+Math\.round\(displayBounds\.x\+rect\.x\)/);
  for (const label of ["几何图形", "画笔", "箭头", "文字", "序号", "马赛克", "橡皮擦", "识别并复制", "固定", "下载", "取消", "复制"]) {
    assert.match(captureSource, new RegExp(label));
  }
  assert.match(captureSource, /DesktopCaptureAction = "copy" \| "recognize-copy" \| "download" \| "pin"/);
  assert.match(settingsSource, /截图并识别快捷键/);
  assert.doesNotMatch(settingsSource, /截图后自动识图/);
  assert.doesNotMatch(editorSource, /screenshotAutoRecognize/);
  assert.match(editorSource, /captureScreenshot\(recognizeAfter = false, targetOverride\?: ScreenshotInsertionTarget\)/);
  assert.match(editorSource, /recognizeCapturedScreenshotToClipboard/);
});

test("desktop-only OCR and capture APIs are loaded lazily for mobile compatibility", async () => {
  const [ocrSource, captureSource, exportSource, editorSource, modalSource] = await Promise.all([
    readFile("src/vision/local-ocr.ts", "utf8"),
    readFile("src/utils/desktop-capture.ts", "utf8"),
    readFile("src/utils/desktop-export.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/ai/modal.ts", "utf8")
  ]);
  for (const source of [ocrSource, captureSource, exportSource]) {
    assert.doesNotMatch(source, /from\s+["'](?:node:|electron)/);
    assert.doesNotMatch(source, /import\s*\(["'](?:node:|electron)/);
  }
  assert.match(ocrSource, /requireFunction\("node:child_process"\)/);
  assert.match(captureSource, /requireFunction\("electron"\)/);
  assert.match(captureSource, /getCurrentObsidianWindow\(runtime\)/);
  assert.match(captureSource, /requireFunction\("@electron\/remote"\)/);
  assert.match(captureSource, /await waitForWindowMinimized\(windowHandle\)/);
  assert.match(exportSource, /requireFunction\("node:fs\/promises"\)/);
  assert.match(exportSource, /showSaveDialog/);
  assert.match(editorSource, /imageRecognitionAutoConfirmDelaySeconds === 0[\s\S]*applyImageRecognitionPreview/);
  assert.match(modalSource, /imageRecognitionAutoConfirmDelaySeconds === 0[\s\S]*onApplyImageTextReplacements/);
});
