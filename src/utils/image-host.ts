/**
 * @file image-host.ts
 * @description 图床端点校验、请求头解析、multipart 请求构造和响应 URL 提取工具。
 *
 * 网络发送仍由 Obsidian 的 `requestUrl` 完成；本模块只处理可确定、可测试的数据转换。
 */

/** 常见图床返回图片地址时使用的字段路径。 */
export const DEFAULT_IMAGE_URL_PATHS = ["data.url", "url", "result.url", "result.image", "image.url", "src"] as const;

/** multipart 构造结果。 */
export interface MultipartUploadBody {
  /** 可直接传给请求 API 的二进制请求体。 */
  body: ArrayBuffer;
  /** 包含 boundary 的完整 Content-Type。 */
  contentType: string;
  /** 本次请求使用的 boundary，便于诊断和测试。 */
  boundary: string;
}

/**
 * 校验上传端点是否为 HTTP(S) URL，同时保留用户填写的原始格式。
 *
 * @param value 用户填写的端点。
 * @param label 错误信息中的字段名称。
 * @returns 去除首尾空白后的 URL。
 * @throws 端点为空、格式无效或协议不是 HTTP(S) 时抛出错误。
 */
export function normalizeHttpUrl(value: string, label = "URL"): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label}为空`);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${label}格式无效`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(`${label}仅支持 HTTP 或 HTTPS`);
  return normalized;
}

/**
 * 将设置中的 JSON 请求头解析为扁平字符串对象。
 *
 * @param source JSON 对象文本；空文本表示不添加自定义请求头。
 * @returns 可直接传给请求 API 的请求头。
 * @throws JSON 非对象、字段名非法、字段值为复杂对象或包含换行符时抛出错误。
 */
export function parseUploadHeaders(source: string): Record<string, string> {
  if (!source.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("请求头不是有效的 JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("请求头 JSON 必须是对象");

  const headers: Record<string, string> = {};
  for (const [rawName, rawValue] of Object.entries(parsed as Record<string, unknown>)) {
    const name = rawName.trim();
    if (!name || !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) throw new Error(`请求头名称无效：${rawName}`);
    if (rawValue !== null && typeof rawValue === "object") throw new Error(`请求头 ${name} 的值必须是字符串、数字、布尔值或 null`);
    const value = rawValue === null ? "" : String(rawValue);
    if (/\r|\n/.test(value)) throw new Error(`请求头 ${name} 不能包含换行符`);
    headers[name] = value;
  }
  return headers;
}

/**
 * 创建不可预测且符合 multipart 语法的 boundary。
 *
 * @returns 以插件名称开头的 boundary。
 */
export function createMultipartBoundary(): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replaceAll("-", "")
    : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return `----MindMapStudio${random}`;
}

/**
 * 构造单文件 multipart/form-data 请求体。
 *
 * @param fieldName 服务端接收文件的字段名。
 * @param filename 上传时使用的文件名。
 * @param mime 文件 MIME 类型。
 * @param blob 文件内容。
 * @param boundary 可选固定 boundary；主要用于确定性测试。
 * @returns 请求体、Content-Type 与 boundary。
 */
export async function buildMultipartUploadBody(
  fieldName: string,
  filename: string,
  mime: string,
  blob: Blob,
  boundary = createMultipartBoundary()
): Promise<MultipartUploadBody> {
  const encoder = new TextEncoder();
  const safeBoundary = validateMultipartBoundary(boundary);
  const safeFieldName = sanitizeContentDispositionValue(fieldName || "file", "file");
  const safeFilename = sanitizeContentDispositionValue(filename || "mindmap-image", "mindmap-image");
  const safeMime = /^[\w.+-]+\/[\w.+-]+$/.test(mime) ? mime : "application/octet-stream";
  const head = encoder.encode(`--${safeBoundary}\r\nContent-Disposition: form-data; name="${safeFieldName}"; filename="${safeFilename}"\r\nContent-Type: ${safeMime}\r\n\r\n`);
  const file = new Uint8Array(await blob.arrayBuffer());
  const tail = encoder.encode(`\r\n--${safeBoundary}--\r\n`);
  const combined = new Uint8Array(head.length + file.length + tail.length);
  combined.set(head, 0);
  combined.set(file, head.length);
  combined.set(tail, head.length + file.length);
  return {
    body: combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength) as ArrayBuffer,
    contentType: `multipart/form-data; boundary=${safeBoundary}`,
    boundary: safeBoundary
  };
}

/**
 * 优先使用请求 API 已解析的 JSON，否则尝试解析文本内容。
 *
 * @param json 请求 API 返回的 JSON 值。
 * @param text 原始响应文本。
 * @returns 用于后续 URL 提取的响应载荷。
 */
export function parseUploadResponsePayload(json: unknown, text: string): unknown {
  if (json !== undefined && json !== null) return json;
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * 从图床响应中提取第一个合法的 HTTP(S) 图片地址。
 *
 * @param payload 已解析的 JSON 或原始字符串。
 * @param preferredPaths 用户自定义字段路径，优先级高于内置候选路径。
 * @returns 找到的 URL；不存在时返回 `null`。
 */
export function extractImageUrlFromResponse(payload: unknown, preferredPaths: readonly string[] = []): string | null {
  const paths = Array.from(new Set([...preferredPaths.map((item) => item.trim()).filter(Boolean), ...DEFAULT_IMAGE_URL_PATHS]));
  for (const path of paths) {
    const value = readPath(payload, path);
    if (typeof value === "string" && isHttpUrl(value)) return value.trim();
  }
  if (typeof payload === "string") {
    const match = payload.match(/https?:\/\/[^\s"'<>]+/i);
    if (match?.[0] && isHttpUrl(match[0])) return match[0];
  }
  return null;
}

/**
 * 按点分隔路径读取对象属性。
 *
 * @param value 根对象。
 * @param path 如 `data.items.0.url` 的字段路径。
 * @returns 路径对应的值；路径不存在时返回 `undefined`。
 */
export function readPath(value: unknown, path: string): unknown {
  return path.split(".").filter(Boolean).reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

/**
 * 判断字符串是否为 HTTP(S) URL。
 *
 * @param value 待检查字符串。
 * @returns 是否为合法 HTTP(S) URL。
 */
export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 校验 multipart boundary，避免调用方通过测试注入点写入非法请求头字符。
 *
 * @param boundary 候选 boundary。
 * @returns 通过语法和长度检查的 boundary。
 * @throws boundary 为空、过长或包含非法字符时抛出错误。
 */
function validateMultipartBoundary(boundary: string): string {
  if (!/^[0-9A-Za-z'()+_,.\/\:=?-]{1,70}$/.test(boundary)) throw new Error("multipart boundary 格式无效");
  return boundary;
}

/** 清除 Content-Disposition 参数中的引号、反斜杠和换行，防止请求头注入。 */
function sanitizeContentDispositionValue(value: string, fallback: string): string {
  return value.replace(/["\\\r\n]/g, "").trim() || fallback;
}
