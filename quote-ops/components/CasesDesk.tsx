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
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    try {
      const [casesRes, meRes] = await Promise.all([fetch("/api/cases"), fetch("/api/me")]);
      if (!casesRes.ok) throw new Error(`HTTP ${casesRes.status}`);
      const data = (await casesRes.json()) as InvestigationCase[];
      setCases(data);
      const me = (await meRes.json()) as { isAdmin?: boolean };
      setIsAdmin(!!me.isAdmin);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!isAdmin || !title.trim()) return;
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, symbol, severity: "P1" }),
    });
    if (res.ok) {
      setTitle("");
      await load();
    } else {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setError(data.message || `HTTP ${res.status}`);
    }
  }

  async function setStatus(id: string, status: InvestigationCase["status"]) {
    if (!isAdmin) return;
    const res = await fetch("/api/cases", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setError(data.message || `HTTP ${res.status}`);
      return;
    }
    await load();
  }

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <h1 className="font-display text-3xl text-ink">{t("排查案件", "Investigation cases")}</h1>
        <p className="mt-2 text-sm text-mist">
          {isAdmin
            ? t(
                "管理员可新建与更新排查案件；其他角色只读。",
                "Admins can create and update cases; other roles are read-only.",
              )
            : t(
                "只读模式：可查看案件列表，新建与状态变更仅管理员可用。",
                "Read-only: browse cases; create and status changes are admin-only.",
              )}
        </p>
      </header>

      {isAdmin ? (
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
      ) : (
        <p className="rounded-xl border border-line bg-paper px-4 py-3 text-xs text-mist">
          {t("当前为只读访客", "You are a read-only viewer")}
        </p>
      )}

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
              {isAdmin && (
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
              )}
            </div>
          </li>
        ))}
        {cases.length === 0 && (
          <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-mist">
            {t("暂无案件", "No cases yet")}
          </li>
        )}
      </ul>
    </div>
  );
}
