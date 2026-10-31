/**
 * Multi-provider LLM client for CRMP analysis (RCA / Discovery / desk chat).
 * Supported: ChatGPT (OpenAI), DeepSeek, Gemini, Claude (Anthropic).
 * Keys stay server-side only — never expose to the browser.
 */

export type LlmProviderId = "openai" | "deepseek" | "gemini" | "claude";

export type LlmChatResult =
  | { ok: true; content: string; model: string; latency_ms: number; provider: LlmProviderId }
  | { ok: false; error: string; model: string | null; provider: LlmProviderId | null };

export type LlmProviderInfo = {
  id: LlmProviderId;
  label: string;
  configured: boolean;
  default_model: string;
  env_key: string;
};

const PROVIDERS: Record<
  LlmProviderId,
  { label: string; envKey: string; defaultModel: string; baseUrl?: string }
> = {
  openai: {
    label: "ChatGPT (OpenAI)",
    envKey: "OPENAI_API_KEY",
    defaultModel: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
    baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
  },
  deepseek: {
    label: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
    defaultModel: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat",
    baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
  },
  gemini: {
    label: "Gemini",
    envKey: "GEMINI_API_KEY",
    defaultModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
  },
  claude: {
    label: "Claude",
    envKey: "ANTHROPIC_API_KEY",
    defaultModel: process.env.ANTHROPIC_MODEL?.trim() || process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-4-5",
  },
};

function readKey(envKey: string) {
  return process.env[envKey]?.trim() || "";
}

export function listLlmProviders(): LlmProviderInfo[] {
  return (Object.keys(PROVIDERS) as LlmProviderId[]).map((id) => {
    const p = PROVIDERS[id];
    return {
      id,
      label: p.label,
      configured: Boolean(readKey(p.envKey)),
      default_model: p.defaultModel,
      env_key: p.envKey,
    };
  });
}

export function resolveLlmProvider(explicit?: string | null): LlmProviderId | null {
  const raw = (explicit || process.env.CRMP_LLM_PROVIDER || process.env.CRMP_AI_PROVIDER || "")
    .trim()
    .toLowerCase();
  const alias: Record<string, LlmProviderId> = {
    openai: "openai",
    chatgpt: "openai",
    gpt: "openai",
    deepseek: "deepseek",
    gemini: "gemini",
    google: "gemini",
    claude: "claude",
    anthropic: "claude",
  };
  if (raw && alias[raw]) {
    const id = alias[raw];
    if (readKey(PROVIDERS[id].envKey)) return id;
  }
  // Prefer explicitly ordered fallbacks when provider unset.
  const order: LlmProviderId[] = ["openai", "deepseek", "claude", "gemini"];
  for (const id of order) {
    if (readKey(PROVIDERS[id].envKey)) return id;
  }
  return null;
}

export function anyLlmKeyConfigured() {
  return listLlmProviders().some((p) => p.configured);
}

/** @deprecated Prefer anyLlmKeyConfigured — kept for existing call sites. */
export function openaiKeyConfigured() {
  return anyLlmKeyConfigured();
}

export function defaultOpenAiModel() {
  const id = resolveLlmProvider();
  if (!id) return PROVIDERS.openai.defaultModel;
  return PROVIDERS[id].defaultModel;
}

export function llmEnrichmentEnabled() {
  if (!anyLlmKeyConfigured()) return false;
  const flag = (process.env.CRMP_AI_LLM || process.env.CRMP_LLM || "auto").toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  return true;
}

/** Apply ai.llm.provider from SQLite when env has no explicit CRMP_LLM_PROVIDER. */
export function hydrateLlmProviderFromSettings(getSetting: (key: string) => string | null) {
  if (process.env.CRMP_LLM_PROVIDER?.trim() || process.env.CRMP_AI_PROVIDER?.trim()) return;
  const stored = getSetting("ai.llm.provider")?.trim();
  if (stored) setRuntimeLlmProvider(stored);
}

export function getLlmStatus() {
  const provider = resolveLlmProvider();
  return {
    enabled: llmEnrichmentEnabled(),
    provider,
    providers: listLlmProviders(),
    model: provider ? PROVIDERS[provider].defaultModel : null,
  };
}

async function chatOpenAiCompatible(input: {
  provider: LlmProviderId;
  system: string;
  user: string;
  model: string;
  temperature: number;
  max_tokens: number;
  json: boolean;
}): Promise<LlmChatResult> {
  const meta = PROVIDERS[input.provider];
  const key = readKey(meta.envKey);
  if (!key) return { ok: false, error: `${meta.envKey} not configured`, model: null, provider: input.provider };
  const base = (meta.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const started = Date.now();
  try {
    const body: Record<string, unknown> = {
      model: input.model,
      temperature: input.temperature,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      max_tokens: input.max_tokens,
    };
    if (input.json) body.response_format = { type: "json_object" };
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { ok: false, error: `${meta.label} HTTP ${res.status}`, model: input.model, provider: input.provider };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: `${meta.label} response empty`, model: input.model, provider: input.provider };
    return {
      ok: true,
      content,
      model: input.model,
      latency_ms: Date.now() - started,
      provider: input.provider,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : `${meta.label} request failed`,
      model: input.model,
      provider: input.provider,
    };
  }
}

async function chatClaude(input: {
  system: string;
  user: string;
  model: string;
  temperature: number;
  max_tokens: number;
  json: boolean;
}): Promise<LlmChatResult> {
  const key = readKey(PROVIDERS.claude.envKey);
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY not configured", model: null, provider: "claude" };
  const started = Date.now();
  const user = input.json
    ? `${input.user}\n\nReturn ONLY valid JSON (no markdown fences).`
    : input.user;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.max_tokens,
        temperature: input.temperature,
        system: input.system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) return { ok: false, error: `Claude HTTP ${res.status}`, model: input.model, provider: "claude" };
    const data = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
    const content = (data.content || [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!content) return { ok: false, error: "Claude response empty", model: input.model, provider: "claude" };
    return { ok: true, content, model: input.model, latency_ms: Date.now() - started, provider: "claude" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Claude request failed",
      model: input.model,
      provider: "claude",
    };
  }
}

async function chatGemini(input: {
  system: string;
  user: string;
  model: string;
  temperature: number;
  max_tokens: number;
  json: boolean;
}): Promise<LlmChatResult> {
  const key = readKey(PROVIDERS.gemini.envKey);
  if (!key) return { ok: false, error: "GEMINI_API_KEY not configured", model: null, provider: "gemini" };
  const started = Date.now();
  const model = input.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  try {
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: "user", parts: [{ text: input.user }] }],
      generationConfig: {
        temperature: input.temperature,
        maxOutputTokens: input.max_tokens,
        ...(input.json ? { responseMimeType: "application/json" } : {}),
      },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `Gemini HTTP ${res.status}`, model, provider: "gemini" };
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    if (!content.trim()) return { ok: false, error: "Gemini response empty", model, provider: "gemini" };
    return { ok: true, content, model, latency_ms: Date.now() - started, provider: "gemini" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gemini request failed",
      model,
      provider: "gemini",
    };
  }
}

async function chatCompletion(input: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  json?: boolean;
  provider?: string | null;
}): Promise<LlmChatResult> {
  const provider = resolveLlmProvider(input.provider);
  if (!provider) {
    return { ok: false, error: "No LLM API key configured (OPENAI/DEEPSEEK/GEMINI/ANTHROPIC)", model: null, provider: null };
  }
  const meta = PROVIDERS[provider];
  const model = input.model || meta.defaultModel;
  const temperature = input.temperature ?? 0.2;
  const max_tokens = input.max_tokens ?? 1800;
  const json = !!input.json;
  if (provider === "claude") {
    return chatClaude({ system: input.system, user: input.user, model, temperature, max_tokens, json });
  }
  if (provider === "gemini") {
    return chatGemini({ system: input.system, user: input.user, model, temperature, max_tokens, json });
  }
  return chatOpenAiCompatible({
    provider,
    system: input.system,
    user: input.user,
    model,
    temperature,
    max_tokens,
    json,
  });
}

export async function chatCompletionJson(input: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  provider?: string | null;
}): Promise<LlmChatResult> {
  return chatCompletion({ ...input, json: true, temperature: input.temperature ?? 0.2, max_tokens: input.max_tokens ?? 1800 });
}

export async function chatCompletionText(input: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  provider?: string | null;
}): Promise<LlmChatResult> {
  return chatCompletion({ ...input, json: false, temperature: input.temperature ?? 0.3, max_tokens: input.max_tokens ?? 900 });
}

/** Persist operator-selected provider into process env for this runtime (also mirrored to platform_settings by callers). */
export function setRuntimeLlmProvider(provider: string | null) {
  if (!provider) {
    delete process.env.CRMP_LLM_PROVIDER;
    return;
  }
  process.env.CRMP_LLM_PROVIDER = provider;
}
