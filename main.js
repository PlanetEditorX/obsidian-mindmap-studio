/* MindMap Studio - MIT License */
"use strict";
const __bundleModules = {
0: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file main.ts
 * @description 插件入口与跨文件服务层。
 *
 * 注册视图、命令和 Markdown 处理器，并提供父子导图、搜索、图片、图床、迁移、全局模式和设置持久化。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINDMAP_EXTENSION = void 0;
const obsidian_1 = require("obsidian");
const model_1 = __bundleRequire(1);
const settings_1 = __bundleRequire(3);
const static_render_1 = __bundleRequire(5);
const view_1 = __bundleRequire(8);
const global_search_1 = __bundleRequire(26);
const modes_1 = __bundleRequire(11);
exports.MINDMAP_EXTENSION = "mindmap";
const LEGACY_SUFFIX = ".smm.md";
/**
 * MindMapStudioPlugin 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class MindMapStudioPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.settings = settings_1.DEFAULT_SETTINGS;
        this.legacyMigrationPath = null;
        this.autoUploadTimers = new Map();
        this.searchIndexReady = Promise.resolve();
    }
    /**
     * 执行“onload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    async onload() {
        var _a;
        await this.loadSettings();
        const pluginDir = (_a = this.manifest.dir) !== null && _a !== void 0 ? _a : (0, obsidian_1.normalizePath)(`${this.app.vault.configDir}/plugins/${this.manifest.id}`);
        this.searchIndex = new global_search_1.MindMapSearchIndex(this.app, (0, obsidian_1.normalizePath)(`${pluginDir}/mindmap-search-index.json`), exports.MINDMAP_EXTENSION);
        this.searchIndexReady = this.searchIndex.initialize();
        this.registerView(view_1.VIEW_TYPE_MINDMAP_STUDIO, (leaf) => new view_1.MindMapStudioView(leaf, this));
        // A dedicated extension is the key to reliable reopening: Obsidian routes every
        // .mindmap file directly to the editable TextFileView instead of Markdown view.
        this.registerExtensions([exports.MINDMAP_EXTENSION], view_1.VIEW_TYPE_MINDMAP_STUDIO);
        this.addSettingTab(new settings_1.MindMapStudioSettingTab(this.app, this));
        this.addRibbonIcon("brain-circuit", "新建思维导图", () => void this.createMindMap());
        this.addRibbonIcon("search", "全局搜索思维导图", () => this.openGlobalSearch());
        this.addCommand({
            id: "global-search-mind-maps",
            name: "全局搜索所有思维导图",
            hotkeys: [{ modifiers: ["Mod", "Shift"], key: "F" }],
            callback: () => this.openGlobalSearch()
        });
        this.addCommand({
            id: "rebuild-mind-map-search-index",
            name: "重建思维导图搜索索引",
            callback: () => void this.rebuildGlobalSearchIndex()
        });
        this.addCommand({
            id: "new-mind-map",
            name: "新建思维导图",
            callback: () => void this.createMindMap()
        });
        for (const [mode, name] of [["mindmap", "切换到导图模式"], ["outline", "切换到大纲模式"], ["article", "切换到文章模式"]]) {
            this.addCommand({
                id: `switch-to-${mode}-mode`,
                name,
                checkCallback: (checking) => {
                    var _a;
                    const view = (_a = this.app.workspace.activeLeaf) === null || _a === void 0 ? void 0 : _a.view;
                    const available = view instanceof view_1.MindMapStudioView && this.settings.visibleModes.includes(mode);
                    if (!checking && available && view instanceof view_1.MindMapStudioView)
                        view.setDisplayMode(mode);
                    return available;
                }
            });
        }
        this.addCommand({
            id: "toggle-mind-map-read-only",
            name: "切换导图只读 / 编辑模式",
            checkCallback: (checking) => {
                var _a;
                const view = (_a = this.app.workspace.activeLeaf) === null || _a === void 0 ? void 0 : _a.view;
                const available = view instanceof view_1.MindMapStudioView;
                if (!checking && available && view instanceof view_1.MindMapStudioView)
                    view.toggleReadOnly();
                return available;
            }
        });
        this.addCommand({
            id: "new-mind-map-and-embed",
            name: "新建思维导图并插入当前笔记",
            callback: () => void this.createMindMap({ insertIntoCurrent: true })
        });
        this.addCommand({
            id: "convert-current-markdown",
            name: "将当前 Markdown 转换为思维导图",
            checkCallback: (checking) => {
                const file = this.app.workspace.getActiveFile();
                const available = Boolean(file && file.extension === "md" && !this.isLegacyMindMapFile(file));
                if (!checking && available && file)
                    void this.convertMarkdownFile(file);
                return available;
            }
        });
        this.addCommand({
            id: "migrate-legacy-mind-map",
            name: "将当前旧版脑图转换为 .mindmap",
            checkCallback: (checking) => {
                const file = this.app.workspace.getActiveFile();
                const available = Boolean(file && this.isLegacyMindMapFile(file));
                if (!checking && available && file)
                    void this.migrateLegacyFile(file, true);
                return available;
            }
        });
        this.addCommand({
            id: "open-current-as-mind-map",
            name: "以可编辑思维导图视图重新打开",
            checkCallback: (checking) => {
                var _a;
                const file = this.app.workspace.getActiveFile();
                const available = Boolean(file && this.isMindMapFile(file));
                if (!checking && available && file)
                    void this.openAsMindMap(file, (_a = this.app.workspace.activeLeaf) !== null && _a !== void 0 ? _a : undefined);
                return available;
            }
        });
        this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
            if (file instanceof obsidian_1.TFolder) {
                menu.addItem((item) => item
                    .setTitle("新建思维导图")
                    .setIcon("brain-circuit")
                    .onClick(() => void this.createMindMap({ folder: file.path })));
                return;
            }
            if (!(file instanceof obsidian_1.TFile))
                return;
            if (this.isMindMapFile(file)) {
                menu.addSeparator();
                menu.addItem((item) => item
                    .setTitle("以可编辑思维导图打开")
                    .setIcon("brain-circuit")
                    .onClick(() => void this.openAsMindMap(file)));
            }
            else if (this.isLegacyMindMapFile(file)) {
                menu.addSeparator();
                menu.addItem((item) => item
                    .setTitle("转换为新的 .mindmap 文件")
                    .setIcon("replace")
                    .onClick(() => void this.migrateLegacyFile(file, true)));
            }
        }));
        // Existing users may still have the old Markdown-backed files. When enabled,
        // opening one creates/opens a safe .mindmap copy and leaves the original intact.
        this.registerEvent(this.app.workspace.on("file-open", (file) => {
            if (!file || !this.settings.redirectLegacyFiles || !this.isLegacyMindMapFile(file))
                return;
            if (this.legacyMigrationPath === file.path)
                return;
            window.setTimeout(() => void this.migrateLegacyFile(file, true), 0);
        }));
        this.registerEvent(this.app.vault.on("create", (file) => {
            if (file instanceof obsidian_1.TFile && this.isMindMapFile(file))
                this.searchIndex.queueFile(file, 80);
        }));
        this.registerEvent(this.app.vault.on("modify", (file) => {
            if (file instanceof obsidian_1.TFile && this.isMindMapFile(file))
                this.searchIndex.queueFile(file);
        }));
        this.registerEvent(this.app.vault.on("delete", (file) => {
            if (file instanceof obsidian_1.TFile && file.extension.toLowerCase() === exports.MINDMAP_EXTENSION)
                this.searchIndex.removeFile(file.path);
        }));
        this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
            if (file instanceof obsidian_1.TFile && this.isMindMapFile(file))
                this.searchIndex.renameFile(file, oldPath);
            else if (oldPath.toLowerCase().endsWith(`.${exports.MINDMAP_EXTENSION}`))
                this.searchIndex.removeFile(oldPath);
        }));
        this.registerMarkdownCodeBlockProcessor("mindmap", (source, el, ctx) => {
            (0, static_render_1.renderStaticSource)(el, source, this.getSourceTitle(ctx), (0, settings_1.settingsToAppearance)(this.settings));
        });
        this.registerMarkdownCodeBlockProcessor("mindmap-json", (source, el, ctx) => {
            (0, static_render_1.renderStaticSource)(el, source, this.getSourceTitle(ctx), (0, settings_1.settingsToAppearance)(this.settings));
        });
        // Read-only compatibility for notes that already contain old fenced blocks.
        this.registerMarkdownCodeBlockProcessor("smm", (source, el, ctx) => {
            (0, static_render_1.renderStaticSource)(el, source, this.getSourceTitle(ctx), (0, settings_1.settingsToAppearance)(this.settings));
        });
        this.registerMarkdownCodeBlockProcessor("smm-json", (source, el, ctx) => {
            (0, static_render_1.renderStaticSource)(el, source, this.getSourceTitle(ctx), (0, settings_1.settingsToAppearance)(this.settings));
        });
        this.registerMarkdownPostProcessor((element, context) => void this.processMindMapEmbeds(element, context));
    }
    /**
     * 执行“onunload”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    onunload() {
        var _a;
        for (const timer of this.autoUploadTimers.values())
            window.clearTimeout(timer);
        this.autoUploadTimers.clear();
        (_a = this.searchIndex) === null || _a === void 0 ? void 0 : _a.destroy();
        this.app.workspace.detachLeavesOfType(view_1.VIEW_TYPE_MINDMAP_STUDIO);
    }
    /**
     * 打开global search，并保持模型、界面和持久化状态的一致性。
     */
    openGlobalSearch() {
        void this.openGlobalSearchAfterIndexReady();
    }
    /**
     * 打开global search after index ready，并保持模型、界面和持久化状态的一致性。
     */
    async openGlobalSearchAfterIndexReady() {
        await this.searchIndexReady;
        new global_search_1.GlobalMindMapSearchModal(this.app, this.searchIndex, this.settings.globalSearchMaxResults, (result) => this.openGlobalSearchResult(result), () => this.searchIndex.rebuildAll(), (results, query, replacement, useRegex) => this.replaceAllInSearchResults(results, query, replacement, useRegex)).open();
    }
    /**
     * 打开map family search，并保持模型、界面和持久化状态的一致性。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param currentDocument 该参数用于 open map family search 流程中的输入或控制。
     */
    async openMapFamilySearch(file, currentDocument) {
        await this.searchIndexReady;
        let familyPaths = await this.searchIndex.refreshFamily(file.path, currentDocument);
        new global_search_1.GlobalMindMapSearchModal(this.app, this.searchIndex, this.settings.globalSearchMaxResults, (result) => this.openGlobalSearchResult(result), async () => {
            const refreshed = await this.searchIndex.refreshFamily(file.path, currentDocument);
            familyPaths.clear();
            for (const path of refreshed)
                familyPaths.add(path);
        }, (results, query, replacement, useRegex) => this.replaceAllInSearchResults(results, query, replacement, useRegex), familyPaths, "搜索当前导图及子导图", `“${file.basename}”及递归关联的全部子导图`).open();
    }
    /**
     * 重建global search index，并保持模型、界面和持久化状态的一致性。
     */
    async rebuildGlobalSearchIndex() {
        new obsidian_1.Notice("正在重建思维导图搜索索引…");
        await this.searchIndex.rebuildAll();
        const status = this.searchIndex.getStatus();
        new obsidian_1.Notice(`搜索索引已重建：${status.files} 个导图，${status.nodes} 个节点`);
    }
    /**
     * 读取并返回global search index status，并保持模型、界面和持久化状态的一致性。
     */
    getGlobalSearchIndexStatus() {
        return this.searchIndex.getStatus();
    }
    /**
     * 打开global search result，并保持模型、界面和持久化状态的一致性。
     *
     * @param result 该参数用于 open global search result 流程中的输入或控制。
     */
    async openGlobalSearchResult(result) {
        const file = this.app.vault.getAbstractFileByPath(result.filePath);
        if (!(file instanceof obsidian_1.TFile) || !this.isMindMapFile(file)) {
            this.searchIndex.removeFile(result.filePath);
            new obsidian_1.Notice(`搜索结果对应的导图已不存在：${result.filePath}`);
            return;
        }
        await this.openAsMindMap(file, undefined, result.nodeId);
    }
    /**
     * 批量替换搜索结果中的节点文字。
     */
    async replaceAllInSearchResults(results, query, replacement, useRegex) {
        const byFile = new Map();
        for (const result of results) {
            const list = byFile.get(result.filePath);
            if (list)
                list.push(result);
            else
                byFile.set(result.filePath, [result]);
        }
        const replaceQ = query.trim();
        const replaceIn = (text) => {
            if (!replaceQ || !text)
                return text;
            if (useRegex) {
                try {
                    return text.replace(new RegExp(replaceQ, "g"), replacement);
                }
                catch (_a) {
                    return text;
                }
            }
            // Case-insensitive replace to match search behavior
            try {
                const escaped = replaceQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                return text.replace(new RegExp(escaped, "gi"), replacement);
            }
            catch (_b) {
                return text;
            }
        };
        // We need the original query from the modal; store it temporarily
        let modifiedCount = 0;
        for (const [filePath, fileResults] of byFile) {
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (!(file instanceof obsidian_1.TFile))
                continue;
            try {
                const content = await this.app.vault.read(file);
                const doc = (0, model_1.parseDocument)(content, file.basename);
                const nodeIds = new Set(fileResults.map((r) => r.nodeId));
                const visit = (node) => {
                    if (!nodeIds.has(node.id))
                        return;
                    // Attempt replacement across text, richText runs, and note.
                    // The early-exit check is omitted so regex searches and matches
                    // found via notes/richText also trigger replacement.
                    const oldText = node.text;
                    const newText = replaceIn(oldText);
                    if (newText !== oldText) {
                        node.text = newText;
                        modifiedCount += 1;
                        if (node.richText) {
                            for (const run of node.richText) {
                                const oldRun = run.text;
                                const newRun = replaceIn(oldRun);
                                if (newRun !== oldRun)
                                    run.text = newRun;
                            }
                        }
                    }
                    if (node.note) {
                        const newNote = replaceIn(node.note);
                        if (newNote !== node.note)
                            node.note = newNote;
                    }
                };
                visit(doc.root);
                if (modifiedCount > 0)
                    await this.app.vault.modify(file, (0, model_1.serializeDocument)(doc));
            }
            catch (err) {
                console.warn(`MindMap Studio could not replace in ${filePath}:`, err);
            }
        }
        return modifiedCount;
    }
    /**
     * 加载settings，并保持模型、界面和持久化状态的一致性。
     */
    async loadSettings() {
        var _a;
        let loaded = await this.loadData();
        // One-time migration after the public rename from mindmap-canvas to mindmap-studio.
        if (!loaded) {
            const oldDataPath = (0, obsidian_1.normalizePath)(`${this.app.vault.configDir}/plugins/mindmap-canvas/data.json`);
            try {
                if (await this.app.vault.adapter.exists(oldDataPath)) {
                    loaded = JSON.parse(await this.app.vault.adapter.read(oldDataPath));
                    if (loaded)
                        await this.saveData(loaded);
                }
            }
            catch (error) {
                console.warn("MindMap Studio could not migrate the old settings file", error);
            }
        }
        const hadStoredSettings = loaded !== null && loaded !== undefined;
        const raw = (loaded !== null && loaded !== void 0 ? loaded : {});
        let imageHosts = Array.isArray(raw.imageHosts)
            ? raw.imageHosts.slice(0, 20).flatMap((item, index) => {
                if (!item || typeof item !== "object")
                    return [];
                const candidate = item;
                const host = (0, settings_1.createImageHostConfig)(index + 1);
                host.id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 160) : host.id;
                host.name = typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim().slice(0, 120) : host.name;
                host.enabled = candidate.enabled !== false;
                host.endpoint = typeof candidate.endpoint === "string" ? candidate.endpoint.trim().slice(0, 4000) : "";
                host.method = candidate.method === "PUT" ? "PUT" : "POST";
                host.bodyMode = candidate.bodyMode === "raw" ? "raw" : "multipart";
                host.fieldName = typeof candidate.fieldName === "string" && candidate.fieldName.trim() ? candidate.fieldName.trim().slice(0, 120) : "file";
                host.headers = typeof candidate.headers === "string" ? candidate.headers.trim().slice(0, 20000) : "";
                host.responsePath = typeof candidate.responsePath === "string" ? candidate.responsePath.trim().slice(0, 500) : "data.url";
                return [host];
            })
            : [];
        // Migrate the single-host settings used by MindMap Studio 0.9.x.
        const legacyEndpoint = typeof raw.imageHostEndpoint === "string" ? raw.imageHostEndpoint.trim() : "";
        if (!imageHosts.length && legacyEndpoint) {
            const host = (0, settings_1.createImageHostConfig)(1);
            host.name = "原图床";
            host.endpoint = legacyEndpoint;
            host.method = raw.imageHostMethod === "PUT" ? "PUT" : "POST";
            host.bodyMode = raw.imageHostBodyMode === "raw" ? "raw" : "multipart";
            host.fieldName = typeof raw.imageHostFieldName === "string" && raw.imageHostFieldName.trim() ? raw.imageHostFieldName.trim() : "file";
            host.headers = typeof raw.imageHostHeaders === "string" ? raw.imageHostHeaders.trim() : "";
            host.responsePath = typeof raw.imageHostResponsePath === "string" ? raw.imageHostResponsePath.trim() : "data.url";
            imageHosts = [host];
        }
        const enabledIds = new Set(imageHosts.filter((host) => host.enabled).map((host) => host.id));
        const selectedIds = Array.isArray(raw.autoUploadHostIds)
            ? raw.autoUploadHostIds.filter((id) => typeof id === "string" && enabledIds.has(id))
            : [];
        this.settings = {
            ...settings_1.DEFAULT_SETTINGS,
            ...raw,
            imageHosts,
            autoUploadEnabled: raw.autoUploadEnabled === true,
            autoUploadDelaySeconds: typeof raw.autoUploadDelaySeconds === "number"
                ? Math.max(0, Math.min(300, Math.round(raw.autoUploadDelaySeconds)))
                : settings_1.DEFAULT_SETTINGS.autoUploadDelaySeconds,
            autoUploadHostIds: selectedIds,
            deleteLocalAfterUpload: raw.deleteLocalAfterUpload !== false,
            imageFailoverEnabled: raw.imageFailoverEnabled !== false,
            imageFailoverTimeoutSeconds: typeof raw.imageFailoverTimeoutSeconds === "number"
                ? Math.max(2, Math.min(30, Math.round(raw.imageFailoverTimeoutSeconds)))
                : settings_1.DEFAULT_SETTINGS.imageFailoverTimeoutSeconds,
            imageFailoverUseLocalFallback: raw.imageFailoverUseLocalFallback !== false,
            globalSearchMaxResults: typeof raw.globalSearchMaxResults === "number"
                ? Math.max(20, Math.min(500, Math.round(raw.globalSearchMaxResults)))
                : settings_1.DEFAULT_SETTINGS.globalSearchMaxResults,
            visibleModes: (() => {
                const modes = (0, modes_1.normalizeVisibleModes)(raw.visibleModes);
                if (raw.readingModeInitialized !== true && !modes.includes("reading"))
                    modes.push("reading");
                return modes;
            })(),
            readingModeInitialized: true,
            visibleToolbarItems: (() => {
                const visible = Array.isArray(raw.visibleToolbarItems)
                    ? raw.visibleToolbarItems.filter((id) => typeof id === "string")
                    : [...settings_1.DEFAULT_SETTINGS.visibleToolbarItems];
                const previousOrder = Array.isArray(raw.toolbarItemOrder) ? raw.toolbarItemOrder : [];
                for (const id of ["article-landing", "article-style", "export-document"]) {
                    if (!previousOrder.includes(id) && !visible.includes(id))
                        visible.push(id);
                }
                return visible;
            })(),
            toolbarItemOrder: (() => {
                const validIds = new Set(settings_1.TOOLBAR_ITEMS.map(([id]) => id));
                const stored = Array.isArray(raw.toolbarItemOrder)
                    ? raw.toolbarItemOrder.filter((id) => typeof id === "string" && validIds.has(id))
                    : [];
                return [...new Set([...stored, ...settings_1.DEFAULT_SETTINGS.toolbarItemOrder])];
            })(),
            defaultViewMode: raw.defaultViewMode === "outline" || raw.defaultViewMode === "article" || raw.defaultViewMode === "mindmap" || raw.defaultViewMode === "reading"
                ? raw.defaultViewMode
                : settings_1.DEFAULT_SETTINGS.defaultViewMode,
            readingProgress: typeof raw.readingProgress === "object" && raw.readingProgress
                ? Object.fromEntries(Object.entries(raw.readingProgress).filter((entry) => typeof entry[1] === "number").map(([path, value]) => [path, Math.max(0, Math.min(1, value))]))
                : {},
            articleTocMaxDepth: typeof raw.articleTocMaxDepth === "number"
                ? Math.max(1, Math.min(8, Math.round(raw.articleTocMaxDepth)))
                : settings_1.DEFAULT_SETTINGS.articleTocMaxDepth,
            readingProgressPosition: raw.readingProgressPosition === "bottom" || raw.readingProgressPosition === "left" || raw.readingProgressPosition === "right"
                ? raw.readingProgressPosition
                : "top",
            returnToTopVisibility: (0, settings_1.normalizeReturnToTopVisibility)(raw.returnToTopVisibility),
            twoFingerGestureAction: raw.twoFingerGestureAction === "pan" ? "pan" : "zoom",
            resizeModifier: raw.resizeModifier === "ctrl" ? "ctrl" : "none",
            defaultNodeTextAlign: raw.defaultNodeTextAlign === "left" || raw.defaultNodeTextAlign === "right" || raw.defaultNodeTextAlign === "center"
                ? raw.defaultNodeTextAlign
                : settings_1.DEFAULT_SETTINGS.defaultNodeTextAlign,
            nodeWidthMode: raw.nodeWidthMode === "fixed" || raw.nodeWidthMode === "auto"
                ? raw.nodeWidthMode
                : settings_1.DEFAULT_SETTINGS.nodeWidthMode,
            defaultNodeWidth: typeof raw.defaultNodeWidth === "number"
                ? Math.max(100, Math.min(900, Math.round(raw.defaultNodeWidth)))
                : settings_1.DEFAULT_SETTINGS.defaultNodeWidth,
            autoNodeMaxWidth: typeof raw.autoNodeMaxWidth === "number"
                ? Math.max(120, Math.min(900, Math.round(raw.autoNodeMaxWidth)))
                : settings_1.DEFAULT_SETTINGS.autoNodeMaxWidth,
            defaultThemePreset: [
                "classic-indigo", "ocean-blue", "forest-green", "sunset-orange", "lavender-dream",
                "candy-pop", "paper-note", "minimal-ink", "dark-neon", "mint-clean",
                "spectrum-flow", "executive-navy", "botanical-calm", "midnight-signal", "sketchbook-warm", "monochrome-air"
            ].includes(String(raw.defaultThemePreset)) ? raw.defaultThemePreset : settings_1.DEFAULT_SETTINGS.defaultThemePreset,
            edgeWidthMode: raw.edgeWidthMode === "uniform" || raw.edgeWidthMode === "tapered"
                ? raw.edgeWidthMode
                : hadStoredSettings ? "uniform" : settings_1.DEFAULT_SETTINGS.edgeWidthMode,
            edgeMinWidth: typeof raw.edgeMinWidth === "number"
                ? Math.max(0.25, Math.min(8, raw.edgeMinWidth))
                : settings_1.DEFAULT_SETTINGS.edgeMinWidth,
            rootColor: typeof raw.rootColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.rootColor)
                ? raw.rootColor
                : hadStoredSettings ? "" : settings_1.DEFAULT_SETTINGS.rootColor,
            rootTextColor: typeof raw.rootTextColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.rootTextColor)
                ? raw.rootTextColor
                : hadStoredSettings ? "" : settings_1.DEFAULT_SETTINGS.rootTextColor,
            colorfulBranches: typeof raw.colorfulBranches === "boolean"
                ? raw.colorfulBranches
                : hadStoredSettings ? false : settings_1.DEFAULT_SETTINGS.colorfulBranches,
            branchColors: Array.isArray(raw.branchColors)
                ? raw.branchColors.filter((value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)).slice(0, 12)
                : hadStoredSettings ? [] : [...settings_1.DEFAULT_SETTINGS.branchColors]
        };
        if (raw.backgroundPattern === undefined && raw.showGrid === false)
            this.settings.backgroundPattern = "none";
        if (!this.settings.visibleModes.includes(this.settings.defaultViewMode)) {
            this.settings.defaultViewMode = (_a = this.settings.visibleModes[0]) !== null && _a !== void 0 ? _a : "mindmap";
        }
    }
    /**
     * 保存settings，并保持模型、界面和持久化状态的一致性。
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }
    /**
     * 保存全局显示模式并通知所有已打开 MindMapStudioView 同步切换。之后打开的父导图、子导图和普通导图都会继承该模式。
     *
     * @param mode 当前布局或显示模式。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async setGlobalDisplayMode(mode) {
        if (!this.settings.visibleModes.includes(mode))
            return;
        if (this.settings.defaultViewMode !== mode) {
            this.settings.defaultViewMode = mode;
            await this.saveSettings();
        }
        for (const leaf of this.app.workspace.getLeavesOfType(view_1.VIEW_TYPE_MINDMAP_STUDIO)) {
            if (leaf.view instanceof view_1.MindMapStudioView)
                leaf.view.applyGlobalDisplayMode(mode);
        }
    }
    /**
     * 执行“reset all settings”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    async resetAllSettings() {
        this.settings = JSON.parse(JSON.stringify(settings_1.DEFAULT_SETTINGS));
        await this.saveSettings();
        this.refreshOpenViews();
    }
    /**
     * 刷新open views，并保持模型、界面和持久化状态的一致性。
     */
    refreshOpenViews() {
        for (const leaf of this.app.workspace.getLeavesOfType(view_1.VIEW_TYPE_MINDMAP_STUDIO)) {
            if (leaf.view instanceof view_1.MindMapStudioView)
                leaf.view.refreshAppearance();
        }
    }
    /**
     * 创建configured document，并保持模型、界面和持久化状态的一致性。
     *
     * @param title 文档、节点或导出文件的显示标题。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    createConfiguredDocument(title) {
        const document = (0, model_1.createDefaultDocument)(title);
        document.layout = this.settings.defaultLayout;
        document.theme = this.settings.defaultTheme;
        document.appearance = (0, settings_1.settingsToAppearance)(this.settings);
        document.view = { readOnly: false };
        return document;
    }
    /**
     * 解析并确定mind map file，并保持模型、界面和持久化状态的一致性。
     *
     * @param path 仓库内目标路径。
     * @param sourcePath 该参数用于 resolve mind map file 流程中的输入或控制。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    resolveMindMapFile(path, sourcePath = "") {
        var _a, _b;
        const cleaned = (_b = (_a = path.replace(/^\[\[|\]\]$/g, "").split("|")[0]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : path;
        const normalized = (0, obsidian_1.normalizePath)(cleaned);
        const direct = this.app.vault.getAbstractFileByPath(normalized);
        if (direct instanceof obsidian_1.TFile && this.isMindMapFile(direct))
            return direct;
        const linked = this.app.metadataCache.getFirstLinkpathDest(cleaned, sourcePath);
        return linked instanceof obsidian_1.TFile && this.isMindMapFile(linked) ? linked : null;
    }
    /**
     * 执行“read mind map document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param file 目标 Obsidian 文件对象。
     * @returns 异步操作完成后的结果。
     */
    async readMindMapDocument(file) {
        return (0, model_1.parseDocument)(await this.app.vault.cachedRead(file), file.basename);
    }
    /**
     * 按自动或手动文章层级查找目标节点的绝对深度，而不是直接使用物理树深度。
     *
     * @param root 节点树的根节点。
     * @param nodeId 目标节点的稳定标识。
     * @param baseDepth 当前物理导图根节点的跨文件基础层级。
     * @returns 目标节点的文章层级；不存在时返回 null。
     */
    findArticleNodeDepth(root, nodeId, baseDepth = 0) {
        var _a, _b;
        return (_b = (_a = (0, modes_1.buildArticleNodeInfo)(root, baseDepth).find((entry) => entry.node.id === nodeId)) === null || _a === void 0 ? void 0 : _a.depth) !== null && _b !== void 0 ? _b : null;
    }
    /**
     * 执行“compute article base depth”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param document 要处理的思维导图文档。
     * @param visited 该参数用于 compute article base depth 流程中的输入或控制。
     * @returns 计算得到的数值结果。
     */
    async computeArticleBaseDepth(file, document, visited = new Set()) {
        var _a, _b, _c;
        if (visited.has(file.path) || !((_a = document.navigation) === null || _a === void 0 ? void 0 : _a.parentPath))
            return 0;
        visited.add(file.path);
        const parentFile = this.resolveMindMapFile(document.navigation.parentPath, file.path);
        if (!parentFile)
            return 0;
        const parentDocument = await this.readMindMapDocument(parentFile);
        const parentBase = await this.computeArticleBaseDepth(parentFile, parentDocument, visited);
        let parentNodeId = document.navigation.parentNodeId;
        if (!parentNodeId) {
            const currentPath = (0, obsidian_1.normalizePath)(file.path);
            parentNodeId = (_b = (0, model_1.flattenNodes)(parentDocument.root).find((node) => {
                var _a, _b;
                if (!((_a = node.submap) === null || _a === void 0 ? void 0 : _a.path))
                    return false;
                return ((_b = this.resolveMindMapFile(node.submap.path, parentFile.path)) === null || _b === void 0 ? void 0 : _b.path) === currentPath;
            })) === null || _b === void 0 ? void 0 : _b.id;
        }
        return parentNodeId
            ? (_c = this.findArticleNodeDepth(parentDocument.root, parentNodeId, parentBase)) !== null && _c !== void 0 ? _c : parentBase + 1
            : parentBase + 1;
    }
    /**
     * 沿子导图 navigation.parentPath 逐级回溯父文件，计算当前子导图在整篇文章中的基础标题深度、完整面包屑和顶层目录数据，并防止循环引用。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param document 要处理的思维导图文档。
     * @returns 计算得到的数值结果。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async buildArticleContext(file, document) {
        var _a, _b;
        const baseDepth = await this.computeArticleBaseDepth(file, document);
        let topFile = file;
        let topDocument = document;
        const ancestorPaths = new Set([file.path]);
        while ((_a = topDocument.navigation) === null || _a === void 0 ? void 0 : _a.parentPath) {
            const parentFile = this.resolveMindMapFile(topDocument.navigation.parentPath, topFile.path);
            if (!parentFile || ancestorPaths.has(parentFile.path))
                break;
            ancestorPaths.add(parentFile.path);
            topFile = parentFile;
            topDocument = await this.readMindMapDocument(parentFile);
        }
        const isTopLevel = topFile.path === file.path;
        const tocEntries = [];
        const readingSections = [{ filePath: topFile.path, document: topDocument, baseDepth: 0 }];
        const visitedFiles = new Set([topFile.path]);
        let hasSubmaps = false;
        const processItems = async (items, defaultLevel) => {
            var _a, _b;
            const siblingHasHeading = items.some(({ node }) => (0, modes_1.isArticleHeading)(node));
            const numberedIndexes = new Map();
            for (const item of items) {
                const { node, file: sourceFile, breadcrumb } = item;
                const numbering = (0, modes_1.resolveArticleNumbering)(node, defaultLevel, siblingHasHeading);
                const numberedIndex = numbering.shouldNumber && !numbering.skipped
                    ? ((_a = numberedIndexes.get(numbering.level)) !== null && _a !== void 0 ? _a : 0) + 1
                    : 0;
                if (numberedIndex)
                    numberedIndexes.set(numbering.level, numberedIndex);
                const label = numberedIndex ? (0, modes_1.articleNumberLabel)(numbering.level, numberedIndex) : "";
                const title = (0, model_1.nodePlainText)(node) || (numbering.isHeading ? "未命名标题" : "");
                const nextBreadcrumb = [...breadcrumb, title || "未命名标题"];
                const tocEntry = numbering.isHeading
                    ? {
                        filePath: sourceFile.path,
                        nodeId: node.id,
                        depth: numbering.level,
                        label,
                        title,
                        displayTitle: (0, modes_1.articleDisplayTitle)(label, title),
                        breadcrumb: nextBreadcrumb
                    }
                    : null;
                if (tocEntry)
                    tocEntries.push(tocEntry);
                const descendants = node.children.map((child) => ({
                    node: child,
                    file: sourceFile,
                    document: item.document,
                    breadcrumb: nextBreadcrumb
                }));
                if ((_b = node.submap) === null || _b === void 0 ? void 0 : _b.path) {
                    hasSubmaps = true;
                    const childFile = this.resolveMindMapFile(node.submap.path, sourceFile.path);
                    if (childFile && tocEntry) {
                        tocEntry.filePath = childFile.path;
                        tocEntry.nodeId = undefined;
                    }
                    if (childFile && !visitedFiles.has(childFile.path)) {
                        visitedFiles.add(childFile.path);
                        try {
                            const childDocument = await this.readMindMapDocument(childFile);
                            readingSections.push({ filePath: childFile.path, document: childDocument, baseDepth: numbering.level });
                            descendants.push(...childDocument.root.children.map((child) => ({
                                node: child,
                                file: childFile,
                                document: childDocument,
                                breadcrumb: nextBreadcrumb
                            })));
                        }
                        catch (error) {
                            console.warn(`MindMap Studio could not read child map for article TOC: ${childFile.path}`, error);
                        }
                    }
                }
                if (descendants.length)
                    await processItems(descendants, numbering.level + 1);
            }
        };
        await processItems(topDocument.root.children.map((node) => ({
            node,
            file: topFile,
            document: topDocument,
            breadcrumb: [(0, model_1.nodePlainText)(topDocument.root) || topDocument.title]
        })), (0, modes_1.articleChildStartLevel)(topDocument.root));
        const currentIndex = tocEntries.findIndex((entry) => entry.filePath === file.path);
        const parentFile = ((_b = document.navigation) === null || _b === void 0 ? void 0 : _b.parentPath)
            ? this.resolveMindMapFile(document.navigation.parentPath, file.path)
            : null;
        const navigation = tocEntries.length
            ? {
                entries: tocEntries,
                currentIndex: Math.max(0, currentIndex),
                homePath: topFile.path,
                parentPath: parentFile === null || parentFile === void 0 ? void 0 : parentFile.path
            }
            : undefined;
        return {
            baseDepth,
            tocEntries,
            showToc: isTopLevel && hasSubmaps && tocEntries.length > 0,
            navigation,
            readingSections
        };
    }
    /**
     * Collects the current map and every reachable child map without walking up
     * to its parent. This is the export counterpart of continuous reading.
     *
     * @param file Current physical mind-map file.
     * @param document Current parsed mind-map document.
     * @returns Ordered maps with their absolute depth relative to the current map.
     */
    async buildDescendantReadingSections(file, document) {
        const sections = [{ filePath: file.path, document, baseDepth: 0 }];
        const visited = new Set([file.path]);
        const visit = async (nodes, sourceFile, defaultLevel) => {
            var _a;
            const siblingHasHeading = nodes.some((node) => (0, modes_1.isArticleHeading)(node));
            for (const node of nodes) {
                const numbering = (0, modes_1.resolveArticleNumbering)(node, defaultLevel, siblingHasHeading);
                if ((_a = node.submap) === null || _a === void 0 ? void 0 : _a.path) {
                    const childFile = this.resolveMindMapFile(node.submap.path, sourceFile.path);
                    if (childFile && !visited.has(childFile.path)) {
                        visited.add(childFile.path);
                        try {
                            const childDocument = await this.readMindMapDocument(childFile);
                            sections.push({ filePath: childFile.path, document: childDocument, baseDepth: numbering.level });
                            await visit(childDocument.root.children, childFile, (0, modes_1.articleChildStartLevel)(childDocument.root, numbering.level));
                        }
                        catch (error) {
                            console.warn(`MindMap Studio could not read child map for export: ${childFile.path}`, error);
                        }
                    }
                }
                if (node.children.length)
                    await visit(node.children, sourceFile, numbering.level + 1);
            }
        };
        await visit(document.root.children, file, (0, modes_1.articleChildStartLevel)(document.root));
        return sections;
    }
    /**
     * 读取并返回available path，并保持模型、界面和持久化状态的一致性。
     *
     * @param preferredPath 该参数用于 get available path 流程中的输入或控制。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    async getAvailablePath(preferredPath) {
        const normalized = (0, obsidian_1.normalizePath)(preferredPath);
        if (!this.app.vault.getAbstractFileByPath(normalized))
            return normalized;
        const dot = normalized.lastIndexOf(".");
        const base = dot > normalized.lastIndexOf("/") ? normalized.slice(0, dot) : normalized;
        const extension = dot > normalized.lastIndexOf("/") ? normalized.slice(dot) : "";
        let index = 2;
        while (this.app.vault.getAbstractFileByPath(`${base} ${index}${extension}`))
            index += 1;
        return `${base} ${index}${extension}`;
    }
    /**
     * 创建mind map，并保持模型、界面和持久化状态的一致性。
     *
     * @param options 控制当前操作行为的可选配置。
     * @returns 异步操作完成后的结果。
     */
    async createMindMap(options = {}) {
        var _a, _b;
        const activeBefore = this.app.workspace.getActiveFile();
        const folder = await this.resolveFolder(options.folder, activeBefore);
        const title = (_a = options.title) !== null && _a !== void 0 ? _a : this.buildNewTitle();
        const filename = this.sanitizeFilename(title);
        const path = await this.getAvailablePath((0, obsidian_1.normalizePath)(`${folder ? `${folder}/` : ""}${filename}.${exports.MINDMAP_EXTENSION}`));
        const document = (_b = options.document) !== null && _b !== void 0 ? _b : this.createConfiguredDocument(title);
        const file = await this.app.vault.create(path, (0, model_1.serializeDocument)(document));
        if (options.insertIntoCurrent && activeBefore && activeBefore.extension === "md" && activeBefore.path !== file.path) {
            const embed = `\n\n![[${file.path}]]\n`;
            const current = await this.app.vault.read(activeBefore);
            await this.app.vault.modify(activeBefore, `${current.trimEnd()}${embed}`);
        }
        await this.openAsMindMap(file);
        return file;
    }
    /**
     * 打开as mind map，并保持模型、界面和持久化状态的一致性。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param preferredLeaf 该参数用于 open as mind map 流程中的输入或控制。
     * @param focusNodeId 该参数用于 open as mind map 流程中的输入或控制。
     */
    async openAsMindMap(file, preferredLeaf, focusNodeId) {
        const leaf = preferredLeaf !== null && preferredLeaf !== void 0 ? preferredLeaf : this.app.workspace.getLeaf(false);
        await leaf.setViewState({
            type: view_1.VIEW_TYPE_MINDMAP_STUDIO,
            state: { file: file.path },
            active: true
        });
        this.app.workspace.revealLeaf(leaf);
        if (focusNodeId && leaf.view instanceof view_1.MindMapStudioView) {
            window.setTimeout(() => leaf.view instanceof view_1.MindMapStudioView && leaf.view.focusNode(focusNodeId), 30);
        }
    }
    /**
     * 保存pasted image，并保持模型、界面和持久化状态的一致性。
     *
     * @param blob 该参数用于 save pasted image 流程中的输入或控制。
     * @param suggestedName 该参数用于 save pasted image 流程中的输入或控制。
     * @param sourceFile 该参数用于 save pasted image 流程中的输入或控制。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    async savePastedImage(blob, suggestedName, sourceFile) {
        var _a, _b, _c, _d;
        // 图片资源目录按当前脑图所在目录解析，而不是按仓库根目录解析。
        // 例如 Projects/Plan.mindmap + MindMap Assets =>
        // Projects/MindMap Assets/Plan-20260720-123456.png
        const sourceFolder = (_b = (_a = sourceFile === null || sourceFile === void 0 ? void 0 : sourceFile.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : "";
        const configuredFolder = (0, obsidian_1.normalizePath)((this.settings.assetFolder || "MindMap Assets").replace(/^\/+|\/+$/g, ""));
        const folder = (0, obsidian_1.normalizePath)([sourceFolder, configuredFolder].filter(Boolean).join("/"));
        await this.ensureFolderPath(folder);
        const now = new Date();
        const two = (value) => String(value).padStart(2, "0");
        const stamp = `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
        const extension = ((_c = suggestedName.split(".").at(-1)) === null || _c === void 0 ? void 0 : _c.replace(/[^a-z0-9]/gi, "").toLowerCase()) || "png";
        const base = this.sanitizeFilename((_d = sourceFile === null || sourceFile === void 0 ? void 0 : sourceFile.basename) !== null && _d !== void 0 ? _d : "mindmap");
        const preferred = (0, obsidian_1.normalizePath)(`${folder}/${base}-${stamp}.${extension}`);
        const path = await this.getAvailablePath(preferred);
        await this.app.vault.createBinary(path, await blob.arrayBuffer());
        return path;
    }
    /**
     * 执行“read image source”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param source 待解析或渲染的原始文本。
     * @param sourceFile 该参数用于 read image source 流程中的输入或控制。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    async readImageSource(source, sourceFile) {
        var _a, _b, _c, _d, _e;
        const raw = source.trim();
        if (!raw || /^https?:\/\//i.test(raw) || /^data:/i.test(raw) || /^blob:/i.test(raw))
            return null;
        const wikiMatch = raw.match(/^!?\[\[([\s\S]+?)\]\]$/);
        const target = (_d = (_c = (_b = ((_a = wikiMatch === null || wikiMatch === void 0 ? void 0 : wikiMatch[1]) !== null && _a !== void 0 ? _a : raw).split("|")[0]) === null || _b === void 0 ? void 0 : _b.split("#")[0]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : raw;
        const direct = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(target));
        const file = direct instanceof obsidian_1.TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(target, (_e = sourceFile === null || sourceFile === void 0 ? void 0 : sourceFile.path) !== null && _e !== void 0 ? _e : "");
        if (!(file instanceof obsidian_1.TFile))
            return null;
        const binary = await this.app.vault.readBinary(file);
        return { blob: new Blob([binary], { type: this.mimeFromFilename(file.name) }), suggestedName: file.name };
    }
    /**
     * 读取并返回image host choices，并保持模型、界面和持久化状态的一致性。
     * @returns 按当前规则构建的集合结果。
     */
    getImageHostChoices() {
        return this.settings.imageHosts
            .filter((host) => host.enabled && Boolean(host.endpoint.trim()))
            .map((host) => ({ id: host.id, name: host.name }));
    }
    /**
     * 读取并返回default upload host ids，并保持模型、界面和持久化状态的一致性。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    getDefaultUploadHostIds() {
        const enabled = new Set(this.getImageHostChoices().map((host) => host.id));
        return this.settings.autoUploadHostIds.filter((id) => enabled.has(id));
    }
    /**
     * 把同一张图片上传到多个已配置图床，分别收集成功与失败结果。只有所有选中图床成功且文档保存完成后，调用方才允许删除本地文件。
     *
     * @param blob 该参数用于 upload image to hosts 流程中的输入或控制。
     * @param suggestedName 该参数用于 upload image to hosts 流程中的输入或控制。
     * @param hostIds 需要执行上传的图床标识列表。
     * @returns 异步操作完成后的结果。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async uploadImageToHosts(blob, suggestedName, hostIds) {
        const requested = Array.from(new Set(hostIds));
        const hosts = requested
            .map((id) => this.settings.imageHosts.find((host) => host.id === id))
            .filter((host) => Boolean((host === null || host === void 0 ? void 0 : host.enabled) && host.endpoint.trim()));
        if (!hosts.length)
            throw new Error("没有选择可用图床");
        const settled = await Promise.all(hosts.map(async (host) => {
            try {
                const url = await this.uploadImageToHostConfig(host, blob, suggestedName);
                return { ok: true, value: { hostId: host.id, hostName: host.name, url } };
            }
            catch (error) {
                return {
                    ok: false,
                    value: {
                        hostId: host.id,
                        hostName: host.name,
                        error: error instanceof Error ? error.message : String(error)
                    }
                };
            }
        }));
        return {
            successes: settled.filter((item) => item.ok).map((item) => item.value),
            failures: settled.filter((item) => !item.ok).map((item) => item.value)
        };
    }
    /**
     * 执行“test image host”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param hostId 该参数用于 test image host 流程中的输入或控制。
     */
    async testImageHost(hostId) {
        const host = this.settings.imageHosts.find((item) => item.id === hostId);
        if (!host) {
            new obsidian_1.Notice("找不到该图床配置");
            return;
        }
        if (!host.endpoint.trim()) {
            new obsidian_1.Notice(`请先填写 ${host.name} 的上传 API`);
            return;
        }
        // A real 1×1 transparent PNG tests authentication, request format and response parsing.
        const png = new Uint8Array([
            137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
            0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
            0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 240, 31,
            0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68,
            174, 66, 96, 130
        ]);
        const started = performance.now();
        try {
            const url = await this.uploadImageToHostConfig(host, new Blob([png], { type: "image/png" }), "mindmap-studio-api-test.png");
            const elapsed = Math.max(1, Math.round(performance.now() - started));
            new obsidian_1.Notice(`${host.name} 连接成功（${elapsed} ms）\n${url}`, 8000);
        }
        catch (error) {
            console.error("MindMap Studio image host connectivity test failed", error);
            new obsidian_1.Notice(`${host.name} 连接失败：${error instanceof Error ? error.message : String(error)}`, 8000);
        }
    }
    /**
     * 安排延迟执行auto upload，并保持模型、界面和持久化状态的一致性。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param nodeId 目标节点的稳定标识。
     * @param blockId 该参数用于 schedule auto upload 流程中的输入或控制。
     * @param localPath 该参数用于 schedule auto upload 流程中的输入或控制。
     * @param suggestedName 该参数用于 schedule auto upload 流程中的输入或控制。
     * @returns 操作条件是否成立或处理是否成功。
     */
    scheduleAutoUpload(file, nodeId, blockId, localPath, suggestedName) {
        if (!file || !this.settings.autoUploadEnabled)
            return false;
        const hostIds = this.getDefaultUploadHostIds();
        if (!hostIds.length) {
            new obsidian_1.Notice("图片已保存到本地；自动上传未选择可用图床", 5000);
            return false;
        }
        const key = `${file.path}::${nodeId}::${blockId}`;
        const existing = this.autoUploadTimers.get(key);
        if (existing !== undefined)
            window.clearTimeout(existing);
        const delay = Math.max(0, Math.min(300, this.settings.autoUploadDelaySeconds)) * 1000;
        const timer = window.setTimeout(() => {
            this.autoUploadTimers.delete(key);
            void this.runAutoUploadTask(file.path, nodeId, blockId, localPath, suggestedName, hostIds);
        }, delay);
        this.autoUploadTimers.set(key, timer);
        return true;
    }
    /**
     * 执行延迟自动上传任务。它确认节点和图片块仍存在、读取本地资源、上传到默认图床、更新远程镜像列表并保存；任一图床失败时保留本地文件。
     *
     * @param mindMapPath 该参数用于 run auto upload task 流程中的输入或控制。
     * @param nodeId 目标节点的稳定标识。
     * @param blockId 该参数用于 run auto upload task 流程中的输入或控制。
     * @param localPath 该参数用于 run auto upload task 流程中的输入或控制。
     * @param suggestedName 该参数用于 run auto upload task 流程中的输入或控制。
     * @param hostIds 需要执行上传的图床标识列表。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async runAutoUploadTask(mindMapPath, nodeId, blockId, localPath, suggestedName, hostIds) {
        var _a, _b;
        try {
            await this.flushOpenView(mindMapPath);
            const mapFile = this.app.vault.getAbstractFileByPath(mindMapPath);
            const localFile = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(localPath));
            if (!(mapFile instanceof obsidian_1.TFile) || !(localFile instanceof obsidian_1.TFile))
                return;
            const document = (0, model_1.parseDocument)(await this.app.vault.read(mapFile), mapFile.basename);
            const node = (0, model_1.findNode)(document.root, nodeId);
            const block = (_a = node === null || node === void 0 ? void 0 : node.content) === null || _a === void 0 ? void 0 : _a.find((item) => item.type === "image" && item.id === blockId);
            if (!node || !block || (block.source !== localPath && block.localSource !== localPath))
                return;
            const binary = await this.app.vault.readBinary(localFile);
            const blob = new Blob([binary], { type: this.mimeFromFilename(localFile.name) });
            const batch = await this.uploadImageToHosts(blob, suggestedName || localFile.name, hostIds);
            const uploadedAt = new Date().toISOString();
            const remoteByHost = new Map(((_b = block.remoteSources) !== null && _b !== void 0 ? _b : []).map((item) => [item.hostId, item]));
            for (const success of batch.successes) {
                remoteByHost.set(success.hostId, { ...success, uploadedAt });
            }
            block.remoteSources = Array.from(remoteByHost.values());
            block.localSource = localPath;
            const allSucceeded = batch.failures.length === 0 && batch.successes.length === hostIds.length;
            if (allSucceeded && batch.successes[0])
                block.source = batch.successes[0].url;
            (0, model_1.syncNodeLegacyFields)(node);
            await this.app.vault.modify(mapFile, (0, model_1.serializeDocument)(document));
            await this.refreshOpenMindMap(mapFile, document);
            let deleted = false;
            if (allSucceeded && this.settings.deleteLocalAfterUpload) {
                deleted = await this.deleteLocalAssetIfSafe(localPath, mindMapPath, blockId);
                if (deleted) {
                    block.localSource = undefined;
                    await this.app.vault.modify(mapFile, (0, model_1.serializeDocument)(document));
                    await this.refreshOpenMindMap(mapFile, document);
                }
            }
            if (allSucceeded) {
                const targets = batch.successes.map((item) => item.hostName).join("、");
                const suffix = this.settings.deleteLocalAfterUpload
                    ? deleted ? "，本地图片已安全删除" : "，本地图片因仍被引用或删除失败而保留"
                    : "，本地图片已保留";
                new obsidian_1.Notice(`图片已上传到 ${targets}${suffix}`, 7000);
            }
            else {
                const ok = batch.successes.map((item) => item.hostName).join("、") || "无";
                const failed = batch.failures.map((item) => `${item.hostName}：${item.error}`).join("；");
                new obsidian_1.Notice(`图片仅部分上传成功。成功：${ok}；失败：${failed}。本地图片已保留。`, 9000);
            }
        }
        catch (error) {
            console.error("MindMap Studio automatic image upload failed", error);
            new obsidian_1.Notice(`图片自动上传失败，本地图片已保留：${error instanceof Error ? error.message : String(error)}`, 8000);
        }
    }
    /**
     * 上传image to host config，并保持模型、界面和持久化状态的一致性。
     *
     * @param host 当前图床配置或图床选择项。
     * @param blob 该参数用于 upload image to host config 流程中的输入或控制。
     * @param suggestedName 该参数用于 upload image to host config 流程中的输入或控制。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    async uploadImageToHostConfig(host, blob, suggestedName) {
        const endpoint = host.endpoint.trim();
        if (!endpoint)
            throw new Error("上传 API 为空");
        let headers = {};
        if (host.headers.trim()) {
            const parsed = JSON.parse(host.headers);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
                throw new Error("请求头 JSON 必须是对象");
            headers = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
        }
        const filename = this.sanitizeFilename(suggestedName || "mindmap-image.png");
        const mime = blob.type || "application/octet-stream";
        let body;
        let contentType = mime;
        if (host.bodyMode === "multipart") {
            const boundary = `----MindMapStudio${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
            const encoder = new TextEncoder();
            const fieldName = (host.fieldName || "file").replaceAll('"', "");
            const safeFilename = filename.replaceAll('"', "");
            const head = encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${safeFilename}"\r\nContent-Type: ${mime}\r\n\r\n`);
            const file = new Uint8Array(await blob.arrayBuffer());
            const tail = encoder.encode(`\r\n--${boundary}--\r\n`);
            const combined = new Uint8Array(head.length + file.length + tail.length);
            combined.set(head, 0);
            combined.set(file, head.length);
            combined.set(tail, head.length + file.length);
            body = combined.buffer;
            contentType = `multipart/form-data; boundary=${boundary}`;
        }
        else {
            body = await blob.arrayBuffer();
        }
        const response = await (0, obsidian_1.requestUrl)({
            url: endpoint,
            method: host.method,
            contentType,
            headers,
            body,
            throw: true
        });
        let payload;
        try {
            payload = response.json;
        }
        catch (_a) {
            payload = undefined;
        }
        if (!payload && response.text) {
            try {
                payload = JSON.parse(response.text);
            }
            catch (_b) {
                payload = response.text;
            }
        }
        const getPath = (value, path) => path.split(".").filter(Boolean).reduce((current, key) => current && typeof current === "object" ? current[key] : undefined, value);
        const candidates = [host.responsePath.trim(), "data.url", "url", "result.url", "result.image", "image.url", "src"].filter(Boolean);
        for (const path of candidates) {
            const value = getPath(payload, path);
            if (typeof value === "string" && /^https?:\/\//i.test(value.trim()))
                return value.trim();
        }
        if (typeof payload === "string") {
            const match = payload.match(/https?:\/\/[^\s"'<>]+/i);
            if (match === null || match === void 0 ? void 0 : match[0])
                return match[0];
        }
        throw new Error("返回结果中没有找到图片网址");
    }
    /**
     * 执行“flush open view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param path 仓库内目标路径。
     */
    async flushOpenView(path) {
        var _a;
        for (const leaf of this.app.workspace.getLeavesOfType(view_1.VIEW_TYPE_MINDMAP_STUDIO)) {
            if (leaf.view instanceof view_1.MindMapStudioView && ((_a = leaf.view.file) === null || _a === void 0 ? void 0 : _a.path) === path)
                await leaf.view.save();
        }
    }
    /**
     * 刷新open mind map，并保持模型、界面和持久化状态的一致性。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param document 要处理的思维导图文档。
     */
    async refreshOpenMindMap(file, document) {
        var _a;
        const source = (0, model_1.serializeDocument)(document);
        for (const leaf of this.app.workspace.getLeavesOfType(view_1.VIEW_TYPE_MINDMAP_STUDIO)) {
            if (leaf.view instanceof view_1.MindMapStudioView && ((_a = leaf.view.file) === null || _a === void 0 ? void 0 : _a.path) === file.path)
                leaf.view.setViewData(source, false);
        }
    }
    /**
     * 在删除本地图片前进行最终安全检查：远程源必须存在、当前文档必须已保存、资源路径必须是仓库内文件且没有其他节点继续引用。
     *
     * @param localPath 该参数用于 delete local asset if safe 流程中的输入或控制。
     * @param currentMindMapPath 该参数用于 delete local asset if safe 流程中的输入或控制。
     * @param blockId 该参数用于 delete local asset if safe 流程中的输入或控制。
     * @returns 操作条件是否成立或处理是否成功。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async deleteLocalAssetIfSafe(localPath, currentMindMapPath, blockId) {
        const normalized = (0, obsidian_1.normalizePath)(localPath);
        const target = this.app.vault.getAbstractFileByPath(normalized);
        if (!(target instanceof obsidian_1.TFile))
            return false;
        const current = this.app.vault.getAbstractFileByPath(currentMindMapPath);
        if (current instanceof obsidian_1.TFile) {
            const doc = (0, model_1.parseDocument)(await this.app.vault.read(current), current.basename);
            const stillUsed = (0, model_1.flattenNodes)(doc.root).some((node) => (0, model_1.nodeContentBlocks)(node).some((block) => block.type === "image" && block.id !== blockId && (block.source === normalized || block.localSource === normalized)));
            if (stillUsed)
                return false;
        }
        for (const file of this.app.vault.getFiles()) {
            if (file.path === currentMindMapPath || file.extension.toLowerCase() !== exports.MINDMAP_EXTENSION)
                continue;
            try {
                const text = await this.app.vault.cachedRead(file);
                if (text.includes(normalized))
                    return false;
            }
            catch (_a) {
                // Ignore an unreadable unrelated map and keep checking other files.
            }
        }
        try {
            await this.app.vault.delete(target);
            return true;
        }
        catch (error) {
            console.warn("MindMap Studio could not delete uploaded local image", error);
            return false;
        }
    }
    /**
     * 执行“mime from filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param filename 该参数用于 mime from filename 流程中的输入或控制。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    mimeFromFilename(filename) {
        var _a, _b;
        const extension = (_a = filename.split(".").at(-1)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        return (_b = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp", avif: "image/avif" }[extension !== null && extension !== void 0 ? extension : ""]) !== null && _b !== void 0 ? _b : "application/octet-stream";
    }
    /**
     * 在父导图资源目录下创建子导图文件，写入 parentPath、parentNodeId 和 parentTitle，并把生成路径回写到父节点，实现可靠的双向导航。
     *
     * @param parentFile 该参数用于 create submap file 流程中的输入或控制。
     * @param node 当前处理的节点。
     * @returns 异步操作完成后的结果。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async createSubmapFile(parentFile, node) {
        var _a, _b;
        const title = ((0, model_1.nodePlainText)(node) || "子导图").trim();
        const document = this.createConfiguredDocument(title);
        document.root.children = [];
        document.root.content = [{ id: document.root.id + "_title", type: "text", text: title }];
        (0, model_1.syncNodeLegacyFields)(document.root);
        // 1.4.2: parent navigation is handled by the dedicated breadcrumb bar,
        // not by injecting a backlink onto the submap root node.
        document.root.link = undefined;
        document.title = title;
        document.navigation = {
            parentPath: parentFile.path,
            parentNodeId: node.id,
            parentTitle: parentFile.basename,
            parentNodeText: (0, model_1.nodePlainText)(node) || undefined
        };
        // 子导图不再与父文件平铺。目录结构固定为：
        // 父文件所在目录 / 资源文件夹 / 父导图文件名 / 子导图.mindmap
        const parentFolder = (_b = (_a = parentFile.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : "";
        const configuredAssets = (0, obsidian_1.normalizePath)(this.settings.assetFolder || "MindMap Assets");
        const parentMapFolder = this.sanitizeFilename(parentFile.basename);
        const submapFolder = (0, obsidian_1.normalizePath)([parentFolder, configuredAssets, parentMapFolder].filter(Boolean).join("/"));
        await this.ensureFolderPath(submapFolder);
        const path = await this.getAvailablePath((0, obsidian_1.normalizePath)(`${submapFolder}/${this.sanitizeFilename(title)}.${exports.MINDMAP_EXTENSION}`));
        const file = await this.app.vault.create(path, (0, model_1.serializeDocument)(document));
        return { path: file.path, title: file.basename };
    }
    /**
     * Moves a linked child mind-map file to the system trash.
     *
     * @param parentFile Parent map used to resolve relative paths.
     * @param submap Stored child-map link.
     * @returns Whether a physical child-map file was found and deleted.
     */
    async deleteSubmapFile(parentFile, submap) {
        const target = this.resolveMindMapFile(submap.path, parentFile.path);
        if (!target)
            return false;
        await this.app.vault.trash(target, true);
        return true;
    }
    /**
     * 打开mind map path，并保持模型、界面和持久化状态的一致性。
     *
     * @param path 仓库内目标路径。
     * @param sourcePath 该参数用于 open mind map path 流程中的输入或控制。
     * @param preferredLeaf 该参数用于 open mind map path 流程中的输入或控制。
     * @param focusNodeId 该参数用于 open mind map path 流程中的输入或控制。
     */
    async openMindMapPath(path, sourcePath = "", preferredLeaf, focusNodeId) {
        const normalized = (0, obsidian_1.normalizePath)(path.replace(/^\[\[|\]\]$/g, ""));
        const direct = this.app.vault.getAbstractFileByPath(normalized);
        const resolved = direct instanceof obsidian_1.TFile ? direct : this.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
        if (!(resolved instanceof obsidian_1.TFile) || !this.isMindMapFile(resolved)) {
            new obsidian_1.Notice(`找不到子导图：${path}`);
            return;
        }
        await this.openAsMindMap(resolved, preferredLeaf, focusNodeId);
    }
    /**
     * 执行“ensure folder path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param folder 目标 Obsidian 文件夹对象。
     */
    async ensureFolderPath(folder) {
        const normalized = (0, obsidian_1.normalizePath)(folder);
        if (!normalized || this.app.vault.getAbstractFileByPath(normalized) instanceof obsidian_1.TFolder)
            return;
        const parts = normalized.split("/").filter(Boolean);
        let current = "";
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            if (!this.app.vault.getAbstractFileByPath(current))
                await this.app.vault.createFolder(current);
        }
    }
    /**
     * 迁移legacy file，并保持模型、界面和持久化状态的一致性。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param openAfter 该参数用于 migrate legacy file 流程中的输入或控制。
     * @returns 异步操作完成后的结果。
     */
    async migrateLegacyFile(file, openAfter = true) {
        var _a, _b, _c;
        if (!this.isLegacyMindMapFile(file))
            return null;
        if (this.legacyMigrationPath === file.path)
            return null;
        this.legacyMigrationPath = file.path;
        try {
            const source = await this.app.vault.read(file);
            const title = file.basename.replace(/\.smm$/i, "") || "思维导图";
            const document = (0, model_1.parseDocument)(source, title);
            const parentPath = (_b = (_a = file.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : "";
            const preferredPath = (0, obsidian_1.normalizePath)(`${parentPath ? `${parentPath}/` : ""}${this.sanitizeFilename(title)}.${exports.MINDMAP_EXTENSION}`);
            const existing = this.app.vault.getAbstractFileByPath(preferredPath);
            let target;
            if (existing instanceof obsidian_1.TFile && this.isMindMapFile(existing)) {
                target = existing;
            }
            else {
                const path = existing ? await this.getAvailablePath(preferredPath) : preferredPath;
                target = await this.app.vault.create(path, (0, model_1.serializeDocument)(document));
                new obsidian_1.Notice(`已转换为可编辑脑图：${target.path}\n原文件已保留作为备份。`, 7000);
            }
            if (openAfter)
                await this.openAsMindMap(target, (_c = this.app.workspace.activeLeaf) !== null && _c !== void 0 ? _c : undefined);
            return target;
        }
        catch (error) {
            console.error("MindMap Studio legacy migration failed", error);
            new obsidian_1.Notice("旧版脑图转换失败，原文件未被修改。", 6000);
            return null;
        }
        finally {
            this.legacyMigrationPath = null;
        }
    }
    /**
     * 判断mind map file，并保持模型、界面和持久化状态的一致性。
     *
     * @param file 目标 Obsidian 文件对象。
     * @returns 操作条件是否成立或处理是否成功。
     */
    isMindMapFile(file) {
        return file.extension.toLowerCase() === exports.MINDMAP_EXTENSION;
    }
    /**
     * 判断legacy mind map file，并保持模型、界面和持久化状态的一致性。
     *
     * @param file 目标 Obsidian 文件对象。
     * @returns 操作条件是否成立或处理是否成功。
     */
    isLegacyMindMapFile(file) {
        return file.path.toLowerCase().endsWith(LEGACY_SUFFIX);
    }
    /**
     * 转换markdown file，并保持模型、界面和持久化状态的一致性。
     *
     * @param file 目标 Obsidian 文件对象。
     */
    async convertMarkdownFile(file) {
        var _a, _b;
        const source = await this.app.vault.read(file);
        const title = file.basename;
        const document = (0, model_1.markdownToDocument)(source, title);
        document.layout = this.settings.defaultLayout;
        document.theme = this.settings.defaultTheme;
        document.appearance = (0, settings_1.settingsToAppearance)(this.settings);
        await this.createMindMap({ document, title: `${title} 脑图`, folder: (_b = (_a = file.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : "" });
    }
    /**
     * 解析并确定folder，并保持模型、界面和持久化状态的一致性。
     *
     * @param explicitFolder 该参数用于 resolve folder 流程中的输入或控制。
     * @param activeFile 该参数用于 resolve folder 流程中的输入或控制。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    async resolveFolder(explicitFolder, activeFile) {
        var _a;
        const candidate = explicitFolder !== null && explicitFolder !== void 0 ? explicitFolder : (this.settings.defaultFolder || ((_a = activeFile === null || activeFile === void 0 ? void 0 : activeFile.parent) === null || _a === void 0 ? void 0 : _a.path) || "");
        if (!candidate)
            return "";
        const normalized = (0, obsidian_1.normalizePath)(candidate);
        const existing = this.app.vault.getAbstractFileByPath(normalized);
        if (existing instanceof obsidian_1.TFolder)
            return normalized;
        await this.ensureFolderPath(normalized);
        return normalized;
    }
    /**
     * 构建new title，并保持模型、界面和持久化状态的一致性。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    buildNewTitle() {
        const now = new Date();
        const two = (value) => String(value).padStart(2, "0");
        const stamp = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())} ${two(now.getHours())}${two(now.getMinutes())}`;
        return `${this.settings.filePrefix} ${stamp}`.trim();
    }
    /**
     * 执行“sanitize filename”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param value 待校验、转换或比较的输入值。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    sanitizeFilename(value) {
        return value.replace(/[\\/:*?"<>|#[\]]/g, "-").replace(/\s+/g, " ").trim() || "思维导图";
    }
    /**
     * 读取并返回source title，并保持模型、界面和持久化状态的一致性。
     *
     * @param context 该参数用于 get source title 流程中的输入或控制。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    getSourceTitle(context) {
        const sourceFile = this.app.vault.getAbstractFileByPath(context.sourcePath);
        return sourceFile instanceof obsidian_1.TFile ? sourceFile.basename : "思维导图";
    }
    /**
     * 注册 Markdown 代码块静态渲染，并在阅读模式中解析嵌入的思维导图源。静态预览不会修改原文件。
     *
     * @param element 该参数用于 process mind map embeds 流程中的输入或控制。
     * @param context 该参数用于 process mind map embeds 流程中的输入或控制。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async processMindMapEmbeds(element, context) {
        var _a, _b, _c, _d, _e;
        const embeds = Array.from(element.querySelectorAll(".internal-embed"));
        for (const embed of embeds) {
            if (embed.dataset.mmcProcessed === "true")
                continue;
            const rawSource = (_b = (_a = embed.getAttribute("src")) !== null && _a !== void 0 ? _a : embed.dataset.src) !== null && _b !== void 0 ? _b : "";
            const linkPath = (_e = (_d = (_c = rawSource.split("#")[0]) === null || _c === void 0 ? void 0 : _c.split("|")[0]) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : "";
            if (!linkPath.toLowerCase().endsWith(`.${exports.MINDMAP_EXTENSION}`))
                continue;
            const file = this.app.metadataCache.getFirstLinkpathDest(linkPath, context.sourcePath);
            if (!(file instanceof obsidian_1.TFile) || !this.isMindMapFile(file))
                continue;
            embed.dataset.mmcProcessed = "true";
            try {
                const source = await this.app.vault.cachedRead(file);
                const document = (0, model_1.parseDocument)(source, file.basename);
                (0, static_render_1.renderStaticMindMap)(embed, document, { app: this.app, file, maxHeight: this.settings.embedMaxHeight, defaultAppearance: (0, settings_1.settingsToAppearance)(this.settings) });
            }
            catch (error) {
                console.error("MindMap Studio embed render failed", error);
                embed.empty();
                embed.createDiv({ cls: "mmc-embed-error", text: "无法加载思维导图预览" });
            }
        }
    }
    /**
     * 将指定节点及其后代提取为独立子导图文件。
     * @param parentFile 当前父导图文件。
     * @param node 要提取的节点（及其后代）。
     * @returns 创建的子导图引用。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async extractToSubmap(parentFile, node) {
        var _a, _b, _c;
        const title = ((0, model_1.nodePlainText)(node) || "子导图").trim();
        const document = this.createConfiguredDocument(title);
        document.root.children = JSON.parse(JSON.stringify(node.children));
        if (node.content)
            document.root.content = JSON.parse(JSON.stringify(node.content));
        if (node.richText)
            document.root.richText = JSON.parse(JSON.stringify(node.richText));
        document.root.note = node.note;
        document.root.tags = (_a = node.tags) === null || _a === void 0 ? void 0 : _a.slice();
        document.root.task = node.task;
        document.root.icon = node.icon;
        if (node.code)
            document.root.code = JSON.parse(JSON.stringify(node.code));
        if (node.table)
            document.root.table = JSON.parse(JSON.stringify(node.table));
        document.root.link = undefined;
        (0, model_1.syncNodeLegacyFields)(document.root);
        document.title = title;
        document.navigation = {
            parentPath: parentFile.path,
            parentNodeId: node.id,
            parentTitle: parentFile.basename,
            parentNodeText: (0, model_1.nodePlainText)(node) || undefined
        };
        const parentFolder = (_c = (_b = parentFile.parent) === null || _b === void 0 ? void 0 : _b.path) !== null && _c !== void 0 ? _c : "";
        const configuredAssets = (0, obsidian_1.normalizePath)(this.settings.assetFolder || "MindMap Assets");
        const parentMapFolder = this.sanitizeFilename(parentFile.basename);
        const submapFolder = (0, obsidian_1.normalizePath)([parentFolder, configuredAssets, parentMapFolder].filter(Boolean).join("/"));
        await this.ensureFolderPath(submapFolder);
        const path = await this.getAvailablePath((0, obsidian_1.normalizePath)(submapFolder + "/" + this.sanitizeFilename(title) + "." + exports.MINDMAP_EXTENSION));
        const file = await this.app.vault.create(path, (0, model_1.serializeDocument)(document));
        return { path: file.path, title: file.basename };
    }
    /**
     * 将当前子导图合并回其父导图。
     * @param submapFile 当前子导图文件。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async mergeFromSubmap(submapFile) {
        var _a;
        const submapContent = await this.app.vault.read(submapFile);
        const submapDoc = (0, model_1.parseDocument)(submapContent, submapFile.basename);
        const parentPath = (_a = submapDoc.navigation) === null || _a === void 0 ? void 0 : _a.parentPath;
        if (!parentPath) {
            new obsidian_1.Notice("此子导图没有父导图引用，无法合并");
            return;
        }
        const parentFile = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(parentPath));
        if (!(parentFile instanceof obsidian_1.TFile)) {
            new obsidian_1.Notice("父导图文件不存在");
            return;
        }
        const parentContent = await this.app.vault.read(parentFile);
        const parentDoc = (0, model_1.parseDocument)(parentContent, parentFile.basename);
        let targetNode = null;
        const searchParent = (node) => {
            var _a;
            if (targetNode)
                return;
            if ((_a = node.submap) === null || _a === void 0 ? void 0 : _a.path) {
                const resolved = this.resolveMindMapFile(node.submap.path, parentFile.path);
                if ((resolved === null || resolved === void 0 ? void 0 : resolved.path) === submapFile.path) {
                    targetNode = node;
                    return;
                }
            }
            for (const child of node.children)
                searchParent(child);
        };
        searchParent(parentDoc.root);
        if (!targetNode) {
            new obsidian_1.Notice("父导图中找不到链接到该子导图的节点");
            return;
        }
        const merged = JSON.parse(JSON.stringify(submapDoc.root.children));
        targetNode.children.push(...merged);
        targetNode.submap = undefined;
        await this.app.vault.modify(parentFile, (0, model_1.serializeDocument)(parentDoc));
        await this.app.vault.trash(submapFile, true);
        new obsidian_1.Notice("已合并到 " + parentFile.basename + " 并删除子导图");
        await this.openMindMapPath(parentFile.path, "", undefined);
    }
}
exports.default = MindMapStudioPlugin;

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/main.ts
},
1: function(module, exports, __bundleRequire, require) {
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
const node_tree_1 = __bundleRequire(2);
var node_tree_2 = __bundleRequire(2);
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
    var _a;
    if (!input)
        return undefined;
    const rawNodeVisualStyle = String((_a = input.nodeVisualStyle) !== null && _a !== void 0 ? _a : "");
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
        branchColors: (branchColors === null || branchColors === void 0 ? void 0 : branchColors.length) ? branchColors : undefined,
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
    return { ...(base !== null && base !== void 0 ? base : {}), ...(override !== null && override !== void 0 ? override : {}) };
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
    return JSON.stringify(style !== null && style !== void 0 ? style : {});
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
    var _a;
    return (_a = runs === null || runs === void 0 ? void 0 : runs.map((run) => run.text).join("")) !== null && _a !== void 0 ? _a : fallbackText;
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
    if (!(runs === null || runs === void 0 ? void 0 : runs.length))
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
    var _a, _b;
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
        nextStyles[index] = { ...((_a = previousStyles[index]) !== null && _a !== void 0 ? _a : {}) };
    for (let index = 0; index < suffix; index += 1) {
        const previousIndex = previousText.length - suffix + index;
        const nextIndex = nextText.length - suffix + index;
        nextStyles[nextIndex] = { ...((_b = previousStyles[previousIndex]) !== null && _b !== void 0 ? _b : {}) };
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
        return { id, type: "image", source, alt, localSource, remoteSources: (remoteSources === null || remoteSources === void 0 ? void 0 : remoteSources.length) ? remoteSources : undefined };
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
    var _a, _b;
    const candidates = [];
    const seen = new Set();
    const add = (candidate) => {
        const source = candidate.source.trim();
        if (!source || seen.has(source))
            return;
        seen.add(source);
        candidates.push({ ...candidate, source });
    };
    const currentRemote = (_a = block.remoteSources) === null || _a === void 0 ? void 0 : _a.find((item) => item.url === block.source);
    add({
        source: block.source,
        label: (currentRemote === null || currentRemote === void 0 ? void 0 : currentRemote.hostName) || (currentRemote ? "当前图床" : "当前图片"),
        hostId: currentRemote === null || currentRemote === void 0 ? void 0 : currentRemote.hostId,
        hostName: currentRemote === null || currentRemote === void 0 ? void 0 : currentRemote.hostName,
        kind: "current"
    });
    const remotes = (_b = block.remoteSources) !== null && _b !== void 0 ? _b : [];
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
    var _a, _b;
    if (Array.isArray(node.content) && node.content.length) {
        const normalized = node.content.map(normalizeContentBlock).filter((block) => Boolean(block));
        if (normalized.length)
            return normalized;
    }
    const blocks = [];
    if ((_a = node.image) === null || _a === void 0 ? void 0 : _a.trim())
        blocks.push({ id: newId(), type: "image", source: node.image.trim(), alt: node.text || undefined });
    if (node.text || ((_b = node.richText) === null || _b === void 0 ? void 0 : _b.length)) {
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
    var _a;
    const first = nodeContentBlocks(node).find((block) => block.type === "text");
    return (_a = first === null || first === void 0 ? void 0 : first.text.trim()) !== null && _a !== void 0 ? _a : "";
}
/**
 * 将新的有序 content 内容块同步回 text、richText 和 image 等旧字段。该桥接保证旧版本插件、旧导出逻辑和新内容块模型能够同时工作。
 *
 * @param node 当前处理的节点。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function syncNodeLegacyFields(node) {
    var _a, _b, _c, _d;
    const blocks = nodeContentBlocks(node);
    node.content = blocks.length ? blocks : undefined;
    const textBlocks = blocks.filter((block) => block.type === "text");
    const imageBlocks = blocks.filter((block) => block.type === "image");
    node.text = textBlocks.map((block) => block.text).join(" ").trim();
    node.richText = textBlocks.length === 1 ? normalizeRichText((_a = textBlocks[0]) === null || _a === void 0 ? void 0 : _a.richText, (_c = (_b = textBlocks[0]) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : "") : undefined;
    node.image = (_d = imageBlocks[0]) === null || _d === void 0 ? void 0 : _d.source;
}
/**
 * 校验并规范化cell，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalizeCell(value) {
    return typeof value === "string" ? value.trim().slice(0, 2000) : String(value !== null && value !== void 0 ? value : "").trim().slice(0, 2000);
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
    var _a, _b, _c;
    const fallbackNodeText = typeof (input === null || input === void 0 ? void 0 : input.text) === "string" ? input.text : fallbackText;
    const normalizedContent = Array.isArray(input === null || input === void 0 ? void 0 : input.content)
        ? input.content.map(normalizeContentBlock).filter((block) => Boolean(block))
        : [];
    if (!normalizedContent.length) {
        if (typeof (input === null || input === void 0 ? void 0 : input.image) === "string" && input.image.trim()) {
            normalizedContent.push({ id: newId(), type: "image", source: input.image.trim(), alt: fallbackNodeText || undefined });
        }
        const richText = normalizeRichText(input === null || input === void 0 ? void 0 : input.richText, fallbackNodeText);
        const text = richTextPlainText(richText, fallbackNodeText);
        if (text)
            normalizedContent.push({ id: newId(), type: "text", text, richText });
    }
    const textBlocks = normalizedContent.filter((block) => block.type === "text");
    const imageBlocks = normalizedContent.filter((block) => block.type === "image");
    const text = textBlocks.map((block) => block.text).join(" ").trim();
    const requestedNumberingMode = input === null || input === void 0 ? void 0 : input.articleNumberingMode;
    const articleNumberingMode = requestedNumberingMode === "manual" || requestedNumberingMode === "none"
        ? requestedNumberingMode
        : (input === null || input === void 0 ? void 0 : input.skipArticleNumbering) === true ? "none" : undefined;
    const articleNumberingLevel = articleNumberingMode === "manual" && Number.isFinite(input === null || input === void 0 ? void 0 : input.articleNumberingLevel)
        ? Math.min(8, Math.max(1, Math.floor((_a = input === null || input === void 0 ? void 0 : input.articleNumberingLevel) !== null && _a !== void 0 ? _a : 1)))
        : undefined;
    return {
        id: typeof (input === null || input === void 0 ? void 0 : input.id) === "string" && input.id ? input.id : newId(),
        text,
        richText: textBlocks.length === 1 ? (_b = textBlocks[0]) === null || _b === void 0 ? void 0 : _b.richText : undefined,
        content: normalizedContent.length ? normalizedContent : undefined,
        note: typeof (input === null || input === void 0 ? void 0 : input.note) === "string" && input.note.trim() ? input.note.trim() : undefined,
        link: typeof (input === null || input === void 0 ? void 0 : input.link) === "string" && input.link.trim() ? input.link.trim() : undefined,
        image: (_c = imageBlocks[0]) === null || _c === void 0 ? void 0 : _c.source,
        table: normalizeTable(input === null || input === void 0 ? void 0 : input.table),
        code: normalizeCode(input === null || input === void 0 ? void 0 : input.code),
        submap: normalizeSubmap(input === null || input === void 0 ? void 0 : input.submap),
        icon: typeof (input === null || input === void 0 ? void 0 : input.icon) === "string" && input.icon.trim() ? input.icon.trim().slice(0, 12) : undefined,
        tags: normalizeTags(input === null || input === void 0 ? void 0 : input.tags),
        task: normalizeTask(input === null || input === void 0 ? void 0 : input.task),
        articleNumberingMode,
        articleNumberingLevel,
        skipArticleNumbering: articleNumberingMode === "none" || undefined,
        style: normalizeStyle(input === null || input === void 0 ? void 0 : input.style),
        collapsed: (input === null || input === void 0 ? void 0 : input.collapsed) === true || undefined,
        children: Array.isArray(input === null || input === void 0 ? void 0 : input.children)
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
    const zoom = typeof input.zoom === "number" ? Math.min(2.5, Math.max(0.2, input.zoom)) : undefined;
    const panX = typeof input.panX === "number" && Number.isFinite(input.panX) ? input.panX : undefined;
    const panY = typeof input.panY === "number" && Number.isFinite(input.panY) ? input.panY : undefined;
    return mode !== undefined || readOnly !== undefined || articleLandingMode !== undefined || zoom !== undefined || panX !== undefined || panY !== undefined
        ? { mode, readOnly, articleLandingMode, zoom, panX, panY }
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
    const title = typeof (input === null || input === void 0 ? void 0 : input.title) === "string" && input.title.trim() ? input.title.trim() : fallbackTitle;
    return {
        version: 10,
        title,
        layout: (input === null || input === void 0 ? void 0 : input.layout) === "balanced" ? "balanced" : "right",
        theme: (input === null || input === void 0 ? void 0 : input.theme) === "light" || (input === null || input === void 0 ? void 0 : input.theme) === "dark" ? input.theme : "auto",
        appearance: normalizeAppearance(input === null || input === void 0 ? void 0 : input.appearance),
        navigation: normalizeNavigation(input === null || input === void 0 ? void 0 : input.navigation),
        view: normalizeDocumentView(input === null || input === void 0 ? void 0 : input.view),
        articleStyle: normalizeArticleStyle(input === null || input === void 0 ? void 0 : input.articleStyle),
        root: normalizeNode(input === null || input === void 0 ? void 0 : input.root, title)
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
    catch (_a) {
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
    var _a, _b;
    const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = source.match(new RegExp("```" + escaped + "\\s*([\\s\\S]*?)```", "i"));
    return (_b = (_a = match === null || match === void 0 ? void 0 : match[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : null;
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
        var _a, _b, _c, _d, _e, _f, _g;
        const values = [nodePlainText(node), (_a = node.note) !== null && _a !== void 0 ? _a : "", (_b = node.link) !== null && _b !== void 0 ? _b : "", ...nodeContentBlocks(node).filter((block) => block.type === "image").map((block) => block.source), (_d = (_c = node.submap) === null || _c === void 0 ? void 0 : _c.path) !== null && _d !== void 0 ? _d : ""];
        for (const value of values) {
            let match;
            while ((match = pattern.exec(value)) !== null) {
                if (match[1])
                    links.add(match[1].trim());
            }
            pattern.lastIndex = 0;
        }
        const explicitLink = (_e = node.link) === null || _e === void 0 ? void 0 : _e.trim();
        if (explicitLink && !/^https?:\/\//i.test(explicitLink) && !explicitLink.includes("[[")) {
            const target = (_g = (_f = explicitLink.split("|")[0]) === null || _f === void 0 ? void 0 : _f.split("#")[0]) === null || _g === void 0 ? void 0 : _g.trim();
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
    var _a, _b;
    const match = value.match(/\[\[([^\]|#]+(?:#[^\]|]+)?)(?:\|[^\]]+)?\]\]/);
    return (_b = (_a = match === null || match === void 0 ? void 0 : match[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : null;
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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return [nodePlainText(node), node.note, node.link, ...nodeContentBlocks(node).map((block) => { var _a; return block.type === "image" ? `${block.source} ${(_a = block.alt) !== null && _a !== void 0 ? _a : ""}` : block.text; }), node.icon, (_a = node.submap) === null || _a === void 0 ? void 0 : _a.path, (_b = node.code) === null || _b === void 0 ? void 0 : _b.language, (_c = node.code) === null || _c === void 0 ? void 0 : _c.code, ...((_e = (_d = node.table) === null || _d === void 0 ? void 0 : _d.headers) !== null && _e !== void 0 ? _e : []), ...((_g = (_f = node.table) === null || _f === void 0 ? void 0 : _f.rows.flat()) !== null && _g !== void 0 ? _g : []), ...((_h = node.tags) !== null && _h !== void 0 ? _h : [])]
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
    if (!(runs === null || runs === void 0 ? void 0 : runs.length))
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
        var _a, _b;
        const alignment = (_b = (_a = table.alignments) === null || _a === void 0 ? void 0 : _a[index]) !== null && _b !== void 0 ? _b : "left";
        return alignment === "center" ? ":---:" : alignment === "right" ? "---:" : "---";
    });
    const separator = `| ${alignments.join(" | ")} |`;
    const rows = table.rows.map((row) => `| ${table.headers.map((_, index) => { var _a; return escapeCell((_a = row[index]) !== null && _a !== void 0 ? _a : ""); }).join(" | ")} |`);
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
    var _a, _b, _c, _d, _e, _f, _g;
    const lines = markdown.split(/\r?\n/);
    for (let index = 0; index < lines.length - 1; index += 1) {
        const headerLine = (_b = (_a = lines[index]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
        const separatorLine = (_d = (_c = lines[index + 1]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
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
            const rowLine = (_f = (_e = lines[rowIndex]) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : "";
            if (!rowLine || !rowLine.includes("|"))
                break;
            const row = splitMarkdownTableRow(rowLine).slice(0, headers.length);
            while (row.length < headers.length)
                row.push("");
            rows.push(row);
        }
        return (_g = normalizeTable({ headers, rows, alignments, source: "markdown" })) !== null && _g !== void 0 ? _g : null;
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
    var _a, _b, _c;
    const match = markdown.match(/```([^\n`]*)\n([\s\S]*?)\n```/);
    if (!match)
        return null;
    return (_c = normalizeCode({ language: (_a = match[1]) === null || _a === void 0 ? void 0 : _a.trim(), code: (_b = match[2]) !== null && _b !== void 0 ? _b : "" })) !== null && _c !== void 0 ? _c : null;
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
        rows: node.children.map((child) => {
            var _a, _b, _c;
            return [
                nodePlainText(child),
                (_a = child.note) !== null && _a !== void 0 ? _a : "",
                child.task === "done" ? "已完成" : child.task === "doing" ? "进行中" : child.task === "todo" ? "待办" : "",
                (_c = (_b = child.tags) === null || _b === void 0 ? void 0 : _b.join(", ")) !== null && _c !== void 0 ? _c : "",
                String(child.children.length)
            ];
        }),
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
    var _a, _b;
    const renderBlocks = (node) => {
        var _a;
        const result = [];
        for (const block of nodeContentBlocks(node)) {
            if (block.type === "text") {
                const value = richTextToMarkdown(block.richText, block.text);
                if (value)
                    result.push(value);
            }
            else {
                result.push(`![${escapeInlineMarkdown((_a = block.alt) !== null && _a !== void 0 ? _a : "图片")}](${block.source})`);
            }
        }
        return result;
    };
    const rootBlocks = renderBlocks(doc.root);
    const rootTitle = (_a = rootBlocks.find((value) => !value.startsWith("!["))) !== null && _a !== void 0 ? _a : doc.title;
    const rootSuffix = ((_b = doc.root.tags) === null || _b === void 0 ? void 0 : _b.length) ? ` ${doc.root.tags.map((tag) => `#${tag}`).join(" ")}` : "";
    const lines = [`# ${doc.root.icon ? `${doc.root.icon} ` : ""}${rootTitle}${rootSuffix}`];
    rootBlocks.filter((value) => value !== rootTitle).forEach((value) => lines.push(value));
    const visit = (node, depth) => {
        var _a, _b, _c, _d;
        const indent = "  ".repeat(Math.max(0, depth - 1));
        const tags = ((_a = node.tags) === null || _a === void 0 ? void 0 : _a.length) ? ` ${node.tags.map((tag) => `#${tag}`).join(" ")}` : "";
        const link = node.link ? ` → ${node.link}` : "";
        const blocks = renderBlocks(node);
        const firstText = (_b = blocks.find((value) => !value.startsWith("!["))) !== null && _b !== void 0 ? _b : ((_c = blocks[0]) !== null && _c !== void 0 ? _c : "图片节点");
        lines.push(`${indent}- ${taskPrefix(node.task)}${node.icon ? `${node.icon} ` : ""}${firstText}${tags}${link}`);
        blocks.filter((value) => value !== firstText).forEach((value) => lines.push(`${indent}  ${value}`));
        if (node.note)
            lines.push(`${indent}  > ${node.note.replaceAll("\n", " ")}`);
        if (node.submap)
            lines.push(`${indent}  > 子导图：[[${node.submap.path}]]`);
        if (node.table)
            lines.push("", ...tableToMarkdown(node.table).split("\n").map((line) => `${indent}  ${line}`), "");
        if (node.code)
            lines.push(`${indent}  \`\`\`${(_d = node.code.language) !== null && _d !== void 0 ? _d : ""}`, ...node.code.code.split("\n").map((line) => `${indent}  ${line}`), `${indent}  \`\`\``);
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
    var _a;
    const match = value.match(/^\[( |x|X|-)\]\s+(.+)$/);
    if (!match)
        return { text: value };
    const marker = match[1];
    const task = marker === "x" || marker === "X" ? "done" : marker === "-" ? "doing" : "todo";
    return { text: ((_a = match[2]) === null || _a === void 0 ? void 0 : _a.trim()) || "任务", task };
}
/**
 * 执行“markdown to document”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param markdown 待解析或生成的 Markdown 文本。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function markdownToDocument(markdown, fallbackTitle = "思维导图") {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
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
        var _a;
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
            const boldText = (_a = match[1]) !== null && _a !== void 0 ? _a : "";
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
                const target = (_b = currentBoldNode !== null && currentBoldNode !== void 0 ? currentBoldNode : (_a = stack.at(-1)) === null || _a === void 0 ? void 0 : _a.node) !== null && _b !== void 0 ? _b : doc.root;
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
            const level = (_d = (_c = heading[1]) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 1;
            const text = (_f = (_e = heading[2]) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : "节点";
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
                while (stack.length > 1 && ((_h = (_g = stack.at(-1)) === null || _g === void 0 ? void 0 : _g.level) !== null && _h !== void 0 ? _h : 0) >= level)
                    stack.pop();
                const parent = (_k = (_j = stack.at(-1)) === null || _j === void 0 ? void 0 : _j.node) !== null && _k !== void 0 ? _k : doc.root;
                parent.children.push(node);
                stack.push({ level, node, kind: "heading" });
            }
            continue;
        }
        if (skippingTableOfContents)
            continue;
        if (quote) {
            const parent = (_m = (_l = stack.at(-1)) === null || _l === void 0 ? void 0 : _l.node) !== null && _m !== void 0 ? _m : doc.root;
            parent.children.push(createMarkdownNode(((_o = quote[1]) === null || _o === void 0 ? void 0 : _o.trim()) || "引用"));
            hasLeadingContent || (hasLeadingContent = !rootAssigned);
            continue;
        }
        if (boldOutline) {
            const text = ((_p = boldOutline[1]) === null || _p === void 0 ? void 0 : _p.trim()) || "节点";
            if (!rootAssigned && !doc.root.children.length && stack.length === 1) {
                applyMarkdownText(doc.root, text, "节点", true);
                doc.title = doc.root.text;
                rootAssigned = true;
                currentBoldNode = doc.root;
                continue;
            }
            const isTheme = /^主题\s*[一二三四五六七八九十百千万零〇○0-9]+/.test(text);
            const parent = isTheme ? doc.root : currentBoldTheme !== null && currentBoldTheme !== void 0 ? currentBoldTheme : doc.root;
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
        const listMatch = bullet !== null && bullet !== void 0 ? bullet : numbered;
        if (listMatch) {
            const spaces = ((_q = listMatch[1]) !== null && _q !== void 0 ? _q : "").replaceAll("\t", "  ").length;
            const parentLevel = (_s = (_r = [...stack].reverse().find((entry) => entry.kind === "heading" || entry.kind === "bold")) === null || _r === void 0 ? void 0 : _r.level) !== null && _s !== void 0 ? _s : 1;
            const level = parentLevel + Math.floor(spaces / 2) + 1;
            const parsed = parseTaskText(((_t = listMatch[2]) !== null && _t !== void 0 ? _t : "节点").trim());
            const node = createMarkdownNode(parsed.text);
            node.task = parsed.task;
            while (stack.length > 1 && ((_v = (_u = stack.at(-1)) === null || _u === void 0 ? void 0 : _u.level) !== null && _v !== void 0 ? _v : 0) >= level)
                stack.pop();
            const parent = (_x = (_w = stack.at(-1)) === null || _w === void 0 ? void 0 : _w.node) !== null && _x !== void 0 ? _x : doc.root;
            parent.children.push(node);
            stack.push({ level, node, kind: "list" });
            currentBoldNode = node;
            continue;
        }
        if (currentBoldNode) {
            currentBoldNode.children.push(createMarkdownNode(line.trim()));
            continue;
        }
        const parent = (_y = stack.at(-1)) === null || _y === void 0 ? void 0 : _y.node;
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
            const target = (_0 = currentBoldNode !== null && currentBoldNode !== void 0 ? currentBoldNode : (_z = stack.at(-1)) === null || _z === void 0 ? void 0 : _z.node) !== null && _0 !== void 0 ? _0 : doc.root;
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
        var _a, _b, _c;
        const match = line.match(/^([ \t]*)(.*?)\s*$/);
        const whitespace = ((_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : "").replaceAll("\t", "    ").length;
        return { indent: whitespace, text: (_c = (_b = match === null || match === void 0 ? void 0 : match[2]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "" };
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

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/core/model.ts
},
2: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file node-tree.ts
 * @description 思维导图节点树的遍历、查找、删除与相对移动操作。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkNodes = walkNodes;
exports.flattenNodes = flattenNodes;
exports.findNode = findNode;
exports.findParent = findParent;
exports.findAncestors = findAncestors;
exports.containsNode = containsNode;
exports.removeNode = removeNode;
exports.moveNodeRelative = moveNodeRelative;
/** 深度优先遍历节点树，并提供每个节点的父节点。 */
function walkNodes(root, visitor) {
    const visit = (node, parent) => {
        visitor(node, parent);
        node.children.forEach((child) => visit(child, node));
    };
    visit(root, null);
}
/** 按深度优先顺序展平节点树。 */
function flattenNodes(root) {
    const nodes = [];
    walkNodes(root, (node) => nodes.push(node));
    return nodes;
}
/** 按稳定标识查找节点。 */
function findNode(root, id) {
    let result = null;
    walkNodes(root, (node) => {
        if (node.id === id)
            result = node;
    });
    return result;
}
/** 查找指定节点的直接父节点。 */
function findParent(root, id) {
    let result = null;
    walkNodes(root, (node, parent) => {
        if (node.id === id)
            result = parent;
    });
    return result;
}
/** 返回从根节点到目标节点父级的祖先路径。 */
function findAncestors(root, id) {
    const path = [];
    const visit = (node) => {
        if (node.id === id)
            return true;
        for (const child of node.children) {
            path.push(node);
            if (visit(child))
                return true;
            path.pop();
        }
        return false;
    };
    return visit(root) ? path : [];
}
/** 判断节点树是否包含指定标识。 */
function containsNode(root, id) {
    return findNode(root, id) !== null;
}
/** 从节点树中删除指定节点；根节点本身不会被删除。 */
function removeNode(root, id) {
    var _a;
    for (let index = 0; index < root.children.length; index += 1) {
        if (((_a = root.children[index]) === null || _a === void 0 ? void 0 : _a.id) === id) {
            root.children.splice(index, 1);
            return true;
        }
        const child = root.children[index];
        if (child && removeNode(child, id))
            return true;
    }
    return false;
}
/**
 * 将节点移动到目标节点之前、之后或内部。
 *
 * @returns 实际发生结构变更时返回 true。
 */
function moveNodeRelative(root, draggedId, targetId, position) {
    if (draggedId === root.id || draggedId === targetId)
        return false;
    const dragged = findNode(root, draggedId);
    const target = findNode(root, targetId);
    if (!dragged || !target || containsNode(dragged, targetId))
        return false;
    const oldParent = findParent(root, draggedId);
    if (!oldParent)
        return false;
    const oldIndex = oldParent.children.findIndex((child) => child.id === draggedId);
    if (oldIndex < 0)
        return false;
    if (position === "child") {
        if (oldParent.id === target.id && oldIndex === target.children.length - 1)
            return false;
        oldParent.children.splice(oldIndex, 1);
        target.children.push(dragged);
        target.collapsed = false;
        return true;
    }
    if (target.id === root.id)
        return false;
    const targetParent = findParent(root, targetId);
    if (!targetParent)
        return false;
    const targetIndexBeforeRemoval = targetParent.children.findIndex((child) => child.id === targetId);
    if (targetIndexBeforeRemoval < 0)
        return false;
    let insertIndex = targetIndexBeforeRemoval + (position === "after" ? 1 : 0);
    if (oldParent.id === targetParent.id) {
        const currentDesiredIndex = position === "after" ? targetIndexBeforeRemoval + 1 : targetIndexBeforeRemoval;
        if (oldIndex === currentDesiredIndex || (position === "after" && oldIndex === targetIndexBeforeRemoval + 1))
            return false;
        if (oldIndex < insertIndex)
            insertIndex -= 1;
    }
    oldParent.children.splice(oldIndex, 1);
    targetParent.children.splice(insertIndex, 0, dragged);
    return true;
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/core/node-tree.ts
},
3: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file settings.ts
 * @description 插件设置模型和设置页。
 *
 * 集中管理显示模式、节点默认样式、图床、图片容灾、搜索索引和一键恢复，并在保存后刷新打开视图。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MindMapStudioSettingTab = exports.DEFAULT_SETTINGS = exports.TOOLBAR_ITEMS = void 0;
exports.createImageHostConfig = createImageHostConfig;
exports.normalizeReturnToTopVisibility = normalizeReturnToTopVisibility;
exports.settingsToAppearance = settingsToAppearance;
exports.applyThemePresetToSettings = applyThemePresetToSettings;
const obsidian_1 = require("obsidian");
const themes_1 = __bundleRequire(4);
exports.TOOLBAR_ITEMS = [
    ["lock", "只读/编辑模式"], ["add-child", "添加子节点"], ["add-sibling", "添加同级节点"],
    ["edit", "完整编辑节点"], ["duplicate", "克隆分支"], ["delete", "删除节点"],
    ["task", "任务状态"], ["collapse", "展开/收起"], ["link", "打开链接"],
    ["search", "搜索导图"], ["global-search", "全局搜索"], ["table", "表格"],
    ["code", "代码"], ["image", "粘贴图片"], ["submap", "子导图"],
    ["undo", "撤销"], ["redo", "重做"],
    ["fit", "适应画布"], ["layout", "切换布局"], ["appearance", "脑图外观"],
    ["article-landing", "目录/原始文章"], ["article-style", "文章样式"],
    ["markdown", "Markdown 大纲"], ["json", "导入文件 / JSON"], ["export-document", "导出文档"], ["export-svg", "导出 SVG"]
];
/**
 * 创建image host config，并保持模型、界面和持久化状态的一致性。
 *
 * @param index 当前元素在同级或列表中的零基索引。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function createImageHostConfig(index = 1) {
    return {
        id: `host_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        name: `图床 ${index}`,
        enabled: true,
        endpoint: "",
        method: "POST",
        bodyMode: "multipart",
        fieldName: "file",
        headers: "",
        responsePath: "data.url"
    };
}
exports.DEFAULT_SETTINGS = {
    defaultFolder: "",
    filePrefix: "思维导图",
    assetFolder: "MindMap Assets",
    defaultLayout: "right",
    defaultTheme: "auto",
    defaultNodeShape: "rounded",
    nodeWidthMode: "auto",
    defaultNodeWidth: 176,
    autoNodeMaxWidth: 460,
    redirectLegacyFiles: true,
    showGrid: true,
    resizeModifier: "none",
    twoFingerGestureAction: "zoom",
    showTaskProgress: true,
    syncTitleToFilename: true,
    autoFitOnOpen: true,
    historyLimit: 120,
    embedMaxHeight: 520,
    defaultThemePreset: "classic-indigo",
    backgroundColor: "#f8fafc",
    backgroundPattern: "grid",
    backgroundPatternColor: "#94a3b8",
    fontFamily: "obsidian",
    customFont: "",
    fontSize: 14,
    edgeColor: "#6366f1",
    edgeWidth: 4.2,
    edgeStyle: "curved",
    edgeWidthMode: "tapered",
    edgeMinWidth: 1.2,
    rootColor: "#4f46e5",
    rootTextColor: "#ffffff",
    colorfulBranches: true,
    branchColors: ["#4f46e5", "#0284c7", "#0f766e", "#7c3aed", "#db2777", "#ea580c"],
    nodeBackgroundColor: "#ffffff",
    textColor: "#172033",
    nodeBorderColor: "#c7d2fe",
    nodeBorderWidth: 1,
    defaultNodeTextAlign: "center",
    defaultTextBold: false,
    defaultTextItalic: false,
    defaultTextUnderline: false,
    imageHosts: [],
    autoUploadEnabled: false,
    autoUploadDelaySeconds: 10,
    autoUploadHostIds: [],
    deleteLocalAfterUpload: true,
    imageFailoverEnabled: true,
    imageFailoverTimeoutSeconds: 8,
    imageFailoverUseLocalFallback: true,
    globalSearchMaxResults: 100,
    visibleModes: ["mindmap", "outline", "article", "reading"],
    defaultViewMode: "mindmap",
    readingProgress: {},
    readingModeInitialized: true,
    articleTocMaxDepth: 3,
    readingProgressPosition: "top",
    returnToTopVisibility: 10,
    nodeEditorPosition: "center",
    richTextBoldShortcut: "Ctrl+B",
    richTextItalicShortcut: "Ctrl+I",
    richTextUnderlineShortcut: "Ctrl+U",
    richTextColorShortcut: "Ctrl+Shift+C",
    visibleToolbarItems: exports.TOOLBAR_ITEMS.map(([id]) => id),
    toolbarItemOrder: exports.TOOLBAR_ITEMS.map(([id]) => id)
};
/**
 * Normalizes the article return-to-top threshold while preserving compatibility with older fixed presets.
 */
function normalizeReturnToTopVisibility(value) {
    const legacy = {
        "page-1": 10,
        "page-2": 20,
        "progress-1": 1,
        "progress-2": 2
    };
    if (typeof value === "number" && Number.isFinite(value))
        return Math.max(0, Math.min(100, value));
    if (typeof value !== "string")
        return exports.DEFAULT_SETTINGS.returnToTopVisibility;
    if (legacy[value] !== undefined)
        return legacy[value];
    const source = value.trim();
    if (!source)
        return exports.DEFAULT_SETTINGS.returnToTopVisibility;
    const legacyPages = source.match(/^(\d+(?:\.\d+)?)\s*(页|pages?)$/i);
    if (legacyPages)
        return Math.max(0, Math.min(100, Number(legacyPages[1]) * 10));
    const amount = Number(source.endsWith("%") ? source.slice(0, -1) : source);
    if (!Number.isFinite(amount))
        return exports.DEFAULT_SETTINGS.returnToTopVisibility;
    return Math.max(0, Math.min(100, amount));
}
/**
 * 更新并应用tings to appearance，并保持模型、界面和持久化状态的一致性。
 *
 * @param settings 插件当前设置对象。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function settingsToAppearance(settings) {
    return {
        nodeWidthMode: settings.nodeWidthMode,
        defaultNodeWidth: settings.defaultNodeWidth,
        autoNodeMaxWidth: settings.autoNodeMaxWidth,
        themePreset: settings.defaultThemePreset,
        backgroundColor: settings.backgroundColor || undefined,
        backgroundPattern: settings.backgroundPattern,
        patternColor: settings.backgroundPatternColor || undefined,
        fontFamily: settings.fontFamily,
        customFont: settings.customFont.trim() || undefined,
        fontSize: settings.fontSize,
        edgeColor: settings.edgeColor || undefined,
        edgeWidth: settings.edgeWidth,
        edgeStyle: settings.edgeStyle,
        edgeWidthMode: settings.edgeWidthMode,
        edgeMinWidth: settings.edgeMinWidth,
        rootColor: settings.rootColor || undefined,
        rootTextColor: settings.rootTextColor || undefined,
        colorfulBranches: settings.colorfulBranches,
        branchColors: settings.branchColors.length ? [...settings.branchColors] : undefined,
        nodeColor: settings.nodeBackgroundColor || undefined,
        textColor: settings.textColor || undefined,
        nodeBorderColor: settings.nodeBorderColor || undefined,
        nodeBorderWidth: settings.nodeBorderWidth,
        nodeTextAlign: settings.defaultNodeTextAlign,
        bold: settings.defaultTextBold,
        italic: settings.defaultTextItalic,
        underline: settings.defaultTextUnderline
    };
}
/**
 * 应用theme preset to settings，并保持模型、界面和持久化状态的一致性。
 *
 * @param settings 插件当前设置对象。
 * @param presetId 内置主题预设标识。
 */
function applyThemePresetToSettings(settings, presetId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const appearance = (0, themes_1.appearanceFromThemePreset)(presetId);
    settings.defaultThemePreset = presetId;
    settings.backgroundColor = (_a = appearance.backgroundColor) !== null && _a !== void 0 ? _a : "";
    settings.backgroundPattern = (_b = appearance.backgroundPattern) !== null && _b !== void 0 ? _b : "none";
    settings.backgroundPatternColor = (_c = appearance.patternColor) !== null && _c !== void 0 ? _c : "#94a3b8";
    settings.fontFamily = (_d = appearance.fontFamily) !== null && _d !== void 0 ? _d : "obsidian";
    settings.customFont = (_e = appearance.customFont) !== null && _e !== void 0 ? _e : "";
    settings.fontSize = (_f = appearance.fontSize) !== null && _f !== void 0 ? _f : 14;
    settings.edgeColor = (_g = appearance.edgeColor) !== null && _g !== void 0 ? _g : "";
    settings.edgeWidth = (_h = appearance.edgeWidth) !== null && _h !== void 0 ? _h : 2.2;
    settings.edgeStyle = (_j = appearance.edgeStyle) !== null && _j !== void 0 ? _j : "curved";
    settings.edgeWidthMode = (_k = appearance.edgeWidthMode) !== null && _k !== void 0 ? _k : "uniform";
    settings.edgeMinWidth = (_l = appearance.edgeMinWidth) !== null && _l !== void 0 ? _l : Math.min(1, settings.edgeWidth);
    settings.rootColor = (_m = appearance.rootColor) !== null && _m !== void 0 ? _m : "";
    settings.rootTextColor = (_o = appearance.rootTextColor) !== null && _o !== void 0 ? _o : "";
    settings.colorfulBranches = appearance.colorfulBranches === true;
    settings.branchColors = appearance.branchColors ? [...appearance.branchColors] : [];
    settings.nodeBackgroundColor = (_p = appearance.nodeColor) !== null && _p !== void 0 ? _p : "";
    settings.textColor = (_q = appearance.textColor) !== null && _q !== void 0 ? _q : "";
    settings.nodeBorderColor = (_r = appearance.nodeBorderColor) !== null && _r !== void 0 ? _r : "";
    settings.nodeBorderWidth = (_s = appearance.nodeBorderWidth) !== null && _s !== void 0 ? _s : 1;
    settings.defaultNodeTextAlign = (_t = appearance.nodeTextAlign) !== null && _t !== void 0 ? _t : "center";
    settings.defaultTextBold = appearance.bold === true;
    settings.defaultTextItalic = appearance.italic === true;
    settings.defaultTextUnderline = appearance.underline === true;
}
/**
 * MindMapStudioSettingTab 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class MindMapStudioSettingTab extends obsidian_1.PluginSettingTab {
    /**
     * 创建 MindMapStudioSettingTab 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
     * @param plugin MindMap Studio 插件实例，用于调用跨文件服务和读取设置。
     */
    constructor(app, plugin) {
        super(app, plugin);
        this.expandedImageHostIds = new Set();
        this.plugin = plugin;
    }
    /**
     * 构建完整插件设置页，包括主题、显示模式、节点默认值、搜索、图片、图床容灾和恢复初始设置。所有控件写入后立即保存并刷新打开视图。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    display() {
        var _a, _b;
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "MindMap Studio" });
        containerEl.createEl("p", {
            cls: "setting-item-description",
            text: "这里设置全局默认外观。打开脑图后，也可以点击工具栏中的调色板，为当前脑图单独保存一套样式。"
        });
        containerEl.createEl("h3", { text: "主题模板" });
        new obsidian_1.Setting(containerEl)
            .setName("默认主题")
            .setDesc("选择后会一次应用背景、节点、分支配色、字体和连线样式；之后仍可继续修改单项设置。")
            .addDropdown((dropdown) => {
            for (const preset of themes_1.MINDMAP_THEME_PRESETS)
                dropdown.addOption(preset.id, preset.name);
            dropdown.setValue(this.plugin.settings.defaultThemePreset);
            dropdown.onChange(async (value) => {
                applyThemePresetToSettings(this.plugin.settings, value);
                await this.saveAndRefresh();
                this.display();
            });
        });
        const themePreview = containerEl.createDiv({ cls: "mms-theme-preview-row" });
        for (const preset of themes_1.MINDMAP_THEME_PRESETS) {
            const card = themePreview.createEl("button", {
                cls: `mms-theme-preview-card${preset.id === this.plugin.settings.defaultThemePreset ? " is-selected" : ""}`,
                attr: { type: "button", title: preset.description }
            });
            const swatches = card.createDiv({ cls: "mms-theme-preview-swatches" });
            const colors = [preset.appearance.rootColor, ...((_a = preset.appearance.branchColors) !== null && _a !== void 0 ? _a : []).slice(0, 4)].filter((color) => Boolean(color));
            colors.forEach((color) => { const dot = swatches.createSpan(); dot.style.backgroundColor = color; });
            card.createDiv({ cls: "mms-theme-preview-name", text: preset.name });
            card.addEventListener("click", () => {
                applyThemePresetToSettings(this.plugin.settings, preset.id);
                void this.saveAndRefresh().then(() => this.display());
            });
        }
        containerEl.createEl("h3", { text: "显示模式" });
        containerEl.createEl("p", {
            cls: "setting-item-description",
            text: "导图、大纲和文章模式共享同一份节点数据。在任意模式中的修改都会同步到其他模式。"
        });
        const modeGrid = containerEl.createDiv({ cls: "mms-mode-settings-grid" });
        const modeOptions = [
            { id: "mindmap", name: "导图模式", description: "默认的可视化思维导图画布。" },
            { id: "outline", name: "大纲模式", description: "按照节点层级显示可编辑大纲。" },
            { id: "article", name: "文章模式", description: "生成目录和章节编号的文章视图。" },
            { id: "reading", name: "通读模式", description: "合并父导图、子导图和孙导图，像一本书一样连续阅读。" }
        ];
        for (const mode of modeOptions) {
            const label = modeGrid.createEl("label", { cls: "mms-mode-setting-card" });
            const checkbox = label.createEl("input", { type: "checkbox" });
            checkbox.checked = this.plugin.settings.visibleModes.includes(mode.id);
            const copy = label.createDiv({ cls: "mms-mode-setting-copy" });
            copy.createEl("strong", { text: mode.name });
            copy.createEl("span", { text: mode.description });
            checkbox.addEventListener("change", async () => {
                var _a;
                const next = new Set(this.plugin.settings.visibleModes);
                if (checkbox.checked)
                    next.add(mode.id);
                else
                    next.delete(mode.id);
                if (!next.size) {
                    checkbox.checked = true;
                    new obsidian_1.Notice("至少需要保留一种显示模式");
                    return;
                }
                this.plugin.settings.visibleModes = modeOptions.map((item) => item.id).filter((id) => next.has(id));
                if (!this.plugin.settings.visibleModes.includes(this.plugin.settings.defaultViewMode)) {
                    this.plugin.settings.defaultViewMode = (_a = this.plugin.settings.visibleModes[0]) !== null && _a !== void 0 ? _a : "mindmap";
                }
                await this.saveAndRefresh();
                this.display();
            });
        }
        new obsidian_1.Setting(containerEl)
            .setName("当前全局显示模式")
            .setDesc("这里与工具栏模式按钮同步。选择后，之后打开的父导图和所有子导图都会继续使用该模式。")
            .addDropdown((dropdown) => {
            var _a;
            const labels = { mindmap: "导图模式", outline: "大纲模式", article: "文章模式", reading: "通读模式" };
            for (const mode of this.plugin.settings.visibleModes)
                dropdown.addOption(mode, labels[mode]);
            dropdown.setValue(this.plugin.settings.visibleModes.includes(this.plugin.settings.defaultViewMode)
                ? this.plugin.settings.defaultViewMode
                : (_a = this.plugin.settings.visibleModes[0]) !== null && _a !== void 0 ? _a : "mindmap");
            dropdown.onChange(async (value) => {
                await this.plugin.setGlobalDisplayMode(value);
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName("双指手势")
            .setDesc("在导图画布上使用两根手指时，可选择以指间距离缩放，或以双指中心点移动画布。")
            .addDropdown((dropdown) => dropdown
            .addOption("zoom", "放大缩小")
            .addOption("pan", "移动画布")
            .setValue(this.plugin.settings.twoFingerGestureAction)
            .onChange(async (value) => {
            this.plugin.settings.twoFingerGestureAction = value === "pan" ? "pan" : "zoom";
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("文章目录最大层级")
            .setDesc("限制目录页显示的层级深度，不影响文章内容以及上一篇/下一篇导航。")
            .addDropdown((dropdown) => {
            for (let depth = 1; depth <= 8; depth += 1)
                dropdown.addOption(String(depth), `${depth} 层`);
            dropdown
                .setValue(String(this.plugin.settings.articleTocMaxDepth))
                .onChange(async (value) => {
                this.plugin.settings.articleTocMaxDepth = Math.max(1, Math.min(8, Number(value) || 3));
                await this.saveAndRefresh();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName("通读进度条位置")
            .setDesc("控制阅读进度显示在页面上方、下方、左侧或右侧。")
            .addDropdown((dropdown) => dropdown
            .addOption("top", "上方")
            .addOption("bottom", "下方")
            .addOption("left", "左侧")
            .addOption("right", "右侧")
            .setValue(this.plugin.settings.readingProgressPosition)
            .onChange(async (value) => {
            this.plugin.settings.readingProgressPosition = value === "bottom" || value === "left" || value === "right" ? value : "top";
            await this.saveAndRefresh();
        }));
        let returnToTopSlider = null;
        let returnToTopInput = null;
        const saveReturnToTopVisibility = async (value) => {
            const normalized = normalizeReturnToTopVisibility(value);
            this.plugin.settings.returnToTopVisibility = normalized;
            returnToTopSlider === null || returnToTopSlider === void 0 ? void 0 : returnToTopSlider.setValue(normalized);
            returnToTopInput === null || returnToTopInput === void 0 ? void 0 : returnToTopInput.setValue(String(normalized));
            await this.saveAndRefresh();
        };
        new obsidian_1.Setting(containerEl)
            .setName("回到顶部按钮显示时机")
            .setDesc("文章和通读模式中，按钮默认隐藏；阅读进度达到设定百分比后显示。可拖动或直接输入 0–100。")
            .addSlider((slider) => {
            returnToTopSlider = slider;
            return slider
                .setLimits(0, 100, 1)
                .setValue(this.plugin.settings.returnToTopVisibility)
                .onChange(saveReturnToTopVisibility);
        })
            .addText((text) => {
            returnToTopInput = text;
            return text
                .setPlaceholder("0–100")
                .setValue(String(this.plugin.settings.returnToTopVisibility))
                .onChange(saveReturnToTopVisibility);
        });
        containerEl.createEl("h3", { text: "工具栏内容" });
        containerEl.createEl("p", {
            cls: "setting-item-description",
            text: "选择需要显示在脑图顶部工具栏中的操作。显示模式切换、缩放比例和保存状态始终保留。"
        });
        const defaultToolbarOrder = exports.TOOLBAR_ITEMS.map(([id]) => id);
        const knownToolbarItems = new Map(exports.TOOLBAR_ITEMS);
        const toolbarOrder = [
            ...this.plugin.settings.toolbarItemOrder.filter((id) => knownToolbarItems.has(id)),
            ...defaultToolbarOrder.filter((id) => !this.plugin.settings.toolbarItemOrder.includes(id))
        ];
        this.plugin.settings.toolbarItemOrder = toolbarOrder;
        new obsidian_1.Setting(containerEl)
            .setName("工具栏顺序")
            .setDesc("使用上下按钮调整顺序；隐藏的项目也会保留当前位置。")
            .addButton((button) => button
            .setButtonText("恢复默认顺序")
            .onClick(async () => {
            this.plugin.settings.toolbarItemOrder = [...defaultToolbarOrder];
            await this.saveAndRefresh();
            this.display();
        }));
        const toolbarGrid = containerEl.createDiv({ cls: "mms-toolbar-settings-grid" });
        for (const [index, id] of toolbarOrder.entries()) {
            const row = toolbarGrid.createDiv({ cls: "mms-toolbar-setting-item" });
            const label = row.createEl("label", { cls: "mms-toolbar-setting-label" });
            const checkbox = label.createEl("input", { type: "checkbox" });
            checkbox.checked = this.plugin.settings.visibleToolbarItems.includes(id);
            label.createSpan({ text: (_b = knownToolbarItems.get(id)) !== null && _b !== void 0 ? _b : id });
            const controls = row.createDiv({ cls: "mms-toolbar-order-controls" });
            const upButton = controls.createEl("button", { text: "↑", attr: { type: "button", "aria-label": "上移" } });
            const downButton = controls.createEl("button", { text: "↓", attr: { type: "button", "aria-label": "下移" } });
            upButton.disabled = index === 0;
            downButton.disabled = index === toolbarOrder.length - 1;
            const move = async (offset) => {
                const target = index + offset;
                if (target < 0 || target >= toolbarOrder.length)
                    return;
                [toolbarOrder[index], toolbarOrder[target]] = [toolbarOrder[target], toolbarOrder[index]];
                this.plugin.settings.toolbarItemOrder = [...toolbarOrder];
                await this.saveAndRefresh();
                this.display();
            };
            upButton.addEventListener("click", () => void move(-1));
            downButton.addEventListener("click", () => void move(1));
            checkbox.addEventListener("change", async () => {
                const selected = new Set(this.plugin.settings.visibleToolbarItems);
                if (checkbox.checked)
                    selected.add(id);
                else
                    selected.delete(id);
                this.plugin.settings.visibleToolbarItems = toolbarOrder.filter((itemId) => selected.has(itemId));
                await this.saveAndRefresh();
            });
        }
        containerEl.createEl("h3", { text: "文件与布局" });
        new obsidian_1.Setting(containerEl)
            .setName("节点编辑器显示位置")
            .setDesc("居中时使用弹窗；靠右时作为右侧编辑面板显示，保存或点击面板外会自动收起。")
            .addDropdown((dropdown) => dropdown
            .addOption("center", "居中弹窗")
            .addOption("right", "右侧面板")
            .setValue(this.plugin.settings.nodeEditorPosition)
            .onChange(async (value) => {
            this.plugin.settings.nodeEditorPosition = value === "right" ? "right" : "center";
            await this.saveAndRefresh();
        }));
        containerEl.createEl("h3", { text: "节点快速输入快捷键" });
        containerEl.createEl("p", {
            cls: "setting-item-description",
            text: "Tab/Enter 创建节点后可直接输入。以下快捷键作用于节点内已选择的文字；格式示例：Ctrl+B、Ctrl+Shift+C、Alt+U。"
        });
        const shortcutSetting = (name, key) => {
            new obsidian_1.Setting(containerEl)
                .setName(name)
                .addText((text) => text
                .setValue(this.plugin.settings[key])
                .onChange(async (value) => {
                this.plugin.settings[key] = value.trim();
                await this.plugin.saveSettings();
            }));
        };
        shortcutSetting("加粗", "richTextBoldShortcut");
        shortcutSetting("斜体", "richTextItalicShortcut");
        shortcutSetting("下划线", "richTextUnderlineShortcut");
        shortcutSetting("字体颜色", "richTextColorShortcut");
        new obsidian_1.Setting(containerEl)
            .setName("默认保存文件夹")
            .setDesc("留空时保存在当前笔记所在文件夹；也可填写例如 Mind Maps。")
            .addText((text) => text
            .setPlaceholder("Mind Maps")
            .setValue(this.plugin.settings.defaultFolder)
            .onChange(async (value) => {
            this.plugin.settings.defaultFolder = value.trim().replace(/^\/+|\/+$/g, "");
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("资源文件夹")
            .setDesc("该路径相对于当前脑图所在目录。粘贴图片会保存到“当前脑图目录/该资源文件夹/”；子导图会保存在“当前脑图目录/该资源文件夹/父导图名称/”中。默认使用 MindMap Assets。")
            .addText((text) => text
            .setPlaceholder("MindMap Assets")
            .setValue(this.plugin.settings.assetFolder)
            .onChange(async (value) => {
            this.plugin.settings.assetFolder = value.trim().replace(/^\/+|\/+$/g, "") || "MindMap Assets";
            await this.plugin.saveSettings();
        }));
        containerEl.createEl("h3", { text: "图片与图床" });
        new obsidian_1.Setting(containerEl)
            .setName("远程图片自动故障转移")
            .setDesc("当前图床地址加载失败或超时后，按镜像顺序尝试下一地址；成功后自动将可用地址保存为新的主地址。")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.imageFailoverEnabled)
            .onChange(async (value) => {
            this.plugin.settings.imageFailoverEnabled = value;
            await this.plugin.saveSettings();
            this.display();
        }));
        if (this.plugin.settings.imageFailoverEnabled) {
            new obsidian_1.Setting(containerEl)
                .setName("单个镜像等待时间")
                .setDesc("图片在该时间内未成功加载，就尝试下一个镜像。范围 2–30 秒。")
                .addSlider((slider) => slider
                .setLimits(2, 30, 1)
                .setDynamicTooltip()
                .setValue(this.plugin.settings.imageFailoverTimeoutSeconds)
                .onChange(async (value) => {
                this.plugin.settings.imageFailoverTimeoutSeconds = value;
                await this.plugin.saveSettings();
            }));
            new obsidian_1.Setting(containerEl)
                .setName("本地副本作为最后回退")
                .setDesc("远程镜像全部失效时，如果本地图片仍存在，则最后尝试本地副本。")
                .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.imageFailoverUseLocalFallback)
                .onChange(async (value) => {
                this.plugin.settings.imageFailoverUseLocalFallback = value;
                await this.plugin.saveSettings();
            }));
        }
        new obsidian_1.Setting(containerEl)
            .setName("粘贴图片后自动上传")
            .setDesc("图片会先保存到当前脑图的本地资源文件夹，再按设定延迟上传。只有全部目标图床成功后，才会切换为远程网址。")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.autoUploadEnabled)
            .onChange(async (value) => {
            this.plugin.settings.autoUploadEnabled = value;
            await this.plugin.saveSettings();
            this.display();
        }));
        if (this.plugin.settings.autoUploadEnabled) {
            new obsidian_1.Setting(containerEl)
                .setName("自动上传延迟")
                .setDesc("粘贴后等待 0–300 秒再上传，便于撤销或继续编辑。")
                .addSlider((slider) => slider
                .setLimits(0, 300, 1)
                .setDynamicTooltip()
                .setValue(this.plugin.settings.autoUploadDelaySeconds)
                .onChange(async (value) => {
                this.plugin.settings.autoUploadDelaySeconds = value;
                await this.plugin.saveSettings();
            }));
            new obsidian_1.Setting(containerEl)
                .setName("全部成功后删除本地图片")
                .setDesc("插件会先写入远程网址并保存脑图，再检查图片是否被其他脑图引用；确认安全后才删除本地文件。任一图床失败时会保留本地图片。")
                .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.deleteLocalAfterUpload)
                .onChange(async (value) => {
                this.plugin.settings.deleteLocalAfterUpload = value;
                await this.plugin.saveSettings();
            }));
        }
        const hosts = this.plugin.settings.imageHosts;
        const hostsHeader = containerEl.createDiv({ cls: "mms-image-hosts-header" });
        hostsHeader.createEl("h4", { text: "图床配置" });
        const addHost = hostsHeader.createEl("button", { text: "新增图床", attr: { type: "button" } });
        addHost.addEventListener("click", () => {
            const host = createImageHostConfig(hosts.length + 1);
            this.plugin.settings.imageHosts.push(host);
            void this.plugin.saveSettings().then(() => this.display());
        });
        if (!hosts.length) {
            containerEl.createDiv({ cls: "setting-item-description mms-image-host-empty", text: "尚未配置图床。新增后可以测试上传接口，并选择一个或多个自动上传目标。" });
        }
        hosts.forEach((host, index) => {
            const card = containerEl.createEl("details", { cls: "mms-image-host-card" });
            card.open = this.expandedImageHostIds.has(host.id);
            card.addEventListener("toggle", () => {
                if (card.open)
                    this.expandedImageHostIds.add(host.id);
                else
                    this.expandedImageHostIds.delete(host.id);
            });
            const title = card.createEl("summary", { cls: "mms-image-host-card-title" });
            title.createEl("strong", { text: host.name || `图床 ${index + 1}` });
            const status = title.createSpan({ cls: "mms-image-host-status", text: host.enabled ? "已启用" : "已停用" });
            status.toggleClass("is-enabled", host.enabled);
            const body = card.createDiv({ cls: "mms-image-host-card-body" });
            new obsidian_1.Setting(body)
                .setName("名称")
                .addText((text) => text
                .setValue(host.name)
                .setPlaceholder(`图床 ${index + 1}`)
                .onChange(async (value) => {
                host.name = value.trim() || `图床 ${index + 1}`;
                await this.plugin.saveSettings();
            }))
                .addToggle((toggle) => toggle
                .setTooltip("启用该图床")
                .setValue(host.enabled)
                .onChange(async (value) => {
                host.enabled = value;
                if (!value)
                    this.plugin.settings.autoUploadHostIds = this.plugin.settings.autoUploadHostIds.filter((id) => id !== host.id);
                await this.plugin.saveSettings();
                this.display();
            }));
            new obsidian_1.Setting(body)
                .setName("上传 API")
                .addText((text) => text
                .setPlaceholder("https://example.com/api/upload")
                .setValue(host.endpoint)
                .onChange(async (value) => { host.endpoint = value.trim(); await this.plugin.saveSettings(); }));
            new obsidian_1.Setting(body)
                .setName("请求方法与格式")
                .addDropdown((dropdown) => dropdown
                .addOption("POST", "POST")
                .addOption("PUT", "PUT")
                .setValue(host.method)
                .onChange(async (value) => { host.method = value; await this.plugin.saveSettings(); }))
                .addDropdown((dropdown) => dropdown
                .addOption("multipart", "multipart/form-data")
                .addOption("raw", "原始二进制")
                .setValue(host.bodyMode)
                .onChange(async (value) => { host.bodyMode = value; await this.plugin.saveSettings(); }));
            new obsidian_1.Setting(body)
                .setName("文件字段名")
                .setDesc("multipart 模式常见值：file、image、source。")
                .addText((text) => text
                .setValue(host.fieldName)
                .setPlaceholder("file")
                .onChange(async (value) => { host.fieldName = value.trim() || "file"; await this.plugin.saveSettings(); }));
            new obsidian_1.Setting(body)
                .setName("请求头 JSON")
                .setDesc("例如 Authorization、X-API-Key。密钥保存在插件 data.json。")
                .addTextArea((text) => text
                .setValue(host.headers)
                .setPlaceholder('{"Authorization":"Bearer ..."}')
                .onChange(async (value) => { host.headers = value.trim(); await this.plugin.saveSettings(); }));
            new obsidian_1.Setting(body)
                .setName("返回网址字段")
                .setDesc("例如 data.url；留空会尝试常见字段。")
                .addText((text) => text
                .setValue(host.responsePath)
                .setPlaceholder("data.url")
                .onChange(async (value) => { host.responsePath = value.trim(); await this.plugin.saveSettings(); }));
            const isAutoTarget = this.plugin.settings.autoUploadHostIds.includes(host.id);
            new obsidian_1.Setting(body)
                .setName("自动上传目标")
                .setDesc("自动上传可以同时选择多个图床；手动上传时仍可临时选择其他组合。")
                .addToggle((toggle) => toggle
                .setValue(isAutoTarget)
                .setDisabled(!host.enabled)
                .onChange(async (value) => {
                const selected = new Set(this.plugin.settings.autoUploadHostIds);
                if (value)
                    selected.add(host.id);
                else
                    selected.delete(host.id);
                this.plugin.settings.autoUploadHostIds = Array.from(selected);
                await this.plugin.saveSettings();
            }));
            const actions = body.createDiv({ cls: "mms-image-host-actions" });
            const test = actions.createEl("button", { text: "检测 API 连通性", attr: { type: "button" } });
            test.addEventListener("click", () => {
                test.disabled = true;
                test.setText("检测中…");
                void this.plugin.testImageHost(host.id).finally(() => {
                    test.disabled = false;
                    test.setText("检测 API 连通性");
                });
            });
            const remove = actions.createEl("button", { text: "删除图床", cls: "mod-warning", attr: { type: "button" } });
            remove.addEventListener("click", () => {
                this.expandedImageHostIds.delete(host.id);
                this.plugin.settings.imageHosts = this.plugin.settings.imageHosts.filter((item) => item.id !== host.id);
                this.plugin.settings.autoUploadHostIds = this.plugin.settings.autoUploadHostIds.filter((id) => id !== host.id);
                void this.plugin.saveSettings().then(() => {
                    new obsidian_1.Notice(`已删除图床：${host.name}`);
                    this.display();
                });
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName("新文件名前缀")
            .setDesc("新建脑图时使用：前缀 + 日期时间。文件后缀固定为 .mindmap。")
            .addText((text) => text
            .setPlaceholder("思维导图")
            .setValue(this.plugin.settings.filePrefix)
            .onChange(async (value) => {
            this.plugin.settings.filePrefix = value.trim() || "思维导图";
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("默认布局")
            .setDesc("单侧适合流程拆解，双侧适合头脑风暴。")
            .addDropdown((dropdown) => dropdown
            .addOption("right", "向右展开")
            .addOption("balanced", "左右平衡")
            .setValue(this.plugin.settings.defaultLayout)
            .onChange(async (value) => {
            this.plugin.settings.defaultLayout = value;
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("默认明暗模式")
            .addDropdown((dropdown) => dropdown
            .addOption("auto", "跟随 Obsidian")
            .addOption("light", "浅色")
            .addOption("dark", "深色")
            .setValue(this.plugin.settings.defaultTheme)
            .onChange(async (value) => {
            this.plugin.settings.defaultTheme = value;
            await this.plugin.saveSettings();
        }));
        containerEl.createEl("h3", { text: "画布背景" });
        this.addOptionalColorSetting(containerEl, "背景颜色", "留空时跟随 Obsidian 当前主题。", () => this.plugin.settings.backgroundColor, async (value) => { this.plugin.settings.backgroundColor = value; }, "#f8fafc");
        new obsidian_1.Setting(containerEl)
            .setName("背景图案")
            .setDesc("可选择网格、点阵或纯色背景。")
            .addDropdown((dropdown) => dropdown
            .addOption("none", "无")
            .addOption("grid", "网格")
            .addOption("dots", "点阵")
            .setValue(this.plugin.settings.backgroundPattern)
            .onChange(async (value) => {
            this.plugin.settings.backgroundPattern = value;
            this.plugin.settings.showGrid = value !== "none";
            await this.saveAndRefresh();
        }));
        this.addOptionalColorSetting(containerEl, "背景图案颜色", "控制网格线或点阵的颜色。", () => this.plugin.settings.backgroundPatternColor, async (value) => { this.plugin.settings.backgroundPatternColor = value || "#94a3b8"; }, "#94a3b8", false);
        containerEl.createEl("h3", { text: "字体与文字" });
        new obsidian_1.Setting(containerEl)
            .setName("默认字体")
            .addDropdown((dropdown) => dropdown
            .addOption("obsidian", "跟随 Obsidian")
            .addOption("sans", "无衬线字体")
            .addOption("serif", "衬线字体")
            .addOption("mono", "等宽字体")
            .addOption("custom", "自定义字体")
            .setValue(this.plugin.settings.fontFamily)
            .onChange(async (value) => {
            this.plugin.settings.fontFamily = value;
            await this.saveAndRefresh();
            this.display();
        }));
        if (this.plugin.settings.fontFamily === "custom") {
            new obsidian_1.Setting(containerEl)
                .setName("自定义字体名称")
                .setDesc("填写系统中已经安装的字体名称，例如 Microsoft YaHei、PingFang SC。")
                .addText((text) => text
                .setPlaceholder("Microsoft YaHei")
                .setValue(this.plugin.settings.customFont)
                .onChange(async (value) => {
                this.plugin.settings.customFont = value.trim().slice(0, 120);
                await this.saveAndRefresh();
            }));
        }
        new obsidian_1.Setting(containerEl)
            .setName("默认字号")
            .setDesc("范围 10–30 像素。节点仍可单独覆盖字号。")
            .addSlider((slider) => slider
            .setLimits(10, 30, 1)
            .setDynamicTooltip()
            .setValue(this.plugin.settings.fontSize)
            .onChange(async (value) => {
            this.plugin.settings.fontSize = value;
            await this.saveAndRefresh();
        }));
        this.addOptionalColorSetting(containerEl, "默认文字颜色", "留空时使用 Obsidian 主题文字颜色；根节点仍优先使用主题强调色的对比文字。", () => this.plugin.settings.textColor, async (value) => { this.plugin.settings.textColor = value; }, "#0f172a");
        new obsidian_1.Setting(containerEl)
            .setName("默认节点文字对齐")
            .setDesc("控制未单独设置对齐方式的节点；节点编辑窗口仍可覆盖。")
            .addDropdown((dropdown) => dropdown
            .addOption("left", "左对齐")
            .addOption("center", "居中")
            .addOption("right", "右对齐")
            .setValue(this.plugin.settings.defaultNodeTextAlign)
            .onChange(async (value) => {
            this.plugin.settings.defaultNodeTextAlign = value;
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("默认文字加粗")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.defaultTextBold)
            .onChange(async (value) => {
            this.plugin.settings.defaultTextBold = value;
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("默认文字斜体")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.defaultTextItalic)
            .onChange(async (value) => {
            this.plugin.settings.defaultTextItalic = value;
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("默认文字下划线")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.defaultTextUnderline)
            .onChange(async (value) => {
            this.plugin.settings.defaultTextUnderline = value;
            await this.saveAndRefresh();
        }));
        containerEl.createEl("h3", { text: "节点样式" });
        this.addOptionalColorSetting(containerEl, "中心主题颜色", "根节点的背景颜色。主题模板会自动设置。", () => this.plugin.settings.rootColor, async (value) => { this.plugin.settings.rootColor = value; }, "#4f46e5");
        this.addOptionalColorSetting(containerEl, "中心主题文字颜色", "根节点的文字颜色。", () => this.plugin.settings.rootTextColor, async (value) => { this.plugin.settings.rootTextColor = value; }, "#ffffff");
        new obsidian_1.Setting(containerEl)
            .setName("默认节点形状")
            .setDesc("只影响未单独设置形状的节点。")
            .addDropdown((dropdown) => dropdown
            .addOption("rounded", "圆角")
            .addOption("pill", "胶囊")
            .addOption("rectangle", "直角")
            .setValue(this.plugin.settings.defaultNodeShape)
            .onChange(async (value) => {
            this.plugin.settings.defaultNodeShape = value;
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("节点宽度模式")
            .setDesc("固定宽度统一显示；自动宽度会依据文字长度伸缩，并在达到最大宽度后换行。")
            .addDropdown((dropdown) => dropdown
            .addOption("auto", "自动宽度")
            .addOption("fixed", "固定宽度")
            .setValue(this.plugin.settings.nodeWidthMode)
            .onChange(async (value) => {
            this.plugin.settings.nodeWidthMode = value === "fixed" ? "fixed" : "auto";
            await this.saveAndRefresh();
            this.display();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("固定节点宽度")
            .setDesc("固定宽度模式下使用，范围 100–900 像素。")
            .addText((text) => text
            .setValue(String(this.plugin.settings.defaultNodeWidth))
            .onChange(async (value) => {
            const parsed = Number(value);
            if (!Number.isFinite(parsed))
                return;
            this.plugin.settings.defaultNodeWidth = Math.max(100, Math.min(900, Math.round(parsed)));
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("自动宽度上限")
            .setDesc("自动宽度达到此值后换行；手动拖动节点宽度仍可突破该上限。范围 120–900 像素。")
            .addText((text) => text
            .setValue(String(this.plugin.settings.autoNodeMaxWidth))
            .onChange(async (value) => {
            const parsed = Number(value);
            if (!Number.isFinite(parsed))
                return;
            this.plugin.settings.autoNodeMaxWidth = Math.max(120, Math.min(900, Math.round(parsed)));
            await this.saveAndRefresh();
        }));
        this.addOptionalColorSetting(containerEl, "默认节点背景色", "留空时跟随 Obsidian 主题。单个节点设置的颜色优先级更高。", () => this.plugin.settings.nodeBackgroundColor, async (value) => { this.plugin.settings.nodeBackgroundColor = value; }, "#ffffff");
        this.addOptionalColorSetting(containerEl, "默认节点边框颜色", "留空时跟随 Obsidian 主题边框颜色。", () => this.plugin.settings.nodeBorderColor, async (value) => { this.plugin.settings.nodeBorderColor = value; }, "#94a3b8");
        new obsidian_1.Setting(containerEl)
            .setName("默认节点边框粗细")
            .setDesc("范围 0–6 像素；0 表示无边框。")
            .addSlider((slider) => slider
            .setLimits(0, 6, 0.5)
            .setDynamicTooltip()
            .setValue(this.plugin.settings.nodeBorderWidth)
            .onChange(async (value) => {
            this.plugin.settings.nodeBorderWidth = value;
            await this.saveAndRefresh();
        }));
        containerEl.createEl("h3", { text: "连线样式" });
        new obsidian_1.Setting(containerEl)
            .setName("彩色分支")
            .setDesc("按照中心主题的一级分支分配颜色，同一分支的节点边框和连线保持一致。")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.colorfulBranches)
            .onChange(async (value) => {
            this.plugin.settings.colorfulBranches = value;
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("分支颜色")
            .setDesc("使用逗号分隔的十六进制颜色，一级分支会循环使用。")
            .addTextArea((text) => text
            .setPlaceholder("#4f46e5, #0284c7, #0f766e")
            .setValue(this.plugin.settings.branchColors.join(", "))
            .onChange(async (value) => {
            this.plugin.settings.branchColors = value.split(/[,，\s]+/).map((item) => item.trim()).filter((item) => /^#[0-9a-f]{6}$/i.test(item)).slice(0, 12);
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("连线类型")
            .addDropdown((dropdown) => dropdown
            .addOption("curved", "曲线")
            .addOption("straight", "直线")
            .addOption("elbow", "折线")
            .setValue(this.plugin.settings.edgeStyle)
            .onChange(async (value) => {
            this.plugin.settings.edgeStyle = value;
            await this.saveAndRefresh();
        }));
        this.addOptionalColorSetting(containerEl, "连线颜色", "留空时使用当前主题强调色。节点单独设置颜色时，可继续为该分支连线着色。", () => this.plugin.settings.edgeColor, async (value) => { this.plugin.settings.edgeColor = value; }, "#7c8aa5");
        new obsidian_1.Setting(containerEl)
            .setName("连线粗细模式")
            .setDesc("“从粗到细”会让靠近中心主题的线最粗，越深层越细。")
            .addDropdown((dropdown) => dropdown
            .addOption("uniform", "统一粗细")
            .addOption("tapered", "从粗到细")
            .setValue(this.plugin.settings.edgeWidthMode)
            .onChange(async (value) => {
            this.plugin.settings.edgeWidthMode = value;
            await this.saveAndRefresh();
            this.display();
        }));
        new obsidian_1.Setting(containerEl)
            .setName(this.plugin.settings.edgeWidthMode === "tapered" ? "起始粗细" : "连线粗细")
            .setDesc("靠近中心主题的连线宽度，范围 0.5–8 像素。")
            .addSlider((slider) => slider
            .setLimits(0.5, 8, 0.25)
            .setDynamicTooltip()
            .setValue(this.plugin.settings.edgeWidth)
            .onChange(async (value) => {
            this.plugin.settings.edgeWidth = value;
            if (this.plugin.settings.edgeMinWidth > value)
                this.plugin.settings.edgeMinWidth = value;
            await this.saveAndRefresh();
        }));
        if (this.plugin.settings.edgeWidthMode === "tapered") {
            new obsidian_1.Setting(containerEl)
                .setName("末端最细宽度")
                .setDesc("深层分支不会细于该值，范围 0.25–4 像素。")
                .addSlider((slider) => slider
                .setLimits(0.25, 4, 0.25)
                .setDynamicTooltip()
                .setValue(this.plugin.settings.edgeMinWidth)
                .onChange(async (value) => {
                this.plugin.settings.edgeMinWidth = Math.min(value, this.plugin.settings.edgeWidth);
                await this.saveAndRefresh();
            }));
        }
        containerEl.createEl("h3", { text: "编辑与兼容" });
        new obsidian_1.Setting(containerEl)
            .setName("打开旧版脑图时自动转换")
            .setDesc("自动创建同名 .mindmap 文件并打开；旧文件会保留为备份，不会覆盖或删除。")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.redirectLegacyFiles)
            .onChange(async (value) => {
            this.plugin.settings.redirectLegacyFiles = value;
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("显示任务进度")
            .setDesc("在包含任务的分支节点底部显示完成百分比。")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.showTaskProgress)
            .onChange(async (value) => {
            this.plugin.settings.showTaskProgress = value;
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("打开时自动适应画布")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.autoFitOnOpen)
            .onChange(async (value) => {
            this.plugin.settings.autoFitOnOpen = value;
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("撤销历史步数")
            .setDesc("范围 20–500；数值越大占用的内存越多。")
            .addSlider((slider) => slider
            .setLimits(20, 500, 10)
            .setDynamicTooltip()
            .setValue(this.plugin.settings.historyLimit)
            .onChange(async (value) => {
            this.plugin.settings.historyLimit = value;
            await this.saveAndRefresh();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("嵌入预览最大高度")
            .setDesc("范围 240–1200 像素。")
            .addSlider((slider) => slider
            .setLimits(240, 1200, 20)
            .setDynamicTooltip()
            .setValue(this.plugin.settings.embedMaxHeight)
            .onChange(async (value) => {
            this.plugin.settings.embedMaxHeight = value;
            await this.plugin.saveSettings();
        }));
        containerEl.createEl("h3", { text: "全局搜索索引" });
        const searchStatus = this.plugin.getGlobalSearchIndexStatus();
        containerEl.createEl("p", {
            cls: "setting-item-description",
            text: searchStatus.building
                ? `正在建立索引；当前已收录 ${searchStatus.files} 个导图、${searchStatus.nodes} 个节点。`
                : `本地索引已收录 ${searchStatus.files} 个导图、${searchStatus.nodes} 个节点。索引文件仅保存在插件目录，不会上传网络。`
        });
        new obsidian_1.Setting(containerEl)
            .setName("单次最多显示结果")
            .setDesc("范围 20–500。索引会搜索整个仓库中的所有 .mindmap 文件。")
            .addSlider((slider) => slider
            .setLimits(20, 500, 10)
            .setDynamicTooltip()
            .setValue(this.plugin.settings.globalSearchMaxResults)
            .onChange(async (value) => {
            this.plugin.settings.globalSearchMaxResults = value;
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName("重建搜索索引")
            .setDesc("当文件由外部同步工具批量修改，或搜索结果与实际内容不一致时使用。")
            .addButton((button) => button
            .setButtonText("立即重建")
            .onClick(async () => {
            button.setDisabled(true);
            try {
                await this.plugin.rebuildGlobalSearchIndex();
                this.display();
            }
            finally {
                button.setDisabled(false);
            }
        }));
        containerEl.createEl("h3", { text: "恢复初始设置" });
        new obsidian_1.Setting(containerEl)
            .setName("一键还原所有插件设置")
            .setDesc("恢复显示模式、主题、资源目录、图床、搜索和编辑选项。不会删除或修改任何 .mindmap 文件。")
            .addButton((button) => button
            .setWarning()
            .setButtonText("恢复初始设置")
            .onClick(async () => {
            const confirmed = window.confirm("确定恢复 MindMap Studio 的全部插件设置吗？脑图文件不会被删除。");
            if (!confirmed)
                return;
            await this.plugin.resetAllSettings();
            new obsidian_1.Notice("已恢复初始设置");
            this.display();
        }));
    }
    /**
     * 添加optional color setting，并保持模型、界面和持久化状态的一致性。
     *
     * @param container 接收渲染内容的 DOM 容器。
     * @param name 该参数用于 add optional color setting 流程中的输入或控制。
     * @param description 该参数用于 add optional color setting 流程中的输入或控制。
     * @param getValue 该参数用于 add optional color setting 流程中的输入或控制。
     * @param setValue 该参数用于 add optional color setting 流程中的输入或控制。
     * @param fallback 该参数用于 add optional color setting 流程中的输入或控制。
     * @param allowReset 该参数用于 add optional color setting 流程中的输入或控制。
     */
    addOptionalColorSetting(container, name, description, getValue, setValue, fallback, allowReset = true) {
        const setting = new obsidian_1.Setting(container)
            .setName(name)
            .setDesc(description)
            .addColorPicker((picker) => picker
            .setValue(getValue() || fallback)
            .onChange(async (value) => {
            await setValue(value);
            await this.saveAndRefresh();
        }));
        if (allowReset) {
            setting.addButton((button) => button
                .setButtonText("跟随主题")
                .onClick(async () => {
                await setValue("");
                await this.saveAndRefresh();
                this.display();
            }));
        }
    }
    /**
     * 保存and refresh，并保持模型、界面和持久化状态的一致性。
     */
    async saveAndRefresh() {
        await this.plugin.saveSettings();
        this.plugin.refreshOpenViews();
    }
}
exports.MindMapStudioSettingTab = MindMapStudioSettingTab;

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/settings.ts
},
4: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file themes.ts
 * @description 内置主题预设模块。
 *
 * 主题同时覆盖画布、节点、字体、分支颜色和连接线，应用后仍允许用户继续覆盖单项外观。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINDMAP_THEME_PRESETS = void 0;
exports.getMindMapThemePreset = getMindMapThemePreset;
exports.appearanceFromThemePreset = appearanceFromThemePreset;
exports.MINDMAP_THEME_PRESETS = [
    {
        id: "classic-indigo",
        name: "经典靛蓝",
        description: "清爽、通用，适合项目与知识整理",
        appearance: {
            backgroundColor: "#f8fafc",
            backgroundPattern: "grid",
            patternColor: "#94a3b8",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#4f46e5",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#172033",
            nodeBorderColor: "#c7d2fe",
            nodeBorderWidth: 1,
            edgeColor: "#6366f1",
            edgeStyle: "curved",
            edgeWidth: 4.2,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1.2,
            colorfulBranches: true,
            branchColors: ["#4f46e5", "#0284c7", "#0f766e", "#7c3aed", "#db2777", "#ea580c"]
        }
    },
    {
        id: "ocean-blue",
        name: "深海蓝",
        description: "冷静、专业，适合分析与技术内容",
        appearance: {
            backgroundColor: "#f0f9ff",
            backgroundPattern: "dots",
            patternColor: "#7dd3fc",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#075985",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#0c4a6e",
            nodeBorderColor: "#bae6fd",
            nodeBorderWidth: 1,
            edgeColor: "#0284c7",
            edgeStyle: "curved",
            edgeWidth: 4.5,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1,
            colorfulBranches: true,
            branchColors: ["#0369a1", "#0891b2", "#0d9488", "#2563eb", "#4f46e5", "#06b6d4"]
        }
    },
    {
        id: "forest-green",
        name: "森林绿",
        description: "自然、沉稳，适合计划与成长主题",
        appearance: {
            backgroundColor: "#f7fee7",
            backgroundPattern: "dots",
            patternColor: "#86efac",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#3f6212",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#365314",
            nodeBorderColor: "#bbf7d0",
            nodeBorderWidth: 1,
            edgeColor: "#65a30d",
            edgeStyle: "curved",
            edgeWidth: 4,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1,
            colorfulBranches: true,
            branchColors: ["#4d7c0f", "#15803d", "#0f766e", "#65a30d", "#059669", "#84cc16"]
        }
    },
    {
        id: "sunset-orange",
        name: "日落橙",
        description: "温暖、有活力，适合创意与营销内容",
        appearance: {
            backgroundColor: "#fff7ed",
            backgroundPattern: "grid",
            patternColor: "#fdba74",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#c2410c",
            rootTextColor: "#ffffff",
            nodeColor: "#fffaf5",
            textColor: "#7c2d12",
            nodeBorderColor: "#fed7aa",
            nodeBorderWidth: 1,
            edgeColor: "#f97316",
            edgeStyle: "curved",
            edgeWidth: 4.4,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1.2,
            colorfulBranches: true,
            branchColors: ["#ea580c", "#f59e0b", "#dc2626", "#db2777", "#d97706", "#f97316"]
        }
    },
    {
        id: "lavender-dream",
        name: "薰衣草",
        description: "柔和、优雅，适合阅读笔记与灵感整理",
        appearance: {
            backgroundColor: "#faf5ff",
            backgroundPattern: "dots",
            patternColor: "#d8b4fe",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#7e22ce",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#581c87",
            nodeBorderColor: "#e9d5ff",
            nodeBorderWidth: 1,
            edgeColor: "#a855f7",
            edgeStyle: "curved",
            edgeWidth: 4,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1,
            colorfulBranches: true,
            branchColors: ["#9333ea", "#c026d3", "#7c3aed", "#db2777", "#6366f1", "#a855f7"]
        }
    },
    {
        id: "candy-pop",
        name: "糖果缤纷",
        description: "多彩、轻快，适合头脑风暴与生活记录",
        appearance: {
            backgroundColor: "#fff7fb",
            backgroundPattern: "dots",
            patternColor: "#f9a8d4",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#db2777",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#4a1630",
            nodeBorderColor: "#fbcfe8",
            nodeBorderWidth: 1,
            edgeColor: "#ec4899",
            edgeStyle: "curved",
            edgeWidth: 4.2,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1.1,
            colorfulBranches: true,
            branchColors: ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"]
        }
    },
    {
        id: "paper-note",
        name: "纸张笔记",
        description: "温润、书写感，适合读书笔记与长文梳理",
        appearance: {
            backgroundColor: "#fffdf7",
            backgroundPattern: "grid",
            patternColor: "#d6c8ad",
            fontFamily: "serif",
            fontSize: 15,
            rootColor: "#7c2d12",
            rootTextColor: "#fffaf0",
            nodeColor: "#fffaf0",
            textColor: "#3f2a1d",
            nodeBorderColor: "#d6c8ad",
            nodeBorderWidth: 1,
            edgeColor: "#9a6b42",
            edgeStyle: "curved",
            edgeWidth: 3.6,
            edgeWidthMode: "tapered",
            edgeMinWidth: 0.9,
            colorfulBranches: true,
            branchColors: ["#9a3412", "#a16207", "#4d7c0f", "#0f766e", "#7e22ce", "#be123c"]
        }
    },
    {
        id: "minimal-ink",
        name: "极简墨色",
        description: "黑白克制，适合正式文档与结构图",
        appearance: {
            backgroundColor: "#ffffff",
            backgroundPattern: "none",
            patternColor: "#d1d5db",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#111827",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#111827",
            nodeBorderColor: "#9ca3af",
            nodeBorderWidth: 1,
            edgeColor: "#4b5563",
            edgeStyle: "straight",
            edgeWidth: 3.2,
            edgeWidthMode: "tapered",
            edgeMinWidth: 0.8,
            colorfulBranches: false,
            branchColors: ["#111827", "#374151", "#4b5563", "#6b7280"]
        }
    },
    {
        id: "dark-neon",
        name: "暗夜霓虹",
        description: "高对比深色主题，适合夜间与科技内容",
        appearance: {
            backgroundColor: "#080d1a",
            backgroundPattern: "dots",
            patternColor: "#334155",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#7c3aed",
            rootTextColor: "#ffffff",
            nodeColor: "#111827",
            textColor: "#e5e7eb",
            nodeBorderColor: "#334155",
            nodeBorderWidth: 1,
            edgeColor: "#818cf8",
            edgeStyle: "curved",
            edgeWidth: 4.6,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1.1,
            colorfulBranches: true,
            branchColors: ["#8b5cf6", "#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#60a5fa"]
        }
    },
    {
        id: "mint-clean",
        name: "薄荷清新",
        description: "清透、简洁，适合工作清单与流程梳理",
        appearance: {
            backgroundColor: "#f0fdfa",
            backgroundPattern: "grid",
            patternColor: "#99f6e4",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#047857",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#134e4a",
            nodeBorderColor: "#a7f3d0",
            nodeBorderWidth: 1,
            edgeColor: "#14b8a6",
            edgeStyle: "curved",
            edgeWidth: 4,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1,
            colorfulBranches: true,
            branchColors: ["#059669", "#0d9488", "#0891b2", "#65a30d", "#0284c7", "#10b981"]
        }
    },
    {
        id: "spectrum-flow",
        name: "光谱脉络",
        description: "高辨识度的多彩分支，适合头脑风暴与主题拆解",
        appearance: {
            backgroundColor: "#ffffff",
            backgroundPattern: "none",
            patternColor: "#e5e7eb",
            fontFamily: "sans",
            fontSize: 15,
            rootColor: "#11113f",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#111827",
            nodeBorderColor: "#d1d5db",
            nodeBorderWidth: 1.5,
            edgeColor: "#4f46e5",
            edgeStyle: "curved",
            edgeWidth: 5,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1.2,
            colorfulBranches: true,
            branchColors: ["#ff443d", "#f59f45", "#f6c914", "#05b981", "#4868f7", "#5148c8", "#de3c78", "#19a7ce"]
        }
    },
    {
        id: "executive-navy",
        name: "远洋商务",
        description: "克制的海军蓝与青色层次，适合汇报、分析和项目规划",
        appearance: {
            backgroundColor: "#f5f8fc",
            backgroundPattern: "grid",
            patternColor: "#cbd5e1",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#132a4f",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#172b4d",
            nodeBorderColor: "#9fb7d4",
            nodeBorderWidth: 1,
            edgeColor: "#315d8c",
            edgeStyle: "curved",
            edgeWidth: 4.2,
            edgeWidthMode: "tapered",
            edgeMinWidth: 1,
            colorfulBranches: true,
            branchColors: ["#1f4e79", "#287f8f", "#3b6ea8", "#64748b", "#0f766e", "#475569"]
        }
    },
    {
        id: "botanical-calm",
        name: "植物静语",
        description: "柔和的苔绿、鼠尾草与泥土色，适合阅读和生活规划",
        appearance: {
            backgroundColor: "#f7f8f2",
            backgroundPattern: "dots",
            patternColor: "#cbd5b1",
            fontFamily: "serif",
            fontSize: 15,
            rootColor: "#344e41",
            rootTextColor: "#ffffff",
            nodeColor: "#fbfcf7",
            textColor: "#33433a",
            nodeBorderColor: "#b7c4a3",
            nodeBorderWidth: 1,
            edgeColor: "#6b8064",
            edgeStyle: "curved",
            edgeWidth: 3.8,
            edgeWidthMode: "tapered",
            edgeMinWidth: 0.9,
            colorfulBranches: true,
            branchColors: ["#52796f", "#7a8f62", "#a98467", "#6b705c", "#588157", "#8b7e66"]
        }
    },
    {
        id: "midnight-signal",
        name: "午夜信号",
        description: "深蓝画布与明亮信号色，适合技术架构和夜间使用",
        appearance: {
            backgroundColor: "#07111f",
            backgroundPattern: "grid",
            patternColor: "#24364b",
            fontFamily: "mono",
            fontSize: 14,
            rootColor: "#e6f6ff",
            rootTextColor: "#07111f",
            nodeColor: "#0f1d2e",
            textColor: "#dbeafe",
            nodeBorderColor: "#35516f",
            nodeBorderWidth: 1,
            edgeColor: "#38bdf8",
            edgeStyle: "elbow",
            edgeWidth: 3.8,
            edgeWidthMode: "uniform",
            edgeMinWidth: 3.8,
            colorfulBranches: true,
            branchColors: ["#38bdf8", "#2dd4bf", "#a78bfa", "#fb7185", "#facc15", "#60a5fa"]
        }
    },
    {
        id: "sketchbook-warm",
        name: "暖纸手稿",
        description: "温暖纸张与铅笔色调，适合学习笔记和创意草图",
        appearance: {
            backgroundColor: "#fbf5e9",
            backgroundPattern: "dots",
            patternColor: "#d8c8ad",
            fontFamily: "serif",
            fontSize: 15,
            rootColor: "#5f4b3b",
            rootTextColor: "#fffaf0",
            nodeColor: "#fffaf0",
            textColor: "#49382c",
            nodeBorderColor: "#aa927b",
            nodeBorderWidth: 1.5,
            edgeColor: "#796453",
            edgeStyle: "curved",
            edgeWidth: 3.2,
            edgeWidthMode: "uniform",
            edgeMinWidth: 3.2,
            colorfulBranches: true,
            branchColors: ["#9c6644", "#a98467", "#6b705c", "#7f5539", "#8a6f4d", "#7b6d8d"]
        }
    },
    {
        id: "monochrome-air",
        name: "黑白留白",
        description: "轻边框、大留白和单色层级，适合打印与正式结构图",
        appearance: {
            backgroundColor: "#ffffff",
            backgroundPattern: "none",
            patternColor: "#e5e7eb",
            fontFamily: "sans",
            fontSize: 14,
            rootColor: "#18181b",
            rootTextColor: "#ffffff",
            nodeColor: "#ffffff",
            textColor: "#27272a",
            nodeBorderColor: "#a1a1aa",
            nodeBorderWidth: 1,
            edgeColor: "#52525b",
            edgeStyle: "straight",
            edgeWidth: 2.5,
            edgeWidthMode: "uniform",
            edgeMinWidth: 2.5,
            colorfulBranches: false,
            branchColors: ["#18181b", "#3f3f46", "#71717a", "#a1a1aa"]
        }
    }
];
/**
 * 读取并返回mind map theme preset，并保持模型、界面和持久化状态的一致性。
 *
 * @param id 目标对象或节点的稳定标识。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function getMindMapThemePreset(id) {
    return exports.MINDMAP_THEME_PRESETS.find((preset) => preset.id === id);
}
/**
 * 执行“appearance from theme preset”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param id 目标对象或节点的稳定标识。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function appearanceFromThemePreset(id) {
    var _a;
    const preset = (_a = getMindMapThemePreset(id)) !== null && _a !== void 0 ? _a : exports.MINDMAP_THEME_PRESETS[0];
    return {
        ...preset.appearance,
        themePreset: preset.id,
        branchColors: preset.appearance.branchColors ? [...preset.appearance.branchColors] : undefined
    };
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/themes.ts
},
5: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file static-render.ts
 * @description 渲染领域的 Markdown 只读导图入口。
 *
 * 复用模型和 SVG 导出逻辑，保证嵌入预览与可编辑视图的布局和主题尽量一致。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderStaticMindMap = renderStaticMindMap;
exports.renderStaticSource = renderStaticSource;
const layout_1 = __bundleRequire(6);
const model_1 = __bundleRequire(1);
/**
 * 渲染static mind map，并保持模型、界面和持久化状态的一致性。
 *
 * @param container 接收渲染内容的 DOM 容器。
 * @param document 要处理的思维导图文档。
 * @param options 控制当前操作行为的可选配置。
 */
function renderStaticMindMap(container, document, options) {
    container.empty();
    container.addClass("mmc-static-preview");
    const svg = (0, layout_1.documentToSvg)(document.root, document.layout, document.title, (0, model_1.mergeAppearance)(options === null || options === void 0 ? void 0 : options.defaultAppearance, document.appearance));
    const image = container.createEl("img", {
        attr: {
            alt: `${document.title} 思维导图预览`,
            src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
        }
    });
    if (options === null || options === void 0 ? void 0 : options.maxHeight)
        image.style.maxHeight = `${options.maxHeight}px`;
    if ((options === null || options === void 0 ? void 0 : options.app) && options.file) {
        image.addEventListener("dblclick", () => {
            var _a;
            void ((_a = options.app) === null || _a === void 0 ? void 0 : _a.workspace.getLeaf(false).openFile(options.file));
        });
        image.setAttr("title", "双击打开思维导图");
    }
}
/**
 * 渲染static source，并保持模型、界面和持久化状态的一致性。
 *
 * @param container 接收渲染内容的 DOM 容器。
 * @param source 待解析或渲染的原始文本。
 * @param fallbackTitle 无法从内容中取得标题时使用的回退标题。
 * @param defaultAppearance 该参数用于 render static source 流程中的输入或控制。
 */
function renderStaticSource(container, source, fallbackTitle, defaultAppearance) {
    renderStaticMindMap(container, (0, model_1.parseDocument)(source, fallbackTitle), { defaultAppearance });
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/render/static-render.ts
},
6: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file layout.ts
 * @description 渲染领域的布局计算与 SVG 导出模块。
 *
 * 根据可见节点、自定义尺寸、布局方向和外观配置计算坐标、边界、连接线路径与层级线宽，并使用同一结果生成 SVG。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLayout = computeLayout;
exports.buildBranchColorMap = buildBranchColorMap;
exports.edgeWidthForDepth = edgeWidthForDepth;
exports.edgePath = edgePath;
exports.roundedElbowEdgePath = roundedElbowEdgePath;
exports.escapeXml = escapeXml;
exports.documentToSvg = documentToSvg;
const model_1 = __bundleRequire(1);
const collision_layout_1 = __bundleRequire(7);
const ROOT_WIDTH = 196;
const NODE_WIDTH = 176;
const H_GAP = 112;
const V_GAP = 24;
/**
 * 执行“visible children”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 按当前规则构建的集合结果。
 */
function visibleChildren(node) {
    return node.collapsed ? [] : node.children;
}
/**
 * 执行“estimated text lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @param width 该参数用于 estimated text lines 流程中的输入或控制。
 * @param fontSize 该参数用于 estimated text lines 流程中的输入或控制。
 * @returns 计算得到的数值结果。
 */
function estimatedTextLines(text, width, fontSize) {
    const available = Math.max(44, width - 48);
    const averageGlyphWidth = Math.max(5.5, fontSize * 0.62);
    const charsPerLine = Math.max(4, Math.floor(available / averageGlyphWidth));
    return Math.max(1, text.split(/\r?\n/).reduce((sum, line) => sum + Math.max(1, Math.ceil(Math.max(1, line.length) / charsPerLine)), 0));
}
/**
 * 执行“node dimensions”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @param depth 节点在树或文章结构中的零基层级。
 * @param defaultFontSize 未单独设置字号时使用的默认字号。
 * @returns 计算得到的数值结果。
 */
function nodeDimensions(node, depth, defaultFontSize = 14, visualStyle = "card", appearance = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const fontSize = (_b = (_a = node.style) === null || _a === void 0 ? void 0 : _a.fontSize) !== null && _b !== void 0 ? _b : defaultFontSize;
    const manualWidth = (_c = node.style) === null || _c === void 0 ? void 0 : _c.width;
    const extraWidth = Math.max(0, fontSize - 14) * 4;
    const blocks = (0, model_1.nodeContentBlocks)(node);
    const fitted = visualStyle === "branch";
    const fixedWidth = Math.max(100, Math.min(900, (_d = appearance.defaultNodeWidth) !== null && _d !== void 0 ? _d : NODE_WIDTH));
    const automatic = appearance.nodeWidthMode !== "fixed";
    const automaticMaximum = Math.max(120, Math.min(900, (_e = appearance.autoNodeMaxWidth) !== null && _e !== void 0 ? _e : 460));
    let width = manualWidth !== null && manualWidth !== void 0 ? manualWidth : (!automatic
        ? fixedWidth
        : fitted
            ? ((depth === 0 ? 146 : 92) + extraWidth)
            : ((depth === 0 ? ROOT_WIDTH : NODE_WIDTH) + extraWidth));
    if (!manualWidth && automatic) {
        for (const block of blocks) {
            if (block.type === "image")
                width = Math.max(width, 240);
            else {
                const longestLine = Math.max(1, ...block.text.split(/\r?\n/).map((line) => line.length));
                const visualUnits = Array.from((_f = block.text.split(/\r?\n/).sort((a, b) => b.length - a.length)[0]) !== null && _f !== void 0 ? _f : "")
                    .reduce((sum, character) => sum + (/[\u2e80-\u9fff\uff00-\uffef]/u.test(character) ? 1 : .62), 0);
                const horizontalPadding = fitted ? (depth === 0 ? 48 : 58) : 80;
                width = Math.max(width, Math.min(automaticMaximum, horizontalPadding + Math.min(visualUnits, 90) * fontSize));
            }
        }
        if (node.table) {
            const columns = Math.max(1, node.table.headers.length);
            width = Math.min(720, Math.max(300, columns * 124));
        }
        if (node.code) {
            const lines = node.code.code.split(/\r?\n/);
            const longest = Math.max(20, ...lines.slice(0, 80).map((line) => line.length));
            width = Math.min(720, Math.max(380, longest * 7.2 + 42));
        }
    }
    if (!manualWidth && automatic)
        width = Math.min(width, automaticMaximum);
    width = Math.min(900, Math.max(fitted ? 80 : 100, width));
    let height = 28 + Math.max(0, fontSize - 14) * 1.4;
    if (!blocks.length)
        height += depth === 0 ? 34 : 26;
    for (const block of blocks) {
        if (block.type === "image")
            height += 132;
        else
            height += Math.max(30, estimatedTextLines(block.text, width, fontSize) * (fontSize + 8));
    }
    if ((_g = node.tags) === null || _g === void 0 ? void 0 : _g.length)
        height += 20;
    if (node.table) {
        const visibleRows = Math.min(10, node.table.rows.length);
        height += 42 + visibleRows * 31 + (node.table.rows.length > visibleRows ? 24 : 0);
    }
    if (node.code) {
        const lines = node.code.code.split(/\r?\n/);
        height += Math.min(390, Math.max(100, Math.min(lines.length, 18) * 20 + 48));
    }
    height = Math.max(height, (_j = (_h = node.style) === null || _h === void 0 ? void 0 : _h.minHeight) !== null && _j !== void 0 ? _j : 0);
    return { width, height: Math.min(1200, height) };
}
/**
 * 执行“subtree height”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @param depth 节点在树或文章结构中的零基层级。
 * @param defaultFontSize 未单独设置字号时使用的默认字号。
 * @returns 计算得到的数值结果。
 */
function subtreeHeight(node, depth, defaultFontSize = 14, visualStyle = "card", appearance = {}) {
    const ownHeight = nodeDimensions(node, depth, defaultFontSize, visualStyle, appearance).height;
    const children = visibleChildren(node);
    if (!children.length)
        return ownHeight;
    const verticalGap = visualStyle === "branch" ? 18 : V_GAP;
    const childrenHeight = children.reduce((sum, child) => sum + subtreeHeight(child, depth + 1, defaultFontSize, visualStyle, appearance), 0) + verticalGap * (children.length - 1);
    return Math.max(ownHeight, childrenHeight);
}
/**
 * 执行“layout branch”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @param parentId 该参数用于 layout branch 流程中的输入或控制。
 * @param parentX 该参数用于 layout branch 流程中的输入或控制。
 * @param parentWidth 该参数用于 layout branch 流程中的输入或控制。
 * @param side 该参数用于 layout branch 流程中的输入或控制。
 * @param depth 节点在树或文章结构中的零基层级。
 * @param centerY 该参数用于 layout branch 流程中的输入或控制。
 * @param output 该参数用于 layout branch 流程中的输入或控制。
 * @param defaultFontSize 未单独设置字号时使用的默认字号。
 */
function layoutBranch(node, parentId, parentX, parentWidth, side, depth, centerY, output, defaultFontSize = 14, visualStyle = "card", appearance = {}) {
    const dimensions = nodeDimensions(node, depth, defaultFontSize, visualStyle, appearance);
    const horizontalGap = visualStyle === "branch" ? 54 : H_GAP;
    const verticalGap = visualStyle === "branch" ? 18 : V_GAP;
    const x = parentX + side * (parentWidth / 2 + horizontalGap + dimensions.width / 2);
    output.push({ node, parentId, x, y: centerY, depth, side, ...dimensions });
    const children = visibleChildren(node);
    if (!children.length)
        return;
    const heights = children.map((child) => subtreeHeight(child, depth + 1, defaultFontSize, visualStyle, appearance));
    const totalHeight = heights.reduce((sum, childHeight) => sum + childHeight, 0) + verticalGap * (children.length - 1);
    let cursor = centerY - totalHeight / 2;
    children.forEach((child, index) => {
        var _a;
        const childHeight = (_a = heights[index]) !== null && _a !== void 0 ? _a : nodeDimensions(child, depth + 1, defaultFontSize, visualStyle, appearance).height;
        const childCenter = cursor + childHeight / 2;
        layoutBranch(child, node.id, x, dimensions.width, side, depth + 1, childCenter, output, defaultFontSize, visualStyle, appearance);
        cursor += childHeight + verticalGap;
    });
}
/**
 * 计算当前可见节点的尺寸、坐标、深度和整体边界。折叠节点的后代不会参与布局；节点自定义宽度和最小高度会直接影响子树占位与连接线端点。
 *
 * @param root 节点树的根节点。
 * @param mode 当前布局或显示模式。
 * @param defaultFontSize 未单独设置字号时使用的默认字号。
 * @returns 当前操作生成、查找或规范化后的结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function computeLayout(root, mode, defaultFontSize = 14, visualStyle = "card", appearance = {}) {
    const rootDimensions = nodeDimensions(root, 0, defaultFontSize, visualStyle, appearance);
    const verticalGap = visualStyle === "branch" ? 18 : V_GAP;
    const nodes = [
        { node: root, parentId: null, x: 0, y: 0, depth: 0, side: 0, ...rootDimensions }
    ];
    const children = visibleChildren(root);
    if (mode === "balanced" && children.length > 1) {
        const left = [];
        const right = [];
        let leftHeight = 0;
        let rightHeight = 0;
        for (const child of [...children].sort((a, b) => subtreeHeight(b, 1, defaultFontSize, visualStyle, appearance) - subtreeHeight(a, 1, defaultFontSize, visualStyle, appearance))) {
            const height = subtreeHeight(child, 1, defaultFontSize, visualStyle, appearance) + verticalGap;
            if (leftHeight <= rightHeight) {
                left.push(child);
                leftHeight += height;
            }
            else {
                right.push(child);
                rightHeight += height;
            }
        }
        const placeSide = (items, side) => {
            const heights = items.map((child) => subtreeHeight(child, 1, defaultFontSize, visualStyle, appearance));
            const total = heights.reduce((sum, value) => sum + value, 0) + verticalGap * Math.max(0, items.length - 1);
            let cursor = -total / 2;
            items.forEach((child, index) => {
                var _a;
                const height = (_a = heights[index]) !== null && _a !== void 0 ? _a : nodeDimensions(child, 1, defaultFontSize, visualStyle, appearance).height;
                layoutBranch(child, root.id, 0, rootDimensions.width, side, 1, cursor + height / 2, nodes, defaultFontSize, visualStyle, appearance);
                cursor += height + verticalGap;
            });
        };
        placeSide(left, -1);
        placeSide(right, 1);
    }
    else {
        const heights = children.map((child) => subtreeHeight(child, 1, defaultFontSize, visualStyle, appearance));
        const total = heights.reduce((sum, value) => sum + value, 0) + verticalGap * Math.max(0, children.length - 1);
        let cursor = -total / 2;
        children.forEach((child, index) => {
            var _a;
            const height = (_a = heights[index]) !== null && _a !== void 0 ? _a : nodeDimensions(child, 1, defaultFontSize, visualStyle, appearance).height;
            layoutBranch(child, root.id, 0, rootDimensions.width, 1, 1, cursor + height / 2, nodes, defaultFontSize, visualStyle, appearance);
            cursor += height + verticalGap;
        });
    }
    (0, collision_layout_1.resolveLayoutCollisions)(nodes, verticalGap);
    const byId = new Map(nodes.map((position) => [position.node.id, position]));
    const minX = Math.min(...nodes.map((position) => position.x - position.width / 2));
    const maxX = Math.max(...nodes.map((position) => position.x + position.width / 2));
    const minY = Math.min(...nodes.map((position) => position.y - position.height / 2));
    const maxY = Math.max(...nodes.map((position) => position.y + position.height / 2));
    return { nodes, byId, minX, maxX, minY, maxY };
}
/**
 * 构建branch color map，并保持模型、界面和持久化状态的一致性。
 *
 * @param root 节点树的根节点。
 * @param colors 该参数用于 build branch color map 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function buildBranchColorMap(root, colors) {
    const result = new Map();
    if (!(colors === null || colors === void 0 ? void 0 : colors.length))
        return result;
    const visit = (node, color) => {
        result.set(node.id, color);
        node.children.forEach((child) => visit(child, color));
    };
    root.children.forEach((child, index) => visit(child, colors[index % colors.length]));
    return result;
}
/**
 * 根据连接线模式计算指定层级的线宽。统一模式始终返回起始宽度；渐细模式会按当前实际最大深度插值，并保证最深层达到最小宽度。
 *
 * @param appearance 导图外观配置。
 * @param depth 节点在树或文章结构中的零基层级。
 * @param maxDepth 当前可见树的最大层级，用于归一化计算。
 * @returns 计算得到的数值结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function edgeWidthForDepth(appearance, depth, maxDepth = 5) {
    var _a, _b;
    const maximum = Math.max(0.5, Math.min(8, (_a = appearance.edgeWidth) !== null && _a !== void 0 ? _a : 2.2));
    if (appearance.edgeWidthMode !== "tapered")
        return maximum;
    const minimum = Math.max(0.25, Math.min(maximum, (_b = appearance.edgeMinWidth) !== null && _b !== void 0 ? _b : Math.min(1, maximum)));
    const deepest = Math.max(1, Math.floor(maxDepth));
    // The first edge stays at the configured maximum. The deepest visible edge
    // reaches the configured minimum, so tapering remains obvious even in a
    // shallow two- or three-level map.
    const progress = deepest <= 1 ? 0 : Math.min(1, Math.max(0, depth - 1) / (deepest - 1));
    return Number((maximum + (minimum - maximum) * progress).toFixed(3));
}
/**
 * 执行“edge path”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param parent 当前节点的父节点；根节点场景可能为空。
 * @param child 该参数用于 edge path 流程中的输入或控制。
 * @param style 要应用、比较或规范化的样式。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function edgePath(parent, child, style = "curved") {
    const parentX = parent.x + (child.side >= 0 ? parent.width / 2 : -parent.width / 2);
    const childX = child.x - (child.side >= 0 ? child.width / 2 : -child.width / 2);
    if (style === "straight")
        return `M ${parentX} ${parent.y} L ${childX} ${child.y}`;
    const middleX = parentX + (childX - parentX) * 0.5;
    if (style === "elbow")
        return `M ${parentX} ${parent.y} L ${middleX} ${parent.y} L ${middleX} ${child.y} L ${childX} ${child.y}`;
    return `M ${parentX} ${parent.y} C ${middleX} ${parent.y}, ${middleX} ${child.y}, ${childX} ${child.y}`;
}
/**
 * Builds an orthogonal branch with rounded corners for the rounded-branch
 * visual style without relying on external assets.
 *
 * @param parent Parent node layout.
 * @param child Child node layout.
 * @returns SVG path data for a rounded elbow connector.
 */
function roundedElbowEdgePath(parent, child) {
    const parentX = parent.x + (child.side >= 0 ? parent.width / 2 : -parent.width / 2);
    const childX = child.x - (child.side >= 0 ? child.width / 2 : -child.width / 2);
    const middleX = parentX + (childX - parentX) * .5;
    const deltaY = child.y - parent.y;
    if (Math.abs(deltaY) < .5)
        return `M ${parentX} ${parent.y} L ${childX} ${child.y}`;
    const directionX = Math.sign(childX - parentX) || 1;
    const directionY = Math.sign(deltaY);
    const radius = Math.min(16, Math.abs(childX - parentX) / 4, Math.abs(deltaY) / 2);
    return [
        `M ${parentX} ${parent.y}`,
        `L ${middleX - directionX * radius} ${parent.y}`,
        `Q ${middleX} ${parent.y} ${middleX} ${parent.y + directionY * radius}`,
        `L ${middleX} ${child.y - directionY * radius}`,
        `Q ${middleX} ${child.y} ${middleX + directionX * radius} ${child.y}`,
        `L ${childX} ${child.y}`
    ].join(" ");
}
/**
 * 转义xml，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function escapeXml(value) {
    return value.replace(/[<>&"']/g, (character) => {
        var _a;
        const entities = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" };
        return (_a = entities[character]) !== null && _a !== void 0 ? _a : character;
    });
}
/**
 * 执行“valid color”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param value 待校验、转换或比较的输入值。
 * @param fallback 该参数用于 valid color 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function validColor(value, fallback) {
    return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
/**
 * 执行“svg radius”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param shape 该参数用于 svg radius 流程中的输入或控制。
 * @returns 计算得到的数值结果。
 */
function svgRadius(shape) {
    if (shape === "rectangle")
        return 3;
    if (shape === "pill")
        return 28;
    return 14;
}
/**
 * 执行“task glyph”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function taskGlyph(node) {
    if (node.task === "done")
        return "✓ ";
    if (node.task === "doing")
        return "◐ ";
    if (node.task === "todo")
        return "○ ";
    return "";
}
/**
 * 执行“truncate runs”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param maxLength 该参数用于 truncate runs 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
function truncateRuns(runs, maxLength) {
    const result = [];
    let remaining = maxLength;
    let truncated = false;
    for (const run of runs) {
        if (remaining <= 0) {
            truncated = true;
            break;
        }
        if (run.text.length <= remaining) {
            result.push({ text: run.text, style: run.style });
            remaining -= run.text.length;
            continue;
        }
        result.push({ text: run.text.slice(0, remaining), style: run.style });
        remaining = 0;
        truncated = true;
    }
    if (truncated && result.length)
        result[result.length - 1].text = `${result[result.length - 1].text.slice(0, -1)}…`;
    return result;
}
/**
 * 执行“rich text tspans”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 该参数用于 rich text tspans 流程中的输入或控制。
 * @param prefix 该参数用于 rich text tspans 流程中的输入或控制。
 * @param foreground 该参数用于 rich text tspans 流程中的输入或控制。
 * @param maxChars 该参数用于 rich text tspans 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function richTextTspans(runs, fallbackText, prefix, foreground, maxChars = 160) {
    const source = [
        ...(prefix ? [{ text: prefix }] : []),
        ...((runs === null || runs === void 0 ? void 0 : runs.length) ? runs : [{ text: fallbackText }])
    ];
    return truncateRuns(source, maxChars).map((run) => {
        const style = run.style;
        const attributes = [];
        if (style === null || style === void 0 ? void 0 : style.color)
            attributes.push(`fill="${validColor(style.color, foreground)}"`);
        if ((style === null || style === void 0 ? void 0 : style.bold) !== undefined)
            attributes.push(`font-weight="${style.bold ? 700 : 400}"`);
        if ((style === null || style === void 0 ? void 0 : style.italic) !== undefined)
            attributes.push(`font-style="${style.italic ? "italic" : "normal"}"`);
        const decorations = [];
        if (style === null || style === void 0 ? void 0 : style.underline)
            decorations.push("underline");
        if (style === null || style === void 0 ? void 0 : style.strike)
            decorations.push("line-through");
        if (decorations.length)
            attributes.push(`text-decoration="${decorations.join(" ")}"`);
        return `<tspan ${attributes.join(" ")}>${escapeXml(run.text)}</tspan>`;
    }).join("");
}
/**
 * 执行“svg wrapped lines”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param text 要显示、搜索、解析或写入的文本。
 * @param width 该参数用于 svg wrapped lines 流程中的输入或控制。
 * @param fontSize 该参数用于 svg wrapped lines 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function svgWrappedLines(text, width, fontSize) {
    const available = Math.max(44, width - 32);
    const maxChars = Math.max(4, Math.floor(available / Math.max(5.5, fontSize * .62)));
    const lines = [];
    for (const sourceLine of text.split(/\r?\n/)) {
        if (!sourceLine) {
            lines.push("");
            continue;
        }
        for (let index = 0; index < sourceLine.length; index += maxChars)
            lines.push(sourceLine.slice(index, index + maxChars));
    }
    return lines.length ? lines : [""];
}
/**
 * 执行“svg font family”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param mode 当前布局或显示模式。
 * @param customFont 该参数用于 svg font family 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function svgFontFamily(mode, customFont) {
    if (mode === "serif")
        return 'Georgia,"Times New Roman",serif';
    if (mode === "mono")
        return '"SFMono-Regular",Consolas,"Liberation Mono",monospace';
    if (mode === "custom" && (customFont === null || customFont === void 0 ? void 0 : customFont.trim()))
        return `"${customFont.trim().replaceAll('"', '')}",sans-serif`;
    return 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
}
/**
 * 使用与编辑画布一致的布局、文本对齐、节点尺寸、主题颜色、富文本和渐细连线生成独立 SVG 字符串。导出过程不依赖 DOM。
 *
 * @param root 节点树的根节点。
 * @param mode 当前布局或显示模式。
 * @param title 文档、节点或导出文件的显示标题。
 * @param appearance 导图外观配置。
 * @returns 计算、解析或序列化后的字符串结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function documentToSvg(root, mode, title, appearance = {}) {
    var _a, _b, _c, _d;
    const defaultFontSize = (_a = appearance.fontSize) !== null && _a !== void 0 ? _a : 14;
    const layout = computeLayout(root, mode, defaultFontSize, (_b = appearance.nodeVisualStyle) !== null && _b !== void 0 ? _b : "card", appearance);
    const padding = 72;
    const width = Math.max(320, layout.maxX - layout.minX + padding * 2);
    const height = Math.max(220, layout.maxY - layout.minY + padding * 2);
    const offsetX = padding - layout.minX;
    const offsetY = padding - layout.minY;
    const edgeStyle = (_c = appearance.edgeStyle) !== null && _c !== void 0 ? _c : "curved";
    const defaultEdge = validColor(appearance.edgeColor, "#7c8aa5");
    const branchColorMap = appearance.colorfulBranches ? buildBranchColorMap(root, appearance.branchColors) : new Map();
    const maxDepth = Math.max(1, ...layout.nodes.map((position) => position.depth));
    const edges = layout.nodes
        .filter((position) => position.parentId)
        .map((position) => {
        var _a, _b;
        const parent = position.parentId ? layout.byId.get(position.parentId) : undefined;
        const stroke = validColor((_a = position.node.style) === null || _a === void 0 ? void 0 : _a.color, (_b = branchColorMap.get(position.node.id)) !== null && _b !== void 0 ? _b : defaultEdge);
        const width = edgeWidthForDepth(appearance, position.depth, maxDepth);
        if (!parent)
            return "";
        const path = appearance.nodeVisualStyle === "branch"
            ? roundedElbowEdgePath(parent, position)
            : edgePath(parent, position, edgeStyle);
        return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>`;
    })
        .join("\n");
    const nodes = layout.nodes.map((position) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
        const node = position.node;
        const x = position.x - position.width / 2;
        const y = position.y - position.height / 2;
        const isRoot = position.depth === 0;
        const defaultBackground = isRoot ? validColor(appearance.rootColor, "#4f46e5") : validColor(appearance.nodeColor, "#ffffff");
        const defaultText = isRoot ? validColor(appearance.rootTextColor, "#ffffff") : validColor(appearance.textColor, "#0f172a");
        const background = validColor((_a = node.style) === null || _a === void 0 ? void 0 : _a.color, defaultBackground);
        const foreground = validColor((_b = node.style) === null || _b === void 0 ? void 0 : _b.textColor, defaultText);
        const branchColor = branchColorMap.get(node.id);
        const border = validColor((_c = node.style) === null || _c === void 0 ? void 0 : _c.borderColor, isRoot ? background : branchColor !== null && branchColor !== void 0 ? branchColor : validColor(appearance.nodeBorderColor, "#94a3b8"));
        const borderWidth = (_f = (_e = (_d = node.style) === null || _d === void 0 ? void 0 : _d.borderWidth) !== null && _e !== void 0 ? _e : appearance.nodeBorderWidth) !== null && _f !== void 0 ? _f : (isRoot ? 2 : 1);
        const prefix = `${node.icon ? `${node.icon} ` : ""}${taskGlyph(node)}`;
        const textAlign = (_j = (_h = (_g = node.style) === null || _g === void 0 ? void 0 : _g.textAlign) !== null && _h !== void 0 ? _h : appearance.nodeTextAlign) !== null && _j !== void 0 ? _j : "center";
        const textAnchor = textAlign === "left" ? "start" : textAlign === "right" ? "end" : "middle";
        const textX = textAlign === "left" ? x + 16 : textAlign === "right" ? x + position.width - 16 : position.x;
        const contentBlocks = (0, model_1.nodeContentBlocks)(node);
        let contentY = y + 28;
        const contentParts = [];
        let prefixUsed = false;
        let submapMarkerUsed = false;
        for (const block of contentBlocks) {
            if (block.type === "image") {
                contentParts.push(`<rect x="${position.x - 70}" y="${contentY - 14}" width="140" height="94" rx="8" fill="rgba(127,127,127,.12)"/><text x="${position.x}" y="${contentY + 38}" text-anchor="middle" fill="${foreground}" font-size="12">🖼 ${escapeXml(((_k = block.alt) !== null && _k !== void 0 ? _k : "图片").slice(0, 20))}</text>`);
                contentY += 112;
            }
            else if (block.text.trim()) {
                const blockPrefix = prefixUsed ? "" : prefix;
                prefixUsed = true;
                const suffix = node.submap && !submapMarkerUsed ? "  ↗" : "";
                submapMarkerUsed = submapMarkerUsed || Boolean(suffix);
                const fontSize = (_m = (_l = node.style) === null || _l === void 0 ? void 0 : _l.fontSize) !== null && _m !== void 0 ? _m : defaultFontSize;
                const plainText = `${blockPrefix}${block.text}${suffix}`;
                const lines = svgWrappedLines(plainText, position.width, fontSize);
                if (lines.length === 1) {
                    const maxChars = Math.max(42, Math.floor((position.width - 32) / Math.max(5.5, fontSize * .62)));
                    const submapSuffix = suffix ? `<tspan fill="${foreground}" opacity=".72">${escapeXml(suffix)}</tspan>` : "";
                    contentParts.push(`<text x="${textX}" y="${contentY}" text-anchor="${textAnchor}" fill="${foreground}" font-size="${fontSize}">${richTextTspans(block.richText, block.text, blockPrefix, foreground, maxChars)}${submapSuffix}</text>`);
                }
                else {
                    lines.forEach((line, index) => contentParts.push(`<text x="${textX}" y="${contentY + index * (fontSize + 8)}" text-anchor="${textAnchor}" fill="${foreground}" font-size="${fontSize}">${escapeXml(line)}</text>`));
                }
                contentY += lines.length * (fontSize + 8);
            }
        }
        if (!contentBlocks.length) {
            const fontSize = (_p = (_o = node.style) === null || _o === void 0 ? void 0 : _o.fontSize) !== null && _p !== void 0 ? _p : defaultFontSize;
            const lines = svgWrappedLines(`${prefix || (0, model_1.nodePlainText)(node) || "图片节点"}${node.submap ? "  ↗" : ""}`, position.width, fontSize);
            lines.forEach((line, index) => contentParts.push(`<text x="${textX}" y="${contentY + index * (fontSize + 8)}" text-anchor="${textAnchor}" fill="${foreground}" font-size="${fontSize}">${escapeXml(line)}</text>`));
        }
        let richY = contentY + 10;
        const richParts = [];
        if (node.table) {
            const rows = [node.table.headers, ...node.table.rows.slice(0, 8)];
            rows.forEach((row, index) => {
                const rowText = escapeXml(row.map((cell) => cell.replaceAll("\n", " ")).join("  |  ").slice(0, 100));
                richParts.push(`<text x="${x + 16}" y="${richY + index * 23}" fill="${foreground}" font-size="${index === 0 ? 10.5 : 9.5}" font-weight="${index === 0 ? 700 : 400}">${rowText}</text>`);
            });
            if (node.table.rows.length > 8)
                richParts.push(`<text x="${x + 16}" y="${richY + rows.length * 23}" fill="${foreground}" opacity=".65" font-size="9">… 还有 ${node.table.rows.length - 8} 行</text>`);
        }
        if (node.code) {
            richParts.push(`<rect x="${x + 12}" y="${richY - 14}" width="${position.width - 24}" height="${Math.min(350, Math.max(80, node.code.code.split(/\r?\n/).length * 17 + 34))}" rx="7" fill="rgba(15,23,42,.10)"/>`);
            richParts.push(`<text x="${x + 20}" y="${richY + 3}" fill="${foreground}" opacity=".7" font-size="9">${escapeXml(node.code.language || "code")}</text>`);
            node.code.code.split(/\r?\n/).slice(0, 16).forEach((line, index) => richParts.push(`<text x="${x + 20}" y="${richY + 23 + index * 17}" fill="${foreground}" font-size="9" font-family="monospace">${escapeXml(line.slice(0, 92))}</text>`));
        }
        const richContent = richParts.join("");
        const tags = ((_q = node.tags) === null || _q === void 0 ? void 0 : _q.length)
            ? `<text x="${position.x}" y="${position.y + position.height / 2 - 9}" text-anchor="middle" fill="${foreground}" opacity=".72" font-size="10">${escapeXml(node.tags.map((tag) => `#${tag}`).join("  ").slice(0, 48))}</text>`
            : "";
        const bold = (_t = (_s = (_r = node.style) === null || _r === void 0 ? void 0 : _r.bold) !== null && _s !== void 0 ? _s : appearance.bold) !== null && _t !== void 0 ? _t : false;
        const italic = (_w = (_v = (_u = node.style) === null || _u === void 0 ? void 0 : _u.italic) !== null && _v !== void 0 ? _v : appearance.italic) !== null && _w !== void 0 ? _w : false;
        const underline = (_z = (_y = (_x = node.style) === null || _x === void 0 ? void 0 : _x.underline) !== null && _y !== void 0 ? _y : appearance.underline) !== null && _z !== void 0 ? _z : false;
        const fontSize = (_1 = (_0 = node.style) === null || _0 === void 0 ? void 0 : _0.fontSize) !== null && _1 !== void 0 ? _1 : defaultFontSize;
        return `<g><rect x="${x}" y="${y}" width="${position.width}" height="${position.height}" rx="${svgRadius((_2 = node.style) === null || _2 === void 0 ? void 0 : _2.shape)}" fill="${background}" stroke="${border}" stroke-width="${borderWidth}"/><g font-weight="${isRoot || bold ? 700 : 400}" font-style="${italic ? "italic" : "normal"}" text-decoration="${underline ? "underline" : "none"}">${contentParts.join("")}</g>${richContent}${tags}</g>`;
    }).join("\n");
    const background = validColor(appearance.backgroundColor, "#f8fafc");
    const patternColor = validColor(appearance.patternColor, "#94a3b8");
    const pattern = (_d = appearance.backgroundPattern) !== null && _d !== void 0 ? _d : "none";
    const defs = pattern === "grid"
        ? `<defs><pattern id="mmc-pattern" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="${patternColor}" stroke-width="1" opacity=".18"/></pattern></defs><rect width="100%" height="100%" fill="url(#mmc-pattern)"/>`
        : pattern === "dots"
            ? `<defs><pattern id="mmc-pattern" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="${patternColor}" opacity=".28"/></pattern></defs><rect width="100%" height="100%" fill="url(#mmc-pattern)"/>`
            : "";
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height)}" viewBox="0 0 ${Math.ceil(width)} ${Math.ceil(height)}">
<title>${escapeXml(title)}</title>
<style>svg{background:${background};font-family:${svgFontFamily(appearance.fontFamily, appearance.customFont)}}</style>
${defs}<g transform="translate(${offsetX} ${offsetY})">${edges}${nodes}</g>
</svg>`;
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/render/layout.ts
},
7: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file collision-layout.ts
 * @description 导图节点包围盒碰撞检测与子树纵向避让。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLayoutCollisions = resolveLayoutCollisions;
/**
 * 检测相交的节点矩形，并把其中一棵子树整体向下移动。
 *
 * @param nodes 当前布局中的可见节点；坐标会被原地调整。
 * @param verticalGap 避让后两个节点包围盒之间保留的最小纵向间距。
 * @returns 实际执行的子树平移次数。
 */
function resolveLayoutCollisions(nodes, verticalGap) {
    var _a;
    if (nodes.length < 2)
        return 0;
    const children = new Map();
    const byId = new Map(nodes.map((node) => [node.node.id, node]));
    for (const node of nodes) {
        if (!node.parentId)
            continue;
        const siblings = (_a = children.get(node.parentId)) !== null && _a !== void 0 ? _a : [];
        siblings.push(node);
        children.set(node.parentId, siblings);
    }
    const descendants = (root) => {
        const result = [];
        const visit = (node) => {
            var _a;
            result.push(node);
            for (const child of (_a = children.get(node.node.id)) !== null && _a !== void 0 ? _a : [])
                visit(child);
        };
        visit(root);
        return result;
    };
    const moveSubtree = (root, offset) => {
        for (const node of descendants(root))
            node.y += offset;
    };
    const overlapsHorizontally = (a, b) => a.x - a.width / 2 < b.x + b.width / 2
        && a.x + a.width / 2 > b.x - b.width / 2;
    const contains = (ancestor, candidate) => {
        let current = candidate;
        while (current === null || current === void 0 ? void 0 : current.parentId) {
            if (current.parentId === ancestor.node.id)
                return true;
            current = byId.get(current.parentId);
        }
        return false;
    };
    let moves = 0;
    const maxPasses = Math.max(4, nodes.length * 2);
    for (let pass = 0; pass < maxPasses; pass += 1) {
        let changed = false;
        const ordered = [...nodes].sort((a, b) => (a.y - a.height / 2) - (b.y - b.height / 2)
            || a.x - b.x);
        for (let firstIndex = 0; firstIndex < ordered.length; firstIndex += 1) {
            const first = ordered[firstIndex];
            for (let secondIndex = firstIndex + 1; secondIndex < ordered.length; secondIndex += 1) {
                const second = ordered[secondIndex];
                if (!overlapsHorizontally(first, second))
                    continue;
                const firstBottom = first.y + first.height / 2;
                const secondTop = second.y - second.height / 2;
                const requiredOffset = firstBottom + verticalGap - secondTop;
                if (requiredOffset <= 0)
                    continue;
                // 根节点固定在画布中心；与根节点相交时移动相邻分支。
                const moving = second.parentId === null || contains(second, first) ? first : second;
                const stationary = moving === second ? first : second;
                const offset = moving === second
                    ? stationary.y + stationary.height / 2 + verticalGap - (moving.y - moving.height / 2)
                    : stationary.y - stationary.height / 2 - verticalGap - (moving.y + moving.height / 2);
                if (offset === 0)
                    continue;
                moveSubtree(moving, offset);
                moves += 1;
                changed = true;
                break;
            }
            if (changed)
                break;
        }
        if (!changed)
            break;
    }
    return moves;
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/render/collision-layout.ts
},
8: function(module, exports, __bundleRequire, require) {
"use strict";
/**
* @file view.ts
* @description Obsidian TextFileView 适配层。
*
* 连接磁盘文件与编辑器，负责加载保存、外部刷新、全局模式、文章上下文、链接、图片资源和导出。
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MindMapStudioView = exports.VIEW_TYPE_MINDMAP_STUDIO = void 0;
const obsidian_1 = require("obsidian");
const editor_1 = __bundleRequire(9);
const model_1 = __bundleRequire(1);
const settings_1 = __bundleRequire(3);
const import_export_1 = __bundleRequire(15);
exports.VIEW_TYPE_MINDMAP_STUDIO = "mindmap-studio-view";
/**
 * MindMapStudioView 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class MindMapStudioView extends obsidian_1.TextFileView {
    /**
     * 创建 MindMapStudioView 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param leaf 该参数用于 constructor 流程中的输入或控制。
     * @param plugin MindMap Studio 插件实例，用于调用跨文件服务和读取设置。
     */
    constructor(leaf, plugin) {
        super(leaf);
        this.editor = null;
        this.document = null;
        this.savedTimer = null;
        this.pendingFocusNodeId = null;
        this.articleBaseDepth = 0;
        this.articleTocEntries = [];
        this.showArticleToc = false;
        this.readingSections = [];
        this.articleContextToken = 0;
        this.articleContextTimer = null;
        this.plugin = plugin;
    }
    /**
     * 读取并返回view type，并保持模型、界面和持久化状态的一致性。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    getViewType() {
        return exports.VIEW_TYPE_MINDMAP_STUDIO;
    }
    /**
     * 读取并返回display text，并保持模型、界面和持久化状态的一致性。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    getDisplayText() {
        var _a, _b;
        return (_b = (_a = this.file) === null || _a === void 0 ? void 0 : _a.basename) !== null && _b !== void 0 ? _b : "思维导图";
    }
    /**
     * 读取并返回icon，并保持模型、界面和持久化状态的一致性。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    getIcon() {
        return "brain-circuit";
    }
    /**
     * 返回当前编辑器文档的序列化文本，供 Obsidian 自动保存。保存使用模型层统一序列化，确保兼容字段和版本号正确。
     * @returns 计算、解析或序列化后的字符串结果。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    getViewData() {
        var _a, _b;
        const document = (_b = (_a = this.editor) === null || _a === void 0 ? void 0 : _a.getDocument()) !== null && _b !== void 0 ? _b : this.document;
        return (0, model_1.serializeDocument)(document !== null && document !== void 0 ? document : this.plugin.createConfiguredDocument("思维导图"));
    }
    /**
     * 接收 Obsidian 读取的文件文本，解析成领域文档并交给编辑器。重新加载时会保留全局显示模式，并异步刷新文章父子上下文。
     *
     * @param data 该参数用于 set view data 流程中的输入或控制。
     * @param clear 该参数用于 set view data 流程中的输入或控制。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    setViewData(data, clear) {
        var _a, _b, _c;
        const title = (_b = (_a = this.file) === null || _a === void 0 ? void 0 : _a.basename) !== null && _b !== void 0 ? _b : "思维导图";
        this.document = (0, model_1.parseDocument)(data, title);
        this.articleBaseDepth = 0;
        this.articleTocEntries = [];
        this.showArticleToc = false;
        this.articleNavigation = undefined;
        this.readingSections = [];
        this.applyViewClasses();
        if (!this.editor || clear) {
            (_c = this.editor) === null || _c === void 0 ? void 0 : _c.destroy();
            this.contentEl.empty();
            this.editor = new editor_1.MindMapEditor(this.app, this.contentEl, this.document, {
                onChange: (document) => {
                    this.document = document;
                    this.requestSave();
                    this.scheduleSavedIndicator();
                    this.scheduleArticleContextRefresh(320);
                },
                onOpenLink: async (link) => this.openLink(link),
                onExportSvg: async (svg) => this.exportTextFile("svg", svg),
                onExportMarkdown: async (markdown) => this.exportTextFile("md", markdown),
                onExportJson: async (json) => this.exportTextFile("json", json),
                onExportDocument: async (format) => this.exportArticleFamily(format),
                resolveImage: (source) => this.resolveImage(source),
                onSavePastedImage: async (blob, suggestedName) => this.plugin.savePastedImage(blob, suggestedName, this.file),
                getImageHosts: () => this.plugin.getImageHostChoices(),
                getDefaultUploadHostIds: () => this.plugin.getDefaultUploadHostIds(),
                onUploadImage: async (blob, suggestedName, hostIds) => this.plugin.uploadImageToHosts(blob, suggestedName, hostIds),
                onReadImageSource: async (source) => this.plugin.readImageSource(source, this.file),
                onScheduleAutoUpload: (nodeId, blockId, localPath, suggestedName) => this.plugin.scheduleAutoUpload(this.file, nodeId, blockId, localPath, suggestedName),
                onCreateSubmap: async (node) => {
                    if (!this.file)
                        throw new Error("当前脑图尚未关联文件");
                    return this.plugin.createSubmapFile(this.file, node);
                },
                onDeleteSubmap: async (submap) => {
                    if (!this.file)
                        return false;
                    return this.plugin.deleteSubmapFile(this.file, submap);
                },
                onExtractToSubmap: async (node) => {
                    if (!this.file)
                        throw new Error("当前脑图尚未关联文件");
                    await this.save();
                    return this.plugin.extractToSubmap(this.file, node);
                },
                onMergeFromSubmap: async () => {
                    if (!this.file) {
                        new obsidian_1.Notice("当前脑图尚未关联文件");
                        return;
                    }
                    await this.save();
                    await this.plugin.mergeFromSubmap(this.file);
                },
                onOpenMindMap: async (path, focusNodeId) => {
                    var _a, _b;
                    await this.save();
                    await this.plugin.openMindMapPath(path, (_b = (_a = this.file) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : "", this.leaf, focusNodeId);
                },
                onOpenArticleDirectory: async (path) => {
                    var _a, _b;
                    await this.save();
                    await this.plugin.openMindMapPath(path, (_b = (_a = this.file) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : "", this.leaf);
                    if (this.leaf.view instanceof MindMapStudioView)
                        this.leaf.view.showArticleDirectory();
                },
                onSearchMapFamily: () => void this.openMapFamilySearch(),
                onGlobalSearch: () => this.plugin.openGlobalSearch(),
                onDisplayModeChange: (mode) => this.plugin.setGlobalDisplayMode(mode),
                onReadingProgressChange: async (path, progress) => {
                    this.plugin.settings.readingProgress[path] = progress;
                    await this.plugin.saveSettings();
                },
                onRenderCode: async (block, container) => {
                    var _a, _b, _c;
                    const longestFence = Math.max(2, ...Array.from(block.code.matchAll(/`+/g), (match) => match[0].length));
                    const fence = "`".repeat(longestFence + 1);
                    const markdown = `${fence}${(_a = block.language) !== null && _a !== void 0 ? _a : ""}\n${block.code}\n${fence}`;
                    await obsidian_1.MarkdownRenderer.render(this.app, markdown, container, (_c = (_b = this.file) === null || _b === void 0 ? void 0 : _b.path) !== null && _c !== void 0 ? _c : "", this);
                }
            }, this.getEditorOptions());
        }
        else {
            this.editor.setDocument(this.document, false);
            this.editor.setOptions(this.getEditorOptions());
        }
        if (this.pendingFocusNodeId && this.editor) {
            const nodeId = this.pendingFocusNodeId;
            this.pendingFocusNodeId = null;
            window.setTimeout(() => { var _a; return (_a = this.editor) === null || _a === void 0 ? void 0 : _a.focusNodeById(nodeId); }, 20);
        }
        this.scheduleArticleContextRefresh(0);
    }
    /**
     * 执行“clear”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    clear() {
        var _a;
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.destroy();
        this.editor = null;
        this.document = null;
        this.contentEl.empty();
    }
    /**
     * Displays and persists the generated directory for the top-level article.
     */
    showArticleDirectory() {
        var _a;
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.showArticleDirectory();
    }
    /**
     * 保存相关数据，并保持模型、界面和持久化状态的一致性。
     *
     * @param clear 该参数用于 save 流程中的输入或控制。
     */
    async save(clear) {
        var _a;
        await super.save(clear);
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.markSaved();
    }
    /**
     * 在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。
     */
    async onClose() {
        var _a;
        if (this.savedTimer !== null)
            window.clearTimeout(this.savedTimer);
        if (this.articleContextTimer !== null)
            window.clearTimeout(this.articleContextTimer);
        this.articleContextToken += 1;
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.destroy();
        this.editor = null;
        await super.onClose();
    }
    /**
     * 打开map family search，并保持模型、界面和持久化状态的一致性。
     */
    async openMapFamilySearch() {
        var _a, _b, _c;
        const file = this.file;
        if (!file) {
            new obsidian_1.Notice("当前导图尚未保存，无法搜索子导图");
            return;
        }
        await this.save();
        await this.plugin.openMapFamilySearch(file, (_c = (_b = (_a = this.editor) === null || _a === void 0 ? void 0 : _a.getDocument()) !== null && _b !== void 0 ? _b : this.document) !== null && _c !== void 0 ? _c : undefined);
    }
    /**
     * 刷新appearance，并保持模型、界面和持久化状态的一致性。
     */
    refreshAppearance() {
        var _a;
        this.applyViewClasses();
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.setOptions(this.getEditorOptions());
    }
    /**
     * 定位node，并保持模型、界面和持久化状态的一致性。
     *
     * @param nodeId 目标节点的稳定标识。
     */
    focusNode(nodeId) {
        if (!this.editor) {
            this.pendingFocusNodeId = nodeId;
            return;
        }
        this.editor.focusNodeById(nodeId);
    }
    /**
     * 更新并应用display mode，并保持模型、界面和持久化状态的一致性。
     *
     * @param mode 当前布局或显示模式。
     */
    setDisplayMode(mode) {
        var _a;
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.setDisplayMode(mode);
    }
    /**
     * 应用global display mode，并保持模型、界面和持久化状态的一致性。
     *
     * @param mode 当前布局或显示模式。
     */
    applyGlobalDisplayMode(mode) {
        var _a;
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.applyGlobalDisplayMode(mode);
    }
    /**
     * 切换read only，并保持模型、界面和持久化状态的一致性。
     */
    toggleReadOnly() {
        var _a;
        (_a = this.editor) === null || _a === void 0 ? void 0 : _a.toggleReadOnly();
    }
    /**
     * 读取并返回editor options，并保持模型、界面和持久化状态的一致性。
     */
    getEditorOptions() {
        var _a;
        return {
            defaultNodeShape: this.plugin.settings.defaultNodeShape,
            defaultAppearance: (0, settings_1.settingsToAppearance)(this.plugin.settings),
            showTaskProgress: this.plugin.settings.showTaskProgress,
            autoFitOnOpen: this.plugin.settings.autoFitOnOpen,
            twoFingerGestureAction: this.plugin.settings.twoFingerGestureAction,
            resizeModifier: this.plugin.settings.resizeModifier,
            historyLimit: this.plugin.settings.historyLimit,
            imageFailoverEnabled: this.plugin.settings.imageFailoverEnabled,
            imageFailoverTimeoutSeconds: this.plugin.settings.imageFailoverTimeoutSeconds,
            imageFailoverUseLocalFallback: this.plugin.settings.imageFailoverUseLocalFallback,
            visibleModes: [...this.plugin.settings.visibleModes],
            defaultViewMode: this.plugin.settings.defaultViewMode,
            nodeEditorPosition: this.plugin.settings.nodeEditorPosition,
            richTextShortcuts: {
                bold: this.plugin.settings.richTextBoldShortcut,
                italic: this.plugin.settings.richTextItalicShortcut,
                underline: this.plugin.settings.richTextUnderlineShortcut,
                color: this.plugin.settings.richTextColorShortcut
            },
            visibleToolbarItems: [...this.plugin.settings.visibleToolbarItems],
            toolbarItemOrder: [...this.plugin.settings.toolbarItemOrder],
            articleBaseDepth: this.articleBaseDepth,
            articleTocEntries: [...this.articleTocEntries],
            articleTocMaxDepth: this.plugin.settings.articleTocMaxDepth,
            showArticleToc: this.showArticleToc,
            articleNavigation: this.articleNavigation,
            readingSections: this.readingSections,
            readingProgress: this.articleNavigation ? ((_a = this.plugin.settings.readingProgress[this.articleNavigation.homePath]) !== null && _a !== void 0 ? _a : 0) : 0,
            readingProgressPosition: this.plugin.settings.readingProgressPosition,
            returnToTopVisibility: this.plugin.settings.returnToTopVisibility
        };
    }
    /**
     * 安排延迟执行article context refresh，并保持模型、界面和持久化状态的一致性。
     *
     * @param delay 该参数用于 schedule article context refresh 流程中的输入或控制。
     */
    scheduleArticleContextRefresh(delay) {
        if (this.articleContextTimer !== null)
            window.clearTimeout(this.articleContextTimer);
        this.articleContextTimer = window.setTimeout(() => {
            this.articleContextTimer = null;
            void this.refreshArticleContext();
        }, Math.max(0, delay));
    }
    /**
     * 刷新article context，并保持模型、界面和持久化状态的一致性。
     */
    async refreshArticleContext() {
        var _a, _b, _c, _d;
        const file = this.file;
        const document = (_b = (_a = this.editor) === null || _a === void 0 ? void 0 : _a.getDocument()) !== null && _b !== void 0 ? _b : this.document;
        if (!file || !document)
            return;
        const token = ++this.articleContextToken;
        try {
            const context = await this.plugin.buildArticleContext(file, document);
            if (token !== this.articleContextToken || ((_c = this.file) === null || _c === void 0 ? void 0 : _c.path) !== file.path)
                return;
            this.articleBaseDepth = context.baseDepth;
            this.articleTocEntries = context.tocEntries;
            this.showArticleToc = context.showToc;
            this.articleNavigation = context.navigation;
            this.readingSections = context.readingSections;
            (_d = this.editor) === null || _d === void 0 ? void 0 : _d.setOptions(this.getEditorOptions());
        }
        catch (error) {
            console.warn("MindMap Studio article context refresh failed", error);
        }
    }
    /**
     * 应用view classes，并保持模型、界面和持久化状态的一致性。
     */
    applyViewClasses() {
        var _a, _b;
        const theme = (_b = (_a = this.document) === null || _a === void 0 ? void 0 : _a.theme) !== null && _b !== void 0 ? _b : "auto";
        this.contentEl.toggleClass("mmc-force-light", theme === "light");
        this.contentEl.toggleClass("mmc-force-dark", theme === "dark");
    }
    /**
     * 安排延迟执行saved indicator，并保持模型、界面和持久化状态的一致性。
     */
    scheduleSavedIndicator() {
        if (this.savedTimer !== null)
            window.clearTimeout(this.savedTimer);
        this.savedTimer = window.setTimeout(() => { var _a; return (_a = this.editor) === null || _a === void 0 ? void 0 : _a.markSaved(); }, 2300);
    }
    /**
     * 打开link，并保持模型、界面和持久化状态的一致性。
     *
     * @param rawLink 该参数用于 open link 流程中的输入或控制。
     */
    async openLink(rawLink) {
        var _a, _b, _c, _d, _e;
        const link = rawLink.trim();
        if (/^https?:\/\//i.test(link)) {
            window.open(link, "_blank", "noopener,noreferrer");
            return;
        }
        const wikiMatch = link.match(/^\[\[([\s\S]+?)\]\]$/);
        const target = (_c = (_b = ((_a = wikiMatch === null || wikiMatch === void 0 ? void 0 : wikiMatch[1]) !== null && _a !== void 0 ? _a : link).split("|")[0]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : link;
        await this.app.workspace.openLinkText(target, (_e = (_d = this.file) === null || _d === void 0 ? void 0 : _d.path) !== null && _e !== void 0 ? _e : "", false);
    }
    /**
     * 解析并确定image，并保持模型、界面和持久化状态的一致性。
     *
     * @param rawSource 该参数用于 resolve image 流程中的输入或控制。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    resolveImage(rawSource) {
        var _a, _b, _c, _d, _e, _f;
        const source = rawSource.trim();
        if (!source)
            return null;
        if (/^(https?:|data:|blob:)/i.test(source))
            return source;
        const wikiMatch = source.match(/^!?\[\[([\s\S]+?)\]\]$/);
        const target = (_d = (_c = (_b = ((_a = wikiMatch === null || wikiMatch === void 0 ? void 0 : wikiMatch[1]) !== null && _a !== void 0 ? _a : source).split("|")[0]) === null || _b === void 0 ? void 0 : _b.split("#")[0]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : source;
        const file = this.app.metadataCache.getFirstLinkpathDest(target, (_f = (_e = this.file) === null || _e === void 0 ? void 0 : _e.path) !== null && _f !== void 0 ? _f : "");
        if (!(file instanceof obsidian_1.TFile))
            return null;
        return this.app.vault.getResourcePath(file);
    }
    /**
     * 执行“export text file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param extension 该参数用于 export text file 流程中的输入或控制。
     * @param content 该参数用于 export text file 流程中的输入或控制。
     */
    async exportTextFile(extension, content) {
        var _a, _b, _c, _d, _e;
        const file = this.file;
        const parentPath = (_b = (_a = file === null || file === void 0 ? void 0 : file.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : "";
        const baseName = (_e = (_c = file === null || file === void 0 ? void 0 : file.basename) !== null && _c !== void 0 ? _c : (_d = this.document) === null || _d === void 0 ? void 0 : _d.title) !== null && _e !== void 0 ? _e : "思维导图";
        const path = await this.plugin.getAvailablePath((0, obsidian_1.normalizePath)(`${parentPath ? `${parentPath}/` : ""}${baseName}.${extension}`));
        await this.app.vault.create(path, content);
        new obsidian_1.Notice(`已导出：${path}`);
    }
    /**
     * Exports the current map family as one continuous document. A top-level
     * directory uses its already collected reading sections; a child page starts
     * at the current map and recursively includes descendants only.
     *
     * @param format Requested portable document format.
     */
    async exportArticleFamily(format) {
        const file = this.file;
        const document = this.document;
        if (!file || !document)
            return;
        await this.save();
        const sections = this.showArticleToc && this.readingSections.length
            ? this.readingSections
            : await this.plugin.buildDescendantReadingSections(file, document);
        if (format === "md") {
            const markdown = sections.map((section) => (0, model_1.documentToMarkdown)(section.document)).join("\n\n---\n\n");
            await this.exportTextFile("md", markdown);
            return;
        }
        const html = (0, import_export_1.readingSectionsToHtml)(sections);
        if (format === "pdf")
            this.printHtmlToPdf(html);
        else
            await this.exportTextFile(format, html);
    }
    /**
     * Opens standalone HTML in a print window so the user can save it as PDF.
     *
     * @param html Complete printable HTML document.
     */
    printHtmlToPdf(html) {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            new obsidian_1.Notice("无法打开打印窗口，请允许弹出窗口后重试");
            return;
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.addEventListener("load", () => {
            window.setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 100);
        }, { once: true });
    }
}
exports.MindMapStudioView = MindMapStudioView;

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/view.ts
},
9: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file editor.ts
 * @description 编辑器领域的核心交互控制器。
 *
 * 负责三种视图、节点操作、富文本、图片、表格、代码、子导图、拖拽、尺寸、搜索、历史记录、只读锁和图床容灾。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MindMapEditor = void 0;
const obsidian_1 = require("obsidian");
const model_1 = __bundleRequire(1);
const layout_1 = __bundleRequire(6);
const collision_layout_1 = __bundleRequire(7);
const content_modals_1 = __bundleRequire(10);
const settings_1 = __bundleRequire(3);
const themes_1 = __bundleRequire(4);
const modes_1 = __bundleRequire(11);
const article_style_1 = __bundleRequire(12);
const rich_text_dom_1 = __bundleRequire(13);
const editor_modals_1 = __bundleRequire(14);
const clipboard_import_1 = __bundleRequire(18);
const node_image_actions_1 = __bundleRequire(19);
const node_rich_text_editor_1 = __bundleRequire(20);
const drag_drop_1 = __bundleRequire(21);
const history_manager_1 = __bundleRequire(22);
const outline_renderer_1 = __bundleRequire(23);
const article_renderer_1 = __bundleRequire(24);
const node_actions_1 = __bundleRequire(17);
const selection_format_toolbar_1 = __bundleRequire(25);
/**
 * 创建节点编辑与“当前脑图外观”共用的文章编号控件，确保两处设置语义和文案一致。
 * 手动层级表示当前节点所在子树的最高文章层级；中心节点本身不编号，一级子节点直接使用所选层级。
 *
 * @param container 承载表单控件的网格容器。
 * @param currentMode 当前保存的编号覆盖模式；undefined 表示自动。
 * @param currentLevel 当前保存的手动最高层级。
 * @param onChange 控件变化后需要执行的可选回调，例如节点编辑自动保存。
 * @returns 可在提交时读取规范化文章编号设置的句柄。
 */
function createArticleNumberingControls(container, currentMode, currentLevel, onChange) {
    const numberingModeLabel = container.createEl("label", { cls: "mmc-article-numbering-control" });
    numberingModeLabel.createSpan({ text: "文章编号方式" });
    const numberingModeSelect = numberingModeLabel.createEl("select");
    numberingModeSelect.createEl("option", { text: "自动（按树层级与标题结构）", attr: { value: "auto" } });
    numberingModeSelect.createEl("option", { text: "关闭（不显示且不占序号）", attr: { value: "none" } });
    numberingModeSelect.createEl("option", { text: "手动层级（自定义最高层级）", attr: { value: "manual" } });
    numberingModeSelect.value = currentMode !== null && currentMode !== void 0 ? currentMode : "auto";
    const numberingLevelLabel = container.createEl("label", { cls: "mmc-article-numbering-control mmc-article-numbering-level" });
    numberingLevelLabel.createSpan({ text: "最高文章层级" });
    const numberingLevelSelect = numberingLevelLabel.createEl("select");
    for (let level = 1; level <= 8; level += 1) {
        numberingLevelSelect.createEl("option", { text: `${level} 级 · ${(0, modes_1.articleNumberLabel)(level, 1)}示例`, attr: { value: String(level) } });
    }
    numberingLevelSelect.value = String(currentLevel !== null && currentLevel !== void 0 ? currentLevel : 1);
    const numberingHelp = container.createDiv({
        cls: "setting-item-description mmc-article-numbering-help",
        text: "手动层级用于定义当前节点所在子树的最高文章层级；编辑中心节点时，一级子节点直接使用所选层级。末端节点是否作为标题仍由同级结构自动判断。"
    });
    const updateNumberingLevelState = () => {
        const manual = numberingModeSelect.value === "manual";
        numberingLevelSelect.disabled = !manual;
        numberingLevelLabel.toggleClass("is-disabled", !manual);
        numberingHelp.toggleClass("is-disabled", !manual);
    };
    numberingModeSelect.addEventListener("change", () => {
        updateNumberingLevelState();
        onChange === null || onChange === void 0 ? void 0 : onChange();
    });
    numberingLevelSelect.addEventListener("change", () => onChange === null || onChange === void 0 ? void 0 : onChange());
    updateNumberingLevelState();
    return {
        read: () => ({
            articleNumberingMode: numberingModeSelect.value === "manual" || numberingModeSelect.value === "none"
                ? numberingModeSelect.value
                : undefined,
            articleNumberingLevel: numberingModeSelect.value === "manual" ? Number(numberingLevelSelect.value) : undefined
        })
    };
}
/**
 * NodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class NodeEditModal extends obsidian_1.Modal {
    /**
     * 创建 NodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
     * @param node 当前处理的节点。
     * @param defaultShape 该参数用于 constructor 流程中的输入或控制。
     * @param callbacks 编辑器向视图层发送事件的一组回调。
     * @param submit 该参数用于 constructor 流程中的输入或控制。
     * @param position 编辑器显示在居中弹窗还是右侧画布面板。
     * @param panelHost 右侧面板需要限制在其中的画布元素。
     */
    constructor(app, node, defaultShape, callbacks, submit, position = "center", panelHost) {
        super(app);
        this.position = position;
        this.panelHost = panelHost;
        this.saveOnClose = null;
        this.closeWithoutFlush = false;
        this.outsidePointerHandler = null;
        this.resizeHandler = null;
        this.externalNodeHandler = null;
        this.node = node;
        this.defaultShape = defaultShape;
        this.callbacks = callbacks;
        this.submit = submit;
    }
    /**
     * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
     */
    onOpen() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        this.modalEl.toggleClass("mms-node-editor-right", this.position === "right");
        if (this.position === "right" && this.panelHost) {
            const positionPanel = () => {
                const rect = this.panelHost.getBoundingClientRect();
                const container = this.modalEl.parentElement;
                if (!container)
                    return;
                container.style.left = `${rect.left}px`;
                container.style.top = `${rect.top}px`;
                container.style.width = `${rect.width}px`;
                container.style.height = `${rect.height}px`;
                container.style.right = "auto";
                container.style.bottom = "auto";
            };
            this.resizeHandler = positionPanel;
            positionPanel();
            window.addEventListener("resize", positionPanel);
        }
        this.titleEl.setText("编辑节点内容");
        this.contentEl.addClass("mmc-node-edit-modal");
        const form = this.contentEl.createDiv({ cls: "mmc-node-edit-form" });
        form.createEl("p", {
            cls: "setting-item-description",
            text: "节点内容由可排序的文字块和图片块组成。可以只保留图片，也可以组合为图片→文字、文字→图片，或文字→图片→文字。"
        });
        let workingBlocks = JSON.parse(JSON.stringify((0, model_1.nodeContentBlocks)(this.node)));
        if (!workingBlocks.length)
            workingBlocks = [{ id: (0, model_1.newId)(), type: "text", text: "新节点" }];
        let scheduleAutoSave = () => undefined;
        const actionRow = form.createDiv({ cls: "mmc-content-block-actions" });
        const blocksEl = form.createDiv({ cls: "mmc-content-block-list" });
        const cloneBlocks = () => JSON.parse(JSON.stringify(workingBlocks));
        const validBlocks = () => cloneBlocks().filter((block) => block.type === "image" ? Boolean(block.source.trim()) : Boolean(block.text.trim()));
        const renderBlocks = () => {
            blocksEl.empty();
            workingBlocks.forEach((block, index) => {
                var _a;
                const card = blocksEl.createDiv({ cls: `mmc-content-block is-${block.type}` });
                const header = card.createDiv({ cls: "mmc-content-block-header" });
                header.createSpan({ cls: "mmc-content-block-title", text: block.type === "text" ? `文字块 ${index + 1}` : `图片块 ${index + 1}` });
                const controls = header.createDiv({ cls: "mmc-content-block-controls" });
                const control = (icon, title, action, disabled = false) => {
                    const btn = controls.createEl("button", { cls: "clickable-icon", attr: { type: "button", title, "aria-label": title } });
                    (0, obsidian_1.setIcon)(btn, icon);
                    btn.disabled = disabled;
                    btn.addEventListener("click", (event) => { event.preventDefault(); action(); });
                };
                control("arrow-up", "上移", () => { [workingBlocks[index - 1], workingBlocks[index]] = [workingBlocks[index], workingBlocks[index - 1]]; renderBlocks(); scheduleAutoSave(); }, index === 0);
                control("arrow-down", "下移", () => { [workingBlocks[index + 1], workingBlocks[index]] = [workingBlocks[index], workingBlocks[index + 1]]; renderBlocks(); scheduleAutoSave(); }, index === workingBlocks.length - 1);
                control("trash-2", "删除内容块", () => { workingBlocks.splice(index, 1); renderBlocks(); scheduleAutoSave(); });
                if (block.type === "text") {
                    (0, node_rich_text_editor_1.renderNodeRichTextEditor)(card.createDiv({ cls: "mmc-content-block-body" }), block, scheduleAutoSave);
                }
                else {
                    const body = card.createDiv({ cls: "mmc-content-block-body mmc-image-block-editor" });
                    const preview = body.createDiv({ cls: "mmc-image-block-preview" });
                    const refresh = () => {
                        var _a;
                        preview.empty();
                        const resolved = this.callbacks.resolveImage(block.source);
                        if (resolved) {
                            const img = preview.createEl("img", { attr: { src: resolved, alt: block.alt || "图片" } });
                            img.addEventListener("click", () => new editor_modals_1.ImagePreviewModal(this.app, resolved, block.alt || "图片", (0, model_1.imageSourceCandidates)(block, true), (source) => this.callbacks.resolveImage(source)).open());
                        }
                        else
                            preview.createDiv({ cls: "mmc-image-placeholder", text: block.source ? "无法加载图片" : "尚未选择图片" });
                        source.value = block.source;
                        alt.value = (_a = block.alt) !== null && _a !== void 0 ? _a : "";
                    };
                    const sourceLabel = body.createEl("label", { text: "图片路径或网址" });
                    const source = sourceLabel.createEl("input", { type: "text", attr: { placeholder: "仓库路径、[[图片]] 或 https://..." } });
                    const altLabel = body.createEl("label", { text: "图片说明（可选）" });
                    const alt = altLabel.createEl("input", { type: "text", attr: { placeholder: "图片说明" } });
                    source.addEventListener("input", () => {
                        const next = source.value.trim();
                        if (next !== block.source) {
                            block.source = next;
                            block.localSource = undefined;
                            block.remoteSources = undefined;
                        }
                        refresh();
                        scheduleAutoSave();
                    });
                    alt.addEventListener("input", () => { block.alt = alt.value.trim() || undefined; scheduleAutoSave(); });
                    const actions = body.createDiv({ cls: "mmc-image-block-actions" });
                    const local = actions.createEl("button", { text: "保存到仓库", attr: { type: "button" } });
                    const applyImageAction = (action) => {
                        void action.then((changed) => {
                            if (!changed)
                                return;
                            refresh();
                            scheduleAutoSave();
                        });
                    };
                    local.addEventListener("click", () => {
                        applyImageAction((0, node_image_actions_1.selectNodeImage)(this.app, block, "local", this.callbacks));
                    });
                    const remote = actions.createEl("button", { text: "选择文件并上传", attr: { type: "button" } });
                    remote.addEventListener("click", () => {
                        applyImageAction((0, node_image_actions_1.selectNodeImage)(this.app, block, "remote", this.callbacks));
                    });
                    if (block.localSource || (block.source && !/^https?:\/\//i.test(block.source))) {
                        const uploadCurrent = actions.createEl("button", { text: "上传当前图片", attr: { type: "button" } });
                        uploadCurrent.addEventListener("click", () => {
                            applyImageAction((0, node_image_actions_1.uploadCurrentNodeImage)(this.app, block, this.callbacks));
                        });
                    }
                    if ((_a = block.remoteSources) === null || _a === void 0 ? void 0 : _a.length) {
                        const mirrors = body.createDiv({ cls: "mms-image-mirrors" });
                        mirrors.createSpan({ cls: "mms-image-mirrors-label", text: "远程镜像：" });
                        block.remoteSources.forEach((item, mirrorIndex) => {
                            const link = mirrors.createEl("a", {
                                text: item.hostName || `图床 ${mirrorIndex + 1}`,
                                href: item.url,
                                attr: { target: "_blank", rel: "noopener" }
                            });
                            link.addEventListener("click", (event) => event.stopPropagation());
                        });
                    }
                    refresh();
                }
            });
            if (!workingBlocks.length)
                blocksEl.createDiv({ cls: "mmc-empty-content-hint", text: "当前没有内容块。请添加文字或图片。" });
        };
        const addText = actionRow.createEl("button", { text: "+ 文字", attr: { type: "button" } });
        addText.addEventListener("click", () => { workingBlocks.push({ id: (0, model_1.newId)(), type: "text", text: "" }); renderBlocks(); scheduleAutoSave(); });
        const addImage = actionRow.createEl("button", { text: "+ 图片", attr: { type: "button" } });
        addImage.addEventListener("click", () => { workingBlocks.push({ id: (0, model_1.newId)(), type: "image", source: "" }); renderBlocks(); scheduleAutoSave(); });
        renderBlocks();
        if (this.position === "right" && this.panelHost) {
            this.externalNodeHandler = (event) => {
                const detail = event.detail;
                if ((detail === null || detail === void 0 ? void 0 : detail.nodeId) !== this.node.id)
                    return;
                workingBlocks = JSON.parse(JSON.stringify((0, model_1.nodeContentBlocks)(this.node)));
                renderBlocks();
            };
            this.panelHost.addEventListener("mms-inline-node-change", this.externalNodeHandler);
        }
        const detailsGrid = form.createDiv({ cls: "mmc-form-grid" });
        const iconLabel = detailsGrid.createEl("label", { text: "图标或 Emoji" });
        const iconInput = iconLabel.createEl("input", { type: "text", attr: { placeholder: "例如 💡" } });
        iconInput.value = (_a = this.node.icon) !== null && _a !== void 0 ? _a : "";
        const taskLabel = detailsGrid.createEl("label", { text: "任务状态" });
        const taskSelect = taskLabel.createEl("select");
        for (const [value, label] of [["", "无"], ["todo", "待办"], ["doing", "进行中"], ["done", "已完成"]])
            taskSelect.createEl("option", { text: label, attr: { value } });
        taskSelect.value = (_b = this.node.task) !== null && _b !== void 0 ? _b : "";
        const shapeLabel = detailsGrid.createEl("label", { text: "节点形状" });
        const shapeSelect = shapeLabel.createEl("select");
        for (const [value, label] of [["rounded", "圆角"], ["pill", "胶囊"], ["rectangle", "直角"]])
            shapeSelect.createEl("option", { text: label, attr: { value } });
        shapeSelect.value = (_d = (_c = this.node.style) === null || _c === void 0 ? void 0 : _c.shape) !== null && _d !== void 0 ? _d : this.defaultShape;
        const tagsLabel = detailsGrid.createEl("label", { text: "标签（逗号分隔）" });
        const tagsInput = tagsLabel.createEl("input", { type: "text" });
        tagsInput.value = (_f = (_e = this.node.tags) === null || _e === void 0 ? void 0 : _e.join(", ")) !== null && _f !== void 0 ? _f : "";
        const numberingControls = createArticleNumberingControls(detailsGrid, (_g = this.node.articleNumberingMode) !== null && _g !== void 0 ? _g : (this.node.skipArticleNumbering === true ? "none" : undefined), this.node.articleNumberingLevel, () => scheduleAutoSave());
        const styleGrid = form.createDiv({ cls: "mmc-form-grid mmc-style-grid" });
        const colorControl = (labelText, current, fallback) => {
            const label = styleGrid.createEl("label", { text: labelText });
            const row = label.createDiv({ cls: "mmc-color-row" });
            const toggle = row.createEl("input", { type: "checkbox" });
            const color = row.createEl("input", { type: "color" });
            toggle.checked = Boolean(current);
            color.value = current !== null && current !== void 0 ? current : fallback;
            color.disabled = !toggle.checked;
            toggle.addEventListener("change", () => { color.disabled = !toggle.checked; scheduleAutoSave(); });
            color.addEventListener("change", scheduleAutoSave);
            return [toggle, color];
        };
        const [colorToggle, colorInput] = colorControl("节点颜色", (_h = this.node.style) === null || _h === void 0 ? void 0 : _h.color, "#4f46e5");
        const [textColorToggle, textColorInput] = colorControl("整节点文字颜色", (_j = this.node.style) === null || _j === void 0 ? void 0 : _j.textColor, "#ffffff");
        const [borderColorToggle, borderColorInput] = colorControl("边框颜色", (_k = this.node.style) === null || _k === void 0 ? void 0 : _k.borderColor, "#94a3b8");
        const numberControl = (labelText, current, min, max, step) => {
            var _a;
            const label = styleGrid.createEl("label", { text: labelText });
            const input = label.createEl("input", { type: "number", attr: { min: String(min), max: String(max), step: String(step), placeholder: "跟随默认" } });
            input.value = (_a = current === null || current === void 0 ? void 0 : current.toString()) !== null && _a !== void 0 ? _a : "";
            return input;
        };
        const borderWidthInput = numberControl("边框粗细", (_l = this.node.style) === null || _l === void 0 ? void 0 : _l.borderWidth, 0, 6, .5);
        const fontSizeInput = numberControl("字号", (_m = this.node.style) === null || _m === void 0 ? void 0 : _m.fontSize, 10, 32, 1);
        const widthInput = numberControl("节点宽度（100–900）", (_o = this.node.style) === null || _o === void 0 ? void 0 : _o.width, 100, 900, 10);
        widthInput.placeholder = "自动宽度";
        const minHeightInput = numberControl("节点最小高度（36–600）", (_p = this.node.style) === null || _p === void 0 ? void 0 : _p.minHeight, 36, 600, 10);
        minHeightInput.placeholder = "自动高度";
        const alignLabel = styleGrid.createEl("label", { text: "文字对齐" });
        const alignSelect = alignLabel.createEl("select");
        alignSelect.createEl("option", { text: "跟随全局", attr: { value: "inherit" } });
        alignSelect.createEl("option", { text: "左对齐", attr: { value: "left" } });
        alignSelect.createEl("option", { text: "居中", attr: { value: "center" } });
        alignSelect.createEl("option", { text: "右对齐", attr: { value: "right" } });
        alignSelect.value = (_r = (_q = this.node.style) === null || _q === void 0 ? void 0 : _q.textAlign) !== null && _r !== void 0 ? _r : "inherit";
        const booleanControl = (labelText, current) => {
            const label = styleGrid.createEl("label", { text: labelText });
            const select = label.createEl("select");
            select.createEl("option", { text: "跟随默认", attr: { value: "inherit" } });
            select.createEl("option", { text: "开启", attr: { value: "true" } });
            select.createEl("option", { text: "关闭", attr: { value: "false" } });
            select.value = current === undefined ? "inherit" : current ? "true" : "false";
            return select;
        };
        const boldInput = booleanControl("整节点加粗", (_s = this.node.style) === null || _s === void 0 ? void 0 : _s.bold);
        const italicInput = booleanControl("整节点斜体", (_t = this.node.style) === null || _t === void 0 ? void 0 : _t.italic);
        const underlineInput = booleanControl("整节点下划线", (_u = this.node.style) === null || _u === void 0 ? void 0 : _u.underline);
        const noteLabel = form.createEl("label", { text: "备注（可选）" });
        const noteInput = noteLabel.createEl("textarea");
        noteInput.value = (_v = this.node.note) !== null && _v !== void 0 ? _v : "";
        noteInput.rows = 4;
        const linkLabel = form.createEl("label", { text: "链接（网址、笔记名或 [[双链]]）" });
        const linkInput = linkLabel.createEl("input", { type: "text" });
        linkInput.value = (_w = this.node.link) !== null && _w !== void 0 ? _w : "";
        const parseBool = (value) => value === "true" ? true : value === "false" ? false : undefined;
        const parseNumber = (value, min, max) => value.trim() && Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : undefined;
        const collectValues = (showNotice) => {
            const content = validBlocks();
            if (!content.length) {
                if (showNotice)
                    new obsidian_1.Notice("节点至少需要一个文字块或图片块");
                return null;
            }
            const task = taskSelect.value;
            const shape = shapeSelect.value;
            const numbering = numberingControls.read();
            return {
                content,
                note: noteInput.value.trim(), link: linkInput.value.trim(), icon: iconInput.value.trim().slice(0, 12),
                tags: Array.from(new Set(tagsInput.value.split(/[,，]/).map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean))).slice(0, 12),
                task: task === "todo" || task === "doing" || task === "done" ? task : undefined,
                articleNumberingMode: numbering.articleNumberingMode,
                articleNumberingLevel: numbering.articleNumberingLevel,
                color: colorToggle.checked ? colorInput.value : undefined,
                textColor: textColorToggle.checked ? textColorInput.value : undefined,
                borderColor: borderColorToggle.checked ? borderColorInput.value : undefined,
                borderWidth: parseNumber(borderWidthInput.value, 0, 6),
                shape: shape === "pill" || shape === "rectangle" || shape === "rounded" ? shape : undefined,
                bold: parseBool(boldInput.value), italic: parseBool(italicInput.value), underline: parseBool(underlineInput.value),
                fontSize: parseNumber(fontSizeInput.value, 10, 32),
                textAlign: alignSelect.value === "left" || alignSelect.value === "right" || alignSelect.value === "center" ? alignSelect.value : undefined,
                width: parseNumber(widthInput.value, 100, 900),
                minHeight: parseNumber(minHeightInput.value, 36, 600)
            };
        };
        let timer = null;
        let last = JSON.stringify(collectValues(false));
        const saveNow = (mode, showNotice = false) => {
            if (timer !== null) {
                window.clearTimeout(timer);
                timer = null;
            }
            const values = collectValues(showNotice);
            if (!values)
                return false;
            const signature = JSON.stringify(values);
            if (signature !== last) {
                this.submit(values, mode);
                last = signature;
            }
            return true;
        };
        scheduleAutoSave = () => { if (timer !== null)
            window.clearTimeout(timer); timer = window.setTimeout(() => saveNow("autosave"), 280); };
        this.saveOnClose = () => { saveNow("commit"); };
        [iconInput, taskSelect, shapeSelect, tagsInput, borderWidthInput, fontSizeInput, widthInput, minHeightInput, alignSelect, boldInput, italicInput, underlineInput, noteInput, linkInput]
            .forEach((input) => { input.addEventListener("input", scheduleAutoSave); input.addEventListener("change", scheduleAutoSave); });
        const buttons = form.createDiv({ cls: "mmc-form-actions" });
        const closeButton = buttons.createEl("button", { cls: "mod-cta", text: "保存并关闭", attr: { type: "button" } });
        closeButton.addEventListener("click", () => { if (saveNow("commit", true)) {
            this.closeWithoutFlush = true;
            this.close();
        } });
        this.outsidePointerHandler = (event) => {
            var _a;
            const targetNode = event.target;
            const targetElement = targetNode instanceof Element ? targetNode : targetNode === null || targetNode === void 0 ? void 0 : targetNode.parentElement;
            if (targetNode && this.modalEl.contains(targetNode))
                return;
            // 图床选择、图片预览等子弹窗拥有独立的 modal-container。
            // 它们打开期间的点击（包括遮罩和关闭按钮）不应关闭节点编辑面板。
            const ownModalContainer = this.modalEl.closest(".modal-container");
            const targetModal = targetElement === null || targetElement === void 0 ? void 0 : targetElement.closest(".modal");
            const targetModalContainer = targetElement === null || targetElement === void 0 ? void 0 : targetElement.closest(".modal-container");
            if (targetModal && targetModal !== this.modalEl)
                return;
            if (targetModalContainer && ownModalContainer && targetModalContainer !== ownModalContainer)
                return;
            if (this.position === "right" && (targetElement === null || targetElement === void 0 ? void 0 : targetElement.closest(".mmc-node")))
                return;
            (_a = this.saveOnClose) === null || _a === void 0 ? void 0 : _a.call(this);
            this.closeWithoutFlush = true;
            this.close();
        };
        window.setTimeout(() => document.addEventListener("pointerdown", this.outsidePointerHandler, true), 0);
    }
    /**
     * 在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。
     */
    onClose() {
        var _a;
        if (!this.closeWithoutFlush)
            (_a = this.saveOnClose) === null || _a === void 0 ? void 0 : _a.call(this);
        if (this.outsidePointerHandler)
            document.removeEventListener("pointerdown", this.outsidePointerHandler, true);
        if (this.resizeHandler)
            window.removeEventListener("resize", this.resizeHandler);
        if (this.externalNodeHandler && this.panelHost) {
            this.panelHost.removeEventListener("mms-inline-node-change", this.externalNodeHandler);
        }
        this.contentEl.empty();
    }
    /**
     * 右侧面板与画布快速输入并存时，释放 Modal 的全局按键作用域。
     */
    releaseKeyboardScope() {
        this.app.keymap.popScope(this.scope);
    }
}
/**
 * AppearanceModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class AppearanceModal extends obsidian_1.Modal {
    /**
     * 创建 AppearanceModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
     * @param appearance 导图外观配置。
     * @param numbering 当前中心节点保存的文章编号覆盖设置。
     * @param submit 该参数用于 constructor 流程中的输入或控制。
     * @param reset 该参数用于 constructor 流程中的输入或控制。
     */
    constructor(app, appearance, numbering, submit, reset) {
        super(app);
        this.appearance = appearance;
        this.numbering = numbering;
        this.submit = submit;
        this.reset = reset;
    }
    /**
     * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
     */
    onOpen() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        this.titleEl.setText("当前脑图外观");
        this.contentEl.addClass("mmc-appearance-modal");
        const form = this.contentEl.createEl("form");
        form.createEl("p", { cls: "setting-item-description", text: "先选择一套主题，再按需要修改背景、节点、字体、连线和文章编号。设置只保存到当前 .mindmap 文件。" });
        const numberingSection = form.createDiv({ cls: "mmc-appearance-article-numbering" });
        numberingSection.createDiv({ cls: "mmc-theme-picker-title", text: "文章编号" });
        const numberingGrid = numberingSection.createDiv({ cls: "mmc-form-grid mmc-appearance-grid" });
        const numberingControls = createArticleNumberingControls(numberingGrid, this.numbering.articleNumberingMode, this.numbering.articleNumberingLevel);
        let selectedPreset = (_a = this.appearance.themePreset) !== null && _a !== void 0 ? _a : "classic-indigo";
        const themeSection = form.createDiv({ cls: "mmc-theme-picker" });
        themeSection.createDiv({ cls: "mmc-theme-picker-title", text: "主题模板" });
        const themeGrid = themeSection.createDiv({ cls: "mmc-theme-card-grid" });
        const themeCards = new Map();
        const grid = form.createDiv({ cls: "mmc-form-grid mmc-appearance-grid" });
        const addColor = (labelText, value, fallback) => {
            const label = grid.createEl("label", { text: labelText });
            const row = label.createDiv({ cls: "mmc-color-row" });
            const toggle = row.createEl("input", { type: "checkbox" });
            const input = row.createEl("input", { type: "color" });
            toggle.checked = Boolean(value);
            input.value = value !== null && value !== void 0 ? value : fallback;
            input.disabled = !toggle.checked;
            toggle.addEventListener("change", () => { input.disabled = !toggle.checked; });
            return { toggle, input };
        };
        const background = addColor("背景颜色", this.appearance.backgroundColor, "#f8fafc");
        const patternLabel = grid.createEl("label", { text: "背景图案" });
        const patternSelect = patternLabel.createEl("select");
        for (const [value, label] of [["none", "无"], ["grid", "网格"], ["dots", "点阵"]])
            patternSelect.createEl("option", { text: label, attr: { value } });
        patternSelect.value = (_b = this.appearance.backgroundPattern) !== null && _b !== void 0 ? _b : "grid";
        const patternColor = addColor("图案颜色", this.appearance.patternColor, "#94a3b8");
        const fontLabel = grid.createEl("label", { text: "字体" });
        const fontSelect = fontLabel.createEl("select");
        for (const [value, label] of [["obsidian", "跟随 Obsidian"], ["sans", "无衬线"], ["serif", "衬线"], ["mono", "等宽"], ["custom", "自定义"]])
            fontSelect.createEl("option", { text: label, attr: { value } });
        fontSelect.value = (_c = this.appearance.fontFamily) !== null && _c !== void 0 ? _c : "obsidian";
        const customFontLabel = grid.createEl("label", { text: "自定义字体名称" });
        const customFontInput = customFontLabel.createEl("input", { type: "text", attr: { placeholder: "Microsoft YaHei" } });
        customFontInput.value = (_d = this.appearance.customFont) !== null && _d !== void 0 ? _d : "";
        const updateCustomFont = () => { customFontInput.disabled = fontSelect.value !== "custom"; };
        fontSelect.addEventListener("change", updateCustomFont);
        updateCustomFont();
        const fontSizeLabel = grid.createEl("label", { text: "字号（10–30）" });
        const fontSizeInput = fontSizeLabel.createEl("input", { type: "number", attr: { min: "10", max: "30", step: "1" } });
        fontSizeInput.value = String((_e = this.appearance.fontSize) !== null && _e !== void 0 ? _e : 14);
        const nodeVisualStyleLabel = grid.createEl("label", { text: "节点视觉样式" });
        const nodeVisualStyleSelect = nodeVisualStyleLabel.createEl("select");
        nodeVisualStyleSelect.createEl("option", { text: "卡片节点", attr: { value: "card" } });
        nodeVisualStyleSelect.createEl("option", { text: "圆角分支", attr: { value: "branch" } });
        nodeVisualStyleSelect.value = (_f = this.appearance.nodeVisualStyle) !== null && _f !== void 0 ? _f : "card";
        const nodeTextAlignLabel = grid.createEl("label", { text: "节点文字对齐" });
        const nodeTextAlignSelect = nodeTextAlignLabel.createEl("select");
        nodeTextAlignSelect.createEl("option", { text: "左对齐", attr: { value: "left" } });
        nodeTextAlignSelect.createEl("option", { text: "居中", attr: { value: "center" } });
        nodeTextAlignSelect.createEl("option", { text: "右对齐", attr: { value: "right" } });
        nodeTextAlignSelect.value = (_g = this.appearance.nodeTextAlign) !== null && _g !== void 0 ? _g : "center";
        const rootColor = addColor("中心主题颜色", this.appearance.rootColor, "#4f46e5");
        const rootTextColor = addColor("中心主题文字", this.appearance.rootTextColor, "#ffffff");
        const nodeColor = addColor("节点背景色", this.appearance.nodeColor, "#ffffff");
        const textColor = addColor("文字颜色", this.appearance.textColor, "#0f172a");
        const borderColor = addColor("节点边框颜色", this.appearance.nodeBorderColor, "#94a3b8");
        const borderWidthLabel = grid.createEl("label", { text: "边框粗细（0–6）" });
        const borderWidthInput = borderWidthLabel.createEl("input", { type: "number", attr: { min: "0", max: "6", step: "0.5" } });
        borderWidthInput.value = String((_h = this.appearance.nodeBorderWidth) !== null && _h !== void 0 ? _h : 1);
        const edgeColor = addColor("连线颜色", this.appearance.edgeColor, "#7c8aa5");
        const edgeStyleLabel = grid.createEl("label", { text: "连线类型" });
        const edgeStyleSelect = edgeStyleLabel.createEl("select");
        for (const [value, label] of [["curved", "曲线"], ["straight", "直线"], ["elbow", "折线"]])
            edgeStyleSelect.createEl("option", { text: label, attr: { value } });
        edgeStyleSelect.value = (_j = this.appearance.edgeStyle) !== null && _j !== void 0 ? _j : "curved";
        const edgeWidthModeLabel = grid.createEl("label", { text: "连线粗细模式" });
        const edgeWidthModeSelect = edgeWidthModeLabel.createEl("select");
        edgeWidthModeSelect.createEl("option", { text: "统一粗细", attr: { value: "uniform" } });
        edgeWidthModeSelect.createEl("option", { text: "从粗到细", attr: { value: "tapered" } });
        edgeWidthModeSelect.value = (_k = this.appearance.edgeWidthMode) !== null && _k !== void 0 ? _k : "tapered";
        const edgeWidthLabel = grid.createEl("label", { text: "起始粗细（0.5–8）" });
        const edgeWidthInput = edgeWidthLabel.createEl("input", { type: "number", attr: { min: "0.5", max: "8", step: "0.25" } });
        edgeWidthInput.value = String((_l = this.appearance.edgeWidth) !== null && _l !== void 0 ? _l : 4.2);
        const edgeMinWidthLabel = grid.createEl("label", { text: "末端最细（0.25–4）" });
        const edgeMinWidthInput = edgeMinWidthLabel.createEl("input", { type: "number", attr: { min: "0.25", max: "4", step: "0.25" } });
        edgeMinWidthInput.value = String((_m = this.appearance.edgeMinWidth) !== null && _m !== void 0 ? _m : 1.2);
        const updateEdgeMin = () => {
            const tapered = edgeWidthModeSelect.value === "tapered";
            edgeMinWidthInput.disabled = !tapered;
            edgeMinWidthLabel.toggleClass("is-disabled", !tapered);
            edgeWidthLabel.childNodes[0].textContent = tapered ? "起始粗细（0.5–8）" : "连线粗细（0.5–8）";
        };
        edgeWidthModeSelect.addEventListener("change", updateEdgeMin);
        updateEdgeMin();
        const branchLabel = grid.createEl("label", { text: "彩色分支" });
        const branchToggleRow = branchLabel.createDiv({ cls: "mmc-toggle-row" });
        const colorfulBranches = branchToggleRow.createEl("input", { type: "checkbox" });
        colorfulBranches.checked = this.appearance.colorfulBranches === true;
        branchToggleRow.createSpan({ text: "按一级分支循环配色" });
        const branchColorsLabel = grid.createEl("label", { text: "分支颜色（逗号分隔）" });
        const branchColorsInput = branchColorsLabel.createEl("textarea", { attr: { rows: "2", placeholder: "#4f46e5, #0284c7, #0f766e" } });
        branchColorsInput.value = ((_o = this.appearance.branchColors) !== null && _o !== void 0 ? _o : []).join(", ");
        const textStyleSection = form.createDiv({ cls: "mmc-appearance-text-style" });
        textStyleSection.createDiv({ cls: "mmc-appearance-text-style-title", text: "文字样式" });
        const textStyle = textStyleSection.createDiv({ cls: "mmc-appearance-style-options" });
        const addCheck = (text, checked) => {
            const label = textStyle.createEl("label", { cls: "mmc-appearance-style-option" });
            const input = label.createEl("input", { type: "checkbox" });
            input.checked = checked;
            label.createSpan({ text });
            return input;
        };
        const bold = addCheck("文字加粗", this.appearance.bold === true);
        const italic = addCheck("文字斜体", this.appearance.italic === true);
        const underline = addCheck("文字下划线", this.appearance.underline === true);
        const setColor = (control, value, fallback) => {
            control.toggle.checked = Boolean(value);
            control.input.value = value !== null && value !== void 0 ? value : fallback;
            control.input.disabled = !control.toggle.checked;
        };
        const updateSelectedCards = () => {
            for (const [id, card] of themeCards)
                card.toggleClass("is-selected", id === selectedPreset);
        };
        const applyPreset = (presetId) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            selectedPreset = presetId;
            const appearance = (0, themes_1.appearanceFromThemePreset)(presetId);
            setColor(background, appearance.backgroundColor, "#f8fafc");
            patternSelect.value = (_a = appearance.backgroundPattern) !== null && _a !== void 0 ? _a : "none";
            setColor(patternColor, appearance.patternColor, "#94a3b8");
            fontSelect.value = (_b = appearance.fontFamily) !== null && _b !== void 0 ? _b : "obsidian";
            customFontInput.value = (_c = appearance.customFont) !== null && _c !== void 0 ? _c : "";
            fontSizeInput.value = String((_d = appearance.fontSize) !== null && _d !== void 0 ? _d : 14);
            nodeTextAlignSelect.value = (_e = appearance.nodeTextAlign) !== null && _e !== void 0 ? _e : "center";
            setColor(rootColor, appearance.rootColor, "#4f46e5");
            setColor(rootTextColor, appearance.rootTextColor, "#ffffff");
            setColor(nodeColor, appearance.nodeColor, "#ffffff");
            setColor(textColor, appearance.textColor, "#0f172a");
            setColor(borderColor, appearance.nodeBorderColor, "#94a3b8");
            borderWidthInput.value = String((_f = appearance.nodeBorderWidth) !== null && _f !== void 0 ? _f : 1);
            setColor(edgeColor, appearance.edgeColor, "#7c8aa5");
            edgeStyleSelect.value = (_g = appearance.edgeStyle) !== null && _g !== void 0 ? _g : "curved";
            edgeWidthModeSelect.value = (_h = appearance.edgeWidthMode) !== null && _h !== void 0 ? _h : "uniform";
            edgeWidthInput.value = String((_j = appearance.edgeWidth) !== null && _j !== void 0 ? _j : 2.2);
            edgeMinWidthInput.value = String((_k = appearance.edgeMinWidth) !== null && _k !== void 0 ? _k : 1);
            colorfulBranches.checked = appearance.colorfulBranches === true;
            branchColorsInput.value = ((_l = appearance.branchColors) !== null && _l !== void 0 ? _l : []).join(", ");
            bold.checked = appearance.bold === true;
            italic.checked = appearance.italic === true;
            underline.checked = appearance.underline === true;
            updateCustomFont();
            updateEdgeMin();
            updateSelectedCards();
        };
        for (const preset of themes_1.MINDMAP_THEME_PRESETS) {
            const card = themeGrid.createEl("button", { cls: "mmc-theme-card", attr: { type: "button", title: preset.description } });
            themeCards.set(preset.id, card);
            const preview = card.createDiv({ cls: "mmc-theme-card-preview" });
            preview.style.backgroundColor = (_p = preset.appearance.backgroundColor) !== null && _p !== void 0 ? _p : "#ffffff";
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 112 44");
            svg.setAttribute("aria-hidden", "true");
            const colors = (_q = preset.appearance.branchColors) !== null && _q !== void 0 ? _q : [(_r = preset.appearance.edgeColor) !== null && _r !== void 0 ? _r : "#7c8aa5"];
            const rootColorValue = (_s = preset.appearance.rootColor) !== null && _s !== void 0 ? _s : "#4f46e5";
            const rootNode = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rootNode.setAttribute("x", "8");
            rootNode.setAttribute("y", "15");
            rootNode.setAttribute("width", "32");
            rootNode.setAttribute("height", "14");
            rootNode.setAttribute("rx", "5");
            rootNode.setAttribute("fill", rootColorValue);
            svg.appendChild(rootNode);
            [8, 19, 30].forEach((y, index) => {
                var _a;
                const color = (_a = colors[index % colors.length]) !== null && _a !== void 0 ? _a : rootColorValue;
                const edge = document.createElementNS("http://www.w3.org/2000/svg", "path");
                edge.setAttribute("d", `M 40 22 C 51 22, 50 ${y + 3}, 61 ${y + 3} L 70 ${y + 3}`);
                edge.setAttribute("fill", "none");
                edge.setAttribute("stroke", color);
                edge.setAttribute("stroke-width", index === 0 ? "2.6" : "2");
                edge.setAttribute("stroke-linecap", "round");
                svg.appendChild(edge);
                const childNode = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                childNode.setAttribute("x", "70");
                childNode.setAttribute("y", String(y));
                childNode.setAttribute("width", String(31 - index * 3));
                childNode.setAttribute("height", "7");
                childNode.setAttribute("rx", "3");
                childNode.setAttribute("fill", color);
                childNode.setAttribute("fill-opacity", ".22");
                childNode.setAttribute("stroke", color);
                childNode.setAttribute("stroke-width", ".8");
                svg.appendChild(childNode);
            });
            preview.appendChild(svg);
            card.createDiv({ cls: "mmc-theme-card-name", text: preset.name });
            card.addEventListener("click", () => applyPreset(preset.id));
        }
        updateSelectedCards();
        const clamp = (value, min, max, fallback) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
        };
        const parseBranchColors = () => branchColorsInput.value
            .split(/[,，\s]+/)
            .map((value) => value.trim())
            .filter((value) => /^#[0-9a-f]{6}$/i.test(value))
            .slice(0, 12);
        const actions = form.createDiv({ cls: "mmc-modal-actions" });
        const reset = actions.createEl("button", { text: "恢复全局默认", type: "button" });
        const cancel = actions.createEl("button", { text: "取消", type: "button" });
        const save = actions.createEl("button", { text: "应用", type: "submit", cls: "mod-cta" });
        reset.addEventListener("click", () => { this.reset(); this.close(); });
        cancel.addEventListener("click", () => this.close());
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const maxWidth = clamp(edgeWidthInput.value, 0.5, 8, 4.2);
            this.submit({
                themePreset: selectedPreset,
                backgroundColor: background.toggle.checked ? background.input.value : undefined,
                backgroundPattern: patternSelect.value,
                patternColor: patternColor.toggle.checked ? patternColor.input.value : undefined,
                fontFamily: fontSelect.value,
                customFont: fontSelect.value === "custom" ? customFontInput.value.trim().slice(0, 120) || undefined : undefined,
                fontSize: clamp(fontSizeInput.value, 10, 30, 14),
                nodeVisualStyle: nodeVisualStyleSelect.value,
                nodeTextAlign: nodeTextAlignSelect.value,
                rootColor: rootColor.toggle.checked ? rootColor.input.value : undefined,
                rootTextColor: rootTextColor.toggle.checked ? rootTextColor.input.value : undefined,
                nodeColor: nodeColor.toggle.checked ? nodeColor.input.value : undefined,
                textColor: textColor.toggle.checked ? textColor.input.value : undefined,
                nodeBorderColor: borderColor.toggle.checked ? borderColor.input.value : undefined,
                nodeBorderWidth: clamp(borderWidthInput.value, 0, 6, 1),
                edgeColor: edgeColor.toggle.checked ? edgeColor.input.value : undefined,
                edgeWidth: maxWidth,
                edgeStyle: edgeStyleSelect.value,
                edgeWidthMode: edgeWidthModeSelect.value,
                edgeMinWidth: Math.min(maxWidth, clamp(edgeMinWidthInput.value, 0.25, 4, 1.2)),
                colorfulBranches: colorfulBranches.checked,
                branchColors: parseBranchColors(),
                bold: bold.checked,
                italic: italic.checked,
                underline: underline.checked
            }, numberingControls.read());
            this.close();
        });
        window.setTimeout(() => save.focus(), 20);
    }
}
/**
 * MindMapEditor 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class MindMapEditor {
    /**
     * 创建 MindMapEditor 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
     * @param host 当前图床配置或图床选择项。
     * @param document 要处理的思维导图文档。
     * @param callbacks 编辑器向视图层发送事件的一组回调。
     * @param options 控制当前操作行为的可选配置。
     */
    constructor(app, host, document, callbacks, options) {
        var _a, _b, _c;
        this.modeButtons = new Map();
        this.editControls = [];
        this.selectedIds = new Set();
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.mindMapViewportInitialized = false;
        this.draggingId = null;
        this.dragDropPosition = null;
        this.dropPreviewEl = null;
        this.panning = false;
        this.panStart = { x: 0, y: 0, panX: 0, panY: 0 };
        this.touchPointers = new Map();
        this.touchGesture = null;
        this.cleanupCallbacks = [];
        this.resizeObserver = null;
        this.measuredLayoutFrame = null;
        this.branchClipboard = null;
        this.searchQuery = "";
        this.lastRichTextColor = "#ef4444";
        this.resizeModifier = "none";
        this.imageLoadTimers = new Set();
        this.inlineEditingId = null;
        this.articleNavigationIndex = null;
        this.readingProgressTimer = null;
        this.articleScrollButtonCleanup = null;
        this.app = app;
        this.host = host;
        this.callbacks = callbacks;
        this.options = options;
        this.resizeModifier = options.resizeModifier;
        if (this.resizeModifier === "ctrl")
            this.rootEl.addClass("mmc-ctrl-resize");
        this.history = new history_manager_1.DocumentHistory(() => this.options.historyLimit);
        this.document = (0, model_1.cloneDocument)(document);
        this.currentMode = this.resolveMode(options.defaultViewMode);
        this.readOnly = this.currentMode === "article" || this.currentMode === "reading" || ((_a = this.document.view) === null || _a === void 0 ? void 0 : _a.readOnly) === true;
        this.selectedId = this.document.root.id;
        const initialAppearance = this.getAppearance();
        this.layout = (0, layout_1.computeLayout)(this.document.root, this.document.layout, (_b = initialAppearance.fontSize) !== null && _b !== void 0 ? _b : 14, (_c = initialAppearance.nodeVisualStyle) !== null && _c !== void 0 ? _c : "card", initialAppearance);
        this.buildUi();
        this.render();
        this.initializeMindMapViewport(50);
    }
    /**
     * 执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    destroy() {
        var _a, _b;
        this.clearImageLoadTimers();
        if (this.readingProgressTimer !== null)
            window.clearTimeout(this.readingProgressTimer);
        (_a = this.articleScrollButtonCleanup) === null || _a === void 0 ? void 0 : _a.call(this);
        this.cleanupCallbacks.forEach((callback) => callback());
        this.cleanupCallbacks = [];
        (_b = this.resizeObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
        this.resizeObserver = null;
        if (this.measuredLayoutFrame !== null)
            window.cancelAnimationFrame(this.measuredLayoutFrame);
        this.measuredLayoutFrame = null;
        this.host.empty();
    }
    /**
     * 更新并应用document，并保持模型、界面和持久化状态的一致性。
     *
     * @param document 要处理的思维导图文档。
     * @param resetHistory 该参数用于 set document 流程中的输入或控制。
     */
    setDocument(document, resetHistory = true) {
        var _a;
        this.document = (0, model_1.cloneDocument)(document);
        this.currentMode = this.resolveMode(this.options.defaultViewMode);
        this.readOnly = this.currentMode === "article" || this.currentMode === "reading" || ((_a = this.document.view) === null || _a === void 0 ? void 0 : _a.readOnly) === true;
        this.selectedId = this.document.root.id;
        if (resetHistory) {
            this.history.reset();
        }
        this.render();
        this.initializeMindMapViewport(20);
    }
    /**
     * 更新并应用options，并保持模型、界面和持久化状态的一致性。
     *
     * @param options 控制当前操作行为的可选配置。
     */
    setOptions(options) {
        var _a, _b;
        const modesChanged = JSON.stringify(this.options.visibleModes) !== JSON.stringify(options.visibleModes);
        const toolbarChanged = JSON.stringify(this.options.visibleToolbarItems) !== JSON.stringify(options.visibleToolbarItems)
            || JSON.stringify(this.options.toolbarItemOrder) !== JSON.stringify(options.toolbarItemOrder);
        const globalModeChanged = this.options.defaultViewMode !== options.defaultViewMode;
        const navigationChanged = JSON.stringify(this.options.articleNavigation) !== JSON.stringify(options.articleNavigation);
        if (navigationChanged)
            this.articleNavigationIndex = null;
        this.options = options;
        const resolved = this.resolveMode(globalModeChanged ? options.defaultViewMode : this.currentMode);
        const previousMode = this.currentMode;
        const modeChanged = resolved !== previousMode;
        if (modeChanged) {
            if (previousMode === "mindmap")
                this.persistMindMapViewportState();
            this.currentMode = resolved;
            this.readOnly = resolved === "article" || resolved === "reading"
                ? true
                : previousMode === "article" || previousMode === "reading"
                    ? ((_a = this.document.view) === null || _a === void 0 ? void 0 : _a.readOnly) === true
                    : this.readOnly;
        }
        if (modesChanged || toolbarChanged) {
            this.cleanupCallbacks.forEach((callback) => callback());
            this.cleanupCallbacks = [];
            (_b = this.resizeObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
            this.resizeObserver = null;
            this.modeButtons.clear();
            this.editControls.splice(0);
            this.buildUi();
        }
        if (this.inlineEditingId && !modesChanged && !toolbarChanged && !globalModeChanged)
            return;
        this.render();
        if (modeChanged && this.currentMode === "mindmap") {
            if (!this.mindMapViewportInitialized && this.options.autoFitOnOpen)
                window.setTimeout(() => this.fitToView(), 20);
            else
                window.setTimeout(() => this.applyTransform(), 20);
        }
    }
    /**
     * 更新并应用display mode，并保持模型、界面和持久化状态的一致性。
     *
     * @param mode 当前布局或显示模式。
     * @param notifyGlobal 该参数用于 set display mode 流程中的输入或控制。
     */
    setDisplayMode(mode, notifyGlobal = true) {
        var _a;
        if (!this.options.visibleModes.includes(mode))
            return;
        const previousMode = this.currentMode;
        if (previousMode === "mindmap")
            this.persistMindMapViewportState();
        const readingAnchor = this.captureReadingPosition(previousMode);
        this.currentMode = mode;
        if ((mode === "article" || mode === "reading") && mode !== previousMode) {
            this.readOnly = true;
        }
        else if ((previousMode === "article" || previousMode === "reading") && mode !== "article" && mode !== "reading") {
            this.readOnly = ((_a = this.document.view) === null || _a === void 0 ? void 0 : _a.readOnly) === true;
        }
        this.render();
        if (readingAnchor)
            this.restoreReadingPosition(mode, readingAnchor);
        if (notifyGlobal)
            void this.callbacks.onDisplayModeChange(mode);
        if (mode === "mindmap") {
            if (!this.mindMapViewportInitialized && this.options.autoFitOnOpen)
                window.setTimeout(() => this.fitToView(), 20);
            else
                window.setTimeout(() => this.applyTransform(), 20);
        }
    }
    /**
     * 应用global display mode，并保持模型、界面和持久化状态的一致性。
     *
     * @param mode 当前布局或显示模式。
     */
    applyGlobalDisplayMode(mode) {
        this.setDisplayMode(mode, false);
    }
    /** 捕获文章或大纲视口中当前阅读节点及节点内部进度。 */
    captureReadingPosition(mode) {
        const scroller = mode === "outline" ? this.outlineEl : mode === "article" ? this.articleEl : null;
        if (!scroller || !scroller.isConnected)
            return null;
        const viewport = scroller.getBoundingClientRect();
        const viewportRatio = .35;
        const anchorY = viewport.top + viewport.height * viewportRatio;
        const candidates = Array.from(scroller.querySelectorAll("[data-node-id]"))
            .map((element) => ({ element, rect: element.getBoundingClientRect() }))
            .filter(({ rect }) => rect.height > 0);
        if (!candidates.length)
            return null;
        const containing = candidates
            .filter(({ rect }) => anchorY >= rect.top && anchorY <= rect.bottom)
            .sort((left, right) => left.rect.height - right.rect.height)[0];
        const nearest = containing !== null && containing !== void 0 ? containing : candidates.sort((left, right) => {
            const leftDistance = anchorY < left.rect.top ? left.rect.top - anchorY : anchorY - left.rect.bottom;
            const rightDistance = anchorY < right.rect.top ? right.rect.top - anchorY : anchorY - right.rect.bottom;
            return leftDistance - rightDistance;
        })[0];
        const nodeId = nearest === null || nearest === void 0 ? void 0 : nearest.element.dataset.nodeId;
        if (!nearest || !nodeId)
            return null;
        return {
            nodeId,
            nodeRatio: Math.max(0, Math.min(1, (anchorY - nearest.rect.top) / nearest.rect.height)),
            viewportRatio
        };
    }
    /** 在目标模式中恢复对应节点和节点内部的阅读位置。 */
    restoreReadingPosition(mode, anchor) {
        const scroller = mode === "outline" ? this.outlineEl : mode === "article" ? this.articleEl : null;
        if (!scroller)
            return;
        const restore = () => {
            const target = scroller.querySelector(`[data-node-id="${CSS.escape(anchor.nodeId)}"]`);
            if (!target)
                return;
            const viewport = scroller.getBoundingClientRect();
            const rect = target.getBoundingClientRect();
            const targetY = rect.top + rect.height * anchor.nodeRatio;
            const desiredY = viewport.top + viewport.height * anchor.viewportRatio;
            scroller.scrollTop += targetY - desiredY;
        };
        restore();
        window.requestAnimationFrame(restore);
    }
    /**
     * 切换read only，并保持模型、界面和持久化状态的一致性。
     */
    toggleReadOnly() {
        const scroller = this.currentMode === "outline"
            ? this.outlineEl
            : this.currentMode === "article" || this.currentMode === "reading"
                ? this.articleEl
                : null;
        const scrollPosition = scroller ? { top: scroller.scrollTop, left: scroller.scrollLeft } : null;
        this.readOnly = !this.readOnly;
        if (this.currentMode !== "article" && this.currentMode !== "reading")
            this.persistReadOnlyState();
        this.render();
        if (scroller && scrollPosition) {
            const restore = () => {
                scroller.scrollTop = scrollPosition.top;
                scroller.scrollLeft = scrollPosition.left;
            };
            restore();
            window.requestAnimationFrame(restore);
        }
        new obsidian_1.Notice(this.readOnly ? "已进入只读模式" : "已进入编辑模式");
    }
    /**
     * 读取并返回document，并保持模型、界面和持久化状态的一致性。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    getDocument() {
        this.persistMindMapViewportState();
        return (0, model_1.cloneDocument)(this.document);
    }
    /**
     * 执行“mark saved”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    markSaved() {
        this.statusEl.setText("已保存");
        this.rootEl.removeClass("is-dirty");
    }
    /**
     * 执行“mark saving”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    markSaving() {
        this.statusEl.setText("保存中…");
        this.rootEl.addClass("is-dirty");
    }
    /**
     * 定位相关数据，并保持模型、界面和持久化状态的一致性。
     */
    focus() {
        this.rootEl.focus();
    }
    /**
     * 定位node by id，并保持模型、界面和持久化状态的一致性。
     *
     * @param id 目标对象或节点的稳定标识。
     */
    focusNodeById(id) {
        var _a, _b;
        if (!(0, model_1.findNode)(this.document.root, id))
            return;
        const navigationIndex = (_b = (_a = this.options.articleNavigation) === null || _a === void 0 ? void 0 : _a.entries.findIndex((entry) => entry.nodeId === id)) !== null && _b !== void 0 ? _b : -1;
        if (navigationIndex >= 0)
            this.articleNavigationIndex = navigationIndex;
        this.focusNode(id);
    }
    /**
     * Switches the current top-level document to its generated article directory.
     */
    showArticleDirectory() {
        this.currentMode = "article";
        this.mutate(() => {
            var _a;
            this.document.view = { ...((_a = this.document.view) !== null && _a !== void 0 ? _a : {}), articleLandingMode: "toc" };
        });
    }
    /**
     * 构建ui，并保持模型、界面和持久化状态的一致性。
     */
    buildUi() {
        this.host.empty();
        this.rootEl = this.host.createDiv({ cls: "mmc-editor" });
        this.rootEl.tabIndex = 0;
        this.toolbarEl = this.rootEl.createDiv({ cls: "mmc-toolbar" });
        this.navigationBarEl = this.rootEl.createDiv({ cls: "mmc-parent-navigation" });
        this.viewportEl = this.rootEl.createDiv({ cls: "mmc-viewport" });
        this.canvasBreadcrumbEl = this.viewportEl.createDiv({ cls: "mmc-canvas-breadcrumb is-hidden" });
        this.sceneEl = this.viewportEl.createDiv({ cls: "mmc-scene" });
        this.edgesSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.edgesSvg.classList.add("mmc-edges");
        this.sceneEl.appendChild(this.edgesSvg);
        this.nodesLayerEl = this.sceneEl.createDiv({ cls: "mmc-nodes-layer" });
        this.outlineEl = this.rootEl.createDiv({ cls: "mms-outline-view" });
        this.articleEl = this.rootEl.createDiv({ cls: "mms-article-view" });
        const modeGroup = this.toolbarEl.createDiv({ cls: "mms-mode-switcher" });
        for (const mode of this.options.visibleModes) {
            const button = modeGroup.createEl("button", {
                cls: "mms-mode-button",
                attr: { type: "button", title: `${modes_1.DISPLAY_MODE_LABELS[mode]}模式` }
            });
            (0, obsidian_1.setIcon)(button, modes_1.DISPLAY_MODE_ICONS[mode]);
            button.createSpan({ text: modes_1.DISPLAY_MODE_LABELS[mode] });
            button.addEventListener("click", () => this.setDisplayMode(mode));
            this.modeButtons.set(mode, button);
        }
        this.lockButton = this.addToolbarButton("lock", "lock-open", "切换只读 / 编辑模式", () => this.toggleReadOnly());
        this.addToolbarSeparator();
        this.addToolbarButton("add-child", "plus-circle", "添加子节点（Tab）", () => this.addChild(), true);
        this.addToolbarButton("add-sibling", "list-plus", "添加同级节点（Enter）", () => this.addSibling(), true);
        this.addToolbarButton("edit", "pencil", "编辑节点（F2）", () => this.editSelected(), true);
        this.addToolbarButton("duplicate", "copy-plus", "克隆分支（Ctrl/Cmd+D）", () => this.duplicateSelected(), true);
        this.addToolbarButton("delete", "trash-2", "删除节点（Delete）", () => this.deleteSelected(), true);
        this.addToolbarSeparator();
        this.addToolbarButton("task", "circle-check-big", "切换任务状态（Ctrl/Cmd+Enter）", () => this.cycleTask(), true);
        this.addToolbarButton("collapse", "fold-vertical", "展开/收起节点（Space）", () => this.toggleCollapse(), true);
        this.addToolbarButton("link", "link", "打开节点链接", () => this.openSelectedLink());
        this.addToolbarButton("search", "search", "搜索当前导图及全部子导图（Ctrl/Cmd+Shift+F）", () => this.openSearch());
        this.addToolbarButton("global-search", "file-search", "全局搜索所有导图", () => this.callbacks.onGlobalSearch());
        this.addToolbarSeparator();
        this.addToolbarButton("table", "table-2", "插入或编辑表格", () => this.editTable(), true);
        this.addToolbarButton("code", "code-2", "插入或编辑代码", () => this.editCode(), true);
        this.addToolbarButton("image", "image-plus", "粘贴图片到当前节点（Ctrl/Cmd+V）", () => new obsidian_1.Notice("先复制图片，再选中节点并按 Ctrl/Cmd+V"), true);
        this.addToolbarButton("submap", "network", "创建或进入子导图", () => void this.createOrOpenSubmap());
        this.addToolbarSeparator();
        this.addToolbarButton("undo", "undo-2", "撤销（Ctrl/Cmd+Z）", () => this.undo(), true);
        this.addToolbarButton("redo", "redo-2", "重做（Ctrl/Cmd+Y）", () => this.redo(), true);
        this.addToolbarSeparator();
        this.addToolbarButton("fit", "maximize", "适应画布", () => this.fitToView());
        this.addToolbarButton("layout", "git-fork", "切换单侧/双侧布局", () => this.toggleLayout(), true);
        this.addToolbarButton("appearance", "palette", "当前脑图外观", () => this.editAppearance(), true);
        this.articleLandingButton = this.addToolbarButton("article-landing", "list-tree", "切换目录 / 原始文章", () => this.toggleArticleLanding());
        this.articleStyleButton = this.addToolbarButton("article-style", "paintbrush", "文章样式", () => this.editArticleStyle(), true);
        this.addToolbarSeparator();
        this.addToolbarButton("markdown", "file-text", "查看 Markdown 大纲", () => this.showOutline());
        this.addToolbarButton("json", "braces", "导入 / 导出", () => this.showJsonTransfer(), true);
        this.addToolbarButton("export-document", "file-output", "导出 HTML / Word / PDF / Markdown", () => this.showDocumentExport());
        this.addToolbarButton("export-svg", "image", "导出 SVG", () => void this.callbacks.onExportSvg((0, layout_1.documentToSvg)(this.document.root, this.document.layout, this.document.title, this.getAppearance())));
        this.applyToolbarOrder();
        const spacer = this.toolbarEl.createSpan({ cls: "mmc-toolbar-spacer" });
        spacer.setAttr("aria-hidden", "true");
        const zoomControl = this.toolbarEl.createDiv({ cls: "mmc-zoom-control" });
        const zoomOut = zoomControl.createEl("button", { cls: "clickable-icon mmc-zoom-step", attr: { type: "button", title: "缩小", "aria-label": "缩小" } });
        (0, obsidian_1.setIcon)(zoomOut, "minus");
        zoomOut.addEventListener("click", () => { this.setZoom(this.zoom / 1.15); this.focus(); });
        this.zoomStatusEl = zoomControl.createEl("input", {
            cls: "mmc-zoom-status mmc-zoom-input",
            attr: { type: "text", inputmode: "decimal", title: "输入缩放百分比", "aria-label": "输入缩放百分比" }
        });
        this.zoomStatusEl.value = "100%";
        this.zoomStatusEl.addEventListener("change", () => this.applyZoomInput());
        this.zoomStatusEl.addEventListener("focus", () => this.zoomStatusEl.select());
        this.zoomStatusEl.addEventListener("keydown", (event) => {
            event.stopPropagation();
            if (event.key === "Enter")
                this.zoomStatusEl.blur();
            if (event.key === "Escape") {
                this.applyTransform();
                this.zoomStatusEl.blur();
            }
        });
        const zoomIn = zoomControl.createEl("button", { cls: "clickable-icon mmc-zoom-step", attr: { type: "button", title: "放大", "aria-label": "放大" } });
        (0, obsidian_1.setIcon)(zoomIn, "plus");
        zoomIn.addEventListener("click", () => { this.setZoom(this.zoom * 1.15); this.focus(); });
        this.statusEl = this.toolbarEl.createSpan({ cls: "mmc-save-status", text: "已保存" });
        const keydown = (event) => this.handleKeydown(event);
        this.rootEl.addEventListener("keydown", keydown, true);
        // Ctrl-hold tracking for resize modifier
        const ctrlTracker = (trackEvent) => {
            if (this.resizeModifier !== "ctrl")
                return;
            if (trackEvent.type === "keydown" && (trackEvent.key === "Control" || trackEvent.key === "Meta")) {
                this.rootEl.addClass("is-ctrl-held");
            }
            else if (trackEvent.type === "keyup" && (trackEvent.key === "Control" || trackEvent.key === "Meta")) {
                this.rootEl.removeClass("is-ctrl-held");
            }
        };
        document.addEventListener("keydown", ctrlTracker);
        document.addEventListener("keyup", ctrlTracker);
        this.cleanupCallbacks.push(() => {
            document.removeEventListener("keydown", ctrlTracker);
            document.removeEventListener("keyup", ctrlTracker);
        });
        this.cleanupCallbacks.push(() => this.rootEl.removeEventListener("keydown", keydown, true));
        const paste = (event) => { void this.handlePaste(event); };
        this.rootEl.addEventListener("paste", paste);
        this.cleanupCallbacks.push(() => this.rootEl.removeEventListener("paste", paste));
        const wheel = (event) => {
            const wheelTarget = event.target;
            if (wheelTarget.closest(".mmc-node-table-wrap, .mmc-code-block"))
                return;
            event.preventDefault();
            // Shift+???????????????
            if (event.shiftKey) {
                const rect = this.viewportEl.getBoundingClientRect();
                const pointerX = event.clientX - rect.left - rect.width / 2;
                const pointerY = event.clientY - rect.top - rect.height / 2;
                const oldZoom = this.zoom;
                const nextZoom = this.clampZoom(this.zoom * (event.deltaY < 0 ? 1.1 : 0.9));
                const worldX = (pointerX - this.panX) / oldZoom;
                const worldY = (pointerY - this.panY) / oldZoom;
                this.zoom = nextZoom;
                this.panX = pointerX - worldX * nextZoom;
                this.panY = pointerY - worldY * nextZoom;
                this.mindMapViewportInitialized = true;
                this.applyTransform();
                return;
            }
            if (this.options.twoFingerGestureAction === "pan") {
                this.panX -= event.deltaX;
                this.panY -= event.deltaY;
                this.mindMapViewportInitialized = true;
                this.applyTransform();
                return;
            }
            const rect = this.viewportEl.getBoundingClientRect();
            const pointerX = event.clientX - rect.left - rect.width / 2;
            const pointerY = event.clientY - rect.top - rect.height / 2;
            const oldZoom = this.zoom;
            const nextZoom = this.clampZoom(this.zoom * (event.deltaY < 0 ? 1.1 : 0.9));
            const worldX = (pointerX - this.panX) / oldZoom;
            const worldY = (pointerY - this.panY) / oldZoom;
            this.zoom = nextZoom;
            this.panX = pointerX - worldX * nextZoom;
            this.panY = pointerY - worldY * nextZoom;
            this.mindMapViewportInitialized = true;
            this.applyTransform();
        };
        this.viewportEl.addEventListener("wheel", wheel, { passive: false });
        this.cleanupCallbacks.push(() => this.viewportEl.removeEventListener("wheel", wheel));
        const pointerDown = (event) => {
            const target = event.target;
            if (target.closest(".mmc-node, .mmc-canvas-breadcrumb"))
                return;
            if (event.button !== 0 && event.button !== 1)
                return;
            if (event.pointerType === "touch") {
                event.preventDefault();
                this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
                this.viewportEl.setPointerCapture(event.pointerId);
                if (this.touchPointers.size >= 2) {
                    this.panning = false;
                    this.viewportEl.removeClass("is-panning");
                    this.beginTwoFingerGesture();
                }
                else {
                    this.panning = true;
                    this.panStart = { x: event.clientX, y: event.clientY, panX: this.panX, panY: this.panY };
                    this.viewportEl.addClass("is-panning");
                    this.selectNode(null);
                }
                return;
            }
            if (event.button === 0 && event.shiftKey) {
                const viewportRect = this.viewportEl.getBoundingClientRect();
                const startX = event.clientX - viewportRect.left;
                const startY = event.clientY - viewportRect.top;
                const baseSelection = new Set(this.selectedIds);
                if (this.selectedId)
                    baseSelection.add(this.selectedId);
                baseSelection.delete(this.document.root.id);
                const marquee = this.viewportEl.createDiv({ cls: "mmc-selection-marquee" });
                marquee.style.left = `${startX}px`;
                marquee.style.top = `${startY}px`;
                this.viewportEl.setPointerCapture(event.pointerId);
                const moveSelection = (moveEvent) => {
                    var _a;
                    const currentX = moveEvent.clientX - viewportRect.left;
                    const currentY = moveEvent.clientY - viewportRect.top;
                    marquee.style.left = `${Math.min(startX, currentX)}px`;
                    marquee.style.top = `${Math.min(startY, currentY)}px`;
                    marquee.style.width = `${Math.abs(currentX - startX)}px`;
                    marquee.style.height = `${Math.abs(currentY - startY)}px`;
                    const left = Math.min(event.clientX, moveEvent.clientX);
                    const right = Math.max(event.clientX, moveEvent.clientX);
                    const top = Math.min(event.clientY, moveEvent.clientY);
                    const bottom = Math.max(event.clientY, moveEvent.clientY);
                    this.selectedIds.clear();
                    for (const id of baseSelection)
                        this.selectedIds.add(id);
                    for (const nodeEl of Array.from(this.nodesLayerEl.querySelectorAll(".mmc-node[data-node-id]"))) {
                        const rect = nodeEl.getBoundingClientRect();
                        if (rect.right >= left && rect.left <= right && rect.bottom >= top && rect.top <= bottom) {
                            const id = nodeEl.dataset.nodeId;
                            if (id && id !== this.document.root.id)
                                this.selectedIds.add(id);
                        }
                    }
                    this.selectedId = (_a = Array.from(this.selectedIds).at(-1)) !== null && _a !== void 0 ? _a : "";
                    this.applySelectionClasses();
                };
                const finishSelection = (upEvent) => {
                    this.viewportEl.removeEventListener("pointermove", moveSelection);
                    this.viewportEl.removeEventListener("pointerup", finishSelection);
                    this.viewportEl.removeEventListener("pointercancel", finishSelection);
                    if (this.viewportEl.hasPointerCapture(upEvent.pointerId))
                        this.viewportEl.releasePointerCapture(upEvent.pointerId);
                    marquee.remove();
                };
                this.viewportEl.addEventListener("pointermove", moveSelection);
                this.viewportEl.addEventListener("pointerup", finishSelection);
                this.viewportEl.addEventListener("pointercancel", finishSelection);
                return;
            }
            this.panning = true;
            this.panStart = { x: event.clientX, y: event.clientY, panX: this.panX, panY: this.panY };
            this.viewportEl.setPointerCapture(event.pointerId);
            this.viewportEl.addClass("is-panning");
            this.selectNode(null);
        };
        const pointerMove = (event) => {
            if (event.pointerType === "touch" && this.touchPointers.has(event.pointerId)) {
                this.touchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
                if (this.touchPointers.size >= 2) {
                    this.updateTwoFingerGesture();
                    return;
                }
            }
            if (!this.panning)
                return;
            this.panX = this.panStart.panX + event.clientX - this.panStart.x;
            this.panY = this.panStart.panY + event.clientY - this.panStart.y;
            this.mindMapViewportInitialized = true;
            this.applyTransform();
        };
        const pointerUp = (event) => {
            if (event.pointerType === "touch" && this.touchPointers.delete(event.pointerId)) {
                if (this.viewportEl.hasPointerCapture(event.pointerId))
                    this.viewportEl.releasePointerCapture(event.pointerId);
                this.touchGesture = null;
                const remainingPointer = this.touchPointers.values().next().value;
                if (remainingPointer) {
                    this.panning = true;
                    this.panStart = { x: remainingPointer.x, y: remainingPointer.y, panX: this.panX, panY: this.panY };
                    this.viewportEl.addClass("is-panning");
                }
                else {
                    this.panning = false;
                    this.viewportEl.removeClass("is-panning");
                }
                return;
            }
            if (!this.panning)
                return;
            this.panning = false;
            if (this.viewportEl.hasPointerCapture(event.pointerId))
                this.viewportEl.releasePointerCapture(event.pointerId);
            this.viewportEl.removeClass("is-panning");
        };
        this.viewportEl.addEventListener("pointerdown", pointerDown);
        this.viewportEl.addEventListener("pointermove", pointerMove);
        this.viewportEl.addEventListener("pointerup", pointerUp);
        this.viewportEl.addEventListener("pointercancel", pointerUp);
        const canvasContextMenu = (event) => {
            const target = event.target;
            if (target.closest(".mmc-node, .mmc-canvas-breadcrumb"))
                return;
            event.preventDefault();
            this.openAllNodesContextMenu(event);
        };
        this.viewportEl.addEventListener("contextmenu", canvasContextMenu);
        this.cleanupCallbacks.push(() => {
            this.viewportEl.removeEventListener("pointerdown", pointerDown);
            this.viewportEl.removeEventListener("pointermove", pointerMove);
            this.viewportEl.removeEventListener("pointerup", pointerUp);
            this.viewportEl.removeEventListener("pointercancel", pointerUp);
            this.viewportEl.removeEventListener("contextmenu", canvasContextMenu);
        });
        this.resizeObserver = new ResizeObserver((entries) => {
            if (entries.some((entry) => entry.target === this.viewportEl))
                this.applyTransform();
            if (entries.some((entry) => entry.target instanceof HTMLElement && entry.target.hasClass("mmc-node"))) {
                this.scheduleMeasuredMindMapLayout();
            }
        });
        this.resizeObserver.observe(this.viewportEl);
    }
    /**
     * 解析并确定mode，并保持模型、界面和持久化状态的一致性。
     *
     * @param preferred 该参数用于 resolve mode 流程中的输入或控制。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    resolveMode(preferred) {
        var _a;
        if (this.options.visibleModes.includes(preferred))
            return preferred;
        return (_a = this.options.visibleModes[0]) !== null && _a !== void 0 ? _a : "mindmap";
    }
    /**
     * 执行“persist read only state”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    persistReadOnlyState() {
        var _a;
        this.document.view = { ...((_a = this.document.view) !== null && _a !== void 0 ? _a : {}), readOnly: this.readOnly };
        delete this.document.view.mode;
        this.callbacks.onChange(this.getDocument());
        this.markSaving();
    }
    /**
     * 执行“update mode ui”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    updateModeUi() {
        var _a;
        for (const [mode, button] of this.modeButtons)
            button.toggleClass("is-active", mode === this.currentMode);
        const isArticle = this.currentMode === "article";
        const hasLandingChoice = isArticle && this.options.showArticleToc;
        this.articleLandingButton.toggleClass("is-hidden", !hasLandingChoice || !this.options.visibleToolbarItems.includes("article-landing"));
        this.articleStyleButton.toggleClass("is-hidden", !isArticle || !this.options.visibleToolbarItems.includes("article-style"));
        if (hasLandingChoice) {
            const showingArticle = ((_a = this.document.view) === null || _a === void 0 ? void 0 : _a.articleLandingMode) === "article";
            this.articleLandingButton.setAttr("aria-label", showingArticle ? "显示目录" : "显示原始文章");
            this.articleLandingButton.setAttr("title", showingArticle ? "显示目录" : "显示原始文章");
            this.articleLandingButton.empty();
            (0, obsidian_1.setIcon)(this.articleLandingButton, showingArticle ? "list-tree" : "file-text");
            this.articleLandingButton.toggleClass("is-active", showingArticle);
        }
        this.lockButton.empty();
        (0, obsidian_1.setIcon)(this.lockButton, this.readOnly ? "lock" : "lock-open");
        this.lockButton.setAttr("aria-label", this.readOnly ? "当前只读，点击切换到编辑模式" : "当前可编辑，点击切换到只读模式");
        this.lockButton.setAttr("title", this.readOnly ? "只读模式" : "编辑模式");
        this.lockButton.toggleClass("is-active", this.readOnly);
        this.rootEl.toggleClass("is-read-only", this.readOnly);
        for (const control of this.editControls) {
            if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement || control instanceof HTMLSelectElement)
                control.disabled = this.readOnly;
            control.toggleClass("is-read-only-disabled", this.readOnly);
        }
    }
    /**
     * 执行“ensure editable”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     * @returns 操作条件是否成立或处理是否成功。
     */
    ensureEditable() {
        if (!this.readOnly)
            return true;
        new obsidian_1.Notice("当前为只读模式，请先点击锁按钮切换到编辑模式");
        return false;
    }
    /**
     * 执行“clear image load timers”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    clearImageLoadTimers() {
        for (const timer of this.imageLoadTimers)
            window.clearTimeout(timer);
        this.imageLoadTimers.clear();
    }
    /**
     * 添加toolbar button，并保持模型、界面和持久化状态的一致性。
     *
     * @param id 工具栏项目设置标识。
     * @param icon 该参数用于 add toolbar button 流程中的输入或控制。
     * @param label 该参数用于 add toolbar button 流程中的输入或控制。
     * @param action 该参数用于 add toolbar button 流程中的输入或控制。
     * @param editOnly 该参数用于 add toolbar button 流程中的输入或控制。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    addToolbarButton(id, icon, label, action, editOnly = false) {
        const button = this.toolbarEl.createEl("button", { cls: "clickable-icon mmc-toolbar-button", attr: { "aria-label": label, title: label, type: "button" } });
        button.dataset.toolbarId = id;
        (0, obsidian_1.setIcon)(button, icon);
        button.toggleClass("is-hidden", !this.options.visibleToolbarItems.includes(id));
        if (editOnly) {
            button.addClass("mms-edit-only-control");
            this.editControls.push(button);
        }
        button.addEventListener("click", () => {
            if (editOnly && this.readOnly)
                return;
            action();
            this.focus();
        });
        return button;
    }
    /**
     * Applies the user-defined order to toolbar buttons.
     */
    applyToolbarOrder() {
        const buttons = new Map();
        for (const button of Array.from(this.toolbarEl.querySelectorAll("[data-toolbar-id]"))) {
            const id = button.dataset.toolbarId;
            if (id)
                buttons.set(id, button);
        }
        for (const separator of Array.from(this.toolbarEl.querySelectorAll(".mmc-toolbar-separator")))
            separator.remove();
        const order = [...this.options.toolbarItemOrder, ...settings_1.TOOLBAR_ITEMS.map(([id]) => id)];
        for (const id of new Set(order)) {
            const button = buttons.get(id);
            if (button)
                this.toolbarEl.appendChild(button);
        }
    }
    /**
     * 添加toolbar separator，并保持模型、界面和持久化状态的一致性。
     */
    addToolbarSeparator() {
        this.toolbarEl.createSpan({ cls: "mmc-toolbar-separator" });
    }
    /**
     * 读取并返回appearance，并保持模型、界面和持久化状态的一致性。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    getAppearance() {
        return (0, model_1.mergeAppearance)(this.options.defaultAppearance, this.document.appearance);
    }
    /**
     * 执行“font family css”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param appearance 导图外观配置。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    fontFamilyCss(appearance) {
        var _a;
        if (appearance.fontFamily === "serif")
            return 'Georgia, "Times New Roman", serif';
        if (appearance.fontFamily === "mono")
            return '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
        if (appearance.fontFamily === "custom" && ((_a = appearance.customFont) === null || _a === void 0 ? void 0 : _a.trim()))
            return `"${appearance.customFont.trim().replaceAll('"', '')}", sans-serif`;
        if (appearance.fontFamily === "sans")
            return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        return "var(--font-interface)";
    }
    /**
     * 应用appearance，并保持模型、界面和持久化状态的一致性。
     *
     * @param appearance 导图外观配置。
     */
    applyAppearance(appearance) {
        var _a, _b, _c;
        const setOrRemove = (name, value) => {
            if (value)
                this.rootEl.style.setProperty(name, value);
            else
                this.rootEl.style.removeProperty(name);
        };
        setOrRemove("--mmc-canvas", appearance.backgroundColor);
        setOrRemove("--mmc-pattern-color", appearance.patternColor);
        setOrRemove("--mmc-edge", appearance.edgeColor);
        setOrRemove("--mmc-root-bg", appearance.rootColor);
        setOrRemove("--mmc-root-text", appearance.rootTextColor);
        setOrRemove("--mmc-node-bg", appearance.nodeColor);
        setOrRemove("--mmc-node-text", appearance.textColor);
        setOrRemove("--mmc-node-border", appearance.nodeBorderColor);
        this.rootEl.style.setProperty("--mmc-font-family", this.fontFamilyCss(appearance));
        this.rootEl.style.setProperty("--mmc-edge-width", `${(_a = appearance.edgeWidth) !== null && _a !== void 0 ? _a : 2.2}px`);
        this.rootEl.style.setProperty("--mmc-node-border-width", `${(_b = appearance.nodeBorderWidth) !== null && _b !== void 0 ? _b : 1}px`);
        this.rootEl.dataset.nodeVisualStyle = (_c = appearance.nodeVisualStyle) !== null && _c !== void 0 ? _c : "card";
        this.viewportEl.toggleClass("pattern-grid", appearance.backgroundPattern === "grid");
        this.viewportEl.toggleClass("pattern-dots", appearance.backgroundPattern === "dots");
        this.viewportEl.toggleClass("pattern-none", !appearance.backgroundPattern || appearance.backgroundPattern === "none");
    }
    /**
     * 在画布左上角或文档顶部渲染父子导图导航。导图模式使用固定悬浮面包屑，文章和大纲模式使用文档流导航，均保持当前全局显示模式。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    renderNavigation() {
        var _a, _b, _c;
        this.navigationBarEl.empty();
        this.canvasBreadcrumbEl.empty();
        const navigation = this.document.navigation;
        const hasParent = Boolean(navigation === null || navigation === void 0 ? void 0 : navigation.parentPath);
        const showNavigationBar = hasParent && this.currentMode !== "mindmap";
        const showCanvasBreadcrumb = hasParent && this.currentMode === "mindmap";
        this.navigationBarEl.toggleClass("is-hidden", !showNavigationBar);
        this.canvasBreadcrumbEl.toggleClass("is-hidden", !showCanvasBreadcrumb);
        if (!(navigation === null || navigation === void 0 ? void 0 : navigation.parentPath))
            return;
        const parentTitle = (_c = (_a = navigation.parentTitle) !== null && _a !== void 0 ? _a : (_b = navigation.parentPath.split("/").at(-1)) === null || _b === void 0 ? void 0 : _b.replace(/\.mindmap$/i, "")) !== null && _c !== void 0 ? _c : "父导图";
        const currentTitle = (0, model_1.nodePlainText)(this.document.root) || this.document.title || "当前导图";
        const returnTitle = navigation.parentNodeText
            ? `返回父导图：${parentTitle}（来源节点：${navigation.parentNodeText}）`
            : `返回父导图：${parentTitle}`;
        const openParent = () => {
            void this.callbacks.onOpenMindMap(navigation.parentPath, navigation.parentNodeId);
        };
        if (showCanvasBreadcrumb) {
            const shell = this.canvasBreadcrumbEl.createDiv({ cls: "mmc-canvas-breadcrumb-shell" });
            const backButton = shell.createEl("button", {
                cls: "mmc-canvas-breadcrumb-back",
                attr: { type: "button", title: returnTitle, "aria-label": returnTitle }
            });
            (0, obsidian_1.setIcon)(backButton, "arrow-left");
            backButton.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                openParent();
            });
            const trail = shell.createDiv({ cls: "mmc-canvas-breadcrumb-trail" });
            const parent = trail.createEl("button", {
                cls: "mmc-canvas-breadcrumb-parent",
                text: parentTitle,
                attr: { type: "button", title: returnTitle }
            });
            parent.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                openParent();
            });
            trail.createSpan({ cls: "mmc-canvas-breadcrumb-separator", text: "›" });
            trail.createSpan({ cls: "mmc-canvas-breadcrumb-current", text: currentTitle });
            shell.setAttr("title", navigation.parentPath);
        }
        if (!showNavigationBar)
            return;
        const button = this.navigationBarEl.createEl("button", {
            cls: "mmc-parent-navigation-button",
            attr: { type: "button", title: returnTitle }
        });
        (0, obsidian_1.setIcon)(button, "arrow-left");
        const labels = button.createDiv({ cls: "mmc-parent-navigation-labels" });
        labels.createDiv({ cls: "mmc-parent-navigation-title", text: `返回父导图：${parentTitle}` });
        if (navigation.parentNodeText)
            labels.createDiv({ cls: "mmc-parent-navigation-node", text: `来源节点：${navigation.parentNodeText}` });
        button.addEventListener("click", openParent);
        this.navigationBarEl.createDiv({ cls: "mmc-parent-navigation-path", text: navigation.parentPath });
    }
    /**
     * 执行“update node primary text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param node 当前处理的节点。
     * @param value 待校验、转换或比较的输入值。
     */
    updateNodePrimaryText(node, value) {
        const next = value.text.replace(/\s+/g, " ").trim();
        const blocks = (0, model_1.nodeContentBlocks)(node);
        const firstText = blocks.find((block) => block.type === "text");
        if (firstText) {
            firstText.text = next;
            firstText.richText = value.richText;
        }
        else if (next) {
            blocks.unshift({ id: (0, model_1.newId)(), type: "text", text: next });
        }
        node.content = blocks.filter((block) => block.type !== "text" || block.text.trim());
        (0, model_1.syncNodeLegacyFields)(node);
        if (node.id === this.document.root.id && next)
            this.document.title = next;
    }
    /**
     * 创建并配置inline editable，并保持模型、界面和持久化状态的一致性。
     *
     * @param element 该参数用于 make inline editable 流程中的输入或控制。
     * @param node 当前处理的节点。
     * @param placeholder 该参数用于 make inline editable 流程中的输入或控制。
     */
    makeInlineEditable(element, node, placeholder) {
        var _a, _b;
        element.contentEditable = this.readOnly ? "false" : "true";
        element.setAttr("role", "textbox");
        element.setAttr("aria-label", placeholder);
        if (!((_a = element.textContent) === null || _a === void 0 ? void 0 : _a.trim()))
            element.dataset.placeholder = placeholder;
        if (this.readOnly)
            return;
        const initialBlock = (0, model_1.nodeContentBlocks)(node).find((block) => block.type === "text");
        (0, rich_text_dom_1.renderRichTextRuns)(element, initialBlock === null || initialBlock === void 0 ? void 0 : initialBlock.richText, (_b = initialBlock === null || initialBlock === void 0 ? void 0 : initialBlock.text) !== null && _b !== void 0 ? _b : (0, model_1.nodePrimaryText)(node), false);
        let original = (0, rich_text_dom_1.readRichTextEditor)(element);
        let toolbar = null;
        element.addEventListener("focus", () => {
            original = (0, rich_text_dom_1.readRichTextEditor)(element);
            toolbar !== null && toolbar !== void 0 ? toolbar : (toolbar = (0, selection_format_toolbar_1.attachSelectionFormatToolbar)({
                editor: element,
                shortcuts: this.options.richTextShortcuts,
                shortcutMatches: (event, shortcut) => this.shortcutMatches(event, shortcut)
            }));
        });
        element.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                element.blur();
            }
            if (event.key === "Escape") {
                event.preventDefault();
                (0, rich_text_dom_1.renderRichTextRuns)(element, original.richText, original.text, false);
                element.blur();
            }
        });
        element.addEventListener("blur", (event) => {
            if (toolbar === null || toolbar === void 0 ? void 0 : toolbar.contains(event.relatedTarget))
                return;
            const next = (0, rich_text_dom_1.readRichTextEditor)(element);
            toolbar === null || toolbar === void 0 ? void 0 : toolbar.cleanup();
            toolbar = null;
            if ((!next.text && node.id === this.document.root.id)
                || JSON.stringify(next) === JSON.stringify(original)) {
                (0, rich_text_dom_1.renderRichTextRuns)(element, original.richText, original.text, false);
                return;
            }
            this.mutate(() => this.updateNodePrimaryText(node, next));
        });
    }
    /**
     * 添加inline node actions，并保持模型、界面和持久化状态的一致性。
     *
     * @param container 接收渲染内容的 DOM 容器。
     * @param node 当前处理的节点。
     */
    addInlineNodeActions(container, node) {
        if (this.readOnly)
            return;
        const actions = container.createDiv({ cls: "mms-inline-node-actions" });
        const action = (icon, label, handler) => {
            const button = actions.createEl("button", { cls: "clickable-icon", attr: { type: "button", title: label, "aria-label": label } });
            (0, obsidian_1.setIcon)(button, icon);
            button.addEventListener("click", (event) => { event.stopPropagation(); this.selectNode(node.id); handler(); });
        };
        action("pencil", "完整编辑", () => this.editSelected());
        action("plus", "添加子节点", () => this.addChild());
        if (node.id !== this.document.root.id)
            action("trash-2", "删除节点", () => this.deleteSelected());
    }
    /**
     * 按照节点层级渲染可编辑大纲。节点标题、备注和子导图链接仍映射到同一份数据，任何修改都会通过统一变更链同步到导图和文章模式。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    renderOutline() {
        (0, outline_renderer_1.renderOutlineMode)(this.outlineEl, {
            app: this.app,
            document: this.document,
            selectedId: this.selectedId,
            readOnly: this.readOnly,
            selectNode: (id) => this.selectNode(id),
            makeInlineEditable: (element, node, placeholder) => this.makeInlineEditable(element, node, placeholder),
            addInlineNodeActions: (container, node) => this.addInlineNodeActions(container, node),
            mutate: (action) => this.mutate(action),
            editSelected: () => this.editSelected(),
            openMindMap: (path) => this.callbacks.onOpenMindMap(path),
            resolveImage: this.callbacks.resolveImage,
            renderCode: this.callbacks.onRenderCode
        });
    }
    /**
     * 渲染文章目录页、章节编号、正文和跨子导图链接。顶层父导图可展示递归目录；子导图根据文章上下文继续父级编号。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    renderArticle() {
        this.articleEl.onscroll = null;
        (0, article_renderer_1.renderArticleMode)(this.articleEl, this.articleRendererOptions());
        this.addArticleScrollToTopButton();
    }
    /** 构造文章渲染器所需的最小状态边界。 */
    articleRendererOptions() {
        return {
            app: this.app,
            document: this.document,
            selectedId: this.selectedId,
            readOnly: this.readOnly,
            articleBaseDepth: this.options.articleBaseDepth,
            showArticleToc: this.options.showArticleToc,
            articleTocEntries: this.options.articleTocEntries,
            articleTocMaxDepth: this.options.articleTocMaxDepth,
            articleNavigation: this.options.articleNavigation,
            articleNavigationIndex: this.articleNavigationIndex,
            callbacks: this.callbacks,
            selectNode: (id) => this.selectNode(id),
            makeInlineEditable: (element, node, placeholder) => this.makeInlineEditable(element, node, placeholder),
            addInlineNodeActions: (container, node) => this.addInlineNodeActions(container, node)
        };
    }
    /** 将文章内容块渲染委托给文章模式模块。 */
    renderArticleContent(container, node, treatTextAsBody) {
        (0, article_renderer_1.renderArticleNodeContent)(container, node, treatTextAsBody, this.articleRendererOptions());
    }
    /**
     * 渲染相关数据，并保持模型、界面和持久化状态的一致性。
     */
    render() {
        for (const id of Array.from(this.selectedIds)) {
            if (!(0, model_1.findNode)(this.document.root, id))
                this.selectedIds.delete(id);
        }
        if (this.selectedId && !this.selectedIds.has(this.selectedId)) {
            this.selectedIds.clear();
            this.selectedIds.add(this.selectedId);
        }
        this.clearImageLoadTimers();
        this.renderNavigation();
        const appearance = this.getAppearance();
        this.applyAppearance(appearance);
        this.updateModeUi();
        this.viewportEl.toggleClass("is-hidden", this.currentMode !== "mindmap");
        this.outlineEl.toggleClass("is-hidden", this.currentMode !== "outline");
        this.articleEl.toggleClass("is-hidden", this.currentMode !== "article" && this.currentMode !== "reading");
        this.rootEl.dataset.displayMode = this.currentMode;
        if (this.currentMode === "outline")
            this.renderOutline();
        else if (this.currentMode === "article")
            this.renderArticle();
        else if (this.currentMode === "reading")
            this.renderReading();
        else
            this.renderMindMap();
    }
    /**
     * 渲染可交互导图画布：计算布局、绘制连接线和节点、恢复选择状态、绑定拖拽与尺寸手柄、安装子导图整节点入口，并启动图片镜像加载探测。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    renderMindMap() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
        const appearance = this.getAppearance();
        this.layout = (0, layout_1.computeLayout)(this.document.root, this.document.layout, (_a = appearance.fontSize) !== null && _a !== void 0 ? _a : 14, (_b = appearance.nodeVisualStyle) !== null && _b !== void 0 ? _b : "card", appearance);
        const branchColorMap = appearance.colorfulBranches ? (0, layout_1.buildBranchColorMap)(this.document.root, appearance.branchColors) : new Map();
        this.clearDropPreview();
        this.nodesLayerEl.empty();
        while (this.edgesSvg.firstChild)
            this.edgesSvg.removeChild(this.edgesSvg.firstChild);
        this.renderMindMapEdges(appearance, branchColorMap);
        for (const position of this.layout.nodes) {
            const node = position.node;
            const shape = (_d = (_c = node.style) === null || _c === void 0 ? void 0 : _c.shape) !== null && _d !== void 0 ? _d : this.options.defaultNodeShape;
            const textAlign = (_g = (_f = (_e = node.style) === null || _e === void 0 ? void 0 : _e.textAlign) !== null && _f !== void 0 ? _f : appearance.nodeTextAlign) !== null && _g !== void 0 ? _g : "center";
            const classes = ["mmc-node", position.depth === 0 ? "is-root" : "", node.submap ? "is-submap-node" : "", `shape-${shape}`, `text-align-${textAlign}`].filter(Boolean).join(" ");
            const nodeEl = this.nodesLayerEl.createDiv({ cls: classes });
            nodeEl.dataset.nodeId = node.id;
            nodeEl.style.left = `${position.x}px`;
            nodeEl.style.top = `${position.y}px`;
            nodeEl.style.width = `${position.width}px`;
            nodeEl.style.minHeight = `${position.height}px`;
            nodeEl.style.setProperty("--mmc-node-text-align", textAlign);
            nodeEl.draggable = position.depth > 0 && !this.readOnly;
            if (this.selectedId === node.id || this.selectedIds.has(node.id))
                nodeEl.addClass("is-selected");
            if (this.selectedIds.size > 1 && this.selectedIds.has(node.id))
                nodeEl.addClass("is-multi-selected");
            if (this.searchQuery && (0, model_1.nodeSearchText)(node).includes(this.searchQuery))
                nodeEl.addClass("is-search-match");
            if (node.task)
                nodeEl.addClass(`task-${node.task}`);
            const isRoot = position.depth === 0;
            const bold = (_k = (_j = (_h = node.style) === null || _h === void 0 ? void 0 : _h.bold) !== null && _j !== void 0 ? _j : appearance.bold) !== null && _k !== void 0 ? _k : false;
            const italic = (_o = (_m = (_l = node.style) === null || _l === void 0 ? void 0 : _l.italic) !== null && _m !== void 0 ? _m : appearance.italic) !== null && _o !== void 0 ? _o : false;
            const underline = (_r = (_q = (_p = node.style) === null || _p === void 0 ? void 0 : _p.underline) !== null && _q !== void 0 ? _q : appearance.underline) !== null && _r !== void 0 ? _r : false;
            if (bold)
                nodeEl.addClass("is-bold");
            if (italic)
                nodeEl.addClass("is-italic");
            if (underline)
                nodeEl.addClass("is-underlined");
            if (node.note)
                nodeEl.setAttr("title", node.note);
            const branchColor = branchColorMap.get(node.id);
            if ((_s = node.style) === null || _s === void 0 ? void 0 : _s.color)
                nodeEl.style.backgroundColor = node.style.color;
            else if (isRoot && appearance.rootColor)
                nodeEl.style.backgroundColor = appearance.rootColor;
            else if (!isRoot && branchColor && appearance.nodeVisualStyle === "branch") {
                nodeEl.style.backgroundColor = `color-mix(in srgb, ${branchColor} 16%, ${(_t = appearance.nodeColor) !== null && _t !== void 0 ? _t : "#ffffff"})`;
            }
            else if (!isRoot && appearance.nodeColor)
                nodeEl.style.backgroundColor = appearance.nodeColor;
            if ((_u = node.style) === null || _u === void 0 ? void 0 : _u.textColor)
                nodeEl.style.color = node.style.textColor;
            else if (isRoot && appearance.rootTextColor)
                nodeEl.style.color = appearance.rootTextColor;
            else if (!isRoot && appearance.textColor)
                nodeEl.style.color = appearance.textColor;
            if ((_v = node.style) === null || _v === void 0 ? void 0 : _v.borderColor)
                nodeEl.style.borderColor = node.style.borderColor;
            else if (!isRoot && branchColor && appearance.nodeVisualStyle === "branch") {
                nodeEl.style.borderColor = `color-mix(in srgb, ${branchColor} 38%, transparent)`;
            }
            else if (!isRoot && branchColor)
                nodeEl.style.borderColor = branchColor;
            else if (!isRoot && appearance.nodeBorderColor)
                nodeEl.style.borderColor = appearance.nodeBorderColor;
            nodeEl.style.borderWidth = `${(_y = (_x = (_w = node.style) === null || _w === void 0 ? void 0 : _w.borderWidth) !== null && _x !== void 0 ? _x : appearance.nodeBorderWidth) !== null && _y !== void 0 ? _y : (isRoot ? 2 : 1)}px`;
            const content = nodeEl.createDiv({ cls: "mmc-node-content" });
            const blocks = (0, model_1.nodeContentBlocks)(node);
            const hasTextBlock = blocks.some((block) => block.type === "text" && block.text.trim());
            if ((node.task || node.icon) && !hasTextBlock) {
                const meta = content.createDiv({ cls: "mmc-node-main mmc-node-meta-only" });
                if (node.task) {
                    const task = meta.createSpan({ cls: `mmc-task-icon task-${node.task}`, text: node.task === "done" ? "✓" : node.task === "doing" ? "◐" : "○" });
                    task.setAttr("aria-label", node.task === "done" ? "已完成" : node.task === "doing" ? "进行中" : "待办");
                }
                if (node.icon)
                    meta.createSpan({ cls: "mmc-node-icon", text: node.icon });
            }
            let prefixRendered = false;
            for (const block of blocks) {
                if (block.type === "image") {
                    const wrap = content.createDiv({ cls: "mmc-node-image-block" });
                    const image = wrap.createEl("img", { cls: "mmc-node-image is-loading", attr: { alt: (_z = block.alt) !== null && _z !== void 0 ? _z : ((0, model_1.nodePlainText)(node) || "图片") } });
                    const candidates = this.options.imageFailoverEnabled
                        ? (0, model_1.imageSourceCandidates)(block, this.options.imageFailoverUseLocalFallback)
                        : (0, model_1.imageSourceCandidates)(block, false).slice(0, 1);
                    let activeResolved = null;
                    let attemptToken = 0;
                    let attemptTimer = null;
                    const clearAttemptTimer = () => {
                        if (attemptTimer === null)
                            return;
                        window.clearTimeout(attemptTimer);
                        this.imageLoadTimers.delete(attemptTimer);
                        attemptTimer = null;
                    };
                    const markRemoteFailure = (source) => {
                        var _a, _b;
                        const remote = (_a = block.remoteSources) === null || _a === void 0 ? void 0 : _a.find((item) => item.url === source);
                        if (!remote)
                            return;
                        remote.lastFailureAt = new Date().toISOString();
                        remote.failureCount = Math.min(1000000, ((_b = remote.failureCount) !== null && _b !== void 0 ? _b : 0) + 1);
                    };
                    const tryCandidate = (index) => {
                        clearAttemptTimer();
                        const candidate = candidates[index];
                        attemptToken += 1;
                        const token = attemptToken;
                        if (!candidate) {
                            activeResolved = null;
                            image.removeAttribute("src");
                            image.removeClass("is-loading");
                            image.addClass("is-unresolved");
                            image.setAttr("title", "所有图片镜像均不可用");
                            this.callbacks.onChange(this.getDocument());
                            this.markSaving();
                            return;
                        }
                        const resolved = this.callbacks.resolveImage(candidate.source);
                        if (!resolved) {
                            markRemoteFailure(candidate.source);
                            tryCandidate(index + 1);
                            return;
                        }
                        const probe = new Image();
                        const fail = () => {
                            if (token !== attemptToken)
                                return;
                            clearAttemptTimer();
                            markRemoteFailure(candidate.source);
                            if (this.options.imageFailoverEnabled)
                                tryCandidate(index + 1);
                            else {
                                image.removeClass("is-loading");
                                image.addClass("is-unresolved");
                                image.setAttr("title", `图片加载失败：${candidate.source}`);
                            }
                        };
                        probe.onload = () => {
                            var _a, _b;
                            if (token !== attemptToken || probe.naturalWidth <= 0)
                                return;
                            clearAttemptTimer();
                            activeResolved = resolved;
                            image.src = resolved;
                            image.removeClass("is-loading");
                            image.removeClass("is-unresolved");
                            image.setAttr("title", index === 0 ? "点击放大图片" : `已自动切换到：${candidate.label}`);
                            const switched = candidate.source !== block.source;
                            const remote = (_a = block.remoteSources) === null || _a === void 0 ? void 0 : _a.find((item) => item.url === candidate.source);
                            if (remote)
                                remote.lastSuccessAt = new Date().toISOString();
                            if (!switched)
                                return;
                            const previous = (_b = block.remoteSources) === null || _b === void 0 ? void 0 : _b.find((item) => item.url === block.source);
                            block.source = candidate.source;
                            (0, model_1.syncNodeLegacyFields)(node);
                            this.callbacks.onChange(this.getDocument());
                            this.markSaving();
                            const previousLabel = (previous === null || previous === void 0 ? void 0 : previous.hostName) || "当前图床";
                            new obsidian_1.Notice(`图片地址失效，已从 ${previousLabel} 自动切换到 ${candidate.label}`, 6000);
                        };
                        probe.onerror = fail;
                        const timeoutMs = Math.max(2, Math.min(30, this.options.imageFailoverTimeoutSeconds)) * 1000;
                        attemptTimer = window.setTimeout(fail, timeoutMs);
                        this.imageLoadTimers.add(attemptTimer);
                        probe.src = resolved;
                    };
                    image.addEventListener("click", (event) => {
                        var _a;
                        event.stopPropagation();
                        if (activeResolved)
                            new editor_modals_1.ImagePreviewModal(this.app, activeResolved, (_a = block.alt) !== null && _a !== void 0 ? _a : "图片预览", (0, model_1.imageSourceCandidates)(block, true), (source) => this.callbacks.resolveImage(source)).open();
                    });
                    tryCandidate(0);
                    continue;
                }
                if (!block.text.trim())
                    continue;
                const main = content.createDiv({ cls: "mmc-node-main mmc-node-text-block" });
                if (!prefixRendered && node.task) {
                    const task = main.createSpan({ cls: `mmc-task-icon task-${node.task}`, text: node.task === "done" ? "✓" : node.task === "doing" ? "◐" : "○" });
                    task.setAttr("aria-label", node.task === "done" ? "已完成" : node.task === "doing" ? "进行中" : "待办");
                }
                if (!prefixRendered && node.icon)
                    main.createSpan({ cls: "mmc-node-icon", text: node.icon });
                const isSubmapTitle = Boolean(node.submap) && !prefixRendered;
                prefixRendered = true;
                const textEl = main.createDiv({ cls: `mmc-node-text${isSubmapTitle ? " is-submap-link" : ""}` });
                (0, rich_text_dom_1.renderRichTextRuns)(textEl, block.richText, block.text);
                textEl.style.fontSize = `${(_2 = (_1 = (_0 = node.style) === null || _0 === void 0 ? void 0 : _0.fontSize) !== null && _1 !== void 0 ? _1 : appearance.fontSize) !== null && _2 !== void 0 ? _2 : 14}px`;
                textEl.setAttr("aria-label", isSubmapTitle ? `打开子导图：${block.text}` : block.text);
                if (isSubmapTitle) {
                    const indicator = textEl.createSpan({ cls: "mmc-submap-inline-indicator", attr: { "aria-hidden": "true" } });
                    (0, obsidian_1.setIcon)(indicator, "arrow-up-right");
                    textEl.setAttr("title", `打开子导图：${(_3 = node.submap.title) !== null && _3 !== void 0 ? _3 : node.submap.path}`);
                }
            }
            if (node.submap && !hasTextBlock) {
                const submapIcon = nodeEl.createEl("button", {
                    cls: "mmc-submap-corner-link",
                    attr: {
                        "aria-label": `打开子导图：${(_4 = node.submap.title) !== null && _4 !== void 0 ? _4 : node.submap.path}`,
                        title: `打开子导图：${(_5 = node.submap.title) !== null && _5 !== void 0 ? _5 : node.submap.path}`
                    }
                });
                (0, obsidian_1.setIcon)(submapIcon, "arrow-up-right");
                submapIcon.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void this.callbacks.onOpenMindMap(node.submap.path);
                });
            }
            if (node.submap) {
                nodeEl.setAttr("role", "link");
                nodeEl.setAttr("tabindex", "0");
                nodeEl.setAttr("aria-label", `打开子导图：${(_6 = node.submap.title) !== null && _6 !== void 0 ? _6 : node.submap.path}`);
                nodeEl.setAttr("title", `打开子导图：${(_7 = node.submap.title) !== null && _7 !== void 0 ? _7 : node.submap.path}；右键可编辑节点`);
            }
            if (node.table)
                this.renderNodeTable(content, node);
            if (node.code)
                this.renderNodeCode(content, node);
            if ((_8 = node.tags) === null || _8 === void 0 ? void 0 : _8.length) {
                const tags = content.createDiv({ cls: "mmc-node-tags" });
                node.tags.slice(0, 4).forEach((tag) => tags.createSpan({ cls: "mmc-node-tag", text: `#${tag}` }));
            }
            if (this.options.showTaskProgress && node.children.length) {
                const progress = (0, model_1.getTaskProgress)(node);
                if (progress.total) {
                    const percent = Math.round((progress.done / progress.total) * 100);
                    const progressEl = nodeEl.createDiv({ cls: "mmc-task-progress", attr: { title: `${progress.done}/${progress.total} 个任务已完成` } });
                    progressEl.createDiv({ cls: "mmc-task-progress-bar", attr: { style: `width:${percent}%` } });
                    progressEl.createSpan({ text: `${percent}%` });
                }
            }
            if (node.children.length) {
                const fold = nodeEl.createEl("button", { cls: "mmc-fold-button", attr: { "aria-label": node.collapsed ? "展开" : "收起" } });
                fold.setText(node.collapsed ? `+${node.children.length}` : "−");
                fold.addEventListener("click", (event) => {
                    event.stopPropagation();
                    this.selectNode(node.id);
                    this.toggleCollapse();
                });
            }
            const link = this.getNodeLink(node);
            if (link) {
                const linkButton = nodeEl.createEl("button", { cls: "mmc-node-link", attr: { "aria-label": `打开 ${link}` } });
                (0, obsidian_1.setIcon)(linkButton, "external-link");
                linkButton.addEventListener("click", (event) => {
                    event.stopPropagation();
                    void this.callbacks.onOpenLink(link);
                });
            }
            if (!this.readOnly) {
                const resizeHandle = nodeEl.createDiv({
                    cls: "mmc-node-resize-handle",
                    attr: { role: "separator", tabindex: "0", "aria-label": "拖动调整节点宽度和最小高度", title: "拖动调整节点大小；双击恢复自动大小" }
                });
                resizeHandle.setAttr("draggable", "false");
                resizeHandle.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); });
                resizeHandle.addEventListener("dblclick", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.mutate(() => {
                        var _a;
                        const next = { ...((_a = node.style) !== null && _a !== void 0 ? _a : {}), width: undefined, minHeight: undefined };
                        node.style = Object.values(next).some((value) => value !== undefined) ? next : undefined;
                    });
                });
                resizeHandle.addEventListener("pointerdown", (event) => {
                    if (event.button !== 0)
                        return;
                    if (this.resizeModifier === "ctrl" && !event.ctrlKey && !event.metaKey)
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    const startX = event.clientX;
                    const startY = event.clientY;
                    const startWidth = position.width;
                    const startHeight = position.height;
                    let previewWidth = startWidth;
                    let previewHeight = startHeight;
                    resizeHandle.setPointerCapture(event.pointerId);
                    nodeEl.addClass("is-resizing");
                    const move = (moveEvent) => {
                        const scale = Math.max(.1, this.zoom);
                        previewWidth = Math.min(900, Math.max(100, startWidth + (moveEvent.clientX - startX) / scale));
                        previewHeight = Math.min(600, Math.max(36, startHeight + (moveEvent.clientY - startY) / scale));
                        nodeEl.style.width = `${Math.round(previewWidth)}px`;
                        nodeEl.style.minHeight = `${Math.round(previewHeight)}px`;
                    };
                    const finish = (upEvent) => {
                        resizeHandle.removeEventListener("pointermove", move);
                        resizeHandle.removeEventListener("pointerup", finish);
                        resizeHandle.removeEventListener("pointercancel", finish);
                        if (resizeHandle.hasPointerCapture(upEvent.pointerId))
                            resizeHandle.releasePointerCapture(upEvent.pointerId);
                        nodeEl.removeClass("is-resizing");
                        this.mutate(() => {
                            var _a;
                            node.style = {
                                ...((_a = node.style) !== null && _a !== void 0 ? _a : {}),
                                width: Math.round(previewWidth),
                                minHeight: Math.round(previewHeight)
                            };
                        });
                    };
                    resizeHandle.addEventListener("pointermove", move);
                    resizeHandle.addEventListener("pointerup", finish);
                    resizeHandle.addEventListener("pointercancel", finish);
                });
            }
            nodeEl.addEventListener("click", (event) => {
                event.stopPropagation();
                if (event.shiftKey) {
                    this.toggleNodeSelection(node.id);
                    return;
                }
                this.selectNode(node.id);
                if (node.submap)
                    void this.callbacks.onOpenMindMap(node.submap.path);
            });
            if (node.submap) {
                nodeEl.addEventListener("keydown", (event) => {
                    if (event.key !== "Enter" && event.key !== " ")
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                    this.selectNode(node.id);
                    void this.callbacks.onOpenMindMap(node.submap.path);
                });
            }
            nodeEl.addEventListener("dblclick", (event) => {
                event.stopPropagation();
                this.selectNode(node.id);
                if (node.submap) {
                    void this.callbacks.onOpenMindMap(node.submap.path);
                }
                else if (!this.readOnly)
                    this.beginInlineEdit(node.id);
            });
            // Quad-click (four rapid clicks) opens the full node edit modal
            let lastDblClick = 0;
            nodeEl.addEventListener("dblclick", (quadEvent) => {
                const now = Date.now();
                if (now - lastDblClick < 500 && lastDblClick > 0) {
                    lastDblClick = 0;
                    if (!this.readOnly)
                        this.editSelected();
                }
                else {
                    lastDblClick = now;
                }
            });
            nodeEl.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.selectNode(node.id);
                this.openContextMenu(event);
            });
            nodeEl.addEventListener("dragstart", (event) => {
                var _a, _b;
                if (this.readOnly) {
                    event.preventDefault();
                    return;
                }
                this.draggingId = node.id;
                (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", node.id);
                if (event.dataTransfer)
                    event.dataTransfer.effectAllowed = "move";
                const draggingIds = this.selectedIds.has(node.id) ? this.selectedIds : new Set([node.id]);
                for (const draggingId of draggingIds) {
                    (_b = this.nodesLayerEl.querySelector(`[data-node-id="${CSS.escape(draggingId)}"]`)) === null || _b === void 0 ? void 0 : _b.addClass("is-dragging");
                }
            });
            nodeEl.addEventListener("dragover", (event) => {
                if (!this.canMoveNode(this.draggingId, node.id))
                    return;
                event.preventDefault();
                if (event.dataTransfer)
                    event.dataTransfer.dropEffect = "move";
                const position = this.dropPositionForEvent(event, nodeEl, node.id);
                this.dragDropPosition = position;
                this.clearDropIndicators();
                const indicator = position === "child" && (0, drag_drop_1.isRightChildZone)(event, nodeEl.getBoundingClientRect())
                    ? "is-drop-child-right"
                    : `is-drop-${position}`;
                nodeEl.addClasses(["is-drop-target", indicator]);
                this.showDropPreview(node.id, position);
            });
            nodeEl.addEventListener("dragleave", (event) => {
                if (event.relatedTarget instanceof Node && nodeEl.contains(event.relatedTarget))
                    return;
                nodeEl.removeClasses(["is-drop-target", "is-drop-before", "is-drop-child", "is-drop-child-right", "is-drop-after"]);
                this.clearDropPreview();
            });
            nodeEl.addEventListener("drop", (event) => {
                var _a, _b, _c, _d;
                event.preventDefault();
                const position = (_a = this.dragDropPosition) !== null && _a !== void 0 ? _a : this.dropPositionForEvent(event, nodeEl, node.id);
                this.clearDropIndicators();
                this.clearDropPreview();
                const draggedId = (_d = (_b = this.draggingId) !== null && _b !== void 0 ? _b : (_c = event.dataTransfer) === null || _c === void 0 ? void 0 : _c.getData("text/plain")) !== null && _d !== void 0 ? _d : null;
                if (draggedId)
                    this.moveNode(draggedId, node.id, position);
            });
            nodeEl.addEventListener("dragend", () => {
                this.draggingId = null;
                this.dragDropPosition = null;
                this.clearDropIndicators();
                this.clearDropPreview();
                this.nodesLayerEl.querySelectorAll(".is-dragging").forEach((element) => element.removeClass("is-dragging"));
            });
            (_9 = this.resizeObserver) === null || _9 === void 0 ? void 0 : _9.observe(nodeEl);
        }
        this.scheduleMeasuredMindMapLayout();
        this.applyTransform();
    }
    /** 使用当前布局坐标重新绘制全部连接线。 */
    renderMindMapEdges(appearance, branchColorMap) {
        var _a, _b;
        while (this.edgesSvg.firstChild)
            this.edgesSvg.removeChild(this.edgesSvg.firstChild);
        const maxDepth = Math.max(1, ...this.layout.nodes.map((position) => position.depth));
        for (const position of this.layout.nodes) {
            if (!position.parentId)
                continue;
            const parent = this.layout.byId.get(position.parentId);
            if (!parent)
                continue;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", appearance.nodeVisualStyle === "branch"
                ? (0, layout_1.roundedElbowEdgePath)(parent, position)
                : (0, layout_1.edgePath)(parent, position, (_a = appearance.edgeStyle) !== null && _a !== void 0 ? _a : "curved"));
            path.setAttribute("class", `mmc-edge depth-${Math.min(position.depth, 6)}`);
            const branchColor = branchColorMap.get(position.node.id);
            if ((_b = position.node.style) === null || _b === void 0 ? void 0 : _b.color)
                path.style.stroke = position.node.style.color;
            else if (branchColor)
                path.style.stroke = branchColor;
            const edgeWidth = (0, layout_1.edgeWidthForDepth)(appearance, position.depth, maxDepth);
            path.setAttribute("stroke-width", String(edgeWidth));
            path.style.setProperty("--mmc-current-edge-width", `${edgeWidth}px`);
            path.style.setProperty("stroke-width", `${edgeWidth}px`, "important");
            this.edgesSvg.appendChild(path);
        }
    }
    /** 合并同一帧内的节点尺寸变化，避免表格和图片加载触发重复布局。 */
    scheduleMeasuredMindMapLayout() {
        if (this.measuredLayoutFrame !== null || this.currentMode !== "mindmap")
            return;
        this.measuredLayoutFrame = window.requestAnimationFrame(() => {
            this.measuredLayoutFrame = null;
            this.applyMeasuredMindMapLayout();
        });
    }
    /**
     * 使用浏览器实际渲染尺寸重新执行碰撞避让。
     *
     * 表格、代码和图片节点的真实高度可能大于模型估算值，因此必须在 DOM
     * 完成排版后更新包围盒、节点坐标、连接线和画布边界。
     */
    applyMeasuredMindMapLayout() {
        var _a, _b;
        if (this.currentMode !== "mindmap" || !this.nodesLayerEl.isConnected)
            return;
        const appearance = this.getAppearance();
        const measured = new Map();
        this.nodesLayerEl.querySelectorAll(".mmc-node[data-node-id]").forEach((element) => {
            const id = element.dataset.nodeId;
            if (!id)
                return;
            measured.set(id, {
                width: Math.max(1, element.offsetWidth),
                height: Math.max(1, element.offsetHeight)
            });
        });
        if (!measured.size)
            return;
        const next = (0, layout_1.computeLayout)(this.document.root, this.document.layout, (_a = appearance.fontSize) !== null && _a !== void 0 ? _a : 14, (_b = appearance.nodeVisualStyle) !== null && _b !== void 0 ? _b : "card", appearance);
        for (const position of next.nodes) {
            const dimensions = measured.get(position.node.id);
            if (!dimensions)
                continue;
            position.width = dimensions.width;
            position.height = dimensions.height;
        }
        (0, collision_layout_1.resolveLayoutCollisions)(next.nodes, appearance.nodeVisualStyle === "branch" ? 18 : 24);
        next.byId = new Map(next.nodes.map((position) => [position.node.id, position]));
        next.minX = Math.min(...next.nodes.map((position) => position.x - position.width / 2));
        next.maxX = Math.max(...next.nodes.map((position) => position.x + position.width / 2));
        next.minY = Math.min(...next.nodes.map((position) => position.y - position.height / 2));
        next.maxY = Math.max(...next.nodes.map((position) => position.y + position.height / 2));
        this.layout = next;
        for (const position of this.layout.nodes) {
            const element = this.nodesLayerEl.querySelector(`.mmc-node[data-node-id="${CSS.escape(position.node.id)}"]`);
            if (!element)
                continue;
            element.style.left = `${position.x}px`;
            element.style.top = `${position.y}px`;
        }
        const branchColorMap = appearance.colorfulBranches ? (0, layout_1.buildBranchColorMap)(this.document.root, appearance.branchColors) : new Map();
        this.renderMindMapEdges(appearance, branchColorMap);
    }
    /**
     * 应用transform，并保持模型、界面和持久化状态的一致性。
     */
    applyTransform() {
        const rect = this.viewportEl.getBoundingClientRect();
        this.sceneEl.style.transform = `translate(${rect.width / 2 + this.panX}px, ${rect.height / 2 + this.panY}px) scale(${this.zoom})`;
        this.rootEl.style.setProperty("--mmc-zoom", String(this.zoom));
        if (this.zoomStatusEl)
            this.zoomStatusEl.value = `${Math.round(this.zoom * 100)}%`;
    }
    /**
     * Selects every non-root node so bulk operations never affect the protected main node.
     */
    selectAllNodesExceptRoot() {
        var _a;
        const ids = (0, model_1.flattenNodes)(this.document.root)
            .filter((node) => node.id !== this.document.root.id)
            .map((node) => node.id);
        this.selectedIds.clear();
        for (const id of ids)
            this.selectedIds.add(id);
        this.selectedId = (_a = ids.at(-1)) !== null && _a !== void 0 ? _a : "";
        this.applySelectionClasses();
    }
    /**
     * Selects one node and clears any prior multi-selection.
     *
     * @param id Stable identifier of the node to select, or null to clear the selection.
     */
    selectNode(id) {
        this.selectedIds.clear();
        this.selectedId = id !== null && id !== void 0 ? id : "";
        if (id)
            this.selectedIds.add(id);
        this.applySelectionClasses();
    }
    /**
     * Adds or removes one node from the current multi-selection.
     *
     * @param id Node identifier.
     */
    toggleNodeSelection(id) {
        var _a;
        if (id === this.document.root.id)
            return;
        if (this.selectedIds.has(id))
            this.selectedIds.delete(id);
        else
            this.selectedIds.add(id);
        this.selectedId = (_a = Array.from(this.selectedIds).at(-1)) !== null && _a !== void 0 ? _a : "";
        this.applySelectionClasses();
    }
    /**
     * Synchronizes selection classes across all editor views.
     */
    applySelectionClasses() {
        this.rootEl.querySelectorAll(".is-selected, .is-multi-selected")
            .forEach((element) => element.removeClasses(["is-selected", "is-multi-selected"]));
        for (const id of this.selectedIds) {
            const multi = this.selectedIds.size > 1;
            for (const scope of [this.nodesLayerEl, this.outlineEl, this.articleEl]) {
                const element = scope.querySelector(`[data-node-id="${CSS.escape(id)}"]`);
                element === null || element === void 0 ? void 0 : element.addClass("is-selected");
                if (multi)
                    element === null || element === void 0 ? void 0 : element.addClass("is-multi-selected");
            }
        }
    }
    /**
     * 执行“selected node”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    selectedNode() {
        return this.selectedId ? (0, model_1.findNode)(this.document.root, this.selectedId) : null;
    }
    /**
     * 创建configured node，并保持模型、界面和持久化状态的一致性。
     *
     * @param text 要显示、搜索、解析或写入的文本。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    createConfiguredNode(text = "新节点") {
        const node = (0, model_1.createNode)(text);
        if (this.options.defaultNodeShape !== "rounded")
            node.style = { shape: this.options.defaultNodeShape };
        return node;
    }
    /**
     * 判断键盘事件是否匹配用户配置的组合键。
     *
     * @param event 当前键盘事件。
     * @param shortcut 形如 Ctrl+B 或 Ctrl+Shift+C 的快捷键文本。
     * @returns 当前事件是否与快捷键一致。
     */
    shortcutMatches(event, shortcut) {
        const parts = shortcut.toLowerCase().split("+").map((part) => part.trim()).filter(Boolean);
        if (!parts.length)
            return false;
        const wantsMod = parts.includes("ctrl") || parts.includes("cmd") || parts.includes("mod");
        return event.key.toLowerCase() === parts.at(-1)
            && (event.ctrlKey || event.metaKey) === wantsMod
            && event.shiftKey === parts.includes("shift")
            && event.altKey === parts.includes("alt");
    }
    /** 在节点本体中启动轻量富文本输入。 */
    beginInlineEdit(nodeId) {
        var _a, _b;
        if (this.readOnly)
            return;
        const node = (0, model_1.findNode)(this.document.root, nodeId);
        if (!node)
            return;
        this.selectNode(nodeId);
        this.inlineEditingId = nodeId;
        if (this.options.nodeEditorPosition === "right")
            this.editSelected();
        if (this.currentMode !== "mindmap") {
            const scope = this.currentMode === "outline" ? this.outlineEl : this.articleEl;
            (_a = scope.querySelector(`[data-node-id="${CSS.escape(nodeId)}"] [contenteditable="true"]`)) === null || _a === void 0 ? void 0 : _a.focus();
            return;
        }
        const nodeEl = this.nodesLayerEl.querySelector(`.mmc-node[data-node-id="${CSS.escape(nodeId)}"]`);
        const content = nodeEl === null || nodeEl === void 0 ? void 0 : nodeEl.querySelector(".mmc-node-content");
        if (!nodeEl || !content)
            return;
        let editor = content.querySelector(".mmc-node-text");
        if (!editor)
            editor = content.createDiv({ cls: "mmc-node-main mmc-node-text-block" }).createDiv({ cls: "mmc-node-text" });
        editor.contentEditable = "true";
        editor.spellcheck = true;
        editor.addClass("is-inline-editing");
        editor.setAttr("role", "textbox");
        editor.setAttr("aria-label", "输入节点文字");
        const firstText = (0, model_1.nodeContentBlocks)(node).find((block) => block.type === "text");
        (0, rich_text_dom_1.renderRichTextRuns)(editor, firstText === null || firstText === void 0 ? void 0 : firstText.richText, (_b = firstText === null || firstText === void 0 ? void 0 : firstText.text) !== null && _b !== void 0 ? _b : (0, model_1.nodePlainText)(node), false);
        let historyCaptured = false;
        const save = () => {
            const values = (0, rich_text_dom_1.readRichTextEditor)(editor);
            if (!historyCaptured) {
                this.history.capture(this.document);
                historyCaptured = true;
            }
            const blocks = (0, model_1.nodeContentBlocks)(node);
            let block = blocks.find((item) => item.type === "text");
            if (!block) {
                block = { id: (0, model_1.newId)(), type: "text", text: "" };
                blocks.unshift(block);
            }
            block.text = values.text;
            block.richText = values.richText;
            node.content = blocks;
            (0, model_1.syncNodeLegacyFields)(node);
            if (node.id === this.document.root.id && values.text)
                this.document.title = values.text;
            this.callbacks.onChange(this.getDocument());
            this.markSaving();
            this.viewportEl.dispatchEvent(new CustomEvent("mms-inline-node-change", { detail: { nodeId } }));
        };
        let savedSelection = null;
        const rememberSelection = () => {
            const selection = window.getSelection();
            if (!(selection === null || selection === void 0 ? void 0 : selection.rangeCount))
                return null;
            const range = selection.getRangeAt(0);
            if (!editor.contains(range.commonAncestorContainer))
                return null;
            const before = range.cloneRange();
            before.selectNodeContents(editor);
            before.setEnd(range.startContainer, range.startOffset);
            savedSelection = { start: before.toString().length, end: before.toString().length + range.toString().length };
            return savedSelection;
        };
        const restoreSelection = (selected) => {
            var _a, _b;
            const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
            let node = walker.nextNode();
            let offset = 0;
            let startNode = null;
            let endNode = null;
            let startOffset = 0;
            let endOffset = 0;
            while (node) {
                const length = (_b = (_a = node.textContent) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                if (!startNode && selected.start <= offset + length) {
                    startNode = node;
                    startOffset = Math.max(0, selected.start - offset);
                }
                if (!endNode && selected.end <= offset + length) {
                    endNode = node;
                    endOffset = Math.max(0, selected.end - offset);
                    break;
                }
                offset += length;
                node = walker.nextNode();
            }
            if (!startNode || !endNode)
                return;
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            const selection = window.getSelection();
            selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
            selection === null || selection === void 0 ? void 0 : selection.addRange(range);
        };
        const applyStyle = (patch) => {
            var _a;
            const selected = (_a = rememberSelection()) !== null && _a !== void 0 ? _a : savedSelection;
            if (!selected || selected.start === selected.end) {
                new obsidian_1.Notice("请先选择需要设置格式的文字");
                return;
            }
            save();
            const blocks = (0, model_1.nodeContentBlocks)(node);
            const block = blocks.find((item) => item.type === "text");
            if (!block)
                return;
            const key = Object.keys(patch)[0];
            if (key !== "color") {
                const styles = (0, model_1.richTextCharacterStyles)(block.richText, block.text);
                const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
                patch = { [key]: !enabled };
            }
            block.richText = (0, model_1.applyRichTextStyleRange)(block.text, block.richText, selected.start, selected.end, patch);
            (0, rich_text_dom_1.renderRichTextRuns)(editor, block.richText, block.text, false);
            save();
            editor.focus();
            restoreSelection(selected);
        };
        const formatBar = nodeEl.createDiv({ cls: "mmc-inline-format-bar is-hidden" });
        const formatButton = (label, title, style) => {
            const button = formatBar.createEl("button", { text: label, attr: { type: "button", title, "aria-label": title } });
            button.addClass(`is-${style}`);
            button.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                event.stopPropagation();
            });
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                applyStyle({ [style]: true });
            });
        };
        formatButton("B", `加粗（${this.options.richTextShortcuts.bold}）`, "bold");
        formatButton("I", `斜体（${this.options.richTextShortcuts.italic}）`, "italic");
        formatButton("U", `下划线（${this.options.richTextShortcuts.underline}）`, "underline");
        const colorBtn = formatBar.createEl("button", { cls: "mmc-color-btn", attr: { type: "button", title: "文字颜色" } });
        colorBtn.createSpan({ text: "A" });
        colorBtn.style.textDecorationColor = this.lastRichTextColor;
        const popover = formatBar.createDiv({ cls: "mms-color-popover is-hidden" });
        const COMMON_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#1f2937"];
        for (const swatch of COMMON_COLORS) {
            const dot = popover.createEl("button", { attr: { type: "button", "data-color": swatch } });
            dot.style.backgroundColor = swatch;
            dot.addEventListener("click", () => {
                this.lastRichTextColor = swatch;
                colorBtn.style.textDecorationColor = swatch;
                applyStyle({ color: swatch });
                popover.addClass("is-hidden");
                editor.focus();
            });
        }
        const customRow = popover.createDiv({ cls: "mms-color-popover-row" });
        const lastDot = customRow.createEl("button", { cls: "mms-color-last", attr: { type: "button", title: "上次颜色" } });
        lastDot.style.backgroundColor = this.lastRichTextColor;
        lastDot.addEventListener("click", () => {
            applyStyle({ color: this.lastRichTextColor });
            popover.addClass("is-hidden");
            editor.focus();
        });
        const nativeInput = customRow.createEl("input", { attr: { type: "color", "aria-label": "自定义" } });
        nativeInput.value = this.lastRichTextColor;
        nativeInput.addEventListener("input", () => {
            this.lastRichTextColor = nativeInput.value;
            colorBtn.style.textDecorationColor = nativeInput.value;
            lastDot.style.backgroundColor = nativeInput.value;
            applyStyle({ color: nativeInput.value });
            popover.addClass("is-hidden");
            editor.focus();
        });
        colorBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            rememberSelection();
            popover.toggleClass("is-hidden", !popover.hasClass("is-hidden"));
        });
        document.addEventListener("pointerdown", (closeEvent) => {
            if (!formatBar.contains(closeEvent.target) && !popover.contains(closeEvent.target)) {
                popover.addClass("is-hidden");
            }
        });
        const updateFormatBar = () => {
            const selected = rememberSelection();
            formatBar.toggleClass("is-hidden", !selected || selected.start === selected.end);
        };
        editor.addEventListener("mouseup", updateFormatBar);
        editor.addEventListener("keyup", updateFormatBar);
        const selectionChange = () => {
            if (document.activeElement === editor)
                updateFormatBar();
        };
        document.addEventListener("selectionchange", selectionChange);
        editor.addEventListener("input", save);
        let lastHandledShortcut = "";
        const handleFormatShortcut = (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                save();
                editor.blur();
                return true;
            }
            const command = this.shortcutMatches(event, this.options.richTextShortcuts.bold) ? "bold"
                : this.shortcutMatches(event, this.options.richTextShortcuts.italic) ? "italic"
                    : this.shortcutMatches(event, this.options.richTextShortcuts.underline) ? "underline" : null;
            if (command) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                lastHandledShortcut = `${command}:${event.timeStamp}`;
                applyStyle({ [command]: true });
                return true;
            }
            else if (this.shortcutMatches(event, this.options.richTextShortcuts.color)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                lastHandledShortcut = `color:${event.timeStamp}`;
                rememberSelection();
                applyStyle({ color: this.lastRichTextColor });
                return true;
            }
            else if (event.key === "Escape") {
                event.preventDefault();
                editor.blur();
            }
            return false;
        };
        editor.addEventListener("keydown", handleFormatShortcut, true);
        const windowShortcut = (event) => {
            if (document.activeElement === editor)
                handleFormatShortcut(event);
        };
        window.addEventListener("keydown", windowShortcut, true);
        const windowShortcutFallback = (event) => {
            var _a;
            if (document.activeElement !== editor)
                return;
            const handledAt = Number((_a = lastHandledShortcut.split(":").at(-1)) !== null && _a !== void 0 ? _a : 0);
            if (handledAt && event.timeStamp - handledAt < 1000)
                return;
            handleFormatShortcut(event);
        };
        window.addEventListener("keyup", windowShortcutFallback, true);
        editor.addEventListener("beforeinput", (event) => {
            const command = event.inputType === "formatBold" ? "bold"
                : event.inputType === "formatItalic" ? "italic"
                    : event.inputType === "formatUnderline" ? "underline" : null;
            if (!command || lastHandledShortcut.startsWith(`${command}:`))
                return;
            event.preventDefault();
            applyStyle({ [command]: true });
        });
        let editingFinished = false;
        editor.addEventListener("blur", (event) => {
            var _a;
            const related = event.relatedTarget;
            if (editingFinished || (related instanceof Node && (formatBar.contains(related)
                || ((_a = document.querySelector(".mms-node-editor-right")) === null || _a === void 0 ? void 0 : _a.contains(related)))))
                return;
            editingFinished = true;
            this.inlineEditingId = null;
            window.removeEventListener("keydown", windowShortcut, true);
            window.removeEventListener("keyup", windowShortcutFallback, true);
            document.removeEventListener("selectionchange", selectionChange);
            save();
            formatBar.remove();
            this.render();
        });
        const focusAtEnd = () => {
            if (!document.body.contains(editor))
                return;
            editor.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
            selection === null || selection === void 0 ? void 0 : selection.addRange(range);
        };
        focusAtEnd();
        if (this.options.nodeEditorPosition === "right") {
            window.requestAnimationFrame(focusAtEnd);
            window.setTimeout(focusAtEnd, 50);
        }
    }
    /**
     * 添加child，并保持模型、界面和持久化状态的一致性。
     */
    addChild() {
        var _a;
        if (!this.ensureEditable())
            return;
        const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
        const node = this.createConfiguredNode("");
        this.mutate(() => {
            (0, node_actions_1.appendChild)(selected, node);
            this.selectedId = node.id;
        });
        window.setTimeout(() => this.beginInlineEdit(node.id), 0);
    }
    /**
     * 添加sibling，并保持模型、界面和持久化状态的一致性。
     */
    addSibling() {
        if (!this.ensureEditable())
            return;
        const selected = this.selectedNode();
        if (!selected || selected.id === this.document.root.id) {
            this.addChild();
            return;
        }
        const parent = (0, model_1.findParent)(this.document.root, selected.id);
        if (!parent)
            return;
        const node = this.createConfiguredNode("");
        this.mutate(() => {
            (0, node_actions_1.insertSiblingAfter)(this.document.root, selected.id, node);
            this.selectedId = node.id;
        });
        window.setTimeout(() => this.beginInlineEdit(node.id), 0);
    }
    /**
     * 编辑selected，并保持模型、界面和持久化状态的一致性。
     */
    editSelected() {
        if (!this.ensureEditable())
            return;
        const selected = this.selectedNode();
        if (!selected)
            return;
        let historyCaptured = false;
        const modal = new NodeEditModal(this.app, selected, this.options.defaultNodeShape, {
            resolveImage: this.callbacks.resolveImage,
            onSavePastedImage: this.callbacks.onSavePastedImage,
            getImageHosts: this.callbacks.getImageHosts,
            getDefaultUploadHostIds: this.callbacks.getDefaultUploadHostIds,
            onUploadImage: this.callbacks.onUploadImage,
            onReadImageSource: this.callbacks.onReadImageSource
        }, (values) => {
            var _a;
            // A continuously open editor may autosave many times. Capture one undo
            // snapshot for the whole editing session instead of one snapshot per keypress.
            if (!historyCaptured) {
                this.history.capture(this.document);
                historyCaptured = true;
            }
            selected.content = values.content;
            (0, model_1.syncNodeLegacyFields)(selected);
            selected.note = values.note || undefined;
            selected.link = values.link || undefined;
            selected.icon = values.icon || undefined;
            selected.tags = values.tags.length ? values.tags : undefined;
            selected.task = values.task;
            selected.articleNumberingMode = values.articleNumberingMode;
            selected.articleNumberingLevel = values.articleNumberingMode === "manual" ? values.articleNumberingLevel : undefined;
            selected.skipArticleNumbering = values.articleNumberingMode === "none" || undefined;
            const style = {
                color: values.color,
                textColor: values.textColor,
                borderColor: values.borderColor,
                borderWidth: values.borderWidth,
                shape: values.shape,
                bold: values.bold,
                italic: values.italic,
                underline: values.underline,
                fontSize: values.fontSize,
                textAlign: values.textAlign,
                width: values.width,
                minHeight: values.minHeight
            };
            selected.style = Object.values(style).some((value) => value !== undefined) ? style : undefined;
            if (selected.id === this.document.root.id) {
                const title = (0, model_1.nodePlainText)(selected);
                if (title)
                    this.document.title = title;
            }
            this.callbacks.onChange(this.getDocument());
            this.markSaving();
            if (this.inlineEditingId === selected.id) {
                const inline = this.nodesLayerEl.querySelector(`.mmc-node[data-node-id="${CSS.escape(selected.id)}"] .mmc-node-text.is-inline-editing`);
                const textBlock = (0, model_1.nodeContentBlocks)(selected).find((block) => block.type === "text");
                if (inline && document.activeElement !== inline)
                    (0, rich_text_dom_1.renderRichTextRuns)(inline, textBlock === null || textBlock === void 0 ? void 0 : textBlock.richText, (_a = textBlock === null || textBlock === void 0 ? void 0 : textBlock.text) !== null && _a !== void 0 ? _a : "", false);
            }
            else {
                this.render();
            }
        }, this.options.nodeEditorPosition, this.viewportEl);
        modal.open();
        if (this.options.nodeEditorPosition === "right" && this.inlineEditingId === selected.id) {
            modal.releaseKeyboardScope();
        }
    }
    /**
     * 删除selected，并保持模型、界面和持久化状态的一致性。
     */
    deleteSelected() {
        var _a, _b;
        if (!this.ensureEditable())
            return;
        const batch = (0, node_actions_1.topLevelSelectedNodeIds)(this.document.root, this.selectedIds);
        if (this.selectedIds.size > 1 && batch.length) {
            const fallback = (_b = (_a = (0, model_1.findParent)(this.document.root, batch[0])) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : this.document.root.id;
            this.mutate(() => {
                (0, node_actions_1.deleteNodes)(this.document.root, batch);
                this.selectedIds.clear();
                this.selectedId = fallback;
                this.selectedIds.add(fallback);
            });
            new obsidian_1.Notice(`已删除 ${batch.length} 个所选节点`);
            return;
        }
        const selected = this.selectedNode();
        if (!selected || selected.id === this.document.root.id) {
            new obsidian_1.Notice("根节点不能删除");
            return;
        }
        const parent = (0, model_1.findParent)(this.document.root, selected.id);
        this.mutate(() => {
            var _a;
            (0, node_actions_1.deleteNodes)(this.document.root, [selected.id]);
            this.selectedId = (_a = parent === null || parent === void 0 ? void 0 : parent.id) !== null && _a !== void 0 ? _a : this.document.root.id;
            this.selectedIds.clear();
            this.selectedIds.add(this.selectedId);
        });
    }
    /**
     * 切换collapse，并保持模型、界面和持久化状态的一致性。
     */
    toggleCollapse() {
        const selected = this.selectedNode();
        if (!selected || !selected.children.length)
            return;
        if (this.readOnly) {
            selected.collapsed = !selected.collapsed;
            this.render();
            return;
        }
        this.mutate(() => { selected.collapsed = !selected.collapsed; });
    }
    /**
     * Expands or collapses every branch while keeping the root visible.
     *
     * @param collapsed Whether branches should be collapsed.
     */
    setAllNodesCollapsed(collapsed) {
        const apply = () => {
            (0, node_actions_1.setAllBranchesCollapsed)(this.document.root, collapsed);
        };
        if (this.readOnly) {
            apply();
            this.render();
            return;
        }
        this.mutate(apply);
    }
    /**
     * 切换task，并保持模型、界面和持久化状态的一致性。
     */
    cycleTask() {
        if (!this.ensureEditable())
            return;
        const selected = this.selectedNode();
        if (!selected)
            return;
        this.mutate(() => { selected.task = (0, node_actions_1.nextTaskStatus)(selected.task); });
    }
    /**
     * 切换layout，并保持模型、界面和持久化状态的一致性。
     */
    toggleLayout() {
        if (!this.ensureEditable())
            return;
        this.mutate(() => { this.document.layout = this.document.layout === "right" ? "balanced" : "right"; });
        window.setTimeout(() => this.fitToView(), 20);
    }
    /**
     * Switches the top-level article between its generated directory and original article content.
     */
    toggleArticleLanding() {
        var _a, _b;
        if (this.currentMode !== "article" || !this.options.showArticleToc)
            return;
        const current = (_b = (_a = this.document.view) === null || _a === void 0 ? void 0 : _a.articleLandingMode) !== null && _b !== void 0 ? _b : "toc";
        this.mutate(() => {
            var _a;
            this.document.view = { ...((_a = this.document.view) !== null && _a !== void 0 ? _a : {}), articleLandingMode: current === "toc" ? "article" : "toc" };
        });
    }
    /**
     * Opens article preset and typography controls for the current document.
     */
    editArticleStyle() {
        if (!this.ensureEditable())
            return;
        new editor_modals_1.ArticleStyleModal(this.app, this.document.articleStyle, (style) => {
            this.mutate(() => { this.document.articleStyle = style; });
        }).open();
    }
    /**
     * 编辑appearance，并保持模型、界面和持久化状态的一致性。
     */
    editAppearance() {
        var _a;
        if (!this.ensureEditable())
            return;
        new AppearanceModal(this.app, this.getAppearance(), {
            articleNumberingMode: (_a = this.document.root.articleNumberingMode) !== null && _a !== void 0 ? _a : (this.document.root.skipArticleNumbering === true ? "none" : undefined),
            articleNumberingLevel: this.document.root.articleNumberingLevel
        }, (appearance, numbering) => this.mutate(() => {
            this.document.appearance = appearance;
            this.document.root.articleNumberingMode = numbering.articleNumberingMode;
            this.document.root.articleNumberingLevel = numbering.articleNumberingMode === "manual" ? numbering.articleNumberingLevel : undefined;
            this.document.root.skipArticleNumbering = numbering.articleNumberingMode === "none" || undefined;
        }), () => this.mutate(() => {
            this.document.appearance = undefined;
            this.document.root.articleNumberingMode = undefined;
            this.document.root.articleNumberingLevel = undefined;
            this.document.root.skipArticleNumbering = undefined;
        })).open();
    }
    /**
     * 编辑table，并保持模型、界面和持久化状态的一致性。
     */
    editTable() {
        var _a;
        if (!this.ensureEditable())
            return;
        const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
        new content_modals_1.TableEditModal(this.app, selected.table, (table) => {
            this.mutate(() => { selected.table = table; });
        }).open();
    }
    /**
     * 转换children to table，并保持模型、界面和持久化状态的一致性。
     */
    convertChildrenToTable() {
        var _a;
        if (!this.ensureEditable())
            return;
        const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
        const table = (0, model_1.childrenToTable)(selected);
        if (!table) {
            new obsidian_1.Notice("当前节点没有可转换的子节点");
            return;
        }
        this.mutate(() => {
            selected.table = table;
            selected.collapsed = true;
        });
        new obsidian_1.Notice("已生成子节点表格；原子节点已保留并收起");
    }
    /**
     * 删除table，并保持模型、界面和持久化状态的一致性。
     */
    removeTable() {
        if (!this.ensureEditable())
            return;
        const selected = this.selectedNode();
        if (!(selected === null || selected === void 0 ? void 0 : selected.table))
            return;
        this.mutate(() => {
            selected.table = undefined;
            if (selected.children.length)
                selected.collapsed = false;
        });
    }
    /**
     * 编辑code，并保持模型、界面和持久化状态的一致性。
     */
    editCode() {
        var _a;
        if (!this.ensureEditable())
            return;
        const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
        new content_modals_1.CodeEditModal(this.app, selected.code, (code) => {
            this.mutate(() => { selected.code = code; });
        }).open();
    }
    /**
     * 删除code，并保持模型、界面和持久化状态的一致性。
     */
    removeCode() {
        if (!this.ensureEditable())
            return;
        const selected = this.selectedNode();
        if (!(selected === null || selected === void 0 ? void 0 : selected.code))
            return;
        this.mutate(() => { selected.code = undefined; });
    }
    /**
     * 如果节点已有子导图则打开；否则创建独立 .mindmap 文件并在父节点与子文件导航元数据中建立双向关系。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async createOrOpenSubmap() {
        var _a;
        const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
        if (selected.submap) {
            await this.callbacks.onOpenMindMap(selected.submap.path);
            return;
        }
        if (!this.ensureEditable())
            return;
        try {
            const submap = await this.callbacks.onCreateSubmap(selected);
            this.mutate(() => { selected.submap = submap; });
            await this.callbacks.onOpenMindMap(submap.path);
        }
        catch (error) {
            console.error("MindMap Studio create submap failed", error);
            new obsidian_1.Notice("创建子导图失败");
        }
    }
    /**
     * Renders every map in the current parent/child family as one continuous,
     * read-only book with an integrated directory and persisted progress.
     */
    renderReading() {
        var _a, _b;
        this.articleEl.empty();
        const sections = this.options.readingSections.length
            ? this.options.readingSections
            : [{ filePath: (_b = (_a = this.options.articleNavigation) === null || _a === void 0 ? void 0 : _a.homePath) !== null && _b !== void 0 ? _b : "", document: this.document, baseDepth: 0 }];
        const style = (0, article_style_1.resolveArticleStyle)(this.document.articleStyle);
        const progress = this.articleEl.createDiv({ cls: `mms-reading-progress position-${this.options.readingProgressPosition}` });
        progress.createDiv({ cls: "mms-reading-progress-bar" });
        const initialProgress = `${Math.round(this.options.readingProgress * 100)}%`;
        progress.style.setProperty("--mms-reading-progress", initialProgress);
        progress.dataset.progress = initialProgress;
        progress.createSpan({ text: `阅读进度 ${initialProgress}` });
        const page = this.articleEl.createDiv({ cls: `mms-article-page mms-reading-page article-${style.preset}` });
        page.createEl("h1", { cls: "mms-article-document-title", text: (0, model_1.nodePrimaryText)(sections[0].document.root) || sections[0].document.title });
        // 存在子导图时，顶级导图只承担书名与目录组织，不再作为正文重复显示。
        const contentSections = sections.length > 1 ? sections.slice(1) : sections;
        const contentPaths = new Set(contentSections.map((section) => section.filePath));
        const tocEntries = this.options.articleTocEntries.filter((entry) => entry.depth <= this.options.articleTocMaxDepth && contentPaths.has(entry.filePath));
        const toc = page.createEl("nav", { cls: "mms-article-toc mms-reading-toc" });
        toc.createEl("h2", { text: "全书目录" });
        const tocList = toc.createEl("ol");
        for (const entry of tocEntries) {
            const fileKey = (0, modes_1.readingAnchorPart)(entry.filePath);
            const anchor = entry.nodeId
                ? `reading-${fileKey}-${(0, modes_1.readingAnchorPart)(entry.nodeId)}`
                : `reading-file-${fileKey}`;
            const item = tocList.createEl("li");
            item.addClass(`depth-${Math.min(entry.depth, 8)}`);
            item.style.setProperty("--mms-article-depth", String(entry.depth));
            const link = item.createEl("a", { text: entry.displayTitle || entry.title, href: `#${anchor}` });
            link.addEventListener("click", (event) => {
                var _a;
                event.preventDefault();
                (_a = page.querySelector(`#${CSS.escape(anchor)}`)) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }
        for (const section of contentSections) {
            const fileKey = (0, modes_1.readingAnchorPart)(section.filePath);
            const anchor = `reading-file-${fileKey}`;
            const chapter = page.createEl("article", { cls: "mms-reading-book-section" });
            chapter.id = anchor;
            const sectionEntry = tocEntries.find((entry) => entry.filePath === section.filePath && !entry.nodeId);
            chapter.createEl("h2", {
                cls: "mms-reading-map-title",
                text: (sectionEntry === null || sectionEntry === void 0 ? void 0 : sectionEntry.displayTitle) || (0, model_1.nodePrimaryText)(section.document.root) || section.document.title
            });
            this.renderArticleContent(chapter, section.document.root, false);
            for (const info of (0, modes_1.buildArticleNodeInfo)(section.document.root, section.baseDepth)) {
                const nodeSection = chapter.createEl("section", { cls: `mms-article-node depth-${Math.min(info.depth, 8)}` });
                nodeSection.id = `reading-${fileKey}-${(0, modes_1.readingAnchorPart)(info.node.id)}`;
                if (info.isHeading) {
                    const level = Math.min(6, info.depth + 1);
                    nodeSection.createEl(`h${level}`, { text: info.displayTitle || info.title });
                    this.renderArticleContent(nodeSection, info.node, false);
                }
                else {
                    const firstTextBlock = (0, model_1.nodeContentBlocks)(info.node).find((block) => block.type === "text");
                    if (firstTextBlock) {
                        const paragraph = nodeSection.createEl("p", { cls: "mms-article-leaf-text" });
                        (0, rich_text_dom_1.renderRichTextRuns)(paragraph, firstTextBlock.richText, firstTextBlock.text);
                    }
                    this.renderArticleContent(nodeSection, info.node, false);
                }
            }
        }
        window.setTimeout(() => {
            const maximum = Math.max(0, this.articleEl.scrollHeight - this.articleEl.clientHeight);
            this.articleEl.scrollTop = maximum * this.options.readingProgress;
        }, 20);
        this.articleEl.onscroll = () => {
            var _a;
            const maximum = Math.max(1, this.articleEl.scrollHeight - this.articleEl.clientHeight);
            const next = Math.max(0, Math.min(1, this.articleEl.scrollTop / maximum));
            const nextProgress = `${Math.round(next * 100)}%`;
            progress.style.setProperty("--mms-reading-progress", nextProgress);
            progress.dataset.progress = nextProgress;
            (_a = progress.lastElementChild) === null || _a === void 0 ? void 0 : _a.replaceChildren(`阅读进度 ${nextProgress}`);
            if (this.readingProgressTimer !== null)
                window.clearTimeout(this.readingProgressTimer);
            this.readingProgressTimer = window.setTimeout(() => {
                var _a, _b, _c, _d;
                this.readingProgressTimer = null;
                const homePath = (_d = (_b = (_a = this.options.articleNavigation) === null || _a === void 0 ? void 0 : _a.homePath) !== null && _b !== void 0 ? _b : (_c = sections[0]) === null || _c === void 0 ? void 0 : _c.filePath) !== null && _d !== void 0 ? _d : "";
                if (homePath)
                    void this.callbacks.onReadingProgressChange(homePath, next);
            }, 500);
        };
        this.addArticleScrollToTopButton();
    }
    /**
     * Adds the shared floating control used to return article and continuous-reading views to their top.
     */
    addArticleScrollToTopButton() {
        var _a;
        (_a = this.articleScrollButtonCleanup) === null || _a === void 0 ? void 0 : _a.call(this);
        const button = this.articleEl.createEl("button", {
            cls: "mms-article-scroll-top",
            attr: { type: "button", title: "回到顶部", "aria-label": "回到顶部" }
        });
        (0, obsidian_1.setIcon)(button, "arrow-up");
        button.addEventListener("click", () => this.articleEl.scrollTo({ top: 0, behavior: "smooth" }));
        const updateVisibility = () => {
            const { scrollTop, clientHeight, scrollHeight } = this.articleEl;
            const progress = scrollTop / Math.max(1, scrollHeight - clientHeight);
            const visible = progress * 100 >= this.options.returnToTopVisibility;
            button.toggleClass("is-visible", visible);
        };
        this.articleEl.addEventListener("scroll", updateVisibility);
        this.articleScrollButtonCleanup = () => {
            this.articleEl.removeEventListener("scroll", updateVisibility);
            this.articleScrollButtonCleanup = null;
        };
        updateVisibility();
    }
    /**
     * Deletes the selected node's submap file when present and clears stale
     * links when the file was already removed outside the plugin.
     */
    async deleteSelectedSubmap() {
        var _a;
        if (!this.ensureEditable())
            return;
        const selected = this.selectedNode();
        if (!(selected === null || selected === void 0 ? void 0 : selected.submap))
            return;
        const confirmed = window.confirm(`删除子导图“${(_a = selected.submap.title) !== null && _a !== void 0 ? _a : selected.submap.path}”及其链接？\n如果文件已不存在，将只移除失效链接。`);
        if (!confirmed)
            return;
        const submap = { ...selected.submap };
        try {
            const deleted = await this.callbacks.onDeleteSubmap(submap);
            this.mutate(() => { selected.submap = undefined; });
            new obsidian_1.Notice(deleted ? "已删除子导图并移除链接" : "子导图文件不存在，已移除失效链接");
        }
        catch (error) {
            console.error("MindMap Studio delete submap failed", error);
            new obsidian_1.Notice("删除子导图失败");
        }
    }
    /**
     * 渲染node table，并保持模型、界面和持久化状态的一致性。
     *
     * @param content 该参数用于 render node table 流程中的输入或控制。
     * @param node 当前处理的节点。
     */
    renderNodeTable(content, node) {
        if (!node.table)
            return;
        const wrap = content.createDiv({ cls: "mmc-node-table-wrap" });
        const table = wrap.createEl("table", { cls: "mmc-node-table" });
        const head = table.createEl("thead").createEl("tr");
        node.table.headers.forEach((header, index) => {
            var _a, _b, _c;
            const cell = head.createEl("th", { text: header || `列 ${index + 1}` });
            cell.style.textAlign = (_c = (_b = (_a = node.table) === null || _a === void 0 ? void 0 : _a.alignments) === null || _b === void 0 ? void 0 : _b[index]) !== null && _c !== void 0 ? _c : "left";
        });
        const body = table.createEl("tbody");
        node.table.rows.forEach((row) => {
            const tr = body.createEl("tr");
            node.table.headers.forEach((_, index) => {
                var _a, _b, _c, _d;
                const cell = tr.createEl("td", { text: (_a = row[index]) !== null && _a !== void 0 ? _a : "" });
                cell.style.textAlign = (_d = (_c = (_b = node.table) === null || _b === void 0 ? void 0 : _b.alignments) === null || _c === void 0 ? void 0 : _c[index]) !== null && _d !== void 0 ? _d : "left";
            });
        });
        wrap.addEventListener("pointerdown", (event) => event.stopPropagation());
        wrap.addEventListener("dragstart", (event) => event.preventDefault());
        wrap.addEventListener("dblclick", (event) => { event.stopPropagation(); this.selectNode(node.id); this.editTable(); });
    }
    /**
     * 渲染node code，并保持模型、界面和持久化状态的一致性。
     *
     * @param content 该参数用于 render node code 流程中的输入或控制。
     * @param node 当前处理的节点。
     */
    renderNodeCode(content, node) {
        if (!node.code)
            return;
        const block = content.createDiv({ cls: "mmc-code-block" });
        const header = block.createDiv({ cls: "mmc-code-header" });
        header.createSpan({ text: node.code.language || "code" });
        const copy = header.createEl("button", { cls: "clickable-icon", attr: { "aria-label": "复制代码" } });
        (0, obsidian_1.setIcon)(copy, "copy");
        copy.addEventListener("click", (event) => {
            event.stopPropagation();
            void navigator.clipboard.writeText(node.code.code).then(() => new obsidian_1.Notice("代码已复制"));
        });
        const rendered = block.createDiv({ cls: "mmc-code-rendered markdown-rendered" });
        void this.callbacks.onRenderCode(node.code, rendered);
        block.addEventListener("pointerdown", (event) => event.stopPropagation());
        block.addEventListener("dragstart", (event) => event.preventDefault());
        block.addEventListener("dblclick", (event) => { event.stopPropagation(); this.selectNode(node.id); this.editCode(); });
    }
    /**
     * 处理编辑器内粘贴：优先识别图片并保存为本地资源，其次识别表格、代码块、JSON 分支或普通文本。图片可按设置进入延迟自动上传流程。
     *
     * @param event 触发当前交互的浏览器或 Obsidian 事件。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async handlePaste(event) {
        var _a, _b, _c;
        if (this.readOnly)
            return;
        const target = event.target;
        if (target.closest("input, textarea, select, [contenteditable='true']"))
            return;
        const data = event.clipboardData;
        if (!data)
            return;
        const imageItem = Array.from(data.items).find((item) => item.kind === "file" && item.type.startsWith("image/"));
        if (imageItem) {
            const blob = imageItem.getAsFile();
            if (!blob)
                return;
            event.preventDefault();
            const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
            try {
                const extension = ((_b = blob.type.split("/")[1]) === null || _b === void 0 ? void 0 : _b.replace("jpeg", "jpg")) || "png";
                const filename = `mindmap-image.${extension}`;
                const path = await this.callbacks.onSavePastedImage(blob, filename);
                const imageBlock = { id: (0, model_1.newId)(), type: "image", source: path, localSource: path };
                this.mutate(() => {
                    const blocks = (0, model_1.nodeContentBlocks)(selected);
                    blocks.push(imageBlock);
                    selected.content = blocks;
                    (0, model_1.syncNodeLegacyFields)(selected);
                });
                const scheduled = this.callbacks.onScheduleAutoUpload(selected.id, imageBlock.id, path, filename);
                new obsidian_1.Notice(scheduled ? `图片已保存，等待自动上传：${path}` : `图片已保存：${path}`);
            }
            catch (error) {
                console.error("MindMap Studio paste image failed", error);
                new obsidian_1.Notice("粘贴图片失败");
            }
            return;
        }
        const htmlBranch = (0, clipboard_import_1.parseClipboardHtml)(data.getData("text/html"));
        const text = data.getData("text/plain");
        if (!text.trim() && !htmlBranch)
            return;
        const selected = (_c = this.selectedNode()) !== null && _c !== void 0 ? _c : this.document.root;
        const table = (0, model_1.parseMarkdownTable)(text);
        if (table) {
            event.preventDefault();
            this.mutate(() => { selected.table = table; });
            new obsidian_1.Notice("已识别并插入 Markdown 表格");
            return;
        }
        const code = (0, model_1.parseFencedCode)(text);
        if (code) {
            event.preventDefault();
            this.mutate(() => { selected.code = code; });
            new obsidian_1.Notice(`已识别并插入${code.language ? ` ${code.language}` : ""}代码`);
            return;
        }
        // Plain single-line text: replace node content instead of creating child
        if (!htmlBranch && !table && !code) {
            const plainText = text.trim();
            if (plainText && !plainText.includes(String.fromCharCode(10)) && !/^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/m.test(plainText)) {
                event.preventDefault();
                try {
                    JSON.parse(plainText);
                }
                catch (_d) {
                    // Not JSON → plain text paste: set node text
                    this.mutate(() => {
                        selected.text = plainText;
                        selected.richText = undefined;
                        (0, model_1.syncNodeLegacyFields)(selected);
                    });
                    return;
                }
            }
        }
        const sourceNodes = htmlBranch ? [htmlBranch] : (0, clipboard_import_1.parseClipboardNodes)(text);
        if (sourceNodes === null || sourceNodes === void 0 ? void 0 : sourceNodes.length) {
            event.preventDefault();
            const clones = sourceNodes.map((node) => (0, model_1.cloneNodeWithFreshIds)(node));
            clones.forEach((clone) => (0, node_actions_1.setAllBranchesCollapsed)(clone, true, true));
            this.mutate(() => {
                var _a, _b;
                selected.collapsed = false;
                selected.children.push(...clones);
                this.selectedIds.clear();
                for (const clone of clones)
                    this.selectedIds.add(clone.id);
                this.selectedId = (_b = (_a = clones[clones.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : selected.id;
            });
        }
    }
    /**
     * 打开selected link，并保持模型、界面和持久化状态的一致性。
     */
    openSelectedLink() {
        const selected = this.selectedNode();
        if (!selected)
            return;
        const link = this.getNodeLink(selected);
        if (!link) {
            new obsidian_1.Notice("当前节点没有链接；可按 F2 添加链接或在文字中写入 [[笔记名]]");
            return;
        }
        void this.callbacks.onOpenLink(link);
    }
    /**
     * 判断parent navigation backlink，并保持模型、界面和持久化状态的一致性。
     *
     * @param node 当前处理的节点。
     * @returns 操作条件是否成立或处理是否成功。
     */
    isParentNavigationBacklink(node) {
        var _a, _b, _c;
        const navigation = this.document.navigation;
        if (!(navigation === null || navigation === void 0 ? void 0 : navigation.parentPath))
            return false;
        if (node.id !== this.document.root.id)
            return false;
        const explicit = (_a = node.link) === null || _a === void 0 ? void 0 : _a.trim();
        if (!explicit)
            return false;
        const candidate = explicit.startsWith("[[") ? (0, model_1.extractFirstWikiLink)(explicit) : (_c = (_b = explicit.split("|")[0]) === null || _b === void 0 ? void 0 : _b.split("#")[0]) === null || _c === void 0 ? void 0 : _c.trim();
        if (!candidate)
            return false;
        return candidate === navigation.parentPath;
    }
    /**
     * 读取并返回node link，并保持模型、界面和持久化状态的一致性。
     *
     * @param node 当前处理的节点。
     * @returns 计算、解析或序列化后的字符串结果。
     */
    getNodeLink(node) {
        var _a, _b;
        const explicit = (_a = node.link) === null || _a === void 0 ? void 0 : _a.trim();
        if (explicit && !this.isParentNavigationBacklink(node))
            return explicit;
        return (0, model_1.extractFirstWikiLink)((0, model_1.nodePlainText)(node)) || (0, model_1.extractFirstWikiLink)((_b = node.note) !== null && _b !== void 0 ? _b : "");
    }
    /**
     * 执行“show outline”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    showOutline() {
        const markdown = (0, model_1.documentToMarkdown)(this.document);
        new editor_modals_1.OutlineModal(this.app, markdown, () => void this.callbacks.onExportMarkdown(markdown)).open();
    }
    /**
     * 执行“show json transfer”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    showJsonTransfer() {
        if (!this.ensureEditable())
            return;
        new editor_modals_1.JsonTransferModal(this.app, this.getDocument(), (document) => this.replaceDocument(document), (json) => void this.callbacks.onExportJson(json)).open();
    }
    /**
     * Opens the HTML, Word, PDF, and Markdown export chooser.
     */
    showDocumentExport() {
        new editor_modals_1.DocumentExportModal(this.app, (format) => {
            void this.callbacks.onExportDocument(format);
        }).open();
    }
    /**
     * 打开search，并保持模型、界面和持久化状态的一致性。
     */
    openSearch() {
        this.callbacks.onSearchMapFamily();
    }
    /**
     * 定位指定节点。必要时先展开全部祖先、切换到可显示该节点的视图并重渲染，然后选中节点并将其平滑移动到可视区域中央。
     *
     * @param id 目标对象或节点的稳定标识。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    focusNode(id) {
        const ancestors = (0, model_1.findAncestors)(this.document.root, id);
        const collapsed = ancestors.filter((node) => node.collapsed);
        if (collapsed.length) {
            if (this.readOnly)
                collapsed.forEach((node) => { node.collapsed = false; });
            else
                this.mutate(() => collapsed.forEach((node) => { node.collapsed = false; }));
        }
        this.selectedId = id;
        this.render();
        window.setTimeout(() => {
            var _a;
            if (this.currentMode === "mindmap")
                this.centerNode(id);
            else {
                const selector = this.currentMode === "outline"
                    ? `.mms-outline-row[data-node-id="${CSS.escape(id)}"]`
                    : `.mms-article-node[data-node-id="${CSS.escape(id)}"]`;
                (_a = this.rootEl.querySelector(selector)) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 20);
    }
    /**
     * 定位node，并保持模型、界面和持久化状态的一致性。
     *
     * @param id 目标对象或节点的稳定标识。
     */
    centerNode(id) {
        if (this.currentMode !== "mindmap")
            return;
        const position = this.layout.byId.get(id);
        if (!position)
            return;
        this.panX = -position.x * this.zoom;
        this.panY = -position.y * this.zoom;
        this.mindMapViewportInitialized = true;
        this.applyTransform();
    }
    /**
     * 打开context menu，并保持模型、界面和持久化状态的一致性。
     *
     * @param event 触发当前交互的浏览器或 Obsidian 事件。
     */
    openContextMenu(event) {
        var _a, _b, _c;
        const selected = this.selectedNode();
        const menu = new obsidian_1.Menu();
        if (this.readOnly) {
            if (selected === null || selected === void 0 ? void 0 : selected.submap)
                menu.addItem((item) => item.setTitle("进入子导图").setIcon("network").onClick(() => void this.createOrOpenSubmap()));
            menu.addItem((item) => item.setTitle("打开链接").setIcon("link").onClick(() => this.openSelectedLink()));
            menu.addItem((item) => item.setTitle("复制分支").setIcon("copy").onClick(() => void this.copySelectedBranch()));
            menu.showAtMouseEvent(event);
            return;
        }
        menu.addItem((item) => item.setTitle("添加子节点").setIcon("plus-circle").onClick(() => this.addChild()));
        menu.addItem((item) => item.setTitle("添加同级节点").setIcon("list-plus").onClick(() => this.addSibling()));
        menu.addItem((item) => item.setTitle("编辑节点").setIcon("pencil").onClick(() => this.editSelected()));
        if (((_a = selected === null || selected === void 0 ? void 0 : selected.style) === null || _a === void 0 ? void 0 : _a.width) !== undefined || ((_b = selected === null || selected === void 0 ? void 0 : selected.style) === null || _b === void 0 ? void 0 : _b.minHeight) !== undefined) {
            menu.addItem((item) => item.setTitle("恢复节点自动大小").setIcon("maximize-2").onClick(() => {
                if (!selected)
                    return;
                this.mutate(() => {
                    var _a;
                    const next = { ...((_a = selected.style) !== null && _a !== void 0 ? _a : {}), width: undefined, minHeight: undefined };
                    selected.style = Object.values(next).some((value) => value !== undefined) ? next : undefined;
                });
            }));
        }
        menu.addItem((item) => item.setTitle("克隆分支").setIcon("copy-plus").onClick(() => this.duplicateSelected()));
        menu.addSeparator();
        menu.addItem((item) => item.setTitle((selected === null || selected === void 0 ? void 0 : selected.table) ? "编辑表格" : "插入表格").setIcon("table-2").onClick(() => this.editTable()));
        menu.addItem((item) => item.setTitle("插入 LaTeX 公式").setIcon("sigma").onClick(() => this.insertFormula()));
        menu.addItem((item) => item.setTitle("将子节点生成表格").setIcon("table-properties").onClick(() => this.convertChildrenToTable()));
        if (selected === null || selected === void 0 ? void 0 : selected.table)
            menu.addItem((item) => item.setTitle("移除表格").setIcon("table-2").onClick(() => this.removeTable()));
        menu.addItem((item) => item.setTitle((selected === null || selected === void 0 ? void 0 : selected.code) ? "编辑代码" : "插入代码").setIcon("code-2").onClick(() => this.editCode()));
        if (selected === null || selected === void 0 ? void 0 : selected.code)
            menu.addItem((item) => item.setTitle("移除代码").setIcon("eraser").onClick(() => this.removeCode()));
        menu.addItem((item) => item.setTitle((selected === null || selected === void 0 ? void 0 : selected.submap) ? "进入子导图" : "创建子导图").setIcon("network").onClick(() => void this.createOrOpenSubmap()));
        if (!(selected === null || selected === void 0 ? void 0 : selected.submap) && selected !== this.document.root)
            menu.addItem((item) => item.setTitle("提取为子导图").setIcon("layers").onClick(() => void this.extractToSubmap()));
        if (selected === null || selected === void 0 ? void 0 : selected.submap)
            menu.addItem((item) => item.setTitle("删除子导图 / 移除链接").setIcon("unlink").onClick(() => void this.deleteSelectedSubmap()));
        if (((_c = this.document.navigation) === null || _c === void 0 ? void 0 : _c.parentPath) && selected === this.document.root)
            menu.addItem((item) => item.setTitle("合并回主导图").setIcon("merge").onClick(() => void this.mergeFromSubmap()));
        menu.addSeparator();
        menu.addItem((item) => item.setTitle("复制分支").setIcon("copy").onClick(() => void this.copySelectedBranch()));
        menu.addItem((item) => item.setTitle("粘贴为子节点").setIcon("clipboard-paste").onClick(() => void this.pasteAsChild()));
        menu.addSeparator();
        menu.addItem((item) => item.setTitle(`任务状态：${(selected === null || selected === void 0 ? void 0 : selected.task) === "done" ? "已完成" : (selected === null || selected === void 0 ? void 0 : selected.task) === "doing" ? "进行中" : (selected === null || selected === void 0 ? void 0 : selected.task) === "todo" ? "待办" : "无"}`).setIcon("circle-check-big").onClick(() => this.cycleTask()));
        const numberingDisabled = (selected === null || selected === void 0 ? void 0 : selected.articleNumberingMode) === "none" || (selected === null || selected === void 0 ? void 0 : selected.skipArticleNumbering) === true;
        menu.addItem((item) => item
            .setTitle(numberingDisabled ? "文章编号：恢复自动" : "文章编号：关闭")
            .setIcon("list-ordered")
            .onClick(() => {
            if (!selected)
                return;
            this.mutate(() => {
                selected.articleNumberingMode = numberingDisabled ? undefined : "none";
                selected.articleNumberingLevel = undefined;
                selected.skipArticleNumbering = numberingDisabled ? undefined : true;
            });
        }));
        menu.addItem((item) => item.setTitle("展开/收起").setIcon("fold-vertical").onClick(() => this.toggleCollapse()));
        menu.addItem((item) => item.setTitle("打开链接").setIcon("link").onClick(() => this.openSelectedLink()));
        menu.addSeparator();
        menu.addItem((item) => item.setTitle("删除节点").setIcon("trash-2").onClick(() => this.deleteSelected()));
        menu.showAtMouseEvent(event);
    }
    /**
     * 将选中节点及其后代提取为子导图文件，然后从当前文档移除该节点。
     */
    async extractToSubmap() {
        const selected = this.selectedNode();
        if (!selected || selected === this.document.root)
            return;
        if (!this.ensureEditable())
            return;
        try {
            const submap = await this.callbacks.onExtractToSubmap(selected);
            this.mutate(() => {
                selected.children = [];
                selected.submap = submap;
            });
            await this.callbacks.onOpenMindMap(submap.path);
        }
        catch (error) {
            console.error('MindMap Studio extract to submap failed', error);
            new obsidian_1.Notice('提取子导图失败');
        }
    }
    /**
     * 将当前子导图合并回父导图并删除该子导图文件。
     */
    async mergeFromSubmap() {
        if (!this.ensureEditable())
            return;
        try {
            await this.callbacks.onMergeFromSubmap();
        }
        catch (error) {
            console.error('MindMap Studio merge from submap failed', error);
            new obsidian_1.Notice('合并子导图失败');
        }
    }
    /**
     * Opens the canvas and toolbar context menu for global branch visibility.
     *
     * @param event Mouse event used to position the menu.
     */
    openAllNodesContextMenu(event) {
        const menu = new obsidian_1.Menu();
        menu.addItem((item) => item
            .setTitle("展开所有节点")
            .setIcon("unfold-vertical")
            .onClick(() => this.setAllNodesCollapsed(false)));
        menu.addItem((item) => item
            .setTitle("收起所有节点")
            .setIcon("fold-vertical")
            .onClick(() => this.setAllNodesCollapsed(true)));
        menu.showAtMouseEvent(event);
    }
    /**
     * 打开图形化公式编辑器并把生成的公式追加到当前节点。
     */
    insertFormula() {
        var _a;
        if (!this.ensureEditable())
            return;
        const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
        new editor_modals_1.FormulaEditModal(this.app, (source) => {
            this.mutate(() => {
                const blocks = (0, model_1.nodeContentBlocks)(selected);
                const formula = `$$${source}$$`;
                const emptyText = blocks.find((block) => block.type === "text" && !block.text.trim());
                if (emptyText) {
                    emptyText.text = formula;
                    emptyText.richText = undefined;
                }
                else {
                    blocks.push({ id: (0, model_1.newId)(), type: "text", text: formula });
                }
                selected.content = blocks;
                (0, model_1.syncNodeLegacyFields)(selected);
            });
        }).open();
    }
    /**
     * 将当前分支或多选集合中的顶层分支复制到系统和插件内部剪贴板。
     * @returns 操作条件是否成立或处理是否成功。
     * @remarks 多选时必须排除已由所选祖先覆盖的后代，避免粘贴或剪切后重复分支。
     */
    async copySelectedBranch() {
        const selected = this.selectedNode();
        if (!selected)
            return false;
        const selectedIds = (0, node_actions_1.topLevelSelectedNodeIds)(this.document.root, this.selectedIds);
        const sourceNodes = this.selectedIds.size > 1 && selectedIds.length
            ? (0, model_1.flattenNodes)(this.document.root).filter((node) => selectedIds.includes(node.id))
            : [selected];
        this.branchClipboard = sourceNodes.map((node) => (0, model_1.cloneDocument)({
            version: 10,
            title: (0, model_1.nodePlainText)(node) || "图片节点",
            layout: "right",
            theme: "auto",
            root: node
        }).root);
        const payload = JSON.stringify({ type: "mindmap-studio-node", version: 2, nodes: sourceNodes }, null, 2);
        try {
            await navigator.clipboard.writeText(payload);
            new obsidian_1.Notice(sourceNodes.length > 1 ? `已复制 ${sourceNodes.length} 个节点分支` : "已复制节点分支");
        }
        catch (_a) {
            new obsidian_1.Notice(sourceNodes.length > 1 ? `${sourceNodes.length} 个节点分支已复制到插件内部剪贴板` : "节点分支已复制到插件内部剪贴板");
        }
        return true;
    }
    /**
     * 将剪贴板中的一个或多个分支按顺序粘贴为当前节点的子节点。
     * @remarks 所有粘贴分支都会生成新 ID，并成为新的多选集合，避免与来源节点冲突。
     */
    async pasteAsChild() {
        var _a;
        const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
        let sourceNodes = null;
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim())
                sourceNodes = (0, clipboard_import_1.parseClipboardNodes)(text);
        }
        catch (_b) {
            // Browser clipboard permission can be unavailable; use internal clipboard.
        }
        sourceNodes !== null && sourceNodes !== void 0 ? sourceNodes : (sourceNodes = this.branchClipboard);
        if (!(sourceNodes === null || sourceNodes === void 0 ? void 0 : sourceNodes.length)) {
            new obsidian_1.Notice("剪贴板中没有可粘贴的 MindMap 节点");
            return;
        }
        const clones = sourceNodes.map((node) => (0, model_1.cloneNodeWithFreshIds)(node));
        clones.forEach((clone) => (0, node_actions_1.setAllBranchesCollapsed)(clone, true, true));
        this.mutate(() => {
            var _a, _b;
            selected.collapsed = false;
            selected.children.push(...clones);
            this.selectedIds.clear();
            for (const clone of clones)
                this.selectedIds.add(clone.id);
            this.selectedId = (_b = (_a = clones[clones.length - 1]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : selected.id;
        });
    }
    /**
     * 复制生成selected，并保持模型、界面和持久化状态的一致性。
     */
    duplicateSelected() {
        if (!this.ensureEditable())
            return;
        const selected = this.selectedNode();
        if (!selected || selected.id === this.document.root.id) {
            new obsidian_1.Notice("请选择非根节点后克隆分支");
            return;
        }
        const parent = (0, model_1.findParent)(this.document.root, selected.id);
        if (!parent)
            return;
        const clone = (0, model_1.cloneNodeWithFreshIds)(selected);
        this.mutate(() => {
            const index = parent.children.findIndex((child) => child.id === selected.id);
            parent.children.splice(index + 1, 0, clone);
            this.selectedId = clone.id;
        });
    }
    /**
     * 判断reparent，并保持模型、界面和持久化状态的一致性。
     *
     * @param draggedId 该参数用于 can reparent 流程中的输入或控制。
     * @param targetId 该参数用于 can reparent 流程中的输入或控制。
     * @returns 操作条件是否成立或处理是否成功。
     */
    canMoveNode(draggedId, targetId) {
        return (0, drag_drop_1.canMoveNodes)(this.document.root, this.selectedIds, draggedId, targetId);
    }
    /**
     * 根据指针在目标节点的位置判断拖放意图。右侧和中间均成为子级；根节点仅接受子节点放置。
     *
     * @param event 当前拖放事件。
     * @param targetEl 目标节点 DOM。
     * @param targetId 目标节点标识。
     * @returns 右侧 28% 或中间区域为 child，上方 28% 为 before，下方 28% 为 after。
     */
    dropPositionForEvent(event, targetEl, targetId) {
        const rect = targetEl.getBoundingClientRect();
        return (0, drag_drop_1.resolveDropPosition)(event, rect, targetId === this.document.root.id);
    }
    /** 清理全部拖放目标样式，防止跨节点移动时残留指示线。 */
    clearDropIndicators() {
        this.nodesLayerEl.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-child, .is-drop-child-right, .is-drop-after")
            .forEach((element) => element.removeClasses(["is-drop-target", "is-drop-before", "is-drop-child", "is-drop-child-right", "is-drop-after"]));
    }
    /**
     * Renders a magnetic placeholder at the exact location represented by the
     * current before, child, or after drop zone.
     *
     * @param targetId Drop target node identifier.
     * @param position Relative drop position.
     */
    showDropPreview(targetId, position) {
        var _a;
        const target = this.layout.byId.get(targetId);
        const dragged = this.draggingId ? this.layout.byId.get(this.draggingId) : null;
        if (!target || !dragged)
            return;
        if (((_a = this.dropPreviewEl) === null || _a === void 0 ? void 0 : _a.dataset.targetId) === targetId && this.dropPreviewEl.dataset.position === position)
            return;
        this.clearDropPreview();
        const selectedCount = this.selectedIds.has(dragged.node.id) ? this.selectedIds.size : 1;
        const preview = this.nodesLayerEl.createDiv({ cls: `mmc-drop-preview is-${position}` });
        preview.dataset.targetId = targetId;
        preview.dataset.position = position;
        const width = Math.min(260, Math.max(100, dragged.width));
        const height = Math.min(72, Math.max(38, dragged.height));
        let x = target.x;
        let y = target.y;
        if (position === "before")
            y -= target.height / 2 + height / 2 + 12;
        if (position === "after")
            y += target.height / 2 + height / 2 + 12;
        if (position === "child") {
            const side = target.side === -1 ? -1 : 1;
            const gap = this.getAppearance().nodeVisualStyle === "branch" ? 54 : 112;
            x += side * (target.width / 2 + gap + width / 2);
        }
        preview.style.left = `${x}px`;
        preview.style.top = `${y}px`;
        preview.style.width = `${width}px`;
        preview.style.height = `${height}px`;
        preview.createSpan({
            cls: "mmc-drop-preview-label",
            text: selectedCount > 1 ? `移动 ${selectedCount} 个节点` : (0, model_1.nodePrimaryText)(dragged.node) || "节点"
        });
        preview.createSpan({
            cls: "mmc-drop-preview-hint",
            text: position === "child" ? "作为子节点" : position === "before" ? "插入到上方" : "插入到下方"
        });
        this.dropPreviewEl = preview;
    }
    /** Removes the temporary magnetic drop placeholder. */
    clearDropPreview() {
        var _a;
        (_a = this.dropPreviewEl) === null || _a === void 0 ? void 0 : _a.remove();
        this.dropPreviewEl = null;
    }
    /**
     * 在统一编辑事务中移动节点，支持同级前后排序和改变父子关系。
     *
     * @param draggedId 被移动节点标识。
     * @param targetId 目标节点标识。
     * @param position 相对目标节点的放置位置。
     */
    moveNode(draggedId, targetId, position) {
        if (!this.ensureEditable() || !this.canMoveNode(draggedId, targetId))
            return;
        const requestedIds = this.selectedIds.has(draggedId) && this.selectedIds.size > 1
            ? new Set(this.selectedIds)
            : new Set([draggedId]);
        const draggedIds = (0, model_1.flattenNodes)(this.document.root)
            .filter((node) => requestedIds.has(node.id))
            .filter((node) => !(0, model_1.findAncestors)(this.document.root, node.id).some((ancestor) => requestedIds.has(ancestor.id)))
            .map((node) => node.id);
        if (!draggedIds.length)
            return;
        const historyDocument = (0, model_1.cloneDocument)(this.document);
        const moveOrder = position === "after" ? [...draggedIds].reverse() : draggedIds;
        let changed = false;
        for (const id of moveOrder) {
            changed = (0, model_1.moveNodeRelative)(this.document.root, id, targetId, position) || changed;
        }
        if (!changed)
            return;
        this.history.capture(historyDocument);
        this.selectedId = draggedId;
        this.selectedIds.clear();
        for (const id of requestedIds)
            this.selectedIds.add(id);
        this.callbacks.onChange(this.getDocument());
        this.markSaving();
        this.render();
    }
    /**
     * 替换document，并保持模型、界面和持久化状态的一致性。
     *
     * @param document 要处理的思维导图文档。
     */
    replaceDocument(document) {
        if (!this.ensureEditable())
            return;
        this.history.capture(this.document);
        this.document = (0, model_1.cloneDocument)(document);
        this.selectedId = this.document.root.id;
        this.callbacks.onChange(this.getDocument());
        this.markSaving();
        this.render();
        window.setTimeout(() => this.fitToView(), 20);
    }
    /**
     * 所有用户可撤销写操作的统一入口。调用前克隆当前文档写入撤销栈，执行修改，规范化和重渲染，再通知视图自动保存；只读状态会在更上层阻止进入该流程。
     *
     * @param action 该参数用于 mutate 流程中的输入或控制。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    mutate(action) {
        if (!this.ensureEditable())
            return;
        this.history.capture(this.document);
        action();
        this.callbacks.onChange(this.getDocument());
        this.markSaving();
        this.render();
    }
    /**
     * 撤销相关数据，并保持模型、界面和持久化状态的一致性。
     */
    undo() {
        if (!this.ensureEditable())
            return;
        const previous = this.history.undo(this.document);
        if (!previous)
            return;
        this.document = previous;
        this.selectedId = this.document.root.id;
        this.callbacks.onChange(this.getDocument());
        this.markSaving();
        this.render();
    }
    /**
     * 重做相关数据，并保持模型、界面和持久化状态的一致性。
     */
    redo() {
        if (!this.ensureEditable())
            return;
        const next = this.history.redo(this.document);
        if (!next)
            return;
        this.document = next;
        this.selectedId = this.document.root.id;
        this.callbacks.onChange(this.getDocument());
        this.markSaving();
        this.render();
    }
    /**
     * 执行“fit to view”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    fitToView() {
        const rect = this.viewportEl.getBoundingClientRect();
        const width = Math.max(1, this.layout.maxX - this.layout.minX + 100);
        const height = Math.max(1, this.layout.maxY - this.layout.minY + 100);
        this.zoom = this.clampZoom(Math.min((rect.width - 40) / width, (rect.height - 40) / height, 1.25));
        const centerX = (this.layout.minX + this.layout.maxX) / 2;
        const centerY = (this.layout.minY + this.layout.maxY) / 2;
        this.panX = -centerX * this.zoom;
        this.panY = -centerY * this.zoom;
        this.mindMapViewportInitialized = true;
        this.applyTransform();
    }
    /**
     * 从文档视图状态恢复导图缩放与平移。没有已保存状态时，只在导图当前可见且启用自动适应时执行一次自适应；
     * 若首次打开就是文章或通读模式，则把自适应延迟到第一次进入导图模式，避免在隐藏画布上计算出错误缩放。
     *
     * @param delay 应用已保存变换或自动适应前的延迟毫秒数。
     */
    initializeMindMapViewport(delay) {
        const saved = this.document.view;
        const hasSavedViewport = typeof (saved === null || saved === void 0 ? void 0 : saved.zoom) === "number"
            || typeof (saved === null || saved === void 0 ? void 0 : saved.panX) === "number"
            || typeof (saved === null || saved === void 0 ? void 0 : saved.panY) === "number";
        this.zoom = typeof (saved === null || saved === void 0 ? void 0 : saved.zoom) === "number" ? this.clampZoom(saved.zoom) : 1;
        this.panX = typeof (saved === null || saved === void 0 ? void 0 : saved.panX) === "number" ? saved.panX : 0;
        this.panY = typeof (saved === null || saved === void 0 ? void 0 : saved.panY) === "number" ? saved.panY : 0;
        this.mindMapViewportInitialized = hasSavedViewport || !this.options.autoFitOnOpen;
        if (hasSavedViewport || !this.options.autoFitOnOpen) {
            window.setTimeout(() => this.applyTransform(), delay);
        }
        else if (this.currentMode === "mindmap") {
            window.setTimeout(() => this.fitToView(), delay);
        }
    }
    /**
     * 把当前导图缩放和平移写回文档视图状态。该方法在离开导图模式和序列化文档前调用，
     * 因此文章、大纲和通读模式重渲染不会把用户视口恢复为默认自适应大小。
     */
    persistMindMapViewportState() {
        var _a;
        if (!this.mindMapViewportInitialized)
            return;
        this.document.view = {
            ...((_a = this.document.view) !== null && _a !== void 0 ? _a : {}),
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY
        };
    }
    /**
     * 更新并应用zoom，并保持模型、界面和持久化状态的一致性。
     *
     * @param value 待校验、转换或比较的输入值。
     */
    setZoom(value) {
        this.zoom = this.clampZoom(value);
        this.mindMapViewportInitialized = true;
        this.applyTransform();
    }
    /**
     * 解析工具栏中的缩放百分比输入，并将有效值应用到画布。
     */
    applyZoomInput() {
        const percent = Number(this.zoomStatusEl.value.trim().replace(/%$/, ""));
        if (!Number.isFinite(percent) || percent <= 0) {
            this.applyTransform();
            return;
        }
        this.setZoom(percent / 100);
    }
    /**
     * 记录当前双指手势的初始中心点、间距和画布位置。
     */
    beginTwoFingerGesture() {
        const [first, second] = Array.from(this.touchPointers.values());
        if (!first || !second)
            return;
        this.touchGesture = {
            centerX: (first.x + second.x) / 2,
            centerY: (first.y + second.y) / 2,
            distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY
        };
    }
    /**
     * 按设置将双指手势解释为缩放或画布平移。
     */
    updateTwoFingerGesture() {
        if (!this.touchGesture)
            this.beginTwoFingerGesture();
        const gesture = this.touchGesture;
        const [first, second] = Array.from(this.touchPointers.values());
        if (!gesture || !first || !second)
            return;
        const centerX = (first.x + second.x) / 2;
        const centerY = (first.y + second.y) / 2;
        if (this.options.twoFingerGestureAction === "pan") {
            this.panX = gesture.panX + centerX - gesture.centerX;
            this.panY = gesture.panY + centerY - gesture.centerY;
            this.mindMapViewportInitialized = true;
            this.applyTransform();
            return;
        }
        const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
        const nextZoom = this.clampZoom(gesture.zoom * distance / gesture.distance);
        const rect = this.viewportEl.getBoundingClientRect();
        const initialX = gesture.centerX - rect.left - rect.width / 2;
        const initialY = gesture.centerY - rect.top - rect.height / 2;
        const worldX = (initialX - gesture.panX) / gesture.zoom;
        const worldY = (initialY - gesture.panY) / gesture.zoom;
        const currentX = centerX - rect.left - rect.width / 2;
        const currentY = centerY - rect.top - rect.height / 2;
        this.zoom = nextZoom;
        this.panX = currentX - worldX * nextZoom;
        this.panY = currentY - worldY * nextZoom;
        this.mindMapViewportInitialized = true;
        this.applyTransform();
    }
    /**
     * 执行“clamp zoom”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param value 待校验、转换或比较的输入值。
     * @returns 计算得到的数值结果。
     */
    clampZoom(value) {
        return Math.min(2.5, Math.max(0.2, value));
    }
    /**
     * 执行“navigate selection”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param direction 该参数用于 navigate selection 流程中的输入或控制。
     */
    navigateSelection(direction) {
        var _a, _b, _c;
        const selected = (_a = this.selectedNode()) !== null && _a !== void 0 ? _a : this.document.root;
        let target = null;
        if (direction === "parent")
            target = (0, model_1.findParent)(this.document.root, selected.id);
        if (direction === "child")
            target = (_b = selected.children[0]) !== null && _b !== void 0 ? _b : null;
        if (direction === "previous" || direction === "next") {
            const parent = (0, model_1.findParent)(this.document.root, selected.id);
            if (parent) {
                const index = parent.children.findIndex((child) => child.id === selected.id);
                const offset = direction === "previous" ? -1 : 1;
                target = (_c = parent.children[index + offset]) !== null && _c !== void 0 ? _c : null;
            }
        }
        if (target) {
            this.selectNode(target.id);
            this.centerNode(target.id);
        }
    }
    /**
     * 处理keydown，并保持模型、界面和持久化状态的一致性。
     *
     * @param event 触发当前交互的浏览器或 Obsidian 事件。
     */
    handleKeydown(event) {
        var _a;
        const target = event.target;
        const mod = event.ctrlKey || event.metaKey;
        const key = event.key.toLowerCase();
        const findKey = key === "f" || event.code === "KeyF";
        // Ctrl/Cmd+F 保留给 Obsidian；导图族搜索使用 Ctrl/Cmd+Shift+F。
        // 搜索快捷键必须先于可编辑元素过滤处理，否则在正文、标题或节点编辑时会被忽略。
        if (mod && event.shiftKey && findKey && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            if (event.repeat)
                return;
            this.openSearch();
            return;
        }
        if (target.closest("input, textarea, select, [contenteditable='true']"))
            return;
        if (mod && key === "a") {
            event.preventDefault();
            event.stopPropagation();
            this.selectAllNodesExceptRoot();
            return;
        }
        if (mod && key === "s") {
            event.preventDefault();
            this.callbacks.onChange(this.getDocument());
            this.markSaving();
            return;
        }
        if (this.currentMode === "article" && event.key === "Escape" && ((_a = this.options.articleNavigation) === null || _a === void 0 ? void 0 : _a.parentPath)) {
            event.preventDefault();
            void this.callbacks.onOpenMindMap(this.options.articleNavigation.parentPath);
            return;
        }
        if (this.readOnly) {
            if (mod && key === "c") {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed && selection.toString())
                    return;
                event.preventDefault();
                void this.copySelectedBranch();
                return;
            }
            if (["arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
                event.preventDefault();
                const direction = key === "arrowleft" ? "parent" : key === "arrowright" ? "child" : key === "arrowup" ? "previous" : "next";
                this.navigateSelection(direction);
            }
            else if (event.key === "+" || event.key === "=") {
                event.preventDefault();
                this.setZoom(this.zoom * 1.15);
            }
            else if (event.key === "-") {
                event.preventDefault();
                this.setZoom(this.zoom / 1.15);
            }
            else if (mod && key === "0") {
                event.preventDefault();
                this.fitToView();
            }
            else if (event.key === " ") {
                event.preventDefault();
                this.toggleCollapse();
            }
            return;
        }
        if (mod && key === "d") {
            event.preventDefault();
            this.duplicateSelected();
            return;
        }
        if (mod && key === "c") {
            event.preventDefault();
            void this.copySelectedBranch();
            return;
        }
        if (mod && key === "x") {
            event.preventDefault();
            void this.copySelectedBranch().then((copied) => { if (copied)
                this.deleteSelected(); });
            return;
        }
        if (mod && event.key === "Enter") {
            event.preventDefault();
            this.cycleTask();
            return;
        }
        if (mod && key === "z" && !event.shiftKey) {
            event.preventDefault();
            this.undo();
            return;
        }
        if ((mod && key === "y") || (mod && event.shiftKey && key === "z")) {
            event.preventDefault();
            this.redo();
            return;
        }
        switch (event.key) {
            case "Tab":
                event.preventDefault();
                this.addChild();
                break;
            case "Enter":
                event.preventDefault();
                this.addSibling();
                break;
            case "Delete":
            case "Backspace":
                event.preventDefault();
                this.deleteSelected();
                break;
            case "F2":
                event.preventDefault();
                this.editSelected();
                break;
            case " ":
                event.preventDefault();
                this.toggleCollapse();
                break;
            case "ArrowLeft":
                event.preventDefault();
                this.navigateSelection("parent");
                break;
            case "ArrowRight":
                event.preventDefault();
                this.navigateSelection("child");
                break;
            case "ArrowUp":
                event.preventDefault();
                this.navigateSelection("previous");
                break;
            case "ArrowDown":
                event.preventDefault();
                this.navigateSelection("next");
                break;
            case "+":
            case "=":
                event.preventDefault();
                this.setZoom(this.zoom * 1.15);
                break;
            case "-":
                event.preventDefault();
                this.setZoom(this.zoom / 1.15);
                break;
            case "0":
                if (mod) {
                    event.preventDefault();
                    this.fitToView();
                }
                break;
            default:
                break;
        }
    }
}
exports.MindMapEditor = MindMapEditor;

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/editor.ts
},
10: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file content-modals.ts
 * @description 编辑器领域的表格与代码块弹窗。
 *
 * 弹窗收集结构化输入；实际文档写入、撤销记录和自动保存由 MindMapEditor 统一处理。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeEditModal = exports.TableEditModal = void 0;
const obsidian_1 = require("obsidian");
const model_1 = __bundleRequire(1);
/**
 * 执行“clone table”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param table 待编辑、转换或导出的表格数据。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
function cloneTable(table) {
    if (!table) {
        return {
            headers: ["列 1", "列 2"],
            rows: [["", ""], ["", ""]],
            alignments: ["left", "left"],
            source: "manual"
        };
    }
    return JSON.parse(JSON.stringify(table));
}
/**
 * TableEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class TableEditModal extends obsidian_1.Modal {
    /**
     * 创建 TableEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
     * @param table 待编辑、转换或导出的表格数据。
     * @param submit 该参数用于 constructor 流程中的输入或控制。
     */
    constructor(app, table, submit) {
        super(app);
        this.table = cloneTable(table);
        this.submit = submit;
    }
    /**
     * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
     */
    onOpen() {
        this.titleEl.setText("插入或编辑表格");
        this.contentEl.addClass("mmc-table-modal");
        const description = this.contentEl.createEl("p", {
            cls: "setting-item-description",
            text: "可以直接编辑单元格，也可以粘贴 Markdown 表格后点击“解析 Markdown”。"
        });
        description.setAttr("aria-live", "polite");
        const toolbar = this.contentEl.createDiv({ cls: "mmc-table-toolbar" });
        const addRow = toolbar.createEl("button", { text: "+ 行", type: "button" });
        const removeRow = toolbar.createEl("button", { text: "− 行", type: "button" });
        const addColumn = toolbar.createEl("button", { text: "+ 列", type: "button" });
        const removeColumn = toolbar.createEl("button", { text: "− 列", type: "button" });
        const toMarkdown = toolbar.createEl("button", { text: "生成 Markdown", type: "button" });
        this.gridEl = this.contentEl.createDiv({ cls: "mmc-table-editor-grid" });
        this.renderGrid();
        const markdownLabel = this.contentEl.createEl("label", { text: "Markdown 表格" });
        this.markdownEl = markdownLabel.createEl("textarea", {
            cls: "mmc-table-markdown",
            attr: { placeholder: "| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |" }
        });
        this.markdownEl.rows = 8;
        this.markdownEl.value = (0, model_1.tableToMarkdown)(this.table);
        const parseButton = markdownLabel.createEl("button", { text: "解析 Markdown", type: "button" });
        addRow.addEventListener("click", () => {
            this.collectGrid();
            this.table.rows.push(this.table.headers.map(() => ""));
            this.renderGrid();
        });
        removeRow.addEventListener("click", () => {
            this.collectGrid();
            if (this.table.rows.length)
                this.table.rows.pop();
            this.renderGrid();
        });
        addColumn.addEventListener("click", () => {
            var _a;
            var _b;
            this.collectGrid();
            if (this.table.headers.length >= 12) {
                new obsidian_1.Notice("最多支持 12 列");
                return;
            }
            this.table.headers.push(`列 ${this.table.headers.length + 1}`);
            (_a = (_b = this.table).alignments) !== null && _a !== void 0 ? _a : (_b.alignments = []);
            this.table.alignments.push("left");
            this.table.rows.forEach((row) => row.push(""));
            this.renderGrid();
        });
        removeColumn.addEventListener("click", () => {
            var _a;
            this.collectGrid();
            if (this.table.headers.length <= 1)
                return;
            this.table.headers.pop();
            (_a = this.table.alignments) === null || _a === void 0 ? void 0 : _a.pop();
            this.table.rows.forEach((row) => row.pop());
            this.renderGrid();
        });
        toMarkdown.addEventListener("click", () => {
            this.collectGrid();
            this.markdownEl.value = (0, model_1.tableToMarkdown)(this.table);
        });
        parseButton.addEventListener("click", () => {
            const parsed = (0, model_1.parseMarkdownTable)(this.markdownEl.value);
            if (!parsed) {
                new obsidian_1.Notice("未识别到有效的 Markdown 表格");
                return;
            }
            this.table = parsed;
            this.renderGrid();
            new obsidian_1.Notice("Markdown 表格已解析");
        });
        const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
        const cancel = actions.createEl("button", { text: "取消", type: "button" });
        const save = actions.createEl("button", { text: "保存表格", type: "button", cls: "mod-cta" });
        cancel.addEventListener("click", () => this.close());
        save.addEventListener("click", () => {
            var _a;
            this.collectGrid();
            if (!this.table.headers.some((header) => header.trim())) {
                new obsidian_1.Notice("至少需要一个表头");
                return;
            }
            this.table.source = (_a = this.table.source) !== null && _a !== void 0 ? _a : "manual";
            this.submit(this.table);
            this.close();
        });
    }
    /**
     * 渲染grid，并保持模型、界面和持久化状态的一致性。
     */
    renderGrid() {
        this.gridEl.empty();
        const table = this.gridEl.createEl("table");
        const head = table.createEl("thead").createEl("tr");
        this.table.headers.forEach((header, index) => {
            var _a, _b;
            const th = head.createEl("th");
            const input = th.createEl("input", { type: "text", attr: { "data-kind": "header", "data-column": String(index) } });
            input.value = header;
            const align = th.createEl("select", { attr: { "data-kind": "alignment", "data-column": String(index), "aria-label": `第 ${index + 1} 列对齐方式` } });
            [['left', '左'], ['center', '中'], ['right', '右']].forEach(([value, label]) => align.createEl("option", { text: label, attr: { value } }));
            align.value = (_b = (_a = this.table.alignments) === null || _a === void 0 ? void 0 : _a[index]) !== null && _b !== void 0 ? _b : "left";
        });
        const body = table.createEl("tbody");
        this.table.rows.forEach((row, rowIndex) => {
            const tr = body.createEl("tr");
            this.table.headers.forEach((_, columnIndex) => {
                var _a;
                const td = tr.createEl("td");
                const input = td.createEl("textarea", { attr: { "data-kind": "cell", "data-row": String(rowIndex), "data-column": String(columnIndex) } });
                input.rows = 2;
                input.value = (_a = row[columnIndex]) !== null && _a !== void 0 ? _a : "";
            });
        });
    }
    /**
     * 遍历并收集grid，并保持模型、界面和持久化状态的一致性。
     */
    collectGrid() {
        const headers = Array.from(this.gridEl.querySelectorAll('input[data-kind="header"]'));
        headers.forEach((input) => {
            const column = Number(input.dataset.column);
            if (Number.isInteger(column))
                this.table.headers[column] = input.value.trim().slice(0, 2000);
        });
        const alignments = Array.from(this.gridEl.querySelectorAll('select[data-kind="alignment"]'));
        this.table.alignments = this.table.headers.map(() => "left");
        alignments.forEach((input) => {
            const column = Number(input.dataset.column);
            if (Number.isInteger(column))
                this.table.alignments[column] = input.value === "center" || input.value === "right" ? input.value : "left";
        });
        const cells = Array.from(this.gridEl.querySelectorAll('textarea[data-kind="cell"]'));
        cells.forEach((input) => {
            const row = Number(input.dataset.row);
            const column = Number(input.dataset.column);
            if (Number.isInteger(row) && Number.isInteger(column) && this.table.rows[row])
                this.table.rows[row][column] = input.value.slice(0, 2000);
        });
    }
}
exports.TableEditModal = TableEditModal;
/**
 * CodeEditModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class CodeEditModal extends obsidian_1.Modal {
    /**
     * 创建 CodeEditModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
     * @param block 当前内容块，通常是文字块或图片块。
     * @param submit 该参数用于 constructor 流程中的输入或控制。
     */
    constructor(app, block, submit) {
        super(app);
        this.block = block;
        this.submit = submit;
    }
    /**
     * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
     */
    onOpen() {
        var _a, _b, _c, _d;
        this.titleEl.setText("插入或编辑代码");
        this.contentEl.addClass("mmc-code-modal");
        const languageLabel = this.contentEl.createEl("label", { text: "代码语言" });
        const languageInput = languageLabel.createEl("input", { type: "text", attr: { placeholder: "javascript、python、css…" } });
        languageInput.value = (_b = (_a = this.block) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : "";
        const codeLabel = this.contentEl.createEl("label", { text: "代码内容" });
        const codeInput = codeLabel.createEl("textarea", { cls: "mmc-code-textarea", attr: { spellcheck: "false", placeholder: "可直接粘贴代码，或粘贴 ```语言 ... ``` fenced code block" } });
        codeInput.rows = 18;
        codeInput.value = (_d = (_c = this.block) === null || _c === void 0 ? void 0 : _c.code) !== null && _d !== void 0 ? _d : "";
        const detect = this.contentEl.createEl("button", { text: "识别 fenced code", type: "button" });
        detect.addEventListener("click", () => {
            var _a;
            const parsed = (0, model_1.parseFencedCode)(codeInput.value);
            if (!parsed) {
                new obsidian_1.Notice("没有识别到完整的 ``` fenced code block");
                return;
            }
            languageInput.value = (_a = parsed.language) !== null && _a !== void 0 ? _a : "";
            codeInput.value = parsed.code;
            new obsidian_1.Notice("代码语言和内容已识别");
        });
        const actions = this.contentEl.createDiv({ cls: "mmc-modal-actions" });
        const cancel = actions.createEl("button", { text: "取消", type: "button" });
        const save = actions.createEl("button", { text: "保存代码", type: "button", cls: "mod-cta" });
        cancel.addEventListener("click", () => this.close());
        save.addEventListener("click", () => {
            var _a;
            let language = languageInput.value.trim();
            let code = codeInput.value;
            const fenced = (0, model_1.parseFencedCode)(code);
            if (fenced) {
                language = (_a = fenced.language) !== null && _a !== void 0 ? _a : language;
                code = fenced.code;
            }
            if (!code.trim()) {
                new obsidian_1.Notice("代码内容不能为空");
                return;
            }
            this.submit({ language: language.replace(/[^a-z0-9_+#.-]/gi, "").slice(0, 40) || undefined, code });
            this.close();
        });
    }
}
exports.CodeEditModal = CodeEditModal;

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/content-modals.ts
},
11: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file modes.ts
 * @description 文章领域与显示模式共享的编号工具。
 *
 * 导图、大纲和文章模式读取同一节点树；本模块负责中文序号、标题判定、手动文章层级、子导图层级续接与可见模式容错。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISPLAY_MODE_ICONS = exports.DISPLAY_MODE_LABELS = void 0;
exports.readingAnchorPart = readingAnchorPart;
exports.chineseNumber = chineseNumber;
exports.articleNumberLabel = articleNumberLabel;
exports.articleDisplayTitle = articleDisplayTitle;
exports.isArticleHeading = isArticleHeading;
exports.resolveArticleNumbering = resolveArticleNumbering;
exports.articleChildStartLevel = articleChildStartLevel;
exports.buildArticleNodeInfo = buildArticleNodeInfo;
exports.normalizeVisibleModes = normalizeVisibleModes;
const model_1 = __bundleRequire(1);
exports.DISPLAY_MODE_LABELS = {
    mindmap: "导图",
    outline: "大纲",
    article: "文章",
    reading: "通读"
};
exports.DISPLAY_MODE_ICONS = {
    mindmap: "brain-circuit",
    outline: "list-tree",
    article: "notebook-text",
    reading: "book-open-text"
};
/**
 * Encodes a file path or node id into a collision-free DOM anchor component.
 * Percent markers remain visible as underscores, so different Chinese paths
 * cannot collapse to the same replacement string.
 */
function readingAnchorPart(value) {
    return encodeURIComponent(value).replace(/%/g, "_");
}
const CHINESE_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
/**
 * 执行“chinese number”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function chineseNumber(value) {
    var _a;
    const safe = Math.max(0, Math.floor(value));
    if (safe < 10)
        return (_a = CHINESE_DIGITS[safe]) !== null && _a !== void 0 ? _a : String(safe);
    if (safe < 20)
        return `十${safe % 10 ? CHINESE_DIGITS[safe % 10] : ""}`;
    if (safe < 100) {
        const tens = Math.floor(safe / 10);
        const ones = safe % 10;
        return `${CHINESE_DIGITS[tens]}十${ones ? CHINESE_DIGITS[ones] : ""}`;
    }
    return String(safe);
}
/**
 * 将文章标题层级和同级序号转换为“第一章、第一节、一、（一）、1.、（1）”等常见中文文章编号，更深层级使用可读的循环规则。
 *
 * @param depth 节点在文章结构中的一基层级。
 * @param index 当前元素在同级或列表中的一基序号。
 * @returns 对应层级的文章编号文本。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function articleNumberLabel(depth, index) {
    const cn = chineseNumber(index);
    if (depth === 1)
        return `第${cn}章`;
    if (depth === 2)
        return `第${cn}节`;
    if (depth === 3)
        return `${cn}、`;
    if (depth === 4)
        return `（${cn}）`;
    if (depth === 5)
        return `${index}.`;
    if (depth === 6)
        return `（${index}）`;
    const alphabet = String.fromCharCode(64 + ((index - 1) % 26) + 1);
    return depth % 2 === 1 ? `${alphabet}.` : `（${alphabet}）`;
}
/**
 * 按编号末尾标点决定标题是否需要空格，使“第一章 标题”与“一、标题”“1.标题”等格式同时保持自然。
 *
 * @param label 已计算的文章编号。
 * @param title 节点标题文字。
 * @returns 可直接显示在文章和目录中的完整标题。
 */
function articleDisplayTitle(label, title) {
    if (!label)
        return title;
    return /[、.）]$/.test(label) ? `${label}${title}` : `${label} ${title}`;
}
/**
 * A node is an article heading when it owns local descendants or represents a
 * linked child map. A sub-map node is therefore still a chapter/section even
 * when its children live in another .mindmap file.
 */
function isArticleHeading(node) {
    var _a;
    return node.children.length > 0 || Boolean((_a = node.submap) === null || _a === void 0 ? void 0 : _a.path);
}
/**
 * 解析单个节点的文章编号状态。手动模式只覆盖当前节点所在子树的最高文章层级，
 * 不再强制末端节点标题化；同级中只要存在自然标题，普通末端节点也会按同级标题编号，
 * 从而避免首个“词义”等节点丢失序号。关闭模式兼容旧版 skipArticleNumbering 字段。
 *
 * @param node 要解析的节点。
 * @param defaultLevel 根据父节点层级推导出的默认文章层级。
 * @param siblingHasHeading 当前同级中是否存在自然标题。
 * @returns 供文章正文、目录和子导图深度计算共同使用的编号状态。
 */
function resolveArticleNumbering(node, defaultLevel, siblingHasHeading) {
    var _a, _b;
    const mode = (_a = node.articleNumberingMode) !== null && _a !== void 0 ? _a : (node.skipArticleNumbering === true ? "none" : "auto");
    const manual = mode === "manual";
    const requestedLevel = Number.isFinite(node.articleNumberingLevel) ? Math.floor((_b = node.articleNumberingLevel) !== null && _b !== void 0 ? _b : defaultLevel) : defaultLevel;
    const level = manual ? Math.min(8, Math.max(1, requestedLevel)) : Math.max(1, Math.floor(defaultLevel));
    const isHeading = isArticleHeading(node) || siblingHasHeading;
    return {
        level,
        isHeading,
        skipped: mode === "none",
        shouldNumber: mode !== "none" && isHeading
    };
}
/**
 * 计算一个物理导图根节点的首级子节点应使用的文章层级。根节点的手动层级表示
 * 当前脑图正文的最高可见层级，文档标题本身不编号，一级子节点直接使用所选层级。
 *
 * @param root 当前物理导图的根节点。
 * @param baseDepth 当前文件根节点在跨文件文章中的基础层级。
 * @returns 首级子节点的默认文章层级。
 */
function articleChildStartLevel(root, baseDepth = 0) {
    var _a;
    const normalizedBaseDepth = Math.max(0, Math.floor(baseDepth));
    return root.articleNumberingMode === "manual" && Number.isFinite(root.articleNumberingLevel)
        ? Math.min(8, Math.max(1, Math.floor((_a = root.articleNumberingLevel) !== null && _a !== void 0 ? _a : normalizedBaseDepth)))
        : normalizedBaseDepth + 1;
}
/**
 * Build the article representation for one physical .mindmap file.
 * `baseDepth` is the absolute article depth represented by this file's root.
 * A manually configured node replaces its inferred highest level and its
 * descendants continue from that level. Heading/body classification remains
 * structural: leaf peers of headings become same-level headings, while an
 * isolated terminal node remains body text.
 *
 * @param root 当前物理导图的根节点。
 * @param baseDepth 根节点在整篇文章中的绝对基础层级。
 * @returns 按显示顺序展开的文章节点信息。
 */
function buildArticleNodeInfo(root, baseDepth = 0) {
    const result = [];
    const visitChildren = (parent, defaultLevel) => {
        var _a;
        const siblingHasHeading = parent.children.some((child) => isArticleHeading(child));
        const numberedIndexes = new Map();
        for (const child of parent.children) {
            const numbering = resolveArticleNumbering(child, defaultLevel, siblingHasHeading);
            const numberedIndex = numbering.shouldNumber && !numbering.skipped
                ? ((_a = numberedIndexes.get(numbering.level)) !== null && _a !== void 0 ? _a : 0) + 1
                : 0;
            if (numberedIndex)
                numberedIndexes.set(numbering.level, numberedIndex);
            const label = numberedIndex ? articleNumberLabel(numbering.level, numberedIndex) : "";
            const title = (0, model_1.nodePrimaryText)(child) || (numbering.isHeading ? "未命名标题" : "");
            result.push({
                node: child,
                depth: numbering.level,
                label,
                title,
                displayTitle: articleDisplayTitle(label, title),
                isHeading: numbering.isHeading,
                skipped: numbering.skipped,
                anchor: `mindmap-article-${child.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`
            });
            if (child.children.length)
                visitChildren(child, numbering.level + 1);
        }
    };
    visitChildren(root, articleChildStartLevel(root, baseDepth));
    return result;
}
/**
 * 校验并规范化visible modes，并保持模型、界面和持久化状态的一致性。
 *
 * @param modes 该参数用于 normalize visible modes 流程中的输入或控制。
 * @returns 按当前规则构建的集合结果。
 */
function normalizeVisibleModes(modes) {
    const raw = Array.isArray(modes) ? modes : [];
    const result = [];
    for (const value of raw) {
        if ((value === "mindmap" || value === "outline" || value === "article" || value === "reading") && !result.includes(value))
            result.push(value);
    }
    return result.length ? result : ["mindmap", "outline", "article", "reading"];
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/article/modes.ts
},
12: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file article-style.ts
 * @description 文章领域的样式预设与解析。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARTICLE_STYLE_PRESETS = void 0;
exports.resolveArticleStyle = resolveArticleStyle;
exports.ARTICLE_STYLE_PRESETS = {
    classic: { preset: "classic", tocStyle: "card", fontSize: 16, lineHeight: 1.85 },
    book: { preset: "book", fontFamily: "Georgia, 'Noto Serif SC', serif", textColor: "#332b24", headingColor: "#241c16", accentColor: "#8b5e3c", backgroundColor: "#fffdf7", tocStyle: "lines", fontSize: 17, lineHeight: 2 },
    modern: { preset: "modern", fontFamily: "Inter, 'Microsoft YaHei', sans-serif", textColor: "#243247", headingColor: "#12213a", accentColor: "#2563eb", backgroundColor: "#f8fafc", tocStyle: "card", fontSize: 16, lineHeight: 1.75 },
    minimal: { preset: "minimal", fontFamily: "Arial, 'Microsoft YaHei', sans-serif", textColor: "#27272a", headingColor: "#18181b", accentColor: "#52525b", backgroundColor: "#ffffff", tocStyle: "plain", fontSize: 15, lineHeight: 1.8 }
};
/**
 * 解析文章样式预设，并叠加当前文档的自定义值。
 *
 * @param style 文档保存的文章样式。
 * @returns 可直接用于渲染的完整样式。
 */
function resolveArticleStyle(style) {
    var _a;
    const preset = (_a = style === null || style === void 0 ? void 0 : style.preset) !== null && _a !== void 0 ? _a : "classic";
    return { ...exports.ARTICLE_STYLE_PRESETS[preset], ...(style !== null && style !== void 0 ? style : {}), preset };
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/article/article-style.ts
},
13: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file rich-text-dom.ts
 * @description 编辑器领域中富文本模型与可编辑 DOM 的转换。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMathJax = ensureMathJax;
exports.renderRichTextRuns = renderRichTextRuns;
exports.readRichTextEditor = readRichTextEditor;
const obsidian_1 = require("obsidian");
const model_1 = __bundleRequire(1);
let mathJaxReady = false;
let mathJaxLoading = null;
/**
 * 确保 Obsidian 的 MathJax 运行时已加载。
 *
 * @returns MathJax 可安全渲染时完成的 Promise。
 */
function ensureMathJax() {
    if (mathJaxReady)
        return Promise.resolve();
    mathJaxLoading !== null && mathJaxLoading !== void 0 ? mathJaxLoading : (mathJaxLoading = (0, obsidian_1.loadMathJax)().then(() => { mathJaxReady = true; }));
    return mathJaxLoading;
}
/**
 * 判断两个字符样式是否等价。
 *
 * @param left 左侧字符样式。
 * @param right 右侧字符样式。
 * @returns 两个样式是否具有相同字段和值。
 */
function styleEquals(left, right) {
    return JSON.stringify(left !== null && left !== void 0 ? left : {}) === JSON.stringify(right !== null && right !== void 0 ? right : {});
}
/**
 * 将富文本运行段渲染到 DOM，并按需处理 LaTeX。
 *
 * @param container 接收渲染内容的 DOM 容器。
 * @param runs 按字符样式拆分的富文本运行段。
 * @param fallbackText 无运行段时使用的纯文本。
 * @param latex 是否识别 LaTeX 公式。
 */
function renderRichTextRuns(container, runs, fallbackText, latex = true) {
    var _a;
    container.empty();
    const sourceRuns = (runs === null || runs === void 0 ? void 0 : runs.length) ? runs : [{ text: fallbackText }];
    const hasMath = latex && sourceRuns.some((run) => /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/.test(run.text));
    if (hasMath && !mathJaxReady) {
        sourceRuns.forEach((run) => container.createSpan({ cls: "mmc-rich-run", text: run.text }));
        void ensureMathJax().then(() => {
            if (container.isConnected)
                renderRichTextRuns(container, runs, fallbackText, latex);
        }).catch(() => undefined);
        return;
    }
    let renderedMath = false;
    const append = (text, style) => {
        const span = container.createSpan({ cls: "mmc-rich-run", text });
        if ((style === null || style === void 0 ? void 0 : style.bold) !== undefined)
            span.style.fontWeight = style.bold ? "700" : "400";
        if ((style === null || style === void 0 ? void 0 : style.italic) !== undefined)
            span.style.fontStyle = style.italic ? "italic" : "normal";
        const decorations = [];
        if (style === null || style === void 0 ? void 0 : style.underline)
            decorations.push("underline");
        if (style === null || style === void 0 ? void 0 : style.strike)
            decorations.push("line-through");
        if (decorations.length)
            span.style.textDecorationLine = decorations.join(" ");
        if (style === null || style === void 0 ? void 0 : style.color)
            span.style.color = style.color;
    };
    for (const run of sourceRuns) {
        if (!latex) {
            append(run.text, run.style);
            continue;
        }
        const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
        let offset = 0;
        for (const match of run.text.matchAll(pattern)) {
            const index = (_a = match.index) !== null && _a !== void 0 ? _a : 0;
            if (index > offset)
                append(run.text.slice(offset, index), run.style);
            const token = match[0];
            const display = token.startsWith("$$");
            const source = token.slice(display ? 2 : 1, display ? -2 : -1).trim();
            try {
                const math = (0, obsidian_1.renderMath)(source, display);
                math.addClass("mms-node-math");
                math.toggleClass("is-display", display);
                container.appendChild(math);
                renderedMath = true;
            }
            catch (_b) {
                append(token, run.style);
            }
            offset = index + token.length;
        }
        if (offset < run.text.length)
            append(run.text.slice(offset), run.style);
    }
    if (renderedMath)
        void (0, obsidian_1.finishRenderMath)();
}
/**
 * 合并元素标签、内联样式与继承样式。
 *
 * @param element 当前富文本元素。
 * @param inherited 从父元素继承的字符样式。
 * @returns 当前元素对应的字符样式。
 */
function styleFromElement(element, inherited) {
    var _a;
    const style = { ...inherited };
    const tag = element.tagName.toLowerCase();
    if (tag === "b" || tag === "strong")
        style.bold = true;
    if (tag === "i" || tag === "em")
        style.italic = true;
    if (tag === "u")
        style.underline = true;
    if (tag === "s" || tag === "strike" || tag === "del")
        style.strike = true;
    const inline = element.style;
    if (inline.fontWeight && (inline.fontWeight === "bold" || Number(inline.fontWeight) >= 600))
        style.bold = true;
    if (inline.fontStyle === "italic")
        style.italic = true;
    const decoration = `${inline.textDecoration} ${inline.textDecorationLine}`;
    if (decoration.includes("underline"))
        style.underline = true;
    if (decoration.includes("line-through"))
        style.strike = true;
    const fontColor = tag === "font" ? element.getAttribute("color") : null;
    const color = inline.color || fontColor || "";
    if (color) {
        const probe = document.createElement("span");
        probe.style.color = color;
        document.body.appendChild(probe);
        const normalized = (_a = getComputedStyle(probe).color.match(/\d+/g)) === null || _a === void 0 ? void 0 : _a.slice(0, 3).map(Number);
        probe.remove();
        if ((normalized === null || normalized === void 0 ? void 0 : normalized.length) === 3) {
            style.color = `#${normalized.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
        }
    }
    return style;
}
/**
 * 将 contenteditable DOM 解析回富文本运行段。
 *
 * @param editor 富文本编辑容器。
 * @returns 纯文本及规范化后的运行段。
 */
function readRichTextEditor(editor) {
    const rawRuns = [];
    const visit = (node, inherited) => {
        var _a, _b;
        if (node.nodeType === Node.TEXT_NODE) {
            const text = ((_a = node.textContent) !== null && _a !== void 0 ? _a : "").replace(/\r\n?/g, "\n");
            if (!text)
                return;
            const style = Object.values(inherited).some((value) => value !== undefined) ? { ...inherited } : undefined;
            const previous = rawRuns.at(-1);
            if (previous && styleEquals(previous.style, style))
                previous.text += text;
            else
                rawRuns.push({ text, style });
            return;
        }
        if (!(node instanceof HTMLElement))
            return;
        if (node.tagName === "BR") {
            rawRuns.push({ text: "\n" });
            return;
        }
        const style = styleFromElement(node, inherited);
        node.childNodes.forEach((child) => visit(child, style));
        if (["DIV", "P"].includes(node.tagName) && rawRuns.length && !((_b = rawRuns.at(-1)) === null || _b === void 0 ? void 0 : _b.text.endsWith("\n"))) {
            rawRuns.push({ text: "\n" });
        }
    };
    editor.childNodes.forEach((child) => visit(child, {}));
    const fallback = editor.innerText.replace(/\r\n?/g, "\n").trim();
    const richText = (0, model_1.normalizeRichText)(rawRuns, fallback);
    return { text: (0, model_1.richTextPlainText)(richText, fallback).trim(), richText };
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/rich-text-dom.ts
},
14: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file editor-modals.ts
 * @description 编辑器领域的通用预览、搜索和导出弹窗。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentExportModal = exports.SearchNodesModal = exports.OutlineModal = exports.JsonTransferModal = exports.ArticleStyleModal = exports.FormulaEditModal = exports.ImagePreviewModal = void 0;
exports.chooseImageHosts = chooseImageHosts;
const obsidian_1 = require("obsidian");
const model_1 = __bundleRequire(1);
const rich_text_dom_1 = __bundleRequire(13);
const article_style_1 = __bundleRequire(12);
const import_export_1 = __bundleRequire(15);
const node_actions_1 = __bundleRequire(17);
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
            var _a;
            const availableWidth = Math.max(320, imageWrap.clientWidth * 0.9);
            const availableHeight = Math.max(220, imageWrap.clientHeight * 0.9);
            const fit = Math.min(1, availableWidth / Math.max(1, image.naturalWidth), availableHeight / Math.max(1, image.naturalHeight));
            baseWidth = Math.max(1, image.naturalWidth * fit);
            baseHeight = Math.max(1, image.naturalHeight * fit);
            applyScale();
            sourceStatus.setText(`${(_a = sourceStatus.dataset.label) !== null && _a !== void 0 ? _a : "当前图片"} · ${image.naturalWidth}×${image.naturalHeight}`);
            sourceBar.removeClass("has-error");
        });
        image.addEventListener("error", () => {
            var _a;
            sourceStatus.setText(`${(_a = sourceStatus.dataset.label) !== null && _a !== void 0 ? _a : "当前图片"} · 加载失败`);
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
            var _a, _b;
            const resolved = (_b = (_a = this.resolveSource) === null || _a === void 0 ? void 0 : _a.call(this, candidate.source)) !== null && _b !== void 0 ? _b : candidate.source;
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
            var _a, _b;
            const resolved = (_b = (_a = this.resolveSource) === null || _a === void 0 ? void 0 : _a.call(this, candidate.source)) !== null && _b !== void 0 ? _b : candidate.source;
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
                catch (_a) {
                    preview.createSpan({ cls: "mod-warning", text: "公式语法暂时无法渲染" });
                }
            });
        };
        const insert = (template) => {
            var _a, _b;
            const start = (_a = source.selectionStart) !== null && _a !== void 0 ? _a : source.value.length;
            const end = (_b = source.selectionEnd) !== null && _b !== void 0 ? _b : start;
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
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const resolved = (0, article_style_1.resolveArticleStyle)(style);
            preset.value = resolved.preset;
            fontFamily.value = (_a = resolved.fontFamily) !== null && _a !== void 0 ? _a : "";
            textColor.value = (_b = resolved.textColor) !== null && _b !== void 0 ? _b : "#20242c";
            headingColor.value = (_c = resolved.headingColor) !== null && _c !== void 0 ? _c : "#111827";
            accentColor.value = (_d = resolved.accentColor) !== null && _d !== void 0 ? _d : "#7c3aed";
            backgroundColor.value = (_e = resolved.backgroundColor) !== null && _e !== void 0 ? _e : "#ffffff";
            tocStyle.value = (_f = resolved.tocStyle) !== null && _f !== void 0 ? _f : "card";
            fontSize.value = String((_g = resolved.fontSize) !== null && _g !== void 0 ? _g : 16);
            lineHeight.value = String((_h = resolved.lineHeight) !== null && _h !== void 0 ? _h : 1.85);
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
                var _a;
                const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
                if (!file)
                    return;
                void (async () => {
                    var _a;
                    try {
                        const extension = (_a = file.name.split(".").at(-1)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
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
            var _a;
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
                    ...((_a = node.tags) !== null && _a !== void 0 ? _a : []).map((tag) => `#${tag}`)
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

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/editor-modals.ts
},
15: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file import-export.ts
 * @description 导入导出领域的 XMind 与文章文档转换工具。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.xmindToDocument = xmindToDocument;
exports.documentToHtml = documentToHtml;
exports.readingSectionsToHtml = readingSectionsToHtml;
const fflate_1 = __bundleRequire(16);
const model_1 = __bundleRequire(1);
const modes_1 = __bundleRequire(11);
/**
 * 导入包含 content.json 的新版 XMind 归档，保留嵌套主题、画布链接和未链接画布。
 *
 * @param source Raw .xmind bytes.
 * @param fallbackTitle Filename-derived fallback title.
 * @returns Imported mind-map document.
 */
function xmindToDocument(source, fallbackTitle = "XMind 导入") {
    var _a, _b;
    const archive = (0, fflate_1.unzipSync)(new Uint8Array(source));
    const content = archive["content.json"];
    if (!content)
        throw new Error("仅支持包含 content.json 的新版 XMind 文件");
    const sheets = JSON.parse((0, fflate_1.strFromU8)(content));
    const sheet = (_a = sheets.find((item) => item.rootTopic)) !== null && _a !== void 0 ? _a : sheets[0];
    if (!(sheet === null || sheet === void 0 ? void 0 : sheet.rootTopic))
        throw new Error("XMind 文件中没有可导入的主题");
    const sheetById = new Map();
    for (const item of sheets) {
        if (item.id)
            sheetById.set(item.id, item);
        if ((_b = item.rootTopic) === null || _b === void 0 ? void 0 : _b.id)
            sheetById.set(item.rootTopic.id, item);
    }
    const importedSheets = new Set();
    const sheetReference = (topic) => {
        var _a, _b;
        const match = (_a = topic.href) === null || _a === void 0 ? void 0 : _a.match(/(?:xmind:)?#([^?#]+)/i);
        return (_b = match === null || match === void 0 ? void 0 : match[1]) !== null && _b !== void 0 ? _b : null;
    };
    const convert = (topic) => {
        var _a, _b, _c, _d, _e;
        const node = (0, model_1.createNode)(((_a = topic.title) === null || _a === void 0 ? void 0 : _a.trim()) || "未命名主题");
        node.note = ((_d = (_c = (_b = topic.notes) === null || _b === void 0 ? void 0 : _b.plain) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) || undefined;
        const children = Object.values((_e = topic.children) !== null && _e !== void 0 ? _e : {}).flatMap((items) => items !== null && items !== void 0 ? items : []);
        node.children = children.map(convert);
        return node;
    };
    const convertSheet = (current, ancestors) => {
        var _a;
        const rootTopic = current.rootTopic;
        if (!rootTopic)
            return (0, model_1.createNode)(((_a = current.title) === null || _a === void 0 ? void 0 : _a.trim()) || "未命名画布");
        importedSheets.add(current);
        ancestors.add(current);
        const root = convert(rootTopic);
        const attachLinkedSheets = (topic, node) => {
            var _a, _b;
            const linkedSheet = sheetById.get((_a = sheetReference(topic)) !== null && _a !== void 0 ? _a : "");
            if ((linkedSheet === null || linkedSheet === void 0 ? void 0 : linkedSheet.rootTopic) && !ancestors.has(linkedSheet)) {
                const linkedRoot = convertSheet(linkedSheet, ancestors);
                if (linkedRoot.text === node.text)
                    node.children.push(...linkedRoot.children);
                else
                    node.children.push(linkedRoot);
            }
            const topicChildren = Object.values((_b = topic.children) !== null && _b !== void 0 ? _b : {}).flatMap((items) => items !== null && items !== void 0 ? items : []);
            topicChildren.forEach((child, index) => {
                const childNode = node.children[index];
                if (childNode)
                    attachLinkedSheets(child, childNode);
            });
        };
        attachLinkedSheets(rootTopic, root);
        ancestors.delete(current);
        return root;
    };
    const root = convertSheet(sheet, new Set());
    for (const extraSheet of sheets) {
        if (extraSheet.rootTopic && !importedSheets.has(extraSheet))
            root.children.push(convertSheet(extraSheet, new Set()));
    }
    const title = root.text || sheet.title || fallbackTitle;
    return { ...(0, model_1.createDefaultDocument)(title), title, root };
}
const escapeHtml = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
/**
 * Produces a standalone article-style HTML document suitable for browsers,
 * Word-compatible .doc files, and printing to PDF.
 *
 * @param document Mind-map document to export.
 * @returns Complete HTML source.
 */
function documentToHtml(document) {
    return readingSectionsToHtml([{ filePath: "", document, baseDepth: 0 }]);
}
/**
 * Produces one portable article from a map and all recursively collected child
 * maps in the same order used by continuous reading mode.
 *
 * @param sections Ordered physical maps to merge.
 * @returns Complete standalone HTML source.
 */
function readingSectionsToHtml(sections) {
    var _a;
    const renderArticleNode = (document, baseDepth) => (0, modes_1.buildArticleNodeInfo)(document.root, baseDepth)
        .map((info) => {
        const title = escapeHtml(info.displayTitle || info.title || "未命名");
        const note = info.node.note ? `<p class="note">${escapeHtml(info.node.note)}</p>` : "";
        if (!info.isHeading)
            return `<p class="body-paragraph">${title}</p>${note}`;
        const level = Math.min(6, Math.max(2, info.depth + 1));
        return `<section><h${level}>${title}</h${level}>${note}</section>`;
    })
        .join("");
    const first = (_a = sections[0]) === null || _a === void 0 ? void 0 : _a.document;
    const title = escapeHtml(first ? ((0, model_1.nodePlainText)(first.root) || first.title) : "导出文档");
    const body = sections.map(({ document, baseDepth }, index) => {
        const sectionTitle = escapeHtml((0, model_1.nodePlainText)(document.root) || document.title);
        const headingLevel = Math.min(6, Math.max(1, baseDepth + 1));
        const heading = index === 0 ? "" : `<h${headingLevel}>${sectionTitle}</h${headingLevel}>`;
        return `<section class="map-section">${heading}${renderArticleNode(document, baseDepth)}</section>`;
    }).join("");
    return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title><style>
body{max-width:860px;margin:40px auto;padding:0 28px;color:#20242c;font:16px/1.85 system-ui,"Microsoft YaHei",sans-serif}
h1{text-align:center;border-bottom:2px solid #ddd;padding-bottom:18px}h2,h3,h4,h5,h6{margin-top:1.7em;color:#172033}
section{break-inside:auto}.map-section+.map-section{margin-top:3em;border-top:1px solid #ddd}.body-paragraph{margin:.75em 0;text-align:justify;text-indent:2em}.note{padding:10px 14px;color:#555;background:#f6f7f9;border-left:3px solid #6366f1}
@media print{body{margin:0;max-width:none}a{color:inherit}}
</style></head><body><article><h1>${title}</h1>${body}</article></body></html>`;
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/import/import-export.ts
},
16: function(module, exports, __bundleRequire, require) {
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

function strToU8(value, latin1) {
  if (latin1) {
    const output = new Uint8Array(value.length);
    for (let index = 0; index < value.length; index += 1) output[index] = value.charCodeAt(index);
    return output;
  }
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value);
  return Uint8Array.from(Buffer.from(value, "utf8"));
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function writeU16(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeU32(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function zipSync(files) {
  const entries = Object.entries(files).map(([name, raw]) => {
    const filename = strToU8(name);
    const data = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
    return { filename, data, crc: crc32(data) };
  });
  const localSize = entries.reduce((sum, entry) => sum + 30 + entry.filename.length + entry.data.length, 0);
  const centralSize = entries.reduce((sum, entry) => sum + 46 + entry.filename.length, 0);
  const output = new Uint8Array(localSize + centralSize + 22);
  let localOffset = 0;
  const offsets = [];
  for (const entry of entries) {
    offsets.push(localOffset);
    writeU32(output, localOffset, 0x04034b50);
    writeU16(output, localOffset + 4, 20);
    writeU16(output, localOffset + 6, 0x0800);
    writeU16(output, localOffset + 8, 0);
    writeU32(output, localOffset + 14, entry.crc);
    writeU32(output, localOffset + 18, entry.data.length);
    writeU32(output, localOffset + 22, entry.data.length);
    writeU16(output, localOffset + 26, entry.filename.length);
    output.set(entry.filename, localOffset + 30);
    output.set(entry.data, localOffset + 30 + entry.filename.length);
    localOffset += 30 + entry.filename.length + entry.data.length;
  }
  let centralOffset = localOffset;
  entries.forEach((entry, index) => {
    writeU32(output, centralOffset, 0x02014b50);
    writeU16(output, centralOffset + 4, 20);
    writeU16(output, centralOffset + 6, 20);
    writeU16(output, centralOffset + 8, 0x0800);
    writeU16(output, centralOffset + 10, 0);
    writeU32(output, centralOffset + 16, entry.crc);
    writeU32(output, centralOffset + 20, entry.data.length);
    writeU32(output, centralOffset + 24, entry.data.length);
    writeU16(output, centralOffset + 28, entry.filename.length);
    writeU32(output, centralOffset + 42, offsets[index]);
    output.set(entry.filename, centralOffset + 46);
    centralOffset += 46 + entry.filename.length;
  });
  writeU32(output, centralOffset, 0x06054b50);
  writeU16(output, centralOffset + 8, entries.length);
  writeU16(output, centralOffset + 10, entries.length);
  writeU32(output, centralOffset + 12, centralSize);
  writeU32(output, centralOffset + 16, localSize);
  return output;
}

module.exports = { strFromU8, unzipSync, strToU8, zipSync };

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/node_modules/fflate/index.js
},
17: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file node-actions.ts
 * @description 不依赖 DOM 的节点新增、批量删除、折叠和任务状态操作。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendChild = appendChild;
exports.insertSiblingAfter = insertSiblingAfter;
exports.topLevelSelectedNodeIds = topLevelSelectedNodeIds;
exports.deleteNodes = deleteNodes;
exports.setAllBranchesCollapsed = setAllBranchesCollapsed;
exports.nextTaskStatus = nextTaskStatus;
const model_1 = __bundleRequire(1);
/** 在父节点末尾插入子节点并自动展开父节点。 */
function appendChild(parent, child) {
    parent.collapsed = false;
    parent.children.push(child);
}
/** 在目标节点之后插入同级节点。 */
function insertSiblingAfter(root, targetId, sibling) {
    const parent = (0, model_1.findParent)(root, targetId);
    if (!parent)
        return false;
    const index = parent.children.findIndex((child) => child.id === targetId);
    if (index < 0)
        return false;
    parent.children.splice(index + 1, 0, sibling);
    return true;
}
/**
 * 从多选集合中过滤掉根节点、无效节点以及已被另一所选祖先覆盖的后代。
 */
function topLevelSelectedNodeIds(root, selectedIds) {
    const ids = Array.from(selectedIds).filter((id) => id !== root.id);
    return ids.filter((id) => {
        const node = (0, model_1.findNode)(root, id);
        return Boolean(node && !ids.some((otherId) => { var _a; return otherId !== id && node && (0, model_1.containsNode)((_a = (0, model_1.findNode)(root, otherId)) !== null && _a !== void 0 ? _a : root, id); }));
    });
}
/** 删除指定节点集合并返回实际删除数量。 */
function deleteNodes(root, ids) {
    let removed = 0;
    for (const id of ids) {
        if ((0, model_1.removeNode)(root, id))
            removed += 1;
    }
    return removed;
}
/**
 * 展开或折叠节点分支，并可选地将传入节点本身也设为折叠状态。
 *
 * @param root 要处理的根节点。
 * @param collapsed 是否折叠包含子节点的分支。
 * @param includeRoot 是否将 root 也作为可折叠分支处理；导入文档时保持 false，粘贴分支时使用 true。
 */
function setAllBranchesCollapsed(root, collapsed, includeRoot = false) {
    for (const node of (0, model_1.flattenNodes)(root)) {
        node.collapsed = (includeRoot || node !== root) && collapsed && node.children.length > 0;
    }
}
/** 按未设置、待办、进行中、完成的顺序循环任务状态。 */
function nextTaskStatus(current) {
    const states = {
        "": "todo",
        todo: "doing",
        doing: "done",
        done: undefined
    };
    return states[current !== null && current !== void 0 ? current : ""];
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/node-actions.ts
},
18: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file clipboard-import.ts
 * @description 编辑器剪贴板内容的节点分支解析。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClipboardNode = parseClipboardNode;
exports.parseClipboardNodes = parseClipboardNodes;
exports.parseClipboardHtml = parseClipboardHtml;
const model_1 = __bundleRequire(1);
/**
 * 解析剪贴板纯文本中的节点 JSON、Markdown 或缩进文本。
 *
 * @param text 剪贴板纯文本。
 * @returns 解析后的首个节点分支；空内容或不支持的 JSON 返回 null。
 */
function parseClipboardNode(text) {
    var _a, _b;
    return (_b = (_a = parseClipboardNodes(text)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null;
}
/**
 * 解析剪贴板载荷中的一个或多个 MindMap Studio 节点，并保留多选分支的复制顺序。
 *
 * @param text 包含插件 JSON 载荷的剪贴板纯文本。
 * @returns 按剪贴板顺序规范化后的节点；没有可识别节点内容时返回 null。
 * @remarks 保留版本 1 的单节点载荷兼容性，使旧插件复制内容和兼容集成仍可粘贴。
 */
function parseClipboardNodes(text) {
    try {
        const parsed = JSON.parse(text);
        const isNodePayload = parsed.type === "mindmap-studio-node"
            || parsed.type === "mmc-lite-node"
            || parsed.type === "smm-lite-node";
        const inputs = isNodePayload && Array.isArray(parsed.nodes)
            ? parsed.nodes
            : isNodePayload && parsed.node
                ? [parsed.node]
                : parsed.root
                    ? [parsed.root]
                    : typeof parsed.text === "string" && Array.isArray(parsed.children)
                        ? [parsed]
                        : [];
        if (!inputs.length)
            return null;
        return inputs.map((input) => {
            var _a, _b;
            return (0, model_1.normalizeDocument)({ title: (_a = input.text) !== null && _a !== void 0 ? _a : "粘贴节点", root: input }, (_b = input.text) !== null && _b !== void 0 ? _b : "粘贴节点").root;
        });
    }
    catch (_a) {
        const trimmed = text.trim();
        if (!trimmed)
            return null;
        const looksLikeMarkdown = /^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/m.test(trimmed);
        if (looksLikeMarkdown || trimmed.includes("\n")) {
            const markdown = looksLikeMarkdown ? trimmed : (0, model_1.indentedTextToMarkdown)(text);
            const document = (0, model_1.markdownToDocument)(markdown, "粘贴内容");
            if (document.root.text === "粘贴内容") {
                if (document.root.children.length === 1) {
                    return document.root.children[0] ? [document.root.children[0]] : null;
                }
                // Multiple children: unwrap directly without the wrapper node
                return document.root.children.length ? document.root.children : null;
            }
            return [document.root];
        }
        return [(0, model_1.createNode)(trimmed)];
    }
}
/**
 * 解析富剪贴板提供的嵌套 HTML 列表。
 *
 * @param html 剪贴板 HTML。
 * @returns 解析后的节点分支；没有列表时返回 null。
 */
function parseClipboardHtml(html) {
    var _a;
    if (!html.trim() || typeof DOMParser === "undefined")
        return null;
    const document = new DOMParser().parseFromString(html, "text/html");
    const firstList = document.body.querySelector("ul, ol");
    if (!firstList)
        return null;
    const parseItem = (item) => {
        var _a;
        const clone = item.cloneNode(true);
        clone.querySelectorAll("ul, ol").forEach((list) => list.remove());
        const node = (0, model_1.createNode)(((_a = clone.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "节点");
        const nested = Array.from(item.children).find((child) => child.matches("ul, ol"));
        if (nested) {
            node.children = Array.from(nested.children)
                .filter((child) => child.matches("li"))
                .map(parseItem);
        }
        return node;
    };
    const roots = Array.from(firstList.children)
        .filter((child) => child.matches("li"))
        .map(parseItem);
    if (!roots.length)
        return null;
    if (roots.length === 1)
        return (_a = roots[0]) !== null && _a !== void 0 ? _a : null;
    // Multiple roots: unwrap directly, the caller wraps in its own parent
    const root = (0, model_1.createNode)("粘贴内容");
    root.children = roots;
    return roots.length ? root : null;
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/clipboard-import.ts
},
19: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file node-image-actions.ts
 * @description 节点编辑器领域的图片保存、图床上传和镜像合并。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectNodeImage = selectNodeImage;
exports.uploadCurrentNodeImage = uploadCurrentNodeImage;
const obsidian_1 = require("obsidian");
const editor_modals_1 = __bundleRequire(14);
/**
 * 打开系统图片选择器。
 *
 * @returns 用户选择的图片文件；取消时返回 null。
 */
function selectImageFile() {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.addEventListener("change", () => { var _a, _b; return resolve((_b = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null); }, { once: true });
        input.click();
    });
}
/**
 * 选择图片并保存到仓库或上传到图床。
 *
 * @param app Obsidian 应用实例。
 * @param block 要更新的图片内容块。
 * @param mode 本地保存或远程上传模式。
 * @param callbacks 图片存储服务。
 * @returns 图片块是否发生变化。
 */
async function selectNodeImage(app, block, mode, callbacks) {
    try {
        let hostIds = [];
        if (mode === "remote") {
            const chosen = await (0, editor_modals_1.chooseImageHosts)(app, callbacks.getImageHosts(), callbacks.getDefaultUploadHostIds());
            if (!chosen)
                return false;
            hostIds = chosen;
        }
        const file = await selectImageFile();
        if (!file)
            return false;
        if (mode === "local") {
            const path = await callbacks.onSavePastedImage(file, file.name);
            block.source = path;
            block.localSource = path;
            block.remoteSources = undefined;
        }
        else {
            const batch = await callbacks.onUploadImage(file, file.name, hostIds);
            if (!batch.successes.length) {
                const message = batch.failures.map((item) => `${item.hostName}：${item.error}`).join("；") || "未知错误";
                throw new Error(message);
            }
            const uploadedAt = new Date().toISOString();
            block.source = batch.successes[0].url;
            block.localSource = undefined;
            block.remoteSources = batch.successes.map((item) => ({ ...item, uploadedAt }));
            if (batch.failures.length) {
                new obsidian_1.Notice(`部分图床上传失败：${batch.failures.map((item) => item.hostName).join("、")}`, 7000);
            }
            else {
                new obsidian_1.Notice(`已上传到：${batch.successes.map((item) => item.hostName).join("、")}`);
            }
        }
        if (!block.alt)
            block.alt = file.name.replace(/\.[^.]+$/, "");
        return true;
    }
    catch (error) {
        console.error("MindMap Studio image operation failed", error);
        new obsidian_1.Notice(`${mode === "remote" ? "上传图床" : "保存图片"}失败：${error instanceof Error ? error.message : String(error)}`, 7000);
        return false;
    }
}
/**
 * 上传图片块当前指向的本地图片，并合并已有远程镜像。
 *
 * @param app Obsidian 应用实例。
 * @param block 要更新的图片内容块。
 * @param callbacks 图片存储服务。
 * @returns 图片块是否发生变化。
 */
async function uploadCurrentNodeImage(app, block, callbacks) {
    var _a;
    try {
        const chosen = await (0, editor_modals_1.chooseImageHosts)(app, callbacks.getImageHosts(), callbacks.getDefaultUploadHostIds());
        if (!chosen)
            return false;
        const readableSource = block.localSource || block.source;
        const image = await callbacks.onReadImageSource(readableSource);
        if (!image) {
            new obsidian_1.Notice("当前图片不是可读取的本地文件；请使用‘上传到图床’重新选择图片");
            return false;
        }
        const batch = await callbacks.onUploadImage(image.blob, image.suggestedName, chosen);
        if (!batch.successes.length) {
            throw new Error(batch.failures.map((item) => `${item.hostName}：${item.error}`).join("；") || "上传失败");
        }
        const uploadedAt = new Date().toISOString();
        const existing = new Map(((_a = block.remoteSources) !== null && _a !== void 0 ? _a : []).map((item) => [item.hostId, item]));
        batch.successes.forEach((item) => existing.set(item.hostId, { ...item, uploadedAt }));
        block.remoteSources = Array.from(existing.values());
        block.localSource = readableSource;
        if (!batch.failures.length)
            block.source = batch.successes[0].url;
        if (batch.failures.length) {
            new obsidian_1.Notice(`部分图床上传失败，本地图片已保留：${batch.failures.map((item) => item.hostName).join("、")}`, 7000);
        }
        else {
            new obsidian_1.Notice(`当前图片已上传到：${batch.successes.map((item) => item.hostName).join("、")}`);
        }
        return true;
    }
    catch (error) {
        console.error("MindMap Studio existing image upload failed", error);
        new obsidian_1.Notice(`上传当前图片失败：${error instanceof Error ? error.message : String(error)}`, 7000);
        return false;
    }
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/node-image-actions.ts
},
20: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file node-rich-text-editor.ts
 * @description 节点编辑器领域的富文本块编辑、选区样式和预览。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderNodeRichTextEditor = renderNodeRichTextEditor;
const obsidian_1 = require("obsidian");
const model_1 = __bundleRequire(1);
const rich_text_dom_1 = __bundleRequire(13);
/**
 * 在指定容器中创建一个节点文字块编辑器。
 *
 * @param container 编辑器容器。
 * @param block 被直接编辑的文字内容块。
 * @param onChange 内容或格式变化后的回调。
 */
function renderNodeRichTextEditor(container, block, onChange) {
    const toolbar = container.createDiv({ cls: "mmc-rich-text-toolbar" });
    const source = container.createEl("textarea", {
        cls: "mmc-rich-text-source",
        attr: { rows: "3", spellcheck: "true", placeholder: "输入文字；可以全部删除，让节点只保留图片" }
    });
    source.value = block.text;
    let savedStart = source.value.length;
    let savedEnd = source.value.length;
    const selection = container.createDiv({ cls: "mmc-rich-selection-status" });
    container.createDiv({ cls: "mmc-rich-preview-label", text: "文字样式预览" });
    const preview = container.createDiv({ cls: "mmc-rich-text-preview" });
    const updatePreview = () => {
        (0, rich_text_dom_1.renderRichTextRuns)(preview, block.richText, block.text || "预览文字");
        preview.toggleClass("is-placeholder", !block.text);
    };
    const remember = () => {
        var _a, _b;
        savedStart = (_a = source.selectionStart) !== null && _a !== void 0 ? _a : 0;
        savedEnd = (_b = source.selectionEnd) !== null && _b !== void 0 ? _b : savedStart;
        const from = Math.min(savedStart, savedEnd);
        const to = Math.max(savedStart, savedEnd);
        selection.setText(from === to ? `光标位置：${from + 1}` : `已选择第 ${from + 1}–${to} 个字符`);
    };
    const range = () => {
        const start = Math.max(0, Math.min(block.text.length, Math.min(savedStart, savedEnd)));
        const end = Math.max(start, Math.min(block.text.length, Math.max(savedStart, savedEnd)));
        if (start === end) {
            new obsidian_1.Notice("请先选择需要设置格式的文字");
            source.focus();
            return null;
        }
        source.focus();
        source.setSelectionRange(start, end);
        return { start, end };
    };
    const styleButton = (label, title, action, cls = "") => {
        const button = toolbar.createEl("button", {
            cls: `mmc-rich-toolbar-button ${cls}`.trim(),
            text: label,
            attr: { type: "button", title }
        });
        button.addEventListener("mousedown", (event) => event.preventDefault());
        button.addEventListener("click", (event) => {
            event.preventDefault();
            action();
        });
        return button;
    };
    const applyBoolean = (key) => {
        const selected = range();
        if (!selected)
            return;
        const styles = (0, model_1.richTextCharacterStyles)(block.richText, block.text);
        const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
        block.richText = (0, model_1.applyRichTextStyleRange)(block.text, block.richText, selected.start, selected.end, { [key]: !enabled });
        updatePreview();
        onChange();
        source.setSelectionRange(selected.start, selected.end);
        remember();
    };
    styleButton("B", "加粗所选文字", () => applyBoolean("bold"), "is-bold");
    styleButton("I", "斜体所选文字", () => applyBoolean("italic"), "is-italic");
    styleButton("U", "给所选文字加下划线", () => applyBoolean("underline"), "is-underline");
    const colorLabel = toolbar.createEl("label", {
        cls: "mmc-rich-color-button",
        attr: { title: "修改所选文字颜色" }
    });
    colorLabel.createSpan({ text: "颜色" });
    const colorLine = colorLabel.createSpan({ cls: "mmc-rich-color-line" });
    const color = colorLabel.createEl("input", { type: "color", attr: { "aria-label": "文字颜色" } });
    color.value = "#ef4444";
    colorLine.style.backgroundColor = color.value;
    color.addEventListener("input", () => {
        colorLine.style.backgroundColor = color.value;
    });
    color.addEventListener("change", () => {
        const selected = range();
        if (!selected)
            return;
        block.richText = (0, model_1.applyRichTextStyleRange)(block.text, block.richText, selected.start, selected.end, { color: color.value });
        updatePreview();
        onChange();
    });
    styleButton("清除格式", "清除所选文字格式", () => {
        const selected = range();
        if (!selected)
            return;
        block.richText = (0, model_1.applyRichTextStyleRange)(block.text, block.richText, selected.start, selected.end, null);
        updatePreview();
        onChange();
    }, "is-wide");
    source.addEventListener("select", remember);
    source.addEventListener("keyup", remember);
    source.addEventListener("mouseup", remember);
    source.addEventListener("input", () => {
        const next = source.value.replace(/\r?\n/g, " ");
        block.richText = (0, model_1.reconcileRichTextAfterEdit)(block.text, block.richText, next);
        block.text = next;
        source.value = next;
        remember();
        updatePreview();
        onChange();
    });
    updatePreview();
    remember();
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/node-rich-text-editor.ts
},
21: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file drag-drop.ts
 * @description 节点拖放合法性与指针落点的纯计算规则。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.canMoveNodes = canMoveNodes;
exports.resolveDropPosition = resolveDropPosition;
exports.isRightChildZone = isRightChildZone;
const model_1 = __bundleRequire(1);
/**
 * 判断一个或一组已选节点能否移动到目标节点。
 */
function canMoveNodes(root, selectedIds, draggedId, targetId) {
    if (!draggedId || draggedId === root.id || draggedId === targetId)
        return false;
    const candidateIds = selectedIds.has(draggedId) && selectedIds.size > 1
        ? Array.from(selectedIds)
        : [draggedId];
    if (candidateIds.includes(targetId) || candidateIds.includes(root.id))
        return false;
    return candidateIds.every((id) => {
        const dragged = (0, model_1.findNode)(root, id);
        return Boolean(dragged && !(0, model_1.containsNode)(dragged, targetId));
    });
}
/**
 * 根据指针在节点中的位置返回同级前置、成为子级或同级后置。
 */
function resolveDropPosition(pointer, rect, targetIsRoot) {
    if (targetIsRoot)
        return "child";
    if (isRightChildZone(pointer, rect))
        return "child";
    const verticalRatio = rect.height > 0 ? (pointer.clientY - rect.top) / rect.height : .5;
    if (verticalRatio < .28)
        return "before";
    if (verticalRatio > .72)
        return "after";
    return "child";
}
/** 判断指针是否位于节点右侧的显式子级投放区域。 */
function isRightChildZone(pointer, rect) {
    const horizontalRatio = rect.width > 0 ? (pointer.clientX - rect.left) / rect.width : .5;
    return horizontalRatio > .72;
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/drag-drop.ts
},
22: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file history-manager.ts
 * @description 编辑器文档快照的撤销与重做管理器。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentHistory = void 0;
/**
 * 管理有界的文档快照栈，让编辑器本身只负责事务完成后的界面与保存通知。
 */
class DocumentHistory {
    /**
     * @param limitProvider 动态返回当前允许保留的历史记录数量。
     */
    constructor(limitProvider) {
        this.limitProvider = limitProvider;
        this.undoStack = [];
        this.redoStack = [];
    }
    /** 清空撤销和重做记录。 */
    reset() {
        this.undoStack = [];
        this.redoStack = [];
    }
    /**
     * 在修改前记录当前文档，并使已有重做分支失效。
     *
     * @param document 即将被修改的文档。
     */
    capture(document) {
        this.undoStack.push(this.serialize(document));
        this.trim();
        this.redoStack = [];
    }
    /**
     * 返回上一份文档，同时把当前文档放入重做栈。
     *
     * @param current 当前文档。
     */
    undo(current) {
        const previous = this.undoStack.pop();
        if (!previous)
            return null;
        this.redoStack.push(this.serialize(current));
        return this.deserialize(previous);
    }
    /**
     * 返回下一份文档，同时把当前文档放回撤销栈。
     *
     * @param current 当前文档。
     */
    redo(current) {
        const next = this.redoStack.pop();
        if (!next)
            return null;
        this.undoStack.push(this.serialize(current));
        this.trim();
        return this.deserialize(next);
    }
    /** 按设置限制裁剪最旧的历史快照。 */
    trim() {
        const limit = Math.max(10, Math.min(500, this.limitProvider()));
        while (this.undoStack.length > limit)
            this.undoStack.shift();
    }
    /** 将文档转换为与运行时对象隔离的快照。 */
    serialize(document) {
        return JSON.stringify(document);
    }
    /** 从内部快照恢复文档对象。 */
    deserialize(snapshot) {
        return JSON.parse(snapshot);
    }
}
exports.DocumentHistory = DocumentHistory;

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/history-manager.ts
},
23: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file outline-renderer.ts
 * @description 大纲模式的递归 DOM 渲染器。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderOutlineMode = renderOutlineMode;
const model_1 = __bundleRequire(1);
const modes_1 = __bundleRequire(11);
const editor_modals_1 = __bundleRequire(14);
const rich_text_dom_1 = __bundleRequire(13);
/**
 * 将同一份节点树渲染为可编辑大纲。
 */
function renderOutlineMode(container, options) {
    container.empty();
    const page = container.createDiv({ cls: "mms-outline-page" });
    const root = options.document.root;
    page.dataset.nodeId = root.id;
    const titleRow = page.createDiv({ cls: `mms-outline-row is-root${options.selectedId === root.id ? " is-selected" : ""}` });
    titleRow.dataset.nodeId = root.id;
    const title = titleRow.createDiv({ cls: "mms-outline-title is-root-title", text: (0, model_1.nodePrimaryText)(root) || options.document.title });
    options.makeInlineEditable(title, root, "导图标题");
    options.addInlineNodeActions(titleRow, root);
    titleRow.addEventListener("click", () => options.selectNode(root.id));
    renderOutlineContent(page, root, 0, options);
    const list = page.createDiv({ cls: "mms-outline-list" });
    const visit = (node, depth) => {
        var _a, _b, _c, _d, _e;
        const item = list.createDiv({ cls: `mms-outline-item depth-${Math.min(depth, 8)}` });
        item.dataset.nodeId = node.id;
        item.style.setProperty("--mms-outline-depth", String(depth));
        const firstTextBlock = (0, model_1.nodeContentBlocks)(node).find((block) => block.type === "text");
        const contentOnly = !(firstTextBlock === null || firstTextBlock === void 0 ? void 0 : firstTextBlock.text.trim()) && !node.submap
            && Boolean(node.table || node.code || node.note || (0, model_1.nodeContentBlocks)(node).some((block) => block.type === "image"));
        item.toggleClass("is-content-only", contentOnly);
        const row = item.createDiv({ cls: `mms-outline-row${options.selectedId === node.id ? " is-selected" : ""}` });
        row.dataset.nodeId = node.id;
        row.createSpan({ cls: "mms-outline-bullet", text: node.children.length || node.submap ? "◆" : "•" });
        if (node.task) {
            const task = row.createEl("input", { type: "checkbox", cls: "mms-outline-task" });
            task.checked = node.task === "done";
            task.disabled = options.readOnly;
            task.addEventListener("change", (event) => {
                event.stopPropagation();
                options.selectNode(node.id);
                options.mutate(() => { node.task = task.checked ? "done" : "todo"; });
            });
        }
        const label = (0, model_1.nodePlainText)(node) || ((_b = (_a = node.submap) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : "图片节点");
        if (node.submap) {
            const link = row.createEl("a", {
                cls: "mms-outline-title mms-submap-text-link",
                text: label,
                href: node.submap.path,
                attr: { title: `打开子导图：${(_c = node.submap.title) !== null && _c !== void 0 ? _c : node.submap.path}` }
            });
            link.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                options.selectNode(node.id);
                void options.openMindMap(node.submap.path);
            });
        }
        else {
            const text = row.createDiv({ cls: "mms-outline-title", text: label });
            options.makeInlineEditable(text, node, "节点文字");
        }
        if (node.articleNumberingMode === "manual") {
            row.createSpan({ cls: "mms-outline-badge", text: `文章层级 ${(_d = node.articleNumberingLevel) !== null && _d !== void 0 ? _d : 1} · ${(0, modes_1.articleNumberLabel)((_e = node.articleNumberingLevel) !== null && _e !== void 0 ? _e : 1, 1)}` });
        }
        else if (node.articleNumberingMode === "none" || node.skipArticleNumbering) {
            row.createSpan({ cls: "mms-outline-badge", text: "文章不编号" });
        }
        options.addInlineNodeActions(row, node);
        row.addEventListener("click", () => options.selectNode(node.id));
        row.addEventListener("dblclick", () => {
            options.selectNode(node.id);
            if (node.submap)
                void options.openMindMap(node.submap.path);
            else if (!options.readOnly)
                options.editSelected();
        });
        renderOutlineContent(item, node, depth, options);
        node.children.forEach((child) => visit(child, depth + 1));
    };
    root.children.forEach((child) => visit(child, 1));
}
/** 渲染节点主标题以外的文字、图片、表格、代码和备注内容。 */
function renderOutlineContent(container, node, depth, options) {
    var _a;
    const blocks = (0, model_1.nodeContentBlocks)(node);
    const additionalText = blocks.filter((block) => block.type === "text").slice(1);
    const images = blocks.filter((block) => block.type === "image");
    if (!additionalText.length && !images.length && !node.table && !node.code && !node.note)
        return;
    const content = container.createDiv({ cls: "mms-outline-content" });
    content.style.setProperty("--mms-outline-content-depth", String(depth));
    content.addEventListener("click", (event) => {
        event.stopPropagation();
        options.selectNode(node.id);
    });
    content.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        options.selectNode(node.id);
        if (!options.readOnly)
            options.editSelected();
    });
    for (const block of additionalText) {
        const paragraph = content.createDiv({ cls: "mms-outline-text-block" });
        (0, rich_text_dom_1.renderRichTextRuns)(paragraph, block.richText, block.text);
    }
    for (const block of images) {
        const resolved = options.resolveImage(block.source);
        const figure = content.createEl("figure", { cls: "mms-outline-image" });
        if (resolved) {
            const image = figure.createEl("img", { attr: { src: resolved, alt: (_a = block.alt) !== null && _a !== void 0 ? _a : "图片", loading: "lazy" } });
            image.addEventListener("click", () => {
                var _a;
                return new editor_modals_1.ImagePreviewModal(options.app, resolved, (_a = block.alt) !== null && _a !== void 0 ? _a : "图片", (0, model_1.imageSourceCandidates)(block, true), options.resolveImage).open();
            });
        }
        else {
            figure.createDiv({ cls: "mms-outline-image-placeholder", text: "图片无法加载" });
        }
        if (block.alt)
            figure.createEl("figcaption", { text: block.alt });
    }
    if (node.table) {
        const tableWrap = content.createDiv({ cls: "mms-outline-table-wrap" });
        const table = tableWrap.createEl("table", { cls: "mms-outline-table" });
        const heading = table.createEl("thead").createEl("tr");
        node.table.headers.forEach((header) => heading.createEl("th", { text: header }));
        const body = table.createEl("tbody");
        node.table.rows.forEach((row) => {
            const rowElement = body.createEl("tr");
            node.table.headers.forEach((_, index) => { var _a; return rowElement.createEl("td", { text: (_a = row[index]) !== null && _a !== void 0 ? _a : "" }); });
        });
    }
    if (node.code) {
        const code = content.createDiv({ cls: "mms-outline-code markdown-rendered" });
        void options.renderCode(node.code, code);
    }
    if (node.note)
        content.createDiv({ cls: "mms-outline-note", text: node.note });
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/outline-renderer.ts
},
24: function(module, exports, __bundleRequire, require) {
"use strict";
/**
 * @file article-renderer.ts
 * @description 文章模式的目录、章节、正文和分页导航渲染器。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderArticleMode = renderArticleMode;
exports.renderArticleNodeContent = renderArticleNodeContent;
const obsidian_1 = require("obsidian");
const model_1 = __bundleRequire(1);
const modes_1 = __bundleRequire(11);
const article_style_1 = __bundleRequire(12);
const editor_modals_1 = __bundleRequire(14);
const rich_text_dom_1 = __bundleRequire(13);
/** 根据文档文章样式和文章上下文渲染完整文章页。 */
function renderArticleMode(container, options) {
    var _a, _b;
    container.empty();
    const articleStyle = (0, article_style_1.resolveArticleStyle)(options.document.articleStyle);
    const page = container.createDiv({ cls: `mms-article-page article-${articleStyle.preset} toc-${(_a = articleStyle.tocStyle) !== null && _a !== void 0 ? _a : "card"}` });
    page.dataset.nodeId = options.document.root.id;
    applyArticleStyle(page, articleStyle);
    const title = page.createEl("h1", { cls: "mms-article-document-title", text: (0, model_1.nodePrimaryText)(options.document.root) || options.document.title });
    options.makeInlineEditable(title, options.document.root, "文章标题");
    options.addInlineNodeActions(page, options.document.root);
    const directoryOnly = options.showArticleToc
        && options.articleTocEntries.length > 0
        && ((_b = options.document.view) === null || _b === void 0 ? void 0 : _b.articleLandingMode) !== "article";
    if (directoryOnly) {
        renderDirectory(page, options);
        return;
    }
    for (const info of (0, modes_1.buildArticleNodeInfo)(options.document.root, options.articleBaseDepth)) {
        const section = page.createEl("section", { cls: `mms-article-node depth-${Math.min(info.depth, 8)}${options.selectedId === info.node.id ? " is-selected" : ""}` });
        section.dataset.nodeId = info.node.id;
        section.id = info.anchor;
        section.addEventListener("click", () => options.selectNode(info.node.id));
        if (info.isHeading) {
            const level = Math.min(6, info.depth + 1);
            const heading = section.createEl(`h${level}`, {
                cls: `mms-article-heading${/[、.）]$/.test(info.label) ? " is-compact-number" : ""}`
            });
            if (info.label)
                heading.createSpan({ cls: "mms-article-number", text: info.label });
            renderHeading(heading, info.node, info.title, options);
            if (info.skipped)
                heading.createSpan({ cls: "mms-article-skip-badge", text: "不编号" });
            options.addInlineNodeActions(heading, info.node);
            renderArticleNodeContent(section, info.node, false, options);
        }
        else {
            const firstTextBlock = (0, model_1.nodeContentBlocks)(info.node).find((block) => block.type === "text");
            if (firstTextBlock === null || firstTextBlock === void 0 ? void 0 : firstTextBlock.text.trim()) {
                const paragraph = section.createEl("p", { cls: "mms-article-leaf-text" });
                (0, rich_text_dom_1.renderRichTextRuns)(paragraph, firstTextBlock.richText, firstTextBlock.text);
                options.makeInlineEditable(paragraph, info.node, "正文段落");
            }
            options.addInlineNodeActions(section, info.node);
            renderArticleNodeContent(section, info.node, false, options);
        }
    }
    renderArticlePager(page, options);
}
/** 将解析后的文章样式写入文章页 CSS 变量。 */
function applyArticleStyle(page, style) {
    var _a, _b;
    if (style.fontFamily)
        page.style.setProperty("--mms-article-font", style.fontFamily);
    if (style.textColor)
        page.style.setProperty("--mms-article-text", style.textColor);
    if (style.headingColor)
        page.style.setProperty("--mms-article-heading", style.headingColor);
    if (style.accentColor)
        page.style.setProperty("--mms-article-accent", style.accentColor);
    if (style.backgroundColor)
        page.style.setProperty("--mms-article-paper", style.backgroundColor);
    page.style.setProperty("--mms-article-font-size", `${(_a = style.fontSize) !== null && _a !== void 0 ? _a : 16}px`);
    page.style.setProperty("--mms-article-line-height", String((_b = style.lineHeight) !== null && _b !== void 0 ? _b : 1.85));
}
/** 渲染文章目录页。 */
function renderDirectory(page, options) {
    const tocPage = page.createEl("nav", { cls: "mms-article-toc mms-article-toc-page" });
    tocPage.createEl("h2", { text: "目录" });
    const list = tocPage.createEl("ol");
    for (const entry of options.articleTocEntries.filter((item) => item.depth <= options.articleTocMaxDepth)) {
        const item = list.createEl("li", { cls: `depth-${Math.min(entry.depth, 8)}` });
        item.style.setProperty("--mms-article-depth", String(entry.depth));
        const link = item.createEl("a", { text: entry.displayTitle || entry.title || "未命名标题", href: entry.filePath, attr: { title: entry.breadcrumb.join(" › ") } });
        link.addEventListener("click", (event) => {
            event.preventDefault();
            void options.callbacks.onOpenMindMap(entry.filePath, entry.nodeId);
        });
        if (entry.breadcrumb.length > 1)
            item.createSpan({ cls: "mms-article-toc-breadcrumb", text: entry.breadcrumb.join(" › ") });
    }
}
/** 渲染章节标题或子导图链接。 */
function renderHeading(heading, node, title, options) {
    var _a;
    if (node.submap) {
        const headingLink = heading.createEl("a", { cls: "mms-article-heading-text mms-submap-text-link", text: title, href: node.submap.path, attr: { title: `打开子导图：${(_a = node.submap.title) !== null && _a !== void 0 ? _a : node.submap.path}` } });
        headingLink.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            options.selectNode(node.id);
            void options.callbacks.onOpenMindMap(node.submap.path);
        });
    }
    else {
        const headingText = heading.createSpan({ cls: "mms-article-heading-text", text: title });
        options.makeInlineEditable(headingText, node, "章节标题");
    }
}
/** 渲染文章节点的正文块、图片、备注、表格和代码。 */
function renderArticleNodeContent(container, node, treatTextAsBody, options) {
    var _a;
    let firstTextHandled = false;
    for (const block of (0, model_1.nodeContentBlocks)(node)) {
        if (block.type === "text") {
            if (!treatTextAsBody && !firstTextHandled) {
                firstTextHandled = true;
                continue;
            }
            firstTextHandled = true;
            const paragraph = container.createEl("p", { cls: "mms-article-paragraph" });
            (0, rich_text_dom_1.renderRichTextRuns)(paragraph, block.richText, block.text);
            if (treatTextAsBody)
                options.makeInlineEditable(paragraph, node, "正文");
        }
        else {
            const resolved = options.callbacks.resolveImage(block.source);
            const image = container.createEl("img", { cls: "mms-article-image", attr: { src: resolved !== null && resolved !== void 0 ? resolved : block.source, alt: (_a = block.alt) !== null && _a !== void 0 ? _a : "图片" } });
            image.addEventListener("click", () => {
                var _a;
                return new editor_modals_1.ImagePreviewModal(options.app, resolved !== null && resolved !== void 0 ? resolved : block.source, (_a = block.alt) !== null && _a !== void 0 ? _a : "图片", (0, model_1.imageSourceCandidates)(block, true), (source) => options.callbacks.resolveImage(source)).open();
            });
        }
    }
    if (node.note)
        container.createEl("p", { cls: "mms-article-note", text: node.note });
    if (node.table) {
        const table = container.createDiv({ cls: "mms-article-table-wrap" }).createEl("table", { cls: "mms-article-table" });
        const tr = table.createEl("thead").createEl("tr");
        node.table.headers.forEach((header) => tr.createEl("th", { text: header }));
        const body = table.createEl("tbody");
        node.table.rows.forEach((row) => {
            const rowEl = body.createEl("tr");
            node.table.headers.forEach((_, index) => { var _a; return rowEl.createEl("td", { text: (_a = row[index]) !== null && _a !== void 0 ? _a : "" }); });
        });
    }
    if (node.code)
        void options.callbacks.onRenderCode(node.code, container.createDiv({ cls: "mms-article-code markdown-rendered" }));
}
/** 渲染子文章上一节、父级、下一节与阅读完成导航。 */
function renderArticlePager(page, options) {
    var _a;
    const navigation = options.articleNavigation;
    if (!(navigation === null || navigation === void 0 ? void 0 : navigation.parentPath) || !navigation.entries.length)
        return;
    const index = (_a = options.articleNavigationIndex) !== null && _a !== void 0 ? _a : navigation.currentIndex;
    const previous = index > 0 ? navigation.entries[index - 1] : undefined;
    const next = index < navigation.entries.length - 1 ? navigation.entries[index + 1] : undefined;
    const pager = page.createEl("nav", { cls: "mms-article-pager", attr: { "aria-label": "文章前后页导航" } });
    const addTarget = (className, prefix, entry) => {
        const link = pager.createEl("button", { cls: className, attr: { type: "button", title: entry.breadcrumb.join(" › ") } });
        link.createSpan({ cls: "mms-article-pager-direction", text: prefix.trim() });
        link.createSpan({ cls: "mms-article-pager-title", text: entry.displayTitle || entry.title });
        link.addEventListener("click", () => void options.callbacks.onOpenMindMap(entry.filePath, entry.nodeId));
    };
    if (previous)
        addTarget("mms-article-pager-previous", previous.depth <= 1 ? "上一章 " : "上一节 ", previous);
    else
        pager.createSpan({ cls: "mms-article-pager-placeholder" });
    const parent = pager.createEl("button", { cls: "mms-article-pager-parent", attr: { type: "button", title: "返回上一级" } });
    (0, obsidian_1.setIcon)(parent, "corner-left-up");
    parent.createSpan({ text: "返回上一级" });
    parent.addEventListener("click", () => void options.callbacks.onOpenMindMap(navigation.parentPath));
    if (next)
        addTarget("mms-article-pager-next", next.depth <= 1 ? "下一章 " : "下一节 ", next);
    else {
        const end = pager.createEl("button", { cls: "mms-article-pager-end", attr: { type: "button", title: "返回总目录" } });
        end.createSpan({ cls: "mms-article-pager-direction", text: "阅读完成" });
        end.createSpan({ cls: "mms-article-pager-title", text: "END · 返回目录" });
        end.addEventListener("click", () => void options.callbacks.onOpenArticleDirectory(navigation.homePath));
    }
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/article-renderer.ts
},
25: function(module, exports, __bundleRequire, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSelectionFormatToolbar = attachSelectionFormatToolbar;
const COMMON_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#1f2937"
];
let lastColor = "#ef4444";
/**
 * @file selection-format-toolbar.ts
 * @description 文章、大纲和画布内联编辑可复用的文字选区悬浮格式栏。
 */
const model_1 = __bundleRequire(1);
const rich_text_dom_1 = __bundleRequire(13);
/** 为 contenteditable 元素安装随文字选区显示的格式栏。 */
function attachSelectionFormatToolbar(options) {
    const { editor } = options;
    const toolbar = document.body.createDiv({ cls: "mms-selection-format-toolbar is-hidden" });
    let savedSelection = null;
    const rememberSelection = () => {
        const selection = window.getSelection();
        if (!(selection === null || selection === void 0 ? void 0 : selection.rangeCount))
            return null;
        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer))
            return null;
        const before = range.cloneRange();
        before.selectNodeContents(editor);
        before.setEnd(range.startContainer, range.startOffset);
        savedSelection = {
            start: before.toString().length,
            end: before.toString().length + range.toString().length
        };
        return savedSelection;
    };
    const restoreSelection = (selected) => {
        var _a, _b;
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        let offset = 0;
        let startNode = null;
        let endNode = null;
        let startOffset = 0;
        let endOffset = 0;
        while (node) {
            const length = (_b = (_a = node.textContent) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
            if (!startNode && selected.start <= offset + length) {
                startNode = node;
                startOffset = Math.max(0, selected.start - offset);
            }
            if (!endNode && selected.end <= offset + length) {
                endNode = node;
                endOffset = Math.max(0, selected.end - offset);
                break;
            }
            offset += length;
            node = walker.nextNode();
        }
        if (!startNode || !endNode)
            return;
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        const selection = window.getSelection();
        selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
        selection === null || selection === void 0 ? void 0 : selection.addRange(range);
    };
    const positionToolbar = () => {
        const selection = window.getSelection();
        if (!(selection === null || selection === void 0 ? void 0 : selection.rangeCount) || selection.isCollapsed) {
            toolbar.addClass("is-hidden");
            return;
        }
        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) {
            toolbar.addClass("is-hidden");
            return;
        }
        const rect = range.getBoundingClientRect();
        toolbar.removeClass("is-hidden");
        const width = toolbar.offsetWidth;
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2));
        const top = Math.max(8, rect.top - toolbar.offsetHeight - 8);
        toolbar.style.left = `${left}px`;
        toolbar.style.top = `${top}px`;
    };
    const applyStyle = (patch) => {
        var _a;
        const selected = (_a = rememberSelection()) !== null && _a !== void 0 ? _a : savedSelection;
        if (!selected || selected.start === selected.end)
            return;
        const value = (0, rich_text_dom_1.readRichTextEditor)(editor);
        const key = Object.keys(patch)[0];
        if (key !== "color") {
            const styles = (0, model_1.richTextCharacterStyles)(value.richText, value.text);
            const enabled = styles.slice(selected.start, selected.end).every((style) => style[key] === true);
            patch = { [key]: !enabled };
        }
        const richText = (0, model_1.applyRichTextStyleRange)(value.text, value.richText, selected.start, selected.end, patch);
        (0, rich_text_dom_1.renderRichTextRuns)(editor, richText, value.text, false);
        editor.focus();
        restoreSelection(selected);
        positionToolbar();
    };
    const button = (label, title, key) => {
        const element = toolbar.createEl("button", { text: label, attr: { type: "button", title, "aria-label": title } });
        element.addClass(`is-${key}`);
        element.addEventListener("pointerdown", (event) => event.preventDefault());
        element.addEventListener("click", () => applyStyle({ [key]: true }));
    };
    button("B", `加粗（${options.shortcuts.bold}）`, "bold");
    button("I", `斜体（${options.shortcuts.italic}）`, "italic");
    button("U", `下划线（${options.shortcuts.underline}）`, "underline");
    // Color button with popover: common swatches + last color + custom picker
    const colorBtn = toolbar.createEl("button", {
        cls: "mms-color-btn",
        attr: { type: "button", title: "文字颜色" }
    });
    colorBtn.createSpan({ text: "A" });
    colorBtn.style.textDecorationColor = lastColor;
    const popover = toolbar.createDiv({ cls: "mms-color-popover is-hidden" });
    // Common color swatches
    for (const swatch of COMMON_COLORS) {
        const dot = popover.createEl("button", { attr: { type: "button", "data-color": swatch } });
        dot.style.backgroundColor = swatch;
        dot.addEventListener("click", () => {
            lastColor = swatch;
            colorBtn.style.textDecorationColor = swatch;
            applyStyle({ color: swatch });
            popover.addClass("is-hidden");
        });
    }
    // Last color row + native picker
    const customRow = popover.createDiv({ cls: "mms-color-popover-row" });
    const lastDot = customRow.createEl("button", {
        cls: "mms-color-last",
        attr: { type: "button", title: "上次颜色" }
    });
    lastDot.style.backgroundColor = lastColor;
    lastDot.addEventListener("click", () => {
        applyStyle({ color: lastColor });
        popover.addClass("is-hidden");
    });
    const nativeInput = customRow.createEl("input", {
        attr: { type: "color", "aria-label": "自定义" }
    });
    nativeInput.value = lastColor;
    nativeInput.addEventListener("input", () => {
        lastColor = nativeInput.value;
        colorBtn.style.textDecorationColor = nativeInput.value;
        lastDot.style.backgroundColor = nativeInput.value;
        applyStyle({ color: nativeInput.value });
        popover.addClass("is-hidden");
    });
    colorBtn.addEventListener("click", () => {
        rememberSelection();
        popover.toggleClass("is-hidden", !popover.hasClass("is-hidden"));
    });
    document.addEventListener("pointerdown", (closeEvent) => {
        if (!toolbar.contains(closeEvent.target) && !popover.contains(closeEvent.target)) {
            popover.addClass("is-hidden");
        }
    });
    const update = () => {
        const selected = rememberSelection();
        toolbar.toggleClass("is-hidden", !selected || selected.start === selected.end);
        if (selected && selected.start !== selected.end)
            positionToolbar();
    };
    const keydown = (event) => {
        const key = options.shortcutMatches(event, options.shortcuts.bold) ? "bold"
            : options.shortcutMatches(event, options.shortcuts.italic) ? "italic"
                : options.shortcutMatches(event, options.shortcuts.underline) ? "underline" : null;
        if (key) {
            event.preventDefault();
            applyStyle({ [key]: true });
        }
        else if (options.shortcutMatches(event, options.shortcuts.color)) {
            event.preventDefault();
            rememberSelection();
            applyStyle({ color: lastColor });
        }
    };
    editor.addEventListener("mouseup", update);
    editor.addEventListener("keyup", update);
    editor.addEventListener("keydown", keydown);
    document.addEventListener("selectionchange", update);
    return {
        toolbar,
        contains: (target) => target instanceof Node && toolbar.contains(target),
        cleanup: () => {
            editor.removeEventListener("mouseup", update);
            editor.removeEventListener("keyup", update);
            editor.removeEventListener("keydown", keydown);
            document.removeEventListener("selectionchange", update);
            toolbar.remove();
        }
    };
}

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/editor/selection-format-toolbar.ts
},
26: function(module, exports, __bundleRequire, require) {
"use strict";
/**
* @file global-search.ts
* @description 搜索领域的本地索引与导图族搜索模块。
*
* 索引缓存节点文字、文件路径和层级，监听文件变化增量更新，并递归解析父导图与子导图。
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalMindMapSearchModal = exports.MindMapSearchIndex = void 0;
exports.buildSearchEntries = buildSearchEntries;
exports.resolveHierarchicalEntries = resolveHierarchicalEntries;
exports.searchEntries = searchEntries;
exports.collectIndexedFamilyPaths = collectIndexedFamilyPaths;
const obsidian_1 = require("obsidian");
const model_1 = __bundleRequire(1);
/**
 * 校验并规范化d，并保持模型、界面和持久化状态的一致性。
 *
 * @param value 待校验、转换或比较的输入值。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function normalized(value) {
    return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}
/**
 * 执行“compact”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param value 待校验、转换或比较的输入值。
 * @param max 该参数用于 compact 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function compact(value, max = 180) {
    const text = value === null || value === void 0 ? void 0 : value.replace(/\s+/g, " ").trim();
    if (!text)
        return undefined;
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
/**
 * 执行“node display text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function nodeDisplayText(node) {
    var _a;
    const text = (0, model_1.nodePlainText)(node).trim();
    if (text)
        return text;
    if ((_a = node.code) === null || _a === void 0 ? void 0 : _a.code.trim())
        return `代码：${compact(node.code.code, 64)}`;
    if (node.table)
        return `表格：${node.table.headers.join(" / ") || `${node.table.rows.length} 行`}`;
    if ((0, model_1.nodeContentBlocks)(node).some((block) => block.type === "image"))
        return "图片节点";
    return "未命名节点";
}
/**
 * 执行“field values”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param node 当前处理的节点。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function fieldValues(node) {
    var _a, _b, _c, _d, _e, _f, _g;
    const values = [];
    const text = (0, model_1.nodePlainText)(node).trim();
    if (text)
        values.push({ kind: "节点文字", value: text });
    if ((_a = node.note) === null || _a === void 0 ? void 0 : _a.trim())
        values.push({ kind: "备注", value: node.note });
    if ((_b = node.tags) === null || _b === void 0 ? void 0 : _b.length)
        values.push({ kind: "标签", value: node.tags.join(" ") });
    if ((_c = node.link) === null || _c === void 0 ? void 0 : _c.trim())
        values.push({ kind: "链接", value: node.link });
    if ((_d = node.icon) === null || _d === void 0 ? void 0 : _d.trim())
        values.push({ kind: "图标", value: node.icon });
    if (node.task)
        values.push({ kind: "任务", value: node.task });
    if ((_e = node.submap) === null || _e === void 0 ? void 0 : _e.path)
        values.push({ kind: "子导图", value: `${(_f = node.submap.title) !== null && _f !== void 0 ? _f : ""} ${node.submap.path}` });
    if (node.code)
        values.push({ kind: "代码", value: `${(_g = node.code.language) !== null && _g !== void 0 ? _g : ""}\n${node.code.code}` });
    if (node.table)
        values.push({ kind: "表格", value: [...node.table.headers, ...node.table.rows.flat()].join(" ") });
    const imageValues = (0, model_1.nodeContentBlocks)(node)
        .filter((block) => block.type === "image")
        .map((block) => { var _a, _b; return `${(_a = block.alt) !== null && _a !== void 0 ? _a : ""} ${block.source} ${(_b = block.localSource) !== null && _b !== void 0 ? _b : ""}`; })
        .join(" ");
    if (imageValues.trim())
        values.push({ kind: "图片", value: imageValues });
    return values;
}
/**
 * 构建search entries，并保持模型、界面和持久化状态的一致性。
 *
 * @param document 要处理的思维导图文档。
 * @param filePath 仓库内 .mindmap 文件路径。
 * @returns 按当前规则构建的集合结果。
 */
function buildSearchEntries(document, filePath) {
    const entries = [];
    const visit = (node, ancestors, depth) => {
        var _a, _b, _c, _d, _e;
        const display = nodeDisplayText(node);
        const fields = fieldValues(node);
        const breadcrumb = [...ancestors, display];
        const searchText = normalized([
            document.title,
            filePath,
            ...breadcrumb,
            (0, model_1.nodeSearchText)(node),
            ...fields.map((field) => field.value)
        ].join(" "));
        entries.push({
            key: `${filePath}::${node.id}`,
            filePath,
            fileTitle: document.title || ((_a = filePath.split("/").at(-1)) === null || _a === void 0 ? void 0 : _a.replace(/\.mindmap$/i, "")) || "思维导图",
            nodeId: node.id,
            nodeText: display,
            breadcrumb,
            depth,
            searchableText: searchText,
            note: compact(node.note),
            tags: (_b = node.tags) === null || _b === void 0 ? void 0 : _b.slice(0, 20),
            matchedKinds: fields.map((field) => field.kind),
            submapPath: (_c = node.submap) === null || _c === void 0 ? void 0 : _c.path,
            isSubmapDocument: Boolean((_d = document.navigation) === null || _d === void 0 ? void 0 : _d.parentPath),
            parentMapPath: (_e = document.navigation) === null || _e === void 0 ? void 0 : _e.parentPath
        });
        node.children.forEach((child) => visit(child, breadcrumb, depth + 1));
    };
    visit(document.root, [], 0);
    return entries;
}
/**
 * 合并hierarchy，并保持模型、界面和持久化状态的一致性。
 *
 * @param prefix 该参数用于 merge hierarchy 流程中的输入或控制。
 * @param suffix 该参数用于 merge hierarchy 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function mergeHierarchy(prefix, suffix) {
    var _a;
    const left = prefix.map((item) => item.trim()).filter(Boolean);
    const right = suffix.map((item) => item.trim()).filter(Boolean);
    if (!left.length)
        return right;
    if (!right.length)
        return left;
    const merged = [...left];
    for (const item of right) {
        if (normalized((_a = merged.at(-1)) !== null && _a !== void 0 ? _a : "") === normalized(item))
            continue;
        merged.push(item);
    }
    return merged;
}
/** Resolve parent/child map relations into paths such as 古诗 › 唐诗 › 李白. */
function resolveHierarchicalEntries(files) {
    var _a, _b, _c;
    const lineageCache = new Map();
    const normalizedFiles = new Map();
    Object.entries(files).forEach(([path, file]) => normalizedFiles.set((0, obsidian_1.normalizePath)(path), file));
    const resolveLineage = (filePath, visiting = new Set()) => {
        var _a;
        const path = (0, obsidian_1.normalizePath)(filePath);
        const cached = lineageCache.get(path);
        if (cached)
            return cached;
        const file = normalizedFiles.get(path);
        const navigation = file === null || file === void 0 ? void 0 : file.navigation;
        if (!file || !(navigation === null || navigation === void 0 ? void 0 : navigation.parentPath)) {
            lineageCache.set(path, []);
            return [];
        }
        if (visiting.has(path)) {
            const fallback = [navigation.parentTitle, navigation.parentNodeText].filter((item) => Boolean(item === null || item === void 0 ? void 0 : item.trim()));
            lineageCache.set(path, fallback);
            return fallback;
        }
        const nextVisiting = new Set(visiting);
        nextVisiting.add(path);
        const parentPath = (0, obsidian_1.normalizePath)(navigation.parentPath);
        const parentFile = normalizedFiles.get(parentPath);
        if (!parentFile) {
            const fallback = [navigation.parentTitle, navigation.parentNodeText].filter((item) => Boolean(item === null || item === void 0 ? void 0 : item.trim()));
            lineageCache.set(path, fallback);
            return fallback;
        }
        const parentLineage = resolveLineage(parentPath, nextVisiting);
        const sourceEntry = navigation.parentNodeId
            ? parentFile.entries.find((entry) => entry.nodeId === navigation.parentNodeId)
            : undefined;
        const parentLocalPath = ((_a = sourceEntry === null || sourceEntry === void 0 ? void 0 : sourceEntry.breadcrumb) === null || _a === void 0 ? void 0 : _a.length)
            ? sourceEntry.breadcrumb
            : [parentFile.title, navigation.parentNodeText].filter((item) => Boolean(item === null || item === void 0 ? void 0 : item.trim()));
        const resolved = mergeHierarchy(parentLineage, parentLocalPath);
        lineageCache.set(path, resolved);
        return resolved;
    };
    const resolvedEntries = [];
    for (const [rawPath, file] of Object.entries(files)) {
        const filePath = (0, obsidian_1.normalizePath)(rawPath);
        const lineage = resolveLineage(filePath);
        const localRoot = (_c = (_b = (_a = file.entries[0]) === null || _a === void 0 ? void 0 : _a.breadcrumb) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : file.title;
        const mapHierarchy = mergeHierarchy(lineage, [localRoot]);
        for (const entry of file.entries) {
            const hierarchyBreadcrumb = mergeHierarchy(lineage, entry.breadcrumb);
            resolvedEntries.push({
                ...entry,
                hierarchyBreadcrumb,
                mapHierarchy,
                searchableText: normalized(`${entry.searchableText} ${hierarchyBreadcrumb.join(" ")} ${mapHierarchy.join(" ")}`)
            });
        }
    }
    return resolvedEntries;
}
/**
 * 执行“result snippet”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param entry 该参数用于 result snippet 流程中的输入或控制。
 * @param query 用户输入的搜索关键词。
 * @returns 计算、解析或序列化后的字符串结果。
 */
function resultSnippet(entry, query, useRegex = false) {
    var _a, _b, _c, _d, _e;
    const queryNormalized = useRegex ? query : normalized(query);
    const candidates = [
        { kind: "节点文字", value: entry.nodeText },
        { kind: "备注", value: entry.note },
        { kind: "标签", value: (_a = entry.tags) === null || _a === void 0 ? void 0 : _a.join("、") },
        { kind: "层级路径", value: ((_b = entry.hierarchyBreadcrumb) !== null && _b !== void 0 ? _b : entry.breadcrumb).join(" › ") },
        { kind: "文件", value: `${entry.fileTitle} ${entry.filePath}` },
        { kind: "内容", value: entry.searchableText }
    ];
    let matched;
    if (useRegex) {
        try {
            const regex = new RegExp(query, "gi");
            matched = candidates.find((candidate) => candidate.value && regex.test(candidate.value));
        }
        catch ( /* invalid regex */_f) { /* invalid regex */ }
    }
    else {
        matched = candidates.find((candidate) => candidate.value && normalized(candidate.value).includes(queryNormalized));
    }
    return {
        kind: (_c = matched === null || matched === void 0 ? void 0 : matched.kind) !== null && _c !== void 0 ? _c : "内容",
        snippet: (_e = compact((_d = matched === null || matched === void 0 ? void 0 : matched.value) !== null && _d !== void 0 ? _d : entry.nodeText, 220)) !== null && _e !== void 0 ? _e : entry.nodeText
    };
}
/**
 * 执行“search entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param entries 该参数用于 search entries 流程中的输入或控制。
 * @param query 用户输入的搜索关键词。
 * @param limit 允许返回或保留的最大条目数。
 * @returns 按当前规则构建的集合结果。
 */
function searchEntries(entries, query, limit = 100, useRegex = false) {
    var _a, _b, _c, _d;
    if (useRegex) {
        let regex;
        try {
            regex = new RegExp(query, "gi");
        }
        catch (_e) {
            return [];
        }
        const results = [];
        for (const entry of entries) {
            if (!regex.test(entry.searchableText))
                continue;
            regex.lastIndex = 0;
            const nodeText = entry.nodeText;
            const fileTitle = entry.fileTitle;
            let score = 0;
            if (nodeText && regex.test(nodeText)) {
                score += 500;
                regex.lastIndex = 0;
            }
            if (fileTitle && regex.test(fileTitle)) {
                score += 180;
                regex.lastIndex = 0;
            }
            score += Math.max(0, 25 - entry.depth * 2);
            const { kind, snippet } = resultSnippet(entry, query, true);
            results.push({ ...entry, score, matchedKind: kind, snippet });
        }
        return results.sort((left, right) => right.score - left.score || left.filePath.localeCompare(right.filePath) || left.depth - right.depth).slice(0, limit);
    }
    const phrase = normalized(query);
    if (!phrase)
        return [];
    const terms = phrase.split(/\s+/).filter(Boolean);
    const results = [];
    for (const entry of entries) {
        if (!terms.every((term) => entry.searchableText.includes(term)))
            continue;
        const nodeText = normalized(entry.nodeText);
        const fileTitle = normalized(entry.fileTitle);
        const breadcrumb = normalized(((_a = entry.hierarchyBreadcrumb) !== null && _a !== void 0 ? _a : entry.breadcrumb).join(" "));
        let score = 0;
        if (nodeText === phrase)
            score += 500;
        else if (nodeText.startsWith(phrase))
            score += 320;
        else if (nodeText.includes(phrase))
            score += 230;
        if (fileTitle === phrase)
            score += 180;
        else if (fileTitle.includes(phrase))
            score += 90;
        if (breadcrumb.includes(phrase))
            score += 70;
        if (normalized((_c = (_b = entry.tags) === null || _b === void 0 ? void 0 : _b.join(" ")) !== null && _c !== void 0 ? _c : "").includes(phrase))
            score += 100;
        if (normalized((_d = entry.note) !== null && _d !== void 0 ? _d : "").includes(phrase))
            score += 60;
        if (entry.isSubmapDocument)
            score += 5;
        score += Math.max(0, 25 - entry.depth * 2);
        const { kind, snippet } = resultSnippet(entry, query);
        results.push({ ...entry, score, matchedKind: kind, snippet });
    }
    return results.sort((left, right) => right.score - left.score || left.filePath.localeCompare(right.filePath) || left.depth - right.depth).slice(0, limit);
}
/**
 * 从当前文件向上寻找最顶层父导图，再向下递归收集全部后代子导图，形成 Ctrl/Cmd+Shift+F 使用的“当前导图族”搜索范围。
 *
 * @param files 该参数用于 collect indexed family paths 流程中的输入或控制。
 * @param rootPath 该参数用于 collect indexed family paths 流程中的输入或控制。
 * @returns 计算、解析或序列化后的字符串结果。
 * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
 */
function collectIndexedFamilyPaths(files, rootPath) {
    var _a, _b, _c;
    const normalizedFiles = new Map(Object.entries(files).map(([path, value]) => [(0, obsidian_1.normalizePath)(path), value]));
    const family = new Set();
    const queue = [(0, obsidian_1.normalizePath)(rootPath)];
    while (queue.length) {
        const path = (0, obsidian_1.normalizePath)((_a = queue.shift()) !== null && _a !== void 0 ? _a : "");
        if (!path || family.has(path) || !normalizedFiles.has(path))
            continue;
        family.add(path);
        const indexed = normalizedFiles.get(path);
        for (const entry of (_b = indexed === null || indexed === void 0 ? void 0 : indexed.entries) !== null && _b !== void 0 ? _b : []) {
            const childPath = entry.submapPath ? (0, obsidian_1.normalizePath)(entry.submapPath) : "";
            if (childPath && normalizedFiles.has(childPath) && !family.has(childPath))
                queue.push(childPath);
        }
        for (const [candidatePath, candidate] of normalizedFiles) {
            const parentPath = (_c = candidate.entries[0]) === null || _c === void 0 ? void 0 : _c.parentMapPath;
            if (parentPath && (0, obsidian_1.normalizePath)(parentPath) === path && !family.has(candidatePath))
                queue.push(candidatePath);
        }
    }
    return family;
}
/**
 * MindMapSearchIndex 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class MindMapSearchIndex {
    /**
     * 创建 MindMapSearchIndex 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
     * @param indexPath 该参数用于 constructor 流程中的输入或控制。
     * @param extension 该参数用于 constructor 流程中的输入或控制。
     */
    constructor(app, indexPath, extension = "mindmap") {
        this.app = app;
        this.indexPath = indexPath;
        this.extension = extension;
        this.data = { version: 2, generatedAt: new Date(0).toISOString(), files: {} };
        this.ready = false;
        this.building = false;
        this.saveTimer = null;
        this.fileTimers = new Map();
        this.rebuildPromise = null;
    }
    /**
     * 执行“initialize”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    async initialize() {
        await this.load();
        await this.rebuildChangedFiles();
    }
    /**
     * 执行“destroy”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     */
    destroy() {
        if (this.saveTimer !== null)
            window.clearTimeout(this.saveTimer);
        for (const timer of this.fileTimers.values())
            window.clearTimeout(timer);
        this.fileTimers.clear();
        void this.saveNow();
    }
    /**
     * 读取并返回status，并保持模型、界面和持久化状态的一致性。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    getStatus() {
        const files = Object.keys(this.data.files).length;
        const nodes = Object.values(this.data.files).reduce((sum, file) => sum + file.entries.length, 0);
        return { ready: this.ready, building: this.building, files, nodes, lastBuiltAt: this.data.generatedAt };
    }
    /**
     * 执行“all entries”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param filePaths 该参数用于 all entries 流程中的输入或控制。
     * @returns 按当前规则构建的集合结果。
     */
    allEntries(filePaths) {
        const resolved = resolveHierarchicalEntries(this.data.files);
        if (!filePaths)
            return resolved;
        const normalizedPaths = new Set(Array.from(filePaths, (path) => (0, obsidian_1.normalizePath)(path)));
        return resolved.filter((entry) => normalizedPaths.has((0, obsidian_1.normalizePath)(entry.filePath)));
    }
    /**
     * 读取并返回scoped status，并保持模型、界面和持久化状态的一致性。
     *
     * @param filePaths 该参数用于 get scoped status 流程中的输入或控制。
     * @returns 计算得到的数值结果。
     */
    getScopedStatus(filePaths) {
        const normalizedPaths = new Set(Array.from(filePaths, (path) => (0, obsidian_1.normalizePath)(path)));
        let files = 0;
        let nodes = 0;
        for (const path of normalizedPaths) {
            const indexed = this.data.files[path];
            if (!indexed)
                continue;
            files += 1;
            nodes += indexed.entries.length;
        }
        return { files, nodes };
    }
    /**
     * 执行“search”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param query 用户输入的搜索关键词。
     * @param limit 允许返回或保留的最大条目数。
     * @param filePaths 该参数用于 search 流程中的输入或控制。
     * @returns 按当前规则构建的集合结果。
     */
    search(query, limit = 100, filePaths, useRegex = false) {
        return searchEntries(this.allEntries(filePaths), query, limit, useRegex);
    }
    /**
     * Refresh a parent map and every recursively linked child map, then return the
     * exact set of files that belongs to that map family. This is deliberately
     * on-demand so an existing child map is searchable without recreating it or
     * manually rebuilding the whole-vault index.
     */
    async refreshFamily(rootPath, currentDocument) {
        var _a, _b, _c, _d, _e, _f;
        const normalizedRoot = (0, obsidian_1.normalizePath)(rootPath);
        const family = new Set();
        const documents = new Map();
        if (currentDocument)
            documents.set(normalizedRoot, currentDocument);
        // If search is opened from a child map, first climb to the top parent so
        // “唐诗” still belongs to the complete “古诗 › 唐诗” map family.
        let familyRoot = normalizedRoot;
        let climbDocument = currentDocument;
        const climbed = new Set();
        while (((_a = climbDocument === null || climbDocument === void 0 ? void 0 : climbDocument.navigation) === null || _a === void 0 ? void 0 : _a.parentPath) && !climbed.has(familyRoot)) {
            climbed.add(familyRoot);
            const parent = this.resolveSubmapFile(climbDocument.navigation.parentPath, familyRoot);
            if (!parent)
                break;
            familyRoot = parent.path;
            try {
                climbDocument = (0, model_1.parseDocument)(await this.app.vault.cachedRead(parent), parent.basename);
                documents.set(parent.path, climbDocument);
            }
            catch (error) {
                console.warn(`MindMap Studio could not read parent map ${parent.path}`, error);
                break;
            }
        }
        const queue = [familyRoot];
        while (queue.length) {
            const path = (0, obsidian_1.normalizePath)((_b = queue.shift()) !== null && _b !== void 0 ? _b : "");
            if (!path || family.has(path))
                continue;
            const file = this.app.vault.getAbstractFileByPath(path);
            if (!(file instanceof obsidian_1.TFile) || file.extension.toLocaleLowerCase() !== this.extension)
                continue;
            family.add(path);
            let document = documents.get(path);
            if (!document) {
                try {
                    document = (0, model_1.parseDocument)(await this.app.vault.cachedRead(file), file.basename);
                }
                catch (error) {
                    console.warn(`MindMap Studio could not read map family member ${path}`, error);
                    continue;
                }
            }
            this.data.files[path] = {
                mtime: file.stat.mtime,
                size: file.stat.size,
                title: document.title,
                navigation: document.navigation,
                entries: buildSearchEntries(document, path)
            };
            for (const node of this.walkNodes(document.root)) {
                const child = this.resolveSubmapFile((_c = node.submap) === null || _c === void 0 ? void 0 : _c.path, path);
                if (child && !family.has(child.path))
                    queue.push(child.path);
            }
            // Compatibility fallback: a child document also records its parent path.
            // This recovers older maps whose parent node lost the submap field.
            for (const [candidatePath, indexed] of Object.entries(this.data.files)) {
                const parentPath = (_e = (_d = indexed.navigation) === null || _d === void 0 ? void 0 : _d.parentPath) !== null && _e !== void 0 ? _e : (_f = indexed.entries[0]) === null || _f === void 0 ? void 0 : _f.parentMapPath;
                const resolvedParent = this.resolveSubmapFile(parentPath, candidatePath);
                if ((resolvedParent === null || resolvedParent === void 0 ? void 0 : resolvedParent.path) === path && !family.has(candidatePath))
                    queue.push(candidatePath);
            }
        }
        // Merge relationships already present in the index. This covers older child
        // maps that only retain navigation.parentPath and no longer have a matching
        // submap field on the parent node.
        for (const indexedPath of collectIndexedFamilyPaths(this.data.files, normalizedRoot))
            family.add(indexedPath);
        this.data.generatedAt = new Date().toISOString();
        this.ready = true;
        this.scheduleSave();
        return family;
    }
    /**
     * 执行“queue file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param delay 该参数用于 queue file 流程中的输入或控制。
     */
    queueFile(file, delay = 500) {
        if (file.extension.toLocaleLowerCase() !== this.extension)
            return;
        const previous = this.fileTimers.get(file.path);
        if (previous !== undefined)
            window.clearTimeout(previous);
        const timer = window.setTimeout(() => {
            this.fileTimers.delete(file.path);
            void this.indexFile(file).then(() => this.scheduleSave());
        }, delay);
        this.fileTimers.set(file.path, timer);
    }
    /**
     * 删除file，并保持模型、界面和持久化状态的一致性。
     *
     * @param path 仓库内目标路径。
     */
    removeFile(path) {
        const normalizedPath = (0, obsidian_1.normalizePath)(path);
        if (!this.data.files[normalizedPath])
            return;
        delete this.data.files[normalizedPath];
        this.data.generatedAt = new Date().toISOString();
        this.scheduleSave();
    }
    /**
     * 执行“rename file”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param file 目标 Obsidian 文件对象。
     * @param oldPath 该参数用于 rename file 流程中的输入或控制。
     */
    renameFile(file, oldPath) {
        this.removeFile(oldPath);
        this.queueFile(file, 50);
    }
    /**
     * 重建all，并保持模型、界面和持久化状态的一致性。
     */
    async rebuildAll() {
        if (this.rebuildPromise)
            return this.rebuildPromise;
        this.rebuildPromise = this.performRebuild(true).finally(() => { this.rebuildPromise = null; });
        return this.rebuildPromise;
    }
    /**
     * 重建changed files，并保持模型、界面和持久化状态的一致性。
     */
    async rebuildChangedFiles() {
        if (this.rebuildPromise)
            return this.rebuildPromise;
        this.rebuildPromise = this.performRebuild(false).finally(() => { this.rebuildPromise = null; });
        return this.rebuildPromise;
    }
    /**
     * 执行全量或增量索引重建。它比较文件修改时间，仅解析变化的 .mindmap 文件，删除失效记录，随后重新解析跨文件层级并安排持久化。
     *
     * @param force 该参数用于 perform rebuild 流程中的输入或控制。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async performRebuild(force) {
        this.building = true;
        try {
            const files = this.app.vault.getFiles().filter((file) => file.extension.toLocaleLowerCase() === this.extension);
            const currentPaths = new Set(files.map((file) => file.path));
            for (const path of Object.keys(this.data.files)) {
                if (!currentPaths.has(path))
                    delete this.data.files[path];
            }
            for (const file of files) {
                const indexed = this.data.files[file.path];
                if (!force && indexed && indexed.mtime === file.stat.mtime && indexed.size === file.stat.size)
                    continue;
                await this.indexFile(file);
            }
            this.data.generatedAt = new Date().toISOString();
            this.ready = true;
            await this.saveNow();
        }
        finally {
            this.building = false;
        }
    }
    /**
     * 读取并解析单个 .mindmap 文件，生成节点级搜索条目和子导图引用。读取或解析失败时移除该文件的旧索引，防止返回过期结果。
     *
     * @param file 目标 Obsidian 文件对象。
     * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
     */
    async indexFile(file) {
        try {
            const source = await this.app.vault.cachedRead(file);
            const document = (0, model_1.parseDocument)(source, file.basename);
            this.data.files[file.path] = {
                mtime: file.stat.mtime,
                size: file.stat.size,
                title: document.title,
                navigation: document.navigation,
                entries: buildSearchEntries(document, file.path)
            };
            this.data.generatedAt = new Date().toISOString();
            this.ready = true;
        }
        catch (error) {
            console.warn(`MindMap Studio could not index ${file.path}`, error);
            delete this.data.files[file.path];
        }
    }
    /**
     * 递归遍历nodes，并保持模型、界面和持久化状态的一致性。
     *
     * @param root 节点树的根节点。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    *walkNodes(root) {
        const stack = [root];
        while (stack.length) {
            const node = stack.pop();
            if (!node)
                continue;
            yield node;
            for (let index = node.children.length - 1; index >= 0; index -= 1)
                stack.push(node.children[index]);
        }
    }
    /**
     * 解析并确定submap file，并保持模型、界面和持久化状态的一致性。
     *
     * @param rawPath 该参数用于 resolve submap file 流程中的输入或控制。
     * @param sourcePath 该参数用于 resolve submap file 流程中的输入或控制。
     * @returns 当前操作生成、查找或规范化后的结果。
     */
    resolveSubmapFile(rawPath, sourcePath) {
        var _a, _b, _c;
        const raw = rawPath === null || rawPath === void 0 ? void 0 : rawPath.trim();
        if (!raw)
            return null;
        const unwrapped = (_c = (_b = (_a = raw.replace(/^!?\[\[|\]\]$/g, "").split("|")[0]) === null || _a === void 0 ? void 0 : _a.split("#")[0]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : raw;
        const normalizedPath = (0, obsidian_1.normalizePath)(unwrapped);
        const direct = this.app.vault.getAbstractFileByPath(normalizedPath);
        if (direct instanceof obsidian_1.TFile && direct.extension.toLocaleLowerCase() === this.extension)
            return direct;
        const resolved = this.app.metadataCache.getFirstLinkpathDest(unwrapped, sourcePath);
        return resolved instanceof obsidian_1.TFile && resolved.extension.toLocaleLowerCase() === this.extension ? resolved : null;
    }
    /**
     * 加载相关数据，并保持模型、界面和持久化状态的一致性。
     */
    async load() {
        try {
            if (!(await this.app.vault.adapter.exists(this.indexPath))) {
                this.ready = true;
                return;
            }
            const parsed = JSON.parse(await this.app.vault.adapter.read(this.indexPath));
            if (parsed.version === 2 && parsed.files && typeof parsed.files === "object") {
                this.data = {
                    version: 2,
                    generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : new Date(0).toISOString(),
                    files: parsed.files
                };
            }
            else {
                // The previous flat index did not persist navigation metadata. Rebuild it.
                this.data = { version: 2, generatedAt: new Date(0).toISOString(), files: {} };
            }
            this.ready = true;
        }
        catch (error) {
            console.warn("MindMap Studio could not load the global search index", error);
            this.data = { version: 2, generatedAt: new Date(0).toISOString(), files: {} };
            this.ready = true;
        }
    }
    /**
     * 安排延迟执行save，并保持模型、界面和持久化状态的一致性。
     */
    scheduleSave() {
        if (this.saveTimer !== null)
            window.clearTimeout(this.saveTimer);
        this.saveTimer = window.setTimeout(() => {
            this.saveTimer = null;
            void this.saveNow();
        }, 800);
    }
    /**
     * 保存now，并保持模型、界面和持久化状态的一致性。
     */
    async saveNow() {
        try {
            await this.app.vault.adapter.write(this.indexPath, JSON.stringify(this.data));
        }
        catch (error) {
            console.warn("MindMap Studio could not save the global search index", error);
        }
    }
}
exports.MindMapSearchIndex = MindMapSearchIndex;
/**
 * 执行“append highlighted text”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
 *
 * @param container 接收渲染内容的 DOM 容器。
 * @param text 要显示、搜索、解析或写入的文本。
 * @param query 用户输入的搜索关键词。
 */
function appendHighlightedText(container, text, query, useRegex = false) {
    const phrase = query.trim();
    if (!phrase) {
        container.setText(text);
        return;
    }
    if (useRegex) {
        let regex;
        try {
            regex = new RegExp(phrase, "gi");
        }
        catch (_a) {
            container.setText(text);
            return;
        }
        let lastIndex = 0;
        let match;
        let hasMatch = false;
        while ((match = regex.exec(text)) !== null) {
            hasMatch = true;
            if (match.index > lastIndex)
                container.appendText(text.slice(lastIndex, match.index));
            container.createEl("mark", { text: match[0] });
            lastIndex = regex.lastIndex;
        }
        if (hasMatch) {
            if (lastIndex < text.length)
                container.appendText(text.slice(lastIndex));
            return;
        }
        container.setText(text);
        return;
    }
    const lowerText = text.toLocaleLowerCase();
    const lowerPhrase = phrase.toLocaleLowerCase();
    const index = lowerText.indexOf(lowerPhrase);
    if (index < 0) {
        container.setText(text);
        return;
    }
    if (index > 0)
        container.appendText(text.slice(0, index));
    container.createEl("mark", { text: text.slice(index, index + phrase.length) });
    if (index + phrase.length < text.length)
        container.appendText(text.slice(index + phrase.length));
}
/**
 * GlobalMindMapSearchModal 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
class GlobalMindMapSearchModal extends obsidian_1.Modal {
    /**
     * 创建 GlobalMindMapSearchModal 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
     *
     * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
     * @param index 当前元素在同级或列表中的零基索引。
     * @param maxResults 该参数用于 constructor 流程中的输入或控制。
     * @param onOpenResult 该参数用于 constructor 流程中的输入或控制。
     * @param onRebuild 该参数用于 constructor 流程中的输入或控制。
     * @param scopePaths 该参数用于 constructor 流程中的输入或控制。
     * @param scopeTitle 该参数用于 constructor 流程中的输入或控制。
     * @param scopeDescription 该参数用于 constructor 流程中的输入或控制。
     */
    constructor(app, index, maxResults, onOpenResult, onRebuild, onReplaceAll, scopePaths, scopeTitle = "全局搜索思维导图", scopeDescription = "所有导图、子节点和子导图") {
        super(app);
        this.index = index;
        this.maxResults = maxResults;
        this.onOpenResult = onOpenResult;
        this.onRebuild = onRebuild;
        this.onReplaceAll = onReplaceAll;
        this.scopePaths = scopePaths;
        this.scopeTitle = scopeTitle;
        this.scopeDescription = scopeDescription;
        this.activeIndex = -1;
        this.renderedResults = [];
        this.useRegex = false;
    }
    /**
     * 在弹窗或视图打开时创建界面、绑定事件并把当前数据填入控件。
     */
    onOpen() {
        this.modalEl.addClass("mms-global-search-modal");
        this.titleEl.setText(this.scopeTitle);
        // Search bar
        const searchRow = this.contentEl.createDiv({ cls: "mms-global-search-row" });
        const icon = searchRow.createSpan({ cls: "mms-global-search-icon" });
        (0, obsidian_1.setIcon)(icon, "search");
        this.inputEl = searchRow.createEl("input", {
            type: "search",
            cls: "mms-global-search-input",
            attr: { placeholder: `搜索${this.scopeDescription}…`, autocomplete: "off", spellcheck: "false" }
        });
        const regexBtn = searchRow.createEl("button", {
            cls: "mms-global-search-regex",
            attr: { type: "button", title: "正则搜索" }
        });
        regexBtn.setText(".*");
        // Replace bar (always visible)
        this.replaceRowEl = this.contentEl.createDiv({ cls: "mms-global-search-replace-row" });
        const replaceAllBtn = this.replaceRowEl.createEl("button", {
            cls: "mms-global-search-replace-all",
            attr: { type: "button", title: "全部替换" }
        });
        (0, obsidian_1.setIcon)(replaceAllBtn, "check-check");
        this.replaceInputEl = this.replaceRowEl.createEl("input", {
            type: "text",
            cls: "mms-global-search-replace-input",
            attr: { placeholder: "替换为…", autocomplete: "off" }
        });
        const rebuild = this.replaceRowEl.createEl("button", { cls: "mms-global-search-rebuild", attr: { type: "button", title: "重建索引" } });
        (0, obsidian_1.setIcon)(rebuild, "refresh-cw");
        this.summaryEl = this.contentEl.createDiv({ cls: "mms-global-search-summary" });
        this.resultsEl = this.contentEl.createDiv({ cls: "mms-global-search-results" });
        const render = () => this.renderResults(this.inputEl.value);
        this.inputEl.addEventListener("input", render);
        this.inputEl.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                this.moveActive(1);
            }
            else if (event.key === "ArrowUp") {
                event.preventDefault();
                this.moveActive(-1);
            }
            else if (event.key === "Enter") {
                event.preventDefault();
                const result = this.renderedResults[this.activeIndex >= 0 ? this.activeIndex : 0];
                if (result)
                    void this.openResult(result);
            }
        });
        regexBtn.addEventListener("click", () => {
            this.useRegex = !this.useRegex;
            regexBtn.toggleClass("is-active", this.useRegex);
            render();
        });
        replaceAllBtn.addEventListener("click", async () => {
            if (!this.renderedResults.length)
                return;
            if (!this.onReplaceAll) {
                new obsidian_1.Notice("当前模式不支持替换操作。");
                return;
            }
            replaceAllBtn.disabled = true;
            replaceAllBtn.setText("替换中…");
            try {
                await this.onReplaceAll(this.renderedResults, this.inputEl.value, this.replaceInputEl.value.trim(), this.useRegex);
                new obsidian_1.Notice(`已替换全部结果，正在重建索引…`);
                this.renderedResults = [];
                this.summaryEl.setText("已替换所有匹配节点。请重新搜索以刷新结果。");
                this.resultsEl.empty();
                this.resultsEl.createDiv({ cls: "mms-global-search-empty", text: "已替换所有匹配节点，请输入新关键词搜索。" });
            }
            finally {
                replaceAllBtn.disabled = false;
                (0, obsidian_1.setIcon)(replaceAllBtn, "check-check");
            }
        });
        rebuild.addEventListener("click", async () => {
            rebuild.disabled = true;
            this.summaryEl.setText("正在重建索引…");
            try {
                await this.onRebuild();
                new obsidian_1.Notice("思维导图搜索索引已重建");
                render();
            }
            finally {
                rebuild.disabled = false;
            }
        });
        this.renderResults("");
        window.setTimeout(() => this.inputEl.focus(), 20);
    }
    /**
     * 在弹窗或视图关闭时释放临时 DOM、计时器和事件状态。
     */
    onClose() {
        this.contentEl.empty();
    }
    /**
     * 渲染results，并保持模型、界面和持久化状态的一致性。
     *
     * @param query 用户输入的搜索关键词。
     */
    renderResults(query) {
        this.resultsEl.empty();
        this.activeIndex = -1;
        const status = this.index.getStatus();
        const scopedStatus = this.scopePaths ? this.index.getScopedStatus(this.scopePaths) : { files: status.files, nodes: status.nodes };
        const trimmed = query.trim();
        if (!trimmed) {
            this.renderedResults = [];
            this.summaryEl.setText(status.building && !this.scopePaths
                ? `正在建立索引，已收录 ${scopedStatus.files} 个导图、${scopedStatus.nodes} 个节点…`
                : `搜索范围包含 ${scopedStatus.files} 个导图、${scopedStatus.nodes} 个节点。输入关键词开始搜索。`);
            const hint = this.resultsEl.createDiv({ cls: "mms-global-search-empty" });
            hint.createDiv({ text: "搜索范围" });
            hint.createEl("p", { text: `${this.scopeDescription}中的节点文字、富文本、备注、标签、表格、代码、链接及折叠分支。` });
            return;
        }
        this.renderedResults = this.index.search(trimmed, this.maxResults, this.scopePaths, this.useRegex);
        this.summaryEl.setText(`找到 ${this.renderedResults.length}${this.renderedResults.length >= this.maxResults ? "+" : ""} 个结果 · 范围 ${scopedStatus.files} 个导图 / ${scopedStatus.nodes} 个节点`);
        if (!this.renderedResults.length) {
            this.resultsEl.createDiv({ cls: "mms-global-search-empty", text: status.building ? "索引仍在建立，请稍后重试。" : "没有匹配结果。" });
            return;
        }
        this.renderResultItems(trimmed);
    }
    /**
     * 从当前 renderedResults 列表重新渲染结果，不重新查询索引。
     */
    renderResultList() {
        this.resultsEl.empty();
        this.activeIndex = -1;
        const query = this.inputEl.value.trim();
        this.summaryEl.setText(`找到 ${this.renderedResults.length} 个结果`);
        if (!this.renderedResults.length) {
            this.resultsEl.createDiv({ cls: "mms-global-search-empty", text: "已替换所有匹配节点。" });
            return;
        }
        this.renderResultItems(query);
    }
    /**
     * 渲染结果列表项。
     */
    renderResultItems(query) {
        this.renderedResults.forEach((result, index) => {
            var _a;
            const button = this.resultsEl.createEl("button", { cls: "mms-global-search-result", attr: { type: "button" } });
            const header = button.createDiv({ cls: "mms-global-search-result-header" });
            const title = header.createDiv({ cls: "mms-global-search-result-title" });
            appendHighlightedText(title, result.nodeText, query, this.useRegex);
            const badges = header.createDiv({ cls: "mms-global-search-result-badges" });
            badges.createSpan({ cls: "mms-global-search-badge", text: result.matchedKind });
            if (result.isSubmapDocument)
                badges.createSpan({ cls: "mms-global-search-badge is-submap", text: "子导图" });
            const replaceOneBtn = header.createEl("button", {
                cls: "mms-global-search-replace-one",
                attr: { type: "button", title: "替换此节点" }
            });
            (0, obsidian_1.setIcon)(replaceOneBtn, "rotate-ccw");
            replaceOneBtn.addEventListener("click", async (event) => {
                event.stopPropagation();
                const replacement = this.replaceInputEl.value.trim();
                if (!this.onReplaceAll) {
                    new obsidian_1.Notice("当前模式不支持替换操作。");
                    return;
                }
                replaceOneBtn.disabled = true;
                try {
                    const count = await this.onReplaceAll([result], this.inputEl.value, replacement, this.useRegex);
                    if (count > 0) {
                        new obsidian_1.Notice("已替换此节点");
                        const idx = this.renderedResults.indexOf(result);
                        if (idx >= 0) {
                            this.renderedResults.splice(idx, 1);
                            this.renderResultList();
                        }
                    }
                    else {
                        new obsidian_1.Notice("节点文字中未找到匹配，未作替换");
                    }
                }
                finally {
                    replaceOneBtn.disabled = false;
                }
            });
            const file = button.createDiv({ cls: "mms-global-search-result-file" });
            file.createSpan({ text: ((_a = result.mapHierarchy) === null || _a === void 0 ? void 0 : _a.join(" › ")) || result.fileTitle });
            file.createSpan({ cls: "mms-global-search-result-path", text: result.filePath });
            button.addEventListener("mouseenter", () => this.setActive(index));
            button.addEventListener("click", () => void this.openResult(result));
        });
        this.setActive(0);
    }
    /**
     * 执行“move active”相关的内部逻辑。该函数封装单一职责，供所属模块或类的上层流程复用。
     *
     * @param delta 该参数用于 move active 流程中的输入或控制。
     */
    moveActive(delta) {
        if (!this.renderedResults.length)
            return;
        const next = this.activeIndex < 0 ? 0 : (this.activeIndex + delta + this.renderedResults.length) % this.renderedResults.length;
        this.setActive(next);
    }
    /**
     * 更新并应用active，并保持模型、界面和持久化状态的一致性。
     *
     * @param index 当前元素在同级或列表中的零基索引。
     */
    setActive(index) {
        var _a;
        this.activeIndex = index;
        const buttons = Array.from(this.resultsEl.querySelectorAll(".mms-global-search-result"));
        buttons.forEach((button, buttonIndex) => button.toggleClass("is-active", buttonIndex === index));
        (_a = buttons[index]) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ block: "nearest" });
    }
    /**
     * 打开result，并保持模型、界面和持久化状态的一致性。
     *
     * @param result 该参数用于 open result 流程中的输入或控制。
     */
    async openResult(result) {
        this.close();
        await this.onOpenResult(result);
    }
}
exports.GlobalMindMapSearchModal = GlobalMindMapSearchModal;

//# sourceURL=/mnt/data/work_1152/obsidian-mindmap-studio-1.15.2/src/search/global-search.ts
}
};
const __bundleCache = Object.create(null);
function __bundleRequire(id) {
  if (__bundleCache[id]) return __bundleCache[id].exports;
  const module = __bundleCache[id] = { exports: {} };
  __bundleModules[id](module, module.exports, __bundleRequire, require);
  return module.exports;
}
module.exports = __bundleRequire(0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiJ9
