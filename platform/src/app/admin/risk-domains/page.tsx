import { getDb } from "@/lib/db";
import { DeptBadge, Badge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { MonitorCode } from "@/components/MonitorCode";
import { T } from "@/components/T";
import { Phrase } from "@/components/Phrase";
import { EnZh } from "@/components/EnZh";
import { cn } from "@/lib/utils";
import {
  DOMAIN_SCENARIOS,
  priorityTone,
  scenariosForDomain,
  type DomainScenario,
} from "@/lib/ai/risk-domain-scenarios";

type Domain = {
  id: number;
  code: string;
  name: string;
  description: string;
  owner_department: string;
  supporting_departments_json: string;
  product_coverage: string;
  priority: number;
  status: string;
};

type IndicatorRow = {
  monitor_id: string;
  name: string;
  domain_code: string;
  status: string;
  threshold_warn: number | null;
  threshold_breach: number | null;
  unit: string | null;
  last_value: number | null;
};

function inCfd(coverage: string) {
  const v = coverage.toLowerCase();
  return v.includes("cfd") || v === "platform";
}

function inExchange(coverage: string) {
  const v = coverage.toLowerCase();
  return v.includes("crypto") || v === "platform";
}

function PriorityPill({ priority }: { priority: number }) {
  const tone = priorityTone(priority);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
        tone.className
      )}
    >
      {tone.label}
    </span>
  );
}

function ScenarioCard({
  scenario,
  indicators,
}: {
  scenario: DomainScenario;
  indicators: Map<string, IndicatorRow>;
}) {
  return (
    <details className="group rounded-xl border border-black/10 bg-white/90 open:shadow-sm">
      <summary className="cursor-pointer list-none px-3 py-2.5 flex items-start gap-2">
        <PriorityPill priority={scenario.priority} />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm leading-snug">
            <EnZh en={scenario.name.en} zh={scenario.name.zh} />
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {scenario.primary_indicators.map((id) => {
              const meta = indicators.get(id);
              return (
                <MonitorCode
                  key={id}
                  id={id}
                  name={meta?.name}
                  unit={meta?.unit}
                  status={meta?.status}
                  tone="status"
                />
              );
            })}
          </div>
        </div>
        <span className="text-xs text-[var(--muted)] group-open:hidden shrink-0">
          <EnZh en="Details" zh="詳情" />
        </span>
      </summary>
      <div className="border-t border-black/5 px-3 py-3 space-y-3 text-sm">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <EnZh en="How it works" zh="運作方式" />
          </div>
          <p className="mt-1 text-[var(--foreground)]/90 leading-relaxed">
            <EnZh en={scenario.how_it_works.en} zh={scenario.how_it_works.zh} />
          </p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <EnZh en="Participants" zh="參與者" />
          </div>
          <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[var(--foreground)]/90">
            {scenario.participants.map((p) => (
              <li key={p.en}>
                <EnZh en={p.en} zh={p.zh} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <EnZh en="Impacts" zh="影響" />
          </div>
          <p className="mt-1 text-[var(--foreground)]/90 leading-relaxed">
            <EnZh en={scenario.impacts.en} zh={scenario.impacts.zh} />
          </p>
        </div>
        {scenario.related_indicators.length > 0 ? (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              <EnZh en="Related Monitor 2.0 indicators" zh="相關 Monitor 2.0 指標" />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {scenario.related_indicators.map((id) => {
                const meta = indicators.get(id);
                return (
                  <MonitorCode
                    key={id}
                    id={id}
                    name={meta?.name}
                    unit={meta?.unit}
                    status={meta?.status}
                    tone="status"
                  />
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="text-[11px] text-[var(--muted)]">
          <EnZh en="Product" zh="產品" />: <Phrase>{scenario.product}</Phrase>
          {" · "}
          <EnZh en="Scenario" zh="情境" />: <span className="font-mono">{scenario.code}</span>
        </div>
      </div>
    </details>
  );
}

function DomainCard({
  d,
  tone,
  scenarios,
  indicators,
}: {
  d: Domain;
  tone: "cfd" | "ex";
  scenarios: DomainScenario[];
  indicators: Map<string, IndicatorRow>;
}) {
  const supporting = JSON.parse(d.supporting_departments_json) as string[];
  const domainIndicators = [...indicators.values()].filter((i) => i.domain_code === d.code);

  return (
    <article
      className={cn(
        "rounded-2xl border p-4 bg-white/80",
        tone === "cfd" ? "border-teal-200" : "border-violet-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityPill priority={d.priority} />
            <span className="text-xs text-[var(--muted)]">
              <Phrase>{d.code}</Phrase>
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              {scenarios.length}{" "}
              <EnZh en="scenarios" zh="則情境" />
            </span>
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg mt-0.5">
            <Phrase>{d.name}</Phrase>
          </h3>
        </div>
        <Badge
          className={
            tone === "cfd"
              ? "bg-teal-50 text-teal-900 border-teal-200"
              : "bg-violet-50 text-violet-900 border-violet-200"
          }
        >
          <Phrase>{d.product_coverage}</Phrase>
        </Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        <Phrase>{d.description}</Phrase>
      </p>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-[var(--muted)]">
          <T k="common.owner" />
        </span>
        <DeptBadge code={d.owner_department} />
        <span className="text-xs text-[var(--muted)] ml-2">
          <T k="common.supporting" />
        </span>
        {supporting.map((s) => (
          <DeptBadge key={s} code={s} />
        ))}
      </div>

      {domainIndicators.length > 0 ? (
        <div className="mt-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
            <EnZh en="Owned Monitor 2.0 indicators" zh="所屬 Monitor 2.0 指標" />
          </div>
          <div className="flex flex-wrap gap-1">
            {domainIndicators.map((i) => (
              <MonitorCode
                key={i.monitor_id}
                id={i.monitor_id}
                name={i.name}
                unit={i.unit}
                status={i.status}
                tone="status"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          <EnZh en="Detailed risk scenarios" zh="詳細風險情境" />
        </div>
        {scenarios.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">
            <EnZh en="No scenarios mapped yet." zh="尚未對應情境。" />
          </p>
        ) : (
          scenarios.map((s) => (
            <ScenarioCard key={s.code} scenario={s} indicators={indicators} />
          ))
        )}
      </div>
    </article>
  );
}

function Sphere({
  tone,
  titleEn,
  titleZh,
  hintEn,
  hintZh,
  domains,
  indicators,
}: {
  tone: "cfd" | "ex";
  titleEn: string;
  titleZh: string;
  hintEn: string;
  hintZh: string;
  domains: Domain[];
  indicators: Map<string, IndicatorRow>;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border p-4 sm:p-5",
        tone === "cfd"
          ? "border-teal-200 bg-gradient-to-br from-teal-50 via-white to-white"
          : "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-40 blur-2xl",
          tone === "cfd" ? "bg-teal-300" : "bg-violet-300"
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.14em]",
              tone === "cfd" ? "text-teal-800" : "text-violet-800"
            )}
          >
            <EnZh en={tone === "cfd" ? "Sphere 1" : "Sphere 2"} zh={tone === "cfd" ? "第一圈" : "第二圈"} />
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl mt-1">
            <EnZh en={titleEn} zh={titleZh} />
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            <EnZh en={hintEn} zh={hintZh} />
          </p>
        </div>
        <span
          className={cn(
            "hidden sm:inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
            tone === "cfd" ? "bg-teal-600" : "bg-violet-600"
          )}
        >
          {domains.length}
        </span>
      </div>
      <div className="relative mt-4 space-y-3">
        {domains.map((d) => (
          <DomainCard
            key={`${tone}-${d.id}`}
            d={d}
            tone={tone}
            scenarios={scenariosForDomain(d.code)}
            indicators={indicators}
          />
        ))}
      </div>
    </section>
  );
}

function Legend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[var(--muted)]">
        <EnZh en="Priority colours" zh="優先級顏色" />:
      </span>
      {[0, 1, 2, 3].map((p) => (
        <PriorityPill key={p} priority={p} />
      ))}
      <span className="text-[var(--muted)] ml-2">
        <EnZh
          en={`${DOMAIN_SCENARIOS.length} scenarios · each linked to Monitor 2.0`}
          zh={`${DOMAIN_SCENARIOS.length} 則情境 · 皆對應 Monitor 2.0 指標`}
        />
      </span>
    </div>
  );
}

export default function RiskDomainsPage() {
  const db = getDb();
  const domains = db.prepare(`SELECT * FROM risk_domains ORDER BY priority, name`).all() as Domain[];
  const indicatorRows = db
    .prepare(
      `SELECT monitor_id, name, domain_code, status, threshold_warn, threshold_breach, unit, last_value
       FROM monitor_indicators ORDER BY monitor_id`
    )
    .all() as IndicatorRow[];
  const indicators = new Map(indicatorRows.map((r) => [r.monitor_id, r]));

  const cfd = domains.filter((d) => inCfd(d.product_coverage));
  const exchange = domains.filter((d) => inExchange(d.product_coverage));

  return (
    <div>
      <AdminPageHeader pageKey="risk-domains" />
      <Legend />
      <div className="grid lg:grid-cols-2 gap-4">
        <Sphere
          tone="cfd"
          titleEn="CFD"
          titleZh="CFD"
          hintEn="OTC book: pricing, credit, hedge, product conditions and ops that sit on the CFD stack — broken into concrete scenarios with Monitor hooks."
          hintZh="OTC 帳簿：定價、信貸、對沖、商品條件與坐落在 CFD 堆疊的營運 — 拆成具體情境並掛上 Monitor 指標。"
          domains={cfd}
          indicators={indicators}
        />
        <Sphere
          tone="ex"
          titleEn="Exchange"
          titleZh="交易所"
          hintEn="Crypto matching, wallets, liquidations and the shared domains that also hit the exchange — each scenario lists its Monitor 2.0 indicators."
          hintZh="加密撮合、錢包、強平，以及同樣打到交易所的共用領域 — 每則情境列出其 Monitor 2.0 指標。"
          domains={exchange}
          indicators={indicators}
        />
      </div>
    </div>
  );
}
