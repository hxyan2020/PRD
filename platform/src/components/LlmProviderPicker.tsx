"use client";

import { useState } from "react";
import { EnZh } from "@/components/EnZh";

export type LlmProviderOption = {
  id: string;
  label: string;
  configured: boolean;
  default_model?: string;
  env_key?: string;
};

/**
 * Shared ChatGPT / DeepSeek / Gemini / Claude selector for desk analysis surfaces.
 */
export function LlmProviderPicker({
  providers,
  value,
  disabled,
  onChanged,
  testId = "llm-provider-picker",
}: {
  providers: LlmProviderOption[];
  value?: string | null;
  disabled?: boolean;
  onChanged?: (provider: string, meta: { model?: string | null; enabled?: boolean }) => void;
  testId?: string;
}) {
  const options =
    providers.length > 0
      ? providers
      : [
          { id: "openai", label: "ChatGPT (OpenAI)", configured: false },
          { id: "deepseek", label: "DeepSeek", configured: false },
          { id: "gemini", label: "Gemini", configured: false },
          { id: "claude", label: "Claude", configured: false },
        ];
  const initial =
    value || options.find((p) => p.configured)?.id || options[0]?.id || "openai";
  const [selected, setSelected] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply(next: string) {
    setSelected(next);
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_llm_provider", provider: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set LLM provider");
      onChanged?.(data.llm_provider || next, {
        model: data.llm_model ?? null,
        enabled: data.llm_enabled,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
      <label className="text-xs text-[var(--muted)] flex items-center gap-1.5">
        <EnZh en="LLM" zh="LLM" />
        <select
          className="rounded-md border border-[var(--line)] px-2 py-1.5 text-xs bg-white min-w-[10rem]"
          value={selected}
          disabled={disabled || busy}
          onChange={(e) => apply(e.target.value)}
          data-testid={`${testId}-select`}
        >
          {options.map((p) => (
            <option key={p.id} value={p.id} disabled={!p.configured}>
              {p.label}
              {p.configured ? "" : " (no key)"}
            </option>
          ))}
        </select>
      </label>
      {err ? <span className="text-xs text-rose-700">{err}</span> : null}
    </div>
  );
}
