/**
 * @file client.ts
 * @description OpenAI Chat Completions 兼容 AI 请求客户端。
 */

import { requestUrl } from "obsidian";
import { normalizeHttpUrl } from "../utils/image-host";
import type { AiProfileConfig } from "./config";
import type { AiMarkdownPayload } from "./markdown";
import { buildChatCompletionBody, extractAiResponseText, parseAiHeaders } from "./protocol";

/** AI 请求完成后返回给界面的统一结果。 */
export interface AiCompletionResult {
  text: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/** 发送 OpenAI Chat Completions 兼容请求。 */
export async function requestAiCompletion(
  profile: AiProfileConfig,
  payload: AiMarkdownPayload,
  question: string
): Promise<AiCompletionResult> {
  if (payload.overLimit) throw new Error("Markdown 超过当前允许上传的大小");
  const endpoint = normalizeHttpUrl(profile.endpoint, "AI 接口");
  if (!profile.model.trim()) throw new Error("请先配置模型名称");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...parseAiHeaders(profile.headers)
  };
  if (profile.apiKey.trim()) headers.Authorization = `Bearer ${profile.apiKey.trim()}`;
  const response = await requestUrl({
    url: endpoint,
    method: "POST",
    headers,
    contentType: "application/json",
    body: JSON.stringify(buildChatCompletionBody(profile, payload, question)),
    throw: true
  });
  const json = response.json ?? (() => {
    try { return JSON.parse(response.text) as unknown; } catch { return null; }
  })();
  const text = extractAiResponseText(json);
  if (!text) throw new Error("AI 接口返回成功，但没有可读取的文本内容");
  const record = json && typeof json === "object" ? json as Record<string, unknown> : {};
  const usage = record.usage && typeof record.usage === "object" ? record.usage as Record<string, unknown> : undefined;
  return {
    text,
    model: typeof record.model === "string" ? record.model : profile.model,
    usage: usage ? {
      promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined,
      completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
      totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined
    } : undefined
  };
}
