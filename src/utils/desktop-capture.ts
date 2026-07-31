/**
 * @file desktop-capture.ts
 * @description 桌面截图覆盖层、选区标注、固定窗口与本机静默抓屏回退。
 */

/** 截图编辑器的交互模式。 */
export type DesktopCaptureMode = "capture" | "capture-recognize";

/** 截图编辑器完成后的用户动作。 */
export type DesktopCaptureAction = "copy" | "recognize-copy" | "download" | "pin";

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
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleFactor?: number;
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
  return {
    id: 0,
    bounds: {
      x: Math.round(Number.isFinite(metrics.left) ? Number(metrics.left) : 0),
      y: Math.round(Number.isFinite(metrics.top) ? Number(metrics.top) : 0),
      width,
      height
    },
    scaleFactor: Math.max(1, Number.isFinite(metrics.scaleFactor) ? Number(metrics.scaleFactor) : 1)
  };
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

/** 将 PNG 二进制编码为可安全传给独立覆盖层的 data URL。 */
function pngBytesToDataUrl(bytes: Uint8Array): string {
  const requireFunction = (globalThis as unknown as { require?: (id: string) => unknown }).require
    ?? (typeof window !== "undefined" ? (window as unknown as { require?: (id: string) => unknown }).require : undefined);
  if (!requireFunction) throw new Error("当前桌面运行时无法编码截图");
  const buffer = requireFunction("node:buffer") as { Buffer: { from: (value: Uint8Array) => { toString: (encoding: "base64") => string } } };
  return `data:image/png;base64,${buffer.Buffer.from(bytes).toString("base64")}`;
}

/** 生成截图覆盖层页面；普通截图双击确认，截图并识别按三秒空闲计时确认。 */
export function captureEditorHtml(display: ElectronDisplay, mode: DesktopCaptureMode, imageDataUrl = "screen.png", messageToken = "test-token"): string {
  const bounds = JSON.stringify(display.bounds);
  const captureMode = JSON.stringify(mode);
  const source = JSON.stringify(imageDataUrl);
  const token = JSON.stringify(messageToken);
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: file: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
<title>MindMap Studio 截图</title><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;user-select:none}
#base,#annotations,#preview{position:fixed;inset:0;width:100%;height:100%}#base{z-index:0}#annotations{z-index:1;pointer-events:none}#preview{z-index:2;pointer-events:none}
.shade{position:fixed;background:rgba(0,0,0,.52);z-index:3;pointer-events:none}.selection{position:fixed;border:3px solid #00a8ff;box-shadow:0 0 0 1px #fff,0 0 0 4px rgba(0,0,0,.48),0 0 18px rgba(0,168,255,.72);z-index:4;pointer-events:none}
.drag-strip{position:absolute;left:0;right:0;top:-2px;height:12px;cursor:move;pointer-events:auto}.metrics{position:absolute;left:-2px;bottom:100%;margin-bottom:8px;background:rgba(15,23,42,.92);color:#fff;border:1px solid rgba(255,255,255,.22);border-radius:6px;padding:5px 8px;font-size:12px;white-space:nowrap;pointer-events:auto;cursor:move}
.handle{position:absolute;width:14px;height:14px;background:#fff;border:3px solid #008ee6;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.65);pointer-events:auto}.nw{left:-7px;top:-7px;cursor:nwse-resize}.n{left:50%;top:-7px;transform:translateX(-50%);cursor:ns-resize}.ne{right:-7px;top:-7px;cursor:nesw-resize}.e{right:-7px;top:50%;transform:translateY(-50%);cursor:ew-resize}.se{right:-7px;bottom:-7px;cursor:nwse-resize}.s{left:50%;bottom:-7px;transform:translateX(-50%);cursor:ns-resize}.sw{left:-7px;bottom:-7px;cursor:nesw-resize}.w{left:-7px;top:50%;transform:translateY(-50%);cursor:ew-resize}
#drawLayer{position:fixed;z-index:5;cursor:crosshair}.toolbar{position:fixed;z-index:8;display:flex;align-items:center;gap:4px;padding:6px;background:rgba(15,23,42,.96);border:1px solid rgba(255,255,255,.18);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.42);white-space:nowrap}
.toolbar button{height:34px;border:0;border-radius:7px;padding:0 10px;background:transparent;color:#e5edf8;font-size:12px;cursor:pointer}.toolbar button:hover{background:rgba(255,255,255,.12)}.toolbar button.active{background:#2563eb;color:#fff}.toolbar .sep{width:1px;height:22px;background:rgba(255,255,255,.18);margin:0 2px}.toolbar .primary{background:#2563eb}.toolbar .danger:hover{background:#b91c1c}
#tip{position:fixed;right:14px;top:14px;z-index:9;color:#fff;background:rgba(15,23,42,.78);padding:7px 10px;border-radius:7px;font-size:12px;pointer-events:none}
</style></head><body>
<canvas id="base"></canvas><canvas id="annotations"></canvas><canvas id="preview"></canvas>
<div id="shadeTop" class="shade"></div><div id="shadeLeft" class="shade"></div><div id="shadeRight" class="shade"></div><div id="shadeBottom" class="shade"></div>
<div id="selection" class="selection"><div class="drag-strip" data-drag="move"></div><div id="metrics" class="metrics" data-drag="move"></div>
<div class="handle nw" data-handle="nw"></div><div class="handle n" data-handle="n"></div><div class="handle ne" data-handle="ne"></div><div class="handle e" data-handle="e"></div><div class="handle se" data-handle="se"></div><div class="handle s" data-handle="s"></div><div class="handle sw" data-handle="sw"></div><div class="handle w" data-handle="w"></div></div>
<div id="drawLayer"></div><div id="toolbar" class="toolbar">
<button data-tool="shape">几何图形</button><button data-tool="pen">画笔</button><button data-tool="arrow">箭头</button><button data-tool="text">文字</button><button data-tool="number">序号</button><button data-tool="mosaic">马赛克</button><button data-tool="eraser">橡皮擦</button><span class="sep"></span>
<button data-action="recognize-copy">识别并复制</button><button data-action="pin">固定</button><button data-action="download">下载</button><button class="danger" data-action="cancel">取消</button><button class="primary" data-action="copy">复制</button></div>
<div id="tip"></div>
<script>
(() => {
  const displayBounds=${bounds}; const captureMode=${captureMode}; const messageToken=${token}; const recognizeMode=captureMode==='capture-recognize'; const base=document.getElementById('base'); const ann=document.getElementById('annotations'); const preview=document.getElementById('preview');
  const bctx=base.getContext('2d'); const actx=ann.getContext('2d'); const pctx=preview.getContext('2d'); const selection=document.getElementById('selection'); const metrics=document.getElementById('metrics'); const toolbar=document.getElementById('toolbar'); const drawLayer=document.getElementById('drawLayer'); const tip=document.getElementById('tip');
  const shades=['shadeTop','shadeLeft','shadeRight','shadeBottom'].map(id=>document.getElementById(id)); const dpr=Math.max(1,window.devicePixelRatio||1); const autoConfirmDelayMs=3000; let tool=''; let drawing=false; let start=null; let number=1; let drag=null; let selectionDraw=null; let autoConfirmTimer=null; let autoConfirmArmed=false; let pointerInsideSelection=false;
  let rect={x:Math.round(innerWidth*.18),y:Math.round(innerHeight*.16),w:Math.round(innerWidth*.64),h:Math.round(innerHeight*.62)}; const minSize=36; tip.textContent=recognizeMode?'拖动选择截图范围；释放后 3 秒自动完成，在选区内移动鼠标或调整边框可重置计时':'拖动或调整蓝色边框；双击选区复制并插入节点，Esc 取消';
  const image=new Image(); image.src=${source};
  function resizeCanvases(){for(const c of [base,ann,preview]){c.width=Math.round(innerWidth*dpr);c.height=Math.round(innerHeight*dpr);c.style.width=innerWidth+'px';c.style.height=innerHeight+'px'}; for(const c of [bctx,actx,pctx])c.setTransform(dpr,0,0,dpr,0,0); drawBase(); updateRect()}
  function drawBase(){if(!image.complete)return;bctx.clearRect(0,0,innerWidth,innerHeight);bctx.drawImage(image,0,0,innerWidth,innerHeight)}
  image.onload=()=>resizeCanvases(); window.addEventListener('resize',resizeCanvases);
  function clamp(){rect.w=Math.max(minSize,Math.min(innerWidth,rect.w));rect.h=Math.max(minSize,Math.min(innerHeight,rect.h));rect.x=Math.max(0,Math.min(innerWidth-rect.w,rect.x));rect.y=Math.max(0,Math.min(innerHeight-rect.h,rect.y))}
  function updateRect(){clamp();selection.style.left=rect.x+'px';selection.style.top=rect.y+'px';selection.style.width=rect.w+'px';selection.style.height=rect.h+'px';drawLayer.style.left=rect.x+'px';drawLayer.style.top=rect.y+'px';drawLayer.style.width=rect.w+'px';drawLayer.style.height=rect.h+'px';
    shades[0].style.cssText='left:0;top:0;width:100%;height:'+rect.y+'px';shades[1].style.cssText='left:0;top:'+rect.y+'px;width:'+rect.x+'px;height:'+rect.h+'px';shades[2].style.cssText='left:'+(rect.x+rect.w)+'px;top:'+rect.y+'px;width:'+(innerWidth-rect.x-rect.w)+'px;height:'+rect.h+'px';shades[3].style.cssText='left:0;top:'+(rect.y+rect.h)+'px;width:100%;height:'+(innerHeight-rect.y-rect.h)+'px';
    const coordinateScaleX=displayBounds.width/Math.max(1,innerWidth),coordinateScaleY=displayBounds.height/Math.max(1,innerHeight);metrics.textContent='X '+Math.round(displayBounds.x+rect.x*coordinateScaleX)+'  Y '+Math.round(displayBounds.y+rect.y*coordinateScaleY)+'  '+Math.round(rect.w*coordinateScaleX)+' × '+Math.round(rect.h*coordinateScaleY); placeToolbar()}
  function placeToolbar(){const tw=toolbar.offsetWidth||820,th=toolbar.offsetHeight||48;let left=Math.max(8,Math.min(innerWidth-tw-8,rect.x+rect.w/2-tw/2));let top=rect.y+rect.h+10;if(top+th>innerHeight-8)top=Math.max(8,rect.y-th-10);toolbar.style.left=left+'px';toolbar.style.top=top+'px'}
  function point(ev){return{x:ev.clientX,y:ev.clientY}}
  function localPoint(ev){return{x:ev.clientX-rect.x,y:ev.clientY-rect.y}}
  function insideRect(x,y){return x>=rect.x&&x<=rect.x+rect.w&&y>=rect.y&&y<=rect.y+rect.h}
  function clearAutoConfirm(){if(autoConfirmTimer!==null){clearTimeout(autoConfirmTimer);autoConfirmTimer=null}}
  function scheduleAutoConfirm(){if(!recognizeMode||!autoConfirmArmed)return;clearAutoConfirm();autoConfirmTimer=setTimeout(()=>{if(pointerInsideSelection||drag||selectionDraw||drawing){scheduleAutoConfirm();return}action('copy')},autoConfirmDelayMs)}
  function armAutoConfirm(){if(!recognizeMode)return;autoConfirmArmed=true;scheduleAutoConfirm()}
  function resetAutoConfirm(){if(recognizeMode&&autoConfirmArmed)scheduleAutoConfirm()}
  function beginResize(ev,handle){ev.preventDefault();ev.stopPropagation();clearAutoConfirm();drag={kind:handle,start:point(ev),rect:{...rect}};window.addEventListener('pointermove',moveResize);window.addEventListener('pointerup',endResize,{once:true})}
  function moveResize(ev){if(!drag)return;resetAutoConfirm();const dx=ev.clientX-drag.start.x,dy=ev.clientY-drag.start.y,r=drag.rect;let x=r.x,y=r.y,w=r.w,h=r.h;if(drag.kind==='move'){x=r.x+dx;y=r.y+dy}else{if(drag.kind.includes('e'))w=r.w+dx;if(drag.kind.includes('s'))h=r.h+dy;if(drag.kind.includes('w')){x=r.x+dx;w=r.w-dx}if(drag.kind.includes('n')){y=r.y+dy;h=r.h-dy}if(w<minSize){if(drag.kind.includes('w'))x-=minSize-w;w=minSize}if(h<minSize){if(drag.kind.includes('n'))y-=minSize-h;h=minSize}}rect={x,y,w,h};updateRect()}
  function endResize(){drag=null;window.removeEventListener('pointermove',moveResize);armAutoConfirm()}
  selection.querySelectorAll('[data-handle]').forEach(el=>el.addEventListener('pointerdown',ev=>beginResize(ev,el.dataset.handle)));selection.querySelectorAll('[data-drag]').forEach(el=>el.addEventListener('pointerdown',ev=>beginResize(ev,'move')));
  function beginSelection(ev){if(ev.button!==0||tool||ev.target.closest('.toolbar')||ev.target.closest('[data-handle]')||ev.target.closest('[data-drag]'))return;selectionDraw={start:point(ev),active:false};window.addEventListener('pointermove',moveSelection);window.addEventListener('pointerup',endSelection,{once:true})}
  function moveSelection(ev){if(!selectionDraw)return;const dx=ev.clientX-selectionDraw.start.x,dy=ev.clientY-selectionDraw.start.y;if(!selectionDraw.active&&Math.hypot(dx,dy)<4)return;selectionDraw.active=true;clearAutoConfirm();rect={x:Math.min(selectionDraw.start.x,ev.clientX),y:Math.min(selectionDraw.start.y,ev.clientY),w:Math.max(minSize,Math.abs(dx)),h:Math.max(minSize,Math.abs(dy))};updateRect()}
  function endSelection(){const completed=selectionDraw?.active===true;selectionDraw=null;window.removeEventListener('pointermove',moveSelection);if(completed)armAutoConfirm()}
  document.addEventListener('pointerdown',beginSelection);
  function setTool(next){tool=tool===next?'':next;toolbar.querySelectorAll('[data-tool]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tool===tool));drawLayer.style.pointerEvents=tool?'auto':'none'}
  toolbar.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>setTool(btn.dataset.tool)));
  function style(ctx){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#ff3b30';ctx.fillStyle='#ff3b30';ctx.lineWidth=3}
  function drawArrow(ctx,a,b){style(ctx);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();const angle=Math.atan2(b.y-a.y,b.x-a.x),head=14;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-head*Math.cos(angle-Math.PI/6),b.y-head*Math.sin(angle-Math.PI/6));ctx.lineTo(b.x-head*Math.cos(angle+Math.PI/6),b.y-head*Math.sin(angle+Math.PI/6));ctx.closePath();ctx.fill()}
  function commitPreview(){actx.drawImage(preview,0,0,innerWidth,innerHeight);pctx.clearRect(0,0,innerWidth,innerHeight)}
  function mosaicAt(p){const size=28,small=5;const sx=Math.max(0,rect.x+p.x-size/2),sy=Math.max(0,rect.y+p.y-size/2);const tmp=document.createElement('canvas');tmp.width=small;tmp.height=small;const t=tmp.getContext('2d');t.drawImage(base,sx*dpr,sy*dpr,size*dpr,size*dpr,0,0,small,small);actx.save();actx.imageSmoothingEnabled=false;actx.drawImage(tmp,0,0,small,small,sx,sy,size,size);actx.restore()}
  drawLayer.addEventListener('pointerdown',ev=>{if(!tool)return;const p=localPoint(ev);if(tool==='text'){const text=prompt('输入文字');if(text){style(actx);actx.font='bold 24px sans-serif';actx.fillText(text,rect.x+p.x,rect.y+p.y)}return}if(tool==='number'){style(actx);actx.beginPath();actx.arc(rect.x+p.x,rect.y+p.y,14,0,Math.PI*2);actx.fill();actx.fillStyle='#fff';actx.font='bold 15px sans-serif';actx.textAlign='center';actx.textBaseline='middle';actx.fillText(String(number++),rect.x+p.x,rect.y+p.y);return}drawing=true;start=p;drawLayer.setPointerCapture(ev.pointerId);if(tool==='pen'||tool==='eraser'||tool==='mosaic')moveDraw(ev)});
  function moveDraw(ev){if(!drawing||!start)return;const p=localPoint(ev),a={x:rect.x+start.x,y:rect.y+start.y},b={x:rect.x+p.x,y:rect.y+p.y};if(tool==='pen'){style(actx);actx.beginPath();actx.moveTo(a.x,a.y);actx.lineTo(b.x,b.y);actx.stroke();start=p}else if(tool==='eraser'){actx.save();actx.globalCompositeOperation='destination-out';actx.lineWidth=24;actx.lineCap='round';actx.beginPath();actx.moveTo(a.x,a.y);actx.lineTo(b.x,b.y);actx.stroke();actx.restore();start=p}else if(tool==='mosaic'){mosaicAt(p);start=p}else{pctx.clearRect(0,0,innerWidth,innerHeight);style(pctx);if(tool==='shape')pctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);else if(tool==='arrow')drawArrow(pctx,a,b)}}
  drawLayer.addEventListener('pointermove',moveDraw);drawLayer.addEventListener('pointerup',()=>{if(!drawing)return;if(tool==='shape'||tool==='arrow')commitPreview();drawing=false;start=null});
  window.__mmsExport=()=>{const scaleX=image.naturalWidth/innerWidth,scaleY=image.naturalHeight/innerHeight;const out=document.createElement('canvas');out.width=Math.max(1,Math.round(rect.w*scaleX));out.height=Math.max(1,Math.round(rect.h*scaleY));const ctx=out.getContext('2d');ctx.drawImage(image,rect.x*scaleX,rect.y*scaleY,rect.w*scaleX,rect.h*scaleY,0,0,out.width,out.height);ctx.drawImage(ann,rect.x*dpr,rect.y*dpr,rect.w*dpr,rect.h*dpr,0,0,out.width,out.height);return{dataUrl:out.toDataURL('image/png'),bounds:{x:Math.round(displayBounds.x+rect.x*displayBounds.width/Math.max(1,innerWidth)),y:Math.round(displayBounds.y+rect.y*displayBounds.height/Math.max(1,innerHeight)),width:Math.round(rect.w*displayBounds.width/Math.max(1,innerWidth)),height:Math.round(rect.h*displayBounds.height/Math.max(1,innerHeight))}}};
  function action(name){clearAutoConfirm();const exported=name==='cancel'?undefined:window.__mmsExport();const message={type:'MMS_CAPTURE_ACTION',token:messageToken,action:name,exported};const target=window.opener&&!window.opener.closed?window.opener:(window.parent!==window?window.parent:null);if(target)target.postMessage(message,'*')}toolbar.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>action(btn.dataset.action)));
  document.addEventListener('pointermove',ev=>{const inside=insideRect(ev.clientX,ev.clientY);if(inside!==pointerInsideSelection){pointerInsideSelection=inside;if(recognizeMode&&autoConfirmArmed)resetAutoConfirm()}else if(inside&&recognizeMode&&autoConfirmArmed&&!selectionDraw)resetAutoConfirm()});
  toolbar.addEventListener('pointermove',resetAutoConfirm);toolbar.addEventListener('pointerdown',resetAutoConfirm);
  document.addEventListener('dblclick',ev=>{if(captureMode==='capture'&&!tool&&insideRect(ev.clientX,ev.clientY)&&!ev.target.closest('.toolbar'))action('copy')});
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape')action('cancel');if(ev.key==='Enter'&&!ev.shiftKey)action('copy')});
  updateRect();setTimeout(placeToolbar,50);
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

/** Windows 使用 PowerShell 和系统绘图 API 静默抓取鼠标所在显示器，并返回真实显示器边界。 */
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
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class MindMapStudioCaptureWindow {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
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
  $screen = [System.Windows.Forms.Screen]::FromPoint($cursor)
  $bounds = $screen.Bounds
  $bitmap = New-Object System.Drawing.Bitmap -ArgumentList $bounds.Width, $bounds.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.Size)
    $bitmap.Save($ImagePath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
  $metadata = @{ x = $bounds.X; y = $bounds.Y; width = $bounds.Width; height = $bounds.Height; scaleFactor = 1 } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText($MetadataPath, $metadata, (New-Object System.Text.UTF8Encoding($false)))
} finally {
  if ($HideForegroundWindow -and $foreground -ne [IntPtr]::Zero) {
    [void][MindMapStudioCaptureWindow]::ShowWindow($foreground, 9)
    Start-Sleep -Milliseconds 80
  }
}
`;
  await runtime.fs.writeFile(scriptPath, script);
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
      return { bytes, display: normalizeBrowserDisplay(metadata) };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`${lastError}；浏览器显示器范围为 ${fallbackDisplay.bounds.width}×${fallbackDisplay.bounds.height}`);
}

/** 使用本机非交互式命令抓取当前显示器，完全绕开 Electron 主进程 BrowserWindow/screen API。 */
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

/** 抓取截图源；优先使用快速渲染器抓屏，失败或不可用时再调用有限时长的本机命令。 */
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
      const hideWithNativeCommand = hideObsidian && !canHideWithWindowHandle;
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

/** 通过渲染器弹窗固定截图，不依赖不可达的 Electron BrowserWindow 主进程 API。 */
function openPinnedCapture(bytes: Uint8Array, bounds: { x: number; y: number; width: number; height: number }): void {
  const width = Math.max(180, Math.min(1200, bounds.width));
  const height = Math.max(120, Math.min(900, bounds.height));
  const pinWindow = window.open("about:blank", `mindmap-studio-pin-${Date.now()}`, [
    "popup=yes",
    "noopener=no",
    "frame=no",
    "resizable=yes",
    "alwaysOnTop=yes",
    "skipTaskbar=yes",
    `left=${bounds.x}`,
    `top=${bounds.y}`,
    `width=${width}`,
    `height=${height}`
  ].join(","));
  if (!pinWindow) throw new Error("当前桌面运行时阻止了固定截图窗口");
  const source = pngBytesToDataUrl(bytes);
  pinWindow.document.open();
  pinWindow.document.write(`<!doctype html><meta charset="utf-8"><title>固定截图</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111}body{-webkit-app-region:drag}img{width:100%;height:100%;object-fit:contain;display:block}.close{position:fixed;right:6px;top:6px;width:28px;height:28px;border:0;border-radius:14px;background:rgba(0,0,0,.72);color:#fff;opacity:0;cursor:pointer;-webkit-app-region:no-drag}body:hover .close{opacity:1}</style><img src="${source}"><button class="close" onclick="window.close()">×</button>`);
  pinWindow.document.close();
  pinWindow.moveTo(bounds.x, bounds.y);
  pinWindow.resizeTo(width, height);
  pinWindow.focus();
}

/** 在真实可达的渲染器窗口中运行截图编辑器并处理复制、下载、固定和取消动作。 */
async function editCapturedDisplay(
  runtime: ElectronCaptureRuntime,
  nodeRuntime: NodeCaptureRuntime,
  captured: { bytes: Uint8Array; display: ElectronDisplay },
  mode: DesktopCaptureMode
): Promise<DesktopCaptureResult> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const imageUrl = URL.createObjectURL(new Blob([copyBytesToArrayBuffer(captured.bytes)], { type: "image/png" }));
  const html = captureEditorHtml(captured.display, mode, imageUrl, token);
  const host = openCaptureEditorHost(html, captured.display);
  host.focus();
  return await new Promise<DesktopCaptureResult>((resolve, reject) => {
    let settled = false;
    let finishing = false;
    let closeWatcher = 0;
    const cleanup = (): void => {
      window.removeEventListener("message", onMessage);
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
        } else if (action === "pin") {
          openPinnedCapture(bytes, message.exported.bounds);
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
      if (message.action === "copy" || message.action === "recognize-copy" || message.action === "download" || message.action === "pin") {
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
