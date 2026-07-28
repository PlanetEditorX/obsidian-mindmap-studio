/**
 * @file local-ocr.ts
 * @description 桌面端本地 Tesseract OCR 命令调用和安全参数解析。
 */

import { normalizeRecognizedText } from "./recognition";

/** 本地 OCR 命令配置。 */
export interface LocalOcrOptions {
  executable: string;
  language: string;
  extraArgs: string;
  timeoutMs?: number;
}

/** 桌面端本地 OCR 所需的最小 Node.js 运行时接口。 */
interface LocalOcrRuntime {
  execFile: (
    command: string,
    args: string[],
    options: Record<string, unknown>,
    callback: (error: Error | null, stdout: string, stderr: string) => void
  ) => void;
  mkdtemp: (prefix: string) => Promise<string>;
  rm: (path: string, options: { recursive: boolean; force: boolean }) => Promise<void>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  tmpdir: () => string;
  joinPath: (...parts: string[]) => string;
}

/** 从 Obsidian 桌面端按需获取 Node.js API，避免移动端加载插件时静态引用 Node 模块。 */
function getLocalOcrRuntime(): LocalOcrRuntime | null {
  const requireFunction = (globalThis as unknown as { require?: (id: string) => unknown }).require
    ?? (typeof window !== "undefined" ? (window as unknown as { require?: (id: string) => unknown }).require : undefined);
  if (!requireFunction) return null;
  try {
    const childProcess = requireFunction("node:child_process") as { execFile: LocalOcrRuntime["execFile"] };
    const fileSystem = requireFunction("node:fs/promises") as Pick<LocalOcrRuntime, "mkdtemp" | "rm" | "writeFile">;
    const os = requireFunction("node:os") as { tmpdir: LocalOcrRuntime["tmpdir"] };
    const path = requireFunction("node:path") as { join: LocalOcrRuntime["joinPath"] };
    return {
      execFile: childProcess.execFile,
      mkdtemp: fileSystem.mkdtemp,
      rm: fileSystem.rm,
      writeFile: fileSystem.writeFile,
      tmpdir: os.tmpdir,
      joinPath: path.join
    };
  } catch {
    return null;
  }
}

/** 把用户填写的附加命令参数解析为 execFile 参数数组，不经过 shell。 */
export function parseCommandArguments(source: string): string[] {
  const args: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escaping = false;
  for (const character of source.trim()) {
    if (escaping) {
      current += character;
      escaping = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaping = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      else current += character;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (/\s/.test(character)) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }
    current += character;
  }
  if (escaping) current += "\\";
  if (quote) throw new Error("本地 OCR 附加参数包含未闭合引号");
  if (current) args.push(current);
  return args;
}

/** 使用 execFile 执行 Tesseract，参数不经过 shell。 */
function executeTesseract(
  runtime: LocalOcrRuntime,
  executable: string,
  args: string[],
  timeoutMs: number
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    runtime.execFile(executable, args, {
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true
    }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
}

/** 使用本机 Tesseract 可执行文件识别图片，不上传任何图片数据。 */
export async function recognizeImageWithLocalOcr(blob: Blob, options: LocalOcrOptions): Promise<string> {
  const runtime = getLocalOcrRuntime();
  if (!runtime) throw new Error("本地 OCR 仅支持 Obsidian 桌面端");
  const executable = options.executable.trim() || "tesseract";
  const language = options.language.trim() || "chi_sim+eng";
  const directory = await runtime.mkdtemp(runtime.joinPath(runtime.tmpdir(), "mindmap-studio-ocr-"));
  const inputPath = runtime.joinPath(directory, "input.png");
  try {
    await runtime.writeFile(inputPath, new Uint8Array(await blob.arrayBuffer()));
    const args = [inputPath, "stdout", "-l", language, ...parseCommandArguments(options.extraArgs)];
    const { stdout, stderr } = await executeTesseract(
      runtime,
      executable,
      args,
      Math.max(5_000, Math.min(300_000, options.timeoutMs ?? 120_000))
    );
    const text = normalizeRecognizedText(stdout);
    if (!text) throw new Error(stderr.trim() || "本地 OCR 没有识别到文字");
    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`本地 OCR 执行失败：${message}`);
  } finally {
    await runtime.rm(directory, { recursive: true, force: true });
  }
}
