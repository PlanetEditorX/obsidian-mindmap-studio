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

test("desktop screenshot helpers preserve PNG bytes and normalize display bounds", () => {
  const sourceBytes = new Uint8Array([1, 2, 3, 4]);
  const copiedBuffer = desktopCapture.copyBytesToArrayBuffer(sourceBytes);
  assert.ok(copiedBuffer instanceof ArrayBuffer);
  assert.deepEqual([...new Uint8Array(copiedBuffer)], [1, 2, 3, 4]);
  sourceBytes[0] = 9;
  assert.equal(new Uint8Array(copiedBuffer)[0], 1);
  assert.deepEqual(
    desktopCapture.normalizeBrowserDisplay({ left: -1280.4, top: 10.6, width: 1279.7, height: 719.8, scaleFactor: 1.5 }),
    { id: 0, bounds: { x: -1280, y: 11, width: 1280, height: 720 }, scaleFactor: 1.5 }
  );
});



test("screenshot editor provides a visible adjustable overlay and complete toolbar", async () => {
  const [captureSource, settingsSource, editorSource] = await Promise.all([
    readFile("src/utils/desktop-capture.ts", "utf8"),
    readFile("src/settings.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8")
  ]);
  const display = desktopCapture.normalizeBrowserDisplay({ left: -1920, top: 0, width: 1920, height: 1080, scaleFactor: 1.25 });
  assert.deepEqual(display, {
    id: 0,
    bounds: { x: -1920, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1.25
  });
  const html = desktopCapture.captureEditorHtml(display, "capture", "data:image/png;base64,AA==", "token-1");
  assert.match(html, /border:2px solid rgba\(42,179,255,\.98\)/);
  assert.match(html, /border-radius:9px/);
  assert.match(html, /box-shadow:0 0 0 1px rgba\(255,255,255,\.9\)/);
  assert.match(html, /data-handle="nw"[\s\S]*data-handle="se"/);
  assert.match(html, /function computeImageArea\(\)/);
  assert.match(html, /image\.naturalWidth\/Math\.max\(1,virtualBounds\.width\)/);
  assert.doesNotMatch(html, /drawImage\(image,0,0,innerWidth,innerHeight\)/);
  assert.match(html, /id="screenSwitcher"/);
  assert.match(html, /全部屏幕/);
  assert.match(html, /id="textEditor"/);
  assert.match(html, /data-shape="ellipse"/);
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1] ?? "";
  assert.doesNotThrow(() => new Function(script));
  for (const label of ["几何图形", "画笔", "箭头", "文字", "序号", "马赛克", "橡皮擦", "识别并复制", "固定", "下载", "取消", "复制"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /MMS_CAPTURE_ACTION/);
  assert.match(html, /window\.opener/);
  assert.match(html, /window\.parent/);
  assert.match(captureSource, /DesktopCaptureAction = "copy" \| "recognize-copy" \| "download" \| "pin"/);
  assert.match(settingsSource, /截图并识别快捷键/);
  assert.doesNotMatch(settingsSource, /截图后自动识图/);
  assert.doesNotMatch(editorSource, /screenshotAutoRecognize/);
  assert.match(editorSource, /captureScreenshot\(recognizeAfter = false, targetOverride\?: ScreenshotInsertionTarget\)/);
  assert.match(editorSource, /recognizeCapturedScreenshotToClipboard/);
});



test("Windows capture uses the full virtual desktop with DPI-aware monitor metadata and native pinning", async () => {
  const captureSource = await readFile("src/utils/desktop-capture.ts", "utf8");
  assert.match(captureSource, /SystemInformation\]::VirtualScreen/);
  assert.match(captureSource, /Screen\]::AllScreens/);
  assert.match(captureSource, /SetProcessDpiAwarenessContext/);
  assert.match(captureSource, /native virtual-desktop capture/);
  assert.match(captureSource, /data-style-group="shape"/);
  assert.match(captureSource, /openTextEditor/);
  assert.match(captureSource, /System\.Windows\.Forms\.Form/);
  assert.match(captureSource, /TopMost = \$true/);
  assert.match(captureSource, /nodeRuntime\.spawn\("powershell\.exe"/);

  const display = desktopCapture.normalizeBrowserDisplay({
    x: -1920,
    y: 0,
    width: 4480,
    height: 1440,
    displays: [
      { id: 1, x: -1920, y: 0, width: 1920, height: 1080, label: "屏幕 1", active: true },
      { id: 2, x: 0, y: 0, width: 2560, height: 1440, label: "屏幕 2", primary: true }
    ]
  });
  assert.equal(display.displays?.length, 2);
  assert.equal(display.displays?.[0].active, true);
  assert.equal(display.displays?.[1].primary, true);
  const html = desktopCapture.captureEditorHtml(display, "capture");
  assert.match(html, /availableDisplays=/);
  assert.match(html, /屏幕 1/);
  assert.match(html, /屏幕 2/);
  assert.match(html, /viewBounds\.width\/Math\.max\(1,imageArea\.w\)/);
});



test("screenshot text input, line style, screen labels and native pin startup are runtime-safe", async () => {
  const captureSource = await readFile("src/utils/desktop-capture.ts", "utf8");
  const display = desktopCapture.normalizeBrowserDisplay({
    x: -1920,
    y: 0,
    width: 3840,
    height: 1080,
    displays: [
      { id: 1, x: -1920, y: 0, width: 1920, height: 1080, label: "#U5c4f#U5e55 1" },
      { id: 2, x: 0, y: 0, width: 1920, height: 1080, label: "garbled" }
    ]
  });
  const html = desktopCapture.captureEditorHtml(display, "capture");
  assert.match(html, /data-line-style="arrow">箭头<\/button><button class="line-option" data-line-style="line">直线/);
  assert.match(html, /let lineKind='arrow'/);
  assert.match(html, /if\(lineKind==='line'\)return/);
  assert.match(html, /requestAnimationFrame\(\(\)=>\{textEditor\.focus/);
  assert.match(html, /if\(tool==='text'\)\{ev\.preventDefault\(\);ev\.stopPropagation\(\);openTextEditor/);
  assert.doesNotMatch(html, /textEditor\.addEventListener\('blur'/);
  assert.match(html, /availableDisplays\.forEach\(\(item,index\)=>options\.push\(\{label:'屏幕 '\+\(index\+1\)/);
  assert.match(html, /button\.textContent=option\.label/);
  assert.match(captureSource, /label = "display-\$index"/);
  assert.match(captureSource, /label = "all-displays"/);
  assert.match(captureSource, /writeFile\(scriptPath, "\\uFEFF" \+ script\)/);
  assert.match(captureSource, /waitForPinnedWindowReady/);
  assert.match(captureSource, /ReadyPath/);
  assert.match(captureSource, /Application\]::Run\(\$form\)/);
  assert.match(captureSource, /ShowInTaskbar = \$true/);
});

test("manual screenshot never confirms on mouse release and recognition waits for three idle seconds", async () => {
  const [captureSource, editorSource, viewSource, mainSource, typesSource] = await Promise.all([
    readFile("src/utils/desktop-capture.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/view.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/editor/editor-types.ts", "utf8")
  ]);
  const captureHtml = desktopCapture.captureEditorHtml(
    { id: 1, bounds: { x: 0, y: 0, width: 1280, height: 720 }, scaleFactor: 1 },
    "capture"
  );
  const recognizeHtml = desktopCapture.captureEditorHtml(
    { id: 1, bounds: { x: 0, y: 0, width: 1280, height: 720 }, scaleFactor: 1 },
    "capture-recognize"
  );
  assert.match(captureHtml, /const recognizeMode=captureMode==='capture-recognize'/);
  assert.match(captureHtml, /function endSelection\(\)\{[^}]*if\(completed\)armAutoConfirm\(\)\}/);
  assert.doesNotMatch(captureHtml, /function endSelection\(\)[^\n]*action\('copy'\)/);
  assert.match(captureHtml, /document\.addEventListener\('dblclick'[\s\S]*captureMode==='capture'[\s\S]*action\('copy'\)/);
  assert.match(recognizeHtml, /const autoConfirmDelayMs=3000/);
  assert.match(recognizeHtml, /pointerInsideSelection\|\|drag\|\|selectionDraw\|\|drawing/);
  assert.match(recognizeHtml, /setTimeout\(\(\)=>\{[\s\S]*action\('copy'\)\},autoConfirmDelayMs\)/);
  assert.match(recognizeHtml, /function endResize\(\)[\s\S]*armAutoConfirm\(\)/);
  assert.match(recognizeHtml, /inside!==pointerInsideSelection[\s\S]*resetAutoConfirm\(\)/);
  assert.match(editorSource, /onCaptureScreenshot\(recognizeAfter\)/);
  assert.match(viewSource, /onCaptureScreenshot: async \(recognizeAfter\) => this\.plugin\.captureScreenshot\(recognizeAfter\)/);
  assert.match(typesSource, /onCaptureScreenshot: \(recognizeAfter\?: boolean\) => Promise<DesktopCaptureResult>/);
  assert.match(mainSource, /recognizeAfter \? "capture-recognize" : "capture"/);
});

test("capture timeout rejects stalled desktop APIs instead of leaving screenshot commands pending", async () => {
  await assert.rejects(
    desktopCapture.withCaptureTimeout(new Promise(() => {}), 10, "测试抓屏"),
    /测试抓屏超时/
  );
  assert.equal(await desktopCapture.withCaptureTimeout(Promise.resolve("ok"), 100, "测试抓屏"), "ok");
});

test("desktop capture opens the plugin overlay and never silently falls back to the interactive system snipper", async () => {
  const [captureSource, editorSource] = await Promise.all([
    readFile("src/utils/desktop-capture.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8")
  ]);
  assert.doesNotMatch(captureSource, /window\.open\("about:blank", windowName, features\)/);
  assert.match(captureSource, /document\.documentElement\.appendChild\(iframe\)/);
  assert.match(captureSource, /iframe\.srcdoc = html/);
  assert.match(captureSource, /zIndex: "2147483647"/);
  assert.match(captureSource, /withCaptureTimeout/);
  assert.match(captureSource, /3_500/);
  assert.match(captureSource, /18_000/);
  assert.match(captureSource, /captureDisplayWithNativeCommand/);
  assert.match(captureSource, /captureDisplayWithRendererElectron/);
  assert.match(captureSource, /禁止静默回退系统截图/);
  assert.match(captureSource, /MindMapStudioCaptureWindow/);
  assert.match(captureSource, /hideForegroundWindow \? "1" : "0"/);
  assert.match(captureSource, /URL\.createObjectURL/);
  assert.match(captureSource, /URL\.revokeObjectURL/);
  assert.match(editorSource, /正在准备截图编辑器/);
  const entry = captureSource.slice(captureSource.indexOf("export async function captureDesktopScreenshot"));
  assert.doesNotMatch(entry, /captureWithSystemTool/);
  assert.doesNotMatch(entry, /screenshotCommandCandidates/);
  assert.doesNotMatch(entry, /SnippingTool\.exe/);
  const mac = desktopCapture.nativeCaptureCommandCandidates(
    "darwin",
    { id: 1, bounds: { x: -100, y: 20, width: 800, height: 600 }, scaleFactor: 2 },
    "/tmp/screen.png"
  );
  assert.deepEqual(mac, [{ command: "screencapture", args: ["-x", "-R-100,20,800,600", "/tmp/screen.png"] }]);
  const linux = desktopCapture.nativeCaptureCommandCandidates(
    "linux",
    { id: 1, bounds: { x: -1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
    "/tmp/screen.png"
  );
  assert.equal(linux[0].command, "grim");
  assert.match(linux[1].args.join(" "), /1920x1080-1920\+0/);
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
  assert.match(captureSource, /getCurrentObsidianWindow\(electronRuntime\)/);
  assert.match(captureSource, /requireFunction\("@electron\/remote"\)/);
  assert.match(captureSource, /await waitForWindowMinimized\(windowHandle\)/);
  assert.match(exportSource, /requireFunction\("node:fs\/promises"\)/);
  assert.match(exportSource, /showSaveDialog/);
  assert.match(editorSource, /imageRecognitionAutoConfirmDelaySeconds === 0[\s\S]*applyImageRecognitionPreview/);
  assert.match(modalSource, /imageRecognitionAutoConfirmDelaySeconds === 0[\s\S]*onApplyImageTextReplacements/);
});
