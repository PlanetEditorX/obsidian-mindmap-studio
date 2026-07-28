/**
 * @file client.ts
 * @description OpenAI Chat Completions 兼容 AI 请求客户端。
 */

import { requestUrl } from "obsidian";
import { normalizeHttpUrl } from "../utils/image-host";
import type { AiProfileConfig } from "./config";
import type { AiMarkdownPayload } from "./markdown";
import {
  buildAiConnectionTestBody,
  buildAiEditCompletionBody,
  buildChatCompletionBody,
  buildImageRecognitionCompletionBody,
  extractAiResponseText,
  parseAiHeaders,
  resolveAiChatCompletionsEndpoint,
  type AiChatCompletionBody
} from "./protocol";

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

/** AI 接口连通性检测结果。 */
export interface AiConnectionTestResult {
  text: string;
  model: string;
}

/** 组装鉴权和用户自定义请求头。 */
const buildRequestHeaders = (profile: AiProfileConfig): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...parseAiHeaders(profile.headers)
  };
  if (profile.apiKey.trim()) headers.Authorization = `Bearer ${profile.apiKey.trim()}`;
  return headers;
};

/** 发送一次 OpenAI Chat Completions 兼容请求并返回解析后的 JSON。 */
const requestChatCompletion = async (
  profile: AiProfileConfig,
  body: AiChatCompletionBody
): Promise<Record<string, unknown>> => {
  const endpoint = normalizeHttpUrl(
    resolveAiChatCompletionsEndpoint(profile.endpoint),
    "AI 接口"
  );
  if (!profile.model.trim()) throw new Error("请先配置模型名称");
  const response = await requestUrl({
    url: endpoint,
    method: "POST",
    headers: buildRequestHeaders(profile),
    contentType: "application/json",
    body: JSON.stringify(body),
    throw: true
  });
  const json = response.json ?? (() => {
    try { return JSON.parse(response.text) as unknown; } catch { return null; }
  })();
  return json && typeof json === "object" ? json as Record<string, unknown> : {};
};

/** 发送 OpenAI Chat Completions 兼容请求。 */
export async function requestAiCompletion(
  profile: AiProfileConfig,
  payload: AiMarkdownPayload,
  question: string
): Promise<AiCompletionResult> {
  if (payload.overLimit) throw new Error("Markdown 超过当前允许上传的大小");
  const json = await requestChatCompletion(profile, buildChatCompletionBody(profile, payload, question));
  const text = extractAiResponseText(json);
  if (!text) throw new Error("AI 接口返回成功，但没有可读取的文本内容");
  const usage = json.usage && typeof json.usage === "object" ? json.usage as Record<string, unknown> : undefined;
  return {
    text,
    model: typeof json.model === "string" ? json.model : profile.model,
    usage: usage ? {
      promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined,
      completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
      totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined
    } : undefined
  };
}


/** 请求 AI 返回可解析的 Markdown 修改提案；不会直接修改导图。 */
export async function requestAiEditProposal(
  profile: AiProfileConfig,
  payload: AiMarkdownPayload,
  instruction: string
): Promise<AiCompletionResult> {
  if (payload.overLimit) throw new Error("Markdown 超过当前允许上传的大小");
  const json = await requestChatCompletion(profile, buildAiEditCompletionBody(profile, payload, instruction));
  const text = extractAiResponseText(json);
  if (!text) throw new Error("AI 接口返回成功，但没有可读取的 Markdown 修改提案");
  const usage = json.usage && typeof json.usage === "object" ? json.usage as Record<string, unknown> : undefined;
  return {
    text,
    model: typeof json.model === "string" ? json.model : profile.model,
    usage: usage ? {
      promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined,
      completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
      totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined
    } : undefined
  };
}


/** 把图片 Blob 转为 Chat Completions 可直接发送的 data URL。 */
export async function imageBlobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("无法读取图片"));
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("无法生成图片 data URL"));
    reader.readAsDataURL(blob);
  });
}

/** 使用支持视觉输入的 OpenAI 兼容模型识别单张图片。 */
export async function requestAiImageRecognition(
  profile: AiProfileConfig,
  image: Blob | string,
  prompt: string
): Promise<AiCompletionResult> {
  let imageUrl: string;
  if (typeof image === "string") imageUrl = normalizeHttpUrl(image, "图片地址");
  else {
    if (!image.size) throw new Error("待识别图片为空");
    if (image.size > 20 * 1024 * 1024) throw new Error("待识别图片超过 20 MB");
    imageUrl = await imageBlobToDataUrl(image);
  }
  let json: Record<string, unknown>;
  try {
    json = await requestChatCompletion(profile, buildImageRecognitionCompletionBody(profile, prompt, imageUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}。请确认“${profile.name}”使用支持图片输入的视觉模型；也可在设置中为 AI 识图单独选择接口。`);
  }
  const text = extractAiResponseText(json);
  if (!text) throw new Error("AI 接口返回成功，但没有可读取的识图文字");
  const usage = json.usage && typeof json.usage === "object" ? json.usage as Record<string, unknown> : undefined;
  return {
    text,
    model: typeof json.model === "string" ? json.model : profile.model,
    usage: usage ? {
      promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined,
      completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
      totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined
    } : undefined
  };
}

/**
 * 使用最小提示词检测接口、鉴权和模型是否可用。
 *
 * 检测请求不会包含当前导图或节点正文。
 */
export async function testAiProfileConnection(profile: AiProfileConfig): Promise<AiConnectionTestResult> {
  const json = await requestChatCompletion(profile, buildAiConnectionTestBody(profile));
  const text = extractAiResponseText(json);
  if (!text) throw new Error("接口返回成功，但没有可读取的检测文本");
  return {
    text,
    model: typeof json.model === "string" ? json.model : profile.model
  };
}
