import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { strFromU8, unzipSync } from "fflate";

let tempDir;
let exporter;
let model;
let viewSource;
let exportSource;

/** OOXML 包中固定存在的部件，顺序必须与写出顺序一致。 */
const DOCX_PARTS = [
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
  "word/styles.xml",
  "word/_rels/document.xml.rels"
];

before(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "mindmap-docx-export-"));
  const exportOut = join(tempDir, "import-export.cjs");
  const modelOut = join(tempDir, "model.cjs");
  await Promise.all([
    build({ entryPoints: ["src/import/import-export.ts"], outfile: exportOut, bundle: true, platform: "node", format: "cjs", logLevel: "silent" }),
    build({ entryPoints: ["src/core/model.ts"], outfile: modelOut, bundle: true, platform: "node", format: "cjs", logLevel: "silent" })
  ]);
  const require = createRequire(import.meta.url);
  exporter = require(exportOut);
  model = require(modelOut);
  [viewSource, exportSource] = await Promise.all([
    readFile("src/view.ts", "utf8"),
    readFile("src/import/import-export.ts", "utf8")
  ]);
});

after(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

/** 构造一个节点数可控的文章族章节，用于覆盖单批与多批压缩路径。 */
function terminalParagraphDocument(nodeCount) {
  const document = model.createDefaultDocument("大文章");
  const section = model.createNode("第一章 大章节");
  section.children = Array.from({ length: nodeCount }, (_, index) => model.createNode(`正文段落 ${index + 1}`));
  document.root.children = [section];
  return document;
}

test("DOCX export resolves asynchronously instead of blocking the caller", async () => {
  const pending = exporter.readingSectionsToDocx([{ filePath: "root.mindmap", document: terminalParagraphDocument(4), baseDepth: 0 }]);
  assert.ok(pending instanceof Promise, "DOCX 打包必须让出主线程，导出入口应为异步契约");
  const bytes = await pending;
  assert.ok(bytes instanceof Uint8Array, "异步 DOCX 导出仍必须返回完整归档字节");
  assert.ok(bytes.length > 0);
});

test("DOCX export keeps the same OOXML parts as the previous synchronous writer", async () => {
  const bytes = await exporter.readingSectionsToDocx([{ filePath: "root.mindmap", document: terminalParagraphDocument(6), baseDepth: 0 }]);
  const parts = unzipSync(bytes);
  assert.deepEqual(Object.keys(parts), DOCX_PARTS, "文档部件与写入顺序不能因换成流式压缩而改变");
  const xml = strFromU8(parts["word/document.xml"]);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8" standalone="yes"\?><w:document /);
  assert.ok(xml.endsWith("</w:document>"), "document.xml 必须完整闭合");
  assert.match(xml, /<w:p><w:pPr><\/w:pPr><w:r><w:t xml:space="preserve">正文段落 6<\/w:t>/, "末端节点仍必须导出为普通 Word 段落");
  assert.ok(parts["word/styles.xml"].length > 0 && parts["_rels/.rels"].length > 0);
});

test("multi-chunk DOCX packaging preserves every paragraph in order byte for byte", async () => {
  const nodeCount = 5000;
  const document = terminalParagraphDocument(nodeCount);
  const bytes = await exporter.readingSectionsToDocx([{ filePath: "root.mindmap", document, baseDepth: 0 }]);
  const xmlBytes = unzipSync(bytes)["word/document.xml"];
  assert.ok(
    xmlBytes.length > 256 * 1024,
    "该用例必须真正跨越多个 256 KiB 压缩批次，否则无法覆盖分块写出路径"
  );
  const xml = strFromU8(xmlBytes);
  const texts = Array.from(xml.matchAll(/<w:t xml:space="preserve">([^<]*)<\/w:t>/g), (match) => match[1]);
  const paragraphs = texts.filter((text) => text.startsWith("正文段落 "));
  assert.equal(paragraphs.length, nodeCount, "分块压缩不得丢失或重复任何段落");
  const expected = Array.from({ length: nodeCount }, (_, index) => `正文段落 ${index + 1}`);
  assert.deepEqual(paragraphs, expected, "跨批次的段落顺序必须与节点顺序完全一致");
  assert.ok(xml.endsWith("</w:document>"), "多批次写出后 document.xml 仍必须完整闭合");
});

test("DOCX export builds each section's node info once and still links child maps from the TOC", async () => {
  const parent = model.createDefaultDocument("课程");
  const chapter = model.createNode("速算技巧");
  chapter.submap = { path: "速算.mindmap", title: "速算技巧" };
  const sectionA = model.createNode("章节 A");
  sectionA.children = [model.createNode("A-1"), model.createNode("A-2")];
  const sectionB = model.createNode("章节 B");
  sectionB.children = [model.createNode("B-1")];
  parent.root.children = [chapter, sectionA, sectionB];
  const child = model.createDefaultDocument("速算技巧");
  const childSection = model.createNode("子图章节 C");
  childSection.children = [model.createNode("C-1")];
  child.root.children = [childSection, model.createNode("百化分")];
  const bytes = await exporter.readingSectionsToDocx([
    { filePath: "课程.mindmap", document: parent, baseDepth: 0 },
    { filePath: "速算.mindmap", document: child, baseDepth: 1, parentFilePath: "课程.mindmap", parentNodeId: chapter.id }
  ]);
  const xml = strFromU8(unzipSync(bytes)["word/document.xml"]);
  const hyperlinks = Array.from(xml.matchAll(/<w:hyperlink w:anchor="([^"]+)"/g), (match) => match[1]);
  const bookmarks = Array.from(xml.matchAll(/<w:bookmarkStart w:id="\d+" w:name="([^"]+)"/g), (match) => match[1]);
  assert.equal(hyperlinks.length, 4, "目录必须收录三个父级章节与跨文件子图章节，共四项");
  assert.ok(
    hyperlinks.every((anchor) => bookmarks.includes(anchor)),
    "复用预建节点信息后，每个目录超链接仍必须指向真实存在的书签"
  );
  assert.match(xml, /子图章节 C/, "跨文件挂载章节的子章节仍必须出现在导出正文中");
});

test("large DOCX export yields to the event loop instead of finishing synchronously", async () => {
  const document = terminalParagraphDocument(6000);
  let settled = false;
  const pending = exporter.readingSectionsToDocx([{ filePath: "root.mindmap", document, baseDepth: 0 }]).then((bytes) => {
    settled = true;
    return bytes;
  });
  await Promise.resolve();
  assert.equal(settled, false, "大型导出必须在批次之间让出主线程，而不是一次同步跑完");
  const bytes = await pending;
  assert.ok(unzipSync(bytes)["word/document.xml"].length > 256 * 1024);
});

test("DOCX export contract stays async and chunked on both sides of the boundary", () => {
  assert.match(exportSource, /export async function readingSectionsToDocx\(sections: ReadingSection\[\], tocMaxDepth = 3, options: ArticleExportOptions = \{\}\): Promise<Uint8Array<ArrayBuffer>>/);
  assert.match(exportSource, /const EXPORT_ZIP_CHUNK_BYTES = 256 \* 1024;/);
  assert.match(exportSource, /const archive = new Zip\(\(error, chunk\) =>/);
  assert.match(exportSource, /const file = new ZipDeflate\(entry\.name\);/);
  assert.match(exportSource, /file\.push\(content\.subarray\(offset, end\), end >= content\.length\)/);
  assert.match(exportSource, /if \(end < content\.length\) await yieldToMainThread\(\);/);
  assert.match(exportSource, /archive\.end\(\);/);
  assert.doesNotMatch(exportSource, /(?:^|[^A-Za-z])zipSync\(/, "同步 zipSync 打包必须完全移除（unzipSync 仍用于只读校验归档上限）");
  assert.match(exportSource, /const EXPORT_ARTICLE_INFO_CHUNK_ITEMS = 2000;/);
  assert.match(exportSource, /const EXPORT_BODY_CHUNK_PARAGRAPHS = 2000;/);
  assert.match(exportSource, /for \(const info of iterateArticleNodeInfo\(/);
  assert.match(exportSource, /if \(sinceYield >= EXPORT_ARTICLE_INFO_CHUNK_ITEMS\) \{\s*sinceYield = 0;\s*await yieldToMainThread\(\);/);
  assert.match(exportSource, /if \(bodySinceYield >= EXPORT_BODY_CHUNK_PARAGRAPHS\) \{\s*bodySinceYield = 0;\s*await yieldToMainThread\(\);/);
  assert.match(exportSource, /const sectionInfos: ArticleNodeInfo\[\]\[\] = \[\];/);
  assert.match(exportSource, /if \(index < sections\.length - 1\) await yieldToMainThread\(\);/);
  assert.match(exportSource, /collectExportTocItems\(sections, maxTocDepth, false, options, sectionInfos\)/);
  assert.match(exportSource, /for \(const info of sectionInfos\[sectionIndex\] \?\? \[\]\)/);
  assert.match(exportSource, /const infos = prebuiltInfos\?\.\[sectionIndex\]/);
  assert.match(viewSource, /const docx = await readingSectionsToDocx\(sections, tocMaxDepth, articleExportOptions\)/);
  assert.match(viewSource, /await this\.exportBinaryFile\("docx", docx\)/);
});
