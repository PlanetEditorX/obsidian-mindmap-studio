import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let settingsSource;
let mainSource;
let editorSource;
let stylesSource;
let bundleSource;
let bundleReadableSource;

function decodeBundleUnicodeEscapes(source) {
  return source.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16))
  );
}

before(async () => {
  [settingsSource, mainSource, editorSource, stylesSource, bundleSource] = await Promise.all([
    readFile("src/settings.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("styles.css", "utf8"),
    readFile("main.js", "utf8")
  ]);
  // esbuild may serialize non-ASCII labels as \uXXXX sequences. Normalize only
  // the assertion view while keeping the committed bundle byte-for-byte intact.
  bundleReadableSource = decodeBundleUnicodeEscapes(bundleSource);
});

test("resource folder and File Explorer filters stay inside Files and Resources", () => {
  const fileSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "文件与资源" })');
  const defaultFolder = settingsSource.indexOf('.setName("默认保存文件夹")', fileSection);
  const assetFolder = settingsSource.indexOf('.setName("资源文件夹")', fileSection);
  const hideAssetFolder = settingsSource.indexOf('.setName("在文件浏览器隐藏资源文件夹")', fileSection);
  const customFilter = settingsSource.indexOf('.setName("文件浏览器自定义筛选")', fileSection);
  const answerSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "答题与题库" })', fileSection);

  assert.ok(fileSection >= 0);
  assert.ok(fileSection < defaultFolder);
  assert.ok(defaultFolder < assetFolder);
  assert.ok(assetFolder < hideAssetFolder);
  assert.ok(hideAssetFolder < customFilter);
  assert.ok(customFilter < answerSection);

  const bundleFileSection = bundleSource.indexOf('containerEl.createEl("h3", { text: "\\u6587\\u4EF6\\u4E0E\\u8D44\\u6E90" })');
  const bundleAssetFolder = bundleSource.indexOf('setName("\\u8D44\\u6E90\\u6587\\u4EF6\\u5939")', bundleFileSection);
  const bundleAnswerSection = bundleSource.indexOf('containerEl.createEl("h3", { text: "\\u7B54\\u9898\\u4E0E\\u9898\\u5E93" })', bundleFileSection);
  assert.ok(bundleFileSection >= 0 && bundleAssetFolder > bundleFileSection && bundleAssetFolder < bundleAnswerSection);
});

test("branch appearance is a normalized global setting and appearance fallback", () => {
  assert.match(settingsSource, /nodeVisualStyle: NodeVisualStyle/);
  assert.match(settingsSource, /nodeVisualStyle: "card"/);
  assert.match(settingsSource, /nodeVisualStyle: settings\.nodeVisualStyle/);
  assert.match(mainSource, /nodeVisualStyle: raw\.nodeVisualStyle === "branch" \|\| raw\.nodeVisualStyle === "card"[\s\S]*DEFAULT_SETTINGS\.nodeVisualStyle/);

  const branchSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "连线与分支" })');
  const branchAppearance = settingsSource.indexOf('.setName("分支外观")', branchSection);
  assert.ok(branchSection >= 0 && branchAppearance > branchSection);
  assert.match(settingsSource.slice(branchAppearance), /圆润卡片分支（曲线）[\s\S]*圆角分支（折线）/);
  assert.match(bundleSource, /nodeVisualStyle: settings\.nodeVisualStyle/);
  assert.match(bundleSource, /nodeVisualStyle: raw\.nodeVisualStyle === "branch"/);
  assert.equal((bundleSource.match(/setValue\(this\.plugin\.settings\.nodeVisualStyle\)/g) ?? []).length, 1);
});

test("current-map appearance controls use a wide gap-free responsive layout", () => {
  assert.match(editorSource, /this\.modalEl\.addClass\("mmc-appearance-dialog"\)/);
  assert.match(editorSource, /appearanceLeftColumn[\s\S]*appearanceRightColumn/);
  assert.match(editorSource, /createAppearanceSection\(appearanceLeftColumn, "画布与字体"/);
  assert.match(editorSource, /createAppearanceSection\(appearanceRightColumn, "节点与文字"/);
  assert.match(editorSource, /createAppearanceSection\(appearanceLeftColumn, "连线与分支"/);
  assert.match(editorSource, /appearanceRightColumn\.createDiv\(\{ cls: "mmc-appearance-section mmc-appearance-article-numbering" \}\)/);
  assert.match(editorSource, /appearanceLeftColumn\.createDiv\(\{ cls: "mmc-appearance-section mmc-appearance-code-settings" \}\)/);
  assert.match(editorSource, /当前脑图设置，优先于插件全局分支外观/);
  assert.match(stylesSource, /\.mmc-appearance-dialog,[\s\S]*--modal-width: min\(1280px, 96vw\)[\s\S]*width: min\(1280px, 96vw\) !important/);
  assert.match(stylesSource, /\.mmc-appearance-columns[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(stylesSource, /\.mmc-appearance-column[\s\S]*flex-direction: column/);
  assert.match(stylesSource, /\.mmc-appearance-style-option span[\s\S]*white-space: normal[\s\S]*overflow-wrap: anywhere/);
  assert.match(stylesSource, /@media \(max-width: 900px\)[\s\S]*\.mmc-appearance-columns[\s\S]*grid-template-columns: 1fr/);
  assert.doesNotMatch(editorSource, /mmc-appearance-secondary-sections|mmc-appearance-sections/);
  assert.match(bundleSource, /this\.modalEl\.addClass\("mmc-appearance-dialog"\)/);
  assert.match(bundleReadableSource, /createAppearanceSection\(appearanceLeftColumn, "画布与字体"/);
  assert.match(bundleSource, /appearanceRightColumn\.createDiv\(\{ cls: "mmc-appearance-section mmc-appearance-article-numbering" \}\)/);
  assert.match(bundleReadableSource, /当前脑图设置，优先于插件全局分支外观/);
});
