/**
 * @file protocol.ts
 * @description OpenAI Chat Completions 兼容协议的纯函数构造与解析。
 */

import type { AiProfileConfig } from "./config";
import { buildAiUserMessage, type AiMarkdownPayload } from "./markdown";

/** OpenAI Chat Completions 兼容请求体的最小结构。 */
export interface AiChatCompletionBody {
  model: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  temperature: number;
  max_tokens: number;
  stream: false;
}

/** 解析自定义请求头，并拒绝嵌套值、非法名称和 CRLF 注入。 */
export function parseAiHeaders(source: string): Record<string, string> {
  const trimmed = source.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("附加请求头必须是 JSON 对象");
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed)) {
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) throw new Error(`请求头名称无效：${name}`);
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      throw new Error(`请求头 ${name} 只能使用字符串、数字或布尔值`);
    }
    const normalized = String(value);
    if (/\r|\n/.test(normalized)) throw new Error(`请求头 ${name} 包含非法换行`);
    headers[name] = normalized;
  }
  return headers;
}

/** 构建 OpenAI Chat Completions 兼容请求体。 */
export function buildChatCompletionBody(
  profile: AiProfileConfig,
  payload: AiMarkdownPayload,
  question: string
): AiChatCompletionBody {
  const messages: AiChatCompletionBody["messages"] = [];
  if (profile.systemPrompt.trim()) messages.push({ role: "system", content: profile.systemPrompt.trim() });
  messages.push({ role: "user", content: buildAiUserMessage(question, payload) });
  return {
    model: profile.model.trim(),
    messages,
    temperature: profile.temperature,
    max_tokens: profile.maxOutputTokens,
    stream: false
  };
}

/** 从 Chat Completions 及常见兼容响应中提取最终文本。 */
export function extractAiResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const value = payload as Record<string, unknown>;
  const choices = value.choices;
  if (Array.isArray(choices)) {
    const first = choices[0] as Record<string, unknown> | undefined;
    const message = first?.message as Record<string, unknown> | undefined;
    if (typeof message?.content === "string") return message.content.trim();
    if (Array.isArray(message?.content)) {
      return message.content.flatMap((part) => {
        if (!part || typeof part !== "object") return [];
        const text = (part as Record<string, unknown>).text;
        return typeof text === "string" ? [text] : [];
      }).join("\n").trim();
    }
    if (typeof first?.text === "string") return first.text.trim();
  }
  if (typeof value.output_text === "string") return value.output_text.trim();
  return "";
}
