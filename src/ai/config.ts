/**
 * @file config.ts
 * @description AI 接口配置模型、预设和持久化数据规范化。
 */

/** 可选择的 AI 接口预设类别。 */
export type AiProviderKind = "openai" | "deepseek" | "siliconflow" | "freellmapi" | "custom";

/** 单个可持久化 AI 接口配置。 */
export interface AiProfileConfig {
  id: string;
  name: string;
  provider: AiProviderKind;
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  headers: string;
}

/** 用于快速填充服务地址、模型和系统提示词的内置预设。 */
export interface AiProfilePreset {
  provider: AiProviderKind;
  name: string;
  endpoint: string;
  model: string;
  systemPrompt: string;
}

export const AI_PROFILE_PRESETS: Record<AiProviderKind, AiProfilePreset> = {
  openai: {
    provider: "openai",
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4.1-mini",
    systemPrompt: "你是一个严谨的知识整理助手。请仅基于用户提供的思维导图 Markdown 回答，并明确区分原文信息与推断。"
  },
  deepseek: {
    provider: "deepseek",
    name: "DeepSeek",
    endpoint: "https://api.deepseek.com/chat/completions",
    model: "deepseek-v4-flash",
    systemPrompt: "你是一个严谨的知识整理助手。请仅基于用户提供的思维导图 Markdown 回答，并明确区分原文信息与推断。"
  },
  siliconflow: {
    provider: "siliconflow",
    name: "硅基流动",
    endpoint: "https://api.siliconflow.cn/v1",
    model: "deepseek-ai/DeepSeek-V4-Flash",
    systemPrompt: "你是一个严谨的知识整理助手。请仅基于用户提供的思维导图 Markdown 回答，并明确区分原文信息与推断。"
  },
  freellmapi: {
    provider: "freellmapi",
    name: "FreeLLMAPI",
    endpoint: "",
    model: "auto",
    systemPrompt: "你是一个严谨的知识整理助手。请仅基于用户提供的思维导图 Markdown 回答，并明确区分原文信息与推断。"
  },
  custom: {
    provider: "custom",
    name: "自定义接口",
    endpoint: "",
    model: "",
    systemPrompt: "你是一个严谨的知识整理助手。请仅基于用户提供的思维导图 Markdown 回答，并明确区分原文信息与推断。"
  }
};

/** 各预设接口在设置页提供的模型建议；文本框仍允许输入其他兼容模型。 */
export const AI_PROVIDER_MODEL_PRESETS: Record<AiProviderKind, readonly string[]> = {
  openai: ["gpt-4.1-mini"],
  deepseek: ["deepseek-v4-flash"],
  siliconflow: [
    "deepseek-ai/DeepSeek-V4-Flash",
    "deepseek-ai/DeepSeek-V4-Pro",
    "zai-org/GLM-5.2"
  ],
  freellmapi: ["auto"],
  custom: []
};

export const DEFAULT_AI_PROFILES: AiProfileConfig[] = [
  {
    id: "ai_openai",
    ...AI_PROFILE_PRESETS.openai,
    enabled: false,
    apiKey: "",
    temperature: 0.2,
    maxOutputTokens: 2048,
    headers: ""
  },
  {
    id: "ai_deepseek",
    ...AI_PROFILE_PRESETS.deepseek,
    enabled: false,
    apiKey: "",
    temperature: 0.2,
    maxOutputTokens: 2048,
    headers: ""
  },
  {
    id: "ai_siliconflow",
    ...AI_PROFILE_PRESETS.siliconflow,
    enabled: false,
    apiKey: "",
    temperature: 0.2,
    maxOutputTokens: 2048,
    headers: ""
  },
  {
    id: "ai_freellmapi",
    ...AI_PROFILE_PRESETS.freellmapi,
    enabled: false,
    apiKey: "",
    temperature: 0.2,
    maxOutputTokens: 2048,
    headers: ""
  }
];

const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
};

const providerOf = (value: unknown): AiProviderKind => {
  if (value === "openai" || value === "deepseek" || value === "siliconflow" || value === "freellmapi") return value;
  return "custom";
};

/** 创建一个可编辑的 AI 接口配置。 */
export function createAiProfileConfig(provider: AiProviderKind, index = 1): AiProfileConfig {
  const preset = AI_PROFILE_PRESETS[provider];
  return {
    id: `ai_${provider}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: provider === "custom" ? `自定义接口 ${index}` : preset.name,
    provider,
    enabled: true,
    endpoint: preset.endpoint,
    apiKey: "",
    model: preset.model,
    systemPrompt: preset.systemPrompt,
    temperature: 0.2,
    maxOutputTokens: 2048,
    headers: ""
  };
}

/** 规范化持久化的 AI 配置，防止异常值进入请求层。 */
export function normalizeAiProfileConfig(value: unknown, index = 1): AiProfileConfig | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<AiProfileConfig>;
  const provider = providerOf(input.provider);
  const preset = AI_PROFILE_PRESETS[provider];
  const id = typeof input.id === "string" && input.id.trim() ? input.id.trim().slice(0, 120) : `ai_${provider}_${index}`;
  return {
    id,
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 120) : preset.name,
    provider,
    enabled: input.enabled === true,
    endpoint: typeof input.endpoint === "string" ? input.endpoint.trim().slice(0, 2000) : preset.endpoint,
    apiKey: typeof input.apiKey === "string" ? input.apiKey.trim().slice(0, 8000) : "",
    model: typeof input.model === "string" ? input.model.trim().slice(0, 240) : preset.model,
    systemPrompt: typeof input.systemPrompt === "string" ? input.systemPrompt.slice(0, 16000) : preset.systemPrompt,
    temperature: clamp(input.temperature, 0, 2, 0.2),
    maxOutputTokens: Math.round(clamp(input.maxOutputTokens, 64, 65536, 2048)),
    headers: typeof input.headers === "string" ? input.headers.slice(0, 16000) : ""
  };
}

/** 返回当前可用于请求的配置。 */
export function enabledAiProfiles(profiles: AiProfileConfig[]): AiProfileConfig[] {
  return profiles.filter((profile) => profile.enabled && profile.endpoint.trim() && profile.model.trim());
}
