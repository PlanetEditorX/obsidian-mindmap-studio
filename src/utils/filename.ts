/**
 * @file filename.ts
 * @description 跨平台文件名、扩展名、时间戳与图片 MIME 类型工具。
 *
 * 本模块不依赖 Obsidian API，所有函数均为纯函数，便于在 Node.js 中直接测试。
 */

const INVALID_FILENAME_CHARACTERS = /[\u0000-\u001f\\/:*?"<>|#[\]]/g;
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const DEFAULT_MAX_FILENAME_LENGTH = 160;

/**
 * 将任意标题转换为可在常见桌面文件系统中使用的文件名。
 *
 * @param value 原始标题或文件名。
 * @param fallback 清洗后为空时使用的后备名称。
 * @param maxLength 最长字符数；用于避免过长路径导致跨平台写入失败。
 * @returns 不含路径分隔符、控制字符和尾随句点/空格的文件名。
 */
export function sanitizeFilename(value: string, fallback = "思维导图", maxLength = DEFAULT_MAX_FILENAME_LENGTH): string {
  const safeLimit = Math.max(1, Math.floor(maxLength));
  const normalized = value
    .normalize("NFC")
    .replace(INVALID_FILENAME_CHARACTERS, "-")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-. ]+|[-. ]+$/g, "")
    .trim();
  const candidate = (normalized || fallback.trim() || "思维导图").slice(0, safeLimit).replace(/[. ]+$/g, "");
  const safeCandidate = candidate || "思维导图";
  return WINDOWS_RESERVED_NAME.test(safeCandidate) ? `_${safeCandidate}`.slice(0, safeLimit) : safeCandidate;
}

/**
 * 从用户提供的文件名或扩展名中提取安全的小写扩展名。
 *
 * @param value 文件名（如 `photo.PNG`）或扩展名（如 `.PNG`）。
 * @param fallback 未找到合法扩展名时使用的后备值。
 * @returns 仅包含 ASCII 字母和数字的扩展名，不含前导句点。
 */
export function sanitizeFileExtension(value: string, fallback = "png"): string {
  const source = value.trim().split(/[\\/]/).at(-1) ?? "";
  const extension = (source.includes(".") ? source.split(".").at(-1) : source)?.replace(/[^a-z0-9]/gi, "").toLowerCase() ?? "";
  const safeFallback = fallback.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
  return extension.slice(0, 16) || safeFallback.slice(0, 16);
}

/**
 * 生成适合资源文件名的本地时间戳。
 *
 * @param date 要格式化的日期。
 * @returns `YYYYMMDD-HHmmss` 格式的字符串。
 */
export function buildCompactTimestamp(date: Date): string {
  const two = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}${two(date.getMonth() + 1)}${two(date.getDate())}-${two(date.getHours())}${two(date.getMinutes())}${two(date.getSeconds())}`;
}

/**
 * 生成新建导图使用的默认标题。
 *
 * @param prefix 用户配置的标题前缀。
 * @param date 要写入标题的本地日期。
 * @returns `前缀 YYYY-MM-DD HHmm` 格式的标题；空前缀时不保留前导空格。
 */
export function buildDefaultMindMapTitle(prefix: string, date: Date): string {
  const two = (value: number): string => String(value).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}${two(date.getMinutes())}`;
  return `${prefix.trim()} ${stamp}`.trim();
}

/**
 * 根据文件扩展名返回常见图片 MIME 类型。
 *
 * @param filename 文件名或路径。
 * @returns 已知图片类型的 MIME；未知类型返回 `application/octet-stream`。
 */
export function mimeTypeFromFilename(filename: string): string {
  const extension = sanitizeFileExtension(filename, "");
  const mimeTypes: Record<string, string> = {
    avif: "image/avif",
    bmp: "image/bmp",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    svg: "image/svg+xml",
    webp: "image/webp"
  };
  return mimeTypes[extension] ?? "application/octet-stream";
}
/**
 * 从远程图片 URL 提取建议文件名；URL 缺少路径文件名或格式无效时返回后备名称。
 *
 * @param source 远程图片 URL。
 * @param fallback 无法解析文件名时使用的名称。
 * @returns URL 最后一段路径或后备名称。
 */
export function remoteImageSuggestedName(source: string, fallback = "remote-image.png"): string {
  try {
    return new URL(source).pathname.split("/").filter(Boolean).at(-1) || fallback;
  } catch {
    return fallback;
  }
}

