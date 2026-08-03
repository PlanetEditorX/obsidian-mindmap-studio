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

test("node editor position is located in View and Reading settings", () => {
  const viewSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "视图与阅读" })');
  const nodeEditorPosition = settingsSource.indexOf('.setName("节点编辑器显示位置")');
  const shortcutSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "快捷键配置" })');
  assert.ok(viewSection >= 0);
  assert.ok(viewSection < nodeEditorPosition);
  assert.ok(nodeEditorPosition < shortcutSection);
  assert.doesNotMatch(settingsSource, /"新建与布局"/);
  assert.match(settingsSource, /"文件与布局": "文件与资源"/);
  assert.match(bundleReadableSource, /视图与阅读[\s\S]*节点编辑器显示位置[\s\S]*快捷键配置/);
});

test("article entry lock policy can restore article mode's own previous state", () => {
  const viewSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "视图与阅读" })');
  const articleEntryLock = settingsSource.indexOf('.setName("进入文章模式")', viewSection);
  const nodeEditorPosition = settingsSource.indexOf('.setName("节点编辑器显示位置")', viewSection);

  assert.match(settingsSource, /articleEntryLockMode: ArticleEntryLockMode/);
  assert.match(settingsSource, /articleEntryLockMode: "locked"/);
  assert.match(settingsSource, /articleLastReadOnly: true/);
  assert.ok(viewSection >= 0 && articleEntryLock > viewSection && articleEntryLock < nodeEditorPosition);
  assert.match(settingsSource.slice(articleEntryLock), /\.addOption\("locked", "默认锁定"\)[\s\S]*\.addOption\("inherit", "沿用进入前状态"\)[\s\S]*\.addOption\("remember", "记住上次文章状态"\)/);
  assert.match(mainSource, /articleEntryLockMode: normalizeArticleEntryLockMode\(raw\.articleEntryLockMode\)/);
  assert.match(mainSource, /articleLastReadOnly: raw\.articleLastReadOnly !== false/);
  assert.match(editorSource, /resolveArticleEntryReadOnly\([\s\S]*this\.options\.articleLastReadOnly/);
  assert.match(editorSource, /rememberArticleReadOnlyState\(\)[\s\S]*onArticleReadOnlyChange/);
  assert.match(bundleReadableSource, /进入文章模式[\s\S]*默认锁定[\s\S]*沿用进入前状态[\s\S]*记住上次文章状态/);
});

test("settings sections default closed and persist only the user's expanded list", () => {
  assert.match(settingsSource, /settingsExpandedSections: \[\]/);
  assert.doesNotMatch(settingsSource, /expandedSettingsSectionTitles = new Set<[^>]+>\(\["主题与外观"\]\)/);
  assert.match(settingsSource, /settingsExpandedSections = SETTINGS_SECTION_TITLES\.filter/);
  assert.match(settingsSource, /mmsProgrammaticToggle/);
  assert.match(mainSource, /settingsExpandedSections: normalizeSettingsExpandedSections\(raw\.settingsExpandedSections\)/);
});

test("node resize modifier is synchronized from live events and cannot swallow normal clicks", () => {
  assert.match(editorSource, /const syncResizeModifier = \(trackEvent: KeyboardEvent \| PointerEvent\): void => \{[\s\S]*trackEvent\.ctrlKey \|\| trackEvent\.metaKey/);
  assert.match(editorSource, /this\.rootEl\.addEventListener\("pointermove", syncResizeModifier, true\)/);
  assert.match(editorSource, /window\.addEventListener\("blur", clearResizeModifier\)/);
  assert.match(editorSource, /document\.addEventListener\("visibilitychange", clearResizeModifier\)/);
  const resizeHandle = editorSource.match(/const resizeHandle = nodeEl\.createDiv\([\s\S]*?resizeHandle\.addEventListener\("pointerdown"/)?.[0] ?? "";
  assert.match(resizeHandle, /resizeHandle\.addEventListener\("click", \(event\) => \{\s*if \(!event\.ctrlKey && !event\.metaKey\) return;/);
  assert.match(resizeHandle, /resizeHandle\.addEventListener\("dblclick", \(event\) => \{\s*if \(this\.readOnly\) return;\s*if \(!event\.ctrlKey && !event\.metaKey\) return;/);
});

test("branch appearance is a normalized global setting and appearance fallback", () => {
  assert.match(settingsSource, /nodeVisualStyle: NodeVisualStyle/);
  assert.match(settingsSource, /nodeVisualStyle: "card"/);
  assert.match(settingsSource, /nodeVisualStyle: settings\.nodeVisualStyle/);
  assert.match(mainSource, /nodeVisualStyle: raw\.nodeVisualStyle === "branch" \|\| raw\.nodeVisualStyle === "card"[\s\S]*DEFAULT_SETTINGS\.nodeVisualStyle/);

  const branchAppearance = settingsSource.indexOf('.setName("分支外观")');
  assert.ok(branchAppearance >= 0);
  assert.match(settingsSource, /createGroup\("节点与文字"[\s\S]*"分支外观"/);
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

test("global appearance mirrors the page toolbar groups instead of only sharing a title", () => {
  assert.match(settingsSource, /"主题与外观（全局默认）": "主题与外观"/);
  assert.match(settingsSource, /private organizeGlobalAppearanceSettings\(\): void/);
  assert.match(settingsSource, /text: "主题模板"/);
  for (const group of ["画布与字体", "节点与文字", "连线与分支", "阅读外观", "代码外观"]) {
    assert.ok(settingsSource.includes(`createGroup("${group}"`), `missing global appearance group: ${group}`);
  }
  assert.match(settingsSource, /createGroup\("节点与文字"[\s\S]*"分支外观"[\s\S]*"默认节点文字对齐"[\s\S]*"默认节点边框粗细"/);
  assert.match(settingsSource, /createGroup\("阅读外观"[\s\S]*"文章目录最大层级"[\s\S]*"文章\/通读缩略导航图"/);
  assert.match(settingsSource, /createGroup\("代码外观"[\s\S]*"代码默认折叠"[\s\S]*"不超过多少行时保持展开"[\s\S]*"超过多少行时显示行号"[\s\S]*"代码默认样式"/);
  assert.doesNotMatch(settingsSource, /containerEl\.createEl\("h3", \{ text: "代码行为" \}\)/);
  assert.match(settingsSource, /"代码行为": "主题与外观"/);
  assert.match(editorSource, /text: "代码外观"[\s\S]*text: "自动保持展开"[\s\S]*text: "自动显示行号"/);
  assert.match(editorSource, /codeAutoExpandMaxLines[\s\S]*codeAutoLineNumbersMinLines/);
  assert.match(editorSource, /this\.titleEl\.setText\("主题与外观"\)/);
  assert.match(stylesSource, /\.mms-global-appearance-groups[\s\S]*display: grid/);
});

test("continuous reading keeps the page appearance toolbar editable without unlocking content", () => {
  assert.match(editorSource, /this\.appearanceButton = this\.addToolbarButton\("appearance"/);
  assert.match(editorSource, /const appearanceDisabled = this\.readOnly && this\.currentMode !== "reading"/);
  assert.match(editorSource, /private mutatePageAppearance\(action: \(\) => void\): void/);
  assert.match(editorSource, /this\.readOnly && this\.currentMode !== "reading"/);
});

test("fit-to-view and bulk collapse use smooth viewport interpolation", () => {
  assert.match(editorSource, /private fitToView\(animated = true\): void/);
  assert.match(editorSource, /this\.animateViewportTo\(targetZoom, targetPanX, targetPanY, animated\)/);
  assert.match(editorSource, /private animateViewportTo\([\s\S]*requestAnimationFrame\(step\)/);
  assert.match(editorSource, /prefers-reduced-motion: reduce/);
  assert.match(editorSource, /if \(collapsed && this\.currentMode === "mindmap"\)[\s\S]*this\.fitToView\(true\)/);
});

test("toolbar removes the redundant open-link command and native white tooltips", () => {
  assert.doesNotMatch(settingsSource, /\["link", "打开链接"\]/);
  assert.doesNotMatch(editorSource, /打开节点链接|openSelectedLink|setTitle\("打开链接"\)/);

  const addToolbarButton = editorSource.match(/private addToolbarButton\([\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(addToolbarButton, /"aria-label": label/);
  assert.doesNotMatch(addToolbarButton, /title:/);
  assert.doesNotMatch(editorSource, /button\.setAttr\("title", label\)/);
  assert.doesNotMatch(editorSource, /this\.aiButton\.setAttr\("title"/);
  assert.match(editorSource, /button\.removeAttribute\("title"\)/);
});

test("collapse controls and fit-to-view are visible only in mind-map mode", () => {
  const updateModeUi = editorSource.match(/private updateModeUi\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(updateModeUi, /for \(const id of \["collapse", "collapse-all", "fit"\] as const\)/);
  assert.match(updateModeUi, /this\.currentMode !== "mindmap" \|\| !this\.options\.visibleToolbarItems\.includes\(id\)/);
});
