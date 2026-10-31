/**
 * Shared server-side OpenAI chat helper.
 * Never expose the key to the browser. Safe for discovery / RCA / desk chat.
 */

export type OpenAiChatResult =
  | { ok: true; content: string; model: string; latency_ms: number }
  | { ok: false; error: string; model: string | null };

export function openaiKeyConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function defaultOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
}

/** True when operators want LLM enrichment even without an explicit Connect step. */
export function llmEnrichmentEnabled() {
  if (!openaiKeyConfigured()) return false;
  const flag = (process.env.CRMP_AI_LLM || process.env.CRMP_LLM || "auto").toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  return true;
}

export async function chatCompletionJson(input: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<OpenAiChatResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  const model = input.model || defaultOpenAiModel();
  if (!key) {
    return { ok: false, error: "OPENAI_API_KEY not configured", model: null };
  }
  const started = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        max_tokens: input.max_tokens ?? 1800,
      }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `OpenAI HTTP ${res.status}`,
        model,
      };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: "OpenAI response empty", model };
    return { ok: true, content, model, latency_ms: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "OpenAI request failed",
      model,
    };
  }
}

export async function chatCompletionText(input: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<OpenAiChatResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  const model = input.model || defaultOpenAiModel();
  if (!key) {
    return { ok: false, error: "OPENAI_API_KEY not configured", model: null };
  }
  const started = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.3,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        max_tokens: input.max_tokens ?? 900,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `OpenAI HTTP ${res.status}`, model };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: "OpenAI response empty", model };
    return { ok: true, content, model, latency_ms: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "OpenAI request failed",
      model,
    };
  }
}
