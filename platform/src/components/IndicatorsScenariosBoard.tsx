"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useUiLocale } from "@/hooks/useUiLocale";
import { EnZh } from "@/components/EnZh";
import { Badge } from "@/components/ui";
import type {
  IndicatorCatalogRow,
  ScenarioCatalogRow,
} from "@/lib/docs/indicators-scenarios";
import type { forexDemoPack } from "@/lib/docs/indicators-scenarios";
import { CHAIN_ZH } from "@/lib/ai/skill-zh";

type ForexPack = ReturnType<typeof forexDemoPack>;
type SkillRow = { code: string; name: string; monitor_id: string; related: string[]; owner_department: string };
type LinkedRow = { code: string; name: string; monitors: string[] };

type Tab = "forex" | "indicators" | "scenarios" | "skills" | "handbook";

export function IndicatorsScenariosBoard({
  forex,
  indicators,
  scenarios,
  skills,
  linked,
  handbookHtmlEn,
  handbookHtmlZh,
}: {
  forex: ForexPack;
  indicators: IndicatorCatalogRow[];
  scenarios: ScenarioCatalogRow[];
  skills: SkillRow[];
  linked: LinkedRow[];
  handbookHtmlEn?: string;
  handbookHtmlZh?: string;
}) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [tab, setTab] = useState<Tab>("forex");
  const [q, setQ] = useState("");
  const [audience, setAudience] = useState<"all" | "admin" | "pricing" | "dealing">("all");

  const filteredIndicators = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return indicators.filter((r) => {
      if (audience === "pricing" && !(r.owner_bu === "pricing" || r.owner_bu === "shared" || r.in_forex_demo)) {
        return false;
      }
      if (audience === "dealing" && !(r.owner_bu === "dealing" || r.owner_bu === "shared" || r.in_forex_demo)) {
        return false;
      }
      if (audience === "admin" && r.owner_bu === "shared" && !r.in_forex_demo) {
        /* admin sees everything — keep */
      }
      if (!needle) return true;
      return `${r.monitor_id} ${r.name} ${r.domain_code} ${r.description}`.toLowerCase().includes(needle);
    });
  }, [indicators, q, audience]);

  const filteredScenarios = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return scenarios.filter((s) => {
      if (audience !== "all" && !s.audience.includes(audience)) return false;
      if (!needle) return true;
      return `${s.code} ${s.name_en} ${s.name_zh} ${s.domain_code} ${s.how_en}`.toLowerCase().includes(needle);
    });
  }, [scenarios, q, audience]);

  const tabs: Array<{ id: Tab; en: string; zh: string }> = [
    { id: "forex", en: "Forex demo INC-1028", zh: "外匯示範 INC-1028" },
    { id: "indicators", en: "Indicators", zh: "指標" },
    { id: "scenarios", en: "Domain scenarios", zh: "領域情境" },
    { id: "skills", en: "Skills / linked", zh: "技能／連結鏈" },
    { id: "handbook", en: "Full handbook", zh: "完整手冊" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`btn ${tab === t.id ? "btn-primary" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {zh ? t.zh : t.en}
          </button>
        ))}
      </div>

      {tab !== "forex" && tab !== "handbook" ? (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="input text-sm min-w-[12rem] flex-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={zh ? "搜尋代碼／名稱…" : "Search code / name…"}
          />
          {(["all", "admin", "pricing", "dealing"] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={`btn btn-sm ${audience === a ? "btn-primary" : ""}`}
              onClick={() => setAudience(a)}
            >
              {a === "all"
                ? zh
                  ? "全部"
                  : "All"
                : a === "admin"
                  ? zh
                    ? "管理"
                    : "Admin"
                  : a === "pricing"
                    ? zh
                      ? "定價"
                      : "Pricing"
                    : zh
                      ? "交易／Dealing"
                      : "Dealing"}
            </button>
          ))}
        </div>
      ) : null}

      {tab === "forex" ? (
        <section className="panel p-4 space-y-3 border-teal-200 bg-teal-50/50">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-lg font-mono">{forex.incident_id}</h2>
              <p className="text-sm mt-1">{zh ? forex.title_zh : forex.title_en}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {forex.lp} · {forex.symbol} · {forex.severity}{" "}
                {zh ? forex.severity_label_zh : forex.severity_label} · {forex.desk}
              </p>
            </div>
            <Badge className="bg-teal-100 text-teal-900 border-teal-200">
              <EnZh en="Canonical forex CFD use-case" zh="標準外匯 CFD 用例" />
            </Badge>
          </div>
          <p className="text-sm">{zh ? forex.summary_zh : forex.summary_en}</p>
          <div className="text-xs">
            <div className="font-semibold mb-1">
              <EnZh en="Seeded Monitor 2.0 hooks" zh="種子 Monitor 2.0 掛鉤" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {forex.monitors.map((m) => (
                <Link key={m} className="btn btn-sm" href={`/admin/monitor-2?monitor_id=${m}`}>
                  {m}
                </Link>
              ))}
            </div>
          </div>
          <div className="text-xs">
            <div className="font-semibold mb-1">
              <EnZh en="L1 → L2" zh="L1 → L2" />
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {forex.l1.map((l) => (
                <li key={l.code}>
                  {l.code} ({l.severity}) → {l.monitor_id}
                </li>
              ))}
              <li>
                L2 {forex.l2.code} ({forex.l2.severity})
              </li>
            </ul>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            <div className="panel p-2 bg-white">
              <div className="font-semibold">
                <EnZh en="Admin" zh="管理" />
              </div>
              <p className="text-[var(--muted)] mt-1">
                {zh ? forex.bu_roles.admin.zh : forex.bu_roles.admin.en}
              </p>
            </div>
            <div className="panel p-2 bg-white">
              <div className="font-semibold">
                <EnZh en="Pricing" zh="定價" />
              </div>
              <p className="text-[var(--muted)] mt-1">
                {zh ? forex.bu_roles.pricing.zh : forex.bu_roles.pricing.en}
              </p>
            </div>
            <div className="panel p-2 bg-white">
              <div className="font-semibold">
                <EnZh en="Dealing" zh="交易" />
              </div>
              <p className="text-[var(--muted)] mt-1">
                {zh ? forex.bu_roles.dealing.zh : forex.bu_roles.dealing.en}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {forex.links.map((l) => (
              <Link key={l.href} className="btn btn-sm" href={l.href}>
                {zh ? l.zh : l.en}
              </Link>
            ))}
          </div>
          {forex.companions?.length ? (
            <div className="text-xs border-t border-teal-200/80 pt-3 mt-1">
              <div className="font-semibold mb-1.5">
                <EnZh en="Companion cases (same LP/XAU book)" zh="伴隨案例（同一 LP／XAU 帳簿）" />
              </div>
              <ul className="space-y-1.5">
                {forex.companions.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <Link className="font-mono underline text-teal-800" href={c.href}>
                      {c.id}
                    </Link>
                    <span>{zh ? c.title_zh : c.title_en}</span>
                    <span className="text-[var(--muted)] font-mono">{c.chain_code}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "indicators" ? (
        <div className="panel overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left border-b border-[var(--border)] text-[var(--muted)]">
                <th className="p-2">ID</th>
                <th className="p-2">{zh ? "名稱" : "Name"}</th>
                <th className="p-2">{zh ? "領域" : "Domain"}</th>
                <th className="p-2">{zh ? "門檻" : "Thresholds"}</th>
                <th className="p-2">{zh ? "BU" : "BU"}</th>
                <th className="p-2">{zh ? "頻率" : "Cadence"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredIndicators.map((r) => (
                <tr key={r.monitor_id} className="border-b border-[var(--border)]/60 align-top">
                  <td className="p-2 font-mono whitespace-nowrap">
                    <Link className="underline text-teal-800" href={`/admin/monitor-2?monitor_id=${r.monitor_id}`}>
                      {r.monitor_id}
                    </Link>
                    {r.in_forex_demo ? (
                      <div className="text-[10px] text-teal-700 mt-0.5">INC-1028</div>
                    ) : null}
                  </td>
                  <td className="p-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-[var(--muted)] mt-0.5 max-w-md">{r.description}</div>
                  </td>
                  <td className="p-2 font-mono">{r.domain_code}</td>
                  <td className="p-2 font-mono whitespace-nowrap">
                    {r.threshold_warn}/{r.threshold_breach} {r.unit}
                    <div className="text-[var(--muted)]">last {r.last_value ?? "—"}</div>
                  </td>
                  <td className="p-2">{r.owner_bu}</td>
                  <td className="p-2">{zh ? r.frequency_zh : r.frequency_en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "scenarios" ? (
        <div className="space-y-2">
          {filteredScenarios.map((s) => (
            <article key={s.code} className="panel p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-sm">
                  <span className="font-mono text-[var(--muted)] mr-2">{s.code}</span>
                  {zh ? s.name_zh : s.name_en}
                </h3>
                <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  P{s.priority} · {s.domain_code} · {s.audience.join("/")}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">{zh ? s.how_zh : s.how_en}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[...s.primary_indicators, ...s.related_indicators].map((m) => (
                  <Link key={m} className="btn btn-sm" href={`/admin/monitor-2?monitor_id=${m}`}>
                    {m}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "skills" ? (
        <div className="grid lg:grid-cols-2 gap-3">
          <section className="panel p-3">
            <h3 className="font-semibold text-sm mb-2">
              <EnZh en="Skill playbooks" zh="技能劇本" /> ({skills.length})
            </h3>
            <ul className="space-y-2 max-h-[32rem] overflow-auto text-xs">
              {skills.map((s) => (
                <li key={s.code} className="border-b border-[var(--border)]/50 pb-2">
                  <Link className="font-mono text-teal-800 underline" href={`/admin/skills/${s.code}`}>
                    {s.code}
                  </Link>
                  <div className="font-medium mt-0.5">{s.name}</div>
                  <div className="text-[var(--muted)]">
                    {s.monitor_id} · {s.owner_department}
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel p-3">
            <h3 className="font-semibold text-sm mb-2">
              <EnZh en="Linked timelines" zh="連結時間鏈" /> ({linked.length})
            </h3>
            <ul className="space-y-2 max-h-[32rem] overflow-auto text-xs">
              {linked.map((s) => (
                <li key={s.code} className="border-b border-[var(--border)]/50 pb-2">
                  <div className="font-mono text-[var(--muted)]">{s.code}</div>
                  <div className="font-medium mt-0.5">
                    {zh ? CHAIN_ZH[s.code]?.name || s.name : s.name}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.monitors.map((m) => (
                      <span key={m} className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === "handbook" ? (
        <article
          className="panel p-4 sm:p-6 prose prose-sm max-w-none overflow-x-auto"
          data-testid="indicators-scenarios-handbook"
          dangerouslySetInnerHTML={{
            __html: (zh ? handbookHtmlZh : handbookHtmlEn) || "<p>—</p>",
          }}
        />
      ) : null}
    </div>
  );
}
