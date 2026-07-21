import assert from "node:assert/strict";
import { readFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";

const tempDir = await mkdtemp(join(tmpdir(), "mindmap-studio-test-"));
const outfile = join(tempDir, "model.cjs");
const layoutOutfile = join(tempDir, "layout.cjs");

try {
  await build({
    entryPoints: ["src/model.ts"],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });
  await build({
    entryPoints: ["src/layout.ts"],
    outfile: layoutOutfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    logLevel: "silent"
  });

  const require = createRequire(import.meta.url);
  const model = require(outfile);
  const layout = require(layoutOutfile);
  const document = model.createDefaultDocument("测试脑图");
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
    underline: true
  };
  document.root.children[0].children.push({ id: "depth-2", text: "二级节点", children: [{ id: "depth-3", text: "三级节点", children: [] }] });
  document.root.children.push({ id: "saved-node", text: "保存后仍可编辑", children: [] });

  const serialized = model.serializeDocument(document);
  assert.ok(serialized.trim().startsWith("{"), "new files must be raw JSON");
  assert.ok(!serialized.includes("```"), "new files must not use Markdown fences");
  assert.ok(!serialized.includes("smm-version"), "new files must not use the old namespace");

  const reopened = model.parseDocument(serialized, "fallback");
  assert.equal(reopened.title, "测试脑图");
  assert.equal(reopened.version, 9);
  assert.equal(reopened.appearance?.backgroundPattern, "dots");
  assert.equal(reopened.appearance?.edgeStyle, "elbow");
  assert.equal(reopened.appearance?.edgeWidthMode, "tapered");
  assert.equal(reopened.appearance?.edgeMinWidth, 1);
  assert.equal(reopened.appearance?.themePreset, "sunset-orange");
  assert.equal(reopened.appearance?.rootColor, "#c2410c");
  assert.deepEqual(reopened.appearance?.branchColors, ["#dc2626", "#2563eb"]);
  assert.equal(reopened.appearance?.underline, true);
  assert.equal(reopened.root.children.at(-1)?.text, "保存后仍可编辑");

  const styled = model.normalizeDocument({
    title: "样式",
    root: {
      id: "root",
      text: "根",
      children: [{
        id: "child",
        text: "子",
        style: { bold: false, italic: true, underline: true, fontSize: 22, borderWidth: 2 },
        children: []
      }]
    }
  }, "fallback");
  assert.equal(styled.root.children[0]?.style?.bold, false, "explicit false style overrides must survive normalization");
  assert.equal(styled.root.children[0]?.style?.underline, true);
  assert.equal(styled.root.children[0]?.style?.fontSize, 22);

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
  assert.equal(layout.edgeWidthForDepth(document.appearance, 1), 3);
  assert.equal(layout.edgeWidthForDepth(document.appearance, 3), 2);
  assert.equal(layout.edgeWidthForDepth(document.appearance, 5), 1);

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

  const mainSource = await readFile("src/main.ts", "utf8");
  assert.match(mainSource, /registerExtensions\(\[MINDMAP_EXTENSION\], VIEW_TYPE_MINDMAP_STUDIO\)/);
  assert.match(mainSource, /MINDMAP_EXTENSION = "mindmap"/);
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
  assert.match(mainSource, /plugins\/mindmap-canvas\/data\.json/, "renamed plugin should migrate old settings");
  const editorSource = await readFile("src/editor.ts", "utf8");
  assert.doesNotMatch(editorSource, /execCommand/, "rich-text formatting must not use browser-wide execCommand behavior");
  assert.match(editorSource, /selectionStart/);
  assert.match(editorSource, /文字样式预览/);
  assert.match(editorSource, /mmc-parent-navigation/);
  assert.doesNotMatch(editorSource, /addToolbarButton\("arrow-left", "返回父导图"/, "parent return should not appear as a redundant small toolbar button");
  assert.match(editorSource, /mmc-node-edit-form/, "node editor must not use an implicitly submitted form");
  assert.match(editorSource, /保存并关闭/);
  assert.doesNotMatch(editorSource, /已自动保存；可继续编辑|等待自动保存|正在自动保存/, "autosave status text must stay hidden");
  assert.match(editorSource, /mmc-rich-color-button/);
  assert.match(editorSource, /mmc-rich-color-line/);
  assert.match(editorSource, /MINDMAP_THEME_PRESETS/);
  assert.match(editorSource, /edgeWidthForDepth/);
  const themeSource = await readFile("src/themes.ts", "utf8");
  assert.match(themeSource, /经典靛蓝/);
  assert.match(themeSource, /暗夜霓虹/);
  assert.ok((themeSource.match(/id: "/g) ?? []).length >= 10, "at least ten built-in themes should be available");
  assert.match(editorSource, /this\.modalEl\.contains\(event\.target as Node\)/, "clicking outside the modal should close after flushing autosave");
  assert.doesNotMatch(editorSource, /切换所选文字删除线/, "strikethrough must be hidden from the common formatting toolbar");
  assert.match(editorSource, /可排序的文字块和图片块/);
  assert.match(editorSource, /ImagePreviewModal/);
  assert.match(editorSource, /选择上传图床/);
  assert.match(editorSource, /上传当前图片/);
  assert.match(editorSource, /onScheduleAutoUpload/);
  assert.match(editorSource, /syncNodeLegacyFields/);
  assert.match(editorSource, /imageSourceCandidates/);
  assert.match(editorSource, /所有图片镜像均不可用/);
  assert.match(editorSource, /图片地址失效，已从/);
  assert.match(editorSource, /imageFailoverTimeoutSeconds/);

  const settingsSource = await readFile("src/settings.ts", "utf8");
  assert.match(settingsSource, /autoUploadEnabled/);
  assert.match(settingsSource, /autoUploadDelaySeconds/);
  assert.match(settingsSource, /autoUploadHostIds/);
  assert.match(settingsSource, /检测 API 连通性/);
  assert.match(settingsSource, /新增图床/);
  assert.match(settingsSource, /远程图片自动故障转移/);
  assert.match(settingsSource, /单个镜像等待时间/);
  assert.match(settingsSource, /本地副本作为最后回退/);

  const cssSource = await readFile("styles.css", "utf8");
  assert.match(cssSource, /\.mmc-parent-navigation-button[\s\S]*min-height:\s*44px/);
  assert.match(cssSource, /\.mmc-parent-navigation-button[\s\S]*height:\s*auto !important/);
  assert.match(cssSource, /\.mmc-parent-navigation-title[\s\S]*line-height:\s*1\.35/);
  assert.match(cssSource, /\.mmc-appearance-style-options[\s\S]*grid-template-columns:\s*repeat\(3/);
  assert.match(cssSource, /\.mmc-appearance-style-option input\[type="checkbox"\][\s\S]*width:\s*16px !important/);
  assert.match(cssSource, /\.mmc-image-preview-stage/);
  assert.match(cssSource, /\.mmc-content-block-list/);
  assert.match(cssSource, /cursor:\s*zoom-in/);
  assert.match(cssSource, /\.mms-image-host-card/);
  assert.match(cssSource, /\.mms-image-host-picker-item/);


  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
  assert.equal(manifest.id, "mindmap-studio");
  assert.equal(manifest.name, "MindMap Studio");
  assert.equal(manifest.version, "1.2.0");

  console.log("All MindMap Studio tests passed.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
