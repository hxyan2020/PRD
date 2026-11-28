"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  /** Resolve markdown via KB API (id or slug). */
  nodeKey?: string;
  /** Or supply markdown directly / lazily. */
  getMarkdown?: () => string | Promise<string>;
  /** Label shown in the expanded panel header. */
  label?: string;
  /** When true, expand control is emphasized for admins. */
  isAdmin?: boolean;
};

export function AgentDocBar({ nodeKey, getMarkdown, label = "agent.md", isAdmin }: Props) {
  const { locale, t } = useI18n();
  const [show, setShow] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async () => {
    if (getMarkdown) return await getMarkdown();
    if (!nodeKey) throw new Error("missing node");
    const res = await fetch(
      `/api/kb/${encodeURIComponent(nodeKey)}?markdown=1&locale=${locale === "en" ? "en" : "zh-CN"}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { markdown: string };
    return data.markdown;
  }, [getMarkdown, locale, nodeKey]);

  async function ensureMd() {
    setBusy(true);
    setError(null);
    try {
      const text = await resolve();
      setMarkdown(text);
      return text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "failed";
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function expand() {
    try {
      await ensureMd();
      setShow(true);
    } catch {
      /* shown via error */
    }
  }

  async function copy() {
    try {
      const text = markdown || (await ensureMd());
      await navigator.clipboard.writeText(text);
      setShow(true);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* shown via error */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void expand()}
          className={
            isAdmin
              ? "rounded-lg border border-sea/40 bg-sea-soft/40 px-3 py-2 text-xs font-medium text-ink"
              : "rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink"
          }
        >
          {busy && !show
            ? t("加载中…", "Loading…")
            : t("展开 Agent 可读 Markdown", "Expand agent Markdown")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void copy()}
          className="rounded-lg bg-ink px-3 py-2 text-xs text-paper"
        >
          {copied ? t("已复制", "Copied") : t("一键复制 Markdown", "Copy Markdown")}
        </button>
        {show && (
          <button
            type="button"
            className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-mist"
            onClick={() => setShow(false)}
          >
            {t("收起", "Collapse")}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {show && (
        <div className="rounded-xl border border-ink/20 bg-ink p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-paper/60">
            <span>{label}</span>
            <button
              type="button"
              className="text-sea-soft"
              onClick={() => void copy()}
            >
              {copied ? t("已复制", "Copied") : t("复制", "Copy")}
            </button>
          </div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-sea-soft">
            {markdown}
          </pre>
        </div>
      )}
    </div>
  );
}
