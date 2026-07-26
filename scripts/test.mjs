import assert from "node:assert/strict";
import { readFile, writeFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { strToU8, zipSync } from "fflate";
import { nextVersion } from "./next-version.mjs";

assert.equal(nextVersion("1.6.8"), "1.6.9");
assert.equal(nextVersion("1.6.9"), "1.7.0");
assert.equal(nextVersion("1.9.9"), "1.10.0");

const tempDir = await mkdtemp(join(tmpdir(), "mindmap-studio-test-"));
const outfile = join(tempDir, "model.cjs");
const layoutOutfile = join(tempDir, "layout.cjs");
const searchOutfile = join(tempDir, "global-search.cjs");
const modesOutfile = join(tempDir, "modes.cjs");
const importExportOutfile = join(tempDir, "import-export.cjs");
const historyOutfile = join(tempDir, "history-manager.cjs");
const dragDropOutfile = join(tempDir, "drag-drop.cjs");
const nodeActionsOutfile = join(tempDir, "node-actions.cjs");
const collisionOutfile = join(tempDir, "collision-layout.cjs");
const clipboardOutfile = join(tempDir, "clipboard-import.cjs");
const obsidianStub = join(tempDir, "obsidian-stub.mjs");

try {
  await build({
    entryPoints: ["src/core/model.ts"],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/import/import-export.ts"],
    outfile: importExportOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/render/layout.ts"],
    outfile: layoutOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/article/modes.ts"],
    outfile: modesOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/editor/history-manager.ts"],
    outfile: historyOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/editor/drag-drop.ts"],
    outfile: dragDropOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/editor/node-actions.ts"],
    outfile: nodeActionsOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/render/collision-layout.ts"],
    outfile: collisionOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/editor/clipboard-import.ts"],
    outfile: clipboardOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await writeFile(obsidianStub, `export class App {}
export class Modal { constructor() {} }
export class Notice {}
export class TFile {}
export const normalizePath = (value) => value;
export const setIcon = () => {};
`);
  await build({
    entryPoints: ["src/search/global-search.ts"],
    outfile: searchOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    alias: { obsidian: obsidianStub },
    logLevel: "silent"
  });

  const require = createRequire(import.meta.url);
  const model = require(outfile);
  const layout = require(layoutOutfile);
  const globalSearch = require(searchOutfile);
  const modes = require(modesOutfile);
  const importExport = require(importExportOutfile);
  const { DocumentHistory } = require(historyOutfile);
  const dragDrop = require(dragDropOutfile);
  const nodeActions = require(nodeActionsOutfile);
  const collisionLayout = require(collisionOutfile);
  const clipboardImport = require(clipboardOutfile);
  const document = model.createDefaultDocument("测试脑图");
  const xmindArchive = zipSync({
    "content.json": strToU8(JSON.stringify([
      {
        id: "sheet-main",
        rootTopic: {
          title: "XMind 根",
          children: { attached: [{ title: "分支 A" }, { title: "子导图", href: "xmind:#sheet-child" }] }
        }
      },
      {
        id: "sheet-child",
        rootTopic: { id: "topic-child-root", title: "子导图", children: { attached: [{ title: "子主题 1", children: { attached: [{ title: "子主题 2" }] } }] } }
      },
      { id: "sheet-extra", rootTopic: { title: "未链接画布", children: { attached: [{ title: "独立主题" }] } } }
    ]))
  });
  const importedXmind = importExport.xmindToDocument(xmindArchive.buffer, "fallback");
  assert.equal(importedXmind.root.text, "XMind 根");
  assert.equal(importedXmind.root.children[0]?.text, "分支 A");
  assert.equal(importedXmind.root.children[1]?.text, "子导图", "linked XMind sheets must remain nested below their source topic");
  assert.equal(importedXmind.root.children[1]?.children[0]?.children[0]?.text, "子主题 2", "linked XMind sheets must retain every nested topic");
  assert.equal(importedXmind.root.children[2]?.text, "未链接画布", "XMind sheets without a link must still be imported instead of discarded");
  const rootTopicLinkedArchive = zipSync({
    "content.json": strToU8(JSON.stringify([
      {
        id: "sheet-parent",
        rootTopic: { title: "父导图", children: { attached: [{ title: "节点 A", href: "xmind:#topic-child-root" }] } }
      },
      {
        id: "sheet-child",
        rootTopic: { id: "topic-child-root", title: "节点 A", children: { attached: [{ title: "子导图内容" }] } }
      }
    ]))
  });
  const rootTopicLinkedDocument = importExport.xmindToDocument(rootTopicLinkedArchive.buffer, "fallback");
  assert.deepEqual(rootTopicLinkedDocument.root.children.map((node) => node.text), ["节点 A"], "a sheet linked by its root topic ID must not be imported again as an orphan branch");
  assert.equal(rootTopicLinkedDocument.root.children[0]?.children[0]?.text, "子导图内容", "a root-topic-ID link must merge the child map content into its source node");
  assert.match(importExport.documentToHtml(importedXmind), /<!doctype html>/);
  const mergedHtml = importExport.readingSectionsToHtml([
    { filePath: "root.mindmap", document: importedXmind, baseDepth: 0 },
    { filePath: "child.mindmap", document: model.createDefaultDocument("子导图"), baseDepth: 1 }
  ]);
  assert.match(mergedHtml, /XMind 根/);
  assert.match(mergedHtml, /子导图/);
  document.appearance = {
    backgroundColor: "#fef3c7",
    backgroundPattern: "dots",
    fontFamily: "serif",
    fontSize: 18,
    themePreset: "sunset-orange",
    rootColor: "#c2410c",
    rootTextColor: "#ffffff",
    edgeColor: "#dc2626",
    edgeWidth: 3,
    edgeStyle: "elbow",
    edgeWidthMode: "tapered",
    edgeMinWidth: 1,
    colorfulBranches: true,
    branchColors: ["#dc2626", "#2563eb"],
    bold: true,
    italic: true,
    underline: true,
    nodeTextAlign: "left"
  };
  document.view = { articleLandingMode: "toc", articleTocMaxDepth: 6 };
  document.articleStyle = {
    preset: "book",
    textColor: "#332b24",
    headingColor: "#241c16",
    accentColor: "#8b5e3c",
    backgroundColor: "#fffdf7",
    tocStyle: "lines",
    fontSize: 17,
    lineHeight: 2
  };
  document.root.children[0].children.push({ id: "depth-2", text: "二级节点", children: [{ id: "depth-3", text: "三级节点", children: [] }] });
  document.root.children.push({ id: "saved-node", text: "保存后仍可编辑", children: [] });

  const serialized = model.serializeDocument(document);
  assert.ok(serialized.trim().startsWith("{"), "new files must be raw JSON");
  assert.ok(!serialized.includes("```"), "new files must not use Markdown fences");
  assert.ok(!serialized.includes("smm-version"), "new files must not use the old namespace");

  const reopened = model.parseDocument(serialized, "fallback");
  assert.equal(reopened.title, "测试脑图");
  assert.equal(reopened.version, 10);
  assert.equal(reopened.appearance?.backgroundPattern, "dots");
  assert.equal(reopened.appearance?.edgeStyle, "elbow");
  assert.equal(reopened.appearance?.edgeWidthMode, "tapered");
  assert.equal(reopened.appearance?.edgeMinWidth, 1);
  assert.equal(reopened.appearance?.themePreset, "sunset-orange");
  assert.equal(reopened.appearance?.rootColor, "#c2410c");
  assert.deepEqual(reopened.appearance?.branchColors, ["#dc2626", "#2563eb"]);
  assert.equal(reopened.appearance?.underline, true);
  assert.equal(reopened.appearance?.nodeTextAlign, "left");
  assert.equal(reopened.view?.articleLandingMode, "toc");
  assert.equal(reopened.view?.articleTocMaxDepth, 6, "per-document TOC depth overrides must survive serialization");
  assert.equal(reopened.articleStyle?.preset, "book");
  assert.equal(reopened.articleStyle?.tocStyle, "lines");
  assert.equal(reopened.articleStyle?.fontSize, 17);
  assert.equal(reopened.root.children.at(-1)?.text, "保存后仍可编辑");
  const legacyArticleLanding = model.normalizeDocument({ view: { articleLandingMode: "map" } }, "兼容测试");
  assert.equal(legacyArticleLanding.view?.articleLandingMode, "article", "the short-lived map state must migrate to original article content");

  const reorderRoot = model.normalizeDocument({
    title: "同级拖动排序",
    root: {
      id: "drag-root", text: "根", children: [
        { id: "drag-a", text: "A", children: [] },
        { id: "drag-b", text: "B", children: [] },
        { id: "drag-c", text: "C", children: [{ id: "drag-c-child", text: "C1", children: [] }] }
      ]
    }
  }, "fallback").root;
  assert.equal(model.moveNodeRelative(reorderRoot, "drag-c", "drag-a", "before"), true);
  assert.deepEqual(reorderRoot.children.map((node) => node.id), ["drag-c", "drag-a", "drag-b"], "a sibling must move upward before the target");
  assert.equal(model.moveNodeRelative(reorderRoot, "drag-c", "drag-b", "after"), true);
  assert.deepEqual(reorderRoot.children.map((node) => node.id), ["drag-a", "drag-b", "drag-c"], "a sibling must move downward after the target");
  assert.equal(model.moveNodeRelative(reorderRoot, "drag-a", "drag-c", "child"), true);
  assert.deepEqual(reorderRoot.children.map((node) => node.id), ["drag-b", "drag-c"]);
  assert.deepEqual(reorderRoot.children[1]?.children.map((node) => node.id), ["drag-c-child", "drag-a"], "dropping in the center must preserve child reparenting");
  assert.equal(model.moveNodeRelative(reorderRoot, "drag-c", "drag-c-child", "child"), false, "a node cannot move inside its own descendant");
  assert.equal(model.moveNodeRelative(reorderRoot, "drag-root", "drag-b", "before"), false, "the root node cannot be moved");
  assert.equal(dragDrop.canMoveNodes(reorderRoot, new Set(), "drag-b", "drag-c"), true);
  assert.equal(dragDrop.canMoveNodes(reorderRoot, new Set(), "drag-c", "drag-c-child"), false);
  assert.equal(dragDrop.resolveDropPosition({ clientX: 95, clientY: 50 }, { left: 0, top: 0, width: 100, height: 100 }, false), "child");
  assert.equal(dragDrop.resolveDropPosition({ clientX: 50, clientY: 10 }, { left: 0, top: 0, width: 100, height: 100 }, false), "before");

  const history = new DocumentHistory(() => 10);
  const historyFirst = model.createDefaultDocument("历史一");
  const historySecond = model.createDefaultDocument("历史二");
  history.capture(historyFirst);
  assert.equal(history.undo(historySecond)?.title, "历史一");
  assert.equal(history.redo(historyFirst)?.title, "历史二");
  history.reset();
  assert.equal(history.undo(historySecond), null);

  const actionRoot = model.normalizeDocument({
    root: {
      id: "action-root", text: "根", children: [
        { id: "action-a", text: "A", children: [{ id: "action-a1", text: "A1", children: [] }] },
        { id: "action-b", text: "B", children: [] }
      ]
    }
  }, "节点操作").root;
  assert.deepEqual(nodeActions.topLevelSelectedNodeIds(actionRoot, ["action-a", "action-a1"]), ["action-a"]);
  assert.equal(nodeActions.nextTaskStatus(undefined), "todo");
  assert.equal(nodeActions.nextTaskStatus("done"), undefined);
  nodeActions.setAllBranchesCollapsed(actionRoot, true);
  assert.equal(actionRoot.collapsed, false);
  assert.equal(actionRoot.children[0]?.collapsed, true);
  nodeActions.setAllBranchesCollapsed(actionRoot, true, true);
  assert.equal(actionRoot.collapsed, true, "pasted branches may collapse their own root node");
  nodeActions.setAllBranchesCollapsed(actionRoot, false, true);
  assert.equal(actionRoot.collapsed, false);
  assert.equal(nodeActions.deleteNodes(actionRoot, ["action-a"]), 1);
  assert.deepEqual(actionRoot.children.map((node) => node.id), ["action-b"]);

  const pastedBranches = clipboardImport.parseClipboardNodes(JSON.stringify({
    type: "mindmap-studio-node",
    version: 2,
    nodes: [
      { id: "clipboard-a", text: "分支 A", children: [{ id: "clipboard-a1", text: "分支 A1", children: [] }] },
      { id: "clipboard-b", text: "分支 B", children: [] }
    ]
  }));
  assert.deepEqual(pastedBranches?.map((node) => node.text), ["分支 A", "分支 B"], "multi-node clipboard payloads must preserve branch order");
  assert.equal(pastedBranches?.[0]?.children[0]?.text, "分支 A1", "multi-node clipboard payloads must retain each branch subtree");
  assert.equal(clipboardImport.parseClipboardNode(JSON.stringify({ type: "mindmap-studio-node", version: 1, node: { text: "旧格式", children: [] } }))?.text, "旧格式", "single-node clipboard payloads must remain compatible");

  const collisionNodes = [
    { node: { id: "collision-root" }, parentId: null, x: 0, y: 0, width: 220, height: 120 },
    { node: { id: "collision-a" }, parentId: "collision-root", x: 120, y: 0, width: 220, height: 100 },
    { node: { id: "collision-a1" }, parentId: "collision-a", x: 400, y: 0, width: 80, height: 80 }
  ];
  assert.ok(collisionLayout.resolveLayoutCollisions(collisionNodes, 24) > 0);
  const rootBox = collisionNodes[0];
  const branchBox = collisionNodes[1];
  assert.ok(
    branchBox.y - branchBox.height / 2 >= rootBox.y + rootBox.height / 2 + 24,
    "a colliding branch must move away from the fixed root with the requested gap"
  );
  assert.equal(collisionNodes[2].y - collisionNodes[1].y, 0, "moving a branch must translate its descendants together");

  const viewDocument = model.normalizeDocument({
    title: "三种模式",
    view: { mode: "article", readOnly: true },
    root: {
      id: "article-root",
      text: "中国古诗",
      children: [
        {
          id: "preface", text: "前言", skipArticleNumbering: true, children: [
            { id: "preface-body", text: "这是一段不参与章节编号的说明", children: [] }
          ]
        },
        {
          id: "chapter-one", text: "唐诗", children: [
            { id: "section-one", text: "李白", children: [
              { id: "leaf-one", text: "静夜思", children: [] }
            ] },
            { id: "section-leaf", text: "章节引言", children: [] },
            { id: "section-two", text: "杜甫", children: [
              { id: "subheading", text: "现实主义", children: [
                { id: "deep-leaf", text: "诗史", children: [] }
              ] }
            ] }
          ]
        },
        { id: "chapter-two", text: "宋词", children: [{ id: "song-body", text: "词人概览", children: [] }] }
      ]
    }
  }, "fallback");
  assert.equal(viewDocument.view?.mode, "article");
  assert.equal(viewDocument.view?.readOnly, true);
  assert.equal(viewDocument.root.children[0]?.skipArticleNumbering, true);
  const articleInfo = modes.buildArticleNodeInfo(viewDocument.root);
  const byId = new Map(articleInfo.map((item) => [item.node.id, item]));
  assert.equal(byId.get("preface")?.label, "", "prefaces marked as skipped must not be numbered");
  assert.equal(byId.get("chapter-one")?.label, "第一章", "skipped siblings must not consume chapter numbers");
  assert.equal(byId.get("section-one")?.label, "第一节");
  assert.equal(byId.get("leaf-one")?.label, "", "terminal nodes are article body and must not receive another number");
  assert.equal(byId.get("section-leaf")?.isHeading, true, "a terminal peer of section headings must remain a numbered heading");
  assert.equal(byId.get("section-leaf")?.label, "第二节", "the first terminal peer must not lose its numbering");
  assert.equal(byId.get("section-two")?.label, "第三节", "the numbered terminal peer must consume the section counter");
  assert.equal(byId.get("subheading")?.label, "一、");
  assert.equal(byId.get("deep-leaf")?.label, "");
  assert.equal(byId.get("chapter-two")?.label, "第二章");
  const linkedArticleRoot = model.normalizeDocument({
    title: "古诗",
    root: {
      id: "linked-root", text: "古诗", children: [
        { id: "linked-chapter", text: "唐诗", submap: { path: "Assets/古诗/唐诗.mindmap" }, children: [] }
      ]
    }
  }, "fallback");
  const linkedInfo = modes.buildArticleNodeInfo(linkedArticleRoot.root);
  assert.equal(linkedInfo[0]?.label, "第一章", "a node backed by a child map must still be numbered as a heading");
  const childMapInfo = modes.buildArticleNodeInfo({
    id: "child-root", text: "唐诗", children: [
      { id: "poet", text: "李白", children: [{ id: "poem", text: "静夜思", children: [] }] }
    ]
  }, 1);
  assert.equal(childMapInfo[0]?.label, "第一节", "a child map must continue numbering from its parent article depth");

  const normalizedManualNumbering = model.normalizeDocument({
    title: "手动文章层级兼容",
    root: {
      id: "manual-normalize-root",
      text: "根",
      articleNumberingMode: "manual",
      articleNumberingLevel: 99,
      children: [{ id: "legacy-skip", text: "旧版不编号", skipArticleNumbering: true, children: [] }]
    }
  }, "fallback");
  assert.equal(normalizedManualNumbering.root.articleNumberingMode, "manual");
  assert.equal(normalizedManualNumbering.root.articleNumberingLevel, 8, "manual article levels must be clamped to the supported range");
  assert.equal(normalizedManualNumbering.root.children[0]?.articleNumberingMode, "none", "legacy skipArticleNumbering must migrate to the new none mode");
  assert.equal(normalizedManualNumbering.root.children[0]?.skipArticleNumbering, true, "the legacy alias must remain serializable for backward compatibility");

  const idiomDocument = model.normalizeDocument({
    title: "成语辨析",
    root: {
      id: "idiom-root",
      text: "成语辨析",
      articleNumberingMode: "manual",
      articleNumberingLevel: 5,
      children: [
        {
          id: "idiom-title-1",
          text: "相得益彰",
          children: [
            { id: "idiom-meaning-1", text: "词义：两个人或两种事物互相配合，双方的长处和作用更能显示出来。", children: [] },
            { id: "idiom-confusing-1", text: "易混淆成语", children: [{ id: "idiom-similar-1", text: "相辅相成：两种事物互相配合，互相促成，缺一不可。", children: [] }] },
            { id: "idiom-difference-1", text: "区分", children: [{ id: "idiom-difference-body-1", text: "相得益彰重在效果好；相辅相成重在缺一不可。", children: [] }] }
          ]
        },
        {
          id: "idiom-title-2",
          text: "方兴未艾",
          children: [
            { id: "idiom-meaning-2", text: "词义：事物正在兴起、发展，一时不会终止，多形容新生事物正在蓬勃发展。", children: [] },
            { id: "idiom-confusing-2", text: "易混淆成语", children: [{ id: "idiom-similar-2", text: "如火如荼：形容旺盛、热烈或激烈。", children: [] }] },
            { id: "idiom-difference-2", text: "区分", children: [{ id: "idiom-difference-body-2", text: "方兴未艾重在正在发展；如火如荼重在已经旺盛。", children: [] }] }
          ]
        }
      ]
    }
  }, "fallback");
  const idiomInfo = new Map(modes.buildArticleNodeInfo(idiomDocument.root).map((item) => [item.node.id, item]));
  assert.equal(idiomInfo.get("idiom-title-1")?.displayTitle, "1.相得益彰", "the center-node manual level must define the visible highest level directly");
  assert.equal(idiomInfo.get("idiom-meaning-1")?.displayTitle, "（1）词义：两个人或两种事物互相配合，双方的长处和作用更能显示出来。", "the first terminal peer must retain its number");
  assert.equal(idiomInfo.get("idiom-confusing-1")?.displayTitle, "（2）易混淆成语");
  assert.equal(idiomInfo.get("idiom-difference-1")?.displayTitle, "（3）区分");
  assert.equal(idiomInfo.get("idiom-title-2")?.displayTitle, "2.方兴未艾");
  assert.equal(idiomInfo.get("idiom-meaning-2")?.displayTitle, "（1）词义：事物正在兴起、发展，一时不会终止，多形容新生事物正在蓬勃发展。", "child counters must restart for each parent");
  assert.equal(idiomInfo.get("idiom-meaning-1")?.isHeading, true, "a terminal peer of natural headings must render as a heading without a manual leaf override");
  assert.equal(idiomInfo.get("idiom-similar-1")?.label, "", "ordinary descendant text must remain article body");

  const isolatedManualLeaf = model.normalizeDocument({
    title: "孤立末端节点",
    root: {
      id: "isolated-root",
      text: "根",
      children: [{ id: "isolated-leaf", text: "正文", articleNumberingMode: "manual", articleNumberingLevel: 4, children: [] }]
    }
  }, "fallback");
  const isolatedInfo = modes.buildArticleNodeInfo(isolatedManualLeaf.root)[0];
  assert.equal(isolatedInfo?.isHeading, false, "manual highest-level configuration must not force an isolated terminal node into a heading");
  assert.equal(isolatedInfo?.label, "");

  const arabicDocument = model.normalizeDocument({
    title: "数字编号",
    root: {
      id: "arabic-root",
      text: "数字编号",
      articleNumberingMode: "manual",
      articleNumberingLevel: 5,
      children: [{
        id: "arabic-title",
        text: "相得益彰",
        children: [
          { id: "arabic-meaning", text: "词义", children: [] },
          { id: "arabic-section", text: "区分", children: [{ id: "arabic-body", text: "正文", children: [] }] }
        ]
      }]
    }
  }, "fallback");
  const arabicInfo = new Map(modes.buildArticleNodeInfo(arabicDocument.root).map((item) => [item.node.id, item]));
  assert.equal(arabicInfo.get("arabic-title")?.displayTitle, "1.相得益彰");
  assert.equal(arabicInfo.get("arabic-meaning")?.displayTitle, "（1）词义");
  assert.equal(arabicInfo.get("arabic-section")?.displayTitle, "（2）区分");

  const rootBaselineDocument = model.normalizeDocument({
    title: "根节点最高层级",
    root: {
      id: "baseline-root",
      text: "根",
      articleNumberingMode: "manual",
      articleNumberingLevel: 5,
      children: [{ id: "baseline-topic", text: "相得益彰", children: [{ id: "baseline-body", text: "正文", children: [] }] }]
    }
  }, "fallback");
  assert.equal(modes.articleChildStartLevel(rootBaselineDocument.root), 5);
  assert.equal(modes.buildArticleNodeInfo(rootBaselineDocument.root)[0]?.displayTitle, "1.相得益彰", "a manual center-node level must be the visible highest level, not one level above it");
  const manualLevelTocEntry = { filePath: "book.mindmap", depth: 5, tocDepth: 1, label: "1.", title: "相得益彰", displayTitle: "1.相得益彰", breadcrumb: [] };
  assert.equal(modes.articleTocDepth(manualLevelTocEntry), 1, "TOC depth must remain relative when numbering starts at level 5");
  assert.deepEqual([manualLevelTocEntry].filter((entry) => modes.articleTocDepth(entry) <= 3), [manualLevelTocEntry], "a level-5 numbered heading must remain visible in a three-level TOC when it is structurally top-level");
  assert.equal(modes.articleTocDepth({ filePath: "legacy.mindmap", depth: 2, label: "第一节", title: "旧目录", displayTitle: "第一节 旧目录", breadcrumb: [] }), 2, "legacy TOC entries without tocDepth must fall back to numbering depth");
  assert.equal(modes.resolveArticleTocMaxDepth(undefined, 4), 4, "documents without a TOC override must follow the plugin setting");
  assert.equal(modes.resolveArticleTocMaxDepth(7, 4), 7, "a per-document TOC override must take priority over the plugin setting");
  assert.equal(modes.resolveArticleTocMaxDepth(99, 4), 8, "per-document TOC depth overrides must be clamped to the supported range");

  const recursiveBookEntries = [
    { filePath: "世界.mindmap", depth: 1, tocDepth: 1, label: "第一章", title: "世界", displayTitle: "第一章 世界", breadcrumb: ["基础常识", "世界"] },
    { filePath: "世界.mindmap", nodeId: "world-history", depth: 2, tocDepth: 2, label: "第一节", title: "世界历史", displayTitle: "第一节 世界历史", breadcrumb: ["基础常识", "世界", "世界历史"] },
    { filePath: "世界.mindmap", nodeId: "civilizations", depth: 2, tocDepth: 2, label: "第二节", title: "四大文明古国", displayTitle: "第二节 四大文明古国", breadcrumb: ["基础常识", "世界", "四大文明古国"] },
    { filePath: "中国.mindmap", depth: 1, tocDepth: 1, label: "第二章", title: "中国", displayTitle: "第二章 中国", breadcrumb: ["基础常识", "中国"] },
    { filePath: "中国.mindmap", nodeId: "ancient-china", depth: 2, tocDepth: 2, label: "第一节", title: "中国古代史", displayTitle: "第一节 中国古代史", breadcrumb: ["基础常识", "中国", "中国古代史"] }
  ];
  const worldPages = modes.resolveArticleSiblingPages(recursiveBookEntries, "世界.mindmap");
  assert.deepEqual(worldPages.entries.map((entry) => entry.displayTitle), ["第一章 世界", "第二章 中国"], "article paging must skip headings inside the current physical page and move to the next sibling page");
  assert.equal(worldPages.currentIndex, 0);
  assert.equal(worldPages.currentEntry?.displayTitle, "第一章 世界");
  assert.equal(modes.currentArticlePageEntry({ ...worldPages, homePath: "基础常识.mindmap", parentPath: "基础常识.mindmap" })?.displayTitle, "第一章 世界", "child-map article titles must use their complete numbered directory title");
  assert.equal(modes.currentArticlePageEntry({ ...worldPages, homePath: "基础常识.mindmap" }), undefined, "the top-level book file must keep its own document title");

  const nestedPageEntries = [
    ...recursiveBookEntries,
    { filePath: "世界历史.mindmap", depth: 2, tocDepth: 2, label: "第一节", title: "世界历史", displayTitle: "第一节 世界历史", breadcrumb: ["基础常识", "世界", "世界历史"] },
    { filePath: "文明古国.mindmap", depth: 2, tocDepth: 2, label: "第二节", title: "四大文明古国", displayTitle: "第二节 四大文明古国", breadcrumb: ["基础常识", "世界", "四大文明古国"] },
    { filePath: "中国古代史.mindmap", depth: 2, tocDepth: 2, label: "第一节", title: "中国古代史", displayTitle: "第一节 中国古代史", breadcrumb: ["基础常识", "中国", "中国古代史"] }
  ];
  const worldSectionPages = modes.resolveArticleSiblingPages(nestedPageEntries, "世界历史.mindmap");
  assert.deepEqual(worldSectionPages.entries.map((entry) => entry.displayTitle), ["第一节 世界历史", "第二节 四大文明古国"], "nested pages must navigate among siblings under the same parent only");

  const mixedLevelDocument = model.normalizeDocument({
    title: "混合编号",
    root: {
      id: "mixed-root",
      text: "根",
      children: [
        { id: "mixed-cn-1", text: "中文一", articleNumberingMode: "manual", articleNumberingLevel: 3, children: [{ id: "mixed-cn-1-body", text: "正文", children: [] }] },
        { id: "mixed-num-1", text: "数字一", articleNumberingMode: "manual", articleNumberingLevel: 5, children: [{ id: "mixed-num-1-body", text: "正文", children: [] }] },
        { id: "mixed-cn-2", text: "中文二", articleNumberingMode: "manual", articleNumberingLevel: 3, children: [{ id: "mixed-cn-2-body", text: "正文", children: [] }] },
        { id: "mixed-num-2", text: "数字二", articleNumberingMode: "manual", articleNumberingLevel: 5, children: [{ id: "mixed-num-2-body", text: "正文", children: [] }] }
      ]
    }
  }, "fallback");
  const mixedInfo = new Map(modes.buildArticleNodeInfo(mixedLevelDocument.root).map((item) => [item.node.id, item]));
  assert.equal(mixedInfo.get("mixed-cn-1")?.label, "一、");
  assert.equal(mixedInfo.get("mixed-cn-2")?.label, "二、");
  assert.equal(mixedInfo.get("mixed-num-1")?.label, "1.", "different manual levels must maintain independent counters");
  assert.equal(mixedInfo.get("mixed-num-2")?.label, "2.");
  assert.equal(modes.articleDisplayTitle("第一章", "标题"), "第一章 标题");
  assert.equal(modes.articleDisplayTitle("一、", "标题"), "一、标题");

  const idiomHtml = importExport.documentToHtml(idiomDocument);
  assert.match(idiomHtml, /1\.相得益彰/, "HTML export must preserve the custom highest article level");
  assert.match(idiomHtml, /（1）词义/, "HTML export must retain the first numbered terminal peer");

  assert.deepEqual(modes.normalizeVisibleModes(["article", "mindmap", "article"]), ["article", "mindmap"]);
  assert.deepEqual(modes.normalizeVisibleModes([]), ["mindmap", "outline", "article", "reading"]);
  assert.notEqual(
    modes.readingAnchorPart("MindMap Assets/世界.mindmap"),
    modes.readingAnchorPart("MindMap Assets/中国.mindmap"),
    "Chinese child-map paths must produce unique continuous-reading anchors"
  );

  const styled = model.normalizeDocument({
    title: "样式",
    root: {
      id: "root",
      text: "根",
      children: [{
        id: "child",
        text: "子",
        style: { bold: false, italic: true, underline: true, fontSize: 22, borderWidth: 2, textAlign: "right", width: 230, minHeight: 96 },
        children: []
      }]
    }
  }, "fallback");
  assert.equal(styled.root.children[0]?.style?.bold, false, "explicit false style overrides must survive normalization");
  assert.equal(styled.root.children[0]?.style?.underline, true);
  assert.equal(styled.root.children[0]?.style?.fontSize, 22);
  assert.equal(styled.root.children[0]?.style?.textAlign, "right");
  assert.equal(styled.root.children[0]?.style?.width, 230);
  assert.equal(styled.root.children[0]?.style?.minHeight, 96);
  const sizedLayout = layout.computeLayout(styled.root, "right", 14);
  const branchFixture = model.createDefaultDocument("Rounded branch");
  const cardLayout = layout.computeLayout(branchFixture.root, "right", 14, "card");
  const branchLayout = layout.computeLayout(branchFixture.root, "right", 14, "branch");
  assert.ok(branchLayout.nodes[1].width < cardLayout.nodes[1].width, "rounded branch style should fit node width to its text");
  assert.ok(branchLayout.nodes[1].x < cardLayout.nodes[1].x, "rounded branch style should keep branches close to their parent");
  assert.match(layout.roundedElbowEdgePath(branchLayout.nodes[0], branchLayout.nodes[1]), /\bQ\b/, "rounded branch style should use rounded elbow connectors");
  branchFixture.appearance = { nodeVisualStyle: "compact" };
  assert.equal(model.normalizeDocument(branchFixture).appearance?.nodeVisualStyle, "branch", "legacy compact style should migrate to rounded branch style");
  const widthFixture = model.createDefaultDocument("Width");
  widthFixture.root.children[0].text = "This is a deliberately long node title that should wrap at the configured maximum width";
  const automaticWidthLayout = layout.computeLayout(widthFixture.root, "right", 14, "card", {
    nodeWidthMode: "auto",
    autoNodeMaxWidth: 220
  });
  assert.equal(automaticWidthLayout.nodes[1].width, 220, "automatic nodes should stop at the configured maximum width");
  widthFixture.root.children[0].style = { width: 340 };
  const manualWidthLayout = layout.computeLayout(widthFixture.root, "right", 14, "card", {
    nodeWidthMode: "auto",
    autoNodeMaxWidth: 220
  });
  assert.equal(manualWidthLayout.nodes[1].width, 340, "manual width should be allowed to exceed the automatic maximum");
  widthFixture.root.children[0].style = undefined;
  const fixedWidthLayout = layout.computeLayout(widthFixture.root, "right", 14, "card", {
    nodeWidthMode: "fixed",
    defaultNodeWidth: 240
  });
  assert.equal(fixedWidthLayout.nodes[1].width, 240, "fixed width mode should use the configured node width");
  const xmindClipboard = "世界历史\n\t古代史\n\t\t中国\n\t\t希腊\n\t近代史";
  const xmindMarkdown = model.indentedTextToMarkdown(xmindClipboard);
  const pastedXmind = model.markdownToDocument(xmindMarkdown, "粘贴内容");
  assert.equal(pastedXmind.root.text, "世界历史");
  assert.deepEqual(pastedXmind.root.children.map((node) => node.text), ["古代史", "近代史"]);
  assert.deepEqual(pastedXmind.root.children[0]?.children.map((node) => node.text), ["中国", "希腊"]);
  const sizedPosition = sizedLayout.byId.get("child");
  assert.equal(sizedPosition?.width, 230, "manual node width must drive layout");
  assert.ok((sizedPosition?.height ?? 0) >= 96, "manual node minimum height must drive layout");
  const alignedSvg = layout.documentToSvg(styled.root, "right", styled.title, { nodeTextAlign: "left" });
  assert.match(alignedSvg, /text-anchor="end"/, "per-node right alignment must survive SVG export");

  const richTextDocument = model.normalizeDocument({
    title: "局部富文本",
    root: {
      id: "rich-root",
      text: "普通加粗下划线红色组合",
      richText: [
        { text: "普通" },
        { text: "加粗", style: { bold: true } },
        { text: "下划线", style: { underline: true } },
        { text: "红色", style: { color: "#ef4444" } },
        { text: "组合", style: { bold: true, underline: true, color: "#2563eb" } }
      ],
      children: []
    }
  }, "fallback");
  const richTextReopened = model.parseDocument(model.serializeDocument(richTextDocument), "fallback");
  assert.equal(richTextReopened.root.text, "普通加粗下划线红色组合");
  assert.equal(richTextReopened.root.richText?.[1]?.style?.bold, true);
  assert.equal(richTextReopened.root.richText?.[2]?.style?.underline, true);
  assert.equal(richTextReopened.root.richText?.[3]?.style?.color, "#ef4444");
  assert.equal(richTextReopened.root.richText?.[4]?.style?.bold, true);
  assert.match(model.documentToMarkdown(richTextDocument), /\*\*加粗\*\*/);
  assert.match(model.documentToMarkdown(richTextDocument), /<u>下划线<\/u>/);
  assert.match(model.documentToMarkdown(richTextDocument), /color:#ef4444/);

  const mixedContent = model.normalizeDocument({
    title: "混合内容",
    root: {
      id: "mixed-root",
      text: "",
      content: [
        {
          id: "img-1",
          type: "image",
          source: "https://cdn-a.example/first.png",
          alt: "第一张",
          localSource: "Assets/first.png",
          remoteSources: [
            { hostId: "host-a", hostName: "图床 A", url: "https://cdn-a.example/first.png", uploadedAt: "2026-07-20T00:00:00.000Z" },
            { hostId: "host-b", hostName: "图床 B", url: "https://cdn-b.example/first.png" }
          ]
        },
        { id: "text-1", type: "text", text: "图片后文字" },
        { id: "img-2", type: "image", source: "https://example.com/second.png", alt: "第二张" },
        { id: "text-2", type: "text", text: "最后文字", richText: [{ text: "最后", style: { bold: true } }, { text: "文字" }] }
      ],
      children: []
    }
  }, "fallback");
  const mixedReopened = model.parseDocument(model.serializeDocument(mixedContent), "fallback");
  assert.deepEqual(mixedReopened.root.content?.map((block) => block.type), ["image", "text", "image", "text"]);
  assert.equal(model.nodePlainText(mixedReopened.root), "图片后文字 最后文字");
  assert.equal(mixedReopened.root.content?.[0]?.localSource, "Assets/first.png");
  assert.equal(mixedReopened.root.content?.[0]?.remoteSources?.length, 2);
  assert.match(model.documentToMarkdown(mixedReopened), /!\[第一张\]\(https:\/\/cdn-a\.example\/first\.png\)/);
  const failoverBlock = mixedReopened.root.content?.[0];
  assert.equal(failoverBlock?.type, "image");
  if (failoverBlock?.type === "image") {
    const initialCandidates = model.imageSourceCandidates(failoverBlock, true);
    assert.deepEqual(initialCandidates.map((item) => item.source), [
      "https://cdn-a.example/first.png",
      "https://cdn-b.example/first.png",
      "Assets/first.png"
    ]);
    failoverBlock.source = "https://cdn-b.example/first.png";
    const rotatedCandidates = model.imageSourceCandidates(failoverBlock, true);
    assert.deepEqual(rotatedCandidates.map((item) => item.source), [
      "https://cdn-b.example/first.png",
      "https://cdn-a.example/first.png",
      "Assets/first.png"
    ], "after a failover, the active mirror should be tried first and the remaining mirrors should follow without duplicates");
  }

  const pureImage = model.normalizeDocument({
    title: "纯图片",
    root: { id: "pure", text: "新节点", content: [{ id: "only-image", type: "image", source: "Assets/only.png" }], children: [] }
  }, "fallback");
  assert.equal(pureImage.root.text, "");
  assert.equal(pureImage.root.content?.length, 1);
  assert.equal(pureImage.root.content?.[0]?.type, "image");

  const richTextSvg = layout.documentToSvg(richTextDocument.root, "right", richTextDocument.title, {});
  assert.match(richTextSvg, /<tspan[^>]*font-weight="700"[^>]*>加粗<\/tspan>/);
  assert.match(richTextSvg, /<tspan[^>]*text-decoration="underline"[^>]*>下划线<\/tspan>/);
  assert.match(richTextSvg, /<tspan[^>]*fill="#ef4444"[^>]*>红色<\/tspan>/);
  const rangeText = "123456789012";
  let rangeRuns = model.applyRichTextStyleRange(rangeText, undefined, 1, 4, { bold: true });
  rangeRuns = model.applyRichTextStyleRange(rangeText, rangeRuns, 4, 7, { underline: true });
  rangeRuns = model.applyRichTextStyleRange(rangeText, rangeRuns, 7, 10, { color: "#ef4444" });
  rangeRuns = model.applyRichTextStyleRange(rangeText, rangeRuns, 10, 12, { bold: true, color: "#2563eb" });
  const rangeStyles = model.richTextCharacterStyles(rangeRuns, rangeText);
  assert.equal(rangeStyles[0]?.bold, undefined, "first character must remain unchanged");
  assert.equal(rangeStyles[1]?.bold, true, "only selected 2-4 range should be bold");
  assert.equal(rangeStyles[4]?.bold, undefined, "bold must stop after selected range");
  assert.equal(rangeStyles[4]?.underline, true);
  assert.equal(rangeStyles[7]?.color, "#ef4444");
  assert.equal(rangeStyles[10]?.bold, true);
  assert.equal(rangeStyles[10]?.color, "#2563eb");
  assert.equal(model.richTextPlainText(rangeRuns, ""), rangeText);

  const editedRuns = model.reconcileRichTextAfterEdit(rangeText, rangeRuns, "1A23456789012");
  const editedStyles = model.richTextCharacterStyles(editedRuns, "1A23456789012");
  assert.equal(editedStyles[2]?.bold, true, "styles after inserted text should stay attached to unchanged suffix");

  const branchMap = layout.buildBranchColorMap(document.root, document.appearance.branchColors);
  assert.equal(branchMap.get(document.root.children[0].id), "#dc2626");
  assert.equal(branchMap.get("depth-3"), "#dc2626", "descendants should inherit their first-level branch color");
  assert.equal(layout.edgeWidthForDepth(document.appearance, 1, 3), 3);
  assert.equal(layout.edgeWidthForDepth(document.appearance, 2, 3), 2);
  assert.equal(layout.edgeWidthForDepth(document.appearance, 3, 3), 1);
  assert.equal(layout.edgeWidthForDepth(document.appearance, 2, 2), 1, "the deepest edge in a shallow map must reach the configured minimum");
  assert.equal(layout.edgeWidthForDepth({ edgeWidth: 4.2, edgeWidthMode: "tapered", edgeMinWidth: 1.2 }, 3, 3), 1.2, "theme edge widths with one decimal place must remain valid taper endpoints");

  const svg = layout.documentToSvg(document.root, document.layout, document.title, document.appearance);
  assert.match(svg, /pattern id="mmc-pattern"/);
  assert.match(svg, /stroke-width="3"/);
  assert.match(svg, /stroke-width="2"/);
  assert.match(svg, /stroke="#dc2626"/, "branch colors should be exported");
  assert.match(svg, /fill="#c2410c"/, "root theme color should be exported");
  assert.match(svg, /font-style="italic"/);
  assert.match(svg, /text-decoration="underline"/);
  assert.match(svg, /L .* L .* L /, "elbow connectors should be exported as segmented lines");

  const legacy = `---\ntags:\n  - old-map\n---\n\n\`\`\`smm-json\n${JSON.stringify(document)}\n\`\`\``;
  const converted = model.parseDocument(legacy, "fallback");
  assert.equal(converted.root.children.at(-1)?.text, "保存后仍可编辑");

  const markdown = "# 根节点\n- 子节点 A\n  - 子节点 B";
  const fromMarkdown = model.parseDocument(markdown, "fallback");
  assert.equal(fromMarkdown.root.text, "根节点");
  assert.equal(fromMarkdown.root.children[0]?.children[0]?.text, "子节点 B");
  const mixedMarkdown = "# 项目\n## 研发\n- 任务 A\n  - 子任务 A1\n## 运营\n- 任务 B";
  const mixedMarkdownDocument = model.markdownToDocument(mixedMarkdown, "fallback");
  assert.deepEqual(mixedMarkdownDocument.root.children.map((node) => node.text), ["研发", "运营"], "Markdown headings must remain top-level branches");
  assert.equal(mixedMarkdownDocument.root.children[0]?.children[0]?.children[0]?.text, "子任务 A1", "lists below a Markdown heading must remain nested below that heading");
  const boldOutlineMarkdown = `**相丽君—红宝书**

**主题一 · 写时代，不负韶华**
与时偕行 · 顺势而为

**好标题**
画好时代发展的"同心圆"
赓续时代薪火，书写崭新篇章

**主题二 · 写政务，初心为民**
政润民心 · 行践初心

**好标题**
政府有为，市场有效`;
  const boldOutlineDocument = model.markdownToDocument(boldOutlineMarkdown, "fallback");
  assert.equal(boldOutlineDocument.root.text, "相丽君—红宝书", "the first standalone bold line must become the imported root node");
  assert.deepEqual(boldOutlineDocument.root.children.map((node) => node.text), ["主题一 · 写时代，不负韶华", "主题二 · 写政务，初心为民"], "bold theme markers must remain sibling branches");
  assert.equal(boldOutlineDocument.root.richText?.[0]?.style?.bold, true, "standalone bold root text must use the rich-text bold style");
  assert.equal(boldOutlineDocument.root.children[0]?.richText?.[0]?.style?.bold, true, "standalone bold theme text must use the rich-text bold style");
  assert.deepEqual(boldOutlineDocument.root.children[0]?.children.map((node) => node.text), ["与时偕行 · 顺势而为", "好标题"], "plain text and secondary bold labels must stay under their current theme");
  assert.deepEqual(boldOutlineDocument.root.children[0]?.children[1]?.children.map((node) => node.text), ["画好时代发展的\"同心圆\"", "赓续时代薪火，书写崭新篇章"]);
  const richMarkdownDocument = model.markdownToDocument("# 根节点\n- **凡益之道，与时偕行。** ——《周易》", "fallback");
  const richMarkdownNode = richMarkdownDocument.root.children[0];
  assert.equal(richMarkdownNode?.text, "凡益之道，与时偕行。 ——《周易》", "Markdown bold markers must not remain in imported node text");
  assert.equal(richMarkdownNode?.richText?.[0]?.text, "凡益之道，与时偕行。");
  assert.equal(richMarkdownNode?.richText?.[0]?.style?.bold, true, "Markdown bold text must retain its rich-text bold style");
  assert.equal(richMarkdownNode?.richText?.[1]?.text, " ——《周易》");
  assert.match(model.documentToMarkdown(richMarkdownDocument), /\*\*凡益之道，与时偕行。\*\* ——《周易》/);
  const markdownWithTableOfContents = `## 目录

| 序号 | 主题 |
| --- | --- |
| 01 | 主题一 |

---

# 主题一 · 写时代，不负韶华

> 与时偕行 · 顺势而为

## 好标题

- 画好时代发展的"同心圆"

## 好段落

### 回顾百年

这是一段需要保留的正文。

---

# 主题二 · 写政务，初心为民

## 好标题

- 政府有为，市场有效`;
  const tableOfContentsDocument = model.markdownToDocument(markdownWithTableOfContents, "相丽君-红宝书");
  assert.equal(tableOfContentsDocument.root.text, "相丽君-红宝书", "a table of contents before the first H1 must keep the filename-derived root node");
  assert.deepEqual(tableOfContentsDocument.root.children.map((node) => node.text), ["主题一 · 写时代，不负韶华", "主题二 · 写政务，初心为民"], "top-level themes after a table of contents must remain siblings");
  assert.deepEqual(tableOfContentsDocument.root.children[0]?.children.map((node) => node.text), ["与时偕行 · 顺势而为", "好标题", "好段落"], "quotes and headings must remain inside their current theme");
  assert.equal(tableOfContentsDocument.root.children[0]?.children[2]?.children[0]?.children[0]?.text, "这是一段需要保留的正文。", "body paragraphs must remain below their nearest heading");


  const markdownTable = `| 名称 | 数量 | 状态 |
| :--- | ---: | :---: |
| 苹果 | 3 | 完成 |
| 梨 | 2 | 进行中 |`;
  const parsedTable = model.parseMarkdownTable(`前置说明\n\n${markdownTable}\n\n后续说明`);
  assert.deepEqual(parsedTable?.headers, ["名称", "数量", "状态"]);
  assert.deepEqual(parsedTable?.alignments, ["left", "right", "center"]);
  assert.equal(parsedTable?.rows[1]?.[0], "梨");
  assert.match(model.tableToMarkdown(parsedTable), /\| 苹果 \| 3 \| 完成 \|/);

  const parsedCode = model.parseFencedCode("代码如下：\n```typescript\nconst answer: number = 42;\n```\n结束");
  assert.equal(parsedCode?.language, "typescript");
  assert.match(parsedCode?.code ?? "", /answer/);

  document.root.children[0].table = parsedTable;
  document.root.children[0].code = parsedCode;
  document.root.children[0].submap = { path: "Projects/Child.mindmap", title: "Child" };
  document.navigation = { parentPath: "Projects/Parent.mindmap", parentNodeId: "parent-node", parentTitle: "Parent", parentNodeText: "进入子导图" };
  const richReopened = model.parseDocument(model.serializeDocument(document), "fallback");
  assert.equal(richReopened.root.children[0]?.table?.rows.length, 2);
  assert.equal(richReopened.root.children[0]?.code?.language, "typescript");
  assert.equal(richReopened.root.children[0]?.submap?.path, "Projects/Child.mindmap");
  assert.equal(richReopened.navigation?.parentPath, "Projects/Parent.mindmap");
  assert.equal(richReopened.navigation?.parentTitle, "Parent");
  assert.equal(richReopened.navigation?.parentNodeText, "进入子导图");

  const childrenTable = model.childrenToTable({ id: "p", text: "父", children: [{ id: "c", text: "子", note: "说明", task: "done", tags: ["重点"], children: [] }] });
  assert.equal(childrenTable?.source, "children");
  assert.equal(childrenTable?.rows[0]?.[0], "子");

  const richLayout = layout.computeLayout(document.root, document.layout, 14);
  assert.ok((richLayout.byId.get(document.root.children[0].id)?.width ?? 0) >= 380, "rich nodes should reserve enough width");
  const richSvg = layout.documentToSvg(document.root, document.layout, document.title, document.appearance);
  assert.match(richSvg, /typescript/);
  assert.match(richSvg, /苹果/);

  const indexedDocument = model.normalizeDocument({
    title: "项目总览",
    root: {
      id: "search-root",
      text: "主项目",
      children: [{
        id: "hidden-child",
        text: "折叠的关键节点",
        note: "供应链风险",
        collapsed: true,
        children: [{
          id: "deep-child",
          text: "深层子节点",
          tags: ["重点", "美国站"],
          table: { headers: ["商品", "状态"], rows: [["眼镜盒", "待处理"]] },
          code: { language: "javascript", code: "const globalSearch = true;" },
          submap: { path: "Assets/项目总览/供应商.mindmap", title: "供应商" },
          children: []
        }]
      }]
    },
    navigation: { parentPath: "父导图.mindmap", parentTitle: "父导图" }
  }, "fallback");
  const searchEntries = globalSearch.buildSearchEntries(indexedDocument, "Projects/项目总览.mindmap");
  assert.equal(searchEntries.length, 3, "global index must include collapsed and deep child nodes");
  assert.equal(searchEntries[2].isSubmapDocument, true);
  assert.match(searchEntries[2].searchableText, /供应商\.mindmap/);
  assert.equal(globalSearch.searchEntries(searchEntries, "供应链风险")[0]?.nodeId, "hidden-child");
  assert.equal(globalSearch.searchEntries(searchEntries, "眼镜盒 待处理")[0]?.nodeId, "deep-child");
  assert.equal(globalSearch.searchEntries(searchEntries, "globalsearch")[0]?.nodeId, "deep-child");
  assert.equal(globalSearch.searchEntries(searchEntries, "供应链风险", 100, false)[0]?.nodeId, "hidden-child", "plain search still works with useRegex=false");
  assert.equal(globalSearch.searchEntries(searchEntries, "待处.*", 100, true)[0]?.nodeId, "deep-child", "regex search matches with .* pattern");
  assert.equal(globalSearch.searchEntries(searchEntries, "GLOBAL", 100, true)[0]?.nodeId, "deep-child", "regex search with /gi flag is case-insensitive");
  assert.equal(globalSearch.searchEntries(searchEntries, "[", 100, true).length, 0, "invalid regex returns empty results gracefully");

  // Search results via note/tag/code should appear even when nodeText does not contain the term
  // (regression guard for the removed .filter() in renderResults)
  const noteMatch = globalSearch.searchEntries(searchEntries, "供应链");
  assert.equal(noteMatch[0].nodeText.indexOf("供应链"), -1, "search matched via note, not via nodeText — the old .filter() would have incorrectly hidden this result");
  assert.equal(noteMatch[0].nodeId, "hidden-child");
  assert.notEqual(noteMatch[0].nodeText.toLocaleLowerCase().indexOf("供应链"), -1 ? 0 : -1, "node text may not contain the search term");

  // Regex search via note field
  const regexNote = globalSearch.searchEntries(searchEntries, "供应链.*", 100, true);
  assert.equal(regexNote.length, 1, "regex search via note must return the node");
  assert.equal(regexNote[0].nodeId, "hidden-child");

  // Search matches via tag
  const tagMatch = globalSearch.searchEntries(searchEntries, "美国站");
  assert.equal(tagMatch.length, 1, "search via tag must return the node");
  assert.equal(tagMatch[0].nodeId, "deep-child");

  // Search matches via code block
  const codeMatch = globalSearch.searchEntries(searchEntries, "globalsearch");
  assert.equal(codeMatch.length, 1, "search via code must return the node");
  assert.equal(codeMatch[0].nodeId, "deep-child");

  // Search matches via table cell
  const tableMatch = globalSearch.searchEntries(searchEntries, "眼镜盒");
  assert.equal(tableMatch.length, 1, "search via table must return the node");
  assert.equal(tableMatch[0].nodeId, "deep-child");

  // Search matches via submap path
  const submapMatch = globalSearch.searchEntries(searchEntries, "供应商");
  assert.equal(submapMatch.length, 1, "search via submap path must return the node");
  assert.equal(submapMatch[0].nodeId, "deep-child");

  const directNodeSearchDocument = model.normalizeDocument({
    title: "仅用于上下文的标题",
    root: {
      id: "direct-root",
      text: "解题方法论1234567",
      children: [{ id: "context-only-child", text: "不包含搜索词的子节点", children: [] }]
    }
  }, "fallback");
  const directNodeSearchEntries = globalSearch.buildSearchEntries(directNodeSearchDocument, "测试/上下文.mindmap");
  assert.deepEqual(
    globalSearch.searchEntries(directNodeSearchEntries, "1234567").map((result) => result.nodeId),
    ["direct-root"],
    "search must not match descendants through their breadcrumb or file context"
  );

  const replacementDocument = model.normalizeDocument({
    title: "替换测试",
    root: {
      id: "replacement-root",
      text: "解题方法论1234567",
      content: [{ id: "replacement-content", type: "text", text: "解题方法论1234567" }],
      children: []
    }
  }, "fallback");
  const replacementNode = model.findNode(replacementDocument.root, "replacement-root");
  assert.ok(replacementNode, "replacement test must locate the indexed node");
  const replacementBlocks = model.nodeContentBlocks(replacementNode);
  const replacementTextBlock = replacementBlocks.find((block) => block.type === "text");
  assert.ok(replacementTextBlock, "replacement test node must include a text content block");
  replacementTextBlock.text = replacementTextBlock.text.replace("1234567", "已替换");
  replacementNode.content = replacementBlocks;
  model.syncNodeLegacyFields(replacementNode);
  const persistedReplacement = model.parseDocument(model.serializeDocument(replacementDocument), "替换测试");
  assert.equal(model.nodePlainText(persistedReplacement.root), "解题方法论已替换", "replaced content blocks must be written back before legacy fields are synchronized");


  const poetryParent = model.normalizeDocument({
    title: "古诗",
    root: {
      id: "poetry-root",
      text: "古诗",
      children: [{
        id: "tang-node",
        text: "唐诗",
        submap: { path: "MindMap Assets/古诗/唐诗.mindmap", title: "唐诗" },
        children: []
      }]
    }
  }, "fallback");
  const tangChild = model.normalizeDocument({
    title: "唐诗",
    navigation: { parentPath: "古诗.mindmap", parentNodeId: "tang-node", parentTitle: "古诗", parentNodeText: "唐诗" },
    root: {
      id: "tang-root",
      text: "唐诗",
      children: [{ id: "libai-node", text: "李白", note: "静夜思", children: [] }]
    }
  }, "fallback");
  const hierarchyEntries = globalSearch.resolveHierarchicalEntries({
    "古诗.mindmap": { mtime: 1, size: 1, title: "古诗", entries: globalSearch.buildSearchEntries(poetryParent, "古诗.mindmap") },
    "MindMap Assets/古诗/唐诗.mindmap": {
      mtime: 1, size: 1, title: "唐诗", navigation: tangChild.navigation,
      entries: globalSearch.buildSearchEntries(tangChild, "MindMap Assets/古诗/唐诗.mindmap")
    }
  });
  const tangRootEntry = hierarchyEntries.find((entry) => entry.nodeId === "tang-root");
  const libaiEntry = hierarchyEntries.find((entry) => entry.nodeId === "libai-node");
  assert.deepEqual(tangRootEntry?.hierarchyBreadcrumb, ["古诗", "唐诗"], "child-map root must inherit the parent node path without duplicating 唐诗");
  assert.deepEqual(libaiEntry?.hierarchyBreadcrumb, ["古诗", "唐诗", "李白"]);
  assert.equal(globalSearch.searchEntries(hierarchyEntries, "古诗 唐诗 李白").length, 0, "hierarchy paths must remain display-only context");
  const familyPaths = globalSearch.collectIndexedFamilyPaths({
    "古诗.mindmap": { entries: globalSearch.buildSearchEntries(poetryParent, "古诗.mindmap") },
    "MindMap Assets/古诗/唐诗.mindmap": { entries: globalSearch.buildSearchEntries(tangChild, "MindMap Assets/古诗/唐诗.mindmap") }
  }, "古诗.mindmap");
  assert.deepEqual(Array.from(familyPaths), ["古诗.mindmap", "MindMap Assets/古诗/唐诗.mindmap"], "current-map search must include recursively linked child maps without recreating them");
  const familyEntries = hierarchyEntries.filter((entry) => familyPaths.has(entry.filePath));
  assert.equal(globalSearch.searchEntries(familyEntries, "李白")[0]?.filePath, "MindMap Assets/古诗/唐诗.mindmap", "searching from 古诗 must find 李白 in the 唐诗 child map");

  const mainSource = await readFile("src/main.ts", "utf8");
  assert.match(mainSource, /registerExtensions\(\[MINDMAP_EXTENSION\], VIEW_TYPE_MINDMAP_STUDIO\)/);
  assert.match(mainSource, /global-search-mind-maps/);
  assert.match(mainSource, /openMapFamilySearch/);
  assert.match(mainSource, /refreshFamily/);
  assert.match(mainSource, /mindmap-search-index\.json/);
  assert.match(mainSource, /MINDMAP_EXTENSION = "mindmap"/);
  assert.match(mainSource, /defaultNodeTextAlign/);
  assert.match(mainSource, /\[parentFolder, configuredAssets, parentMapFolder\]/, "submaps must be stored below the parent-local asset folder");
  assert.match(mainSource, /\[sourceFolder, configuredFolder\]/, "pasted images must use the current map's parent-local asset folder");
  assert.match(mainSource, /sourceFile\?\.parent\?\.path/, "pasted image paths must be based on the active mind map directory");
  assert.match(mainSource, /parentTitle: parentFile\.basename/);
  assert.match(mainSource, /uploadImageToHosts/);
  assert.match(mainSource, /scheduleAutoUpload/);
  assert.match(mainSource, /runAutoUploadTask/);
  assert.match(mainSource, /deleteLocalAssetIfSafe/);
  assert.match(mainSource, /testImageHost/);
  assert.match(mainSource, /requestUrl/);
  assert.match(mainSource, /multipart\/form-data/);
  assert.match(mainSource, /buildDescendantReadingSections/);
  assert.match(mainSource, /MindMap Studio could not read child map for export/);
  assert.match(mainSource, /plugins\/mindmap-canvas\/data\.json/, "renamed plugin should migrate old settings");
  const globalSearchSource = await readFile("src/search/global-search.ts", "utf8");
  assert.match(globalSearchSource, /resolveHierarchicalEntries/);
  assert.match(globalSearchSource, /useRegex/, "search functions should support regex mode");
  assert.match(mainSource, /replaceAllInSearchResults/, "main module should support search-and-replace");
  assert.match(mainSource, /const node = findNode\(doc\.root, nodeId\)/, "search replacement must target the indexed result node instead of only the root node");
  assert.match(mainSource, /const contentBlocks = nodeContentBlocks\(node\);[\s\S]*reconcileRichTextAfterEdit[\s\S]*node\.content = contentBlocks;[\s\S]*syncNodeLegacyFields\(node\)/, "search replacement must write normalized content blocks back before synchronizing legacy fields");
  assert.match(mainSource, /await this\.app\.vault\.modify\(file, serializeDocument\(doc\)\);[\s\S]*const persisted = parseDocument\(await this\.app\.vault\.read\(file\), file\.basename\);[\s\S]*await this\.refreshOpenMindMap\(file, persisted\)/, "replacement success must be based on persisted content and refresh open editors");
  assert.match(globalSearchSource, /mms-global-search-regex/, "search modal should include a regex toggle button");
  assert.match(globalSearchSource, /mms-global-search-replace-row/, "search modal should include a replace row");
  assert.match(globalSearchSource, /mms-global-search-replace-one/, "search results should include a per-result replace button");
  assert.match(globalSearchSource, /role: "button", tabindex: "0"/, "result rows must not nest a replace button inside another button");
  assert.match(globalSearchSource, /古诗 › 唐诗/);
  assert.match(globalSearchSource, /first climb to the top parent/);
  assert.match(globalSearchSource, /version: 2/);
  const editorSource = await readFile("src/editor/editor.ts", "utf8");
  const editorModalSource = await readFile("src/editor/editor-modals.ts", "utf8");
  const nodeRichTextSource = await readFile("src/editor/node-rich-text-editor.ts", "utf8");
  const articleRendererSource = await readFile("src/editor/article-renderer.ts", "utf8");
  const outlineRendererSource = await readFile("src/editor/outline-renderer.ts", "utf8");
  const selectionToolbarSource = await readFile("src/editor/selection-format-toolbar.ts", "utf8");
  // Pasting Markdown with multiple siblings unwraps the "paste content" wrapper
  const pastedMulti = clipboardImport.parseClipboardNodes("- 第一条\n- 第二条\n- 第三条");
  assert.ok(pastedMulti, "multi-line markdown must parse successfully");
  assert.equal(pastedMulti.length, 3, "multi-line markdown must produce 3 sibling nodes, not 1 wrapper");
  assert.equal(pastedMulti[0]?.text, "第一条");
  assert.equal(pastedMulti[1]?.text, "第二条");
  assert.equal(pastedMulti[2]?.text, "第三条");
  // Single-item paste still works as before
  const pastedSingle = clipboardImport.parseClipboardNodes("- 单条内容");
  assert.ok(pastedSingle, "single-item markdown must parse");
  assert.equal(pastedSingle.length, 1, "single-item markdown must produce 1 node");
  assert.equal(pastedSingle[0]?.text, "单条内容");

    const clipboardImportSource = await readFile("src/editor/clipboard-import.ts", "utf8");
  assert.match(editorSource, /addEventListener\("keydown", keydown, true\)/, "editor shortcuts must run in the capture phase");
  assert.match(editorSource, /const findKey = key === "f" \|\| event\.code === "KeyF"/, "search shortcuts must support non-English keyboard layouts");
  const handleKeydownStart = editorSource.indexOf("private handleKeydown(event: KeyboardEvent): void");
  const handleKeydownEnd = editorSource.indexOf("\n  private ", handleKeydownStart + 1);
  const handleKeydownSource = editorSource.slice(handleKeydownStart, handleKeydownEnd);
  const searchShortcutIndex = handleKeydownSource.indexOf("if (mod && event.shiftKey && findKey && !event.altKey)");
  const editableTargetGuardIndex = handleKeydownSource.indexOf('if (target.closest("input, textarea, select, [contenteditable=\'true\']")) return;');
  assert.ok(searchShortcutIndex >= 0 && searchShortcutIndex < editableTargetGuardIndex, "search shortcuts must work while an editable element has focus");
  assert.match(handleKeydownSource, /if \(mod && event\.shiftKey && findKey && !event\.altKey\) \{[\s\S]*?event\.preventDefault\(\);[\s\S]*?event\.stopPropagation\(\);[\s\S]*?this\.openSearch\(\)/);
  assert.doesNotMatch(handleKeydownSource, /if \(mod && findKey && !event\.altKey\)/, "Ctrl/Cmd+F must remain available to Obsidian");
  assert.match(handleKeydownSource, /if \(mod && key === "a"\) \{[\s\S]*?event\.preventDefault\(\);[\s\S]*?event\.stopPropagation\(\);[\s\S]*?this\.selectAllNodesExceptRoot\(\)/, "Ctrl/Cmd+A must select mind-map nodes instead of page text");
  assert.match(editorSource, /private selectAllNodesExceptRoot\(\): void \{[\s\S]*?flattenNodes\(this\.document\.root\)[\s\S]*?node\.id !== this\.document\.root\.id[\s\S]*?this\.selectedIds\.add\(id\)/, "select all must include all descendants while excluding the root node");
  assert.match(editorSource, /搜索当前导图及全部子导图（Ctrl\/Cmd\+Shift\+F）/);
  assert.match(editorSource, /"全局搜索所有导图"/);
  assert.doesNotMatch(editorSource, /markWrappedArticleParagraph/);
  assert.doesNotMatch(articleRendererSource, /lineTops\.size > 1/, "article indentation must not depend on responsive line wrapping");
  assert.match(outlineRendererSource, /renderOutlineMode/);
  assert.match(outlineRendererSource, /mms-outline-table/);
  assert.match(outlineRendererSource, /node\.table\.rows\.forEach/);
  assert.match(outlineRendererSource, /options\.renderCode/);
  assert.match(outlineRendererSource, /ImagePreviewModal/);
  assert.match(outlineRendererSource, /additionalText/);
  assert.match(editorSource, /attachSelectionFormatToolbar/);
  assert.match(editorSource, /firstText\.richText = value\.richText/, "article and outline edits must preserve rich-text runs");
  assert.doesNotMatch(editorSource, /firstText\.richText = undefined/, "inline edits must not discard existing formatting");
  assert.match(selectionToolbarSource, /applyRichTextStyleRange/);
  assert.match(selectionToolbarSource, /getBoundingClientRect/);
  assert.match(selectionToolbarSource, /"bold" \| "italic" \| "underline"/);
  assert.doesNotMatch(nodeRichTextSource, /execCommand/, "rich-text formatting must not use browser-wide execCommand behavior");
  assert.match(nodeRichTextSource, /selectionStart/);
  assert.match(nodeRichTextSource, /文字样式预览/);
  assert.match(editorSource, /mmc-parent-navigation/);
  assert.doesNotMatch(editorSource, /addToolbarButton\("arrow-left", "返回父导图"/, "parent return should not appear as a redundant small toolbar button");
  assert.match(editorSource, /mmc-node-edit-form/, "node editor must not use an implicitly submitted form");
  assert.match(editorSource, /保存并关闭/);
  assert.doesNotMatch(editorSource, /已自动保存；可继续编辑|等待自动保存|正在自动保存/, "autosave status text must stay hidden");
  assert.match(nodeRichTextSource, /mmc-rich-color-button/);
  assert.match(nodeRichTextSource, /mmc-rich-color-line/);
  assert.match(editorSource, /MINDMAP_THEME_PRESETS/);
  assert.match(editorSource, /edgeWidthForDepth/);
  assert.match(editorSource, /edgeWidthInput = edgeWidthLabel\.createEl\("input", \{ type: "number", attr: \{ min: "0\.5", max: "8", step: "0\.05" \} \}\)/, "appearance modal must accept the one-decimal edge widths used by themes");
  assert.match(editorSource, /edgeMinWidthInput = edgeMinWidthLabel\.createEl\("input", \{ type: "number", attr: \{ min: "0\.25", max: "4", step: "0\.05" \} \}\)/, "appearance modal must accept one-decimal tapered endpoints without browser validation errors");
  assert.match(editorSource, /element\.offsetHeight/, "collision layout must use the browser-rendered node height");
  assert.match(editorSource, /applyMeasuredMindMapLayout/);
  assert.match(editorSource, /this\.resizeObserver\?\.observe\(nodeEl\)/, "table and image size changes must trigger a measured reflow");
  assert.match(editorSource, /this\.renderMindMapEdges\(appearance, branchColorMap\)/, "measured reflow must redraw connector paths");
  const viewSource = await readFile("src/view.ts", "utf8");
  assert.match(viewSource, /exportArticleFamily/);
  assert.match(viewSource, /readingSectionsToHtml\(sections\)/);
  assert.match(viewSource, /buildDescendantReadingSections\(file, document\)/);
  const themeSource = await readFile("src/themes.ts", "utf8");
  assert.match(themeSource, /经典靛蓝/);
  assert.match(themeSource, /暗夜霓虹/);
  assert.ok((themeSource.match(/id: "/g) ?? []).length >= 10, "at least ten built-in themes should be available");
  assert.match(editorSource, /targetNode && this\.modalEl\.contains\(targetNode\)/, "clicking outside the modal should close after flushing autosave");
  assert.match(editorSource, /targetModal && targetModal !== this\.modalEl/, "nested dialogs must not close the node editor");
  assert.match(editorSource, /targetModalContainer && ownModalContainer && targetModalContainer !== ownModalContainer/, "clicking a nested dialog backdrop must keep the node editor open");
  assert.doesNotMatch(editorSource, /切换所选文字删除线/, "strikethrough must be hidden from the common formatting toolbar");
  assert.match(editorSource, /可排序的文字块和图片块/);
  assert.match(editorSource, /ImagePreviewModal/);
  assert.match(editorModalSource, /选择上传图床/);
  assert.match(editorModalSource, /mmc-image-preview-sources/);
  assert.match(editorModalSource, /mmc-import-progress/, "XMind and Markdown file imports must show an in-modal progress indicator");
  assert.match(editorModalSource, /正在解析 XMind 画布和主题/, "XMind imports must report their parsing stage");
  assert.match(editorModalSource, /正在解析 Markdown 标题和列表/, "Markdown imports must report their parsing stage");
  assert.match(editorModalSource, /requestAnimationFrame/, "import stage changes must yield so progress can render before parsing");
  assert.match(editorModalSource, /setAllBranchesCollapsed\(imported\.root, true\)/, "imported documents must collapse non-root branches by default");
  assert.match(editorModalSource, /图片来源：/);
  assert.match(editorModalSource, /sourceButton\.addClass\("is-active"\)/);
  assert.match(editorModalSource, /加载失败/);
  assert.match(editorSource, /new ImagePreviewModal\([\s\S]*imageSourceCandidates\(block, true\)/, "mind-map image preview must receive every stored mirror");
  assert.match(articleRendererSource, /imageSourceCandidates\(block, true\)/, "article image preview must receive every stored mirror");
  assert.match(outlineRendererSource, /imageSourceCandidates\(block, true\)/, "outline image preview must receive every stored mirror");
  assert.match(editorSource, /上传当前图片/);
  assert.match(editorSource, /onScheduleAutoUpload/);
  assert.match(editorSource, /syncNodeLegacyFields/);
  assert.match(editorSource, /imageSourceCandidates/);
  assert.match(editorSource, /所有图片镜像均不可用/);
  assert.match(editorSource, /图片地址失效，已从/);
  assert.match(editorSource, /imageFailoverTimeoutSeconds/);

  assert.match(editorSource, /mms-mode-switcher/);
  assert.match(editorSource, /toggleReadOnly/);
  const toggleReadOnlySource = editorSource.match(/toggleReadOnly\(\): void \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(toggleReadOnlySource, /applyReadOnlyStateToRenderedContent\(\)/, "read-only toggles must update the existing DOM instead of rebuilding content");
  assert.match(toggleReadOnlySource, /currentMode === "reading" && !this\.readOnly[\s\S]*this\.render\(\)[\s\S]*return;[\s\S]*this\.applyReadOnlyStateToRenderedContent\(\)/, "only the deliberate continuous-book to article-editor transition may render; ordinary toggles must use the fast path");
  assert.match(editorSource, /private applyReadOnlyStateToRenderedContent\(\): void[\s\S]*data-mms-inline-editable[\s\S]*nodeEl\.draggable/, "the fast path must update inline editors and node dragging in place");
  assert.match(editorSource, /dataset\.mmsInlineEditable = "true"[\s\S]*if \(this\.readOnly\) return;[\s\S]*attachSelectionFormatToolbar/, "inline editor listeners must remain available when read-only content becomes editable");
  assert.match(editorSource, /element\.addEventListener\("pointerdown"[\s\S]*element\.contentEditable = "true"[\s\S]*element\.contentEditable = "false"/, "editing mode must activate and release one inline text line at a time");
  assert.match(editorSource, /private activateInlineEditable\(element: HTMLElement\): void/, "keyboard quick-edit must activate the same click-to-edit line path");
  assert.match(editorSource, /currentMode === "reading" && !this\.readOnly[\s\S]*this\.currentMode = "article"[\s\S]*通读模式已切换为文章编辑模式/, "editing from a continuous reading book must enter a writable article view");
  assert.match(editorSource, /const preserveReadingEdit = previousMode === "reading" && resolved === "article" && !this\.readOnly/, "global article-mode propagation must preserve the current map's requested edit state");
  assert.match(editorSource, /已进入阅读模式/, "the non-editing state must be presented as reading mode");
  assert.match(editorSource, /if \(this\.readOnly\) this\.articleEl\.querySelectorAll\("\.is-selected, \.is-multi-selected"\)/, "switching to reading mode must clear residual article selection frames");
  assert.match(editorSource, /element\.addClass\("is-inline-editing"\)[\s\S]*element\.removeClass\("is-inline-editing"\)/, "only the focused inline text should enter the editing-frame state");
  assert.match(editorSource, /isNearNodeEdge\(event, nodeEl\)\) this\.editSelected\(\);[\s\S]*else this\.beginInlineEdit\(node\.id\)/, "edge double-clicks must open the full editor while the center remains a quick edit");
  assert.match(editorSource, /private isNearNodeEdge\(event: MouseEvent, nodeEl: HTMLElement\): boolean[\s\S]*return distance <= 18/, "the node edge hit area must be explicit and stable");
  assert.match(editorSource, /captureReadingPosition/);
  assert.match(editorSource, /restoreReadingPosition/);
  assert.match(editorSource, /nodeRatio: Math\.max\(0, Math\.min\(1/);
  assert.match(editorSource, /scroller\.scrollTop \+= targetY - desiredY/, "article and outline modes must restore the same semantic reading position");
  assert.match(editorSource, /scrollPosition = scroller \? \{ top: scroller\.scrollTop, left: scroller\.scrollLeft \}/);
  assert.match(editorSource, /window\.requestAnimationFrame\(restore\)/, "switching edit state must restore the current scroll position after rerender");
  assert.match(editorSource, /renderOutline/);
  assert.match(editorSource, /renderArticle/);
  assert.match(articleRendererSource, /!options\.readOnly && options\.selectedId === info\.node\.id[\s\S]*if \(!options\.readOnly\) section\.addEventListener\("click"/, "article reading mode must not attach node-selection frames to every clicked row");
  assert.match(editorSource, /currentMode === "article" \|\| this\.currentMode === "reading" \|\| this\.document\.view\?\.readOnly === true/, "article and reading modes should initialize as read-only");
  assert.match(editorSource, /\(mode === "article" \|\| mode === "reading"\) && mode !== previousMode[\s\S]*this\.readOnly = true/, "entering article or reading mode should reset to reading state");
  assert.match(editorSource, /currentMode !== "article" && this\.currentMode !== "reading"\) this\.persistReadOnlyState/, "temporary reading modes must not overwrite the document read-only preference");
  assert.match(editorSource, /private renderReading\(\)/);
  assert.match(editorSource, /onReadingProgressChange/);
  assert.match(editorSource, /private renderArticle\(\): void \{[\s\S]*?renderArticleMode\([\s\S]*?this\.addArticleScrollToTopButton\(\)/, "article mode must render the return-to-top control");
  assert.match(editorSource, /private renderReading\(\): void \{[\s\S]*?this\.addArticleScrollToTopButton\(\)/, "continuous reading mode must render the return-to-top control");
  assert.match(editorSource, /private addArticleScrollToTopButton\(\): void \{[\s\S]*?mms-article-scroll-top[\s\S]*?setIcon\(button, "arrow-up"\)[\s\S]*?this\.articleEl\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)/, "return-to-top control must smoothly scroll the article view itself");
  assert.match(editorSource, /const contentSections = sections\.length > 1 \? sections\.slice\(1\) : sections/, "continuous reading must not repeat the top-level directory map as body content");
  assert.match(editorSource, /contentPaths\.has\(entry\.filePath\)/, "continuous-reading TOC must omit entries whose top-level body is hidden");
  assert.match(editorSource, /item\.style\.setProperty\("--mms-article-depth", String\(tocDepth\)\)/, "continuous-reading TOC must visually distinguish relative structural depth");
  assert.match(editorSource, /sectionEntry\?\.displayTitle \|\| nodePrimaryText/, "child-map headings must retain their chapter numbering");
  assert.match(editorSource, /renderArticleContent\(chapter, section\.document\.root, false\)/, "continuous reading should include root-node body content");
  assert.match(editorSource, /firstTextBlock[\s\S]*mms-article-leaf-text[\s\S]*renderRichTextRuns/, "continuous reading should include leaf-node primary text");
  assert.match(editorSource, /selection && !selection\.isCollapsed && selection\.toString\(\)/, "read-only copy should preserve native selected-text copying");
  assert.match(editorSource, /createElementNS\("http:\/\/www\.w3\.org\/2000\/svg", "svg"\)/, "theme cards should use stable SVG previews");
  assert.match(editorSource, /删除子导图 \/ 移除链接/);
  assert.match(editorSource, /mmc-zoom-control[\s\S]*mmc-zoom-step[\s\S]*mmc-zoom-status[\s\S]*mmc-zoom-step/, "zoom buttons should flank the percentage in a dedicated control");
  assert.match(editorSource, /mmc-zoom-input[\s\S]*inputmode: "decimal"[\s\S]*applyZoomInput/, "the zoom percentage should accept manual input");
  assert.match(editorSource, /twoFingerGestureAction === "pan"[\s\S]*this\.panX -= event\.deltaX/, "two-finger trackpad gestures should support canvas panning");
  assert.match(editorSource, /event\.shiftKey[\s\S]*clampZoom[\s\S]*applyTransform/, "Shift+scroll should zoom regardless of gesture setting");
  assert.match(editorSource, /beginTwoFingerGesture\(\)[\s\S]*updateTwoFingerGesture\(\)/, "two-finger touch gestures should use the configured action");
  assert.doesNotMatch(editorSource, /toolbarEl\.addEventListener\("contextmenu"/, "expand/collapse-all context menu should not be bound to the toolbar");
  assert.match(mainSource, /vault\.trash\(target, true\)/, "submap deletion should use the system trash");
  assert.match(editorSource, /skipArticleNumbering/);
  assert.match(editorSource, /文章编号方式/);
  assert.match(editorSource, /手动层级（自定义最高层级）/);
  assert.match(editorSource, /最高文章层级/);
  assert.match(editorSource, /createArticleNumberingControls[\s\S]*AppearanceModal/, "node editing and current-map appearance must share article-numbering controls");
  assert.match(editorSource, /previousMode === "mindmap"\) this\.persistMindMapViewportState\(\)/, "leaving mind-map mode must persist zoom and pan");
  assert.match(editorSource, /initializeMindMapViewport\(50\)/);
  assert.match(editorSource, /private persistMindMapViewportState\(\): void/);
  assert.match(editorSource, /if \(mode === "mindmap"\) \{[\s\S]*mindMapViewportInitialized[\s\S]*applyTransform/, "returning to mind-map mode must restore the existing transform instead of always fitting");
  assert.doesNotMatch(editorSource, /mode === "mindmap" && this\.options\.autoFitOnOpen\) window\.setTimeout\(\(\) => this\.fitToView\(\), 20\);/, "mode switching must not unconditionally fit the canvas");
  assert.match(editorSource, /articleNumberingLevel/);
  assert.match(articleRendererSource, /is-compact-number/, "punctuation-style numbering must not insert an artificial visual gap");
  assert.match(mainSource, /const numberedIndexes = new Map<number, number>\(\)/, "cross-file TOC numbering must count each manual level independently");
  assert.match(mainSource, /tocDepth: structureDepth/, "cross-file TOC entries must store structural depth separately from numbering depth");
  assert.match(mainSource, /processItems\(descendants, numbering\.level \+ 1, structureDepth \+ 1\)/, "cross-file TOC structural depth must advance independently");
  assert.match(editorSource, /const articleTocMaxDepth = this\.effectiveArticleTocMaxDepth\(\)[\s\S]*articleTocDepth\(entry\) <= articleTocMaxDepth/, "continuous-reading TOC filtering must use the effective per-document structural-depth limit");
  assert.match(articleRendererSource, /articleTocDepth\(item\) <= options\.articleTocMaxDepth/, "article directory filtering must use structural depth");
  assert.match(editorSource, /跟随插件设置（当前 \$\{this\.globalArticleTocMaxDepth\} 层）/, "current-map appearance must offer a follow-plugin TOC-depth option");
  assert.match(editorSource, /titleEl\.setText\("主题与外观"\)/, "the current-map appearance dialog must use the new theme-and-appearance name");
  assert.match(editorSource, /阅读缩略导航图/, "the current-map appearance dialog must offer a minimap override");
  assert.match(editorSource, /private renderArticleMiniMap\(\): void/, "article and reading views must render a structural minimap navigator");
  assert.match(editorSource, /private updateArticleMiniMapVisibility\(\): void/, "the article minimap must respond to available reading width");
  assert.match(editorSource, /private updateArticleMiniMapActiveMarker\(\): void/, "the article minimap must highlight the current reading section");
  assert.match(editorSource, /this\.effectiveArticleTocMaxDepth\(\)/, "the article minimap must use the configured TOC depth limit");
  assert.match(editorSource, /10_000/, "the article minimap should automatically hide after ten seconds of inactivity");
  assert.match(editorSource, /rootRect\.right - pageRect\.right < requiredGutter/, "the minimap must hide when the page has no safe right gutter");
  assert.match(editorSource, /this\.resizeObserver\.observe\(this\.rootEl\)/, "opening a sidebar must re-evaluate minimap visibility without rebuilding the article");
  assert.match(editorSource, /target\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/, "minimap markers must navigate to their article targets");
  assert.match(editorSource, /this\.currentMode !== "mindmap" \|\| !this\.options\.visibleToolbarItems\.includes\("submap"\)/, "submap toolbar actions must remain hidden outside mind-map mode");
  assert.match(editorSource, /this\.document\.view\?\.articleTocMaxDepth, this\.options\.articleTocMaxDepth/, "article and reading modes must resolve the document TOC override before the plugin setting");
  assert.match(editorSource, /同时用于文章模式目录和通读模式全书目录/, "the current-map TOC-depth control must describe both affected modes");
  assert.match(mainSource, /let hasSubmaps = false[\s\S]*hasSubmaps = true[\s\S]*showToc: isTopLevel && hasSubmaps && tocEntries\.length > 0/, "article directory availability must retain the original child-map requirement");
  assert.match(articleRendererSource, /const directoryOnly = options\.showArticleToc[\s\S]*articleLandingMode !== "article"[\s\S]*renderDirectory\(page, options\);[\s\S]*return;/, "article mode must switch between a pure directory page and the original article body");
  assert.match(mainSource, /resolveArticleSiblingPages\(tocEntries, file\.path\)/, "article pagination context must be built from physical sibling pages instead of the flattened recursive TOC");
  assert.match(articleRendererSource, /const pageEntry = currentArticlePageEntry\(options\.articleNavigation\)[\s\S]*mms-article-number[\s\S]*mms-article-document-title-text/, "child article pages must render the generated number before the editable root title");
  assert.match(articleRendererSource, /const index = navigation\.currentIndex;/, "article paging must remain anchored to the current physical page");
  assert.doesNotMatch(articleRendererSource + editorSource, /articleNavigationIndex/, "in-page node focus must not maintain a second pagination index");
  assert.doesNotMatch(articleRendererSource, /if \(hasDirectory\) renderDirectory\(page, options\)/, "the original article body must not receive an inline directory");
  assert.match(editorSource, /DISPLAY_MODE_LABELS/);
  assert.match(mainSource, /switch-to-\$\{mode\}-mode/);
  assert.match(mainSource, /toggle-mind-map-read-only/);

  const settingsSource = await readFile("src/settings.ts", "utf8");
  assert.match(settingsSource, /\.setLimits\(0\.5, 8, 0\.05\)[\s\S]*\.setLimits\(0\.25, 4, 0\.05\)/, "global edge-width controls must use the same precision as the appearance modal");
  assert.match(settingsSource, /autoUploadEnabled/);
  assert.match(settingsSource, /autoUploadDelaySeconds/);
  assert.match(settingsSource, /autoUploadHostIds/);
  assert.match(settingsSource, /检测 API 连通性/);
  assert.match(settingsSource, /新增图床/);
  assert.match(settingsSource, /createEl\("details", \{ cls: "mms-image-host-card" \}\)/, "image-host settings must use collapsible cards");
  assert.match(settingsSource, /card\.open = this\.expandedImageHostIds\.has\(host\.id\)/, "image-host cards must be collapsed by default while retaining the current session state");
  assert.match(settingsSource, /createEl\("summary", \{ cls: "mms-image-host-card-title" \}\)/);
  assert.match(settingsSource, /远程图片自动故障转移/);
  assert.match(settingsSource, /单个镜像等待时间/);
  assert.match(settingsSource, /本地副本作为最后回退/);
  assert.match(settingsSource, /默认节点文字对齐/);
  assert.match(settingsSource, /双指手势/);
  assert.match(settingsSource, /twoFingerGestureAction/);
  assert.match(settingsSource, /defaultNodeTextAlign/);
  assert.match(settingsSource, /节点宽度模式/);
  assert.match(settingsSource, /自动宽度上限/);
  assert.match(settingsSource, /文章目录最大层级/);
  assert.match(settingsSource, /showArticleMiniMap: boolean/, "the article minimap preference must be persisted");
  assert.match(settingsSource, /\.setName\("文章\/通读缩略导航图"\)[\s\S]*\.addToggle/, "settings must expose the article minimap toggle");
  assert.match(settingsSource, /通读进度条位置/);
  assert.match(settingsSource, /回到顶部按钮显示时机/);
  assert.match(settingsSource, /returnToTopVisibility/);
  assert.match(settingsSource, /可拖动或直接输入 0–100/);
  assert.match(settingsSource, /setLimits\(0, 100, 1\)/, "return-to-top threshold must use a 0–100 percent slider");
  assert.match(settingsSource, /setPlaceholder\("0–100"\)/, "return-to-top threshold must allow direct percentage input");
  assert.match(settingsSource, /function normalizeReturnToTopVisibility/);
  assert.match(mainSource, /articleTocMaxDepth:[\s\S]*Math\.max\(1, Math\.min\(8/);
  assert.match(mainSource, /showArticleMiniMap: raw\.showArticleMiniMap !== false/, "the article minimap must default to enabled for existing installations");
  assert.match(mainSource, /returnToTopVisibility: normalizeReturnToTopVisibility\(raw\.returnToTopVisibility\)/, "stored return-to-top visibility thresholds must be normalized");
  assert.match(mainSource, /twoFingerGestureAction: raw\.twoFingerGestureAction === "pan" \? "pan" : "zoom"/, "stored two-finger gesture settings must be normalized");
  assert.match(articleRendererSource, /articleTocDepth\(item\) <= options\.articleTocMaxDepth/, "article TOC rendering should honor the configured maximum depth");
  assert.match(articleRendererSource, /if \(firstTextBlock\?\.text\.trim\(\)\)/, "table-only article nodes must not create an empty body placeholder");
  assert.match(editorSource, /position-\$\{this\.options\.readingProgressPosition\}/);
  assert.match(editorSource, /progress \* 100 >= this\.options\.returnToTopVisibility[\s\S]*?button\.toggleClass\("is-visible", visible\)/, "return-to-top visibility must honor the configured percentage threshold");

  assert.match(settingsSource, /visibleModes/);
  assert.match(settingsSource, /当前全局显示模式/);
  assert.match(settingsSource, /一键还原所有插件设置/);

  const cssSource = await readFile("styles.css", "utf8");
  assert.match(cssSource, /\.mms-article-minimap[\s\S]*position:\s*absolute/, "the reading minimap must be anchored in the upper-right corner");
  assert.match(cssSource, /\.mms-article-minimap[\s\S]*width:\s*74px/, "the reading minimap should provide a wider click target");
  assert.match(cssSource, /\.mms-article-minimap\.is-hidden[\s\S]*display:\s*none/, "the minimap must disappear when the page edge is too close");
  assert.match(cssSource, /\.mms-article-minimap\.is-idle-hidden[\s\S]*opacity:\s*0/, "the minimap must fade when idle");
  assert.match(cssSource, /\.mms-article-minimap-marker\.is-active[\s\S]*background:\s*var\(--text-normal\)/, "the current reading section must have a dark minimap marker");
  assert.match(cssSource, /\.mms-article-minimap-marker[\s\S]*cursor:\s*pointer/, "minimap markers must be clickable");
  assert.match(cssSource, /\.mmc-editor\.is-read-only \.mmc-node[\s\S]*user-select:\s*text/, "read-only views should allow text selection");
  assert.match(cssSource, /\.mmc-parent-navigation-button[\s\S]*min-height:\s*44px/);
  assert.match(cssSource, /\.mmc-parent-navigation-button[\s\S]*height:\s*auto !important/);
  assert.match(cssSource, /\.mmc-parent-navigation-title[\s\S]*line-height:\s*1\.35/);
  assert.match(cssSource, /\.mmc-appearance-style-options[\s\S]*grid-template-columns:\s*repeat\(3/);
  assert.match(cssSource, /\.mmc-appearance-style-option input\[type="checkbox"\][\s\S]*width:\s*16px !important/);
  assert.match(editorSource, /mmc-article-numbering-control/);
  assert.match(cssSource, /\.mmc-node-edit-modal label\.mmc-article-numbering-control[\s\S]*display:\s*grid/);
  assert.match(cssSource, /\.mms-selection-format-toolbar[\s\S]*position:\s*fixed/);
  assert.match(cssSource, /\.mms-article-scroll-top\s*\{[\s\S]*?position:\s*fixed[\s\S]*?right:\s*28px[\s\S]*?bottom:\s*28px/, "article and continuous-reading return-to-top control must float at the lower right");
  assert.match(cssSource, /\.mms-article-scroll-top\s*\{[\s\S]*?opacity:\s*0[\s\S]*?pointer-events:\s*none/, "return-to-top control must be hidden before the configured threshold");
  assert.match(cssSource, /\.mms-article-scroll-top\.is-visible\s*\{[\s\S]*?opacity:\s*1[\s\S]*?pointer-events:\s*auto/, "return-to-top control must become interactive after the configured threshold");
  assert.match(cssSource, /\.mms-article-pager button\s*\{[\s\S]*?cursor:\s*pointer\s*!important/, "article previous, next and parent navigation buttons must use the hand cursor");
  assert.match(cssSource, /\.mms-article-pager button:disabled\s*\{[\s\S]*?cursor:\s*not-allowed\s*!important/, "disabled article navigation controls must not keep the hand cursor");
  assert.match(cssSource, /\.mmc-parent-navigation-button\s*\{[\s\S]*?cursor:\s*pointer\s*!important/, "document-flow parent navigation must keep the hand cursor across Obsidian themes");
  assert.match(cssSource, /\.mmc-canvas-breadcrumb-back\s*\{[\s\S]*?cursor:\s*pointer\s*!important/, "canvas back navigation must keep the hand cursor across Obsidian themes");
  assert.match(cssSource, /\.mmc-canvas-breadcrumb-parent\s*\{[\s\S]*?cursor:\s*pointer\s*!important/, "canvas parent breadcrumb must keep the hand cursor across Obsidian themes");
  assert.match(cssSource, /\.mms-article-leaf-text,[\s\S]*\.mms-article-paragraph[\s\S]*text-indent:\s*2em/, "all body paragraphs must use a stable two-em first-line indent");
  assert.match(importExport.documentToHtml(importedXmind), /\.body-paragraph\{[^}]*text-indent:2em/, "exported articles must preserve uniform paragraph indentation");
  assert.match(cssSource, /\.mms-outline-table-wrap[\s\S]*max-height:\s*320px/);
  assert.match(cssSource, /\.mms-outline-content[\s\S]*margin:\s*2px 8px 10px 31px/, "outline content must not apply the node depth twice");
  assert.match(cssSource, /\.mms-outline-item\.is-content-only > \.mms-outline-content[\s\S]*margin-left:\s*8px/);
  assert.match(cssSource, /\.mms-outline-table th[\s\S]*position:\s*sticky/);
  assert.match(outlineRendererSource, /is-content-only/);
  assert.match(cssSource, /\.mms-outline-item\.is-content-only > \.mms-outline-row[\s\S]*display:\s*none/, "content-only outline nodes must not leave an empty title row");
  assert.match(cssSource, /\.mmc-node-edit-modal \.mmc-article-numbering-help[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(cssSource, /\.mms-article-heading\.is-compact-number[\s\S]*gap:\s*0/);
  assert.match(cssSource, /\.mmc-image-preview-stage/);
  assert.match(cssSource, /\.mmc-image-preview-source-button\.is-active/);
  assert.match(cssSource, /\.mmc-image-preview-sources\.has-error/);
  assert.match(cssSource, /\.mmc-content-block-list/);
  assert.match(cssSource, /cursor:\s*zoom-in/);
  assert.match(cssSource, /\.mms-image-host-card/);
  assert.match(cssSource, /\.mms-image-host-card-title::before[\s\S]*content:\s*"›"/, "collapsed image-host cards must show an expansion arrow");
  assert.match(cssSource, /\.mms-image-host-card\[open\] > \.mms-image-host-card-title::before[\s\S]*rotate\(90deg\)/);
  assert.match(cssSource, /\.mms-image-host-picker-item/);
  assert.match(cssSource, /\.mmc-import-progress progress[\s\S]*accent-color:\s*var\(--interactive-accent\)/, "the import progress bar must use the active theme accent");
  assert.match(cssSource, /--mmc-current-edge-width/);
  assert.match(cssSource, /\.mms-mode-switcher/);
  assert.match(cssSource, /\.mms-outline-view/);
  assert.match(cssSource, /\.mms-article-view/);
  assert.match(cssSource, /\.mms-article-toc/);
  assert.match(cssSource, /\.mms-reading-progress\.position-bottom/);
  assert.match(cssSource, /\.mms-reading-progress\.position-left/);
  assert.match(cssSource, /\.mms-reading-progress\.position-right/);
  assert.match(cssSource, /\.mms-reading-progress\.position-bottom[\s\S]*top:\s*calc\(100% - 76px\)/);
  assert.match(cssSource, /\.mms-reading-progress\.position-left[\s\S]*conic-gradient/);
  assert.match(cssSource, /content:\s*attr\(data-progress\)/);
  assert.match(cssSource, /@media \(max-width:\s*1100px\)[\s\S]*\.mms-reading-progress\.position-left/);
  assert.doesNotMatch(cssSource, /writing-mode:\s*vertical-rl/);
  assert.match(cssSource, /\.mms-submap-text-link/);
  assert.match(editorSource, /mmc-node-text\$\{isSubmapTitle \? " is-submap-link"/);
  assert.match(editorSource, /mmc-submap-inline-indicator/);
  assert.match(editorSource, /mmc-submap-corner-link/);
  assert.doesNotMatch(editorSource, /mmc-submap-card/, "mind-map nodes must not render a duplicate named submap card");
  assert.match(cssSource, /\.mmc-node-text\.is-submap-link/);
  assert.match(cssSource, /\.mmc-node-text-block \.mmc-node-text\.is-submap-link[\s\S]*width:\s*100%/);
  assert.match(cssSource, /\.mmc-node\.is-submap-node[\s\S]*cursor:\s*pointer/);
  assert.match(cssSource, /\.mmc-node-resize-handle/);
  assert.doesNotMatch(cssSource, /\.mmc-node\.is-selected > \.mmc-node-resize-handle[\s\S]*display:\s*block/, "selecting a node must not reveal a resize handle");
  assert.match(cssSource, /\.mmc-ctrl-resize \.mmc-node > \.mmc-node-resize-handle[\s\S]*display:\s*none !important/, "Ctrl/Cmd resize must hide every handle until its node is hovered");
  assert.match(cssSource, /\.mmc-ctrl-resize\.is-ctrl-held \.mmc-node:hover > \.mmc-node-resize-handle[\s\S]*display:\s*block !important/, "Ctrl/Cmd resize must reveal only the hovered node's handle");
  assert.match(cssSource, /\.mmc-ctrl-resize\.is-ctrl-held \.mmc-node:hover > \.mmc-fold-button[\s\S]*display:\s*none/, "the child counter must hide while the hovered node shows its resize handle");
  assert.match(cssSource, /\.mmc-editor\.is-read-only \.mmc-node-resize-handle[\s\S]*display:\s*none !important[\s\S]*pointer-events:\s*none !important/, "read-only mode must hide pre-rendered resize controls without a full redraw");
  assert.match(cssSource, /\.mmc-editor\.is-reading \.mms-inline-node-actions[\s\S]*display:\s*none !important/, "reading mode must not reserve layout space for editing actions");
  assert.match(cssSource, /\.mms-article-paragraph\.is-inline-editing[\s\S]*margin-top:[\s\S]*padding:[\s\S]*box-shadow:/, "only the active article line should reserve space for its edit frame");
  assert.match(cssSource, /\.mms-inline-node-actions\s*\{[\s\S]*display:\s*none[\s\S]*\.mms-article-node:focus-within > \.mms-inline-node-actions[\s\S]*display:\s*inline-flex/, "inactive editing actions must not expand every article row");
  assert.match(cssSource, /\.mmc-fold-button\s*\{[\s\S]*right:\s*-11px[\s\S]*bottom:\s*-11px[\s\S]*transform:\s*none/, "child counters must remain at the lower-right corner");
  assert.match(cssSource, /\.mmc-node\s*\{[\s\S]*padding:\s*9px 13px 11px/, "node content must keep equal horizontal padding after the fold control moved to the corner");
  assert.match(cssSource, /\.mmc-node\.is-root\s*\{[\s\S]*padding-right:\s*13px/, "root-node text must remain horizontally centered");
  assert.match(cssSource, /\.mmc-node-resize-handle\s*\{[\s\S]*right:\s*-7px[\s\S]*bottom:\s*-7px/, "resize control must remain anchored at the lower-right corner");
  assert.match(cssSource, /white-space:\s*pre-wrap/);
  assert.match(editorSource, /if \(node\.submap\) void this\.callbacks\.onOpenMindMap\(node\.submap\.path\)/, "the whole linked node must open its child map");
  assert.match(editorSource, /拖动调整节点宽度和最小高度/);
  assert.match(editorSource, /this\.rootEl\.addClass\("mmc-ctrl-resize"\)/, "Ctrl/Cmd resize styling must be applied after the editor root exists");
  assert.match(editorSource, /private resizeModifier: ResizeModifier = "ctrl"/, "Ctrl/Cmd resize must be the editor default");
  assert.match(settingsSource, /export type ResizeModifier = "ctrl"/);
  assert.match(settingsSource, /resizeModifier: "ctrl"/, "new installations must default to Ctrl/Cmd resize");
  assert.doesNotMatch(settingsSource, /\.setName\("拖动调整节点大小"\)/, "direct resizing must no longer be configurable");
  assert.match(mainSource, /resizeModifier: "ctrl"/, "legacy direct-resize settings must migrate to Ctrl/Cmd mode");
  assert.match(settingsSource, /syncTitleToFilename: boolean/, "title synchronization must be a persisted setting");
  assert.match(settingsSource, /\.setName\("中心节点标题同步文件名"\)[\s\S]*\.addToggle/, "settings must expose the title-to-filename synchronization toggle");
  assert.match(mainSource, /syncTitleToFilename: raw\.syncTitleToFilename !== false/, "title synchronization must default to enabled");
  assert.match(mainSource, /async syncMindMapTitleToFilename\(file: TFile, document: MindMapDocument\): Promise<TFile>/, "saving a map must support root-title filename synchronization");
  assert.match(mainSource, /updateParentSubmapReference\(renamed, oldPath, document\.navigation\?\.parentPath, document\.navigation\?\.parentNodeId\)/, "renaming a submap must preserve its parent entry");
  assert.match(mainSource, /updateChildSubmapNavigation\(renamed, oldPath, document\)/, "renaming a parent map must preserve child navigation");
  assert.match(viewSource, /await this\.plugin\.syncMindMapTitleToFilename\(file, document\)/, "saving an edited root node must synchronize the filename");
  assert.match(editorSource, /dropPositionForEvent/);
  assert.match(editorSource, /moveNodeRelative/);
  assert.match(editorSource, /requestedIds[\s\S]*findAncestors[\s\S]*moveOrder/, "multi-selection drag should move top-level selected nodes as one ordered batch");
  assert.match(editorSource, /topLevelSelectedNodeIds\(this\.document\.root, this\.selectedIds\)[\s\S]*flattenNodes\(this\.document\.root\)[\s\S]*nodes: sourceNodes/, "multi-selection copy must serialize the ordered top-level branches");
  assert.match(editorSource, /this\.selectedIds\.size > 1 && batch\.length/, "multi-selection deletion must use the same top-level branches as copying");
  assert.match(editorSource, /parseClipboardNodes\(text\)[\s\S]*selected\.children\.push\(\.\.\.clones\)/, "multi-selection paste must append every copied branch");
  assert.match(editorSource, /setAllBranchesCollapsed\(clone, true, true\)/, "pasted branches must be collapsed by default");
  assert.match(clipboardImportSource, /export function parseClipboardNodes/, "clipboard imports must recognize multi-node payloads");
  assert.match(cssSource, /\.mmc-node\.is-drop-before::before/);
  assert.match(cssSource, /\.mmc-node\.is-drop-after::after/);
  assert.match(cssSource, /\.mmc-node\.is-drop-child-right/);
  assert.match(editorSource, /showDropPreview\(node\.id, position\)/);
  assert.match(cssSource, /\.mmc-drop-preview[\s\S]*pointer-events:\s*none/);
  assert.match(editorSource, /mmc-selection-marquee/);
  assert.match(editorSource, /toggleNodeSelection/);
  assert.match(cssSource, /\.mmc-selection-marquee/);
  assert.match(editorSource, /恢复节点自动大小/);
  assert.match(editorSource, /节点宽度（100–900）/);
  assert.match(editorSource, /文字对齐/);
  assert.match(cssSource, /\.mmc-submap-corner-link/);
  assert.doesNotMatch(cssSource, /\.mmc-submap-card/, "obsolete duplicate submap-card styling should be removed");
  assert.match(editorSource, /onDisplayModeChange/);
  assert.match(editorSource, /articleBaseDepth/);
  assert.match(mainSource, /buildArticleContext/);
  assert.match(editorSource, /setAttribute\("stroke-width"/);
  assert.match(editorSource, /setProperty\("stroke-width"[\s\S]*"important"/);
  assert.match(editorSource, /mmc-canvas-breadcrumb/);
  assert.match(editorSource, /showCanvasBreadcrumb = hasParent && this\.currentMode === "mindmap"/);
  assert.doesNotMatch(editorSource, /mmc-parent-node-return/, "the root node must not carry a parent-return decoration");
  assert.match(cssSource, /\.mmc-canvas-breadcrumb[\s\S]*position:\s*absolute/);
  assert.match(cssSource, /\.mmc-canvas-breadcrumb-shell[\s\S]*backdrop-filter:\s*blur/);
  assert.match(cssSource, /\.mmc-canvas-breadcrumb-parent[\s\S]*text-overflow:\s*ellipsis/);


  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
  const versions = JSON.parse(await readFile("versions.json", "utf8"));
  const currentVersion = packageJson.version;

  assert.match(currentVersion, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "package version must be valid semver");
  assert.equal(manifest.id, "mindmap-studio");
  assert.equal(manifest.name, "MindMap Studio");
  assert.equal(manifest.version, currentVersion, "manifest version must match package.json");
  assert.equal(packageLock.version, currentVersion, "package-lock version must match package.json");
  assert.equal(packageLock.packages?.[""]?.version, currentVersion, "package-lock root package version must match package.json");
  assert.equal(versions[currentVersion], manifest.minAppVersion, "versions.json must contain the current version and minAppVersion");
  assert.match(cssSource, /\.mms-global-search-modal/);
  assert.match(cssSource, /\.mms-global-search-result/);
  assert.match(cssSource, /mms-global-search-regex/, "CSS should style the regex toggle button");
  assert.match(cssSource, /mms-global-search-replace-row/, "CSS should style the replace section");
  assert.match(cssSource, /mms-global-search-replace-one/, "CSS should style the per-result replace button");
  assert.match(cssSource, /\.mms-global-search-result-title\s*\{[\s\S]*overflow-wrap:\s*anywhere[\s\S]*white-space:\s*normal/, "long search result titles must wrap instead of being truncated");

  console.log("All MindMap Studio tests passed.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
