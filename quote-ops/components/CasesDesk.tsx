"use client";

import { useCallback, useEffect, useState } from "react";
import { SeverityBadge } from "@/components/ClassBadge";
import type { InvestigationCase } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

export function CasesDesk() {
  const { t } = useI18n();
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [symbol, setSymbol] = useState("XAUUSD");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cases");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as InvestigationCase[];
      setCases(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!title.trim()) return;
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, symbol, severity: "P1" }),
    });
    if (res.ok) {
      setTitle("");
      await load();
    }
  }

  async function setStatus(id: string, status: InvestigationCase["status"]) {
    await fetch("/api/cases", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <h1 className="font-display text-3xl text-ink">{t("排查案件", "Investigation cases")}</h1>
        <p className="mt-2 text-sm text-mist">
          {t(
            "本地/发布环境可持久化的排查案件（PGlite 或 Postgres）。用于跟进 RCA。",
            "Persisted investigation cases (PGlite or Postgres) for RCA follow-up.",
          )}
        </p>
      </header>

      <form
        className="flex flex-wrap gap-2 rounded-xl border border-line bg-white/80 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("案件标题，例如：XAUUSD 旧价簇", "Case title e.g. XAUUSD stale cluster")}
          className="min-w-[200px] flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-28 rounded-lg border border-line px-3 py-2 font-mono text-sm"
        />
        <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm text-paper">
          {t("新建", "Create")}
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <ul className="space-y-3">
        {cases.map((c) => (
          <li key={c.id} className="rounded-xl border border-line bg-white/85 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-ink">{c.title}</h2>
                  <SeverityBadge s={c.severity} />
                </div>
                <p className="mt-1 font-mono text-xs text-mist">
                  {c.id} · {c.symbol || "—"} · {c.status}
                </p>
                {c.notes && <p className="mt-2 text-sm text-ink-2">{c.notes}</p>}
              </div>
              <div className="flex gap-1">
                {(["open", "monitoring", "resolved"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => void setStatus(c.id, st)}
                    className={`rounded border px-2 py-1 text-[11px] ${
                      c.status === st ? "border-ink bg-ink text-paper" : "border-line text-mist"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
        {cases.length === 0 && (
          <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-mist">
            {t("暂无案件。可从 Skill 页一键创建。", "No cases yet. Create from a Skill page.")}
          </li>
        )}
      </ul>
    </div>
  );
}
