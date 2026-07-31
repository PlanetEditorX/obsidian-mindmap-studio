/**
 * @file desktop-capture.ts
 * @description 桌面截图覆盖层、选区标注、固定窗口与系统截图兼容回退。
 */

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
    readImage: () => ElectronNativeImage;
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
  spawn: (
    command: string,
    args: string[],
    options: Record<string, unknown>
  ) => { unref: () => void };
  fs: {
    mkdtemp: (prefix: string) => Promise<string>;
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

/** 返回当前桌面平台对应的截图命令候选，按优先级依次尝试。 */
export function screenshotCommandCandidates(platform: string): Array<{ command: string; args: string[]; detached?: boolean }> {
  if (platform === "darwin") return [{ command: "screencapture", args: ["-i", "-c"] }];
  if (platform === "win32") return [
    { command: "SnippingTool.exe", args: ["/clip"], detached: true },
    { command: "explorer.exe", args: ["ms-screenclip:"], detached: true }
  ];
  return [
    { command: "gnome-screenshot", args: ["-a", "-c"] },
    { command: "spectacle", args: ["-r", "-b", "-n", "--clipboard"] },
    { command: "flameshot", args: ["gui", "--clipboard"] }
  ];
}

/** 将任意 Uint8Array 复制为 Blob 接受的普通 ArrayBuffer，兼容 SharedArrayBuffer 类型声明。 */
export function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

/** 将剪贴板 PNG 二进制转换为稳定摘要，用于检测截图是否产生了新图片。 */
export function pngFingerprint(bytes: Uint8Array): string {
  if (!bytes.length) return "";
  let hash = 2166136261;
  const step = Math.max(1, Math.floor(bytes.length / 4096));
  for (let index = 0; index < bytes.length; index += step) {
    hash ^= bytes[index] ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `${bytes.length}:${(hash >>> 0).toString(16)}`;
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
    const childProcess = requireFunction("node:child_process") as Pick<NodeCaptureRuntime, "execFile" | "spawn">;
    const processModule = requireFunction("node:process") as { platform: string };
    const fs = requireFunction("node:fs/promises") as NodeCaptureRuntime["fs"];
    const os = requireFunction("node:os") as NodeCaptureRuntime["os"];
    const path = requireFunction("node:path") as NodeCaptureRuntime["path"];
    return { platform: processModule.platform, execFile: childProcess.execFile, spawn: childProcess.spawn, fs, os, path };
  } catch {
    return null;
  }
}

/** 等待系统截图工具把一张新图片写入剪贴板。 */
async function waitForClipboardImage(runtime: ElectronCaptureRuntime, previousFingerprint: string, timeoutMs = 120_000): Promise<Uint8Array> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const image = runtime.clipboard.readImage();
    const bytes = image.isEmpty() ? new Uint8Array() : image.toPNG();
    if (bytes.length && pngFingerprint(bytes) !== previousFingerprint) return bytes;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("没有检测到新的截图；可能已取消截图操作");
}

/** 使用 execFile 执行一个截图候选命令。 */
function executeCaptureCommand(runtime: NodeCaptureRuntime, command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    runtime.execFile(command, args, { windowsHide: true, timeout: 120_000 }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/** 执行系统截图命令；交互式命令失败时继续尝试下一个候选。 */
async function runScreenshotCommand(
  runtime: NodeCaptureRuntime,
  candidates: Array<{ command: string; args: string[]; detached?: boolean }>
): Promise<void> {
  let lastError = "未找到可用截图工具";
  for (const candidate of candidates) {
    try {
      if (candidate.detached) {
        const child = runtime.spawn(candidate.command, candidate.args, { detached: true, stdio: "ignore", windowsHide: true });
        child.unref();
      } else {
        await executeCaptureCommand(runtime, candidate.command, candidate.args);
      }
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`无法启动系统截图工具：${lastError}`);
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

/** 生成截图覆盖层页面；页面只加载本地截图文件，不访问网络。 */
function captureEditorHtml(display: ElectronDisplay): string {
  const bounds = JSON.stringify(display.bounds);
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'self' file: data:; img-src 'self' file: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
<title>MindMap Studio 截图</title><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;user-select:none}
#base,#annotations,#preview{position:fixed;inset:0;width:100%;height:100%}#base{z-index:0}#annotations{z-index:1;pointer-events:none}#preview{z-index:2;pointer-events:none}
.shade{position:fixed;background:rgba(0,0,0,.52);z-index:3;pointer-events:none}.selection{position:fixed;border:2px solid #50a7ff;box-shadow:0 0 0 1px rgba(255,255,255,.65) inset;z-index:4;pointer-events:none}
.drag-strip{position:absolute;left:0;right:0;top:-2px;height:12px;cursor:move;pointer-events:auto}.metrics{position:absolute;left:-2px;bottom:100%;margin-bottom:8px;background:rgba(15,23,42,.92);color:#fff;border:1px solid rgba(255,255,255,.22);border-radius:6px;padding:5px 8px;font-size:12px;white-space:nowrap;pointer-events:auto;cursor:move}
.handle{position:absolute;width:12px;height:12px;background:#fff;border:2px solid #3798f2;border-radius:3px;pointer-events:auto}.nw{left:-7px;top:-7px;cursor:nwse-resize}.n{left:50%;top:-7px;transform:translateX(-50%);cursor:ns-resize}.ne{right:-7px;top:-7px;cursor:nesw-resize}.e{right:-7px;top:50%;transform:translateY(-50%);cursor:ew-resize}.se{right:-7px;bottom:-7px;cursor:nwse-resize}.s{left:50%;bottom:-7px;transform:translateX(-50%);cursor:ns-resize}.sw{left:-7px;bottom:-7px;cursor:nesw-resize}.w{left:-7px;top:50%;transform:translateY(-50%);cursor:ew-resize}
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
<div id="tip">拖动蓝色边框调整截图范围；Esc 取消，Enter 复制</div>
<script>
(() => {
  const displayBounds=${bounds}; const base=document.getElementById('base'); const ann=document.getElementById('annotations'); const preview=document.getElementById('preview');
  const bctx=base.getContext('2d'); const actx=ann.getContext('2d'); const pctx=preview.getContext('2d'); const selection=document.getElementById('selection'); const metrics=document.getElementById('metrics'); const toolbar=document.getElementById('toolbar'); const drawLayer=document.getElementById('drawLayer');
  const shades=['shadeTop','shadeLeft','shadeRight','shadeBottom'].map(id=>document.getElementById(id)); const dpr=Math.max(1,window.devicePixelRatio||1); let tool=''; let drawing=false; let start=null; let number=1; let drag=null;
  let rect={x:Math.round(innerWidth*.18),y:Math.round(innerHeight*.16),w:Math.round(innerWidth*.64),h:Math.round(innerHeight*.62)}; const minSize=36;
  const image=new Image(); image.src='screen.png';
  function resizeCanvases(){for(const c of [base,ann,preview]){c.width=Math.round(innerWidth*dpr);c.height=Math.round(innerHeight*dpr);c.style.width=innerWidth+'px';c.style.height=innerHeight+'px'}; for(const c of [bctx,actx,pctx])c.setTransform(dpr,0,0,dpr,0,0); drawBase(); updateRect()}
  function drawBase(){if(!image.complete)return;bctx.clearRect(0,0,innerWidth,innerHeight);bctx.drawImage(image,0,0,innerWidth,innerHeight)}
  image.onload=()=>resizeCanvases(); window.addEventListener('resize',resizeCanvases);
  function clamp(){rect.w=Math.max(minSize,Math.min(innerWidth,rect.w));rect.h=Math.max(minSize,Math.min(innerHeight,rect.h));rect.x=Math.max(0,Math.min(innerWidth-rect.w,rect.x));rect.y=Math.max(0,Math.min(innerHeight-rect.h,rect.y))}
  function updateRect(){clamp();selection.style.left=rect.x+'px';selection.style.top=rect.y+'px';selection.style.width=rect.w+'px';selection.style.height=rect.h+'px';drawLayer.style.left=rect.x+'px';drawLayer.style.top=rect.y+'px';drawLayer.style.width=rect.w+'px';drawLayer.style.height=rect.h+'px';
    shades[0].style.cssText='left:0;top:0;width:100%;height:'+rect.y+'px';shades[1].style.cssText='left:0;top:'+rect.y+'px;width:'+rect.x+'px;height:'+rect.h+'px';shades[2].style.cssText='left:'+(rect.x+rect.w)+'px;top:'+rect.y+'px;width:'+(innerWidth-rect.x-rect.w)+'px;height:'+rect.h+'px';shades[3].style.cssText='left:0;top:'+(rect.y+rect.h)+'px;width:100%;height:'+(innerHeight-rect.y-rect.h)+'px';
    metrics.textContent='X '+Math.round(displayBounds.x+rect.x)+'  Y '+Math.round(displayBounds.y+rect.y)+'  '+Math.round(rect.w)+' × '+Math.round(rect.h); placeToolbar()}
  function placeToolbar(){const tw=toolbar.offsetWidth||820,th=toolbar.offsetHeight||48;let left=Math.max(8,Math.min(innerWidth-tw-8,rect.x+rect.w/2-tw/2));let top=rect.y+rect.h+10;if(top+th>innerHeight-8)top=Math.max(8,rect.y-th-10);toolbar.style.left=left+'px';toolbar.style.top=top+'px'}
  function point(ev){return{x:ev.clientX,y:ev.clientY}}
  function localPoint(ev){return{x:ev.clientX-rect.x,y:ev.clientY-rect.y}}
  function beginResize(ev,handle){ev.preventDefault();ev.stopPropagation();drag={kind:handle,start:point(ev),rect:{...rect}};window.addEventListener('pointermove',moveResize);window.addEventListener('pointerup',endResize,{once:true})}
  function moveResize(ev){if(!drag)return;const dx=ev.clientX-drag.start.x,dy=ev.clientY-drag.start.y,r=drag.rect;let x=r.x,y=r.y,w=r.w,h=r.h;if(drag.kind==='move'){x=r.x+dx;y=r.y+dy}else{if(drag.kind.includes('e'))w=r.w+dx;if(drag.kind.includes('s'))h=r.h+dy;if(drag.kind.includes('w')){x=r.x+dx;w=r.w-dx}if(drag.kind.includes('n')){y=r.y+dy;h=r.h-dy}if(w<minSize){if(drag.kind.includes('w'))x-=minSize-w;w=minSize}if(h<minSize){if(drag.kind.includes('n'))y-=minSize-h;h=minSize}}rect={x,y,w,h};updateRect()}
  function endResize(){drag=null;window.removeEventListener('pointermove',moveResize)}
  selection.querySelectorAll('[data-handle]').forEach(el=>el.addEventListener('pointerdown',ev=>beginResize(ev,el.dataset.handle)));selection.querySelectorAll('[data-drag]').forEach(el=>el.addEventListener('pointerdown',ev=>beginResize(ev,'move')));
  function setTool(next){tool=tool===next?'':next;toolbar.querySelectorAll('[data-tool]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tool===tool));drawLayer.style.pointerEvents=tool?'auto':'none'}
  toolbar.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>setTool(btn.dataset.tool)));
  function style(ctx){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#ff3b30';ctx.fillStyle='#ff3b30';ctx.lineWidth=3}
  function drawArrow(ctx,a,b){style(ctx);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();const angle=Math.atan2(b.y-a.y,b.x-a.x),head=14;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-head*Math.cos(angle-Math.PI/6),b.y-head*Math.sin(angle-Math.PI/6));ctx.lineTo(b.x-head*Math.cos(angle+Math.PI/6),b.y-head*Math.sin(angle+Math.PI/6));ctx.closePath();ctx.fill()}
  function commitPreview(){actx.drawImage(preview,0,0,innerWidth,innerHeight);pctx.clearRect(0,0,innerWidth,innerHeight)}
  function mosaicAt(p){const size=28,small=5;const sx=Math.max(0,rect.x+p.x-size/2),sy=Math.max(0,rect.y+p.y-size/2);const tmp=document.createElement('canvas');tmp.width=small;tmp.height=small;const t=tmp.getContext('2d');t.drawImage(base,sx*dpr,sy*dpr,size*dpr,size*dpr,0,0,small,small);actx.save();actx.imageSmoothingEnabled=false;actx.drawImage(tmp,0,0,small,small,sx,sy,size,size);actx.restore()}
  drawLayer.addEventListener('pointerdown',ev=>{if(!tool)return;const p=localPoint(ev);if(tool==='text'){const text=prompt('输入文字');if(text){style(actx);actx.font='bold 24px sans-serif';actx.fillText(text,rect.x+p.x,rect.y+p.y)}return}if(tool==='number'){style(actx);actx.beginPath();actx.arc(rect.x+p.x,rect.y+p.y,14,0,Math.PI*2);actx.fill();actx.fillStyle='#fff';actx.font='bold 15px sans-serif';actx.textAlign='center';actx.textBaseline='middle';actx.fillText(String(number++),rect.x+p.x,rect.y+p.y);return}drawing=true;start=p;drawLayer.setPointerCapture(ev.pointerId);if(tool==='pen'||tool==='eraser'||tool==='mosaic')moveDraw(ev)});
  function moveDraw(ev){if(!drawing||!start)return;const p=localPoint(ev),a={x:rect.x+start.x,y:rect.y+start.y},b={x:rect.x+p.x,y:rect.y+p.y};if(tool==='pen'){style(actx);actx.beginPath();actx.moveTo(a.x,a.y);actx.lineTo(b.x,b.y);actx.stroke();start=p}else if(tool==='eraser'){actx.save();actx.globalCompositeOperation='destination-out';actx.lineWidth=24;actx.lineCap='round';actx.beginPath();actx.moveTo(a.x,a.y);actx.lineTo(b.x,b.y);actx.stroke();actx.restore();start=p}else if(tool==='mosaic'){mosaicAt(p);start=p}else{pctx.clearRect(0,0,innerWidth,innerHeight);style(pctx);if(tool==='shape')pctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);else if(tool==='arrow')drawArrow(pctx,a,b)}}
  drawLayer.addEventListener('pointermove',moveDraw);drawLayer.addEventListener('pointerup',()=>{if(!drawing)return;if(tool==='shape'||tool==='arrow')commitPreview();drawing=false;start=null});
  window.__mmsExport=()=>{const scaleX=image.naturalWidth/innerWidth,scaleY=image.naturalHeight/innerHeight;const out=document.createElement('canvas');out.width=Math.max(1,Math.round(rect.w*scaleX));out.height=Math.max(1,Math.round(rect.h*scaleY));const ctx=out.getContext('2d');ctx.drawImage(image,rect.x*scaleX,rect.y*scaleY,rect.w*scaleX,rect.h*scaleY,0,0,out.width,out.height);ctx.drawImage(ann,rect.x*dpr,rect.y*dpr,rect.w*dpr,rect.h*dpr,0,0,out.width,out.height);return{dataUrl:out.toDataURL('image/png'),bounds:{x:Math.round(displayBounds.x+rect.x),y:Math.round(displayBounds.y+rect.y),width:Math.round(rect.w),height:Math.round(rect.h)}}};
  function action(name){console.log('MMS_CAPTURE_ACTION:'+name)}toolbar.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>action(btn.dataset.action)));document.addEventListener('keydown',ev=>{if(ev.key==='Escape')action('cancel');if(ev.key==='Enter'&&!ev.shiftKey)action('copy')});
  updateRect();setTimeout(placeToolbar,50);
})();
</script></body></html>`;
}

/** 将裁剪结果写入系统剪贴板。 */
function writePngToClipboard(runtime: ElectronCaptureRuntime, bytes: Uint8Array): void {
  const image = runtime.nativeImage?.createFromBuffer(bytes);
  if (image && !image.isEmpty()) runtime.clipboard.writeImage?.(image);
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

/** 打开始终置顶的无边框截图窗口。 */
async function openPinnedCapture(
  runtime: ElectronCaptureRuntime,
  nodeRuntime: NodeCaptureRuntime,
  bytes: Uint8Array,
  bounds: { x: number; y: number; width: number; height: number }
): Promise<void> {
  const BrowserWindow = runtime.remote?.BrowserWindow ?? runtime.BrowserWindow;
  if (!BrowserWindow) throw new Error("当前 Obsidian 桌面运行时不支持固定截图窗口");
  const directory = await nodeRuntime.fs.mkdtemp(nodeRuntime.path.join(nodeRuntime.os.tmpdir(), "mms-pin-"));
  const imagePath = nodeRuntime.path.join(directory, "pin.png");
  const htmlPath = nodeRuntime.path.join(directory, "pin.html");
  const width = Math.max(180, Math.min(1200, bounds.width));
  const height = Math.max(120, Math.min(900, bounds.height));
  await nodeRuntime.fs.writeFile(imagePath, bytes);
  await nodeRuntime.fs.writeFile(htmlPath, `<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111}body{-webkit-app-region:drag}img{width:100%;height:100%;object-fit:contain;display:block}.close{position:fixed;right:6px;top:6px;width:26px;height:26px;border:0;border-radius:13px;background:rgba(0,0,0,.65);color:#fff;opacity:0;cursor:pointer;-webkit-app-region:no-drag}body:hover .close{opacity:1}</style><img src="pin.png"><button class="close" onclick="window.close()">×</button>`);
  const pinWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width,
    height,
    show: false,
    frame: false,
    transparent: false,
    resizable: true,
    movable: true,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: "#111111",
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  pinWindow.once("closed", () => { void nodeRuntime.fs.rm(directory, { recursive: true, force: true }); });
  await pinWindow.loadFile(htmlPath);
  pinWindow.show();
  pinWindow.focus();
}

/** 使用 Electron 屏幕源打开 PixPin 风格截图覆盖层。 */
async function captureWithEditor(
  runtime: ElectronCaptureRuntime,
  nodeRuntime: NodeCaptureRuntime,
  hideObsidian: boolean
): Promise<DesktopCaptureResult | null> {
  const BrowserWindow = runtime.remote?.BrowserWindow ?? runtime.BrowserWindow;
  const screen = runtime.remote?.screen ?? runtime.screen;
  if (!BrowserWindow || !screen || !runtime.desktopCapturer) return null;
  const windowHandle = getCurrentObsidianWindow(runtime);
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const scaleFactor = Math.max(1, display.scaleFactor ?? 1);
  try {
    if (hideObsidian && windowHandle && !windowHandle.isDestroyed()) {
      windowHandle.minimize();
      await waitForWindowMinimized(windowHandle);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    const sources = await runtime.desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: Math.max(1, Math.round(display.bounds.width * scaleFactor)),
        height: Math.max(1, Math.round(display.bounds.height * scaleFactor))
      },
      fetchWindowIcons: false
    });
    const source = sources.find((item) => String(item.display_id ?? "") === String(display.id)) ?? sources[0];
    const screenshotBytes = source?.thumbnail.toPNG() ?? new Uint8Array();
    if (!screenshotBytes.length) return null;
    const directory = await nodeRuntime.fs.mkdtemp(nodeRuntime.path.join(nodeRuntime.os.tmpdir(), "mms-capture-"));
    const imagePath = nodeRuntime.path.join(directory, "screen.png");
    const htmlPath = nodeRuntime.path.join(directory, "capture.html");
    await nodeRuntime.fs.writeFile(imagePath, screenshotBytes);
    await nodeRuntime.fs.writeFile(htmlPath, captureEditorHtml(display));
    const captureWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      show: false,
      frame: false,
      transparent: false,
      resizable: false,
      movable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      backgroundColor: "#111111",
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
    });
    return await new Promise<DesktopCaptureResult>((resolve, reject) => {
      let settled = false;
      let finishing = false;
      const finish = async (action: DesktopCaptureAction): Promise<void> => {
        if (settled || finishing) return;
        finishing = true;
        try {
          const exported = await captureWindow.webContents.executeJavaScript<{ dataUrl: string; bounds: { x: number; y: number; width: number; height: number } }>("window.__mmsExport()" );
          const bytes = pngDataUrlToBytes(exported.dataUrl);
          if (action === "download") {
            const saved = await saveCaptureDownload(runtime, nodeRuntime, bytes);
            if (!saved) {
              finishing = false;
              return;
            }
          } else if (action === "pin") {
            await openPinnedCapture(runtime, nodeRuntime, bytes, exported.bounds);
          } else if (action === "copy" || action === "recognize-copy") {
            writePngToClipboard(runtime, bytes);
          }
          settled = true;
          if (!captureWindow.isDestroyed()) captureWindow.close();
          resolve({
            blob: new Blob([copyBytesToArrayBuffer(bytes)], { type: "image/png" }),
            suggestedName: "mindmap-screenshot.png",
            action
          });
        } catch (error) {
          settled = true;
          if (!captureWindow.isDestroyed()) captureWindow.destroy();
          reject(error);
        }
      };
      captureWindow.webContents.on("console-message", (_event, _level, message) => {
        if (!message.startsWith("MMS_CAPTURE_ACTION:")) return;
        const action = message.slice("MMS_CAPTURE_ACTION:".length);
        if (action === "cancel") {
          settled = true;
          if (!captureWindow.isDestroyed()) captureWindow.close();
          reject(new Error("取消截图操作"));
          return;
        }
        if (action === "copy" || action === "recognize-copy" || action === "download" || action === "pin") {
          void finish(action);
        }
      });
      captureWindow.once("closed", () => {
        void nodeRuntime.fs.rm(directory, { recursive: true, force: true });
        if (!settled) reject(new Error("取消截图操作"));
      });
      void captureWindow.loadFile(htmlPath).then(() => {
        captureWindow.show();
        captureWindow.focus();
      }).catch((error) => {
        settled = true;
        if (!captureWindow.isDestroyed()) captureWindow.destroy();
        reject(error);
      });
    });
  } finally {
    if (hideObsidian && windowHandle && !windowHandle.isDestroyed()) {
      windowHandle.restore();
      windowHandle.show();
      windowHandle.focus();
    }
  }
}

/** 使用系统区域截图作为高级覆盖层不可用时的兼容回退。 */
async function captureWithSystemTool(runtime: ElectronCaptureRuntime, nodeRuntime: NodeCaptureRuntime, hideObsidian: boolean): Promise<DesktopCaptureResult> {
  const beforeImage = runtime.clipboard.readImage();
  const beforeBytes = beforeImage.isEmpty() ? new Uint8Array() : beforeImage.toPNG();
  const beforeFingerprint = pngFingerprint(beforeBytes);
  const windowHandle = getCurrentObsidianWindow(runtime);
  try {
    if (hideObsidian && windowHandle && !windowHandle.isDestroyed()) {
      windowHandle.minimize();
      await waitForWindowMinimized(windowHandle);
    }
    await new Promise((resolve) => setTimeout(resolve, hideObsidian ? 350 : 50));
    await runScreenshotCommand(nodeRuntime, screenshotCommandCandidates(nodeRuntime.platform));
    const bytes = await waitForClipboardImage(runtime, beforeFingerprint);
    return {
      blob: new Blob([copyBytesToArrayBuffer(bytes)], { type: "image/png" }),
      suggestedName: "mindmap-screenshot.png",
      action: "copy"
    };
  } finally {
    if (hideObsidian && windowHandle && !windowHandle.isDestroyed()) {
      windowHandle.restore();
      windowHandle.show();
      windowHandle.focus();
    }
  }
}

/** 启动可调整、可标注的桌面截图覆盖层；不支持时回退到系统区域截图。 */
export async function captureDesktopScreenshot(hideObsidian: boolean): Promise<DesktopCaptureResult> {
  const electronRuntime = getElectronRuntime();
  const nodeRuntime = getNodeCaptureRuntime();
  if (!electronRuntime || !nodeRuntime) throw new Error("截图仅支持 Obsidian 桌面端");
  const edited = await captureWithEditor(electronRuntime, nodeRuntime, hideObsidian);
  return edited ?? captureWithSystemTool(electronRuntime, nodeRuntime, hideObsidian);
}
