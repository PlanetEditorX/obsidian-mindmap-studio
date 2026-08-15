/**
 * @file desktop-capture.ts
 * @description 桌面截图覆盖层、选区标注与本机静默抓屏回退。
 */

/** 截图编辑器的交互模式。 */
export type DesktopCaptureMode = "capture" | "capture-recognize";

/** 截图编辑器完成后的用户动作。 */
export type DesktopCaptureAction = "copy" | "recognize-copy" | "download";

/** 截图完成后返回的图片、动作及建议文件名。 */
export interface DesktopCaptureResult {
  blob: Blob;
  suggestedName: string;
  action: DesktopCaptureAction;
}

/** Electron 原生图片的最小接口。 */
interface ElectronNativeImage {
  isEmpty: () => boolean;
  toPNG: () => Uint8Array;
}

/** Electron 截图源。 */
interface ElectronDesktopSource {
  display_id?: string;
  thumbnail: ElectronNativeImage;
}

/** Electron 显示器边界。 */
interface ElectronDisplay {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor?: number;
  label?: string;
  primary?: boolean;
  active?: boolean;
  displays?: ElectronDisplay[];
}

/** Electron 浏览器窗口网页内容接口。 */
interface ElectronCaptureWebContents {
  on: (event: "console-message", listener: (event: unknown, level: number, message: string) => void) => void;
  executeJavaScript: <T>(code: string) => Promise<T>;
}

/** Electron 浏览器窗口最小接口。 */
interface ElectronCaptureWindow {
  loadFile: (path: string) => Promise<void>;
  show: () => void;
  focus: () => void;
  close: () => void;
  destroy: () => void;
  isDestroyed: () => boolean;
  once: (event: "closed", listener: () => void) => void;
  webContents: ElectronCaptureWebContents;
}

/** Electron 浏览器窗口构造器。 */
interface ElectronCaptureWindowConstructor {
  new(options: {
    x?: number;
    y?: number;
    width: number;
    height: number;
    show?: boolean;
    frame?: boolean;
    transparent?: boolean;
    resizable?: boolean;
    movable?: boolean;
    fullscreenable?: boolean;
    skipTaskbar?: boolean;
    alwaysOnTop?: boolean;
    backgroundColor?: string;
    webPreferences?: {
      nodeIntegration?: boolean;
      contextIsolation?: boolean;
      sandbox?: boolean;
    };
  }): ElectronCaptureWindow;
}

/** Electron 运行时中截图功能使用的最小宿主接口。 */
interface ElectronCaptureRuntime {
  clipboard: {
    writeImage?: (image: ElectronNativeImage) => void;
  };
  nativeImage?: {
    createFromBuffer: (bytes: Uint8Array) => ElectronNativeImage;
  };
  desktopCapturer?: {
    getSources: (options: {
      types: ["screen"];
      thumbnailSize: { width: number; height: number };
      fetchWindowIcons: false;
    }) => Promise<ElectronDesktopSource[]>;
  };
  screen?: {
    getCursorScreenPoint: () => { x: number; y: number };
    getDisplayNearestPoint: (point: { x: number; y: number }) => ElectronDisplay;
  };
  dialog?: {
    showSaveDialog: (options: {
      defaultPath: string;
      filters: Array<{ name: string; extensions: string[] }>;
    }) => Promise<{ canceled: boolean; filePath?: string }>;
  };
  BrowserWindow?: ElectronCaptureWindowConstructor & {
    getFocusedWindow?: () => ElectronWindowHandle | null;
  };
  remote?: ElectronWindowRuntime;
}

/** Electron 主窗口控制与主进程 API 所需的最小运行时接口。 */
interface ElectronWindowRuntime {
  getCurrentWindow?: () => ElectronWindowHandle | null;
  BrowserWindow?: ElectronCaptureRuntime["BrowserWindow"];
  screen?: ElectronCaptureRuntime["screen"];
  dialog?: ElectronCaptureRuntime["dialog"];
}

/** 截图前临时最小化、截图后恢复所需的主窗口接口。 */
interface ElectronWindowHandle {
  minimize: () => void;
  restore: () => void;
  show: () => void;
  focus: () => void;
  isDestroyed: () => boolean;
  isMinimized?: () => boolean;
}

/** 桌面截图命令使用的最小 Node.js 运行时接口。 */
interface NodeCaptureRuntime {
  platform: string;
  execFile: (
    command: string,
    args: string[],
    options: Record<string, unknown>,
    callback: (error: Error | null) => void
  ) => void;
  fs: {
    mkdtemp: (prefix: string) => Promise<string>;
    readFile: (path: string) => Promise<Uint8Array>;
    writeFile: (path: string, data: string | Uint8Array) => Promise<void>;
    rm: (path: string, options: { recursive: boolean; force: boolean }) => Promise<void>;
  };
  os: {
    homedir: () => string;
    tmpdir: () => string;
  };
  path: {
    join: (...parts: string[]) => string;
  };
}

/** 将任意 Uint8Array 复制为 Blob 接受的普通 ArrayBuffer，兼容 SharedArrayBuffer 类型声明。 */
export function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

/** 从 Obsidian 桌面端获取 Electron API；移动端或受限环境返回 null。 */
function getElectronRuntime(): ElectronCaptureRuntime | null {
  const requireFunction = typeof window !== "undefined"
    ? (window as unknown as { require?: (id: string) => unknown }).require
    : undefined;
  if (!requireFunction) return null;
  try {
    const electron = requireFunction("electron") as ElectronCaptureRuntime;
    if (!electron.remote) {
      try {
        electron.remote = requireFunction("@electron/remote") as ElectronWindowRuntime;
      } catch {
        // Newer desktop runtimes may intentionally omit @electron/remote.
      }
    }
    return electron;
  } catch {
    return null;
  }
}

/** 从 Electron 的新旧渲染器接口中取得当前 Obsidian 主窗口。 */
function getCurrentObsidianWindow(runtime: ElectronCaptureRuntime): ElectronWindowHandle | null {
  return runtime.BrowserWindow?.getFocusedWindow?.()
    ?? runtime.remote?.getCurrentWindow?.()
    ?? runtime.remote?.BrowserWindow?.getFocusedWindow?.()
    ?? null;
}

/** 等待窗口完成最小化，避免截图源中仍包含 Obsidian 窗口。 */
async function waitForWindowMinimized(windowHandle: ElectronWindowHandle): Promise<void> {
  const started = Date.now();
  while (!windowHandle.isDestroyed() && !windowHandle.isMinimized?.() && Date.now() - started < 1_000) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
}

/** 从 Obsidian 桌面端按需获取 Node.js API，避免移动端加载插件时静态引用 Node 模块。 */
function getNodeCaptureRuntime(): NodeCaptureRuntime | null {
  const requireFunction = (globalThis as unknown as { require?: (id: string) => unknown }).require
    ?? (typeof window !== "undefined" ? (window as unknown as { require?: (id: string) => unknown }).require : undefined);
  if (!requireFunction) return null;
  try {
    const childProcess = requireFunction("node:child_process") as Pick<NodeCaptureRuntime, "execFile">;
    const processModule = requireFunction("node:process") as { platform: string };
    const fs = requireFunction("node:fs/promises") as NodeCaptureRuntime["fs"];
    const os = requireFunction("node:os") as NodeCaptureRuntime["os"];
    const path = requireFunction("node:path") as NodeCaptureRuntime["path"];
    return { platform: processModule.platform, execFile: childProcess.execFile, fs, os, path };
  } catch {
    return null;
  }
}

/** 使用 execFile 执行一个截图候选命令。 */
function executeCaptureCommand(runtime: NodeCaptureRuntime, command: string, args: string[], timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    runtime.execFile(command, args, { windowsHide: true, timeout: timeoutMs, killSignal: "SIGKILL" }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/** 为可能被桌面权限或宿主 API 卡住的抓屏调用设置硬超时。 */
export async function withCaptureTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = globalThis.setTimeout(() => reject(new Error(`${label}超时（${timeoutMs}ms）`)), timeoutMs);
      })
    ]);
  } finally {
    if (timer !== undefined) globalThis.clearTimeout(timer);
  }
}

/** 将 data URL 中的 PNG 转成二进制。 */
function pngDataUrlToBytes(dataUrl: string): Uint8Array {
  const encoded = dataUrl.replace(/^data:image\/png;base64,/, "");
  const requireFunction = (globalThis as unknown as { require?: (id: string) => unknown }).require
    ?? (typeof window !== "undefined" ? (window as unknown as { require?: (id: string) => unknown }).require : undefined);
  if (!requireFunction) throw new Error("当前桌面运行时无法解码截图");
  const buffer = requireFunction("node:buffer") as { Buffer: { from: (value: string, encoding: "base64") => Uint8Array } };
  return new Uint8Array(buffer.Buffer.from(encoded, "base64"));
}

/** 截图编辑器向宿主窗口发送的消息。 */
interface CaptureEditorMessage {
  type: "MMS_CAPTURE_ACTION";
  token: string;
  action: DesktopCaptureAction | "cancel";
  exported?: {
    dataUrl: string;
    bounds: { x: number; y: number; width: number; height: number };
  };
}

/** 浏览器渲染器可直接提供的显示器信息。 */
interface BrowserDisplayMetrics {
  id?: number;
  left?: number;
  top?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scaleFactor?: number;
  label?: string;
  primary?: boolean;
  active?: boolean;
  displays?: BrowserDisplayMetrics[];
}

/** 截图覆盖层宿主，可由独立窗口或 Obsidian 内嵌 iframe 提供。 */
interface CaptureEditorHost {
  messageSource: Window;
  isClosed: () => boolean;
  focus: () => void;
  close: () => void;
}

/** 将浏览器显示器数据规范化为可用于截图和全局坐标显示的边界。 */
export function normalizeBrowserDisplay(metrics: BrowserDisplayMetrics): ElectronDisplay {
  const width = Math.max(1, Math.round(Number.isFinite(metrics.width) ? Number(metrics.width) : 1));
  const height = Math.max(1, Math.round(Number.isFinite(metrics.height) ? Number(metrics.height) : 1));
  const xValue = Number.isFinite(metrics.x) ? Number(metrics.x) : Number(metrics.left);
  const yValue = Number.isFinite(metrics.y) ? Number(metrics.y) : Number(metrics.top);
  const display: ElectronDisplay = {
    id: Number.isFinite(metrics.id) ? Number(metrics.id) : 0,
    bounds: {
      x: Math.round(Number.isFinite(xValue) ? xValue : 0),
      y: Math.round(Number.isFinite(yValue) ? yValue : 0),
      width,
      height
    },
    scaleFactor: Math.max(1, Number.isFinite(metrics.scaleFactor) ? Number(metrics.scaleFactor) : 1)
  };
  if (typeof metrics.label === "string") display.label = metrics.label;
  if (metrics.primary === true) display.primary = true;
  if (metrics.active === true) display.active = true;
  if (Array.isArray(metrics.displays) && metrics.displays.length) {
    display.displays = metrics.displays.map((item) => normalizeBrowserDisplay(item));
  }
  return display;
}

/** 读取鼠标所在 Obsidian 窗口对应的浏览器显示器信息，不依赖 Electron 主进程 screen API。 */
function getBrowserDisplay(): ElectronDisplay {
  const browserScreen = window.screen as Screen & { availLeft?: number; availTop?: number };
  return normalizeBrowserDisplay({
    left: browserScreen.availLeft,
    top: browserScreen.availTop,
    width: browserScreen.width,
    height: browserScreen.height,
    scaleFactor: window.devicePixelRatio
  });
}

/** 安全的 JSON 序列化函数，用于嵌入 HTML script 标签。 */
function safeStringify(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

/** 生成截图覆盖层页面；普通截图双击确认，截图并识别按三秒空闲计时确认。 */
export function captureEditorHtml(display: ElectronDisplay, mode: DesktopCaptureMode, imageDataUrl = "screen.png", messageToken = "test-token"): string {
  const bounds = safeStringify(display.bounds);
  const displays = safeStringify((display.displays?.length ? display.displays : [display]).map((item) => ({
    id: item.id,
    bounds: item.bounds,
    scaleFactor: item.scaleFactor ?? 1,
    label: item.label,
    primary: item.primary === true,
    active: item.active === true
  })));
  const captureMode = safeStringify(mode);
  const source = safeStringify(imageDataUrl);
  const token = safeStringify(messageToken);
  const invisibleToolbarClass = mode === "capture-recognize" ? " recognition-invisible" : "";
  const toolbarMarkup = `<div id="toolbar" class="toolbar${invisibleToolbarClass}" aria-hidden="${mode === "capture-recognize" ? "true" : "false"}">
<button data-tool="shape">几何图形</button><button data-tool="pen">画笔</button><button data-tool="arrow">箭头</button><button data-tool="text">文字</button><button data-tool="number">序号</button><button data-tool="mosaic">马赛克</button><button data-tool="eraser">橡皮擦</button><span class="sep"></span>
<button data-action="recognize-copy">识别并复制</button><button data-action="download">下载</button><button class="danger" data-action="cancel">取消</button><button class="primary" data-action="copy">复制</button></div>`;
  const stylebarMarkup = `<div id="stylebar" class="stylebar${invisibleToolbarClass}" aria-hidden="${mode === "capture-recognize" ? "true" : "false"}">
<div data-style-group="shape"><button class="shape-option active" data-shape="rect">矩形</button><button class="shape-option" data-shape="round">圆角</button><button class="shape-option" data-shape="ellipse">椭圆</button><span class="sep"></span></div>
<div data-style-group="arrow"><button class="line-option active" data-line-style="arrow">箭头</button><button class="line-option" data-line-style="line">直线</button><span class="sep"></span></div>
<button class="color-dot active" data-color="#ff3b30" style="background:#ff3b30" aria-label="红色"></button><button class="color-dot" data-color="#ffcc00" style="background:#ffcc00" aria-label="黄色"></button><button class="color-dot" data-color="#34c759" style="background:#34c759" aria-label="绿色"></button><button class="color-dot" data-color="#0a84ff" style="background:#0a84ff" aria-label="蓝色"></button><button class="color-dot" data-color="#ffffff" style="background:#ffffff" aria-label="白色"></button><button class="color-dot" data-color="#111111" style="background:#111111" aria-label="黑色"></button><span class="sep"></span>
<button class="width-swatch" data-width="2">细</button><button class="width-swatch active" data-width="4">中</button><button class="width-swatch" data-width="8">粗</button><span class="sep"></span><button data-fill="toggle">填充</button>
</div>`;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: file: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
<title>MindMap Studio 截图</title><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0b0f14;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;user-select:none;color:#fff}
#base,#annotations,#preview{position:fixed;inset:0;width:100%;height:100%}#base{z-index:0;background:#0b0f14}#annotations{z-index:1;pointer-events:none}#preview{z-index:2;pointer-events:none}
.shade{position:fixed;background:rgba(4,8,13,.5);z-index:3;pointer-events:none;backdrop-filter:saturate(.9)}
.selection{position:fixed;border:2px solid rgba(42,179,255,.98);border-radius:9px;box-shadow:0 0 0 1px rgba(255,255,255,.9),0 0 0 4px rgba(0,0,0,.28),0 6px 26px rgba(0,142,230,.36);z-index:4;pointer-events:none}
.drag-strip{position:absolute;left:10px;right:10px;top:-4px;height:15px;cursor:move;pointer-events:auto}.metrics{position:absolute;left:-1px;bottom:100%;margin-bottom:9px;background:rgba(13,20,31,.92);color:#fff;border:1px solid rgba(255,255,255,.17);border-radius:8px;padding:6px 9px;font-size:12px;line-height:1;white-space:nowrap;pointer-events:auto;cursor:move;box-shadow:0 7px 18px rgba(0,0,0,.3);backdrop-filter:blur(10px)}
.edge-hit{position:absolute;pointer-events:auto}.edge-hit.north{left:8px;right:8px;top:-5px;height:10px}.edge-hit.east{right:-5px;top:8px;bottom:8px;width:10px}.edge-hit.south{left:8px;right:8px;bottom:-5px;height:10px}.edge-hit.west{left:-5px;top:8px;bottom:8px;width:10px}.handle{position:absolute;width:11px;height:11px;background:#fff;border:2px solid #169fe8;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,.55);pointer-events:auto}.nw{left:-6px;top:-6px;cursor:nwse-resize}.n{left:50%;top:-6px;transform:translateX(-50%);cursor:ns-resize}.ne{right:-6px;top:-6px;cursor:nesw-resize}.e{right:-6px;top:50%;transform:translateY(-50%);cursor:ew-resize}.se{right:-6px;bottom:-6px;cursor:nwse-resize}.s{left:50%;bottom:-6px;transform:translateX(-50%);cursor:ns-resize}.sw{left:-6px;bottom:-6px;cursor:nesw-resize}.w{left:-6px;top:50%;transform:translateY(-50%);cursor:ew-resize}
#drawLayer{position:fixed;z-index:5;cursor:crosshair}.toolbar,.stylebar,.screen-switcher{position:fixed;z-index:8;display:flex;align-items:center;gap:4px;padding:6px;background:rgba(13,20,31,.94);border:1px solid rgba(255,255,255,.15);border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,.38);white-space:nowrap;backdrop-filter:blur(14px)}
.toolbar button,.stylebar button,.screen-switcher button{height:34px;border:0;border-radius:8px;padding:0 10px;background:transparent;color:#e8eef7;font-size:12px;cursor:pointer}.toolbar button:hover,.stylebar button:hover,.screen-switcher button:hover{background:rgba(255,255,255,.1)}.toolbar button.active,.stylebar button.active,.screen-switcher button.active{background:#1976d2;color:#fff}.toolbar .sep,.stylebar .sep{width:1px;height:22px;background:rgba(255,255,255,.16);margin:0 2px}.toolbar .primary{background:#1976d2}.toolbar .danger:hover{background:#b4232f}.recognition-invisible{opacity:0!important;pointer-events:none!important}
.stylebar{display:none;padding:5px 7px;z-index:9}.stylebar.show{display:flex}.color-dot{width:24px!important;height:24px!important;padding:0!important;border-radius:50%!important;border:2px solid rgba(255,255,255,.72)!important;box-shadow:0 0 0 1px rgba(0,0,0,.35)}.color-dot.active{outline:2px solid #fff;outline-offset:2px}.width-swatch{min-width:34px;padding:0 8px!important}.shape-option,.line-option{min-width:42px}.screen-switcher{left:14px;top:14px;z-index:10;padding:5px}.screen-switcher.hidden{display:none}
#tip{position:fixed;right:14px;top:14px;z-index:10;color:#fff;background:rgba(13,20,31,.76);border:1px solid rgba(255,255,255,.12);padding:8px 11px;border-radius:9px;font-size:12px;pointer-events:none;backdrop-filter:blur(10px)}
#countdown{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:11;display:none;min-width:176px;padding:10px 16px;border-radius:999px;background:rgba(8,17,28,.9);border:1px solid rgba(75,190,255,.65);box-shadow:0 10px 30px rgba(0,0,0,.38),0 0 22px rgba(33,160,230,.22);color:#fff;font-size:14px;font-weight:650;text-align:center;letter-spacing:.2px;pointer-events:none;backdrop-filter:blur(12px)}#countdown.show{display:block}
#textEditor{position:fixed;z-index:12;display:none;min-width:180px;min-height:48px;max-width:420px;padding:7px 9px;border:2px solid #239fe8;border-radius:8px;outline:none;background:rgba(255,255,255,.98);color:#111;caret-color:#111;box-shadow:0 8px 28px rgba(0,0,0,.36);resize:both;user-select:text;pointer-events:auto;line-height:1.35;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}
</style></head><body>
<canvas id="base"></canvas><canvas id="annotations"></canvas><canvas id="preview"></canvas>
<div id="shadeTop" class="shade"></div><div id="shadeLeft" class="shade"></div><div id="shadeRight" class="shade"></div><div id="shadeBottom" class="shade"></div>
<div id="selection" class="selection"><div class="drag-strip" data-drag="move"></div><div id="metrics" class="metrics" data-drag="move"></div>
<div class="edge-hit north" data-border="north"></div><div class="edge-hit east" data-border="east"></div><div class="edge-hit south" data-border="south"></div><div class="edge-hit west" data-border="west"></div>
<div class="handle nw" data-handle="nw"></div><div class="handle n" data-handle="n"></div><div class="handle ne" data-handle="ne"></div><div class="handle e" data-handle="e"></div><div class="handle se" data-handle="se"></div><div class="handle s" data-handle="s"></div><div class="handle sw" data-handle="sw"></div><div class="handle w" data-handle="w"></div></div>
<div id="drawLayer"></div>
${toolbarMarkup}
${stylebarMarkup}
<div id="screenSwitcher" class="screen-switcher"></div><textarea id="textEditor" spellcheck="false" placeholder="输入文字，Ctrl/Cmd + Enter 完成"></textarea><div id="tip"></div><div id="countdown" role="status" aria-live="polite"></div>
<script>
(() => {
  const virtualBounds=${bounds}; const availableDisplays=${displays}; const captureMode=${captureMode}; const messageToken=${token}; const recognizeMode=captureMode==='capture-recognize';
  const base=document.getElementById('base'); const ann=document.getElementById('annotations'); const preview=document.getElementById('preview'); const bctx=base.getContext('2d'); const actx=ann.getContext('2d'); const pctx=preview.getContext('2d');
  const selection=document.getElementById('selection'); const metrics=document.getElementById('metrics'); const toolbar=document.getElementById('toolbar'); const stylebar=document.getElementById('stylebar'); const screenSwitcher=document.getElementById('screenSwitcher'); const drawLayer=document.getElementById('drawLayer'); const textEditor=document.getElementById('textEditor'); const tip=document.getElementById('tip'); const countdown=document.getElementById('countdown');
  const shades=['shadeTop','shadeLeft','shadeRight','shadeBottom'].map(id=>document.getElementById(id)); const dpr=Math.max(1,window.devicePixelRatio||1); const autoConfirmDelayMs=3000; const minSize=36;
  let tool=''; let drawing=false; let start=null; let number=1; let drag=null; let selectionDraw=null; let autoConfirmTimer=null; let autoConfirmTicker=null; let autoConfirmDeadline=0; let autoConfirmArmed=false; let autoConfirmPaused=false; let pointerOnBorder=false; let activeTextPoint=null;
  let strokeColor='#ff3b30'; let strokeWidth=4; let fillShape=false; let shapeKind='rect'; let lineKind='arrow'; let viewBounds=(availableDisplays.find(item=>item.active)||availableDisplays.find(item=>item.primary)||availableDisplays[0]||{bounds:virtualBounds}).bounds; let imageArea={x:0,y:0,w:innerWidth,h:innerHeight}; let rect={x:0,y:0,w:0,h:0};
  tip.textContent=recognizeMode?'离开选区边框后开始 3、2、1 倒计时；悬停边框或调整时暂停，Esc 取消':'拖动或调整蓝色边框；双击选区复制并插入节点，Esc 取消';
  const image=new Image(); image.src=${source};
  function resizeCanvas(c,ctx){c.width=Math.round(innerWidth*dpr);c.height=Math.round(innerHeight*dpr);c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
  function computeImageArea(){const vw=Math.max(1,viewBounds.width),vh=Math.max(1,viewBounds.height),windowRatio=innerWidth/Math.max(1,innerHeight),viewRatio=vw/vh;if(viewRatio>windowRatio){imageArea.w=innerWidth;imageArea.h=innerWidth/viewRatio;imageArea.x=0;imageArea.y=(innerHeight-imageArea.h)/2}else{imageArea.h=innerHeight;imageArea.w=innerHeight*viewRatio;imageArea.y=0;imageArea.x=(innerWidth-imageArea.w)/2}}
  function resetSelection(){rect={x:imageArea.x,y:imageArea.y,w:imageArea.w,h:imageArea.h};updateRect()}
  function drawBase(){if(!image.complete)return;computeImageArea();bctx.clearRect(0,0,innerWidth,innerHeight);bctx.fillStyle='#0b0f14';bctx.fillRect(0,0,innerWidth,innerHeight);const px=image.naturalWidth/Math.max(1,virtualBounds.width),py=image.naturalHeight/Math.max(1,virtualBounds.height);const sx=(viewBounds.x-virtualBounds.x)*px,sy=(viewBounds.y-virtualBounds.y)*py,sw=viewBounds.width*px,sh=viewBounds.height*py;bctx.imageSmoothingEnabled=true;bctx.imageSmoothingQuality='high';bctx.drawImage(image,sx,sy,sw,sh,imageArea.x,imageArea.y,imageArea.w,imageArea.h)}
  function resizeCanvases(){resizeCanvas(base,bctx);resizeCanvas(ann,actx);resizeCanvas(preview,pctx);drawBase();resetSelection()}
  image.onload=()=>{buildScreenSwitcher();resizeCanvases();if(recognizeMode)armAutoConfirm();document.body.tabIndex=-1;requestAnimationFrame(()=>document.body.focus({preventScroll:true}))}; window.addEventListener('resize',resizeCanvases);
  function clamp(){rect.w=Math.max(minSize,Math.min(imageArea.w,rect.w));rect.h=Math.max(minSize,Math.min(imageArea.h,rect.h));rect.x=Math.max(imageArea.x,Math.min(imageArea.x+imageArea.w-rect.w,rect.x));rect.y=Math.max(imageArea.y,Math.min(imageArea.y+imageArea.h-rect.h,rect.y))}
  function viewportToGlobal(x,y){return{x:viewBounds.x+(x-imageArea.x)*viewBounds.width/Math.max(1,imageArea.w),y:viewBounds.y+(y-imageArea.y)*viewBounds.height/Math.max(1,imageArea.h)}}
  function updateRect(){clamp();selection.style.left=rect.x+'px';selection.style.top=rect.y+'px';selection.style.width=rect.w+'px';selection.style.height=rect.h+'px';drawLayer.style.left=rect.x+'px';drawLayer.style.top=rect.y+'px';drawLayer.style.width=rect.w+'px';drawLayer.style.height=rect.h+'px';
    shades[0].style.cssText='left:0;top:0;width:100%;height:'+rect.y+'px';shades[1].style.cssText='left:0;top:'+rect.y+'px;width:'+rect.x+'px;height:'+rect.h+'px';shades[2].style.cssText='left:'+(rect.x+rect.w)+'px;top:'+rect.y+'px;width:'+(innerWidth-rect.x-rect.w)+'px;height:'+rect.h+'px';shades[3].style.cssText='left:0;top:'+(rect.y+rect.h)+'px;width:100%;height:'+(innerHeight-rect.y-rect.h)+'px';
    const topLeft=viewportToGlobal(rect.x,rect.y),bottomRight=viewportToGlobal(rect.x+rect.w,rect.y+rect.h);metrics.textContent='X '+Math.round(topLeft.x)+'  Y '+Math.round(topLeft.y)+'  '+Math.round(bottomRight.x-topLeft.x)+' × '+Math.round(bottomRight.y-topLeft.y);placeToolbar()}
  function placeToolbar(){const tw=toolbar.offsetWidth||820,th=toolbar.offsetHeight||48;let left=Math.max(8,Math.min(innerWidth-tw-8,rect.x+rect.w/2-tw/2));let top=rect.y+rect.h+12;if(top+th>innerHeight-8)top=Math.max(8,rect.y-th-12);toolbar.style.left=left+'px';toolbar.style.top=top+'px';const sw=stylebar.offsetWidth||620,sh=stylebar.offsetHeight||44;stylebar.style.left=Math.max(8,Math.min(innerWidth-sw-8,left))+'px';let styleTop=top+th+7;if(styleTop+sh>innerHeight-8)styleTop=Math.max(8,top-sh-7);stylebar.style.top=styleTop+'px'}
  function buildScreenSwitcher(){screenSwitcher.textContent='';const options=[];if(availableDisplays.length>1)options.push({label:'全部屏幕',bounds:virtualBounds,key:'all'});availableDisplays.forEach((item,index)=>options.push({label:'屏幕 '+(index+1),bounds:item.bounds,key:String(item.id)}));if(options.length<=1){screenSwitcher.classList.add('hidden');return}options.forEach(option=>{const button=document.createElement('button');button.textContent=option.label;button.classList.toggle('active',sameBounds(option.bounds,viewBounds));button.addEventListener('click',()=>{if(sameBounds(option.bounds,viewBounds))return;viewBounds=option.bounds;screenSwitcher.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));actx.clearRect(0,0,innerWidth,innerHeight);pctx.clearRect(0,0,innerWidth,innerHeight);drawBase();resetSelection();if(recognizeMode)armAutoConfirm();tip.textContent='已切换到 '+option.label+'；切换屏幕后已清除当前标注'});screenSwitcher.appendChild(button)})}
  function sameBounds(a,b){return a.x===b.x&&a.y===b.y&&a.width===b.width&&a.height===b.height}
  function point(ev){return{x:ev.clientX,y:ev.clientY}} function localPoint(ev){return{x:ev.clientX-rect.x,y:ev.clientY-rect.y}} function insideRect(x,y){return x>=rect.x&&x<=rect.x+rect.w&&y>=rect.y&&y<=rect.y+rect.h} function insideImage(x,y){return x>=imageArea.x&&x<=imageArea.x+imageArea.w&&y>=imageArea.y&&y<=imageArea.y+imageArea.h}
  function stopAutoConfirmTimers(){if(autoConfirmTimer!==null){clearTimeout(autoConfirmTimer);autoConfirmTimer=null}if(autoConfirmTicker!==null){clearInterval(autoConfirmTicker);autoConfirmTicker=null}} function renderCountdown(){if(!recognizeMode||!autoConfirmArmed||autoConfirmPaused){countdown.classList.remove('show');countdown.textContent='';return}const remaining=Math.max(0,autoConfirmDeadline-Date.now());const seconds=Math.max(1,Math.ceil(remaining/1000));countdown.classList.add('show');countdown.textContent=seconds+' 秒后自动识别'} function clearAutoConfirm(){stopAutoConfirmTimers();autoConfirmDeadline=0;autoConfirmPaused=false;countdown.classList.remove('show');countdown.textContent=''} function pauseAutoConfirm(){if(!recognizeMode||!autoConfirmArmed)return;stopAutoConfirmTimers();autoConfirmDeadline=0;autoConfirmPaused=true;countdown.classList.remove('show');countdown.textContent=''} function scheduleAutoConfirm(){if(!recognizeMode||!autoConfirmArmed)return;stopAutoConfirmTimers();autoConfirmPaused=false;autoConfirmDeadline=Date.now()+autoConfirmDelayMs;renderCountdown();autoConfirmTicker=setInterval(renderCountdown,150);autoConfirmTimer=setTimeout(()=>{if(pointerOnBorder||drag||selectionDraw||drawing||textEditor.style.display==='block'){pauseAutoConfirm();return}action('copy')},autoConfirmDelayMs)} function armAutoConfirm(){if(!recognizeMode)return;autoConfirmArmed=true;if(pointerOnBorder||drag||selectionDraw||drawing)pauseAutoConfirm();else scheduleAutoConfirm()} function resetAutoConfirm(){if(recognizeMode&&autoConfirmArmed)scheduleAutoConfirm()} function enterAutoConfirmPause(){pointerOnBorder=true;pauseAutoConfirm()} function leaveAutoConfirmPause(){pointerOnBorder=false;if(recognizeMode&&autoConfirmArmed&&!drag&&!selectionDraw&&!drawing)scheduleAutoConfirm()}
  function beginResize(ev,handle){ev.preventDefault();ev.stopPropagation();commitText();pointerOnBorder=true;pauseAutoConfirm();drag={kind:handle,start:point(ev),rect:{...rect}};window.addEventListener('pointermove',moveResize);window.addEventListener('pointerup',endResize,{once:true})}
  function moveResize(ev){if(!drag)return;pauseAutoConfirm();const dx=ev.clientX-drag.start.x,dy=ev.clientY-drag.start.y,r=drag.rect;let x=r.x,y=r.y,w=r.w,h=r.h;if(drag.kind==='move'){x=r.x+dx;y=r.y+dy}else{if(drag.kind.includes('e'))w=r.w+dx;if(drag.kind.includes('s'))h=r.h+dy;if(drag.kind.includes('w')){x=r.x+dx;w=r.w-dx}if(drag.kind.includes('n')){y=r.y+dy;h=r.h-dy}if(w<minSize){if(drag.kind.includes('w'))x-=minSize-w;w=minSize}if(h<minSize){if(drag.kind.includes('n'))y-=minSize-h;h=minSize}}rect={x,y,w,h};updateRect()}
  function endResize(){drag=null;window.removeEventListener('pointermove',moveResize);if(pointerOnBorder)pauseAutoConfirm();else armAutoConfirm()}
  selection.querySelectorAll('[data-handle]').forEach(el=>el.addEventListener('pointerdown',ev=>beginResize(ev,el.dataset.handle)));selection.querySelectorAll('[data-drag]').forEach(el=>el.addEventListener('pointerdown',ev=>beginResize(ev,'move')));selection.querySelectorAll('[data-handle],[data-drag],[data-border]').forEach(el=>{el.addEventListener('pointerenter',enterAutoConfirmPause);el.addEventListener('pointerleave',leaveAutoConfirmPause)});
  function beginSelection(ev){if(ev.button!==0||tool||!insideImage(ev.clientX,ev.clientY)||ev.target.closest('.toolbar')||ev.target.closest('.stylebar')||ev.target.closest('.screen-switcher')||ev.target.closest('[data-handle]')||ev.target.closest('[data-drag]')||ev.target.closest('[data-border]')||ev.target===textEditor)return;commitText();pauseAutoConfirm();selectionDraw={start:point(ev),active:false};window.addEventListener('pointermove',moveSelection);window.addEventListener('pointerup',endSelection,{once:true})}
  function moveSelection(ev){if(!selectionDraw)return;const endX=Math.max(imageArea.x,Math.min(imageArea.x+imageArea.w,ev.clientX)),endY=Math.max(imageArea.y,Math.min(imageArea.y+imageArea.h,ev.clientY)),dx=endX-selectionDraw.start.x,dy=endY-selectionDraw.start.y;if(!selectionDraw.active&&Math.hypot(dx,dy)<4)return;selectionDraw.active=true;pauseAutoConfirm();rect={x:Math.min(selectionDraw.start.x,endX),y:Math.min(selectionDraw.start.y,endY),w:Math.max(minSize,Math.abs(dx)),h:Math.max(minSize,Math.abs(dy))};updateRect()}
  function endSelection(){selectionDraw=null;window.removeEventListener('pointermove',moveSelection);if(recognizeMode){pointerOnBorder=false;armAutoConfirm()}}
  document.addEventListener('pointerdown',beginSelection);
  function setTool(next){commitText();tool=tool===next?'':next;toolbar.querySelectorAll('[data-tool]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tool===tool));drawLayer.style.pointerEvents=tool?'auto':'none';stylebar.classList.toggle('show',Boolean(tool&&['shape','pen','arrow','text','number'].includes(tool)));stylebar.querySelector('[data-style-group="shape"]').style.display=tool==='shape'?'contents':'none';stylebar.querySelector('[data-style-group="arrow"]').style.display=tool==='arrow'?'contents':'none';stylebar.querySelector('[data-fill]').style.display=tool==='shape'?'inline-flex':'none';placeToolbar()}
  toolbar.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>setTool(btn.dataset.tool)));
  stylebar.querySelectorAll('[data-color]').forEach(btn=>btn.addEventListener('click',()=>{strokeColor=btn.dataset.color;stylebar.querySelectorAll('[data-color]').forEach(item=>item.classList.toggle('active',item===btn));resetAutoConfirm()}));
  stylebar.querySelectorAll('[data-width]').forEach(btn=>btn.addEventListener('click',()=>{strokeWidth=Number(btn.dataset.width)||4;stylebar.querySelectorAll('[data-width]').forEach(item=>item.classList.toggle('active',item===btn));resetAutoConfirm()}));
  stylebar.querySelectorAll('[data-shape]').forEach(btn=>btn.addEventListener('click',()=>{shapeKind=btn.dataset.shape;stylebar.querySelectorAll('[data-shape]').forEach(item=>item.classList.toggle('active',item===btn));resetAutoConfirm()}));
  stylebar.querySelectorAll('[data-line-style]').forEach(btn=>btn.addEventListener('click',()=>{lineKind=btn.dataset.lineStyle;stylebar.querySelectorAll('[data-line-style]').forEach(item=>item.classList.toggle('active',item===btn));resetAutoConfirm()}));
  stylebar.querySelector('[data-fill]').addEventListener('click',ev=>{fillShape=!fillShape;ev.currentTarget.classList.toggle('active',fillShape);resetAutoConfirm()});
  function applyStyle(ctx){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=strokeColor;ctx.fillStyle=strokeColor;ctx.lineWidth=strokeWidth;ctx.shadowColor='rgba(0,0,0,.22)';ctx.shadowBlur=1}
  function roundedRectPath(ctx,x,y,w,h,r){const left=Math.min(x,x+w),top=Math.min(y,y+h),right=Math.max(x,x+w),bottom=Math.max(y,y+h),radius=Math.min(r,(right-left)/2,(bottom-top)/2);ctx.beginPath();ctx.moveTo(left+radius,top);ctx.lineTo(right-radius,top);ctx.quadraticCurveTo(right,top,right,top+radius);ctx.lineTo(right,bottom-radius);ctx.quadraticCurveTo(right,bottom,right-radius,bottom);ctx.lineTo(left+radius,bottom);ctx.quadraticCurveTo(left,bottom,left,bottom-radius);ctx.lineTo(left,top+radius);ctx.quadraticCurveTo(left,top,left+radius,top);ctx.closePath()}
  function drawShape(ctx,a,b){applyStyle(ctx);if(shapeKind==='ellipse'){ctx.beginPath();ctx.ellipse((a.x+b.x)/2,(a.y+b.y)/2,Math.abs(b.x-a.x)/2,Math.abs(b.y-a.y)/2,0,0,Math.PI*2)}else if(shapeKind==='round'){roundedRectPath(ctx,a.x,a.y,b.x-a.x,b.y-a.y,14)}else{roundedRectPath(ctx,a.x,a.y,b.x-a.x,b.y-a.y,2)}if(fillShape){ctx.save();ctx.globalAlpha=.2;ctx.fill();ctx.restore()}ctx.stroke()}
  function drawArrow(ctx,a,b){applyStyle(ctx);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(lineKind==='line')return;const angle=Math.atan2(b.y-a.y,b.x-a.x),head=Math.max(13,strokeWidth*3.2);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-head*Math.cos(angle-Math.PI/7),b.y-head*Math.sin(angle-Math.PI/7));ctx.lineTo(b.x-head*Math.cos(angle+Math.PI/7),b.y-head*Math.sin(angle+Math.PI/7));ctx.closePath();ctx.fill()}
  function commitPreview(){actx.drawImage(preview,0,0,innerWidth,innerHeight);pctx.clearRect(0,0,innerWidth,innerHeight)}
  function mosaicAt(p){const size=32,small=6,sx=Math.max(imageArea.x,Math.min(imageArea.x+imageArea.w-size,rect.x+p.x-size/2)),sy=Math.max(imageArea.y,Math.min(imageArea.y+imageArea.h-size,rect.y+p.y-size/2)),tmp=document.createElement('canvas');tmp.width=small;tmp.height=small;const t=tmp.getContext('2d');t.drawImage(base,sx*dpr,sy*dpr,size*dpr,size*dpr,0,0,small,small);actx.save();actx.imageSmoothingEnabled=false;actx.drawImage(tmp,0,0,small,small,sx,sy,size,size);actx.restore()}
  function openTextEditor(p){commitText();activeTextPoint={x:rect.x+p.x,y:rect.y+p.y};textEditor.style.left=Math.max(8,Math.min(innerWidth-230,activeTextPoint.x))+'px';textEditor.style.top=Math.max(8,Math.min(innerHeight-90,activeTextPoint.y))+'px';textEditor.style.display='block';textEditor.style.color=strokeColor;textEditor.style.fontSize=Math.max(18,strokeWidth*5+10)+'px';textEditor.value='';requestAnimationFrame(()=>{textEditor.focus({preventScroll:true});textEditor.setSelectionRange(0,0)});resetAutoConfirm()}
  function commitText(cancel){if(textEditor.style.display!=='block')return;const value=textEditor.value.trimEnd(),point=activeTextPoint;textEditor.style.display='none';activeTextPoint=null;if(cancel||!value||!point)return;applyStyle(actx);const fontSize=Math.max(20,strokeWidth*5+12);actx.font='600 '+fontSize+'px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';actx.textAlign='left';actx.textBaseline='top';actx.shadowBlur=1;value.split(/\\n/).forEach((line,index)=>actx.fillText(line,point.x,point.y+index*fontSize*1.3));resetAutoConfirm()}
  textEditor.addEventListener('pointerdown',ev=>ev.stopPropagation());textEditor.addEventListener('click',ev=>ev.stopPropagation());textEditor.addEventListener('beforeinput',ev=>ev.stopPropagation());textEditor.addEventListener('input',ev=>{ev.stopPropagation();resetAutoConfirm()});textEditor.addEventListener('keydown',ev=>{ev.stopImmediatePropagation();if(ev.key==='Escape'){ev.preventDefault();commitText(true)}else if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey)&&!ev.isComposing){ev.preventDefault();commitText(false)}});textEditor.addEventListener('keyup',ev=>ev.stopImmediatePropagation());
  drawLayer.addEventListener('pointerdown',ev=>{if(!tool)return;resetAutoConfirm();const p=localPoint(ev);if(tool==='text'){ev.preventDefault();ev.stopPropagation();openTextEditor(p);return}if(tool==='number'){applyStyle(actx);actx.beginPath();actx.arc(rect.x+p.x,rect.y+p.y,15,0,Math.PI*2);actx.fill();actx.fillStyle=strokeColor==='#ffffff'?'#111':'#fff';actx.shadowBlur=0;actx.font='700 15px sans-serif';actx.textAlign='center';actx.textBaseline='middle';actx.fillText(String(number++),rect.x+p.x,rect.y+p.y);return}drawing=true;start=p;drawLayer.setPointerCapture(ev.pointerId);if(tool==='pen'||tool==='eraser'||tool==='mosaic')moveDraw(ev)});
  function moveDraw(ev){if(!drawing||!start)return;resetAutoConfirm();const p=localPoint(ev),a={x:rect.x+start.x,y:rect.y+start.y},b={x:rect.x+p.x,y:rect.y+p.y};if(tool==='pen'){applyStyle(actx);actx.beginPath();actx.moveTo(a.x,a.y);actx.lineTo(b.x,b.y);actx.stroke();start=p}else if(tool==='eraser'){actx.save();actx.globalCompositeOperation='destination-out';actx.lineWidth=Math.max(20,strokeWidth*5);actx.lineCap='round';actx.beginPath();actx.moveTo(a.x,a.y);actx.lineTo(b.x,b.y);actx.stroke();actx.restore();start=p}else if(tool==='mosaic'){mosaicAt(p);start=p}else{pctx.clearRect(0,0,innerWidth,innerHeight);if(tool==='shape')drawShape(pctx,a,b);else if(tool==='arrow')drawArrow(pctx,a,b)}}
  drawLayer.addEventListener('pointermove',moveDraw);drawLayer.addEventListener('pointerup',()=>{if(!drawing)return;if(tool==='shape'||tool==='arrow')commitPreview();drawing=false;start=null;armAutoConfirm()});
  window.__mmsExport=()=>{commitText(false);const sourcePixelsPerViewportX=(viewBounds.width/Math.max(1,imageArea.w))*(image.naturalWidth/Math.max(1,virtualBounds.width)),sourcePixelsPerViewportY=(viewBounds.height/Math.max(1,imageArea.h))*(image.naturalHeight/Math.max(1,virtualBounds.height));const sourceX=((viewBounds.x-virtualBounds.x)+(rect.x-imageArea.x)*viewBounds.width/Math.max(1,imageArea.w))*(image.naturalWidth/Math.max(1,virtualBounds.width)),sourceY=((viewBounds.y-virtualBounds.y)+(rect.y-imageArea.y)*viewBounds.height/Math.max(1,imageArea.h))*(image.naturalHeight/Math.max(1,virtualBounds.height));const out=document.createElement('canvas');out.width=Math.max(1,Math.round(rect.w*sourcePixelsPerViewportX));out.height=Math.max(1,Math.round(rect.h*sourcePixelsPerViewportY));const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,sourceX,sourceY,out.width,out.height,0,0,out.width,out.height);ctx.drawImage(ann,rect.x*dpr,rect.y*dpr,rect.w*dpr,rect.h*dpr,0,0,out.width,out.height);const topLeft=viewportToGlobal(rect.x,rect.y),bottomRight=viewportToGlobal(rect.x+rect.w,rect.y+rect.h);return{dataUrl:out.toDataURL('image/png'),bounds:{x:Math.round(topLeft.x),y:Math.round(topLeft.y),width:Math.round(bottomRight.x-topLeft.x),height:Math.round(bottomRight.y-topLeft.y)}}};
  function action(name){clearAutoConfirm();const exported=name==='cancel'?undefined:window.__mmsExport();const message={type:'MMS_CAPTURE_ACTION',token:messageToken,action:name,exported};const target=window.opener&&!window.opener.closed?window.opener:(window.parent!==window?window.parent:null);if(target)target.postMessage(message,'*')}
  toolbar.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>action(btn.dataset.action)));toolbar.addEventListener('pointermove',resetAutoConfirm);toolbar.addEventListener('pointerdown',resetAutoConfirm);stylebar.addEventListener('pointermove',resetAutoConfirm);stylebar.addEventListener('pointerdown',resetAutoConfirm);
  document.addEventListener('dblclick',ev=>{if(captureMode==='capture'&&!tool&&insideRect(ev.clientX,ev.clientY)&&!ev.target.closest('.toolbar')&&!ev.target.closest('.stylebar'))action('copy')});window.addEventListener('keydown',ev=>{if(ev.target===textEditor)return;if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();action('cancel');return}if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();action('copy')}},true);
  document.addEventListener('pointerdown',()=>{try{window.focus();document.body.focus({preventScroll:true})}catch{}},{capture:true});updateRect();setTimeout(placeToolbar,50);
})();
</script></body></html>`;
}


/** 保存截图到用户选择的位置；取消保存时仍返回 false。 */
async function saveCaptureDownload(runtime: ElectronCaptureRuntime, nodeRuntime: NodeCaptureRuntime, bytes: Uint8Array): Promise<boolean> {
  const defaultPath = nodeRuntime.path.join(nodeRuntime.os.homedir(), "Desktop", "mindmap-screenshot.png");
  const dialog = runtime.dialog ?? runtime.remote?.dialog;
  const selected = dialog
    ? await dialog.showSaveDialog({ defaultPath, filters: [{ name: "PNG 图片", extensions: ["png"] }] })
    : null;
  if (selected?.canceled) return false;
  await nodeRuntime.fs.writeFile(selected?.filePath || defaultPath, bytes);
  return true;
}

/** 返回当前平台用于静默抓取显示器图像的命令候选，不启动系统交互式选区。 */
export function nativeCaptureCommandCandidates(
  platform: string,
  display: ElectronDisplay,
  imagePath: string
): Array<{ command: string; args: string[] }> {
  const { x, y, width, height } = display.bounds;
  if (platform === "darwin") {
    return [{ command: "screencapture", args: ["-x", `-R${x},${y},${width},${height}`, imagePath] }];
  }
  if (platform === "linux") {
    const geometry = `${width}x${height}${x >= 0 ? "+" : ""}${x}${y >= 0 ? "+" : ""}${y}`;
    return [
      { command: "grim", args: ["-g", `${x},${y} ${width}x${height}`, imagePath] },
      { command: "import", args: ["-window", "root", "-crop", geometry, imagePath] },
      { command: "gnome-screenshot", args: ["-f", imagePath] },
      { command: "spectacle", args: ["-b", "-n", "-o", imagePath] }
    ];
  }
  return [];
}

/** 执行候选命令，直到真正生成非空 PNG 文件。 */
async function runNativeCaptureCandidates(
  runtime: NodeCaptureRuntime,
  candidates: Array<{ command: string; args: string[] }>,
  imagePath: string
): Promise<Uint8Array> {
  let lastError = "未找到可用的桌面抓屏命令";
  for (const candidate of candidates) {
    try {
      await executeCaptureCommand(runtime, candidate.command, candidate.args);
      const bytes = await runtime.fs.readFile(imagePath);
      if (bytes.length) return bytes;
      lastError = `${candidate.command} 没有生成截图`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(lastError);
}

/** Windows 使用 DPI 感知的 PowerShell 与系统绘图 API 抓取完整虚拟桌面，并返回全部显示器边界。 */
async function captureWindowsDisplay(
  runtime: NodeCaptureRuntime,
  directory: string,
  imagePath: string,
  fallbackDisplay: ElectronDisplay,
  hideForegroundWindow: boolean
): Promise<{ bytes: Uint8Array; display: ElectronDisplay }> {
  const scriptPath = runtime.path.join(directory, "capture-screen.ps1");
  const metadataPath = runtime.path.join(directory, "display.json");
  const script = `param([string]$ImagePath,[string]$MetadataPath,[int]$HideForegroundWindow)
$ErrorActionPreference = 'Stop'
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class MindMapStudioCaptureWindow {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);
}
"@
try {
  [void][MindMapStudioCaptureWindow]::SetProcessDpiAwarenessContext([IntPtr](-4))
} catch {
  [void][MindMapStudioCaptureWindow]::SetProcessDPIAware()
}
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$foreground = [IntPtr]::Zero
if ($HideForegroundWindow) {
  $foreground = [MindMapStudioCaptureWindow]::GetForegroundWindow()
  if ($foreground -ne [IntPtr]::Zero) {
    [void][MindMapStudioCaptureWindow]::ShowWindow($foreground, 6)
    Start-Sleep -Milliseconds 180
  }
}
try {
  $cursor = [System.Windows.Forms.Cursor]::Position
  $activeScreen = [System.Windows.Forms.Screen]::FromPoint($cursor)
  $virtual = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bitmap = New-Object System.Drawing.Bitmap -ArgumentList $virtual.Width, $virtual.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppPArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($virtual.X, $virtual.Y, 0, 0, $virtual.Size, [System.Drawing.CopyPixelOperation]::SourceCopy)
    $bitmap.Save($ImagePath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
  $monitors = @()
  $index = 0
  foreach ($screen in [System.Windows.Forms.Screen]::AllScreens) {
    $index += 1
    $b = $screen.Bounds
    $monitors += @{
      id = $index
      x = $b.X
      y = $b.Y
      width = $b.Width
      height = $b.Height
      scaleFactor = 1
      label = "display-$index"
      primary = $screen.Primary
      active = ($screen.DeviceName -eq $activeScreen.DeviceName)
    }
  }
  $metadata = @{
    id = 0
    x = $virtual.X
    y = $virtual.Y
    width = $virtual.Width
    height = $virtual.Height
    scaleFactor = 1
    label = "all-displays"
    displays = $monitors
  } | ConvertTo-Json -Depth 5 -Compress
  [System.IO.File]::WriteAllText($MetadataPath, $metadata, (New-Object System.Text.UTF8Encoding($false)))
} finally {
  if ($HideForegroundWindow -and $foreground -ne [IntPtr]::Zero) {
    [void][MindMapStudioCaptureWindow]::ShowWindow($foreground, 9)
    Start-Sleep -Milliseconds 80
  }
}
`;
  await runtime.fs.writeFile(scriptPath, "\uFEFF" + script);
  let lastError = "PowerShell 桌面抓屏失败";
  for (const command of ["powershell.exe", "pwsh.exe"]) {
    try {
      await executeCaptureCommand(runtime, command, [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-Sta",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-ImagePath",
        imagePath,
        "-MetadataPath",
        metadataPath,
        "-HideForegroundWindow",
        hideForegroundWindow ? "1" : "0"
      ]);
      const [bytes, metadataBytes] = await Promise.all([
        runtime.fs.readFile(imagePath),
        runtime.fs.readFile(metadataPath)
      ]);
      const metadata = JSON.parse(new TextDecoder().decode(metadataBytes).replace(/^\uFEFF/, "")) as BrowserDisplayMetrics;
      if (!bytes.length) throw new Error("PowerShell 没有生成截图");
      const normalized = normalizeBrowserDisplay(metadata);
      return { bytes, display: normalized };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`${lastError}；浏览器显示器范围为 ${fallbackDisplay.bounds.width}×${fallbackDisplay.bounds.height}`);
}


/** 使用本机非交互式命令抓取显示器或完整虚拟桌面，完全绕开 Electron 主进程 BrowserWindow/screen API。 */
async function captureDisplayWithNativeCommand(
  runtime: NodeCaptureRuntime,
  display: ElectronDisplay,
  hideForegroundWindow: boolean
): Promise<{ bytes: Uint8Array; display: ElectronDisplay }> {
  const directory = await runtime.fs.mkdtemp(runtime.path.join(runtime.os.tmpdir(), "mms-capture-source-"));
  const imagePath = runtime.path.join(directory, "screen.png");
  try {
    if (runtime.platform === "win32") {
      return await captureWindowsDisplay(runtime, directory, imagePath, display, hideForegroundWindow);
    }
    const bytes = await runNativeCaptureCandidates(
      runtime,
      nativeCaptureCommandCandidates(runtime.platform, display, imagePath),
      imagePath
    );
    return { bytes, display };
  } finally {
    try {
      await runtime.fs.rm(directory, { recursive: true, force: true });
    } catch (error) {
      console.warn("MindMap Studio capture: temporary files could not be removed", error);
    }
  }
}

/** 本机命令失败时，仅用渲染器可用的 desktopCapturer 抓取整屏；不会退回系统交互式截图。 */
async function captureDisplayWithRendererElectron(
  runtime: ElectronCaptureRuntime,
  display: ElectronDisplay
): Promise<{ bytes: Uint8Array; display: ElectronDisplay } | null> {
  if (!runtime.desktopCapturer) return null;
  const scaleFactor = Math.max(1, display.scaleFactor ?? 1);
  const sources = await runtime.desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: Math.max(1, Math.round(display.bounds.width * scaleFactor)),
      height: Math.max(1, Math.round(display.bounds.height * scaleFactor))
    },
    fetchWindowIcons: false
  });
  const source = sources.find((item) => String(item.display_id ?? "") === String(display.id))
    ?? sources.find((item) => !item.thumbnail.isEmpty());
  const bytes = source?.thumbnail.toPNG() ?? new Uint8Array();
  return bytes.length ? { bytes, display } : null;
}

/** 抓取截图源；Windows 优先抓取完整虚拟桌面，其他平台优先使用快速渲染器。 */
async function captureDisplaySource(
  electronRuntime: ElectronCaptureRuntime,
  nodeRuntime: NodeCaptureRuntime,
  hideObsidian: boolean
): Promise<{ bytes: Uint8Array; display: ElectronDisplay }> {
  const display = getBrowserDisplay();
  const windowHandle = getCurrentObsidianWindow(electronRuntime);
  const canHideWithWindowHandle = hideObsidian && Boolean(windowHandle && !windowHandle.isDestroyed());
  try {
    if (canHideWithWindowHandle && windowHandle) {
      windowHandle.minimize();
      await waitForWindowMinimized(windowHandle);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    const hideWithNativeCommand = hideObsidian && !canHideWithWindowHandle;
    if (nodeRuntime.platform === "win32") {
      try {
        console.info("MindMap Studio capture: trying native virtual-desktop capture");
        return await withCaptureTimeout(
          captureDisplayWithNativeCommand(nodeRuntime, display, hideWithNativeCommand),
          18_000,
          "本机虚拟桌面抓屏"
        );
      } catch (nativeError) {
        console.warn("MindMap Studio capture: native virtual-desktop capture unavailable", nativeError);
        if (electronRuntime.desktopCapturer) {
          try {
            const rendererCapture = await withCaptureTimeout(
              captureDisplayWithRendererElectron(electronRuntime, display),
              3_500,
              "Electron 桌面抓屏"
            );
            if (rendererCapture) return rendererCapture;
          } catch (rendererError) {
            console.warn("MindMap Studio capture: renderer fallback failed", rendererError);
          }
        }
        const reason = nativeError instanceof Error ? nativeError.message : String(nativeError);
        throw new Error(`无法启动 MindMap Studio 截图编辑器：虚拟桌面抓取失败（${reason}）`);
      }
    }

    const canTryRendererFirst = !hideObsidian || canHideWithWindowHandle;
    if (canTryRendererFirst && electronRuntime.desktopCapturer) {
      try {
        console.info("MindMap Studio capture: trying renderer desktopCapturer");
        const rendererCapture = await withCaptureTimeout(
          captureDisplayWithRendererElectron(electronRuntime, display),
          3_500,
          "Electron 桌面抓屏"
        );
        if (rendererCapture) return rendererCapture;
      } catch (error) {
        console.warn("MindMap Studio capture: renderer desktopCapturer unavailable", error);
      }
    }

    try {
      console.info("MindMap Studio capture: trying native full-screen capture");
      return await withCaptureTimeout(
        captureDisplayWithNativeCommand(nodeRuntime, display, hideWithNativeCommand),
        18_000,
        "本机桌面抓屏"
      );
    } catch (nativeError) {
      if (!canTryRendererFirst && electronRuntime.desktopCapturer) {
        try {
          const rendererCapture = await withCaptureTimeout(
            captureDisplayWithRendererElectron(electronRuntime, display),
            3_500,
            "Electron 桌面抓屏"
          );
          if (rendererCapture) return rendererCapture;
        } catch (rendererError) {
          console.warn("MindMap Studio capture: final renderer fallback failed", rendererError);
        }
      }
      const reason = nativeError instanceof Error ? nativeError.message : String(nativeError);
      throw new Error(`无法启动 MindMap Studio 截图编辑器：整屏抓取失败（${reason}）`);
    }
  } finally {
    if (canHideWithWindowHandle && windowHandle && !windowHandle.isDestroyed()) {
      windowHandle.restore();
      windowHandle.show();
      windowHandle.focus();
    }
  }
}


/** 在当前 Obsidian 窗口内创建全屏截图覆盖层，避免异步 window.open 被宿主拦截后形成不可见悬挂窗口。 */
function openCaptureEditorHost(html: string, _display: ElectronDisplay): CaptureEditorHost {
  const iframe = document.createElement("iframe");
  iframe.className = "mindmap-studio-capture-host";
  iframe.setAttribute("title", "MindMap Studio 截图编辑器");
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("tabindex", "-1");
  Object.assign(iframe.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    border: "0",
    margin: "0",
    padding: "0",
    zIndex: "2147483647",
    background: "#111",
    display: "block",
    visibility: "visible",
    opacity: "1",
    pointerEvents: "auto"
  });
  iframe.srcdoc = html;
  document.documentElement.appendChild(iframe);
  const messageSource = iframe.contentWindow;
  if (!messageSource) {
    iframe.remove();
    throw new Error("无法创建截图覆盖层窗口");
  }
  const focus = (): void => {
    iframe.focus();
    try {
      messageSource.focus();
    } catch {
      // The embedded editor remains usable even when the host denies explicit focus.
    }
  };
  iframe.addEventListener("load", focus, { once: true });
  window.setTimeout(focus, 0);
  return {
    messageSource,
    isClosed: () => !iframe.isConnected,
    focus,
    close: () => iframe.remove()
  };
}

/** 将裁剪结果写入系统剪贴板；Electron 剪贴板不可用时使用标准 Clipboard API。 */
async function writePngToClipboard(runtime: ElectronCaptureRuntime, bytes: Uint8Array): Promise<void> {
  const image = runtime.nativeImage?.createFromBuffer(bytes);
  if (image && !image.isEmpty() && runtime.clipboard.writeImage) {
    runtime.clipboard.writeImage(image);
    return;
  }
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": new Blob([copyBytesToArrayBuffer(bytes)], { type: "image/png" }) })]);
    return;
  }
  throw new Error("当前桌面运行时无法把截图写入系统剪贴板");
}

/** 在真实可达的渲染器窗口中运行截图编辑器并处理复制、下载和取消动作。 */
async function editCapturedDisplay(
  runtime: ElectronCaptureRuntime,
  nodeRuntime: NodeCaptureRuntime,
  captured: { bytes: Uint8Array; display: ElectronDisplay },
  mode: DesktopCaptureMode
): Promise<DesktopCaptureResult> {
  const randomValues = new Uint32Array(2);
  crypto.getRandomValues(randomValues);
  const token = `${Date.now()}-${randomValues[0].toString(36)}${randomValues[1].toString(36)}`;
  const imageUrl = URL.createObjectURL(new Blob([copyBytesToArrayBuffer(captured.bytes)], { type: "image/png" }));
  const html = captureEditorHtml(captured.display, mode, imageUrl, token);
  const host = openCaptureEditorHost(html, captured.display);
  host.focus();
  return await new Promise<DesktopCaptureResult>((resolve, reject) => {
    let settled = false;
    let finishing = false;
    let closeWatcher = 0;
    let onHostKeydown: ((event: KeyboardEvent) => void) | null = null;
    const cleanup = (): void => {
      window.removeEventListener("message", onMessage);
      if (onHostKeydown) {
        window.removeEventListener("keydown", onHostKeydown, true);
        host.messageSource.removeEventListener("keydown", onHostKeydown, true);
      }
      if (closeWatcher) window.clearInterval(closeWatcher);
      URL.revokeObjectURL(imageUrl);
    };
    const cancel = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      host.close();
      reject(new Error("取消截图操作"));
    };
    onHostKeydown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      cancel();
    };
    window.addEventListener("keydown", onHostKeydown, true);
    host.messageSource.addEventListener("keydown", onHostKeydown, true);
    const finish = async (message: CaptureEditorMessage): Promise<void> => {
      if (settled || finishing || !message.exported || message.action === "cancel") return;
      const action: DesktopCaptureAction = message.action;
      finishing = true;
      try {
        const bytes = pngDataUrlToBytes(message.exported.dataUrl);
        if (action === "download") {
          const saved = await saveCaptureDownload(runtime, nodeRuntime, bytes);
          if (!saved) {
            finishing = false;
            return;
          }
        } else if (action === "copy" || action === "recognize-copy") {
          await writePngToClipboard(runtime, bytes);
        }
        settled = true;
        cleanup();
        host.close();
        resolve({
          blob: new Blob([copyBytesToArrayBuffer(bytes)], { type: "image/png" }),
          suggestedName: "mindmap-screenshot.png",
          action
        });
      } catch (error) {
        settled = true;
        cleanup();
        host.close();
        reject(error);
      }
    };
    const onMessage = (event: MessageEvent<unknown>): void => {
      if (event.source !== host.messageSource || !event.data || typeof event.data !== "object") return;
      const message = event.data as Partial<CaptureEditorMessage>;
      if (message.type !== "MMS_CAPTURE_ACTION" || message.token !== token || typeof message.action !== "string") return;
      if (message.action === "cancel") {
        cancel();
        return;
      }
      if (message.action === "copy" || message.action === "recognize-copy" || message.action === "download") {
        void finish(message as CaptureEditorMessage);
      }
    };
    window.addEventListener("message", onMessage);
    closeWatcher = window.setInterval(() => {
      if (!settled && host.isClosed()) cancel();
    }, 250);
  });
}

/** 启动指定交互模式的桌面截图覆盖层；高级编辑器失败时给出明确错误，禁止静默回退系统截图。 */
export async function captureDesktopScreenshot(hideObsidian: boolean, mode: DesktopCaptureMode = "capture"): Promise<DesktopCaptureResult> {
  const electronRuntime = getElectronRuntime();
  const nodeRuntime = getNodeCaptureRuntime();
  if (!electronRuntime || !nodeRuntime) throw new Error("截图仅支持 Obsidian 桌面端");
  console.info("MindMap Studio capture: starting", { mode, hideObsidian });
  const captured = await captureDisplaySource(electronRuntime, nodeRuntime, hideObsidian);
  console.info("MindMap Studio capture: source ready", {
    width: captured.display.bounds.width,
    height: captured.display.bounds.height,
    bytes: captured.bytes.length
  });
  return editCapturedDisplay(electronRuntime, nodeRuntime, captured, mode);
}
