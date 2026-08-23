import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let settingsSource;
let mainSource;
let editorSource;
let modelSource;
let articleRendererSource;
let stylesSource;
let bundleSource;
let bundleReadableSource;

function decodeBundleUnicodeEscapes(source) {
  return source.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16))
  );
}

before(async () => {
  [settingsSource, mainSource, editorSource, modelSource, articleRendererSource, stylesSource, bundleSource] = await Promise.all([
    readFile("src/settings.ts", "utf8"),
    readFile("src/main.ts", "utf8"),
    readFile("src/editor/editor.ts", "utf8"),
    readFile("src/core/model.ts", "utf8"),
    readFile("src/editor/article-renderer.ts", "utf8"),
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
  const filePrefix = settingsSource.indexOf('.setName("新文件名前缀")', fileSection);
  const syncFilename = settingsSource.indexOf('.setName("中心节点标题同步文件名")', fileSection);
  const assetFolder = settingsSource.indexOf('.setName("资源文件夹")', fileSection);
  const hideAssetFolder = settingsSource.indexOf('.setName("在文件浏览器隐藏资源文件夹")', fileSection);
  const customFilter = settingsSource.indexOf('.setName("文件浏览器自定义筛选")', fileSection);
  const answerSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "答题与题库" })', fileSection);

  assert.ok(fileSection >= 0);
  assert.ok(fileSection < defaultFolder);
  assert.ok(defaultFolder < filePrefix);
  assert.ok(filePrefix < syncFilename);
  assert.ok(syncFilename < assetFolder);
  assert.ok(assetFolder < hideAssetFolder);
  assert.ok(hideAssetFolder < customFilter);
  assert.ok(customFilter < answerSection);

  const bundleFileSection = bundleSource.indexOf('containerEl.createEl("h3", { text: "\\u6587\\u4EF6\\u4E0E\\u8D44\\u6E90" })');
  const bundleAssetFolder = bundleSource.indexOf('setName("\\u8D44\\u6E90\\u6587\\u4EF6\\u5939")', bundleFileSection);
  const bundleAnswerSection = bundleSource.indexOf('containerEl.createEl("h3", { text: "\\u7B54\\u9898\\u4E0E\\u9898\\u5E93" })', bundleFileSection);
  assert.ok(bundleFileSection >= 0 && bundleAssetFolder > bundleFileSection && bundleAssetFolder < bundleAnswerSection);
});

test("interaction controls are located in Editing and Interaction settings", () => {
  const editSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "编辑与交互" })');
  const nodeEditorPosition = settingsSource.indexOf('.setName("节点编辑器显示位置")');
  const twoFingerGesture = settingsSource.indexOf('.setName("双指手势")', editSection);
  const searchSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "全局搜索" })', editSection);
  assert.ok(editSection >= 0);
  assert.ok(editSection < nodeEditorPosition);
  assert.ok(nodeEditorPosition < twoFingerGesture);
  assert.ok(twoFingerGesture < searchSection);
  assert.doesNotMatch(settingsSource, /"新建与布局"/);
  assert.match(settingsSource, /"文件与布局": "文件与资源"/);
  assert.match(bundleReadableSource, /编辑与交互[\s\S]*节点编辑器显示位置[\s\S]*双指手势[\s\S]*全局搜索/);
});

test("article entry lock policy can restore article mode's own previous state", () => {
  const viewSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "视图与阅读" })');
  const articleEntryLock = settingsSource.indexOf('.setName("进入文章模式")', viewSection);
  const articleTocDepth = settingsSource.indexOf('.setName("文章目录最大层级")', viewSection);

  assert.match(settingsSource, /articleEntryLockMode: ArticleEntryLockMode/);
  assert.match(settingsSource, /articleEntryLockMode: "locked"/);
  assert.match(settingsSource, /articleLastReadOnly: true/);
  assert.ok(viewSection >= 0 && articleEntryLock > viewSection && articleEntryLock < articleTocDepth);
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

test("every current-map appearance color control renders as an exact circular swatch", () => {
  assert.match(editorSource, /const row = label\.createDiv\(\{ cls: "mmc-color-row mmc-appearance-color-row" \}\);[\s\S]*正文颜色[\s\S]*标题颜色[\s\S]*强调色[\s\S]*纸张背景/);
  assert.match(stylesSource, /\.mmc-appearance-modal input\[type="color"\] \{[\s\S]*appearance: none;[\s\S]*width: 30px !important;[\s\S]*height: 30px;[\s\S]*aspect-ratio: 1;[\s\S]*border-radius: 50% !important;[\s\S]*clip-path: circle\(50% at 50% 50%\)/);
  assert.match(stylesSource, /\.mmc-appearance-modal input\[type="color"\]::-webkit-color-swatch-wrapper \{[\s\S]*border-radius: 50%/);
  assert.match(stylesSource, /\.mmc-appearance-modal input\[type="color"\]::-webkit-color-swatch \{[\s\S]*border-radius: 50%/);
  assert.match(stylesSource, /\.mmc-appearance-modal input\[type="color"\]::-moz-color-swatch \{[\s\S]*border-radius: 50%/);
});

test("toolbar marker color uses the same follow-theme representation as settings", () => {
  assert.match(editorSource, /text: "末端正文标识颜色"[\s\S]*text: "跟随主题"[\s\S]*"aria-pressed": "true"/);
  assert.match(editorSource, /setMarkerColorFollowsTheme[\s\S]*syncMarkerColorPreview/);
  assert.match(editorSource, /leafMarkerColor: markerColorFollowsTheme \? undefined : markerColor\.value/);
  assert.doesNotMatch(editorSource, /标识颜色来源|markerColorFollowGlobal|跟随插件设置"\s*\}\);/);
  assert.doesNotMatch(stylesSource, /\.mmc-appearance-color-row button\.is-active/);
});

test("article directory exposes every preserved and previewed style without circular bullets", () => {
  for (const [id, label] of [
    ["card", "卡片（当前样式）"],
    ["plain", "简洁"],
    ["lines", "引导线"],
    ["original", "最初样式"],
    ["minimal-page", "极简书页"],
    ["report", "现代报告"],
    ["magazine", "杂志索引"],
    ["tree", "层级树线"]
  ]) {
    assert.ok(editorSource.includes(`["${id}", "${label}"]`), `missing directory style option: ${id}`);
    assert.ok(modelSource.includes(`input.tocStyle === "${id}"`), `missing directory style normalization: ${id}`);
  }
  assert.match(modelSource, /export type ArticleTocStyle = "card" \| "plain" \| "lines" \| "original" \| "minimal-page" \| "report" \| "magazine" \| "tree"/);
  assert.match(settingsSource, /\.setName\("文章目录样式"\)[\s\S]*?\.setValue\(this\.plugin\.settings\.articleTocStyle\)/);
  assert.match(settingsSource, /createGroup\("阅读样式"[\s\S]*?"文章目录最大层级", "文章目录样式", "文章\/通读缩略导航图"/);
  assert.match(mainSource, /articleTocStyle: raw\.articleTocStyle === "plain"[\s\S]*?: "card"/);
  assert.match(editorSource, /跟随插件设置（当前：\$\{tocStyleNames\[globalDefaults\.tocStyle\]\}）/);
  assert.match(editorSource, /tocStyle: tocStyle\.value \? tocStyle\.value as ArticleStyle\["tocStyle"\] : undefined/);
  assert.match(articleRendererSource, /tocStyle: options\.document\.articleStyle\?\.tocStyle \?\? options\.articleTocStyle/);
  assert.match(articleRendererSource, /mms-article-toc-number[\s\S]*entry\.label[\s\S]*mms-article-toc-title/);
  assert.match(stylesSource, /\.mms-article-toc-page li::before \{\s*display: none;\s*\}/);
  assert.doesNotMatch(stylesSource, /\.mms-article-toc-page li::before \{[^}]*border-radius: 50%/);
  for (const selector of ["toc-original", "toc-minimal-page", "toc-report", "toc-magazine", "toc-tree"]) {
    assert.ok(stylesSource.includes(`.mms-article-page.${selector} .mms-article-toc-page`), `missing directory CSS: ${selector}`);
  }
  assert.match(stylesSource, /\.mms-article-page\.toc-magazine \.mms-article-toc-page > ol \{\s*display: block;/);
  assert.match(stylesSource, /\.mms-article-page\.toc-magazine \.mms-article-toc-page li \{[\s\S]*?width: 100%;/);
});

test("article directory uses a responsive accessible modern layout", () => {
  assert.match(stylesSource, /\.mms-article-toc-page \{[\s\S]*border-radius: clamp\(14px, 2vw, 22px\)[\s\S]*radial-gradient[\s\S]*box-shadow:/);
  assert.match(stylesSource, /\.mms-article-toc-page > h2 \{[\s\S]*text-align: left/);
  assert.match(stylesSource, /\.mms-article-toc-page a::after \{[\s\S]*content: "→"[\s\S]*opacity: 0/);
  assert.match(stylesSource, /\.mms-article-toc-page a:focus-visible \{[\s\S]*outline: 2px solid/);
  assert.match(stylesSource, /\.mms-article-page\.toc-lines \.mms-article-toc \{[\s\S]*border-left: 3px solid/);
  assert.match(stylesSource, /@media \(max-width: 600px\)[\s\S]*\.mms-article-toc-page \{[\s\S]*padding: 20px 14px/);
  assert.match(stylesSource, /\.mms-article-toc-page li\.is-return-target > a \{[\s\S]*box-shadow: inset 3px 0 0/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.mms-article-toc-page a,[\s\S]*transition: none/);
});

test("global appearance mirrors the page toolbar groups instead of only sharing a title", () => {
  assert.match(settingsSource, /"主题与外观（全局默认）": "主题与外观"/);
  assert.match(settingsSource, /private organizeGlobalAppearanceSettings\(\): void/);
  assert.match(settingsSource, /text: "主题模板"/);
  for (const group of ["画布与字体", "节点与文字", "连线与分支", "阅读样式", "代码外观"]) {
    assert.ok(settingsSource.includes(`createGroup("${group}"`), `missing global appearance group: ${group}`);
  }
  assert.match(settingsSource, /createGroup\("节点与文字"[\s\S]*"分支外观"[\s\S]*"默认节点文字对齐"[\s\S]*"默认节点边框粗细"/);
  assert.match(settingsSource, /createGroup\("阅读样式"[\s\S]*"文章目录最大层级"[\s\S]*"文章\/通读缩略导航图"[\s\S]*"末端正文标识"[\s\S]*"末端正文转序号阈值"/);
  assert.match(settingsSource, /themeGroup\.append\(defaultThemeSetting\)/);
  assert.match(settingsSource, /createGroup\("代码外观"[\s\S]*"代码默认折叠"[\s\S]*"不超过多少行时保持展开"[\s\S]*"超过多少行时显示行号"[\s\S]*"代码默认样式"/);
  assert.doesNotMatch(settingsSource, /containerEl\.createEl\("h3", \{ text: "代码行为" \}\)/);
  assert.match(editorSource, /this\.titleEl\.setText\("主题与外观"\)/);
  assert.match(stylesSource, /\.mms-global-appearance-groups[\s\S]*display: grid/);
});

test("view defaults and file naming settings are grouped by their actual responsibility", () => {
  const themeSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "主题与外观" })');
  const viewSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "视图与阅读" })');
  const toolbarSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "工具栏" })');
  const fileSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "文件与资源" })');
  const answerSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "答题与题库" })', fileSection);
  const imageSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "图片与图床" })');
  const canvasHeading = settingsSource.indexOf('containerEl.createEl("h3", { text: "画布与背景" })', imageSection);

  const defaultTheme = settingsSource.indexOf('.setName("默认明暗模式")');
  const defaultLayout = settingsSource.indexOf('.setName("默认布局")');
  const autoFit = settingsSource.indexOf('.setName("打开时自动适应画布")');
  const embedHeight = settingsSource.indexOf('.setName("嵌入预览最大高度")');
  const filePrefix = settingsSource.indexOf('.setName("新文件名前缀")');
  const syncFilename = settingsSource.indexOf('.setName("中心节点标题同步文件名")');

  assert.ok(themeSection < defaultTheme && defaultTheme < viewSection);
  assert.ok(viewSection < defaultLayout && defaultLayout < toolbarSection);
  assert.ok(viewSection < autoFit && autoFit < toolbarSection);
  assert.ok(viewSection < embedHeight && embedHeight < toolbarSection);
  assert.ok(fileSection < filePrefix && filePrefix < answerSection);
  assert.ok(fileSection < syncFilename && syncFilename < answerSection);
  assert.ok(imageSection < canvasHeading);
  assert.ok(filePrefix < imageSection && syncFilename < imageSection);
  assert.match(settingsSource, /"代码行为": "主题与外观"/);
  assert.match(settingsSource, /title === "代码行为"[\s\S]*return \["主题与外观"\]/);
});

test("fit-to-view and bulk collapse use smooth viewport interpolation", () => {
  assert.match(editorSource, /private fitToView\(animated = true\): void/);
  assert.match(editorSource, /this\.animateViewportTo\(targetZoom, targetPanX, targetPanY, animated\)/);
  assert.match(editorSource, /private animateViewportTo\([\s\S]*requestAnimationFrame\(step\)/);
  assert.match(editorSource, /prefers-reduced-motion: reduce/);
  assert.match(editorSource, /if \(collapsed && this\.currentMode === "mindmap"\)[\s\S]*this\.fitToView\(true\)/);
});

test("appearance panel opens at the top instead of focusing the footer action", () => {
  assert.match(editorSource, /const restoreScrollTop = \(\): void => \{[\s\S]*this\.contentEl\.scrollTop = 0/);
  assert.match(editorSource, /window\.requestAnimationFrame\(\(\) => \{[\s\S]*window\.requestAnimationFrame\(restoreScrollTop\)/);
  assert.doesNotMatch(editorSource, /save\.focus\(\)/);
});

test("toolbar controls expose only Obsidian tooltips and no native title tooltip", () => {
  const toolbarBuilder = editorSource.slice(editorSource.indexOf("const modeGroup = this.toolbarEl"), editorSource.indexOf("const keydown =", editorSource.indexOf("const modeGroup = this.toolbarEl")));
  assert.doesNotMatch(toolbarBuilder, /title:/);
  assert.match(toolbarBuilder, /"aria-label": `\$\{DISPLAY_MODE_LABELS\[mode\]\}模式`/);
  assert.match(editorSource, /const removeNativeToolbarTooltip = \(event: PointerEvent\): void =>/);
  assert.match(editorSource, /control\.removeAttribute\("title"\)/);
});

test("task status is removed from settings, toolbar, node editing, rendering, and shortcuts", () => {
  assert.doesNotMatch(settingsSource, /\["task", "任务状态"\]|showTaskProgress|显示任务进度/);
  assert.doesNotMatch(editorSource, /任务状态|cycleTask|nextTaskStatus|getTaskProgress|mmc-task-progress|mmc-task-icon/);
  assert.doesNotMatch(editorSource, /mod && event\.key === "Enter"[\s\S]*cycleTask/);
  assert.doesNotMatch(bundleReadableSource, /任务状态|显示任务进度/);
  assert.match(mainSource, /delete \(this\.settings as unknown as Record<string, unknown>\)\.showTaskProgress/);
});

test("mind-map branch controls keep their original circular node style", () => {
  assert.match(stylesSource, /\.mmc-fold-button,\s*\n\.mmc-node-link\s*\{[\s\S]*position: absolute[\s\S]*width: 22px[\s\S]*height: 22px[\s\S]*border-radius: 50%/);
  assert.match(stylesSource, /\.mmc-fold-button\s*\{[\s\S]*right: -11px[\s\S]*bottom: -11px/);
});

test("toolbar hides unavailable actions with a reduced-motion-aware width transition", () => {
  assert.match(editorSource, /private toolbarItemAvailable\([\s\S]*?id: ToolbarItemId,[\s\S]*?context: ToolbarAvailabilityContext[\s\S]*?\): boolean/);
  assert.match(editorSource, /case "undo": return canEdit && this\.history\.canUndo\(\)/);
  assert.match(editorSource, /case "collapse": return this\.currentMode === "mindmap" && Boolean\(selected\?\.children\.length\)/);
  assert.match(editorSource, /case "layout": return this\.currentMode === "mindmap" && canEdit/);
  assert.match(editorSource, /button\.toggleClass\("is-hidden", !visible\)/);
  assert.match(editorSource, /button\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(editorSource, /this\.updateToolbarAvailability\(\);[\s\S]*private ensureEditable/);
  assert.match(stylesSource, /\.mmc-toolbar\.is-toolbar-ready \.mmc-toolbar-button[\s\S]*transition:/);
  assert.match(stylesSource, /\.mmc-toolbar-button\.is-hidden[\s\S]*max-width: 0[\s\S]*opacity: 0 !important/);
  assert.doesNotMatch(stylesSource, /\.mmc-toolbar-button\.is-hidden\s*\{\s*display: none/);
  assert.match(editorSource, /this\.zoomControlEl\?\.toggleClass\("is-hidden", this\.currentMode !== "mindmap"\)/);
  assert.match(stylesSource, /\.mmc-zoom-control\.is-hidden[\s\S]*max-width: 0[\s\S]*opacity: 0/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.mmc-toolbar\.is-toolbar-ready \.mmc-toolbar-button,[\s\S]*\.mmc-toolbar\.is-toolbar-ready \.mmc-zoom-control \{ transition: none; \}/);
});

test("toolbar keeps capture actions together and merges every export entry at the end", async () => {
  const modalSource = await readFile("src/editor/editor-modals.ts", "utf8");
  const toolbarItems = settingsSource.slice(settingsSource.indexOf("export const TOOLBAR_ITEMS"), settingsSource.indexOf("export const SETTINGS_SECTION_TITLES"));
  assert.match(toolbarItems, /\["screenshot", "插入截图"\], \["screenshot-recognize", "插入截图并识别"\]/);
  assert.match(toolbarItems, /\["markdown", "Markdown 大纲"\], \["import-export", "导入与导出"\][\s\S]*\] as const/);
  assert.match(settingsSource, /json: "import-export"[\s\S]*"export-document": "import-export"[\s\S]*"export-svg": "import-export"/);
  assert.match(settingsSource, /withoutPinned\.splice\(insertionIndex, 0, "screenshot", "screenshot-recognize"\)/);
  assert.match(settingsSource, /withoutPinned\.push\("import-export"\)/);
  const builder = editorSource.slice(editorSource.indexOf('this.addToolbarButton("screenshot"'), editorSource.indexOf("this.applyToolbarOrder()"));
  assert.match(builder, /addToolbarButton\("screenshot"[\s\S]*addToolbarButton\("screenshot-recognize"/);
  assert.doesNotMatch(builder, /addToolbarButton\("json"|addToolbarButton\("export-document"|addToolbarButton\("export-svg"/);
  assert.match(builder, /addToolbarButton\("import-export", "arrow-left-right", "导入与导出"/);
  assert.match(modalSource, /export class ImportExportModal extends Modal/);
  assert.match(modalSource, /\["svg", "SVG"[\s\S]*\["html", "HTML"[\s\S]*\["doc", "Word"[\s\S]*\["pdf", "PDF"[\s\S]*\["md", "Markdown"/);
  assert.doesNotMatch(modalSource, /export class DocumentExportModal/);
});


test("article context progress is opt-in and grouped with view and reading settings", () => {
  const viewSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "视图与阅读" })');
  const progressSetting = settingsSource.indexOf('.setName("显示右下角加载进度")', viewSection);
  const toolbarSection = settingsSource.indexOf('containerEl.createEl("h3", { text: "工具栏" })');
  assert.ok(viewSection >= 0 && progressSetting > viewSection && progressSetting < toolbarSection);
  assert.match(settingsSource, /showArticleContextProgress: false/);
  assert.match(mainSource, /showArticleContextProgress: raw\.showArticleContextProgress === true/);
  assert.match(editorSource, /this\.options\.showArticleContextProgress === true[\s\S]*currentMode === "article"[\s\S]*currentMode === "reading"/);
});
