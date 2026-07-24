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
  const document = model.createDefaultDocument("测试脑图");
  const xmindArchive = zipSync({
    "content.json": strToU8(JSON.stringify([{ rootTopic: { title: "XMind 根", children: { attached: [{ title: "分支 A" }] } } }]))
  });
  const importedXmind = importExport.xmindToDocument(xmindArchive.buffer, "fallback");
  assert.equal(importedXmind.root.text, "XMind 根");
  assert.equal(importedXmind.root.children[0]?.text, "分支 A");
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
  document.view = { articleLandingMode: "toc" };
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
  assert.equal(nodeActions.deleteNodes(actionRoot, ["action-a"]), 1);
  assert.deepEqual(actionRoot.children.map((node) => node.id), ["action-b"]);

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
  assert.equal(byId.get("section-two")?.label, "第二节");
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
  assert.deepEqual(modes.normalizeVisibleModes(["article", "mindmap", "article"]), ["article", "mindmap"]);
  assert.deepEqual(modes.normalizeVisibleModes([]), ["mindmap", "outline", "article", "reading"]);

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
  assert.equal(globalSearch.searchEntries(hierarchyEntries, "古诗 唐诗 李白")[0]?.nodeId, "libai-node", "global search must match the full parent-child map hierarchy");
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
  assert.match(globalSearchSource, /古诗 › 唐诗/);
  assert.match(globalSearchSource, /first climb to the top parent/);
  assert.match(globalSearchSource, /version: 2/);
  const editorSource = await readFile("src/editor/editor.ts", "utf8");
  const editorModalSource = await readFile("src/editor/editor-modals.ts", "utf8");
  const nodeRichTextSource = await readFile("src/editor/node-rich-text-editor.ts", "utf8");
  const articleRendererSource = await readFile("src/editor/article-renderer.ts", "utf8");
  const outlineRendererSource = await readFile("src/editor/outline-renderer.ts", "utf8");
  const selectionToolbarSource = await readFile("src/editor/selection-format-toolbar.ts", "utf8");
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
  assert.match(editorSource, /this\.modalEl\.contains\(event\.target as Node\)/, "clicking outside the modal should close after flushing autosave");
  assert.doesNotMatch(editorSource, /切换所选文字删除线/, "strikethrough must be hidden from the common formatting toolbar");
  assert.match(editorSource, /可排序的文字块和图片块/);
  assert.match(editorSource, /ImagePreviewModal/);
  assert.match(editorModalSource, /选择上传图床/);
  assert.match(editorSource, /上传当前图片/);
  assert.match(editorSource, /onScheduleAutoUpload/);
  assert.match(editorSource, /syncNodeLegacyFields/);
  assert.match(editorSource, /imageSourceCandidates/);
  assert.match(editorSource, /所有图片镜像均不可用/);
  assert.match(editorSource, /图片地址失效，已从/);
  assert.match(editorSource, /imageFailoverTimeoutSeconds/);

  assert.match(editorSource, /mms-mode-switcher/);
  assert.match(editorSource, /toggleReadOnly/);
  assert.match(editorSource, /scrollPosition = scroller \? \{ top: scroller\.scrollTop, left: scroller\.scrollLeft \}/);
  assert.match(editorSource, /window\.requestAnimationFrame\(restore\)/, "switching edit state must restore the current scroll position after rerender");
  assert.match(editorSource, /renderOutline/);
  assert.match(editorSource, /renderArticle/);
  assert.match(editorSource, /currentMode === "article" \|\| this\.currentMode === "reading" \|\| this\.document\.view\?\.readOnly === true/, "article and reading modes should initialize as read-only");
  assert.match(editorSource, /\(mode === "article" \|\| mode === "reading"\) && mode !== previousMode[\s\S]*this\.readOnly = true/, "entering article or reading mode should reset to reading state");
  assert.match(editorSource, /currentMode !== "article" && this\.currentMode !== "reading"\) this\.persistReadOnlyState/, "temporary reading modes must not overwrite the document read-only preference");
  assert.match(editorSource, /private renderReading\(\)/);
  assert.match(editorSource, /onReadingProgressChange/);
  assert.match(editorSource, /renderArticleContent\(chapter, section\.document\.root, false\)/, "continuous reading should include root-node body content");
  assert.match(editorSource, /firstTextBlock[\s\S]*mms-article-leaf-text[\s\S]*renderRichTextRuns/, "continuous reading should include leaf-node primary text");
  assert.match(editorSource, /selection && !selection\.isCollapsed && selection\.toString\(\)/, "read-only copy should preserve native selected-text copying");
  assert.match(editorSource, /createElementNS\("http:\/\/www\.w3\.org\/2000\/svg", "svg"\)/, "theme cards should use stable SVG previews");
  assert.match(editorSource, /删除子导图 \/ 移除链接/);
  assert.match(editorSource, /mmc-zoom-control[\s\S]*mmc-zoom-step[\s\S]*mmc-zoom-status[\s\S]*mmc-zoom-step/, "zoom buttons should flank the percentage in a dedicated control");
  assert.doesNotMatch(editorSource, /toolbarEl\.addEventListener\("contextmenu"/, "expand/collapse-all context menu should not be bound to the toolbar");
  assert.match(mainSource, /vault\.trash\(target, true\)/, "submap deletion should use the system trash");
  assert.match(editorSource, /skipArticleNumbering/);
  assert.match(editorSource, /DISPLAY_MODE_LABELS/);
  assert.match(mainSource, /switch-to-\$\{mode\}-mode/);
  assert.match(mainSource, /toggle-mind-map-read-only/);

  const settingsSource = await readFile("src/settings.ts", "utf8");
  assert.match(settingsSource, /autoUploadEnabled/);
  assert.match(settingsSource, /autoUploadDelaySeconds/);
  assert.match(settingsSource, /autoUploadHostIds/);
  assert.match(settingsSource, /检测 API 连通性/);
  assert.match(settingsSource, /新增图床/);
  assert.match(settingsSource, /远程图片自动故障转移/);
  assert.match(settingsSource, /单个镜像等待时间/);
  assert.match(settingsSource, /本地副本作为最后回退/);
  assert.match(settingsSource, /默认节点文字对齐/);
  assert.match(settingsSource, /defaultNodeTextAlign/);
  assert.match(settingsSource, /节点宽度模式/);
  assert.match(settingsSource, /自动宽度上限/);
  assert.match(settingsSource, /文章目录最大层级/);
  assert.match(settingsSource, /通读进度条位置/);
  assert.match(mainSource, /articleTocMaxDepth:[\s\S]*Math\.max\(1, Math\.min\(8/);
  assert.match(articleRendererSource, /item\.depth <= options\.articleTocMaxDepth/, "article TOC rendering should honor the configured maximum depth");
  assert.match(articleRendererSource, /if \(firstTextBlock\?\.text\.trim\(\)\)/, "table-only article nodes must not create an empty body placeholder");
  assert.match(editorSource, /position-\$\{this\.options\.readingProgressPosition\}/);

  assert.match(settingsSource, /visibleModes/);
  assert.match(settingsSource, /当前全局显示模式/);
  assert.match(settingsSource, /一键还原所有插件设置/);

  const cssSource = await readFile("styles.css", "utf8");
  assert.match(cssSource, /\.mmc-editor\.is-read-only \.mmc-node[\s\S]*user-select:\s*text/, "read-only views should allow text selection");
  assert.match(cssSource, /\.mmc-parent-navigation-button[\s\S]*min-height:\s*44px/);
  assert.match(cssSource, /\.mmc-parent-navigation-button[\s\S]*height:\s*auto !important/);
  assert.match(cssSource, /\.mmc-parent-navigation-title[\s\S]*line-height:\s*1\.35/);
  assert.match(cssSource, /\.mmc-appearance-style-options[\s\S]*grid-template-columns:\s*repeat\(3/);
  assert.match(cssSource, /\.mmc-appearance-style-option input\[type="checkbox"\][\s\S]*width:\s*16px !important/);
  assert.match(editorSource, /mmc-article-numbering-option/);
  assert.match(cssSource, /\.mmc-node-edit-modal label\.mmc-article-numbering-option input\[type="checkbox"\][\s\S]*width:\s*16px !important/);
  assert.match(cssSource, /\.mms-selection-format-toolbar[\s\S]*position:\s*fixed/);
  assert.match(cssSource, /\.mms-article-leaf-text,[\s\S]*\.mms-article-paragraph[\s\S]*text-indent:\s*2em/, "all body paragraphs must use a stable two-em first-line indent");
  assert.match(importExport.documentToHtml(importedXmind), /\.body-paragraph\{[^}]*text-indent:2em/, "exported articles must preserve uniform paragraph indentation");
  assert.match(cssSource, /\.mms-outline-table-wrap[\s\S]*max-height:\s*320px/);
  assert.match(cssSource, /\.mms-outline-table th[\s\S]*position:\s*sticky/);
  assert.match(outlineRendererSource, /is-content-only/);
  assert.match(cssSource, /\.mms-outline-item\.is-content-only > \.mms-outline-row[\s\S]*display:\s*none/, "content-only outline nodes must not leave an empty title row");
  assert.match(cssSource, /\.mmc-node-edit-modal label\.mmc-article-numbering-option[\s\S]*flex-direction:\s*row/);
  assert.match(cssSource, /\.mmc-image-preview-stage/);
  assert.match(cssSource, /\.mmc-content-block-list/);
  assert.match(cssSource, /cursor:\s*zoom-in/);
  assert.match(cssSource, /\.mms-image-host-card/);
  assert.match(cssSource, /\.mms-image-host-picker-item/);
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
  assert.match(cssSource, /\.mmc-node\.is-selected > \.mmc-node-resize-handle[\s\S]*display:\s*block/);
  assert.match(cssSource, /white-space:\s*pre-wrap/);
  assert.match(editorSource, /if \(node\.submap\) void this\.callbacks\.onOpenMindMap\(node\.submap\.path\)/, "the whole linked node must open its child map");
  assert.match(editorSource, /拖动调整节点宽度和最小高度/);
  assert.match(editorSource, /dropPositionForEvent/);
  assert.match(editorSource, /moveNodeRelative/);
  assert.match(editorSource, /requestedIds[\s\S]*findAncestors[\s\S]*moveOrder/, "multi-selection drag should move top-level selected nodes as one ordered batch");
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

  console.log("All MindMap Studio tests passed.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
