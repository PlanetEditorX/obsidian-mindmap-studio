import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";

let source;
let styles;
let bundle;
let mainSource;

before(async () => {
  source = await readFile("src/search/global-search.ts", "utf8");
  styles = await readFile("styles.css", "utf8");
  bundle = await readFile("main.js", "utf8");
  mainSource = await readFile("src/main.ts", "utf8");
});

test("single-result replacement is right-aligned and vertically centered", () => {
  assert.match(source, /const actions = item\.createDiv\(\{ cls: "mms-global-search-result-actions" \}\)/);
  assert.match(source, /const replaceOneBtn = actions\.createEl\("button"/);
  assert.match(source, /replaceOneBtn\.createSpan\(\{ text: "替换此节点" \}\)/);
  assert.match(styles, /\.mms-global-search-result-actions \{[\s\S]*justify-content: flex-end/);
  assert.match(styles, /\.mms-global-search-replace-one \{[\s\S]*min-width: 132px;[\s\S]*min-height: 34px/);
});

test("global search indexes only node text while displaying the result file context", () => {
  assert.match(source, /const searchText = normalized\(nodePlainText\(node\)\)/);
  assert.doesNotMatch(source, /nodeSearchText\(node\)|fieldValues\(node\)|"子导图"/);
  assert.match(source, /matchedKinds: \["节点文字"\]/);
  assert.match(source, /const location = item\.createDiv\(\{ cls: "mms-global-search-result-file" \}\)/);
  assert.match(source, /text: result\.fileTitle/);
  assert.match(source, /text: result\.filePath/);
  assert.doesNotMatch(source, /mms-global-search-result-badges/);
  assert.match(styles, /\.mms-global-search-result-title \{[\s\S]*flex: 1 1 auto;[\s\S]*overflow-wrap: anywhere/);
  assert.match(styles, /\.mms-global-search-result \{[\s\S]*position: relative;[\s\S]*padding: 10px 166px 10px 14px/);
  assert.match(styles, /\.mms-global-search-result-actions \{[\s\S]*position: absolute;[\s\S]*top: 50%;[\s\S]*right: 14px;[\s\S]*transform: translateY\(-50%\)/);
  assert.match(styles, /\.mms-global-search-result-file \{[\s\S]*margin-top: 6px/);
  assert.match(styles, /\.mms-global-search-result-path \{[\s\S]*text-overflow: ellipsis/);
  assert.doesNotMatch(styles, /mms-global-search-badge/);
});


test("replace all searches the complete active scope instead of the capped visible result list", () => {
  assert.match(source, /const allResults = this\.index\.search\(query, Number\.MAX_SAFE_INTEGER, this\.scopePaths, this\.useRegex\)/);
  assert.match(source, /this\.onReplaceAll\(allResults, query, this\.replaceInputEl\.value, this\.useRegex\)/);
  assert.doesNotMatch(source, /this\.onReplaceAll\(this\.renderedResults/);
  assert.match(source, /async refreshFile\(file: TFile\): Promise<void>/);
});


test("global and map-family search entries share the same modal close path", () => {
  assert.match(mainSource, /openGlobalSearchAfterIndexReady\(\)[\s\S]*new GlobalMindMapSearchModal\(/);
  assert.match(mainSource, /openMapFamilySearch\(file: TFile[\s\S]*new GlobalMindMapSearchModal\(/);
  assert.equal((mainSource.match(/new GlobalMindMapSearchModal\(/g) ?? []).length, 2);
});



test("global search entry is singleton while map-family search remains independent", () => {
  assert.match(mainSource, /private globalSearchModal: GlobalMindMapSearchModal \| null = null/);
  assert.match(mainSource, /private globalSearchLaunchPending = false/);
  assert.match(mainSource, /openGlobalSearch\(\): void \{[\s\S]*this\.globalSearchModal\?\.isMounted\(\)[\s\S]*open-deduplicated[\s\S]*this\.globalSearchLaunchPending = true[\s\S]*openGlobalSearchAfterIndexReady\(\)\.finally/);
  assert.match(mainSource, /openGlobalSearchAfterIndexReady\(\): Promise<void> \{[\s\S]*this\.globalSearchModal\?\.isMounted\(\)[\s\S]*const modal = new GlobalMindMapSearchModal\([\s\S]*this\.globalSearchModal = modal;[\s\S]*modal\.open\(\)/);
  assert.match(source, /isMounted\(\): boolean \{[\s\S]*this\.modalEl\.isConnected \|\| this\.containerEl\.isConnected/);
  assert.match(bundle, /this\.globalSearchLaunchPending = false/);
  assert.match(bundle, /openGlobalSearch\(\) \{[\s\S]*globalSearchModal[\s\S]*open-deduplicated[\s\S]*globalSearchLaunchPending = true/);
  assert.match(bundle, /isMounted\(\) \{[\s\S]*this\.modalEl\.isConnected \|\| this\.containerEl\.isConnected/);
  const familyBlock = mainSource.slice(mainSource.indexOf("async openMapFamilySearch("), mainSource.indexOf("async rebuildGlobalSearchIndex("));
  assert.doesNotMatch(familyBlock, /globalSearchModal|globalSearchLaunchPending|open-deduplicated/);
});
test("opening either global or map-family results uses one native Modal.close without synthetic backdrop events or blocking navigation", () => {
  const bundleSearchModal = bundle.slice(bundle.indexOf("var GlobalMindMapSearchModal"), bundle.indexOf("// src/ai/client.ts"));
  assert.match(source, /private openingResult = false/);
  assert.doesNotMatch(source, /hostClosePromise|resolveHostClose|waitForHostClose/);
  assert.match(source, /private dismissResultPanel\(\): void/);
  assert.match(source, /this\.shouldRestoreSelection = false/);
  assert.match(source, /this\.onDebug\?\.\("result-close-request"/);
  assert.match(source, /this\.close\(\);/);
  assert.match(source, /this\.onDebug\?\.\("result-close-return"/);
  assert.equal((source.match(/this\.close\(\);/g) ?? []).length, 1, "result opening must issue exactly one native Modal.close request");
  assert.match(source, /private waitForResultNavigationTurn\(\): Promise<void>/);
  assert.match(source, /ownerWindow\.requestAnimationFrame\(\(\) => ownerWindow\.requestAnimationFrame\(\(\) => resolve\(\)\)\)/);
  assert.match(source, /this\.dismissResultPanel\(\);[\s\S]*await this\.waitForResultNavigationTurn\(\);[\s\S]*this\.onDebug\?\.\("result-navigation-start"[\s\S]*await this\.onOpenResult\(result\);/);
  assert.match(source, /onClose\(\): void \{[\s\S]*this\.onDebug\?\.\("modal-on-close"/);
  assert.doesNotMatch(source, /backdrop\.click\(\)|querySelector<HTMLElement>\("\.modal-bg"\)|new PointerEvent|dispatchEvent|mms-global-search-result-opening|mms-global-search-container-closing|style\.setProperty\("display", "none"|this\.modalEl\.remove\(\)|container\.remove\(\)|removeSearchLayers/);
  assert.doesNotMatch(styles, /mms-global-search-result-opening|mms-global-search-container-closing/);
  assert.doesNotMatch(bundleSearchModal, /backdrop\.click\(\)|querySelector\("\.modal-bg"\)|hostClosePromise|waitForHostClose|mms-global-search-result-opening|removeSearchLayers/);
  assert.match(bundleSearchModal, /this\.shouldRestoreSelection = false/);
  assert.match(bundleSearchModal, /this\.close\(\)/);
  assert.match(bundleSearchModal, /requestAnimationFrame\(\(\) => ownerWindow\.requestAnimationFrame/);
  assert.match(bundleSearchModal, /await this\.waitForResultNavigationTurn\(\);[\s\S]*await this\.onOpenResult\(result\);/);
});
