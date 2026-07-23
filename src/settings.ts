/**
 * @file settings.ts
 * @description 插件设置模型和设置页。
 *
 * 集中管理显示模式、节点默认样式、图床、图片容灾、搜索索引和一键恢复，并在保存后刷新打开视图。
 */

import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type MindMapStudioPlugin from "./main";
import type {
  BackgroundPattern,
  DisplayMode,
  EdgeStyle,
  EdgeWidthMode,
  FontFamilyMode,
  LayoutMode,
  MindMapAppearance,
  MindMapThemePresetId,
  NodeShape,
  NodeTextAlign,
  ThemeMode
} from "./model";
import { appearanceFromThemePreset, MINDMAP_THEME_PRESETS } from "./themes";

/**
 * ImageHostBodyMode 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type ImageHostBodyMode = "multipart" | "raw";
/**
 * ImageHostMethod 类型定义，用于限制可接受值并让序列化数据保持稳定。
 */
export type ImageHostMethod = "POST" | "PUT";

/**
 * ImageHostConfig 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostConfig {
  id: string;
  name: string;
  enabled: boolean;
  endpoint: string;
  method: ImageHostMethod;
  bodyMode: ImageHostBodyMode;
  fieldName: string;
  headers: string;
  responsePath: string;
}

/**
 * ImageHostChoice 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostChoice {
  id: string;
  name: string;
}

/**
 * ImageHostUploadSuccess 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostUploadSuccess {
  hostId: string;
  hostName: string;
  url: string;
}

/**
 * ImageHostUploadFailure 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostUploadFailure {
  hostId: string;
  hostName: string;
  error: string;
}

/**
 * ImageHostUploadBatch 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface ImageHostUploadBatch {
  successes: ImageHostUploadSuccess[];
  failures: ImageHostUploadFailure[];
}

/**
 * 创建image host config，并保持模型、界面和持久化状态的一致性。
 *
 * @param index 当前元素在同级或列表中的零基索引。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function createImageHostConfig(index = 1): ImageHostConfig {
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

/**
 * MindMapStudioSettings 的结构化数据约定。字段会在模块边界传递，用于保持类型安全和版本兼容。
 */
export interface MindMapStudioSettings {
  defaultFolder: string;
  filePrefix: string;
  assetFolder: string;
  defaultLayout: LayoutMode;
  defaultTheme: ThemeMode;
  defaultNodeShape: NodeShape;
  redirectLegacyFiles: boolean;
  showGrid: boolean;
  showTaskProgress: boolean;
  autoFitOnOpen: boolean;
  historyLimit: number;
  embedMaxHeight: number;
  defaultThemePreset: MindMapThemePresetId;
  backgroundColor: string;
  backgroundPattern: BackgroundPattern;
  backgroundPatternColor: string;
  fontFamily: FontFamilyMode;
  customFont: string;
  fontSize: number;
  edgeColor: string;
  edgeWidth: number;
  edgeStyle: EdgeStyle;
  edgeWidthMode: EdgeWidthMode;
  edgeMinWidth: number;
  rootColor: string;
  rootTextColor: string;
  colorfulBranches: boolean;
  branchColors: string[];
  nodeBackgroundColor: string;
  textColor: string;
  nodeBorderColor: string;
  nodeBorderWidth: number;
  defaultNodeTextAlign: NodeTextAlign;
  defaultTextBold: boolean;
  defaultTextItalic: boolean;
  defaultTextUnderline: boolean;
  imageHosts: ImageHostConfig[];
  autoUploadEnabled: boolean;
  autoUploadDelaySeconds: number;
  autoUploadHostIds: string[];
  deleteLocalAfterUpload: boolean;
  imageFailoverEnabled: boolean;
  imageFailoverTimeoutSeconds: number;
  imageFailoverUseLocalFallback: boolean;
  globalSearchMaxResults: number;
  visibleModes: DisplayMode[];
  defaultViewMode: DisplayMode;
  nodeEditorPosition: "center" | "right";
  richTextBoldShortcut: string;
  richTextItalicShortcut: string;
  richTextUnderlineShortcut: string;
  richTextColorShortcut: string;
}

export const DEFAULT_SETTINGS: MindMapStudioSettings = {
  defaultFolder: "",
  filePrefix: "思维导图",
  assetFolder: "MindMap Assets",
  defaultLayout: "right",
  defaultTheme: "auto",
  defaultNodeShape: "rounded",
  redirectLegacyFiles: true,
  showGrid: true,
  showTaskProgress: true,
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
  visibleModes: ["mindmap", "outline", "article"],
  defaultViewMode: "mindmap"
  ,
  nodeEditorPosition: "right",
  richTextBoldShortcut: "Ctrl+B",
  richTextItalicShortcut: "Ctrl+I",
  richTextUnderlineShortcut: "Ctrl+U",
  richTextColorShortcut: "Ctrl+Shift+C"
};

/**
 * 更新并应用tings to appearance，并保持模型、界面和持久化状态的一致性。
 *
 * @param settings 插件当前设置对象。
 * @returns 当前操作生成、查找或规范化后的结果。
 */
export function settingsToAppearance(settings: MindMapStudioSettings): MindMapAppearance {
  return {
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
export function applyThemePresetToSettings(settings: MindMapStudioSettings, presetId: MindMapThemePresetId): void {
  const appearance = appearanceFromThemePreset(presetId);
  settings.defaultThemePreset = presetId;
  settings.backgroundColor = appearance.backgroundColor ?? "";
  settings.backgroundPattern = appearance.backgroundPattern ?? "none";
  settings.backgroundPatternColor = appearance.patternColor ?? "#94a3b8";
  settings.fontFamily = appearance.fontFamily ?? "obsidian";
  settings.customFont = appearance.customFont ?? "";
  settings.fontSize = appearance.fontSize ?? 14;
  settings.edgeColor = appearance.edgeColor ?? "";
  settings.edgeWidth = appearance.edgeWidth ?? 2.2;
  settings.edgeStyle = appearance.edgeStyle ?? "curved";
  settings.edgeWidthMode = appearance.edgeWidthMode ?? "uniform";
  settings.edgeMinWidth = appearance.edgeMinWidth ?? Math.min(1, settings.edgeWidth);
  settings.rootColor = appearance.rootColor ?? "";
  settings.rootTextColor = appearance.rootTextColor ?? "";
  settings.colorfulBranches = appearance.colorfulBranches === true;
  settings.branchColors = appearance.branchColors ? [...appearance.branchColors] : [];
  settings.nodeBackgroundColor = appearance.nodeColor ?? "";
  settings.textColor = appearance.textColor ?? "";
  settings.nodeBorderColor = appearance.nodeBorderColor ?? "";
  settings.nodeBorderWidth = appearance.nodeBorderWidth ?? 1;
  settings.defaultNodeTextAlign = appearance.nodeTextAlign ?? "center";
  settings.defaultTextBold = appearance.bold === true;
  settings.defaultTextItalic = appearance.italic === true;
  settings.defaultTextUnderline = appearance.underline === true;
}

/**
 * MindMapStudioSettingTab 的主要实现类。负责封装相关状态、生命周期和对外操作，避免调用方直接操作内部数据结构。
 */
export class MindMapStudioSettingTab extends PluginSettingTab {
  private readonly plugin: MindMapStudioPlugin;

  /**
   * 创建 MindMapStudioSettingTab 实例，保存依赖和初始状态；实际 DOM 构建通常在 onOpen() 或后续渲染流程中完成。
   *
   * @param app Obsidian 应用实例，用于访问仓库、工作区和 UI 服务。
   * @param plugin MindMap Studio 插件实例，用于调用跨文件服务和读取设置。
   */
  constructor(app: App, plugin: MindMapStudioPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * 构建完整插件设置页，包括主题、显示模式、节点默认值、搜索、图片、图床容灾和恢复初始设置。所有控件写入后立即保存并刷新打开视图。
   * @remarks 这是关键流程函数；修改时应同步检查调用方、数据兼容、撤销保存链路以及对应自动测试。
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "MindMap Studio" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "这里设置全局默认外观。打开脑图后，也可以点击工具栏中的调色板，为当前脑图单独保存一套样式。"
    });

    containerEl.createEl("h3", { text: "主题模板" });

    new Setting(containerEl)
      .setName("默认主题")
      .setDesc("选择后会一次应用背景、节点、分支配色、字体和连线样式；之后仍可继续修改单项设置。")
      .addDropdown((dropdown) => {
        for (const preset of MINDMAP_THEME_PRESETS) dropdown.addOption(preset.id, preset.name);
        dropdown.setValue(this.plugin.settings.defaultThemePreset);
        dropdown.onChange(async (value) => {
          applyThemePresetToSettings(this.plugin.settings, value as MindMapThemePresetId);
          await this.saveAndRefresh();
          this.display();
        });
      });

    const themePreview = containerEl.createDiv({ cls: "mms-theme-preview-row" });
    for (const preset of MINDMAP_THEME_PRESETS) {
      const card = themePreview.createEl("button", {
        cls: `mms-theme-preview-card${preset.id === this.plugin.settings.defaultThemePreset ? " is-selected" : ""}`,
        attr: { type: "button", title: preset.description }
      });
      const swatches = card.createDiv({ cls: "mms-theme-preview-swatches" });
      const colors = [preset.appearance.rootColor, ...(preset.appearance.branchColors ?? []).slice(0, 4)].filter((color): color is string => Boolean(color));
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
    const modeOptions: Array<{ id: DisplayMode; name: string; description: string }> = [
      { id: "mindmap", name: "导图模式", description: "默认的可视化思维导图画布。" },
      { id: "outline", name: "大纲模式", description: "按照节点层级显示可编辑大纲。" },
      { id: "article", name: "文章模式", description: "生成目录和章节编号的文章视图。" }
    ];
    for (const mode of modeOptions) {
      const label = modeGrid.createEl("label", { cls: "mms-mode-setting-card" });
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.checked = this.plugin.settings.visibleModes.includes(mode.id);
      const copy = label.createDiv({ cls: "mms-mode-setting-copy" });
      copy.createEl("strong", { text: mode.name });
      copy.createEl("span", { text: mode.description });
      checkbox.addEventListener("change", async () => {
        const next = new Set(this.plugin.settings.visibleModes);
        if (checkbox.checked) next.add(mode.id);
        else next.delete(mode.id);
        if (!next.size) {
          checkbox.checked = true;
          new Notice("至少需要保留一种显示模式");
          return;
        }
        this.plugin.settings.visibleModes = modeOptions.map((item) => item.id).filter((id) => next.has(id));
        if (!this.plugin.settings.visibleModes.includes(this.plugin.settings.defaultViewMode)) {
          this.plugin.settings.defaultViewMode = this.plugin.settings.visibleModes[0] ?? "mindmap";
        }
        await this.saveAndRefresh();
        this.display();
      });
    }

    new Setting(containerEl)
      .setName("当前全局显示模式")
      .setDesc("这里与工具栏模式按钮同步。选择后，之后打开的父导图和所有子导图都会继续使用该模式。")
      .addDropdown((dropdown) => {
        const labels: Record<DisplayMode, string> = { mindmap: "导图模式", outline: "大纲模式", article: "文章模式" };
        for (const mode of this.plugin.settings.visibleModes) dropdown.addOption(mode, labels[mode]);
        dropdown.setValue(this.plugin.settings.visibleModes.includes(this.plugin.settings.defaultViewMode)
          ? this.plugin.settings.defaultViewMode
          : this.plugin.settings.visibleModes[0] ?? "mindmap");
        dropdown.onChange(async (value) => {
          await this.plugin.setGlobalDisplayMode(value as DisplayMode);
        });
      });

    containerEl.createEl("h3", { text: "文件与布局" });

    new Setting(containerEl)
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
    const shortcutSetting = (name: string, key: keyof Pick<MindMapStudioSettings,
      "richTextBoldShortcut" | "richTextItalicShortcut" | "richTextUnderlineShortcut" | "richTextColorShortcut">): void => {
      new Setting(containerEl)
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

    new Setting(containerEl)
      .setName("默认保存文件夹")
      .setDesc("留空时保存在当前笔记所在文件夹；也可填写例如 Mind Maps。")
      .addText((text) => text
        .setPlaceholder("Mind Maps")
        .setValue(this.plugin.settings.defaultFolder)
        .onChange(async (value) => {
          this.plugin.settings.defaultFolder = value.trim().replace(/^\/+|\/+$/g, "");
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
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

    new Setting(containerEl)
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
      new Setting(containerEl)
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

      new Setting(containerEl)
        .setName("本地副本作为最后回退")
        .setDesc("远程镜像全部失效时，如果本地图片仍存在，则最后尝试本地副本。")
        .addToggle((toggle) => toggle
          .setValue(this.plugin.settings.imageFailoverUseLocalFallback)
          .onChange(async (value) => {
            this.plugin.settings.imageFailoverUseLocalFallback = value;
            await this.plugin.saveSettings();
          }));
    }

    new Setting(containerEl)
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
      new Setting(containerEl)
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

      new Setting(containerEl)
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
      const card = containerEl.createDiv({ cls: "mms-image-host-card" });
      const title = card.createDiv({ cls: "mms-image-host-card-title" });
      title.createEl("strong", { text: host.name || `图床 ${index + 1}` });
      const status = title.createSpan({ cls: "mms-image-host-status", text: host.enabled ? "已启用" : "已停用" });
      status.toggleClass("is-enabled", host.enabled);

      new Setting(card)
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
            if (!value) this.plugin.settings.autoUploadHostIds = this.plugin.settings.autoUploadHostIds.filter((id) => id !== host.id);
            await this.plugin.saveSettings();
            this.display();
          }));

      new Setting(card)
        .setName("上传 API")
        .addText((text) => text
          .setPlaceholder("https://example.com/api/upload")
          .setValue(host.endpoint)
          .onChange(async (value) => { host.endpoint = value.trim(); await this.plugin.saveSettings(); }));

      new Setting(card)
        .setName("请求方法与格式")
        .addDropdown((dropdown) => dropdown
          .addOption("POST", "POST")
          .addOption("PUT", "PUT")
          .setValue(host.method)
          .onChange(async (value) => { host.method = value as ImageHostMethod; await this.plugin.saveSettings(); }))
        .addDropdown((dropdown) => dropdown
          .addOption("multipart", "multipart/form-data")
          .addOption("raw", "原始二进制")
          .setValue(host.bodyMode)
          .onChange(async (value) => { host.bodyMode = value as ImageHostBodyMode; await this.plugin.saveSettings(); }));

      new Setting(card)
        .setName("文件字段名")
        .setDesc("multipart 模式常见值：file、image、source。")
        .addText((text) => text
          .setValue(host.fieldName)
          .setPlaceholder("file")
          .onChange(async (value) => { host.fieldName = value.trim() || "file"; await this.plugin.saveSettings(); }));

      new Setting(card)
        .setName("请求头 JSON")
        .setDesc("例如 Authorization、X-API-Key。密钥保存在插件 data.json。")
        .addTextArea((text) => text
          .setValue(host.headers)
          .setPlaceholder('{"Authorization":"Bearer ..."}')
          .onChange(async (value) => { host.headers = value.trim(); await this.plugin.saveSettings(); }));

      new Setting(card)
        .setName("返回网址字段")
        .setDesc("例如 data.url；留空会尝试常见字段。")
        .addText((text) => text
          .setValue(host.responsePath)
          .setPlaceholder("data.url")
          .onChange(async (value) => { host.responsePath = value.trim(); await this.plugin.saveSettings(); }));

      const isAutoTarget = this.plugin.settings.autoUploadHostIds.includes(host.id);
      new Setting(card)
        .setName("自动上传目标")
        .setDesc("自动上传可以同时选择多个图床；手动上传时仍可临时选择其他组合。")
        .addToggle((toggle) => toggle
          .setValue(isAutoTarget)
          .setDisabled(!host.enabled)
          .onChange(async (value) => {
            const selected = new Set(this.plugin.settings.autoUploadHostIds);
            if (value) selected.add(host.id); else selected.delete(host.id);
            this.plugin.settings.autoUploadHostIds = Array.from(selected);
            await this.plugin.saveSettings();
          }));

      const actions = card.createDiv({ cls: "mms-image-host-actions" });
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
        this.plugin.settings.imageHosts = this.plugin.settings.imageHosts.filter((item) => item.id !== host.id);
        this.plugin.settings.autoUploadHostIds = this.plugin.settings.autoUploadHostIds.filter((id) => id !== host.id);
        void this.plugin.saveSettings().then(() => {
          new Notice(`已删除图床：${host.name}`);
          this.display();
        });
      });
    });

    new Setting(containerEl)
      .setName("新文件名前缀")
      .setDesc("新建脑图时使用：前缀 + 日期时间。文件后缀固定为 .mindmap。")
      .addText((text) => text
        .setPlaceholder("思维导图")
        .setValue(this.plugin.settings.filePrefix)
        .onChange(async (value) => {
          this.plugin.settings.filePrefix = value.trim() || "思维导图";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("默认布局")
      .setDesc("单侧适合流程拆解，双侧适合头脑风暴。")
      .addDropdown((dropdown) => dropdown
        .addOption("right", "向右展开")
        .addOption("balanced", "左右平衡")
        .setValue(this.plugin.settings.defaultLayout)
        .onChange(async (value) => {
          this.plugin.settings.defaultLayout = value as LayoutMode;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("默认明暗模式")
      .addDropdown((dropdown) => dropdown
        .addOption("auto", "跟随 Obsidian")
        .addOption("light", "浅色")
        .addOption("dark", "深色")
        .setValue(this.plugin.settings.defaultTheme)
        .onChange(async (value) => {
          this.plugin.settings.defaultTheme = value as ThemeMode;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl("h3", { text: "画布背景" });

    this.addOptionalColorSetting(
      containerEl,
      "背景颜色",
      "留空时跟随 Obsidian 当前主题。",
      () => this.plugin.settings.backgroundColor,
      async (value) => { this.plugin.settings.backgroundColor = value; },
      "#f8fafc"
    );

    new Setting(containerEl)
      .setName("背景图案")
      .setDesc("可选择网格、点阵或纯色背景。")
      .addDropdown((dropdown) => dropdown
        .addOption("none", "无")
        .addOption("grid", "网格")
        .addOption("dots", "点阵")
        .setValue(this.plugin.settings.backgroundPattern)
        .onChange(async (value) => {
          this.plugin.settings.backgroundPattern = value as BackgroundPattern;
          this.plugin.settings.showGrid = value !== "none";
          await this.saveAndRefresh();
        }));

    this.addOptionalColorSetting(
      containerEl,
      "背景图案颜色",
      "控制网格线或点阵的颜色。",
      () => this.plugin.settings.backgroundPatternColor,
      async (value) => { this.plugin.settings.backgroundPatternColor = value || "#94a3b8"; },
      "#94a3b8",
      false
    );

    containerEl.createEl("h3", { text: "字体与文字" });

    new Setting(containerEl)
      .setName("默认字体")
      .addDropdown((dropdown) => dropdown
        .addOption("obsidian", "跟随 Obsidian")
        .addOption("sans", "无衬线字体")
        .addOption("serif", "衬线字体")
        .addOption("mono", "等宽字体")
        .addOption("custom", "自定义字体")
        .setValue(this.plugin.settings.fontFamily)
        .onChange(async (value) => {
          this.plugin.settings.fontFamily = value as FontFamilyMode;
          await this.saveAndRefresh();
          this.display();
        }));

    if (this.plugin.settings.fontFamily === "custom") {
      new Setting(containerEl)
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

    new Setting(containerEl)
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

    this.addOptionalColorSetting(
      containerEl,
      "默认文字颜色",
      "留空时使用 Obsidian 主题文字颜色；根节点仍优先使用主题强调色的对比文字。",
      () => this.plugin.settings.textColor,
      async (value) => { this.plugin.settings.textColor = value; },
      "#0f172a"
    );

    new Setting(containerEl)
      .setName("默认节点文字对齐")
      .setDesc("控制未单独设置对齐方式的节点；节点编辑窗口仍可覆盖。")
      .addDropdown((dropdown) => dropdown
        .addOption("left", "左对齐")
        .addOption("center", "居中")
        .addOption("right", "右对齐")
        .setValue(this.plugin.settings.defaultNodeTextAlign)
        .onChange(async (value) => {
          this.plugin.settings.defaultNodeTextAlign = value as NodeTextAlign;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("默认文字加粗")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.defaultTextBold)
        .onChange(async (value) => {
          this.plugin.settings.defaultTextBold = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("默认文字斜体")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.defaultTextItalic)
        .onChange(async (value) => {
          this.plugin.settings.defaultTextItalic = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("默认文字下划线")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.defaultTextUnderline)
        .onChange(async (value) => {
          this.plugin.settings.defaultTextUnderline = value;
          await this.saveAndRefresh();
        }));

    containerEl.createEl("h3", { text: "节点样式" });

    this.addOptionalColorSetting(
      containerEl,
      "中心主题颜色",
      "根节点的背景颜色。主题模板会自动设置。",
      () => this.plugin.settings.rootColor,
      async (value) => { this.plugin.settings.rootColor = value; },
      "#4f46e5"
    );

    this.addOptionalColorSetting(
      containerEl,
      "中心主题文字颜色",
      "根节点的文字颜色。",
      () => this.plugin.settings.rootTextColor,
      async (value) => { this.plugin.settings.rootTextColor = value; },
      "#ffffff"
    );

    new Setting(containerEl)
      .setName("默认节点形状")
      .setDesc("只影响未单独设置形状的节点。")
      .addDropdown((dropdown) => dropdown
        .addOption("rounded", "圆角")
        .addOption("pill", "胶囊")
        .addOption("rectangle", "直角")
        .setValue(this.plugin.settings.defaultNodeShape)
        .onChange(async (value) => {
          this.plugin.settings.defaultNodeShape = value as NodeShape;
          await this.saveAndRefresh();
        }));

    this.addOptionalColorSetting(
      containerEl,
      "默认节点背景色",
      "留空时跟随 Obsidian 主题。单个节点设置的颜色优先级更高。",
      () => this.plugin.settings.nodeBackgroundColor,
      async (value) => { this.plugin.settings.nodeBackgroundColor = value; },
      "#ffffff"
    );

    this.addOptionalColorSetting(
      containerEl,
      "默认节点边框颜色",
      "留空时跟随 Obsidian 主题边框颜色。",
      () => this.plugin.settings.nodeBorderColor,
      async (value) => { this.plugin.settings.nodeBorderColor = value; },
      "#94a3b8"
    );

    new Setting(containerEl)
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

    new Setting(containerEl)
      .setName("彩色分支")
      .setDesc("按照中心主题的一级分支分配颜色，同一分支的节点边框和连线保持一致。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.colorfulBranches)
        .onChange(async (value) => {
          this.plugin.settings.colorfulBranches = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("分支颜色")
      .setDesc("使用逗号分隔的十六进制颜色，一级分支会循环使用。")
      .addTextArea((text) => text
        .setPlaceholder("#4f46e5, #0284c7, #0f766e")
        .setValue(this.plugin.settings.branchColors.join(", "))
        .onChange(async (value) => {
          this.plugin.settings.branchColors = value.split(/[,，\s]+/).map((item) => item.trim()).filter((item) => /^#[0-9a-f]{6}$/i.test(item)).slice(0, 12);
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("连线类型")
      .addDropdown((dropdown) => dropdown
        .addOption("curved", "曲线")
        .addOption("straight", "直线")
        .addOption("elbow", "折线")
        .setValue(this.plugin.settings.edgeStyle)
        .onChange(async (value) => {
          this.plugin.settings.edgeStyle = value as EdgeStyle;
          await this.saveAndRefresh();
        }));

    this.addOptionalColorSetting(
      containerEl,
      "连线颜色",
      "留空时使用当前主题强调色。节点单独设置颜色时，可继续为该分支连线着色。",
      () => this.plugin.settings.edgeColor,
      async (value) => { this.plugin.settings.edgeColor = value; },
      "#7c8aa5"
    );

    new Setting(containerEl)
      .setName("连线粗细模式")
      .setDesc("“从粗到细”会让靠近中心主题的线最粗，越深层越细。")
      .addDropdown((dropdown) => dropdown
        .addOption("uniform", "统一粗细")
        .addOption("tapered", "从粗到细")
        .setValue(this.plugin.settings.edgeWidthMode)
        .onChange(async (value) => {
          this.plugin.settings.edgeWidthMode = value as EdgeWidthMode;
          await this.saveAndRefresh();
          this.display();
        }));

    new Setting(containerEl)
      .setName(this.plugin.settings.edgeWidthMode === "tapered" ? "起始粗细" : "连线粗细")
      .setDesc("靠近中心主题的连线宽度，范围 0.5–8 像素。")
      .addSlider((slider) => slider
        .setLimits(0.5, 8, 0.25)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.edgeWidth)
        .onChange(async (value) => {
          this.plugin.settings.edgeWidth = value;
          if (this.plugin.settings.edgeMinWidth > value) this.plugin.settings.edgeMinWidth = value;
          await this.saveAndRefresh();
        }));

    if (this.plugin.settings.edgeWidthMode === "tapered") {
      new Setting(containerEl)
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

    new Setting(containerEl)
      .setName("打开旧版脑图时自动转换")
      .setDesc("自动创建同名 .mindmap 文件并打开；旧文件会保留为备份，不会覆盖或删除。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.redirectLegacyFiles)
        .onChange(async (value) => {
          this.plugin.settings.redirectLegacyFiles = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("显示任务进度")
      .setDesc("在包含任务的分支节点底部显示完成百分比。")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showTaskProgress)
        .onChange(async (value) => {
          this.plugin.settings.showTaskProgress = value;
          await this.saveAndRefresh();
        }));

    new Setting(containerEl)
      .setName("打开时自动适应画布")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoFitOnOpen)
        .onChange(async (value) => {
          this.plugin.settings.autoFitOnOpen = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
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

    new Setting(containerEl)
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

    new Setting(containerEl)
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

    new Setting(containerEl)
      .setName("重建搜索索引")
      .setDesc("当文件由外部同步工具批量修改，或搜索结果与实际内容不一致时使用。")
      .addButton((button) => button
        .setButtonText("立即重建")
        .onClick(async () => {
          button.setDisabled(true);
          try {
            await this.plugin.rebuildGlobalSearchIndex();
            this.display();
          } finally {
            button.setDisabled(false);
          }
        }));

    containerEl.createEl("h3", { text: "恢复初始设置" });
    new Setting(containerEl)
      .setName("一键还原所有插件设置")
      .setDesc("恢复显示模式、主题、资源目录、图床、搜索和编辑选项。不会删除或修改任何 .mindmap 文件。")
      .addButton((button) => button
        .setWarning()
        .setButtonText("恢复初始设置")
        .onClick(async () => {
          const confirmed = window.confirm("确定恢复 MindMap Studio 的全部插件设置吗？脑图文件不会被删除。");
          if (!confirmed) return;
          await this.plugin.resetAllSettings();
          new Notice("已恢复初始设置");
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
  private addOptionalColorSetting(
    container: HTMLElement,
    name: string,
    description: string,
    getValue: () => string,
    setValue: (value: string) => Promise<void>,
    fallback: string,
    allowReset = true
  ): void {
    const setting = new Setting(container)
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
  private async saveAndRefresh(): Promise<void> {
    await this.plugin.saveSettings();
    this.plugin.refreshOpenViews();
  }
}
