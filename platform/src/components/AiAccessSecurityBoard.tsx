"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, SeverityBadge, StatCard } from "@/components/ui";
import type { AiBlockItem, BlockCategory } from "@/lib/security/ai-access-blocklist";
import { useT } from "@/hooks/useUiLocale";

export function AiAccessSecurityBoard({
  items,
  allowed,
  forbiddenPermissions,
  stats,
}: {
  items: AiBlockItem[];
  allowed: Array<{ name: string; target: string; permission: string }>;
  forbiddenPermissions: string[];
  stats: {
    total: number;
    pages: number;
    functions: number;
    fields: number;
    data: number;
    critical: number;
    high: number;
    medium: number;
  };
}) {
  const [cat, setCat] = useState<BlockCategory | "ALL">("ALL");
  const { t, phrase } = useT();
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM">("ALL");

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (cat !== "ALL" && i.category !== cat) return false;
      if (sev !== "ALL" && i.severity !== sev) return false;
      if (!q) return true;
      const hay = `${i.id} ${i.name} ${i.target} ${i.reason} ${i.human_roles.join(" ")}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [items, cat, q, sev]);

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{t("sec.policy")}</div>
        <p className="text-sm mt-1 max-w-4xl">{t("sec.intro")}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge className="bg-rose-50 text-rose-900 border-rose-200">{t("sec.aiBlocked")}</Badge>
          <Badge className="bg-amber-50 text-amber-900 border-amber-200">{t("sec.humanOnly")}</Badge>
          <Badge className="bg-teal-50 text-teal-900 border-teal-200">{t("sec.makerChecker")}</Badge>
          <Link className="underline" href="/admin/roles">
            Roles & permissions
          </Link>
          <Link className="underline" href="/admin/ai-admin">
            AI Admin
          </Link>
          <Link className="underline" href="/admin/docs/tsd">
            TSD
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label={t("sec.blockedItems")} value={stats.total} hint={`${stats.critical} CRITICAL`} />
        <StatCard label={t("sec.pages")} value={stats.pages} hint={t("sec.functions", { n: stats.functions })} />
        <StatCard label={t("sec.fields")} value={stats.fields} hint={t("sec.dataStores", { n: stats.data })} />
        <StatCard label={t("sec.highPlus")} value={stats.critical + stats.high} hint={`${stats.medium} MEDIUM`} />
      </div>

      <div className="panel p-3 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">{t("common.search")}</label>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("sec.searchPh")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PAGE", "FUNCTION", "FIELD", "DATA"] as const).map((c) => (
            <button key={c} type="button" className={`btn ${cat === c ? "btn-primary" : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM"] as const).map((s) => (
            <button key={s} type="button" className={`btn ${sev === s ? "btn-primary" : ""}`} onClick={() => setSev(s)}>
              {s === "ALL" ? t("common.all") : t(`uat.${s.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((i) => (
          <article key={i.id} className="panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-xs text-[var(--muted)]">
                  {i.id} · {phrase(i.category)}
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-lg">{phrase(i.name)}</h3>
                <code className="text-xs text-[var(--muted)] break-all">{i.target}</code>
              </div>
              <div className="flex flex-wrap gap-2">
                <SeverityBadge value={i.severity} />
                <Badge className="bg-rose-50 text-rose-900 border-rose-200">{t("sec.aiMay", { may: i.ai_may })}</Badge>
              </div>
            </div>
            <p className="text-sm mt-2">{phrase(i.reason)}</p>
            <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase text-[var(--muted)]">{t("sec.roles")}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {i.human_roles.map((r) => (
                    <Badge key={r} className="bg-slate-100 text-slate-700 border-slate-200">
                      {phrase(r)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-[var(--muted)]">{t("sec.perms")}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {i.required_permissions.map((p) => (
                    <Badge key={p} className="bg-orange-50 text-orange-900 border-orange-200">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {i.notes && <p className="text-xs text-[var(--muted)] mt-2">{i.notes}</p>}
          </article>
        ))}
        {!filtered.length && (
          <div className="panel p-6 text-sm text-[var(--muted)]">{t("sec.empty")}</div>
        )}
      </div>

      <div className="panel p-4">
        <h3 className="font-[family-name:var(--font-display)] text-xl">{t("sec.forbidden")}</h3>
        <p className="text-sm text-[var(--muted)] mt-1">{t("sec.forbiddenHint")}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {forbiddenPermissions.map((p) => (
            <Badge key={p} className="bg-rose-50 text-rose-900 border-rose-200">
              {p}
            </Badge>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="font-[family-name:var(--font-display)] text-xl">{t("sec.allow")}</h3>
        <p className="text-sm text-[var(--muted)] mt-1">{t("sec.allowHint")}</p>
        <div className="mt-3 space-y-2">
          {allowed.map((a) => (
            <div key={a.name} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
              <div className="font-semibold">{phrase(a.name)}</div>
              <div className="text-[var(--muted)]">{a.target}</div>
              <Badge className="mt-1 bg-teal-50 text-teal-900 border-teal-200">{a.permission}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
