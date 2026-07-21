import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type MindMapStudioPlugin from "./main";
import type {
  BackgroundPattern,
  EdgeStyle,
  FontFamilyMode,
  LayoutMode,
  MindMapAppearance,
  NodeShape,
  ThemeMode
} from "./model";

export type ImageHostBodyMode = "multipart" | "raw";
export type ImageHostMethod = "POST" | "PUT";

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

export interface ImageHostChoice {
  id: string;
  name: string;
}

export interface ImageHostUploadSuccess {
  hostId: string;
  hostName: string;
  url: string;
}

export interface ImageHostUploadFailure {
  hostId: string;
  hostName: string;
  error: string;
}

export interface ImageHostUploadBatch {
  successes: ImageHostUploadSuccess[];
  failures: ImageHostUploadFailure[];
}

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
  backgroundColor: string;
  backgroundPattern: BackgroundPattern;
  backgroundPatternColor: string;
  fontFamily: FontFamilyMode;
  customFont: string;
  fontSize: number;
  edgeColor: string;
  edgeWidth: number;
  edgeStyle: EdgeStyle;
  nodeBackgroundColor: string;
  textColor: string;
  nodeBorderColor: string;
  nodeBorderWidth: number;
  defaultTextBold: boolean;
  defaultTextItalic: boolean;
  defaultTextUnderline: boolean;
  imageHosts: ImageHostConfig[];
  autoUploadEnabled: boolean;
  autoUploadDelaySeconds: number;
  autoUploadHostIds: string[];
  deleteLocalAfterUpload: boolean;
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
  backgroundColor: "",
  backgroundPattern: "grid",
  backgroundPatternColor: "#94a3b8",
  fontFamily: "obsidian",
  customFont: "",
  fontSize: 14,
  edgeColor: "",
  edgeWidth: 2.2,
  edgeStyle: "curved",
  nodeBackgroundColor: "",
  textColor: "",
  nodeBorderColor: "",
  nodeBorderWidth: 1,
  defaultTextBold: false,
  defaultTextItalic: false,
  defaultTextUnderline: false,
  imageHosts: [],
  autoUploadEnabled: false,
  autoUploadDelaySeconds: 10,
  autoUploadHostIds: [],
  deleteLocalAfterUpload: true
};

export function settingsToAppearance(settings: MindMapStudioSettings): MindMapAppearance {
  return {
    backgroundColor: settings.backgroundColor || undefined,
    backgroundPattern: settings.backgroundPattern,
    patternColor: settings.backgroundPatternColor || undefined,
    fontFamily: settings.fontFamily,
    customFont: settings.customFont.trim() || undefined,
    fontSize: settings.fontSize,
    edgeColor: settings.edgeColor || undefined,
    edgeWidth: settings.edgeWidth,
    edgeStyle: settings.edgeStyle,
    nodeColor: settings.nodeBackgroundColor || undefined,
    textColor: settings.textColor || undefined,
    nodeBorderColor: settings.nodeBorderColor || undefined,
    nodeBorderWidth: settings.nodeBorderWidth,
    bold: settings.defaultTextBold,
    italic: settings.defaultTextItalic,
    underline: settings.defaultTextUnderline
  };
}

export class MindMapStudioSettingTab extends PluginSettingTab {
  private readonly plugin: MindMapStudioPlugin;

  constructor(app: App, plugin: MindMapStudioPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "MindMap Studio" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "这里设置全局默认外观。打开脑图后，也可以点击工具栏中的调色板，为当前脑图单独保存一套样式。"
    });

    containerEl.createEl("h3", { text: "文件与布局" });

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
      .setName("默认主题")
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
      .setName("连线粗细")
      .setDesc("范围 0.5–8 像素。")
      .addSlider((slider) => slider
        .setLimits(0.5, 8, 0.5)
        .setDynamicTooltip()
        .setValue(this.plugin.settings.edgeWidth)
        .onChange(async (value) => {
          this.plugin.settings.edgeWidth = value;
          await this.saveAndRefresh();
        }));

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
  }

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

  private async saveAndRefresh(): Promise<void> {
    await this.plugin.saveSettings();
    this.plugin.refreshOpenViews();
  }
}
