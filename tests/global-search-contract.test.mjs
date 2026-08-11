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

test("opening either global or map-family results forcibly removes every surviving search modal before navigation", () => {
  assert.match(source, /private openingResult = false/);
  assert.match(source, /private dismissResultPanel\(\): void/);
  assert.match(source, /containers\.add\(this\.containerEl\)/);
  assert.match(source, /this\.modalEl\.closest<HTMLElement>\("\.modal-container"\)/);
  assert.match(source, /element\.style\.setProperty\("display", "none", "important"\)/);
  assert.match(source, /element\.style\.setProperty\("visibility", "hidden", "important"\)/);
  assert.match(source, /hideImmediately\(this\.modalEl\)/);
  assert.match(source, /this\.close\(\);[\s\S]*this\.modalEl\.remove\(\);[\s\S]*for \(const container of containers\) container\.remove\(\);/);
  assert.match(source, /ownerDocument[\s\S]*querySelectorAll<HTMLElement>\("\.mms-global-search-modal, \.mms-global-search-container-closing"\)/);
  assert.match(source, /container\.addClass\("mms-global-search-container-closing"\)/);
  assert.match(source, /ownerWindow\?\.setTimeout\(removeSearchLayers, 0\)/);
  assert.match(source, /ownerWindow\?\.setTimeout\(removeSearchLayers, 120\)/);
  assert.match(styles, /\.mms-global-search-container-closing \{[\s\S]*display: none !important;[\s\S]*pointer-events: none !important/);
  assert.match(source, /this\.dismissResultPanel\(\);[\s\S]*await this\.onOpenResult\(result\);/);
  assert.match(bundle, /querySelectorAll\("\.mms-global-search-modal, \.mms-global-search-container-closing"\)/);
  assert.match(bundle, /setTimeout\(removeSearchLayers, 120\)/);
});
