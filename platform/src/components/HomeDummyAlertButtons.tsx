"use client";

import { useState } from "react";
import { FlaskConical, Layers } from "lucide-react";
import { useT } from "@/hooks/useUiLocale";
import { bumpNavBadge } from "@/lib/nav-badges";

type DummyRun = { alert_id?: string; analysis_mode?: string | null; ticket_id?: string };

export function HomeDummyAlertButtons() {
  const { t, phrase } = useT();
  const [busy, setBusy] = useState<"single" | "group" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(mode: "single" | "group") {
    if (busy) return;
    setBusy(mode);
    setMsg(t("home.dummyWorking"));
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dummy_spine", mode }),
      });
      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        setMsg(t("ai.badResponse", { status: res.status }));
        return;
      }
      if (!res.ok) {
        const err = String(data.error || "");
        setMsg(err ? phrase(err) : t("home.dummyFailed"));
        return;
      }
      const runs = (Array.isArray(data.runs) ? data.runs : []) as DummyRun[];
      const ids = runs.map((r) => r.alert_id).filter(Boolean) as string[];
      setMsg(t("home.dummyDone", { n: ids.length || Number(runs.length) || 1 }));
      bumpNavBadge("/admin/alerts", ids.length || 1);
      bumpNavBadge("/admin/messenger", ids.length || 1);
      bumpNavBadge("/admin/risk-log", ids.length || 1);
      bumpNavBadge("/admin/audit", ids.length || 1);
      const qs = new URLSearchParams();
      if (ids.length) qs.set("dummy", ids.join(","));
      const hash = ids[0] ? `#home-${ids[0]}` : "";
      window.location.assign(qs.toString() ? `/admin?${qs.toString()}${hash}` : `/admin${hash}`);
    } catch (e) {
      setMsg(e instanceof Error && e.message ? phrase(e.message) : t("home.dummyFailed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel p-3 sm:p-4 mt-4" data-testid="home-dummy-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-teal-700" aria-hidden />
            {t("home.dummyTitle")}
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl">{t("home.dummyHint")}</p>
        </div>
        <div className="action-row shrink-0">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="home-dummy-alert"
            disabled={!!busy}
            onClick={() => run("single")}
          >
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            {busy === "single" ? t("home.dummyWorking") : t("home.dummyOne")}
          </button>
          <button
            type="button"
            className="btn"
            data-testid="home-dummy-group"
            disabled={!!busy}
            onClick={() => run("group")}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {busy === "group" ? t("home.dummyWorking") : t("home.dummyGroup")}
          </button>
        </div>
      </div>
      {msg ? (
        <div
          role="status"
          data-testid="home-dummy-status"
          className="mt-3 text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2"
        >
          {busy ? `${msg}…` : msg}
        </div>
      ) : null}
    </section>
  );
}
