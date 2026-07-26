"use strict";
/**
* @file model.ts
* @description 核心领域模型与序列化层。
*
* 定义 .mindmap 稳定数据结构，并负责旧版本兼容、字段规范化、富文本、内容块、节点树、Markdown 导入导出及图片镜像候选源排序。
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINDMAP_CODE_BLOCK = exports.walkNodes = exports.removeNode = exports.moveNodeRelative = exports.flattenNodes = exports.findParent = exports.findNode = exports.findAncestors = exports.containsNode = void 0;
exports.newId = newId;
exports.createNode = createNode;
exports.createDefaultDocument = createDefaultDocument;
exports.mergeAppearance = mergeAppearance;
exports.normalizeRichText = normalizeRichText;
exports.richTextPlainText = richTextPlainText;
exports.richTextCharacterStyles = richTextCharacterStyles;
exports.characterStylesToRichText = characterStylesToRichText;
exports.reconcileRichTextAfterEdit = reconcileRichTextAfterEdit;
exports.applyRichTextStyleRange = applyRichTextStyleRange;
exports.imageSourceCandidates = imageSourceCandidates;
exports.nodeContentBlocks = nodeContentBlocks;
exports.nodePlainText = nodePlainText;
exports.nodePrimaryText = nodePrimaryText;
exports.syncNodeLegacyFields = syncNodeLegacyFields;
exports.normalizeDocument = normalizeDocument;
exports.serializeDocument = serializeDocument;
exports.parseDocument = parseDocument;
exports.cloneDocument = cloneDocument;
exports.cloneNodeWithFreshIds = cloneNodeWithFreshIds;
exports.collectWikiLinks = collectWikiLinks;
exports.extractFirstWikiLink = extractFirstWikiLink;
exports.getTaskProgress = getTaskProgress;
exports.nodeSearchText = nodeSearchText;
exports.richTextToMarkdown = richTextToMarkdown;
exports.tableToMarkdown = tableToMarkdown;
exports.parseMarkdownTable = parseMarkdownTable;
exports.parseFencedCode = parseFencedCode;
exports.childrenToTable = childrenToTable;
exports.documentToMarkdown = documentToMarkdown;
exports.markdownToDocument = markdownToDocument;
exports.indentedTextToMarkdown = indentedTextToMarkdown;
const node_tree_1 = require("./node-tree");
var node_tree_2 = require("./node-tree");
Object.defineProperty(exports, "containsNode", { enumerable: true, get: function () { return node_tree_2.containsNode; } });
Object.defineProperty(exports, "findAncestors", { enumerable: true, get: function () { return node_tree_2.findAncestors; } });
Object.defineProperty(exports, "findNode", { enumerable: true, get: function () { return node_tree_2.findNode; } });
Object.defineProperty(exports, "findParent", { enumerable: true, get: function () { return node_tree_2.findParent; } });
Object.defineProperty(exports, "flattenNodes", { enumerable: true, get: function () { return node_tree_2.flattenNodes; } });
Object.defineProperty(exports, "moveNodeRelative", { enumerable: true, get: function () { return node_tree_2.moveNodeRelative; } });
Object.defineProperty(exports, "removeNode", { enumerable: true, get: function () { return node_tree_2.removeNode; } });
Object.defineProperty(exports, "walkNodes", { enumerable: true, get: function () { return node_tree_2.walkNodes; } });
exports.MINDMAP_CODE_BLOCK = "mindmap-json";
const LEGACY_CODE_BLOCKS = ["smm-json", "mmc-json"];
/**
 * 执行“new id”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function newId() {
    const random = Math.random().toString(36).slice(2, 9);
    return `n_${Date.now().toString(36)}_${random}`;
}
/**
 * 创建node，并保持模型、界面和持久化状态的一致性。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function createNode(text = "新节点") {
    return { id: newId(), text, children: [] };
}
/**
 * 创建default document，并保持模型、界面和持久化状态的一致性。
 *
 * @param title 文档、节点或导出文件的显示标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function createDefaultDocument(title = "新思维导图") {
    return {
        version: 10,
        title,
        layout: "right",
        theme: "auto",
        root: {
            id: newId(),
            text: title,
            children: [
                { id: newId(), text: "主题 1", children: [] },
                { id: newId(), text: "主题 2", children: [] }
            ]
        }
    };
}
/**
 * 校验并规范化color，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalizeColor(value) {
    if (typeof value !== "string")
        return undefined;
    const trimmed = value.trim();
    return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : undefined;
}
/**
 * 校验并规范化number，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @param min 该参数用于 normalize number 流程中的输入或控制。
 * @param max 该参数用于 normalize number 流程中的输入或控制。
 * @returns 计算得到的数值结果。
 */
function normalizeNumber(value, min, max) {
    if (typeof value !== "number" || !Number.isFinite(value))
        return undefined;
    return Math.min(max, Math.max(min, value));
}
/**
 * 校验并规范化boolean override，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeBooleanOverride(value) {
    return typeof value === "boolean" ? value : undefined;
}
/**
 * 校验并规范化appearance，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeAppearance(input) {
    if (!input)
        return undefined;
    const rawNodeVisualStyle = String(input.nodeVisualStyle ?? "");
    const legacyBranchStyle = ["x", "mind"].join("");
    const backgroundPattern = input.backgroundPattern === "none" || input.backgroundPattern === "grid" || input.backgroundPattern === "dots"
        ? input.backgroundPattern
        : undefined;
    const fontFamily = input.fontFamily === "obsidian" || input.fontFamily === "sans" || input.fontFamily === "serif" || input.fontFamily === "mono" || input.fontFamily === "custom"
        ? input.fontFamily
        : undefined;
    const edgeStyle = input.edgeStyle === "curved" || input.edgeStyle === "straight" || input.edgeStyle === "elbow"
        ? input.edgeStyle
        : undefined;
    const edgeWidthMode = input.edgeWidthMode === "uniform" || input.edgeWidthMode === "tapered"
        ? input.edgeWidthMode
        : undefined;
    const themePreset = [
        "classic-indigo", "ocean-blue", "forest-green", "sunset-orange", "lavender-dream",
        "candy-pop", "paper-note", "minimal-ink", "dark-neon", "mint-clean",
        "spectrum-flow", "executive-navy", "botanical-calm", "midnight-signal", "sketchbook-warm", "monochrome-air"
    ].includes(String(input.themePreset)) ? input.themePreset : undefined;
    const branchColors = Array.isArray(input.branchColors)
        ? input.branchColors.map(normalizeColor).filter((color) => Boolean(color)).slice(0, 12)
        : undefined;
    const customFont = typeof input.customFont === "string" && input.customFont.trim()
        ? input.customFont.trim().slice(0, 120)
        : undefined;
    const appearance = {
        nodeVisualStyle: rawNodeVisualStyle === "card"
            ? "card"
            : rawNodeVisualStyle === "branch" || rawNodeVisualStyle === legacyBranchStyle || rawNodeVisualStyle === "compact"
                ? "branch"
                : undefined,
        nodeWidthMode: input.nodeWidthMode === "fixed" || input.nodeWidthMode === "auto" ? input.nodeWidthMode : undefined,
        defaultNodeWidth: normalizeNumber(input.defaultNodeWidth, 100, 900),
        autoNodeMaxWidth: normalizeNumber(input.autoNodeMaxWidth, 120, 900),
        themePreset,
        backgroundColor: normalizeColor(input.backgroundColor),
        backgroundPattern,
        patternColor: normalizeColor(input.patternColor),
        fontFamily,
        customFont,
        fontSize: normalizeNumber(input.fontSize, 10, 30),
        edgeColor: normalizeColor(input.edgeColor),
        edgeWidth: normalizeNumber(input.edgeWidth, 0.5, 8),
        edgeStyle,
        edgeWidthMode,
        edgeMinWidth: normalizeNumber(input.edgeMinWidth, 0.25, 8),
        rootColor: normalizeColor(input.rootColor),
        rootTextColor: normalizeColor(input.rootTextColor),
        colorfulBranches: normalizeBooleanOverride(input.colorfulBranches),
        branchColors: branchColors?.length ? branchColors : undefined,
        nodeColor: normalizeColor(input.nodeColor),
        textColor: normalizeColor(input.textColor),
        nodeBorderColor: normalizeColor(input.nodeBorderColor),
        nodeBorderWidth: normalizeNumber(input.nodeBorderWidth, 0, 6),
        nodeTextAlign: input.nodeTextAlign === "left" || input.nodeTextAlign === "right" || input.nodeTextAlign === "center" ? input.nodeTextAlign : undefined,
        bold: normalizeBooleanOverride(input.bold),
        italic: normalizeBooleanOverride(input.italic),
        underline: normalizeBooleanOverride(input.underline)
    };
    return Object.values(appearance).some((value) => value !== undefined) ? appearance : undefined;
}
/**
 * 合并appearance，并保持模型、界面和持久化状态的一致性。
 *
 * @param base 被覆盖或合并的基础配置。
 * @param override 覆盖基础配置的可选字段。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function mergeAppearance(base, override) {
    return { ...(base ?? {}), ...(override ?? {}) };
}
/**
 * 校验并规范化style，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeStyle(input) {
    if (!input)
        return undefined;
    const shape = input.shape === "pill" || input.shape === "rectangle" || input.shape === "rounded"
        ? input.shape
        : undefined;
    const style = {
        color: normalizeColor(input.color),
        textColor: normalizeColor(input.textColor),
        borderColor: normalizeColor(input.borderColor),
        borderWidth: normalizeNumber(input.borderWidth, 0, 6),
        shape,
        bold: normalizeBooleanOverride(input.bold),
        italic: normalizeBooleanOverride(input.italic),
        underline: normalizeBooleanOverride(input.underline),
        fontSize: normalizeNumber(input.fontSize, 10, 32),
        textAlign: input.textAlign === "left" || input.textAlign === "right" || input.textAlign === "center" ? input.textAlign : undefined,
        width: normalizeNumber(input.width, 100, 900),
        minHeight: normalizeNumber(input.minHeight, 36, 600)
    };
    return Object.values(style).some((value) => value !== undefined) ? style : undefined;
}
/**
 * 校验并规范化text style，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeTextStyle(input) {
    if (!input)
        return undefined;
    const style = {
        bold: normalizeBooleanOverride(input.bold),
        italic: normalizeBooleanOverride(input.italic),
        underline: normalizeBooleanOverride(input.underline),
        strike: normalizeBooleanOverride(input.strike),
        color: normalizeColor(input.color)
    };
    return Object.values(style).some((value) => value !== undefined) ? style : undefined;
}
/**
 * 执行“text style key”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param style 要应用、比较或规范化的样式。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function textStyleKey(style) {
    return JSON.stringify(style ?? {});
}
/**
 * 校验并规范化rich text，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @param fallbackText 该参数用于 normalize rich text 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
function normalizeRichText(input, fallbackText = "") {
    if (!Array.isArray(input))
        return undefined;
    const runs = [];
    for (const raw of input.slice(0, 500)) {
        if (!raw || typeof raw !== "object")
            continue;
        const candidate = raw;
        if (typeof candidate.text !== "string" || !candidate.text)
            continue;
        const text = candidate.text.replace(/\r\n?/g, "\n").slice(0, 10000);
        if (!text)
            continue;
        const style = normalizeTextStyle(candidate.style);
        const previous = runs.at(-1);
        if (previous && textStyleKey(previous.style) === textStyleKey(style))
            previous.text += text;
        else
            runs.push({ text, style });
    }
    if (!runs.length)
        return undefined;
    const combined = runs.map((run) => run.text).join("");
    const leading = combined.length - combined.trimStart().length;
    const trailing = combined.length - combined.trimEnd().length;
    if (leading || trailing) {
        let start = leading;
        let remaining = combined.length - leading - trailing;
        const trimmed = [];
        for (const run of runs) {
            if (remaining <= 0)
                break;
            const skip = Math.min(start, run.text.length);
            start -= skip;
            const available = run.text.length - skip;
            if (available <= 0)
                continue;
            const take = Math.min(available, remaining);
            const text = run.text.slice(skip, skip + take);
            remaining -= take;
            if (text)
                trimmed.push({ text, style: run.style });
        }
        runs.splice(0, runs.length, ...trimmed);
    }
    if (!runs.length)
        return fallbackText.trim() ? [{ text: fallbackText.trim() }] : undefined;
    return runs.some((run) => run.style && Object.values(run.style).some((value) => value !== undefined)) ? runs : undefined;
}
/**
 * 执行“rich text plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 该参数用于 rich text plain text 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function richTextPlainText(runs, fallbackText = "") {
    return runs?.map((run) => run.text).join("") ?? fallbackText;
}
/**
 * 执行“rich text character styles”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 该参数用于 rich text character styles 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
function richTextCharacterStyles(runs, fallbackText = "") {
    const text = richTextPlainText(runs, fallbackText);
    const styles = Array.from({ length: text.length }, () => ({}));
    if (!runs?.length)
        return styles;
    let offset = 0;
    for (const run of runs) {
        const style = run.style ? { ...run.style } : {};
        const end = Math.min(text.length, offset + run.text.length);
        for (let index = offset; index < end; index += 1)
            styles[index] = { ...style };
        offset = end;
    }
    return styles;
}
/**
 * 执行“character styles to rich text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @param styles 该参数用于 character styles to rich text 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
function characterStylesToRichText(text, styles) {
    if (!text)
        return undefined;
    const runs = [];
    let start = 0;
    let current = normalizeTextStyle(styles[0]);
    for (let index = 1; index <= text.length; index += 1) {
        const next = index < text.length ? normalizeTextStyle(styles[index]) : undefined;
        if (index < text.length && textStyleKey(current) === textStyleKey(next))
            continue;
        const segment = text.slice(start, index);
        if (segment)
            runs.push({ text: segment, style: current });
        start = index;
        current = next;
    }
    return normalizeRichText(runs, text);
}
/**
 * 在纯文本被编辑后，尽可能保留原字符位置附近的富文本样式。它通过公共前缀和后缀映射样式，新增字符继承邻近样式，删除字符则自动丢弃对应区间。
 *
 * @param previousText 该参数用于 reconcile rich text after edit 流程中的输入或控制。
 * @param previousRuns 该参数用于 reconcile rich text after edit 流程中的输入或控制。
 * @param nextText 该参数用于 reconcile rich text after edit 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function reconcileRichTextAfterEdit(previousText, previousRuns, nextText) {
    if (previousText === nextText)
        return normalizeRichText(previousRuns, nextText);
    const previousStyles = richTextCharacterStyles(previousRuns, previousText);
    const nextStyles = Array.from({ length: nextText.length }, () => ({}));
    let prefix = 0;
    while (prefix < previousText.length && prefix < nextText.length && previousText[prefix] === nextText[prefix])
        prefix += 1;
    let suffix = 0;
    while (suffix < previousText.length - prefix
        && suffix < nextText.length - prefix
        && previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix])
        suffix += 1;
    for (let index = 0; index < prefix; index += 1)
        nextStyles[index] = { ...(previousStyles[index] ?? {}) };
    for (let index = 0; index < suffix; index += 1) {
        const previousIndex = previousText.length - suffix + index;
        const nextIndex = nextText.length - suffix + index;
        nextStyles[nextIndex] = { ...(previousStyles[previousIndex] ?? {}) };
    }
    return characterStylesToRichText(nextText, nextStyles);
}
/**
 * 对字符半开区间应用或取消指定富文本样式，并重新合并连续、样式相同的文本段，避免产生大量碎片化运行段。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @param runs 按字符样式拆分的富文本运行段。
 * @param start 该参数用于 apply rich text style range 流程中的输入或控制。
 * @param end 该参数用于 apply rich text style range 流程中的输入或控制。
 * @param patch 该参数用于 apply rich text style range 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function applyRichTextStyleRange(text, runs, start, end, patch) {
    const safeStart = Math.max(0, Math.min(text.length, Math.floor(start)));
    const safeEnd = Math.max(safeStart, Math.min(text.length, Math.floor(end)));
    if (safeStart === safeEnd)
        return normalizeRichText(runs, text);
    const styles = richTextCharacterStyles(runs, text);
    for (let index = safeStart; index < safeEnd; index += 1) {
        if (patch === null)
            styles[index] = {};
        else
            styles[index] = { ...styles[index], ...patch };
    }
    return characterStylesToRichText(text, styles);
}
/**
 * 校验并规范化content block，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeContentBlock(input) {
    if (!input || typeof input !== "object")
        return null;
    const candidate = input;
    const id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : newId();
    if (candidate.type === "image") {
        const image = candidate;
        const source = typeof image.source === "string" ? image.source.trim().slice(0, 2000) : "";
        if (!source)
            return null;
        const alt = typeof image.alt === "string" && image.alt.trim() ? image.alt.trim().slice(0, 500) : undefined;
        const localSource = typeof image.localSource === "string" && image.localSource.trim()
            ? image.localSource.trim().slice(0, 2000)
            : undefined;
        const remoteSources = Array.isArray(image.remoteSources)
            ? image.remoteSources.slice(0, 12).flatMap((raw) => {
                if (!raw || typeof raw !== "object")
                    return [];
                const item = raw;
                const hostId = typeof item.hostId === "string" ? item.hostId.trim().slice(0, 160) : "";
                const url = typeof item.url === "string" ? item.url.trim().slice(0, 4000) : "";
                if (!hostId || !/^https?:\/\//i.test(url))
                    return [];
                return [{
                        hostId,
                        hostName: typeof item.hostName === "string" && item.hostName.trim() ? item.hostName.trim().slice(0, 200) : undefined,
                        url,
                        uploadedAt: typeof item.uploadedAt === "string" && item.uploadedAt.trim() ? item.uploadedAt.trim().slice(0, 80) : undefined,
                        lastSuccessAt: typeof item.lastSuccessAt === "string" && item.lastSuccessAt.trim() ? item.lastSuccessAt.trim().slice(0, 80) : undefined,
                        lastFailureAt: typeof item.lastFailureAt === "string" && item.lastFailureAt.trim() ? item.lastFailureAt.trim().slice(0, 80) : undefined,
                        failureCount: typeof item.failureCount === "number" && Number.isFinite(item.failureCount)
                            ? Math.max(0, Math.min(1000000, Math.floor(item.failureCount)))
                            : undefined
                    }];
            })
            : undefined;
        return { id, type: "image", source, alt, localSource, remoteSources: remoteSources?.length ? remoteSources : undefined };
    }
    if (candidate.type === "text") {
        const fallbackText = typeof candidate.text === "string" ? candidate.text.replace(/\r\n?/g, "\n").slice(0, 20000) : "";
        const richText = normalizeRichText(candidate.richText, fallbackText);
        const text = richTextPlainText(richText, fallbackText);
        return { id, type: "text", text, richText };
    }
    return null;
}
/**
 * 为图片内容块构建有序、去重的加载候选列表。顺序从当前地址开始轮转到其他远程镜像，最后按设置选择本地地址，从而支持失效图床自动切换。
 *
 * @param block 当前内容块，通常是文字块或图片块。
 * @param includeLocal 是否把本地图片地址作为最终回退候选。
 * @returns 按当前规则构建的集合结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function imageSourceCandidates(block, includeLocal = true) {
    const candidates = [];
    const seen = new Set();
    const add = (candidate) => {
        const source = candidate.source.trim();
        if (!source || seen.has(source))
            return;
        seen.add(source);
        candidates.push({ ...candidate, source });
    };
    const currentRemote = block.remoteSources?.find((item) => item.url === block.source);
    add({
        source: block.source,
        label: currentRemote?.hostName || (currentRemote ? "当前图床" : "当前图片"),
        hostId: currentRemote?.hostId,
        hostName: currentRemote?.hostName,
        kind: "current"
    });
    const remotes = block.remoteSources ?? [];
    const currentIndex = remotes.findIndex((item) => item.url === block.source);
    const orderedRemotes = currentIndex >= 0
        ? [...remotes.slice(currentIndex + 1), ...remotes.slice(0, currentIndex)]
        : remotes;
    for (const remote of orderedRemotes) {
        add({
            source: remote.url,
            label: remote.hostName || "备用图床",
            hostId: remote.hostId,
            hostName: remote.hostName,
            kind: "remote"
        });
    }
    if (includeLocal && block.localSource) {
        add({ source: block.localSource, label: "本地副本", kind: "local" });
    }
    return candidates;
}
/**
 * 执行“node content blocks”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 按当前规则构建的集合结果。
 */
function nodeContentBlocks(node) {
    if (Array.isArray(node.content) && node.content.length) {
        const normalized = node.content.map(normalizeContentBlock).filter((block) => Boolean(block));
        if (normalized.length)
            return normalized;
    }
    const blocks = [];
    if (node.image?.trim())
        blocks.push({ id: newId(), type: "image", source: node.image.trim(), alt: node.text || undefined });
    if (node.text || node.richText?.length) {
        const richText = normalizeRichText(node.richText, node.text);
        blocks.push({ id: newId(), type: "text", text: richTextPlainText(richText, node.text), richText });
    }
    return blocks;
}
/**
 * 执行“node plain text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function nodePlainText(node) {
    const blocks = nodeContentBlocks(node);
    return blocks.filter((block) => block.type === "text").map((block) => block.text).join(" ").trim();
}
/**
 * 执行“node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function nodePrimaryText(node) {
    const first = nodeContentBlocks(node).find((block) => block.type === "text");
    return first?.text.trim() ?? "";
}
/**
 * 将新的有序 content 内容块同步回 text、richText 和 image 等旧字段。该桥接保证旧版本插件、旧导出逻辑和新内容块模型能够同时工作。
 *
 * @param node 当前处理的节点。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function syncNodeLegacyFields(node) {
    const blocks = nodeContentBlocks(node);
    node.content = blocks.length ? blocks : undefined;
    const textBlocks = blocks.filter((block) => block.type === "text");
    const imageBlocks = blocks.filter((block) => block.type === "image");
    node.text = textBlocks.map((block) => block.text).join(" ").trim();
    node.richText = textBlocks.length === 1 ? normalizeRichText(textBlocks[0]?.richText, textBlocks[0]?.text ?? "") : undefined;
    node.image = imageBlocks[0]?.source;
}
/**
 * 校验并规范化cell，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalizeCell(value) {
    return typeof value === "string" ? value.trim().slice(0, 2000) : String(value ?? "").trim().slice(0, 2000);
}
/**
 * 校验并规范化table，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeTable(input) {
    if (!input || !Array.isArray(input.headers))
        return undefined;
    const headers = input.headers.map(normalizeCell).slice(0, 12);
    if (!headers.length)
        return undefined;
    const rows = Array.isArray(input.rows)
        ? input.rows.slice(0, 100).map((row) => {
            const values = Array.isArray(row) ? row.map(normalizeCell).slice(0, headers.length) : [];
            while (values.length < headers.length)
                values.push("");
            return values;
        })
        : [];
    const alignments = Array.isArray(input.alignments)
        ? input.alignments.slice(0, headers.length).map((value) => value === "center" || value === "right" ? value : "left")
        : undefined;
    const source = input.source === "markdown" || input.source === "children" ? input.source : "manual";
    return { headers, rows, alignments, source };
}
/**
 * 校验并规范化code，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeCode(input) {
    if (!input || typeof input.code !== "string" || !input.code.trim())
        return undefined;
    const language = typeof input.language === "string" && input.language.trim()
        ? input.language.trim().replace(/[^a-z0-9_+#.-]/gi, "").slice(0, 40)
        : undefined;
    return { language, code: input.code.replace(/\r\n/g, "\n").slice(0, 100000) };
}
/**
 * 校验并规范化submap，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeSubmap(input) {
    if (!input || typeof input.path !== "string" || !input.path.trim())
        return undefined;
    return {
        path: input.path.trim().slice(0, 500),
        title: typeof input.title === "string" && input.title.trim() ? input.title.trim().slice(0, 200) : undefined
    };
}
/**
 * 校验并规范化navigation，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeNavigation(input) {
    if (!input || typeof input.parentPath !== "string" || !input.parentPath.trim())
        return undefined;
    return {
        parentPath: input.parentPath.trim().slice(0, 500),
        parentNodeId: typeof input.parentNodeId === "string" && input.parentNodeId.trim() ? input.parentNodeId.trim().slice(0, 160) : undefined,
        parentTitle: typeof input.parentTitle === "string" && input.parentTitle.trim() ? input.parentTitle.trim().slice(0, 200) : undefined,
        parentNodeText: typeof input.parentNodeText === "string" && input.parentNodeText.trim() ? input.parentNodeText.trim().slice(0, 200) : undefined
    };
}
/**
 * 校验并规范化task，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeTask(value) {
    return value === "todo" || value === "doing" || value === "done" ? value : undefined;
}
/**
 * 校验并规范化tags，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalizeTags(value) {
    if (!Array.isArray(value))
        return undefined;
    const tags = Array.from(new Set(value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim().replace(/^#/, ""))
        .filter(Boolean)))
        .slice(0, 12);
    return tags.length ? tags : undefined;
}
/**
 * 校验并规范化node，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @param fallbackText 该参数用于 normalize node 流程中的输入或控制。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeNode(input, fallbackText) {
    const fallbackNodeText = typeof input?.text === "string" ? input.text : fallbackText;
    const normalizedContent = Array.isArray(input?.content)
        ? input.content.map(normalizeContentBlock).filter((block) => Boolean(block))
        : [];
    if (!normalizedContent.length) {
        if (typeof input?.image === "string" && input.image.trim()) {
            normalizedContent.push({ id: newId(), type: "image", source: input.image.trim(), alt: fallbackNodeText || undefined });
        }
        const richText = normalizeRichText(input?.richText, fallbackNodeText);
        const text = richTextPlainText(richText, fallbackNodeText);
        if (text)
            normalizedContent.push({ id: newId(), type: "text", text, richText });
    }
    const textBlocks = normalizedContent.filter((block) => block.type === "text");
    const imageBlocks = normalizedContent.filter((block) => block.type === "image");
    const text = textBlocks.map((block) => block.text).join(" ").trim();
    const requestedNumberingMode = input?.articleNumberingMode;
    const articleNumberingMode = requestedNumberingMode === "manual" || requestedNumberingMode === "none"
        ? requestedNumberingMode
        : input?.skipArticleNumbering === true ? "none" : undefined;
    const articleNumberingLevel = articleNumberingMode === "manual" && Number.isFinite(input?.articleNumberingLevel)
        ? Math.min(8, Math.max(1, Math.floor(input?.articleNumberingLevel ?? 1)))
        : undefined;
    return {
        id: typeof input?.id === "string" && input.id ? input.id : newId(),
        text,
        richText: textBlocks.length === 1 ? textBlocks[0]?.richText : undefined,
        content: normalizedContent.length ? normalizedContent : undefined,
        note: typeof input?.note === "string" && input.note.trim() ? input.note.trim() : undefined,
        link: typeof input?.link === "string" && input.link.trim() ? input.link.trim() : undefined,
        image: imageBlocks[0]?.source,
        table: normalizeTable(input?.table),
        code: normalizeCode(input?.code),
        submap: normalizeSubmap(input?.submap),
        icon: typeof input?.icon === "string" && input.icon.trim() ? input.icon.trim().slice(0, 12) : undefined,
        tags: normalizeTags(input?.tags),
        task: normalizeTask(input?.task),
        articleNumberingMode,
        articleNumberingLevel,
        skipArticleNumbering: articleNumberingMode === "none" || undefined,
        style: normalizeStyle(input?.style),
        collapsed: input?.collapsed === true || undefined,
        children: Array.isArray(input?.children)
            ? input.children.map((child, index) => normalizeNode(child, `节点 ${index + 1}`))
            : []
    };
}
/**
 * 校验并规范化document view，并保持模型、界面和持久化状态的一致性。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function normalizeDocumentView(input) {
    if (!input)
        return undefined;
    const mode = input.mode === "outline" || input.mode === "article" || input.mode === "mindmap"
        ? input.mode
        : undefined;
    const readOnly = input.readOnly === true ? true : input.readOnly === false ? false : undefined;
    const articleLandingMode = input.articleLandingMode === "toc"
        ? "toc"
        : input.articleLandingMode === "article" || input.articleLandingMode === "map"
            ? "article"
            : undefined;
    const articleTocMaxDepth = typeof input.articleTocMaxDepth === "number" && Number.isFinite(input.articleTocMaxDepth)
        ? Math.max(1, Math.min(8, Math.round(input.articleTocMaxDepth)))
        : undefined;
    const zoom = typeof input.zoom === "number" ? Math.min(2.5, Math.max(0.2, input.zoom)) : undefined;
    const panX = typeof input.panX === "number" && Number.isFinite(input.panX) ? input.panX : undefined;
    const panY = typeof input.panY === "number" && Number.isFinite(input.panY) ? input.panY : undefined;
    return mode !== undefined || readOnly !== undefined || articleLandingMode !== undefined || articleTocMaxDepth !== undefined || zoom !== undefined || panX !== undefined || panY !== undefined
        ? { mode, readOnly, articleLandingMode, articleTocMaxDepth, zoom, panX, panY }
        : undefined;
}
/**
 * Normalizes per-document article presentation settings.
 *
 * @param input Untrusted serialized style data.
 * @returns A safe article style, or undefined when none is present.
 */
function normalizeArticleStyle(input) {
    if (!input)
        return undefined;
    const preset = input.preset === "book" || input.preset === "modern" || input.preset === "minimal"
        ? input.preset
        : "classic";
    const color = (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
    const tocStyle = input.tocStyle === "plain" || input.tocStyle === "lines" ? input.tocStyle : input.tocStyle === "card" ? "card" : undefined;
    const fontSize = typeof input.fontSize === "number" ? Math.max(12, Math.min(24, input.fontSize)) : undefined;
    const lineHeight = typeof input.lineHeight === "number" ? Math.max(1.2, Math.min(2.4, input.lineHeight)) : undefined;
    return {
        preset,
        fontFamily: typeof input.fontFamily === "string" ? input.fontFamily.trim().slice(0, 120) || undefined : undefined,
        textColor: color(input.textColor),
        headingColor: color(input.headingColor),
        accentColor: color(input.accentColor),
        backgroundColor: color(input.backgroundColor),
        tocStyle,
        fontSize,
        lineHeight
    };
}
/**
 * 把任意版本或不完整的输入对象转换为当前版本的 MindMapDocument。该函数会递归规范化节点、外观、视图状态和兼容字段，并保证根节点、数组及必需标识始终存在。
 *
 * @param input 可能来自磁盘、剪贴板或旧版本的不可信输入。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function normalizeDocument(input, fallbackTitle = "思维导图") {
    const title = typeof input?.title === "string" && input.title.trim() ? input.title.trim() : fallbackTitle;
    return {
        version: 10,
        title,
        layout: input?.layout === "balanced" ? "balanced" : "right",
        theme: input?.theme === "light" || input?.theme === "dark" ? input.theme : "auto",
        appearance: normalizeAppearance(input?.appearance),
        navigation: normalizeNavigation(input?.navigation),
        view: normalizeDocumentView(input?.view),
        articleStyle: normalizeArticleStyle(input?.articleStyle),
        root: normalizeNode(input?.root, title)
    };
}
/**
 * 在保存前再次规范化文档，并输出带缩进的稳定 JSON。这样可移除运行时临时值，同时保留可选兼容字段。
 *
 * @param doc 要处理或写回的思维导图文档。
 * @returns 计算、解析或序列化后的字符串结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function serializeDocument(doc) {
    const normalized = normalizeDocument(doc, doc.title);
    return `${JSON.stringify(normalized, null, 2)}\n`;
}
/**
 * 解析json document，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function parseJsonDocument(value, fallbackTitle) {
    try {
        return normalizeDocument(JSON.parse(value), fallbackTitle);
    }
    catch {
        return null;
    }
}
/**
 * 执行“extract fenced json”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param source 待解析或渲染的原始文本。
 * @param language 该参数用于 extract fenced json 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function extractFencedJson(source, language) {
    const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = source.match(new RegExp("```" + escaped + "\\s*([\\s\\S]*?)```", "i"));
    return match?.[1]?.trim() ?? null;
}
/**
 * 解析磁盘中的 .mindmap 文本。优先识别当前原始 JSON 格式，同时兼容历史 Markdown 围栏 JSON；解析失败时返回包含回退标题的安全默认文档，避免视图崩溃。
 *
 * @param source 待解析或渲染的原始文本。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function parseDocument(source, fallbackTitle = "思维导图") {
    const trimmed = source.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = parseJsonDocument(trimmed, fallbackTitle);
        if (parsed)
            return parsed;
    }
    for (const language of [exports.MINDMAP_CODE_BLOCK, ...LEGACY_CODE_BLOCKS]) {
        const fenced = extractFencedJson(source, language);
        if (!fenced)
            continue;
        const parsed = parseJsonDocument(fenced, fallbackTitle);
        if (parsed)
            return parsed;
    }
    return markdownToDocument(source, fallbackTitle);
}
/**
 * 执行“clone document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param doc 要处理或写回的思维导图文档。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function cloneDocument(doc) {
    return JSON.parse(JSON.stringify(doc));
}
/**
 * 执行“clone node with fresh ids”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function cloneNodeWithFreshIds(node) {
    const clone = JSON.parse(JSON.stringify(node));
    (0, node_tree_1.walkNodes)(clone, (current) => {
        current.id = newId();
    });
    return clone;
}
/**
 * 遍历并收集wiki links，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function collectWikiLinks(root) {
    const links = new Set();
    const pattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
    (0, node_tree_1.walkNodes)(root, (node) => {
        const values = [nodePlainText(node), node.note ?? "", node.link ?? "", ...nodeContentBlocks(node).filter((block) => block.type === "image").map((block) => block.source), node.submap?.path ?? ""];
        for (const value of values) {
            let match;
            while ((match = pattern.exec(value)) !== null) {
                if (match[1])
                    links.add(match[1].trim());
            }
            pattern.lastIndex = 0;
        }
        const explicitLink = node.link?.trim();
        if (explicitLink && !/^https?:\/\//i.test(explicitLink) && !explicitLink.includes("[[")) {
            const target = explicitLink.split("|")[0]?.split("#")[0]?.trim();
            if (target)
                links.add(target);
        }
    });
    return links;
}
/**
 * 执行“extract first wiki link”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function extractFirstWikiLink(value) {
    const match = value.match(/\[\[([^\]|#]+(?:#[^\]|]+)?)(?:\|[^\]]+)?\]\]/);
    return match?.[1]?.trim() ?? null;
}
/**
 * 读取并返回task progress，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function getTaskProgress(root) {
    let done = 0;
    let total = 0;
    (0, node_tree_1.walkNodes)(root, (node) => {
        if (!node.task)
            return;
        total += 1;
        if (node.task === "done")
            done += 1;
    });
    return { done, total };
}
/**
 * 执行“node search text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function nodeSearchText(node) {
    return [nodePlainText(node), node.note, node.link, ...nodeContentBlocks(node).map((block) => block.type === "image" ? `${block.source} ${block.alt ?? ""}` : block.text), node.icon, node.submap?.path, node.code?.language, node.code?.code, ...(node.table?.headers ?? []), ...(node.table?.rows.flat() ?? []), ...(node.tags ?? [])]
        .filter((value) => Boolean(value))
        .join(" ")
        .toLocaleLowerCase();
}
/**
 * 执行“task prefix”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param task 该参数用于 task prefix 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function taskPrefix(task) {
    if (task === "done")
        return "[x] ";
    if (task === "doing")
        return "[-] ";
    if (task === "todo")
        return "[ ] ";
    return "";
}
/**
 * 转义inline markdown，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function escapeInlineMarkdown(value) {
    return value.replace(/([\\`*_{}\[\]<>])/g, "\\$1");
}
/**
 * 执行“rich text to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 该参数用于 rich text to markdown 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function richTextToMarkdown(runs, fallbackText) {
    if (!runs?.length)
        return escapeInlineMarkdown(fallbackText);
    return runs.map((run) => {
        let value = escapeInlineMarkdown(run.text);
        const style = run.style;
        if (!style)
            return value;
        if (style.bold)
            value = `**${value}**`;
        if (style.italic)
            value = `*${value}*`;
        if (style.strike)
            value = `~~${value}~~`;
        if (style.underline)
            value = `<u>${value}</u>`;
        if (style.color)
            value = `<span style="color:${style.color}">${value}</span>`;
        return value;
    }).join("");
}
/**
 * 执行“table to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param table 待编辑、转换或导出的表格数据。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function tableToMarkdown(table) {
    const escapeCell = (value) => value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
    const headers = `| ${table.headers.map(escapeCell).join(" | ")} |`;
    const alignments = table.headers.map((_, index) => {
        const alignment = table.alignments?.[index] ?? "left";
        return alignment === "center" ? ":---:" : alignment === "right" ? "---:" : "---";
    });
    const separator = `| ${alignments.join(" | ")} |`;
    const rows = table.rows.map((row) => `| ${table.headers.map((_, index) => escapeCell(row[index] ?? "")).join(" | ")} |`);
    return [headers, separator, ...rows].join("\n");
}
/**
 * 执行“split markdown table row”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param line 该参数用于 split markdown table row 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function splitMarkdownTableRow(line) {
    const value = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    const cells = [];
    let current = "";
    let escaped = false;
    for (const char of value) {
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            continue;
        }
        if (char === "|") {
            cells.push(current.trim().replaceAll("<br>", "\n"));
            current = "";
            continue;
        }
        current += char;
    }
    cells.push(current.trim().replaceAll("<br>", "\n"));
    return cells;
}
/**
 * 解析markdown table，并保持模型、界面和持久化状态的一致性。
 *
 * @param markdown 待解析或生成的 Markdown 文本。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function parseMarkdownTable(markdown) {
    const lines = markdown.split(/\r?\n/);
    for (let index = 0; index < lines.length - 1; index += 1) {
        const headerLine = lines[index]?.trim() ?? "";
        const separatorLine = lines[index + 1]?.trim() ?? "";
        if (!headerLine.includes("|") || !separatorLine.includes("|"))
            continue;
        const headers = splitMarkdownTableRow(headerLine);
        const separators = splitMarkdownTableRow(separatorLine);
        if (!headers.length || separators.length !== headers.length || !separators.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, ""))))
            continue;
        const alignments = separators.map((cell) => {
            const compact = cell.replace(/\s/g, "");
            if (compact.startsWith(":") && compact.endsWith(":"))
                return "center";
            if (compact.endsWith(":"))
                return "right";
            return "left";
        });
        const rows = [];
        for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
            const rowLine = lines[rowIndex]?.trim() ?? "";
            if (!rowLine || !rowLine.includes("|"))
                break;
            const row = splitMarkdownTableRow(rowLine).slice(0, headers.length);
            while (row.length < headers.length)
                row.push("");
            rows.push(row);
        }
        return normalizeTable({ headers, rows, alignments, source: "markdown" }) ?? null;
    }
    return null;
}
/**
 * 解析fenced code，并保持模型、界面和持久化状态的一致性。
 *
 * @param markdown 待解析或生成的 Markdown 文本。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function parseFencedCode(markdown) {
    const match = markdown.match(/```([^\n`]*)\n([\s\S]*?)\n```/);
    if (!match)
        return null;
    return normalizeCode({ language: match[1]?.trim(), code: match[2] ?? "" }) ?? null;
}
/**
 * 执行“children to table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function childrenToTable(node) {
    if (!node.children.length)
        return null;
    return {
        headers: ["子节点", "备注", "状态", "标签", "下级数量"],
        rows: node.children.map((child) => [
            nodePlainText(child),
            child.note ?? "",
            child.task === "done" ? "已完成" : child.task === "doing" ? "进行中" : child.task === "todo" ? "待办" : "",
            child.tags?.join(", ") ?? "",
            String(child.children.length)
        ]),
        alignments: ["left", "left", "center", "left", "right"],
        source: "children"
    };
}
/**
 * 执行“document to markdown”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param doc 要处理或写回的思维导图文档。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function documentToMarkdown(doc) {
    const renderBlocks = (node) => {
        const result = [];
        for (const block of nodeContentBlocks(node)) {
            if (block.type === "text") {
                const value = richTextToMarkdown(block.richText, block.text);
                if (value)
                    result.push(value);
            }
            else {
                result.push(`![${escapeInlineMarkdown(block.alt ?? "图片")}](${block.source})`);
            }
        }
        return result;
    };
    const rootBlocks = renderBlocks(doc.root);
    const rootTitle = rootBlocks.find((value) => !value.startsWith("![")) ?? doc.title;
    const rootSuffix = doc.root.tags?.length ? ` ${doc.root.tags.map((tag) => `#${tag}`).join(" ")}` : "";
    const lines = [`# ${doc.root.icon ? `${doc.root.icon} ` : ""}${rootTitle}${rootSuffix}`];
    rootBlocks.filter((value) => value !== rootTitle).forEach((value) => lines.push(value));
    const visit = (node, depth) => {
        const indent = "  ".repeat(Math.max(0, depth - 1));
        const tags = node.tags?.length ? ` ${node.tags.map((tag) => `#${tag}`).join(" ")}` : "";
        const link = node.link ? ` → ${node.link}` : "";
        const blocks = renderBlocks(node);
        const firstText = blocks.find((value) => !value.startsWith("![")) ?? (blocks[0] ?? "图片节点");
        lines.push(`${indent}- ${taskPrefix(node.task)}${node.icon ? `${node.icon} ` : ""}${firstText}${tags}${link}`);
        blocks.filter((value) => value !== firstText).forEach((value) => lines.push(`${indent}  ${value}`));
        if (node.note)
            lines.push(`${indent}  > ${node.note.replaceAll("\n", " ")}`);
        if (node.submap)
            lines.push(`${indent}  > 子导图：[[${node.submap.path}]]`);
        if (node.table)
            lines.push("", ...tableToMarkdown(node.table).split("\n").map((line) => `${indent}  ${line}`), "");
        if (node.code)
            lines.push(`${indent}  \`\`\`${node.code.language ?? ""}`, ...node.code.code.split("\n").map((line) => `${indent}  ${line}`), `${indent}  \`\`\``);
        node.children.forEach((child) => visit(child, depth + 1));
    };
    doc.root.children.forEach((child) => visit(child, 1));
    return lines.join("\n");
}
/**
 * 解析task text，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function parseTaskText(value) {
    const match = value.match(/^\[( |x|X|-)\]\s+(.+)$/);
    if (!match)
        return { text: value };
    const marker = match[1];
    const task = marker === "x" || marker === "X" ? "done" : marker === "-" ? "doing" : "todo";
    return { text: match[2]?.trim() || "任务", task };
}
/**
 * 执行“markdown to document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param markdown 待解析或生成的 Markdown 文本。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function markdownToDocument(markdown, fallbackTitle = "思维导图") {
    const doc = createDefaultDocument(fallbackTitle);
    doc.root.children = [];
    const stack = [{ level: 0, node: doc.root, kind: "root" }];
    let rootAssigned = false;
    let currentBoldTheme = null;
    let currentBoldNode = null;
    let hasLeadingContent = false;
    let skippingTableOfContents = false;
    let tableLines = [];
    const hasMultipleH1 = (markdown.match(/^#[ 	]+\S/gm) || []).length > 1;
    const applyMarkdownText = (node, value, fallback = "节点", forceBold = false) => {
        const source = value.trim() || fallback;
        if (forceBold) {
            node.text = source;
            node.richText = normalizeRichText([{ text: source, style: { bold: true } }], source);
            return;
        }
        const runs = [];
        const boldPattern = /\*\*(.+?)\*\*/g;
        let cursor = 0;
        let match;
        while ((match = boldPattern.exec(source))) {
            const before = source.slice(cursor, match.index);
            const boldText = match[1] ?? "";
            if (before)
                runs.push({ text: before });
            if (boldText)
                runs.push({ text: boldText, style: { bold: true } });
            cursor = match.index + match[0].length;
        }
        if (!runs.length) {
            node.text = source;
            node.richText = undefined;
            return;
        }
        const after = source.slice(cursor);
        if (after)
            runs.push({ text: after });
        const text = runs.map((run) => run.text).join("");
        node.text = text || fallback;
        node.richText = normalizeRichText(runs, node.text);
    };
    const createMarkdownNode = (value, fallback = "节点", forceBold = false) => {
        const node = createNode();
        applyMarkdownText(node, value, fallback, forceBold);
        return node;
    };
    for (const rawLine of markdown.split(/\r?\n/)) {
        const line = rawLine.trimEnd();
        // Buffer consecutive table lines
        if (/^\s*\|.*\|\s*$/.test(line)) {
            if (!skippingTableOfContents)
                tableLines.push(line);
            continue;
        }
        // Flush buffered table when hitting a non-table line
        if (tableLines.length >= 2) {
            const tableStr = tableLines.join('\n');
            const parsed = parseMarkdownTable(tableStr);
            if (parsed) {
                const target = currentBoldNode ?? stack.at(-1)?.node ?? doc.root;
                target.table = parsed;
            }
        }
        tableLines = [];
        if (!line.trim() || line.trimStart().startsWith("---") || line.trimStart().startsWith("```"))
            continue;
        const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
        const bullet = line.match(/^(\s*)[-*+]\s+(.+?)\s*$/);
        const numbered = line.match(/^(\s*)\d+[.)]\s+(.+?)\s*$/);
        const boldOutline = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
        const quote = line.match(/^\s*>\s*(.+?)\s*$/);
        if (heading) {
            currentBoldTheme = null;
            currentBoldNode = null;
            const level = heading[1]?.length ?? 1;
            const text = heading[2]?.trim() ?? "节点";
            if (!rootAssigned && !doc.root.children.length && /^目录(?:\s|$)/.test(text)) {
                hasLeadingContent = true;
                skippingTableOfContents = true;
                stack.length = 1;
                continue;
            }
            skippingTableOfContents = false;
            if (level === 1 && !rootAssigned && !doc.root.children.length && !hasLeadingContent && !hasMultipleH1) {
                applyMarkdownText(doc.root, text);
                doc.title = doc.root.text;
                rootAssigned = true;
                stack.length = 1;
            }
            else if (level === 1) {
                const node = createMarkdownNode(text);
                stack.length = 1;
                doc.root.children.push(node);
                stack.push({ level, node, kind: "heading" });
                rootAssigned = true;
            }
            else {
                const node = createMarkdownNode(text);
                while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level)
                    stack.pop();
                const parent = stack.at(-1)?.node ?? doc.root;
                parent.children.push(node);
                stack.push({ level, node, kind: "heading" });
            }
            continue;
        }
        if (skippingTableOfContents)
            continue;
        if (quote) {
            const parent = stack.at(-1)?.node ?? doc.root;
            parent.children.push(createMarkdownNode(quote[1]?.trim() || "引用"));
            hasLeadingContent || (hasLeadingContent = !rootAssigned);
            continue;
        }
        if (boldOutline) {
            const text = boldOutline[1]?.trim() || "节点";
            if (!rootAssigned && !doc.root.children.length && stack.length === 1) {
                applyMarkdownText(doc.root, text, "节点", true);
                doc.title = doc.root.text;
                rootAssigned = true;
                currentBoldNode = doc.root;
                continue;
            }
            const isTheme = /^主题\s*[一二三四五六七八九十百千万零〇○0-9]+/.test(text);
            const parent = isTheme ? doc.root : currentBoldTheme ?? doc.root;
            const node = createMarkdownNode(text, "节点", true);
            parent.children.push(node);
            currentBoldNode = node;
            if (isTheme)
                currentBoldTheme = node;
            stack.length = 1;
            if (currentBoldTheme && node !== currentBoldTheme)
                stack.push({ level: 2, node: currentBoldTheme, kind: "bold" });
            stack.push({ level: isTheme ? 2 : 3, node, kind: "bold" });
            continue;
        }
        const listMatch = bullet ?? numbered;
        if (listMatch) {
            const spaces = (listMatch[1] ?? "").replaceAll("\t", "  ").length;
            const parentLevel = [...stack].reverse().find((entry) => entry.kind === "heading" || entry.kind === "bold")?.level ?? 1;
            const level = parentLevel + Math.floor(spaces / 2) + 1;
            const parsed = parseTaskText((listMatch[2] ?? "节点").trim());
            const node = createMarkdownNode(parsed.text);
            node.task = parsed.task;
            while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= level)
                stack.pop();
            const parent = stack.at(-1)?.node ?? doc.root;
            parent.children.push(node);
            stack.push({ level, node, kind: "list" });
            currentBoldNode = node;
            continue;
        }
        if (currentBoldNode) {
            currentBoldNode.children.push(createMarkdownNode(line.trim()));
            continue;
        }
        const parent = stack.at(-1)?.node;
        if (parent && parent !== doc.root)
            parent.children.push(createMarkdownNode(line.trim()));
        else
            hasLeadingContent = true;
    }
    // Flush trailing table buffer
    if (tableLines.length >= 2) {
        const tableStr = tableLines.join('\n');
        const parsed = parseMarkdownTable(tableStr);
        if (parsed) {
            const target = currentBoldNode ?? stack.at(-1)?.node ?? doc.root;
            target.table = parsed;
        }
    }
    if (!doc.root.children.length)
        doc.root.children.push(createNode("主题 1"));
    return doc;
}
/**
 * Converts tab- or space-indented outline text (including XMind clipboard
 * fallback text) into Markdown while preserving its hierarchy.
 *
 * @param text Plain outline text.
 * @returns Nested Markdown suitable for `markdownToDocument`.
 */
function indentedTextToMarkdown(text) {
    const lines = text.split(/\r?\n/)
        .map((line) => {
        const match = line.match(/^([ \t]*)(.*?)\s*$/);
        const whitespace = (match?.[1] ?? "").replaceAll("\t", "    ").length;
        return { indent: whitespace, text: match?.[2]?.trim() ?? "" };
    })
        .filter((line) => line.text);
    if (!lines.length)
        return "";
    const indentationLevels = Array.from(new Set(lines.map((line) => line.indent))).sort((a, b) => a - b);
    const levelOf = (indent) => Math.max(0, indentationLevels.indexOf(indent));
    const hasHierarchy = lines.slice(1).some((line) => levelOf(line.indent) > levelOf(lines[0].indent));
    return lines.map((line, index) => {
        const level = levelOf(line.indent);
        if (index === 0 && hasHierarchy)
            return `# ${line.text}`;
        const adjustedLevel = hasHierarchy ? Math.max(0, level - levelOf(lines[0].indent) - 1) : level;
        return `${"  ".repeat(adjustedLevel)}- ${line.text}`;
    }).join("\n");
}
