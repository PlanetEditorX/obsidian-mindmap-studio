"use strict";
/**
 * @file editor-modals.ts
 * @description 编辑器领域的通用预览、搜索和导出弹窗。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentExportModal = exports.SearchNodesModal = exports.OutlineModal = exports.JsonTransferModal = exports.ArticleStyleModal = exports.FormulaEditModal = exports.ImagePreviewModal = void 0;
exports.chooseImageHosts = chooseImageHosts;
const obsidian_1 = require("obsidian");
const model_1 = require("../core/model");
const rich_text_dom_1 = require("./rich-text-dom");
const article_style_1 = require("../article/article-style");
const import_export_1 = require("../import/import-export");
const node_actions_1 = require("./node-actions");
/**
 * 选择一个或多个图片上传目标。
 */
class ImageHostPickerModal extends obsidian_1.Modal {
    /**
     * 创建图床选择弹窗。
     *
     * @param app Obsidian 应用实例。
     * @param hosts 可用图床。
     * @param initialIds 默认选中的图床 ID。
     * @param resolveSelection 选择结果回调。
     */
    constructor(app, hosts, initialIds, resolveSelection) {
        super(app);
        this.hosts = hosts;
        this.resolveSelection = resolveSelection;
        this.resolved = false;
        this.selected = new Set();
        initialIds.forEach((id) => this.selected.add(id));
    }
    /**
     * 创建图床多选列表。
     */
    onOpen() {
        this.titleEl.setText("选择上传图床");
        this.contentEl.addClass("mms-image-host-picker");
        this.contentEl.createEl("p", {
            cls: "setting-item-description",
            text: "可以选择一个或多个图床。全部上传成功后，第一项的地址会作为节点当前显示地址，其余地址会作为镜像保存。"
        });
        const list = this.contentEl.createDiv({ cls: "mms-image-host-picker-list" });
        for (const host of this.hosts) {
            const label = list.createEl("label", { cls: "mms-image-host-picker-item" });
            const checkbox = label.createEl("input", { type: "checkbox" });
            checkbox.checked = this.selected.has(host.id);
            checkbox.addEventListener("change", () => {
                if (checkbox.checked)
                    this.selected.add(host.id);
                else
                    this.selected.delete(host.id);
            });
            label.createSpan({ text: host.name });
        }
        const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
        actions.createEl("button", { text: "取消", attr: { type: "button" } })
            .addEventListener("click", () => this.close());
        const confirm = actions.createEl("button", { text: "确定", cls: "mod-cta", attr: { type: "button" } });
        confirm.addEventListener("click", () => {
            if (!this.selected.size) {
                new obsidian_1.Notice("请至少选择一个图床");
                return;
            }
            this.resolved = true;
            this.resolveSelection(Array.from(this.selected));
            this.close();
        });
    }
    /**
     * 未确认时返回取消结果。
     */
    onClose() {
        if (!this.resolved)
            this.resolveSelection(null);
    }
}
/**
 * 打开图床选择器，并过滤已经失效的默认 ID。
 *
 * @param app Obsidian 应用实例。
 * @param hosts 可用图床。
 * @param initialIds 默认图床 ID。
 * @returns 用户选择的图床 ID；取消时返回 null。
 */
function chooseImageHosts(app, hosts, initialIds) {
    if (!hosts.length) {
        new obsidian_1.Notice("没有可用图床，请先在插件设置中配置并启用图床");
        return Promise.resolve(null);
    }
    const allowed = new Set(hosts.map((host) => host.id));
    const initial = initialIds.filter((id) => allowed.has(id));
    return new Promise((resolve) => {
        new ImageHostPickerModal(app, hosts, initial.length ? initial : [hosts[0].id], resolve).open();
    });
}
/**
 * 提供图片缩放和滚轮预览。
 */
class ImagePreviewModal extends obsidian_1.Modal {
    /**
     * 创建图片预览弹窗。
     *
     * @param app Obsidian 应用实例。
     * @param source 图片资源地址。
     * @param alt 图片说明。
     * @param sources 当前图片已经保存的图床镜像及本地来源。
     * @param resolveSource 将仓库路径转换为可显示地址的解析器。
     */
    constructor(app, source, alt, sources = [], resolveSource) {
        super(app);
        this.source = source;
        this.alt = alt;
        this.sources = sources;
        this.resolveSource = resolveSource;
        this.scale = 1;
    }
    /**
     * 创建图片预览界面和缩放控制。
     */
    onOpen() {
        this.modalEl.addClass("mmc-image-preview-modal");
        this.titleEl.setText(this.alt || "图片预览");
        const toolbar = this.contentEl.createDiv({ cls: "mmc-image-preview-toolbar" });
        const sourceBar = this.contentEl.createDiv({ cls: "mmc-image-preview-sources" });
        const imageWrap = this.contentEl.createDiv({ cls: "mmc-image-preview-stage" });
        const image = imageWrap.createEl("img", { attr: { src: this.source, alt: this.alt || "图片" } });
        let sourceStatus;
        let baseWidth = 0;
        let baseHeight = 0;
        const applyScale = () => {
            if (!baseWidth || !baseHeight)
                return;
            image.style.width = `${Math.max(1, Math.round(baseWidth * this.scale))}px`;
            image.style.height = `${Math.max(1, Math.round(baseHeight * this.scale))}px`;
        };
        image.addEventListener("load", () => {
            const availableWidth = Math.max(320, imageWrap.clientWidth * 0.9);
            const availableHeight = Math.max(220, imageWrap.clientHeight * 0.9);
            const fit = Math.min(1, availableWidth / Math.max(1, image.naturalWidth), availableHeight / Math.max(1, image.naturalHeight));
            baseWidth = Math.max(1, image.naturalWidth * fit);
            baseHeight = Math.max(1, image.naturalHeight * fit);
            applyScale();
            sourceStatus.setText(`${sourceStatus.dataset.label ?? "当前图片"} · ${image.naturalWidth}×${image.naturalHeight}`);
            sourceBar.removeClass("has-error");
        });
        image.addEventListener("error", () => {
            sourceStatus.setText(`${sourceStatus.dataset.label ?? "当前图片"} · 加载失败`);
            sourceBar.addClass("has-error");
        });
        const button = (label, action) => {
            const element = toolbar.createEl("button", { text: label, attr: { type: "button" } });
            element.addEventListener("click", action);
        };
        button("−", () => { this.scale = Math.max(0.2, this.scale - 0.2); applyScale(); });
        button("100%", () => { this.scale = 1; applyScale(); });
        button("+", () => { this.scale = Math.min(5, this.scale + 0.2); applyScale(); });
        const candidates = this.sources.length
            ? this.sources
            : [{ source: this.source, label: "当前图片", kind: "current" }];
        const sourceButtons = [];
        sourceBar.createSpan({ cls: "mmc-image-preview-sources-label", text: "图片来源：" });
        const switchSource = (candidate, sourceButton) => {
            const resolved = this.resolveSource?.(candidate.source) ?? candidate.source;
            this.scale = 1;
            baseWidth = 0;
            baseHeight = 0;
            sourceStatus.dataset.label = candidate.label;
            sourceStatus.setText(`${candidate.label} · 加载中…`);
            sourceBar.removeClass("has-error");
            sourceButtons.forEach((item) => item.removeClass("is-active"));
            sourceButton.addClass("is-active");
            image.removeAttribute("style");
            image.src = resolved;
        };
        for (const candidate of candidates) {
            const sourceButton = sourceBar.createEl("button", {
                text: candidate.label,
                cls: "mmc-image-preview-source-button",
                attr: { type: "button", title: `预览来源：${candidate.label}` }
            });
            sourceButtons.push(sourceButton);
            sourceButton.addEventListener("click", () => switchSource(candidate, sourceButton));
        }
        sourceStatus = sourceBar.createSpan({ cls: "mmc-image-preview-source-status", text: "当前图片" });
        const initialIndex = Math.max(0, candidates.findIndex((candidate) => {
            const resolved = this.resolveSource?.(candidate.source) ?? candidate.source;
            return resolved === this.source || candidate.source === this.source;
        }));
        const initialCandidate = candidates[initialIndex];
        const initialButton = sourceButtons[initialIndex];
        sourceStatus.dataset.label = initialCandidate.label;
        initialButton.addClass("is-active");
        imageWrap.addEventListener("wheel", (event) => {
            event.preventDefault();
            this.scale = Math.min(5, Math.max(0.2, this.scale + (event.deltaY < 0 ? 0.15 : -0.15)));
            applyScale();
        }, { passive: false });
        image.addEventListener("dblclick", () => { this.scale = 1; applyScale(); });
    }
}
exports.ImagePreviewModal = ImagePreviewModal;
/**
 * 图形化 LaTeX 公式编辑器，提供常用结构按钮和实时预览。
 */
class FormulaEditModal extends obsidian_1.Modal {
    /**
     * 创建公式编辑器。
     *
     * @param app Obsidian 应用实例。
     * @param submit 保存公式源码的回调。
     */
    constructor(app, submit) {
        super(app);
        this.submit = submit;
    }
    /**
     * 创建公式模板、源码输入和 MathJax 预览。
     */
    onOpen() {
        this.titleEl.setText("插入 LaTeX 公式");
        this.contentEl.addClass("mms-formula-editor");
        this.contentEl.createEl("p", {
            cls: "setting-item-description",
            text: "点击常用结构快速组合公式，也可以直接修改 LaTeX 源码。保存后节点会显示公式而不是源码。"
        });
        const templates = [
            ["x²", "x^{2}", "上标"], ["xᵢ", "x_{i}", "下标"], ["a⁄b", "\\frac{a}{b}", "分数"],
            ["√x", "\\sqrt{x}", "根号"], ["Σ", "\\sum_{i=1}^{n} x_i", "求和"],
            ["∫", "\\int_{a}^{b} f(x)\\,dx", "积分"], ["lim", "\\lim_{x\\to\\infty} f(x)", "极限"],
            ["α", "\\alpha", "希腊字母"], ["→", "\\overrightarrow{AB}", "向量"],
            ["()", "\\left( \\frac{a}{b} \\right)", "自适应括号"],
            ["矩阵", "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}", "矩阵"],
            ["方程组", "\\begin{cases} x+y=1 \\\\ x-y=0 \\end{cases}", "方程组"]
        ];
        const arithmetic = [
            ["+", " + ", "加"], ["−", " - ", "减"], ["×", " \\times ", "乘"], ["÷", " \\div ", "除"],
            ["·", " \\cdot ", "点乘"], ["∗", " \\ast ", "星号乘"], ["/", " / ", "斜线除"],
            ["a⁄b", "\\frac{a}{b}", "分数"], ["±", " \\pm ", "正负"], ["∓", " \\mp ", "负正"],
            ["=", " = ", "等于"], ["%", " \\% ", "百分号"], [":", " : ", "比"]
        ];
        const relations = [
            ["≠", " \\neq ", "不等于"], ["≈", " \\approx ", "约等于"], ["≡", " \\equiv ", "恒等于"],
            ["≢", " \\not\\equiv ", "不恒等于"], ["≥", " \\geq ", "大于等于"], ["≫", " \\gg ", "远大于"],
            ["≤", " \\leq ", "小于等于"], ["≪", " \\ll ", "远小于"], ["∼", " \\sim ", "相似"],
            ["≃", " \\simeq ", "渐近相等"], ["≅", " \\cong ", "全等"]
        ];
        this.contentEl.createDiv({ cls: "mms-formula-section-title", text: "常用结构" });
        const palette = this.contentEl.createDiv({ cls: "mms-formula-palette" });
        this.contentEl.createDiv({ cls: "mms-formula-section-title", text: "基本运算" });
        const arithmeticPalette = this.contentEl.createDiv({ cls: "mms-formula-palette mms-formula-operators" });
        this.contentEl.createDiv({ cls: "mms-formula-section-title", text: "关系符号" });
        const relationPalette = this.contentEl.createDiv({ cls: "mms-formula-palette mms-formula-relations" });
        const source = this.contentEl.createEl("textarea", {
            cls: "mms-formula-source",
            attr: { rows: "5", spellcheck: "false", placeholder: "\\frac{a}{b}" }
        });
        const preview = this.contentEl.createDiv({ cls: "mms-formula-preview" });
        let previewToken = 0;
        const updatePreview = () => {
            const token = ++previewToken;
            const value = source.value.trim();
            preview.empty();
            if (!value) {
                preview.createSpan({ cls: "setting-item-description", text: "公式预览" });
                return;
            }
            void (0, rich_text_dom_1.ensureMathJax)().then(() => {
                if (token !== previewToken || !preview.isConnected)
                    return;
                preview.empty();
                try {
                    preview.appendChild((0, obsidian_1.renderMath)(value, true));
                    void (0, obsidian_1.finishRenderMath)();
                }
                catch {
                    preview.createSpan({ cls: "mod-warning", text: "公式语法暂时无法渲染" });
                }
            });
        };
        const insert = (template) => {
            const start = source.selectionStart ?? source.value.length;
            const end = source.selectionEnd ?? start;
            source.setRangeText(template, start, end, "end");
            source.focus();
            updatePreview();
        };
        for (const [label, template, title] of templates) {
            const button = palette.createEl("button", { text: label, attr: { type: "button", title } });
            button.addEventListener("click", () => insert(template));
        }
        for (const [label, template, title] of arithmetic) {
            const button = arithmeticPalette.createEl("button", {
                text: label,
                attr: { type: "button", title: `${title}（${template}）` }
            });
            button.addEventListener("click", () => insert(template));
        }
        for (const [label, template, title] of relations) {
            const button = relationPalette.createEl("button", {
                text: label,
                attr: { type: "button", title: `${title}（${template}）` }
            });
            button.addEventListener("click", () => insert(template));
        }
        source.addEventListener("input", updatePreview);
        const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
        actions.createEl("button", { text: "取消", attr: { type: "button" } }).addEventListener("click", () => this.close());
        const save = actions.createEl("button", { text: "插入公式", cls: "mod-cta", attr: { type: "button" } });
        save.addEventListener("click", () => {
            const value = source.value.trim();
            if (!value) {
                new obsidian_1.Notice("请先输入或选择一个公式");
                return;
            }
            this.submit(value);
            this.close();
        });
        updatePreview();
        source.focus();
    }
    /**
     * 清理公式编辑器 DOM。
     */
    onClose() {
        this.contentEl.empty();
    }
}
exports.FormulaEditModal = FormulaEditModal;
/**
 * 编辑文章模式的预设、字体和颜色。
 */
class ArticleStyleModal extends obsidian_1.Modal {
    /**
     * 创建文章样式编辑器。
     *
     * @param app Obsidian 应用实例。
     * @param style 当前文档样式。
     * @param submitStyle 样式提交回调。
     */
    constructor(app, style, submitStyle) {
        super(app);
        this.submitStyle = submitStyle;
        this.style = (0, article_style_1.resolveArticleStyle)(style);
    }
    /**
     * 创建文章样式预设和自定义控件。
     */
    onOpen() {
        this.titleEl.setText("文章样式");
        this.contentEl.addClass("mms-article-style-modal");
        const form = this.contentEl.createEl("form");
        const grid = form.createDiv({ cls: "mmc-form-grid" });
        const presetLabel = grid.createEl("label", { text: "样式预设" });
        const preset = presetLabel.createEl("select");
        for (const [id, name] of [["classic", "经典文档"], ["book", "书籍阅读"], ["modern", "现代报告"], ["minimal", "极简留白"]]) {
            preset.createEl("option", { text: name, attr: { value: id } });
        }
        const addText = (labelText) => {
            const label = grid.createEl("label", { text: labelText });
            return label.createEl("input", { type: "text" });
        };
        const addColor = (labelText) => {
            const label = grid.createEl("label", { text: labelText });
            return label.createEl("input", { type: "color" });
        };
        const fontFamily = addText("字体");
        const textColor = addColor("正文颜色");
        const headingColor = addColor("标题颜色");
        const accentColor = addColor("强调色");
        const backgroundColor = addColor("纸张背景");
        const tocLabel = grid.createEl("label", { text: "目录样式" });
        const tocStyle = tocLabel.createEl("select");
        for (const [id, name] of [["card", "卡片"], ["plain", "简洁"], ["lines", "引导线"]]) {
            tocStyle.createEl("option", { text: name, attr: { value: id } });
        }
        const sizeLabel = grid.createEl("label", { text: "正文字号" });
        const fontSize = sizeLabel.createEl("input", { type: "number", attr: { min: "12", max: "24", step: "1" } });
        const lineLabel = grid.createEl("label", { text: "正文行高" });
        const lineHeight = lineLabel.createEl("input", { type: "number", attr: { min: "1.2", max: "2.4", step: "0.05" } });
        const fill = (style) => {
            const resolved = (0, article_style_1.resolveArticleStyle)(style);
            preset.value = resolved.preset;
            fontFamily.value = resolved.fontFamily ?? "";
            textColor.value = resolved.textColor ?? "#20242c";
            headingColor.value = resolved.headingColor ?? "#111827";
            accentColor.value = resolved.accentColor ?? "#7c3aed";
            backgroundColor.value = resolved.backgroundColor ?? "#ffffff";
            tocStyle.value = resolved.tocStyle ?? "card";
            fontSize.value = String(resolved.fontSize ?? 16);
            lineHeight.value = String(resolved.lineHeight ?? 1.85);
        };
        fill(this.style);
        preset.addEventListener("change", () => fill(article_style_1.ARTICLE_STYLE_PRESETS[preset.value]));
        const actions = form.createDiv({ cls: "mmc-modal-actions" });
        const cancel = actions.createEl("button", { text: "取消", type: "button" });
        actions.createEl("button", { text: "应用", type: "submit", cls: "mod-cta" });
        cancel.addEventListener("click", () => this.close());
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.submitStyle({
                preset: preset.value,
                fontFamily: fontFamily.value.trim() || undefined,
                textColor: textColor.value,
                headingColor: headingColor.value,
                accentColor: accentColor.value,
                backgroundColor: backgroundColor.value,
                tocStyle: tocStyle.value,
                fontSize: Math.max(12, Math.min(24, Number(fontSize.value) || 16)),
                lineHeight: Math.max(1.2, Math.min(2.4, Number(lineHeight.value) || 1.85))
            });
            this.close();
        });
    }
}
exports.ArticleStyleModal = ArticleStyleModal;
/**
 * 导入、导出或替换完整的思维导图 JSON。
 */
class JsonTransferModal extends obsidian_1.Modal {
    /**
     * 创建 JSON 传输弹窗。
     *
     * @param app Obsidian 应用实例。
     * @param document 当前思维导图文档。
     * @param onImport 导入完成回调。
     * @param onExport 导出回调。
     */
    constructor(app, document, onImport, onExport) {
        super(app);
        this.document = document;
        this.onImport = onImport;
        this.onExport = onExport;
    }
    /**
     * 创建 JSON 文本区和文件导入操作。
     */
    onOpen() {
        this.titleEl.setText("导入 / 导出");
        const description = this.contentEl.createEl("p", {
            text: "可以复制当前 JSON，也可以导入 MindMap Studio JSON、XMind 或 Markdown 文件。"
        });
        description.addClass("setting-item-description");
        const importProgress = this.contentEl.createDiv({ cls: "mmc-import-progress" });
        const progressBar = importProgress.createEl("progress", { attr: { max: "100", value: "0" } });
        const progressStatus = importProgress.createSpan({ text: "等待选择导入文件" });
        const updateImportProgress = async (value, status) => {
            progressBar.value = value;
            progressStatus.setText(`${value}% · ${status}`);
            await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
        };
        const textarea = this.contentEl.createEl("textarea", { cls: "mmc-json-textarea" });
        textarea.value = JSON.stringify(this.document, null, 2);
        const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions mmc-json-actions" });
        const copy = actions.createEl("button", { text: "复制 JSON" });
        const importFileButton = actions.createEl("button", { text: "导入 XMind / Markdown", attr: { type: "button" } });
        const exportButton = actions.createEl("button", { text: "导出 .json" });
        const importButton = actions.createEl("button", { text: "导入并替换", cls: "mod-warning" });
        copy.addEventListener("click", () => {
            void navigator.clipboard.writeText(textarea.value);
            new obsidian_1.Notice("已复制 JSON");
        });
        importFileButton.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".xmind,.md,.markdown,.json";
            input.addEventListener("change", () => {
                const file = input.files?.[0];
                if (!file)
                    return;
                void (async () => {
                    try {
                        const extension = file.name.split(".").at(-1)?.toLowerCase();
                        await updateImportProgress(10, `正在读取 ${file.name}`);
                        const source = extension === "xmind" ? await file.arrayBuffer() : await file.text();
                        await updateImportProgress(55, extension === "xmind" ? "正在解析 XMind 画布和主题" : extension === "json" ? "正在校验 JSON 文档" : "正在解析 Markdown 标题和列表");
                        const imported = extension === "xmind"
                            ? (0, import_export_1.xmindToDocument)(source, file.name.replace(/\.xmind$/i, ""))
                            : extension === "json"
                                ? (0, model_1.normalizeDocument)(JSON.parse(source), this.document.title)
                                : (0, model_1.markdownToDocument)(source, file.name.replace(/\.(?:md|markdown)$/i, ""));
                        await updateImportProgress(85, "正在生成思维导图");
                        (0, node_actions_1.setAllBranchesCollapsed)(imported.root, true);
                        this.onImport(imported);
                        await updateImportProgress(100, "导入完成");
                        new obsidian_1.Notice(`已导入：${file.name}`);
                        window.setTimeout(() => this.close(), 180);
                    }
                    catch (error) {
                        console.error("MindMap Studio file import failed", error);
                        const message = error instanceof Error ? error.message : "文件导入失败";
                        progressStatus.setText(`导入失败：${message}`);
                        new obsidian_1.Notice(message);
                    }
                })();
            }, { once: true });
            input.click();
        });
        exportButton.addEventListener("click", () => this.onExport(textarea.value));
        importButton.addEventListener("click", () => {
            try {
                const parsed = JSON.parse(textarea.value);
                const normalized = (0, model_1.normalizeDocument)(parsed, this.document.title);
                (0, node_actions_1.setAllBranchesCollapsed)(normalized.root, true);
                this.onImport(normalized);
                new obsidian_1.Notice("JSON 已导入");
                this.close();
            }
            catch (error) {
                console.error("MindMap Studio JSON import failed", error);
                new obsidian_1.Notice("JSON 格式无效，请检查后重试");
            }
        });
    }
}
exports.JsonTransferModal = JsonTransferModal;
/**
 * 显示只读 Markdown 大纲并提供复制和导出入口。
 */
class OutlineModal extends obsidian_1.Modal {
    /**
     * 创建 Markdown 大纲弹窗。
     *
     * @param app Obsidian 应用实例。
     * @param markdown 要显示的 Markdown。
     * @param onExport 导出回调。
     */
    constructor(app, markdown, onExport) {
        super(app);
        this.markdown = markdown;
        this.onExport = onExport;
    }
    /**
     * 创建大纲内容和操作按钮。
     */
    onOpen() {
        this.titleEl.setText("Markdown 大纲");
        const textarea = this.contentEl.createEl("textarea", { cls: "mmc-outline-textarea" });
        textarea.value = this.markdown;
        textarea.readOnly = true;
        const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
        const copy = actions.createEl("button", { text: "复制" });
        const exportButton = actions.createEl("button", { text: "导出为 .md", cls: "mod-cta" });
        copy.addEventListener("click", () => {
            void navigator.clipboard.writeText(this.markdown);
            new obsidian_1.Notice("已复制 Markdown 大纲");
        });
        exportButton.addEventListener("click", () => {
            this.onExport();
            this.close();
        });
    }
    /**
     * 清理大纲弹窗 DOM。
     */
    onClose() {
        this.contentEl.empty();
    }
}
exports.OutlineModal = OutlineModal;
/**
 * 搜索当前文档中的节点。
 */
class SearchNodesModal extends obsidian_1.Modal {
    /**
     * 创建节点搜索弹窗。
     *
     * @param app Obsidian 应用实例。
     * @param nodes 可搜索节点。
     * @param onQuery 查询变化回调。
     * @param onSelect 节点选择回调。
     */
    constructor(app, nodes, onQuery, onSelect) {
        super(app);
        this.nodes = nodes;
        this.onQuery = onQuery;
        this.onSelect = onSelect;
    }
    /**
     * 创建搜索框和匹配结果列表。
     */
    onOpen() {
        this.titleEl.setText("搜索节点");
        this.modalEl.addClass("mmc-search-modal");
        const input = this.contentEl.createEl("input", { type: "search", cls: "mmc-search-input", attr: { placeholder: "搜索文字、备注、标签或链接…" } });
        const count = this.contentEl.createDiv({ cls: "mmc-search-count" });
        const results = this.contentEl.createDiv({ cls: "mmc-search-results" });
        const renderResults = () => {
            const query = input.value.trim().toLocaleLowerCase();
            this.onQuery(query);
            results.empty();
            const matches = query
                ? this.nodes.filter((node) => (0, model_1.nodeSearchText)(node).includes(query)).slice(0, 80)
                : this.nodes.slice(0, 40);
            count.setText(query ? `找到 ${matches.length} 个节点` : `共 ${this.nodes.length} 个节点`);
            for (const node of matches) {
                const button = results.createEl("button", { cls: "mmc-search-result", type: "button" });
                const title = button.createDiv({ cls: "mmc-search-result-title" });
                if (node.icon)
                    title.createSpan({ text: `${node.icon} ` });
                title.createSpan({ text: (0, model_1.nodePrimaryText)(node) || "图片节点" });
                const details = [
                    node.task ? { todo: "待办", doing: "进行中", done: "已完成" }[node.task] : "",
                    ...(node.tags ?? []).map((tag) => `#${tag}`)
                ].filter(Boolean).join(" · ");
                if (details)
                    button.createDiv({ cls: "mmc-search-result-meta", text: details });
                button.addEventListener("click", () => {
                    this.onSelect(node);
                    this.close();
                });
            }
            if (!matches.length)
                results.createDiv({ cls: "mmc-empty-state", text: "没有匹配的节点" });
        };
        input.addEventListener("input", renderResults);
        input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter")
                return;
            const first = results.querySelector(".mmc-search-result");
            if (first) {
                event.preventDefault();
                first.click();
            }
        });
        renderResults();
        window.setTimeout(() => input.focus(), 20);
    }
}
exports.SearchNodesModal = SearchNodesModal;
/**
 * 提供可移植文档格式的导出选择。
 */
class DocumentExportModal extends obsidian_1.Modal {
    /**
     * 创建文档导出格式弹窗。
     *
     * @param app Obsidian 应用实例。
     * @param exportFormat 格式选择回调。
     */
    constructor(app, exportFormat) {
        super(app);
        this.exportFormat = exportFormat;
    }
    /**
     * 创建各导出格式按钮。
     */
    onOpen() {
        this.titleEl.setText("导出文档");
        this.contentEl.createEl("p", { cls: "setting-item-description", text: "选择适合阅读、编辑或打印的格式。" });
        const formats = this.contentEl.createDiv({ cls: "mms-document-export-grid" });
        for (const [format, title, description] of [
            ["html", "HTML", "独立网页，可用浏览器打开"],
            ["doc", "Word", "Word 兼容文档（.doc）"],
            ["pdf", "PDF", "打开打印版并另存为 PDF"],
            ["md", "Markdown", "保留标题和节点层级"]
        ]) {
            const button = formats.createEl("button", { attr: { type: "button" } });
            button.createEl("strong", { text: title });
            button.createSpan({ text: description });
            button.addEventListener("click", () => {
                this.exportFormat(format);
                this.close();
            });
        }
    }
}
exports.DocumentExportModal = DocumentExportModal;
